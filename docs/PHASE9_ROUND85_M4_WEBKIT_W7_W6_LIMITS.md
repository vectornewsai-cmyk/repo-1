# LIMITS — Phase 9 đợt 85, luồng M4: WebKit W7 restart dư + W6 seek chậm

Ngày: 11/11/2026 (lượt cron 06:35 +07). Repo local `~/workspace/repo-1`,
HEAD `5f548ef8`. **CHỈ stage, KHÔNG push, KHÔNG release/tag, KHÔNG binary
vào batch.** (Luồng M4 viết bởi parent từ log luồng
`hidden_files/round85-m4.md` + file trên đĩa — luồng hết lượt trước khi
tự viết LIMITS/stage. Mọi số dưới đây đều đọc từ log đó, không đoán.)

## 0. Kết luận (đọc trước)

1. **W7 — truy xong, KHÔNG sửa production.**
   - **Chromium +1 sau gỡ ghi đè = artifact bắn lặp (ĐÃ CHỨNG MINH):**
     event thứ 2 có wallMs sớm hơn tUnforce 224 ms (`ticksEndedTrue=2`,
     ghi đè vẫn bật) — bắn TRƯỚC khi gỡ, không phải sau gỡ. Sau settle
     1,5 s: phase A 20 s = 0 restart dư. Run 1 đọc nhầm do hook counter
     lag theo rAF dưới tải cao.
   - **WebKit: 0 restart dư** trong P1 (sau gỡ) / P2 (sau reset) / P3
     (phát thường 20 s) / P5 (40 s sau reset, 7 lần seek hạ cánh trong
     cửa sổ, gồm cú nhảy ct 2,967→13,167 — không restart nào bắn).
     Quan sát +1 phase B của L10 (t=9,3 s sau reset) KHÔNG tái hiện
     2 lần → còn là 1 quan sát đơn lẻ chưa tái hiện, không đủ bằng
     chứng để sửa production.
   - Vì không tìm ra nguyên nhân cần sửa → KHÔNG sửa logic restart.
     **W7: nửa Chromium ĐÓNG (artifact), nửa WebKit còn MỞ ở mức "1
     quan sát chưa tái hiện"** (trace đã có sẵn để đợt sau bắt lại
     nếu nó tái hiện).
2. **W6 — đo xong, KHÔNG giữ cách giảm nào (chưa đủ bằng chứng).**
   - Seek trên element thô NHANH: seeked 14–1517 ms (cả GOP 250,
     keyframe 8,33 s) — KHÔNG phải 5–9 s. GOP/duration/resolution/
     codec đều ảnh hưởng nhỏ (VP9 ≈ H.264; 720p ≈ 360p; 60 s ≈ 10 s).
   - Tải 3 CPU: chậm ~3–8× (tối đa 1,7 s). Churn kiểu app (play()
     mỗi tick + drawImage mỗi rAF + gán playbackRate): 0,6–4,1 s
     (trung vị 1,7–3,3 s).
   - Tách churn: **drawImage là thành phần duy nhất gây chậm**
     (~+270 ms/seek, 3–11×); play() riêng và playbackRate riêng
     KHÔNG ảnh hưởng. `all ≈ draw` xác nhận.
   - Giảm thiểu: fastSeek LOẠI (chậm hơn currentTime + sai vị trí);
     keyframe-first LOẠI (chậm hơn plain); pause-seek-play có vẻ
     nhanh hơn về `seeked` (trung vị 11/104 ms vs 193/124 ms) nhưng
     chưa chứng minh được frame sẵn sàng (rVFC không bắn trên
     WebKitGTK 27.2 — 0/36 cửa sổ 21 s) → KHÔNG đổi code. Hướng đợt
     sau: bỏ drawImage element đang seeking, vẽ frame giữ thay thế
     (chưa kiểm chứng trong app).
   - Đóng băng 5–17 s trong app là HỢP CHẤT (draw × tải cao × seek
     tới target đang chạy × có thể audio graph) — chưa tách hết;
     audio graph (MediaElementSource nối vào cả clip video không
     audio — đã xác nhận bằng code) là câu hỏi mở lớn nhất còn lại.
4. **Loop W1 chạy lại: WebKit 50/60 — clip D (720p 4 s, 24 fps)
   0/10, TÁI HIỆN ỔN ĐỊNH, không phải kẹt nhất thời** (xem §5):
   D kẹt ở ct≈0,176–0,19, 5 frame, readyState 4→3→2, trong cả 4 lần
   chạy loop 10 vòng (0/40) + 1 lần no-poll (0 ended trong 12 s),
   trong khi clip đối chứng A chạy 10/10 trong cùng session. File D
   decode sạch bằng ffmpeg (96 frame, 0 lỗi) và **phát thường
   (plain play, không listener) chạy tốt** (ct 3,03 sau 3 s) trên
   cùng engine. Đã loại trừ: race play-trong-lúc-load (chờ canplay /
   canplaythrough vẫn kẹt), vòng poll 100 ms (bỏ poll vẫn kẹt).
   Cơ chế chính xác còn mở (ứng viên: playsInline / listener ended /
   viewport / đói buffer progressive riêng với 720p-24fps trên bộ
   GStreamer vừa cài lại sau reboot — xem §5). A/B/C/E/F vẫn 10/10;
   Chromium 60/60. **W1 cho D: MỞ, cần đợt sau tách tiếp.**
   Môi trường giữa lượt thay đổi: VM reboot 01:22 UTC (xem §5).
3. **MediaRecorder:** không kiểm lại (đúng chỉ đạo: không có tín hiệu
   mới). Lần xác nhận gần nhất: L10 (lần 5, `undefined` trên
   WebKitGTK 27.2). Ghi nhận thêm incidental: diag D đợt này cũng
   thấy `undefined` (lần 6) — không phải lần kiểm lại có chủ đích.

## 1. Trace W7 (mới, đã nối vào production)

- Đã thêm dấu vết mức tick (`apps/web/src/lib/webkitRestartTrace85M4.ts`
  + nối vào `preview.tsx`: snapshot mỗi tick nhánh forward + sự kiện
  mỗi lần restart bắn, kèm tick trước + streak ended + số tick từ lúc
  seek hạ cánh + causeTag; phơi qua `window.__vcutRestartEndedTrace`).
- File chung chạm tới: `apps/web/src/preview.tsx` (chỉ cộng thêm trace
  W7, không đổi logic) + `apps/web/tsconfig.json` (1 dòng exclude test
  mới theo quy ước repo).

## 2. Kiểm chứng

- Unit test `webkitRestartTrace85M4` **10/10 xanh** (mới);
  `webkitLoopRestart80H5` **11/11 xanh** (chạy lại).
- `tsc --noEmit` (apps/web): **0 lỗi** (sau khi thêm test mới vào
  exclude của tsconfig.json theo quy ước repo — 192 entry; lúc đầu
  báo 1 lỗi TS5097).
- `vite build` (apps/web): **PASS** (5,76 s; cảnh báo chunk > 500 kB
  đã có từ trước).
- Harness W7: run 1 (cả 2 engine, có FAIL do WebKit hết clip giữa
  chừng + đọc nhầm +1 Chromium); run 2 (cả 2 engine — Chromium
  P1/P2/P3 PASS + P4 3/3; WebKit P1/P2/P3 PASS, P4 FAIL oan do seek
  kẹt); run 3 v3 (webkit only — KHÔNG FAIL, P1/P2/P3/P5 PASS, P4 3/3
  PASS — nhờ chờ `!seeking` trước khi ép; run 2 P4 FAIL oan 3/3 vì
  ép đúng lúc seek kẹt, guard `!seeking` chặn đúng).
- Probe W6: `webkit_seek_latency_85m4` (WebKit, 8 clip × 3 vị trí +
  GOP A/B + paused + 3 giảm thiểu) + `webkit_seek_load_85m4`
  (tải/churn/rVFC) + `webkit_seek_churn_85m4` (tách thành phần churn).
- Probe loop W1 thô chạy lại (`webkit_loop_full_85m4`, cả 2 engine):
  xem §5 (kết quả đầy đủ + clip D).
- Probe phân biệt clip D: `webkit_loop_d_rerun_85m4`,
  `webkit_loop_d_waitcanplay_85m4`,
  `webkit_loop_d_waitcanplaythrough_85m4`,
  `webkit_loop_d_nopoll_85m4` (xem §5).

## 5. Loop W1 chạy lại + clip D (bổ sung sau khi chạy lại riêng D)

### 5.1 Kết quả loop đầy đủ (`webkit_loop_full_85m4`, tải thấp 0,26–2,4)

Clip encode lại tại `/tmp/m4/clips` (a: 320×180 2 s H.264; b: 640×360
3 s H.264; c: 320×180 2 s VP9; d: 1280×720 4 s H.264 24 fps; e: 640×360
10 s H.264 + audio AAC; f: 320×180 10 s H.264).

| Clip | WebKit workaround 10 vòng | Chromium workaround 10 vòng |
|---|---|---|
| A | 10/10, resume trung vị 165 ms (max 282) | 10/10, 112 ms (max 118) |
| B | 10/10, 182 ms (max 275) | 10/10, 115 ms (max 130) |
| C (VP9) | 10/10, 162 ms (max 177) | 10/10, 113 ms (max 120) |
| **D (720p 24 fps)** | **0/10** — kẹt ct=0,176 suốt 73,61 s, totalFrames 5, seeked 0, ended 0, playErr null | 10/10, 128 ms (max 141) |
| E (+audio) | 10/10, 298 ms (max 907) | 10/10, 155 ms (max 161) |
| F | 10/10, 388 ms (max 814) | 10/10, 113 ms (max 119) |

- **WebKit 50/60; Chromium 60/60.** Resume WebKit nhanh hơn nhiều so
  với L10 dưới tải cao (L10: 569 ms–2,34 s) — phù hợp tải thấp lần này.
- Native `loop=true` (WebKit): W3 vẫn tái hiện — A kẹt ở 0 (wraps 1,
  stuckAtZero), B wraps 1 rồi ct chạy ngược về 0, C đóng băng ở cuối
  (ct=2, không ended), D wraps 3. Chromium native: A/B/C/D wraps 3/2/3/1.
- Biên E1/E2/E3 WebKit: 6/8/11 PASS như L10.

### 5.2 Clip D — chạy lại riêng, đã tách xong (kết luận: tái hiện ổn định)

- **Lần 1 (full loop, ~01:07):** D 0/10 như bảng trên.
- **Lần 2 (chạy lại riêng, ~01:56):** D 0/10 — ct 0,025→0,165→0,178
  rồi đứng yên, readyState 4→3→2, totalFrames 5; clip đối chứng A
  trong cùng session 10/10 (resume trung vị 161 ms). File D đã
  verify decode sạch bằng ffmpeg (96 frame, 4,0 s, 0 lỗi).
- **Phát thường (diag, không listener/playsInline, chờ 8 s rồi play):
  D CHẠY TỐT** — playOk=true, ct=3,03 sau 3 s, readyState 4, không
  lỗi. canPlayType H.264/VP9 = "probably", MSE H.264 = true,
  MediaRecorder vẫn `undefined` (xác nhận lần 6, ghi nhận incidental
  từ diag — không phải kiểm lại theo chỉ đạo), rVFC tồn tại.
- **Đã loại trừ:** chờ `canplay` rồi play → D vẫn 0/10 (ct 0,176,
  5 frame); chờ `canplaythrough` rồi play → vẫn 0/10 (ct 0,19,
  5 frame); bỏ vòng poll 100 ms → vẫn 0 ended trong 12 s (ct 0,187,
  5 frame, rs 2). A đối chứng 10/10 trong cả 3 biến thể
  (resume 170/169 ms; no-poll: 5 ended trong 12 s).
- **Tổng: D 0/40 vòng loop trong đợt 85** (4 lần × 10 vòng) + 0 ended
  trong 12 s no-poll, đối chứng A luôn 10/10 — **không phải kẹt nhất
  thời; so với L10 (D 10/10) là hồi quy-hoặc-đổi-môi-trường, chưa rõ
  nguyên nhân gốc.** Chữ ký kẹt giống hệt nhau mọi lần (ct≈0,176–0,19,
  đúng ~5 frame = frame thứ 4–5 ở 24 fps, readyState tụt 4→2 = hết
  dữ liệu đệm).
- **Còn mở:** tác nhân chính xác chưa tách (ứng viên còn lại:
  `playsInline` / listener `ended` / viewport 1280×800 / đói buffer
  progressive riêng với 720p-24fps). Gợi ý đợt sau: chạy D trong
  setup y hệt diag rồi cộng từng yếu tố (playsInline → listener →
  viewport) để tách; hoặc encode lại D ở 30 fps / GOP khác để xem có
  phải do 24 fps.

### 5.3 Reboot giữa lượt + cài lại dep WebKit (bối cảnh, không phải kết quả M4)

- VM reboot 01:22 UTC (uptime 1 phút lúc 01:23:57). `/tmp` là tmpfs
  nên **toàn bộ clip `/tmp/m4/clips` bị xoá** — đã encode lại đủ 16
  file bằng cùng công thức ffmpeg (xem script probe + log luồng).
- Sau reboot, dep apt của WebKit biến mất hoàn toàn (dpkg không còn
  libgstreamer1.0-0/libgtk-4-1/gstreamer1.0-plugins-good, cache
  `/var/cache/apt/archives/` 0 file) → MiniBrowser không khởi động
  được (`libgstreamer-1.0.so.0: cannot open shared object file`).
  Đã chạy lại `playwright-core/cli.js install-deps webkit` (sudo
  không mật khẩu, ~24 phút — `apt-get update` chậm do sources list
  có 2 mirror trùng nhau azure + cogentco, ~335 MB lists) — xong,
  exit 0: libgstreamer1.0-0 1.24.2, libgtk-4-1 4.14.5,
  gstreamer1.0-plugins-good/bad 1.24.2, gstreamer1.0-libav 1.24.1.
- Bẫy đã gặp và đã chẩn đoán đúng: lần chạy lại D đầu tiên sau
  reinstall báo playErr "The operation is not supported", totalFrames
  0 — nguyên nhân là **clip 404 do /tmp bị xoá** (v.error code 4,
  "R1: Received 404 HTTP error code"), KHÔNG phải WebKit hỏng.
  Sau khi encode lại clip, WebKit chạy bình thường.
- Lưu ý cho đợt sau: **mọi thứ trong /tmp (kể cả clip test) mất sau
  mỗi reboot VM; dep apt của WebKit cũng có thể mất theo** (đây là
  lần thứ 2 hiện tượng này xảy ra sau K9 đợt 83 — L10 đợt 84 thì dep
  còn đủ). Nếu probe WebKit fail khởi động sau reboot, chạy lại
  install-deps webkit trước khi kết luận gì về engine.

## 3. Ghi chú gộp

- tsc lúc đầu báo lỗi MediaBin.tsx (10 lỗi, do luồng proxy đang sửa
  dở) — đã tự hết ở lần chạy sau; không phải do M4. (Xung đột giữa
  các luồng song song: M8 sửa MediaBin.tsx cùng lúc.)
- Load VM trong lượt biến động mạnh (0,5–32) do các luồng đợt 85 chạy
  song song; mọi số timing tuyệt đối mang caveat đó.
- Bằng chứng headed (không stage, ở hidden_files):
  `hidden_files/round85-m4/headed/` (m4-webkit-w7-report.json +
  m4-run.log + screenshots m4-{webkit,chromium}-{p1,p2,p3,p5}.png).
- Không stage: clip mp4/webm trong /tmp/m4/clips (tạo lại bằng ffmpeg
  khi cần).
- Không sửa production ngoài preview.tsx + tsconfig.json (exclude
  test). Không binary. Không workflow.

## 4. Nợ còn lại / giới hạn

1. **W7 nửa WebKit còn MỞ** — 1 quan sát +1 phase B của L10 chưa tái
   hiện; trace đã có sẵn để đợt sau bắt lại nếu nó tái hiện.
2. **Loop W1 clip D còn MỞ** — 0/40 vòng đợt 85, file sạch, phát
   thường chạy tốt, đã loại trừ race play / vòng poll; cần đợt sau
   tách tiếp theo gợi ý §5.2 (cộng từng yếu tố diag → loop, hoặc
   encode D 30 fps / GOP khác).
3. **W6:** hướng đợt sau — bỏ drawImage element đang seeking, vẽ
   frame giữ thay thế (chưa kiểm chứng trong app); audio graph
   (MediaElementSource nối vào cả clip video không audio) là câu hỏi
   mở lớn nhất còn lại.
3. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.

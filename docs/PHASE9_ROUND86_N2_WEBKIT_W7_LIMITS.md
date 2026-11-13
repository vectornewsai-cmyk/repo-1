# LIMITS — Phase 9 đợt 86, luồng N2: WebKit W7 nửa WebKit — truy +1 restart dư (tái hiện hoặc bác bỏ)

Ngày: 11/11/2026 (lượt cron 09:35 +07). Repo local `~/workspace/repo-1`,
HEAD theo hồ sơ `5f548ef8` (không verify được bằng git trên VM này —
thư mục `.git` không có trong `~/workspace/repo-1`, xem §6).
**CHỈ stage, KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch,
KHÔNG file .github/workflows.** Không kiểm lại TTS 39. Không thêm
i18n key.

## 0. Kết luận (đọc trước)

1. **W7 nửa WebKit: ĐÓNG ở mức quan sát — KHÔNG tái hiện sau 5 lần
   chạy độc lập, KHÔNG sửa production.**
   - N2 chạy 3 lần độc lập bằng trace tick đã có
     (`webkitRestartTrace85M4`, nối trong `preview.tsx`): P1 (gỡ ghi
     đè → 20 s) / P2 (reset playhead → 15 s) / P3 (phát thường 20 s) /
     P5 (reset → 40 s) đều **0 restart dư** cả 3 lần (extraCount=0,
     extraEvents=[]); P6 mới (chờ seek kẹt hạ cánh → 10 s) **0 restart
     dư** sau cú hạ cánh nhảy 59,6 s. Cộng M4 đợt 85 (2 lần, P5 có 7
     lần hạ cánh gồm cú nhảy 10,2 s, 0 restart): **tổng 5 lần, 0 lần
     tái hiện +1 của L10.**
   - Điều kiện kích hoạt của L10 đã được tái tạo trực tiếp và vẫn
     không bắn: run 3 P5+P6 seek kẹt **~57 s** ở ct=0,233 rồi hạ cánh
     0,233→59,793 — dài gấp ~6,5× seek kẹt 8,7 s của L10 — 0 restart
     trong 10 s sau. Run 2 P5 seek kẹt ~33 s ở ct=7,367 (không hạ
     cánh trong cửa sổ), 0 restart. Run 1 P5 có 7 cú nhảy ct > 1 s
     (hạ cánh), 0 restart.
   - "Đóng ở mức quan sát" ≠ chứng minh tuyệt đối không bao giờ xảy
     ra. 1 quan sát đơn lẻ của L10 không bị bác bỏ tuyệt đối — chỉ là
     không đủ bằng chứng để sửa production. Trace tick vẫn còn trong
     code để bắt lại nếu nó tái hiện trong tương lai.
   - Nửa Chromium đã đóng từ M4 (artifact bắn lặp, đã chứng minh).
     **W7 ĐÓNG CẢ HAI NỬA ở mức quan sát.**
2. **P4 run 1 (clip 30 s) 0/3 FAIL là artifact tải, không phải hồi quy
   W1** (xem §2): đồng bộ element mất 7,3–19,1 s dưới tải 11–21,
   playhead chạy hết clip 30 s trước khi cửa sổ ép kết thúc → app
   dừng (playing=false) → restart do ép không bắn. Đổi sang clip 60 s
   thì P4 3/3 PASS ở cả run 2 và run 3 (delta +1 mỗi lần, hạ cánh
   đúng target). W1 còn nguyên.
3. **Phát hiện phụ lớn (chặn toàn bộ đo WebKit trên boot này, đã tìm
   ra gốc + cách sửa — xem §5):** sau reboot 03:25, mọi trang có
   media đều crash WebProcess của WebKitGTK 100% (4/4 lần: run 2/2b +
   diag ×2). Gốc: libgstreamer của Playwright WebKitGTK bị relocate,
   chỉ quét plugin trong `minibrowser-gtk/sys/lib/gstreamer-1.0`
   (**không tồn tại**) → `appsink`/`autoaudiosink` = NULL →
   `g_signal_connect_data` trên NULL → crash. Cách sửa (đã chứng
   minh 2/2 lần): launch browser với
   `GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`.
   Harness N2 đã thêm biến này (chỉ env của harness). **Các luồng
   WebKit khác trên boot này mà không set biến này sẽ crash 100%.**
4. **Không sửa production.** Chỉ thêm harness `.mjs` + file LIMITS
   này. Không binary, không workflow, không i18n key mới.

## 1. Thiết kế đo (3 lần chạy độc lập + P6 mới)

Harness `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` — bản sao
harness M4 (đổi prefix/env `N2_*`, scratch `round86-n2`, clip
`/tmp/n2/clips`), cộng:
- `N2_CLIP_DUR` (mặc định 30 — phải khớp duration file clip).
- `GST_PLUGIN_SYSTEM_PATH` trong `launchOpts` của webkit (xem §5).
- **P6 mới** (chỉ run 3): sau P5, chờ tới lúc seek kẹt hạ cánh (tối
  đa 90 s, chỉ tính là hạ cánh khi trước đó đã seeking rồi hết
  seeking với cú nhảy ct > 0,5 s), ghi cú nhảy, rồi quan sát thêm
  10 s. Chỉ quan sát, không tính vào `out.ok`.

Các phase mỗi lần chạy (webkit only, clip H.264 thật trong app thật,
trace tick đọc qua `window.__vcutRestartEndedTrace`):
- P1: ép `ended` 1 lần → chờ restart +1 → gỡ ghi đè NGAY → settle
  1,5 s → quan sát 20 s. Baseline chốt sau settle (hook counter lag
  theo rAF dưới tải — mẫu M4); extra tính bằng chỉ số mảng events.
- P2: `setPlayhead(0)` → quan sát 15 s.
- P3: phát thường 20 s, không tương tác (đối chứng; restart tự nhiên
  phải là `ended-at-duration` mới tính là PASS).
- P4: ép `ended` 3 lần liên tiếp (W1 còn nguyên không).
- P5: `setPlayhead(0)` → quan sát 40 s (cửa sổ dài bắt đúng điều kiện
  L10 phase B: seek kẹt dài rồi hạ cánh).
- P6 (run 3): chờ hạ cánh → quan sát 10 s (xem trên).

Clip: H.264 320×180 testsrc2, libx264, 30 fps — 30 s (run 1) và 60 s
(run 2/3), encode lại bằng ffmpeg sau mỗi reboot (xem §6). L10/M4
dùng clip 30 s; N2 đổi sang 60 s từ run 2 vì lý do ở §2.

## 2. Kết quả 3 lần chạy (WebKitGTK 27.2 headed, `Version/27.2 Safari/605.1.15`)

### Run 1 — clip 30 s, 03:12–03:23 +07, load 11–21 — CÓ FAIL (chỉ P4)

| Phase | Kết quả |
|---|---|
| P1 (gỡ ghi đè → 20 s) | PASS — extraCount 0, extraEvents=[]; base 0 → end 1 (đúng 1 lần do ép, trace events 1) |
| P2 (reset → 15 s) | PASS — extraCount 0 |
| P3 (phát thường 20 s) | PASS — 0 restart; cần reset 2 lần vì clip hết giữa chừng lúc chờ đồng bộ |
| P4 (ép ×3) | **0/3 FAIL** — delta +0 cả 3 lần, ct cuối 25,6 / 27,1 / 26,3, playing=false, paused=true lúc ép (xem dưới) |
| P5 (reset → 40 s) | PASS — extraCount 0; seek kẹt dài nhất 7 mẫu (~1,4 s); 7 cú nhảy ct > 1 s (hạ cánh), 0 restart |

**P4 FAIL là artifact tải, không phải hồi quy W1:** đồng bộ element
dưới tải 11–21 mất 7,3 s (P1) tới 19,1 s (P4-lần3); playhead chạy hết
clip 30 s trước khi cửa sổ ép 8 s kết thúc → app dừng
(playing=false) → nhánh forward không chạy → restart do ép không
bắn. L10 (load 1,5–4) và M4 run 3 đều P4 3/3 PASS với cùng clip
30 s; không có bằng chứng nào cho thấy logic restart hỏng. Đối sách:
clip 60 s cho run 2/3 (P4 3/3 PASS cả hai lần — xem dưới). Các phase
P1/P2/P3/P5 giữ nguyên định nghĩa nên vẫn so sánh được với M4.

### Run 2 — clip 60 s, 04:03–04:06 +07 — KHÔNG FAIL

| Phase | Kết quả |
|---|---|
| P1 | PASS — extraCount 0 (base 0 → end 1) |
| P2 | PASS — extraCount 0 |
| P3 | PASS — 0 restart (đồng bộ chậm 31,6 s, clip 60 s đủ headroom) |
| P4 | **3/3 PASS** — delta +1 mỗi lần, hạ cánh đúng target (lần3 có cảnh báo ép lúc seeking=true nhưng vẫn PASS) |
| P5 | PASS — extraCount 0; ct đóng băng ở **7,367 trong ~33 s** (t≈6,86→39,84; nhãn harness "~18 s" là sai — harness nhân số mẫu với 0,2 s/mẫu trong khi mẫu thực ~0,34 s/mẫu dưới tải; con số đúng là 33 s theo timestamp), playhead chạy 7→39, restart 4→4 suốt; seek KHÔNG hạ cánh trong cửa sổ |

### Run 3 — clip 60 s + P6, 04:09–04:13 +07 — KHÔNG FAIL

| Phase | Kết quả |
|---|---|
| P1 | PASS — extraCount 0 (base 0 → end 1) |
| P2 | PASS — extraCount 0 |
| P3 | PASS — 0 restart (đồng bộ 15,8 s) |
| P4 | **3/3 PASS** — delta +1 mỗi lần (đồng bộ lần1 39,3 s, lần2 29,1 s dưới tải cao — clip 60 s cứu được) |
| P5 | PASS — extraCount 0; ct đóng băng ở **0,233 suốt toàn bộ cửa sổ 40 s** (126 mẫu, t=0,11→40, playhead 0→40,267), restart 4→4 |
| **P6** | **PASS — hạ cánh xong, 0 restart dư trong 10 s sau.** Sau 17,1 s chờ thêm, seek hạ cánh: ct **0,233 → 59,793** (nhảy 59,6 s, playhead = 60 = cuối clip); 10 s sau: restart 4→4, extraEvents=[] |

### Đối chứng Chromium (smoke harness mới, trước khi chạy WebKit)

Run 0 (`N2_ENGINE=chromium`, clip 30 s): KHÔNG FAIL — P1/P2/P3/P5
PASS (0 restart dư), P4 3/3 PASS, consoleErrs=[]. Đáng chú ý: P1
sau settle restart=2, events=2 — đúng mẫu M4 (event thứ 2 bắn TRƯỚC
khi gỡ ghi đè, hook counter lag) — không phải +1 dư. Smoke này chỉ
để kiểm wiring harness N2, không phải kết quả W7 mới.

## 3. Tổng hợp bằng chứng W7-WebKit (5 lần chạy độc lập)

| Lần | P1 | P2 | P3 | P5 | Ghi chú hạ cánh |
|---|---|---|---|---|---|
| M4 run 2 (đợt 85) | 0 | 0 | 0 | 0 | — |
| M4 run 3 v3 (đợt 85) | 0 | 0 | 0 | 0 | 7 lần hạ cánh, gồm cú nhảy ct 2,967→13,167 |
| N2 run 1 (30 s) | 0 | 0 | 0 | 0 | 7 cú nhảy ct > 1 s |
| N2 run 2 (60 s) | 0 | 0 | 0 | 0 | kẹt ~33 s, không hạ cánh trong cửa sổ |
| N2 run 3 (60 s) | 0 | 0 | 0 | 0 (+P6: 0) | kẹt ~57 s rồi hạ cánh nhảy 59,6 s, 0 trong 10 s sau |

(Số trong bảng là số restart dư — extraCount; tất cả đều 0.
extraEvents=[] trong mọi phase quan sát.)

Đối chiếu L10 (1 quan sát duy nhất): +1 ở t=9,3 s sau reset, đúng
lúc seek kẹt 8,7 s vừa hạ cánh (ct 23,733 → 8,833). N2 đã tái tạo
trực tiếp điều kiện đó ở mức mạnh hơn (kẹt ~57 s, nhảy 59,6 s) và
không bắn. Cơ chế ở mức tick của +1 L10 vẫn chưa xác định được —
nhưng với 5 lần không tái hiện, gồm cả trường hợp kích hoạt mạnh
nhất, không có cơ sở để sửa production. **W7-WebKit đóng ở mức quan
sát; W7 đóng cả hai nửa.**

## 4. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Harness W7 WebKit run 1 (clip 30 s) | P1/P2/P3/P5 PASS (0 dư); P4 0/3 FAIL do artifact tải (§2) |
| Harness W7 WebKit run 2 (clip 60 s) | **KHÔNG FAIL** — P1/P2/P3/P5 PASS, P4 3/3 PASS |
| Harness W7 WebKit run 3 (clip 60 s + P6) | **KHÔNG FAIL** — P1/P2/P3/P5/P6 PASS, P4 3/3 PASS |
| Smoke Chromium (harness N2 mới) | KHÔNG FAIL — P1/P2/P3/P5 PASS, P4 3/3 PASS |
| Unit test `webkitRestartTrace85M4` | **10/10 xanh** (chạy lại) |
| Unit test `webkitLoopRestart80H5` | **11/11 xanh** (chạy lại) |
| `tsc --noEmit` (apps/web) | **2 lỗi — KHÔNG phải do N2** (xem §6) |
| `vite build` (apps/web, chạy riêng không qua tsc) | **PASS** (6,00 s; cảnh báo chunk > 500 kB đã có từ trước) |
| consoleErrs / pageerror trong 3 run WebKit | **[] cả 3 lần** |

## 5. Phát hiện phụ: WebProcess crash 100% do GStreamer relocate (đã tìm ra gốc + cách sửa)

Sau reboot 03:25, mọi trang có media đều crash WebProcess của
WebKitGTK 100% (run 2/2b chết lúc khởi động + diag tối giản crash
trong 5 s sau khi load, 4/4 lần — kể cả khi replay đã xong, load
1,06). Chẩn đoán (chạy MiniBrowser trực tiếp, đọc stderr):

```
GStreamer element appsink not found. Please install it.
GStreamer element autoaudiosink not found. Please install it
(WebKitWebProcess): GLib-GObject-CRITICAL: invalid (NULL) pointer instance
(WebKitWebProcess): g_signal_connect_data: assertion 'G_TYPE_CHECK_INSTANCE (instance)' failed
** (MiniBrowser): WARNING **: WebProcess CRASHED
```

Gốc (chạy với `GST_DEBUG=GST_REGISTRY:5,GST_PLUGIN_LOADING:5`):
libgstreamer của Playwright WebKitGTK bị **relocate** —
`real directory location: .../minibrowser-gtk/sys/lib`, plugin dir
`.../sys/lib/gstreamer-1.0` **không tồn tại** (ls xác nhận). WebProcess
đọc registry cache chung `~/.cache/gstreamer-1.0/registry.x86_64.bin`,
thấy các plugin hệ thống nằm ngoài đường quét của nó → cắt bỏ
(`removing cached plugins`) → ghi lại stub chỉ còn static elements
(**76 byte**, 03:56:37, `strings | grep -c appsink` = 0). Lần sau
`appsink` = NULL → crash. Đã loại trừ: plugin file thiếu
(libgstapp.so chứa appsink, ldd đủ, scanner tồn tại), tắt sandbox
(`WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1` vẫn crash), build lại
registry bằng `gst-inspect-1.0` (1,4 MB lúc 03:54 — WebProcess sau đó
ghi đè lại thành stub; `gst-inspect` từ shell vẫn thấy đủ vì shell
quét đường hệ thống).

**Cách sửa (đã chứng minh 2/2 lần):** launch browser với
`GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` —
app load ngon, topbar render, sống > 20 s, 0 crash (cả khi kèm tắt
sandbox lẫn chỉ một mình biến này). Tác dụng phụ tốt: WebProcess
quét lại plugin hệ thống và ghi registry về đủ 1,4 MB (appsink có
lại, `strings` đếm = 2, 03:59:57). Harness N2 đã thêm biến này vào
`launchOpts` của webkit (chỉ env của harness, không sửa production).

**Lưu ý cho các luồng WebKit khác trên boot này: không set biến này
thì mọi trang có media đều crash WebProcess 100%.** Câu hỏi mở: vì
sao boot trước (M4/L10/run 1) chạy được mà không cần biến này — ứng
viên: registry lúc đó còn nguyên từ trước reboot và WebProcess thấy
"not changed" nên không ghi đè; sau reboot 03:25 registry mất → vòng
cắt-ghi-stub bắt đầu. Chưa chứng minh, không đoán thêm.

## 6. Môi trường + nợ ghi nhận trong lúc làm

- **2 lần reboot trong đợt này** (uptime 34 phút lúc 09:38; uptime 0
  phút lúc 03:25 sau run 1 — ffmpeg đang encode clip 60 s bị abort
  giữa chừng). `/tmp` tmpfs bị xoá theo mỗi reboot: đã encode lại
  clip 30 s (936.628 byte) + 60 s (1.875.785 byte), ffprobe duration
  30.000000 / 60.000000.
- **Dep apt WebKit biến mất sau mỗi reboot** (lần thứ 4: K9 đợt 83,
  M4 đợt 85, đầu đợt này, nay). Đầu đợt: `install-deps webkit` FAIL
  2 lần do apt lock (lần 1: `apt-get update` của os-intent replay
  PID 856 giữ; lần 2: sau khi tự fetch 41,7 MB thì dpkg frontend
  lock bị replay PID 12207 giữ, đang cài `enchant-2`); replay sau đó
  tự cài lại đủ bộ dep (libgstreamer1.0-0 1.24.2, libgtk-4-1 4.14.5,
  plugins-good/bad 1.24.2, libav 1.24.1, libmanette/libsoup/
  libsecret/libenchant). Sau reboot lần 2, replay cài lại tương tự.
  Cache `/var/cache/apt/archives/` còn 167 .deb (sống sót qua
  reboot). Đã cài thêm `gstreamer1.0-tools` 1.24.2 để chẩn đoán
  (chỉ tool, không thuộc repo).
- **Repo không có `.git`** (`find /home/hatch -maxdepth 4` không thấy
  `.git` nào): HEAD `5f548ef8` lấy theo hồ sơ, không verify được bằng
  git trên VM này. Không push (đúng luật).
- **`tsc` 2 lỗi không phải do N2:** cả 2 TS6133 trong `preview.tsx`
  từ code của luồng N3 đợt 86 đang sửa dở
  (`shouldSkipRenderWhileSeeking` import từ `./lib/seekSkipRender86N3`
  :49; `seekSkipRenderTicks86N3` :2430). N2 không sửa file production
  nào nên không đụng vào 2 lỗi này; parent/closing xử lý sau khi N3
  xong.
- Nhãn "~X s" của harness cho seek kẹt dài nhất nhân số mẫu với
  0,2 s/mẫu trong khi mẫu thực ~0,34 s/mẫu dưới tải (run 2: nhãn
  18,0 s, thực ~33 s; run 3: nhãn 25,0 s, thực ~40 s) — số đúng theo
  timestamp đã ghi trong LIMITS này; harness không sửa nhãn (không
  đáng để đổi protocol giữa chừng, chỉ ghi chú).

## 7. Nợ còn lại / giới hạn

1. **W7 ĐÓNG ở mức quan sát (cả hai nửa).** Không sửa production.
   Trace tick còn trong code để bắt lại nếu +1 tái hiện trong tương
   lai; cơ chế tick của +1 L10 vẫn chưa xác định (1 quan sát đơn lẻ).
2. **WebKitGTK trên boot này cần `GST_PLUGIN_SYSTEM_PATH`** (xem §5)
   — harness N2 đã set; các harness WebKit khác cần set tương tự
   nếu không sẽ crash 100% khi trang có media.
3. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
   ngang/hơn CapCut thật.
4. TTS 39 không kiểm lại (đúng chỉ đạo).

## 8. Files (stage, KHÔNG push)

- Mới: `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` — harness W7
  (bản sao M4 + env N2_* + N2_CLIP_DUR + fix GST_PLUGIN_SYSTEM_PATH
  cho webkit + phase P6 chờ-hạ-cánh).
- Mới: `docs/PHASE9_ROUND86_N2_WEBKIT_W7_LIMITS.md` (file này).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round86-n2-webkit-w7.txt`
  — 2 entry, verify read-back 2/2 tồn tại và là text.
- Bằng chứng headed (không stage, ở hidden_files):
  `hidden_files/round86-n2/` — headed-run0-smoke/ (Chromium),
  headed-run1/ (WebKit 30 s), headed-run2/ (WebKit 60 s),
  headed-run3/ (WebKit 60 s + P6): report JSON + n2-run.log +
  screenshot từng phase.
- Không stage: clip mp4 trong /tmp/n2/clips (tạo lại bằng ffmpeg khi
  cần); script diag/probe trong /tmp/n2-*.mjs (tạm, ngoài repo).
- Không sửa production. Không thêm i18n key (không tự bump test khóa
  số key — không có key mới để bump).

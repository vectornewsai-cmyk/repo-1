# PHASE9 ROUND119 T8 — Đặt lại bar F2 (tách khởi động pipeline khỏi seek) + follow-up MSB4RB8 27,02 s — DỞ DANG (reboot + môi trường sau reboot thiếu GST plugin)

- **Đợt:** 119, luồng T8. **Lượt cron:** 06:35 +07 16/11/2026.
- **Boot đo:** `27c8b1d9…` (uptime -s 23:33:34Z 15/11; T7 gọi #57?) —
  mọi phép đo hoàn thành trước reboot. **Reboot 00:53:41Z** (boot mới
  `622b3a92…`, first journal 00:53:57Z) giết driver giữa leg B r6;
  môi trường sau reboot thiếu plugin GStreamer → không nối lại được
  trong slot. Không có reboot nào khác trong lúc T8 đo (uptime -s
  không đổi từ prereg tới lúc driver chết).
- **Cây:** `preview.tsx` md5 `5be5a250a552357c50cc189de9a9c08a` (H3f,
  T1 apply 23:57Z, `patch -p1` rc=0, tsc exit 0 + vite build PASS
  7,03 s) — `media.ts` md5 `2c384ed13703809d5e999311147745e7` **không
  đổi trước/sau mọi leg** (verify trước/sau leg A, leg B, smoke,
  resume-check). Không có patch production nào từ T8; mọi leg đều
  probe-only.
- **Prereg:** `hidden_files/round119-t8/prereg-t8.md` — viết TRƯỚC mọi
  đo (23:47Z), 2 đính chính cũng trước phép đo liên quan (23:52Z:
  leg B 6 valid / tối đa 8 attempt; 00:57Z: gia hạn 10 attempt sau
  reboot — xem §5).
- **Tiếp nối:** T8 đợt 118 (`docs/PHASE9_ROUND118_T8_SEEKPRELOAD_LIMITS.md`),
  quyết parent LIMITS gộp đợt 118 §12 mục 8 (B-Q8-1 giữ KHÔNG ĐẠT;
  bar F2 đặt lại đợt 119, tách hai pha).

## 0. Verdict — bar F2 mới CHƯA CÓ VERDICT (leg B dở 3/6); leg A xong

| Hạng mục | Kết quả |
|---|---|
| Bar F2 mới (định nghĩa tách hai pha) | **ĐÃ ĐĂNG KÝ + ĐO MỘT PHẦN — KHÔNG VERDICT.** Leg B chỉ 3/6 run hợp lệ (cần ≥6 theo prereg §1). Định nghĩa + ngưỡng đề xuất ghi tại §1 để parent quyết; T8 không tự áp bar, không tuyên bố đạt/không đạt từ mẫu thiếu. |
| Leg A — follow-up overshoot MSB4RB8 27,02 s | **KHÔNG TÁI HIỆN: 0/3 run** (C = 17,421 cả 3; smoke cũng 17,421). Tần suất gộp cập nhật **1/27** (đợt 118: 1/23 + đợt 119: 0/4). Cơ chế overshoot vẫn chưa rõ. |
| Leg B partial — pha (b) seek thuần | **T_seek = 0,00 s ở cả 5 case** (3 valid + 2 VOID); T_seek_ms 0/0/4/7 ms (1 null do làm tròn) — nhất quán dữ liệu đợt 118. Tín hiệu ủng hộ "seek thuần nhanh", nhưng chưa đủ mẫu để verdict. |
| Leg B partial — pha (a) khởi động pipeline | 3 valid đều rơi **chế độ chậm**: T_startup **1,42 / 1,98 / 2,39 s** (median 1,98 s, n=3 — KHÔNG dùng làm verdict bar, n<6). 1 run VOID nhanh 0,54 s (r3) báo riêng, không tính. |
| Phát hiện phụ — seek-after-preload | Seek sau 20 s paused chậm **0,49–2,59 s** (leg A + smoke), khác hẳn seek-immediate 0,00 s — ghi nhận, chưa phải verdict (xem §2.1). |
| Reboot + môi trường | Driver chết 00:53:41Z giữa leg B r6 (không case). Sau reboot: GST plugin chỉ còn 2 file, **qtdemux không có** (gst-inspect xác nhận), plugins-good/base/bad/libav chưa cài, hoạt động apt dừng từ ~01:23Z, T7 đã xong từ trước reboot → **không nối lại được**. Nợ sang đợt 120. |

## 1. Định nghĩa mới bar F2 — TÁCH HAI PHA (đăng ký trước khi đo)

Hai pha đo từ CÙNG một run Q8SEEKFAST, từ `evs` của runner (độ phân
giải 10 ms) và `seekImmMs` / `seekMs` (độ phân giải ms):

- **(a) T_startup — khởi động pipeline** = t(loadedmetadata ĐẦU TIÊN)
  − t(loadstart ĐẦU TIÊN) trong evs. Nội dung: typefind + qtdemux +
  buffer đầu.
- **(b) T_seek — seek thuần** = t(seeked ĐẦU TIÊN) − t(seeking ĐẦU
  TIÊN) trong evs (chính là `seek_dur_s` của analyzer).
- **Metric phụ (độ phân giải ms, cross-check):** T_seek_ms =
  seekImmMs − (t_loadedmeta − seekMs/1000)·1000. Chỉ tính khi
  loadedmetadata xảy ra SAU tSeek0; nếu âm / trước tSeek0 → null
  ("seek chồng lên startup, không tách được bằng metric phụ").
- **Cơ chế (đăng ký trước):** event `seeking` chỉ phát khi seek thật
  sự bắt đầu — nếu metadata chưa sẵn, việc gán currentTime được hoãn
  lại tới sau loadedmetadata; do đó T_seek đo seek sau metadata, còn
  thời gian chờ metadata nằm trong T_startup. seekImmMs (bar cũ) ≈
  T_startup + T_seek.

### Ngưỡng đề xuất (T8 đề xuất, PARENT quyết cuối)

- **(a) Bar phân phối (mẫu S9 §6):** trên ≥6 run cổng yên, median
  T_startup ≤1,0 s VÀ p90 ≤1,2 s → pha (a) **ĐẠT**. Chế độ chậm
  (T_startup >1,2 s) báo RIÊNG, không gộp vào median/p90, không chấm
  — vì dữ liệu đợt 118 cho thấy khởi động có 2 chế độ theo giai đoạn
  thời gian, không theo cấu hình.
- **(b) Bar seek thuần:** trên ≥6 run, MỌI run T_seek ≤100 ms VÀ
  median T_seek ≤50 ms → pha (b) **ĐẠT**. Caveat phân giải: evs
  10 ms — nếu mọi run = 0,00 s thì kết luận đúng mức là "seek thuần
  <10 ms ở độ phân giải đo", KHÔNG tuyên bố 0 ms.
- **Bar F2 mới ĐẠT tổng thể** khi cả (a) và (b) đều ĐẠT trên cùng bộ
  run. Nếu (a) không đạt vì chế độ chậm thì verdict ghi "KHÔNG ĐẠT —
  chế độ chậm", không gộp chế độ.
- **Falsifier:** ≥2/6 run có T_seek >100 ms → pha (b) KHÔNG ĐẠT.

### Hiệu chỉnh phát hiện trong lúc đo (ghi rõ, không đổi định nghĩa giữa chừng)

Kiểm chứng seekImmMs ≈ T_startup + T_seek trên 5 case leg B cho độ
lệch âm hệ thống ở 4/5 run: seekImmMs − (T_startup+T_seek) =
**−197 / 0 / −27 / −182 / −183 ms**. Đối chiếu mốc tuyệt đối:
loadstart phát trước tSeek0 đúng bằng độ lệch đó (r1: loadstart
0,52 s vs seekMs 0,716 s → 196 ms; r2: 0,92 vs 0,920 → 0 ms; r3:
0,19 vs 0,217 → 27 ms; r4: 0,51 vs 0,696 → 186 ms; r5: 0,58 vs
0,770 → 190 ms). Tức element bắt đầu load ở swap, trước khi gán
currentTime 0–200 ms — nên **T_startup (định nghĩa hiện tại) bao
gồm ~0–200 ms load trước seek**, hơi dài hơn phần startup nằm trong
seekImmMs. Nếu parent muốn T_startup đo đúng từ lúc seek thì định
nghĩa lại thành t(loadedmeta) − tSeek0; T8 KHÔNG tự đổi định nghĩa
giữa chừng (mọi số trong LIMITS này dùng định nghĩa đã đăng ký).

## 2. Leg A — Follow-up ngoại lệ MSB4RB8 27,02 s (Q8PAUSED)

**Cấu hình:** MSB4RB8 (`J2_QUEUE2_MAX_SIZE_BYTES=4194304` +
`L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, L2 max-size UNSET).
**3 run đăng ký trước** (r1–r3) + 1 smoke trước driver (OUT riêng,
KHÔNG tính vào leg). Cổng vào leg: load1 < 60.

| run | load1 (case) | C (s) | flat5s | T_c (s) | T_startup (s) | T_seek sau-preload (s) | frames | finalSrc | shim | firstPull | wrap | bogus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| smoke | 0,79 | 17,421 | 0,0 | 0,65 | 0,47 | 0,43 | 377 | blob | OK 4194304/8388608 | `00000020…` | 0/1080 | 0 |
| r1 | 6,65 | 17,421 | 0,0 | 1,25 | 0,70 | 0,49 | 379 | blob | OK | `00000020…` | 0/1080 | 0 |
| r2 | 4,25 | 17,421 | 0,0 | 1,81 | 1,39 | 1,83 | 184 | blob | OK | `00000020…` | 0/1080 | 0 |
| r3 | 1,46 | 17,421 | 0,0 | 2,70 | 2,21 | 2,59 | 153 | blob | OK | `00000020…` | 0/1082 | 0 |

- **Verdict: overshoot KHÔNG TÁI HIỆN.** 0/3 run đăng ký vượt 25 s
  (ngưỡng prereg: C ≥ 25 s). C = 17,421 s ở cả 3 run + smoke —
  giống hệt CTL đợt 118 và smoke đợt 118. Tần suất gộp cập nhật:
  đợt 118 1/23 + đợt 119 0/4 → **1/27 run Q8PAUSED msb4** (2 boot,
  2 cây: baseline 03bf029f + H3f 5be5a250). Cơ chế overshoot vẫn
  CHƯA RÕ; không ưu tiên (hiếm 1/27, không ảnh hưởng verdict H6).
- **H6 giữ ở mức "giá trị điển hình":** trần 17,421 s @ max-size
  4 MiB, flat 0,0, suspend → 0 progress sau suspend, im lặng GST
  ~18,6–19,4 s — ở cả 3 run (và smoke). Số trần luôn ghi kèm cấu
  hình queue2.
- **T_startup trong leg A dải rộng 0,47–2,21 s** (smoke 0,47; r1
  0,70; r2 1,39; r3 2,21) — ngay trong cùng leg, cùng cấu hình, cùng
  boot: chế độ nhanh/chậm xen kẽ theo thời gian, củng cố kết luận
  đợt 118 (không theo cấu hình queue2).
- **§2.1 Phát hiện phụ — seek-after-preload chậm:** trong protocol
  Q8PAUSED, seek tới 16 s sau 20 s paused mất 0,43 / 0,49 / 1,83 /
  2,59 s (seeking→seeked ở t≈20–23 s), trong khi seek-immediate
  (leg B) là 0,00 s. Giải thích có thể: pipeline đã suspend sau ~20 s
  paused nên seek phải đánh thức pipeline (và target 16 s gần trần
  17,421). Đây là quan sát n=4 trên protocol khác — KHÔNG phải
  metric bar (b), không gộp vào verdict seek thuần. Đợt sau nếu bàn
  "seek nhanh" thì tách hai trường hợp này.
- Frames 379/184/153 dao động lớn theo tải trong lúc phát — không
  quy cho cấu hình; chỉ ghi số (đợt 118 cũng thấy frames nhiễm tải).

## 3. Leg B — Đo F2 theo định nghĩa mới (Q8SEEKFAST) — DỞ DANG 3/6

**Cấu hình:** MSB4RB8 (giống leg B đợt 118). **5 case trong OUT**
(r1–r5); r6 chết theo reboot, không có case. Hợp lệ theo bracket
prereg (load1 < 3 trước + sau): **r1, r4, r5 valid (3/6)**; r2, r3
VOID (bracket vỡ). Mọi run: seekedOk True, finalCt 32, finalSrc
blob, errEvents 0, 0 wrap / 0 bogus (classifier chỉ chạy cho leg A;
leg B kiểm tra qua OUT + pull log — xem bảng).

| run | hợp lệ? | load1 trước/sau | seekImmMs | T_startup (s) | T_seek (s) | T_seek_ms | t_loadstart → t_loadedmeta (s) | frames |
|---|---|---|---|---|---|---|---|---|
| r1 | ✓ | 0,56 / 0,84 | 2193 | 2,39 | 0,00 | null | 0,52 → 2,91 | 173 |
| r2 | ✗ VOID | 0,97 / 28,00 | 2900 | 2,90 | 0,00 | 0 | 0,92 → 3,82 | 143 |
| r3 | ✗ VOID | 1,47 / 34,31 | 513 | 0,54 | 0,00 | 0 | 0,19 → 0,73 | 384 |
| r4 | ✓ | 1,85 / 1,01 | 1798 | 1,98 | 0,00 | 4 | 0,51 → 2,49 | 122 |
| r5 | ✓ | 0,61 / 2,95 | 1237 | 1,42 | 0,00 | 7 | 0,58 → 2,00 | 135 |

- **Pha (b) seek thuần — tín hiệu mạnh nhưng chưa verdict:** T_seek
  = 0,00 s ở cả 5 case (t_seeking = t_seeked = t_loadedmeta ở mọi
  run — seeking chỉ phát sau khi metadata sẵn, đúng cơ chế đã đăng
  ký); T_seek_ms 0/0/4/7 ms (r1 null do làm tròn, xem §1). Gộp với
  đợt 118 (6 run leg B + 2 run CTL4 follow-up, T_seek 0,00 s): nay
  là **13/13 run SEEKFAST có T_seek = 0,00 s** — seek thuần <10 ms
  ở độ phân giải đo là kết quả nhất quán, chỉ thiếu mẫu hợp lệ đợt
  này để verdict chính thức theo bar đã đăng ký (cần ≥6 valid).
- **Pha (a) khởi động — 3 valid đều chế độ chậm:** T_startup valid
  2,39 / 1,98 / 1,42 s (median 1,98 s, n=3 — ghi tham khảo, KHÔNG
  dùng verdict). Cả 3 đều >1,2 s (ngưỡng p90 đề xuất). Chế độ chậm
  kéo dài suốt 00:09–00:36Z trừ một run nhanh r3 (VOID) lúc ~00:29Z
  (T_startup 0,54 s, seekImmMs 513 ms — nhanh nhất từ trước tới nay
  trên MSB4RB8).
- **r3 VOID — ghi rõ, không giấu, không tính:** run nhanh nhất
  (513 ms) nhưng VOID theo luật bracket (load sau 34,31). Đáng chú
  ý: case loadavg của r3 là [56,54, 33,36, 21,95] — run chạy DƯỚI
  tải rất nặng mà vẫn nhanh nhất, gợi ý tải KHÔNG phải yếu tố quyết
  định chế độ nhanh/chậm (sóng tải ập tới trong lúc run, sau khi
  cổng trước đã yên). Vì run đã VOID theo luật đăng ký trước nên
  không tính vào bar — nhưng quan sát này được ghi để đợt sau đối
  chiếu (cùng hướng với giả thuyết throttle của T3 đợt 118: tải thấp
  chưa chắc đã nhanh).
- **r2 VOID:** load sau 28,00 (sóng tải ập tới trong lúc run);
  T_startup 2,90 s — chậm, không đổi kết luận.
- **Không verdict bar:** cần thêm 3 valid nữa (đợt 120) trên cùng
  định nghĩa + ngưỡng §1. Không gộp 3 valid đợt này với 6 run đợt
  118 để tuyên bố bar (khác boot, khác cây H3f, khác cổng; đợt 118
  cũng không gộp chế độ chậm/nhanh).

## 4. Reboot 00:53:41Z + môi trường sau reboot (vì sao không nối lại)

- **Reboot:** `uptime -s` đổi 23:33:34Z → **00:53:41Z**; journal
  chỉ còn 1 boot, id `622b3a92…`, first entry 00:53:57Z. Gap boot
  27c8b1d9 → 622b3a92 chưa kẹp số thứ tự (T7 đợt 119 đã xong trước
  reboot; việc đếm reboot/mù #37 là của T6/T7 — T8 chỉ ghi mốc).
  Driver chết giữa leg B r6: cổng sạch DAT 00:43:26Z, chưa có exit;
  OUT_F không có case r6. Xvfb :197 + lock holder t3-round119 chết
  theo reboot (lock stale: thread t3-round119, pid 54295, boot cũ
  27c8b1d9, vite node trên 5590: none — ghi lúc 00:55Z).
- **Môi trường sau reboot — thiếu plugin (kiểm 00:55–01:47Z):**
  - Thư mục GST plugin chỉ còn **2 file**: `libgstcoreelements.so`,
    `libgstcoretracers.so` (trước reboot: 269 file).
  - `gst-inspect-1.0 qtdemux`: "No such element or plugin 'qtdemux'".
  - `dpkg-query`: gstreamer1.0-plugins-good/bad/ugly/libav không
    tìm thấy; plugins-base not-installed; libevent-2.1-7
    not-installed (nhưng file libevent-2.1.so.7 tồn tại trên đĩa —
    ghi đúng cả hai, không suy diễn).
  - `/var/log/dpkg.log`: chỉ **1 dòng** install gstreamer
    (gstreamer1.0-tools, 01:23:43Z); hoạt động apt dừng từ ~01:23Z;
    lúc 01:46Z không có apt/dpkg nào chạy.
  - T7 đợt 119 đã XONG 23:49Z (trước reboot) — không còn luồng nào
    xử lý replay/postboot cho boot mới.
- **Đã chờ 45 phút (00:59–01:45Z):** libevent về, GST vẫn 2 file →
  resume driver tự chặn ở cổng GST ≥250 (theo đính chính prereg).
  T8 KHÔNG tự cài package (ngoài phạm vi luồng đo; replay là việc
  của T7/hệ thống). Probe WebKit không thể chạy khi thiếu qtdemux
  (không demux được mp4) — không đo chui trên môi trường hỏng.
- **Hệ quả:** leg B dở 3/6; bar F2 chưa verdict; nợ sang đợt 120
  (xem §6).

## 5. Phương pháp, caveat và nhật ký vận hành

- **Prereg trước đo:** `prereg-t8.md` 23:47Z (trước mọi đo kể cả
  smoke). Đính chính 23:52Z (leg B 6 valid / tối đa 8 attempt, sửa
  mâu thuẫn nội bộ prereg) và 00:57Z (gia hạn 10 attempt sau reboot;
  resume append OUT_F, không xóa) — cả hai TRƯỚC phép đo liên quan,
  ghi rõ lý do, không phụ thuộc kết quả đã thấy.
- **Cờ T1:** `round119-t1-applied` xuất hiện ~00:00Z (sau 12 phút
  chờ): preview.tsx 5be5a250, tsc 0 + vite build PASS 7,03 s, chân A
  xong trước apply. T8 đo trên cây H3f từ 00:01Z.
- **Smoke (foreground, trước driver):** 1 run Q8PAUSED MSB4RB8 PASS
  (exit 0, C=17,421, shim OK, SURVIVED) — harness chạy tốt trên cây
  H3f, boot 27c8b1d9. OUT riêng `...-smoke.json`, không tính vào leg.
- **Runner T8-119:** copy runner 118, chỉ đổi chuỗi round, PORT
  8946→8948, S9_DIR mặc định → round119-t8 (`node --check` OK).
  **Analyzer:** copy + THÊM T_startup/T_seek/T_seek_ms (không đổi
  logic cũ) — validate TRƯỚC khi đo trên dữ liệu đợt 118: T_startup
  2,30–4,41 s, T_seek 0,00 s ×6, T_seek_ms 2–10 ms (5/6 run, 1 null
  do làm tròn). **Classifier:** copy đợt 118, đổi H/OUT mặc định.
  **Lock v2:** copy `vcut-vite-lock-v2.sh` md5 `5cac10af…` vào thư
  mục làm việc; mỗi run đo qua `run-attempt t8-round119 5189 900 30
  normal` (nhả giữa các attempt; dial-wait ngoài lock). Cổng 5189
  tránh 5187 (T4) / 5188 (T5) / 5590 (T1). Runner không chạy vite —
  lock chỉ để xếp hàng cửa sổ đo.
- **Lock kẹt sau T3:** leg B r3 chờ acquire ~11 phút (cổng DAT
  00:17:56Z → exit 00:30:48Z); T3 giữ lock từ 00:36:50Z tới reboot.
  T3 giữ lock dài là nợ đã biết (đợt 118 §10 mục 7 — T9 theo dõi);
  T8 không can thiệp lock của luồng khác.
- **Driver:** `run-t8-all.sh` chạy DETACHED (nohup+disown) 00:01:24Z
  → chết theo reboot 00:53:41Z (leg A xong, leg B 3/6 valid). Watcher
  nền của T8 cũng chết theo reboot (SIGTERM lúc ~00:53Z — watcher
  của phiên, không phải driver). Resume driver `run-t8-resume.sh`
  đã viết sẵn nhưng KHÔNG chạy (cổng môi trường GST ≥250 không đạt).
- **Load waves:** r2/r3 leg B vỡ bracket do sóng tải (load sau
  28,00 / 34,31) — từ các luồng khác (T3 s79 hog), không phải lỗi
  probe. Leg A chạy được nhờ cổng <60.
- **Suite liên quan:** không chạy (không có thay đổi production nào
  từ T8; cây byte-identical trừ preview.tsx H3f đã được T1 verify
  tsc 0 + vite build PASS).
- **Thời gian:** slot cron 23:35–02:35Z; prereg 23:47Z; cờ T1 ~00:00Z;
  smoke 00:01Z; driver 00:01–00:53Z (chết theo reboot); chờ env
  00:59–01:45Z; LIMITS viết xong ~01:5xZ. Còn dư thời gian slot
  nhưng không có đường đo hợp lệ.
- **Không đụng:** TTS 39, birefnet, `.github/workflows/*`,
  production code (chỉ T1 sửa), binary vào batch, apt/dpkg
  (không tự cài đặt gì sau reboot).

## 6. Nợ mở cho đợt sau

1. **Bar F2 mới (nợ #1):** leg B cần thêm **3 valid** nữa (tổng 6)
   trên cùng định nghĩa + ngưỡng §1 — làm đầu đợt 120 khi môi
   trường đủ (qtdemux + plugin). Giữ nguyên định nghĩa đã đăng ký;
   lưu ý hiệu chỉnh ~0–200 ms pre-seek load trong T_startup (§1).
   Parent vẫn cần quyết ngưỡng cuối (§1).
2. **Overshoot 27,02 s:** tần suất gộp nay **1/27** — cơ chế vẫn
   chưa rõ; không ưu tiên (hiếm, không ảnh hưởng H6).
3. **Seek-after-preload chậm (0,49–2,59 s) vs seek-immediate 0,00 s:**
   ghi nhận để đợt sau tách khi bàn "seek nhanh" — có thể liên quan
   wake-up sau suspend (target 16 s gần trần 17,421).
4. **Hạ tầng boot mới (622b3a92):** replay chưa đủ plugin (thiếu
   qtdemux + plugins-good/base/bad) — T7 đợt 120 cần postboot lại
   cho boot này; lock stale t3-round119 (boot cũ) sẽ được
   stale-recovery khi acquire tiếp theo (v2, boot-change shortcut).
   T3 giữ lock dài (~17 phút tới reboot) vẫn là nợ theo dõi.
5. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ user
   quyết; `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại;
   birefnet chỉ thử lại khi RAM đổi (u2net là fallback chính thức).
   Xem LIMITS gộp đợt 118 §10.

## 7. File và dữ liệu

- Runner T8-119: `benchmarks/render/webkit_blob_flaky_119t8.mjs`
  (copy runner 118 + PORT 8948; ~80 KB — **>37.768 B, cần
  `ENABLE_PRIVSEP=0` khi push**).
- Analyzer T8-119: `benchmarks/render/q8_analyze_119t8.py`
  (+ T_startup/T_seek/T_seek_ms).
- LIMITS này: `docs/PHASE9_ROUND119_T8_SEEKPRELOAD_LIMITS.md`.
- OUT JSON (KHÔNG stage, theo lệ `benchmarks/results/`):
  `webkit-blob-flaky-119t8-seekpreload-msb4rb8.json` (3 case),
  `...-msb4rb8-seekfast.json` (5 case),
  `...-smoke.json` (1 case).
- Dữ liệu thô + prereg + driver + resume driver + log (KHÔNG stage):
  `hidden_files/round119-t8/` (`prereg-t8.md`, `run-t8-all.sh`,
  `run-t8-resume.sh`, `smoke-t8.sh`, `t8-progress.md`,
  `t8-driver.out`, `t8-resume.out`, `t8-legA-r*.log`,
  `t8-legB-r*.log`, `t8-smoke.log`, `t8-analysis-*.txt`,
  `t8-classify-*.txt`, `smoke/`, `msb4rb8/`, `msb4rb8f/`).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round119-t8-seekpreload.txt`
  (NUL-delimited; 3 entry: runner T8-119, analyzer T8-119, LIMITS này).

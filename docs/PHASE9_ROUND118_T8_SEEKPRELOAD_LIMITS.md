# PHASE9 ROUND118 T8 — SEEK/PRELOAD: tách max-size khỏi ring + chấm lại F2 + đo chi phí fallback

- **Đợt:** 118, luồng T8. **Ngày:** 2026-11-15 (UTC). **Boot:** lúc viết
  prereg `uptime -s` = 2026-11-15 10:48:26Z — boot **#54** (id
  `48a82db1…`, theo T7 đợt 118; gap #53→#54 = 1h01'18"). Không có
  reboot nào trong lúc T8 đo (uptime -s không đổi từ prereg tới cuối
  driver 12:47:29Z; follow-up CTL4 cũng xong trước reboot — xem
  Addendum reboot #55 ở §6).
- **Cây:** `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b`,
  `media.ts` md5 `2c384ed13703809d5e999311147745e7` — **không đổi
  trước/sau mọi leg** (verify trước/sau leg A, B, C1, C2 + follow-up
  CTL4). Không có patch production nào; mọi leg đều probe-only.
- **Prereg:** `hidden_files/round118-t8/prereg-t8.md` — viết TRƯỚC mọi
  đo (kể cả smoke).
- **Tiếp nối:** T9 (`docs/PHASE9_ROUND117_T9_SEEKPRELOAD_LIMITS.md`),
  S9, R8, N2.

## 0. Verdict — 4 leg, 3 kết luận khẳng định + 1 đính chính quan trọng

| Hạng mục | Kết quả |
|---|---|
| Leg (a) — trần bám theo max-size hay ring? | **KHẲNG ĐỊNH H6 (giá trị điển hình):** MSB4RB8 (max-size 4 MiB + ring 8 MiB) cho C = **17,421 s** (median 3 run đăng ký; smoke cũng 17,421) — giống hệt CTL (msb4/rb4) và khác hẳn RING8 (msb2/rb8: 9,22 s). Trần KHÔNG đi theo ring. **Ngoại lệ:** 1/3 run đăng ký (r1) vượt lên **27,02 s** — xem §1, không giấu. |
| Leg (b) — F2 seek lạnh (bar cũ ≤940 ms) | **KHÔNG ĐẠT trên chế độ chậm; ĐẠT trên chế độ nhanh.** 6 run MSB4RB8: seekImmMs **2311–4284 ms** (valid sạch 3/4: 4284/2906/3186). Nhưng seeking→seeked = **0,0 s mọi run** — thời gian nằm ở khởi động pipeline, không phải seek. Chế độ nhanh (CTL4, cùng boot): **539/627 ms** — trong bar cũ. Xem §2. |
| Leg (c1) — chi phí fallback (n=1) | **Đo được 1 mẫu duy nhất** (race chỉ nổ 1/20 run): hồi phục full buffer sau **0,94 s**; loadstart HTTP sau **0,21 s**; progress đầu sau **0,39 s**; **0 byte fetch lại** (cache); frames "mất" 277 **bị nhiễm tải** (không quy được cho fallback). KHÔNG báo p95 (n<4, theo prereg). Xem §3. |
| Leg (c2) — Chromium có race tương tự? | **KHÔNG.** 6/6 run Chromium hợp lệ: **0 error-event, 0 fallback**, finalSrc blob 6/6, phát tới cuối 6/6. Race blob là **đặc thù WebKitGTK** (môi trường đo), không phải sản phẩm (Chromium/Electron). Xem §4. |
| Mode lỗi không-do-wrap | **Tái hiện LẦN 4** (CTL4 SEEKFAST r2): firstPull đúng, 0 wrap, 0 bogus, 1 qtdemux chết — xem §3.3. Tần suất nay 4/~80 run (~5%). |
| Production `apps/web/src/media.ts` | **KHÔNG ĐỔI** (md5 `2c384ed1…` trước/sau). Không có patch nào. |

**Ý nghĩa trung thực:** (a) giả thuyết T9 §6 được khẳng định ở giá trị
điển hình trên 2 cấu hình mới (tổng cộng C=17,421 ở 22/23 run Q8PAUSED
msb4 trên boot #54 — §1); (b) F2 như định nghĩa hiện tại đo khởi động
pipeline chứ không đo seek — bar cũ chỉ có ý nghĩa khi đi kèm chế độ
tải/khởi động, và 2 run CTL4 nhanh cho thấy bar vẫn đạt được khi
pipeline khởi động nhanh; (c) fallback rẻ: <1 s để buffer đầy lại và
0 byte mạng thêm (nhờ cache) — đây là số đo đầu tiên về chi phí
fallback, dù chỉ n=1; (d) quan trọng nhất cho parent: **B-Q8-1 là vấn
đề của môi trường đo WebKitGTK, không phải của sản phẩm** — trên
Chromium (engine production thật) cùng scenario không hề có race, và
buffer đầy trong ~0,1 s thay vì kẹt ở trần 17 s.

## 1. Leg (a) — Đối chứng tách max-size khỏi ring (Q8PAUSED, MSB4RB8)

**Cấu hình:** `J2_QUEUE2_MAX_SIZE_BYTES=4194304` +
`L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, L2 max-size unset → shim
đọc: max-size-bytes=4194304 (J2 fallback), ring=8388608 (L2).
**3 run đăng ký trước** (r1–r3), cổng vào load1<60. Smoke 1 run cùng
cấu hình chạy trước (OUT riêng, KHÔNG tính vào leg).

| run | load1 (lúc chạy) | C (s) | flat5s | T_c (s) | im lặng GST | frames | finalSrc | shim | firstPull | wrap | bogus |
|---|---|---|---|---|---|---|---|---|---|---|---|
| smoke | 31,31 | 17,421 | 0,0 | 3,70 | 18,022 s | 114 | blob | OK 4194304/8388608 | `00000020…` | 0/1082 | 0 |
| r1 | 1,62 | **27,02** | 0,0 | 3,41 | 17,491 s | 153 | blob | OK | `00000020…` | 0/1082 | 0 |
| r2 | 8,43 | 17,421 | 0,0 | 3,71 | 17,611 s | 136 | blob | OK | `00000020…` | 0/1082 | 0 |
| r3 | 26,58 | 17,421 | 0,0 | 4,03 | 17,773 s | 124 | blob | OK | `00000020…` | 0/1082 | 0 |

- **Verdict H6: KHẲNG ĐỊNH (giá trị điển hình).** Median 3 run đăng ký
  = **17,421 s** — bằng CTL (msb4/rb4: 17,421 ở 4/4 run T9 + 19/19
  run SURVIVED leg C1 đợt này, §3) và gấp ~1,9 lần RING8 (msb2/rb8:
  9,22 s, T9 5/5). Đổi ring 4→8 MiB trong khi giữ max-size 4 MiB
  KHÔNG đổi trần điển hình → trần bám theo **max-size-bytes**, không
  phải ring. Số học vẫn khớp: 17,421 s ≈ 4.529.635 B video tích lũy
  (ffprobe c8) ≈ max-size 4.194.304 + 8%.
- **Ngoại lệ r1 (27,02 s) — ghi rõ, không giấu, không loại:** buffer
  nhảy 0 → [0, 27,02] trong một khoảng mẫu 100 ms (t=3,03 → 3,52) rồi
  đứng yên (flat 0,0), suspend ở t=4,0. Theo ffprobe, 27,02 s ≈
  6.946.049 B video — tức pipeline đã parse ~2,42 MB VƯỢT mức
  4,53 MB của trần 17,421 trước khi suspend. Trần do đó KHÔNG phải
  cap byte cứng ở max-size: có overshoot phụ thuộc scheduling.
  **Không quy cho tải:** r1 là run yên nhất leg A (load1 1,62) nhưng
  14 run yên khác ở leg C1 (CTL4, load1 0,5–2,15) đều cho 17,421 —
  giả thuyết "yên → vượt" bị bác bởi chính dữ liệu này. Tần suất
  overshoot: **1/23 run Q8PAUSED msb4 trên boot #54** (leg A 1/3 +
  smoke 0/1 + C1 0/19). Cơ chế chưa rõ; không suy diễn thêm. Verdict
  H6 giữ ở mức "giá trị điển hình", không tuyên bố cap cứng.
- **H1 (trần buffer khi paused) tái khẳng định:** suspend → 0 progress
  sau suspend, im lặng GST ~17,5–18,0 s, flatness 0,0 — ở cả 3 run
  (và 19/19 run C1). Con số trần phải luôn ghi kèm cấu hình queue2.
- **Ring 8 MiB > file (8.388.608 > 8.182.985):** 0 wrap pull trong cả
  leg (0/3 run, ~3.200 pull) — nhất quán N2/T9-RING8; không có bằng
  chứng mới nào về wrap ở cấu hình này.

## 2. Leg (b) — SEEKFAST sạch chấm lại F2 + phát hiện khởi động pipeline 2 chế độ

**Cấu hình:** MSB4RB8 (như leg a). **6 run** Q8SEEKFAST (4 chính +
2 dự phòng; cổng sạch Addendum D: 2 mẫu load1<3 + bracket trước/sau).

| run | hợp lệ? | load1 (case) | seekImmMs | loadstart→loadedmeta | seeking→seeked | seekedOk | finalCt | finalSrc | frames | errEvents |
|---|---|---|---|---|---|---|---|---|---|---|
| r1 | ✓ | 2,01 | **4.284** | 4,41 s | 0,0 s | ✓ | 32 | blob | 130 | 0 |
| r2 | ✗ (sau 19,01) | 4,30 | 2.590 | 2,30 s | 0,0 s | ✓ | 32 | blob | 184 | 0 |
| r3 | ✓ | 1,44 | **2.906** | 2,90 s | 0,0 s | ✓ | 32 | blob | 200 | 0 |
| r4 | ✗ (sau 14,16) | 0,37 | 2311 | 2,42 s | 0,0 s | ✓ | 32 | blob | 168 | 0 |
| r5 | ✗ (sau 44,72) | 15,08 | 4.175 | 4,17 s | 0,0 s | ✓ | 32 | blob | 112 | 0 |
| r6 | ✓ | 0,98 | **3.186** | 3,08 s | 0,0 s | ✓ | 32 | blob | 111 | 0 |

- **Verdict bar cũ (≤940 ms): KHÔNG ĐẠT trên 6/6 run MSB4RB8 này**
  (valid sạch 3/3 đều vượt: 4284/2906/3186; median valid = 3186 ms).
  Nhưng **seekImmMs KHÔNG đo seek**: seeking→seeked = 0,0 s ở cả 6
  run — toàn bộ thời gian là **loadstart→loadedmetadata (2,30–
  4,41 s)**, tức khởi động pipeline (typefind + qtdemux + buffer đầu).
  Bar F2 như định nghĩa hiện tại thực chất là bar khởi động pipeline.
- **Phát hiện mới — khởi động pipeline có 2 chế độ trên cùng boot #54:**
  leg C1 (CTL4, Q8PAUSED, 20 run, cùng boot) cho T_c **lưỡng phân**
  rõ rệt: r2–r6 **3,68–6,51 s** (chế độ chậm) vs r7–r20
  **0,43–0,80 s** (chế độ nhanh). Cùng cấu hình, cùng boot — nên độ
  trễ khởi động biến thiên theo **giai đoạn thời gian**, KHÔNG theo
  cấu hình queue2. Tất cả run leg B (11:56–12:23Z) rơi vào giai đoạn
  chậm; các run CTL4 follow-up (12:50–12:52Z) rơi vào giai đoạn nhanh.
  **Hệ quả:** không được quy sự chậm của leg B cho cấu hình MSB4RB8
  (giả thuyết cấu hình đã bị dữ liệu C1 bác — xem §2.1). Nguyên nhân
  của giai đoạn chậm **chưa xác định được**: load1 trung bình không
  giải thích được run r6 (bracket yên trước/sau 1,48/0,58 mà vẫn
  3,08 s khởi động) — load1 là trung bình 1 phút, có thể bỏ lỡ spike
  ngắn trong vài giây đầu, hoặc còn yếu tố khác. Ghi là chưa rõ,
  không suy diễn.
- **§2.1 Đối chứng CTL4 (follow-up sau driver, ngoài prereg — ghi rõ
  là thêm sau, không phải run đăng ký trước):** 2× Q8SEEKFAST CTL4
  (J2=4194304, L2 unset), cùng boot #54, tải yên (load1 0,63/1,25):
  seekImmMs **539 ms / 627 ms**, loadstart→loadedmeta **0,52 s /
  0,75 s** — trở lại đúng dải cũ (Q8 653/810, R8 760–1.008). Đây là
  bằng chứng trực tiếp rằng trên cùng boot, khởi động nhanh là có thể
  và bar cũ vẫn đạt được khi pipeline khởi động nhanh.
  - Lưu ý: run r2 follow-up rơi về http (finalSrc http, errEvents 1
    @0,64 s) — xem §3.3 (mode không-wrap lần 4). Seek vẫn xong
    (627 ms) và phát tới cuối (384 frames, finalCt 32) nhờ fallback.
- **Gộp số F2 (chỉ dải nhanh — không gộp 2 chế độ):** 8 lượt trước
  (653/810/997/794/1.008/760/2.271/1.399, median 903,5 ms) + 2 lượt
  CTL4 nhanh (539/627) → **10 lượt, median 802 ms**, range
  539–2.271 ms. 6 lượt MSB4RB8 chế độ chậm (2311–4284 ms) báo riêng,
  không gộp (chế độ khác). Đề xuất bar phân phối S9 §6 (median ≤1,0 s
  / p90 ≤1,2 s / ≥6 run): trên dải nhanh 10 lượt, median 802 ms ✓,
  p90 ≈ 1.399 ms ✗ (do 2 lượt T9 nhiễm tải) — vẫn chưa đạt nếu gộp
  cả lượt nhiễm; T8 không tự áp bar mới, chỉ báo số.
- **Khuyến nghị cho parent (không tự quyết):** định nghĩa lại F2 để đo
  seek thật (vd seekImmMs tính từ lúc loadedmetadata, hoặc seek sau
  khi đã buffer) — vì như hiện tại nó đo khởi động pipeline; hoặc giữ
  nguyên định nghĩa nhưng chấm kèm cổng chế độ nhanh. Nếu giữ nguyên,
  bar ≤940 ms vẫn đứng được trên dải nhanh (2/2 CTL4 + 6/8 lượt cũ).

## 3. Leg (c1) — Đo chi phí fallback (Q8PAUSED control CTL4, 20 run)

**Cấu hình:** CTL4 (`J2_QUEUE2_MAX_SIZE_BYTES=4194304`, L2 unset) —
đúng S9/R8/T9-CTL. **Chạy tới cap 20 run** (mục tiêu 8 FAILED không
đạt). Cổng vào load1<60.

### 3.1 Tỉ lệ race trên boot #54: 1/20 (5%)

- FAILED **1/20** (r1), SURVIVED **19/20**, STARVE 0. Shim OK
  4194304/4194304 ở 20/20 run; firstPull đúng ở 19/20 run SURVIVED;
  0 wrap / 0 bogus ở mọi run SURVIVED.
- Tỉ lệ gộp Q8PAUSED tương đương cập nhật: 19/48 (T9 §2) + 1/20 →
  **20/68 (29%)**. Tỉ lệ biến động mạnh theo leg/boot: T9-CTL 1/5,
  S9 2/5, R8 lượt sạch 5/5, T8-C1 1/20 — chưa rõ nguyên nhân (run
  FAILED duy nhất của leg này xảy ra lúc tải cực cao: load1 38,38 →
  54,80; 19 run còn lại tải 0,5–61,63 nhưng 14 run yên liên tiếp
  0,5–2,15 đều SURVIVED — gợi ý tải cao có liên quan nhưng n=1 không
  đủ để kết luận; xem §6).
- C = 17,421 s ở **19/19 run SURVIVED** (flat5s 0,0) — khớp leg A và
  T9-CTL; T_c lưỡng phân như §2 (r2–r6: 3,68–6,51 s; r7–r20:
  0,43–0,80 s).

### 3.2 Chi phí fallback — 1 mẫu duy nhất (n=1, KHÔNG p95)

Run FAILED duy nhất (r1) — dấu vân tay race ring-wrap cổ điển đầy đủ:
firstPull req_off=0 trả `16f76b79e5248c07b9c2` (byte wrap), wrap pulls
2/1.110, GST `qtdemux0: atom has bogus size 385313657` + "Internal
data stream error", errEvents 1 @ t=4,29 s → fallback HTTP → full
[0,32] trên HTTP lúc t=5,23 s → seek 16 s xong → phát tới cuối
(finalCt 32).

| Metric | Giá trị (n=1) | Ghi chú |
|---|---|---|
| recovery time (t_full_http − t_err) | **0,94 s** | từ error-event tới full [0,32] trên HTTP |
| time to http loadstart | +0,21 s sau t_err | |
| time to first http progress | +0,39 s sau t_err | |
| frames @ err | 0 | lỗi xảy ra trong lúc chờ preload, chưa decode frame nào |
| totalFrames | 107 | so với median SURVIVED 384 → "mất" 277 frame |
| frames_lost (277) | **KHÔNG quy được cho fallback** | r1 chạy dưới tải cực cao (load1 38→55): decode đói là chính. Đối chiếu T9 CTL r3 (FAILED, load1 4,48): 325 frames vs SURVIVED 369–372 → chỉ mất ~45. Số 277 ở đây phản ánh tải, không phải chi phí fallback. |
| bytes_run | 24.548.955 B (= 3 × 8.182.985) | đúng bằng median SURVIVED (24.548.955 B) |
| bytes_refetch | **0 B** | fallback KHÔNG gây thêm byte mạng nào: HTTP element lấy lại file từ browser cache (fetch tạo blob + preload http trước đó đã tải đủ file). Trên localhost + cache này, chi phí băng thông của fallback = 0. Lưu ý: baseline SURVIVED không đều — 15/20 run 3× file (24,55 MB), 5/20 run 2× file (16,37 MB); số 0 ở đây là so với median (3×). GET thứ 3 (nếu có) tới vào ~51 s sau khi run bắt đầu — initiator chưa xác định được từ log (không phải fetch tạo blob, không phải preload http ban đầu). |
| n_req /c8.mp4 | 3 (như median SURVIVED) | 1 fetch tạo blob + 1 GET http element lúc đầu + 1 GET nữa ~51 s (initiator chưa rõ — xem dòng trên). |

- **Đọc đúng:** fallback rẻ về thời gian (<1 s để buffer đầy lại trên
  localhost) và bằng 0 về băng thông mạng thêm (nhờ cache). Chi phí
  frames không đo sạch được trong mẫu này do nhiễm tải. Đây là số đo
  đầu tiên về chi phí fallback (trước đây chỉ có tỉ lệ phát đủ frames
  8/8) — nhưng n=1, không khái quát thành median/p95; đợt sau muốn
  p95 cần leg có nhiều FAILED hơn (tỉ lệ race thấp trên boot này làm
  việc đó đắt: 20 run mới được 1 mẫu).
- **Fallback phát đủ frames: 9/9 gộp** (S9 7/7 + T9 1/1 + T8 1/1) —
  run FAILED duy nhất phát tới cuối clip (finalCt 32, 107 frames
  dưới tải nặng).

### 3.3 Mode lỗi không-do-wrap — tái hiện LẦN 4 (ngoài leg C1)

- **CTL4 follow-up SEEKFAST r2** (sau driver, §2.1): error-event
  @0,64 s + fallback HTTP dù firstPull đúng `00000020…`, wrap pulls
  **0/1.144**, bogusGST **0**. GST log chỉ có **1 dòng** lỗi duy nhất:
  `qtdemux1: Internal data stream error` @0,625 s (không có dòng
  bogus, không có qtdemux0 chết). Đây là instance thứ 4 của mode này
  (R8, S9, T9, T8) trên tổng ~80 run blob (mọi protocol) (~5%).
- **Đính chính so với T9 §3:** bằng chứng "2 instance qtdemux cùng
  chết" của T9 KHÔNG khái quát được — instance này chỉ có 1 qtdemux
  chết. Cơ chế vẫn CHƯA RÕ. Fallback vẫn che được (384 frames, phát
  tới cuối). Tần suất mode này nay là 4 instance trên tổng ~80 run
  blob (mọi protocol) (~5%).
- Trong leg C1: 0 instance không-wrap (FAILED duy nhất là wrap cổ điển).

## 4. Leg (c2) — Chromium/Electron production có race tương tự không?

**Script riêng** `chromium_t8_probe.mjs`: bundle fresh-element (đúng
plugin esbuild của runner), serve trên port 8947, `pw.chromium`
headless (chromium-1254), đúng protocol Q8PAUSED (chờ blob → sample
buffered 20 s paused → seek 16 s → play wall 30 s). **6 run** (+ 1
smoke foreground trước driver, OUT riêng, cùng profile).

| run | load1 | swapMs | preloadWaitMs | preloadFull | seekDurMs | totalFrames | finalCt | finalSrc | errEvents |
|---|---|---|---|---|---|---|---|---|---|
| smoke | 2,90 | — | 386 | ✓ | — | 522 | 32 | blob | 0 |
| r1 | 1,22 | 141 | 106 | ✓ | 324 | 522 | 32 | blob | 0 |
| r2 | 1,70 | 180 | 140 | ✓ | 346 | 522 | 32 | blob | 0 |
| r3 | 1,66 | 218 | 101 | ✓ | 374 | 522 | 32 | blob | 0 |
| r4 | 1,06 | 242 | 101 | ✓ | 325 | 522 | 32 | blob | 0 |
| r5 | 0,97 | 266 | 101 | ✓ | 386 | 522 | 32 | blob | 0 |
| r6 | 0,64 | 153 | 101 | ✓ | 327 | 522 | 32 | blob | 0 |

- **Tính hợp lệ (theo prereg §4):** 6/6 run frames > 0 VÀ finalCt = 32
  → leg hợp lệ (≥5/6 yêu cầu).
- **Verdict: KHÔNG có race trên Chromium.** 0 error-event + 0 fallback
  trên 6/6 run (cộng smoke: 0/7). B-Q8-1 là vấn đề của **môi trường đo
  WebKitGTK** (pipeline GStreamer/queue2), không phải của sản phẩm
  (Chromium/Electron). "Blob race → HTTP fallback" là hành vi chỉ tồn
  tại trong probe WebKitGTK.
- **Bằng chứng phụ mạnh:** trên Chromium, preloadWaitMs chỉ **101–
  140 ms** và preloadFull=True ngay (buffer đầy [0,32] gần như tức
  thì, localhost) — **không hề có trần 17,421 s, không suspend, không
  kẹt buffer** như WebKitGTK. Seek sau buffer đầy chỉ 324–386 ms.
  (Lưu ý kỹ thuật: bufTrace wait chỉ có 2 sample/run vì vòng chờ
  break ngay khi full — preloadFull=True + finalCt 32 + 522 frames
  là bằng chứng đầy, không dựa vào 2 sample đó.)
- **Caveat:** 6 run là mẫu nhỏ cho kết luận "không có race" (n=6, 0
  lỗi → khoảng tin cậy 95% Clopper-Pearson cho tỉ lệ lỗi là [0,
  ~39%] — không loại trừ được race hiếm <39%). Kết luận đúng mức là:
  **không thấy race trong 6/6 run, và không thấy trần buffer** — đủ
  để nói B-Q8-1 không tái hiện được trên engine production, không đủ
  để tuyên bố "race tuyệt đối không tồn tại trên Chromium". Nếu parent
  muốn chắc hơn, cần leg Chromium lớn hơn (vd 20 run) — nợ mở §7.
- totalFrames = 522 ở cả 7 run (kể cả smoke) — đếm frame của Chromium
  khác WebKitGTK (384 ở run yên) — không so sánh chéo 2 engine bằng
  số này; chỉ dùng trong nội bộ từng engine.

## 5. Hệ quả production (cho parent quyết — T8 không tự quyết)

- **B-Q8-1:** T9 đã kết luận KHÔNG ĐẠT trên probe WebKitGTK; T8 bổ sung:
  trên engine production thật (Chromium) scenario này **không lỗi và
  không kẹt trần**. Parent đã quyết đợt 117 §13 mục 8 (chấp nhận race +
  fallback, ghi nhận là hành vi thiết kế) — dữ liệu T8 ủng hộ quyết
  đó theo hướng mạnh hơn: race chỉ tồn tại trong môi trường đo, và
  chi phí fallback đo được là nhỏ (0,94 s + 0 byte thêm, n=1).
  Không có patch production nào từ leg này (không cần — sản phẩm không
  có lỗi này).
- **Không đề xuất tắt prefetch / hạ ngưỡng prefetch** (giữ quyết S9).
- **F2:** bar cũ vẫn đạt được trên dải nhanh (539/627 ms CTL4 +
  median 10 lượt nhanh 802 ms); nhưng định nghĩa hiện tại đo khởi
  động pipeline, không đo seek — đề xuất định nghĩa lại (xem §2) cho
  parent quyết, T8 không tự đổi bar.
- **H6:** trần buffer khi paused bám theo max-size-bytes ở giá trị điển
  hình (17,421 s @ 4 MiB; 9,22 s @ 2 MiB) — nhưng có overshoot hiếm
  (1/23 run lên 27,02 s). Mọi con số trần từ nay phải ghi kèm cấu hình
  queue2 VÀ ghi rõ là giá trị điển hình, không phải cap cứng.

## 6. Phương pháp, caveat và nhật ký vận hành

- **Prereg trước đo:** `prereg-t8.md` ~11:55Z (trước mọi đo kể cả
  smoke). Bar + luật từng leg đăng ký trước. Follow-up CTL4 SEEKFAST
  (§2.1) và kiểm tra pull log r2 (§3.3) là thêm sau driver — ghi rõ
  là post-hoc, không phải run đăng ký trước; chúng không đổi verdict
  nào của leg chính, chỉ làm rõ (discriminator cho §2 + instance
  không-wrap #4).
- **Smoke (foreground, trước driver):** WebKit 1 run MSB4RB8: SURVIVED,
  C=17,421, shim OK, 0 wrap — harness chạy tốt trên boot #54 (OUT
  riêng `...-smoke.json`, không tính vào leg A). Chromium 1 run:
  0 lỗi, 522 frames, finalCt 32 — decode chạy được trên headless,
  không cần sửa headed.
- **Runner T8:** copy T9, chỉ đổi: chuỗi round, PORT 8944→8946, S9_DIR
  mặc định → round118-t8, + ghi log truy cập HTTP cho /c8.mp4
  (RUN-START/RUN-END + từng request range/bytes; chỉ ghi log, không
  đổi hành vi phục vụ). Không dùng vite → không cần vite lock v2
  (ghi rõ để T10 khỏi đợi cờ lock của T8). Port WebKit 8946,
  Chromium 8947; Xvfb :197/:198/:199 probe socket (không xdpyinfo).
  Shim dùng lại `l2_queue2_probe.so` md5 `b208e8de…`, không biên dịch lại.
- **Driver:** `run-t8-all.sh` chạy DETACHED (nohup+disown) 11:48:21–
  12:47:29Z, 4 leg tuần tự, exit 0. Không reboot trong lúc chạy.
  Load waves của luồng khác xuyên suốt (load1 0,5–61,63): leg A chạy
  được nhờ cổng <60; leg B mất 3/6 run vào bracket vỡ (sóng ập tới
  trong lúc chạy) nhưng vẫn đủ 3 valid; leg C1 chạy thẳng 20 run
  (không cần yên, chỉ cần <60).
- **Tải và chế độ chậm (§2):** giai đoạn chậm kéo dài ~11:48–12:32Z
  (T_c 3,4–6,5 s), giai đoạn nhanh từ ~12:32Z (T_c 0,43–0,80 s).
  Nguyên nhân giai đoạn chậm chưa xác định (load1 trung bình không
  giải thích được r6 leg B). Không suy diễn.
- **Suite liên quan:** không chạy (không có thay đổi production nào;
  cây byte-identical, md5 verify trước/sau mọi leg).
- **Thời gian:** slot cron 11:35–14:35Z; prereg 11:55Z; smoke xong
  ~12:00Z; driver 11:48–12:47Z; follow-up CTL4 12:50–12:52Z; LIMITS
  viết xong ~13:15Z. Còn dư thời gian slot.
- **Addendum — Reboot #55 (ghi sau khi đo xong, lúc kiểm cuối
  ~13:03Z):** `uptime -s` đổi từ 10:48:26Z (#54) sang **12:51:56Z** —
  máy reboot lúc đó (btime 1794747116; `uptime` 11 phút lúc 13:03:16Z;
  journal chỉ còn 1 boot, id `52d799d4…`, first entry 12:52:09Z —
  log cũ mất cùng rootfs rebuild như các boot trước). Gap #54→#55 =
  **2h03'30"**. Mọi phép đo của T8 (prereg → driver → follow-up CTL4
  xong ~12:50:45Z) đều hoàn thành TRƯỚC reboot — số liệu là dữ liệu
  boot #54, không bị ảnh hưởng. LIMITS + stage + cờ .done được ghi
  sau reboot (file workspace còn nguyên, đã verify lại: LIMITS
  25.930 B, stage 130 B, OUT JSON đủ case). **Hệ quả cho đợt 118:**
  (i) poller của T10 (pid 7662) đã chết theo reboot — cần chạy lại
  `poll118-t10.sh` theo đúng quy trình T10 đã ghi (không phải việc
  của T8); (ii) watcher của T7 cũng đã chết — T7 cần postboot #55;
  (iii) replay #55 đang chạy lúc 13:03Z (dpkg cài gstreamer1.0-tools
  12:54:42Z) — các luồng còn chạy sau T8 cần chờ postboot PASS của
  T7 trước khi đo tiếp. T8 không chạy thêm đo nào sau reboot.
- **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, production
  code, binary vào batch.

## 7. Nợ mở cho đợt sau

1. **F2:** cần parent quyết định nghĩa lại (đo seek thật thay vì khởi
   động pipeline) hoặc giữ nguyên + chấm kèm cổng chế độ nhanh. Cần
   thêm run CTL4 SEEKFAST dải nhanh để củng cố median 802 ms (hiện
   chỉ 2 run mới + 8 cũ, trong đó 2 cũ nhiễm tải).
2. **Chi phí fallback:** n=1 — muốn median/p95 cần leg có nhiều FAILED
   hơn; tỉ lệ race trên boot #54 thấp (1/20) nên đắt. Có thể gom mẫu
   FAILED qua nhiều leg/boot thay vì ép 1 leg.
3. **Chromium:** leg 6 run chưa đủ loại trừ race hiếm (<39% ở 95% CI).
   Nếu parent muốn chắc, chạy leg Chromium 20 run.
4. **Trần 27,02 s (overshoot):** cơ chế chưa rõ; cần hook theo dõi byte
   parsed trước suspend nếu muốn đóng (không ưu tiên — hiếm 1/23).
5. **Mode không-wrap:** nay 4 instance (~5%), cơ chế chưa rõ; T9 đề
   xuất hook gán qtdemux instance cho từng pull vẫn chưa làm.
6. **Chế độ chậm khởi động pipeline (§2):** nguyên nhân chưa rõ; cần
   ghi load theo giây trong lúc seek (không chỉ load1 trước/sau) ở
   leg sau để tách spike ngắn.
7. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ user quyết;
   `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet
   chỉ thử lại khi RAM đổi (u2net là fallback chính thức). Xem LIMITS
   gộp đợt 117 §10.

## 8. File và dữ liệu

- Runner T8: `benchmarks/render/webkit_blob_flaky_118t8.mjs` (copy T9 +
  PORT 8946 + access log; ~79 KB — **>37.768 B, cần `ENABLE_PRIVSEP=0`
  khi push**).
- Analyzer T8: `benchmarks/render/q8_analyze_118t8.py` (copy T9, đổi
  H/OUT mặc định).
- Script Chromium: `hidden_files/round118-t8/chromium_t8_probe.mjs`
  (KHÔNG stage — chỉ dùng trong hidden_files? Xem stage §8 cuối:
  stage runner + analyzer + LIMITS này; script Chromium + classifier
  + fallback-cost + driver + prereg ở lại hidden_files làm dấu vết).
  **Đính chính stage:** theo lệ các luồng trước, chỉ stage file trong
  repo (runner/analyzer/LIMITS); script riêng của luồng ở hidden_files
  không stage (T9 cũng không stage driver/classifier). Classifier
  `t8_classify.py` và `t8_fallback_cost.py` ở lại hidden_files.
- LIMITS này: `docs/PHASE9_ROUND118_T8_SEEKPRELOAD_LIMITS.md`.
- OUT JSON (KHÔNG stage, theo lệ `benchmarks/results/`):
  `webkit-blob-flaky-118t8-seekpreload-msb4rb8.json` (3 case),
  `...-msb4rb8-seekfast.json` (6 case),
  `...-ctlc.json` (20 case),
  `...-chromium.json` (6 case),
  `...-ctl4-seekfast.json` (2 case follow-up),
  `...-smoke.json` (1 case WebKit smoke),
  `...-chromium-smoke.json` (1 case Chromium smoke).
- Dữ liệu thô + prereg + driver + classifier + fallback-cost + log
  (KHÔNG stage): `hidden_files/round118-t8/` (`prereg-t8.md`,
  `run-t8-all.sh`, `t8-progress.md`, `t8-driver.out`,
  `t8_classify.py`, `t8_fallback_cost.py`, `chromium_t8_probe.mjs`,
  `t8-analysis-*.txt`, `t8-classify-*.txt`, `t8-fallback-cost.txt`,
  `t8-*.log`, `smoke/`, `msb4rb8/`, `msb4rb8f/`, `ctlc/`,
  `chromium/`, `ctl4f/`).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round118-t8-seekpreload.txt`
  (NUL-delimited; 3 entry: runner T8, analyzer T8, LIMITS này).

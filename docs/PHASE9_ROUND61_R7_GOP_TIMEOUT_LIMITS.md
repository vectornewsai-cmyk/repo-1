# Phase 9 — Đợt 61, luồng R7: đóng nợ đợt 60 §5.7 (Q5 GOP decoder)

Ngày: 08/11/2026 (lượt cron 03:35 +07). Đóng nợ 3 của đợt 60
(LIMITS đợt 60 §5.7 — Q5): (a) decoder timeout vẫn chạy nền sau
timeout (~28 s với sample 42 MB), (b) tốc độ decode chậm hơn P6 chưa
rõ nguyên nhân, (c) keyframe thật ≳16 MiB timeout → fail-open.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số
dưới đây đều đo/chạy thật; chỗ chưa đo được hoặc chưa giải thích được
thì ghi rõ, không mạo nhận. Giờ trong file này là +07 (log máy ghi
UTC, đã cộng 7 giờ).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **(a) ĐÃ SỬA THẬT — timeout nay hủy decoder nền:** nguyên nhân thật
   là `runTrialDecode` chỉ race probe với timer mà không báo gì cho
   probe khi timeout thắng; browser probe chỉ `close()` decoder trong
   `finally` sau khi `flush()` xong → decode 42,5 MB chạy dở tới
   **42.983 ms** sau khi timeout 2500 ms đã trả fail-open (đo lại lần
   này, tải nặng; Q5 đo ~28 s). Fix: `AbortSignal` xuyên suốt
   (`GopTrialDecodeProbe` nhận thêm `signal?`, `runTrialDecode`
   `abort()` khi timeout thắng, browser probe `close()` ngay khi
   abort). Đo headed sau fix: probe **settle 182 ms sau abort**
   (abort ở 2504,3 ms → settle 2686,3 ms), tức nhanh hơn ~236× so với
   42.983 ms; `runTrialDecode` thật trên 42,5 MB trả về 2576–2728 ms
   fail-open. Test Node mới 6/6 (đỏ-trước 3/6 — đúng 3 test assert
   signal/abort).
2. **(b) ĐÃ GIẢI THÍCH BẰNG SỐ — Q5 chậm là do tải VM, KHÔNG phải
   code:** đo lại decode trực tiếp cùng fixture P6/Q5 khi VM yên
   (loadavg ~1,2–2,0): 300 KiB 72 ms (O6: 69,5), 4,1 MB 604 ms (O6:
   622,6), 9,7 MB 1961 ms (P6: 1905), 19,7 MB 2958 ms (P6: 2854) —
   khớp P6/O6 trong ~4%. Đường decode P6→Q5 không đổi (Q5 chỉ đổi cap
   + comment). Cùng một lượt đo, khi loadavg leo 1,2 → 17 (các luồng
   đợt 61 khác chạy song song), vòng hiệu chuẩn CPU chậm 2,1 s →
   9,5 s và decode 30,7 MB chậm 5,3–9,4 s. Không sửa code cho (b).
3. **(c) KHÔNG SỬA TIMEOUT — đã đo ngưỡng, để nợ mở có số đo:**
   đường cong decode lúc yên cho ngưỡng timeout 2500 ms ở **~15–16
   MiB** (nội suy 15,1 MiB; P6 tính 16,3 MiB — khớp, xem §2.3);
   lúc tải như Q5 (0,5–0,8 ms/KiB) ngưỡng chỉ **~3–5 MiB**. Không
   tăng trần (kẹt main thread — P6 §6.3 đã quyết cần ý parent), không
   chia nhỏ decode (VideoDecoder bắt buộc 1 access unit trọn — P6
   §1.2), và ngay cả bỏ trần thì công thức cũng chỉ cho ~12,6 s cho
   42 MB trong khi decode thực tế lúc tải là 26–34 s — tăng trần
   không sửa chắc được. Cách sửa đúng là decode ở worker nền
   (M10 §8.4) — ngoài phạm vi một luồng, để nợ mở (§6.1).
4. **Test Node mới 6/6; hồi quy GOP: Q5 15/15, N10 17/17, P6 16/16,
   M10 28/28, L8 23/23, T3 10/10, I6 25/25** (O6 17/18 ở lượt chính
   — flake thời gian đã biết, xem §4.1). **tsc web + desktop: 0 lỗi.
   vite build pass** 26,29 s (chỉ cảnh báo chunk > 500 kB có sẵn).
5. **Outlier T3-null 4,9 s ở probe fix KHÔNG lặp lại:** probe tập
   trung đo lại null ngay sau probe: **481,2 ms**, sau 2 s: 374,9 ms,
   null sạch lần đầu: 613 ms (loadavg 13–18) — 4,9 s là outlier cùng
   lớp với 19,8 s của Q5, không phải hành vi của đường null, không
   dùng làm số đại diện. Chi phí một lần sau abort: decode nhỏ đầu
   tiên sau trial-decode bị abort mất ~420–480 ms (so với ~119 ms
   tươi / ~170 ms sau decode xong bình thường) — chi phí teardown
   decoder, có giới hạn, 1 lần (§2.5).

## 1. Thiết kế fix (a)

### 1.1 Nguyên nhân thật (đã đo, không đoán)

`runTrialDecode` (code cũ) làm `Promise.race([probePromise,
timeout])`: khi timer thắng, hàm trả fail-open ngay nhưng
**không có kênh nào báo cho probe dừng lại**. Probe production
(`createBrowserTrialDecodeProbe`) tạo 1 `VideoDecoder`, gọi
`dec.decode(chunk 42,5 MB)` rồi `await dec.flush()`; `dec.close()`
chỉ nằm trong `finally` — tức chỉ chạy khi flush xong. Decoder cứ
decode hết sample 42,5 MB ở tiến trình media rồi mới settle:
Q5 đo ~28 s (loadavg 5–9); lần này đo lại **42.983 ms**
(loadavg 12–17, §2.1). Trong thời gian đó decoder giữ CPU (1 nhân
đầy — chromeCPU% ~40–97% trong log runner) + ~42 MB sample trong
RAM, và mọi lần mở file / decode sau đó đều tranh CPU với nó.
Đây không phải leak (cuối cùng vẫn settle, outcome true), mà là
công việc nền vô ích sau khi verdict đã trả.

### 1.2 Cơ chế đã chọn: AbortSignal + VideoDecoder.close()

- `GopTrialDecodeProbe` nhận thêm tham số thứ 3 tùy chọn
  `signal?: AbortSignal`. Probe cũ 2 tham số vẫn gán được cho kiểu
  mới (test cũ không đổi — hồi quy L8/M10/N10/O6/P6/Q5 xanh).
- `runTrialDecode` tạo 1 `AbortController`, truyền `signal` cho
  probe, và `controller.abort()` ngay trong nhánh timeout thắng
  race. Probe thắng race thì KHÔNG abort (khóa bằng test).
- Browser probe: đăng ký listener abort ngay khi tạo decoder
  (`signal.addEventListener("abort", onAbort, {once:true})`;
  listener gọi `dec?.close()`); gỡ listener trong `finally`; kiểm
  tra `signal.aborted` trước khi tạo decoder (tránh tạo decoder vô
  ích khi đã abort). `close()` giữa chừng làm `flush()` đang chờ
  reject (AbortError) → probe settle nhanh thay vì đợi decode xong.
  **Đã kiểm chứng bằng đo headed rằng Chromium hủy thật** (§2.2:
  settle 182 ms sau abort — nếu `close()` chỉ reject sau khi decode
  xong thì settle vẫn phải ~28–43 s; nó không như vậy).
- Probe không quan tâm signal (probe inject của test cũ, probe
  function treo trong O6) thì vẫn chạy nền như cũ — không crash,
  không đổi verdict; `.catch(()=>{})` gắn từ trước vẫn chặn
  unhandled rejection khi probe reject sau abort (test R7 khóa).
- Không chọn terminate-worker: chưa có worker trial-decode nào
  (M10 §8.4); dựng worker mới là đổi kiến trúc, ngoài phạm vi
  luồng này — worker vẫn là hướng sửa đúng cho (c), xem §6.1.
- Không đổi gì ở T3/fetch/timeout/cap: T3 gọi `runTrialDecode`
  như cũ, signal chảy ngầm qua đó; timeout 200 ms / trần 2500 ms
  giữ nguyên (O6/P6).

### 1.3 Hằng số / hành vi không đổi

- Timeout trial-decode: 200 ms gốc / +0,3 ms/KiB trên 256 KiB /
  trần 2500 ms (O6) — không đổi.
- Cap 64 MiB, chunk 512 KiB, tối đa 128 chunk (Q5) — không đổi.
- Fail-open: timeout / unsupported-config / probe lỗi đều cho qua
  như cũ; chỉ decode-failed rõ ràng mới fallback.

## 2. Đo headed thật (Xvfb riêng, Chromium headed, TMPDIR riêng)

Ba lượt probe, cổng/display riêng mỗi lượt (tránh đụng luồng đợt 61
khác): baseline `:191` 8923/9419, fix `:192` 8925/9421, tập trung
`:193` 8927/9423. Fixture MP4 cũ dùng lại (P6/Q5, KHÔNG đưa binary
vào batch; gen script ở `~/scratch-round59-p6/`,
`~/scratch-round60-q5/`).

### 2.1 Baseline TRƯỚC fix (code cũ) — đo (a) + (b) + đường cong (c)

Loadavg lúc bắt đầu **1,20**, lúc kết thúc **17,70** — các luồng
đợt 61 khác leo thang giữa lượt (1-min leo 1,2 → 5,2 → 9,9 →
12,1 → 16,4 → 18,5). Mọi số dưới đây phải đọc kèm bối cảnh tải
đó; runner ghi loadavg + chromeCPU% mỗi 20 s (log
`headed-r7base.log`). Vòng hiệu chuẩn CPU (busy-loop 50M vòng,
`cpuCalibMs` — lưu ý: `i * 2654435761` vượt 2^53 nên đây là toán
float, số tuyệt đối KHÔNG phải benchmark CPU chuẩn; chỉ xu hướng
tương đối theo tải mới có giá trị): lúc đầu **3394,1 ms**, trước
mỗi fixture 2089–9468 ms (tăng dần theo loadavg), cuối
**7514,5 ms** — CPU khả dụng giảm ~4,5× trong lượt đo. Sample
được giải phóng sau mỗi fixture (khác Q5 giữ ~120 MB) để heap
không thành yếu tố nhiễu.

Decode trực tiếp sample 0 thật (probe production, ×3; 37/42 MB ×2):

| File | s0 (byte) | Decode lần lượt (ms) | Median | P6 / O6 |
|---|---|---|---|---|
| trailing-real37 (720p) | 29.245 | 156,0 / 9,3 / 10,6 | ~10 | O6 median 10,2 |
| bigkey-4k (4K) | 300.148 | 75,5 / 68,3 / 72,0 | **72,0** | O6 69,5; P6 111,4 (tải) |
| bigkey-4k-noisy (4K) | 4.107.475 | 604,5 / 584,3 / 618,1 | **604,5** | O6 622,6; P6 1213,6 (tải) |
| bigkey-4k-noisy60 (4K) | 9.683.047 | 1828,7 / 2035,6 / 1961,2 | **1961,2** | P6 1905,0 |
| bigkey-8k-noisy (8K) | 19.720.025 | 2958,5 / 2891,7 / 3064,7 | **2958,5** | P6 2853,8 |
| bigkey-8k-noisy60 (8K) | 30.727.296 | 7755,6 / 5343,5 / 9448,6 | **7755,6** | P6 5090,5 |
| bigkey-8k-noisy80 (8K) | 37.168.458 | 25518,7 / 26307,3 | — | Q5 20534 / 20770 (tải 5,3–5,5) |
| bigkey-8k-noisy100 (8K) | 42.493.646 | 33622,5 / 25913,5 | — | Q5 34601 / 27913 (tải 5–9) |

- **(b) Kết luận:** 5 fixture đầu đo lúc VM còn yên (loadavg
  ~1,2–2,0, ~100 s đầu) khớp P6/O6 trong ~4% (72 vs 69,5; 604,5 vs
  622,6; 1961 vs 1905; 2958 vs 2854). Q5 chậm (9,7 MB: 6,9 s so
  với 1,9 s) là do tải VM lúc Q5 đo (loadavg 5,3–12,05 + probe giữ
  ~120 MB sample) — KHÔNG phải do code đổi (đường decode P6→Q5
  không đổi, Q5 chỉ đổi cap + comment). Bằng chứng tải trong
  chính lượt này: cùng fixture 30,7 MB, median 7,8 s khi loadavg
  đang leo (phương sai lớn 5,3–9,4 s) so với 5,1 s của P6;
  37/42 MB đo dưới loadavg 10–17 nên chậm hơn Q5 đo dưới
  loadavg 5–9. **Không sửa code cho (b).**
- Lần decode đầu 29 KB ra 156 ms (các lần sau 9–10 ms): warm-up
  lần decode đầu tiên của trang (tạo decoder / JIT) — báo riêng,
  không dùng làm số đại diện.
- **(a) Decoder nền sau timeout (code cũ):** probe trực tiếp
  42,5 MB không timeout: `stillRunningAt2500ms: true`,
  **settleMs 42.983,3**, outcome true. Heap 82,6 → 120,6 MB quanh
  lần này. Decode nhỏ (29 KB) sau khi decoder nền settle hẳn:
  169,9 ms (dưới loadavg ~17 lúc đó).

### 2.2 Kiểm chứng fix (code mới) — đo (a) sau sửa

Loadavg lúc bắt đầu 2,86, lúc kết thúc 0,93 (1-min; 5-min 4,68).
chromeCPU% ~27–31% trong lượt (thấp — các luồng đợt 61 khác
đang chiếm CPU; xem §2.4 về hồi quy decode chậm trong lượt này).

- **Abort thủ công trên 42,5 MB** (gọi probe trực tiếp với
  AbortSignal, abort ở 2500 ms): abort ở **2504,3 ms** → probe
  settle ở **2686,3 ms** → **settleAfterAbortMs = 182 ms**,
  outcome false (decode bị hủy báo lỗi — bị race bỏ qua, đúng
  thiết kế). So với baseline 42.983 ms: **nhanh hơn ~236×**.
  Decode nhỏ ngay sau khi probe settle: 288,5 ms.
- **Đường thật `runTrialDecode` trên 42,5 MB:** trả về sau
  **2727,9 ms** (timer 2500 ms + ~228 ms trễ hẹn giờ dưới tải),
  reason `timeout-2500ms` fail-open. Decode nhỏ ×3 NGAY sau khi
  trả về: **479,3 / 197,7 / 98,7 ms** (so control 119,4 / 69,5 /
  54,1 ms — xem §2.5 về chi phí một lần sau abort).
- **T3 end-to-end 42,5 MB:** probe production → gop-range trong
  **7672,9 ms, 82 request sample, 42.493.646 byte** (fetch 82
  chunk + timeout 2,5 s; chậm hơn Q5 đo 4396,8 ms vì mỗi fetch
  Range dưới tải này đều chậm — xem §2.3). Null ngay sau:
  **4920,5 ms, 1 request, 262.144 byte — OUTLIER** (xem §2.3,
  không lặp lại ở probe tập trung).
- **Rác 40 MiB:** 97,3 ms → false (Q5: 85,6–92,1 ms — khớp;
  đường decode-failed không bị wiring abort làm hỏng).
- Heap cuối trang 298,7 MB (probe giữ nhiều sample trong scope
  qua các bước — số tham khảo, không phải transient của T3).

### 2.3 Probe tập trung — làm rõ T3-null 4,9 s + đo sạch sau timeout

Loadavg lúc bắt đầu **13,19**, lúc kết thúc **18,74** (các luồng
đợt 61 khác đang nặng). Dù tải cao, so sánh trong cùng một lượt
vẫn có giá trị:

| Lần gọi | Kết quả | Thời gian | Sample req / byte |
|---|---|---|---|
| Fetch tiền tố 256 KiB thủ công ×2 | ok | 301,3 / 174,0 ms | — |
| T3 null lần đầu (sạch) | gop-range | **613,0 ms** | 1 / 262.144 |
| T3 probe production | gop-range | 10.218,1 ms | 82 / 42.493.646 |
| Fetch tiền tố thủ công ngay sau probe | ok | 118,3 ms | — |
| T3 null NGAY sau probe | gop-range | **481,2 ms** | 1 / 262.144 |
| T3 null sau khi đợi thêm 2 s | gop-range | **374,9 ms** | 1 / 262.144 |

- **4,9 s KHÔNG lặp lại:** null ngay sau probe chỉ 481,2 ms
  (dưới loadavg 13–18), sau 2 s còn 374,9 ms; null sạch lần đầu
  613 ms. Cả ba đều cùng bậc với Q5b (23–475 ms, tải nhẹ hơn).
  Kết luận: 4,9 s ở §2.2 là outlier cùng lớp với 19,8 s của Q5
  (§2.3–§2.4 LIMITS Q5) — nhiễu nhất thời (nhiều khả năng là
  GC/scheduling stall khi heap trang ~225 MB + tải VM), KHÔNG
  phải hành vi của đường null và KHÔNG do decoder nền (decoder
  nền nay đã bị hủy sau abort — và null sau probe vẫn nhanh).
  Không dùng 4,9 s làm số đại diện.
- Fetch tiền tố 256 KiB thủ công mất **174–301 ms** dưới tải này
  (localhost, server Node 1 luồng) — giải thích vì sao T3-probe
  82 chunk mất 7,7–10,2 s thay vì ~4,4 s của Q5: fetch tuần tự
  82 request, mỗi request chậm theo tải. Đây là phí fetch, không
  phải phí decode.
- `runTrialDecode` 42,5 MB trả về sau **2576,1 ms**; đợi 1 s rồi
  decode nhỏ ×3: **419,4 / 169,0 / 106,1 ms** (xem §2.5).
- Hồi quy decode s9m ×2 trong lượt này: 15.803,1 / 10.207,6 ms
  (loadavg ~17–18 — số tải, không phải tốc độ chuẩn; xem §2.4).

### 2.4 Hồi quy decode chậm trong lượt fix — KHÔNG phải hồi quy do fix

Lượt fix (§2.2) đo s9m 5917,6 / 7193,4 ms và s30m 21997,2 /
19715,8 ms — chậm hơn nhiều so với baseline lúc yên (1961 ms /
~5–9 s) và P6 (1905 ms / 5090 ms). Đây là nhiễu tải, không phải
hồi quy do fix, vì: (1) fix không đụng đường decode (chỉ thêm
tham số signal + đăng ký listener abort — decode vẫn cùng
`configure`/`decode`/`flush`); (2) chromeCPU% chỉ ~27–31% trong
lượt fix (Chrome không giành được CPU — các luồng đợt 61 khác
đang chạy tsc/build/headed song song); (3) cùng mẫu nhiễu tải đã
thấy ở baseline (§2.1: 30,7 MB median 7,8 s khi load leo) và ở
Q5-vs-P6. Bằng chứng sạch vẫn là baseline lúc yên khớp P6/O6
trong ~4% (§2.1).

### 2.5 Chi phí một lần sau abort (quan sát mới, có giới hạn)

Decode nhỏ (29 KB) đầu tiên sau một lần trial-decode bị abort
mất **~420–480 ms** (lượt fix: 479,3 ms ngay sau khi
`runTrialDecode` trả về; lượt tập trung: 419,4 ms sau khi đợi
thêm 1 s), trong khi decode nhỏ tươi trên trang mới là 119,4 ms
(lần đầu) / ~54–70 ms (lần sau), và sau khi decoder nền settle
bình thường (không abort) là 169,9 ms. Các lần decode nhỏ tiếp
theo tụt nhanh về ~100–200 ms. Đọc đúng: đây là chi phí
teardown/khởi tạo lại decoder sau `close()` giữa chừng — **một
lần, có giới hạn ~0,3–0,5 s, chỉ trên lần decode kế tiếp** — đổi
lấy việc xóa 28–43 s decode nền vô ích. Không sửa thêm (không
phải bug chặn), chỉ ghi lại để đợt sau khỏi đo lại rồi tưởng là
hồi quy. Lưu ý: cả hai lần đo 419/479 ms đều dưới tải VM cao
nên con số tuyệt đối có nhiễu tải; hướng (chậm hơn hẳn mức nền)
nhất quán ở cả hai lượt.

### 2.6 Ngưỡng timeout (c) — đường cong lúc yên

Từ baseline lúc yên (loadavg ~1,2–2,0): 9,7 MB → 1961 ms;
19,7 MB → 2958 ms. Độ dốc đoạn này ≈ 0,102 ms/KiB; nội suy
decode = 2500 ms tại **~15,1 MiB**. Dùng độ dốc P6 (0,15 ms/KiB)
thì ngưỡng ≈ 16,3 MiB. **Ngưỡng đo được: ~15–16 MiB lúc máy
yên** — khớp khẳng định "keyframe thật ≳16 MiB timeout →
fail-open" của P6/Q5. Lúc tải như Q5 (0,5–0,8 ms/KiB) ngưỡng chỉ
còn **~3–5 MiB** (2500 ms / 0,65 ms/KiB ≈ 3,8 MiB) — ngưỡng phụ
thuộc tải, không phải hằng số máy. Công thức timeout chạm trần
2500 ms từ ~7,7 MiB nên mọi sample lớn hơn đều chung một trần
trong khi thời gian decode vẫn tăng tuyến tính theo kích thước —
đó là lý do ngưỡng tồn tại. Không đo Safari/Firefox (không có
trên VM) — NOT-MEASURED.

## 3. Test Node mới `gopTrialDecode61R7.test.ts` — 6/6

### 3.1 Đỏ-trước đã verify (chạy suite mới TRƯỚC khi sửa production)

**R7 3/6** — đúng 3 test assert signal/abort fail: timeout 50 ms
("probe phải nhận được 1 AbortSignal"), probe thắng race
("signal không được aborted sau khi probe thắng race" —
`signalSeen?.aborted` là `undefined` vì code cũ không truyền
signal), 42,5 MB ("signal phải aborted khi timeout 2500 ms
thắng"). 3 test còn lại xanh-trước (khóa hành vi, không phải
đỏ-trước — xem §3.2). Sau khi sửa: **R7 6/6**.

### 3.2 Nội dung test

- (a) Timeout 50 ms → probe nhận `AbortSignal`, `signal.aborted`
  === true sau khi trả về, probe settle < 1000 ms sau abort
  (đo thật: trả về sau 85 ms, probe settle thêm 0 ms).
- (a) Probe trả false SAU abort vẫn tính timeout fail-open
  (không lật thành decode-failed) — khóa hành vi, xanh cả trước
  (runTrialDecode vốn trả timeout bất kể probe sau đó làm gì).
- (a) Probe reject SAU abort không gây unhandled rejection
  (bắt bằng listener `process.on("unhandledRejection")` trong
  test, đợi 200 ms sau khi trả về) — khóa hành vi, xanh cả trước.
- (a) Probe thắng race thì KHÔNG abort (`signal.aborted` ===
  false lúc probe trả về và sau đó).
- (a) Probe cũ 2 tham số vẫn dùng được (tương thích ngược —
  `legacyProbe as GopTrialDecodeProbe` trả decode-ok).
- (c) Sample 42.493.646 B + probe treo → timeout đúng trần
  2500 ms (đo thật: trả về sau 2508 ms), probe bị abort và settle
  ngay (khóa `trialDecodeTimeoutForSampleSize(42_493_646)` ===
  `MAX_TRIAL_DECODE_TIMEOUT_MS`).

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round61-r7/
  run-regression-r7.sh`, sao từ Q5 + thêm dòng R7): U2 20/20, T3
  10/10, V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5
  11/11, Z4 19/19, Y4 10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4
  8/8, I6 25/25, K8 18/18, reversePlayback 10/10,
  reversePreviewGate 12/12, A6 12/12, Y6 11/11, D4 3/3, B6 8/8,
  Z6 10/10, saveToast31 15/15, structuredNotes32 12/12,
  errorDetail34Q4 35/35, L8 23/23, M10 28/28, N10 17/17, N6 32/32,
  **O6 17/18 ở lượt hồi quy chính**, P6 16/16, Q5 15/15,
  **R7 6/6**. Log `regression-r7.log`.
- **O6 17/18 là flake thời gian đã biết, KHÔNG phải hồi quy do
  đợt này (xem §4.1).** Chạy lẻ sau đó (loadavg ~8–10): 17/18,
  17/18, 15/18, 16/18, 16/18 — mọi test đỏ đều là test trừ-baseline
  thời gian của O6 (mẫu P6 §4.1 / Q5 §4.1). Giá trị timeout 200 ms
  / 1003 ms / 2500 ms được khóa chắc bằng unit test helper + test
  P6 (probe treo 12 MiB chờ ~2500 ms — xanh) + test R7 (trần
  2500 ms — xanh), không chỉ bằng test O6 này.
- Headed (Xvfb riêng, TMPDIR riêng): §2. Log `headed-r7base.log`,
  `headed-r7fix.log`, `headed-r7c.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (chạy từ `apps/web`, outDir scratch
  `~/scratch-round61-r7/build`): **pass** trong 26,29 s; chỉ cảnh
  báo chunk > 500 kB có sẵn.
- Lưu ý: các luồng đợt 61 khác chạy song song — file
  `tsconfig.json` có thể được họ thêm dòng exclude của họ sau thời
  điểm luồng này kiểm tra; luồng này chỉ thêm đúng 1 dòng của mình
  (`gopTrialDecode61R7.test.ts`), không đụng file của họ.
  `vi.json`/`en.json` KHÔNG đụng (luồng này không thêm chuỗi UI
  nào nên không cần fragment i18n).

### 4.1 O6 flake — chi tiết trung thực

- Lượt hồi quy chính (loadavg ~2–6 lúc chạy O6): O6 17/18.
- Chạy lẻ sau đó (loadavg ~8–10): 17/18, 17/18, 15/18, 16/18,
  16/18. Các test đỏ, toàn bộ đều là test thời gian trừ-baseline:
  - sample 3 MiB + probe treo: "chờ thêm 778 ms (tổng 1389 ms,
    baseline 611 ms)" — sàn 850 ms; lần khác "chờ thêm 679 ms
    (tổng 1380 ms, baseline 701 ms)", "chờ thêm 611 ms (tổng
    1214 ms, baseline 604 ms)".
  - all-mode 3 MiB + probe treo: "chờ thêm 828 ms (tổng 1339 ms,
    baseline 510 ms)".
  - probe trả false sau 500 ms: "chờ verdict 1039 ms (tổng
    1823 ms, baseline 783 ms)" — vượt trần 1003 ms do baseline
    trừ.
  - probe-true tức thì: "thực tế 1114 ms" (T3 fetch dưới tải —
    cả server Range lẫn parse đều chậm theo tải, xem §2.3: 1 fetch
    256 KiB đã mất 174–301 ms dưới loadavg 13–18).
  Mẫu này giống hệt Q5 §4.1 (732 ms so với sàn 850 ms) và P6
  §4.1. Fix R7 không đổi công thức timeout, không đổi T3/fetch,
  không đổi probe inject — probe treo trong các test này bỏ qua
  signal (function probe) nên hành vi đo vẫn là timer thuần như
  cũ. Không sửa test O6 (không phải file của luồng này; cửa sổ
  lỏng là có chủ đích). Đợt sau nếu flake lặp lại thì xem lại
  cách đo (đo timeout trực tiếp thay vì trừ baseline), không siết
  cửa sổ một cách ngây thơ.

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/gopTrialDecode55L8.ts` — (a) `GopTrialDecodeProbe`
  thêm tham số thứ 3 tùy chọn `signal?: AbortSignal` (+ comment);
  browser probe: kiểm tra `signal.aborted` trước khi tạo decoder,
  đăng ký listener abort → `dec.close()` ngay, gỡ listener trong
  `finally`; `runTrialDecode`: tạo `AbortController`, truyền
  `signal` cho probe, `abort()` khi timeout thắng race (+ comment
  header + comment hàm). Không đổi timeout, cap, fail-open,
  logic gate, probe, AVCC, T3, fetch.

ĐỔI (test — 1 dòng):

- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới
  (tiền lệ J6/K8/L8/M10/N10/O6/P6/Q5).

MỚI:

- `apps/web/src/lib/gopTrialDecode61R7.test.ts` — 6 test (§3).
- `docs/PHASE9_ROUND61_R7_GOP_TIMEOUT_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file production khác, `mp4Demux.ts`,
`gopRangeFetch39T3.ts`, `vi.json`/`en.json` (không có chuỗi UI mới
— không cần fragment i18n). Scratch + log ở
`~/scratch-round61-r7/` (probe headed ×3 + runner, regression,
red-before, build; file MP4 lớn chỉ làm fixture đo, KHÔNG đưa vào
batch).

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Keyframe thật ≳15–16 MiB (lúc yên) vẫn timeout → fail-open**
   (§2.6): trần 2500 ms là chặn cứng có chủ đích; keyframe 37,2 MB
   decode ~20–26 s, 42,5 MB ~26–34 s nên không bao giờ có verdict
   decode-ok trong trần này. Muốn chặn chắc lớp này cần decode ở
   worker nền (M10 §8.4 — chưa làm; worker thì timeout dài không
   kẹt UI và `terminate()` hủy chắc chắn hơn cả `close()`) hoặc
   tăng trần (đổi hành vi đường mở file: kẹt main thread tới
   ~5–30 s — cần quyết của parent, không tự ý đổi trong luồng này;
   và tăng trần cũng không sửa chắc được vì decode lúc tải vượt xa
   công thức). Nợ này KHÔNG đóng, chỉ đo rõ ngưỡng + lý do.
2. **Sample > 64 MiB ở stream-mode vẫn bỏ qua** (thiết kế,
   fail-open — Q5): biên không đổi trong luồng này.
3. **Keyframe thật bị đục lỗ giữa KHÔNG bắt chắc được** (Q5 §6.3,
   O6 §6.1 — nợ cũ, không đụng trong luồng này).
4. **Chi phí một lần sau abort (~0,3–0,5 s, §2.5):** decode nhỏ
   đầu tiên sau một lần trial-decode bị abort mất ~420–480 ms
   (so với ~119 ms tươi). Có giới hạn, 1 lần, đã đo ở 2 lượt;
   không sửa trong luồng này. Nếu đợt sau đo lại thấy chi phí này
   phình to (vd > 1 s) thì xem lại teardown decoder sau `close()`.
5. **T3-null 4,9 s (§2.2) là outlier chưa giải thích được tận gốc:**
   đã đo lại 3 lần đều 375–613 ms nên không phải hành vi hệ thống;
   nguyên nhân chính xác của lần 4,9 s đó (GC stall khi heap
   ~225 MB? scheduling stall dưới tải?) chưa xác định được — ghi
   rõ là outlier, không dùng làm số đại diện. Cần đợt sau theo
   dõi xem có lặp lại không (cùng lớp với outlier 19,8 s của Q5).
6. **Chưa đo Safari/Firefox thật** (không có trên VM); decoder
   Chromium là căn cứ duy nhất cho §2. `VideoDecoder.close()`
   hủy decode dở là hành vi Chromium đã đo; trình duyệt khác có
   thể khác — fail-open giữ an toàn (chậm nhất thì quay về hành
   vi cũ: chạy nền tới xong).
7. **Cửa sổ assert thời gian của test O6 sample 3 MiB khá sát sàn**
   ([850, 2500) ms cho thời gian chờ): đã flake nhiều lần dưới tải
   (§4.1). Giá trị timeout được khóa chắc bằng unit test helper +
   test P6/R7, không chỉ bằng test O6 này.
8. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); các nợ M10 §8, N10 §6, O6 §6, P6 §6, Q5 §6 (trừ
   §6.4–§6.5 đã đóng ở đây: decoder nền sau timeout + nguyên nhân
   tốc độ decode) giữ nguyên.

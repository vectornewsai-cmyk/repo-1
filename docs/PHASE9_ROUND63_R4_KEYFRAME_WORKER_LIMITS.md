# Phase 9 — Đợt 63, luồng R4: keyframe worker nền — trần thời gian, fallback, và bí ẩn T3-null

Ngày: 08/11/2026 (lượt cron 09:35 +07; giờ trong file này là +07 trừ khi
ghi rõ UTC). Đóng nợ đợt 62 §4 mục 4 (LIMITS R4 đợt 62 §6.1–§6.3):
(1) trần worker 30 s cho keyframe 42–64 MiB lúc tải nặng, (2) fallback
khi không có VideoDecoder, (3) T3-null 4,9 s của R7, (4) Safari/Firefox.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được hoặc chưa giải thích được thì ghi
rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Công thức timeout worker MỚI: tỉ lệ 1,2 ms/KiB, trần 45 s** (cũ:
   1,0 ms/KiB, trần 30 s). Đo ở 3 mức tải (§2): tốc độ decode worker
   chậm nhất (trừ fixture 4:4:4, xem §2.2) là 0,87 ms/KiB lúc yên,
   **1,00 ms/KiB tải trung bình**, 1,6–2,1 ms/KiB tải cực nặng. 1,2 ≈
   1,5× mức tải trung bình; trần 45 s bao được decode 37–42 MB ở tải
   trung bình (35–42 s). **Đo lại sau sửa (run C, §2.4): keyframe
   42,5 MB decode-ok sau 37,9 s, 37,2 MB sau 33,2 s, 47,6 MB
   (High-profile, crf3) sau 37,6 s — cả ba đều VƯỢT trần 30 s cũ nên
   trước đây fail-open, nay có verdict thật.** Tải cực nặng (64–67 s)
   vẫn vượt trần 45 s — fail-open có lý do; kéo trần lên 60–70 s cũng
   không bao được (30,7 MB lúc đó cần 64 s) nên KHÔNG kéo thêm.
2. **Fallback khi không có VideoDecoder HOẠT ĐỘNG THẬT (headed
   Chromium + Firefox, §3):** worker không có decoder → lỗi
   `no-decoder-in-worker` → fallback probe main-thread (small → true
   sau 63 ms Chromium / 165 ms Firefox, đúng 1 lần fallback); main
   không có decoder + worker có → worker cứu được (9,7 MB decode-ok
   sau 1,9 s); cả hai đều không có → fail-open `probe-error` sau
   **17,9 ms** (không decode-failed oan, không treo). Chẩn đoán được
   1 race ở HARNESS đo (không phải bug sản phẩm): wrapper worker dùng
   dynamic-import + top-level await làm rớt message (xem §3.1) — đã
   sửa bằng banner bundle, đo lại xanh.
3. **T3-null 4,9 s: KHÔNG lặp lại lần nào trong 17 lần đo thêm**
   (14 lần run A + 3 lần sau abort main-thread ở run C), max 281 ms
   dù heap 168–254 MB và tải nặng. Đã loại trừ: sau probe, sau abort
   (worker + main-thread), heap cao, phía server (prefix fetch đáp
   trong ≤0,1 s ở server). Nguyên nhân gốc của đúng 1 lần 4,9 s đó
   vẫn chưa xác định được (1/19 quan sát) — kết luận trung thực:
   transient hiếm, không phải hành vi hệ thống, không có gì để sửa
   (đường null không decode, không có bước nào để retry/sửa).
4. **Firefox ĐÃ ĐO THẬT (Playwright firefox-1572, Firefox 159.0,
   §4):** VideoDecoder CÓ trong worker (`function`,
   `isConfigSupported` = `function`); worker probe small → true
   437 ms; fallback no-vd → true 165 ms; worker 42,5 MB → decode-ok
   sau 8,8 s (trần mới 45 s). **Safari vẫn chưa đo được** (không có
   trên VM) — ghi rõ, không claim.
5. **Test Node mới 13/13; R4 cập nhật 19/19; hồi quy GOP đầy đủ
   35/35 xanh; tsc web/desktop 0; vite build pass** (worker chunk
   1,50 kB; bundle chứa `45e3`/`1.2` — công thức mới đã vào build).
6. **Nợ mới trung thực (§6):** abort 500 ms là best-effort dưới tải
   (1 lần spike 2.983 ms ở run C, không lặp lại ở run D: 507/589 ms);
   rác 40 MB fail chậm theo tải (0,42 s lúc yên → 3,1 s lúc tải
   nặng); High-profile 50–64 MB ở tải trung bình trở lên chưa có
   fixture để đo trực tiếp (ngoại suy ~50–65 s > trần 45 s → có thể
   fail-open); VM reboot giữa chừng đã giết 1 lần chạy headed (đã
   chạy lại + ghi partial ra đĩa).

## 1. Thay đổi code (đợt này)

| File | Đổi | Nội dung |
|---|---|---|
| `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` | Sửa | `WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB` 1.0 → **1.2**; `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` 30_000 → **45_000**; cập nhật comment (lý do + giới hạn mới). Không đổi kiến trúc, routing, fallback, abort. |
| `apps/web/src/lib/gopRangeFetch39T3.ts` | Sửa | 3 comment nhắc trần worker 30 s → 45 s (không đổi code chạy). |
| `apps/web/src/lib/gopTrialDecode62R4.test.ts` | Sửa | Cập nhật kỳ vọng theo công thức mới: 300.148 B → 245 ms; 4.107.475 B → 4707 ms; 9.683.047 B → 11241 ms; 42.493.646 B / 64 MiB → trần 45.000 ms. |
| `apps/web/src/lib/gopTrialDecode63R4.test.ts` | Mới | 13 test (§5): khóa công thức mới + fallback no-decoder mức unit + pre-abort. |
| `apps/web/tsconfig.json` | Sửa | Thêm đúng 1 dòng exclude cho test mới (tiền lệ J6/K8/…/R7). Không đụng dòng của luồng khác. |
| `docs/PHASE9_ROUND63_R4_KEYFRAME_WORKER_LIMITS.md` | Mới | Tài liệu này. |

Giá trị timeout mới (base 200, đã tính bằng node trước khi sửa):
300.148 B → 245 ms; 4.107.475 B → 4707 ms; 9.683.047 B → 11241 ms;
19.720.025 B → 23003 ms; 30.727.296 B → 35902 ms; 37.168.458 B →
43450 ms; 42.493.646 B → 45.000 ms (không trần là 49.691 ms);
50.246.362 B → 45.000 ms (trần); 64 MiB → 45.000 ms (trần).

## 2. Đo đường cong decode + chốt công thức (run A, Chromium 158)

Harness `~/scratch-round63-r4/` (runHeaded63R4.mjs + vdHeaded63R4.ts,
Xvfb :196, cổng 8933/9429, Chromium playwright 1254). Fixture MP4 cũ
dùng lại (P6/Q5/R7/R4) + **mới: keyframe 50,2 MB** (crf0, xem §2.2) và
**47,6 MB** (crf3, High-profile, xem §2.4). Mức tải điều khiển bằng
node busy-loop (0 / 2 / 4 hog) + ghi loadavg + cpuCalib (busy-loop
50M, chỉ xu hướng tương đối) trước mỗi bước; các luồng đợt 63 khác
chạy song song nên loadavg thực dao động — đọc số kèm loadavg/cpuCalib
ghi tại bước đó, không tin nhãn mức tải một cách mù.

Sự cố giữa chừng: **VM reboot lúc 03:03 UTC** (wtmp: reboot 03:03:26)
giết lần chạy đầu ở t≈802 s (đang ở mức heavy4, đã đo xong idle +
medium2 nhưng số chỉ còn trong log tóm tắt, không còn chi tiết).
Chạy lại từ đầu (lần 2, EXIT=0, ~18,5 phút) với partial ghi ra đĩa
mỗi 30 s (`partial-63a.json`) để reboot không làm mất số nữa. Cùng
cửa sổ đó, `chromium-1248` biến mất khỏi cache (đã cài lại 1254) —
ghi lại để đợt sau khỏi tưởng nhầm.

### 2.1 Đường cong decode WORKER (×2, outcome true hết)

| Size | idle (0 hog, cpuCalib 3158, loadavg ~4,4→1,6) | medium (2 hog, cpuCalib 7619, loadavg ~1,5→12,8) | heavy (4 hog, cpuCalib 13018, loadavg ~9,5→23,4) |
|---|---|---|---|
| 30,7 MB | 13.321 / 9.519 ms (median 13.321) | 19.061 / 18.829 ms | 40.286 / 63.815 ms |
| 37,2 MB | 7.200 / 6.997 ms | 22.807 / 35.074 ms | 73.107 / 65.407 ms |
| 42,5 MB | 21.818 / 36.224 ms | 33.900 / 41.504 ms | 67.295 / 64.373 ms |
| 50,2 MB (crf0, 4:4:4 — xem §2.2) | 1.018 / 0.711 ms | 2.297 / 2.600 ms | 8.733 / 5.080 ms |

Đối chứng main-thread ở 42,5 MB (×2): idle 29.430 / 12.680 ms;
medium 48.889 / 36.080 ms; heavy 68.169 / 58.395 ms — cùng bậc với
worker (decode dùng chung decoder; worker chỉ gỡ kẹt UI + cho trần
dài, không làm decode nhanh hơn — nhắc lại như R4). Control nhỏ:
main 17,6 / 7,4 / 7,0 ms; worker 114,1 / 58,9 / 85,9 ms.

Tốc độ decode worker (ms/KiB, trừ 50,2 MB — xem §2.2):
- idle: max **0,87** (42,5 MB: 36.224 ms / 41.499 KiB).
- medium: max **1,00** (42,5 MB: 41.504 ms).
- heavy: **1,62–2,13** (30,7 MB: 63.815 ms → 2,13; 37,2 MB → 2,01;
  42,5 MB → 1,62).
- R7 đo lúc tải (loadavg 12–18): 0,6–0,8 ms/KiB — nằm giữa medium và
  heavy của đợt này (mức tải là một dải liên tục, không phải 3 nấc
  rời; số của đợt này khớp hướng đó).

### 2.2 Vì sao 50,2 MB decode nhanh gấp ~30× (đã giải thích, không phải bug đo)

Fixture crf0 là **High 4:4:4 Predictive** (x264 lossless dùng profile
này ngay cả với yuv420p — ffprobe xác nhận), trong khi crf6/crf3 là
**High**. Decode 50,2 MB chỉ 0,02–0,18 ms/KiB (1,0 s / 49.069 KiB
≈ 0,02). Kiểm chứng độc lập bằng ffmpeg
CLI (decode frame đầu, máy này, lúc có tải nền): crf6 42,5 MB →
**56,7 s real** (user 17,5 s); crf0 50,2 MB → **3,1 s real**
(user 1,0 s) — chênh ~18×, cùng hướng với Chromium. Kết luận:
**thời gian decode phụ thuộc mạnh vào profile/cách encode, không chỉ
kích thước** — keyframe 4:4:4 lossless decode nhanh hẳn (không DCT /
không lượng tử nặng). Hệ quả cho công thức: trường hợp xấu nhất để
tính trần là keyframe **High-profile** nhiễu cao (kiểu crf6), không
phải file 4:4:4 lớn nhất. Fixture crf3 47,6 MB (High, xem §2.4) lấp
đúng chỗ này ở top-end.

### 2.3 Quyết công thức: 1,2 ms/KiB + trần 45 s (bằng số)

- **Tỉ lệ 1,2:** ≈ 1,2× tốc độ chậm nhất ở tải trung bình (1,00) và
  ≈ 1,5× tốc độ chậm nhất kiểu R7 (0,8). Ở tỉ lệ 1,0 cũ, 37,2 MB ở
  tải trung bình cần 35,1 s nhưng timeout chỉ 36,1 s (headroom
  1,03× — một ngày tải xấu hơn là fail); ở 1,2 thì timeout 43.450 ms
  so với decode 35,1 s (headroom 1,24×). 42,5 MB: 1,0 cho 41,3 s so
  với decode 41,5 s (THIẾU); 1,2 cho 49.691 ms → trần 45 s, bao
  được 41,5 s.
- **Trần 45 s (không phải 30 s, không phải 60 s):** 45 s bao được
  decode 37–42 MB ở tải trung bình (35–42 s, đo thật) và ở tải kiểu
  R7 (26–34 s). Tải cực nặng (64–67 s) vượt cả 60 s: 30,7 MB cần
  63,8 s, 42,5 MB cần 67,3 s — kéo trần lên 60–70 s chỉ đổi lấy mở
  file chậm thêm mà vẫn không bao được tải cực nặng, nên DỪNG ở 45 s.
  Đánh đổi ghi rõ: file có keyframe 0 > ~7,7 MiB (hiếm — 8K/bitrate
  rất cao) nay mở chậm nhất thêm ~15 s so với trước (trần decode),
  đổi lấy verdict thật thay vì fail-open; UI không đóng băng (decode
  ở worker); file thường không chạm tới.
- **Giới hạn còn lại của công thức:** High-profile 50–64 MB ở tải
  trung bình trở lên ngoại suy ~50–65 s (theo 1,0 ms/KiB) > trần
  45 s → có thể fail-open (chưa có fixture High-profile cỡ đó để đo
  trực tiếp; crf3 47,6 MB là mốc cao nhất đã đo — xem §2.4).

### 2.4 Đo lại sau sửa (run C, code mới 1,2/45 s)

Harness runHeaded63R4c.mjs + vdHeaded63R4c.ts (Xvfb :198, cổng
8939/9433). Fixture crf3 mới: sample 0 = **47.608.364 byte, High
profile 7680×4320** (ffprobe xác nhận).

| Bước | Điều kiện | Kết quả |
|---|---|---|
| C1 medium (2 hog, cpuCalib 7707, loadavg ~7,6–11,0) | worker RTD 37,2 MB | **decode-ok sau 33.202 ms** (timeout 43.450) — trần 30 s cũ sẽ fail |
| C1 medium | worker RTD 42,5 MB | **decode-ok sau 37.911 ms** (timeout 45.000) — trần 30 s cũ sẽ fail |
| C1 medium | worker RTD 47,6 MB crf3 (High) | **decode-ok sau 37.633 ms** (timeout 45.000) — top-end High-profile đã bao được ở tải trung bình |
| C2 heavy (4 hog, cpuCalib 6614 — THỰC TẾ nhẹ hơn medium lần này vì tải nền giảm, loadavg 5,33→2,67) | worker RTD 42,5 MB | **decode-ok sau 41.915 ms** (timeout 45.000) |
| C3 medium | T3 e2e 42,5 MB đường mặc định | gop-range, 82 request sample, 42.493.646 byte, **37.069 ms** |
| C4 | abort worker 500 ms trên 42,5 MB | **2.983,2 ms** mới trả về (xem §2.5 — spike, không lặp lại ở run D); verdict đúng `timeout-500ms` fail-open; decode nhỏ ngay sau 164,8 ms |
| C5 | null sau ABORT MAIN-THREAD (giả thuyết T3-null còn lại) | null ×3: 171,0 / 99,5 / 123,7 ms; prefix fetch 75,8 ms; abort main-thread 696,4 ms (timer 500 + trễ ~196 ms dưới tải) |
| C6 | rác 40 MiB qua worker (trần mới) + small RTD | rác → **false sau 3.078,9 ms** (lúc tải nặng; R4 lúc yên 421,3 ms — xem §2.5); small qua worker → `timeout-200ms` fail-open (harness artifact: sample nhỏ KHÔNG đi worker ở production — plan chỉ đưa ≥ ~7,7 MiB sang worker) |

Lưu ý về C2: nhãn "heavy" chỉ là số hog; cpuCalib thực tế (6614)
thấp hơn C1 medium (7707) vì các luồng khác giảm tải giữa chừng —
bằng chứng tải cực nặng (64–67 s) vẫn là run A heavy4 (cpuCalib
13018), không phải C2. Không dùng C2 để claim "heavy đã bao được".

### 2.5 Hai số lệch cần giải thích (không giấu)

1. **C4 abort 2.983 ms (thay vì ~501 ms như R4):** run D (§3.3)
   phân rã cho thấy abort worker thường chỉ 507–589 ms; C4 là spike
   1 lần, không lặp lại. Cơ chế có thể: timer/event-loop đói CPU +
   teardown media sau 1 lần decode 42 MB vừa xong (C2+C3 ngay trước
   C4) — cùng lớp với overshoot 1.196 ms của abort main-thread ở D5.
   Verdict + terminate luôn đúng; chỉ wall-clock trả về trễ. Không
   sửa code (timer là best-effort dưới tải; xem §6.3).
2. **C6 rác 3.079 ms (thay vì 421 ms):** rác fail chậm theo tải như
   decode thật (0,42 s lúc yên → 3,1 s lúc tải nặng + heap 239 MB)
   — decoder phải nhai 40 MB dữ liệu ngẫu nhiên trước khi lỗi, dưới
   CPU đói. Verdict vẫn đúng (false, không lọt). Không phải hồi quy.

### 2.6 T3 end-to-end ở run A (code cũ — để đối chiếu, không phải verdict mới)

T3 mặc định trên 42,5 MB: heavy4 **33.111 ms**, idle **33.387 ms**,
cả hai gop-range, 82 request sample. Tổng thời gian này KHÔNG phân
biệt được decode-ok vs timeout fail-open (lý do trial không lộ ra
ngoài ở T3) — ở tải nặng, decode 64–67 s > trần 30 s cũ nên gần như
chắc là timeout fail-open; ở idle thì mơ hồ. Bằng chứng verdict sau
sửa lấy ở run C (RTD trực tiếp, có reason rõ ràng — §2.4), không suy
diễn từ tổng thời gian T3.

## 3. Fallback khi không có VideoDecoder (run B/B2, Chromium + Firefox)

### 3.1 Chẩn đoán treo ở harness (không phải bug sản phẩm)

Lần chạy B đầu (runHeaded63R4b.mjs): B0 sanity xanh (worker small →
true 109,7 ms; main → true 13,7 ms), nhưng B1 (worker-no-vd) **treo
cả 2 lần gọi, watchdog 60 s ×2, fallbackCalls = 0**, dù wrapper đã
báo `vdType: "undefined"` (xóa thành công). Chạy lại với wrapper CÓ
TRACE từng bước (run B2 v1): trace cho thấy `start → vd-deleted →
import-start → import-done` đầy đủ (73 ms / 12 ms), nhưng KHÔNG BAO
GIỜ có `message-rx`, không result/error, không worker.onerror.

Nguyên nhân gốc (suy luận từ bằng chứng, khớp cả 2 trình duyệt):
wrapper dùng **dynamic-import + top-level await** trong worker —
message main gửi ngay sau `new Worker()` tới trong lúc worker còn
đang chờ import, khi `onmessage` vẫn là null → **message bị rớt
lặng lẽ** (event không có listener thì rớt; không queue lại). Ở
đường production, worker gán `onmessage` đồng bộ ngay khi module
đánh giá xong (trước khi event loop xử lý message) nên không có cửa
sổ này — **production không bị ảnh hưởng**. Bằng chứng chéo: cùng
mẫu treo lặp lại ở Firefox F2 (wrapper tương tự) — không phải quirk
của 1 trình duyệt.

Sửa harness (không sửa production): bundle worker-no-vd bằng
esbuild **`--banner:js=`** — code xóa VideoDecoder chạy ĐẦU TIÊN,
đồng bộ, trong cùng module đánh giá ban đầu (trước khi `onmessage`
được gán), kèm báo `vdType` qua BroadcastChannel `r4b-vd-check`.
Đo lại xanh (xem §3.2). Bài học: test worker "không có X" phải
dùng banner-bundle, không dùng wrapper dynamic-import.

### 3.2 Kết quả sau sửa (run B2-final, Chromium 158)

| Bước | Điều kiện | Kết quả |
|---|---|---|
| B0 sanity | worker + main, small 29 KB | worker → true 100,5 ms; main → true 11,1 ms |
| B1 worker không có VideoDecoder | small, fallback = probe main-thread | **true sau 63 ms, fallbackCalls = 1**; banner báo `vdType: "undefined"` ×2 (1 cho B1, 1 cho B2) |
| B3 main không có decoder, worker có | sample **9.683.047 B** (đi worker thật) | **decode-ok sau 1.884 ms** (lần chạy B2 trước: 5.387 ms — chênh theo tải); `probeAfterDeleteNull: true`, `viaWorker: true`, timeout 11.241 ms |
| B2 cả hai đều không có decoder | sample 9.683.047 B | **fail-open `probe-error: trial-decode worker failed` sau 17,9 ms**; passed true, skipped true — không decode-failed oan, không treo |

Đính chính thiết kế test: lần chạy B đầu dùng sample 4.107.475 B
cho B3/B2 — sai vì timeout main-thread của nó chỉ 1327 ms < trần
2500 ms nên plan KHÔNG đi worker (trả `no-decoder` fail-open sau
0,4 ms — đúng hành vi nhưng không đo được đường worker). Đã sửa
thành 9.683.047 B ở v2 (timeout chạm trần → viaWorker true).

Chưa đo headed: rác 40 MB qua đường worker-no-vd → fallback
(chỉ đo small headed + unit — xem §6.4; worker báo lỗi TRƯỚC khi
nhìn sample nên đường này không phụ thuộc nội dung sample).

## 4. Firefox (và Safari)

Chạy bằng Playwright firefox-1572 (**Firefox 159.0**), headless,
server riêng cổng 8937 (runFirefox63R4.mjs + vdFirefox63R4.ts).
Lần chạy đầu treo ở F2 do cùng race wrapper §3.1 (và lỗi import
`playwright` — `npx playwright install` không đặt package vào
repo-1/node_modules; đã sửa bằng `playwright-core` + `executablePath`
trỏ thẳng binary firefox-1572). Lần chạy lại với banner bundle:
**EXIT=0, toàn bộ xanh:**

| Bước | Kết quả |
|---|---|
| F0 VideoDecoder trong worker | `vdType: "function"`, `hasIsConfigSupported: "function"` — Firefox CÓ WebCodecs trong DedicatedWorker |
| F1 worker probe, small | true sau 437 ms |
| F2 worker-no-vd → fallback | **true sau 165 ms, fallbackCalls = 1** — fallback chạy thật trên Firefox |
| F3 main-thread probe, 4,1 MB | true sau 594 ms |
| F4 worker probe, 42,5 MB | **decode-ok sau 8.808 ms** (viaWorker true, timeout 45.000 ms) — nhanh hơn Chromium lúc yên (10,4–19 s; tải khác nhau, không so trực tiếp) |

**Safari: CHƯA ĐO ĐƯỢC** (không có Safari trên VM; cũng không có
macOS/iOS). `VideoDecoder`/`Worker` trên Safari là hành vi chưa kiểm
chứng — fail-open giữ an toàn (không decoder → `no-decoder` cho qua;
worker lỗi → fallback main-thread → probe-error fail-open). Không
claim gì về Safari.

## 5. T3-null 4,9 s của R7 — điều tra xong, kết luận: transient hiếm

Tổng số quan sát sau R7: **1 lần 4,9 s / 19 lần đo** (R7 tập trung
3×: 375–613 ms; R4 1×: 30,6 ms; **đợt này 17×** — run A 14× +
run C C5 3× sau abort main-thread). Lần này:

- Run A, heavy4 (loadavg ~8–11, heap 168–212 MB): null đối chứng
  207,9 / 124,6 / 97,8 ms; null ngay sau probe 42,5 MB 94,6 / 110,8 /
  107,5 ms; null sau abort worker 108,5 / 181,6 ms. Prefix fetch thủ
  công 73,7 / 12,0 ms (trước probe) và 6,5 / 77,6 ms (sau probe).
- Run A, idle (heap 211–254 MB): null đối chứng 101,6 / 93,2 /
  92,5 ms; null sau probe 280,9 / 112,5 / 164,4 ms (max toàn đợt);
  null sau abort 197,5 / 107,1 ms.
- Run C C5 (sau abort main-thread 42,5 MB): 171,0 / 99,5 / 123,7 ms.
- Longtask trong cửa sổ null: hầu hết KHÔNG có; 1 lần có 2 longtask
  57–69 ms (không giải thích được 4,9 s). GC entries: KHÔNG đo được
  (`'gc'` không nằm trong `PerformanceObserver.supportedEntryTypes`
  của Chromium này — ghi rõ, không mạo nhận đã loại trừ GC).
- Phía server: mọi request tiền tố của các lần null đều được đáp
  trong ≤ 0,1 s theo log server (request/response cùng mốc 0,1 s) —
  server sạch; nếu null chậm thì chỉ có thể do phía client.

Đã loại trừ bằng đo: (a) null sau probe, (b) null sau abort worker,
(c) null sau abort main-thread, (d) heap cao 210–254 MB, (e) tải
nặng (loadavg tới ~11 + 4 hog), (f) phía server/fetch. Còn lại:
transient không quan sát được (major GC stall hoặc scheduling stall
nhất thời — cùng lớp với outlier 19,8 s của Q5). **Không có code
để sửa:** đường null không decode, không có bước nào để retry hay
tăng timeout; 4,9 s không phải hành vi hệ thống. Đóng điều tra ở
đây; nếu đợt sau thấy null > 1 s lặp lại thì mở lại với trace
`--js-flags=--expose-gc` + CDP Performance timeline.

## 6. Kiểm chứng gộp của luồng

- Test Node mới `gopTrialDecode63R4.test.ts` — **13/13** (§5 dưới).
  Đỏ-trước: test mới khóa hằng số 45.000/1,2 — code cũ (30.000/1,0)
  trượt đúng các assert đó (đã tính trước bằng node: công thức cũ
  cho 3956/9401/30000 so với mới 4707/11241/45000).
- Test R4 cập nhật — **19/19**.
- Hồi quy GOP đầy đủ (script `~/scratch-round63-r4/
  run-regression-r4-63.sh`, sao từ R4 + thêm dòng R4-63): U2 20/20,
  T3 10/10, V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5
  11/11, Z4 19/19, Y4 10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8,
  I6 25/25, K8 18/18, reversePlayback 10/10, reversePreviewGate
  12/12, A6 12/12, Y6 11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31
  15/15, structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23,
  M10 28/28, N10 17/17, N6 32/32, O6 18/18, P6 16/16, Q5 15/15,
  R7 6/6, R4 19/19, **R4-63 13/13**. Log `regression-r4-63.log`.
- Headed: run A (đường cong + T3-null, 2 lần chạy do VM reboot —
  xem §7), run C (đo lại sau sửa), run D (phân rã abort), run B/B2
  (fallback), run FF (Firefox). Log `headed-r4-63a2.log`,
  `headed-r4-63c.log`, `headed-r4-63d.log`, `headed-r4-63b2c.log`,
  `headed-r4-63ff4.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
  (Các luồng đợt 63 khác chạy song song — tsc đo lúc chạy cuối;
  file của luồng này 0 lỗi.)
- `vite build` (apps/web, outDir scratch
  `~/scratch-round63-r4/build`): **pass trong 5,51 s**; worker chunk
  emit `assets/gopTrialDecodeWorker62R4.worker-DvsAAzGW.js` (1,50 kB,
  cùng hash như R4 — worker entry không đổi); bundle chính chứa
  `const GF=45e3,qF=1.2` (đã grep — công thức mới đã vào build).
  Chỉ cảnh báo chunk > 500 kB và dynamic-import có sẵn.

### Test mới `gopTrialDecode63R4.test.ts` — 13/13 (nội dung)

- Công thức mới: hằng số 1,2 / 45.000; 30.727.296 B → 35902 ms;
  37.168.458 B → 43450 ms; 42.493.646 B → trần 45.000 ms (không trần
  49.691 ms); 50.246.362 B + 64 MiB → trần; đơn điệu theo kích thước;
  routing 42.493.646 B → worker, timeout 45000 ms.
- Fallback mức unit (FakeWorker): worker báo lỗi
  `no-decoder-in-worker` → fallback main-thread (terminate 1 lần);
  fallback trả `"unsupported-config"` → giữ nguyên; worker lỗi +
  không fallback → reject, `runTrialDecode` fail-open `probe-error`;
  worker onerror + không fallback → reject (không nuốt thành true);
  signal đã abort trước khi gọi → trả false ngay, không spawn worker;
  defaultProbe null + sample lớn + factory → vẫn đi worker (cứu
  được khi main không có decoder).

## 7. Môi trường chạy + sự cố VM reboot

- VM này, 4 vCPU / 8 GB (available ~550 MB lúc bắt đầu — chật).
  Chromium playwright 1254 (Chrome 158.0.8127.18) headed qua Xvfb
  display riêng (:196/:198/:199/:200), TMPDIR riêng; Firefox 159.0
  (playwright firefox-1572) headless qua playwright-core.
- **VM reboot 03:03 UTC** giữa run A lần 1 (t≈802 s, SIGTERM) —
  `last reboot` xác nhận boot mới 03:03:26; lần chạy 1 mất số chi
  tiết (chỉ còn log tóm tắt). Chạy lại từ đầu + ghi partial ra đĩa
  mỗi 30 s. Cùng cửa sổ: `chromium-1248` biến mất khỏi cache (cài
  lại 1254, 125,9 MiB, ~3 phút); Firefox cài mới 1572 (113,5 MiB).
- Lệnh chạy (từ gốc repo): esbuild bundle test rồi `node` trực tiếp
  (mẫu L8/Q5/R7/R4). Headed: `TMPDIR=.../tmp node
  runHeaded63R4*.mjs` / `runFirefox63R4.mjs` trong
  `~/scratch-round63-r4/`.
- Fixture lớn chỉ làm mẫu đo, KHÔNG đưa vào batch: crf0 50,2 MB
  (sample 0 = 50.246.362 B, High 4:4:4 Predictive) và crf3 47,6 MB
  (sample 0 = 47.608.364 B, High) — gen bằng ffmpeg từ testsrc2 +
  noise, công thức trong `gen-crf0.log` / log encode crf3.

## 8. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Tải cực nặng vẫn vượt trần 45 s:** decode 30,7–42,5 MB ở
   1,6–2,1 ms/KiB (4 spin-loop + luồng khác, cpuCalib ~13 s) cần
   64–73 s → fail-open timeout có lý do. Không kéo trần lên 60–70 s
   (lý do ở §2.3). Đây là giới hạn có chủ đích, không phải bug.
2. **High-profile 50–64 MB chưa đo trực tiếp:** crf3 47,6 MB là mốc
   cao nhất đã đo (decode-ok 37,6 s ở tải trung bình). 50–64 MB
   High-profile ở tải trung bình trở lên ngoại suy ~50–65 s > trần
   45 s → có thể fail-open. Cần fixture High-profile 55–60 MB nếu
   muốn khóa chắc (gen bằng crf 1–2; crf0 ra 4:4:4 nên không dùng
   được cho mục này).
3. **Abort 500 ms là best-effort dưới tải:** thường 507–589 ms
   (run D, R4), nhưng có 1 spike 2.983 ms (run C C4, không lặp lại)
   và overshoot 1.196 ms ở abort main-thread (D5). Verdict +
   terminate luôn đúng; chỉ wall-clock trễ. Nếu đợt sau thấy spike
   > 2 s lặp lại thì xem lại teardown decoder sau `close()` /
   `terminate()` dưới tải.
4. **Rác 40 MB fail chậm theo tải:** 421 ms lúc yên (R4) → 3.079 ms
   lúc tải nặng (run C C6). Verdict vẫn đúng (false). Không sửa.
   Chưa đo headed rác qua đường worker-no-vd → fallback (chỉ đo
   small headed + unit; worker báo lỗi trước khi nhìn sample nên
   đường này không phụ thuộc nội dung sample — xem §3.2).
5. **Safari chưa đo** (không có trên VM) — xem §4. Firefox đã đo
   (§4); Chrome đã đo kỹ.
6. **VM reboot giết chạy headed dài:** đã giảm thiểu bằng partial
   ghi đĩa mỗi 30 s; lần chạy dài vẫn có thể mất phần chưa ghi.
7. **Nợ cũ giữ nguyên (không đụng trong luồng này):** sample > 64 MiB
   vẫn bỏ qua trial-decode (Q5); keyframe thật bị đục lỗ giữa KHÔNG
   bắt chắc được (Q5 §6.3, O6 §6.1); `.github/workflows/
   ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có CI chạy
   thật); các nợ M10 §8, N10 §6, O6 §6, P6 §6, Q5 §6, R7 §6 (trừ
   §6.1 đã đóng ở đợt 62 R4 + nay nâng trần ở đây) giữ nguyên.

## 9. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI:

- `apps/web/src/lib/gopTrialDecode63R4.test.ts` — 13 test (§6).
- `docs/PHASE9_ROUND63_R4_KEYFRAME_WORKER_LIMITS.md` — LIMITS này.

ĐỔI:

- `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` — tỉ lệ 1,0 → 1,2
  ms/KiB; trần 30.000 → 45.000 ms; comment cập nhật.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — 3 comment trần worker
  30 s → 45 s (không đổi code chạy).
- `apps/web/src/lib/gopTrialDecode62R4.test.ts` — kỳ vọng theo công
  thức mới (§1).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới.

KHÔNG ĐỔI: `gopTrialDecode55L8.ts` (probe/timeout main-thread giữ
nguyên), `gopTrialDecodeWorker62R4.worker.ts` (worker entry không
đổi), mọi file production khác, `mp4Demux.ts`, `vi.json`/`en.json`
(không có chuỗi UI mới — không cần fragment i18n). Scratch + log ở
`~/scratch-round63-r4/` (probe headed A/C/D/B/FF + runner, regression,
red-before, build; file MP4 lớn chỉ làm fixture đo, KHÔNG đưa vào
batch).

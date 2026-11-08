# Phase 9 — Đợt 64, luồng R10: keyframe 50–64 MB đo trực tiếp + trần worker 45 s → 60 s

Ngày: 08/11/2026 (lượt cron 12:35 +07). Đóng nợ mở LIMITS R4 đợt 63
§8.2: High-profile 50–64 MB ở tải trung bình trở lên chưa có fixture để
đo trực tiếp, ngoại suy ~50–65 s > trần 45 s → có thể fail-open.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Ngoại suy của R4 ĐÚNG ở tải trung bình:** High-profile 50–58 MB
   decode qua worker cần **39,8–58,0 s** ở tải trung bình (cpuCalib
   6391–9899, loadavg 1-phút 1,39–15,5), tức **0,86–1,03 ms/KiB**
   (§2, run 2). **57,9 MB fail-open cả 2 rep dưới trần 45 s cũ**
   (direct 53.232 / 57.992 ms; capped 45.050 / 45.007 ms);
   49,7–51,8 MB chỉ vừa đủ trần 45 s (capped 39,8–43,7 s, headroom
   ~1,03× — một ngày tải xấu hơn là fail).
2. **Quyết định: trần worker 45 s → 60 s, tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN.**
   60 s là trần tròn nhỏ nhất bao được mọi lần đo trực tiếp (max
   57.992 ms) ở tải trung bình. 1,2 ms/KiB đã đủ (tốc độ đo được max
   1,03 → 1,2 ≈ 1,17×). Không kéo lên 70–80 s: tải cực nặng
   (1,6–2,1 ms/KiB, đợt 63) cần 90–118 s cho 57,9 MB nên vẫn
   fail-open có lý do; keyframe 58–64 MiB ở tải trung bình ngoại suy
   ~60–66 s, chưa đo trực tiếp được (§2.1) nên vẫn có thể fail-open
   ở dải này — không mạo nhận đã bao.
3. **Kiểm chứng sau sửa (run verify, §2.5):** code MỚI chạy headed
   thật — timeout 58.087 ms (crf2) / 60.000 ms (crf1sf); lúc VM thực
   sự yên (cpuCalib 1693,8 — yên nhất trong cả chuỗi R4/R10) cả hai
   đều **decode-ok sau 9,9 s / 12,0 s**. Decode nhạy tải cực mạnh:
   cùng 57,9 MB: ~12 s lúc yên ↔ 53–58 s tải trung bình ↔ > 90 s
   ngoại suy lúc tải cực nặng.
4. **Safari vẫn chưa đo** (không có trên VM) — ghi rõ, không claim.
   Firefox đã đo ở đợt 63 (§4 LIMITS đó), không đo lại ở đây.
5. **Test Node mới 11/11; R4 cập nhật 19/19; R4-63 cập nhật 13/13;
   hồi quy GOP đầy đủ 37/37 suite xanh; tsc web/desktop 0; vite
   build pass** (bundle chứa `6e4` — trần mới đã vào build).
6. **Lý do fail-open timeout KHÔNG hiển thị cho user** (đã kiểm chứng
   bằng đọc code, §4): reason chỉ dùng khi decode-failed thật
   (fallback); timeout fail-open thì file vẫn mở bình thường, reason
   không đi tới UI nào. Vì vậy đợt này KHÔNG sửa thông báo — sửa
   chuỗi mà không có đường hiển thị là code chết. Nếu đợt sau muốn
   báo user thì phải làm cả đường hiển thị (diagnostic/toast), không
   chỉ đổi chuỗi.

## 1. Thay đổi code (đợt này)

| File | Đổi | Nội dung |
|---|---|---|
| `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` | Sửa | `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` 45.000 → **60.000**; cập nhật comment (lý do + giới hạn mới). Tỉ lệ 1,2 ms/KiB giữ nguyên. Không đổi kiến trúc, routing, fallback, abort. |
| `apps/web/src/lib/gopRangeFetch39T3.ts` | Sửa | 3 comment nhắc trần worker 45 s → 60 s (không đổi code chạy). |
| `apps/web/src/lib/gopTrialDecode62R4.test.ts` | Sửa | Kỳ vọng theo trần mới: 42.493.646 B → 49.691 ms (hết bị cắt); 64 MiB → 60.000 ms. |
| `apps/web/src/lib/gopTrialDecode63R4.test.ts` | Sửa | Kỳ vọng theo trần mới: 42.493.646 B → 49.691 ms; 50.246.362 B → 58.776 ms; 64 MiB → 60.000 ms; đơn điệu 30 < 37 < 42 < 50 < trần; routing 42,5 MB → 49.691 ms; defaultProbe null → 49.691 ms. |
| `apps/web/src/lib/gopTrialDecode64R10.test.ts` | Mới | 11 test (§5): khóa trần 60 s + các mốc kích thước đã đo (49,7 / 50,4 / 51,8 / 57,9 MB / 64 MiB) + routing. |
| `apps/web/tsconfig.json` | Sửa | Thêm đúng 1 dòng exclude cho test mới (tiền lệ J6/K8/…/R4/R7). Không đụng dòng của luồng khác. |
| `docs/PHASE9_ROUND64_R10_KEYFRAME_CAP_LIMITS.md` | Mới | Tài liệu này. |

Giá trị timeout mới (base 200, đã tính bằng node trước khi sửa):
300.148 B → 245 ms; 4.107.475 B → 4707 ms; 9.683.047 B → 11241 ms;
19.720.025 B → 23003 ms; 30.727.296 B → 35902 ms; 37.168.458 B →
43450 ms; 42.493.646 B → 49691 ms (không chạm trần — trần 45 s cũ
sẽ cắt); 47.608.364 B → 55684 ms; 49.658.687 B → 58087 ms;
50.388.107 B → 58942 ms; 50.246.362 B → 58776 ms; 51.821.731 B →
60.000 ms (trần; không trần 60.622 ms); 57.939.416 B → 60.000 ms
(trần; không trần 67.791 ms); 64 MiB → 60.000 ms (trần; không trần
78.536 ms).

## 2. Đo trực tiếp High-profile 50–64 MB (Chromium 158, headed)

Harness `~/scratch-round64-r10/` (runHeaded64R10.mjs +
vdHeaded64R10.ts; runHeaded64R10idle.mjs + vdHeaded64R10idle.ts;
runHeaded64R10verify.mjs + vdHeaded64R10verify.ts; Xvfb :201/:202/
:203, cổng 8941/8943/8945). Fixture mới gen bằng ffmpeg từ testsrc2
8K + noise alls=100 (xem `gen-64r10.log`):

| Fixture | Sample 0 (byte) | Profile | Lệnh gen |
|---|---|---|---|
| crf2 | 49.658.687 (~47,4 MiB) | High 7680×4320 | libx264 `-crf 2`, preset medium |
| crf1-veryfast | 50.388.107 (~48,1 MiB) | High | `-preset veryfast -crf 1` |
| crf1 | 51.821.731 (~49,4 MiB) | High | `-crf 1`, preset medium |
| crf1-superfast | 57.939.416 (~55,3 MiB) | High | `-preset superfast -crf 1` |

Mức tải điều khiển bằng node busy-loop (0 / 2 / 4 hog) + ghi loadavg +
cpuCalib trước mỗi bước; các luồng đợt 64 khác chạy song song nên
loadavg thực dao động — đọc số kèm loadavg/cpuCalib ghi tại bước đó,
không tin nhãn mức tải một cách mù.

### 2.1 Vì sao không có fixture 58–64 MB (giới hạn gen, đã thử)

- `noise alls=150` → ffmpeg từ chối (alls tối đa 100).
- `-preset ultrafast -crf 1/2/3` → sample 0 = **77.963.389 B
  (~74 MiB)**, không đổi theo crf — VƯỢT trần trial-decode 64 MiB
  của Q5 nên không dùng được cho mục này (sample > 64 MiB bị bỏ
  qua trial-decode hoàn toàn, không đi worker).
- veryfast/superfast crf1 lần lượt cho 50,4 / 57,9 MB — superfast
  là mốc cao nhất gen được trong trần 64 MiB bằng các nguồn này.
  **Dải 58–64 MiB High-profile vẫn chưa có fixture để đo trực
  tiếp** — ngoại suy theo 1,0 ms/KiB ≈ 60–66 s ở tải trung bình
  (xem §3). Ghi rõ, không mạo nhận.

### 2.2 Run 1 — RTD có trần 45 s (code cũ), 3 mức tải: 24/24 timeout

| Khối | cpuCalib | Kết quả |
|---|---|---|
| idle (0 hog) | 14.817 | 8/8 timeout-45000ms (49,7 / 51,8 / 50,4 / 57,9 MB ×2) |
| medium (2 hog) | 16.262,8 | 8/8 timeout-45000ms |
| heavy (4 hog) | 46.404,3 | 8/8 timeout-45000ms (có rep 45.922 / 45.936 ms — timer trễ dưới tải) |
| Đối chứng 42,5 MB idle | — | timeout-45000ms sau 45.401 ms |

**Run 1 KHÔNG dùng để quyết trần** — VM bị tải nền từ các luồng
đợt 64 khác ô nhiễm nặng (cpuCalib 14.817–46.404; loadavg 1-phút
tới 34,0; 4 tiến trình ffmpeg của luồng khác chạy song song ở
12–46% CPU). Bằng chứng ô nhiễm: đối chứng 42,5 MB vốn decode-ok
37,9 s ở đợt 63 run C nay cũng timeout — tải nền đã đẩy mọi lần đo
vượt trần. Giá trị duy nhất của run 1: xác nhận dưới tải nặng thật
(nhiều luồng song song) thì 50–58 MB fail-open toàn bộ, và trần 45 s
không còn headroom nào khi VM bận.

### 2.3 Run 2 — Đo trực tiếp KHÔNG trần + chạy lại có trần (tải trung bình)

Probe gọi `workerProbe` TRỰC TIẾP (không qua `runTrialDecode` nên
không bị trần 45 s) + watchdog 240 s để lấy thời gian decode thật;
mỗi rep đo trực tiếp xong chạy lại 1 lần qua plan có trần để lấy
verdict theo trần cũ. Tải trung bình thật: cpuCalib 6391–9899
(so sánh: R4 idle 3158, medium 7619, heavy 13018), loadavg 1-phút
1,39–15,5 trong các khối (luồng khác vẫn encode ngắt quãng).

| Fixture | Direct (không trần) | ms/KiB | Capped 45 s (verdict) |
|---|---|---|---|
| crf2 49,7 MB | **47.142 / 41.711 ms** → decode-ok | 0,972 / 0,86 | decode-ok 39.762 / 41.208 ms |
| crf1 51,8 MB | **44.289 / 47.007 ms** → decode-ok | 0,875 / 0,929 | decode-ok 43.729 / 42.496 ms |
| crf1sf 57,9 MB | **53.232 / 57.992 ms** → decode-ok | 0,941 / 1,025 | **timeout fail-open 45.050 / 45.007 ms** |

Đọc số:
- **Ngoại suy R4 đúng:** 57,9 MB ở tải trung bình cần 53–58 s
  (R4 ngoại suy ~50–65 s) — trần 45 s fail cả 2 rep. 49,7–51,8 MB
  cần 39,8–47,1 s — trần 45 s chỉ vừa đủ (capped nhanh nhất
  39,8 s, chậm nhất 43,7 s; headroom 1,03×).
- Tốc độ decode ở tải trung bình: **0,86–1,03 ms/KiB** (6 lần đo
  trực tiếp) — khớp dải R4 (medium max 1,00; idle max 0,87).
- Chênh direct vs capped cùng rep (vd: 47.142 vs 39.762 ms):
  lần decode thứ hai nhanh hơn — có thể do decoder/config ấm
  hoặc sample còn trong cache OS; số direct (lạnh) là cơ sở thận
  trọng để quyết trần, số capped cho thấy verdict thực tế khi
  mở file (thường là lần decode đầu tiên sau fetch — gần với
  direct hơn).
- Run 2 KHÔNG phải tải yên thật (cpuCalib thấp nhất 6391, vẫn gấp
  đôi idle của R4) — xem §2.5 để có số lúc yên thật.

### 2.4 T3 end-to-end (run 1, code cũ — để đối chiếu, không phải verdict mới)

Không chạy T3 e2e riêng ở đợt này: run 1 cho thấy mọi RTD 50–58 MB
đều timeout-45000ms dưới tải nền, nên T3 e2e cũng sẽ fail-open
tương tự (tổng thời gian T3 không phân biệt được decode-ok vs
timeout — xem LIMITS R4 đợt 63 §2.6). Verdict sau sửa lấy ở run
verify (§2.5), không suy diễn từ T3.

### 2.5 Đo lại sau sửa (run verify, code mới 1,2/60 s) — lúc VM thực sự yên

Chạy sau khi các luồng khác tạm lắng: cpuCalibStart **1693,8 ms**
(yên nhất trong cả chuỗi R4/R10 — R4 idle là 3158), loadavg 1-phút
1,30–2,54, heap 41,7–56,4 MB. Probe RTD qua plan (code MỚI):

| Fixture | timeoutMs (code mới) | Kết quả |
|---|---|---|
| crf2 49,7 MB | 58.087 | **decode-ok sau 9.945 ms** |
| crf1sf 57,9 MB | 60.000 | **decode-ok sau 11.983 ms** |

- **Trần mới đã vào code chạy thật:** timeout 58.087 / 60.000 ms
  (không phải 45.000) — bundle probe build từ source hiện hành.
- **Decode nhạy tải cực mạnh:** cùng 57,9 MB: **~12 s lúc yên**
  (0,21 ms/KiB) ↔ 53–58 s tải trung bình (0,94–1,03 ms/KiB) ↔
  > 90 s ngoại suy tải cực nặng (1,6–2,1 ms/KiB). Tải là biến
  quyết định, không phải kích thước đơn thuần — mọi trần đều là
  đánh đổi theo tải, không có trần nào bao được mọi tải.
- Lưu ý: số 9,9 s / 12,0 s là lúc VM yên gần như tuyệt đối
  (cpuCalib 1694); máy user mở thêm app nặng thì số sẽ xấu đi
  theo đường cong §2.3 — không dùng số yên để claim "50 MB chỉ
  mất 10 s" nói chung.

## 3. Quyết chính sách trần: 45 s → 60 s, tỉ lệ 1,2 giữ nguyên (bằng số)

- **Tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN:** tốc độ đo được ở tải trung bình
  max 1,03 ms/KiB → 1,2 ≈ 1,17× (đợt 63: 1,2 ≈ 1,2× tốc độ
  medium max 1,00). Tỉ lệ không phải nút thắt — nút thắt là trần.
- **Trần 60 s (không phải 45 s, không phải 70 s):** 60 s là trần
  tròn nhỏ nhất bao được mọi lần đo trực tiếp lạnh ở tải trung
  bình (max 57.992 ms → headroom 1,03×; các lần còn lại 41,7–
  53,2 s → headroom 1,13–1,44×). Với trần 60 s, công thức cho:
  42,5 MB → 49.691 ms (hết bị cắt), 49,7 MB → 58.087 ms,
  51,8 MB → trần 60 s, 57,9 MB → trần 60 s.
- **Vì sao không 70 s:** 70 s chỉ thêm được dải 58–64 MiB ở tải
  trung bình (ngoại suy ~60–66 s, chưa đo trực tiếp — §2.1) với
  headroom ~1,06×, trong khi tải cực nặng (90–118 s cho 57,9 MB)
  vẫn vượt cả 70 s. Đổi lấy +10 s chờ mở file nữa cho trường hợp
  chưa đo được là tăng trần mù — trái luật đợt này. Dừng ở 60 s;
  nếu đợt sau gen được fixture 58–64 MB và đo được ~60–66 s thì
  xem lại.
- **Đánh đổi ghi rõ:** file có keyframe 0 > ~40 MiB (hiếm — 8K /
  bitrate rất cao) nay mở chậm nhất thêm ~15 s so với trước (trần
  decode 45 → 60 s), đổi lấy verdict thật thay vì fail-open ở tải
  trung bình; UI không đóng băng (decode ở worker); file thường
  không chạm tới. Tải cực nặng vẫn fail-open timeout có lý do —
  đây là giới hạn có chủ đích, không phải bug.

## 4. Lý do fail-open timeout không hiển thị cho user (đã kiểm chứng bằng đọc code)

- `runTrialDecode` trả `reason: "timeout-<ms>ms: trial-decode chưa
  xong, cho qua (fail-open)"` (qua key `gop.trial.timeout` trong
  dict, fallback VI cũ nếu vắng).
- `gopRangeFetch39T3.ts` chỉ dùng `trial.reason` khi
  `!trial.passed` (decode-failed thật → fallback
  `gop.demux.trialDecodeFailed`). Timeout fail-open có
  `passed=true, skipped=true` → file mở ở mode gop-range bình
  thường, reason không đi tới UI/toast/diagnostic/note nào
  (grep toàn `apps/web/src`: chỉ 2 chỗ dùng `trial.reason`, đều
  trong nhánh `!trial.passed`).
- Kết luận: cải thiện chuỗi timeout mà không làm đường hiển thị là
  code chết — đợt này KHÔNG đổi chuỗi. Nếu đợt sau muốn báo user
  khi keyframe lớn không được kiểm chứng thì phải làm cả đường
  hiển thị (vd: ghi vào structured note / diagnostic khi mở file),
  không chỉ đổi chuỗi. Nợ này ghi lại ở §6.4, không mạo nhận đã
  "cải thiện thông báo".

## 5. Kiểm chứng gộp của luồng

- Test Node mới `gopTrialDecode64R10.test.ts` — **11/11** (khóa trần
  60 s + các mốc 42,5 / 47,6 / 49,7 / 50,4 / 51,8 / 57,9 MB /
  64 MiB + routing).
- Test R4 cập nhật — **19/19**; test R4-63 cập nhật — **13/13**.
- Hồi quy GOP đầy đủ (script `~/scratch-round64-r10/
  run-regression-r10-64.sh`, sao từ R4-63 + thêm dòng R4-63/R10-64;
  R4-63 chạy 2 lần do script gốc đã có dòng đó + append trùng —
  cả 2 đều 13/13, vô hại): U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10,
  E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6
  11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23,
  M10 28/28, N10 17/17, N6 32/32, O6 18/18, P6 16/16, Q5 15/15,
  R7 6/6, R4 19/19, R4-63 13/13, **R10-64 11/11**. Log
  `regression-r10-64.log`. Tổng 37 suite, 0 fail.
- Headed: run 1 (đường cong 50–58 MB, 24 rep + đối chứng), run 2
  (đo trực tiếp không trần, 6 direct + 6 capped), run verify (code
  mới, 2 RTD). Log `headed-r64r10.log`, `headed-r64r10idle.log`,
  `headed-r64r10verify.log`; kết quả JSON `result-run1.json`,
  `result-idle.json`, `result-verify.json`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (apps/web, outDir scratch
  `~/scratch-round64-r10/build`): **pass trong 6,19 s**; worker
  chunk emit `assets/gopTrialDecodeWorker62R4.worker-DvsAAzGW.js`
  (cùng hash như R4 — worker entry không đổi); bundle chính chứa
  `6e4` (trần mới 60 s đã vào build) và `1.2`; không còn `45e3`.
  Chỉ cảnh báo chunk > 500 kB có sẵn.

### Test mới `gopTrialDecode64R10.test.ts` — 11/11 (nội dung)

- Trần mới: hằng số 1,2 / 60.000; 42.493.646 B → 49.691 ms;
  47.608.364 B → 55.684 ms; 49.658.687 B → 58.087 ms;
  50.388.107 B → 58.942 ms; 51.821.731 B → trần 60.000 ms
  (không trần 60.622 ms); 57.939.416 B → trần 60.000 ms (không
  trần 67.791 ms); 64 MiB → trần 60.000 ms (không trần 78.536 ms).
- Đơn điệu theo kích thước, trần chỉ chạm từ ~51,8 MB trở lên.
- Routing 57.939.416 B → worker, timeout 60.000 ms; routing
  49.658.687 B → worker, timeout 58.087 ms.

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Tải cực nặng vẫn vượt trần 60 s:** decode 57,9 MB ở
   1,6–2,1 ms/KiB cần ~90–118 s → fail-open timeout có lý do.
   Không kéo trần thêm (lý do ở §3). Đây là giới hạn có chủ
   đích, không phải bug.
2. **Keyframe 58–64 MiB chưa đo trực tiếp:** mốc cao nhất đã đo
   là 57,9 MB (53,2–58,0 s tải trung bình). Dải 58–64 MiB ngoại
   suy ~60–66 s ở tải trung bình → có thể fail-open dưới trần
   60 s. Cần fixture High-profile 58–64 MB nếu muốn khóa chắc
   (chưa gen được bằng testsrc2+noise — xem §2.1; có thể thử nguồn
   khác như `geq` random hoặc footage thật 8K nhiễu cao).
3. **Headroom ở top-end còn mỏng:** lần đo lạnh chậm nhất 57,9 MB
   là 57.992 ms so với trần 60 s (1,03×) — một ngày tải xấu hơn
   mức "trung bình" đã đo là fail. Đây là trần bao được số ĐÃ ĐO,
   không phải trần có biên an toàn lớn; ghi rõ để đợt sau khỏi
   tưởng 60 s là thoải mái.
4. **Lý do fail-open timeout chưa hiển thị cho user** (§4): cần
   đường hiển thị (diagnostic/note) nếu muốn báo; chỉ đổi chuỗi
   là không đủ. Chưa làm ở đợt này.
5. **Safari chưa đo** (không có trên VM) — xem LIMITS đợt 63 §4.
   Firefox đã đo (§4 đó); Chrome đã đo kỹ.
6. **VM bận do luồng song song làm ô nhiễm đo tải** (run 1):
   khi nhiều luồng đợt 64 cùng encode/render, nhãn idle/medium/
   heavy mất ý nghĩa — phải đọc kèm cpuCalib/loadavg từng bước.
   Đợt sau đo tải nên canh cửa sổ yên hoặc ghi rõ mức ô nhiễm
   như ở đây.
7. **Nợ cũ giữ nguyên (không đụng trong luồng này):** sample > 64 MiB
   vẫn bỏ qua trial-decode (Q5); keyframe thật bị đục lỗ giữa KHÔNG
   bắt chắc được (Q5 §6.3, O6 §6.1); `.github/workflows/
   ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có CI chạy
   thật); các nợ M10 §8, N10 §6, O6 §6, P6 §6, Q5 §6, R7 §6 giữ
   nguyên.

## 7. Môi trường chạy

- VM này, 4 vCPU / 8 GB. Chromium playwright 1254 (Chrome
  158.0.8127.18) headed qua Xvfb display riêng (:201/:202/:203),
  TMPDIR riêng; cổng HTTP 8941/8943/8945, debug 9435/9437/9439.
- Lệnh chạy (từ gốc repo): esbuild bundle test rồi `node` trực
  tiếp (mẫu L8/Q5/R7/R4). Headed: `TMPDIR=.../tmp node
  runHeaded64R10*.mjs` trong `~/scratch-round64-r10/`.
- Fixture lớn chỉ làm mẫu đo, KHÔNG đưa vào batch: crf2 49,7 MB,
  crf1 51,8 MB, crf1-veryfast 50,4 MB, crf1-superfast 57,9 MB —
  gen bằng ffmpeg từ testsrc2 + noise, công thức trong
  `gen-64r10.log`.

## 8. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI:

- `apps/web/src/lib/gopTrialDecode64R10.test.ts` — 11 test (§5).
- `docs/PHASE9_ROUND64_R10_KEYFRAME_CAP_LIMITS.md` — LIMITS này.

ĐỔI:

- `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` — trần 45.000 →
  60.000 ms; comment cập nhật.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — 3 comment trần worker
  45 s → 60 s (không đổi code chạy).
- `apps/web/src/lib/gopTrialDecode62R4.test.ts` — kỳ vọng theo trần
  mới (§1).
- `apps/web/src/lib/gopTrialDecode63R4.test.ts` — kỳ vọng theo trần
  mới (§1).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới.

KHÔNG ĐỔI: `gopTrialDecode55L8.ts` (probe/timeout main-thread giữ
nguyên; lý do timeout không đổi — xem §4), `gopTrialDecodeWorker62R4.worker.ts`
(worker entry không đổi), mọi file production khác, `mp4Demux.ts`,
`vi.json`/`en.json` (không có chuỗi UI mới — không cần fragment
i18n). Scratch + log ở `~/scratch-round64-r10/` (probe headed
run 1 / run 2 / verify + runner, regression, build; file MP4 lớn
chỉ làm fixture đo, KHÔNG đưa vào batch).

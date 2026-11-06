# Phase 9 đợt 42, luồng X6 — Cổng CPU: RAM hỏi TRƯỚC busy, báo cáo nêu gate trượt đầu tiên — LIMITS

Ngày: 04/11/2026, ~02:12 +07 (lượt cron đợt 42). KHÔNG push, KHÔNG
ghi qua GitHub connector, KHÔNG release/tag, KHÔNG binary, KHÔNG
dist, KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ W6).
Luồng này chỉ đụng file khu vực cpuGate/runner quiet của mình (§6);
không sửa logic luồng khác, không sửa `cpuGate39T6.ts`, probe U4,
module chẩn đoán V6, hay helper diag W6.

## 0. Kết luận ngắn

1. **Thứ tự đánh giá đã đảo thành RAM → CPU load → busy.**
   `evaluateQuietGate()` trong runner W6 trước đây liệt kê blocker
   theo thứ tự mẫu (load1, load5 rồi mới memAvailable) và verdict
   `REFUSED-BUSY` không chỉ rõ nguyên nhân trượt đầu tiên — đúng
   điểm mù đợt 41 §5.1 nêu: runner trượt vì RAM 4–10% trong khi CPU
   dần yên nhưng báo cáo không nêu RAM trước. Từ X6, blockers xếp
   RAM lên đầu, report và dòng từ chối đều mở đầu bằng gate trượt
   đầu tiên (`firstFailedGate` / `firstFailure`), và busy chỉ được
   hỏi SAU KHI cổng yên đạt (nếu cổng trượt thì report ghi rõ busy
   CHƯA được đánh giá, không phải busy trượt).
2. **Kết quả REFUSED và locked:false giữ nguyên, ngưỡng KHÔNG đổi.**
   Verdict vẫn `REFUSED-BUSY`, exit 2, `locked: false`, probe KHÔNG
   chạy khi cổng trượt. Ngưỡng RAM vẫn 20%, load1 0,25×nproc,
   load5 0,50×nproc, 3 mẫu — test X6-h khóa cả 4 giá trị này.
3. **KHÔNG thêm biến môi trường override ngưỡng** (xem §4: quyết
   bỏ có lý do, nhiệm vụ cho phép bỏ). Mọi phiên quiet tương lai
   muốn đổi ngưỡng phải đổi code + ghi LIMITS, không vặn env lén.

## 1. Đã làm (3 file code + 1 test mới + file này)

### 1.1 Runner `cpu-gate-quiet-runner-41w6.mjs` (sửa, không đổi tên)

- `checkSample()`: thứ tự key đổi thành memAvailable → load1 →
  load5, để per-sample cũng đọc RAM trước.
- `evaluateQuietGate()` viết lại phần gom blocker: vòng 1 gom mọi
  blocker memAvailable (theo thứ tự mẫu), vòng 2 load1, vòng 3
  load5, cuối cùng mới là blocker thiếu mẫu; dedup giữ thứ tự.
  Trả thêm 2 trường:
  - `firstFailedGate`: `"memAvailable" | "load1" | "load5" |
    "samples" | null` — theo đúng thứ tự ưu tiên RAM → load1 →
    load5 → thiếu mẫu, KHÔNG theo thứ tự thời gian của mẫu
    (test X6-d khóa điểm này: mẫu 1 trượt load trước, mẫu 2
    trượt RAM sau, nhưng firstFailedGate vẫn là memAvailable).
  - `firstFailure`: chuỗi người đọc được, ví dụ
    `RAM: memAvailable 18.3% < 20%` hoặc
    `CPU: load1 2.03 >= 1.00 (0.25×4 core)`.
  - busy KHÔNG nằm trong hàm này: khi cổng trượt, firstFailedGate
    không bao giờ là `"busy"` — busy là bước sau cổng, không phải
    ứng viên trượt của cổng.
- `main()` — dòng log mỗi mẫu đổi thành RAM trước loadavg
  (`mẫu N: RAM available X% [nguồn], loadavg …`), để log console
  cũng hỏi RAM trước.
- Nhánh từ chối: report thêm `gate.firstFailedGate`,
  `gate.firstFailure`; `note` mở đầu bằng
  `trượt đầu tiên — <firstFailure>` và ghi rõ
  `Busy CHƯA được đánh giá (chỉ hỏi sau khi cổng yên đạt)`.
  Dòng console in cùng nội dung. Verdict `REFUSED-BUSY`,
  `locked: false`, `probeRounds: null`, `diagnosis: null` giữ
  nguyên — verdict là mã điều phối cũ (wrapper dựa vào exit 2),
  nguyên nhân thật nằm ở firstFailedGate.
- Nhánh `--gate-only` và nhánh probe: `gate` thêm
  `firstFailedGate: null, firstFailure: null` cho đồng dạng schema.
- Nhánh probe thêm trường `decision` (chuỗi quyết định đầy đủ
  RAM → CPU load → busy): cổng đã đạt nên gate trượt đầu tiên
  (nếu có) ở bước này chỉ có thể là busy/idle từ chẩn đoán V6:
  `fail-busy`/`fail-both` → `"busy"` kèm `busy.detail`,
  `fail-idle` → `"idle"`, `pass`/`disabled` → null (disabled là
  tiêu chí tắt, không phải trượt), `insufficient-rounds` →
  `"rounds"`. Đường này CHƯA kiểm chứng end-to-end trong đợt này
  (cổng chưa từng yên — xem §5).

### 1.2 Wrapper `cpu-gate-quiet-then-u4-41w6.mjs` (sửa tối thiểu)

- Khi runner exit 2, wrapper đọc report cổng (`--gate-out`) và in
  thêm `trượt đầu tiên — <firstFailure> (gate: <firstFailedGate>)`
  vào dòng từ chối; đọc lỗi thì giữ dòng cũ làm fallback. Không
  đổi mã thoát (2 = từ chối, U4 không chạy), không sửa file U4.

### 1.3 Test mới `cpu-gate-quiet-runner-42x6.test.mjs` (8/8, §3)

- X6-a: RAM trượt + CPU đạt (đúng số W6 lần 1: load 0,82–0,89,
  RAM 9,6–9,8%) → `firstFailedGate = "memAvailable"`, blockers[0]
  là memAvailable, không có blocker load nào.
- X6-b: RAM đạt + load1 trượt (2,03) → `"load1"`, nêu CPU.
- X6-c: RAM đạt + load5 trượt → `"load5"`.
- X6-d: RAM + CPU cùng trượt, thứ tự mẫu đảo ngược → RAM vẫn đầu.
- X6-e: cổng yên → null, blockers rỗng.
- X6-f: thiếu mẫu nhưng RAM đã trượt → vẫn nêu RAM (không đổ
  cho thiếu mẫu).
- X6-g: thiếu mẫu, mọi gate đạt → `"samples"`.
- X6-h: mặc định không đổi (RAM 0,2; load1 0,25; load5 0,5;
  minSamples 3) và KHÔNG có override env: đặt thử
  `VCUT_QUIET_MEM_FRAC` / `VCUT_QUIET_MEM_MIN_FRAC = "0.05"` rồi
  vẫn khẳng định mặc định 0,2 và mẫu RAM 15,1% (số thật đợt 41)
  vẫn trượt.

## 2. Chạy thật trong đợt này: 2 lần từ chối, cả 2 nêu RAM trước

Lần 1 — runner `--gate-only`, ~02:12 +07, report
`/tmp/round42-x6/runner-gate.json`, exit 2:

| Mẫu | load1 / load5 | RAM available | Kết luận |
|---|---|---|---|
| 1 | 0,85 / 0,84 | 18,3% (1523 MB / 7940 MB) | load đạt, RAM trượt |
| 2 | 0,85 / 0,84 | 18,6% | load đạt, RAM trượt |
| 3 | 0,78 / 0,82 | 18,6% | load đạt, RAM trượt |

Dòng in ra (mới, khác đợt 41):
`CHƯA KHÓA — máy bận/under-load: trượt đầu tiên — RAM:
memAvailable 18.3% < 20% (gate: memAvailable); các blocker:
memAvailable 18.3% < 20%; memAvailable 18.6% < 20%`.
Report: `verdict REFUSED-BUSY`, `locked: false`,
`gate.firstFailedGate = "memAvailable"`,
`probeRounds: null`, `diagnosis: null`.

Lần 2 — wrapper, ngay sau đó, report
`/tmp/round42-x6/wrapper-gate.json`, exit 2: load1 0,78–0,96,
load5 0,82–0,86 (đạt), RAM 18,6% → 17,5% → 17,5% (trượt).
Dòng wrapper mới:
`[W6 wrapper] CHƯA KHÓA — máy bận/under-load: trượt đầu tiên —
RAM: memAvailable 18.6% < 20% (gate: memAvailable). U4 KHÔNG ĐƯỢC
CHẠY trong lượt này`. File kết quả U4
`benchmarks/results/v38-u4-cpu-calibration.json` giữ nguyên mtime
2026-11-02 13:08:46 UTC (không bị đụng).

So với đợt 41: cùng một hình dạng số (CPU yên, RAM trượt), nhưng
lần này nguyên nhân trượt đầu tiên được nêu ngay đầu báo cáo thay
vì phải đọc bảng mẫu mới suy ra. Đây vẫn là dữ liệu under-load
(6+ luồng đợt 42 chạy song song) — cấm dùng làm baseline quiet
hay bằng chứng khóa, giống mọi số đợt 41.

## 3. Kiểm chứng đã chạy (số thật)

- Test mới X6: **8/8**
  (`node --test apps/web/scripts/cpu-gate-quiet-runner-42x6.test.mjs`,
  fail 0).
- Hồi quy test runner W6 cũ (file cũ nguyên vẹn, không sửa):
  **11/11** (`cpu-gate-quiet-runner-41w6.test.mjs`, fail 0; gồm
  probe smoke 1 vòng busy 35,8% / idle 0,0% — chỉ hình dạng, cấm
  dùng làm bằng chứng ngưỡng).
- Hồi quy diag V6: **17/17** (chạy trực tiếp
  `node --experimental-strip-types
  apps/web/src/lib/cpuGateNodeDiag40V6.test.ts` — file này dùng
  counter `ok()` riêng nên `node --test` chỉ đếm 1 suite; số 17
  là dòng tổng kết của chính file, exit 0, không có ✗).
- Hồi quy cổng T6: **8/8** (cùng cách chạy, dòng tổng kết của
  file, exit 0).
- `node --check` pass: runner, wrapper, test X6 mới.
- `tsc --noEmit`: **xem §5 — không sạch toàn repo tại thời điểm
  kiểm tra vì file của luồng đợt 42 khác đang sửa dở; X6 đóng góp
  0 lỗi** (file X6 nằm trong `scripts/`, ngoài `include: ["src"]`
  của tsconfig — cùng tiền lệ W6; lỗi quan sát được chỉ ở
  `src/preview.tsx` và `src/lib/pauseSeekCap42X2.test.ts` của
  luồng khác, và nội dung lỗi thay đổi giữa các lần chạy theo
  nhịp sửa của luồng đó). Parent gộp cần chạy lại tsc sau khi các
  luồng đợt 42 settled.
- `vite build`: KHÔNG chạy — X6 không đụng code nào được bundle
  (chỉ script trong `scripts/` + docs), cùng lý do W6 đã ghi.

## 4. Quyết KHÔNG làm: biến môi trường override ngưỡng

Nhiệm vụ cho phép thêm override env CHỈ cho phiên quiet tương lai
nếu không rủi ro, hoặc bỏ kèm lý do. X6 chọn BỎ, vì:

- Nguyên tắc W6 là "ngưỡng GHI TRƯỚC, không sửa sau khi thấy số".
  Một knob env cho phép phiên quiet — chính phiên được phép quyết
  khóa — tự hạ ngưỡng ngay trước khi đo mà không qua code review
  hay LIMITS, rồi report vẫn có thể bị đọc lệch nếu ai đó quên
  kiểm tra trường thresholds. Ghi thresholds vào report giảm chứ
  không triệt rủi ro này.
- Nhu cầu thực tế chưa có: câu hỏi RAM (§2.1 của W6) vẫn chờ
  bằng chứng phiên main-chat-only; nếu phiên đó chứng minh ngưỡng
  20% không đạt được thì quyết sửa phải là quyết tường minh ghi
  trong LIMITS + đổi code, không phải vặn env.
- Test X6-h khóa hành vi này: đặt biến env kiểu override cũng
  không đổi được mặc định (vì code không đọc env). Nếu đợt sau
  muốn mở lại knob này thì phải đổi cả code lẫn test X6-h, và
  report bắt buộc ghi rõ nguồn ngưỡng (code vs env) — không thêm
  lén.

## 5. Chưa làm / không làm (trung thực)

- KHÔNG khóa cổng, KHÔNG đổi ngưỡng nào (RAM 20% giữ nguyên),
  KHÔNG đo probe lúc máy bận (ngoài smoke hình dạng trong test
  W6 cũ, cấm dùng làm bằng chứng ngưỡng).
- KHÔNG sửa `cpuGate39T6.ts`, probe U4, module chẩn đoán V6,
  helper diag W6, hay bất kỳ file nào của luồng khác. File chung
  duy nhất X6 chạm là 2 file của chính khu vực W6 (runner +
  wrapper); không có file chung ngoài khu vực này.
- Đường probe yên end-to-end (cổng yên → probe 3 vòng → trường
  `decision` ghi busy) CHƯA kiểm chứng — cần cửa sổ yên thật.
- Đường wrapper yên → chạy U4 thật cũng CHƯA kiểm chứng — cùng
  lý do (cổng chưa từng yên trong đợt này, cả 2 lần đều exit 2).
- **Phiên quiet có điều phối vẫn chờ cửa sổ yên từ main chat**
  (nợ đợt 41 §5.1, chưa đóng trong đợt này): chạy wrapper X6
  trong phiên chỉ có main chat; nếu cổng yên thì U4 chạy trọn vẹn
  và runner probe Node đính kèm chẩn đoán V6, rồi mới quyết
  khóa/sửa/loại ngưỡng theo khung W6 §2 — và quyết RAM đi trước
  quyết busy (nay đã có firstFailedGate để đọc quyết đó sạch).
- tsc toàn repo tại thời điểm X6 kiểm tra: có lỗi ở file luồng
  khác đang sửa dở (§3) — X6 không sửa, parent gộp chạy lại sau
  khi settled; không được trích tsc lúc này làm "tsc 0" cho đợt 42.

## 6. File đổi/thêm (chỉ của X6 — text, không binary, không dist)

SỬA (2 file, đều thuộc khu vực W6):

- `apps/web/scripts/cpu-gate-quiet-runner-41w6.mjs` (thứ tự
  RAM-trước, firstFailedGate/firstFailure, log mẫu RAM-trước,
  note từ chối nêu gate trượt đầu tiên + busy chưa hỏi, trường
  `decision` cho nhánh probe).
- `apps/web/scripts/cpu-gate-quiet-then-u4-41w6.mjs` (wrapper đọc
  report cổng để in gate trượt đầu tiên khi exit 2).

MỚI (2 file):

- `apps/web/scripts/cpu-gate-quiet-runner-42x6.test.mjs` (8/8).
- `docs/PHASE9_ROUND42_X6_CPU_RAM_FIRST_LIMITS.md` (file này).

KHÔNG ĐỔI: `cpu-gate-quiet-diag-41w6.ts`,
`cpu-gate-quiet-runner-41w6.test.mjs` (11/11 nguyên vẹn),
`cpuGate39T6.ts` (locked:false nguyên vẹn),
`clicktest-u4-round38-cpu-calibration-probe.mjs`,
`cpuGateNodeDiag40V6.ts`, `apps/web/tsconfig.json`.
Scratch: `/tmp/round42-x6/` (2 report từ chối) — không vào batch.
Không push, không tag, không tự stage batch paths-loop (parent gộp).

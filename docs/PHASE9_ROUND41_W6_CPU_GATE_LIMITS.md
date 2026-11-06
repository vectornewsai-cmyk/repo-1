# Phase 9 đợt 41, luồng W6 — Cổng CPU: runner quiet có điều phối (KHÔNG khóa) — LIMITS

Ngày: 03/11/2026, ~20:05–20:15 +07. KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo,
KHÔNG tự stage batch paths-loop (parent gộp). Luồng này chỉ đụng file
của mình (§7); không sửa `cpuGate39T6.ts`, probe U4, module chẩn đoán
V6, hay bất kỳ file nào của luồng khác.

## 0. Kết luận ngắn (đúng giao, không vượt số đo)

1. **Cổng CPU VẪN CHƯA KHÓA — và kết quả của đợt này là "không khóa,
   có bằng chứng load", không phải thất bại.** Runner quiet mới chạy
   thật 2 lần trong đợt này và cả 2 lần đều TỪ CHỐI đo probe
   (exit 2, verdict `REFUSED-BUSY`, `locked: false`), vì cổng yên ghi
   trước không đạt. Đây là kết quả HỢP LỆ theo đúng thiết kế: cấm
   khóa từ dữ liệu under-load thì cũng cấm đo probe lúc máy bận để
   khỏi tạo thêm dữ liệu under-load cho ai đó vô tình dùng.
2. **Điểm mới so với dự đoán "5 luồng song song là gần như chắc chắn
   bận": máy bận theo RAM, không bận theo CPU.** Cả 2 lần chạy thật,
   tiêu chí load CPU đều ĐẠT (load1 0,66–0,89 < 1,0; load5 0,87–0,93
   < 2,0 trên máy 4 core) nhưng RAM available chỉ 4,1–9,8% < 20% nên
   cổng vẫn từ chối. Load và RAM không thay thế nhau ở đây: CPU đã
   yên dần trong khi áp lực RAM tăng lên (do các luồng khác cấp
   phát). Xem §2.3 — đây là câu hỏi số 1 cho đợt sau, không phải lý
   do để nới ngưỡng ngay trong đợt này.
3. **Không nới ngưỡng, không sửa ngưỡng, không khóa, không đo probe
   under-load.** Mọi ngưỡng (cổng T6, chẩn đoán V6, cổng yên W6) giữ
   nguyên như lúc ghi trước. Test probe trong file test chỉ khẳng
   định HÌNH DẠNG số, không khẳng định ngưỡng — giá trị đó đo
   under-load nên cấm dùng làm bằng chứng khóa.

## 1. Runner quiet có điều phối (mới)

### 1.1 Cổng yên — ngưỡng GHI TRƯỚC, không sửa sau khi thấy số

File `apps/web/scripts/cpu-gate-quiet-runner-41w6.mjs`. Yên chỉ khi
TẤT CẢ 3 mẫu hệ thống (cách nhau 2000 ms) đều thỏa cả 3 tiêu chí:

- `load1 < 0,25 × nproc` (máy 4 core: < 1,0)
- `load5 < 0,50 × nproc` (máy 4 core: < 2,0)
- `memAvailable / memTotal >= 0,20` (đọc `/proc/meminfo`, ghi rõ
  nguồn; fallback `os.freemem()` nếu không có /proc, cũng ghi rõ)

Lý do chọn (ghi trong header runner): busy-loop cần gần như 1 core
rảnh; load1 từ ~1 core runnable trở lên đã đủ đè busy-loop xuống
mức phẳng ~39% như T6 thấy; RAM available < 20% là trạng thái đi
kèm các phiên tải nặng đã ghi ở đợt 39/40 (RAM dùng ~88%). Một mẫu
yên lẻ không đủ — phải yên bền qua 3 mẫu mới đo, để không đo trúng
một khe yên thoáng qua giữa các luồng khác.

Mã thoát (ghi trước, wrapper dựa vào đúng mã này):

- `0` = cổng yên (và probe đã chạy, trừ `--gate-only`) + report đã
  ghi. Vẫn CHƯA KHÓA: report chỉ là bằng chứng để phiên quyết khóa
  xem xét, không phải quyết định khóa.
- `2` = TỪ CHỐI vì máy bận/under-load + report đã ghi. Kết quả hợp
  lệ, không phải lỗi runner — và probe KHÔNG chạy trong trường hợp
  này.
- `1` = lỗi thực thi.

### 1.2 Khi yên, probe chạy đúng protocol U4 phần (a) — không sampler riêng

Mỗi vòng: spawn đồng thời busy-loop + idle, chờ 500 ms, lấy mẫu cây
tiến trình 2000 ms bằng `sampleCpuTree` GỐC từ `cdp-cpu-sample.mjs`
(không sampler riêng, không ngưỡng riêng), kill cả hai. Mỗi vòng ghi
loadavg trước/sau. Chẩn đoán cuối chạy qua module V6 gốc
`cpuGateNodeDiag40V6.ts` bằng helper strip-types
(`cpu-gate-quiet-diag-41w6.ts`) — không copy logic chẩn đoán, không
tự đặt ngưỡng. Helper CHỈ gọi `diagnoseNodeLayer`; tầng CDP KHÔNG đo
ở runner này (T6 đã phân biệt CDP 3/3; khóa thật vẫn cần phiên U4
đầy đủ CDP + Node lúc yên — xem §3). Trường CDP trong helper để
`NaN` cố tình (không phải số 0) kèm chú thích cấm đưa vào
`evaluateCpuGate` / `evaluateGateWithNodeDecision`.

### 1.3 Chạy thật trong đợt này: 2 lần từ chối, probe KHÔNG chạy

Lần 1 — runner mặc định, 20:08 +07, report
`/tmp/round41-w6/cpu-quiet-run.json`, exit 2:

| Mẫu | load1 / load5 / load15 | RAM available | load đạt? | RAM đạt? |
|---|---|---|---|---|
| 1 (20:08:01) | 0,89 / 0,93 / 0,49 | 9,8% (814 MB / 7934 MB) | đạt | TRƯỢT |
| 2 (20:08:03) | 0,82 / 0,92 / 0,49 | 9,6% | đạt | TRƯỢT |
| 3 (20:08:05) | 0,82 / 0,92 / 0,49 | 9,7% | đạt | TRƯỢT |

Verdict `REFUSED-BUSY`, blockers duy nhất là 3 dòng memAvailable,
`probeRounds: null`, `diagnosis: null`, dòng in ra:
`CHƯA KHÓA — máy bận/under-load: memAvailable 9.8% < 20%; …`.

Lần 2 — wrapper (§4), 20:09 +07, report
`/tmp/round41-w6/wrapper-gate.json`, exit 2: load1 0,71 → 0,66,
load5 0,89 → 0,87 (đạt), RAM available 6,2% → 5,6% → 4,1% (trượt,
đang giảm trong lúc các luồng khác chạy). U4 KHÔNG chạy (xem §4).

Bối cảnh đầu phiên (20:05 +07, trước khi chạy runner): loadavg
1,52 / 0,79 / 0,36, RAM available 910 MB (11,5%) — tức CPU đã yên
dần từ 1,52 xuống 0,66–0,89 trong phiên, nhưng RAM available không
hồi mà còn giảm. Không suy nguyên nhân từ 2 điểm đo này; chỉ ghi
nhận dạng số.

## 2. Khung quyết định cho đợt sau (trình bày, KHÔNG tự quyết)

### 2.1 Câu hỏi số 0 — ngưỡng RAM có đạt được trên máy này không?

Trước mọi câu hỏi về busy: kiểm tra `MemAvailable` trong một phiên
chỉ có main chat (không luồng cron nào chạy). Trong suốt phiên này
RAM available chưa từng ≥ 20% (11,5% đầu phiên, 15,1%, 16,7% ở các
lần đo lẻ, 4,1–9,8% lúc chạy runner) — nếu phiên main-chat-only
cũng vậy thì ngưỡng RAM 20% gần như không bao giờ đạt trên VM 8 GB
này và sẽ phủ quyết mọi phiên quiet. Điều kiện sửa (quyết tường
minh ở đợt sau, không phải bây giờ): chỉ sửa ngưỡng RAM sau khi có
bằng chứng phiên main-chat-only, và vì lấy mẫu tick `/proc` là đo
CPU chứ không phải đo RAM nên RAM chỉ là chỉ báo áp lực chung, yếu
hơn load về mặt cơ chế. Phương án sửa khi đó: hạ xuống mức phiên
yên thật đạt được (ví dụ 10%) hoặc hạ RAM thành bằng chứng ghi kèm
(không còn là tiêu chí chặn cứng). Cấm sửa ngưỡng RAM chỉ vì nó đã
chặn 2 lần chạy này — dữ liệu chặn không tự nó chứng minh ngưỡng
sai; phiên yên thật mới chứng minh được.

### 2.2 Nếu busy vẫn trượt lúc yên (cổng yên đạt, probe chạy, diagnoseNodeLayer → fail-busy)

- **Phương án A — giữ ngưỡng busy > 50:** chỉ khi busy lúc yên ổn
  định ≥ ~90% (kiểm tra sampler V6 đã cho 96,3% khi máy không bị
  đè — gợi ý, không phải bằng chứng). Khi đó đường khóa là: phiên
  U4 đầy đủ (CDP + Node) lúc yên đạt tất cả tiêu chí → quyết khóa
  riêng theo `evaluateCpuGate`. Test cần: U4 trọn vẹn 1 phiên yên
  (CDP H1/H2 + Node 3 vòng) + report runner W6 đính kèm.
- **Phương án B — hạ ngưỡng busy:** chỉ khi busy lúc yên rơi vào
  một dải ổn định DƯỚI 50 qua ≥ 2 phiên yên riêng biệt (test lặp
  lại, không phải 1 phiên). Ngưỡng mới đặt dưới min của dải đó có
  biên, và ghi rõ là ngưỡng fit từ dữ liệu yên — không bao giờ fit
  từ dữ liệu under-load (U4/T6 cũ). Test cần: 2 phiên yên độc lập,
  mỗi phiên đủ 3 vòng, dải busy không giao nhau với 50 một cách
  mơ hồ.
- **Phương án C — loại tiêu chí busy (`busyEnabled: false` qua
  `evaluateGateWithNodeDecision`):** chỉ khi busy lúc yên dao động
  mạnh/không mang thông tin (phương sai lớn qua các phiên yên)
  trong khi idle + CDP phân biệt sạch. Khi đó cổng khóa sẽ dựa vào
  idle + CDP, và report khóa phải ghi rõ phần đã loại (trường
  `nodeExcluded` + note `CHƯA KHÓA` của V6 sinh ra để làm việc
  này). Test cần: ≥ 2 phiên yên cho thấy busy bất ổn + idle/CDP ổn
  định, kèm quyết định loại ghi tường minh.
- **Phương án D — đổi sang luật median thay vì "mọi vòng > 50":**
  không khuyến nghị nếu chưa có bằng chứng; nếu làm thì cần module
  chẩn đoán phiên bản mới + test khóa ngưỡng mới, không sửa lén
  module V6. Đây là thay đổi luật, không phải hiệu chuẩn.

Thứ tự ưu tiên khi có số yên: A trước (giữ luật nếu số ủng hộ),
rồi B hoặc C tùy hình dạng số (ổn định-dưới-ngưỡng → B; bất ổn →
C). D chỉ khi cả B và C đều không mô tả được số.

### 2.3 Quyết KHÔNG làm trong đợt này (ghi rõ để khỏi đọc lệch)

- Không hạ ngưỡng RAM dù RAM là blocker duy nhất cả 2 lần (§2.1
  giải thích vì sao phải chờ phiên yên thật).
- Không hạ/loại ngưỡng busy dù busy là tiêu chí trượt duy nhất
  trong cả 3 bộ số cũ — chưa có số yên nào để quyết.
- Không khóa cổng dù load CPU đã đạt — cổng yên là một khối, và
  khóa cần thêm tầng CDP lúc yên (§1.2).

## 3. Kiểm chứng đã chạy (số thật)

- Test runner mới: **11/11** (`node --test
  apps/web/scripts/cpu-gate-quiet-runner-41w6.test.mjs`): cổng yên
  fixture đạt, load1 thật 2,03 chặn, RAM thật 15,1% chặn, 1 mẫu spike
  chặn, biên load1 = 1,0 không yên, thiếu mẫu không yên, chuỗi từ
  chối, hình dạng `sampleSystemLoad`, diag helper trên số T6 lần 1
  (fail-busy, all-fail-flat, margin −10,6) và số quiet giả định
  (pass — GIẢ ĐỊNH, chỉ khóa hàm), probe 1 vòng smoke 500 ms chỉ
  khẳng định hình dạng (finite + ghi loadavg), không khẳng định
  ngưỡng. Lỗi trung gian duy nhất: so sánh float margin
  −10,600000000000001 vs −10,6 — sửa test dùng sai số, không sửa
  module V6.
- Hồi quy: diag V6 **17/17**, cổng T6 **8/8** (chạy lại bằng
  strip-types, Node v24.22.1).
- `tsc --noEmit`: **0 lỗi** ở lần chạy cuối. Lần chạy đầu có đúng
  1 lỗi ở file của luồng khác đang sửa dở
  (`src/lib/settleDeferred41W1.test.ts` TS5097) — luồng đó đã sửa
  xong trước lần chạy cuối; không phải lỗi của W6 và W6 không đụng
  file đó.
- `vite build`: KHÔNG chạy — W6 không đụng code nào được bundle
  (chỉ script trong `scripts/`, không import bởi app); tsc đã bao
  phủ bề mặt TS (`include: ["src"]`). Chạy build giữa lúc các luồng
  khác đang sửa `src/` dở chỉ tạo nhiễu, không thêm bằng chứng cho
  W6.
- `node --check` pass: runner + wrapper.
- Runner thật 2 lần: cả 2 đều exit 2 `REFUSED-BUSY` (§1.3). Không
  có lần chạy probe yên nào trong đợt này — đường probe yên đầy đủ
  (3 vòng 2000 ms + chẩn đoán V6) vì vậy mới được smoke-test ở mức
  hình dạng, chưa được kiểm chứng end-to-end cho tới phiên yên thật.

## 4. Nối runner vào harness — nối ở mức điều phối, không sửa U4

Wrapper mới `cpu-gate-quiet-then-u4-41w6.mjs`: bước 1 chạy runner
`--gate-only`; nếu exit 2 thì in `CHƯA KHÓA — máy bận/under-load:
U4 KHÔNG ĐƯỢC CHẠY` và thoát 2; nếu exit 0 thì chạy probe U4 và
trả nguyên mã thoát của U4. **Không sửa file U4 một chữ, không đổi
ngữ nghĩa verdict của U4** (0 = allPass, 1 = fail — chỉ xảy ra khi
U4 thật sự chạy). Lý do không nối sâu hơn: chèn cổng từ chối vào
trong U4 sẽ làm một lượt U4 "fail" lẫn lộn giữa fail ngưỡng và
không-chạy vì máy bận; nối ở mức wrapper giữ 2 ngữ nghĩa tách bạch
và giữ LIMITS U4 nguyên vẹn.

Bằng chứng nối hoạt động (20:09 +07): wrapper exit 2, file kết quả
U4 `benchmarks/results/v38-u4-cpu-calibration.json` giữ nguyên
mtime 2026-11-02 13:08:46 UTC (không bị đụng), report cổng
`/tmp/round41-w6/wrapper-gate.json` ghi `REFUSED-BUSY`.

Đường quiet của wrapper (cổng yên → chạy U4) chưa kiểm chứng
end-to-end trong đợt này vì cổng chưa từng yên — giống đường probe
yên của runner (§3), chờ phiên yên thật.

## 5. Chưa làm / không làm (trung thực)

- KHÔNG khóa cổng, KHÔNG đổi ngưỡng T6/V6/yên, KHÔNG đo probe lúc
  máy bận (ngoài 1 vòng smoke hình dạng trong test, cấm dùng làm
  bằng chứng ngưỡng).
- KHÔNG sửa `tsconfig.json`: test mới là `.test.mjs` trong
  `scripts/`, helper `.ts` cũng trong `scripts/` — tsconfig chỉ
  `include: ["src"]` nên không cần dòng exclude nào (khác với test
  `.ts` trong `src/lib/` của các đợt trước). Lưu ý: `tsconfig.json`
  đổi mtime trong lúc W6 chạy (13:07 +07) do một luồng đợt 41 khác
  đang sửa — W6 không đụng file đó, parent gộp.
- KHÔNG tạo batch paths-loop (parent gộp, theo giao luồng).
- KHÔNG chạy phiên headed/solo quiet, KHÔNG chạy U4 đầy đủ — cả
  hai đều cần máy yên + điều phối, và wrapper đã chứng minh nó từ
  chối đúng khi máy bận thay vì chạy chen.

## 6. Nợ mở (cho parent / phiên sau)

1. **Phiên yên thật (main chat, không luồng cron):** chạy wrapper
   `cpu-gate-quiet-then-u4-41w6.mjs`; nếu cổng yên thì U4 chạy trọn
   vẹn (CDP + Node) và runner probe Node đính kèm chẩn đoán V6.
   Đây là phiên duy nhất được phép quyết khóa / sửa / loại ngưỡng
   theo khung §2.
2. **Câu hỏi RAM (§2.1) đi trước câu hỏi busy:** nếu phiên yên vẫn
   chỉ trượt RAM thì quyết sửa ngưỡng RAM trước, rồi mới chạy lại
   để hỏi câu busy — không gộp 2 quyết định vào 1 lần chạy.
3. **Đường quiet end-to-end chưa kiểm chứng:** probe yên 3 vòng +
   wrapper chạy U4 thật — cả hai chờ phiên yên (§3, §4).
4. **Nợ cũ vẫn mở, không thuộc W6:** phiên headed/solo quiet đầu
   tiên với probe per-seek v2 (V6 §6.2); solo A/B thật chờ cửa sổ
   yên ~20–40 phút (đợt 40 §5.1).

## 7. File đổi/thêm (chỉ của W6 — text, không binary, không dist)

MỚI (4 file script + 1 LIMITS):

- `apps/web/scripts/cpu-gate-quiet-runner-41w6.mjs` (runner cổng
  yên + probe Node + report; exit 0/2/1 như §1.1).
- `apps/web/scripts/cpu-gate-quiet-diag-41w6.ts` (helper
  strip-types gọi `diagnoseNodeLayer` gốc; CDP = NaN, ghi rõ
  `cdpMeasured: false`).
- `apps/web/scripts/cpu-gate-quiet-then-u4-41w6.mjs` (wrapper nối
  runner → U4 ở mức điều phối, không sửa U4).
- `apps/web/scripts/cpu-gate-quiet-runner-41w6.test.mjs` (11/11).
- `docs/PHASE9_ROUND41_W6_CPU_GATE_LIMITS.md` (file này).

KHÔNG ĐỔI: `cpuGate39T6.ts` (locked:false nguyên vẹn, mtime cũ),
`clicktest-u4-round38-cpu-calibration-probe.mjs` (mtime cũ),
`cpuGateNodeDiag40V6.ts`, `apps/web/tsconfig.json` (W6 không đụng;
xem §5). Scratch: `/tmp/round41-w6/` (2 report từ chối) — không
vào batch. Không push, không tag.

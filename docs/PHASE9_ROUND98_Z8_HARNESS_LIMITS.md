# Phase 9 đợt 98 — Z8: Harness — slot 5 s /json/list, verdict vùng 0,6–0,9, bucket playT0rel, sửa test-preview-engine.sh (LIMITS)

**Nợ gốc:** LIMITS gộp đợt 97 §4 mục 8 + mục 11 (harness Y9).
**Ngày:** 2026-11-12 (lượt cron 21:35 +07; làm việc ~14:40–15:10Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái: 5/5 mục XONG + kiểm chứng bằng chạy thật + fault-injection.**
Chỉ sửa harness/test/probe — không sửa logic production, không đụng
TTS 39, birefnet, G1, `.github/workflows`, 0 binary. Marker "Đợt 98 Z8"
ở mọi chỗ sửa.

## 0. Môi trường đo

- Boot sau reboot #20 13:24:41Z (uptime 1:15 lúc bắt đầu 14:40Z).
  RAM khả dụng ~1,2 GB. 10 luồng đợt 98 chạy song song suốt lượt —
  máy KHÔNG yên (xem §5, caveat). Không reboot mới trong lượt Z8
  (reboot tiếp theo dự kiến ~15:29Z theo chu kỳ ~2h04').
- Vite dev + Chrome headless của E1 (Playwright chromium-1254) và probe
  parity tự spawn; Xvfb display do E1 tự claim (`:180`).
- Log luồng: `hidden_files/round98-z8.md`. Số liệu thô:
  `hidden_files/round98-z8/` — `e1-run1/`, `e1-run1-force2/`,
  `fi-*.log`, `test-draw-summary.mjs`, `test-preview-engine.log`.

## 1. Slot 5 s cho vòng /json/list — XONG, worst case 450 s → ~65 s

**Vấn đề:** vòng CDP `/json/list` trong E1 mặc định 180 lần, mỗi lần
timeout 2 s + ngủ 0,5 s → worst case ~450 s khi endpoint treo (Y9
§6.1 — đã chặn vô hạn thành 450 s nhưng vẫn dài).

**Quyết (theo lệnh đợt 98):** mỗi lần thử là một "slot" tối đa 5 s
(fetch timeout 2 s + ngủ tối đa 0,5 s — ép cứng bằng `Math.min` nên
không lần thử nào vượt quá slot) và toàn vòng bị chặn bởi deadline
tổng 60 s (`E1_CDP_LIST_DEADLINE_MS`, mặc định 60000).
`E1_CDP_LIST_ATTEMPTS` (mặc định 180) còn là chặn phụ; số lần thử và
số lần timeout được đếm để chẩn đoán phân biệt "endpoint treo" với
"Chrome chưa mở cổng debug". Env chỉnh slot:
`E1_CDP_LIST_SLOT_MS` (mặc định 5000).
**Worst case mới ≈ 65 s (deadline 60 s + 1 slot dở 5 s)** — giảm ~7×
so với ~450 s. Chrome khởi động bình thường chỉ cần vài lần thử
(fetch fail nhanh ~ms + ngủ 0,5 s) nên deadline 60 s không cắt lượt
chạy thật (E1 chạy thật §5 qua vòng này trong vài giây).

**Fault-injection** (hang-server tcp :9699 của Y9, `E1_DEBUG_PORT=9699`):

| case | kết quả |
|---|---|
| TRƯỚC-fix (bản copy vòng cũ, đã xoá): `E1_CDP_LIST_ATTEMPTS=3` | **exit 2**, vòng 3 lần mất ~8,0 s (vite lên 14:51:54.491Z → lỗi 14:52:02.525Z) → **~2,5 s/lần thử** → mặc định 180 lần = **~450 s** (ngoại suy số học từ chi phí/lần đo được) |
| SAU-fix, mặc định (deadline 60 s, attempts 180) | **exit 2, wall 64 s**; vòng 60,2 s / 24 lần / **24 timeout**; chẩn đoán đúng "không lấy được page target CDP (đã thử 24 lần trong 60.2 s, timeout 24 lần, deadline 60 s — …; worst case vòng này ≈ 65 s, trước Z8 là ~450 s)" |
| SAU-fix, deadline ngắn (`E1_CDP_LIST_DEADLINE_MS=10000`) | **exit 2, wall 14 s**; vòng 10,1 s / 4 lần / 4 timeout — deadline là cơ chế chặn, không phải số lần thử |
| Đối chứng server | `curl :9699/` treo (exit 28 @3 s); hang-server đã kill, cổng 9699 đóng; bản copy tạm đã xoá |

## 2. Quy tắc verdict vùng 0,6–0,9 cài vào E1/G5 — XONG

**Quy tắc (Y9 §3):** mean 5 tỉ lệ ≥ 0,9 → PASS chắc; ≤ 0,6 → FAIL
chắc; vùng (0,6–0,9) → không quyết được, đo thêm lần 2 (11 slot
nữa) rồi verdict trên mean gộp 10 tỉ lệ, ngưỡng 0,75 (không nới).

**Implement:** module mới `apps/web/scripts/deint-fps-verdict.mjs`
(hàm thuần `verdictG5` / `combineG5Verdict` / `mean` / `median` +
self-test 16 case khi chạy trực tiếp). E1 import module này; khối G5
nay: lần 1 verdict theo quy tắc → nếu chắc thì pass/fail ngay; nếu
vùng xám (hoặc `E1_G5_FORCE_SECOND_RUN=1`) thì đo thêm lần 2 bằng
đúng `measureFpsSlot`/`FPS_ORDER` cũ, gộp 10 tỉ lệ, pass/fail theo
mean gộp. Report JSON thêm `g5Rounds` (mỗi lần: ratios, rMean,
rMedian, baseMean, frozenSlots) và `g5Verdict` (rule "98Z8", rounds,
run1/run2, combinedMean/Median, verdict, certain). Slot row thêm
trường `round` (1/2). Slot G5 vẫn 3 s (không đổi — đề xuất slot 5 s
của Y9 §6.2 là cho nhịp đo FPS, không thuộc lệnh đợt 98 cho vòng
/json/list; giữ nguyên để không đổi hành vi G5).

**Test bằng dữ liệu giả lập** (`node deint-fps-verdict.mjs`):
**16/16 PASS** — gồm 10 case `verdictG5` (Y9 3 lần thật 0,93/1,12/1,16
→ PASS chắc; biên 0,9 → PASS, 0,6 → FAIL; 0,89/0,61/0,72 → vùng
xám), 3 case `combineG5Verdict` (gộp 0,78 → PASS; 0,69 → FAIL; Y9
lần 1+2 gộp 1,02 → PASS), median lẻ/chẵn, ratios rỗng phải throw.

**Chạy thật (§5):** lần 1 mean 1,1x → PASS chắc, 1 lần duy nhất;
lần ép `E1_G5_FORCE_SECOND_RUN=1` chứng minh đường lần 2 chạy được
trong vivo: lần 1 mean 1,25x (PASS chắc) → lần 2 mean 1,07x, gộp 10
tỉ lệ mean 1,16x median 1,04 → PASS (22 slot, 10/10 case). Lỗi chữ
phát hiện ở lần ép này (message lần 2 ghi sai "lần 1 trong vùng
0,6–0,9" dù lần 1 đã PASS chắc) đã sửa ngay trong file + verify 2
nhánh bằng ternary test (không chạy lại E1 cho sửa chuỗi này — đường
lần 2 đã chứng minh trong vivo trước khi sửa).

## 3. Bucket tóm tắt trừ playT0rel — XONG (3 probe)

**Sửa** (cả 3 probe cùng dòng — `probe95w3` / `probe96x5` /
`probe96x5b-frame-parity.mjs`): `sumPush(s, t, playT0rel)` nay nhận
thêm playT0rel (ms kể từ t0, null khi chưa phát); `newDrawSummary`
thêm `bucketsPlay: {}`, `prePlayN: 0`, `playT0rel: null`. Mẫu sau khi
phát bắt đầu rơi vào `bucketsPlay` 0,1,2... (từng 500 ms sau playT0);
mẫu trước khi phát (pause/seek lúc setup, playT0rel null — hoặc
`bp < 0` phòng vệ) đếm riêng `prePlayN`, không trộn vào bucketsPlay.
`buckets` (theo t0) + gap/first/last giữ nguyên để tương thích
analyzer cũ; `playT0rel` ghi live vào summary (lần đầu playT0 biết).
Export JSON đã chứa sẵn `drawsSummary`/`mainSummary` nên
`bucketsPlay`/`prePlayN` tự chảy ra kết quả, không cần sửa export.

**Unit test với hàm thật** (trích `newDrawSummary`/`sumPush` từ từng
file, mẫu Y9 — `hidden_files/round98-z8/test-draw-summary.mjs`,
playT0rel = 120000 mô phỏng lượt y9-before): **30/30 PASS** cả 3
probe — n=14, prePlayN=5, bucketsPlay tổng=9, buckets (t0) tổng=14,
bucketsPlay[0]=2 / [1]=1 / [8]=1, playT0rel ghi=120000, gapMin=100
(không âm), firstT=100 lastT=124400.

## 4. test-preview-engine.sh — SỬA XONG (chọn sửa, không chọn ghi cách chạy)

**2 lỗi sẵn** (có từ trước đợt 96, LIMITS gộp đợt 97 §4 mục 11):

1. `Cannot find module './previewClipKey62R6.ts'` — 2 nguyên nhân
   gộp, cả 2 đều sửa trong đợt này:
   - (a) `previewEngine.ts` import `"./previewClipKey62R6.ts"` (đuôi
     `.ts`, từ đợt 62 R6, 00:37Z 12/11) nhưng tsc include trong script
     thiếu file này → không biên dịch, require lỗi. Đã thêm
     `previewClipKey62R6.ts` vào include (Y10 §312 đã chẩn đoán đúng
     nguyên nhân này).
   - (b) tsc CJS emit giữ nguyên `require("./previewClipKey62R6.ts")`
     (không rewrite `.ts` → `.js`) nên dù file đã biên dịch thành
     `.js`, Node vẫn không resolve được. Đã thêm sed rewrite cùng mẫu
     với sed video-spec sẵn có trong script.
2. Thư mục `/tmp` dùng chung — 2 chỗ gộp:
   - (a) script dùng `OUT` cố định `/tmp/vcut-test-preview-engine`
     + `rm -rf` ở đầu → 2 lượt song song phá lẫn nhau. Nay mỗi lượt
     lấy thư mục riêng bằng `mktemp -d`, không `rm -rf` nữa.
   - (b) `preview-engine.test.cjs` hardcode
     `OUT = "/tmp/vcut-test-preview-engine/out"` — script mktemp
     xong test vẫn tìm đường cũ nên lỗi `Cannot find module
     '.../previewEngine.js'` (bắt được ở lần chạy đầu sau khi sửa
     script). Nay test suy OUT từ `__dirname` (thư mục chứa file test
     đã copy).

**Phát hiện thêm khi sửa xong (kỳ vọng stale, chỉ sửa test):** lần
chạy đầu sau khi sửa xong module thì assertion V1 fail:
`transClip: wipeleft p=0.5 → B từ x=50 (nhận 51.5, muốn 50)`.
Nguyên nhân: kỳ vọng test (x=50, w=50) là biên naive từ đợt 10,
trước đợt 13 C6; code đã đo thật theo strict-gt FFmpeg
(`transitionPreview.ts`, wipeleft: B bắt đầu `ti+1.5`,
`ti=floor(W*(1-p))` — p=0,5, W=100 → x=51,5, w=48,5; đo 1920x1080,
p=0,25/0,5/0,75, lệch đúng 1 cột). `transitionPreview.ts` mtime
01/11 — không luồng nào đợt 97/98 đụng tới, không phải hồi quy.
Đã sửa 2 kỳ vọng stale trong test (x 50→51,5, w 50→48,5, ghi chú
C6) — chỉ sửa test, không sửa production.

**Kết quả:** `bash apps/web/scripts/test-preview-engine.sh` →
**EXIT 0, 354 assertions pass** (25 khối test, gồm thứ tự transform
render.js speed → chroma → lut → effects → opacity → keyframes ✅).
Cách chạy đúng vẫn là chạy script này trực tiếp từ repo (như X9b);
không còn cách chạy "đúng" nào khác cần ghi riêng — mục 11 nợ đợt 97
ĐÓNG theo hướng sửa script.

## 5. E1 chạy thật — 10/10 ×2, KHÔNG yên

**Caveat lớn, ghi trước (như Y9): KHÔNG lần nào đạt chuẩn "yên"
≥10 fps baseline-mean của X6** — 10 luồng đợt 98 chạy song song,
loadavg lúc G5 14,56 (lần 1). Đây là bằng chứng dưới tải, không phải
lần yên. Nợ "lần E1 thật-yên dưới code mới" vẫn mở (xem §6).

| lần | baseline mean | 5 tỉ lệ | mean | median | verdict 98Z8 | lần đo |
|---|---|---|---|---|---|---|
| 1 (thường) | 6,35 fps | 1,26 / 1,09 / 1,23 / 1,24 / 0,7 | 1,1x | 1,23 | **PASS chắc** (≥ 0,9) | 1 |
| 2 (ép `E1_G5_FORCE_SECOND_RUN=1`) | 6,52 fps (lần 1) / 6,48 fps (lần 2) | lần 1: 0,77 / 2,76 / 0,57 / 1,01 / 1,12 → 1,25x; lần 2: 1,07 / 0,87 / 0,73 / 1,22 / 1,44 → 1,07x | **gộp 1,16x** | gộp 1,04 | **PASS** (gộp ≥ 0,75) | 2 |

- Lần 1: **10/10 pass** (G0–G5, G7a, G7b, G8, H9), exit 0, wall
  156 s. 0 slot đóng băng, 0 lỗi trang. 1 tỉ lệ lẻ 0,7 nằm trong vùng
  xám nhưng verdict dùng mean 5 tỉ lệ (1,1x) nên PASS chắc — đúng
  quy tắc (không đo lần 2 khi mean đã chắc).
- Lần 2 (ép lần 2): **10/10 pass**, exit 0, wall 270 s, 22 slot
  (rounds [1, 2] trong report), 0 slot đóng băng. Lần 1 mean 1,25x
  median 1,01 → PASS chắc; vì ép bằng env nên vẫn đo lần 2: mean
  1,07x median 1,07; gộp 10 tỉ lệ mean 1,16x median 1,04 → PASS.
  **Đường lần 2 đã chứng minh chạy được trong vivo** (không chỉ giả
  lập). Lưu ý nhiễu slot vẫn lớn dưới tải: lần 1 lần 2 có tỉ lệ lẻ
  2,76 và 0,57 (spread 0,57–2,76) — mean 2 lần (1,25x / 1,07x) vẫn
  cách ngưỡng 0,75 đủ xa nên verdict đứng; đây chính là trường hợp
  quy tắc vùng xám sinh ra để xử lý.
- Lỗi chữ bắt được ở lần 2: message pass lần 2 ghi cứng "lần 1 mean
  1,25x trong vùng 0,6–0,9 (không quyết được)" — SAI (lần 1 đã PASS
  chắc, lần 2 là ép bằng env). Verdict và số liệu đúng, chỉ chuỗi
  giải thích sai. Đã sửa thành 2 nhánh (`g5SecondReason`): ép bằng
  env → "ép đo lần 2 … dù lần 1 đã PASS chắc"; vùng xám thật → "lần
  1 … trong vùng 0,6–0,9 (không quyết được)". Verify: `node --check`
  + chạy thử ternary cả 2 nhánh (PASS hết). Không chạy lại E1 cho
  sửa chuỗi này.

## 6. Kiểm chứng tổng hợp

| Hạng mục | Kết quả |
|---|---|
| Slot 5 s /json/list — FI trước/sau | Trước: 3 lần ~8,0 s → ~450 s mặc định; sau mặc định: exit 2 wall 64 s (vòng 60,2 s / 24 lần / 24 timeout); deadline 10 s: exit 2 wall 14 s (vòng 10,1 s / 4 lần) |
| Verdict G5 — self-test giả lập | **16/16 PASS** (10 verdict + 3 combine + median + throw) |
| Bucket playT0rel — unit test hàm thật | **30/30 PASS** (3 probe × 10 check) |
| test-preview-engine.sh | **EXIT 0, 354 assertions pass** (25 khối) |
| E1 thật ×2 | Lần 1: **10/10 pass** (wall 156 s); lần 2 ép lần 2: **10/10 pass** (wall 270 s, 22 slot, gộp mean 1,16x) |
| `node --check` 6 file .mjs đã sửa/mới | pass (E1, verdict, 3 probe, hang-server) + `bash -n` script sh |
| `tsc --noEmit -p apps/web/tsconfig.json` | **0 lỗi** |
| `vite build` (từ `apps/web`) | **PASS 33,22 s** (cảnh báo chunk >500 kB đã có từ trước) |
| Runner media.* (`run-media-tests.mjs`) | **3/3 PASS** |
| Không process mồ côi của luồng này | hang-server đã kill (cổng 9699 đóng); vite/chrome/xvfb của E1 + FI đã dọn bởi cleanup; bản copy tạm trước-fix đã xoá |

## 7. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` — slot 5 s +
  deadline 60 s vòng /json/list (đếm attempts/timeouts, chẩn đoán
  mới); verdict G5 vùng 0,6–0,9 + đo lần 2 (import verdict module,
  `g5Rounds`/`g5Verdict` trong report, `round` ở slot row,
  `E1_G5_FORCE_SECOND_RUN`).
- `apps/web/scripts/deint-fps-verdict.mjs` — MỚI: quy tắc verdict G5
  thuần túy + self-test 16 case.
- `apps/web/scripts/probe95w3-frame-parity.mjs` — bucketsPlay +
  prePlayN (trừ playT0rel lúc push).
- `apps/web/scripts/probe96x5-frame-parity.mjs` — như trên.
- `apps/web/scripts/probe96x5b-frame-parity.mjs` — như trên.
- `apps/web/scripts/test-preview-engine.sh` — mktemp -d OUT riêng mỗi
  lượt; include thêm previewClipKey62R6.ts; sed rewrite require
  `.ts` → `.js`.
- `apps/web/scripts/preview-engine.test.cjs` — OUT suy từ `__dirname`;
  sửa 2 kỳ vọng wipeleft stale (C6: x 51,5 / w 48,5).
- `docs/PHASE9_ROUND98_Z8_HARNESS_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round98-z8-harness`
(`~/workspace/repo-1-push/paths-loop/phase9-round98-z8-harness.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z8.md`.
Số liệu thô: `hidden_files/round98-z8/` — `e1-run1/`,
`e1-run1-force2/`, `fi-*.log`, `test-draw-summary.mjs`,
`test-preview-engine.log`.

## 8. Nợ còn lại cho đợt sau

1. **Chưa có lần E1 thật-yên nào dưới code Z8** (baseline ≥10 fps):
   cả 2 lần Z8 đều dưới tải 10 luồng (lần 1 baseline 6,35 fps).
   Cần cửa sổ mà các luồng nặng khác tạm nghỉ (bài học X8 §4).
2. **Đường lần 2 của G5 trong vivo: ĐÃ CHỨNG MINH** (lần ép 15:01–
   15:03Z: 22 slot, gộp mean 1,16x → PASS). Còn mở: trường hợp lần 2
   cũng rơi vào vùng xám thì verdict hiện lấy mean gộp 10 tỉ lệ với
   ngưỡng 0,75 (không đo lần 3) — quy tắc này chưa được kiểm bằng dữ
   liệu thật (chỉ self-test giả lập).
3. **Slot G5 3 s → 5 s (Y9 §6.2) vẫn chưa làm:** Z8 chỉ cài verdict
   + slot cho vòng /json/list theo lệnh; đổi nhịp đo FPS là đổi hành
   vi G5, cần parent quyết riêng.
4. **`test-preview-engine.sh` còn để lại thư mục mktemp mỗi lượt**
   trong /tmp (không auto-dọn — cố ý để debug khi fail; /tmp là
   ephemeral). Nếu chạy nhiều, dọn tay các thư mục
   `/tmp/vcut-test-preview-engine.*` cũ.

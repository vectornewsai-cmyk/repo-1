# Phase 9 đợt 71 — LIMITS gộp (closing, luồng Y10)

Ngày: 09/11/2026, lượt cron 09:35 +07. 9 luồng Y1–Y9 song song + luồng Y10
(kiểm chứng độc lập + đóng sổ). KHÔNG push, KHÔNG release/tag.
HEAD GitHub vẫn `5f548ef8`. Repo local `~/workspace/repo-1` (không có `.git`).

## 1. Bảng kết quả từng luồng

| Luồng | Nhiệm vụ (nợ đợt 70 §4) | Verdict | Số đo chính |
|---|---|---|---|
| Y1 | Toast keyframe H (mục 1) | **INCONCLUSIVE-noisy-baseline — H VẪN MỞ** | Toast thấy +137,1 s (exact match, lần thứ 3 độc lập); baseline harness 10,41 > 3,0 nên không PASS theo luật đứng; poll không mù (337 samples, blindGapMs 1 ms) |
| Y2 | Δkurt R w1440 + w1920 n10 (mục 2) | **Đóng phần lớn — 13/16 KHỚP** (full-pixel + delta0, trilinear) | testsrc2 w1440 n05 0,29 / n10 0,34 KHỚP; w1920 n10 0,38 LỆCH (ngưỡng 0,35); ocean w1440 LỆCH thật (Δkurt G 1,12); không có bias đường video (MAD 0, 30 profile) |
| Y3 | Re-gate bắt FN gate 6 s (mục 3) | **FN BẮT ĐƯỢC (1/1) + resume-từ-pause KHỎE (5/5)** | S1 gate PASS delta 29 → re-gate FAIL delta 18 (FN bị chặn, biên mỏng 18 vs 20); S2/S3 re-gate PASS 137/149, 0 FP; gộp V4+X2+Y3 FN 5/18 (28%); resume draw = ticks, rs=4 250/250 mẫu |
| Y4 | Số fps birefnet (mục 4) | **VẪN KHÔNG CÓ SỐ — nhưng biết chính xác vì sao** | 4 lần thử, 0 predict hoàn thành (exit 137 SIGKILL); predict luôn chạy 1024×1024 bất kể input; đỉnh RSS lite 4,90 GiB vẫn tăng lúc chết; cần RAM trống ≥ ~6 GiB duy trì |
| Y5 | Toast trạng thái trial keyframe lâu (mục 8) | **XONG — tính năng chạy thật trong editor** | Toast dính hiện sau 5 s, tick 1 s, tự đóng khi xong; click-test headed PASS 2 lượt (toast +53,3 s, tick 5→65 s đơn điệu, đóng +114,1 s; trial ngắn không toast); i18n +1 key (vi=en=2379) |
| Y6 | SEGFAULT vidstab (mục 9) | **GIỮ `copy` vĩnh viễn — giảm crash có ý nghĩa** | COPY 0/60 crash (Wilson [0%, 6,0%], 60/60 cùng sha); NOCOPY 3/30 (10,0%); Fisher p = 0,035; gộp X8: COPY 0/78, NOCOPY 4/50; stack trace KHÔNG lấy được (RLIMIT_CORE hard=0, dmesg chặn) |
| Y7 | Ngưỡng halve Chrome (mục 10) | **ĐÃ ĐO XONG — không sửa production** | Halve = bật mip-1 tại s\* = 0,7071, bias LOD −0,500 ± 0,001 (sweep 15 thang s=0,45–0,80, Chrome 158 headed); trong 0,45–0,63 KHÔNG có ngưỡng; pooled MAD production 0,0008 |
| Y8 | Lệch 2D s≥0,6 + V_1D s=0,30 (mục 12) | **Lệch 2D CÒN (rộng hơn W5 báo); V_1D s=0,30 HẾT (artefact dữ liệu)** | Production 2D: 50 ô, maxAbs tới 13, 14/50 ô ≥ 4; chữ ký peak +5–8% (kernel tròn hơn); V_1D s=0,30 đo đủ pha 0,2678 khớp production 0,2679; mô hình nhiễu preview dự đoán verdict KHỚP 5/5 sau delta0 |
| Y9 | Kiểm tra lại TTS 39 CVE (mục 5) | **VẪN CHỜ UPSTREAM — nợ mở** | gradio mới nhất vẫn 6.31.0 (kẹp `pillow<13` còn nguyên), vieneu vẫn 3.8.3 (còn dep gradio); pip-audit chạy lại: 39, không đổi (toàn Pillow 12.3.0, fix 13.0.0) |

Đợt 70 §4 còn lại chưa đụng trong đợt 71: mục 6 (CVE npm — X4 đã đóng bằng
OSV, không còn số CVE), mục 7 (Safari thật — chưa đo), mục 11 (5 workflow
403 — chờ user cấp quyền; xem §5).

## 2. Ghi chú gộp (xung đột file chung)

- **Chỉ Y5 sửa file chung** (`preview.tsx`, `toast.ts`, `Toasts.tsx`,
  `gopRangeFetch39T3.ts`, `vi.json`/`en.json`, `tsconfig.json`,
  fragment `round71-y5.json`). Các luồng còn lại chỉ thêm file mới
  (script/harness + LIMITS). Không có luồng nào khác đụng cùng file —
  **không xung đột nội dung**.
- **Sửa gộp Y10 #1 — test css60 rách do key mới của Y5:**
  `apps/web/src/lib/cssClasses60Q2.test.ts` §8 hardcode danh sách key
  i18n của `preview.tsx` (41 key, 47 call site). Y5 thêm
  `gop.trial.running` (1 call site) nên test này FAIL với
  `deepStrictEqual` (actual có thêm key). Y10 đã cập nhật danh sách
  (+`gop.trial.running`) và số call site 47 → 48. Đây là test khóa
  danh sách, không phải lỗi sản phẩm: i18n parity vi=en=2379 vẫn đúng,
  toast chạy thật đã qua click-test headed của Y5.
  Sau sửa: css60 **59/59 PASS** (chạy lại từ gốc repo bằng esbuild
  bundle theo mẫu của chính test đó).
- **Sửa gộp Y10 #2 — chú thích ngưỡng halve (nợ Y7 §5 mục 3):**
  `apps/web/scripts/chrome-resample.mjs` (chỉ comment): dòng "Chrome có
  vẻ chỉ halve khi s<0.5 (ngưỡng chính xác 0.45–0.63 CHƯA đo)" → ghi
  kết quả đo Y7 (bật mip-1 s\* = 0,7071, bias LOD −0,500 ± 0,001;
  0,5 chỉ là hệ quả dưới mô hình 2-stage cũ). Không đổi code.
- `copy` trước `vidstabtransform` vẫn còn nguyên tại
  `server/render/src/enhance.js` (kiểm đĩa Y10). `SECURITY.md` không
  luồng đợt 71 nào đụng (giữ sửa X4/X9 đợt 70).
- **Đính chính claim Y5 "capThumb 2/2":** Y10 grep toàn repo
  (`*.ts`/`*.mjs`/`*.js`, trừ `node_modules`) không tìm thấy chuỗi
  `capThumb` — claim này không kiểm chứng được từ đĩa. Không ảnh hưởng
  cây gộp (keyframe suites 62R4–67U5 đã chạy lại xanh, xem §3); ghi
  nhận để Y5/lượt sau đối chiếu tên test.

## 3. Kiểm chứng độc lập của parent (Y10, trên cây đã gộp)

Chạy trực tiếp, không pipe qua tail:

| Kiểm chứng | Kết quả |
|---|---|
| `npx tsc --noEmit` apps/web | **0 lỗi** |
| `npx tsc --noEmit` apps/desktop | **0 lỗi** |
| `npx vite build` apps/web | **PASS** (9,15 s; bundle `index-DnpjYUK_.js` — trùng hash bundle click-test Y5) |
| i18n parity vi==en | **2379 = 2379, 0 key lệch**; `gop.trial.running` có ở cả 2 phía, nội dung đúng |
| `chrome-resample-67u2.test.mjs` (`node --test`) | **8/8** |
| Keyframe suites (esbuild bundle + `node`, theo mẫu header từng test) | 62R4 **19/19**, 63R4 **13/13**, 64R10 **11/11**, 65S6 **15/15**, 66T6 **9/9**, 67U5 **11/11** |
| css60 / css61 (esbuild bundle + `node` từ gốc repo) | css60 **59/59** (sau sửa gộp Y10 #1), css61 **60/60** |
| Test mới Y5 | registry **6/6**, toast **6/6** (`node --test`); T3 tích hợp **3/3** (esbuild CJS + `node`, fixture ffmpeg thật + HTTP Range thật) |
| `npm run test:unit` (render self-tests) | **7/7** (lut/effects/sticker/chroma/textfx/keyframes/mask) |
| `node --check` chrome-resample.mjs sau sửa comment | OK |

**Bỏ qua (có lý do):** không chạy lại harness đo nặng nhiều giờ của Y1
(click-test toast H 240 s), Y3 (5 phiên gate/resume), Y4 (birefnet —
cần RAM ≥ 12 GB, không đo được trên VM này), Y6 (90 lần vidstab +
gdb hunt), Y7/Y8 (sweep Chrome headed) — các số đo đó đã có trong
LIMITS từng luồng với log thô kèm theo; Y10 chỉ chạy lại tập kiểm
chứng đủ để xác nhận cây gộp không hỏng. Không chạy lại click-test
headed Y5 (bundle trùng hash, tsc/build/test đã xanh).

**Lưu ý phương pháp (cho đợt sau):** `node --test` trực tiếp trên
`.test.ts` FAIL hàng loạt với `ERR_MODULE_NOT_FOUND` (import
extensionless kiểu bundler, ví dụ `gopTrialDecode55L8`,
`reverseRangeGate38U2`) — đó là giới hạn của Node ESM, không phải
hỏng code. Cách chạy đúng là esbuild bundle rồi `node` file bundle,
như header từng test đã ghi. Y5/Y10 đều xác nhận lại bằng cách này.

## 4. Batch đã stage + tổng chờ push (đếm trực tiếp lại)

Đợt 71 stage 9 batch / 27 entry (Y1 1, Y2 4, Y3 3, Y4 1, Y5 13, Y6 2,
Y7 1, Y8 1, Y9 1) + closing batch Y10 3 entry (LIMITS gộp này +
2 file sửa gộp). Đếm trực tiếp toàn bộ file NUL-delimited đợt 67–71:

| Đợt | Entry | File batch |
|---|---|---|
| 67 | 68 | 9 |
| 68 | 57 | 9 |
| 69 | 33 | 9 |
| 70 | 21 | 10 |
| 71 | 42 (27 luồng + 15 closing) | 10 |
| **Tổng chờ push** | **221 entry / 47 file batch / 153 file duy nhất** | |

Kiểm tra từng entry: **mọi entry tồn tại, là text, không binary,
không workflow `.yml`**. Một lưu ý: `server/bridge/openapi.yaml`
(trong batch đợt 68 V8) là file text spec, không phải workflow —
đã nằm trong tổng từ các đợt trước, không phải file mới.
Số log Y6 (203/45) và Y3 (206/46) là snapshot giữa chừng (Y3 stage
sau Y6); số Y7 (180/38) là snapshot khi mới chỉ Y7 stage xong.
Số chốt sau Y10: **209 entry / 47 file batch / 153 file duy nhất**.
**Đính chính parent (sau Y10): 221 entry / 47 file / 153 file duy nhất**
— Y5 thêm key `gop.trial.running` vào dict (2378 → 2379) nhưng không
bump 12 test khóa số key; parent đã bump 2378 → 2379 và thêm 12 file
vào batch closing (xem §7). Số file duy nhất không đổi (12 file này đã
có trong các batch đợt trước).

Batch closing: `~/workspace/repo-1-push/paths-loop/phase9-round71-closing.txt`
(15 entry, NUL-delimited, verify read-back 15/15 tồn tại và là text):
- `docs/PHASE9_ROUND71_LIMITS.md` (file này)
- `apps/web/src/lib/cssClasses60Q2.test.ts` (sửa gộp Y10 #1)
- `apps/web/scripts/chrome-resample.mjs` (sửa gộp Y10 #2, chỉ comment)
- 12 test khóa số key (parent bump 2378 → 2379, xem §7):
  `ProjectMenu.i18n55L1`, `speedWarnTooShortDead63R10`, `reverseToggleI18n48D4`,
  `errorDetail34Q4` (chỉ comment), `reverseBadge46B6`, `reverseCompat44Z6`,
  `reversePlaybackI18n49E2`, `i18nRound57N4`, `saveToast31`,
  `structuredNotes32`, `i18nAudit59P7`, `i18nOrphans60Q4`.

## 5. Nợ mở cho đợt 72 (tổng hợp từ §nợ mở của LIMITS Y1–Y9)

1. **Toast H (Y1):** vẫn mở — chỉ còn nợ tiền đề đo: cần một lần chạy
   headed với baseline ≤ 3,0 (đổi định nghĩa baseline sang đo trước
   launch/import, hoặc chạy H solo ngoài giờ cao điểm vòng lặp) + toast
   thấy trong 75–240 s. Đường abort mù poll > 60 s chưa từng kích hoạt.
2. **w1920 noise10 testsrc2 Δkurt R 0,38** (Y2, sát nút 0,35) + **ocean
   w1440 LỆCH thật** (noise05 Δkurt G 1,12 + Δcorr 0,233; noise10
   Δkurt R 0,37) — cần khớp bước 1920→1280 với bộ lọc video-path thật
   rồi đo lại; điều kiện hoá hiệu chỉnh delta0 theo absMAD plain.
3. **Gate FN lạnh (Y3):** re-gate bắt được FN do tải, chưa chứng minh
   bắt được FN lạnh kiểu V4-P1 — cần phiên lạnh thật (đầu tiên sau
   reboot); biên re-gate mỏng (18 vs ngưỡng 20), ngưỡng chưa hiệu
   chuẩn riêng; Wilson FP [0%, 66%] còn rộng, cần thêm phiên FN.
   Đề xuất: nối re-gate vào harness như cửa kiểm tra thứ hai (tạm thời).
4. **Birefnet fps (Y4):** vẫn chưa có số — đo trên máy RAM tổng ≥ 12 GB
   (khuyến nghị 16 GB) hoặc lượt riêng yên trên VM này; đừng đo bằng
   cách đổi kích thước ảnh (predict luôn 1024×1024); giả thuyết trần
   cell 6,0 GiB chưa kiểm chứng được từ trong sandbox.
5. **Toast trial chỉ bao decode, không bao fetch remainder (Y5):**
   fetch remainder 64 MiB tốn ~48 s (W2: 50–130 s+) mà user không thấy
   toast nào — thêm trạng thái "đang tải keyframe…" với tiến độ thật
   theo chunk; đổi ngôn ngữ giữa trial thì toast đóng + hẹn lại 5 s;
   nhiều trial cùng lúc chỉ hiện run cũ nhất.
6. **SEGFAULT vidstab (Y6):** stack trace vẫn chưa có (cần môi trường
   cho core dump / gdb hunt dài); tỉ lệ crash thật sau sửa chỉ biết
  上限 ~4,7–6%; nợ cũ: log `r.signal` trong render.js khi ffmpeg bị
   kill; sửa `AVFILTERPAD_FLAG_NEEDS_WRITABLE` (build ffmpeg riêng,
   dài hạn).
7. **Ngưỡng halve — ĐÃ ĐÓNG (Y7)** nhưng còn: patch 5×5 điểm 2D đầy đủ
   ở s≥0,6; dư ±1 mức float ở s=0,75 (lợi ích thấp, không ưu tiên).
8. **Kernel 2D thật của Chrome (Y8):** chưa biết dạng — cần probe 2D
   lưới pha mịn; capture full-pixel headed w1440 (noise05/noise10) để
   xác nhận dự đoán verdict KHỚP; kiểm mô hình nhiễu trên nội dung tự
   nhiên (ocean/slovenska/basgo).
9. **TTS 39 CVE (Y9):** vẫn chờ upstream — kiểm tra lại định kỳ bằng
   `scripts/check-gradio-pillow-cap.py`; chỉ thử bump khi in
   `CAP LIFTED` (gradio > 6.31.0 gỡ kẹp `pillow<13` hoặc vieneu >
   3.8.3 bỏ dep gradio). Đây là lý do duy nhất job pip-audit sẽ ĐỎ ở
   lần chạy CI đầu tiên.
10. **Nợ chung chưa đụng:** GPU thật / Safari thật chưa đo (mọi kết
    luận chỉ đúng trên CPU/SwiftShader + Chromium); `.github/workflows/`
    vẫn 403 (ci-security.yml + ci-build.yml chờ user cấp quyền workflows
    cho App hoặc tự thêm qua web); mô hình resample phụ thuộc thang ở
    hình học vuông (trilinear −0,5 tốt nhất tổng thể nhưng 2-stage tốt
    hơn ở s=0,38, 1-kernel tốt hơn ở s=0,63–0,67 — cần probe thang dày
    + fit bias LOD theo thang trước khi đổi production); w2560 cần xác
    nhận lại bằng full-pixel.

## 6. File đổi trong đợt 71 (stage, KHÔNG push)

- Y1: `docs/PHASE9_ROUND71_Y1_TOAST_H_LIMITS.md`
- Y2: 3 script `apps/web/scripts/r71y2-{headed-capture,video-probe,analyze}.mjs`
  + `docs/PHASE9_ROUND71_Y2_KURT_R_LIMITS.md`
- Y3: 2 script `apps/web/scripts/{measure-71y3-gate-fn-launcher,analyze-71y3-gate-fn}.mjs`
  + `docs/PHASE9_ROUND71_Y3_GATE_FN_LIMITS.md`
- Y4: `docs/PHASE9_ROUND71_Y4_BIREFNET_FPS_LIMITS.md`
- Y5: registry + 3 test mới, `toast.ts`, `Toasts.tsx`,
  `gopRangeFetch39T3.ts`, `preview.tsx`, `vi.json`/`en.json` (+1 key
  `gop.trial.running`), fragment `round71-y5.json`, `tsconfig.json`
  + `docs/PHASE9_ROUND71_Y5_TRIAL_TOAST_LIMITS.md`
- Y6: `server/render/src/test_round71_y6_vidstab_segfault.js`
  + `docs/PHASE9_ROUND71_Y6_VIDSTAB_SEGFAULT_LIMITS.md`
- Y7: `docs/PHASE9_ROUND71_Y7_HALVE_THRESHOLD_LIMITS.md`
- Y8: `docs/PHASE9_ROUND71_Y8_2D_SEPARABLE_LIMITS.md`
- Y9: `docs/PHASE9_ROUND71_Y9_TTS_39_LIMITS.md`
- Y10 (closing): file này + `cssClasses60Q2.test.ts` (sửa gộp) +
  `chrome-resample.mjs` (comment ngưỡng halve) + 12 test khóa số key
  (parent bump 2378 → 2379, xem §7)

Không sửa code production nào khác. Không binary, không workflow `.yml`.
Log từng luồng: `hidden_files/round71-y{1..9}.md` + `round71-y10.md` (Y10).

## 7. Đính chính parent (sau Y10 — gộp muộn, KHÔNG push)

1. **Batch Y1 chứa đường dẫn tuyệt đối — đã sửa.** File
   `phase9-round71-y1-toast-h.txt` liệt kê
   `/home/hatch/workspace/repo-1/docs/PHASE9_ROUND71_Y1_TOAST_H_LIMITS.md`
   (đường dẫn tuyệt đối — push-files cần đường dẫn tương đối). Parent đã
   sửa thành `docs/PHASE9_ROUND71_Y1_TOAST_H_LIMITS.md`, verify NUL +
   file tồn tại. Số entry không đổi (1).
2. **12 test khóa số key chưa bump — đã bump.** Y5 thêm key
   `gop.trial.running` vào dict (2378 → 2379, vi==en) nhưng batch Y5
   không chứa 12 test khóa số key; Y10 chỉ sửa css60 test. 12 file vẫn
   assert 2378 → P7/i18nOrphans và các test đếm key sẽ ĐỎ trên cây đã
   gộp. Parent đã bump 2378 → 2379 ở cả 12 file (cùng 12 file như đợt
   67/68/69) + sửa tên test i18nOrphans cho khớp thành phần mới
   ("2379 sau đợt 68 − 1 key chết đợt 69 W3 + 1 key gop.trial.running
   đợt 71 Y5") và thêm 12 file vào batch closing. Kiểm chứng sau bump:
   P7 **8/8**, i18nOrphans **16/16**, css60 **59/59**, css61 **60/60**,
   Y5 trial **6/6**, toast **6/6**, fetch **3/3**; tsc web **0**,
   desktop **0**; r6-i18n-check **PASS** (dict 2379).
3. **Tổng chờ push sau đợt 71 (đính chính): 221 entry / 47 file batch /
   153 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9;
   đợt 71: 42/10 — closing 15 entry thay vì 3). HEAD GitHub vẫn
   `5f548ef8`. KHÔNG push.

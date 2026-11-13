# Phase 9 đợt 76 D9 — Cảnh báo letterbox + lựa chọn crop khi xuất preset 4:5

> Ngày: 10/11/2026. Luồng D9, đợt 76. Đóng nợ đợt 75 C7 §6:
> xuất preset 4:5 (`ig-portrait` 1080×1350) từ nguồn 16:9 thì letterbox
> viền đen (dải video giữa có nội dung, viền đen trên YAVG = 0) mà panel
> không cảnh báo; chưa export 4:5 với footage thật do user quay/import.

## 0. Quyết định mặc định (ghi rõ để khỏi tranh cãi sau)

- **Mặc định giữ `fit` (giữ nguyên tỉ lệ + letterbox/pillarbox nền đen)**
  — đúng hành vi cũ từ trước đợt này. Lý do: đổi mặc định sang crop sẽ
  âm thầm cắt hình user (video ngang mất hai bên) mà user không hay;
  giữ `fit` thì không ai bị mất hình bất ngờ, còn cảnh báo + lựa chọn
  crop nằm ngay dưới preset để user tự quyết.
- Lựa chọn là **per-export, persist localStorage** (`vcut-export-aspect-fit`):
  user đổi sang crop một lần thì lần mở panel sau vẫn nhớ crop.
- Cảnh báo chỉ hiện khi tỉ lệ **lệch > 1%** (dung sai `ASPECT_MISMATCH_TOLERANCE`):
  nguồn đã khớp tỉ lệ khung (vd 4:5 → 4:5, 16:9 → 16:9) thì không có
  khối cảnh báo, không có select — không cảnh báo thừa.

## 1. Đã làm gì

1. **Module render mới `server/render/src/fitChain.js`** — điểm duy nhất
   quyết định hành vi lấp khung cho clip video, dùng chung bởi render.js
   (nhánh thường) và speedramp.js (nhánh speed ramp):
   - `fit`: `scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:...`
     (hành vi cũ, giữ tỉ lệ, viền đen hoặc trong suốt khi chroma/alpha).
   - `crop`: `scale=W:H:force_original_aspect_ratio=increase,crop=W:H`
     (cover, giống `image.js` fit="cover": phóng to lấp đầy rồi crop giữa).
   - Self-test 6 nhóm assert (mặc định fit, giá trị lạ → fit, crop đúng
     chuỗi, padColor trong suốt, W/H sai throw, whitelist).
2. **`render.js` — cờ `--aspect-fit <fit|crop>`** (mặc định fit, giá trị
   lạ → exit 2), nối qua ctx `aspectFit` vào `buildFilterGraph`; nhánh
   clip thường và `buildSpeedRampVideo` đều dùng `buildFitChain`.
   **Không** đụng image clip (đã có fit per-clip riêng), text, sticker.
3. **`speedramp.js`** — `buildSpeedRampVideo` nhận `opts.aspectFit`,
   dùng `buildFitChain` thay chuỗi scale+pad viết tay cũ.
4. **Bridge `server/bridge/src/index.js`** — `parsePreset` whitelist
   `aspectFit` ("fit"|"crop", giá trị khác → giữ mặc định fit, KHÔNG
   throw, KHÔNG thêm mã lỗi — catalog bridgeErrors 102 mã giữ nguyên,
   theo đúng mẫu `stabSingleThread` đợt 68 V2); `spawnJob` chỉ push
   `--aspect-fit crop` khi crop rõ ràng (fit là mặc định của render.js).
5. **Web lib mới `apps/web/src/lib/aspectFit76D9.ts`** (thuần + localStorage
   inject được cho test):
   - `aspectMismatch(srcW, srcH, dstW, dstH)`: `null` (khớp trong 1%),
     `"letterbox"` (nguồn rộng hơn → viền đen trên/dưới),
     `"pillarbox"` (nguồn hẹp hơn → viền đen hai bên).
   - `aspectRatioLabel`: rút gọn bằng gcd (1280×720 → "16:9",
     1080×1350 → "4:5").
   - `normalizeAspectFit` / `loadAspectFit` / `saveAspectFit`
     (key `vcut-export-aspect-fit`, mặc định "fit").
6. **`ExportPanel.tsx`** — khi `fitMismatch !== null`, hiện khối
   `data-testid="aspect-fit-warning"` (role="alert") ngay dưới mô tả
   preset: câu cảnh báo nêu đúng tỉ lệ nguồn → khung đích + hướng viền
   (`exportPanel.aspectFitWarnLetterbox` / `aspectFitWarnPillarbox`),
   select `#export-aspect-fit` (fit/crop, disable khi đang render),
   hint crop khi chọn crop. `startRender` gửi `aspectFit` trong preset
   JSON của POST `/api/render`. Không thêm class CSS mới (dùng lại
   `.tips` / `.preset-row` sẵn có) nên không cần cập nhật css60.
7. **i18n: +6 key `exportPanel.aspectFit*`** (vi+en, placeholder
   {src}/{dst} khớp, vi khác en) → dict **2413 → 2419** mỗi bên.
   Bump 11 test khóa số key 2413 → 2419 (25 dòng assert + tên test) +
   cập nhật comment lịch sử ở 4 file (ProjectMenu, i18nOrphans,
   speedWarn, errorDetail) + 2 comment của D8 nhắc số cũ
   (codecProbeDebts76D8.test.ts, Timeline.tsx — D8 đã lường trước D9
   thêm key, xem LIMITS D8). D8 đợt 76 KHÔNG thêm key nên không xung đột
   dict; lúc bắt đầu luồng dict vẫn 2413, lúc kết thúc 2419 do đúng 6 key
   này.

## 2. Kiểm chứng (số thật)

| Kiểm tra | Kết quả |
|---|---|
| `fitChain.js --self-test` | **pass** (6 nhóm assert) |
| `aspectFit76D9.test.ts` (mới, 23 test) | **23/23 pass** — label gcd, mismatch 4 hướng, dung sai 1%, normalize, load/save (kể cả kho throw), 6 key i18n, nối tĩnh ExportPanel/bridge/render |
| `test_export_aspect_fit_76d9.js` (mới, 34 test) | **34/34 pass** — xem §3 |
| `test_export_preset45_74b5.js` (B5, regression) | **17/17 pass** |
| `test_export_presets.js` (regression) | **22/22 pass** |
| `safeArea73A9.test.ts` (regression) | **13/13 pass** |
| `safeAreaOverlay73A9.render.test.ts` (regression) | **pass** (qua run-node-test.mjs) |
| `codecProbeDebts76D8.test.ts` (D8, regression) | **pass** |
| `stabSingleThread68V2.test.ts` (regression) | **pass** |
| 11 test khóa số key đã bump | **xanh hết** (ProjectMenu 6/6, codecProbeUi 16/16, i18nAudit59P7 8/8, i18nRound57N4 14/14, reverseBadge 8/8, reverseCompat 10/10, reversePlayback 3/3, reverseToggle 3/3, saveToast 15/15, structuredNotes 12/12, errorDetail 35/35) |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** |
| `r6-i18n-check.cjs` | **PASS** — vi=2419 en=2419 |
| `tsc --noEmit` apps/web | **0 lỗi** (1 lỗi import thừa type ở test mới đã sửa ngay) |
| `vite build` apps/web | **pass** (20,70s) |
| E2E CDP `preset45-letterbox-76d9.cdp.mjs` (mới) | **34/34 pass** — xem §4 |

### §3. Test render thật (testsrc2, không browser)

- Nguồn đối chứng: testsrc2 640×360 band trên YAVG = **125,2** (sáng,
  không có viền đen sẵn) nên phép đo viền dưới đây có nghĩa.
- Dry-run: mặc định → `decrease` + `pad=1080:1350`; `--aspect-fit crop`
  → `increase` + `crop=1080:1350`, không pad; giá trị lạ → exit 2.
- Fit, nguồn 16:9 → MP4 1080×1350, 60 frame, 2,000s (render 3,8s):
  viền trên YAVG **0,00 / 0,00** (t=0,5 / t=1,5), dải giữa YAVG 95,6.
- Crop, nguồn 16:9 → MP4 1080×1350, 60 frame, 2,000s (render 3,8s):
  viền trên YAVG **128,7 / 128,1**, dải giữa YAVG 126,6 — hết viền đen.
- Fit, nguồn đã 4:5 (540×675) → MP4 1080×1350, 60 frame, 2,000s:
  viền trên YAVG **126,4 / 125,9** — không viền đen thừa.
- Nhánh speed ramp (unit `buildSpeedRampVideo`): fit → decrease+pad,
  crop → increase+crop, không pad.

### §4. E2E headed/CDP (project mẫu thật, 2 clip × 4s + text, 8s)

- [2] Preset mặc định 1080p (khớp 16:9): **không** khối cảnh báo,
  **không** select `#export-aspect-fit` (không cảnh báo thừa).
- [3] Chọn ig-portrait → cảnh báo hiện đúng chữ:
  "⚠️ Video nguồn 16:9 xuất ra khung 4:5: giữ nguyên tỉ lệ sẽ có viền
  đen trên/dưới." Select mặc định "fit", chưa hiện hint crop.
- [4] Chọn crop → hint crop hiện ("Crop giữa cắt phần hình ngoài
  khung…"). Bấm Xuất bằng chuột thật → job `1faf7aa93c3441bf` **done sau
  32,8s** (8s video, 240 frame → ≈ 7,3 fps render trên VM CPU-only);
  MP4 **1.963.702 byte**, ffprobe **1080×1350, 30/1, h264, 8,000s,
  240 frame**; pixel: viền trên YAVG **45,1** (> 5, CÓ nội dung),
  dải giữa YAVG 67,5 — **hết viền đen**.
- [5] Chọn lại fit → bấm Xuất lần nữa → job `1de0ed52d01e2c13` **done
  sau 18,8s**; MP4 **1.057.637 byte**, ffprobe 1080×1350, 240 frame;
  pixel: viền trên YAVG **0,00** (đen), dải giữa YAVG 44,3 — letterbox
  giữ nguyên như mặc định cũ (đối chứng cùng nguồn, cùng preset).

## 3. Giới hạn trung thực

- **Click-test là Chromium headless qua CDP, KHÔNG phải headed GUI**
  (VM không có màn hình/X): click chuột thật + render thật trong
  browser, nhưng không có cửa sổ hiển thị để mắt người xem trực tiếp.
- **Chưa export 4:5 với footage thật do user quay/import** (nợ gốc của
  C7 vẫn mở ở điểm này): mọi số đo trên dùng project mẫu (video
  canvas-generated 640×360 webm) và testsrc2 lavfi. `render.js` không
  có nhánh riêng theo nguồn footage nên rủi ro còn lại là thấp, nhưng
  chưa có số đo trên footage thật.
- **Trường hợp nguồn đã 4:5 "không cảnh báo thừa"** được chứng minh ở
  3 tầng: unit `aspectMismatch(1080,1350 → 1080,1350) = null`, render
  thật §3 (nguồn 540×675 fit không viền đen), E2E [2] (preset khớp tỉ
  lệ nguồn thì không cảnh báo). E2E **không** đổi được meta project mẫu
  sang 4:5 từ UI nên không có lần click-test headed nào với project
  4:5 thật — đó là giới hạn của tầng E2E, không phải của tính năng.
- **Crop giữa là crop TĨNH theo tâm khung** (`crop=W:H` mặc định lấy
  giữa): chủ thể lệch tâm có thể bị cắt mất một phần. Muốn bám chủ thể
  thì dùng Auto-reframe (mục riêng trong ExportPanel, theo dõi
  face/motion) rồi xuất — crop ở đây không thay thế reframe.
- **Cảnh báo dựa trên meta project** (khung timeline), không phải từng
  clip: project 16:9 nhưng có clip dọc lẻ thì clip đó vẫn letterbox/
  pillarbox theo tỉ lệ riêng của nó — cảnh báo nói về khung chung,
  không soi từng clip.
- **Render đo trên VM CPU-only, project mẫu nhẹ**: crop 7,3 fps / fit
  ~12,8 fps cho 8s video 1080×1350 (chênh nhau do nội dung crop phải
  scale lớn hơn trước khi crop); không đại diện cho footage thật
  (benchmark 1080p ~12fps của repo vẫn đúng cho video thật).
- **Không sửa `preview.tsx`/`styles.css`** nên không cần cập nhật
  css60/css61; không đụng file workflow; không binary trong batch.
- **Dọn dẹp:** bridge 8787 + preview 4177 đã tắt sau khi test xong
  (kill theo PID — lưu ý: `npx vite preview` chạy qua subshell nên PID
  subshell không phải PID vite, phải kill PID nghe cổng 4177 lấy từ
  `ss -ltnp`); MP4 E2E chỉ nằm ở `~/workspace/.scratch-76d9/e2e/`
  (không stage, không commit); `/tmp` trên VM này bị dọn giữa các lượt
  exec nên artifact test render ở `/tmp/aspect76d9` đã mất — số đo đã
  ghi hết trong LIMITS này, không cần chạy lại để lấy số.

## 4. File stage (batch `phase9-round76-d9-preset45-letterbox.txt`)

27 file text, đường dẫn tương đối từ gốc repo — xem file paths đã stage.
Không binary, không workflow. Không push (theo luật cứng).

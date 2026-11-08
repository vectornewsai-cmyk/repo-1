# Đợt 59 P9 — Kiểm chứng render thật cho Enhance (gap E3): LIMITS trung thực

Ngày đo: 2026-11-07. Máy đo: VM này (4 vCPU theo `nproc`, RAM ~7.8GB,
CPU-only, FFmpeg 8.1.2, libx264). Harness mới:
`server/render/src/test_round59_p9_enhance_render.js` — **52/52 pass**.
Metric hiệu ứng 320x180 chạy lại tươi bằng `test_p2.js` cũ — **33/33 pass**.
Luồng này CHỈ kiểm chứng đường render; **UI Enhance ĐÃ CÓ SẴN từ Phase 9
R2** (`apps/web/src/components/enhance/EnhancePanel.tsx`, nối
`clip.enhance` ra Inspector — xem header file đó) nên tiền đề "E3: Enhance
không có UI" trong PHASE9_GAP_ANALYSIS.md đã cũ — luồng này KHÔNG phát
hiện UI thiếu, và không đụng UI. Luồng P8 cùng đợt làm preset trên panel
có sẵn (`enhancePresets59P8.test.ts`), không phải tạo panel mới.

## 1. Kết luận ngắn

- Cả ba enhance (**deinterlace / stabilize / denoise**) đều render THẬT:
  flag FFmpeg chính xác đã nằm trong graph (`--dry-run` xác nhận, xem §2),
  output MP4 đọc được, đúng thời lượng, và khác biệt đo được so với đối
  chứng không enhance (xem §4).
- **Không phát hiện enhance nào khai báo nhưng render bỏ qua** — nhiệm vụ
  (d) của đợt này kết thúc với kết luận "không có bug để sửa": không sửa
  code render, không đổi shape `clip.enhance`, không thêm chuỗi i18n.
- FPS 720p lần đầu đo đủ cả ba enhance (xem §3). Số tuyệt đối dao động
  mạnh theo tải VM — chỉ tỉ lệ/hướng so sánh trong cùng một lượt chạy mới
  ổn định, xem cảnh báo ở §5.

## 2. (a) Flag FFmpeg — xác nhận trong graph thật (`--dry-run`)

| Enhance (spec) | Filter trong graph |
|---|---|
| `denoise: true` / `{ strength: 0.5 }` | `hqdn3d=12:9:12:9` |
| `denoise: { strength: 1 }` | `hqdn3d=24:18:24:18` |
| `deinterlace: true` | `yadif=mode=0:parity=-1:deint=0` |
| `deinterlace: { mode: 1 }` | `yadif=mode=1:parity=-1:deint=0` |
| `stabilize: { smoothing: 30 }` | `vidstabtransform=input='<tmp>.trf':smoothing=30:optalgo=gauss` |
| (không enhance) | graph không chứa `yadif` / `vidstabtransform` / `hqdn3d` |

- `probeFilterSupport("ffmpeg")` trả đủ cả 4 filter:
  `vidstabdetect / vidstabtransform / hqdn3d / yadif` đều `true`.
- `enhance.js --self-test` pass. Transform KHÔNG chứa option của detect
  (`shakiness`/`accuracy` không xuất hiện trong graph transform) — đúng
  như ENHANCE_LIMITS.md §2 đã ghi.
- Pass vidstabdetect chạy thật trước render chính: log render ghi
  `stabilize "c0" → /tmp/repo1-vidstab-<pid>-c0.trf` (assert trong harness).
- Vị trí chain (đọc code, khớp ENHANCE_LIMITS.md): yadif + vidstabtransform
  trước speed; hqdn3d sau scale/pad cùng vị trí effects.

## 3. (c) FPS render thật 720p, 5s (150 frame), veryfast/CRF23

Cấu hình benchmark khớp RESULTS.md §7.1 (veryfast/CRF23, 720p 5s) để so
được với số Phase 8. Nguồn: testsrc2 720p (baseline), testsrc2 + noise
`alls=15` (denoise), xám phẳng + noise `alls=15` (denoise phẳng),
testsrc2 60fps + `tinterlace` (deinterlace), shaky upscale từ nguồn rung
P2 320x180 (stabilize — xem §5 về nguồn gốc), testsrc2 + tinterlace +
noise (combo). FPS = 150 / wall time end-to-end (gồm cả pass
vidstabdetect với stabilize và thời gian khởi động node).

| Cấu hình | Wall | FPS | Ghi chú |
|---|---|---|---|
| baseline (testsrc2 sạch, không enhance) | 3.13s | **47.86** | tham chiếu |
| denoise 0.5 (testsrc2 + nhiễu) | 12.45s | **12.05** | chạy lại: 14.4 / 9.9 fps |
| denoise 1.0 (testsrc2 + nhiễu) | 18.55s | **8.09** | strength càng cao càng chậm |
| noisy-control (cùng nguồn, không enhance) | 23.97s | **6.26** | chạy lại: ~7.1 fps |
| flat-control (xám phẳng + nhiễu) | 23.52s | **6.38** | chạy lại: 9.3 / 11.8 fps |
| flat-denoise 0.5 (xám phẳng + nhiễu) | 29.20s | **5.14** | chạy lại: 6.2 / 8.3 fps |
| stab-control (shaky, không enhance) | 13.34s | **11.25** | |
| stabilize smoothing 30 | 21.99s | **6.82** | gồm cả pass detect |
| deint-control (interlaced, không enhance) | 5.80s | **25.84** | |
| deinterlace (yadif mode 0) | 6.07s | **24.70** | yadif gần như miễn phí |
| combo cả ba (deint + stab 30 + denoise 0.5) | 42.99s | **3.49** | chậm nhất, như kỳ vọng |

So với Phase 8 (RESULTS.md §7.1): denoise-720p khi đó **9.24 fps**
(16.24s, clip 5s + text overlay). Đợt này denoise 0.5 đo **12.05 fps**
(không text overlay, nguồn testsrc2 + nhiễu) — cùng bậc độ lớn, **không
so trực tiếp theo số tuyệt đối** vì cấu hình spec khác (có/không text,
nguồn khác).

### Phát hiện ngược trực giác — denoise có thể LÀM NHANH render

Trên nguồn testsrc2 + nhiễu, denoise 0.5 (**12.05 fps**) render NHANH
hơn đối chứng không enhance (**6.26 fps**) — lặp lại ổn định ở cả 3 lần
đo (harness + 2 lần chạy lại xen kẽ). Lý do: nhiễu làm x264 tốn kém
(output đối chứng 11.3MB so với 4.5MB sau denoise); hqdn3d khử nhiễu
trước nên encoder nhẹ việc hơn nhiều so với chi phí của chính filter.
Bằng chứng kích thước file: noisy-control 11,343,705 byte → denoise-0.5
4,458,185 byte (cùng CRF 23).

Ngược lại, trên nền xám phẳng + nhiễu, denoise 0.5 (**5.14 fps**) CHẬM
hơn đối chứng (**6.38 fps**) — cũng lặp lại ở cả 3 lần đo. Ở đây tiết
kiệm encoder (9.57MB → 5.02MB) không bù được chi phí filter.

Kết luận trung thực: **không được nói "denoise làm chậm render" một cách
chung chung** — hướng tác động lên tốc độ phụ thuộc vào nội dung nguồn:
nội dung chi tiết + nhiễu mạnh thì denoise có thể tăng tốc ròng; nền
phẳng thì denoise làm chậm. Cả hai hướng đều đo được lặp lại, không phải
nhiễu phép đo.

## 4. (b) Output khác biệt đo được + metric hiệu ứng

### 4.1 Ở 720p (harness mới)

- Mọi output: codec `h264`, `1280x720`, thời lượng `5.0s` đúng (±0s đo
  bằng ffprobe), file > 0 byte.
- Denoise, nền phẳng: std frame giữa **4.439 → 1.986** (strength 0.5,
  giảm còn ~45%).
- Denoise, testsrc2 nhiễu: so frame với đối chứng — mean abs diff
  **3.856**, **13.3%** pixel lệch > 8 (filter đã đổi pixel rõ rệt).
- Deinterlace: idet prog **0.000 → 0.993** (đối chứng TFF 150/150;
  sau yadif Progressive 149/150).
- Stabilize: so frame với đối chứng — mean abs diff **13.913**,
  **17.6%** pixel lệch > 8 (transform đã áp).
- Combo cả ba: render OK, đúng thời lượng/codec/res.

### 4.2 Ở 320x180 — chạy lại `test_p2.js` (2026-11-07, 33/33 pass)

| Metric | Trước | Sau enhance | Kết luận |
|---|---|---|---|
| stabilize redx std | 3.507 | **1.55** | jitter giảm ~56% |
| stabilize consec MAD | 10.244 | **1.252** | giảm ~88% |
| denoise noise std (strength 1.0) | 9.304 | **1.308** | giảm ~86% |
| deinterlace idet prog | 0 | **0.983** | đối chứng vẫn 0 |

Số gần khớp với lần đo gốc của P2 (redx 1.768, MAD 1.715) — chênh lệch
nhỏ do tải VM, hướng kết luận không đổi.

### 4.3 Tính lặp lại

Chạy lại 8 render denoise/control (2 vòng xen kẽ): mọi output có kích
thước byte **giống hệt nhau giữa các lần chạy** (vd denoise-0.5 đúng
4,458,185 byte cả 3 lần) — encode xác định (deterministic), không có
yếu tố ngẫu nhiên theo thời gian trong pipeline enhance.

## 5. Giới hạn — đọc trước khi trích số

1. **FPS tuyệt đối dao động ±30–40% giữa các lần chạy trên VM chia sẻ.**
   Trong đợt này load average tăng từ 1.37 (lúc bắt đầu) lên 9.29 (giữa
   lượt chạy lại) vì các luồng round-59 khác chạy song song. Chỉ tỉ
   lệ/hướng so sánh trong cùng một lượt (denoise nhanh hơn control trên
   testsrc2 nhiễu; chậm hơn trên nền phẳng; stabilize ~0.6× control;
   deinterlace ≈ control) là phần ổn định. Đừng trích FPS tuyệt đối
   trong bảng §3 như số lab-grade.
2. **FPS stabilize là end-to-end** (gồm pass vidstabdetect + khởi động
   node/render.js), không phải FPS riêng filter transform. Muốn tách chi
   phí detect/transform phải đo riêng từng pass — chưa làm.
3. **Nguồn shaky 720p là upscale** (lanczos) từ nguồn rung 320x180 của
   P2 (tremor cao tần ±7px, seed cố định), không phải footage rung quay
   thật ở 720p. Metric giảm jitter (redx/MAD) chỉ kiểm chứng lại ở
   320x180 (§4.2); ở 720p chỉ chứng minh transform chạy + đổi frame +
   FPS. Footage thật 720p có thể cho số FPS stabilize khác (vidstabdetect
   phụ thuộc texture).
4. **Combo 3.49 fps** — bật cả ba enhance trên clip 720p dài sẽ rất
   chậm trên CPU yếu; đây là số thật, không phải lỗi đo.
5. **Denoise trên nền phẳng vs chi tiết cho hướng tốc độ ngược nhau**
   (§3) — đừng quảng cáo denoise "tối ưu tốc độ" hay "làm chậm" chung chung.
6. Các giới hạn cũ trong `server/render/src/ENHANCE_LIMITS.md` vẫn giữ
   nguyên (vidstab chỉ khử được tremor cao tần biên độ nhỏ; hqdn3d
   strength cao gây ghosting nhẹ trên cảnh chuyển động nhanh — chưa đo;
   yadif `parity=-1` phụ thuộc flag field của stream; GPU encode chưa
   test trên phần cứng thật).
7. **tsc apps/web: 4 lỗi, KHÔNG thuộc file luồng này đụng** (luồng này
   không sửa file apps/web nào): `src/lib/binPersist59P1.test.ts` 2×
   TS5097 (file của luồng P1 cùng đợt) và `src/preview.tsx` 2× TS6133
   (biến không dùng). Không sửa hộ để tránh xung đột với luồng khác.
8. File tạm/render output nằm ở `/tmp/vcut-r59p9-CGuW3n` (spec JSON,
   MP4, frame PNG) và `/tmp/r59p9-rerun` (8 MP4 chạy lại) — KHÔNG nằm
   trong repo, KHÔNG đưa vào batch push.

## 6. Cách chạy lại

```bash
node server/render/src/test_round59_p9_enhance_render.js  # 52 check, vài phút
node server/render/test_p2.js                             # 33 check, ~30s
node server/render/src/enhance.js --self-test
```

## 7. Nợ mở cho đợt sau

- Đo FPS stabilize/deinterlace lặp lại 2–3 lần như đã làm với denoise
  (đợt này chỉ đo 1 lần cho 2 enhance đó).
- Tách chi phí pass vidstabdetect vs transform (đo riêng từng pass).
- Đo denoise strength 0.3–0.7 trên footage chuyển động nhanh để kiểm
  chứng cảnh báo ghosting trong ENHANCE_LIMITS.md §3 (chưa có số đo).
- Đo FPS enhance ở 1080p (đợt này chỉ 720p; Phase 8 baseline 1080p là
  12.54 fps không enhance).
- Panel Enhance đã có sẵn từ R2 (xem đầu file này) — không còn việc "tạo
  UI enhance"; click-test panel thuộc phạm vi UI, ngoài luồng render này
  (P8 đang làm preset trên panel có sẵn).

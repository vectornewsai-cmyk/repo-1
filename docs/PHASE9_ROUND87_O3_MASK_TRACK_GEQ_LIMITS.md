# PHASE9_ROUND87_O3 — Mask bám motion track: đường geq động (A/B đối chứng)

- Đợt: 87, luồng O3 (đường thay thế — so với đường mask-video chính của O2).
- Ngày: 2026-11-11. VM: 4 vCPU, RAM khả dụng ~0.5–1.3 GB lúc đo, ffmpeg 8.1.2.
- Harness: `server/render/src/test_round87_o3_mask_track_geq.js` — **21 pass, 0 fail**.
- Không push. Không release/tag. Không đụng TTS 39, không đụng file workflow.

## 1. Đã làm gì

Đường geq động sau cờ riêng `--mask-mode trackgeq` (mặc định vẫn `png`, không đổi):

- `server/render/src/mask.js` (marker `đợt 87 O3`):
  `buildMaskTrackGeqExpr(mask, track, W, H)` — tâm mask = quỹ đạo
  `clip.track` theo biến thời gian `T` của geq (nội suy tuyến tính giữa các
  điểm mẫu qua `buildAxisExpr` của `tracking.js`, cùng pattern overlay
  sticker Q5/D3; kẹp ngoài khoảng). `buildMaskTrackGeqChain` — cùng khung
  split/alphaextract/geq/alphamerge như `buildMaskChain`, chỉ khác biểu thức.
  Tối ưu nhỏ: trục nào mọi điểm cùng giá trị thì dùng hằng số (track ngang
  y=const là ca thường gặp). `T` là thời gian clip-local vì unit đã
  `trim/setpts=PTS-STARTPTS` trước khi áp mask (render.js bước 1) — đã
  kiểm chứng bằng đo vị trí (§3), không chỉ suy luận từ code.
- `server/render/src/render.js` (marker `đợt 87 O3`): `--mask-mode` nhận
  thêm `trackgeq`; `maskChainForSite` thêm tham số `track` (3 site: video
  thường, video ramp, image); mode trackgeq + clip có track → geq động,
  track thắng keyframes (keyframes bị bỏ qua ở mode này); không track →
  geq tĩnh như mode geq. `ctx.maskMode` được truyền vào `buildFilterGraph`.
- Self-test `mask.js --self-test` xanh toàn bộ (gồm §10b O3 + §10 O2 + §11 O1).

## 2. Phát hiện quan trọng: bẫy double-shift (đã đo, không phải lý thuyết)

Mask áp trong không gian unit (WxH, tọa độ clip-local), rồi D3 (Phase 9)
dịch cả unit để tâm unit bám điểm track. Nếu tâm mask CŨNG bám track trong
unit thì tâm cuối trên canvas = track + (track − 0.5) = **2·track − 0.5** —
sai. Vì vậy ở mode trackgeq, khi clip có mask+track thì **bỏ qua shift D3**
(video đứng yên, chỉ mask chạy theo vật) — dry-run xác nhận
`overlay=x='0'` ở mode trackgeq, và centroid đo được khớp kỳ vọng (§3).

Hệ quả đo được (nguồn gradient ngang, §4): trackgeq cho thấy vùng nguồn
QUANH điểm track; còn đường cũ (geq tĩnh tâm 0.5 + shift D3) cho thấy mãi
vùng GIỮA nguồn. Hai đường đặt tâm mask cùng một chỗ nhưng thấy nội dung
khác nhau — trackgeq mới đúng ngữ nghĩa "mask bám vật, video đứng yên"
kiểu CapCut. O2 đã độc lập đi tới cùng kết luận và mở rộng luật bỏ D3
sang cả mode png mặc định cho clip track+mask (xem §6).

## 3. A/B công bằng (cùng clip 720p 4s, 30fps, ellipse w=h=0.3, feather 0.2, track 0.2→0.8)

Track: t=0 (0.2,0.5), t=2 (0.5,0.5), t=4 (0.8,0.5). Nguồn đỏ phẳng cho
đo centroid/feather; nguồn gradient ngang cho đo vùng nguồn nhìn thấy.
Render tuần tự trong luồng (RAM VM thấp).

### (a) Độ chính xác vị trí — centroid vùng sáng, kỳ vọng x=352/640/928, y=360

| t | trackgeq (mới) | geq tĩnh + D3 (cũ) | PNG tĩnh tại đúng vị trí |
|---|---|---|---|
| 0.5 | 351.8 (−0.2px) | 352.0 (0.0px) | 352.0 (x=0.275) |
| 2.0 | 640.1 (+0.1px) | 640.0 (0.0px) | 640.0 (x=0.5) |
| 3.5 | 928.1 (+0.1px) | 927.9 (−0.1px) | 928.0 (x=0.725) |

Kết luận trục này: **HÒA**. geq động bám đúng tới ±0.2px — nhưng mask tĩnh
tâm 0.5 cưỡi shift D3 cũng về đúng điểm track (hiệu ứng đã có từ D3).
Vị trí không phải điểm phân biệt hai đường.

### (b) Tốc độ render — fps = frames / wall time

| Đường | fps 720p 4s (120 frame) |
|---|---|
| trackgeq động (mới) | **1.14** (105.2s) |
| geq tĩnh (cũ) | 1.11 (108.4s) |
| PNG tĩnh (mặc định) | **12.14** (9.9s) |

Kết luận trục này: **geq động THUA NẶNG** — chậm hơn đường PNG ~10.6×.
Nhưng lưu ý: geq động KHÔNG chậm hơn geq tĩnh (1.14 vs 1.11 fps — chuỗi
if theo T thêm vào gần như không tốn thêm; chi phí geq nằm ở đánh giá
biểu thức từng pixel nói chung). Đối chứng 360p: track 20 điểm, ellipse,
2s → 2.65 fps (60 frame / 22.6s), tâm t=1 đo 319.9 (kỳ vọng 320).

### (c) Chất lượng biên mask (feather) — độ rộng chuyển tiếp 10%→90% trên profile ngang qua tâm (kỳ vọng ≈ 0.8 × band = 0.8 × 43.2 ≈ 34.6px)

| | t=0.5 | t=2.0 | t=3.5 |
|---|---|---|---|
| trackgeq động | 34px | 34px | 34px |
| PNG tĩnh tại đúng vị trí | 34px | — | 34px |

Kết luận trục này: **HÒA TUYỆT ĐỐI** — biên feather của geq động giống
hệt PNG tới từng pixel đo được.

### (d) Vùng nguồn nhìn thấy — mean luma frame, nguồn gradient 0→255

| t | trackgeq | geq tĩnh + D3 |
|---|---|---|
| 0.5 | 4.99 (kỳ vọng ~4.9) | 9.15 |
| 2.0 | 9.14 | 9.14 |
| 3.5 | 13.31 (kỳ vọng ~13.1) | 9.15 |

Kết luận trục này: **geq động THẮNG về ngữ nghĩa** — vùng nguồn dịch theo
track (4.99→9.14→13.31); đường cũ luôn thấy giữa nguồn (9.15 hằng).
Đây là điểm khác biệt thật duy nhất ngoài tốc độ.

## 4. Khả thi biểu thức dài (giới hạn ffmpeg)

- Độ dài biểu thức ellipse 720p: 3 điểm → 364 ký tự; 20 điểm → 2.660;
  240 điểm (tối đa theo validator) → **30.638 ký tự**. Dry-run với track
  240 điểm: ffmpeg **chấp nhận** (exit 0, graph parse OK) — không có giới
  hạn độ dài nào bị chạm ở mức tối đa của validator.
- Nhưng render thật với 240 điểm KHÔNG đo (chi phí if-chain × 8 lần đánh
  giá/pixel, ngoại suy là cực chậm, không đáng đốt ~40 phút VM để chứng
  minh điều đã rõ). Thực tế chỉ nên dùng track thưa: đã đo tới 20 điểm
  (2.65 fps @360p). Track 1 điểm → hằng số, không dùng `T` (self-test).
- Nhánh rect động cũng render thật: 360p 2s, rect w=0.4 h=0.6 feather
  0.15, track 0.2→0.8 → t=1 đo cx=319.9 (kỳ vọng 320), cy=180.0.

## 5. Kết luận & khuyến nghị (cho parent quyết)

| Trục | geq động vs đường khác |
|---|---|
| Vị trí | Hòa (±0.2px; D3+mask tĩnh cũng đúng) |
| Feather | Hòa tuyệt đối (34px = 34px) |
| Tốc độ | **Thua nặng: 1.14 vs 12.14 fps PNG (~10.6×)** |
| Ngữ nghĩa | Thắng đường geq tĩnh+D3 cũ (thấy đúng vùng nguồn quanh vật) |

**Khuyến nghị: KHÔNG đưa geq động vào production, KHÔNG làm mặc định.**
Giữ nguyên sau cờ `--mask-mode trackgeq` như đường thử nghiệm/fallback.
Lý do: ưu điểm duy nhất của nó (ngữ nghĩa "video đứng yên, mask bám vật")
đường mask-video của O2 cũng đạt được — mà đường đó dùng movie+blend
như PNG nên tốc độ kỳ vọng ở mức ~PNG, nhanh hơn geq động cả chục lần.
geq động chỉ còn giá trị niche: đường thuần-ffmpeg không cần vẽ trước
bằng Python/PIL (không file video mask tạm) — dùng làm fallback khi
`mask_anim.py` thất bại mà vẫn cần mask bám track, thay vì rơi về mask
tĩnh tại t=0. Quyết định cuối (có giữ cờ này hay xóa) thuộc về parent
sau khi có số đo tốc độ đường O2.

**Chưa so được với đường O2:** lúc O3 đo, O2 chưa có LIMITS/batch stage
(chưa có số fps đường mask-video). A/B trackgeq-vs-O2 còn nợ — parent
chạy lại harness O3 (cùng lệnh, cùng clip) sau khi O2 có số để điền nốt
cột đó. Mọi số O3 ở §3 đều tái tạo được từ harness.

## 6. Tương tác liên luồng trong đợt 87 (parent gộp lưu ý)

- **Dedupe `maskGeometryAtTrack` (O3 làm, đã xong):** O1 và O2 mỗi bên
  định nghĩa một bản cùng chữ ký trong `mask.js`; bản O2 (định nghĩa sau)
  thắng runtime và làm fail test O1 §11 (w/h keyframes). O3 đã xóa bản
  trùng của O2, giữ bản O1 (tâm từ track, w/h từ keyframes) — bản này
  thỏa CẢ test O1 §11 lẫn test O2 §10 (mask không keyframes → w/h gốc),
  self-test xanh toàn bộ. Nếu parent muốn ngữ nghĩa O2 (keyframes bị bỏ
  qua hẳn) thì đổi lại một chỗ này, nhưng khi đó test O1 §11 phải sửa
  theo. Các helper O2 khác (`sampleTrackAt`, `trackPointsToMaskKeyframes`,
  `hasTrackedMask`, `trackedMaskAnimKey`) giữ nguyên.
- **`validateTrackAttachment` require:** O3 thêm một bản trùng của O2
  (lỗi SyntaxError lúc đầu) — đã gộp về MỘT require duy nhất ở đầu file,
  chú thích "O3 (+O2 dùng chung; KHÔNG thêm bản thứ 2)".
- **O2 hạ cánh vào `render.js` lúc 06:05 UTC, SAU khi harness O3 chạy
  xong (render cuối 06:04):** O2 nối đường mask-video tracked vào
  `maskChainForSite` + pre-pass maskAnim, và mở rộng luật bỏ D3 sang cả
  mode png cho clip track+mask. Số đo O3 §3 không bị ảnh hưởng (render
  geq không nằm trong phạm vi sửa của O2; render PNG không có track
  trong spec). O3 đã kiểm chứng lại sau khi O2 hạ cánh: self-test xanh,
  dry-run trackgeq vẫn có geq động + overlay 0, dry-run png+track cho
  overlay 0 + movie= (đúng thiết kế O2). File `mask.js`/`render.js`
  trong batch O3 chứa cả thay đổi O2 — parent gộp theo marker O2/O3,
  đừng coi batch O3 là chỉ-chứa-O3.
- **Thay đổi hành vi mặc định (O2, không phải O3):** trước đợt 87, clip
  track+mask ở mode png mặc định cưỡi shift D3 (mask tâm 0.5 về đúng
  điểm track). Nay O2 bỏ D3 cho clip đó để video mask tracked đứng yên
  — đúng khi video mask tracked được vẽ thành công; khi vẽ thất bại,
  fallback là mask tĩnh tại hình học track t=0 (clip đứng yên, mask
  KHÔNG bám track nữa). Parent nên xác nhận đây là hành vi mong muốn
  cho trường hợp fallback này.

## 7. Nợ mở

- A/B trackgeq-vs-O2 (tốc độ + vị trí đường mask-video) — chờ số O2.
- Track dày (240 điểm): chỉ mới dry-run parse OK, chưa render thật
  (ngoại suy quá chậm); khuyến nghị thực tế ≤20 điểm.
- trackgeq + clip merged (dính transition): chưa test — D3 vốn đã bỏ qua
  track cho unit merged; trackgeq không xét trường hợp này.
- trackgeq + speed ramp / motion interpolation: chưa test (mask áp sau
  motion chain; `T` sau minterpolate vẫn là thời gian clip-local nhưng
  chưa đo).
- Chưa nối geq động vào preview web (chỉ render worker) — đúng phạm vi
  luồng O3, preview do luồng khác nếu cần.

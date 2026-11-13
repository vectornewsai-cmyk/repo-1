# PHASE9_ROUND88_P1_MASK_FALLBACK_LIMITS.md

Đợt 88 P1 — ép kích hoạt end-to-end đường fallback video-mask khi sinh video
mask thất bại (đóng nợ O2 §5.5 mục 2, LIMITS gộp đợt 87 §4 mục 7).
KHÔNG push. Không release/tag. Không đụng TTS 39, không đụng workflow.

## 1. Đã làm gì

- **Không sửa code production.** Đọc lại đường fallback O2/D4
  (`server/render/src/render.js`: `maskChainForSite` dòng ~521, pre-pass
  D4/O2 dòng ~1740–1800; `server/render/src/mask.js`: `buildMaskPngChain`,
  `buildMaskAnimChain`, `buildMaskChain`) và ép nó chạy thật end-to-end.
  Kiểm chứng cho thấy fallback hoạt động đúng như thiết kế — không có lỗi
  thật để sửa, nên không sửa gì để ép xanh.
- **Test mới** `server/render/test_round88_p1_mask_fallback.js` (30
  assertion, chạy `node test_round88_p1_mask_fallback.js` từ
  `server/render`).

## 2. Cách ép fail (trung thực về phương pháp)

- KHÔNG đổi tên/sửa `mask_anim.py` thật: các luồng song song đợt 88 vẫn
  dùng file này; đổi tên sẽ làm hỏng luồng khác (đúng lý do O2 đã nêu).
- Fault injection bằng **shim `python3` trên PATH của riêng tiến trình
  render con**: thư mục tạm chứa script `python3` chỉ fail (exit 1, kèm
  stderr giả lập) khi argv chứa `mask_anim.py` (biến thể A) hoặc
  `mask_anim.py` + `mask_png.py` (biến thể B); mọi lệnh `python3` khác
  exec sang `/usr/bin/python3` thật. Shim chỉ tồn tại trong `/tmp` của
  lượt test này và chỉ tiến trình render do test spawn mới thấy nó.
- Từ góc nhìn `render.js`, `mask_anim.py` được gọi thật và thoát != 0 —
  đúng đường lỗi production (thiếu PIL/numpy, tham số sai, crash khi vẽ
  frame). Điểm duy nhất "giả" là nguyên nhân gây fail, không phải đường
  code fallback. File `mask_anim.py` trên đĩa không hề bị chạm tới trong
  cả lượt (verify: không có thay đổi nào ngoài 2 file mới, xem §6).

## 3. Kiểm chứng (render thật, 1280×720, 30fps, 4s, VM 4 vCPU)

Nguồn: video đỏ trơn 1280×720 4s; mask ellipse w=0.3 h=0.5; track
x 0.35 → 0.65, y=0.5. Hình học fallback t=0: tâm (0.35, 0.5) =
pixel (448, 360), rx=192, ry=180. Đo tâm vùng đỏ bằng centroid pixel
(PIL/numpy), ngưỡng ±0.01.

| Kiểm chứng | Kết quả |
|---|---|
| **A. mask_anim fail → PNG fallback t=0**: job ra MP4 (không fail) | **PASS, 5,5 s** |
| A: warn pre-pass "không vẽ được video mask → thử PNG tĩnh tại t=0" | **có trong stderr** |
| A: log "mask track fallback PNG t=0" | **có trong stdout** |
| A: không warn "PNG fallback cũng thất bại", không dùng `.mkv` | **đúng** |
| A: tâm mask tại t=0.5 / 2.0 / 3.5 | **0.35 / 0.35 / 0.35** (y=0.5) — tĩnh tại t=0, KHÔNG bám track (track tại t=3.5 đã là 0.6125) |
| A: pixel tâm (448,360) đỏ / ngoài phải (700,360) đen / ngoài trên (448,100) đen | **[252,0,0] / [0,0,0] / [0,0,0]** |
| A: frame t=2.0 vs mask tĩnh cùng hình học (tâm 0.35, đường PNG thường) | **MAD = 0.000 < 1** |
| **B. mask_anim + mask_png đều fail → geq tĩnh t=0**: job ra MP4 | **PASS, 21,2 s** (geq tính từng pixel — chậm là đúng) |
| B: warn "PNG fallback cũng thất bại → geq tĩnh tại t=0" | **có trong stderr** |
| B: warn site "mask bám track: không vẽ được video mask (xem log pre-pass) → mask tĩnh tại t=0" | **có trong stderr** |
| B: tâm mask tại t=0.5 / 2.0 / 3.5 | **0.35 / 0.35 / 0.35** (y=0.5) |
| B: pixel tâm (448,360) đỏ / ngoài phải (700,360) đen | **[252,0,0] / [0,0,0]** |
| B: frame t=2.0 vs mask tĩnh `--mask-mode geq` cùng hình học | **MAD = 0.000 < 1** |
| **C. Hồi quy, không shim**: job ra MP4 | **PASS, 6,5 s** |
| C: KHÔNG có warn fallback nào, KHÔNG log fallback PNG | **đúng** |
| C: log pre-pass "mask track" + video `.mkv` | **có (đường video hoạt động)** |
| C: tâm mask tại t=0.5 / 2.0 / 3.5 | **0.3875 / 0.5 / 0.6125** — bám track chính xác, khớp O2 §4 |
| `mask.js --self-test` | **pass hết** |
| `test_round87_o2_mask_track.js` (hồi quy O2) | **25/25 pass** |
| `test_round88_p1_mask_fallback.js` (mới) | **30/30 pass** |

Tổng thời gian chạy test P1: ~66 s (gồm 2 lần render geq ~21 s + ~18 s
cho đối chiếu B; lần chạy đầu bị lỗi cú pháp Python trong helper đo
centroid của chính test — đã sửa, không liên quan code production).

## 4. Kết luận

- Đường fallback 2 tầng của O2/D4 **hoạt động đúng end-to-end**:
  video fail → PNG tĩnh tại hình học track t=0 (+ warn rõ) → PNG fail
  → geq tĩnh tại hình học track t=0 (+ warn rõ ở cả pre-pass lẫn site).
  Cả 2 tầng đều cho mask tĩnh đúng pixel (MAD = 0.000 so với đường tĩnh
  tương đương) và không bao giờ fail job vì mask.
- Fallback KHÔNG kích hoạt khi `mask_anim.py` chạy tốt (biến thể C) —
  không có hồi quy, không có warn thừa.
- **Nợ O2 §5.5 mục 2 ĐÃ ĐÓNG.** Không phát hiện lỗi thật nào trong
  fallback nên không sửa code production.

## 5. Giới hạn / nợ mở (trung thực)

1. **Nguyên nhân fail là giả lập (shim PATH), không phải lỗi thật của
   `mask_anim.py`.** Đường code fallback thì thật 100% (spawn thật,
   exit != 0 thật, nhánh fallback thật), nhưng chưa có lần nào
   `mask_anim.py` fail tự nhiên trên production (vd: hết RAM khi vẽ 4K,
   PIL lỗi với shape lạ). Nếu một ngày nó fail thật với stderr khác
   (vd: treo thay vì thoát), cơ chế timeout đợt 74 B4 mới là lớp bảo vệ
   — timeout chưa được ép kiểm chứng trong lượt này.
2. **Chỉ kiểm chứng clip video + track + mask, mode png mặc định.**
   Chưa ép fallback cho: mask keyframes không track (đường D4 — dùng
   chung cấu trúc pre-pass nên suy ra giống, chưa đo), image clip
   track+mask, `--mask-mode geq` (bỏ qua pre-pass nên không có fallback
   để ép), mask `invert`/feather > 0 trong đường fallback.
3. **Chi phí geq:** fallback tầng geq 720p 4s tốn 21,2 s (cả job) so
   với 5,5 s (PNG fallback) / 6,5 s (video bình thường) — geq tính từng
   pixel nên clip dài/4K fallback về geq sẽ rất chậm; đây là giá của
   "không fail job", chấp nhận được vì chỉ xảy ra khi cả 2 helper đều
   hỏng. Chưa đo 4K.
4. **Shim test chỉ fail theo tên script trong argv.** Nếu `mask_anim.py`
   được gọi qua đường khác (vd: đường dẫn tuyệt đối khác, symlink),
   shim sẽ không chặn — test này gắn với cách gọi hiện tại trong
   `render.js` (`path.join(__dirname, "mask_anim.py")`).
5. Không đụng: TTS 39, file workflow, `validate.js`, `mask_anim.py`,
   `mask_png.py`, `mask.js`, `render.js`.

## 6. File đổi/thêm (stage, không push)

- `server/render/test_round88_p1_mask_fallback.js` (mới, 30 assertion)
- `docs/PHASE9_ROUND88_P1_MASK_FALLBACK_LIMITS.md` (mới, file này)
- Không sửa file production nào. Batch stage:
  `phase9-round88-p1-mask-fallback.txt`.

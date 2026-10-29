# Phase 9 đợt 17, luồng N5 — truy nguyên clip1/clip2 XẤP XỈ: LIMITS (trung thực)

> Đợt 17, luồng N5. Repo làm việc: `~/workspace/repo-1`, KHÔNG push
> GitHub, KHÔNG release/tag, KHÔNG code giả. FFmpeg đo: 8.1.2.
> Thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8.
>
> Nợ được giao: đợt 16 (H6) để lại "cặp clip1/clip2 XẤP XỈ chưa truy
> nguyên tới cùng" — nguồn photo-like tổng hợp KHỚP ở rgb24 nhưng 2
> clip nguồn kia chỉ XẤP XỈ, nghi căn frame (frame alignment).
> Script đo mới: `server/render/src/test_v17_source_align.mjs`.
> KHÔNG sửa V11/V12/V13/V14/`harnessShared.js` (đúng ràng buộc giao).

## 1. Kết luận trước hết (bằng số, không phải giả thuyết)

**Giả thuyết "căn frame thời gian" của H6 là SAI. Nguyên nhân thật
là miền màu của phép đo: xfade chạy trong miền YUV gốc của file mp4,
trong khi preview của H6 blend 2 frame đã decode sang rgb24.**
Bằng chứng quyết định, đo trên đúng cặp file repo
`server/render/examples/media/clip1.mp4` / `clip2.mp4`, khung
1280×720, xfade duration=1 offset=1, frame giữa n=45 @30fps, p=0.5:

| Thí nghiệm | dissolve | circleopen | Ý nghĩa |
|---|---|---|---|
| Baseline đúng phương pháp H6 (tái tạo) | 1,2424 / 97,48% XẤP XỈ | 1,5943 / 96,47% XẤP XỈ | Khớp đúng số H6 tới 4 chữ số thập phân — baseline đáng tin |
| Ép `format=rgb24` TRƯỚC xfade, còn lại giữ nguyên | 0,0057 / 100,00% KHỚP | 0,3820 / 100,00% KHỚP | Chỉ đổi miền blend → về đúng mức KHỚP của nguồn photo-like (H6: 0,0012 / 0,2817) |
| Ép `format=yuv444p` TRƯỚC xfade | 1,2424 / 97,48% (không đổi) | 1,5943 / 96,47% (không đổi) | Không phải do subsample chroma — xem §3 |

**Không sửa code sản phẩm.** Render dùng xfade native là đúng; preview
canvas RGB cũng đúng như một mô hình. Sai lệch nằm ở phương pháp đo
của H6 (so sánh chéo miền YUV↔RGB), nên cách sửa thuộc về nguồn đo
cho đợt sau (§5), không phải sửa bừa `render.js` hay preview.
Việc ép rgb24 trước xfade vào pipeline thật sẽ chỉ thêm chuyển đổi
màu vô ích (đầu ra cuối vẫn là yuv420p), nên KHÔNG làm.

## 2. Từng giả thuyết đã đo (số thật, script chạy exit 0)

### H-TB (fps/timebase/điểm bắt đầu khác nhau) — BỊ BÁC
ffprobe cả 2 file giống hệt nhau ở mọi trường quyết định căn frame:
1280×720, `avg_frame_rate` 30/1, `time_base` 1/15360, `start_time`
0,000000, `duration` 8,000000, `nb_frames` 240, `pix_fmt` yuv420p,
`sample_aspect_ratio` 1:1, `chroma_location` left. Không có lệch
timebase hay điểm bắt đầu nào để xfade căn sai.

### H-SEEK (cách H6 lấy frame bằng `-ss t` trước `-i` cho frame khác) — BỊ BÁC
Frame seek của H6 so với frame theo chỉ số trình chiếu, đo trực tiếp:
clip1 `seek(1.5)` vs frame 45: **MAD = 0,0000**; clip2 `seek(0.5)` vs
frame 15: **MAD = 0,0000**. Cách lấy frame của H6 là đúng tuyệt đối.

### H-ALIGN (lệch 1 hoặc vài frame ở A, ở B, hoặc cả hai) — BỊ BÁC
- Dissolve, quét đủ 7×7 với da, db ∈ [−3, +3]: tốt nhất vẫn là
  **da = 0, db = 0 (MAD 1,2424)**. Mọi lệch ±1 frame đều TỆ hơn rõ:
  da=±1 → 1,39–1,41; db=±1 → 2,94–2,99; da=db=±1 → ~3,1–3,6.
  Bảng đầy đủ in trong log chạy của script (hàng = da, cột = db).
- Circleopen, quét trục + đường chéo: tốt nhất vẫn là **da = db = 0
  (MAD 1,5943)**; da=±1 → 1,72–1,74; db=±1 → 3,18–3,24; các tổ hợp
  khác tệ hơn tới ~4,0. Không tồn tại lệch frame nào cải thiện số đo.

### H-OUT (frame render n=45 không ứng với p=0.5) — BỊ BÁC
- Render frame n=42..48 so với preview p=0.5 (dissolve): n=45 là cực
  tiểu sắc nét (1,2424), n=44 → 8,3363, n=46 → 8,7808, càng xa càng
  tệ (n=42 → 19,8152, n=48 → 20,5968). Chỉ số đầu ra đúng.
- Render n=45 so với preview quét p (dissolve): p=0.5 là cực tiểu
  sắc nét (1,2424); p=0,4667 → 6,5532, p=0,5333 → 6,9444, p=0,4 →
  17,5096. Circleopen còn sắc hơn: p=0,5 → 1,5943, p=0,4667 →
  20,6969, p=0,5333 → 19,8868, p=0,4 → 56,7515. p thật đúng là 0,5.

### H-CSPACE (blend trong miền YUV gốc vs preview blend trong RGB) — ĐƯỢC CHỨNG MINH
- Ép rgb24 trước xfade: dissolve 1,2424 → **0,0057**, circleopen
  1,5943 → **0,3820**, cả hai KHỚP với 100,00% pixel lệch ≤ 8 —
  đúng mức của nguồn photo-like RGB mà H6 đã đo (0,0012 / 0,2817;
  circleopen 0,3820 cao hơn 0,2817 một chút vì nội dung test pattern
  có biên màu gắt hơn ảnh tổng hợp, vẫn dưới ngưỡng KHỚP với biên
  rộng).
- Ép fps=30 + settb=AVTB trước xfade (chuẩn hoá timeline): số KHÔNG
  đổi (1,2424 / 1,5943) — thêm một bằng chứng timeline không phải
  nguyên nhân.

### H-ALPHA (nền/alpha khác nhau) — BỊ BÁC
Cả 2 file đều `pix_fmt` yuv420p, tức KHÔNG có kênh alpha; không có
nền trong suốt hay alpha nào để blend thêm. Giả thuyết này không có
đối tượng để đo thêm.

## 3. Cơ chế chính xác tới đâu — và chỗ nào còn mở (trung thực)

Probe bổ sung (chạy ở /tmp, không vào repo) khóa thêm 2 chi tiết:

1. **Ngay cả frame KHÔNG qua transition cũng lệch.** Frame neo trước
   transition (render n=10 so với A frame 10) qua xfade-YUV: MAD
   0,9686; sau transition (render n=70 so với B frame 40): MAD 1,5283
   — cùng bậc với sai số giữa transition (1,24 / 1,59). Nhưng qua
   xfade-RGB, cả 2 neo đều **MAD = 0,0000 tuyệt đối**. Tức sai số đã
   có sẵn ở đường chuyển yuv→rgb của nhánh xfade-YUV, trước cả khi
   tính tới công thức transition. Đây là bằng chứng mạnh nhất rằng
   mô hình transition (frand dissolve, gradient circleopen) KHÔNG sai
   trên cặp này — sai số không cần transition cũng xuất hiện.
2. **Không phải do subsample chroma.** Render ép yuv444p trước xfade
   cho frame **giống hệt từng bit** với render yuv420p gốc (MAD = 0
   ở cả n=10, n=45, n=70). Nếu subsample là nguyên nhân, yuv444 phải
   khác. Vậy điểm khác biệt nằm ở miền YUV-vs-RGB của phép toán
   xfade/chuyển đổi, không phải ở độ phân giải chroma.

Chỗ còn MỞ (không mạo nhận đã hiểu hết): cơ chế nội bộ nào trong
xfade-YUV của FFmpeg 8.1.2 làm đường chuyển yuv→rgb của nó khác với
đường decode trực tiếp sang rgb24 (ứng viên: format negotiation nội
bộ của xfade, xử lý mask theo từng plane) — script này không đào tới
mức đọc source vf_xfade.c, và cũng không cần: mọi kết luận hành động
(§5) đều đứng vững mà không cần cơ chế nội bộ đó.

Dấu vết phụ, phù hợp với kết luận (không dùng làm bằng chứng chính):
MAD tách theo biên màu trên render gốc: dissolve MAD biên = 8,5264
vs vùng phẳng = 0,8137 (pixel biên chỉ 5,6%); circleopen MAD biên =
9,0161 vs vùng phẳng = 1,1574. Sai số tập trung ở biên màu gắt của
smptebars/testsrc2 — đúng dạng sai số của chuyển miền màu, không
phải dạng lệch frame (lệch frame trên pattern chuyển động sẽ làm cả
vùng phẳng lệch theo, và quét H-ALIGN đã bác).

## 4. Hệ quả cho badge và cho các đợt sau

- Badge "matched ở mức mô hình xfade rgb24" giữ nguyên phạm vi, và
  nay có thêm cách đo đúng cho nguồn file: **với rgb24 ép trước
  xfade, cặp clip1/clip2 cũng KHỚP** (0,0057 / 0,3820). Nợ H6 "cặp
  clip1/clip2 XẤP XỈ chưa truy nguyên" coi như ĐÓNG — nguyên nhân đã
  rõ, không còn là "nghi căn frame".
- Đừng bao giờ dùng số XẤP XỈ 1,24/1,59 của H6 trên cặp C để kết
  luận mô hình transition sai, hay để trừ điểm preview: đó là sàn
  chuyển miền YUV↔RGB của phép đo, không phải lỗi mô hình.
- Phạm vi badge vẫn KHÔNG mở rộng sang đầu ra yuv420p e2e (H6 đã đo
  LỆCH ~50 ở đó — đó là tổn thất encode 444→420 riêng, không liên
  quan tới phát hiện của luồng này).

## 5. Cách sửa nguồn đo cho đợt sau (không sửa code sản phẩm)

Khi đo parity transition trên nguồn file mp4 (yuv), chọn MỘT trong
hai cách — đừng so sánh chéo miền như H6:

1. (Khuyến nghị, đã chứng minh) Ép `format=rgb24` cho cả 2 đầu vào
   TRƯỚC xfade trong filter graph đo, rồi so với preview RGB như cũ.
   Kỳ vọng: dissolve/circleopen về mức KHỚP như §2.
2. Hoặc so sánh trong miền YUV: lấy frame A/B ở dạng yuv420p, mô
   phỏng preview trong miền YUV, rồi so plane Y/U/V trực tiếp —
   cách này chưa có script, chỉ nêu hướng, không mạo nhận đã làm.

Script `test_v17_source_align.mjs` chạy lại được toàn bộ số §2
(từ `server/render/`: `node src/test_v17_source_align.mjs`, exit 0).
Script tái dùng tên file tạm cố định trong một thư mục /tmp duy nhất
và xoá thư mục đó khi xong (rút kinh nghiệm H6 đầy /tmp 512MB).

## 6. Kiểm chứng đã chạy

- `node --check` cho script mới: pass.
- Script đo chạy trọn vẹn, exit 0, ~133 giây (chủ yếu là 49 preview
  dissolve quét 7×7 ở 720p): baseline tái tạo đúng số H6 tới 4 chữ số
  thập phân; mọi giả thuyết đều có số đo đối chứng, không có giả
  thuyết nào chỉ "nghi".
- Probe bổ sung ở /tmp (không vào repo): sanity trích filter vs
  `-pix_fmt` MAD = 0; neo RGB MAD = 0; yuv444-vs-yuv420 render MAD = 0.
- KHÔNG chạy tsc/vite build: luồng này không sửa code TS nguồn web
  hay bất kỳ code sản phẩm nào, chỉ thêm 1 script đo .mjs + 1 file
  docs — không có gì để tsc/build kiểm chứng thêm; không mạo nhận.
- KHÔNG chạy click-test browser thật (nợ mở chung của repo).

## 7. Cái gì vẫn XẤP XỈ và vì sao (ghi rõ theo yêu cầu giao)

- Cặp clip1/clip2 đo theo phương pháp CŨ của H6 (xfade YUV gốc, so
  với preview RGB) vẫn XẤP XỈ 1,2424 / 1,5943 — và sẽ MÃI như vậy
  nếu giữ phương pháp cũ, vì đó là sàn chuyển miền, không phải bug
  chờ sửa. Muốn số KHỚP thì đổi phương pháp đo theo §5, không phải
  sửa code.
- Cơ chế nội bộ của xfade-YUV trong FFmpeg 8.1.2 (§3, điểm mở) vẫn
  chưa đọc tới source vf_xfade.c — không ảnh hưởng kết luận hay
  hướng sửa đo.
- Footage máy quay THẬT vẫn chưa đo (repo không có file nào như
  vậy) — kết luận này chỉ đúng cho cặp test pattern trong repo, như
  H6 đã ghi rõ; không suy ra thành claim về footage thật.

## 8. File đổi/thêm (text, không binary — parent gộp batch, không tạo paths-loop riêng)

- `server/render/src/test_v17_source_align.mjs` (MỚI — script đo truy nguyên)
- `docs/PHASE9_ROUND17_N5_SOURCE_ALIGN_LIMITS.md` (MỚI — file này)
- KHÔNG sửa file nào khác. Đặc biệt: V11/V12/V13/V14/`harnessShared.js`
  nguyên vẹn; không sửa `render.js`, preview, hay bất kỳ code sản phẩm nào.

# Transition Preview — Giới hạn trung thực (Phase 9 đợt 10, luồng V1)

Preview nay mô phỏng hình học của transition xfade (wipe/slide/circle/…)
thay vì chỉ fade alpha như trước (PREVIEW_LIMITS.md §7 cũ). Tài liệu này
nói thẳng phần nào khớp render, phần nào chỉ xấp xỉ, phần nào chưa làm.
**Không claim pixel-perfect với FFmpeg ở bất cứ đâu dưới đây.**

## 1. Khác biệt mô hình lớn nhất: preview vẽ từng clip riêng lẻ

Render gộp cặp clip bằng `xfade`: trong T giây chuyển cảnh, cả A và B
cùng hiện (B chồng/xen lên A). Timeline preview đặt clip kề nhau
(`B.start = A.start + A.duration`) nên trong cửa sổ transition chỉ có
1 clip active:

- Clip đang `transitionIn` → vẽ theo lớp B, `p = localT / duration`.
- Clip đang `transitionOut` → vẽ theo lớp A, `p = thời gian đã trôi
  trong cửa sổ / duration`.
- Phần khung còn lại (lớp kia) là nền đen của canvas, **không phải clip
  kia**. Ví dụ wipeleft ở clip ra: A thu hẹp dần về bên trái rồi mất
  hẳn, sau đó B hiện đột ngột — render thật thì B quét vào đè lên A.
  Đây là xấp xỉ có chủ ý của mô hình preview hiện tại, không phải bug
  vẽ sai hướng: hướng/quy mô vùng của từng lớp vẫn đúng như §2–§3.

Hệ quả: các transition mà bản chất là "B đè lên A" (cover, wipe) chỉ
hiện đúng 1 nửa hiệu ứng ở mỗi phía; muốn crossfade thật phải đổi vòng
vẽ preview sang chồng 2 clip trong cửa sổ overlap — việc khác, chưa làm.

Clip ngắn hơn tổng 2 duration (cả 2 cửa sổ cùng active): alpha nhân
nhau, hình học lấy theo cửa sổ vào. Image clip chưa áp transition
hình học (drawImageClip không xử lý transitionIn/Out — như trước đây).

## 2. Đã đo thật bằng FFmpeg 8.1.2 (nguồn màu phẳng + gradient, khung 100×100)

- **Wipe rect** (wipeleft/right/up/down): biên cứng, B chiếm đúng phần
  khung theo p (p=0.5 chia đúng nửa). Preview khớp.
- **vertopen/horzopen/vertclose/horzclose**: đo thật cho thấy vert =
  dải dọc, horz = dải ngang (ngược suy đoán ban đầu "mở dọc = dải
  ngang"). Preview theo kết quả đo: vertopen = dải dọc giữa rộng p\*W,
  vertclose = A còn dải dọc rộng (1-p)\*W, tương tự cho horz.
- **circleopen**: B trong vòng tròn nở từ tâm, bán kính p\*rMax
  (rMax = nửa đường chéo khung). Preview khớp (tới mức làm tròn).
- **circleclose**: A trong vòng tròn khép dần, B ở ngoài. Preview khớp.
- **circlecrop/rectcrop**: khớp TRANSITIONS2_LIMITS.md §2 — nửa đầu A
  co thành vòng tròn/chữ nhật rồi biến mất, **đi qua frame đen ở giữa**,
  nửa sau B nở ra. Đây là hành vi thật của FFmpeg, không phải bug
  preview. Bán kính vòng tròn của B tăng đơn điệu theo p (0 ở nửa
  đầu, nở dần tới rMax ở nửa sau).
- **slide/cover/reveal**: màu phẳng không phân biệt được 3 họ (cùng
  chia nửa khung ở p=0.5). Gradient chỉ xác nhận được: revealleft
  KHÔNG phải "A trượt sang phải" (ở p=0.5, A vẫn ở nửa trái, B ở nửa
  phải) — preview dùng: slide = cả 2 cùng trượt, cover = chỉ B trượt
  vào, reveal = chỉ A trượt ra, cùng hướng với tên gọi (left = sang
  trái). Hướng trượt chi tiết của reveal/cover chưa được chứng minh
  bằng nội dung có vân — xem §4.
- **squeezeh/squeezev**: đo thật ngược trực giác với tên gọi —
  squeezeh cho A = dải ngang giữa co theo chiều cao (scaleY = 1-p),
  squeezev cho A = dải dọc giữa co theo chiều rộng (scaleX = 1-p).
  Preview theo kết quả đo, không theo tên gọi.
- **zoomin**: đo thật không thấy vùng không gian — toàn khung blend,
  muộn (p=0.25 vẫn toàn A, p=0.75 đã blend). Preview dùng fade
  ease-in (alpha = p²), **bỏ qua zoom**.
- **distance**: đo thật B đã phủ toàn khung từ p=0.25. Preview dùng
  fade nhanh (alpha = min(1, 4p)) — xấp xỉ từ 2 điểm đo, chưa đo đường
  cong chính xác.
- **slices (hl/hr/vu/vd)**: đo thật thấy dải trượt đều cùng hướng
  (hl = dải ngang trượt sang trái, hr = sang phải, vu = dải dọc trượt
  lên, vd = trượt xuống), không thấy stagger rõ rệt giữa các dải.
  Preview dùng 8 dải trượt đều; răng cưa/viền mềm ở biên chưa mô hình hoá.
- **Custom-expr**: blinds-h, bars-v, checker, diamond, plus, grid,
  clock được map trực tiếp từ expr trong `server/render/src/transitions.js`
  (đúng công thức, chỉ rời rạc hoá theo ô/dải khi cần). bars-fade
  chỉ lấy phần dải, bỏ phần crossfade nền (mô hình vẽ đơn 1 lần/clip
  không vẽ được cả 2). circle-soft dùng biên cứng, bỏ viền mềm 15%.

## 3. Chỉ xấp xỉ (hình học gần đúng, không khớp từng pixel FFmpeg)

- **diag\*/wipe\* góc chéo**: FFmpeg thật là **blend gradient chéo
  toàn khung** (đo thật: trọng số blend biến thiên mượt theo hướng
  chéo, không có biên cứng). Preview dùng biên cứng nửa mặt phẳng —
  nhận diện được hướng và tỉ lệ, nhưng khác render ở vùng biên.
- **smooth\***: FFmpeg có viền gradient rộng ở biên (đo thật: vùng
  blend ~35% chiều rộng khung ở p=0.5) và tăng tốc. Preview dùng
  offset trượt tuyến tính như slide — bỏ qua cả 2.
- **wind (hl/hr/vu/vd)**: FFmpeg dịch chuyển khác nhau theo từng hàng/
  cột (đo thật: cột giữa có pattern blend không đều). Preview dùng
  trượt đều như cover cùng hướng.
- **dissolve**: FFmpeg là nhiễu từng pixel **xác định** (đợt 13 C2:
  cùng input render 3 lần cho output byte-identical; trường ngưỡng
  T(x, y) chỉ phụ thuộc tọa độ tuyệt đối, không phụ thuộc duration,
  kích thước hay màu clip). Preview dùng lưới ô 20×12 với hash xác
  định (ổn định theo frame, số ô hiện tăng đơn điệu theo p) — nhận
  diện được hiệu ứng tan dần, hạt thô hơn nhiều. MAD preview–render
  đo lại: 63,80 (p=0,25), 85,52 (p=0,5), 65,95 (p=0,75) — đúng công
  thức 2 trường nhị phân độc lập, tức chỉ xấp xỉ thống kê (tỉ lệ B
  theo p khớp trong ~0,04), chưa khớp từng pixel vì hàm sinh T của
  FFmpeg chưa xác định được; đổi preview sang nhiễu từng pixel cũng
  không cải thiện MAD (85,00 so với 85,52) nên giữ nguyên lưới.
  Badge giữ "approx" (xem docs/PHASE9_ROUND13_C2_DISSOLVE_LIMITS.md).
- **pixelize**: tương tự dissolve nhưng lưới thô hơn (12×8); diễn
  biến kích thước khối theo p chưa mô hình hoá.
- **radial**: quét góc như clock (xấp xỉ); gốc/hướng quét chính xác
  của FFmpeg chưa đo.
- **fadeblack/fadewhite/fadegrays**: mô hình tuần tự không vẽ được
  màu trung gian (clip kia chưa/không còn active) nên chỉ dùng alpha
  tuyến tính như fade. fadefast/fadeslow dùng đường cong p² /
  1-(1-p)² làm xấp xỉ, chưa đo đường cong chính xác của FFmpeg.
- **Viền mềm nói chung**: mọi biên trong preview đều là biên cứng
  (canvas clip). FFmpeg có viền mềm/gradient ở nhiều transition
  (diag, smooth, open/close, circle-soft). Đây là khác biệt có hệ thống,
  không phải lỗi từng loại.

## 4. Fallback và chưa làm

- **Type lạ** (không có trong catalog): fallback về fade tuyến tính,
  không throw, preview không crash. Type "none" và duration ≤ 0 coi
  như không có transition.
- **hblur**: mờ ngang toàn khung, không có vùng/trượt/scale để mô
  hình hoá → fallback fade (blur không hiện ở preview, giống
  sharpen/noise trước đây).
- **Chưa làm**: crossfade cặp A/B thật (cần chồng 2 clip trong cửa
  sổ overlap — xem §1); transition hình học cho image clip; đo
  pixel thật so sánh preview vs render (chỉ đo hình học xfade của
  FFmpeg, chưa render frame preview ra ảnh để đối chiếu từng pixel);
  đường cong chính xác của fadefast/fadeslow/distance và hướng chi
  tiết của reveal/cover khi có vân nội dung.

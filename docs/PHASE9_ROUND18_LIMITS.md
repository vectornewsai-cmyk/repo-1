# Phase 9 đợt 18 — LIMITS tổng hợp: đóng nợ đợt 17 (đo thật + nested speed + harness YUV)

Chủ đề: đóng nợ đợt 17 — FPS headed, phương pháp đo harness cho nguồn mp4 yuv,
nested speedKeyframes (spec + render), guard nguồn cho updateNestedInnerClip,
footage thật license sạch, dọn rác + toast nested.
KHÔNG push, KHÔNG release/tag. Kiểm chứng gộp của parent (chạy lại độc lập):
tsc 0 lỗi, vite build pass (4.46s), test_nested_e2e 28/28 (sau khi parent sửa
case C cũ, xem dưới), test_round18_nested_speed_render 68/68,
store.nestedGuard 9/9, V11 29 case FAIL 0, V12 37 case FAIL 0,
V14 KHỚP 21/XẤP XỈ 1/LỆCH 0/PENDING 0. Số đo FPS headed, harness YUV chi tiết,
parity footage thật và render MP4 nested ramp là số đo của các luồng (parent
chạy lại syntax + các suite trên, không chạy lại toàn bộ đo nặng).

## Đã đóng

- FPS headed: blocker đợt 17 đã vượt bằng `--remote-debugging-pipe` (CDP qua
  fd 3/4, không qua cổng TCP). Trang tối giản: ghost 1080p f8 ~55–59 fps ở
  trạng thái sạch, không sụp như kết luận headless H4 đợt 16; nhưng số dao
  động mạnh theo tải VM (lần chạy cuối nền tụt còn ~33–52 fps) nên 55–59
  KHÔNG phải benchmark ổn định. Vòng vite preview cho số ~11 fps ở 1080p
  trong khi 720p vẫn ~60 — là nhiễu composite trang editor, KHÔNG dùng được,
  cấm trích.
- Harness YUV: truy nguyên tới cùng — dissolve e2e LỆCH ở miền RGB là do
  subsample 4:2:0 phá khung switch từng pixel (57,78/58,21 ≈ 99,3%), lượng
  tử crf18 chỉ 0,43. Mode (a) ép rgb24 trước xfade: clip1/clip2 KHỚP
  (dissolve 0,0057, circleopen 0,3820). Mode (b) so miền YUV, cả 2 phía qua
  FFmpeg: dissolve XẤP XỈ 2,90, circleopen KHỚP 0,43 (crf18). Số YUV bằng hàm
  JS tự viết KHÔNG dùng được cho dissolve (chroma filter khác swscale).
  Đề xuất badge chỉ ở mức đề xuất: giữ badge mô hình xfade rgb24, không gộp
  số e2e vào badge matched.
- Nested speedKeyframes: render worker nay HỖ TRỢ field này (bỏ lệnh cấm ở
  nestedWindow). Duration là thời gian OUTPUT; cửa sổ con là
  [in, in + ∫₀ᴰ s); out phải khớp tích phân (sai số 1e-4). Lá media tốc độ
  hằng c thành clip ramp tổng hợp (slice curve × c); curve hằng gộp về tốc
  độ hằng; patch speed hằng trên nested có curve thì curve thắng + warning.
  Fail fast còn: lá reverse, lá có curve riêng, lá có attachment thời gian,
  hai tầng đều có curve, out lệch tích phân, tích tốc độ vượt [0.25, 4].
  Render MP4 thật 64×64 đã khớp công thức u(t)=t+t²/8 suy tay.
- Nested guard: updateNestedInnerClip tầng 1 (R5) nay có guard nguồn của cha
  như hàm deep N3; lệnh bị chặn không đổi spec và không sinh entry undo.
  Hàm thuần R5 vẫn chưa có guard (caller trực tiếp vẫn bypass được).
- Footage thật: 2 clip quay thật từ Wikimedia Commons, xác minh license
  từng file qua API (pd, Copyrighted=False; file tưởng CC0 nhưng là
  CC BY-SA đã bị script từ chối đúng). Parity trên footage thật: dissolve
  0,0034 KHỚP, circleopen 0,4995 KHỚP (sàn lượng tử hoá). Binary chỉ ở
  /tmp/vcut-cc0-sample, KHÔNG vào repo; stage chỉ script fetch.
- Dọn rác + toast: quét toàn repo — rác scratch16 đợt 17 đã không còn trên
  đĩa (chỉ còn dòng chữ nhắc trong LIMITS đợt 17), không bịa là đã dọn.
  NestedClipPanel nay có toast riêng + dòng warn bền vững khi nested clip
  mang speedKeyframes/reverse bị từ chối.

## Parent sửa trong đợt (xung đột test cũ)

- `test_nested_e2e.js` case [C]: speedKeyframes ra khỏi danh sách fail fast
  (9 → 8 field) vì từ đợt 18 field này được hỗ trợ; thêm case dương [C2]
  (fixture shape chuẩn {t, v, easing} — fixture cũ {t, speed} là sai shape
  theo validator, không phải shape hợp lệ) assert flatten KHÔNG throw.
  Chạy lại: 28 pass, 0 fail.

## Chưa đóng / giới hạn trung thực

- FPS preview editor thật vẫn chưa có: cần lái timeline/project thật thay
  vì tiêm canvas phủ; backend raster vòng headed chưa xác định (probe WebGL
  trả no-webgl); chưa đo trên GPU/màn hình thật (Xvfb không có vsync cứng).
- Dissolve e2e ở crf18 vẫn chỉ XẤP XỈ ngay cả ở miền YUV sạch nhất; muốn
  lên KHỚP cần đo quét crf trước khi kết luận (đổi crf/preset hay chấp
  nhận giới hạn cấu trúc). Số YUV-domain ở crf0 chưa đo.
- Nested ramp: preview web chưa parity với render; store/UI chưa cài chế
  độ trim-cố-định và chưa báo khi patch làm out lệch tích phân; comment
  trong nestUtils.ts (~dòng 995) vẫn ghi "render cấm speedKeyframes ở
  nested" — đã lỗi thời; chưa làm hợp curve hai tầng, attachment qua τ,
  lá reverse dưới ramp; MP4 mới đo curve linear 1→2 ở 64×64.
- Toast nested bắn khi panel liệt kê clip, chưa bắn đúng thời điểm tách/
  trim từ Timeline; chưa chạy thật trên DOM (repo không có DOM test
  runner); câu báo hardcode tiếng Việt (chưa qua i18n).
- Footage mẫu chỉ 2 clip, cùng 1 tác giả/thị trấn, cùng Theora 720p30 —
  chưa có H.264/MP4, 1080p/4K, chân dung, cảnh tối/chuyển động nhanh, clip
  dọc; clip B có biển hiệu cửa hàng nên đưa vào kho phát hành phải kiểm
  tra lại nhãn hiệu. Chỉ đo 2/81+ transition type trên footage thật.
- Edgedetect vẫn approx; pixelate còn dư 0.13 chưa truy nguyên; rasterizeTextPreview
  vẫn riêng ở V11/V12 (chưa đối chiếu).

## Nợ mở cho đợt sau

- Lái project/timeline thật đo FPS preview editor headed qua pipe; đo lại
  FPS khi máy rảnh (không chịu tải các luồng song song).
- Quét crf cho dissolve e2e; đo YUV-domain ở crf0; cập nhật comment
  nestUtils.ts và nối trim-cố-định + báo out lệch vào store/UI.
- Preview parity cho nested ramp; hợp curve hai tầng; toast tách/trim từ
  Timeline; i18n cho câu báo toast nested.
- Mở rộng bộ footage thật (H.264, 1080p, dọc, tối, chuyển động nhanh);
  đo thêm transition type trên footage thật; dời guard xuống hàm thuần R5.

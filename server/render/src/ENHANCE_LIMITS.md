# P2 — Clip enhancement + encode GPU: giới hạn trung thực (Phase 7)

## Cái gì đã làm xong (kiểm chứng bằng render thật)

- `enhance.js`: `validateEnhance`, `buildEnhancePreChain` (yadif + vidstabtransform),
  `buildEnhancePostChain` (hqdn3d), `runStabilizeDetect` (pass 1), `probeFilterSupport`.
- `gpuencode.js`: `probeGpuEncoder` (encode thử 1 frame thật), `buildVideoEncodeArgs`
  (libx264 / h264_nvenc / h264_qsv / h264_vaapi).
- `render.js`: nối enhance vào chain chuẩn (pre: sau setpts, trước speed; post: sau
  effects, trước plugin), pass vidstabdetect trước khi dựng graph, probe encoder
  trước khi encode, `--encoder auto|libx264|h264_nvenc|h264_qsv|h264_vaapi`.
- `validate.js`: `clip.enhance` được validate (chỉ video clip); tham số ngoài khoảng
  → fail ở bước validate, trước khi chạy FFmpeg.
- `packages/video-spec/src/enhance.ts`: type `ClipEnhance` + `ENHANCE_META`,
  `STABILIZE_DEFAULTS`, gắn vào `VideoClip.enhance` trong index.ts.
- Test: `server/render/test_p2.js` + `test_p2_measure.py` (xem số thật ở cuối file test
  khi chạy; test assert giảm jitter / giảm nhiễu / tăng progressive / fallback GPU).

## Giới hạn — đọc trước khi dùng

### 1. Encode GPU CHƯA BAO GIỜ được test trên phần cứng thật
- VM này không có GPU (`/dev/dri` không tồn tại, probe encode thử của cả 3 encoder
  đều fail) → `probeGpuEncoder` luôn trả null và job fallback libx264.
- Những gì ĐÃ kiểm chứng: logic detect (probe giả lập bằng tryFn tiêm vào trả đúng
  encoder), logic fallback (ép `--encoder h264_nvenc` trên máy không GPU → cảnh báo
  + render thành công bằng libx264, không fail job), và bảng tham số encode của từng
  encoder (đọc từ `ffmpeg -h encoder=...`, chưa chạy encode thật).
- ⚠️ Trên máy CÓ GPU, lần đầu chạy phải kiểm tra log dòng `🎥 encoder video:` và
  xác nhận codec output bằng ffprobe trước khi tin là GPU đang chạy. Đặc biệt VA-API:
  cần `/dev/dri/renderD128` + `format=nv12,hwupload` ở cuối graph — code đã nối sẵn
  nhưng chưa từng chạy qua driver thật.

### 2. Vidstab: tham số chia 2 pass — đừng đưa nhầm
- Phát hiện khi test thật trên FFmpeg 8.1.2: `vidstabtransform` KHÔNG có option
  `shakiness`, `accuracy`, `stepsize`, `mincontrast` — đó là option của
  `vidstabdetect` (pass 1). Đưa nhầm vào transform → lỗi `Option not found`, fail job.
- `enhance.js` đã tách đúng: detect nhận shakiness/accuracy/stepsize/mincontrast;
  transform chỉ nhận `input` + `smoothing` + `optalgo=gauss`.
- `smoothing` của transform có nghĩa "số frame*2+1 cho lowpass" (0..1000), khác thang
  với smoothing của detect — giá trị user khai (1..100) được dùng cho cả 2 pass.
- Stabilize + transition: transform chạy TRƯỚC xfade (per-clip), nên KHÁC với SR
  (bị bỏ qua khi có transition) — stabilize vẫn có tác dụng ngay cả khi clip có
  transition. Đã suy luận từ vị trí chain, chưa có test render riêng cho combo này.
- Vidstab chỉ khử được đúng loại rung — 3 lần thử sai khi làm test đã chứng minh:
  (a) jitter trắng độc lập từng frame (±24px nhảy/frame): phi thực tế, matcher
  không theo kịp → transform phân kỳ, marker văng khỏi frame ở 1/3 số frame;
  (b) random walk mượt (drift chậm): vidstab coi là camera path có chủ ý nên
  KHÔNG khử (đúng thiết kế — nó chỉ khử phần lệch khỏi path đã làm mượt);
  (c) tremor cao tần biên độ nhỏ (±7px, ~7–13Hz, không drift) mới là thứ nó khử
  được: test cuối redx 3.507→1.768, MAD 10.244→1.715 (smoothing=30, optalgo=gauss).
- Vidstab cần feature track được SAU KHI ENCODE: texture chấm 3px bị x264 crf 23
  làm nhòe → motion estimation không ổn định, kết quả tệ hơn cả không stabilize.
  Test dùng feature lớn (ô cờ 20px + hình lớn) + encode crf 12 mới cho kết quả
  trên. Footage thật có texture tự nhiên nên thường ổn, nhưng footage phẳng
  (bầu trời, tường trơn) + rung mạnh có thể stabilize kém — đó là giới hạn của
  vidstab, không phải bug wiring (đã kiểm chứng wiring đúng bằng dry-run graph).
- Stabilize + speed: detect phân tích đúng đoạn nguồn sau trim (trước speed) — cùng
  đoạn graph chính dùng, nên transform khớp. Speed thay đổi timing sau đó, không
  làm lệch transform.
- Stabilize fail fast: detect lỗi hoặc FFmpeg thiếu filter → job fail ngay với
  thông báo rõ, KHÔNG lặng lẽ render video rung. Đây là chủ ý (user đã khai
  stabilize thì render thiếu nó là sai hợp đồng), khác với quy tắc GPU (không bao
  giờ fail job vì thiếu GPU).

### 3. Denoise (hqdn3d)
- Chạy sau scale/pad, trên pixel output — nhiễu ở độ phân giải nguồn đã bị scale
  làm mờ/mạnh trước khi denoise; với video upscale mạnh, denoise sẽ yếu hơn so với
  denoise ở độ phân giải gốc. Chấp nhận được cho Phase 7 (đổi vị trí = đổi chain
  chung, rủi ro xung đột với agent khác).
- Đã kiểm chứng: hqdn3d chấp nhận input yuva420p (clip có alpha/chroma) — không
  có edge case alpha. Strength 1.0 trên nhiễu `noise=alls=40` giảm std vùng phẳng
  từ ~26 xuống dưới 70% giá trị gốc (assert trong test_p2.js).
- hqdn3d là denoise không gian + thời gian; với cảnh chuyển động nhanh, strength
  cao có thể gây "bóng ma" (ghosting) nhẹ — chưa đo, user nên thử strength 0.3–0.7
  trước cho footage action.

### 4. Deinterlace (yadif)
- Chạy TRƯỚC scale: scale trên frame interlaced sẽ "nướng" răng cưa vào ảnh.
- `mode=0` (mặc định): 1 frame / cặp field, giữ fps — an toàn với fps filter sau đó.
  `mode=1`: 1 frame / field (gấp đôi fps) — fps filter sau đó sẽ resample về fps
  project; chất lượng chuyển động tốt hơn nhưng tốn thời gian render hơn.
- `parity=-1`: tự detect field order từ stream. Nếu stream không gắn flag đúng,
  yadif có thể chọn sai parity → răng cưa còn nguyên. Trường hợp đó user phải
  kiểm tra bằng idet và báo lại (chưa có option parity tay trong Phase 7).
- Metric test dùng `idet`: nguồn test PHẢI là testsrc2 + tinterlace (TFF 75/75).
  Thanh ngang đơn trên nền phẳng cho idet = Undetermined 100% (không đủ tín hiệu
  phân biệt field) — không dùng làm nguồn test deinterlace.

### 5. Dry-run và file tạm
- Dry-run (`--dry-run`) bỏ qua pass vidstabdetect thật nhưng vẫn in graph có
  vidstabtransform với đường dẫn .trf placeholder (không tồn tại) — câu lệnh in ra
  KHÔNG chạy được nếu copy-paste nguyên văn. Đây là hành vi có chủ ý (dry-run chỉ
  để xem graph), không phải bug.
- File .trf tạm: `os.tmpdir()/repo1-vidstab-<pid>-<clipId>.trf`, dọn khi render
  thành công, giữ lại khi lỗi (cùng quy ước ASS/PNG của K1).

### 6. Xung đột agent (ghi nhận 23/10)
- `server/render/src/lut.js` đang được agent khác (P5, vòng LUT) sửa dở trong lúc
  P2 chạy test — test_p2.js từng fail với SyntaxError ở lut.js dù P2 không chạm
  vào file đó. P2 KHÔNG sửa lut.js; nếu test fail vì file của agent khác, chờ
  agent đó sửa xong rồi chạy lại, đừng "vá" hộ.

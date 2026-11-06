# Phase 9 đợt 23 — Đóng nợ đợt 22: reasonCode, cổng lá ra UI, compose biết curve, tab ẩn/bfcache, parity dọc vòng 2, rà soát phát hành — LIMITS TỔNG HỢP (parent)

Ngày: 2026-10-30 (lượt cron 02:03). Đợt lớn, 6 luồng song song, KHÔNG push,
KHÔNG tag/release, KHÔNG binary, KHÔNG dist. Batch stage (không push) ở
`~/workspace/repo-1-push/paths-loop/phase9-round23-closing-debts22.txt`.

## 0. Chốt chặn + bối cảnh

- `round-in-progress.md` KHÔNG tồn tại → lượt chạy bình thường.
- Trước đợt: 1 batch chờ push (đợt 22, 29 file; các đợt 5–21 đã push xong chiều 29/10).
- Chủ đề chọn từ nợ mở đợt 22 §4 (không trùng batch đã stage): mapper khớp
  chuỗi của cổng hai tầng, 8 nhánh cổng lá chưa có caller UI sống,
  `composeNestedLeafWindow` tuyến tính-only, tab ẩn lâu/bfcache chưa đo,
  native cặp dọc 2 + fade/4K dọc chưa đo, rà soát phát hành footage J/K/L.

## 1. Việc đã làm theo luồng

### G1 — Cổng hai tầng trả reasonCode
- `nestUtils.ts`: `TwoLevelCheck` thêm `reasonCode` (18 code + `"valid"`) và
  `reasonVars`; chuỗi `reason` giữ nguyên từng ký tự, không đổi logic chặn/cho qua.
- `nestedRejection.ts`: `translateTwoLevelReasonByCode` + `translateTwoLevelCheck`
  (dịch theo code trước, fallback về mapper khớp chuỗi khi code vắng/lạ/key thiếu).
  Call site store (patchClip G2, patchNestedCurveFixedTrim) và panel (đường áp curve
  trực tiếp) đã chuyển sang code trước. Không cần key i18n mới (18 key twoLevel đã đủ).
- Test mới 29/29; hồi quy 22A 38/38, T3 31/31 (parent chạy lại, khớp).
- Mapper chuỗi CHƯA xóa: vẫn là fallback cho đường chỉ có chuỗi reason (đường tạo
  curve trong panel qua `nestedCurveCreateTwoLevelReason` vẫn dùng mapper — xem nợ).

### G2 — 8 nhánh cổng lá ra UI sống
- Đối chiếu `checkTwoLevelLeafCurve`: đúng 8 nhánh từ chối, không ép số.
- Store action `updateNestedDeepInnerClip` nay toast đúng nhánh (key mới
  `nested.deepLeafTwoLevel`, trả thêm `reason` + `reasonKey` qua helper
  `twoLevelReasonKey`); lệnh bị chặn không sinh undo.
- `NestedClipPanel` (`InnerClipEditor`, đường "Xem bên trong" sẵn có): thêm 1 nút
  "Đặt curve 1× cho lá" cho clip con trực tiếp không phải nested; thành công 1 bước
  undo, bị chặn thì panel giữ msg từ `res.reason` (không toast trùng).
- `nestedCurveCreate.ts`: thêm `nestedCurveCreateTwoLevelMessage` (dịch tại điểm
  toast); hàm reason cũ giữ nguyên chữ ký, ghi rõ chỉ dùng nội bộ.
- i18n +4 key (parity 809/809, parent kiểm lại). Test mới 24/24 (parent chạy lại).
- G2 đã rebase tay qua trạng thái G1 (bỏ import thừa ở panel); trên đĩa cuối,
  file chung chứa cả marker G1 lẫn G2 và test cả hai luồng chạy chung vẫn xanh —
  không mất thay đổi do song song.

### G3 — composeNestedLeafWindow biết speed curve
- `packages/video-spec/src/nested.ts` + mirror `.js`: tầng mang speedKeyframes nay
  tính cửa sổ qua τ (tích phân tốc độ, ngữ nghĩa khớp flatten đợt 22 E + render đợt 18);
  curve hằng gộp chính xác về tốc độ hằng; không có curve thì giữ nguyên đường affine
  cũ (hồi quy hằng khớp strict). Curve sai hình dạng → fail-fast, không rơi về tuyến tính.
- `cumulativeSpeed` khi có ramp chỉ là số tóm tắt (tầng ramp đóng góp tốc độ trung bình),
  không dùng để suy ra absoluteStart/absoluteDuration — ánh xạ τ mới là chuẩn.
- Test mới 12/12 (đối chiếu 3 chiều .ts ↔ .js ↔ flattenNested); hồi quy nested 64/64,
  nestedDeep 16/16 (parent chạy lại, khớp). Lỗi narrowing tsc mà G1 gặp giữa chừng
  (file nested.ts) đã được G3 sửa xong trước khi kết thúc — tsc gộp 0 lỗi.

### G4 — Tab ẩn lâu / bfcache / tab đang phát (không sửa app)
- Harness mới `measure-v23-hidden-bfcache-pipe.mjs`, 2 run sạch (run đầu bị loại do
  artifact harness: tab trắng foreground + click giữa modal — đã sửa thành
  background:true + click góc, ghi rõ trong LIMITS G4).
- Ẩn 60 s lúc ngủ: ticks đóng băng, sleeping=true suốt, px hash không đổi, canvas
  không bị discard, hiện lại vẽ đúng playhead cũ rồi ngủ lại.
- Ẩn 10 s lúc đang phát: playhead đóng băng lúc ẩn, hiện lại phát tiếp từ điểm cũ
  (không nhảy vọt bằng thời gian ẩn), dừng xong ngủ lại.
- bfcache thật (about:blank → history back): marker sống + 1 entry pageshow
  `persisted = true` + cùng bundle/href; sau restore tỉnh +17/+18 ticks, vẽ lại cùng
  playhead rồi ngủ lại — listener pageshow đợt 22 C hoạt động trên đường bfcache thật.
- Không phát hiện bug thật → KHÔNG sửa `preview.tsx`. Dị thường chưa kết luận: hash
  sau redraw khác nhẹ ở cùng playhead rồi ổn định (cần dump ImageData đầy đủ mới kết luận).

### G5 — Parity footage dọc vòng 2 (chỉ script đo mới, không sửa code sản phẩm)
- Cặp mới K→L 720×1280: RGB24 đều KHỚP; miền YUV dissolve/circleopen KHÔNG về KHỚP
  ở bất kỳ crf nào (dissolve crf14 2,9697 → crf10 2,3663 → sàn crf0 1,6946/98,36% vẫn
  XẤP XỈ vì trượt chân ≤8%) — **quy tắc "crf ≤ 10 cho KHỚP YUV" của đợt 22 KHÔNG phổ
  quát**; trên cặp này không có crf nào cho KHỚP. Đây là lần đầu cả 2 type đều có sàn
  trượt tiêu chí ≤8.
- Cặp J→L ở native 1080×1920 (L upscale 608→1080 trong chain): số gần đồng nhất với
  720p đợt 22 (dissolve crf10 1,9456 KHỚP) — ngưỡng crf ≤ 10 của cặp này giữ nguyên khi
  lên native; native không cứu được cặp K→L (sàn 1,6737/98,39%).
- Fade (crossfade tuyến tính, không phải fade-to-black) trên K→L: RGB KHỚP, YUV crf14
  1,4887/99,99% KHỚP — gợi ý cơ chế: dissolve mosaic nhiễu frand giàu tần số cao nên
  subsample 4:2:0 phá nặng hơn blend mịn (giả thuyết, chưa chứng minh).
- Fadeblack LỆCH theo thiết kế preview (describeTransition bỏ qua màu trung gian,
  render đi qua đen thật; RGB MAD 34,6082) — nợ mô hình preview, không phải bug render.
- 4K dọc là UPSCALE TỔNG HỢP từ nguồn 1080p (không có clip 4K dọc thật; L orig đã loại:
  608×1080): dissolve/circleopen đều KHỚP ở crf14. Sàn crf0 ở 4K chưa đo được (2 lần
  chạy chết vì /tmp tmpfs 512MB đầy — ENOSPC; số crf10 1,3726 là tái tính có đối chiếu
  RGB trùng đúng, ghi rõ không mạo nhận là output trực tiếp của script đo).

### G6 — Rà soát phát hành J/K/L + click-test project dọc
- **Cả 3 clip đợt 22 đều KHÔNG được đưa vào kho phát hành** (đo nội bộ trong /tmp vẫn an toàn):
  J cần thay thế (người nhận diện được + vũ khí), K cần thay thế (tư liệu chiến tranh +
  thương vong), L cần thay thế — **đính chính đợt 22**: quét toàn clip mỗi 10 s cho thấy
  L chủ yếu là phỏng vấn cận mặt có tên (Dr. Lisa Carnell) + end card logo NASA, không
  phải "sạch nhất về người" như đợt 22 tưởng từ 3 frame.
- 2 clip thay thế đạt chuẩn, không hạ chuẩn: R1 NASA EUS Dome vertical (photographer
  NASA/Sam Lott + Brandon Hancock, MSFC; chỉ có công nhân xa quay lưng, không mặt nhận
  diện được; ~5 s cuối có end card logo — cắt khi đóng gói) và R2 NASA Full Moon Artemis II
  pad vertical (photographer NASA/Sam Lott; 0 người trong toàn bộ mẫu). Parity R1→R2
  dissolve RGB24 KHỚP (0,0050); YUV lặp lại quy tắc cũ (crf14 XẤP XỈ 2,7581, crf10 KHỚP 1,9109).
- Script fetch mới `fetch-r23-vertical-replacements.sh` (chỉ script, binary ở /tmp; cổng
  NASA + ffprobe h264/khung dọc + chốt chặn OUTDIR trong repo đều đã kiểm chứng phủ định).
- Click-test project dọc 6/6 PASS (lần 4; 3 lần trước chưa xanh đều ghi rõ nguyên nhân
  harness, không phải bug app: modal Media thiếu che ruler, assert % rect sai thước đo,
  lock Xvfb sót). Giới hạn: clip seed thiếu media nên preview vẽ chữ "Thiếu media" thay
  vì giải mã khung NASA thật — khẳng định load/scrub/không crash, KHÔNG khẳng định giải
  mã byte mp4 dọc trong trình duyệt.

## 2. Sửa của parent ở bước gộp

- Không sửa logic nào của các luồng. Chỉ viết file LIMITS tổng hợp này.
- File tạm /tmp của các luồng không đưa vào batch; `apps/web/dist/` (vite build kiểm
  chứng) không stage.

## 3. Kiểm chứng gộp của parent (chạy lại độc lập)

- tsc apps/web 0 lỗi; vite build pass (4,28 s, chỉ warning chunk cũ).
- Test chạy lại: G1 29/29, G2 24/24, 22A 38/38, T3 31/31, nestedCurveWindow23 12/12,
  video-spec nested 64/64, nestedDeep 16/16.
- Script: node --check 3 script đo/harness mới + bash -n fetch script đều pass.
- Parity i18n 809/809 sạch, twoLevel 18/18 mỗi bên, deepLeaf 4 key đủ hai bên.
- KHÔNG chạy lại ở bước gộp: đo headed của G4 (2 run) và G6 (lần 4), parity footage
  đầy đủ của G5/G6 — đó là số đo của luồng, ghi rõ trong LIMITS riêng.

## 4. Những gì CHƯA xong — nợ mở cho đợt sau (không mạo nhận)

- Mapper khớp chuỗi chưa xóa được: đường tạo curve trong panel vẫn qua
  `nestedCurveCreateTwoLevelReason` (chỉ trả chuỗi); muốn xóa mapper phải đổi hàm đó
  trả check nguyên rồi nối panel sang `translateTwoLevelCheck`.
- Hàm thuần sâu (`updateNestedDeepInnerClip`) vẫn ép check thành chuỗi có tiền tố cố
  định ở `nestUtils.ts` — store G2 tách reason bằng tiền tố (đổi wording sẽ làm test G2
  đỏ ngay, không lệch lặng lẽ). Sửa bền: hàm sâu trả kèm check object.
- `nestedSplitOffset` vẫn tuyến tính-only: dưới ramp tổ tiên, `leafLocalTime` nội suy
  tuyến tính sai — cần nghịch đảo chuỗi τ, để đợt riêng (đụng store/split flow).
- Lá sâu hơn 1 tầng chưa có nút panel (panel chỉ liệt kê clip con trực tiếp); qua nút
  panel preset 1×, 3 nhánh (leafSelfCurveInvalid, ancestorCurveInvalid,
  ancestorKeyframeProduct) không tới được trong use thường — vẫn khóa đủ 8 nhánh ở tầng
  store action.
- Fadeblack parity: dạy preview vẽ dip qua đen (mô hình describeTransition hiện bỏ qua
  màu trung gian).
- Quy tắc crf YUV sửa lại: crf ≤ 10 cho KHỚP dissolve trên 5/6 nội dung đã đo; cặp K→L
  là ngoại lệ không có crf nào cho KHỚP (sàn trượt chân ≤8). Cần thí nghiệm đối chứng
  giả thuyết frand-mosaic, hoặc chấp nhận XẤP XỈ là verdict đúng cho hạng nội dung này.
- Kho phát hành dọc mới có 2 clip (R1, R2, đều NASA vũ trụ, R2 gần như tĩnh) — cần thêm
  clip dọc trung tính ngoài vũ trụ; cổng NASA nhánh center vẫn yếu (đề xuất siết về chỉ
  nhánh photographer cho hạng phát hành); chưa cắt end card logo khỏi R1.
- Chưa đo: ô native 608×1080 (L-native), fade ở native/4K, sàn crf0 ở 4K (cần /tmp lớn hơn
  hoặc encode ra đĩa ngoài tmpfs), tab ẩn hàng giờ/discard thật dưới áp lực bộ nhớ, tab
  ẩn lúc phát tới cuối timeline, so pixel trực tiếp trước/sau redraw (hash mẫu thưa chưa
  đủ kết luận §G4-4.2), click-test phát dọc thật trên canvas (cần import/relink file qua UI),
  máy thật / Safari / touch-pen.
- Ba tầng 1→2 đều nhau vẫn không hợp được (giới hạn định dạng từ R1); attachment thời
  gian dưới ramp vẫn fail-fast cả preview lẫn render.

## 5. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round23-closing-debts22.txt`
  (26 file text, NUL-delimited, không binary, không dist, đã verify read-back + mọi file tồn tại)
- Tổng batch đang chờ user push sau đợt này: 2 file paths / 55 file
  (29 đợt 22 + 26 đợt 23; các đợt 5–21 đã push xong chiều 29/10).

# Phase 9 đợt 11 — Luồng P1: harness đối chiếu preview-vs-render tự động (LIMITS)

Ngày: 2026-10-27. Chạy từ cron vcut-build-loop (02:03 +07), 1 luồng trong
đợt lớn đợt 11. KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa
logic preview/render sản phẩm (chỉ thêm file harness + file LIMITS này).

## 1. Harness mới

`server/render/src/test_v11_parity.js` — mở rộng harness V6
(`test_v10_parity.js`) để bỏ nhãn PENDING hardcode:

- Transition: raster hoá "composite preview" từ `describeTransition`
  (apps/web/src/lib/transitionPreview.ts, transpile bằng tsc sang /tmp,
  giống kỹ thuật V6) rồi so pixel với frame render FFmpeg thật qua
  `buildXfadeFilter`. Composite vẽ cả 2 lớp A/B lên cùng 1 frame để kiểm
  tra HÌNH HỌC — preview thật chỉ vẽ 1 clip/lần (phần còn lại nền đen)
  nên composite khớp cũng không có nghĩa preview canvas vẽ ra đúng
  frame đó; khác biệt "1 clip vs 2 clip" vẫn tồn tại và đã ghi ở LIMITS
  đợt 10 §3.
- Text: lấy số mirror thật từ `textClipVisual`
  (apps/web/src/lib/previewEngine.ts, transpile sang /tmp; import
  @repo-1/video-spec được cấp stub throw-on-call vì nhánh parity không
  gọi hàm nào của package đó — nếu vô tình gọi thì harness lỗi to chứ
  không cho số sai lặng lẽ), raster hoá lại từ frame nền drawtext theo
  đúng thứ tự preview.tsx (clipRect → translate → rotate → shear →
  alpha), rồi so pixel với frame render ASS thật qua `buildParityAss`.

Thang phân loại giữ đúng V6: KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8;
XẤP XỈ = MAD ≤ 20 và ≥ 90% pixel lệch ≤ 32; còn lại là LỆCH (FAIL của
case, không phải lỗi harness).

## 2. Kết quả đo thật (1 lần chạy, FFmpeg 8.1.2, VM 2 CPU — số chỉ đúng máy này)

### Transition — khung 72×45, A đỏ / B xanh, frame giữa p = 0.5

| Type | MAD | ≤8 | ≤32 | Kết luận | Ghi chú đo |
|---|---|---|---|---|---|
| fade | 0.67 | 100.0% | 100.0% | KHỚP (PASS) | Crossfade tuyến tính đúng cả 2 phía |
| wipeleft | 2.36 | 98.6% | 98.6% | XẤP XỈ | Lệch đúng 1 cột biên: render B 48.6% vs preview 50.0% (35 vs 36 cột) — xfade đặt biên ở cột 37, preview ở cột 36 |
| slideright | 0.00 | 100.0% | 100.0% | KHỚP (PASS) | Hình học trượt của preview khớp pixel tuyệt đối với xfade |
| circleopen | 43.50 | 5.5% | 25.1% | LỆCH (FAIL) | Xem §3 — hình học preview sai mô hình, không phải sai số làm tròn |
| dissolve | 85.52 | 49.7% | 49.7% | LỆCH (FAIL) | Kỳ vọng: preview lưới hash 20×12 vs render nhiễu từng pixel — tỉ lệ B cả 2 phía đều ~50% (render 50.8%, preview 46.9%) nhưng vị trí ô khác nhau nên MAD cao |
| diamondclose (V3 mới) | 85.00 | 0.0% | 0.0% | LỆCH (FAIL) | Preview không có hình học cho type này → fallback fade (geometric=false); render B 50.7% vs preview 0.0% pixel gần xanh |
| squareopen (V3 mới) | 85.00 | 0.0% | 0.0% | LỆCH (FAIL) | Như trên; render B 41.1% vs preview 0.0% |

### Text — khung 320×180, chữ "TEST" trắng trên nền đen, frame giữa animation

| Animation | Thời điểm | MAD | ≤8 | Kết luận | Pixel sáng >100 (render vs preview) |
|---|---|---|---|---|---|
| tiltIn | t = 0.35s | 1.10 | 98.6% | XẤP XỈ | 166 vs 204 |
| skewIn | t = 0.30s | 0.94 | 98.9% | XẤP XỈ | 186 vs 255 |
| slideReveal | t = 0.50s | 0.93 | 99.5% | KHỚP (PASS) | 136 vs 168 |
| curtainIn | t = 0.40s | 0.40 | 99.5% | KHỚP (PASS) | 102 vs 157 |

Mirror đo được tại thời điểm đó (từ textClipVisual thật, không hardcode):
tiltIn cx=160 cy=100 rot=-6° alpha=0.50; skewIn cx=155 cy=90 skew=2.26°
alpha=0.50; slideReveal clipRect 130,81,30×18 (nửa trái hộp chữ) alpha=1;
curtainIn clipRect 145,81,30×18 (nửa giữa hộp chữ) alpha=0.50. Hộp chữ
đo từ frame nền drawtext: tâm (159.5, 89.5), kích thước 60×18, mục tiêu
(160, 90) — căn tâm đúng trong 0.5px. Harness truyền cùng hộp này sang
cả 2 phía: preview dùng hộp nguyên, render nhân thêm LIBASS_SCALE 0.84
của P4 (nên hộp render hẹp hơn: 50.4×15.1) — đó là thiết kế của P4, và
curtainIn vẫn cải thiện MAD từ 0.81 (bản quét khung đợt 10) xuống 0.40.

LƯU Ý CHẠY: giữa lần chạy đầu và các lần sau của luồng này, luồng P4
cùng đợt 11 đã sửa cả previewEngine.ts và textAnimParity.js từ quét
khung hình sang quét hộp chữ (nợ mở đợt 10 §4). Lần chạy đầu đo code
cũ (cả 2 phía quét khung: slideReveal MAD 0.93, curtainIn MAD 0.81);
một lần chạy giữa đo trạng thái hỗn hợp (render quét khung do harness
chưa truyền hộp, preview quét hộp: curtainIn MAD 0.62). Bảng trên là
số CUỐI CÙNG trên code hiện tại, cả 2 phía đều quét hộp — 2 số cũ chỉ
còn giá trị lịch sử, đừng trích dẫn chúng cho code hiện tại.

## 3. Phát hiện thật (không phải bug harness)

1. **circleopen của FFmpeg không phải vòng tròn biên cứng tuyến tính.**
   Probe mịn frame render (B strict = xanh >200, đỏ <50): P=0.0–0.2 →
   0% B; P=0.3 → 0% B + 57 pixel pha trộn; P=0.4 → 0% B + 885 pixel
   pha trộn; P=0.5 → 13.5% B + 1906 pixel pha trộn (58.8% khung nằm
   trong dải gradient); P=0.6 → 56.9% B; P=0.7 → 95.9% B; P=0.8 →
   100% B. Tức built-in circleopen có dải gradient rất rộng và hoàn
   thành sớm (~P=0.8), trong khi preview mô hình hoá bằng vòng tròn
   biên cứng bán kính p·rMax (P=0.5 → 43.8% khung là B). Muốn khớp cần
   đổi mô hình preview sang gradient + đường cong S, hoặc giữ nhãn
   "xấp xỉ" cho circleopen một cách có chủ ý. Đừng sửa preview trong
   luồng harness này (ngoài phạm vi task).
2. **14 type custom-expr V3 (đợt 10) chưa có hình học trong
   transitionPreview.ts.** `describeTransition` trả về fallback fade
   (geometric=false, note "type lạ … → fallback fade") cho diamondclose
   và squareopen — và theo code thì cho cả 12 type V3 còn lại. Đây là
   khoảng trống thật giữa catalog render (81 type) và preview, không
   phải lỗi đo. Đợt sau cần thêm hình học V3 vào transitionPreview.ts
   (các expr V3 đều là chọn pixel A/B theo công thức đóng nên map được
   như blinds-h/checker/diamond cũ) rồi chạy lại harness này để xác nhận.
3. **wipeleft lệch 1 cột biên** (render B bắt đầu muộn hơn preview 1
   cột ở khung 72px). Nhỏ, nhưng là lệch hệ thống, không phải nhiễu —
   có thể do xfade làm tròn biên khác preview. Chưa sửa vì ngoài phạm
   vi luồng harness và chưa xác minh ở kích thước khác.
4. **Text tiltIn/skewIn chỉ XẤP XỈ vì raster chữ khác nhau**, không vì
   công thức sai: libass (render) vs drawtext + nội suy song tuyến
   (preview) cho viền glyph khác nhau, và số pixel sáng lệch hệ thống
   (render ít pixel sáng hơn preview ở cùng ngưỡng >100 — curtainIn
   102 vs 157 do hộp render hẹp hơn sau LIBASS_SCALE 0.84 của P4).
   MAD ~1 cho thấy vị trí/góc/clip đúng; muốn lên KHỚP cần cùng một
   rasterizer cho cả 2 phía, không phải sửa công thức mirror.

## 4. Giới hạn của harness này (đọc trước khi claim)

- Composite transition không phải preview thật (xem §1): nó chứng minh
  hình học describeTransition đúng/sai, không chứng minh canvas preview
  vẽ ra frame đó.
- Text preview dùng cùng font DejaVu Sans nhưng rasterizer khác render
  (drawtext+bilinear vs libass) nên MAD nền ~0.8–1.1 ngay cả khi công
  thức đúng — ngưỡng KHỚP của V6 (le8 ≥ 99%) vì vậy rất sát giới hạn
  cho text (tiltIn 98.6%, skewIn 98.9% chỉ trượt ngưỡng một chút).
- Chỉ đo frame GIỮA (p=0.5 / giữa animation) và nguồn tổng hợp, chưa đo
  toàn bộ đường cong thời gian (trừ probe circleopen §3) và chưa đo
  footage thật, HD, clip dài. Hệ quả: ở frame giữa, clip quét hộp và
  quét khung cho vùng chữ nhìn thấy gần như trùng nhau (hộp chữ nằm
  giữa khung), nên MAD frame giữa KHÔNG phân biệt được 2 mô hình clip
  của đợt 10 và đợt 11 P4 — muốn kiểm chứng P4 triệt để cần thêm case
  frame sớm/muộn (t gần đầu/cuối animation), để đợt sau làm.
- Chưa đụng tới: pixelate/sharpen/mirror effect (đã có ở V6, giữ nguyên
  ở test_v10_parity.js), badge effect, click-test CDP.
- Harness exit 0 khi mọi case render chạy xong — LỆCH là kết quả đo
  trong bảng, không làm exit 1. Đừng đọc exit 0 thành "mọi case PASS".
- Vệ sinh /tmp: một lần chạy harness sinh ~87MB raw (mỗi case text
  20MB). /tmp của VM chỉ 512MB — các lần chạy đầu không dọn đã đẩy
  /tmp lên 96% và làm một lần chạy sau lỗi "No space left on device"
  ở cả 2 case text cuối (đã xác minh nguyên nhân, không phải lỗi
  render). Harness nay tự xoá TMP trên mọi đường thoát (kể cả exit
  sớm); đừng chạy nhiều harness raw song song mà không dọn.

## 5. File đổi/thêm (đường dẫn tương đối từ repo root)

- `server/render/src/test_v11_parity.js` (mới — harness V11, chạy bằng
  `node src/test_v11_parity.js` từ server/render/)
- `docs/PHASE9_ROUND11_P1_HARNESS_LIMITS.md` (mới — file này)

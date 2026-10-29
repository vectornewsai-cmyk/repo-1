# Phase 9 đợt 14 — R2: dissolve (LIMITS)

> Ngày: 2026-10-27. Luồng DISSOLVE, KHÔNG push, KHÔNG tag/release,
> KHÔNG binary. Nợ cũ: đợt 13 C2 kết luận FFmpeg dissolve XÁC ĐỊNH
> (byte-identical) nhưng hàm ngưỡng T(x, y) chưa tái tạo được,
> preview + badge vẫn approx, MAD tái lập 85.52.

## 1. Kết luận (đọc trước)

1. **Đã tái tạo được hàm ngưỡng dissolve — nợ đợt 13 ĐÓNG.**
   Đọc được source `vf_xfade.c` thật (qua GitHub raw, code.ffmpeg.org
   đã chặn ở đợt 13) và phát hiện chìa khóa: mọi phép toán trong
   `frand` đều là **float32**, còn mọi ứng viên double của C2 đều
   sai vì sai số đối số ~1e-4 nhân với 43758 sẽ quay fract nhiều
   vòng. Ép từng bước về float32 (`Math.fround`) cho khớp gần như
   tuyệt đối (xem §4).
2. **Preview dissolve đã chuyển từ lưới 20×12 sang nhiễu từng pixel
   đúng FFmpeg.** Mô hình nằm ở module riêng
   `apps/web/src/lib/dissolveFrand.ts`; `transitionPreview.ts` chỉ
   đổi cục bộ ở case dissolve (vùng mới `dissolve-noise`, không
   import thêm để giữ khả năng chạy trực tiếp bằng Node
   type-stripping); `preview.tsx` vẽ bằng mask ImageData theo cùng
   hàm frand (đường mask, không phải path rect).
3. **Badge dissolve nâng lên "matched"** (`previewStatus.ts`,
   `TRANSITION_MATCHED` + thêm): số đo đạt ngưỡng V6/V11 ở mọi
   điểm đo (MAD ≤ 0,0089, ≤8 ≥ 99,99% — xem §4). Badge test
   v5-preview-badge đã thêm assertion dissolve matched (assertion
   này PASS; test tổng thể hiện FAIL ở một assertion khác của
   luồng effect đang chạy song song — xem §7, không phải do R2).
4. **Không claim khớp tuyệt đối 100%.** Ở 320×180 còn 1–3 pixel
   lệch / 57600 (MAD ≤ 0,0089) do sinf của glibc lệch JS tại vài
   tọa độ lớn (xem §5). Vẫn nằm sâu trong ngưỡng "khớp", nhưng
   con số thật là vậy, không làm tròn thành 0.

## 2. Source FFmpeg đã đọc (bằng chứng, không suy đoán)

File `libavfilter/vf_xfade.c` (FFmpeg master, tải qua
`raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_xfade.c`
ngày 2026-10-27; máy đo chạy FFmpeg 8.1.2 — cùng họ code, dissolve
không đổi từ commit gốc e3e55982 năm 2020):

```c
static float frand(int x, int y)
{
    const float r = sinf(x * 12.9898f + y * 78.233f) * 43758.545f;
    return r - floorf(r);
}
// dissolve:
const float smooth = frand(x, y) * 2.f + progress * 2.f - 1.5f;
dst[x] = smooth >= 0.5f ? xf0[x] : xf1[x];   // xf1 = clip mới B
```

Suy ra trực tiếp: pixel thành B khi
`frand*2 + 2*progress − 1,5 < 0,5 ⇔ frand < 1 − progress`.
Mà `xfade_frame` tính `progress = 1 − (pts − start_pts)/duration`
(tức progress chạy NGƯỢC 1 → 0 trong cửa sổ transition) nên với
`τ = 1 − progress` là tiến độ thời gian 0 → 1:

> **Pixel (x, y) thành B khi và chỉ khi `frand(x, y) < τ`.**

Đây cũng là lý do đợt 13 C6 thấy "P ngược" ở custom-expr: cùng
một quy ước progress ngược của xfade, không phải bug riêng của
dissolve. Ánh xạ frame → τ trong setup đo (duration 1, offset 1,
fps 30, frame 30 = đầu cửa sổ thuần A, frame 60 = thuần B):
`τ = (frame − 30)/30` — frame 45 ⇔ τ = 0,5 đúng như harness V11/V12
đã dùng, frame 31 ⇔ τ ≈ 0,033, frame 59 ⇔ τ ≈ 0,967.

Vì sao C2 thất bại dù đã thử đúng công thức sin: C2 tính bằng
**double**. Đối số `12.9898x + 78.233y` ở khung 72×45 lên tới
~4365; float32 làm tròn đối số này với bước ~0,00024, tức sai số
~1,2e-4 so với double → sin lệch ~1,2e-4 → fract lệch ~5,2 vòng
→ hoàn toàn ngẫu nhiên. Ép đối số, kết quả sin và tích về float32
trước mỗi bước mới tái tạo đúng. Công thức JS trong
`dissolveFrand.ts` (đọc code, không cần tin tài liệu này):

```js
const f32 = Math.fround;
const arg = f32(f32(x * f32(12.9898)) + f32(y * f32(78.233)));
const s = f32(Math.sin(arg));          // sinf trả về float
const r = f32(s * f32(43758.545));
return r - Math.floor(r);              // fract
```

Lưu ý: x, y là **chỉ số pixel nguyên** (vf_xfade.c lặp x, y
nguyên). Dùng tâm pixel (+0,5) cho trường khác hẳn — đã kiểm
chứng trong lúc fit: bản tâm pixel chỉ khớp ở mức ngẫu nhiên.

## 3. Phương pháp đo (tái tạo được)

- Khung A = đỏ thuần (255,0,0), B = xanh dương thuần (0,0,255),
  fps 30, filter đúng `buildXfadeFilter("dissolve", 1, 1)` của
  render worker, output rawvideo rgb24 — cùng setup harness V12.
- Composite preview: `describeTransition("dissolve", τ, W, H)` từ
  code sản phẩm thật (transpile bằng tsc sang /tmp, không copy
  công thức sang script đo), raster theo từng pixel: lớp B hiện
  khi `frand < τ`, lớp A hiện khi `frand >= τ` (cờ `invert` của
  vùng dissolve-noise).
- MAD theo định nghĩa harness V12: trung bình |lệch| trên mọi
  kênh; pixel lệch đỏ↔xanh đóng góp 170 vào MAD. Ngưỡng "khớp"
  V6/V11: MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8 (mỗi kênh).
- So sánh cũ để đối chiếu: MAD lưới cũ tại τ = 0,5 là 85,52
  (đợt 13 C2, tái lập đúng); MAD lý thuyết của 2 trường nhị phân
  độc lập tại p = 0,5 là 85,0 — tức lưới cũ lệch đúng như ngẫu
  nhiên, không phải do sai tỉ lệ hay sai hướng.

## 4. Kết quả đo — MAD sau khi cài mô hình mới

Script đo: `/tmp/r14_measure.js` (transpile code thật + render
FFmpeg thật; không giữ trong repo vì chỉ là script đo 1 lần —
số liệu dưới đây + harness V12 là bằng chứng lưu lại).

| Khung | frame (τ) | MAD mới | ≤8 | Pixel lệch | Phân loại |
|---|---|---|---|---|---|
| 72×45 | 31 (0,033) | 0,0000 | 100,00% | 0 / 3240 | KHỚP |
| 72×45 | 37 (0,233) | 0,0000 | 100,00% | 0 / 3240 | KHỚP |
| 72×45 | 45 (0,500) | 0,0000 | 100,00% | 0 / 3240 | KHỚP |
| 72×45 | 52 (0,733) | 0,0000 | 100,00% | 0 / 3240 | KHỚP |
| 72×45 | 59 (0,967) | 0,0000 | 100,00% | 0 / 3240 | KHỚP |
| 144×90 | 31–59 (5 τ như trên) | 0,0000 | 100,00% | 0 / 12960 | KHỚP |
| 320×180 | 31 (0,033) | 0,0030 | 100,00% | 1 / 57600 | KHỚP |
| 320×180 | 37 (0,233) | 0,0030 | 100,00% | 1 / 57600 | KHỚP |
| 320×180 | 45 (0,500) | 0,0030 | 100,00% | 1 / 57600 | KHỚP |
| 320×180 | 52 (0,733) | 0,0059 | 100,00% | 2 / 57600 | KHỚP |
| 320×180 | 59 (0,967) | 0,0089 | 99,99% | 3 / 57600 | KHỚP |

So với MAD cũ 85,52 tại τ = 0,5: giảm xuống **0,0000** (72×45,
144×90) — tức cải thiện ~4 bậc độ lớn, không phải "xấp xỉ tốt
hơn một chút". Harness chính thức V12 (đã nối vùng
dissolve-noise vào `regionCovers`) cũng cho kết quả tương tự
tại điểm chuẩn của nó:

> `dissolve | MAD=0.00 <=8: 100.0% | KHỚP (PASS) | tỉ lệ B:
> render 50.8% vs preview 50.8%`

Xác định lại (re-confirm, không chỉ dẫn lại C2): render 72×45
2 lần cho output byte-identical (874.800 byte/lần).

## 5. Pixel lệch còn lại ở 320×180 — phân tích thật, không giấu

| Pixel | frand JS | Render (frame B đầu tiên) | Diễn giải |
|---|---|---|---|
| (160,178) | 0,001953 | 60 (pha thuần B, τ ≥ 0,967 không chuyển) | Lệch LỚN: JS nói chuyển gần như ngay, render nói không chuyển trong cửa sổ. |
| (303,170) | 0,962891 | 60 (như trên) | Lệch nhỏ–vừa: render ngưỡng cao hơn JS một chút (> 0,967). |
| (64,101) | 0,734375 | 52 (τ = 0,7333) | Sát biên: lệch ~0,001 — đúng dạng sai số sinf. |
| (159,23) | 0,966797 | 59 (τ = 0,9667) | Sát biên: lệch ~0,00013. |

Ba pixel sau phù hợp với sai số sinf ~1 ulp float (fract lệch
nhỏ). Riêng (160,178) không giải thích được bằng sai số nhỏ:
giả thuyết (CHƯA chứng minh, ghi rõ là giả thuyết) là trình biên
dịch FFmpeg dùng FMA contraction hoặc đường rút gọn đối số sinf
khác tại đối số lớn (~16004 rad), làm đối số lệch ~1 ulp float
(~0,001) — đủ quay fract nhiều vòng. Dù nguyên nhân chính xác
là gì, thực nghiệm cho thấy: lệch kiểu này hiếm (≤ 3/57600 =
0,005%), không theo mẫu hàng/cột rõ ràng, và không tăng theo τ.
Vì vậy claim ở đây là "khớp trong ngưỡng V6", KHÔNG phải
"khớp bit-perfect mọi pixel mọi cỡ khung".

## 6. Code đã đổi (luồng R2 — parent gộp batch, R2 KHÔNG tự stage)

1. `apps/web/src/lib/dissolveFrand.ts` (MỚI): `ffmpegDissolveFrand`
   + `dissolvePixelIsB`, kèm chú thích nguồn vf_xfade.c và giới
   hạn sinf.
2. `apps/web/src/lib/transitionPreview.ts` (sửa cục bộ): thêm
   variant `ClipRegion` `{ kind: "dissolve-noise"; p; invert }`;
   case dissolve đổi từ `cellsPair` lưới 20×12 sang 2 vùng
   dissolve-noise (A invert=true, B invert=false). KHÔNG import
   dissolveFrand vào file này (lý do kỹ thuật ghi trong chú thích
   đầu file: import không đuôi vỡ Node type-stripping, import
   đuôi `.ts` vỡ tsc bundler — module này trước nay không có
   import tương đối nào). `dissolveHash` cũ giữ nguyên cho
   pixelize, không đổi hành vi pixelize.
3. `apps/web/src/preview.tsx` (sửa cục bộ): import
   `ffmpegDissolveFrand`; `drawVideoClipWithTransition` rẽ nhánh
   dissolve-noise sang `drawVideoClipWithDissolveMask` mới (vẽ
   clip lên offscreen rồi áp mask ImageData; mask phía B cache
   theo `(W,H,p,alpha)` để 2 clip cùng cặp chỉ tính frand 1 lần,
   lớp A dùng phần bù). Mask NHÂN với alpha sẵn có của clip
   (tương đương destination-in), không thay alpha — clip có
   opacity/keyframe alpha thấp vẫn giữ tỉ lệ.
4. `apps/web/src/lib/transitionPreview.test.ts`: test dissolve cũ
   (đếm 240 ô) thay bằng 3 test mới — vùng dissolve-noise mang
   đúng p + invert ngược nhau; số pixel B đơn điệu và ≈ p
   (±0,02); giá trị frand kiểm chứng `(13,0) = 0,029296875`,
   `(1,0) = 0,94140625` (lấy từ render thật; checkpoint đầu tiên
   R2 tự đặt cho (1,0) đã SAI và test đã bắt được — đã sửa theo
   số thật, không sửa test cho qua).
5. `apps/web/src/components/transitions/previewStatus.ts`:
   dissolve vào `TRANSITION_MATCHED` + đoạn chú thích số đo.
6. `apps/web/scripts/v5-preview-badge.test.cjs`: thêm assertion
   dissolve/circleopen/circleclose matched.
7. `server/render/src/test_v12_parity.js` (harness, không phải
   code sản phẩm): `regionCovers` thêm case dissolve-noise (dùng
   module dissolveFrand transpile thật, floor tọa độ tâm về chỉ
   số nguyên); cập nhật note case dissolve.

Kết quả test chạy thật:

- `node apps/web/src/lib/transitionPreview.test.ts`: **22 pass,
  0 fail** (trước đợt: 20 test; thêm 2 test dissolve mới, sửa 1
  test cũ thành dạng mới — đếm chi tiết trong file test).
- Harness V12: dissolve **KHỚP (PASS), MAD 0,00, ≤8 = 100%**.
- `tsc --noEmit` (apps/web): **0 lỗi**. `vite build`: **pass**
  (37,20s).
- Badge test v5: assertion dissolve matched PASS (chạy tới được
  dòng đó); test tổng thể FAIL ở assertion
  `EFFECT_CANVAS_MATCHED có 4 type (nhận 5)` — xem §7.

## 7. Những gì KHÔNG phải do R2 / chưa xong (trung thực)

- **V12 tổng thể hiện có 1 FAIL: `transition circleopen`**
  (MAD 84,67, render B 4,2% vs preview 0,0%) và badge test FAIL
  ở `EFFECT_CANVAS_MATCHED` (5 type thay vì 4). Cả 2 đều là
  thay đổi của các luồng đợt 14 khác đang chạy song song trong
  cùng cây làm việc (R4 đang viết lại circleopen smoothstep —
  ghi chú "đo thật đợt 14 R4" trong `transitionPreview.ts`;
  một luồng effect khác thêm type vào tập canvas-matched).
  R2 KHÔNG đụng circleopen, KHÔNG đụng effect set, và KHÔNG sửa
  các FAIL đó để tránh xung đột hợp nhất — parent xử lý khi
  các luồng kia xong. Dissolve của R2 độc lập với 2 FAIL này
  (đã chứng minh bằng test module + đo riêng + case V12).
- **Chưa click-test mask dissolve trên trình duyệt thật.**
  Đường mask `preview.tsx` mới chỉ được kiểm chứng qua hình học
  (describeTransition + raster) và build — chưa có CDP click-test
  nào chụp canvas dissolve thật (luồng click-test đợt này có
  thể bổ sung; nếu canvas thật lệch thì đó là bug của đường mask,
  không phải của mô hình frand).
- **Chi phí mask:** đo bằng Node ~158ms cho 1 lần duyệt frand
  tại 1920×1080 (Math.sin từng pixel, chưa tối ưu). Nhờ cache
  phía B, 1 cặp transition chỉ tính 1 lần/frame; vẫn là chi phí
  đáng kể trong đúng các frame dissolve (thường ≤ 1s). Nợ tối
  ưu: cache theo frame, worker, hoặc mask ở độ phân giải hiển
  thị — nhưng mask giảm độ phân giải sẽ phá tính chính xác
  từng pixel vừa đạt được, nên KHÔNG làm bừa trong đợt này.
- **Chưa đo:** dissolve ở pix_fmt yuv420p (nợ từ C2, vẫn còn —
  yuv có thể làm tròn ngưỡng khác rgb24); dissolve 16-bit
  (cùng frand nhưng ngưỡng trên thang 16-bit, preview 8-bit
  không phân biệt); footage thật / clip dài / HD vượt 320×180
  (số 320×180 cho thấy lệch hiếm tăng theo cỡ khung, nên HD
  cần đo lại trước khi claim matched ở 1080p/4K); dissolve
  trong nested/compound (đường vẽ nested dùng
  transitionClipVisual nên hưởng mô hình mới, nhưng chưa đo
  riêng).
- **Không sửa `TRANSITION_PREVIEW_LIMITS.md` trong đợt này**
  để tránh xung đột với R4 đang sửa cùng vùng tài liệu — parent
  gộp LIMITS này vào đó khi hợp nhất batch (nội dung cần gộp:
  dissolve từ "approx, lưới hash" thành "matched, frand float32
  theo vf_xfade.c, MAD ≤ 0,0089, lệch hiếm ở tọa độ lớn").

## 8. Hướng tiếp theo đề xuất (nếu còn nợ)

1. Click-test CDP cho mask dissolve canvas thật (so pixel canvas
   với render tại τ = 0,5, khung nhỏ trước rồi mới HD).
2. Đo dissolve ở 1920×1080 + yuv420p để quyết định badge matched
   có giữ ở HD/yuv hay phải giới hạn phạm vi.
3. Tối ưu mask preview (cache/worker) chỉ sau khi (1) xanh —
   không đánh đổi tính chính xác lấy tốc độ trước.
4. Nếu muốn bit-perfect tuyệt đối: re-implement sinf của glibc
   (hoặc tra cứu FMA contraction của bản build FFmpeg cụ thể)
   cho vài tọa độ lệch — chi phí cao, lợi ích chỉ 0,005% pixel,
   nên để cuối danh sách.

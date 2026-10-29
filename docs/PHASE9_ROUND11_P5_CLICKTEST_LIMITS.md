# Phase 9 đợt 11 — Luồng P5: click-test các UI mới (LIMITS)

Ngày: 2026-10-27. Chạy từ cron vcut-build-loop (02:03 +07), luồng P5 trong
đợt lớn đợt 11. KHÔNG push, KHÔNG tag/release, KHÔNG sửa logic sản phẩm,
KHÔNG binary. Harness mới: `apps/web/scripts/p5-round11-clicktest.cjs`
(vite dev riêng cổng 5191, CDP Chromium headless, mẫu V10/M6).
Chạy: `node apps/web/scripts/p5-round11-clicktest.cjs` (từ `apps/web/`).

## 1. Kết quả click-test thật (lần chạy cuối, đã ổn định)

| Mục | Kết quả | Số đo thật |
|---|---|---|
| P0 load sample | PASS | 3 clip: 2 video + 1 text |
| P0b welcome modal | PASS | modal tự mở, đã đóng bằng click backdrop |
| P1 badge EffectPanel | PASS | 16 item, matched=3, approx=13, none=0, missing=0; 8 type canvas đợt 10 đều `approx` (không còn `none`) |
| P2 bật/tắt "Lật ngang" (click thật) | PASS | off→on badge giữ `approx`, on→off badge giữ `approx`, app sống |
| P3 bật motion blur (click thật) | PASS | 3 slider weights, pcts=[33,33,33], framesRange=3 |
| P4 tăng weight frame 1 (phím thật) | PASS | 33% → 34% (tổng chuẩn hoá về 1) |
| P5 nội suy + miMode (phím thật) | PASS | interp none→minterpolate, miMode hết disable, mci→blend, app sống |
| P6 chống rung + nội suy: cảnh báo stabilize VẮNG | PASS | stabilize=true, motionWarn=false, enhanceSpeedWarn=false, app sống (hồi quy cho bug đợt 9) |
| P6b chống rung + speedKeyframes: cảnh báo HIỆN | SKIP (xem §3) | không có UI nào tạo được speedKeyframes nên không click tới được trạng thái này |
| P7a canvas preview | PASS | canvas 872×776 (attr = css) |
| P7b badge BLUR≈ khi blur bật (đang phát) | PASS | badge = `NỘI SUY • BLUR≈` |
| P7c probe pixel ghost on-vs-off | FAIL — phát hiện sản phẩm (xem §2) | 2 lần chạy sạch: baseline off-vs-off 0.32 / 0.59, on-vs-off 0.88 / 1.05, ngưỡng > max(3×baseline, 3.0) — đều dưới ngưỡng |

Tổng: **10/12 pass, 1 SKIP có lý do, 1 FAIL là phát hiện sản phẩm thật**
(không phải lỗi harness — xem §2).

## 2. Phát hiện sản phẩm: vệt ghost motion blur không nhìn thấy được bằng pixel trên clip đục

Chuỗi plumbing đã chứng minh là thông suốt:

- UI weights đổi thật (P4) và weights → ghostAlphas có unit test
  (`previewEngine.test.ts`: `resolveMotionBlurGhost`, đảo weights thì đảo
  alpha).
- Badge `BLUR≈` hiện khi blur bật (P7b) — trạng thái blur tới được vòng
  vẽ preview.
- Nhưng pixel canvas KHÔNG đổi khi bật/tắt blur ở cửa sổ giữa clip
  (không transition): 2 lần chạy sạch, cùng cơ chế restart, median 3 mẫu
  đều cho on-vs-off ≈ 0.9–1.1 trong khi jitter baseline ≈ 0.3–0.6.

Nguyên nhân đọc từ code (khớp số đo, không phải đoán): `preview.tsx`
vẽ ghost (`drawMotionBlurGhosts`) TRƯỚC rồi vẽ frame hiện tại bằng
`drawImage` phủ kín cùng hình chữ nhật với alpha đục (= 1 giữa clip).
Frame hiện tại che kín toàn bộ bóng nên vệt không bao giờ lộ ra trên
clip đục, full-frame — bất kể weights đổi thế nào. Ghi chú "vệt mờ đủ
thấy khi vật chuyển động nhanh" trong `previewEngine.ts`
(`MOTION_BLUR_GHOST_ALPHA = 0.35`) chỉ đúng khi frame hiện tại không
đục (opacity < 1, fade transition) — còn giữa clip đục thì sai.

Luồng này KHÔNG sửa `preview.tsx`: sửa đúng cần quyết định thiết kế
(ví dụ vẽ frame hiện tại với alpha bằng weight của nó rồi composite
bóng sau, hoặc blend bóng sau frame hiện tại) — đó là đổi ngữ nghĩa
preview, vượt phạm vi "không sửa logic sản phẩm lớn" của luồng P5.
Đề xuất cho đợt sau: quyết định ngữ nghĩa ghost rồi mới sửa + đo lại
bằng chính probe P7c này (ngưỡng hiện tại đã có sẵn trong harness).

## 3. Nhánh dương của cảnh báo stabilize không click-test được (nợ, không giấu)

Cảnh báo stabilize+ramp chỉ hiện khi clip có CẢ `stabilize` VÀ
`speedKeyframes` (`MotionPanel.tsx`: `hasStabilize && hasSpeedRamp`).
Không có UI nào trong app tạo được `speedKeyframes` (SpeedPanel chỉ có
speed hằng + reverse; không có speed-curve editor; đã grep toàn
`apps/web/src`). Vì vậy nhánh dương này không thể tới bằng click —
harness ghi SKIP kèm lý do thay vì bịa click. Nhánh âm (P6) mới là hồi
quy cho bug đợt 9 đã sửa (panel cũ cảnh báo sai stabilize+interp) và
đã PASS. Muốn click-test nhánh dương thì đợt sau cần có UI tạo
speedKeyframes (speed-curve editor) hoặc đường import project có sẵn
speedKeyframes — đó là nợ sản phẩm, không phải nợ harness.

## 4. Bug harness đã sửa trong lúc chạy (ưu tiên sửa harness trước)

1. **Nhãn panel bị CSS uppercase**: `innerText` trả về `FRAME 1: 33%`,
   `SỐ FRAME GỘP: 3`, `CHỐNG RUNG ...` trong khi regex của harness viết
   thường — lần chạy đầu báo sai `weightRanges=0` và không tìm thấy
   checkbox chống rung dù click blur thật ra đã bật. Đã sửa: mọi so
   khớp nhãn đều hạ về lowercase trước. Bài học: đừng so khớp
   `innerText` phân biệt hoa/thường trong app này.
2. **Artifact resume ở probe P7c**: lần chạy đầu dùng resume từ điểm
   pause cho on-vs-off = 37.08 (trong khi baseline 0.25) — thực chất là
   chụp phải frame đen lúc video chưa seek kịp, không phải ghost. Đã
   sửa: cả 3 lần chụp đều restart bằng nút ⏮ (cùng cơ chế).
3. **Frame đen lúc restart**: chụp 1 frame đầu cửa sổ đôi khi vớ phải
   frame đen (baseline off-vs-off dao động 0.32 → 35.91 giữa 2 lần
   chạy). Đã sửa: median 3 mẫu trong cửa sổ muộn [2.5s, 3.0s) (video
   chắc chắn seek xong). Sau sửa, baseline ổn định 0.32 / 0.59.
4. **Cửa sổ fade không tách được tín hiệu**: probe P7d ở fade-out cho
   baseline jitter 5.59 (do thời điểm chụp tuyệt đối làm thay đổi
   alpha fade) trong khi on-vs-off chỉ 1.57 — không kết luận được gì
   nên P7d chỉ còn là dòng INFO tham khảo, không tính điểm.

## 5. Giới hạn trung thực — click-test này KHÔNG chứng minh

- Ghost trên clip có opacity < 1 / mask / SR: cùng thứ tự vẽ (bóng
  trước, frame hiện tại sau) nên lập luận "bị che" vẫn áp dụng khi
  frame hiện tại đục tại vùng đó, nhưng luồng này chưa probe các
  đường vẽ đó — đừng suy ra "ghost hỏng ở mọi đường vẽ".
- Weights đổi pixel: weights → ghostAlphas đúng ở tầng logic, nhưng vì
  pixel ghost không lộ nên "đổi weights thì pixel đổi" cũng không quan
  sát được — probe P7c đo on-vs-off, chưa đo riêng weight A vs weight B
  (kết quả sẽ giống nhau vì cùng bị che).
- Probe chỉ đúng project mẫu + máy đo (VM 2 CPU, Chromium headless
  1440×1200): canvas 872×776, clip mẫu webm tự ghi bằng canvas.
- Badge effect chỉ kiểm tra nhãn `data-preview` theo
  `previewStatus.ts`, không đo pixel khớp render (đó là việc của
  harness V6 đợt 10).

## 6. File đổi/thêm (tương đối từ repo root, KHÔNG push)

- `apps/web/scripts/p5-round11-clicktest.cjs` (mới, harness click-test P5)
- `docs/PHASE9_ROUND11_P5_CLICKTEST_LIMITS.md` (mới, file này)

Không sửa file sản phẩm nào (không chạm `preview.tsx`,
`MotionPanel.tsx`, `EffectPanel.tsx`, `previewStatus.ts`).

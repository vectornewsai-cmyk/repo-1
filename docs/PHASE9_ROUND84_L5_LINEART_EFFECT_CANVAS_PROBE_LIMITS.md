# Phase 9 đợt 84, luồng L5 — Lineart aliasing: probe đọc trực tiếp effect canvas

- **Luồng:** L5, đợt 84 (nợ J7 đợt 82 §7.1, K6 đợt 83 §7 mục 2 — bước nội bộ
  Chrome tạo delta lineart).
- **Ngày:** 11/11/2026 (lượt cron 03:35 +07). Repo local `~/workspace/repo-1`,
  HEAD GitHub `5f548ef8`. **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: DELTA ĐÃ ĐỊNH VỊ ĐƯỢC — NÓ NẰM Ở KHÂU UPSCALE VIDEO
  CỦA ĐƯỜNG PLAIN, KHÔNG PHẢI Ở EFFECT CANVAS.**

  Probe headed đọc trực tiếp frame vào/ra effect canvas (hook
  `getImageData`/`putImageData`) + vẽ trực tiếp video ra offscreen ở native
  và viewport-size, trên 4 nguồn × 3 variant, cho thấy:
  - **Effect canvas ĐÓNG HOÀN TOÀN:** frame vào effect canvas bằng đúng
    draw trực tiếp video→canvas 1:1 (**MAD 0**), và frame ra sau sharpen
    bằng đúng model `applySharpen` bundle **từng bit (MAD 0, năng lượng
    delta bằng nhau tuyệt đối, tỉ lệ 1,000)** — trên cả 4 nguồn, cả 2 mức.
  - **Composite canvas→canvas ĐÓNG:** snapshot sharp bằng đúng upscale
    Mitchell của frame effect-output (**MAD 0,000–0,013**) — nhưng CHỈ khi
    dùng đúng hình học thật của app (thang `rect.scale` + độ lệch căn giữa,
    xem §2). Đây cũng là **lỗi hình học trong model của J7/K6**: họ dùng
    thang 809/640 thay vì 1,2638889 và bỏ qua độ lệch căn giữa 0,056px —
    riêng lỗi này đã gây ~1,2 MAD ở nhánh sharp trong mọi số đo trước.
  - **Đường plain VẪN LỆCH:** snapshot plain khác Mitchell(base) **5,61**
    (1px) / **4,25** (2px) ngay cả với hình học đúng; vẽ trực tiếp video→
    viewport cũng khác Mitchell **5,54 / 4,14** và khác mọi kernel đã thử
    (tốt nhất tri 3,95 / 3,09 — vẫn LỆCH). Phần dư delta lineart
    (**5,39** / **4,05** @sharp10) gần như bằng đúng sai số upscale video
    của đường plain — tức **mô hình sai ở plain, không sai ở sharp**.
  - **`applySharpen` dùng bt709 là ĐÚNG (nợ H3 §5.2 — ĐÓNG):** với base
    thật S1, bản bt709 tái tạo đúng frame sharp của Chrome (**MAD 0,000**),
    bản bt601 lệch 0,038/0,062. Trên lineart hai ma trận cho Y như nhau
    theo cấu tạo (R=G=B) nên chứng cứ này chỉ đến từ textsmall640.
  - **Không sửa production:** không có kernel nào thắng cho đường video
    (tri tốt nhất vẫn LỆCH 3,95), và đổi kernel sẽ phá đường canvas đã
    chứng minh là Mitchell (0,000–0,013).

## 1. Câu hỏi và phương pháp probe

J7 + K6 đã loại 9 hướng offline (kernel, pha, sharpen-sau, decode-mềm,
supersample, gain-fit, pre-softening, render viewport, dither, thang trung
gian) và kết luận baseline chỉ giải thích 10–15% delta preview trên lineart.
Ứng viên còn lại duy nhất có cơ chế là base-mismatch YUV/chroma khuếch đại
qua sharpen — nhưng E9 (downscale-back) hỏng phương pháp nên chưa đo được.
Luồng này đo trực tiếp từng khâu trong trang, không qua mô hình trung gian.

Pipeline thật của preview (đọc `apps/web/src/preview.tsx`):
- **Plain:** video element → main canvas viewport **1 bước** (drawImage
  video→viewport, `imageSmoothingQuality="high"`).
- **Sharp:** video → effect canvas 640×360 1:1 (`effectCanvasSource`:
  drawImage + getImageData + `applyCanvasEffects` + putImageData) → main
  canvas viewport (canvas→canvas).
- Main canvas vẽ với transform `vp.scale` = `min(cw/W, ch/H)` và căn giữa.

Probe headed mới (`r84l5-effect-canvas-probe-headed.mjs`, sao từ harness J7,
2 phiên: {lineart640, textsmall640} + {lineart2px-640, sqw4-640}, window
1920×1080, project 640×360, viewport snapshot 809×455, playhead 1,0s):
- **Hook (C):** `Page.addScriptToEvaluateOnNewDocument` bọc
  `CanvasRenderingContext2D.prototype.getImageData/putImageData`, giữ bản
  sao cuối theo (canvas, label variant). Effect canvas là canvas 640×360
  duy nhất có cả get+put trong luồng này (chroma/mask không chạy; held-frame
  chỉ drawImage; transition offscreen chỉ khi có transition). Không sửa
  production — chỉ quan sát.
- **(A)** `DIRECT_FN`: vẽ video element thẳng ra offscreen ở native 640×360
  (S0) và viewport-size 809×455 (Bview), cùng frame (paused).
- **(D)** Snapshot cuối S3 như harness J7 (plain/sharp05/sharp10) + raw
  frame hash cùng-khung D1 + D2 (direct native pixel-identical qua 3
  variant) + D3 (hook chỉ bắt được effect canvas ở sharp) + H9 0 lỗi trang.
  **Cả 2 phiên đều 7/7 pass.**
- Phân tích offline (`r84l5-effect-canvas-analyze.mjs`): so S0/S1/S2/S3/Bview
  với frame render ffmpeg (`fullrgb-plain.raw`), model `applySharpen`
  bundle, và upscale Mitchell (kernel J2/K2). Thêm fit kernel video
  (`r84l5-video-kernel-fit.mjs`: Lanczos/Gauss/box/kéo giãn), dải không
  gian + profile (`r84l5-video-bands-profile.mjs`), kernel hẹp
  (`r84l5-video-narrow-fit.mjs`), và sharpen bt601 tự cài để đối chứng
  bt709 (mục F trong script phân tích).

Nhiễu đo: tái lập K6 (MAD ±0,05); các số 0,000–0,013 ở nhánh sharp là làm
tròn uint8 nên ~0 là khớp từng bit trong sai số làm tròn.

## 2. Phát hiện phụ quan trọng: hình học thật của app (thang + căn giữa)

Snapshot rect cho scale `rect.scale` = **1,2638889** = min(809/640, 455/360)
(giới hạn bởi chiều cao), KHÔNG phải 809/640 = 1,2640625 như mọi model
J7/K6 đã dùng. App vẽ project 640×360 với thang đó và **căn giữa**: nội
dung bắt đầu ở x = (809 − 640×1,2638889)/2 = **0,056 device-px**, tức độ
lệch pha phiX = **−0,044 nguồn-px** (dọc khớp đúng, phiY = 0).

Bằng chứng: MAD(S3_plain, Bview) theo dải cột có dạng chữ U đối xứng
(L1px: 0,611 / 0,433 / **0,103** / 0,429 / 0,609; L2px tương tự; textsmall
0,102 / 0,050 / **0,000** / 0,002 / 0,000) — sai số ~0 ở giữa khung, lớn
dần về 2 biên, đúng dấu hiệu thang vẽ hơi nhỏ + căn giữa; dải hàng phẳng
(0,42 / 0,47 / 0,42). Lệch nguyên-pixel (0,0) là tốt nhất (1,312; mọi dịch
±1 đều 41–71) nên không phải lệch rect.

Hệ quả: model cũ (thang 809/640, không phi) lệch tới ~0,09 nguồn-px ở biên
phải — đủ phá lineart 1px. Sửa hình học xong, nhánh sharp khớp **từng bit**
(xem §3). Mọi số J7/K6 ở thang 1,264 đều mang sai số hình học này ở nhánh
sharp (nhánh plain thì sai số video kernel át hết nên không thấy).

## 3. Kết quả theo khâu (sharp10; sharp05 cho cùng kết luận)

### A. Base decode ở native-size: KHỚP (giả thuyết base-mismatch bị bác ở mức này)

| Nguồn | MAD(S0, R_ff) | Kênh R/G/B |
|---|---|---|
| L1px-640 | **0,286** | 0,271 / 0,310 / 0,278 |
| L2px-640 | **0,238** | — |
| textsmall640 | **1,344** | 1,114 / **1,968** / 0,950 |

Frame video→canvas 1:1 của Chrome gần như trùng frame ffmpeg (26,9% pixel
L1px khác nhau nhưng chỉ ở mức ±1). Base-mismatch YUV/chroma ở project-size
**không tồn tại** ở mức có thể giải thích delta 5–6 MAD — giả thuyết (a)
của J7 §7.1 bị bác ở khâu này (phần còn lại của nó — mismatch chỉ xuất hiện
khi upscale video — chuyển thành §4). Textsmall lệch hơn (1,344, kênh G
1,968) là decoder noise đã biết, không phải lineart.

### B. Frame vào effect canvas = draw trực tiếp: ĐÚNG TỪNG BIT

MAD(S1_effect_in, S0_direct_native) = **0** trên cả 4 nguồn × 2 mức
(8/8). drawImage 1:1 video→effect-canvas xác định và bằng draw ra offscreen
mới. Không có làm-mềm/làm-sắc ẩn nào ở khâu này.

### C. Sharpen trong trang = model bundle: ĐÚNG TỪNG BIT (đóng E1 bằng đo trực tiếp)

| Nguồn | S2 vs applySharpen(S1) sharp05 / sharp10 | Năng lượng delta Chrome/model |
|---|---|---|
| L1px-640 | **0 / 0** | 884.468 / 884.468 (tỉ lệ 1,000) |
| L2px-640 | **0 / 0** | 941.002 / 941.002 (1,000) |
| textsmall640 | **0 / 0** | 2.602.976 / 2.602.976 (1,000) |
| sqw4-640 | **0 / 0** | 18.132.519 / 18.132.519 (1,000) |

`applySharpen` trong trang và bundle node cho cùng một ảnh ra, từng bit.
Đường effect không phải nguyên nhân — J7 E1 (MAD 0,05–0,08 qua đường render)
nay được thay bằng đo trực tiếp MAD 0. Delta project-size của Chrome
(S2−S1) bằng đúng delta model; năng lượng delta effect thật chỉ bằng
~1/5 năng lượng dp_prev trên lineart (§5).

### D. Composite: nhánh sharp KHỚP TỪNG BIT với hình học đúng; nhánh plain LỆCH

MAD snapshot vs upscale Mitchell (hình học rect.scale + phiX=−0,044):

| Nguồn | Sharp vs Mitchell(S2) | | Plain vs Mitchell(S0) | Plain vs Bview |
|---|---|---|---|---|
| | rect+phi | thang cũ 809/640 | rect+phi | |
| L1px-640 | **0,013** | 1,210 | **5,607** | 1,312 |
| L2px-640 | **0,002** | 1,111 | **4,247** | 1,106 |
| textsmall640 | **0,000** | 0,200 | **0,427** | 0,093 |
| sqw4-640 | **0,000** | 0,901 | **2,380** | 0,341 |

- **Nhánh sharp ĐÓNG:** Mitchell + thang + căn giữa đúng tái tạo snapshot
  sharp tới 0,000–0,013 MAD trên cả 4 nguồn, cả 2 mức (sharp05 cho cùng số).
  J2 đã đúng cho canvas→canvas; nay đúng cả trên frame đã sharpen và trên
  nội dung tự nhiên.
- **Nhánh plain LỆCH:** vẫn 5,61 / 4,25 / 2,38 ngay cả với hình học đúng.
  Plain vs Bview (cùng là upscale video, chỉ khác hình học) chỉ 1,31 /
  1,11 / 0,34 — nên ~4,2–5,5 MAD còn lại là **kernel upscale video khác
  Mitchell**, không phải hình học.

### E. Phần dư then chốt: delta preview vs model (base thật + hình học đúng)

dp_prev = S3_sharp − S3_plain; model dp = Mitchell(S2) − Mitchell(S1)
(cùng hình học rect+phi, base thật S1):

| Nguồn | mean\|dp_prev\| sharp10 | mean\|model dp\| | Tỉ lệ năng lượng | Phần dư delta MAD |
|---|---|---|---|---|
| L1px-640 | 6,075 | 1,213 | **5,01×** | **5,394** |
| L2px-640 | 4,680 | 1,311 | **3,57×** | **4,053** |
| textsmall640 | 4,074 | 4,004 | 1,02× | 0,438 |
| sqw4-640 | 32,640 | 31,846 | 1,03× | 2,387 |

So với baseline K6 (tri, base R_ff, thang cũ): 5,494 / 4,128 / 0,748 —
phần dư gần như không đổi (5,394 / 4,053) vì nó nằm ở nhánh plain, nơi
hình học đúng không cứu được. Trên nội dung tự nhiên model nay giải thích
~98% năng lượng dp (textsmall tỉ lệ 1,02×, phần dư 0,44); trên lineart chỉ
~20%. Chênh lệch lineart là hiện tượng riêng của upscale **video** trên
đường mảnh, không phải lỗi mô hình tổng quát.

## 4. Khâu upscale video: không kernel nào trong 13 biến thể khớp

Fit Bview (vẽ trực tiếp video→viewport 809×455, hình học sạch — không dính
lỗi rect.scale) với model(S0). MAD (làm tròn uint8; float trong JSON):

| Kernel | L1px | L2px | textsmall | sqw4 |
|---|---|---|---|---|
| **tri (tốt nhất)** | **3,953** | **3,083** | **0,265** | **0,963** |
| Mitchell (1/3,1/3) | 5,539 | 6,598 | 0,429 | 2,334 |
| BC(0,25, 0,375) | 5,497 | — | 0,472 | — |
| Catmull-Rom | 8,546 | — | 0,770 | — |
| B-spline | 18,328 | — | 1,063 | — |
| Lanczos2 / Lanczos3 | 12,958 / 22,721 | 12,036 / 22,366 | 0,794 / 1,451 | 3,920 / 7,074 |
| Gauss σ=0,8/1,0/1,2 | 32,9 / 41,6 / 46,8 | 29,7 / 39,4 / 45,9 | 1,89 / 2,39 / 2,71 | 10,4 / 14,1 / 16,6 |
| Box | 32,045 | 24,864 | 1,952 | 7,902 |
| tri h=1,25 / 1,5 / 2,0 (kéo giãn) | 13,89 / 23,44 / 37,65 | 11,04 / 18,78 / 34,09 | 0,84 / 1,33 / 2,14 | 3,69 / 6,37 / 12,0 |
| tri h=0,9 / 0,8 / 0,7 (hẹp) | 7,03 / 12,86 / 19,15 | 5,53 / 10,16 / 15,02 | 0,46 / 0,82 / 1,19 | — |

(Mọi thang h≠1 đều tệ hơn h=1 rõ rệt trên cả 3 nguồn đo.)

- **Pha đúng:** quét phi chung 2 trục cho thấy phi=0 là cực tiểu sắc
  (L1px tri: phi −0,125 → 10,65; 0 → 3,96; +0,125 → 17,77); parabola qua
  3 điểm đặt đỉnh ở −0,022, cải thiện tối đa ~0,31. Không phải lỗi pha.
- **Không phải lỗi theo vị trí:** MAD theo dải cột của Bview-vs-tri gần
  như phẳng (L1px 3,54 / 4,06 / 4,41 / 4,21 / 3,58; L2px 2,99 / 3,11 /
  3,15 / 3,21 / 2,99) — không tăng về biên nên không phải align-corners
  hay sai thang; dải hàng cũng phẳng.
- **Profile qua đường dọc 1px** (hàng y=203, đường x=8): tổng năng lượng
  tối bảo toàn (±1,5%: Bview 304 vs tri 308,5) nhưng phân bố khác qua 2
  pixel kẹp đường — Bview nhẹ hơn ở px trái (63 vs 49,1) và tối hơn ở px
  phải (143 vs 152,4), giống lệch phải ~0,05–0,1px ở pha này; profile dọc
  (đường ngang) cho cùng hình dạng (63/143 vs 49/152,7) nên đẳng hướng.
  Lệch pha toàn cục không giải thích được (xem quét phi trên), nên đây là
  hình dạng kernel khác, không phải dịch lưới.
- **Không phải chroma:** Bview có spread kênh (mean|R−G| 0,74, 2,71% pixel
  spread >8, max 109) nhưng S0 native đã có gần như y hệt (0,77; 2,51%)
  — đó là nhiễu chroma của h264 decode, không do upscale thêm vào.
- Kết luận: **scaler video→canvas của Chrome khác scaler canvas→canvas**
  (Mitchell, đã chứng minh) và khác mọi kernel đã thử. Ứng viên còn lại
  (chưa đo được): scaler nội bộ của pipeline video (libyuv/compositor,
  có thể làm việc trong không gian YUV với luma/chroma tách riêng) —
  cần probe kiểu J2 nhưng với **nguồn video** (xung/step video) để đọc
  trực tiếp đáp ứng xung của scaler video, xem §7 mục 2.

## 5. applySharpen dùng bt709 là đúng (nợ H3 §5.2 — ĐÓNG)

Trên textsmall640 (nội dung màu; lineart xám R=G=B cho Y như nhau ở cả 2
ma trận nên không phân biệt được), dùng base thật S1 + hình học đúng:

| | sharp05 | sharp10 |
|---|---|---|
| Final bt709 vs S3_sharp | **0,000** | **0,000** |
| Final bt601 vs S3_sharp | 0,038 | 0,062 |
| Delta MAD 709 (dp_prev vs model dp) | 0,439 | 0,438 |
| Delta MAD 601 | 0,450 | 0,462 |
| Chênh delta giữa 2 bản sharpen | 0,044 | 0,071 |

Với nhánh sharp nay khớp từng bit (sai số model ~0), chênh 0,038–0,062
giữa bt709 và bt601 là tín hiệu thật, không phải nhiễu: **bt709 thắng
4/4 so sánh**. Giữ nguyên `applySharpen` bt709; không đổi sang bt601.
Lưu ý: hai bản sharpen chỉ khác nhau 0,044–0,071 MAD ở project-size trên
nội dung này (textsmall640 không bão hoà mạnh) — bằng chứng đủ để giữ,
chưa đủ mạnh để khẳng định trên nội dung bão hoà cao (chưa đo).

## 6. Quyết định: KHÔNG sửa production

- **Không đổi kernel, không đổi `chrome-resample.mjs`, `effectCanvas.ts`,
  `preview.tsx`.** Nhánh sharp đã đúng từng bit; nhánh plain không có
  kernel thắng nào (tri tốt nhất vẫn LỆCH 3,95) — đổi sang tri sẽ phá
  đường canvas→canvas đã chứng minh Mitchell (0,000–0,013) mà không đóng
  được đường video.
- **Không áp "sửa hình học" vào production:** hình học rect.scale + căn
  giữa là hành vi ĐÚNG của app (đã đo), chỉ model đo của J7/K6 dùng sai
  thang — sửa model, không sửa app. Các luồng sau dùng thang `rect.scale`
  + phi căn giữa khi so snapshot S3 (đừng dùng vw/W nữa).
- Bound J7 E6 giữ nguyên: lệch lineart không đổi verdict toàn cục nào
  trên nội dung tự nhiên đã đo; chỉ quan trọng khi khớp pixel trên đường
  kẻ/chữ mảnh bilevel.

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Scaler video→canvas vẫn chưa nhận dạng được** sau 13 biến thể
   (5 kernel + Lanczos 2/3 + Gauss 3 mức + box + kéo giãn 3 mức + hẹp
   3 mức): tốt nhất tri 3,95 (1px) / 3,09 (2px), vẫn LỆCH. Đây là nợ duy
   nhất còn lại của lineart aliasing sau khi effect canvas + composite
   đều đóng. Hướng tiếp theo duy nhất có cơ chế: probe kiểu J2 với nguồn
   video (xung/step/bậc thang encode thành mp4, drawImage video→canvas ở
   nhiều thang) để đọc trực tiếp đáp ứng xung/lobe của scaler video —
   đừng quét thêm kernel RGB offline nữa.
2. **Phần dư delta lineart vẫn LỆCH:** 5,39 (1px) / 4,05 (2px) @sharp10
   (tri baseline K6: 5,49 / 4,13) — gần như không cải thiện sau khi dùng
   base thật + hình học đúng, vì phần dư nằm ở nhánh plain. Ngoại suy
   5–6px của J7 vẫn chưa đo.
3. **Chỉ đo 640@1,264, frame tĩnh 30, 1 capture/biến thể** (+ D1/D2 cùng
   khung), grayscale/bilevel + 2 control. Chưa đo thang khác, dị hướng,
   nội dung màu bão hoà cho bt709 (mục 5 chỉ có textsmall640), frame
   chuyển động, hay Chrome phiên bản khác / GPU thật (VM này
   SwiftShader/CPU).
4. **Hook chỉ đọc được frame đã qua get/putImageData:** các khâu không qua
   đó (chroma/LUT/enhance/mask) không nằm trong probe này — nhưng clip đo
   không có các hiệu ứng đó nên không ảnh hưởng kết luận.
5. **Phiên 2 lần đầu FAIL do /tmp đầy (không phải EPERM):** vite
   ENOSPC vì tmpfs /tmp (512M) đầy 100% do `/tmp/l1-probe` (492M) của
   một luồng đợt 84 khác đang chạy; không xoá file của luồng khác, chạy
   lại sau khi luồng đó dọn xong thì 7/7 pass. Không có sóng EPERM trong
   lượt này (mọi ghi file của luồng này thành công).
6. Số `G_*` trong JSON phân tích (fit kernel + quét phi) tính ở thang cũ
   809/640 cho S3 — chỉ dùng cho Bview (thang đó là đúng với Bview);
   các số D/E/F (thang rect+phi) mới là số chuẩn cho snapshot S3.

## 8. Kiểm chứng

- Headed 2 phiên, 4 nguồn × 3 variant: **14/14 pass** (D1 cùng-khung,
  D2 direct native pixel-identical, D3 hook effect-canvas, H9 0 lỗi
  trang) — log `r84l5-headed-s1.log`, `r84l5-headed-s2.log`.
- `node --test apps/web/scripts/chrome-resample-67u2.test.mjs`: **8/8
  pass** (không sửa file production nào).
- Tái lập chéo: S3_sharp vs Mitchell(S2) với hình học cũ cho 1,21/1,11/
  0,20/0,90 — khớp đúng các số đã biết trước khi sửa hình học; với hình
  học đúng về 0,000–0,013. Baseline K6 tái lập qua E_oldBaseRff (5,468 /
  4,100 — chênh ≤0,03 so với 5,494/4,128 do kernel Mitchell thay tri).
- Không sửa file production, không sửa file chung (package.json, dict i18n,
  DESKTOP.md), không binary, không workflow. Bundle effectCanvas chỉ build
  lại ra /tmp (không phải file repo).

## 9. File

- Script mới (5, `apps/web/scripts/`):
  `r84l5-effect-canvas-probe-headed.mjs` (probe headed: hook get/put +
  direct-draw + snapshot), `r84l5-effect-canvas-analyze.mjs` (phân tích
  A–G + bt709/bt601), `r84l5-video-kernel-fit.mjs` (fit 13 biến thể
  kernel video), `r84l5-video-bands-profile.mjs` (dải không gian +
  profile), `r84l5-video-narrow-fit.mjs` (kernel hẹp h<1).
- Doc này: `docs/PHASE9_ROUND84_L5_LINEART_EFFECT_CANVAS_PROBE_LIMITS.md`.
- Bằng chứng (KHÔNG stage — không phải file repo):
  `hidden_files/round84-l5/` (`r84l5-analysis.json`,
  `r84l5-video-kernel-fit.json`, `r84l5-video-bands-profile.json`,
  `r84l5-video-narrow-fit.json`, `r84l5-headed-s{1,2}.log`,
  `headed-w1920x1080-p640x360-ph1{-s2}/r84l5-snaps-w1920x1080-p640x360.json`
  + vite/chrome log).

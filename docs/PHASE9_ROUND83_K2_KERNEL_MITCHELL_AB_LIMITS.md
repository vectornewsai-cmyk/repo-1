# Phase 9 đợt 83, luồng K2 — Quyết định kernel Mitchell vs BC: A/B rồi áp dụng

- **Luồng:** K2, đợt 83 (đóng nợ đợt 82 §4.2 — J2 kernel Mitchell).
- **Ngày:** 11/11/2026 (lượt cron 00:35 +07; A/B chạy 22 phút 10 giây).
  Repo local `~/workspace/repo-1`. **CHỈ stage, KHÔNG push, KHÔNG release/tag.**
- **Kết luận ngắn: ĐỔI PRODUCTION SANG MITCHELL (1/3, 1/3).**

  A/B có kiểm soát trên cùng capture, 3 kernel (tam giác / BC(0,25, 0,375)
  / Mitchell(1/3, 1/3)), 3 cánh, cho thấy Mitchell **không chỉ khớp toán
  tử trực tiếp mà còn bù được lệch đường sharp** — đúng câu hỏi J2 để lại:
  toán tử trực tiếp Mitchell thắng 27/27 hàng + 3/3 checker 2D (tổng MAD
  0,008 so với BC 6,117); delta sharp test-pattern Mitchell thắng BC
  15/18 case (tổng 28,798 so với 29,181); nội dung tự nhiên sạch delta
  3–1–2 (tổng 4,808 so với 4,829). **4 verdict KHỚP tăng thêm, 0 verdict
  mất đi** (kiểm lại theo đúng luật verdict E9/F6 — xem §5). Hybrid
  (BC cho sharp + Mitchell cho plain) **tệ hơn** Mitchell-mọi-chỗ
  (−1,2% tổng delta) nên bị bác cả bằng số lẫn bằng cơ chế (Chrome chỉ
  dùng một kernel cho mọi frame). `CHROME_UPSCALE_BC` đã đổi
  (0,25, 0,375) → (1/3, 1/3) trong `apps/web/scripts/chrome-resample.mjs`
  + cập nhật chú thích; kiểm chứng sau đổi: 18/18 test suite + verify
  production 4/4 + tsc web/desktop 0.

## 1. Câu hỏi và phương pháp

J2 (đợt 82) probe headed chứng minh kernel upscale `drawImage` thật của
Chrome là Mitchell (B=C=1/3), MAD 0,000–0,003, nhưng production giữ BC
vì BC đang bù lệch đường sharp (H3 §1.4 / I3: BC thắng tam giác 31–46%
trên delta, Mitchell chỉ nhỉnh hơn BC 0,02–0,10 MAD trong phép đối chiếu
của I3). Chưa ai đo: **Mitchell có bù được lệch sharp không, trên cùng
capture, với verdict lật theo từng case?**

Script A/B mới (`apps/web/scripts/r83k2-mitchell-ab.mjs`, code đo riêng
của luồng này — không copy số J2/I3/F6, chỉ dùng lại dữ liệu capture gốc
của họ): cùng bộ capture, chạy cả 3 kernel, quy ước resample giống hệt
E9/F6/I3/J2 (S=(i+0,5)/s, h=1 — kernel bị cắt ở |x|≤1,5 rồi chuẩn hoá
lại; RGB làm tròn thường + kẹp 0..255; delta tính trên float không làm
tròn như I3 V0):

- **Arm A — toán tử trực tiếp:** probe J2 gpu0 (headed Chromium 1254):
  9 mẫu hàng × 3 thang (1,1328 / 1,2637 / 2,0) + checker 2D full-frame
  + sweep impulse 512 vị trí + step overshoot.
- **Arm B — đường sharp trên test-pattern:** snaps H3 run D (w1920-p640,
  s=1,2639) + run A2 (w2560-p1280, s=1,1320), nội dung sqw4/8/16/32
  (+ lineart2px ở run D): plain MAD, abs sharp05/10 MAD + le8,
  delta05/10 MAD.
- **Arm C — nội dung tự nhiên:** snaps F6 w2560-p1280 (s=1,132, SẠCH)
  gồm ocean/basgo/slovenska + w1920-p640 (s=1,264) và w2560-p640
  (s=2,264) chỉ ocean — 2 cửa sổ sau **NHIỄM** downscale nội bộ
  1280→640 (F6 §5), báo riêng, không dùng để quyết.

Verdict: abs KHỚP iff MAD ≤ 2 và le8 ≥ 0,99; delta KHỚP iff delta
MAD ≤ 2 (ngưỡng F6/E9). Quy tắc quyết định đăng ký trước khi chạy
(ghi trong header script): đổi sang Mitchell iff (i) Mitchell thắng
hoặc hòa BC trên delta sharp, không verdict nào lật tệ hơn; (ii) thắng
lớn trên toán tử trực tiếp; (iii) không verdict plain nào lật tệ hơn.
Hybrid chỉ xét nếu thắng Mitchell-mọi-chỗ >20% tổng delta MAD — và dù
vậy vẫn phải bác vì không có cơ chế vật lý (Chrome một kernel).

## 2. Arm A — toán tử trực tiếp: Mitchell thắng tuyệt đối (27/27 + 3/3)

MAD hàng Chrome vs mô hình (trung bình 4 hàng/capture), Mitchell thắng
**mọi** case; số đo tái lập đúng từng số với J2 (bảng §2.1 của LIMITS J2):

| Mẫu | s=1,1328 tri / BC / **Mit** | s=1,2637 tri / BC / **Mit** | s=2,0 tri / BC / **Mit** |
|---|---|---|---|
| sqw4 | 1,721 / 0,690 / **0,003** | 1,737 / 0,730 / **0** | 1,488 / 0,620 / **0** |
| sqw8 | 0,866 / 0,303 / **0,003** | 0,853 / 0,359 / **0** | 0,738 / 0,308 / **0** |
| sqw4-hi | 1,172 / 0,745 / **0** | 1,238 / 0,734 / **0,002** | 0,496 / 0,744 / **0** |
| sqw4-lo | 0,397 / 0,121 / **0** | 0,402 / 0,142 / **0** | 0,248 / 0,496 / **0** |
| step | 0,014 / 0,003 / **0** | 0,012 / 0,003 / **0** | 0,012 / 0,005 / **0** |
| impulse | 0,028 / 0,012 / **0** | 0,026 / 0,009 / **0** | 0,020 / 0,010 / **0** |
| linA/linB/linAB | 0,010–0,034 / 0,003–0,017 / **0** | 0,010–0,034 / 0,008–0,017 / **0** | 0,010–0,020 / 0,008–0,016 / **0** |

Tổng MAD 27 case: **Mitchell 0,008 / BC 6,117 / tam giác 11,632**.
Checker 2D full-frame: Mitchell **0,004 / 0 / 0** ở 3 thang; BC
0,606–0,677; tam giác 1,401–1,515. Sweep impulse: Mitchell MAD 0,008 /
0,007, exact **99,39% / 99,61%**; BC 3,496 / 3,991, exact 6,07% / 0,2%;
tam giác 7,212 / 4,491. Step overshoot: Chrome 1/1, 1/1, 2/2 (under/over
ở 3 thang) — **Mitchell và BC đều khớp đúng từng số**, tam giác 0/0 cả 3
(bước đơn không phân biệt được BC với Mitchell — đúng như J2 §4).

## 3. Arm B — đường sharp test-pattern: Mitchell bù được lệch sharp

Delta MAD (d05/d10) và plain MAD, run D (s=1,2639) + run A2 (s=1,1320).
Mitchell thắng BC **15/18** case delta, BC thắng 1, hòa 2; plain thắng
8/9. Tổng delta 18 case: **Mitchell 28,798 vs BC 29,181** (−1,3%).
Tổng plain 9 case: **13,653 vs 14,388** (−5,1%).

| Run / nội dung | plain tri / BC / **Mit** | delta05 tri / BC / **Mit** | delta10 tri / BC / **Mit** |
|---|---|---|---|
| D sqw4-640 | 1,040 / 2,647 / **2,441** | 4,041 / 2,793 / **2,764** | 4,724 / 2,640 / **2,538** |
| D sqw8-640 | 0,532 / 1,323 / **1,219** | 2,114 / 1,418 / **1,414** | 2,508 / 1,344 / **1,322** |
| D sqw16-640 | 0,269 / 0,662 / **0,599** | 1,066 / 0,710 / **0,710** | 1,257 / 0,674 / **0,657** |
| D sqw32-640 | 0,149 / 0,363 / **0,325** | 0,575 / **0,377** / 0,386 | 0,676 / 0,365 / **0,359** |
| D lineart2px-640 | 3,362 / **4,329** / 4,455 | 4,107 / 4,306 / **4,295** | 4,113 / 4,313 / **4,302** |
| A2 sqw4 | 1,081 / 2,715 / **2,475** | 4,118 / 2,786 / **2,756** | 4,732 / 2,602 / **2,568** |
| A2 sqw8 | 0,535 / 1,336 / **1,226** | 2,084 / 1,401 / **1,388** | 2,488 / 1,371 / **1,305** |
| A2 sqw16 | 0,257 / 0,675 / **0,605** | 1,040 / 0,704 / **0,693** | 1,238 / 0,678 / **0,653** |
| A2 sqw32 | 0,132 / 0,338 / **0,308** | 0,531 / 0,358 / **0,357** | 0,623 / 0,341 / **0,331** |

Hai case BC thắng đều trong nhiễu đo: sqw32-640 d05 (0,377 vs 0,386,
chênh 0,009) — case duy nhất BC thắng delta ở Arm B. Plain lineart2px
BC thắng (4,329 vs 4,455, chênh 0,126) nhưng cả hai đều LỆCH và delta
lineart không phụ thuộc kernel (4,30 với mọi kernel — aliasing, I3 §4.4).

Điểm đáng chú ý nhất: **abs sharp** (MAD tuyệt đối của frame đã sharpen,
không phải delta) cải thiện mạnh dưới Mitchell — vd sqw4-640 abs05
2,095 → **1,438**, abs10 2,223 → **1,105**; sqw4 A2 abs05 2,200 → 1,525,
abs10 2,409 → 1,211. Mitchell không chỉ bù delta mà còn đưa frame
sharpen tuyệt đối về gần Chrome hơn BC trên mọi nội dung sqw.

## 4. Arm C — nội dung tự nhiên: hòa có lợi cho Mitchell (cửa sổ sạch)

Cửa sổ sạch w2560-p1280 (s=1,132), ocean/basgo/slovenska:

| Nội dung | plain tri / BC / **Mit** | delta05 tri / BC / **Mit** | delta10 tri / BC / **Mit** |
|---|---|---|---|
| ocean | 1,937 / 2,086 / **2,049** | 1,147 / 0,905 / **0,905** | 1,356 / 0,903 / **0,888** |
| basgo | 0,727 / 0,862 / **0,822** | 1,107 / **0,990** / 0,993 | 1,122 / 0,869 / **0,868** |
| slovenska | 0,652 / 0,676 / **0,668** | 0,590 / 0,584 / **0,581** | 0,601 / 0,578 / **0,573** |

Delta: Mitchell thắng 3, BC thắng 1 (basgo d05, chênh 0,003 = nhiễu),
hòa 2; tổng delta 6 case **4,808 vs 4,829**. Plain: Mitchell thắng 3/3,
tổng 3,539 vs 3,624. Ocean plain vẫn trên ngưỡng KHỚP dưới cả hai kernel
(2,049 vs 2,086; tri 1,937) — plain ocean là base-mismatch/decoder noise,
không phải kernel (đúng như F6: chỉ ocean vượt ngưỡng dưới BC).

Cửa sổ NHIỄM (p640, s=1,264 w1920 / s=2,264 w2560, chỉ ocean): BC thắng
delta 4/4 (tổng 6,398 vs 6,515). **Không dùng để quyết** (nhiễm downscale
nội bộ 1280→640, F6 §5) — nhưng ghi lại trung thực: ở thang 2,264 nhiễm,
BC nhỉnh hơn Mitchell ~0,03 MAD trên delta ocean. Thang ~2 sạch trên
nội dung 2D thật vẫn là nợ mở (xem §7).

## 5. Verdict lật: 4 KHỚP tăng thêm, 0 mất đi (luật E9/F6)

Script A/B dùng luật verdict abs chặt hơn E9 (MAD>2 → LỆCH) nên báo
7 flip "tốt hơn". Kiểm lại bằng đúng luật `verdictMad` của E9/F6
(KHỚP iff MAD≤2 & le8≥0,99; XẤP XỈ iff MAD≤20 & le32≥0,9 — le32≥le8 nên
mọi case BC ở đây với le8≥0,96 đều chắc chắn XẤP XỈ trở lên):

- **KHỚP tăng thêm (4):** sqw4-640 abs05 (BC 2,095/le8 0,9827 →
  Mitchell 1,438/0,9913); sqw8-640 plain (1,323/0,9844 → 1,219/0,9901);
  sqw8-640 abs10 (1,216/0,9852 → 0,571/0,9901); sqw8 A2 abs05
  (1,101/0,9869 → 0,772/0,9907).
- **KHỚP mất đi (0):** không case nào BC KHỚP mà Mitchell không KHỚP,
  trên toàn bộ chỉ số abs + delta của Arm B+C.
- 3 flip còn lại theo luật chặt (sqw4-640 abs10, sqw4 A2 abs05/abs10)
  theo luật E9 là XẤP XỈ→XẤP XỈ nhưng MAD cải thiện lớn (2,223→1,105;
  2,200→1,525; 2,409→1,211) — vẫn tốt hơn, chỉ không đổi nhãn.

## 6. Quyết định và áp dụng vào production

**ĐỔI: `CHROME_UPSCALE_BC` (0,25, 0,375) → (1/3, 1/3) (Mitchell).**
Cả 3 điều kiện đăng ký trước đều thỏa: (i) delta sharp Mitchell thắng
hoặc hòa BC (B: 15–1–2; C-sạch: 3–1–2; tổng delta −1,3%/−0,4%);
(ii) toán tử trực tiếp thắng áp đảo (27/27 + 3/3, tổng MAD 0,008 vs
6,117); (iii) 0 verdict plain lật tệ hơn (4 KHỚP tăng thêm, 0 mất).

**Hybrid bị bác bằng số:** tổng delta (B + C-sạch) Mitchell-mọi-chỗ
33,606 vs hybrid (BC cho sharp + Mitchell cho plain) 34,010 — hybrid
tệ hơn 1,2%, xa ngưỡng >20% đã đăng ký. Thêm nữa hybrid không có cơ
chế vật lý: Chrome dùng MỘT kernel cho mọi frame; tách kernel theo
biến thể chỉ là fit, không phải mô hình. Không áp dụng hybrid.

**Thay đổi production** (`apps/web/scripts/chrome-resample.mjs`, 1 hằng
số + chú thích — không đổi chữ ký, không đổi hành vi downscale/dị
hướng, vì hằng này chỉ được đọc ở nhánh `sx>1 && sy>1` của
`resamplePlaneTrilinear`):
- `CHROME_UPSCALE_BC = { B: 1/3, C: 1/3 }` (+ chú thích nguồn K2).
- Chú thích header: thêm khối K2, ghi chú F6 đã thay bằng Mitchell.
- Chú thích `bilinearPlane2D` / `resamplePlaneTrilinear`: BC → Mitchell.

**Kiểm chứng sau đổi:**
- `node --test chrome-resample-67u2.test.mjs + r82j2-chrome-probe.test.mjs`:
  **12/12 pass** (8 + 4). `r72z7-trilinear-2dblend.test.mjs`: **6/6 pass**.
- `r83k2-verify-production.mjs`: **4/4 PASS** — upscale 64→96 production
  byte-identical với Mitchell độc lập; khác BC cũ MAD 0,347; downscale
  64→32 byte-identical khi đổi tạm hằng về cũ (chứng minh runtime rằng
  downscale không đọc hằng upscale); hằng số = (1/3, 1/3).
- Đối chiếu độc lập: số Mitchell Arm C khớp **đúng từng số cả 15 chỉ số**
  (3 nội dung × plain/abs05/d05/abs10/d10) với phương pháp lưới
  `bc0.333-0.333` đã tính sẵn trong `r78f6-analysis.json` của F6 (code
  path khác) — vd ocean 2,049 / 2,417 / 0,905 / 2,148 / 0,888 cả hai bên.
- tsc web **0**, desktop **0** (chạy trực tiếp `node_modules/.bin/tsc`;
  `npx` lỗi quyền npm cache, không phải lỗi code).
- Không chạy vite build (chỉ đổi script harness + doc, không đụng
  component); không chạm UI nên không chạy css60/61.

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Phần dư delta sqw4 (~2,5–2,8 MAD) vẫn mở.** Kernel giờ đã đúng
   (Mitchell) nhưng delta preview-vs-render trên sqw4 vẫn lệch ~2,5 MAD
   — nguyên nhân còn lại là base-mismatch (I3 E8) và/hoặc khâu khác trong
   pipeline preview, không phải kernel. Đổi sang Mitchell cải thiện
   abs-sharp nhưng không đóng được phần dư delta.
2. **Thang ~2 trên nội dung 2D thật vẫn chưa có số đo sạch.** Cửa sổ
   nhiễm p640 cho BC thắng delta ocean 4/4 ở s=1,264/2,264 — nhưng nhiễm
   downscale nội bộ nên không kết luận được. Cần probe sạch ở thang ~2
   trên nội dung tự nhiên trước khi khẳng định Mitchell thắng mọi thang.
3. **Chỉ đo upscale đẳng hướng** (sx=sy), grayscale test-pattern +
   3 nội dung tự nhiên, Chrome 158 / Chromium 1254 trên VM này
   (SwiftShader/CPU). Chưa đo dị hướng, thang >2, nội dung màu bão hoà,
   Chrome phiên bản khác, GPU thật, Safari/WebKit thật.
4. **Noise Δkurt/Δcorr dưới Mitchell chưa đo lại trong luồng này.**
   F6 chỉ đo noise dưới BC/tri; file `r78f6-analysis.json` đã có sẵn
   phương pháp `bc0.333-0.333` cho noise — đợt sau nên trích/đối chiếu
   noise verdict dưới Mitchell thay vì đo lại.
5. **Lineart2px aliasing không đổi** (delta ~4,3 với mọi kernel;
   plain tệ hơn nhẹ dưới Mitchell: 4,455 vs BC 4,329, cả hai LỆCH) —
   không phải vấn đề kernel; J7 vẫn mở.
6. **Lỗi nhãn trong script A/B (không ảnh hưởng số):** ghi chú hard-code
   của cửa sổ w2560-p640 ghi "s=1,264" nhưng thang đo thật từ rect là
   **s=2,2639** (đúng như F6: thang 2,264 ở project 640). Số đo trong
   JSON/log đều dùng `rect.scale` nên đúng; chỉ nhãn `note` sai. Đã
   đính chính ở §4; không chạy lại 22 phút chỉ để sửa nhãn.
7. **Wart nhỏ trong JSON tổng hợp:** `tally.armA_rows` có thêm 2 field
   `mitchellMadSum`/`bcMadSum` = 0 (khởi tạo thừa); tổng đúng nằm ở
   `mitchellSum`=0,008 / `bcSum`=6,117. Không ảnh hưởng kết luận.

## 8. Kiểm chứng (tóm tắt)

- A/B: `node apps/web/scripts/r83k2-mitchell-ab.mjs` exit 0, 22m10s
  (log: `hidden_files/round83-k2/r83k2-mitchell-ab.log`,
  JSON: `hidden_files/round83-k2/r83k2-mitchell-ab.json`).
- Suite: 67u2 8/8 + J2 probe 4/4 + 2dblend 6/6 = **18/18**.
- Verify production: **4/4**. tsc web **0**, desktop **0**.
- Đối chiếu chéo F6: 15/15 chỉ số Mitchell khớp đúng từng số.

## 9. File

- Đổi (1, `apps/web/scripts/`): `chrome-resample.mjs` (hằng
  `CHROME_UPSCALE_BC` + 4 khối chú thích).
- Script mới (2, `apps/web/scripts/`): `r83k2-mitchell-ab.mjs` (A/B 3
  cánh), `r83k2-verify-production.mjs` (verify 4/4 sau đổi).
- Doc này: `docs/PHASE9_ROUND83_K2_KERNEL_MITCHELL_AB_LIMITS.md`.
- Bằng chứng (KHÔNG stage — không phải file repo):
  `hidden_files/round83-k2/` (`r83k2-mitchell-ab.{json,log}`).

# Đợt 202 P2 — Enhance parity: áp cap m 1,05 đã duyệt + đo lại N10/N5b + khảo sát R_rel theo σ trên footage thật

**Nhiệm vụ (quyết (a1)-201 + giao (r)-201):** (1) đổi hằng số kẹp m 1,12 → 1,05
trong code sản phẩm; (2) đo lại N10/N5b với cap 1,05 trên cùng pipeline/seed
đợt 200–201; (3) khảo sát R_rel phụ thuộc σ trên FOOTAGE THẬT (nợ 200).
**Verdict: cap 1,05 ĐÃ ÁP DỤNG vào code ship; N10/N5b ĐẠT với cap mới (N10
còn TỐT HƠN cap cũ: 6,102/0,074 so với 6,126/0,082); R_rel theo σ có dạng
chữ U trên cả 4 đoạn footage thật nhưng biên phụ thuộc nội dung; cap 1,05
thắng ròng 29/36 nhóm so với 27/36 của cap 1,12 — với 1 trường hợp ngược
duy nhất (Sintel w4s σ=10, f11 ngược dấu, vượt bar 0,006) ghi nhận trung
thực ở §4. Phạm vi hiệu lực [10, 20] ĐỨNG trên BBB w0s; trên nội dung
chuyển động cap 1,05 mở rộng biên trên ra tới ~23,7 (pan).**

## §0. Tóm tắt số đo

### A. N10/N5b với cap mới (sim, fixture đợt 197/198, khung 3/7/11, bar 0,15)

| Fixture | cap 1,12 (cũ) | cap 1,05 (mới, ship) | fixed m=1 | m=0,95 |
|---|---|---|---|---|
| N10 | 6,126 / 0,082 ĐẠT | **6,102 / 0,074 ĐẠT** | 6,240 / 0,155 CHƯA | 6,203 / 0,171 CHƯA |
| N5b | 6,810 / 0,109 ĐẠT | **6,810 / 0,109 ĐẠT** | 6,803 / 0,107 ĐẠT | 6,720 / 0,094 ĐẠT |

- N10 với cap 1,05: m áp dụng 1,05/1,05/1,05 (M 14,87/14,73/11,81; map thô
  1,093/1,091/1,056 đều bị kẹp xuống 1,05); α_eff 0,509 cả 3 khung (cap cũ
  0,530/0,529/0,512); R_rel từng khung 0,074/0,029/0,073 (cap cũ
  0,082/0,021/0,072). MAD còn TỐT HƠN cap cũ 0,024, R_rel tốt hơn 0,008.
- N5b: m 1,012/1,0/1,0 — kẹp không chạm (M 8,19/6,54/6,85) nên số Y HỆT cap cũ.
- fixed và m=0,95 đều CHƯA trên N10 (0,155 / 0,171) — adapt là CẦN THIẾT,
  và m=0,95 toàn cục KHÔNG SHIP (đứng từ đợt 199, xác nhận lại bằng số mới).

### B. Quét σ trên footage thật — R_rel worst (cap 1,05, bar 0,15; trong ngoặc cap 1,12)

| σ | BBB w0s | BBB pan | Sintel w0s | Sintel w4s |
|---|---|---|---|---|
| 5 | **0,245 CHƯA** (0,245) | 0,101 ĐẠT (0,114) | 0,086 ĐẠT (0,086) | 0,104 ĐẠT (0,091) |
| 7 | **0,201 CHƯA** (0,201) | 0,070 ĐẠT (0,082) | 0,102 ĐẠT (0,102) | 0,142 ĐẠT (0,136) |
| 10 | 0,134 ĐẠT (0,134) | 0,052 ĐẠT (0,069) | 0,070 ĐẠT (0,070) | **0,156 CHƯA** (0,140) |
| 12 | 0,110 ĐẠT (0,110) | 0,066 ĐẠT (0,079) | 0,034 ĐẠT (0,034) | 0,129 ĐẠT (0,119) |
| 15 | 0,119 ĐẠT (0,119) | 0,097 ĐẠT (0,105) | 0,071 ĐẠT (0,071) | 0,128 ĐẠT (0,171) |
| 18 | 0,137 ĐẠT (0,137) | 0,119 ĐẠT (0,130) | 0,075 ĐẠT (0,075) | 0,132 ĐẠT (0,149) |
| 20 | 0,147 ĐẠT (0,147) | 0,134 ĐẠT (0,144) | 0,097 ĐẠT (0,097) | 0,126 ĐẠT (0,139) |
| 22 | **0,156 CHƯA** (0,156) | 0,145 ĐẠT (0,154) | 0,120 ĐẠT (0,120) | 0,142 ĐẠT (0,163) |
| 25 | **0,168 CHƯA** (0,168) | **0,154 CHƯA** (0,162) | 0,147 ĐẠT (0,148) | **0,167 CHƯA** (0,181) |

- Tổng verdict trên 36 nhóm: **cap 1,05 ĐẠT 29/36; cap 1,12 ĐẠT 27/36;
  fixed m=1 ĐẠT 30/36.** Cap 1,05 sửa 3 nhóm so với cap 1,12 (pan σ=22,
  w4s σ=15, w4s σ=22) và làm hỏng 1 nhóm (w4s σ=10 — xem §4). Thắng ròng +2.
- Lợi ích adapt GIỮ ở mọi nhóm với cap 1,05: MAD adapt vẫn hơn tap, gap
  −0,051…−0,151 (tệ nhất pan σ=5: −0,051; tốt nhất w4s σ=10: −0,151).

## §1. Code đã đổi (quyết (a1)-201)

- `apps/web/src/lib/enhancePreview.ts`: **`DENOISE_MOTION_MULTIPLIER_MAX`
  1,12 → 1,05** (1 hằng số) + cập nhật comment kẹp [1,0; 1,05] và ghi chú
  quyết (a1)-201. **KHÔNG đổi map tuyến tính:** neo thấp 7,194 → 1,0 và neo
  cao 13,803 → map 1,08 (`DENOISE_MOTION_MULTIPLIER_AT_HIGH = 1,08` giữ
  nguyên); kẹp mới cắt map tại 1,05 — đúng cách sim P2-201 đã đo
  (min(mBase, cap)). Hệ quả: `denoiseMotionMultiplier(13,803)` nay = 1,05
  (trước 1,08) — N10 vẫn ĐẠT, thậm chí tốt hơn (xem §2).
- 5 file test cập nhật kỳ vọng theo hằng số mới (không đổi logic test):
  `enhancePreview91P2.test.ts` (kỳ vọng m(100) 1,12 → 1,05; m(13,803)
  1,08 → 1,05; alpha plan 0,486×1,08 → 0,486×1,05; tên test + comment ghi
  rõ "map 1,08, kẹp 1,05") và `parityHarness198/199/200/201.test.ts`
  (m(100) 1,12 → 1,05; m(13,803) 1,08 → 1,05). Lần chạy test đầu sau đổi
  hằng số FAIL đúng 5 file này (7 assertion) — đã sửa kỳ vọng rồi chạy lại
  xanh hết (xem §5); đó là bằng chứng test khóa đúng hằng số, không phải
  test bị bỏ qua.
- **KHÔNG đụng** `parityHarness202.ts` / `.test.ts` của P4-202:
  `motionMultiplierCap112` là bản tham chiếu cap cũ P4 giữ cố ý ("không đọc
  code ship đã đổi") — để nguyên. Test của P4-202 đã tự kỳ vọng
  `denoiseMotionMultiplier(13,803) = 1,05` (dòng 281: "cap 1,05 (a1)-201:
  thô 1,08 bị kẹp xuống 1,05") — khớp với đổi này; P2 chỉ chạy kiểm tra
  file đó (29 test PASS, xem §5), không sửa.
- Chuỗi `notes` trong `parityHarness198/199/200/201.ts` vẫn ghi "kẹp
  [1,0; 1,12]" — đó là mô tả lịch sử pipeline P2-198, P2 không sửa file
  của P4; P4-202 có thể cập nhật khi viết harness mới (ghi nhận, không
  phải lỗi chức năng vì verdict harness tính từ hàm ship, không từ chuỗi
  notes).

## §2. Đo lại N10/N5b với cap 1,05

- Pipeline/seed Y HỆT đợt 198/200/201 (fixture `n10-inter.yuv` +
  `n10-truth-s05.yuv`, `rp4-inter.yuv` + `rp4-truth-s05.yuv` trong
  `hidden_files/round197-p2/`; M = C5b_box 3 dải; khung 3/7/11; truth
  yadif + hqdn3d s=0,5).
- **Tái hiện đúng từng số cap 1,12 đợt 198/201 trước khi so sánh:**
  N10 6,126/0,082; N5b 6,810/0,109 — sim đáng tin, số mới so sánh được.
- **N10 ĐẠT với cap 1,05, còn tốt hơn cap cũ** (6,102/0,074 vs 6,126/0,082;
  biên an toàn dưới bar: 0,076 so với 0,068). Lý do: α_eff 0,509 sát vách
  0,5 hơn 0,53 mà vẫn đủ xa để không lật làm tròn — m=1,05 vẫn cho α vượt
  vách cần thiết cho N10.
- **N5b ĐẠT, không đổi** (6,810/0,109 y hệt — kẹp không chạm vì m ≤ 1,012).
- Đối chiếu: fixed CHƯA trên N10 (0,155 — sát bar 0,005); m=0,95 CHƯA trên
  N10 (0,171) nhưng ĐẠT trên N5b (0,094) — đúng kết luận đợt 199: không
  tồn tại hệ số toàn cục nào cho cả hai cùng ĐẠT; adapt theo M là bắt buộc.

## §3. Khảo sát R_rel theo σ trên footage thật (nợ 200)

- Phương pháp: 4 đoạn footage thật khác nhau (BBB w0s — nội dung nhẹ, BBB
  pan — chuyển động vừa đều, Sintel w0s — phim điện ảnh nhẹ, Sintel w4s —
  phim điện ảnh chuyển động mạnh), mỗi đoạn quét σ ∈ {5,7,10,12,15,18,20,
  22,25} (9 điểm, 36 nhóm), seed 19100+f, truth yadif + hqdn3d s=0,5,
  khung 3/7/11 — cùng pipeline đợt 200/201. Nguồn clean RGB tái dùng từ
  đợt 199/200 (BBB `bbb-w0s-clean.rgb` / `bbb-pan-clean.rgb`; Sintel
  CC-BY 3.0 `sintel-w0s/w4s-clean.rgb`).
- **Tái hiện đúng từng số đợt 200/201 ở cap 1,12** (bằng chứng pipeline
  khớp): w0s σ=5 0,245; σ=22 0,156; σ=25 0,168; pan σ=15 0,105; pan σ=22
  0,154; w4s σ=15 0,171; w4s σ=22 0,163. Số mới đo trên cùng pipeline nên
  so sánh trực tiếp được.
- **Chữ U XÁC NHẬN trên cả 4 đoạn, nhưng biên phụ thuộc nội dung:**
  - **BBB w0s:** U rõ nhất, đáy σ=12 (0,110); biên dưới ~9,2–9,3 (nội suy
    7→10 cắt bar tại ~9,28; dùng thêm điểm σ=8/9 đợt 201: ~9,2 — khớp);
    biên trên ~20,7 (nội suy 20→22). **Phạm vi hiệu lực [10, 20] ĐỨNG.**
    Các ca CHƯA ở σ≤7 và σ≥22 đều KHÔNG liên quan cap (m=1 suốt, fixed
    cũng CHƯA y hệt) — lỗi hiệu chuẩn thước, đúng kết luận đợt 200/201.
  - **BBB pan:** U đáy σ=10 (0,052); **KHÔNG có biên dưới trong [5, 25]**
    (σ=5 vẫn ĐẠT 0,101 — R_truth lớn ~5 nên cùng |ΔR| vẫn qua bar); biên
    trên cap 1,05 ≈ **23,7** (nội suy 22→25: 0,145 → 0,154 cắt bar tại
    ~23,7), so với cap 1,12 chỉ ~21,2 — **cap 1,05 mở rộng biên trên
    +2,5σ trên nội dung chuyển động.**
  - **Sintel w0s:** U đáy σ=12 (0,034); **ĐẠT CẢ 9 ĐIỂM σ** (tệ nhất
    σ=25: 0,147, sát bar 0,003); biên trên ngoại suy ~25,3 (nội suy
    22→25: 0,120 → 0,147, độ dốc ~0,009/σ — **NGOẠI SUY, chưa đo, không
    dùng làm kết luận**; cần đo σ=26–28 mới ghim được).
  - **Sintel w4s:** KHÔNG phải U trơn — đường cong gồ ghề theo khung
    (0,104 → 0,142 → **0,156 CHƯA ở σ=10** → 0,129 → 0,128 → 0,132 →
    0,126 → 0,142 → 0,167 CHƯA ở σ=25). Ở nội dung chuyển động mạnh,
    R_rel từng khung bị chi phối bởi ước lượng σ̂/M từng khung hơn là σ
    danh nghĩa (xem §4: σ=10 mà σ̂ f11 = 12,59).
- **Biên σ trên footage thật — kết luận:** [10, 20] đứng làm phạm vi hiệu
  lực chung (BBB w0s là trường hợp xấu nhất, biên cứng [~9,2; ~20,7]);
  nội dung chuyển động (pan) và R_truth nhỏ (Sintel w0s) nới biên trên ra
  tới ~23,7 / ~25,3; nội dung chuyển động mạnh (w4s) có thể CHƯA ngay
  trong [10, 20] do 1 khung ngược dấu (§4) — đó là giới hạn của thước
  R_rel worst-frame, không phải của cap.

## §4. Trường hợp ngược: Sintel w4s σ=10 — cap 1,05 làm TỆ HƠN (ghi trung thực)

- w4s σ=10: cap 1,12 → **0,140 ĐẠT**; cap 1,05 → **0,156 CHƯA**; fixed →
  0,165 CHƯA. Chỉ 1 khung quyết định: f11 (f3/f7 đều ĐẠT ở mọi cap).
- Cơ chế NGƯỢC DẤU với ca lật boost đợt 201: f11 có **R_out > R_truth**
  (cap 1,12: R_out 5,163 vs R_truth 4,531, |ΔR| 0,633; cap 1,05: 5,237,
  |ΔR| 0,706; fixed: 5,277, |ΔR| 0,746) — tức preview THIẾU làm mịn so
  với truth ở khung này, và hạ m (giảm α_eff 0,308 → 0,288) càng đẩy
  R_out ra xa truth. Trong khi các ca lật đợt 201 đều là R_out < R_truth
  (thừa làm mịn), nơi hạ m giúp ích. **Cap 1,05 sửa được lỗi thừa-mịn
  nhưng làm nặng thêm lỗi thiếu-mịn — cùng một khung có thể lật theo cả
  hai hướng tùy α.**
- Mức độ: chỉ vượt bar **0,006** (0,156 vs 0,15), 1 khung trong 3 khung đo,
  MAD của nhóm vẫn tốt nhất trong các cap (4,112 vs 4,132 cap cũ, gap vs
  tap −0,151 — lợi ích adapt còn nguyên). Đây là nhiễu mức khung, không
  phải hồi quy hệ thống: cap 1,05 thắng ròng 29 vs 27 trên 36 nhóm.
- Nợ: chưa có cách phân biệt trước hai hướng lật (cần ước lượng dấu của
  R_out − R_truth theo σ̂/M từng khung — P2-203 hoặc P4-203; không chặn
  ship cap 1,05 vì verdict ròng vẫn tốt hơn và N10/N5b đều ĐẠT).

## §5. Số đo kiểm chứng

- `npx tsc --noEmit` (apps/web): **1 lỗi — KHÔNG phải của P2.**
  `src/lib/reverseAudio202P3.test.ts(124,16): error TS6133: 't' is declared
  but its value is never read` — file test của P3-202, đang viết dở. P2
  không sửa file của luồng khác; mọi file P2 chạm tới đều sạch (chỉ có
  đúng 1 lỗi này trong toàn bộ output tsc). Ghi lại để P3-202 dọn.
- Test đơn vị (bundle esbuild mới từ cây hiện tại, mẫu đợt 201 + thêm 4
  file harness 198–201): enhance **169/169 PASS** (11 file:
  21+16+9+7+10+8+14+14+10+11+49); media **59/59 PASS** (6 file:
  captureThumb 2, blobPrefetch 25, retryPlay95W2 7, retryPlay96X3 7,
  stallWatchdog 9, fpsProbe 9); harness 198–201 **107/107 PASS** (24+26+
  28+29). Tổng **335/335, 0 fail**. Thêm kiểm tra (không sửa):
  `parityHarness202.test.ts` của P4-202 **29/29 PASS** (đã kỳ vọng cap
  1,05 từ trước). Tổng cộng đã chạy **364 test, 0 fail**.
- `npx vite build`: **PASS 11,42 s** (exit 0; bundle mới
  `dist/assets/index-FqY8HE0R.js`, md5 1991ebec01d263ff26ef040c926b16e6 —
  hash đổi so với DTO4eCbF đợt 201 vì enhancePreview.ts đã đổi, đúng kỳ
  vọng).
- Probe: `probe-202-p2.mjs` chạy exit 0 (~334 s, 36 nhóm + N10/N5b);
  log + JSON đầy đủ trong `hidden_files/round202-p2/`.

## §6. Phối hợp T4 (đo yên #70) — 0 VI PHẠM

- P2 kiểm file `hidden_files/round202-t4/W1-ACTIVE` (+ `windows.md`) TRƯỚC
  MỖI lệnh nặng, đúng brief: kiểm 20:44:46Z (trước probe) — không có;
  20:45:13Z (trước chạy lại probe) — không có; 20:52:08Z (trước tsc) —
  không có; 20:53:25Z (trước test) — không có; 20:55:36Z (trước chạy lại
  test) — không có; 20:56:54Z (trước vite build) — không có. Suốt phiên
  P2, thư mục round202-t4 chưa từng xuất hiện file W1-ACTIVE hay
  windows.md (T4-202 vẫn đang setup lúc P2 chạy các lệnh nặng).
- Probe chạy 20:45–~20:51Z; tsc 20:52Z; test 20:53–20:56Z; vite 20:57Z —
  tất cả đều ngoài cửa sổ yên (không có cửa sổ nào mở trong khoảng này
  theo kiểm tra trên). **P2 tự báo: 0 chồng lấn W1 đợt này** (khác đợt
  201, nơi P2 vi phạm nhẹ vì tin windows.md ghi CHỜ GATE).

## §7. Hạn chế + nợ (trung thực)

1. w4s σ=10 là bằng chứng cap 1,05 không tốt hơn mọi khung (xem §4) —
   verdict ròng vẫn tốt hơn (29 vs 27), nhưng cần theo dõi hướng lật
   ngược dấu ở các đợt sau.
2. Biên σ nội suy tuyến tính giữa 2 điểm đo gần nhất — R_rel(σ) không
   hoàn toàn tuyến tính (nhất là w4s gồ ghề), nên [~9,2; ~20,7] / ~23,7
   là ước lượng ±0,3–0,5, không phải số đo trực tiếp từng 0,1 σ.
3. Sintel w0s biên trên ~25,3 là NGOẠI SUY (chưa đo σ=26–28) — không dùng
   làm kết luận; nợ đo thêm nếu parent muốn ghim biên trên cho nội dung
   R_truth nhỏ.
4. Sintel resample fps=30 cho pipeline (như đợt 200/201) — khung resample
   không phải khung gốc; ảnh hưởng nhỏ, ghi nhận trung thực.
5. Verdict N10/N5b chính thức thuộc harness P4-202 (sim P2 chỉ tái tạo mô
   hình pixel; đã khớp P4-198/P4-200/P4-201 từng số nên sim đáng tin —
   P4-202 đã tự kỳ vọng cap 1,05 trong test của mình).
6. tsc còn 1 lỗi ở file test P3-202 (xem §5) — không thuộc phạm vi P2.
7. Nợ chưa đo: clip hành động nhanh tự nhiên (thể thao, xe chạy) vẫn
   thiếu — Sintel w4s là phim điện ảnh, chưa phải footage thể thao thật;
   nợ từ đợt 200 §9.4, vẫn mở.

## §8. File stage (batch phase9-round202-p2-enhance.txt)

- `apps/web/src/lib/enhancePreview.ts`
- `apps/web/src/components/enhance/enhancePreview91P2.test.ts`
- `apps/web/src/lib/parityHarness198.test.ts`
- `apps/web/src/lib/parityHarness199.test.ts`
- `apps/web/src/lib/parityHarness200.test.ts`
- `apps/web/src/lib/parityHarness201.test.ts`
- `docs/PHASE9_ROUND202_P2_ENHANCE_LIMITS.md`
- KHÔNG stage binary/mp4/yuv/rgb (chỉ ở hidden_files/round202-p2/).

## §9. Thư mục làm việc + dữ liệu cho P4-202

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round202-p2/`:
probe-202-p2.mjs/.json/.log (N10/N5b 4 biến thể + quét σ 36 nhóm × 3 biến
thể, kèm M/σ̂/α từng khung), run-202-p2-tests.sh + tests-202.log,
tsc-202.log, vite-202.log, test-bundle/ (22 bundle test chạy lại từ cây
hiện tại), `*-clean.rgb/.yuv`, `*-inter.yuv`, `*-truth.yuv`, `*-noisy.rgb/
.yuv` trung gian (không stage). Nguồn footage tái dùng từ đợt 199/200
(BBB `bbb-w0s-clean.rgb`/`bbb-pan-clean.rgb`; Sintel CC-BY 3.0
`sintel-w0s/w4s-clean.rgb`).
**Cho P4-202:** cap ship nay là **1,05** (`DENOISE_MOTION_MULTIPLIER_MAX`,
map tuyến tính giữ nguyên, neo cao map 1,08 bị kẹp xuống 1,05); sim N10
mới 6,102/0,074 ĐẠT, N5b 6,810/0,109 ĐẠT (khớp kỳ vọng test harness202);
ca cần chú ý: Sintel w4s σ=10 f11 ngược dấu (R_out > R_truth) — cap 1,05
làm tệ hơn 0,016, vượt bar 0,006.

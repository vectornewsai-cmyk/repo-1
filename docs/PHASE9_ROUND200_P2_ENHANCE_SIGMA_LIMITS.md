# Đợt 200 P2 — Enhance parity: R_rel phụ thuộc σ (quét σ) + mẫu estimator trên footage thật thứ hai (Sintel)

**Nhiệm vụ (quyết (a1)-199):** (1) điều tra R_rel phụ thuộc σ cùng P4-200 —
quét σ trên cùng fixture/nội dung, đo R_rel của tap/w0,8 — bar 0,15 có đạt
được ở σ thấp không, hay thước/bar/fixture cần đổi? Kết luận bằng đề xuất,
KHÔNG tự đổi bar; (2) thêm mẫu estimator trên footage thật — footage thứ
hai + thêm khung.
**Verdict: R_rel PHỤ THUỘC σ THEO HÌNH CHỮ U — bar 0,15 chỉ đạt được
trong một DẢI σ, không phải mọi σ. Trên nội dung nhẹ: ĐẠT ở σ = 10/15/20,
CHƯA ĐẠT ở σ = 5/7/25 (tap cũng CHƯA ĐẠT y hệt ở cả ba điểm — thước chưa
hiệu chuẩn ngoài dải, KHÔNG phải lỗi estimator). Đề xuất chính: GIỮ bar
0,15, GIỮ fixture σ = 15, GHI RÕ phạm vi hiệu lực σ ∈ [10, 20] (xem §5).
PHÁT HIỆN MỚI: boost thích nghi LẬT verdict R_rel trên nội dung chuyển
động nhanh (Sintel w4s/w8s σ = 15 + pan σ = 25) — fixed m = 1 ĐẠT trong
cả 3 trường hợp (xem §4). KHÔNG ĐỔI CODE SẢN PHẨM đợt này.**

## §0. Tóm tắt số đo

| Nhóm | σ | MAD adapt / tap | R_rel adapt (worst) | R_rel fixed m = 1 | Verdict |
|---|---|---|---|---|---|
| w0s (BBB nhẹ) | 5 | 5,237 / 5,333 | **0,245** | 0,245 | CHƯA ĐẠT |
| w0s | 7 | 5,332 / 5,422 | **0,201** | 0,201 | CHƯA ĐẠT |
| w0s | 10 | 5,676 / 5,759 | **0,134** | 0,134 | ĐẠT |
| w0s | 15 | 6,547 / 6,624 | **0,119** | 0,119 | ĐẠT |
| w0s | 20 | 7,692 / 7,771 | **0,147** | 0,145 | ĐẠT (sát bar) |
| w0s | 25 | 9,022 / 9,114 | **0,168** | 0,165 | CHƯA ĐẠT |
| pan thật | 5 | 5,814 / 5,859 | **0,114** | 0,085 | ĐẠT |
| pan thật | 10 | 6,030 / 6,135 | **0,069** | 0,040 | ĐẠT |
| pan thật | 15 | 6,695 / 6,832 | **0,105** | 0,080 | ĐẠT |
| pan thật | 20 | 7,779 / 7,919 | **0,144** | 0,125 | ĐẠT (sát bar) |
| pan thật | 25 | 9,149 / 9,290 | **0,162** | 0,149 | CHƯA ĐẠT (adapt) / ĐẠT (fixed) |
| Sintel w0s | 15 | 4,863 / 4,977 | **0,071** | 0,058 | ĐẠT |
| Sintel w2s | 15 | 5,338 / 5,427 | **0,102** | 0,065 | ĐẠT |
| Sintel w4s | 15 | 4,795 / 4,923 | **0,171** | 0,110 | CHƯA ĐẠT (adapt) / ĐẠT (fixed) |
| Sintel w6s | 15 | 4,916 / 5,035 | **0,123** | 0,084 | ĐẠT |
| Sintel w8s | 15 | 5,068 / 5,176 | **0,162** | 0,126 | CHƯA ĐẠT (adapt) / ĐẠT (fixed) |
| Sintel w0s | 5 | 3,857 / 3,988 | **0,086** | 0,086 | ĐẠT |
| Sintel w6s | 5 | 3,478 / 3,647 | **0,023** | 0,076 | ĐẠT |
| tsc / test đơn vị | — | `tsc --noEmit` 0 lỗi; enhance **169/169**, media **59/59** | — | — | — |

## §1. Nguồn quyết + phương pháp

- Aggregate 199 §14.2 (a1) (bản đã KHÔI PHỤC 86.880 B; bản 96.222 B là
  GIẢ MẠO — KHÔNG dùng); `PHASE9_ROUND199_P2_ENHANCE_FOOTAGE_LIMITS.md`
  §§3–5; `PHASE9_ROUND198_P2_ENHANCE_ALPHA_LIMITS.md` §§2–3.
- Pipeline Y HỆT fixture P4 / đợt 199: khung 320×180, 30 khung progressive
  sạch → nhiễu Gauss σ (seed 19100+f, đúng fixture) → interlace tff
  lowpass = 0 → 15 khung; truth = yadif + hqdn3d s = 0,5; đo khung 3/7/11.
  M = C5b_box; m = map tuyến tính ship (neo 7,194 → 1,0; 13,803 → 1,08;
  kẹp [1,0; 1,12]); α = denoiseBlendAlpha(0,5) × adaptK(σ̂) × warmup × m.
- Mở rộng so với đợt 199: ghi rTruth / rOut / rOutTap / |ΔR| / σ̂ / α từng
  khung đo (cơ chế §5-199) — xem `probe-200-p2a.json` /
  `probe-200-p2b.json` trong `hidden_files/round200-p2/`.
- Footage 2: **Sintel 10 s, 1280×720 24fps, CC-BY 3.0 Blender Foundation**
  (`test-videos.co.uk`, 1.047.954 B, `sintel-10s.mp4`) — resample fps = 30
  để giữ pipeline y hệt; 5 cửa sổ 1 s (t = 0/2/4/6/8 s), 30 khung 320×180
  mỗi cửa sổ. Tears of Steel cùng nguồn trả 404 nên không dùng.

## §2. Quét σ trên w0s (nội dung nhẹ BBB) — R_rel hình chữ U, bar chỉ đạt trong dải

| σ | meanM | σ̂ (3/7/11) | α hiệu dụng | R_truth | R_out | \|ΔR\| | R_rel worst |
|---|---|---|---|---|---|---|---|
| 5 | 2,392 | 8,61 / 8,58 / 8,57 | 0,463–0,465 | 7,165 / 6,877 / 6,830 | 5,411 / 5,392 / 5,375 | 1,456–1,754 | **0,245** |
| 7 | 3,077 | 9,30 / 9,27 / 9,27 | 0,420–0,422 | 7,265 / 7,069 / 7,025 | 5,806 / 5,805 / 5,789 | 1,236–1,459 | **0,201** |
| 10 | 4,153 | 10,54 / 10,50 / 10,52 | 0,343–0,345 | 7,705 / 7,600 / 7,581 | 6,674 / 6,663 / 6,643 | 0,938–1,031 | **0,134** |
| 15 | 6,005 | 12,95 / 12,91 / 12,96 | 0,267–0,268 | 9,198 / 9,185 / 9,110 | 8,100 / 8,110 / 8,079 | 1,031–1,099 | **0,119** |
| 20 | 7,859 | 15,58 / 15,55 / 15,60 | 0,211–0,214 | 11,374 / 11,349 / 11,254 | 9,705 / 9,706 / 9,668 | 1,587–1,669 | **0,147** |
| 25 | 9,686 | 18,30 / 18,26 / 18,33 | 0,152–0,159 | 13,889 / 13,823 / 13,740 | 11,552 / 11,555 / 11,502 | 2,239–2,336 | **0,168** |

- **R_rel(σ) chữ U rõ rệt:** 0,245 → 0,201 → 0,134 → 0,119 → 0,147 →
  0,168; đáy ở σ ≈ 10–15 = đúng σ hiệu chuẩn của bảng adaptive-K.
  |ΔR| cũng chữ U: ~1,5 → ~1,3 → ~1,0 → ~1,06 → ~1,63 → ~2,29.
- **Cơ chế (đo trực tiếp, không suy đoán):** α(σ̂) giảm dần theo σ̂
  (0,465 → 0,42 → 0,344 → 0,267 → 0,213 → 0,155) trong khi R_truth
  TĂNG theo σ (7,0 → 7,2 → 7,6 → 9,2 → 11,3 → 13,9 — truth hqdn3d
  s = 0,5 cố định để lại càng nhiều combing dư khi nhiễu càng lớn).
  Ở σ thấp α quá cao → làm mờ quá mức so với truth (R_out tụt sâu dưới
  R_truth); ở σ cao α quá thấp + R_truth phồng nhanh hơn R_out → |ΔR|
  lại lớn. |ΔR| nhỏ nhất đúng quanh σ hiệu chuẩn 10–15.
- **Tap FAIL y hệt ở cả ba điểm CHƯA ĐẠT** (σ = 5: 0,246; σ = 7: ~0,20;
  σ = 25: 0,165) — và adapt = fixed ở σ = 5/7 (m = 1,0 suốt). Đây là
  vấn đề HIỆU CHUẨN THƯỚC (bar gắn với σ = 15), KHÔNG phải lỗi
  estimator hay lỗi α thích nghi: không phương pháp nào trong họ này
  đạt được bar ở σ = 5/7/25 trên nội dung nhẹ.
- **Biên nội suy:** biên dưới nằm giữa σ = 7 (0,201) và σ = 10 (0,134)
  → ~σ 8–9; biên trên nằm giữa σ = 20 (0,147, biên chỉ 0,003) và
  σ = 25 (0,168) → ~σ 21–22. Phạm vi bar đạt được trên nội dung nhẹ:
  **σ ∈ ~[8, ~22]**, an toàn ghi σ ∈ [10, 20].
- **Điểm mới σ = 25:** meanM 9,686, **14/14 khung M rơi vào vùng dao sắc
  [9; 10,5]** — ở σ cao, chính sàn nhiễu đẩy M vào sát vách α = 0,5
  (m = 1,031–1,032, vừa trên ngưỡng lật 1,0309). Estimator mất khả năng
  phân biệt chuyển động/thật ở σ = 25 trên nội dung tĩnh-nhẹ — thêm một
  lý do không dùng thước này ngoài dải.

## §3. Quét σ trên pan thật (chuyển động mạnh) — bar giữ tới σ = 20, gãy ở σ = 25 do chính boost

- σ = 5: meanM 14,748, m 1,083–1,100, MAD 5,814, R_rel **0,114** ĐẠT
  (fixed 5,808 / 0,085); |ΔR| 0,526–0,546, R_truth 4,795–5,533.
- σ = 10: meanM 15,268, m 1,090–1,107, MAD 6,030, R_rel **0,069** ĐẠT
  (fixed 6,077 / 0,040); |ΔR| 0,334–0,452.
- σ = 15: meanM 16,025, m 1,100–1,116, MAD 6,695, R_rel **0,105** ĐẠT
  (fixed 6,767 / 0,080); |ΔR| 0,791–0,876.
- σ = 20: meanM 16,958, m 1,111–1,120, MAD 7,779, R_rel **0,144** ĐẠT
  (fixed 7,847 / 0,125) — biên chỉ 0,006; |ΔR| 1,447–1,492.
- σ = 25: meanM 17,989, m 1,12 cả 3 khung, MAD 9,149, R_rel **0,162
  CHƯA ĐẠT** (fixed 9,220 / **0,149 ĐẠT** — biên 0,001); |ΔR|
  2,036–2,101, R_truth 12,877–13,251. **Boost chính là thứ lật verdict
  ở σ = 25** (α_eff 0,133–0,150 × m 1,12 vẫn làm R_out tụt thêm
  ~0,17–0,19 so với fixed — đủ để vượt bar khi R_truth lớn).
- Kết luận phần này: trên nội dung chuyển động mạnh, bar giữ được tới
  σ = 20; ở σ = 25 cả hai đường đều sát bar và boost là phía gây hại.
  R_rel(σ) trên pan cũng chữ U (0,114 → 0,069 → 0,105 → 0,144 → 0,162),
  đáy ở σ ≈ 10.

## §4. Sintel — footage thật thứ hai: estimator thấy chuyển động thật, NHƯNG boost lật 2/5 cửa sổ

- **w0s σ = 15: ĐẠT 0,071** (meanM 7,901; M_clean 6,121 / 5,663 /
  2,829; σ̂ 9,49–9,74; m 1,028 / 1,020 / 1,0; MAD 4,863 vs tap 4,977;
  |ΔR| 0,105–0,430). **3/14 khung M trong vùng dao sắc [9; 10,5]** —
  vùng dao sắc CÓ xảy ra trên footage thật (BBB: 0/70 đợt 199), nhưng
  verdict vẫn ĐẠT.
- **w2s σ = 15: ĐẠT 0,102** (meanM 19,021, max 69,838; M_clean f7 =
  69,487 — **cắt cảnh trong cửa sổ**; σ̂ 9,71–11,82; m 1,12 / 1,12 /
  1,064; MAD 5,338 vs tap 5,427; 2/14 khung dao sắc). Estimator qua
  cắt cảnh vẫn cho verdict ĐẠT.
- **w4s σ = 15: CHƯA ĐẠT 0,171 (adapt) — fixed ĐẠT 0,110.** meanM
  31,196 (11,17–93,42); M_clean 32,43 / 18,27 / 25,95; m = 1,12 cả 3
  khung (kẹp trên); σ̂ f3 = 8,86 → α0 0,447 → **α_eff = 0,501 — vừa
  vượt vách α = 0,5** (tiền lệ đợt 198); f3 R_rel 0,171 (|ΔR| 0,959
  trên R_truth 5,616); f7 0,045, f11 0,062 — verdict do ĐÚNG 1 khung
  (f3) quyết định. MAD adapt 4,795 vẫn tốt hơn tap 4,923 — chỉ R_rel
  lật.
- **w6s σ = 15: ĐẠT 0,123** (meanM 17,751; m 1,12 / 1,111 / 1,088;
  MAD 4,916 vs tap 5,035; f3 0,123, f7 0,002, f11 0,005).
- **w8s σ = 15: CHƯA ĐẠT 0,162 (adapt) — fixed ĐẠT 0,126.** meanM
  27,510 (14,22–63,16); M_clean 40,77 / 33,24 / 62,71; m = 1,12 cả 3
  khung; f3 R_rel 0,162 (α_eff 0,450 — DƯỚI vách 0,5; |ΔR| 1,076 trên
  R_truth 6,654) — nên vách 0,5 KHÔNG phải toàn bộ câu chuyện: boost
  tối đa trên nội dung R_truth nhỏ (~6) cũng đủ lật R_rel; f7 0,001,
  f11 0,080.
- **Sintel σ = 5 (2 cửa sổ nhẹ nhất theo meanM σ = 15: w0s 7,901,
  w6s 17,751): cả hai ĐẠT** — w0s 0,086 (R_truth chỉ 3,602–3,906,
  |ΔR| 0,027–0,310; σ̂ 4,58–4,96, α = 0,485); w6s 0,023 (m 1,12 /
  1,085 / 1,052; MAD 3,478 vs tap 3,647). **Lỗi σ = 5 KHÔNG phổ quát:**
  BBB w0s fail ở σ = 5 vì R_truth lớn (~7, nội dung nhiều chi tiết);
  Sintel w0s pass vì R_truth nhỏ (~3,6–3,9). Thước R_rel = |ΔR| /
  R_truth nên cùng |ΔR| ~1,5 sẽ fail trên nội dung R_truth lớn và pass
  trên nội dung R_truth nhỏ.
- Tổng mẫu estimator trên footage thật sau đợt này: BBB 5 cửa sổ +
  pan + tĩnh (đợt 199) + **Sintel 5 cửa sổ σ = 15 + 2 cửa sổ σ = 5**;
  ĐẠT 8/10 nhóm mới (w4s/w8s là 2 nhóm boost-lật).

## §5. Đề xuất cho parent (KHÔNG tự đổi bar — parent quyết)

- **(ĐỀ XUẤT CHÍNH) GIỮ bar R_rel 0,15, GIỮ fixture σ = 15, GHI RÕ
  phạm vi hiệu lực:** verdict R_rel chỉ có ý nghĩa trong σ ∈ [10, 20]
  trên nội dung nhẹ (biên đo được ~[8, ~22]); ngoài phạm vi này thước
  chưa hiệu chuẩn — tap cũng fail nên không phải lỗi sản phẩm, và
  verdict ở đó không dùng để kết luận ĐẠT/CHƯA ĐẠT. Đây là thay đổi
  quy ước/tài liệu, KHÔNG đổi code, KHÔNG đổi bar, KHÔNG đổi fixture.
  Căn cứ: 6 điểm σ trên w0s + 5 điểm trên pan, tap fail đồng thời ở
  mọi điểm ngoài dải, |ΔR| chữ U với đáy đúng σ hiệu chuẩn.
- **(DỰ PHÒNG) Nếu parent muốn verdict có ý nghĩa ở mọi σ:** bar động
  theo σ (vd 0,25 ở σ ≤ 7) hoặc thước |ΔR| tuyệt đối, hoặc R_rel có
  sàn R_truth — cần P4-200 thiết kế số cụ thể; P2 đợt này KHÔNG đề
  xuất con số (chưa đủ mẫu để hiệu chuẩn bar động).
- **(CẢNH BÁO SHIP) Boost thích nghi có thể lật R_rel trên nội dung
  chuyển động nhanh:** 3 bằng chứng độc lập — Sintel w4s (0,171 vs
  fixed 0,110), Sintel w8s (0,162 vs 0,126), pan σ = 25 (0,162 vs
  0,149) — đều ở m kẹp trên 1,12, đều chỉ do 1 khung f3, MAD vẫn tốt
  hơn tap. N10/N5b (harness σ = 15, fixture) KHÔNG bị ảnh hưởng.
  Đề xuất nợ 201: khảo sát m-cap theo σ̂ / M (vd hạ kẹp trên khi
  σ̂ thấp hoặc M rất lớn); **KHÔNG đổi code đợt này** — mới 3 mẫu,
  cần P4-200 xác nhận độc lập + thêm mẫu trước khi sửa luật ship.

## §6. Đối chiếu chéo với đợt 199 (tái hiện đúng từng số)

- w0s σ = 5: **5,237 / 0,245 = đúng đợt 199** (tap 0,246).
- w0s σ = 15: 6,547 / 0,119 — trong khoảng 5 cửa sổ đợt 199
  (MAD 6,517–6,551; R_rel 0,116–0,121).
- Pan σ = 5: **5,814 / 0,114 = đúng đợt 199**; pan σ = 15: **6,695 /
  0,105 = đúng đợt 199**. Seed 19100+f + pipeline y hệt → sim ổn định
  tuyệt đối giữa các đợt.
- N10/N5b sim: KHÔNG chạy lại đợt này (nhiệm vụ là quét σ + footage
  mới; verdict N10/N5b chính thức thuộc harness P4-200; sim P2 đợt 199
  đã khớp P4-198 từng số).

## §7. Code đã đổi

- **KHÔNG ĐỔI code sản phẩm đợt này** (chỉ đo + báo cáo, đúng brief).
  `enhancePreview.ts`, `preview.tsx`, test giữ nguyên đợt 199.
- Probe + bundle đối chiếu nằm ở `hidden_files/round200-p2/` (không stage).

## §8. Số đo kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- Test đơn vị (bundle esbuild mới từ cây hiện tại, mẫu đợt 199):
  enhance **169/169 PASS** (11 file: 21+16+7+10+8+14+10+11+49+9+14);
  media **59/59 PASS** (6 file: captureThumb 2, blobPrefetch 25,
  retryPlay95W2 7, retryPlay96X3 7, stallWatchdog 9, fpsProbe 9).
  Tổng **228/228, 0 fail**. Lưu ý kỹ thuật: 4 file media dùng top-level
  await nên bundle `--format=esm` (.mjs), còn lại `--format=cjs`.
- vite build: KHÔNG chạy (không đụng app — không đổi code).
- Phối hợp T4 (đo yên #68): toàn bộ workload nặng (probe σ, tsc, test)
  chạy khi W1 còn **CHỜ GATE — chưa mở** (gate0 chưa đạt, poller chờ
  T56 repair; kiểm `windows.md` trước mỗi bước nặng: 11:39Z, 11:41Z,
  ~11:47Z, ~11:52Z — 0 cửa sổ nào mở trong lúc P2 làm việc nặng).
  Không ghi file, không chạy Chrome/vite trong cửa sổ yên (không có
  cửa sổ nào mở).

## §9. Hạn chế + nợ (trung thực)

1. Biên σ nội suy, chưa ghim chính xác: cần σ = 8/9 và σ = 22 nếu parent
   muốn biên cứng (nợ 201, rẻ — mỗi điểm ~15 s).
2. Boost-lật mới 3 mẫu (Sintel w4s/w8s, pan σ = 25), đều do 1 khung f3
   — chưa đủ để sửa luật ship; cần P4-200 xác nhận + thêm mẫu.
3. Sintel w2s có cắt cảnh trong cửa sổ (M_clean f7 69,5) — estimator
   qua cắt cảnh chưa có mẫu riêng; w2s vẫn ĐẠT nhưng n = 1.
4. Clip hành động nhanh tự nhiên (thể thao, xe chạy) vẫn thiếu — Sintel
   là phim điện ảnh, chuyển động nhanh nhưng không phải footage hành
   động thật.
5. Sintel 24fps phải resample fps = 30 cho pipeline — khung resample
   không phải khung gốc 24fps; ảnh hưởng nhỏ (đo trên khung đã resample
   cả clean lẫn noisy), ghi nhận trung thực.
6. Verdict N10/N5b chính thức thuộc harness P4-200 (sim P2 chỉ tái tạo
   mô hình pixel; đã khớp P4-198 từng số nên sim đáng tin).

## §10. File stage (batch phase9-round200-p2-enhance-sigma.txt)

- `docs/PHASE9_ROUND200_P2_ENHANCE_SIGMA_LIMITS.md`
- KHÔNG stage binary/mp4/yuv/rgb (chỉ ở hidden_files/round200-p2/).

## §11. Thư mục làm việc

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-p2/`:
probe-200-p2a.mjs/.json/.log (quét σ w0s/pan + Sintel),
probe-200-p2b.mjs/.json/.log (biên σ = 7/25),
sintel-10s.mp4 (CC-BY 3.0 Blender Foundation),
sintel-*/w0s-*/pan-* (.rgb/.yuv trung gian, không stage),
test-bundle/ (17 bundle test chạy lại từ cây hiện tại).

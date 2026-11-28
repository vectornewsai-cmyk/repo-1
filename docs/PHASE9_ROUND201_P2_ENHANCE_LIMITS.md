# Đợt 201 P2 — Enhance parity: khảo sát m-cap theo σ̂/M + ghim biên σ=8/9 và σ=22

**Nhiệm vụ (quyết (a1)-200 + cảnh báo boost-lật §5-200):** (1) với mỗi mức
chuyển động M (Sintel w0s/w4s/w8s + BBB pan), thử m-cap 1,05/1,08/1,10 để
tìm cap sao cho R_rel adapt ≤ bar 0,15 mà không mất lợi ích adapt; đề xuất
công thức m-cap theo σ̂/M hoặc kết luận m-cap cố định là đủ; (2) ghim biên
σ=8/9 và σ=22 trên BBB + Sintel, xác định biên cứng của phạm vi hiệu lực.
**Verdict: m-cap CỐ ĐỊNH 1,05 LÀ ĐỦ — sửa được mọi ca lật mà cap có thể
sửa, giữ lợi ích adapt ở mọi nhóm; công thức theo σ̂ KHÔNG đủ, theo M
KHÔNG đủ như đã thử. Biên cứng đo được trên BBB w0s: σ ∈ [~9,2; ~20,7] —
phạm vi hiệu lực [10, 20] ĐỨNG. KHÔNG ĐỔI CODE SẢN PHẨM đợt này (đề xuất
đổi 1 hằng số, chờ P4-201 xác nhận độc lập + parent quyết).**

## §0. Tóm tắt số đo

### A. m-cap (bar 0,15; σ=15 trừ khi ghi khác; cap 1,12 = ship hiện tại)

| Nhóm | cap 1,12 | cap 1,10 | cap 1,08 | cap 1,05 | fixed m=1 | Fσ | FM |
|---|---|---|---|---|---|---|---|
| Sintel w0s σ=15 | 0,071 ĐẠT | 0,071 | 0,071 | 0,071 | 0,058 | 0,071 | 0,071 |
| Sintel w4s σ=15 | **0,171 CHƯA** | 0,135 ĐẠT | 0,134 | 0,128 | 0,110 | 0,128 ĐẠT | 0,128 ĐẠT |
| Sintel w8s σ=15 | **0,162 CHƯA** | 0,159 CHƯA | 0,152 CHƯA | **0,142 ĐẠT** | 0,126 | 0,142 ĐẠT | 0,142 ĐẠT |
| pan σ=15 | 0,105 ĐẠT | 0,105 | 0,099 | 0,097 | 0,080 | 0,105 | 0,105 |
| pan σ=25 | **0,162 CHƯA** | 0,161 | 0,158 | 0,154 CHƯA | **0,149 ĐẠT** | 0,162 | 0,162 |

- Fσ = cap theo σ̂ từng khung (σ̂<10 → 1,05; <12 → 1,08; else 1,12).
  FM = cap theo M từng khung (M>25 → 1,05; >20 → 1,08; else 1,12).
- **Chỉ cap 1,05 sửa được cả 2 ca lật σ=15** (1,10 sửa w4s nhưng w8s còn
  0,159; 1,08 sửa w4s nhưng w8s còn 0,152). Ngưỡng sắc: w8s f3 cần
  m ≲ 1,065 (nội suy 1,08→0,152 / 1,05→0,142, cắt bar 0,15 tại ~1,065).
- **Lợi ích adapt KHÔNG mất ở cap 1,05** — MAD adapt vẫn tốt hơn tap ở
  mọi nhóm (gap adapt−tap): w4s −0,068 (ship −0,128), w8s −0,107 (ship
  −0,108), pan σ=15 −0,112 (ship −0,137), pan σ=25 −0,096 (ship −0,141).
  Mất nhiều nhất ở w4s (0,060) nhưng vẫn hơn tap rõ rệt.
- **pan σ=25: KHÔNG cap nào sửa được** (1,05 → 0,154) — chỉ fixed m=1
  ĐẠT 0,149 (sát bar 0,001). σ=25 ngoài phạm vi hiệu lực nên đây là lỗi
  hiệu chuẩn thước, không phải lỗi boost (xem §3).

### B. Ghim biên (adapt m kẹp 1,12 + fixed; tap R_rel trong ngoặc)

| Nhóm | σ=8 | σ=9 | σ=22 |
|---|---|---|---|
| BBB w0s | **0,179 CHƯA** (tap 0,179) | **0,155 CHƯA** (tap 0,156) | **0,156 CHƯA** (tap 0,155) |
| BBB pan | 0,067 ĐẠT (tap 0,036) | 0,065 ĐẠT (tap 0,037) | **0,154 CHƯA** / fixed 0,138 ĐẠT |
| Sintel w0s | 0,103 ĐẠT (tap 0,103) | 0,089 ĐẠT (tap 0,089) | 0,120 ĐẠT (tap 0,109) |
| Sintel w4s σ=22 (thêm) | — | — | **0,163 CHƯA** / fixed 0,133 ĐẠT |

- **Biên cứng trên BBB w0s: [~9,2; ~20,7]** (nội suy từ đợt 200: σ=9
  0,155 → σ=10 0,134 cắt bar tại ~9,2; σ=20 0,147 → σ=22 0,156 cắt bar
  tại ~20,7). Phạm vi hiệu lực [10, 20] ĐỨNG, biên an toàn ~0,8/0,7.
- Trên Sintel w0s bar giữ ở cả 3 điểm biên (R_truth nhỏ 3,9–8,8) — biên
  phụ thuộc nội dung, đúng kết luận đợt 200.
- **Boost lật cả ở σ=22** (pan 0,154, w4s 0,163 — fixed đều ĐẠT):
  cap 1,05 sửa được cả hai (pan → 0,145; w4s → 0,142); Fσ KHÔNG sửa
  được ca nào (σ̂ ở đó 12–18, không chạm ngưỡng σ̂<10); FM sửa được
  w4s nhưng KHÔNG sửa được pan σ=22 (M ~17,4 < 20).

## §1. Nguồn quyết + phương pháp

- Aggregate 200 §14.2 (a1) + `PHASE9_ROUND200_P2_ENHANCE_SIGMA_LIMITS.md`
  §§0/4/5 (cảnh báo boost-lật: Sintel w4s 0,171, w8s 0,162, pan σ=25
  0,162 — đều m kẹp trên 1,12, đều chỉ do 1 khung f3).
- Pipeline Y HỆT đợt 200: khung 320×180, 30 khung progressive sạch →
  nhiễu Gauss σ (seed 19100+f) → interlace tff lowpass=0 → 15 khung;
  truth = yadif + hqdn3d s=0,5; đo khung 3/7/11; M = C5b_box; m = map
  tuyến tính ship (neo 7,194 → 1,0; 13,803 → 1,08; kẹp [1,0; 1,12]).
  Mỗi nhóm build 1 lần qua ffmpeg rồi đo 7 biến thể m trên cùng group
  (cap 1,12/1,10/1,08/1,05 + fixed + Fσ + FM) — xem
  `probe-201-p2.mjs` / `probe-201-p2.json` trong `hidden_files/round201-p2/`.
- Tái hiện đúng từng số đợt 200 ở cap 1,12: Sintel w0s/w4s/w8s σ=15 =
  0,071/0,171/0,162; pan σ=15 = 0,105; pan σ=25 = 0,162; MAD từng nhóm
  khớp đợt 200 (w4s 4,795; w8s 5,068; pan σ=15 6,695; pan σ=25 9,149).

## §2. Khảo sát m-cap — cap cố định 1,05 thắng cả hai công thức ứng viên

| Nhóm (σ=15) | Biến thể | MAD | gap vs tap | R_rel worst | f3 (m / σ̂ / α_eff / R_rel) |
|---|---|---|---|---|---|
| w4s | cap 1,12 | 4,795 | −0,128 | 0,171 CHƯA | 1,12 / 8,86 / 0,501 / 0,171 |
| w4s | cap 1,10 | 4,834 | −0,089 | 0,135 ĐẠT | 1,10 / 8,86 / 0,492 / 0,135 |
| w4s | cap 1,08 | 4,867 | −0,056 | 0,134 ĐẠT | 1,08 / 8,86 / 0,483 / 0,134 |
| w4s | **cap 1,05** | 4,855 | −0,068 | **0,128 ĐẠT** | 1,05 / 8,86 / 0,469 / 0,128 |
| w4s | Fσ (1,05/1,05/1,12) | 4,824 | −0,099 | 0,128 ĐẠT | 1,05 / 8,86 / 0,469 / 0,128 |
| w4s | FM (1,05/1,08/1,05) | 4,858 | −0,065 | 0,128 ĐẠT | 1,05 / 8,86 / 0,469 / 0,128 |
| w8s | cap 1,12 | 5,068 | −0,108 | 0,162 CHƯA | 1,12 / 9,60 / 0,450 / 0,162 |
| w8s | cap 1,10 | 5,062 | −0,114 | 0,159 CHƯA | 1,10 / 9,60 / 0,442 / 0,159 |
| w8s | cap 1,08 | 5,066 | −0,110 | 0,152 CHƯA | 1,08 / 9,60 / 0,434 / 0,152 |
| w8s | **cap 1,05** | 5,069 | −0,107 | **0,142 ĐẠT** | 1,05 / 9,60 / 0,422 / 0,142 |
| w8s | Fσ (1,05/1,12/1,08) | 5,061 | −0,115 | 0,142 ĐẠT | 1,05 / 9,60 / 0,422 / 0,142 |
| w8s | FM (1,05/1,05/1,05) | 5,069 | −0,107 | 0,142 ĐẠT | 1,05 / 9,60 / 0,422 / 0,142 |
| pan σ=15 | cap 1,12 | 6,695 | −0,137 | 0,105 ĐẠT | 1,100 / 13,87 / 0,272 / 0,102 |
| pan σ=15 | **cap 1,05** | 6,720 | −0,112 | **0,097 ĐẠT** | 1,05 / 13,87 / 0,260 / 0,090 |

- **Fσ giữ MAD tốt nhất ở σ=15** (w4s gap −0,099 so với cap 1,05
  −0,068; w8s −0,115 so với −0,107) vì chỉ kẹp đúng khung σ̂ thấp —
  NHƯNG Fσ là công thức SAI về mặt cơ chế (xem §4): nó thất bại ở mọi
  ca lật σ=22, nơi σ̂ cao (12–18) mà boost vẫn lật. Không đề xuất Fσ.
- **FM** sửa được 3/4 ca lật (thua pan σ=22 vì M ~17,4 dưới ngưỡng 20).
  Hạ ngưỡng FM xuống 15 sẽ sửa được cả 4 — nhưng đó là chỉnh ngưỡng
  hậu nghiệm trên n=1, không có cơ sở nguyên tắc hơn cap cố định 1,05.
- **Cap cố định 1,05: đơn giản nhất (1 hằng số), sửa được 4/4 ca lật
  mà cap có thể sửa** (w4s/w8s σ=15, pan σ=22, w4s σ=22), không làm
  hại nhóm đối chứng nào (w0s σ=15: cap không chạm vì m ≤ 1,028;
  pan σ=15: R_rel còn cải thiện 0,105 → 0,097).
- Lưu ý nhỏ: MAD chênh ±0,01–0,02 giữa các cap (vd w4s cap 1,08 MAD
  4,867 cao hơn cap 1,05 4,855) là nhiễu mức khung, không diễn giải
  quá mức — verdict R_rel mới là thước quyết định.

## §3. pan σ=25 — cap không sửa được, và đó KHÔNG phải lỗi boost

- cap 1,12 → 0,162; 1,10 → 0,161; 1,08 → 0,158; 1,05 → 0,154 — cả 3
  khung đều ~0,145–0,162, R_truth lớn 12,9–13,3, |ΔR| 2,04–2,10.
  Chỉ fixed m=1 ĐẠT 0,149 (biên 0,001). Fσ/FM không chạm (σ̂ ~19,
  M ~18).
- Cơ chế khác hẳn ca lật σ=15: α_eff chỉ 0,133–0,150 (α0 ~0,12–0,13),
  không gần vách 0,5; |ΔR| lớn vì R_truth phồng theo σ (truth hqdn3d
  s=0,5 cố định để lại càng nhiều combing dư khi nhiễu càng lớn —
  cùng cơ chế chữ U đợt 200 §2). Boost chỉ đóng góp ~0,01–0,02 R_rel;
  phần còn lại là hiệu chuẩn thước ngoài dải. σ=25 ngoài phạm vi
  [10, 20] nên verdict ở đó không dùng để kết luận — cap 1,05 KHÔNG
  cần sửa được ca này.

## §4. Cơ chế lật — vách α=0,5 chỉ là một phần câu chuyện

- **Ca lật σ=15 (σ̂ thấp):** w4s f3 σ̂=8,86, α0=0,447, α_eff=0,501 —
  vừa vượt vách 0,5 (tiền lệ đợt 198); w8s f3 σ̂=9,60, α0=0,401,
  α_eff=0,450 — DƯỚI vách vẫn lật. Vách giải thích w4s, không giải
  thích w8s.
- **Ca lật σ=22 (σ̂ cao):** pan f3 σ̂=17,56, α0~0,169, α_eff=0,189,
  R_truth=11,243, R_out=9,509 (|ΔR|=1,734); w4s f3 σ̂=12,09,
  α0~0,285, α_eff=0,319, R_truth=8,228, R_out=6,890 (|ΔR|=1,338).
  Cả hai đều lật dù α_eff xa vách 0,5 và σ̂ cao.
- **Điểm chung DUY NHẤT của cả 5 ca lật (w4s/w8s σ=15, pan σ=25,
  pan/w4s σ=22): m ở kẹp trên 1,12 + R_out < R_truth quá
  0,15×R_truth.** Cap 1,05 cắt đúng phần boost thừa đó: R_out nhích
  lên gần R_truth (vd w8s f3: 5,579 → 5,707; pan σ=22 f3: 9,509 →
  9,631) vừa đủ qua bar, trong khi MAD vẫn hơn tap.
- Hệ quả cho công thức: bất kỳ cap nào chỉ kích hoạt khi σ̂ thấp
  (Fσ) đều bỏ sót ca lật σ cao; bất kỳ cap nào chỉ kích hoạt khi M
  lớn (FM) đều bỏ sót pan σ=22 (M ~17, chuyển động vừa nhưng σ cao).
  Cap cố định không có điểm mù này — đó là lý do đề xuất nó.

## §5. Ghim biên σ=8/9/22 — biên cứng [~9,2; ~20,7] trên BBB w0s

| Nhóm | σ | meanM | mBase 3/7/11 | σ̂ 3/7/11 | R_rel adapt | R_rel fixed | tap R_rel |
|---|---|---|---|---|---|---|---|
| BBB w0s | 8 | 3,430 | 1,0/1,0/1,0 | 9,69/9,65/9,66 | **0,179** | 0,179 | 0,179 |
| BBB w0s | 9 | 3,787 | 1,0/1,0/1,0 | 10,10/10,07/10,09 | **0,155** | 0,155 | 0,156 |
| BBB w0s | 22 | 8,599 | 1,018×3 | 16,66/16,62/16,69 | **0,156** | 0,154 | 0,155 |
| BBB pan | 8 | 15,025 | 1,087/1,088/1,104 | 10,60/11,00/11,63 | 0,067 | 0,035 | 0,036 |
| BBB pan | 9 | 15,139 | 1,088/1,090/1,105 | 11,02/11,41/12,03 | 0,065 | 0,037 | 0,037 |
| BBB pan | 22 | 17,353 | 1,116/1,118/1,12 | 17,56/17,83/18,31 | **0,154** | 0,138 | 0,138 |
| Sintel w0s | 8 | 5,956 | 1,006/1,0/1,0 | 6,08/6,41/6,31 | 0,103 | 0,103 | 0,103 |
| Sintel w0s | 9 | 6,232 | 1,009/1,002/1,0 | 6,57/6,90/6,80 | 0,089 | 0,089 | 0,089 |
| Sintel w0s | 22 | 9,865 | 1,051/1,042/1,02 | 12,75/12,93/12,96 | 0,120 | 0,109 | 0,109 |
| Sintel w4s | 22 | 31,985 | 1,12×3 | 12,09/12,99/17,43 | **0,163** | 0,133 | 0,134 |

- **Biên dưới BBB w0s:** σ=8 → 0,179; σ=9 → 0,155; σ=10 → 0,134
  (đợt 200). Nội suy tuyến tính 9→10 cắt bar 0,15 tại **σ ≈ 9,2**.
  Cả 3 khung ở σ=8/9 đều CHƯA (rows 0,179/0,162/0,160 và
  0,155/0,141/0,140) — biên dưới là biên THẬT, không phải 1 khung lẻ.
  m=1,0 suốt ở σ=8/9 (meanM 3,4–3,8 < neo dưới 7,194) nên boost
  không liên quan: tap fail y hệt → lỗi hiệu chuẩn thước, đúng
  kết luận đợt 200.
- **Biên trên BBB w0s:** σ=20 → 0,147 (đợt 200); σ=22 → 0,156;
  σ=25 → 0,168 (đợt 200). Nội suy 20→22 cắt bar tại **σ ≈ 20,7**.
  Ở σ=22 cả 3 khung đều ~0,151–0,156 (rows 0,156/0,155/0,151),
  fixed cũng 0,154 — lại là lỗi hiệu chuẩn, không phải lỗi boost
  (m chỉ 1,018).
- **Biên cứng đo được: σ ∈ [~9,2; ~20,7] trên nội dung nhẹ BBB.**
  Phạm vi hiệu lực [10, 20] đã ghi từ đợt 200 ĐỨNG, biên an toàn
  ~0,8 phía dưới / ~0,7 phía trên. Không đề xuất đổi phạm vi.
- **Trên pan, biên trên thấp hơn:** pan σ=22 adapt CHƯA (0,154) do
  chính boost (fixed 0,138 ĐẠT) — nhưng σ=22 đã ngoài [10, 20] nên
  verdict này không dùng để kết luận ĐẠT/CHƯA ĐẠT cho sản phẩm; nó
  chỉ cho thấy cap 1,05 mở rộng vùng an toàn ra tới σ=22 trên nội
  dung chuyển động (pan σ=22 cap 1,05 → 0,145 ĐẠT; cap 1,08 →
  0,150 ĐẠT sát bar).
- **Trên Sintel w0s, bar giữ ở cả 3 điểm biên** (0,103/0,089/0,120)
  — R_truth nhỏ (3,9–8,8) nên cùng |ΔR| vẫn qua bar; biên phụ thuộc
  nội dung, đúng kết luận đợt 200 §4.

## §6. Đề xuất cho parent (KHÔNG tự đổi code — parent quyết)

- **(ĐỀ XUẤT CHÍNH) Hạ kẹp trên m từ 1,12 → 1,05 (1 hằng số trong
  map tuyến tính ship).** Căn cứ: sửa được 4/4 ca lật mà cap có thể
  sửa (w4s/w8s σ=15, pan σ=22, w4s σ=22); giữ lợi ích adapt ở mọi
  nhóm (MAD vẫn hơn tap, tệ nhất −0,068); không hại nhóm đối chứng
  (w0s σ=15 cap không chạm; pan σ=15 R_rel còn cải thiện); đơn giản
  hơn mọi công thức theo σ̂/M và không có điểm mù của chúng.
  **Điều kiện ship: P4-201 xác nhận độc lập** trên footage thật +
  harness (N10/N5b ở σ=15 — sim P2 cho thấy m ở fixture σ=15 của
  w0s ≤ 1,03 nên cap 1,05 nhiều khả năng không chạm N10/N5b, nhưng
  verdict chính thức thuộc harness P4).
- **(KHÔNG đề xuất) Fσ** — giữ MAD tốt nhất ở σ=15 nhưng SAI cơ chế,
  bỏ sót cả 2 ca lật σ=22. **(KHÔNG đề xuất) FM** — bỏ sót pan σ=22.
- **(GIỮ NGUYÊN)** bar 0,15; fixture σ=15; phạm vi hiệu lực σ ∈
  [10, 20] (biên cứng đo được [~9,2; ~20,7]); **m=0,95 KHÔNG SHIP**
  (đứng từ đợt 199 — không liên quan đợt này, ghi lại để khỏi nhầm
  với cap 1,05).
- **Nợ 202 (nếu parent duyệt cap 1,05):** P2-202 đo lại N10/N5b sim
  sau khi đổi hằng số + quét lại w4s/w8s trên footage thật thứ ba
  (clip hành động nhanh tự nhiên vẫn thiếu — Sintel là phim điện
  ảnh, nợ từ đợt 200 §9.4).

## §7. Code đã đổi

- **KHÔNG ĐỔI code sản phẩm đợt này** (chỉ đo + báo cáo, đúng brief).
  `enhancePreview.ts`, `preview.tsx`, test giữ nguyên đợt 200.
- Probe + bundle đối chiếu nằm ở `hidden_files/round201-p2/` (không stage).

## §8. Số đo kiểm chứng

- `npx tsc --noEmit` (apps/web): **1 lỗi — KHÔNG phải của P2.**
  `src/lib/parityHarness201.ts(2986,11): error TS6133:
  'parentHoldLongB' is declared but its value is never read` — biến
  thừa do P4-201 bỏ hold khi chuyển sang ruleVerdict thuần (comment
  dòng 2985: "Verdict nay = ruleVerdict thuần, KHÔNG còn hold nào").
  File của P4-201, đang sửa dở (mtime 14:55Z); chạy lại 15:07Z vẫn
  đúng 1 lỗi đó, file không đổi. P2 không sửa file của luồng khác;
  ghi lại để P4-201 dọn trước khi đóng đợt. Mọi file P2 chạm tới
  (enhance/media) đều sạch — bằng chứng: bundle test esbuild chạy
  được, xem dưới.
- Test đơn vị (bundle esbuild mới từ cây hiện tại, mẫu đợt 200):
  enhance **169/169 PASS** (11 file: 21+16+9+7+10+8+14+14+10+11+49);
  media **59/59 PASS** (6 file: captureThumb 2, blobPrefetch 25,
  retryPlay95W2 7, retryPlay96X3 7, stallWatchdog 9, fpsProbe 9).
  Tổng **228/228, 0 fail**. 5 file media dùng top-level await nên
  bundle `--format=esm` (.mjs), còn lại `--format=cjs`.
- vite build: KHÔNG chạy (không đụng app — không đổi code).
- Phối hợp T4 (đo yên #69): **CÔNG KHAI MỘT VI PHẠM PHỐI HỢP — xem
  §9.** Tóm tắt: tsc (35 s) + test bundle (~15 s) của P2 rơi vào
  trong W1 (14:56:50–15:00:58Z) vì `windows.md` T4-201 vẫn ghi
  CHỜ GATE ở lần kiểm 14:57:39Z của P2 (dòng ĐANG CHẠY chỉ được ghi
  ~14:57:57Z, ~1 phút SAU khi cửa sổ đã mở). W1 vẫn HỢP LỆ
  (20/20, lớp B 5/5, tickCost median 50,5 ms ≤ 60 — theo poll-t4.log
  15:00:58Z), nhưng P2 đã gây tải CPU trong cửa sổ yên; T4/parent
  tự đánh giá mức ảnh hưởng. Sau khi xác nhận poller đã thoát
  (15:00:58Z), P2 mới chạy lại tsc (15:07Z).

## §9. Vi phạm phối hợp T4 — ghi trung thực, không giấu

- **Chuyện gì xảy ra:** W1 đợt 201 mở thực tế lúc 14:56:50Z (poll #6:
  load1 1,48, load5 1,99, blockers 0). P2 kiểm `windows.md` lúc
  ~14:55:28Z và 14:57:39Z — cả hai lần đều đọc CHỜ GATE (file
  `windows.md` mtime 14:57:57Z; dòng ĐANG CHẠY ghi sau khi cửa sổ
  đã mở ~1 phút). Tin vào bản ghi đó, P2 chạy `tsc --noEmit` (~35 s)
  và bộ test esbuild (~15 s) trong lúc W1 đang chạy.
- **Hậu quả đo được:** W1 vẫn HỢP LỆ — 20/20 pass, lớp B 5/5,
  tickCost median 50,5 ms (bar 60) theo poll-t4.log lúc 15:00:58Z;
  poller thoát ngay sau lượt hợp lệ. Không có bằng chứng tải của P2
  làm hỏng lượt đo (tickCost 50,5 ms còn tốt hơn đợt 200: 55,0 ms),
  nhưng tải CPU của P2 là có thật trong cửa sổ và lẽ ra không được
  phép — ghi lại để T4-201/parent phán, KHÔNG tự kết luận "không sao".
- **Bài học cho các luồng:** `windows.md` có độ trễ cập nhật ~1 phút
  so với giờ mở thực tế — kiểm windows.md trước bước nặng là CHƯA
  ĐỦ; khi poller đã mở (T4-201 công bố poller mở ~14:53Z), các luồng
  nên coi cửa sổ có thể mở BẤT CỨ LÚC NÀO và tránh workload nặng cho
  tới khi thấy lượt hợp lệ/poller thoát trong poll-t4.log, thay vì
  chỉ tin dòng trạng thái trong windows.md. P2 đã áp dụng bài học
  này cho bước tsc chạy lại (chờ poll-t4.log ghi poller thoát rồi
  mới chạy 15:07Z).

## §10. Hạn chế + nợ (trung thực)

1. m-cap 1,05 mới có 4 ca lật làm bằng chứng (w4s/w8s σ=15, pan/w4s
   σ=22) + 2 nhóm đối chứng — chưa có mẫu trên clip hành động nhanh
   tự nhiên (thể thao, xe chạy); cần P4-201 xác nhận độc lập trước
   khi đổi hằng số ship.
2. Biên σ nội suy tuyến tính giữa 2 điểm đo gần nhất (9→10, 20→22) —
   R_rel(σ) không hoàn toàn tuyến tính (chữ U), nên [~9,2; ~20,7]
   là ước lượng ±0,3, không phải số đo trực tiếp từng 0,1 σ.
3. pan σ=25 vẫn CHƯA ở mọi cap ≥1,05 — ngoài phạm vi hiệu lực nên
   không kết luận sản phẩm, nhưng là giới hạn đã biết của thước.
4. Sintel 24fps resample fps=30 cho pipeline (như đợt 200) — khung
   resample không phải khung gốc; ảnh hưởng nhỏ, ghi nhận trung thực.
5. Verdict N10/N5b chính thức thuộc harness P4-201 (sim P2 chỉ tái
   tạo mô hình pixel; đã khớp P4-198/P4-200 từng số nên sim đáng tin).
6. tsc còn 1 lỗi ở file P4-201 (xem §8) — không thuộc phạm vi P2,
   cần P4-201 dọn.

## §11. File stage (batch phase9-round201-p2-enhance.txt)

- `docs/PHASE9_ROUND201_P2_ENHANCE_LIMITS.md`
- KHÔNG stage binary/mp4/yuv/rgb (chỉ ở hidden_files/round201-p2/).

## §12. Thư mục làm việc + dữ liệu cho P4-201

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round201-p2/`:
probe-201-p2.mjs/.json/.log (khảo sát m-cap 7 biến thể × 5 nhóm A +
ghim biên 10 nhóm B, kèm M/σ̂/α từng khung), run-201-p2-tests.sh +
tests-201.log, test-bundle/ (17 bundle test chạy lại từ cây hiện tại),
`*-clean.rgb/.yuv`, `*-inter.yuv`, `*-truth.yuv`, `*-noisy.rgb/.yuv`
trung gian (không stage). Nguồn footage tái dùng từ đợt 199/200
(BBB `bbb-w0s-clean.rgb`/`bbb-pan-clean.rgb`; Sintel CC-BY 3.0
`sintel-w0s/w4s/w8s-clean.rgb` — không copy lại mp4).
**Cho P4-201:** cùng fixture + seed (19100+f) + truth (yadif +
hqdn3d s=0,5) như đợt 200; cap ứng viên cần xác nhận độc lập là
**1,05 cố định**; các ca lật cần xác nhận: Sintel w4s/w8s σ=15,
pan σ=22, w4s σ=22 (f3 là khung quyết định trong cả 4 ca).

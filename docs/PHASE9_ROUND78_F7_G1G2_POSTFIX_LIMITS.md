# Phase 9 đợt 78 — F7: G1/G2 + đo post-fix (nợ đợt 77 §4.7)

Ngày đo: 10/11/2026. Luồng F7, repo local `~/workspace/repo-1`.
Chỉ sửa harness đo (`apps/web/scripts/r78f7-*.mjs`,
`test_round78_f7_g1g2.mjs`); `delta0-harness.mjs` KHÔNG đổi, không sửa
production (luật delta0 không nằm trong production — xem D2).
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận trước

**G1 vs G2 PHÂN BIỆT ĐƯỢC lần đầu tiên — ở mức verdict, trên đúng 1
case: `F7-sweep-w2880-testpattern-n05`. G2 đúng, G1 sai.**
G1 áp d0 (d0std_R 1,14 ≤ 2) → verdict LỆCH; G2 từ chối d0 (ratio_R 1,41
> 1) → verdict KHỚP; ground truth là KHÔNG-d0.

- Tập mới F7: 26 case, 21 chấm được, 5 không chấm (cả-hai-LỆCH).
  R0 17/21, **G1 20/21, G2 21/21, G12 21/21**.
- Tập gộp (27 case cũ + 26 case mới = 53, 44 chấm được):
  R0 37/44, **G1 43/44, G2 44/44, G12 44/44**.
- G1/G2 bất đồng trên **10/53 case** (tất cả đều là case mới F7, tất
  cả đều ở góc Q3: G1 áp, G2 từ chối). 9/10 chỉ khác ở mức cổng
  (verdict giống nhau); 1/10 phân biệt được ở mức verdict (w2880 n05).
- **Hạn chế trung thực (đọc §5):** case phân biệt duy nhất nằm sát
  mép ngưỡng Δkurt 0,35 (noD0 0,34 KHỚP, fullD0 0,36 LỆCH — lệch
  ±0,01 quanh ngưỡng) và KHÔNG lặp lại ở n10 cùng cửa sổ
  (cả-hai-LỆCH). Phân biệt là thật theo ngưỡng harness hiện tại,
  nhưng mỏng — cần đo thêm (§6). Góc Q4 vẫn chưa có case thật nào,
  nên **G2 vs G12 vẫn chưa phân biệt được** (đồng ý 44/44); riêng
  G2 một mình cũng đã 44/44, chưa chứng minh được G1 đóng góp gì
  thêm ngoài G2.

## 1. Đo post-fix basgo/slovenska (media 1920, w1440 + w1920)

| case | plainMad | d0std_R | residStd_R | ratio_R | cổng G1/G2/G12 | đúng | verdict cả 4 luật |
|---|---|---|---|---|---|---|---|
| basgo w1440 n05 | 0,743 | 0,83 | 0,73 | 1,14 | áp / từ chối / từ chối | KHÔNG-d0 | KHỚP cả 4 |
| basgo w1440 n10 | 0,743 | 0,83 | 0,73 | 1,14 | áp / từ chối / từ chối | KHÔNG-d0 | KHỚP cả 4 |
| basgo w1920 n05 | 0,687 | 0,88 | 0,71 | 1,24 | áp / từ chối / từ chối | KHÔNG-d0 | KHỚP cả 4 |
| basgo w1920 n10 | 0,687 | 0,88 | 0,71 | 1,24 | áp / từ chối / từ chối | KHÔNG-d0 | KHỚP cả 4 |
| slovenska w1440 n05 | 1,649 | 0,16 | 2,58 | 0,06 | áp / áp / áp | KHÔNG-d0 | KHỚP cả 4 |
| slovenska w1440 n10 | 1,649 | 0,16 | 2,58 | 0,06 | áp / áp / áp | KHÔNG-d0 | KHỚP cả 4 |
| slovenska w1920 n05 | 1,819 | 0,21 | 2,95 | 0,07 | áp / áp / áp | KHÔNG-d0 | KHỚP cả 4 |
| slovenska w1920 n10 | 1,819 | 0,21 | 2,95 | 0,07 | áp / áp / áp | KHÔNG-d0 | KHỚP cả 4 |

So với pre-fix (đợt 76/77):

- **basgo:** plainMad 1,988 → 0,743 (w1440), 1,213 → 0,687 (w1920).
  residStd_R tụt mạnh 3,46 → 0,71–0,73: sau sửa C1, plain gần render
  hơn nhiều. d0std_R gần như không đổi (0,83–0,88). Vì residStd_R
  rơi xuống DƯỚI d0std_R nên ratio_R vượt 1 → basgo rơi vào Q3.
  Đây là cơ chế tạo ra 4 case bất đồng đầu tiên (§3).
- **slovenska:** plainMad gần như KHÔNG cải thiện: 1,766 → 1,649
  (w1440), 1,883 → 1,819 (w1920). residStd_R vẫn lớn 2,58–2,95,
  ratio_R 0,06–0,07. Sửa C1 hầu như không chạm tới phần dư của
  slovenska — dư nghi phần dư do nguyên nhân khác (VP9 decode?
  nội dung tối?), chưa xác định được. Nợ mở, xem §6.

## 2. Đo ocean ở w1600/w1760/w2240/w2880 (post-fix)

| case | rect | plainMad | d0std_R | residStd_R | ratio_R | cổng G1/G2/G12 | đúng | fullD0 Δkurt R |
|---|---|---|---|---|---|---|---|---|
| ocean w1600 n05 | 489x275 | 1,114 | 3,93 | 0,91 | 4,32 | từ chối cả 3 | KHÔNG-d0 | 0,45 → LỆCH (R0 sai) |
| ocean w1600 n10 | 489x275 | 1,114 | 3,93 | 0,91 | 4,32 | từ chối cả 3 | KHÔNG-d0 | 0,39 → LỆCH (R0 sai) |
| ocean w1760 n05 | 667x375 | 1,223 | 3,95 | 1,26 | 3,13 | từ chối cả 3 | KHÔNG-d0 | 0,36 → LỆCH (R0 sai) |
| ocean w1760 n10 | 667x375 | 1,223 | 3,95 | 1,26 | 3,13 | từ chối cả 3 | KHÔNG-d0 | 0,32 → KHỚP |
| ocean w2240 n05 | 1129x635 | 1,238 | 3,98 | 1,58 | 2,52 | từ chối cả 3 | KHÔNG-d0 | 0,35 → KHỚP |
| ocean w2240 n10 | 1129x635 | 1,238 | 3,98 | 1,58 | 2,52 | từ chối cả 3 | KHÔNG-d0 | 0,31 → KHỚP |
| ocean w2880 n05 | 1769x995 | 1,396 | 3,98 | 1,82 | 2,19 | từ chối cả 3 | KHÔNG-d0 | 0,35 → KHỚP |
| ocean w2880 n10 | 1769x995 | 1,396 | 3,98 | 1,82 | 2,19 | từ chối cả 3 | KHÔNG-d0 | 0,31 → KHỚP |

Nhận xét:

- d0std_R ocean ổn định 3,93–3,98 ở mọi cửa sổ (khớp sàng lọc
  3,89–3,98). G1/G2/G12 đồng thuận từ chối ở cả 8 case.
- ratio_R GIẢM theo cửa sổ (4,32 → 3,13 → 2,52 → 2,19) vì
  residStd_R tăng theo rect (0,91 → 1,82) trong khi d0std_R đứng yên.
- Lỗi của R0 thu hẹp theo cửa sổ: fullD0 Δkurt R 0,45 (w1600 n05)
  → 0,36 (w1760 n05) → 0,35 (w2240/w2880 n05, vừa đủ KHỚP). Ở
  w2240+ R0 "đúng" chỉ nhờ Δkurt vừa chạm ngưỡng — không phải vì
  d0 trở nên đúng.
- Lưu ý: rect w1600 TRÙNG rect w1440 (489x275, đã biết từ B1) nên
  w1600 không thêm hình học mới so với w1440, chỉ là phép đo lặp
  ở cùng rect (plainMad 1,114; d0std_R 3,93 — nhất quán với E6).

## 3. Săn G1/G2: quét test-pattern theo cửa sổ

| case | rect | plainMad | d0std_R | residStd_R | ratio_R | cổng G1/G2 | đúng | verdict G1 / G2 |
|---|---|---|---|---|---|---|---|---|
| test-pattern w1280 n05 | 311x175 | 1,578 | 0,90 | 4,46 | 0,20 | áp / áp | cả-hai-LỆCH | LỆCH / LỆCH (không chấm) |
| test-pattern w1280 n10 | 311x175 | 1,578 | 0,90 | 4,46 | 0,20 | áp / áp | CÓ-d0 | KHỚP / KHỚP |
| test-pattern w1760 n05 | 667x375 | 1,227 | 1,08 | 3,50 | 0,31 | áp / áp | CÓ-d0 | KHỚP / KHỚP |
| test-pattern w1760 n10 | 667x375 | 1,227 | 1,08 | 3,50 | 0,31 | áp / áp | cả-hai-LỆCH | LỆCH / LỆCH (không chấm) |
| test-pattern w2240 n05 | 1129x635 | 0,971 | 1,15 | 0,99 | 1,16 | áp / từ chối | KHÔNG-d0 | KHỚP / KHỚP |
| test-pattern w2240 n10 | 1129x635 | 0,971 | 1,15 | 0,99 | 1,16 | áp / từ chối | KHÔNG-d0 | KHỚP / KHỚP |
| test-pattern w2560 n05 | 1449x815 | 0,969 | 1,14 | 0,93 | 1,23 | áp / từ chối | cả-hai-LỆCH | LỆCH / LỆCH (không chấm) |
| test-pattern w2560 n10 | 1449x815 | 0,969 | 1,14 | 0,93 | 1,23 | áp / từ chối | cả-hai-LỆCH | LỆCH / LỆCH (không chấm) |
| **test-pattern w2880 n05** | 1769x995 | 0,965 | 1,14 | 0,81 | 1,41 | áp / từ chối | KHÔNG-d0 | **LỆCH / KHỚP — G2 đúng, G1 sai** |
| test-pattern w2880 n10 | 1769x995 | 0,965 | 1,14 | 0,81 | 1,41 | áp / từ chối | cả-hai-LỆCH | LỆCH / LỆCH (không chấm) |

Cơ chế tạo Q3 ở test-pattern: d0std_R bão hòa ~1,14–1,15 từ w2240
trở lên (khớp sàng lọc: 0,90 → 1,08 → 1,15 → 1,14 → 1,14), trong
khi residStd_R GIẢM theo cửa sổ (4,46 → 3,50 → 0,99 → 0,93 →
0,81) → ratio_R vượt 1 từ w2240 (0,20 → 0,31 → 1,16 → 1,23 → 1,41).

Case phân biệt `F7-sweep-w2880-testpattern-n05` (chi tiết):
noD0 KHỚP (Δkurt [0,34, 0,35, 0,23], Δcorr [0,096, 0,007, 0,015]),
fullD0 LỆCH (Δkurt R 0,36 > ngưỡng 0,35; Δkurt [0,36, 0,04, 0,24]).
G1 áp d0 → LỆCH (sai); G2/G12 từ chối d0 → KHỚP (đúng).
**Biên cực mỏng:** noD0 Δkurt R 0,34 (qua ngưỡng 0,01) và fullD0
Δkurt R 0,36 (trượt ngưỡng 0,01). Nếu ngưỡng là 0,34 hay 0,37 thì
kết luận đổi chiều. Xem §5.

## 4. Bảng chấm tổng hợp

26 case mới (21 chấm được, 5 không chấm), JSON
`hidden_files/round78-f7/r78f7-postfix.json`:

| luật | đúng / chấm được (mới) | sai (mới) |
|---|---|---|
| R0 cũ | 17/21 | ocean w1600 n05/n10, ocean w1760 n05, test-pattern w2880 n05 |
| G1 (d0std_R ≤ 2) | 20/21 | test-pattern w2880 n05 |
| G2 (ratio_R ≤ 1) | 21/21 | — |
| G12 (cả hai) | 21/21 | — |

Tập gộp 53 case (27 cũ + 26 mới; 44 chấm được, 9 không chấm):

| luật | đúng / chấm được (gộp) | sai thêm so với đợt 77 |
|---|---|---|
| R0 cũ | 37/44 | +4 (3 ocean + 1 test-pattern) |
| G1 | 43/44 | +1 (test-pattern w2880 n05) |
| G2 | 44/44 | 0 |
| G12 | 44/44 | 0 |

G1/G2 bất đồng: 10/53 — 4 basgo (verdict KHỚP cả hai), 2
test-pattern w2240 (KHỚP cả hai), 2 test-pattern w2560 (LỆCH cả
hai, không chấm), 2 test-pattern w2880 (n05 phân biệt được, n10
không chấm). Không có case bất đồng nào trong 27 case cũ.

## 5. Giới hạn trung thực

1. **Phân biệt G1/G2 mỏng, dựa vào 1 case sát ngưỡng.** Chỉ có
   duy nhất `w2880-testpattern-n05` phân biệt được, với Δkurt R
   0,34 vs 0,36 quanh ngưỡng 0,35. Cùng cửa sổ ở n10 thì cả hai
   chế độ đều LỆCH (Δkurt R 0,40/0,42) nên không phân biệt được.
   Snapshot là deterministic (D1 plain-identical) nên số này ổn
   định qua lần capture lại, nhưng kết luận "G2 đúng, G1 sai"
   nhạy với chính ngưỡng 0,35 — ngưỡng này là quy ước thực nghiệm
   từ D2, chưa có cơ sở lý thuyết độc lập.
2. **G2 vs G12 vẫn chưa phân biệt được.** Góc Q4 (d0std_R > 2
   nhưng ratio_R ≤ 1) vẫn chưa có case thật nào. Sàng lọc cho thấy
   không frame nào trong tập hiện tại có d0std_R trong (1,15;
   3,27] — khoảng trống lớn giữa test-pattern (~1,15) và ocean
   (~3,3). G2 một mình đã 44/44; chưa có bằng chứng G1 đóng góp
   gì thêm vào G12.
3. **5/26 case mới không chấm được (cả-hai-LỆCH),** tập trung ở
   test-pattern: w1280 n05, w1760 n10, w2560 n05/n10, w2880 n10.
   Nhiều case trượt ngưỡng với biên nhỏ (vd. w2560 n05: noD0
   Δkurt G 0,36, fullD0 Δkurt R 0,38). Ngưỡng Δkurt ≤ 0,35 đang
   bị stress-test ở test-pattern rect lớn / n10 — có thể ngưỡng
   quá chặt cho nội dung này, hoặc test-pattern không phải chất
   liệu phân biệt tốt ở rect lớn.
4. **Kênh G của test-pattern bất thường:** d0std_G ~4,4 ở mọi
   cửa sổ (trong khi d0std_R ~1,1, d0std_B ~0,6); residStd_G
   3,5–4,5 ở rect nhỏ. Luật G1/G2/G12 chỉ dùng kênh R — việc
   bỏ qua kênh G chưa được biện minh độc lập; nếu kênh G mang
   tín hiệu thật thì cổng R-only có thể mù một phần.
5. **slovenska post-fix gần như không cải thiện** (§1) — nguyên
   nhân phần dư chưa rõ, không được giải thích bởi sửa C1.
6. **Rect w1600 trùng w1440** (489x275): ocean w1600 không phải
   điểm dữ liệu hình học mới.
7. **Độ tin cậy capture:** 16 lần chạy headed, 13 pass ngay, 3
   lần fail do tải VM (load 11–23, xem §7) đều pass khi chạy lại.
   Snapshot hỏng duy nhất (basgo run A plain mean 12,66, khung
   đen) đã loại, không dùng làm dữ liệu.

## 6. Hướng đo tiếp theo

1. **Củng cố case phân biệt w2880-testpattern:** đo thêm mức
   noise trung gian (n07/n08) và cửa sổ lân cận (w2720 nếu có,
   hoặc w2560 với playhead/frame khác) để xem vùng G1-sai có
   rộng hay chỉ là một điểm sát ngưỡng. Nếu vùng này rộng và ổn
   định → kết luận G2 > G1 vững; nếu chỉ là một điểm → giữ kết
   luận ở mức "bằng chứng đầu tiên, mỏng".
2. **Săn Q4 (phân biệt G2 vs G12):** cần nội dung mới có d0std_R
   trong (1,15; 3,27) — khoảng trống hiện tại. Ứng viên: pattern
   kiểm tra khác (sọc/xung khác test-pattern hiện tại), ảnh thật
   có chi tiết vừa, gradient có nhiễu. Sàng lọc bằng
   `r78f7-g1g2-screen.mjs` trước khi capture.
3. **Làm rõ kênh G test-pattern:** kiểm tra vì sao d0std_G ~4,4
   (cắt kênh? nội dung pattern?) và đánh giá cổng có nên xét
   thêm kênh G hay không.
4. **slovenska:** tìm nguồn phần dư post-fix (so sánh decode
   VP9 vs render; kiểm tra nội dung tối / chuyển động).
5. **Ngưỡng Δkurt 0,35:** xem xét lại bằng tập case lớn hơn —
   nhiều case cả-hai-LỆCH trượt ngưỡng với biên nhỏ, gợi ý ngưỡng
   có thể cần hiệu chỉnh hoặc cần thêm metric phụ.

## 7. Đính chính + ghi chú vận hành

- **D3 run A/B slovenska là rỗng (đã đính chính):** run A/B đọc
  hash `4290ca0b` cho cả basgo lẫn slovenska vì `RAW_FN` cũ lấy
  video element đầu tiên trong pool (pool giữ element của mọi
  nguồn đã import). Đã vá `r78f7-headed-capture.mjs`: chọn element
  theo blob URL của media item (currentSrc là blob URL nên so
  hậu tố tên file không bao giờ khớp — lần vá đầu sai ở điểm này,
  lần vá sau khớp blob URL đầy đủ mới đúng). **Kiểm chứng live
  đa-nguồn xong:** lần chạy `headed-w1440x900-multisrc-verify`
  5/5 pass, basgo hash `4290ca0b` (blob `3878a556…`) ≠ slovenska
  hash `ca0927a7` (blob `416fb3af…`), D3 cả hai ĐÚNG. D3 rỗng của
  run A/B không được tính là bằng chứng cùng-khung; chỉ D1 +
  mean ổn định là bằng chứng phụ.
- **Vá cổng sẵn sàng trong `snapAt`:** run A basgo w1440 plain
  đầu mean 12,66 (khung đen, VP8 load/seek chậm + VM đông) →
  chờ tới khi đọc được frame decode thô (videoWidth > 0,
  readyState ≥ 2, currentTime ≈ playhead, tối đa 90 s) rồi mới
  snapshot; quá hạn lỗi to thay vì ghi khung đen.
- **Flake do tải VM:** 3 lần capture exit 2 do timeout (ocean
  w1600 cổng sẵn sàng 90 s; ocean w2240 mount timeout 240 s;
  test-pattern w2880 RelinkPanel timeout). Load đo được 11,08–
  23,55 trên VM 4 vCPU; các luồng đợt 78 khác chạy song song
  (`yes` ×3, ffmpeg vidstab, bgremove, tsc, Chrome headed khác).
  Không có dấu hiệu OOM/crash. Cả 3 đều pass khi chạy lại.
  Không nới timeout tùy tiện, không sửa production để "chữa"
  flake đo.
- **Hash khung render ổn định:** ocean f25 `5c9f9de4`, basgo f30
  `4290ca0b`, slovenska f25 `ca0927a7`, test-pattern f30
  `ad4be1d3` — khớp mọi lần chạy trong đợt.
- **Sàng lọc vs eval khớp:** d0std_R từ screen khớp eval trong
  0,01 ở mọi case đối chiếu được (test 5, 7/7 xanh).

## 8. Kiểm chứng

Lệnh (từ gốc repo, trừ tsc/vite chạy trong `apps/web`):

- `node apps/web/scripts/r78f7-postfix.mjs` — exit 0, ~20 phút,
  ghi `hidden_files/round78-f7/r78f7-postfix.json` (26 case mới).
- `node --test apps/web/scripts/test_round78_f7_g1g2.mjs` —
  **7/7 pass** (2 test ban đầu fail do kỳ vọng viết trước khi có
  số đo — tưởng basgo G12 áp và mọi case bất đồng đều phân biệt
  verdict — đã sửa kỳ vọng theo số đo thật, xem log luồng).
- `node --test apps/web/scripts/test_round77_e6_g12.mjs` —
  **7/7 pass** (hồi quy E6).
- `node --test apps/web/scripts/chrome-resample-67u2.test.mjs` —
  **8/8 pass**.
- `npx tsc --noEmit` (trong `apps/web`) — **0 lỗi**.
- `npx vite build` (trong `apps/web`) — **pass** (53,4 s; cảnh
  báo chunk-size có sẵn từ trước).

## 9. File đổi/thêm (stage, KHÔNG push)

- `apps/web/scripts/r78f7-headed-capture.mjs` (mới — capture
  headed 4 nguồn + 2 vá §7)
- `apps/web/scripts/r78f7-postfix.mjs` (mới — eval 26 case + chấm
  4 luật + gộp 27 case cũ)
- `apps/web/scripts/r78f7-g1g2-screen.mjs` (mới — sàng lọc d0std_R
  8 frame × 7 rect)
- `apps/web/scripts/test_round78_f7_g1g2.mjs` (mới — 7 test)
- `docs/PHASE9_ROUND78_F7_G1G2_POSTFIX_LIMITS.md` (mới — file này)

Không stage: `hidden_files/round78-f7/` (snapshot/JSON/log nội
bộ), `/tmp/r78f7-smoke.mjs`, driver `captures-*.sh`, không binary,
không workflow `.yml`. File paths:
`~/workspace/repo-1-push/paths-loop/phase9-round78-f7-g1g2-postfix.txt`.

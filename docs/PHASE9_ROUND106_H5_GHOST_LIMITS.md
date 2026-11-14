# PHASE9_ROUND106_H5_GHOST_LIMITS — Ghost fixes: sửa comment "0/30 clean", analyzer distinct, đo lại flip-leg trên cây land

> Luồng H5, đợt 106, lượt cron 21:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ G1 đợt 105 (LIMITS §7 mục 4 + G9 §2.1): (a) comment "0/30 clean" của rawAnchor
> còn ghi sai số đã bị bác; (b) flip-leg cho code land chưa đo lại; (c) analyzer distinct
> dedup theo (label, pix) gán sai labelSrc; (d) headline clean phụ thuộc độ phủ;
> (e) F6' WebKit + spread đuôi lỏng — chỉ làm nếu còn thời gian.
> KHÔNG push. KHÔNG release/tag. Chỉ sửa COMMENT trong preview.tsx (không đổi logic).
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (5 ý):**
> 1. **Comment đã sửa đúng số (a):** 6 chỗ trong `preview.tsx` ghi "0/30 clean" nay ghi
>    "rawAnchor 70,4% ≈ frameIdx 70,0% (mọi occurrence), không lợi ích" + ghi rõ số cũ
>    là artifact dedup (md5 `f0b9e496…` → `ced42efd…`, chỉ comment; marker 104f3 vẫn
>    50 dòng / 58 lần; 0 dòng code dùng rawAnchor).
> 2. **Analyzer distinct đã sửa (c) — bias HẾT:** dedup theo (label, pix, labelSrc) +
>    báo kèm phép đếm mọi occurrence; chạy lại trên dữ liệu cũ cho rawAnchor distinct
>    B 20/31 = 64,5% (cũ 0/11), B2 14/20 = 70,0% (cũ 0/6), flip C 32/47 = 68,1% (cũ 0/13)
>    — khớp mọi occurrence (66,7% / 68,6% / 73,8%). Headline chỉ nhích nhẹ do tập
>    distinct tách theo labelSrc (B 70,8%→73,0%, B2 76,1%→79,6%, B3 87,2%→86,6%,
>    A 45,7% không đổi, flip C 73,6%→79,2%, flip D 48,6% không đổi) — thứ hạng và
>    kết luận bar G1 không đổi. Phép đếm mọi occurrence mới tái tạo CHÍNH XÁC số G1
>    trên cả 6 run cũ (kiểm chứng độc lập của implementation).
> 3. **Flip-leg trên cây land KHÔNG ĐẠT bar dưới tải nặng (b):** C2 100/146 = 68,5%,
>    lặp lại C2b 97/154 = 63,0% (gộp 197/300 = 65,7%); bar là ≥70% và ≥ D+20pt (68,6%).
>    Suy luận chặn dưới G1 §4.3 KHÔNG bị bác — độ phủ anchor tươi tụt 92,4% (C) → 83,2% /
>    82,4% (C2/C2b) dưới tải nặng (tickCost trung vị 14,1/13,4ms vs 6,7ms; rAF gap 32,0/
>    30,2ms vs 18,0ms), và fallback mọi occurrence ở C2 (67,0%) ≈ rawAnchor ở C (73,8%)
>    ≈ frameIdx ở B3 (70,0%) — code land không làm fallback tệ đi. Verdict flip-leg là
>    PHỤ THUỘC TẢI: đạt ở tải nhẹ (C 79,2% theo cách đếm mới), không đạt ở tải nặng.
>    Land F8 KHÔNG bị lật; nợ mở: đo lại flip lúc máy yên để xác nhận.
> 4. **Độ phủ → clean (d):** gradient mới: phủ 82,4% → 63,0%; 83,2% → 68,5%;
>    92,4% → 79,2%; 94,6% → 73,0%; 98,2% → 79,6%; 99,1% → 86,6% (distinct, cách
>    đếm mới; E3: phủ 34% → ~49,5%). Tải KHÔNG kiểm soát (luồng đợt 106 khác chạy
>    song song) — không thêm tải tổng hợp để khỏi nhiễu luồng khác.
> 5. **Không hồi quy:** tsc 0, vite build PASS (12,43s), ghostBlend 15/15,
>    previewEngine 27/27 — trên cây đã sửa comment. Spread đuôi lỏng VẪN MỞ
>    (max 75,4 ở C2b; C2 max 47,5 — 1 run, không kết luận). F6' WebKit KHÔNG làm
>    (không có driver ghost cho WebKit — như G1 §0).

## 0. Môi trường đo + bar đăng ký trước

- Boot **75697729-9014-47e0-a0cc-c1aad4926fe5** (bắt đầu 14:31:52Z 13/11/2026; reboot
  tiếp theo dự báo ~16:33Z — không chạm vào phiên H5). RAM khả dụng 803 MB lúc
  14:35Z → 1892 MB lúc 14:42Z → 2261 MB lúc 14:54Z → 1728 MB lúc 15:07Z; load1
  5,28 → 6,50 lúc đo flip (máy bận — nhiều luồng đợt 106 chạy song song).
  Birefnet KHÔNG chạy (RAM dưới ngưỡng guard).
- **Code lúc bắt đầu H5:** `preview.tsx` md5 `f0b9e496…` (cây đã land F8-only, G1 đợt 105).
  Không luồng đợt 106 nào khác sửa file này trong phiên H5 (md5 kiểm lại trước khi
  sửa comment vẫn `f0b9e496…`).
- **Bar đăng ký trước — flip-leg trên cây land** (ghi trong `round106-h5/boot.log`
  TRƯỚC khi đo, không đổi sau khi thấy số; kế thừa bar G1 đợt 105): run C2, case B,
  20 pass, `--disable-rvfc`, flip rVFC sau pass 5, tap ON + relabel ON (mặc định),
  hậu flip+2000ms. ĐẠT khi clean distinct ≥70% VÀ hơn baseline flip D (48,6%) ≥20
  điểm (tức ≥68,6%). Kỳ vọng theo suy luận chặn dưới G1 §4.3: ≈73,6% ± nhiễu (cách
  đếm cũ). **Đính chính kỳ vọng trước khi đo C2** (sau khi chạy lại analyzer mới
  trên dữ liệu cũ, vẫn trước khi đo mới): dưới analyzer MỚI, flip C cũ = 79,2% nên
  kỳ vọng C2 ≈79,2% ± nhiễu; bar không đổi. So sánh C2 với D và với C cũ đều phải
  dùng CÙNG analyzer mới.
- **Bar đăng ký trước — analyzer distinct đã sửa (c):** dedup theo (label, pix, labelSrc)
  + báo kèm phép đếm mọi occurrence. ĐẠT khi chạy lại trên dữ liệu cũ cho breakdown
  labelSrc khớp phép đếm mọi occurrence trong sai số lấy mẫu (rawAnchor ~66–74% thay
  vì 0/30; tap không còn bị thổi phồng), và thứ hạng các run không đổi.
- **Phạm vi:** chỉ sửa COMMENT trong `preview.tsx`. Nếu phát hiện cần sửa logic → DỪNG,
  ghi nợ, không tự sửa. H5 không sửa logic nào (không phát hiện nhu cầu sửa logic).
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
  **WebKit: KHÔNG chạy được** (không có driver ghost, như G1 §0). Mọi kết luận nhân
  quả chỉ đo trên Chromium.
- Vite riêng H5 trên **5183**, config tạm `vite.config.h5-temp.ts` (HMR TẮT, đóng băng
  code lúc khởi động). Lưu ý: vite chỉ bind `[::1]:5183` (IPv6 localhost) — probe phải
  dùng `--url http://localhost:5183/`, `127.0.0.1` trả 000. Sau khi đo xong: vite đã
  tắt, config tạm đã XOÁ (không stage).

## 1. Những gì H5 đã làm

| Bước | Nội dung | Kết quả |
|---|---|---|
| 1 | Sửa 6 comment sai số "0/30 clean" trong `preview.tsx` (chỉ comment) | §2 — md5 `ced42efd…` |
| 2 | Sửa analyzer distinct: dedup (label, pix, labelSrc) + phép đếm mọi occurrence; sửa luôn vòng lặp labelSrc của flip analyzer vốn thiếu "rawAnchor" | §3 — analyzer mới |
| 3 | Chạy lại analyzer mới + cũ trên dữ liệu cũ (A/B/B2/B3/C/D) để so sánh trước/sau | §3 — bias hết, headline nhích nhẹ |
| 4 | Đo flip C2 trên cây land (đã sửa comment) + lặp lại C2b (vì C2 sát bar) | §4 — 68,5% / 63,0%, KHÔNG đạt bar |
| 5 | Chẩn đoán tải/độ phủ C2/C2b vs C (tickCost, rAF gap, phủ theo pass) | §4.2 — tụt do tải, không do code |
| 6 | Kiểm chứng hồi quy trên cây đã sửa comment: tsc, vite build, ghostBlend, previewEngine | §5 — tất cả xanh |
| 7 | Spread (từ log probe C2/C2b) + ghi nợ F6' WebKit | §4.3 / §7 — vẫn mở |

## 2. Sửa comment (a) — chỉ comment, không đổi logic

6 vị trí trong `apps/web/src/preview.tsx` (md5 `f0b9e496…` → `ced42efd…`):

| Dòng (mới) | Trước | Sau |
|---|---|---|
| 1263–1266 | nấc "rawAnchor" đã bỏ sau khi đo — 0/30 clean | Đính chính H5: số "0/30 clean" cũ là artifact dedup; đo đúng mọi occurrence: rawAnchor 70,4% ≈ frameIdx 70,0%, không lợi ích |
| 1365–1366 | "rawAnchor" đã bỏ sau khi đo 0/30 clean | Như trên (ngắn gọn) |
| 1526–1528 | nấc rawAnchor F8b đã bỏ sau khi đo 0/30 clean | 70,4% ≈ frameIdx 70,0%, không lợi ích; số "0/30 clean" cũ là artifact dedup, đính chính H5 |
| 2611–2619 | Đo 3 run: rawAnchor 0/30 clean — giả thuyết BỊ BÁC; anchor cũ rơi về frameIdx như E3 (25–27% clean ở tập khó) | rawAnchor 70,4% ≈ frameIdx 70,0% — BỊ BÁC ở dạng "nâng tập fallback lên gần mức tap" (tap 97,9%), nhưng KHÔNG tệ hơn frameIdx; số E3 "25–27%" cũng chịu bias dedup, không dùng làm baseline fallback nữa |
| 2746 | "rawAnchor" đã bỏ (đo 0/30 clean) | "rawAnchor" đã bỏ (70,4% ≈ frameIdx 70,0%, không lợi ích; đính chính H5) |
| 2764–2766 | đã bỏ sau khi đo 0/30 clean — xem LIMITS §2 | 70,4% ≈ frameIdx 70,0% mọi occurrence, không lợi ích — đính chính H5; xem LIMITS đợt 105 G1 §3.2 |

- Kiểm chứng "chỉ comment": marker `104f3` vẫn **50 dòng / 58 lần xuất hiện**
  (như G1/G9 đếm); grep `rawAnchor` = 13 dòng, TẤT CẢ là comment (0 dòng code);
  `F3AnchorSrc` vẫn `"tap" | "pump" | "frameIdx"`. Các comment khác nhắc rawAnchor
  mà không ghi số (dòng 1526, 1989, 2765, 2823, 2833) giữ nguyên — chúng đúng.
- Chuỗi "0/30" còn lại trong file (4 chỗ) đều nằm trong cụm "số '0/30 clean' cũ là
  artifact dedup, đính chính đợt 106 H5" — tức là đính chính, không còn chỗ nào
  trích 0/30 như số đo thật.

## 3. Sửa analyzer distinct (c) — bias hết

### 3.1 Lỗi cũ và cách sửa

Analyzer cũ (`round104-f3/analyze-f3.py`, `analyze-f3-flip.py`) dedup theo cặp
`(label, pix)` và gán mỗi cặp cho labelSrc của lần xuất hiện ĐẦU TIÊN (G1 §3.2).
Tick tap chiếm 95–98% nên cặp sạch gần như luôn xuất hiện đầu tiên dưới nhãn tap →
rawAnchor chỉ còn lại các cặp KHÔNG BAO GIỜ xuất hiện dưới nhãn tap (tập đã chọn lọc âm).

**Sửa (2 file mới trong repo `apps/web/scripts/`):**
- `analyze106h5-ghost.py` (từ `analyze-f3.py`): dedup theo
  `(label, pix, labelSrc)`; thêm mục `H5 ALL-OCCURRENCES` — cùng phân loại nhưng
  đếm mọi lần snapshot xuất hiện (không dedup), báo headline + breakdown labelSrc.
- `analyze106h5-ghost-flip.py` (từ `analyze-f3-flip.py`): cùng sửa dedup ở bonus
  flip + thêm bonus mọi occurrence. **Phát hiện thêm khi sửa:** vòng lặp breakdown
  labelSrc của flip analyzer vốn THIẾU `"rawAnchor"` trong danh sách (chỉ có
  tap/pump/frameIdx/off) — rawAnchor không được in ra ở cả distinct lẫn (trong bản
  H5 đầu tiên) mọi occurrence. Đã thêm `"rawAnchor"` vào cả hai vòng lặp. Đây là
  thiếu sót trình bày, không ảnh hưởng headline tổng.
- Bản làm việc trong `hidden_files/round106-h5/` (`analyze-f3-h5.py`,
  `analyze-f3-flip-h5.py`) giống hệt bản repo trừ `SCRATCH` mặc định.
- Lỗi sửa trong lúc làm: lần chạy đầu analyzer mới crash `ValueError: too many
  values to unpack` ở vòng lặp `for (lab, _pix), (t, g) in seen.items()` vì key
  nay là 3-tuple — đã sửa thành `(lab, _pix, _src)`. Ghi để luồng sau khỏi lặp lại.

### 3.2 Trước/sau trên dữ liệu cũ (distinct, chỉ ca đơn-nghĩa)

| Run | Cũ: headline | Mới: headline | Cũ: rawAnchor | Mới: rawAnchor | Mới mọi occurrence: rawAnchor |
|---|---|---|---|---|---|
| A baseline | 43/94 = 45,7% | 43/94 = 45,7% (không đổi — 1 labelSrc) | — (off) | — (off) | off 209/379 = 55,1% |
| B | 68/96 = 70,8% | 89/122 = 73,0% | 0/11 = 0,0% | 20/31 = 64,5% | 64/96 = 66,7% |
| B2 | 67/88 = 76,1% | 82/103 = 79,6% | 0/6 = 0,0% | 14/20 = 70,0% | 48/70 = 68,6% |
| B3 (code land) | 68/78 = 87,2% | 71/82 = 86,6% | — (frameIdx 1/3 = 33,3%) | frameIdx 3/6 = 50,0% (n nhỏ) | frameIdx 21/30 = 70,0% |
| C flip (hậu flip+2000) | 67/91 = 73,6% | 99/125 = 79,2% | 0/13 = 0,0% | 32/47 = 68,1% | 104/141 = 73,8% |
| D flip baseline | 68/140 = 48,6% | 68/140 = 48,6% (không đổi) | — (off) | — (off) | off 1149/1595 = 72,0% |

- **Bias hết:** rawAnchor distinct nay 64,5% / 70,0% / 68,1% — khớp mọi occurrence
  66,7% / 68,6% / 73,8% trong sai số lấy mẫu (n distinct 20–47). Không còn labelSrc
  nào báo 0% clean. Tap distinct cũng hạ về gần thực hơn (B 79,8%→75,6%;
  B2 81,5%→81,7%; flip C 85,9% không đổi) — thổi phồng tap đã hết.
- **Headline nhích nhẹ** (+2,2 / +3,5 / −0,6 / 0 / +5,6 / 0 điểm) vì tập distinct
  lớn hơn (cặp xuất hiện dưới 2 labelSrc nay đếm 2 lần: B 117→144 hàng, det 96→122).
  Thứ hạng các run không đổi; mọi run vẫn trên/dưới bar như cũ (B/B2/B3 trên 70%,
  A/D dưới). Bar G1 đợt 105 KHÔNG cần sửa lại — nhưng từ nay mọi số distinct mới
  phải trích kèm "cách đếm mới (dedup theo labelSrc)", không so tuyệt đối với số
  distinct cũ.
- **Kiểm chứng implementation:** phép đếm mọi occurrence mới tái tạo CHÍNH XÁC số
  G1 trong `all-occurrences-clean.txt` trên cả 6 run (B 3474/3598 = 96,6%;
  B2 4483/4580 = 97,9%; B3 4953/4997 = 99,1%; A 209/379 = 55,1%;
  C 1935/2013 = 96,1%; D 1149/1595 = 72,0%) — khớp từng số, không chỉ khớp hướng.
- **Caveat còn lại của distinct (đã biết, G1 §2.6):** distinct vẫn trọng số mỗi cặp
  1 lần nên tuyệt đối thấp hơn mọi occurrence (cặp sạch lặp lại nhiều pass bị
  đếm 1 lần, cặp mislabel độc nhất được đếm đủ) — vd tap distinct B 75,6% vs mọi
  occurrence 97,4%. Chỉ so sánh TƯƠNG ĐỐI trong cùng phép đếm; không so tuyệt đối
  giữa hai phép đếm. Breakdown anchorSrc theo tick cũng đổi theo (vd flip C:
  anchor=tap 67/88 → 96/119) vì hàng tách theo labelSrc mang theo tick khác nhau —
  đó là hệ quả đúng của sửa dedup, không phải số mới sai.

## 4. Flip-leg trên cây land (b) — KHÔNG ĐẠT bar dưới tải nặng

### 4.1 Kết quả đo mới (analyzer mới, cây đã sửa comment, md5 `ced42efd…`)

| Chỉ số | C2 (land) | C2b (lặp lại) | Gộp | C cũ (F8+F8b, tải nhẹ) |
|---|---|---|---|---|
| BlendTick / pass | 951 / 20 pass | 935 / 20 pass | 1886 | 1775 / 20 pass |
| Khung rAF / pass | 39–87 | 36–77 | — | 34–136 (pass 1–10: 127–136) |
| **Clean distinct hậu flip+2000ms** | **100/146 = 68,5%** | **97/154 = 63,0%** | **197/300 = 65,7%** | **99/125 = 79,2%** (cách đếm mới) |
| Bar (≥70% và ≥ D+20pt = 68,6%) | **KHÔNG ĐẠT** (−0,5pt / −0,1pt) | **KHÔNG ĐẠT** (−7,0pt) | **KHÔNG ĐẠT** | Đạt |
| Nhãn tap clean (distinct) | 68/85 = 80,0% | 67/90 = 74,4% | — | 67/78 = 85,9% |
| Nhãn frameIdx clean (distinct) | 32/61 = 52,5% | 30/64 = 46,9% | — | rawAnchor 32/47 = 68,1% |
| Độ phủ anchor tap hậu flip (tick) | 591/710 = 83,2% | 549/666 = 82,4% | 82,8% | 950/1028 = 92,4% |
| Clean mọi occurrence | 1160/1302 = 89,1% | 1048/1242 = 84,4% | 2208/2544 = 86,8% | 1935/2013 = 96,1% |
| Mọi occurrence: tap / fallback | 94,8% / 67,0% | 92,5% / 47,8% | — | 97,8% / 73,8% (rawAnchor) |
| Gap presented−expected \|≤3\| | 100% mọi cửa sổ | 100% mọi cửa sổ | — | 100% |
| Gap tại seek hậu flip | 0 hoặc 1 (14/14 seek) | 0 hoặc 1 | — | 0 hoặc 1 |
| tickCost total trung vị / p90 | 14,1 / 71,8 ms | 13,4 / 72,8 ms | — | 6,7 / 18,0 ms |
| rAF gap blend-tick trung vị / p90 | 32,0 / 94,9 ms | 30,2 / 91,7 ms | — | 18,0 / 67,5 ms |

- **C2 chỉ trượt bar trong gang tấc** (68,5% vs 70%; 68,5% vs 68,6%) nên H5 đo lặp
  C2b theo tiền lệ G1 (B sát bar → đo B2). C2b còn thấp hơn (63,0%) — không phải
  nhiễu may rủi một lần: cả hai lần đo dưới tải nặng đều dưới bar.
- Gap presented−expected vẫn bounded 100% |≤3| ở mọi cửa sổ hậu flip cả hai run —
  cơ chế tap giữ anchor qua pump chết + seek vẫn đứng; cái tụt là clean của snapshot,
  không phải gap presented.

### 4.2 Vì sao tụt — tải, không phải code land

1. **Độ phủ tụt rõ rệt:** 92,4% (C) → 83,2% / 82,4% (C2/C2b). Tụt phủ trải đều
   mọi pass (C2: 67–100%/pass, đa số 73–89%; C2b: 61–93%/pass), không phải một
   pass hỏng — đúng dấu hiệu tải nặng kéo dài, không phải stall đơn lẻ.
2. **Tải nặng đo được:** tickCost trung vị gấp ~2× (14,1/13,4 vs 6,7ms), rAF gap
   trung vị gấp ~1,8× (32,0/30,2 vs 18,0ms), khung rAF/pass ~40–60 vs ~130 ở
   10 pass đầu của C (tức rAF ~20–25fps thay vì ~60fps). Load1 lúc đo 5–6,5
   (luồng đợt 106 khác chạy song song); RAM khả dụng 1,7–2,3 GB.
3. **Fallback không tệ đi vì code land:** fallback mọi occurrence C2 67,0% ≈
   rawAnchor C 73,8% ≈ frameIdx B3 70,0% (cùng dải, n=226–267). Nếu code land làm
   fallback tệ đi thì C2 phải thấp hơn hẳn C ở cùng độ phủ — không thấy.
   Suy luận chặn dưới G1 §4.3 (code change chỉ đổi ~13 snapshot distinct) KHÔNG
   bị bác: độ lệch quan sát (79,2%→68,5%/63,0%) lớn gấp nhiều lần tác động tối đa
   của code change, và đi cùng chiều với tụt phủ + tăng tải.
4. **Lưu ý nhiễu:** frameIdx mọi occurrence C2b chỉ 47,8% (108/226) so với C2 67,0%
   (179/267) — chênh lệch lớn giữa hai lần lặp cùng điều kiện. Với n~250, SE ~3,3%
   nên chênh 19pt là thật về mặt thống kê trong hai mẫu này, nhưng chưa rõ nguyên
   nhân (có thể do phân bố tuổi anchor trong các tick fallback khác nhau giữa hai
   run). H5 KHÔNG suy diễn thêm từ một con số này; báo gộp (C2+C2b fallback mọi
   occurrence: 287/493 = 58,2%) và ghi là nợ cần mẫu lớn hơn.

### 4.3 Spread — đuôi lỏng VẪN MỞ (e, một phần)

| Run | Cửa sổ đã vẽ: nGroups / median / max |
|---|---|
| C (G1) | 137 / 0,8 / 74,7 |
| C2 (land) | 74 / 0,5 / 47,5 |
| C2b (land) | 73 / 0,9 / 75,4 |
| D (G1 baseline) | 105 / 46,2 / 75,7 |

- C2 max 47,5 thấp hơn hẳn, nhưng chỉ 1 run dưới mật độ lấy mẫu thấp hơn (74 nhóm
  vs 137) — KHÔNG kết luận spread đã cải thiện. C2b max 75,4 = đuôi lỏng max ~75
  vẫn còn nguyên. Median không dùng làm bằng chứng (E3 §3.5: artifact lưỡng đỉnh).
- **F6' pixel-verified skipLatest cho WebKit: KHÔNG LÀM** — không có driver ghost
  cho WebKit (G1 §0: tap/relabel vô dụng trên WebKit theo thiết kế vì rVFC không
  bắn); chỉ có phác E3 §6.1, chưa có thiết kế đo được trong phiên này. Vẫn mở.

## 5. Độ phủ → clean (d) — gradient dưới tải có ghi nhận (không kiểm soát)

Distinct, cách đếm mới (trừ E3 ghi chú):

| Nguồn | Độ phủ anchor tươi | Clean distinct | Tải ghi nhận |
|---|---|---|---|
| E3 B (cách đếm cũ) | 34% | ~49,5% | tải nặng |
| H5 C2b flip | 82,4% | 63,0% | tickCost 13,4ms, load1 ~5–6,5 |
| H5 C2 flip | 83,2% | 68,5% | tickCost 14,1ms, load1 ~5–6,5 |
| G1 C flip | 92,4% | 79,2% | tải nhẹ–trung bình |
| G1 B case B | 94,6% | 73,0% | tải nhẹ–trung bình |
| G1 B2 case B | 98,2% | 79,6% | tải nhẹ |
| G1 B3 case B | 99,1% | 86,6% | tải nhẹ nhất |

- Clean tăng đơn điệu theo độ phủ (trừ B 94,6% → 73,0% thấp hơn C 92,4% → 79,2%
  — nhiễu giữa case B và flip, hoặc khác biệt protocol; không ép thành đường thẳng).
- **Giới hạn:** tải KHÔNG kiểm soát — là tải nền từ các luồng đợt 106 khác, không
  phải tải tổng hợp do H5 tạo. H5 KHÔNG chạy thêm tải tổng hợp vì sẽ nhiễu probe
  của luồng khác. Gradient trên là quan sát, không phải thí nghiệm A/B tải.
  Muốn điểm tải kiểm soát thật: chạy case B với `sysload` có ghi mức + đo phủ —
  để cho đợt sau, lúc máy yên.

## 6. Kiểm chứng hồi quy (cây đã sửa comment, md5 `ced42efd…`)

- `tsc` apps/web (`npx --prefix apps/web tsc --noEmit -p apps/web/tsconfig.json`): **exit 0**.
- `vite build` (từ `apps/web`, config gốc): **PASS 12,43s** (cảnh báo chunk >500kB có từ trước).
- `ghostBlend.probe.test.ts` (`node --experimental-strip-types`): **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- Không sửa file production nào khác; không đụng drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / TTS 39 / birefnet / `.github/workflows`.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `apps/web/src/preview.tsx` — chỉ sửa 6 comment sai số (md5 `f0b9e496…` → `ced42efd…`).
- `apps/web/scripts/analyze106h5-ghost.py` — analyzer distinct đã sửa (mới).
- `apps/web/scripts/analyze106h5-ghost-flip.py` — analyzer flip đã sửa (mới).
- `docs/PHASE9_ROUND106_H5_GHOST_LIMITS.md` — file này.
- XOÁ (không stage): `apps/web/vite.config.h5-temp.ts` — config tạm của H5,
  xoá sau khi đo xong như kế hoạch.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round106-h5-ghost.txt`
  (NUL-delimited, 4 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h5/`
  (boot.log, chain-h5.log, 2 log run probe flip, 2 JSON flip, 4 output analyzer mới
  trên dữ liệu cũ, 2 output analyzer flip mới trên dữ liệu cũ, 2 output flip C2/C2b,
  regression-h5.log, vite log, probe + analyzer bản làm việc).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Flip-leg trên cây land — VẪN MỞ, cần đo lại lúc máy yên.** C2/C2b dưới tải nặng
   không đạt bar (68,5% / 63,0%); C cũ dưới tải nhẹ đạt (79,2% cách đếm mới).
   Chưa thể kết luận flip-leg land đạt hay không đạt — chỉ kết luận được là nó
   phụ thuộc tải. Đợt sau (lúc máy yên, load thấp): chạy lại đúng protocol C2
   (case B, 20 pass, `--disable-rvfc`, flip sau pass 5) bằng analyzer mới và
   so với D 48,6% + bar 70%. KHÔNG sửa logic để cứu số.
2. **Analyzer distinct — ĐÃ SỬA, dùng bản mới từ nay.** Mọi luồng sau dùng
   `analyze106h5-ghost.py` / `analyze106h5-ghost-flip.py` (dedup theo labelSrc +
   kèm mọi occurrence). Số distinct cũ (E3/D2/C2/G1) KHÔNG so tuyệt đối với số
   distinct mới — khi trích lại phải ghi rõ cách đếm. Headline tổng không bị
   ảnh hưởng về kết luận, chỉ nhích vài điểm.
3. **Ghost residual — headline phụ thuộc độ phủ (G1 §4.4, nay có thêm bằng chứng).**
   Dưới tải nặng (phủ ~83%) clean flip chỉ 63–68,5%. Hướng còn đứng: tăng độ phủ
   anchor dưới tải (giảm tải probe; hoặc nới gate 50ms → 75ms kèm đo lại bằng phép
   đếm mọi occurrence — số distinct D2 cũ chịu bias nên không dùng).
4. **F6' WebKit — VẪN MỞ (chỉ phác E3 §6.1).** Cần driver ghost cho WebKit trước
   mới đo được; tap/relabel vô dụng trên WebKit theo thiết kế.
5. **Spread — VẪN MỞ.** Đuôi lỏng max ~75 còn nguyên ở C2b; C2 max 47,5 là 1 run,
   không kết luận. Báo phân bố, không báo median.
6. **Nợ khác đứng yên theo LIMITS gộp đợt 105 §5:** G1 chờ user quyết metric (G5/M2);
   Re-arm A/B RAM cao; 2 MiB (queue2 ứng viên); Zombie gate (b); B-band c0 (p=0,22);
   EPERM probe #25 + mù #24; mù #22 chờ user quyết; G4 flake 2/21; birefnet 0 lần;
   TTS 39 CẤM kiểm lại; ci-security.yml 403; release gate không đổi.

# PHASE9_ROUND97_Y6_BLUR_FIX3_LIMITS — blur parity fix-3: thêm lượt chr-blur + wk-blur, tách B-band

> Luồng Y6, đợt 97. Lượt cron 18:35 +07 12/11/2026 (driver 11:37:54–11:43:26Z,
> boot d8dc09fe = reboot #19, 11:30Z).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Không sửa production trong luồng này** — chỉ đo. Không đụng
> `.github/workflows`, 0 binary. Harness mới duy nhất:
> `apps/web/scripts/probe97y6-frame-parity.mjs` (copy probe96x5b, đổi SCRATCH
> sang round97-y6; `node --check` OK).

## 0. Môi trường + build nào đo cái gì (QUAN TRỌNG — file bị sửa giữa lượt)

- Build gốc fix-3 X2+X4: `preview.tsx` md5 `6cac637d`, mtime 09:41:00Z,
  ring=3, marker "Đợt 96 X2" ×16 + "Đợt 96 X4" ×5 (khớp X5b).
- **Hai luồng song song Y2 + Y5 sửa `preview.tsx` giữa lượt đo của Y6**
  (không phải lỗi Y6 — vòng lặp đợt 97 chạy song song):
  - Y2 (13 marker): log pump event mở rộng — **chỉ đo, không đổi hành vi
    blend** (ghi rõ trong code: "chỉ đo, không đổi hành vi blend").
  - Y5 (4 marker): watchdog kill "no-callback-frozen" (nợ mở đợt 96 §4
    mục 6: kill theo thời gian khi element đóng băng) — **đổi hành vi
    watchdog/fallback, KHÔNG đổi toán blend** (ring capacity frames,
    skip logic X2, `compositeMotionBlurLayer` nguyên vẹn — đã kiểm bằng
    đọc code §3).
- Dòng thời gian md5: `6cac637d` → (giữa chr-blur-r8) `18078068` →
  `484125f9` (11:41:28Z) → `9a9812e5` (11:41:59Z, ổn định tới cuối lượt).
- Hậu quả theo lượt (probe ghi `mtimeChanged` + md5 trước/sau):
  | lượt | build lúc phát | mtimeChanged | kết luận |
  |---|---|---|---|
  | chr-blur-r7 | 6cac637d toàn lượt | false | **SẠCH fix-3** (nhưng nhiễm tải, xem §0.1) |
  | chr-blur-r8 | 6cac637d lúc boot page; sửa giữa lượt | true | pixel vẫn là code fix-3 trong bộ nhớ (HMR tắt, module đã load lúc boot ~11:40:42Z); gắn cờ, không loại |
  | wk-blur-r6 | 484125f9 lúc phát → 9a9812e5 cuối lượt | true | build lai Y2/Y5 giữa chừng |
  | wk-blur-r7 | 9a9812e5 toàn lượt | false | **SẠCH build mới (fix-3 + Y2 + Y5)** |
- Vì Y2/Y5 không đụng toán blend, **số liệu cụm D/A/B/C của cả 4 lượt đều
  dùng được** cho câu hỏi Y6 (tần suất D, tách B-band). Số liệu cửa sổ mù
  / fbAt / ringFirstAt thì CHỈ ghi nhận (§5) — Y5 đổi đúng vùng đó.
- Tải: r7 chờ yên 120 s không đạt (load1 4,70→2,97 lúc phát — nhiễm tải
  nặng, caps chỉ 122 so với 263 ở r6); r8 load1 1,57; wk r6 1,21; r7 1,78.
  RAM khả dụng 824–2120 MB. 0 pageErr, 0 collision cả 4 lượt.

### 0.1 Hạn chế harness (ghi để khỏi làm lại)

- `state100` cắt 1200 mẫu: chr-blur-r7 chạm trần (1200) vì chờ yên 120 s
  trước phát — mất timing đầu lượt (đúng nợ X5 §7.5, chưa sửa trong Y6).
- Baseline wk-baseline chỉ có **77 key** (W3 wk-noblur thưa) so với
  chr-baseline 241 key → phân tích chính (baseline theo engine như X5)
  chỉ dùng được 16/53 cap wk (30%). Đã cứu bằng baseline chr (§4).
- `tagAgree` thấp ở lượt nhiễm tải: r7 154/261 (59%), r8 169/267 (63%);
  wk r6 88/129 (68%), r7 70/108 (65%) — nhãn tick/draw lệch nhau nhiều
  hơn r6 (85%), đúng như X5 ghi dưới tải.

## 1. Kết quả chính

### (a) Tần suất cụm D trên Chromium fix-3 — XÁC NHẬN ~1%, KHÔNG về 0

| lượt | D n / tổng | % | mean | nhãn |
|---|---|---|---|---|
| chr-blur-r6 (X5b, đối chứng) | 2 / 234 | 0,9% | 0,307 | ringSize=2, skipped=1, c2 fi 1–2 |
| chr-blur-r7 (Y6, fix-3 sạch) | 1 / 108 | 0,9% | 0,307 | ringSize=2, skipped=1, c0 fi=9 |
| chr-blur-r8 (Y6, fix-3 trong bộ nhớ) | 0 / 115 | 0,0% | — | — |
| **gộp r6+r7+r8** | **3 / 457** | **0,7%** | **0,307 (sd 0,001)** | — |

- **Verdict (a): tần suất D fix-3 = ~1% (0,7% gộp 3 lượt), giảm từ 13%
  (fix-1, r5) — XÁC NHẬN, không phải nhiễu 1 lượt.** D không về 0.
- Tâm cụm không đổi: D 0,307 / A 0,440 / B 0,772 / C 1,000 (gộp chr
  fix-3: A n=306 sd 0,004; B n=130 sd 0,010; C n=18 sd 0,006; 0 mẫu
  ngoài-dải trong cả 4 lượt Y6 — thang đo ổn định).
- Tinh chỉnh so với X5 ("D chỉ còn ở đầu clip khi ring chưa đủ 3"): D ở
  r7 nằm ở **c0 fi=9, relPlay 1929 ms — giữa clip c0, không phải đầu
  clip**. Cơ chế đúng hơn: D xuất hiện **bất cứ khi nào ring thoáng qua
  size 2** — đầu clip, hoặc pump thưa dưới tải (r7: tới relPlay 1929 chỉ
  có 2 capture: frame 3 @1681, frame 9 @1890; ring = {3,9}).

### (b) B-band WebKit — TÁCH ĐƯỢC Ở MỨC QUẦN THỂ, KHÔNG SẠCH TỪNG MẪU

**Phân tích chính (baseline theo engine, như X5): B wk n=8 — KHÔNG đủ.**

| gộp | B n / tổng | mean | med | sd | pair-like [0,70–0,76) | dc-like [0,76–0,82] |
|---|---|---|---|---|---|---|
| r4+r5 (X5) | 5 / 19 | 0,778 | 0,783 | 0,011 | 1 (0,760) | 4 |
| r6+r7 (Y6) | 3 / 16 | 0,768 | 0,771 | 0,009 | 1 (0,759) | 2 |
| **r4+r5+r6+r7** | **8 / 35** | **0,774** | **0,775** | **0,012** | **2 (0,759–0,760)** | **6 (0,762–0,788)** |

2 mẫu "pair-like" 0,759–0,760 lệch +0,016–0,017 so với dự đoán pair
0,743 (vượt dung sai mô hình ±0,006) — với n=8 không thể kết luận tách.

**Phân tích bổ sung — cứu cap bằng baseline chr (§4): B wk n=36 — TÁCH
ĐƯỢC Ở MỨC QUẦN THỂ.** Chi tiết §4; tóm tắt:

| gộp wk (chr-base cứu) | B n / tổng | mean | med | sd | pair-like | dc-like |
|---|---|---|---|---|---|---|
| r4 | 13 / 34 | 0,772 | 0,780 | 0,015 | 3 | 10 |
| r5 | 7 / 21 | 0,759 | 0,759 | 0,020 | 5 | 2 |
| r6 | 9 / 30 | 0,766 | 0,760 | 0,010 | 5 | 4 |
| r7 | 7 / 22 | 0,761 | 0,759 | 0,011 | 4 | 3 |
| **r4+r5+r6+r7** | **36 / 107** | **0,766** | **0,767** | **0,016** | **15 (mean ~0,752)** | **21 (mean ~0,777)** |

- **Verdict (b): B-band WebKit LÀ hỗn hợp pair + double-count, với
  double-count chiếm đa số (~58%, 21/36) và pair chiếm ~42% (15/36) —
  tách được ở mức quần thể (hai nhóm lệch nhau ~0,025, mỗi nhóm sd
  ~0,01). NHƯNG không tách sạch từng mẫu: giá trị tạo thành dải liên
  tục 0,723–0,788, không có khe bimodal; nhóm pair-like mean ~0,752,
  lệch +0,009 so với dự đoán 0,743; 28/36 mẫu B dựa vào baseline chr
  (sai số chéo-engine tới ±0,017 trường hợp xấu nhất).**
- Vì sao wk B trải rộng hơn chr B (sd 0,016 vs 0,010): trên wk snapshot
  thưa — nhãn `last−pres` của các cap B là −1, −2, −6, −7, −23, −28
  (trình chiếu cách nhau ~18 khung ≈ bội chu kỳ sọc, X5 §1.3) — cửa sổ
  blend thực tế có gap pha gần như ngẫu nhiên, nên tỉ lệ trải liên tục
  thay vì tụ thành 2 cụm rời như chr. Nhãn `ringSize/skipped` trên wk
  không tách được: r4/r5 không có nhãn (−1,−1, n=21); r6/r7 toàn
  `skipped=0` (wk không pump → skip không kích hoạt), ringSize 1–3.
- Hệ quả cho debt #2 (double-count chr): wk xác nhận double-count tồn
  tại độc lập với pump (wk pump=0 cả 4 lượt Y6, silentEngine=true) —
  double-count sinh ra ở đường tick/blend, không riêng đường pump.

### Phát hiện phụ: cụm D TỒN TẠI trên WebKit (lần đầu)

- Phân tích chính (wk-base): D wk n=1 (r6 c2 fi=16, 0,305).
- Với chr-base cứu: **D wk n=3/107 (2,8%)** — r5 c1 fi=14 (0,303),
  r6 c0 fi=21 (0,301, ringSize=1, skipped=0), r6 c2 fi=16 (0,305).
  D trên wk không hiếm hơn trên chr (0,7% chr vs 2,8% wk, mẫu nhỏ) —
  X5 nói "chưa đủ để nói wk không có D" nay có câu trả lời: **wk CÓ D**.
  Lưu ý: 2/3 mẫu D wk dựa vào baseline chr (sai số ±0,017 xấu nhất —
  vẫn nằm gọn trong dải D [0,27–0,34], cách biên ≥0,03).

## 2. Cap D dị thường duy nhất — chr-blur-r7 c0 fi=9 (ghi nhận, không ép giải thích)

- Cap: c0 fi=9, g=0,307, tag=tick, relPlay=1929, ph=0,367,
  dbg ring=2, lastFrame=9, prevFrame=3, caps=2, lastDrawnPresented=9,
  ringSize=2, skippedLatest=1.
- Đọc theo nhãn + code `compositeMotionBlurLayer`: ring={3,9},
  lastCaptured=9=presented → skipLatest → ghostPool={3} → cửa sổ
  pair {3,9}, gap 6 → mô hình harmonic dự đoán **0,549**, nhưng đo
  **0,307** (khớp pair cách-2, lệch 0,242 — gấp ~40× dung sai mô hình).
- Bối cảnh: lượt nhiễm tải nặng (load1 2,97 lúc phát; tagAgree 59%;
  tick frameIdx nhảy ngược 12→4→7→3…; ph=0,367 ↔ fi=9 lệch ~2 khung;
  pump chỉ 2 capture tới thời điểm đó).
- Ứng viên giải thích (chưa phân biệt được, n=1):
  1. **Capture gán nhầm nhãn khi callback trễ** (giả thuyết X2 §3.3 /
     nợ #2): snapshot nhãn "3" chứa nội dung frame ~7 → cửa sổ thực
     {7,9} gap 2 → 0,307 đúng số đo. Đây là bằng chứng đơn lẻ ủng hộ
     cơ chế mislabel — nhưng n=1, không đủ để kết luận.
  2. Nhãn tick/ph lệch dưới tải: nội dung hiện tại thực tế là frame ~11
     (ph=0,367), nhãn tick 9 — sampler gắn sai frame cho pixels.
- Ảnh hưởng: KHÔNG đổi verdict tần suất D (cap vẫn là một phép đo dải D;
  chỉ attribution cửa sổ của riêng mẫu này là không chắc). Hai cap D r6
  (nhãn sạch {0,2}) vẫn là bằng chứng định danh D = pair cách-2.
- Nợ: cần pump event log của Y2 (đang được triển khai song song) để
  kiểm tra mislabel trên các cap D/B dị thường ở đợt sau.

## 3. Đọc code xác minh (không sửa production)

- `compositeMotionBlurLayer` (preview.tsx ~2126): ghost chỉ lấy snapshot
  cũ hơn presented P; skipLatest khi lastCaptured==presented; plan co
  lại theo số ghost thực dùng — đúng mô tả X2. Ring capacity = frames
  (dòng 3488, "Đợt 96 X2") còn nguyên sau edit Y2/Y5.
- Y2 `recordRvfcBlendTick` (~2233–2261): chỉ ghi log, không đổi hành vi.
- Y5 frozen-kill (~1599, ~1999): chỉ thêm nhánh kill watchdog khi frame
  không tiến; không chạm `compositeMotionBlurLayer`, ring, hay skip.

## 4. Phương pháp cứu baseline chr (phân tích bổ sung §1b)

- Vấn đề: baseline wk (W3 noblur r1+r2) chỉ có 77 key (clip, frameIdx)
  vì wk trình chiếu thưa; 37/53 cap wk-blur Y6 thiếu key → bị loại ở
  phân tích chính (chỉ dùng 16/53 = 30%).
- Kiểm chứng chéo-engine trước khi cứu: trên 65 key chung, chr−wk
  mean +0,143, sd 0,528, max |d| 1,395 (≈ gStdRatio ≤0,0172, điển hình
  ~0,0065). Baseline chr mean 81,17 vs wk 80,96 (chênh 0,26%).
- Cách cứu: cap wk thiếu key wk-baseline thì dùng baseline chr cùng key;
  72/107 cap wk gộp được cứu (r4 +21, r5 +15, r6 +21, r7 +15).
- Kiểm chứng cứu không làm lệch tâm cụm: với chr-base, wk A mean 0,439
  (wk-base: 0,439), C 0,997 (wk-base: 1,000), D 0,303 (wk-base: 0,305) —
  tâm cụm tái hiện trong ±0,003. B mean 0,766 (wk-base n=8: 0,774 —
  chênh 0,008, trong sai số cứu).
- Giới hạn: mọi con số có gắn "chr-base" mang sai số thêm tới ±0,017
  (xấu nhất) — đủ để kết luận ở mức quần thể (§1b), không đủ để gán
  từng cap B vào pair hay double-count.

## 5. Cửa sổ mù wk — chỉ ghi nhận (Y5 đổi watchdog giữa chừng)

| lượt (build) | fbAt c0/c1 | ringFirstAt c0/c1/c2 | silent | pump |
|---|---|---|---|---|
| wk-blur-r6 (lai Y2/Y5) | 1314 / 5915 | 1314 / 5915 / 8500 | true | 0 |
| wk-blur-r7 (fix-3+Y2+Y5 sạch) | 3187 / 7676 | 3187 / 7676 / 10999 | true | 0 |

- So với X5 (r4/r5): fbAt c0 ~1300–1900, c1 ~5900–7700 — r7 c0 (3187)
  và c2 (ring 10999, tức lấp ring 5 s sau khi vào c2) tệ hơn rõ rệt.
  Chưa rõ do Y5, do tải, hay do playhead chạy chậm hơn wall-clock
  (relPlay cuối lượt r7 ~11 s cho 9 s timeline). **Không phân tích sâu
  trong Y6** — cần luồng riêng đối chiếu Y5 (watchdog) với cùng điều
  kiện tải. Ghi nhận để Y5 / đợt sau xử lý, không kết luận Y5 làm tệ
  hơn.
- Chr đối chứng: ringFirstAt r7 1771/4781/7832; r8 136/3289/6561 —
  pump lấp ring trong 0,1–1,8 s, bình thường.

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- 4 lượt, 0 pageErr, 0 collision; caps JSON 122/126/31/22 (dùng được
  sau baseline: 108/115/9+21/7+15 — xem §4); pump chr 162/159, wk 0/0;
  silentEngine wk true cả 2 lượt (đúng như X5: wk 0 callback cả phiên).
- Không sửa production → không chạy tsc/build/test suite (tiền lệ X5:
  build đã được X2/X9b kiểm chứng tsc 0 + build PASS + O8 21/21;
  Y6 chỉ thêm probe harness, `node --check` OK).
- Dữ liệu: `hidden_files/round97-y6/` (driver97y6.log/.out/.sh,
  chr-blur-r7/r8, wk-blur-r6/r7, analyze97y6.py + analysis.txt +
  analysis.json, supplement.txt).
- Batch stage: `phase9-round97-y6-blur-fix3.txt` — 2 entry, read-back
  OK, 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND97_Y6_BLUR_FIX3_LIMITS.md` (file này)
  - `apps/web/scripts/probe97y6-frame-parity.mjs` (probe Y6 mới)

## 7. Nợ mở cho đợt sau (từ Y6)

1. **D fix-3 đã chốt tần suất ~1% (0,7% gộp 457 cap chr)** — nhưng D vẫn
   xuất hiện khi ring thoáng qua size 2 dưới tải; muốn về 0 cần cơ chế
   giữ ring đủ 3 ngay cả khi pump thưa (hoặc chấp nhận ~1% là sàn).
   Đóng mục 5 (đợt 96 §4) ở mức "đã đo đủ, tần suất ~1%".
2. **B-band wk: tách được ở mức quần thể (pair ~42% / dc ~58%),
   không sạch từng mẫu.** Muốn tách sạch cần nhãn cửa sổ tin cậy hơn
   trên wk (pump event log Y2 + tick snapshot content) hoặc tăng số lượt
   wk lên n≈100 cap B. Đóng mục 8 (đợt 96 §4) ở mức "tách quần thể,
   còn mở ở mức từng mẫu".
3. **Cap D r7 dị thường ({3,9}→0,307):** kiểm tra bằng pump event log
   Y2 ở đợt sau — 1 điểm dữ liệu ủng hộ giả thuyết capture mislabel
   (nợ #2 double-count).
4. **Cửa sổ mù wk r7 tệ hơn X5** (c2 ring 10999): cần luồng riêng đối
   chiếu Y5-watchdog; Y6 không kết luận.
5. **Harness:** baseline wk chỉ 77 key — lần sau chạy thêm lượt
   wk-noblur để dày baseline wk thay vì cứu bằng baseline chr;
   state100 cắt 1200 mẫu (mất timing khi chờ yên lâu — nợ X5 §7.5
   vẫn mở).
6. **Va chạm đo giữa luồng (bài học lặp lại):** Y2/Y5 sửa preview.tsx
   giữa lượt đo Y6 (3 md5 khác nhau trong ~1 phút). Các lượt đo sau nên
   ghi md5 trước/sau như probe đã làm (Y6 đã làm) và parent cần lưu ý
   khi gộp: cluster data vẫn dùng được vì toán blend không đổi, nhưng
   số liệu watchdog/fallback của các lượt lai phải gắn cờ build.

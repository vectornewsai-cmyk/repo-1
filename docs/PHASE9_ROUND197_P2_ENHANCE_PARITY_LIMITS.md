# PHASE9 ROUND197 — P2 ENHANCE PARITY LIMITS (N10 + sửa B1)

Đợt 197, luồng P2 — Editing Core, preview/render parity (đợt thứ 7 theo hướng mới, lệnh user 15:03 25/11).
Nguồn quyết: aggregate 196 bản parent-đã-đính-chính (84.800 B; §14.2-196 NGUỒN GỐC CHƯA NGÃ NGŨ).
Hạn cờ ~23:00Z 26/11; hạn cứng 23:35:51Z. KHÔNG PUSH. tsc 0 lỗi, build PASS, test liên quan PASS (trừ 1 test psola của P1-197 — xem §5).

## 0. Tóm tắt

- **N10: VẪN CHƯA ĐẠT dưới thước P4** — nhưng mâu thuẫn P2/P4 đã khép: mô hình hai phía GIỐNG HỆT nhau
  (tái tạo khớp P4 từng chữ số); "ĐẠT" của P2 chỉ là MAD-only trên fixture khác, P2 không hề tính R_rel;
  ngay cả tap (w=1,0) cũng FAIL R_rel trên fixture P4. Không tồn tại (m,w) toàn cục nào cho cả N10+N5b cùng đạt.
- **w 0,75 → 0,8 (ĐÃ SHIP):** N10 MAD QUA cửa (6,240 vs tap 6,243, gap −0,003); R_rel 0,158 → 0,155
  (vẫn > 0,15); N5b không đổi (−0,053); 5 nhóm còn lại không hồi quy.
- **B1: sửa xong — chờ trang yên rồi mới đo** (tiêu chí yên §4); số đo headed: xem §4.
- **E1:** kỳ vọng w=0,8 rows [200,140,50,110,200,140,50,50] ±3; kết quả §4.
- Hướng sửa thật cho P2-198: α thích nghi theo chuyển động (field-pair delta tách được N10/N5b — §3.5).

## 1. N10 — khép mâu thuẫn P2 sim (−0,013, "ĐẠT") vs P4 harness (+0,013, R_rel 0,158)

### 1.1 Tái tạo fixture N10 P4 — khớp từng chữ số (probe-197-p2a)

Hàm pixel y hệt probe-195-p2a + công thức harness P4 (bob/tap/blend/denoise/σ̂). Kết quả:

| | tap | bob-first w=0,75 | gap | R_rel worst |
|---|---|---|---|---|
| N10 (P4) | 6,243 | 6,256 | +0,013 | **0,158** |
| N5b (P4) | 6,856 | 6,804 | −0,052 | 0,105 |

Per-frame N10: f3 tap 6,316 / w075 6,328 / R_rel 0,002; f7 6,381 / 6,391 / 0,105;
f11 6,031 / 6,049 / **0,158**. σ̂ inter 7,89/8,05/7,71 (avg 7,88); σ̂ prog 7,09/7,09/6,89 (avg 7,02);
αP4 = αProg = 0,485.

**Kết luận 1: mô hình hai phía giống hệt nhau.** Mâu thuẫn KHÔNG do mô hình tap hay định nghĩa R_rel.

### 1.2 Giả thuyết "P2 đo σ̂ ở điểm khác" — BỊ BÁC

σ̂_prog (7,02) THẤP hơn σ̂_inter (7,88) nhưng α không đổi (0,485); chạy lại với α từ σ̂_prog
cho đúng số P4. Điểm đo σ̂ không giải thích được lệch +0,013/−0,013.

### 1.3 P2 sim không hề tính R_rel — hai claim đúng trên fixture của riêng mình

"ĐẠT" của P2 chỉ là MAD-only trên một fixture khác (σ̂ ≈ 10,47; MAD ~7,05) so với fixture P4
(σ̂ 7,88; MAD ~6,59). P2 không tính R_rel nên không thấy f11. Không có lỗi số học ở phía nào.

### 1.4 Ngay cả tap cũng FAIL R_rel — R_rel worst do frame f11

Trên fixture P4, tap (w=1,0) cho R_rel 0,155 > 0,15. R_rel worst do frame f11 (R_truth=2,482 thấp nhất;
R_prev > R_truth, dR +0,39 ở w=0,75). Quét w trên fixture P4: MAD qua cửa ở w ≥ 0,8
(w=0,8: −0,003; w=0,85: −0,006) nhưng R_rel worst vẫn 0,155–0,158 với MỌI w ∈ [0,6; 1,0] —
**không w nào qua được cửa R_rel**. Cửa R_rel không phải là cửa chỉnh được bằng w.

### 1.5 Biến thể khác đều fail ít nhất một phía (probe-197-p2b)

- 3-tap [0,25; 0,5; 0,25] và gauss dọc σ=1,0: cải thiện R_rel nhưng PHÁ MAD (+0,14…+0,23).
- α×1,2: cứu N10 (MAD −0,034/−0,051, R_rel 0,127/0,129) nhưng PHÁ N5b (MAD +0,105/+0,112, R_rel 0,204).
- α s=0,8: tệ cả hai phía.

### 1.6 Không tồn tại (m, w) toàn cục (probe-197-p2c/d/e)

N10 cần m ≳ 1,035; N5b đã fail R_rel ở m ≳ 1,034; trong cửa sổ đó MAD N10 vẫn dương
(+0,002…+0,011 ở m=1,01–1,03). Có vách (cliff) trong đáp ứng theo α giữa α ≈ 0,495 và 0,504
(R_prev rơi ~0,2; MAD rơi ~0,17) — chưa giải thích được cơ chế, chỉ ghi nhận số liệu.
**N10 và N5b nằm hai phía của điểm tối ưu α** → hướng sửa là α theo chuyển động, không phải hằng số toàn cục.

### 1.7 Fixture N10 của P2 không tái tạo được

Mục tiêu: σ̂ ≈ 10,47; bob 7,053; tap 6,585; w075 6,572. Các giả thuyết đã thử (probe-197-p2b):

| Giả thuyết | σ̂ | bob | tap | gap w075 | Kết luận |
|---|---|---|---|---|---|
| H-noise20 | 9,46 | 7,106 | 6,650 | −0,001 | Gần nhất, vẫn không khớp |
| H-seed19600 | 7,90 | — | — | — | Không khớp |
| H-tinterlace | = P4 | 6,589 | 6,243 | 6,256 | **= hệt P4** — interlace vs tinterlace không quan trọng |
| H-32f | 7,68 | — | — | — | Không khớp |
| H-noise22 | 10,09 | 7,400 | — | — | Không khớp |
| H-noise25 | 11,03 | 7,880 | — | — | Không khớp |
| H-after | 8,20 | 5,849 | — | — | Không khớp |

Probe P2-196 (`probe-196-p2a.mjs`) đã mất trên đĩa — không khôi phục được. P4-194 LIMITS không có N10
(N10 sinh ở P4-195). Fixture gốc của P2-196 coi như không truy vết được; mọi số P2-196 về N10 chỉ dùng
được như claim, không kiểm chứng lại được trên fixture gốc.

## 2. Quyết w 0,75 → 0,8 (probe-197-p2f, 7 nhóm)

| Nhóm | tap | w=0,75 | w=0,8 | w=0,85 | w=1,0 | Ghi chú |
|---|---|---|---|---|---|---|
| mvpan | 5,987 | — | **5,929** | — | — | Thắng tap |
| mhpan | — | 8,200 | **8,188** | — | — | Tốt hơn 0,75 |
| mbarv | 3,376 | 3,567 | **3,514** | — | — | Tốt hơn 0,75, vẫn thua tap |
| mbarh | — | — | **3,329** | — | — | — |
| R-P2 sạch | — | 4,448 | **4,455** | — | — | Tệ hơn 0,75 chỉ +0,007 |
| N10 | 6,243 | 6,256 | **6,240** | 6,237 | 6,243 | w=0,8: gap −0,003 QUA MAD; R_rel 0,155 |
| N5b | 6,856 | 6,804 | **6,803** | — | — | Không đổi |

w=0,85 tương tự nhưng tệ hơn 0,8 ở mvpan/N5b → chọn **0,8**. Không hồi quy nhóm nào.
**N10 tổng thể vẫn CHƯA ĐẠT** dưới thước P4 (R_rel 0,155 > 0,15) — báo cáo trung thực, không dời bar.

## 3. Code đã đổi

1. `apps/web/src/lib/enhancePreview.ts`: `ENHANCE_PREVIEW_DEINT_VERTICAL_BLEND_W` 0,75 → **0,8** +
   comment (số probe-197-p2f; N10 vẫn CHƯA ĐẠT R_rel; hướng α theo chuyển động nợ P2-198).
2. `apps/web/src/components/enhance/enhancePreview91P2.test.ts`: 4 chỗ assert 0,75 → 0,8
   (constant, weight 2,7/3,66/8,14/11,3, plan, debug hook) + tên test + comment.
3. `apps/web/src/lib/parityHarness196.test.ts` (file của P4): 3 assert `deintVerticalBlendWeight(...)`
   0,75 → 0,8 + tên test — BẮT BUỘC để suite xanh (test tham số w=0,75 của `bobFirstPreview196`
   giữ nguyên — nó test hàm, không test hằng). P4-197 lưu ý khi đọc file này.

### 3.5 Đề xuất cho P2-198: α thích nghi theo chuyển động (chưa làm)

Độ chuyển động tách được hai fixture (đo trên khung sạch, progressive — probe /tmp/motion197.mjs):

| Fixture | meanAbsFrameDelta | meanAbsFieldPairDelta |
|---|---|---|
| N10 clean | 6,449 | **5,262** |
| N5b clean | 3,062 | **3,085** |

N10 chuyển động ~2,1× N5b (frame delta) / ~1,7× (field-pair). Trên khung nhiễu, delta bị nhiễu
chi phối (N10 13,213/12,185 vs N5b 10,229/10,25) nên tín hiệu chuyển động lúc chạy thật phải ước lượng
robust (trên khung đã bob/denoise hoặc luma low-pass), không dùng raw frame delta. Thiết kế thuộc P2-198.

## 4. Headed — B1 (chờ yên) + E1 + G5c + G5-short + H9

Harness: `hidden_files/round197-p2/headed-197-p2-bob.mjs` (vite :5790, debug :9790, DISPLAY :197,
cửa sổ 1280x1024; fixture `interlaced640.mp4` 592.378 B + `interlaced640-noisy.mp4` 7.488.528 B).
T4 chỉ poll trong cả hai lần chạy (log 20:44Z, chưa mở attempt) — không chồng tải đo yên.

### 4.1 Tiêu chí yên MỚI (sửa B1)

Trước khi ghi B1, chờ cho tới khi cả ba điều kiện cùng đúng:
(i) ≥ 3 s kể từ mount; (ii) 2 cửa sổ rAF 2 s liên tiếp, median khoảng rAF ∈ [14, 19] ms và max ≤ 50 ms;
(iii) load1 < 2,0 lúc bắt đầu ghi. Cả hai lần chạy đều yên sau 4 s (median rAF 16,7 ms, max 16,8 ms;
load1 1,18 / 1,40). Tiêu chí ĐẠT B1 giữ nguyên (30 hoặc 29,97); báo thêm số lần trong |fps−30| ≤ 1
(đề xuất P2-196 §6.5, chưa quyết).

### 4.2 B1 — fps sample media sau khi chờ yên

| Lần chạy | fps 5 lần đo | Đạt tiêu chí cũ | Trong \|fps−30\| ≤ 1 |
|---|---|---|---|
| Chạy 1 (21:18Z) | 30 / 29,97 / 29,97 / **28,63** / 29,97 | 4/5 | 4/5 |
| Chạy 2 (21:20Z) | 30 / 30 / 29,97 / 29,97 / 29,97 | **5/5** | **5/5** |

**B1 ĐẠT (chạy 2: 5/5).** Dao động lớn 13,18→30 của đợt 196 đã hết sau khi chờ yên; còn 1 lần trượt
28,63 trong 10 lần đo (chạy 1, lần 4, duration 1,991 s, load 1,07 — không rõ nguyên nhân, không lặp lại
ở chạy 2). Dung sai cho lần trượt lẻ này chờ parent quyết (đề xuất P2-196 §6.5).

### 4.3 Các check khác — đều PASS (chạy 2)

- **A1 PASS:** buildSampleProject mau-1/mau-2 fps:30.
- **E1 PASS:** bob rows [200,200,50,50,200,200,50,50] → blend rows **[200,140,50,110,200,140,50,50]**
  (kỳ vọng w=0,8, ±3 — khớp chính xác; pha xuống + clamp biên đúng).
- **G5c PASS:** clip nhiễu σ̂=3,355 ≥ 2,7 → `deintVerticalBlend`=0,8, `deinterlaceTap`=true.
- **G5-short PASS:** 4 slot off/on/off/on clip sạch — off 58,59/60,07 fps, on 55,05/59,16 fps,
  tỉ lệ 0,93/0,98 → **0,96x** (≥ 0,85), hookTap đúng từng slot, không đóng băng.
- **H9 PASS:** 0 lỗi trang (không có window.onerror / unhandledrejection).
- **Kết quả chung chạy 2: 6/6 PASS.** Chạy 1: 3/5 PASS (B1 4/5 + crash harness ở G5-short — xem §4.4).

### 4.4 Sự cố harness trong đợt này (không phải lỗi sản phẩm)

1. **2 lần fail CDP "không lấy được page target"** (21:09Z, 21:15Z): nguyên nhân gốc — TMPDIR dài
   (`hidden_files/round197-p2/tmp`) khiến đường dẫn SingletonSocket của Chrome vượt giới hạn socket Unix
   ~108 ký tự → Chrome FATAL `Socket path too long` ngay lúc khởi động (xem `chrome-stderr.log`).
   Sửa: TMPDIR ngắn trên đĩa `~/tmp197` (socket ~64 ký tự); vite cache + profile vẫn trên SCRATCH.
   Chạy tay cùng cờ Chrome (TMPDIR mặc định /tmp) đã lên được — xác nhận nguyên nhân.
   Bài học: **đường dẫn TMPDIR/profile dài có thể giết Chrome trước khi CDP kịp mở** — giữ TMPDIR ngắn.
2. **Crash ở G5-short (chạy 1):** bug harness của P2 — `ratios` đọc `slots[4]` (không tồn tại) ở slot 3
   cuối, và `hookTap` đọc field `tap` trong khi hook trả `deinterlaceTap`. Đã sửa (kề slot 3 chỉ lấy slot 2;
   đọc `deinterlaceTap`); chạy 2 PASS 6/6.
3. `pickDisplay`: `xdpyinfo` KHÔNG có trên cell → fallback pgrep `Xvfb :n` để xác minh socket stale
   (trước đây luôn coi socket là chết và unlink — có thể unlink socket của Xvfb đang sống).

## 5. Kiểm chứng code

- `npx tsc --noEmit`: **0 lỗi**.
- Test: 12 file (11 enhance + 1 media) PASS — đếm spec reporter **172 test ✓**
  (196 đếm 158 trên 11 file; nay 12 file).
- `npm run build`: **PASS** (8,58 s).
- Ngoại lệ duy nhất: `parityHarness196.test.ts` có 1 test fail — `psolaShiftSim` (N12a):
  440/−12 domFreq=219. P1-197 đang sửa `psola.ts` đồng thời (mới nhất 20:57:49Z 26/11) khiến −12 nay
  dịch về ~219 Hz thay vì ở 440 Hz như test cũ assert; test này assert hành vi bug cũ.
  21/22 test trong file đó pass. Không phải do thay đổi của P2 — KHÔNG sửa test của P1/P4.

## 6. File đổi / thêm (batch stage)

| File | Đổi |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | W 0,75 → 0,8 + comment |
| `apps/web/src/components/enhance/enhancePreview91P2.test.ts` | 4 assert 0,75 → 0,8 |
| `apps/web/src/lib/parityHarness196.test.ts` | 3 assert w 0,75 → 0,8 (file P4 — xem §3) |
| `docs/PHASE9_ROUND197_P2_ENHANCE_PARITY_LIMITS.md` | File này |

Probe sim + harness headed + fixture mp4 ở lại `hidden_files/round197-p2/` — KHÔNG đưa vào batch
(chỉ file TEXT; binary không stage).

## 7. Nợ / việc cho đợt sau

- **P2-198: α thích nghi theo chuyển động** — N10 và N5b nằm hai phía của điểm tối ưu α (§1.6);
  tín hiệu field-pair delta tách được hai fixture trên khung sạch (§3.5) nhưng phải ước lượng robust
  trên khung nhiễu lúc chạy thật. Không dời bar R_rel 0,15.
- **Parent quyết dung sai B1** cho lần trượt lẻ (28,63/10 lần đo) — đề xuất P2-196 §6.5.
- **KHÔNG làm (theo quyết (a1)/(r)-196):** "N13 ghi fps đo thật 27,78" (số đo lúc trang chưa yên, SAI;
  fps:30 GIỮ NGUYÊN); "sửa clamp biên E1" (E1 đã xác minh 5 lần giống hệt — E1 đợt này khớp chính xác
  rows w=0,8); sharpen YUV-native VẪN HOÃN (quyết (a3)-196).
- Fixture N10 gốc của P2-196 không truy vết được (§1.7) — P4-198 khi cần đối chiếu nên dùng fixture P4.

# LIMITS — Phase 9 đợt 128 T8: Kiểm chứng độc lập — đính chính prereg §2 + đối chiếu DEF v0.3.1 với dữ liệu thô leg xen kẽ T3

**Ngày:** 17/11/2026. **Luồng:** T8, đợt 128 vòng lặp Phase 9 (lượt cron
12:35 +07 17/11/2026). **Trạng thái:** **KIỂM CHỨNG XONG — 3 mục chính:
(1) PASS, (2) PASS kèm 3 phát hiện (2 siêu thay + 1 sai số nhỏ của T3),
(3) PASS, không mâu thuẫn.**
**Không đo mới, không sửa production, không sửa file của luồng khác —
chỉ đọc + tính lại từ dữ liệu thô bằng script riêng.**

## 0. Phương pháp kiểm chứng (độc lập, không tin lời kể)

- Script riêng của T8 (không dùng analyzer của T3 hay script của T1):
  `hidden_files/round128-t8/verify_t3_def.py` (+ output
  `verify_t3_def.out`), `hidden_files/round128-t8/verify_e4.py` (+ output
  `verify_e4.out`). Mọi số trong file này đều tính lại từ JSON thô.
- Nguồn dữ liệu thô:
  - Leg T3: `benchmarks/results/webkit-blob-flaky-127t3-f2startup-interleave.json`
    (299.918 B, 12 case, env previewMd5
    `03bf029f09b8890b285eacc10a02172b`); warm-up
    `hidden_files/round127-t3/warmup-out.json`; brackets
    `hidden_files/round127-t3/brackets-127t3.json`.
  - Các leg cũ: `webkit-blob-flaky-123t4-f2startup-legb.json` (6 Yên),
    `...-124t4-f2startup-legload.json` (12 Vừa+Nặng),
    `...-125t4-f2startup-legtrunggian.json` (6 GAP),
    `...-126t4-f2startup-leg4555.json` (6 GAP); brackets leg 126
    `hidden_files/round126-t4/brackets-126t4.json`.
  - E4: `hidden_files/round126-t1/probe-webkit-load0-gop250-e4a9/probe-results.json`
    (md5 `a403dfa9ceb22b488b398783fddc7c42` — khớp T1 đợt 126);
    `hidden_files/round125-t1/probe-webkit-load0-gop250-e4a7/probe-results.json`
    (md5 `776a67604eb7307defc3e9f409bd7713` — khớp T1 đợt 125).
- Định nghĩa T_startup/T_seek lấy theo DEF (loadedmetadata đầu −
  loadstart đầu; seeked đầu − seeking đầu) — chỉ đọc code analyzer để
  biết định nghĩa, số liệu tính lại từ đầu.
- Quyết parent đối chiếu: build-loop-log dòng 6310 (quyết đợt 127
  §12(a)/(b)).

## 1. Mục 1 — Prereg §2 đã đính chính đúng chưa: PASS

- **Đính chính CÓ trong file.** `hidden_files/round118-t9/prereg-e4batch.md`
  §2, mtime 2026-11-17 04:44:52Z (sau khi T1 đóng phân tích 04:28:53Z,
  khớp thời điểm parent áp dụng quyết đợt 127).
- **Trích nguyên văn đoạn đã sửa** (mục CAUGHT-NO-RESEEK, §2):
  > "CAUGHT-NO-RESEEK: có steady-close nhưng KHÔNG có drift re-seek
  > nào trong cửa sổ quan sát (drift sau steady-close CÓ THỂ vượt 0,35
  > — lượt 9 vượt ở 10 tick gồm 2 đợt liên tiếp 19–21, 29–33 — nhưng
  > vượt ngưỡng không phải re-seek: re-seek chỉ tính khi resyncsV tăng
  > sau tick steady-close hoặc ct nhảy về ph sau khi lệch ≥0,05, kiểm
  > bằng sampler-bracket) → ghi nhận, chỉ số chính VẮNG; lượt này
  > KHÔNG quyết H1/H3, nhưng ĐẾM vào 10 lượt..."
  > kèm khối: "[ĐÍNH CHÍNH 17/11/2026, quyết parent đợt 127 §12(a):
  > dòng trong ngoặc cũ ("drift sau steady-close không bao giờ vượt
  > 0,35 xác nhận 2 tick liên tiếp") là SAI SỰ THẬT — phân tích bàn
  > giấy lượt 9 (đợt 127 T1) cho thấy 10 tick sau-đóng vượt 0,35, gồm
  > 2 đợt liên tiếp, mà không có re-seek nào (14/14 tick cùng kiểu
  > "tụt-rồi-đuổi-kịp"). Định nghĩa chính ("KHÔNG có drift re-seek")
  > không đổi; verdict lượt 9 và verdict lô (ĐÓNG CÓ ĐIỀU KIỆN)
  > không đổi.]"
- **Đối chiếu quyết parent đợt 127 §12(a)** (build-loop-log): "E4:
  ĐÍNH CHÍNH chú thích prereg §2 — ĐÃ ÁP DỤNG trực tiếp vào
  `hidden_files/round118-t9/prereg-e4batch.md` §2 (drift sau
  steady-close CÓ THỂ vượt 0,35; re-seek chỉ tính khi resyncsV tăng
  hoặc ct nhảy về ph; verdicts không đổi)." — **Khớp từng điểm:**
  "CÓ THỂ vượt 0,35" ✓; "re-seek chỉ tính khi resyncsV tăng hoặc ct
  nhảy về ph" ✓ (prereg giữ thêm điều kiện chi tiết gốc "sau khi lệch
  ≥0,05", đúng định nghĩa chính đã đăng ký); "verdicts không đổi" ✓
  (khối đính chính ghi rõ verdict lượt 9 và verdict lô không đổi).
- **Câu cũ sai sự thật không còn được khẳng định ở đâu.** Grep toàn
  file: cụm "không bao giờ vượt 0,35" chỉ xuất hiện 1 lần — bên trong
  khối đính chính, dưới dạng trích dẫn câu cũ và gắn nhãn SAI SỰ THẬT.
  Không còn dòng nào khẳng định nó như luật.
- **Cơ sở số liệu của đính chính đã tự kiểm lại từ JSON thô (xem §3):**
  đúng 10 tick sau steady-close vượt 0,35, đúng 2 đợt liên tiếp 19–21
  và 29–33. Quy ước đếm: tick 17 là tick steady-close (tailSteadyClosed
  lần đầu = 1, drift 0,4985) nên không tính vào "sau-đóng"; đếm chặt
  sau tick 17 cho đúng 10 tick như prereg viết. **PASS.**

## 2. Mục 2 — Đối chiếu DEF v0.3.1 với dữ liệu thô leg T3: PASS KÈM PHÁT HIỆN

### 2.1 Số liệu DEF v0.3.1 truy được về dữ liệu gốc: PASS (không có số nào mồ côi)

Tính lại từ JSON thô 30 run (123–126), mọi số trong bảng DEF §3 và §7
khớp chính xác:

| Số trong DEF v0.3.1 | Tính lại từ dữ liệu thô | Kết quả |
|---|---|---|
| GAP-126 tickRate 31,32–33,36, mean 32,01 | 31,32–33,36, mean 32,01 | ✓ |
| GAP-126 avg60 mean 45,98%, range 39,47–48,00% | 45,98%; 39,47–48,00% | ✓ |
| GAP-126 T_startup median 1,227 s, chậm 3/6 | 1,227 s; 3/6 | ✓ |
| GAP-125 tickRate 28,07–29,47, mean 28,52 | 28,07–29,47, mean 28,52 | ✓ |
| GAP-125 avg60 mean 53,19%, range 52,75–53,99% | 53,19%; 52,75–53,99% | ✓ |
| GAP-125 T_startup median 1,2635 s, chậm 4/6 | 1,2635 s; 4/6 | ✓ |
| Yên-123 tickRate 69,49–72,61, mean 71,50; avg60 mean 7,02%, max 13,14% | khớp | ✓ |
| Vừa tickRate 15,28–20,33, mean 18,54; avg60 65,75–75,64, mean 69,71; median 1,8425 | khớp | ✓ |
| Nặng tickRate 16,54–17,39, mean 16,77; avg60 89,23–91,76, mean 90,69; median 2,2185 | khớp | ✓ |
| Tương quan n=24: −0,959 / +0,864 / −0,831 / +0,979 | −0,959 / +0,864 / −0,831 / +0,979 | ✓ |
| Tương quan n=30: −0,944 / +0,860 / −0,809 / +0,975 | −0,944 / +0,860 / −0,809 / +0,975 | ✓ |
| DEF §6: leg 126 run 3 CHẬM 1,403 s @ 47,74% vs run 4 NHANH 0,980 s @ 48,00% | run 3: 1,403 s @ 47,74%; run 4: 0,980 s @ 48,00% | ✓ |
| DEF §8 load1 leg 126: run 5 5,21→5,58 vs run 2 0,88→0,42 | brackets-126t4.json: run 5 5,21→5,58; run 2 0,88→0,42 | ✓ |
| Sai số dial ấm leg 126: 0,24 điểm (W 45,74 vs mean 45,98); kiểm chéo loại run 1: 1,54 (runs 2–6 mean 47,28) | |0,24|; |45,74−47,28| = 1,54 | ✓ |
| Run chậm thấp nhất leg 126: 39,47% (run 1 leo dốc) | min avg60 = 39,47% | ✓ |

### 2.2 Số liệu leg T3 (T3 LIMITS) tính lại từ JSON thô: PASS (trừ một sai số nhỏ, xem F3)

Tính lại 12 run từ `webkit-blob-flaky-127t3-f2startup-interleave.json`:

- Nhóm dial (vị trí 1, 2, 4, 6, 7, 9): T_startup
  [1,322; 1,082; 1,195; 1,702; 1,003; 1,395] s — median 1,2585 s
  (T3 ghi 1,259 ✓), p90 1,702 s ✓, chậm 3/6 ✓; dãy S-F-F-S-F-S ✓
  (KHÔNG xen kẽ hoàn hảo — run 2 nhanh → run 4 nhanh, hai nhanh liên
  tiếp); avg60 mean từng run [41,40; 41,48; 31,67; 31,52; 39,07;
  30,83]% — mean 35,99% ✓, range 30,83–41,48% ✓; tickRate
  31,68–33,01, mean 32,44 ✓; threadsR 6,7–7,3, mean 6,9 ✓;
  seekImmMs [1231; 1121; 1195; 1534; 1017; 1272] ✓; frames 297–329,
  dropped 0–1 ✓; T_seek max 0,001 s ✓.
- Nhóm Yên (vị trí 3, 5, 8, 10, 11, 12): T_startup median 0,6715 s
  (T3 ghi 0,672 ✓), p90 0,775 s ✓, chậm 0/6 ✓; tickRate 70,54–72,80,
  mean 71,57 ✓; avg60 range 4,09–14,13% ✓; T_seek max 0,001 s ✓.
- Warm-up: W = 32,36% ✓ (tickRate 30,22; T_startup 1,589 s — chỉ
  tham khảo, không tính vào bộ 12 run theo prereg).
- Sai số dial ấm: |32,36 − 35,99| = 3,63 điểm ≤ 5 — ĐẠT ✓; biến thể
  chỉ tính run ổn định (run 2, 7: mean 40,28%): |32,36 − 40,28| =
  7,92 điểm — KHÔNG ĐẠT ✓ (tính lại: 7,915 → 7,92, khớp T3).
- Hold 30 s: run 1 mean 41,40% — CAO HƠN mean run ổn định (run 1, 2,
  7: 40,65%) — không còn là run leo dốc ✓; run leo dốc (4, 6, 9)
  mean 31,34%, chênh run ổn định 9,31 điểm ✓ (T3 ghi ~9,3).
- Tương quan trong nhóm dial: r(avg60, T_startup) = −0,587 ✓;
  r(avg60, tickRate) = +0,914 ✓ (khớp T3 §8 — hiệu ứng cụm, không
  phải quan hệ thật, như T3 đã ghi).
- Tương quan gộp n=36 tính lại: r(avg60, tickRate) = −0,906;
  r(avg60, T_startup) = +0,836; r(tickRate, T_startup) = −0,799;
  r(avg60, threadsR) = +0,967 — khớp T3 §8 ✓.
- Brackets: `brackets-127t3.json` khớp từng số trong bảng T3 §6
  (vd run 1: 31,74/42,44; run 9: 18,12/34,72; run 4: 18,36/35,17) ✓;
  hogs_alive_min = 2 mọi run dial, 0 mọi run Yên ✓.
- Độ nhạy ngưỡng (T3 §7(ii)): với ngưỡng 1,19 s, run 4 (1,195 s)
  thành chậm → dãy S-F-S-S-F-S — vẫn KHÔNG xen kẽ hoàn hảo ✓;
  run 4 nhanh chỉ dưới ngưỡng 1,2 s có 5 ms ✓.

### 2.3 Phát hiện

- **F1 — Dải chuyển ~46–53% của DEF v0.3.1 ĐÃ LỖI THỜI trước dữ liệu
  T3 (siêu thay, không phải sai lúc viết).** DEF viết 02:42Z, trước
  khi leg T3 chạy (03:47–04:11Z), nên không thể chứa dữ liệu T3.
  T3 quan sát được TRỘN ở run means 30,83–41,48%: run 6 CHẬM 1,702 s
  @ 31,52% vs run 4 NHANH 1,195 s @ 31,67% (tải gần như bằng nhau,
  kết quả ngược nhau); run 1 CHẬM 1,322 s @ 41,40% vs run 2 NHANH
  1,082 s @ 41,48%. Cận dưới ~45% của DEF vì vậy không còn đứng:
  vùng trộn quan sát được mở rộng thành **~31–53%**. Kết luận này của
  T3 tuân đúng bảng diễn giải đã đăng ký trước (prereg T3 §6(iii):
  "dải chuyển = giao/hợp của các vùng trộn đã quan sát") — prereg
  chỉ ví dụ M ≈ 39–44% → ~39–53%, dữ liệu thực tế đi thấp hơn tới
  ~31% nên hợp mở rộng xuống ~31%. **DEF v0.4 phải viết dải ~31–53%**
  (đã được parent phê duyệt theo quyết đợt 127 §12(b)).
- **F2 — Caveat dial ấm mới: DEF v0.3.1 trình bày dial ấm là protocol
  CHUẨN ĐÃ ĐƯỢC CHỨNG MINH (sai số 0,24 điểm, leg 126).** Leg T3:
  sai số toàn-leg 3,63 điểm vẫn ĐẠT tiêu chí ≤5, NHƯNG biến thể chỉ
  tính run ổn định cho 7,92 điểm — KHÔNG ĐẠT. Nghĩa là dial ấm dự
  báo đúng mean CẢ LEG trong ±5 điểm, nhưng đánh giá thấp run ổn
  định ~8 điểm khi ambient thấp (boot #73). **DEF v0.4 phải ghi thêm
  caveat này** (T3 đã đề xuất ở LIMITS §7(d); DEF v0.3.1 chưa có vì
  viết trước leg T3 — không phải lỗi của T2).
- **F3 — SAI SỐ NHỎ trong T3 LIMITS (không phải trong DEF): mean
  avg60 nhóm Yên ghi 10,27%, tính lại là 10,10%.** Từ chính các số
  avg60 từng run do analyzer của T3 in ra (14,13; 11,61; 13,10;
  11,39; 6,29; 4,09): tổng 60,61 / 6 = **10,10%**; gộp toàn bộ mẫu
  (pooled) = 10,13%; lấy mẫu 5 s = 10,17%. Không cách tính nào từ dữ
  liệu thô cho 10,27% (khả năng cao cộng nhầm +1,0 ở một run).
  Ảnh hưởng: KHÔNG ĐÁNG KỂ — vẫn ~10%, xa dưới ngưỡng Yên 30%; không
  đổi bất kỳ kết luận nào. Nhưng điểm trên đường cong tickRate của
  v0.4 nên ghi **71,57 @ ~10%** (không phải 10,27%). Đã báo ở đây
  cho luồng viết DEF v0.4 (T1 đợt 128) sửa; T8 không sửa file của
  luồng khác.
- **Các điểm DEF v0.3.1 VẪN ĐỨNG sau leg T3:** tickRate mức trung
  gian ~28–33 — T3 tái hiện lần thứ ba (32,44 ∈ [28,33]) ✓; ngưỡng
  Yên <30% — run chậm thấp nhất 30,83% (run 9), ngay trên ngưỡng ✓
  (nhưng biên chỉ còn 0,83 điểm — mỏng, T3 đã ghi nợ mở: leg sau
  thấy run chậm ở ~28–30% thì xét lại ngưỡng); hold ngắn sau warm-up
  — hold 30 s có tác dụng ✓ (xác nhận khuyến nghị DEF §4.1);
  pha (b) T_seek miễn nhiễm tải — max 0,001 s ở n=42 ✓; xen kẽ
  hoàn hảo đợt 126 là ngẫu nhiên, không có yếu tố xen kẽ hệ thống ✓
  (dãy S-F-F-S-F-S + kiểm tra độ nhạy ngưỡng 1,19 s đều không xen kẽ
  hoàn hảo).

## 3. Mục 3 — Verdict E4 (ĐÓNG CÓ ĐIỀU KIỆN) đối chiếu phân tích T1: PASS, không mâu thuẫn

- **Verdict đứng.** Lô E4BATCH 10/10: 1 CAUGHT-NO-RESEEK (lượt 9) +
  9 VOID; 0 lượt CAUGHT-RESEEK → không có cặp A+B CAUGHT-RESEEK →
  H1/H3 không phân định theo prereg §4. Phân tích bàn giấy của T1
  không tạo ra lượt đo mới, không tạo cặp CAUGHT-RESEEK. **ĐÓNG CÓ
  ĐIỀU KIỆN giữ nguyên — T1 kết luận đúng điều này (§4 LIMITS T1).**
- **Mọi claim số liệu của T1 tính lại đều khớp dữ liệu thô:**
  - 10 tick sau-đóng vượt 0,35: tick 19 (0,4193), 20 (0,3667), 21
    (0,4594), 23 (0,4237), 25 (0,4238), 29 (0,4448), 30 (0,4000), 31
    (0,3612), 32 (0,3667), 33 (0,4520) — khớp từng số 4 chữ số với
    bảng T1 §1 ✓; 2 đợt liên tiếp 19–21 và 29–33 ✓.
  - Bảng tick 12–35: ct/ph/drift/Δct/Δph/rateCt khớp toàn bộ với
    T1 §1 (vd tick 22: Δct 0,0406, Δph 0,2333, rate 0,21×; tick 35:
    Δct 0,0333, Δph 0,2667, rate 0,26×; tick 29: Δct 0,4115, rate
    2,06×) ✓.
  - Tách bimodal sạch: tick MỞ drift (12, 14, 16, 19, 23, 25, 29)
    Δct 0,3220–0,4333, rate 1,19–2,06×; tick ĐÓNG sau steady-close
    (22, 24, 26, 34, 35) Δct 0,0333–0,0763, rate 0,15–0,38× — không
    tick nào nằm giữa hai nhóm ✓.
  - Ba kênh loại trừ seek, toàn bộ âm tính trong cửa sổ 19–33:
    (1) resyncsV chỉ đổi 1 lần ở tick 2 (0→1, seek ban đầu), giữ 1
    tới tick 195 ✓; (2) ct không bao giờ giảm sau tick 2 ✓; ph
    không bao giờ giảm toàn lượt ✓; (3) sampler chỉ có 1 seeking
    run (samples relMs 124, 228 — seek ban đầu); 14 sample trong
    cửa sổ tick 19–33 toàn seeking=False ✓.
  - Lượt 7 (đối chiếu): 9 tick đóng (15, 18, 20, 22, 24, 27, 30, 33,
    35) với Δct 0,0000–0,0868, Δph 0,1000–0,3334, rateCt 0,00–0,59×
    — khớp T1 §2 ✓; resyncsV chỉ đổi ở tick 3 ✓; sampler seeking
    chỉ ở relMs 421, 591 ✓; drift max 0,6068 ở tick 17 ✓.
  - Drift max sau seek ban đầu lượt 9: 0,5000 ở tick 16 ✓.
- **Nuance ghi rõ (không phải mâu thuẫn):** lượt 7 KHÔNG BAO GIỜ
  steady-close (tailSteadyClosed = 0 suốt 292 tick) — T1 dùng lượt 7
  chỉ làm đối chiếu độc lập cho cùng cơ chế răng cưa, không phải bằng
  chứng sau-đóng. Con số "14/14 tick cùng kiểu" = 5 tick đóng sau
  steady-close của lượt 9 (22, 24, 26, 34, 35) + 9 tick đóng trong
  cụm drift của lượt 7. Tập quyết định verdict là 5 tick lượt 9; 9
  tick lượt 7 là bằng chứng hỗ trợ. T1 ghi rõ điều này trong LIMITS
  ("Lượt 7 (đối chiếu)") — không có che giấu.
- **Đính chính diễn đạt cơ chế của T1 (§4):** "ph NHẢY LÊN" (đợt 126)
  → "ct chững lại sau burst, ph đuổi kịp ở tốc độ bình thường" — khớp
  dữ liệu tính lại: Δph ở tick đóng 0,2000–0,2667, trong khoảng bình
  thường của cửa sổ (trung vị 0,2000; tick 17 Δph 0,4000 còn lớn hơn).
  Ghi nhận đúng, không ảnh hưởng verdict.

## 4. Kết luận kiểm chứng (tổng hợp PASS/FAIL)

| # | Mục kiểm chứng | Kết quả |
|---|---|---|
| 1a | Đính chính prereg §2 có thực sự trong file | **PASS** — khối [ĐÍNH CHÍNH 17/11/2026] có trong §2, mtime 04:44:52Z |
| 1b | Nội dung đính chính khớp quyết parent đợt 127 §12(a) | **PASS** — khớp từng điểm (CÓ THỂ vượt 0,35; re-seek chỉ tính khi resyncsV tăng / ct nhảy về ph; verdicts không đổi) |
| 1c | Câu cũ sai sự thật không còn được khẳng định | **PASS** — chỉ còn 1 lần xuất hiện, dạng trích dẫn có gắn nhãn SAI SỰ THẬT |
| 1d | Cơ sở số liệu của đính chính (10 tick, 2 đợt 19–21/29–33) | **PASS** — tính lại từ JSON thô khớp hoàn toàn |
| 2a | Số liệu DEF v0.3.1 truy được về dữ liệu gốc (30 run) | **PASS** — toàn bộ bảng §3/§7, §6, §8 tính lại khớp chính xác |
| 2b | Số liệu leg T3 tính lại từ JSON thô | **PASS** — trừ F3 (sai số nhỏ, xem dưới) |
| 2c | Dải chuyển DEF ~46–53% vs dữ liệu T3 | **PHÁT HIỆN F1** — trộn quan sát được xuống tới ~31% → dải phải mở rộng ~31–53% trong v0.4 (đã phê duyệt) |
| 2d | Dial ấm "protocol chuẩn" vs dữ liệu T3 | **PHÁT HIỆN F2** — sai số toàn-leg 3,63 ĐẠT, nhưng run ổn định 7,92 KHÔNG ĐẠT → cần caveat mới trong v0.4 |
| 2e | tickRate ~28–33, hold 30 s, Yên <30%, T_seek n=42, xen kẽ | **PASS** — tất cả tái hiện/xác nhận bởi leg T3 |
| 3a | Verdict E4 ĐÓNG CÓ ĐIỀU KIỆN vs phân tích T1 | **PASS** — không mâu thuẫn; không có cặp A+B CAUGHT-RESEEK |
| 3b | Claim số liệu T1 (10 tick, bimodal, 3 kênh loại seek, 14/14) | **PASS** — tính lại từ JSON thô khớp hoàn toàn |

**Không phát hiện sai lệch nào làm đổi verdict.** Hai phát hiện F1/F2
là siêu thay do dữ liệu mới (DEF v0.3.1 viết trước leg T3) — luồng
viết DEF v0.4 (T1 đợt 128) đã được parent phê duyệt xử lý. Một sai số
nhỏ F3 (mean Yên-127: 10,27% → đúng 10,10%) không đổi kết luận nào —
đã báo ở đây, không tự sửa file luồng khác.

## 5. Những gì KHÔNG làm + nợ mở

- Không đo mới, không sửa production, không sửa file của luồng khác
  (prereg, DEF, LIMITS T1/T3 giữ nguyên — chỉ báo cáo).
- Không xét lại verdict F2 đợt 120 (vẫn KHÔNG ĐẠT). Không gộp số leg
  T3 với bộ verdict (khác boot #73 — chỉ so sánh tham khảo).
- Nợ mở chuyển T1 đợt 128 (viết DEF v0.4): (a) dải chuyển ~31–53%;
  (b) caveat dial ấm ambient-thấp (sai số run ổn định 7,92);
  (c) sửa mean Yên-127 10,27% → 10,10% (điểm đường cong 71,57 @
  ~10%); (d) lưu ý biên ngưỡng Yên 0,83 điểm.
- Không kiểm lại TTS 39. Không thử birefnet. Không push. Không
  release/tag.

## 6. File đổi/thêm + stage (không push)

- Repo (text, stage trong `phase9-round128-t8-verify.txt`):
  - `docs/PHASE9_ROUND128_T8_VERIFY_LIMITS.md` (mới, file này)
- Hồ sơ làm việc (ngoài repo, KHÔNG push qua paths-loop theo tiền lệ
  mọi đợt — lưu trong goal workspace):
  `hidden_files/round128-t8/` — `verify_t3_def.py`,
  `verify_t3_def.out`, `verify_e4.py`, `verify_e4.out`
- Cờ xong: `hidden_files/round128-t8.done` (touch khi LIMITS + stage xong).

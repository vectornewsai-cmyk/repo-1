# Đợt 108 J9 — Verify độc lập toàn bộ đợt 108 + cây gộp cuối đợt

Ngày: 13–14/11/2026 (lượt cron 03:35 +07 14/11 = 20:35Z 13/11). Máy đo: VM này
(1,5 CPU / 8 GB RAM; Chromium qua Xvfb + CDP; boot #34 `cc460738…` 20:34:17Z,
boot #35 `26cbdc1e…` 21:42:41Z, boot #36 `ab33c58f…` 22:53:56Z).
Vai trò: luồng verify độc lập J9 — KHÔNG sửa production, KHÔNG push, KHÔNG
release/tag. Mọi số dưới đây do J9 tính lại từ dữ liệu thô bằng script viết
mới (`hidden_files/round108-j9/recount-j*.py`), không dùng lại analyzer của
luồng đo. Script + log kiểm chứng: `hidden_files/round108-j9/`.

## 1. Kết luận ngắn

- **8/8 luồng về đủ LIMITS + batch, 0 mất trắng.** J1, J2, J3, J4, J5, J6, J8
  về đúng hạn; **J7 về muộn (late merge)** — LIMITS + batch ghi 23:13Z, sau
  khi J9 đã đóng băng cây (~22:55Z). Dữ liệu J7 vẫn kiểm đầy đủ; J7 không
  sửa production (harness md5 không đổi) nên cây gộp đã kiểm vẫn đứng.
- **Đối chiếu headline: 7/8 luồng KHỚP toàn bộ headline chính; J3 KHỚP kèm
  3 đính chính của J9; J7 KHỚP kèm 2 caveat về tải + 1 ghi chú đếm.**
- **Cây gộp XANH:** suite offline 27/27 exit=0 (tsc web 0, tsc desktop 0,
  vite build pass, test-preview-engine.sh 354 assertions pass, U4 141/141,
  P7 8/8, orphans 17/17, css60 60/60, css61 60/60, pacing 19/19, hold
  75/75, r6 PASS); **O8 21/21 cả 2 engine** (Chromium 21/21; WebKit lần 1
  lỗi môi trường thoáng qua sau reboot #36, chạy lại 21/21 — xem §4).
- `preview.tsx` md5 **`ced42efd785724c8c0d1b16fc32c7341`** không đổi suốt đợt
  (kiểm ở mọi lần poll, kể cả sau toggle E4 của J1 và sau reboot #35/#36).
  **0 file production đổi trong đợt** (đợt đo lường thuần túy).
- **Tổng chờ push (đếm lại từ đĩa 23:26Z): đợt 108 = 9 batch / 16 entry /
  16 unique; 106+107+108 = 28 batch / 58 entry / 56 unique; cộng J9 =
  29 batch / 59 entry / 57 unique + 1 file oversize**
  (`benchmarks/results/webkit-blob-flaky-96x3.json`, 6.370.678 B). Đợt 108:
  0 thiếu, 0 workflow, 0 binary.
- Reboot #35 (21:42:41Z, gap 1h08'24") và #36 (22:53:56Z, gap 1h11'15")
  đều nằm trong dải cơ học của J8. Chưa có reboot #37 tới 23:26Z.

## 2. Đối chiếu từng luồng (headline → số J9 tính lại → verdict)

### J1 — Re-arm A/B, E4 tắt (recount-j1.py)
- Headline J1: 2+2 lượt hợp lệ; CAP/lượt E4-bật 2,00 vs E4-tắt 0,50;
  CAP/tick 0,0165 vs 0,0135; Fisher 2-sided p=1,0; kết luận KHÔNG KẾT LUẬN
  ĐƯỢC, nghiêng về minh oan E4. **KHỚP.**
- J9 tính lại từ `probe-results.json` thô (bản sao md5-khớp gốc round104-f5):
  j1on CAP 0 (81 vt, 2 tails), j2on CAP 4 [5025, 5123, 5165, 5302] (161 vt,
  4 tails), j1off CAP 0 (39 vt, 3 tails), j2off CAP 1 [5337] (35 vt,
  1 tail). CAP/lượt 2,00 vs 0,50; Fisher p=1,0 đúng.
- Lượt j2off đầu bị nhiễm (2 dãy off song song, restore 21:08:41Z giữa
  lượt): CAP 2 [5106, 5118] tính lại và xác nhận ĐÃ LOẠI (file rows chỉ có
  4 lượt hợp lệ). Toggle E4-off md5 `8cb31223…`, cây khôi phục về
  `ced42efd…` (kiểm trực tiếp 21:33Z). **KHỚP.**
- Giới hạn J9: frzMax/frzTail/rate chưa tính lại độc lập (chỉ kiểm nhất
  quán nội bộ: độ rộng cửa sổ freeze §2.4 bằng frzMax ở cả 4 lượt:
  5114/5014/2113/2499).
- Batch: `phase9-round108-j1-rearm.txt` (1 entry, LIMITS-only).

### J2 — 2 MiB, queue2 ring buffer (recount-j2.py)
- Headline J2: **chứng minh nhân quả queue2 ring buffer → splice** (điều
  kiện blob-file): ring mặc định 2 MiB → offset +2.097.152 (2/2 run,
  8 pull splice mỗi run); ring 1 MiB → offset +1.048.576; ring 4 MiB
  (> file 2.139.973 B) → 0 splice. Blob-direct 0/8 bogus. **KHỚP.**
- J9 kiểm: req_off 0/3163/3179/41666 (2 MiB, ms 693–754); run3: 2 pull
  OTHER; run5: 16 pull OTHER, mọi delta đúng +1.048.576, req_off
  0/3179/41666/60156/74135/90845/107504/120386; blob-direct đúng 396
  pull/run (run9 390). JSON 15 ca (10 H2Q + 5 J2FILE): frames/playOk/ring
  khớp bảng J2. DOT: ring=1.048.576 ở 4 file, ring=4.194.304 ở 2 file;
  J2Q2SET override 2/1/2 (run3/run4/run5); dòng GST queue2 7539/7538/7226
  (run1/run2/run9). Typefind caps 0,103 s (Blob) vs 0,094 s (File);
  dòng caps webkitwebsrc = 0. `media.ts:228/385/389` createObjectURL đã
  kiểm. Lỗi "The operation is not supported" t≈0,62–0,73 s ở run blob-file.
  **KHỚP.**
- Ghi chú nhỏ: finalCt run9 = 7,167 (LIMITS J2 viết tắt "8"), run3b =
  7,953 — không đổi kết luận.
- Batch: `phase9-round108-j2-2mib.txt` (4 entry).

### J3 — Zombie gate (b) (recount-j3.py, code mới)
- Headline J3: 4 lượt xong (R0 pause-burst rerun f4y3 sysload 0; R1–R3
  freeze sysload 4); gate (b) QUAN SÁT ĐƯỢC 3/4 lượt (R0/R1/R2), R3
  không; in-page 33/292, CDP 14/364 (theo số J3). **KHỚP, kèm 3 đính
  chính của J9 dưới đây.**
- J9 tính lại: **39/39 điểm so sánh KHỚP** sau khi khớp quy ước p90
  nearest-rank ceil của J3 (p90 nội suy tuyến tính của J9 lúc đầu lệch,
  vd R0 state100-gap 539,4 vs J3 569 — chỉ khác phương pháp, cùng dữ
  liệu). Headline in-page: R0 13/167, R1 19/119, R2 1/6, R3 0/0 (tổng
  33/292). §5 worker KHỚP hoàn toàn (r-gap>300 in-play: R0 178 với w<100:
  171; R1 136/134; R2 9/9; R3 0; w-gap>300 ms: 0/4 lượt). §4.1 bảng
  sched/rtt KHỚP đúng cả 4 lượt. §4.2 CDP inflation KHỚP (gap CDP 4896 ms
  chứa sample/draw trong cửa sổ wall-clock — Node starvation, không phải
  freeze 4,9 s; schedGap 2198 ms, rtt 4791 ms trong gap đó). Pause-burst
  rerun f4y3 HOÀN THÀNH lần đầu: 21/23 burst + 2 missed-window. Kích
  thước file KHỚP: results.json 17.602.309 B, cdp 113.432 B. Load dial:
  không lượt nào đạt mục tiêu prereg [3,8] (R0 load5 med 10,4 / procs 26
  vượt; R1 10,1/28 vượt; R2 1,8/10 thiếu; R3 1,3/9 thiếu) — LIMITS J3 ghi
  trung thực.
- **Đính chính 1 (J9 tìm ra, số CDP):** thanh CDP của J3 bị phồng 1/lượt
  ở R0/R1 do sentinel e4skip=-1: gap CDP đầu mỗi lượt (R0 317 ms tại idx
  24, R1 385 ms tại idx 6) nhảy -1→1 trong lúc counter khởi tạo (e4skip
  -1 ở idx 0–24 R0 / 0–6 R1; state100 e4skip null 33/7 sample đầu, giá trị
  hợp lệ đầu = 1). Δe4skip=2 là số học sentinel, không phải skip thật.
  **Số CDP đúng: R0 7 (không phải 8), R1 5 (không phải 6), tổng 12
  (không phải 14).** Verdict không đổi. LIMITS J3 trích cả 2 gap khởi tạo
  làm ví dụ (§2.1, §2.2, §3.3) — cần sửa.
- **Đính chính 2 (J9 tìm ra, "trusted"):** LIMITS J3 ghi "0 trusted"
  (bracket ≤300 ms, guard G2 cũ) trong khi chính §1.3 của nó nêu đính
  chính prereg (spread test trusted khi n_inside ≥ 2; guard bracket chỉ
  áp cho draws-check). Tính lại theo đính chính: trusted = **R0 9/13,
  R1 12/19, R2 1/1, tổng 22/33** — chân in-page mạnh hơn nhiều so với J3
  báo. distinct_strict ≥ 2 = 0 ở mọi nơi (KHỚP), nên caveat "dạng yếu"
  vẫn đứng.
- **Đính chính 3 (khung diễn giải):** "worker thấy cùng freeze 4990 ms
  (diff 88 ms)" — r-gap 4990 ms của worker là THẬT nhưng **pre-play**
  (relPlay ≈ -292 ms; gap CDP 5078 ms tại relPlay [-500, 4578] cũng
  pre-play). Top-diff in-play: R0 2408 ms, R1 3304 ms, R2 653 ms — bar
  prereg ±50 ms cho thỏa thuận gap lớn nhất **KHÔNG đạt ở lượt nào** (J3
  §4 thừa nhận trung thực: "KHÔNG đạt theo nghĩa đen... So sánh max là
  metric sai... không dùng lại").
- J3 KHÔNG tạo cờ `round108-j3-done` (kiểm 22:11Z, 22:16Z, 22:32Z, 22:53Z
  — không bao giờ xuất hiện; thư mục J3 im từ ~22:11Z). J9 cố ý KHÔNG tự
  tạo cờ hộ (đó là tín hiệu của J3; prereg J7 đã có fallback timeout).
- Reboot #35 rơi giữa R1 (kết thúc 21:33:06Z) và R2 (bắt đầu 21:45:44Z);
  không lượt nào bị giết. R0/R1 ở boot #34, R2/R3 ở boot #35.
- Batch: `phase9-round108-j3-zombie.txt` (2 entry: LIMITS +
  `apps/web/scripts/probe108j3-frame-parity.mjs`, node --check PASS).

### J4 — B-band blur (recount-j4.py)
- Headline J4: **B-band c0 ĐẠT BAR**: gộp F6+G7+H4+I5+J4 c0 22/184
  (12,0%) vs c2 5/108 (4,6%); Fisher 1 phía p=0,02655, 2 phía p=0,03813;
  Newcombe 95% CI [+0,4pp, +13,4pp]. **KHỚP.**
- J9 tính lại cả 8 lượt từ `frame-parity-results.json` thô (804 thô / 714
  dùng được / 190 B / 0 D; theo clip c0 101(15), c1 38(2), c2 51(2)).
  Không đồng nhất: gộp p=0,8192, chỉ-J4 p=0,5678 (flag ĐÓNG). D floor
  0/3143; Fisher vs pre-fix 28/1547 p=2,76e-14; rule-of-three trên 0,095%.
  Power kiểm lại: 88,3% (hiệu ứng gốc, J4: 88%) / 69,8% (quan sát, J4:
  69%). c2 vẫn thiếu 7 B-cap tới ~115/nhóm. **KHỚP.**
- Batch: `phase9-round108-j4-blur.txt` (2 entry).

### J5 — Cluster A, stripes-code (recount-j5.py)
- Headline J5: **E6 vẫn MỞ** (cần ≥8 sự kiện; mới có 6): 6 sự kiện band-A',
  cả 6 Nhãn-đúng (g 0,460–0,473, mỗi sự kiện khớp), 0 ủng hộ E6. Gap-6
  mọi band = 9. **KHỚP.**
- F2 ĐẠT: 1044/1044 nhận diện, 1041/1044 trong ±1 (theo lượt: r45 299/299,
  r46 229/230, r47 90/91, r48 281/281, r49 142/143). Sự kiện phân biệt
  804 (233/184/44/252/91). Bar (b) n=803: med|Δ| uniform 0,064 (mean
  signed +0,055) vs H-alt 0,025 (+0,012). Outlier r49 c2 pres33:
  g_pred(alt) 0,250 đã xác nhận. Bar (c) n=505 triple: offset +0,051
  (uniform) / −0,009 (H-alt). Bar (d): quiet-deep 899/901 (99,8%) trong
  ±1, r49 sysload 142/143 (99,3%), median offset +0 mọi lượt. g<0,35 = 0
  mọi lượt. Tính lại từ JSON kết quả thô + ref
  `round107-i8/ref-code-decoded` bằng code mới. **KHỚP.**
- Batch: `phase9-round108-j5-blurclustera.txt` (2 entry: probe + LIMITS).

### J6 — Ghost C3b (recount-j6.py)
- Headline J6: **C3b chạy lại lúc máy yên ĐẠT BAR**: clean distinct
  post-flip+2000ms 74/94 = 78,7% (tap 67/76 = 88,2%, frameIdx 7/18 =
  38,9%); all-occurrences 2926/2997 = 97,6%; anchor coverage 1476/1506 =
  98,0%; tickCost med/p90 11,4/15,0 ms; rAF gap post+2000 med 19,1 ms,
  p90 31,0 (J6 ghi 31,3 — lệch 0,3 ms do nội suy percentile, không đáng
  kể); gap |≤3| 100% mọi cửa sổ (29+47+466+993). **KHỚP.**
- Tính lại từ `preview-b-f3-flip-land-c3b-quiet.json` bằng code phân loại
  strip mới, đối chiếu 90 khung GT `round97-y2/frames-stripes`.
- **Đuôi spread ~75 là THẬT** (không phải artefact mật độ): tính lại cả
  6 lượt flip đúng từng số (drawn 562 nhóm, frame 1089 nhóm; 3/6 lượt
  max-drawn ≥70; frame max 75,4–75,7 cả 6 lượt). **KHỚP.**
- Giới hạn J9: pass-7 coverage dip (30/40) và "gap at seek 0/1 (14/14)"
  chưa tính lại độc lập.
- Batch: `phase9-round108-j6-ghost.txt` (1 entry).

### J7 — Harness E1 dưới tải nặng (recount-j7.py; LATE MERGE — LIMITS 23:13Z)
- Headline J7: 0 flake mới; **bar prereg ≥7 lần hoàn thành tải nặng VẪN
  CHƯA ĐẠT** (mới 6 lần I6); tỉ lệ gộp 2/35 = 5,7% (Wilson [1,6%,
  18,6%]) chặt-chỉ-report và 2/36 = 5,6% (Wilson [1,5%, 18,1%]) tính cả
  run21; keydown gộp 56 lần / 748 slot / 1496 toggle, max 2197 ms.
  **KHỚP toàn bộ.**
- J9 tính lại từ log + report JSON + file load thô (code mới):
  run18/19/20 chết trước G4, vite-ENOSPC=True, harness timeout
  21:22:52Z / 21:28:58Z / 21:35:19Z — KHỚP; run21 G4 PASS R=0,51 tap=true
  gap 4,98 s, load-G3G4 n=1 load1 5,78 / load5 3,35 / threads-R 22, không
  report — KHỚP; run22 G4 PASS R=0,51 tap=true gap 2,786 s, report 10/10,
  slots=11, playMax=291 ms, pauseMax=63 ms, G5 PASS, load-G3G4=None —
  KHỚP; run23 CHƯA CHẠY — KHỚP.
- Flake gộp (report-only): (2+0)/(34+1) = **2/35 = 5,71%, Wilson 95%
  [1,6%, 18,6%] ~2–19%** — KHỚP. Tính cả run21 (G4 PASS trong log, không
  report): **2/36 = 5,56%, Wilson [1,5%, 18,1%] ~2–18%** — KHỚP. J7 báo
  cả 2 số đúng như prereg đã đăng ký; lưu ý 2/35 của analyzer = lịch sử
  + run22, khác thành phần với 2/35 trong prereg (a) (lịch sử + run21)
  — cùng phân số, khác thành phần; LIMITS J7 ghi rõ cả 2 cách đếm.
- Keydown mới: 1 lần / 11 slot / 22 toggle / max 291 ms; gộp **56 /
  748 / 1496 / max 2197 ms** — KHỚP. Lịch sử I6 đã kiểm lại từ LIMITS I6:
  2/34 = 5,9% và 55/737/1474/max 2197 ms — KHỚP. Bảng phân rã theo nguồn
  §5 J7 (E8 22/319/638; đợt 104 18/242/484; H6 9/110/220; I6 6/66/132)
  cộng đúng 55/737/1474, nhưng J9 chưa kiểm lại từng thành phần theo
  từng đợt.
- **Caveat 1 (J9 xác nhận từ LIMITS J7 + dữ liệu): run22 KHÔNG đạt
  chuẩn tải nặng đầy đủ** — load5 cửa sổ G3→G4 không có mẫu nào
  (sampler tải dừng ở mẫu cuối 22:58:47, trước G3 22:59:37, nguyên nhân
  chưa rõ); FPS slot gần nhất load5 ~0,9; slot0Fps 3,98 > 2. Chỉ tính là
  hoàn thành G4 kèm caveat tải, KHÔNG gộp vào bar ≥7. Bar vẫn CHƯA ĐẠT.
  Run21 cũng trượt dial (load5 3,35 < 8).
- **Caveat 2 (câu chuyện "E1 mồ côi", được dữ liệu củng cố):** driver
  resume log dừng ở dòng hiệu chỉnh tải; E1 run22 chạy 22:58:28→23:01:06
  (G4 22:59:40), không còn driver process, không run23. LIMITS J7 tự
  nhận lỗi phối hợp: chạy lại run22 lúc 22:56:53Z mà không đọc poll.log
  của J9 trước (J9 đã đóng băng cây ~22:55Z), rồi giết driver + dừng
  tải ~22:59:0x khi đọc được poll.log; E1 con mồ côi tự chạy xong. J9
  xác nhận: driver log không có dòng kill/stop (shell bị giết không tự
  ghi), nhưng E1 log + report 23:01:06Z + load file 3 mẫu + 0 process
  sót khớp hoàn toàn với câu chuyện này. Bài học J7 ghi: luồng đo phải
  đọc poll.log của luồng verify trước khi chạy lại sau reboot.
- Ghi chú nhỏ: "median" gap 4,98 s trong analyze-j7.txt là upper-median
  (n=2); median thật của [2,786, 4,98] là 3,883 s. Chỉ là quirk của
  analyzer, LIMITS J7 không lặp lại số này. P(0/2 quan sát mới | tỉ lệ
  thật 1/10) ≈ 81% — đúng ((0,9)² = 0,81); cần ~29 lần 0 flake liên tiếp
  để bác tỉ lệ 1/10 ở 95% — đúng (0,9²⁹ ≈ 0,047).
- BẤM checkbox 25 (run21 6 + run22 19), KHÔNG-bấm 0 — J9 đếm lại từ log,
  KHỚP. §3.2 run22 step-split KHỚP từng probe (0,19/1,42/0,00/0,57/0,61
  = 2,79 s). Step-split run21 (tổng 4,98 s) và gate G7a/G8/H9 của run22
  J9 chưa tính lại độc lập.
- Batch: `phase9-round108-j7-harness.txt` (1 entry, LIMITS-only).

### J8 — EPERM probe #27 + mù #26 (recount-j8.py)
- Headline J8: probe #27 ok=2 fail=0 (20:40:28Z, boot cc460738, heartbeat
  n=27, log probe 73 dòng, +3 dòng checklist); DEAD/STALE age 10.800 s
  trước probe. **KHỚP.**
- Mù #26 (17:40:22Z → 20:40:28Z = 3h00'06") **KHÔNG đóng hoàn toàn**:
  lỗ 1h13'58" (19:20:19Z → 20:34:17Z); file duy nhất trong lỗ là marker
  biên `round93-u4/work/measurements.json` lúc 19:20:19.137Z; 0 file
  trong (19:20:20Z, 20:34:17Z). Cửa sổ mở sau floor 54'51" (công thức đầu
  của J9 sai; số 54'51" của J8 đúng). Số reboot #34 là TẠM THỜI (cộng
  dồn với mù #24). **KHỚP.**
- Gap #33→#34 = 5h43'18". Mô hình dự báo điểm BỊ BỎ (MAE 3 dự báo điểm =
  2h05'54", MAE/median = 1,051); thống kê phân phối gap (n=28) khớp trong
  ±3 s (chênh do làm tròn bảng in của J8; J8 tính từ giờ chính xác);
  dải chứng nhận [19'07", 3h14'08"]; dải cơ học cho #35 [20:53:24Z,
  23:48:25Z] — reboot #35 thật 21:42:41Z nằm trong dải. **KHỚP.**
- WFS scan: 540/166 + 565/183 + 25/17, 540+25=565, chênh vs I7 đúng +34
  dòng / +8 file như J8 giải thích. Wave: 0 "vẫn bật" / 0 "CẢNH BÁO" /
  0 "Operation not permitted" / 4 "đã tắt" (false positive đã biết) trên
  88 log. Async `.writeFile(`: đúng 2 vị trí, đều trong helper retry đã
  biết. RAM mẫu 1.586.040 / 1.521.996 / 1.585.516 / 1.508.644 kB.
  **KHỚP.**
- Batch: `phase9-round108-j8-eperm.txt` (1 entry).

## 3. Reboot trong đợt (kiểm trực tiếp bằng `uptime -s`)

| # | Giờ (Z) | Gap trước | Ghi chú |
|---|---|---|---|
| #34 | 2026-11-13 20:34:17 | 5h43'18" (từ #33) | Baseline đầu đợt; boot `cc460738…` |
| #35 | 2026-11-13 21:42:41 | 1h08'24" | Trong dải cơ học J8 [20:53:24Z, 23:48:25Z]; giết run21 của J7 sau G4 PASS; R2 của J3 bắt đầu sau đó |
| #36 | 2026-11-13 22:53:56 | 1h11'15" | Trong dải cơ học suy ra [22:01:48Z, 01:56:49Z]; giết driver resume J7 giữa lúc chờ tải run22 lần 1 |

- Chưa có reboot #37 tới 23:26Z (`uptime -s` vẫn 22:53:56).
- Dị thường đã ghi: process cũ KHÔNG chết ngay ở 21:42:41 — probe run21
  của J7 + load sampler + Chromium còn ghi file tới 21:43:09–21:43:10
  (~30 s sau boot mới); poll của J9 cũng bị gián đoạn trong cửa sổ đó.
  Đồng hồ boot cũ chạy nhanh so với boot mới (lệch ~28–88 s đợt này).
- `max_user_watches` đọc 63756 sau reboot #36 (trước đó 63747).

## 4. Kiểm chứng cây gộp cuối đợt (đóng băng ~22:55Z, boot #36)

### 4.1 Suite offline — `round108-j9-verify.sh`, 27/27 exit=0 (xong 23:03:23Z)
tsc web 0; tsc desktop 0; vite build pass; playheadHold90R2 75 passed;
playheadPacing54K9 19 pass 0 fail; previewEngine 27 test passed; seek 21
passed; seekSkipRender86N3 9/9; previewLoop50F2 20 passed; ghostBlend
probe 15 xanh; rvfcClipWindow102D3 21 test passed; driftConfirmSkip103E4
12/12 PASS; css60 60/60; css61 60/60; P7 8/8; orphans 17 pass 0 fail;
r6 PASS; U4 141 pass 0 fail; media-tests 3/3 PASS; media-retry96X3 7 pass
0 fail; media-watchdog96X3 9 pass 0 fail; deint-verdict 17 pass;
deint-verdict-100b7 13 pass; armHeld99a3 16 pass; vite-diagnosis-regex
9 pass; xvfb-lock 8 (PASS, không lỗi); test-preview-engine.sh **354
assertions pass**. Log: `hidden_files/round108-j9/round108-j9-suites.log`.

### 4.2 O8 click-test 21/21 — CẢ 2 ENGINE
- **Chromium 21/21 pass, 0 fail** (23:05:53–23:06:48Z, exit=0).
- **WebKit lần 1 exit=2 — KHÔNG KHỞI ĐỘNG ĐƯỢC** (23:06:55Z): MiniBrowser
  lỗi `libevent-2.1.so.7: cannot open shared object file`. Điều tra: lib
  CÓ trên đĩa (`/usr/lib/x86_64-linux-gnu/libevent-2.1.so.7` →
  .so.7.0.1; gói libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2; ldconfig tìm
  thấy); các lib bundle của webkit-2388 cũng CÓ đủ (package 355M,
  INSTALLATION_COMPLETE, DEPENDENCIES_VALIDATED); chạy trực tiếp
  `./pw_run.sh --help` thì MiniBrowser load được (chỉ cảnh báo display).
  Đợt 107 O8 WebKit đã 21/21 (19:04:11Z 13/11). Kết luận lúc đó: **lỗi
  môi trường/loader thoáng qua sau reboot #36, KHÔNG phải lỗi sản phẩm**
  (nhiều khả năng ld.so.cache chưa ổn định ngay sau reboot).
- **WebKit chạy lại 23:18:20Z: 21/21 pass, 0 fail, exit=0.** O8 HOÀN TẤT
  cả 2 engine. Lần lỗi đầu được ghi lại ở đây, không giấu.
- Fixture O8 (`o8-white-720p-6s.mp4`, `o8-ball-720p-6s.mp4`,
  `o8-track-35-65.json`) copy từ scratch đợt 107-i9 sang
  `hidden_files/round108-j9/o8-chromium/` + `o8-webkit/`. O8 chạy sau khi
  run22 của J7 đã xong (E1 kết thúc 23:01:06Z; run23 không chạy) — không
  chồng tải đo của J7. Lưu ý: O8 WebKit retry chạy lúc J7 đang viết
  LIMITS (chỉ ghi docs, không chạy probe) — không va chạm.

### 4.3 Cây không đổi
- `preview.tsx` md5 `ced42efd785724c8c0d1b16fc32c7341` — kiểm ở mọi lần
  poll, kể cả sau toggle E4 của J1 (khôi phục đúng) và sau reboot #35/#36.
- 0 file production đổi trong đợt (đợt đo lường thuần túy; mọi luồng chỉ
  thêm LIMITS + script/log trong `hidden_files/` + docs).
- LIMITS gộp đợt 108 của parent (`docs/PHASE9_ROUND108_LIMITS.md`) và
  `PHASE9_GAP_ANALYSIS.md` cập nhật là công việc của parent (batch
  closing 23:25Z) — J9 chỉ kiểm 2 entry đó tồn tại + là text, không kiểm
  nội dung (xem §6).

## 5. Đếm batch (đếm lại từ đĩa, 23:26Z, recount-batches.py)

| Đợt | Batch | Entry | Unique |
|---|---|---|---|
| 106 | 9 | 21 | 21 |
| 107 | 10 | 21 | 21 |
| 108 | 9 | 16 | 16 |
| **Tổng chờ push (106+107+108, chưa kể J9)** | **28** | **58** | **56** |
| **Cộng J9 (+1 batch, +1 entry)** | **29** | **59** | **57** |

- Đợt 108 chi tiết: j1-rearm 1, j2-2mib 4, j3-zombie 2, j4-blur 2,
  j5-blurclustera 2, j6-ghost 1, j7-harness 1, j8-eperm 1 (= 14) +
  closing 2 (= 16). Overlap 106∩107 = `PHASE9_GAP_ANALYSIS.md` duy nhất;
  overlap baseline(106+107)∩108 = `PHASE9_GAP_ANALYSIS.md` (do batch
  closing). Trong nội bộ 8 batch luồng: 0 overlap.
- Đợt 108 kiểm từng file: **0 thiếu, 0 workflow, 0 binary** (đọc lại từng
  file paths-loop; kiểm NUL 8KB đầu).
- Toàn cục paths-loop: 640 file batch / 2969 entry unique.
- **+ 1 file oversize chưa lên:** `benchmarks/results/webkit-blob-flaky-96x3.json`
  (6.370.678 B, vượt giới hạn 2,8 MB/lần đẩy) — vẫn stage chờ xử lý sau.
- Lưu ý đính chính so với đầu đợt: tổng chờ push trước đợt 108 là 19
  batch / 42 entry / 41 unique + 1 oversize (đúng như task giao); đợt 108
  thêm 9 batch / 16 entry / 16 unique (không phải 8/14/14 như đếm giữa
  đợt — batch closing của parent thêm 2 entry).

## 6. Giới hạn kiểm chứng của chính J9 (đọc trước khi trích số)

1. J1: frzMax/frzTail/rate chưa tính lại độc lập (chỉ nhất quán nội bộ).
2. J3: p90 đã khớp quy ước nearest-rank ceil của J3 (p90 nội suy tuyến
   tính lúc đầu lệch — chỉ khác phương pháp); 3 đính chính §2 J3 là của
   J9, LIMITS J3 chưa sửa theo (J3 đã xong việc, không viết lại).
3. J6: pass-7 coverage dip (30/40) và "gap at seek 0/1 (14/14)" chưa
   tính lại độc lập.
4. J7: step-split run21 và gate G7a/G8/H9 của run22 chưa tính lại độc
   lập; phân rã keydown theo nguồn (§5 J7) cộng đúng nhưng từng thành
   phần chưa kiểm lại theo từng đợt; nguyên nhân sampler tải run22 dừng
   sớm (mẫu cuối 22:58:47) chưa rõ; câu chuyện "E1 mồ côi" được củng cố
   bằng dữ liệu nhưng driver log không có dòng kill/stop trực tiếp.
5. J2: finalCt run9 = 7,167 (J2 viết tắt "8") — không đổi kết luận.
6. J6: p90 rAF gap J6 ghi 31,3 vs J9 tính 31,0 — lệch nội suy percentile
   0,3 ms, không đáng kể.
7. O8 WebKit lần 1 lỗi môi trường (không phải lỗi sản phẩm); retry đã
   pass — nhưng lần lỗi đầu cho thấy loader WebKit nhạy với trạng thái
   ngay sau reboot (ld.so.cache); nếu O8 WebKit lại fail ngay sau
   reboot, chạy lại sau vài phút trước khi kết luận.
8. LIMITS gộp đợt 108 của parent + GAP_ANALYSIS.md cập nhật: J9 chỉ
   kiểm tồn tại + text, không kiểm nội dung (đó là công việc của parent).
9. J7 LIMITS về sau khi J9 đóng băng cây (~22:55Z); J7 không sửa
   production nên cây đã kiểm vẫn đứng — nhưng J7 về muộn là late merge,
   không phải về đúng hạn.
10. TTS 39 CẤM kiểm lại (không kiểm); birefnet 0 lần thành công (không
    thử); ci-security.yml vẫn 403 chờ user (ngoài phạm vi).

## 7. Nợ mở sang đợt 109 (từ LIMITS gộp đợt 107 §4 + đợt 108)

- G1 deinterlace: chờ user quyết metric (G5 vs M2) — vẫn mở.
- Mù #22: mức tin cậy chờ user quyết (giữ "đóng" hay "đóng có điều kiện").
- J3 đính chính: CDP 12 (không phải 14), trusted 22/33 (không phải 0),
  framing 4990 ms pre-play — cần sửa vào LIMITS J3 hoặc ghi vào LIMITS
  gộp đợt sau.
- J7 bar ≥7 lần E1 tải nặng vẫn CHƯA ĐẠT (6/7): đợt sau chạy tiếp E1 và
  CHỈ tính lần đạt dial tải trong cửa sổ G3→G4 (load5 ≥ ~8, slot0Fps ≤
  ~2); kiểm dial TRƯỚC khi cho E1 chạy tới G3; xếp vite các luồng nặng
  không chồng nhau (ENOSPC); luồng đo đọc poll.log của luồng verify
  trước khi chạy lại sau reboot; J3 (và mọi luồng) nhớ tạo cờ done.
- J4 B-band c0 đã đạt bar nhưng c2 vẫn thiếu 7 B-cap tới ~115/nhóm.
- J5 E6 vẫn mở (6/8 sự kiện).
- ENOSPC inotify watchers (63747/63756) vẫn là nghẽn hạ tầng — J7
  run18–20 chết vì va chạm watcher với J3; tăng max_user_watches ở cấp
  hệ thống vẫn là nợ mở.
- ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ
  thử lại khi RAM đổi (ngưỡng 6 GB).
- Mù #26 KHÔNG đóng hoàn toàn (lỗ 1h13'58"); mù #24/#21, reboot #16,
  đề xuất cron EPERM 10 phút vẫn chờ user.

## 8. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND108_J9_VERIFY_LIMITS.md` (file này) — mới.
- Script + log kiểm chứng: `hidden_files/round108-j9/` (`poll.log`,
  `recount-j1.py/.txt`, `recount-j2.py/.txt`, `recount-j3.py/.txt`,
  `recount-j4.py/.txt`, `recount-j5.py/.txt`, `recount-j6.py/.txt`,
  `recount-j7.py/.txt`, `recount-j8.py/.txt`, `recount-batches.py/.txt`,
  `round108-j9-verify.sh`, `round108-j9-o8.sh`, `round108-j9-suites.log`,
  `round108-j9-o8.log`, `o8-chromium/`, `o8-webkit/`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round108-j9-verify.txt`
  (NUL-delimited, 1 entry: file này).

```bash
# Chạy lại recount J7 từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j9/recount-j7.py
# Đếm lại batch từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j9/recount-batches.py
# Chạy lại suite cây gộp:
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j9/round108-j9-verify.sh
```

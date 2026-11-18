# PHASE9_ROUND114_LIMITS — LIMITS gộp đợt 114 (verify độc lập Q9)

> Luồng Q9, đợt 114, lượt cron 21:35 +07 14/11/2026. Poll Q1–Q8 từ 14:44:45Z,
> poller lần 1 bị reboot #46 giết lúc 15:44:49Z (poll #12, 2/8), poller lần 2
> đủ 8/8 lúc 16:46:22Z (poll2 #13; log `hidden_files/round114-q9/poll-q9.log`).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> **KHÔNG push. KHÔNG release/tag.** Không sửa production trong verify.
> `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b` trước = sau verify.
> Boot trong lúc poll + đo Q1–Q8: **#45** (13:17:42Z, `cd4cac0b`) → **reboot #46**
> = 15:44:49Z (`7a0638c4`) giữa đợt (xem §8 + §9).
> Dữ liệu verify: `hidden_files/round114-q9/` (`recount-q9-all.py` +
> `recount-q9-all.txt`, `recount-q6-rerun.txt`, `round114-q9-suites.log`,
> `q9-o8.log`, `poll-q9.log`, `poller-q9.sh`, `poller-q9b.sh`).

## 0. Kết luận trước — bảng verdict 8/8 (Q9 tính lại từ dữ liệu thô)

| Luồng | Headline (LIMITS luồng) | Q9 tính lại | Verdict |
|---|---|---|---|
| Q1 E4 tải cao | 3 lượt hợp lệ tải cao, 0 CAP / 160 play-tick; Fisher Q1-lẻ p=0,0919, gộp N1+P1+Q1 0/824 p=0,000273 → E4 ĐÓNG ĐẦY ĐỦ (qua gộp, có caveat) | Chạy lại `analyze-q1-file.py` trên 4 file probe: 54/64/42 = 160 ✓, CAP 0 cả 3 luật ✓, steady-close 1892/1797 ms verified ✓, ended-close 1601 ms verified ✓ (+ att2 ngoài dải 61 tick, ended 1770 ms ✓); Fisher riêng bằng `math.comb`: 0,0919 / 0,000273 / 0,0377 / 0,000197 khớp đúng 4–6 chữ số ✓; load1 play-mean 12,25/14,21/19,17 ✓ | **KHỚP kèm đính chính** (Poisson 0,0340 của Q1 là xấp xỉ exp(−λ); nhị thức chính xác = 0,0328 — chỉ khác phương pháp, không đổi verdict; xem §5) |
| Q2 zombie cơ chế | Freeze = cổng bỏ vẽ E4+N3 (mọi biên) + main-thread stall (longtask đơn, ~1/2 là pump capture); seek ~100–300 ms, decoder chạy, ring không tràn, pump kill không phải nguyên nhân | Đọc lại classify JSON: R1 5 gap (M2 2, MIX 3, biên 3/3, dur 400–600) ✓, R2 38 gap (M2 24, MIX 14, biên 15/15, max 977) ✓; đếm lại từ results.json renderTicks: R1 2275 tick / 67 skipped ✓, R2 408 / 59 ✓; R1 10/17 longtask khớp pump invoke (từ r1-analysis.md) ✓ | **KHỚP kèm đính chính** (Q2 viết "mù #32 mở" — SAI, mù #32 đã đóng bởi Q6; #46 nằm trong mù #33; R2 7/15 Q9 không tính lại từ log thô — xem §5) |
| Q3 điểm gãy | s76 ĐÃ CHẠY (47 tick, thiếu 3 so với 50) → điểm gãy VẪN MỞ, biên GIỮ 9,59; tickRate 0,09/s, skip-stale 44,26% → dự báo KHÔNG-GIỮ (hướng khớp, chưa kết luận bar); playhead kẹt 0/3 | Tính lại từ results JSON: s76 n=47 med +1, 55,3% ±1, 0% ≤−2 ✓; tickRate 0,094/s ✓; skip-stale 54/122 = 44,26% ✓; dry 313 tick 100% ✓; loadSamples s76 mean 23,05 (n=119) ✓; stall 30s min 4,63 s ✓; halves 26/21, quarters 20/6/11/10 ✓; offset100 n=110 med −23 ✓; caps c2 73/c0 6/c1 6 ✓ | **KHỚP kèm đính chính** (claim "cửa sổ 10 s nào cũng tiến ≥1,33 s" SAI theo phương pháp P8 — có 2 cửa sổ <1,33 s, playhead đứng yên ~12 s ở ph 44,77; verdict 0 stall theo định nghĩa 30 s vẫn đứng — xem §5) |
| Q4 lock fairness | Helper vite lock v2 (FIFO ticket, priority lượt dài + aging, release-between-attempts, cooldown 15 s, logging) + test 9/9 PASS ×2 lần; migration đợt 115 | **Chạy lại `test-vite-lock-v2.sh`: exit 0, PASS=9 FAIL=0** ✓; `bash -n` cả 3 script mới OK ✓; `vcut-vite-lock.sh` md5 `fd21193c` không đổi ✓; v1 frozen không đụng ✓ | **KHỚP** |
| Q5 F6' 60 ms | Lượt duy nhất chạy xong (lần 3) KHÔNG ĐẠT lớp B (mới) vì replay apt cài package suốt cửa sổ đo → ngưỡng GIỮ nhưng MỎNG; tickCost median 70,0 (n=479); event ghost stale sau seek mới seq 282–285 (+68f); F6' 67/67 + 218/218 vẫn ĐÃ ĐÓNG | Tính lại từ `preview-b-f3-flip-webkit-q1.json`: tickCost n=479 median 70 p90 96 max 207 ✓; hậu flip n=340 median 74 ✓; tBlend gap n=401 median 109 ✓; 6 dải wallMs khớp đúng n + median ✓; labellag skp=1 n=134 max +68f ≥+5f: 4, skp=0 n=436 ≥+5f: 3 ✓; lag5-detail: đúng 7 occurrence seq 282–285, M=68 ✓; skiplatest 67/67 + 218/218 ✓ | **KHỚP** |
| Q6 EPERM | Probe #33 ok=2 fail=0; mù #32 ĐÓNG HOÀN TOÀN (mới); gap #44→#45 = 2h24'11" ĐƯỢC CHỨNG NHẬN (mới, CERT n=24); mù #31 KHÔNG đóng được (8'55", đã thử hết nguồn); wfs lần 20 chênh 0 (656/681/25); EPERM 0 sóng thật | **Chạy lại `recount-q6.py` → output IDENTICAL với `recount-q6.txt`** ✓; log probe 91 dòng ✓; heartbeat n=33 ts 14:49:23Z boot cd4cac0b ✓; cộng lại từ wfs-*.txt: 656/681/25, 656+25=681 ✓; gap 8651 s = 2h24'11" ✓; grep lại 98 log: "vẫn bật" 0, "CẢNH BÁO" 0, "Operation not permitted" 0, "đã tắt" 15 ✓ | **KHỚP** (chứng nhận gap #44→#45 là quyết phương pháp của Q6, Q9 chỉ kiểm số học — chờ parent xác nhận như #42→#43, xem §6) |
| Q7 hạ tầng | Postboot #45 PASS sau `--repair` (apt update + RE-CHECK + libevdev2); khoảng replay #46 kẹp được (1'23", 7'08"] — M8 §9.4 ĐÃ ĐÓNG; headroom #46 1300→1207; O8 boot #46 21/21 cả 2 engine | Đếm lại report JSON O8 của Q7: Chromium 21 results 21 ok ✓, WebKit 21/21 ✓; headroom log: 1300/1207/1302/1298 ✓; postboot b46 try1 FAIL / try2 PASS ("DU DIEU KIEN", apt đủ 11 package) ✓; q7-o8.log có "21/21 pass" đúng 2 lần ✓ | **KHỚP** |
| Q8 seek/preload | Trần buffer blob 17,1–17,4 s (17.421 ×3 + 17.081); H1 được hỗ trợ về cơ chế nhưng bar thời gian KHÔNG ĐẠT do tải; H2 BÁC; F1 fail (+2,49 < 5 s); F2 VIABLE (seek 653/810 ms, 243/296 frames); HTTP đầy buffer 913 ms | Đếm lại từ OUT JSON + analysis txt: bufTrace C=17.421 (r1/r3) + firstSample [[0,17.421]] (PLAYING r2) ✓; 17.081 từ 1 mẫu blob-phase duy nhất của r4 trong clean log (t=5,63 s, trước lỗi 5,72 s) ✓; PLAYPAUSE C=19.911 → F1 +2,49 ✓; SEEKFAST seekImmMs 653/810, seekedOk TRUE 2/2, frames 243/296 ✓; HTTP preloadWaitMs 913, preloadFull TRUE, 698 frames ✓; progress_after_suspend=[] 12/12 run ✓ | **KHỚP** |

**Kết luận chung Q9: 5/8 KHỚP hoàn toàn (Q4, Q5, Q6, Q7, Q8), 3/8 KHỚP kèm đính
chính (Q1, Q2, Q3 — đều là đính chính số/phương pháp, không đổi verdict
của luồng, trừ lưu ý E4 ở §1 và freeze ~12 s ở §5). Không có luồng nào
KHÔNG KHỚP. Không phát hiện code giả/mock.**

## 1. Q1 — E4 xác nhận tải cao: ĐÓNG ĐẦY ĐỦ (qua gộp) — Q9 ghi rõ caveat

- **Số liệu Q9 tính lại:** chạy lại `analyze-q1-file.py` trên cả 4 file
  `probe-results.json`: q1f2 54 play-tick (load1mean 12,25), q1f3 att2 64
  (14,21), q1f4 42 (19,17) = **160** ✓; q1f1 att2 61 tick (18,67), ngoài
  dải vì play-mean chỉ n=2 mẫu (cửa sổ phát ~10 s / sampler 5 s).
  CAP = 0 trên cả 3 luật ở cả 4 lượt có dữ liệu ✓.
- **Fisher (code riêng Q9, `math.comb`, hai phía):** Q1-lẻ 0/160 vs K1-on
  6/284 p=0,0919; gộp N1+P1+Q1 0/824 p=0,000273; tất-cả-Q1 0/221
  p=0,0377; gộp N1+P1+tất-cả-Q1 0/885 p=0,000197 — **khớp đúng 4–6 chữ
  số với LIMITS Q1**.
- **Cơ chế:** steady-close 2 đã xác minh (q1f2 1892 ms, drift 0,63; q1f4
  1797 ms, drift 0,67); ended-close 1 đã xác minh (q1f3 1601 ms);
  q1f1 att2 ended-close 1770 ms verified. **0 đuôi age ≥4000 ms** trong
  cả 3 lượt hợp lệ (MECH: 0 đuôi) — khác P1 (2 đuôi 4892/5002 ms).
  Stall-watch: 0 stall; re-seek sau steady-close 1594 ms / 396 ms.
- **Đính chính duy nhất (phương pháp, không đổi số đếm):** LIMITS Q1 ghi
  Poisson P(0|160) = 0,0340. Đó là xấp xỉ Poisson exp(−λ),
  λ=160·6/284=3,38. Nhị thức chính xác (1−6/284)^160 = **0,0328**.
  Cả hai đều từ cùng một mẫu số; Q9 ghi rõ để khỏi nhầm là lệch dữ liệu.
- **Vị trí của Q9 về verdict "ĐÓNG ĐẦY ĐỦ (qua gộp)":** Q9 kiểm được số
  học đầy đủ và quy tắc quyết định prereg §7 đã đăng ký TRƯỚC khi đo
  (đi đường gộp khi Q1-lẻ không đạt). Nhưng Q9 ghi rõ — như P8 đã làm
  với chứng nhận xuyên mù của P6 — rằng **bằng chứng tải cao trực tiếp
  vẫn chỉ là 0/160, p=0,0919, chưa đạt <0,05**; mẫu gộp 0/824 trộn tải
  thấp (N1 0/180 + P1 0/484) với tải cao (Q1 0/160). Việc "gộp" có đóng
  được E4 hay không là **quyết của parent** (Q9 không tự phê chuẩn hay
  bác bỏ, chỉ ghi lại rằng cơ sở số học là đúng và caveat là thật).
  Nếu parent không đồng ý thì E4 giữ "ĐÓNG CÓ ĐIỀU KIỆN" và cần thêm
  ~50–60 tick tải cao nữa (tới ~210 tick, p≈0,04) để đóng không cần gộp
  — Q1 §8 đã đề xuất sẵn 1–2 lượt tải cao nữa ở đợt 115.
- **Nguồn tải:** hog `nice -n 19` ĐẠT (load-trials.log: mean 8,10, max
  11,71, 10/18 mẫu trong [8,30] — Q9 đọc lại từ log, không tính lại từ
  sampler thô). SCHED_IDLE (load1 giảm dần, mean 1,45) và I/O O_DIRECT
  (D-state 0–1, canary 4,3×) KHÔNG DÙNG ĐƯỢC. Dial tải đáp ứng chậm
  60–150 s sau khi khởi hog (dị thường mới, chưa xác minh cơ chế —
  giả thuyết cgroup quota).
- Q1 không đổi production (chỉ đo + probe/LIMITS). 2 lỗi harness
  pause-seek 30 s timeout (q1f1 att1, q1f3 att1) đều retry đúng luật.

## 2. Q2 — Zombie: cơ chế freeze ở chuyển clip ĐÃ TÌM ĐƯỢC

- **Tính lại từ classify JSON:** R1 5 gap (M2 2, MIX 3; biên 3/3 dur
  600/588/598 ms; giữa clip 2/2 dur 414/400 ms) ✓; R2 38 gap (M2 24,
  MIX 14; biên 15/15, max 977 ms) ✓. Không gap nào là M1 thuần
  (0/3 R1, 0/15 R2) — H-M1-duy-nhất BÁC đúng luật prereg.
- **Đếm lại từ results.json renderTicks (drained+tail gộp):** R1 2275
  tick / 67 skipped ✓; R2 408 / 59 ✓. (Lưu ý: file render-ticks.jsonl
  riêng chỉ chứa phần drained — R1 2159 dòng / 66 skipped; 116 tick +
  1 skipped còn lại nằm trong tail của results.json. Đợt sau đừng đếm
  một mình file jsonl.)
- **Longtask = pump capture (một nửa):** R1 10/17 longtask ≥200 ms khớp
  pump invoke trong 13 ms (7 trong 5 ms) — Q9 đọc lại từ
  r1-analysis.md, khớp LIMITS. R2 "7/15 trong 1–2 ms": Q9 KHÔNG tính
  lại từ log thô (classify JSON không mang bảng khớp này; phân tích
  R2 chỉ ghi pumpN=153 + longtask cover) — ghi là lấy theo LIMITS Q2,
  không phải số Q9 đã kiểm độc lập.
- **Meta lượt R2 (từ analysis txt):** drawsTotal=drawsKept=786,
  pumpN=153, driftConfirmSkips=23, seekSkipTicks=47, state100 median
  197 ms, CDP recv-gap median 195,5 ms, rtt median 180 ms ✓ khớp LIMITS.
  R2 chạy dưới tải đồng thời nặng (Q3 tsc + vite build) nên 38 gap so
  với 5 ở R1 là hiệu ứng tải, không phải khác cơ chế — Q9 đồng ý với
  caveat này của Q2.
- **Đính chính Q2:** LIMITS Q2 §1.3 viết "Số thứ tự #46 vẫn tạm thời
  (mù #32 mở)" — **SAI**. Mù #32 đã ĐÓNG HOÀN TOÀN bởi Q6 (probe #33
  14:49:23Z, xem §6); reboot #46 nằm trong **mù #33** (mở 14:49:23Z).
  Tính tạm thời của số #46 kế thừa từ mù #29/#30/#31 chưa đóng (tối đa
  "thực tế #49" theo Q6 §2.2), không phải từ mù #32.
- **Kết luận cơ chế (giữ nguyên Q2):** freeze = cổng bỏ vẽ E4+N3 (mọi
  biên) + main-thread stall (longtask đơn; ~1/2 là pump capture, nửa
  còn lại chưa rõ — attribution trả về 'unknown' 409/409) + tick
  interval giãn dưới tải. Seek ~100–300 ms, decoder tăng đơn điệu,
  ring không tràn (draws < 8000, 0 splice), pump kill không phải
  nguyên nhân (freeze biên 3 bắt đầu trước kill 6221; biên 6 không
  có kill mà vẫn freeze). Q2 không đổi production.

## 3. Q3 — Điểm gãy tải: s76 ĐÃ CHẠY nhưng thiếu 3 tick, điểm gãy VẪN MỞ

- **Tính lại từ results JSON:** dry n=313 med 0, 100% ±1 ✓; s76 n=47
  med +1, mean +3,98, 55,3% ±1, 0% ≤−2, 44,7% ≥+2 ✓; extraction.errors
  = [] cả 2 lượt ✓; tickRate (tBlend span): dry 32,547/s, s76 0,094/s
  (≈0,09/s như LIMITS) ✓; loadSamples s76 mean 23,05 (n=119, median
  22,98, min 0,49, max 48,98) ✓.
- **Chỉ số đói pump:** pump entries s76: capture 44, skip-stale-frame
  54, skip-stale 22, skip-seeking 2 → **54/122 = 44,26%** ✓; dry
  6/236 = 2,54% ✓. Dự báo KHÔNG-GIỮ, phân loại TRUNG-GIAN — hướng
  khớp, nhưng s76 không hợp lệ (<50 tick) nên KHÔNG kết luận bar
  (đúng prereg §2).
- **Halves/quarters (tBlend chuẩn hoá, vì tBlend bắt đầu ở 94,6 s chứ
  không phải 0):** nửa đầu 26 tick med +3 / 42,3% ±1; nửa sau 21 tick
  med 0 / 71,4% ✓; quý 20/6/11/10 ✓. Caps theo clip: c2 73, c0 6,
  c1 6 ✓. offset100 (từ analyzer txt): dry n=90 med +1 / 63,3% ±1;
  s76 n=110 med −23, mean −13,91, 8,2% ±1, 61,8% ≤−5 ✓.
- **Stall 30 s (định nghĩa prereg):** tính lại theo phương pháp P8
  (mọi cặp mẫu, wall-diff [25,30]s): tiến nhỏ nhất **4,63 s** ✓ —
  **0 episode stall theo định nghĩa 30 s, tỉ lệ tái hiện 0/3** (s77,
  s78, s76) giữ nguyên.
- **ĐÍNH CHÍNH QUAN TRỌNG (Q9 phát hiện khi tính lại):** LIMITS Q3 §4
  viết "cửa sổ 10 s nào playhead cũng tiến ≥1,33 s". **SAI theo phương
  pháp P8** (mọi cặp mẫu, wall-diff [8,10]s): min advance = **0,00 s**,
  có đúng **2 cửa sổ <1,33 s** — (130594→139502, 0,00 s) và
  (322693→331214, 0,77 s). Playhead đứng yên ở **ph 44,7667 qua 3 mẫu
  liên tiếp (wallMs 127682 / 130594 / 139502 — 11,82 s, playing=True)**,
  rồi mới tiến tiếp (46,73 ở 143606). Đây là một lần **đóng băng
  playhead ~12 s thật** trong lượt s76 — không đủ dài để vi phạm
  định nghĩa stall 30 s của prereg (nên verdict 0/3 vẫn đứng), nhưng
  câu "playhead không đứng yên ở bất kỳ thang nào — kể cả thang ngắn
  hơn 30 s" trong LIMITS Q3 là **sai**. Q9 ghi lại để đợt sau đối
  chiếu: stall-watch của s76 chứa 1 freeze ~12 s ở ph ~44,8 s (giữa
  clip c14/c15?) + 1 lần tiến chậm 0,77 s/8,5 s ở ph ~109–110 s.
  (Q3 có thể đã tính cửa sổ 10 s bằng cách khác — mẫu đầu tiên ≥10 s
  sau — nhưng Q9 kiểm cả cách đó vẫn ra min 0,00 s ở cửa sổ
  127682→139502, span 11,82 s.)
- **Dị thường load1 sụp (§5 Q3):** Q9 ghi nhận diễn giải throttle
  cgroup (40 hog chỉ tích ~20 s CPU sau 9:40, threadsR ~50 trong khi
  load1 rơi về ~1) là suy luận từ số đo, chưa đo trực tiếp cgroup
  cpu.stat — đúng như Q3 đã ghi caveat. Hai sampler độc lập khớp tải
  lúc phát (23,05 vs 24,0) nên phân loại lượt không bị ảnh hưởng.
- Q3 chạy tsc 0 + vite build PASS 10,97 s trên boot #46 (16:21Z);
  không sửa production; 0 lần DEFERRED (lock lượt dài có tác dụng —
  acquire ngay lần đầu 16:00:46Z).

## 4. Q4 — Lock fairness: helper v2 xong, CHƯA dùng trong đo thật

- **Q9 chạy lại test:** `bash apps/web/scripts/test-vite-lock-v2.sh` →
  exit 0, **PASS=9 FAIL=0** (Q9 chạy lại 1 lần; Q4 chạy 2 lần, kết quả
  giống hệt). `bash -n` cả 3 script mới (v2 lock, v2 poll, test) đều OK.
  `vcut-vite-lock.sh` (v1) md5 `fd21193c` không đổi; bản frozen v1
  không đụng.
- **Thiết kế v2 (ghi lại, không kiểm lại từng dòng code):** hàng đợi FIFO
  bằng ticket `<class>-<nanos>-<pid>-<thread>`; class 0 `long` trước
  class 1 `normal` + aging (normal chờ >1800 s được nâng hạng);
  `run-attempt` bắt buộc acquire → 1 attempt → nhả trong trap (kể cả
  fail/SIGTERM); dial-wait PHẢI ở ngoài wrapper; stale-lock đủ 3 điều
  kiện + đường tắt boot-đổi; cooldown 15 s sau nhả cho cùng thread;
  logging đầy đủ (TICKET/ACQUIRED/RELEASED/TIMEOUT/STALE-LOCK/...).
  Poll yên v2 (`vcut-poll-quiet-v2.sh`) theo mẫu M5/L7 đã vá
  (`[W]ebProcess` + `grep -v grep`).
- **Hạn chế trung thực (giữ nguyên Q4 §6):** v2 CHƯA được luồng đo nào
  dùng trong đợt 114 (chỉ test standalone trên /tmp, cổng giả, không
  vite thật). Migration là việc đợt 115 (parent quyết): 1 driver thí
  điểm lượt ngắn → đối chiếu `vite-lock-v2.log` → mới coi v2 là chuẩn.
  V1 và v2 dùng chung lockdir nên tương tác được, NHƯNG waiter v1
  không lấy ticket nên fairness đầy đủ chỉ đạt khi TẤT CẢ luồng cùng
  dùng v2.
- **Bằng chứng v2 có ích ngay trong đợt 114:** Q3 s76 acquire ngay lần
  đầu (lock trống 16:00:46Z, 0 DEFERRED) nhờ kỷ luật dial-trước-acquire
  + nhả giữa các lượt — nhưng đó vẫn là kỷ luật tự giác, chưa có cơ
  chế bắt buộc. Đói lock đợt 113 (P1 giữ ~35 phút) không tái hiện đợt
  này, một phần nhờ các luồng đã tự nhả giữa lượt (Q1/Q3/Q5 đều ghi
  rõ trong log).

## 5. Q5 — F6' WebKit ≤60 ms: lượt yên lần 3 liên tiếp KHÔNG chốt được

- **Tính lại từ `preview-b-f3-flip-webkit-q1.json`:** tickCost total
  n=479, median **70**, p90 96,0, max 207, min 29 ✓; hậu flip+2000ms
  n=340, median **74** ✓ (cao hơn
  cả median toàn lượt — ngược P4 58 < 61 và N4); tBlend gap n=401,
  median **109** ✓. Phân rã wallMs (cùng biên P4): 0–20k 75/52,0;
  20–32k 86/65,0; 32–45k 95/59,0; 45–62k 105/79,0; 62–70k 56/79,5;
  70–80k 62/60,5 — **khớp đúng n + median cả 6 dải**.
- **Lớp B (mới, quyết parent đợt 113) — VI PHẠM mục B2:** replay apt hệ
  thống cài package TRONG SUỐT cửa sổ đo 15:47:45–15:49:12Z
  (ps-before `apt-get install libpipewire-0.3-common`, ps-after
  `apt-get install fonts-ipafont-gothic` — package khác nhau ở 2 đầu;
  khung postboot Q7 FAIL cuối 15:46:12Z → PASS đầu 15:51:57Z bao trọn
  cửa sổ; load1 1,88 → 2,80 trong lượt). Q9 kiểm lại chain log Q5:
  gate lúc bắt đầu load 1,88/1,21, RAM 1413 MB ✓; lúc kết thúc load
  2,80/1,64, RAM 1563 MB ✓. Không có luồng round114 nào chạy phân
  tích nặng trong cửa sổ (0 file round114-* khác sửa trong cửa sổ —
  đúng định nghĩa mới, ghi file nhẹ không vi phạm) — nhưng tải hệ
  thống là tải, và load1 giữa lượt không được lấy mẫu nên điều kiện
  "<4" cũng không kiểm chứng đầy đủ. **Verdict giữ nguyên trạng thái
  N4: ngưỡng GIỮ nhưng MỎNG; lượt này không dùng để chốt.**
- **(b) unique-match — sự kiện MỚI:** labellag skp=1 n=134 (median 0f,
  p90 2f, max +68f, min −11f, ≥+5f: 4); skp=0 n=436 (median 0f, p90 3f,
  max +68f, min −18f, ≥+5f: 3). `lag5-detail.txt`: đúng **7 occurrence
  lag +68f, seq 282–285, tBlend 58606–58933 (327 ms), label 0, pixels
  đứng yên frame 68, presented chạy 18→20** ✓ — lần đầu mẫu "ghost
  stale sau seek (label 0 / pixels 67–76)" xuất hiện trong chuỗi (b).
  KHÁC event P4 frame-26 (lag +6..+12f, nhãn chạy 14→20) — không phải
  tái hiện. Không vi phạm bar F6' (label 0 ≠ presented 18–20).
- **F6':** skiplatest 67/67 (skp=1) + 218/218 (skp=0), 0 ứng viên ghost
  label==presented, presented−expected 285/285 =0 ✓ — **F6' vẫn ĐÃ
  ĐÓNG từ L7**. Nhãn ghost vẫn nhiễu (clean distinct skp=1 7/28 =
  25,0%, skp=0 27/124 = 21,8%; occurrence 103/126 = 81,7% /
  137/385 = 35,6% — Q9 đọc lại từ analyze-q5-skiplatest.txt, khớp).
- **Chưa kiểm lại:** bảng gStd §4 của Q5 (spread median 14,9 / max
  47,0 / 47 nhóm; trailMax 7/130; edge 2,3/0,6) — Q9 không tính lại
  từ pixel thô (metric chẩn đoán, không vào bar); lấy theo analyzer
  của Q5. Warm-up nhanh (52,0 vs P4 86,5) ủng hộ giả thuyết RAM
  (1413 MB vs 522 MB) nhưng lượt nhiễm tải nên không dùng để hiệu
  chuẩn.
- **Ba lần đo của Q5:** lần 1 FAIL launch (thiếu libevent, boot #45);
  lần 2 gate 10 phút không mở + reboot #46 giết ở pass 11/20 (probe
  kẹt 27:40 elapsed mà chỉ 2 s CPU — Q5/Q7 đều ghi; nguyên nhân kẹt
  chưa điều tra); lần 3 chạy xong 20/20 nhưng nhiễm replay. Bài học
  Q5 §6.3: lượt yên sau nên chạy SAU KHI Q7 báo postboot PASS (replay
  xong) — Q9 đồng ý, ghi vào nợ đợt 115.
- Q5 không sửa production; `vite build` không chạy lại trong luồng
  (N1 đã PASS trên cùng cây) — Q9 đã chạy vite build trên cây gộp,
  xem §8. Q5 ghi đè `run-webkit-q1.log` + ps-before/after ở lần 3
  (log lần 1+2 chỉ còn trong chain log) — lần sau tách tên file theo
  lần đo.

## 6. Q6 — EPERM: probe #33, mù #32 ĐÓNG HOÀN TOÀN, gap #44→#45 CHỨNG NHẬN

- **Checklist:** log probe v2 **91 dòng** ✓ (88 sau P6 + đúng 3 dòng
  checklist: DEAD mới cho #32 + boot-changed + probe #33);
  heartbeat n=33, ts 14:49:23Z, boot cd4cac0b ✓; `status` đầu
  DEAD/STALE (age 11.529 s), `once` probe #33 ok=2 fail=0, `status`
  lại ALIVE ✓. Baseline lượt sau là **91 dòng**.
- **Mù #32 (11:37:14Z → 14:49:23Z, 3h12'09") ĐÓNG HOÀN TOÀN (mới):**
  đoạn A đóng bằng uptime P6 (10:53:31Z → 11:37:09Z) + poller P8 MỘT
  tiến trình duy nhất (pid 12630, 18 poll 300 s, 11:37:08Z →
  13:02:10Z) + session waiter độc lập (birth 11:37:30Z → mtime
  13:02:17Z) + sàn đuôi (13:02:10Z → 13:17:42Z < sàn 19'07"); đoạn B
  đóng bằng `uptime -s` ×2 lúc 14:49:02Z (= 13:17:42Z) + probe #33 +
  dấu boot tươi P8/Q7 (13:17:42Z → 14:48:39Z). Q9 kiểm được: **chạy
  lại `recount-q6.py` → output IDENTICAL với `recount-q6.txt`**;
  CERT n=22/n=23/n=38 của N6/P6 tính lại đúng 100% (trung bình
  1h52'05" / 1h49'19" / 1h56'06"). Đây là mù đầu tiên đóng hoàn toàn
  kể từ mù #27 (K6) — cắt chuỗi 4 mù không đóng liên tiếp #28–#31.
- **Gap #44 → #45 = 2h24'11" (8651 s) ĐƯỢC CHỨNG NHẬN (mới):** khoảng
  (10:53:31Z, 13:17:42Z) không chứa cửa sổ mở nào. Tập gap đơn đã
  chứng nhận **n=23 → n=24**; toàn chuỗi **n=38 → n=39** (trung bình
  1h56'49", trung vị 1h58'47", p10 0h45'22", p90 3h04'42", sd
  1h01'40"). Dải chứng nhận [19'07", 3h14'08"] không đổi.
  **Lưu ý Q9 (như P8 với #42→#43):** Q9 kiểm được số học, poller N8,
  và recount chạy lại khớp 100%. Nhưng bản thân việc "chứng nhận
  xuyên mù" là quyết phương pháp của Q6 — Q6 đã ghi rõ chờ parent
  xác nhận; Q9 không tự phê chuẩn hay bác bỏ, chỉ ghi lại rằng cơ
  sở số học là đúng. Nếu parent không đồng ý thì hạ về cận trên,
  CERT về n=23. (Parent đã chấp nhận cách này cho #42→#43 ở đợt 113.)
- **Mù #31 KHÔNG ĐÓNG ĐƯỢC — đã thử hết nguồn còn lại:** cửa sổ mở
  8'55" (10:23:54Z → 10:32:49Z, 535 s). Q6 thử lại 5 nguồn prereg §4:
  đọc 2 proc log trong cửa sổ (không boot_id/uptime); quét toàn
  ~/workspace trong đúng cửa sổ: **8 file** (P6 đếm 9 — file thứ 9 là
  GAP_ANALYSIS, đã bị ghi đè sau cửa sổ, mtime dời sang 14:18:34Z —
  Q9 xác nhận file này nay có mtime 14:18:34Z, không phải P6 đếm sai);
  /tmp 0 file; chrome-userdata 0 file; 0 session bắc qua cửa sổ
  (U4-dry sinh đúng tại mép phải 10:32:49Z); journal/wtmp chỉ giữ boot
  #45; không syslog/kern.log; grep log sibling đợt 113: 0 dấu boot
  tươi trong cửa sổ. **Mù #31 giữ nguyên KHÔNG ĐÓNG HOÀN TOÀN — 2
  reboot đã chốt + tối đa 1 ẩn. Không còn nguồn nào để thử.**
- **Quét writeFileSync lần 20:** scan-meta NEWSTD 191 file / 656 dòng,
  R7b 208 / 681, copies 17 / 25 ✓; **Q9 cộng lại từ `wfs-*.txt`: 656,
  681, 25 — 656+25=681, chênh 0, lần thứ hai mươi liên tiếp** ✓.
  +19 dòng / +4 file so với lần 19, giải thích đúng hết bằng diff
  (7 LIMITS P6 + 2 LIMITS gộp 113 + 8 probe114q3 + 1 probe114q1 +
  1 GAP_ANALYSIS = 19 ✓). Async `.writeFile(`: vẫn đúng 2 vị trí
  trong helper retry đã biết — 0 stray.
- **EPERM:** grep lại đúng 98 file log trong `blind32-logfiles.txt`:
  "sóng EPERM vẫn bật" 0, "CẢNH BÁO 10 phút" 0, "Operation not
  permitted" 0, "sóng EPERM đã tắt" **15** (dương tính giả launcher
  đã biết: P1 11×, P7 1×, P8 3×) ✓. Sóng gần nhất vẫn ~11:55–12:11Z
  (R7) — ~74h38' trước probe #33. EPERM vẫn KHÔNG được tuyên bố hết.
- RAM: 828.412 kB lúc probe #33 / 1.860.444 kB lúc scan xong; max
  trong mù #32 từ log sibling 2.872.556 kB ≈ 2,74 GB = 45% guard —
  birefnet KHÔNG chạy, vẫn 0 lần thành công. **Mù #33 bắt đầu
  14:49:23Z** (probe #33) — lượt sau (probe #34) đối chiếu từ mốc
  này, trên boot cd4cac0b (#45). Dải cơ học cho #46 từ #45:
  [13:36:49Z, 16:31:50Z] — hiệu dụng [14:49:23Z, 16:31:50Z].

## 7. Q7 — Hạ tầng: postboot #45 PASS sau repair; replay #46 kẹp được; O8 21/21

- **Postboot #45 — PASS TOÀN BỘ sau `--repair` (15:05Z, 107' sau
  boot):** quyết định apt — CHO `--repair` chạy `apt-get update` rồi
  mới install. Bằng chứng khô: network tới archive 200 OK, sources
  hợp lệ, `--print-uris` 112 URI, không lock, đủ quyền root. Chứng
  minh sống: update OK (~12 phút lần đầu), install đủ 11 package
  (10 cũ + `libevdev2` mới). Q9 kiểm lại: try1 FAIL (libs 5/5, apt
  10/10) → repair lần 1 exit 1 (chỉ còn thiếu libevdev) → repair lần
  2 exit 0, RE-CHECK đủ 4 cửa, kết luận "DU DIEU KIEN".
- **Hai lỗi script tìm ra + sửa:** (i) `--repair` cũ install thẳng khi
  lists trống nên luôn FAIL "Unable to locate package" (thiếu bước
  update trước); (ii) script kết luận CHUA DU ngay cả khi install
  thành công (FAIL ghi trước repair, không kiểm lại) — thêm khối
  RE-CHECK §4b; (iii) `libevdev2` thiếu khỏi NEED dù mục libs đòi
  `libevdev.so.2` — thêm thành package thứ 11.
- **Khoảng replay boot #46 — ĐÃ KẸP ĐƯỢC (1'23", 7'08"], nợ M8 §9.4
  ĐÃ ĐÓNG cho boot này (lần đầu kẹp được):** try1 tay 15:46:12Z
  (boot 1'23" tuổi) FAIL — libs thiếu, GST thư mục thật chỉ 3 file,
  apt thiếu 9 package; try2 watcher 15:51:57Z (boot 7'08") PASS toàn
  bộ — wrapper PASS, libs đủ 5, GST thư mục thật 269 file, apt đủ 11
  package. Q9 kiểm lại: try1 có FAIL ✓, try2 (early-watch) có
  "DU DIEU KIEN" + "11 package" ✓. Lúc 15:46Z `ps` thấy `apt-get
  install … gstreamer1.0-plugins-base` + `dpkg` đang chạy — replay
  CHẠY thật ngay sau boot #46, khác hẳn #45 (0 tiến trình apt/dpkg
  trong 103 phút). Hai boot liên tiếp cho hai hành vi replay khác
  nhau; không suy ra quy luật chung từ 1 mẫu. Khoảng replay #45 vẫn
  mở (không kẹp được).
- **Headroom inotify boot #46:** mới boot 1300 → cuối lượt 1207
  (Q9 kiểm lại log: b46-1 có '1300', b46-2 có '1207' ✓; b45: 1302 /
  1298 ✓). Reboot KHÔNG hồi headroom (vẫn ~1300 lúc mới boot); chạy
  vite/O8 làm rơi thêm ~93 watch trong ~12–15 phút. Vite thường
  (~1586 watch) KHÔNG chạy được; vite tạm `watch.ignored` vẫn bắt buộc.
- **O8 boot #46 (Q7 chạy, sau postboot PASS nhờ replay):** Chromium
  21/21 (15:57:09Z, S7 Δx=0,112/0,113), WebKit 21/21 (15:58:01Z, S7
  Δx=0,194/0,197), ENOSPC 0, lock nhả sạch. Q9 đếm lại report JSON:
  Chromium 21 results 21 ok ✓, WebKit 21/21 ✓; q7-o8.log có
  "21/21 pass" đúng 2 lần ✓. O8 trên boot #45 KHÔNG chạy được (reboot
  #46 giết lượt trước khi Q5 xong) — ghi rõ, không giấu. Đây là O8
  đầu tiên chạy trên cây mà postboot PASS nhờ replay hệ thống thật
  (không nhờ `--repair` tay như #45).
- **Lỗi `set -u` + `LD_LIBRARY_PATH` (nợ 12(d) đợt 113):** postboot-check
  KHÔNG mắc lỗi này (mọi `${…}` không-guard đều nằm trong chuỗi đơn,
  trừ `${DISPLAY:-}` đã có guard) — không cần sửa. Driver O8 của Q7
  copy từ bản P8 đã sửa (`${LD_LIBRARY_PATH:-}`).
- Q7 không sửa production (`preview.tsx` md5 `03bf029f` không đổi,
  `vcut-vite-lock.sh` md5 `fd21193c` không đổi); `bash -n`
  postboot-check + watcher early-run OK. Watcher early-run cho reboot
  sau đã chuẩn bị sẵn (script + file trạng thái + hướng dẫn) — cần
  parent duyệt cách vận hành (cron đầu lượt hoặc luồng infra đầu tiên
  sau reboot chạy nó).

## 8. Kiểm chứng cây gộp (Q9 chạy sau khi 8/8 xong)

Cây gộp = repo sau khi Q1–Q8 stage xong (không luồng nào còn chạy).
`preview.tsx` md5 **03bf029f** trước = sau verify. Boot lúc verify:
#46 (15:44:49Z, `7a0638c4`).

### 8.1 Suite offline (script `round114-q9-verify.sh`, copy P8, log `round114-q9-suites.log`)

Tất cả **27 mục exit 0** (chạy 17:01:49–17:05:33Z, boot #46, RAMavail
430 MB lúc bắt đầu):

| Mục | Kết quả |
|---|---|
| tsc web / tsc desktop | exit 0 / exit 0 |
| vite build | PASS (6,51 s) |
| playheadHold90R2 (hold) | **93 passed** |
| playheadPacing54K9 (pacing) | **19 pass, 0 fail** |
| ghostBlend.probe | **15/15** ✓ |
| driftConfirmSkip103E4 (test E4) | **5/5 PASS** |
| css60 / css61 | **60/60 / 60/60** |
| P7-esbuild (i18n audit) | **8/8 pass** |
| orphans (binOrphan60Q7) | **17 pass, 0 fail** |
| r6 (i18n check) | **PASS** |
| U4 failfast | **141 pass, 0 fail** |
| test-preview-engine.sh | **354 assertions pass** |
| Khác (previewEngine, seek 21, seekSkipRender 9/9, previewLoop 20, rvfcClipWindow, media-tests 3/3, deint-verdict ×2, armHeld, vite-diagnosis-regex, xvfb-lock) | exit 0 |

### 8.2 Reboot #46 giữa đợt (15:44:49Z) — Q9 đo trực tiếp

- `uptime -s` = **2026-11-14 15:44:49Z** (đo 2 lần: lúc poller bị giết
  15:45:56Z + Q1/Q2/Q3/Q5 đối chiếu khớp); boot_id mới
  `7a0638c4-950a-45a0-a068-c290310fc0de`, khác #45 `cd4cac0b`.
  Gap #45→#46 = **2h27'07"** (8827 s) — trong dải chứng nhận
  [19'07", 3h14'08"], không phá sàn. Số thứ tự #46 TẠM THỜI (mù #33
  mở — xem §6; kế thừa mù #29/#30/#31 chưa đóng, tối đa "thực tế #49").
- **Gap #45→#46 là CẬN TRÊN cho tới khi mù #33 đóng** (probe #34 ở
  đợt 115). Không chứng nhận như #44→#45.
- Reboot giết: poller Q9 lần 1 (SIGTERM, poll #12, 2/8 lúc 15:40:54Z);
  probe WebKit lần 2 của Q5 (kẹt pass 11/20); driver R1 lần 1 của Q2
  (đang chờ lock, chưa chạy probe — không mất dữ liệu đo); driver
  lần 1 của Q3 (đang chờ cờ Q5 — dry đã xong trước reboot nên giữ
  nguyên hiệu lực); driver lần 1 của Q8 (đang guard). Không mất dữ
  liệu đo nào của đợt (mọi luồng đều resume sau reboot; Q5 chạy lại
  lần 3 xong 15:49:12Z; Q3 resume 15:47:18Z; Q2 R1 chạy sau khi Q5 đo
  xong; Q8 chạy lại detached 15:49Z).
- Dải cơ học Q6 đã dự báo cho #46 ([14:49:23Z, 16:31:50Z] hiệu dụng):
  #46 thực tế 15:44:49Z **nằm trong dải** ✓. P10–p90 toàn chuỗi
  [14:03:03Z, 16:22:24Z] cũng chứa 15:44:49Z ✓.

### 8.3 O8 Chromium 21/21 (Q9 chạy lại trên cây gộp, boot #46)

- Driver `q9-o8-driver.sh` (copy Q7, lock đóng băng md5 `fd21193c`,
  vite tạm `watch.ignored`, DISPLAY :197, port 5554): acquire lock
  ngay 17:06:15Z, chạy 17:06:15–17:07:06Z.
- **`== KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note ==`, exit 0**;
  report JSON đếm độc lập: 21 results, 21 ok ✓. S7 mask Δx=0,112 /
  bóng Δx=0,113 ✓. **ENOSPC 0 lần** (0 dòng ENOSPC trong log).
  42 dòng PASS trong log (21 + 21 cả 2 engine).

### 8.4 O8 WebKit 21/21 (Q9 chạy lại trên cây gộp, boot #46)

- Cùng driver, DISPLAY :198, port 5564, LD_LIBRARY_PATH có debroot
  (như Q7): chạy 17:07:06–17:07:58Z.
- **`== KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail, 0 note ==`,
  exit 0, 17:07:58Z**; report `o8w-clicktest-report.json` đếm độc lập:
  21 results, 21 ok ✓. S7 (WebKit): mask Δx=0,194 ✓ (kỳ vọng canvas
  0,194). ENOSPC 0.
- Sau nhả lock: curl 5554 = 000, curl 5564 = 000; không còn vite server
  nào chạy; lock TRỐNG.
- **Kết luận O8 đợt 114:** cả hai engine 21/21 trên cây gộp, boot #46 —
  Q7 chạy 15:57–15:58Z và Q9 chạy lại 17:06–17:08Z, cả hai đều PASS.
  Lần này postboot #46 PASS nhờ replay hệ thống thật (không nhờ
  `--repair` tay như #45) — hạ tầng boot #46 khỏe hơn #45 ở điểm này.

## 9. Batch đợt 114 + lũy kế chờ push (đếm lại từ đĩa, Q9)

| Đợt | Batch | Entry | File duy nhất |
|---|---|---|---|
| 111 | 10 | 21 | 21 |
| 112 | 9 | 21 | 21 |
| 113 | 9 | 18 | 18 |
| **114** | **8** | **17** | **17** |
| **Lũy kế 111+112+113+114** | **36** | **77** | **68** |

- Đợt 114: Q1 2 / Q2 2 / Q3 2 / Q4 4 / Q5 1 / Q6 1 / Q7 2 / Q8 3 = 17
  entry, 17 file duy nhất, 0 trùng lặp trong đợt, 0 workflow
  `.github/*`, 0 binary.
  1 file trùng với đợt 111+112+113 (`apps/web/scripts/
  vcut-webkit-postboot-check.sh` — Q7 sửa tiếp bản P7 đã stage).
- File >37.768 B trong đợt 114 (cần `ENABLE_PRIVSEP=0` khi push):
  probe114q1.mjs (47.541), probe114q2-frame-parity.mjs (62.660),
  probe114q3-frame-parity.mjs (48.898),
  PHASE9_ROUND114_Q6_EPERM_LIMITS.md (52.202),
  webkit_blob_flaky_114q8_2mib.mjs (78.151).
- **Chưa lên (ngoài batch):** 1 file oversize 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (vượt giới hạn 2,8 MB/lần
  đẩy, từ đợt 112); dữ liệu thô + prereg + analyzer của Q1–Q8 ở
  `hidden_files/round114-q*/` (không stage, theo tiền lệ); OUT JSON
  lớn của Q2 (104,8 + 24,8 MB results.json) + Q8 (195.951 B OUT JSON,
  theo lệnh không stage `benchmarks/results/`).
- **Batch verify Q9:** `phase9-round114-q9-verify.txt` — 1 entry:
  `docs/PHASE9_ROUND114_LIMITS.md` (file này). Q9 không đổi file repo
  nào khác (chỉ đo + verify). Lũy kế với batch Q9: **37 batch / 78
  entry / 69 file duy nhất** chờ user push (cộng 1 file LIMITS gộp mới).
- **KHÔNG push.** User tự push sau từ main chat.

## 10. Nợ mở sang đợt 115 (cập nhật từ §10 đợt 113)

1. **E4 — ĐÓNG ĐẦY ĐỦ (qua gộp) nhưng còn caveat, cần parent quyết
   (xem §1).** Bằng chứng tải cao trực tiếp 0/160 (p=0,0919) chưa đủ
   lực một mình. Đợt 115: 1–2 lượt tải cao nữa (cùng luật Q1, ~50–60
   tick nữa là tới ~210 tick, p≈0,04) để bỏ caveat — hoặc parent chấp
   nhận đường gộp N1+P1+Q1 làm đủ. Dial tải cần cải tiến (yêu cầu hogs
   chạy đủ ~90–120 s hoặc tải ổn định/không giảm trước khi tuyên bố
   ĐẠT; sampler dày hơn 2 s để play-mean có n lớn hơn).
2. **Zombie — cơ chế ĐÃ TÌM ĐƯỢC, chuyển sang hướng sửa (quyết sản
   phẩm).** Freeze = cổng bỏ vẽ E4+N3 + main-thread stall (longtask
   đơn; ~1/2 là pump capture, nửa còn lại chưa rõ — nghi GC, cần
   Chrome tracing hoặc Long Animation Frame API để chốt; attribution
   API đã chứng minh không đủ). Hướng sửa đáng đánh giá: đưa capture
   của pump ra khỏi main thread (OffscreenCanvas trong worker / snapshot
   nhỏ hơn); giảm chi phí tick bị bỏ vẽ (vẽ lại frame cũ thay vì bỏ
   hẳn — cân nhắc vì N3 đã chứng minh vẽ lúc seeking làm seek chậm
   3–11×); giới hạn thời lượng capture. Không cần thêm lượt
   freeze-run kiểu cũ (mẫu đã đủ: 18/18 gap biên có skip, 25/25 gap
   giữa clip là M2).
3. **Điểm gãy tải — VẪN MỞ.** Biên GIỮ 9,59 (s71). s76 TRUNG-GIAN
   nhưng không hợp lệ (47 < 50 tick — thiếu đúng 3 tick). Đợt sau:
   hoặc chạy lượt dài hơn (~177 clip theo tính toán lạc quan, nhưng
   tick rate suy giảm theo thời gian nên cần tính lại bằng rate nửa
   sau 0,085/s → ~590 s tường, ~197 clip, tường ~30 phút/lượt); hoặc
   tìm metric presented không phụ thuộc mật độ tick rVFC (nợ gốc từ
   P5). **MỚI (Q9 phát hiện):** stall-watch s76 chứa 1 freeze playhead
   ~12 s ở ph 44,77 (3 mẫu liên tiếp đứng yên) + 1 lần tiến chậm
   0,77 s/8,5 s ở ph ~109–110 s — không vi phạm định nghĩa stall 30 s
   nhưng cần luồng sau soi lại bằng cửa sổ hẹp hơn (10 s) thay vì chỉ
   cửa sổ 30 s; playhead kẹt 0/3 theo định nghĩa 30 s vẫn đứng, nhưng
   đừng tuyên bố "không đứng yên ở thang nào". Load1 không đo được
   tải thật khi hog vượt CPU quota (dùng threadsR + tick rate +
   skip-stale kèm theo). Element chết format error lần thứ 2 liên tiếp
   (pool giữ element lỗi từ đầu lượt — vệ sinh pool, không ưu tiên cao).
   Chỉ số đói pump (bar (c)) mới kiểm chứng lần đầu, CHƯA kết luận —
   cần thêm lượt HỢP LỆ (≥50 tick).
4. **Lock fairness v2 — migration đợt 115 (parent quyết).** 1 driver
   thí điểm dùng v2 cho lượt ngắn (timeout acquire 900 s, prio
   `normal`), các luồng khác vẫn v1; đối chiếu `vite-lock-v2.log`
   (wait time tối đa, có waiter nào chờ > timeout không, có STALE-LOCK
   nào cướp nhầm không); quyết giá trị `VITE_LOCK_AGING_S` (mặc định
   1800 s — chưa đo thực tế). Fairness đầy đủ chỉ đạt khi TẤT CẢ luồng
   cùng dùng v2. Giữ bản frozen v1 tới khi migration xong (không xóa).
   Dọn file cooldown quá 1 ngày trong QUEUEDIR (nợ nhỏ Q4 §6).
5. **Ngưỡng WebKit ≤60 ms — GIỮ theo N4 nhưng MỎNG, vẫn cần 1 lượt yên
   xác nhận (lần thứ 3 liên tiếp chưa chốt được: N4 tải trôi, P4 P3
   chen, Q5 replay apt).** Lượt xác nhận tiếp theo cần: (a) chạy SAU
   KHI Q7 báo postboot PASS (replay xong) — không đo ngay sau boot
   trong lúc replay còn cài package; (b) chạy khi các luồng khác đã
   xong/đang pha nhẹ; (c) bắt đầu với RAM avail ≥ ~1 GB; (d) cùng cây
   03bf029f (hoặc ghi rõ nếu cây đổi); (e) lấy mẫu load1 GIỮA lượt
   (Q5 chỉ có số đầu/cuối). Bổ sung vào prereg: kiểm tra trạng thái
   replay postboot TRƯỚC khi mở gate lớp A (gate hiện tại không phát
   hiện được replay đang chạy).
6. **Ghost stale sau seek seq 282–285 (Q5, mới):** 7 occurrence lag
   +68f, 1 event duy nhất, label 0 / pixels 68 trong 327 ms — lần đầu
   xuất hiện trong (b) trên toàn chuỗi. Cần luồng riêng chẩn đoán cơ
   chế ở đợt sau (có liên quan fix E4 steady-close không? có phải seek
   chưa vẽ lại ghost không?); nếu tái hiện trên lượt yên sạch thì ưu
   tiên cao; nếu không tái hiện thì coi là sự kiện đơn lẻ trong lượt
   nhiễm tải. Event P4 frame-26 KHÔNG tái hiện ở lần 3 này — theo dõi
   tiếp, không gộp 2 event làm một.
7. **Mù #33 đã mở (từ probe #33, 14:49:23Z) và đã chứa reboot #46
   (15:44:49Z).** Probe #34 ở đợt 115 đối chiếu từ mốc 14:49:23Z,
   trên boot 7a0638c4 (#46, số thứ tự tạm thời). Gap #45→#46 =
   2h27'07" là CẬN TRÊN cho tới khi mù #33 đóng. **Mù #31 KHÔNG ĐÓNG
   HOÀN TOÀN — KHÔNG ĐỔI, ĐÃ THỬ HẾT NGUỒN CÒN LẠI** (1 cửa sổ mở
   8'55"; 2 reboot đã chốt + tối đa 1 ẩn) — parent/user quyết xem có
   chấp nhận "ít nhất 2 reboot, có thể 3" làm mức đóng hay để mở như
   mù #24/#26/#28/#29/#30. **Gap #44→#45 = 2h24'11" ĐƯỢC CHỨNG NHẬN
   (mới, Q6 — chờ parent xác nhận cách chứng nhận xuyên mù, như
   #42→#43 đã được chấp nhận ở đợt 113).** CERT n=24, FULL n=39.
   Mù #22 (mức tin cậy hạ) + #24/#26/#28/#29/#30 chờ user quyết
   (không đổi). Reboot #16 vẫn mở (kẹp ~4'). Đề xuất cron riêng 10
   phút vẫn chờ user quyết.
8. **Postboot + apt replay: #46 PASS nhờ replay (kẹp (1'23", 7'08"] —
   M8 §9.4 ĐÃ ĐÓNG cho boot này); #45 vẫn mở (replay không chạy trong
   103 phút đầu).** Đợt sau sau reboot: chạy watcher early-run ngay
   để đo sớm (cần parent duyệt cách vận hành: cron đầu lượt hoặc luồng
   infra đầu tiên sau reboot). `apt-get update` trong `--repair` mất
   ~12 phút lần đầu (mirror chậm) — lần sau lists đã có thì chỉ ~99 s;
   cân nhắc timeout riêng cho bước update. Symlink GST → debroot vẫn
   là vá tạm ephemeral (sau reboot sau, `--repair` mới sẽ xử lý).
9. **Headroom inotify tiếp tục rơi:** #42: 1534 → #43: 1511 → #44: 1507 →
   #45 lúc đo: 1401 → 1307 → 1302 → 1298 → **#46 mới boot: 1300 →
   cuối lượt: 1207**. Vite thường (~1586 watch) KHÔNG chạy được trên
   boot này; vite tạm `watch.ignored` vẫn bắt buộc. Đo lại headroom
   sau reboot tiếp theo trước khi chạy vite thường.
10. **Seek/preload UX (Q8):** Bar B-Q8-1 cần 1 lượt tải sạch (Tc ≤2 s,
    flatness ≤0,1 s, im lặng ≥18 s, PLAYING đạt full) — lượt này bị
    sóng tải Q3 phá; chạy lại PAUSED+PLAYING khi load1 < 3 ổn định,
    tránh khung Q3 chạy hog. Cơ chế byte của trần 17,421 s còn mở
    (ring-full 4.194.304 B + overhead? cần hook đo frontier kéo của
    qtdemux — ATAKE totals đã thử, không kết luận được). Blob
    error-event trigger chưa xác định (4/10 run, code null). **Khuyến
    nghị thiết kế (Q8): đừng thêm bước chờ full-buffer trước seek**
    (F2 seek-không-chờ đã chứng minh chờ 20 s mua được 0 s; trong
    production hiện KHÔNG có bước chờ này — giữ nguyên).
11. **G1 deinterlace + các nợ đứng khác:** G1 chờ user quyết; E6 ĐÃ ĐÓNG;
    F6' ĐÃ ĐÓNG (ngưỡng ≤60 ms mỏng, xem mục 5); birefnet 0 lần thành
    công (chỉ thử lại khi RAM ≥ 6 GB); TTS 39 CẤM kiểm lại; ci-security.yml
    vẫn 403 chờ user (repo không có CI chạy thật); release gate giữ
    nguyên (không release/tag cho tới khi ngang/hơn CapCut thật).
12. **Nợ nhỏ từ verify Q9:** (a) Q1 Poisson 0,0340 là xấp xỉ exp(−λ),
    nhị thức chính xác 0,0328 (số đếm đúng, chỉ ghi chú để khỏi nhầm);
    (b) Q3 claim cửa sổ 10 s ≥1,33 s là sai theo phương pháp P8 + freeze
    ~12 s ở ph 44,77 chưa được ghi trong LIMITS Q3 (xem §3);
    (c) Q2 viết "mù #32 mở" là sai — mù #32 đã đóng bởi Q6 (xem §2);
    (d) Q5 bảng gStd §4 Q9 không tính lại từ pixel thô (metric chẩn
    đoán, không vào bar); (e) Q2 R2 "7/15 longtask khớp pump" Q9 không
    tính lại từ log thô (classify JSON không mang bảng khớp); (f) Q8
    JSON `seekMs` ≠ cột Seek trong LIMITS (seekMs đo từ gốc khác —
    LIMITS dùng issue→seeked, Q9 kiểm qua analysis txt evs +
    seekImmMs); (g) file render-ticks.jsonl của Q2 chỉ chứa phần
    drained — đừng đếm một mình file này (phải gộp tail trong
    results.json); (h) Q5 ghi đè `run-webkit-q1.log` + ps-before/after
    ở lần 3 — lần sau tách tên file theo lần đo; (i) `cap-pattern`
    của Q1: file probe-results.json mỗi thư mục chỉ giữ attempt cuối
    (attempt lỗi harness không có JSON) — đợt sau ghi rõ trong LIMITS.

## 11. Hồ sơ kiểm chứng Q9 (đợt 114)

| Mục | Kết quả | Nguồn |
|---|---|---|
| Poll Q1–Q8 | Bắt đầu 14:44:45Z; poller lần 1 bị reboot #46 giết 15:44:49Z (poll #12, 2/8: Q4+Q6); poller lần 2 đủ 8/8 lúc 16:46:22Z (poll2 #13) | `round114-q9/poll-q9.log` |
| Recount độc lập | `recount-q9-all.py` → `recount-q9-all.txt` (exit 0); Fisher riêng bằng `math.comb`; analyze-q1-file.py chạy lại 4 file; recount-q6.py chạy lại IDENTICAL; test-vite-lock-v2.sh chạy lại PASS=9 FAIL=0 | `round114-q9/recount-q9-all.py`, `recount-q6-rerun.txt` |
| Suite cây gộp | 27/27 exit 0 (tsc 0/0, vite build PASS 6,51 s, hold 93, pacing 19, ghostBlend 15/15, E4 5/5, css60/61 60/60, P7 8/8, orphans 17/17, r6 PASS, U4 141/141, preview-engine 354) | `round114-q9/round114-q9-suites.log` |
| O8 Chromium (Q9) | 21/21, exit 0, 17:07:06Z, boot #46 | `round114-q9/q9-o8.log`, `o8-chromium/o8-clicktest-report.json` |
| O8 WebKit (Q9) | 21/21, exit 0, 17:07:58Z, boot #46 | `round114-q9/q9-o8.log`, `o8-webkit/o8w-clicktest-report.json` |
| Reboot #46 | 15:44:49Z, boot_id `7a0638c4-950a-45a0-a068-c290310fc0de`, gap #45→#46 = 2h27'07" (cận trên) | `uptime -s` trực tiếp (Q9 + Q1/Q2/Q3/Q5 đối chiếu khớp) |
| Batch verify | `phase9-round114-q9-verify.txt` (1 entry: LIMITS gộp này) | `~/workspace/repo-1-push/paths-loop/` |
| Cờ done | `hidden_files/round114-q9-done` (tạo sau khi LIMITS + batch xong) | — |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round114-q9-verify.txt`
— chứa LIMITS gộp này (1 file text).

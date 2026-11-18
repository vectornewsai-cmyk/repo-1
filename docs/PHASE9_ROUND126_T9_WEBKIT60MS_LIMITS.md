# PHASE9_ROUND126_T9_WEBKIT60MS_LIMITS — WebKit lượt yên theo dõi lần 6: ĐÓNG — 1 LƯỢT YÊN HỢP LỆ, median 44,0 ms — ngưỡng GIỮ

> Luồng T9, đợt 126, lượt cron 06:35 +07 17/11/2026 (bắt đầu ~23:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> Không đo lại RAM baseline idle (nợ đợt 120 §9.4 ĐÃ ĐÓNG đợt 125).
>
> **Kết quả chính — NỢ LƯỢT YÊN THEO DÕI LẦN 6 ĐÃ ĐÓNG.**
> 1. **Attempt2: LƯỢT YÊN HỢP LỆ (20/20 pass, lớp B 5/5 ĐẠT).**
>    tickCost total median **44,0 ms** (p90 71,6; n=615) — lần yên
>    hợp lệ thứ 5 sau khi chốt (S5 49,5 / T4-118 40,0 / T3-121 52,0
>    / T9-125 47,5 / **T9-126 44,0**).
> 2. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi)** theo quy tắc quyết
>    định prereg §1 (median 44,0 ≤ 60). Không siết tiếp chỉ từ 1
>    lượt — siết cần thêm lượt yên độc lập.
> 3. Attempt1 gate A KHÔNG MỞ sau 10 poll (T8 giữ lock vite
>    harness + load5 2,19–3,83) — không chạy probe, không mất số đo.
> 4. **Cờ mở leg tải T4 đã touch 00:09:01Z** ngay khi attempt2 xong
>    (trước LIMITS/batch); T4 spawn 2 hog, warm-up #1 00:11:13Z —
>    phối hợp đúng hẹn, cửa yên sạch.
> 5. **(c2) lệch nhãn +1f TÁI HIỆN lần thứ 3 liên tiếp** (8 occurrence
>    skp=0, cùng cặp presented/label như đợt 125) — ghi nhận chuyển
>    T5 chẩn đoán. **Event lag ≥+5f MỚI: 1 event duy nhất** (seq
>    276–279, frame 27, lag tới +10f) — KHÔNG khớp event cũ
>    P4/Q5/T4-118.
> 6. Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…`
>    khớp). Sampler đã sửa đợt 125 dùng nguyên — verify không mẫu
>    hậu đo. tsc apps/web exit 0. T9 không sửa production.
> 7. **Nợ gate0-wait 60 phút (LIMITS T9-125 §9.3): ĐÃ SỬA** trong
>    bản copy đợt 126 (30 poll × 2 phút); thực tế gate 0 đạt ở
>    poll #2 nên chưa cần tới giới hạn mới.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round126-t9/prereg-t9.md` — viết TRƯỚC
  mọi phép đo (23:42Z), đăng ký: chờ cờ postboot T5 đợt 126 (thư
  mục `round126-t5`, KHÔNG chờ cờ đợt cũ), gate 0 + lớp A + lớp B
  gồm B5, ngưỡng ≤60 ms, quy tắc quyết định, touch cờ
  `round126-t9-done` ngay khi attempt xong để T4 bắt đầu leg tải,
  KHÔNG đo lại RAM idle, KHÔNG đo TTS 39, KHÔNG thử birefnet.
  Không có phụ lục bổ sung.
- **Boot trong đợt: MỘT boot — #71.**
  Boot #71 (`uptime -s` 2026-11-16 23:25:41Z, boot_id
  `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`, số #71 theo task + tên
  file `t5-postboot-b71-*` của T5 — xác nhận chéo). Gap #70→#71 =
  2h31'22" (#70 btime 20:54:19Z → #71 23:25:41Z). Reboot xảy ra
  giữa đợt 125 đóng (21:48Z) và lượt này; T9 bắt đầu trên boot
  mới (~23:40Z, boot ~15' tuổi). Không có reboot trong lúc đo.
- **Replay boot #71: CHẠY TỐT, NHANH** (theo cờ T5 + kiểm riêng):
  dpkg 1509 dòng từ poll gate0-wait #1; T5 POSTBOOT_PASS cho boot
  #71 (`boot_id=ff7afbbb… btime=2026-11-16T23:25:41Z
  pass_at=23:43:58Z poll=try1`, mtime 23:44:56Z) — PASS ngay lần
  thử đầu. Luật repair dạng (C) KHÔNG cần kích hoạt.
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 23:41Z = mọi poll gate0/gate A = kiểm
  cuối 00:10Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t9-tickcost.py`
  + `analyze-t9-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 và trên JSON T4 attempt8 đợt 118 tái tạo
  đúng median 40,0 / p90 64,7 (khớp 100% với dry-run đợt 120/121/
  122/123/124/125). Analyzer copy từ đợt 125 hoạt động đúng.
- **RAM host dao động mạnh (xem §7.1):** 729–2473 MB trong đợt;
  lúc mở đợt 1481 MB, lúc gate A mở 1619 MB, giữa lượt đo rơi
  xuống 729 MB rồi hồi. Vite vẫn chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) theo protocol.
- **Vite lock v2-ONLY**, cổng T9 **5187**. Lock do T9 giữ CHỈ trong
  lúc chạy probe attempt2 (00:02:14–00:05:37Z, giữ 202 s); các
  thời điểm khác lock thuộc T1/T2/T8 hoặc trống.
- **Các luồng đợt 126 khác:** T8 chạy vite harness (84l10/85m4/
  86n2) giữ lock phần lớn cửa sổ attempt1; T2 chạy E4 lượt 9 —
  chiếm lock 00:01:06Z, nhả trước gate A poll 2 của attempt2
  (không nhiễm cửa sổ tick, xem §4.4); T1 giữ lock lúc attempt1
  poll 1. T4 đợt này ĐÃ CHỜ cờ T9 đúng hẹn (spawn hog sau cờ,
  xem §7.3). T7 đã DONE lúc T9 dừng (`round126-t7.done` xuất hiện
  trong lúc đo).

## 1. Gate 0 — ĐẠT ở poll #2 (23:45:11Z)

- **Boot #71 (23:43:10–23:45:11Z, poll #1–#2):** poll #1
  t5flag=chưa-có (T5 chưa viết cờ — mới bắt đầu) + postboot-check
  riêng exit 0 + apt_procs=0 (pgrep -x) + dpkg_lines=1509 +
  load1 3,94 + RAMavail 1557 MB + preview_md5=03bf029f.
  **Poll #2 (23:45:11Z):** t5flag=PASS (T5 POSTBOOT_PASS cho #71,
  boot_id `ff7afbbb…` KHỚP, btime 23:25:41Z KHỚP, mtime
  23:44:56Z ≥ boot — luật STALE thỏa) + postboot-check check-only
  riêng PASS (exit 0) + apt_procs=0 (`pgrep -x apt-get`=0,
  `pgrep -x dpkg`=0) + dpkg_lines=1509 + load1=3,56 + RAMavail=
  1524 MB + preview_md5=03bf029f. **GATE 0 ĐẠT từ poll #2.**
  Không cần poll thêm.
- run-t9.sh gate 0 try 1 PASS ngay ở attempt1 và attempt2
  (postboot 0, aptx 0, dpkgx 0).

## 2. Gate A — attempt1 KHÔNG MỞ (10 poll); attempt2 MỞ poll 2 (00:02:14Z)

- **Attempt1 (23:46:06–23:55:08Z, poll 1–10, KHÔNG MỞ):**
  poll 1 load1=4,30 load5=2,95 lock=T1 (pid 7767, port 5590)
  blockers=6 RAM=981 MB (chặn: load + lock + RAM); poll 2
  load1=2,28 load5=2,57 lock TRỐNG blockers=0 RAM=2473 MB
  (chặn: load5); poll 3 load1=2,79 load5=2,68 lock=T8 (pid
  15145, port 5390) blockers=7 RAM=1953 MB; poll 4 load1=1,44
  load5=2,29 lock=T8 blockers=8 RAM=1438 MB; poll 5 load1=1,47
  load5=2,19 lock=T8 (port 5490, ticket mới) blockers=8
  RAM=1531 MB; poll 6 load1=4,76 load5=3,03 lock=T8 blockers=8
  RAM=1478 MB; poll 7 load1=4,29 load5=3,25 lock TRỐNG
  blockers=2 RAM=1821 MB (chặn: load); poll 8 load1=3,99
  load5=3,37 lock=T8 blockers=8 RAM=1586 MB; poll 9 load1=5,33
  load5=3,83 lock=T8 blockers=8 RAM=1435 MB; poll 10 load1=3,10
  load5=3,50 lock=T8 blockers=8 RAM=1600 MB. **HẾT 10 PHÚT GATE
  A KHÔNG MỞ — KHÔNG chạy probe (exit 5).** Nguyên nhân chính:
  T8 vite harness giữ lock gần như liên tục + load5 không xuống
  dưới 2 trong cả 10 phút (2,19–3,83).
- **Attempt2 (00:01:14–00:02:14Z):** poll 1 load1=1,10
  load5=1,60 lock=T2 (pid 7938, port 5590, chiếm 00:01:06Z —
  8 giây trước khi attempt2 bắt đầu) blockers=6 RAM=872 MB
  (chặn: lock + blockers + RAM); **poll 2 (00:02:14Z)
  load1=0,88 load5=1,47 lock TRỐNG blockers=0 RAM=1619 MB
  tree=YES → CỬA YÊN MỞ**. Probe-start 00:02:14Z, boot #71
  23:25:41, RAM 1619 MB, preview.tsx 03bf029f.
- T2 nhả lock trong vòng ~1 phút (E4 lượt 9 chỉ giữ lock ngắn
  cho 1 lượt đo con) — khác hẳn T8 giữ lock nhiều phút liền.

## 3. Attempt2 (00:02:14–00:05:37Z) — LƯỢT YÊN HỢP LỆ, median 44,0 ms

- **Probe chạy 00:02–00:05Z, 20/20 pass, exit 0.** Vite :5187 lên
  sau 3 s; WebKit 27.2 launch OK; app boot OK; rVFC TẮT; TAP +
  RELABEL BẬT; sanity canvas OK; FLIP sau pass 5
  (wallMs=25700); partial JSON ghi tăng dần đủ 20/20 (tickCost ok
  n=615); Y2 pump log: pumpEvents=0, blendTicks=504,
  tickCost=615; pageErrs=[].
- **Số đo attempt2 (lượt YÊN HỢP LỆ):** tickCost total n=615
  **median=44,0 ms p90=71,6 max=102 min=28**; hậu flip+2000ms
  n=450 median=44,0; tBlend gap n=503 median=85,0 p90=115,8
  max=1476 (S5: median 93,0; T9-125: median 87,0); BlendTick/pass=
  25,2 (S5: 23,3; T9-125: 24,9); rAF/pass median=36 min=28
  max=44 (S5: median 34). Renderer khỏe suốt lượt.
- Phân rã wallMs (đăng ký trước): 0–20k n=87 median=49,0;
  20–32k n=120 median=43,5; 32–45k n=123 median=44,0; 45–62k
  n=159 median=43,0; 62–70k n=73 median=49,0; 70–80k n=53
  median=47,0 — **đều 43–49 ms ở MỌI dải, không có dải suy giảm**.
- **Lớp B (check-classb-t9.sh, đánh giá 00:05:37Z): 5/5 ĐẠT.**
  B1 ĐẠT (load5 lúc kết thúc 1,26 ≤ 2,5); B2 ĐẠT (load1 max 2,25
  trong sampler ≤ 4; ps-before sạch hoàn toàn, ps-after chỉ có
  vite của T9 — xem §4.4); B3 ĐẠT (không reboot; boot trước/sau
  đều 23:25:41Z); B4 ĐẠT (không replay apt/dpkg; postboot sau
  lượt exit 0); B5 ĐẠT (RAM min 729 MB, 0 mẫu <500 MB; 7/10 mẫu
  RAM <1024 MB — cảnh báo, không vi phạm).
- Sampler (đã sửa đợt 125): n=10 mẫu, mẫu cuối 00:05:18Z;
  sampler-stop 00:05:32Z, node probe thoát 00:05:33Z —
  **không mẫu hậu đo** (fix §6 đợt 125 vẫn hiệu lực).
- **DỪNG sau attempt2 theo tiền lệ các lượt yên hợp lệ trước
  (S5/T4-118/T3-121/T9-125 đều dừng ở lượt yên đầu tiên đạt):**
  1 lượt yên hợp lệ đã đủ áp quy tắc quyết định prereg §1; không
  chạy attempt 3 (ngân sách cho phép tối đa 3 nhưng không bắt buộc).
  Attempt1 không tính là lượt đo (gate A không mở, 0 pass).

## 4. Phân tích lượt yên attempt2

### 4.1 Verdict ngưỡng — GIỮ ≤60 ms (lượt yên theo dõi lần 6 ĐÓNG)

- **1 lượt yên hợp lệ đợt 126 (attempt2, median 44,0 ms).**
  Theo prereg §1 (median ≤ 60 ms → GIỮ): **ngưỡng WebKit ≤60 ms
  GIỮ NGUYÊN.** Không siết tiếp chỉ từ 1 lượt.
- Năm lượt yên hợp lệ sau khi chốt: S5 49,5 ms (đợt 116, cây
  03bf029f) / T4-118 40,0 ms (đợt 118, cây 03bf029f) / T3-121
  52,0 ms (đợt 121, cây 5be5a250) / T9-125 47,5 ms (đợt 125,
  cây 03bf029f) / **T9-126 44,0 ms (đợt 126, cây 03bf029f)**.
  Trung bình 5 lượt = 46,6 ms; biên an toàn so với ngưỡng 60 ms
  là ~8–20 ms mỗi lượt. Median thấp nhất kể từ T4-118.
- **Nợ lượt yên theo dõi lần 6: ĐÓNG — không chuyển tiếp sang
  đợt 127.** Lượt yên theo dõi tiếp theo (lần 7) sẽ do parent
  xếp khi cần, không còn là nợ quá hạn.

### 4.2 (b) unique-match + F6' trên lượt yên (kiểm lại, không đóng/mở lại)

- **(b) labellag:** skp=1: nTick=72, lag median=0f p90=1f max=3f,
  ≥5f: 0; (c2) = 0. skp=0: nTick=298, lag median=1f p90=2f
  max=10f, ≥5f: 6; (c) = 10 occurrence, (c2) = 10 (xem §4.3).
- **F6' (skiplatest):** skp=1 hậu flip+2000ms nTick=72 (cần ≥30);
  (1) nhãn 100,0% (bar ≥90%); (2) pixel-verified 100,0% (bar
  ≥90%) → các bar đạt TRÊN DỮ LIỆU LƯỢT NÀY. **F6' vẫn ĐÃ ĐÓNG từ
  L7 — T9 không đóng lại, không mở lại; đây chỉ là kiểm lại,
  không thay đổi trạng thái.**

### 4.3 (c2) "dang ngo that" +1f TÁI HIỆN LẦN THỨ 3 LIÊN TIẾP (ghi nhận, chuyển T5 chẩn đoán)

- (c2) skp=0: **10 occurrence:** 8 occurrence lag +1f dạng
  (presented = label+1): (seq 150, presented 13, label 12),
  (175, 14, 13), (195, 15, 14), (223, 15, 14), (379, 13, 12),
  (406, 15, 14), (429, 15, 14), (485, 14, 13) — **cùng cặp
  presented/label như đợt 125** (13/12, 14/13, 15/14) và cùng
  dạng đợt 121 (presented 16, label 15). Dạng lệch nhãn +1f tái
  hiện ở cả 3 đợt liên tiếp (121: 3 occurrence; 125: 5; 126: 8)
  với cùng các cặp frame 12–15 — mẫu này giờ đã đủ dày để T5
  chẩn đoán có mục tiêu (không còn là nhiễu lẻ). T9 không kết
  luận nguyên nhân.
- 2 occurrence còn lại thuộc event lag5 §4.4: (seq 279,
  presented 27, label 22, lag +5f) và (279, 27, 25, lag +2f).
- skp=1: (c2) = 0 occurrence.

### 4.4 Stale-ghost — 1 EVENT MỚI duy nhất (seq 276–279, frame 27); B2 kiểm chứng T2 không nhiễm

- **Stale-ghost (lag5):** (b) lag≥+5f: **6 occurrence, gom trong
  1 event duy nhất:** seq 276–279, tBlend 46528–46765 (cửa sổ
  237 ms), M=[27] (frame pixel-thật duy nhất), presented 19→27,
  label 17→22, lag +5f…+10f (max +10f ở seq 276/277). Đây là
  event MỚI — **KHÔNG khớp** event cũ P4 seq 220–223 (frame 26),
  Q5 seq 282–285 (frame 68), T4 đợt 118 frame 23. Cả 6
  occurrence cùng M=27 trong 237 ms: strip thực tế khớp frame 27
  trong khi label chỉ 17–22 (label tụt tới 10f) — dạng "label tụt
  sau presented nhảy vọt" chứ không phải ghost frame cũ bám dai.
  Ghi nhận chuyển T5 chẩn đoán; không kết luận hồi quy từ 1 event.
  Gap presented-expected hậu flip: 370/370 |gap|≤3 (median 0).
- **B2 — T2 trong cửa sổ tick (00:02:14–00:05:37Z):** ps-before
  (00:02) SẠCH hoàn toàn — không có vite/probe/WebKit/WebProcess
  hay process nào của luồng khác; ps-after (00:05) chỉ có vite
  của T9 (:5187, pid 19545/19560/19561) + esbuild của nó. T2
  chiếm lock 00:01:06Z và nhả trước gate A poll 2 (00:02:14Z) —
  tức acquire/release đều NGOÀI cửa sổ tick. Load1 max trong cửa
  sổ chỉ 2,25 — khớp máy yên. **B2 ĐẠT chắc chắn.**

## 5. Đo RAM baseline idle — KHÔNG CHẠY (nợ đã đóng)

- Nợ đợt 120 §9.4 ĐÃ ĐÓNG ở đợt 125 (trang preview idle ~800 MB).
  Theo task đợt 126, T9 KHÔNG đo lại. Không có file ram-idle mới.

## 6. Cây đo — baseline, không đổi

- preview.tsx md5 `03bf029f` không đổi: lúc bắt đầu (23:41Z) =
  mọi poll gate0/gate A = kiểm cuối (00:10Z). `media.ts` md5
  `2c384ed1` không đổi.
- T9 không sửa production: không có thay đổi nào do T9; cây giữ
  baseline theo quyết parent đợt 122 (H3f đã gỡ, không apply lại).
- Probe KHÔNG đổi nên KHÔNG stage lại probe. Script
  `gate0-wait-t9-ff7afbbb.sh` đã sửa giới hạn poll 10 → 30
  (60 phút, nợ LIMITS T9-125 §9.3 — ĐÃ SỬA trong bản copy đợt
  126, ngoài repo, không stage). Sampler trong
  `t9-attempt-inner.sh` dùng nguyên bản đã sửa đợt 125.

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 RAM host dao động (không ghim phẳng)

- RAMavail trong đợt: 729–2473 MB. Lúc mở đợt 1481 MB → gate A
  attempt1 poll 1 rơi 981 MB → gate A attempt2 mở 1619 MB →
  giữa lượt đo rơi 1520→900→771→729→999→977→1056→1005→915→
  1026 MB (10 mẫu sampler) → sau lượt 1010–1073 MB. Dao động
  mạnh như đợt 124/125 — áp lực host-level (ngoài cell).
- RAM giữa lượt rơi xuống 729 MB nhưng vẫn ≥500 MB nên B5 ĐẠT;
  7/10 mẫu <1024 MB chỉ là cảnh báo. Ngưỡng RAM giữ nguyên
  (không hạ để "cho qua").

### 7.2 Hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (23:41Z) = mọi poll gate0-wait/gate A = kiểm cuối (00:10Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 00:11:19Z, ~39 s).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo nào cần hồi quy thêm.
- Postboot-check sau lượt: exit 0 (00:10Z) — replay vẫn PASS sau
  khi đo xong (B4 hậu kiểm).

### 7.3 Sự cố hạ tầng + vận hành trong lúc đo

1. **Attempt1 gate A không mở (23:46–23:55Z):** T8 vite harness
   giữ lock gần như liên tục (pid 15145, port 5390→5490, ticket
   đổi 2 lần — chạy nhiều harness nối tiếp) + load5 không xuống
   dưới 2 trong 10 phút. Không phải lỗi T9; attempt1 không chạy
   probe, không mất số đo. T9 chờ cửa yên rồi chạy attempt2.
2. **Phối hợp lịch T4 ĐÚNG HẸN đợt này:** T4 chờ cờ T9, không
   chạy hog trước 00:09:01Z; T9 touch cờ `round126-t9-done` ngay
   00:09:01Z khi attempt2 xong; T4 spawn 2 hog, warm-up #1
   00:11:13Z (leg dò ~45–55% theo quyết parent đợt 125). Cửa yên
   sạch — như đợt 125. Bài học giữ nguyên: xếp T4-load và T9-yên
   lệch nhau vẫn là cách duy nhất có lượt yên sạch.
3. **Quirk check-classb (ghi lại, không sửa giữa đợt):** dòng
   `--- KET LUAN LOP B:` trong file classb trống (không in verdict
   tổng) — cả đợt 125 cũng vậy. Verdict 5/5 suy từ B1–B5 đều ghi
   ĐẠT riêng lẻ. Đợt sau nên sửa script in verdict tổng rõ ràng.
4. **Quirk tên thread trong vite lock:** ticket/lock ghi
   `thread=t3` (do run-attempt wrapper đặt) trong khi luồng là T9
   — pid owner 19458 là con của run-t9.sh attempt2, lock giữ
   202 s rồi nhả 00:05:37Z. B3 vẫn thỏa (lock chỉ do T9 giữ).
   Ghi lại để đợt sau đối chiếu, không sửa âm thầm.
5. **Gate0-wait 60 phút đã sửa xong** (30 poll × 2 phút) nhưng
   đợt này chỉ cần 2 poll — giới hạn mới chưa được kiểm thực tế
   ở mức dài. Đợt sau nếu T5 chậm vẫn cần theo dõi waiter có chạy
   đủ 30 poll không.
6. **Nhãn file log hậu tố ff7afbbb đã dùng đúng boot mới** (theo
   tiền lệ đợt 123 §8.6, giữ qua đợt 124/125).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND126_T9_WEBKIT60MS_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại. Script `gate0-wait-t9-ff7afbbb.sh` đã sửa 30 poll +
  `t9-attempt-inner.sh` dùng nguyên bản sửa sampler đợt 125 (bản
  copy trong `hidden_files/round126-t9/`, ngoài repo — không stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round126-t9-webkit.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round126-t9/`
  (prereg-t9.md [viết trước khi đo],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t9-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 125],
  analyze-t9-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  analyze-t9-attempt2-{tickcost,wallbands,labellag,skiplatest,lag5}.txt
  [lượt yên hợp lệ: median 44,0/p90 71,6; (b) skp=0 ≥5f: 6;
  (c2) 10 occurrence (8× +1f + 2 thuộc event lag5); F6' bar đạt
  trên dữ liệu này; lag5 1 event mới seq 276–279 frame 27],
  b.json [copy đợt 125, md5 `078938cf…`],
  vite.t9-temp.config.mjs [copy đợt 125, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t9.sh [adapt đợt 126: round126-t9, hậu tố log ff7afbbb] +
  t9-attempt-inner.sh [adapt round126-* + sampler đã sửa đợt 125]
  + check-classb-t9.sh [lớp B gồm B5 — ĐÃ CHẠY, attempt2: 5/5 ĐẠT]
  + gate0-wait-t9-ff7afbbb.sh [đã sửa 30 poll — gate 0 ĐẠT poll #2]
  + gate0-wait-t9-ff7afbbb.log + gate0-wait-t9-ff7afbbb.nohup.log,
  poll-t9.sh + poll-t9.log [mẫu 5 phút + gate0/gateA: attempt1
  10 poll không mở, attempt2 mở poll 2] + poll-t9.nohup.log,
  postboot-t9-ff7afbbb-gate0wait-{1..2}.log [gate 0: poll #1 exit 0
  chưa cờ, poll #2 PASS] + postboot-t9-ff7afbbb-attempt1-gate0.log
  + postboot-t9-ff7afbbb-attempt2-gate0.log [gate 0 run-t9.sh:
  PASS] + postboot-t9-ff7afbbb-after.log [sau lượt: exit 0],
  run-t9-attempt1.nohup.log [attempt1: gate A KHÔNG MỞ 10 poll,
  exit 5] + run-t9-attempt2.nohup.log [attempt2: CỬA MỞ poll 2,
  probe 20/20, exit 0],
  run-webkit-t9-attempt2.log [probe 20/20, exit 0] +
  preview-b-f3-flip-webkit-t9-attempt2.json [3.059.644 B, lượt yên
  hợp lệ] + ps-before/after-t9-attempt2.txt +
  load-mid-t9-attempt2.log [10 mẫu, không mẫu hậu đo] +
  classb-t9-attempt2.txt [5/5 ĐẠT] +
  vite-5187-t9-attempt2.log + marker-t9-attempt2,
  chain-t9.log [gate0/gateA/probe/classB attempt1+2],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round126-t9.done` (kèm verdict 1 dòng).
  Cờ mở leg tải T4: `hidden_files/round126-t9-done` đã touch
  00:09:01Z ngay khi attempt2 xong (trước LIMITS/batch).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — lượt yên theo dõi lần 6 ĐÃ ĐÓNG
   (attempt2 median 44,0 ms, lớp B 5/5).** 5 lượt yên hợp lệ:
   S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5 / T9-126
   44,0 (trung bình 46,6 ms). Không chuyển tiếp nợ lượt yên sang
   đợt 127; lượt yên lần 7 do parent xếp khi cần. Không siết ngưỡng
   chỉ từ 1 lượt.
2. **(c2) lệch nhãn +1f tái hiện lần thứ 3 liên tiếp** (đợt 121: 3;
   đợt 125: 5; đợt 126: 8 occurrence skp=0, cùng cặp
   presented/label 13/12, 14/13, 15/14) — ghi nhận chuyển T5 chẩn
   đoán có mục tiêu; không kết luận hồi quy. Stale-ghost cũ: 0
   tái hiện.
3. **Event lag ≥+5f MỚI (seq 276–279, frame 27, lag tới +10f,
   237 ms)** — 1 event duy nhất, không khớp P4/Q5/T4-118; chuyển
   T5 chẩn đoán cùng (c2).
4. **Sửa check-classb in verdict tổng rõ ràng** (hiện dòng KẾT
   LUẬN trống — cả đợt 125/126 đều vậy) + đối chiếu tên thread
   trong vite lock (`thread=t3` thay vì t9).
5. **RAM host dao động 729–2473 MB (không ghim phẳng):** áp lực
   ngoài cell. Giữ nguyên ngưỡng RAM (không hạ để "cho qua").
6. **Nợ khác đứng yên theo LIMITS gộp đợt 125 §10–§11 + quyết
   parent §12:** E4 lượt 9+10 (T2 đợt 126 — lượt 9 đã chạy, lượt
   10 chờ); DEF v0.3 + leg dò ~45–55% (T4 đợt 126, đang chạy sau
   cờ T9); mù #44 D kiểm sâu một lần + mù #45 probe (T7 đợt 126);
   luật repair dạng (B) siết ngưỡng 10 phút; luật prune cooldown;
   G1 khung (a) M2 HOÃN chờ user; R9 (a) VẪN CHỜ user; birefnet 0
   lần (RAM khả dụng vẫn dưới guard 6 GB); TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi.
   Reboot mới nhất: boot #71 23:25:41Z (gap #70→#71 = 2h31'22").
   T7 đã DONE lúc T9 dừng; T4 đang chạy leg tải sau cờ T9.

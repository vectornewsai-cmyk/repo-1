# PHASE9 ROUND152 T2 — EPERM probe #71 + mù #74? MỞ theo luật gap (J-full 1 hố 1.589 s, max 1 ẩn — bằng chứng hỗ trợ mạnh nhưng không phải closer) + reboot #43 PHÁT HIỆN MỚI (fad2aab9 → 18e179e0, btime 05:20:57Z) + nghịch lý đồng hồ ≥ +18 s tại #42 ĐÃ ĐỐI CHIẾU (18 s = dòng log 03:25:34.073Z, nhất quán với 15 s của T9) + gap #42/#43 chứng nhận DẠNG KHOẢNG ỨNG VIÊN [7.163, 7.167] / [6.939, 6.943] s + INSIDE chuỗi 3 → 4 — LIMITS

## 0. Headline

- **Probe EPERM #71: ok=2 fail=0, boot 18e179e0, 05:41:18Z.** Probe trước (#70) đã chết/stale 10.866 s (3h01'06", n=70, ts 02:40:07Z, boot 2e430750). Log `eperm-probe-v2.log` 202 → **205 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **⚠️ PHÁT HIỆN MỚI — REBOOT #43 (không có trong brief):** boot hiện tại là **18e179e0** (btime 05:20:57Z), KHÔNG phải fad2aab9 như brief giả định. Reboot #43 (fad2aab9 → 18e179e0) xảy ra giữa lúc T10-151 đóng sổ (~05:05Z) và lượt cron 152 (05:35:51Z). Cửa sổ probe #70 → #71 nay chứa **HAI reboot (#42 + #43)**. T2-152 chứng nhận mù #74? theo brief; mù #75? (#43) CHỨNG NHẬN BỔ SUNG theo F-152-T1-1 (§2.13 — số hiệu #75? đã xác nhận, verdict MỞ theo luật gap, chờ parent quyết §4.5 (b)).
- **Mù #74? MỞ theo luật gap — J-full KHÔNG ĐÓNG (max gap 1.589 s > sàn 1.147 s, max 1 ẩn):** đoạn I đóng (max 475 s), đoạn K đóng (max 880 s), nhưng đoạn J-full có **1 hố 1.589 s (04:00:55Z → 04:27:24Z)** đứng nguyên sau recheck toàn cây 843.905 file + /var/log (chỉ trúng bẫy float cùng giây cạnh trái — lần thứ bảy liên tiếp). **Bằng chứng hỗ trợ mạnh (KHÔNG phải closer theo luật đứng):** 26 dòng sampler T9-151 mỗi 60 s trong hố (04:01:18–04:26:19Z, đều boot=fad2aab9) + 3 session sống xuyên hố + HB scheduler dispatch 04:15:34Z (slot 04:20:50Z, T7-151) — hố có lời giải thích vận hành đầy đủ (T8 chờ giữa 2 pha, T7 sleep, sampler ghi nối vào 1 file). **Chuỗi mù đóng hoàn toàn GIỮ 9** (không tăng); **CERT/FULL chính thức GIỮ 73/88** (gap #42/#43 chỉ là ỨNG VIÊN cho tới khi parent quyết — xem §4.5 (a)/(b)).
- **Nghịch lý đồng hồ tại #42 — ĐÃ ĐỐI CHIẾU, 18 s ĐƯỢC XÁC NHẬN LÀ CẬN MẠNH NHẤT:** dòng log cuối của boot cũ đóng dấu **03:25:34.073Z** (`round151-t8/smoke/partial-boot-2e430750/run-webkit-85m4.log`, HB128 sampleFor P5) − btime 03:25:16Z = **18,073 s** → e_cũ(lúc chết) ≥ **+18 s**. Nhất quán với dấu hiệu T9 (mẫu sampler cuối 03:25:31Z → ≥ +15 s) và T7 (sleep bị giết ~03:25:26Z → ≥ +10 s) — cả ba đều là cận dưới, không mâu thuẫn. Ghi nhận, KHÔNG mở điều tra mới (quyết (d)/(k) đợt 151).
- **Gap #42 / #43 — KHOẢNG ỨNG VIÊN (chưa chứng nhận):** #42 **[7.163, 7.167] s, giữa 7.165 s**; #43 **[6.939, 6.943] s, giữa 6.941 s**. Cả hai số danh nghĩa NẰM TRONG khoảng. Lưu ý: **không có đo F trực tiếp nào trên boot fad2aab9** (đã kiểm T1/T5/T8-151: không có) — khoảng dựa trên giả định đồng hồ fad2aab9 chính xác lúc đầu boot (mẫu đứng F111?/F112?/F113? + tính nhất quán nội bộ); độ nhạy đã tính (xem §2.2).
- **Khung chết:** **#117? (2e430750): 6 s danh nghĩa** (03:25:10Z, 03:25:16Z]; bản giờ thực ước lượng [6, 24] s (mốc cuối là file đồng hồ VM — chờ parent chốt). **#118? (fad2aab9): 934 s danh nghĩa** ≈ giờ thực (05:05:23Z, 05:20:57Z] — dài vì máy yên sau khi T10 đóng sổ đợt 151.
- **Chuỗi INSIDE — 3 → 4 THEO CHUẨN ĐỨNG:** btime fad2aab9 03:25:16Z **INSIDE** dải FULL88 neo 2e430750 [01:52:05Z, 03:50:31Z] (cách cạnh trên 25'15"); kiểm chéo FULL87 cũng INSIDE. **18e179e0 INSIDE dải FULL89 [03:51:31Z, 05:49:46Z] — ỨNG VIÊN** (FULL89 chưa chứng nhận) → chuỗi 4 → 5 chờ gap #42.
- **F114? ≈ 0/+1 s, ĐỦ 3 SERVER** (example +1, google +1, cloudflare +1 — cloudflare 200). Đồng hồ C7 (boot 18e179e0) chính xác; btime 05:20:57Z là giờ thực.
- **KHÔNG có reboot mới trong phiên** (boot 18e179e0 lúc mở 05:37Z, lúc probe 05:41Z, lúc kiểm đóng 06:00:33Z) → không mở mù #76?.
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~210 h trước probe #71). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh cửa sổ mù ĐÚNG: 3.964.468 kB = 63,01% guard (T9-152 sampler, 05:40:17Z, đoạn K)** — 0/202 mẫu ≥ guard. Đỉnh đoạn I+J (mù #74?) là 51,56% guard (03:03:31Z, T9-151 — trùng đỉnh đợt 151). RAM min 250.840 kB (245 MB) lúc 03:56:18Z (kỷ lục thấp đợt 151, trong cửa sổ). Birefnet **0 thử lần thứ sáu liên tiếp** (147/148/149/150/151/152). Balloon: đoạn J max 6.443.824 kB (100% trần, **31 mẫu ghim** — khớp đúng số T9-151 31/134); đoạn I/K 0 mẫu ghim.
- **WFS #58: chênh 0 — lần thứ 58 liên tiếp.** NEWSTD 979 dòng / 283 file; R7b 1.004 / 300; copies 25 / 17. Delta +1 dòng / +1 file giải thích đầy đủ bằng diff (không đoán trước).
- **Quyết parent đợt 151 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** ((b) CERT73/FULL88 + chuỗi đóng hoàn toàn 9; (c) khung #116? chốt 42 s; (d) nghịch lý ≥ +20 s tại #41 ghi vào hồ sơ chính thức; (e) chuỗi ghim trần đợt mới trên fad2aab9, không nối đợt 150; (h) RAM đỉnh đợt 151 chốt 51,56% + bài học F-151-T9-7 đọc đúng cửa sổ; (k) mù #74? giao T2-152 + nghịch lý 18 s ghi nhận; (t) kết cục run 151 thuộc T7-152; (u) mỗi luồng phải viết cờ .done) — chỉ câu hỏi MỚI phát sinh ở đợt 152 ghi ở §4.5.

## 1. Checklist probe EPERM #71 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 20/11) | Kết quả |
|---|---|---|
| Đọc boot lúc mở phiên | 05:37:28Z | 18e179e0-365e-4298-92b8-b61b147f9600, btime /proc/stat 1795152057 = 05:20:57Z — **KHÁC brief (brief giả định fad2aab9) → reboot #43 đã xảy ra** (chỉ đọc boot_id + btime, chưa probe — prereg viết sau đó) |
| Chốt chặn round-in-progress.md | 05:37:28Z | **KHÔNG tồn tại** (ls lỗi No such file — đúng như prereg) |
| `status` | 05:41:14Z | **DEAD/STALE**, heartbeat n=70, ts 2026-11-20T02:40:07Z, boot 2e430750, tuổi **10.866 s (3h01'06")**, exit 1 (đo trực tiếp, không tee) |
| `once` | 05:41:18Z | **Probe #71, boot=18e179e0, ok=2 fail=0**, exit 0; dòng log `boot changed 2e430750 -> 18e179e0 (uptime since 2026-11-20 05:20:57)` — đúng chuẩn /proc/stat mới (script chỉ thấy boot của heartbeat trước nên bỏ qua fad2aab9 ở giữa — đúng thiết kế) |
| `status` lại | 05:41:18Z | **ALIVE**, tuổi 6 s, n=71, exit 0 |
| Log probe | 05:41:18Z | `eperm-probe-v2.log` 202 → **205 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=71, ts 2026-11-20T05:41:18Z, boot 18e179e0; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại sau once, ts=05:41:18Z, boot=18e179e0, n=71 — khớp |
| Xác minh boot | 05:41:36Z | Cùng boot_id/btime; `/proc/1` 05:21:12,73Z; `/proc/1/stat` starttime 1.490 ticks = **14,90 s sau kernel boot** → PID 1 start wall = 05:20:57Z + 14,90 s = 05:21:11,90Z ≈ /proc/1 mtime 05:21:12,73Z (lệch 0,83 s — trong sai số làm tròn ~1 s, cùng họ 0,51 s đợt 151 / 0,91 s đợt 150); `uptime -s` = 05:20:57Z (= /proc/stat); uptime 20 phút lúc 05:41:36Z → 05:41:36 − 20:39 = 05:20:57Z ✓; journal đúng 1 boot, entry đầu 05:21:13Z = /proc/1 +1,1 s; MemAvailable 3.474.340 kB |
| Xác minh boot lúc đóng | 06:00:33Z | **KHÔNG đổi boot — 18e179e0**, btime 05:20:57Z; không có reboot mới trong phiên → không mở mù #76? |
| Đối chiếu probe #71 với T1-152 (F-152-T1-1, bổ sung) | 06:15Z | **KHỚP:** T1-152 đếm log 205 dòng; 3 dòng mới 203–205 là probe #71 (DEAD #70 05:41:14Z + boot-changed 2e430750 → 18e179e0 + `probe#71 boot=18e179e0 ok=2 fail=0` 05:41:18Z) — khớp đúng hồ sơ T2-152 §1 (heartbeat n=71, ts 05:41:18Z, boot 18e179e0, ok=2 fail=0); suite T1-152 chạy 05:39:17–05:50:36Z trên boot 18e179e0, 28/28 exit 0, boot ổn định, không reboot trong phiên T1 |
| dpkg.log boot 18e179e0 | 05:41:36Z | **Chỉ 2 dòng, dòng đầu 05:35:44Z `startup packages configure` = boot +887 s**; `/var/log/apt/history.log` KHÔNG TỒN TẠI → replay **CHƯA TỚI** trên boot mới (T5-152 theo dõi tiếp; quyết (q) đợt 151 giao T5-152 đối chiếu `replay-watch-151.log`) |
| F114? | 05:42:07Z | example.com Date 05:42:07 (+1 s), google.com 05:42:07 (+1 s), cloudflare.com 05:42:08 (+1 s, sai số làm tròn header Date 1 s) → **F114? ≈ 0 s đến +1 s, ĐỦ 3 SERVER** (cloudflare 200) |

## 2. Điều tra mù #74? + mù #75?

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Cửa sổ mù (probe-to-probe): 02:40:07Z → 05:41:18Z = 10.871 s (3h01'11")** — từ probe #70 tới probe #71. Cửa sổ điều tra = cửa sổ mù (đoạn I bắt đầu tại probe #70, không cần mở rộng về btime #41 như đợt 151).
- Hai reboot trong cửa sổ (#42 là mốc giữa, #43 là mốc giữa thứ hai — cả hai đều nằm trong cửa sổ, không có reboot nào ở biên):

| Đoạn | Boot | Btime (/proc/stat) | Btime (/proc/1) | Dài (danh nghĩa) | Chết lúc |
|---|---|---|---|---|---|
| I | 2e430750 (#117?) | 01:25:51Z 20/11 (1795137951) | 01:26:02Z | 2.709 s (từ probe #70) | 03:25:16Z |
| J-full | fad2aab9 (#118?) | 03:25:16Z 20/11 (1795145116) | 03:25:27Z | 6.941 s (toàn bộ đời boot) | 05:20:57Z |
| K | 18e179e0 (#119?) | 05:20:57Z 20/11 (1795152057) | 05:21:12Z | 1.221 s (tới probe #71) | (còn sống — probe #71) |

- Gap danh nghĩa (btime − btime, tính bằng epoch, chuẩn /proc/stat): #42 = **7.165 s** (tuổi thọ 2e430750 — T9/T8-151 đã đồng thuận); #43 = **6.941 s** (tuổi thọ fad2aab9). **Cả hai số danh nghĩa đều NẰM TRONG khoảng thật (ứng viên)** (xem §2.2/§2.5).
- Độ trễ init (starttime ticks): 2e430750 11,06 s (đợt 151); fad2aab9 ~11 s (journal first entry 03:25:27Z = btime +11 s, T9-151); 18e179e0 14,90 s — cả ba đều hòa giải được bằng số (PID 1 start wall ≈ /proc/1 mtime, lệch ≤ 0,83 s).
- Nguồn quan sát mốc cuối mù: T10-151 đóng sổ ~05:05Z (boot fad2aab9); parent viết §12.3 ~05:1xZ; file mở đợt 152 05:35–05:41Z; probe #71 05:41:18Z.

### 2.2 Đánh số + đồng hồ — chuẩn parent mới + nghịch lý ≥ +18 s tại #42 ĐÃ ĐỐI CHIẾU

- **Quyết parent đợt 151 (§12.3) ĐÃ ÁP DỤNG:** (b) **mù #72?/#73? ĐÓNG HOÀN TOÀN → CERT 73 / FULL 88, chuỗi đóng hoàn toàn 9**; (c) **khung #116? chốt 42 s danh nghĩa**; (d) **nghịch lý ≥ +20 s tại #41 ghi vào hồ sơ chính thức**; (e) **chuỗi ghim trần đợt mới trên fad2aab9, không nối đợt 150**; (h) **RAM đỉnh đợt 151 chốt 51,56% + bài học đọc đúng cửa sổ (F-151-T9-7)**; (k) **mù #74? giao T2-152 + nghịch lý 18 s ghi nhận, không điều tra mới**; (t) **kết cục run 151 thuộc T7-152**; (u) **mỗi luồng phải viết cờ .done**.
- **F113? (C6, 2e430750 lúc ghi btime) ≈ 0/+1 s, ĐỦ 3 SERVER** (02:40:21–24Z, T2-151 §1) → e_cũ(lúc ghi btime 2e430750) ∈ [−1, +1] s. **F114? (C7, 18e179e0) ≈ 0/+1 s, ĐỦ 3 SERVER** (05:42:07Z, §1) → e_mới(lúc ghi btime 18e179e0) ∈ [−1, +1] s. Cloudflare trả 200 cả hai lần.
- **⚠️ KHÔNG CÓ ĐO F TRỰC TIẾP NÀO TRÊN BOOT fad2aab9:** đã kiểm LIMITS T1/T5/T8-151 (grep `example.com|cloudflare.com` — chỉ T2-151 nhắc tới khi bàn F111?/F112?/F113?; T1/T5/T8 không đo đồng hồ trên fad2aab9). Vì vậy e(fad2aab9 lúc ghi btime ~03:25:57–03:27:07Z) KHÔNG được pin bằng đo trực tiếp — khoảng gap #42/#43 dựa trên giả định: **đồng hồ fad2aab9 chính xác lúc đầu boot (±1 s)**. Cơ sở giả định: (a) mẫu đứng — mọi boot đã đo đều chính xác lúc đầu (F111?/F112?/F113? đều ≈ 0/+1 s); (b) tính nhất quán nội bộ — journal first entry btime +11 s, wtmp bắt đầu 03:25:27Z = btime +11 s (T7-151), dpkg btime +32 s, requeue run 151 btime +33,236 s (cùng họ 33–45 s của #39/#41); (c) nghịch lý chỉ ràng buộc đồng hồ boot CŨ lúc chết, không viết lại btime đã ghi (lý luận T2-151 §2.2 — xem dưới). **Độ nhạy:** nếu e(fad2aab9) lệch tới ±20 s (thang nghịch lý) thì khoảng gap #42 thành [7.143, 7.187] s, gap #43 thành [6.919, 6.963] s — **giữa (mid) KHÔNG ĐỔI** (7.165 s / 6.941 s); mean CERT/FULL dịch < 0,3 s. Ghi rõ để parent biết giới hạn, không giấu.
- **Journal boot mới liên tục, 0 dòng chỉnh giờ:** journalctl đúng 1 boot (18e179e0); entry đầu 05:21:13Z; 108 entry lúc kiểm; 0 dòng timesyncd/chrony/step/synchronized/clock trong toàn bộ journal boot mới. (dmesg KHÔNG thử đọc — T2-148 đã xác nhận `Operation not permitted`.)
- **NGHỊCH LÝ ĐỒNG HỒ TẠI #42 — 18 s ĐƯỢC XÁC NHẬN LÀ CẬN MẠNH NHẤT (đối chiếu xong, chỉ ghi nhận — quyết (d)/(k)):**
  - Dòng log cuối của boot cũ đóng dấu **03:25:34.073Z** (file `round151-t8/smoke/partial-boot-2e430750/run-webkit-85m4.log`, dòng `[HB128] sampleFor P5-phaseB-long elapsed=85s n=3/200 lastCt=2.135 lastPlayhead=0`) — process harness lần 1 trên boot cũ, bị reboot #42 giết giữa lúc kẹt (T8-151 §15/F-151-T8-5). 03:25:34.073 − 03:25:16 = **18,073 s** → e_cũ(lúc chết) ≥ **+18 s**. Đây chính là nguồn gốc số "18 s" trong aggregate 151 ("lớn nhất chuỗi 8/14/7/18 s"). **Đối chiếu độc lập: T8-151 F-151-T8-5 đã ghi cùng phép tính** ("dòng log cuối của 85m4 lần 1 đóng dấu 03:25:34Z, muộn hơn btime boot mới đúng 18 s; /proc/1 của boot mới bắt đầu 03:25:27Z, muộn hơn btime 11 s") — T2-152 tìm lại từ file log gốc, khớp đúng số (03:25:34.073Z).
  - Dấu hiệu T9 (mẫu sampler cuối 03:25:31Z, `round151-t9/ram-sampler.log`) → e_cũ ≥ **+15 s** (03:25:31 − 03:25:16). Dấu hiệu T7 (sleep bị SIGTERM ~03:25:26Z, sau ~897 s) → e_cũ ≥ **+10 s**. Cả ba đều là **cận dưới** của cùng một đại lượng — không mâu thuẫn: 18 s là cận mạnh nhất, 15 s và 10 s là cận yếu hơn nhất quán với nó.
  - Hệ quả: đồng hồ 2e430750 chạy đúng lúc ghi btime (F113? ≈ 0 lúc 02:40Z) rồi nhanh dần/lệch **≥ +18 s lúc chết** (~03:25Z) — cùng họ với #41 (≥ +20 s). Đây là **lần thứ hai liên tiếp** đồng hồ boot cũ nhanh ≥ +15 s lúc chết (chuỗi nghịch lý 8/14/7/18 s nay có thêm dữ kiện: cận #42 chốt ở 18 s).
  - **Tại sao nghịch lý KHÔNG làm rộng khoảng gap #42 (lý luận đầy đủ, để parent/T10 kiểm):** công thức gap dùng btime đã GHI: gap_thật = danh nghĩa + (e_cũ(lúc btime cũ được ghi) − e_mới(lúc btime mới được ghi)). btime_cũ của #42 (01:25:51Z) được T2-151 đọc/ghi lúc 02:39–02:40Z, khi e_cũ ≈ 0 (F113? đo 02:40:21Z) — drift ≥ +18 s xảy ra SAU đó, trong đời boot còn lại, không viết lại giá trị btime đã ghi. Tương tự btime_mới của #42 (03:25:16Z) được T7/T9/T8 ghi lúc ~03:25:57–03:27:07Z, khi đồng hồ fad2aab9 (theo giả định trên) ≈ 0 — drift của fad2aab9 (nếu có) xảy ra sau đó. Vì vậy khoảng gap #42 từ F vẫn là [7.163, 7.167] s (với giả định e(fad2aab9) ∈ [−1, +1] — xem trên). **Giả định duy nhất:** đồng hồ không lệch giữa lúc kernel ghi btime và lúc F đo — cùng giả định các đợt trước dùng cho #39/#40/#41, được củng cố bởi journal boot fad2aab9 liên tục không có dòng chỉnh giờ (T9-151 §5.1 ghi 0 dòng timesyncd — nay T2-152 xác nhận lại cho boot 18e179e0). Nếu giả định này sai thì khoảng gap rộng hơn — ghi rõ để parent biết, không giấu.
  - **Đối chiếu với T7 (theo brief (c)):** T7-151 §2.3 ghi sleep bị giết ~03:25:26Z (~10 s sau btime) + requeue 03:25:49.236Z = btime +33,236 s (recovery mới, không phải dấu boot cũ). Cận T7 (≥ +10 s) yếu hơn cận T8 (≥ +18 s) và cận T9 (≥ +15 s) nhưng nhất quán. **Không có mâu thuẫn nào giữa T7/T8/T9** — ba cận dưới khác nhau của cùng một drift. T2-152 KHÔNG mở điều tra mới về cơ chế drift (quyết (d)/(k)).
- **Tranh chấp clock 27 s đợt 149 (e2 ∈ [313, 340] s, quyết parent 149 (b)) KHÔNG liên quan đợt này:** nó chỉ liên quan e2 (đồng hồ thời ae8f70bb, đã chết ở #38). Gap #42/#43 chỉ dùng e(2e430750)/e(fad2aab9)/e(18e179e0) (đều ≈ 0 lúc đầu boot theo đo/giả định). Ghi rõ để tránh nhầm lẫn khi đọc lại.
- **Mâu thuẫn full boot_id b47f7932 — VẪN ĐỂ MỞ (không có dữ kiện mới, quyết (g) đợt 143):** T2-152 không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận.
- **Replay boot fad2aab9 KHÔNG TỚI là ĐẶC THÙ BOOT ĐÓ (đứng nguyên):** dpkg.log fad2aab9 chỉ 2 dòng (03:25:48–49Z), cache 0 .deb, 5/5 lib thiếu (T8-151 F-151-T8-7); boot 18e179e0 cũng chỉ 2 dòng dpkg (05:35:44–45Z) tới lúc kiểm 05:41Z. Quyết parent 149 (l): CHỈ GHI NHẬN (T5-152 theo dõi tiếp).

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác giây:**
- repo-1: **17 file** (16 mốc giây); hidden_files: **375 file** (195 mốc giây). Tổng hai cây **211 mốc giây khác nhau** (17 + 375 file).
- Đoạn I: **162 mốc merged** (xem §2.4); đoạn J-full: **82 mốc merged** (sau CLOCK RULE, xem §2.4); đoạn K: **50 mốc merged** (xem §2.4). Ngoài cây + /tmp bổ sung phần còn lại (xem dưới).

**Sessions (`~/workspace/agents/`, 300 exec-log, 300 file có birth/mtime dùng được — GIẢM 11 so với 311 đợt 151; 55 file cũ biến mất, 0 file biến mất có mtime trong cửa sổ mù — xem dưới):**
- Bắc cầu: I-lo **3**, I-hi **3**, J-lo **3**, J-hi **0**, K-lo **1**, K-hi **0** (K-lo/K-hi cắt nhau vì K = 1.221 s < 2×1.147 s — K-lo/K-hi = 1/0 là dữ kiện thật, không phải hình học sai).
- Chạm đoạn: I **18**, I-tail **6**, J **8**, J-tail **0**, K **14**, K-tail **14**, J-head-hole **0**, K-head-hole **0**.
- Nhân chứng nhảy (jump witness): **0 tại cả hai btime** (#42 và #43 — cùng mẫu đợt 148/149/150/151; sessions không bắc qua reboot).
- Nhắc boot trong exec-log trong cửa sổ: 2e430750 **8**, fad2aab9 **5**, 18e179e0 **0** (exec-log của chính phiên T2-152 có mtime sau probe #71 nên ngoài cửa sổ đếm — đúng phương pháp).
- **55 file exec-log cũ biến mất** (311 → 300; runtime dọn các agent dir cũ): đã đối chiếu với `sessions-all.txt` đợt 151 — **0 file biến mất có mtime trong cửa sổ mù, 0 file biến mất bắc qua hố J** (kiểm bằng script, xem file làm việc). Việc dọn này không ảnh hưởng bất kỳ verdict nào.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **165 file** trong cửa sổ (98 mốc giây). /tmp: **622 file** (7 mốc giây — nhiều file cùng giây: burst ghi của harness/luồng đợt 151). Goals ngoài hidden_files: **0 file** trong cửa sổ. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **3 file** (2 file memory bank 03:56:36Z đoạn J — reflections.md + world.md; 1 file memory/2026-11-20.md 05:04:27Z đoạn J) — **không file nào nằm trong hố J** (xem §2.4).
- Đuôi/head (mỗi đoạn lấy 1 sàn 1.147 s ở đầu/cuối) — ngoài cây / /tmp / repo-1 / hidden_files: I-head **56 / 0 / 8 / 118** (182 file); I-tail **11 / 0 / 3 / 56** (70 file); J-head **1 / 0 / 0 / 35** (36 file — gồm file restart T9 03:26:17Z); J-tail **7 / 0 / 2 / 1** (10 file); K-head **0 / 0 / 0 / 0** (0 file — đầu K trống mốc merged, chỉ có /var/log wtmp 05:21:13Z ngoài phạm vi); K-tail **33 / 622 / 1 / 65** (721 file — trong đó 593 file /tmp dồn vào đúng 1 giây 05:39:55Z, node-compile-cache từ luồng đợt 152, chỉ đóng góp 1 mốc giây nên không thu hẹp gap nào — cùng mẫu đợt 151).

**Ranh giới:**
- 18e179e0: mốc đầu đoạn K theo timestamp là 05:35:37Z (live-config — THUỘC BOOT MỚI, file runtime/host); mốc /var/log btmp/lastlog/wtmp 05:21:13Z = btime +16 s (ngoài 4 phạm vi merged, chỉ quét ở hole-recheck — xem §2.6). Mốc cuối đoạn J 05:05:23Z cách btime 934 s — chính là khung #118?.
- fad2aab9 (đầu J-full): **0 file trong (btime, +10 s] thuộc boot mới một cách chắc chắn theo merged** — mốc đầu đoạn J theo timestamp là 03:25:21Z (replay-watch log — THUỘC BOOT CŨ theo nội dung, xem §2.4); mốc boot-mới chắc chắn đầu tiên là T9 restart 03:26:17Z (+61 s). Mốc /var/log wtmp bắt đầu 03:25:27Z = btime +11 s (T7-151 ghi — file wtmp nay đã bị #43 ghi đè nên không đọc lại được từ mtime).
- 2e430750 (đầu I): mốc đầu đoạn I 02:40:08Z = probe #70 +1 s (file exec-log T2-151 — head 1 s).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**296 mốc giây khác nhau** (repo-1 16, hidden_files 195, ngoài cây 98, /tmp 7). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| I | 162 | **475 s** (03:02:25→03:10:20) | 113 s / 92 s | 02:40:08 (+1 s) | 03:25:10 (−6 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| J-full | 82 | **1.589 s** (04:00:55→04:27:24) | 934 s / 756 s | 03:26:17 (+61 s) | 05:05:23 (−934 s) | **KHÔNG ĐÓNG — max 1 ẩn** (luật gap) |
| K | 50 | **880 s** (05:20:57→05:35:37) | 58 s / 20 s | 05:35:37 (+880 s) | 05:41:14 (−4 s) | **ĐÓNG — max 0 ẩn** (luật gap) |

**Đoạn I — ĐÓNG (max 0 ẩn, luật gap).** Gap lớn nhất merged 475 s < sàn 1.147 s; floor(475/1147)=0. 162 mốc: đầu 02:40:08Z (exec-log T2-151 — head 1 s), cuối 03:25:10Z (file chẩn đoán watchdog T8 — tail 6 s). I-lo/I-hi 3/3 session bắc cầu; jump witness 0 tại btime #42.

**Đoạn J-full — KHÔNG ĐÓNG (max 1 ẩn, luật gap).** Gap lớn nhất merged 1.589 s > sàn 1.147 s; floor(1589/1147)=1. 82 mốc (sau CLOCK RULE): đầu 03:26:17Z (T9 restart — head 61 s), cuối 05:05:23Z (session files T10-151 — tail 934 s). J-lo 3 session bắc cầu; J-hi 0 session bắc cầu (dữ kiện thật — không có session nào sống đủ dài để bắc cắt J-hi; không ảnh hưởng verdict vì luật gap chỉ cần merged marks).
- **Hiệu chỉnh mốc đầu J (đã kiểm bằng nội dung, không đoán):** mốc 03:25:21Z là file `round151-t5/replay-watch-151.log` — watcher T5 chết theo reboot #42, dòng cuối 03:25:21Z, thuộc thư mục boot cũ → **thuộc boot cũ, KHÔNG phải mốc boot mới**. Mốc 03:25:37Z (`round151-t8/smoke/run-webkit-nohup.out` — driver harness lần 1 bị #42 giết giữa kẹt) cũng thuộc boot cũ (xem §2.2 — process VM chết theo reboot, stamp chạy trước giờ thực ≥ +18 s). **Loại cả hai khỏi mốc đầu J:** mốc boot-mới chắc chắn đầu tiên là T9 restart 03:26:17Z → head gap thật 61 s (thay cho 5 s theo timestamp). Max gap J vẫn 1.589 s (gap đầu không phải gap lớn nhất) → **verdict KHÔNG ĐÓNG không đổi**.
- **Hố 1.589 s (04:00:55Z → 04:27:24Z) — phân tích:** mốc trái là file tổng kết WebKit lần 2 của T8 (04:00:55Z, `=== ALL DONE`); mốc phải là exec-log T7-151 (04:27:24Z, agent 032affe4). Trong hố: **0 mốc merged, 0 mốc sau recheck toàn cây + /var/log** (xem §2.6 — chỉ trúng bẫy float cùng giây cạnh trái). Hố có lời giải thích vận hành đầy đủ: T8 chờ giữa 2 pha (WebKit xong 04:00:55Z, Chromium bắt đầu 04:40:31Z); T7 sleep giữa 2 lần kiểm (03:56Z → 04:27Z); T9 sampler ghi nối vào 1 file duy nhất (mtime chỉ còn lần ghi cuối 04:52:19Z). **Bằng chứng hỗ trợ trong hố (không phải closer — xem §2.4 cuối):** 26 dòng sampler T9-151 mỗi 60 s (04:01:18–04:26:19Z, đều `boot=fad2aab9`); 3 session sống xuyên hố (proc_170a98b21935 03:57:34→04:27:24; proc_4cecddc85234 03:26:22→04:52:22; proc_bbcd256f2437 03:39:59→04:40:00); HB scheduler dispatch 04:15:34Z (slot 04:20:50Z, run a79e6d98, bảng T7-151 dòng 73). Cả ba nguồn độc lập đều nói máy sống xuyên hố — nhưng theo luật đứng (sessions là hỗ trợ, không phải closer — quyết parent 143), chúng không đóng đoạn theo luật gap. **Câu hỏi parent (a): có đóng #74? trên bằng chứng hỗ trợ hay giữ mở?**

**Đoạn K — ĐÓNG (max 0 ẩn, luật gap).** Gap lớn nhất merged 880 s < sàn 1.147 s; floor(880/1147)=0. 50 mốc: đầu 05:35:37Z (live-config — head 880 s: 14'40" đầu đoạn K không có mốc merged nào vì sau reboot #43 máy yên tới khi lượt cron 152 bắt đầu 05:35:51Z), cuối 05:41:14Z (status probe — tail 4 s). K-lo 1 session bắc cầu (phiên T2-152, birth 05:39:17Z); K-hi 0 (cắt nhau — xem §2.3). Mốc /var/log btmp/lastlog/wtmp 05:21:13Z = btime +16 s (ngoài phạm vi merged) thu hẹp head gap xuống 16 s nếu tính — verdict không đổi.

**Khung chết (danh nghĩa theo timestamp + bản theo giờ thực):**
- **#117? (boot 2e430750): (03:25:10Z, 03:25:16Z] = 6 s** (danh nghĩa). Mốc cuối đoạn I merged: file chẩn đoán watchdog T8 03:25:10Z (file VM — đồng hồ cũ). Bản giờ thực: mốc cuối bị drift ≥ +18 s làm mờ — giờ thực của mốc 03:25:10Z ∈ [03:24:52Z, 03:25:10Z] (giả định drift đơn điệu, không vượt drift lúc chết) → khung giờ thực ước lượng **[6, 24] s**. **Câu hỏi parent (c): chốt 6 s danh nghĩa hay [6, 24] s giờ thực?** (Khác #116?: ở đó mốc cuối là file runtime theo đồng hồ host nên chốt được 42 s; ở đây mốc cuối là file VM nên không pin chặt được.)
- **#118? (boot fad2aab9): (05:05:23Z, 05:20:57Z] = 934 s** (danh nghĩa). Mốc cuối đoạn J merged: session files của agent T10-151 05:05:23Z (file runtime theo đồng hồ host) + btime boot mới chính xác (F114? ≈ 0) → **≈ 934 s ± 2 s giờ thực**. Dài vì máy yên sau khi T10 đóng sổ đợt 151 (~05:05Z) tới #43. Recheck 0 mốc mới trong khung (§2.6). Khung này không ảnh hưởng verdict #75? (J-full đã mở vì hố 1.589 s, không phải vì đuôi).

### 2.5 Phân phối gap — CERT/FULL ỨNG VIÊN (CHƯA CHỨNG NHẬN — chờ quyết parent §4.5 (a)/(b))

- **Gap #42 ỨNG VIÊN DẠNG KHOẢNG: [7.163, 7.167] s, giữa 7.165 s** — đoạn I đóng theo luật gap (max 475 s); đoạn J-full KHÔNG đóng (hố 1.589 s) nên mù #74? chưa đóng → gap #42 **CHƯA CHỨNG NHẬN**; e_cũ lúc ghi btime 2e430750 ∈ [−1, +1] s (F113?); e_mới lúc ghi btime fad2aab9 ∈ [−1, +1] s (GIẢ ĐỊNH — không có đo F trực tiếp trên fad2aab9, xem §2.2); khung chết #117? 6 s danh nghĩa pin cái chết. **Số danh nghĩa 7.165 s NẰM TRONG khoảng ứng viên.**
- **Gap #43 ỨNG VIÊN DẠNG KHOẢNG: [6.939, 6.943] s, giữa 6.941 s** — đoạn J-full KHÔNG đóng + đoạn K đóng → mù #75? chưa đóng → gap #43 **CHƯA CHỨNG NHẬN**; e(fad2aab9) ∈ [−1, +1] s (giả định như trên); e(18e179e0) ∈ [−1, +1] s (F114?); khung chết #118? 934 s danh nghĩa pin cái chết. **Số danh nghĩa 6.941 s NẰM TRONG khoảng ứng viên.**
- **CERT74 (ỨNG VIÊN — gap #42 [7.163, 7.167] s, mid 7.165 s):** n=74, mean **1h37'25"**, median **1h53'59"**, p10 **0h25'13"**, p90 **2h18'28"**, sd **0h51'36"**, min **0h00'55"**, max **5h14'27"**; trong 90–150' = **40**, <60' = **17**, >180' = **4**, >240' = **1**. **FULL89 (ỨNG VIÊN):** n=89, mean **1h42'19"**, median **1h54'16"**, p10 **0h26'16"**, p90 **2h24'30"**, sd **0h58'32"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **47**, <60' = **20**, >180' = **7**, >240' = **3**.
- **CERT75 (ỨNG VIÊN — gap #43 [6.939, 6.943] s, mid 6.941 s):** n=75, mean **1h37'39"**, median **1h54'16"**, p10 **0h25'23"**, p90 **2h18'09"**, sd **0h51'18"**, min **0h00'55"**, max **5h14'27"**; trong 90–150' = **41**, <60' = **17**, >180' = **4**, >240' = **1**. **FULL90 (ỨNG VIÊN):** n=90, mean **1h42'28"**, median **1h54'38"**, p10 **0h26'17"**, p90 **2h24'21"**, sd **0h58'13"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **48**, <60' = **20**, >180' = **7**, >240' = **3**.
- **SỐ CHÍNH THỨC VẪN LÀ CERT 73 / FULL 88** (parent xác nhận quyết 151 (b)). CERT74/FULL89/CERT75/FULL90 trên đây là số ứng viên — chỉ thành chính thức khi parent quyết đóng #74?/#75? (câu hỏi §4.5 (a)/(b)). T10-152 KHÔNG dùng số ứng viên làm số đóng sổ.
- **SPAN (không chứng nhận):** không đổi so với đợt 151 (691a7403→cc222c8a = 7.050 s; cc222c8a→e146ca67 = 7.381 s; b47f7932→9afdaa89 = 42 s; 9afdaa89→70a5b0fc = 7.265 s; bde599df→9afdaa89 = [3.965, 3.985] s, giữa 3.975 s — quyết 145 (f): để SPAN, không mở đường mới).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Gap #42/#43 chỉ ở dạng khoảng ứng viên (tiền lệ #58/#63/#39/#40/#41); không đề xuất đường chứng nhận mới. Thống kê dùng mid của khoảng (tiền lệ #58) — mid = đúng số danh nghĩa cả hai gap; ảnh hưởng lên mean ~0 s.
- Dải chứng nhận chính thức: [0h00'55", 5h14'27"] (CERT73) — không đổi vì gap #42/#43 chưa chứng nhận.
- **Chuỗi INSIDE (theo chuẩn đứng — quyết parent 150 (d)):**
  - fad2aab9 làm #118? (đếm chặt, chuẩn), dải FULL88 neo #117? 01:25:51Z: **[01:52:05Z, 03:50:31Z]** — btime 03:25:16Z **INSIDE** (kiểm độc lập bằng code; cách cạnh trên 1.515 s) → **chuỗi INSIDE 3 → 4 ĐÃ CHỨNG NHẬN** (chờ parent xác nhận). Kiểm chéo bằng dải FULL87 neo 01:25:51Z [01:52:03Z, 03:50:40Z] cũng **INSIDE**. Cả hai dải đều cho INSIDE với biên thoải mái (≥ 1.515 s khỏi cạnh).
  - 18e179e0 làm #119? (đếm chặt, chuẩn), dải FULL89 neo #118? 03:25:16Z: **[03:51:31Z, 05:49:46Z]** — btime 05:20:57Z **INSIDE** (kiểm độc lập bằng code) → **chuỗi INSIDE 4 → 5 ỨNG VIÊN** (FULL89 chưa chứng nhận — chờ gap #42). Kiểm chéo bằng dải FULL88 neo 03:25:16Z [03:51:30Z, 05:49:56Z] cũng **INSIDE** (FULL88 đã chứng nhận, nhưng dải này dùng FULL88 neo btime fad2aab9 — vẫn là kiểm chéo hợp lệ).
  - Boot tiếp theo sau 18e179e0 (#120? chặt), dải FULL90 neo 05:20:57Z (ứng viên): **[05:47:14Z, 07:45:17Z]**.
- **Tốc độ reboot:** **118 reboot / 223,12 h = 1 lần / 113,5 phút** (tới #42; từ boot #1 2026-11-10T20:18:10Z tới fad2aab9). Tới #43: **119 reboot / 225,05 h = 1 lần / 113,5 phút** (tốc độ không đổi). Chuỗi lũy kế tới **127 / 225,05 h = 1 lần / 106,3 phút** (+0 mù #74?/#75? đóng — chưa cộng vì chờ parent quyết; tổng dung lượng 55B max 3 → 127; 56A max 3 → 129 — giữ nguyên như đợt 149/150/151 vì không có mù mới nào đóng thêm theo hướng dung lượng).
- **Tuổi thọ boot (danh nghĩa stat→stat):** 2e430750 7.165 s; fad2aab9 6.941 s. **Tuổi thọ THẬT (ứng viên):** 2e430750 = gap #42 ∈ [7.163, 7.167] s; fad2aab9 = gap #43 ∈ [6.939, 6.943] s (danh nghĩa ≈ thật, sai số ≤ 2 s cả hai — với giả định §2.2).

### 2.6 Recheck các hố — điều kiện duy nhất còn lại cho khung chết

- Quét mtime toàn cây `/home/hatch` (843.899 file, bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) + `/var/log` (6 file) cho mốc trong 7 hố: **843.905 file đã quét.**
- **H-J1 (1.589 s, hố lớn nhất J — QUAN TRỌNG NHẤT): 4 hit — tất cả đều là cùng giây với cạnh trái 04:00:55.xxx, KHÔNG phải mốc mới** (cùng bẫy F-146-T2-3/F-147-T2-3/F-148-T2-3/F-149-T2-4/F-150-T2-4/F-151-T2-4, **lần thứ bảy liên tiếp**): run-webkit-86n2.log 04:00:55.305 + run-webkit-summary.txt (attempt1) 04:00:55.321 + run-webkit-summary.txt 04:00:55.324 + run-webkit-nohup-boot2.out 04:00:55.330 (chính mốc cạnh trái).
- **H-J2 (756 s): 1 hit — cùng giây cạnh trái 04:27:24.682** (exec-log proc_170a98b21935 — chính mốc cạnh trái).
- **H-JT / khung #118? (934 s): 3 hit — cùng giây cạnh trái 05:05:23.2xx** (3 file session agent ade9c2e5 — chính mốc cạnh trái).
- **H-I1 (475 s): 6 hit — cùng giây cạnh trái 03:02:25.0xx** (6 file round151-t4 — chính mốc cạnh trái).
- **H-KH (880 s, đầu K): 3 hit — MỐC MỚI THẬT: /var/log/btmp + /var/log/lastlog + /var/log/wtmp 05:21:13.7xxZ = btime +16 s** (cùng mẫu T2-150 §2.6: btmp/lastlog/wtmp 23:32:25Z = btime #40 +16 s). Mốc /var/log này thu hẹp head gap K xuống 16 s (không đổi verdict — K đã đóng).
- **H-DF117 / khung #117? (6 s): 5 hit — cùng giây cạnh trái 03:25:10.0xx** (5 file chẩn đoán watchdog T8 — chính mốc cạnh trái).
- **H-JH / đầu J (61 s): 2 hit — chính 2 mốc boot cũ đã loại** (replay-watch-151.log 03:25:21.881Z + run-webkit-nohup.out 03:25:37.878Z — xem §2.4). **Không có mốc boot mới nào trước 03:26:17Z trong toàn cây + /var/log** (wtmp 03:25:27Z của #42 chỉ còn trong ghi chép T7-151 — file wtmp nay đã bị #43 ghi đè).
- **Kết luận: đoạn I và K ĐÓNG; đoạn J-full KHÔNG ĐÓNG (hố 1.589 s đứng nguyên sau recheck); khung chết #117? 6 s danh nghĩa / #118? 934 s danh nghĩa đứng nguyên sau recheck.** Không còn đường thu hẹp hố nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log). Đường duy nhất còn lại là thay đổi phương pháp (tính dòng log sampler / event scheduler làm mốc) — câu hỏi parent §4.5 (e).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức; tự động hóa đã nối từ T9-147, 0 mẫu ≥ guard đợt này nên không kích hoạt — lần thứ sáu liên tiếp 0 lần).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).
- Khung chết #110? 223 s (quyết parent 148 (g)) — đã chốt, không kiểm lại.
- Khung chết #111? [88, 156] s / #112? 55 s / #113? (113, 347] s (quyết parent 149 (j)) — đã chốt, không kiểm lại.
- Khung chết #114? 12 s danh nghĩa / [10, 14] s giờ thực (quyết parent 150 (c)) — đã chốt, không kiểm lại.
- Khung chết #115? 1.220 s danh nghĩa / [1.218, 1.221] s giờ thực + khung #116? 42 s danh nghĩa (quyết parent 151 (c)) — đã chốt, không kiểm lại.
- F110? 2/3 server — ghi là CHƯA ĐỦ 3 SERVER, không đo lại (quyết parent 149 (k)).
- Kết cục run 151 — THUỘC T7-152, T2-152 không phán thay (quyết parent 151 (t)).
- Nghịch lý đồng hồ ≥ +18 s tại #42 — chỉ ghi nhận (quyết parent 151 (d)/(k)); không mở điều tra mới.
- Chuỗi ghim trần balloon đợt mới trên fad2aab9 (quyết 151 (e)) — T2-152 chỉ báo số liệu (§3); verdict nối/đứt thuộc T9-152/T10.

### 2.8 Quét WFS #58 (05:58:05–05:58:38Z 20/11 — chạy trên boot 18e179e0, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 979 dòng / 283 file** (phạm vi 3.291 file). **R7b: 1.004 / 300** (phạm vi 12.684 file). **Copies: 25 / 17** (không đổi). Đối chiếu 979+25=1.004=R7b, **chênh 0 — lần thứ 58 liên tiếp**.
- Delta so với #57 (978/280): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND151_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-151 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.8 (cùng mẫu #53/#54/#55/#56/#57: LIMITS T2 nhắc chuỗi trong văn bản). Phạm vi quét tăng +15 file (3.276→3.291) là LIMITS đợt 151 + file đợt 152, không chứa writeFileSync ngoài file trên.
- md5 cây tái kiểm: `docs/PHASE9_ROUND151_T2_EPERM_LIMITS.md` **db541eff36395f5da94f6a670af5b065** — khớp cờ round151-t2.done (file không đổi sau khi stage).

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** mới: diff WFS #57→#58 chỉ có đúng 1 file đổi số đếm (LIMITS T2-151 nhắc chuỗi trong văn bản) — không có helper mới nào xuất hiện; cùng mẫu F-149-T2-7/F-150-T2-2/F-151-T2-2 (hai helper dùng `await f.writeFile(file, data);`).
- Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — không kiểm lại đợt này (T2-148 đã xác nhận md5 giống hệt bản src — artifact build, không phải helper mới).

### 2.10 Quét EPERM trong cửa sổ mù

- **80 file *.log** có mtime trong cửa sổ mù. Đếm: "sóng EPERM vẫn bật" **3**, "CẢNH BÁO" **2**, "Operation not permitted" **3**, "sóng EPERM đã tắt" **2** — **tất cả 10 hit đều nằm trong CÙNG MỘT file `round151-t2/eperm-sweep-run.log`** (log quét của T2-151 tự trích tên marker trong output của chính nó + output đợt 150 — false positive tự tham chiếu, xem F-149-T2-3; mẫu lặp lại đợt này; đã đối chiếu độc lập theo từng file: chỉ 1 file chứa hit). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~210 h** trước probe #71). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-152 — KHÔNG: không có reboot mới trong phiên

- Boot lúc mở phiên (05:37:28Z), lúc probe (05:41:18Z) và lúc kiểm đóng (06:00:33Z) đều là **18e179e0, btime 05:20:57Z**. Không mở mù #76?.
- Reboot #43 xảy ra TRƯỚC phiên (05:20:57Z, ~15' trước lượt cron 12:35 +07) — xem §2.12.
- **dmesg KHÔNG thử đọc đợt này** (T2-148 đã xác nhận `Operation not permitted` — không lặp lại thao tác đã biết chặn). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

### 2.12 Mù #74? + mù #75? — CHƯA CHỨNG NHẬN (mở — chờ quyết parent)

- **Mù #74? (reboot #42, 2e430750 → fad2aab9): MỞ theo luật gap.** Đoạn I đóng (max gap 475 s); đoạn J-full KHÔNG đóng (hố 1.589 s, max 1 ẩn — xem §2.4/§2.6); khung #117? 6 s danh nghĩa ([6, 24] s giờ thực ước lượng); gap #42 ứng viên dạng khoảng **[7.163, 7.167] s, giữa 7.165 s** → CERT74/FULL89 ỨNG VIÊN (chưa phải số chính thức). Bằng chứng hỗ trợ mạnh trong hố (26 dòng sampler + 3 session xuyên hố + HB dispatch 04:15:34Z) đã ghi đầy đủ — parent quyết có đóng trên bằng chứng hỗ trợ hay không (câu hỏi §4.5 (a)).
- **Mù #75? (reboot #43, fad2aab9 → 18e179e0): MỞ theo luật gap (cùng hố J).** Đoạn J-full KHÔNG đóng (hố 1.589 s); đoạn K đóng (max gap 880 s); khung #118? 934 s danh nghĩa (≈ 934 ± 2 s giờ thực); gap #43 ứng viên dạng khoảng **[6.939, 6.943] s, giữa 6.941 s** → CERT75/FULL90 ỨNG VIÊN. Chứng nhận bổ sung đầy đủ ở §2.13 (theo F-152-T1-1 — cùng luật gap đứng, số hiệu #75? đã xác nhận, verdict MỞ).
- **Chuỗi mù đóng hoàn toàn GIỮ 9** (không tăng đợt này). **CERT/FULL chính thức GIỮ 73/88.**
- **INSIDE chuỗi 3 → 4 (fad2aab9 INSIDE FULL88) ĐÃ CHỨNG NHẬN** (chờ parent xác nhận cùng (a)); **chuỗi 4 → 5 (18e179e0 INSIDE FULL89) ỨNG VIÊN** (chờ gap #42).
- **Phạm vi:** chứng nhận đợt này dùng cửa sổ [probe #70 02:40:07Z → probe #71 05:41:18Z] (10.871 s) với các đoạn I + J-full + K; tiền đề H (đoạn trước I, đã đóng đợt 151) không đo lại — hồ sơ đã đóng.

### 2.13 Chứng nhận mù #75? (bổ sung — theo F-152-T1-1, cùng luật gap đứng)

- **Số hiệu ĐÃ XÁC NHẬN: mù #75? (reboot #43).** Đếm chặt (quyết 146 (a)): mù #N? ↔ reboot #N — #72? ↔ #40, #73? ↔ #41, #74? ↔ #42, **#75? ↔ #43**. Boot mới 18e179e0 = #119? (đếm chặt), tiền nhiệm fad2aab9 = #118?. T1-152 F-152-T1-1 ghi "mù #75? — T2-152 xác nhận số hiệu" — nay xác nhận.
- **Reboot #43 — cửa sổ xảy ra:** T10-151 đóng sổ trên boot fad2aab9, cờ `round151-t10.done` mtime 05:04:22Z (T1-152 F-152-T1-1); btime #43 05:20:57Z; lượt cron 152 mở 05:35:51Z. Reboot xảy ra trong **(05:04:22Z, 05:20:57Z]**. Mốc sống cuối cùng của fad2aab9 theo merged là session files 05:05:23Z (xem §2.4) — nhất quán với cờ T10 (05:04:22Z < 05:05:23Z < 05:20:57Z).
- **Các đoạn (chuẩn /proc/stat, xem §2.1/§2.4):** J-full = fad2aab9 [03:25:16Z → 05:20:57Z] = 6.941 s, 82 mốc merged (sau CLOCK RULE); K = 18e179e0 [05:20:57Z → 05:41:18Z] = 1.221 s, 50 mốc merged.
- **Verdict từng đoạn theo luật gap (floor 1.147 s):** J-full **KHÔNG ĐÓNG** — max gap 1.589 s (04:00:55Z → 04:27:24Z), max 1 ẩn (xem §2.4/§2.6; recheck 843.905 file không thêm mốc nào trong hố). K **ĐÓNG** — max gap 880 s (head), max 0 ẩn; mốc /var/log btmp/lastlog/wtmp 05:21:13Z = btime +16 s thu hẹp head gap xuống 16 s (hỗ trợ).
- **Gap #43 — DẠNG KHOẢNG ỨNG VIÊN: [6.939, 6.943] s, giữa 6.941 s** (xem §2.2/§2.5): e(fad2aab9 lúc ghi btime) ∈ [−1, +1] s (giả định — không có đo F trực tiếp trên fad2aab9); e(18e179e0 lúc ghi btime) ∈ [−1, +1] s (F114? ≈ 0/+1 s, đủ 3 server). **Số danh nghĩa 6.941 s NẰM TRONG khoảng.** Gap #43 CHƯA CHỨNG NHẬN (vì J-full chưa đóng) → CERT75/FULL90 ỨNG VIÊN (xem §2.5).
- **Khung chết #118? (boot fad2aab9): (05:05:23Z, 05:20:57Z] = 934 s danh nghĩa**, ≈ 934 ± 2 s giờ thực (mốc cuối là session files runtime theo đồng hồ host + btime boot mới chính xác F114? ≈ 0). Dài vì máy yên sau khi T10 đóng sổ đợt 151 (~05:05Z) tới #43. Recheck 0 mốc mới trong khung (§2.6).
- **INSIDE (ứng viên):** btime 18e179e0 05:20:57Z INSIDE dải FULL89 neo 03:25:16Z [03:51:31Z, 05:49:46Z] + dải FULL88 [03:51:30Z, 05:49:56Z] → chuỗi INSIDE 4 → 5 ỨNG VIÊN (chờ gap #42 chứng nhận — xem §2.5).
- **Bằng chứng hỗ trợ trong hố J (không phải closer — cùng hố với #74?, xem §2.4):** 26 dòng sampler T9-151 mỗi 60 s (04:01:18–04:26:19Z, boot=fad2aab9) + 3 session sống xuyên hố + HB scheduler dispatch 04:15:34Z (T7-151). Hố có lời giải thích vận hành đầy đủ — nhưng theo luật đứng, chúng không đóng đoạn theo luật gap.
- **Đối chiếu probe #71 với T1-152 (F-152-T1-1 + F-152-T1-8(c)):** T1 đếm log 205 dòng; 3 dòng mới 203–205 là probe #71 (DEAD #70 05:41:14Z + boot-changed 2e430750 → 18e179e0 + `probe#71 boot=18e179e0 ok=2 fail=0` 05:41:18Z) — **khớp đúng hồ sơ T2-152 §1** (heartbeat n=71, ts 05:41:18Z, boot 18e179e0, ok=2 fail=0). T1 chạy suite 28/28 exit 0 trên boot mới 05:39:17–05:50:36Z (lần đầu suite đầy đủ chạy trên boot sau #43) — boot ổn định, không reboot trong phiên T1. T1 cũng xác nhận cây md5 không đổi qua 7 boot (preview.tsx 530e10a7).
- **Run 151 bị #43 đánh trúng (F-152-T1-1(c)):** run 151 (đã bị viết lại started_at ở #42, hạn ngân sách 05:35:51Z) lại bị reboot #43 đánh trúng lúc 05:20:57Z — kết cục thuộc T7-152; có thể thêm 1 lần viết lại started_at (n=4 → 5?). T2-152 ghi nhận, KHÔNG phán thay (quyết 151 (t)).
- **Verdict mù #75?: MỞ theo luật gap** (J-full không đóng — cùng hố 1.589 s với #74?). **CERT/FULL chính thức GIỮ 73/88; chuỗi mù đóng hoàn toàn GIỮ 9.** Nếu parent quyết đóng trên bằng chứng hỗ trợ (câu hỏi §4.5 (a)): #75? đóng cùng #74? → gap #43 chứng nhận [6.939, 6.943] s → CERT75/FULL90 chính thức, chuỗi → 11. Nếu giữ luật gap nghiêm: #75? giao T2-153 (cùng hố, T2-153 kiểm lại) — xem §4.5 (b).

## 3. RAM trong cửa sổ mù (đọc sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10; chuẩn đứng: báo MAX MemAvailable theo % guard)

- **Đỉnh cửa sổ mù: 3.964.468 kB = 3.871,6 MiB (T9-152 sampler, 05:40:17Z, đoạn K) = 63,01% guard 6.144 MiB.** Đây là đỉnh cửa sổ ĐÚNG của đợt 152 (probe #70 → probe #71) — gồm cả đoạn K trên boot mới (balloon xả sau reboot #43 nên RAM trống cao). Đỉnh này CAO HƠN đỉnh đợt 151 (51,56%) — không phải tranh chấp số đo: 51,56% là đỉnh đoạn I+J (mù #74?), còn 63,01% là đỉnh toàn cửa sổ mù gồm đoạn K (xem phân đoạn dưới — bài học F-151-T9-7: báo rõ cửa sổ nào).
- **0 mẫu ≥ guard trong toàn cửa sổ:** T9-151 0/133 + T8-151 0/67 + T9-152 0/3 (tổng 0/202 sau khi loại 1 dòng boot cũ). **Birefnet 0 thử** — cơ chế tự động (a) đã nối từ T9-147 nhưng 0 mẫu ≥ guard nên không kích hoạt lần nào (đúng thiết kế — lần thứ sáu liên tiếp 0 lần thử).
- Đỉnh từng đoạn: I **3.243.888 kB = 51,56% guard** (03:03:31Z, T9-151 — khớp đúng số T9-151/Aggregate 151); J **1.830.756 kB = 29,10% guard** (03:26:17Z, T9-151 — mẫu đầu boot mới, ngay sau restart); K **3.964.468 kB = 63,01% guard** (05:40:17Z, T9-152 — 3 mẫu trong cửa sổ, load1 6,58 lúc đỉnh). Đọc tay đối chiếu lúc 05:41:36Z: MemAvailable 3.474.340 kB (55,2% guard) — cùng khoảng với sampler K (3,0–3,96M kB), nhất quán.
- Avail min trong cửa sổ: **250.840 kB = 245 MB (T9-151, 03:56:18Z, đoạn J)** — kỷ lục thấp đợt 151 (quyết 151 (h) đã chốt), nằm trong cửa sổ này. Dấu thời gian mẫu này là đồng hồ fad2aab9 (giả định chính xác lúc đầu boot — xem §2.2); giá trị là thật.
- Balloon: đoạn I tối đa **6.074.668 kB** (94,3% trần, **0 mẫu ghim**); đoạn J tối đa **6.443.824 kB** (100% trần, **31 mẫu ghim** — khớp đúng số T9-151 31/134: chuỗi 03:38:18–03:39:18Z n=2 + 04:09:18–04:36:19Z n=28 + 04:52:19Z n=1 còn mở lúc T9-151 đóng — quyết 151 (e) giao T9-152 theo dõi tiếp); đoạn K tối đa **3.746.584 kB** (58,1% trần, **0 mẫu ghim** — balloon đang leo lại sau reboot #43).
- Lưu ý: đỉnh cửa sổ này (63,01% guard) cao hơn đỉnh mù #74? (51,56%) vì đoạn K trên boot mới; cửa sổ guard KHÔNG tái mở đợt này (0 mẫu ≥ guard lần thứ sáu liên tiếp sau đợt 147/148/149/150/151).

## 4. Phương pháp + sai số của chính T2-152

### 4.1 Phương pháp

- Chứng nhận mù theo **luật gap** (merged 4 phạm vi: repo-1 + hidden_files + ngoài hai cây + /tmp, độ chính xác giây; floor = 1.147 s): max gap < sàn → đoạn đóng, max ẩn = 0; mỗi mốc có mtime giây + nguồn file + (với mốc ngoài cây) file đã tự tạo trong hai cây. Mốc thuộc boot cũ theo nội dung (replay-watch log 03:25:21Z, run-webkit-nohup.out 03:25:37Z) được LOẠI khỏi mốc đầu đoạn J sau khi kiểm nội dung (quy tắc CLOCK RULE đứng) — verdict không đổi (head gap 5 s → 61 s, max gap vẫn 1.589 s).
- Chuẩn mới: **mọi số btime/gap dùng /proc/stat** (quyết parent 148 (b)); /proc/1 chỉ ghi kèm để đối chiếu. Đếm mù: đếm chặt (2e430750 = #117?, fad2aab9 = #118?, 18e179e0 = #119?) — cùng chuẩn với đợt 147/148/149/150/151 (quyết 146 (a)). Chứng nhận gap **DẠNG KHOẢNG** với mid dùng cho thống kê (chuẩn mới quyết parent 149 (c), tiền lệ #58/#63/#39/#40/#41).
- Khung nhiệm vụ đợt 152 (phân tách mù #74?/#75?): mù #74? lấy đoạn I + J-full; mù #75? lấy J-full + K. T2-152 chứng nhận #74? theo brief; #75? CHỨNG NHẬN BỔ SUNG đầy đủ ở §2.13 theo F-152-T1-1 (reboot #43 phát hiện mới, không có trong brief gốc).
- Hole recheck: quét mtime toàn cây /home/hatch + /var/log trong 7 hố — 0 mốc nội bộ mới trong cả 7 hố (chỉ trúng chính mốc cạnh trái, bẫy float; lần thứ bảy liên tiếp) — NGOẠI TRỪ /var/log btmp/lastlog/wtmp 05:21:13Z trong hố đầu K (mốc thật, ngoài phạm vi merged).
- RAM: đọc sampler log (T9-151/T8-151/T9-152) + script ram-max (đối chiếu — khớp đọc tay + số T9-151 đã báo; xem §3); đỉnh báo cáo lấy theo max MemAvailable (chuẩn đứng T2-148/149/150/151) — và báo rõ cửa sổ (bài học F-151-T9-7).
- **Prereg cho T2-152 (phiên MỞ đầu, trước probe):** đã dự báo (a) probe #70 stale 10.827 s lúc 05:40:34Z (đúng: 10.866 s lúc 05:41:14Z — khớp, +40 s sau 40 s); (b) các đoạn 2.709/6.941/1.221 s (đúng); (c) gap #42/#43 danh nghĩa 7.165/6.941 s (đúng); (d) mù #74? ĐÓNG — **SAI: J-full không đóng (hố 1.589 s)** — prereg không lường được hố append-only (sampler ghi nối 1 file); (e) khung #117? (last-alive, 03:25:16Z] (đúng: 6 s) + nguồn gốc 18 s (đúng: dòng 03:25:34.073Z); (f) F114? đủ 3 server (đúng); (g) INSIDE 3 → 4 (đúng); (h) WFS #58 chênh 0 (đúng); (i) RAM đỉnh 51,56% — **ĐÚNG MỘT NỬA: đỉnh I+J là 51,56% nhưng đỉnh toàn cửa sổ là 63,01% (đoạn K)** — prereg không lường được đoạn K đẩy đỉnh lên; (j) EPERM 0 sóng (đúng); (k) gap #42 [7.163, 7.167] s (đúng dạng khoảng ứng viên, với giả định §2.2). Hai điểm sai/đúng-một-nửa đều do reboot #43 (ngoài brief) + hố append-only — ghi rõ, không giấu.

### 4.2 Sai số của chính T2-152 (danh sách đầy đủ — không giấu lỗi)

- **F-152-T2-1:** lần chạy F114? đầu tiên dùng `grep "^date:|^HTTP" | head -3` nên chỉ thấy 2 dòng HTTP (proxy CONNECT + status thật), Date bị cắt — **cùng bẫy F-151-T2-5, lần thứ hai liên tiếp**. Đã bắt được ngay (output không có dòng Date), chạy lại với `grep -i "^date:"` riêng — số đúng (3 server, +1 s mỗi server). Không ảnh hưởng số liệu (lần chạy lỗi bị bỏ, file f114.txt cuối là từ lần chạy lại đúng). Bài học: lọc riêng `^date:` ngay từ đầu (đã ghi trong F-151-T2-5 nhưng vẫn tái phạm — cần checklist cố định cho F).
- **F-152-T2-2 (prereg sai — không phải lỗi script):** prereg dự báo mù #74? ĐÓNG và RAM đỉnh 51,56% — cả hai đều sai một phần vì reboot #43 (ngoài brief) và hố append-only. Không ảnh hưởng số liệu (prereg chỉ là dự báo, mọi verdict lấy từ script). Ghi nhận để lần sau prereg tính cả khả năng reboot mới trong cửa sổ + hố do append-only log.
- **F-152-T2-3 (ghi file LIMITS — mode append của muse.write không nối thêm mà ghi đè):** ba lần ghi LIMITS bằng `muse.write` mode="append" (§2.2–§2.3, §2.4–§2.12, §3–§5) đều KHÔNG nối thêm — file trên đĩa sau mỗi lần ghi chỉ còn đúng nội dung lần ghi cuối (đã kiểm bằng `wc -c` + `grep`: file chỉ còn 13.196 byte, bắt đầu bằng §3). Đã bắt được khi kiểm lại trước lúc stage (grep không thấy "18,073" / "106,4") và **ghi lại toàn bộ tài liệu trong MỘT lần `muse.write` overwrite duy nhất** — file cuối đã kiểm đủ §0–§5 bằng `wc` + `grep` đối chiếu các mốc. Bài học đứng cho các luồng sau: **đừng chia LIMITS thành nhiều lần ghi append — ghi một lần duy nhất (hoặc ghi qua exec/python nếu phải chia)**; luôn kiểm `wc -c` + grep mốc sau khi ghi xong trước khi stage.

### 4.3 Câu hỏi cho parent (chỉ câu hỏi MỚI của đợt 152 — các câu hỏi cũ đã quyết không nhắc lại)

(a) **Mù #74? MỞ hay ĐÓNG? Chuỗi đóng hoàn toàn giữ 9 hay → 10?** Theo luật gap: MỞ (J-full hố 1.589 s, max 1 ẩn). Bằng chứng hỗ trợ mạnh trong hố: 26 dòng sampler T9-151 mỗi 60 s (04:01:18–04:26:19Z, boot=fad2aab9) + 3 session sống xuyên hố + HB dispatch 04:15:34Z (T7-151). Nếu parent đồng ý đóng trên bằng chứng hỗ trợ: gap #42 chứng nhận **[7.163, 7.167] s (giữa 7.165 s)** → **CERT 74 / FULL 89** là số chính thức; chuỗi đóng hoàn toàn 9 → **10**. Nếu giữ luật gap nghiêm: #74? MỞ, CERT/FULL giữ **73/88**, gap #42 giữ ứng viên.
(b) **Mù #75? (#43) — CHỨNG NHẬN BỔ SUNG ĐÃ XONG (§2.13, theo F-152-T1-1); giao T2-153 hay quyết luôn cùng (a)?** Số hiệu #75? ĐÃ XÁC NHẬN (đếm chặt). J-full + K: K đóng, J-full mở (cùng hố 1.589 s) → #75? MỞ theo luật gap; gap #43 **[6.939, 6.943] s (giữa 6.941 s)**; khung #118? 934 s; probe #71 đối chiếu khớp T1-152. Nếu (a) đóng trên bằng chứng hỗ trợ thì #75? cũng đủ điều kiện đóng cùng lúc (cùng hố, cùng bằng chứng): gap #43 chứng nhận → **CERT 75 / FULL 90**; chuỗi đóng hoàn toàn → **11**. Nếu (a) giữ mở thì #75? giao T2-153 (cùng hố, T2-153 kiểm lại).
(c) **Khung chết #117? chốt bản nào?** Danh nghĩa (03:25:10Z, 03:25:16Z] = **6 s**; bản giờ thực ước lượng **[6, 24] s** (mốc cuối là file đồng hồ VM, drift ≥ +18 s gần lúc chết). Khung #118? **934 s** danh nghĩa (≈ 934 ± 2 s giờ thực) — ghi nhận (không có câu hỏi riêng).
(d) **INSIDE chuỗi 3 → 4** (btime fad2aab9 INSIDE cả hai dải FULL88/FULL87 neo 01:25:51Z) — ghi nhận cùng (a) (không có câu hỏi riêng). **Chuỗi 4 → 5 ỨNG VIÊN** (18e179e0 INSIDE FULL89 [03:51:31Z, 05:49:46Z]) — chờ gap #42 chứng nhận.
(e) **Phương pháp — có tính dòng log sampler / event scheduler làm mốc merged không?** Nếu có: hố J thu hẹp còn ~60 s (26 dòng sampler) → J-full ĐÓNG, #74?/#75? đóng theo luật gap (không cần quyết ngoại lệ từng đợt). Đây là thay đổi phương pháp đứng (ảnh hưởng mọi đợt sau) — T2-152 KHÔNG tự áp dụng, chờ parent quyết.
(f) **F114? ≈ 0/+1 s, ĐỦ 3 SERVER** (cloudflare 200) — ghi nhận (không có câu hỏi).
(g) **/proc/1 lệch 0,83 s** — ghi nhận, không điều tra (trong sai số làm tròn, cùng họ 0,51 s đợt 151 / 0,91 s đợt 150).
(h) **WFS #58 chênh 0 (lần thứ 58); RAM đỉnh cửa sổ mù 63,01% guard (K) / 51,56% (I+J); birefnet 0 thử lần thứ sáu liên tiếp** — ghi nhận (không có câu hỏi).
(i) **Reboot #43 (ngoài brief) — parent có biết trước khi viết brief không?** T2-152 phát hiện lúc mở phiên (05:37Z); brief chỉ giao #74? — T2 đã làm đúng brief + báo #75? ở mức trạng thái. Nếu parent đã biết #43 mà brief vẫn chỉ giao #74? thì (b) là câu hỏi thừa — parent bỏ qua.
(j) **Đếm CERT74/FULL89/CERT75/FULL90 — T10 kiểm lại** (như mọi đợt: T10 xác nhận đếm cuối bằng dedup toàn cục trước khi đóng sổ đợt 152; số đếm CHÍNH THỨC vẫn 73/88 cho tới khi parent quyết (a)/(b) — quyết parent 150 (s): số đếm cuối CHỈ lấy từ output script).

### 4.4 Ghi chú cho T10-152 (đóng sổ đợt 152)

- Đợt 152 dùng **chuẩn btime /proc/stat** cho mọi số (quyết parent 148 (b)) — T10 kiểm lại đếm cuối bằng dedup toàn cục (không cộng round-unique vào lũy kế — bài học AGENTS.md đợt 126–127 + quyết parent 150 (s): số đếm cuối CHỈ lấy từ output script).
- **Đưa `npm test` vào suite đóng sổ chuẩn từ đợt 149** (quyết parent 148 (k) — V19 đã nối vào `test_integration.sh` theo quyết parent 150 (j), đếm integration 12, giao T0-152 — quyết parent 151 (w)).
- **O8 chạy sau cờ T4** (quyết parent 148 (c) — điều kiện chấp nhận trích dẫn đợt 148; từ đợt 149 trở đi tuân (j) — quyết parent 149 (f): trích là "harness sau khi T4 đóng cờ"; đợt 150 là ngoại lệ lệch chuẩn đã được chấp nhận ở quyết 150 (f) — trích là "harness sau khi poller T4 thoát (01:00:32Z), T4 0 attempt").
- **Chuẩn nguồn btime /proc/stat** đã áp dụng trong LIMITS này; các số /proc/1 chỉ còn để đối chiếu.
- **Mốc uptime 20:10:28Z (e2 > 595 s) BỊ LOẠI khỏi cận** — T10 không dùng làm cận cho gap #38 (xem §2.2 đợt 149 + quyết parent 149 (b)(i)).
- **Câu hỏi INSIDE/khung #117?/#118?/phương pháp §4.5 (a)(b)(c)(d)(e) cần parent phán trước khi T10 chốt chuỗi INSIDE + chuỗi mù đóng hoàn toàn + CERT/FULL + khung chết trong aggregate** — T10 ghi cả hai số khung #117? (6 s danh nghĩa / [6, 24] s giờ thực ước lượng) kèm chú thích chờ quyết, đừng tự chọn một bên; CERT/FULL chính thức giữ 73/88 cho tới khi parent quyết (a)/(b).
- **Kiểm cờ `.done` trên đĩa** (quyết parent 150 (t) + 151 (u)) — T10 ghi rõ "x/9 cờ" trong §10; T2-152 đã viết cờ của mình trước khi báo đóng.

## 5. File + stage

**File duy nhất của batch (LIMITS này):**
- `docs/PHASE9_ROUND152_T2_EPERM_LIMITS.md` — (kích thước/md5 xem cờ round152-t2.done; file > 37.768 byte → push cần ENABLE_PRIVSEP=0)

**Stage (không push):** `~/workspace/repo-1-push/paths-loop/phase9-round152-t2-eperm.txt` — 1 entry, NUL-delimited, text-only, 0 binary (verify bằng `od -c`).

**Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t2.done` — 1 dòng tóm tắt + kích thước/md5 LIMITS.

**File làm việc (không stage, chỉ để đối chiếu):** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t2/` — prereg-t2.md, boot-verify.txt, status1.txt, once.txt, status2.txt, f114.txt, blind74-investigate.py/.log, blind74-merged.py/.log, blind74-sessions.py/.log, blind74-fifthscope.py/.log, blind74-gaps.py/.txt, hole-recheck.py/.txt, eperm-sweep74.py + eperm-sweep-run.log, ram-max74.py + ram-max.txt, scan-wfs.sh + scan-wfs-run.log + scan-meta.txt + files-newstd.bin/files-r7b.bin/files-copies.txt + wfs-newstd.txt/wfs-r7b.txt/wfs-copies.txt, blind74-repo-1.txt, blind74-hidden_files.txt, blind74-outside.txt, blind74-tmp.txt, sessions-all.txt.

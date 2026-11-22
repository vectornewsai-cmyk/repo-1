# PHASE9 ROUND150 T2 — EPERM probe #69 + mù #71? ĐÓNG HOÀN TOÀN (E + F'-body theo luật gap; đuôi F' là khung #115? thuộc mù #72? MỞ) + gap #39 chứng nhận dạng khoảng [4.996, 5.000] s + F112? ≈ 0/+1 s ĐỦ 3 SERVER — LIMITS

## 0. Headline

- **Probe EPERM #69: ok=2 fail=0, boot e9295700, 23:44:57Z.** Probe trước (#68) đã chết/stale 10.427 s (2h53'47", n=68, ts 20:51:02Z, boot 70025d3e). Log `eperm-probe-v2.log` 196 → **199 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #71? ĐÓNG HOÀN TOÀN — chuỗi mù đóng hoàn toàn 6 → 7 (chờ parent xác nhận):** đoạn E **ĐÓNG theo luật gap** (merged max gap 127 s < sàn 1.147 s, max 0 ẩn); đoạn F'-body **ĐÓNG theo luật gap** (max gap 1.014 s < sàn, max 0 ẩn); đuôi F' (23:11:49Z → 23:32:09Z, 1.220 s > sàn) là **khung chết #115? thuộc mù #72? MỞ** — không thuộc phạm vi chứng nhận đợt này (theo khung nhiệm vụ: mù #72? giao đợt sau). **Gap #39 CHỨNG NHẬN DẠNG KHOẢNG: [4.996, 5.000] s, giữa 4.998 s** (chuẩn mới quyết parent 149 (c)) → **CERT 71 / FULL 86** (mids dùng cho thống kê). **Số danh nghĩa 4.998 s NẰM TRONG khoảng thật** — lần đầu tiên kể từ #36 số danh nghĩa không sai (cả #37/#38 đợt 149 đều sai; #36 cũng sai).
- **KHÔNG có bước nhảy đồng hồ tại #39:** F110? +0/+1 s (C3 chính xác) + F111? ≈ 0 s đủ 3 server (C4 chính xác, T2-149 §2.12) + journal liên tục cả hai boot + sampler T9-149 cadence đều 60/61 s tới mẫu cuối 21:23:38Z. Tranh chấp clock 27 s đợt 149 (e2 ∈ [313, 340] s, quyết parent 149 (b)) KHÔNG liên quan tới #39 — không mở lại điều tra.
- **Khung chết #114? THU HẸP MẠNH: (21:23:39Z, 21:23:51Z] = 12 s danh nghĩa** (mốc merged cuối 21:23:39Z — exec-log T2-149; sampler T9 mẫu cuối 21:23:38Z) — thay cho 327 s từ kiểm đóng T2-149 (21:18:24Z). Bản giờ thực ≈ [10, 14] s (e3, e4 ∈ [−1, +1] s).
- **Chuỗi INSIDE — CÓ ĐIỂM CẦN PARENT PHÁN (xem §4.5 (b)):** btime 802f358f **INSIDE** dải FULL85 [20:26:42Z, 22:25:42Z] (kiểm độc lập, khớp đúng số T2-149) → **chuỗi 0 → 1 ĐÃ CHỨNG NHẬN**. Boot mới e9295700: NGOÀI dải FULL85 neo 70025d3e [20:26:42Z, 22:25:42Z] (sau p90 3.987 s) — đúng như nhiệm vụ ghi — **NHƯNG dải đó là dải của 802f358f (neo tiền nhiệm 70025d3e), không phải dải của e9295700**. Dải đúng cho e9295700 (neo 802f358f): FULL86 [21:50:02Z, 23:48:50Z] → **INSIDE**; FULL85 neo 802f358f [21:50:00Z, 23:49:00Z] → **INSIDE**; FULL80 neo 802f358f [21:51:29Z, 23:48:11Z] → **INSIDE**. Theo chuẩn đứng (neo tiền nhiệm, dùng từ đợt 144): chuỗi **0 → 1 → 2**. T2-150 KHÔNG tự chốt theo bản đọc chữ của nhiệm vụ (chuỗi 1 → 0) — trình parent phán (§4.5 (b)).
- **F112? ≈ 0 s đến +1 s, ĐỦ 3 SERVER** (example +0, google +0, cloudflare +1 — cloudflare hết 403, trả Date bình thường). Đồng hồ C5 (boot e9295700) chính xác; btime 23:32:09Z là giờ thực.
- **REBOOT #40 TRONG CỬA SỔ — MÙ #72? MỞ (không thuộc phạm vi chứng nhận đợt này):** boot e9295700, btime 23:32:09Z (chỉ ~3,5 phút trước lượt cron). Boot 802f358f sống 7.698 s danh nghĩa (21:23:51Z → 23:32:09Z). Khung chết danh nghĩa #115?: (23:11:49Z, 23:32:09Z] = 1.220 s (mốc cuối xác nhận sống: file session-continuity của runtime 23:11:49Z; 0 session chạm hố; hole-recheck 0 mốc mới trong hố). Giao T2-151 chứng nhận (cửa sổ từ 23:11:49Z last-known-alive / probe #69).
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~203 h trước probe #69). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong cửa sổ mù: 2.342.132 kB = 2.287,2 MiB (T5-149 sampler, 21:05:18Z, đoạn E) = 37,23% guard 6.144 MiB** — 0/147 mẫu ≥ guard (T9-149 0/115 + T5-149 0/32). Birefnet **0 thử lần thứ tư liên tiếp** (147/148/149/150). Balloon: đoạn E max 5.559.124 kB (86,3% trần, 0 ghim); đoạn F max 6.443.824 kB (100% trần, **49 mẫu ghim** — chuỗi ghim trần mới từ đợt 149, quyết parent 149 (e)).
- **WFS #56: chênh 0 — lần thứ 56 liên tiếp.** NEWSTD 976 dòng / 280 file; R7b 1.001 / 297; copies 25 / 17. Delta +4 dòng / +2 file giải thích đầy đủ bằng diff (không đoán trước).
- **Quyết parent đợt 149 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** ((b) tranh chấp clock — bác bỏ "X > 595 s", giữ khoảng rộng e2 ∈ [313, 340] s, khung #113? bản giờ thực (113, 347] s; (c) chứng nhận dạng khoảng là chuẩn; (j) khung chết #111? [88, 156] s / #112? 55 s / #113? (113, 347] s; (k) F110? ghi là CHƯA ĐỦ 3 SERVER, không đo lại; F111? ≈ 0 s đủ 3 server; (l) replay trễ + cache apt 0.deb chỉ ghi nhận; (n) chuỗi INSIDE 0 → 1 tạm tính chờ chứng nhận này) — chỉ câu hỏi MỚI phát sinh ở đợt 150 ghi ở §4.5.

## 1. Checklist probe EPERM #69 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Đọc boot lúc mở phiên | 23:41:27Z | e9295700-bda0-4a9b-8aab-4dd57661212e, btime /proc/stat 1795131129 = 23:32:09Z (chỉ đọc boot_id + btime, chưa probe — prereg viết sau đó) |
| Xác minh boot lần 1 (prereg) | 23:44:18Z | e9295700, btime 23:32:09Z, `uptime -s` 23:32:09Z, MemAvailable 491.804 kB (23:41:27Z), log 196 dòng, heartbeat n=68 ts 20:51:02Z boot 70025d3e |
| `status` | 23:44:49Z | **DEAD/STALE**, heartbeat n=68, ts 2026-11-19T20:51:02Z, boot 70025d3e, tuổi **10.427 s (2h53'47")**, exit 1 (đo trực tiếp, không tee) |
| `once` | 23:44:57Z | **Probe #69, boot=e9295700, ok=2 fail=0**, exit 0; dòng log `boot changed 70025d3e -> e9295700 (uptime since 2026-11-19 23:32:09)` — đúng chuẩn /proc/stat mới |
| `status` lại | 23:44:57Z | **ALIVE**, tuổi 9 s, n=69, exit 0 |
| Log probe | 23:44:57Z | `eperm-probe-v2.log` 196 → **199 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=69, ts 2026-11-19T23:44:57Z, boot e9295700; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại sau once, ts=23:44:57Z, boot=e9295700, n=69 — khớp |
| Xác minh boot lần 2 | 23:45:33Z | Cùng boot_id/btime; `/proc/1` 23:32:24,98Z; `/proc/1/stat` starttime 1.507 ticks = **15,07 s sau kernel boot** → PID 1 start wall = 23:32:09Z + 15,07 s = 23:32:24,07Z ≈ /proc/1 mtime 23:32:24,98Z (lệch 0,91 s — lớn nhất từ trước, vẫn trong sai số làm tròn ~1 s; xem F-150-T2-5); `uptime -s` = 23:32:09Z (= /proc/stat); uptime 13 phút lúc 23:45:33Z → 23:45:33 − 13:24 = 23:32:09Z ✓; journal đúng 1 boot, entry đầu 23:32:25Z = /proc/1 +0 s; MemAvailable 1.026.892 kB |
| Xác minh boot lúc đóng | 00:12:47Z 20/11 | **KHÔNG đổi boot — e9295700**, btime 23:32:09Z; MemAvailable 1.480.624 kB (00:13:48Z); không có reboot mới trong phiên → không mở mù #73? |
| dpkg.log boot e9295700 | 23:45:35Z | **2 dòng** (cả hai 23:35:42Z `startup packages configure` = **boot +3'33"**) — replay **BẮT ĐẦU BÌNH THƯỜNG** (không trễ 35 phút như boot 70025d3e — xem §2.2 cuối + quyết parent 149 (l)); không có dpkg.log.1; /var/log/apt/history.log KHÔNG tồn tại (ls + tail lỗi — exit 1 từ lệnh kiểm tra, không phải lỗi đo lường); T5-150 theo dõi tiếp |
| F112? | 23:45:59–23:46:00Z | example.com Date 23:45:59 (+0 s), google.com 23:45:59 (+0 s), cloudflare.com 23:46:00 (+1 s, sai số làm tròn header Date 1 s) → **F112? ≈ 0 s đến +1 s, ĐỦ 3 SERVER** (cloudflare hết 403 — xem F-150-T2-1 về lần chạy đầu) |

## 2. Điều tra mù #71?

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Cửa sổ mù: 20:51:02Z 19/11 → 23:44:57Z 19/11 = 10.435 s (2h53'55")** — từ probe #68 tới probe #69.
- Hai reboot bên trong cửa sổ probe-to-probe (#39 và #40) — nhưng theo khung nhiệm vụ, mù #71? chỉ chứng nhận #39 (cửa sổ đóng bởi btime #40), mù #72? nhận #40:

| Đoạn | Boot | Btime (/proc/stat) | Btime (/proc/1) | Dài (danh nghĩa) | Chết lúc |
|---|---|---|---|---|---|
| E | 70025d3e (#114?) | 20:00:33Z 19/11 (1795118433) | 20:00:44Z (1795118444) | 1.969 s (từ probe #68) | 21:23:51Z |
| F' | 802f358f (#115?) | 21:23:51Z 19/11 (1795123431) | 21:24:01Z (1795123442) | 7.698 s (tới btime #40) | 23:32:09Z |
| F | 802f358f + e9295700 | 21:23:51Z → 23:44:57Z | — | 8.466 s (tới probe #69) | (e9295700 còn sống — probe #69) |

- Gap danh nghĩa (btime − btime, tính bằng epoch, chuẩn /proc/stat): #39 = **4.998 s** (tuổi thọ 70025d3e); #40 = **7.698 s** (tuổi thọ 802f358f — CHƯA chứng nhận, thuộc mù #72?). **Số danh nghĩa #39 NẰM TRONG khoảng thật [4.996, 5.000] s** (xem §2.2) — lần đầu tiên kể từ #36 số danh nghĩa không sai.
- Độ trễ init (starttime ticks): 70025d3e 10,85 s; 802f358f 10,37 s; e9295700 15,07 s — cả ba đều hòa giải được bằng số (PID 1 start wall ≈ /proc/1 mtime, lệch ≤ 0,91 s — xem F-150-T2-5).
- Nguồn quan sát mốc cuối mù: T10-149 đóng sổ 23:00Z (boot 802f358f, uptime 1:34); aggregate 149 mtime 23:09:19Z (parent viết §12.3); file session-continuity runtime 23:11:49Z; file mở đợt 150 23:35:35Z (live-config) + 23:36:31Z (memory/2026-11-20.md); probe #69 23:44:57Z.

### 2.2 Đánh số + đồng hồ — chuẩn parent mới + KHÔNG có bước nhảy tại #39

- **Quyết parent đợt 149 (§12.3) ĐÃ ÁP DỤNG:** (b) **tranh chấp clock: bác bỏ "X > 595 s" ĐÃ XÁC NHẬN** (ràng buộc thứ tự reboot e2 < 382 s); mâu thuẫn 27 s **GIỮ KHOẢNG RỘNG e2 ∈ [313, 340] s**, không chọn nhánh, không mở điều tra mới; khung #113? **CHỐT BẢN GIỜ THỰC (7 + e2 s) = (113, 347] s**; bản danh nghĩa 7 s là ẢO. (c) **chứng nhận DẠNG KHOẢNG là chuẩn mới** (mù #68/#69?/#70? đóng hoàn toàn → CERT 70 / FULL 85, chuỗi đóng hoàn toàn 6). (j) **khung chết: #111? [88, 156] s; #112? 55 s; #113? (113, 347] s (giờ thực).** (k) **F110? 2/3 server: GHI LÀ CHƯA ĐỦ 3 SERVER, không đo lại; F111? ≈ 0 s đủ 3 server trên boot mới.**
- **KHÔNG CÓ BƯỚC NHẢY ĐỒNG HỒ TẠI #39 (kết luận mới của đợt này, kiểm bằng 4 nguồn độc lập):**
  - **F110? +0/+1 s lúc 20:51:15Z** (example +1, google +0 — T2-149 §1) → e3 ∈ [−1, +1] s (C3 chính xác, sai số làm tròn header Date 1 s).
  - **F111? ≈ 0 s ĐỦ 3 SERVER lúc 21:28:35–37Z** (example 21:28:35, google 21:28:36, cloudflare 21:28:37 — T2-149 §2.12) → e4 ∈ [−1, +1] s (C4 chính xác).
  - **Journal liên tục cả hai boot:** boot 70025d3e journal ticker 70 s đều 20:00:44–20:40:54Z (T2-149 §2.2); boot 802f358f journal liên tục 21:24:02–21:27:56Z (T2-149 §2.12) — 0 dòng timesyncd/chrony/step, không có chỉnh giờ sau boot.
  - **Sampler T9-149 cadence đều:** 60/61 s liên tục tới mẫu cuối trên boot cũ 21:23:38Z (21:20:37 → 21:21:37 = 60 s → 21:22:38 = 61 s → 21:23:38 = 60 s); T9-149 LIMITS §2: "Không có nghịch lý đồng hồ trong dữ kiện T9 (btime boot mới muộn hơn 13 s so với mẫu cuối boot cũ)".
  - Hệ quả: **gap #39 thật = 4.998 + (e3 − e4) ∈ [4.996, 5.000] s** (xem §2.5). Đối chiếu chéo: mẫu sampler cuối 21:23:38Z (C3) → gap > 4.985 s; khung chết merged (21:23:39Z, 21:23:51Z] → gap ∈ (4.986, 5.000] s — cả hai đều yếu hơn cận F, nhất quán, không mâu thuẫn. **Không có "nhánh" nào ở #39** (khác #37/#38 đợt 149 — không cần hợp hai nhánh).
- **Tranh chấp 27 s đợt 149 KHÔNG ảnh hưởng đợt này:** nó chỉ liên quan e2 (đồng hồ thời ae8f70bb, đã chết ở #38). Gap #39 chỉ dùng e3/e4 (đều ≈ 0, đo trực tiếp). Ghi rõ để tránh nhầm lẫn khi đọc lại.
- **Mâu thuẫn full boot_id b47f7932 — VẪN ĐỂ MỞ (không có dữ kiện mới, quyết (g) đợt 143):** T2-150 không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận.
- **Dị thường replay boot 70025d3e (trễ ~35 phút) là ĐẶC THÙ MỘT BOOT:** dpkg.log boot mới e9295700 chỉ có 2 dòng 23:35:42Z = boot +3'33" (bắt đầu bình thường); dpkg.log boot 802f358f có 2 dòng 21:24:31Z = boot +40 s (T2-149 §2.12 — cũng bình thường). Chỉ boot 70025d3e trễ +35'05". Quyết parent 149 (l): CHỈ GHI NHẬN (T5-150 ghi giờ bắt đầu replay + kiểm cache sống qua #40 không). Không ảnh hưởng chứng nhận gap (replay là việc của T5, không phải mốc mù).

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác giây:**
- repo-1: **16 file** (15 mốc giây); hidden_files: **484 file** (288 mốc giây). Tổng hai cây **301 mốc giây khác nhau** (16 + 484 file).
- Đoạn E: **193 mốc giây hai cây**; đoạn F: **108 mốc giây hai cây** (193 + 108 = 301 ✓).

**Sessions (`~/workspace/agents/`, 299 exec-log, 299 file có birth/mtime dùng được — TĂNG 11 so với 288 đợt 149; 0 file biến mất có mtime trong cửa sổ mù):**
- Bắc cầu: E-lo **2**, E-hi **7** (cắt giao nhau — hình học, F-147-T2-4); F-lo **4**, F-hi **0**, F'-hi **0**.
- Chạm đoạn: E **23**, E-tail **13**, F **16**, F'-body **11**, F-tail-hole **0**, F'-tail **0** — **0 session chạm hố đuôi F' (23:11:49–23:32:09Z)**.
- Nhân chứng nhảy (jump witness): **0 tại cả hai btime** (#39 và #40 — cùng mẫu đợt 148/149; sessions không bắc qua reboot).
- Nhắc boot trong exec-log trong cửa sổ: 70025d3e **18**, 802f358f **9**, e9295700 **3** (gồm tool-output của chính T2-150).

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **144 file** trong cửa sổ (88 mốc giây). /tmp: **2 file** (2 mốc giây — zeitgeist `.parsed.json` + `.xml` 23:42:09Z/23:42:11Z, mở đợt 150 trên boot mới). Goals ngoài hidden_files: **0 file** trong cửa sổ. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **2 file** (21:34:13Z đoạn F — memory/2026-11-19.md; 23:36:31Z đoạn F — memory/2026-11-20.md, mở đợt 150).
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: E-tail **31 / 0 / 6 / 96** (luồng đợt 149 đóng sổ: T1/T0/T4/T6 LIMITS, cờ .done, o8 mp4, file T2-149); F-tail **47 / 2 / 0 / 47** (luồng đợt 150 + T2-150, gồm 2 file zeitgeist /tmp); F'-tail **0 / 0 / 0 / 0** — hố đuôi F' hoàn toàn trống mốc file (khớp 0 session chạm hố).

**Ranh giới:** 802f358f: **0 file trong [btime−10 s, btime]** (mốc cuối đoạn E 21:23:39Z cách btime 12 s); **0 file trong (btime, +10 s]** (mốc đầu đoạn F 21:25:03Z = btime +72 s). e9295700: **0 file trong (btime, +10 s]**; **0 file trong [btime−10 s, btime]** (mốc cuối F'-body 23:11:49Z cách btime 1.220 s — chính là khung #115?).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**383 mốc giây khác nhau** (repo-1 15, hidden_files 288, ngoài cây 88, /tmp 2). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| E | 222 | **127 s** (21:17:59→21:20:06) | 122 s / 80 s | 20:51:02 (0 s) | 21:23:39 (12 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| F (tới probe #69) | 161 | **1.426 s** (23:11:49→23:35:35) | 1.014 s / 413 s | 21:25:03 (72 s) | 23:44:56 (1 s) | **CHƯA ĐÓNG — chứa reboot #40** |
| F' (tới btime #40) | 127 | **1.220 s** (23:11:49→23:32:09) | 1.014 s / 413 s | 21:25:03 (72 s) | 23:11:49 (1.220 s) | **BODY ĐÓNG, TAIL MỞ** |
| F'-body | 127 | **1.014 s** (21:54:43→22:11:37) | 413 s / 399 s | 21:25:03 (72 s) | 23:11:49 | **ĐÓNG — max 0 ẩn** (luật gap) |

**Đoạn E — ĐÓNG (max 0 ẩn, luật gap — KHÔNG cần uptime).** Gap lớn nhất merged 127 s < sàn 1.147 s; floor(127/1147)=0. 222 mốc: đầu 20:51:02Z (probe #68 — head 0 s), cuối 21:23:39Z (exec-log T2-149 proc_9cafc731c1ed.log — tail 12 s). E-lo/E-hi 2/7 là hình học (hai cắt giao nhau vì E ngắn hơn 2 sàn — F-147-T2-4). Không session nào bắc qua btime #39 (jump witness 0).

**Đoạn F'-body — ĐÓNG (max 0 ẩn, luật gap).** Gap lớn nhất merged 1.014 s < sàn 1.147 s; floor(1014/1147)=0. 127 mốc: đầu 21:25:03Z (voice context.md — head 72 s: 72 s đầu đoạn F không có mốc nào vì sampler chết theo reboot #39, T9 khởi động lại bằng tay 21:25:05Z), cuối 23:11:49Z (file session-continuity của runtime — mốc cuối xác nhận sống của 802f358f). F-lo 4 session bắc cầu; F'-hi 0 (hình học — cắt nằm trong hố đuôi).

**Đuôi F' — MỞ (khung chết #115?, thuộc mù #72?).** Gap 23:11:49Z → 23:32:09Z = **1.220 s > sàn 1.147 s**; floor(1220/1147)=1 → tối đa 1 ẩn. Hố này chứa reboot #40 (btime 23:32:09Z) và KHÔNG chứa reboot nào khác đã biết — nhưng luật gap không tự đóng được (cần chứng nhận riêng ở đợt 151, với cửa sổ từ 23:11:49Z). 0 session chạm hố; hole-recheck 0 mốc mới trong hố (§2.6). **Đuôi này KHÔNG ảnh hưởng chứng nhận gap #39** (nó chỉ liên quan cái chết của 802f358f, tức gap #40 — xem §2.5).

**Khung chết (danh nghĩa theo timestamp + bản theo giờ thực):**
- **#114? (boot 70025d3e): (21:23:39Z, 21:23:51Z] = 12 s** (danh nghĩa). Mốc cuối đoạn E merged: exec-log T2-149 21:23:39Z. Bản theo giờ thực: mốc và btime CÙNG cặp đồng hồ đã đo (e3, e4 ∈ [−1, +1] s) → khung thật ∈ **[10, 14] s**, giữa 12 s. **Thu hẹp từ 327 s (kiểm đóng T2-149, mốc 21:18:24Z) xuống 12 s** — mốc sampler T9 21:23:38Z và exec-log 21:23:39Z đều nằm sau kiểm đóng T2-149. Recheck 0 mốc mới trong khung (§2.6).
- **#115? (boot 802f358f): (23:11:49Z, 23:32:09Z] = 1.220 s** (danh nghĩa). Mốc cuối F'-body merged: file session-continuity runtime 23:11:49Z. Bản theo giờ thực: C4 chính xác (F111? ≈ 0 s), C5 chính xác (F112? ≈ 0/+1 s) → **1.220 s (danh nghĩa = thật, ±2 s)**. Recheck 0 mốc mới trong khung (§2.6). **MỞ — giao T2-151 chứng nhận cùng mù #72?** (xem §2.12).
- **Caveat ranh giới:** các mốc F đầu (21:25:03Z, 21:25:05Z) là file viết trên boot mới sau khi T9 khởi động lại sampler bằng tay; không có mốc nào trong 72 s đầu đoạn F (21:23:51–21:25:03Z) — nhưng 72 s < sàn nên không tạo ra ẩn theo luật gap.

### 2.5 Phân phối gap — CERT/FULL CHỨNG NHẬN (chuẩn /proc/stat)

- **Gap #39 CHỨNG NHẬN DẠNG KHOẢNG: [4.996, 5.000] s, giữa 4.998 s** — đoạn E + đoạn F'-body đều đóng theo luật gap; không có bước nhảy đồng hồ tại #39 (e3, e4 ∈ [−1, +1] s từ F110?/F111?); khung chết #114? 12 s danh nghĩa pin cái chết. **Số danh nghĩa 4.998 s NẰM TRONG khoảng thật** — lần đầu tiên kể từ #36 (và là gap đầu tiên mà danh nghĩa đúng trong sai số ±2 s).
- **CERT71 (CHỨNG NHẬN đợt này):** n=71, mean **1h36'26"**, median **1h50'39"**, p10 **0h24'45"**, p90 **2h19'23"**, sd **0h52'27"**, min **0h00'55"**, max **5h14'27"**; trong 90–150' = **37**, <60' = **17**, >180' = **4**, >240' = **1**. **FULL86 (CHỨNG NHẬN đợt này):** n=86, mean **1h41'41"**, median **1h53'38"**, p10 **0h26'11"**, p90 **2h25'00"**, sd **0h59'27"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **44**, <60' = **20**, >180' = **7**, >240' = **3**.
- **SPAN (không chứng nhận):** 691a7403→cc222c8a = **7.050 s**; cc222c8a→e146ca67 = **7.381 s** (quyết 145 (f): để SPAN, không mở đường mới); b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**. Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL.
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Gap #39 chứng nhận dạng khoảng hẹp (tiền lệ #58/#63); không đề xuất đường chứng nhận mới. Thống kê dùng mid của khoảng (tiền lệ #58) — mid 4.998 s = đúng số danh nghĩa; ảnh hưởng lên mean ~0 s.
- Dải chứng nhận: [0h00'55", 5h14'27"] (CERT70) → **[0h00'55", 5h14'27"]** (CERT71 — max không đổi vì gap #39 nhỏ hơn max cũ).
- **Chuỗi INSIDE (xem §4.5 (b) — CÓ ĐIỂM CẦN PARENT PHÁN):**
  - 802f358f làm #115? (đếm chặt, chuẩn), dải FULL85 neo #114? 20:00:33Z: **[20:26:42Z, 22:25:42Z]** — btime 21:23:51Z **INSIDE** (kiểm độc lập bằng code, khớp đúng số T2-149) → **chuỗi INSIDE 0 → 1 ĐÃ CHỨNG NHẬN** (quyết parent 149 (n) nay thành chính thức). Kiểm chéo bằng dải FULL80 neo 70025d3e [20:28:11Z, 22:24:53Z] cũng **INSIDE**.
  - e9295700 làm #116?, dải FULL86 neo #115? 21:23:51Z: **[21:50:02Z, 23:48:50Z]** — btime 23:32:09Z **INSIDE** → chuỗi 1 → **2** (theo chuẩn đứng: neo tiền nhiệm). Kiểm chéo: FULL85 neo 802f358f [21:50:00Z, 23:49:00Z] → INSIDE; FULL80 neo 802f358f [21:51:29Z, 23:48:11Z] → INSIDE. Cả ba dải đều cho INSIDE với biên thoải mái (≥ 962 s khỏi cạnh).
  - Đối chiếu bản đọc chữ của nhiệm vụ: e9295700 NGOÀI dải FULL85 neo 70025d3e [20:26:42Z, 22:25:42Z] (sau p90 3.987 s) — **nhưng dải đó là dải của 802f358f, không phải của e9295700** (neo sai tiền nhiệm). T2-150 trình cả hai số và hỏi parent phán (§4.5 (b)); KHÔNG tự chốt chuỗi 1 → 0 theo bản đọc chữ.
  - Boot tiếp theo sau e9295700 (#117? chặt), dải FULL86 neo 23:32:09Z: **[23:58:20Z, 01:57:09Z]** (FULL85 neo 23:32:09Z để đối chiếu: [23:58:18Z, 01:57:18Z]).
- **Tốc độ reboot:** **115 reboot / 217,09 h = 1 lần / 113,3 phút** (tới #39; từ boot #1 2026-11-10T20:18:10Z tới 802f358f). Tới #40: **116 reboot / 219,23 h = 1 lần / 113,4 phút**. Chuỗi lũy kế tới **126 / 217,09 h = 1 lần / 103,4 phút** (+0 mù #71? đóng hoàn toàn; mù #72? mở — chưa cộng; tổng dung lượng 55B max 3 → 127; 56A max 3 → 129 — giữ nguyên như đợt 149 vì không có mù mới nào đóng thêm theo hướng dung lượng).
- **Tuổi thọ boot (danh nghĩa stat→stat):** 70025d3e 4.998 s; 802f358f 7.698 s (tới btime #40 — danh nghĩa, chưa chứng nhận). **Tuổi thọ THẬT:** 70025d3e = gap #39 ∈ [4.996, 5.000] s (danh nghĩa ≈ thật, sai số ≤ 2 s).

### 2.6 Recheck các hố — điều kiện duy nhất còn lại cho khung chết

- Quét mtime toàn cây `/home/hatch` (842.531 file, bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) + `/var/log` (6 file) cho mốc trong 5 hố: **842.537 file đã quét.**
- **H-E (127 s): 4 hit — tất cả đều là cùng giây với cạnh trái 21:17:59.xxx, KHÔNG phải mốc mới** (cùng bẫy F-146-T2-3/F-147-T2-3/F-148-T2-3/F-149-T2-4, **lần thứ năm liên tiếp**): o8-chromium chrome-userdata Network Persistent State 21:17:59.058 + o8-lock.log 21:17:59.739 + exec-log proc_fd215e6567b1.log 21:17:59.773 + o8-149t8.log 21:17:59.773 (chính mốc cạnh trái).
- **H-F2 (1.014 s): 2 hit — cùng giây cạnh trái 21:54:43.022** (sessions .jsonl + sessions.json của agent 51da1877 — chính mốc cạnh trái).
- **H-FT / khung #115? (1.220 s): 2 hit — cùng giây cạnh trái 23:11:49.xxx** (prompt-continuity .json 23:11:49.174 + .jsonl 23:11:49.489 — chính mốc cạnh trái).
- **H-DF / khung #114? (12 s): 1 hit — cùng giây cạnh trái 21:23:39.398** (exec-log proc_9cafc731c1ed.log — chính mốc cạnh trái).
- **H-FP / sau #40 (206 s): 3 hit MỚI — /var/log/btmp + lastlog 23:32:25.845Z, wtmp 23:32:25.944Z** = btime #40 +16–17 s (login records ghi lúc boot). Đây là **mốc mới thật trên boot e9295700** (không nằm trong 4 phạm vi merged — /var/log chỉ quét ở hole-recheck): mốc hoạt động đầu tiên trên boot mới là 23:32:25Z, thu hẹp hố sau #40 thành (23:32:25Z, 23:35:35Z] = 170 s — **ghi cho T2-151** (thuộc mù #72?, không thuộc chứng nhận đợt này).
- **Kết luận: đoạn E và F'-body ĐÓNG; khung chết #114? 12 s / #115? 1.220 s (danh nghĩa) đứng nguyên sau recheck.** Không còn đường thu hẹp khung nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức; tự động hóa đã nối từ T9-147, 0 mẫu ≥ guard đợt này nên không kích hoạt — lần thứ tư liên tiếp 0 lần).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).
- Khung chết #110? 223 s (quyết parent 148 (g)) — đã chốt, không kiểm lại.
- Khung chết #111? [88, 156] s / #112? 55 s / #113? (113, 347] s (quyết parent 149 (j)) — đã chốt, không kiểm lại.
- F110? 2/3 server — ghi là CHƯA ĐỦ 3 SERVER, không đo lại (quyết parent 149 (k)).
- Mù #72? / khung #115? — MỞ, giao T2-151 (xem §2.12).

### 2.8 Quét WFS #56 (00:12:53–00:13:28Z 20/11 — chạy trên boot e9295700, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 976 dòng / 280 file** (phạm vi 3.262 file). **R7b: 1.001 / 297** (phạm vi 12.655 file). **Copies: 25 / 17** (không đổi). Đối chiếu 976+25=1.001=R7b, **chênh 0 — lần thứ 56 liên tiếp**.
- Delta so với #55 (972/278): **+4 dòng / +2 file**, giải thích đầy đủ bằng diff (không đoán trước): `server/render/src/test_v19_pixelate_probe.js:3` — script probe pixelate của T0-149, cả ba lần đều là `fs.writeFileSync(inp, ...)` ghi file input tạm cho test (dòng 120/132/383 — dùng hợp lệ trong script probe, không phải helper mới); `docs/PHASE9_ROUND149_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-149 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.8 (cùng mẫu #53/#54/#55: LIMITS T2-146/T2-147/T2-148). Phạm vi quét tăng +8 file (3.254→3.262) là LIMITS đợt 149 + file đợt 150 (T0 pixelate), không chứa writeFileSync ngoài hai file trên.
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7**, `apps/web/src/media.ts` **2c384ed1**, `apps/web/vite.config.ts` **ee80d093** — không đổi (T0-150 chưa đụng ba file này lúc quét; file T0-150 sửa là server/render + geq probe).

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** trong src. (Grep `async .writeFile(` lần đầu trả 0 dòng vì hai helper dùng `await f.writeFile(file, data);` — đã kiểm trực tiếp hai dòng đó: eperm-retry.mjs:71 + epermRetry.js:116, cùng mẫu F-149-T2-7.)
- Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — không kiểm lại đợt này (T2-148 đã xác nhận md5 giống hệt bản src — artifact build, không phải helper mới).

### 2.10 Quét EPERM trong cửa sổ mù

- **79 file *.log** có mtime trong cửa sổ mù. Đếm: "sóng EPERM vẫn bật" **6**, "CẢNH BÁO" **6**, "Operation not permitted" **6**, "sóng EPERM đã tắt" **6** — **tất cả 24 hit đều nằm trong CÙNG MỘT file `round149-t2/eperm-sweep-run.log`** (log quét của T2-149 tự trích tên marker trong output của chính nó — false positive tự tham chiếu, xem F-149-T2-3; mẫu lặp lại đợt này). **0 sóng EPERM thật.**
- Kiểm độc lập bằng `grep -rl` toàn cây hidden_files (xem F-150-T2-2): file duy nhất khác chứa marker là `round150-t9/b2-spikes.log` — 3 hit đều là **chính lệnh grep kiểm tra của T2-150** (pid 44657, comm=`grep -rl sóng EPERM vẫn bật`) bị B2 watcher của T9-150 ghi lại thành spike — tự tham chiếu của thao tác kiểm tra, không phải sóng. File này sinh 23:48:32Z (sau probe #69) nên vốn không nằm trong cửa sổ quét.
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~203 h** trước probe #69). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-150 — KHÔNG: không có reboot mới trong phiên

- Boot lúc mở phiên (23:41:27Z), lúc probe (23:44:57Z) và lúc kiểm đóng (00:12:47Z 20/11) đều là **e9295700, btime 23:32:09Z**. Không mở mù #73?.
- Reboot #40 xảy ra TRƯỚC phiên (23:32:09Z, ~3,5 phút trước lượt cron 06:35 +07) — xem §2.12.
- **dmesg KHÔNG thử đọc đợt này** (T2-148 đã xác nhận `Operation not permitted` — không lặp lại thao tác đã biết chặn). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

### 2.12 Mù #72? MỞ — reboot #40 (802f358f → e9295700) — CHỈ GHI NHẬN, KHÔNG CHỨNG NHẬN

- **Sự kiện:** reboot #40, btime mới /proc/stat **23:32:09Z** (boot e9295700, #116? theo đếm chặt). Boot 802f358f sống **7.698 s danh nghĩa** (21:23:51Z → 23:32:09Z = 2h08'18"). Khung chết danh nghĩa #115?: **(23:11:49Z, 23:32:09Z] = 1.220 s** (mốc cuối xác nhận sống: file session-continuity của runtime 23:11:49Z; mốc đầu sau reboot: /var/log/btmp+lastlog+wtmp 23:32:25Z — xem §2.6).
- **Đồng hồ boot mới (C5) CHÍNH XÁC — F112? ≈ 0/+1 s, ĐỦ 3 SERVER** (23:45:59–23:46:00Z, sau reboot ~14 phút): example.com Date 23:45:59, google.com 23:45:59, cloudflare.com 23:46:00 — cả ba khớp giờ local trong sai số làm tròn header Date 1 s. **Cloudflare hết 403** (trả Date header bình thường — như F111?). Journal boot mới liên tục 23:32:25–23:45:30Z (entry đầu 23:32:25Z = /proc/1 +0 s). → btime 23:32:09Z là giờ thực (chờ T2-151 đo lại F chính thức — F113?).
- **dpkg replay boot mới BẮT ĐẦU BÌNH THƯỜNG:** dpkg.log có 2 dòng 23:35:42Z `startup packages configure` = **boot +3'33"** (so với +35'05" của boot 70025d3e và +40 s của boot 802f358f). Giao T5-150 theo dõi tiếp (quyết parent 149 (l)).
- **INSIDE (tạm tính theo chuẩn đứng — chờ parent phán §4.5 (b)):** btime e9295700 23:32:09Z nằm TRONG dải FULL86 neo 802f358f [21:50:02Z, 23:48:50Z] → **INSIDE** → chuỗi INSIDE 1 → **2 (tạm tính)**. Chỉ là vị trí btime so với dải; chuỗi chính thức do T10-150/parent xác nhận sau khi mù #72? được chứng nhận (và sau khi parent phán §4.5 (b)).
- **Phạm vi:** mù #72? KHÔNG thuộc chứng nhận đợt này (cửa sổ T2-150 đóng ở probe #69, 23:44:57Z — nhưng btime #40 (23:32:09Z) nằm TRONG cửa sổ probe-to-probe; theo khung nhiệm vụ, #72? lấy cửa sổ từ probe #69 / thời điểm biết boot 802f358f còn sống lần cuối 23:11:49Z). T2-150 không chạy merged/gaps cho #72? ngoài số liệu đã nêu ở §2.4/§2.6 — giao T2-151.

## 3. RAM trong cửa sổ mù (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh cửa sổ mù: 2.342.132 kB = 2.287,2 MiB (T5-149 sampler, 21:05:18Z, đoạn E) = 37,23% guard 6.144 MiB.** Đây là đỉnh chung của cả hai sampler đợt 149 trong đoạn E (T9-149 đỉnh 2.219.984 kB = 35,29% lúc 21:05:37Z — cùng vùng đỉnh, cách nhau 19 s; T5 bắt được đỉnh cao hơn ~1,9 điểm phần trăm do pha lấy mẫu — khớp đối chiếu trong T9-149 LIMITS §2).
- **0 mẫu ≥ guard trong toàn cửa sổ:** T9-149 0/115 (đỉnh 35,29%) + T5-149 0/32 (đỉnh 37,23%) + đoạn F: T9-149 0/82 mẫu (đỉnh 1.675.720 kB = 26,63% guard, 21:25:05Z — mẫu đầu trên boot mới sau khi T9 khởi động lại sampler bằng tay) + boot-verify T2 491.804 kB (23:41:27Z) / 1.026.892 kB (23:45:33Z) / 1.480.624 kB (00:13:48Z). **Birefnet 0 thử** — cơ chế tự động (a) đã nối từ T9-147 nhưng 0 mẫu ≥ guard nên không kích hoạt lần nào (đúng thiết kế — lần thứ tư liên tiếp 0 lần thử).
- Đỉnh từng đoạn: E **2.287,2 MiB** (21:05:18Z, T5-149) = 37,23% guard; F **1.636,5 MiB** (21:25:05Z, T9-149) = 26,63% guard.
- Avail min trong cửa sổ: T9-149 469.816 kB = 458,8 MiB (22:22:07Z, đoạn F); T5-149 min 709.312 kB (21:21:18Z, đoạn E).
- Balloon: đoạn E tối đa **5.559.124 kB** (T9-149, 86,3% trần, 0 mẫu ghim); đoạn F tối đa **6.443.824 kB** (T9-149, ghim trần **49/82 mẫu** trong hai chuỗi 21:51:06–22:12:06Z (22 mẫu) + 22:20:07–22:46:07Z (27 mẫu) — chuỗi ghim trần MỚI từ đợt 149 theo quyết parent 149 (e), KHÔNG nối với chuỗi đợt 148). Số riêng của script ram-max (lower bound): 147 mẫu; đỉnh 2.342.132 kB (khớp đọc tay — lần này script không bỏ sót vì cả hai sampler đều dùng key `mem=`/`avail_kB=`; caveat F-141-T2-2 không tái hiện).
- Lưu ý: đỉnh cửa sổ này (37,23% guard) thấp hơn đỉnh mù #68/#69?/#70? (57,26%) và thấp hơn đỉnh mù #67 (43,30%); cửa sổ guard KHÔNG tái mở đợt này (0 mẫu ≥ guard lần thứ tư liên tiếp sau đợt 147/148/149).

## 4. Phương pháp + sai số của chính T2-150

### 4.1 Phương pháp

- Chứng nhận mù theo **luật gap** (merged 4 phạm vi: repo-1 + hidden_files + ngoài hai cây + /tmp, độ chính xác giây; floor = 1.147 s): max gap < sàn → đoạn đóng, max ẩn = 0; mỗi mốc có mtime giây + nguồn file + (với mốc ngoài cây) file đã tự tạo trong hai cây. Đuôi F' (1.220 s > sàn) KHÔNG đóng được theo luật gap → ghi là khung chết #115? thuộc mù #72? MỞ (theo khung nhiệm vụ), không dùng uptime-closure để ép đóng (uptime-closure chỉ dùng khi đoạn cần đóng mà merged gap vượt sàn — ở đây đuôi thuộc về mù sau).
- Chuẩn mới: **mọi số btime/gap dùng /proc/stat** (quyết parent 148 (b)); /proc/1 chỉ ghi kèm để đối chiếu. Đếm mù: đếm chặt (70025d3e = #114?, 802f358f = #115?, e9295700 = #116?) — cùng chuẩn với đợt 147/148/149 (quyết 146 (a)). Chứng nhận gap **DẠNG KHOẢNG** với mid dùng cho thống kê (chuẩn mới quyết parent 149 (c), tiền lệ #58/#63).
- Khung nhiệm vụ đợt 150 (phân tách mù #71?/#72?): mù #71? = [probe #68, btime #40] với các đoạn E + F'; mù #72? = [23:11:49Z last-known-alive / probe #69, probe #70] với reboot #40. T2-150 tuân khung này: chứng nhận #71? (E + F'-body) và chỉ ghi nhận #72? (khung #115?).
- Hole recheck: quét mtime toàn cây /home/hatch + /var/log trong 5 hố — 0 mốc nội bộ mới trong 4 hố (chỉ trúng chính mốc cạnh trái, bẫy float); 3 mốc mới thật trong hố sau #40 (/var/log btmp/lastlog/wtmp 23:32:25Z — ghi cho T2-151).
- RAM: đọc tay sampler log (T9-149/T5-149) + script ram-max (đối chiếu — lần này khớp đọc tay); đỉnh báo cáo lấy theo đọc tay + script (cả hai khớp 2.342.132 kB).
- **Prereg cho T2-150 (phiên MỞ đầu, trước probe):** đã dự báo (a) probe #68 stale ~10.400 s (đúng: 10.427 s); (b) KHÔNG có bước nhảy đồng hồ tại #39 (đúng — F110?/F111? đều ≈ 0, journal liên tục); (c) E và F đóng theo luật gap (đúng một nửa: E đóng, F'-body đóng, đuôi F' mở 1.220 s — prereg không dự báo được hố yên 23:11–23:32Z vì không ai chạy trong khoảng đó); (d) khung #114? thu hẹp sau merged (đúng: 327 s → 12 s; prereg đoán ~13 s từ sampler — đúng trong 1 s); (e) INSIDE 802f358f (đúng) + e9295700 NGOÀI dải FULL85 neo 70025d3e (đúng theo bản đọc chữ — nhưng xem §4.5 (b): dải đúng neo 802f358f cho INSIDE); (f) F112? đủ 3 server (đúng); (g) chốt chặn không tồn tại (đúng).

### 4.2 Sai số của chính T2-150 (danh sách đầy đủ — không giấu lỗi)

- **F-150-T2-1:** lần chạy F112? đầu tiên dùng `grep "^date:|^HTTP" | head -2` nên chỉ thấy 2 dòng HTTP (proxy CONNECT + status thật), không thấy Date — phải chạy lại chỉ grep `"^date:"`. Kết quả F112? trong LIMITS này là từ lần chạy lại. Bài học: với curl qua proxy, lọc riêng `^date:` ngay từ đầu (cùng mẫu F-149-T2-8: luôn đo F trước khi suy ra hướng bước nhảy — ở đây đã đo lại đúng trước khi kết luận).
- **F-150-T2-2:** lệnh grep kiểm tra độc lập EPERM dùng cận trên epoch SAI (1.795.134.297 = 00:24:57Z, không phải 23:44:57Z = 1.795.131.897) — trễ 40 phút. File `round150-t9/b2-spikes.log` lọt qua bộ lọc sai này; 3 hit marker trong đó đều là **chính lệnh grep kiểm tra của T2-150** (pid 44657) bị B2 watcher của T9-150 ghi lại thành spike — tự tham chiếu của thao tác kiểm tra, không phải sóng. File sinh 23:48:32Z (sau probe #69) nên vốn không nằm trong cửa sổ quét; kết luận "0 sóng thật" không đổi (sweep chính đã loại nó đúng). Bài học phụ: **lệnh grep kiểm tra của T2-150 đã gây 3 B2 spike cho T9-150** (delta_ticks 6/12/9, ~00:05Z) — T9-150 không quy 3 spike này vào workload đợt 150.
- **F-150-T2-3:** `blind71-sessions.py` v1 dùng `os.stat().st_birthtime` — None trên Linux (0 session dùng được). Đã viết lại bằng phương pháp `stat -c "%W %Y"` (mẫu blind68-sessions.py), chạy lại thành công: 299 file. Không ảnh hưởng số liệu (lỗi xảy ra trước khi ghi output nào).
- **F-150-T2-4:** `hole-recheck.py` v1 crash ở khâu in kết quả (`fromtimestamp` nhận datetime thay vì epoch) SAU khi quét xong 842.526 file (~5 phút) — hits đã thu thập bị mất theo crash. Đã sửa và chạy lại toàn bộ (~3 phút). Không ảnh hưởng số liệu (kết quả cuối từ lần chạy lại đầy đủ).
- **F-150-T2-5:** hòa giải /proc/1 cho boot mới e9295700 lệch **0,91 s** (PID 1 start wall 23:32:24,07Z vs /proc/1 mtime 23:32:24,98Z) — lớn nhất từ trước (0,39 s / 0,57 s đợt 149), vẫn trong sai số làm tròn ~1 s; không có dị thường nào khác đi kèm (journal entry đầu 23:32:25Z khớp /proc/1 +0 s; uptime -s khớp /proc/stat). Ghi nhận, không điều tra.
- **F-150-T2-6:** `grep -c "=== probe end"` cuối lệnh kiểm log trả 0 → exit 1 cho cả lệnh exec (cùng mẫu F-149-T2-6); bản thân probe #69 thành công (exit 0, ok=2 fail=0). Không phải lỗi probe.

### 4.3 Câu hỏi cho parent (chỉ câu hỏi MỚI của đợt 150 — các câu hỏi cũ đã quyết không nhắc lại)

(a) **Mù #71? ĐÓNG HOÀN TOÀN? Chuỗi đóng hoàn toàn 6 → 7?** E đóng theo luật gap (max 127 s), F'-body đóng theo luật gap (max 1.014 s); đuôi F' (1.220 s) là khung #115? thuộc mù #72? MỞ theo khung nhiệm vụ. Gap #39 chứng nhận **DẠNG KHOẢNG [4.996, 5.000] s (giữa 4.998 s)** → **CERT 71 / FULL 86** (mids dùng cho thống kê; mid = đúng số danh nghĩa). Nếu parent đồng ý: chuỗi mù đóng hoàn toàn 6 → **7**; CERT 71 / FULL 86 là số chính thức đợt 150.
(b) **Chuỗi INSIDE cho e9295700 — parent phán bên nào?** Hai số đều đã đo bằng code, mâu thuẫn nhau chỉ do neo dải:
    - Bản đọc chữ của nhiệm vụ: e9295700 NGOÀI dải FULL85 neo 70025d3e [20:26:42Z, 22:25:42Z] (sau p90 3.987 s) → chuỗi 1 → **0**.
    - Chuẩn đứng (neo tiền nhiệm, dùng từ đợt 144 cho mọi boot): e9295700 INSIDE dải FULL86 neo 802f358f [21:50:02Z, 23:48:50Z] (cách p90 983 s), INSIDE FULL85 neo 802f358f [21:50:00Z, 23:49:00Z], INSIDE FULL80 neo 802f358f [21:51:29Z, 23:48:11Z] → chuỗi 1 → **2**.
    - Dải [20:26:42Z, 22:25:42Z] là dải của **802f358f** (neo tiền nhiệm 70025d3e) — dùng nó cho e9295700 là neo sai hai nấc. T2-150 đề xuất **chuỗi = 2** theo chuẩn đứng; parent xác nhận hay giữ bản đọc chữ (chuỗi = 0)? (Chuỗi 0 → 1 của 802f358f thì cả hai cách đều đồng ý — đã chứng nhận ở §2.5.)
(c) **Khung chết #114? chốt bản nào?** Danh nghĩa (21:23:39Z, 21:23:51Z] = **12 s**; bản giờ thực ∈ **[10, 14] s** (e3, e4 ∈ [−1, +1] s). T2-150 đề xuất ghi sổ 12 s danh nghĩa (như tiền lệ các khung trước — đều tính theo timestamp) kèm khoảng giờ thực; parent chốt?
(d) **F112? ≈ 0/+1 s, ĐỦ 3 SERVER** (cloudflare hết 403) — ghi nhận (không có câu hỏi).
(e) **/proc/1 lệch 0,91 s (F-150-T2-5)** — ghi nhận, không điều tra (trong sai số làm tròn).
(f) **Mù #72? MỞ (reboot #40, 23:32:09Z, boot e9295700) — giao T2-151 chứng nhận** (cửa sổ từ 23:11:49Z last-known-alive / probe #69 23:44:57Z tới probe #70). Khung chết danh nghĩa #115? (23:11:49Z, 23:32:09Z] = 1.220 s; boot 802f358f sống 7.698 s danh nghĩa. Hố sau #40 đã thu hẹp nhờ /var/log (23:32:25Z, btmp/lastlog/wtmp). Tạm tính: btime e9295700 INSIDE dải FULL86 neo 802f358f → chuỗi INSIDE 1 → 2 (tạm tính, chờ §4.5 (b) + chứng nhận #72?).
(g) **WFS #56 chênh 0 (lần thứ 56); RAM đỉnh 37,23% guard, 0 mẫu ≥ guard; birefnet 0 thử lần thứ tư liên tiếp** — ghi nhận (không có câu hỏi).
(h) **Đếm FULL86/CERT71 — T10 kiểm lại** (như mọi đợt: T10 xác nhận đếm cuối bằng dedup toàn cục trước khi đóng sổ đợt 150).

### 4.4 Ghi chú cho T10-150 (đóng sổ đợt 150)

- Đợt 150 dùng **chuẩn btime /proc/stat** cho mọi số (quyết parent 148 (b)) — T10 kiểm lại đếm cuối bằng dedup toàn cục (không cộng round-unique vào lũy kế — bài học AGENTS.md đợt 126–127).
- **Đưa `npm test` vào suite đóng sổ chuẩn từ đợt 149** (quyết parent 148 (k) — bug pixelate đã giao T0-149 sửa ưu tiên cao; T0-150 đo hiệu năng geq).
- **O8 chạy sau cờ T4** (quyết parent 148 (c) — điều kiện chấp nhận trích dẫn đợt 148; từ đợt 149 trở đi tuân (j) — quyết parent 149 (f): trích là "harness sau khi T4 đóng cờ").
- **Chuẩn nguồn btime /proc/stat** đã áp dụng trong LIMITS này; các số /proc/1 chỉ còn để đối chiếu (xem §2.5 RESTATE đợt 149).
- **Mốc uptime 20:10:28Z (e2 > 595 s) BỊ LOẠI khỏi cận** — T10 không dùng làm cận cho gap #38 (xem §2.2 đợt 149 + quyết parent 149 (b)(i)).
- **Câu hỏi INSIDE §4.5 (b) cần parent phán trước khi T10 chốt chuỗi INSIDE trong aggregate** — T10 ghi cả hai số (chuỗi 2 theo chuẩn đứng / chuỗi 0 theo bản đọc chữ) kèm chú thích chờ quyết, đừng tự chọn một bên.

## 5. File + stage

**File duy nhất của batch (LIMITS này):**
- `docs/PHASE9_ROUND150_T2_EPERM_LIMITS.md` — (kích thước/md5 xem cờ round150-t2.done; file > 37.768 byte → push cần ENABLE_PRIVSEP=0)

**Stage (không push):** `~/workspace/repo-1-push/paths-loop/phase9-round150-t2-eperm.txt` — 1 entry, NUL-delimited, text-only, 0 binary (verify bằng `od -c`).

**Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round150-t2.done` — 1 dòng tóm tắt + kích thước/md5 LIMITS.

**File làm việc (không stage, chỉ để đối chiếu):** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round150-t2/` — prereg-t2.md, boot-verify.txt, status1.txt, once.txt, status2.txt, f112.txt, blind71-investigate.py/.log, blind71-merged.py/.log, blind71-sessions.py/.log, blind71-fifthscope.py/.log, blind71-gaps.py/.txt, hole-recheck.py/.txt, eperm-sweep71.py + eperm-sweep-run.log, ram-max71.py + ram-max.txt, scan-wfs.sh + scan-wfs-run.log + scan-meta.txt + files-newstd.bin/files-r7b.bin/files-copies.txt + wfs-newstd.txt/wfs-r7b.txt/wfs-copies.txt, blind71-repo-1.txt, blind71-hidden_files.txt, blind71-outside.txt, blind71-tmp.txt, sessions-all.txt.

# PHASE9 ROUND146 T2 — EPERM probe #65 + mù #65 ĐÓNG HOÀN TOÀN (A đóng theo gap, B đóng bằng uptime) + khung chết #108? ứng viên 599 s + chuỗi INSIDE lên 5 — LIMITS

## 0. Headline

- **Probe EPERM #65: ok=2 fail=0, boot 98a7c93f, 11:39:18Z.** Probe trước (#64) đã chết/stale 2h57'45" (n=64, ts 08:41:32Z, boot e146ca67). Log `eperm-probe-v2.log` 184 → **187 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #65 ĐÓNG HOÀN TOÀN — chuỗi mù đóng hoàn toàn lên 1 (sau khi về 0 ở #64):** A **ĐÓNG** (merged gap lớn nhất 599 s < sàn 1.147 s, max 0 ẩn), B **ĐÓNG BẰNG UPTIME TRỰC TIẾP** (boot 98a7c93f sống liên tục từ btime 09:54:03Z tới probe #65; boot_id xác minh giống hệt 4 lần độc lập: T7 09:55Z, T9, T10 11:16–11:26Z, T2 11:37–11:39Z; journal đúng 1 boot). **CAVEAT LỚN — đọc §2.4/§2.5 trước khi dùng số CERT:** merged gap đoạn B là **1.295 s > sàn** (floor 1 ẩn) — lần đầu trong chuỗi T2-144/145/146 đoạn boot sống có merged gap vượt sàn (đoạn C mù #64 chỉ 453 s). Đoạn B KHÔNG đóng theo luật gap; closure của nó dựa HOÀN TOÀN vào lập luận uptime/boot_id. **Chứng nhận gap 7.067 s (e146ca67→98a7c93f) là CÓ ĐIỀU KIỆN — chờ parent xác nhận uptime đóng được đoạn B.** Nếu parent không xác nhận: gap vẫn SPAN, CERT/FULL giữ 64/79. Nếu parent xác nhận: gap = [7.057, 7.077] s, giữa 7.067 s → **CERT 65 / FULL 80** (số có điều kiện ở §2.5).
- **Khung chết (ứng viên merged): #108? (boot e146ca67): (09:44:04Z, 09:54:03Z] 599 s** — RỘNG (so với 38 s của #107?); recheck toàn cây 0 mốc nội bộ mới; 10 mẫu sampler nội dung trong hố chỉ là hỗ trợ, KHÔNG phải closer. Khung này KHÔNG thu hẹp khoảng im lặng (09:45:34Z, 09:54:43Z] 549 s của T7 (hai loại bằng chứng khác nhau — xem §2.4).
- **Chuỗi INSIDE lên 5 (chính thức, đếm chặt):** 98a7c93f INSIDE dải FULL79 #109? [08:23:45Z, 10:20:46Z] (btime thực 09:54:03Z). Dải #110? (FULL79, neo 09:54:03Z): [10:21:32Z, 12:18:33Z] (có điều kiện FULL80: [10:21:41Z, 12:18:23Z]).
- **F107? ≈ 0 s** (example 0, google 0; cloudflare 403 cả GET lẫn HEAD — chỉ còn 2 server đo được; F106? là +1/+1/+1).
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~191,5 h trước probe #65). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong mù #65: 3.863.484 kB = 3.772,9 MiB (T9 sampler vòng 1, 08:58:04Z, đoạn A) = 61,41% guard 6.144 MiB**; đoạn B chỉ tối đa 1.952,7 MiB (31,78% guard, 09:56:21Z). 0 mẫu ≥ guard; birefnet KHÔNG thử (không thuộc brief; quyết parent giữ nguyên quy trình + guard 6.144 MiB).
- **WFS #52: chênh 0 — lần thứ 52 liên tiếp.** NEWSTD 967 dòng / 274 file; R7b 992 / 291; copies 25 / 17. `preview.tsx` 530e10a7, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — không đổi.
- **KHÔNG có reboot mới trong phiên T2-146** (boot lúc đóng vẫn 98a7c93f, kiểm 11:52:40Z) → **không mở mù #66**.
- **Quyết parent đợt 145 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** (CERT 64/FULL 79 xác nhận; khung chết #107? 38 s + #106? thu hẹp 9 s chốt; chuỗi INSIDE 4; gap 7.050 s + 7.381 s để SPAN; reboot #33 xác nhận, 98a7c93f = #109?; quyết (j) cập nhật — apt history.log cũng reset) — không để mở chờ hòa giải nữa. Chỉ câu hỏi MỚI phát sinh ở đợt 146 ghi ở §4.5.

## 1. Checklist probe EPERM #65 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Xác minh boot lần 1 | 11:38:40Z | 98a7c93f-83d3-40e5-8043-ee6dda19c5f1, btime 1795082043 = 09:54:03Z, `uptime -s` 2026-11-19 09:54:03, journal 1 boot, entry đầu 09:54:19Z = btime +16 s |
| Xác minh boot lần 2 | 11:39:17Z | Cùng boot_id/btime; MemAvailable 1.318.040 kB (1.287 MiB); free -m avail 1.288 MB |
| `status` | 11:39:18Z | **DEAD/STALE**, heartbeat n=64, ts 2026-11-19T08:41:32Z, boot e146ca67, tuổi **10.665 s (2h57'45")**, exit 1 (đo trực tiếp, không tee — đã sửa lớp F-145-T2-6) |
| `once` | 11:39:18Z | **Probe #65, boot=98a7c93f, ok=2 fail=0**, exit 0; dòng log `boot changed e146ca67 -> 98a7c93f (uptime since 2026-11-19 09:54:03)` |
| `status` lại | 11:39:19Z | **ALIVE**, tuổi 1 s, n=65, exit 0 |
| Log probe | 11:39:18Z | `eperm-probe-v2.log` 184 → **187 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=65, ts 2026-11-19T11:39:18Z, boot 98a7c93f; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại trong lúc tìm script cho pid=24783, ts=11:39:18Z, boot=98a7c93f, n=65 — khớp |
| Xác minh boot lúc đóng | 11:52:40Z | **KHÔNG đổi boot — 98a7c93f**, btime 09:54:03Z; không có reboot mới trong phiên → không mở mù #66 |
| dpkg.log boot 98a7c93f | 11:39:18Z | **1.545 dòng** (gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2, 09:58:17Z — replay xong ~4 phút sau btime), mtime 09:58:17Z. Bracket chính thức thuộc T5-146; đây là đọc độc lập để đối chiếu |
| F107? | 11:39:23–26Z | example.com Date 0 s, google.com 0 s, cloudflare.com **403 ERROR (GET + HEAD đều 403, thử lại vẫn 403)** → **F107? ≈ 0 s** (chỉ 2 server đo được — xem F-146-T2-2) |

## 2. Điều tra mù #65

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Mù #65: 08:41:32Z 19/11 → 11:39:18Z 19/11 = 10.666 s (2h57'46")** — từ heartbeat cuối probe #64 tới probe #65.
- Một reboot bên trong (#33):

| Đoạn | Boot | Btime | Dài | Chết lúc |
|---|---|---|---|---|
| A | e146ca67 (#108?) | 07:56:16Z 19/11 (1795074976) | 4.351 s (từ probe #64) | 09:54:03Z |
| B | 98a7c93f (#109?) | 09:54:03Z 19/11 (1795082043) | 6.315 s (tới probe #65) | (còn sống — probe #65) |

- Gap danh nghĩa (btime − btime, tính bằng epoch): e146ca67→98a7c93f = **7.067 s** (1h57'47").
- Nguồn quan sát mốc cuối mù: LIMITS gộp 145 mtime 11:31:08Z; T10-145 count-final 11:28:24Z; round145-t10.done 11:29:22Z; GAP_ANALYSIS 11:29:27Z; build-loop-log 11:31:17Z; marker round-in-progress.md không tồn tại lúc T2-146 mở (đã xóa khi T10-145 đóng — không có chốt chặn). Tất cả các mốc này nằm trong đoạn B.

### 2.2 Đánh số + đồng hồ — đã có chuẩn parent (không còn xung đột)

- **Quyết parent đợt 145 (§12.3, ghi trong MEMORY.md): ĐẾM CHẶT làm chuẩn** — b47f7932 = #103?, 9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?, cc222c8a = #107?, e146ca67 = #108?, **98a7c93f = #109?**. LIMITS này dùng đếm chặt xuyên suốt.
- **CERT 64 / FULL 79 ĐÃ XÁC NHẬN** (quyết (b) đợt 145 — vẫn là chuẩn cho tới khi parent quyết về gap 7.067 s; xem §2.5). **Khung chết ĐÃ XÁC NHẬN: #107? (07:55:38Z, 07:56:16Z] 38 s; #106? thu hẹp (05:53:06Z, 05:53:15Z] 9 s (quyết (d) đợt 145).** Full boot_id b47f7932 **ĐỂ MỞ**.
- **Parent BÁC đề xuất continuity dòng-log làm closer cho mù #62** (quyết 143 §12.2) **và giữ nguyên phương pháp merged gap rule cho gap 7.050 s + 7.381 s** (quyết (f) đợt 145) — áp dụng nhất quán cho mù #65: sampler content + session-spanning chỉ là **hỗ trợ, KHÔNG phải closer** (§2.4/§2.6). Riêng đoạn B: closer là uptime/boot_id trực tiếp (không phải continuity) — xem §2.4, trình parent xác nhận.
- **Đồng hồ:** F107? ≈ 0 s (§1). F106? ≈ −1 s (đợt 145). F105? ≈ −0 s đến −1 s (đợt 144). F104? ≈ −0 s đến −1 s (đợt 143). F103? chưa đo (boot đã chết). Dải offset started_at ~30–50 s giữ vững (chuỗi offset boot đúng: 34/37/32/35/44/41/40 s — T7-146 kiểm tiếp). Btime các gap lấy theo RTC, không bị drift guest ảnh hưởng.
- **Nghịch lý đồng hồ đợt 145 (6 s) tái hiện đúng dạng ở đợt này:** mốc cuối đoạn A theo đồng-hồ-cũ (sampler T9 vòng 1, 09:54:09Z) MUỘN HƠN btime boot mới 09:54:03Z 6 s — thứ tự đảo; khung chết chốt theo btime (nguồn kernel), mốc 09:54:09Z nằm trong đoạn B, không thu hẹp khung (§2.4).

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác float:**
- repo-1: **20 file**; hidden_files: **457 file**. Tổng **470 mốc float khác nhau / 255 mốc giây khác nhau** (hai cây gộp).
- Đoạn A: **279 mốc gộp**, gap lớn nhất **1.686 s** (09:25:56→09:54:03 — hố đuôi). Đoạn B: **191 mốc gộp**, gap lớn nhất **3.021 s** (09:55:21→10:45:42 — hố append-trong-file, xem §2.4).

**Sessions (`~/workspace/agents/`, 297 exec-log, 297 file có birth/mtime dùng được — tăng 2 so với đợt 145):**
- Bắc cầu: A-lo **3** session, A-hi **0** (không cần — luật gap đóng A), B-lo **3**, B-hi **1** (proc_97f967d63aa9 birth 11:18:51, mtime 11:20:49).
- Chạm đoạn: A **15**, A-tail **1** (proc_e6164f5da6a9 birth=mtime 09:35:24), B **18**, B-tail **10** session.
- Nhân chứng nhảy (jump witness): **0 tại 98a7c93f** (|X| < 1.119 s; session mtime cuối trước 09:35:24; birth đầu sau 09:55:37).
- Nhắc boot trong exec-log trong mù: e146ca67 **9**, 98a7c93f **10**.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **98 file** trong mù #65 (58 mốc giây). /tmp: **681 file — tất cả trong đoạn B** (34 mốc giây; tmpfs bị xóa bởi #33, như đợt 144/145). Goals ngoài hidden_files: **0 file** trong mù #65. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **1 file** (11:33:27Z, đoạn B — memory/2026-11-19.md).
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: A-tail **14 / 0 / 0 / 0** (exec-log 09:35:24 + proactivity 09:41:56 ×6 + 09:43:12 ×5 + 09:44:04 ×2); B-tail **13 / 56 / 10 / 130** (exec-log 11:39:17, paths-loop closing 11:28:20, T10 suite/O8 11:23–11:26, GAP 11:29:27, aggregate 11:31:08, build-loop-log 11:31:17, round146 threads 11:37–11:39).

**Ranh giới:** 98a7c93f: 0 file trong [btime−10 s, btime], 2 file trong (btime, +10 s] (ram-sampler-long.log + .out, cùng 09:54:09Z = btime +6 s — mẫu cuối sampler vòng 1 của T9 theo đồng-hồ-cũ).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**321 mốc giây khác nhau** (repo-1 16, hidden_files 239, ngoài cây 58, /tmp 34). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| A | 182 | **599 s** (09:44:04→09:54:03) | 392 s / 390 s | 08:41:37 (5 s) | 09:44:04 (599 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| B | 138 | **1.295 s** (10:20:22→10:41:57) | 1.111 s / 1.020 s | 09:54:09 (6 s) | 11:39:17 (1 s) | **ĐÓNG — uptime trực tiếp** (luật gap một mình cho max 1 ẩn) |

**Đoạn A — ĐÓNG (max 0 ẩn).** Gap lớn nhất merged 599 s < sàn 1.147 s; floor(599/1147)=0. Mốc đầu merged 08:41:37Z (head 5 s); mốc cuối 09:44:04Z (tail 599 s — hai file proactivity sources.md + geofences.md). 3 session bắc cầu A-lo; 0 session bắc cầu A-hi (không cần — luật gap đã đóng). 1 session chạm A-tail (09:35:24).

**Đoạn B — ĐÓNG BẰNG UPTIME TRỰC TIẾP (không đóng theo luật gap).** Gap lớn nhất merged 1.295 s > sàn 1.147 s; floor(1295/1147)=1 — luật gap một mình để tối đa 1 ẩn. Hố 10:20:22→10:41:57: sau 10:20Z chỉ còn tiến trình append chạy (sampler T9 vòng 2, waiter T10, kiểm T7) — mtime của chúng dồn về cuối hố (10:45:49, 11:10:37); cùng mẫu hố append-trong-file như đoạn B mù #64 (hố 3.013 s) và đoạn C mù #62. Hỗ trợ (KHÔNG phải closer): 3 session bắc cầu B-lo (proc_9c30801fc161 birth 09:55:37 mtime 11:10:37; proc_932d48e27f77 birth 09:55:59 mtime 10:45:49; proc_9a9e8a6d9b52 birth 09:57:23 mtime 10:20:22), 1 session bắc cầu B-hi, 1 session sinh trong hố (proc_0e98109c11a7 birth 10:22:36 mtime 10:45:35). **Closer là uptime/boot_id trực tiếp:** boot 98a7c93f, btime 09:54:03Z, boot_id giống hệt qua 4 lần xác minh độc lập (T7 09:55Z ba nguồn; T9 uptime+btime+boot_id+who-b+journal; T10 11:16Z + 11:23Z + 11:26Z; T2-146 11:37:09Z + 11:38:40Z + 11:39:17Z + 11:52:40Z); journalctl đúng 1 boot; `uptime -s` = 09:54:03Z đọc tươi lúc probe #65. Một reboot ẩn trong đoạn B sẽ đổi boot_id (UUID 128-bit ngẫu nhiên mỗi boot) và btime — cả hai đều không đổi từ 09:55Z tới probe #65. **Đây là lần đầu trong chuỗi T2-144/145/146 đoạn boot sống có merged gap vượt sàn** (đoạn C mù #64: 453 s < sàn) — closure của đoạn B dựa hoàn toàn vào lập luận uptime, nên chứng nhận gap 7.067 s trình parent xác nhận (§2.5, §4.5(1)). T2 KHÔNG tự chốt CERT 65/80.

**Khung chết (ứng viên merged — chờ parent xác nhận làm chuẩn):**
- **#108? (boot e146ca67): (09:44:04Z, 09:54:03Z] = 599 s.** Mốc cuối đoạn A merged. **RỘNG** — không thu hẹp khoảng im lặng (09:45:34Z, 09:54:43Z] 549 s của T7: hai khung là hai loại bằng chứng khác nhau (merged = mốc mtime file; T7 = thời điểm kiểm tra, 09:45:34Z không phải mốc mtime file nào trong merged). Mốc 09:54:09Z (sampler T9, đồng-hồ-cũ) nằm SAU btime nên không tính theo quy ước strict-<; nếu tính mốc này thì khung về −6 s (vô nghĩa) — T2 KHÔNG đề xuất (quy ước đã đứng từ các đợt trước).

### 2.5 Phân phối gap — CERT/FULL CÓ ĐIỀU KIỆN

- **Gap MỚI CHỨNG NHẬN (CÓ ĐIỀU KIỆN): e146ca67→98a7c93f = [7.057, 7.077] s, giữa 7.067 s** — chứng nhận NẾU parent xác nhận uptime đóng đoạn B. → **CERT 65 / FULL 80 (có điều kiện)**. Nếu parent không xác nhận: gap VẪN SPAN, CERT giữ 64 / FULL giữ 79.
- **CERT64 (không đổi, đợt 145):** n=64, mean **1h34'20"**, median **1h49'58"**, p10 **0h26'45"**, p90 **2h15'26"**, sd **0h44'58"**, min **0h00'55"**, max **3h14'08"**. **FULL79 (không đổi):** n=79, mean **1h40'27"**, median **1h53'00"**, p10 **0h27'29"**, p90 **2h24'30"**, sd **0h55'04"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **41**, <60' = **18**, >180' = **6**, >240' = **2**. Script gaps tái tạo chính xác số T2-145 (assert trong script: stats tính lại == stats tái dùng).
- **CERT65 (CÓ ĐIỀU KIỆN):** n=65, mean **1h34'42"**, median **1h50'39"**, p10 **0h26'54"**, p90 **2h15'08"**, sd **0h44'42"**, min **0h00'55"**, max **3h14'08"**. **FULL80 (CÓ ĐIỀU KIỆN):** n=80, mean **1h40'40"**, median **1h53'38"**, p10 **0h27'38"**, p90 **2h24'21"**, sd **0h54'45"**, min **0h00'55"**, max **5h43'18"**.
- **SPAN (không chứng nhận):** 691a7403→cc222c8a = **7.050 s**; cc222c8a→e146ca67 = **7.381 s** (quyết 145 (f): để SPAN, không mở đường mới); b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**. Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL (cộng sẽ đếm trùng).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Không đề xuất đường chứng nhận mới cho đoạn B ngoài uptime (session-spanning/sampler content là cùng họ continuity — chỉ hỗ trợ, không phải closer).
- Dải chứng nhận không đổi: [0h00'55", 3h14'08"] (có điều kiện CERT65 giữ nguyên dải).
- **Dải (band) cho boot mới — XÁC NHẬN CHÍNH THỨC:**
  - 98a7c93f làm #109? (đếm chặt, chuẩn), dải FULL79 neo #108? 07:56:16Z: **[08:23:45Z, 10:20:46Z]** — btime thực 09:54:03Z **INSIDE** (chuỗi 5).
  - **Chuỗi INSIDE = 5 theo đếm chặt (chuẩn parent từ đợt 144/145) — tính bằng code với float p10/p90 chính xác:** b47f7932 INSIDE (1) → 9afdaa89 OUTSIDE (đứt, về 0) → 70a5b0fc INSIDE (1) → 691a7403 INSIDE (2) → cc222c8a INSIDE (3) → e146ca67 INSIDE (4) → 98a7c93f INSIDE (5).
  - Boot tiếp theo sau 98a7c93f (#110? chặt), dải FULL79 neo 09:54:03Z: **[10:21:32Z, 12:18:33Z]** (có điều kiện FULL80: [10:21:41Z, 12:18:23Z]).
- **Tốc độ reboot:** **109 reboot / 205,60 h = 1 lần / 113,2 phút** (108 + sự kiện #33; từ boot #1 2026-11-10T20:18:10Z tới 98a7c93f). Chuỗi lũy kế tới **124 / 205,60 h = 1 lần / 99,5 phút** (+4 mù #29/30/31 →113; +3 mù #53B →116; +2 mù #55B conv →118; +1 mù #56A conv →119; +0 #57–#60, mù #61A →119; +1 mù #61B →120; +0 mù #61C, mù #62A, mù #62B rule-max-0 →120; +2 mù #62C →122; +0 mù #63A, mù #63B →122; +0 mù #64A, mù #64C →122; +2 mù #64B →124; +0 mù #65A, mù #65B (đóng bằng uptime) →124). Tổng dung lượng: 55B max 3 → **125 (1 lần / 98,7 phút)**; 56A max 3 → **127 (1 lần / 97,1 phút)**. Biến thể nếu parent không xác nhận uptime đóng đoạn B: mù #65B gap-rule max 1 → **125 (1 lần / 98,7 phút)**; gap 7.067 s vẫn SPAN.

### 2.6 Recheck hố đoạn A (09:44:04Z, 09:54:03Z] — điều kiện duy nhất còn lại cho gap SPAN

- Quét mtime toàn cây `/home/hatch` (bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) cho mốc trong hố: **chỉ có chính mốc cạnh trái 09:44:04.xxx** (2 file proactivity sources.md + geofences.md — cùng giây với endpoint, chỉ lệch phần thập phân; KHÔNG phải mốc mới). **0 mốc nội bộ MỚI.**
- `/var/log`: **0 dòng dpkg.log** trong cửa sổ hố; dpkg.log / apt history.log / term.log đều mtime **09:58:17Z** (replay boot mới, đoạn B). Replay boot 98a7c93f đã xong từ ~09:58Z — không có hoạt động apt nào trong hố.
- Hỗ trợ trong hố (KHÔNG phải closer): sampler T9 vòng 1 có **10 mẫu nội dung trong hố** (mỗi ~60 s, 09:44:09Z→09:53:09Z, balloon đóng băng 6.443.824 kB; mẫu cuối 09:54:09Z theo đồng-hồ-cũ).
- **Kết luận: đoạn A ĐÓNG theo luật gap; khung chết #108? ứng viên (09:44:04Z, 09:54:03Z] 599 s đứng nguyên sau recheck.** Không còn đường thu hẹp khung nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

### 2.8 Quét WFS #52 (11:51:15–11:51:37Z — chạy trên boot 98a7c93f, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 967 dòng / 274 file** (phạm vi 3.217 file). **R7b: 992 / 291** (phạm vi 12.610 file). **Copies: 25 / 17** (không đổi). Đối chiếu 967+25=992=R7b, **chênh 0 — lần thứ 52 liên tiếp**.
- Delta so với #51 (965/272): **+2 dòng / +2 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND145_T5_INFRA_LIMITS.md:1` + `docs/PHASE9_ROUND146_T5_INFRA_LIMITS.md:1` — cả hai file hoàn thành sau quét #51 (T5-145 đóng 09:25Z; T5-146 đóng ~11:38Z) nên lúc #51 chúng chưa tồn tại/đang ghi dở. Cùng bẫy "đếm dở" như F-144-T2-7.
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7**, `apps/web/src/media.ts` **2c384ed1**, `apps/web/vite.config.ts` **ee80d093** — không đổi.

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** trong src. Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — md5 **giống hệt** bản src (112891d5) — là artifact build, không phải helper mới.

### 2.10 Quét EPERM trong mù #65

- **83 file *.log** có mtime trong mù #65 (0 repo-1, 83 hidden_files). Đếm: "sóng EPERM vẫn bật" **0**, "CẢNH BÁO" **0**, "Operation not permitted" **0**, "sóng EPERM đã tắt" **5** — tất cả là false positive đã biết của launcher O8 (T8 `o8-145t8.log` ×3 mốc 08:42:32/08:43:51/08:45:05Z + T10 `t10-o8.log` ×2 mốc 11:24:00/11:25:05Z). Mở rộng raw: 12 lần / 12 unique (5 launcher + 6 dòng test-pass `hasEperm` + 1 dòng `grep -c writeFileSync` trong log). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~191,5 h** trước probe #65). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-146 — KHÔNG CÓ

- Boot lúc mở phiên (11:37Z) và lúc đóng (11:52:40Z) đều là **98a7c93f, btime 09:54:03Z**. Không có reboot mới trong phiên → **không mở mù #66**.
- **dmesg KHÔNG đọc được trong phiên này** (`dmesg: read kernel buffer failed: Operation not permitted`). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

## 3. RAM trong mù #65 (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh mù #65: 3.863.484 kB = 3.772,9 MiB (T9 sampler vòng 1, 08:58:04Z, đoạn A) = 61,41% guard 6.144 MiB**, thiếu ~2.371,1 MiB. Dòng sampler: `2026-11-19T08:58:04Z 3863484 3772.9 3007404 764596 0.51` (balloon lúc đó 3.007.404 kB — chưa đóng băng). Đây cũng là đỉnh cửa sổ đợt 145 của T9-145 (nằm trong đoạn A mù #65).
- Đỉnh từng đoạn: A **3.772,9 MiB** (08:58:04Z) = 61,41% guard; B **1.952,7 MiB** (09:56:21Z, sampler vòng 2 ngay sau reboot) = 31,78% guard.
- Balloon đóng băng 6.443.824 kB: **58 mẫu riêng biệt** trong mù #65 (116 dòng trên 2 file .log + .out trùng nhau) — đợt thứ chín liên tiếp balloon đóng băng.
- **0 mẫu ≥ guard; birefnet KHÔNG thử** (không thuộc brief; quyết parent — giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Số riêng của script ram-max (lower bound): 125 mẫu; A 2.857 MB (T4 poll 08:49:17Z), B 1.396 MB (11:39:12Z).
- Lưu ý: đỉnh mù #65 (61,41% guard) cao hơn mù #64 (46,84%) và mù #62 (48,70%) — cao nhất kể từ đợt 138 theo T9-145; vẫn cách guard hơn một phần ba.
- **Headroom:** theo dõi theo quyết parent (chỉ theo dõi, không hành động); số đo mới thuộc T9-146.

## 4. Ghi chú phương pháp + sai số của chính T2-146 + đối chiếu prereg

### 4.1 Danh sách sai số F-146-T2-n

- **F-146-T2-1 — Prereg viết SAU boot-verify 1 (11:38:40Z), nhưng TRƯỚC probe #65.** Boot-verify 1 chạy trước khi viết prereg; prereg viết trước status/once (11:39:18Z) nên mọi dự báo probe chưa bị ảnh hưởng. Ghi rõ để đợt sau đối chiếu đúng (tốt hơn F-145-T2-3 khi prereg viết sau probe).
- **F-146-T2-2 — F107? chỉ còn 2 server đo được.** Cloudflare 403 cả GET lẫn HEAD (thử lại vẫn 403) — F107? ≈ 0 s dựa trên example + google (cả hai 0). Kém chắc chắn hơn F106? (cả ba +1).
- **F-146-T2-3 — Hole-recheck ghi 2 "HOLE-MARK" tại 09:44:04.xxx.** Hai file này là chính mốc cạnh trái (cùng giây 09:44:04 với endpoint, chỉ lệch phần thập phân) — so sánh float nghiêm ngặt của script recheck gắn cờ nhầm. Không phải mốc mới; kết quả merged (độ chính xác giây) không đổi: mốc cuối đoạn A vẫn 09:44:04Z.
- **F-146-T2-4 — Investigate ghi head đoạn A = 1 s trong khi mốc đầu 08:41:32 = đúng B0.** Mốc float 08:41:32.xxx (log probe #64) làm tròn hiển thị lệch 1 s; merged (độ chính xác giây) ghi head đúng 5 s (mốc đầu 08:41:37Z). Chỉ hiển thị, không đổi verdict.
- **F-146-T2-5 — Sessions scan chạy 403 s tường (6'43").** Scan `find` + `stat` toàn `~/workspace/agents` + đọc nội dung exec-log chậm khi nhiều luồng đợt 146 chạy song song; lệnh bị background và phải poll. Không ảnh hưởng kết quả (mọi số đếm lấy từ log file đã ghi).

### 4.2 Đối chiếu prereg — thực tế

| Dự báo prereg (viết trước probe, sau boot-verify 1) | Thực tế | Verdict |
|---|---|---|
| Probe #65 ok=2 fail=0, boot 98a7c93f, log +3 | Đúng y hệt (§1) | ✓ |
| Boot 98a7c93f, btime 09:54:03Z | Đúng (§1, 2 lần xác minh + lúc đóng) | ✓ |
| Đoạn A đóng theo luật gap | Đóng — merged gap max 599 s (F-146-T2-3 không ảnh hưởng) | ✓ |
| Đoạn B đóng theo gap+uptime | **Đóng bằng uptime — NHƯNG merged gap 1.295 s > sàn** (gap rule một mình cho max 1 ẩn); closure dựa hoàn toàn vào uptime | ~ (caveat) |
| Gap 7.067 s → [7.057, 7.077] → CERT 65 / FULL 80 | Số danh nghĩa đúng 7.067 s, nhưng **CHỨNG NHẬN CÓ ĐIỀU KIỆN** — chờ parent xác nhận uptime đóng đoạn B | ~ (điều kiện) |
| Dải #109? FULL79 [08:23:45Z, 10:20:46Z] — 98a7c93f INSIDE | Đúng chính xác bằng float (script tính [08:23:45Z, 10:20:46Z]) → chuỗi 5 | ✓ |
| Khung chết e146ca67: merged xác nhận hay thu hẹp | Ứng viên merged **(09:44:04Z, 09:54:03Z] 599 s** — rộng; không thu hẹp khoảng im lặng 549 s của T7 (hai loại bằng chứng khác nhau) | ~ (mới) |
| EPERM 0 sóng | Đúng (§2.10) | ✓ |
| WFS giải thích bằng diff, không đoán trước | +2/+2, giải thích đầy đủ (§2.8) | ✓ |
| RAM đỉnh mù #65 ≤ ~63,8% guard | Đúng: 61,41% | ✓ |
| dpkg: đọc trước, không dự báo hình dạng | Sống 1.545 dòng (gói cuối 09:58:17Z) | ✓ (thận trọng đúng) |
| F107? ≈ 0 s | 0 s, example + google 0 (cloudflare 403 — F-146-T2-2) | ✓ |

### 4.3 Phương pháp (ghi lại để đợt sau dùng)

- Merged 4 phạm vi: repo-1 + hidden_files + ngoài cây + /tmp, độ chính xác giây; hai cây độ chính xác float để đối chiếu; sessions (`~/workspace/agents/` exec-logs, birth/mtime) để bắc cầu + nhân chứng nhảy; phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats). Đừng bỏ sót phạm vi (F-136-T2-8).
- Gap chứng nhận = [mid−10 s, mid+10 s] khi đoạn trước đóng VÀ đoạn sau đóng; SPAN khi đoạn mở/không chứng nhận được. Luật gap: floor(gap_max/1.147 s) = số ẩn tối đa.
- Bằng chứng nội dung (timestamp trong nội dung file, sampler continuity, session-spanning) là **hỗ trợ, không phải closer** — theo quyết parent đợt 143 (bác đề xuất cho mù #62) và quyết (f) đợt 145. Áp dụng nhất quán.
- **Đoạn boot sống đóng bằng uptime/boot_id trực tiếp** (btime + boot_id giống hệt qua nhiều lần xác minh độc lập + journal 1 boot) — áp dụng cho đoạn B mù #65 khi merged gap vượt sàn; trình parent xác nhận vì là lần đầu trong chuỗi T2-144/145/146.
- WFS giải thích delta bằng diff, không đoán trước số. RAM đọc tay sampler log (ram-max chỉ là lower bound). dpkg đọc trước, không dự báo hình dạng replay (F-142-T2-3). **dpkg.log bị reset mỗi reboot bởi hatch os-intent replay-reset** — muốn lịch sử replay boot cũ thì đọc `/var/log/apt/history.log` + os-intent state, không trông chờ file live (quyết 144 (j) đã cập nhật đợt 145: history.log cũng reset — bằng chứng thay thế là dpkg.log đóng băng trên workspace + ps exact-comm của T4).
- Recheck hố: quét mtime toàn cây `/home/hatch` (bao gồm thư mục bị loại khỏi merged) + `/var/log`; so sánh timestamp bằng đúng định dạng hàm in ra (F-144-T2-3); điểm cuối hố (mốc kết thúc đã biết) tính là KNOWN, không phải mốc mới; mốc cùng giây với endpoint chỉ lệch phần thập phân KHÔNG phải mốc mới (F-146-T2-3).
- Tính gap/btime bằng epoch (code), không gõ tay (F-145-T2-2). Viết script MỚI cho mỗi đợt, không adapt bằng sed (F-145-T2-1). Viết prereg TRƯỚC probe (F-145-T2-3 đã sửa: prereg đợt này viết trước status/once).

### 4.4 Độc lập đối chiếu với T1-145

- T1-145 (verify đợt 144, đã đóng — cờ `round145-t1.done`): đợt 144 = **9 batch / 11 entry / 11 file**; lũy kế 111–144 = **332/690/588**; chờ push 136–144 = **90 file duy nhất** — KHỚP số công bố đợt 144 (T10-144). T2-146 dùng các số này làm cơ số chờ push (§5.4), cộng đợt 145 (T10-145 đếm cuối: đợt 145 = 9/11/11; lũy kế 111–145 = 341/701/597; chờ push 136–145 = 99 file).
- T1-145 bổ sung: parent ĐÃ QUYẾT §12.3 đợt 145 — mù #64 không đóng hoàn toàn, chuỗi về 0; CERT 64/FULL 79 giữ; khung chết #107? 38 s + #106? thu hẹp 9 s chốt; chuỗi INSIDE 4; gap SPAN, không mở đường mới; reboot #33 xác nhận, 98a7c93f = #109? — **đã áp dụng làm chuẩn trong LIMITS này**, chỉ câu hỏi mới ở §4.5.

### 4.5 Câu hỏi MỚI cho parent (chỉ phát sinh ở đợt 146 — các quyết cũ đã áp dụng làm chuẩn, không hỏi lại)

1. **Mù #65 ĐÓNG HOÀN TOÀN (A đóng theo luật gap, B đóng bằng uptime trực tiếp) — ghi nhận chuỗi mù đóng hoàn toàn lên 1?** Đoạn B merged gap 1.295 s > sàn (floor 1 ẩn) — closure dựa hoàn toàn vào uptime/boot_id (4 lần xác minh độc lập). Parent có xác nhận uptime đóng được đoạn B khi merged gap vượt sàn không?
2. **Gap 7.067 s (e146ca67→98a7c93f): chứng nhận [7.057, 7.077] s → CERT 65 / FULL 80, hay để SPAN (CERT/FULL giữ 64/79)?** Phụ thuộc câu (1). Số có điều kiện: CERT65 mean 1h34'42", median 1h50'39", p10 0h26'54", p90 2h15'08"; FULL80 mean 1h40'40", median 1h53'38", p10 0h27'38", p90 2h24'21".
3. **Khung chết #108? (09:44:04Z, 09:54:03Z] (599 s) — chốt làm chuẩn?** Rộng (so với 38 s của #107?); recheck 0 mốc mới; 10 mẫu sampler nội dung trong hố chỉ là hỗ trợ. Khung này không thu hẹp khoảng im lặng (09:45:34Z, 09:54:43Z] 549 s của T7 (hai loại bằng chứng khác nhau).
4. **Chuỗi INSIDE lên 5 (chính thức, đếm chặt) — xác nhận?** 98a7c93f INSIDE dải FULL79 #109? [08:23:45Z, 10:20:46Z] → 5.
5. **F107? ≈ 0 s (chỉ 2 server — cloudflare 403) — chấp nhận làm số đo F cho boot #109?, hay ghi là chưa đủ 3 server?**

## 5. File + stage

### 5.1 File của T2-146

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND146_T2_EPERM_LIMITS.md`
- Work dir: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round146-t2/` — prereg-t2.md, boot-verify.txt, boot-close.txt, f107.txt, dpkg107.txt, status1/once/status2 +.txt, blind65-investigate.py/.log, blind65-sessions.py/.log, sessions-all.txt, blind65-merged.py/.log, blind65-fifthscope.py/.log, blind65-gaps.py/.txt, eperm-sweep65.py + eperm-sweep-run.log, ram-max65.py + ram-max.txt, scan-wfs.sh + scan-meta.txt + files-*.bin + wfs-*.txt, hole-recheck.txt, blind65-repo-1.txt, blind65-hidden_files.txt, blind65-outside.txt, blind65-tmp.txt.
- Script viết mới hoàn toàn cho đợt 146 (không adapt bằng sed — các lỗi F-145-T2-1/F-145-T2-2 đã tránh).

### 5.2 Stage

- Paths file (NUL-delimited, 1 entry — LIMITS này): `~/workspace/repo-1-push/paths-loop/phase9-round146-t2-eperm.txt` — verify bằng `od -c` sau khi ghi (phải thấy NUL, text-only, 0 binary). **KHÔNG PUSH** (chỉ stage; user push sau từ main chat).
- Cờ xong: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round146-t2.done` (1 dòng tóm tắt).

### 5.3 Cập nhật ngoài LIMITS

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md` — append mục đợt 146 (T2).
- `~/memory/2026-11-19.md` — append mục ngắn (không sửa MEMORY.md).

### 5.4 Trạng thái luồng khác lúc T2 đóng (~11:53Z)

- Đã đóng đợt 145: **T1–T10 đủ 9/9 cờ** (aggregate đợt 145 đã đóng, verdict CHẤP NHẬN; quyết parent §12.3 (a)–(o) đã ghi). Đợt 146 đang chạy: T1 đã đóng (cờ `round146-t1.done` tồn tại lúc T2 đóng); T4, T5, T6, T7, T8, T9, T10 chưa có .done lúc T2 đóng.
- Tổng chờ push: đợt 136–145 = **99 file duy nhất** (T10-145 đếm cuối, parent tái kiểm khớp) + 1 file oversize 6,4 MB chưa quyết + 1 file mới của T2-146 (LIMITS này); lũy kế đợt 146 chờ T10 (aggregate đợt 146 chưa có lúc T2 đóng).
- Boot lúc đóng phiên: **98a7c93f** (không có reboot mới trong phiên T2-146 — không mở mù #66).
- Marker round-in-progress.md không tồn tại (đã xóa khi T10-145 đóng sổ).

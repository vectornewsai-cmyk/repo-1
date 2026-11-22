# PHASE9 ROUND145 T2 — EPERM probe #64 + mù #64 KHÔNG ĐÓNG HOÀN TOÀN (đoạn B mở, tối đa 2 ẩn) → CERT/FULL GIỮ 64/79 + chuỗi INSIDE lên 4 — LIMITS

## 0. Headline

- **Probe EPERM #64: ok=2 fail=0, boot e146ca67, 08:41:32Z.** Probe trước (#63) đã chết/stale 2h57'54" (n=63, ts 05:43:32Z, boot 691a7403). Log `eperm-probe-v2.log` 181 → **184 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #64 KHÔNG ĐÓNG HOÀN TOÀN — chuỗi mù đóng hoàn toàn đứt ở 1 (#63 = 1, #64 mở → về 0):** A **ĐÓNG** (merged gap lớn nhất 72 s < sàn 1.147 s, max 0 ẩn), B **MỞ, tối đa 2 ẩn** (merged gap lớn nhất 3.013 s, 06:50:47→07:41:00; recheck toàn cây 0 mốc nội bộ mới), C **ĐÓNG** (gap lớn nhất 453 s + uptime trực tiếp).
- **Gap 7.050 s (691a7403→cc222c8a) + 7.381 s (cc222c8a→e146ca67) VẪN LÀ SPAN** (cả hai đều cần đoạn B đóng mới chứng nhận được) → **CERT 64 / FULL 79 KHÔNG ĐỔI** (tái kiểm bằng script gaps — số liệu trùng khớp 100% T2-144 §2.5).
- **Khung chết (ứng viên merged): #107? (boot cc222c8a): (07:55:38Z, 07:56:16Z] 38 s** — trùng khớp hoàn toàn ứng viên T10-144; **#106? (boot 691a7403): (05:53:06Z, 05:53:15Z] 9 s** — THU HẸP khung T5 (05:52:15Z, 05:53:15Z] 60 s đã chốt (quyết 144 (g)); trình bày làm ứng viên chờ parent chốt thay thế, KHÔNG tự thay chuẩn.
- **Chuỗi INSIDE lên 4 (chính thức, đếm chặt):** cc222c8a INSIDE dải FULL79 #107? [04:23:14Z, 06:20:15Z] (chuỗi 3 — xác nhận chính thức kiểm hậu nghiệm đợt 144) + e146ca67 INSIDE dải FULL79 #108? [06:20:44Z, 08:17:45Z] (chuỗi 4).
- **F106? ≈ −1 s** (example +1, google +1, cloudflare +1 — LẦN ĐẦU cả ba server đồng thuận; F105? là +1/+1/0).
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~188,5 h trước probe #64). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong mù #64: 2.877,8 MiB (T9 sampler 06:12:30Z, đoạn B) = 46,84% guard 6.144 MiB**; đoạn C chỉ tối đa 551 MiB (MemAvailable thấp — balloon đóng băng). 0 mẫu ≥ guard; birefnet KHÔNG thử (không thuộc brief; quyết parent giữ nguyên quy trình + guard 6.144 MiB).
- **WFS #51: chênh 0 — lần thứ 51 liên tiếp.** NEWSTD 965 dòng / 272 file; R7b 990 / 289; copies 25 / 17. `preview.tsx` 530e10a7, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — không đổi.
- **KHÔNG có reboot mới trong phiên T2-145** (boot lúc đóng vẫn e146ca67, kiểm 08:51:56Z) → **không mở mù #65**.
- **Quyết parent đợt 144 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** (CERT 64/FULL 79 xác nhận; khung chết #105?/#103? chốt; khung T5 cho #106? chốt; reboot #31/#32 xác nhận; chuỗi INSIDE 2 đếm chặt; dpkg reset chấp nhận apt history.log thay thế) — không để mở chờ hòa giải nữa. Chỉ câu hỏi MỚI phát sinh ở đợt 145 ghi ở §4.5.
- **Boot lúc đóng phiên: e146ca67 (btime 07:56:16Z), KHÔNG đổi.** dmesg KHÔNG đọc được (Operation not permitted); journalctl đọc được (1 boot); /proc đọc được.

## 1. Checklist probe EPERM #64 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Xác minh boot lần 1 | 08:41:0xZ | e146ca67-20a5-4452-9112-69155233ab99, btime 1795074976 = 07:56:16Z, `uptime -s` 2026-11-19 07:56:16, journal 1 boot, entry đầu 07:56:32Z = btime +16 s |
| Xác minh boot lần 2 | 08:41:3xZ | Cùng boot_id/btime; MemAvailable 564.136 kB (551 MiB) |
| `status` | 08:41:26Z | **DEAD/STALE**, heartbeat n=63, ts 2026-11-19T05:43:32Z, boot 691a7403, tuổi **10.674 s (2h57'54")**, exit 1 (xem F-145-T2-6 về cách ghi exit) |
| `once` | 08:41:32Z | **Probe #64, boot=e146ca67, ok=2 fail=0**, exit 0; dòng log `boot changed 691a7403 -> e146ca67 (uptime since 2026-11-19 07:56:16)` — nhảy qua cc222c8a (heartbeat cũ từ #63, đúng thiết kế) |
| `status` lại | 08:41:32Z | **ALIVE**, tuổi 0 s, n=64, exit 0 |
| Log probe | 08:41:32Z | `eperm-probe-v2.log` 181 → **184 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=64, ts 2026-11-19T08:41:32Z, boot e146ca67; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; MemAvailable 424 MB lúc verify 1 (free -m) |
| Xác minh boot lúc đóng | 08:51:56Z | **KHÔNG đổi boot — e146ca67**, btime 07:56:16Z; không có reboot mới trong phiên → không mở mù #65 |
| dpkg.log boot e146ca67 | 08:41:45Z | **1.545 dòng** (gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2, 08:00:09Z — replay xong ~4 phút sau btime), mtime 08:00:09Z. Bracket chính thức thuộc T5-145; đây là đọc độc lập để đối chiếu |
| F106? | 08:41:44–46Z | example.com Date +1 s, google.com +1 s, cloudflare.com +1 s (Date − local_after) → **F106? ≈ −1 s**. **Lần đầu cả ba server đồng thuận** (F97? +1/+2/+2, F99? +1/0/+1, F102? +1/+1/+2, F104? +1/0/+1, F105? +1/+1/0, F106? +1/+1/+1). F107? (cc222c8a) CHƯA đo (boot đã chết) |

## 2. Điều tra mù #64

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Mù #64: 05:43:32Z 19/11 → 08:41:32Z 19/11 = 10.680 s (2h58'00")** — từ heartbeat cuối probe #63 tới probe #64.
- Hai reboot bên trong (#31, #32):

| Đoạn | Boot | Btime | Dài | Chết lúc |
|---|---|---|---|---|
| A | 691a7403 (#106?) | 03:55:45Z 19/11 (1795060545) | 583 s (từ probe #63) | 05:53:15Z |
| B | cc222c8a (#107?) | 05:53:15Z 19/11 (1795067595) | 7.381 s | 07:56:16Z |
| C | e146ca67 (#108?) | 07:56:16Z 19/11 (1795074976) | 2.716 s (tới probe #64) | (còn sống — probe #64) |

- Gap danh nghĩa (btime − btime, tính bằng epoch): 691a7403→cc222c8a = **7.050 s** (1h57'30"); cc222c8a→e146ca67 = **7.381 s** (2h03'01").
- Nguồn quan sát mốc cuối mù: LIMITS gộp 144 mtime 08:41:37Z (main chat sửa §12.3 sau khi T10 đóng — **5 s SAU probe #64 nên ngoài cửa sổ mù**, không phải mốc trong mù); T10-144 count-final 08:30:22Z; round144-t10.done 08:30:55Z; GAP_ANALYSIS 08:32:01Z; build-loop-log 08:41:51Z (sau probe #64); marker round-in-progress.md đã xóa khi T10 đóng (không tồn tại lúc T2-145 mở — không có chốt chặn).

### 2.2 Đánh số + đồng hồ — đã có chuẩn parent (không còn xung đột)

- **Quyết parent đợt 144 (§12.3, ghi trong MEMORY.md): ĐẾM CHẶT làm chuẩn** — b47f7932 = #103?, 9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?, cc222c8a = #107?, **e146ca67 = #108?**. LIMITS này dùng đếm chặt xuyên suốt.
- **CERT 64 / FULL 79 ĐÃ XÁC NHẬN** (parent, quyết (c)). **Khung chết ĐÃ XÁC NHẬN: #105? (03:55:15Z, 03:55:45Z] 30 s; #103? (23:53:38Z, 23:54:20Z] 42 s; khung T5 cho boot 691a7403 (05:52:15Z, 05:53:15Z] 60 s (quyết (g)).** Full boot_id b47f7932 **ĐỂ MỞ**.
- **Parent BÁC đề xuất continuity dòng-log làm closer cho mù #62** (quyết 143 §12.2) — áp dụng nhất quán cho mù #64 đoạn B: sampler content + session-spanning chỉ là **hỗ trợ, KHÔNG phải closer** (§2.4/§2.6).
- **Đồng hồ:** F106? ≈ −1 s (§1). F105? ≈ −0 s đến −1 s (đợt 144). F104? ≈ −0 s đến −1 s (đợt 143). F103?/F107? chưa đo (boot đã chết). Dải offset started_at ~30–50 s giữ vững (chuỗi offset boot đúng: 34/37/32/35/44/41 s — T7-145 kiểm tiếp). Btime các gap lấy theo RTC, không bị drift guest ảnh hưởng.
- **Nghịch lý đồng hồ đợt 144 (~29 s) không tái hiện ở đợt này:** mốc cuối đoạn B theo đồng-hồ-cũ (sampler 07:55:38Z) NHỎ HƠN btime boot mới 07:56:16Z (38 s) — thứ tự đúng; mốc 05:53:15Z đúng tại btime (ram-sampler.log) được xử lý bằng quy ước strict-< (§2.4, F-145-T2-5).

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác float:**
- repo-1: **10 file** (đoạn A 1, đoạn B 6, đoạn C 3); hidden_files: **321 file**. Tổng **326 mốc float khác nhau / 203 mốc giây khác nhau** (hai cây gộp).
- Đoạn A: **58 mốc gộp**, gap lớn nhất **98 s** (05:50:39→05:52:17). Đoạn B: **174 mốc gộp**, gap lớn nhất **4.371 s** (06:42:21→07:55:12). Đoạn C: **94 mốc gộp**, gap lớn nhất **613 s** (08:20:09→08:30:22).

**Sessions (`~/workspace/agents/`, 295 exec-log, 295 file có birth/mtime dùng được — tăng 15 so với đợt 144):**
- Bắc cầu: B-lo **4** session, B-hi **1** (proc_46e83916aaad birth 06:53:01, mtime 07:41:00), C-lo **1**, C-hi **0** (không cần — uptime đóng C). Đoạn A ngắn hơn sàn nên không có cắt A.
- Chạm đoạn: A **9**, B **15**, C **6** session.
- Nhân chứng nhảy (jump witness): **0 tại cc222c8a** (|X| < 9 s; session mtime cuối trước 05:53:06Z; birth đầu sau 05:54:48Z); **1 tại e146ca67** — proc_4af229f60123 (birth 07:43:20, mtime 07:56:19, +3 s sau btime; session waiter của T10, runtime restart ghi tiếp vào cùng exec-log sau reboot).
- Nhắc boot trong exec-log trong mù: 691a7403 **4**, cc222c8a **12**, e146ca67 **2**.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **74 file** trong mù #64 (48 mốc giây). /tmp: **672 file — tất cả trong đoạn C** (25 mốc giây; tmpfs bị xóa bởi #32, như đợt 144). Goals ngoài hidden_files: **0 file** trong mù #64. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **2 file** (cả hai 05:49:33Z, đoạn A — memory/bank reflections.md + world.md).
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: B-tail **1 / 0 / 0 / 4** (exec-log 07:41:00 + sampler T9 07:55:12 ×2 file + 07:55:38 ×2 file); C-tail **4 / 2 / 1 / 4** (exec-log 08:41:18, /tmp count-145-parent*.py 08:39:34/08:39:45, GAP 08:32:01, T10 count-final 08:30:22 + t10.done 08:30:55 + probe-start/status1 08:41:26).

**Ranh giới:** cc222c8a KHÔNG sạch (1 file đúng tại btime — T5 ram-sampler.log 05:53:15Z; 2 file trong (btime, +10 s] — files-newstd.bin 05:53:20Z + wfs-newstd.txt 05:53:25Z của chính quét WFS #50 lúc reboot; 1 file tại −9 s — exec-log 05:53:06Z). e146ca67: 0 file trong [btime−10 s, btime], 1 file trong (btime, +10 s] (exec-log waiter +3 s).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**248 mốc giây khác nhau** (repo-1 10, hidden_files 193, ngoài cây 48, /tmp 25). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| A | 46 | **72 s** (05:50:39→05:51:51) | 59 s / 45 s | 05:43:33 (1 s) | 05:53:15 (0 s) | **ĐÓNG — max 0 ẩn** (luật gap; đoạn ngắn hơn sàn) |
| B | 124 | **3.013 s** (06:50:47→07:41:00) | 852 s / 279 s | 05:53:20 (5 s) | 07:55:38 (38 s) | **MỞ — tối đa 2 ẩn** (luật gap) |
| C | 77 | **453 s** (08:32:01→08:39:34) | 381 s / 315 s | 07:56:19 (3 s) | 08:41:26 (6 s) | **ĐÓNG — luật gap + uptime trực tiếp** |

**Đoạn A — ĐÓNG (max 0 ẩn).** Gap lớn nhất merged 72 s < sàn 1.147 s; floor(72/1147)=0. Đoạn chỉ dài 583 s < sàn nên đóng theo luật gap bất kể mốc. Mốc đầu merged 05:43:33Z (head 1 s — mốc 05:43:32Z đúng tại B0 bị loại bởi quy ước merged `> B0` nghiêm ngặt; hai cây độ chính xác float vẫn ghi head 0 s — xem F-144-T2-6, không đổi verdict).

**Đoạn B — MỞ (tối đa 2 ẩn).** Gap lớn nhất merged 3.013 s > sàn 1.147 s; floor(3013/1147)=2. Hố 06:50:47→07:41:00: sau 06:42Z chỉ còn tiến trình append chạy (sampler T9 vòng 2, waiter T10, kiểm T7) — mtime của chúng dồn về cuối hố (07:41:00, 07:55:12, 07:55:38). Đây là cùng mẫu hố append-trong-file như đoạn C mù #62 (hố 2.424 s). Hỗ trợ (KHÔNG phải closer — quyết parent đã bác continuity): session proc_46e83916aaad sinh 06:53:01Z **trong hố**, mtime 07:41:00Z (cạnh phải hố), bắc cầu B-hi; sampler T9 vòng 2 có **50 mẫu nội dung trong hố** (mỗi ~60 s, 06:51:33Z→~07:40:33Z, balloon đóng băng 6.443.824 kB); 1 nhân chứng nhảy tại e146ca67 (không thuộc đoạn B). Recheck §2.6 tìm **0 mốc nội bộ mới** — hố đứng nguyên.

**Đoạn C — ĐÓNG (luật gap + uptime trực tiếp).** Gap lớn nhất 453 s < sàn 1.147 s (floor=0); mốc đầu 07:56:19Z (head 3 s — exec-log waiter, nhân chứng nhảy); mốc cuối 08:41:26Z (tail 6 s). Uptime trực tiếp xác minh boot e146ca67 sống liên tục từ 07:56:16Z tới probe #64 (§1) củng cố độc lập. 1 session bắc cầu C-lo; 0 session bắc cầu C-hi (không cần — uptime trực tiếp đã đóng).

**Khung chết (ứng viên merged — chờ parent xác nhận làm chuẩn):**
- **#107? (boot cc222c8a): (07:55:38Z, 07:56:16Z] = 38 s.** Mốc cuối đoạn B merged. **Trùng khớp hoàn toàn** ứng viên T10-144 ((07:55:38Z, 07:56:16Z] 38 s) — merged KHÔNG thu hẹp thêm (không có mốc nào trong (07:55:38Z, 07:56:16Z]).
- **#106? (boot 691a7403): (05:53:06Z, 05:53:15Z] = 9 s.** Mốc cuối đoạn A merged (strict-< btime): exec-log proc_dc22ad68727e mtime 05:53:06Z. **Thu hẹp khung T5 đã chốt (05:52:15Z, 05:53:15Z] 60 s** (quyết 144 (g)) — mốc 05:53:04Z (hai cây) và 05:53:06Z (exec-log) đều muộn hơn mẫu sampler cuối của T5 (05:52:15Z); T5 không thấy hai mốc này vì phạm vi của T5 hẹp hơn merged. Trình bày làm ứng viên chờ parent chốt thay thế (cùng địa vị như hai khung đã xác nhận ở đợt 144). Mốc đúng tại btime 05:53:15Z (T5 ram-sampler.log) bị loại bởi quy ước strict-< (mơ hồ boot nào ghi — xem F-145-T2-5); nếu tính mốc này thì khung về 0 s — T2 KHÔNG đề xuất (quy ước đã đứng từ các đợt trước).

### 2.5 Phân phối gap — CERT/FULL KHÔNG ĐỔI

- **Gap MỚI CHỨNG NHẬN: KHÔNG CÓ.** Gap 691a7403→cc222c8a = 7.050 s và cc222c8a→e146ca67 = 7.381 s **VẪN LÀ SPAN** (đoạn B mở, tối đa 2 ẩn). → **CERT giữ 64, FULL giữ 79.**
- **CERT64 (không đổi, đợt 144):** n=64, mean **1h34'20"**, median **1h49'58"**, p10 **0h26'45"**, p90 **2h15'26"**, sd **0h44'58"**, min **0h00'55"**, max **3h14'08"**. **FULL79 (không đổi):** n=79, mean **1h40'27"**, median **1h53'00"**, p10 **0h27'29"**, p90 **2h24'30"**, sd **0h55'04"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **41**, <60' = **18**, >180' = **6**, >240' = **2**. Script gaps tái tạo chính xác số T2-144 (assert trong script: stats tính lại == stats tái dùng).
- **SPAN (không chứng nhận):** 691a7403→cc222c8a = **7.050 s**; cc222c8a→e146ca67 = **7.381 s**; b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**. Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL (cộng sẽ đếm trùng).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Không đề xuất đường chứng nhận mới cho đoạn B (continuity đã bị parent bác cho mù #62; session-spanning là cùng họ bằng chứng — chỉ ghi làm hỗ trợ, không đề xuất làm closer).
- Dải chứng nhận không đổi: [0h00'55", 3h14'08"].
- **Dải (band) cho boot mới — XÁC NHẬN CHÍNH THỨC:**
  - cc222c8a làm #107? (đếm chặt, chuẩn), dải FULL79 neo #106? 03:55:45Z: **[04:23:14Z, 06:20:15Z]** — btime thực 05:53:15Z **INSIDE** (chuỗi 3 — xác nhận chính thức kiểm hậu nghiệm đợt 144).
  - e146ca67 làm #108? (đếm chặt, chuẩn), dải FULL79 neo #107? 05:53:15Z: **[06:20:44Z, 08:17:45Z]** — btime thực 07:56:16Z **INSIDE** (chuỗi 4).
  - **Chuỗi INSIDE = 4 theo đếm chặt (chuẩn parent từ đợt 144) — tính bằng code với float p10/p90 chính xác:** b47f7932 INSIDE (1) → 9afdaa89 OUTSIDE (đứt, về 0) → 70a5b0fc INSIDE (1) → 691a7403 INSIDE (2) → cc222c8a INSIDE (3) → e146ca67 INSIDE (4). Dải 70a5b0fc FULL79 [00:21:49Z, 02:18:50Z] (khác dải FULL77 đợt 144 [00:20:49Z, 02:18:27Z] vài chục giây do p10/p90 khác — verdict INSIDE không đổi).
  - Boot tiếp theo sau e146ca67 (#109? chặt), dải FULL79 neo 07:56:16Z: **[08:23:45Z, 10:20:46Z]**.
- **Tốc độ reboot:** **108 reboot / 203,63 h = 1 lần / 113,1 phút** (106 + sự kiện #31 + #32; từ boot #1 2026-11-10T20:18:10Z tới e146ca67). Chuỗi lũy kế tới **123 / 203,63 h = 1 lần / 99,3 phút** (+4 mù #29/30/31 →112; +3 mù #53B →115; +2 mù #55B conv →117; +1 mù #56A conv →118; +0 #57–#60, mù #61A →118; +1 mù #61B →119; +0 mù #61C, mù #62A, mù #62B rule-max-0 →119; +2 mù #62C →121; +0 mù #63A, mù #63B →121; +0 mù #64A, mù #64C →121; +2 mù #64B →123). Tổng dung lượng: 55B max 3 → **124 (1 lần / 98,5 phút)**; 56A max 3 → **126 (1 lần / 97,0 phút)**.

### 2.6 Recheck hố đoạn B (06:50:47Z, 07:41:00Z] — điều kiện duy nhất còn lại cho hai gap SPAN

- Quét mtime toàn cây `/home/hatch` (bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) cho mốc trong hố: **chỉ có chính mốc cạnh trái 06:50:47Z** (exec-log proc_7830de539308, mtime 06:50:47.xxx — khớp do so sánh giây). **0 mốc nội bộ MỚI.**
- `/var/log`: **0 dòng dpkg.log** trong cửa sổ hố; dpkg.log / apt history.log / term.log đều mtime **08:00:09Z** (replay boot mới, đoạn C). Các Start-Date apt gần nhất 07:59:56–08:00:09Z (đoạn C, sau reboot #32). Replay boot cc222c8a đã xong từ ~05:58Z (T9-144) — không có hoạt động apt nào trong hố.
- **Kết luận: hai gap 7.050 s + 7.381 s VẪN SPAN.** Không còn đường chứng nhận nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log). Hai gap này ở lại SPAN trừ khi có bằng chứng hoàn toàn mới từ nguồn khác, hoặc parent chấp nhận một đường chứng nhận mới (§4.5(5)).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Mù #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới).

### 2.8 Quét WFS #51 (08:49:31–08:49:57Z — chạy trên boot e146ca67, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 965 dòng / 272 file** (phạm vi 3.208 file). **R7b: 990 / 289** (phạm vi 12.601 file). **Copies: 25 / 17** (không đổi). Đối chiếu 965+25=990=R7b, **chênh 0 — lần thứ 51 liên tiếp**.
- Delta so với #50 (964/271): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND144_T5_INFRA_LIMITS.md:1` — file này hoàn thành sau quét #50 (05:53:20–05:53:42Z; T5-144 đóng 06:41Z) nên lúc #50 nó đang ghi dở (0 hit) và nay đủ 1 hit. Cùng bẫy "đếm dở" như F-144-T2-7.
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7**, `apps/web/src/media.ts` **2c384ed1**, `apps/web/vite.config.ts` **ee80d093** — không đổi.

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** trong src. Thêm 1 bản copy build `apps/desktop/dist/services/epermRetry.js:116` — md5 **giống hệt** bản src (112891d5) — là artifact build, không phải helper mới. Các hit còn lại là mock trong file test (`test_round83_k8_eperm_retry.mjs`, `epermRetry.test.cjs`) — không phải helper thật.

### 2.10 Quét EPERM trong mù #64

- **72 file *.log** có mtime trong mù #64 (0 repo-1, 72 hidden_files). Đếm: "sóng EPERM vẫn bật" **0**, "CẢNH BÁO" **0**, "Operation not permitted" **0**, "sóng EPERM đã tắt" **5** — tất cả là false positive đã biết của launcher O8 (T8 `o8-144t8.log` ×3 mốc 05:41:12/05:42:10/05:43:04Z + T10 `t10-o8.log` ×2 mốc 08:18:12/08:19:12Z). Mở rộng raw: 11 lần / 11 unique (5 launcher + 6 dòng test-pass `hasEperm`). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~188,5 h** trước probe #64). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-145 — KHÔNG CÓ

- Boot lúc mở phiên (08:41Z) và lúc đóng (08:51:56Z) đều là **e146ca67, btime 07:56:16Z**. Không có reboot mới trong phiên → **không mở mù #65**. (Hai reboot #31/#32 đều xảy ra trước khi T2-145 mở phiên — trong cửa sổ mù #64, không phải trong phiên này.)
- **dmesg KHÔNG đọc được trong phiên này** (`dmesg: read kernel buffer failed: Operation not permitted`). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

## 3. RAM trong mù #64 (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh mù #64: 2.877,8 MiB (T9 sampler vòng 2, 06:12:30Z, đoạn B) = 46,84% guard 6.144 MiB**, thiếu ~3.266,2 MiB. Dòng sampler: `2026-11-19T06:12:30Z 2946832 2877.8 3948376 751608 0.89` (balloon lúc đó 3.948.376 kB — chưa đóng băng). Đây cũng là đỉnh cửa sổ đợt 144 của T9-144 (nằm trong đoạn B mù #64).
- Đỉnh từng đoạn: A **2.646 MiB** (T4 load-mid, 05:53:04Z) = 43,07% guard; B **2.877,8 MiB** (06:12:30Z) = 46,84% guard; C **551 MiB** (T2 verify-2, 564.136 kB, 08:41:32Z) — đối chứng T10 suite start 509 MB lúc 08:13:10Z; MemAvailable lúc verify 1 chỉ 424 MB. Đoạn C RAM khả dụng rất thấp (balloon đóng băng 6.443.824 kB — T9-144 ghi 60/135 mẫu ghim).
- **0 mẫu ≥ guard; birefnet KHÔNG thử** (không thuộc brief; quyết parent — giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Số riêng của script ram-max (lower bound): 637 mẫu; A 2.646 MB, B 2.829 MB, C **không mẫu nào** (ram-max bỏ sót dòng sampler số trần của T9 + dòng `RAMavail 509MB` của T10 do mẫu regex không khớp — cùng họ F-141-T2-2; số đoạn C ở trên là đọc tay).
- Lưu ý: đỉnh mù #64 (46,84% guard) cao hơn mù #63 (42,19%) nhưng thấp hơn mù #62 (48,70%); vẫn cách guard hơn một nửa.
- **Headroom:** theo dõi theo quyết parent (chỉ theo dõi, không hành động); số đo mới thuộc T9-145.

## 4. Ghi chú phương pháp + sai số của chính T2-145 + đối chiếu prereg

### 4.1 Danh sách sai số F-145-T2-n

- **F-145-T2-1 — Sed adapt eperm-sweep/ram-max gán nhầm B0/B1 (cả hai thành 08:41:32Z).** Hai lần thay `02:49:42Z→05:43:32Z` rồi `05:43:32Z→08:41:32Z` nối tiếp khiến B0 cũng bị đổi theo. Đã sửa tay và verify bằng grep (`B0, B1 = ...05:43:32Z...08:41:32Z`) TRƯỚC khi chạy (cùng lớp F-144-T2-4). Không ảnh hưởng kết quả (adapt chạy trước khi đo).
- **F-145-T2-2 — Gaps script gõ sai epoch btime 18/11 (lệch +18.000 s).** Lần chạy đầu: b47f7932/9afdaa89 và prev của 70a5b0fc gõ sai (1795064018/1795064060 thay vì 1795046018/1795046060) → chuỗi INSIDE tính ra 3 + 70a5b0fc OUTSIDE (sai). Đã sửa bằng epoch tính từ code (`date`-python) và chạy lại → chuỗi 4 đúng (70a5b0fc INSIDE). Cùng lớp F-144-T2-1: tính gap/btime bằng epoch từ code, không gõ tay. Số CERT/FULL không bị ảnh hưởng (không dùng các epoch này).
- **F-145-T2-3 — Prereg viết SAU probe #64 (không phải trước khi đo).** Prereg ghi rõ thời điểm: probe #64 + F106? + dpkg đã chạy xong trước khi viết; prereg chỉ dự báo merged/gaps (chưa đo lúc viết). Không ảnh hưởng số liệu; ghi rõ để đợt sau đối chiếu đúng.
- **F-145-T2-4 — eperm-sweep64.py in nhãn "blind#63" (stale).** Sed `blind63→blind64` không bắt chuỗi `blind#63` (có dấu #). Chỉ nhãn in — B0/B1 đúng, số liệu đúng (72 log, 0/0/0/5).
- **F-145-T2-5 — Mốc đúng tại btime 05:53:15Z (ram-sampler.log) và khung chết #106?.** Merged tính tail đoạn A = 0 s (mốc tại btime) nhưng death-frame dùng quy ước strict-< nên mốc này không thu hẹp khung về 0 s; khung ứng viên là (05:53:06Z, 05:53:15Z] 9 s. Quy ước đã đứng từ các đợt trước — ghi rõ, không tự đổi.
- **F-145-T2-6 — Exit code status1 ghi bằng tee.** `exit=0` trong status1.txt là exit của tee, không phải của `status` (status trả 1 = DEAD/STALE theo script). Once exit=0 và status2 exit=0 đo bằng PIPESTATUS nên đúng. Chỉ ghi chép, không ảnh hưởng kết quả.

### 4.2 Đối chiếu prereg — thực tế

| Dự báo prereg (viết sau probe, trước merged) | Thực tế | Verdict |
|---|---|---|
| Probe #64 ok=2 fail=0, boot e146ca67, log +3 | Đúng y hệt (§1) | ✓ |
| Boot e146ca67, btime 07:56:16Z | Đúng (§1, 2 lần xác minh + lúc đóng) | ✓ |
| Đoạn A đóng theo luật gap | Đóng — merged gap max 72 s (F-145-T2-3 không ảnh hưởng) | ✓ |
| Đoạn B đóng → CERT 65/66 | **SAI — B MỞ (gap 3.013 s, max 2 ẩn)** → CERT giữ 64 / FULL giữ 79 | ✗ (verdict) |
| Đoạn C đóng theo gap+uptime | Đóng (gap 453 s + uptime trực tiếp) | ✓ |
| Gap 691a7403→cc222c8a = 7.050 s → [7.040, 7.060] | Số danh nghĩa đúng 7.050 s, nhưng **VẪN SPAN** (B mở) | ✗ (chứng nhận) |
| Gap cc222c8a→e146ca67 = 7.381 s → [7.371, 7.391] | Số danh nghĩa đúng 7.381 s, nhưng **VẪN SPAN** (B mở) | ✗ (chứng nhận) |
| Dải #108? FULL79 [06:20:44Z, 08:17:45Z] — e146ca67 INSIDE | Đúng chính xác bằng float (script tính [06:20:44Z, 08:17:45Z]) → chuỗi 4 | ✓ |
| Khung chết cc222c8a (07:55:38Z, 07:56:16Z] 38 s | Đúng — trùng khớp ứng viên T10 | ✓ |
| Khung chết 691a7403: merged đối chiếu khung T5 60 s | Merged thu hẹp còn **9 s** (05:53:06Z, 05:53:15Z] — ứng viên chờ parent chốt | ~ (mới) |
| EPERM 0 sóng | Đúng (§2.10) | ✓ |
| WFS giải thích bằng diff, không đoán trước | +1/+1, giải thích đầy đủ (§2.8) | ✓ |
| RAM đỉnh mù #64 ≤ ~48,70% guard | Đúng: 46,84% | ✓ |
| dpkg: đọc trước, không dự báo hình dạng | Sống 1.545 dòng (gói cuối 08:00:09Z) | ✓ (thận trọng đúng) |
| F106? ≈ −1 s | −1 s, cả ba +1 (lần đầu đồng thuận) | ✓ |

### 4.3 Phương pháp (ghi lại để đợt sau dùng)

- Merged 4 phạm vi: repo-1 + hidden_files + ngoài cây + /tmp, độ chính xác giây; hai cây độ chính xác float để đối chiếu; sessions (`~/workspace/agents/` exec-logs, birth/mtime) để bắc cầu + nhân chứng nhảy; phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats). Đừng bỏ sót phạm vi (F-136-T2-8).
- Gap chứng nhận = [mid−10 s, mid+10 s] khi đoạn trước đóng VÀ đoạn sau đóng; SPAN khi đoạn mở/không chứng nhận được. Luật gap: floor(gap_max/1.147 s) = số ẩn tối đa.
- Bằng chứng nội dung (timestamp trong nội dung file, sampler continuity, session-spanning) là **hỗ trợ, không phải closer** — theo quyết parent đợt 143 (bác đề xuất cho mù #62). Áp dụng nhất quán.
- WFS giải thích delta bằng diff, không đoán trước số. RAM đọc tay sampler log (ram-max chỉ là lower bound). dpkg đọc trước, không dự báo hình dạng replay (F-142-T2-3). **dpkg.log bị reset mỗi reboot bởi hatch os-intent replay-reset** — muốn lịch sử replay boot cũ thì đọc `/var/log/apt/history.log` + os-intent state, không trông chờ file live (quyết 144 (j)).
- Recheck hố: quét mtime toàn cây `/home/hatch` (bao gồm thư mục bị loại khỏi merged) + `/var/log`; so sánh timestamp bằng đúng định dạng hàm in ra (F-144-T2-3); điểm cuối hố (mốc kết thúc đã biết) tính là KNOWN, không phải mốc mới.
- Tính gap/btime bằng epoch (code), không gõ tay (F-145-T2-2). Adapt script: thay thế nối tiếp cùng chuỗi thời gian dễ gán nhầm B0/B1 (F-145-T2-1) — verify bằng grep trước khi chạy.

### 4.4 Độc lập đối chiếu với T1-144

- T1-144 (verify đợt 143, đã đóng — cờ `round144-t1.done`): đợt 143 = **9 batch / 11 entry / 11 file**; lũy kế 111–143 = **323/679/579**; chờ push 136–143 = **81 file duy nhất** — KHỚP số công bố đợt 143 (T10-143). T2-145 dùng các số này làm cơ số chờ push (§5.4), cộng đợt 144 (T10-144 đếm cuối: đợt 144 = 9/11/11; lũy kế 111–144 = 332/690/588; chờ push 136–144 = 90 file).
- T1-144 bổ sung (handoff): parent ĐÃ QUYẾT §12.3 đợt 144 — CERT 64/FULL 79 xác nhận; khung chết #105?/#103? chốt; khung T5 cho #106? chốt; reboot #31/#32 xác nhận; chuỗi INSIDE 2 đếm chặt — **đã áp dụng làm chuẩn trong LIMITS này**, chỉ câu hỏi mới ở §4.5.

### 4.5 Câu hỏi MỚI cho parent (chỉ phát sinh ở đợt 145 — các quyết cũ đã áp dụng làm chuẩn, không hỏi lại)

1. **Mù #64 KHÔNG đóng hoàn toàn (đoạn B mở, tối đa 2 ẩn) — ghi nhận chuỗi mù đóng hoàn toàn đứt, về 0? CERT 64 / FULL 79 giữ nguyên (xác nhận không đổi)?** Gap 7.050 s + 7.381 s vẫn SPAN.
2. **Khung chết #107? (07:55:38Z, 07:56:16Z] (38 s) — chốt làm chuẩn?** Trùng khớp hoàn toàn ứng viên T10-144; merged không thu hẹp thêm.
3. **Khung chết #106? thu hẹp (05:53:06Z, 05:53:15Z] (9 s) — chốt thay khung T5 (05:52:15Z, 05:53:15Z] (60 s) đã chốt ở quyết 144 (g), hay giữ khung T5?** Mốc 05:53:06Z là exec-log (session T2-144); mốc 05:53:04Z (hai cây) cũng muộn hơn 05:52:15Z. Mốc đúng tại btime 05:53:15Z (ram-sampler.log) không tính theo quy ước strict-<.
4. **Chuỗi INSIDE lên 4 (chính thức, đếm chặt) — xác nhận?** cc222c8a INSIDE → 3 (xác nhận chính thức kiểm hậu nghiệm đợt 144); e146ca67 INSIDE dải FULL79 #108? [06:20:44Z, 08:17:45Z] → 4.
5. **Gap 7.050 s + 7.381 s VẪN SPAN — có đường chứng nhận nào khác cho đoạn B ngoài merged gap rule không, hay để SPAN?** Bằng chứng hỗ trợ trong hố: 50 mẫu sampler nội dung + 1 session sinh trong hố và bắc cầu B-hi + 1 nhân chứng nhảy tại e146ca67. Lưu ý: parent đã bác continuity làm closer cho mù #62 (quyết 143 §12.2); session-spanning là cùng họ bằng chứng — T2 KHÔNG đề xuất làm closer, chỉ hỏi parent có muốn mở đường mới hay giữ nguyên phương pháp.

## 5. File + stage

### 5.1 File của T2-145

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND145_T2_EPERM_LIMITS.md`
- Work dir: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round145-t2/` — prereg-t2.md, boot-verify.txt, boot-close.txt, f106.txt, dpkg106.txt, status1/once/status2 +.txt, probe-start.txt, blind64-investigate.py/.log, blind64-sessions.py/.log, sessions-all.txt, blind64-merged.py/.log, blind64-fifthscope.py/.log, blind64-gaps.py/.txt, eperm-sweep64.py + eperm-sweep-run.log, ram-max64.py + ram-max.txt, scan-wfs.sh + scan-meta.txt + files-*.bin + wfs-*.txt, hole-recheck.txt, async-wfs.txt, blind64-repo-1.txt, blind64-hidden_files.txt, blind64-outside.txt, blind64-tmp.txt.
- Script adapt từ round144-t2 (viết mới blind64-investigate/sessions/merged/fifthscope/gaps; sed adapt sweep/ram-max/scan-wfs — các lỗi bỏ sót đã sửa — F-145-T2-1, F-145-T2-4).

### 5.2 Stage

- Paths file (NUL-delimited, 1 entry — LIMITS này): `~/workspace/repo-1-push/paths-loop/phase9-round145-t2-eperm.txt` — verify bằng `od -c` sau khi ghi (phải thấy NUL, text-only, 0 binary). **KHÔNG PUSH** (chỉ stage; user push sau từ main chat).
- Cờ xong: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round145-t2.done` (1 dòng tóm tắt).

### 5.3 Cập nhật ngoài LIMITS

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md` — append mục đợt 145 (T2).
- `~/memory/2026-11-19.md` — append mục ngắn (không sửa MEMORY.md).

### 5.4 Trạng thái luồng khác lúc T2 đóng (~08:52Z)

- Đã đóng đợt 144: **T1–T10 đủ 9/9 cờ** (aggregate đợt 144 đã đóng, verdict CHẤP NHẬN). Đợt 145 đang chạy: T4, T5, T6, T7, T8, T9, T10 (chưa có .done lúc T2 đóng — T2 là luồng đầu tiên đóng đợt 145).
- Tổng chờ push: đợt 136–144 = **90 file duy nhất** (T10-144 đếm cuối, parent tái kiểm khớp) + 1 file oversize 6,4 MB chưa quyết + 1 file mới của T2-145 (LIMITS này); lũy kế đợt 145 chờ T10 (aggregate đợt 145 chưa có lúc T2 đóng).
- Boot lúc đóng phiên: **e146ca67** (không có reboot mới trong phiên T2-145 — không mở mù #65).
- Marker round-in-progress.md không tồn tại (đã xóa khi T10-144 đóng sổ).

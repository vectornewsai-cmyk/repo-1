# PHASE9 ROUND144 T2 — EPERM probe #63 + mù #63 ĐÓNG HOÀN TOÀN + gap mới chứng nhận → CERT 64 / FULL 79 — LIMITS

## 0. Headline

- **Probe EPERM #63: ok=2 fail=0, boot 691a7403, 05:43:32Z.** Probe trước (#62) đã chết/stale 2h53'43" (n=62, ts 02:49:42Z, boot 70a5b0fc). Log `eperm-probe-v2.log` 178 → **181 dòng (+3 đúng prereg)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #63 ĐÓNG HOÀN TOÀN — mù đầu tiên đóng hoàn toàn kể từ #60** (chuỗi mù đóng hoàn toàn #61/#62 đứt, nay bắt đầu lại ở 1): A **ĐÓNG** (merged gap lớn nhất 666 s < sàn 1.147 s, max 0 ẩn), B **ĐÓNG** (gap lớn nhất 208 s + uptime trực tiếp).
- **Gap mới CHỨNG NHẬN: 70a5b0fc→691a7403 = [7.210, 7.230] s, giữa 7.220 s (2h00'20") → CERT 64 / FULL 79** (đếm chặt — chuẩn parent từ đợt 144). Gap 42 s (b47f7932→9afdaa89) và gap 7.265 s (9afdaa89→70a5b0fc) **VẪN LÀ SPAN** (recheck 0 mốc mới; parent đã bác cả hai đường chứng nhận còn lại).
- **Khung chết (ứng viên merged, chờ parent xác nhận chuẩn): #105? (boot 70a5b0fc): (03:55:15Z, 03:55:45Z] 30 s** — trùng khớp hoàn toàn khung quan sát T9-143, merged KHÔNG thu hẹp thêm. **#103? (boot b47f7932): (23:53:38Z, 23:54:20Z] 42 s** — không đổi sau recheck.
- **F105? ≈ −0 s đến −1 s (±~1 s)** (example +1, google +1, cloudflare 0). Lần thứ 5 ba server không đồng thuận.
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~185,5 h trước probe #63). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong mù #63: 2.592 MiB (T4 poll #11, 02:50:04Z, đoạn A) = 42,19% guard 6.144 MiB**; đối chứng sampler T9 2.629.332 kB = 2.567,7 MiB lúc 02:50:11Z. 0 mẫu ≥ guard; birefnet KHÔNG thử (không thuộc brief; quyết parent giữ nguyên quy trình + guard 6.144 MiB).
- **WFS #50: chênh 0 — lần thứ 50 liên tiếp.** NEWSTD 964 dòng / 271 file; R7b 989 / 288; copies 25 / 17. `preview.tsx` 530e10a7, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — không đổi.
- **REBOOT #31 TRONG PHIÊN T2-144: 691a7403 → cc222c8a, btime 05:53:15Z** (sau probe #63, ngoài cửa sổ mù #63 — không ảnh hưởng verdict mù #63). Gap danh nghĩa 7.050 s (1h57'30"), chưa chứng nhận — chờ T2-145 (mù #64). Kiểm hậu nghiệm: btime 05:53:15Z NẰM TRONG dải FULL79 #107? [04:23:14Z, 06:20:15Z] (chuỗi INSIDE lên 3 nếu tính cả boot này — T2-145 xác nhận chính thức; xem F-144-T2-8: chuỗi theo đếm chặt là 2, không phải 4 như T2-143 công bố).
- **Quyết parent đợt 143 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** (đếm chặt; CERT 63/FULL 78 xác nhận; khung chết #102?/9afdaa89 xác nhận; full boot_id b47f7932 để mở; bác cả hai đề xuất mù #62) — không để mở chờ hòa giải nữa. Chỉ câu hỏi MỚI phát sinh ở đợt 144 ghi ở §4.5.
- **Boot lúc đóng phiên: cc222c8a (btime 05:53:15Z), KHÔNG còn là 691a7403.** dmesg KHÔNG đọc được (Operation not permitted); journalctl đọc được (1 boot); /proc đọc được.

## 1. Checklist probe EPERM #63 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Xác minh boot lần 1 | 05:43:24Z | 691a7403-512b-4055-bb55-de0d7516eeeb, btime 1795060545 = 03:55:45Z, `uptime -s` 2026-11-19 03:55:45, journal 1 boot, entry đầu 03:55:55Z = btime +10 s |
| Xác minh boot lần 2 | 05:43:42Z | Cùng boot_id/btime; MemAvailable 1.094.264 kB |
| `status` | 05:43:25Z | **DEAD/STALE**, heartbeat n=62, ts 2026-11-19T02:49:42Z, boot 70a5b0fc, tuổi **10.423 s (2h53'43")**, exit 1 |
| `once` | 05:43:32Z | **Probe #63, boot=691a7403, ok=2 fail=0**, exit 0; dòng log `boot changed 70a5b0fc -> 691a7403 (uptime since 2026-11-19 03:55:45)` |
| `status` lại | 05:43:32Z | **ALIVE**, tuổi 1 s, n=63, exit 0 |
| Log probe | 05:43:32Z | `eperm-probe-v2.log` 178 → **181 dòng (+3 đúng prereg)**; heartbeat n=63, ts 2026-11-19T05:43:32Z, boot 691a7403; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; MemAvailable 1.243.308 kB lúc 05:43:24Z |
| Xác minh boot lúc đóng | 05:56:55Z | **ĐÃ ĐỔI BOOT — reboot #31** (xem §2.11): cc222c8a-d8e2-4244-bcbc-1997b4099864, btime 05:53:15Z; MemAvailable 1.905.656 kB (trên boot mới) |
| dpkg.log boot 691a7403 | 05:43:42Z | **1.545 dòng — replay SỐNG** (gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2, 04:00:38Z), khớp T9-143. Bracket chính thức thuộc T5-144; đây là đọc độc lập để đối chiếu |
| F105? | 05:43:44–45Z | example.com Date +1 s, google.com +1 s, cloudflare.com +0 s (Date − local_after) → **F105? ≈ −0 s đến −1 s (±~1 s)**. Lần thứ 5 ba server không đồng thuận (F97? +1/+2/+2, F99? +1/0/+1, F102? +1/+1/+2, F104? +1/0/+1, F105? +1/+1/0). F103? (9afdaa89) vẫn CHƯA đo (boot đã chết) |

## 2. Điều tra mù #63

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Mù #63: 02:49:42Z 19/11 → 05:43:32Z 19/11 = 10.430 s (2h53'50")** — từ heartbeat cuối probe #62 tới probe #63.
- Một reboot bên trong (#30):

| Đoạn | Boot | Btime | Dài | Chết lúc |
|---|---|---|---|---|
| A | 70a5b0fc (#105?) | 01:55:25Z 19/11 (1795053325) | 3.963 s (từ probe #62) | 03:55:45Z |
| B | 691a7403 (#106?) | 03:55:45Z 19/11 (1795060545) | 6.467 s (tới probe #63) | (còn sống — probe #63) |

- Gap danh nghĩa (btime − btime): 70a5b0fc→691a7403 = **7.220 s** (2h00'20" — xem F-144-T2-1: prereg ghi nhầm 7.280 s).
- Nguồn quan sát mốc cuối mù: LIMITS gộp 143 mtime 05:38:23Z (main chat sửa §12.2 sau khi T10 đóng — ghi rõ, không phải file của luồng); T10-143 count-final 05:27:50Z; round143-t10.done 05:31:18Z; GAP_ANALYSIS 05:32:22Z; build-loop-log 05:45:23Z (sau probe #63); marker round-in-progress.md mtime 05:36:50Z (marker đợt 144 — cron 05:35Z, boot 691a7403).

### 2.2 Đánh số + đồng hồ — đã có chuẩn parent (không còn xung đột)

- **Quyết parent đợt 143 (§12.2, ghi trong MEMORY.md): ĐẾM CHẶT làm chuẩn từ đợt 144** — b47f7932 = #103?, 9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?. Nhãn (d) đợt 142 (9afdaa89 = #103?, 70a5b0fc = #104?, 691a7403 = #105?) **BỊ THAY THẾ**. LIMITS này dùng đếm chặt xuyên suốt; nhãn cũ chỉ nhắc khi đối chiếu.
- **CERT 63 / FULL 78 ĐÃ XÁC NHẬN** (parent). **Khung chết ĐÃ XÁC NHẬN: #102? (23:52:41Z, 23:53:38Z] 57 s; boot 9afdaa89 (01:45:44Z, 01:55:25Z] 581 s = #104? chặt.** Full boot_id b47f7932 **ĐỂ MỞ** (T7 vs T9 mâu thuẫn, không còn boot để đo lại).
- **Parent BÁC cả hai đề xuất của T2-143 cho mù #62** (continuity dòng-log làm closer cho đoạn C; floor cơ học = 0 cho gap 42 s đoạn B) — CERT giữ 63/78 theo hai đường đó. Hệ quả cho đợt này: gap 42 s + 7.265 s chỉ còn có thể chứng nhận bằng **mốc mới** trong hố — recheck §2.6 tìm được **0 mốc mới** → cả hai **VẪN SPAN, không còn đường sống**.
- **Đồng hồ:** F105? ≈ −0 s đến −1 s (§1). F104? ≈ −0 s đến −1 s (đợt 143). F103? chưa đo. Dải offset started_at ~30–50 s giữ vững (chuỗi offset boot đúng: 34/37/32/35 s — T7-144 kiểm tiếp). Btime các gap lấy theo RTC, không bị drift guest ảnh hưởng.
- **Lệch brief — ghi rõ (F-144-T2-7):** brief yêu cầu "chứng nhận bằng merged mù #63: gap #103?→#104? và #104?→#105?" — theo đếm chặt đó là gap 42 s (đoạn B mù #62) và 7.265 s (đoạn C mù #62), cả hai đều **nằm ngoài cửa sổ mù #63**. Merged mù #63 không thể chứng nhận trực tiếp hai gap này. T2-144 xử lý đúng phạm vi: (a) recheck mù #62 đoạn B+C bằng đủ 5 phạm vi (§2.6); (b) chứng nhận gap mà merged mù #63 chứng nhận được: #105?→#106? = 7.220 s (§2.4/§2.5).

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác float:**
- repo-1: **11 file** (đoạn A 4, đoạn B 7); hidden_files: **460 file** (đoạn A 73, đoạn B 387). Tổng **466 mốc float khác nhau / 278 mốc giây khác nhau**.
- Đoạn A: **76 mốc**, gap lớn nhất **1.524 s** (03:29:51→03:55:15). Đoạn B: **390 mốc**, gap lớn nhất **268 s** (05:32:22→05:36:50).

**Sessions (`~/workspace/agents/`, 280 exec-log, 280 file có birth/mtime dùng được — tăng 17 so với đợt 143):**
- Bắc cầu: A-lo **3** session, A-hi **1**, B-lo **5**, B-hi **0**.
- Chạm đoạn: A **15**, B **25** session.
- Nhân chứng nhảy (jump witness): **0 tại 691a7403** (|X| < 104 s; session mtime cuối trước 03:54:01Z; birth đầu sau 03:57:17Z).
- Nhắc boot trong exec-log trong mù: 70a5b0fc **18**, 691a7403 **17**.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **90 file** trong mù #63 (đoạn A 26, đoạn B 64). /tmp: **696 file — tất cả trong đoạn B** (tmpfs bị xóa bởi #30). Goals ngoài hidden_files: **0 file** trong mù #63. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **0 file**.
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: A-tail **3 / 0 / 0 / 2** (exec-log 03:40:44, 03:51:50, 03:54:01 + sampler T9 03:55:15 ×2 file); B-tail **19 / 15 / 4 / 145**.

**Sạch ranh giới:** 691a7403 SẠCH (0 file trong [btime−10 s, btime] và 0 file trong (btime, +10 s]).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**355 mốc giây khác nhau** (repo-1 11, hidden_files 268, ngoài cây 57, /tmp 49). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| A | 63 | **666 s** (03:40:44→03:51:50) | 407 s / 349 s | 02:49:54 (12 s) | 03:55:15 (30 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| B | 291 | **208 s** (05:27:50→05:31:18) | 205 s / 181 s | 03:56:19 (34 s) | 05:43:31 (1 s) | **ĐÓNG — luật gap + uptime trực tiếp** |

**Đoạn A — ĐÓNG (max 0 ẩn).** Gap lớn nhất merged 666 s < sàn 1.147 s; floor(666/1147)=0. Merged thu hẹp hố hai cây (1.524 s, 03:29:51→03:55:15) nhờ 3 mốc exec-log trong A-tail (03:40:44, 03:51:50, 03:54:01Z) + mốc sampler 03:55:15Z. Hỗ trợ (không cần cho verdict): session `proc_ffa1c1b7b8da` bắc cầu A-hi (birth 03:31:45, mtime 03:40:44); session `proc_9a39bb7a8230` sinh 03:42:50Z **trong hố merged** (03:40:44→03:51:50), mtime 03:51:50Z. Mốc đầu merged 02:49:54Z (head 12 s — mốc 02:49:42Z đúng tại B0 bị loại bởi quy ước merged `> B0` nghiêm ngặt; hai cây độ chính xác float vẫn ghi head 0 s — xem F-144-T2-6, không đổi verdict).

**Đoạn B — ĐÓNG (luật gap + uptime trực tiếp).** Gap lớn nhất 208 s < sàn 1.147 s (floor=0); mốc đầu 03:56:19Z (head 34 s); mốc cuối 05:43:31Z (tail 1 s). Uptime trực tiếp xác minh boot 691a7403 sống liên tục từ 03:55:45Z tới probe #63 (§1) củng cố độc lập. 5 session bắc cầu B-lo; 0 session bắc cầu B-hi (không cần — uptime trực tiếp đã đóng).

**Khung chết (ứng viên merged — chờ parent xác nhận làm chuẩn):**
- **#105? (boot 70a5b0fc): (03:55:15Z, 03:55:45Z] = 30 s.** Mốc cuối đoạn A merged. **Trùng khớp hoàn toàn** khung quan sát của T9-143 ((03:55:15Z, 03:55:45Z] 30 s) — merged KHÔNG thu hẹp thêm (không có mốc nào trong (03:55:15Z, 03:55:45Z]).
- **#103? (boot b47f7932): (23:53:38Z, 23:54:20Z] = 42 s.** Khung quan sát T9-142; hai mốc 23:53:38Z là last-write sampler boot cũ (mơ hồ — xem T2-143 §2.3/§2.4). Recheck §2.6 tìm 0 mốc mới — khung không đổi. Trình bày làm ứng viên chờ parent xác nhận (cùng địa vị như hai khung đã xác nhận ở đợt 143).

### 2.5 Phân phối gap — CERT 64 / FULL 79

- **Gap mới CHỨNG NHẬN: 70a5b0fc→691a7403 = [7.210, 7.230] s, giữa 7.220 s (2h00'20")** — đoạn A đóng, đoạn B đóng bằng uptime. → **CERT 63→64, FULL 78→79.**
- **CERT64 (mới, đợt 144):** n=64, mean **1h34'20"**, median **1h49'58"**, p10 **0h26'45"**, p90 **2h15'26"**, sd **0h44'58"**, min **0h00'55"**, max **3h14'08"**.
- **FULL79 (mới, đợt 144):** n=79, mean **1h40'27"**, median **1h53'00"**, p10 **0h27'29"**, p90 **2h24'30"**, sd **0h55'04"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **41**, <60' = **18**, >180' = **6**, >240' = **2**.
- Nhạy LO/HI: CERT64-LO/HI và FULL79-LO/HI giống nhau từng giây (khoảng ±10 s không làm dịch số đã làm tròn). Nhỏ.
- Đối chiếu: script chạy lại `blind62-gaps.py` nguyên văn tái tạo **chính xác** CERT63/FULL78 của T2-143 (CERT63 mean 1h33'56" median 1h49'17" p10 0h26'37" p90 2h15'43" sd 0h45'12"; FULL78 mean 1h40'11" median 1h51'50" p10 0h27'21" p90 2h24'40" sd 0h55'22"; 40/18/6/2) — chuỗi tính toán nguyên vẹn. (Lưu ý: chuỗi exec cũng in một CERT63 khác — mean 1h33'32" sd 0h45'34" — đó là biến thể ba-gap giả định của T2-142, xem F-143-T2-7; không phải CERT63 mới.)
- **Caveat tên gọi:** CERT64 (mới, đợt 144) có cùng n=64 và gần như cùng số liệu với biến thể CERT64a giả định của T2-143 (mean 1h34'21" vs 1h34'20" — chênh 1 s; median/p10/p90/sd giống hệt) vì gap chứng nhận thật (7.220 s) gần bằng gap giả định của biến thể đó (7.265 s). Hai cái khác nhau: **CERT64 chứng nhận gap 70a5b0fc→691a7403 = 7.220 s thật; CERT64a giả định gap 9afdaa89→70a5b0fc = 7.265 s (đã bị parent bác)**. Trong LIMITS này "CERT64" luôn là **CERT64 (mới, đợt 144)**.
- **SPAN (không chứng nhận):** b47f7932→9afdaa89 = **42 s** (đoạn B mù #62 không chứng nhận được; recheck 0 mốc mới; parent bác floor-0); 9afdaa89→70a5b0fc = **7.265 s** (đoạn C mù #62 mở, tối đa 2 ẩn; recheck 0 mốc nội bộ mới; parent bác continuity). Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL (cộng sẽ đếm trùng).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Hai biến thể (a)/(b) của T2-143 cho mù #62 đã bị parent bác (quyết 143 §12.2) — không tính lại, không đề xuất.
- Dải chứng nhận không đổi: [0h00'55", 3h14'08"].
- **Dải (band) cho boot mới:**
  - 691a7403 làm #106? (đếm chặt, chuẩn), dải FULL78 neo #105? 01:55:25Z: **[02:22:45Z, 04:20:05Z]** — btime thực 03:55:45Z **INSIDE**. Dải FULL79 [02:22:54Z, 04:19:55Z] — cũng **INSIDE**.
  - **Chuỗi INSIDE = 2 theo đếm chặt (chuẩn parent từ đợt 144) — ĐÍNH CHÍNH chuỗi 4 đã công bố ở T2-143 / LIMITS gộp đợt 143 §2 (xem F-144-T2-8).** Chuỗi 4 dùng dải của 9afdaa89 neo tại bde599df (nhãn (d) cũ — bỏ qua boot trung gian b47f7932). Theo đếm chặt, dải của mỗi boot neo tại boot tiền nhiệm trực tiếp của nó; T6-144 tính độc lập (F-144-T6-1) và T2-144 xác minh lại bằng code:
    - b47f7932 (#103?) neo bde599df 22:48:05Z, FULL77 [23:15:16Z, 01:12:54Z] — 23:53:38Z INSIDE (chuỗi 1).
    - 9afdaa89 (#104?) neo b47f7932 23:53:38Z, FULL77 [00:20:49Z, 02:18:27Z] (T6 ghi [00:20:50Z, 02:18:28Z] — chênh 1 s làm tròn p10 1.631,80 s; verdict không đổi) — 23:54:20Z OUTSIDE (gap 42 s < cận dưới p10 1.632 s; dải FULL78 [00:20:58Z, 02:18:18Z] và FULL79 [00:21:07Z, 02:18:08Z] cùng verdict) → chuỗi ĐỨT, về 0.
    - 70a5b0fc (#105?) neo 9afdaa89 23:54:20Z, FULL77 [00:21:31Z, 02:19:09Z] — 01:55:25Z INSIDE (chuỗi 1).
    - 691a7403 (#106?) neo 70a5b0fc 01:55:25Z, FULL78 [02:22:45Z, 04:20:05Z] — 03:55:45Z INSIDE (chuỗi 2).
    - cc222c8a (#107?, hậu nghiệm) neo 691a7403 03:55:45Z, FULL79 [04:23:14Z, 06:20:15Z] — 05:53:15Z INSIDE (chuỗi 3 nếu tính cả boot này — T2-145 xác nhận chính thức).
    - Cách tính cũ (chuỗi 4) neo 9afdaa89 tại bde599df: [23:15:16Z, 01:12:54Z] — 23:54:20Z INSIDE — nhưng cách neo này bỏ qua boot trung gian b47f7932, mâu thuẫn với chuẩn đếm chặt parent đã chọn; T2-144 bỏ cách tính cũ, dùng chuỗi 2 làm số làm việc, chờ parent xác nhận (câu hỏi §4.5(6)).
  - Boot tiếp theo sau 691a7403 (#107? chặt), dải FULL79 neo 03:55:45Z: **[04:23:14Z, 06:20:15Z]**. Dải FULL78: [04:23:05Z, 06:20:25Z] (để đối chiếu; dải chuẩn cho đợt sau là FULL79).
- **Tốc độ reboot:** **106 reboot / 199,63 h = 1 lần / 113,0 phút** (105 + sự kiện #30; từ boot #1 2026-11-10T20:18:10Z tới 691a7403). Chuỗi lũy kế tới **119 / 199,63 h = 1 lần / 100,7 phút** (+4 mù #29/30/31 →110; +3 mù #53B →113; +2 mù #55B conv →115; +1 mù #56A conv →116; +0 #57–#60, mù #61A →116; +1 mù #61B →117; +0 mù #61C, mù #62A, mù #62B rule-max-0 →117; +2 mù #62C →119; +0 mù #63A, mù #63B →119). Tổng dung lượng: 55B max 3 → **120 (1 lần / 99,8 phút)**; 56A max 3 → **122 (1 lần / 98,2 phút)**.

### 2.6 Recheck mù #62 đoạn B + C (điều kiện duy nhất còn lại cho hai gap SPAN)

- Chạy lại đủ 5 phạm vi trên hai hố merged của T2-143:
  - Hố đoạn B (23:53:38Z, 23:54:20Z] 18/11: **1 file — mốc ĐÃ BIẾT 23:53:40Z** (T5 `ram-sampler.log`). **0 mốc MỚI.**
  - Hố đoạn C (00:51:51Z, 01:32:15Z] 19/11: **1 file — mốc ĐÃ BIẾT tại điểm cuối hố 01:32:15Z** (exec-log vòng monitor `proc_701a6c972da0.log` — mốc KẾT THÚC hố 2.424 s). **0 mốc nội bộ MỚI.**
- **Kết luận: hai gap 42 s + 7.265 s VẪN SPAN.** Không còn đường chứng nhận nào chưa thử (parent đã bác continuity + floor-0; recheck mốc mới = 0). Hai gap này ở lại SPAN trừ khi có bằng chứng hoàn toàn mới từ nguồn khác.

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Mù #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới).

### 2.8 Quét WFS #50 (05:53:20–05:53:42Z — chạy trên boot mới cc222c8a, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 964 dòng / 271 file** (phạm vi 3.198 file). **R7b: 989 / 288** (phạm vi 12.591 file). **Copies: 25 / 17** (không đổi). Đối chiếu 964+25=989=R7b, **chênh 0 — lần thứ 50 liên tiếp**.
- Delta so với #49 (963/270): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND143_T5_INFRA_LIMITS.md:1` — file này hoàn thành lúc 03:29:26Z, SAU quét #49 (03:04:25–03:04:57Z) nên lúc #49 nó đang ghi dở (0 hit) và nay đủ 1 hit (dòng 635). Cùng bẫy "đếm dở" như F-143-T2-7.
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7**, `apps/web/src/media.ts` **2c384ed1**, `apps/web/vite.config.ts` **ee80d093** — không đổi.

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray**. Thêm 1 bản copy build `apps/desktop/dist/services/epermRetry.js:116` — md5 **giống hệt** bản src (112891d5) — là artifact build, không phải helper mới.

### 2.10 Quét EPERM trong mù #63

- **105 file *.log** có mtime trong mù #63 (0 repo-1, 105 hidden_files). Đếm: "sóng EPERM vẫn bật" **0**, "CẢNH BÁO" **0**, "Operation not permitted" **0**, "sóng EPERM đã tắt" **5** — tất cả là false positive đã biết của launcher O8 (T8 `o8-143t8.log` ×3 mốc 03:58:14/03:59:17/04:00:13Z + T10 `t10-o8.log` ×2 mốc 05:25:21/05:26:12Z). Mở rộng raw: 11 lần / 11 unique (5 launcher + 6 dòng test-pass `hasEperm`). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~185,5 h** trước probe #63). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot #31 TRONG PHIÊN T2-144 (sau probe #63 — ngoài cửa sổ mù #63)

- **Reboot #31: 691a7403 → cc222c8a, btime 05:53:15Z** (epoch 1795067595; phát hiện lúc 05:56:55Z khi kiểm boot lúc đóng). Boot mới `cc222c8a-d8e2-4244-bcbc-1997b4099864`; `uptime -s` 2026-11-19 05:53:15; `who -b` Nov 19 05:53; journal 1 boot, entry đầu 05:53:31Z = btime +16 s.
- Gap danh nghĩa 691a7403→cc222c8a = **7.050 s (1h57'30")** — CHƯA chứng nhận (cần merged mù #64, T2-145). Mù #64 mở: probe #63 (05:43:32Z) → probe #64.
- **Kiểm hậu nghiệm (KHÔNG phải dự báo prereg — dải tính lúc ~05:55Z, sau khi btime đã biết; dải không dùng btime mới):** btime 05:53:15Z NẰM TRONG dải FULL79 #107? [04:23:14Z, 06:20:15Z]. Chuỗi INSIDE lên **3** nếu tính cả boot này (xem F-144-T2-8) — T2-145 xác nhận chính thức bằng probe #64 + merged mù #64.
- **Không ảnh hưởng verdict mù #63:** mọi số liệu mù #63 là dữ liệu file lịch sử trong cửa sổ đã đóng (02:49:42Z→05:43:32Z); reboot xảy ra sau khi probe #63 xong và sau khi các script investigate/sessions/merged/recheck/sweep/ram-max đã chạy xong (đều exit 0, output đầy đủ). WFS scan chạy 05:53:20–05:53:42Z trên boot mới nhưng chỉ đếm nội dung file — không ảnh hưởng.
- **dpkg.log trên boot mới — reset bởi replay của nền tảng:** lúc 05:43Z (boot 691a7403): 1.545 dòng / 114.190 B, cuối 04:00:38Z. Lúc 05:57Z (boot cc222c8a): **1.368 dòng / 114.190 B, dòng đầu 05:54:03Z, dòng cuối 05:57:30Z** (gstreamer1.0-tools 1.24.2-1ubuntu0.2 — replay ĐANG CHẠY). **0 dòng trước 05:54:03Z** trong file hiện tại; **không có dpkg.log.1**. `/var/log/apt/history.log` cho thấy apt-get của hatch os-intent (`/var/lib/hatch/os-intent/dpkg-state.txt`, replay-reset) đang cài lại gstreamer1.0-tools 1.24.2-1ubuntu0.2 lúc 05:57:30Z. Tức là **mỗi lần reboot, dpkg.log bị reset và replay ghi lại từ đầu** — lịch sử replay của boot cũ không còn trong file live (chỉ còn trong apt history.log + os-intent state). Trùng byte size 114.190 ở cả hai lần đọc là trùng hợp thời điểm (file đang tăng lúc đọc lần 2) — xem F-144-T2-5. **T2 KHÔNG kết luận stillborn/sống cho boot cc222c8a** — bracket replay/postboot của boot này thuộc T5-144.
- **dmesg KHÔNG đọc được trong phiên này** (`dmesg: read kernel buffer failed: Operation not permitted`). journalctl đọc được (1 boot mỗi boot); /proc đọc được (btime, boot_id, meminfo).

## 3. RAM trong mù #63 (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh mù #63: 2.592 MiB (T4 poll #11, 02:50:04Z, đoạn A) = 42,19% guard 6.144 MiB**, thiếu ~3.552 MiB. Đối chứng: sampler T9 vòng 1 đọc 2.629.332 kB = 2.567,7 MiB lúc 02:50:11Z (thấp hơn — RAM đã hạ trong 7 s; T4 dùng `free -m`, cột available, đơn vị MiB — hai nguồn nhất quán trong sai số làm tròn + thời điểm).
- Đỉnh từng đoạn: A **2.592 MiB** 02:50:04Z; B **2.472 MiB** (T4 poll #7, 04:01:22Z) = 40,23% guard — đối chứng sampler 2.423.852 kB = 2.367,0 MiB lúc 04:01:52Z.
- **0 mẫu ≥ guard; birefnet KHÔNG thử** (không thuộc brief; quyết parent — giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Số riêng của script ram-max (lower bound): 203 mẫu; A 2.592 MB, B 2.472 MB — khớp đọc tay lần này (ram-max bắt được dòng poll T4).
- Lưu ý: đỉnh cửa sổ đợt 143 của T9-143 là 2.778.188 kB lúc 02:49:11Z — **31 s TRƯỚC khi mù #63 bắt đầu (02:49:42Z) nên KHÔNG thuộc mù #63**. Đỉnh mù #63 thấp hơn đỉnh mù #62 (48,70% guard).
- **Headroom:** theo dõi theo quyết parent (lần thứ 3 liên tiếp dưới ngưỡng 1.498 ở đợt 143 — nhắc một dòng, không hành động); số đo mới thuộc T9-144.

## 4. Ghi chú phương pháp + sai số của chính T2-144 + đối chiếu prereg

### 4.1 Danh sách sai số F-144-T2-n

- **F-144-T2-1 — Prereg tính sai gap danh nghĩa 7.280 s thay vì 7.220 s.** Prereg trừ 01:55:25Z khỏi 03:55:45Z ra 2h01'20" (7.280 s); đúng là **2h00'20" (7.220 s)** — aggregate đợt 143 §8 đã ghi boot cũ sống 2h00m20s. Mọi số chứng nhận trong LIMITS này dùng 7.220 s / khoảng [7.210, 7.230] s; các số 7.280 s trong prereg bị thay thế. Không ảnh hưởng verdict dải (dải dùng p10/p90, không dùng gap). **T6-144 xác nhận độc lập (F-144-T6-2: epoch 1795060545 − 1795053325 = 7.220 s; khoảng [7.210, 7.230] s) — trùng khớp số chứng nhận trong LIMITS này.**
- **F-144-T2-2 — Prereg dải FULL78 sai 1 s làm tròn.** Prereg dự báo dải #107? FULL78 [04:23:06Z, 06:20:25Z]; script tính chính xác [04:23:05Z, 06:20:25Z] (p10 lẻ giây). Dải chuẩn FULL79 [04:23:14Z, 06:20:15Z] không bị ảnh hưởng. Cùng lớp F-143-T2-3.
- **F-144-T2-3 — Recheck62bc lần đầu gán nhầm mốc đã biết thành "NEW".** `fmt()` in timestamp không có hậu tố Z trong khi danh sách known có Z → so sánh trượt; đồng thời hố đoạn C bao cả điểm cuối 01:32:15Z (mốc đã biết kết thúc hố) nhưng known-list để trống. Đã sửa (known không Z; điểm cuối tính là KNOWN) và chạy lại — log sạch: cả hai hố chỉ có mốc KNOWN, 0 mốc mới. Bài học: so sánh timestamp bằng đúng định dạng hàm in ra.
- **F-144-T2-4 — Adapt-script bỏ sót số lần xuất hiện (ram-max).** `rep("blind#62"→"blind#63")` trong ram-max62.py gặp 5 chỗ, không phải 1 — assert bắt được, đã sắp lại (rep cụ thể trước, rep chung sau với count=2) trước khi chạy. Không ảnh hưởng kết quả (adapt chạy trước khi đo). Cùng lớp F-143-T2-4.
- **F-144-T2-5 — Trùng byte size dpkg.log ở hai lần đọc (114.190 B).** Lần 1 (05:43Z, boot 691a7403): 1.545 dòng, cuối 04:00:38Z. Lần 2 (05:57Z, boot cc222c8a): 1.368 dòng, đầu 05:54:03Z, cuối 05:57:30Z (replay đang chạy, file đang tăng). Cùng 114.190 B là trùng hợp thời điểm đọc — không dùng làm bằng chứng gì; cơ chế reset (os-intent replay-reset) đã xác định qua apt history.log (§2.11). T5-144 sở hữu bracket replay boot mới.
- **F-144-T2-6 — Mốc đầu merged đoạn A (02:49:54Z) khác mốc đầu hai cây (02:49:42Z).** Quy ước merged loại mốc đúng tại B0 (`> B0` nghiêm ngặt), hai cây lấy `>= B0`. Cùng quy ước với T2-143; head 12 s vs 0 s, cấu trúc gap không đổi, verdict không đổi.
- **F-144-T2-7 — Lệch brief (ghi ở prereg, không phải sai số đo).** Brief yêu cầu chứng nhận hai gap mù #62 "bằng merged mù #63" — hai gap nằm ngoài cửa sổ mù #63. T2 xử lý đúng phạm vi: recheck mù #62 (§2.6, 0 mốc mới) + chứng nhận gap mù #63 chứng nhận được (#105?→#106? = 7.220 s). Hai gap brief vẫn SPAN.
- **F-144-T2-8 — Đính chính chuỗi INSIDE 4 → 2 (bổ sung sau khi T6-144 đóng cờ; T6 phát hiện độc lập F-144-T6-1, T2-144 xác minh lại bằng code).** Chuỗi 4 công bố ở T2-143 / LIMITS gộp đợt 143 §2 neo dải 9afdaa89 tại bde599df (nhãn (d) cũ — bỏ qua boot trung gian b47f7932). Theo đếm chặt (chuẩn parent từ đợt 144), dải mỗi boot neo tại boot tiền nhiệm trực tiếp: 9afdaa89 neo b47f7932 23:53:38Z → FULL77 [00:20:49Z, 02:18:27Z] (T6 ghi [00:20:50Z, 02:18:28Z] — chênh 1 s do làm tròn p10 = 1.631,80 s; verdict không đổi), btime 23:54:20Z OUTSIDE (gap 42 s < cận dưới p10 1.632 s). Dải FULL78 [00:20:58Z, 02:18:18Z] và FULL79 [00:21:07Z, 02:18:08Z] cùng verdict OUTSIDE. Chuỗi đúng: b47f7932 INSIDE (1) → 9afdaa89 OUTSIDE (đứt, về 0) → 70a5b0fc INSIDE (1) → 691a7403 INSIDE (2) → cc222c8a INSIDE hậu nghiệm (3). T2-144 dùng chuỗi 2 làm số làm việc; các chỗ đã sửa trong LIMITS này: §0 (chuỗi lên 3 thay vì 5), §2.5 (chuỗi 2 thay vì 4), §2.11 (chuỗi lên 3 thay vì 5), §4.5(3) (chuỗi lên 3 thay vì 5). Aggregate đợt 143 §2 và MEMORY.md vẫn ghi chuỗi 4 theo cách tính cũ — parent hòa giải ở §4.5(6).

### 4.2 Đối chiếu prereg — thực tế

| Dự báo prereg (~05:42Z) | Thực tế | Verdict |
|---|---|---|
| Probe #63 ok=2 fail=0, boot 691a7403, log +3 | Đúng y hệt (§1) | ✓ |
| Boot 691a7403, btime 03:55:45Z | Đúng (§1, 2 lần xác minh) | ✓ |
| Đoạn A đóng theo mật độ | Đóng — merged gap max 666 s < sàn (F-144-T2-1 không ảnh hưởng) | ✓ |
| Đoạn B đóng theo uptime | Đóng (gap 208 s + uptime trực tiếp) | ✓ |
| Gap #105?→#106? = 7.280 s → [7.270, 7.290] | **SAI số — đúng 7.220 s → [7.210, 7.230]** (F-144-T2-1) | ✗ (số) / ✓ (verdict chứng nhận) |
| Gap 42 s + 7.265 s vẫn SPAN sau recheck | Đúng — 0 mốc mới, vẫn SPAN (§2.6) | ✓ |
| Dải #107? FULL78 [04:23:06Z, 06:20:25Z] | [04:23:05Z, 06:20:25Z] (sai 1 s làm tròn — F-144-T2-2) | ✓ (1 s) |
| Khung chết 70a5b0fc hẹp hơn 30 s của T9 | **SAI — vẫn đúng 30 s** (03:55:15Z, 03:55:45Z], không thu hẹp thêm | ✗ |
| Khung chết b47f7932 không đổi (42 s) | Đúng — (23:53:38Z, 23:54:20Z] 42 s | ✓ |
| EPERM 0 sóng | Đúng (§2.10) | ✓ |
| WFS giải thích bằng diff, không đoán trước | +1/+1, giải thích đầy đủ (§2.8) | ✓ |
| RAM đỉnh mù #63 ≤ ~48,70% guard | Đúng: 42,19% (thấp hơn dự báo trần) | ✓ |
| dpkg: đọc trước, không dự báo hình dạng | Sống 1.545 dòng (khớp T9-143) | ✓ (thận trọng đúng) |
| F105? ≈ −1 s đến −2 s | −0 s đến −1 s (trong sai số ±~1 s) | ✓ |

### 4.3 Phương pháp (ghi lại để đợt sau dùng)

- Merged 4 phạm vi: repo-1 + hidden_files + ngoài cây + /tmp, độ chính xác giây; hai cây độ chính xác float để đối chiếu; sessions (`~/workspace/agents/` exec-logs, birth/mtime) để bắc cầu + nhân chứng nhảy; phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats). Đừng bỏ sót phạm vi (F-136-T2-8).
- Gap chứng nhận = [mid−10 s, mid+10 s] khi đoạn trước đóng; SPAN khi đoạn mở/không chứng nhận được. Luật gap: floor(gap_max/1.147 s) = số ẩn tối đa.
- Bằng chứng nội dung (timestamp trong nội dung file, sampler continuity) là **hỗ trợ, không phải closer** — theo quyết parent đợt 143 (bác đề xuất cho mù #62). Áp dụng nhất quán.
- WFS giải thích delta bằng diff, không đoán trước số. RAM đọc tay sampler log (ram-max chỉ là lower bound). dpkg đọc trước, không dự báo hình dạng replay (F-142-T2-3). **MỚI: dpkg.log bị reset mỗi reboot bởi hatch os-intent replay-reset** — muốn lịch sử replay boot cũ thì đọc `/var/log/apt/history.log` + os-intent state, không trông chờ file live.
- Recheck hố: so sánh timestamp bằng đúng định dạng hàm in ra (F-144-T2-3); điểm cuối hố (mốc kết thúc đã biết) tính là KNOWN, không phải mốc mới.
- Tính gap danh nghĩa bằng epoch (code), không trừ nhẩm giờ-phút (F-144-T2-1).

### 4.4 Độc lập đối chiếu với T1-144

- T1-144 (verify đợt 143, đã đóng — cờ `round144-t1.done`): đợt 143 = **9 batch / 11 entry / 11 file**; lũy kế 111–143 = **323/679/579**; chờ push 136–143 = **81 file duy nhất** — KHỚP số công bố đợt 143 (T10-143). T2-144 dùng các số này làm cơ số chờ push (§5.4).
- T1-144 bổ sung (handoff): parent ĐÃ QUYẾT §12.2 đợt 143 — đếm chặt làm chuẩn; CERT 63/FULL 78 xác nhận; khung chết #102?/9afdaa89 xác nhận; full boot_id b47f7932 để mở; bác cả hai đề xuất mù #62 — **đã áp dụng làm chuẩn trong LIMITS này**, chỉ câu hỏi mới ở §4.5.

### 4.5 Câu hỏi MỚI cho parent (chỉ phát sinh ở đợt 144 — các quyết cũ đã áp dụng làm chuẩn, không hỏi lại)

1. **CERT 64 / FULL 79 (mới, đợt 144) — xác nhận?** Gap 70a5b0fc→691a7403 = [7.210, 7.230] s chứng nhận (mù #63 đóng hoàn toàn — mù đầu tiên đóng hoàn toàn kể từ #60). Caveat: CERT64 gần trùng số liệu với biến thể CERT64a giả định đợt 143 (đã bị bác) — xem §2.5, không lẫn.
2. **Khung chết #105? (03:55:15Z, 03:55:45Z] (30 s) + khung #103? (23:53:38Z, 23:54:20Z] (42 s) — chốt làm chuẩn?** Khung #105? trùng khớp hoàn toàn khung quan sát T9-143; khung #103? không đổi sau recheck 0 mốc mới.
3. **Reboot #31 (691a7403 → cc222c8a, btime 05:53:15Z, trong phiên T2-144) — xác nhận là sự kiện #31?** Theo quy tắc đứng (mỗi lần đổi boot_id là 1 sự kiện). Btime 05:53:15Z nằm trong dải FULL79 #107? [04:23:14Z, 06:20:15Z] (kiểm hậu nghiệm — chuỗi INSIDE lên 3 nếu tính cả boot này; T2-145 xác nhận chính thức bằng probe #64 + merged mù #64). Gap danh nghĩa 691a7403→cc222c8a = 7.050 s chờ chứng nhận ở đợt 145.
4. **dpkg.log bị reset mỗi reboot (os-intent replay-reset) — có cần quy trình mới cho T5?** Lịch sử replay boot cũ không còn trong file live (chỉ còn apt history.log + os-intent state). T5-144 kiểm boot cc222c8a như thường lệ; parent quyết có cần T5 lưu snapshot dpkg.log trước mỗi reboot (không làm được từ trong cell — reboot bất ngờ) hay chấp nhận đọc apt history.log thay thế.
5. **Mù #63 đóng hoàn toàn — có ghi nhận chuỗi mù đóng hoàn toàn bắt đầu lại ở 1 (#63)?** (#57–#60 đóng, #61/#62 mở, #63 đóng.)
6. **Chuỗi INSIDE: 2 (đếm chặt) hay 4 (cách tính cũ)?** T2-144 đính chính chuỗi 4 → 2 (F-144-T2-8; T6-144 F-144-T6-1 xác nhận độc lập): 9afdaa89 OUTSIDE khi neo dải tại boot tiền nhiệm trực tiếp b47f7932 (gap 42 s < p10). Chuỗi 4 trong aggregate đợt 143 §2 / MEMORY.md neo 9afdaa89 tại bde599df (nhãn (d) cũ, bỏ qua boot trung gian). Parent chọn số nào làm chuẩn từ đợt 144? (T2-144 dùng 2 làm số làm việc; cc222c8a hậu nghiệm INSIDE đưa chuỗi lên 3 nếu tính cả boot này.)

## 5. File + stage

### 5.1 File của T2-144

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND144_T2_EPERM_LIMITS.md`
- Work dir: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round144-t2/` — prereg-t2.md, boot-verify.txt, f105.txt, dpkg105.txt, status1/once/status2 +.txt, blind63-investigate.py/.log, blind63-sessions.py/.log, sessions-all.txt, blind63-merged.py/.log, blind63-fifthscope.py/.log, blind63-gaps.py/.txt, eperm-sweep63.py + eperm-sweep-run.log, ram-max63.py + ram-max.txt, scan-wfs.sh + scan-meta.txt + files-*.bin + wfs-*.txt, recheck62bc.py/.log, blind63-repo-1.txt, blind63-hidden_files.txt, blind63-outside.txt, blind63-tmp.txt.
- Script adapt từ round143-t2 qua `/tmp/adapt63.py` (assert từng lần thay; các lỗi bỏ sót đã sửa — F-144-T2-4).

### 5.2 Stage

- Paths file (NUL-delimited, 1 entry — LIMITS này): `~/workspace/repo-1-push/paths-loop/phase9-round144-t2-eperm.txt` — verify bằng `od -c` sau khi ghi (phải thấy NUL, text-only, 0 binary). **KHÔNG PUSH** (chỉ stage; user push sau từ main chat).
- Cờ xong: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round144-t2.done` (1 dòng tóm tắt).

### 5.3 Cập nhật ngoài LIMITS

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md` — append mục đợt 144 (T2).
- `~/memory/2026-11-19.md` — append mục ngắn (không sửa MEMORY.md).

### 5.4 Trạng thái luồng khác lúc T2 đóng (~06:00Z)

- Đã đóng: **T1** (verify đợt 143, cờ `round144-t1.done`). Đang chạy: T4, T5, T6, T7, T8, T9, T10 (chưa có .done lúc T2 đóng).
- Tổng chờ push: đợt 136–143 = **81 file duy nhất** (T1-144 tái kiểm đúng) + 1 file oversize 6,4 MB chưa quyết + 1 file mới của T2-144 (LIMITS này); lũy kế đợt 144 chờ T10 (aggregate đợt 144 chưa có lúc T2 đóng).
- Boot lúc đóng phiên: **cc222c8a** (reboot #31 trong phiên, 05:53:15Z) — T2-144 không kiểm boot này ngoài xác minh boot_id/btime/journal (bracket replay/postboot thuộc T5-144).
- Marker round-in-progress.md vẫn tồn tại (xóa khi T10 đóng sổ).

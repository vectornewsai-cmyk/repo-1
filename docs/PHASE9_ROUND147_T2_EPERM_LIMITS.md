# PHASE9 ROUND147 T2 — EPERM probe #66 + mù #66 ĐÓNG HOÀN TOÀN (cả hai đoạn đóng theo luật gap, KHÔNG cần uptime) + khung chết #109? ứng viên 11 s + chuỗi INSIDE lên 6 — LIMITS

## 0. Headline

- **Probe EPERM #66: ok=2 fail=0, boot 6fb582df, 14:41:45Z.** Probe trước (#65) đã chết/stale 3h02'27" (n=65, ts 11:39:18Z, boot 98a7c93f). Log `eperm-probe-v2.log` 187 → **190 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #66 ĐÓNG HOÀN TOÀN — chuỗi mù đóng hoàn toàn lên 2 (sau 1 ở #65):** A **ĐÓNG** (merged gap lớn nhất 120 s < sàn 1.147 s, max 0 ẩn), B **ĐÓNG** (merged gap lớn nhất 937 s < sàn 1.147 s, max 0 ẩn). **Lần đầu tiên kể từ mù #64 đoạn C một đoạn boot sống đóng theo luật gap mà KHÔNG cần uptime** — và lần đầu cả hai đoạn của một mù cùng đóng theo luật gap. **Không cần viện tới chuẩn uptime-closure** (dù chuẩn 3 điều kiện đã xác nhận ở quyết 146 (b) vẫn đứng làm dự phòng).
- **Gap 8.363 s (98a7c93f→6fb582df): CHỨNG NHẬN [8.353, 8.373] s, giữa 8.363 s → CERT 66 / FULL 81.** Không có điều kiện — cả hai đoạn đóng theo luật gap. CERT66 mean 1h35'23", FULL81 mean 1h41'08".
- **Khung chết (ứng viên merged): #109? (boot 98a7c93f): (12:13:15Z, 12:13:26Z] 11 s** — HẸP (so với 599 s của #108?); khớp chính xác cửa sổ T4 (12:13:15Z, 12:13:26Z]; recheck toàn cây 0 mốc nội bộ mới (3 "hit" recheck chỉ là phần thập phân của chính mốc cạnh trái 12:13:15.670 — cùng bẫy F-146-T2-3).
- **Nghịch lý đồng hồ ≥23 s ĐÃ GIẢI THÍCH — khung chốt được:** các dấu vết boot cũ SAU btime theo đồng-hồ-cũ (T5 ram-sampler.log 12:13:29Z = btime+3 s; T4 load-mid/attempt-done 12:13:48Z/12:13:49Z = btime+22/23 s; dòng nội dung waiter T8 12:13:34Z, boot=98a7c93f) đều nằm SAU btime nên theo quy ước đứng (như mốc 09:54:09Z ở mù #65) KHÔNG dịch chuyển cạnh trái của khung. Sessions đối chiếu độc lập: mtime cuối trước btime 12:13:02Z (|X| < 24 s), birth đầu sau btime 12:13:40Z — nhất quán với khung 11 s.
- **Chuỗi INSIDE lên 6 (chính thức, đếm chặt):** 6fb582df INSIDE dải FULL80 #110? [10:21:41Z, 12:18:23Z] (btime thực 12:13:26Z). Dải #111? (FULL81, neo 12:13:26Z): [12:41:13Z, 14:37:37Z].
- **F108?: CHƯA ĐỦ 3 SERVER** (example +1, google +1; cloudflare 403 cả GET lẫn HEAD — chỉ còn 2 server đo được; theo chuẩn quyết 146 (f), không chấp nhận làm số đo F cho boot #110?).
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~194,5 h trước probe #66). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong mù #66: 6.752.292 kB = 6.594,0 MiB (T9 sampler, 11:52:06Z, đoạn A) = 107,32% guard 6.144 MiB** — đỉnh cửa sổ guard 11:51–11:53Z; **5 mẫu ≥ guard** trong đoạn A (T9 3 + T5 2); đoạn B (boot mới) tối đa 2.039.252 kB = 1.991,5 MiB = 32,41% guard (12:16:38Z). Balloon xả hẳn về 0 kB ở 3 mẫu đoạn A; balloon đóng băng 6.443.824 kB 76 mẫu đoạn B. Birefnet 0 thử (không thuộc brief; tự động hóa giao T9-147).
- **WFS #53: chênh 0 — lần thứ 53 liên tiếp.** NEWSTD 968 dòng / 275 file; R7b 993 / 292; copies 25 / 17. `preview.tsx` 530e10a7, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — không đổi.
- **KHÔNG có reboot mới trong phiên T2-147** (boot lúc đóng vẫn 6fb582df, kiểm 14:54:51Z) → **không mở mù #67**.
- **Quyết parent đợt 146 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** (CERT 65/FULL 80 xác nhận, chuẩn uptime-closure 3 điều kiện, khung chết #108? 599 s chốt, chuỗi INSIDE 5, F107? chưa đủ 3 server, reboot #34 xác nhận, 6fb582df = #110?, tuổi thọ boot 98a7c93f chuẩn 8.363 s) — không để mở chờ hòa giải nữa. Chỉ câu hỏi MỚI phát sinh ở đợt 147 ghi ở §4.5.

## 1. Checklist probe EPERM #66 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Đọc boot lúc mở phiên | 14:40:06Z | 6fb582df-455d-47cd-99dc-8bef48018536 (chỉ đọc boot_id, chưa probe — xem F-147-T2-1) |
| Xác minh boot lần 1 | 14:41:38Z | 6fb582df-455d-47cd-99dc-8bef48018536, btime 1795090406 = 12:13:26Z, `uptime -s` 2026-11-19 12:13:26, journal 1 boot, entry đầu 12:13:36Z = btime +10 s |
| Xác minh boot lần 2 | 14:41:45Z | Cùng boot_id/btime; MemAvailable 1.473.952 kB (1.439 MiB); free -m avail 1.406 MB |
| `status` | 14:41:45Z | **DEAD/STALE**, heartbeat n=65, ts 2026-11-19T11:39:18Z, boot 98a7c93f, tuổi **10.947 s (3h02'27")**, exit 1 (đo trực tiếp, không tee) |
| `once` | 14:41:45Z | **Probe #66, boot=6fb582df, ok=2 fail=0**, exit 0; dòng log `boot changed 98a7c93f -> 6fb582df (uptime since 2026-11-19 12:13:26)` |
| `status` lại | 14:41:45Z | **ALIVE**, tuổi 0 s, n=66, exit 0 |
| Log probe | 14:41:45Z | `eperm-probe-v2.log` 187 → **190 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=66, ts 2026-11-19T14:41:45Z, boot 6fb582df; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại sau once, ts=14:41:45Z, boot=6fb582df, n=66 — khớp |
| Xác minh boot lúc đóng | 14:54:51Z | **KHÔNG đổi boot — 6fb582df**, btime 12:13:26Z; journal vẫn đúng 1 boot; không có reboot mới trong phiên → không mở mù #67 |
| dpkg.log boot 6fb582df | 14:42:04Z | **1.545 dòng** (gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2, 12:16:22Z — replay xong ~4 phút sau btime), mtime 12:16:22Z. Bracket chính thức thuộc T5-146; đây là đọc độc lập để đối chiếu |
| F108? | 14:42:01–03Z | example.com Date +1 s, google.com +1 s, cloudflare.com **403 ERROR (GET + HEAD đều 403)** → **F108? CHƯA ĐỦ 3 SERVER** (chỉ 2 server đo được — xem F-147-T2-2) |

## 2. Điều tra mù #66

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Mù #66: 11:39:18Z 19/11 → 14:41:45Z 19/11 = 10.947 s (3h02'27")** — từ heartbeat cuối probe #65 tới probe #66.
- Một reboot bên trong (#34):

| Đoạn | Boot | Btime | Dài | Chết lúc |
|---|---|---|---|---|
| A | 98a7c93f (#109?) | 09:54:03Z 19/11 (1795082043) | 2.048 s (từ probe #65) | 12:13:26Z |
| B | 6fb582df (#110?) | 12:13:26Z 19/11 (1795090406) | 8.899 s (tới probe #66) | (còn sống — probe #66) |

- Gap danh nghĩa (btime − btime, tính bằng epoch): 98a7c93f→6fb582df = **8.363 s** (2h19'23" — đúng số chuẩn quyết 146 (q)).
- Nguồn quan sát mốc cuối mù: LIMITS gộp 146 mtime 14:27:40Z; T10-146 count-final 14:21:51Z; round146-t10.done 14:21:40Z; GAP_ANALYSIS 14:21:49Z; build-loop-log 14:39:51Z; marker round-in-progress.md không tồn tại lúc T2-147 mở. Tất cả các mốc này nằm trong đoạn B.

### 2.2 Đánh số + đồng hồ — đã có chuẩn parent (không còn xung đột)

- **Quyết parent đợt 146 (§12.3): ĐẾM CHẶT làm chuẩn** — 98a7c93f = #109?, **6fb582df = #110?**. LIMITS này dùng đếm chặt xuyên suốt.
- **CERT 65 / FULL 80 ĐÃ XÁC NHẬN** (quyết 146 (b)(c) — chuẩn cho tới khi gap 8.363 s được chứng nhận; xem §2.5). **Khung chết ĐÃ XÁC NHẬN: #108? (09:44:04Z, 09:54:03Z] 599 s (quyết 146 (d)); #107? (07:55:38Z, 07:56:16Z] 38 s; #106? thu hẹp (05:53:06Z, 05:53:15Z] 9 s.** Full boot_id b47f7932 **ĐỂ MỞ** (quyết (g) đợt 143 — ghi cả hai bản kèm nguồn ở §2.2 cuối, không tự chọn một bên).
- **Parent BÁC đề xuất continuity dòng-log làm closer cho mù #62** (quyết 143 §12.2) **và giữ nguyên phương pháp merged gap rule cho gap 7.050 s + 7.381 s** (quyết (f) đợt 145) — áp dụng nhất quán cho mù #66: sampler content + session-spanning chỉ là **hỗ trợ, KHÔNG phải closer** (§2.4/§2.6). Đợt này không cần viện tới uptime-closure vì cả hai đoạn đều đóng theo luật gap; chuẩn uptime-closure 3 điều kiện (quyết 146 (b)) chỉ là dự phòng đã đứng sẵn.
- **Đồng hồ:** F108? CHƯA ĐỦ 3 SERVER (§1 — example +1, google +1, cloudflare 403). F107? ≈ 0 s nhưng ghi chưa đủ 3 server (quyết 146 (f)). F106? ≈ −1 s (đợt 145). F105? ≈ −0 s đến −1 s (đợt 144). F104? ≈ −0 s đến −1 s (đợt 143). F103? chưa đo (boot đã chết). Dải offset started_at ~30–50 s giữ vững (chuỗi offset boot đúng: .../40/36 s — T7-147 kiểm tiếp). Btime các gap lấy theo RTC, không bị drift guest ảnh hưởng.
- **Nghịch lý đồng hồ đợt 146 (≥23 s) ĐÃ GIẢI THÍCH ở đợt này:** các dấu vết boot cũ theo đồng-hồ-cũ MUỘN HƠN btime boot mới tới 23 s (12:13:49Z so với 12:13:26Z) — nhưng tất cả đều nằm SAU btime, nên khung chết chốt theo btime (nguồn kernel) không bị ảnh hưởng; xem §2.4. Đây là lần đầu nghịch lý được phân rã tới từng file thay vì chỉ ghi "không chốt được".
- **Mâu thuẫn full boot_id b47f7932 — VẪN ĐỂ MỞ (không có dữ kiện mới, quyết (g) đợt 143):** hai bản ghi mâu thuẫn về full boot_id của boot #103? chưa hòa giải; T2-147 không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận.

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác float:**
- repo-1: **61 file**; hidden_files: **356 file**. Tổng **409 mốc float khác nhau / 249 mốc giây khác nhau** (hai cây gộp).
- Đoạn A: **218 mốc gộp**, gap lớn nhất **166 s** (11:54:09→11:56:55). Đoạn B: **191 mốc gộp**, gap lớn nhất **3.134 s** (12:59:07→13:51:21 — hố append-trong-file, xem §2.4: merged lấp đầy hố này, hai cây một mình phóng đại hố).

**Sessions (`~/workspace/agents/`, 306 exec-log, 306 file có birth/mtime dùng được — tăng 9 so với đợt 146):**
- Bắc cầu: A-lo **3** session, A-hi **3** (cùng 3 session — hai cắt giao nhau vì đoạn A ngắn hơn 2 sàn), B-lo **4**, B-hi **0** (không cần — luật gap đóng B).
- Chạm đoạn: A **20**, A-tail **7** (mtime cuối 12:13:02Z), B **19**, B-tail **2** session (sinh 14:40:36Z + 14:41:17Z — luồng đợt 147).
- Nhân chứng nhảy (jump witness): **0 tại 6fb582df** (|X| < 24 s; session mtime cuối trước 12:13:02Z; birth đầu sau 12:13:40Z).
- Nhắc boot trong exec-log trong mù: 98a7c93f **17**, 6fb582df **13**.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **140 file** trong mù #66 (74 mốc giây). /tmp: **685 file — tất cả trong đoạn B** (36 mốc giây; tmpfs bị xóa bởi #34, như đợt 144/145/146). Goals ngoài hidden_files: **0 file** trong mù #66. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **3 file** (11:57:14Z ×2 đoạn A — memory/bank/reflections.md + world.md; 14:29:54Z đoạn B — memory/2026-11-19.md).
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: A-tail **19 / 0 / 0 / 59** (exec-log 12:13:02, T4 attempt3 12:13:14–12:13:15); B-tail **3 / 1 / 1 / 26** (aggregate 14:27:40, build-loop-log 14:39:51, luồng đợt 147 14:40–14:41).

**Ranh giới:** 6fb582df: 0 file trong [btime−10 s, btime] (mốc cuối đoạn A 12:13:15Z cách btime 11 s); 1 file trong (btime, +10 s] (ram-sampler.log 12:13:29Z = btime +3 s — mẫu cuối sampler boot cũ theo đồng-hồ-cũ, xem §2.4).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**334 mốc giây khác nhau** (repo-1 37, hidden_files 214, ngoài cây 74, /tmp 36). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| A | 157 | **120 s** (11:59:12→12:01:12) | 116 s / 107 s | 11:39:19 (1 s) | 12:13:15 (11 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| B | 176 | **937 s** (13:05:21→13:20:58) | 738 s / 540 s | 12:13:29 (3 s) | 14:41:39 (6 s) | **ĐÓNG — max 0 ẩn** (luật gap) |

**Đoạn A — ĐÓNG (max 0 ẩn).** Gap lớn nhất merged 120 s < sàn 1.147 s; floor(120/1147)=0. Mốc đầu merged 11:39:19Z (head 1 s — chính probe #65); mốc cuối 12:13:15Z (tail 11 s — 3 file T4 attempt3: poll-t4.nohup2.log, run-webkit-t4-attempt3-98a7c93f.log, chain-t4.log). 3 session bắc cầu A-lo + 3 session bắc cầu A-hi (cùng 3 session — hai cắt giao nhau vì đoạn A 2.048 s < 2 sàn 2.294 s; xem F-147-T2-4 về cửa sổ sàn âm). 7 session chạm A-tail (mtime cuối 12:13:02Z).

**Đoạn B — ĐÓNG (max 0 ẩn, luật gap — KHÔNG cần uptime).** Gap lớn nhất merged 937 s < sàn 1.147 s; floor(937/1147)=0. Hố hai-cây 3.134 s (12:59:07→13:51:21) được lấp đầy bởi mốc merged ngoài cây + /tmp + sessions (cùng mẫu hố append-trong-file như đoạn B mù #65, nhưng lần này merged lấp đủ để gap < sàn). Hỗ trợ (KHÔNG phải closer): 4 session bắc cầu B-lo, 0 session bắc cầu B-hi (không cần — luật gap đã đóng); 1 session sinh trong hố (proc_c247b791bc3c birth 13:36:46 mtime 13:51:16 — session T7/T10 chạy xuyên hố). **Đây là lần đầu tiên kể từ mù #64 đoạn C một đoạn boot sống đóng theo luật gap mà không cần uptime** — closure của đoạn B không dựa vào bất kỳ lập luận nào ngoài merged gap. Chứng nhận gap 8.363 s do đó KHÔNG có điều kiện (§2.5).

**Khung chết (ứng viên merged — chờ parent xác nhận làm chuẩn):**
- **#109? (boot 98a7c93f): (12:13:15Z, 12:13:26Z] = 11 s.** Mốc cuối đoạn A merged. **HẸP** — hẹp nhất kể từ #106? 9 s; khớp chính xác cửa sổ T4 (12:13:15Z, 12:13:26Z]. Sessions đối chiếu độc lập: mtime cuối trước btime 12:13:02Z (|X| < 24 s) + birth đầu sau btime 12:13:40Z — nhất quán, không thu hẹp thêm nhưng cũng không mâu thuẫn.
- **Nghịch lý đồng hồ ≥23 s — ĐÃ GIẢI THÍCH, không còn là blocker:** phân rã tới từng file — (i) T5 `ram-sampler.log` 12:13:29Z = btime+3 s (mẫu cuối sampler boot cũ, `avail_kB=2746724`, ghi bằng đồng-hồ-cũ); (ii) T4 `load-mid-t4-attempt3-98a7c93f.log` 12:13:48Z + `attempt-done-attempt3-98a7c93f` 12:13:49Z = btime+22/23 s (finalization attempt3 bị reboot giết) + `vite.lock.queue/cooldown-t4` 12:13:49Z; (iii) dòng nội dung waiter T8 `poll 27 12:13:34Z GATE-NOT-YET ... boot=98a7c93f` — là timestamp DÒNG LOG, không phải mtime file. Tất cả đều SAU btime nên theo quy ước đứng (như mốc 09:54:09Z ở mù #65) KHÔNG dịch chuyển cạnh trái khung. Đồng hồ guest cũ chạy nhanh hơn RTC boot mới ~23 s tại biên reboot (ở #33 chỉ 6 s).

### 2.5 Phân phối gap — CERT/FULL CHỨNG NHẬN (không điều kiện)

- **Gap MỚI CHỨNG NHẬN: 98a7c93f→6fb582df = [8.353, 8.373] s, giữa 8.363 s** — cả hai đoạn đóng theo luật gap (max 0 ẩn) → **CERT 66 / FULL 81**. Không có điều kiện (khác gap 7.067 s đợt 146, vốn cần parent xác nhận uptime-closure).
- **CERT65 (không đổi, đợt 146 — đã xác nhận):** n=65, mean **1h34'42"**, median **1h50'39"**, p10 **0h26'54"**, p90 **2h15'08"**, sd **0h44'42"**, min **0h00'55"**, max **3h14'08"**. **FULL80 (không đổi):** n=80, mean **1h40'40"**, median **1h53'38"**, p10 **0h27'38"**, p90 **2h24'21"**, sd **0h54'45"**, min **0h00'55"**, max **5h43'18"**.
- **CERT66 (CHỨNG NHẬN đợt này):** n=66, mean **1h35'23"**, median **1h52'28"**, p10 **0h27'03"**, p90 **2h17'51"**, sd **0h44'42"**, min **0h00'55"**, max **3h14'08"**. **FULL81 (CHỨNG NHẬN đợt này):** n=81, mean **1h41'08"**, median **1h54'16"**, p10 **0h27'47"**, p90 **2h24'11"**, sd **0h54'34"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **43**, <60' = **18**, >180' = **6**, >240' = **2**.
- **SPAN (không chứng nhận):** 691a7403→cc222c8a = **7.050 s**; cc222c8a→e146ca67 = **7.381 s** (quyết 145 (f): để SPAN, không mở đường mới); b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**. Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL (cộng sẽ đếm trùng).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Cả hai đoạn đóng theo luật gap nên không đề xuất đường chứng nhận mới, không cần uptime-closure.
- Dải chứng nhận không đổi: [0h00'55", 3h14'08"] (CERT66 giữ nguyên dải).
- **Dải (band) cho boot mới — XÁC NHẬN CHÍNH THỨC:**
  - 6fb582df làm #110? (đếm chặt, chuẩn), dải FULL80 neo #109? 09:54:03Z: **[10:21:41Z, 12:18:23Z]** — btime thực 12:13:26Z **INSIDE** (chuỗi 6).
  - **Chuỗi INSIDE = 6 theo đếm chặt (chuẩn parent từ đợt 144/145/146) — tính bằng code với float p10/p90 chính xác:** b47f7932 INSIDE (1) → 9afdaa89 OUTSIDE (đứt, về 0) → 70a5b0fc INSIDE (1) → 691a7403 INSIDE (2) → cc222c8a INSIDE (3) → e146ca67 INSIDE (4) → 98a7c93f INSIDE (5) → 6fb582df INSIDE (6).
  - Boot tiếp theo sau 6fb582df (#111? chặt), dải FULL81 neo 12:13:26Z: **[12:41:13Z, 14:37:37Z]** (FULL80 để đối chiếu: [12:41:04Z, 14:37:46Z]).
- **Tốc độ reboot:** **110 reboot / 207,92 h = 1 lần / 113,4 phút** (109 + sự kiện #34; từ boot #1 2026-11-10T20:18:10Z tới 6fb582df). Chuỗi lũy kế tới **125 / 207,92 h = 1 lần / 99,8 phút** (+4 mù #29/30/31 →114; +3 mù #53B →117; +2 mù #55B conv →119; +1 mù #56A conv →120; +0 #57–#60, mù #61A →120; +1 mù #61B →121; +0 mù #61C, mù #62A, mù #62B rule-max-0 →121; +2 mù #62C →123; +0 mù #63A, mù #63B →123; +0 mù #64A, mù #64C →123; +2 mù #64B →125; +0 mù #65A, mù #65B (đóng bằng uptime) →125; +0 mù #66A, mù #66B (đóng theo luật gap) →125). Tổng dung lượng: 55B max 3 → **126 (1 lần / 99,0 phút)**; 56A max 3 → **128 (1 lần / 97,5 phút)**.

### 2.6 Recheck hố đoạn A (12:13:15Z, 12:13:26Z] — điều kiện duy nhất còn lại cho khung chết

- Quét mtime toàn cây `/home/hatch` (bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) cho mốc trong hố: **chỉ có 3 "hit" tại 12:13:15.670/.671** (poll-t4.nohup2.log, run-webkit-t4-attempt3-98a7c93f.log, chain-t4.log — cùng giây 12:13:15 với cạnh trái, chỉ lệch phần thập phân; KHÔNG phải mốc mới — cùng bẫy F-146-T2-3). **0 mốc nội bộ MỚI ở độ chính xác giây.**
- `/var/log`: **0 dòng dpkg.log** trong cửa sổ 12:12–12:13Z; dpkg.log / apt history.log đều mtime **12:16:22Z** (replay boot mới, đoạn B). Replay boot 6fb582df đã xong từ ~12:16Z — không có hoạt động apt nào trong hố.
- Hỗ trợ trong hố (KHÔNG phải closer): không có mẫu sampler nội dung nào trong hố 11 s (sampler T9 vòng 1 mẫu cuối 12:13:07Z theo đồng-hồ-cũ, nằm ngoài hố về phía trước; sampler T5 boot1 mẫu cuối 12:13:29Z nằm sau btime).
- **Kết luận: đoạn A ĐÓNG theo luật gap; khung chết #109? ứng viên (12:13:15Z, 12:13:26Z] 11 s đứng nguyên sau recheck.** Không còn đường thu hẹp khung nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức; tự động hóa giao T9-147).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

### 2.8 Quét WFS #53 (14:52:00–14:52:25Z — chạy trên boot 6fb582df, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 968 dòng / 275 file** (phạm vi 3.225 file). **R7b: 993 / 292** (phạm vi 12.618 file). **Copies: 25 / 17** (không đổi). Đối chiếu 968+25=993=R7b, **chênh 0 — lần thứ 53 liên tiếp**.
- Delta so với #52 (967/274): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND146_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-146 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.9. Phạm vi quét tăng +8 file (3.217→3.225) là script đợt 147 của các luồng khác (round147-t5/t6/t8/t10), không chứa writeFileSync.
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7**, `apps/web/src/media.ts` **2c384ed1**, `apps/web/vite.config.ts` **ee80d093** — không đổi.

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** trong src. Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — md5 **giống hệt** bản src (112891d5) — là artifact build, không phải helper mới.
- Lưu ý phạm vi (F-147-T2-6): lần grep đầu quét cả `server/tts/.venv2` (vendored gradio) và bắt 2 file minified chứa `writeFile` của ffmpeg worker — đó là dependency vendored, ngoài phạm vi src, không tính (cùng cách loại node_modules). Quét lại đúng phạm vi src: đúng 2 helper, 0 stray.

### 2.10 Quét EPERM trong mù #66

- **79 file *.log** có mtime trong mù #66 (0 repo-1, 79 hidden_files). Đếm: "sóng EPERM vẫn bật" **0**, "CẢNH BÁO" **0**, "Operation not permitted" **0**, "sóng EPERM đã tắt" **5** — tất cả là false positive đã biết của launcher O8 (T8 `o8-146t8.log` ×3 mốc 11:39:17/11:42:24/11:45:34Z + T10 `t10-o8.log` ×2 mốc 14:12:36/14:13:27Z). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~194,5 h** trước probe #66). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-147 — KHÔNG CÓ

- Boot lúc mở phiên (14:40:06Z) và lúc đóng (14:54:51Z) đều là **6fb582df, btime 12:13:26Z**. Không có reboot mới trong phiên → **không mở mù #67**.
- **dmesg KHÔNG đọc được trong phiên này** (`dmesg: read kernel buffer failed: Operation not permitted`). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

## 3. RAM trong mù #66 (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh mù #66: 6.752.292 kB = 6.594,0 MiB (T9 sampler, 11:52:06Z, đoạn A) = 107,32% guard 6.144 MiB**, vượt guard ~450,0 MiB. Dòng sampler: `2026-11-19T11:52:06Z boot=98a7c93f mem=6752292 bal=0 swapfree=685948 load1=3.64` (balloon lúc đó xả hẳn về 0 kB). Đây là đỉnh cửa sổ guard 11:51–11:53Z của T9-146.
- **5 mẫu ≥ guard trong đoạn A** (hai sampler độc lập khớp nhau): T9 11:51:06Z 6.587.692 kB (104,71%) + 11:52:06Z 6.752.292 kB (107,32%) + 11:53:06Z 6.316.928 kB (100,40%); T5 11:51:28Z 6.618.252 kB (105,19%) + 11:52:28Z 6.596.072 kB (104,84%). Balloon 0 kB ở 3 mẫu (T9 11:51:06 + 11:52:06, T5 11:51:28).
- Đỉnh từng đoạn: A **6.594,0 MiB** (11:52:06Z) = 107,32% guard; B (boot mới, loại mẫu đồng-hồ-cũ) **2.039.252 kB = 1.991,5 MiB** (12:16:38Z, sampler T5 boot2) = 32,41% guard.
- Mẫu 12:13:29Z 2.746.724 kB = 2.682,3 MiB (43,66% guard) là mẫu cuối sampler boot1 của T5 ghi bằng đồng-hồ-cũ — thuộc boot cũ về nội dung, KHÔNG tính vào đỉnh đoạn B (boot mới). Nếu tính theo timestamp thô thì nó là max đoạn B, nhưng đó là cùng lỗi phân loại như mốc 09:54:09Z ở mù #65.
- Balloon đóng băng 6.443.824 kB: **76 mẫu** trong đoạn B (sampler T9 vòng 2) — đợt thứ mười liên tiếp balloon đóng băng.
- **0 mẫu ≥ guard ở đoạn B; birefnet KHÔNG thử** (không thuộc brief; quyết parent — giữ quy trình + guard 6.144 MiB; tự động hóa giao T9-147; u2net là fallback chính thức).
- Số riêng của script ram-max (lower bound): 364 mẫu; A 6.446 MB (T4 poll 11:52:23Z), B 2.814 MB (12:13:48Z) — thấp hơn đỉnh đọc tay ~4,5% (F-147-T2-5: script bỏ sót dòng sampler bare-number, caveat đã biết F-141-T2-2).
- Lưu ý: đỉnh mù #66 (107,32% guard) là cao nhất từng ghi trong chuỗi mù T2 — lần đầu vượt guard trong một mù (trước đó cao nhất là mù #65 với 61,41%). Vượt guard không đồng nghĩa birefnet chạy được: cửa sổ chỉ ~2–4 phút và đã đóng ~9–10 phút trước khi phát hiện (theo T9-146).
- **Headroom:** theo dõi theo quyết parent (chỉ theo dõi, không hành động); số đo mới thuộc T9-147.

## 4. Ghi chú phương pháp + sai số của chính T2-147 + đối chiếu prereg

### 4.1 Danh sách sai số F-147-T2-n

- **F-147-T2-1 — Prereg viết SAU 1 lần đọc boot_id lúc mở phiên (14:40:06Z), nhưng TRƯỚC boot-verify và probe #66.** Chỉ là một lệnh `cat /proc/sys/kernel/random/boot_id` để xác nhận phiên mở trên boot nào; không chạy boot-verify, status hay once trước prereg. Ghi rõ để đợt sau đối chiếu đúng (nhỏ hơn F-146-T2-1 khi cả boot-verify 1 đã chạy trước prereg).
- **F-147-T2-2 — F108? chỉ còn 2 server đo được.** Cloudflare 403 cả GET lẫn HEAD — F108? ghi CHƯA ĐỦ 3 SERVER theo chuẩn quyết 146 (f) (example +1, google +1 — hai số +1 có thể là làm tròn header Date 1 s, không dùng làm số đo F).
- **F-147-T2-3 — Hole-recheck ghi 3 "HOLE-MARK" tại 12:13:15.670/.671.** Ba file này là chính mốc cạnh trái (cùng giây 12:13:15 với endpoint, chỉ lệch phần thập phân) — so sánh float nghiêm ngặt của script recheck gắn cờ nhầm. Không phải mốc mới; kết quả merged (độ chính xác giây) không đổi: mốc cuối đoạn A vẫn 12:13:15Z. Cùng bẫy F-146-T2-3.
- **F-147-T2-4 — Đoạn A ngắn hơn 2 sàn (2.048 s < 2.294 s): cửa sổ sàn rộng ÂM (−246 s), hai cắt A-lo/A-hi giao nhau.** Cùng 3 session bắc cầu cả hai cắt là hệ quả hình học, không phải lỗi đếm hay trùng lặp; luật gap (merged) vẫn là phán quyết chính cho đoạn A.
- **F-147-T2-5 — Script ram-max66.py (lower bound) bỏ sót đỉnh thật ~4,5%.** Script cho đỉnh đoạn A 6.446 MB (T4 poll 11:52:23Z) trong khi đọc tay sampler cho 6.752.292 kB = 6.594,0 MiB (11:52:06Z) — script bỏ sót dòng sampler bare-number `mem=`/`avail_kB=` (caveat đã biết F-141-T2-2, tái hiện). Đỉnh báo cáo trong LIMITS này lấy theo đọc tay, không lấy theo script.
- **F-147-T2-6 — Lần grep async `.writeFile(` đầu quét cả `server/tts/.venv2` (vendored gradio).** Bắt 2 file minified chứa `writeFile` của ffmpeg worker — dependency vendored, ngoài phạm vi src. Đã quét lại đúng phạm vi src (loại .venv/node_modules như mọi đợt): đúng 2 helper đã biết, 0 stray. Kết luận §2.9 không đổi.
- **F-147-T2-7 — dmesg không đọc được** (`Operation not permitted`, như đợt 146). Journalctl (1 boot) + /proc (btime, boot_id) là nguồn boot; không ảnh hưởng verdict.

### 4.2 Đối chiếu prereg — thực tế

| Dự báo prereg (viết trước probe, sau 1 lần đọc boot_id) | Thực tế | Verdict |
|---|---|---|
| Probe #66 ok=2 fail=0, boot 6fb582df, log +3 | Đúng y hệt (§1) | ✓ |
| Boot 6fb582df, btime 12:13:26Z | Đúng (§1, 2 lần xác minh + lúc đóng) | ✓ |
| Đoạn A đóng theo luật gap | Đóng — merged gap max 120 s | ✓ |
| Đoạn B đóng theo gap+uptime | **Đóng theo luật gap MỘT MÌNH — tốt hơn dự báo** (merged gap max 937 s < sàn; không cần uptime) | ✓ (vượt dự báo) |
| Gap 8.363 s → [8.353, 8.373] → CERT 66 / FULL 81 | Đúng, **không điều kiện** (cả hai đoạn đóng theo gap) | ✓ |
| Dải #110? FULL80 [10:21:41Z, 12:18:23Z] — 6fb582df INSIDE | Đúng chính xác bằng float (script tính [10:21:41Z, 12:18:23Z]) → chuỗi 6 | ✓ |
| Dải #111? FULL80 ≈ [12:41:04Z, 14:37:47Z] | FULL80 thực [12:41:04Z, 14:37:46Z] (lệch 1 s ở p90 do làm tròn prereg); FULL81 [12:41:13Z, 14:37:37Z] | ✓ |
| Khung chết 98a7c93f: merged xác nhận hay thu hẹp | Ứng viên merged **(12:13:15Z, 12:13:26Z] 11 s** — hẹp, khớp cửa sổ T4; nghịch lý ≥23 s đã giải thích (§2.4) | ✓ (mới) |
| EPERM 0 sóng | Đúng (§2.10) | ✓ |
| WFS giải thích bằng diff, không đoán trước | +1/+1, giải thích đầy đủ (§2.8) | ✓ |
| RAM đỉnh mù #66 ≈ 107,32% guard | Đúng: 107,32% (11:52:06Z) | ✓ |
| dpkg: đọc trước, không dự báo hình dạng | Sống 1.545 dòng (gói cuối 12:16:22Z) | ✓ (thận trọng đúng) |
| F108? CHƯA ĐỦ 3 SERVER | Đúng: example +1, google +1, cloudflare 403 (F-147-T2-2) | ✓ |

### 4.3 Phương pháp (ghi lại để đợt sau dùng)

- Merged 4 phạm vi: repo-1 + hidden_files + ngoài cây + /tmp, độ chính xác giây; hai cây độ chính xác float để đối chiếu; sessions (`~/workspace/agents/` exec-logs, birth/mtime) để bắc cầu + nhân chứng nhảy; phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats). Đừng bỏ sót phạm vi (F-136-T2-8).
- Gap chứng nhận = [mid−10 s, mid+10 s] khi đoạn trước đóng VÀ đoạn sau đóng; SPAN khi đoạn mở/không chứng nhận được. Luật gap: floor(gap_max/1.147 s) = số ẩn tối đa.
- Bằng chứng nội dung (timestamp trong nội dung file, sampler continuity, session-spanning) là **hỗ trợ, không phải closer** — theo quyết parent đợt 143 (bác đề xuất cho mù #62) và quyết (f) đợt 145. Áp dụng nhất quán.
- **Đoạn boot sống đóng bằng uptime/boot_id trực tiếp** (btime + boot_id giống hệt qua nhiều lần xác minh độc lập + journal 1 boot) — chỉ dùng khi merged gap vượt sàn; chuẩn 3 điều kiện theo quyết 146 (b). Đợt này không cần tới vì cả hai đoạn đóng theo luật gap.
- **Mốc sau btime thuộc boot cũ theo đồng-hồ-cũ KHÔNG dịch chuyển khung chết** (quy ước đứng từ mù #65: mốc 09:54:09Z; nay áp dụng cho 12:13:29Z/12:13:48Z/12:13:49Z + dòng nội dung 12:13:34Z). Khung chốt theo btime (nguồn kernel) + mốc merged cuối nghiêm ngặt trước btime.
- **Đoạn ngắn hơn 2 sàn:** cửa sổ sàn âm, hai cắt giao nhau — cùng session bắc cầu cả hai cắt là bình thường, không phải trùng lặp (F-147-T2-4).
- WFS giải thích delta bằng diff, không đoán trước số. RAM đọc tay sampler log (ram-max chỉ là lower bound). dpkg đọc trước, không dự báo hình dạng replay (F-142-T2-3). **dpkg.log bị reset mỗi reboot bởi hatch os-intent replay-reset** — muốn lịch sử replay boot cũ thì đọc `/var/log/apt/history.log` + os-intent state, không trông chờ file live (quyết 144 (j) đã cập nhật đợt 145: history.log cũng reset — bằng chứng thay thế là dpkg.log đóng băng trên workspace + ps exact-comm của T4).
- Recheck hố: quét mtime toàn cây `/home/hatch` (bao gồm thư mục bị loại khỏi merged) + `/var/log`; so sánh timestamp bằng đúng định dạng hàm in ra (F-144-T2-3); điểm cuối hố (mốc kết thúc đã biết) tính là KNOWN, không phải mốc mới; mốc cùng giây với endpoint chỉ lệch phần thập phân KHÔNG phải mốc mới (F-146-T2-3, tái hiện F-147-T2-3).
- Tính gap/btime bằng epoch (code), không gõ tay (F-145-T2-2). Viết script MỚI cho mỗi đợt, không adapt bằng sed (F-145-T2-1). Viết prereg TRƯỚC probe (F-145-T2-3 đã sửa: prereg đợt này viết trước status/once; chỉ có 1 lần đọc boot_id trước đó — F-147-T2-1).

### 4.4 Độc lập đối chiếu với T1-146

- T1-146 (verify đợt 145, đã đóng — cờ `round146-t1.done`): đợt 145 = **9 batch / 11 entry / 11 file**; lũy kế 111–145 = **341/701/597**; chờ push 136–145 = **99 file duy nhất** — KHỚP số công bố đợt 145 (T10-145). T2-147 dùng các số này làm cơ số chờ push (§5.4), cộng đợt 146 (T10-146 đếm cuối: đợt 146 = 9/11/11 sau closing; lũy kế 111–146 = 350/712/606; chờ push 136–146 = 108 file).
- T1-146 bổ sung: parent ĐÃ QUYẾT §12.3 đợt 146 — mù #65 đóng hoàn toàn, chuỗi lên 1; gap 7.067 s chứng nhận → CERT 65/FULL 80; khung chết #108? 599 s chốt; chuỗi INSIDE 5; F107? chưa đủ 3 server; reboot #34 xác nhận, 6fb582df = #110?; tuổi thọ boot 98a7c93f chuẩn 8.363 s — **đã áp dụng làm chuẩn trong LIMITS này**, chỉ câu hỏi mới ở §4.5.

### 4.5 Câu hỏi MỚI cho parent (chỉ phát sinh ở đợt 147 — các quyết cũ đã áp dụng làm chuẩn, không hỏi lại)

1. **Mù #66 ĐÓNG HOÀN TOÀN (cả hai đoạn đóng theo luật gap, max 0 ẩn, KHÔNG cần uptime) — ghi nhận chuỗi mù đóng hoàn toàn lên 2?** Lần đầu cả hai đoạn cùng đóng theo luật gap.
2. **Gap 8.363 s (98a7c93f→6fb582df): chứng nhận [8.353, 8.373] s → CERT 66 / FULL 81?** Không có điều kiện (cả hai đoạn đóng theo luật gap). Số: CERT66 mean 1h35'23", median 1h52'28", p10 0h27'03", p90 2h17'51"; FULL81 mean 1h41'08", median 1h54'16", p10 0h27'47", p90 2h24'11".
3. **Khung chết #109? (12:13:15Z, 12:13:26Z] (11 s) — chốt làm chuẩn?** Hẹp (so với 599 s của #108?); recheck 0 mốc mới; nghịch lý đồng hồ ≥23 s đã giải thích tới từng file (§2.4) — các dấu vết sau btime không dịch chuyển khung theo quy ước đứng.
4. **Chuỗi INSIDE lên 6 (chính thức, đếm chặt) — xác nhận?** 6fb582df INSIDE dải FULL80 #110? [10:21:41Z, 12:18:23Z] → 6.
5. **F108? CHƯA ĐỦ 3 SERVER (example +1, google +1, cloudflare 403) — ghi nhận như F107?, không chấp nhận làm số đo F cho boot #110??**

## 5. File + stage

### 5.1 File của T2-147

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND147_T2_EPERM_LIMITS.md`
- Work dir: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round147-t2/` — prereg-t2.md, boot-verify.txt, boot-verify2.txt, boot-close.txt, f108.txt, dpkg107.txt (xem ghi chú dưới), status1/once/status2 +.txt, blind66-investigate.py/.log, blind66-sessions.py/.log, sessions-all.txt, blind66-merged.py/.log, blind66-fifthscope.py/.log, blind66-gaps.py/.txt, eperm-sweep66.py + eperm-sweep-run.log, ram-max66.py + ram-max.txt, scan-wfs.sh + scan-meta.txt + files-*.bin + wfs-*.txt, hole-recheck.txt, blind66-repo-1.txt, blind66-hidden_files.txt, blind66-outside.txt, blind66-tmp.txt.
- Ghi chú: dpkg đọc ghi trong output lệnh f108 (không tách file `dpkg108.txt` riêng như đợt 146) — đủ số liệu trong §1; ghi rõ để đợt sau khỏi tìm file không có.
- Script viết mới hoàn toàn cho đợt 147 (không adapt bằng sed — các lỗi F-145-T2-1/F-145-T2-2 đã tránh).

### 5.2 Stage

- Paths file (NUL-delimited, 1 entry — LIMITS này): `~/workspace/repo-1-push/paths-loop/phase9-round147-t2-eperm.txt` — verify bằng `od -c` sau khi ghi (phải thấy NUL, text-only, 0 binary). **KHÔNG PUSH** (chỉ stage; user push sau từ main chat).
- Cờ xong: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round147-t2.done` (1 dòng tóm tắt).

### 5.3 Cập nhật ngoài LIMITS

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md` — append mục đợt 147 (T2).
- `~/memory/2026-11-19.md` — append mục ngắn (không sửa MEMORY.md).

### 5.4 Trạng thái luồng khác lúc T2 đóng (~14:55Z)

- Đã đóng đợt 146: **T1–T10 đủ 9/9 cờ** (aggregate đợt 146 đã đóng, verdict CHẤP NHẬN; quyết parent §12.3 (a)–(r) đã ghi). Đợt 147 đang chạy: chưa luồng nào có .done lúc T2 đóng (T2 là cờ đầu tiên — các luồng khác đang chạy, thấy file làm việc round147-t5/t6/t8/t10 trong B-tail).
- Tổng chờ push: đợt 136–146 = **108 file duy nhất** (T10-146 đếm cuối sau closing, parent tái kiểm khớp) + 1 file oversize 6,4 MB chưa quyết + 1 file mới của T2-147 (LIMITS này); lũy kế đợt 147 chờ T10 (aggregate đợt 147 chưa có lúc T2 đóng).
- Boot lúc đóng phiên: **6fb582df** (không có reboot mới trong phiên T2-147 — không mở mù #67).
- Marker round-in-progress.md không tồn tại (đã xóa khi T10-146 đóng sổ).

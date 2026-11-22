# PHASE9 ROUND148 T2 — EPERM probe #67 + mù #67 ĐÓNG HOÀN TOÀN (A bằng uptime-closure, B theo luật gap) + khung chết #110? ứng viên 238 s + chuỗi INSIDE 6 ĐỨT về 0 + F109? ĐỦ 3 SERVER — LIMITS

## 0. Headline

- **Probe EPERM #67: ok=2 fail=0, boot d8a11644, 17:42:42Z.** Probe trước (#66) đã chết/stale 3h00'56" (n=66, ts 14:41:45Z, boot 6fb582df). Log `eperm-probe-v2.log` 190 → **193 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #67 ĐÓNG HOÀN TOÀN — chuỗi mù đóng hoàn toàn lên 3 (sau 2 ở #66):** A **ĐÓNG bằng uptime-closure theo chuẩn 3 điều kiện đã xác nhận** (merged gap lớn nhất 1.255 s VƯỢT sàn 1.147 s đúng 108 s — KHÔNG đóng được theo luật gap; 3 điều kiện kiểm trong đoạn, xem §2.4), B **ĐÓNG theo luật gap** (merged gap lớn nhất 263 s < sàn 1.147 s, max 0 ẩn). **Lần đầu tiên một đoạn đóng bằng uptime-closure mà merged gap VƯỢT sàn** (mù #65 đoạn B cũng dùng uptime nhưng merged gap của nó dưới sàn — xem §2.4).
- **Gap 18.882 s (6fb582df→d8a11644): CHỨNG NHẬN [18.872, 18.892] s, giữa 18.882 s → CERT 67 / FULL 82 — theo chuẩn /proc/1 (brief + tiền lệ series).** CAVEAT LỚN (xem §2.2 + §4.5 (g)): /proc/stat btime = 17:27:53Z, sớm hơn /proc/1 (17:28:08Z) đúng 15 s — T5/T6-148 đã dùng /proc/stat → gap 18.867 s (nằm NGOÀI khoảng chứng nhận 5 s). Hai nguồn đã hòa giải (độ trễ init 15,21 s — KHÔNG phải nghịch lý đồng hồ), nhưng chuẩn nguồn nào làm chuẩn series thì CHỜ PARENT/T10 CHỐT. Số thay thế theo /proc/stat ghi đủ ở §2.5.
- **Khung chết #110? (boot 6fb582df): ứng viên merged (17:24:10Z, 17:28:08Z] = 238 s** (theo /proc/1; theo /proc/stat là (17:24:10Z, 17:27:53Z] = 223 s — cùng cạnh trái). RỘNG (so với 11 s của #109?) — vì T10-147 đóng sổ chậm, mốc cuối đoạn A chỉ tới 17:24:10Z; recheck toàn cây 0 mốc nội bộ mới. **Nghịch lý đồng hồ đợt này LỚN NHẤT từ trước: dấu vết boot cũ sau btime tới +875 s** (aggregate parent edit 17:42:33Z) — đã giải thích: phiên agent SỐNG QUA reboot (handoff T10 kết thúc 17:36:35Z), các file đóng sổ viết lại SAU reboot là ghi mới trên boot mới, KHÔNG phải dấu vết đồng-hồ-cũ; theo quy ước đứng chúng KHÔNG dịch chuyển cạnh trái khung.
- **Chuỗi INSIDE 6 ĐỨT, về 0 (chính thức, đếm chặt):** d8a11644 OUTSIDE dải FULL81 #111? [12:41:13Z, 14:37:37Z] (quá p90 tới 2h50'31" = 10.231 s). Boot 6fb582df sống 18.882 s — vượt cả max dải CERT66 (3h14'08") lẫn p90 FULL81 (2h24'11"). Dải #112? (FULL82, neo 17:28:08Z): [17:56:01Z, 19:53:46Z].
- **F109?: ≈ 0 s, ĐỦ 3 SERVER — lần đầu tiên kể từ F106? có đủ 3 server đo được** (example +0, google +0, cloudflare +0; cloudflare hết 403 sau hai đợt F107?/F108?).
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~197,5 h trước probe #67). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong mù #67: 2.724.360 kB = 2.660,5 MiB (T5 sampler, 14:46:20Z, đoạn A) = 43,30% guard 6.144 MiB** — KHÔNG có mẫu nào ≥ guard trong toàn mù (T9 0/107 + T5 0/40 + T8 0/33 + T9-148/T5-148 đoạn B 0 mẫu); đoạn B tối đa 1.120.012 kB = 17,80% guard (17:41:34Z). Balloon tối đa 6.136.248 kB (95,23% trần đóng băng), 0 mẫu đóng băng trong mù. Birefnet 0 thử (tự động hóa đã nối nhưng 0 mẫu ≥ guard → không kích hoạt).
- **WFS #54: chênh 0 — lần thứ 54 liên tiếp.** NEWSTD 969 dòng / 276 file; R7b 994 / 293; copies 25 / 17. `preview.tsx` 530e10a7, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — không đổi.
- **KHÔNG có reboot mới trong phiên T2-148** (boot lúc đóng vẫn d8a11644, kiểm 17:56:59Z) → **không mở mù #68**.
- **Claim "0 reboot trong phiên" của đợt 147 ĐÃ SAI** (reboot #35 xảy ra 17:28:08Z, trong lúc T10-147 đóng sổ) — xem §2.1 + câu hỏi (h) §4.5: có chú thích sửa GAP §76/MEMORY hay không. Verdict CHẤP NHẬN của đợt 147 không đổi (quyết parent (a) đã ghi trễ hạn là lỗi quy trình).
- **Quyết parent đợt 147 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** (CERT 66/FULL 81 xác nhận, khung chết #109? 11 s chốt, chuỗi INSIDE 6, F108? chưa đủ 3 server, thí nghiệm (h) boot-specific + #21 đo lại đợt 148, sửa probe giao T4-148, O8 sau cờ T4 giới hạn 16:30Z, headroom chỉ theo dõi, watchdog giữ nguyên, gate A giữ nguyên, RAM sập không mở điều tra đầy đủ, run 146/147 xác nhận, mốc neo 8.363 s, T8 lỡ hạn mềm ghi nhận, WebKit FULL PASS 5 với caveat) — chỉ câu hỏi MỚI phát sinh ở đợt 148 ghi ở §4.5. **Lưu ý thời gian:** parent viết §12.3 đợt 147 lúc ~17:42:33Z — 6 s SAU khi T2-148 viết prereg (17:42:27Z); prereg ghi "§12.3 trống" là đúng lúc viết (F-148-T2-2).

## 1. Checklist probe EPERM #67 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Đọc boot lúc mở phiên | 17:40:05Z | d8a11644-1f76-4e48-94f6-97b2cf34fff8 (chỉ đọc boot_id, chưa probe — xem F-148-T2-2) |
| Xác minh boot lần 1 | 17:42:32Z | d8a11644-1f76-4e48-94f6-97b2cf34fff8, btime /proc/1 1795109288 = 17:28:08Z, `uptime -s` 17:27:53Z (lệch −15 s — xem F-148-T2-1), journal 1 boot, entry đầu 17:28:09Z = btime+1 s; MemAvailable 938.000 kB |
| Xác minh boot lần 2 | 17:42:49Z | Cùng boot_id/btime; `uptime -s` vẫn 17:27:53Z; MemAvailable 899.404 kB |
| `status` | 17:42:41Z | **DEAD/STALE**, heartbeat n=66, ts 2026-11-19T14:41:45Z, boot 6fb582df, tuổi **10.856 s (3h00'56")**, exit 1 (đo trực tiếp, không tee) |
| `once` | 17:42:42Z | **Probe #67, boot=d8a11644, ok=2 fail=0**, exit 0; dòng log `boot changed 6fb582df -> d8a11644 (uptime since 2026-11-19 17:27:53)` — dòng này kế thừa giá trị `uptime -s`, xem F-148-T2-1 |
| `status` lại | 17:42:42Z | **ALIVE**, tuổi 0 s, n=67, exit 0 |
| Log probe | 17:42:42Z | `eperm-probe-v2.log` 190 → **193 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=67, ts 2026-11-19T17:42:42Z, boot d8a11644; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại sau once, ts=17:42:42Z, boot=d8a11644, n=67 — khớp |
| Xác minh boot lúc đóng | 17:56:59Z | **KHÔNG đổi boot — d8a11644**, btime 17:28:08Z; journal vẫn đúng 1 boot; không có reboot mới trong phiên → không mở mù #68; MemAvailable 2.662.560 kB |
| dpkg.log boot d8a11644 | 17:42:56Z | **1.545 dòng** (gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2, 17:31:40Z — replay xong btime+3m32s; chậm hơn 36 s so với +2m56s của boot 6fb582df), mtime 17:31:40Z, dòng đầu 17:28:34Z = btime+26 s. Bracket chính thức thuộc T5-148; đây là đọc độc lập để đối chiếu |
| F109? | 17:42:52–56Z | example.com Date +0 s, google.com +0 s, cloudflare.com **+0 s (hết 403)** → **F109? ≈ 0 s, ĐỦ 3 SERVER** (dải 0 đến +1 s do làm tròn header Date 1 s — xem §2.2) |

## 2. Điều tra mù #67

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Mù #67: 14:41:45Z 19/11 → 17:42:42Z 19/11 = 10.857 s (3h00'57")** — từ heartbeat cuối probe #66 tới probe #67.
- Một reboot bên trong (#35):

| Đoạn | Boot | Btime (/proc/1) | Dài | Chết lúc |
|---|---|---|---|---|
| A | 6fb582df (#110?) | 12:13:26Z 19/11 (1795090406) | 9.983 s (từ probe #66) | 17:28:08Z |
| B | d8a11644 (#111?) | 17:28:08Z 19/11 (1795109288) | 874 s (tới probe #67) | (còn sống — probe #67) |

- Gap danh nghĩa (btime − btime, tính bằng epoch, chuẩn /proc/1): 6fb582df→d8a11644 = **18.882 s** (5h14'42"). Theo /proc/stat: 17:27:53Z → **18.867 s** (5h14'27") — xem §2.2.
- **Claim "0 reboot trong phiên" của đợt 147 ĐÃ SAI:** reboot #35 xảy ra 17:28:08Z, SAU cờ round147-t8.done (17:22:19Z) và TRONG lúc T10-147 đóng sổ (T10 đóng 17:33:22Z theo cờ; aggregate mtime 17:34:03Z; handoff worker kết thúc 17:36:35Z). Cả 9/9 luồng đợt 147 đều ghi "0 reboot" vì reboot xảy ra sau khi họ kiểm lần cuối (T10 kiểm cây cuối 17:24Z). **Mù #67 mở chính vì reboot này.** Verdict CHẤP NHẬN đợt 147 không đổi — parent đã quyết (a) trễ hạn là lỗi quy trình; nhưng dòng "0 reboot trong phiên — lần đầu kể từ đợt 136" trong GAP §76 + MEMORY nay là SAI SỰ THẬT, hỏi parent ở §4.5 (h) có chú thích sửa hay không.
- Nguồn quan sát mốc cuối mù: LIMITS gộp 147 mtime 17:42:33Z (parent viết §12.3 — SAU btime); T10-147 count-final 17:24:10Z; round147-t10.done 17:34:14Z; GAP_ANALYSIS 17:34:03Z; build-loop-log 17:43:09Z; marker round-in-progress.md không tồn tại lúc T2-148 mở. Các mốc sau btime đều là ghi mới trên boot mới (xem §2.4).

### 2.2 Đánh số + đồng hồ — đã có chuẩn parent (không còn xung đột, trừ chuẩn nguồn btime MỚI phát sinh)

- **Quyết parent đợt 147 (§12.3, viết trực tiếp ~17:42:33Z): ĐẾM CHẶT làm chuẩn** — 6fb582df = #110?, **d8a11644 = #111?**. LIMITS này dùng đếm chặt xuyên suốt.
- **CERT 66 / FULL 81 ĐÃ XÁC NHẬN** (quyết 147 (b)(c)). **Khung chết ĐÃ XÁC NHẬN: #109? (12:13:15Z, 12:13:26Z] 11 s (quyết 147 (d)); #108? (09:44:04Z, 09:54:03Z] 599 s (quyết 146 (d)); #107? (07:55:38Z, 07:56:16Z] 38 s; #106? thu hẹp (05:53:06Z, 05:53:15Z] 9 s.** Full boot_id b47f7932 **ĐỂ MỞ** (quyết (g) đợt 143 — ghi cả hai bản kèm nguồn ở §2.2 cuối, không tự chọn một bên).
- **Đồng hồ:** F109? ≈ 0 s, **ĐỦ 3 SERVER** (§1 — example +0, google +0, cloudflare +0; lần đầu kể từ F106? ≈ −1 s có đủ 3 server; F107? ≈ 0 s nhưng 2 server, F108? CHƯA ĐỦ 3 SERVER theo quyết 147 (f)). F106? ≈ −1 s (đợt 145). F105? ≈ −0 s đến −1 s (đợt 144). F104? ≈ −0 s đến −1 s (đợt 143). F103? chưa đo (boot đã chết). Btime các gap lấy theo RTC, không bị drift guest ảnh hưởng.
- **MÂU THUẪN NGUỒN btime 15 s — MỚI, CHƯA CÓ CHUẨN (F-148-T2-1 + F-148-T2-8):** `/proc/stat` btime = 1795109273 = 17:27:53Z (kernel boot); `/proc/1` = 1795109288 = 17:28:08Z (PID 1 start); `uptime -s` = 17:27:53Z (= /proc/stat, như mọi đợt — vì uptime -s dẫn từ /proc/uptime, neo ở kernel boot). **Đã hòa giải bằng số, KHÔNG phải nghịch lý đồng hồ:** `/proc/1/stat` starttime = 1.521 ticks = **15,21 s sau kernel boot** → PID 1 start wall = 17:27:53Z + 15,21 s = 17:28:08,21Z ≈ /proc/1 mtime 17:28:08,469Z (lệch 0,26 s — trong sai số làm tròn). Độ trễ init 15,21 s là thật (boot chậm lần này); journal entry đầu 17:28:09Z = /proc/1 +1 s (khớp /proc/1 hơn /proc/stat +16 s). **Hệ quả:** gap theo /proc/1 = 18.882 s; theo /proc/stat = 18.867 s (lệch đúng 15 s). **T5/T6-148 đã dùng /proc/stat (18.867 s)** với lý do "quy ước đứng mọi đợt 120–147 (btime = /proc/stat = uptime -s; /proc/1 luôn muộn hơn 10–16 s)". **T2-148 KHÔNG theo T5/T6 ở điểm này** vì: (i) brief đợt 148 chỉ định rõ "/proc/1" + "18.882 s"; (ii) toàn bộ 66 gap CERT trước đều tính từ btime /proc/1 như T2 ghi (và ở các đợt trước hai nguồn trùng nhau tới từng giây — T2-147: uptime -s 12:13:26Z = /proc/1; T9-147: /proc/stat btime 1795090406 = /proc/1 — nên "quy ước" chưa từng bị thử thách; con số "+10 s" mà T6 nêu cho 6fb582df MÂU THUẪN với đọc trực tiếp /proc/stat của T9-147 (1795090406), có thể T6 so với journal first entry 12:13:36Z = btime+10 s chứ không phải /proc/stat — T10 kiểm lại); (iii) đổi nguồn giữa chừng sẽ trộn hai định nghĩa trong cùng một phân phối. **Chứng nhận đợt này dùng /proc/1 (18.882 s); số thay thế theo /proc/stat (18.867 s) ghi đủ ở §2.5 — parent/T10 chốt chuẩn nào (§4.5 (g)).** Khung chết cũng có hai bản (238 s / 223 s, cùng cạnh trái 17:24:10Z). Chuỗi INSIDE không đổi theo nguồn nào (cả hai btime đều OUTSIDE).
- **Parent BÁC đề xuất continuity dòng-log làm closer cho mù #62** (quyết 143 §12.2) **và giữ nguyên phương pháp merged gap rule cho gap 7.050 s + 7.381 s** (quyết (f) đợt 145) — áp dụng nhất quán cho mù #67: sampler content + session-spanning chỉ là **hỗ trợ, KHÔNG phải closer** (§2.4/§2.6). Riêng đoạn A đợt này dùng **uptime-closure theo chuẩn 3 điều kiện đã xác nhận (quyết 146 (b))** — tiền lệ mù #65 đoạn B (parent xác nhận quyết 146 (c)).
- **Mâu thuẫn full boot_id b47f7932 — VẪN ĐỂ MỞ (không có dữ kiện mới, quyết (g) đợt 143):** hai bản ghi mâu thuẫn về full boot_id của boot #103? chưa hòa giải; T2-148 không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận.

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác float:**
- repo-1: **11 file**; hidden_files: **383 file**. Tổng **381 mốc float khác nhau / 214 mốc giây khác nhau** (hai cây gộp).
- Đoạn A: **322 mốc gộp**, gap lớn nhất **1.571 s** (16:03:57→16:30:08). Đoạn B: **59 mốc gộp**, gap lớn nhất **357 s** (17:34:14→17:40:10 — hố đóng sổ T10 → mở đợt 148).

**Sessions (`~/workspace/agents/`, 293 exec-log, 293 file có birth/mtime dùng được — GIẢM 13 so với 306 đợt 147: 45 file cũ biến mất, 32 mới; 0 file biến mất có mtime trong mù #67 hay trong hố — đã kiểm bằng sessions-all.txt đợt 147, xem F-148-T2-7):**
- Bắc cầu: A-lo **6** session, A-hi **3**; B-lo **0**, B-hi **0** (hai cắt nằm NGOÀI đoạn B vì đoạn B ngắn hơn 1 sàn — hình học, không phải lỗi đếm; xem F-148-T2-4).
- Chạm đoạn: A **22**, A-tail **3** (mtime cuối 17:22:07Z), B **8**, B-tail **8** (toàn luồng đợt 148, sinh 17:39:42Z+).
- Nhân chứng nhảy (jump witness): **0 tại d8a11644** (|X| < 361 s; session mtime cuối trước 17:22:07Z; birth đầu sau 17:39:42Z).
- Nhắc boot trong exec-log trong mù: 6fb582df **14**, d8a11644 **1** (chính log probe của T2-148, proc_1dde365ebb6a).

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **76 file** trong mù #67 (50 mốc giây). /tmp: **30 file — tất cả trong đoạn B** (7 mốc giây; tmpfs bị xóa bởi #35, như đợt 144/145/146/147). Goals ngoài hidden_files: **0 file** trong mù #67. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **3 file** (14:51:15Z ×2 đoạn A — memory/bank/reflections.md + world.md; 17:35:00Z đoạn B — memory/2026-11-19.md).
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: A-tail **4 / 0 / 1 / 69** (exec-log 17:22:07, T8 LIMITS 17:21:53, T10 count-final 17:24:10); B-tail **35 / 30 / 2 / 59** (system_prompt.md 17:28:33, closing paths 17:33:35, aggregate parent edit 17:42:33, luồng đợt 148 17:40–17:42).

**Ranh giới:** d8a11644: 0 file trong [btime−10 s, btime] (mốc cuối đoạn A 17:24:10Z cách btime 238 s); 0 file trong (btime, +10 s] (mốc đầu đoạn B 17:28:33Z = btime +25 s — system_prompt.md, ghi mới trên boot mới).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**263 mốc giây khác nhau** (repo-1 11, hidden_files 205, ngoài cây 50, /tmp 7). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| A | 212 | **1.255 s** (16:03:57→16:24:52) | 845 s / 606 s | 14:41:52 (7 s) | 17:24:10 (238 s) | **ĐÓNG — bằng uptime-closure (max 0 ẩn)** |
| B | 50 | **263 s** (17:29:12→17:33:35) | 167 s / 166 s | 17:28:33 (25 s) | 17:42:40 (2 s) | **ĐÓNG — max 0 ẩn** (luật gap) |

**Đoạn A — ĐÓNG bằng uptime-closure (KHÔNG đóng được theo luật gap).** Gap lớn nhất merged 1.255 s > sàn 1.147 s đúng 108 s; floor(1255/1147)=1 → tối đa 1 ẩn theo luật gap. Hố hai-cây 1.571 s (16:03:57→16:30:08) được lấp một phần bởi mốc ngoài cây (session proc_43d36af24250 mtime 16:24:52Z — exec dài 15:36:03→16:24:52Z), còn lại 1.255 s. **Chuẩn 3 điều kiện (quyết 146 (b)) — kiểm TRONG đoạn A, cả ba đều đạt:**
- (1) boot_id 6fb582df giống hệt ở ≥3 thời điểm độc lập: **8 luồng độc lập** — T2 probe #66 14:41:45Z + verify 14:41:38Z + đóng 14:54:51Z; T5 (37 lần nhắc trong LIMITS); T6 (54); T7 4 lần kiểm ~14:40/15:35/16:25/16:55Z; T8 O8 16:58–17:00:43Z + harness tới 17:16:46Z; T9 sampler 14:44–16:30Z; T10 suite 17:08–17:13:30Z + đóng 17:22–17:24Z; T1 (15 lần nhắc). Vượt xa mức tối thiểu 3.
- (2) journal đúng 1 boot: T2-147 đọc journal = 1 boot lúc 14:41:38Z (entry đầu 12:13:36Z = btime+10 s) và lúc đóng 14:54:51Z — cả hai TRONG đoạn A. (Journal trên boot mới chỉ còn 1 boot d8a11644 — journal cũ đã reset theo reboot, nhưng bản ghi đương thời của T2-147 đứng làm bằng chứng.)
- (3) uptime liên tục: `uptime -s` = 12:13:26Z đọc ở T2-147 (14:41:38Z, 14:54:51Z), T5-147, T6-147, T7-147 (4 lần kiểm), T9-147 (kèm btime 1795090406 trong /proc/stat); T7 run 147 started_at 14:35:51Z jitter 0 s ở cả 4 lần kiểm 14:40–16:55Z — neo liên tục; không luồng nào trong đoạn A ghi boot change trước 17:28:08Z.
- **Hỗ trợ (KHÔNG phải closer):** T9 sampler 21 dòng NỘI DUNG trong hố (16:04:07–16:24:07Z, tất cả boot=6fb582df, cadence 60 s — sampler chạy liên tục xuyên hố; reboot trong hố đã giết nó); 6 session bắc cầu A-lo + 3 session bắc cầu A-hi; A-tail 3 session + 69 hidden_files + 4 ngoài cây + 1 repo-1. **Đây là lần đầu tiên một đoạn đóng bằng uptime-closure mà merged gap VƯỢT sàn** (mù #65 đoạn B dùng uptime nhưng merged gap của nó đã dưới sàn). Chứng nhận gap 18.882 s do đó CÓ ĐIỀU KIỆN theo nguồn btime (§2.2/§2.5) — khác gap 8.363 s đợt 147 (không điều kiện).

**Đoạn B — ĐÓNG (max 0 ẩn, luật gap — KHÔNG cần uptime).** Gap lớn nhất merged 263 s < sàn 1.147 s; floor(263/1147)=0. Hố hai-cây 357 s (17:34:14→17:40:10 — từ cờ T10 tới file đầu đợt 148) được lấp bởi mốc merged ngoài cây + /tmp. Mốc đầu 17:28:33Z (head 25 s — system_prompt.md, ghi mới trên boot mới); mốc cuối 17:42:40Z (tail 2 s — file O8 đợt 148). 8 session chạm B (toàn luồng đợt 148, sinh 17:39:42Z+); B-lo/B-hi 0/0 là hình học (cắt ngoài đoạn — F-148-T2-4).

**Khung chết (ứng viên merged — chờ parent xác nhận làm chuẩn):**
- **#110? (boot 6fb582df): (17:24:10Z, 17:28:08Z] = 238 s** (theo /proc/1; theo /proc/stat là (17:24:10Z, 17:27:53Z] = 223 s — cùng cạnh trái). Mốc cuối đoạn A merged: T10-147 `t10-count-final-147.txt` 17:24:10Z. **RỘNG** — rộng nhất kể từ #108? 599 s thì không, nhưng rộng hơn nhiều so với 11 s của #109?: T10-147 đóng sổ chậm (viết aggregate 17:24–17:32Z), mốc cuối chỉ tới 17:24:10Z; không có file nào có mtime trong (17:24:10Z, 17:28:08Z] ở bất kỳ phạm vi nào (recheck §2.6).
- **Nghịch lý đồng hồ đợt này — ĐÃ GIẢI THÍCH, lớn nhất từ trước (tới +875 s):** các file đóng sổ T10-147 (closing paths 17:33:35Z, count-final-postclosing 17:33:36Z, GAP 17:34:03Z, round147-t10.done 17:34:14Z) và parent edit aggregate (17:42:33Z) đều nằm SAU btime 17:28:08Z. **Đây KHÔNG phải dấu vết đồng-hồ-cũ** như ở #34 (12:13:29Z/12:13:48Z — ghi bằng đồng hồ guest cũ trước khi chết): phiên agent SỐNG QUA reboot (handoff worker T10 kết thúc 17:36:35Z, sau reboot 8'27"; parent viết §12.3 lúc ~17:42:33Z), nên các file này được ghi MỚI trên boot d8a11644, bằng đồng hồ boot mới. Nội dung thuộc công việc boot cũ, nhưng thao tác ghi thuộc boot mới. **Dù phân loại theo cách nào, theo quy ước đứng chúng KHÔNG dịch chuyển cạnh trái khung** (khung chốt theo btime nguồn kernel + mốc merged cuối nghiêm ngặt trước btime — như mốc 09:54:09Z ở mù #65). Sessions đối chiếu độc lập: mtime cuối trước btime 17:22:07Z (|X| < 361 s) + birth đầu sau btime 17:39:42Z — nhất quán với khung 238 s.
- Lưu ý: T10-147 bắt đầu viết aggregate ~17:24Z (GAP §76: "ước tính sớm khi bắt đầu viết phần đóng") — các lần ghi trung gian vào aggregate trước reboot không còn dấu vết mtime (mtime chỉ giữ lần ghi cuối 17:42:33Z của parent). Khung 238 s là rộng nhất có thể chứng minh từ mtime; không còn đường thu hẹp nào chưa thử (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.5 Phân phối gap — CERT/FULL CHỨNG NHẬN (theo chuẩn /proc/1; số thay thế theo /proc/stat)

- **Gap MỚI CHỨNG NHẬN: 6fb582df→d8a11644 = [18.872, 18.892] s, giữa 18.882 s** — đoạn A đóng bằng uptime-closure (3 điều kiện kiểm trong đoạn) + đoạn B đóng theo luật gap → **CERT 67 / FULL 82**. Có điều kiện duy nhất: chuẩn nguồn btime — nếu parent đổi chuẩn sang /proc/stat thì gap là 18.867 s, khoảng chứng nhận thành [18.857, 18.877] s (xem số thay thế dưới).
- **CERT66 (không đổi, đợt 147 — đã xác nhận):** n=66, mean **1h35'23"**, median **1h52'28"**, p10 **0h27'03"**, p90 **2h17'51"**, sd **0h44'42"**, min **0h00'55"**, max **3h14'08"**. **FULL81 (không đổi):** n=81, mean **1h41'08"**, median **1h54'16"**, p10 **0h27'47"**, p90 **2h24'11"**, sd **0h54'34"**, min **0h00'55"**, max **5h43'18"**.
- **CERT67 (CHỨNG NHẬN đợt này):** n=67, mean **1h38'39"**, median **1h54'16"**, p10 **0h27'12"**, p90 **2h19'57"**, sd **0h51'49"**, min **0h00'55"**, max **5h14'42"**. **FULL82 (CHỨNG NHẬN đợt này):** n=82, mean **1h43'45"**, median **1h54'38"**, p10 **0h27'54"**, p90 **2h25'38"**, sd **0h59'08"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **43**, <60' = **18**, >180' = **7**, >240' = **3** (tính tay từ FULL81: 43/18/6/2 cộng gap mới 314,7' — xem câu hỏi (6) §4.5, T10 kiểm lại).
- **Số thay thế theo /proc/stat (gap 18.867 s):** CERT67-alt mean 1h38'39", median 1h54'16", p10 0h27'12", p90 2h19'57", sd 0h51'49", max **5h14'27"**; FULL82-alt mean 1h43'44", còn lại giống hệt CERT67/FULL82 (chỉ mean FULL lệch 1 s và max lệch 15 s — vì giá trị mới nằm ở đầu trên phân phối, nội suy phân vị không đổi).
- **SPAN (không chứng nhận):** 691a7403→cc222c8a = **7.050 s**; cc222c8a→e146ca67 = **7.381 s** (quyết 145 (f): để SPAN, không mở đường mới); b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**. Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL (cộng sẽ đếm trùng).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Đoạn A đóng bằng uptime-closure (chuẩn đã xác nhận), đoạn B đóng theo luật gap; không đề xuất đường chứng nhận mới.
- Dải chứng nhận: [0h00'55", 3h14'08"] (CERT66) → **[0h00'55", 5h14'42"]** (CERT67 — max dãn ra vì gap mới 18.882 s vượt max cũ 11.648 s).
- **Dải (band) cho boot mới — XÁC NHẬN CHÍNH THỨC:**
  - d8a11644 làm #111? (đếm chặt, chuẩn), dải FULL81 neo #110? 12:13:26Z: **[12:41:13Z, 14:37:37Z]** — btime thực 17:28:08Z **OUTSIDE** (quá p90 10.231 s) → **chuỗi INSIDE 6 ĐỨT, về 0**.
  - **Chuỗi INSIDE = 0 theo đếm chặt (chuẩn parent từ đợt 144/145/146/147) — tính bằng code với float p10/p90 chính xác:** b47f7932 INSIDE (1) → 9afdaa89 OUTSIDE (đứt, về 0) → 70a5b0fc INSIDE (1) → 691a7403 INSIDE (2) → cc222c8a INSIDE (3) → e146ca67 INSIDE (4) → 98a7c93f INSIDE (5) → 6fb582df INSIDE (6) → **d8a11644 OUTSIDE (0)**.
  - Boot tiếp theo sau d8a11644 (#112? chặt), dải FULL82 neo 17:28:08Z: **[17:56:01Z, 19:53:46Z]** (FULL81 để đối chiếu: [17:55:55Z, 19:52:19Z]; theo /proc/stat 17:27:53Z + FULL82-alt: [17:55:46Z, 19:53:31Z]).
- **Tốc độ reboot:** **111 reboot / 213,17 h = 1 lần / 115,2 phút** (110 + sự kiện #35; từ boot #1 2026-11-10T20:18:10Z tới d8a11644). Chuỗi lũy kế tới **126 / 213,17 h = 1 lần / 101,5 phút** (+4 mù #29/30/31 →115; +3 mù #53B →118; +2 mù #55B conv →120; +1 mù #56A conv →121; +0 #57–#60, mù #61A →121; +1 mù #61B →122; +0 mù #61C, mù #62A, mù #62B rule-max-0 →122; +2 mù #62C →124; +0 mù #63A, mù #63B →124; +0 mù #64A, mù #64C →124; +2 mù #64B →126; +0 mù #65A, mù #65B (đóng bằng uptime) →126; +0 mù #66A, mù #66B (đóng theo luật gap) →126; +0 mù #67A (đóng bằng uptime), mù #67B (đóng theo luật gap) →126). Tổng dung lượng: 55B max 3 → **127 (1 lần / 100,7 phút)**; 56A max 3 → **129 (1 lần / 99,1 phút)**.
- **Tuổi thọ boot 6fb582df: 18.882 s = 5h14'42"** (trừ epoch 1795109288−1795090406; khớp gap danh nghĩa — boot chết đúng lúc reboot #35, không có khoảng trống; theo /proc/stat là 18.867 s = 5h14'27").

### 2.6 Recheck hố đoạn A (16:03:57Z, 16:24:52Z] + hố khung chết (17:24:10Z, 17:28:08Z] — điều kiện duy nhất còn lại cho khung chết

- Quét mtime toàn cây `/home/hatch` (bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) cho mốc trong hai hố: **mỗi hố chỉ có 1 "hit" — và cả hai đều là cùng giây với cạnh trái, chỉ lệch phần thập phân, KHÔNG phải mốc mới (cùng bẫy F-146-T2-3/F-147-T2-3, lần thứ ba liên tiếp):** hố A: `round147-t9/b2-spikes.log` 16:03:57.180 (chính mốc cạnh trái); hố khung chết: `round147-t10/t10-count-final-147.txt` 17:24:10.119 (chính mốc cạnh trái). **0 mốc nội bộ MỚI ở độ chính xác giây trong cả hai hố.**
- `/var/log`: **0 file** có mtime trong cả hai hố; **0 dòng dpkg.log** trong cả hai cửa sổ; dpkg.log / apt history.log đều mtime **17:31:40Z** (replay boot mới, đoạn B). Replay boot d8a11644 đã xong từ ~17:31Z — không có hoạt động apt nào trong hố.
- Hỗ trợ trong hố A (KHÔNG phải closer): 21 dòng sampler T9 trong hố (16:04:07–16:24:07Z, boot=6fb582df); 2 dòng chain-t4.log trong khoảng 16:04–16:24Z (T4 attempt1 poller còn sống xuyên hố, bị kill 16:38:49Z).
- **Kết luận: đoạn A ĐÓNG bằng uptime-closure (merged gap 1.255 s không tự đóng được); khung chết #110? ứng viên (17:24:10Z, 17:28:08Z] 238 s đứng nguyên sau recheck.** Không còn đường thu hẹp khung nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức; tự động hóa đã nối từ T9-147, 0 mẫu ≥ guard đợt này nên không kích hoạt).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

### 2.8 Quét WFS #54 (17:54:19–17:54:42Z — chạy trên boot d8a11644, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 969 dòng / 276 file** (phạm vi 3.235 file). **R7b: 994 / 293** (phạm vi 12.628 file). **Copies: 25 / 17** (không đổi). Đối chiếu 969+25=994=R7b, **chênh 0 — lần thứ 54 liên tiếp**.
- Delta so với #53 (968/275): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND147_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-147 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.9 (cùng mẫu #53: LIMITS T2-146). Phạm vi quét tăng +10 file (3.225→3.235) là 8 LIMITS đợt 147 + 2 LIMITS đợt 148 (T5/T6 — đã stage), không chứa writeFileSync ngoài file trên.
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7**, `apps/web/src/media.ts` **2c384ed1**, `apps/web/vite.config.ts` **ee80d093** — không đổi.

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** trong src. Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — md5 **giống hệt** bản src (112891d5) — là artifact build, không phải helper mới.
- Lưu ý phạm vi (F-147-T2-6 tái hiện, đã xử lý đúng ngay từ đầu đợt này): lần grep đầu quét cả `server/tts/.venv2` (vendored gradio) và bắt 1 file minified chứa `writeFile` của ffmpeg worker — đó là dependency vendored, ngoài phạm vi src, không tính (cùng cách loại node_modules). Quét lại đúng phạm vi src: đúng 2 helper, 0 stray.

### 2.10 Quét EPERM trong mù #67

- **69 file *.log** có mtime trong mù #67 (0 repo-1, 69 hidden_files). Đếm: "sóng EPERM vẫn bật" **0**, "CẢNH BÁO" **0**, "Operation not permitted" **0**, "sóng EPERM đã tắt" **3** — tất cả là false positive đã biết của launcher O8 (T8 `o8-147t8.log` ×3 mốc 16:58:18/16:59:07/16:59:55Z). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~197,5 h** trước probe #67). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-148 — KHÔNG CÓ

- Boot lúc mở phiên (17:40:05Z) và lúc đóng (17:56:59Z) đều là **d8a11644, btime 17:28:08Z**. Không có reboot mới trong phiên → **không mở mù #68**.
- **dmesg KHÔNG đọc được trong phiên này** (`dmesg: read kernel buffer failed: Operation not permitted`). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

## 3. RAM trong mù #67 (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh mù #67: 2.724.360 kB = 2.660,5 MiB (T5 sampler, 14:46:20Z, đoạn A) = 43,30% guard 6.144 MiB.** Dòng sampler: `2026-11-19T14:46:20Z avail_kB=2724360` (T5; balloon lúc đó ~4,07M — đang phình lại sau xả). Đây là đỉnh chung của cả ba sampler đợt 147 trong đoạn A.
- **0 mẫu ≥ guard trong toàn mù #67:** T9-147 0/107 (đỉnh 2.572.644 kB = 40,89% guard, 14:46:05Z) + T5-147 0/40 (đỉnh 2.724.360 kB = 43,30%) + T8-147 0/33 (đỉnh avail 1.888 MB, 17:12:53Z) + đoạn B: T9-148 0/3 mẫu trong cửa sổ (tới probe #67) + T5-148 0/1 mẫu (17:41:49Z 997.752 kB) + boot-verify T2 938.000 kB (17:42:32Z). **Birefnet 0 thử** — cơ chế tự động (a) đã nối từ T9-147 nhưng 0 mẫu ≥ guard nên không kích hoạt lần nào (đúng thiết kế — không có false positive).
- Đỉnh từng đoạn: A **2.660,5 MiB** (14:46:20Z) = 43,30% guard; B (boot mới) **1.120.012 kB = 1.093,8 MiB** (17:41:34Z, sampler T9-148) = 17,80% guard.
- Avail min trong mù: T9 267.976 kB = 261,7 MiB (16:03:07Z, đoạn A — ngay trước hố merged); T5 min 312.140 kB (15:19:21Z); T8 min 456 MB (17:08:23Z). T4-147 §6 ghi avail min ~194 MB (đo bằng `free` trong attempt1, khác pha/đồng hồ đo với sampler — ghi cả hai, không gộp).
- Balloon: tối đa **6.136.248 kB** (T9-147, 95,23% trần đóng băng 6.443.824 kB); **0 mẫu đóng băng** trong toàn mù (T9 0/107, T5 0/40, T8 0/33, đoạn B T9-148 max 5.788.464 kB). Chuỗi đóng băng 9 đợt đã đứt ở đợt 147 (quyết 147 (m)) — đợt này tiếp tục 0 mẫu, nhưng balloon vẫn phình tới 95,23% trần nên KHÔNG kết luận balloon đã hết đóng băng (theo quyết (m)).
- Số riêng của script ram-max (lower bound): 3.728 mẫu; A 2.586 MB (dòng T4 16:39:28Z), B không có mẫu — thấp hơn đỉnh đọc tay ~5% (F-148-T2-5: script bỏ sót dòng sampler bare-number, caveat đã biết F-141-T2-2).
- Lưu ý: đỉnh mù #67 (43,30% guard) thấp hơn nhiều so với đỉnh mù #66 (107,32% guard — cửa sổ guard 11:51–11:53Z). Cửa sổ guard KHÔNG tái mở đợt này; load1 đoạn B cao (3,09–5,77 trong 3 mẫu T9-148) là tải khởi động đợt 148, không thuộc brief T2.

## 4. Ghi chú phương pháp + sai số của chính T2-148 + đối chiếu prereg

### 4.1 Danh sách sai số F-148-T2-n

- **F-148-T2-1 — uptime -s lệch /proc/1 15 s: ĐÃ GIẢI THÍCH, KHÔNG phải nghịch lý đồng hồ.** `uptime -s` = 17:27:53Z = `/proc/stat` btime (kernel boot); `/proc/1` = 17:28:08Z (PID 1 start); `/proc/1/stat` starttime 1.521 ticks = 15,21 s sau kernel boot → PID 1 start wall 17:28:08,21Z ≈ /proc/1 mtime 17:28:08,469Z (lệch 0,26 s). Độ trễ init 15,21 s là thật. Dòng log `boot changed` kế thừa giá trị `uptime -s` (17:27:53Z) — ghi lại, không sửa log.
- **F-148-T2-2 — Prereg viết TRƯỚC khi parent quyết §12.3 đợt 147 hạ xuống (17:42:33Z, 6 s sau prereg 17:42:27Z).** Prereg ghi "§12.3 trống" là đúng lúc viết; base CERT66/FULL81 sau đó ĐÃ ĐƯỢC XÁC NHẬN — không ảnh hưởng số đo, chỉ đổi nhãn "tạm" → "đã xác nhận" trong LIMITS này.
- **F-148-T2-3 — Hole-recheck gắn cờ nhầm 2 file tại endpoint (16:03:57.180 + 17:24:10.119).** Cả hai là chính mốc cạnh trái (cùng giây với endpoint, chỉ lệch phần thập phân) — so sánh float nghiêm ngặt của script recheck gắn cờ nhầm. Không phải mốc mới; kết quả merged (độ chính xác giây) không đổi. Cùng bẫy F-146-T2-3/F-147-T2-3, lần thứ ba liên tiếp.
- **F-148-T2-4 — Đoạn B ngắn hơn 1 sàn (874 < 1.147 s): cả hai cắt B-lo/B-hi nằm ngoài đoạn.** B-lo 17:47:15Z nằm SAU probe #67; B-hi 17:23:35Z nằm TRƯỚC đầu đoạn B. Spanning 0/0 là hình học, không phải lỗi đếm hay thiếu dữ kiện; luật gap (merged) vẫn là phán quyết chính cho đoạn B.
- **F-148-T2-5 — Script ram-max67.py (lower bound) bỏ sót đỉnh thật ~5%.** Script cho đỉnh đoạn A 2.586 MB (dòng T4 16:39:28Z) trong khi đọc tay sampler cho 2.724.360 kB = 2.660,5 MiB (14:46:20Z) — script bỏ sót dòng sampler bare-number `mem=`/`avail_kB=` (caveat đã biết F-141-T2-2, tái hiện). Đỉnh báo cáo trong LIMITS này lấy theo đọc tay, không lấy theo script.
- **F-148-T2-6 — dmesg không đọc được** (`Operation not permitted`, như đợt 146/147). Journalctl (1 boot) + /proc (btime, boot_id) là nguồn boot; không ảnh hưởng verdict.
- **F-148-T2-7 — Exec-log churn 45 biến mất / 32 mới (293 vs 306 file).** 45 file có ở scan T2-147 nhưng không còn ở scan T2-148 (dọn dẹp runtime); đã kiểm bằng sessions-all.txt đợt 147: **0 file biến mất có mtime trong mù #67 hay trong hố merged** (mtime cuối trong số đó đều trước 14:41:45Z) — không ảnh hưởng verdict (sessions chỉ là hỗ trợ, không phải closer).
- **F-148-T2-8 — Xung đột chuẩn nguồn btime với T5/T6-148 (MỚI, chưa có chuẩn).** T5/T6-148 dùng /proc/stat (gap 18.867 s); brief T2-148 + tiền lệ series dùng /proc/1 (gap 18.882 s). T2-148 giữ /proc/1 và ghi đủ số thay thế; parent/T10 chốt chuẩn nào (§4.5 (g)). Con số "+10 s" mà T6 nêu cho 6fb582df mâu thuẫn với đọc trực tiếp /proc/stat của T9-147 (1795090406 = /proc/1) — T10 kiểm lại khi đối chiếu.

### 4.2 Đối chiếu prereg — thực tế

| Dự báo prereg (viết trước probe, sau 1 lần đọc boot_id) | Thực tế | Verdict |
|---|---|---|
| Probe #67 ok=2 fail=0, boot d8a11644, log +3 | Đúng y hệt (§1) | ✓ |
| Boot d8a11644, btime 17:28:08Z | Đúng theo /proc/1 (§1, 2 lần xác minh + lúc đóng); /proc/stat 17:27:53Z — xem F-148-T2-1/8 | ✓ (có caveat nguồn) |
| Đoạn A đóng theo luật gap hay uptime | **Đóng bằng uptime-closure — merged gap 1.255 s VƯỢT sàn** (dự báo có tính tới khả năng này) | ✓ |
| Đoạn B đóng theo luật gap | Đóng — merged gap max 263 s | ✓ |
| Gap 18.882 s → [18.872, 18.892] → CERT 67 / FULL 82 | Đúng, **có điều kiện chuẩn nguồn** (A bằng uptime, B bằng gap) | ✓ (có caveat) |
| Dải #111? FULL81 [12:41:13Z, 14:37:37Z] — d8a11644 OUTSIDE → chuỗi về 0 | Đúng chính xác (quá p90 10.231 s) → chuỗi 0 | ✓ |
| Dải #112? FULL81 ≈ [17:55:55Z, 19:52:19Z] | FULL81 thực [17:55:55Z, 19:52:19Z]; FULL82 [17:56:01Z, 19:53:46Z] | ✓ |
| Khung chết 6fb582df: merged xác nhận hay thu hẹp | Ứng viên merged **(17:24:10Z, 17:28:08Z] 238 s** — rộng (T10 đóng sổ chậm); recheck 0 mốc mới; nghịch lý tới +875 s đã giải thích (§2.4) | ✓ (mới) |
| EPERM 0 sóng | Đúng (§2.10) | ✓ |
| WFS giải thích bằng diff, không đoán trước | +1/+1, giải thích đầy đủ (§2.8) | ✓ |
| RAM đỉnh mù #67 ≈ 43,3% guard, 0 mẫu ≥ guard | Đúng: 43,30% (14:46:20Z), 0 mẫu ≥ guard toàn mù | ✓ |
| dpkg: đọc trước, không dự báo hình dạng | Sống 1.545 dòng (gói cuối 17:31:40Z, btime+3m32s) | ✓ (thận trọng đúng) |
| F109? CHƯA ĐỦ 3 SERVER (cloudflare 403 lần thứ ba) | **SAI: cloudflare hết 403 — F109? ≈ 0 s, ĐỦ 3 SERVER** | ✗ (sai theo hướng tốt — lần đầu đủ 3 server kể từ F106?) |

### 4.3 Phương pháp (ghi lại để đợt sau dùng)

- Merged 4 phạm vi: repo-1 + hidden_files + ngoài cây + /tmp, độ chính xác giây; hai cây độ chính xác float để đối chiếu; sessions (`~/workspace/agents/` exec-logs, birth/mtime) để bắc cầu + nhân chứng nhảy; phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats). Đừng bỏ sót phạm vi (F-136-T2-8).
- Gap chứng nhận = [mid−10 s, mid+10 s] khi đoạn trước đóng VÀ đoạn sau đóng; SPAN khi đoạn mở/không chứng nhận được. Luật gap: floor(gap_max/1.147 s) = số ẩn tối đa.
- Bằng chứng nội dung (timestamp trong nội dung file, sampler continuity, session-spanning) là **hỗ trợ, không phải closer** — theo quyết parent đợt 143 (bác đề xuất cho mù #62) và quyết (f) đợt 145. Áp dụng nhất quán.
- **Đoạn boot chết đóng bằng uptime/boot_id trực tiếp** (btime + boot_id giống hệt qua nhiều lần xác minh độc lập TRONG đoạn + journal 1 boot đọc TRONG đoạn + uptime liên tục) — chỉ dùng khi merged gap vượt sàn; chuẩn 3 điều kiện theo quyết 146 (b). Đợt này đoạn A dùng đúng đường này (lần đầu merged gap vượt sàn mà vẫn đóng).
- **Mốc sau btime thuộc boot cũ KHÔNG dịch chuyển khung chết** (quy ước đứng từ mù #65: mốc 09:54:09Z; nay áp dụng cho 17:33:35Z–17:42:33Z, tới +875 s). Khung chốt theo btime (nguồn kernel) + mốc merged cuối nghiêm ngặt trước btime. **Mới đợt này:** phiên agent sống qua reboot — file đóng sổ viết lại sau reboot là ghi mới trên boot mới, không phải dấu vết đồng-hồ-cũ; phân loại khác nhưng xử lý khung giống nhau.
- **Đoạn ngắn hơn 1 sàn:** cả hai cắt nằm ngoài đoạn — spanning 0/0 là hình học, không phải thiếu dữ kiện (F-148-T2-4). **Đoạn ngắn hơn 2 sàn:** cửa sổ sàn âm, hai cắt giao nhau (F-147-T2-4).
- **Nguồn btime:** series dùng /proc/1 (PID 1 start) — brief đợt 148 chỉ định rõ; /proc/stat btime (kernel boot) và uptime -s là nguồn đối chiếu. Khi hai nguồn lệch nhau (lần đầu đợt này: 15 s), ghi cả hai + hòa giải bằng starttime ticks, KHÔNG tự đổi chuẩn (F-148-T2-8).
- WFS giải thích delta bằng diff, không đoán trước số. RAM đọc tay sampler log (ram-max chỉ là lower bound). dpkg đọc trước, không dự báo hình dạng replay (F-142-T2-3). **dpkg.log bị reset mỗi reboot bởi hatch os-intent replay-reset** — muốn lịch sử replay boot cũ thì đọc `/var/log/apt/history.log` + os-intent state, không trông chờ file live (quyết 144 (j) đã cập nhật đợt 145: history.log cũng reset — bằng chứng thay thế là dpkg.log đóng băng trên workspace + ps exact-comm của T4).
- Recheck hố: quét mtime toàn cây `/home/hatch` (bao gồm thư mục bị loại khỏi merged) + `/var/log`; so sánh timestamp bằng đúng định dạng hàm in ra (F-144-T2-3); điểm cuối hố (mốc kết thúc đã biết) tính là KNOWN, không phải mốc mới; mốc cùng giây với endpoint chỉ lệch phần thập phân KHÔNG phải mốc mới (F-146-T2-3, tái hiện F-147-T2-3, F-148-T2-3).
- Tính gap/btime bằng epoch (code), không gõ tay (F-145-T2-2). Viết script MỚI cho mỗi đợt, không adapt bằng sed (F-145-T2-1). Viết prereg TRƯỚC probe (F-145-T2-3 đã sửa: prereg đợt này viết trước status/once; chỉ có 1 lần đọc boot_id trước đó — F-148-T2-2).

### 4.4 Độc lập đối chiếu với T1-147

- T1-147 (verify đợt 146, đã đóng — cờ `round147-t1.done`): đợt 146 = **9 batch / 11 entry / 11 file**; lũy kế 111–146 = **350/712/606**; chờ push 136–146 = **108 file duy nhất** — KHỚP số công bố đợt 146 (T10-146). T2-148 dùng các số này làm cơ số chờ push (§5.4), cộng đợt 147 (T10-147 đếm cuối: đợt 147 = 9/10/10 sau closing; lũy kế 111–147 = 359/722/615; chờ push 136–147 = 117 file — **đã xác nhận bởi quyết parent §12.3 đợt 147**).
- T1-147 bổ sung: parent ĐÃ QUYẾT §12.3 đợt 147 — mù #66 đóng hoàn toàn, chuỗi lên 2; gap 8.363 s chứng nhận → CERT 66/FULL 81; khung chết #109? 11 s chốt; chuỗi INSIDE 6; F108? chưa đủ 3 server; thí nghiệm (h) boot-specific + #21 đo lại đợt 148; sửa probe giao T4-148; O8 sau cờ T4 giới hạn 16:30Z; headroom chỉ theo dõi; watchdog giữ nguyên; gate A giữ nguyên; RAM sập không mở điều tra đầy đủ; run 146/147 xác nhận; mốc neo 8.363 s; T8 lỡ hạn mềm ghi nhận; WebKit FULL PASS 5 với caveat — **đã áp dụng làm chuẩn trong LIMITS này**, chỉ câu hỏi mới ở §4.5.

### 4.5 Câu hỏi MỚI cho parent (chỉ phát sinh ở đợt 148 — các quyết cũ đã áp dụng làm chuẩn, không hỏi lại)

1. **Mù #67 ĐÓNG HOÀN TOÀN (A bằng uptime-closure 3 điều kiện, B theo luật gap, max 0 ẩn) — ghi nhận chuỗi mù đóng hoàn toàn lên 3?** Lần đầu một đoạn đóng bằng uptime-closure mà merged gap VƯỢT sàn (1.255 s > 1.147 s đúng 108 s).
2. **Gap 18.882 s (6fb582df→d8a11644): chứng nhận [18.872, 18.892] s → CERT 67 / FULL 82, hay để SPAN?** Có điều kiện duy nhất: chuẩn nguồn btime (xem câu 7). Số: CERT67 mean 1h38'39", median 1h54'16", p10 0h27'12", p90 2h19'57"; FULL82 mean 1h43'45", median 1h54'38", p10 0h27'54", p90 2h25'38". Max dải dãn tới 5h14'42" (CERT) — vượt max cũ 3h14'08".
3. **Khung chết #110? (17:24:10Z, 17:28:08Z] (238 s) — chốt làm chuẩn?** Rộng (so với 11 s của #109?); recheck 0 mốc mới; nghịch lý tới +875 s đã giải thích (§2.4) — các file đóng sổ viết lại sau reboot không dịch chuyển khung theo quy ước đứng. (Bản theo /proc/stat: (17:24:10Z, 17:27:53Z] = 223 s — cùng cạnh trái.)
4. **Chuỗi INSIDE 6 ĐỨT, về 0 (chính thức, đếm chặt) — xác nhận?** d8a11644 OUTSIDE dải FULL81 #111? [12:41:13Z, 14:37:37Z] (quá p90 10.231 s) → 0. Boot sống 18.882 s, vượt cả max CERT66 lẫn p90 FULL81.
5. **F109? ≈ 0 s, ĐỦ 3 SERVER — ghi nhận là số đo F đầu tiên đủ 3 server kể từ F106??** Cloudflare hết 403 (example +0, google +0, cloudflare +0; dải 0 đến +1 s do làm tròn header 1 s).
6. **Đếm >240' của FULL82: T2-148 tính tay là 3 (FULL81 có 2, cộng gap mới 314,7') — T10 kiểm lại khi đóng sổ?** Script gaps đợt này không in lại các đếm này cho FULL82; các đếm khác (90–150' = 43, <60' = 18, >180' = 7) cũng tính tay theo cùng cách.
7. **CHUẨN NGUỒN btime: giữ /proc/1 (PID 1 start, gap 18.882 s — brief đợt 148 + tiền lệ series) hay đổi sang /proc/stat (kernel boot, gap 18.867 s — T5/T6-148 đã dùng)?** Hai nguồn lệch 15 s lần đầu tiên (độ trễ init 15,21 s đã hòa giải bằng starttime ticks — không phải nghịch lý đồng hồ). Số thay thế theo /proc/stat: CERT67-alt max 5h14'27", FULL82-alt mean 1h43'44", dải #112? [17:55:46Z, 19:53:31Z]. Nếu đổi chuẩn, chỉ gap này đổi số (các gap trước hai nguồn trùng nhau tới từng giây nên không đổi). Con số "+10 s" mà T6 nêu cho 6fb582df mâu thuẫn với đọc trực tiếp /proc/stat của T9-147 (1795090406) — T10 kiểm lại.
8. **Claim "0 reboot trong phiên" của đợt 147 đã sai (reboot #35 trong lúc T10 đóng sổ) — có chú thích sửa GAP §76 / MEMORY hay không?** Verdict CHẤP NHẬN đợt 147 không đổi (quyết (a) đã ghi trễ hạn là lỗi quy trình); chỉ dòng "0 reboot trong phiên — lần đầu kể từ đợt 136" nay là sai sự thật. T2-148 không tự sửa aggregate đã đóng.

## 5. File + stage

### 5.1 File của T2-148

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND148_T2_EPERM_LIMITS.md`
- Work dir: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round148-t2/` — prereg-t2.md, boot-verify.txt, boot-verify2.txt, boot-close.txt, f109.txt, dpkg (ghi trong output lệnh f109, không tách file riêng — đủ số liệu trong §1), status1/once/status2 +.txt, blind67-investigate.py/.log, blind67-sessions.py/.log, sessions-all.txt, blind67-fifthscope.py/.log, blind67-merged.py/.log, blind67-gaps.py/.txt, eperm-sweep67.py + eperm-sweep-run.log, ram-max67.py + ram-max.txt, scan-wfs.sh + scan-meta.txt + files-*.bin + wfs-*.txt, hole-recheck.py + hole-recheck.txt, blind67-repo-1.txt, blind67-hidden_files.txt, blind67-outside.txt, blind67-tmp.txt.
- Script viết mới hoàn toàn cho đợt 148 (không adapt bằng sed — các lỗi F-145-T2-1/F-145-T2-2 đã tránh).

### 5.2 Stage

- Paths file (NUL-delimited, 1 entry — LIMITS này): `~/workspace/repo-1-push/paths-loop/phase9-round148-t2-eperm.txt` — verify bằng `od -c` sau khi ghi (phải thấy NUL, text-only, 0 binary). **KHÔNG PUSH** (chỉ stage; user push sau từ main chat).
- **LIMITS này OVERSIZE (> 37.768 byte — push cần `ENABLE_PRIVSEP=0`)**; kích thước + md5 cuối ghi trong cờ `round148-t2.done` (tránh tự tham chiếu trong file).
- Cờ xong: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round148-t2.done` (1 dòng tóm tắt).

### 5.3 Cập nhật ngoài LIMITS

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md` — append mục đợt 148 (T2).
- `~/memory/2026-11-19.md` — append mục ngắn (không sửa MEMORY.md).

### 5.4 Trạng thái luồng khác lúc T2 đóng (~18:00Z)

- Đã đóng đợt 147: **T1–T10 đủ 9/9 cờ** (aggregate đợt 147 đã đóng, verdict CHẤP NHẬN; quyết parent §12.3 (a)–(r) đã ghi — parent viết trực tiếp ~17:42:33Z). Đợt 148 đang chạy: **T1 + T6 đã có .done** (round148-t1.done 17:54Z, round148-t6.done 17:55Z); T4/T5/T7/T8/T9 đang chạy (thấy thư mục round148-t4/t5/t7/t8/t9 + file làm việc 17:40–17:42Z). T2 là cờ thứ ba của đợt 148.
- **Xung đột chuẩn btime với T5/T6-148 (F-148-T2-8):** T5 dùng gap 18.867 s (/proc/stat), T6 dùng btime 17:27:53Z (/proc/stat) + dải #112? tạm [17:55:40Z, 19:52:04Z] (FULL81); T2-148 giữ /proc/1 (gap 18.882 s, dải #112? FULL82 [17:56:01Z, 19:53:46Z]) — T10/parent chốt chuẩn nào (§4.5 (g)). T6 cũng ghi T8-148 chạy O8 lúc 17:41:02Z TRƯỚC cờ T4 — lệch chữ quyết (j) đợt 147 ("O8 sau cờ T4") nhưng brief parent đợt 148 giao T8 "O8 trước..." (ghi chú trong build-loop-log — T10 đối chiếu).
- Tổng chờ push: đợt 136–147 = **117 file duy nhất** (quyết parent §12.3 đợt 147; T10-147 đếm cuối sau closing) + 1 file oversize 6,4 MB chưa quyết + các file mới đợt 148 (T1/T6 đã stage 2 file; T2-148 thêm LIMITS này); lũy kế đợt 148 chờ T10 (aggregate đợt 148 chưa có lúc T2 đóng).
- Boot lúc đóng phiên: **d8a11644** (không có reboot mới trong phiên T2-148 — không mở mù #68).
- Marker round-in-progress.md không tồn tại (đã xóa khi T10-147 đóng sổ).

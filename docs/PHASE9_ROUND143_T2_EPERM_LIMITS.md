# PHASE9 ROUND143 T2 — EPERM probe #62 + chứng nhận mù #62 — LIMITS

## 0. Headline

- **Probe EPERM #62: ok=2 fail=0, boot 70a5b0fc, 02:49:42Z.** Probe trước (#61) đã chết/stale 3h03'47" (n=61, ts 23:45:18Z 18/11, boot bde599df). Log `eperm-probe-v2.log` 175 → **178 dòng (+3 đúng prereg)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #62 KHÔNG đóng hoàn toàn:** A **ĐÓNG** (max 0 ẩn, mật độ dày), B **KHÔNG chứng nhận được bằng mật độ** (1 mốc, im lặng cuối 40 s), C **MỞ** (tối đa 2 ẩn), D **ĐÓNG** (luật gap + uptime trực tiếp).
- **Gap mới CHỨNG NHẬN: bde599df→b47f7932 = [3.923, 3.943] s, giữa 3.933 s (1h05'33") → CERT 63 / FULL 78** (đếm chặt, mỗi boot một số). Gap 42 s (b47f7932→9afdaa89) và gap 7.265 s (9afdaa89→70a5b0fc) **vẫn là SPAN**. Khoảng nhãn-parent bde599df→9afdaa89 = [3.965, 3.985] s, giữa 3.975 s — **đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL** (cộng sẽ đếm trùng).
- **Khung chết (ứng viên merged, chờ parent xác nhận chuẩn): #102? (23:52:41Z, 23:53:38Z] 57 s; boot 9afdaa89 (01:45:44Z, 01:55:25Z] 581 s.** Khung 9afdaa89 thu hẹp 81 s so với ứng viên quét của T6-143 (662 s).
- **F104? ≈ −0 s đến −1 s (±~1 s)** (example +1, google 0, cloudflare +1). Lần thứ 4 ba server không đồng thuận.
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~182,6 h trước probe #62). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong mù #62: 3.063.852 kB = 2.992,0 MiB lúc 00:05:26Z (đoạn C, boot 9afdaa89) = 48,70% guard 6.144 MiB**, thiếu 3.227.604 kB. 0 mẫu ≥ guard; birefnet KHÔNG thử (không thuộc brief; quyết (l) đợt 142).
- **WFS #49: chênh 0 — lần thứ 49 liên tiếp.** NEWSTD 963 dòng / 270 file; R7b 988 / 287; copies 25 / 17. `preview.tsx` 530e10a7, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — không đổi.
- **Boot 70a5b0fc vẫn sống lúc đóng phiên (03:10:58Z); không có reboot trong phiên T2-143.**
- **Chờ parent quyết (§4.5):** (1) chấp nhận continuity dòng-log (3 tiến trình, 53 mốc trong hố đoạn C) làm closer cho đoạn C? (chấp nhận cũng mở lại mù #61 đoạn B theo quyết (e) đợt 142); (2) chấp nhận floor cơ học = 0 cho đoạn B (gap 42 s, 1 mốc)?; (3) hòa giải đánh số (c) vs (d) — đếm chặt (b47f7932=#103?, 9afdaa89=#104?, 70a5b0fc=#105?) hay nhãn parent (9afdaa89=#103?, 70a5b0fc=#104?, b47f7932 không số)?; (4) xác nhận hai khung chết trên làm chuẩn; (5) full boot_id b47f7932 — bản nào đúng (T7 vs T9), hay để mở (không còn boot để đo lại)?
- **Độc lập đối chiếu:** T6-143 đã đóng (LIMITS + .done) — khớp T2 trên: chuỗi tương đối chốt #57→#104? + 70a5b0fc; 70a5b0fc INSIDE dải; xung đột (c)/(d) + mâu thuẫn full boot_id b47f7932 xác nhận độc lập (F-143-T6-1); khung chết 9afdaa89 ứng viên 662 s chờ merged của T2. T1-143 PASS đợt 142; G-143-T1-2 (cập nhật boot-verify.txt) đã xử lý — xem §5.3.

## 1. Checklist probe EPERM #62 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 19/11) | Kết quả |
|---|---|---|
| Xác minh boot lần 1 | 02:41:46Z | 70a5b0fc-6aae-4261-a3fe-11226162b5a3, btime 1795053325 = 01:55:25Z, `uptime -s` 2026-11-19 01:55:25, journal 1 boot, entry đầu 01:55:36Z = btime +11 s |
| Xác minh boot lần 2 | 02:48:41Z | Cùng boot_id/btime; MemAvailable 2.138.544 kB |
| `status` | 02:49:05Z | **DEAD/STALE**, heartbeat n=61, ts 2026-11-18T23:45:18Z, boot bde599df, tuổi **11.027 s (3h03'47")**, exit 1 |
| `once` | 02:49:42Z | **Probe #62, boot=70a5b0fc, ok=2 fail=0**, exit 0; dòng log `boot changed bde599df -> 70a5b0fc (uptime since 2026-11-19 01:55:25)` |
| `status` lại | 02:49:42Z | **ALIVE**, tuổi 0 s, n=62, exit 0 |
| Log probe | 02:49:42Z | `eperm-probe-v2.log` 175 → **178 dòng (+3 đúng prereg)**; heartbeat n=62, ts 2026-11-19T02:49:42Z, boot 70a5b0fc; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; MemAvailable 2.746.508 kB |
| Xác minh boot lúc đóng | 03:09:36Z + 03:10:58Z | Vẫn 70a5b0fc, btime 01:55:25Z — **không reboot trong phiên T2-143**; MemAvailable 504.052 kB lúc 03:10:58Z (ngoài mù #62 — balloon đã phồng lại do các luồng đợt 143) |
| dpkg.log boot 70a5b0fc | 02:48:53Z + 03:10:58Z | **2 dòng — replay STILLBORN** (startup packages configure 01:55:54Z + 01:55:55Z, boot +29 s/+30 s), im lặng ~53 phút lúc đọc lần 1, vẫn 2 dòng lúc 03:10:58Z (75' tuổi). Cùng mẫu với bde599df. Bracket postboot thuộc T5-143; đây là đọc độc lập để đối chiếu |
| F104? | 02:48:52–53Z | example.com Date +1 s, google.com +0 s, cloudflare.com +1 s (Date − local_after) → **F104? ≈ −0 s đến −1 s (±~1 s)**. Lần thứ 4 ba server không đồng thuận (F97? +1/+2/+2, F99? +1/0/+1, F102? +1/+1/+2, F104? +1/0/+1). F103? (9afdaa89) vẫn CHƯA đo (boot đã chết) |

## 2. Điều tra mù #62

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Mù #62: 23:45:18Z 18/11 → 02:49:42Z 19/11 = 11.064 s (3h04'24")** — từ heartbeat cuối probe #61 tới probe #62.
- Các boot trong cửa sổ (btime, epoch):

| Đoạn | Boot | Btime | Dài | Chết lúc |
|---|---|---|---|---|
| A | bde599df | 22:48:05Z 18/11 (1795044485) | 500 s | 23:53:38Z |
| B | b47f7932 | 23:53:38Z 18/11 (1795046018) | 42 s | 23:54:20Z |
| C | 9afdaa89 | 23:54:20Z 18/11 (1795046060) | 7.265 s | 01:55:25Z |
| D | 70a5b0fc | 01:55:25Z 19/11 (1795053325) | 3.257 s | (còn sống — probe #62) |

- Gap danh nghĩa (btime − btime): bde599df→b47f7932 = **3.933 s**; b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**; bde599df→9afdaa89 = **3.975 s** (nhãn parent, gộp reboot đôi — KHÔNG phải gap boot liên tiếp).
- Nguồn quan sát mốc cuối mù: LIMITS gộp 142 mtime 02:36:20Z; T2-142 LIMITS 00:18:27Z; T10-142 count-final 02:31:36Z; round142-t10.done 02:32:20Z; GAP_ANALYSIS 02:32:52Z; build-loop-log 02:50:34Z (sau probe #62); marker round-in-progress.md mtime 02:37:42Z (đúng nội dung marker đợt 143 — cron 02:35Z, boot 70a5b0fc, hạn ~05:30Z).

### 2.2 Reboot và đồng hồ — xung đột đánh số (c)/(d) + mâu thuẫn full boot_id

- **Quyết (c) đợt 142** XÁC NHẬN reboot đôi là 2 sự kiện: #27 bde599df→b47f7932 + #28 b47f7932→9afdaa89 (T7+T9 quan sát độc lập); #26 (ed5323a4→bde599df, trong lúc đóng sổ 141) + #29 (9afdaa89→70a5b0fc, trong lúc đóng sổ 142) cũng xác nhận. Quy tắc đứng: mỗi lần đổi boot_id = 1 sự kiện.
- **Quyết (d) đợt 142** ghi TẠM: bde599df = #102?, 9afdaa89 = #103?, 70a5b0fc = #104? — ngụ ý reboot đôi chỉ là 1 bước số. **Hai quyết không thể cùng đúng** theo định nghĩa "mỗi boot một số tiếp theo". T6-143 đã xác nhận độc lập xung đột này (F-143-T6-1(a)) và không tự chọn phe; T2-143 cũng vậy. Hai cách đọc, trình bày song song trong toàn bộ LIMITS này:
  - **Đếm chặt (theo (c)):** b47f7932 = #103?, 9afdaa89 = #104?, 70a5b0fc = #105?. Gap chứng nhận dùng cách này.
  - **Nhãn parent (theo (d)):** 9afdaa89 = #103?, 70a5b0fc = #104?, b47f7932 không có số riêng. Dùng cho đối chiếu với aggregate/T6.
  - Giá trị gap (3.933 s / 42 s / 7.265 s) và verdict dải (INSIDE) **không phụ thuộc cách đánh số** (T2-143 prereg §4; T6-143 §8.9 tính độc lập khớp).
- **F-143-T2-1 — Mâu thuẫn full boot_id b47f7932 (phát hiện trước khi đo, T6-143 xác nhận độc lập):** T7-142 (LIMITS + NOTES, nhất quán nội bộ) ghi `b47f7932-ebca-447e-a015-0a6c160efd98`; T9-142 (LIMITS, nhất quán nội bộ) ghi `b47f7932-ebca-4205-86a0-b71a0ab9790c` (nhóm 3–5 trùng hệt bde599df). Hai bên chỉ đồng nhất về prefix `b47f7932-ebca` + btime 1795046018 = 23:53:38Z + `uptime -s` 23:53:38. Grep toàn `~/workspace/agents/` tìm `b47f7932` chỉ thấy trong artifact thảo luận (LIMITS/NOTES/aggregate/build-loop-log, JSON output của parent và của chính T2-143) — **0 exec-log nào chứa nó**. T5-142 chỉ ghi "observed 1 time 23:54:27Z" (comment script, không full id, không phải quan sát thứ ba). Vậy tiền đề "cùng boot_id" của quyết (c) thực chất là "cùng prefix + btime". Điều này **làm yếu nhưng không lật** quyết (c): 13 ký tự hex chung + btime giống hệt vẫn là bằng chứng áp đảo của một boot ngắn; ít nhất một bên ghi sai khi chép. LIMITS này **không tuyên bố bên nào đúng** — không còn boot đó để đo lại. Giao parent quyết (ghi chú, hay để mở).
- **Đồng hồ:** F104? ≈ −0 s đến −1 s (§1). F103? chưa đo. Dải offset started_at ~30–50 s ĐÃ KHÔI PHỤC theo quyết (h) đợt 142 (đính chính 936 s → 34 s đã đóng; quyết bỏ dải đợt 141 BỊ HỦY). Chuỗi offset (boot đúng): 34 s / 37 s / 32 s. Btime các gap lấy theo RTC, không bị drift guest ảnh hưởng.

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác float:**
- repo-1: **14 file**; hidden_files: **446 file** có mtime trong mù #62. Tổng **442 mốc float khác nhau / 254 mốc giây khác nhau**.
- Đoạn A: **74 mốc**, gap lớn nhất **57 s** (23:52:41→23:53:38). Đoạn B: **2 mốc float khác nhau** (3 file — xem dưới), gap lớn nhất 40 s (23:53:40→23:54:20). Đoạn C: **190 mốc**, gap lớn nhất **2.621 s** (00:51:51→01:35:32). Đoạn D: **176 mốc**, gap lớn nhất 1.224 s (02:06:13→02:26:38).

**Sessions (`~/workspace/agents/`, 263 exec-log, 263 file có birth/mtime dùng được):**
- Bắc cầu: C-lo **6** session, C-hi **3**, D-lo **1**, D-hi **0**.
- Chạm đoạn: A **7**, B **0**, C **19**, D **22** session.
- Nhân chứng nhảy (jump witness): **0 tại b47f7932** (|X| < 131 s; session mtime cuối trước 23:51:27Z; birth đầu sau 23:55:38Z), **0 tại 9afdaa89** (|X| < 173 s), **1 tại 70a5b0fc** (`proc_42ff974f84b3.log` — vòng chờ cờ T10, birth 23:55:38Z mtime 01:55:30Z = btime +5 s; |X| < 581 s).
- Nhắc boot trong exec-log trong mù: bde599df **5**, b47f7932 **0**, 9afdaa89 **12**, 70a5b0fc **8**.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **80 file** trong mù #62. /tmp: **677 file — tất cả trong đoạn D** (tmpfs bị xóa bởi #27/#28/#29). Goals ngoài hidden_files: **0 file** trong mù #62. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **0 file**.
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: A-tail **14 / 0 / 5 / 65**; B-tail **0 / 0 / 0 / 1** (T5 `ram-sampler.log` 23:53:40Z); C-tail **4 / 0 / 1 / 4**; D-tail **33 / 3 / 2 / 98**.

**Sạch ranh giới:** 9afdaa89 và 70a5b0fc SẠCH (0 file trong [btime−10 s, btime] và 0 file trong (btime, +10 s]). b47f7932 KHÔNG sạch: 2 file đúng tại btime (T9 `ram-sampler-long.log` + `.out`, cùng float mtime 23:53:38.518Z — sampler ghi cả hai file trong cùng một lần lấy mẫu) + 1 file tại +2 s (T5 `ram-sampler.log` 23:53:40.458Z). Đây là **last-write của sampler trên boot cũ** (skew đồng hồ ~2 s), không chứng minh được là ghi trên b47f7932 — xem §2.4 đoạn B.

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**330 mốc giây khác nhau** (repo-1 12, hidden_files 245, ngoài cây 73, /tmp 28). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| A | 44 | **57 s** (23:52:41→23:53:38) | 35 s / 27 s | 23:45:23 (5 s) | 23:53:38 (0 s) | **ĐÓNG — max 0 ẩn** (mật độ dày: 44 mốc/500 s) |
| B | 1 | **40 s** (23:53:40→23:54:20) | 2 s / — | 23:53:40 (2 s) | 23:53:40 (40 s) | **KHÔNG chứng nhận được bằng mật độ** (xem dưới) |
| C | 145 | **2.424 s** (00:51:51→01:32:15) | 581 s (tail) / 330 s | 23:55:11 (51 s) | 01:45:44 (581 s) | **MỞ — tối đa 2 ẩn** (floor(2424/1147)=2) |
| D | 139 | **1.121 s** (02:06:13→02:24:54) | 234 s / 188 s | 01:55:30 (5 s) | 02:49:24 (18 s) | **ĐÓNG — luật gap + uptime trực tiếp** |

**Đoạn A — ĐÓNG (max 0 ẩn).** Gap lớn nhất 57 s << sàn 1.147 s; floor(57/1147)=0. Mốc cuối đúng tại btime b47f7932 (23:53:38Z, tail 0 s). Merged thu hẹp gap hai cây ở đoạn A từ 57 s (đã bằng nhau — hai cây cũng 57 s). Đóng đứng trên mật độ, không chỉ luật cơ học — prereg §4 đã nêu caveat đoạn A chỉ 500 s < sàn 1.147 s, và mật độ 44 mốc/500 s thỏa caveat đó.

**Đoạn B — KHÔNG chứng nhận được bằng mật độ.** Merged chỉ có **1 mốc** (23:53:40Z, T5 `ram-sampler.log`); gap lớn nhất 40 s, floor(40/1147)=0 theo luật cơ học — nhưng **không chứng nhận** vì: (1) 1 mốc duy nhất, im lặng cuối 40 s; (2) boot chỉ sống 42 s theo btime — một boot 42 s có thể không để lại mốc nào chứng minh được, và chính b47f7932 chứng minh điều đó (0 session chạm đoạn B, 0 lần nhắc boot trong exec-log, 0 jump witness); (3) hai mốc 23:53:38Z là last-write của sampler T9 trên boot cũ (cùng float 23:53:38.518Z), không chứng minh được ghi trên b47f7932. F-143-T2-9: merged độ chính xác giây đặt hai mốc 23:53:38Z vào đoạn A (ranh giới giây), trong khi hai cây độ chính xác float giữ chúng ở đoạn B — artifact ranh giới độ chính xác, không phải mâu thuẫn; verdict không đổi theo cách nào.

**Đoạn C — MỞ (tối đa 2 ẩn).** Gap lớn nhất merged 2.424 s (00:51:51Z → 01:32:15Z), floor(2424/1147)=2. Hai cây cho gap 2.621 s (00:51:51→01:35:32Z) — merged thu hẹp nhờ mốc ngoài cây 01:32:15Z (exec-log vòng monitor). Mốc bắt đầu hố 00:51:51Z = T8-142 đóng (`PHASE9_ROUND142_T8_VITEHARNESS_LIMITS.md` + `round142-t8.done`, cùng mốc); mốc kết thúc hố 01:32:15Z = mtime exec-log vòng monitor. Tail đoạn C 581 s (mốc cuối 01:45:44Z là exec-log `proc_06b3b97d735d`).

**Hố đoạn C — bằng chứng hỗ trợ (KHÔNG phải closer, cùng lớp với F-142-T2-8):** 3 tiến trình độc lập có mốc thời gian trong NỘI DUNG file nằm trong hố (00:51:51Z, 01:32:15Z], tổng **53 dòng**:
- **Sampler T9 vòng 2** (`ram-sampler-long-2.log`, 100 mẫu 23:55:26Z–01:34:32Z): **40 mẫu trong hố** (00:52:30Z → 01:31:32Z), cadence 60 s, gap liên mẫu tối đa **61 s**, liên tục từ mẫu 00:51:30Z (trước hố) tới 01:32:32Z (sau hố). Xác minh trực tiếp từ nội dung log (không tin theo lời T9-142).
- **Vòng chờ cờ T10** (`proc_42ff974f84b3.log`, 142 dòng, 23:55:28Z→01:55:30Z): **8 dòng trong hố** (00:55:29, 01:00:29, 01:05:29, 01:10:29, 01:15:29, 01:20:29, 01:25:29, 01:30:29Z; cadence ~5 phút; vd `01:10:29Z flags=6`, `01:55:30Z flags=7`).
- **Vòng monitor** (`proc_701a6c972da0.log`, 34 dòng): **5 dòng trong hố** (01:27:32–01:31:32Z, cadence 60 s, dòng metric).
- Một reboot trong hố sẽ SIGTERM cả ba (như #29 đã giết vòng chờ cờ — dòng cuối 01:55:30Z). Hố này là **hố của construction mtime-file**: sampler append liên tục nhưng mtime chỉ hiện lần ghi cuối (01:35:32Z), nên phương pháp merged bị mù với các lần append trong file — máy vẫn sống và ghi suốt hố theo nội dung. **T2-143 KHÔNG đóng đoạn C trên bằng chứng này**, theo tiền lệ quyết (e) đợt 142 (continuity sampler KHÔNG đóng mù #61 đoạn B). Giao parent quyết — chấp nhận ở đây cũng mở lại mù #61 đoạn B (cùng lớp bằng chứng). Xem §4.5 câu hỏi (1).

**Đoạn D — ĐÓNG (luật gap + uptime trực tiếp).** Gap lớn nhất 1.121 s < sàn 1.147 s (floor=0); mốc đầu 01:55:30Z (head 5 s — vòng chờ cờ, nhân chứng nhảy §2.3); mốc cuối 02:49:24Z (tail 18 s). Uptime trực tiếp xác minh boot 70a5b0fc sống liên tục từ 01:55:25Z tới lúc đóng phiên (§1) củng cố độc lập.

**Khung chết (ứng viên merged — chờ parent xác nhận làm chuẩn):**
- **#102? (boot bde599df): (23:52:41Z, 23:53:38Z] = 57 s.** Mốc cuối đoạn A merged. Khung quan sát gộp bde599df→9afdaa89 của T9 ((23:53:38Z, 23:54:20Z] 42 s) và của T4/T5 ((23:53:55Z, 23:54:20Z] 25 s) là **sự kiện khác** (chuyển tiếp gộp qua reboot đôi) — giữ riêng, không lẫn.
- **Boot 9afdaa89: (01:45:44Z, 01:55:25Z] = 581 s.** Thu hẹp 81 s so với ứng viên quét 2 cây của T6-143 ((01:44:23Z, 01:55:25Z] 662 s) nhờ mốc exec-log 01:45:44Z mà quét của T6 bỏ sót. F-143-T2-8: bản ghi HB của T7-142 (slot 01:50:50Z, job d8acae46, start 01:45:34Z, chạy trên boot 9afdaa89) KHÔNG thu hẹp thêm — start 01:45:34Z < mốc cuối merged 01:45:44Z; giờ slot 01:50:50Z là giờ lên lịch, không phải giờ kết thúc thực thi quan sát được. T6-143 §8.7 cũng từ chối tự thu hẹp — T2-143 đồng thuận.
- Khung im lặng của T7-142 (01:45:34Z, 01:55:57Z] nhất quán với khung merged 581 s (bắt đầu 10 s trước mốc cuối merged).

**Kiểm lại mù #61 đoạn B (điều kiện quyết (e) đợt 142):** chạy lại 5 phạm vi trên cửa sổ (21:54:17Z, 22:25:31Z] — **0 mốc nội bộ MỚI**. 1 file duy nhất tìm được là **mốc cuối đã biết** (`proc_198332f853fc.log` 22:25:31Z — dòng 27 trong `blind61-outside.txt` của chính T2-142, mốc KẾT THÚC hố 1.874 s). F-143-T2-6: phải ghi rõ để khỏi đọc nhầm thành bằng chứng mới. **Điều kiện KHÔNG đạt: mù #61 đoạn B vẫn MỞ, gap #100?→#101? = 2.442 s vẫn là SPAN.**

### 2.5 Phân phối gap — CERT 63 / FULL 78

- **Gap mới CHỨNG NHẬN: bde599df→b47f7932 = [3.923, 3.943] s, giữa 3.933 s (1h05'33")** — đoạn A đóng, mật độ dày. → **CERT 62→63, FULL 77→78.**
- **CERT63 (mới, đợt 143):** n=63, mean **1h33'56"**, median **1h49'17"**, p10 **0h26'37"**, p90 **2h15'43"**, sd **0h45'12"**, min **0h00'55"**, max **3h14'08"**.
- **FULL78 (mới, đợt 143):** n=78, mean **1h40'11"**, median **1h51'50"**, p10 **0h27'21"**, p90 **2h24'40"**, sd **0h55'22"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **40**, <60' = **18**, >180' = **6**, >240' = **2**.
- Nhạy LO/HI: CERT63-LO mean 1h33'55" vs HI 1h33'56" (chênh 1 s); FULL78-LO/HI giống nhau từng giây. Nhỏ.
- Đối chiếu: script chạy lại `blind61-gaps.py` nguyên văn tái tạo **chính xác** CERT62/FULL77 của T2-142 (CERT62 mean 1h34'23" median 1h49'58" p10 0h26'28" p90 2h16'01" sd 0h45'25"; FULL77 mean 1h40'38" median 1h53'00" p10 0h27'12" p90 2h24'50" sd 0h55'35"; 40/18/6/2) — chuỗi tính toán nguyên vẹn.
- F-143-T2-7 — **trùng tên CERT63:** biến thể ba-gap giả định của T2-142 cũng tên CERT63 (mean 1h33'32" sd 0h45'34") — nội dung khác CERT63 mới (mean 1h33'56" sd 0h45'12"). Trong LIMITS này "CERT63" luôn là **CERT63 (mới, đợt 143)**; biến thể cũ gọi đầy đủ là "biến thể ba-gap đợt 142 (không dùng)".
- **SPAN (không chứng nhận):** b47f7932→9afdaa89 = **42 s** (đoạn B không chứng nhận được); 9afdaa89→70a5b0fc = **7.265 s** (đoạn C mở, tối đa 2 ẩn). Khoảng nhãn-parent bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL (cộng sẽ đếm trùng).
- **Các biến thể (đã tính, để parent quyết — không dùng mặc định):**
  - (a) Parent đóng đoạn C trên continuity dòng-log (+7.265 s): **CERT64a** mean 1h34'21" median 1h49'58" p10 0h26'45" p90 2h15'26" sd 0h44'58"; **FULL79a** mean 1h40'27" median 1h53'00" p10 0h27'29" p90 2h24'30" sd 0h55'04".
  - (b) Parent đóng cả đoạn C + đoạn B cơ học floor=0 (+7.265 s + 42 s): **CERT65b** mean 1h32'55" median 1h49'17" p10 0h22'18" p90 2h15'08" sd 0h46'06" **min 0h00'42"**; **FULL80b** mean 1h39'12" median 1h51'50" p10 0h26'17" p90 2h24'21" sd 0h55'50" **min 0h00'42"**. Lưu ý: biến thể này kéo min chứng nhận xuống 42 s (dưới min hiện tại 55 s).
  - (c) Nhãn parent (3.975 + 7.265 s): **CERT64c** mean 1h34'22" median 1h49'58" p10 0h26'45" p90 2h15'26" sd 0h44'58"; **FULL79c** mean 1h40'28" median 1h53'00" p10 0h27'29" p90 2h24'30" sd 0h55'04" (gần giống (a), chênh 1 s mean).
  - (d) Nhãn parent chỉ 3.975 s: **CERT63d** mean 1h33'56" median 1h49'17" p10 0h26'37" p90 2h15'43" sd 0h45'12"; **FULL78d** mean 1h40'12" median 1h51'50" p10 0h27'21" p90 2h24'40" sd 0h55'22" (gần giống CERT63/FULL78 mới, chênh 1 s FULL mean).
- Dải chứng nhận không đổi: [0h00'55", 3h14'08"].
- **Dải (band) cho boot mới:**
  - b47f7932 làm #103? (đếm chặt), dải FULL77 neo #102? 22:48:05Z: **[23:15:16Z, 01:12:54Z]** — btime thực 23:53:38Z **INSIDE**.
  - 70a5b0fc làm #104? (nhãn parent) / #105? (đếm chặt), dải FULL77 neo 9afdaa89 23:54:20Z: **[00:21:31Z, 02:19:09Z]** — btime thực 01:55:25Z **INSIDE** (dưới p90 1.424 s, trên p10 5.633 s). Dải FULL78 [00:21:40Z, 02:19:00Z] — cũng **INSIDE**.
  - **Chuỗi INSIDE khởi động lại ở 3** (b47f7932, 9afdaa89, 70a5b0fc đều INSIDE) sau khi #102? làm đứt chuỗi 8 lần liên tiếp.
  - Boot tiếp theo sau 70a5b0fc (#105? nhãn parent / #106? đếm chặt), dải FULL78 neo 01:55:25Z: **[02:22:45Z, 04:20:05Z]**.
- **Tốc độ reboot:** **105 reboot / 197,62 h = 1 lần / 112,9 phút** (102 + sự kiện #27/#28/#29; từ boot #1 2026-11-10T20:18:10Z tới 70a5b0fc). Chuỗi lũy kế tới **118 / 197,62 h = 1 lần / 100,5 phút** (+4 mù #29/30/31 →109; +3 mù #53B →112; +2 mù #55B conv →114; +1 mù #56A conv →115; +0 #57–#60, mù #61A →115; +1 mù #61B →116; +0 mù #61C, mù #62A, mù #62B rule-max-0 →116; +2 mù #62C →118). Tổng dung lượng: 55B max 3 → **119 (1 lần / 99,6 phút)**; 56A max 3 → **121 (1 lần / 98,0 phút)**.

### 2.6 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent đợt 142).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết (l) đợt 142: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).

### 2.7 WFS quét #49 (03:04:25–03:04:57Z)

- **NEWSTD: 963 dòng / 270 file** (phạm vi 3.190 file). **R7b: 988 / 287** (phạm vi 12.583 file). **Copies: 25 / 17** (không đổi). Đối chiếu 963+25=988=R7b, **chênh 0 — lần thứ 49 liên tiếp**.
- Delta so với #48 (954/268): **+9 dòng / +2 file**, giải thích đầy đủ bằng diff (không đoán trước — bài học F-136-T2-8/F-142-T2-8 áp dụng): aggregate 142 +1 (file mới); T2-142 LIMITS +7 (file mới — quét #48 bắt lúc 0, đang ghi dở; bẫy prereg §7 đã xác nhận); T5-142 LIMITS 1→2 (+1: file sửa 00:41:21Z, sau quét #48, thêm trích §7.3). 9 file mới trong phạm vi, 0 file mất (7× LIMITS ROUND142 + 2× ROUND143 T1/T6).
- md5 cây tái kiểm: `apps/web/src/preview.tsx` **530e10a7** (đường dẫn đúng là `apps/web/src/preview.tsx`, `apps/web/src/media.ts` — KHÔNG phải `src/components/`; xem F-143-T2-5), `media.ts` **2c384ed1**, `vite.config.ts` **ee80d093** — không đổi.

### 2.8 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray**.

### 2.9 Quét EPERM trong mù #62

- **102 file *.log** có mtime trong mù #62 (0 repo-1, 102 hidden_files). Đếm: "sóng EPERM vẫn bật" **0**, "CẢNH BÁO" **0**, "Operation not permitted" **0**, "sóng EPERM đã tắt" **10** — tất cả là false positive đã biết của launcher T10-O8 (`sóng EPERM đã tắt, khởi động vite`, 4 mốc thời gian khác nhau × log t10-o8/attempt1/attempt2). Mở rộng raw: 17 lần / 11 unique (10 launcher + 6 dòng test-pass `hasEperm` + 1 ghi chú dmesg-baseline). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~182,6 h** trước probe #62). **EPERM chưa tuyên bố hết.**

## 3. RAM trong mù #62 (đọc tay sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10)

- **Đỉnh mù #62: 3.063.852 kB = 2.992,0 MiB lúc 00:05:26Z (đoạn C, boot 9afdaa89, sampler T9 vòng 2) = 48,70% guard 6.144 MiB**, thiếu **3.227.604 kB (~3.152 MiB)** — khớp đúng số T9-142. Đối chứng: sampler T5 3.043.680 kB lúc 00:14:21Z (48,38%) và 3.033.964 kB lúc 00:05:21Z.
- **0 mẫu ≥ guard; birefnet KHÔNG thử** (không thuộc brief; quyết (l) đợt 142 — giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Đỉnh từng đoạn: A **866.136 kB (845,8 MiB)** 23:45:37Z; B **746.488 kB (729,0 MiB)** 23:53:38Z; C **3.063.852 kB**; D **2.714 MiB** (poll #10 của T4-143, 02:49:18Z) — đọc riêng của T2 lúc 02:49:42Z 2.746.508 kB (43,7%) đối chứng.
- Số riêng của script ram-max (lower bound): 368 mẫu; A 859 MB, B 715 MB, C 2.117 MB, D 2.714 MB — thấp hơn đọc tay vì script chỉ đếm mẫu trong các file nó quét (không gồm sampler T9 vòng 2 đầy đủ).
- **Headroom:** theo dõi theo quyết (i) đợt 142 (lần thứ 2 liên tiếp dưới ngưỡng 1.617 — nhắc một dòng, không hành động); số đo mới thuộc T9-143.

## 4. Ghi chú phương pháp + sai số của chính T2-143 + đối chiếu prereg

### 4.1 Danh sách sai số F-143-T2-n

- **F-143-T2-1 — Mâu thuẫn full boot_id b47f7932 (T7 vs T9).** Phát hiện trước khi đo (prereg). T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9: `b47f7932-ebca-4205-86a0-b71a0ab9790c`. Chỉ đồng nhất prefix + btime. 0 exec-log chứa b47f7932. Không quyết được bên nào đúng — xem §2.2. T6-143 xác nhận độc lập (F-143-T6-1).
- **F-143-T2-2 — Prereg dự báo sai đoạn C.** Prereg §4 dự báo đoạn C ĐÓNG theo luật gap; thực tế MỞ (tối đa 2 ẩn, gap merged lớn nhất 2.424 s > sàn 1.147 s). Nguyên nhân: prereg giả định sampler + slot T7 đủ dày để lấp hố, nhưng sampler append liên tục chỉ để lại 1 mốc mtime (lần ghi cuối) — phương pháp merged bị mù với append trong file. Bằng chứng nội dung (53 dòng, 3 tiến trình) vẫn cho thấy máy sống suốt hố — xem §2.4.
- **F-143-T2-3 — Prereg dải 1 s làm tròn.** Prereg dự báo dải FULL77 [00:21:32Z, 02:19:10Z]; script tính chính xác [00:21:31Z, 02:19:09Z] (p10/p90 làm tròn). Verdict INSIDE không đổi.
- **F-143-T2-4 — Adapt-script bỏ sót chuỗi cũ.** Script adapt từ đợt 142 bỏ sót 5 chỗ (2 dòng print, comment sessions, comment fifthscope, docstring sweep, docstring ram-max tự tham chiếu) — assert bắt được, sửa hết trước khi chạy. Không ảnh hưởng kết quả.
- **F-143-T2-5 — md5sum sai đường dẫn preview.tsx lần đầu.** Lần đầu dùng `src/components/preview.tsx` (không tồn tại) nên chỉ in vite.config.ts; kiểm lại đúng `apps/web/src/preview.tsx` → 530e10a7. (T1-143 cũng gặp lỗi tương tự — F-143-T1-2/F-143-T1-4.)
- **F-143-T2-6 — Recheck mù #61 đoạn B: 1 "hit" là mốc cuối đã biết.** File duy nhất tìm được (`proc_198332f853fc.log` 22:25:31Z) chính là mốc KẾT THÚC hố 1.874 s trong `blind61-outside.txt` của T2-142 — không phải bằng chứng mới. Điều kiện quyết (e) KHÔNG đạt.
- **F-143-T2-7 — Trùng tên CERT63** với biến thể ba-gap giả định của T2-142 (mean 1h33'32" vs 1h33'56"). Ghi rõ "CERT63 (mới, đợt 143)" trong toàn bộ LIMITS này — xem §2.5.
- **F-143-T2-8 — Giờ slot HB của T7 không thu hẹp khung chết 9afdaa89.** Slot 01:50:50Z là giờ lên lịch, không phải giờ kết thúc thực thi; job start 01:45:34Z < mốc cuối merged 01:45:44Z. T6-143 §8.7 cũng từ chối thu hẹp — đồng thuận.
- **F-143-T2-9 — Ranh giới độ chính xác giây ở đoạn B.** Merged (giây) đặt hai mốc 23:53:38Z vào đoạn A; hai cây (float) giữ chúng ở đoạn B. Artifact ranh giới, không phải mâu thuẫn — verdict đoạn B không đổi theo cách nào.

### 4.2 Đối chiếu prereg — thực tế

| Dự báo prereg (§4, ~02:48Z) | Thực tế | Verdict |
|---|---|---|
| Probe #62 ok=2 fail=0, boot 70a5b0fc, log +3 | Đúng y hệt (§1) | ✓ |
| Boot 70a5b0fc, btime 01:55:25Z | Đúng (§1, 4 lần xác minh) | ✓ |
| Đoạn A đóng theo mật độ (500 s, caveat đoạn ngắn) | Đóng, 44 mốc, gap max 57 s | ✓ |
| Đoạn B không chứng nhận được bằng mật độ (42 s) | Đúng — 1 mốc, im lặng cuối 40 s | ✓ |
| Đoạn C đóng theo luật gap | **SAI — MỞ, tối đa 2 ẩn** (gap 2.424 s) | ✗ (F-143-T2-2) |
| Đoạn D đóng theo uptime | Đóng (gap 1.121 s + uptime trực tiếp) | ✓ |
| Gap danh nghĩa 3.933 / 42 / 7.265 / 3.975 s | Đúng cả bốn | ✓ |
| 9afdaa89 INSIDE dải | INSIDE (FULL77 + FULL78) | ✓ (sai 1 s làm tròn — F-143-T2-3) |
| RAM đỉnh ~48,70% guard | Đúng: 48,70% lúc 00:05:26Z | ✓ |
| EPERM 0 sóng | Đúng (§2.9) | ✓ |
| WFS giải thích bằng diff, không đoán trước | +9/+2, giải thích đầy đủ (§2.7) | ✓ |
| dpkg: đọc trước, không dự báo hình dạng | Stillborn 2 dòng (như bde599df) | ✓ (thận trọng đúng) |
| F104? ≈ −1 s đến −2 s | −0 s đến −1 s (trong sai số ±~1 s) | ✓ |

### 4.3 Phương pháp (ghi lại để đợt sau dùng)

- Merged 4 phạm vi: repo-1 + hidden_files + ngoài cây + /tmp, độ chính xác giây; hai cây độ chính xác float để đối chiếu; sessions (`~/workspace/agents/` exec-logs, birth/mtime) để bắc cầu + nhân chứng nhảy; phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats). Đừng bỏ sót phạm vi (F-136-T2-8).
- Gap chứng nhận = [mid−10 s, mid+10 s] khi đoạn trước đóng; SPAN khi đoạn mở/không chứng nhận được. Luật gap: floor(gap_max/1.147 s) = số ẩn tối đa.
- Bằng chứng nội dung (timestamp trong nội dung file, sampler continuity) là **hỗ trợ, không phải closer** — theo tiền lệ quyết (e) đợt 142. Đổi tiền lệ này cần quyết parent, vì nó cũng mở lại mù #61 đoạn B.
- WFS giải thích delta bằng diff, không đoán trước số. RAM đọc tay sampler log (ram-max chỉ là lower bound). dpkg đọc trước, không dự báo hình dạng replay (F-142-T2-3).

### 4.4 Độc lập đối chiếu với T6-143 / T1-143

- T6-143 (LIMITS + .done, đã đóng trước T2): chuỗi tương đối chốt #57→#104? + 70a5b0fc; 70a5b0fc INSIDE dải (tính độc lập §8.9); xung đột (c)/(d) + mâu thuẫn full boot_id xác nhận độc lập (F-143-T6-1); khung chết 9afdaa89 ứng viên 662 s — merged của T2 thu hẹp còn 581 s; gap danh nghĩa 3.975 s / 7.265 s khớp T2. T6 không tự chứng nhận gap — chờ merged T2 (đúng vai trò).
- T1-143 (PASS đợt 142): G-143-T1-2 lưu ý boot-verify.txt của T2-142 vẫn chỉ ghi bde599df — **đã xử lý**: append 3 boot (b47f7932 sourced + disputed, 9afdaa89 sourced + T2-142 direct, 70a5b0fc direct T2-143) vào `round142-t2/boot-verify.txt` lúc 03:12Z — xem §5.3.

### 4.5 Câu hỏi cho parent (quyết ở aggregate đợt 143)

1. **Đoạn C mù #62:** chấp nhận continuity dòng-log (3 tiến trình, 53 mốc trong hố, gap nội dung tối đa 61 s) làm closer? Nếu chấp nhận → gap 9afdaa89→70a5b0fc = [7.255, 7.275] s được chứng nhận, CERT64a/FULL79a (§2.5a); đồng thời mở lại mù #61 đoạn B (cùng lớp bằng chứng, gap 2.442 s). Nếu không → giữ CERT63/FULL78, đoạn C mở, tối đa 2 ẩn.
2. **Đoạn B mù #62:** chấp nhận floor cơ học = 0 (gap 42 s) để chứng nhận gap 42 s? Nếu chấp nhận (cùng với (1)) → CERT65b/FULL80b, min chứng nhận xuống 0h00'42". T2-143 khuyến nghị **không** — 1 mốc duy nhất không đủ mật độ, và boot 42 s tự nó chứng minh có thể không để lại dấu.
3. **Đánh số:** hòa giải (c) vs (d) — đếm chặt (b47f7932=#103?, 9afdaa89=#104?, 70a5b0fc=#105?) hay giữ nhãn parent (9afdaa89=#103?, 70a5b0fc=#104?, b47f7932 không số)? T2-143 khuyến nghị **đếm chặt** cho nhất quán với quy tắc "mỗi boot một số" của quyết (c), nhưng mọi số liệu (gap, dải) không đổi theo cách nào — parent chọn, T2-144 dùng theo.
4. **Khung chết:** xác nhận làm chuẩn #102? (23:52:41Z, 23:53:38Z] 57 s và 9afdaa89 (01:45:44Z, 01:55:25Z] 581 s?
5. **Full boot_id b47f7932:** chọn bản T7 hay T9, hay để mở (không còn boot để đo lại)? T2-143 khuyến nghị để mở kèm ghi chú — không có quan sát thứ ba nào trên đĩa.

## 5. File + stage

### 5.1 File của T2-143

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND143_T2_EPERM_LIMITS.md`
- Work dir: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round143-t2/` — prereg-t2.md, boot-verify.txt, f104.txt, dpkg104.txt, status1/once/status2 +.txt, blind62-investigate.py/.log, blind62-sessions.py/.log, sessions-all.txt, blind62-merged.py/.log, blind62-fifthscope.py/.log, blind62-gaps.py/.txt, eperm-sweep62.py + eperm-sweep-run.log, ram-max62.py + ram-max.txt, scan-wfs.sh + scan-meta.txt + files-*.bin + wfs-*.txt, recheck61b.py/.log, blind62-repo-1.txt, blind62-hidden_files.txt, blind62-outside.txt, blind62-tmp.txt.
- Script adapt từ round142-t2 qua `/tmp/adapt62.py` (assert từng lần thay; các lỗi bỏ sót đã sửa — F-143-T2-4).

### 5.2 Stage

- Paths file (NUL-delimited, 1 entry — LIMITS này): `~/workspace/repo-1-push/paths-loop/phase9-round143-t2-eperm.txt` — verify bằng `od -c` sau khi ghi (phải thấy NUL, text-only, 0 binary). **KHÔNG PUSH** (chỉ stage; user push sau từ main chat).
- Cờ xong: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round143-t2.done` (1 dòng tóm tắt).

### 5.3 Cập nhật ngoài LIMITS

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round142-t2/boot-verify.txt` — append 3 boot lúc 03:12Z (b47f7932 sourced + disputed; 9afdaa89 sourced + T2-142 direct; 70a5b0fc direct T2-143, 4 lần xác minh). Xử lý G-143-T1-2.
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md` — append mục đợt 143 (T2).
- `~/memory/2026-11-19.md` — append mục ngắn (không sửa MEMORY.md).

### 5.4 Trạng thái luồng khác lúc T2 đóng (03:12Z)

- Đã đóng: **T1** (PASS đợt 142), **T6** (LIMITS + .done). Đang chạy: T4, T5, T7, T8, T9, T10 (chưa có .done lúc T2 đóng). Tổng chờ push: đợt 136–142 = **72 file duy nhất** + 1 file oversize 6,4 MB chưa quyết + 1 file mới của T2-143 (LIMITS này); lũy kế đợt 143 chờ T1/T10 (aggregate đợt 143 chưa có lúc T2 đóng).
- Marker round-in-progress.md vẫn tồn tại (xóa khi T10 đóng sổ).

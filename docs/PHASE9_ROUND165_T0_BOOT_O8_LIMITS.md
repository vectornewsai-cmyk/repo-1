# PHASE9 ROUND 165 — T0: Boot survey + O8 JSON (REBOOT #69 ứng viên ĐÃ XÁC NHẬN ĐẦY ĐỦ 9 NGUỒN; btime 20:09:31Z LÀ GIỜ THẬT — KHÔNG CÓ NGHỊCH LÝ ĐỒNG HỒ; reboot TRONG LÚC T10-164 ĐÓNG SỔ, 2 s sau khi T8 đóng cờ; boot lúc mở GIỐNG boot lúc T10-164 đóng; RUN 164 BỊ VIẾT LẠI LẦN 2 TẠI #69 — KẾT CỤC THUỘC T7-165; O8 check-only, T8-165 sở hữu O8 chính thức)

- Lượt cron 03:35 +07 22/11/2026 = 20:35:51Z 21/11/2026. T0 mở ~20:38Z, đóng ~20:42Z.
- Hạn cờ ~23:00Z, hạn cứng đóng đợt 23:30Z 21/11/2026. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — ứng viên #69, boot 9a1a9319; btime 1795291771 = 20:09:31Z (9 nguồn khớp, KHÔNG nghịch lý như #62)

Boot lúc mở **GIỐNG** boot lúc T10-164 đóng: **9a1a9319, btime 1795291771 = 20:09:31Z** — reboot #69 xảy ra TRONG LÚC T10-164 đóng sổ (sau khi T8 đóng cờ 2 s, trước khi T9/T10 đóng cờ), không phải giữa hai đợt. 9 nguồn đều khớp btime (bảng dưới):

| # | Nguồn | Giá trị | Khớp btime? |
|---|-------|---------|-------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795291771` = 20:09:31Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `9a1a9319-3786-4add-8ffa-c51a1027946e` | ✓ |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc bracket) | 1785,47 s lúc epoch 1795293557,03 → boot 1795291771,56; 1786,48 s lúc 1795293558,03 → 1795291771,55; 1787,48 s lúc 1795293559,03 → 1795291771,55 (cả 3 lần giống nhau tới 0,01 s, khớp btime tới 0,55 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 20:09:42Z (journal start lag +11 s sau btime — cùng họ mẫu #61/#62/#64/#65/#67 (+11/+14/+15 s); xem §6); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 20:09 still running`; `wtmp begins Sat Nov 21 20:09:42 2026` | ✓ |
| 6 | `/proc/1` start | 20:09:42,43Z (+11,43 s sau btime — cùng họ với journal +11 s; xem §6) | ✓ |
| 7 | Mốc thời gian T10-164 đóng (mốc file thực tế) | `round164-t8.done` mtime **20:09:29Z** (2 s TRƯỚC btime — hoạt động cuối trên #68); `round164-t9.done` 20:16:30Z, `round164-t10.done` 20:25:14Z, aggregate 164 20:32:28Z — đều SAU btime (ghi đóng sổ trên #69); reboot xảy ra TRONG LÚC T10-164 đóng sổ — xem §2 | ✓ |
| 8 | Scheduler DB host-side (`muse.db`, `scheduler.job_runs` + `scheduler.events`) | Run 164 `succeeded` **20:28:17Z** (sau btime 18'46"), requeue lần 2 lúc **20:10:06.432Z** (btime +35,432 s); run 165 `running` từ 20:35:51Z trên `worker_boot_generation` mới so với run 163 (`cron_boot_8818a1d1…` — cùng generation với run 164 sau #69) | ✓ |
| 9 | Đồng hồ wall lúc mở vs Cloudflare | local ≈ Cloudflare ±1 s lúc ~20:39Z (2 lần đo curl, xem §6) | ✓ |

- **Số hiệu ứng viên: #69** — tiếp nối #68 (0c8a94aa, btime 18:06:30Z). **Chờ parent xác nhận** số hiệu trước khi T2-165 dùng làm mốc chính thức (quy tắc đứng: T0 ghi số hiệu ứng viên, parent quyết).
- `dmesg` KHÔNG thử đọc đợt này (EPERM các đợt trước — không tính làm nguồn; 9 nguồn trên đã đủ, không cần dmesg).
- **dpkg.log (nguồn phụ): MẠNH đợt này — burst đã hoàn thành trước khi T0 mở** (1.545 dòng, md5 `b9d79ebc`, toàn bộ trong 20:10:06–20:12:18, hoạt động đầu boot+35s, cuối boot+167s, gói cuối gstreamer1.0-tools — xem §6). Cùng số dòng (1.545) + gói cuối với replay #67 (md5 `b07e4c5c`) nhưng burst #69 hoàn thành trong ~2m32s, nhanh hơn hẳn #67 (boot+137s → boot+20m18s). T5-165 sở hữu diễn giải; T0 chỉ giao số liệu thô, không suy đoán cơ chế.
- Tuổi boot: **#68 sống 7.381 s (2h03m01s)** = 20:09:31Z − 18:06:30Z; **#67 sống 1.983 s (33m03s)** = 18:06:30Z − 17:33:27Z (kiểm lại khớp T7-164); **#66 sống 5.202 s** = 17:33:27Z − 16:06:45Z. Gap #68→#69 = **7.381 s** (kiểm lại khớp T10-164).
- Hệ quả: mọi watcher/process của đợt 164 đều đã chết theo #69 (watcher-164 vốn đã chết theo #68 từ trước); mọi timestamp wall trong đợt 165 đều thuộc boot mới.

## §2. KHÔNG có nghịch lý đồng hồ đợt này — btime 20:09:31Z LÀ giờ thật; KHÔNG OVERLAP #69/#68 dài; reboot RƠI VÀO lúc T10-164 đóng sổ; RUN 164 BỊ VIẾT LẠI LẦN 2 — KẾT CỤC THUỘC T7-165

Khác hẳn #62 (xung đột 824 s, T10 phán OVERLAP), đợt này mọi bằng chứng đều nhất quán — **không có H1/H2 nào cần phán**:

### §2.1 Run 164 bị viết lại lần 2 tại #69, rồi succeed — bằng chứng DB quyết định (T0 CHỈ ghi số liệu thô, KHÔNG phán verdict)

- Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`), đọc lúc ~20:41Z:
  - Run 164 `0a5f9bc9-c4f4-4d68-96c7-f0baa5455606`: scheduled **17:35:51Z**, `started_at` **20:10:06Z** (sau viết lại lần 2), **`finished_at` 2026-11-21T20:28:17+00:00**, status **`succeeded`** (lúc đọc), attempt 1, `worker_claimed_at_utc` không đọc đợt này, `worker_execution_timed_out` false. **Margin thô tới hạn 20:35:51Z: 454 s (7m34s)** — số thô, T7-165 phán.
  - Events run 164: **8 event** — `dispatched` eid 9801 lúc 17:35:51.168Z; `requeued_after_restart` eid 9811 lúc **18:07:17.131Z** (detail "daemon startup recovery" — viết lại lần 1 tại #68, đã biết từ T7-164, btime #68 +47,131 s); `dispatched` eid 9812 lúc 18:07:17.283Z; `reattached_after_restart` eid 9813 lúc 18:07:17.410Z; **`requeued_after_restart` eid 9838 lúc 20:10:06.432Z** (detail "daemon startup recovery" — **viết lại lần 2 tại #69, btime #69 +35,432 s — TRONG dải dương [33; 49,8]**); `dispatched` eid 9839 lúc 20:10:06.539Z; `reattached_after_restart` eid 9840 lúc 20:10:06.678Z; `succeeded` eid 9844 lúc **20:28:17.866Z**. **0 event sau succeeded** (lúc đọc).
  - Run 165 `b548ba36-77b6-4c4c-bd77-351472631ecd`: scheduled/started 20:35:51Z, status `running` (lúc đọc), `worker_boot_generation` `cron_boot_8818a1d1deaf441d8a1753824996f191` — **cùng generation với run 164 sau #69** (khác run 163 `cron_boot_4beb5d7a3…`).
- **Suy luận duy nhất T0 được phép:** worker của run 164 báo cáo succeed lúc **thật 20:28:17Z**, sau btime #69 (20:09:31Z) **18'46" (1.126 s)**. Lo ngại của T10-164 ("run 164 có thể bị #69 viết lại lần 2") **ĐÃ XẢY RA** (requeue 20:10:06.432Z) — nhưng run vẫn succeed sau đó. **T0 KHÔNG phán** kết cục run 164, margin chính thức, hay điểm (m) #69 — tất cả thuộc T7-165 (kết cục) và T2-165 (đối chiếu độc lập (m) #69). Btime #69 là giờ thật trong sai số đồng hồ ±1 s (§6).
- Tiền đề như đợt 161/162/163/164: timestamp DB = giờ host thật, độc lập với đồng hồ cell (scheduler + Postgres host-side, ngoài cell VM).

### §2.2 Không OVERLAP dài: boot #68 chết trong (20:09:29Z, 20:09:31Z]

- **T8-164 đóng cờ 20:09:29Z** (mtime file thực tế) — btime #69 muộn hơn **2 s**. Claim của T10-164 §10.5 (x) ("reboot #69 xảy ra 2 s SAU khi T8 đóng cờ") **ĐƯỢC XÁC NHẬN ĐỘC LẬP**.
- Hoạt động cuối cùng quan sát được trên #68: **`round164-t8.done` mtime 20:09:29Z**. T9 đóng 20:16:30Z và T10 đóng 20:25:14Z đều là ghi trên #69 (agent-side, sau reboot) — T10-164 đã ghi nhận khoảng trống này, không phải lỗi nội dung T9.
- **Cửa sổ overlap (20:09:31Z → 20:35:51Z): 4 file đổi trong `hidden_files`** (`round164-t9.done` 20:16:30Z, `round164-t10-count.py` 20:18:32Z, `round164-t10.done` 20:25:14Z, `build-loop-log.md` 20:33:17Z) **và 4 file đổi trong `repo-1`** (`PHASE9_ROUND164_T9_HEADROOM_LIMITS.md` 20:16:30Z, `docs/` 20:21:02Z, `PHASE9_GAP_ANALYSIS.md` 20:26:06Z, `PHASE9_ROUND164_LIMITS.md` 20:32:28Z) — **tất cả đều là ghi đóng sổ của T9/T10-164 trên boot #69, KHÔNG file nào của process #68 viết sau btime**.
- **Kết luận:** boot #68 chết trong khoảng (20:09:29Z, 20:09:31Z] — một reboot sạch 2 s sau khi T8 đóng cờ, không phá lượt đo nào trong đợt 164 (O8 DONE 19:32:56Z, trước #69 36'35"). Không cần điều tra overlap như #62. Caveat: khoảng (20:09:29Z, 20:09:31Z] chỉ dài 2 s — cửa sổ mù thực tế bằng 0; T2-165 kiểm mù #98? (#67) trên đoạn [17:33:27Z, 18:06:30Z].

### §2.3 Giao T2-165 / T7-165

- **T2-165:** dùng btime #69 **20:09:31Z giờ thật** trực tiếp làm mốc — không có hai khung giờ như #62, không cần chọn H1/H2. Mù #77?/#88?/#94?/#95?/#96?/#97? giữ nguyên theo quyết đợt 164 + **#98? (#67) MỚI** (đoạn Q [17:33:27Z, 18:06:30Z]; gap #67 danh nghĩa 1.983 s làm cơ sở FULL114 — T2 kiểm #68 có INSIDE không, rồi #69; chuỗi INSIDE đang ở 3 sau #67 theo quyết đợt 163/164) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +11 s, /proc/1 +11,43 s cùng họ mẫu) + **đối chiếu độc lập (m) #69** (requeue +35,432 s ∈ [33; 49,8] — T7-164 đã chốt #68 ứng viên DƯƠNG, T2-165 đối chiếu #69; nếu parent CHẤP NHẬN cả hai: n ứng viên 21→22 nhánh khuyến nghị hoặc 22→23 nhánh #56 ÂM — T2 tính lại, T0 không phán) + **đối chiếu độc lập (m) #68** (quyết đợt 164 giao T2-165).
- **T7-165:** kết cục run 164 (DB ghi `succeeded` 20:28:17Z theo số liệu thô §2.1 — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 454 s thô, 2 lần viết lại (#68 +47,131 s, #69 +35,432 s), slot HB/DR) + điểm (m) #69 (requeue +35,432 s trong dải — chữ ký #63/#66/#68; T7 phán chính thức, T2 đối chiếu). Lưu ý T7: **0 run đang chạy tại btime #69 theo nghĩa hẹp KHÔNG đúng** — run 164 đang chạy tại btime (dispatch 17:35:51Z, chưa finish) nên mới bị viết lại lần 2; khác chữ ký #67 (0 run đang chạy, 0 requeue).

## §3. Watcher: watcher-164 CHẾT THEO REBOOT #68 (đã xác nhận đợt 164); watcher-165 CHƯA khởi động lúc T0 đóng

- **Watcher-164 pid 5451 (T5-164, chạy từ 17:40:59Z trên boot #67): CHẾT THEO REBOOT #68** (T9-164 phát hiện sau khi T5 đóng cờ; T10-164 phán (ix) ghi nhận, không mâu thuẫn T5/T9 — chỉ khác thời điểm kiểm).
- **Watcher-165 CHƯA khởi động lúc T0 đóng:** 0 process `replay-watch` đang chạy lúc T0 kiểm (~20:38–20:41Z); thư mục `round165-t5/` chưa tồn tại (T5-165 chưa mở). T5-165 sở hữu vận hành watcher-165.
- `ps` lúc kiểm thấy `b2-watcher.sh` pid 8854 chạy từ 20:38Z — không phải replay-watch (ghi nhận thô, T0 không diễn giải — có thể là watcher B2 của T9-165).
- Khoảng không-watcher: từ poll cuối watcher-164 (trước btime #68 18:06:30Z) tới khi watcher-165 khởi động — T5-165 đo chính xác.

## §4. POSTBOOT_PASS #67: CÒN (T5-164 sở hữu); #66 KHÔNG CÓ + #68/#69 CHƯA CÓ lúc T0 đóng — đã kiểm lại ngay trước khi ghi cờ (bài học quyết (r) đợt 162 / quyết (n) đợt 163)

- Trên đĩa lúc đóng: **POSTBOOT_PASS #67 CÒN** — `round164-t5/POSTBOOT_PASS` (ghi 17:54:38Z, boot+21m11s, replay tự nhiên đầy đủ) + **POSTBOOT_PASS #65 CÒN** (`round163-t5/POSTBOOT_PASS`, ghi 14:45:05Z). Không có cờ nào cover #63, #66, #68 hay #69.
- **#63 KHÔNG CÓ** (boot thứ 7 lọt — quyết (n) đợt 163).
- **#66 KHÔNG CÓ** (boot thứ 8 không cờ — quyết đợt 164; không bù được).
- **#68/#69 CHƯA CÓ lúc T0 kiểm lại cuối ~20:41Z** (kiểm ngay trước khi ghi cờ — rút kinh nghiệm quyết (r) đợt 162 / quyết (n) đợt 163; T5-165 chưa mở thư mục nên cờ chưa thể xuất hiện trước khi T0 đóng; nếu T5-165 ghi cờ ngay sau đó thì cờ T0 vẫn đúng tại thời điểm kiểm, T5 là nguồn chính thức).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z ngày 20/11 trên boot #48, mtime không đổi) — sống qua **21 reboot liên tiếp** #49–#69 (đếm độc lập: dải bao hàm 69 − 49 + 1 = 21; T0-164 đếm 19 tới #67, thêm #68 + #69 = 21. T0-165 KHÔNG lặp lỗi T0-162 ghi 15 thay vì 16).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-165 không yêu cầu; T5-165 sở hữu postboot). Trạng thái postboot thực tế trên #68/#69 do T5-165 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-164, 21/21 ×3, boot #68)

Đối chiếu JSON T8-164 trong `hidden_files/round164-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 164 — T8-165 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-164 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-21T19-29-56-0c8a94aa-pid29044.json` | `4ec4aafb…` ✓ | khớp | 21 results, 21 `ok=true`, boot 0c8a94aa |
| WebKit attempt2 `o8w-clicktest-report-2026-11-21T19-30-59-0c8a94aa-pid29400.json` | `c58de81a…` ✓ | khớp | 21 results, 21 `ok=true`, boot 0c8a94aa |
| Chromium `o8-clicktest-report-2026-11-21T19-31-58-0c8a94aa-pid29856.json` | `d3969fb4…` ✓ | khớp | 21 results, 21 `ok=true`, boot 0c8a94aa |
| `o8w-clicktest-report.json` (latest) | `c58de81a…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `d3969fb4…` ✓ | byte-identical với stamped cuối | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-164 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 164 thuộc boot #68 (0c8a94aa) — nay boot đã là #69 ứng viên, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.
- Gate FOUND đợt 164 (theo T10-164/aggregate §10.2 + chờ quyết parent §12.1 (g) đợt 164): O8 chạy 19:29:54Z, SAU lượt yên hợp lệ #29 (19:16:46–19:20:59Z) về thời gian, TRÊN CÙNG BOOT #68, gate FOUND qua đường (b) (POSTBOOT_PASS #68 chưa có, postboot tuổi 889 s) — **chuỗi WebKit FULL PASS T10-164 ĐỀ XUẤT GIỮ 18** (parent quyết cuối, quyết (g) đợt 164).

## §6. O8 live: KHÔNG chạy — theo quy ước đợt 162/163/164, T8-165 sở hữu O8 chính thức; lượt yên đợt 165 CHƯA CÓ kết quả lúc T0 đóng

- Task T0-165 yêu cầu **chạy/đối chiếu O8 theo quy ước đợt 162/163/164** — quy ước đó là **check-only** (T0-162 §6: T0 kiểm tĩnh JSON, T8 sở hữu O8 live; T0 không chạy vite/playwright để tránh va chạm cổng/lock với T8). T0-165 giữ nguyên quy ước: chỉ đối chiếu tĩnh §5, không chạy O8 live.
- T8-165 đã mở thư mục (`round165-t8/` tồn tại lúc T0 đóng). T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-165. T9-165 cũng đã mở thư mục (b2-watcher.sh pid 8854 chạy từ 20:38Z — T9 sở hữu).
- **Lượt yên đợt 165: CHƯA CÓ kết quả lúc T0 đóng.** T4-165 đã mở thư mục; **0 cờ `.done` nào của đợt 165 tồn tại lúc T0 đóng** (T0 là cờ đầu tiên). T0 KHÔNG tự kết luận chuỗi WebKit FULL PASS — chỉ đề xuất sau khi có kết quả T4-165 + O8 T8-165; **parent quyết cuối** (quy tắc đứng: chuỗi chỉ lên khi CÓ lượt yên hợp lệ trong đợt + O8 chạy sau về thời gian TRÊN CÙNG BOOT đo + gate FOUND chuẩn).
- Đồng hồ wall cell lúc mở đợt 165: **CHUẨN (±1 s so với Cloudflare)**:

| Lần đo | Local (bracket) | Cloudflare Date | Đọc |
|--------|----------------|-----------------|-----|
| ~20:39Z (curl try0) | epoch 1795293560,07–1795293560,74 | 20:39:21 GMT, epoch 1795293561 (CF trước local +0,27 đến +0,93 s so với bracket — trong độ trễ request) | local ≈ Cloudflare |
| ~20:39Z (curl try1) | epoch 1795293560,74–1795293561,31 | 20:39:22 GMT, epoch 1795293562 (CF trước local +0,69 đến +1,26 s) | local ≈ Cloudflare |

- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160/161/162/163/164):** GitHub Date header dao động giữa các edge server — **không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-165 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên. Caveat: CF Date cắt tới giây nên biên trên của try1 (+1,26 s) chứa thành phần cắt giây; cả hai lần đo đều nhất quán với local chậm hơn Cloudflare ~0,7 s.
- Uptime math khớp btime tới 0,55 s (3 lần đọc §1, boot_est .55/.56 — btime là floor của giây boot). Journal boot mới đơn điệu: 153 entry, 0 bước nhảy âm, gap lớn nhất 69,87 s (timer 1 phút, bình thường), 0 gap >120 s — không có dấu hiệu sửa đồng hồ sau boot.
- **Độ lệch nhỏ ghi nhận (không phải nghịch lý):** journal first entry +11 s và `/proc/1` +11,43 s sau btime — cùng họ mẫu +11/+14/+15 s của #61/#62/#64/#65/#67 (hơi sớm hơn #67 +14 s), mọi nguồn khác khớp btime; không có xung đột nào cần phán H1/H2.
- `/tmp/.X11-unix/` **TRỐNG** lúc T0 mở (~20:38Z, 0 socket — 3 socket X193/X194/X195 của T5-164 đã bị reboot #68 xóa; không socket mới nào xuất hiện trên #69).
- **dpkg.log (ghi nhận thô cho T5-165):** reset theo boot lần thứ năm liên tiếp (#62, #64, #65, #67, #69) — **1.545 dòng, md5 `b9d79ebc`, toàn bộ trong 20:10:06–20:12:18 (74 giây distinct)**; hoạt động đầu 20:10:06Z = **boot+35s**, cuối 20:12:18Z = **boot+167s**, gói cuối `gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2`. Cùng số dòng (1.545) + gói cuối với replay #67 (md5 `b07e4c5c`) nhưng burst #69 hoàn thành trong ~2m32s thay vì ~20m18s như #67 — nhanh hơn hẳn; T5-165 sở hữu diễn giải (T0 không suy đoán cơ chế). Burst đã xong trước khi T0 mở (20:38Z).

## §7. Sai số của chính mình (F-165-T0-n)

- **F-165-T0-1 — Query DB đầu dùng `scheduled_for_utc` sai (cộng nhầm 3.600 s).** Query đầu `IN (1795286151, 1795294551)` trả 0 dòng — sai: run 164 scheduled thật là 1795282551 (17:35:51Z), run 165 là 1795293351 (20:35:51Z). Bắt được ngay (0 dòng là tín hiệu sai), truy vấn lại rộng (`ORDER BY scheduled_for_utc DESC LIMIT 5`) mới ra đúng số. Bài học: epoch nào cũng tính lại bằng phép trừ từ btime neo, không cộng nhẩm giờ.
- **F-165-T0-2 — Lệnh kiểm cuối exit 2 do `ls round165-*.done` không có file nào.** Không phải lỗi kiểm tra — 0 cờ đợt 165 lúc T0 đóng là kết quả đúng (T0 là cờ đầu tiên). Ghi nhận để T10-165 khỏi nhầm là lỗi lệnh.
- **F-165-T0-3 — ĐÃ TRÁNH lỗi làm tròn uptime (F-162-T0-5/F-163-T0-3/F-164-T0-3):** chỉ dùng 3 lần đọc bracket bằng python có phần thập phân cho phép toán uptime−epoch (boot_est 1795291771,55/56 cả 3 lần); không dùng `date +%s` nguyên giây cho phép toán này.
- **F-165-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3/F-163-T0-4/F-164-T0-4):** kiểm POSTBOOT_PASS #68/#69 chỉ bằng `ls` thư mục có mục tiêu + `find -maxdepth 2 -name POSTBOOT_PASS*` (không quét toàn cây `hidden_files/`).
- **F-165-T0-5 — ĐÃ TRÁNH đếm marker sai (quyết (q) đợt 162 / quyết (q) đợt 163):** đếm độc lập dải bao hàm 69 − 49 + 1 = 21, đối chiếu với T0-164 đếm 19 tới #67 + #68 + #69 — không cộng dồn bằng trí nhớ.
- **F-165-T0-6 — ĐÃ TRÁNH tuổi boot ghi nháp sai (F-164-T0-1):** mọi tuổi boot đều tính lại bằng phép trừ epoch (gap #68→#69 = 7.381 s; tuổi #67 = 1.983 s; tuổi #66 = 5.202 s) trước khi viết LIMITS.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung. Không ghi vào `build-loop-log.md` (theo tiền lệ T0-161/T0-162/T0-163/T0-164 — log lượt thuộc về T10-165 khi tổng hợp, tránh ghi chồng chéo với 8–10 luồng cùng lúc).

## §8. Bàn giao / nợ mở đợt 165

1. **Parent:** xác nhận số hiệu reboot ứng viên **#69** (boot 9a1a9319, btime 20:09:31Z giờ thật, 9 nguồn khớp — T10-164 chỉ xác minh btime + uptime + boot_id, T0-165 đã xác minh đầy đủ) — T0 chỉ ghi ứng viên, chưa phải số hiệu chính thức.
2. **T10-165:** lưu ý (a) **KHÔNG có nghịch lý đồng hồ đợt này** — khác #62, không cần phán H1/H2/OVERLAP; btime #69 dùng trực tiếp; (b) claim "reboot #69 TRONG LÚC T10-164 đóng sổ, 2 s sau khi T8 đóng cờ" của T10-164 **ĐƯỢC XÁC NHẬN ĐỘC LẬP** (T8 .done 20:09:29Z, btime 20:09:31Z; boot #68 chết trong (20:09:29Z, 20:09:31Z]); (c) **run 164 BỊ VIẾT LẠI LẦN 2 tại #69** (requeue 20:10:06.432Z, btime +35,432 s) rồi succeed 20:28:17Z theo DB — kết cục + (m) #69 thuộc T7-165/T2-165, T0 không phán; (d) **watcher-164 chết theo reboot #68** (đã xác nhận đợt 164); **watcher-165 CHƯA khởi động** lúc T0 đóng; (e) marker **21 reboot #49–#69** (đếm độc lập, không lặp lỗi T0-162); (f) dpkg.log burst #69 hoàn thành trong boot+35s→boot+167s (1.545 dòng, md5 b9d79ebc) — nhanh hơn hẳn #67, T5-165 diễn giải.
3. **T2-165:** mù #77?/#88?/#94?/#95?/#96?/#97? + **#98? (#67) MỚI** (đoạn Q [17:33:27Z, 18:06:30Z]; gap #67 danh nghĩa 1.983 s làm cơ sở FULL114) + INSIDE chuỗi (dùng btime thật 20:09:31Z — dải FULL114 neo 17:33:27Z: kiểm #68 có INSIDE không, rồi #69; chuỗi đang ở 3 sau #67) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +11 s, /proc/1 +11,43 s cùng họ mẫu) + **đối chiếu độc lập (m) #69** (requeue +35,432 s ∈ [33; 49,8]; T7-165 phán chính thức) + **đối chiếu độc lập (m) #68** (quyết đợt 164 giao T2-165; T7-164 chốt ứng viên DƯƠNG, n ứng viên 21→22 nhánh khuyến nghị hoặc 22→23 nhánh #56 ÂM nếu cả #68 + #69 được chấp nhận — T2 tính lại, T0 không phán).
4. **T5-165:** viết POSTBOOT_PASS #68 + #69 (cả hai CHƯA CÓ lúc T0 đóng ~20:41Z) + vận hành watcher-165 (chưa khởi động lúc T0 đóng) + theo dõi replay #69 (dpkg 1.545 dòng, md5 b9d79ebc, xong boot+167s — nhanh hơn hẳn #67).
5. **T7-165:** kết cục run 164 (DB ghi `succeeded` 20:28:17Z, 8 event, 2 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 454 s thô, slot HB/DR) + điểm (m) #69 (requeue +35,432 s trong dải — chữ ký #63/#66/#68; T7 phán chính thức, T2 đối chiếu). Lưu ý T7: run 164 ĐANG CHẠY tại btime #69 nên mới bị viết lại lần 2 (khác #67: 0 run đang chạy).
6. **T8-165:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + H3 chỉ giám sát thụ động + X11 (đang TRỐNG).
7. **T6-165:** prune lần 40.
8. **T10-165:** tổng hợp — lưu ý chuỗi WebKit FULL PASS đang ở **18** theo đề xuất T10-164 (chờ quyết parent §12.1 (g) đợt 164); chuỗi chỉ lên 19 khi T4-165 có lượt yên hợp lệ trong đợt + O8 T8-165 chạy sau về thời gian TRÊN CÙNG BOOT #69 + gate FOUND chuẩn — **T0 không tự kết luận, parent quyết cuối**.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND165_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round165-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log, DB query run 164/165).

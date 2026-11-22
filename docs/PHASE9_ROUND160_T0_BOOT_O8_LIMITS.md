# PHASE9 ROUND 160 — T0: Boot survey + O8 JSON (REBOOT MỚI #61 ứng viên, sau T10-159 đóng; boot #60 e590ae0a đã chết; O8 check-only, T8-160 sở hữu O8 chính thức)

- Lượt cron 12:35 +07 21/11/2026 = 05:35:51Z 21/11. T0 mở ~05:38Z, đóng ~05:42Z.
- Hạn cờ ~08:00Z, hạn cứng ~08:30Z 21/11. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — ứng viên #61, boot 52c957d5, btime 05:25:49Z (sau T10-159 đóng, trước đợt 160 mở)

Boot lúc mở **KHÁC** boot lúc T10-159 đóng: **52c957d5, btime 1795238749 = 05:25:49Z**, trong khi T10-159 đóng trên boot **e590ae0a (#60, btime 03:05:59Z)**. 7 nguồn độc lập đều khớp boot mới:

| # | Nguồn | Giá trị | Khớp boot mới? |
|---|-------|---------|----------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795238749` = 05:25:49Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `52c957d5-a8dd-4523-822f-acfcde535d3b` | ✓ |
| 3 | `uptime` chính xác (`/proc/uptime`) | 776,81 s lúc epoch 1795239526 → boot 1795238749,19 (khớp btime tới ~0,2 s); kiểm lại 889,73 s lúc 1795239639 → 1795238750 (lệch 1 s do cắt số nguyên) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 05:26:00Z (journal start lag +11 s sau btime — bình thường); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 05:26 still running`; `wtmp begins Sat Nov 21 05:26:00 2026` | ✓ |
| 6 | `/proc/1` start | 05:26:00,456Z (+11,5 s sau btime — bình thường) | ✓ |
| 7 | Mốc thời gian T10-159 đóng | `round159-t10.done` mtime **05:12:39Z**; btime 05:25:49Z muộn hơn **13'10"** → reboot xảy ra sau khi T10-159 đóng, và trước khi đợt 160 mở 05:35:51Z (sớm hơn 10'02") | ✓ |

- **Số hiệu ứng viên: #61** — tiếp nối #60 (e590ae0a, btime 03:05:59Z). **Chờ parent xác nhận** số hiệu trước khi T2-160 dùng làm mốc chính thức (quy tắc đứng: T0 ghi số hiệu ứng viên, parent quyết).
- `dmesg` KHÔNG đọc được (`read kernel buffer failed: Operation not permitted`) — không tính làm nguồn; 7 nguồn trên đã đủ, không cần dmesg.
- Hệ quả: mọi watcher/process của đợt 159 đều đã chết theo #61 (xem §2); mọi timestamp wall trong đợt 160 đều thuộc boot mới.

## §2. Watcher: lúc mở 0; cả 2 watcher đợt 159 đã chết (watcher-159 chết theo #60, T9-159 chết theo #60/#61)

- **Lúc mở (~05:38Z): 0 watcher.** Quét toàn bộ `/proc/*/cmdline` theo mẫu `watch|inotify|fswatch|replay-watch|vcut-poll|test-vite-lock|vcut-vite-lock` chỉ match shell kiểm tra của chính T0 (self-match, xem F-160-T0-1) — không có process watcher thật nào. `ps aux | grep -iE 'watch|inotify|fswatch'` cũng chỉ ra self-match.
- Kiểm `kill -0` các pid watcher đợt 159 đã biết:
  - `replay-watch-159.sh` pid **18158** (T5-159, chạy từ 02:41:21Z trên boot #59): **chết** (`kill: No such process`); log `replay-watch-159.log` dừng ở poll cuối **03:06:26Z** trên boot #59 — chết theo reboot #60 (btime 03:05:59Z), không phải #61.
  - T9-159 sampler pid **12483** / watcher pid **12484** (mở phiên 02:39:49Z trên #59): **chết** (`ps -p` trả rỗng). T9-159 có note đã khởi động lại sampler+watcher bằng tay sau #60, nhưng pid mới không ghi trong note T9 mà T0 đọc được — tuy nhiên quét `/proc` toàn bộ (§2 đầu) đã bao phủ mọi pid, nên kết luận 0 watcher vẫn đứng bất kể pid mới là bao nhiêu.
- Lúc đóng (~05:42Z): vẫn 0 watcher thật. Các thư mục `round160-t1/`, `round160-t4/`–`round160-t9/` đã tồn tại — các thread khác của đợt 160 đã mở, nhưng chưa thread nào khởi động watcher lúc T0 kiểm lần cuối. Watcher-160 thuộc T5-160.

## §3. POSTBOOT_PASS #61: CHƯA CÓ cờ nào (T5-160 sở hữu việc tạo)

- Trên đĩa lúc mở và lúc đóng: **không có POSTBOOT_PASS cho #61 (`52c957d5`)** — grep `52c957d5` trong `hidden_files/round159-t5/` trả 0 kết quả.
- Cờ mới nhất còn trên đĩa vẫn là `round159-t5/POSTBOOT_PASS`, chỉ cover **#59** (`eec65561`, ghi 02:41:22Z, replay đầy đủ); cờ cũ `POSTBOOT_PASS-28366bd0` cover #52. Không có cờ nào cover #60 lẫn #61.
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z ngày 20/11 trên boot #48, reboot #48) — sống qua **13 reboot liên tiếp** #49–#61 (đợt 159 ghi 11 reboot tới #59; nay thêm #60 và #61).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-160 không yêu cầu; T5-160 sở hữu postboot). Trạng thái postboot thực tế trên #61 do T5-160 xác nhận.

## §4. Đồng hồ wall cell lúc mở đợt 160: CHUẨN (±1 s so với Cloudflare) — giao T2-160

Hai lần đo Date header ngoài có bracket giờ local (giờ wall local ghi trước/sau mỗi lần curl), cộng 1 nguồn lỗi:

| Lần đo | Local (bracket) | Cloudflare Date | GitHub Date | Đọc |
|--------|----------------|-----------------|-------------|-----|
| 05:39Z | epoch 1795239544,8–1795239545,32 (05:39:04,8–05:39:05,32Z) | 05:39:06 GMT, epoch 1795239546 (+0,68 đến +1,2 s so với bracket — trong độ trễ request) | — (không đo) | local ≈ Cloudflare |
| 05:39Z | epoch 1795239555,33–1795239555,73 (05:39:15,33–15,73Z) | — | 05:39:08 GMT, epoch 1795239548 (−7,33 đến −7,73 s) | GitHub lệch −7 s (edge lag, xem dưới) |
| 05:39Z | `time.cloudflare.com` | (không trả Date header — request timeout 10 s, bracket 1795239545,32–1795239555,33) | — | nguồn lỗi, không tính |

- **Kết luận:** đồng hồ wall local khớp Cloudflare trong ±1 s lúc 05:39Z — **không còn dấu hiệu chạy nhanh ~42'–50' như đợt 156** (khớp kết luận đợt 158 và 159: đồng hồ đã chuẩn từ reboot #58 và giữ chuẩn sang #59, nay sang #61). Uptime math khớp btime tới ~0,2 s → btime và uptime nhất quán nội bộ.
- **Cảnh báo phương pháp (lặp lại từ đợt 158/159):** GitHub Date header lệch −7,3 đến −7,7 s trong khi Cloudflare khớp local — cùng mẫu −7,05 s ở đợt 159, do lệch giờ giữa các edge server của GitHub, không phải do đồng hồ local nhảy. **Không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-160 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên.
- Hệ quả cho đợt 160: mọi timestamp wall trong đợt này (mở 05:35:51Z) có thể đọc như giờ thật trong sai số ~1 s, trừ khi T2 chứng minh ngược lại.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-159, latest = stamped cuối)

Đối chiếu JSON T8-159 trong `hidden_files/round159-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 159 — T8-160 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-159 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-21T03-01-39-eec65561-pid42587.json` | `dcc2338c…` ✓ | khớp | 21 results, 21 `ok=true` |
| WebKit attempt2 `o8w-clicktest-report-2026-11-21T03-02-31-eec65561-pid42972.json` | `e73190b8…` ✓ | khớp | 21 results, 21 `ok=true` |
| Chromium `o8-clicktest-report-2026-11-21T03-03-21-eec65561-pid43330.json` | `c8df401e…` ✓ | khớp | 21 results, 21 `ok=true` |
| `o8w-clicktest-report.json` (latest) | `e73190b8…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `c8df401e…` ✓ | byte-identical với stamped cuối | — |
| Các bản `...-attempt1.json` / `...-attempt2.json` / `...-chromium.json` | khớp đúng md5 stamped tương ứng ✓ | khớp | — |

Cây md5 lúc mở khớp đúng hồ sơ T0-159 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 159 thuộc boot #59 (eec65561) — nay boot đã là #61 ứng viên, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.

## §6. O8 live: KHÔNG chạy — theo task, T8-160 sở hữu O8 chính thức

- Task T0-160 chỉ yêu cầu **kiểm** cơ chế O8 JSON (§5), không chạy O8 chính thức.
- T8-160 đã mở trước lúc T0 đóng: thư mục `hidden_files/round160-t8/` đã tồn tại (cùng các thư mục round160-t1/t4–t9 khác).
- T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-160.

## §7. Sai số của chính mình (F-160-T0-n)

- **F-160-T0-1 — pgrep/ps watcher match chính lệnh kiểm tra (lặp lại F-159-T0-2):** `pgrep -af` lần đầu match shell `bash -c` của chính lệnh đó (chuỗi lệnh chứa từ "replay-watch"), suýt báo "có watcher". Đã quét lại toàn bộ `/proc/*/cmdline` + `kill -0` các pid watcher đợt 159 → kết luận đúng là 0 watcher. Bài học giữ nguyên: mọi match của pgrep/ps phải đối chiếu cmdline đầy đủ và loại self-match trước khi ghi số.
- **F-160-T0-2 — 1 trong 3 nguồn giờ lỗi:** `time.cloudflare.com` không trả Date header (timeout 10 s), suýt chỉ còn 1 nguồn Cloudflare + GitHub. Kết luận §4 dựa trên cloudflare.com (+0,68–1,2 s) đối chiếu GitHub (−7,3–7,7 s, mẫu edge lag đã biết từ đợt 159), không kết luận từ một nguồn duy nhất.
- **F-160-T0-3 — grep toàn cây hidden_files treo >80 s:** `grep -ril 'postboot'` quét toàn bộ `hidden_files/` (cây lớn) chạy quá 80 s chưa xong; đã kill và dùng grep có mục tiêu trong `round159-t5/` thay thế (0 kết quả cho `52c957d5`). Bài học: luôn giới hạn grep vào thư mục cụ thể, không quét toàn cây.
- **F-160-T0-4 — dmesg không đọc được:** `dmesg: read kernel buffer failed: Operation not permitted` — không tính làm nguồn xác minh boot; 7 nguồn còn lại đã đủ (≥5 theo task).
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung.

## §8. Bàn giao / nợ mở đợt 160

1. **Parent:** xác nhận số hiệu reboot ứng viên **#61** (boot 52c957d5, btime 05:25:49Z) — T0 chỉ ghi ứng viên, chưa phải số hiệu chính thức.
2. **T2-160:** mô hình đồng hồ — dữ liệu mới §4 (local ≈ Cloudflare ±1 s; GitHub −7,3–7,7 s) tiếp tục không ủng hộ Model 1 chạy nhanh; mù #77?/#88?/#92? (giao từ đợt 159) + thu hẹp cửa (m) #56/#60 theo kế hoạch đợt.
3. **T5-160:** viết POSTBOOT_PASS #61 (chưa có cờ — §3); watcher-160 chưa có ai khởi động lúc T0 đóng.
4. **T8-160:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song).
5. **T7-160:** kết cục run 159 (run 159 vẫn running lúc T10-159 đóng — giao từ đợt 159).
6. **T10-160:** tổng hợp — lưu ý T0-160 không chạy postboot check (ngoài task), khác T0-158 có §4 postboot; reboot #61 xảy ra GIỮA 2 đợt (sau T10-159 đóng 05:12:39Z, trước đợt 160 mở 05:35:51Z), không phá lượt đo nào trong đợt 159.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND160_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round160-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t0/`.

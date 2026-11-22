# PHASE9 ROUND 159 — T0: Boot survey + O8 JSON (KHÔNG reboot mới kể từ T10-158 đóng; boot #59 eec65561 giữ nguyên; O8 check-only, T8-159 sở hữu O8 chính thức)

- Lượt cron 09:35 +07 21/11/2026 = 02:35:51Z 21/11. T0 mở ~02:38Z, đóng ~02:41Z.
- Hạn cờ ~05:00Z, hạn cứng ~05:30Z 21/11. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: KHÔNG reboot mới kể từ lúc T10-158 đóng (~02:25Z)

Boot lúc mở = boot lúc T10-158 đóng: **eec65561, btime 1795224827 = 01:33:47Z (reboot #59, đã xác nhận — quyết (s) đợt 158)**. 6 nguồn độc lập đều khớp:

| # | Nguồn | Giá trị | Khớp #59? |
|---|-------|---------|-----------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795224827` = 01:33:47Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `eec65561-8a81-4f1a-99d6-a1ea81606127` | ✓ |
| 3 | `uptime` chính xác (`/proc/uptime`) | 3977,19 s lúc 1795228804,78Z → boot 1795224827,59 (khớp btime tới ~0,6 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 01:33:59Z (journal start lag +12 s sau btime — bình thường); `--list-boots` chỉ còn 1 boot | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 01:33 still running`; `wtmp begins Sat Nov 21 01:33:58 2026` | ✓ |
| 6 | `/proc/1` start | 01:33:58,779Z (+11,8 s sau btime — bình thường) | ✓ |

- Bằng chứng thời gian: `round158-t10.done` mtime **02:24:48Z** (T10-158 đóng); btime 01:33:47Z sớm hơn 51'01" → không thể có reboot nào giữa lúc T10 đóng và lúc T0 mở (reboot sau 02:24Z sẽ cho btime ≥ 02:24Z).
- **Không có boot mới để giao số hiệu** — T2-159 không cần phán số hiệu reboot cho khoảng này (chỉ phán nếu phát hiện reboot sau trong đợt).

## §2. Watcher: lúc mở 0; cả 2 watcher đợt 158 đã chết tự nhiên (không do reboot)

- **Lúc mở (~02:38Z): 0 watcher.** `ps aux | grep -iE 'watch|inotify|fswatch'` + quét toàn bộ `/proc/*/cmdline` chỉ match các shell kiểm tra của chính T0 (self-match) — không có process watcher thật nào. `pgrep -af 'test-vite-lock|vcut-vite-lock|vcut-poll-quiet|replay-watch'` trả exit 1 (không match).
- Cả 2 watcher đợt 158 đều đã chết lúc T0 kiểm (`kill -0` fail):
  - `round158-t9/b2-watcher.sh` pid 9792 (load-spike watcher của T9-158, chạy từ 23:41Z).
  - `replay-watch-158.sh` pid 10867 (replay watcher của T5-158, chạy từ 23:43Z).
  - Không có reboot nào giữa 23:43Z và 02:38Z (§1) → cả hai tự thoát hoặc bị owner dừng, không phải chết theo reboot. T0 chỉ quan sát, không khởi động watcher nào.
- Lúc đóng (~02:40Z): vẫn 0 watcher thật. Các thư mục `round159-t1/`, `round159-t6/`, `round159-t8/`, `round159-t9/` đã tồn tại — các thread khác của đợt 159 đã mở, nhưng chưa thread nào khởi động watcher lúc T0 kiểm lần cuối.

## §3. POSTBOOT_PASS #59: CHƯA CÓ cờ nào (T5-159 sở hữu việc tạo)

- Trên đĩa lúc mở và lúc đóng: **không có POSTBOOT_PASS cho #59 (`eec65561`)** — grep `postboot` trong `hidden_files/` trả 0 kết quả.
- Cờ mới nhất còn trên đĩa vẫn là `round157-t5/POSTBOOT_PASS`, chỉ cover **#56** (`348dab54`); cờ cũ `POSTBOOT_PASS-5353ed19` cover #52. T0 không tự viết cờ.
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:40Z trên boot #48, reboot #48) — sống qua **11 reboot liên tiếp** #49–#59 (đợt 158 ghi 10 reboot tới #58; nay thêm #59).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-159 không yêu cầu; T5-159 sở hữu postboot). Trạng thái postboot thực tế trên #59 do T5-159 xác nhận.

## §4. Đồng hồ wall cell lúc mở đợt 159: CHUẨN (±1 s so với Cloudflare) — giao T2-159

Ba lần đo Date header ngoài có bracket giờ local (giờ wall local ghi trước/sau mỗi lần curl), cộng 1 lần đo sớm:

| Lần đo | Local (bracket) | Cloudflare Date | GitHub Date | Đọc |
|--------|----------------|-----------------|-------------|-----|
| 02:38Z | epoch 1795228731 (02:38:51Z) | 02:38:52 GMT (+~1 s, trong độ trễ request) | — (không đo) | local ≈ Cloudflare |
| 02:39Z | 1795228787–1795228787 | 02:39:48, epoch 1795228788 (+0,51 s so với giữa bracket) | — | local ≈ Cloudflare |
| 02:39Z | 1795228787–1795228788 | — | 02:39:41, epoch 1795228781 (−7,05 s) | GitHub lệch −7 s (edge lag, xem dưới) |
| 02:39Z | 1795228788–1795228788 | 02:39:49, epoch 1795228789 (+0,47 s) | — | local ≈ Cloudflare |

- **Kết luận:** đồng hồ wall local khớp Cloudflare trong ±1 s lúc 02:39Z — **không còn dấu hiệu chạy nhanh ~42'–50' như đợt 156** (khớp kết luận đợt 158: đồng hồ đã chuẩn từ reboot #58 và giữ chuẩn sang #59). Uptime math khớp btime tới ~0,6 s → btime và uptime nhất quán nội bộ.
- **Cảnh báo phương pháp (lặp lại từ đợt 158):** GitHub Date header lệch −7,05 s trong khi Cloudflare khớp local cả 3 lần — do lệch giờ giữa các edge server của GitHub, không phải do đồng hồ local nhảy. **Không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-159 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên.
- Hệ quả cho đợt 159: mọi timestamp wall trong đợt này (mở 02:35:51Z) có thể đọc như giờ thật trong sai số ~1 s, trừ khi T2 chứng minh ngược lại.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ, latest = stamped cuối)

Đối chiếu JSON T8-156 trong `hidden_files/round156-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 156 — T8-157/T8-158 dùng lại cơ chế này; T8-159 đã mở, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-156/T0-158 | Nội dung kiểm bằng python |
|------|-------------|----------------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-20T19-34-17-c99a1045-pid10439.json` | `78ac5a61…` ✓ | khớp | 21 results, 21 `ok=true` |
| WebKit attempt2 `o8w-clicktest-report-2026-11-20T19-35-12-c99a1045-pid10785.json` | `831d4b9b…` ✓ | khớp | 21 results, 21 `ok=true` |
| Chromium `o8-clicktest-report-2026-11-20T19-36-02-c99a1045-pid11127.json` | `7e4d9dd9…` ✓ | khớp | 21 results, 21 `ok=true` |
| `o8w-clicktest-report.json` (latest) | `831d4b9b…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `7e4d9dd9…` ✓ | byte-identical với stamped cuối | — |
| Các bản `...-attempt1.json` / `...-attempt2.json` / `...-chromium.json` | khớp đúng md5 stamped tương ứng ✓ | khớp | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-156 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- (Lưu ý như đợt 158: `packages/video-spec/src/effects.js` là file khác, không thuộc hồ sơ O8.)

## §6. O8 live: KHÔNG chạy — theo task, T8-159 sở hữu O8 chính thức

- Task T0-159 chỉ yêu cầu **kiểm** cơ chế O8 JSON (§5), không chạy O8 chính thức.
- T8-159 đã mở trước lúc T0 đóng: thư mục `hidden_files/round159-t8/` đã có `o8-driver-159t8.sh`, `run-chromium-159t8.sh`, `rebuild-fixtures-159t8.sh`, `o8-webkit/`, `o8-chromium/` — đang chuẩn bị lượt đo chính thức.
- T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-159.

## §7. Sai số của chính mình (F-159-T0-n)

- **F-159-T0-1 — lần đo drift đầu tiên chỉ có 1 nguồn Cloudflare + GitHub vắng mặt:** lần curl đầu (02:38Z) chỉ lấy được Cloudflare Date, `time.cloudflare.com` không trả Date header (request thứ hai trong cùng lệnh trả rỗng), suýt kết luận từ 1 nguồn. Đã đo lại bằng python với bracket epoch trước/sau cho cả Cloudflare (2 lần, +0,51 s / +0,47 s) và GitHub (1 lần, −7,05 s) trước khi ghi kết luận §4. Bài học (lặp lại F-158-T0-2): không kết luận lệch đồng hồ từ một nguồn Date header duy nhất — luôn đo chéo ≥ 2 nguồn độc lập.
- **F-159-T0-2 — pgrep watcher match chính lệnh kiểm tra:** `pgrep -af watch` lần đầu match shell `bash -c` của chính lệnh đó (chuỗi lệnh chứa từ "watch"), suýt báo "có watcher". Đã quét lại toàn bộ `/proc/*/cmdline` + `ps aux` lọc self-match, và `kill -0` 2 pid watcher đợt 158 → kết luận đúng là 0 watcher. Bài học: mọi match của pgrep/ps phải đối chiếu cmdline đầy đủ và loại self-match trước khi ghi số.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung.

## §8. Bàn giao / nợ mở đợt 159

1. **T2-159:** mô hình đồng hồ — dữ liệu mới §4 (local ≈ Cloudflare ±1 s; GitHub −7 s) tiếp tục không ủng hộ Model 1 chạy nhanh; mù #77?/#88?/#91? (giao từ đợt 158) + thu hẹp cửa (m) #56 theo kế hoạch đợt.
2. **T5-159:** viết POSTBOOT_PASS #59 (chưa có cờ — §3); watcher-159 chưa có ai khởi động lúc T0 đóng.
3. **T8-159:** O8 chính thức (đang chuẩn bị; T0 chỉ kiểm tĩnh §5, không chạy song song).
4. **T7-159:** kết cục run 158 (run 158 vẫn running lúc T10-158 đóng).
5. **T10-159:** tổng hợp — lưu ý T0-159 không chạy postboot check (ngoài task), khác T0-158 có §4 postboot.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND159_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round159-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t0/`.

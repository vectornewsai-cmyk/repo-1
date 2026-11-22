# PHASE9 ROUND 158 — T0: Boot survey + O8 JSON (KHÔNG reboot mới kể từ T10-157 đóng; boot #58 28366bd0 giữ nguyên; postboot ĐÃ XONG theo check-only exit 0; O8 live BỎ QUA có chủ ý vì T8-158 đang chạy chính thức)

- Lượt cron 06:35 +07 21/11/2026 = 23:35:51Z 20/11. T0 mở ~23:38Z, đóng ~23:48Z.
- Hạn cờ ~02:00Z, hạn cứng ~02:30Z 21/11. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS.

## §1. Kết luận boot: KHÔNG reboot mới kể từ lúc T10-157 đóng (~23:28Z)

Boot lúc mở = boot lúc T10-157 đóng: **28366bd0, btime 1795215968 = 23:06:08Z (reboot #58, đã xác nhận — quyết (s) đợt 157)**. 6 nguồn độc lập đều khớp:

| # | Nguồn | Giá trị | Khớp #58? |
|---|-------|---------|-----------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156; cấm stat /proc/1 hay journal first entry làm btime) | `1795215968` = 23:06:08Z | ✓ |
| 2 | `boot_id` | `28366bd0-d6d6-4a50-a386-666c0aa3c062` | ✓ |
| 3 | `uptime` (2 lần) | 1958,87 s lúc 23:38:47Z → boot 23:06:08; 2441,33 s lúc 23:46:49Z → boot 23:06:08 (khớp tới ~0,1 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 23:06:19Z (journal start lag +11 s sau btime — bình thường); `--list-boots` chỉ còn 1 boot, log boot cũ đã mất theo rootfs rebuild | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Fri Nov 20 23:06 still running`; `wtmp begins Fri Nov 20 23:06:19 2026` | ✓ |
| 6 | Date header ngoài | Cloudflare ≈ đồng hồ local (±1 s, §5); GitHub dao động −6..−11 s — không dùng làm chuẩn giờ | ~ (xem §5) |

- Bằng chứng thời gian: `round157-t10.done` mtime **23:28:45Z** (T10-157 đóng); btime 23:06:08Z sớm hơn 22'37" → không thể có reboot nào giữa lúc T10 đóng và lúc T0 mở (reboot sau 23:28Z sẽ cho btime ≥ 23:28Z).
- **Không có boot mới để giao số hiệu** — T2-158 không cần phán số hiệu reboot cho khoảng này (chỉ phán nếu phát hiện reboot sau trong đợt).

## §2. Watcher: lúc mở KHÔNG có; lúc đóng có 2 (đều do thread khác khởi động)

- **Lúc mở (~23:38Z): 0 watcher.** `ps` không còn watcher nào — khớp coordinator thấy lúc mở; watcher-157 pid 3428 đã chết theo reboot #57.
- **Lúc đóng (~23:46Z): 2 watcher đang chạy** (T0 chỉ quan sát, không khởi động cái nào):
  - `round158-t9/b2-watcher.sh` pid 9792, chạy từ 23:41Z — load-spike watcher của T9 (check load1 mỗi 30 s, log khi ≥ 3,0). **Không phải replay watcher.**
  - `replay-watch-158.sh` pid 10867, chạy từ 23:43Z — replay watcher của **T5-158** (script đã có sẵn trong `round158-t5/` từ trước khi T0 kiểm lần 2).
- Việc khởi động/quản lý watcher-158 thuộc T5-158 — T0 chỉ kiểm tra và báo, đúng task.

## §3. POSTBOOT_PASS #57/#58: CHƯA CÓ cờ nào (T5-158 sở hữu việc tạo)

- Trên đĩa lúc mở và lúc đóng: **không có POSTBOOT_PASS cho #57 (`bcbaa3ad`) hay #58 (`28366bd0`)**.
- Cờ mới nhất còn trên đĩa là `round157-t5/POSTBOOT_PASS`, chỉ cover **#56** (`348dab54`, PASS poll0 20:54:39Z, replay-đầy-đủ); cờ cũ `POSTBOOT_PASS-5353ed19` cover #52.
- **Trạng thái postboot thực tế trên #58 đã XONG (xem §4)** — cờ chỉ là bookkeeping của T5-158; T0 không tự viết cờ.
- #57: không có cờ; bracket replay #57 đã mất cùng rootfs khi sang #58 (không kẹp được nữa — T5-158 ghi nhận).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z trên boot #48) — sống qua **10 reboot liên tiếp** #49–#58 (đợt 157 ghi 8 reboot tới #56; nay thêm #57, #58).

## §4. Trạng thái postboot thực tế trên boot #58: ĐÃ XONG (check-only, không repair)

- Chạy `bash apps/web/scripts/vcut-webkit-postboot-check.sh` (check-only, **không** `--repair`) ~23:44Z → **exit 0**, kết luận: `KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-20 23:06:08)`.
  - PASS wrapper (LD_LIBRARY_PATH), PASS libs (libevent/libEGL/libavif/libdw/libevdev hệ thống), GST thư mục thật 269 file = debroot 269, PASS GST (isomp4 + libav), PASS apt đủ 11 package WebKit/GST.
- Kiểm độc lập bằng `dpkg`/`ls` (không dựa vào script): đủ **11/11 gói đúng danh sách NEED trong script** (dòng 746: libevent-2.1-7t64, gstreamer1.0-plugins-base/good/bad/ugly, gstreamer1.0-gl, gstreamer1.0-libav, gstreamer1.0-x, libavif16, libgstreamer1.0-0, libevdev2 — mỗi gói `dpkg -l` trả 1 dòng `^ii`). Lưu ý tên gói thật là `gstreamer1.0-gl` / `gstreamer1.0-x`, không phải `gstreamer1.0-plugins-gl` (tên sai này trả 0 — xem F-158-T0-3).
- Các số độc lập khác: `dpkg -l ^ii` 952 dòng; cache 178 `.deb` (khớp số T8-156 tự kiểm — sống qua reboot); lists 34 mục thật (đợt 157 lúc mở #56 chỉ còn 3 mục: auxfiles/lock/partial); GST system plugins 269 file; 0 tiến trình apt/dpkg chạy lúc kiểm.
- **Bracket replay #58 kẹp được từ `dpkg.log`:** hoạt động apt đầu tiên 23:06:50Z (boot +42 s), hoạt động cuối 23:08:51Z (boot +2'43"), 1545 dòng trong giờ 23:xx ngày 20/11, gói cuối `gstreamer1.0-tools` → khoảng **(0'42", 2'43"]** — nhanh, cùng nhóm boot #48 (2'44"), nhanh hơn hẳn #46 (7'08") và #47 (27,7'). Không có entry dpkg/apt nào sau 23:08:51Z → replay đã yên ≥ 35 phút lúc T0 kiểm.
- **Bẫy đọc nhầm — đã tránh:** dòng `[postboot ...]` đầu tiên trong output của script là ghi chú lịch sử của boot #41 (e9295700, btime 01:25:51Z), không phải số liệu boot này. Chỉ các dòng PASS/KET LUAN live mới là số liệu #58.

## §5. Đồng hồ wall cell lúc mở đợt 158: HIỆN ĐANG CHUẨN (±1 s so với Cloudflare) — giao T2-158

Bốn lần đo Date header ngoài (giờ wall local ghi trước/sau mỗi lần curl):

| Lần đo | Local (trước → sau) | GitHub Date | Cloudflare Date | Đọc |
|--------|--------------------|-------------|-----------------|-----|
| 23:39Z | 1795217975,79 → 1795217976,59 | 1795217977 (+0,4..+1,2 s, trước local) | — (không đo) | — |
| 23:46Z | 1795218376,03 → 1795218376,93 | 1795218368 (−8..−9 s) | — (không đo) | — |
| 23:46Z try1 | 1795218402,34 → 1795218405,06 | 1795218394 (−8..−11 s) | 1795218405 (≈ local, trong cửa sổ đo) | local ≈ Cloudflare |
| 23:46Z try2 | 1795218407,13 → 1795218407,89 | 1795218401 (−6..−7 s) | 1795218408 (+0,1..+0,9 s, đúng bằng độ trễ request) | local ≈ Cloudflare |

- **Kết luận:** đồng hồ wall local khớp Cloudflare trong ±1 s lúc 23:46Z — **không còn dấu hiệu chạy nhanh ~42'46"–50'26" như đợt 156** (Model 1 không được dữ liệu lúc mở đợt 158 ủng hộ; có thể đồng hồ đã được chỉnh ở reboot #58, hoặc drift không tích lũy như giả thuyết). Uptime math khớp btime tới ~0,1 s ở cả 2 lần đo (23:38, 23:46) → btime và uptime nhất quán nội bộ.
- **Cảnh báo phương pháp:** GitHub Date header dao động ~9 s giữa các lần đo trong vòng 7 phút (từ +1,2 s tới −11 s) — gần như chắc chắn do lệch giờ giữa các edge server của GitHub, không phải do đồng hồ local nhảy (Cloudflare ổn định, khớp local cả 2 lần). **Không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-158 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên.
- Hệ quả cho đợt 158: mọi timestamp wall trong đợt này (mở 23:35:51Z) có thể đọc như giờ thật trong sai số ~1 s, trừ khi T2 chứng minh ngược lại.

## §6. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ, latest = stamped cuối)

Đối chiếu JSON T8-156 trong `hidden_files/round156-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 156 — T8-157 dùng lại cơ chế này):

| File | md5 (8 đầu) | Hồ sơ T10-156/T0-157 | Nội dung kiểm bằng python |
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

- (T0-158 cũng đối chiếu lại lớp T8-156 mới nhất — đủ cho "cơ chế còn đúng", như cách T0-157 làm với T8-156. Lưu ý: `packages/video-spec/src/effects.js` là file khác, md5 `c7a36b14`, không thuộc hồ sơ O8.)

## §7. O8 WebKit kiểm chứng live: BỎ QUA CÓ CHỦ Ý — 0 attempt

- **Điều kiện kỹ thuật đã đủ:** postboot xong (§4, check-only exit 0) nên theo task, T0 được phép chạy O8 kiểm chứng.
- **Nhưng T0 quyết định KHÔNG chạy live, vì T8-158 đang chạy chính thức:**
  - T8-158 đã mở ~23:41Z (`OPEN-NOTE-158t8.txt`: cùng boot #58, cây khớp, fixture `/tmp` đang rebuild lại lần 1 theo quy tắc (l), waiter deadline 01:30Z).
  - Lúc 23:44Z process `test-vite-lock-v2.sh` đang chạy — T8 đang chuẩn bị lượt đo chính thức.
  - Chạy O8 song song sẽ tranh vite lock/port + CPU với lượt đo chính thức, có nguy cơ làm lệch số đo lượt yên — margin WebKit đang mỏng (59 ms/60 ms đợt 157, chuỗi FULL PASS đang ở 12) — và không thêm thông tin gì so với kiểm chứng tĩnh §6 + lượt chính thức của T8.
- **Đây KHÔNG phải lỗi F-156-T0-1** (chạy O8 trước khi postboot xong). Đây là skip có chủ ý SAU KHI postboot đã xong, vì lý do tránh va chạm với lượt đo chính thức. O8 chính thức đợt 158 thuộc T8-158; nếu parent muốn T0 chạy thêm lượt kiểm chứng, có thể chạy sau khi T8 xong, trên cùng boot/cây.
- T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với ai.

## §8. Sai số của chính mình (F-158-T0-n)

- **F-158-T0-1 — md5 lần đầu sai đường dẫn:** lần md5 đầu tiên dùng `apps/web/src/components/preview.tsx` và `apps/web/src/lib/media.ts` (đoán theo tên thư mục) → cả hai `No such file`. Đã tự phát hiện bằng `find`, đường dẫn thật là `apps/web/src/preview.tsx` và `apps/web/src/media.ts` (xem F-157-T10-2). Không ảnh hưởng kết quả (md5 cuối đều khớp hồ sơ).
- **F-158-T0-2 — kết luận vội từ 1 lần đo GitHub Date:** lần đo đầu (23:39Z) cho GitHub +0,4..+1,2 s so với local, suýt kết luận "local chậm ~1 s". Ba lần đo sau cho GitHub −6..−11 s; đo chéo Cloudflare mới cho kết luận đúng (local ≈ Cloudflare ±1 s; GitHub tự dao động ~9 s). Bài học: không kết luận lệch đồng hồ từ một nguồn Date header duy nhất — luôn đo chéo ≥ 2 nguồn độc lập trước khi ghi số.
- **F-158-T0-3 — kiểm gói sai tên:** lần kiểm độc lập đầu dùng tên `gstreamer1.0-plugins-gl` (trả 0) và `libdw1` (trả 0) — cả hai đều không phải tên gói thật. Đã đọc danh sách NEED đúng trong script (dòng 746) và kiểm lại đủ 11/11 tên chính xác. Bài học: khi kiểm tay, lấy tên gói từ chính script/NEEDED list, không đoán theo quy ước đặt tên.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung.

## §9. Bàn giao / nợ mở đợt 158

1. **T2-158:** mô hình đồng hồ — dữ liệu mới §5 (local ≈ Cloudflare ±1 s; GitHub dao động ~9 s) không ủng hộ Model 1 tiếp tục chạy nhanh; mù #88? (MỞ) + verdict cuối #89? + thu hẹp cửa (m) #56 theo kế hoạch đợt.
2. **T5-158:** viết POSTBOOT_PASS #57/#58 (trạng thái đã xong — §4, chỉ còn viết cờ); watcher-158 đã chạy (pid 10867, từ 23:43Z).
3. **T8-158:** O8 chính thức (đang chuẩn bị; T0 đã nhường, không chạy song song).
4. **T7-158:** kết cục run 157.
5. **T10-158:** tổng hợp — lưu ý quyết định skip O8 live của T0 ở §7 (có chủ ý, có lý do), không phải thiếu attempt do lỗi.

## §10. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND158_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round158-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t0/`.

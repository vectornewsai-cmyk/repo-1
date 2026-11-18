# Đợt 129 T8 — Vite harness webkit 84l10/85m4/86n2: 3/3 exit 0 trên boot #76 (sau reboot giữa lượt)

Ngày: 17/11/2026 (lượt cron 15:35 +07; làm 08:39–09:47Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chạy lại 3 harness webkit + fixture khôi phục + kiểm mirror/kiểm kê + tsc/vite build + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness nào, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND128_LIMITS.md §11 mục 1 (lịch lệch T4-yên TRƯỚC, T8-harness SAU) + LIMITS T3 đợt 128 §9 mục 1 (85m4 đã có kết quả đầy đủ đợt 128 — đợt này chạy lại bộ 3 trên boot mới theo quyết parent cập nhật giữa đợt).

## 0. Hai boot trong một đợt — #75 rồi #76 (reboot GIỮA LUỘT, lần đầu tiên)

- Lượt mở trên boot **#75** (boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`, btime 07:13:31Z theo kernel; `stat /proc/1` 07:13:45Z — chênh 14 s).
- Máy **reboot giữa lượt → boot #76** (boot_id `88f62ae6-a216-42a9-8a81-b36fd83ca019`, btime 09:02:12Z theo kernel; `stat /proc/1` 09:02:28Z — chênh 16 s; journal first entry 09:02:29Z theo T5). Boot #75 CHẾT trong khung (08:59:16Z, 09:02:12Z] (ghi chú T5). Đây là **lần đầu tiên reboot rơi giữa lượt** — 4 lần trước đều rơi vào khoảng giữa đợt đóng và lượt mở (LIMITS gộp đợt 128 §12.1 mục 4).
- Lần chạy harness đầu tiên trên #75 bị giết giữa chừng (xem §2). Toàn bộ kết quả chính thức của đợt này là **lần chạy lại trên #76** (xem §4) — theo cập nhật giữa đợt của parent: chạy trên boot cũ đã chết không tính, chạy lại bộ harness trên #76 sau khi kiểm cờ POSTBOOT_PASS mới.
- `/tmp` bị xóa theo reboot: fixture phải tạo lại 2 lần (boot #75 lúc 08:39Z, boot #76 lúc ~09:08Z). Không mất file trên đĩa bền (`/home/hatch`). RAM khả dụng dao động 520–2.408 MB trong đợt — dưới guard 6 GB, birefnet không thử (đúng luật).

## 1. Kết luận ngắn

- **84l10 nhánh WEBKIT — exit 0, KHÔNG FAIL (boot #76):** W1-lần1/2/3 PASS, W2 PASS, E4 PASS (97 s giữ lock, 09:35:10–09:36:47Z). Trên boot #75 cũng đã PASS exit 0 trước reboot (71 s, 08:59:52–09:01:03Z) — xem §2.
- **85m4 nhánh WEBKIT (bản hb128) — exit 0, KHÔNG FAIL (boot #76):** P1–P5 PASS (160 s, 09:37:02–09:39:42Z). **P3 KHÔNG kẹt** (đồng bộ 2,8 s; phát thường 20 s, 0 restart). Kẹt P3 đợt 127 tiếp tục KHÔNG tái hiện — đây là lần chạy sạch thứ hai liên tiếp (đợt 128 + đợt 129), nhưng nguyên nhân kẹt đợt 127 VẪN CHƯA CHỨNG MINH (xem §7 mục 1).
- **86n2 nhánh WEBKIT — exit 0, KHÔNG FAIL (boot #76):** P1–P5 PASS (274 s giữ lock tính cả chờ acquire, 09:40:42–09:45:16Z).
- **Heartbeat HB128 lần đầu tiên được thử lửa thật:** 2 dòng `waitForPlaySync` đã bắn trong lúc chờ đồng bộ thật >5 s (P4-lần1 6,5 s, P4-lần3 5,2 s) — chứng minh heartbeat ghi log đúng ngay cả khi `page.evaluate` chờ lâu. Đợt 128 có 0 dòng loại này vì mọi lần đồng bộ đều xong dưới 5 s.
- **Đồng bộ chậm hơn hẳn đợt 128** (P4 85m4: 6,5/5,0/5,2 s so với 1,8/1,3/1,3 s trên boot #74; P4 86n2: 2,4/6,0/5,5 s so với 1,8/1,3/1,8 s trên boot #73) — trùng cửa sổ RAM khả dụng thấp (tối thiểu 511 MB trong lúc chạy, xem §4). Chỉ ghi tương quan, KHÔNG kết luận RAM là nguyên nhân (xem §7 mục 4).
- **Fixture `/tmp` tạo lại 2 lần — md5 khớp đủ 32 ký tự đợt 126 (cả 4 file, cả 2 boot).**
- **Mirror còn nguyên sau reboot:** 25/25 file mirror L8 khớp `md5_after` trong `round122-t8/edit-log.json`, 0 đổi 0 mất (kiểm 2 lần: boot #75 và boot #76). **Kiểm kê toàn repo: 238 file ứng viên, 0 mới, 0 mất** so với đợt 128 (diff 0 dòng); **201/201 harness vite dev đã phủ mirror** (200 tự ghi + 1 thừa hưởng 65r8/82j3 — con số 201 đã tính bản hb128 thêm từ đợt 128).
- **tsc-web exit 0, vite build exit 0 — chạy 1 lần trên boot #76** (tsc 32 s, vite built 12,03 s).

## 2. Lần chạy trên boot #75 — bị reboot giết giữa 85m4 (KHÔNG tính vào kết quả chính)

Driver: `hidden_files/round129-t8/run-webkit-129t8.sh` (Xvfb riêng `:199` + TỰ KILL + unlink socket sau kill; mỗi harness acquire lock v2 riêng `t8-round129` rồi nhả ngay). Bằng chứng đầy đủ đã snapshot vào `smoke/attempt-b75/` (summary + log 84l10/85m4 + xvfb + ram + toàn bộ l10/m4-scratch) TRƯỚC khi chạy lại trên #76, tránh bị ghi đè.

| Harness | Thời gian (boot #75) | Kết quả |
|---|---|---|
| 84l10 | 08:59:52–09:01:03Z (71 s) | **exit 0, KHÔNG FAIL** — W1-lần1/2/3 PASS (đồng bộ 0,2/1,9/1,3 s; restartEndedVideo 0→1→2→3), W2 PASS (playhead cuối=30), E4 PASS (ct cuối=4, ended=true) |
| 85m4-hb128 | 09:01:36–~09:02:45Z (bị giết) | **DỞ DANG do reboot, KHÔNG phải kẹt P3, KHÔNG phải fail sản phẩm** — P1 PASS (đồng bộ 1,3 s), P2 PASS (reset xong 897 ms), P3 đồng bộ 1,8 s rồi sampling bình thường: heartbeat HB128 đều 5 s/lần tới 09:02:41Z (elapsed=10s, n=29/100, ct=11,245, playhead=11,033, seeking=false); 4 s sau MiniBrowser chết (exitCode=1, `page.evaluate: Target page, context or browser has been closed`) đúng lúc máy reboot. Report JSON `ok=false` chỉ vì browser bị giết giữa chừng |
| 86n2 | — | **CHƯA CHẠY** (driver bị SIGTERM trước khi tới lượt) |

- Driver bị SIGTERM lúc ~09:02:45Z (đúng lúc harness 85m4 ghi dòng FAIL cuối) — runtime kill theo reboot, không phải lỗi driver. Dọn dẹp sau kill: 0 process Xvfb/vite/MiniBrowser/node sót; `/tmp/.X11-unix/` trống; socket X199 không còn (trap cleanup đã chạy hoặc reboot đã xóa `/tmp`).
- **Lưu ý đồng hồ (ghi rõ, không tự kết luận):** log harness cuối cùng 09:02:45.924Z (đồng hồ boot #75) trong khi btime boot #76 là 09:02:12Z — chênh ~33 s. Khả năng cao đồng hồ boot cũ chạy nhanh hơn đồng hồ boot mới ~33 s tại thời điểm reboot (T5 ghi khung chết #75 là (08:59:16Z, 09:02:12Z] theo đồng hồ mới). Con số 09:02:45Z chỉ dùng để định vị tương đối trong log harness, không dùng làm thời điểm reboot tuyệt đối.
- Lock vite còn holder cũ sau reboot (thread=t8-round129, pid 17164, boot #75) — script lock tự nhận stale (boot đổi + pid chết + không vite/cổng) và đã dọn trước lần chạy #76 (status TRỐNG lúc 09:32Z, 0 ticket + 70 cooldown). T8 không xóa tay.

## 3. Cờ POSTBOOT_PASS mới cho boot #76 — đã kiểm trước khi chạy lại

- T5 chạy `--repair` 1 lần thành công sau replay dạng (B) (theo cập nhật parent giữa đợt); cờ `round129-t5/POSTBOOT_PASS` MỚI: `boot_id=88f62ae6-a216-42a9-8a81-b36fd83ca019 btime=2026-11-17T09:02:12Z pass_at=2026-11-17T09:32:15Z poll=28` — khớp boot hiện tại. Cờ cũ #75 (08:43:05Z) đã thành `POSTBOOT_PASS.b75-stale`, không dùng.
- T8 tự kiểm lại bằng đọc (không sửa hạ tầng): đủ libevent-2.1/libEGL/libavif/libevdev trong ldconfig; GST 269 file gồm `libgstisomp4.so` + `libgstlibav.so`; **replay #76: 109 dòng `status installed` trong `/var/log/dpkg.log`, tất cả từ 09:00Z** — khớp con số parent đưa (109 gói WebKit/GST + deps, không phải toàn bộ 217 gói như replay #74). Mirror không khác baseline (xem §1) — replay hẹp không đụng file repo.
- Waiter poll mỗi 60 s từ 09:08:46Z; cờ xuất hiện poll 25 lúc 09:32:46Z (sau 24 phút). Không chạy harness trước cờ.

## 4. Lần chạy lại trên boot #76 — 3/3 exit 0

Driver như §2 (Xvfb `:199` mới, lock `t8-round129`). Tổng hợp `smoke/run-webkit-summary.txt`, log từng harness `smoke/run-webkit-<tag>.log` (+ snapshot `smoke/attempt1/`), scratch riêng `round129-t8/<tag>-scratch/`. RAM sampler nền 30 s/lần (kill cả nhóm process lúc dọn — không còn sleep sót).

| Harness | Lock giữ | Thời gian | Kết quả |
|---|---|---|---|
| 84l10 `clicktest-84l10-webkit-loop-w1.mjs` (L10_ENGINE=webkit) | 97 s | 09:35:10–09:36:47Z | **exit 0, KHÔNG FAIL** — W1-lần1/2/3 PASS (đồng bộ 1,2/2,4/1,7 s; restartEndedVideo 0→1→2→3, hạ-cánh-về-target=true, errors=0), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối, ct cuối=4, ended=true) |
| 85m4 `clicktest-85m4-webkit-w7-hb128.mjs` (M4_ENGINE=webkit) | 160 s | 09:37:02–09:39:42Z | **exit 0, KHÔNG FAIL** — P1 PASS (đồng bộ 0,9 s; 0 restart dư), P2 PASS (reset xong 973 ms; 0 restart dư), **P3 PASS (đồng bộ 2,8 s; phát thường 20 s, 0 restart)**, P4-lần1/2/3 PASS (đồng bộ 6,5/5,0/5,2 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart dư; seek kẹt dài nhất 3 mẫu ~0,6 s). Report JSON `ok=true`, `consoleErrs=[]` |
| 86n2 `clicktest-86n2-webkit-w7.mjs` (N2_ENGINE=webkit) | 274 s (gồm 60 s chờ acquire) | 09:40:42–09:45:16Z | **exit 0, KHÔNG FAIL** — P1 PASS (0 restart dư), P2 PASS (reset xong 805 ms), P3 PASS (0 restart), P4-lần1/2/3 PASS (đồng bộ 2,4/6,0/5,5 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart dư; seek kẹt dài nhất 3 mẫu ~0,6 s). Report JSON `ok=true`, `consoleErrs=[]` |

Về heartbeat HB128 đợt này (21 dòng trong m4-run.log):
- **2 dòng `waitForPlaySync` ĐÃ BẮN — lần đầu tiên:** P4-lần1 elapsed=5s (playhead=4,167, ct=22,6, playing=true) rồi đồng bộ xong ở 6,5 s; P4-lần3 elapsed=5s (playhead=3,533, ct=3,533, paused=true, seeking=true) rồi đồng bộ xong ở 5,2 s. Đây là bằng chứng trực tiếp đầu tiên rằng heartbeat ghi log đúng trong lúc chờ đồng bộ thật >5 s — đợt 128 có 0 dòng loại này vì mọi lần đồng bộ đều xong dưới 5 s. Nếu kẹt P3 đợt 127 tái hiện, heartbeat đã sẵn sàng ghi dòng đầu tiên sau điểm kẹt.
- 19 dòng còn lại là `sampleFor` đều 5 s/lần (P1-phaseA, P2-phaseB, P3-control, P5-phaseB-long) — sampling tiến triển bình thường, không khoảng trống.
- P5 seek kẹt dài nhất 3 mẫu (~0,6 s) ở cả 85m4 và 86n2 (đợt 128 là 0 mẫu) — vẫn PASS, chỉ ghi nhận; chưa đủ cơ sở gọi là hồi quy (n=1, RAM thấp, xem §7 mục 4).

Về RAM trong lúc chạy (sampler 30 s, 27 mẫu): khả dụng **tối thiểu 511 MB** (lúc bắt đầu 09:35Z), tối đa 2.200 MB, lúc kết thúc ~1.588 MB; swap đã dùng ~350–400 MB. Mức tối thiểu 511 MB cao hơn cửa sổ kẹt đợt 127 (~325–361 MB) nhưng vẫn là biên mỏng — đồng bộ chậm (P4 5–6,5 s) trùng cửa sổ này.

## 5. Lịch lệch T4/T8 — đính chính: T4 đã đóng từ trước reboot, không có attempt2

- Cờ `round129-t4-done` xuất hiện 08:58:20Z (sau 17 phút chờ, poll 60 s) — T8 chỉ bắt đầu harness SAU cờ, đúng quyết parent đợt 128 §12.3(b).
- **Đính chính ghi chú của T5** ("T4 attempt2 bị giết giữa chừng bởi reboot"): **KHÔNG CÓ attempt2 nào.** LIMITS T4 (`docs/PHASE9_ROUND129_T4_WEBKIT_QUIET7_LIMITS.md`, 19.984 B, mtime 09:01Z — ~31 s trước reboot): lượt yên #7 **ĐÃ ĐÓNG với chỉ attempt1** (20/20, exit 0, median 54,0 ms, lớp B 5/5 ĐẠT, ngưỡng ≤60 ms GIỮ; (c2) +1f tái hiện 2 lần seq 136/181; event lag ≥+5f: 0; F6' vẫn đóng). Protocol S5 dừng sau 1 lượt hợp lệ nên không có attempt2 để bị giết. Kết quả T4 giữ nguyên, không cần chạy lại.
- Trên boot #76, lịch lệch **không tái áp dụng được**: session T4 chết theo reboot và chưa hồi sinh (không process, thư mục không đổi từ 08:58Z lúc kiểm 09:32Z). T8 chạy lại khi lock TRỐNG, không có luồng nào khác giữ lock hay chạy vite trong cửa sổ 09:35–09:45Z — không có tranh chấp thực tế, chỉ mất lớp bảo vệ lịch lệch trên giấy. Nếu T4 hồi sinh sau và cần cửa sổ yên, đó là việc của T4/parent, không phải của luồng này.

## 6. Kiểm chứng sau mọi việc (boot #76)

- Fixture rebuild sau reboot #76 (script `rebuild-fixtures-129t8.sh`, log `smoke/rebuild-fixtures-b76.log`): md5 đủ 32 ký tự khớp đợt 126 (hevc-a `ba0c7c623901a9a7b428ea664f1fff53`, i7-clip `f05daed87b2eb12bc15c9dbf0835e931`, h-30s `fbaa3d1a5b32301c78a07221315382c0`, g-4s `a1fb8549165c526cf89b69e6cdcfeba3`; m4/n2 là copy byte-identical của h-30s). Blend media bền qua reboot: `blend-tp-ocean-a50.mp4` 881.516 B (md5 `f1e277f0…`), `blend-tp-slov-a085.mp4` md5 `f4c35a6a…` — khớp số đợt 125/126/127/128.
- Mirror + kiểm kê chạy lại trên boot #76: 25/25 OK; inventory diff 0 dòng so với đợt 128 (238 file, `has_ignored`=201, gồm bản hb128 thêm từ đợt 128).
- `npx tsc --noEmit` (apps/web): **exit 0** (32 s; `tsc-web-b76.log`). Trên boot #76, 1 lần duy nhất (không chạy trên #75 — driver bị giết trước bước này).
- `npx vite build` (apps/web): **exit 0**, built 12,03 s (`vite-build-b76.log`).
- Production không động: `preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — kiểm trước (boot #75, 08:41Z), sau reboot (boot #76, 09:08Z) và sau chạy (09:46Z).
- Xvfb `:199` đã kill + socket `/tmp/.X11-unix/X199` + `/tmp/.X199-lock` đã unlink (luật đứng mới); RAM sampler kill cả nhóm process (0 process sót theo `ps` lúc 09:45Z); lock TRỐNG sau khi chạy (0 ticket + 70 cooldown).
- Không kiểm lại TTS 39; không thử birefnet (RAM khả dụng tối đa 2.408 MB < guard 6 GB); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Kẹt P3 đợt 127 VẪN CHƯA CÓ nguyên nhân chứng minh.** Hai lần chạy sạch liên tiếp (đợt 128 trên #74, đợt 129 trên #76) chỉ loại trừ "kẹt tất định ở P3 trên mọi boot". RAM thấp là tương quan (kẹt lúc ~325 MB; chạy sạch lúc tối thiểu 511 MB đợt này và 1.145 MB đợt 128), không phải bằng chứng nhân quả — không được trích thành "85m4 đợt 127 fail do RAM".
2. **Heartbeat HB128 nay đã có bằng chứng bắn thật** (2 dòng `waitForPlaySync` trong lúc chờ 5–6,5 s) — nhưng vẫn chưa có lần kẹt thật nào để thử lửa phần sau điểm kẹt. Nếu kẹt tái hiện ở đợt sau, kiểm tra dòng HB128 đầu tiên sau điểm kẹt như đã dặn.
3. **Kết quả 3/3 là n=1 bộ trên boot #76** (cộng 1 lần 84l10 PASS trên boot #75 đã chết — chỉ ghi nhận, không gộp vào bộ chính). Số đo chỉ đúng trên VM này trong giờ vòng lặp 9 luồng song song (tải + RAM là biến số lớn nhất).
4. **Đồng bộ chậm (P4 5–6,5 s) và seek kẹt 3 mẫu (~0,6 s) ở P5 chỉ là quan sát n=1 trong cửa sổ RAM mỏng** — chưa đủ cơ sở gọi là hồi quy hay gán cho RAM; đợt sau chạy lại trong cửa sổ RAM rộng mới so sánh được.
5. **WebKitGTK ≠ Safari thật** (ghi rõ như mọi đợt). Chênh đồng hồ ~33 s giữa hai boot (§2) là suy luận từ log, không phải đo trực tiếp — thời điểm reboot tuyệt đối lấy theo btime kernel #76 (09:02:12Z).
6. `probe-82j3-sample-load.mjs` vẫn exit 0 ngay cả khi probe lỗi (catch-all không set exit code) — hành vi có từ trước, không sửa trong đợt này (nợ đợt 125 §9 mục 5, vẫn mở).

## 8. Nợ cho đợt sau

1. **ĐÃ ĐÓNG:** chạy lại bộ 3 harness webkit trên boot ổn định sau reboot giữa lượt (nợ cập nhật giữa đợt của parent) — 3/3 exit 0, P3 không kẹt, heartbeat đã thử lửa phần chờ đồng bộ.
2. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; `probe-82j3` exit code khi lỗi (nợ nhỏ, xem §7 mục 6); lượt yên #7 ĐÃ ĐÓNG (không còn nợ chạy lại — đính chính §5).
3. **Theo dõi đợt sau:** nếu P4 đồng bộ lại chậm 5–6 s hoặc P5 seek kẹt ≥3 mẫu trong cửa sổ RAM rộng thì mới xét có phải hồi quy; nếu 85m4 kẹt lại thì ghi dòng HB128 đầu tiên sau điểm kẹt.
4. Reboot giữa lượt là mẫu MỚI (lần đầu tiên) — khác 4 lần trước (giữa đợt đóng và lượt mở). Các luồng sau nên snapshot bằng chứng trước mỗi lần chạy lại sau reboot như đợt này đã làm (`smoke/attempt-b75/`), thay vì để driver ghi đè.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round129-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, **< 37.768 B**. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật). Dữ liệu thô: `hidden_files/round129-t8/` (rebuild-fixtures-129t8.sh, run-webkit-129t8.sh, wait-t4-129t8.sh, wait-postboot-129t8.sh, inventory129.py/.txt + inventory129-b76.txt, mirror-verify129.py, mirror-verify.log + mirror-verify-b76.log, tsc-web-b76.log, vite-build-b76.log, smoke/ 8 log + summary + attempt1/ snapshot + attempt-b75/ snapshot lần chạy boot #75, l10/m4/n2-scratch với report JSON + screenshot).

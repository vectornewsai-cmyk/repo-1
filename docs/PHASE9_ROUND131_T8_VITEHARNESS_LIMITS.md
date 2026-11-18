# Đợt 131 T8 — Vite harness WebKit 84l10/85m4/86n2: BỊ REBOOT CHẶN 0/3 (Phần A) + CHẠY LẠI SAU CỜ MỚI (Phần B, xem dưới)
# (Phần A: lần chạy gốc 0/3 "không chạy" vì reboot xóa /tmp giữa lượt; Phần B: chạy lại trên boot mới sau POSTBOOT_PASS mới)

Ngày: 17/11/2026 (lượt cron 21:35 +07 = 14:35:51Z; T8 mở 14:41Z, hạn cứng 17:35Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chờ cờ + chạy harness + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND130_T8_VITEHARNESS_LIMITS.md (lịch lệch T4-yên TRƯỚC, T8-harness SAU; quy trình chờ POSTBOOT_PASS boot mới theo luật STALE) + LIMITS gộp đợt 130 §12.1 (bài học: "không có cờ lúc kiểm" ≠ "luồng đã chết"; cờ `.done` của luồng xong TRƯỚC reboot vẫn giữ nguyên giá trị) + quyết parent đợt 130 §12.3(a)(b) (lượt yên #9 PHÊ DUYỆT, lần này BẬT log draw; T5 phân tích log draw sau khi lượt #9 có dữ liệu).

## 0. Kết luận ngắn — lần chạy gốc KHÔNG chạy (0/3 là "không chạy", không phải "fail")

- **Cả hai cờ gốc ĐỦ lúc 15:00:33Z** (waiter poll 16): `round131-t4.done` — lượt yên WebKit #9 **ĐÓNG**, attempt1 20/20, median 56,0 ms (≤60 ms), lớp B 5/5, log draw n=103, xong 14:59Z; `POSTBOOT_PASS` boot `f868abad` pass_at 14:50:18Z (poll=6, T5).
- **Reboot GIỮA LẦN CHẠY lần thứ tư liên tiếp** (đợt 129: #75→#76; đợt 130: #77→#78; đợt 131 mở: #78→`f868abad`; đợt 131 giữa lượt: `f868abad`→`ad1327ef`): boot `f868abad` (btime 14:26:41Z) chết trong khung **(15:01:22Z, 15:01:30Z]** (~8 s — dấu sống cuối: rebuild fixture xong ~15:01:22Z; boot mới `uptime -s` 15:01:30Z, `stat /proc/1` 15:01:44Z, chênh 14 s); boot mới `ad1327ef-e045-4d44-ae14-13c76bab50ec` (T5 tạm gọi b80 — xem §9 mục 6).
- **Driver chạy 15:03:24–15:04:00Z trên boot mới, cả 3 harness exit=2 trong 1 s** vì `/tmp` đã bị reboot xóa sạch fixture (`HARNESS LỖI: không thấy clip /tmp/l10|m4|n2/clips/h_h264_320x180_30s.mp4`). Không có lần chạy harness thật nào — **0/3 là "không chạy"**, không được trích thành fail/kẹt.
- **Cờ `POSTBOOT_PASS` f868abad đã STALE trên boot mới** — T8 dừng theo luật đứng, không chạy lại lén trên boot chưa pass. T5 đang làm postboot check cho boot mới (`t5-wait-replay-b80.sh` chạy từ 15:07Z, PID 3989 lúc kiểm 15:07Z) — T8 chờ cờ mới bằng waiter riêng tới deadline 16:45Z (xem §7).
- **Cờ T4 VẪN CÒN HIỆU LỰC sau reboot** (T4 xong 14:59Z, trước reboot — bài học đợt 130 §12.1#4): lượt yên #9 không cần chạy lại; chỉ cần POSTBOOT_PASS mới cho boot mới rồi chạy lại bộ 3 harness.
- **Chạy lại (Phần B, §7): 3/3 harness exit 0 trên boot mới sau cờ POSTBOOT_PASS mới** (15:35:53–15:43:51Z) — P3 không kẹt lần thứ tư liên tiếp, P5 seek 0 mẫu, HB128 18 dòng `sampleFor`.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 14:09:54 | Dấu sống cuối boot #78? (`round130-t10.done` mtime) — T5 ghi trong `t5-initial-state.md` |
| (14:09:54, 14:26:41] | Boot #78? CHẾT; boot mới `f868abad` (btime 14:26:41Z) — reboot giữa đợt đóng 130 / lượt mở 131, lần thứ ba liên tiếp |
| 14:35:51 | Lượt cron 21:35 +07 mở đợt 131; parent tạo `round-in-progress.md` (của CHÍNH đợt 131 — xem §9 mục 5) + `round131-t1..t10/` lúc 14:37Z |
| 14:41:43 | T8 mở: boot `f868abad`, RAM khả dụng 492 MB, `/tmp/.X11-unix/` trống, fixture `/tmp` trống sau reboot, 0 process Xvfb/vite/MiniBrowser |
| 14:44 | T4 bắt đầu setup (`gate0-wait-t4-f868abad.sh` + probe + analyzer trên đĩa); T5 dir còn trống |
| 14:44–14:45 | T8 chuẩn bị xong: script đợt 131 copy/adapt từ đợt 130 (`run-webkit-131t8.sh`, `rebuild-fixtures-131t8.sh`, `inventory131.py`, `mirror-verify131.py`), `bash -n` OK, đường dẫn log đã kiểm đúng `round131-t8/` (bài học §12.1#3) |
| 14:45:32 | Waiter hai cờ `wait-t4-t5-131t8.sh` bắt đầu poll 60 s (deadline 16:45Z) |
| 14:50:18 | T5 viết `POSTBOOT_PASS` boot `f868abad` (poll=6) |
| 14:59 | T4 xong: lượt yên #9 ĐÓNG (attempt1 20/20, median 56,0 ms, B 5/5, log draw n=103); cờ `round131-t4.done` có trên đĩa |
| 15:00:33 | Waiter poll 16: **GATE-FOUND** — cả hai cờ đủ |
| 15:01:08–15:01:22 | Rebuild fixture trên `f868abad` exit 0 — md5 đủ 32 ký tự khớp đợt 126–130 (xem §2) |
| ~15:01:22–15:01:36 | Kiểm kê + mirror-verify chạy NGANG ranh giới reboot (bắt đầu trước, trả kết quả sau — xem §9 mục 4); kết quả đứng vì cây trên đĩa không đổi (md5 production không đổi) |
| (15:01:22, 15:01:30] | **Boot `f868abad` CHẾT** (khung ~8 s, hẹp nhất từ trước tới nay) |
| 15:02:32 | `npx tsc --noEmit` exit 0 — chạy TRÊN boot mới `ad1327ef` (xem §9 mục 3: tên file log còn ghi `bf868abad`, xem §2) |
| 15:03:02 | `npx vite build` exit 0, built 9,04 s — cũng trên boot mới |
| 15:03:24 | Driver `run-webkit-131t8.sh` mở trên boot mới `ad1327ef` (btime ghi theo `stat /proc/1`: 15:01:44Z) |
| 15:03:27–15:04:00 | 84l10 / 85m4 / 86n2 lần lượt exit=2 trong ~1 s mỗi cái: không thấy clip `/tmp` — fixture đã mất theo reboot |
| 15:04 | T5 lưu trữ cờ cũ: copy `POSTBOOT_PASS` → `POSTBOOT_PASS.boot1-f868abad`; bắt đầu check boot2 (ram/headroom/md5 `*2`, poll0 15:05Z) |
| 15:05:22 | T8 kiểm trên boot mới: boot `ad1327ef`, RAM khả dụng 1.337 MB, `/tmp` chỉ còn `node-compile-cache`, `/tmp/.X11-unix/` trống, 0 process Xvfb/vite/MiniBrowser, lock không có holder, production md5 không đổi |
| 15:07 | T5 chạy `t5-wait-replay-b80.sh` (PID 3989) + `t5-postboot-b80-poll1.log` + `t5-initial-state-boot2.md` — postboot check boot mới đang chạy |
| 15:09:09 | T8 thả waiter cờ mới `wait-postboot-b80-131t8.sh` (chỉ chờ POSTBOOT_PASS boot `ad1327ef`, deadline 16:45Z) |

## 2. Chuẩn bị trước lần chạy gốc (boot `f868abad` — đã mất theo reboot, chỉ còn log trên đĩa)

- Production baseline (ghi 14:44Z, kiểm lại 15:01Z và 15:05Z trên cả hai boot — không đổi): `preview.tsx` `805409f0…` (đã gồm instrumentation T5 đợt 130, log draw bật trong lúc T4 đo lượt #9), `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…`.
- Fixture rebuild (`rebuild-fixtures-131t8.sh`, log `smoke/rebuild-fixtures-bf868abad.log`): exit 0; md5 đủ 32 ký tự khớp đợt 126–130: hevc-a `ba0c7c623901a9a7b428ea664f1fff53`, i7 `f05daed87b2eb12bc15c9dbf0835e931`, h-30s `fbaa3d1a5b32301c78a07221315382c0`, g-4s `a1fb8549165c526cf89b69e6cdcfeba3`; m4/n2 copy byte-identical h-30s. Blend media bền khớp đợt 125–130 (`f1e277f0…`, `f4c35a6a…`). **Fixture này đã mất theo reboot** — lần chạy lại phải rebuild lại trên boot mới.
- Kiểm kê: **238 file, diff 0 dòng** so với đợt 130 (201/201 harness vite dev đã phủ mirror; 37 file "MISSING mirror" cùng mẫu các đợt trước — file spawn vite nhưng không có `watch.ignored`, không phải hồi quy).
- Mirror-verify: **25/25 OK**, 0 đổi 0 mất.
- `npx tsc --noEmit` (apps/web): **exit 0** (`smoke/tsc-web-bf868abad.log`, 0 byte output, 15:02:32Z). `npx vite build` (apps/web): **exit 0**, built 9,04 s (`smoke/vite-build-bf868abad.log`; chỉ cảnh báo chunk >500 kB có từ trước).
- **Lưu ý tên file log (ghi rõ, không giấu):** 2 log tsc/vite build mang tên `bf868abad` nhưng NỘI DUNG chạy trên boot mới `ad1327ef` (bắt đầu 15:02:32Z/15:03:02Z, sau btime boot mới 15:01:30Z) — vì lệnh được phát trước khi T8 biết đã reboot, tên file đặt theo boot lúc mở. Số liệu vẫn đúng cho cây hiện tại (md5 production giống hệt hai boot); lần chạy lại sẽ chạy lại tsc/vite build với tên file đúng boot mới để hồ sơ sạch.

## 3. Vì sao lần chạy gốc 0/3 — 2 lý do, lý do nào cũng đủ chặn

1. **Reboot xóa `/tmp` giữa lúc chuẩn bị xong và lúc driver mở.** Rebuild fixture xong ~15:01:22Z trên `f868abad`; boot chết (15:01:22Z, 15:01:30Z]; driver mở 15:03:24Z trên boot mới thì `/tmp/l10|m4|n2/clips/` đã trống. Harness kiểm tra clip tồn tại trước khi chạy và exit=2 ngay — đúng hành vi, không phải lỗi harness.
2. **Không có cờ `POSTBOOT_PASS` cho boot mới.** Cờ T5 hiện có (`round131-t5/POSTBOOT_PASS`, pass_at 14:50:18Z) ghi đúng boot_id `f868abad`, đã STALE. Quy trình đợt 129/130 yêu cầu chạy lại sau cờ POSTBOOT_PASS mới của T5 trên boot mới. T5 đang làm check boot mới (xem §1, 15:04–15:07Z) — chờ cờ, không chạy lén.

## 4. Dọn dẹp sau lần chạy gốc (boot mới, 15:04–15:05Z — đã kiểm)

- Driver tự dọn qua trap EXIT: Xvfb `:199` đã kill (pid 3125, chạy 15:03:27–15:04:00Z) + socket `/tmp/.X11-unix/X199` + `/tmp/.X199-lock` đã unlink; RAM sampler kill cả nhóm process (`pkill -f ram-131t8.log`).
- Kiểm sau: `/tmp/.X11-unix/` trống; 0 process Xvfb/vite/MiniBrowser sót; lock đã release cả 3 lần (acquire exit=0, released từng harness trong summary); thư mục `vite.lock` không tồn tại (không holder) — cùng mẫu đợt 130.
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push.

## 5. Giới hạn — đọc trước khi trích số (Phần A)

1. **0/3 harness LẦN CHẠY GỐC là "không chạy", không phải "fail".** Không được trích thành "85m4 kẹt lại", "P3 kẹt đợt 131" hay "WebKit fail đợt 131" — không có lần chạy harness nào trong lần chạy gốc. Kết quả thật ở lần CHẠY LẠI xem §7 (3/3 exit 0, P3 không kẹt lần thứ tư liên tiếp, P5 seek 0 mẫu, HB128 18 dòng `sampleFor`).
2. **Lượt yên #9 ĐÓNG là verdict của T4 (cờ trên đĩa, xong 14:59Z), T8 chỉ trích lại nội dung cờ.** T4 chưa viết LIMITS (`docs/PHASE9_ROUND131_T4*` không tồn tại lúc kiểm 15:05Z) — chi tiết attempt1 (phân phối, (c2), log draw n=103) chờ LIMITS T4; T8 không tự phân tích JSON T4.
3. **Khung chết boot `f868abad` (15:01:22Z, 15:01:30Z] lấy theo đồng hồ mới + dấu sống cuối của T8** (rebuild xong ~15:01:22Z; `uptime -s` boot mới 15:01:30Z). `stat /proc/1` boot mới là 15:01:44Z (chênh 14 s, cùng mẫu chênh đồng hồ giữa hai boot như đợt 129 ~33 s và đợt 130 ~1 s / 15 s). Ghi cả hai mốc, không tự chọn một — theo tiền lệ F-130-6.
4. **Kiểm kê + mirror-verify chạy ngang ranh giới reboot** (bắt đầu ~15:01:22Z, trả kết quả sau reboot) — kết quả đứng vì cây repo trên đĩa bền qua reboot và md5 production kiểm lại giống hệt trên boot mới; lần chạy lại sẽ chạy lại hai bước này trên boot mới để hồ sơ sạch (rẻ, ~14 s).
5. **Reboot giữa lượt lần thứ tư liên tiếp** (đợt 129, 130, 131-mở, 131-giữa-lượt) — mẫu "reboot giữa lượt" nay đã lặp 3 đợt liên tiếp; các luồng sau tiếp tục snapshot bằng chứng trước mỗi lần chạy lại sau reboot như đợt 129/130 đã làm. Khung chết lần này hẹp nhất (~8 s) — reboot rơi đúng giữa rebuild xong và driver mở.
6. **Số thứ tự boot TẠM:** T5 gọi `f868abad` là "b79", `ad1327ef` là "b80" (file `t5-initial-state-boot2.md`); T6 đợt 131 chốt mù #37 mới là số chính thức — T8 không tự đánh số boot trong LIMITS này ngoài nhãn tạm của T5.
7. **RAM khả dụng lúc mở chỉ 492 MB** (14:41Z) — thấp nhất trong các lần mở gần đây (đợt 130: 839 MB lúc mở, 1.406 MB sau reboot); sau reboot lên 1.337–1.766 MB. Dưới guard 6 GB — birefnet không thử. RAM thấp lúc mở không chặn được gì (chỉ là quan sát; T4 vẫn đóng lượt yên trên cửa sổ RAM đó).

## 6. Nợ cho đợt sau / cần quyết parent (tính tới lúc viết Phần A)

1. **ĐÃ ĐÓNG (xem §7):** T5 viết `POSTBOOT_PASS` boot mới `ad1327ef` lúc 15:33Z (ghi tay có bằng chứng — xem §7.1); T8 chạy lại bộ 3 harness 3/3 exit 0, xong 15:43:51Z, trước hạn cứng 17:35Z. Không cần can thiệp thêm.
2. **ĐÃ XONG (xem §7–§8):** rebuild fixture trên boot mới (md5 khớp đợt 126–130) → kiểm kê + mirror 25/25 → tsc + vite build với tên file đúng boot mới → chạy đủ 84l10/85m4-hb128/86n2, 3/3 exit 0. P3 không kẹt (lần chạy sạch thứ 4 liên tiếp), HB128 18 dòng, P5 seek kẹt 0 mẫu.
3. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #49 B mở + mù #50 mới mở (probe #50 theo T2); R9 (a) nhắc lần 16; T6 đợt 131 chốt số boot + mù #37.
4. **T4 chưa viết LIMITS đợt 131** (chỉ có cờ) — parent/T4 xác nhận LIMITS T4 có được viết bù không; T8 không phân tích thay T4.

## 7. CHẠY LẠI trên boot mới (ad1327ef, T5 tạm gọi b80) — 3/3 exit 0

### 7.1 Cờ đủ — lịch lệch + POSTBOOT_PASS mới thỏa

- `round131-t4.done` VẪN CÓ trên đĩa sau reboot, và đã được cập nhật sau reboot (T4/T4b ghi thêm): "Reboot sau luot do: f868abad chet (15:00:06Z, 15:01:30Z]; boot moi ad1327ef btime 15:01:30Z; verdict GIU NGUYEN; POSTBOOT_PASS cu STALE — T8 cho co POSTBOOT_PASS moi." — lượt yên #9 không chạy lại (bài học đợt 130 §12.1#4).
- Khung chết `f868abad` có HAI bản ghi (ghi cả hai, tiền lệ F-130-6): T8: (15:01:22Z, 15:01:30Z] (dấu sống cuối: rebuild fixture xong ~15:01:22Z); T4: (15:00:06Z, 15:01:30Z] (dấu sống cuối của T4: 15:00:06Z). Hai khung cùng đầu mút phải 15:01:30Z (`uptime -s` boot mới); khung T8 hẹp hơn và nằm trong khung T4 — không mâu thuẫn, chỉ khác mốc dấu sống cuối. Thời điểm tuyệt đối lấy theo btime kernel boot mới (15:01:30Z).
- `round131-t5/POSTBOOT_PASS` boot mới có lúc 15:33Z (waiter poll 26, tìm thấy 15:34:17Z): `boot_id=ad1327ef-e045-4d44-ae14-13c76bab50ec btime=2026-11-17T15:01:30Z pass_at=2026-11-17T15:31:20Z poll=25` — khớp boot hiện tại. **Cờ được T5 ghi TAY lúc 15:33Z** (file `t5-flag-boot2-manual-write.md`): watcher b80 v4 đạt `done_pass_stable_2polls` ở poll 25 (15:31:20Z) nhưng KHÔNG ghi đè cờ vì logic watcher chỉ ghi khi file chưa tồn tại (`if [ ! -f POSTBOOT_PASS ]`) — file lúc đó vẫn là cờ boot1 `f868abad`. Đây là lỗi thích ứng script khi làm lại pha 1 trong CÙNG thư mục (b79 không gặp vì thư mục mới; T5b đợt 130 dùng thư mục riêng nên cũng không gặp). Bằng chứng cờ đủ điều kiện: repair re-check libs PASS + GST PASS + apt PASS 11/11; poll 24 (15:30:19Z) postboot exit 0; poll 25 (15:31:20Z) postboot exit 0 (PASS lần 2 liên tiếp → đủ điều kiện ổn định 2 poll theo đúng luật watcher); final confirm 15:32:55Z postboot exit 0. Mốc `pass_at` = poll 25 (lúc đủ điều kiện), cùng quy ước các đợt trước. T8 chỉ kiểm boot_id trong cờ khớp boot hiện tại — tính hợp lệ của check là việc của T5, đã có bằng chứng trên đĩa.
- Không chạy harness nào trước cờ mới. Waiter `wait-postboot-b80-131t8.sh`: 26 poll, GATE-FOUND 15:34:17Z (chờ 25 phút từ 15:09:17Z).

### 7.2 Kết quả bộ 3 (driver `run-webkit-131t8.sh`, Xvfb :199 riêng, lock `t8-round131` từng harness)

| Harness | Lock giữ | Thời gian | Kết quả |
|---|---|---|---|
| 84l10 `clicktest-84l10-webkit-loop-w1.mjs` (L10_ENGINE=webkit) | 74 s | 15:35:56–15:37:10Z | **exit 0, KHÔNG FAIL** — W1-lần1/2/3 PASS (đồng bộ 0,8/1,4/1,2 s; restartEndedVideo 0→1→2→3, hạ-cánh-về-target=true, errors=0), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối, ct cuối=4, ended=true) |
| 85m4 `clicktest-85m4-webkit-w7-hb128.mjs` (M4_ENGINE=webkit) | 134 s (+15 s chờ acquire) | 15:37:25–15:39:39Z | **exit 0, KHÔNG FAIL** — P1 PASS (0 restart dư), P2 PASS (reset xong 684 ms), **P3 PASS (phát thường 20 s, 0 restart — KHÔNG kẹt)**, P4-lần1/2/3 PASS (đồng bộ 1,4/1,4/2,0 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart dư; seek kẹt dài nhất **0 mẫu**). Report JSON `ok=true` |
| 86n2 `clicktest-86n2-webkit-w7.mjs` (N2_ENGINE=webkit) | 237 s (+15 s chờ acquire) | 15:39:54–15:43:51Z | **exit 0, KHÔNG FAIL** — P1 PASS (0 restart dư), P2 PASS (reset xong 734 ms), P3 PASS (0 restart), P4-lần1/2/3 PASS (đồng bộ 1,3/1,9/1,8 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart dư; seek kẹt dài nhất **0 mẫu**). Report JSON `ok=true` |

### 7.3 Heartbeat HB128

- **HB128 (85m4): 18 dòng trong log, TẤT CẢ là `sampleFor` đều 5 s/lần** (P1-phaseA 4, P2-phaseB 3, P3-control 4, P5-phaseB-long 7) — sampling tiến triển bình thường, không khoảng trống. **0 dòng `waitForPlaySync`:** mọi lần đồng bộ đều xong dưới 5 s nên heartbeat chờ không có dịp bắn (cùng mẫu đợt 130: 19 dòng sampleFor, 0 waitForPlaySync; đợt này P5 có 7 dòng thay vì 8 vì mẫu cuối rơi sau mốc 35 s — chỉ là lệch thời gian lấy mẫu, không phải thiếu dữ liệu).
- **HB129:** chỉ có trong probe lượt yên của T4, không có trong harness T8 — không có dữ liệu HB129 mới từ lần chạy này.

### 7.4 P3 / P5 theo dõi

- **P3 KHÔNG kẹt — lần chạy sạch thứ tư liên tiếp** (đợt 128 trên #74, đợt 129 trên #76, đợt 130 trên #78, đợt 131 trên boot mới `ad1327ef`). Nguyên nhân kẹt đợt 127 VẪN CHƯA CHỨNG MINH.
- **P5 seek kẹt 0 mẫu ở cả 85m4 và 86n2** (đợt 129 là 3 mẫu ~0,6 s; đợt 128 và 130 là 0 mẫu) — 3 mẫu đợt 129 càng giống nhiễu một lần, chưa đủ cơ sở gọi là hồi quy.
- **P4 đồng bộ nhanh (1,3–2,0 s)** — cùng dải đợt 130 (1,3–1,9 s), nhanh hơn hẳn đợt 129 chậm (5–6,5 s). RAM khả dụng tối thiểu trong lúc chạy 628 MB (đợt 130: 695 MB; đợt 129: 511 MB) — chỉ ghi tương quan, KHÔNG kết luận RAM là nguyên nhân (xem §9).

## 8. Kiểm chứng sau chạy lại (boot `ad1327ef`)

- Fixture rebuild trên boot mới (script `rebuild-fixtures-131t8.sh`, log `smoke/rebuild-fixtures-bad1327ef.log`): md5 đủ 32 ký tự khớp đợt 126–130 (hevc-a `ba0c7c623901a9a7b428ea664f1fff53`, i7 `f05daed87b2eb12bc15c9dbf0835e931`, h-30s `fbaa3d1a5b32301c78a07221315382c0`, g-4s `a1fb8549165c526cf89b69e6cdcfeba3`; m4/n2 copy byte-identical h-30s). Blend media bền khớp đợt 125–130 (`f1e277f0…`, `f4c35a6a…`).
- Mirror + kiểm kê trên boot mới: **25/25 OK**, 0 đổi 0 mất; kiểm kê **238 file, diff 0 dòng** so với đợt 130 (201/201 harness vite dev đã phủ mirror).
- `npx tsc --noEmit` (apps/web): **exit 0** (`smoke/tsc-web-bad1327ef.log`, 15:35Z — chạy lại với tên file đúng boot mới; bản `bf868abad` trước đó cũng exit 0 nhưng tên file sai boot, xem §2). `npx vite build` (apps/web): **exit 0**, built 8,15 s (`smoke/vite-build-bad1327ef.log`; chỉ cảnh báo chunk >500 kB có từ trước).
- Production không động trước/sau chạy lại: `preview.tsx` `805409f0…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` (kiểm 15:34Z và 15:44Z).
- RAM trong lúc chạy lại (sampler 30 s, 16 mẫu trong cửa sổ chạy): khả dụng **628–1.438 MB** (tối thiểu 628 MB lúc 15:36:53Z trong 84l10; lúc mở driver 935 MB; lúc chuẩn bị 443 MB lúc 15:34:35Z — cửa sổ RAM mỏng nhất từ đợt 129). Load1 tối đa 3,09. Dưới guard 6 GB — birefnet không thử. (Log `ram-131t8.log` còn giữ 2 mẫu 15:03:24Z/15:03:54Z của lần chạy gốc bị chặn — min toàn log 628 MB, max 1.655 MB; cột `swap_used` trong log thực chất là Mem used, xem LIMITS đợt 130 §9 mục 4 — chỉ dùng cột `avail`.)
- Dọn dẹp: Xvfb `:199` đã kill + socket `/tmp/.X11-unix/X199` + `/tmp/.X199-lock` đã unlink (luật đứng); `/tmp/.X11-unix/` trống; 0 process Xvfb/vite/MiniBrowser sót; RAM sampler kill cả nhóm process; lock TRỐNG sau khi chạy (0 ticket + 74 file cooldown; trước lượt 72 — tăng 2 sau 2 lần driver chạy; cooldown là file chờ hết hạn, không phải holder).
- Không reboot trong lúc chạy lại (boot `ad1327ef` suốt 15:35:53–15:43:51Z). Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Chạy lại xong 15:43:51Z, trước hạn cứng 17:35Z.

## 9. Ghi chú vận hành đợt 131 (bổ sung sau Phần A — đọc trước khi trích số)

1. **`round-in-progress.md` tồn tại nhưng là của CHÍNH đợt 131** (tạo 14:35Z bởi parent: "Đợt 131 đang chạy", hạn cứng 17:35Z) — KHÔNG phải đợt main-chat; lượt cron được phép làm việc bình thường (T5 đã xác nhận trong `t5-initial-state.md`). Luật chốt chặn chỉ chặn khi đợt main-chat đang chạy.
2. **Đồng hồ hai boot chênh nhau ở ranh giới reboot — ghi cả hai mốc.** Boot mới: `uptime -s` 15:01:30Z vs `stat /proc/1` 15:01:44Z (chênh 14 s). T5 dùng `uptime -s` làm btime trong cờ POSTBOOT_PASS (`btime=2026-11-17T14:26:41Z` cho `f868abad` khớp `uptime -s` lúc mở); driver `run-webkit` ghi btime theo `stat /proc/1`. Khi hai nguồn không khớp thì ghi cả hai (tiền lệ F-130-6).
3. **Tên file log tsc/vite build mang boot cũ nhưng nội dung chạy trên boot mới** (xem §2) — bài học: sau reboot, đặt tên log theo boot KIỂM LẠI lúc chạy (đọc lại `boot_id` trước mỗi lệnh ghi log), không dùng biến boot đọc từ lúc mở. Lần chạy lại áp dụng: mọi log mới mang hậu tố `bad1327ef`.
4. **Lệnh exec có thể trả kết quả sau reboot mà không báo** — kiểm kê + mirror-verify bắt đầu trước reboot vẫn trả về đầy đủ sau reboot; không có tín hiệu nào trong output cho thấy đã reboot giữa chừng. Bài học: sau mỗi exec dài, kiểm lại `boot_id` trước khi tin rằng kết quả thuộc về boot cũ — T8 đã kiểm lại và xác nhận ở §1/§2.
5. **T5 tự phát hiện reboot và bắt đầu check boot mới không cần parent nhắc** (15:04Z lưu trữ cờ cũ, 15:05Z poll0 boot2, 15:07Z `t5-wait-replay-b80.sh` đang chạy) — khác đợt 130 khi T5b phải spawn lại sau reboot. Quy trình "T5 tự hồi phục sau reboot" này rút ngắn thời gian chờ cờ mới; T8 chỉ việc poll cờ.
6. **Cờ POSTBOOT_PASS boot mới do T5 ghi tay vì watcher không ghi đè** — logic watcher chỉ ghi khi file chưa tồn tại; làm lại pha 1 trong cùng thư mục thì file cũ STALE còn đó nên watcher đạt điều kiện vẫn không ghi. Bài học cho T5: watcher làm lại phải XÓA cờ cũ STALE trước khi chạy, hoặc logic ghi cờ phải ghi đè khi boot_id khác (xem §7.1 + `t5-flag-boot2-manual-write.md`).
7. **RAM tối thiểu trong lúc chạy 628 MB nhưng P4 vẫn đồng bộ nhanh (1,3–2,0 s)** — đợt 129 RAM tối thiểu 511 MB đi kèm P4 chậm 5–6,5 s; đợt 130 RAM tối thiểu 695 MB đi kèm P4 nhanh 1,3–1,9 s. Ba điểm dữ liệu không đủ tách ảnh hưởng RAM khỏi tải hệ thống lúc đo; chỉ ghi tương quan, không kết luận nhân quả.
8. **Lock queue tăng 72 → 74 file cooldown sau 2 lần driver chạy** — cooldown là file chờ hết hạn, không phải holder; tiêu chí "lock TRỐNG" là 0 ticket (thư mục `vite.lock` không tồn tại = không holder).

## 10. Giới hạn — phần chạy lại (đọc trước khi trích số)

1. **Kết quả 3/3 là n=1 bộ trên boot `ad1327ef`** (trong giờ vòng lặp nhiều luồng song song — tải + RAM là biến số lớn nhất). Số đo chỉ đúng trên VM này.
2. **0 dòng `waitForPlaySync` đợt này KHÔNG phải bằng chứng heartbeat hỏng** — chỉ là không có lần đồng bộ nào vượt 5 s để kích hoạt; bằng chứng bắn thật đã có từ đợt 129 (2 dòng) và HB129 trong stall thật của T4 đợt 130.
3. **Khung chết boot `f868abad` có hai bản ghi khác nhau (§7.1)** — T8: (15:01:22Z, 15:01:30Z]; T4: (15:00:06Z, 15:01:30Z]. Khung T8 nằm trong khung T4 (cùng đầu mút phải) — không mâu thuẫn; thời điểm reboot tuyệt đối lấy theo btime kernel boot mới (15:01:30Z).
4. **Cờ POSTBOOT_PASS boot mới do T5 ghi TAY** (watcher đạt điều kiện nhưng không ghi đè được vì file cũ còn tồn tại — xem §7.1) — tính hợp lệ của cờ dựa trên bằng chứng check của T5 trên đĩa (poll 24/25 exit 0 + final confirm), không phải trên cơ chế ghi tự động.
5. Report JSON 3 harness chỉ có 4 key (`engines`, `finishedAt`, `ok`, `startedAt`) — không có key `consoleErrs`; bằng chứng "0 lỗi" là `errors=0` từng phase trong log + `ok=true`.
6. **Lần chạy gốc 0/3 exit=2 "không thấy clip" KHÔNG phải fail của harness** — harness kiểm tra clip tồn tại trước khi chạy và dừng đúng luật; lỗi thuộc về fixture bị reboot xóa, không thuộc về code WebKit hay preview. Trích số đợt này chỉ dùng kết quả chạy lại §7.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round131-t8-viteharness.txt` — **1 file** (LIMITS này, đã cập nhật đủ Phần A + Phần B), đã verify read-back, 0 binary, < 37.768 B. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật). Dữ liệu thô: `hidden_files/round131-t8/` (run-webkit-131t8.sh, wait-t4-t5-131t8.sh, wait-postboot-b80-131t8.sh, rebuild-fixtures-131t8.sh, inventory131.py, mirror-verify131.py; smoke/wait-t4-t5.log — GATE-FOUND poll 16, 15:00:33Z; smoke/wait-postboot-b80.log — GATE-FOUND poll 26, 15:34:17Z; smoke/rebuild-fixtures-bf868abad.log + rebuild-fixtures-bad1327ef.log; smoke/run-webkit-summary.txt + run-webkit-84l10/85m4/86n2.log + attempt1/ snapshot — **bản CHẠY LẠI** 3/3 exit 0; smoke/ram-131t8.log — 18 mẫu (2 mẫu lần chạy gốc + 16 mẫu chạy lại); smoke/tsc-web-bf868abad.log + tsc-web-bad1327ef.log; smoke/vite-build-bf868abad.log + vite-build-bad1327ef.log; smoke/inventory131.txt + inventory131-bad1327ef.txt; smoke/mirror-verify-bf868abad.log + mirror-verify-bad1327ef.log; l10/m4/n2-scratch với report JSON `ok=true` cả 3). **Lưu ý:** log harness lần chạy gốc (3 log exit=2 "không thấy clip") đã bị lần chạy lại ghi đè (driver dùng cùng tên file) — nội dung lần chạy gốc còn trong §1/§3 LIMITS này (trích từ output driver lúc chạy) và trong log waiter; không khôi phục được file log gốc.

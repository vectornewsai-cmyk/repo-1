# Đợt 128 T3 — Chạy lại harness 85m4 webkit (bản hb128): exit 0, P3 KHÔNG kẹt

Ngày: 17/11/2026 (lượt cron 12:35 +07; làm 05:40–06:10Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chạy lại 1 harness 85m4 webkit (bản copy chẩn đoán hb128) + fixture khôi phục + kiểm trạng thái boot/lock/RAM + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness gốc, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND127_T8_VITEHARNESS_LIMITS.md §8 mục 1 + LIMITS gộp đợt 127 §11 mục 3 (§12(f): CHẠY LẠI đợt 128, 1 harness, boot ổn định; kẹt lại thì log heartbeat). Kết quả: **nợ ĐÓNG — 85m4 đã có kết quả đầy đủ, exit 0, P3 không kẹt.**

## 1. Kết luận ngắn

- **85m4 nhánh WEBKIT (bản hb128) — exit 0, KHÔNG FAIL (boot #74):** P1 PASS (đồng bộ 2,7 s; ép ended restart 0→1, fired=true; 0 restart dư), P2 PASS (reset xong 694 ms; 0 restart dư), **P3 PASS (đồng bộ 1,3 s; phát thường 20 s, 0 restart; heartbeat đều 5 s/lần suốt cửa sổ)**, P4-lần1/2/3 PASS (đồng bộ 1,8/1,3/1,3 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart; seek kẹt dài nhất 0 mẫu). Report JSON `ok=true`, `consoleErrs=[]`.
- **Kẹt P3 đợt 127 KHÔNG tái hiện.** Nhưng heartbeat chưa từng được thử lửa bởi một lần kẹt thật: 19 dòng HB128 toàn là `sampleFor` (lấy mẫu đều), không có dòng `waitForPlaySync` nào vượt 5 s (mọi lần đồng bộ đều xong trong 1,3–2,7 s). Vì vậy **nguyên nhân kẹt đợt 127 VẪN CHƯA CHỨNG MINH** — một lần chạy sạch chỉ cho thấy kẹt không phải tất định trên boot khỏe + RAM rộng, không chứng minh được RAM là nguyên nhân.
- **RAM lúc chạy rộng hơn hẳn cửa sổ kẹt đợt 127:** khả dụng 1.988 MB lúc bắt đầu, thấp nhất **1.145 MB** trong lúc chạy (sampler 30 s), 1.680 MB lúc kết thúc; swap đã dùng ~330 MB; load ~1,0–1,4. Đợt 127 kẹt lúc khả dụng chỉ ~325–361 MB. Tương quan này PHÙ HỢP với giả thuyết áp lực RAM/swap nhưng KHÔNG PHẢI bằng chứng — không được trích thành "85m4 đợt 127 fail do RAM".

## 2. Xếp lịch lệch — chờ cờ T4 (quyết parent (g))

- Waiter poll mỗi 60 s từ 05:40Z; cờ `round128-t4.done` xuất hiện **06:06:25Z (sau 26 phút)**, đã kiểm lại trên đĩa trước khi chạy. Nội dung cờ T4: **KHÔNG CÓ LƯỢT YÊN HỢP LỆ lần 7** (3 attempt: a1 median 75,0 B2 vi phạm; a2 median 63,0 B2 vi phạm 1 mẫu 4,18; a3 16/20 exit 3 pass-timeout, median đo được 55,0, lớp B 5/5 ĐẠT) — ngưỡng ≤60 ms GIỮ, nợ chuyển đợt 129. Đây là việc của T4/T9, T3 chỉ ghi nhận nội dung cờ; điều kiện "T9-yên TRƯỚC, T8-harness SAU" đã thỏa (T4 xong mới chạy harness).
- Không phải chờ đủ 90 phút; không chạy harness trước cờ; không vượt lock, không kill process luồng khác (không có process luồng khác nào đang giữ lock lúc chạy).

## 3. Boot #74 — boot mới sau reboot giữa đợt

- Đợt mở trên boot #73, nhưng lúc 05:40Z máy đã ở **boot #74** (boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`, btime 04:55:17Z). Reboot #73→#74 xảy ra giữa lúc T10 đóng đợt 127 (04:20Z) và lúc lượt 128 mở (05:35Z) — ngoài phiên T3, T3 không điều tra reboot này (việc của T5).
- T5 đợt 128 đã viết `round128-t5/POSTBOOT_PASS` cho boot #74 trước khi T3 chạy. T3 tự kiểm lại bằng đọc (không sửa hạ tầng): đủ libevent-2.1/libEGL/libavif/libevdev trong ldconfig; GST 269 file gồm `libgstisomp4.so` + `libgstlibav.so`; MiniBrowser-gtk `ldd` (với `lib:sys/lib`) **0 thiếu**; dpkg.log replay **1.509 dòng**, kết thúc 05:38:51Z bằng `gstreamer1.0-tools` — cùng hình dạng replay khỏe của boot #73, KHÁC hình dạng 350 dòng của boot #72 (ghi nhận cho T5 theo dõi theo §12(i) đợt 127; T3 không kết luận).
- `/tmp` bị xóa theo reboot: fixture phải tạo lại (xem §4).

## 4. Fixture tạo lại sau reboot — md5 khớp đủ 32 ký tự

Script `round127-t8/rebuild-fixtures-127t8.sh` (log `smoke/rebuild-fixtures-b74.log`), exit 0:

| File | md5 (đủ 32 ký tự) | Khớp đợt 126 |
|---|---|---|
| hevc-a | `ba0c7c623901a9a7b428ea664f1fff53` | ✓ |
| i7-clip-10s | `f05daed87b2eb12bc15c9dbf0835e931` | ✓ |
| h-30s (l10/m4/n2) | `fbaa3d1a5b32301c78a07221315382c0` | ✓ |
| g-4s | `a1fb8549165c526cf89b69e6cdcfeba3` | ✓ |

Blend media bền qua reboot: ocean-a50 `f1e277f0…` (881.516 B), slov-a085 `f4c35a6a…` — khớp đợt 125/126/127.

## 5. Bản harness hb128 — copy chẩn đoán, logic giữ nguyên

- File mới `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` (33.777 B), copy từ `clicktest-85m4-webkit-w7.mjs` + **chỉ thêm heartbeat**: helper `hbStart` (setInterval 5 s) + try/finally trong `waitForPlaySync` / `sampleFor` / `waitForNotSeeking`. Diff 37 dòng, toàn dòng thêm, `node --check` OK.
- Heartbeat chạy trên event loop Node nên vẫn ghi log ngay cả khi `page.evaluate` treo: mỗi dòng ghi elapsed + state cuối cùng đã biết (playhead/ct/paused/seeking) hoặc số mẫu đã lấy. Không đổi timeout, không đổi thứ tự gọi, không đổi verdict.
- **File gốc KHÔNG sửa** (md5 `580af38f749670881293515256fe6f2c`, mtime 16/11 — kiểm sau khi chạy). Harness gốc vẫn là bản chạy chuẩn cho các đợt sau; bản hb128 giữ lại làm công cụ chẩn đoán nếu kẹt tái hiện.

## 6. Lần chạy 85m4-hb128 (boot #74) — 06:06:44–06:08:58Z, exit 0

Driver: `hidden_files/round128-t3/run-webkit-128t3.sh` (Xvfb riêng `:198` + TỰ KILL khi xong; GST env; lock v2 `t3-round128` acquire exit 0 lúc 06:06:44Z, giữ 134 s, nhả 06:08:58Z; timeout 900; RAM sampler nền 30 s; log tên riêng + snapshot `smoke/attempt1/` ngay sau khi chạy — theo bài học §8.3 đợt 127).

| Phase | Kết quả |
|---|---|
| vite dev sẵn sàng | 06:06:46Z (port 5490; clip 8990) |
| P1 | PASS — đồng bộ 2,7 s (playhead=1,433, ct=1,5); ép ended restart 0→1 fired=true, gỡ endedNow=false; sau settle 1,5 s restart=1, events=1; phaseA 20 s: 0 restart dư, extraEvents=[] |
| P2 | PASS — reset xong 694 ms; phaseB 15 s: 0 restart dư, extraEvents=[] |
| P3 | PASS — đồng bộ 1,3 s (playhead=0,867, ct=1,0); control 20 s: 0 restart, extraEvents=[]; heartbeat sampleFor đều 5 s/lần (n=16/32/48/64) |
| P4-lần1/2/3 | PASS — đồng bộ 1,8/1,3/1,3 s; delta=+1 mỗi lần; hạ-cánh-về-target=true; ct hạ cánh 2,593/2,533/2,433; playing=true; errors=0 |
| P5 | PASS — 40 s sau reset: 0 restart dư; seek kẹt dài nhất 0 mẫu (~0,0 s); extraEvents=[] |
| KẾT QUẢ | **KHÔNG FAIL** — report JSON `ok=true`, `consoleErrs=[]`, `startedAt 06:06:44.936Z`, `finishedAt 06:08:58.622Z` |

- Tổng thời gian harness 134 s (so với 900 s timeout đợt 127 bị kill). Không gặp "Target crashed", không kẹt W2, không restart dư nào.
- Heartbeat: 19 dòng HB128, toàn `sampleFor` (P1-phaseA 4, P2-phaseB 3, P3-control 4, P5-phaseB-long 8); 0 dòng `waitForPlaySync`/`waitForNotSeeking` — mọi lần chờ đồng bộ đều xong dưới 5 s nên heartbeat của chúng không kịp bắn lần nào. Đây là hành vi đúng thiết kế, không phải thiếu sót.
- Screenshots: m4-webkit-p1/p2/p3/p5.png trong `m4-scratch/` (binary, KHÔNG stage). Report JSON 129.294 B trong `m4-scratch/` (giữ trên đĩa, KHÔNG đưa vào paths — vượt trần 37.768 B, cùng mẫu đợt 127).

## 7. Kiểm chứng sau khi chạy + dọn dẹp

- Production không động: `preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — kiểm trước khi chạy (05:42Z) và khớp số đợt 127.
- `vite.m4.config.mjs` tạm đã bị harness tự xóa (killAll) — không còn trên đĩa.
- Lock v2: TRỐNG sau khi chạy, 0 ticket (68 cooldown — tăng 1 so với trước chạy, đúng 1 chu kỳ t3).
- Xvfb `:198` đã kill (file `/tmp/.X198-lock` không còn, `/tmp/.X11-unix/` trống); 0 process vite/MiniBrowser/Xvfb của T3 còn sót (kiểm bằng `ps` lúc 06:09Z).
- Lưu ý nhỏ về driver: lần chạy exec báo `output_drain_timeout` vì `sleep 30` của RAM sampler còn sống lúc shell thoát — trap đã kill subshell sampler nhưng sleep con của nó sống thêm chốc lát; kiểm lại bằng `ps` sau đó: không còn process sót nào. Driver exit=0, `DRIVER_EXIT=0`. Bài học cho driver sau: kill cả nhóm process của sampler (hoặc dùng `pkill -f` theo pattern riêng) thay vì chỉ kill subshell.
- Không kiểm lại TTS 39; không thử birefnet (RAM khả dụng tối đa 1.988 MB < guard 6 GB); không tự cài apt; không push.

## 8. Giới hạn — đọc trước khi trích số

1. **Kết quả này là n=1 trên boot #74, RAM rộng (tối thiểu 1.145 MB).** Một lần chạy sạch KHÔNG chứng minh nguyên nhân kẹt đợt 127, cũng không chứng minh RAM là nguyên nhân — chỉ loại trừ được "kẹt tất định ở P3 trên mọi boot".
2. **Heartbeat chưa được thử lửa:** vì không có lần chờ nào vượt 5 s, chưa có bằng chứng trực tiếp nào cho thấy heartbeat sẽ ghi log đúng lúc `page.evaluate` treo. Nếu kẹt tái hiện ở đợt sau, bản hb128 này mới là lúc nó phát huy — và cần kiểm tra lại dòng HB128 đầu tiên sau điểm kẹt để xác nhận.
3. **WebKitGTK ≠ Safari thật** (ghi rõ như mọi đợt). Số đo chỉ đúng trên VM này trong giờ vòng lặp.
4. Cờ T4 ghi "không có lượt yên hợp lệ lần 7" — đó là kết quả của T4/T9, T3 chỉ ghi nhận nội dung cờ để chứng minh đã chờ đúng lịch lệch; không đánh giá lại gate A hay ngưỡng ≤60 ms.
5. Reboot #73→#74 (04:55:17Z) xảy ra ngoài phiên T3 — T3 không điều tra nguyên nhân reboot; T5 là chủ quản.

## 9. Nợ cho đợt sau

1. **ĐÃ ĐÓNG:** chạy lại 85m4 webkit (nợ §8.1 đợt 127) — exit 0, P3 không kẹt, có kết quả đầy đủ.
2. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; lượt yên WebKit #7 → đợt 129 (theo cờ T4); mù #47 + probe #47 (T4 đợt 128); replay #72 hình dạng khác (T5 theo dõi).
3. **Cân nhắc:** driver các luồng sau nên kill cả nhóm process của RAM sampler (xem §7); bản hb128 giữ lại làm harness chẩn đoán chuẩn khi cần chạy lại 85m4.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round128-t3-85m4.txt` — **2 file** (LIMITS này + `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs`), đã verify read-back, 0 binary, mỗi file < 37.768 B. Không sửa code production, không sửa harness gốc. Screenshot PNG + report JSON KHÔNG có trong batch (giữ tại `hidden_files/round128-t3/m4-scratch/`). Dữ liệu thô: `hidden_files/round128-t3/` (run-webkit-128t3.sh, smoke/rebuild-fixtures-b74.log, smoke/run-webkit-85m4.log + summary + attempt1/ snapshot, smoke/ram-85m4.log, smoke/xvfb-198.log, m4-scratch/ với report JSON + 4 screenshot).

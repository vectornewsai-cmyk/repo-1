# Đợt 130 T8 — Vite harness webkit 84l10/85m4/86n2: CHẠY LẠI 3/3 exit 0 trên boot mới #78
# (Phần A: T8 gốc BỊ CHẶN 0/3 — giữ nguyên lịch sử; Phần B: T8b chạy lại sau đủ 2 cờ)

Ngày: 17/11/2026 (lượt cron 18:35 +07; T8 làm 11:37–13:1xZ). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chờ cờ T4 + kiểm tra bằng chứng trên đĩa + LIMITS này. KHÔNG chạy harness nào, KHÔNG sửa production, KHÔNG sửa harness nào, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND129_T8_VITEHARNESS_LIMITS.md §1 (lịch lệch T4-yên TRƯỚC, T8-harness SAU — quyết parent đợt 128 §12.3(b), giữ đợt 129 §12.3(b)) + LIMITS gộp đợt 129 §11 (lượt yên #8 dùng probe MỚI blendTick tăng dần + HB129).

## 0. Kết luận ngắn — harness KHÔNG chạy, gate không thỏa

- **Cờ `round130-t4-done` KHÔNG BAO GIỜ xuất hiện.** Waiter poll 60 s/lần từ 11:38:16Z tới 13:02:16Z: **85 poll, toàn GATE-NOT-YET**, rồi waiter bị SIGTERM theo reboot (không phải timeout, không phải lỗi waiter).
- **Reboot GIỮA LUỘT lần thứ hai liên tiếp** (đợt 129 cũng reboot giữa lượt): boot **#77** (boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`, btime 10:56:31Z) chết trong khung **(13:02:16Z, 13:02:41Z]**; boot mới (boot_id `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`, `uptime -s` 13:02:41Z, `stat /proc/1` 13:02:56Z — chênh 15 s, cùng mẫu như các đợt trước) — số thứ tự boot chờ T6 đếm lại (có thể là #78).
- **T4 đã chạy xong 3 attempt trên #77 nhưng chết đúng bước cuối:** attempt3 hoàn chỉnh 20/20 (median 40,0 ms, lớp B 5/5 — xem §2) nhưng T4 chưa kịp chạy analyzer attempt3, chưa viết LIMITS, chưa touch cờ `round130-t4-done` thì reboot giết session. Không có LIMITS T4 đợt 130 nào trên đĩa (`docs/PHASE9_ROUND130_T4*` không tồn tại).
- **T8 DỪNG theo đúng luật đứng:** không chạy harness lén khi cờ chưa có; thêm nữa, cờ `POSTBOOT_PASS` của T5 cho boot #77 (viết 12:01:24Z) đã STALE trên boot mới, và chưa có cờ POSTBOOT_PASS nào cho boot mới (session T5 cũng chết theo reboot). Chạy harness trên boot chưa kiểm postboot sẽ vi phạm quy trình đợt 129.
- **Chuẩn bị đợt 130 đã xong sẵn** (script copy từ đợt 129, `bash -n` OK; baseline production ghi §4) — chỉ cần parent respawn T4/T5 rồi T8 mới là chạy được. Hạn đóng đợt 14:35Z; báo cáo này gửi lúc ~13:1xZ để parent còn cửa sổ can thiệp (~1,5 h).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:37:57 | T8 mở: boot #77 (86538084), /proc/1 10:56:42Z, RAM khả dụng 839 MB, `/tmp/.X11-unix/` trống, fixture `/tmp` đã bị reboot xóa sạch |
| 11:38:16 | Waiter `wait-t4-130t8.sh` bắt đầu poll 60 s (tối đa 150 lần) |
| 11:38–12:00 | T4 gate0-wait: poll #12 (12:00:22Z) GATE 0 ĐẠT (T5 POSTBOOT_PASS chưa có lúc đó — T4 dùng T7 VANG-T7-DONE + check-only riêng PASS + apt=0 + cây md5 805409f0) |
| 11:40:32 | T5 sửa preview.tsx cho instrumentation (c2): md5 03bf029f → 805409f0 (ghi §4) |
| 12:01:24 | T5 viết cờ `POSTBOOT_PASS` boot #77 (poll 24) — sau §8.2(B) trigger + `--repair` 1 lần thành công (xem log T5) |
| 12:19–12:47 | T4 attempt1: retry1/2/3 fail nhanh, retry4 chạy 12:43–12:47Z → PARTIAL 6/20 pass-timeout |
| 12:52–12:55 | T4 attempt2 → PARTIAL 10/20 pass-timeout |
| 12:59–13:00 | T4 attempt3 → FULL 20/20 (JSON 3.270.737 B, mtime 13:00Z) |
| 13:02:42 | T4 đánh giá lớp B attempt3: 5/5 ĐẠT; nhả lock (giữ 203 s) — dòng cuối cùng của `chain-t4.log` |
| (13:02:16, 13:02:41] | **Boot #77 CHẾT** (waiter poll 85 lúc 13:02:16Z là dấu sống cuối; `uptime -s` boot mới 13:02:41Z) |
| 13:03:39 | T8 kiểm lại trên boot mới: boot_id 57c3e5e2, uptime 0 phút, RAM khả dụng 1.406 MB, `/tmp/.X11-unix/` trống, 0 process Xvfb/vite/MiniBrowser |

- **Lưu ý đồng hồ (ghi rõ, không tự kết luận):** dòng cuối `chain-t4.log` ghi 13:02:42Z (đồng hồ boot #77) trong khi `uptime -s` boot mới là 13:02:41Z — chênh ~1 s, cùng mẫu chênh đồng hồ giữa hai boot như đợt 129 (lúc đó ~33 s). Khung chết (13:02:16Z, 13:02:41Z] lấy theo đồng hồ mới + poll waiter cuối; con số 13:02:42Z chỉ dùng để định vị tương đối trong log T4.

## 2. Bằng chứng T4 trên đĩa — attempt3 là lượt đầy đủ, attempt1/2 partial (T8 chỉ đọc, không kết luận verdict thay T4)

Số liệu dưới đây do **analyzer của chính T4** tính (chạy read-only trên JSON gốc; T8 không sửa JSON nào, không viết gì vào `round130-t4/`):

| Attempt | Kết quả | tickCost median | Lớp B | Ghi chú |
|---|---|---|---|---|
| 1 | PARTIAL 6/20, pass-timeout | 41,0 ms (n=193, p90 63,8) | 5/5 ĐẠT | `writePartial-blendTick TIMEOUT 30 s` (pass-timeout); HB129 bắn 33 dòng trong log (elapsed 15/20/25 s lúc timeout) — heartbeat probe mới đã thử lửa trong stall thật |
| 2 | PARTIAL 10/20, pass-timeout | 42,0 ms (n=314, p90 64,0) | 5/5 ĐẠT | `play pass 11/20` timeout 120 s; HB129 bắn 33 dòng (elapsed 80–115 s, mỗi 5 s) — heartbeat đều trong lúc kẹt |
| 3 | **FULL 20/20** (`partial JSON đã ghi: 20/20 pass`, tickCost ok n=629, blendTick ok n=502; `run-attempt exit=0`) | **40,0 ms (n=630, p90 66,0, max 103, min 28; hậu flip+2000ms n=451 median 40,0)** | **5/5 ĐẠT** (load1 max 3,15; RAM min 1.722 MB; load5 cuối 1,08; không reboot; apt 0) | (c2) = **0** (labellag attempt3: n=112, median 0f, max 3f, ≥5f: 0); lag ≥+5f: **0**; pageErrs=[]; HB129 0 dòng (không có stall để bắn) |

- Dãy median 3 attempt: 41,0 / 42,0 / 40,0 ms — đều dưới ngưỡng ≤60 ms. Nếu tính attempt3 là lượt hợp lệ thì lượt yên #8 có dữ liệu đóng (median 40,0 ms, thấp nhất trong 7 lượt yên xác nhận: 49,5/40,0/52,0/47,5/44,0/54,0/40,0?) — **nhưng verdict đóng/mở là của T4/parent, T8 không tự kết luận**: T4 chưa viết LIMITS, chưa chạy analyzer attempt3 (file `analyze-t4-attempt3-*.txt` không tồn tại), chưa touch cờ.
- Attempt1/2 partial đều do pass-timeout ở khâu ghi blendTick / play pass (rAF/renderer kẹt), không phải do median vượt ngưỡng. HB129 (heartbeat 5 s của probe mới) đã chứng minh bắn đúng trong cả hai lần stall thật — đây là bằng chứng đầu tiên heartbeat mới hoạt động khi probe kẹt, không chỉ khi chờ đồng bộ (đợt 129: HB128 bắn lúc chờ đồng bộ >5 s).

## 3. Vì sao T8 không chạy harness — 3 lý do độc lập, lý do nào cũng đủ chặn

1. **Cờ `round130-t4-done` không tồn tại** — luật lịch lệch bắt buộc (quyết parent đợt 128 §12.3(b)): T8 chỉ chạy SAU cờ. Không có cờ = không chạy.
2. **Không có cờ `POSTBOOT_PASS` cho boot mới** — cờ T5 hiện có (`round130-t5/POSTBOOT_PASS`, pass_at 12:01:24Z) ghi đúng boot_id 86538084 (#77), đã STALE. Quy trình đợt 129 yêu cầu chạy lại sau cờ POSTBOOT_PASS mới của T5 trên boot mới.
3. **Session T4 đã chết, không ai viết cờ** — reboot giết toàn bộ session (T4, T5, T8-waiter, các luồng khác). Chờ thêm tới hạn 14:35Z cũng không sinh ra cờ. Việc đúng là báo ngay để parent respawn, không phải chờ câm tới hạn.

## 4. Trạng thái kiểm chứng trên boot mới (13:03–13:08Z, chỉ đọc)

- Boot: `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`, `uptime -s` 13:02:41Z, `stat /proc/1` 13:02:56Z. RAM khả dụng 1.406 MB lúc kiểm (fresh boot).
- Production: `preview.tsx` `805409f0…` (đã gồm instrumentation T5, mtime 11:40:32Z — khác baseline 03bf029f T8 ghi lúc 11:37Z, đúng như cảnh báo trong task; KHÔNG phải do T8 sửa), `media.ts` `2c384ed1…` (không đổi), `vite.config.ts` `ee80d093…` (không đổi).
- `/tmp/.X11-unix/` trống; 0 process Xvfb/vite/MiniBrowser sót; lock vite: thư mục `vite.lock` không tồn tại (không holder), queue `vite.lock.queue` 71 file cooldown (khớp số T5: 71 file / 994 B).
- Fixture `/tmp` (round76-d8, l10/m4/n2 clips) vẫn trống sau reboot — mọi lần chạy harness sau này phải rebuild fixture trước (script `rebuild-fixtures-130t8.sh` đã sẵn, md5 kỳ vọng khớp đợt 126 như mọi đợt).
- Script đợt 130 đã chuẩn bị: `hidden_files/round130-t8/` (run-webkit-130t8.sh, wait-t4-130t8.sh, rebuild-fixtures-130t8.sh, inventory130.py, mirror-verify130.py — copy từ đợt 129, đổi 129→130, `bash -n` OK). **Chưa chạy** bất kỳ harness/tsc/vite build nào trong đợt này — không có kết quả 84l10/85m4/86n2 để báo.
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push.

## 5. Giới hạn — đọc trước khi trích số

1. **0/3 harness đợt này là "không chạy", không phải "fail".** Không được trích thành "85m4 kẹt lại" hay "WebKit fail đợt 130" — không có lần chạy nào.
2. **Attempt3 của T4 (median 40,0 ms, B 5/5, (c2)=0) là bằng chứng trên đĩa, chưa phải verdict.** Chỉ T4 (respawn) hoặc parent mới được tuyên bố lượt yên #8 đóng hay không. T8 chỉ tính lại bằng analyzer của T4.
3. **Khung chết boot #77 (13:02:16Z, 13:02:41Z] là khoảng hẹp ~25 s**, khác đợt 129 (khung ~3 phút). Chênh đồng hồ ~1 s giữa hai boot là suy luận từ log (§1), không phải đo trực tiếp.
4. **Reboot giữa lượt lần thứ hai liên tiếp** (đợt 129: #75→#76; đợt 130: #77→boot mới) — mẫu "reboot giữa lượt" nay đã lặp, không còn là ngoại lệ một lần. Các luồng sau nên snapshot bằng chứng trước mỗi lần chạy lại sau reboot như đợt 129 đã làm.
5. **P5 seek kẹt 3 mẫu (~0,6 s) đợt 129 và kẹt P3 đợt 127 đều KHÔNG có dữ liệu mới đợt này** — không chạy harness nên không theo dõi được; nợ theo dõi chuyển nguyên sang đợt sau.

## 6. Nợ cho đợt sau / cần quyết parent

1. **CẦN QUYẾT NGAY (trước khi đợt 130 đóng):** (a) respawn T4 trên boot mới để hoàn tất LIMITS + cờ từ dữ liệu attempt3 trên đĩa, hay chạy lại lượt yên #8 từ đầu? (b) T5 viết lại POSTBOOT_PASS cho boot mới (kiểm replay + libs/GST như đợt 129)? (c) respawn T8 để chạy bộ 3 harness sau khi (a)+(b) xong, hay đóng đợt 130 thiếu T8 (7/9 + T8 bị chặn)?
2. **Nếu respawn T8:** chạy đủ 84l10/85m4-hb128/86n2 trên boot mới sau cờ T4 mới + POSTBOOT_PASS mới; rebuild fixture trước (md5 khớp đợt 126); theo dõi P3 kẹt (lần chạy sạch thứ 3 liên tiếp nếu không kẹt), HB129/HB128, P5 seek kẹt (đợt 129: 3 mẫu).
3. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #49 giữ lịch probe thường lệ (T2 đợt 130 đã xong trước reboot — cờ round130-t2.done có); R9 (a) nhắc lần 16.
4. T4 attempt1/2 partial pass-timeout (2 lần trong một đợt, đều ở khâu blendTick/play-pass) — có phải probe mới nhạy timeout hơn probe cũ? Câu hỏi cho T4/T3 đợt sau; T8 không kết luận.


## 7. CHẠY LẠI trên boot mới (57c3e5e2, tạm #78) — 3/3 exit 0 (T8b, 13:40–13:49Z)

### 7.1 Cờ đủ — lịch lệch thỏa

- `round130-t4-done` có từ 13:08:03Z (T4b khôi phục từ dữ liệu đĩa: lượt yên #8 ĐÓNG, attempt3 20/20, median 40,0 ms, lớp B 5/5; cờ dặn T8 chỉ chạy sau POSTBOOT_PASS mới cho boot #78).
- `round130-t5b/POSTBOOT_PASS` có lúc 13:39:13Z (poll=23 của T5b): `boot_id=57c3e5e2-c31f-4d85-9e0e-28d615c0d061 btime=2026-11-17T13:02:41Z` — khớp boot hiện tại. Waiter T8b poll 60 s/lần, tìm thấy cờ ở poll 26 lúc 13:39:46Z (25 phút chờ, từ 13:14:46Z). Không chạy harness nào trước cờ.
- Khung chết boot #77 có hai bản ghi: T8 gốc ghi (13:02:16Z, 13:02:41Z] (§1); cờ T4b ghi (13:02:42Z, 13:04:14Z] — hai khung theo hai đồng hồ/bằng chứng khác nhau, ghi cả hai, không tự chọn một. Thời điểm tuyệt đối lấy theo btime kernel boot mới (13:02:41Z).

### 7.2 Kết quả bộ 3 (driver `run-webkit-130t8.sh`, Xvfb :199 riêng, lock `t8-round130` từng harness)

| Harness | Lock giữ | Thời gian | Kết quả |
|---|---|---|---|
| 84l10 `clicktest-84l10-webkit-loop-w1.mjs` (L10_ENGINE=webkit) | 71 s | 13:40:29–13:41:40Z | **exit 0, KHÔNG FAIL** — W1-lần1/2/3 PASS (đồng bộ 2,0/1,3/0,7 s; restartEndedVideo 0→1→2→3, hạ-cánh-về-target=true, errors=0), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối, ct cuối=4, ended=true) |
| 85m4 `clicktest-85m4-webkit-w7-hb128.mjs` (M4_ENGINE=webkit) | 134 s (+16 s chờ acquire) | 13:41:56–13:44:10Z | **exit 0, KHÔNG FAIL** — P1 PASS (0 restart dư), P2 PASS (reset xong 814 ms), **P3 PASS (phát thường 20 s, 0 restart — KHÔNG kẹt)**, P4-lần1/2/3 PASS (đồng bộ 1,3/1,3/1,3 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart dư; seek kẹt dài nhất **0 mẫu**). Report JSON `ok=true` |
| 86n2 `clicktest-86n2-webkit-w7.mjs` (N2_ENGINE=webkit) | 233 s (+15 s chờ acquire) | 13:44:25–13:48:18Z | **exit 0, KHÔNG FAIL** — P1 PASS (0 restart dư), P2 PASS (reset xong 672 ms), P3 PASS (0 restart), P4-lần1/2/3 PASS (đồng bộ 1,9/1,8/1,7 s; delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0), P5 PASS (40 s sau reset, 0 restart dư; seek kẹt dài nhất **0 mẫu**). Report JSON `ok=true` |

### 7.3 Heartbeat HB128 / HB129

- **HB128 (85m4): 19 dòng trong m4-run.log, TẤT CẢ là `sampleFor` đều 5 s/lần** (P1-phaseA 4, P2-phaseB 3, P3-control 4, P5-phaseB-long 8) — sampling tiến triển bình thường, không khoảng trống. **0 dòng `waitForPlaySync`:** mọi lần đồng bộ đều xong dưới 5 s nên heartbeat chờ không có dịp bắn (khác đợt 129: 2 dòng `waitForPlaySync` khi P4 đồng bộ 5–6,5 s).
- **HB129:** chỉ có trong probe lượt yên của T4, không có trong harness T8 — không có dữ liệu HB129 mới từ lần chạy này; attempt3 của T4 có 0 dòng HB129 (không stall), đã ghi ở LIMITS T4.

### 7.4 P3 / P5 theo dõi

- **P3 KHÔNG kẹt — lần chạy sạch thứ ba liên tiếp** (đợt 128 trên #74, đợt 129 trên #76, đợt 130 trên #78). Nguyên nhân kẹt đợt 127 VẪN CHƯA CHỨNG MINH.
- **P5 seek kẹt 0 mẫu ở cả 85m4 và 86n2** (đợt 129 là 3 mẫu ~0,6 s; đợt 128 là 0 mẫu) — về lại 0, chưa đủ cơ sở gọi 3 mẫu đợt 129 là hồi quy.
- **P4 đồng bộ nhanh trở lại (1,3–1,9 s)** sau đợt 129 chậm (5–6,5 s). RAM khả dụng tối thiểu lúc chạy 695 MB (đợt 129: 511 MB) — chỉ ghi tương quan, KHÔNG kết luận RAM là nguyên nhân.

## 8. Kiểm chứng sau chạy lại (boot #78)

- Fixture rebuild sau reboot (script `rebuild-fixtures-130t8.sh`, log `smoke/rebuild-fixtures-b78.log`): md5 đủ 32 ký tự khớp đợt 126 (hevc-a `ba0c7c623901a9a7b428ea664f1fff53`, i7 `f05daed87b2eb12bc15c9dbf0835e931`, h-30s `fbaa3d1a5b32301c78a07221315382c0`, g-4s `a1fb8549165c526cf89b69e6cdcfeba3`; m4/n2 copy byte-identical h-30s). Blend media bền khớp đợt 125–129 (`f1e277f0…`, `f4c35a6a…`).
- Mirror + kiểm kê trên boot #78: **25/25 OK**, 0 đổi 0 mất; kiểm kê **238 file, diff 0 dòng** so với đợt 129 (201/201 harness vite dev đã phủ mirror).
- `npx tsc --noEmit` (apps/web): **exit 0** (`smoke/tsc-web-b78.log`, ~13:49:31Z). `npx vite build` (apps/web): **exit 0**, built 8,09 s (`smoke/vite-build-b78.log`; chỉ cảnh báo chunk >500 kB có từ trước).
- Production không động trước/sau chạy: `preview.tsx` `805409f0…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` (kiểm 13:40Z và 13:49Z).
- RAM trong lúc chạy (sampler 30 s, 16 mẫu): khả dụng **695–1.734 MB**, load1 tối đa 2,76. Dưới guard 6 GB — birefnet không thử.
- Dọn dẹp: Xvfb `:199` đã kill + socket `/tmp/.X11-unix/X199` + `/tmp/.X199-lock` đã unlink (luật đứng); `/tmp/.X11-unix/` trống; 0 process Xvfb/vite/MiniBrowser sót; RAM sampler kill cả nhóm process; lock TRỐNG sau khi chạy (0 ticket + 72 cooldown; trước chạy 71).
- Không reboot trong lúc chạy lại (boot 57c3e5e2 suốt 13:40–13:49Z). Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Chạy lại xong 13:49:40Z, trước hạn đóng đợt 14:35Z.

## 9. Giới hạn — phần chạy lại (đọc trước khi trích số)

1. **Kết quả 3/3 là n=1 bộ trên boot #78** (trong giờ vòng lặp nhiều luồng song song — tải + RAM là biến số lớn nhất). Số đo chỉ đúng trên VM này.
2. **0 dòng `waitForPlaySync` đợt này KHÔNG phải bằng chứng heartbeat hỏng** — chỉ là không có lần đồng bộ nào vượt 5 s để kích hoạt; bằng chứng bắn thật đã có từ đợt 129 (2 dòng).
3. **Khung chết boot #77 có hai bản ghi khác nhau (§7.1)** — thời điểm reboot tuyệt đối lấy theo btime kernel boot mới (13:02:41Z).
4. **Cột `swap_used` trong `ram-130t8.log` thực chất là Mem used của `free -m`** (script ghi `$3`) — chỉ dùng cột `avail` để đọc RAM khả dụng.
5. Report JSON 3 harness chỉ có 4 key (`engines`, `finishedAt`, `ok`, `startedAt`) — không có key `consoleErrs`; bằng chứng "0 lỗi" là `errors=0` từng phase trong log + `ok=true`.

## 10. Nợ cho đợt sau (cập nhật sau chạy lại)

1. **ĐÃ ĐÓNG:** chạy lại bộ 3 harness webkit trên boot mới sau reboot giữa lượt (nợ từ §6 mục 1(c) của phần A) — 3/3 exit 0, P3 không kẹt, P5 seek 0 mẫu.
2. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; `probe-82j3` exit code khi lỗi (nợ nhỏ, xem LIMITS đợt 129 §7 mục 6); mù #49/#50 theo T2; R9 (a) nhắc lần 16.
3. **Theo dõi đợt sau:** P4 đồng bộ (nhanh 1,3–1,9 s đợt này vs chậm 5–6,5 s đợt 129 — đối chiếu cửa sổ RAM); P5 seek kẹt (0 mẫu đợt này vs 3 mẫu đợt 129); nếu 85m4 kẹt lại thì ghi dòng HB128 đầu tiên sau điểm kẹt.
4. **Reboot giữa lượt lần thứ ba liên tiếp** (đợt 129: #75→#76; đợt 130: #77→#78, chặn cả T8 gốc lẫn T4/T5 giữa lượt) — mẫu đã lặp 2 đợt liên tiếp; các luồng sau tiếp tục snapshot bằng chứng trước mỗi lần chạy lại sau reboot như đợt 129/130 đã làm.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round130-t8-viteharness.txt` — **1 file** (LIMITS này, đã cập nhật thêm Phần B chạy lại), đã verify read-back, 0 binary, **< 37.768 B**. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật). Dữ liệu thô: `hidden_files/round130-t8/` (run-webkit-130t8.sh, wait-t4-130t8.sh, rebuild-fixtures-130t8.sh, inventory130.py, mirror-verify130.py, smoke/wait-t4.log — 85 poll GATE-NOT-YET + SIGTERM theo reboot; smoke/wait-t5b-130t8b.log — 26 poll, GATE-FOUND 13:39:46Z; smoke/rebuild-fixtures-b78.log; smoke/run-webkit-summary.txt + run-webkit-84l10/85m4/86n2.log + attempt1/ snapshot; smoke/ram-130t8.log; smoke/tsc-web-b78.log; smoke/vite-build-b78.log; mirror-verify-b78.log; inventory130-b78.txt; l10/m4/n2-scratch với report JSON).

# Đợt 135 T8 — Vite harness WebKit 84l10/85m4/86n2: 3/3 exit 0 sau 1 retry (84l10 TIMEOUT 124 lần 1, exit 0 lần retry) — 1 reboot SAU khi xong việc

Ngày: 18/11/2026 (lượt cron 09:35 +07 = 02:35Z; T8 mở 02:40Z, hạn T8 04:45Z, hạn cứng T10 05:00Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chờ cờ + chạy harness + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND134_T8_VITEHARNESS_LIMITS.md (phương pháp: waiter gate, 3 harness, fixture rebuild md5, dọn dẹp) + docs/PHASE9_ROUND134_T4_WEBKIT_QUIET11_LIMITS.md.

## 0. Kết luận ngắn — 3/3 exit 0 sau 1 retry; gate CHÍNH (không cần gate thay thế); 1 reboot sau khi xong việc

- **Gate đủ 03:00:50Z (waiter poll 18, CHỈ 1 waiter, không reboot lúc chờ):** `round135-t4.done` + `POSTBOOT_PASS` boot `78b55838` pass_at 02:45:13Z poll=2 (T5 b88 — cờ tới NHANH, ~18 phút sau boot, khác hẳn đợt 134 mất 56 phút).
- **Lượt yên #12 của T4 (ghi trong cờ, không phải số đo của T8): 1 attempt hợp lệ, 20/20 pass, median tickCost 40,0 ms (ngưỡng ≤60 ms GIỮ), (c2)=7, coverage 7/7, lớp B 5/5, logger nới KIỂM CHỨNG runtime (loop 1–22, 21 wrap).** → Điều kiện revert "sau khi đo" của fix T3 ĐÃ XẢY RA lần đầu (xem §7 — quyết revert thuộc T3/parent, T8 không tự quyết; cờ `round135-t8.done` KHÔNG có nghĩa "được revert").
- **Chạy 1 trên boot 78b55838 (03:05:11–03:26:48Z): 84l10 exit 124 (TIMEOUT 900 s — kẹt sau W1-lần1 PASS, 0 dòng W1-lần2, im lặng ~886 s; pha kẹt MỚI, xem F-135-T8-1); 85m4 exit 0 (~2m10s, toàn bộ PASS, HB128 19 dòng); 86n2 exit 0 (~3m52s, toàn bộ PASS tới P6).**
- **Retry 84l10 MỘT lần trên cùng boot (03:31:14–03:32:23Z, timeout 900 s): exit 0 (~69 s, W1×3/W2/E4 PASS).** Kẹt W1-lần2 KHÔNG tái hiện. Hai kẹt đợt 134 (85m4 P1-phaseA, 86n2 P4-lần2) cũng KHÔNG tái hiện đợt này.
- **Reboot 1 lần SAU khi mọi harness đã xong (~03:32–03:35Z, boot 78b55838 → bcc71e61):** giết lệnh giám sát sleep-480 của T8 (runtime restart, không có final result xác nhận) — T8 khôi phục bằng đọc lại đĩa, không mất dữ liệu, không chạy lại (xem F-135-T8-2).
- **Fixture rebuild 1 lần: 6/6 md5 khớp đợt 125–134.** Reboot tới sau khi xong việc nên không cần rebuild lần 2 (fixture /tmp bị reboot xóa như mọi lần — đúng thiết kế).
- **Cây: preview.tsx `530e10a7` suốt lượt** (fix T3 GIỮ theo quyết parent đợt 134 §12.3(a)); media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên (mở / trước chạy / cuối lượt đều khớp).
- **Dọn sạch:** 0 process Xvfb/vite/MiniBrowser sót, `/tmp/.X11-unix/` trống sau reboot, không có `vite.lock`; lock `t8-round135` đã nhả đủ 4 lần giữ (84l10, 85m4, 86n2, 84l10-retry).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 02:27:38 | Boot `78b55838` lên (boot lúc mở đợt; reboot sau khi đợt 134 đóng) |
| 02:35 | Lượt cron 09:35 +07 mở đợt 135; parent tạo `round-in-progress.md` |
| 02:40:49 | T8 mở: boot `78b55838`, RAM avail 825 MB, `/tmp/.X11-unix/` trống, 0 process; cây preview.tsx `530e10a7` (khớp quyết giữ) |
| 02:43:49 | Waiter bắt đầu poll 60 s (deadline 03:45Z, epoch 1794973500 đã kiểm chứng — gõ tay, không sed) |
| 02:45:13 | T5 b88 viết `POSTBOOT_PASS` boot `78b55838` (poll 2) — waiter thấy postboot=1 từ poll 7 |
| 03:00:50 | Waiter poll 18: **GATE-FOUND**, exit 0 (17 poll NOT-YET trước đó; T4.done đã có — lượt yên #12 20/20 pass, median 40,0 ms) |
| 03:04:42 | Kiểm cây trước chạy: 530e10a7 / 2c384ed1 / ee80d093; RAM avail 1603 MB |
| 03:04:5x | Rebuild fixture xong (~14 s): 6/6 md5 khớp |
| 03:05:14–03:20:14 | **84l10 exit 124 (TIMEOUT 900 s)** — W1-lần1 PASS 03:05:28Z rồi im lặng ~886 s (xem §3) |
| 03:20:30–03:22:40 | **85m4 exit 0** (~2m10s, toàn bộ PASS) |
| 03:22:56–03:26:48 | **86n2 exit 0** (~3m52s, toàn bộ PASS tới P6) |
| 03:30:34 | Kiểm cuối chạy 1: 0 process sót, X193 (của luồng khác) còn, không `vite.lock` |
| 03:31:14–03:32:23 | **Retry 84l10: exit 0** (~69 s, W1×3/W2/E4 PASS) |
| ~03:32–03:35 | **Reboot** (78b55838 → bcc71e61, btime mới ~03:35:31Z theo /proc/1) — sau khi retry đã xong + nhả lock |
| 03:36:07 | T8 khôi phục sau runtime restart: đọc lại đĩa — retry đã DONE 03:32:23Z, lock đã nhả, report l10 ok=True |
| 03:37:05 | Kiểm cuối trên boot mới: cây không đổi (530e10a7), 0 process sót, `/tmp/.X11-unix/` trống, không `vite.lock`, RAM avail 1760 MB |

## 2. Chuẩn bị — waiter deadline gõ tay đã kiểm chứng; script retry 84l10 viết riêng

- **Deadline waiter gõ TAY TRỰC TIẾP, không sed** (bài học đợt 132): `DEADLINE=$(date -d '2026-11-18 03:45:00 UTC' +%s)` = **1794973500**, lớn hơn epoch lúc viết (1794969728) đúng 3772 s (~63 phút); `bash -n` OK. Gate mở 03:00:50Z nên deadline không bị trigger — nhưng DEADLINE đã có giá trị hợp lệ, khác rỗng, suốt lượt.
- **Waiter chỉ 1 lần, không chết giữa lượt** (đợt 134 chết 2 lần theo reboot): đọc lại boot_id mỗi poll (bản vá đợt 134) đã có sẵn trong script đợt này từ đầu.
- Driver + fixture script adapt từ đợt 134 bằng sed `134→135` (đã grep kiểm: 0 ref `134` còn sót ngoài comment lịch sử; `bash -n` OK). Timeout 900 s cho MỌI harness (quy định đợt 135).
- **Retry 84l10 viết riêng bằng tay** (`run-webkit-135t8-retry84l10.sh`, `bash -n` OK): chỉ chạy 84l10 (85m4/86n2 đã exit 0, không chạy lại) — KHÔNG dùng script retry chung đợt 134 (chạy 86n2+85m4). Timeout 900 s (đã sửa 300 s → 900 s trong script retry chung trước khi quyết định không dùng nó; script chung còn trong thư mục nhưng KHÔNG chạy).

## 3. Kết quả harness chi tiết — boot 78b55838, Xvfb :199, lock t8-round135

### Chạy 1 — 03:05:11–03:26:48Z

#### 84l10 — exit 124, TIMEOUT 900 s (03:05:14–03:20:14Z) — kẹt W1-lần2 (pha kẹt MỚI)
- W1-lần1 PASS 03:05:28Z (đồng bộ sau 0,6 s, playhead=0.8, ct=1.38; restartEndedVideo 0→1, delta=+1, hạ-cánh-về-target=true; sau khi gỡ: playhead 1.1→1.833, ct=2.033, playing=true, errors=0).
- Sau đó **KHÔNG CÓ DÒNG W1-lần2 NÀO** (grep = 0): log 33 dòng, dòng cuối có nội dung là W1-lần1 PASS 03:05:28Z; tiếp theo chỉ là dòng kill của timeout + `KẾT QUẢ: CÓ FAIL` lúc 03:20:14Z. **Im lặng ~886 s.** Không có dòng W2/E4 nào.
- Report `l10-scratch/l10-webkit-loop-w1-report.json` lần 1: ok=False, startedAt 03:05:15Z, finishedAt 03:20:14Z (đã bị retry ghi đè sau — xem F-135-T8-4).
- RAM avail trong lúc kẹt: 1437 MB (03:05:11Z) → 349 MB (03:20:11Z) — tụt ~1,1 GB trong 15 phút kẹt; loadavg tụt về ~0,1 (process chờ, không bận). RAM lúc bắt đầu retry sau đó chỉ 652–656 MB nhưng retry vẫn pass trong 69 s → kẹt không đơn thuần do ngưỡng RAM tuyệt đối (xem §6.2).

#### 85m4 hb128 — exit 0 (03:20:30–03:22:40Z, ~2m10s)
- P1 PASS (không restart dư), P2 PASS (reset 683 ms), **P3 PASS (0 restart — phát thường ổn định)**, P4-lần1/2/3 PASS (đồng bộ 1,8/1,7/1,8 s; delta=+1, hạ-cánh-về-target=true), P5 PASS (không restart dư trong 40 s sau reset) — **seek kẹt dài nhất 0 mẫu (~0.0 s)**.
- HB128: **19 dòng `sampleFor`** — đúng bằng đợt 133/134.
- `KẾT QUẢ: KHÔNG FAIL` — report `m4-scratch/m4-webkit-w7-report.json` (147.149 B, ok=True).
- **Kẹt P1-phaseA đợt 134 (0/100 mẫu, 881 s) KHÔNG tái hiện.**

#### 86n2 — exit 0 (03:22:56–03:26:48Z, ~3m52s)
- P1 PASS (không restart dư), P2 PASS (reset 708 ms), **P3 PASS (0 restart)**, P4-lần1/2/3 PASS (đồng bộ 1,2/1,7/1,8 s; delta=+1, hạ-cánh-về-target=true), P5 PASS (seek kẹt 0 mẫu), **P6 KHÔNG-KẸT (element phát thường suốt 90 s chờ — 0 restart)**.
- `KẾT QUẢ: KHÔNG FAIL` — report `n2-scratch/n2-webkit-w7-report.json` (171.409 B, ok=True).
- **Kẹt P4-lần2 đợt 134 (im lặng ~13,7 phút) KHÔNG tái hiện** — P4-lần2 đợt này PASS sau đồng bộ 1,7 s.

### Retry — 84l10 trên cùng boot 78b55838 (03:31:14–03:32:23Z)

#### 84l10-retry — exit 0 (~69 s, đúng bằng thời gian đợt 134)
- W1-lần1 PASS (03:31:29Z), **W1-lần2 PASS (03:31:34Z — đồng bộ sau 1,3 s, restart 1→2, delta=+1)**, W1-lần3 PASS (03:31:40Z, restart 2→3), W1b pause/resume ok, W2 PASS (playhead cuối=30, tới cuối=true, restart tự nhiên Δ=0), E4 PASS (tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=4, ended=true).
- `KẾT QUẢ: KHÔNG FAIL` — report `l10-scratch/l10-webkit-loop-w1-report.json` (35.172 B, ok=True, finishedAt 03:32:23Z).
- RAM avail lúc retry: 652–656 MB lúc bắt đầu, 1255 MB lúc kết thúc (RAM hồi sau khi 84l10 lần 1 bị kill).
- **Tổng kết: 3/3 harness exit 0 nếu tính retry (84l10 cần 2 lần chạy); 2/3 nếu chỉ tính chạy 1.**

### Tổng hợp
- **P3 không kẹt lần thứ bảy liên tiếp** có chạy tới P3 (đợt 131: lần 4; 132: không chạy — không tính; 133: lần 5; 134: lần 6; 135: lần 7 — 85m4 + 86n2 đều P3 PASS 0 restart).
- Ba lần kẹt "treo không trả mẫu" gần nhất ở ba pha khác nhau, ba lần chạy khác nhau: 85m4 P1-phaseA (đợt 134, boot cc1f9de0), 86n2 P4-lần2 (đợt 134, boot 8ae55060), 84l10 W1-lần2 (đợt 135, boot 78b55838) — và cả ba đều KHÔNG tái hiện khi chạy lại. Mẫu chung vẫn là "bước đồng bộ/lấy mẫu treo", không phải một pha cố định nào hỏng.

## 4. Lượt yên #12 — bối cảnh từ cờ T4 (không phải số đo của T8)

- T4 đóng với **1 attempt hợp lệ, 20/20 pass, median tickCost 40,0 ms (ngưỡng ≤60 ms GIỮ), (c2)=7, coverage 7/7, lớp B 5/5, logger nới KIỂM CHỨNG runtime (loop 1–22, 21 wrap)** — lần đầu tiên logger đã nới được kiểm chứng bằng một lượt đo hợp lệ (đợt 134: 0 attempt, chỉ có JSON partial n=53 toàn loop 1, 0 wrap).
- POSTBOOT_PASS cho boot 78b55838 tới nhanh (pass_at 02:45:13Z, poll 2 — ~18 phút sau boot), nên gate T8 mở được 03:00:50Z mà không cần gate thay thế (khác đợt 134 phải dùng check-only trực tiếp cho retry).
- T8 không đo log draw, không phân tích (c2) — đó là việc T5 pha 2 / T3 bước 2.

## 5. Fixture rebuild — 6/6 md5 khớp (1 lần duy nhất)

- Rebuild 03:04:5xZ trên boot 78b55838 (~14 s): hevc `ba0c7c62`, i7 `f05daed8`, h-30s `fbaa3d1a` (×3: l10/m4/n2), g-4s `a1fb8549` — khớp đợt 125–134. ffprobe đúng spec; blend media bền kiểm tra đủ (ocean-a50 `f1e277f0`, slov-a085 `f4c35a6a`).
- Reboot tới sau khi mọi harness đã xong nên KHÔNG rebuild lần 2; fixture trong /tmp đã bị reboot xóa (đúng thiết kế — fixture chỉ sống trong /tmp, rebuild lại sau mỗi reboot, không có trong batch stage).

## 6. Dọn dẹp + kiểm cuối — đã dọn sạch (phần của T8)

- Trap `cleanup` của driver + retry driver: kill Xvfb :199 (+ `kill -9` sau 2 s), unlink `/tmp/.X11-unix/X199` + `/tmp/.X199-lock`, kill cả nhóm RAM sampler (+ `pkill -f ram-135t8*.log` dự phòng).
- Kiểm cuối 03:30:34Z (trước retry, trên boot 78b55838): 0 process Xvfb/vite/MiniBrowser; `/tmp/.X11-unix/` còn **X193** (của luồng khác — KHÔNG phải của T8, để nguyên); không có `vite.lock`.
- Kiểm cuối 03:36–03:37Z (sau reboot, trên boot bcc71e61): 0 process sót; `/tmp/.X11-unix/` trống (reboot xóa /tmp); không có `vite.lock`; cây không đổi (530e10a7 / 2c384ed1 / ee80d093); RAM avail 1760 MB.
- Lock `t8-round135`: nhả đủ 4 lần giữ — 84l10 giữ 901 s (tính cả timeout 900 s) nhả 03:20:15Z; 85m4 giữ 130 s nhả 03:22:40Z; 86n2 giữ 232 s nhả 03:26:48Z; 84l10-retry giữ 69 s nhả 03:32:23Z. Thư mục lock không còn ticket nào của T8 (chỉ còn cooldown cũ của các đợt trước — T6 quản lý prune).
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **84l10 cần 2 lần chạy mới pass:** chạy 1 TIMEOUT 124 (kẹt W1-lần2), retry exit 0. "3/3 exit 0" chỉ đúng khi tính retry; chạy 1 là 2/3. Không suy ra "84l10 luôn pass" ngoài boot 78b55838 này.
2. **Ba lần kẹt đều là "treo không trả mẫu", không phải FAIL có verdict:** 84l10 W1-lần2 đợt này (im lặng ~886 s, 0 dòng W1-lần2) cũng như 2 kẹt đợt 134 đều là harness treo rồi bị timeout/reboot giết — không có dòng FAIL nào chỉ ra pha đó sai logic; chỉ có bằng chứng "bước đồng bộ không trả kết quả trong thời gian đó". Không kết luận hồi quy từ 3 mẫu kẹt ở 3 pha/3 lần chạy khác nhau, nhất là khi cả 3 đều không tái hiện khi chạy lại.
3. **Cột "swap_used" trong `ram-135t8*.log` thực chất là Mem used** — label sai từ script sampler gốc (đợt 128): `$3` của dòng `Mem:` trong `free -m` là used, không phải swap. Không trích số swap từ log này; chỉ dùng cột `avail`.
4. **Điều kiện revert "sau khi đo" ĐÃ xảy ra — nhưng T8 KHÔNG quyết revert:** lượt yên #12 đo được 1 attempt hợp lệ với logger nới (loop 1–22, 21 wrap). Việc GIỮ hay REVERT fix 530e10a7 thuộc T3/parent (quyết parent đợt 134 §12.3(a) nói "revert sau khi có một lượt đo hợp lệ" — nay đã có lượt đo đó). **Cờ `round135-t8.done` KHÔNG có nghĩa "đã đo xong, được revert"** — T3/parent quyết dựa trên phân tích lượt #12, T8 chỉ ghi nhận điều kiện đã xảy ra.
5. **Reboot sau khi xong việc (F-135-T8-2):** reboot 78b55838 → bcc71e61 xảy ra sau khi retry 84l10 đã DONE + nhả lock (03:32:23Z); không ảnh hưởng kết quả harness nào. Chỉ lệnh giám sát của T8 bị giết (runtime restart, không final result) — đã khôi phục bằng đọc lại đĩa.
6. **Mâu thuẫn thời gian btime-vs-log (tiền lệ T4 đã ghi các đợt trước):** btime boot mới đọc qua /proc/1 ~03:35:31Z, trong khi retry còn chạy tới 03:32:23Z trên boot cũ — chỉ dùng khung quan sát trực tiếp (retry DONE 03:32:23Z, T8 kiểm lại 03:36:07Z], không khẳng định btime tuyệt đối.

## 8. Sai số mới (F-135-T8-N)

- **F-135-T8-1 — 84l10 kẹt W1-lần2 (pha kẹt MỚI):** sau W1-lần1 PASS 03:05:28Z, không có dòng W1-lần2 nào, im lặng ~886 s tới timeout kill 03:20:14Z (exit 124). RAM avail tụt 1437 → 349 MB trong lúc kẹt, loadavg ~0,1 (chờ, không bận). KHÔNG tái hiện ở retry 5 phút sau trên cùng boot (69 s, toàn bộ PASS) dù RAM lúc bắt đầu retry chỉ 652 MB. Ghi nhận để T3/T10 xem có cùng họ "đồng bộ treo" với 2 kẹt đợt 134 không; T8 không tự kết luận nguyên nhân.
- **F-135-T8-2 — reboot giết lệnh giám sát, không giết harness:** reboot ~03:32–03:35Z (78b55838 → bcc71e61) xảy ra SAU khi retry DONE; lệnh `sleep 480` giám sát của T8 bị gián đoạn (runtime restart, session proc_7cf4fc2bea03 không có final result xác nhận). T8 khôi phục bằng đọc trực tiếp đĩa (summary + log + lock release đều đủ); không chạy lại gì, không mất dữ liệu.
- **F-135-T8-3 — label "swap_used" sai (lặp lại từ đợt 128/134):** xem §7.3. Chỉ dùng cột `avail` trong `ram-135t8*.log`.
- **F-135-T8-4 — report l10 trên đĩa là của lần RETRY:** `l10-webkit-loop-w1-report.json` (35.172 B, ok=True, finishedAt 03:32:23Z) là của lần chạy retry — lần chạy 1 kẹt (ok=False, finishedAt 03:20:14Z) chỉ còn trong `smoke/run-webkit-84l10.log` + `smoke/attempt1/` snapshot. Khi trích số 84l10 phải nêu rõ lần nào; m4/n2 report không bị ghi đè (chỉ chạy 1 lần mỗi harness).

## 9. Nợ cho đợt sau / cần quyết parent

1. **GIỮ hay REVERT fix 530e10a7 (quyết T3/parent, T8 không tự quyết):** điều kiện revert "sau khi đo" nay ĐÃ xảy ra (lượt yên #12: 1 attempt hợp lệ, logger nới kiểm chứng runtime loop 1–22, 21 wrap). Nếu parent quyết revert thì đợt 136 phải đo lại từ đầu với cây 805409f0. **Cờ `round135-t8.done` KHÔNG có nghĩa "được revert".**
2. **Ba lần kẹt "treo không trả mẫu" ở ba pha khác nhau (85m4 P1-phaseA, 86n2 P4-lần2 đợt 134; 84l10 W1-lần2 đợt 135):** cần T3/T10 xem có phải cùng một nguyên nhân (bước đồng bộ/lấy mẫu treo khi RAM thấp / WebKitGTK treo) — cả 3 đều không tái hiện khi chạy lại, nên không có bằng chứng hồi quy xác định nào của cây.
3. **Reboot giữa/sau lượt vẫn tiếp diễn:** đợt 135 chỉ 1 reboot (sau khi xong việc) — ít hơn đợt 134 (5 giữa lượt + 1 trong phiên đóng), nhưng nhịp reboot chưa dừng. T8 đợt 136 vẫn phải chịu reboot (waiter đọc lại boot mỗi poll + backup log + retry trên boot mới nếu cần).
4. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #53 B vẫn mở tối đa 3 ẩn, mù #54 mới (T2 đợt 135); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round135-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, < 37.768 B. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật — fixture chỉ sống trong `/tmp`, rebuild lại sau mỗi reboot). Dữ liệu thô: `hidden_files/round135-t8/` (wait-t4-t5-135t8.sh — deadline gõ tay 03:45Z epoch 1794973500 đã kiểm chứng; run-webkit-135t8.sh; run-webkit-135t8-retry.sh — script retry chung KHÔNG dùng đợt này; run-webkit-135t8-retry84l10.sh — retry chỉ 84l10, timeout 900; rebuild-fixtures-135t8.sh; smoke/wait-t4-t5.log — GATE-FOUND poll 18; smoke/run-webkit-summary.txt — ec: 84l10=124 85m4=0 86n2=0; smoke/run-webkit-retry84l10-summary.txt — ec: 84l10-retry=0; smoke/run-webkit-{84l10,85m4,86n2}.log + attempt1/; smoke/run-webkit-84l10-retry.log + attempt2/; smoke/ram-135t8.log + ram-135t8-retry84l10.log; smoke/rebuild-fixtures.log; smoke/tree-md5-{open,before-run,final}.txt — đều 530e10a7; l10/m4/n2-scratch report JSON — cả 3 ok=True).

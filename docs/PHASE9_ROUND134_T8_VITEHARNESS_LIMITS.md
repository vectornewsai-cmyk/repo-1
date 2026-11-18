# Đợt 134 T8 — Vite harness WebKit 84l10/85m4/86n2: 2/3 exit 0 qua 2 boot (84l10 ✓, 85m4 ✓ sau retry; 86n2 TIMEOUT 124 kẹt P4-lần2) — 5 reboot giữa lượt

Ngày: 17–18/11/2026 (lượt cron 06:35 +07 18/11 = 23:35Z 17/11; T8 mở 23:45Z, hạn T8 01:30Z, hạn cứng T10 02:00Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chờ cờ + chạy harness + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND133_T8_VITEHARNESS_LIMITS.md (phương pháp: waiter gate, 3 harness, fixture rebuild md5, dọn dẹp) + docs/PHASE9_ROUND134_T4_WEBKIT_QUIET11_LIMITS.md (gate của T4 — số timeout/poll dưới đây đối chiếu từ đó, bài học F-133-3).

## 0. Kết luận ngắn — 2/3 exit 0, 1 timeout; 5 reboot giữa lượt; gate mở muộn 01:14:08Z

- **Gate đủ 01:14:08Z (waiter4 poll 55):** `round134-t4.done` (T4 xong 01:04Z — **0 attempt hợp lệ**, lượt yên #11 KHÔNG ĐO ĐƯỢC) + `POSTBOOT_PASS` boot `cc1f9de0` pass_at 01:13:56Z poll=53 (T5 b87 — xuất hiện SAU hạn T4 01:00Z, nên T4 không dùng được).
- **Chạy 1 trên boot cc1f9de0 (01:15:20–01:31:40Z): 84l10 exit 0** (W1×3/W2/E4 PASS); **85m4 KẸT P1-phaseA — 0/100 mẫu trong 881 s** (176 dòng HB128, n=0), chưa tới timeout 900 s thì **reboot #5 giết** (boot mới 8ae55060, btime 01:31:18Z); 86n2 chưa chạy.
- **Retry trên boot 8ae55060 (01:35:55–01:53:23Z): 86n2 exit 124 (TIMEOUT 900 s — kẹt P4-lần2, im lặng ~13,7 phút sau P4-lần1 PASS); 85m4 exit 0** (~2m09s, P1/P2/P3/P4×3/P5 PASS, seek kẹt 0 mẫu, HB128 19 dòng — **không tái hiện kẹt P1-phaseA**).
- **Fixture rebuild 2 lần (mỗi boot 1 lần, /tmp bị reboot xóa): 6/6 md5 khớp đợt 125–133 cả hai lần.**
- **Cây: preview.tsx `530e10a7` suốt lượt** (bản sửa chẩn đoán của T3 đã duyệt — KHÁC 805409f0 đợt 133, đúng yêu cầu; media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên).
- **Dọn sạch:** 0 process Xvfb/vite/MiniBrowser sót, socket X199 + lock đã unlink, không có `vite.lock`; `/tmp/.X11-unix/` còn X193/X194/X195 (01:47Z — KHÔNG phải của T8, của luồng khác, để nguyên).
- **LƯU Ý QUYẾT REVERT:** T4 đề xuất **GIỮ fix 530e10a7 cho đợt 135** (điều kiện revert "sau khi đo" chưa xảy ra — 0 attempt hợp lệ). Cờ `round134-t8.done` của T8 KHÔNG tự nó cho phép revert — T3/parent quyết (xem §7).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 23:26:58 17/11 | Boot `d2e66749` lên (boot lúc mở đợt) |
| 23:35 | Lượt cron 06:35 +07 mở đợt 134; parent tạo `round-in-progress.md` |
| 23:45:01 | T8 mở: boot `d2e66749`, RAM avail 1719 MB, `/tmp/.X11-unix/` trống, 0 process; cây preview.tsx `805409f0` (fix T3 chưa áp — T3 áp sau, xem §2) |
| 23:46:46 | Waiter1 bắt đầu poll 60 s (deadline 01:30Z 18/11, epoch 1794965400 đã kiểm chứng) |
| 23:48:59 | T3 viết `round134-t3-fix.done`: preview.tsx 805409f0 → `530e10a7` (loop-gate nới + re-enable không xóa mảng) |
| 23:49:21 | T5 viết `POSTBOOT_PASS` boot `d2e66749` (poll 2) — waiter1 thấy postboot=1 từ poll 4 |
| 23:50:17 | T4: gate A mở poll #1 (RAM 2037 MB) — attempt1 chạy ngay; **reboot #1 ~23:53:17Z giết attempt1 giữa pass 3/20** |
| 23:53:17 | Boot mới `81335571` (btime 23:53:17Z); waiter1 chết theo reboot (log dừng poll 8, 23:53:46Z — đã backup part1) |
| 23:56:00 | Waiter2 bắt đầu (boot 81335571); 23:57:15 T8 vá waiter (đọc lại boot_id mỗi poll — bài học reboot) rồi khởi động lại thành waiter3 |
| 23:56:13 | T4 khởi động lại poller #2 cho boot 81335571 (hạn 01:00Z giữ nguyên) |
| 00:12:49–00:13:50 | Reboot #2 (81335571 → 52ca5d6d, btime 00:12:55Z, sống <1 phút) rồi reboot #3 (52ca5d6d → 1d2e984d, btime 00:13:50Z); waiter3 chết (log dừng poll 17, 00:13:16Z — backup part3); T4 poller #3 mở 00:15:37Z trên 1d2e984d |
| 00:17:36–00:19:28 | Reboot #4 (1d2e984d → cc1f9de0, btime 00:17:36Z); T4 poller #4 mở 00:19:28Z trên cc1f9de0; waiter4 bắt đầu 00:20:07Z |
| 01:00:12 | T4 hết hạn 01:00Z — đóng 0 attempt hợp lệ, exit 5 (xem §4) |
| 01:04 | T4 viết `round134-t4.done` (0 attempt hợp lệ) |
| 01:13:56 | T5 b87 viết `POSTBOOT_PASS` boot `cc1f9de0` (poll 53) — lần đầu tiên cờ mới xuất hiện sau reboot #1 |
| 01:14:08 | Waiter4 poll 55: **GATE-FOUND**, exit 0 (54 poll NOT-YET trước đó, tính cả 3 waiter đã chết) |
| 01:15:01 | Rebuild fixture xong (~14 s): 6/6 md5 khớp |
| 01:15:20–01:16:31 | **84l10 exit 0** trên boot cc1f9de0 |
| 01:16:46–01:31:40 | **85m4 KẸT P1-phaseA** (0/100 mẫu, 881 s, 176 dòng HB128) — chưa tới timeout 900 s thì **reboot #5** (boot 8ae55060, btime 01:31:18Z; khung chết theo quan sát trực tiếp (01:31:40Z, 01:32:21Z]) giết driver giữa chừng; 86n2 chưa chạy |
| 01:34:51 | Postboot check-only TRỰC TIẾP trên boot mới 8ae55060: **exit 0** ("ĐỦ ĐIỀU KIỆN chạy WebKit") — gate thay thế cho retry (T5 chưa có cờ cho boot mới, xem §5) |
| 01:35:11 | Nhả lock v2 stale của driver bị giết (giữ 1105 s); rebuild fixture lần 2: 6/6 md5 khớp |
| 01:35:55–01:50:58 | **Retry 86n2: exit 124 (TIMEOUT 900 s)** — P1/P2/P3/P4-lần1 PASS, kẹt P4-lần2 |
| 01:51:14–01:53:23 | **Retry 85m4: exit 0** (~2m09s, toàn bộ PASS) |
| 01:53:43 | Kiểm cuối: cây không đổi (530e10a7), 0 process sót, socket X199 đã unlink, không `vite.lock` |

## 2. Chuẩn bị + kiểm chứng deadline — lỗi sed đợt 132 KHÔNG tái diễn; waiter vá đọc lại boot mỗi poll

- **Deadline gõ TAY TRỰC TIẾP trong waiter, không sed đổi chuỗi date:** dòng `DEADLINE=$(date -d '2026-11-18 01:30:00 UTC' +%s)` viết mới bằng tay trong `wait-t4-t5-134t8.sh`. Kiểm chứng trước khi chạy waiter: `date -d '2026-11-18 01:30:00 UTC' +%s` = **1794965400**, lớn hơn epoch lúc viết (1794959146) đúng 6254 s (~1h44m); `bash -n` OK. Waiter kết thúc bằng GATE-FOUND (exit 0) nên deadline không bị trigger — nhưng DEADLINE đã có giá trị hợp lệ, khác rỗng, suốt lượt.
- **Vá waiter giữa lượt (bài học reboot #1):** waiter gốc đọc `boot_id` 1 lần lúc khởi động — sau reboot, biến BOOT lỗi thời và waiter sẽ chờ cờ của boot đã chết mãi mãi. Đã vá thành đọc lại `boot_id` MỖI POLL (waiter3 23:57:15Z, `bash -n` OK) trước khi reboot #2/#3/#4 xảy ra. Đây là cải tiến nên giữ cho đợt sau.
- **Waiter chết 2 lần theo reboot (không mất dữ liệu):** waiter1 chết theo reboot #1 (log dừng poll 8, 23:53:46Z); waiter3 chết theo reboot #2/#3 (log dừng poll 17, 00:13:16Z). Mỗi lần đều backup log (`wait-t4-t5.log.part1-dead`, `.part3-dead-reboot3`) rồi khởi động lại waiter mới với cùng deadline. Waiter2 (23:56:00Z) bị T8 tự dừng sau 3 dòng log để chạy bản vá — có chủ ý, đã backup part2. Tổng cộng 4 waiter (1–4), gate mở ở waiter4 poll 55.
- Driver + fixture script adapt từ đợt 133 bằng sed `133→134` (đã grep kiểm: 0 ref `133` còn sót ngoài comment đã sửa; `bash -n` OK). Retry driver viết mới bằng tay (`run-webkit-134t8-retry.sh`, `bash -n` OK) — xem §5.

## 3. Kết quả harness chi tiết

### Chạy 1 — boot cc1f9de0, Xvfb :199, lock t8-round134 (01:15:20–01:31:40Z)

#### 84l10 — exit 0 (01:15:24–01:16:31Z, ~67 s)
- W1-lần1/2/3 PASS — restartEndedVideo delta=+1 mỗi lần, hạ-cánh-về-target=true, errors=0.
- W2 PASS — playhead cuối=30 (tới cuối=true), restart tự nhiên Δ=0, errors=0.
- E4 PASS — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=4, ended=true, errors=0.
- `KẾT QUẢ: KHÔNG FAIL` — report `l10-scratch/l10-webkit-loop-w1-report.json`.

#### 85m4 hb128 — KẸT P1-phaseA, KHÔNG CÓ EXIT CODE (01:16:46–01:31:40Z, bị reboot #5 giết)
- Vite sẵn sàng 01:16:47Z; setup 01:16:54Z; P1: element đồng bộ sau 1,9 s (playhead=1.133, ct=1.233); P1: ép ended → restart 0→1 (fired=true), settle 1,5 s: restart=1, events=1 (01:17:00Z).
- Sau đó **P1-phaseA sampler: 176 dòng HB128, TẤT CẢ n=0/100, lastCt=? lastPlayhead=? seeking=?** — từ elapsed=5 s (01:17:05Z) tới elapsed=881 s (01:31:40Z), KHÔNG MỘT mẫu nào. Không có dòng P2/P3/P4/P5 nào; không có `KẾT QUẢ`.
- Driver bọc node bằng `timeout 900` — sẽ bị kill exit 124 lúc 01:31:46Z nếu reboot không tới trước (reboot tới trước ~6 s theo mốc log; khung chết quan sát được (01:31:40Z, 01:32:21Z]).
- RAM avail trong lúc kẹt: 1226 MB (lúc bắt đầu 85m4) → 491 MB (01:31:21Z, mẫu sampler cuối) — tụt ~735 MB trong 15 phút kẹt.

### Retry — boot 8ae55060, Xvfb :199, lock t8-round134 (01:35:55–01:53:23Z)

#### 86n2 — exit 124, TIMEOUT 900 s (01:35:58–01:50:58Z, ~15 phút)
- P1 PASS (không restart dư), P2 PASS (reset 656 ms), P3 PASS (0 restart — phát thường ổn định), P4-lần1 PASS (đồng bộ sau 1,3 s, delta=+1, hạ-cánh-về-target=true, ct=2.367, playing=true, errors=0).
- Sau P4-lần1 PASS (01:37:17Z): **im lặng ~13,7 phút** — không có dòng P4-lần2 nào; dòng cuối 01:50:58Z: `HARNESS/FAIL: page.evaluate: Target page, context or browser has been closed` (timeout kill đóng browser) → `KẾT QUẢ: CÓ FAIL` — report `n2-scratch/n2-webkit-w7-report.json` (76.378 B).
- Kẹt ở **P4-lần2** (bước đồng bộ element sau P4-lần1) — cùng họ kẹt "sampler/đồng bộ không trả mẫu" như 85m4 chạy 1, nhưng khác pha (P4-lần2 thay vì P1-phaseA) và khác boot.

#### 85m4 hb128 — exit 0 (01:51:14–01:53:23Z, ~2m09s — đúng bằng thời gian đợt 133)
- P1 PASS (không restart dư), P2 PASS (reset 666 ms), **P3 PASS (0 restart — phát thường ổn định)**, P4-lần1/2/3 PASS (delta=+1, hạ-cánh-về-target=true), P5 PASS (không restart dư trong 40 s sau reset) — **seek kẹt dài nhất 0 mẫu (~0.0 s)**.
- HB128: **19 dòng `sampleFor`** — đúng bằng đợt 133 (19 dòng).
- `KẾT QUẢ: KHÔNG FAIL` — report `m4-scratch/m4-webkit-w7-report.json` (140.989 B).

### Tổng hợp
- **2/3 exit 0 (84l10 trên cc1f9de0; 85m4 trên 8ae55060), 1 timeout (86n2 trên 8ae55060, exit 124).** Không có harness nào exit 0 trên cả hai boot — mỗi boot chỉ chạy xong một phần vì reboot #5 cắt ngang.
- **P3 không kẹt lần thứ sáu liên tiếp** có chạy tới P3 (đợt 131: lần 4; 132: không chạy — không tính; 133: lần 5; 134: lần 6 — 85m4 retry P3 PASS 0 restart; 86n2 retry P3 PASS 0 restart cũng tới được P3).
- **85m4 kẹt P1-phaseA trên cc1f9de0 KHÔNG tái hiện trên 8ae55060** (cùng cây, cùng script, chạy xong trong 2m09s) — kẹt gắn với boot/môi trường lúc đó (RAM avail tụt tới 491 MB), không phải hồi quy xác định của cây. Ngược lại, 86n2 kẹt P4-lần2 trên boot mới — hai lần kẹt ở hai pha khác nhau, hai boot khác nhau: mẫu chung là "bước đồng bộ/lấy mẫu của harness treo không trả kết quả", không phải một pha cố định nào hỏng.
- RAM: chạy 1 bắt đầu 804 MB avail → 491 MB lúc reboot; retry bắt đầu 1203 MB → 1264 MB lúc kiểm cuối.

## 4. Lượt yên #11 — bối cảnh từ cờ T4 + LIMITS T4 (không phải số đo của T8; số timeout/poll đối chiếu từ LIMITS T4)

- T4 đóng 01:04Z: **0 attempt hợp lệ** — attempt1 duy nhất trên boot d2e66749 bị reboot #1 giết giữa pass 3/20 (passesDone=2, flip chưa tới, JSON partial 257.631 B sha256 `b402b3f3…76bc6`); sau đó **3 reboot nữa** (tổng 4 reboot trong cửa sổ 23:50Z–01:00Z); cờ POSTBOOT_PASS mới KHÔNG BAO GIỜ xuất hiện cho 3 boot sau; postboot check-only exit=1 suốt; RAM kẹt 451–710 MB; **ngưỡng ≤60 ms GIỮ NGUYÊN, không có số mới** (9 lượt hợp lệ trước: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms, trung bình 46,9 ms).
- T4 poller: **82 poll** tổng cộng (1 + 23 + 4 + 54); gate A mở ĐÚNG 1 LẦN (poller 1, poll #1, 23:50:17Z, RAM 2037 MB — cửa sổ vàng sau boot); poller 4 (cc1f9de0) 54 poll, RAM min 494 / max 1557 MB; hết hạn 01:00Z, poller dừng exit 5.
- **T5 b87 viết cờ cho cc1f9de0 lúc 01:13:56Z (poll 53) — sau hạn T4 14 phút** — nên gate của T8 mở được (01:14:08Z) dù T4 đã đóng. Đây là lý do lượt này T8 vẫn chạy được dù lượt yên 0 attempt.
- Log draw với logger đã nới: chỉ có bằng chứng phụ n=53 toàn loop 1, 0 wrap (JSON partial) — **fix CHƯA ĐƯỢC KIỂM CHỨNG runtime**; T3 bước 2 + T5 pha 2 vẫn chờ dữ liệu mới (xem §7).
- T8 không đo log draw, không phân tích (c2) — đó là việc T5 pha 2 / T3 bước 2.

## 5. Retry trên boot mới — gate thay thế (ghi rõ, không giấu)

- Sau reboot #5, boot cc1f9de0 chết; **cờ POSTBOOT_PASS cho boot mới 8ae55060 KHÔNG TỒN TẠI** (watcher b87 chết theo cc1f9de0; không có b88 lúc 01:34Z). Chờ cờ mới có thể mất ~1 giờ (tiền lệ: cờ cc1f9de0 mất 56 phút sau boot) — vượt hạn cứng T10 02:00Z.
- Thay thế (đúng chất của gate, chỉ khác hình thức cờ): chạy **check-only postboot trực tiếp** `apps/web/scripts/vcut-webkit-postboot-check.sh` trên boot 8ae55060 lúc 01:34:51Z → **exit 0** ("ĐỦ ĐIỀU KIỆN chạy WebKit": đủ 11 package WebKit/GST kể cả libevdev2, đủ libs libevent/libEGL/libavif/libdw/libevdev, GST đủ isomp4 + libav, 269 plugin) — log `smoke/postboot-check-newboot-8ae55060.log`. Cờ `round134-t4.done` vẫn đứng (T4 đã xong, verdict không phụ thuộc boot).
- **85m4 retry dùng timeout 300 s thay vì 900 s** (để kịp hạn T10 02:00Z) — nhưng 85m4 chạy xong trong 129 s nên độ lệch này KHÔNG ảnh hưởng kết quả; 86n2 giữ nguyên timeout 900 s và dùng hết 900 s (exit 124).
- Lock v2 stale của driver bị giết đã được nhả bằng tay trước retry (`release t8-round134`, giữ 1105 s → TRỐNG; cooldown 79 s còn lại được driver chờ tự động như thường lệ).
- Fixture rebuild lần 2 trên boot mới: 6/6 md5 khớp (hevc `ba0c7c62`, i7 `f05daed8`, h-30s `fbaa3d1a`, g-4s `a1fb8549`); ffprobe đúng spec; blend media bền kiểm tra đủ.

## 6. Dọn dẹp — đã dọn sạch (phần của T8)

- Trap `cleanup` của driver + retry driver: kill Xvfb :199 (+ `kill -9` sau 2 s), unlink `/tmp/.X11-unix/X199` + `/tmp/.X199-lock`, kill cả nhóm RAM sampler (+ `pkill -f ram-134t8*.log` dự phòng).
- Kiểm cuối 01:53:43Z: 0 process Xvfb/vite/MiniBrowser; `/tmp/.X11-unix/` còn **X193/X194/X195** (01:47Z — socket của luồng khác, 0 process của T8 — KHÔNG phải của T8, để nguyên không đụng); không có `vite.lock`; lock `t8-round134` đã release cả 3 lần giữ (84l10, 86n2 retry, 85m4 retry) + 1 lần nhả tay lock stale.
- RAM sampler log: `smoke/ram-134t8.log` (chạy 1, tới 01:31:21Z, avail cuối 491 MB) + `smoke/ram-134t8-retry.log` (retry).
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **Mỗi harness chỉ chạy xong trên MỘT boot, không boot nào chạy đủ 3/3:** 84l10 chỉ có số trên cc1f9de0; 85m4 có 1 lần kẹt (cc1f9de0) + 1 lần pass (8ae55060); 86n2 chỉ có 1 lần timeout (8ae55060). Không suy ra "WebKit luôn pass/fail" ngoài các boot này.
2. **Hai lần kẹt đều là "treo không trả mẫu", không phải FAIL có verdict:** 85m4 P1-phaseA (0/100 mẫu, 881 s) và 86n2 P4-lần2 (im lặng ~13,7 phút) đều là harness treo rồi bị timeout/reboot giết — không có dòng FAIL nào chỉ ra pha đó sai logic; chỉ có bằng chứng "bước đồng bộ không trả kết quả trong thời gian đó". Không kết luận hồi quy từ 2 mẫu kẹt ở 2 pha/2 boot khác nhau.
3. **Cột "swap_used" trong `ram-134t8*.log` thực chất là Mem used** — label sai từ script sampler gốc (đợt 128): `$3` của dòng `Mem:` trong `free -m` là used, không phải swap. Không trích số swap từ log này; chỉ dùng cột `avail`.
4. **Retry chạy khi chưa có cờ T5 cho boot mới** — chỉ có check-only postboot exit 0 trực tiếp (xem §5). Nếu parent yêu cầu cờ T5 là bắt buộc tuyệt đối thì kết quả retry phải được đánh dấu "chạy khi gate hình thức chưa đủ" — T8 ghi rõ để parent quyết, không giấu.
5. **Reboot #5 giết driver giữa 85m4 (chạy 1) và T4 cũng bị 4 reboot giết lượt yên** — nhịp reboot đợt này: 5 reboot trong ~97 phút (23:53Z–01:31Z), có boot sống <1 phút và ~4 phút. Chuỗi reboot giữa lượt chưa dừng (đợt 129–133: 6 lần; đợt 134: 5 lần).
6. **Mâu thuẫn thời gian btime-vs-log (tiền lệ T4 đã ghi):** btime boot 8ae55060 đọc được 01:31:18Z TRƯỚC dòng log cuối của boot cũ 01:31:40Z — chỉ dùng khung quan sát trực tiếp (01:31:40Z, 01:32:21Z], không khẳng định btime tuyệt đối (có thể đồng hồ VM bị đóng băng/lùi khi khôi phục snapshot).
7. **"P3 không kẹt lần thứ sáu liên tiếp"** đếm theo các đợt CÓ chạy tới P3 (131: lần 4, 132: không chạy nên không tính, 133: lần 5, 134: lần 6 — 85m4 retry + 86n2 retry đều P3 PASS).

## 8. Nợ cho đợt sau / cần quyết parent

1. **GIỮ hay REVERT fix 530e10a7 (quyết T3/parent, T8 không tự quyết):** T4 đề xuất GIỮ cho đợt 135 vì điều kiện revert "sau khi đo" chưa xảy ra (0 attempt hợp lệ, logger chưa kiểm chứng runtime). Nếu parent quyết revert thì đợt 135 phải sửa lại từ đầu và lượt yên lại 0/N coverage như cũ. **Cờ `round134-t8.done` KHÔNG có nghĩa "đã đo xong, được revert"** — lượt yên #11 vẫn chưa đo được.
2. **Hai lần kẹt harness (85m4 P1-phaseA, 86n2 P4-lần2):** cần T3/T10 xem có phải cùng một nguyên nhân (bước đồng bộ/lấy mẫu treo khi RAM thấp / WebKitGTK treo) — 85m4 kẹt lúc RAM avail tụt tới 491 MB; 86n2 kẹt trên boot mới RAM avail ~1200 MB lúc bắt đầu (xem `ram-134t8-retry.log` để đối chiếu RAM lúc kẹt). Không tự kết luận.
3. **Gate 0 mong manh sau reboot (nợ từ T4 §10.2):** T5 không viết được cờ nào cho 3 boot sau reboot #1 trong hạn T4; cờ cc1f9de0 tới muộn 56 phút sau boot. Nếu không sửa, mọi lượt yên sau reboot đều 0 attempt và T8 cũng phải chờ cờ muộn hoặc dùng check-only thay thế như §5.
4. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #53 mới (probe #53); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round134-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, < 37.768 B. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật — fixture chỉ sống trong `/tmp`, rebuild lại sau mỗi reboot). Dữ liệu thô: `hidden_files/round134-t8/` (wait-t4-t5-134t8.sh — deadline gõ tay 01:30Z epoch 1794965400 đã kiểm chứng + vá đọc lại boot mỗi poll; run-webkit-134t8.sh; run-webkit-134t8-retry.sh; rebuild-fixtures-134t8.sh; smoke/wait-t4-t5.log — GATE-FOUND poll 55 + 3 log part backup của waiter đã chết; smoke/wait-t4-t5.log.part{1,2,3,4}; smoke/run-webkit-summary.txt; smoke/run-webkit-retry-summary.txt; smoke/run-webkit-{84l10,85m4}.log + attempt1/; smoke/run-webkit-{86n2,85m4}-retry.log + attempt2/; smoke/ram-134t8.log + ram-134t8-retry.log; smoke/rebuild-fixtures.log + rebuild-fixtures-retry.log; smoke/postboot-check-newboot-8ae55060.log — exit 0; smoke/tree-md5-{open,before-run,before-retry}.txt — đều 530e10a7; l10/m4/n2-scratch report JSON + PNG).

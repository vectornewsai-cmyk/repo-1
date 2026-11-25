# Đợt 182 T8 — GATE KHÔNG MỞ TRÊN #100: HARNESS 0/6 KHÔNG ĐO ĐƯỢC; O8 KHÔNG CHẠY; REPLAY HOST DỪNG

Ngày: 24/11/2026 (lượt cron 09:35 +07 = 02:35:51Z; T8 mở ~02:51Z, đóng ~04:35Z — TRONG hạn cờ ~05:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness hb128+B1 live trên boot hiện tại; (2) O8 trên boot đo; (3) F-181-T8-3 (sửa extract) + F-181-T8-1 (X193); (4) (c')/(f') + checklist (o); (5) H3 thụ động. KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). KHÔNG chạy đối chứng chuẩn cũ (hb128 là chuẩn). **Kết quả: KHÔNG ĐO ĐƯỢC — reboot #100 giữa phiên + replay host dừng + thiếu 3 lib hệ thống.**
Nợ: LIMITS T8-181 (34.804 B); GAP §11 + §12.3 đợt 181 (parent CHẤP NHẬN (a)–(r); chuỗi FULL PASS LÊN 1; (c')/(f') ĐƯỢC GIỮ; B1 live xong — B2 VẪN HOÃN; F-178-T8-6 DỪNG; H3 chỉ giám sát thụ động; harness sạch 6/6 trên #98; 86n2-P1 KHÔNG kẹt lần thứ sáu liên tiếp; script 86n2-hb128 41.785 B VƯỢT giới hạn push).

## 0. Kết luận ngắn — 0/6 KHÔNG ĐO ĐƯỢC; O8 KHÔNG CHẠY; CHUỖI FULL PASS GIỮ 1 (PARENT QUYẾT)

- **#99 XÁC NHẬN 9 nguồn (T0-182)** — boot `9897d4b4`, btime 01:11:46Z, gap #98→#99 = 7.163 s. Marker sống qua **51 reboot #49–#99**. **#100 CHƯA XÁC MINH SỐ HIỆU** (xảy ra sau khi T0-182 đóng cờ 03:05Z — thuộc T0-183).
- **REBOOT #100 GIỮA PHIÊN (F-182-T8-1): boot `7a83ab15`, btime 03:09:07Z, gap #99→#100 = 7.041 s.** Giết waiter-1 của T8, poller T4 instance 1, watcher-182. T4 khởi động lại poller instance 2 lúc 03:12:41Z; T8 khởi động lại waiter lúc 03:10:46Z. **0 reboot thêm tới lúc đóng (04:31Z).**
- **REPLAY HOST DỪNG (F-182-T8-2): os-intent replay chạy apt-get update 03:09–03:12Z, cài tới dpkg 309 dòng (dòng cuối 03:20:44Z, gstreamer1.0-tools) rồi DỪNG HẲN** — 0 tiến trình apt/dpkg từ đó tới 04:31Z, dpkg.log không đổi 71 phút. **POSTBOOT_PASS #100 CHƯA CÓ** (watcher-182 chết theo #100; T5-182 đã đóng cờ 03:01Z nên không ai repair tiếp). **POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z** (replay-đầy-đủ, poll=0, **KHÔNG caveat** — T5-182).
- **HARNESS 0/6 KHÔNG ĐO ĐƯỢC (KHÔNG PHẢI KẸT, KHÔNG PHẢI FAIL SẢN PHẨM): WebKitWebProcess thiếu 3 lib hệ thống trên #100 — `libavif.so.16`, `libEGL.so.1`, `libevdev.so.2` (ldd 04:12Z, kể cả với đường dẫn lib bundled của Playwright).** GST .so hệ thống = **2** (so với 269 trên #99); libavif + libevdev VẮNG; chỉ có `libEGL_mesa.so.0` (không có `libEGL.so.1`). **T8 KHÔNG chạy harness** — chạy 6 pha chỉ cho 6 lỗi launch, không đo được gì, lại tốn RAM lúc balloon ghim trần. **Kẹt harness cộng dồn GIỮ 25** (0 kẹt mới — vì 0 pha chạy được). **86n2-P1: KHÔNG ĐO ĐƯỢC — chuỗi "không kẹt lần thứ sáu liên tiếp" (176–181) GIỮ NGUYÊN, không tăng lên 7, không đứt — parent quyết.**
- **O8 T8 KHÔNG CHẠY trên #100.** Lý do đủ: (i) không có gate (a) cho #100 + T4 0 attempt → không thành chân FULL PASS dù PASS; (ii) RAM lúc hết hạn waiter chỉ **429–485 MB**, balloon **ghim đúng trần 6.443.824 kB** — chạy vite + 3 browser có nguy cơ OOM làm phiền luồng khác. DEBROOT vẫn đủ cả 3 lib thiếu (348 file, GST 269, có libavif/libEGL.so.1/libevdev) nên O8 qua DEBROOT về lý thuyết chạy được — **nợ lại đợt 183 nếu boot được repair**. **O8 T0 trên #99 PASS 3/3** (WebKit 21/21 ×2 md5 `3b01e872`/`2902fd98` + Chromium 21/21 `6603aa27`, sau POSTBOOT #99 89 s — theo cờ T0-182).
- **T4-182 ĐÓNG 04:30Z VỚI 0 ATTEMPT** (không có cờ `.done`; chain log: "HET HAN CHO 04:30Z — 0 attempt"; poll cuối #103: gate0 khong-dat + RAM 516 MB < 1024). **Lượt yên #51 KHÔNG CÓ — chuỗi lượt yên hợp lệ GIỮ 44** (không tăng — parent quyết). **Chuỗi WebKit FULL PASS GIỮ 1 (đề xuất, parent quyết):** đợt 182 không thêm chân nào (chân trên #99: chỉ O8 T0 + gate (a) #99; chân trên #100: 0).
- **Waiter: GATE NOT MET sau 95 poll** (waiter-1: 14 poll trên #99, 02:55–03:08Z; waiter-2: 81 poll trên #100, 03:10–04:30Z; deadline 04:30Z, exit 3). **T4 0 attempt nên thủ tục quyết (i) đợt 143 cho phép chạy harness sau hết hạn — T8 KHÔNG áp dụng vì lib thiếu (F-182-T8-3), ghi rõ lý do.**
- **Plan B B1: 0 dòng HB mới — VÌ KHÔNG CÓ LOG HARNESS MỚI (không kiểm live được đợt này).** B1 vẫn là bản 181 (85m4-hb128 md5 `2f707749`, 86n2-hb128 `c90e0853`, không đổi). **B2 VẪN HOÃN.** (c')/(f') V1: replay C5.1 **ĐẠT** (kẹt-164 TRIGGER @125 s, kẹt-178 TRIGGER, 0 FP; 182 đóng góp 0 log mới — xem §C). **(c') + (f') ĐƯỢC GIỮ (đề xuất).**
- **F-181-T8-3: ĐÃ SỬA** (extract dùng `run-webkit-86n2-hb128.log` + phase `86n2-hb128` + thêm md5 script hb128; **CHƯA KIỂM LIVE** — không có log mới; kiểm live hoãn sang 183). **F-181-T8-1: ĐÃ HẾT — X193 biến mất theo reboot #99** (/tmp wipe; X11 trống lúc mở 02:55Z và lúc đóng 04:31Z; không còn gì để dọn hay giữ).
- **H3: CHỈ GIÁM SÁT THỤ ĐỘNG — 0 kẹt mới (0 pha chạy); KHÔNG mở điều tra.** Watchdog (i): 0 dòng (0 pha); live-diag (1b): 0; (1c'): 0. **0 snapshot stall mới.** Fixture /tmp MẤT theo #99 + #100 (chưa rebuild — không có harness để dùng; rebuild hoãn sang 183 sau gate).
- **Boot lúc đóng cờ: `7a83ab15` (#100 ứng viên).** T7/T9 CHƯA đóng cờ lúc T8 đóng (04:31Z). **0 process sót; lock vite TRỐNG; X11 trống.**

## 1. Dòng thời gian (gọn)

- 01:11:46Z **REBOOT #99** (trước phiên T8; T0-182 XÁC MINH 9 nguồn). 02:35:51Z Đợt 182 mở. 02:51–02:55Z T8 mở: đọc LIMITS T8-181 + GAP §11 + quyết §12.3; cây + 7 script KHỚP md5 đợt 181; copy driver 181→182 + đổi nhãn (waiter deadline → 04:30Z, LIVE-DIAG/FRESH-CONTENT → 182, T8-182); **sửa extract F-181-T8-3**; sửa replay giữ entry 181-sach + thêm entry 182-sach; **cả hai symlink diag → round182-t8 lúc ~02:54Z**; **probe S1 CÓ SẴN trong copy** (md5 `453d1082`, giống hệt 175–178 — F-180-T8-5 vẫn khép); selfcheck #1: libs 6/6, GST **1.624 plugin**, dpkg 1.468 (trên #99 — boot còn lành lúc mở); fixture /tmp VẮNG (đã wipe theo #99 — chưa rebuild vì chờ gate); **mở: 0 process sót, X11 TRỐNG (X193 đã mất — F-181-T8-1 hết), lock trống.**
- 02:55:07Z **POSTBOOT_PASS #99 ĐÃ CÓ** (T5-182: replay-đầy-đủ, poll=0, KHÔNG caveat, dpkg 1.468, cache 174, lists 37). 02:55:44Z Waiter-1 bắt đầu (deadline 04:30Z); postboot=1 (đường a, #99) nhưng t4=0 suốt. T0-182 O8 trên #99 PASS 3/3 (02:56–03:00Z, theo cờ T0-182). T4 poll #1–#20 trên #99, chưa attempt.
- **03:09:07Z REBOOT #100** (boot `7a83ab15`, gap 7.041 s) — giết waiter-1 (sau poll 14), poller T4 instance 1 (sau poll #20 03:09:29Z — mốc giờ mang dấu clock-fast, xem F-182-T0-2), watcher-182 pid 236906. 03:09–03:12Z replay host chạy apt-get update; 03:10:46Z T8 khởi động lại waiter-2; 03:12:41Z T4 khởi động lại poller instance 2. dpkg 2 → 309 (tới 03:20:44Z) rồi **dừng hẳn**.
- 03:14–04:30Z T4 gate0wait trên #100 (poll #3–#103): gate0=khong-dat suốt (postboot_exit=1), RAM dao động 444–2.097 MB (nhiều poll < 1.024 MB), dpkg GIỮ 309. 04:12Z T8 kiểm ldd: WebKitWebProcess thiếu 3 lib (F-182-T8-3). 04:30:50Z **WAIT-DEADLINE poll=81 — GATE NOT MET** (waiter-2 exit 3). 04:30Z T4 đóng với 0 attempt. 04:31–04:35Z T8 kiểm cuối + replay + viết LIMITS + paths + cờ.

## A. O8 — KHÔNG CHẠY (T8); O8 T0 TRÊN #99 PASS 3/3 (THEO CỜ T0-182)

| # | Pha | Kết quả |
|---|---|---|
| — | O8 T8 WebKit attempt1/2 + Chromium trên #100 | **KHÔNG CHẠY** — không gate (a) #100 + T4 0 attempt + RAM 429–485 MB lúc hết hạn (balloon ghim trần) |
| 1 | O8 T0 WebKit attempt1 trên #99 | **21/21 PASS** — md5 `3b01e872`, S1 02:56:57Z |
| 2 | O8 T0 WebKit attempt2 trên #99 | **21/21 PASS** — md5 `2902fd98`, S1 02:58:30Z |
| 3 | O8 T0 Chromium trên #99 | **21/21 PASS** — md5 `6603aa27`, S1 03:00:18Z |

- O8 T0 chạy sau POSTBOOT_PASS #99 02:55:07Z (89 s), JSON đếm lại bằng python (21 results / 21 ok=true cả 3 bộ — theo cờ T0-182; T8 không kiểm lại JSON gốc). Probe S1 của T8 không chạy (O8 T8 không chạy; file probe đã có sẵn md5 `453d1082`).
- **Gate cho boot đo `7a83ab15` (#100): (a) KHÔNG CÓ — POSTBOOT_PASS #100 chưa có (replay dừng, watcher chết, T5-182 đã đóng).** Vì vậy O8 T8 dù chạy cũng không thành chân FULL PASS. **Chuỗi FULL PASS GIỮ 1 (đề xuất, parent/T10 quyết).**

## 2. Kết quả harness — 0/6 KHÔNG ĐO ĐƯỢC (LIB THIẾU, KHÔNG PHẢI KẸT)

| # | Pha | Exit | Kết quả |
|---|---|---|---|
| 1–3 | WebKit 84l10 / 85m4 / 86n2-hb128 | — | **KHÔNG CHẠY** — WebKitWebProcess thiếu libavif.so.16 + libEGL.so.1 + libevdev.so.2 |
| 4–6 | Chromium 84l10 / 85m4 / 86n2-hb128 | — | **KHÔNG CHẠY** — cùng gate chưa mở; fixture /tmp đã mất theo #99/#100 |

- Bằng chứng thiếu lib (04:12Z, `ldd` với cả đường dẫn lib bundled của Playwright): `WebKitWebProcess` → `libavif.so.16 => not found`, `libEGL.so.1 => not found`, `libevdev.so.2 => not found`. Hệ thống chỉ có `libEGL_mesa.so.0` (không có `libEGL.so.1`); GST .so = 2. **MiniBrowser ldd 0 not-found (binary chính không link trực tiếp 3 lib này — web process mới là nơi thiếu).**
- Đối chứng DEBROOT: `~/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/` đủ cả 3 (libavif.so.16, libEGL.so.1, libevdev.so.2; 348 file; GST 269 .so) — O8 qua DEBROOT về lý thuyết chạy được; **không dùng DEBROOT cho harness** (harness đo system libs theo thiết kế; đổi sang DEBROOT sẽ phá ý nghĩa đo — xem §7.3 đợt 181).
- **Kẹt harness cộng dồn GIỮ 25** (0 kẹt mới — 0 pha chạy). 84l10 PASS 3 đợt liên tiếp (179–181) GIỮ NGUYÊN (không tăng); 86n2-P1 "không kẹt lần thứ sáu liên tiếp" GIỮ NGUYÊN (không tăng lên 7 — parent quyết).
- **Đối chứng Chromium cùng pha: KHÔNG CHẠY đợt này** (cùng gate; fixture /tmp mất). N cộng dồn GIỮ N=43 mỗi pha.
- **B1 live: 0 dòng HB mới — VÌ KHÔNG CÓ LOG HARNESS MỚI.** Script B1 không đổi (85m4-hb128 37.700 B — DƯỚI giới hạn push 37.768 B, chỉ dư 68 B; 86n2-hb128 41.785 B — VƯỢT, cần ENABLE_PRIVSEP=0). **B2 VẪN HOÃN** (chưa có kẹt thật cho B1 bắt; B1 mới live sạch 1 đợt).

## 3. Watchdog + 4 bước kiểm — 0 DÒNG (0 PHA CHẠY) + REPLAY C5.1 ĐẠT

- **Watchdog (i): 0 dòng (0 pha). Live-diag (1b): 0. (1c')/(f') V1: 0 kích hoạt live (0 pha); replay C5.1 ĐẠT (§C). (c') + (f') ĐƯỢC GIỮ (đề xuất).**
- 0 snapshot stall mới trong round182-t8/smoke/ — 4 thư mục stall hiện có đều của 180 (mtime 23:55Z 23/11). Cả hai symlink diag cập nhật → round182-t8 lúc ~02:54Z, TRƯỚC khi waiter-2 chạy (F-178-T8-8 — checklist copy driver gồm cả hai symlink, 4 đợt liên tiếp).
- **(1)** Watchdog chẩn đoán trong 3 script (VÁ 142, GIỮ NGUYÊN 143–182) + `t8-diag-stall.sh` → 182 (cả hai symlink — §5). 0 harness + 0 O8 T8 → **0 dòng, 0 FP — ĐÚNG (không có gì để chẩn đoán).** **(1b)** live_diags=0 cả 0 pha. **(1c')** helper check-fresh + khối FRESH-CONTENT trong `run_one`: **0 kích hoạt live (0 pha); replay C5.1 ĐẠT (§C).**
- **(2)** Cột Balloon vào RAM sampler: **KHÔNG CÓ sampler đợt này** (sampler chạy trong run-webkit, không chạy) — thay bằng các điểm đo trực tiếp: Balloon **6.443.824 kB = ĐÚNG TRẦN (100%)** lúc 04:11Z + 04:31Z (ghim trần); avail dao động **429–2.097 MB** trong phiên (điểm thấp 429 MB lúc 04:31Z; cao 2.097 MB lúc 03:40Z). Giao T9 đối chiếu sampler (T9-182 chưa đóng cờ lúc T8 đóng).
- **(3)** Đối chứng Chromium cùng pha: **KHÔNG CHẠY** — xem §2. **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **0 lần kẹt → 0 snapshot (đúng).**

# §C — (1c')/(f') V1: REPLAY C5.1 ĐẠT (182 ĐÓNG GÓP 0 LOG MỚI); B1 KHÔNG KIỂM LIVE ĐƯỢC

## C1. Thiết kế (c') + (f') V1 (triển khai đợt 173, giữ nguyên đợt 174–182, không đổi code)

- **(c'):** trailing run HB128 **cùng tag + cùng playhead + cùng ct**, kích hoạt khi span ≥ 120 s VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi sub-run `paused=true + seeking=true` đã ≥300 s. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3 **+ 86n2-hb128 từ đợt 180 + resetPlayhead0 từ đợt 181 (B1)**. V2 (f'') giữ làm dự phòng, KHÔNG triển khai.
## C2. B1 — KHÔNG KIỂM LIVE ĐƯỢC ĐỢT NÀY (0 log harness mới)

- Script B1 không đổi so với 181 (85m4-hb128 md5 `2f707749`; 86n2-hb128 `c90e0853`). **Kiểm offline 181 vẫn đứng** (treo 120 s TRIGGER @120 s; treo 60 s OK; ca last=null TRIGGER). **Kiểm live 182: KHÔNG CÓ** (0 pha harness). B1 live sạch mới 1 đợt (181) — chưa đủ 2–3 đợt để mở B2. **B2 VẪN HOÃN; B3 KHÔNG DÙNG.**
## C3. Replay sau hết hạn waiter (replay-1c-182t8.py + replay-f-fix-182t8.py, ~04:32Z)

- **(c') V1 (f-fix): kẹt-164 TRIGGER @125 s; kẹt-178 TRIGGER @125 s (TRUE POSITIVE); kẹt-179 KHÔNG ở mọi variant — C5.1 ĐẠT** (0 FP trên các log sạch trong danh sách replay; **182-sach-85m4 + 182-sach-86n2-hb128 KHÔNG CÓ FILE** — 182 đóng góp 0 log mới, không làm tăng mẫu FP). **(c') + (f') ĐƯỢC GIỮ (đề xuất).**
- **(f') V1-300: ĐẠT** — kẹt-164 TRIGGER @125 s; kẹt-171 TRIGGER @305 s (V1-300); V1-180: 164@125 s (kẹt-171 KHÔNG); V1-600: cả hai; V2: cả hai. (c') hiện tại KHÔNG ĐẠT (lỡ kẹt-171 — đã biết từ trước, không đổi).
- **F-182-T8-4 (đếm log sạch — giao T10 đối chiếu):** output replay đợt này liệt kê 16 entry KHÔNG (13 log 163/165–177 + 180-sach-85m4 + 181-sach-85m4 + 181-sach-86n2-hb128) trong khi LIMITS 181 ghi "15 log sạch thật". Chênh 1 — có thể do cách đếm "163/165–177" (12 hay 13) ở các đợt trước. **Không đổi verdict C5.1 (cả hai cách đều 0 FP).**
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 11 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, KHÔNG KIỂM LẠI ĐƯỢC ĐỢT NÀY)

## D1. Phạm vi (parent chốt đợt 171, giữ nguyên tới đợt 182): 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; cùng script `baaa13c0`) + ca 178 W2-setup :443. KHÔNG gộp 85m4-P4 / 86n2-P4-lần3. 86n2-P1 (đợt 175) theo dõi riêng — **KHÔNG ĐO ĐƯỢC đợt này (chuỗi 6 lần không kẹt GIỮ NGUYÊN — parent quyết).**

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 182: KHÔNG CÓ (0 pha 84l10)

- **Không FP từ Q3 đợt này** (không có log 84l10 mới). **Hồ sơ 4 điểm kẹt 84l10 giữ nguyên:** 157 E4 :457; 170 W2 :433; 171 W2-setup :425; **178 W2-setup :443**. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180) — xem §F.**
- **Chuỗi 84l10 PASS: GIỮ 3 đợt (179–181)** (không tăng — 182 không đo). Tần suất kẹt 84l10: 4 ca / 25 đợt (157–181) ≈ 16% (không đổi — 182 không đo).
## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — không có ca kẹt mới đợt này để đối chiếu.
- **Q2 — Lib hệ thống hay engine?** **THU HẸP THÊM (mới đợt này):** WebKitWebProcess thiếu đúng 3 lib hệ thống trên #100 (libavif/libEGL/libevdev) trong khi DEBROOT đủ cả 3 và Chromium không đo — **bằng chứng trực tiếp rằng kẹt/launch-fail WebKit có thể do lib hệ thống, không phải do engine** (khi lib thiếu thì WebKit không khởi động được chút nào).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KHÔNG KIỂM LẠI ĐỢT NÀY (0 pha).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — chỉ tương quan thời điểm.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 25 đợt).
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 182 (0 KẸT MỚI VÌ 0 PHA CHẠY; KHÔNG MỞ ĐIỀU TRA)

## B1. Trạng thái giả thuyết sau đợt 182 (H3 ỦNG HỘ — đứng nguyên, không bằng chứng mới)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — avail xuống tới 429 MB lúc đóng nhưng 0 pha chạy nên không có kẹt để đối chiếu; Chromium cũng không chạy.
- **H2 "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (đứng nguyên)** — balloon ghim đúng trần lúc 04:11Z + 04:31Z nhưng 0 kẹt.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ (đứng nguyên)** — không có ca kẹt mới; bằng chứng mới nhất vẫn là kẹt ngoài harness đợt 180. **BỔ SUNG đợt này (Q2): WebKit không khởi động được khi thiếu lib hệ thống — launch-fail khác kẹt-treo, không tính vào H3.**
- **H3-D1 "Process WebKit bị kẹt tự ăn thêm RAM/CPU": BÁC BỎ (đứng nguyên; 0 process WebKit nào chạy đợt này).**
- Đợt 182 T8 chỉ giám sát thụ động H3: **0 kẹt trong 0 lần chạy harness WebKit + 0 kẹt trong 0 lần chạy O8 T8** (O8 T0 trên #99 PASS 3/3 — theo cờ T0-182) + **0 kẹt Chromium**. Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 không đo được đợt này.** H3 vẫn chỉ giám sát thụ động.
## B3. Chữ ký kẹt — đợt 182: 0 KẸT (0 pha chạy; đối chiếu đợt 181: 0 kẹt; đợt 180: 1 kẹt ngoài harness, exit 124, 901 s, probe TIMEOUT; đợt 179: 1 kẹt exit 124, 903 s, probe TIMEOUT).
# §E — CHECKLIST (o) ĐỢT 182 (quyết (o) đợt 180 + các F-181 còn lại — 21/21, 0 mục bỏ sót)

- o1. F-181-T0-4 (gap #97→#98 = 576 s, nguyên nhân chưa xác định) — **GHI NHẬN**; gap mới #99→#100 = 7.041 s (trở lại mẫu ~2h — T0-183 xác minh số hiệu #100).
- o2. Run 181 TIMEOUT + run 182 (T7-182) — **GHI NHẬN**; run 181 TIMEOUT 02:43:21Z (margin −231 s started-gốc / −450 s sched; claimed→finished 163 s; viết lại ×1 — 4 timeout liên tiếp lần đầu, theo cờ T0-182); run 182 jitter +450 s, RUNNING lúc T0 đóng (boot_gen 7e85b461, #99) — kết cục thuộc T7-182 (chưa đóng cờ lúc T8 đóng).
- o3. F-181-T1-1 (aggregate 180 "quét 1.335 file" → 1.336) — **ĐÃ DUYỆT SỬA (quyết (p) đợt 181)**; T1-182 sửa + stage batch đợt 182 (T1-182 đã đóng cờ).
- o4. F-179-T1-4 (RAM dao động) — **GHI NHẬN**; avail 429–2.097 MB trong phiên T8; balloon ghim trần 2 điểm (thuộc T9).
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — **GHI NHẬN**; T4 0 attempt đợt này (không có gì để check — thuộc T4-182/T10-182).
- o6. F-181-T4-3 (X193) — **ĐÃ HẾT (F-181-T8-1, xem §8)**; socket biến mất theo reboot #99; X11 trống lúc mở + lúc đóng.
- o7. F-181-T5-1 (watcher overlap mẫu 13) + F-182-T5-1 (watcher-181 chết theo #99, poll cuối +22 s, mẫu 14) — **GHI NHẬN**; watcher-182 pid 236906 chết theo #100 (thuộc T5-182/T10-182 — T5-182 đã đóng cờ 03:01Z, trước #100).
- o8. F-181-T5-2 (ledger ts) — **GHI NHẬN** (thuộc T5-182 — đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — **GHI NHẬN** (F-175-T5-3 VẪN ĐÓNG); thêm F-182-T0-2 (/proc/1 #99 +16,118 s — boot chậm lên userspace ~5 s, không phải lệch đồng hồ — theo cờ T0-182).
- o10. F-174-T5-6 KHÔNG áp dụng — **GHI NHẬN** (#99 replay-đầy-đủ, poll=0 — F-182-T8-2; #100 KHÔNG CÓ POSTBOOT — replay dừng).
- o11. F-181-T6-1 (chồng pha) — **GHI NHẬN**; T8 KHÔNG chạy pha nào nên 0 chồng. **T6-182 ĐÃ ĐÓNG (03:14Z): (A) 120/120 lần 32; #99 KHÔNG GIẾT HOLDER (chuỗi mới = 4 nếu parent tính tiếp); #100 ứng viên KHÔNG GIẾT HOLDER theo log (F-182-T6-8); prune 57 (xóa 3 file, queue 103→100).**
- o12. F-180-T6-4 (mâu thuẫn poll=0) — **GHI NHẬN** (thuộc T6-182 — đã đóng cờ).
- o13. F-180-T6-5 (watcher chưa chạy lúc snapshot) — **GHI NHẬN** (thuộc T6-182 — đã đóng cờ).
- o14. F-181-T7-1 (sleep bị SIGTERM) — **GHI NHẬN**; T7-182 chưa đóng cờ lúc T8 đóng (run 182 viết lại ×1 tại #99; viết lại tại #100 chưa rõ — thuộc T7-182).
- o15. F-180-T7-4 (lỗi nhãn T0-176/T0-177) — **GHI NHẬN** (thuộc T7; F-178-T7-4 ĐÃ LÀM RÕ).
- o16. F-180-T7-5 (tuổi run cộng thừa 600 s) — **GHI NHẬN** (thuộc T7-182 — chưa đóng cờ).
- o17. F-181-T8-1..6 — **ĐÃ THỰC HIỆN** (xem §8; F-181-T8-1 ở o6; F-181-T8-3 ở §5; F-181-T8-2 (B1) ở §C2; F-181-T8-4 ở §5; F-181-T8-5 ở §A; F-181-T8-6 ở §5).
- o18. Quyết (o) 181 (cửa slot LÀNH lần 7; HB 47/484, DR 53/314) — **GHI NHẬN**; số mới thuộc T7-182 (chưa đóng cờ).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — **ĐÃ THỰC HIỆN:** marker 51 reboot (#49–#99 đã xác nhận); T8 đóng ~04:35Z, TRONG hạn cờ ~05:00Z.
- o20. Quyết (j) 181 (B1 live xong; B2 VẪN HOÃN; F-178-T8-6 DỪNG; H3 giám sát) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B)** — B1 không kiểm live được đợt này (0 pha).
- o21. F-181-T0-2 (delta ≥29 s trước #97) + F-182-T0-2 (xem o9) + F-181-T9-3 (sampler cuối #98 muộn hơn btime #99 7 s) — **GHI NHẬN** (thuộc T0-183: F-182-T9-3 nếu có — sampler cuối #99 muộn hơn btime #100 bao nhiêu — T9-182 chưa đóng cờ).
# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 182 — theo quyết parent (j) đợt 180: DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 đợt 181 `3d41b015` — không kiểm lại đợt này vì không chạy; script diag `run-diag-84l10-w2setup-182t8.sh` đã đổi nhãn, không chạy).
- **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy đợt này** (không thuộc nhiệm vụ đợt 182; hb128 là chuẩn; không có gate để chạy). **Không có verdict đối chứng mới.**
- **Chi phí B1:** không đổi so với 181 (85m4-hb128 37.700 B — DƯỚI giới hạn push, chỉ dư 68 B; 86n2-hb128 41.785 B, oversize như trước — cần ENABLE_PRIVSEP=0). Run sạch: không có log mới (B1), 0 FP, 0 ảnh hưởng verdict.

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` **2f707749 (B1, không đổi)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` c90e0853 (B1, không đổi)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e. Tất cả không đổi so với đợt 181 — **T8 thêm 0 file repo đợt này ngoài LIMITS này.**
- **T8 thêm 1 file repo đợt này: LIMITS này.** Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round182-t8/`**.
- Extract: waiter-1 (14 poll, boot #99) + waiter-2 (81 poll, boot #100, WAIT-DEADLINE 04:30Z, exit 3); **1 REBOOT trong phiên T8** (#100, 03:09:07Z — waiter-1 chết, đã lưu log thành `wait-t4-t5-boot9897d4b4.log` rồi khởi động lại waiter-2 03:10:46Z).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** Cả hai symlink (`goals/.../t8-diag-stall.sh` + `apps/web/scripts/t8-diag-stall.sh`) cập nhật → round182-t8 lúc **~02:54Z, TRƯỚC waiter-2** → 0 dump stall mới (đúng — 0 pha chạy). Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink (đã làm 4 đợt liên tiếp).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-182t8.mjs` có mặt sau `cp -r` 181→182 (md5 `453d1082` giống hệt 175–178; `node --check` PASS). O8 T8 không chạy nên probe không chạy — chỉ dự phòng.
- **F-181-T8-3 (extract hardcode): ĐÃ SỬA — XEM §8.** **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN.** `run-pilot-chromiumonly-182t8.sh` trỏ đúng round182-t8 (kiểm bằng grep sau copy — sửa 181 vẫn giữ). Script không chạy đợt này.
- **F-181-T8-5 (POSTBOOT #99 cùng profile #96 — repair, caveat): KHÔNG ĐÚNG CHO #99.** #99 là **replay-đầy-đủ, poll=0, KHÔNG caveat** (dpkg 1.468, tools ĐÃ CÀI, GST 269 thư mục thật — theo cờ T5-182 + selfcheck #1 của T8: GST 1.624 plugin). #100 mới là boot thiếu lib (F-182-T8-2/-T8-3).
- **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN TRÊN #99** (selfcheck #1: gst-inspect CÓ, 1.624 plugin). **Trên #100 gst-inspect CÓ nhưng GST .so hệ thống chỉ còn 2** — ghi rõ để không ai trích "GST 2" thành "thiếu plugin do tools chưa cài" (tools có, lib hệ thống bị wipe theo reboot + replay dở dang).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 không chạy (không acquire lock); harness không chạy (không acquire lock). **Không lock stale nào** (vite TRỐNG, 0 ticket + 100 cooldown lúc đóng).
- Kiểm cuối ~04:31Z (trên #100): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG (0 file — X193 đã mất theo #99, không tái xuất trên #100).
- Fixture /tmp: **MẤT theo #99 + #100 (chưa rebuild — không có harness để dùng)**. Rebuild hoãn sang đợt 183 (sau gate — KHÔNG rebuild trong cửa sổ attempt của T4; đợt này T4 0 attempt nhưng rebuild cũng vô nghĩa vì không có gate/lib).
- **Reboot #100 (boot `7a83ab15`, btime 03:09:07Z, gap #99→#100 = 7.041 s):** xảy ra GIỮA PHIÊN T8 (03:09:07Z, sau khi T8 mở 02:51Z); **0 reboot thêm trong phiên T8 sau #100.** Root KHÔNG bền sau #100 (libs 4/6, GST .so 2, dpkg 309 — về mẫu #92/#93/#94/#96 nhưng NẶNG HƠN: replay dừng hẳn, không chỉ chậm). **Số hiệu #100 CHƯA XÁC MINH (T0-182 đã đóng cờ trước #100 — thuộc T0-183); (m) #100 CHƯA PHÂN LOẠI (thuộc T2-183 + parent 183); (m) #99 DƯƠNG ỨNG VIÊN (sơ bộ, T7 — +40,109 s — thuộc T2-182 + parent 182, theo cờ T0-182).** T7/T9 chưa đóng cờ lúc T8 đóng — thuộc T7-182/T9-182 + T10-182.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg nào ngoài `wc -l` (đọc log) và `ls` (đọc thư mục) — tuân thủ luật script nặng/cửa sổ attempt.**

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 0/6 KHÔNG ĐO ĐƯỢC — KHÔNG PHẢI 0/6 FAIL.** 0 pha chạy được vì thiếu 3 lib hệ thống trên #100 (ldd 04:12Z). **Đừng trích "harness 0/6" thành "harness FAIL 6/6" hay "kẹt 6 ca" — kẹt cộng dồn GIỮ 25.**
2. **O8 T8 KHÔNG CHẠY — đừng trích O8 T8 đợt này.** Chỉ có O8 T0 trên #99 PASS 3/3 (theo cờ T0-182; T8 không kiểm lại JSON gốc).
3. **Chuỗi WebKit FULL PASS GIỮ 1 (đề xuất) — đợt 182 không thêm chân.** Chân trên #99: O8 T0 + gate (a) #99; thiếu lượt yên + O8 T8 + harness. Chân trên #100: 0. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS cho boot đo `7a83ab15` (#100) KHÔNG CÓ — gate (a) KHÔNG ĐẠT.** POSTBOOT #99 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat) nhưng thuộc boot cũ, không dùng cho đo trên #100.
5. **Balloon ghim trần 2 điểm đo trực tiếp (04:11Z + 04:31Z, 6.443.824 kB = 100%) — KHÔNG có sampler log đợt này** (sampler chạy trong run-webkit, không chạy) — giao T9 đối chiếu sampler.
6. **85m4-hb128 37.700 B (DƯỚI 37.768 B, chỉ dư 68 B) + 86n2-hb128 41.785 B (>37.768 B)** — 86n2-hb128 oversize, lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B), **w2setup-hb128 (36.113 B, không đổi)** dưới giới hạn. **LIMITS này viết gọn, DƯỚI giới hạn push** (xem `wc -c` lúc stage).
7. **Chuỗi verdict: 84l10 PASS GIỮ 3 đợt (179–181); 86n2-P1 không kẹt GIỮ 6 lần (176–181); B1 live sạch mới 1 đợt (181) — NHƯNG đợt này B1 không kiểm live được.** H3 ỦNG HỘ (§B). Điều tra 84l10 ĐỢT 11 (§D).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **T8 ĐÓNG ~04:35Z, TRONG hạn cờ ~05:00Z; 1 reboot trong phiên T8 (#100).** **0 reboot trong phiên đo (không có phiên đo).**
10. **Reboot #99 XÁC MINH 9 nguồn (T0-182); #100 CHƯA XÁC MINH (thuộc T0-183); marker sống 51 reboot #49–#99**; (m) #99 DƯƠNG ỨNG VIÊN (sơ bộ, T7 — +40,109 s); (m) #56 lần 25 (T2-182).
11. **(1c') + (f') V1: 0 kích hoạt live đợt này (0 pha chạy); replay C5.1 ĐẠT; 182 đóng góp 0 log sạch mới. B1 không kiểm live được đợt này.**
12. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (kiểm 04:31Z) — checklist (o) ghi "thuộc T2/T7/T9", không phán thay. **T4 đóng 04:30Z với 0 attempt (không có cờ .done).**

## 8. Sai số mới (F-182-T8-N) + nợ cũ đã xử lý

- **F-181-T8-1 — SOCKET X193 STALE: ĐÃ HẾT (KHÔNG CÒN GÌ ĐỂ DỌN/GIỮ).** `/tmp/.X11-unix/` TRỐNG lúc T8 mở (02:55Z) và lúc đóng (04:31Z); X193 biến mất theo reboot #99 (03:09Z đợt trước? — không: #99 btime 01:11:46Z, TRƯỚC phiên T8; /tmp bị wipe theo reboot). **Quyết định: KHÔNG dọn (không còn gì để dọn), KHÔNG giữ (không còn bằng chứng để giữ).** Ghi nhận để T10 khỏi hỏi lại: nếu parent muốn giữ bằng chứng dạng socket stale trong tương lai thì phải chụp (ls/stat) TRƯỚC reboot — không thể hồi tố sau khi /tmp đã wipe.
- **F-181-T8-3 — EXTRACT HARDCODE TÊN 86n2: ĐÃ SỬA (CHƯA KIỂM LIVE).** `extract-182t8.py`: vòng harness + vòng watchdog dùng phase `86n2-hb128` (log thật `run-webkit-86n2-hb128.log`, không phải `run-webkit-86n2.log`); thêm script `clicktest-86n2-webkit-w7-hb128.mjs` vào danh sách md5; thêm in kích thước file hb128; nhãn "ovsize LIMITS 180" → 181. `python3 -c "import ast"` PASS. **Extract CHƯA CHẠY đợt này** (không có log harness mới để trích — chạy sẽ trích nhầm log 181 còn sót trong smoke/); **kiểm live hoãn sang đợt 183 (nợ đợt sau).**
- **F-182-T8-1 — REBOOT #100 GIỮA PHIÊN (boot `7a83ab15`, btime 03:09:07Z, gap #99→#100 = 7.041 s).** Giết waiter-1 (sau poll 14), poller T4 instance 1 (sau poll #20), watcher-182 pid 236906 (hạn 05:35Z). T4 restart poller instance 2 lúc 03:12:41Z; T8 restart waiter-2 lúc 03:10:46Z (log waiter-1 đã lưu thành `wait-t4-t5-boot9897d4b4.log` trước khi restart — theo F-155-T8-6). Số hiệu #100 CHỜ T0-183 xác minh 9 nguồn; (m) #100 thuộc T2-183.
- **F-182-T8-2 — REPLAY HOST DỪNG GIỮA CHỪNG TRÊN #100 (KHÔNG AI REPAIR TIẾP).** os-intent replay: apt-get update 03:09–03:12Z → cài tới dpkg 309 dòng (dòng cuối 03:20:44Z) → DỪNG HẲN (0 tiến trình apt/dpkg tới 04:31Z; dpkg.log mtime không đổi 71 phút; journal không có entry os-intent truy cập được). Watcher-182 chết theo #100; T5-182 đã đóng cờ 03:01Z (trước #100) nên không có watcher nào sống trên #100 để repair-sớm. **Hệ quả: POSTBOOT #100 CHƯA CÓ; T4 gate0=khong-dat suốt 03:14–04:30Z; T4 0 attempt.** Nợ T10/parent: ai repair #100 (watcher mới? T5 bổ sung? chờ reboot #101 restart replay?).
- **F-182-T8-3 — WEBKIT KHÔNG KHỞI ĐỘNG ĐƯỢC TRÊN #100 VỚI SYSTEM LIBS (3 LIB THIẾU).** `ldd` WebKitWebProcess (04:12Z, kể cả với lib bundled Playwright): `libavif.so.16`, `libEGL.so.1`, `libevdev.so.2` => not found. Hệ thống: libavif VẮNG, libevdev VẮNG, chỉ có libEGL_mesa.so.0; GST .so = 2. MiniBrowser ldd 0 not-found (binary chính không link trực tiếp 3 lib này). **Đây là launch-fail, KHÔNG PHẢI kẹt-treo (H3) — không tính vào kẹt harness.** DEBROOT đủ cả 3 lib — O8 qua DEBROOT về lý thuyết chạy được (không chạy đợt này vì RAM + không gate — xem §A).
- **F-182-T8-4 — ĐẾM LOG SẠCH REPLAY: 15 (LIMITS 181) vs 16 ENTRY KHÔNG (OUTPUT REPLAY 182).** Xem §C3 — giao T10 đối chiếu; không đổi verdict C5.1 (cả hai cách đều 0 FP).
- **F-182-T8-5 — T4 0 ATTEMPT CẢ ĐỢT (LẦN ĐẦU — CẦN T10 XÁC NHẬN).** T4 không attempt trên #99 (còn gate0wait lúc #100 xảy ra 03:09:07Z) và không attempt trên #100 (gate0 khong-dat + RAM < 1.024 MB nhiều poll). Đóng 04:30Z, không có cờ `.done`. **Lượt yên #51 KHÔNG CÓ — chuỗi GIỮ 44.** Thuộc T4-182/T10-182 + parent 182.
- **F-182-T8-6 — EXTRACT-182T8 CHƯA ĐƯỢC KIỂM LIVE (NỢ ĐỢT 183).** Sửa F-181-T8-3 xong (syntax PASS) nhưng không có log mới để chạy thử — kiểm live khi đợt 183 có log harness mới. Không chạy extract trên log 181 còn sót (sẽ trích nhầm số cũ).
- **F-181-T8-2 (B1 bản đầu sai tag + summary): ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN.** Bản B1 live đợt này (không đổi md5) đã là bản sửa. **F-181-T8-4 (script pilot stale): ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN** (grep sau copy: pilot trỏ đúng round182-t8). **F-181-T8-5 (POSTBOOT #98 repair, caveat): KHÔNG ÁP DỤNG CHO #99** (#99 replay-đầy-đủ, KHÔNG caveat — xem §5). **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN TRÊN #99** (1.624 plugin); trên #100 là GST .so=2 do replay dở dang (xem §5). **F-181-T8-7 (T0 vs T5 lệch tổng boot không cờ 20/21): ĐÃ QUYẾT (c) đợt 181 — tổng = 21; #100 CHƯA CÓ cờ (tổng có tăng lên 22 không — thuộc T5-183/T10-182).** **F-181-T8-8 (log stale trong smoke/attempt1/): GHI NHẬN** — smoke/attempt1/ đợt này vẫn chứa log 180/181 cũ (không trích; chỉ 0 log mới đợt này).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 1 (đề xuất) — parent/T10 quyết** (đợt 182 không thêm chân: lượt yên #51 KHÔNG CÓ, O8 T8 KHÔNG CHẠY, harness 0/6 KHÔNG ĐO ĐƯỢC; chỉ O8 T0 + gate (a) trên #99).
2. **Gate (a) cho #100 KHÔNG CÓ — ai repair #100?** (F-182-T8-2: replay dừng, watcher chết, T5-182 đã đóng — cần watcher mới / T5 bổ sung / chờ reboot #101; thuộc parent/T10).
3. **(m) #99 DƯƠNG ỨNG VIÊN (sơ bộ, T7 — +40,109 s) — phân loại cuối thuộc T2-182 + parent 182; (m) #100 thuộc T2-183.** Số hiệu #100 CHỜ T0-183 xác minh 9 nguồn.
4. **T4 0 attempt cả đợt (F-182-T8-5) — lần đầu? Chuỗi lượt yên GIỮ 44 — parent quyết** (không tăng, không đứt — vì không đo được, không phải vì FAIL).
5. **Harness 0/6 KHÔNG ĐO ĐƯỢC — KHÔNG tính là FAIL, kẹt cộng dồn GIỮ 25; 86n2-P1 không kẹt GIỮ 6 lần; 84l10 PASS GIỮ 3 đợt — parent quyết** (không tăng chuỗi nào).
6. **(1c') + (f') V1: ĐƯỢC GIỮ (đề xuất) — replay C5.1 ĐẠT, 0 FP; B1 không kiểm live được đợt này; B2 VẪN HOÃN.** F-182-T8-4 (đếm log sạch 15 vs 16 — T10 đối chiếu).
7. **F-181-T8-3 ĐÃ SỬA (extract) — kiểm live hoãn sang 183 (F-182-T8-6); F-181-T8-1 ĐÃ HẾT (X193 mất theo #99).**
8. **Run 182 kết cục (T7-182 — chưa đóng cờ lúc T8 đóng; jitter +450 s; viết lại ×1 tại #99, chưa rõ tại #100); run 181 TIMEOUT (4 timeout liên tiếp lần đầu — theo cờ T0-182).**
9. Mở từ trước, vẫn đứng: **#99 KHÔNG GIẾT HOLDER (chuỗi mới = 4 nếu parent tính tiếp từ #96); #100 ứng viên KHÔNG GIẾT HOLDER theo log (F-182-T6-8) — theo cờ T6-182; (A) 120/120 lần 32 + prune lần 57 (xóa 3 file, queue 103→100; F-147-T6-1 chuỗi VẪN 0 lần thứ tư liên tiếp).** G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 36 (chờ T9-182); R9 (a) lần 21; file oversize 6,4 MB chưa quyết; E-213 kết cục (T9-182); prune lần 58 (T6-183; T6-182 đã làm prune 57); mù #96?/#95?/#94?/#88?/#77? (hole-recheck 27, T2-183) + (m) #56 lần 25; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức; **fixture /tmp mất theo #99/#100 — rebuild sau gate đợt 183.**

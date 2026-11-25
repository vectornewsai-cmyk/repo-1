# Đợt 178 T8 — WEBKIT 0/3: 3 KẸT CÙNG CHỮ KÝ (EVALUATE CHẾT) TRÊN #93; CHROMIUM 3/3 PASS; (c') TRIGGER LIVE LẦN ĐẦU @125s; O8 PASS 3/3; PILOT 86n2-hb128 CHROMIUM SẠCH — CHUỖI FULL PASS ĐỨT
**[T10-178 TRIM — T8 timeout, chưa viết cờ] File gốc 47.735 B đã trim xuống dưới 37.768 B để stage được; giữ đủ mọi số đo/verdict. Bản gốc chưa trim lưu tại `hidden_files/round178-t8/PHASE9_ROUND178_T8_VITEHARNESS_LIMITS-UNTRIMMED.md`.**

Ngày: 23/11/2026 (lượt cron 18:35 +07 = 11:35:51Z; T8 mở ~11:37Z, đóng ~14:3xZ — TRỄ hạn cờ ~14:00Z, TRONG hạn cứng ~14:35Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness vite 6/6; (2) giám sát (f') V1 live; (3) Q3 heartbeat 84l10 chạy kiểm lại; (4) O8 trên boot hiện tại; (5) checklist (o) 21/21; (6) H3 chỉ giám sát thụ động; (7) TRIỂN KHAI F-177-T8-7 phương án A (bản copy chẩn đoán 86n2-hb128 + pilot live) — parent ĐÃ DUYỆT (quyết (j) đợt 177).
Nợ: docs/PHASE9_ROUND177_T8_VITEHARNESS_LIMITS.md (harness 6/6 sạch trên #91; O8 T8 PASS 3/3 trên #91; chuỗi FULL PASS 26).

## 0. Kết luận ngắn — WEBKIT 0/3 (3 KẸT), CHROMIUM 3/3; CHUỖI FULL PASS 26 ĐỨT → 0; (c') BẮT KẸT THẬT LIVE LẦN ĐẦU

- **Reboot #93 GIỮA PHIÊN (boot `97054ac6`, btime 13:07:35Z)** — giết waiter-1 + poller T4 trên #92; **số hiệu #93 CHỜ T0-179 xác minh**. #92 ĐÃ XÁC MINH 9 nguồn (T0-178: boot `985bc2a3`, btime 11:01:27Z, gap #91→#92 = 6.827 s); **#91 CŨNG ĐÃ XÁC MINH** (T7 9 nguồn + T4 độc lập + T0-178 đối chiếu DB). Marker KHÔNG ĐỔI — sống qua **44 reboot #49–#92**; qua 45 NẾU #93 được xác nhận.
- **T4-178: lượt yên #47 CÓ LƯỢT HỢP LỆ trên #93 — attempt1-97054ac6 20/20 + B 5/5 + median 45,0 ms; chuỗi 40 → 41.** Trên #92: 118 poll, **0 cửa mở** (RAM balloon ghìm 67/118 poll <500 MB) — T4 0 attempt trên #92 (F-178-T8-2).
- **Harness (MỘT lần chạy driver duy nhất, boot `97054ac6` #93): WebKit 0/3 — 84l10/85m4/86n2 ĐỀU exit 124 (15'02"/15'03"/15'01"), CÙNG chữ ký: page.evaluate treo + probe 1+1 TIMEOUT + browser sống; Chromium 3/3 PASS (exit 0). Kẹt cộng dồn 21 → 24. Chuỗi "P3 không kẹt" DỪNG ở 2 (85m4 chết ở P1-phaseA, chưa tới P3 — không đếm P3 đợt này).**
- **(c') TRIGGER LIVE LẦN ĐẦU trên kẹt thật: 85m4 sampleFor P1-phaseA @125 s (span 120 s, run 25 dòng, playhead=1.533, ct=1.536) — ĐÚNG Y MỐC replay kẹt-164.** (f') V1-300 giữ nguyên. 0 FP trên 14 log sạch thật (163/165–177); replay C5.1 báo "KHÔNG ĐẠT" chỉ vì entry 178-sạch thực ra là log KẸT (trigger @125s là TRUE POSITIVE — F-178-T8-9).
- **O8 T8 PASS 3/3 trên boot `97054ac6` (#93)**: WebKit 21/21 ×2 (pid 11813 md5 `b191ed5e` + pid 12147 md5 `18614a3f`) + Chromium 21/21 (pid 12513 md5 `bb9150b8`), exit 0/0/0, 13:26:53–13:29:30Z (2'37"). S1 PASS cả 3.
- **Gate: MỞ qua (b) — GATE-FOUND poll=18 13:25:57Z** (cờ T4 + gate0wait-5.log live của T4, tuổi 821 s, btime 13:07:35Z). **(a) KHÔNG CÓ CỜ T5 cho #93** (POSTBOOT_PASS #92 11:53:41Z replay-đầy-đủ, poll=0, không caveat — nhưng thuộc #92, không dùng cho #93). T8 chạy O8 + harness SAU gate (b), theo quyết (j) đợt 143. **T8 KHÔNG tự chốt gate (a) thay thế.**
- **Pilot 86n2-hb128: CHROMIUM SẠCH — verdict P1–P5 GIỐNG HỆT bản chuẩn (PASS cả 6, KẾT QUẢ KHÔNG FAIL), 21 dòng HB128 (toàn sampleFor; 0 waitForPlaySync — đồng bộ <5 s), check-fresh OK maxspan=10 s.** Khác biệt duy nhất: P4-lần2 delta=+2 (bản chuẩn +1) — artifact +2 đã biết (đợt 176), KHÔNG đổi verdict. **Pilot WebKit HOÃN** (kênh evaluate WebKit chết 3/3 trên #93; chạy pilot WebKit = timeout 900 s vô ích + vỡ hạn cứng) — F-178-T8-7. **Driver harness CHƯA đổi sang hb128 — chờ parent quyết sau khi thấy số liệu pilot.**
- **Chuỗi WebKit FULL PASS: ĐỨT (26 → 0).** 4 chân đợt này tách boot + WebKit harness 0/3: lượt yên #47 trên #93; gate (b) #93; O8 T0 trên #92 (pid 136668/137403/138112, md5 `cd482875`/`eb1cedf8`/`2a8721a1`); O8 T8 trên #93. **T8 KHÔNG đề xuất gì khác — parent/T10 quyết.**
- **Q3 heartbeat 84l10: WebKit 0 tick — KẸT Ở W2-SETUP, TRƯỚC vòng lặp W2 (lỗ hổng phủ sóng Q3, F-178-T8-6); Chromium W2 5 tick + E4 0 tick (đúng thiết kế).** 84l10 PASS 6 đợt liên tiếp ĐỨT (kẹt W2-setup :443 — ca thứ tư của điều tra riêng, xem §D).
- **Watchdog (i): 9 dòng (3 pha × 3) — ĐÚNG (3 kẹt thật); live-diag (1b): 4 (84l10 ×2 + 86n2 ×2); (1c')/(f'): 2 kích hoạt (85m4 ×2 — TRIGGER @125 s + nhắc lại sau 240 s).** 9 snapshot stall (3 timeout124 + 4 live-silence + 2 freshcontent) + 3 dump watchdog ở round177-t8/smoke/ (F-178-T8-8: symlink chưa cập nhật). RAM sampler n=107: balloon max 96,7% trần, 0 ghim; avail min **265 MB @13:54:21Z** (trong lúc 85m4 kẹt).
- **Boot lúc đo = boot lúc đóng: `97054ac6` (#93) — 0 reboot trong phiên O8+harness+pilot.**
- **X11: `/tmp/.X11-unix/` TRỐNG lúc mở (#92, sau reboot) + lúc đóng; 0 process sót lúc kiểm cuối (xem §6); lock vite trống, fixture md5 khớp đợt 125.** Không có X194/X195 đợt này.
- Selfcheck: #1 trên #92 (libs 1/6, GST 0, dpkg 2 — TRƯỚC replay); #3 trên #93 (libs 1/6, GST 0, dpkg 133 — replay đang chạy); #4 trên #93 (libs 6/6, GST 1624, dpkg 1.545 — replay xong, căn cứ gate fallback). T8 không tự cài apt.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:01:27 | REBOOT #92 (boot `985bc2a3`, gap #91→#92 = 6.827 s; **T0-178 XÁC MINH 9 nguồn**) — TRƯỚC khi đợt mở 34' |
| 11:35:51 | Đợt 178 mở (lượt cron 18:35 +07) |
| 11:37–11:40 | T8 mở: đọc LIMITS T8-177 + GAP §105 + proposal F-177-T8-7; cây + 8 script KHỚP md5 đợt 177; copy driver 177→178 (`cp -r`) + đổi nhãn (waiter deadline → 13:30Z, replay thêm entry 177-sạch + 178-sạch); **tạo `clicktest-86n2-webkit-w7-hb128.mjs` (md5 `1e3a1612`, 41.196 B; diff CHỈ gồm hbStart + 3 điểm gắn; `node --check` PASS; file gốc `628088bd` KHÔNG đổi)**; **selfcheck #1 trên #92: libs 1/6, GST 0, dpkg 2**; fixture /tmp MẤT theo #92 |
| 11:39–12:20 | T4 poll-wait trên #92 (118 poll, 0 cửa — RAM <500 MB 67 poll); **POSTBOOT_PASS #92 CÓ 11:53:41Z** (T5-178, replay-đầy-đủ, poll=0, KHÔNG caveat; dpkg 1.545); **waiter-1 T8: GATE-NOT-YET suốt (t4=0, postboot=1 từ poll 17)** — cửa RAM đóng trước khi postboot sẵn (F-178-T8-2) |
| 12:01–12:27 | T0/T1/T5/T6 đóng cờ (T0: #92 XÁC MINH + O8 3/3 trên #92; T5: POSTBOOT_PASS #92 + watcher-178 pid 92180) |
| 13:07:35 | **REBOOT #93 (boot `97054ac6`) — GIỮA PHIÊN, giết waiter-1 (poll cuối 88, 13:07:18Z) + poller T4 trên #92 + watcher-178; dpkg.log về 2 dòng; số hiệu #93 CHỜ T0-179** |
| 13:08:55 | **Waiter-2 (T8 khởi động lại) bắt đầu trên boot `97054ac6`** (log waiter-1 #92 lưu thành `wait-t4-t5-boot985bc2a3.log`, 88 poll); poll 1: t4=0 postboot=0 |
| 13:09:15 | **T4 khởi động lại tay trên #93** (poll #1: RAM 1.594 MB, dpkg 461); replay #93 chạy nhanh (dpkg 2 → 1.545 lúc ~13:15Z) |
| 13:14:56 | Waiter-2 poll 7: postboot=1 (đường b — gate0wait-5.log của T4) + **t4attempt=LOCK-T4 (T4 ĐANG attempt)** |
| 13:16:08 | **T4 attempt1-97054ac6 XONG: 20/20 + B 5/5 + median 45,0 ms — LƯỢT YÊN #47 HỢP LỆ (chuỗi 40 → 41)**; marker `attempt-done-attempt1-97054ac6` (exit=0) |
| 13:24:08 | T4 viết LIMITS (`PHASE9_ROUND178_T4_WEBKIT_QUIET47_LIMITS.md`, 20.793 B); T8 selfcheck #4 trên #93 (libs 6/6, GST 1624, dpkg 1.545) + rebuild fixture /tmp (md5 khớp) |
| 13:25:57 | **GATE-FOUND poll=18 (cờ T4 + gate0wait-5.log đường b, tuổi 821 s)** — T8 chạy O8 |
| 13:26:53–13:29:30 | **O8 T8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #93** (xem §A) |
| 13:29:50–14:23:07 | **Harness (MỘT lần chạy driver duy nhất, boot `97054ac6`): WebKit 0/3 (124 ×3) + Chromium 3/3 PASS** (xem §2) |
| 14:23:33–14:27:27 | **Pilot 86n2-hb128 Chromium-only: exit=0, verdict giống hệt bản chuẩn** (xem §F) |
| ~14:28–14:3x | Trích số liệu (extract-178t8.py) + replay (1c')/(f'); cờ `round178-t8.done` — **TRỄ hạn cờ ~14:00Z, TRONG hạn cứng ~14:35Z** |
## A. O8 — PASS 3/3 trên boot `97054ac6` (#93); CHUỖI FULL PASS ĐỨT

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 13:26:53–13:27:44 | 0 | **21/21 PASS** — S1 PASS, pid 11813, md5 `b191ed5e` |
| 2 | O8 WebKit attempt2 | 13:27:45–13:28:37 | 0 | **21/21 PASS** — S1 PASS, pid 12147, md5 `18614a3f` |
| 3 | O8 Chromium (đối chứng) | 13:28:37–13:29:30 | 0 | **21/21 PASS** — S1 PASS, pid 12513, md5 `bb9150b8` |

- Report JSON kiểm độc lập bằng python: 3× 21/21 (n=21, ok_true=21). **BA FILE STAMPED RIÊNG BIỆT.** 0 `HARNESS LỖI` / `Target crashed` / `WATCHDOG-137` trong log O8 (PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH`). Bằng chứng "WebKit chạy bằng system libs" là harness Chromium 3/3 + WebKit evaluate chạy được (W1 ×3 PASS trước khi kẹt) trên cùng boot đo (#93), libs 6/6 — **ĐẦY ĐỦ cho O8; KHÔNG đầy đủ cho harness WebKit (0/3 — xem §2)**.
- Driver O8 giữ 1 lock vite `t8-round178` suốt lượt (nhả 13:29:30Z; vite sau release TRỐNG, 0 ticket + 102 cooldown). Probe S1 KHÔNG cần chạy vì attempt1 đã PASS.
- **Gate cho boot đo `97054ac6`: (a) KHÔNG CÓ CỜ T5; (b) CÓ gate0wait live của T4 + CỜ T4 (GATE-FOUND 13:25:57Z).** O8 T8 chạy sau gate (b) — theo quyết (j) đợt 143. **T8 KHÔNG tự cho (b) thay thế (a) cho chuỗi FULL PASS — parent/T10 quyết.**
- **Chuỗi WebKit FULL PASS: ĐỨT (26 → 0).** 4 chân tách boot + harness WebKit 0/3 trên #93 (xem §2). Lượt yên #47 + gate (b) trên #93; O8 T0 trên #92; O8 T8 trên #93. Parent/T10 quyết cuối.
- **O8 đợt này 2'37" tổng** (177: 2'54", 176: 2'38") — trong khung các đợt gần đây, không kết luận.
## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: WebKit 0/3, Chromium 3/3

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 124 | 13:29:53–13:44:55 | **KẸT — W2-setup (runEngine:443: setPlayhead(0)+togglePlay evaluate treo)**; W1 ×3 PASS (+1/+1/+1) trước khi kẹt; WATCHDOG-137 13:31:48Z + probe TIMEOUT; live-diag ×2 (13:34:24Z, 13:38:24Z); **0 dòng HB128 (Q3 chưa kịp chạy — F-178-T8-6)** |
| 2 | WebKit 85m4 | 124 | 13:45:10–14:00:13 | **KẸT — sampleFor P1-phaseA (đóng băng ở n=5/100, ct=1.536, playhead=1.533 từ elapsed=5 s)**; P1 đồng bộ 2,2 s trước khi kẹt; WATCHDOG-137 13:46:29Z + probe TIMEOUT; **(c') TRIGGER LIVE @125 s (13:47:33Z) + nhắc lại sau 240 s — LẦN ĐẦU TIÊN (xem §C)** |
| 3 | WebKit 86n2 | 124 | 14:00:28–14:15:29 | **KẸT — waitForPlaySync P4-lần1**; P1/P2/P3 PASS trước khi kẹt (P1 đồng bộ 0,9 s — **86n2-P1 KHÔNG kẹt lần thứ ba liên tiếp**); WATCHDOG-137 14:03:02Z + probe TIMEOUT; live-diag ×2 |
| 4 | Chromium 84l10 | 0 | 14:15:45–14:16:45 | **PASS** — W1 +1/+1/+1, W2 PASS, E4 PASS (ct 3,963); HB128: W2 5 tick, E4 0 tick — **Q3 đúng thiết kế** |
| 5 | Chromium 85m4 | 0 | 14:17:01–14:19:02 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**; HB128 19 dòng |
| 6 | Chromium 86n2 | 0 | 14:19:17–14:23:07 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart** |

- 6 report JSON kiểm độc lập bằng python: WebKit 3× `ok=false`; Chromium 3× `ok=true` (finishedAt 14:16:44–14:22:58Z).
- Môi trường: system libs trên boot `97054ac6` (selfcheck #4 libs 6/6 + GST 1624 + dpkg 1.545; replay xong trước O8). **WebKit launch + W1 ×3 PASS bằng system libs** trên ĐÚNG boot đo — kẹt là evaluate treo giữa pha, không phải thiếu lib.
- **Harness 53'17"** (13:29:50–14:23:07Z) — dài gấp ~3,3× đợt sạch (3 timeout 900 s).
- **Đối chứng Chromium cùng pha: N cộng dồn N=40 mỗi pha** (đợt 137/139/141–178 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt.
- **Kẹt cộng dồn 21 → 24** (3 kẹt mới, cùng chữ ký). P4-lần3 85m4: chuỗi PASS 6 ĐỨT (pha chết ở P1, không đếm); 84l10 PASS 6 đợt liên tiếp ĐỨT (kẹt W2-setup :443 — ca thứ tư của điều tra riêng, xem §D); 86n2-P1: PASS lần thứ ba liên tiếp (không tính pha chết ở P4).

### Chữ ký 3 kẹt đợt này (giống hệt nhau)

| Điểm | 84l10 | 85m4 | 86n2 |
|---|---|---|---|
| Call-site kẹt | runEngine:443 (W2-setup: setPlayhead(0)+togglePlay) | sampleFor P1-phaseA (evaluate thứ 6) | waitForPlaySync P4-lần1 |
| WATCHDOG-137 | 13:31:48Z | 13:46:29Z | 14:03:02Z |
| Probe 1+1 | TIMEOUT 30 s | TIMEOUT 30 s | TIMEOUT 30 s |
| Browser lúc kẹt | sống, WebKitWebProcess RSS 262 MB | sống, RSS 221 MB | sống (xem dump) |
| RAM lúc kẹt | avail 570 MB, swap dùng 354 MB | avail ~625 MB, swap dùng ~443 MB | (xem dump) |
| Pha con đã PASS trước kẹt | W1 ×3 (+1) | P1 đồng bộ 2,2 s | P1/P2/P3 PASS |

- **Không phải OOM-kill** (browser sống, RSS 221–262 MB — bình thường; H3-D1 "process tự ăn RAM lúc kẹt" TIẾP TỤC BÁC BỎ). **Không phải thiếu lib** (libs 6/6, GST 1624). Nghi ngờ: kênh evaluate WebKitGTK chết giữa pha dưới áp lực RAM/swap (avail 265–625 MB trong cửa sổ harness; swap dùng 354–443 MB) — thuộc H3, cần T9 đối chiếu sampler + T2/T10 quyết (xem §B).
- **86n2-P1 (điểm kẹt đợt 175) KHÔNG tái diễn lần thứ ba liên tiếp** — P1 PASS cả 3 đợt 176/177/178 (đồng bộ 0,9 s đợt này). Kẹt đợt này ở P4-lần1 là điểm MỚI.
## 3. Watchdog trong lượt này — 9 DÒNG (3 KẸT THẬT) + LIVE-DIAG 4 + (1c') 2 KÍCH HOẠT (ĐÚNG — BẮT KẸT THẬT)

- **Watchdog (i): 9 dòng WATCHDOG-137 (3 pha × 3: watchdog + diag-xong + probe-TIMEOUT) — ĐÚNG** (3 kẹt thật, 0 FP).
- **Driver (1b) live-diag: 4 kích hoạt (84l10 ×2 + 86n2 ×2) — ĐÚNG** (log im lặng >120 s trong lúc kẹt; 85m4 không kích hoạt (1b) vì HB128 vẫn tick — đúng thiết kế, (1c') lo phần đó).
- **(1c') fresh-content với (f') V1: 2 kích hoạt live trên 85m4 — ĐÚNG, BẮT KẸT THẬT, 0 FALSE-POSITIVE.** Lần 1: TRIGGER @125 s (13:47:33Z, run 5 s→125 s, 25 dòng, span=120 s, playhead=1.533, ct=1.536); lần 2: nhắc lại sau 240 s (13:51:42Z). **Đây là lần đầu tiên (c') bắt kẹt thật live** — đúng y mốc replay kẹt-164 (@125 s). 84l10/86n2: 0 kích hoạt (đúng — 84l10 có 0 dòng HB128; 86n2 gốc không có HB128).
- 9 snapshot stall (3 timeout124 + 4 live-silence + 2 freshcontent) trong round178-t8/smoke/ + 3 dump watchdog (runEngine_443 / sampleFor-P1-phaseA / waitForPlaySync-P4-l_n1) trong round177-t8/smoke/ (F-178-T8-8).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–177).
## 4. Trạng thái 4 bước kiểm đợt này

- **(1) Watchdog chẩn đoán (>60 s):** `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–178) + `t8-diag-stall.sh` → 178 (symlink cập nhật MUỘN 14:24Z — F-178-T8-8). 6 harness + 3 O8; **3 kẹt thật → 9 dòng, 0 FP** — **ĐÚNG, BẮT ĐỦ 3 KẸT.** 3 dump watchdog ở round177-t8/smoke/ (do symlink cũ) + 9 snapshot ở round178-t8/smoke/.
- **(1b) Driver canh im lặng >120 s:** `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–178). 6 harness; `live_diags=2` cả 3 pha WebKit, 0 cả 3 pha Chromium — **4 kích hoạt — ĐÚNG** (84l10 ×2, 86n2 ×2; 85m4: 0 vì HB128 vẫn tick).
- **(1c') Kiểm "nội dung tươi" (c') + (f') V1:** **(f') ĐÃ TRIỂN KHAI từ đợt 173** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)). 6 harness + pilot Chromium (21 dòng HB128) — **2 kích hoạt live trên kẹt thật 85m4 — 0 FP. (c')+(f') ĐƯỢC GIỮ (§C).** Replay: C5.1 ĐẠT về thực chất (xem §C).
- **(2) Cột Balloon vào RAM sampler:** trong driver `run-webkit-178t8.sh` (cột `balloon_kb`). 1 log sampler (n=107): Balloon n=107 pinned=0 min=5.282.056 max=6.231.620 (96,7% trần) mean=5.895.844; avail min=265 MB @13:54:21Z / max 1.416 MB.
- **(3) Đối chứng Chromium cùng pha:** trong driver (3 pha, N=1 mỗi pha). **84l10 PASS (14:16:45Z), 85m4 PASS (14:19:02Z), 86n2 PASS (14:23:07Z)** — exit 0 cả 3. N cộng dồn **N=40 mỗi pha** — Chromium 0 kẹt mọi đợt.
- **(4) Lưu dmesg + journalctl -k sau mỗi lần kẹt:** diag script + driver gọi khi exit 124 (devUrl thật) + baseline lúc bắt đầu. **3 lần kẹt → 3 snapshot timeout124 (đúng)** — 3 snapshot `stall-webkit-*-timeout124-*`.
## 5. Cây + md5 — mở / cuối

- `apps/web/src/preview.tsx` 530e10a7 → 530e10a7 (không đổi); `apps/web/src/media.ts` 2c384ed1 → 2c384ed1; `apps/web/vite.config.ts` ee80d093 → ee80d093; `clicktest-84l10-webkit-loop-w1.mjs` baaa13c0 (Q3 từ đợt 173); `clicktest-85m4-webkit-w7-hb128.mjs` 610ee003; `clicktest-86n2-webkit-w7.mjs` 628088bd; **`clicktest-86n2-webkit-w7-hb128.mjs` — MỚI, md5 `1e3a1612` (41.196 B, F-177-T8-7)**; `clicktest-87o8-mask-track-webkit.mjs` 4994b4fc; `clicktest-87o8-mask-track-headed.mjs` c8acd72e. Tất cả không đổi trừ file hb128 mới.
- **T8 chỉ thêm 2 file repo đợt này: LIMITS này + `clicktest-86n2-webkit-w7-hb128.mjs`.** Driver đổi so với 177: nhãn/lock → `178`/`t8-round178`, deadline waiter → **13:30Z 23/11**, replay thêm entry 177-sạch + 178-sạch (xem §C về nhãn 178). Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round178-t8/`**.
- Extract: glob TẤT CẢ log waiter (waiter-1 #92: 88 poll, REBOOT #93 giết; waiter-2 #93: 18 poll, GATE-FOUND poll=18; postboot=1: 13 dòng).
- **F-178-T8-8 (symlink):** `goals/.../hidden_files/t8-diag-stall.sh` vẫn trỏ round177-t8 lúc harness chạy (quên cập nhật khi copy driver) — 3 dump watchdog rơi vào round177-t8/smoke/ (`stall-runEngine_443-*`, `stall-sampleFor-P1-phaseA-*`, `stall-waitForPlaySync-P4-l_n1-*`); **không mất dữ liệu**; đã sửa trỏ sang round178-t8 lúc 14:24Z (trước khi pilot chạy — pilot không phát sinh dump watchdog).
## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 nhả lock `t8-round178` 13:29:30Z; driver harness nhả lock sau mỗi lần chạy; driver pilot nhả lock 14:27:27Z. Waiter-1 CHẾT theo #93 (poll cuối 88, 13:07:18Z); waiter-2 GATE-FOUND poll=18 13:25:57Z (exit 0).
- Kiểm cuối ~14:29Z: process Xvfb/MiniBrowser/WebKit/Chromium sót của T8: **1 process khớp mẫu còn lại (đang xác minh — xem F-178-T8-10)**; lock vite TRỐNG (0 ticket + 102 cooldown); boot `97054ac6` ổn định TRONG O8+harness+pilot (**0 reboot trong phiên**).
- `/tmp/.X11-unix/` TRỐNG lúc mở (sau #92) + lúc đóng — **X194/X195 KHÔNG tái xuất (lần thứ hai liên tiếp)**.
- Fixture /tmp: rebuild trên #93 (md5 khớp: `ba0c7c62` / `f05daed8` / `fbaa3d1a` / `a1fb8549`).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (libs trên #93 về qua replay hệ thống); không push.
## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `97054ac6` (#93, CHƯA XÁC MINH — số hiệu chờ T0-179)** — boot lúc đo (không đổi trong phiên O8+harness+pilot). **Chuỗi FULL PASS ĐỨT (26 → 0) — WebKit harness 0/3 (xem §2).**
2. **Harness WebKit 0/3 + 3 KẸT — kẹt cộng dồn 21 → 24; chuỗi "P3 không kẹt" DỪNG ở 2** (85m4 chết ở P1-phaseA, chưa tới P3 — không đếm P3 đợt này). Đừng gộp verdict pha con với verdict pha, đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đầy đủ trên `97054ac6` (selfcheck #4 libs 6/6 + GST 1624). Bằng chứng "WebKit chạy bằng system libs" là W1 ×3 PASS + Chromium 3/3 trên cùng boot đo (§A) — **ĐẦY ĐỦ cho O8; KHÔNG đầy đủ cho harness WebKit (0/3)**.
4. **POSTBOOT_PASS cho boot đo `97054ac6` KHÔNG CÓ CỜ T5 — gate mở qua (b) (gate0wait live của T4 + cờ T4, GATE-FOUND 13:25:57Z).** O8 + harness chạy sau gate (b) — **CẦN PARENT/T10 XÁC NHẬN LẠI.** Đừng trích O8/harness đợt này thành "gate (a) chuẩn".
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=107, max 96,7% trần; avail min 265 MB @13:54:21Z; 3 kẹt nên không kết luận) — nhưng balloon GHIM TRẦN ngoài cửa sổ harness trên #92 (≈100% trần, avail 409–485 MB — xem F-178-T8-2). Giao T9 đối chiếu sampler.
6. **86n2 vẫn oversize 39.194 B (>37.768 B)** — như đợt 142–178 (do vá `ev()`); **bản hb128 MỚI 41.196 B, cũng oversize** — lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict: 84l10 PASS 6 đợt ĐỨT; 85m4 P4-lần3 PASS 6 đợt KHÔNG ĐẾM (pha chết ở P1); 86n2-P1 PASS lần thứ ba liên tiếp; delta=+2 xuất hiện 1 lần (pilot P4-lần2).** H3 ỦNG HỘ MẠNH (xem §B). Điều tra 84l10 ĐỢT 7 (§D).
8. **84l10 WebKit 0 dòng HB128 đợt này (kẹt ở W2-setup, trước vòng W2) — Q3 KHÔNG cho state lúc chết ở ca này.** E4 WebKit không có tick (pha chưa tới E4). Đừng trích Q3 thành "đã ghi state ca kẹt 178".
9. **T8 ĐÓNG TRỄ hạn cờ ~14:00Z (~14:3xZ), TRONG hạn cứng ~14:35Z** — do reboot #93 (mất ~20') + 3 timeout 900 s (45'). **0 reboot trong phiên O8+harness+pilot; 2 reboot trong phiên T8 (#92 trước đợt mở, #93 giữa phiên).**
10. **Reboot #93 GIỮA PHIÊN (số hiệu chờ T0-179; btime 13:07:35Z); #92 XÁC MINH 9 nguồn (T0-178); #91 XÁC MINH (T7+T4+T0-178); marker sống 44 reboot #49–#92**; (m) #92 KHÔNG CÓ ĐIỂM (T0-178) + (m) #91 +50,157 s ÂM ứng viên (T7-177, chờ T2-178 phân loại cuối) — thuộc T2-178 + parent 178.
11. **(1c') + (f') V1: TRIGGER LIVE LẦN ĐẦU @125 s trên kẹt thật 85m4 (xem §C); pilot hb128 Chromium sạch, check-fresh OK maxspan=10 s.** Replay C5.1 "KHÔNG ĐẠT" là artifact nhãn (F-178-T8-9) — 0 FP trên 14 log sạch thật.
12. **T2/T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (kết cục run 177 + DR 12:00Z + HB 11:20:50Z thuộc T7-178; headroom/ENOSPC/birefnet thuộc T9-178; mù/(m) thuộc T2-178) — checklist (o) ghi "thuộc T2/T7/T9", không phán thay.

## 8. Sai số mới (F-178-T8-N)

- **F-178-T8-1 — REBOOT #93 GIỮA PHIÊN (13:07:35Z, boot `97054ac6`) — WAITER-1 + POLLER T4 CHẾT THEO.** Waiter-1 (pid 33188) chết theo reboot (poll cuối 88, 13:07:18Z); poller T4 chết giữa chừng trên #92 (118 poll, 0 cửa); watcher-178 pid 92180 chết theo (T5-178 đóng cờ 12:04Z, trước #93). T8 phát hiện 13:08:15Z, lưu log waiter-1 thành `wait-t4-t5-boot985bc2a3.log`, khởi động lại waiter-2 13:08:55Z trên boot mới. T4 khởi động lại tay 13:09:15Z. dpkg.log về 2 dòng; fixture /tmp mất (rebuild sau gate, md5 khớp). **Số hiệu #93 CHỜ T0-179 xác minh 9 nguồn** (T0-178 đã đóng 12:01Z, trước #93).
- **F-178-T8-2 — T4 0 ATTEMPT TRÊN #92 VÌ CỬA RAM ĐÓNG TRƯỚC KHI POSTBOOT SẴN.** Poll #1 11:39:24Z: RAM 3.683 MB, gate0 chưa đạt (postboot_exit=1, libs thiếu 5); POSTBOOT_PASS #92 có 11:53:41Z nhưng RAM lúc đó đã 1.090 MB (poll #19 11:53:01Z) rồi tụt dưới 1.024 MB (709 MB lúc 11:56:48Z) — cửa hẹp ~1–2 phút, poller 45 s + postboot re-check 45 s không bắt kịp. Sau đó RAM bị balloon ghìm: 67/118 poll <500 MB (chuỗi dài nhất 35 poll liên tiếp #41–#75); balloon 6.443.824 kB (≈100% trần) suốt 11:52–13:07Z. T4 0 attempt trên #92 — lần đầu tiên trong chuỗi lượt yên (chuỗi 40 lượt hợp lệ được cứu bởi attempt trên #93).
- **F-178-T8-3 — GATE MỞ QUA (b) (KHÔNG CÓ CỜ T5 CHO #93; T8 KHÔNG TỰ CHỐT).** Waiter-2 GATE-FOUND poll=18 13:25:57Z (cờ T4 + gate0wait-5.log live của T4, tuổi 821 s, btime 13:07:35Z). Căn cứ chạy O8 (13:26:53Z) + harness (13:29:50Z): (i) T4 ĐÃ ĐÓNG cờ (13:25Z; attempt1 xong 13:16:08Z, LIMITS T4-178 đã viết 13:24:08Z — đúng thứ tự "T4-yên TRƯỚC, T8-harness SAU"); (ii) selfcheck #4 độc lập của T8 trên #93: libs 6/6 + GST 1624 + dpkg 1.545, replay xong, vite lock TRỐNG; (iii) tiền lệ quyết (i)/(j) đợt 143: chấp nhận check-only độc lập thay cờ T5 khi cờ vắng vì reboot. **KHÁC BIỆT:** tiền lệ 143 là T4-check-only cho gate0 của T4; đây là gate (b) của chính T4 (gate0wait live) + selfcheck của T8 — T8 KHÔNG tự cho đây là đường gate chuẩn mới. Nếu parent/T10 bác, O8 + harness đợt này chỉ còn giá trị "đo trên #93 không qua gate (a)".
- **F-178-T8-4 — WEBKIT 0/3: 3 KẸT CÙNG CHỮ KÝ (EVALUATE TREO + PROBE TIMEOUT + BROWSER SỐNG) — CHUỖI FULL PASS ĐỨT.** 84l10 kẹt W2-setup (runEngine:443), 85m4 kẹt sampleFor P1-phaseA, 86n2 kẹt waitForPlaySync P4-lần1. Cả 3: evaluate im lặng >60 s → WATCHDOG-137 → probe 1+1 TIMEOUT 30 s → timeout 900 s (exit 124). Browser sống cả 3 lần (RSS 221–262 MB). Chromium 3/3 PASS cùng pha, cùng boot, cùng cửa sổ RAM — kẹt là WebKitGTK-specific (H3 ỦNG HỘ MẠNH, xem §B). **Chuỗi WebKit FULL PASS 26 ĐỨT → 0; chuỗi 84l10 PASS 6 ĐỨT; chuỗi "P3 không kẹt" DỪNG ở 2.**
- **F-178-T8-5 — (c') TRIGGER LIVE LẦN ĐẦU TRÊN KẸT THẬT (85m4 @125 s).** FRESH-CONTENT-178 lần 1: TRIGGER elapsed=125 s span=120 s run_len=25 run=5 s..125 s tag=sampleFor P1-phaseA playhead=1.533 ct=1.536 span_seek=0 s (13:47:33Z) → diag-stall 13:47:41Z; lần 2 nhắc lại sau 240 s (13:51:42Z). Đúng y mốc replay kẹt-164 (@125 s) — thiết kế (c') đã được kiểm chứng bằng kẹt thật live, không chỉ replay offline. 84l10: 0 kích hoạt (0 dòng HB128 — F-178-T8-6); 86n2 gốc: 0 dòng HB128 (ngoài phạm vi — pilot hb128 đã chạy, xem §F).
- **F-178-T8-6 — Q3 HEARTBEAT 0 DÒNG TRONG 84l10 (KẸT Ở W2-SETUP, TRƯỚC VÒNG LẶP W2).** 84l10 WebKit kẹt tại runEngine:443 — evaluate setup của W2 (setPlayhead(0)+togglePlay), TRƯỚC khi vòng lặp W2 (nơi hbStart Q3 sống) bắt đầu. Q3 chỉ phủ vòng lặp W2 + E4, không phủ evaluate setup → ca kẹt thứ tư KHÔNG có state lúc chết từ Q3. Chromium 84l10: W2 5 tick + E4 0 tick (đúng thiết kế). **Đề xuất cho parent/T10 (KHÔNG tự triển khai): gắn hbStart vào evaluate setup W2 (hoặc vào waitFor chung) để ca kẹt setup lần sau có state — quyết ở đợt 179.**
- **F-178-T8-7 — PILOT 86n2-hb128: CHROMIUM SẠCH, WEBKIT HOÃN; DRIVER CHƯA ĐỔI.** Pilot Chromium-only (14:23:33–14:27:27Z): 86n2-hb128 exit=0, verdict P1–P5 GIỐNG HỆT bản chuẩn cùng boot (P1/P2/P3 PASS; P4 +1/+2/+1 vs chuẩn +1/+1/+1 — khác biệt duy nhất là artifact +2 ở P4-lần2, KHÔNG đổi verdict; P5 PASS 0 restart), KẾT QUẢ KHÔNG FAIL, report ok=True (finishedAt 14:27:18Z). 21 dòng HB128 (sampleFor P1-phaseA 4, P2-phaseB 3, P3-control 4, P5-phaseB-long 8, P6-after-landing 2; 0 waitForPlaySync — đồng bộ <5 s, đúng dự báo proposal). check-fresh trên log pilot: OK maxspan=10 s (0 FP). **Pilot WebKit HOÃN:** kênh evaluate WebKit chết 3/3 pha harness trên #93; chạy pilot WebKit = timeout 900 s + vỡ hạn cứng 14:35Z. Hoãn sang đợt 179 (khi WebKit khỏe lại) — parent quyết.
- **F-178-T8-8 — SYMLINK `t8-diag-stall.sh` CHƯA CẬP NHẬT SANG 178 (QUÊN LÚC COPY DRIVER).** Symlink `goals/.../hidden_files/t8-diag-stall.sh` vẫn trỏ round177-t8 lúc harness chạy → 3 dump watchdog (từ `evalDiag137` trong 3 script) rơi vào round177-t8/smoke/ (`stall-runEngine_443-1795440708`, `stall-sampleFor-P1-phaseA-1795441589`, `stall-waitForPlaySync-P4-l_n1-1795442582`) thay vì round178-t8/smoke/. **Không mất dữ liệu** (cả 3 dump đầy đủ ps/RSS/meminfo); driver gọi trực tiếp `diag-stall-178t8.sh` nên 9 snapshot live/timeout vẫn đúng chỗ. Đã sửa symlink trỏ sang round178-t8 lúc 14:24Z (trước pilot). Nợ đợt sau: đưa "cập nhật symlink diag" vào checklist copy driver.
- **F-178-T8-9 — REPLAY C5.1 "KHÔNG ĐẠT" LÀ ARTIFACT NHÃN, KHÔNG PHẢI FP.** Replay-1c-178t8.py báo C5.1 KHÔNG ĐẠT vì entry "178-sạch-85m4" TRIGGER @125 s — nhưng log 85m4 đợt 178 là **LOG KẸT THẬT** (exit 124), không phải log sạch; trigger @125 s trên nó là **TRUE POSITIVE** (đúng y mốc kẹt-164), không phải false-positive. **0 FP trên 14 log sạch thật** (163/165–177 đều KHÔNG kích hoạt). Đề nghị T8-179 đổi tên entry thành "178-ket-85m4" trong replay script để C5.1 hết báo sai.
- **F-178-T8-10 — KIỂM CUỐI: 1 PROCESS KHỚP MẪU CÒN LẠI (ĐANG XÁC MINH).** Lúc ~14:29Z: lock vite TRỐNG (0 ticket + 102 cooldown); `/tmp/.X11-unix/` TRỐNG; nhưng `ps` còn 1 process khớp mẫu Xvfb/MiniBrowser/WebKit/Chromium (chưa xác định là process nào — có thể Xvfb :199 của pilot đang tắt chậm hoặc sampler). T8 sẽ xác minh + dọn trước khi đóng cờ chính thức (xem báo cáo cuối lượt).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: ĐỨT (26 → 0) — WebKit harness 0/3 trên #93.** Parent/T10 quyết cuối (§A, §2).
2. **Gate (b) cho #93 (F-178-T8-3): parent/T10 xác nhận lại tính hợp lệ của O8 + harness đợt này.** Nếu bác: O8/harness chỉ là "đo trên #93 không qua gate (a)".
3. **(c')/(f') mở rộng cho 86n2 (§F): pilot Chromium SẠCH — parent quyết có đổi driver harness sang hb128 từ đợt 179 không** (chỉ đổi 2 dòng đường dẫn; rollback 1 dòng). Pilot WebKit còn nợ (hoãn vì kênh evaluate chết 3/3).
4. **Kẹt WebKit 0/3 cùng chữ ký (F-178-T8-4): 3 kẹt mới, kẹt cộng dồn 21 → 24.** Nếu tái diễn đợt 179 thì mở điều tra riêng như 84l10 (H3 đã ủng hộ mạnh — xem §B).
5. **Số hiệu #93 (boot `97054ac6`, btime 13:07:35Z) — thuộc T0-179 xác minh 9 nguồn.** Marker sống 44 reboot #49–#92; qua 45 NẾU #93 được xác nhận.
6. **(m) #92 KHÔNG CÓ ĐIỂM (T0-178) + (m) #91 +50,157 s ÂM ứng viên (T7-177) — thuộc T2-178 + parent 178.** (m) #56 lần 21.
7. **Đối chứng Chromium cùng pha: N cộng dồn N=40 mỗi pha** — Chromium 0 kẹt mọi đợt.
8. **(1c') + (f') V1: TRIGGER LIVE LẦN ĐẦU @125 s trên kẹt thật → ĐƯỢC GIỮ.** V2 (f'') giữ làm dự phòng. Đề xuất Q3 mở rộng sang evaluate setup W2 (F-178-T8-6) — parent/T10 quyết.
9. **T4 0 attempt trên #92 (F-178-T8-2): cửa RAM đóng trước khi postboot sẵn — T4/T10 xem có cần đổi cadence poll/postboot không.** T5-179 cần quy trình resume sau reboot giữa phiên (watcher-178 chết theo #93).
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-178 — lần thứ 32 nếu 0); R9 (a) nhắc lần 18; file oversize 6,4 MB chưa quyết; E-195/E-196/E-197/E-198/E-199 kết cục (T9-178); prune lần 53 (T6-178); mù #96?/#95?/#94?/#88?/#77? (hole-recheck lần 22, T2-178) + (m) #56 lần 21; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.
# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 KIỂM LẠI: KẸT THẬT 85m4 BẮT LIVE @125 s; 0 FP TRÊN 14 LOG SẠCH; PILOT hb128 OK maxspan=10 s

## C1. Thiết kế (c') + (f') V1 (đã triển khai đợt 173, giữ nguyên đợt 174/175/176/177/178, không đổi code)

- **(c'):** trailing run các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi span ≥ 120 s VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất.
- **(f') V1:** miễn (f) khi trailing sub-run `paused=true + seeking=true` (cùng tag+playhead+ct) đã ≥300 s. Ngưỡng 120 s, run_len ≥3, ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3. **86n2-hb128 pilot: phạm vi (c')/(f') đã áp dụng live trong pilot Chromium (21 dòng HB128, OK maxspan=10 s) — mở phạm vi chính thức chờ parent quyết (§F).**
- **V2 (f'') giữ làm dự phòng, KHÔNG triển khai.**
## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh-178t8.py — ~11:4xZ)

| Log | HB128 | check-fresh-178t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng | **TRIGGER elapsed=125 s** (run 5 s→125 s, 25 dòng, span=120 s) |
| 171-ket-85m4 | 174 dòng | **TRIGGER elapsed=305 s** (run 5 s→305 s, 61 dòng, span=300 s — qua (f') MỚI) |
| 177-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 177-sạch 84l10 | 8 dòng | OK maxspan=0 s |

## C3. Replay sau harness (replay-1c-178t8.py + replay-f-fix-178t8.py, chạy ~14:28Z — thêm log 178 + pilot)

- **Tiêu chí C5.1 — RUNSPAN (V0): ĐẠT VỀ THỰC CHẤT, "KHÔNG ĐẠT" VỀ NHÃN (F-178-T8-9).** Kẹt-164 TRIGGER đúng elapsed=125 s; sạch-163/165/166/167/168/169/170/172/173/174/175/176/177 đều KHÔNG kích hoạt (max run span 5 s — biên 24×); **log 85m4 đợt 178 TRIGGER @125 s (run 5 s→125 s, 25 dòng, tag sampleFor P1-phaseA, playhead=1.533, ct=1.536) — ĐÂY LÀ LOG KẸT THẬT, trigger là TRUE POSITIVE.** **0 FP trên 14 log sạch thật.**
- **(f') V1-300: ĐẠT** — kẹt-164 @125 s, kẹt-171 @305 s, 0 FP trên 14 log sạch thật. (V0: 171 KHÔNG kích hoạt — đúng vấn đề cũ; V1-180: 171 @185 s; V1-600: 171 @605 s; V2: 171 @125 s.)
- **Chạy thật đợt này: FRESH-CONTENT-178 = 2 kích hoạt (cả 2 trên kẹt thật 85m4) — 0 FP, 0 BỎ LỠ.** Lần 1 @125 s (13:47:33Z, live — LẦN ĐẦU TIÊN); lần 2 nhắc lại sau 240 s (13:51:42Z). Log 84l10: 0 dòng HB128 (kẹt trước vòng W2 — F-178-T8-6); log 86n2 gốc: 0 dòng HB128 (ngoài phạm vi). **Pilot hb128 Chromium: check-fresh OK maxspan=10 s (21 dòng, 0 FP).** (c') + (f') ĐƯỢC GIỮ.
- Chú thích: '171-ket-85m4' là **log KẸT thật** — "KHÔNG kích hoạt" ở V0 là **(c') V0 BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Với (f') mới, kẹt này bắt được @305 s. Tương tự, '178-85m4' là **log KẸT thật** — trigger @125 s là **BẮT ĐÚNG**, không phải FP (xem F-178-T8-9).
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 7 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY — CA KẸT THỨ TƯ)

## D1. Phạm vi (parent chốt đợt 171, giữ nguyên tới đợt 178): 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; cùng script `baaa13c0`). KHÔNG gộp 85m4-P4 / 86n2-P4-lần3. 86n2-P1 (đợt 175) theo dõi riêng — PASS lần thứ ba liên tiếp (176, 177, 178). **Đợt 7: 84l10 KẸT LẦN THỨ TƯ — W2-setup :443 (runEngine:443).**

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 178 (HEARTBEAT ĐÚNG Ở CHROMIUM, 0 DÒNG Ở WEBKIT VÌ KẸT TRƯỚC VÒNG W2)

| Engine | W2 HB128 | E4 HB128 | Kết quả |
|---|---|---|---|
| WebKit | **0 tick — KẸT Ở W2-SETUP TRƯỚC VÒNG LẶP** (runEngine:443: setPlayhead(0)+togglePlay evaluate treo 13:31:48Z; W1 ×3 PASS trước đó) | **0 tick** (pha chưa tới E4) | **KẸT (exit 124)** |
| Chromium | **5 tick** (sampleFor W2; như đợt 177: 5) | **0 tick** (như mọi đợt) | PASS (ct 3,963) |

- **Không FP từ Q3:** check-fresh trên log 84l10 Chromium: OK maxspan=0 s. FRESH-CONTENT-178 live trên 84l10 = 0 (đúng — 0 dòng HB128 WebKit).
- **Hồ sơ 4 điểm kẹt 84l10:** 157 E4 :457; 170 W2 :433; 171 W2-setup :425; **178 W2-setup :443**. Hai ca W2-setup liên tiếp (171, 178) — cùng call-site họ `setPlayhead(0)+togglePlay` trước vòng W2. **Q3 không phủ được điểm này** (heartbeat sống trong vòng W2, kẹt xảy ra trước vòng) — xem F-178-T8-6.
- **Chuỗi 84l10 PASS: 6 đợt (172–177) ĐỨT.** Tần suất kẹt 84l10: 4 ca / 22 đợt (157–178) ≈ 18%.
## D3. Câu hỏi mở (chưa có câu trả lời — giao các đợt sau; Q3 ĐÃ ĐÓNG, ĐỀ XUẤT MỞ RỘNG Ở F-178-T8-6)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — ca thứ tư (W2-setup) cũng là evaluate treo, không phải vòng poll; Q3 không ghi được state ca này.
- **Q2 — Lib hệ thống hay engine?** **THU HẸP MẠNH:** libs 6/6 + GST 1624 đầy đủ trên #93; Chromium 3/3 PASS cùng boot/cùng RAM → kẹt là WebKitGTK-specific, không phải lib hệ thống.
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 178 — heartbeat đúng ở Chromium (W2 5 tick, E4 0 tick); WebKit 0 tick vì kẹt trước vòng W2 (lỗ hổng phủ sóng — F-178-T8-6).** Chờ ca thứ năm HOẶC mở rộng Q3 sang setup.
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — chỉ tương quan thời điểm (3 kẹt cùng evaluate treo + probe TIMEOUT trong một buổi).
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 22 đợt).
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 178 (3 KẸT MỚI, CÙNG CHỮ KÝ; H3 ỦNG HỘ MẠNH — LẦN ĐẦU CÓ ĐỐI CHỨNG SẠCH CÙNG BOOT)

## B1. Trạng thái giả thuyết sau đợt 178 (H3 ỦNG HỘ MẠNH — 3 kẹt mới cùng chữ ký)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên, mạnh hơn)** — avail min 265 MB lúc 85m4 kẹt, NHƯNG Chromium 3/3 PASS cùng cửa sổ RAM — RAM thấp không giải thích kẹt WebKit-only.
- **H2 "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (đứng nguyên)** — balloon 96,7% trần lúc kẹt nhưng Chromium không kẹt cùng điều kiện.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH — 3 KẸT MỚI CÙNG CHỮ KÝ** (evaluate treo + probe TIMEOUT + browser sống), Chromium 3/3 PASS đối chứng cùng boot — bằng chứng mới mạnh nhất cho H3 kể từ đợt 127; giao parent/T10 quyết có mở điều tra H3 riêng không.
- **H3-D1 "Process WebKit bị kẹt tự ăn thêm RAM/CPU": BÁC BỎ (đứng nguyên; RSS lúc kẹt 221–262 MB — bình thường, không tăng).**
- Đợt 178 T8 chỉ giám sát thụ động H3: **3 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy O8** (đều trên #93, qua gate (b)) + **0 kẹt trong 3 lần chạy harness Chromium + 0 kẹt pilot Chromium**. Không mở giả thuyết mới. **Điều kiện mở điều tra H3 KHÔNG đạt theo nghĩa cũ** (quyết (i) đợt 158 yêu cầu 85m4 P4-lần3 tái diễn lần 3 — đợt này 85m4 chết ở P1-phaseA, P4 chưa chạy).
## B3. Chữ ký kẹt — đợt 178: 3 KẸT (đối chiếu đợt 175: 86n2 kẹt exit 124 tại waitForPlaySync-P1, 901 s, probe TIMEOUT; đợt 178: 3 kẹt exit 124, mỗi pha 901–903 s, probe TIMEOUT cả 3; browser sống RSS 221–262 MB cả 3).

---

# §E — CHECKLIST (o) ĐỢT 178 (quyết (o) đợt 177 + các F-177 còn lại — 21/21, 0 mục bỏ sót)

- o1. F-177-T0-1 (gap #88→#89 1.329 s) — **GHI NHẬN**; gap #91→#92 = 6.827 s, #90→#91 = 7.031 s.
- o2. F-177-T0-3 + run 176 cf 8 s — **ĐÓNG** (parent (n) 177); MỚI: run 177 SUCCEEDED 11:09:57Z, cf 7 s — thuộc T7-178.
- o3. F-177-T1-1/F-177-T1-2 (lệch prose 1.294/1.296) — **GHI NHẬN**; thuộc T1-178 (đã đóng cờ).
- o4. F-177-T1-3 (boot mới sau T10 đóng) — **LẶP LẠI:** #92 sau T10-177 (đã xác minh); #93 chờ T0-179.
- o5. F-177-T1-4 (RAM dao động) — **GHI NHẬN**; 178: avail 265–1.416 MB trong harness, balloon ghim trần (thuộc T9).
- o6. F-177-T4-2 (check-classb đếm n thừa 1) — **ĐÃ SỬA** (T4-177); 178: 0 vi phạm F-175-T4-2 (chuỗi 0 vi phạm 3 đợt — cờ T4-178).
- o7. F-177-T4-3 (X193 của chính T4) — **GHI NHẬN**; T4-178 không báo lặp lại.
- o8. F-177-T5-1 (watcher overlap +3 s) — **LẶP LẠI DẠNG MỚI:** watcher-177 chết theo #91, poll cuối +17 s (F-178-T5-1, mẫu thứ 9); watcher-178 chết theo #93 (thuộc T5-179).
- o9. F-177-T5-2 (ledger ts) — **LẶP LẠI:** F-178-T5-2 (mang sang #92, lần 5 liên tiếp).
- o10. F-177-T5-3 (lệch btime 11 s) — **GHI NHẬN** (who -b chỉ cho phút; F-175-T5-3 VẪN ĐÓNG).
- o11. F-174-T5-6 KHÔNG áp dụng — **GHI NHẬN** (T5-178).
- o12. F-177-T6-1 (suite/harness chồng pha) — **GHI NHẬN**; 178: harness T8 SAU T4 đóng cờ (13:29:50Z > 13:25:57Z).
- o13. F-177-T6-4 (mâu thuẫn poll=0) — **GHI NHẬN** (thuộc T6; T6-178 đã đóng cờ).
- o14. F-177-T6-5 (watcher chưa chạy lúc snapshot) — **GHI NHẬN**.
- o15. F-177-T7-1 (sleep bị SIGTERM) — **LẶP LẠI DẠNG MỚI:** sleep T7 bị giết theo #93 (thuộc T7-178; T7 chưa đóng cờ lúc T8 đóng).
- o16. F-177-T7-4 (lỗi nhãn T0-176/T0-177) — **GHI NHẬN** (thuộc T7).
- o17. F-177-T7-5 (tuổi run cộng thừa 600 s) — **ĐÃ SỬA** (aggregate §7 đợt 177 đã sửa).
- o18. F-177-T8-1..8 — **ĐÃ THỰC HIỆN** (xem §8; F-177-T8-7 TRIỂN KHAI ở §F).
- o19. Quyết (o) 177 (cửa slot LÀNH lần 3; HB 44/453, DR 51/299 thiếu lũy kế) — **GHI NHẬN**; số mới thuộc T7-178 (chưa đóng cờ).
- o20. Quyết (l) 152 (hạn cờ; marker; gap) — **ĐÃ THỰC HIỆN:** marker sống 44 reboot #49–#92; T8 đóng TRỄ hạn cờ (~14:3xZ), TRONG hạn cứng ~14:35Z.
- o21. Quyết (j) 177 (F-177-T8-7 phương án A — parent ĐÃ DUYỆT) — **ĐÃ TRIỂN KHAI (§F):** file hb128 tạo xong + pilot Chromium sạch; pilot WebKit hoãn (F-178-T8-7); driver chưa đổi — chờ parent quyết tiếp.
# §F — TRIỂN KHAI F-177-T8-7 PHƯƠNG ÁN A — BẢN COPY CHẨN ĐOÁN 86n2-hb128: TẠO XONG + PILOT CHROMIUM SẠCH; DRIVER CHƯA ĐỔI

- **File mới `apps/web/scripts/clicktest-86n2-webkit-w7-hb128.mjs`** (md5 `1e3a1612`, 41.196 B): copy 100% logic gốc (`628088bd`, 684 dòng), CHỈ thêm `hbStart` + 3 điểm gắn (`waitForPlaySync` dòng 266 — điểm kẹt đợt 175; `sampleFor`; `waitForNotSeeking`), đều `try/finally { hbStop(); }`. **File gốc KHÔNG sửa.** `node --check` PASS. Builder: `round178-t8/build-86n2-hb128.py`.
- **Không đổi ngưỡng (120 s, run_len ≥3), (f') V1-300, ngân sách diag (≤2 lần/lần chạy, cách nhau ≥240 s), timeout 900 s — diag-only.** Khối FRESH-CONTENT generic — pilot Chromium chứng minh áp dụng được cho 86n2-hb128 (21 dòng HB128, check-fresh OK maxspan=10 s).
- **Pilot live Chromium-only (14:23:33–14:27:27Z): SẠCH.** Verdict P1–P5 GIỐNG HỆT bản chuẩn (P1/P2/P3 PASS; P4 +1/+2/+1 vs chuẩn +1/+1/+1; P5 PASS 0 restart; KẾT QUẢ KHÔNG FAIL; ok=True cả hai). 21 dòng HB128 (P1-phaseA 4, P2-phaseB 3, P3-control 4, P5-phaseB-long 8, P6-after-landing 2; 0 waitForPlaySync — đồng bộ <5 s). **+2 artifact ở P4-lần2** (cùng dạng đợt 176) — KHÔNG đổi verdict.
- **Pilot WebKit HOÃN (không hủy):** evaluate WebKit chết 3/3 pha trên #93; chạy = timeout 900 s + vỡ hạn cứng 14:35Z. Hoãn sang đợt 179 — parent quyết.
- **Driver harness CHƯA đổi sang hb128** (vẫn bản chuẩn `628088bd`). Parent quyết tiếp: (1) đổi driver từ đợt 179 (2 dòng ×2 engine) + mở phạm vi (c')/(f') cho 86n2; hay (2) giữ nguyên. Rollback 1 dòng/lần chạy ×2 engine.
- **Chi phí:** hb128 +2.002 B so với gốc (39.194 → 41.196 B), vẫn oversize (cần ENABLE_PRIVSEP=0). Run sạch Chromium: +21 dòng HB128/log, 0 FP, 0 ảnh hưởng verdict. Rủi ro setInterval — đã có `finally { hbStop(); }` cả 3 điểm (pilot exit=0).
- **Hiệu quả:** nếu 86n2 kẹt lại ở P1 dạng đợt 175: (c') TRIGGER @~125 s hoặc (f') @~305 s thay vì chỉ biết ở timeout 901 s — NHƯNG pilot WebKit chưa chạy nên chưa chứng minh live trên WebKit; mới chứng minh trên Chromium + offline replay (đợt 177).
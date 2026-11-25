# Đợt 179 T8 — WEBKIT 2/3: 85m4 KẸT MỚI (resetPlayhead0:320); CHROMIUM 3/3; O8 PASS 3/3; PILOT 86n2-hb128 WEBKIT SẠCH; DIAG W2-SETUP CHẠY ĐƯỢC; REBOOT #95 GIỮA PHIÊN

Ngày: 23/11/2026 (lượt cron 00:35 +07 = 17:35:51Z; T8 mở ~17:41Z, đóng ~19:2xZ — TRONG hạn cờ ~20:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness vite 6/6; (2) giám sát (f') V1 live; (3) Q3 heartbeat 84l10; (4) O8 trên boot đo; (5) checklist (o); (6) H3 chỉ giám sát thụ động; (7) pilot 86n2-hb128 WebKit (nợ đợt 178); (8) TRIỂN KHAI F-178-T8-6 (bản copy chẩn đoán 84l10-w2setup-hb128 — parent DUYỆT THỬ (j) đợt 178); (9) F-178-T8-9 (đổi tên entry replay) + F-178-T8-8 (symlink diag) + F-178-T8-10 (process sót + cờ đúng hạn).
Nợ: LIMITS T8-178 (WebKit 0/3 trên #93; (c') trigger live lần đầu @125 s; pilot Chromium sạch, WebKit hoãn; LIMITS 45.247 B VƯỢT giới hạn push).

## 0. Kết luận ngắn — WEBKIT 2/3 (1 KẸT MỚI), CHROMIUM 3/3; CHUỖI FULL PASS GIỮ 0; PILOT WEBKIT SẠCH

- **#94 XÁC NHẬN 9 nguồn (T0-179)**: boot `ae2a9a47`, btime 17:17:09Z, gap #93→#94 = 14.974 s. **#93 XÁC NHẬN** (nợ 178 đã trả). Marker sống qua **46 reboot #49–#94**. **#95 MỚI GIỮA PHIÊN** (boot `95b483a2`, btime 19:10:22Z, gap 6.793 s; số hiệu chờ T0-180) — giết diag attempt 1 lúc ~19:10:48Z; root CÒN NGUYÊN (libs 6/6, GST 269, dpkg 1.265), chỉ /tmp bị wipe + process chết (§6).
- **T4-179: lượt yên #48 — chuỗi 41 → 42** (attempt1 20/20 + B 5/5 + median 49,5 ms; cửa mở 18:09:31Z; attempt 18:09:31–18:13:27Z; ngân sách 1/3). **POSTBOOT_PASS #94 ĐÃ CÓ 18:03:08Z** (repair-sớm-quyết-h, poll=1, **CÓ caveat repair** — GST qua symlink debroot 269=269, tools CHƯA cài, libc-bin 8.9). **#93 KHÔNG CÓ cờ — ĐÃ XÁC NHẬN; tổng boot không cờ 19 → 20.**
- **Harness (MỘT lần chạy driver duy nhất, boot #94): WebKit 2/3 — 84l10 PASS (70 s), 85m4 KẸT exit 124 (15'03"), 86n2 PASS (4'00"); Chromium 3/3 PASS. Kẹt cộng dồn 24 → 25. Chuỗi "P3 không kẹt" 2 → 3** (P3 PASS, kẹt ở resetPlayhead0 trước P5). **86n2-P1 KHÔNG kẹt lần thứ tư liên tiếp.**
- **85m4 kẹt ở điểm MỚI — resetPlayhead0:320** (sau P4-lần3 PASS +1/+1/+1; P1/P2/P3 PASS). WATCHDOG-137 18:35:00Z + probe TIMEOUT 18:35:30Z + live-diag ×2; browser sống (RSS 371 MB). **(c') BỎ LỠ kẹt này (F-179-T8-5)** — kẹt GIỮA các vùng có heartbeat, 0 dòng HB128 trong lúc kẹt; bắt được nhờ watchdog (i) + live-diag (1b).
- **O8 T8 PASS 3/3 trên #94**: WebKit 21/21 ×2 (pid 75829 `89b86b59` + pid 76194 `6605ef73`) + Chromium 21/21 (pid 76650 `41a7200d`), exit 0, 18:27:17–18:29:48Z (2'31"). Gate (a) — POSTBOOT_PASS #94 (repair, có caveat). O8 T0 trên #94 cũng PASS 3/3 (18:06:38–18:09:23Z; bàn giao sạch cho T4).
- **Pilot 86n2-hb128: WEBKIT SẠCH (lần đầu live trên WebKit) + Chromium SẠCH** — verdict P1–P6 GIỐNG HỆT bản chuẩn cả hai engine (P4 +1/+1/+1, không còn artifact +2), 21 dòng HB128 mỗi engine, check-fresh OK (W 5 s, C 10 s). **Driver harness GIỮ NGUYÊN** (quyết (j) đợt 178) — parent quyết có đổi sang hb128 từ đợt 180 không.
- **F-178-T8-6 (diag W2-setup): file mới `84l10-w2setup-hb128.mjs` (md5 `3d41b015`, 36.113 B; `node --check` PASS; gốc `baaa13c0` KHÔNG đổi).** Lần 1 trên #94: setup NHANH (0 tick), W2 PASS, E4 KẸT ĐANG DIỄN RA (n=10, playhead 0.633) rồi bị #95 giết (không exit code). Lần 2 trên #95: PASS exit 0 (71 s). **Ca kẹt setup CHƯA tái hiện.**
- **(c')/(f') V1: live 0 kích hoạt (kẹt 179 ngoài phủ sóng — F-179-T8-5); replay C5.1 ĐẠT** (kẹt-164 @125 s, kẹt-178 TRIGGER, **0 FP trên 13 log sạch thật**; kẹt-179 BỎ LỠ). **(c') + (f') ĐƯỢC GIỮ. Q3 84l10: WebKit W2 6 tick + E4 0 (PASS); Chromium W2 5 + E4 0 — đúng thiết kế.** 84l10 PASS lại sau kẹt 178.
- **H3: CHỈ GIÁM SÁT THỤ ĐỘNG — 1 kẹt mới (điểm mới, WebKit-only); 86n2-P1 KHÔNG kẹt (điều kiện xem lại H3 theo (j) đợt 178 KHÔNG đạt); H3-D1 tiếp tục bị bác bỏ** (RSS 371 MB). **Watchdog (i): 3 dòng (1 kẹt thật); live-diag (1b): 2; (1c')/(f'): 0.** 4 snapshot stall trong round179-t8/smoke/ (đúng thư mục). RAM sampler n=57: balloon max 95,2% trần, 0 ghim; avail min **314 MB @18:43:35Z**.
- **Boot lúc đo = `ae2a9a47` (#94) — 0 reboot trong phiên đo. Boot lúc đóng cờ: `95b483a2` (#95).** T7/T9 CHƯA đóng cờ lúc #95. **X11 TRỐNG lúc mở + lúc đóng; 0 process sót lúc kiểm cuối** (F-178-T8-10: process sót đợt 178 đã chết theo #94). Lock vite TRỐNG; fixture md5 khớp. Selfcheck: #1 (libs 1/6, dpkg 2 — TRƯỚC replay); #2 sau gate (libs 6/6, GST 269, dpkg 795).

## 1. Dòng thời gian (gọn)

- 17:17:09Z **REBOOT #94** (boot `ae2a9a47`, gap #93→#94 = 14.974 s; **T0-179 XÁC MINH 9 nguồn**) — trước đợt mở 18'.
- 17:35:51Z Đợt 179 mở (lượt cron 00:35 +07). 17:41–17:47Z T8 mở: đọc LIMITS T8-178 + GAP §11 + quyết §12.3; cây + 8 script KHỚP md5 đợt 178; copy driver 178→179 + đổi nhãn (waiter deadline → 19:30Z, replay thêm entry 179 + **đổi tên 178-sạch→178-ket (F-178-T8-9)**); **symlink diag goals → round179-t8 lúc 17:46Z (F-178-T8-8)**; tạo `84l10-w2setup-hb128.mjs` (md5 `3d41b015`, 36.113 B; `node --check` PASS; gốc KHÔNG đổi); **selfcheck #1: libs 1/6, GST-inspect 0, dpkg 2**; fixture /tmp MẤT theo #94; **mở: 0 process sót, X11 trống, lock trống (F-178-T8-10)**.
- 17:47:31Z Waiter bắt đầu (deadline 19:30Z); T4 poll-wait (gate0 CHƯA ĐẠT — apt replay đang chạy; RAM avail tụt 1.732 → 447 MB).
- 18:03:08Z **POSTBOOT_PASS #94 ĐÃ CÓ** (T5-179, repair-sớm-quyết-h, poll=1, CÓ caveat repair); dpkg 2 → 795. 18:04–18:07Z waiter postboot=1 (đường a); RAM hồi 1.535 MB; T0 O8 PASS 3/3 (18:06:38–18:09:23Z).
- 18:09:31Z **Cửa yên mở (poll #34 T4, RAM 1.535 MB) → T4 attempt1 chạy NGAY** (0 chồng O8 — T0 nhả lock 8 s trước). 18:13:27Z **attempt1 XONG: 20/20 + B 5/5 + median 49,5 ms — LƯỢT YÊN #48 (chuỗi 41 → 42)**.
- 18:25:35Z **GATE-FOUND poll=39 (cờ T4 + POSTBOOT_PASS #94, đường a)**. 18:26:35Z selfcheck #2 (libs 6/6, GST files 269, dpkg 795) + rebuild fixture (md5 khớp).
- 18:27:17–18:29:48Z **O8 T8 PASS 3/3 trên #94** (§A). 18:31:04–18:59:30Z **Harness: WebKit 2/3 + Chromium 3/3** (§2). 19:00:04–19:08:15Z **Pilot 86n2-hb128: WebKit SẠCH + Chromium SẠCH** (§F).
- 19:08:52–~19:10:48Z **Diag w2setup lần 1 trên #94: W2 PASS, E4 KẸT ĐANG DIỄN RA — BỊ REBOOT #95 GIẾT (không exit code)**. 19:10:22Z **REBOOT #95** (boot `95b483a2`, gap 6.793 s; số hiệu chờ T0-180).
- 19:14:36Z T8 khởi động lại sau #95: nhả lock vite STALE của diag lần 1 (giữ 341 s); libs 6/6 + GST 269 CÒN (root persistent), /tmp bị wipe → rebuild fixture (md5 khớp). 19:15:25–19:16:39Z **Diag lần 2 trên #95: PASS exit 0 (71 s)**.
- ~19:17–19:2xZ Trích số liệu + replay; **cập nhật symlink thứ hai `apps/web/scripts/t8-diag-stall.sh` → round179-t8 lúc 19:18Z** (stale từ đợt 177 — F-179-T8-8); viết LIMITS + paths + cờ TRƯỚC hạn cờ ~20:00Z.

## A. O8 — PASS 3/3 trên boot `ae2a9a47` (#94); CHUỖI FULL PASS GIỮ 0

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 18:27:17–18:28:08 | 0 | **21/21 PASS** — S1 PASS, pid 75829, md5 `89b86b59` |
| 2 | O8 WebKit attempt2 | 18:28:08–18:28:58 | 0 | **21/21 PASS** — S1 PASS, pid 76194, md5 `6605ef73` |
| 3 | O8 Chromium (đối chứng) | 18:28:58–18:29:48 | 0 | **21/21 PASS** — S1 PASS, pid 76650, md5 `41a7200d` |

- Report JSON kiểm độc lập bằng python: 3× 21/21 (n=21, ok_true=21). **BA FILE STAMPED RIÊNG BIỆT.** 0 `HARNESS LỖI` / `Target crashed` / `WATCHDOG-137` trong log O8 (PASS S1 6 dòng, FAIL S1 0).
- **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH`). Bằng chứng "WebKit chạy bằng system libs" là harness 84l10/86n2 PASS + W1 ×3 PASS trên cùng boot đo (#94), libs 6/6 — **ĐẦY ĐỦ cho O8; KHÔNG đầy đủ cho harness WebKit (2/3)**.
- **Gate cho boot đo `ae2a9a47`: (a) CÓ — POSTBOOT_PASS #94 18:03:08Z (repair-sớm-quyết-h, poll=1, CÓ caveat repair — GST qua symlink debroot, tools CHƯA cài).** O8 T8 chạy sau gate (a) + cờ T4 (GATE-FOUND 18:25:35Z). Caveat ghi rõ — parent/T10 quyết giá trị chân gate cho chuỗi FULL PASS (tiền lệ #90 repair-caveat).
- **Chuỗi WebKit FULL PASS: GIỮ 0** (đã đứt 26 → 0 ở đợt 178; đợt này harness WebKit 2/3 nên chuỗi không lên 1). 4 chân: lượt yên #48 trên #94; gate (a) #94 (repair, caveat); O8 T0 PASS 3/3 trên #94; O8 T8 PASS 3/3 trên #94. **T8 KHÔNG đề xuất gì khác — parent/T10 quyết.** O8 đợt này 2'31" tổng (178: 2'37", 177: 2'54").

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: WebKit 2/3, Chromium 3/3

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 18:31:08–18:32:18 | **PASS** — W1 +1/+1/+1, W2 PASS, E4 PASS; HB128: W2 6, E4 0 — **Q3 đúng thiết kế** |
| 2 | WebKit 85m4 | 124 | 18:32:33–18:47:36 | **KẸT — resetPlayhead0:320 (điểm MỚI, sau P4-lần3 PASS)**; P1/P2/P3 PASS, P4 +1/+1/+1; WATCHDOG 18:35:00Z + probe TIMEOUT; live-diag ×2; **(c') 0 kích hoạt (F-179-T8-5)** |
| 3 | WebKit 86n2 | 0 | 18:47:52–18:51:52 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**, P6 KHÔNG-KẸT; **86n2-P1 KHÔNG kẹt lần thứ tư liên tiếp** |
| 4 | Chromium 84l10 | 0 | 18:52:08–18:53:08 | **PASS** — W1 +1/+1/+1, W2 PASS, E4 PASS; HB128: W2 5, E4 0 |
| 5 | Chromium 85m4 | 0 | 18:53:24–18:55:24 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**; HB128 19 dòng |
| 6 | Chromium 86n2 | 0 | 18:55:40–18:59:30 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart** |

- 6 report JSON kiểm độc lập: WebKit 84l10 ok=True, 85m4 ok=False (finishedAt 18:47:33Z), 86n2 ok=True; Chromium 3× ok=True.
- Môi trường: system libs trên boot `ae2a9a47` (selfcheck #2 libs 6/6 + GST files 269 + dpkg 795; replay xong trước O8). **WebKit launch + W1 ×3 PASS bằng system libs** trên ĐÚNG boot đo — kẹt là evaluate treo giữa pha, không phải thiếu lib.
- **Harness 28'26"** (18:31:04–18:59:30Z) — ngắn hơn đợt 178 (53'17") vì chỉ 1 timeout 900 s.
- **Đối chứng Chromium cùng pha: N cộng dồn N=41 mỗi pha** (đợt 137/139/141–179 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt.
- **Kẹt cộng dồn 24 → 25** (1 kẹt mới, điểm mới). P4 85m4 +1/+1/+1 cả 3 lần (chết ở resetPlayhead0 sau P4, không đếm P4); 84l10 PASS lại sau kẹt 178; 86n2-P1 PASS lần thứ tư liên tiếp (176–179).

### Chữ ký kẹt 85m4 đợt này (so với 178: cùng họ, khác điểm)

| Điểm | 85m4 đợt 179 |
|---|---|
| Call-site kẹt | resetPlayhead0:320 (giữa P4 và P5 — evaluate reset playhead về 0 trước pha P5) |
| WATCHDOG-137 | 18:35:00Z (im lặng >60 s) |
| Probe 1+1 | TIMEOUT 30 s (18:35:30Z — kênh evaluate chết / page JS chết) |
| Browser lúc kẹt | sống, WebKitWebProcess RSS 371 MB (dump WATCHDOG), MiniBrowser 293 MB |
| RAM lúc kẹt | avail 1.036 MB @WATCHDOG, 881 MB @timeout; swap 447 MB; Balloon 5.233.996 kB @timeout |
| Pha con đã PASS trước kẹt | P1 (đồng bộ 0,7 s), P2, P3, P4-lần1/2/3 (+1/+1/+1) |

- **Không phải OOM-kill** (browser sống, RSS 371 MB; H3-D1 TIẾP TỤC BÁC BỎ). **Không phải thiếu lib** (libs 6/6, GST 269). Nghi ngờ: kênh evaluate WebKitGTK chết giữa pha dưới áp lực RAM/swap — thuộc H3 (§B).
- **Điểm kẹt MỚI (resetPlayhead0:320)** — không phải P1-phaseA (178), P4-lần1 (171), W2-setup (178). Kẹt WebKitGTK dời điểm theo từng đợt — ủng hộ H3 "treo kênh evaluate" hơn lỗi ở một pha cụ thể.

## 3. Watchdog + 4 bước kiểm — 3 DÒNG (1 KẸT THẬT) + LIVE-DIAG 2 + (1c') 0 KÍCH HOẠT (BỎ LỠ — F-179-T8-5)

- **Watchdog (i): 3 dòng WATCHDOG-137 (1 pha × 3) — ĐÚNG** (1 kẹt thật, 0 FP). **Live-diag (1b): 2 kích hoạt (85m4 ×2) — ĐÚNG** (im lặng 125 s @18:37:35Z + 366 s @18:41:36Z). **(1c')/(f') V1: 0 kích hoạt live — BỎ LỠ kẹt thật 85m4 (F-179-T8-5)** — kẹt GIỮA P4 và P5, khi mọi heartbeat đã dừng; 0 dòng HB128 trong lúc kẹt. Bắt được nhờ (i) + (1b), không nhờ (c').
- 4 snapshot stall (1 timeout124 + 2 live-silence + 1 watchdog-dump) trong round179-t8/smoke/ — **ĐÚNG THƯ MỤC** (symlink cập nhật trước harness, F-178-T8-8). Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–178).
- **(1)** Watchdog chẩn đoán trong 3 script (VÁ 142, GIỮ NGUYÊN 143–179) + `t8-diag-stall.sh` → 179 (cả hai symlink — §5). 6 harness + 3 O8 + 2 pilot + 2 diag; **1 kẹt thật → 3 dòng, 0 FP — ĐÚNG.** **(1b)** Driver canh im lặng >120 s, tối đa 2 lần/lần chạy, ≥240 s: `live_diags=2` ở 85m4 WebKit, 0 mọi pha còn lại — **ĐÚNG.** **(1c')** helper check-fresh + khối FRESH-CONTENT trong `run_one`: **0 kích hoạt live (BỎ LỠ kẹt 179); replay C5.1 ĐẠT (§C). (c') + (f') ĐƯỢC GIỮ.**
- **(2)** Cột Balloon vào RAM sampler: n=57, pinned=0, min=4.550.536 max=6.131.500 (95,2% trần) mean=5.600.913; avail min=314 MB @18:43:35Z / max 2.176 MB. **(3)** Đối chứng Chromium cùng pha: **84l10 PASS (18:53:08Z), 85m4 PASS (18:55:24Z), 86n2 PASS (18:59:30Z)** — exit 0 cả 3; N cộng dồn **N=41 mỗi pha** — Chromium 0 kẹt mọi đợt. **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **1 lần kẹt → 1 snapshot timeout124 (đúng)**.

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 KIỂM LẠI: C5.1 ĐẠT (KẸT-178 TRIGGER); (c') BỎ LỠ KẸT-179 (LỖ HỔNG PHỦ SÓNG)

## C1. Thiết kế (c') + (f') V1 (triển khai đợt 173, giữ nguyên đợt 174–179, không đổi code)

- **(c'):** trailing run HB128 **cùng tag + cùng playhead + cùng ct**, kích hoạt khi span ≥ 120 s VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi sub-run `paused=true + seeking=true` đã ≥300 s. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3. **86n2-hb128 pilot: (c')/(f') đã áp dụng live trong pilot cả hai engine (21 dòng HB128 mỗi engine, check-fresh OK) — mở phạm vi chính thức chờ parent quyết (§F).** V2 (f'') giữ làm dự phòng, KHÔNG triển khai.
## C2. Kiểm chứng offline TRƯỚC harness (check-fresh-179t8.py — ~17:4xZ)

| Log | HB128 | check-fresh-179t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng | **TRIGGER elapsed=125 s** (run 5 s→125 s, 25 dòng, span=120 s) |
| 171-ket-85m4 | 174 dòng | **TRIGGER elapsed=305 s** (run 5 s→305 s, 61 dòng, span=300 s — qua (f') MỚI) |
| 177-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 177-sạch 84l10 | 8 dòng | OK maxspan=0 s |

## C3. Replay sau harness (replay-1c-179t8.py + replay-f-fix-179t8.py, ~19:1xZ — sau khi đổi tên F-178-T8-9)

- **(c') V1 (f-fix): kẹt-164 TRIGGER @125 s; kẹt-178 TRIGGER @125 s (TRUE POSITIVE); kẹt-179 KHONG ở mọi variant — C5.1 ĐẠT** (0 FP trên 13 log sạch thật 163/165–177). Kẹt-171 cũng KHONG — (c') hiện tại KHÔNG ĐẠT; (f') V1-180/300/600 và V2 đều ĐẠT, FP 0. **(c') + (f') ĐƯỢC GIỮ.**
- **(f') V1-300: ĐẠT** — kẹt-164 TRIGGER @125 s; kẹt-171 TRIGGER @305 s (V1-300); V1-180: 164@125 s (kẹt-171 KHONG); V1-600: cả hai; V2: cả hai.
- **Kẹt-179 (85m4 WebKit): 0 dòng HB128 trong lúc kẹt — mọi variant đều KHONG (BỎ LỠ — F-179-T8-5).** Bắt được nhờ (i)+(1b), không nhờ (c').
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 8 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY — 84l10 PASS LẠI)

## D1. Phạm vi (parent chốt đợt 171, giữ nguyên tới đợt 179): 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; cùng script `baaa13c0`) + ca 178 W2-setup :443. KHÔNG gộp 85m4-P4 / 86n2-P4-lần3. 86n2-P1 (đợt 175) theo dõi riêng — PASS lần thứ tư liên tiếp (176–179). **Đợt 8: 84l10 PASS (WebKit 70 s + Chromium 60 s).**

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 179 (ĐÚNG CẢ HAI ENGINE)

| Engine | W2 HB128 | E4 HB128 | Kết quả |
|---|---|---|---|
| WebKit | **6 tick** (đợt 178: 0 vì kẹt trước vòng) | **0 tick** | PASS (W1 +1/+1/+1, W2 PASS, E4 PASS ct 4) |
| Chromium | **5 tick** (như đợt 178: 5) | **0 tick** | PASS (ct 3,963 — trùng đợt 178) |

- **Không FP từ Q3** (check-fresh log 84l10 WebKit: OK maxspan=0 s). **Hồ sơ 4 điểm kẹt 84l10:** 157 E4 :457; 170 W2 :433; 171 W2-setup :425; **178 W2-setup :443**. Đợt 179 PASS — không thêm ca mới. **NHƯNG diag attempt 1 ghi được ca kẹt E4 ĐANG DIỄN RA** (§F; n=10 đóng băng, playhead 0.633 — cùng họ E4 :457, KHÔNG đếm vào hồ sơ vì chạy bằng bản copy chẩn đoán).
- **Chuỗi 84l10 PASS: 6 đợt (172–177) ĐỨT ở 178, PASS lại ở 179.** Tần suất kẹt 84l10: 4 ca / 23 đợt (157–179) ≈ 17%.
## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG, mở rộng ở F-178-T8-6 — ĐÃ DUYỆT THỬ, §F)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — ca E4 trong diag attempt 1 cũng là evaluate treo; Q3 E4 ghi được state đóng băng (n=10, playhead 0.633).
- **Q2 — Lib hệ thống hay engine?** **THU HẸP MẠNH:** libs 6/6 + GST 269 đầy đủ trên #94; Chromium 3/3 PASS cùng boot/cùng RAM → kẹt là WebKitGTK-specific.
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 179 — heartbeat đúng cả hai engine; ca E4 trong diag attempt 1: Q3 E4 ghi được state đóng băng đầy đủ.** Chờ ca thứ năm HOẶC mở rộng Q3 sang setup.
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — chỉ tương quan thời điểm.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 23 đợt).
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 179 (1 KẸT MỚI Ở ĐIỂM MỚI; 86n2-P1 KHÔNG KẸT — ĐIỀU KIỆN MỞ H3 KHÔNG ĐẠT)

## B1. Trạng thái giả thuyết sau đợt 179 (H3 ỦNG HỘ — 1 kẹt mới WebKit-only)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — avail min 314 MB lúc kẹt, NHƯNG Chromium 3/3 PASS cùng cửa sổ RAM.
- **H2 "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (đứng nguyên)** — balloon 95,2% trần lúc kẹt nhưng Chromium không kẹt cùng điều kiện.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ — 1 KẸT MỚI ở điểm MỚI (resetPlayhead0:320)** (evaluate treo + probe TIMEOUT + browser sống), Chromium 3/3 PASS đối chứng cùng boot. Điểm kẹt dời theo từng đợt (P1-phaseA → resetPlayhead0) — ủng hộ "treo kênh evaluate" hơn lỗi pha cụ thể.
- **H3-D1 "Process WebKit bị kẹt tự ăn thêm RAM/CPU": BÁC BỎ (đứng nguyên; RSS lúc kẹt 371 MB — bình thường).**
- Đợt 179 T8 chỉ giám sát thụ động H3: **1 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy O8** (đều trên #94, qua gate (a)) + **0 kẹt Chromium/pilot/diag**. Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 178 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS lần thứ tư liên tiếp.** H3 vẫn chỉ giám sát thụ động.
## B3. Chữ ký kẹt — đợt 179: 1 KẸT (đối chiếu đợt 178: 3 kẹt exit 124, mỗi pha 901–903 s, probe TIMEOUT cả 3; đợt 179: 1 kẹt exit 124, 903 s, probe TIMEOUT; browser sống RSS 371 MB).

# §E — CHECKLIST (o) ĐỢT 179 (quyết (o) đợt 178 + các F-178 còn lại — 21/21, 0 mục bỏ sót)

- o1. F-178-T0-1 (gap) — **GHI NHẬN**; gap #93→#94 = 14.974 s, #94→#95 = 6.793 s (#95 chờ T0-180).
- o2. F-178-T0-3 + run 177 cf 8 s — **ĐÓNG** (parent (n) 178); MỚI: run 178 TIMEOUT — thuộc T7-179.
- o3. F-178-T1-1/T1-2 (lệch prose) — **GHI NHẬN**; thuộc T1-179 (đã đóng cờ).
- o4. F-178-T1-3 (boot mới sau T10 đóng) — **LẶP LẠI:** #94 sau T10-178 (đã xác minh); #95 chờ T0-180.
- o5. F-178-T1-4 (RAM dao động) — **GHI NHẬN**; avail 314–2.176 MB, balloon max 95,2% (thuộc T9).
- o6. F-178-T4-2 (check-classb) — **GHI NHẬN**; 0 vi phạm theo T4 (chuỗi đếm lại từ 0 — parent (p) 178; F-179-T4-5 ghi nhẹ, chờ parent).
- o7. F-178-T4-3 (X193) — **GHI NHẬN**; T4-179 không báo lặp lại.
- o8. F-178-T5-1 (watcher overlap) — **GHI NHẬN**; khoảng không-watcher ~16.921 s (thuộc T5-179).
- o9. F-178-T5-2 (ledger ts) — **GHI NHẬN** (thuộc T5-179).
- o10. F-178-T5-3 (lệch btime 11 s) — **GHI NHẬN** (F-175-T5-3 VẪN ĐÓNG).
- o11. F-174-T5-6 KHÔNG áp dụng — **GHI NHẬN** (T5-179: #94 là repair-sớm).
- o12. F-178-T6-1 (chồng pha) — **GHI NHẬN**; harness T8 SAU cờ T4; O8 T0 bàn giao sạch cho T4.
- o13. F-178-T6-4 (mâu thuẫn poll=0) — **GHI NHẬN** (thuộc T6; T6-179 đã đóng cờ).
- o14. F-178-T6-5 (watcher chưa chạy lúc snapshot) — **GHI NHẬN**.
- o15. F-178-T7-1 (sleep bị SIGTERM) — **GHI NHẬN**; T7-179 chưa đóng cờ lúc #95.
- o16. F-178-T7-4 (lỗi nhãn T0-176/T0-177) — **GHI NHẬN** (thuộc T7).
- o17. F-178-T7-5 (tuổi run cộng thừa 600 s) — **GHI NHẬN** (thuộc T7).
- o18. F-178-T8-1..10 — **ĐÃ THỰC HIỆN** (xem §8; F-178-T8-6 ở §F; F-178-T8-9/-8/-10 ĐÃ XONG).
- o19. Quyết (o) 178 (cửa slot LÀNH lần 4; HB 44/459, DR 51/302) — **GHI NHẬN**; số mới thuộc T7-179 (chưa đóng cờ).
- o20. Quyết (l) 152 (hạn cờ; marker; gap) — **ĐÃ THỰC HIỆN:** marker 46 reboot; T8 đóng TRONG hạn cờ.
- o21. Quyết (j) 178 (driver GIỮ NGUYÊN; F-178-T8-6 DUYỆT THỬ; pilot WebKit; H3 giám sát) — **ĐÃ THỰC HIỆN (§F)**.
# §F — TRIỂN KHAI F-178-T8-6 (DUYỆT THỬ) + PILOT 86n2-hb128 WEBKIT: CẢ HAI XONG; DRIVER CHƯA ĐỔI

- **File mới `clicktest-84l10-webkit-w2setup-hb128.mjs`** (md5 `3d41b015`, 36.113 B): copy 100% logic gốc (`baaa13c0`, 601 → 619 dòng), CHỈ thêm biến `lastW1` + bọc evaluate setup W2 (dòng 443 gốc) trong `try/finally { hbStop(); }`. **File gốc KHÔNG sửa.** `node --check` PASS. Builder: `round179-t8/build-84l10-w2setup-hb128.py`. Không đổi ngưỡng (120 s, run_len ≥3), (f') V1-300, ngân sách diag (≤2 lần/lần chạy, ≥240 s), timeout 300 s cho diag (thay vì 900 s).
- **Diag lần 1 trên #94 (19:08:52–~19:10:48Z): KHÔNG CÓ EXIT CODE — BỊ REBOOT #95 GIẾT.** W2-setup NHANH (0 tick); W2 PASS (playhead 30, Δ=0); **E4 KẸT ĐANG DIỄN RA: 11 dòng HB128 `sampleFor E4`, n=10 đóng băng, playhead=0.633/ct=0.634, playing=true, elapsed 5 s→55 s (span 50 s < 120 s — (c') CHƯA kịp trigger); check-fresh OK maxspan=50 s.** Log lần 1 lưu ở `smoke/attempt1/`. Caveat: kẹt E4 bắt đầu ~19:09:58Z, #95 btime 19:10:22Z — ghi cả hai mốc, không kết luận tiền lệ host-side.
- **Diag lần 2 trên #95 (19:15:28–19:16:39Z): SẠCH, exit=0 (71 s).** W1 ok + W2 PASS + E4 ok, ok=True. 6 dòng HB128 (toàn `sampleFor W2`); **0 tick `W2-setup`**. Ghi rõ: đo trên #95 (chưa xác minh, KHÔNG có POSTBOOT_PASS #95, libs 6/6 còn do root persistent, fixture rebuild md5 khớp) — chỉ chứng minh bản copy chạy được, KHÔNG dùng làm chân chuỗi.
- **Kết luận F-178-T8-6: ca kẹt setup CHƯA tái hiện — phủ sóng setup VẪN CHƯA được chứng minh live.** Tác dụng phụ: lần 1 ghi được state đóng băng E4 qua Q3. Parent quyết tiếp (§9.5).
- **Pilot 86n2-hb128: WEBKIT SẠCH + CHROMIUM SẠCH — LẦN ĐẦU CHỨNG MINH LIVE TRÊN WEBKIT.** WebKit exit=0 (4'02"); Chromium exit=0 (~3'51"). Verdict P1–P6 GIỐNG HỆT bản chuẩn cả hai engine (P4 +1/+1/+1 — KHÔNG còn artifact +2; P5 PASS 0 restart; P6 KHÔNG-KẸT; ok=True cả bốn). 21 dòng HB128 mỗi engine (P1 4, P2 3, P3 4, P5 8, P6 2; 0 waitForPlaySync). check-fresh: W 5 s, C 10 s (0 FP).
- **Driver harness CHƯA đổi sang hb128** (vẫn `628088bd`, quyết (j) đợt 178). Parent quyết: (1) đổi driver từ đợt 180 (2 dòng ×2 engine) + mở phạm vi (c')/(f') cho 86n2; hay (2) giữ nguyên. Rollback 1 dòng/lần chạy ×2 engine.
- **Chi phí:** hb128 +2.002 B (39.194 → 41.196 B), vẫn oversize (cần ENABLE_PRIVSEP=0); w2setup-hb128 +1.233 B (34.880 → 36.113 B), DƯỚI giới hạn push. Run sạch: +21 dòng HB128/log (86n2), +0–6 dòng (84l10 W2), 0 FP, 0 ảnh hưởng verdict.

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` 610ee003; `86n2` 628088bd; **`86n2-hb128` 1e3a1612** (đợt 178, không đổi); **`84l10-w2setup-hb128` — MỚI, md5 `3d41b015` (36.113 B, F-178-T8-6)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e. Tất cả không đổi trừ file w2setup-hb128 mới.
- **T8 chỉ thêm 2 file repo đợt này: LIMITS này + `clicktest-84l10-webkit-w2setup-hb128.mjs`.** Driver đổi so với 178: nhãn/lock → `179`/`t8-round179`, deadline waiter → **19:30Z 23/11**, replay thêm entry 179 + đổi tên 178-sạch→178-ket. Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round179-t8/`**.
- Extract: glob TẤT CẢ log waiter (1 file, 38 poll + GATE-FOUND poll=39; postboot=1: 22 dòng); **0 REBOOT trong lúc waiter chạy** (exit 0 sau GATE-FOUND 18:25:35Z).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN + PHÁT HIỆN THÊM.** Symlink goals cập nhật → round179-t8 lúc **17:46Z, TRƯỚC harness** → 4 dump stall rơi ĐÚNG round179-t8/smoke/. **Phát hiện thêm (~19:18Z): symlink thứ hai `apps/web/scripts/t8-diag-stall.sh` vẫn trỏ round177-t8 (từ 08:40 23/11) — đã cập nhật → round179-t8 lúc 19:18Z.** Không script nào dùng symlink thứ hai (DIAG137_SCRIPT đều trỏ đường goals) — chỉ vệ sinh, không mất dữ liệu. Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink.
- **F-178-T8-9 (đổi tên replay): ĐÃ THỰC HIỆN.** Entry `178-sach-85m4` → `178-ket-85m4` trong cả hai replay script (đường dẫn về log đợt 178 thật); C5.1 nay **ĐẠT** (xem §C). Thêm entry `179-ket-85m4` (log kẹt đợt 179 — BỎ LỠ, F-179-T8-5).

## 6. Dọn dẹp + kiểm cuối — sạch (trừ reboot #95 xen giữa)

- Driver O8 nhả lock 18:29:48Z; harness nhả lock sau mỗi lần chạy (xong 18:59:30Z); pilot nhả lock 19:08:15Z. **Driver diag lần 1 CHẾT theo #95 (lock stale t8-round179, giữ 341 s) — T8 nhả tay 19:14:36Z** (holder đã chết, không vite nào chạy, curl cổng 5390 = 000); lock TRỐNG lúc kiểm cuối.
- Kiểm cuối ~19:2xZ (trên #95): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG (0 ticket + 102 cooldown); `/tmp/.X11-unix/` TRỐNG — **X194/X195 KHÔNG tái xuất (lần thứ ba liên tiếp)**.
- Fixture /tmp: rebuild lần 1 trên #94 (md5 khớp: `a1fb8549` / `fbaa3d1a`); **rebuild lần 2 trên #95 sau khi /tmp bị wipe (md5 khớp y hệt)**.
- **Reboot #95 (boot `95b483a2`, btime 19:10:22Z, gap #94→#95 = 6.793 s):** giết diag attempt 1 (log dừng 19:10:48Z, không exit code) + service restart của T8 (1 tool call lỗi "service restarted"). **Khác mẫu trước: root filesystem CÒN NGUYÊN sau #95** (libs 6/6, GST 269, dpkg 1.265 — đối chiếu #92/#93/#94 đều về libs 1/6 + dpkg 2 sau reboot); chỉ /tmp bị wipe (tmpfs) + process chết. **Số hiệu #95 CHỜ T0-180; (m) #95 + INSIDE #95 thuộc T2-180.** T7/T9 chưa đóng cờ lúc #95 — thuộc T7-179/T9-179 + T10-179.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 + harness + pilot CHẠY TRÊN BOOT `ae2a9a47` (#94, XÁC MINH 9 nguồn — T0-179)** — không đổi trong phiên đo 18:27–19:08Z. **Chuỗi FULL PASS GIỮ 0 — WebKit harness 2/3.**
2. **Harness WebKit 2/3 + 1 KẸT MỚI ở resetPlayhead0:320 — kẹt cộng dồn 24 → 25; chuỗi "P3 không kẹt" 2 → 3.** Đừng gộp verdict pha con với verdict pha, đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đầy đủ trên `ae2a9a47` (libs 6/6 + GST files 269). Bằng chứng "WebKit chạy bằng system libs" là 84l10/86n2 PASS + W1 ×3 PASS trên cùng boot đo — **ĐẦY ĐỦ cho O8; KHÔNG đầy đủ cho harness WebKit (2/3)**.
4. **POSTBOOT_PASS cho boot đo CÓ — gate (a) — NHƯNG CÓ caveat repair** (repair-sớm-quyết-h, poll=1; GST qua symlink debroot, tools CHƯA cài). **CẦN PARENT/T10 XÁC NHẬN LẠI giá trị chân gate cho chuỗi FULL PASS** (tiền lệ #90 repair-caveat).
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=57, max 95,2% trần; avail min 314 MB @18:43:35Z; 1 kẹt nên không kết luận) — giao T9 đối chiếu sampler.
6. **86n2 vẫn oversize 39.194 B (>37.768 B)** — như đợt 142–179; **hb128 41.196 B, cũng oversize** — lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B), 85m4 (37.111 B), **w2setup-hb128 mới (36.113 B)** dưới giới hạn.
7. **Chuỗi verdict: 84l10 PASS lại sau kẹt 178; 85m4 P4 +1/+1/+1 cả 3 lần (chết ở resetPlayhead0 sau P4); 86n2-P1 PASS lần thứ tư liên tiếp; pilot hb128 verdict giống hệt bản chuẩn cả hai engine.** H3 ỦNG HỘ (§B). Điều tra 84l10 ĐỢT 8 (§D).
8. **Diag w2setup lần 1 KHÔNG CÓ EXIT CODE (bị #95 giết); lần 2 PASS trên #95 — boot CHƯA XÁC MINH, KHÔNG có POSTBOOT_PASS #95.** Đừng trích lần 2 thành "đo trên boot đã xác minh". Ca kẹt setup CHƯA tái hiện.
9. **T8 ĐÓNG TRONG hạn cờ ~20:00Z (~19:2xZ)** — dù reboot #95 giữa phiên. **0 reboot trong phiên đo; 1 reboot trong phiên T8 (#95, trong lúc diag).**
10. **Reboot #95 GIỮA PHIÊN (số hiệu chờ T0-180; btime 19:10:22Z); #94 XÁC MINH 9 nguồn; #93 XÁC MINH; marker sống 46 reboot #49–#94**; (m) #94 KHÔNG CÓ ĐIỂM + (m) #93 DƯƠNG ứng viên — thuộc T2-179 + parent 179.
11. **(1c') + (f') V1: 0 kích hoạt live (BỎ LỠ kẹt 179 — F-179-T8-5); replay C5.1 ĐẠT; pilot hb128 sạch, check-fresh OK (W 5 s, C 10 s).**
12. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (T2 đã đóng) — checklist (o) ghi "thuộc T2/T7/T9", không phán thay.

## 8. Sai số mới (F-179-T8-N)

- **F-179-T8-1 — REBOOT #95 GIỮA PHIÊN (19:10:22Z, boot `95b483a2`) — GIẾT DIAG ATTEMPT 1 + SERVICE RESTART.** Diag lần 1 chết ~19:10:48Z (log dừng, không exit code; lock stale, T8 nhả tay 19:14:36Z). 1 tool call lỗi "service restarted" cùng lúc. **Khác mẫu trước: root filesystem CÒN NGUYÊN** (libs 6/6, GST 269, dpkg 1.265); chỉ /tmp wipe + process chết. T8 phát hiện 19:13:15Z, rebuild fixture, chạy lại diag lần 2 trên #95 (PASS). **Số hiệu #95 CHỜ T0-180.** T7/T9 chưa đóng cờ lúc #95.
- **F-179-T8-2 — T4 0 ATTEMPT TRƯỚC KHI POSTBOOT SẴN (LẶP LẠI DẠNG 178).** Poll #1 17:47Z: RAM 1.732 MB, gate0 chưa đạt (libs thiếu 5); POSTBOOT_PASS #94 có 18:03:08Z nhưng RAM đã tụt 447 MB — cửa hẹp; sau đó RAM hồi 1.535 MB (poll #34 18:09:31Z) → attempt1 chạy ngay, 20/20 + B 5/5. Khác 178: cửa MỞ LẠI sau replay (không cần reboot cứu).
- **F-179-T8-3 — GATE (a) CHO #94 CÓ CAVEAT REPAIR.** POSTBOOT_PASS #94: repair-sớm-quyết-h, poll=1; GST qua symlink debroot (vá tạm K1), tools CHƯA cài, libc-bin 8.9. O8 + harness + pilot chạy sau gate (a) + cờ T4. **T8 KHÔNG tự cho caveat này là không trọng lượng — parent/T10 quyết giá trị chân gate** (tiền lệ #90 repair-caveat: chân vẫn tính — nhưng #90 là repair-tay, đây là repair-sớm-quyết-h).
- **F-179-T8-4 — WEBKIT 2/3: 1 KẸT MỚI Ở resetPlayhead0:320 — CHUỖI FULL PASS GIỮ 0.** 85m4 kẹt sau P4-lần3 PASS (+1/+1/+1), trước P5; evaluate treo + probe TIMEOUT + browser sống (RSS 371 MB). Chromium 3/3 PASS cùng boot/cùng RAM — kẹt WebKitGTK-specific (H3 ỦNG HỘ). **Chuỗi FULL PASS GIỮ 0; "P3 không kẹt" 2 → 3; 86n2-P1 PASS lần thứ tư liên tiếp.**
- **F-179-T8-5 — (c') BỎ LỠ KẸT THẬT 85m4 (LỖ HỔNG PHỦ SÓNG THỨ HAI).** Kẹt ở resetPlayhead0:320 — GIỮA P4 và P5, khi mọi heartbeat đã dừng (`finally { hbStop(); }`). Log 85m4 chỉ có 11 dòng HB128 (đều advancing, check-fresh OK maxspan=0 s); (c') live 0 kích hoạt; replay mọi variant cũng KHONG. **Bắt được nhờ watchdog (i) + live-diag (1b).** Lỗ hổng thứ hai sau F-178-T8-6: (c') chỉ phủ những đoạn đang có heartbeat chạy. **Đề xuất (KHÔNG tự triển khai): heartbeat bao phủ toàn bộ vòng đời pha (kể cả khoảng chuyển pha) — hoặc chấp nhận (c') chỉ là lớp bổ sung sau (i)+(1b); quyết ở đợt 180.**
- **F-179-T8-6 — Q3 E4 GHI ĐƯỢC STATE ĐÓNG BĂNG TRONG DIAG LẦN 1.** E4 đóng băng n=10, playhead 0.633/ct 0.634, playing=true, elapsed 5 s→55 s (span 50 s < 120 s nên (c') chưa kịp trigger thì #95 giết run). Lần đầu Q3 ghi được state lúc chết ở E4 trên WebKit. **KHÔNG đếm vào hồ sơ 4 ca** (bản copy chẩn đoán).
- **F-179-T8-7 — PILOT 86n2-hb128: WEBKIT SẠCH LẦN ĐẦU (LIVE) + CHROMIUM SẠCH; DRIVER CHƯA ĐỔI.** WebKit exit=0 (4'02"), Chromium exit=0 (~3'51"); verdict P1–P6 giống hệt bản chuẩn; 21 dòng HB128 mỗi engine; check-fresh OK (W 5 s, C 10 s). **Driver GIỮ NGUYÊN** (quyết (j) đợt 178) — parent quyết có đổi sang hb128 từ đợt 180 không.
- **F-179-T8-8 — SYMLINK THỨ HAI STALE (`apps/web/scripts/t8-diag-stall.sh` → round177-t8).** Phát hiện lúc trích số liệu (~19:18Z); đã cập nhật → round179-t8. Không script nào dùng symlink này (DIAG137_SCRIPT trong cả 3 script đều trỏ đường goals — đã cập nhật 17:46Z trước harness); không mất dữ liệu. Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink.
- **F-179-T8-9 — REPLAY C5.1 ĐẠT SAU KHI ĐỔI TÊN (F-178-T8-9 ĐÃ THỰC HIỆN).** Entry `178-sach-85m4` → `178-ket-85m4` trong cả hai replay script; kẹt-178 TRIGGER @125 s là TRUE POSITIVE; **0 FP trên 13 log sạch thật** (163/165–177); kẹt-179 BỎ LỠ (F-179-T8-5).
- **F-179-T8-10 — KIỂM CUỐI: 0 PROCESS SÓT (ĐÃ HẾT — F-178-T8-10 ĐÓNG).** Mở 17:41Z: 0 sót. Đóng ~19:2xZ (trên #95): 0 sót; lock TRỐNG; X11 TRỐNG. **F-178-T8-10 ĐÃ HẾT ở mức T8** (kiểm lại xong + cờ viết đúng hạn đợt này).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: GIỮ 0 — WebKit harness 2/3 trên #94 (85m4 kẹt resetPlayhead0:320).** Parent/T10 quyết cuối.
2. **Gate (a) cho #94 CÓ caveat repair (F-179-T8-3): parent/T10 xác nhận lại giá trị chân gate.**
3. **(c')/(f') BỎ LỠ kẹt 179 (F-179-T8-5) — lỗ hổng phủ sóng thứ hai: parent quyết mở rộng heartbeat bao phủ toàn bộ vòng đời pha hay chấp nhận (c') chỉ là lớp bổ sung sau (i)+(1b).** (c') + (f') vẫn ĐƯỢC GIỮ (ngưỡng đúng; replay C5.1 ĐẠT).
4. **Pilot 86n2-hb128 WebKit SẠCH (F-179-T8-7): parent quyết có đổi driver sang hb128 từ đợt 180 không** (rollback 1 dòng) + mở phạm vi (c')/(f') cho 86n2.
5. **F-178-T8-6: ca kẹt setup CHƯA tái hiện — parent quyết giữ bản copy làm công cụ chẩn đoán hay triển khai tiếp.**
6. **Số hiệu #95 (boot `95b483a2`, btime 19:10:22Z) — thuộc T0-180 xác minh 9 nguồn.** Marker sống 46 reboot #49–#94; qua 47 NẾU #95 được xác nhận. (m) #95 + INSIDE #95 thuộc T2-180.
7. **(m) #94 KHÔNG CÓ ĐIỂM (T0-179) + (m) #93 +36,248 s DƯƠNG ứng viên — thuộc T2-179 + parent 179.** (m) #56 lần 22.
8. **Đối chứng Chromium cùng pha: N cộng dồn N=41 mỗi pha** — Chromium 0 kẹt mọi đợt.
9. **(1c') + (f') V1: 0 kích hoạt live đợt này (BỎ LỠ kẹt 179) → ĐƯỢC GIỮ.** V2 (f'') giữ làm dự phòng.
10. Mở từ trước, vẫn đứng: G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 33 (chờ T9-179); R9 (a) lần 19; file oversize 6,4 MB chưa quyết; E-201 (T9-179); prune 54 (T6-179); mù #96?/#95?/#94?/#88?/#77? (hole-recheck 23, T2-179) + (m) #56 lần 22; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.

# Đợt 181 T8 — PLAN B B1 TRIỂN KHAI LIVE: HARNESS hb128 SẠCH 6/6 TRÊN #98; 0 DÒNG HB MỚI; DIAG W2-SETUP DỪNG

Ngày: 24/11/2026 (lượt cron 06:35 +07 = 23:35:51Z 23/11; T8 mở ~23:54Z, đóng 01:06Z — TRONG hạn cờ ~02:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) TRIỂN KHAI Plan B B1 (bọc resetPlayhead0) vào driver hb128 CHUẨN + kiểm live; (2) harness 6 pha live trên boot hiện tại; (3) checklist copy driver đợt 181 (F-180-T8-2/-T8-3/-T8-5); (4) O8 trên boot đo; (5) H3 thụ động. KHÔNG chạy diag W2-setup (quyết (j) đợt 180: DỪNG). KHÔNG chạy đối chứng chuẩn cũ (không thuộc nhiệm vụ đợt này; hb128 là chuẩn).
Nợ: LIMITS T8-180 (37.197 B); GAP §11 + §12.3 đợt 180 (parent CHẤP NHẬN (a)–(r); (j): B1 CHẤP NHẬN TRIỂN KHAI từ 181, B2 hoãn, B3 không dùng; F-178-T8-6 DỪNG; H3 chỉ giám sát thụ động; (b) chuỗi FULL PASS GIỮ 0).

## 0. Kết luận ngắn — B1 LIVE SẠCH; 5 CHÂN FULL PASS CÙNG BOOT #98 (PARENT/T10 QUYẾT)

- **#98 XÁC NHẬN 9 nguồn (T0-181)** — boot `e62eef3f`, btime 23:12:23Z, gap #97→#98 = 576 s (ngắn bất thường, nguyên nhân chưa xác định). Marker sống qua **50 reboot #49–#98**. **0 reboot trong phiên T8** (mở tới đóng đều `e62eef3f`).
- **T4-181: lượt yên #50 HỢP LỆ — chuỗi 43 → 44** (attempt1-`e62eef3f`, 20/20 + B 5/5 + median 50,0 ms; cửa mở poll #33 00:20:12Z; attempt 00:20:12–00:24:06Z; ngân sách 1/3; **0 vi phạm — chuỗi 2 → 3**). **POSTBOOT_PASS #98 ĐÃ CÓ 00:16:31Z** (repair-sớm-quyết-h, poll=1, dpkg 804, **CÓ caveat repair** — tools chưa cài, gst-inspect vắng; xem §1). **#97 KHÔNG CÓ POSTBOOT** (T5-181: chết ở boot+576 s, trước trigger repair boot+900 s — KHÔNG bù được).
- **Plan B B1 TRIỂN KHAI LIVE: 0 DÒNG HB MỚI trên cả 6 log harness** (reset sạch 508–731 ms < chu kỳ 5 s, đúng dự tính); kiểm offline 3/3 ĐẠT (120 s TRIGGER @120 s; 60 s OK; ca last=null TRIGGER — §C).
- **Harness DRIVER hb128 (B1): WebKit 3/3 + Chromium 3/3 — SẠCH 6/6 trên #98** (84l10, 85m4, 86n2-hb128; exit 0 cả 6; 0 WATCHDOG, 0 live-diag, 0 FRESH-CONTENT). **Kẹt harness cộng dồn GIỮ 25** (0 kẹt mới). **86n2-P1 KHÔNG kẹt lần thứ sáu liên tiếp (176–181).**
- **O8 T8 PASS 3/3 trên #98**: WebKit 21/21 ×2 (md5 report `9018d7f8`/`fadbd5ef`) + Chromium 21/21 (`7a63f770`), exit 0, 00:33:45–00:36:16Z (2'31"). Gate (a) — POSTBOOT_PASS #98 (repair, caveat). **O8 WebKit chạy bằng lib DEBROOT** (thiết kế gốc) — xem §A.
- **5 CHÂN FULL PASS CÙNG BOOT #98** (lượt yên #50 + gate (a) #98 + O8 T0 + O8 T8 + harness 3/3 — đều trên `e62eef3f`; khác đợt 180 chân tách boot). **T8 KHÔNG tự quyết chuỗi — parent/T10 quyết** (gate (a) CÓ caveat repair, tiền lệ #90/#94/#96).
- **F-178-T8-6 diag W2-setup: DỪNG — KHÔNG CHẠY đợt này** (quyết (j) đợt 180; đã PASS 3 lần liên tiếp, ca kẹt setup chưa tái hiện; mở lại nếu kẹt setup tái hiện live).
- **(c')/(f') V1: live 0 kích hoạt (harness sạch); replay C5.1 ĐẠT** (kẹt-164 @125 s, kẹt-178 TRIGGER, **0 FP trên 15 log sạch thật** — thêm 181-sach-85m4 + 181-sach-86n2-hb128). **(c') + (f') ĐƯỢC GIỮ.** Q3 84l10: WebKit W2 6 tick + E4 0; Chromium W2 5 + E4 0 — đúng thiết kế.
- **H3: CHỈ GIÁM SÁT THỤ ĐỘNG — 0 kẹt mới; 86n2-P1 PASS lần thứ sáu; H3-D1 tiếp tục bị bác bỏ.** Watchdog (i): 0 dòng; live-diag (1b): 0; (1c'): 0. 0 snapshot stall mới (4 file stall trong smoke/ đều của 180). RAM sampler n=31: balloon max 86,8% trần, 0 ghim; avail min **502 MB**.
- **Boot lúc đo = `e62eef3f` (#98) — 0 reboot trong phiên đo. Boot lúc đóng cờ: `e62eef3f`.** T7/T9 CHƯA đóng cờ lúc T8 đóng (00:57Z). **0 process sót; lock vite TRỐNG; X11: 1 socket stale X193 (không phải của T8 — §8 F-181-T8-1).** Fixture /tmp KHỚP md5 (đã rebuild sau wipe #98).

## 1. Dòng thời gian (gọn)

- 23:12:23Z **REBOOT #98** (đợt 180; T0-181 XÁC MINH 9 nguồn). 23:35:51Z Đợt 181 mở. 23:54–00:00Z T8 mở: đọc LIMITS T8-180 + GAP §11 + quyết §12.3; cây + 7 script KHỚP md5 đợt 180; copy driver 180→181 + đổi nhãn (waiter deadline → 01:30Z 24/11, replay thêm entry 181 + **sửa nhãn sai (F-180-T8-2/-T8-3)**); **symlink diag goals + apps/web → round181-t8 lúc 23:57Z**; **file probe S1 CÓ SẴN trong copy** (md5 `453d1082`, giống hệt 175–178 — **F-180-T8-5 ĐÃ KHÉP**); **triển khai B1 vào 2 script hb128 + sửa tag/summary (F-181-T8-2)**; selfcheck #1: libs 1/6, GST .so 0, dpkg 2 (root chưa bền sau #98); fixture /tmp KHỚP md5 sau rebuild (hevc `ba0c7c62` / i7 `f05daed8` / h-30s `fbaa3d1a` / g-4s `a1fb8549`); **mở: 0 process sót, X11 trống, lock trống.**
- 00:00:03Z Waiter bắt đầu (deadline 01:30Z); postboot=0 (T5 repair đang chạy apt update), t4=0. 00:16:31Z **POSTBOOT_PASS #98 ĐÃ CÓ** (repair-sớm-quyết-h, poll=1, dpkg 804). 00:20:12Z **Cửa yên mở (poll #33 T4)** → attempt1 chạy; 00:24:06Z **attempt1 XONG: 20/20 + B 5/5 — LƯỢT YÊN #50 (chuỗi 43 → 44)**; 00:31:48Z T4 viết cờ (0 vi phạm, chuỗi 2 → 3).
- 00:32:07Z **GATE-FOUND poll=33 (cờ T4 + POSTBOOT_PASS #98, đường a)**. 00:33:37Z selfcheck #2 (libs 6/6, GST .so 269, dpkg 804).
- 00:33:45–00:36:16Z **O8 T8 PASS 3/3 trên #98** (§A). 00:37:35–00:52:56Z **Harness hb128+B1: WebKit 3/3 + Chromium 3/3** (§2). 00:53–01:06Z Trích số liệu + replay; viết LIMITS + paths + cờ.

## A. O8 — PASS 3/3 trên boot `e62eef3f` (#98); 5 CHÂN CÙNG BOOT (PARENT/T10 QUYẾT CHUỖI)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 00:33:45–00:34:36 | 0 | **21/21 PASS** — S1 PASS, md5 report `9018d7f8` |
| 2 | O8 WebKit attempt2 | 00:34:36–00:35:27 | 0 | **21/21 PASS** — S1 PASS, md5 report `fadbd5ef` |
| 3 | O8 Chromium (đối chứng) | 00:35:27–00:36:16 | 0 | **21/21 PASS** — S1 PASS, md5 report `7a63f770` |

- Report JSON kiểm độc lập bằng python: 3× n=21, ok_true=21. **BA FILE STAMPED RIÊNG BIỆT** (pid 217074 / 217495 / 217875, bootId `e62eef3f`). 0 `HARNESS LỖI` / `Target crashed` / `WATCHDOG-137` trong log O8. Probe S1 không cần (attempt1 PASS — file probe đã có sẵn, md5 `453d1082`).
- **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH`; debroot còn nguyên: GST .so 269). Bằng chứng "WebKit chạy bằng system libs" là harness 84l10/85m4/86n2-hb128 PASS + W1 ×3 PASS trên cùng boot đo (#98), libs 6/6 — **ĐẦY ĐỦ cho O8; và lần này harness CŨNG sạch 3/3 nên đủ cho cả harness.**
- **Gate cho boot đo `e62eef3f`: (a) CÓ — POSTBOOT_PASS #98 00:16:31Z (repair-sớm-quyết-h, poll=1, CÓ caveat repair — tools CHƯA cài, gst-inspect vắng; dpkg 804 ≠ 1.545 của #95 replay-đầy-đủ).** O8 T8 chạy sau gate (a) + cờ T4 (GATE-FOUND 00:32:07Z). Caveat ghi rõ — parent/T10 quyết giá trị chân gate cho chuỗi FULL PASS (tiền lệ #90/#94/#96).
- **Chuỗi WebKit FULL PASS: 5 CHÂN CÙNG BOOT #98 — T8 KHÔNG TỰ QUYẾT, parent/T10 quyết cuối.** (1) lượt yên hợp lệ #50 trên **#98**; (2) gate (a) cho **#98** (repair, caveat); (3) O8 T0 PASS 3/3 trên **#98** (00:17:24–00:20:11Z, WebKit 21/21 ×2 md5 `84207ad2`/`5214b6f5` + Chromium 21/21 `19b9d258`, theo cờ T0-181); (4) O8 T8 PASS 3/3 trên **#98**; (5) harness hb128+B1 3/3 trên **#98**. Đợt 180 chân tách boot (#95/#96) nên GIỮ 0; đợt này không tách — **đủ điều kiện lên 1 NẾU parent chấp nhận chân gate (a) có caveat**. O8 đợt này 2'31" tổng (180: 2'37", 179: 2'31").

## 2. Kết quả harness — DRIVER hb128 + B1 (CHUẨN): WebKit 3/3, Chromium 3/3

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 00:37:35–00:38:46 | **PASS** — W1 +1/+1/+1, W2 PASS, E4 PASS; HB128: W2 6, E4 0 — **Q3 đúng thiết kế** |
| 2 | WebKit 85m4 | 0 | 00:39:01–00:41:11 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**; HB128 19 dòng |
| 3 | WebKit 86n2-hb128 | 0 | 00:41:27–00:45:28 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**, P6 KHÔNG-KẸT; **86n2-P1 KHÔNG kẹt lần thứ sáu liên tiếp** |
| 4 | Chromium 84l10 | 0 | 00:45:43–00:46:43 | **PASS** — W1 PASS (+2/+1/+2, lần1+lần3 delta +2 là artifact test theo log), W2 PASS, E4 PASS; HB128: W2 5, E4 0 |
| 5 | Chromium 85m4 | 0 | 00:46:59–00:49:00 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**; HB128 19 dòng |
| 6 | Chromium 86n2-hb128 | 0 | 00:49:15–00:52:56 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1, P5 PASS 40 s **0 restart**, P6 KHÔNG-KẸT; HB128 21 dòng |

- 6 report JSON kiểm độc lập: ok=True cả 6 (finishedAt 00:38:40Z / 00:41:10Z / 00:45:18Z WebKit; 00:46:40Z / 00:48:57Z / 00:52:55Z Chromium). Môi trường: system libs trên boot `e62eef3f` (selfcheck #2 libs 6/6 + GST .so 269 + dpkg 804; repair xong trước O8). **WebKit launch + W1 ×3 PASS bằng system libs** trên ĐÚNG boot đo.
- **Harness 15'21"** (00:37:35–00:52:56Z) — ngắn thứ hai từ đợt 178 (180: 15'34"; 179: 28'26" vì 1 timeout 900 s; đợt này 0 timeout).
- **Đối chứng Chromium cùng pha: N cộng dồn N=43 mỗi pha** (đợt 137/139/141–181 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt.
- **Kẹt harness cộng dồn GIỮ 25** (0 kẹt mới trong harness). 84l10 PASS 3 đợt liên tiếp (179–181); 85m4 P4 +1/+1/+1; 86n2-P1 PASS lần thứ sáu liên tiếp (176–181).
- **Driver B1:** 85m4-hb128 md5 `2f707749` (37.700 B — **DƯỚI giới hạn push 37.768 B, chỉ dư 68 B**); 86n2-hb128 md5 `c90e0853` (41.785 B, oversize — cần ENABLE_PRIVSEP=0); 84l10 chuẩn `baaa13c0` (không đổi, không có resetPlayhead0 nên B1 không áp dụng); 86n2 chuẩn cũ md5 `628088bd` (backup, không chạy đợt này). **B1 thêm 0 dòng HB trên cả 6 log sạch** (§C).

## 3. Watchdog + 4 bước kiểm — 0 DÒNG (HARNESS SẠCH) + LIVE-DIAG 0 + (1c') 0 KÍCH HOẠT

- **Watchdog (i): 0 dòng WATCHDOG-137 (0 pha). Live-diag (1b): 0 kích hoạt. (1c')/(f') V1: 0 kích hoạt live (harness sạch); check-fresh trên 6 log sạch: OK maxspan=0/5/5/0/10/10 s (W 0/5/5, C 0/10/10). (c') + (f') ĐƯỢC GIỮ.**
- 0 snapshot stall mới trong round181-t8/smoke/ — 4 thư mục stall hiện có đều của 180 (mtime 23:55Z 23/11, epoch 1795473xxx). Cả hai symlink diag cập nhật → round181-t8 lúc 23:57Z, TRƯỚC harness (F-178-T8-8 — checklist copy driver đã gồm cả hai symlink 3 đợt liên tiếp).
- **(1)** Watchdog chẩn đoán trong 3 script (VÁ 142, GIỮ NGUYÊN 143–181) + `t8-diag-stall.sh` → 181 (cả hai symlink — §5). 6 harness + 3 O8; **0 kẹt → 0 dòng, 0 FP — ĐÚNG.** **(1b)** Driver canh im lặng >120 s, tối đa 2 lần/lần chạy, ≥240 s: `live_diags=0` cả 6 pha — **ĐÚNG.** **(1c')** helper check-fresh + khối FRESH-CONTENT trong `run_one`: **0 kích hoạt live (harness sạch); replay C5.1 ĐẠT (§C). (c') + (f') ĐƯỢC GIỮ.**
- **(2)** Cột Balloon vào RAM sampler: n=31, pinned=0, min=4.384.800 max=5.595.604 (86,8% trần) mean=5.201.891; avail min=502 MB @00:50:33Z / max 2.257 MB. **(3)** Đối chứng Chromium cùng pha: **84l10 PASS, 85m4 PASS, 86n2-hb128 PASS** — exit 0 cả 3; N cộng dồn **N=43 mỗi pha** — Chromium 0 kẹt mọi đợt. **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **0 lần kẹt → 0 snapshot (đúng)**.

# §C — (1c')/(f') V1 + PLAN B B1: TRIỂN KHAI LIVE XONG; REPLAY C5.1 ĐẠT; SYNTH B1 3/3

## C1. Thiết kế (c') + (f') V1 (triển khai đợt 173, giữ nguyên đợt 174–181, không đổi code)

- **(c'):** trailing run HB128 **cùng tag + cùng playhead + cùng ct**, kích hoạt khi span ≥ 120 s VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi sub-run `paused=true + seeking=true` đã ≥300 s. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3 **+ 86n2-hb128 từ đợt 180 + resetPlayhead0 từ đợt 181 (B1)**. V2 (f'') giữ làm dự phòng, KHÔNG triển khai.
## C2. B1 — TRIỂN KHAI (quyết (j) đợt 180; 1 điểm sửa duy nhất trong mỗi script hb128)

- **Thay đổi:** hàm `resetPlayhead0(page)` trong `clicktest-85m4-webkit-w7-hb128.mjs` + `clicktest-86n2-webkit-w7-hb128.mjs` được bọc `hbStart/hbStop`, tag `resetPlayhead0 reset`, summary = playhead/ct cuối đã biết (đóng băng khi treo → trailing run đồng nhất → (c') trigger @120 s). Phủ cả 6 call-site mỗi script (5 thân pha + 1 trong waitForPlaySync — vốn đã có hb riêng). `node --check` PASS cả hai. 84l10 không có resetPlayhead0 nên không sửa.
- **Sửa trước live (F-181-T8-2):** bản đầu tag một-token `resetPlayhead0` KHÔNG khớp parser LINE_RE của check-fresh/replay (đòi 2 token sau `[HB128]`) → đổi thành `resetPlayhead0 reset`; summary khi `last=null` (ev() đầu tiên treo) ban đầu ghi `paused=? seeking=?` làm (e)/(f) chặn trigger → đổi thành chỉ `playhead=? ct=?` (bỏ các trường paused/seeking/playing để (e)/(f) được miễn theo thiết kế khi trường vắng). Cả hai sửa xong TRƯỚC khi chạy harness.
- **Kiểm offline TRƯỚC harness (check-fresh-181t8.py, trên log tổng hợp mới):**

| Log tổng hợp | HB128 | check-fresh-181t8.py |
|---|---|---|
| planb-b1-120s (treo 120 s, state đã biết) | 26 dòng | **TRIGGER elapsed=120 s span=120 s run_len=25** |
| planb-b1-60s (treo 60 s, dưới ngưỡng) | 13 dòng | OK maxspan=60 s (không FP) |
| planb-b1-unknown-120s (treo 120 s, last=null) | 26 dòng | **TRIGGER elapsed=120 s span=120 s run_len=25** |

- **Kiểm live (harness 6 pha): resetPlayhead0-HB = 0/6 log** — reset sạch 508–731 ms (85m4 P2 WebKit 697 ms / Chromium 508 ms; 86n2 P2 WebKit 731 ms / Chromium 508 ms) < chu kỳ 5 s → 0 dòng thêm, đúng dự tính §C4 đợt 180. **(c') live 0 kích hoạt; 0 FP.** Chưa có ca kẹt reset thật để B1 bắt live — B1 chứng minh bằng synth + live sạch, không bằng kẹt thật.
- **B2 (mở rộng: bọc setup + vòng chờ P6 90 s) VẪN HOÃN** theo quyết (j) đợt 180 — chỉ làm sau khi B1 chứng minh live (đợt này B1 mới chạy live lần đầu, chưa có kẹt thật). **B3 (giữ nguyên) KHÔNG DÙNG.**
## C3. Replay sau harness (replay-1c-181t8.py + replay-f-fix-181t8.py, ~00:57Z)

- **(c') V1 (f-fix): kẹt-164 TRIGGER @125 s; kẹt-178 TRIGGER @125 s (TRUE POSITIVE); kẹt-179 KHÔNG ở mọi variant — C5.1 ĐẠT** (0 FP trên **15 log sạch thật** 163/165–177 + 180-sach-85m4 + **181-sach-85m4 + 181-sach-86n2-hb128**; kẹt-171 cũng KHÔNG — (c') hiện tại KHÔNG ĐẠT; (f') V1-180/300/600 và V2 đều ĐẠT, FP 0). **(c') + (f') ĐƯỢC GIỮ.**
- **(f') V1-300: ĐẠT** — kẹt-164 TRIGGER @125 s; kẹt-171 TRIGGER @305 s (V1-300); V1-180: 164@125 s (kẹt-171 KHÔNG); V1-600: cả hai; V2: cả hai.
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 10 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY — 84l10 PASS LẠI)

## D1. Phạm vi (parent chốt đợt 171, giữ nguyên tới đợt 181): 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; cùng script `baaa13c0`) + ca 178 W2-setup :443. KHÔNG gộp 85m4-P4 / 86n2-P4-lần3. 86n2-P1 (đợt 175) theo dõi riêng — PASS lần thứ sáu liên tiếp (176–181). **Đợt 10: 84l10 PASS (WebKit 71 s + Chromium 60 s).**

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 181 (ĐÚNG CẢ HAI ENGINE)

| Engine | W2 HB128 | E4 HB128 | Kết quả |
|---|---|---|---|
| WebKit | **6 tick** (như đợt 179/180: 6) | **0 tick** | PASS (W1 +1/+1/+1, W2 PASS, E4 PASS) |
| Chromium | **5 tick** (như đợt 178/179/180: 5) | **0 tick** | PASS (W1 PASS, W2 PASS, E4 PASS) |

- **Không FP từ Q3** (check-fresh log 84l10 WebKit/Chromium: OK maxspan=0 s). **Hồ sơ 4 điểm kẹt 84l10:** 157 E4 :457; 170 W2 :433; 171 W2-setup :425; **178 W2-setup :443**. Đợt 181 PASS — không thêm ca mới. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180) — xem §F.**
- **Chuỗi 84l10 PASS: 3 đợt (179–181)** sau khi đứt ở 178. Tần suất kẹt 84l10: 4 ca / 25 đợt (157–181) ≈ 16%.
## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — không có ca kẹt mới đợt này để đối chiếu.
- **Q2 — Lib hệ thống hay engine?** **THU HẸP MẠNH (đứng nguyên):** libs 6/6 + GST .so 269 đầy đủ trên #98; Chromium 6/6 PASS cùng boot/cùng RAM → kẹt (khi có) là WebKitGTK-specific.
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 181 — heartbeat đúng cả hai engine.**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — chỉ tương quan thời điểm.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 25 đợt).
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 181 (0 KẸT MỚI; 86n2-P1 KHÔNG KẸT — ĐIỀU KIỆN MỞ H3 KHÔNG ĐẠT)

## B1. Trạng thái giả thuyết sau đợt 181 (H3 ỦNG HỘ — đứng nguyên, không bằng chứng mới)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — avail min 502 MB lúc đo, NHƯNG Chromium 6/6 PASS cùng cửa sổ RAM.
- **H2 "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (đứng nguyên)** — balloon max 86,8% trần lúc đo nhưng Chromium không kẹt cùng điều kiện.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ (đứng nguyên)** — không có ca kẹt mới đợt này để đối chiếu; bằng chứng gần nhất là kẹt ngoài harness đợt 180 (waitForPlaySync-P4-lần1, WebKit-only), Chromium 4/4 PASS đối chứng cùng boot.
- **H3-D1 "Process WebKit bị kẹt tự ăn thêm RAM/CPU": BÁC BỎ (đứng nguyên; browser sống, không OOM-kill).**
- Đợt 181 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy O8** (đều trên #98, qua gate (a)) + **0 kẹt Chromium**. Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS lần thứ sáu liên tiếp.** H3 vẫn chỉ giám sát thụ động.
## B3. Chữ ký kẹt — đợt 181: 0 KẸT (đối chiếu đợt 180: 1 kẹt ngoài harness, exit 124, 901 s, probe TIMEOUT; đợt 179: 1 kẹt exit 124, 903 s, probe TIMEOUT; browser sống).
# §E — CHECKLIST (o) ĐỢT 181 (quyết (o) đợt 180 + các F-180 còn lại — 21/21, 0 mục bỏ sót)

- o1. F-180-T0-1 (gap) — **GHI NHẬN**; gap #97→#98 = 576 s (T0-181 đã xác minh; nguyên nhân chưa xác định — không tìm thấy dấu hiệu host-side trong log truy cập được).
- o2. F-180-T0-3 + run 179 TIMEOUT — **GHI NHẬN**; run 180 TIMEOUT 23:39:30Z (margin −219 s, claimed→finished 86 s — ca ≥60 s thứ mười NẾU T7-181 đồng ý) — thuộc T7-181; run 181 jitter +219 s, đang running.
- o3. F-180-T1-1 (GAP không có chữ cần sửa) — **GHI NHẬN**; parent CHẤP NHẬN (p) đợt 180 (file mạo danh 21:07Z KHÔNG được trích như quyết parent). Lệch prose MỚI F-181-T1-1 (aggregate 180 §10.3 "1.335 file" → đúng 1.336) — giao parent quyết; T1-182 sửa nếu duyệt.
- o4. F-179-T1-4 (RAM dao động) — **GHI NHẬN**; avail 502–2.257 MB, balloon max 86,8% (thuộc T9).
- o5. F-180-T4-2 (check-classb) — **GHI NHẬN**; 0 vi phạm theo T4 (chuỗi 2 → 3 — cờ T4-181).
- o6. F-180-T4-3 (X193) — **LẶP LẠI DẠNG MỚI:** socket X193 stale 00:20Z (cửa sổ attempt T4) — xem F-181-T8-1 (§8); không phải của T8.
- o7. F-180-T5-1 (watcher overlap) — **GHI NHẬN**; watcher-180 chết theo #96 (+24 s, mẫu 12); pid 8767 (T8 respawn đợt 180) chết theo #97 (+29 s — mẫu 13, F-181-T5-1).
- o8. F-180-T5-2 (ledger ts) — **GHI NHẬN** (thuộc T5-181).
- o9. F-180-T5-3 (lệch btime 11 s) — **GHI NHẬN** (F-175-T5-3 VẪN ĐÓNG).
- o10. F-174-T5-6 KHÔNG áp dụng — **GHI NHẬN** (#98 repair-sớm-quyết-h, poll=1 — F-181-T8-5).
- o11. F-180-T6-1 (chồng pha) — **GHI NHẬN**; harness T8 SAU cờ T4; O8 T0 bàn giao sạch cho T4 (0 attempt chồng, theo cờ T0-181).
- o12. F-180-T6-4 (mâu thuẫn poll=0) — **GHI NHẬN** (thuộc T6; T6-181 đã đóng cờ).
- o13. F-180-T6-5 (watcher chưa chạy lúc snapshot) — **GHI NHẬN**.
- o14. F-180-T7-1 (sleep bị SIGTERM) — **GHI NHẬN**; T7-181 chưa đóng cờ lúc T8 đóng.
- o15. F-180-T7-4 (lỗi nhãn T0-176/T0-177) — **GHI NHẬN** (thuộc T7; F-178-T7-4 ĐÃ LÀM RÕ).
- o16. F-180-T7-5 (tuổi run cộng thừa 600 s) — **GHI NHẬN** (thuộc T7).
- o17. F-180-T8-1..6 — **ĐÃ THỰC HIỆN** (xem §8; F-180-T8-1 ở o7; F-180-T8-2/-T8-3/-T8-5 ở §5; F-180-T8-4 ở §B; F-180-T8-6 ở §F).
- o18. Quyết (o) 180 (cửa slot LÀNH lần 6; HB 47/478, DR 53/311) — **GHI NHẬN**; số mới thuộc T7-181 (chưa đóng cờ).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — **ĐÃ THỰC HIỆN:** marker 50 reboot (#49–#98 đã xác nhận); T8 đóng 01:06Z, TRONG hạn cờ ~02:00Z.
- o20. Quyết (j) 180 (B1 triển khai từ 181; F-178-T8-6 DỪNG; H3 giám sát) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B)**.
- o21. F-181-T0-2 (delta ≥29 s trước #97) + F-181-T5-1 (watcher overlap mẫu 13) — **GHI NHẬN** (thuộc T0/T5-181).
# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 181 — theo quyết parent (j) đợt 180: DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 đợt 180 `3d41b015` — không kiểm lại đợt này vì không chạy; script diag `run-diag-84l10-w2setup-181t8.sh` đã đổi nhãn, không chạy).
- **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy đợt này** (không thuộc nhiệm vụ đợt 181; hb128 là chuẩn; kẹt ngoài harness đợt 180 đã ghi đủ bằng chứng họ kẹt evaluate vẫn có). **Không có verdict đối chứng mới.**
- **Chi phí B1:** 85m4-hb128 +589 B so với trước B1 (37.111 → 37.700 B — vẫn DƯỚI giới hạn push, chỉ dư 68 B); 86n2-hb128 +589 B (41.196 → 41.785 B, oversize như trước — cần ENABLE_PRIVSEP=0). Run sạch: +0 dòng HB128/log (B1), +21 dòng HB128/log (86n2), +0–6 dòng (84l10 W2), 0 FP, 0 ảnh hưởng verdict.

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` **2f707749 (B1 MỚI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` c90e0853 (B1 MỚI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e. Tất cả không đổi so với đợt 180 trừ 2 script B1.
- **T8 thêm 3 file repo đợt này: 2 script B1 + LIMITS này.** Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round181-t8/`**.
- Extract: glob TẤT CẢ log waiter (lần 1: 33 poll + GATE-FOUND poll=33); **0 REBOOT trong lúc waiter chạy** (boot `e62eef3f` suốt).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** Cả hai symlink (`goals/.../t8-diag-stall.sh` + `apps/web/scripts/t8-diag-stall.sh`) cập nhật → round181-t8 lúc **23:57Z, TRƯỚC harness** → 0 dump stall mới (đúng — harness sạch). Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink (đã làm 3 đợt liên tiếp).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 ĐÃ KHÉP).** File `o8-s1-probe-181t8.mjs` có mặt sau `cp -r` 180→181 (md5 `453d1082` giống hệt 175–178; `node --check` PASS). O8 đợt này PASS attempt1 nên probe không chạy — chỉ dự phòng.
- **F-180-T8-2 (nhãn sai replay): ĐÃ SỬA.** Replay scripts đổi nhãn 180→181 nhưng GIỮ NGUYÊN đường dẫn entry 179-ket/180-sach/180-ket (trỏ log thật); thêm entry `181-sach-85m4` + `181-sach-86n2-hb128` (trỏ log mới); C5.1 vẫn ĐẠT sau sửa. **F-180-T8-3 (nhãn live-diag cũ): ĐÃ SỬA** — `LIVE-DIAG-179`/`FRESH-CONTENT-179` trong run-control + extract → `LIVE-DIAG-181`/`FRESH-CONTENT-181` (live-diag đợt này 0 kích hoạt nên nhãn mới chưa xuất hiện trong log — chỉ kiểm bằng grep).
- **F-181-T8-4 (script pilot stale):** `run-pilot-chromiumonly` vẫn trỏ round179-t8 (lỗi copy từ 179, không ai phát hiện vì script không chạy) — **ĐÃ SỬA sang 181** (đổi 179t8→181t8, round179→round181, t8-round179→t8-round181). Script không chạy đợt này.

## 6. Dọn dẹp + kiểm cuối — sạch (trừ X193 stale, §8)

- Driver O8 nhả lock 00:36:16Z; harness nhả lock sau mỗi lần chạy (xong 00:52:56Z). **Không lock stale nào.**
- Kiểm cuối ~00:57Z (trên #98): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG (0 ticket + 102 cooldown); `/tmp/.X11-unix/` có **X193 stale** (socket + lock, 00:20Z, 0 process — F-181-T8-1, không phải của T8; X199 của T8 đã dọn sạch).
- Fixture /tmp: **rebuild lần 1 trên #98 sau khi /tmp bị wipe** (md5 khớp: `a1fb8549` / `fbaa3d1a` / `ba0c7c62` / `f05daed8`).
- **Reboot #98 (boot `e62eef3f`, btime 23:12:23Z, gap #97→#98 = 576 s):** xảy ra TRƯỚC khi T8 mở (23:54Z); **0 reboot trong phiên T8.** Root KHÔNG bền sau #98 lúc mở (libs 1/6, GST 0, dpkg 2 — về mẫu #92/#93/#94/#96); T5-181 repair xong 00:16:31Z (dpkg 804). **Số hiệu #98 ĐÃ XÁC MINH (T0-181, 9 nguồn); (m) #98 DƯƠNG (phân loại CUỐI cấp T2 — T2-181) — thuộc parent 181; (m) #96/#97 DƯƠNG (CUỐI cấp T2) — thuộc parent 181.** T7/T9 chưa đóng cờ lúc T8 đóng — thuộc T7-181/T9-181 + T10-181.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt ngoài watcher T5; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 + harness CHẠY TRÊN BOOT `e62eef3f` (#98, ĐÃ XÁC MINH 9 nguồn — T0-181)** — không đổi trong phiên đo 00:33–00:53Z. **5 chân FULL PASS CÙNG BOOT — parent/T10 quyết chuỗi (T8 không tự quyết).**
2. **Harness WebKit 3/3 + Chromium 3/3 — kẹt harness cộng dồn GIỮ 25.** Đừng gộp verdict pha con với verdict pha, đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đầy đủ trên `e62eef3f` lúc đo (libs 6/6 + GST .so 269 sau repair). Bằng chứng "WebKit chạy bằng system libs" là 84l10/85m4/86n2-hb128 PASS + W1 ×3 PASS trên cùng boot đo — **ĐẦY ĐỦ cho O8 và cho harness lần này (3/3).**
4. **POSTBOOT_PASS cho boot đo CÓ — gate (a) — NHƯNG CÓ caveat repair** (repair-sớm-quyết-h, poll=1; tools CHƯA cài, gst-inspect vắng; dpkg 804 ≠ 1.545 của #95 replay-đầy-đủ). **CẦN PARENT/T10 XÁC NHẬN LẠI giá trị chân gate cho chuỗi FULL PASS** (tiền lệ #90/#94/#96).
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=31, max 86,8% trần; avail min 502 MB; 0 kẹt harness nên không kết luận) — giao T9 đối chiếu sampler.
6. **85m4-hb128 37.700 B (DƯỚI 37.768 B, chỉ dư 68 B) + 86n2-hb128 41.785 B (>37.768 B)** — 86n2-hb128 oversize, lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B), **w2setup-hb128 (36.113 B, không đổi)** dưới giới hạn. **LIMITS này viết gọn, DƯỚI giới hạn push** (xem `wc -c` lúc stage).
7. **Chuỗi verdict: 84l10 PASS 3 đợt liên tiếp (179–181); 85m4 P4 +1/+1/+1; 86n2-P1 PASS lần thứ sáu liên tiếp; B1 thêm 0 dòng HB/log sạch — NHƯNG B1 chưa bắt kẹt thật live (chỉ synth + live sạch).** H3 ỦNG HỘ (§B). Điều tra 84l10 ĐỢT 10 (§D).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **T8 ĐÓNG 01:06Z, TRONG hạn cờ ~02:00Z; 0 reboot trong phiên T8.** **0 reboot trong phiên đo.**
10. **Reboot #98 TRƯỚC phiên T8 (btime 23:12:23Z); #98 XÁC MINH 9 nguồn; marker sống 50 reboot #49–#98**; (m) #96/#97/#98 DƯƠNG (CUỐI cấp T2) — thuộc parent 181; (m) #56 lần 24 (T2-181).
11. **(1c') + (f') V1: 0 kích hoạt live đợt này (harness sạch); replay C5.1 ĐẠT; 181-sach-85m4 + 181-sach-86n2-hb128 sạch, check-fresh OK (W 5 s, C 10 s). B1 live 0 dòng HB mới.**
12. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (kiểm 00:57Z) — checklist (o) ghi "thuộc T2/T7/T9", không phán thay.

## 8. Sai số mới (F-181-T8-N)

- **F-181-T8-1 — SOCKET X193 STALE (00:20Z, CỬA SỔ ATTEMPT T4).** `/tmp/.X11-unix/X193` + `/tmp/.X193-lock` (mtime 00:20Z — đúng lúc cửa yên T4 mở 00:20:12Z, attempt1 chạy 00:20:12–00:24:06Z); **0 process Xvfb/MiniBrowser/WebKit/Chromium** lúc kiểm cuối (~00:57Z); `ss -x` không có listener. **Stale, không phải của T8** (T8 dùng Xvfb :199, đã dọn sạch socket + lock sau harness). **T8 KHÔNG dọn X193** (không phải tài sản của mình; tiền lệ các đợt chỉ dọn display của mình). Ghi rõ để T4/T10 quyết có dọn hay giữ làm bằng chứng. (F-180-T4-3 đã báo X193 một lần — đây là lần tái xuất dạng mới: socket từ attempt, không phải từ harness.)
- **F-181-T8-2 — B1 BẢN ĐẦU SAI TAG + SUMMARY (ĐÃ SỬA TRƯỚC LIVE).** (i) Tag một-token `resetPlayhead0` không khớp LINE_RE của check-fresh/replay (đòi 2 token sau `[HB128]`) → (c') sẽ mù với dòng B1. (ii) Summary khi `last=null` ghi `paused=? seeking=?` → cond_ef (e)/(f) chặn trigger. **ĐÃ SỬA trước harness:** tag `resetPlayhead0 reset`; summary khi last=null chỉ `playhead=? ct=?` (bỏ paused/seeking/playing → (e)/(f) được miễn khi trường vắng, đúng thiết kế). Kiểm synth sau sửa: 3/3 ĐẠT (§C2). Không ảnh hưởng live (bản live đã là bản sửa).
- **F-181-T8-3 — EXTRACT SCRIPT HARDCODE TÊN CŨ (KHÔNG ẢNH HƯỞNG SỐ LIỆU).** `extract-181t8.py` đoạn watchdog hardcode `run-webkit-86n2.log` (không tồn tại thời hb128) → FileNotFoundError, exit 1 ở cuối script. Các số trước đó (harness, report JSON, O8, sampler) vẫn đúng — đã trích tay lại từ summary + log. Nợ đợt sau: sửa extract cho tên `86n2-hb128` (hoặc bỏ hardcode theo F-157-T8-7).
- **F-181-T8-4 — SCRIPT PILOT STALE (ĐÃ SỬA).** `run-pilot-chromiumonly-181t8.sh` vẫn trỏ round179-t8 (lỗi copy từ 179). Đã sửa sang 181. Script không chạy đợt này.
- **F-181-T8-5 — POSTBOOT #98 CÙNG PROFILE #96 (REPAIR, CAVEAT).** #98: repair-sớm-quyết-h, poll=1, dpkg 804, tools chưa cài, gst-inspect vắng — giống hệt #96 (T5-180/T8-180). Gate (a) CÓ caveat; giá trị chân FULL PASS thuộc parent/T10 (tiền lệ #90/#94/#96).
- **F-181-T8-6 — GST-INSPECT VẮNG TRÊN #98 (TOOLS CHƯA CÀI).** Selfcheck #2: `gst-inspect-1.0: command not found` → đếm plugin = 0, dù GST .so = 269 đầy đủ (symlink debroot; T5 verify PASS GST đủ isomp4 + libav). Cùng mẫu F-180-T8-6. Ghi rõ để không ai trích "GST 0" thành "thiếu plugin".
- **F-181-T8-7 — T0 vs T5 LỆCH TỔNG BOOT KHÔNG CỜ.** T0-181: "tổng boot không cờ GIỮ 20"; T5-181: "#97 KHÔNG CÓ → tổng 20 → 21". T8 chỉ ghi nhận mâu thuẫn, không phán — thuộc T10-181/parent.
- **F-181-T8-8 — LOG STALE TRONG smoke/attempt1/.** Hai file `run-webkit-86n2-std.log` + `run-webkit-84l10-w2setup.log` trong attempt1/ là bản copy từ 180 (mtime 23:55Z 23/11) — KHÔNG phải bằng chứng 181 (đợt này không chạy control/diag). T8 không trích chúng; chỉ 6 log harness + 3 report O8 là bằng chứng mới.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: 5 chân CÙNG BOOT #98 — parent/T10 quyết có lên 1 không** (đợt 180 GIỮ 0 vì chân tách boot; đợt này không tách; gate (a) #98 CÓ caveat repair — tiền lệ #90/#94/#96).
2. **Gate (a) cho #98 CÓ caveat repair — parent/T10 xác nhận lại giá trị chân gate.**
3. **(m) #96/#97/#98 DƯƠNG (phân loại CUỐI cấp T2) — parent quyết cuối; n ứng viên đề xuất 38/39 → 41/42 (T2-181).** INSIDE #96 TRUE (chuỗi 1 → 2) / #97 TRUE (2 → 3) / #98 FALSE (3 → 0) — thuộc parent 181.
4. **T0 vs T5 lệch tổng boot không cờ (20 hay 21 — F-181-T8-7); #97 KHÔNG CÓ POSTBOOT — KHÔNG bù được.**
5. **Run 180 TIMEOUT (margin −219 s; claimed→finished 86 s — ca ≥60 s thứ mười NẾU T7-181 đồng ý) — kết cục thuộc T7-181; run 181 jitter +219 s, đang running.**
6. **F-181-T1-1 (aggregate 180 §10.3 "1.335 file" → đúng 1.336) — giao parent quyết; T1-182 sửa nếu duyệt.**
7. **B1 live lần đầu sạch (0 dòng HB mới, 0 kẹt thật để bắt) — B2 VẪN HOÃN; mở B2 sau khi B1 bắt được kẹt thật hoặc sau 2–3 đợt live sạch nữa.** F-181-T8-3 (sửa extract hardcode tên 86n2) + F-181-T8-1 (X193 stale — dọn hay giữ) đưa vào checklist đợt 182.
8. **(1c') + (f') V1: 0 kích hoạt live đợt này (harness sạch) → ĐƯỢC GIỮ.** V2 (f'') giữ làm dự phòng.
9. Mở từ trước, vẫn đứng: G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 35 (chờ T9-181); R9 (a) lần 20; file oversize 6,4 MB chưa quyết; E-208 kết cục (T9-181); prune lần 57 (T6-182; T6-181 đã làm prune 56); mù #96?/#95?/#94?/#88?/#77? (hole-recheck 25, T2-181) + (m) #56 lần 24; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.

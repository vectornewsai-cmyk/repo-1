# Đợt 176 T8 — HARNESS 6/6 SẠCH (86n2-P1 KHÔNG TÁI DIỄN; KẸT CỘNG DỒN GIỮ 21; CHUỖI "P3 KHÔNG KẸT" 0 → 1) + O8 T8 PASS 3/3 TRÊN #89 (CÙNG BOOT T0) — ĐỀ XUẤT CHUỖI LÊN 26 (PARENT QUYẾT CUỐI)

Ngày: 23/11/2026 (lượt cron 12:35 +07 = 05:35:51Z; T8 mở ~05:41Z, đóng ~06:3xZ — TRONG hạn cờ ~08:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness vite 6/6 (quy trình đợt 175 — (f') V1 + Q3 xong đợt 173, đợt này chỉ giám sát live); (2) giám sát (f') V1 live; (3) Q3 heartbeat 84l10 chạy kiểm lại (md5 `baaa13c0` — không đổi); (4) O8 trên boot hiện tại — phối hợp T0 (hai bộ độc lập, CÙNG BOOT đợt này, xem §A); (5) checklist (o) 21/21; (6) H3 chỉ giám sát thụ động.
Nợ: docs/PHASE9_ROUND175_T8_VITEHARNESS_LIMITS.md (harness 5/6; O8 T8 PASS 3/3 trên #87; chuỗi GIỮ 25).

## 0. Kết luận ngắn — HARNESS 6/6 SẠCH, 0 KẸT; O8 T8 PASS 3/3 TRÊN #89; ĐỀ XUẤT CHUỖI LÊN 26

- **Reboot #89 XÁC NHẬN 9 nguồn (T0-176)**: boot `15618ce8`, btime 05:26:26Z, gap #88→#89 = **1.329 s** (bất thường — chỉ ~18% trung bình các gap ~7,1–7,5 s; T0 ghi là số đo thật, F-176-T0-1); **#87 + #88 XÁC NHẬN 9 nguồn** (nợ đợt 175 đã trả); marker sống qua **41 reboot #49–#89**.
- **Harness (MỘT lần chạy driver duy nhất, boot `15618ce8` #89): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (06:16:15–06:31:34Z, 15'19"): 84l10 **PASS** (W1 +1/+1/+1, W2 playhead 30, E4 ct 4 ended=true); 85m4 **PASS** (P4 +1/+1/+1, P5 0 restart — **P4-lần3 PASS lần thứ năm liên tiếp, chuỗi = 5**); 86n2 **PASS** (P1 PASS — **không kẹt lại ở P1**; P4 +1/+1/+1, P5 0 restart); Chromium 3/3 PASS. **Kẹt cộng dồn GIỮ 21. Chuỗi "P3 không kẹt" 0 → 1.** Chromium đối chứng N=37 → **N=38 mỗi pha**, 0 kẹt.
- **(f') V1 live: 0 kích hoạt — ĐÚNG (0 FP).** Replay C5.1 ĐẠT, 0 FP trên 12 log sạch (164 @125 s, 171 @305 s). **Q3 heartbeat 84l10 chạy kiểm lại đúng thiết kế** (WebKit W2 6 tick, Chromium W2 5 tick, E4 0 tick); 84l10 PASS lần thứ năm liên tiếp (172–176). H3 vẫn mở, chỉ giám sát thụ động.
- **O8 T8 PASS 3/3 trên boot `15618ce8` (#89)**: WebKit 21/21 ×2 (pid 73002 md5 `a533aba9` + pid 73388 md5 `324ee0c8`) + Chromium 21/21 (pid 73764 md5 `eabc8684`), exit 0/0/0, 06:13:08–06:15:46Z (2'38"). S1 PASS cả 3. **CÙNG BOOT BỘ T0: T0-176 O8 cũng PASS 3/3 trên #89** (pid 27289/47727/53755, 05:43:33–05:47:10Z, md5 `c5cb621a`/`943e3caf`/`16671297` theo cờ T0-176) — đồng thuận PASS, cùng boot (khác đợt 175 lệch boot).
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT LÊN 26 (parent/T10 quyết cuối).** 4 chân CÙNG BOOT #89: (1) lượt yên hợp lệ #45 của T4 trên #89 (attempt2 20/20 + B 5/5 + median 46,0 ms, chuỗi 38 → 39); (2) gate (a) cho #89 CÓ CỜ T5 THẬT (POSTBOOT_PASS 05:42:19Z, replay-đầy-đủ, poll=0, KHÔNG caveat); (3) O8 T0 PASS 3/3 trên #89; (4) O8 T8 PASS 3/3 trên #89. Cộng thêm: harness 6/6 sạch trên #89. Lần đầu kể từ đợt 174 cả 4 chân cùng một boot + cờ gate thật + harness sạch.
- **Gate: GATE-FOUND poll=28 06:11:27Z (t4=OK + postboot đường (a))** — KHÁC #87: hai chân cùng đúng trong MỘT poll, không lệch ~1 phút (F-176-T8-2). Postboot=1 trong 27 dòng poll (tất cả); waiter 28 poll, 0 REBOOT, 0 WAIT-DEADLINE. Selfcheck #1 + #2: libs 6/6, GST 1624, dpkg 1545.
- **Watchdog (i): 0 dòng; live-diag (1b): 0; (1c')/(f'): 0 kích hoạt live — ĐÚNG (0 FP, 0 kẹt để bỏ lỡ).** 0 snapshot stall. RAM sampler n=31: balloon max 84,5% trần, 0 ghim; avail min **560 MB @06:27:12Z**.
- **Boot lúc đo = boot lúc đóng: `15618ce8` (#89) — 0 reboot trong phiên O8+harness.** Marker mtime 2026-11-20 11:39:47Z KHÔNG ĐỔI — **sống qua 41 reboot #49–#89 (T0-176 ĐÃ XÁC MINH)**.
- **X11: X194/X195 TÁI XUẤT lần thứ 5 liên tiếp — ĐÃ DỌN** (2 socket + 3 lock file, 0 process sở hữu; xem §6/F-176-T8-1). X11 TRỐNG lúc đóng, 0 process sót, lock vite trống, fixture md5 khớp đợt 125.
- Selfcheck: #1 trên #89 libs 6/6 (replay đã xong trước khi T8 mở); #2 trên #89 libs 6/6 (sau O8, trước harness). T8 không tự cài apt.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 05:26:26 | REBOOT #89 (boot `15618ce8`, gap #88→#89 = 1.329 s; **T0-176 XÁC MINH 9 nguồn**) — TRƯỚC khi đợt mở 9' |
| 05:35:51 | Đợt 176 mở (lượt cron 12:35 +07) |
| 05:42:19 | **POSTBOOT_PASS #89 ĐÃ CÓ** (T5-176, replay-đầy-đủ, poll=0 — cờ thứ hai liên tiếp sau #86) |
| 05:43:33–05:47:10 | **T0-176 O8 DONE: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #89** (sau postboot) |
| ~05:41–05:44 | T8 mở: đọc LIMITS T8-175 + GAP §104 + aggregate 175 §8/§11/§12.3(b)(j); cây + 8 script KHỚP md5 đợt 175; copy driver 175→176 (`cp -r`, exit 0) + đổi nhãn (F-175-T8-6/7/8); cập nhật CẢ HAI symlink diag → `round176-t8/diag-stall-176t8.sh`; fixture /tmp MẤT theo #89 |
| ~05:44 | **Rebuild fixture /tmp trên #89 (hevc `ba0c7c62` / i7 `f05daed8` / h `fbaa3d1a` / g `a1fb8549` — KHỚP đợt 125)** |
| 05:44:23 | **Waiter bắt đầu trên boot `15618ce8` (deadline 07:30Z; poll 1: t4=0 postboot=1)** |
| 05:57:48–06:06:46 | T4 attempt1 wedged pass 15 (exit 3, partial 14/20, 1/3); **attempt2 LUOT HOP LE 20/20 + B 5/5 + median 46,0 ms** (2/3) — **lượt yên #45, chuỗi 38 → 39** |
| 06:11:27 | **GATE-FOUND poll=28** (t4=OK + postboot đường (a) — xem §A); cờ T4 viết 06:11Z, 801 B |
| 06:13:08–06:15:46 | **Selfcheck #2 trên #89: libs 6/6; GST 1624; dpkg 1545**; **O8 T8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #89** (xem §A) |
| 06:16:15–06:31:34 | **Harness (MỘT lần chạy driver duy nhất, boot `15618ce8`): 6/6 PASS, 0 KẸT** (xem §2) |
| ~06:32–06:3x | **Trích số liệu (extract-176t8.py) + replay (1c')/(f'): C5.1 ĐẠT; (f') V1-300: 164@125 s, 171@305 s, 0 FP trên 12 log sạch**; dọn X194/X195 (xem §6); cờ `round176-t8.done` — **TRONG hạn cờ ~08:00Z** |

## A. O8 — PASS 3/3 trên boot `15618ce8` (#89); T8 ĐỀ XUẤT CHUỖI LÊN 26

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 06:13:09–06:14:03 | 0 | **21/21 PASS** — S1 PASS 06:13:20.928Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 06:14:04–06:14:56 | 0 | **21/21 PASS** — S1 PASS 06:14:15.421Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 06:14:56–06:15:46 | 0 | **21/21 PASS** — S1 PASS 06:15:46Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-...-06-13-09-15618ce8-pid73002.json` 21/21, md5 `a533aba9`; attempt2 `o8w-...-06-14-04-15618ce8-pid73388.json` 21/21, md5 `324ee0c8`; Chromium `o8-...-06-14-56-15618ce8-pid73764.json` 21/21, md5 `eabc8684`. **HAI FILE STAMPED RIÊNG BIỆT.** 0 `HARNESS LỖI` / `Target crashed` / `WATCHDOG-137` trong log O8 (PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH` với DEBROOT). Bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness 6/6 trên cùng boot đo (#89), libs 6/6 (selfcheck #1/#2 + POSTBOOT_PASS #89) — **bằng chứng ĐẦY ĐỦ (3/3 pha WebKit pass)** — khác đợt 175 (5/6, không đầy đủ).
- Driver O8 giữ 1 lock vite `t8-round176` suốt lượt (nhả 06:15:46Z; vite sau release TRỐNG, 0 ticket + 101 cooldown). Probe S1 chuẩn bị sẵn (`o8-s1-probe-176t8.mjs`) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Gate cho boot đo `15618ce8`: (a) CÓ CỜ T5 THẬT.** POSTBOOT_PASS trong `round176-t5/` chứa boot `15618ce8` (ghi 05:42:19Z, replay-đầy-đủ, poll=0, KHÔNG caveat — cờ replay-đầy-đủ thứ hai liên tiếp sau #86). Selfcheck T8 #1 (05:43:30Z) + #2 (06:16:08Z) xác nhận độc lập libs 6/6 + GST 1624 + dpkg 1545. **O8 T8 chạy SAU tất cả các bằng chứng trên (06:13:08Z).**
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT LÊN 26 (parent/T10 quyết cuối — T8 KHÔNG tự chốt).** 4 chân CÙNG BOOT #89: (1) lượt yên hợp lệ #45 của T4 TRÊN #89 (attempt2 20/20 + B 5/5 + median 46,0 ms, chuỗi 38 → 39; P1 163/166, P2 157/157, P3-A1 138/166, P3' 126/138 occ = 106/111 distinct, P7 73/73); (2) gate (a) cho #89 — CÓ CỜ T5 THẬT (replay-đầy-đủ, poll=0, không caveat); (3) O8 T0 PASS 3/3 — TRÊN #89 (05:43:33–05:47:10Z, pid 27289/47727/53755, md5 `c5cb621a`/`943e3caf`/`16671297` theo cờ T0-176); (4) O8 T8 PASS 3/3 TRÊN #89. **Thêm nữa: harness trên #89 6/6 sạch (0 kẹt), nên #89 là boot sạch hoàn toàn theo mọi thước đo của T8.** Lần đầu kể từ đợt 174 cả 4 chân cùng một boot + cờ gate thật + harness sạch.
- **O8 đợt này 2'38" tổng** (175: 2'32", 174: 2'36") — trong khung các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 6/6 PASS, 0 KẸT

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 06:16:15–06:17:25 | **PASS** — W1 ×3 (+1/+1/+1), W2 PASS (playhead 30, Δ=0), E4 PASS (ct 4, ended=true, restart 3→3) — **84l10 PASS trọn vẹn lần thứ năm liên tiếp (172–176); Q3 W2 6 tick đúng (§D)** |
| 2 | WebKit 85m4 | 0 | 06:17:40–06:19:51 | **PASS** — P1/P2/P3 PASS, P4 ×3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** — **P4-lần3 PASS lần thứ năm liên tiếp (chuỗi = 5)** |
| 3 | WebKit 86n2 | 0 | 06:20:06–06:23:57 | **PASS** — P1 PASS — **KHÔNG KẸT LẠI Ở P1 (chữ ký mới đợt 175, lần 1, không tái diễn)**; P2/P3 PASS, P4 ×3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** — **86n2 P4 có verdict mới sau đợt 175** |
| 4 | Chromium 84l10 | 0 | 06:24:12–06:25:12 | **PASS** — W1 +1/+2/+1 (+2 là artifact, F-176-T8-8), W2 PASS (playhead 30, Δ=0), E4 PASS (ct 3,96, ended=false, restart 6→6) — **Q3 W2 5 tick đúng** |
| 5 | Chromium 85m4 | 0 | 06:25:27–06:27:28 | **PASS** — P1/P2/P3 PASS, P4 +1/+2/+1 (+2 là artifact, F-176-T8-8), P5 PASS 40 s **0 restart** (finishedAt 06:27:26.288Z) |
| 6 | Chromium 86n2 | 0 | 06:27:44–06:31:34 | **PASS** — P1/P2/P3 PASS, P4 ×3 PASS (+1/+1/+1 — sạch), P5 PASS 40 s **0 restart** (finishedAt 06:31:24.195Z) |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (finishedAt 06:17:21–06:31:24Z).
- Môi trường: system libs trên boot `15618ce8` (POSTBOOT_PASS #89 + selfcheck #1/#2 libs 6/6 + GST 1624 + dpkg 1545). **WebKit launch + PASS 3/3 pha bằng system libs** trên ĐÚNG boot đo.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 15'19"** (06:16:15–06:31:34Z) — trong khung các đợt sạch (172–174: ~15'30"–15'43"; 175: 26'33").

### 86n2-P1: chữ ký mới đợt 175 KHÔNG tái diễn

- Đợt 175: 86n2 kẹt exit 124 tại waitForPlaySync-P1 (watchdog 03:43:42Z, probe TIMEOUT, browser sống RSS 343 MB, kênh evaluate chết). Đợt này: P1 PASS ngay lần đầu (06:20:38Z, không restart dư) — không watchdog, không probe TIMEOUT, không live-diag. **86n2-P1 vẫn là điểm kẹt lần 1 (đợt 175), chưa đủ điều kiện mở điều tra riêng (cần tái diễn).**
- Chuỗi verdict 86n2: P4-lần3 có verdict PASS mới (đợt 175 không có verdict vì kẹt trước P4); P4-lần2 verdict 25 (đợt 174) → có verdict mới đợt này (PASS +1). Không gộp verdict pha con với verdict pha, không gộp các đợt.

## 3. Watchdog trong lượt này — 0 DÒNG (ĐÚNG — 0 KẸT THẬT) + LIVE-DIAG 0 + (1c') VỚI (f') 0 KÍCH HOẠT (ĐÚNG — 0 FP)

- **Watchdog (i): 0 dòng WATCHDOG-137 — ĐÚNG.** 0 dòng trong cả 3 log WebKit + 0 trong summary O8. 0 false-positive.
- **Driver (1b) live-diag: 0 kích hoạt — ĐÚNG.** `live_diags=0` ở cả 6 pha.
- **(1c') fresh-content với (f') V1: 0 kích hoạt live — ĐÚNG, 0 FALSE-POSITIVE.** Log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2) — check-fresh OK maxspan=0 s. **Đợt này 0 kẹt nên 0 kích hoạt là đúng — không có ca kẹt để bỏ lỡ, kể cả ngoài phạm vi (86n2 P1 PASS).** (c') + (f') ĐƯỢC GIỮ (xem §C).
- 0 snapshot stall (đúng — 0 kẹt thật).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–175).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–176) + `t8-diag-stall.sh` → 176 (CẢ HAI symlink cập nhật 05:43Z) | 6 harness + 3 O8; **0 kẹt thật → 0 dòng, 0 FP** | **ĐÚNG — KHÔNG CÓ KẸT ĐỂ BẮT.** 0 snapshot `stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–176) | 6 harness; `live_diags=0` cả 6 pha | **0 kích hoạt — ĐÚNG** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 | **(f') ĐÃ TRIỂN KHAI từ đợt 173** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 harness (85m4 + 84l10 W2/E4 có HB128) | **0 kích hoạt live — 0 FP. (c')+(f') ĐƯỢC GIỮ (xem §C).** Replay: C5.1 ĐẠT (164 @125 s; 0 FP trên 12 log sạch) + (f'): 171 @305 s |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-176t8.sh` (cột `balloon_kb`) | 1 log sampler (n=31) | Balloon n=31 pinned=0 min=3.599.688 max=5.445.548 (84,5% trần) mean=4.826.130; avail min=560 MB @06:27:12Z / max 2.681 MB |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (06:25:12Z), 85m4 PASS (06:27:28Z), 86n2 PASS (06:31:34Z)** — exit 0 cả 3 | N cộng dồn **N=38 mỗi pha** (đợt 137/139/141–176 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt (đúng)** | 0 snapshot stall |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | baaa13c0 | baaa13c0 | Không (Q3 từ đợt 173) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không |

- **T8 không sửa file repo nào đợt này** (chỉ thêm LIMITS này). Driver thay đổi so với đợt 175: nhãn `LIVE-DIAG/FRESH-CONTENT-175` → `176`, lock `t8-round175` → `t8-round176`, deadline waiter 04:30Z → **07:30Z 23/11**, nhãn `T8-175` → `T8-176`, WAIT1 sửa đúng boot `15618ce8`, replay thêm entry 176-sạch (F-175-T8-6), extract sửa W → repo path + ovsize → LIMITS 176 (F-175-T8-7), dọn `o8-*/` trước khi copy (F-175-T8-8). Copy bằng `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round176-t8/`** (như đợt 175; replay đọc log lịch sử từ goals).
- Extract `extract-176t8.py`: glob tất cả log waiter (28 poll, GATE-FOUND poll=28, 0 WAIT-DEADLINE, 0 REBOOT; postboot=1 trong 27 dòng — TẤT CẢ cho boot `15618ce8`). Replay (1c') `replay-1c-176t8.py` + (f') `replay-f-fix-176t8.py` (thêm entry 176-sạch).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round176` 06:15:46Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium 06:31:34Z).
- Waiter hết việc GATE-FOUND poll=28 06:11:27Z (exit 0); 0 process waiter còn lại.
- Kiểm cuối ~06:32Z: process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: **0**; lock vite TRỐNG (0 ticket + 101 cooldown); boot `15618ce8` ổn định TRONG O8+harness (btime không đổi — **0 reboot trong phiên**).
- `/tmp/.X11-unix/` lúc mở TRỐNG (sau reboot); lúc kiểm cuối (extract 06:32Z) có **X194 + X195** — **ĐÃ DỌN** (xem F-176-T8-1): 2 socket (05:50Z) + 3 lock file (.X193 06:03Z, .X194/.X195 05:50Z), 0 Xvfb đang chạy — socket mồ côi. Sau khi dọn: `/tmp/.X11-unix/` TRỐNG, 0 file `.X*-lock`. Socket của chính T8 driver tự unlink.
- Fixture /tmp: rebuild trên #89 (md5 khớp); kiểm cuối sau harness vẫn khớp (`ba0c7c62` / `f05daed8` / `fbaa3d1a` / `a1fb8549`).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (repair là của T5); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `15618ce8` (#89 — T0-176 XÁC MINH 9 nguồn)** — boot lúc đo (không đổi trong phiên O8+harness). **Chuỗi: T8 ĐỀ XUẤT LÊN 26 (parent/T10 quyết cuối)** — xem §A.
2. **Harness 6/6 + 0 KẸT — kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1.** Đợt sạch đầu tiên kể từ đợt 174. Đừng gộp verdict pha con với verdict pha, đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đã đầy đủ trên boot `15618ce8` (POSTBOOT_PASS #89 + selfcheck #1/#2). Bằng chứng "WebKit chạy bằng system libs" là harness trên cùng boot đo (xem §A) — **harness 6/6 nên bằng chứng ĐẦY ĐỦ (3/3 pha pass)**.
4. **POSTBOOT_PASS cho boot đo `15618ce8` CÓ CỜ T5 THẬT** (05:42:19Z, replay-đầy-đủ, poll=0, KHÔNG caveat) — khác #87 (không cờ). O8 T8 chạy SAU cờ (06:13:08Z); O8 T0 cũng sau cờ, cùng boot.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=31, max 84,5% trần) — avail min 560 MB @06:27:12Z (pha Chromium; 0 kẹt nên không kết luận). Giao T9 đối chiếu sampler của họ.
6. **86n2 vẫn oversize 39.194 B (>37.768 B)** — như đợt 142–176 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict đợt này: 85m4 P4-lần3 PASS lần thứ năm liên tiếp (chuỗi = 5); 84l10 PASS trọn vẹn lần thứ năm; 86n2 P4 có verdict mới; 86n2-P1 không tái diễn.** H3 vẫn mở, chỉ giám sát thụ động (xem §B). Điều tra riêng 84l10 ĐỢT 5 (xem §D).
8. **84l10 E4 ended=true (WebKit) / false (Chromium)** — như đợt 175. Script verdict vẫn PASS cả hai; đừng trích ended thành FAIL.
9. **T8 ĐÓNG TRONG hạn cờ ~08:00Z (~06:3xZ)** — O8 xong 06:15:46Z; harness xong 06:31:34Z (15'19", 0 timeout); trích số xong ~06:32Z. **0 reboot trong phiên O8+harness; 1 reboot trước phiên (#89, gap 1.329 s, F-176-T0-1).**
10. **Reboot #89 TRƯỚC phiên (T0-176 XÁC MINH 9 nguồn; gap #88→#89 = 1.329 s — bất thường, F-176-T0-1); #87/#88 XÁC MINH 9 nguồn; marker sống qua 41 reboot #49–#89**; (m) #88 + INSIDE #88 thuộc T2-176.
11. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173, 0 kích hoạt, 0 FP, 0 bỏ lỡ (0 kẹt)** — replay C5.1 ĐẠT (164 @125 s; 0 FP trên 12 log sạch); kiểm lại (f'): 171 @305 s (xem §C).
13. **Chromium delta=+2 artifact: 2 ĐIỂM đợt này** (84l10 W1-lần2 +2; 85m4 P4-lần2 +2; đợt 175: 4 điểm) — cùng họ artifact ghi đè ended còn bật; verdict vẫn PASS tất cả. **WebKit các pha PASS đều delta=+1 sạch.**

## 8. Sai số mới (F-176-T8-N)

- **F-176-T8-1 — X194/X195 TÁI XUẤT LẦN THỨ 5 LIÊN TIẾP (ĐÃ DỌN).** Socket X194/X195 (05:50Z) + lock file .X193 (06:03Z) + .X194/.X195 (05:50Z), 0 Xvfb đang chạy lúc kiểm cuối 06:32Z — socket mồ côi (chủ cũ có thể là O8 của T0 hoặc suite của T1). Đã xóa 2 socket + 3 lock file; sau khi dọn `/tmp/.X11-unix/` TRỐNG. Lần thứ 5 liên tiếp (172–176) — giao T8-177 kiểm lại.
- **F-176-T8-2 — GATE-FOUND ĐÚNG MỘT POLL (KHÁC #87 — KHÔNG LỆCH).** Poll 28 (06:11:27Z): t4=OK + postboot đường (a) cùng đúng — cờ T4 viết 06:11Z, cờ T5 có từ 05:42:19Z. Khác F-175-T8-2 (lệch ~1 phút, không bao giờ GATE-FOUND): đợt này cờ T5 có sẵn từ trước khi T4 đóng. Postboot=1 trong 27/27 dòng poll. Không cần nới lỏng 900 s cho đường (b) đợt này.
- **F-176-T8-3 — GAP #88→#89 = 1.329 s (BẤT THƯỜNG — THUỘC T0).** Chỉ ~18% trung bình các gap gần đây (~7,1–7,5 s). T0-176 ghi là số đo thật (F-176-T0-1), không suy đoán nguyên nhân. T8 chỉ ghi nhận (boot #89 vẫn XÁC MINH 9 nguồn).
- **F-176-T8-4 — T4 ATTEMPT1 WEDGED PASS 15 (EXIT 3, PARTIAL 14/20 — KHÔNG TÍNH VERDICT).** T4-176 attempt1 (05:57:48–06:02:57Z) wedged ở pass 15; attempt2 chạy sạch, lượt hợp lệ #45. Wedge thuộc T4 (harness T8 chạy sau khi T4 đóng, 0 kẹt). Kiểu F-174-T4-1; attempt2 cứu được lượt.
- **F-176-T8-5 — 0 VI PHẠM QUY TẮC ĐỨNG ĐỢT NÀY (CHUỖI VI PHẠM 2 ĐỢT DỨT).** T4 ghi trong cờ: 0 vi phạm (chuỗi F-174-T2-5 + F-175-T4-2 đứt). T8 không chạy script nặng / không probe dpkg trong cửa sổ attempt của T4.
- **F-176-T8-6 — RUN 175 CLAIMED→FINISHED 88 s ≥ 60 s (ỨNG VIÊN CA THỨ CHÍN — THUỘC T7/T10).** Theo cờ T0-176 (F-176-T0-3): run 175 SUCCEEDED finished 05:24:21Z, claimed→finished 88 s. T8 không phán — chỉ ghi nhận (số ca GIỮ 8 cho tới khi parent quyết).
- **F-176-T8-7 — (c')/(f') MÙ VỚI 86n2 VẪN ĐỨNG (F-175-T8-4 CHƯA ĐƯỢC QUYẾT).** Script 86n2 vẫn không có HB128 — đợt này 86n2 PASS nên mù không gây bỏ lỡ, nhưng nếu 86n2 kẹt lại ở P1 thì (c')/(f') vẫn mù. Câu hỏi cho parent/T10 (từ đợt 175) vẫn mở: có thêm HB128 vào script 86n2 hay giữ nguyên phạm vi (c') = 85m4 + 84l10.
- **F-176-T8-8 — ARTIFACT BẮN LẶP DELTA=+2: 2 ĐIỂM ĐỢT NÀY (ĐỢT 175: 4 ĐIỂM).** Chromium 84l10 W1-lần2 +2; 85m4 P4-lần2 +2 — cùng họ artifact ghi đè ended còn bật; verdict vẫn PASS tất cả. **WebKit các pha PASS đều delta=+1 sạch; Chromium 86n2 P4 đều +1 sạch.**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT LÊN 26 (parent/T10 quyết cuối).** 4 chân cùng boot #89 (T4 #45 + gate (a) cờ thật + O8 T0 + O8 T8) + harness 6/6 sạch.
2. **Kẹt 86n2-P1 (đợt 175): KHÔNG tái diễn; kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1.** 85m4 P4-lần3 PASS lần thứ năm (chuỗi = 5); 84l10 PASS trọn vẹn lần thứ năm; 86n2 P4 có verdict mới. Nếu tái diễn thì mở điều tra riêng như 84l10.
3. **(c')/(f') mù với 86n2 (F-176-T8-7):** có thêm HB128 vào script 86n2 hay giữ nguyên phạm vi? Cần quyết parent/T10 trước khi đổi script test.
4. **Gate (a) cho #89 (F-176-T8-2):** CỜ T5 THẬT, replay-đầy-đủ, poll=0, không caveat — chấp nhận đứng cho chuỗi KHÔNG caveat (như #86, quyết (c) đợt 175)? Câu hỏi nới lỏng 900 s cho đường (b) vẫn mở.
5. **(m) #88 DƯƠNG ỨNG VIÊN (+33,431 s) + INSIDE #88 (FULL134) + gap 1.329 s (F-176-T8-3) — thuộc T2-176 + parent 176.**
6. **Đối chứng Chromium cùng pha: N cộng dồn N=38 mỗi pha** — Chromium 0 kẹt mọi đợt.
7. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173 — 0 kích hoạt, 0 FP, 0 bỏ lỡ (0 kẹt) → ĐƯỢC GIỮ.** V2 (f'') giữ làm dự phòng. Nếu đợt sau có kẹt 85m4 dạng paused+seeking, (f') sẽ bắt ở ~elapsed 305 s.
8. **Reboot #89 TRƯỚC phiên — số hiệu ĐÃ XÁC MINH (T0-176, 9 nguồn)**; marker sống qua 41 reboot #49–#89. **0 vi phạm quy tắc đứng.**
9. **POSTBOOT_PASS #89 CÓ CỜ T5** (T5-176, replay-đầy-đủ, poll=0); #87/#88 CHƯA CÓ cờ — KHÔNG bù được (tổng boot không cờ 16 → 18); hướng (3) vẫn đứng.
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-176 — lần thứ 30 nếu 0); R9 (a) nhắc lần 16; file oversize 6,4 MB chưa quyết; E-188/E-189/E-190 (T9-176); run 175 claimed→finished 88 s — ứng viên ca ≥60 s thứ chín (F-176-T8-6, T7-176/T10-176); DR 06:00Z + HB 05:20:50Z (T7-176); #87/#88 có giết holder không + prune 51 (T6-176); mù #96?/#95?/#94?/#88?/#77? (hole-recheck lần 20) + (m) #56 lần 19 (T2-176); nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 KIỂM LẠI: KẸT-171 @305 s, KẸT-164 @125 s, 0 FP TRÊN 12 LOG SẠCH; LIVE ĐỢT NÀY 0 KÍCH HOẠT (0 KẸT)

## C1. Thiết kế (c') + (f') V1 (đã triển khai đợt 173, giữ nguyên đợt 174/175/176, không đổi code)

- **(c'):** trong vòng poll của `run_one`, lấy chuỗi liên tiếp (trailing run) các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi `elapsed mới nhất − elapsed đầu chuỗi ≥ 120 s` VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất.
- **(f') V1:** miễn (f) khi trailing sub-run liên tục `paused=true + seeking=true` (cùng tag+playhead+ct) đã ≥300 s. (e) giữ nguyên; ngưỡng 120 s, run_len ≥3, ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3. **86n2 KHÔNG có HB128 — ngoài phạm vi (F-176-T8-7).**
- **V2 (f'') giữ làm dự phòng, KHÔNG triển khai.**

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh-176t8.py — ~05:45Z)

| Log | HB128 | check-fresh-176t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng | **TRIGGER elapsed=125 s** (run 5 s→125 s, 25 dòng, span=120 s) |
| 171-ket-85m4 | 174 dòng | **TRIGGER elapsed=305 s** (run 5 s→305 s, 61 dòng, span=300 s — qua (f') MỚI) |
| 175-sạch 85m4 | 19 dòng | OK maxspan=5 s |

## C3. Replay sau harness (replay-1c-176t8.py + replay-f-fix-176t8.py, chạy ~06:32Z — thêm log 176-sạch)

- **Tiêu chí C5.1 — RUNSPAN (V0): ĐẠT.** Kẹt-164 TRIGGER đúng elapsed=125 s; sạch-163/165/166/167/168/169/170/172/173/174/175/176 đều KHÔNG kích hoạt (max run span 5 s — biên 24×). **0 FP trên 12 log sạch.**
- **(f') V1-300: ĐẠT** — kẹt-164 @125 s, kẹt-171 @305 s, 0 FP. (V0: 171 KHÔNG kích hoạt — đúng vấn đề cũ; V1-180: 171 @185 s; V1-600: 171 @605 s; V2: 171 @125 s — tất cả 0 FP.)
- **Chạy thật đợt này: FRESH-CONTENT-176 = 0 kích hoạt trong 6 pha — 0 FP, 0 BỎ LỠ (0 kẹt).** Log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2) — check-fresh OK maxspan=0 s. **86n2 P1 PASS nên mù (c')/(f') với 86n2 không gây bỏ lỡ đợt này (F-176-T8-7).** (c') + (f') ĐƯỢC GIỮ.
- Chú thích: entry '171-ket-85m4' là **log KẸT thật** — "KHÔNG kích hoạt" ở replay V0 là **(c') V0 BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Với (f') mới, kẹt này bắt được @305 s.

---

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 5 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY)

## D1. Phạm vi điều tra (parent chốt đợt 171, giữ nguyên đợt 172/173/174/175/176)

- **Phạm vi = 84l10 qua 3 điểm kẹt** (157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425 — 3 call-site khác nhau, cùng vùng W2/E4, cùng script `baaa13c0` KHÔNG ĐỔI).
- **KHÔNG gộp 85m4-P4 / 86n2-P4-lần3 vào điều tra này** (chữ ký khác nhau). **86n2-P1 đợt 175 là chữ ký mới, theo dõi riêng (lần 1) — KHÔNG tái diễn đợt này.**
- **Chủ trì: T8-176 (đợt 5).** Đợt này 84l10 PASS đầy đủ lần thứ năm liên tiếp nên chưa có điểm dữ liệu kẹt mới — công việc đợt 5 là chạy kiểm lại Q3 (xem D2).

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 176 (HEARTBEAT CHẠY ĐÚNG)

| Engine | W2 HB128 | E4 HB128 | W2 | E4 |
|---|---|---|---|---|
| WebKit | **6 tick** (5/10/15/20/25/30 s; playhead 4,1→29,567; seeking=false playing=true) | **0 tick** (vòng khỏe ~4–5 s — tick 5 s chưa kịp bắn; đúng thiết kế) | PASS (playhead 30, Δ=0) | PASS (ct 4, ended=true, restart 3→3) |
| Chromium | **5 tick** (5/10/15/20/25 s; playhead 5,167→25,133; seeking=false playing=true) | **0 tick** (như WebKit) | PASS (playhead 30, Δ=0) | PASS (ct 3,96, ended=false, restart 6→6) |

- **Không FP từ Q3:** check-fresh trên log 84l10 cả hai engine: OK maxspan=0 s (W2 playhead luôn tiến; E4 0 tick). FRESH-CONTENT-176 live = 0 (xem §3).
- **Hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên** (xem §D đợt 173): 157 E4 :457; 170 W2 :433; 171 W2-setup :425.

## D3. Câu hỏi mở (chưa có câu trả lời — giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Thủ phạm là chuyển trạng thái hay vòng poll?** Vẫn mở — cần ca thứ tư để phân biệt. **Nay đã có Q3: nếu ca thứ tư xảy ra, heartbeat sẽ ghi trạng thái media lúc chết.**
- **Q2 — Lib hệ thống hay engine?** Vẫn mở — probe: chạy harness 84l10 một lần dưới LD_LIBRARY_PATH DEBROOT. Chưa chạy (cần quyết parent/T10 vì đổi biến môi trường của harness chuẩn).
- **Q3 — Trạng thái media element lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 176 — heartbeat chạy đúng cả hai engine.** Chờ ca kẹt thứ tư.
- **Q4 — Có phải race giữa evaluate và GStreamer seek/play?** Vẫn mở — chỉ là tương quan thời điểm, chưa có bằng chứng trực tiếp.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ tư, ghi ngay call-site + dòng log cuối + RSS chuỗi + dòng HB128 cuối (state lúc chết) + đối chiếu Q1; nếu PASS tiếp 2–3 đợt, hồ sơ giữ nguyên, không vội kết luận "đã hết kẹt" (tần suất ~20% nên 5 đợt sạch liên tiếp vẫn trong kỳ vọng, ~0,8^5 ≈ 33%).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 176 (0 KẸT MỚI; 86n2-P1 KHÔNG TÁI DIỄN; H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG)

## B1. Trạng thái giả thuyết sau đợt 176 (H3 vẫn mở — 0 kẹt mới)

| Giả thuyết | Trạng thái đợt 175 | Trạng thái đợt 176 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 560 MB trong pha Chromium 85m4, nhưng 0 kẹt đợt này; avail thấp mà vẫn 6/6 PASS |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — 0 kẹt đợt này nên không có cửa sổ kẹt để đối chiếu |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 1 kẹt mới (86n2-P1) | **VẪN MỞ — 0 KẸT MỚI (86n2-P1 không tái diễn)** — không có bằng chứng mới; chữ ký 86n2-P1 vẫn lần 1 (đợt 175) |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại 153, 170, 171) | **BÁC BỎ (đứng nguyên; 0 kẹt đợt này)** |

- Đợt 176 T8 chỉ giám sát thụ động: **0 kẹt trong 6 lần chạy harness + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết mới.
- **Điều kiện mở điều tra H3 KHÔNG đạt:** theo quyết (i) đợt 158, điều kiện là 85m4 P4-lần3 tái diễn lần 3 — đợt này 85m4 P4-lần3 PASS lần thứ năm liên tiếp (chuỗi = 5, hướng ngược lại). **Riêng 84l10: điều tra riêng ĐÃ MỞ đợt 5 (xem §D) — H3 tổng vẫn chỉ giám sát thụ động.**

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 176 (xem §4 — tóm tắt: (1) 0 dòng; (1b) 0 kích hoạt; (1c')+(f') 0 kích hoạt, 0 FP; (2) balloon n=31, 0 ghim, max 84,5% trần; (3) Chromium N=38/pha; (4) 0 snapshot stall)

## B3. Chữ ký kẹt — đợt 176: 0 KẸT

| Trường | 86n2 WebKit (đợt 175 — KẸT) | 86n2 WebKit (đợt 176 — PASS) |
|---|---|---|
| Pha / script | WebKit 86n2, `clicktest-86n2-webkit-w7.mjs` (md5 **`628088bd`**) | Cùng script, md5 không đổi |
| Thời gian | 03:42:30–03:57:31Z (exit 124, 901 s) | 06:20:06–06:23:57Z (exit 0, 231 s) |
| Kết quả | Kẹt tại waitForPlaySync-P1; P1 không trả về; report phases {} | P1 PASS 06:20:38Z; P2/P3 PASS; P4 ×3 PASS (+1/+1/+1); P5 PASS 0 restart; report ok=true |
| RAM lúc chạy | Avail 660–871 MB lúc bắt đầu → min 268 MB | Avail min toàn harness 560 MB @06:27:12Z (pha Chromium) |

---

# §E — CHECKLIST (o) ĐỢT 176 (nợ mở từ đợt 175 §11/§12.3(o) — các F-175 còn lại + quy tắc đứng; T8-176 thực hiện và báo kết quả từng mục)

Phạm vi checklist (o) = quyết (o) đợt 175 §12.3 (cửa slot + HB/DR) + các F-175 còn lại (gom thành 21 hàng như §E đợt 175). T8-176 đã đi qua từng mục — mục nào thuộc T8 thì thực hiện, mục nào thuộc luồng khác thì ghi nhận đúng chủ.

| # | Mục quyết (o) đợt 175 | Kết quả T8-176 |
|---|---|---|
| o1 | F-175-T0-1 (watcher +36 s) | **GHI NHẬN — KHÔNG LẶP LẠI:** khoảng không-watcher 9.367 s (T5-176) |
| o2 | F-175-T0-2 (2/9 nguồn gián tiếp) | **GHI NHẬN.** T0-176 xác minh #89 + #87/#88 9 nguồn |
| o3 | F-175-T0-3 + F-175-T7-2 (số ca ≥60 s) | **ĐÓNG từ đợt 175.** MỚI: run 175 claimed→finished 88 s — **ứng viên ca thứ chín** (F-176-T0-3) |
| o4 | F-175-T0-4 (caveat phân số (m)) | **GHI NHẬN.** (m) #88 thuộc T2-176 + parent 176 |
| o5 | F-175-T0-5 (lỗi gõ epoch) | **ĐÓNG từ đợt 174.** T8-176 kiểm btime bằng awk/stat |
| o6 | F-175-T0-6 (O8 trước postboot) | **GHI NHẬN.** 176: O8 T0 SAU POSTBOOT_PASS #89 (05:43:33Z > 05:42:19Z); O8 T8 sau cờ + selfcheck (06:13:08Z) |
| o7 | F-175-T0-7 (curl 403) | **GHI NHẬN — không gặp đợt này** |
| o8 | F-175-T1-1 (X11 X193/X194/X195) | **ĐÃ DỌN (F-176-T8-1):** X194/X195 tái xuất lần 5 — dọn 2 socket + 3 lock file, 0 process sở hữu; X11 TRỐNG lúc đóng |
| o9 | F-175-T1-2 (RAM lúc mở suite) | **GHI NHẬN.** 176: avail 1.221 MB lúc mở; 560 MB min trong harness |
| o10 | F-175-T1-3 (O8 chồng suite) | **GHI NHẬN.** 176: O8 T0 chồng poll T4, 0 attempt lúc đó; O8 T8 + harness sau T4 |
| o11 | F-175-T2-2 (caveat watcher (m)) | **GHI NHẬN.** (m) #88 thuộc T2-176 (xem cờ T2-176) |
| o12 | F-175-T2-5 (vi phạm script nặng) | **ĐÃ DỨT (F-176-T8-5):** 0 vi phạm |
| o13 | F-175-T4-1 (attempt1 PAGE-WEDGED) | **GHI NHẬN — LẶP LẠI Ở T4 (F-176-T8-4):** attempt1-176 wedged pass 15 (exit 3); attempt2 cứu lượt #45 |
| o14 | F-175-T4-2 (vi phạm lần thứ hai) | **ĐÃ DỨT (xem o12).** Mâu thuẫn T2/T4 giao T2-176/T10-176 làm rõ |
| o15 | F-174-T4-3/4/5 (pgrep; stats "gan-mo"; p1p3p7 — từ 174/175) | **GHI NHẬN.** T4-176 không báo lặp lại trong cờ |
| o16 | F-175-T5-1 (poll cuối watcher SAU btime) | **GHI NHẬN.** 176: khoảng không-watcher 9.367 s (T5-176) |
| o17 | F-175-T5-6 (replay một phần) | **KHÔNG LẶP LẠI Ở #89** (replay-đầy-đủ, poll=0); #87/#88 CHƯA CÓ cờ (T5-176) |
| o18 | F-175-T6-1 (harness chồng pha T4/T0) | **GHI NHẬN.** 176: harness T8 SAU khi T4 đóng (06:16Z > 06:11Z) |
| o19 | F-175-T6-4 (POSTBOOT trong cửa sổ harness) | **KHÔNG XẢY RA 176** (cờ #89 viết 05:42:19Z) |
| o20 | F-175-T8-1..12 | **ĐÃ THỰC HIỆN:** #89 trước phiên (đã xác minh); GATE-FOUND đúng một poll (F-176-T8-2); 86n2-P1 không tái diễn (§2); (c')/(f') mù với 86n2 vẫn mở (F-176-T8-7); selfcheck #1/#2 libs 6/6; replay chỉ thêm entry 176-sạch; extract chạy ngay từ đầu; `o8-*/` dọn trước khi copy; delta +2 còn 2 điểm; E4 ended WebKit true / Chromium false; o8-driver hết nhãn sót; waiter GATE-FOUND |
| o21 | Quyết (l) đợt 152 (hạn cờ; marker; gap) | **ĐÃ THỰC HIỆN — T8 ĐÓNG TRONG hạn cờ ~08:00Z.** Marker sống qua 41 reboot #49–#89; gap 1.329 s (F-176-T0-1) |

- **Kết quả checklist (o): 21/21 mục đã thực hiện hoặc ghi nhận đúng chủ — 0 mục bỏ sót.** T8 tự thực hiện: o8 (X11 dọn sạch), o12/o14 (0 vi phạm), o20 (bài học cp/replay/extract/o8-driver), o21 (đóng TRONG hạn cờ). Chuyển giao đúng chủ: o3/o9 (T1/T10), o11/o17 (T2), o13 (T4), o18/o19 (T5/T6).
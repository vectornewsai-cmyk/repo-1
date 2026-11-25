# Đợt 177 T8 — HARNESS 6/6 SẠCH TRÊN #91 (86n2-P1 KHÔNG TÁI DIỄN; KẸT GIỮ 21; CHUỖI "P3 KHÔNG KẸT" 1 → 2) + O8 T8 PASS 3/3 TRÊN #91 — 4 CHÂN TÁCH BOOT (KHÔNG ĐỀ XUẤT LÊN 27)

Ngày: 23/11/2026 (lượt cron 15:35 +07 = 08:35:51Z; T8 mở ~08:39Z, đóng ~10:5xZ — TRONG hạn cờ ~11:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness vite 6/6; (2) giám sát (f') V1 live; (3) Q3 heartbeat 84l10 chạy kiểm lại (md5 `baaa13c0` — không đổi); (4) O8 trên boot hiện tại; (5) checklist (o) 21/21; (6) H3 chỉ giám sát thụ động; (7) đề xuất phương án mở rộng (c')/(f') cho 86n2 (F-177-T8-7, §F).
Nợ: docs/PHASE9_ROUND176_T8_VITEHARNESS_LIMITS.md (harness 6/6 trên #89; O8 T8 PASS 3/3 trên #89; chuỗi LÊN 26 đã được parent quyết).

## 0. Kết luận ngắn — HARNESS 6/6 SẠCH TRÊN #91, 0 KẸT; O8 T8 PASS 3/3 TRÊN #91; GATE MỞ BẰNG T8-CHECK-ONLY (CẦN PARENT XÁC NHẬN LẠI)

- **Reboot #91 GIỮA PHIÊN (boot `8c0ec92d`, btime 09:07:40Z, gap 7.031 s theo cờ T4-177)** — sau khi T0/T1/T2/T4/T5/T6 đóng; **số hiệu #91 CHỜ T0-178 xác minh**. Marker mtime 2026-11-20 11:39:47Z KHÔNG ĐỔI — sống qua **42 reboot #49–#90 (T0-177 ĐÃ XÁC MINH)**; qua 43 NẾU #91 được xác nhận.
- **Harness (MỘT lần chạy driver duy nhất, boot `8c0ec92d` #91): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (10:28:52–10:45:08Z, 16'16"): 84l10 **PASS** (W1 +1/+1/+1, W2 playhead 30, E4 ct 0 ended=false); 85m4 **PASS** (P4 +1/+1/+1, P5 0 restart — **P4-lần3 PASS lần thứ sáu liên tiếp, chuỗi = 6**); 86n2 **PASS** (P1 PASS — **không kẹt lại ở P1 lần thứ hai liên tiếp**); Chromium 3/3 PASS, **delta=+2 HẾT (0 điểm)**. **Kẹt cộng dồn GIỮ 21. Chuỗi "P3 không kẹt" 1 → 2.** Chromium N=38 → **N=39 mỗi pha**, 0 kẹt.
- **(f') V1 live: 0 kích hoạt — ĐÚNG (0 FP).** Replay C5.1 ĐẠT, 0 FP trên 13 log sạch (164 @125 s, 171 @305 s). **Q3 heartbeat 84l10 chạy kiểm lại đúng thiết kế** (WebKit W2 6 tick + **E4 2 tick — MỚI so với đợt 176 (0 tick)**; Chromium W2 5 tick, E4 0 tick); 84l10 PASS lần thứ sáu liên tiếp (172–177). H3 vẫn mở, chỉ giám sát thụ động.
- **O8 T8 PASS 3/3 trên boot `8c0ec92d` (#91)**: WebKit 21/21 ×2 (pid 16268 md5 `febee244` + pid 16643 md5 `a5002552`) + Chromium 21/21 (pid 17020 md5 `617b2bde`), exit 0/0/0, 10:24:32–10:27:26Z (2'54"). S1 PASS cả 3.
- **Gate: KHÔNG MỞ qua (a)/(b) — waiter WAIT-DEADLINE 10:30Z poll=82.** POSTBOOT_PASS #91 KHÔNG CÓ (T5-177 đóng cờ #90 ~08:59Z rồi KHÔNG resume sau #91 — 0 file mới từ 09:07Z, 76+ phút); gate0wait T4 chỉ cho #90. **T8 chạy O8 + harness theo fallback T8-check-only (F-177-T8-4): T4 ĐÃ ĐÓNG (cờ 09:10Z, attempt1 xong 09:00:35Z) + selfcheck #2 của T8 trên #91: libs 6/6 + GST 1624 + dpkg 1.523 (replay xong, 0 apt process). CẦN PARENT/T10 XÁC NHẬN LẠI; T8 KHÔNG tự chốt.**
- **4 chân TÁCH BOOT — T8 KHÔNG ĐỀ XUẤT LÊN 27.** Lượt yên #46 + gate (a) #90 + O8 T0 đều trên #90; O8 T8 + harness trên #91. Không thể chạy lại trên #90. Chuỗi giữ 26 (parent/T10 quyết cuối).
- **Watchdog (i): 0 dòng; live-diag (1b): 0; (1c')/(f'): 0 kích hoạt live — ĐÚNG (0 FP).** 0 snapshot stall. RAM sampler n=33: balloon max 91,3% trần, 0 ghim; avail min **520 MB @10:36:52Z**.
- **Boot lúc đo = boot lúc đóng: `8c0ec92d` (#91) — 0 reboot trong phiên O8+harness.**
- **X11: KHÔNG tái xuất đợt này — `/tmp/.X11-unix/` TRỐNG lúc mở (#91) + lúc đóng; 0 process sót, lock vite trống, fixture md5 khớp đợt 125.** Lần đầu kể từ đợt 172 không có X194/X195.
- Selfcheck: #1 trên #90 (libs 1/6 — TRƯỚC repair T5, F-177-T8-2); #2 trên #91 (libs 6/6, GST 1624, dpkg 1.449, 09:39:55Z); #2-refresh trước O8 (libs 6/6, GST 1624, dpkg 1.523, ~10:24Z). T8 không tự cài apt.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 07:10:29 | REBOOT #90 (boot `94247dfa`, gap #89→#90 = 6.243 s; **T0-177 XÁC MINH 9 nguồn**, cờ 08:58Z) — TRƯỚC khi đợt mở 85' |
| 08:35:51 | Đợt 177 mở (lượt cron 15:35 +07) |
| 08:39–08:42 | T8 mở: đọc LIMITS T8-176 + GAP §105; cây + 8 script KHỚP md5 đợt 176; copy driver 176→177 (`cp -r`) + đổi nhãn (waiter deadline → 10:30Z, replay thêm entry 177-sạch); CẢ HAI symlink diag → `round177-t8/`; **selfcheck #1 trên #90: libs 1/6, GST 0, dpkg 2 dòng (F-177-T8-2)**; fixture /tmp MẤT theo #90 |
| 08:41–08:52 | T5-177 repair #90 (apt-get update 71,3 MB/8m50s + install 11 gói; dpkg 2 → 795); **POSTBOOT_PASS #90 CÓ 08:51:55Z** (repair-sớm-quyết-h, poll=1) |
| 08:42:38 | **Waiter-1 bắt đầu trên boot `94247dfa` (deadline 10:30Z; poll 1: t4=0 postboot=0)** |
| 08:56:40–09:00:35 | **T4 attempt1-94247dfa: 20/20 + B 5/5 + median 50,0 ms — LƯỢT YÊN #46 HỢP LỆ (chuỗi 39 → 40)**; T4 đóng cờ ~09:10Z |
| 08:58 | T0-177 đóng cờ: #90 XÁC MINH 9 nguồn; **run 176 SUCCEEDED 08:34:05Z** (trước hạn 106 s, cf 8 s); O8 T0 PASS 3/3 trên #90 |
| 09:07:40 | **REBOOT #91 (boot `8c0ec92d`, gap 7.031 s theo cờ T4-177)** — GIỮA PHIÊN, sau khi T0/T1/T2/T4/T5/T6 đóng; **waiter-1 CHẾT theo reboot** (poll cuối 26, 09:07:41Z); T4 chưa kịp viết cờ lúc reboot (viết lại ~09:10Z sau khi resume); dpkg.log về 2 dòng; **số hiệu #91 CHỜ T0-178** |
| 09:08–09:49 | **Replay hệ thống trên #91 CHẠY** (dpkg 2 → 1.523 dòng; libs về đủ); T9 resume 09:09; T2/T4 resume, đóng cờ; **T5 KHÔNG resume (0 file mới từ 09:07Z)**; T7 chưa đóng cờ lúc T8 đóng |
| 09:09:25 | **Waiter-2 (T8 khởi động lại) bắt đầu trên boot `8c0ec92d`** (log waiter #90 lưu thành `wait-t4-t5-boot94247dfa.log`, 26 poll); poll 1: t4=0 postboot=0 |
| 09:19:36 | T4 flag CÓ (t4=1 từ poll 9 waiter-2); postboot vẫn 0 |
| 09:39:55 | **Selfcheck #2 trên #91: libs 6/6, GST 0 (gst-inspect chưa có), dpkg 1.449**; replay vẫn chạy (2 apt process) |
| 10:24:22 | **Selfcheck #2-refresh trên #91: libs 6/6, GST 1624, dpkg 1.523** (replay xong, 0 apt process) — căn cứ gate fallback (F-177-T8-4); rebuild fixture /tmp trên #91 (md5 khớp) |
| 10:24:31–10:27:26 | **O8 T8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #91** (xem §A) |
| 10:28:52–10:45:08 | **Harness (MỘT lần chạy driver duy nhất, boot `8c0ec92d`): 6/6 PASS, 0 KẸT** (xem §2) |
| 10:30:34 | **Waiter-2 WAIT-DEADLINE 10:30Z poll=82 — GATE NOT MET** (t4=1, postboot=0 suốt #91) — ghi nhận, không mở gate (a)/(b) |
| ~10:48–10:5x | **Trích số liệu (extract-177t8.py) + replay (1c')/(f'): C5.1 ĐẠT; (f') V1-300: 164@125 s, 171@305 s, 0 FP trên 13 log sạch**; cờ `round177-t8.done` — **TRONG hạn cờ ~11:00Z** |

## A. O8 — PASS 3/3 trên boot `8c0ec92d` (#91); 4 CHÂN TÁCH BOOT — KHÔNG ĐỀ XUẤT LÊN 27

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 10:24:32–10:25:30 | 0 | **21/21 PASS** — S1 PASS 10:24:47.345Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 10:25:31–10:26:28 | 0 | **21/21 PASS** — S1 PASS 10:25:44.181Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 10:26:28–10:27:26 | 0 | **21/21 PASS** — S1 PASS, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-...-10-24-32-8c0ec92d-pid16268.json` 21/21, md5 `febee244`; attempt2 `o8w-...-10-25-31-8c0ec92d-pid16643.json` 21/21, md5 `a5002552`; Chromium `o8-...-10-26-28-8c0ec92d-pid17020.json` 21/21, md5 `617b2bde`. **HAI FILE STAMPED RIÊNG BIỆT.** 0 `HARNESS LỖI` / `Target crashed` / `WATCHDOG-137` trong log O8 (PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH`). Bằng chứng "WebKit chạy bằng system libs" là harness 6/6 trên cùng boot đo (#91), libs 6/6 — **ĐẦY ĐỦ (3/3 pha pass)** — như đợt 176.
- Driver O8 giữ 1 lock vite `t8-round177` suốt lượt (nhả 10:27:26Z; vite sau release TRỐNG, 0 ticket + 102 cooldown). Probe S1 KHÔNG cần chạy vì attempt1 đã PASS.
- **Gate cho boot đo `8c0ec92d`: (a) KHÔNG CÓ CỜ T5; (b) KHÔNG CÓ gate0wait live cho #91.** O8 T8 chạy theo fallback T8-check-only (F-177-T8-4): selfcheck #2-refresh libs 6/6 + GST 1624 + dpkg 1.523 (replay xong), T4 ĐÃ ĐÓNG cờ (không còn attempt). **CẦN PARENT/T10 XÁC NHẬN LẠI.**
- **Chuỗi WebKit FULL PASS: T8 KHÔNG ĐỀ XUẤT LÊN 27 (giữ 26).** 4 chân TÁCH BOOT: (1) lượt yên #46 hợp lệ TRÊN #90 (attempt1 20/20 + B 5/5 + median 50,0 ms, chuỗi 39 → 40); (2) gate (a) #90 CÓ CỜ T5 THẬT (08:51:55Z, poll=1); (3) O8 T0 PASS 3/3 TRÊN #90 (08:58Z, pid 206006/206616/207136, md5 `5a87b5bf`/`44c04a6d`/`3f05caf6` theo cờ T0-177); (4) O8 T8 PASS 3/3 TRÊN #91. **Không thể chạy lại trên #90.** Parent/T10 quyết cuối.
- **O8 đợt này 2'54" tổng** (176: 2'38", 175: 2'32") — trong khung các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 6/6 PASS, 0 KẸT

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 10:28:55–10:30:16 | **PASS** — W1 ×3 (+1/+1/+1), W2 PASS (playhead 30, Δ=0), E4 PASS (restart 9→9, ct 0, ended=false) — **84l10 PASS lần thứ sáu liên tiếp (172–177); Q3 W2 6 tick + E4 2 tick (MỚI, §D)** |
| 2 | WebKit 85m4 | 0 | 10:30:31–10:32:53 | **PASS** — P1/P2/P3 PASS, P4 ×3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (seek kẹt dài nhất 0 mẫu) — **P4-lần3 PASS lần thứ sáu (chuỗi = 6)** |
| 3 | WebKit 86n2 | 0 | 10:33:08–10:37:19 | **PASS** — P1 PASS (đồng bộ sau 1,4 s — **KHÔNG KẸT LẠI Ở P1 lần thứ hai liên tiếp**); P2/P3 PASS, P4 ×3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (seek kẹt dài nhất 1 mẫu ~0,2 s) |
| 4 | Chromium 84l10 | 0 | 10:37:34–10:38:35 | **PASS** — W1 +1/+1/+1 (sạch, không +2), W2 PASS (playhead 29,933, Δ=0), E4 PASS (restart 6→6, ct 4, ended=true) — **Q3 W2 5 tick đúng** |
| 5 | Chromium 85m4 | 0 | 10:38:50–10:41:02 | **PASS** — P1/P2/P3 PASS, P4 +1/+1/+1 (sạch), P5 PASS 40 s **0 restart** |
| 6 | Chromium 86n2 | 0 | 10:41:17–10:45:08 | **PASS** — P1/P2/P3 PASS, P4 ×3 PASS (+1/+1/+1 — sạch), P5 PASS 40 s **0 restart** |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (finishedAt 10:30:15–10:45:05Z).
- Môi trường: system libs trên boot `8c0ec92d` (selfcheck #2/#2-refresh libs 6/6 + GST 1624 + dpkg 1.523; replay hệ thống đã chạy xong trước O8). **WebKit launch + PASS 3/3 pha bằng system libs** trên ĐÚNG boot đo.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 16'16"** (10:28:52–10:45:08Z) — trong khung các đợt sạch (172–174: ~15'30"–15'43"; 176: 15'19").

### 86n2-P1: chữ ký đợt 175 KHÔNG tái diễn lần thứ hai liên tiếp

- Đợt 175: 86n2 kẹt exit 124 tại waitForPlaySync-P1 (watchdog 03:43:42Z, probe TIMEOUT, browser sống RSS 343 MB). Đợt 176: P1 PASS ngay lần đầu. Đợt này: P1 PASS (đồng bộ sau 1,4 s, 10:34:28Z) — không watchdog/probe TIMEOUT/live-diag. **86n2-P1 vẫn là điểm kẹt lần 1 (đợt 175), chưa đủ điều kiện mở điều tra riêng (cần tái diễn).** P4-lần3 PASS 6 đợt liên tiếp (172–177). Không gộp verdict pha con với verdict pha, không gộp các đợt.

## 3. Watchdog trong lượt này — 0 DÒNG (ĐÚNG — 0 KẸT THẬT) + LIVE-DIAG 0 + (1c') VỚI (f') 0 KÍCH HOẠT (ĐÚNG — 0 FP)

- **Watchdog (i): 0 dòng WATCHDOG-137 — ĐÚNG** (0 dòng trong 3 log WebKit + summary O8; 0 FP).
- **Driver (1b) live-diag: 0 kích hoạt — ĐÚNG** (`live_diags=0` cả 6 pha).
- **(1c') fresh-content với (f') V1: 0 kích hoạt live — ĐÚNG, 0 FALSE-POSITIVE.** Log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (8 dòng: W2 6 + E4 2) — check-fresh OK maxspan=0 s. **Đợt này 0 kẹt nên 0 kích hoạt là đúng — không có ca kẹt để bỏ lỡ, kể cả ngoài phạm vi (86n2 P1 PASS).** (c') + (f') ĐƯỢC GIỮ (xem §C).
- 0 snapshot stall (đúng — 0 kẹt thật).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–176).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–177) + `t8-diag-stall.sh` → 177 (CẢ HAI symlink cập nhật 08:40Z) | 6 harness + 3 O8; **0 kẹt thật → 0 dòng, 0 FP** | **ĐÚNG — KHÔNG CÓ KẸT ĐỂ BẮT.** 0 snapshot `stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–177) | 6 harness; `live_diags=0` cả 6 pha | **0 kích hoạt — ĐÚNG** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 | **(f') ĐÃ TRIỂN KHAI từ đợt 173** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 harness (85m4 + 84l10 W2/E4 có HB128) | **0 kích hoạt live — 0 FP. (c')+(f') ĐƯỢC GIỮ (§C).** Replay: C5.1 ĐẠT (164 @125 s; 0 FP trên 13 log sạch); (f'): 171 @305 s |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-177t8.sh` (cột `balloon_kb`) | 1 log sampler (n=33) | Balloon n=33 pinned=0 min=5.358.148 max=5.882.436 (91,3% trần) mean=5.577.763; avail min=520 MB @10:36:52Z / max 1.404 MB |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (10:38:35Z), 85m4 PASS (10:41:02Z), 86n2 PASS (10:45:08Z)** — exit 0 cả 3 | N cộng dồn **N=39 mỗi pha** (đợt 137/139/141–177 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt |
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

- **T8 không sửa file repo nào đợt này** (chỉ thêm LIMITS này). Driver đổi so với 176: nhãn/lock → `177`/`t8-round177`, deadline waiter → **10:30Z 23/11**, replay thêm entry 177-sạch. Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round177-t8/`**.
- Extract: glob TẤT CẢ log waiter (waiter-1 #90: 26 poll; waiter-2 #91: 81 poll + WAIT-DEADLINE poll=82; postboot=1: 0 dòng).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 nhả lock `t8-round177` 10:27:26Z; driver harness nhả lock sau mỗi lần chạy. Waiter-1 CHẾT theo #91 (poll cuối 26); waiter-2 WAIT-DEADLINE 10:30:34Z poll=82 (exit 3); 0 process waiter còn lại.
- Kiểm cuối ~10:48Z: process Xvfb/MiniBrowser/WebKit/Chromium sót của T8: **0**; lock vite TRỐNG (0 ticket + 102 cooldown); boot `8c0ec92d` ổn định TRONG O8+harness (**0 reboot trong phiên**).
- `/tmp/.X11-unix/` TRỐNG lúc mở (sau #91) + lúc đóng — **X194/X195 KHÔNG tái xuất (lần đầu kể từ đợt 172)**.
- Fixture /tmp: rebuild trên #91 (md5 khớp); kiểm cuối sau harness vẫn khớp (`ba0c7c62` / `f05daed8` / `fbaa3d1a` / `a1fb8549`).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (repair là của T5; libs trên #91 về qua replay hệ thống); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `8c0ec92d` (#91, CHƯA XÁC MINH — số hiệu chờ T0-178)** — boot lúc đo (không đổi trong phiên O8+harness). **Chuỗi: T8 KHÔNG ĐỀ XUẤT LÊN 27 (giữ 26) — 4 chân tách boot (xem §A).**
2. **Harness 6/6 + 0 KẸT — kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2.** Đợt sạch thứ hai liên tiếp (176–177). Đừng gộp verdict pha con với verdict pha, đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đầy đủ trên `8c0ec92d` (selfcheck #2 libs 6/6 + GST 1624). Bằng chứng "WebKit chạy bằng system libs" là harness 6/6 trên cùng boot đo (§A) — **ĐẦY ĐỦ (3/3 pha pass)**.
4. **POSTBOOT_PASS cho boot đo `8c0ec92d` KHÔNG CÓ CỜ T5 (xem F-177-T8-4).** O8 + harness chạy theo fallback T8-check-only — **CẦN PARENT/T10 XÁC NHẬN LẠI.** Đừng trích O8/harness đợt này thành "gate (a) chuẩn".
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=33, max 91,3% trần; avail min 520 MB @10:36:52Z; 0 kẹt nên không kết luận). NHƯNG balloon GHIM TRẦN ngoài cửa sổ harness (≈100% trần lúc 10:10Z, avail 487–508 MB — xem F-177-T8-5). Giao T9 đối chiếu sampler.
6. **86n2 vẫn oversize 39.194 B (>37.768 B)** — như đợt 142–177 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict: 85m4 P4-lần3 PASS lần thứ sáu; 84l10 PASS lần thứ sáu; 86n2-P1 không tái diễn lần 2; delta=+2 HẾT (0 điểm).** H3 vẫn mở, chỉ giám sát thụ động (§B). Điều tra 84l10 ĐỢT 6 (§D).
8. **84l10 E4 ended=false (WebKit) / true (Chromium)** — như đợt 176; đừng trích ended thành FAIL. **E4 WebKit có 2 tick HB128 đợt này (176: 0 tick) — vòng E4 chậm hơn, không phải kẹt.**
9. **T8 ĐÓNG TRONG hạn cờ ~11:00Z (~10:5xZ)** — O8 xong 10:27:26Z; harness xong 10:45:08Z (16'16"); trích số xong ~10:48Z. **0 reboot trong phiên O8+harness; 1 reboot trước phiên (#91, gap 7.031 s).**
10. **Reboot #91 GIỮA PHIÊN (số hiệu chờ T0-178; gap 7.031 s theo cờ T4-177); #90 XÁC MINH 9 nguồn (T0-177); marker sống 42 reboot #49–#90**; (m) #90 DƯƠNG + INSIDE #89 FALSE (chuỗi 7 ĐỨT → 0) + INSIDE #90 TRUE (chuỗi mới 1) — thuộc T2-177 + parent 177.
11. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173, 0 kích hoạt, 0 FP, 0 bỏ lỡ (0 kẹt)** — replay C5.1 ĐẠT (164 @125 s; 0 FP trên 13 log sạch); kiểm lại (f'): 171 @305 s (xem §C).
12. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (kết cục run 176 + DR 09:00Z + HB 08:20:50Z thuộc T7-177; headroom/ENOSPC/birefnet thuộc T9-177) — checklist (o) ghi "thuộc T7/T9", không phán thay.

## 8. Sai số mới (F-177-T8-N)

- **F-177-T8-1 — REBOOT #91 GIỮA PHIÊN (09:07:40Z, boot `8c0ec92d`) — WAITER-1 CHẾT THEO, T8 KHỞI ĐỘNG LẠI WAITER-2.** Waiter-1 (pid 161207) chết theo reboot (poll cuối 26, 09:07:41Z); T8 phát hiện 09:08:37Z (boot_id đổi), lưu log waiter-1 thành `wait-t4-t5-boot94247dfa.log`, khởi động lại waiter-2 09:09:25Z trên boot mới. T4 chưa kịp viết cờ lúc reboot (viết lại ~09:10Z sau resume — attempt1 trên #90 không ảnh hưởng). dpkg.log về 2 dòng; fixture /tmp mất (rebuild sau gate-fallback, md5 khớp). **Số hiệu #91 CHỜ T0-178 xác minh 9 nguồn** (T0-177 đã đóng 08:58Z, trước #91).
- **F-177-T8-2 — SELFCHECK #1 TRÊN #90: LIBS 1/6, GST 0, DPKG 2 DÒNG (SNAPSHOT TRƯỚC REPAIR — KHÔNG PHẢI LỖI ĐO).** Selfcheck 08:41:05Z (trước khi T5 repair #90 xong 08:51:55Z): chỉ libevent CÓ; libgstreamer/libEGL/libavif/libdw/libevdev THIẾU; `gst-inspect-1.0` không có; dpkg.log 2 dòng (07:11:03Z). Khớp check-only của T4/T5 cùng thời điểm (FAIL libs thiếu 5, GST hệ thống 0, apt thiếu 11 gói). Selfcheck #2 trên #91 (09:39:55Z): libs 6/6 (replay đã chạy), GST 0; #2-refresh (~10:24Z): libs 6/6, GST 1624, dpkg 1.523.
- **F-177-T8-3 — T5-177 KHÔNG RESUME SAU #91 (POSTBOOT_PASS #91 VẮNG 76+ PHÚT).** T5 đóng cờ #90 ~08:59Z; sau #91 (09:07:40Z), round177-t5/ có 0 file mới tới lúc T8 đóng — replay-watch-177.log dừng 09:07Z. Trong khi đó T2/T4/T9 đều resume trong ~20' sau reboot (T4 viết lại cờ ~09:10Z; T9 probe-loop-91 từ 09:09Z). Hậu quả: gate (a) cho #91 không bao giờ mở; gate (b) cũng đóng (T4 đã xong). Xem F-177-T8-4.
- **F-177-T8-4 — GATE MỞ BẰNG T8-CHECK-ONLY (FALLBACK, CẦN PARENT/T10 XÁC NHẬN LẠI — T8 KHÔNG TỰ CHỐT).** Waiter-2 WAIT-DEADLINE 10:30Z poll=82 — GATE NOT MET (t4=1, postboot=0 suốt #91). Căn cứ T8 dùng để chạy O8 (10:24:31Z) + harness (10:28:52Z): (i) T4 ĐÃ ĐÓNG cờ (09:10Z; attempt1 xong 09:00:35Z — đúng thứ tự "T4-yên TRƯỚC, T8-harness SAU"); (ii) selfcheck #2-refresh độc lập của T8 (thủ tục (i)) trên #91: libs 6/6 + GST 1624 + dpkg 1.523, replay xong (0 apt process), vite lock TRỐNG; (iii) tiền lệ quyết (i)/(j) đợt 143: chấp nhận check-only độc lập thay cờ T5 khi cờ vắng vì reboot. **KHÁC BIỆT:** tiền lệ 143 là T4-check-only cho gate0 của T4; đây là T8-check-only cho gate harness/O8 — T8 KHÔNG tự cho đây là đường gate chuẩn mới. Nếu parent/T10 bác, O8 + harness đợt này chỉ còn giá trị "đo trên #91 không qua gate (a)/(b)".
- **F-177-T8-5 — BALLOON GHIM TRẦN NGOÀI CỬA SỔ HARNESS (~100% TRẦN LÚC 10:10Z).** Lúc 10:10:28Z: Balloon 6.443.824 kB (≈100% trần), avail 487–508 MB; T9 sampler 10:08–10:09Z: bal=6443824 hằng số. TRONG cửa sổ harness (10:28–10:45Z): balloon max 91,3% trần, 0 mẫu ghim (n=33), avail min 520 MB — không ghim. E-195 (T9-176: ĐANG GHIM, 11 mẫu) có thể liên quan — thuộc T9-177 (chưa đóng cờ).
- **F-177-T8-6 — DELTA=+2 ARTIFACT HẾT (0 ĐIỂM ĐỢT NÀY).** Đợt 176: 2 điểm (Chromium 84l10 W1-lần2 +2; 85m4 P4-lần2 +2). Đợt này: Chromium 84l10 W1 ×3 +1 sạch; 85m4 P4 ×3 +1 sạch; 86n2 P4 ×3 +1 sạch (cả hai engine). WebKit các pha PASS đều delta=+1 sạch như mọi đợt.
- **F-177-T8-7 — (c')/(f') MÙ VỚI 86n2: PHƯƠNG ÁN MỞ RỘNG ĐÃ ĐỀ XUẤT (XEM §F — PARENT QUYẾT SAU).** Thiết kế + test cụ thể (bản copy chẩn đoán 86n2-hb128; 3 điểm gắn hbStart; replay tổng hợp ĐÃ CHẠY: kẹt-164→TRIGGER @125 s, kẹt-171→@305 s, sạch-176→OK maxspan=5 s). CHỈ đề xuất, KHÔNG triển khai live trong đợt này (theo giao T8-177 + quyết (j) đợt 176).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: GIỮ 26 (KHÔNG đề xuất lên 27) — 4 chân tách boot.** Parent/T10 quyết cuối (§A).
2. **Gate fallback T8-check-only (F-177-T8-4): parent/T10 xác nhận lại tính hợp lệ của O8 + harness đợt này.** Nếu bác: O8/harness chỉ là "đo trên #91 không qua gate (a)/(b)".
3. **(c')/(f') mở rộng cho 86n2 (§F): parent quyết phương án A (bản copy chẩn đoán 86n2-hb128 + pilot live 1 lần) hay giữ nguyên phạm vi.**
4. **Kẹt 86n2-P1: KHÔNG tái diễn lần thứ hai liên tiếp; kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2.** 85m4 P4-lần3 PASS lần thứ sáu; 84l10 PASS lần thứ sáu. Nếu tái diễn thì mở điều tra riêng như 84l10.
5. **Số hiệu #91 (boot `8c0ec92d`, btime 09:07:40Z, gap 7.031 s) — thuộc T0-178 xác minh 9 nguồn.** Marker sống 42 reboot #49–#90; qua 43 NẾU #91 được xác nhận.
6. **(m) #90 DƯƠNG (T2-177, CUỐI cấp T2) + INSIDE #89 FALSE (chuỗi 7 ĐỨT → 0) + INSIDE #90 TRUE (chuỗi mới 1) — thuộc T2-177 + parent 177.** (m) #56 lần 20.
7. **Đối chứng Chromium cùng pha: N cộng dồn N=39 mỗi pha** — Chromium 0 kẹt mọi đợt.
8. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173 — 0 kích hoạt, 0 FP, 0 bỏ lỡ (0 kẹt) → ĐƯỢC GIỮ.** V2 (f'') giữ làm dự phòng. Nếu đợt sau có kẹt 85m4 dạng paused+seeking, (f') sẽ bắt ở ~elapsed 305 s.
9. **T5-177 không resume sau #91 (F-177-T8-3): T5-178 cần quy trình resume sau reboot giữa phiên; T7/T9 chưa đóng cờ lúc T8 đóng — thuộc cờ sau/T10.**
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-177 — lần thứ 31 nếu 0); R9 (a) nhắc lần 17; file oversize 6,4 MB chưa quyết; E-195 kết cục (T9-177); prune lần 53 (T6-178); mù #96?/#95?/#94?/#88?/#77? (hole-recheck lần 21, T2-177) + (m) #56 lần 20; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 KIỂM LẠI: KẸT-171 @305 s, KẸT-164 @125 s, 0 FP TRÊN 13 LOG SẠCH; LIVE ĐỢT NÀY 0 KÍCH HOẠT (0 KẸT)

## C1. Thiết kế (c') + (f') V1 (đã triển khai đợt 173, giữ nguyên đợt 174/175/176/177, không đổi code)

- **(c'):** trailing run các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi span ≥ 120 s VÀ chuỗi dài ≥3 dòng VÀ (e)/(f) trên dòng mới nhất.
- **(f') V1:** miễn (f) khi trailing sub-run `paused=true + seeking=true` (cùng tag+playhead+ct) đã ≥300 s. Ngưỡng 120 s, run_len ≥3, ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only; phạm vi: 85m4 + 84l10 W2/E4 từ Q3. **86n2 KHÔNG có HB128 — ngoài phạm vi (F-177-T8-7, §F).**
- **V2 (f'') giữ làm dự phòng, KHÔNG triển khai.**

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh-177t8.py — ~08:43Z)

| Log | HB128 | check-fresh-177t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng | **TRIGGER elapsed=125 s** (run 5 s→125 s, 25 dòng, span=120 s) |
| 171-ket-85m4 | 174 dòng | **TRIGGER elapsed=305 s** (run 5 s→305 s, 61 dòng, span=300 s — qua (f') MỚI) |
| 176-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 176-sạch 84l10 | 8 dòng | OK maxspan=0 s |

## C3. Replay sau harness (replay-1c-177t8.py + replay-f-fix-177t8.py, chạy ~10:48Z — thêm log 177-sạch)

- **Tiêu chí C5.1 — RUNSPAN (V0): ĐẠT.** Kẹt-164 TRIGGER đúng elapsed=125 s; sạch-163/165/166/167/168/169/170/172/173/174/175/176/177 đều KHÔNG kích hoạt (max run span 5 s — biên 24×). **0 FP trên 13 log sạch (tăng từ 12 đợt 176).**
- **(f') V1-300: ĐẠT** — kẹt-164 @125 s, kẹt-171 @305 s, 0 FP. (V0: 171 KHÔNG kích hoạt — đúng vấn đề cũ; V1-180: 171 @185 s; V1-600: 171 @605 s; V2: 171 @125 s — tất cả 0 FP.)
- **Chạy thật đợt này: FRESH-CONTENT-177 = 0 kích hoạt trong 6 pha — 0 FP, 0 BỎ LỠ (0 kẹt).** Log 85m4 sạch (19 dòng HB128, maxspan=5 s); log 84l10 (8 dòng: W2 6 + E4 2) — check-fresh OK maxspan=0 s. **86n2 P1 PASS nên mù (c')/(f') không gây bỏ lỡ (F-177-T8-7).** (c') + (f') ĐƯỢC GIỮ.
- Chú thích: '171-ket-85m4' là **log KẸT thật** — "KHÔNG kích hoạt" ở V0 là **(c') V0 BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Với (f') mới, kẹt này bắt được @305 s.

---

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 6 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY)

## D1. Phạm vi (parent chốt đợt 171, giữ nguyên tới đợt 177): 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; cùng script `baaa13c0`). KHÔNG gộp 85m4-P4 / 86n2-P4-lần3. 86n2-P1 (đợt 175) theo dõi riêng — KHÔNG tái diễn lần 2 (176, 177). Đợt 6: 84l10 PASS lần thứ sáu liên tiếp, chưa có điểm kẹt mới — chạy kiểm lại Q3 (D2).

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 177 (HEARTBEAT CHẠY ĐÚNG)

| Engine | W2 HB128 | E4 HB128 | W2 | E4 |
|---|---|---|---|---|
| WebKit | **6 tick** (5–30 s; playhead 4,133→29,2) | **2 tick — MỚI** (5 s: ct 3,667; 10 s: ct 3,967 paused=true) — vòng E4 chậm hơn 176 (0 tick), KHÔNG phải kẹt | PASS (playhead 30, Δ=0) | PASS (restart 9→9, ct 0, ended=false) |
| Chromium | **5 tick** (5–25 s; playhead 5,2→25,067) | **0 tick** (như mọi đợt) | PASS (playhead 29,933, Δ=0) | PASS (restart 6→6, ct 4, ended=true) |

- **Không FP từ Q3:** check-fresh trên log 84l10 cả hai engine: OK maxspan=0 s (W2 playhead luôn tiến; E4 2 tick WebKit: playhead 3,9→3,967 — tiến, không đóng băng). FRESH-CONTENT-177 live = 0 (xem §3).
- **Hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên** (xem §D đợt 173): 157 E4 :457; 170 W2 :433; 171 W2-setup :425.

## D3. Câu hỏi mở (chưa có câu trả lời — giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — cần ca thứ tư; nay đã có Q3 ghi trạng thái media lúc chết.
- **Q2 — Lib hệ thống hay engine?** Vẫn mở — probe DEBROOT chưa chạy (cần quyết parent/T10).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 177 — heartbeat đúng cả hai engine (E4 WebKit có tick lần đầu).** Chờ ca thứ tư.
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — chỉ tương quan thời điểm.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ tư, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS tiếp 2–3 đợt, hồ sơ giữ nguyên (6 đợt sạch vẫn trong kỳ vọng ~0,8^6 ≈ 26%).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 177 (0 KẸT MỚI; 86n2-P1 KHÔNG TÁI DIỄN LẦN 2; H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG)

## B1. Trạng thái giả thuyết sau đợt 177 (H3 vẫn mở — 0 kẹt mới)

| Giả thuyết | Trạng thái đợt 176 | Trạng thái đợt 177 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 520 MB trong pha WebKit 86n2 (thấp hơn đợt 176: 560 MB), nhưng 0 kẹt đợt này; avail thấp mà vẫn 6/6 PASS |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — 0 kẹt đợt này nên không có cửa sổ kẹt để đối chiếu |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 0 kẹt mới (86n2-P1 không tái diễn) | **VẪN MỞ — 0 KẸT MỚI (86n2-P1 không tái diễn lần thứ hai liên tiếp)** — không có bằng chứng mới; chữ ký 86n2-P1 vẫn lần 1 (đợt 175) |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại 153, 170, 171) | **BÁC BỎ (đứng nguyên; 0 kẹt đợt này)** |

- Đợt 177 T8 chỉ giám sát thụ động: **0 kẹt trong 6 lần chạy harness + 0 kẹt trong 3 lần chạy O8** (đều trên #91, qua gate fallback F-177-T8-4). Không mở giả thuyết mới.
- **Điều kiện mở điều tra H3 KHÔNG đạt:** quyết (i) đợt 158 yêu cầu 85m4 P4-lần3 tái diễn lần 3 — đợt này P4-lần3 PASS lần thứ sáu liên tiếp (chuỗi = 6, hướng ngược lại). **Riêng 84l10: điều tra riêng ĐÃ MỞ đợt 6 (xem §D) — H3 tổng vẫn chỉ giám sát thụ động.**

## B3. Chữ ký kẹt — đợt 177: 0 KẸT (đối chiếu đợt 175: 86n2 kẹt exit 124 tại waitForPlaySync-P1, 901 s, probe TIMEOUT; đợt 177: P1 PASS 10:34:28Z sau 1,4 s, exit 0, 251 s — cùng script md5 `628088bd`).

---

# §E — CHECKLIST (o) ĐỢT 177 (quyết (o) đợt 176 + các F-176 còn lại — 21/21, 0 mục bỏ sót)

- o1. F-176-T0-1 (gap #88→#89 1.329 s) — **GHI NHẬN**; gap #89→#90 = 6.243 s (T0-177), #90→#91 = 7.031 s (cờ T4).
- o2. F-176-T0-3 + run 175 cf 88 s (ca ≥60 s thứ chín) — **ĐÓNG** (parent (n) 176); MỚI: run 176 SUCCEEDED 08:34:05Z, cf 8 s — thuộc T7-177.
- o3. F-176-T1-1 (X11 trio lần 5) — **ĐÃ DỌN 176; 177: X11 TRỐNG lúc mở + đóng, KHÔNG tái xuất.**
- o4. F-176-T1-2 (lệch prose 1.285/1.286) — **GHI NHẬN**; MỚI F-177-T1-1/2 (1.294/1.296) — thuộc T1-177.
- o5. F-176-T1-3 (boot mới sau T10 đóng) — **LẶP LẠI:** #90 sau T10-176 (đã xác minh); #91 chờ T0-178.
- o6. F-176-T1-4 (RAM dao động) — **GHI NHẬN**; 177: avail 487–1.404 MB, balloon ghim trần (thuộc T9).
- o7. F-176-T4-2 (check-classb đếm n thừa 1) — **ĐÃ SỬA** (T4-177: đếm chỉ dòng `boot=`).
- o8. F-176-T4-3 (X193 của chính T4) — **GHI NHẬN**; T4-177 không báo lặp lại.
- o9. F-176-T5-1 (watcher overlap +7 s) — **LẶP LẠI DẠNG MỚI:** watcher-176 chết theo #90, poll cuối +3 s (F-177-T5-1, mẫu thứ 8, NHỎ NHẤT).
- o10. F-176-T5-2 (ledger ts) — **LẶP LẠI:** F-177-T5-2 (mang sang #90, lần 4 liên tiếp).
- o11. F-176-T5-3 (lệch btime 11 s) — **MỚI F-177-T5-3** (who -b chỉ cho phút).
- o12. F-175-T5-3 ĐÃ SỬA — **GHI NHẬN** (T5-177: VẪN ĐÓNG, không sửa file repo).
- o13. F-176-T6-1 (suite/harness chồng pha) — **GHI NHẬN**; 177: harness T8 SAU T4 đóng cờ (10:28Z > 09:10Z).
- o14. F-176-T6-4 (mâu thuẫn poll=0) — **GHI NHẬN** (thuộc T6; T6-177 đóng 08:50Z).
- o15. F-176-T6-5 (watcher chưa chạy lúc snapshot) — **GHI NHẬN**.
- o16. F-176-T7-1 (sleep bị SIGTERM) — **GHI NHẬN**; T7-177 chưa đóng cờ lúc T8 đóng.
- o17. F-176-T7-4 (lỗi nhãn T0-176/T0-177) — **GHI NHẬN** (thuộc T7).
- o18. F-176-T7-5 (tuổi run cộng thừa 600 s) — **ĐÃ SỬA** (aggregate §7 đã sửa).
- o19. F-176-T8-1..8 — **ĐÃ THỰC HIỆN** (xem §8).
- o20. Quyết (o) 176 (cửa slot LÀNH lần 2; HB 44/447, DR 51/296 thiếu lũy kế) — **GHI NHẬN**; số mới thuộc T7-177 (chưa đóng cờ).
- o21. Quyết (l) 152 (hạn cờ; marker; gap) — **ĐÃ THỰC HIỆN: marker sống 42 reboot #49–#90; T8 đóng TRONG hạn cờ ~11:00Z.**

---

# §F — PHƯƠNG ÁN MỞ RỘNG (c')/(f') CHO 86n2 (F-177-T8-7 — ĐỀ XUẤT, CHƯA TRIỂN KHAI LIVE; PARENT QUYẾT SAU)

- **Vấn đề:** script 86n2 (`628088bd`, 684 dòng) KHÔNG có HB128 → (c')/(f') mù. Đợt 175: 86n2 kẹt P1 901 s; watchdog CÓ bắn nhưng 0 dòng HB128 → KHÔNG biết state lúc chết.
- **Phương án A — KHUYẾN NGHỊ (bản copy chẩn đoán):** file mới `clicktest-86n2-webkit-w7-hb128.mjs` = copy 100% logic gốc, CHỈ thêm `hbStart` (copy từ 85m4-hb128 dòng 55–65: setInterval 5 s trên event loop Node, log `[HB128] tag elapsed + getSummary`) tại 3 điểm — `waitForPlaySync` (dòng 266, ĐIỂM KẸT đợt 175), `sampleFor`, `waitForNotSeeking` — đều `try/finally { hbStop(); }`; file gốc KHÔNG sửa. Driver: chỉ đổi 2 dòng đường dẫn script (run_one 86n2); khối FRESH-CONTENT đã generic (chạy khi log có HB128). Không đổi ngưỡng (120 s, run_len ≥3), (f') V1-300, ngân sách diag, diag-only. Parser đã tương thích sẵn (trích `playhead=/ct=/playing=/paused=/seeking=`).
- **Hiệu quả (trung thực):** nếu kẹt lại P1 dạng 175: (c') TRIGGER @~125 s (playing) hoặc (f') @~305 s (paused+seeking) thay vì chỉ biết ở timeout 901 s. Vẫn diag-only — KHÔNG kill evaluate, KHÔNG rút ngắn timeout. Không biết trước state cuối ca 175 (probe TIMEOUT) nên không khẳng định @125 hay @305; lần tái diễn đầu tiên sẽ phân biệt. Trên run sạch, 86n2-hb128 chỉ thêm ~8–19 dòng HB128 (chủ yếu sampleFor P5).
- **Test — bước 2 ĐÃ CHẠY (08:44Z, số thật):** đổi toàn bộ tag HB128 log 85m4 thành `waitForPlaySync P1` → kẹt-164 TRIGGER @125 s (span 120 s, run 25), kẹt-171 @305 s (span 300 s, run 61), sạch-176 OK maxspan=5 s — parser KHÔNG phụ thuộc tag. Bước 1 (diff + `node --check`, verdict 0 dòng đổi) + bước 3 (pilot live 1 lần song song, so verdict P1–P5, chỉ đổi driver khi pilot sạch) + bước 4 (rollback 1 dòng) — cần quyết parent trước khi làm.
- **Chi phí/rủi ro:** bản hb128 thêm ~25 dòng (~1,2 KB) → ~40,4 KB, vẫn oversize (đã cần ENABLE_PRIVSEP=0). Rủi ro setInterval giữ event loop — đã có `finally { hbStop(); }` cả 3 điểm. Phương án B (sửa trực tiếp file gốc) KHÔNG khuyến nghị (mất baseline md5 `628088bd`).
- **KHÔNG triển khai trong đợt 177 — parent quyết sau.** Bản đầy đủ: `goals/.../hidden_files/round177-t8/proposal-f177-t8-7-expand-cf-86n2.md`.

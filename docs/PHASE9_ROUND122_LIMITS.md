# PHASE9 ROUND122 — LIMITS gộp (đợt 122, lượt cron 18:35 +07 16/11/2026)

> Đợt 122 đóng bởi T10 trong phiên (phase 1 xong 14:04:49Z → đóng 14:13Z, sát hạn cứng 14:15Z).
> 9/9 luồng về (T4 về muộn 13:46Z, trong cửa chờ recount). KHÔNG push, KHÔNG release/tag, KHÔNG code giả.

## 0. Kiểm chứng gộp — T10 verify độc lập

- **Suite cây gộp: 27/27 exit 0** (tsc-web 0, tsc-desktop 0, vite build 0 + 24 test; log `round122-t10-suites.log`, chạy 13:42:20Z, boot #65, RAMavail ~500–800 MB).
- **O8: Chromium 21/21 pass, 0 fail, 0 note, exit 0 (13:56:05Z); WebKit exit=2 (14:04:48Z, boot #65)** — WebKit kẹt sau S2 (5 PASS, 0 fail ghi nhận, không tới verdict): vite dev lên, bridge OK, WebKit 27.2 launch OK, S0/S1/S2 pass tới 13:56:21Z rồi im 8 phút (node chỉ dùng 1 s CPU) — T10 SIGTERM tiến trình click-test, driver ghi exit=2, không retry mù, không --repair. Nguyên nhân hạ tầng: postboot check-only của T10 FAIL (exit=1, 13:55:03Z), GST thiếu trên boot #65 (log `t10-o8.log`, `t10-postboot-fbc42445.log`).
- **Recount (sau closing batch): đợt 122 = 10 batch / 40 entry / 40 file duy nhất; lũy kế đợt 111–122 = 117 batch / 382 entry / 349 file duy nhất + 1 oversize 6,4 MB** (`benchmarks/results/webkit-blob-flaky-96x3.json`, 6.370.678 B, vẫn chưa lên từ trước — không nằm trong batch nào). Trước closing: 9 batch / 38 entry / 38 unique; lũy kế 116 / 380 / 348 (log `recount-push122.log`).
- **Cờ done 9/9** (giờ Z 16/11): T1 12:45, T2 13:00, T3 12:03, T4 13:46, T5 12:43, T6 11:40, T7 11:52, T8 11:53, T9 13:18. Phase 1 kích hoạt bằng tay 13:42:10Z lúc 8/9 (sau kiểm đĩa 13:41:47Z: T4 vắng thật); T4 về 13:46Z trong cửa chờ 5' trước recount — recount gộp đủ 9/9. Poller ghi ALL 9 DONE 13:49:51Z (thoát bình thường, không kích hoạt trùng nhờ phase1.triggered).
- **Cây thay đổi TRONG đợt, có chủ ý:** preview.tsx `5be5a250a552357c50cc189de9a9c08a` (đầu đợt, cây H3f) → `03bf029f09b8890b285eacc10a02172b` (baseline, sau khi T3 gỡ patch H3f 12:02:56Z). media.ts `2c384ed13703809d5e999311147745e7` không đổi. md5 TRƯỚC = SAU phase 1 (preview.tsx 03bf029f, media.ts 2c384ed1). Lock v2 `cd0c05c1` không đổi. HEAD a8f26d48 (không đổi).
- **Verify headline từng luồng (T10 đọc LIMITS + dữ liệu thô + kiểm mẫu):** T1 DEFER đúng prereg (chờ đủ 60', postboot FAIL đầu = cuối, 0 probe — §1); T2 STOP-md5 khớp md5 cây hiện tại 03bf029f ≠ H3f kỳ vọng, att1 bị reboot giết khớp log (§2); T3 số gộp khớp bảng run (A 58/896, B 49/938), gỡ patch verify bằng md5 03bf029f — T10 xác nhận cây hiện 03bf029f; suite gộp 27/27 trên cây baseline là bằng chứng độc lập cây baseline sạch (§3); T4 0 run — T10 xác nhận round122-t4/ chỉ có gate-wait/prereg, không probe-results (§4); T5 replay kẹt khớp dpkg.log 2 dòng + postboot FAIL ở cả T1/T4/T9 (§5); T6 lock khỏe — T10 thấy lock TRỐNG lúc phase 1 (0 ticket + 44 cooldown; T6 ghi 42 file/588 byte lúc 11:40Z — chênh +2, xem §6); T7 probe #41 + mù #40 khớp LIMITS (số heartbeat/log v2 theo LIMITS T7, T10 chưa đối chiếu trực tiếp file heartbeat v2) (§7); T8 mirror 25/25 — T10 kiểm mẫu 3/3 file trong batch đều có `watch: { ignored: ["**/**"] }`, không `hmr: false` (§8); T9 0 lượt yên — T10 xác nhận round122-t9/ chỉ có gate-wait/prereg/analyzer, không file lượt yên (§9). Không phát hiện headline nào sai số liệu.

## 1. T1 — E4 chạy bù lượt 3 (A, gop250) (quyết parent đợt 121 §12.1): DEFER-POSTBOOT, 0 lượt đo

- **Kết quả: lượt 3 att2 DEFER-POSTBOOT (không đếm vào lô).** Driver chờ cờ postboot của T5 đợt 122 đủ 60 phút (11:39:23–12:39:27Z) mà không có cờ PASS nào. Không chạy probe, không lấy lock, không sửa production. **Lô E4BATCH vẫn 1/10** (0 CAUGHT, 1 VOID — lượt 2, B gop30, cây H3f). Lượt 3 chạy lại ở đợt sau.
- **Postboot FAIL ở đầu lượt (11:38Z, T5 try1) và cuối lượt (12:39:27Z, driver chạy, đọc không repair) — y hệt nhau:** wrapper PASS (vá K1); thiếu 5 lib (libevent-2.1.so.7, libEGL.so.1, libavif.so.16, libdw.so.1, libevdev.so.2); GST: thư mục `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` KHÔNG TỒN TẠI, 0 plugin hệ thống, debroot 269, thiếu isomp4=1, libav=1; apt thiếu 11 gói.
- **Replay boot #64 kẹt ở `apt-get update`:** pid 855 chạy từ 11:35Z, lúc 12:43Z đã chạy 1 giờ 08 phút vẫn chưa xong; `/var/log/dpkg.log` đóng băng ở đúng 2 dòng `startup packages configure` @11:35:39Z trong suốt 60 phút quan sát.
- **Cây đổi giữa lượt:** T3 gỡ patch H3f 12:02:56Z (A/B TRUNG TÍNH) — preview.tsx hiện baseline 03bf029f. T1 ghi rõ: **T2/lượt 4 cần quyết parent trước khi đo** (prereg T2 kỳ vọng H3f).
- LIMITS: `docs/PHASE9_ROUND122_T1_E4BATCH_R3_LIMITS.md`. Batch stage: `phase9-round122-t1-e4batch-r3.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t1/`. Cờ `round122-t1.done` đã tạo (12:45Z).

## 2. T2 — E4 chạy bù lượt 4 (B, gop30) sau khi T1 xong: KHÔNG ĐẾM (0 phép đo) — att1 KILLED-REBOOT, att2 STOP-md5

- **Kết quả: lượt 4 att2 KHÔNG ĐẾM vào lô (0 phép đo).** Lần chạy 1 (att1) bị reboot giết giữa lúc chờ cờ: driver gốc (11:40:44Z, boot #64) chờ cờ T1 65 phút, cờ xuất hiện 12:45Z (T1 DEFER-POSTBOOT lượt 3), chuyển chờ cờ T5 12:45:46Z; reboot ~12:53:25Z giết driver giữa lúc chờ (log cuối 12:50:46Z, không marker kết thúc). Lần chạy lại bằng tay (att2) trên boot mới #65 (btime 12:53:25Z, boot_id fbc42445): **driver tự STOP exit 4 ở cổng md5** — preview.tsx 03bf029f (baseline) ≠ H3f 5be5a250 kỳ vọng (H3f bị T3 gỡ 12:02:56Z sau A/B TRUNG TÍNH, theo quyết parent đợt 121). Không chạy probe, không lấy lock, không sửa production, không có probe-results.json. Analyzer verify bằng dry-run trên dữ liệu lượt 2 (tái hiện VOID).
- **Lô E4BATCH vẫn 1/10** (0 CAUGHT, 1 VOID). Điều kiện "lô → 3/10 nếu cả T1+T2 xong" KHÔNG đạt. **Cần quyết parent trước khi đo lại lượt 4: đo trên baseline hay apply lại H3f.** Chế độ lỗi replay (C) "sống nhưng kẹt ở apt-get update" trên boot #64 cần quyết parent đợt 123.
- Sổ cái gốc (`hidden_files/round118-t9/e4batch-ledger.md`) đã cập nhật cả lượt 3 att2 của T1 và lượt 4 att2 của luồng này (lượt không đếm: 5) — T10 không ghi trùng.
- LIMITS: `docs/PHASE9_ROUND122_T2_E4BATCH_R4_LIMITS.md`. Batch stage: `phase9-round122-t2-e4batch-r4.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t2/`. Cờ `round122-t2.done` đã tạo (13:00Z).

## 3. T3 — H3f A/B có kiểm soát: verdict TRUNG TÍNH → ĐÃ GỠ PATCH THẬT khỏi cây

- **Verdict: TRUNG TÍNH. Patch H3f ĐÃ GỠ THẬT khỏi cây lúc 12:02:56Z** (theo quyết parent đợt 121 §12.2 + prereg-t3 §3–§4 — A/B có kiểm soát cũng TRUNG TÍNH thì GỠ). `patch --batch -R -p1`, verify md5 preview.tsx = `03bf029f09b8890b285eacc10a02172b`; `tsc + vite build` trên cây baseline PASS (rc=0, 7,33 s, 12:03:29Z). File h3f.patch được GIỮ NGUYÊN — apply lại chỉ cần `patch -p1 < hidden_files/round118-t2/h3f.patch` + verify md5 5be5a250.
- **A/B có kiểm soát (5 run cùng boot #64, xen kẽ ABAB, prereg viết trước khi đo 11:40Z):** chân A gộp (baseline 03bf029f, A1+A2): tick chậm **58/896 = 6,47%**; longtask ≥200ms TB/run **21.799 ms** (n=167); gap >300ms TB/run **16.650 ms** (n=85). Chân B gộp (H3f 5be5a250, B1+B2): tick chậm **49/938 = 5,22%**; longtask TB/run **21.605 ms** (n=155); gap TB/run **18.731 ms** (n=91). Tick chậm **−19,3%** (tỉ số 0,807; 95% CI 0,552–1,180, chứa 1,0) — **KHÔNG đạt bar −25%**. Longtask TB/run **−0,9%** — **KHÔNG đạt bar −20%**. Cần CẢ HAI bar mới giữ "GIÚP" → không giữ được. Gap tệ hơn +12,5%. Không phải HẠI (không chỉ số nào vượt ngưỡng hại §3; pageErrs 0 mọi run; skipped B chỉ +1,7 điểm so với A). Cả hai chân ĐẠT hiệu lực (tick chậm n=58/49 ≥ 30) — không cần run bù.
- **Pháp y cũng không ủng hộ patch:** S_store trung vị các run B (0,606 / 0,508) không thấp hơn các run A (0,273 / 0,512); tỉ lệ tick chậm zero-draw A 22,4% vs B 20,4% — gần như nhau. Hiệu ứng cơ chế mà patch nhắm tới (bỏ lần đọc video đầu trên tick nóng) không xuất hiện trong số đo. Cặp 1 có vẻ ủng hộ B (−24,1%, sát bar), cặp 2 gần như bằng nhau (−2,3%, longtask tệ hơn +12,3%) — gộp lại hiệu ứng ròng nhỏ, không đạt bar nào.
- **Tải hai chân CÂN BẰNG theo PSI** (đuôi avg60 trung bình A 79,4% vs B 77,4%; trung vị cả run ~71% cả hai) — verdict không bị confound bởi tải. Ngược lại, **load1 nói ngược hoàn toàn** (A 6,50 vs B 1,34) dù cùng hog N=4 và cùng PSI — thêm một bằng chứng trực tiếp load1 vô hiệu.
- **Cảnh báo cho T10/parent (§5 LIMITS T3):** lúc gỡ (12:02:56Z) các luồng T1/T2/T4/T5/T9 vẫn đang chạy (chỉ T6/T7/T8 đã xong). Mọi phép đo của họ chạy SAU thời điểm này đều trên cây BASELINE, không còn H3f — đặc biệt T1 lượt 3, T2 lượt 4 và T4 leg B (cả ba đều đo trên preview.tsx).
- LIMITS: `docs/PHASE9_ROUND122_T3_H3F_AB_LIMITS.md`. Batch stage: `phase9-round122-t3-h3f-ab.txt` (2 entry: LIMITS + `apps/web/scripts/probe122t3-h3f-ab.mjs`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t3/` (prereg + 5 run ABAB + analysis/forensic + hog pids + PSI/load TSV). Cờ `round122-t3.done` đã tạo (12:03Z).

## 4. T4 — Bar F2 leg B theo DEF PSI v0.1: DEFER-POSTBOOT, 0 run

- **Kết quả: KHÔNG CHẠY ĐƯỢC RUN NÀO — DEFER-POSTBOOT.** Không có số đo browser nào, không smoke run, 0/6 attempt đã dùng, không bịa số liệu. Không sửa production. Verdict KHÔNG ĐẠT đợt 120 vẫn đứng; luật lật verdict (i) vẫn chưa đủ điều kiện.
- **Gate hạ tầng không qua trên cả hai boot của đợt.** Boot #64? (btime 11:05:18Z): postboot FAIL suốt 11:37–12:52Z (thiếu 5 lib + GST; replay apt-get update 0 CPU trong 62', dpkg.log kẹt 2 dòng). Boot #65? (btime 12:53:25Z, sau reboot 12:53:25Z): replay tiến triển thật (dpkg.log 2 → 599 dòng) nhưng kẹt ở 599 dòng từ ~13:27Z, postboot vẫn FAIL tới poll cuối #25 (13:44:01Z). T4 chờ gate tổng cộng ~2 giờ (11:43–13:44Z, 46 poll) mà không có lần nào check-only PASS. T5 đã xong trên boot #64 (cờ done 12:42Z) và không còn luồng hạ tầng nào trên boot #65 — cờ POSTBOOT_PASS cho boot mới không bao giờ xuất hiện. Prereg phụ lục B đã thích ứng gate (bỏ yêu cầu cờ T5, giữ check-only + apt im + md5) trước khi đo; gate thích ứng này cũng không qua vì check-only vẫn FAIL.
- **Cây đổi trước khi đo:** T3 gỡ patch H3f thật lúc 12:02:56Z. Prereg phụ lục A đăng ký lại leg trên cây baseline — nhưng leg không chạy được nên **0 run baseline nào tồn tại**; câu hỏi lật verdict theo luật (i) vẫn mở và vẫn cần quyết cây (baseline hay khôi phục H3f) ở đợt sau.
- **Giá trị còn lại (không phải số đo leg):** bộ đo DEF v0.1 đã dựng xong + validate trên dữ liệu đợt 121 (khớp đúng T_startup/T_seek đã công bố); quan sát ambient PSI cho v0.2 (§6 LIMITS T4); 3 lỗi vận hành đã sửa + ghi lại (§7 LIMITS T4). DEFER là đúng kỷ luật prereg: không đo chui trên boot thiếu GST. Mọi run đăng ký (6 attempt) còn nguyên cho đợt sau.
- **Cây lúc đóng leg:** baseline `03bf029f` / media.ts `2c384ed1`. HEAD a8f26d48 (không đổi).
- LIMITS: `docs/PHASE9_ROUND122_T4_LEGB_LIMITS.md`. Batch stage: `phase9-round122-t4-legb.txt` (3 entry: LIMITS + `benchmarks/render/f2_startup_probe_122t4.mjs` + `benchmarks/render/f2_startup_analyze_122t4.py`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t4/` (prereg + phụ lục A/B + gate-wait 46 poll). Cờ `round122-t4.done` đã tạo (13:46Z — về muộn, trong cửa chờ recount của T10).

## 5. T5 — Hạ tầng boot #64?: replay khởi động muộn +30p21 rồi KẸT ở apt-get update 64 phút (chế độ lỗi MỚI) — luật §8.2 KHÔNG kích hoạt, KHÔNG repair, postboot FAIL suốt lượt

- **Boot hiện tại là #64? (SỐ TẠM)** — boot 11:05:18Z (btime kernel 1794827118 / `uptime -s`; journal first entry 11:05:29Z, chênh +11 s — cùng mẫu +11 s như #62?), boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`, sau #63? 08:53:05Z (gap 2h12'13"). Số thứ tự CHƯA CHẮC (chờ T6 đếm lại mù #37). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại); `last -x` chỉ còn 1 dòng reboot 11:05Z — log các boot trước đã mất cùng rootfs rebuild.
- **Postboot #64?: FAIL SUỐT LƯỢT, chưa từng PASS.** Check-only exit 1 ở mọi lần kiểm: try1 11:37Z, sau sửa script 11:38Z, watcher poll 10/20/30/40/50/60 + cuối (11:48Z → 12:38Z). Thiếu 5 lib + GST (thư mục không tồn tại, 0 plugin hệ thống, debroot 269) + 11 gói apt.
- **Replay KHỞI ĐỘNG MUỘN rồi KẸT — CHẾ ĐỘ LỖI MỚI (C) "sống nhưng kẹt ở update".** Configure 11:35:39Z (boot +30'21", muộn nhất kể từ #60? +49'51"); wrapper os-intent pid 834 + `apt-get update` pid 855 chạy từ 11:35Z và VẪN CHẠY tới cuối lượt (etime 01:04:26 lúc 12:40Z) — nhưng KHÔNG TIẾN TRIỂN: dpkg.log dừng ở 2 dòng configure, thư mục partial không ghi thêm file nào từ 11:41:39Z (~58 phút im), lists dừng ở 111 file từ poll 4. Đây KHÔNG phải dạng (A) "tới nhưng thiếu GST" cũng KHÔNG phải dạng (B) "chạm mà không cài" — mà là dạng mới **"sống nhưng kẹt ở update"** (alive-but-wedged).
- **KẸT KHÔNG PHẢI DO MIRROR.** Probe đọc-only 12:25Z: `azure.archive.ubuntu.com/.../InRelease` trả HTTP 200 trong 0,79 s; `archive.ubuntu.com` 200 trong 1,46 s. Mirror khỏe, mạng tới được — apt-get (0% CPU, trạng thái S, methods http/https/gpgv/store đều sống từ 11:35Z) kẹt ở bên trong máy trạng thái fetch của chính nó.
- **Luật replay-chết §8.2 — ĐÁNH GIÁ LẦN 2 (sau lần kích hoạt đầu đợt 121): KHÔNG kích hoạt.** Điều kiện 2(a) không đạt (apt + wrapper còn sống) — không phải "chết". Hệ quả T5 tự ghi: **kẹt vô hạn thì boot này không bao giờ đủ điều kiện chạy WebKit mà cũng không bao giờ đủ điều kiện repair — CẦN QUYẾT PARENT** (xem §12 mục 4).
- **Headroom inotify hiệu dụng: 4440 → 4552 — HỒI TỪ 0, GIẢM SO VỚI #63?.** Đo lúc mở 4440 (11:38Z), poll 30 = 4552 (+112 trong 30 phút, ổn định). So với 5435–5436 của #63? khoảng ~900. Xu hướng dài hạn: 804 → 670 → 545 → **0 (#62?) → 5436 (#63?) → 4440 (#64?)**.
- LIMITS: `docs/PHASE9_ROUND122_T5_INFRA_LIMITS.md`. Batch stage: `phase9-round122-t5-infra.txt` (2 entry: LIMITS + `apps/web/scripts/vcut-webkit-postboot-check.sh`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t5/` (watcher 60/60 poll + curl probe 12:25Z + POSTBOOT_FAIL). Cờ `round122-t5.done` đã tạo (12:43Z).

## 6. T6 — Sức khỏe lock v2 sau boot #64 + housekeeping: KHỎE

- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot, 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (2 snapshot 11:37Z + 11:39Z). Log 452 dòng (từ 395): +57 = TICKET +16 / ACQUIRED +16 / RELEASED +17 / COOLDOWN +8, 0 TIMEOUT/STALE mới. Ghép cặp 129/129, 0 đang giữ, 0 mất dấu; 4 double-acquire cũ, không ca mới. Holder live t8-round121 đã nhả sạch 08:47:47Z (hold 307s) + 3 chu kỳ sau đó đều sạch; t7 8 chu kỳ, t3 3 chu kỳ, t10 2 chu kỳ — tất cả nhả đúng, không giữ quá hạn, không chết không nhả. Yên lock 10:16:03Z → 11:39Z (1h23'), chưa luồng đợt 122 nào dùng lock thật tới lúc T6 kết thúc — kiểm holder đợt 122 thuộc T6 đợt 123.
- **"KHÔNG NHẢ"/"BỎ QUA": 0 sự kiện** trên lock thật đợt 120/121/122 (tới 11:39Z); đếm sạch 0 dòng sau khi loại grep-output lồng nhau (bẫy đếm: file khong-nha-grep*.txt của T6 đợt 121 bị grep lại — phải loại khỏi grep).
- Suite /tmp 9/9 PASS (lần thứ 4 liên tiếp) + repro A/B/C giống hệt đợt 120/121; script v2 cd0c05c1, v1 fd21193c, suite 1c0d7eaa — không đổi.
- **Housekeeping (CHỈ ĐO, KHÔNG prune):** cooldown 42 file / 588 byte (+4 net: t8/t7/t3/t10-round121). **Ghi chú T10:** lúc phase 1 (13:42Z) T10 thấy 44 cooldown — chênh +2 so với T6 (1 do T10 chạy suite nhầm lúc false-trigger 11:40Z, xem §11; 1 chưa rõ nguồn — T6 đợt 123 kiểm).
- LIMITS: `docs/PHASE9_ROUND122_T6_LOCKHEALTH_LIMITS.md` (19.869 B). Batch stage: `phase9-round122-t6-lockhealth.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t6/`. Cờ `round122-t6.done` đã tạo (11:40Z).

## 7. T7 — EPERM probe #41 + mù #40 (A ĐÓNG, B MỞ, C ĐÓNG) + gap #62→#63 CHỨNG NHẬN DẠNG KHOẢNG + mù #39 J KIỂM LẠI VẪN MỞ

- **Probe #41: ok=2 fail=0**, 11:38:49Z, boot 3fe7e89e, exit 0. Checklist P8 §2.3 chạy ĐÚNG 1 lần (11:38:49Z): status DEAD/STALE (heartbeat age 10.684 s, last #40 08:40:45Z, boot 9788ce28, exit 1) → once probe #41 → status ALIVE (age 0 s, n=41), exit 0. Log v2 tăng đúng 3 dòng (112 → 115), như R7/S7/T7/T6/T5/T4 (+3); prereg §1 đã dự báo đúng +3 trước khi đo. Heartbeat nay n=41, ts 11:38:49Z, boot 3fe7e89e. Clock VM hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u` trong 0–1 s) → F_now ≈ 0.
- **Mù #40: 08:40:45Z → 11:38:49Z (2h58'04") — KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này).** Đoạn A **ĐÓNG** (probe #40 uptime + poller T10 đợt 121 run 1 + scan WFS của T4 + 422 mốc mtime, lỗ lớn nhất chỉ 32 s + đuôi ≤ 189 s < sàn); đoạn B **KHÔNG ĐÓNG** (đuôi (10:42:19Z, 11:05:18Z] 1.379 s, 0 session bắc qua cắt B-hi, 0 session chạm đuôi, 0 file trong cả 3 phạm vi + /tmp trong đuôi, tối đa 1 ẩn danh nghĩa); đoạn C **ĐÓNG** (uptime trực tiếp lúc probe #41 + dấu boot tươi sibling đợt 122). **2 reboot đã chốt trong mù (#63 08:53:05Z, #64 11:05:18Z — cả hai đều có giây chính xác trên đĩa) + tối đa 1 ẩn danh nghĩa (đuôi đoạn B).**
- **Gap #62→#63 = KHOẢNG [27'18", 30'33"] ([1.638, 1.833] s, mid 28'55,5" = 1.735,5 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG (mới).** Điều kiện: đoạn A mù #40 đã đóng. Dạng khoảng vì bước nhảy clock tại #63 đã CHỨNG MINH (X ∈ [6, 195] s, T4-121 §2.2) — lượt này thêm **nhân chứng thứ hai cho bước nhảy** (session birth 08:44:23Z mtime 08:53:08Z theo đồng hồ cũ, 3 s sau btime #63). **CERT n=34 → n=35; FULL n=49 → n=50.** Dải chứng nhận [19'07", 3h14'08"] không đổi.
- **Gap #63→#64 = 2h12'13" (7.933 s) CHỈ LÀ SPAN** (đoạn B mở) — KHÔNG vào FULL/CERT.
- **Mù #39 đoạn J: KIỂM LẠI — VẪN MỞ.** Quét lại tươi đuôi (07:37:47Z, 08:25:47Z]: 0 file trong cả 3 phạm vi + /tmp, 0 session chạm đuôi; 3 file viết sau 09:05Z nhắc 80a940d7 đều là trích dẫn hồi tưởng / chuỗi trong code, không có lần đọc tươi nào trong đuôi. Không có bằng chứng mới.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" (mẫu hoa O) trong 504 file *.log có mtime trong mù #40 (0 file repo-1, 504 file hidden_files); 19 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã biết** (2× T10-O8 + 17× T9 smoke). **Đính chính phân loại mới:** 8 dòng "operation not permitted" (thường o) trong q5-bridge.log là **nội dung cũ từ sóng 11/11** — lần ghi thêm duy nhất trong mù #40 (09:09:03Z, T9 probe89q5) chỉ thêm banner khởi động sạch, bridge báo OK 09:09:04Z, 0 dòng EPERM sau banner cuối. Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7) — **~119h27'49"** trước probe #41. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 28: 812 dòng / 228 file** (phạm vi 2.959 file); R7b đối chiếu 837 dòng / 245 file; copies 25 dòng / 17 file — y hệt lần 27 về copies; đối chiếu chéo 812+25=837=R7b, **chênh 0 — lần thứ hai mươi tám liên tiếp**. +24 dòng / +13 file so với lần 27, giải thích đúng hết bằng diff. Async `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1 bản build dist cũ của cùng helper) — 0 stray; mtime không đổi từ 10–11/11.
- RAM: max biết được trong mù #40 **3.189 MB** (T8, 08:59:06Z, đoạn B) = 52% ngưỡng guard — cao hơn mù #39 (1.983 MB) nhưng vẫn dưới guard; đoạn A max 2.614 MB, đoạn C không có mẫu. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói. Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn chờ user quyết; R9 (a) vẫn chờ user.
- **Không có reboot nào khác trong lúc T7 làm việc** (boot vẫn 3fe7e89e, uptime-s 11:05:18Z lúc 11:47:23Z — kiểm lại trước khi viết LIMITS). **dpkg.log boot #64: chỉ 2 dòng** (11:35:39Z); `/var/log/apt/` KHÔNG TỒN TẠI — không có bracket replay cho boot #64 (như #60, #62, #63).
- LIMITS: `docs/PHASE9_ROUND122_T7_EPERM_LIMITS.md` (43.637 B — OVERSIZE > 37.768, lúc push cần ENABLE_PRIVSEP=0). Batch stage: `phase9-round122-t7-eperm.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t7/` (prereg viết trước khi đo). Cờ `round122-t7.done` đã tạo (11:52Z).

## 8. T8 — Vite harness: mirror L8 cho 25 harness config production mặc định còn lại — 25/25 mirror, smoke 25/25 PASS

- **25/25 harness đã mirror** (mỗi file: 8 dòng chèn — 5 dòng comment + 3 dòng code — + 1 dòng spawn đổi thêm `-c`; 68v8 thêm 4 dòng comment cũ đổi thành 3 dòng mới). `node --check` 25/25 PASS. Diff từng file vs backup đúng như thiết kế (9 dòng thêm / 1 dòng bớt; 68v8: 12/5 do cập nhật comment). T10 kiểm mẫu 3/3 file trong batch đều có `watch: { ignored: ["**/**"] }`.
- **Cách mirror khác mẫu T8 ở một điểm có chủ ý:** config mirror SAO CHÉP Y HỆT production (`plugins: [react()]`, `port: 5173`) + chỉ thêm `watch: { ignored: ["**/**"] }`; **KHÔNG thêm `hmr: false`** — vì production không tắt HMR, và 140 harness đợt 121 có `hmr: false` là do template của chúng đã tắt từ trước. Thêm `hmr: false` vào 25 file này sẽ là đổi hành vi serve so với production. Chứng minh đường serve không đổi ở §3 LIMITS T8.
- **Đối chứng cơ chế (trước khi patch):** vite config mặc định giữ **1.613 inotify watch**, vite config mirror giữ **0 watch** — cùng HTTP 200, cùng `ready`. Đây chính là tài nguyên gây ENOSPC khi trần đầy.
- **Đính chính tiền đề ENOSPC trên boot hiện tại:** trên boot #64 (btime 11:05:18Z), vite config mặc định LÊN BÌNH THƯỜNG (`ready in 343 ms`, 0 ENOSPC) — trần inotify đã hồi sau reboot (headroom ~63.733 theo đếm /proc, khác hẳn 434–545 các boot trước; quan sát "reboot không hồi" của T8/T9 không còn đúng ở boot #64). Nghĩa là **25 harness này hiện KHÔNG chết ENOSPC**; mirror đợt này là phòng ngừa + thống nhất toàn bộ 199 harness theo cùng một mẫu, để lần tới trần đầy thì chúng không chết. Đừng trích "25 harness đã hết ENOSPC" như một lỗi đã sửa — đúng hơn là "đã loại bỏ 1.613 watch/harness khỏi đường chết ENOSPC".
- **Smoke sweep 25 harness: 25/25 PASS** (vite lên, HTTP 200, 0 inotify watch, 0 ENOSPC). 20 PASS ngay lượt 1; 5 file `.cjs` (c3/p5/r14/t5/v10) lượt 1 vite đã lên nhưng driver kiểm HTTP sai địa chỉ (127.0.0.1 trong khi 5 file này spawn vite không `--host` nên vite chỉ bind `localhost`) — chạy lại với driver sửa (thử `localhost` trước) thì 5/5 PASS. Đây là lỗi driver của T8, không phải lỗi mirror.
- **Production không động:** `media.ts` md5 `2c384ed1…` khớp đợt 121; `vite.config.ts` không động (mtime 18/10). `preview.tsx` md5 `03bf029f…` KHÁC số đợt 121 (`5be5a250…`) — file này bị sửa lúc **11:45:30Z trong đợt 122 bởi một luồng song song khác (không phải T8)** — đó là T3 gỡ H3f 12:02:56Z (T8 ghi 11:45:30Z là thời điểm cây đổi theo quan sát của T8; mốc gỡ chính xác theo T3 là 12:02:56Z — T10 ghi đính chính này, không phải hai lần sửa).
- LIMITS: `docs/PHASE9_ROUND122_T8_VITEHARNESS_LIMITS.md`. Batch stage: `phase9-round122-t8-viteharness.txt` (**26 entry**: LIMITS + 25 script harness đã mirror), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t8/` (apply script + backup + edit log + smoke sweep). Cờ `round122-t8.done` đã tạo (11:53Z).

## 9. T9 — WebKit lượt yên theo dõi lần 4: KHÔNG CHẠY ĐƯỢC (chặn bởi hạ tầng, 2 boot) — ngưỡng GIỮ

- **Kết quả chính — 0 LƯỢT YÊN ĐỢT NÀY (CHẶN BỞI HẠ TẦNG, 2 BOOT).**
  1. **Boot #64 (11:05:18Z): gate 0 KHÔNG BAO GIỜ ĐẠT — 37 poll** (b64 #1–#30, 11:40–12:38Z + b64b #31–#37, 12:41–12:53Z), postboot check-only exit 1 ở MỌI poll, apt không bao giờ im. Replay kẹt ở `apt-get update` pid 855 (11:35Z → reboot, 63+ phút, 0 tiến triển: dpkg.log 2 dòng, lists kẹt 111 file từ 11:48Z, partial im từ 11:41:39Z). T5 kết luận chế độ lỗi MỚI "sống nhưng kẹt" — luật replay-chết §8.2 KHÔNG kích hoạt (apt còn chạy) → KHÔNG repair; postboot FAIL suốt lượt.
  2. **Reboot #65 (12:53:25Z)** giết gate0-wait + poller + phiên chờ của T9. Khởi động lại gate0-wait trên boot mới theo tiền lệ (phụ lục 3 prereg): **10 poll (#1–#10, 12:56–13:14Z), gate 0 vẫn KHÔNG ĐẠT** — replay #65 chạy thật (dpkg 2→279 dòng) nhưng chưa xong; postboot FAIL ở mọi poll; apt không im lúc poll #10 (apt-get pid 6642, dpkg 279 dòng, RAM 859 MB).
  3. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi).** Không có lượt yên mới nên không áp dụng quy tắc quyết định prereg §1 — 3 lượt yên hợp lệ trước đó vẫn đứng (S5 49,5 / T4-118 40,0 / T3-121 52,0). Nợ lượt yên chuyển tiếp đợt 123.
- T9 xác nhận: cây baseline 03bf029f (patch H3f đã gỡ); tsc 0. T10 xác nhận: round122-t9/ chỉ có gate-wait/prereg/analyzer/dry-run, không file lượt yên nào — 0 lượt yên là thật.
- LIMITS: `docs/PHASE9_ROUND122_T9_WEBKIT60MS_LIMITS.md`. Batch stage: `phase9-round122-t9-webkit.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round122-t9/`. Cờ `round122-t9.done` đã tạo (13:18Z).

## 10. Nợ mở — chuyển đợt 123

1. **E4 lô vẫn 1/10 — cả hai lượt bù đều không đếm được đợt này.** Lượt 3 (T1) DEFER-POSTBOOT; lượt 4 (T2) STOP-md5 (cây đã đổi). Chờ quyết parent (§12 mục 1): đo lượt 4 trên cây nào — baseline hay apply lại H3f; lượt 3 chạy lại khi nào. Prereg E4 đợt sau phải ghi rõ cây đo + tên thư mục cờ của luồng hạ tầng **đợt hiện tại**.
2. **Bar F2 leg B: 0 run đợt này.** DEF v0.1 đã validate trên dữ liệu đợt 121 (T4 §4); 6 attempt còn nguyên cho đợt sau; verdict KHÔNG ĐẠT đợt 120 vẫn đứng; luật lật verdict (i) vẫn mở. Chờ quyết cây đo (baseline hay H3f) + lịch chạy lại.
3. **H3f: ĐÃ GỠ khỏi cây** (preview.tsx baseline 03bf029f; suite gộp 27/27 + O8 Chromium 21/21 trên cây baseline). h3f.patch giữ nguyên (`hidden_files/round118-t2/h3f.patch`) — apply lại chỉ khi parent quyết + prereg mới.
4. **WebKit lượt yên #4: chưa chạy được** (chặn hạ tầng 2 boot); ngưỡng ≤60 ms GIỮ; nợ chuyển đợt 123.
5. **Hạ tầng + chế độ lỗi replay (C) mới:** "sống nhưng kẹt ở apt-get update" (boot #64) — luật §8.2 KHÔNG bao phủ (apt còn sống) nên không repair được; postboot FAIL suốt lượt. Replay #65 kẹt ở 599 dòng dpkg từ ~13:27Z (T4 poll cuối 13:44Z; T10 postboot 13:55Z vẫn FAIL) — chưa rõ có tự xong sau đó không, T5 đợt 123 kiểm. Headroom 4440→4552 (giảm ~900 so với #63). Số hiệu boot #64/#65 vẫn "tạm" (journal/wtmp chỉ giữ boot hiện tại).
6. **EPERM (§7):** mù #40 B mở (tối đa 1 ẩn danh nghĩa); mù #39 J vẫn mở (kiểm lại không có bằng chứng mới); gap #63→#64 SPAN 2h12'13" chưa chứng nhận; CERT n=35, FULL n=50; mù #38 G đã đóng như không đóng được (không thử lại). Probe #42 đợt 123.
7. **Vite harness (§8):** 25 config mặc định đã mirror xong — 199/199 harness nay theo mẫu mirror (trừ 4 file chỉ tiêu thụ config khác + 35 file không chạy vite dev). Đính chính: trên boot #64 ENOSPC không tái hiện (headroom hồi ~63.733) — mirror là phòng ngừa, không phải sửa lỗi đang cháy.
8. **Nợ đứng chưa có quyết user:** G1 deinterlace (khung (a) M2 HOÃN); mù #22/#28–#31/#35; birefnet (chỉ thử lại khi RAM đổi — RAM max trong mù #40 là 3.189 MB, 52% guard; u2net là fallback chính thức); ci-security.yml 403 (chờ user); TTS 39 cấm kiểm lại; R9 (a) VẪN CHỜ user (nhắc lần 8).

## 11. Ghi chú vận hành

- **Bài học T10 đợt 119/120/121 đã áp dụng:** phase 2 chạy NGAY trong cùng phiên driver (phase 1 xong 14:04:49Z → đóng 14:13Z, sát hạn cứng 14:15Z); LIMITS gộp KHUNG viết ngay sau suite+O8+recount (do phase-1 driver viết tự động); recount chờ 9/9 (kích hoạt 13:42:10Z lúc 8/9, recount sau khi T4 về 13:46Z — đủ 9/9).
- **SỰ CỐ false-trigger 11:40:20Z (đã xử lý, không ảnh hưởng đợt):** poller adapt từ đợt 121 còn sót ngưỡng số `1015` (sed chỉ đổi chuỗi "10:15Z" trong comment) → kích hoạt phase 1 ngay poll #1 ở 0/9. Driver chạy suite dở (tsc-web đang chạy) + giữ lock t10-round122. T10 kill SIGTERM cả process-group 6808 lúc ~11:41Z: toàn bộ driver/suite/tsc chết sạch, lock release qua trap (TRỐNG, 0 ticket). Đã sửa poller 1015→1345, tách log chạy sai ra `*.FALSE-TRIGGER-1140Z.*`, xóa phase1.triggered, khởi động lại poller (poll #1 mới 11:41:13Z 1/9). **Bài học đứng:** khi adapt poller đợt sau, kiểm tra CẢ ngưỡng số trong code, không chỉ chuỗi giờ trong comment. Cooldown lock +1 do lần chạy suite nhầm này (42 → 43).
- **MANUAL-TRIGGER phase 1 lúc 13:42:10Z:** T10 kích hoạt bằng tay sau kiểm đĩa 13:41:47Z (8/9, T4 vắng thật — không .done/LIMITS/batch, chỉ gate-wait) thay vì chờ poller trigger 13:49:51Z (quá muộn so với hạn cứng 14:15Z). Driver chờ 5' trước recount; T4 về 13:46Z trong cửa chờ → recount gộp đủ 9/9. Poller ghi ALL 9 DONE 13:49:51Z (thoát bình thường, không kích hoạt trùng).
- **Reboot #65 (12:53:25Z, boot fbc42445, gap #64→#65 ~1h48'):** giết poller + phiên chờ T10 (SIGTERM ~12:53Z, sau poll #15 12:51:14Z 6/9) + driver T2 att1 + gate-wait T4/T9. T10 chạy lại 12:54:31Z (ghi RESTART), poller chạy lại (poll #1 12:54:51Z 6/9). T1 + T5 về trước reboot (cờ 12:45Z/12:43Z) — gộp từ đĩa. T2 chạy lại bằng tay att2 (STOP-md5); T4/T9 khởi động lại gate-wait trên boot mới theo tiền lệ. Đợt mở trên boot #64, đo rải trên #64/#65, đóng trên boot #65.
- **WebKit O8 exit=2 (hạ tầng):** postboot FAIL trên boot #65 (T10 check-only exit=1 13:55:03Z); click-test WebKit kẹt sau S2 (5 PASS, 0 fail) — T10 SIGTERM sau 8' không tiến triển, không retry. Chromium 21/21 exit 0 trên cùng boot.
- **Chốt chặn `round-in-progress.md` ĐÃ TẠO lúc mở đợt 122 (lượt cron 18:35 +07 16/11); T10 xóa khi đóng đợt** (sau closing batch + LIMITS gộp này).
- **Cờ `round122-t10.done` ĐÃ TẠO khi đóng đợt** (bài học đợt 121: T10 đợt trước thiếu cờ này).

## 12. Quyết parent (main chat, 21:1x +07 16/11/2026 — đóng đợt 122)

1. **E4 — đo trên cây BASELINE, không apply lại H3f.** Lượt 3 chạy
   lại trước, rồi lượt 4, ở đợt 123 (thứ tự theo quyết đợt 121
   §12.1 vẫn giữ — cả hai lượt bù đợt 122 đều không đếm được nên
   thứ tự chuyển sang đợt sau). Lý do: H3f bị gỡ vì A/B có kiểm
   soát TRUNG TÍNH; apply lại chỉ để đo E4 sẽ đưa patch đã gỡ trở
   lại cây và làm nhiễm cây baseline. Lô hiện 0 lượt đếm được
   (1 VOID, 0 CAUGHT) nên đổi cây không làm mất số liệu đếm nào;
   lượt 2 VOID giữ nguyên VOID. Cơ chế E4 (decoder drift re-seek)
   độc lập với H3f (đọc video mỗi tick). Prereg E4 đợt 123 ghi rõ:
   cây đo = baseline 03bf029f + thư mục cờ hạ tầng đợt hiện tại
   (luật đứng từ đợt 121).
2. **H3f — XÁC NHẬN giữ cây baseline.** Việc gỡ đã thực hiện đúng
   quyết §12.2 đợt 121 (A/B TRUNG TÍNH → gỡ thật 12:02:56Z,
   preview.tsx về 03bf029f, tsc + vite build PASS) và đã báo user
   20:47 16/11. File patch giữ lại để áp lại được nếu cần, nhưng
   không có kế hoạch áp lại.
3. **Leg B — chạy lại đợt 123 trên cây BASELINE.** DEF v0.1 đã
   validate, 6 attempt còn nguyên. Prereg ghi rõ thay đổi cây
   (H3f → baseline) như một ghi chú thay đổi cây, không phải thiết
   kế lại. Verdict KHÔNG ĐẠT đợt 120 vẫn đứng trên 6 run cây H3f
   của nó; leg B trên baseline là loạt đo mới theo định nghĩa PSI.
4. **Chế độ lỗi replay (C) "sống nhưng kẹt ở apt-get update":
   PHÊ DUYỆT bổ sung điều kiện kích hoạt repair — "kẹt nhưng còn
   sống coi như chết", hiệu lực từ đợt 123.** Điều kiện (PHẢI đủ
   cả 5, theo cấu trúc §8.2): (a) postboot check-only FAIL tươi;
   (b) tiến trình apt-get update/dpkg CÒN SỐNG nhưng 0% CPU qua
   ≥2 lần kiểm cách nhau ≥15 phút VÀ dpkg.log im ≥15 phút (2 lần
   đọc cách nhau ≥15 phút, không suy từ 1 lần đọc); (c) ngưỡng
   chờ đã qua — boot ≥60' tuổi HOẶC dpkg im ≥15'; (d) dạng lỗi
   (C): dpkg.log chỉ có ≤2 dòng (startup/configure) hoặc 0 dòng
   install, lists trống; (e) không có probe WebKit nào đang chạy
   trên boot đó. Hành động: ghi cờ `REPAIR_TRIGGERED` TRƯỚC khi
   làm gì (kèm PID tiến trình kẹt + bằng chứng 0% CPU + 2 lần
   đọc dpkg.log); **kill tiến trình apt kẹt** (chỉ sau khi đủ 5
   điều kiện và đã ghi cờ — đây là tiền điều kiện của repair, ghi
   rõ PID + lệnh kill vào log); chạy `postboot-check.sh --repair`
   MỘT LẦN có giám sát; chạy lại check-only; repair FAIL thì DỪNG
   và ghi "boot này không dùng được cho WebKit". Lý do: 64+ phút
   0% CPU với dpkg.log đóng băng ở 2 dòng là kẹt rõ ràng, không
   phải chậm (update chậm nhất từng quan sát, #47, ~12 phút và
   tiến trình vẫn có tiến triển — điều kiện (b) loại được trường
   hợp đó). Lần áp dụng đầu phải có giám sát + log đầy đủ như luật
   §8.2.
5. **G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi
   13:44 16/11, chưa trả lời). Không thay đổi so với quyết đợt 120
   §12.2 / đợt 121 §12.5.
6. **Đóng đợt 9/9 sau reboot #65 + T4 về muộn + WebKit O8 exit=2
   do hạ tầng: CHẤP NHẬN.** T4 về 13:46Z trong cửa chờ recount
   (đã gộp đủ 9/9); suite 27/27 + Chromium 21/21 xanh; WebKit O8
   exit=2 do postboot FAIL trên boot #65 (không phải do code).
   T10 đóng đợt theo đúng luật (kiểm đĩa trước khi kết luận T4
   thiếu; gộp từ đĩa). (Lưu ý: cờ round122-t10.done ĐÃ có trên
   đĩa lần này — nợ bookkeeping đợt 121 đã được sửa.)

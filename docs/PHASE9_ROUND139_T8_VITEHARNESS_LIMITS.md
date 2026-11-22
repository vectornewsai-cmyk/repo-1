# Đợt 139 T8 — GATE MỞ, HARNESS 6/6 PASS (WebKit 3/3 + Chromium 3/3, 0 kẹt) — QUYẾT PARENT (g) ĐÃ THỰC HIỆN: watchdog diag path sang đường ổn định

Ngày: 18/11/2026 (lượt cron 21:35 +07 = 14:35Z; T8 mở ~14:40Z, đóng 16:00Z trên boot mới `af558fb5`). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (A) thực hiện quyết parent (g) đợt 138: đổi watchdog diag path sang đường dẫn ổn định (xem §0–§2); (B) chờ cờ + chạy harness 6/6 theo quy trình (gate MỞ 15:25:48Z, harness 15:39:15–15:54:41Z — **6/6 exit 0, KHÔNG FAIL, 0 kẹt**); (C) 4 bước kiểm GIỮ NGUYÊN theo brief đợt 139 + quyết parent đợt 137 §12.3(h) — **đã chạy đầy đủ đợt này** (watchdog 0 kích hoạt, sampler Balloon 31 mẫu, đối chứng Chromium 3/3, diag baseline đã lưu). KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND138_T8_VITEHARNESS_LIMITS.md + aggregate đợt 138 §11/§12.3(g) (quyết đổi diag path) + quyết parent đợt 137 §12.3(a)(h).

## 0. Kết luận ngắn — 6/6 harness PASS, 0 kẹt; diag path mới đã đổi + smoke-test OK; 1 reboot SAU khi harness xong

- **Gate MỞ poll 40 lúc 15:25:48Z** (waiter bắt đầu 14:46:48Z, deadline 16:30Z): `round139-t4.done` có + `POSTBOOT_PASS` boot `541524e2` (pass_at 14:47:53Z). T4 mở cửa yên poll #9 14:48:38Z (gate0 PASS + gateA RAM 1.859 MB), attempt1 exit=1 nhanh (14:48:45Z), attempt2, attempt3 (analyzer 15:13:14Z, LOP-B 5/5, coverage 4/4) rồi viết cờ ~15:25Z. T8 phát hiện gate muộn 13 phút do chu kỳ poll 15 phút (F-139-T8-1) — không ảnh hưởng kết quả.
- **Harness 6/6 exit 0, KHÔNG FAIL, 0 timeout, 0 kẹt** (driver 15:39:15–15:54:41Z, ~15,5 phút): WebKit 84l10 (79 s) / 85m4 (129 s) / 86n2 (234 s) + Chromium 84l10 (60 s) / 85m4 (119 s) / 86n2 (223 s). P1–P5 PASS cả hai engine; HB128 chảy đều ở 85m4; W1×3 + W2 + E4 PASS ở 84l10. Xem §4.
- **Quyết parent (g) — ĐÃ THỰC HIỆN (xem §2):** 3 script harness đổi `DIAG137_SCRIPT` sang đường dẫn ổn định `hidden_files/t8-diag-stall.sh` (symlink → `round139-t8/diag-stall-139t8.sh`); md5 đổi (lý do: đổi path theo quyết parent, KHÔNG đổi logic); `node --check` OK cả 3; smoke-test qua đường mới 14:45:56Z ghi đủ 10/10 file vào `round139-t8/smoke/stall-smoke-test-1795013156/` (không còn lạc sang dir đợt 137). **Chưa chứng minh bằng kẹt thật:** watchdog 0 lần kích hoạt trong 6 lần chạy (không có evaluate >60 s) nên đường mới chưa từng được gọi trong kẹt thật — chỉ smoke-test + 6 lần chạy sạch chứng minh đường đi + cú pháp (F-139-T8-5).
- **4 bước kiểm — ĐÃ CHẠY ĐẦY ĐỦ đợt này:** (1) watchdog trong 3 script (đường mới) — 0 kích hoạt; (2) cột Balloon — sampler 31 mẫu trong lúc chạy (avail 402–1.254 MB, balloon 4.988.376–6.259.028 kB); (3) đối chứng Chromium — 3/3 pass, N cộng dồn lên **N=2 mỗi pha** (đợt 137 N=1, đợt 138 N=0, đợt 139 +1); (4) diag baseline đã lưu lúc bắt đầu driver — dmesg **EPERM tái xác nhận**, journalctl -k rỗng; không có exit 124 nên diag-stall chưa gọi thật.
- **Điều tra chung (§B): H1 BÁC BỎ (đứng nguyên); H2 KHÔNG ỦNG HỘ (đứng nguyên); H3 VẪN MỞ (đứng nguyên) — CÓ BẰNG CHỨNG MỚI DẠNG 6 LẦN CHẠY KHÔNG KẸT.** Chuỗi "P3 không kẹt" kéo dài lên **lần thứ mười liên tiếp** (đợt 137 = 9, đợt 138 = 0 lần chạy KHÔNG đếm theo quyết (i), đợt 139 = 10 — 2/2 P3 WebKit pass + 2/2 P3 Chromium pass). Ba lần kẹt đợt 134/135 vẫn KHÔNG tái hiện.
- **1 reboot SAU khi harness xong:** boot `541524e2` chết trong khoảng (15:54:42Z, 15:55:24Z]; boot mới `af558fb5`, btime 15:54:37Z — **sớm hơn mốc cuối boot cũ 5 s** (cùng lớp F-138-T8-1; xem F-139-T8-3). Reboot giết lệnh kiểm sau-chạy của T8 (service restart) — kiểm lại bằng tay, không mất dữ liệu: 6 log chạy + snapshot attempt1 + summary còn nguyên trên workspace. Reboot xóa `/tmp` (fixture mất lần nữa — đợt sau rebuild lại sau gate như thường lệ).
- **Cây: preview.tsx `530e10a7` suốt lượt** (mở 14:44Z + cuối 16:00Z đều khớp); media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên. 3 script harness md5 MỚI (xem §6 — đổi path theo quyết (g)).
- **Dọn sạch:** driver đã thoát (ALL DONE 15:54:41Z); 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium sót sau reboot; `/tmp/.X11-unix/` trống; không `vite.lock`; không lock `t8-round139` nào được giữ (6/6 release, lần cuối 15:54:41Z).
- **Stage đợt này: 4 file** — LIMITS này + 3 script harness đã đổi diag path (xem Phụ lục).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 14:35:51 | Lượt cron 21:35 +07 mở đợt 139; `round-in-progress.md` tạo (9 luồng T1–T9; hạn cứng ~17:00Z) |
| 14:40–14:44 | T8 mở: boot `541524e2`, RAM avail ~480 MB, Balloon 6.443.824 kB (kẹt theo đợt 138), cây 530e10a7 |
| 14:44 | Tạo đường ổn định `t8-diag-stall.sh` (symlink → `round139-t8/diag-stall-139t8.sh`); đổi diag path 3 script harness; `node --check` OK cả 3 |
| 14:45:56 | Smoke-test diag QUA ĐƯỜNG MỚI (label `smoke-test`, devUrl rỗng): 10/10 file vào `round139-t8/smoke/stall-smoke-test-1795013156/`; dmesg EPERM, journalctl -k rỗng |
| 14:46:48 | Waiter bắt đầu (PID 13986), deadline gõ tay 16:30Z (epoch 1795019400); poll 1: t4=0 postboot=0 |
| 14:47:53 | T5 viết `POSTBOOT_PASS` boot mới (pass_at 14:47:53Z) — postboot=1 từ đây |
| 14:48:38 | T4 mở cửa yên poll #9 (gate0 PASS + gateA RAM 1.859 MB); attempt1 exit=1 lúc 14:48:45Z |
| ~15:02 | T4 attempt2 đang chạy (pass 2/20 lúc 15:02:18Z) |
| ~15:13 | T4 attempt3: analyzer 15:13:14Z, LOP-B 5/5, coverage 4/4 |
| 15:25:48 | **Waiter GATE-FOUND poll 40 — GATE MỞ** (t4.done + POSTBOOT_PASS boot 541524e2) |
| 15:38:20 | T8 phát hiện gate đã mở (chậm 13 phút do chu kỳ poll 15 phút — F-139-T8-1) |
| 15:38:51 | Rebuild fixture `/tmp` xong (~14 s); 6/6 md5 khớp (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) |
| 15:39:15 | Driver bắt đầu (boot 541524e2, btime /proc/1 13:53:52Z); Xvfb :199 pid 32027; sampler Balloon chạy |
| 15:39:19–15:40:38 | WebKit 84l10 exit 0 — W1×3 PASS, W2 PASS, E4 PASS |
| 15:40:53–15:43:02 | WebKit 85m4 exit 0 — P1–P5 PASS, HB128 chảy đều |
| 15:43:18–15:47:12 | WebKit 86n2 exit 0 — P1–P5 PASS |
| 15:47:28–15:48:28 | Chromium 84l10 exit 0 — W1×3, W2, E4 PASS |
| 15:48:44–15:50:43 | Chromium 85m4 exit 0 — P1–P5 PASS, HB128 chảy đều |
| 15:50:58–15:54:41 | Chromium 86n2 exit 0 — P1–P5 PASS |
| 15:54:41 | **ALL DONE — 6/6 exit 0, KHÔNG FAIL** |
| ~15:54:4x–15:55:24 | **REBOOT** — boot mới `af558fb5`, btime 15:54:37Z (F-139-T8-3); lệnh kiểm sau-chạy của T8 bị giết (service restart) |
| 15:55:24+ | T8 kiểm lại bằng tay trên boot mới: 6 log + snapshot còn nguyên, 0 process sót, `/tmp/.X11-unix/` trống, cây không đổi — **T8 đóng** |

## 2. Quyết parent (g) — đổi watchdog diag path sang đường dẫn ổn định

- **Đường mới:** `/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/t8-diag-stall.sh` — symlink → `round139-t8/diag-stall-139t8.sh` (file thật của đợt, adapt từ đợt 138, chỉ đổi số đợt trong header + `T8=.../round139-t8`). Lần sau chỉ cần trỏ lại symlink sang diag script của đợt mới; đường watchdog trong 3 script harness KHÔNG phải đổi nữa — đúng phương án ưu tiên của quyết (g) ("đường dẫn ổn định không gắn theo đợt").
- **Thay đổi trong 3 script harness:** chỉ đổi giá trị chuỗi của `DIAG137_SCRIPT` (1 dòng/script) từ `.../round137-t8/diag-stall-137t8.sh` sang `.../t8-diag-stall.sh`. **Không đổi logic:** tên hằng `DIAG137_SCRIPT`, tên hàm `evalDiag137`, nhãn log `WATCHDOG-137` GIỮ NGUYÊN cố ý (đổi tên chỉ thêm diff mà không đổi hành vi; ghi rõ để đợt sau không nhầm là sót). Không còn chuỗi `round137`/`137t8` nào trong 3 script (grep kiểm 0 kết quả).
- **md5 trước → sau (chỉ đổi path, không đổi logic):**

| File | md5 trước (đợt 138) | md5 sau (đợt 139) | Kích thước sau |
|---|---|---|---|
| `clicktest-84l10-webkit-loop-w1.mjs` | 46ab78a5 | a92432a2 | 31.359 B |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 14bb67e2 | 6e3ce0a0 | 35.805 B |
| `clicktest-86n2-webkit-w7.mjs` | 406abb75 | 847a818f | 37.903 B |

- `node --check` OK cả 3 sau khi sửa. Driver `run-webkit-139t8.sh` vẫn gọi diag script của đợt trực tiếp (`$T8/diag-stall-139t8.sh`) cho trường hợp exit 124 — không đổi (đường này vốn đã gắn đợt hiện tại, không lạc).
- **Kiểm chứng đường mới (3 lớp):** (a) smoke-test tay qua symlink 14:45:56Z — 10/10 file, dump rơi vào `round139-t8/smoke/stall-smoke-test-1795013156/` (đúng dir đợt hiện tại, KHÔNG sang round137); (b) `node --check` OK cả 3 script sau sửa; (c) 6/6 harness chạy xong với script mới, 0 lỗi gọi diag (`grep WATCHDOG/khong goi duoc diag` = 0 — nhưng watchdog 0 lần kích hoạt nên (c) chỉ chứng minh script chạy, KHÔNG chứng minh đường gọi diag trong kẹt thật — xem F-139-T8-5).
- **Chuẩn bị khác (adapt 138→139):** 5 script làm việc copy từ `round138-t8/` sang `round139-t8/` + sed `138t8→139t8`, `round138→round139`; `bash -n` OK cả 5; header stale sửa tay (boot 541524e2, btime 13:53:41Z, lượt yên #16, deadline 16:30Z). **Waiter KHÔNG còn nhánh fallback POSTBOOT_PASS đợt cũ** (F-139-T8-2): boot đã đổi (541524e2 ≠ 914964c3 ≠ 17db9652) nên mọi cờ cũ đều STALE; waiter chỉ chấp nhận `round139-t5/POSTBOOT_PASS` khớp boot hiện tại. Deadline waiter gõ TAY TRỰC TIẾP 16:30Z (epoch 1795019400, kiểm chứng `date -d` > epoch lúc viết 1795013002; hạn cứng ~17:00Z = 1795021200).

## 3. Reboot SAU khi harness xong — kết quả còn nguyên, mốc mâu thuẫn 5 s

- Harness xong hẳn 15:54:41Z (ALL DONE + 6 log + snapshot attempt1 đã ghi đĩa). Reboot xảy ra trong khoảng (15:54:42Z, 15:55:24Z] theo quan sát trực tiếp của T8 (driver còn sống lúc kiểm 15:54:42Z; boot mới đã hiện lúc 15:55:24Z).
- Boot mới `af558fb5`: btime 15:54:37Z (cả `/proc/stat` lẫn `uptime -s` — khớp nhau lần này), `/proc/1` 15:54:52Z (chênh 15 s, cùng lớp F-138-T8-6).
- **F-139-T8-3 — btime boot mới (15:54:37Z) sớm hơn mốc cuối boot cũ (15:54:42Z) 5 s:** cùng lớp mâu thuẫn mốc với F-138-T8-1 (26 s) và F-137-T8-7 (13 s). T8 chỉ ghi lại, không tự kết luận khung chết; T2/T6 đối chiếu. Reboot giết lệnh kiểm sau-chạy của T8 (service restart giữa chừng) — T8 kiểm lại bằng tay trên boot mới, không mất dữ liệu, không mất gate event nào (waiter log + summary còn nguyên).
- Reboot xóa `/tmp` (fixture mất lần nữa — đợt sau rebuild lại sau gate như thường lệ) và giết RAM sampler nền (đã xong nhiệm vụ: 31 mẫu trong lúc chạy đã ghi đĩa).
- Theo log T5/T4 đợt này: không có replay apt/dpkg nào trong cửa sổ chạy harness (T4 LOP-B B4 DAT ở attempt3); không ai thử birefnet đợt này (không phải việc T8).

## 4. Gate mở — T4 lượt yên #16 đo được (T4 3 attempt, cờ viết ~15:25Z)

- T4 poller: gate0 PASS + gateA đủ (RAM 1.859 MB) lúc poll #9 14:48:38Z — khác hẳn đợt 138 (RAM kẹt ~520–560 MB, gate A không mở). Balloon đã xả một phần trước giờ T4 mở cửa (6.443.824 kB lúc mở đợt → ~5,0 GB lúc 14:45Z), RAM avail 1.248–2.081 MB trong các poll đầu.
- T4 attempt1 exit=1 nhanh (14:48:45Z, chỉ ~7 s sau khi chạy); attempt2 chạy (pass 2/20 lúc 15:02:18Z); attempt3 analyzer 15:13:14Z, LOP-B 5/5, coverage 4/4. T4 viết `round139-t4.done` (file rỗng — waiter chỉ kiểm sự tồn tại, như mọi đợt) lúc ~15:25Z; waiter GATE-FOUND poll 40 lúc 15:25:48Z.
- T8 không kết luận gì về attempt1 exit=1 hay nội dung lượt yên #16 (việc T4) — chỉ ghi nhận tương quan: gate mở khi RAM đã hồi trên 1.024 MB, khớp quyết parent (c) đợt 138 "chờ balloon tự xả" (lần này balloon xả thật).

## 5. Trạng thái 4 bước kiểm đợt này — ĐÃ CHẠY ĐẦY ĐỦ (6 lần chạy)

| Bước | Cơ chế (đợt 137, giữ nguyên + đổi path đợt 139) | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `evalDiag137` trong 3 script, **đường mới `t8-diag-stall.sh`** (quyết (g)); `node --check` pass | Chạy trong 6/6 lần chạy | **0 kích hoạt** (không có evaluate nào im lặng >60 s); 0 dòng `WATCHDOG-137` trong summary + 6 run log — lần này là "watchdog im lặng vì không kẹt", khác đợt 138 ("không có lần chạy nào") |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-139t8.sh` (cột `balloon_kb` + label `mem_used`) | Chạy suốt driver (15:39–15:54Z) | **31 mẫu `ram-139t8.log` mới**: avail 402–1.254 MB, balloon 4.988.376–6.259.028 kB; không mẫu nào avail <400 MB; không có kẹt nên không có mẫu "tụt RAM trong lúc kẹt" (xem §B) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | Chạy đủ 3 pha | **3/3 pass** (84l10/85m4/86n2); N cộng dồn lên **N=2 mỗi pha** (đợt 137 N=1, đợt 138 N=0, đợt 139 +1) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 + baseline lúc bắt đầu | Baseline đã lưu lúc driver bắt đầu; chưa kích hoạt thật (0 lần timeout 124) | **dmesg EPERM tái xác nhận** (F-139-T8-4); journalctl -k rỗng; bước 4 vẫn chỉ thu được một nửa nếu có kẹt — đã chấp nhận theo quyết parent §12.3(h) đợt 137 |

## 6. Cây + md5 — mở / cuối đều khớp (trừ 3 script harness đổi path theo quyết (g))

| File | md5 lúc mở 14:44Z | md5 lúc cuối 16:00Z | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `clicktest-84l10-webkit-loop-w1.mjs` | 46ab78a5 | a92432a2 | **CÓ — đổi diag path theo quyết (g)** |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 14bb67e2 | 6e3ce0a0 | **CÓ — đổi diag path theo quyết (g)** |
| `clicktest-86n2-webkit-w7.mjs` | 406abb75 | 847a818f | **CÓ — đổi diag path theo quyết (g)** |

- Không có "md5 trước chạy" riêng vì md5 cuối = md5 sau khi đổi path (đổi trước khi chạy harness). Không sửa code app nên không có file production nào khác trong batch stage.
- Fixture: 6/6 md5 khớp lúc rebuild sau gate (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); **mất theo reboot sau harness** — đợt sau rebuild lại sau gate.

## 7. Dọn dẹp + kiểm cuối — sạch (reboot đã xóa /tmp, còn lại kiểm tay)

- Driver đã thoát sau ALL DONE 15:54:41Z (trap cleanup chạy — nhưng reboot ~15:54:4xZ có thể đã cắt trap giữa chừng; không thành vấn đề vì reboot xóa `/tmp`).
- Kiểm cuối trên boot mới `af558fb5`: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` trống; không có `/tmp/.X*-lock`; không có `vite.lock` trong repo; không lock `t8-round139` nào được giữ (6/6 release, lần cuối 15:54:41Z, giữ lâu nhất 234 s ở webkit 86n2).
- RAM sampler nền chết theo reboot (đã ghi đủ 31 mẫu); waiter đã thoát sau GATE-FOUND (exit 0); không process nào của T8 còn chạy.
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 8. Giới hạn — đọc trước khi trích số

1. **"6 lần chạy 0 kẹt đợt 139" là đúng — nhưng đừng trích "watchdog đã bắt được kẹt" hay "diag path mới đã chạy trong kẹt thật".** Watchdog 0 lần kích hoạt vì không có kẹt; đường mới chỉ được chứng minh bằng smoke-test + 6 lần chạy sạch (F-139-T8-5).
2. **Đối chứng Chromium N=2 mỗi pha** (đợt 137 + đợt 139) — vẫn mỏng; đề xuất cũ (tăng N lên 2/pha nếu thời gian cho phép) vẫn đứng, chưa làm đợt này vì 6/6 đã đủ ~15,5 phút trước hạn cứng.
3. **Bước 4 thiếu dmesg vĩnh viễn trong cell này** (F-139-T8-4): dmesg EPERM + journalctl -k rỗng — nếu đợt sau có kẹt, bằng chứng kernel vẫn thiếu dmesg (đã chấp nhận theo quyết parent).
4. **Chromium 84l10 dòng E4 ghi `ended=false` (WebKit ghi `ended=true`) nhưng verdict vẫn PASS/KHÔNG FAIL** — T8 ghi lại quan sát, không tự suy luận tiêu chí E4 (verdict của harness là chuẩn).
5. **Gate mở muộn (15:25:48Z) không phải do T8 chờ chậm** — T4 cần 3 attempt + phân tích mới viết cờ; T8 phát hiện chậm thêm 13 phút do chu kỳ poll (F-139-T8-1).
6. **Mốc reboot có mâu thuẫn nhỏ** (F-139-T8-3/F-139-T8-4): btime boot mới sớm hơn mốc cuối boot cũ 5 s; btime boot 541524e2 có 3 số khác nhau — khung chết chính xác để T2/T6 chốt, T8 không tự kết luận.
7. **RAM trong lúc chạy harness thấp (402–1.254 MB) nhưng 0 kẹt** — ủng hộ H2 "KHÔNG ỦNG HỘ" ở mức tương quan (xem §B); đừng trích thành "RAM thấp không gây kẹt" như chứng minh nhân quả.
8. **86n2 sau sửa vẫn 37.903 B (>37.768 B giới hạn push)** — như các file oversize khác, lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp (F-139-T8-6).

## 9. Sai số mới (F-139-T8-N)

- **F-139-T8-1 — T8 phát hiện gate mở muộn 13 phút (15:25:48Z → 15:38:20Z):** waiter GATE-FOUND poll 40 lúc 15:25:48Z nhưng chu kỳ kiểm tay 15 phút của T8 chỉ nhìn thấy lúc 15:38:20Z. Không ảnh hưởng kết quả (harness vẫn xong 15:54:41Z, còn ~1h05m đệm trước hạn cứng ~17:00Z). Bài học: khi T4 đã mở cửa yên (poll #9 14:48Z) thì rút chu kỳ kiểm xuống 5 phút — đợt này đã làm từ 15:17Z nhưng vẫn trượt cửa sổ 15:25–15:38Z vì một chunk 15 phút trước đó.
- **F-139-T8-2 — waiter bỏ nhánh fallback POSTBOOT_PASS đợt cũ:** boot đổi (541524e2 ≠ 914964c3 ≠ 17db9652) nên mọi cờ cũ STALE; waiter đợt 139 chỉ chấp nhận `round139-t5/POSTBOOT_PASS` khớp boot hiện tại. Đúng thiết kế, không phải lỗi — ghi lại để đợt sau (nếu cùng boot) biết cần thêm lại nhánh fallback.
- **F-139-T8-3 — reboot SAU khi harness xong, btime mâu thuẫn 5 s:** boot `541524e2` chết trong (15:54:42Z, 15:55:24Z]; boot mới `af558fb5` btime 15:54:37Z — sớm hơn mốc cuối boot cũ (driver còn sống 15:54:42Z) 5 s; `/proc/1` boot mới 15:54:52Z (chênh btime 15 s). Cùng lớp F-138-T8-1/F-137-T8-7. Reboot giết lệnh kiểm sau-chạy của T8 (service restart); kiểm lại tay, không mất dữ liệu. T2/T6 đối chiếu khung chết.
- **F-139-T8-4 — dmesg EPERM tái xác nhận + journalctl -k rỗng (giới hạn môi trường, bước 4 chỉ nửa bằng chứng):** smoke-test diag qua đường mới 14:45:56Z (10/10 file) + baseline driver lúc 15:39Z (`dmesg: read kernel buffer failed: Operation not permitted`; journalctl -k "-- No entries --"). Không thử lách (không can thiệp host). Giống hệt đợt 137/138.
- **F-139-T8-5 — đường diag mới CHƯA được chứng minh bằng kẹt thật:** watchdog 0 kích hoạt trong 6 lần chạy nên `t8-diag-stall.sh` chưa từng được gọi từ `evalDiag137` trong kẹt thật. Bằng chứng hiện có: smoke-test tay qua symlink OK (10/10 file, đúng dir đợt 139) + `node --check` OK + 6 lần chạy sạch với script mới. Nếu đợt sau có kẹt thật, lần kích hoạt đầu tiên sẽ là kiểm chứng live của đường mới.
- **F-139-T8-6 — 86n2 sau sửa vẫn oversize 37.903 B (>37.768 B):** trước sửa 37.918 B, sau sửa 37.903 B (đường path mới ngắn hơn 15 byte) — vẫn trên giới hạn push-files, cần `ENABLE_PRIVSEP=0` lúc push. T10 lưu ý khi gộp batch đợt 139.
- **F-139-T8-7 — dòng marker `=== CHROMIUM PHASE start ===` trong `ram-139t8.log` làm hỏng parse awk ngây thơ:** lần parse đầu cho avail_min=0/balloon_min=0 (dòng marker không phải mẫu). Log đúng vẫn đủ 31 mẫu (đã parse lại, lọc `^15:`). Hành vi có từ driver cũ, không phải lỗi mới — người đọc log sau nhớ lọc dòng mẫu.
- **F-139-T8-8 — btime boot 541524e2 có 3 số khác nhau:** `/proc/stat` + `uptime -s` = 13:53:41Z; `/proc/1` = 13:53:52Z (chênh 11 s, T4/T5/driver đều ghi nhận); `round-in-progress.md` = 14:03:07Z (chênh ~9,5 phút — có thể là lúc lượt cron phát hiện boot mới, không phải btime thật). Cùng lớp F-138-T8-6; để T2/T6 chốt số chuẩn, T8 không tự kết luận.

## 10. Nợ cho đợt sau / cần quyết parent

1. **Điều tra chung ba lần kẹt (§B):** H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ — đứng nguyên, có thêm 6 lần chạy không-kẹt (chuỗi P3 lên 10). Nếu nhiều đợt nữa 0 kẹt thì cân nhắc đóng điều tra dạng "không tái hiện được" (quyết parent đợt 137 §B6) — đợt 139 là đợt chạy được đầu tiên sau đợt 137 nên đếm được.
2. **Watchdog diag path mới:** lần kẹt thật đầu tiên ở đợt sau sẽ là kiểm chứng live của `t8-diag-stall.sh` — T8 đợt sau kiểm tra dump có rơi đúng dir đợt mới không (symlink cần trỏ lại mỗi đợt; nếu quên trỏ lại, dump sẽ rơi vào dir đợt 139 — ghi rõ để đợt sau nhớ).
3. **Gate T4 mở được khi balloon xả** — quyết (c) đợt 138 "chờ balloon tự xả" đã đúng lần này; nếu đợt sau balloon lại kẹt ~500 MB thì gate lại không mở (xem F-138-T8-7) — T4/T10 theo dõi, không cần quyết mới.
4. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (đợt này RAM max trong lúc chạy harness 1.254 MB, xa guard — không ai thử; u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung ba lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 139 (6 lần chạy, 0 kẹt — chuỗi P3 lên 10)

## B1. Trạng thái giả thuyết sau đợt 139

| Giả thuyết | Trạng thái đợt 138 | Trạng thái đợt 139 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Thêm 6 lần chạy không kẹt ở RAM thấp (402–1.254 MB trong lúc chạy) — củng cố, không đổi verdict |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ (đứng nguyên) | **KHÔNG ỦNG HỘ (đứng nguyên)** | Thêm 31 mẫu `ram-139t8.log` trong lúc chạy, không có kẹt nào để đo tụt RAM — vẫn không có bằng chứng mới trực tiếp; tương quan RAM thấp + 0 kẹt không ủng hộ H2 |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | Thêm 3 lần chạy WebKit không kẹt + 3 lần Chromium đối chứng không kẹt (N=2/pha) — vẫn không tái hiện, vẫn chưa chứng minh |

## B2. Trạng thái 4 bước kiểm (quyết parent đợt 136 §12.3(i)) — chi tiết đợt 139

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | ĐÃ ĐỔI ĐƯỜNG — `evalDiag137` trong 3 script trỏ `t8-diag-stall.sh` (quyết (g)); md5 mới | Chạy trong 6/6 lần chạy | **0 kích hoạt** (không có evaluate >60 s); đường mới chưa kích hoạt thật (F-139-T8-5) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver | Chạy suốt driver | **31 mẫu mới** `ram-139t8.log` (avail 402–1.254 MB, balloon 4.988.376–6.259.028 kB) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver | Chạy đủ 3 pha | **3/3 pass**; N cộng dồn **N=2 mỗi pha** (đợt 137 N=1 + đợt 139 N=1) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (diag script smoke-test OK qua đường mới 14:45:56Z; baseline đã lưu 15:39Z) | Chưa kích hoạt thật (0 lần timeout 124) | **dmesg BỊ CHẶN (EPERM) tái xác nhận; journalctl -k rỗng** — bước 4 vẫn chỉ thu được một nửa nếu có kẹt |

## B3. Chữ ký kẹt của cả ba lần — không đổi từ đợt 136/137 (ghi lại để đối chiếu)

Xem docs/PHASE9_ROUND137_T8_VITEHARNESS_LIMITS.md §B3: cả ba đều là một lệnh `page.evaluate` không bao giờ trả kết quả, ngay sau một bước PASS, process idle (loadavg ~0,1), không verdict FAIL. Đợt 139 không thêm mẫu kẹt mới nào (0 kẹt trong 6 lần chạy) — nhưng thêm 6 mẫu chạy-pass (trong đó P3 WebKit 2/2 pass, P3 Chromium 2/2 pass).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 139 TĂNG 6

- Đợt 137: 6 lần chạy, 0 kẹt (WebKit 3 + Chromium 3). Đợt 138: **0 lần chạy** (không đếm — quyết parent (i)). Đợt 139: **6 lần chạy, 0 kẹt** (WebKit 3 + Chromium 3).
- Chuỗi "P3 không kẹt" lên **lần thứ mười liên tiếp** (đợt 137 = 9; đợt 139 = 10 — 85m4 P3 PASS + 86n2 P3 PASS, WebKit; Chromium đối chứng cũng 2/2 P3 pass).
- Ba lần kẹt đợt 134/135 vẫn KHÔNG tái hiện lần nào kể từ đợt 135/136 — đợt 139 là đợt chạy được đầu tiên sau đợt 137 kiểm chứng thêm điều này.
- Hệ quả cho quyết parent đợt 137 §B6 ("nếu nhiều đợt nữa 0 kẹt thì cân nhắc đóng điều tra dạng 'không tái hiện được'"): đợt 139 **đếm được** (là một đợt "0 kẹt" thật, khác đợt 138 "0 lần chạy") — cần thêm các đợt chạy được nữa trước khi bàn đóng.

## B5. Yếu tố chung khác — cập nhật đợt 139

- Cùng boot? KHÔNG — 3 lần kẹt cũ ở 3 boot khác nhau (cc1f9de0, 8ae55060, 78b55838); đợt 137 chạy không kẹt trên boot thứ tư (17db9652); đợt 139 chạy không kẹt trên boot thứ sáu (541524e2 — boot thứ năm 914964c3 không có lần chạy nào, gate không mở). Boot thứ bảy (af558fb5) xuất hiện SAU khi harness xong, chưa có lần chạy nào.
- Vite server còn sống lúc kẹt? VẪN KHÔNG CÓ BẰNG CHỨNG — cơ chế kiểm đã sẵn sàng (watchdog probe vite-HTTP + diag script, giờ qua đường ổn định mới), chỉ chờ kẹt thật.
- Tải từ luồng song song khác trong cửa sổ chạy? Load1 trong lúc chạy harness 0,49–1,15 (sampler 30 s); không có kẹt nên không so sánh được với loadavg ~0,1 lúc kẹt cũ.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- Yếu tố chung duy nhất đã chứng minh: cả ba đều là `page.evaluate` chờ trạng thái media element không trả, ngay sau một bước PASS, process idle, không verdict FAIL.
- **4 bước kiểm GIỮ NGUYÊN cho đợt sau, không cần triển khai lại** (chỉ lưu ý: symlink `t8-diag-stall.sh` cần trỏ lại sang diag script đợt mới mỗi đợt — xem §10.2). Khi có kẹt thật, watchdog + bước 4 sẽ tự kích hoạt — không cần quyết mới.
- Đề xuất nhỏ cho đợt sau (không cần quyết parent — chẩn đoán-only, nhắc lại từ đợt 137): tăng N đối chứng Chromium lên 2 lần mỗi pha nếu thời gian cho phép (cộng dồn N=2 đợt 139 → N=4 sau 1 đợt chạy được nữa), để baseline Chromium dày hơn trước khi kết luận gì về H3.

## B7. Bằng chứng mới từ đợt 139 — 6 lần chạy không kẹt + 31 mẫu RAM

- 6 lần chạy pass (WebKit 3 + Chromium 3), P1–P5 PASS cả hai engine, HB128 chảy đều, 0 WATCHDOG-137, 0 timeout 124.
- 31 mẫu `ram-139t8.log` trong lúc chạy: avail thấp nhất 402 MB (lúc 15:4xZ), cao nhất 1.254 MB; balloon 4.988.376–6.259.028 kB. RAM thấp kéo dài trong lúc chạy mà 0 kẹt — tương quan này không ủng hộ H2 (H2 chỉ nói về tụt RAM *trong lúc kẹt/chạy*; không có kẹt nên không đo được tụt RAM trong kẹt — chỉ ghi nhận tương quan).
- Reboot sau harness (boot af558fb5, btime 15:54:37Z) không ảnh hưởng kết quả (harness đã xong hẳn trước reboot).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round139-t8-viteharness.txt` — **4 file** (chỉ text, 0 binary): LIMITS này + 3 script harness đã đổi diag path (xem §2/§6). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round139-t8/` (wait-t4-t5-139t8.sh — deadline gõ tay 16:30Z, KHÔNG còn fallback cờ cũ; run-webkit-139t8.sh — Balloon + Chromium + diag-khi-124, ĐÃ CHẠY 6/6; run-webkit-139t8-retry84l10.sh — đã adapt, KHÔNG dùng (không có timeout nào); rebuild-fixtures-139t8.sh — ĐÃ DÙNG sau gate (6/6 md5 khớp); diag-stall-139t8.sh — smoke-test tay OK qua đường ổn định mới 14:45:56Z; smoke/wait-t4-t5.log — GATE-FOUND poll 40 15:25:48Z; smoke/run-webkit-summary.txt + run-*.log — 6/6 exit 0 KHÔNG FAIL; smoke/attempt1/ — 7 file snapshot; smoke/ram-139t8.log — 31 mẫu Balloon; smoke/tree-md5-open.txt + tree-md5-final.txt — đều 530e10a7 (trừ 3 script harness đổi path); smoke/stall-smoke-test-1795013156/ (smoke-test tay QUA ĐƯỜNG MỚI — 10 file, dmesg EPERM + journalctl rỗng); smoke/baseline-dmesg-tail50.txt + baseline-journalctl-k.txt + baseline-meminfo.txt). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round139-t8/diag-stall-139t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` hiện TRỐNG (mất theo reboot sau harness — đợt sau rebuild lại sau gate).

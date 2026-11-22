# Đợt 138 T8 — GATE KHÔNG MỞ: 0 lần chạy harness (T4 gate A không mở, waiter chạm deadline 13:30Z) — 4 BƯỚC KIỂM GIỮ NGUYÊN, CHƯA CHẠY ĐỢT NÀY

Ngày: 18/11/2026 (lượt cron 18:35 +07 = 11:35Z; T8 mở 11:40Z, đóng 13:31Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (A) chờ cờ + chạy harness + LIMITS này — **HARNESS KHÔNG CHẠY ĐƯỢC đợt này vì gate T4/postboot không mở** (xem §0–§4); (B) 4 bước kiểm kẹt GIỮ NGUYÊN theo brief đợt 138 + quyết parent đợt 137 §12.3(h) — cơ chế còn nguyên, **chưa chạy đợt này** (không có lần chạy nào để kích hoạt hay đo). KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND137_T8_VITEHARNESS_LIMITS.md (§B + §9: 4 bước kiểm giữ nguyên) + quyết parent đợt 137 §12.3(a)(h).

## 0. Kết luận ngắn — 0/6 harness, 0 lần chạy, 0 kẹt (không có mẫu mới); gate không mở; 1 reboot giữa phiên

- **Gate KHÔNG MỞ trong cả cửa sổ chờ 11:40:45–13:30:50Z (~1h50m):** postboot PASS từ 12:22:38Z (T5, boot mới `914964c3`, poll 28) nhưng **`round138-t4.done` KHÔNG BAO GIỜ xuất hiện** — T4 poller 120 poll, gate A không mở, T4 tự đóng 13:30Z với **0 attempt** (xem §4).
- **Waiter chạm deadline 13:30Z (poll 98, exit 3) — GATE NOT MET.** KHÔNG gia hạn (xem F-138-T8-3): T4 chưa bắt đầu attempt lúc 13:24Z, không còn đủ thời gian cho harness đầy đủ 6/6 (~22 phút) trước hạn cứng đóng sổ ~14:00Z; chạy không cờ sẽ phá lịch lệch T4-trước/T8-sau + nhiễu phép đo T4.
- **1 reboot giữa phiên:** boot `17db9652` (#94?) chết ~11:52Z; boot mới `914964c3` = #95? (tạm), btime 11:52:20Z theo `/proc/stat` (cửa sổ reboot (11:51:36Z, 11:52:20Z] do T2-138 xác nhận). Reboot giết waiter cũ + monitor nền + fixture `/tmp` (xem §3). Waiter khởi động lại bằng tay 11:53:48Z (PID 1903), log boot cũ đã backup.
- **4 bước kiểm — trạng thái đợt này: CƠ CHẾ CÒN NGUYÊN, CHƯA CHẠY** (không có lần chạy nào): (1) watchdog `evalDiag137` còn trong 3 script (md5 không đổi) — 0 kích hoạt vì 0 lần chạy; (2) cột Balloon trong driver còn nguyên — sampler không chạy nên không có mẫu `ram-138t8.log` mới; (3) đối chứng Chromium không chạy; (4) diag script smoke-test tay OK 11:40Z (10/10 file) — dmesg **EPERM tái xác nhận**, journalctl -k rỗng (F-138-T8-4).
- **Điều tra chung (§B): H1 BÁC BỎ (đứng nguyên); H2 KHÔNG ỦNG HỘ (đứng nguyên); H3 VẪN MỞ (đứng nguyên) — KHÔNG CÓ BẰNG CHỨNG MỚI.** Đợt này đóng góp **0 lần chạy**, nên: chuỗi "P3 không kẹt lần thứ chín liên tiếp" KHÔNG kéo dài thêm (vẫn 9, dừng ở đợt 137); số lần chạy không-kẹt cộng dồn KHÔNG tăng. Đừng trích đợt 138 như một đợt "0 kẹt" — đúng ra là "0 lần chạy nên không có mẫu".
- **Cây: preview.tsx `530e10a7` suốt lượt** (mở 11:40:45Z + cuối 13:31:39Z đều khớp); media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên. 3 script harness watchdog md5 giữ nguyên (84l10 `46ab78a5`, 85m4 `14bb67e2`, 86n2 `406abb75`).
- **Fixture `/tmp`: còn 6/6 md5 khớp lúc mở (11:39Z), MẤT theo reboot 11:52Z, KHÔNG rebuild** (không có gate → không rebuild; đợt sau rebuild lại sau gate như thường lệ).
- **Dọn sạch:** T8 không khởi động Xvfb/vite/MiniBrowser nào đợt này (driver chưa từng chạy) → 0 process sót, `/tmp/.X11-unix/` trống, không `vite.lock`, không lock `t8-round138` nào được giữ.
- **Stage đợt này: CHỈ 1 file — LIMITS này.** Không có file code nào đổi (3 script harness giữ nguyên md5, driver chỉ là working state trong hidden_files).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:35 | Lượt cron 18:35 +07 mở đợt 138; `round-in-progress.md` tạo (9 luồng T1–T9 spawn 11:37Z; hạn cứng ~14:00Z) |
| 11:37:53 | T8 mở: boot `17db9652` (#94?), RAM avail 458 MB, Balloon 6.443.824 kB, cây 530e10a7 |
| 11:39 | Fixture `/tmp` kiểm: 6/6 md5 khớp (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) |
| 11:40:38 | Smoke-test `diag-stall-138t8.sh` tay (label `smoke-test`, devUrl chết): 10/10 file ghi đủ; dmesg EPERM, journalctl -k rỗng |
| 11:40:45 | Waiter bắt đầu (PID 25490), deadline gõ tay 13:30Z (epoch 1795008600); poll 1: t4=0 postboot=1 (nhờ fallback cờ đợt 137 — cùng boot) |
| 11:50:07 | Monitor check 10: T4 dir đã có; gate chưa mở |
| ~11:51:36–11:52:20 | **REBOOT** — cửa sổ do T2-138 xác nhận (11:51:36Z, 11:52:20Z] |
| 11:52:46 | Mốc cuối trên boot cũ: waiter poll 13 (muộn hơn btime boot mới 26 s — F-138-T8-1) |
| 11:53:48 | Waiter khởi động lại bằng tay (PID 1903) trên boot mới `914964c3`; poll 1 (mới): t4=0 postboot=0 |
| 12:22:38 | T5 viết `POSTBOOT_PASS` boot mới (poll 28) — postboot=1 từ đây |
| 12:34 | T5 addendum + `round138-t5.done` có (theo build-loop log) |
| 13:09 | T7 xong: cửa LÀNH (theo build-loop log) |
| 13:22:57 | Monitor check 90 (cuối): gate chưa mở; t4done=no, postboot138=YES |
| 13:24:08 | T4 poll #113: load1 0,19, blockers 0, RAMavail 536 MB, gate A vẫn chưa mở |
| 13:29:24 | T4 poll #120 (cuối): "HET HAN CHO 13:30Z 18/11 — 0 attempt (gate A khong mo trong cua so cho)" — T4 tự đóng |
| 13:30:50 | **Waiter WAIT-DEADLINE poll 98, exit 3 — GATE NOT MET**; waiter thoát |
| 13:31:39 | Kiểm cuối: cây không đổi, 0 process sót, boot vẫn `914964c3`, RAM avail 469 MB — **T8 đóng** |

## 2. Chuẩn bị — script adapt 137→138 xong TRƯỚC khi gate mở (không đụng harness script)

- 5 script làm việc copy từ `round137-t8/` sang `round138-t8/` + sed `137t8→138t8`, `round137→round138`: waiter, driver, rebuild-fixtures, diag-stall, retry84l10. `bash -n` OK cả 5; grep kiểm ref `137` còn sót: chỉ còn (a) ghi chú lịch sử đúng (quyết parent đợt 137, bước kiểm thêm đợt 137), (b) `WATCHDOG-137` / `evalDiag137` — **bắt buộc giữ** vì watchdog trong 3 script harness vẫn tên đó (xem F-138-T8-5).
- Header stale sửa tay (kiểu F-137-T8-3): boot id mới, deadline mới, đường dẫn diag mới; retry script: sửa boot id stale `2104246b` trong comment gate + label `swap_used` → `mem_used` (nhất quán với driver đợt 137; F-138-T8-8). Script retry KHÔNG dùng đợt này.
- **Deadline waiter gõ TAY TRỰC TIẾP 13:30Z** (epoch 1795008600, kiểm chứng `date -d` = 2026-11-18 13:30:00Z, > epoch lúc viết 1795002014; hạn cứng ~14:00Z = 1795010400) — không sed đổi chuỗi date (bài học đợt 132).
- **Waiter có thêm nhánh fallback POSTBOOT_PASS đợt 137** (chỉ khớp khi CÙNG boot): poll 1 trên boot cũ cho postboot=1 nhờ fallback này — cơ chế đã chứng minh chạy được live. Trên boot mới fallback không khớp (đúng thiết kế) → postboot=0 cho tới khi T5-138 viết cờ mới 12:22:38Z.
- Driver `run-webkit-138t8.sh`: giữ nguyên logic đợt 137 (Xvfb :199, lock `t8-round138`, sampler Balloon 30 s, baseline dmesg/journalctl, diag khi exit 124, đối chứng Chromium) — **chưa từng chạy đợt này** (gate không mở).
- **KHÔNG sửa 3 script harness** (md5 giữ nguyên — xem §6). Watchdog `evalDiag137` vẫn trỏ diag script đợt 137 theo đường tuyệt đối (F-138-T8-5).

## 3. Reboot giữa phiên — waiter + monitor chết theo, khởi động lại tay

- Boot cũ `17db9652` (#94?) chết trong cửa sổ (11:51:36Z, 11:52:20Z] (T2-138 xác nhận); boot mới `914964c3` = #95? (tạm), btime 11:52:20Z theo `/proc/stat`.
- **F-138-T8-1 — mốc waiter poll 13 lúc 11:52:46Z muộn hơn btime boot mới 26 s:** cùng lớp mâu thuẫn mốc với F-137-T8-7 (đợt 137: mốc waiter muộn hơn btime 13 s). T8 chỉ ghi lại, không tự kết luận khung chết; T2/T6 đối chiếu. Bổ sung: btime boot mới có 2 số khác nhau — `/proc/stat` 11:52:20Z vs `POSTBOOT_PASS` của T5 (từ `/proc/1`) 11:52:36Z — chênh 16 s (F-138-T8-6; T4 cũng ghi nhận chênh này trong log gate0wait-113).
- Reboot giết: waiter cũ PID 25490 (poll 1–13 trên boot cũ) + monitor nền đầu tiên (SIGTERM ~11:52Z, chỉ tới check 10). **Không mất dữ liệu:** log waiter boot cũ backup trước khi khởi động lại (`smoke/wait-t4-t5-boot17db9652.log`); script/driver/cây trên workspace còn nguyên (workspace bền qua reboot); fixture `/tmp` mất (rebuild sau gate — không xảy ra vì gate không mở).
- Waiter khởi động lại bằng tay 11:53:48Z (PID 1903, `waiter-nohup-boot914964c3.out`); đọc lại boot mỗi poll nên tự theo boot mới. Monitor nền thứ hai khởi động lại, chạy đủ 90 check tới 13:22:57Z rồi kết thúc đúng thiết kế (không phải lỗi — F-138-T8-9).
- Theo build-loop log (T5/T7): replay boot cũ #94? XONG HẲN (1.545 dòng / 221 installs / 462 configure); replay boot mới #95? KẸT ở apt-get update → luật (C) kích hoạt lần đầu (kill 802, --repair PASS, POSTBOOT_PASS 12:22:38Z poll 28). RAM trước reboot lên tới 6.112.624 kB (97,2% guard birefnet, T5 sampler 11:51:59Z) — reboot cắt đúng lúc RAM sắp vượt guard; **không ai kịp thử birefnet** (không phải việc T8; ghi lại từ log T5).

## 4. Gate không mở — T4 gate A không mở trong cửa sổ chờ; KHÔNG gia hạn, KHÔNG chạy harness

- T4 poller chạy 120 poll (~45 s/poll, tới 13:29:24Z) trên boot mới: load1 0,06–0,81, blockers 0 (đếm từ snapshot — quyết parent §12.3(i) đã tuân thủ), tree YES 530e10a7, t5flag PASS, postboot_exit=0, apt=0 — **mọi điều kiện hiển thị đều xanh, trừ RAMavail kẹt ~520–560 MB suốt ~90 phút** (523 MB lúc poll #120). T4 kết luận: "gate A khong mo trong cua so cho" và tự đóng 13:30Z với 0 attempt.
- T8 không kết luận nguyên nhân gate A không mở (việc T4) — chỉ ghi nhận tương quan: RAM avail thấp kéo dài (~520–560 MB, balloon ~5,0–6,4 GB) là điểm khác biệt rõ nhất so với đợt 137 (gate mở khi RAM=1.134 MB). Xem F-138-T8-7.
- **F-138-T8-3 — KHÔNG gia hạn deadline waiter (13:30Z → không đổi):** lúc 13:24Z T4 vẫn chưa bắt đầu attempt (còn ở gate0-wait); dù gate có mở ngay lúc đó, T4 vẫn cần attempt ~10 phút + phân tích rồi mới viết cờ — không còn đủ thời gian cho harness đầy đủ 6/6 (~22 phút: rebuild ~1 phút + WebKit ~7 phút + Chromium ~6 phút + kiểm cuối ~5 phút) trước hạn cứng ~14:00Z. Gia hạn chỉ trì hoãn kết quả đã rõ. Chạy harness không cờ cũng bị loại: phá lịch lệch T4-trước/T8-sau (quyết parent đợt 128 §12.3(b)) + có thể nhiễu phép đo T4 nếu T4 đang đo; chạy rút gọn chỉ-WebKit trái brief yêu cầu 6/6.
- Hệ quả trực tiếp: **0 lần chạy harness, 0 mẫu tickCost/stall mới, 0 lần gọi diag-stall thật, 0 dòng `ram-138t8.log` mới.** Các file `smoke/` đợt này chỉ có: waiter log 2 boot, tree-md5 open/final, diag smoke-test, monitor log (trong exec session, không lưu file riêng — các mốc đã ghi ở §1).

## 5. Trạng thái 4 bước kiểm đợt này — cơ chế còn nguyên, CHƯA CHẠY

| Bước | Cơ chế (đợt 137, giữ nguyên) | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `evalDiag137` trong 3 script, 5 vị trí, `node --check` pass đợt 137; md5 script không đổi đợt này | Không chạy (0 lần chạy) | 0 kích hoạt; 0 dòng `WATCHDOG-137` — **không phải "watchdog im lặng vì không kẹt" mà là "không có lần chạy nào để watchdog quan sát"** |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-138t8.sh` (cột `balloon_kb` + label `mem_used`) | Không chạy | Không có mẫu `ram-138t8.log` mới; số RAM duy nhất đợt này là các mốc rời rạc trong §1/§4 (458 → 1.822 → 469 MB avail; balloon 5,0–6,4 GB) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | Không chạy | Không thêm N nào; N cộng dồn vẫn N=1 mỗi pha (đợt 137) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 + baseline lúc bắt đầu | Smoke-test tay OK 11:40Z; chưa kích hoạt thật (0 lần chạy) | **dmesg EPERM tái xác nhận** (F-138-T8-4); journalctl -k rỗng; bước 4 vẫn chỉ thu được một nửa nếu có kẹt — đã chấp nhận theo quyết parent §12.3(h) |

## 6. Cây + md5 — mở / cuối đều khớp, không đổi suốt lượt

| File | md5 lúc mở 11:40:45Z | md5 lúc cuối 13:31:39Z | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `clicktest-84l10-webkit-loop-w1.mjs` | 46ab78a5 | 46ab78a5 | Không (watchdog còn nguyên) |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 14bb67e2 | 14bb67e2 | Không |
| `clicktest-86n2-webkit-w7.mjs` | 406abb75 | 406abb75 | Không |

- Không có "md5 trước chạy" vì không có lần chạy nào. Không sửa code app nên không có file production nào trong batch stage.
- Fixture: 6/6 md5 khớp lúc mở (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); mất theo reboot; **không rebuild** (không có gate).

## 7. Dọn dẹp + kiểm cuối — không có gì để dọn (driver chưa chạy)

- T8 không khởi động Xvfb :199, vite dev server, MiniBrowser hay sampler nào đợt này → kiểm cuối 13:31Z: 0 process Xvfb/vite/MiniBrowser/WebKit; `/tmp/.X11-unix/` trống; không có `/tmp/.X*-lock`; không có `vite.lock`; không lock `t8-round138` nào được giữ (chưa từng acquire).
- Waiter đã thoát sau WAIT-DEADLINE (exit 3); monitor nền thứ hai đã kết thúc 13:23Z; không process nào của T8 còn chạy.
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 8. Giới hạn — đọc trước khi trích số

1. **"0 kẹt đợt 138" là SAI nếu hiểu là "6 lần chạy không kẹt" — đúng là "0 lần chạy, 0 mẫu".** Đừng cộng đợt 138 vào chuỗi đợt không-kẹt, đừng kéo dài chuỗi "P3 không kẹt lần thứ chín liên tiếp" (vẫn dừng ở 9 — đợt 137).
2. **4 bước kiểm đợt này là "cơ chế còn nguyên", không phải "đã chạy".** Watchdog chưa từng kích hoạt thật qua 2 đợt (137: 0 lần kẹt trong 6 lần chạy; 138: 0 lần chạy). Đừng trích "watchdog đã bắt được kẹt" hay "Balloon đã đo đợt 138" — chưa có.
3. **Đối chứng Chromium vẫn N=1 mỗi pha** (chỉ đợt 137) — chưa dày thêm.
4. **Bước 4 thiếu dmesg vĩnh viễn trong cell này** (F-138-T8-4): dmesg EPERM + journalctl -k rỗng — nếu đợt sau có kẹt, bằng chứng kernel vẫn thiếu dmesg (đã chấp nhận theo quyết parent).
5. **Nguyên nhân gate A không mở là việc T4, T8 không kết luận** — T8 chỉ ghi tương quan RAM thấp kéo dài (F-138-T8-7). Đừng trích "T4 gate A kẹt vì RAM" như kết luận của T8.
6. **Mốc reboot có mâu thuẫn nhỏ** (F-138-T8-1/F-138-T8-6): poll 13 muộn hơn btime 26 s; btime có 2 số chênh 16 s — khung chết chính xác để T2/T6 chốt, T8 không tự kết luận.
7. **Hạn cứng T10 đợt 138 (~14:00Z) là ước theo round-in-progress.md** — T8 đóng 13:31Z, còn ~29 phút đệm nếu ước đúng.
8. **0 reboot trong cửa sổ chạy harness không áp dụng đợt này** (không có cửa sổ chạy) — đợt này đã có 1 reboot giữa phiên (11:52Z). T8 đợt sau vẫn phải chịu reboot (waiter đọc lại boot mỗi poll + backup log + rebuild fixture sau reboot).

## 9. Sai số mới (F-138-T8-N)

- **F-138-T8-1 — reboot giữa phiên giết waiter + monitor (mốc mâu thuẫn 26 s):** xem §3. Boot `17db9652` → `914964c3`, cửa sổ (11:51:36Z, 11:52:20Z] (T2-138 xác nhận); mốc cuối boot cũ là waiter poll 13 lúc 11:52:46Z — muộn hơn btime boot mới 26 s. Cùng lớp F-137-T8-7. Waiter khởi động lại tay 11:53:48Z (PID 1903); log boot cũ backup; không mất dữ liệu.
- **F-138-T8-2 — gate T4 không mở (T4 0 attempt):** xem §4. T4 poller 120 poll, gate A không mở; T4 tự đóng 13:30Z 0 attempt. Hệ quả: T8 0 lần chạy harness. RAM avail ~520–560 MB kẹt suốt ~90 phút trên boot mới là điểm khác biệt rõ nhất so với đợt 137 (gate mở khi RAM=1.134 MB) — chỉ là tương quan, T8 không kết luận nguyên nhân.
- **F-138-T8-3 — waiter chạm deadline 13:30Z (poll 98, exit 3), KHÔNG gia hạn:** xem §4. Lý do: T4 chưa bắt đầu attempt lúc 13:24Z; không đủ thời gian cho harness đầy đủ trước hạn cứng ~14:00Z; chạy không cờ phá lịch lệch + nhiễu phép đo T4.
- **F-138-T8-4 — dmesg EPERM tái xác nhận + journalctl -k rỗng (giới hạn môi trường, bước 4 chỉ nửa bằng chứng):** smoke-test diag 11:40:38Z (10/10 file) + kiểm trực tiếp `dmesg: read kernel buffer failed: Operation not permitted`; `journalctl -k` exit 0 nhưng "-- No entries --". Không thử lách (không can thiệp host). Giống hệt đợt 137 (F-137-T8-1).
- **F-138-T8-5 — watchdog diag path vẫn trỏ về `round137-t8/diag-stall-137t8.sh` (cố ý, GIỮ NGUYÊN):** 3 script harness hardcode đường tuyệt đối tới diag script đợt 137; đổi đường dẫn sẽ đổi md5 script — trái brief "giữ nguyên, không triển khai lại". Driver 138 dùng `diag-stall-138t8.sh` riêng cho trường hợp exit 124. Nếu watchdog kích hoạt ở đợt sau, dump sẽ vào `round137-t8/smoke/stall-*` (không phải `round138-t8/smoke/`). Ghi rõ để đợt sau không nhầm là dump lạc.
- **F-138-T8-6 — btime boot mới có 2 số chênh 16 s:** `/proc/stat` 11:52:20Z vs `POSTBOOT_PASS` của T5 (từ `/proc/1`) 11:52:36Z. T4 cũng ghi nhận chênh này trong log gate0wait-113 ("11:52:20Z uptime -s / 11:52:36Z stat /proc/1"). Để T2/T6 đối chiếu khi chốt khung chết #94?; T8 không tự kết luận.
- **F-138-T8-7 — RAM avail thấp kéo dài trên boot mới:** lúc mở (boot cũ) 458 MB; sau reboot hồi lên 1.822 MB (11:53Z) rồi kẹt ~520–560 MB suốt 120 poll của T4 (~90 phút); lúc đóng 469 MB, balloon 6.443.824 kB (bơm lại cuối lượt). Tương quan với gate A không mở — chỉ ghi nhận, không kết luận.
- **F-138-T8-8 — retry script: label `swap_used` → `mem_used` đã sửa + boot id stale `2104246b` trong comment gate đã sửa:** nhất quán với driver đợt 137. Script retry không dùng đợt này; không ảnh hưởng kết quả.
- **F-138-T8-9 — monitor nền đầu tiên bị SIGTERM theo reboot:** giống waiter (F-138-T8-1). Monitor thứ hai chạy đủ 90 check tới 13:22:57Z rồi kết thúc đúng thiết kế; monitor ngắn thứ ba chờ deadline chạy đủ 8 check tới 13:31:30Z. Không mất gate event nào (waiter log là nguồn chính, còn nguyên cả 2 boot).

## 10. Nợ cho đợt sau / cần quyết parent

1. **Điều tra chung ba lần kẹt (§B):** H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ — đứng nguyên, không bằng chứng mới. Đợt 138 đóng góp 0 lần chạy nên không tiến thêm bước nào; nếu đợt 139 chạy được 6/6 không kẹt thì chuỗi lần chạy không-kẹt mới tăng tiếp.
2. **Gate T4 không mở do RAM thấp kéo dài?** T4/parent xem lại ngưỡng gate A (RAM) và/hoặc cơ chế hồi balloon — T8 chỉ ghi tương quan (F-138-T8-7), không đề xuất ngưỡng.
3. **Watchdog diag path trỏ về round137 (F-138-T8-5):** parent/T10 quyết có nên đổi 3 script harness trỏ sang diag script của đợt hiện tại (đổi md5, cần chạy lại kiểm chứng) hay giữ nguyên như hiện tại (dump lạc sang dir đợt 137 khi kích hoạt).
4. **Bước 4 thiếu dmesg vĩnh viễn trong cell này?** Đã chấp nhận theo quyết §12.3(h) — nhắc lại để parent khỏi hỏi lại khi có kẹt thật.
5. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (đợt này không có mẫu nào ≥ guard — RAM max theo T5 là 6.112.624 kB lúc 11:51:59Z, thiếu ~85 MiB, rồi reboot cắt cửa sổ); mù #57 (T2 đợt 138); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung ba lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 138 (0 lần chạy — không có bằng chứng mới)

## B1. Trạng thái giả thuyết sau đợt 138

| Giả thuyết | Trạng thái đợt 137 | Trạng thái đợt 138 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Không có bằng chứng mới (0 lần chạy) |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ (yếu thêm) | **KHÔNG ỦNG HỘ (đứng nguyên)** | Không có bằng chứng mới (0 lần chạy; không có mẫu `ram-138t8.log` nào) |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | Không có bằng chứng mới (0 lần chạy; đối chứng Chromium không chạy thêm) |

## B2. Trạng thái 4 bước kiểm (quyết parent đợt 136 §12.3(i)) — chi tiết đợt 138

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | CÒN NGUYÊN — `evalDiag137` trong 3 script, md5 không đổi | Không chạy (0 lần chạy) | 0 kích hoạt; chưa có bằng chứng mới về H3 |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver | Không chạy | Không có mẫu mới; RAM chỉ có các mốc rời rạc (§1/§4) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver | Không chạy | N cộng dồn vẫn N=1 mỗi pha (đợt 137) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (diag script smoke-test OK 11:40Z) | Chưa kích hoạt (0 lần chạy) | **dmesg BỊ CHẶN (EPERM) tái xác nhận; journalctl -k rỗng** — bước 4 vẫn chỉ thu được một nửa nếu có kẹt |

## B3. Chữ ký kẹt của cả ba lần — không đổi từ đợt 136/137 (ghi lại để đối chiếu)

Xem docs/PHASE9_ROUND137_T8_VITEHARNESS_LIMITS.md §B3: cả ba đều là một lệnh `page.evaluate` không bao giờ trả kết quả, ngay sau một bước PASS, process idle (loadavg ~0,1), không verdict FAIL. Đợt 138 không thêm mẫu kẹt mới nào (0 lần chạy) và cũng không thêm mẫu chạy-pass nào.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 138 KHÔNG tăng

- Đợt 137: 6 lần chạy, 0 kẹt (WebKit 3 + Chromium 3). Đợt 138: **0 lần chạy** → tổng số lần chạy không-kẹt cộng dồn KHÔNG đổi.
- Chuỗi "P3 không kẹt lần thứ chín liên tiếp" dừng ở 9 (đợt 137) — đợt 138 không chạy tới P3 nên không đếm.
- Ba lần kẹt đợt 134/135 vẫn KHÔNG tái hiện lần nào kể từ đợt 135/136 — nhưng đợt 138 không kiểm chứng thêm điều này (không chạy).
- Hệ quả cho quyết parent đợt 137 §B6 ("nếu nhiều đợt nữa 0 kẹt thì cân nhắc đóng điều tra dạng 'không tái hiện được'"): đợt 138 **không phải một đợt "0 kẹt"** mà là một đợt "0 lần chạy" — đừng đếm nó vào số đợt 0-kẹt khi cân nhắc đóng điều tra. Cần đợt chạy được (như 139) mới có thêm mẫu.

## B5. Yếu tố chung khác — không đổi (đợt 136 §B5 + đợt 137 §B5 vẫn đứng)

- Cùng boot? KHÔNG — 3 boot khác nhau (cc1f9de0, 8ae55060, 78b55838); đợt 137 chạy trên boot thứ tư (17db9652) không kẹt; đợt 138 **không chạy trên boot nào** (gate không mở trên cả 2 boot của lượt).
- Vite server còn sống lúc kẹt? VẪN KHÔNG CÓ BẰNG CHỨNG — cơ chế kiểm đã sẵn sàng (watchdog probe vite-HTTP + diag script), chỉ chờ kẹt thật.
- Tải từ luồng song song khác trong cửa sổ kẹt? Không có log top/ps nào trong cửa sổ kẹt cũ; đợt 138 load1 lúc đóng 0,20 (máy gần như idle sau khi các luồng đóng dần) — không so sánh được với loadavg ~0,1 lúc kẹt vì không có lần chạy nào.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- Yếu tố chung duy nhất đã chứng minh: cả ba đều là `page.evaluate` chờ trạng thái media element không trả, ngay sau một bước PASS, process idle, không verdict FAIL.
- **4 bước kiểm GIỮ NGUYÊN cho đợt sau, không cần triển khai lại:** watchdog ở trong 3 script harness (đã stage từ đợt 137), cột Balloon ở trong driver, đối chứng Chromium chạy lại mỗi đợt (N cộng dồn), diag script + baseline dmesg/journalctl chạy lại mỗi đợt. Khi có kẹt thật, watchdog + bước 4 sẽ tự kích hoạt — không cần quyết mới.
- Đề xuất nhỏ cho đợt sau (không cần quyết parent — chẩn đoán-only, nhắc lại từ đợt 137): tăng N đối chứng Chromium lên 2 lần mỗi pha nếu thời gian cho phép (cộng dồn N=1 đợt 137 → N=3 sau 2 đợt chạy được), để baseline Chromium dày hơn trước khi kết luận gì về H3.

## B7. Bằng chứng mới từ đợt 138 — KHÔNG CÓ (0 lần chạy)

- Không có lần chạy pass nào để đo RAM/balloon như §B7 đợt 136/137. Các mốc RAM rời rạc đợt này (avail 458 MB lúc mở → 1.822 MB sau reboot → ~520–560 MB kẹt ~90 phút → 469 MB lúc đóng; balloon 5,0–6,4 GB) **không phải số liệu trong lúc chạy harness** — không dùng để kiểm H2 (H2 chỉ nói về tụt RAM *trong lúc kẹt/chạy*). Ghi lại đây chỉ để đợt sau đối chiếu điều kiện RAM lúc gate không mở.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round138-t8-viteharness.txt` — **1 file** (chỉ LIMITS này), đã verify read-back bằng `od -c` (NUL-delimited), 0 binary. Không sửa code app, không đổi script harness nên không có file nào khác trong batch. Dữ liệu thô: `hidden_files/round138-t8/` (wait-t4-t5-138t8.sh — deadline gõ tay 13:30Z, fallback POSTBOOT_PASS đợt 137; run-webkit-138t8.sh — Balloon + Chromium + diag-khi-124, CHƯA CHẠY; run-webkit-138t8-retry84l10.sh — đã adapt, KHÔNG dùng; rebuild-fixtures-138t8.sh — KHÔNG dùng (không có gate); diag-stall-138t8.sh — smoke-test tay OK 11:40:38Z; smoke/wait-t4-t5.log — WAIT-DEADLINE poll 98 13:30:50Z (boot mới) + wait-t4-t5-boot17db9652.log (log waiter boot cũ, poll 1–13) + waiter-nohup-boot914964c3.out + waiter.pid (1903); smoke/tree-md5-open.txt + tree-md5-final.txt — đều 530e10a7; smoke/stall-smoke-test-1795002038/ (smoke-test tay, KHÔNG phải kẹt thật — 10 file, dmesg EPERM + journalctl rỗng)). Fixture `/tmp` hiện TRỐNG (mất theo reboot, chưa rebuild — đợt sau rebuild lại sau gate).

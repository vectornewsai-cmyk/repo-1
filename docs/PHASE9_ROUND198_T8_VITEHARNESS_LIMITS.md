# Đợt 198 T8 — V5 WALL-CLOCK BẮT SỐNG KẸT #31 (84l10 W1-lần3, 0 DÒNG HB128); HARNESS 5/6 TRÊN #127; REBOOT #127 GIỮA ĐỢT; GATE CHẠY THEO THỰC CHẤT (T4 .done CHẬM)

Ngày: 27/11/2026 (lượt cron 03:35:51 +07 = 20:35:51Z 26/11 mở đợt 198; T8 mở ~23:57Z 26/11, đóng ~02:15Z 27/11 — QUÁ hạn cờ ~02:00Z do reboot #127 + apt repair T56 kéo dài, TRONG hạn cứng 02:35:51Z).
Phạm vi: (1) V5 (f''''') trigger đồng hồ treo vào check-fresh — parent DUYỆT ở (j)-197, kiểm chứng replay 0 FP TRƯỚC khi bật live; (2) harness trên boot mới nhất #127; (3) B1/B2 live; (4) V2/V4/V5 replay; (5) O8 — KHÔNG CHẠY (T01 đã chạy 3/3 trên #126, không chạy lại trên #127 — xem §A).
**Nguồn đứng:** §14.2 aggregate 197 **BẢN PARENT THẬT = mục dòng 162 ("lượt cron 06:35 +07 27/11/2026 — SẠCH... KHÔI PHỤC NGUYÊN VĂN sau khi bị xóa lúc ~23:56Z")**, aggregate hiện 48.767 B / 196 dòng (T8 tự đọc đĩa 02:13Z). Mục dòng 134 ("lượt handoff 06:39 +07") là **MẠO DANH** — KHÔNG dùng (sai (r) "replay #124/#125"; đúng là replay #125/#126 theo (k) + (r) bản thật). Ghi chú nguồn gốc KHÔI PHỤC ở dòng 160 giải thích đầy đủ + bằng chứng tool (script thật /tmp/count-197-check.py + .sh, parent tạo + chạy 23:43Z; /tmp/count-197-recheck.py xuất hiện 23:46Z, parent chưa từng tạo; parent spawn 11 luồng đợt 198 trong lượt cron 06:35). **ĐÍNH CHÍNH LỖI CỦA T8:** bản nháp đầu LIMITS này ghi ngược nguồn (theo F-198-T56-8 lỗi thời của T56-198 — T56 đọc aggregate lúc 37.953 B sau khi §14.2 thật bị xóa ~23:56Z, trước khi parent khôi phục ~01:01Z); đã sửa theo đĩa hiện tại + nhật ký ngày. Nội dung quyết (j)/(r)/(e)/(c) không đổi — hai bản chỉ khác (r)/(q). Các mốc parent dùng: (j) V4 GIỮ LIVE, V2 phương án chính, 84l10 chuỗi 4 → 5, 86n2-P1 17 → 18, B2 vùng mới sạch lần 11, log sạch 41 → 42, **DUYỆT bổ sung trigger đồng hồ treo vào check-fresh (giao T8-198; điều kiện: kiểm chứng 0 FP trên corpus replay 42 log sạch trước khi bật live)**; (r) T8-198: B1 trigger đồng hồ treo (F-197-T8-3); (e) #124/#125 XÁC NHẬN, marker 75 → 77, #126 ỨNG VIÊN; (c) POSTBOOT #125 CÓ caveat (b1), #124 KHÔNG CÓ (30 → 31), #126 CHƯA CÓ (T56-198).

## 0. Kết luận ngắn — V5 BẮT SỐNG KẸT MỚI #31; HARNESS 5/6; 84l10 ĐỨT CHUỖI

- **HAI BOOT trong phiên: #126 `ba8ad21e` (btime 22:32:41Z) CHẾT 00:34:26Z (sống 7.305 s); #127 `6882f9a9` (btime 00:34:26Z 27/11) — ỨNG VIÊN, T01-198 xác minh.** POSTBOOT_PASS #126 CÓ 00:22:08Z (T56, poll=1, repair) + #127 CÓ 01:00:06Z (T56, poll=1, repair) — cả hai yếu hơn #123 (poll=0, replay đầy đủ); replay #125/#126/#127 KHÔNG CÓ replay đầy đủ (repair thay thế — T56-198).
- **V5 (f''''') WALL-CLOCK — BẮT SỐNG KẸT #31 LẦN ĐẦU TIÊN B1 BẮT ĐƯỢC KẸT MÙ LIVE.** WebKit 84l10 W1-lần3 đóng băng (evaluate chết, probe TIMEOUT): V5 trigger live 01:33:38Z (silence=125 s, last_ts 01:31:32.511Z) + diag lần 2/2 01:37:40Z (silence=367 s) — sớm hơn timeout 124 (~01:44:37Z) ~11 phút và sớm hơn V4-live ~664 s (V4-live chỉ thấy gap khi dòng mới khép lại 01:44:37Z). **Đây là kẹt đầu tiên B1 bắt được live kể từ khi V4 bật live đợt 194 — và là kẹt đầu tiên thuộc lớp "0 dòng HB128" mà chỉ V5 mới bắt được live.**
- **HARNESS #127 (01:29:33–01:59:07Z): WebKit 84l10 KẸT #31 (exit 124); WebKit 85m4 PASS; WebKit 86n2 PASS; Chromium 3/3 PASS. 5/6 — KHÔNG 6/6.**
- **84l10 KẸT — chuỗi PASS 5 → 0** (đứt sau 5 đợt PASS liên tiếp 193–197; kẹt 84l10 đầu tiên kể từ #28 đợt 192). **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 01:47:58Z trên WebKit #127 → chuỗi 18 → 19.**
- **V2+V4+V5 = 11/11 kẹt, 0 FP trên 44 log sạch duy nhất** (42 → 44: +198-sach-85m4 +198-sach-86n2-hb128). V2 6/6 + V4 5/5 (179/180/192/197/198) + V5 5/5 (cùng 5 kẹt mù, detect sớm hơn V4-live 598–673 s).
- **B2 vùng mới sạch lần 12** (11 → 12); **B2 dữ kiện thứ 10 (T4-198): W1 0 spike / W2 5 spike, ĐỀU TỰ-TẢI — B2 KHÔNG TÁCH vẫn đứng** (đề xuất).
- **T4-198: lượt yên #66 CÓ LƯỢT HỢP LỆ (attempt2 20/20 + B 5/5, median 55,0 ms — chuỗi 1 → 2); live-check #17 KHÔNG ĐẠT (5 spike B2 trong W2 — chuỗi live ĐẠT 1 → 0).**
- **O8 T01-198 3/3 PASS trên #126 (21/21 ×3, 00:12:19–00:16:30Z) — #126 chết sau đó; T01 KHÔNG chạy lại O8 trên #127 (tiền lệ 196). Chân FULL PASS O8: T10/parent quyết tính trên #126 hay cần chạy lại trên #127.**
- **T8 0 vi phạm** (gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn attempt T4; vite nối tiếp; lock trống trước khi chạy).

## 1. Dòng thời gian (gọn)

- 22:32:41Z **#126** (ba8ad21e). 20:35:51Z 26/11 Đợt 198 mở (run 205). 23:57Z T8 mở (đọc aggregate 197 + LIMITS T8-197). 00:02:26Z T56-198 mở + survey #126. 00:09:20Z watcher-198 L1 START pid 208790. 00:10Z T4 poller instance 1 khởi động. 00:12:19–00:16:30Z O8 T01 3/3 PASS trên #126. 00:22:08Z **POSTBOOT_PASS #126 CÓ** (T56, poll=1). 00:22:19Z Waiter T8 khởi động (deadline 01:30Z).
- **00:34:26Z REBOOT #127 (6882f9a9)** — #126 chết sau 7.305 s; watcher-198 L1 + poller T4 instance 1 chết theo; runtime restart giết waiter T8 lần 1 (poll 13, 00:34:21Z — không poll tiếp). 00:36:21Z Waiter T8 KHỞI ĐỘNG LẠI (append, không truncate — F-192-T8-1; boot mới 6882f9a9). 00:36:38Z T4 poller instance 2 khởi động. 00:38:46Z **watcher-198 L2 START pid 10882**. 00:49:47Z EARLY-REPAIR TRIGGER #127 → apt-get update (~10 phút, KHÔNG timeout) → install 11 gói 00:58Z. **01:00:06Z POSTBOOT_PASS #127 CÓ** (T56, poll=1). 01:01:29Z T4 attempt1 (CUA YEN MO; 13/20 PAGE-WEDGED, exit 2 — KHÔNG HỢP LỆ). 01:04:36–01:08:09Z T4 attempt2 20/20 + B 5/5 — **LUOT HOP LE**, poller thoát 01:08:30Z. 01:17:19Z Selfcheck #2 của T8 (libs 6/6 CÓ). 01:24:53Z T4 LIMITS (25.508 B). 01:29:33Z **HARNESS BẮT ĐẦU (gate thực chất — xem §1b)**. 01:31:02Z WATCHDOG-137 (84l10 W1-lần3); 01:31:32Z probe TIMEOUT; **01:33:38Z V5 BẮT SỐNG #31 (lan 1/2)**; 01:37:40Z V5 diag lan 2/2; 01:44:43Z **TIMEOUT 124 — KẸT #31**. 01:44:58–01:47:09Z 85m4 PASS; 01:47:24–01:51:26Z 86n2 PASS; 01:51:41–01:59:07Z Chromium 3/3 PASS. **01:59:07Z ALL DONE. T8 đóng ~02:15Z, TRONG hạn cứng 02:35:51Z.**

## 1b. Gate — waiter HẾT HẠN FILE, HARNESS CHẠY THEO GATE THỰC CHẤT (ghi rõ để T10/parent xét)

- Waiter (wait-t4-t5-198t8.sh): 67 polls, **GATE-FOUND: KHÔNG — WAIT-DEADLINE 01:30Z poll=55** (file-based: t4=.done VẮNG lúc hết hạn). Postboot=1 trên 43 dòng poll (từ poll 25, 01:00:24Z).
- T4 .done VẮNG tới 01:29Z dù T4 LIMITS đã lên 01:24:53Z (T4 viết LIMITS trước, .done sau — .done chỉ xuất hiện LÚC HARNESS ĐANG CHẠY, mtime kiểm sau: xem §6). T8 chạy harness 01:29:33Z theo **gate thực chất** (ghi vào smoke/harness-gate-note.txt TRƯỚC khi chạy):
  - (i) T4 LIMITS (25.508 B, 01:24:53Z — file của chính T4): attempt2 20/20 + lớp B 5/5 + tickCost median 55,0 ms — LUOT HOP LE; poller thoát 01:08:30Z exit 0; 0 attempt đang chạy lúc reboot #127; 0 reboot trong phiên đo instance 2.
  - (ii) POSTBOOT_PASS #127 CÓ 01:00:06Z (T56, poll=1, repair-som-quyet-h, dpkg 777).
  - (iii) Lock vite-lock-v2 TRỐNG (kiểm liên tục; driver gate-check "T4 khong giu lock" 6/6 lần trước mỗi pha — 0 chồng lấn).
  - Thủ tục (i)-143 cho phép chạy sau waiter hết hạn khi T4 0 attempt live — lúc 01:29:33Z T4 đã 0 attempt live được 21 phút (poller thoát 01:08:30Z). T8 KHÔNG chạy trong lúc T4 đo. Rủi ro còn lại duy nhất: .done chưa có lúc chạy — đã được bù bằng LIMITS T4 + .done xuất hiện sau (xem §6).

## A. O8 — T01 3/3 TRÊN #126; T8 KHÔNG CHẠY O8; HARNESS KHÔNG 6/6

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #126 | **21/21 PASS** — exit=0, S1 PASS, launched 27.2, JSON md5 9806bdc4 (00:12:19Z–) |
| 2 | O8 T01 WebKit attempt2 trên #126 | **21/21 PASS** — exit=0, JSON md5 de9e86db |
| 3 | O8 T01 Chromium trên #126 | **21/21 PASS** — exit=0, JSON md5 cebae713 (00:16:30Z) |
| 4 | O8 trên #127 | **CHƯA CHẠY** — T01 KHÔNG chạy lại (tiền lệ đợt 196: O8 trên #123 PASS được giữ khi #124 chết; xem T01-198 §1) |
| 5 | O8 T8 (bộ thứ hai) | **KHÔNG CHẠY** — T01 đã chạy O8 trong phiên (brief: chạy bộ thứ hai nếu T01 chưa chạy; không chạy trùng) |

- O8 3/3 bộ CÙNG CÂY (preview.tsx af6c3cc7 + media.ts ac89aeb2 — cây TRƯỚC khi P-threads đổi preview.tsx sang 477a0eac lúc ~00:40Z; xem §5). 0 lỗi exit 127. **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây": T01 ghi ĐẠT đợt này (3/3 bộ pass)** — lần đầu kể từ đợt 196 (đợt 197 chỉ 2/3). **NHƯNG boot O8 (#126) đã chết trước khi harness chạy (#127)** — chân này tính trên #126 hay cần chạy lại O8 trên #127 thuộc T10/parent quyết (T01-198 nêu câu hỏi ở §1).
- **FULL PASS: KHÔNG CÓ** (chân harness kẹt #31 — bất kể chân O8 quyết thế nào; chuỗi full pass GIỮ 0).

## 2. Kết quả harness — 5/6 TRÊN 1 BOOT (#127) — 1 KẸT MỚI #31

### 2a. Boot #127 (01:29:33–01:59:07Z) — WebKit 2/3 (1 KẸT + 2 PASS), Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 124 | 01:29:37–01:44:43 | **KẸT W1-lần3 — KẸT #31** — W1-lần1 PASS 01:29:52Z, W1-lần2 PASS 01:29:56Z, W1b 01:29:59Z, W1-lần3 sync 01:30:00Z rồi đóng băng; WATCHDOG-137 01:31:02Z (forceOnce:365) + probe TIMEOUT 01:31:32Z; **V5 BẮT SỐNG 01:33:38Z (125 s) + diag 01:37:40Z (367 s)**; timeout 124 01:44:43Z; report ok=False |
| 2 | WebKit 85m4 | 0 | 01:44:58–01:47:09 | **PASS** — P1 PASS 01:45:32Z + P5 PASS 01:47:08Z, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 01:47:24–01:51:26 | **PASS** — **P1 PASS 01:47:58Z (DỮ KIỆN MỚI — chuỗi 86n2-P1 18 → 19)** + P5 PASS 01:49:33Z + P6 KHÔNG-KẸT 01:51:15Z, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 01:51:41–01:52:42 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 01:52:57–01:55:10 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 01:55:25–01:59:07 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn 30 → 31 (1 kẹt mới). 84l10 PASS — chuỗi 5 → 0. 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 18 → 19.**
- RAM sampler #127 (n=60, suốt harness): balloon min 4.315.148 / max **5.585.764 kB (86,7% trần)**, mean 4.948.990, pinned=0; avail min **305 MB (01:40:34Z, trong lúc kẹt #31)** / max 1630 MB. Nhẹ hơn đợt 197 trên #125 (91,6%, avail min 247 MB) nhưng avail min 305 MB vẫn là mức căng thứ hai từng ghi trong lúc kẹt.
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" (load5 0,88–2,36) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 01:08:30Z; T4 .done xuất hiện lúc harness đang chạy — xem §6). **T8 0 vi phạm.**
- **ALL DONE 01:59:07Z ghi đúng `ec webkit: 84l10=124 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0`** — fix ec=-1 kiểm chứng lại trên harness thật (lần 2 liên tiếp; xem §C1).

## C. B1/B2 live + V2/V4/V5 replay

### C1. Script md5 (đổi nhãn 198t8 — V5 MỚI trong check-fresh + driver; còn lại chỉ đổi nhãn)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-198t8.py | 09abcb82 | 15.246 | **MỚI: nhánh V5 (f''''') wall-clock + --now/--until (replay); V2/V4 không đổi logic** |
| diag-stall-198t8.sh | 9da7f66e | 2.292 | đổi nhãn |
| extract-198t8.py | ae771f4f | 7.913 | đổi nhãn + sửa archive-198-* + boot #126 |
| wait-t4-t5-198t8.sh | ea79421e | 3.948 | đổi nhãn + deadline 01:30Z 27/11 |
| run-webkit-198t8.sh | e1d48d6f | 13.980 | **VÁ: check-fresh chạy TRƯỚC mỗi poll, ghi mọi TRIGGER (1 lần/via); mtime chỉ còn fallback** |
| run-chromium-198t8.sh | 017bdd7a | 13.486 | như run-webkit (run_one GIỐNG HỆT — diff 0 dòng) |
| replay-1c-198t8.py | 883a36b4 | 21.552 | đổi nhãn + thêm entry 198 (KHÔNG đổi entry cũ) |
| replay-f-fix-198t8.py | 1353f4a4 | 19.722 | như replay-1c + **SỬA bộ đếm tóm tắt (F-197-T8-5: mẫu số tính động, không cứng 5/3/8)** |
| replay-wallclock-198t8.py | c55d55ea | 11.677 | **MỚI — kiểm chứng V5 trên corpus (mô phỏng poll live + tail summary-end)** |
| launch-test-webkit-198t8.mjs | 429461c6 | ~1.100 | đổi nhãn |
| run-diag-84l10-w2setup-198t8.sh | 99ae2865 | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196/197 |
| selfcheck-postboot-198t8.sh | 7472cce3 | 2.299 | đổi nhãn; nhãn echo T8-198 |
| rebuild-fixtures-198t8.sh | ff4741e6 | 2.810 | đổi nhãn |
| verify-163-198t8.py | ec8a7078 | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-198t8.sh | 218caadc | 6.660 | đổi nhãn — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-198t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196/197 (**VƯỢT trần push** — file cũ, không đổi) |
| symlink `t8-diag-stall.sh` | — | — | **ĐÃ SỬA** về diag-stall-198t8.sh ở cả 2 nơi (repo scripts + hidden-root) |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 197** (md5 khớp).
- Báo cáo JSON ok=true (chỉ trích số 198): `l10-scratch-chromium` finishedAt 01:52:39Z; `m4-scratch-chromium` 01:55:04Z; `n2-hb128-scratch-chromium` 01:59:06Z; `m4-scratch` webkit 01:47:09Z; `n2-hb128-scratch` webkit 01:51:17Z. `l10-scratch` webkit ok=False finishedAt 01:44:37Z (kẹt #31). **KHÔNG có báo cáo stale** (scratch mới hoàn toàn đợt này — không copy từ đợt trước).

### C2. Offline B2 — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–197, ĐẠT

| Case | Log tổng hợp (đợt 186) | Kết quả (check-fresh-198t8.py, --now/--until=last_ts — V5 silence=0) |
|---|---|---|
| B2-1 setup | planb-b2-setup-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-2 startPlaying | planb-b2-startplaying-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-3 P6-wait-wd | planb-b2-p6wait-150s-wd.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=wd) |
| B2-4 P6-nowd | planb-b2-p6wait-150s-nowd.log | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | planb-b2-p6-clean-90s.log | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | planb-b2-setup-clean-60s.log | **KHÔNG kích hoạt** (maxspan=55 s) |

- Đối chiếu check-fresh-197t8.py (không --now) trên cùng 6 log: **KHỚP TỪNG DÒNG** — V2 không đổi.

### C3. Live — V5 BẮT SỐNG #31; B2 vùng mới 0 trigger; V2/V4 im lặng đúng chỗ

| Pha | HB128 (dòng) | Kết quả check-fresh live |
|---|---|---|
| #127 WebKit 84l10 (**KẸT #31**) | 0 | **V5 TRIGGER wallclock silence=125 s 01:33:38Z (lan 1/2) + 367 s 01:37:40Z (lan 2/2)** — xem F-198-T8-1 |
| #127 WebKit 85m4 | 19 | OK (maxspan=5 s, wd=0, maxgap=8 s) |
| #127 WebKit 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=7 s; P6-wait 5→90 s, biên 35 s, không FP) |
| #127 Chromium 84l10 | 5 | OK (maxspan=0 s, wd=0, maxgap=7 s) |
| #127 Chromium 85m4 | 19 | OK (maxspan=10 s, wd=0, maxgap=10 s) |
| #127 Chromium 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=7 s; P6-wait 5→90 s, không FP) |

- **B1 live: BẮT ĐƯỢC kẹt #31 — lần đầu B1 bắt được kẹt mù live** (V5; V2/V4 đều không thể bắt ca này live: 0 dòng HB128 nên V2 không có run; V4 chỉ thấy gap khi log khép). **Chuỗi live sạch: kẹt #31 làm đợt này KHÔNG sạch — chuỗi GIỮ 0** (quy tắc chuỗi theo đợt như (j)-195/(j)-196/(j)-197).
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 6 pha → B2 vùng mới sạch lần 12 (11 → 12).**
- LIVE-DIAG-189 (nhánh mtime): **0 lần** đợt này — V5/check-fresh chạy trước mỗi poll nên đã bắt trước; nhánh mtime chỉ còn fallback (không kích hoạt lần nào — đúng thiết kế).
- Diag live: WATCHDOG trong-script 01:31:02Z (forceOnce:365) + 2× FRESH-CONTENT-189 (V5) + diag sau timeout-124 (bước 4). Tổng 4 thư mục stall.

### C4. Replay — V2 6/6 + V4 5/5 + V5 5/5 = V2+V4+V5 11/11, 0 FP trên 44 log sạch

| Kiểm tra | 198-sach-85m4 (md5 535c01d7) | 198-sach-86n2-hb128 (md5 25b52cfb) | 198-ket-84l10 (md5 7c3bbfc9) | Cộng dồn |
|---|---|---|---|---|
| Replay-1c (c') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt (0 dòng HB128) | (c') KHÔNG ĐỔI so với 197: kẹt-164 TRIGGER @125 s, lỡ 171 + 179 (đã biết, đã ghi); 0 FP trên log sạch; 198-ket cũng lỡ (c') vì 0 dòng HB128 — đúng lớp kẹt V2/V4/V5 phải bắt |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (f') ĐẠT trên tiêu chí 2 kẹt (164@125 s + 171@185/305/605 s), 0 FP |
| Replay-f-fix (f'') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt (0 dòng HB128) | **V2 (f'') 6/6 trong lớp HB128** |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=8 s) | KHÔNG kích hoạt (gap=7 s) | **TRIGGER gap=784 s** (detect_at 01:33:32Z) | **V4 5/5 kẹt mù** (179/180/192/197/198) |
| Replay-wallclock V5 (f''''') | KHÔNG kích hoạt | KHÔNG kích hoạt | **TRIGGER gap=784 s, detect_at ~01:33:32Z** (live thật 01:33:38Z — poll đầu tiên sau +120 s, +6 s do hạt poll 10 s) | **V5 5/5 kẹt mù** (179/180/192/197/198) |

- **Số log sạch chuẩn (md5-unique): 42 → 44** (46 entry sạch, 44 unique; 198-sach-85m4 md5 535c01d7 + 198-sach-86n2-hb128 md5 25b52cfb đều duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 57 entry = 46 sạch + 11 kẹt).
- **Hồi quy V2/V4: check-fresh-198t8.py vs 197t8.py KHỚP HET trên 57 log** (--now/--until=last_ts; V5 silence=0).

### C5. V5 (f''''') — THIẾT KẾ + KIỂM CHỨNG TRƯỚC LIVE + BẮT SỐNG #31

**Thiết kế (quyết (j)-197):** trigger khi im lặng MỞ (trailing silence) `now - dòng timestamp CUỐI CÙNG >= 120 s` (cùng ngưỡng V2/V4), chỉ đánh giá khi process pha còn sống (driver chỉ gọi check-fresh trong vòng poll `while kill -0 node_pid`). Khác V4: V4 chỉ thấy gap ĐÃ KHÉP (hai dòng liên tiếp); V5 thấy im lặng ĐANG DIỄN RA — bắt được kẹt "HB128 ngừng + không dòng mới nào khép gap" (lớp #30/#31) ngay lúc đủ 120 s thay vì chờ log khép sau timeout. V5 bổ sung, không thay thế V2 (V2 vẫn là phương án chính trong lớp HB128); V4 GIỮ LIVE. Giới hạn còn lại: log 0 dòng timestamp thì V5 không đo được (như V4) — nhánh mtime LIVE-DIAG-189 trong driver vẫn là fallback.

**Kiểm chứng TRƯỚC khi bật live (replay-wallclock-198t8.py, chạy trước harness — điều kiện (j)-197 ĐÃ ĐỦ):**
- V5 bắt 4/4 kẹt mù cũ (179 gap 723 s, 180 gap 718 s, 192 gap 793 s, 197 gap 760 s) tại gap_start+120 s — sớm hơn V4-live 598–673 s.
- V5 KHÔNG fire trên 6/6 kẹt lớp V2 (HB128 vẫn chảy trong lúc kẹt).
- 0 FP trên 42 log sạch duy nhất (max gap trong-log sạch 97 s — biên 22 s; max tail summary-end−last_ts 9,8 s — biên 110,2 s).
- Hai cạm bẫy đã bắt khi viết replay (xem F-198-T8-2/F-198-T8-3): tail mtime bịa FP trên 2 log 182 (bản copy y hệt 181, mtime lệch ~2h12m) → đổi sang tail summary-end; lỗi ghép ngày +1 ngày khi end trùng giây với last_ts (lệch <1 s) → chỉ cộng ngày khi lệch âm >3600 s.
- Sau harness: corpus +198 (1 kẹt + 2 sạch) → **V5 5/5 kẹt mù, 0 FP trên 44 log sạch duy nhất**; V2/V4 hồi quy 57/57 khớp.

**Bắt sống #31:** V5 trigger live 01:33:38Z (silence=125 s, last_ts 01:31:32.511Z, hb128=0) — poll đầu tiên sau gap_start+120 s (01:33:32Z; +6 s do hạt poll 10 s) — + diag lần 2/2 01:37:40Z (silence=367 s). V4 trên log đóng cho cùng gap detect_at 01:33:32Z — nhưng live V4 không thể thấy gap trước 01:44:37Z (lúc dòng cuối khép gap); **V5 sớm hơn V4-live 664 s, sớm hơn timeout 124 ~664 s**. Đây là kẹt đầu tiên có **0 dòng HB128 toàn log pha** mà B1 bắt được live (mọi kẹt mù trước đều có ≥7 dòng HB128 ngoài lúc kẹt).

## D. Điều tra 84l10 đợt 22 + KẸT #31 (84l10 W1-lần3)

- **D1 (84l10 ×2 lần chạy):** WebKit #127 KẸT (W1-lần1 PASS 01:29:52Z, W1-lần2 PASS 01:29:56Z, W1b 01:29:59Z, W1-lần3 sync 01:30:00Z rồi đóng băng; 0 lỗi; 0 GStreamer-WARNING; 0 dòng HB128 toàn log). Chromium #127 PASS (W1 ×3 + W2 + E4). **84l10 PASS — chuỗi 5 → 0 (mốc parent (j)-197: chuỗi 4 → 5).** 84l10 không còn là pha ổn định nhất (5/5 PASS 193–197 rồi kẹt; kẹt 84l10 đầu tiên kể từ #28 đợt 192).
- **D2 (kẹt 84l10 — 2/22 ≈ 9%):** 84l10 kẹt các đợt 192 (#28, W2-setup) và 198 (#31, W1-lần3). Kẹt #31 khác #30 ở điểm: **0 dòng HB128 toàn log** (84l10 không log HB128 — W1 dùng forceOnce, không phải hb128) — V2/V4 đều mù live; chỉ V5 + WATCHDOG-137 bắt được live. #31 là kẹt mù THUẦN TÚY nhất từ trước (không có lấy một dòng heartbeat để bám).
- **D3 (bằng chứng đã lưu):** `smoke/` — run-webkit-84l10.log (md5 7c3bbfc9), run-webkit-85m4.log (md5 535c01d7), run-webkit-86n2-hb128.log (md5 25b52cfb), 3 log chromium, ram-198t8.log (n=60), run-webkit-summary.txt, 4 thư mục stall (`stall-forceOnce_365-1795743062`, `stall-freshcontent-webkit-84l10-1795743218`, `stall-freshcontent-webkit-84l10-1795743460`, `stall-webkit-84l10-timeout124-1795743883`). Log kẹt: 13 dòng; cuối log elapsed không có (timeout).
- **D4 (so #30):** #30 là 85m4 P2-lần1 @125 s, HB128 ngừng sau 15 s (7 dòng), (f'''') bắt được ở replay. #31 là 84l10 W1-lần3, **0 dòng HB128 toàn log**, (f'''') chỉ bắt được ở replay (gap 784 s), V5 bắt được LIVE. Hai ca kẹt khác pha, khác chữ ký — không có mẫu kẹt lặp cùng call-site 2 đợt liên tiếp (P2 → W1-lần3).

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (kẹt #31 đúng chữ ký H3, biến thể 0-HB128)

- Chữ ký kẹt #31: W1-lần3 sync xong 01:30:00Z rồi im lặng; evaluate im lặng >60 s (WATCHDOG-137 01:31:02Z, forceOnce:365); probe 1+1 TIMEOUT 30 s 01:31:32Z (kênh evaluate kẹt cứng / page JS chết); **vite HTTP 200** lúc diag V5 (01:33:38Z — vite sống, kẹt ở page/renderer, không phải vite); MiniBrowser sống (RSS ~200 MB), WebKitWebProcess sống (RSS ~288 MB lúc diag); balloon 81,4% → 86,7% lúc kẹt (cao nhưng không OOM — avail còn 556 MB lúc diag #1, 305 MB lúc sampler min); load 0,19–0,71 lúc kẹt (không bão CPU).
- Không phải H1 (máy đo yên — T4 đã đóng, poller thoát 01:08:30Z), không phải H2 (ENOSPC — dpkg 777 dòng ổn định trong lúc kẹt, không có lỗi inotify mới trong diag), không phải thiếu scanner (xem §C6). **H3 là giải thích duy nhất khớp toàn bộ chữ ký.**

### C6. Debroot — WebKit chạy được nhờ libs debroot + libs hệ thống MỚI (đợt này cả hai)

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" đã bị bác đợt 196 (kẹt #29 xảy ra với gst-inspect CÓ).
- **Dữ kiện đợt 198:** T56 cài apt xong trên #127 (libs hệ thống 6/6 CÓ lúc selfcheck #2 01:17:19Z; libgst* 79; dpkg 777) + symlink GST → debroot (269 file). Driver T8 vẫn vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit (F-197-T8-1, giữ nguyên); launch-test headed PASS trên #127 (27.2, 1+1=2, +5,6 s — nhanh hơn #126: +8,8 s). Cùng điều kiện scanner vắng (gst-inspect + gst-plugin-scanner VẮNG): 84l10 KẸT #31 + 85m4 PASS + 86n2 PASS + Chromium 3/3 PASS. **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 3).**
- **Debroot vẫn là đường dự phòng:** `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin). Trên #127 libs hệ thống đã đủ nên WebKit chạy được cả hai đường; driver giữ debroot để phòng cell mới thiếu libs (F-197-T8-1).

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 198 (T10 quyết)

- (a) Harness: WebKit 84l10 KẸT #31 + 85m4 PASS + 86n2 PASS trên #127; Chromium 3/3 PASS trên #127; **5/6 — KHÔNG 6/6.**
- (b) FULL PASS: **KHÔNG CÓ** (chân harness kẹt #31; chân O8 3/3 trên #126 đã chết — T10/parent quyết tính hay chạy lại; chuỗi full pass GIỮ 0).
- (j) **V5 BẮT SỐNG #31 live (lần đầu B1 bắt được kẹt mù live)**; 84l10 KẸT — chuỗi 5 → 0; **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS → chuỗi 18 → 19**; B2 vùng mới sạch lần 11 → 12; B1 live sạch GIỮ 0 (đợt có kẹt); **V2+V4+V5 = 11/11, 0 FP trên 44 log sạch**; V2 VẪN là phương án chính (6/6 lớp HB128); V4 GIỮ LIVE (5/5); **V5 GIỮ LIVE (đề xuất — 5/5, bắt sống #31, 0 FP)**.
- (m) Lượt yên #66: **CÓ LƯỢT HỢP LỆ** (T4-198: attempt2 hợp lệ, chuỗi 1 → 2; attempt1 13/20 PAGE-WEDGED). Live-check #17: **KHÔNG ĐẠT** (T4-198; 5 spike B2 trong W2 — chuỗi live ĐẠT 1 → 0). P3' cộng dồn MỚI 53 lượt (T4-198 .done).
- (n) Stall/outage: KẸT #31 84l10 W1-lần3 (01:30:00Z → timeout 01:44:43Z). Reboot #127 giữa đợt (00:34:26Z, gap #126→#127 = 7.305 s — T01/T2-198; phân loại thuộc T7-198 + parent). Run 204 TIMEOUT (T7-198 — CA mới, chuỗi SUCCEEDED 11 → 0); run 205 RUNNING (T7-198). Cửa slot 198 LÀNH HB 7/7 + DR 3/3 (T7-198 — chuỗi lành 0 → 1 nếu parent chấp nhận). T7-198 xác minh stall/outage đợt này — T8 chỉ cung cấp kẹt harness + reboot #127.
- (o) Auto-trigger: T9-198 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-198; trong cửa sổ T4: 0 FIRE (T4-198 §3: 4 mẫu live watch/consec=0, 0 FIRE).
- (p) Vi phạm: **T8 0 vi phạm** (gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy). Harness chạy theo gate thực chất khi T4 .done chưa có — xem §1b (T4 LIMITS đã có + poller thoát + postboot CÓ + lock trống; .done xuất hiện lúc harness đang chạy).
- (E-247) MỞ LẠI đợt 197 — không có dữ kiện mới đợt này từ T8 (T9-198 chưa đóng; xem LIMITS T9-198).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-198t8.sh, md5 99ae2865, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 PASS W2? — KHÔNG: kẹt #31 thuộc W1-lần3/forceOnce, không phải W2; đã có diag live ×2 (V5) + WATCHDOG + probe TIMEOUT + diag sau timeout). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~02:02Z)

- preview.tsx `477a0eac` (ĐỔI so với đợt 197 af6c3cc7 — P-threads sửa trong đợt 198, T4 poll #6 ghi MD5-KHAC lúc ~00:40Z); media.ts `ac89aeb2` (không đổi); vite.config.ts `ee80d093` (không đổi). **Harness #127 cùng cây 477a0eac/ac89aeb2/ee80d093. O8 T01 chạy cây CŨ af6c3cc7 (trước khi preview.tsx đổi) — khác cây harness (xem §A).**
- Fixture rebuild 2 lần (00:20Z trên #126 — MẤT theo reboot #127; 01:16:54Z trên #127): md5 khớp đợt 125 cả 4 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã mất theo reboot #127 — đã rebuild xong trước harness. baseline-meminfo.txt ghi được (smoke mới).

## 6. Dọn dẹp + kiểm cuối (extract-198t8.py, chạy 02:02Z)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 2 (X193 + X197 — của luồng khác, để nguyên; X199 socket của T8 đã dọn).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-198t8.sh.
- Lock vite-lock-v2: TRỐNG (0 ticket + 89 cooldown).
- Vite: không còn vite nào của T8 chạy (driver đã exit sạch 01:59:07Z). Chrome/Chromium: 0 process T8 còn lại.
- **T4 .done ĐÃ CÓ lúc T8 đóng** (mtime 01:38:17Z — xuất hiện lúc harness đang chạy, 01:29:33–01:59:07Z; nội dung khớp LIMITS T4: #66 hợp lệ, chuỗi 1 → 2, live-check #17 KHÔNG ĐẠT, P3' cộng dồn 53 lượt, md5 sổ c8792589).
- Bằng chứng #31 giữ nguyên trong smoke/ (6 log pha + 4 thư mục stall + ram log + summary + replay .out).

## 7. Giới hạn

- Harness KHÔNG 6/6 trên 1 boot: WebKit 84l10 kẹt #31 (exit 124, pha chưa hoàn thành).
- O8 T8 KHÔNG CHẠY (T01 đã chạy; không trùng). O8 T01 3/3 trên #126 đã chết — chân FULL PASS O8 thuộc T10/parent quyết.
- T8 đóng QUÁ hạn cờ (~02:15Z vs ~02:00Z) — do reboot #127 + apt repair T56 kéo dài (gate 01:29:33Z thay vì ~00:30Z); TRONG hạn cứng 02:35:51Z. Waiter hết hạn file 01:30Z nhưng harness chạy theo gate thực chất (xem §1b).
- POSTBOOT_PASS #126 + #127 đều CÓ nhưng yếu hơn #123 (poll=1, repair — T56-198); #126 CHƯA được T01 xác minh 9 nguồn tươi (chết trước khi T01 survey — T01-198 chỉ survey #127).
- Sampler n=60 (chỉ suốt harness); không có sampler suốt phiên.
- Số liệu T4/T2/T01/T56/T7 trích từ LIMITS/.done của họ (đã đọc), không đo lại. T9-198 chưa đóng lúc T8 đóng — số liệu của họ (headroom, auto-trigger đợt, E-247) xem LIMITS của họ.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-198-T8-1 (V5 BẮT SỐNG KẸT #31 — B1 BẮT ĐƯỢC KẸT MÙ LIVE LẦN ĐẦU):** 84l10 W1-lần3 đóng băng 01:30:00Z, evaluate chết (WATCHDOG-137 01:31:02Z forceOnce:365 + probe TIMEOUT 01:31:32Z), 0 dòng HB128 toàn log. V5 trigger live 01:33:38Z (silence=125 s) + diag 01:37:40Z (367 s); timeout 124 01:44:43Z. V2/V4 đều không thể bắt ca này live (V2: 0 dòng HB128; V4: gap chỉ khép 01:44:37Z). V5 sớm hơn V4-live 664 s, sớm hơn timeout ~664 s. **Đề xuất: V5 GIỮ LIVE (cùng V2/V4); V2 vẫn là phương án chính.**
- **F-198-T8-2 (REPLAY-WALLCLOCK — TAIL MTIME BỊA FP TRÊN LOG COPY):** bản đầu dùng tail_mtime = mtime − last_ts, báo 2 FP giả trên 182-sach-85m4/86n2-hb128 (tail 7.910 s / 7.662 s). Nguyên nhân: 2 file 182 là bản COPY y hệt 181 (md5 khớp 166b271d/e11c62cb), mtime là lúc copy (~2h12m sau dòng cuối), không phải lúc process chết. **ĐÃ SỬA:** tail chính = summary-end − last_ts (nguồn sống: driver ghi end ngay sau khi node thoát); mtime chỉ là fallback khi không có summary. Sau sửa: 0 FP, max tail sạch 9,8 s. Bài học: mtime của file log KHÔNG phải bằng chứng hành vi live khi file có thể bị copy sau đó.
- **F-198-T8-3 (REPLAY-WALLCLOCK — LỖI GHÉP NGÀY +1 NGÀY):** bản đầu cộng 1 ngày khi summary-end < last_ts, báo 3 tail ~86.399 s giả (188/191/193-sach). Nguyên nhân: summary-end tròn xuống giây nên có thể nhỏ hơn last_ts <1 s (vd end 09:31:22Z vs last_ts 09:31:22.483Z). **ĐÃ SỬA:** chỉ cộng 1 ngày khi lệch âm >3600 s. Sau sửa: max tail sạch 9,8 s. Bài học: thời gian tròn giây không so sánh được với timestamp có phần lẻ — luôn chừa biên dưới-giây.
- **F-198-T8-4 (REBOOT #127 GIỮA ĐỢT — WAITER CHẾT THEO, FIXTURE MẤT, GATE TRỄ 1 GIỜ):** reboot 00:34:26Z giết watcher-198 L1 + poller T4 instance 1 + waiter T8 lần 1 (poll 13) + fixture /tmp. Waiter khởi động lại 00:36:21Z (append, không truncate — F-192-T8-1) và bắt đúng boot mới. T56 repair #127 (apt update ~10 phút + install 11 gói) tới 01:00:06Z mới có POSTBOOT_PASS; T4 attempt2 hợp lệ 01:08:30Z; harness bắt đầu 01:29:33Z (trễ ~1 giờ so với nhịp thường). **T8 đóng quá hạn cờ nhưng trong hạn cứng — ghi nhận, không phạt (nguyên nhân ngoài T8).**
- **F-198-T8-5 (pkill -x Xvfb QUÁ RỘNG — KHÔNG HẬU QUẢ):** lúc dọn Xvfb test 01:29Z, T8 dùng `pkill -x Xvfb` (giết MỌI Xvfb, không chỉ :199). Kiểm trước/sau: chỉ có Xvfb :199 của T8 đang chạy (X193/X197 chỉ còn socket sót, không process) — không giết nhầm process luồng khác. Bài học: dọn Xvfb bằng PID (như driver làm), không pkill theo tên.
- **F-198-T8-6 (LAUNCH-TEST LỖI ĐƯỜNG DẪN DO `&` — BÀI HỌC SHELL CŨ):** lệnh `cd ... && Xvfb ... &` background CẢ chuỗi cd+Xvfb nên shell foreground không cd, node báo MODULE_NOT_FOUND (đường dẫn tương đối sai). Sửa bằng đường dẫn tuyệt đối + `;` tách lệnh (đã PASS sau đó). Cùng họ lỗi với waiter restart 00:36Z (`tail` sai cwd). Bài học: KHÔNG dùng `cmd1 && cmd2 &` khi cmd sau cần cwd của cmd trước — dùng `;` hoặc subshell `(cd ... && ...) &`.
- **F-197-T8-5 (REPLAY-F-FIX — BỘ ĐẾM TÓM TẮT LỖI THỜI — ĐÃ SỬA, ĐÓNG):** mẫu số cứng 5/3/8 → tính động từ corpus (lớp V2 = 6 kẹt, lớp V4 = 5 kẹt, tổng 11). Nay in đúng V2 6/6, V4 5/5, kết hợp 11/11. ĐÓNG.
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → nay 86,7% (nhẹ hơn #124/#125). F-196-T8-9 (baseline-meminfo EPERM) → nay ghi được (smoke mới). F-193-T8-1 (waiter reboot) → nay CÓ dữ kiện (reboot #127 giết waiter lần 1 — waiter khởi động lại append đúng quy trình; xem F-198-T8-4).

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 198)

- (j) **V5 GIỮ LIVE?** (đề xuất: GIỮ — 5/5 kẹt mù, bắt sống #31 live, 0 FP trên 44 log sạch; V2 vẫn là phương án chính 6/6; V4 GIỮ LIVE 5/5); 84l10 KẸT — chuỗi 5 → 0; **86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 18 → 19**; B2 vùng mới sạch lần 11 → 12; B1 live sạch GIỮ 0; **B2 dữ kiện thứ 10: W1 0 / W2 5 spike, đều tự-tải — KHÔNG TÁCH vẫn đứng** (T4 chỉ báo số, không tự quyết tách).
- (b) FULL PASS KHÔNG CÓ (chân harness kẹt #31; chân O8 3/3 trên #126 đã chết — T10/parent quyết tính hay chạy lại O8 trên #127; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #126 CÓ (poll=1, repair — T56-198) + #127 CÓ (poll=1, repair — T56-198); cả hai yếu hơn #123 (poll=0, replay đầy đủ). #125 CÓ caveat (b1) từ (c)-197 (không đổi).
- (e) #126: **T2-198 phân loại CUỐI: (m) #126 DƯƠNG (CUỐI, +49,058 s)** (đóng 01:11Z); **B-#126 TRUE** (chuỗi 0 → 1, chờ parent); n ứng viên 56/57. T01-198 chỉ survey #127 tươi (#126 chết trước); T56 có POSTBOOT_PASS #126. Marker 77 → 78 nếu parent xác nhận #126. #127 ỨNG VIÊN (6882f9a9, btime 00:34:26Z — T01-198 xác minh; (m) THÔ DƯƠNG +42,661 s theo T2-198, phân loại CUỐI thuộc T2-199); marker 79 nếu #127 cũng xác nhận.
- (f) **(m) #125 KHÔNG CÓ ĐIỂM (CUỐI) + (m) #126 DƯƠNG (CUỐI, +49,058 s)** — T2-198 đã phân loại CUỐI lúc đóng 01:11Z. **(m) #127 THÔ DƯƠNG (+42,661 s)** — phân loại CUỐI thuộc T2-199.
- (i) Holder: #126 KHÔNG GIẾT — chuỗi 1 → 2; #127 KHÔNG GIẾT — chuỗi 2 → 3 (T56-198). (A) 120/120 lần thứ 47; suite xanh 78 → 79; hướng (3) lần thứ 44 (T56-198).
- (m) Lượt yên #66 CÓ lượt hợp lệ (attempt2) — chuỗi 1 → 2. Live-check #17 KHÔNG ĐẠT (5 spike B2 trong W2) — chuỗi live ĐẠT 1 → 0. P3' cộng dồn MỚI 53 lượt hợp lệ (md5 sổ c8792589).
- (n) Reboot #127 giữa đợt (gap #126→#127 = 7.305 s) + run 204 TIMEOUT (CA mới, chuỗi SUCCEEDED 11 → 0 — T7-198); run 205 RUNNING (T7-198). Cửa slot 198 LÀNH HB 7/7 + DR 3/3 (T7-198 — chuỗi lành 0 → 1 nếu parent chấp nhận). Kẹt harness #31 (T8 cung cấp).
- (p) Vi phạm: **T8 0 vi phạm.** Harness chạy theo gate thực chất khi T4 .done chưa có (xem §1b — T10/parent xét có tính là vi phạm quy trình gate không; T8 cho rằng KHÔNG: T4 đã đo xong, poller thoát, postboot CÓ, lock trống, driver gate-check 6/6).
- (q) Đếm: T01-198 đếm cuối (lúc T01 đóng 00:40Z) — xem LIMITS T01-198; lũy kế/chờ push xem (q) aggregate 198 (T10 đếm toàn cục). T8 đóng góp 1 LIMITS (+ scripts).
- Chờ push 191–198 = (q)-197 (83/282/204/183) + batch đợt 198 (T10 đếm cuối).

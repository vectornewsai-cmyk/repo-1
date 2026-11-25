# Đợt 183 T8 — HARNESS 5/6: 85m4 KẸT THẬT (exit 124, P1); O8 T8 PASS 3/3; (c') BỎ LỠ KẸT-183, CHỈ V2 BẮT ĐƯỢC

Ngày: 24/11/2026 (lượt cron 12:35 +07 = 05:35:51Z; T8 mở ~05:40Z, đóng ~07:15Z — TRONG hạn cờ ~08:00Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness hb128+B1 live trên #101; (2) O8 T8 trên #101; (3) (c')/(f') + checklist (o); (4) H3 thụ động; (5) F-182-T8-6 (extract kiểm live). KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **ĐÍNH CHÍNH NGUỒN (quan trọng): brief ban đầu trích §12.3 aggregate 182 là SAI — §12.3 đã bị ĐIỀN SẴN lần thứ 16 lúc 05:27Z (tiêu đề mạo danh); parent đã đính chính aggregate lúc 05:44:21Z (nay 79.228 B). T8-183 dùng BẢN ĐÃ ĐÍNH CHÍNH (dòng 194–200, mtime 05:44:21Z): (a) CHẤP NHẬN 182; (b) chuỗi FULL PASS VỀ 0 (không phải GIỮ 1); (c) #100 KHÔNG cờ, tổng boot không cờ GIỮ 22; (q) số thứ tự đếm là 87. Mọi đánh giá chuỗi trong LIMITS này theo mốc 0.**
Nợ: LIMITS T8-182 (37.380 B); GAP §11 + §12.3 đợt 182 bản đã đính chính (parent CHẤP NHẬN (a)–(r) với 3 đính chính; (c')/(f') ĐƯỢC GIỮ; B1 chưa kiểm live — B2 VẪN HOÃN; F-178-T8-6 DỪNG; H3 chỉ giám sát; harness 182 0/6 KHÔNG ĐO ĐƯỢC; 86n2-P1 không kẹt GIỮ 6 lần; 86n2-hb128 41.785 B VƯỢT giới hạn push).

## 0. Kết luận ngắn — 5/6 PASS, 1 KẸT THẬT; O8 T8 PASS 3/3; FULL PASS GIỮ 0 (4/5 CHÂN)

- **#101 XÁC NHẬN 9 nguồn (T0-183)** — boot `51745634`, btime 05:12:27Z, gap #100→#101 = 7.400 s. **#100 XÁC NHẬN 9 nguồn từ hồ sơ lưu (T0-183, F-183-T0-1)** — boot `7a83ab15`, btime 03:09:07Z, gap #99→#100 = 7.041 s. Marker sống qua **53 reboot #49–#101**.
- **POSTBOOT_PASS #101 ĐÃ CÓ 05:56:42Z (T5-183: repair-sớm-quyết-h, poll=1, CÓ caveat — GST symlink, tools không cài)** — dpkg 768, cache 107, lists 66, GST sys 269. **Gate (a) #101: CÓ (CÓ caveat repair).** T5 repair: apt-get update 05:43Z → cài tới dpkg 768 (từ 2 dòng, đóng băng từ 05:13:08Z).
- **HARNESS 5/6 — 1 KẸT THẬT: WebKit 85m4 exit 124 (TIMEOUT 900 s, P1 waitForPlaySync; playhead=0, ct=0.468 đóng băng từ dòng HB128 đầu tiên tới elapsed 886 s; 177 dòng HB128; WATCHDOG-137 ×3; probe evaluate TIMEOUT 30 s).** Kẹt cộng dồn **25 → 26** (85m4 kẹt lần 2 sau đợt 178). WebKit 84l10 PASS + 86n2-hb128 PASS (P1 PASS — chuỗi 86n2-P1 không kẹt **6 → 7**); Chromium 3/3 PASS. **84l10 PASS → 4 đợt (179–181 + 183).**
- **O8 T8 PASS 3/3 trên #101** (07:01:42–07:04:15Z, sau cờ 65 s): WebKit 21/21 ×2 (md5 `c9616c69`/`d0a91fcb`, S1 07:01:54Z/07:02:45Z) + Chromium 21/21 (md5 `9786178a`) — JSON đếm lại bằng python (21/21 ok=true ×3). **O8 T0 PASS 3/3** (WebKit ×2 md5 `28afdad4`/`7dc8391b` + Chromium md5 `e07e6487`, 05:57:41–06:00:17Z, sau cờ 59 s — theo cờ T0-183).
- **Lượt yên #52 HỢP LỆ (T4-183 DONE 06:15:46Z)** — attempt1 20/20 + LOP B 5/5 + tickCost median 44,0 ms; **chuỗi lượt yên 44 → 45**. 0 vi phạm — chuỗi 0 vi phạm **4 → 5**.
- **FULL PASS: 4/5 chân đủ trên #101** (lượt yên ✓, gate (a) ✓, O8 T0 ✓, O8 T8 ✓; harness ✗ — 85m4 kẹt THẬT). **Chuỗi FULL PASS GIỮ 0 (đề xuất, parent quyết)** — đợt 183 KHÔNG có full pass (có FAIL thật ở chân harness, không phải chỉ không đo được như 182); mốc 0 theo quyết (b) đã đính chính.
- **(c')/(f') V1: replay C5.1 ĐẠT, 0 FP trên 16 log sạch duy nhất (18 entry có file — cặp 182-sach là bản copy của 181-sach); 183 đóng góp 1 log sạch mới (183-sach-86n2-hb128). (f') V1-300 ĐẠT. ĐIỂM MỚI: (c') BỎ LỠ kẹt-183 (lỗ hổng thứ ba sau 171/179); (f') V1-180/300/600 đều BỎ LỠ; CHỈ (f'') V2 BẮT ĐƯỢC kẹt-183 @125 s (nhờ watchdog đã kích hoạt). (c')/(f') V1 ĐƯỢC GIỮ (đề xuất) — V2 chỉ là bằng chứng mới, triển khai hay không thuộc parent.**
- **Plan B B1: live SẠCH lần thứ hai (181 + 183)** — 86n2-hb128 PASS live, 0 dòng HB bất thường, B1 chưa bắt kẹt thật. **B2 VẪN HOÃN** (mới 2 đợt live sạch; kẹt-183 ngoài phạm vi B1).
- **F-182-T8-6: extract KIỂM LIVE ĐẠT** — trích ĐÚNG số trên log 183 mới. **REBOOT #102 (F-183-T8-6): boot `6ecd948e`, btime 07:07:05Z** — sau O8 (07:04:15Z), trước khi đóng; 0 reboot trong cửa sổ đo (06:31–07:04Z); số hiệu #102 chờ T0-184/T10-183.
- **Waiter: GATE-FOUND poll=31, 06:16:44Z** (đường (a); t4=OK). **F-182-T8-1 (X193): socket X193 stale MỚI 06:04Z (không process) — quyết GIỮ, KHÔNG dọn; đã wipe theo #102 — X11 TRỐNG lúc đóng.**
- **T7/T9 CHƯA đóng cờ lúc T8 đóng (07:1xZ). 0 process sót; lock vite TRỐNG; X11 trống.**

## 1. Dòng thời gian (gọn)

- 05:12:27Z **REBOOT #101** (T0-183 XÁC MINH 9 nguồn). 05:35:51Z Đợt 183 mở. 05:40–05:46Z T8 mở: đọc LIMITS T8-182 + GAP §11 + §12.3 (bản điền sẵn — xem đầu file); md5 cây + 8 script khớp 182; copy driver 182→183 + đổi nhãn (waiter → 07:30Z, LIVE-DIAG/FRESH-CONTENT → 183, T8-183); sửa nhãn sai replay-1c (F-183-T8-8); thêm entry 183-sach vào 2 script replay; **cả hai symlink diag → round183-t8 lúc 05:45Z**; probe S1 CÓ SẴN (md5 `453d1082`); selfcheck #1: libs 5/6 thiếu, GST 0 plugin, dpkg 2; fixture /tmp VẮNG (wipe theo #100/#101 — chờ gate); mở: 0 process sót, X11 TRỐNG, lock trống.
- 05:43:03Z T5-183 watcher (pid 384639) early-repair #101 (dpkg đóng băng từ 05:13:08Z); apt-get update 05:43Z. 05:46:41Z Waiter-1 bắt đầu (deadline 07:30Z). T4 poller gate0=khong-dat, RAM 1.423→1.016 MB.
- **05:51Z Brief đính chính của parent tới** (xem đầu file). **05:56:42Z POSTBOOT_PASS #101 ĐÃ CÓ** (repair-sớm-quyết-h, poll=1, caveat; dpkg 768, cache 107, lists 66). 05:57:42Z waiter poll 12: postboot=1 lần đầu (t4=0). T0-183 O8 PASS 3/3 (05:57:41–06:00:17Z). T4 attempt1 HỢP LỆ 06:08:24Z (20/20, LOP B 5/5, median 44,0 ms).
- **06:04Z Socket X193 MỚI** (không process — F-183-T8-2). **06:15:46Z T4-183 DONE** (lượt yên #52; chuỗi 44→45; 0 vi phạm, chuỗi 4→5). **06:16:44Z GATE-FOUND poll=31** (t4=OK, postboot đường (a)).
- 06:22–06:30Z RAM thấp (avail 428–507 MB, balloon 98,7–100% trần) — T8 chờ balloon xả (thận trọng OOM; T4 đã đóng cờ nên không bị cấm). 06:30:33Z **rebuild fixture: exit 0, md5 khớp đợt 125** (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549); RAM hồi 1.094 MB avail.
- **06:30–06:59Z HARNESS (driver pid 562053, boot #101):** 84l10 PASS 06:31:01–06:32:11Z; **85m4 KẸT exit 124 06:32:26–06:47:32Z** (WATCHDOG-137 06:33:39Z + probe TIMEOUT 06:34:09Z; diag sau timeout 06:47:32Z); 86n2-hb128 PASS 06:47:47–06:51:48Z (P1 PASS); Chromium 84l10 PASS 06:52:04–06:53:04Z; 85m4 PASS 06:53:19–06:55:20Z; 86n2-hb128 PASS 06:55:35–06:59:26Z. **Sai sót T8 (F-183-T8-3):** chạy thừa `run-chromium-183t8.sh` riêng lúc 06:53:17Z — driver webkit chạy cả 6 pha; lần chạy thừa chết ở lỗi Xvfb :199 (không chiếm lock, không chạy pha nào), chỉ truncate phần 84l10 trong `run-chromium-summary.txt` (khôi phục từ `run-webkit-summary.txt` + log pha).
- **07:01:42–07:04:15Z O8 T8 PASS 3/3** (JSON đếm lại bằng python). **07:07:05Z REBOOT #102** (boot `6ecd948e` — sau O8, trước khi đóng). 07:10–07:15Z kiểm cuối + replay + extract + LIMITS + paths + cờ.

## A. O8 — T8 PASS 3/3 TRÊN #101; O8 T0 PASS 3/3 (THEO CỜ T0-183)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #101 | **21/21 PASS** — exit 0, S1 07:01:54Z, JSON 21/21 ok=true, md5 `c9616c69` |
| 2 | O8 T8 WebKit attempt2 trên #101 | **21/21 PASS** — exit 0, S1 07:02:45Z, JSON 21/21 ok=true, md5 `d0a91fcb` |
| 3 | O8 T8 Chromium trên #101 | **21/21 PASS** — exit 0, JSON 21/21 ok=true, md5 `9786178a` |
| 4 | O8 T0 WebKit attempt1 trên #101 | **21/21 PASS** — md5 `28afdad4`, S1 05:57:55Z (theo cờ T0-183) |
| 5 | O8 T0 WebKit attempt2 trên #101 | **21/21 PASS** — md5 `7dc8391b`, S1 05:58:47Z (theo cờ T0-183) |
| 6 | O8 T0 Chromium trên #101 | **21/21 PASS** — md5 `e07e6487`, S1 05:59:47Z (theo cờ T0-183) |

- O8 T8 chạy 07:01:42–07:04:15Z, sau POSTBOOT_PASS #101 (05:56:42Z) 65 s; lock vite TRỐNG trước khi chạy, đã nhả sau khi xong (O8 DONE 07:04:15Z, webkit1=0 webkit2=0 chromium=0). O8 log: S1 PASS 6 dòng, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0 (theo extract-183t8).
- O8 T0 chạy 05:57:41–06:00:17Z, sau cờ 59 s (theo cờ T0-183; T8 chỉ đối chiếu md5 + S1 từ LIMITS T0-183).
- **Gate cho boot đo `51745634` (#101): (a) CÓ — POSTBOOT_PASS #101 (repair-sớm-quyết-h, poll=1, CÓ caveat).** Cả O8 T0 + O8 T8 cùng boot #101. **Chuỗi FULL PASS GIỮ 0 (đề xuất, parent/T10 quyết)** — 4/5 chân đủ, chân harness FAIL thật (85m4 exit 124).

## 2. Kết quả harness — 5/6 PASS; 1 KẸT THẬT (WEBKIT 85m4 P1)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 06:31:01–06:32:11 | **PASS** — W1×3 + W2 + E4 PASS, KHÔNG FAIL, live_diags=0 |
| 2 | WebKit 85m4-hb128 | 124 | 06:32:26–06:47:32 | **KẸT THẬT (TIMEOUT)** — P1 waitForPlaySync, playhead=0/ct=0.468 đóng băng, 177 HB128, WATCHDOG-137 ×3 |
| 3 | WebKit 86n2-hb128 | 0 | 06:47:47–06:51:48 | **PASS** — P1 PASS (không restart dư), P6 KHÔNG-KẸT, KHÔNG FAIL, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 06:52:04–06:53:04 | **PASS** — KHÔNG FAIL, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 06:53:19–06:55:20 | **PASS** — P5 PASS, KHÔNG FAIL, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 06:55:35–06:59:26 | **PASS** — P6 KHÔNG-KẸT, KHÔNG FAIL, live_diags=0 |

- **Kẹt 85m4 — chữ ký:** setup xong 06:32:35Z (clip 30 s); dòng HB128 ĐẦU TIÊN (elapsed=5 s) đã cho playhead=0, ct=0.468, paused=true, seeking=false, playing=true — **video không phát lên lần nào**; 177 dòng, elapsed cuối 886 s, cùng tag/playhead/ct suốt; WATCHDOG-137 06:33:39Z (evaluate im lặng >60 s → snapshot `stall-waitForPlaySync-P1-1795502019`: vite HTTP 200, WebKitWebProcess sống RSS 330.804 kB, avail 777 MB, balloon 5.517.776 kB); probe 1+1 TIMEOUT 30 s 06:34:09Z (kênh evaluate kẹt / page JS chết); driver giết node ở timeout 900 s → exit 124, diag sau timeout `stall-webkit-85m4-timeout124-1795502852` (vite http 000; avail 1.077 MB, balloon 5.749.516 kB); KẾT QUẢ: CÓ FAIL (report m4 ok=False 06:47:27Z).
- **Kẹt harness cộng dồn 25 → 26.** Đây là kẹt 85m4 lần thứ hai (sau 178-ket-85m4, cũng exit 124) — nhưng chữ ký KHÁC 178: 178 kẹt giữa chừng, 183 kẹt ngay từ đầu (P1 không phát lên). **86n2-P1 không kẹt: chuỗi 6 → 7** (P1 PASS 06:48:23Z, đồng bộ sau 2,3 s, extraEvents=[]). **84l10 PASS: chuỗi → 4 đợt (179–181 + 183).**
- **Đối chứng Chromium cùng pha: 85m4 Chromium PASS** — cùng clip, cùng boot: WebKit kẹt, Chromium không. Bằng chứng đối chứng cho H3 (kẹt đặc thù WebKitGTK — 84l10 WebKit cũng PASS cùng boot với cùng file h-30s).
- **B1 live: 0 dòng HB bất thường** — 86n2-hb128 PASS live (resetPlayhead0 bọc hbStart/hbStop, không kích hoạt sai, không bỏ lỡ gì để bắt — vì 86n2 không kẹt). B1 live sạch lần thứ hai (181 + 183; 182 không đo). **B2 VẪN HOÃN** (mới 2 đợt live sạch; kẹt-183 nằm ngoài phạm vi B1 — B1 chỉ bọc 86n2).
- RAM sampler (ram-183t8.log, n=59): balloon min 4.901.596 / max 6.038.704 kB (93,7% trần), avail min 371 MB / max 1.583 MB — 0 lần balloon ghim đúng trần trong cửa sổ harness (trần 6.443.824 kB chỉ chạm lúc 06:29:59Z, TRƯỚC harness).

## 3. Watchdog + 4 bước kiểm — WATCHDOG-137 ×3 (85m4); LIVE-DIAG 0; (1c')/(f') V1 ĐƯỢC GIỮ

- **Watchdog (i): 3 dòng, tất cả trong log 85m4** (06:33:39Z ×2 + 06:34:09Z probe TIMEOUT); 0 dòng trong 84l10/86n2-hb128/Chromium (0 pha). Live-diag (1b): **0** (log 85m4 không im lặng >120 s — HB128 chảy đều 5 s/lần — nên không đủ điều kiện gọi live-diag; đúng thiết kế). (1c')/(f') V1: 0 kích hoạt live (xem §C — replay mới là nơi đo). **(c') + (f') ĐƯỢC GIỮ (đề xuất).**
- **(1)** Watchdog chẩn đoán trong 3 script (VÁ 142, GIỮ NGUYÊN 143–183) + `t8-diag-stall.sh` → 183 (cả hai symlink — §5). **(1b)** live_diags=0 cả 6 pha. **(1c')** helper check-fresh + khối FRESH-CONTENT trong `run_one`: 0 kích hoạt live; replay C5.1 ĐẠT (§C).
- **(2)** Cột Balloon vào RAM sampler: n=59 (xem §2); avail thấp nhất 371 MB (06:38:57Z + 06:44:27Z, trong lúc 85m4 kẹt — T9 đối chiếu sampler; RAM thấp KHÔNG giải thích được kẹt (84l10 PASS lúc avail ~1.100 MB; WebKitWebProcess sống, vite HTTP 200)).
- **(3)** Đối chứng Chromium cùng pha: 3/3 PASS (xem §2). **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **1 lần kẹt → 2 snapshot** (06:33:39Z watchdog + 06:47:32Z sau timeout; dmesg không đọc được — Operation not permitted — journalctl-k trống, như mọi đợt).
- **0 snapshot stall mới ngoài 2 snapshot của kẹt-183.** 4 thư mục stall cũ trong smoke/ đều của 180/181 (F-181-T8-8 vẫn đứng). Cả hai symlink diag cập nhật → round183-t8 lúc 05:45Z, TRƯỚC waiter (F-178-T8-8 — checklist copy driver gồm cả hai symlink, 5 đợt liên tiếp).

# §C — (1c')/(f') V1: REPLAY C5.1 ĐẠT; (c') BỎ LỠ KẸT-183 — CHỈ V2 BẮT ĐƯỢC (F-183-T8-4)

## C1–C2. Thiết kế + B1: **(c'):** trailing run HB128 cùng tag + playhead + ct, kích hoạt khi span ≥ 120 s VÀ chuỗi ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi `paused+seeking=true` ≥300 s. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi 85m4 + 84l10 W2/E4 (Q3) + 86n2-hb128 (đợt 180) + resetPlayhead0 (B1, đợt 181). V2 (f'') dự phòng, KHÔNG triển khai. **B1 live sạch lần 2 (181 + 183):** 86n2-hb128 PASS live, 0 dòng HB bất thường, chưa bắt kẹt thật (kẹt-183 ở 85m4, ngoài phạm vi B1). **B2 VẪN HOÃN** (mới 2 đợt live sạch).

## C3. Replay sau O8 (replay-1c-183t8.py + replay-f-fix-183t8.py, ~07:08Z)

- **(c') V1: kẹt-164 TRIGGER @125 s; kẹt-178 TRIGGER @125 s (TRUE POSITIVE); kẹt-179 KHÔNG (BỎ LỠ — đã biết); kẹt-183 KHÔNG (BỎ LỠ MỚI — xem F-183-T8-4); 0 FP trên 16 log sạch duy nhất (18 entry có file — cặp 182-sach là bản copy byte-identical của 181-sach, xem F-183-T8-1). C5.1 ĐẠT** (tiêu chí C5.1 chỉ xét kẹt-164 + log sạch — kẹt-183 BỎ LỠ không làm C5.1 KHÔNG ĐẠT, như kẹt-171/179 trước đây).
- **(f') V1-300: ĐẠT** — kẹt-164 TRIGGER @125 s; kẹt-171 TRIGGER @305 s (V1-300); V1-180: 164@125 s (kẹt-171 KHÔNG); V1-600: cả hai; V2: cả hai. **(c') hiện tại KHÔNG ĐẠT** (lỡ kẹt-171 — đã biết, không đổi).
- **Kẹt-183 theo từng phương án (mới): (c') KHÔNG; (f') V1-180/300/600 đều KHÔNG; (f'') V2 TRIGGER @125 s; (f''') V3 KHÔNG.** Lý do: kẹt-183 có paused=true + seeking=false suốt 886 s — (f) chặn; (f') V1 chỉ miễn khi seeking=true nên bó tay; V2 miễn khi watchdog đã kích hoạt — WATCHDOG-137 ĐÃ kích hoạt 06:33:39Z — nên V2 bắt được @125 s. **Ca đầu tiên V2 bắt được mà V1 lỡ** (171: V1-300 bắt được; 179: không HB128 nào trong lúc kẹt nên mọi phương án đều lỡ; 183: chỉ V2 bắt).
- **Đổi tên entry theo tiền lệ 178/179:** log 85m4 đợt 183 là LOG KẸT THẬT (exit 124) nên entry đổi từ `183-sach-85m4` thành **`183-ket-85m4`** trong cả hai script replay (không tính vào 0-FP, không làm C5.1 KHÔNG ĐẠT). 183 đóng góp 1 log sạch mới: `183-sach-86n2-hb128` (KHÔNG trigger).
- **F-183-T8-4 (lỗ hổng thứ ba của (c')):** (c') bỏ lỡ kẹt-183 vì (f) chặn trên dòng paused=true/seeking=false; V1 không cứu được vì seeking=false. V2 cứu được nhờ watchdog. Đề xuất cho parent (KHÔNG tự triển khai): cân nhắc nâng V2 lên làm phương án chính, hoặc mở rộng (f') miễn (f) khi watchdog đã kích hoạt (chính là V2) — vì watchdog đã chứng minh kích hoạt đúng lúc (06:33:39Z, 68 s sau khi kẹt bắt đầu). **(c') + (f') V1 ĐƯỢC GIỮ (đề xuất) cho tới khi parent quyết về V2.**
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 12 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; script `baaa13c0`) + ca 178 W2-setup :443; 86n2-P1 theo dõi riêng — **PASS đợt này (chuỗi không kẹt 6 → 7)**. Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 183: **84l10 PASS, 0 FP mới**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 3 → 4 đợt (179–181 + 183).** Tần suất kẹt 84l10: 4 ca / 26 đợt ≈ 15%.

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — kẹt-183 là ca mới để đối chiếu (video không phát lên lần nào — khác mẫu kẹt giữa chừng).
- **Q2 — Lib hệ thống hay engine?** **KHÔNG PHẢI LIB ĐỢT NÀY:** 84l10 WebKit PASS cùng boot #101 với cùng file h-30s mà 85m4 dùng — lib/decode đủ; kẹt-183 là lỗi phát-lên (playback-start) của riêng pha 85m4 P1 (trái với đợt 182 — launch-fail do thiếu lib).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 183: 0 FP mới (84l10 PASS).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — kẹt-183 có probe evaluate TIMEOUT (kênh JS chết) trong khi WebKitWebProcess vẫn sống + vite HTTP 200 — tương quan mới cho Q4.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 26 đợt). Kẹt-183 (85m4 P1) theo dõi riêng: nếu 85m4 P1 kẹt lại, ghi có phải cùng chữ ký "không phát lên lần nào" không.
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 183 (1 KẸT MỚI 85m4; 86n2-P1 KHÔNG KẸT LẦN 7; KHÔNG MỞ ĐIỀU TRA)

## B1. Trạng thái giả thuyết sau đợt 183 (H3 ỦNG HỘ MẠNH HƠN — có ca kẹt mới để đối chiếu)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — 85m4 kẹt khi avail ~1.160 MB lúc bắt đầu (cao hơn 429 MB đợt 182 — nơi 0 pha chạy được); 84l10 PASS lúc avail ~1.100 MB; 86n2 PASS lúc avail ~650 MB.
- **H2 "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (đứng nguyên)** — avail trong lúc kẹt 371–1.583 MB, balloon max 93,7% trần (không ghim 100% trong cửa sổ harness); kẹt bắt đầu ngay từ dòng HB128 đầu tiên, không sau một cú tụt RAM.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN** — ca kẹt mới 85m4 P1: video không phát lên lần nào (ct đóng băng 0.468), kênh evaluate chết (probe TIMEOUT 30 s), trong khi WebKitWebProcess sống (RSS 330 MB), vite HTTP 200, và Chromium cùng pha PASS. Đây là chữ ký treo (treo kênh JS/IPC), không phải crash hay thiếu lib.
- **H3-D1 "Process WebKit bị kẹt tự ăn thêm RAM/CPU": BÁC BỎ (đứng nguyên; 0 bằng chứng mới — RSS WebKitWebProcess 330 MB tại thời điểm diag, không có chuỗi RSS tăng).**
- Đợt 183 T8 chỉ giám sát thụ động H3: **1 kẹt trong 3 lần chạy harness WebKit (85m4) + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 — theo cờ T0-183). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS lần thứ bảy liên tiếp.** H3 vẫn chỉ giám sát thụ động. Chữ ký kẹt đợt 183: 1 kẹt (85m4 P1, exit 124, 901 s start→release, probe TIMEOUT; so với 182: 0 kẹt vì 0 pha; 181: 0 kẹt; 180/179: 1 kẹt exit 124, 901/903 s, probe TIMEOUT).
# §E — CHECKLIST (o) ĐỢT 183 (quyết (o) đợt 180 + các F-182 còn lại — 21/21)

- o1. F-182-T0-2 (gap #97→#98 576 s) — GHI NHẬN; gap #100→#101 = 7.400 s (T0-183); reboot #102 mới 07:07:05Z (F-183-T8-6).
- o2. Run 182 SUCCEEDED 05:29:23Z (+838 s; chuỗi 4 timeout DỪNG Ở 4; claimed→finished 110 s — T7-183); run 183 kết cục thuộc T7-183.
- o3. F-181-T1-1 — ĐÃ SỬA XONG đợt 182; T1-183 verify PASS, chuỗi khớp lần 88 (parent 87 + T1-183).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 371–2.845 MB; balloon chạm trần 100% lúc 06:29:59Z (trước harness), max 93,7% trong harness (T9).
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; quyết (p) kiểm chứng live lần 3 ĐẠT; 0 spike B2 trong cửa sổ attempt (T4-183).
- o6. F-181-T4-3 (X193) — X193 MỚI (F-183-T8-2, §8); GIỮ làm bằng chứng, đã wipe theo #102.
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-183 pid 384639 ALIVE lúc T5 đóng (hạn 08:35Z).
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-183 đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #100/#101 TRỞ LẠI +11,x s (F-182-T0-2 đã trả lời; #99 +16,118 s là ca lẻ).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#101 repair-sớm-quyết-h, poll=1; #100 KHÔNG cờ, tổng GIỮ 22).
- o11. F-181-T6-1 (chồng pha) — GHI NHẬN; T6-183 ĐÃ ĐÓNG: (A) 120/120 lần 33; #100 + #101 KHÔNG GIẾT HOLDER (chuỗi = 6); prune 58 (xóa 0, queue 100); F-147-T6-1 chuỗi VẪN 0 (lần 5).
- o12. F-180-T6-4 (mâu thuẫn poll=0) — GHI NHẬN (T6-183 đã đóng cờ).
- o13. F-180-T6-5 (watcher chưa chạy lúc snapshot) — GHI NHẬN (T6-183 đã đóng cờ).
- o14. F-181-T7-1 (sleep bị SIGTERM) — GHI NHẬN; T7-183 chưa đóng cờ (run 183 kết cục + claimed→finished 110 s — T7-183).
- o15. F-180-T7-4 (lỗi nhãn T0-176/T0-177) — GHI NHẬN (F-178-T7-4 ĐÃ LÀM RÕ).
- o16. F-180-T7-5 (tuổi run cộng thừa 600 s) — GHI NHẬN (T7-183 chưa đóng cờ).
- o17. F-182-T8-1..6 — ĐÃ THỰC HIỆN (§8; F-182-T8-6 extract kiểm live ĐẠT).
- o18. Quyết (o) 182 (cửa slot LÀNH lần 8; HB 47/489, DR 53/317) — GHI NHẬN; số mới thuộc T7-183 (chưa đóng cờ).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 53 reboot; T8 đóng ~07:15Z, TRONG hạn cờ ~08:00Z.
- o20. Quyết (j) 182 (B1 chưa kiểm live; B2 HOÃN; F-178-T8-6 DỪNG; H3 giám sát) — ĐÃ THỰC HIỆN (§2, §C, §F, §B) — B1 kiểm live được đợt này (sạch lần 2); B2 VẪN HOÃN.
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-184: sampler cuối #101 muộn hơn btime #102 bao nhiêu — T9-183 chưa đóng cờ).
# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 183 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy; script diag `run-diag-84l10-w2setup-183t8.sh` đã đổi nhãn, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B1 không đổi:** 85m4-hb128 37.700 B (dưới giới hạn, dư 68 B); 86n2-hb128 41.785 B (oversize — cần ENABLE_PRIVSEP=0).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` **2f707749 (B1, không đổi)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` c90e0853 (B1, không đổi)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). Tất cả không đổi so với đợt 182 — **T8 thêm 0 file repo đợt này ngoài LIMITS này + 2 script replay đã sửa (đổi tên entry 183-ket + thêm entry 183-sach-86n2-hb128 — xem §C3; script nằm trong hidden_files, không stage riêng — xem §9).**
- **T8 thêm 1 file repo đợt này: LIMITS này.** Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round183-t8/`**.
- Extract (F-182-T8-6 — KIỂM LIVE ĐẠT): chạy trên log 183 mới, trích ĐÚNG số harness (85m4 exit=124, 86n2-hb128 exit=0, Chromium 0/0/0) + O8 21/21 ×3 (bootId 51745634) + sampler n=59 + WATCHDOG-137 trong log 85m4: 3, probe TIMEOUT: True. **F-181-T8-3 ĐÃ KIỂM LIVE XONG — đóng.** Lưu ý: extract vẫn liệt kê cả file stale 179/180/181 trong phần O8 JSON stamped + report JSON (hành vi cũ — chỉ file bootId 51745634 + stamp 07-01/07-02/07-03Z là của đợt 183); nhãn "ovsize LIMITS 181" chưa đổi thành 183 (F-183-T8-5, cosmetic).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** Cả hai symlink (`goals/.../t8-diag-stall.sh` + `apps/web/scripts/t8-diag-stall.sh`) cập nhật → round183-t8 lúc **05:45Z, TRƯỚC waiter** → 2 dump stall mới của kẹt-183 (đúng — cả hai đều từ diag-183t8). Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink (đã làm 5 đợt liên tiếp).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-183t8.mjs` có mặt sau `cp -r` 182→183 (md5 `453d1082` giống hệt 175–178; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 07:01:54Z/07:02:45Z).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round183-t8). **F-181-T8-5: ÁP DỤNG CHO #101** (repair-sớm-quyết-h, poll=1, CÓ caveat — cùng mẫu #96/#98, khác #99 replay-đầy-đủ KHÔNG caveat). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN MỘT PHẦN LÚC MỞ** (GST 0 — do replay chưa chạy; sau repair: 269 qua symlink). **F-183-T8-1 (bẫy log stale):** baseline replay parse nhầm 2 bản copy stale (nội dung 181) — đã cách ly vào `smoke/stale-181-copy/` + chạy lại sạch (xem §8).

## 6. Dọn dẹp + kiểm cuối — sạch (trên #102 sau reboot)

- Driver harness (pid 562053) đã thoát sau pha cuối (06:59:26Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng — đúng luật). O8 driver đã nhả lock 07:04:15Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 102 cooldown lúc đóng — extract xác nhận).
- Kiểm cuối ~07:10Z (trên #102 — sau reboot): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG (X193 đã mất theo #102, X199 đã unlink — không còn gì để dọn).
- Fixture /tmp: **ĐÃ REBUILD 06:30:33Z (md5 khớp đợt 125) — rồi MẤT LẠI theo reboot #102** (đợt sau rebuild lại sau gate; /tmp hiện chỉ còn 5 entry lẻ).
- **Reboot #102 (boot `6ecd948e`, btime 07:07:05Z):** xảy ra SAU O8 (07:04:15Z) và TRƯỚC khi T8 đóng (~07:10Z); **0 reboot trong cửa sổ đo (06:31–07:04Z).** dpkg.log về 2 dòng sau reboot (mẫu #101 lúc mở). Số hiệu #102 CHƯA XÁC MINH (T0-183 đã đóng cờ trước #102 — thuộc T0-184/T10-183); (m) #102 + INSIDE #102 thuộc T2-184. T7/T9 chưa đóng cờ lúc T8 đóng — thuộc T7-183/T9-183 + T10-183.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l` và `ls` — tuân thủ luật script nặng/cửa sổ attempt.** Không chạy script nặng nào khi T4 gate0wait (rebuild fixture + harness đều chạy SAU khi T4 đóng cờ 06:15:46Z).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 5/6 — 1 KẸT THẬT (85m4 exit 124), KHÔNG PHẢI 5/6 FAIL.** 84l10 + 86n2-hb128 WebKit PASS; Chromium 3/3 PASS. **Kẹt cộng dồn 25 → 26.**
2. **O8 T8 PASS 3/3 (python: 21/21 ok=true ×3, md5 c9616c69/d0a91fcb/9786178a).** O8 T0 PASS 3/3 theo cờ T0-183 (T8 không kiểm lại JSON gốc).
3. **Chuỗi FULL PASS GIỮ 0 (đề xuất) — 4/5 chân đủ, chân harness FAIL thật.** Không phải "không đo được" như 182. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #101 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat)** — gate (a) ĐẠT CÓ caveat. #100 KHÔNG CÓ cờ (tổng GIỮ 22 — quyết (c) đã đính chính).
5. **Balloon max 93,7% trần trong cửa sổ harness (n=59, avail min 371 MB) — KHÔNG có sampler T9 trong LIMITS này** (T9-183 chưa đóng cờ — giao T9 đối chiếu).
6. **85m4-hb128 37.700 B (DƯỚI 37.768 B, chỉ dư 68 B) + 86n2-hb128 41.785 B (>37.768 B)** — 86n2-hb128 oversize, lúc push cần `ENABLE_PRIVSEP=0`. 84l10 34.880 B, w2setup-hb128 36.113 B dưới giới hạn. **LIMITS này DƯỚI giới hạn push** (xem `wc -c` lúc stage).
7. **Chuỗi verdict: 84l10 PASS → 4 đợt; 86n2-P1 không kẹt 6 → 7; B1 live sạch lần 2 — NHƯNG B1 chưa bắt kẹt thật.** H3 ỦNG HỘ MẠNH HƠN (§B). Điều tra 84l10 ĐỢT 12 (§D).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **T8 ĐÓNG ~07:15Z, TRONG hạn cờ ~08:00Z; 1 reboot trong phiên T8 (#102, sau khi đo xong). 0 reboot trong phiên đo (06:31–07:04Z).**
10. **#101 XÁC MINH 9 nguồn (T0-183); #102 CHƯA XÁC MINH (T0-184/T10-183); marker 53 reboot #49–#101;** (m) #100 +42,577 s / (m) #101 +41,126 s (thô — T2-183 + parent 183); (m) #56 lần 26 (T2-183).
11. **(1c') + (f') V1: replay C5.1 ĐẠT, 0 FP; kẹt-183 BỎ LỠ bởi (c')/(f') V1, chỉ V2 bắt được — V2 chưa triển khai. B1 live sạch lần 2; B2 VẪN HOÃN.**
12. **T7/T9 CHƯA ĐÓNG CỜ lúc T8 đóng** (07:10Z) — checklist (o) ghi "thuộc T2/T7/T9", không phán thay. **T4 đóng 06:15:46Z với lượt yên #52 HỢP LỆ (có cờ `.done`).**

## 8. Sai số mới (F-183-T8-N) + nợ cũ đã xử lý

- **F-183-T8-1 — BẪY LOG STALE TRONG REPLAY BASELINE (TỰ BẮT ĐƯỢC, ĐÃ SỬA):** baseline replay lúc ~05:5xZ đã parse 2 file `smoke/run-webkit-85m4.log` + `run-webkit-86n2-hb128.log` thành "183-sach" — nhưng đó là **bản copy byte-identical của log 181** (md5 166b271d/e11c62cb; mtime copy 02:53:00Z đợt 182). Đã cách ly vào `smoke/stale-181-copy/` (+ README) rồi chạy lại replay sạch. **Hệ quả cho 182:** file 182-sach đã có mặt từ 02:53:00Z nên câu "182-sach KHÔNG CÓ FILE" trong LIMITS 182 là KHÔNG ĐÚNG về mặt file — replay 182 nhiều khả năng cũng parse bản copy stale của 181 mà không nhận ra; verdict C5.1 đợt 182 KHÔNG đổi (cả hai cách đều 0 FP). Giao T10-183 ghi nhận.
- **F-183-T8-2 — SOCKET X193 STALE MỚI (06:04Z–07:07Z): GIỮ, KHÔNG DỌN.** `/tmp/.X11-unix/X193` xuất hiện 06:04Z, không process nào giữ (ps chỉ có Xvfb :199) — nhiều khả năng Xvfb :193 của T4-183 bị kill mà không unlink socket. **Quyết: GIỮ làm bằng chứng (không phải socket của T8; xóa sẽ hủy bằng chứng về cách dọn Xvfb của T4)** — đã bị wipe theo reboot #102 nên lúc đóng X11 trống, không còn gì để dọn/giữ.
- **F-183-T8-3 — CHẠY THỪA DRIVER CHROMIUM RIÊNG (LỖI CỦA T8, ĐÃ KHÉP):** T8 chạy thêm `run-chromium-183t8.sh` lúc 06:53:17Z vì tưởng `run-webkit-183t8.sh` chỉ chạy 3 pha WebKit — thực ra driver webkit chạy cả 6 pha (xem header driver). Lần chạy thừa chết ngay ở lỗi Xvfb :199 (không chiếm lock, không chạy pha nào, pid 569094 đã thoát). **Thiệt hại duy nhất: truncate mất phần 84l10 trong `run-chromium-summary.txt`** — khôi phục đủ từ `run-webkit-summary.txt` (chromium 84l10 exit=0 06:52:04–06:53:04Z) + log từng pha. Bài học: `run-webkit-*` chạy cả 6 pha — KHÔNG chạy thêm driver riêng.
- **F-183-T8-4 — (c')/(f') V1 BỎ LỠ KẸT-183; CHỈ V2 BẮT ĐƯỢC:** xem §C3 — kẹt-183 (paused=true + seeking=false suốt 886 s) bị (f) chặn; (f') V1 chỉ miễn khi seeking=true nên bó tay; (f'') V2 miễn khi watchdog đã kích hoạt — WATCHDOG-137 đã kích hoạt 06:33:39Z — nên V2 TRIGGER @125 s. Ca đầu tiên V2 bắt được mà V1 lỡ. Đề xuất parent cân nhắc nâng V2 (KHÔNG tự triển khai).
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181" TRONG EXTRACT CHƯA ĐỔI (COSMETIC):** extract in "ovsize LIMITS 181: 34804" — nhãn còn 181, giá trị là kích thước LIMITS T8-181. Không ảnh hưởng số liệu. Giao đợt sau sửa nhãn.
- **F-183-T8-6 — REBOOT #102 GIỮA LÚC ĐÓNG (boot `6ecd948e`, btime 07:07:05Z).** Sau O8 (07:04:15Z), trước khi T8 đóng (~07:10Z); journal chỉ còn boot mới (idx 0, first 07:07:16Z = btime +11 s); dpkg.log về 2 dòng; fixture /tmp mất lại. Số hiệu #102 CHỜ T0-184/T10-183 xác minh; (m) #102 + INSIDE #102 thuộc T2-184. 0 reboot trong cửa sổ đo.
- **F-183-T8-7 — SELFCHECK LIBEVENT DƯƠNG TÍNH GIẢ:** selfcheck báo libevent "CÓ" (match `libevent_core-2.1.so.7`) trong khi `ldd` cho `libevent-2.1.so.7 => not found` (T5 verify cũng liệt kê thiếu). Selfcheck cần kiểm đúng tên file. Giao đợt sau sửa; không ảnh hưởng verdict (ldd + T5 verify là chuẩn).
- **F-183-T8-8 — NHÃN SAI TRONG REPLAY-1c (ĐÃ SỬA):** dòng "RUNSPAN đợt 182" cho dữ liệu 181 — đã sửa thành "đợt 181" trong replay-1c-183t8.py. Cosmetic.
- **F-182-T8-6 — EXTRACT CHƯA KIỂM LIVE: ĐÃ KIỂM LIVE ĐẠT ĐỢT NÀY (ĐÓNG).** Xem §5. **F-181-T8-3: ĐÃ SỬA Ở 182, ĐÃ KIỂM LIVE Ở 183 — ĐÓNG. F-181-T8-1: ĐÃ HẾT (181) — X193 mới là F-183-T8-2. F-181-T8-2: ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN. F-181-T8-4: ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN** (pilot trỏ đúng round183-t8). **F-181-T8-5: ÁP DỤNG CHO #101** (§5). **F-181-T8-6: TÁI DIỄN MỘT PHẦN LÚC MỞ** (GST 0 — do replay chưa chạy; sau repair: 269 qua symlink). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 181 + (c) đã đính chính đợt 182 — tổng GIỮ 22. F-181-T8-8 (log stale): VẪN CÒN — F-183-T8-1 là biểu hiện mới nhất (đã cách ly 2 file replay-liên quan; các file stale khác vẫn nằm trong smoke/).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 0 (đề xuất) — parent/T10 quyết** (đợt 183: 4/5 chân đủ; chân harness FAIL thật — 85m4 exit 124 — không phải chỉ không đo được; mốc 0 theo quyết (b) đã đính chính).
2. **(c') BỎ LỠ kẹt-183 — parent có nâng V2 (f'') lên làm phương án chính không?** (F-183-T8-4: chỉ V2 TRIGGER @125 s nhờ watchdog; (c')/(f') V1 vẫn ĐẠT C5.1 và 0 FP — giữ V1 là an toàn, nâng V2 là cải tiến có bằng chứng đầu tiên.)
3. **Kẹt-183 (85m4 P1, video không phát lên lần nào):** theo dõi xem 85m4 P1 có kẹt lại đợt 184 với cùng chữ ký không; Q1/Q4 có dùng ca này làm dữ liệu không.
4. **B2 VẪN HOÃN (đề xuất)** — B1 live sạch lần 2 (181 + 183); mở B2 sau khi B1 bắt được kẹt thật hoặc sau 2–3 đợt live sạch nữa (cần thêm 1 đợt sạch nếu tính theo mốc 3).
5. **Reboot #102 (6ecd948e, btime 07:07:05Z) — số hiệu chờ T0-184/T10-183; (m) #102 + INSIDE #102 thuộc T2-184.** T7/T9-183 chưa đóng cờ lúc T8 đóng.
6. **F-183-T8-1 (bẫy log stale):** đề xuất đợt sau dọn `smoke/` khỏi bản copy (chỉ giữ file mới) HOẶC đổi replay sang kiểm tra mtime log > thời điểm mở đợt.
7. **F-183-T8-3 (chạy thừa driver):** ghi vào checklist copy driver đợt 184 — `run-webkit-*` chạy cả 6 pha, KHÔNG chạy thêm `run-chromium-*` riêng.
8. **F-183-T8-7 (selfcheck libevent dương tính giả):** T8-184 sửa selfcheck kiểm đúng tên file `libevent-2.1.so.7`.
9. Mở từ trước, vẫn đứng: **#100 + #101 KHÔNG GIẾT HOLDER — chuỗi = 6 (#96–#101) nếu parent tính tiếp (T6-183); (A) 120/120 lần 33 + prune 58 (xóa 0, queue 100; F-147-T6-1 chuỗi VẪN 0 lần 5); (m) #100 + (m) #101 DƯƠNG (CUỐI cấp T2) — parent 183 quyết cuối; n ứng viên 42/43 → 43/44 nếu chấp nhận cả hai; n chính thức GIỮ 14; INSIDE #100 TRUE (FULL146, 1→2) + INSIDE #101 TRUE (FULL147, 2→3) — mâu thuẫn ngược hướng lần 13/14, chuỗi mới = 2 (T2-183); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 27, NEW=0); (m) #56 lần 26; run 182 SUCCEEDED (+838 s; chuỗi 4 timeout DỪNG Ở 4); run 183 kết cục thuộc T7-183; G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 37 (T9-183); R9 (a) lần 21; file oversize 6,4 MB chưa quyết; prune lần 59 (T6-184); KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức; fixture /tmp mất theo #102 — rebuild sau gate đợt 184.**

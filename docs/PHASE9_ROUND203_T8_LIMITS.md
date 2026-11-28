# Đợt 203 T8 — KẸT #32 (84l10 WebKit, BẮT SỐNG @125 s); REBOOT #136 GIỮA HARNESS; HARNESS TÁCH 2 BOOT (2/6 #135 + 3/3 Chromium #136); V5 GIỮ LIVE

Ngày: 27–28/11/2026 (đợt 203 mở lượt cron 06:35:51 +07 = 23:35:51Z 27/11; T8 mở ~23:50Z, đóng ~01:35Z 28/11 — TRONG hạn cờ ~02:00Z và hạn cứng 02:35:51Z).
Phạm vi: (1) V5 live tiếp (theo (j)-202 — V5 GIỮ LIVE); (2) harness trên boot mới nhất; (3) B1/B2 live; (4) V2/V4/V5 replay; (5) O8 — KHÔNG CHẠY (T01-203 chạy lại O8 trên #135 — xem §A).
**Nguồn đứng:** §14.2 aggregate 202 (parent viết trực tiếp, lượt handoff 06:35 +07 28/11; aggregate 75.747 B). Các mốc parent dùng: (r)(11) T8-203 harness trên boot mới (#135 nếu xác nhận); O8 chạy lại thuộc T01-203; (j) V5 GIỮ LIVE (V2 6/6; V4 5/5; V2+V4+V5 = 11/11 kẹt, 0 FP trên 52 log sạch); 84l10 PASS — chuỗi 0 → 1; 86n2-P1 chuỗi 22 → 23; B2 vùng mới sạch lần 16; B1 live 0 trigger, đợt SẠCH — chuỗi live sạch 0 → 1; (m) yên #70 HỢP LỆ, live #21 ĐẠT; (e) #135 ỨNG VIÊN.
**Reboot giữa harness:** VM reboot 01:09:53Z (boot #135 `8ea1f5e3` → boot mới `43e3d296`, ứng viên #136, gap #135→#136 = 7.377 s = 2h02m57s). Reboot xảy ra giữa pha 85m4 (xong 01:09:46Z) và pha 86n2 WebKit (khởi động 01:10:01Z); phiên exec của T8 bị SIGTERM ~01:10:23Z (runtime restart sau reboot) làm chết pha 86n2 WebKit. /tmp fixture bị xóa theo reboot. T56-203 đã đóng `.done` lúc ~00:42Z (trước reboot) nên KHÔNG có repair/POSTBOOT cho #136; T8 KHÔNG tự repair (ngoài mảng) — WebKit không chạy được trên #136 (selfcheck #3: libs 6/6 THIẾU, dpkg 2). Harness hoàn thành bằng driver Chromium-only trên #136 (3/3 PASS).

## 0. Kết luận ngắn — KẸT #32 THẬT; HARNESS KHÔNG 6/6; FULL PASS KHÔNG CÓ; V5 GIỮ LIVE

- **BOOT #135 (ỨNG VIÊN) `8ea1f5e3` (btime 23:06:56Z)** — POSTBOOT_PASS #135 CÓ 23:55:18Z (T56-203, poll=1, repair-som-quyet-h, dpkg 777, cache 108, lists 75). Harness WebKit trên #135: 84l10 **FAIL (kẹt #32)** + 85m4 PASS; 86n2 WebKit NHIỄM (chết theo SIGTERM phiên).
- **BOOT #136 (ỨNG VIÊN, CHƯA SURVEY) `43e3d296` (btime 01:09:53Z)** — chưa repair, chưa POSTBOOT. Harness Chromium trên #136: **3/3 PASS** (84l10 + 85m4 + 86n2-hb128, toàn exit=0).
- **KẸT #32 — 84l10 WebKit startPlaying, BẮT SỐNG @125 s** (V2/fresh-content via=f; V5 không bắt — đúng thiết kế, kẹt lớp đóng băng, xem §C5). Kẹt cộng dồn **31 → 32 (đề xuất)**. 84l10 PASS — chuỗi **1 → 0 (đề xuất)**.
- **86n2-P1: P1 PASS 01:19:55.642Z trên Chromium #136** (WebKit P1 KHÔNG CÓ dữ kiện — pha nhiễm) → chuỗi **23 → 24 (đề xuất, chỉ trên Chromium — parent quyết có tính không)**.
- **V2 7/7 + V4 5/5 = 12/12 kẹt, 0 FP trên 53 log sạch duy nhất** (corpus +203: 68 entry f-fix, 70 entry 1c). **V5 5/5 kẹt mù, 0 FP trên 53 log sạch** — GIỮ LIVE (đề xuất).
- **B1 live: 1 trigger** (kẹt #32) — đợt KHÔNG sạch; chuỗi live sạch **1 → 0 (đề xuất)**. **B2 vùng mới: 1 trigger tại startPlaying** → sạch **16 → 0 (đề xuất)**; P6-wait đủ 90 s trên Chromium #136 (18 dòng), WebKit 86n2 nhiễm (0 dòng).
- **T4-203: lượt yên #71 KHÔNG CÓ lượt hợp lệ** (3 attempt, 0 hợp lệ); live-check #22 KHÔNG ĐẠT; P3' cộng dồn GIỮ 56. **O8 T01-203 chạy lại trên #135: 3/3 ĐẠT** (WebKit 21/21 ×2 + Chromium 21/21).
- **FULL PASS: KHÔNG CÓ** — chân harness KHÔNG 6/6 + chân yên KHÔNG ĐẠT + chân O8 3/3 ĐẠT. Chuỗi full pass GIỮ 0.
- **T8 0 vi phạm trong W1** — waiter bỏ qua 16 poll rơi vào 3 cửa W1 (F-203-T8-1 sửa F-202-T8-4, đã chứng minh bằng log); vòng chờ nền của T8 chỉ đọc (không ghi file nào trong W1).

## 1. Dòng thời gian (gọn)

- 23:06:56Z **Boot #135 `8ea1f5e3`** (trước khi đợt mở; T01-203 survey 9 nguồn tươi). 23:35:51Z Đợt 203 mở (lượt cron 06:35:51 +07, run 213). ~23:50Z T8 mở (đọc §14.2 aggregate 202 + LIMITS T8-202). 23:53:07Z Watcher-203 START (T56-203). **23:55:18Z POSTBOOT_PASS #135 CÓ** (T56-203, poll=1). 23:55:26Z Waiter T8 khởi động (setsid). 23:55:35Z Selfcheck #1 (libs 6/6 CÓ — đã repair xong). 23:56:21Z Fixture rebuild lần 1 (md5 khớp đợt 125). ~23:57Z Tiền kiểm replay xong (V5 5/5, 0 FP/52; hồi quy 66/66; B2 offline khớp hệt 202).
- 00:15:21–00:23:03Z **W1a** (attempt1 T4: WEDGED exit=3); 00:23:25–00:26:54Z **W1b** (attempt2: 20/20 nhưng B2 vi phạm); 00:28:56–00:33:14Z **W1c** (attempt3: 20/20 nhưng tickCost 117 ms). 00:33:38Z Poller T4 thoát exit 11. 00:45Z **T4 .done** (yên #71 KHÔNG HỢP LỆ; live #22 KHÔNG ĐẠT). **00:48:32Z GATE-FOUND poll=54** (t4=OK + postboot đường (a) + no-lock). 00:50:36Z Selfcheck #2 (khớp #1).
- **00:51:57Z HARNESS WEBKIT BẮT ĐẦU** trên #135. 00:52:00–01:07:10Z **84l10 FAIL (kẹt #32, exit=124)**. 01:07:25–01:09:46Z **85m4 PASS (exit=0)**. **01:09:53Z REBOOT → boot #136 `43e3d296`.** 01:10:01–01:10:24Z 86n2 WebKit NHIỄM (browser chết theo SIGTERM phiên ~01:10:23Z). 01:13:47Z Selfcheck #3 trên #136 (libs 6/6 THIẾU, dpkg 2 — chưa repair). 01:14:27Z Nhả lock vite stale của driver chết (giữ 266 s). 01:15:06Z Fixture rebuild lần 2 (sau khi /tmp bị xóa; md5 khớp). **01:15:25–01:23:17Z HARNESS CHROMIUM-ONLY trên #136: 3/3 PASS (exit=0).** 01:23–01:29Z Kiểm chứng sau harness (extract + replay post + check-fresh live từng pha). T8 đóng ~01:35Z, TRONG hạn cờ.

## 1b. Gate — GATE-FOUND FILE-BASED ĐÚNG QUY TẮC (p1)

- Waiter 1 phiên setsid sống từ 23:55:26Z tới GATE-FOUND (không reboot trong lúc chờ — reboot #136 xảy ra sau gate). Tổng 54 poll, **37 dòng log + 16 poll bỏ qua im lặng trong W1** (poll 21–32 rơi vào W1a/W1b, poll 35–38 rơi vào W1c — vắng khỏi log, xem §8/F-203-T8-1). **GATE-FOUND poll=54 00:48:32Z: t4=OK + postboot=round203-t56/POSTBOOT_PASS (đường a, boot 8ea1f5e3) + t4attempt=no-lock.**
- Gate đúng quy tắc (p1): waiter poll=54 lúc 00:48:32Z thấy t4=OK (file .done đã tồn tại từ 00:45Z); vòng chờ nền của T8 thấy .done lúc 00:50:02Z (poll đầu tiên sau khi file xuất hiện — vòng chờ poll 120 s/lần). Nội dung .done khớp LIMITS T4 (yên #71 KHÔNG HỢP LỆ, live #22 KHÔNG ĐẠT, P3' 56 lượt, W1-ACTIVE đã xóa cả 3 attempt) + POSTBOOT_PASS #135 CÓ 23:55:18Z (T56-203, poll=1, dpkg 777, verify độc lập exit 0) + lock vite-lock-v2 TRỐNG + 0 process T4 sống lúc đóng (poller thoát 00:33:38Z). Harness WebKit bắt đầu 00:51:57Z — 3m25s SAU GATE-FOUND (selfcheck #2 + kiểm tree/lock trước khi chạy).
- Caveat gate: yên #71 đo trên #135, harness WebKit 2 pha đầu trên #135 (cùng boot); harness Chromium 3 pha trên #136 (khác boot — reboot giữa harness, xem §2); O8 T01 đo trên #135 (cùng boot với yên + 2 pha WebKit). Chân O8 khác boot với chân Chromium (xem §E/(c)).

## A. O8 — T01-203 CHẠY LẠI TRÊN #135 SAU POSTBOOT (T8 KHÔNG CHẠY O8)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #135 | **PASS — 21/21** |
| 2 | O8 T01 WebKit attempt2 trên #135 | **PASS — 21/21** |
| 3 | O8 T01 Chromium trên #135 | **PASS — 21/21** |

- O8 chạy lại theo (r)(5)-202 (kết quả 1/3 đợt 202 trên #133 GIỮ NGUYÊN trong hồ sơ đợt 202). **Chân FULL PASS O8: 3/3 — ĐẠT đợt này.** T8 không chạy O8 (không nằm trong brief T8-203); số liệu trích từ T01-203.done (00:05:24Z — T01 đóng TRƯỚC khi T8 đóng; T01 LIMITS 11.370 B).

## 2. Kết quả harness — TÁCH 2 BOOT: WEBKIT 1/3 TRÊN #135 (1 NHIỄM) + CHROMIUM 3/3 TRÊN #136

### 2a. Boot #135 — WebKit 84l10 FAIL (kẹt #32) + 85m4 PASS; 86n2 NHIỄM

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 124 | 00:52:00–01:07:10 | **FAIL — KẸT #32** (startPlaying đóng băng 886 s; V5/V2 TRIGGER @125 s; xem §D) |
| 2 | WebKit 85m4 | 0 | 01:07:25–01:09:46 | **PASS** — P1–P5 PASS, "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 3 | WebKit 86n2-hb128 | — | 01:10:01–01:10:24 | **NHIỄM — KHÔNG TÍNH** (browser chết theo SIGTERM phiên sau reboot #136; P1 chưa xong) |

### 2b. Boot #136 — Chromium 3/3 PASS (driver riêng, sau rebuild fixture)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 4 | Chromium 84l10 | 0 | 01:15:29–01:16:40 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS (restart 6→6, ct=3,956, ended=false), live_diags=0 |
| 5 | Chromium 85m4 | 0 | 01:16:56–01:19:07 | **PASS** — P1–P5 PASS, "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 01:19:22–01:23:14 | **PASS** — **P1 PASS 01:19:55.642Z** + P3/P5 PASS + P6-wait đủ 90 s (18 dòng), live_diags=0 |

- **Kẹt harness cộng dồn 31 → 32 (đề xuất, 1 kẹt mới #32). 84l10 PASS — chuỗi 1 → 0 (đề xuất). 86n2-P1 CÓ DỮ KIỆN MỚI trên Chromium — chuỗi 23 → 24 (đề xuất, parent quyết có tính dữ kiện Chromium-only không).**
- RAM sampler: pha WebKit mất mẫu (ghi đè — xem F-203-T8-2); pha Chromium n=16 mẫu: balloon min 4.476.632 / max **5.721.816 kB (88,8% trần)**, mean 5.094.567, pinned=0; avail min **712 MB (01:22:56Z)** / max 2.269 MB. Nặng hơn đợt 202 trên #134 (88,3%, avail min 1.041 MB) — theo dõi (F-196-T8-4).
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" — **0 chồng lấn với attempt T4** (poller T4 đã thoát 00:33:38Z; harness chạy SAU T4 .done). **T8 0 vi phạm trong W1** (xem §0/§8).
- ALL DONE Chromium 01:23:14Z ghi `ec webkit: 84l10=-1 85m4=-1 86n2=-1 ; chromium: 84l10=0 85m4=0 86n2=0` (webkit -1 = không chạy trong driver này, theo quy ước F-196-T8-2). Driver WebKit KHÔNG có ALL DONE (chết theo SIGTERM phiên sau reboot).
- Báo cáo JSON ok=true: `m4-scratch` 01:09:38.460Z (WebKit 85m4); `l10-scratch-chromium` 01:16:36.458Z; `m4-scratch-chromium` 01:18:59.170Z; `n2-hb128-scratch-chromium` 01:23:08.483Z. ok=false: `l10-scratch` 01:07:00.946Z (kẹt #32); `n2-hb128-scratch` 01:10:24.744Z (pha nhiễm). **KHÔNG có báo cáo stale.**

## D. Kẹt #32 — 84l10 WebKit startPlaying ĐÓNG BĂNG (H3 — WebKitGTK TREO)

- **Diễn biến:** setup W1 00:52:12Z xong, startPlaying đóng băng ngay từ mẫu đầu (elapsed 5 s → 886 s, playhead=? ct=? suốt 177 dòng HB128; không chạy được W1-lần1/W2/E4 nào). WATCHDOG-137 00:53:12Z (evaluate im >60 s tại startPlaying:280) + probe 1+1 TIMEOUT 30 s 00:53:42Z (kênh evaluate kẹt cùng / page JS chết). **V2 TRIGGER @125 s** (span 120 s, run_len 25, via=f, ts 00:54:17.516Z, poll 00:54:22Z) + diag-stall ×2 (00:54:22Z, 00:58:25Z). Timeout 900 s → exit=124 01:07:10Z, "KẾT QUẢ: CÓ FAIL", cases={} (report l10-webkit-loop-w1-report.json).
- **Chẩn đoán (4 thư mục stall):** vite HTTP 200 (4,8 ms) lúc 00:53:13Z + 00:54:22Z; MiniBrowser + WebKitWebProcess CÒN SỐNG (RSS ~330–357 MB, CPU time 01:05–02:20); load ~1,4–2,0; avail 910–1.092 MB; Balloon 4.723.548 / 4.923.788 kB (5.727.628 kB lúc timeout — sau khi vite đã chết, HTTP 000). → Renderer sống, media + kênh evaluate chết: **chữ ký H3 WebKitGTK treo, cùng họ kẹt #28 (W2, đợt 192) và #31 (W1-lần3, đợt 198)**, khác call-site (startPlaying — chưa tới W1).
- **Loại trừ nhiễu P1:** P1-203 sửa `psolaWorkletSource.ts` lúc 00:52:22Z (giữa pha 84l10). Mẫu đóng băng ĐẦU TIÊN 00:52:17Z đã playhead=? TRƯỚC sửa đó 5 s — sửa không gây kẹt. (84l10 không dùng worklet giọng; P1 sửa xong 01:02:46Z, cây ổn định trước pha Chromium.)
- **84l10 fail/kẹt: 4/26 ≈ 15%** (192 #28 stall W2, 198 #31 stall W1-lần3, 201 E4 FAIL flake, 203 #32 stall startPlaying). Không có mẫu lặp cùng call-site 2 đợt liên tiếp (call-site khác nhau cả 4 lần).

## B. H3 — WebKitGTK treo — ỦNG HỘ MẠNH THÊM (kẹt #32)

- Kẹt #32 khớp H3 (biến thể startPlaying, 0-HB128 theo nghĩa playhead không tiến dù heartbeat vẫn chảy). Không phải H1 (T4 đã đóng, poller thoát 00:33:38Z, 0 attempt lúc harness chạy 00:52Z), không phải H2 (ENOSPC — dpkg 777 dòng ổn định trong lúc harness #135; ENOSPC #135 = 78 dòng lúc T56 đóng — xem T56-203).
- WebKit chạy được trên #135 nhờ libs hệ thống sau repair (6/6 CÓ, xem §C6) + debroot dự phòng trong driver (F-197-T8-1, giữ nguyên).

## C. B1/B2 live + V2/V4/V5 replay

### C1. Script md5 (đổi nhãn 203t8; check-fresh KHÔNG đổi logic so với 202)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-203t8.py | ad39e6d7 | 15.551 | đổi nhãn (logic V5 giữ nguyên) |
| diag-stall-203t8.sh | 17c73f3f | 2.292 | đổi nhãn |
| extract-203t8.py | dad6a418 | 7.920 | đổi nhãn |
| wait-t4-t5-203t8.sh | 1b109f07 | 4.349 | đổi nhãn + deadline 02:00Z 28/11 + **vá F-203-T8-1 (không ghi log trong W1)** |
| run-webkit-203t8.sh | 031edc19 | 13.980 | đổi nhãn (check-fresh chạy TRƯỚC mỗi poll, V5 live) |
| run-chromium-203t8.sh | abb8e5a7 | 13.486 | đổi nhãn (chạy riêng Chromium đợt này — sau reboot #136) |
| replay-1c-203t8.py | 6e3c9602 | 23.064 | đổi nhãn + GIỮ entry 202 + thêm entry 203 |
| replay-f-fix-203t8.py | 2cecebfb | 21.867 | đổi nhãn + GIỮ entry 202 + thêm entry 203 + **sửa F-203-T8-3 (v2_class thêm 203-ket)** |
| replay-wallclock-203t8.py | 5b5e94cd | 12.127 | đổi nhãn + **sửa F-203-T8-4 (bỏ hardcode 6 → đếm động)** |
| launch-test-webkit-203t8.mjs | cc3c1988 | 1.289 | đổi nhãn |
| run-diag-84l10-w2setup-203t8.sh | 56fb7ad3 | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196–202 |
| selfcheck-postboot-203t8.sh | 5194f533 | 2.299 | đổi nhãn |
| rebuild-fixtures-203t8.sh | 5ec43cfd | 2.810 | đổi nhãn |
| verify-163-203t8.py | 2051aa73 | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-203t8.sh | 56b50f32 | 6.660 | đổi nhãn + lock t8-round203 — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-203t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196–202 (**VƯỢT trần push** — file cũ, không đổi) |
| run-diag-84l10-rerun-203t8.sh | 9de1cd2e | 13.195 | đổi nhãn (đã sửa F-201-T8-3 ở 202); KHÔNG chạy đợt này (84l10 FAIL vì kẹt thật, không phải flake — chạy lại chẩn đoán xem §F) |
| symlink `t8-diag-stall.sh` | — | — | cả 3 nơi → diag-stall-203t8.sh (2 nơi hidden_files sửa lúc mở; apps/web/scripts sửa lúc đóng — xem F-203-T8-5) |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 197–202** (md5 khớp).

### C2. Offline B2 — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–202, ĐẠT

| Case | Log tổng hợp (đợt 186) | Kết quả (check-fresh-203t8.py, --now/--until=last_ts) |
|---|---|---|
| B2-1 setup | planb-b2-setup-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-2 startPlaying | planb-b2-startplaying-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-3 P6-wait-wd | planb-b2-p6wait-150s-wd.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=wd) |
| B2-4 P6-nowd | planb-b2-p6wait-150s-nowd.log | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | planb-b2-p6-clean-90s.log | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | planb-b2-setup-clean-60s.log | **KHÔNG kích hoạt** (maxspan=55 s) |

- Chạy với --now/--until = last_ts đầy đủ từng file, dạng tách riêng. Kết quả lưu `smoke/b2-offline-203t8.txt`, diff với đợt 202 KHỚP HỆT (diff trống).

### C3. Live — V2 bắt #32 @125 s; B1 1 trigger; B2 vùng mới 1 trigger (startPlaying)

| Pha | Boot | HB128 (dòng) | Kết quả check-fresh live (--now/--until=last_ts) |
|---|---|---|---|
| #135 WebKit 84l10 | #135 | 177 | **TRIGGER @125 s via=f** (run 5s..125s, startPlaying, playhead=? — kẹt #32) |
| #135 WebKit 85m4 | #135 | 19 | OK (maxspan=5 s, wd=0, maxgap=9 s) |
| #136 Chromium 84l10 | #136 | 5 | OK (maxspan=0 s, wd=0, maxgap=14 s) |
| #136 Chromium 85m4 | #136 | 19 | OK (maxspan=10 s, wd=0, maxgap=9 s) |
| #136 Chromium 86n2 | #136 | 38 | OK (maxspan=85 s, wd=0, maxgap=8 s; **P6-wait đủ 90 s — 18 dòng**) |
| #135 WebKit 86n2 (NHIỄM) | #135 | 1 | OK (maxspan=0 s, wd=0, maxgap=8 s — log cụt, KHÔNG TÍNH) |

- **B1 live: 1 trigger — V2 (fresh-content) bắt kẹt #32 @125 s; V5 (wallclock) không bắt — đúng thiết kế** (kẹt lớp đóng băng, heartbeat vẫn chảy, không có im lặng trailing ≥120 s). Đợt này KHÔNG sạch — chuỗi live sạch **1 → 0 (đề xuất)**.
- **B2 vùng mới (setup/startPlaying/P6-wait): 1 trigger tại startPlaying** (pha WebKit 84l10) → B2 vùng mới sạch **16 → 0 (đề xuất)**. P6-wait đủ 90 s chỉ trên Chromium #136 (18 dòng); WebKit 86n2 nhiễm (0 dòng) — không đủ dữ kiện P6-wait phía WebKit đợt này.
- LIVE-DIAG-189 (nhánh mtime): **0 lần** đợt này. WATCHDOG-137: **×1 event (3 dòng)** trong log 84l10 + probe TIMEOUT 30 s (xem §D). Diag live sau trigger: 2 lần (FRESH-CONTENT-189). Tổng 4 thư mục stall.

### C4. Replay — V2 7/7 + V4 5/5 + V5 5/5 = 12/12 kẹt, 0 FP trên 53 log sạch duy nhất

| Kiểm tra | 203-ket-84l10 | 203-sach-85m4 | Cộng dồn |
|---|---|---|---|
| Replay-1c (c') | TRIGGER @125 s | KHÔNG kích hoạt | (c') kẹt-164 TRIGGER @125 s, lỡ 171 + 179 (đã biết); 0 FP trên log sạch |
| Replay-f-fix (f') ≥180/300/600 s | TRIGGER @185/305/605 s | KHÔNG kích hoạt | (f') ĐẠT trên tiêu chí 2 kẹt (164@125 s + 171@185/305/605 s), 0 FP |
| Replay-f-fix (f'') | TRIGGER @125 s | KHÔNG kích hoạt | **V2 (f'') 7/7 trong lớp HB128** (164/171/178/183/188/196/203) |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=10 s) | KHÔNG kích hoạt (gap=9 s) | **V4 5/5 kẹt mù** (179/180/192/197/198) |
| Replay-wallclock V5 (f''''') | KHÔNG kích hoạt (maxgap=10 s, tail=-0,0 s) | KHÔNG kích hoạt (maxgap=9 s) | **V5 5/5 kẹt mù** (179/180/192/197/198) — không fire trên 7/7 kẹt lớp V2, đúng thiết kế |

- **Số log sạch chuẩn (md5-unique): 52 → 53** (55 entry sạch; 203-sach-85m4 duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 68 entry = 55 sạch + 12 kẹt + 1 fail; corpus replay-1c: 70 entry).
- **Hồi quy V2/V4: check-fresh-203t8.py vs 197t8.py KHỚP HỆT trên 68 log** (--now/--until=last_ts; V5 silence=0).
- Tiền kiểm TRƯỚC harness (chạy ~23:57Z): V5 5/5 kẹt mù, 0 FP trên 52 log sạch duy nhất (54 entry); V2/V4 hồi quy 66/66 khớp (pre) → 68/68 khớp (post).

### C5. V5 (f''''') — GIỮ LIVE (đề xuất); KẸT #32 THUỘC LỚP V2, KHÔNG PHẢI LỚP V5

**Thiết kế (quyết (j)-197, giữ nguyên đợt 203):** trigger khi im lặng MỞ (trailing silence) `now - dòng timestamp CUỐI CÙNG >= 120 s`, chỉ đánh giá khi process pha còn sống. V5 bổ sung, không thay thế V2 (V2 vẫn là phương án chính trong lớp HB128); V4 GIỮ LIVE. Giới hạn còn lại: log 0 dòng timestamp thì V5 không đo được (như V4) — nhánh mtime LIVE-DIAG-189 trong driver vẫn là fallback.
**Kẹt #32 phân lớp:** kẹt đóng băng (frozen-run: HB128 chảy đều 5 s/lần nhưng playhead không tiến) — V2 bắt @125 s; V5/V4 không bắt (max gap trong-log chỉ 10 s, không có im lặng ≥120 s). Đây là kẹt đóng băng thứ 7 trong corpus (sau 164/171/178/183/188/196) — V5 không fire trên 7/7 kẹt lớp này là ĐÚNG THIẾT KẾ, không phải suy giảm. **Script wallclock có hardcode 6 đã sửa (F-203-T8-4)** — sau sửa: "V5: DAT — DU DIEU KIEN BAT LIVE", kết luận "V5 DAT — bat live o driver dot 198".
- Live đợt này: V5 armed cả 5 pha hợp lệ, **0 trigger — đúng (không có kẹt im lặng)**; V4 live 0 trigger; V2 live 1 trigger (#32). B1 live 1 trigger.

### C6. Debroot — WebKit #135 chạy được nhờ libs hệ thống SAU REPAIR + debroot dự phòng

- Selfcheck #1 (23:55:35Z, trên #135, sau repair): libs 6/6 CÓ, libgst\* 79, dpkg 777, gst-inspect VẮNG, gst-plugin-scanner VẪN VẮNG, plugin dir 269 .so, Balloon 5.157.844 kB. Selfcheck #2 (00:50:36Z, trước harness): khớp #1 (Balloon 4.570.592 kB). Selfcheck #3 (01:13:47Z, trên #136, chưa repair): libs 6/6 THIẾU, libgst\* 0, dpkg 2, gst-inspect VẮNG, Balloon 5.580.696 kB. **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 8).** Debroot `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin) vẫn là đường dự phòng (F-197-T8-1, giữ nguyên); T56-203: GST hệ thống trên #135 là thư mục thật (269=269).

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 203 (T10 quyết)

- (a) Harness: WebKit 84l10 **FAIL (kẹt #32)** + 85m4 PASS trên #135; WebKit 86n2 **NHIỄM** (không tính); Chromium 3/3 PASS trên #136. **KHÔNG 6/6.**
- (b) FULL PASS: **KHÔNG CÓ** (chân harness KHÔNG 6/6 + chân yên #71 KHÔNG HỢP LỆ + chân O8 3/3 ĐẠT; chuỗi full pass GIỮ 0).
- (j) **V5 GIỮ LIVE (đề xuất — 5/5 kẹt mù, 0 FP trên 53 log sạch; V2 7/7 + V4 5/5 = 12/12 kẹt)**; 84l10 FAIL — chuỗi PASS 1 → 0; **86n2-P1 CÓ DỮ KIỆN MỚI trên Chromium (P1 PASS 01:19:55.642Z) — chuỗi 23 → 24 (đề xuất, parent quyết có tính dữ kiện Chromium-only không; WebKit P1 không có dữ kiện)**; B2 vùng mới sạch 16 → 0 (trigger tại startPlaying); B1 live 1 trigger (đợt KHÔNG sạch — chuỗi live sạch 1 → 0, đề xuất). **V2+V4+V5 = 12/12, 0 FP trên 53 log sạch**; V2 VẪN là phương án chính (7/7 lớp HB128); V4 GIỮ LIVE (5/5). **B2 dữ kiện #15: KHÔNG CÓ W1 hợp lệ** (T4-203; W1a 32 spike, W1b 14 spike, W1c 0 spike — nhưng attempt3 không hợp lệ do tickCost) — KHÔNG TÁCH vẫn đứng (T4 chỉ báo số).
- (m) Lượt yên #71: **KHÔNG CÓ lượt hợp lệ** (T4-203: att1 WEDGED exit=3, att2 20/20 nhưng B2 vi phạm, att3 tickCost median 117,0 ms > 60 — chuỗi lượt yên hợp lệ 3 → 0, đề xuất). Live-check #22: **KHÔNG ĐẠT** (không có cửa sổ hợp lệ — chuỗi live ĐẠT 1 → 0, đề xuất). P3' cộng dồn GIỮ NGUYÊN 56 lượt hợp lệ (sổ md5 50f10815). Labellag (b) 0 occ → chuỗi 0 occ 3 → 0 (đề xuất). DEF §5 n≥4 (quyết (m)-202): att2 P3-A1 4/4, p=0,0027 < 0,01 — đủ ngưỡng n=4 NHƯNG attempt không hợp lệ nên KHÔNG cộng dồn; att3 P3-A1 n=1 → CHƯA KẾT LUẬN.
- (n) Stall/outage: **1 kẹt harness mới (#32)** (cộng dồn 31 → 32). Reboot #136 giữa harness (btime 01:09:53Z, gap #135→#136 = 7.377 s — T01-204 survey). Run 212 FAILED 23:34:50Z cf 103 s → CA MỚI #33 (T7-203); cửa slot LÀNH (chuỗi 0 → 1, T7-203); 0 lặng mới (max gap 1.579,828 s — T7-203); S11 = OUTAGE #9 đã chốt ở (n)-202. ENOSPC #135 = 78 dòng lúc T56 đóng (T56-203).
- (o) Auto-trigger: T9-203 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-203; trong cửa sổ T4: xem T4-203.done (poller thoát 00:33:38Z).
- (p) Vi phạm: **T8 0 vi phạm** (waiter 0 dòng log trong W1 — F-203-T8-1 đã chứng minh; vòng chờ nền chỉ đọc; harness chạy SAU T4 .done; gate-check 6/6 lần "T4 khong giu lock"). Vi phạm luồng khác (giao parent phán): T2 ghi 7 file trong W1c (F-203-T2-1, VI PHẠM NHẸ đề xuất); T56 prune trong W1a — xóa 1 file + ghi 2 file (F-203-T56-2, VI PHẠM NHẸ đề xuất); T4-203 ghi nhận chồng lấn W1 tổng W1a 9 + W1b 4 + W1c 15 file (F-203-T4-4).
- (E-247) MỞ — không có dữ kiện mới đợt này từ T8 (T9-203 chưa đóng; xem LIMITS T9-203).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-203t8.sh, md5 56fb7ad3, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — kẹt #32 nằm ở startPlaying (trước W1), không phải W2; driver chạy lại 84l10 cũng KHÔNG chạy (kẹt thật đã chẩn đoán đủ bằng diag-stall ×2 + WATCHDOG + probe, không phải flake như E4 đợt 201). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~01:29Z)

- preview.tsx `25dcc7cc` (**ĐỔI so với 477a0eac đợt 198–202 — do P2-203, đã `.done`**); media.ts `ac89aeb2` (không đổi); vite.config.ts `ee80d093` (không đổi); psolaWorkletSource.ts `1f2a5873` (P1-203, sửa lần cuối 00:52:22Z); psolaPitch.js `23445b2f` (không đổi). **Harness WebKit chạy trên cây preview 25dcc7cc + worklet 15421aed (snapshot trước harness 00:51:49Z) → 1f2a5873 (sau sửa 00:52:22Z); harness Chromium chạy trên cây cuối 1f2a5873 (P1 đã `.done` 01:02:46Z).**
- Fixture rebuild 2 lần (23:56Z trên #135 + 01:15Z trên #136 sau khi /tmp bị xóa): md5 khớp đợt 125 cả 4 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã rebuild xong trước harness Chromium. baseline-meminfo.txt ghi được (smoke mới).

## 6. Dọn dẹp + kiểm cuối (extract-203t8.py, chạy 01:28Z)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 0.
- Symlink t8-diag-stall.sh: cả 3 nơi → diag-stall-203t8.sh (2 nơi hidden_files sửa lúc mở; apps/web/scripts sửa lúc đóng — xem F-203-T8-5).
- Lock vite-lock-v2: TRỐNG (0 ticket + 87 cooldown) — lock stale của driver WebKit chết đã nhả tay 01:14:27Z (giữ 266 s).
- Vite: không còn vite nào của T8 chạy (driver Chromium exit sạch 01:23:17Z). Chrome/Chromium: 0 process T8 còn lại.
- **T4 .done ĐÃ CÓ TRƯỚC khi harness chạy** (00:45Z — GATE-FOUND 00:48:32Z; harness WebKit 00:51:57Z). **T56 .done ĐÃ CÓ lúc T8 đóng** (POSTBOOT #135 CÓ + watcher-203 pid 296433 — watcher chết theo reboot #136, xem §9).
- Bằng chứng giữ nguyên trong smoke/ (6 log pha + ram log + summary ×2 + replay .out ×3 (+pre/+post), extract .out, waiter log, selfcheck #1/#2/#3, rebuild-fixtures ×2, 4 thư mục stall).

## 7. Giới hạn

- Harness TÁCH 2 BOOT: WebKit 2/3 hợp lệ trên #135 (1 FAIL + 1 PASS + 1 nhiễm) + Chromium 3/3 trên #136; KHÔNG có harness 6/6 trên 1 boot đợt này. O8 T01 3/3 trên #135.
- T8 đóng TRONG hạn cờ (~01:35Z vs ~02:00Z).
- POSTBOOT_PASS #135 CÓ (poll=1, repair-som-quyet-h — T56-203; caveat (b1) thuộc parent (c)-203). #136 CHƯA CÓ CỜ (chưa repair — T56-203 đã đóng trước reboot; survey + repair #136 thuộc đợt 204/parent).
- Sampler: chỉ n=16 (pha Chromium); mẫu pha WebKit mất do ghi đè (F-203-T8-2) — số RAM pha WebKit chỉ còn 3 điểm chẩn đoán stall + selfcheck.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-203-T8-1 (WAITER GHI LOG TRONG W1 — ĐÃ SỬA, sửa F-202-T8-4):** wait-t4-t5-203t8.sh kiểm `$HF/round203-t4/W1-ACTIVE` đầu mỗi poll; khi file tồn tại thì chỉ sleep 60 s, KHÔNG ghi bất kỳ dòng log nào. **ĐÃ CHỨNG MINH:** waiter bỏ qua 16 poll rơi vào 3 cửa W1 (poll 21–32 + 35–38 vắng khỏi log); **0 dòng log nào của waiter trong W1** (W1a 00:15:21–00:23:03Z, W1b 00:23:25–00:26:54Z, W1c 00:28:56–00:33:14Z). GATE-FOUND poll=54 00:48:32Z đúng sau khi W1 đóng.
- **F-203-T8-2 (DRIVER CHROMIUM GHI ĐÈ RAM LOG CỦA DRIVER WEBKIT — MẤT MẪU):** run-chromium-203t8.sh khởi tạo sampler bằng `: >`/`>` ghi đè `smoke/ram-203t8.log` nên toàn bộ ~36 mẫu pha WebKit (00:52–01:09:58Z) bị mất; file hiện tại chỉ còn n=16 mẫu pha Chromium. Số RAM pha WebKit còn lại: 3 điểm chẩn đoán stall + selfcheck #1/#2 + free lúc driver start. **CHƯA SỬA trong đợt (phát hiện lúc đóng):** đợt 204 driver thứ hai phải append (`>>`) hoặc ghi file ram riêng theo driver (vd `ram-203t8-chromium.log`).
- **F-203-T8-3 (REPLAY-F-FIX v2_class CŨ — ĐÃ SỬA):** danh sách `v2_class` hardcode 6 kẹt (comment còn ghi "Tong ket = 10") nên 203-ket-84l10 (V2 bắt @125 s) không được tính: in "V2 bắt kẹt có HB128: 6/6" + "KẾT HỢP V2+V4: 11/12" dù ĐẠT. **ĐÃ SỬA:** thêm "203-ket-84l10" vào v2_class + sửa comment (Tổng kẹt = 12; V4 = 179/180/192/197/198); chạy lại: **V2 7/7, KẾT HỢP 12/12 — ĐẠT**.
- **F-203-T8-4 (REPLAY-WALLCLOCK HARDCODE 6 — ĐÃ SỬA):** `ok_v5` yêu cầu `len(v2class_nofire) == 6` + in "/6" nên khi corpus thêm kẹt đóng băng thứ 7 (203-ket) thì kết luận lật thành "V5 CHUA DAT" dù V5 vẫn 5/5 mù + 0 FP (không fire trên kẹt lớp V2 là đúng thiết kế). **ĐÃ SỬA:** đếm động `n_v2class` = tổng kẹt trừ 5 kẹt mù (silent_class); chạy lại: **"V5 khong fire 7/7 — dung thiet ke", "V5: DAT", "KET LUAN: V5 DAT"**, hồi quy 68/68 khớp.
- **F-203-T8-5 (SYMLINK THỨ BA Ở apps/web/scripts CHƯA SỬA):** extract-203t8.py kiểm 3 symlink nhưng T8 chỉ sửa 2 nơi hidden_files lúc mở (F-202-T8-5); symlink `apps/web/scripts/t8-diag-stall.sh` vẫn trỏ diag-stall-201t8.sh tới lúc extract chạy 01:28Z mới phát hiện. **ĐÃ SỬA:** ln -sf về diag-stall-203t8.sh ~01:29Z; kiểm readlink cả 3 nơi lúc đóng đều → 203t8. Bài học: kiểm readlink CẢ 3 nơi lúc mở (F-200-T8-1/F-202-T8-5 chỉ kiểm 2 nơi).
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → đợt 200: 84,7%; đợt 201: 82,6%; đợt 202: 88,3%; đợt 203 (pha Chromium): **88,8%** (nặng nhất kể từ 200 — theo dõi đợt 204). F-196-T8-9 (baseline-meminfo EPERM) → đợt 199 + 200 + 201 + 202 + 203 đều ghi được (smoke mới). F-193-T8-1 (waiter reboot) → đợt 203: reboot #136 giết driver harness (lần 5 waiter/driver chết theo reboot, sau các đợt 193/198/201/202) — nhưng waiter đã GATE-FOUND xong trước reboot nên không ảnh hưởng gate. F-200-T8-1 (symlink) → đợt này sửa cả 3 nơi lúc đóng (xem F-203-T8-5). F-200-T8-2 (P6 landed sớm) → đợt này P6-wait đủ 90 s trên Chromium #136 (18 dòng); WebKit 86n2 nhiễm nên không có dữ kiện P6-wait WebKit. F-200-T8-3 (muse.edit báo lỗi nhưng vẫn áp dụng) → đợt này viết LIMITS bằng muse.write toàn file, không edit từng phần. F-201-T8-1 (corpus mất entry) → đợt này GIỮ entry 202 + thêm entry 203 (kiểm: f-fix 68 entry, 66 có file + 2 mới; 1c 70 entry, 68 + 2). F-201-T8-2 (nhãn fail gắn sạch) → đợt này 2 entry 203 gắn nhãn đúng kết quả thật (203-ket-84l10 + 203-sach-85m4; log 86n2 WebKit nhiễm KHÔNG đưa vào corpus). F-201-T8-3 → F-202-T8-1 (đã sửa). F-201-T8-4 (waiter phiên 2 chết không reboot) → đợt này waiter 1 phiên sống tới GATE-FOUND — KHÔNG tái diễn. F-201-T8-5 (check-fresh --now=X) → đợt này dùng dạng tách riêng + parser đã sửa — B2 offline khớp hệt + live từng pha đo bằng --now/--until=last_ts.

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 203)

- (j) **V5 GIỮ LIVE?** (đề xuất: GIỮ — 5/5 kẹt mù, 0 FP trên 53 log sạch; V2 7/7 + V4 5/5 = 12/12 kẹt; live đợt này V2 bắt #32 @125 s, V5 0 trigger đúng vì không có kẹt im lặng); 84l10 FAIL — chuỗi PASS 1 → 0; **86n2-P1 chuỗi 23 → 24?** (chỉ có dữ kiện Chromium — parent quyết); B2 vùng mới sạch 16 → 0 (trigger tại startPlaying); B1 live 1 trigger (đợt KHÔNG sạch — chuỗi live sạch 1 → 0).
- (b) FULL PASS KHÔNG CÓ (chân harness KHÔNG 6/6 + chân yên #71 KHÔNG HỢP LỆ + chân O8 3/3 ĐẠT; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #135 CÓ (poll=1, repair-som-quyet-h — T56-203; caveat (b1) T56 đề xuất, parent quyết (c)-203); #136 CHƯA CÓ CỜ (chưa repair/survey).
- (e) #135: **T01-203 xác nhận ỨNG VIÊN** (survey 9 nguồn tươi; marker 85 không đổi, KHÔNG tự nâng lên 86 — T01-203); #136: **ỨNG VIÊN, CHƯA SURVEY** (reboot 01:09:53Z trong lúc harness; T01-204 survey + (m) thuộc T2-204); marker 85 → 86 nếu parent chấp nhận #135 (T56 đề xuất).
- (f) **(m) — #132 DƯƠNG (CUỐI), #133 0 (CUỐI), #134 DƯƠNG (CUỐI)** (T2-203); **#135 THÔ DƯƠNG** (+39,567879 s — CUỐI thuộc T2-204); n 59/62 → 61/65 (T2-203); **B-#131 FALSE** (FULL176 chuẩn (d)-202: n=177; chuỗi B GIỮ 1); (m) #56 lần 45 VẪN CÓ ĐIỀU KIỆN (T2-203).
- (i) Holder: #135 KHÔNG GIẾT — chuỗi 10 → 11 (đề xuất, T56-203). (A) 120/120 lần 52 (T56-203). Suite 9/9 × 6, chuỗi xanh 83 → 84 (đề xuất, T56-203). **Caveat chuỗi: suite/(A)/holder đo trên #135, lượt yên #71 đo trên #135, harness WebKit 2 pha đầu trên #135, harness Chromium 3 pha trên #136, O8 đo trên #135 — harness TÁCH 2 BOOT (khác đợt 202: mọi chân cùng boot #134 trừ O8).**
- (m) Lượt yên #71 KHÔNG CÓ lượt hợp lệ — chuỗi 3 → 0 (đề xuất). Live #22 KHÔNG ĐẠT — chuỗi 0 → 1 → 0 (đề xuất). P3' cộng dồn GIỮ 56 lượt (sổ md5 50f10815).
- (n) Kẹt #32 mới (cộng dồn 31 → 32); reboot #136 giữa harness (gap #135→#136 = 7.377 s); run 212 FAILED → CA #33; cửa slot LÀNH — chuỗi 0 → 1 (T7-203); 0 lặng mới; ENOSPC #135 = 78 dòng (T56-203); watcher-203 chết theo reboot #136 (respawn thuộc T56-204/parent).
- (p) Vi phạm: **T8 0 vi phạm** (waiter 0 dòng trong W1 — đã chứng minh). T2 ghi 7 file trong W1c (F-203-T2-1 — VI PHẠM NHẸ đề xuất); T56 prune trong W1a — xóa 1 file + ghi 2 file (F-203-T56-2 — VI PHẠM NHẸ đề xuất); chồng lấn W1 tổng W1a 9 + W1b 4 + W1c 15 file (F-203-T4-4 — giao parent phán). Chuỗi 0 vi phạm GIỮ 0 (đợt có vi phạm).
- (q) Đếm: T01-203 KHÔNG đếm đợt 203 (theo giao (r)-202); lũy kế/chờ push xem (q) aggregate 203 (T10 đếm toàn cục). T8 đóng góp 1 LIMITS (+ scripts).
- **Mạo danh vẫn hoạt động trong lượt 203 (T5-203 báo, T8 không xác minh nội dung):** `hidden_files/round202-fabricated-0646Z/aggregate-202-fake-0646Z.md` (75.747 B — bằng đúng kích thước aggregate 202 thật — 23:51Z) và `hidden_files/round202-parent-verify/` xuất hiện SAU khi parent đóng đợt 202. §14.2 aggregate 203 để trống cho parent (theo quy tắc đứng).
- Chờ push 191–202 = (q)-202 (146/531/401/380) + batch đợt 203 (T10 đếm cuối).

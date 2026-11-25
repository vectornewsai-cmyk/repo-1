# T9-187 baseline notes (ghi lúc mở phiên)

## Mở phiên — 20:41–20:45Z 24/11/2026

- Đợt mở lượt cron 03:35 +07 (= 20:35:51Z); T9 bắt đầu ~20:41:50Z (boot+11m17s).
- Boot mới `6f1d9f87-7b23-4e5b-b2f5-597e6de37db4`, btime **20:30:33Z** (uptime -s; journal first entry 20:30:44Z = boot+11s).
  Boot trước trong phiên T9-186: `7ea9d047` btime 19:09:52Z → gap = **4.841 s (1h20m41s)**.
  Số hiệu: 7ea9d047 là ứng viên #108 (T8-186) → boot mới là **ứng viên #109** — CHỜ T0-187 xác minh 9 nguồn.
- **Cửa sổ thoáng boot mới: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 20:30:33Z TRƯỚC khi đợt mở 20:35:51Z;
  cửa sổ (mẫu #103/#105/#107: mở ~boot+61–62s, đóng trước ~boot+92s) đã đóng ~20:32:05Z,
  ~9,5 phút trước probe đầu tiên của T9 (20:44:33Z, boot+14m00s = 0). Lần thứ ba liên tiếp
  boot không quan sát được cửa sổ (2 boot đợt 186 + boot này) — xem F-187-T9-4.
- Headroom probe đầu (open-187, 20:44:33Z, boot+14m00s): **0** (trần 63.747 không đổi).
- Daemon: sampler (pid 3290, từ 20:42:42Z) + b2watch (pid 4246, từ 20:43Z) + probe-loop (pid 43812, từ 20:44Z).
  Khởi động gặp lỗi `&`-chain (2 lần probe-loop chạy sai cwd / chết) — đã sửa, cả 3 daemon đang chạy.
  Bài học: mỗi daemon khởi động bằng MỘT exec riêng, không nối `&` nhiều lệnh trong cùng một dòng.
- RAM mở phiên: avail 1.134.924 kB (20:42:42Z) → 898.208 kB (20:44:42Z); balloon 5.635.768 → 5.906.568 kB
  (leo nhanh ~135k/phút — sẽ chạm trần 6.443.824 kB trong ~4 phút nếu giữ nhịp).
- B2: 0 spike lúc 20:45Z (load1 sampler max 2,54 < 3,0).
- ENOSPC: 5 dòng lúc 20:42Z → 8 dòng lúc 20:45:27Z (vẫn đang xảy ra, ~1 dòng/phút).
  Dòng đầu **20:37:12Z = boot+399s (boot+6m39s) — MUỘN** (phá mẫu ~110s lần thứ ba:
  #104 boot+22m53s, #107 boot+17m05s, boot mới boot+6m39s); journal phủ từ boot+11s nên muộn là thật.
  Dòng cuối lúc 20:45Z: 20:45:12Z.
- E-233 (đợt 186, 2 mẫu trên 7ea9d047, VẪN GHIM lúc T9-186 đóng 19:53:26Z): kết cục thuộc đợt này.
  Khoảng mù sampler giữa hai đợt 19:53:26Z → 20:42:42Z (~49 phút) — sag trong mù không loại trừ được
  (cùng caveat như E-229); T9 phán "kết thúc bởi reboot #109 (ứng viên)" — T10/parent quyết cuối.
- Aggregate 186 (T10-186) CHƯA xuất bản lúc mở phiên → **§12.3-186 CHƯA CÓ**:
  F-186-T9-2 (tách E-232/E-233) và F-186-T9-1 (guard mở lần đầu? auto-trigger?) đều **CHƯA QUYẾT** —
  T9-187 giữ cách tách hiện hành (≥3 mẫu dưới trần = tách), KHÔNG tự thêm auto-trigger.
- GAP §114 đã đọc (đợt 185); aggregate 185 §12.3 đã đọc: (h) tách E-227/E-228 GIỮ TÁCH;
  (j) B2 MỞ TỪ ĐỢT 186; (l) headroom "chỉ theo dõi" lần 45; (p) chuỗi 0 vi phạm 0 → 1.

## Cập nhật giữa phiên — kiểm 1 (20:47Z)

- T0-187 survey 20:43:19Z: btime epoch 1795552233 = 20:30:33Z ✓; /proc/1 mtime 20:30:44 (btime+11s,
  khớp mẫu — KHÔNG có dấu hiệu đồng hồ nhanh ở boot này); journal từ 20:30:44; wtmp reboot 20:30;
  marker không đổi; **libevent MISSING lúc 20:43:19Z** (như #107 lúc 17:41Z — chờ heal sau replay, thuộc T0/T5).
- Số hiệu: T7-186 xác nhận **#108 = 7ea9d047** (btime 19:09:52Z; "KHÔNG có #109" lúc đóng 19:56:07Z)
  → boot mới 6f1d9f87 là **ứng viên #109**. Lưu ý: survey T0-187 có dòng grep "no POSTBOOT_PASS for #108 yet"
  (có thể là nhãn script cũ) — giao T0-187/T10 làm rõ; T9 dùng "boot mới 6f1d9f87 (ứng viên #109)".
- Sampler 20:45:42Z: balloon SAG 5.906.568 → 5.527.436 kB, avail nhảy 898.208 → 1.332.448 kB — balloon
  biến động mạnh đầu boot (chưa ghim).
- Run 187 vẫn RUNNING lúc T7-186 đóng (viết lại ×1 tại #108, jitter 0; kết cục thuộc T7-187).

## Cập nhật giữa phiên — REBOOT MỚI + khởi động lại daemon (21:14–21:16Z)

- **REBOOT MỚI giữa phiên (boot `912f4a97-0841-47eb-805f-d7bbccaecd17`, btime 21:13:21Z).**
  Gap boot 6f1d9f87 (20:30:33Z) → boot mới = **2.568 s (42m48s)** — ngắn nhất trong chuỗi gần đây
  (mẫu ~7.200 s; #107→#108 = 6.602 s; #108→#109-cand = 4.841 s). Số hiệu: ứng viên **#110**
  (nếu 6f1d9f87 = #109) — CHỜ T0-187 xác minh.
- Cả hai sleep chờ lan-2 của T9 bị **SIGTERM theo reboot** (mẫu F-185-T9-5/F-186-T9-5, tái diễn lần 10);
  sampler + b2watch + probe-loop CHẾT theo reboot. T9 phát hiện lúc 21:14:28Z.
- **Đồng hồ nhanh trước reboot — F-186-T9-3 TÁI DIỄN (giao T0-187):** mẫu sampler cuối trên boot cũ
  ghi 21:13:43Z mang boot_id cũ — SAU btime boot mới (21:13:21Z) 22 s. Thời gian thật của mẫu ≈ 21:13:21Z
  trở về trước; độ nhanh ~22 s (cùng bậc F-186-T9-3: ~16–30 s).
- Sampler boot cũ: 31 mẫu (20:42:42–21:13:43Z); balloon cuối 4.949.248 kB (đang leo lại sau sag giữa phiên);
  avail cuối 1.856.988 kB; load1 max giai đoạn này ~2,68.
- **Cửa sổ thoáng boot mới: KHÔNG QUAN SÁT ĐƯỢC (lần thứ ba liên tiếp).** Phát hiện reboot lúc 21:14:28Z
  (boot+67s — ĐANG TRONG cửa sổ mẫu boot+61–92s) nhưng probe tay chạy lúc 21:15:15Z (boot+114s) = 0 —
  độ trễ giao handoff + khởi động exec ~47 s nuốt mất cửa sổ. Bài học F-186-T9-4 chưa khắc phục được:
  handoff nền vẫn chậm hơn cửa sổ ~30 s.
- Daemon khởi động lại 21:15:45–21:16Z (sampler pid 4701, b2watch pid 5114, probe-loop — tag đổi thành
  reopen-187/lan-2r…lan-5r để phân biệt với lần chạy đầu). Gap mẫu sampler qua reboot ≈ 21:13:43Z → ~21:16:45Z (~3 phút).
- ENOSPC boot mới: 0 dòng lúc 21:14Z (journal bắt đầu 21:13:32Z = boot+11s); dòng đầu chờ kiểm (~21:15:11Z nếu theo mẫu ~110s).
- B2 boot cũ: 94 spike (đếm lúc 21:14Z) — phân cụm sau khi đóng băng log.
- MemAvailable boot mới lúc 21:15:15Z: 1.816.636 kB; balloon 4.930.388 kB (đã cao ngay boot+114s).

## Cập nhật giữa phiên — kiểm 2 (21:46Z) + quyết §12.3-186 (21:49Z)

- Headroom: 4 lần đo toàn 0 (open-187 20:44:33Z, win-new2 21:15:15Z, reopen-187 21:16:11Z,
  lan-2r 21:46:11Z); trần 63.747 không đổi.
- ENOSPC boot mới 912f4a97: 26 dòng lúc 21:46Z; dòng đầu 21:15:07Z = **boot+106s — TRỞ LẠI mẫu ~110s**
  (sau 2 boot muộn liên tiếp #107 +17m05s, #109 +6m39s); dòng cuối 21:46:06Z — lỗi VẪN ĐANG XẢY RA.
- B2: 101 spike lúc 21:46Z (94 trên #109 + 7 trên boot mới tính tới lúc đó); 0 spike trong cửa
  attempt1 #56 (21:05:39–21:09:04Z — load1 sampler trong cửa chỉ 0,39–1,62 < 3,0).
- **Aggregate 186 §12.3: SẠCH — parent viết trực tiếp 21:07Z, KHÔNG điền sẵn** (lần đầu sạch kể từ
  đợt 183; pre-fill count GIỮ 18). Parent kiểm dedup python CHỈ python, KHỚP TỪNG SỐ lần thứ 99.
- Quyết (e): **6f1d9f87 = #109 XÁC NHẬN** (7ea9d047 = #108; cea79500 = #107; #106 chưa xác minh).
  → boot mới 912f4a97 là ứng viên #110 (T0-187 đã đóng trước reboot 21:13:21Z — số hiệu chờ T0-188).
- Quyết (h): **F-186-T9-2 GIỮ TÁCH** (E-232/E-233 tách) — T9-187 áp dụng quy tắc đứng.
- Quyết (p) F-186-T9-1: **(i) TÍNH LÀ "guard mở lần đầu"** (3 mẫu ≥ guard, max 106,0%);
  chuỗi 0 lần chạy vẫn 40 đợt. **(ii) ĐỒNG Ý auto-trigger về nguyên tắc — T9-187 thiết kế +
  kiểm OFFLINE; live từ đợt 188 nếu đạt (parent xem lại §12.3-187).**
- **Auto-trigger ĐÃ THIẾT KẾ + KIỂM OFFLINE XONG 21:50Z: 13/13 PASS**
  (`sampler-autotrigger.py` + `test-autotrigger-offline.py` + `birefnet-autotrigger-DESIGN.md`;
  log `test-autotrigger-offline-output.txt`). KHÔNG bật live đợt này (đúng quyết).
- T4-187: **#56 CÓ LƯỢT HỢP LỆ ngay attempt đầu** (attempt1-6f1d9f87, 21:05:39–21:09:04Z, 20/20,
  median 39,0 ms, B 5/5) — chuỗi lượt yên tính lại từ 1 (parent quyết cuối).
- T0/T1/T2/T4/T5/T6-187 đã đóng cờ; T7/T8 chưa đóng lúc 21:46Z.

# PHASE9_ROUND144_T5_INFRA_LIMITS — 2 BOOT (691a7403 #106? + cc222c8a #107?), REPLAY CẢ HAI ĐỀU CHẠY TỐT (1545/221) → postboot PASS poll=2 CẢ HAI, KHÔNG CẦN REPAIR → GSTREAMER "3 PHIÊN BẢN" ĐÓNG: CHUỖI THẬT CHỈ 0.1 → 0.2 (BUMP SECURITY-POCKET) → GATE0 MỚI (QUYẾT PARENT (j) ĐỢT 143) KIỂM CHỨNG THỰC TẾ LẦN ĐẦU: T4 MỞ CỬA POLL #5 BẰNG T4-CHECK-ONLY, TRƯỚC CỜ T5 1'52" → REBOOT #31 GIỮA LƯỢT GIẾT SAMPLER B1 (n=13) → BALLOON 0/53 MẪU GHIM TRẦN (ĐỨNG CHUỖI ĐÓNG BĂNG) → HEADROOM 1289 → 1193

> Luồng T5, đợt 144, lượt cron 12:35 +07 19/11/2026 (mở 05:35:51Z;
> T5 mở thực tế 05:38:38Z, t5-start 05:39:52Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **2 BOOT trong phiên T5: 691a7403** (btime 03:55:45Z — **KHỚP
> brief**; #106? TẠM theo đếm chặt, quyết parent đợt 143) **+ cc222c8a**
> (btime 05:53:15Z — **#107? TẠM** theo đếm chặt; reboot #31 giữa lượt).
> Cả hai boot replay **CHẠY TỐT, XONG HẲN**: 1545 dòng / 221 installs /
> 462 configure, gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2** cả hai.
> **KHÔNG cần --repair lần nào.** Postboot PASS poll=2 cả hai boot;
> cờ `POSTBOOT_PASS` ghi cho boot 1 lúc 05:43:07Z, ghi lại cho boot 2
> lúc 06:00:44Z (cùng file, ghi đè — mẫu các đợt nhiều boot).
> **Gstreamer "phiên bản thứ ba": ĐÓNG.** Chuỗi thật chỉ là **0.1
> (đợt 140/141) → 0.2 (đợt 143/144)** — một lần bump security-pocket
> bình thường; "1.1ubuntu2" đợt 142 đã đính chính là ghi nhầm từ
> fontconfig (xem §3.6, bằng chứng mới: fontconfig 1.1ubuntu2 cũng
> xuất hiện trong dpkg.log boot 691a7403, 3 phút trước dòng gói cuối).
> **Gate0 mới (quyết parent (j) đợt 143) KIỂM CHỨNG THỰC TẾ LẦN ĐẦU —
> HOẠT ĐỘNG ĐÚNG:** T4 mở cửa yên boot 2 ở poll #5 (05:58:52Z) bằng
> `gate0=T4-check-only`, **trước cờ T5 cho boot mới (06:00:44Z) 1'52"**;
> cờ T5 vẫn là chính khi có (T4 đọc cờ T5 ở poll #1 boot 1, 05:44:12Z,
> ~1 phút sau khi T5 ghi). **Reboot #31 (691a7403 → cc222c8a, btime
> 05:53:15Z)** giết sampler series 1 (n=13) + sleep chờ của T5 +
> poller T4 giữa attempt2 boot 1. **Balloon 0/53 mẫu ghim trần kẹt
> 6.443.824 kB** (series 1: 0/13; series 2: 0/40) — chuỗi đóng băng
> (đợt 138–143) **ĐỨNG** ở phía T5; T9 sampler dài là luồng xác nhận
> độc lập. **RAM max 48,8% guard — không có cửa sổ birefnet.**
> **Headroom 1289 (mở, boot 1) → 1193 (cuối, boot 2)** — vẫn DƯỚI
> ngưỡng báo ~1.800, lần thứ 4 liên tiếp; tỉ lệ/vite ~0,82 → ~0,76.
> **WFS #50 chênh 0** (50 lần liên tiếp). **KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production** (preview.tsx giữ 530e10a7).
> **KHÔNG tự chạy birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 1 — 691a7403 (#106? TẠM, btime 03:55:45Z): REPLAY CHẠY TỐT,
   ĐÃ XONG TRƯỚC KHI T5 MỞ.** dpkg.log **1545 dòng / 221 installs /
   462 configure**, md5 `da31ab1b…`, mtime 04:00:38Z (boot +4m53s),
   gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**; bracket replay
   (configure 03:56:19Z boot +34s → xong 04:00:38Z boot +4m53s) —
   nhanh thứ 2 trong các replay đầy đủ (sau #96? +3m52s). Cache apt
   **SỐNG qua reboot: 180 .deb / 156M** (khác đợt 142/143: 0 .deb —
   F-141-T5-4 giữ nguyên: sống/không sống KHÔNG NHẤT QUÁN). Lists
   **37**, partial 0; GST hệ thống là **thư mục thật 269/269** (không
   symlink); /var/log/apt có (50 Start-Date). Postboot **PASS ngay
   poll0 (05:39:52Z, exit 0)** + poll1 + poll0b sau sửa header.
2. **CỜ POSTBOOT_PASS BOOT 1 ghi 05:43:07Z poll=2**
   (`boot_id=691a7403-512b-4055-bb55-de0d7516eeeb btime=
   2026-11-19T03:55:45Z pass_at=2026-11-19T05:43:07Z poll=2
   repair=none/replay-full dpkg=1545/221`) — T4 đã đọc ở **poll #1
   (05:44:12Z**, ~65 s sau khi ghi; t5flag=PASS(t5src=
   144-t5/POSTBOOT_PASS), postboot_exit=0, dpkg_lines=1545) và **MỞ
   CỬA YÊN NGAY poll #1** (gate A 1815 MB), chạy attempt1 lượt yên
   #19 (20/20, median 44,0 ms — nhưng B2 vi phạm thật, load1 max
   4,06 theo sampler T4; việc của T4).
3. **REBOOT #31 GIỮA LƯỢT (691a7403 → cc222c8a, btime 05:53:15Z).**
   Boot 1 sống **1h57m30s** (03:55:45Z → 05:53:15Z). Khung chết boot 1
   theo T5: **(05:52:15Z, 05:53:15Z] (60 s)** — mẫu sampler cuối
   05:52:15Z còn sống, btime boot mới 05:53:15Z; caveat: mẫu sampler
   05:53:15Z trùng btime boot mới (đồng hồ cũ chạy nhanh hoặc mẫu
   ghi tại ranh giới reboot — xem F-144-T5-1). Reboot giết: sampler
   series 1 của T5 (dừng ở n=13), lệnh sleep chờ của T5 (SIGTERM),
   poller T4 giữa attempt2 boot 1. **T5 viết lại cờ cho boot mới
   theo nghĩa vụ thường trực (A)** — xem §4.
4. **BOOT 2 — cc222c8a (#107? TẠM, btime 05:53:15Z): REPLAY CHẠY TỐT,
   T5 THEO DÕI LIVE TỪ ĐẦU.** Lúc T5 kiểm lại (05:54:24Z, boot
   +1m09s): dpkg 2 dòng, configure 05:54:03Z (boot +48s), apt-get
   update pid 811 đang chạy, partial 32 file đang tăng — replay
   **ĐANG SỐNG, KHÔNG phải dạng (B)**. Postboot poll0 FAIL exit 1
   (05:54:57Z, 0/11 gói — đúng vì replay mới bắt đầu). Replay xong
   **05:57:30Z (boot +4m15s)**: dpkg 2 → 161 (05:54:57Z) → 1388
   (05:56:57Z) → **1545 dòng / 221 installs**, gói cuối
   gstreamer1.0-tools **1.24.2-1ubuntu0.2** (md5 `3569903e…`,
   đóng băng tới lúc T5 đóng). Cache sống 180 .deb / 156M (y hệt
   boot 1 — cache sống qua reboot lần 2 liên tiếp trong đợt này);
   lists 39, partial 0; GST thật 269/269. Postboot **PASS poll1
   (05:58:41Z) + poll2 (06:00:36Z)**, 0 proc.
5. **CỜ POSTBOOT_PASS BOOT 2 ghi 06:00:44Z poll=2**
   (`boot_id=cc222c8a-d8e2-4244-bcbc-1997b4099864 btime=
   2026-11-19T05:53:15Z pass_at=2026-11-19T06:00:44Z poll=2
   repair=none/replay-full dpkg=1545/221`) — ghi đè file cờ boot 1
   trong cùng thư mục round144-t5/ (mẫu các đợt nhiều boot; nội dung
   cờ boot 1 còn trong poll log T4 + LIMITS này).
6. **GATE0 MỚI — KIỂM CHỨNG THỰC TẾ LẦN ĐẦU, HOẠT ĐỘNG ĐÚNG
   (§4).** Poller T4 chạy lại 05:55:51Z cho boot 2: poll #1–#4
   gate0=khong-dat (cờ T5 mốc cũ 143-t5 bị từ chối đúng — poller
   validate boot_id); **poll #5 (05:58:52Z) gate0=T4-check-only
   (pb_age=0) → CỬA YÊN MỞ**, chạy attempt1 ngay — **trước cờ T5
   boot 2 (06:00:44Z) 1'52"**. Đây là lần đầu quy trình dự phòng
   (quyết parent (j) đợt 143) chạy thật, và nó đã cứu lượt yên #19
   khỏi kẹt như đợt 143 (16 poll thỏa mọi thứ trừ cờ). T5 KHÔNG đề
   xuất thêm phương án nào — parent đã quyết, T4 đã áp dụng, T5
   chỉ ghi nhận + tiếp tục nghĩa vụ (A) viết cờ cho boot mới.
   Lưu ý: lượt yên #19 trên boot 2 vẫn KHÔNG có verdict hợp lệ
   theo poller T4 (3 attempt 20/20 đều bị lớp B loại; hậu kiểm T4
   cho thấy 2/3 lần loại là sai — B4 giả-dương + B2 tính trên mẫu
   trộn 2 boot; attempt3 median 55,0 ms là ứng viên #19 hợp lệ,
   CHỜ PARENT QUYẾT — việc của T4/T10, T5 chỉ ghi nhận).
7. **GSTREAMER — THREAD "3 PHIÊN BẢN" ĐÓNG (§3.6).** Madison hiện
   tại chỉ còn **1.24.2-1ubuntu0.2** (noble-updates + noble-security)
   và 1.24.2-1 (noble/main); **1ubuntu0.1 ĐÃ BIẾN MẤT khỏi cả 2
   mirror**. Hai boot đợt này đều cài **0.2** (đọc trực tiếp dpkg.log
   cả hai). Chuỗi thật: **0.1 (đợt 140/141) → 0.2 (đợt 143/144)** —
   một lần bump security-pocket bình thường giữa đợt 141 và 143.
   "1.1ubuntu2" không tồn tại ở bất kỳ source nào (xác nhận lại
   đợt này) và fontconfig **2.15.0-1.1ubuntu2 xuất hiện trong
   dpkg.log boot 691a7403 lúc 03:57:38Z, đúng 3 phút trước dòng
   gói cuối** — cùng mẫu như boot 9afdaa89 — củng cố kết luận ghi
   nhầm của T5-143.
8. **HEADROOM inotify MỞ 1289 (boot 1) → CUỐI 1193 (boot 2)**
   (trần 63747) — giảm −209 so với mở đợt 143 (1498) và −96 trong
   đợt; **Vẫn DƯỚI ngưỡng báo user (< ~1.800), lần thứ 4 liên
   tiếp**; tỉ lệ/vite ~0,82 → ~0,76. Theo quyết parent đợt 141
   (đã BÁO USER) + đợt 143 (chỉ theo dõi, nhắc một dòng): đợt này
   **chỉ theo dõi, không báo riêng**. Caveat: mức giảm −209 lớn
   hơn đà ~100–115/đợt — một phần có thể do các luồng khác đang
   khởi động lúc đo mở (fd cell-visible 429 → 504 trong phiên;
   xem F-144-T5-3).
9. **RAM SAMPLER — 2 SERIES (n=13 CẮT NGANG + n=40 ĐẦY ĐỦ), xem §5.**
   Series 1 (boot 1, cắt bởi reboot #31): avail 748.932–2.681.048
   kB (mean 1.798.965), gate A 12/13, max **42,6% guard**. Series 2
   (boot 2, đầy đủ): avail 611.092–3.071.196 kB (mean 1.681.804),
   gate A 32/40, max **2.999,2 MiB = 48,8% guard**. **0 mẫu ≥
   6.144 MiB cả hai series. Balloon 0/53 mẫu ghim trần kẹt
   6.443.824 kB** — series 1 balloon XẢ từ 5,85M xuống 3,49M;
   series 2 dao động 3,79–5,92M, không chạm trần. **Không có cửa
   sổ guard nào — không ai thử birefnet.** u2net fallback vẫn sẵn
   sàng (rembg 2.0.87 + model trên đĩa — xem §5.4).
10. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
    **2c384ed1**, vite.config.ts **ee80d093** (mở = lúc đóng);
    postboot script sửa 2 lần (`9db78cbe…` → **`dc3f137a…`** →
    **`4b156a7d…`**, chỉ header, KHÔNG đổi logic — xem §3.8).
11. **EPERM (T2-144, T5 chỉ đối chiếu): probe #63 ok=2 fail=0,
    boot=691a7403, 05:43:32Z**; mù #63 ĐÓNG HOÀN TOÀN (T2-144 —
    mù đầu tiên đóng hoàn toàn kể từ #60); gap #105?→#106? chứng
    nhận [7.210, 7.230] s → **CERT 64 / FULL 79** (T2-144, chờ
    parent xác nhận); **WFS scan #50: chênh 0** — NEWSTD 964/270,
    R7b 989/287, copies 25/17; delta +1/+1 giải thích trọn vẹn
    bằng 1 dòng mới của file LIMITS T5-143 (xem §7.3).
    **Async `.writeFile(`: đúng 2 helper đã biết, 0 stray.**
12. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
13. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 2 boot, 1 reboot giữa lượt (#31)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 691a7403 (#106? TẠM — đếm chặt, quyết parent đợt 143) | 03:55:45 (uptime -s; /proc/stat btime 1795060545; who -b 03:55; /proc/1 03:55:55 +10s) | 1h57m30s (03:55:45Z → 05:53:15Z) | Replay CHẠY TỐT, xong boot +4m53s (1545/221, gói cuối tools 0.2); postboot PASS poll0+poll1; cờ 05:43:07Z poll=2; T4 đọc poll #1, mở cửa yên ngay, attempt1 20/20 (B2 vi phạm thật); CHẾT bởi reboot #31 |
| 2 | cc222c8a (#107? TẠM — đếm chặt) | 05:53:15 (uptime -s; /proc/stat btime 1795067595; who -b 05:53; /proc/1 05:53:30 +15s) | còn sống (lúc T5 viết ~42' tuổi) | Replay CHẠY TỐT, T5 theo dõi live: configure boot +48s → xong boot +4m15s (1545/221, gói cuối tools 0.2); postboot FAIL poll0 → PASS poll1+poll2; cờ 06:00:44Z poll=2; T4 mở cửa poll #5 bằng T4-check-only (trước cờ T5 1'52") |

- **Btime boot 1 KHỚP brief** (03:55:45Z, 4 nguồn + khớp T7-143/T9-143).
  Btime boot 2 chốt bằng 3 nguồn lúc 05:54Z + kiểm lại lúc đóng
  (không đổi).
- **Reboot #31: 691a7403 → cc222c8a, btime 05:53:15Z** — xảy ra GIỮA
  LƯỢT (trong lúc T5 chờ sampler + T4 chạy attempt2 boot 1; lệnh
  sleep chờ của T5 bị SIGTERM cùng lúc — F-144-T5-1; sampler vòng 1
  của T5 + poller T4 bị giết cùng lúc). Khung chết boot 1 theo T5:
  **(05:52:15Z, 05:53:15Z] (60 s)** — mẫu sampler cuối 05:52:15Z
  còn sống (avail 2.071.532 kB), btime boot mới 05:53:15Z. Caveat
  đồng hồ: mẫu sampler 05:53:15Z trùng btime boot mới (xem
  F-144-T5-1).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 144** do
  parent tạo — KHÔNG phải đợt main-chat (tiền lệ đợt 130–143).
  T5 tiến hành bình thường.
- journalctl --list-boots: T5 KHÔNG kiểm đợt này (không cần cho
  kết luận; journal boot trước đã mất theo rootfs rebuild như
  mọi reboot — tiền lệ).
- Đánh số theo **đếm chặt (chuẩn parent từ đợt 144)**: 691a7403 =
  #106?, cc222c8a = #107?. T2-144 đã đính chính chuỗi INSIDE 4 → 2
  (9afdaa89 OUTSIDE vì gap 42 s < p10; 691a7403 INSIDE = 2; cc222c8a
  INSIDE hậu nghiệm = 3) — xem log T2-144 + LIMITS T2 §4.5(6),
  chờ parent hòa giải với MEMORY.md (vẫn ghi chuỗi 4).

## 3. dpkg replay — cả hai boot CHẠY TỐT, KHÔNG cần repair; đối chiếu gstreamer ĐÓNG

### 3.1 Replay boot 1 (691a7403) — xong trước khi T5 mở

| Hạng mục | Lúc mở (05:38–05:43Z) |
|---|---|
| dpkg.log dòng | 1545 |
| `status installed` | 221 |
| dòng chứa `configure` | 462 |
| dpkg.log md5 | `da31ab1b…` (không đổi tới lúc đóng boot 1) |
| dpkg.log mtime | 04:00:38Z (boot +4m53s) |
| startup configure đầu | 03:56:19Z (boot +34s) |
| cài thật | 03:56:49–04:00:38Z (install đầu libaspell15 03:56:50Z) |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (04:00:38Z) |
| cache apt | 180 .deb / 156M (SỐNG qua reboot) |
| lists / partial | 37 / 0 |
| GST hệ thống / debroot | thư mục THẬT 269 file / 269 |
| /var/log/apt | có (history.log 50 Start-Date, đầu 03:56:49Z) |
| proc apt/dpkg/wrapper | 0 |
| postboot check | PASS exit 0 (poll0 05:39:52Z + poll1 05:42:53Z + poll0b 05:43:28Z) |

- Bracket replay boot 1: **(boot +34s, boot +4m53s]** — nhanh thứ 2
  trong các replay đầy đủ đã kẹp (sau #96? +3m52s; trước #94?
  +6m05s, d2e66749 +10m49s). KHÔNG có GAP kiểu đợt 140 boot 1.
- **Cache SỐNG qua reboot lần này** (180 .deb / 156M — đúng bằng
  con số đợt 141/138/139/140 boot 1; khác đợt 142/143: 0 .deb).
  F-141-T5-4 giữ nguyên: sống/không sống là KHÔNG NHẤT QUÁN —
  đợt này cache sống qua CẢ HAI reboot liên tiếp trong đợt
  (691a7403: 180; cc222c8a: 180 — xem §3.2), nhưng T5 đợt sau
  vẫn kiểm cache ngay lúc mở boot mới, không giả định trước.
- Lists 37 (khác 39 ở boot 2 — xem §3.2; chênh 2 file lists là
  biến thiên bình thường giữa các lần update, không phải dấu
  hiệu lỗi: cả hai boot đều đủ 11 gói NEED + GST 269/269).
- **KHÔNG cần watcher** (replay đã xong trước khi T5 mở),
  **KHÔNG kích hoạt luật (C)** — (C) chỉ dành cho replay KẸT khi
  postboot FAIL. **KHÔNG chạy --repair** (không có gì để sửa).

### 3.2 Replay boot 2 (cc222c8a) — T5 theo dõi live từ đầu

| Thời điểm (Z) | Boot tuổi | dpkg dòng | Trạng thái |
|---|---|---|---|
| 05:54:03 | +48s | 2 | startup configure (2 dòng) |
| 05:54:24 (T5 kiểm lại) | +1m09s | 2 | apt-get update pid 811 ĐANG CHẠY, partial 32 file đang tăng, lists 3, GST ABSENT, /var/log/apt ABSENT — replay ĐANG SỐNG, KHÔNG phải dạng (B) |
| 05:54:41 | +1m26s | — | install đầu libaspell15 (apt history) |
| 05:54:57 (poll0) | +1m42s | 161 | apt-get install pid 2604 đang cài gstreamer1.0-gl (`--no-download` — cài từ cache); postboot FAIL exit 1 (0/11 gói — đúng vì replay mới bắt đầu) |
| 05:56:57 | +3m42s | 1388 | đang cài libc6-dev; GST đã có 269 file |
| 05:57:30 | +4m15s | **1545** | **XONG** — gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2; 221 installs; 0 proc apt/dpkg |
| 05:58:41 (poll1) | +5m26s | 1545 | postboot PASS exit 0; md5 `3569903e…` |
| 06:00:36 (poll2) | +7m21s | 1545 | postboot PASS exit 0; md5 không đổi |
| 06:35:37 (lúc đóng) | +42m22s | 1545 | md5 không đổi; 0 proc |

- Bracket replay boot 2: **(boot +48s, boot +4m15s]** — nhanh, cùng
  lớp với boot 1 (+4m53s) và #96? (+3m52s). Cài từ cache là chính
  (180 .deb / 156M sống qua reboot; apt-get install dùng
  `--no-download`).
- Cache sống 180 .deb / 156M (y hệt boot 1); lists 39 (boot 1: 37),
  partial 0 sau khi xong; GST thật 269/269; gstreamer1.0-gl ĐÃ CÀI
  bởi replay (khác boot b379ecd7 đợt 132 phải --repair 1 lần).
- **KHÔNG cần watcher dài** (replay xong trong ~4 phút, T5 poll tay
  mỗi ~2 phút tới khi PASS ổn định 2 poll); **KHÔNG kích hoạt luật
  (C)**; **KHÔNG chạy --repair**.

### 3.3 Cờ POSTBOOT_PASS — cả hai boot

| Boot | Cờ ghi (Z) | poll | Nội dung |
|---|---|---|---|
| 691a7403 | 05:43:07 | 2 | `boot_id=691a7403-512b-4055-bb55-de0d7516eeeb btime=2026-11-19T03:55:45Z pass_at=2026-11-19T05:43:07Z poll=2 repair=none/replay-full dpkg=1545/221` |
| cc222c8a | 06:00:44 | 2 | `boot_id=cc222c8a-d8e2-4244-bcbc-1997b4099864 btime=2026-11-19T05:53:15Z pass_at=2026-11-19T06:00:44Z poll=2 repair=none/replay-full dpkg=1545/221` |

- Cờ boot 1: T4 đọc ở **poll #1 (05:44:12Z**, ~65 s sau khi ghi;
  t5flag=PASS(t5src=144-t5/POSTBOOT_PASS), postboot_exit=0,
  dpkg_lines=1545) và **MỞ CỬA YÊN NGAY poll #1** (gate A 1815 MB).
- Cờ boot 2: ghi đè cùng file `round144-t5/POSTBOOT_PASS` (mẫu các
  đợt nhiều boot — file đơn, boot mới nhất; nội dung cờ boot 1 còn
  trong poll log T4 + LIMITS này). T4 đã mở cửa trước đó bằng
  T4-check-only (poll #5, 05:58:52Z — xem §4) nên cờ boot 2 là
  nguồn chính thức cho mọi lần kiểm sau (T10 đóng sổ, đợt sau
  đối chiếu), không phải nguồn mở cửa lần này.
- Poller T4 validate boot_id đúng cả hai boot: poll #1–#4 boot 2
  đọc cờ STALE 143-t5 (`t5flag=cu(mtime-cu)`) và KHÔNG tính PASS
  giả (postboot_exit=1 khi replay đang chạy).

### 3.4 Trạng thái sau replay (cả hai boot — replay đầy đủ, KHÔNG phải repair-1-phần)

| Hạng mục | Boot 1 (05:43Z) | Boot 2 (06:00–06:35Z) |
|---|---|---|
| dpkg.log dòng / installs / configure | 1545 / 221 / 462 | 1545 / 221 / 462 |
| dpkg.log md5 | `da31ab1b…` | `3569903e…` |
| dpkg.log mtime (gói cuối) | 04:00:38Z | 05:57:30Z |
| cache apt | 180 .deb / 156M | 180 .deb / 156M |
| lists / partial | 37 / 0 | 39 / 0 |
| GST hệ thống | thư mục THẬT 269 | thư mục THẬT 269 |
| proc apt/dpkg/wrapper | 0 | 0 |
| postboot check | PASS poll0+poll1+poll0b | FAIL poll0 → PASS poll1+poll2+poll0b |

- Số liệu **TRÙNG bracket replay đầy đủ chuẩn** (1545/221/462 —
  như #94?/#96?/d2e66749/2c0efe57/78b55838) — khác hẳn bracket
  repair-1-phần 795/113 của đợt 140 boot 2 / 142 / 143. Cả hai boot
  đợt này đều là replay đầy đủ, không repair.

### 3.5 So sánh replay các đợt gần nhất (bracket đầy đủ)

| Boot | Đợt | Bracket (configure → xong) | Gói cuối |
|---|---|---|---|
| 17db9652 (#94?) | 137 boot 2 / 138 | +49s → +6m05s | tools 1ubuntu0.1 |
| 541524e2 (#96?) | 139 | +31s → +3m52s | tools 1ubuntu0.1 |
| af558fb5 | 140 boot 1 | +42s → +16m39s (GAP 805s) | tools 1ubuntu0.1 |
| 2c0efe57 | 141 | +31s → +3m57s | tools 1ubuntu0.1 |
| 691a7403 (#106?) | 144 boot 1 | +34s → +4m53s | tools **1ubuntu0.2** |
| cc222c8a (#107?) | 144 boot 2 | +48s → +4m15s | tools **1ubuntu0.2** |

- Hai boot đợt 144 đều thuộc nhóm replay NHANH (4–5 phút wall-clock,
  không GAP), nhờ cache sống 180 .deb.

### 3.6 Phiên bản gstreamer1.0-tools — THREAD "3 PHIÊN BẢN" ĐÓNG

Nhiệm vụ đối chiếu của brief: log replay boot mới 1.545 dòng, gói cuối
gstreamer1.0-tools 1.24.2-1ubuntu0.2 — phiên bản thứ ba khác nhau trong
ba đợt gần nhất (T9-143). T5-144 kiểm và **ĐÓNG thread này**:

| Nguồn kiểm | Kết quả |
|---|---|
| dpkg.log boot 691a7403 (đọc trực tiếp) | `install gstreamer1.0-tools:amd64 <none> 1.24.2-1ubuntu0.2` lúc 04:00:38Z; `status installed` cùng version |
| dpkg.log boot cc222c8a (đọc trực tiếp) | `install gstreamer1.0-tools:amd64 <none> 1.24.2-1ubuntu0.2` lúc 05:57:30Z; `status installed` cùng version |
| `apt-cache madison gstreamer1.0-tools` (đo 05:39Z, cả 2 mirror) | Chỉ 2 version: **1.24.2-1ubuntu0.2** (noble-updates/main + noble-security/main) và **1.24.2-1** (noble/main). **1.24.2-1ubuntu0.1 ĐÃ BIẾN MẤT khỏi cả 2 mirror; 1.24.2-1.1ubuntu2 KHÔNG TỒN TẠI** |
| `apt-cache madison fontconfig` | **fontconfig 2.15.0-1.1ubuntu2 CÓ THẬT** (noble/main) |
| dpkg.log boot 691a7403 — fontconfig | `status triggers-pending fontconfig:amd64 2.15.0-1.1ubuntu2` lúc **03:57:38Z** — đúng **3 phút trước** dòng gói cuối gstreamer (04:00:38Z) |
| dpkg.log boot 9afdaa89 (T9-142 §187, đối chiếu lại) | fontconfig 2.15.0-1.1ubuntu2 lúc 23:56:39Z, ~2 phút trước dòng gói cuối 23:58:47Z |
| Hồ sơ T9 các đợt trước | Đợt 140 + 141: gói cuối đều **1.24.2-1ubuntu0.1** (T9 ghi nhất quán 2 lần, madison lúc đó còn 0.1) |
| Các gói GST khác trong dpkg.log boot 691a7403 | gl/base/x **1.24.2-1ubuntu0.7**, bad **1.24.2-1ubuntu4**, good **1.24.2-1ubuntu1.8**, libav/ugly **1.24.1-1build1**, libgstreamer1.0-0 **1.24.2-1ubuntu0.2** — hậu tố version khác nhau theo từng gói là bình thường, chỉ so tools với tools |

- **Kết luận: KHÔNG có "phiên bản thứ ba". Chuỗi thật chỉ là
  1ubuntu0.1 (đợt 140/141) → 1ubuntu0.2 (đợt 143/144)** — một lần
  bump version ở pocket noble-security giữa đợt 141 và đợt 143
  (0.1 rời khỏi mirror khi 0.2 lên thay). "1.1ubuntu2" của T9-142
  là ghi nhầm từ fontconfig — **nay có bằng chứng tái hiện mẫu
  nhầm lẫn trên boot 691a7403**: cùng một log replay, fontconfig
  1.1ubuntu2 xuất hiện 3 phút trước dòng gói cuối (trên boot
  9afdaa89 là 2 phút trước). Cơ chế nhầm lẫn đã rõ, không còn là
  suy đoán. **Thread này ĐÓNG, không liên quan tới O8 FAIL đợt 142
  (đã có kết luận trạng thái boot mới, quyết parent đợt 143) và
  không ảnh hưởng WebKit** (tools là gói CLI, không nằm trong NEED
  11 gói; lib runtime libgstreamer1.0-0 cũng là 0.2, nhất quán).
- T5 không sửa LIMITS T9-142/T9-143; chỉ ghi kết luận đối chiếu ở
  đây để parent/T10 biết khi đóng sổ.

### 3.7 Gate0 mới — kiểm chứng thực tế lần đầu (quyết parent (j) đợt 143)

> Bối cảnh: đợt 143, lượt yên #19 KHÔNG ĐO ĐƯỢC (0 attempt) vì T5
> đóng 03:29Z trước reboot #30 (03:55:45Z) nên boot 691a7403 thiếu
> cờ T5 — 16 poll thỏa mọi thứ trừ cờ. Parent đã quyết ở §12.2 đợt
> 143 (ghi vào MEMORY.md): **từ đợt 144, gate0 chấp nhận kiểm
> postboot của chính T4 khi cờ T5 vắng/mốc cũ; giữ nguyên gate A
> ≥1024 MB**. Bổ sung của parent (tin nhắn gửi T5-144): đề xuất của
> T5 không cần trình hai phương án nữa — ghi nhận quyết này, áp
> dụng trong phối hợp với T4, chỉ đề xuất thêm nếu phát hiện vấn
> đề mới.

- **T4 đã áp dụng trước khi T5 mở** (note `GATE0-NOTE-FOR-T5-144.md`
  của T4-144, 05:46Z): poller `poll-wait-t4-144.sh` đã cài logic
  dự phòng — cờ T5 vẫn là chính khi có; khi cờ T5 vắng/mốc cũ cho
  boot hiện tại thì kết quả kiểm postboot check-only của chính T4
  (PASS, tuổi ≤3 poll) được tính là gate0 đạt, ghi
  `gate0=T4-check-only` trong poll log. Hạn poller 08:00Z.
- **Kiểm chứng trên boot 1 (691a7403):** cờ T5 có sẵn — T4 poll #1
  (05:44:12Z) dùng nguồn T5 (`gate0=T5(.../round144-t5/
  POSTBOOT_PASS)`), mở cửa ngay. Dự phòng chưa cần kích hoạt.
  → Nghĩa vụ (A) của T5 (viết cờ cho boot hiện tại) vẫn có giá trị:
  cửa mở ở poll #1 thay vì chờ T4 tự kiểm.
- **Kiểm chứng trên boot 2 (cc222c8a) — LẦN ĐẦU DỰ PHÒNG CHẠY THẬT:**
  poller chạy lại 05:55:51Z; poll #1–#4 gate0=khong-dat (cờ STALE
  143-t5 bị từ chối đúng; postboot_exit=1 trong lúc replay chạy);
  **poll #5 (05:58:52Z) gate0=T4-check-only (pb_age=0),
  postboot_exit=0 → CỬA YÊN MỞ**, chạy attempt1 ngay — **trước cờ
  T5 boot 2 (06:00:44Z) 1'52"**. Nếu không có dự phòng này, T4 đã
  phải chờ cờ T5 tới 06:00:44Z (và nếu T5 chết theo reboot như đợt
  143 thì kẹt cả lượt). **Kết luận T5: quy trình mới HOẠT ĐỘNG ĐÚNG
  như thiết kế; KHÔNG phát hiện vấn đề mới nào trong lúc kiểm boot
  691a7403/cc222c8a để đề xuất thêm.** (Các vấn đề T4 gặp sau đó —
  B4 giả-dương, sampler trộn 2 boot, 3 attempt đều lớp B — thuộc
  analyzer/poller của T4, không phải quy trình cờ; xem LIMITS T4.)
- **Đề xuất duy nhất của T5 (không phải phương án mới, chỉ là ghi
  nhận vận hành):** giữ nguyên cả hai nghĩa vụ song song — (A) T5
  viết cờ cho boot mới ngay khi PASS ổn định 2 poll (đã làm cả hai
  boot đợt này: 05:43:07Z + 06:00:44Z) và (B) gate0 dự phòng
  T4-check-only — hai lớp không loại nhau, và đợt này đã chứng
  minh cả hai lớp đều chạy được (A mở cửa boot 1 ở poll #1; B mở
  cửa boot 2 ở poll #5).

### 3.8 Postboot script — sửa 2 lần (header, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`9db78cbe…` (cuối đợt 143) → **`dc3f137a…`** → **`4b156a7d…`**:

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 05:43Z | 691a7403 | `9db78cbe…` → `dc3f137a…` | header Dot 144 boot 1 (btime KHỚP brief, replay CHẠY TỐT 1545/221 +4m53s, tools 0.2, cờ 05:43:07Z poll=2, gstreamer đối chiếu 0.1→0.2, headroom mở 1289) — KHÔNG đổi logic |
| 2 | 06:01Z | cc222c8a | `dc3f137a…` → `4b156a7d…` | header Dot 144 boot 2 (reboot #31, btime 05:53:15Z, replay +4m15s, cache sống 180, cờ 06:00:44Z poll=2, gate0 mới chạy thật poll #5 T4-check-only trước cờ T5 1'52", headroom mở 1289) — KHÔNG đổi logic |

- `bash -n` OK sau mỗi lần sửa. Check-only chạy lại sau mỗi lần
  sửa (poll0b boot 1 exit 0 lúc 05:43:28Z; poll0b boot 2 exit 0 lúc
  06:01:17Z) — cùng kết quả như trước sửa, chứng minh sửa header
  không ảnh hưởng logic.
- Số liệu trong header viết đúng số đã đo TRƯỚC khi chạy poll0b
  (không lặp lại F-142-T5-1).

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng + postboot script

| File | Lúc mở 05:38Z | Lúc đóng 06:35Z | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 9db78cbe… | 4b156a7d… (sau sửa 2 lần) | chỉ header, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này. T4-144 cũng độc lập ghi tree=YES:md5=
  530e10a7 ở mọi poll cả hai boot.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 2 series (n=13 CẮT NGANG + n=40 ĐẦY ĐỦ)

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup, đường
> dẫn tuyệt đối (script copy từ round143-t5, OUT đã sửa
> round144-t5 TRƯỚC khi chạy — kiểm bằng grep, không lặp lại
> F-138-T5-1). **Series 2 dùng file log RIÊNG
> (`ram-sampler-b2.log`)** — không append chung file với series 1,
> để không trộn mẫu 2 boot (bài học từ F-144-T4-3 của T4: sampler
> append trộn boot làm sai B2).

### 5.1 Series 1 — boot 691a7403, n=13 (05:41:15–05:53:15Z, CẮT NGANG bởi reboot #31)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 05:41:15 | 748.932 | 5.850.200 | 1,48 |
| 2 | 05:42:15 | 1.564.388 | 4.670.552 | 1,61 |
| 3 | 05:43:15 | 1.363.524 | 4.818.280 | 1,16 |
| 4 | 05:44:15 | 1.641.920 | 5.013.992 | 1,02 |
| 5 | 05:45:15 | 1.157.320 | 4.803.076 | 3,63 |
| 6 | 05:46:15 | 1.465.612 | 4.968.964 | 2,31 |
| 7 | 05:47:15 | 1.432.816 | 5.138.164 | 1,23 |
| 8 | 05:48:15 | 2.527.352 | 4.279.908 | 0,90 |
| 9 | 05:49:15 | 2.391.808 | 3.586.192 | 1,96 |
| 10 | 05:50:15 | 2.188.936 | 3.823.216 | 1,66 |
| 11 | 05:51:15 | 2.151.364 | 4.055.708 | 1,14 |
| 12 | 05:52:15 | 2.071.532 | 4.077.908 | 1,06 |
| 13 | 05:53:15 | 2.681.048 | 3.488.084 | 0,99 |

- Thống kê (tính bằng code trên 13 mẫu): min avail **748.932 kB lúc
  05:41:15Z**; max **2.681.048 kB lúc 05:53:15Z = 2.618,2 MiB =
  42,6% guard**; trung bình 1.798.965 kB; Balloon min **3.488.084
  kB lúc 05:53:15Z**, max **5.850.200 kB lúc 05:41:15Z**, trung bình
  4.505.711 kB; **0 mẫu ghim trần 6.443.824 kB**. Gate A
  (≥1.048.576 kB): **12/13 mẫu**. Load1 0,90–3,63.
- **Hình dạng: balloon XẢ.** Từ 5,85M (05:41:15Z) xả xuống 3,49M
  (05:53:15Z) — giảm ~2,36M kB trong 12 phút, avail tăng tương ứng
  lên đỉnh series 2,68M. Đây là lần đầu trong nhiều đợt sampler T5
  ghi balloon xả sâu và **không ghim trần lần nào** (đợt 143: 7 mẫu
  ghim trần; đợt 142: ghim 1 mẫu). T5 không kết luận nguyên nhân
  xả (có thể do reboot sắp tới / host-side); T9 sampler dài là
  luồng xác nhận độc lập xem đóng băng đã hết hay chỉ xả tạm.
- **Mẫu #13 trùng btime boot mới (05:53:15Z)** — xem F-144-T5-1.

### 5.2 Series 2 — boot cc222c8a, n=40 ĐẦY ĐỦ (05:54:57–06:33:58Z + DONE 06:34:58Z)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 05:54:57 | 1.821.892 | 4.888.488 | 3,97 |
| 2 | 05:55:57 | 2.015.480 | 4.697.548 | 3,17 |
| 3 | 05:56:57 | 1.903.228 | 4.916.576 | 3,57 |
| 4 | 05:57:57 | 1.756.856 | 5.131.752 | 1,67 |
| 5 | 05:58:57 | 1.829.220 | 4.935.564 | 1,21 |
| 6 | 05:59:57 | 2.070.828 | 3.952.524 | 1,46 |
| 7 | 06:00:57 | 2.468.472 | 4.189.260 | 1,87 |
| 8 | 06:01:57 | 2.215.848 | 4.454.400 | 1,08 |
| 9 | 06:02:57 | 2.142.764 | 4.159.136 | 1,15 |
| 10 | 06:03:57 | 1.803.760 | 4.241.936 | 2,10 |
| 11 | 06:04:57 | 1.910.416 | 4.456.540 | 2,82 |
| 12 | 06:05:57 | 1.973.724 | 4.697.636 | 1,03 |
| 13 | 06:06:57 | 1.257.916 | 4.579.816 | 0,84 |
| 14 | 06:07:57 | 2.279.060 | 3.793.384 | 1,12 |
| 15 | 06:08:57 | 1.885.780 | 4.035.984 | 2,19 |
| 16 | 06:09:57 | 2.378.324 | 4.302.048 | 1,71 |
| 17 | 06:10:57 | 2.123.236 | 4.558.832 | 0,91 |
| 18 | 06:11:57 | **3.071.196** | 3.837.936 | 1,09 |
| 19 | 06:12:57 | 2.858.796 | 4.055.444 | 0,60 |
| 20 | 06:13:57 | 2.540.352 | 4.354.652 | 0,64 |
| 21 | 06:14:57 | 2.251.496 | 4.625.676 | 0,77 |
| 22 | 06:15:57 | 2.010.704 | 4.869.444 | 1,15 |
| 23 | 06:16:57 | 1.798.740 | 5.091.772 | 1,10 |
| 24 | 06:17:57 | 1.575.244 | 5.292.040 | 0,68 |
| 25 | 06:18:57 | 1.417.360 | 5.475.016 | 0,50 |
| 26 | 06:19:57 | 1.283.132 | 5.643.424 | 0,48 |
| 27 | 06:20:57 | 1.103.544 | 5.786.600 | 0,49 |
| 28 | 06:21:57 | 946.572 | **5.923.096** | 0,95 |
| 29 | 06:22:57 | 1.103.812 | 5.148.688 | 1,36 |
| 30 | 06:23:58 | 1.733.040 | 5.199.316 | 1,30 |
| 31 | 06:24:58 | 891.380 | 5.350.912 | 0,85 |
| 32 | 06:25:58 | 799.628 | 5.464.968 | 1,79 |
| 33 | 06:26:58 | 758.312 | 5.611.044 | 1,32 |
| 34 | 06:27:58 | 636.816 | 5.612.432 | 2,41 |
| 35 | 06:28:58 | 721.428 | 5.713.136 | 2,06 |
| 36 | 06:29:58 | **611.092** | 5.814.236 | 1,32 |
| 37 | 06:30:58 | 990.312 | 5.922.640 | 1,58 |
| 38 | 06:31:58 | 1.569.564 | 4.546.384 | 2,39 |
| 39 | 06:32:58 | 1.558.160 | 4.626.564 | 1,47 |
| 40 | 06:33:58 | 1.204.700 | 4.807.440 | 2,32 |

- Thống kê (tính bằng code trên 40 mẫu, đối chiếu trực tiếp từng
  dòng log): min avail **611.092 kB lúc 06:29:58Z**; max
  **3.071.196 kB lúc 06:11:57Z = 2.999,2 MiB = 48,8% guard**; trung
  bình 1.681.804 kB; Balloon min **3.793.384 kB lúc 06:07:57Z**,
  max **5.923.096 kB lúc 06:21:57Z**, trung bình 4.869.107 kB;
  **0 mẫu ghim trần 6.443.824 kB**. Gate A (≥1.048.576 kB):
  **32/40 mẫu**. Load1 0,48–3,97.
- **Hình dạng: răng cưa 2 chu kỳ.** Chu kỳ 1 (05:54–06:11Z): avail
  đỉnh 3,07M lúc 06:11:57Z rồi phình đơn điệu xuống 946k lúc
  06:21:57Z (balloon lên 5,92M — gần trần nhưng KHÔNG chạm);
  xả ~775k kB lúc 06:22:57Z. Chu kỳ 2 (06:23–06:29Z): avail rơi
  xuống đáy series 611k lúc 06:29:58Z (balloon 5,81M), rồi xả
  ~1,38M kB lúc 06:31:58Z (balloon về 4,55M) và dao động tới cuối
  series. Lúc đóng (06:35:37Z, ngoài series): avail **1.093.072
  kB**, balloon **5.067.160 kB**.
- **Đối chiếu T4:** T4 ghi attempt1 boot 1 B2 vi phạm thật với load1
  max 4,06 trong cửa sổ attempt (05:44–05:48Z); sampler T5 (mẫu
  60 s) trong cùng cửa sổ ghi max 3,63 (mẫu 05:45:15Z) — khác nhau
  do tần suất lấy mẫu khác nhau, không mâu thuẫn (T4 dùng sampler
  riêng tần suất cao hơn). T4 cũng ghi attempt1 boot 2 B2 4,06 là
  SAI do sampler append trộn 2 boot — sampler T5 đợt này dùng file
  riêng theo boot nên không mắc lỗi này (xem đầu §5).
- **Đối chiếu T9 (chủ quản birefnet):** T9 sampler dài chạy song
  song — nếu cửa sổ guard mở sau khi T5 đóng (06:35Z), T9 là luồng
  bắt được theo quyết §12.3(d) đợt 138. Trong phiên T5, đỉnh cao
  nhất chỉ 48,8% guard — **không có cửa sổ nào, không ai thử
  birefnet**. u2net vẫn là fallback chính thức.

### 5.3 Balloon không ghim trần — ghi nhận, không kết luận vội

- **0/53 mẫu ghim trần kẹt 6.443.824 kB trong cả phiên** (series 1:
  0/13, series 2: 0/40) — lần đầu tiên trong các đợt gần đây
  sampler T5 ghi 0 mẫu ghim trần (đợt 143: 7 mẫu; đợt 142: ghim 1
  mẫu boot 1; T9-143: 43/114 mẫu ghim). Balloon boot 1 XẢ SÂU
  (5,85M → 3,49M); balloon boot 2 lên cao nhất 5,92M — vẫn thiếu
  ~520k kB mới tới trần.
- **T5 KHÔNG kết luận "đóng băng đã hết".** Hai series của T5 chỉ
  phủ 05:41–06:35Z (~54 phút); đóng băng là hiện tượng đo trên
  cửa sổ dài (T9: 114 mẫu/đợt). T9-144 sampler dài là luồng xác
  nhận độc lập — nếu T9 cũng ghi 0 mẫu ghim thì mới bàn tới việc
  đóng băng đã hết. Ghi nhận ở đây để T10 đối chiếu chéo với T9.

### 5.4 Birefnet / u2net — kiểm tra tình trạng theo quy trình đứng

- **Birefnet: KHÔNG thử** (brief loại trừ; việc của T9 theo quyết
  §12.3(f) đợt 137; RAM xa guard — xem §5.1/§5.2). Birefnet vẫn 0
  lần chạy thành công trong gói (tính tới lúc T5 đóng).
- **u2net (fallback chính thức) — sẵn sàng trên đĩa:** rembg
  **2.0.87** trong `server/bgremove/.venv` (có `bin/rembg` + session
  u2net/u2netp/u2net_human_seg); `~/.u2net` có `u2net.onnx`,
  `u2netp/`, `birefnet-general.onnx`, `models/` 218M (gồm
  `birefnet-general-lite/`). Lưu ý: `python3 -c "import rembg"`
  ngoài venv báo lỗi (rembg chỉ có trong venv của server, không
  phải Python hệ thống) — đó là trạng thái bình thường, không phải
  lỗi thiếu model. T5 KHÔNG chạy thử u2net (không thuộc brief;
  chỉ kiểm sự hiện diện).
- Guard **6.144 MiB GIỮ NGUYÊN** (quyết §12.3(d) đợt 138).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 4 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 141 mở (T5) / cuối (T5) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| Đợt 143 mở (T5) / cuối (T5) | 1498 / 1494 | boot 70a5b0fc |
| **Đợt 144 mở (T5, 05:41Z)** | **1289** | **boot 691a7403, headroom-open.txt** |
| **Đợt 144 cuối (T5, 06:01Z)** | **1193** | **boot cc222c8a, headroom-end.txt** |

- Giảm −209 so với mở đợt 143 (1498 → 1289) và −96 trong đợt
  (1289 → 1193). **Vẫn DƯỚI ngưỡng báo user (< ~1.800)** — theo
  quyết parent đợt 141 (đã BÁO USER trong báo cáo đợt 141) + đợt
  143 (chỉ theo dõi, nhắc một dòng), đợt này **chỉ theo dõi,
  không báo riêng, không tự đổi gì**. Tỉ lệ/vite: ~0,82 (mở) →
  ~0,76 (cuối) — lần thứ 2 liên tiếp dưới 1,0.
- Caveat (F-144-T5-3): mức giảm −209 lớn hơn đà ~100–115/đợt; lúc
  đo mở (05:41Z) các luồng khác đang khởi động (fd cell-visible
  429 lúc 05:38Z → 504 lúc đo mở → 548 lúc đo cuối) nên một phần
  giảm có thể là watch tạm của các luồng khác, không phải đà dài
  hạn. T9-144 đo độc lập để đối chiếu.
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **429 (lúc mở) → 504 (lúc đo mở) → 548 (lúc đo cuối)**.
- Cửa sổ thoáng ngay sau boot (>20.000, T9-143): T5 KHÔNG đo lại
  đợt này (đo cuối lúc boot 2 +8 phút đã về 1193 — cửa sổ chỉ tồn
  tại ~1 phút đầu sau boot theo T9-142).

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 6,8G trống** (đo 05:44Z + 06:35Z —
  không đổi); `/tmp` tmpfs 512M, 497M trống. Không có ENOSPC nào
  trong phiên ngoài ENOSPC inotify có chủ đích của probe K8
  (errno 28 khi hết watch — đó là cách đo headroom, không phải
  lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock). T4 đã chạy vite cho các attempt lượt yên #19 trên cả
  hai boot (vite-5187 log) — vite chạy được trên cả hai boot.

## 7. EPERM scan + WFS #50 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #63 (T2-144): ok=2 fail=0, boot=691a7403, 05:43:32Z**
  (`eperm-probe-v2.log`: 178 → **181 dòng (+3 đúng prereg)**;
  probe #62 stale 10.423 s trước đó).
- **Mù #63 ĐÓNG HOÀN TOÀN (T2-144)** — mù đầu tiên đóng hoàn toàn
  kể từ #60 (A ĐÓNG merged 63 mốc, gap lớn nhất 666 s < sàn 1.147 s;
  B ĐÓNG merged 291 mốc, gap lớn nhất 208 s + uptime trực tiếp).
  Ranh giới 691a7403 sạch.
- **Gap mới CHỨNG NHẬN: 70a5b0fc→691a7403 = [7.210, 7.230] s, giữa
  7.220 s → CERT 64 / FULL 79** (T2-144; T6-144 xác minh độc lập
  7.220 s từ btime — khớp; prereg 7.280 s sai đã sửa). Gap 42 s +
  7.265 s VẪN SPAN. Reboot #31 (691a7403→cc222c8a, gap danh nghĩa
  7.050 s) chờ T2-145 (mù #64).
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142/T5-143).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 viết; lần kiểm cuối 06:35Z — log dừng ở probe #63).
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #62→#63
  (70a5b0fc→691a7403, age 10.423 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–143).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #50 (T5 chạy, 05:41:27–05:42:12Z, 45 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round144-t5, **đổi OUT round143-t5 → round144-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round144-t5, không
  còn tham chiếu round cũ nào trong script; grep `round143` sau
  sed = 0). Kết quả:
  - NEWSTD: **964 dòng / 271 file** (phạm vi 3.197 file);
  - R7b đối chiếu: **989 dòng / 288 file** (phạm vi 12.590 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43–49.
  - Đối chiếu chéo: 964+25=989=R7b, **chênh 0**.
- **+1 dòng / +1 file so với lần 49 (T5)** (963/270 → 964/271),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #49
  còn nguyên trong round143-t5/): diff wfs-newstd.txt #49→#50 chỉ
  ra đúng **1 dòng thêm: `./docs/PHASE9_ROUND143_T5_INFRA_LIMITS.md:1`**
  (file LIMITS T5-143 hoàn thành sau quét #49); 0 file nào đổi số
  hit, không file nào mất hit. 7 file docs đợt 143 mới vào scope
  nhưng chỉ 1 file có hit (T2-144 cũng đối chiếu độc lập: "+1/+1
  vs #49 giải thích đầy đủ: T5-143 LIMITS hoàn thành sau quét #49"
  — khớp hoàn toàn).
- **Kết luận: 50 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #63.

### 7.4 Đối chiếu chéo T2 vs T5 (scan #50)

- T2-144 đã đối chiếu trong LIMITS T2 (ghi trong build-loop-log):
  WFS #50 chênh 0, +1/+1 giải thích đầy đủ — **khớp hoàn toàn
  với scan của T5**. Không cần bổ sung ở aggregate.

### 7.5 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Phương pháp: pattern `\.writeFile\(` (có dấu chấm) — như T2-137
  §2.8. **0 stray.** Không có bằng chứng async writeFile bị dùng
  để né EPERM trong mù #63.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–143). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **Lượt yên WebKit #19: ĐO ĐƯỢC NHƯNG CHƯA CÓ VERDICT HỢP LỆ —
   CHỜ PARENT QUYẾT (việc T4/T10).** 5 attempt 20/20 trên 2 boot,
   tất cả bị lớp B của poller loại; hậu kiểm T4: 2/3 lần loại boot
   mới là SAI (B4 giả-dương + B2 tính trên mẫu trộn 2 boot);
   attempt3 boot mới (median 55,0 ms, P1/P3-A1/P3'/P7 đủ) là ứng
   viên #19 hợp lệ — parent quyết chấp nhận hay đo lại đợt 145
   với poller đã vá (xem LIMITS T4 §kết luận + build-loop-log T4).
   Gate0 mới đã chứng minh hoạt động đúng (xem §3.7) — không còn
   là nợ quy trình.
2. **Balloon 0/53 mẫu ghim trần — T9 XÁC NHẬN ĐỘC LẬP XEM ĐÓNG BĂNG
   ĐÃ HẾT HAY CHỈ XẢ TẠM.** Sampler T5 chỉ phủ ~54 phút; T9 sampler
   dài là chuẩn dài hạn. Nếu T9 cũng ghi 0 mẫu ghim thì mới bàn
   tới việc đóng băng đã hết (xem §5.3).
3. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (max 48,8% guard lúc 06:11:57Z; balloon
   không ghim trần nhưng avail vẫn xa guard). T9 sampler dài là
   luồng bắt cửa sổ nếu có sau khi T5 đóng; guard 6.144 MiB GIỮ
   NGUYÊN (quyết §12.3(d) đợt 138). u2net là fallback chính thức
   (đã kiểm sự hiện diện — xem §5.4).
4. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Cộng dồn lượt
   yên hợp lệ đứng nguyên 15 cho tới khi parent quyết về attempt3
   boot mới của T4 (xem nợ 1). P3' vẫn chưa được kiểm lần nào
   trong đợt này theo cách tính của T4 (attempt3 đủ P3' nhưng chưa
   được tuyên bố).
5. **Headroom VẪN DƯỚI NGƯỠNG BÁO (1289 mở → 1193 cuối):**
   chỉ theo dõi, không báo riêng (quyết parent đợt 141 đã báo
   user; đợt 143 nhắc một dòng). Đà giảm đợt này −209 (mở) lớn
   hơn đà ~100–115/đợt — một phần có thể là watch tạm của các
   luồng khác lúc đo mở (xem F-144-T5-3); T9 đối chiếu độc lập.
6. **Cache apt sống/không sống qua reboot là KHÔNG NHẤT QUÁN
   (F-141-T5-4 giữ nguyên):** đợt này cache sống qua CẢ HAI reboot
   liên tiếp trong đợt (180 .deb cả hai boot); đợt 142/143: 0 .deb.
   T5 đợt sau vẫn kiểm cache ngay lúc mở boot mới, không giả định
   trước.
7. **Replay CHẠY TỐT cả hai boot đợt này (1545/221, +4m53s /
   +4m15s)** — sau 3 lần chết dạng (B) trong 4 đợt gần nhất
   (#76?/90392aa5/bde599df/70a5b0fc). Dạng (B) không biến mất
   (vẫn có thể quay lại đợt sau); §8.2(B) form B + luật (C) giữ
   nguyên, không đổi luật nào đợt này. **KHÔNG cần --repair lần
   nào đợt này** (lần đầu kể từ đợt 141).
8. **T2 hỏi parent (§4.5 LIMITS T2, điểm 4): dpkg.log bị reset mỗi
   reboot bởi hatch os-intent replay-reset — cần quy trình mới
   cho T5?** Trả lời từ phía T5: KHÔNG cần quy trình mới — T5 luôn
   đo dpkg.log của boot HIỆN TẠI lúc đang sống (live poll + mtime
   + md5) và số liệu boot cũ được bảo toàn trong LIMITS/flag/log
   trên đĩa bền (workspace, không phải rootfs). Apt history.log
   cũng giữ lại lịch sử cài của boot cũ. T5 ghi nhận câu hỏi để
   T10/parent xét, không tự đổi quy trình.
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 143 §11: **mù
   #64 MỚI MỞ (T2-145: probe #64 + gap #106?→#107? + khung chết
   #106?/boot 691a7403)**; **CERT 64 / FULL 79 (T2-144, chờ parent
   xác nhận)**; **chuỗi INSIDE đính chính 4 → 2 (T2-144/T6-144,
   chờ parent hòa giải với MEMORY.md)**; G1 chờ user quyết;
   ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB
   `benchmarks/results/webkit-blob-flaky-96x3.json` vẫn chưa quyết
   số phận; TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG
   push khi user chưa nhắn "push đi"; R9 (a) vẫn chờ user (số đếm
   VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 2 lần (`9db78cbe…` → `dc3f137a…` →
  `4b156a7d…`, header, KHÔNG đổi logic — xem §3.8).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-144 probe #63
  ok=2 fail=0). WFS scan #50 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1); đối chiếu T2
  khớp hoàn toàn (xem §7.4).
- Postboot boot 691a7403: PASS ngay poll0 (05:39:52Z) + poll1 +
  poll0b; cờ ghi 05:43:07Z poll=2, T4 đọc poll #1, mở cửa yên ngay.
  Postboot boot cc222c8a: FAIL poll0 (05:54:57Z, replay mới bắt
  đầu) → replay xong 05:57:30Z → PASS poll1 + poll2 + poll0b; cờ
  ghi 06:00:44Z poll=2. **KHÔNG chạy --repair lần nào.**
  **Watcher 60-phút: KHÔNG lập** (boot 1 replay đã xong trước khi
  T5 mở; boot 2 replay xong trong ~4 phút, T5 poll tay tới PASS
  ổn định 2 poll). Luật (C): KHÔNG kích hoạt (không có replay
  kẹt + postboot FAIL kéo dài).
- Gate0 mới: **KIỂM CHỨNG THỰC TẾ LẦN ĐẦU — HOẠT ĐỘNG ĐÚNG**
  (T4 mở cửa boot 2 poll #5 bằng T4-check-only, trước cờ T5 1'52";
  xem §3.7). T5 không đề xuất thêm phương án nào (parent đã quyết).
- Gstreamer đối chiếu: **thread "3 phiên bản" ĐÓNG** (chuỗi thật
  0.1 → 0.2; "1.1ubuntu2" là ghi nhầm từ fontconfig, có bằng chứng
  tái hiện mẫu nhầm lẫn; xem §3.6).
- Headroom: 1289 (mở, boot 1) → **1193 (cuối, boot 2)** — VẪN
  DƯỚI ngưỡng báo ~1.800, lần thứ 4 liên tiếp, chỉ theo dõi.
- RAM phiên T5 (2 series, xem §5): series 1 (n=13, cắt ngang):
  avail 748.932–2.681.048 kB (mean 1.798.965), balloon
  3.488.084–5.850.200 kB (mean 4.505.711), gate A 12/13, max
  42,6% guard; series 2 (n=40, đầy đủ): avail 611.092–3.071.196
  kB (mean 1.681.804), balloon 3.793.384–5.923.096 kB (mean
  4.869.107), gate A 32/40, max **48,8% guard**, 0 mẫu ở trần
  guard; **balloon 0/53 mẫu ghim trần kẹt** (xem §5.3). RAM lúc
  đóng 1.093.072 kB, balloon 5.067.160 kB.
- **1 reboot giữa lượt (#31)** — xem §2.
- **started_at lượt 144:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: CÓ reboot trong phiên T5 (reboot #31)
  nhưng T7-144 đã kiểm lần 1 (run 144 sched = started =
  05:35:51Z, jitter 0, KHÔNG viết lại — xem build-loop-log T7);
  việc viết lại started_at (nếu có) thuộc về reboot #31 và do T7
  kiểm tiếp, T5 không tự suy diễn.

## 11. Sai số của T5 đợt này (F-144-T5-N)

- **F-144-T5-1 — Lệnh sleep chờ bị SIGTERM cùng reboot #31 +
  mẫu sampler trùng btime boot mới:** lệnh `sleep 600` của T5
  (chờ sampler series 1) bị giết bằng SIGTERM lúc reboot #31
  (~05:53:15Z), exitSignal 15, 0 output — cùng họ F-140-T10-1 /
  F-142-T10-1 / F-143-T10-1 (vòng chờ bị giết theo reboot). Không
  mất dữ liệu: sampler series 1 đã ghi 13 mẫu lên đĩa bền trước
  khi chết (file log sống qua reboot vì workspace không phải
  rootfs); T5 kiểm lại ngay sau reboot và khởi động series 2 bằng
  file log riêng. Mẫu sampler #13 (05:53:15Z) trùng đúng btime
  boot mới — đồng hồ cũ chạy nhanh vài giây hoặc mẫu ghi tại ranh
  giới reboot; khung chết boot 1 (05:52:15Z, 05:53:15Z] dùng mẫu
  #12 làm mốc cuối chắc chắn, không dùng mẫu #13.
- **F-144-T5-2 — Race giữa 2 lệnh exec song song lúc mở phiên:**
  lệnh chạy postboot poll0 redirect output vào
  `round144-t5/t5-postboot-poll0.log` FAIL ("No such file or
  directory") vì lệnh `mkdir -p round144-t5` chạy song song chưa
  xong lúc redirect mở file. Chạy lại sau khi thư mục đã có —
  poll0 PASS exit 0 (05:39:52Z). Hậu quả: không có (chỉ mất 1 lần
  chạy); bài học: không chạy mkdir và redirect file vào cùng thư
  mục trong 2 exec song song.
- **F-144-T5-3 — Headroom mở 1289 có thể bị ảnh hưởng bởi watch
  tạm của các luồng khác:** lúc đo mở (05:41Z) các luồng khác đang
  khởi động (fd cell-visible 429 lúc 05:38Z → 504 lúc đo mở → 548
  lúc đo cuối). Mức giảm −209 so với mở đợt 143 lớn hơn đà
  ~100–115/đợt — một phần có thể là watch tạm, không phải đà dài
  hạn thuần. T5 ghi con số đúng như đo được (1289/1193) và ghi
  caveat này; không tự hiệu chỉnh số đo. T9-144 đo độc lập để đối
  chiếu.
- **F-144-T5-4 — Series sampler 1 chỉ n=13 (không đủ 40):** bị cắt
  ngang bởi reboot #31 (sampler chết cùng boot). Thống kê series 1
  tính trên 13 mẫu — T5 ghi rõ là series CẮT NGANG, không trình
  bày như series đầy đủ; series 2 (n=40) là series đầy đủ duy nhất
  đợt này.
- **F-144-T5-5 — Không đo headroom cửa sổ thoáng ngay sau boot:**
  T5 không đo headroom lúc boot 2 ~1 phút tuổi (đang theo dõi
  replay live + viết cờ); đo cuối lúc boot 2 +8 phút đã về 1193.
  Cửa sổ thoáng >20.000 chỉ tồn tại ~1 phút đầu sau boot (theo
  T9-142) nên T5 không có số đo cửa sổ đợt này — T9-144 đo độc
  lập (việc của T9, không phải thiếu sót kết luận: headroom
  "cuối" 1193 vẫn là số đo đúng cho trạng thái ổn định).
- **F-144-T5-6 — (GHI NHẬN, KHÔNG PHẢI LỖI) Cờ boot 2 tới sau cửa
  yên mở 1'52":** cờ T5 cho boot cc222c8a ghi 06:00:44Z, sau khi T4
  đã mở cửa bằng T4-check-only (05:58:52Z). Đây là hành vi ĐÚNG
  theo thiết kế mới (dự phòng chạy khi cờ vắng), không phải lỗi
  của T5 — T5 ghi cờ ngay khi PASS ổn định 2 poll (poll1 05:58:41Z
  + poll2 06:00:36Z, ghi cờ 06:00:44Z, chỉ 8 s sau poll2). Cùng họ
  F-144-T4-9 của T4 (ghi nhận, không phải lỗi).

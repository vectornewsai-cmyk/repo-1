# PHASE9_ROUND139_T5_INFRA_LIMITS — Boot 541524e2 replay XONG NHANH NHẤT (1545/221/462, boot +3m52s) + postboot PASS ngay poll0 + btime brief SAI (F-139-T5-1) + balloon wobble, gate A mở lại + WFS #45 chênh 0 + headroom 1950

> Luồng T5, đợt 139, lượt cron 21:35 +07 18/11/2026 (mở 14:35:51Z 18/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **1 BOOT trong phiên T5 (tới lúc đóng): 541524e2** — boot mới
> sau đợt 138, replay ĐÃ XONG HẲN trước khi T5 mở (1545 dòng / 221
> installs / 462 configure, xong 13:57:33Z = boot +3m52s — NHANH NHẤT
> từ trước tới nay); postboot PASS exit 0 ngay lần kiểm đầu (poll0);
> **KHÔNG cần watcher, KHÔNG kích hoạt luật (C)** — (C) chỉ dành cho
> replay KẸT khi postboot FAIL. **KHÔNG có reboot giữa lượt** trong
> phiên T5 (tới lúc đóng). KHÔNG push. KHÔNG release/tag. KHÔNG sửa
> production (preview.tsx giữ 530e10a7). KHÔNG tự chạy birefnet
> (thuộc T9 theo quyết parent đợt 137 §12.3(f) — T5 CHỈ quan sát +
> báo cáo). KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ
> user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 541524e2 REPLAY XONG HẲN TRƯỚC KHI T5 MỞ.** dpkg.log
   **đóng băng ở 1545 dòng / 221 installs / 462 dòng chứa
   "configure"** từ 13:57:33Z (gói cuối gstreamer1.0-tools) —
   TRÙNG KHỚP bracket chuẩn #92?/#94? (1.545/221/462) từng dòng
   đếm (action configure 178 / install 169 / gstreamer 98 — y
   hệt đợt 138); md5 `9b0c0c0d…` không đổi suốt phiên; 0 proc
   apt/dpkg; cache apt 178 .deb / 156M; lists 37 (xem §3.2 về
   chênh lists 71→37); partial 0; GST hệ thống là thư mục THẬT
   (apt) 269/269; term.log 0 dòng `Get:` (cài từ cache);
   **postboot PASS exit 0** ngay poll0 (14:46Z) + chạy lại sau
   khi sửa header (14:47Z) vẫn exit 0. Bracket chuẩn:
   **(configure 13:54:12Z = boot +31s, xong 13:57:33Z = boot
   +3m52s, 1545 dòng / 221 installs / 462 configure)** — nhanh
   nhất từ trước tới nay (#94? +6m05s, #48 +2m44s tính từ hoạt
   động apt đầu tiên nhưng +40s từ boot — xem §3.2).
2. **BTIME TRONG BRIEF SAI — F-139-T5-1 (MỚI, nghiêm trọng về
   mốc thời gian; ĐÃ ĐƯỢC T1-139 XÁC MINH ĐỘC LẬP — F-139-T1-1):**
   brief + round-in-progress.md ghi btime **14:03:07Z**, nhưng
   **8 nguồn độc lập đều đọc 13:53:41Z** (btime /proc/stat,
   uptime -s, stat /proc/1 13:53:52Z, who -b 13:53, journal
   first entry 13:53:53Z, T2-139 boot-verify.txt, T2 probe #58
   "uptime since 13:53:41", poller T4-139 btime=13:53:41Z) +
   dpkg.log hoạt động 13:54:12–13:57:33Z trên log MỚI (không thể
   trước boot). **T1-139 (F-139-T1-1) xác minh độc lập: btime
   THẬT là 13:53:41Z (epoch 1795010021), 4 nguồn độc lập khớp
   (/proc/stat, journal first entry 13:53:53Z, who -b/uptime,
   / birth) — KHỚP HOÀN TOÀN với kết luận của T5.** Reboot xảy
   ra **TRƯỚC cờ đóng đợt 138 (14:01:14Z)** — nên câu "reboot
   sau khi đóng cờ" trong brief cũng SAI về thứ tự.
   T5 lấy **13:53:41Z** làm chuẩn; 14:03:07Z ghi lại để T6/T10
   phân xử (xem §3.1). Boot_id 541524e2 thì KHỚP (không phải
   boot khác) — chỉ mốc btime sai.
3. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
   **2c384ed1**, vite.config.ts **ee80d093** (mở = cuối); postboot
   script sửa 1 lần cho boot mới (`d4a33a9e…` → `6b0874ba…`,
   chỉ header + dòng `say`, KHÔNG đổi logic — xem §3.4).
4. **RAM SAMPLER: BALLOON WOBBLE, KHÔNG CÓ CỬA SỔ GUARD.**
   Sampler T5 (n=40, 60 s/mẫu, 14:45:22–15:24:22Z): min
   **774.940 kB** (15:24:22Z, mẫu cuối), max **2.683.616 kB lúc
   15:00:22Z = 2.620,7 MiB = 42,7% guard**, trung bình 1.467.683
   kB; Balloon 4.186.708–6.168.364 kB (trung bình 5.191.041 kB).
   **0 mẫu ≥ 6.144 MiB.** Gate A (≥1024 MB): 32/40 mẫu đạt, 8
   mẫu dưới (tập trung cuối phiên khi balloon phình lại).
   Balloon từ đỉnh kẹt 6.443.824 kB (đợt 138) đã xả xuống
   ~4,19M kB lúc 15:00:22Z rồi PHÌNH LẠI lên 6.168.364 kB cuối
   series và **6.397.220 kB lúc đóng (15:26:38Z)** — chỉ còn
   ~46.604 kB dưới trần kẹt; RAM avail lúc đóng chỉ còn
   **485.964 kB (~474 MB)**, gần như mức phẳng ~500 MB của đợt
   138. Wobble có biên độ ~2M kB, chu kỳ hàng chục phút, KHÔNG
   xả đơn điệu về 0. T4 đã mở được cửa yên #16 (poll #9, RAM
   1859 MB) — attempt1 chạy 14:48:38Z, exit 1 lúc 14:48:45Z;
   attempt2 phân tích 15:07:27Z, attempt3 coverage 4/4 lúc
   15:13:40Z; T4 đã đóng cờ (round139-t4.done) — kết quả thuộc
   T4; T5 chỉ ghi nhận mốc.
5. **HEADROOM inotify: 1950** (mở) → **1948** (cuối)
   (cuối) — giảm ~106 so với cuối đợt 138 (2056), đúng đà
   ~100–110/đợt; còn ~150 trên ngưỡng báo user (< ~1.800),
   chỉ theo dõi (quyết §12.3(j)). Vite chạy được (vite/6.4.5,
   node v24.22.1). Disk `/` 6,8G trống.
6. **EPERM: probe #58 (T2-139) ok=2 fail=0** (14:44:16Z,
   boot=541524e2); log probe 0 dòng sóng; eperm-now.txt vẫn `x`.
   **WFS scan #45: chênh 0** — NEWSTD 924/258, R7b 949/275,
   copies 25/17; 924+25=949 ✓; delta +11/+3 so với #44 giải
   thích TRỌN VẸN bằng diff file-thô trực tiếp (11 file LIMITS
   đợt 138 mới, chỉ 3 file có hit: aggregate +2, T2-138 +6,
   T5-138 +3 — xem §7). **Lần này KHÔNG mắc lại F-138-T5-1:**
   T5 đọc OUT TRƯỚC khi chạy (đã sửa round137-t2 → round139-t5,
   verify bằng grep); T2-139 cũng đã sửa OUT đúng round139-t2
   trước khi chạy scan của mình.
   **Async `.writeFile(`: đúng 2 helper đã biết, 0 stray.**
7. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM: "read kernel buffer
   failed: Operation not permitted"); journalctl -k rỗng — đúng
   như quyết parent §12.3(h) đã chấp nhận bước 4 như hiện tại.
8. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
   G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.
9. **KHÔNG reboot giữa lượt** trong phiên T5 (tới lúc đóng) —
   boot 541524e2 sống suốt từ 13:53:41Z; T5 mở 14:39Z, đóng
   15:26Z (boot ~1h33m tuổi lúc đóng).

## 2. Timeline — 1 boot trong phiên (không reboot giữa lượt)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 541524e2 (số chờ T6 — dự kiến #96?) | 13:53:41 (uptime -s; /proc/1 13:53:52) | còn sống (lúc T5 đóng ~1h33m tuổi) | Replay XONG HẲN trước khi T5 mở (13:57:33Z, boot +3m52s); postboot PASS poll0; cờ POSTBOOT_PASS round139-t5/ ghi 14:47:53Z; T4 đã đọc cờ ở poll #9 (14:48:38Z) và mở cửa yên #16 |

- **Btime — 2 con số mâu thuẫn (xem §3.1, F-139-T5-1):**
  kernel + 7 nguồn độc lập khác = **13:53:41Z**; brief +
  round-in-progress.md = **14:03:07Z** (chênh +9m26s).
  T5 lấy 13:53:41Z làm chuẩn làm việc (mọi bracket thời gian
  trong LIMITS này tính từ 13:53:41Z).
- Boot trước 914964c3 (#95? TẠM) chết TRƯỚC khi T5-139 mở
  (khung chết chờ T6/T2-139 chốt từ merged mù #58; gap danh
  nghĩa #95?→#96? chờ chứng nhận). T5 KHÔNG kiểm lại khung
  chết #94? (đã xác nhận ở đợt 138 §12.3(e)(ii)).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 139** do
  parent tạo (14:35:51Z, ghi "Đợt 139 ĐANG CHẠY… 9 luồng
  T1–T9… Hạn cứng ước lượng ~17:00Z") — KHÔNG phải đợt
  main-chat (tiền lệ đợt 130–138). T5 tiến hành bình thường.
- journalctl --list-boots chỉ có **1 boot duy nhất**
  (541524e2, first entry 13:53:53Z, last entry lúc kiểm
  14:41:04Z) — không có boot thứ 2 nào trong journal; timedatectl
  không chạy được (no dbus); không tìm thấy dòng timesync/
  chrony/ntp nào trong journal boot này → **không có bằng chứng
  clock jump** trong journal (xem §3.1).

## 3. dpkg replay boot 541524e2 — XONG HẲN TRƯỚC KHI T5 MỞ

### 3.1 F-139-T5-1 — Btime 14:03:07Z trong brief SAI (sai số của brief, không phải của T5)

Brief T5-139 + round-in-progress.md ghi "boot hiện tại 541524e2
(btime 14:03:07Z 18/11 — reboot sau khi đóng cờ đợt 138)".
Đối chiếu trực tiếp lúc T5 mở (14:39–14:44Z):

| Nguồn | Giá trị đọc được | Khớp 13:53:41Z? |
|---|---|---|
| /proc/stat btime | 1795010021 = 13:53:41Z | ✓ |
| uptime -s | 2026-11-18 13:53:41 | ✓ |
| stat /proc/1 | 13:53:52.66Z (+11 s, mẫu như mọi boot) | ✓ |
| who -b | system boot Nov 18 13:53 | ✓ |
| journal first entry | 13:53:53Z (journalctl --list-boots, chỉ 1 boot) | ✓ |
| T2-139 boot-verify.txt (14:43:59Z) | btime 1795010021 = 13:53:41Z | ✓ (độc lập) |
| T2 probe #58 log (14:44:16Z) | "uptime since 2026-11-18 13:53:41" | ✓ (độc lập) |
| T4-139 poller (poll #5–#9) | btime=2026-11-18T13:53:41Z | ✓ (độc lập) |
| dpkg.log (log MỚI của boot này) | hoạt động 13:54:12–13:57:33Z | ✓ (quyết định) |
| brief + round-in-progress.md | 14:03:07Z | ✗ (+9m26s) |

- **Bằng chứng quyết định:** dpkg.log của boot này là log MỚI
  (2 dòng startup 13:54:12Z → 1545 dòng; boot trước 914964c3
  dừng ở 795 dòng sau repair) với hoạt động cài đặt
  13:54:12–13:57:33Z. Một boot bắt đầu 14:03:07Z KHÔNG THỂ có
  dpkg activity 13:54–13:57Z trên log mới của chính nó. Do đó
  14:03:07Z là sai; 13:53:41Z là btime thật.
- **XÁC MINH ĐỘC LẬP — T1-139 F-139-T1-1 (bổ sung từ parent):**
  T1-139 đã verify độc lập: btime THẬT của boot 541524e2 là
  **13:53:41Z (epoch 1795010021)**, 4 nguồn độc lập khớp
  (/proc/stat, journal first entry 13:53:53Z, who -b/uptime,
  / birth) — KHỚP HOÀN TOÀN với 8 nguồn của T5 (4 nguồn của T1
  là tập con của 8 nguồn T5 + / birth là nguồn thứ 9). Reboot
  xảy ra **TRƯỚC cờ đóng đợt 138 (14:01:14Z)**. Hai luồng độc
  lập (T1 verify + T5 infra) cùng kết luận 13:53:41Z — mâu
  thuẫn btime coi như ĐÃ ĐƯỢC CHỨNG MINH, không còn là nghi
  vấn một phía. Phần còn lại chờ T6/T10: số thứ tự boot (dự
  kiến #96?) + có sửa marker/brief đợt 139 hay không (T5 KHÔNG
  tự sửa round-in-progress.md — file của parent).
- **Giả thuyết về nguồn sai (không chứng minh được):**
  14:03:07Z có thể là thời điểm PHÁT HIỆN reboot (ai đó thấy
  boot mới lúc ~14:03Z sau khi T10 đóng cờ 14:01Z) bị ghi nhầm
  thành btime; hoặc VM clock đã nhảy ~+9m26s vào lúc nào đó rồi
  đồng bộ lại — nhưng journal boot này KHÔNG có dòng timesync/
  chrony/ntp nào, và clock VM lúc T5 mở khớp với clock runtime
  (task message 21:39:43 +07 = 14:39:43Z; `date -u` 14:39:54Z
  lúc exec đầu, chênh đúng ~11 s thực). T5 KHÔNG tự kết luận
  nguyên nhân — ghi rõ để T6/T10 phân xử; mọi bracket trong
  LIMITS này dùng 13:53:41Z.
- **Hệ quả thực tế:** (a) boot_id 541524e2 KHỚP nên không phải
  boot khác — chỉ mốc btime sai; (b) "reboot SAU khi đóng cờ"
  trong brief có thể vẫn đúng theo nghĩa phát hiện, nhưng theo
  btime kernel thì reboot xảy ra 13:53:41Z — TRƯỚC mốc đóng cờ
  T10 14:01Z ghi trong aggregate (nếu cả hai mốc đều theo cùng
  một clock) — mâu thuẫn này cũng chờ T6/T10 phân xử, T5 không
  tự sửa timeline đợt 138; (c) số thứ tự boot (dự kiến #96?)
  chờ T6 xác nhận — T5 không tự đánh số.
- **Bài học:** btime trong brief/marker KHÔNG được lấy làm
  chuẩn khi kernel + log mâu thuẫn — luôn đối chiếu /proc/stat
  + uptime -s + dpkg.log trước khi dùng.

### 3.2 Số liệu chốt #96? (T5-139 đo trực tiếp; T4 poll #5–#9 làm mốc chéo)

| Hạng mục | Lúc mở (14:39–14:44Z) | Lúc đóng | Đối chiếu |
|---|---|---|---|
| dpkg.log dòng | 1545 | 1545 | = baseline #92?/#94? ✓ |
| `status installed` | 221 | 221 | = baseline ✓ |
| dòng chứa `configure` | 462 | 462 | = baseline ✓ |
| action `configure` (cột 3) | 178 | 178 | = đợt 138 ✓ |
| action `install` (cột 3) | 169 | 169 | = đợt 138 ✓ |
| dòng `gstreamer` | 98 | 98 | = đợt 138 ✓ |
| dpkg.log md5 | `9b0c0c0d…` | `9b0c0c0d…` | không đổi suốt phiên ✓ |
| dpkg.log mtime | 13:57:33.52Z | 13:57:33.52Z | đóng băng từ 13:57:33Z ✓ |
| gói cuối | gstreamer1.0-tools 13:57:33Z | như vậy | boot +3m52s ✓ |
| configure đầu | 13:54:12Z | như vậy | boot +31s ✓ |
| cache apt | 178 .deb / 156M | 178 / 156M | = số cuối đợt 138 ✓ |
| lists / partial | 37 / 0 | 37 / 0 | xem ghi chú lists dưới |
| GST hệ thống / debroot | 269 / 269 (thư mục THẬT) | 269 / 269 | = số cuối đợt 137–138 ✓ |
| term.log dòng `Get:` | 0 (980 dòng) | 0 | cài từ cache ✓ |
| proc apt/dpkg | 0 | 0 | replay đã dừng hẳn ✓ |
| postboot check | PASS exit 0 (poll0 14:46Z + poll0b 14:47Z sau sửa header) | — | đủ 11 gói + GST isomp4/libav ✓ |

- **Kết luận: replay boot 541524e2 XONG HẲN.** Mọi chỉ số đóng
  băng từ 13:57:33Z (hơn 42 phút trước lúc T5 mở) và trùng khớp
  baseline #92?/#94? từng dòng đếm. Không có lần ghi dpkg.log
  nào sau 13:57:33Z; không có proc apt/dpkg nào sống;
  cache/GST ổn định.
  Bracket chuẩn: **(configure 13:54:12Z = boot +31s, xong
  13:57:33Z = boot +3m52s, 1545 dòng / 221 installs / 462
  configure)** — nhanh nhất từ trước tới nay nếu tính từ boot
  (#94? +6m05s; #48 +2m44s tính từ hoạt động apt đầu tiên
  19:44:26Z nhưng boot +40s → xong boot +2m44s — xem ghi chú
  so sánh dưới).
- **Ghi chú so sánh bracket:** boot #48 (đợt 116) xong ở boot
  +2m44s tính từ hoạt động apt đầu tiên (+40s) — tức xong lúc
  boot +3m24s nếu tính từ btime (19:43:46Z → 19:46:30Z =
  2m44s — T5-116 ghi "(0'40\", 2'44\"]" là khoảng từ lần kiểm
  FAIL tới PASS, không phải từ btime). Để so sánh công bằng:
  #96? mất 3m21s từ configure đầu (13:54:12Z) tới gói cuối
  (13:57:33Z); #94? mất ~5m16s (09:36:50Z → 09:42:06Z).
  #96? vẫn là replay đầy đủ nhanh nhất theo thời gian cài
  thực (3m21s vs 5m16s của #94?).
- **Ghi chú lists 37 vs 71 (đợt 138):** `ls /var/lib/apt/lists/`
  đếm 37 mục (auxfiles + lock + partial + 34 file Packages/
  InRelease/Translation của 4 suite noble/updates/security/
  backports). Đợt 138 đếm 71 trên boot #94? — T5-139 KHÔNG
  xác minh được 71 đó gồm những gì (không có listing lưu lại
  đợt 138); 37 hiện tại là đủ cho postboot PASS (11 gói apt
  đủ, `apt-get update` không cần chạy lại) và replay đã cài đủ
  221 gói từ cache. T5 ghi nhận chênh lệch mà không kết luận
  lists thiếu — postboot là gate, không phải số lists. T10/T6
  lưu ý nếu muốn đối chiếu lists các boot sau (nên lưu listing
  đầy đủ, không chỉ số đếm — bài học nhỏ, xem §11).
- Cờ `POSTBOOT_PASS` round139-t5/ ghi **14:47:53Z**
  (`boot_id=541524e2-… btime=2026-11-18T13:53:41Z pass_at=
  2026-11-18T14:47:53Z poll=0`) — T4 đã đọc cờ ở **poll #9
  (14:48:38Z**, ~45 s sau khi ghi; t5flag=PASS(t5src=139-t5/
  POSTBOOT_PASS), postboot_exit=0, dpkg_lines=1545). Các poll
  #5–#8 trước đó đọc đúng fallback round138-t5/ là `cu`
  (mtime-cu — cờ boot cũ 914964c3, không tính) — đúng quy
  trình gate 0.

### 3.3 Luật (C) KHÔNG kích hoạt — và vì sao không cần watcher

- Replay đã XONG trước khi T5 mở (postboot PASS ngay poll0,
  0 proc apt/dpkg, dpkg đóng băng ở bracket chuẩn đầy đủ) nên
  **không có chế độ lỗi nào để luật (C) đánh giá**: điều kiện
  (a) postboot FAIL tươi — KHÔNG đạt (PASS exit 0); (d) dạng
  (C) dpkg ≤2 dòng — KHÔNG đạt (1545 dòng). Do đó T5 **không
  lập watcher** cho boot này (khác đợt 138: watcher b92 chỉ
  cần vì replay boot mới KẸT ở update khi T5 mở). Tiết kiệm
  đúng 1 tiến trình nền + 28 poll log; gate 0 của T4 dùng cờ
  trực tiếp thay vì chờ watcher.
- **(B) TRIGGER: không áp dụng** (không có watcher, không có
  repair). **--repair: 0 lần** đợt này. So sánh: đợt 138 luật
  (C) kích hoạt LẦN ĐẦU (kill 802 + repair PASS); đợt 139 (C)
  không đủ điều kiện ngay từ poll0 — hai đợt liên tiếp cho
  thấy (C) chỉ kích hoạt khi replay thật sự kẹt, không phải
  mặc định sau mỗi reboot.
- Replay #95? (boot 914964c3) — "còn dở" theo brief: boot đó
  chỉ có 113 installs qua --repair (795 dòng), KHÔNG BAO GIỜ
  có replay đầy đủ 221 gói (boot chết trước khi T5-139 mở).
  **Không thể "hoàn tất" replay #95? trên boot 541524e2** —
  dpkg.log là log mới của boot mới; replay đầy đủ 1545/221/462
  trên boot 541524e2 là bracket của boot #96? (chờ T6), không
  phải phần tiếp nối của #95?. T5 ghi rõ để khỏi đọc thành
  "replay #95? đã hoàn tất ở đợt 139" — #95? giữ nguyên trạng
  thái dở (113 installs qua repair) trong hồ sơ.

### 3.4 Postboot script — sửa 1 lần cho boot mới (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5 `d4a33a9e…`
(cuối đợt 138) → **`6b0874ba…`** (đợt 139, boot 541524e2):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 14:46–14:47Z | 541524e2 | `d4a33a9e…` → `6b0874ba…` | header (đoạn Dot 139 boot mới, ghi rõ mâu thuẫn btime 14:03:07Z vs 13:53:41Z + F-139-T5-1) + say: boot mới, replay xong nhanh nhất, postboot PASS poll0, balloon đang xả, KHÔNG watcher/KHÔNG luật (C) — **chỉ mô tả trạng thái lúc mở, KHÔNG khẳng định kết quả poll0 trước khi chạy** (bài học F-136-T5-1: say viết sau khi đã có kết quả poll0 14:46Z, nhưng nội dung say chỉ mô tả trạng thái đã đo được, không tiên đoán) |

- `bash -n` OK sau khi sửa. **KHÔNG đổi logic** (không đổi thứ
  tự apt/GST, không đổi NEED/threshold). Check-only chạy lại
  sau sửa (poll0b 14:47Z): **exit 0** — cùng kết quả như trước
  sửa (poll0 14:46Z exit 0), chứng minh sửa header/say không
  ảnh hưởng logic.
- Lưu ý: say mới ghi "brief ghi 14:03:07Z la SAI, xem
  F-139-T5-1" — đây là kết luận của T5 sau đối chiếu 8 nguồn,
  ghi trong script để các poller sau đọc log không bị nhầm
  theo số brief.

## 4. Kiểm cây — md5 3 file lúc mở / cuối + postboot script

| File | Lúc mở 14:39–14:44Z | Lúc đóng | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | d4a33a9e… | 6b0874ba… (sau 1 lần sửa cho boot mới, xem §3.4) | chỉ header + say, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này (không sửa, không revert). T4-139 cũng
  độc lập ghi tree=YES:md5=530e10a7 ở mọi poll #5–#9 (đối chiếu
  chéo với tree-md5.txt của T4).
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief + marker đợt 138, T5 không tự xác minh qua git).
- Không có file repo nào khác bị T5 sửa (xem §10).

## 5. Sampler RAM — Balloon WOBBLE, không có cửa sổ guard; gate A mở rồi đóng lại

- Sampler T5: launch 14:45:22Z (nohup + đường dẫn tuyệt đối —
  bài học F-138-T5-4), **40 mẫu × 60 s, 14:45:22–15:24:22Z**,
  ghi `round139-t5/ram-sampler.log`, xong 15:25:22Z
  (`SAMPLER_DONE`, đúng thiết kế 40 mẫu — không chạy tới hạn
  cứng đợt).

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 14:45:22 | 1.693.024 | 5.022.776 | 1,90 |
| 2 | 14:46:22 | 1.701.284 | 5.008.644 | 2,56 |
| 3 | 14:47:22 | 2.119.480 | 4.615.428 | 2,45 |
| 4 | 14:48:22 | 2.000.908 | 4.846.092 | 1,75 |
| 5 | 14:49:22 | 1.790.536 | 5.060.492 | 1,30 |
| 6 | 14:50:22 | 1.548.196 | 5.260.896 | 1,16 |
| 7 | 14:51:22 | 1.392.188 | 5.442.704 | 0,88 |
| 8 | 14:52:22 | 1.224.900 | 5.607.272 | 0,47 |
| 9 | 14:53:22 | 1.294.776 | 5.518.880 | 1,00 |
| 10 | 14:54:22 | 1.500.156 | 5.426.376 | 1,15 |
| 11 | 14:55:22 | 1.035.780 | 4.986.692 | 0,53 |
| 12 | 14:56:22 | 979.172 | 5.115.500 | 0,68 |
| 13 | 14:57:22 | 896.020 | 5.240.876 | 1,19 |
| 14 | 14:58:22 | 939.452 | 5.375.048 | 0,88 |
| 15 | 14:59:22 | 1.438.372 | 5.497.428 | 0,55 |
| 16 | 15:00:22 | **2.683.616** | **4.186.708** | 0,96 |
| 17 | 15:01:22 | 2.390.556 | 4.471.012 | 0,42 |
| 18 | 15:02:22 | 1.387.396 | 4.706.244 | 1,00 |
| 19 | 15:03:22 | 1.326.980 | 4.668.872 | 1,28 |
| 20 | 15:04:22 | 1.465.468 | 4.794.076 | 0,86 |
| 21 | 15:05:22 | 1.310.788 | 4.969.220 | 0,35 |
| 22 | 15:06:22 | 1.129.616 | 5.125.344 | 0,13 |
| 23 | 15:07:22 | 1.379.020 | 5.263.800 | 0,16 |
| 24 | 15:08:22 | 1.272.216 | 5.446.508 | 0,54 |
| 25 | 15:09:22 | 1.228.592 | 5.612.000 | 0,35 |
| 26 | 15:10:22 | 1.006.664 | 5.073.920 | 1,55 |
| 27 | 15:11:22 | 1.256.332 | 5.152.976 | 1,45 |
| 28 | 15:12:22 | 1.206.316 | 5.308.852 | 0,62 |
| 29 | 15:13:22 | 1.495.220 | 5.381.660 | 0,50 |
| 30 | 15:14:22 | 2.546.376 | 4.377.452 | 0,45 |
| 31 | 15:15:22 | 2.278.500 | 4.649.184 | 0,16 |
| 32 | 15:16:22 | 2.020.452 | 4.893.248 | 0,06 |
| 33 | 15:17:22 | 1.786.784 | 5.112.988 | 0,02 |
| 34 | 15:18:22 | 1.583.172 | 5.312.996 | 0,19 |
| 35 | 15:19:22 | 1.417.588 | 5.489.464 | 0,86 |
| 36 | 15:20:22 | 1.260.648 | 5.652.756 | 0,49 |
| 37 | 15:21:22 | 1.108.680 | 5.802.084 | 0,45 |
| 38 | 15:22:22 | 998.184 | 5.936.752 | 0,31 |
| 39 | 15:23:22 | 838.968 | 6.060.064 | 0,11 |
| 40 | 15:24:22 | 774.940 | 6.168.364 | 0,12 |

- Thống kê (tính bằng code trên 40 mẫu): min **774.940 kB lúc
  15:24:22Z** (mẫu cuối); max **2.683.616 kB lúc 15:00:22Z =
  2.620,7 MiB = 42,7% guard 6.144 MiB (6.291.456 kB)**; trung
  bình 1.467.683 kB; Balloon min **4.186.708 kB lúc 15:00:22Z**,
  max **6.168.364 kB lúc 15:24:22Z**, trung bình 5.191.041 kB.
  **0 mẫu ≥ 6.144 MiB.** Gate A (≥1.048.576 kB): **32/40 mẫu
  đạt, 8 mẫu dưới** — 8 mẫu dưới gate tập trung ở 2 đoạn:
  14:56–14:58Z (3 mẫu) và 15:22–15:24Z (3 mẫu) + 2 mẫu lẻ.
  Load1 0,02–2,56 (cao đầu phiên khi 9 luồng chạy, ~0,1–0,5
  cuối phiên khi các luồng đã xong).
- **Hình dạng wobble (mới):** balloon phình chậm ~+150–200k
  kB/phút, xen 2 lần XẢ ĐỘT NGỘT ~1M kB trong 1 phút: mẫu 15→16
  (14:59:22Z → 15:00:22Z: balloon −1.310.720 kB, avail
  +1.245.244 kB) và mẫu 29→30 (15:13:22Z → 15:14:22Z: balloon
  −1.004.208 kB, avail +1.051.156 kB). Sau mỗi lần xả, balloon
  phình lại đơn điệu cho tới lần xả sau hoặc tới cuối series.
  Xu hướng ròng trong phiên: balloon TĂNG (5,02M → 6,17M kB),
  avail GIẢM (1,69M → 0,77M kB) — đợt "xả" từ trần kẹt 6,44M
  về ~4,19M chỉ là phần giữa của wobble, không phải xu hướng
  bền vững. Lúc đóng (15:26:38Z, ngoài series): avail
  **485.964 kB**, balloon **6.397.220 kB** — chỉ còn 46.604 kB
  dưới trần kẹt 6.443.824 kB, gần như mức phẳng ~500 MB của
  đợt 138.
- **Tương quan với hoạt động T4:** mẫu 26 (15:10:22Z) balloon
  GIẢM 538.080 kB nhưng avail CŨNG GIẢM (1.228.592 → 1.006.664
  kB) — phá vỡ quan hệ avail+balloon ≈ hằng số; cùng lúc load1
  nhảy 0,35 → 1,55. Cửa sổ này trùng attempt2/attempt3 của T4
  (phân tích attempt2 15:07:27Z, coverage attempt3 15:13:40Z) —
  vite/WebKit của attempt tiêu RAM thật, không phải balloon.
  T5 chỉ ghi nhận tương quan, kết quả attempt thuộc T4.
- **Đối chiếu T9 (chủ quản birefnet):** T9 sampler dài chạy
  song song — nếu cửa sổ guard mở sau khi T5 đóng (15:26Z),
  T9 là luồng bắt được theo quyết §12.3(d) đợt 138. Trong
  phiên T5, đỉnh cao nhất chỉ 42,7% guard — **không có cửa sổ
  nào, không ai thử birefnet**. u2net vẫn là fallback chính thức.
- **T5 KHÔNG thử birefnet** (brief loại trừ; việc của T9 theo
  quyết §12.3(f) đợt 137). Birefnet vẫn 0 lần chạy thành công
  trong gói (tính tới lúc T5 đóng).
- So sánh: đợt 138 max 6.112.624 kB (97,2% guard, suýt vượt);
  đợt 139 max 2.683.616 kB (42,7% guard) — **thấp hơn hẳn** vì
  balloon không xả sâu như đợt 138 (đợt 138 balloon xả tới
  716.868 kB; đợt 139 chỉ tới 4.186.708 kB). Cửa sổ vượt guard
  đợt này không mở ra dù chỉ một mẫu.

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 136 cuối (T5) | 2276 | boot 1ca1feaa |
| Đợt 137 mở boot 1 / mở boot 2 / cuối (T5) | 2178 / 2168 / 2168 | boot 2104246b / 17db9652 |
| Đợt 138 mở / mở boot 2 / cuối (T5) | 2065 / 2058 / 2056 | boot #94? / 914964c3 |
| **Đợt 139 mở (T5, 14:48Z)** | **1950** | **boot 541524e2, headroom-open.txt** |
| **Đợt 139 cuối (T5, 15:26Z)** | **1948** | **headroom-end.txt** |

- Giảm −106 so với cuối đợt 138 (2056 → 1950) rồi −2
  trong phiên (1950 → 1948); chuỗi dài hạn tiếp tục giảm đều (~100–110/đợt,
  9 đợt gần nhất). Còn ~148 trên ngưỡng báo user (< ~1.800)
  lúc đóng — **chỉ theo dõi, chưa đưa lên user** (quyết parent
  đợt 137 §12.3(j) = quyết đợt 126 §12(h)). Phép chia minh họa:
  148/106 ≈ 1,4 đợt nữa nếu đà giữ nguyên — CHỈ là phép chia,
  KHÔNG phải dự báo (quyết (j) đợt 138 đã ghi rõ).
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **411 (lúc mở)** — watch giữ ngoài cell như các đợt
  trước (~61k watch ngoài cell theo T9).

### 6.2 Disk

- Overlay `/`: 7,5G tổng, 498M đã dùng, **6,8G trống (7%)** lúc
  kiểm 14:51Z — đủ (đợt 138: 6,7G trống; tăng trống ~100M do
  rootfs rebuild theo boot mới — không phải vấn đề).
  `/tmp` tmpfs 512M, 508M trống (1% dùng).
- Không có ENOSPC nào ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` tồn tại; `vite --version` =
  **vite/6.4.5 linux-x64 node-v24.22.1** (chạy được). T5 KHÔNG
  chạy dev server / build (không sửa production; việc của T8).

## 7. EPERM scan + WFS #45 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #58 (T2-139): ok=2 fail=0, boot=541524e2, 14:44:16Z**
  (`round139-t2/once.txt`, exit 0; status2 ALIVE). Trước probe,
  status1 DEAD/STALE (heartbeat #57 age 11.108 s — đúng,
  heartbeat từ probe #57 trên boot cũ 17db9652; death được ghi
  vào log kèm dòng `boot changed 17db9652 -> 541524e2`, không
  phải im lặng). Probe #58 là probe đầu tiên trên boot 541524e2.
- T5 KHÔNG chạy probe riêng (phối hợp T2 để không đếm trùng sóng
  — tiền lệ T5-137/T5-138; brief đợt này ghi "EPERM probe đợt
  này (đánh số tiếp theo)" được thỏa bằng probe #58 của T2 —
  T5 ghi nhận + đối chiếu, không chạy thêm).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng**.
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #57→#58
  (17db9652→541524e2, age 11.108 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–138).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** Sweep của
  T2-139 (eperm-sweep58.py, `round139-t2/eperm-sweep-run.log`)
  ĐÃ CHẠY và đồng thuận: "sóng EPERM vẫn bật: 0", "CẢNH BÁO
  (10-phút): 0", "Operation not permitted: 0", "sóng EPERM đã
  tắt: 2" — cả 2 đều trong `round138-t10/t10-o8.log` (dòng
  launcher 13:45:07Z + 13:46:07Z — **dương tính giả đã biết**,
  cùng 2 dòng T2-137/T2-138 đã phân loại); extended raw 'EPERM'
  matches: 8 total / 8 unique (2 dòng "đã tắt" + 6 dòng test-pass
  hasEperm). EPERM vẫn KHÔNG được tuyên bố là đã hết (quy ước
  đứng).

### 7.3 WFS scan #45 (T5 chạy, 14:48:52–14:49:09Z, 17 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round138-t2,
  copy sang round139-t5, **đổi OUT round137-t2 → round139-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round139-t5, không
  còn tham chiếu round cũ nào trong script). Kết quả:
  - NEWSTD: **924 dòng / 258 file** (phạm vi 3.152 file);
  - R7b đối chiếu: **949 dòng / 275 file** (phạm vi 12.545 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43, 44.
  - Đối chiếu chéo: 924+25=949=R7b, **chênh 0**.
- **+11 dòng / +3 file so với lần 44 (T5)** (913/255 → 924/258),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (lần này
  KHÔNG cần suy luận số học như #44 — file thô #44 còn nguyên
  trong round138-t5/):
  | Phạm vi | #44 (T5, 11:40:01Z) | #45 (T5, 14:48:52Z) | Delta |
  |---|---|---|---|
  | NEWSTD scope | 3.141 | 3.152 | +11 file, 0 file mất |
  | NEWSTD | 913/255 | 924/258 | +11/+3 |
  | R7b | 938/272 | 949/275 | +11/+3 |
  | copies | 25/17 | 25/17 | 0 |
  - 11 file mới trong scope = đúng 11 file `docs/` đóng đợt 138
    (DEF_v0.5.md + aggregate + T1–T9 LIMITS); 0 file mất.
    Trong 11 file mới, chỉ 3 file có hit: aggregate +2, T2-138
    +6, T5-138 +3 (= +11); 8 file còn lại 0 hit. Diff
    wfs-newstd.txt #44→#45 chỉ ra đúng 3 dòng thêm, không file
    nào đổi số hit, không file nào mất hit.
- **Đối chiếu chéo với lần 44 của T2** (915/256, R7b 940/273,
  scope 3.146, 11:48:37Z): #45 hơn +9/+2 (scope +6). Diff scope:
  6 file mới (aggregate, T2-138, T4-138, T7-138, T8-138, T9-138
  — tạo sau 11:48:37Z); diff wfs: aggregate +2, T2-138 +6 (mới),
  T5-138 LIMITS 2→3 (+1 — file được T5-138 sửa lúc đóng sau
  11:48:37Z, thêm 1 lần nhắc writeFileSync). 915+2+6+1=924 ✓;
  256+2=258 ✓ (aggregate + T2-138 là 2 file có hit mới;
  T4/T7/T8/T9-138 0 hit). Hai lần quét #44 độc lập + #45 khớp
  nhau sau khi giải thích delta.
- **Kết luận: 45 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #58. Đối chiếu #45 với số tổng kết #43
  trong LIMITS T2-137 §2.7 (907/253, R7b 932/270, copies 25/17)
  theo quyết parent đợt 138 §12.3(h) — chuỗi kiểm chứng giữ
  được mà không cần file thô #43 (đã mất do F-138-T5-1).

### 7.4 F-138-T5-1 — bài học đã áp dụng đúng đợt này

- T5-139 copy `round138-t5/scan-wfs-t5.sh` → `round139-t5/
  scan-wfs-t5.sh`, đọc dòng OUT TRƯỚC khi chạy: OUT vẫn là
  `round137-t2` (bản copy đợt 138 không sửa OUT trong script —
  T5-138 chỉ chuyển file kết quả sau khi chạy). T5 sửa OUT →
  `round139-t5` bằng muse.edit rồi **verify lại bằng grep**
  (chỉ 1 dòng OUT, đúng round139-t5; không còn tham chiếu
  round cũ) rồi mới chạy scan #45. **Không ghi đè file nào.**
- **T2-139 cũng đã sửa OUT trước khi chạy:** `round139-t2/
  scan-wfs.sh` có OUT=round139-t2 (xác minh 14:51Z — T2 chưa
  chạy scan #45 của mình lúc T5 kiểm; xem §7.5 về đối chiếu
  chéo khi có).

### 7.5 Đối chiếu chéo T2 vs T5 (scan #45 — 2 lần quét độc lập)

- T2-139 chạy scan #45 của mình **14:57:34–14:58:00Z** (OUT đúng
  `round139-t2`, xem §7.4): NEWSTD **926 dòng / 259 file**
  (phạm vi 3.155), R7b **951/276** (phạm vi 12.548), copies
  25/17; 926+25=951 ✓.
- T5-139 scan #45 **14:48:52–14:49:09Z**: NEWSTD 924/258
  (3.152), R7b 949/275 (12.545), copies 25/17; 924+25=949 ✓.
- Delta T2−T5: **+2 dòng / +1 file** (cả NEWSTD lẫn R7b),
  copies y hệt. Diff 2 file wfs-newstd.txt: **chỉ khác đúng 1
  dòng — `./docs/PHASE9_ROUND139_T5_INFRA_LIMITS.md:2`** (LIMITS
  này, tạo ~14:52Z giữa 2 lần quét, nhắc writeFileSync 2 lần);
  phạm vi +3 = đúng 3 file mới (LIMITS này + T1-139 + T6-139;
  T1/T6 0 hit lúc quét — đã kiểm; T6-139 có mtime 15:02:46Z
  do sửa sau khi quét, nhưng file đã tồn tại lúc T2 quét nên
  nằm trong scope — số hit tính theo nội dung lúc quét).
  924+2=926 ✓; 258+1=259 ✓. **Hai lần quét độc lập khớp nhau
  sau khi giải thích delta — chênh 0 được củng cố lần thứ hai
  trong đợt này** (lần một: diff trực tiếp #44→#45 ở §7.3).

### 7.6 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

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
  để né EPERM trong mù #58.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–138). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.
  Quyết parent đợt 138 §12.3(g): đổi watchdog diag path sang đợt
  hiện tại ở đợt 139 — việc của T8, T5 không đụng.

## 9. Nợ mở sang đợt sau

1. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (max 2.683.616 kB = 42,7% guard lúc
   15:00:22Z — xa guard; balloon wobble 4,19–6,17M kB, phình
   lại tới 6,40M kB lúc đóng, không xả đơn điệu về 0). T9
   sampler dài là luồng bắt cửa sổ nếu có sau khi T5 đóng;
   guard 6.144 MiB GIỮ NGUYÊN (quyết §12.3(d) đợt 138).
   u2net là fallback chính thức.
2. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Lượt yên
   #16 (T4) ĐÃ MỞ (poll #9, gate0 PASS + gateA đủ RAM 1859 MB)
   — attempt1 chạy 14:48:38Z, exit 1 lúc 14:48:45Z; attempt2
   phân tích 15:07:27Z (json 421.627B); attempt3 coverage 4/4
   lúc 15:13:40Z; T4 đã đóng cờ (round139-t4.done) — kết quả
   thuộc T4 (xem LIMITS T4-139). **Ghi nhận (không phải lỗi T5):
   poll-t4.log dừng ở poll #9 + dòng attempt1** — không thấy
   poll #10+ trong file đó tới lúc T4 đóng, dù chain-t4.log
   cho thấy attempt2/attempt3 đã chạy (T4 có thể ghi poll tiếp
   theo ở nơi khác hoặc poller đã chuyển pha sau attempt1 —
   T4 giải thích trong LIMITS của mình; T5 chỉ ghi nhận để
   khỏi đọc thành "poller chết"). T5 ghi load1/RAM cửa sổ mình
   (§5) để T10/T4 đối chiếu tương quan tải–median khi có số
   tickCost #16. Bàn lại ngưỡng chỉ khi #16 vượt 60 ms hoặc
   ba lượt liên tiếp ≥55 ms mà đã loại trừ tải.
3. **Lượt yên #16** — đang đo trên boot mới sau khi cờ round139-t5/
   được ghi (T4 đã đọc cờ ở poll #9). Cộng dồn giữ nguyên:
   **P1 28/28, P3 24/28, P7 14/14** (quy ước từng seq); DEF v0.5
   (P5 34–52 ms + P3' stall-based) đã chấp nhận, T3 viết ở đợt
   138 — P3' vẫn chưa được kiểm lần nào.
4. **F-139-T5-1 (§3.1/§11): btime 14:03:07Z trong brief SAI —
   ĐÃ ĐƯỢC T1-139 XÁC MINH ĐỘC LẬP (F-139-T1-1).** T5 lấy
   13:53:41Z làm chuẩn. Thứ tự reboot/cờ đóng nay ĐÃ RÕ:
   reboot 13:53:41Z TRƯỚC cờ đóng đợt 138 (14:01:14Z) — câu
   "reboot sau khi đóng cờ" trong brief sai cả mốc lẫn thứ tự.
   Còn chờ T6/T10: số boot 541524e2 (dự kiến #96?) + có sửa
   marker/brief hay không. Khung chết #95? (boot 914964c3) chờ
   T2-139 chốt từ merged mù #58; gap #95?→#96? chờ chứng nhận.
5. **Headroom tiếp tục giảm** (1950 lúc mở; còn ~150 trên
   ngưỡng báo < ~1.800) — chỉ theo dõi, chưa đưa lên user (quyết
   §12.3(j)).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 138 §11: mù #58
   mới mở (việc T2 đợt 139; gap #94?→#95? = 8.179 s chờ chứng
   nhận từ merged mù #58; CERT 55 / FULL 70); G1 chờ user quyết;
   ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
   gate không đổi + KHÔNG push khi user chưa nhắn "push đi"; R9
   (a) vẫn chờ user (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần cho boot mới (`d4a33a9e…` →
  `6b0874ba…`, header + say, KHÔNG đổi logic — xem §3.4).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-139 probe #58
  ok=2 fail=0). WFS scan #45 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1).
- Postboot: boot 541524e2 PASS exit 0 ngay poll0 (14:46Z) + chạy
  lại sau sửa header (poll0b 14:47Z) vẫn exit 0; cờ POSTBOOT_PASS
  ghi 14:47:53Z, T4 đã đọc ở poll #9 (14:48:38Z).
  **--repair: 0 lần. Watcher: KHÔNG lập** (replay đã xong —
  xem §3.3). **TRIGGER: không áp dụng.**
- Headroom: 1950 (mở) → 1948 (cuối).
- RAM phiên T5: 774.940–2.683.616 kB (n=40;
  Balloon 4.186.708–6.168.364 kB).
  RAM lúc đóng 485.964 kB (15:26:38Z).
- **Reboot GIỮA LUỘT: 0 lần** (boot 541524e2 sống suốt phiên T5).
- **started_at lượt 139:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: KHÔNG có reboot giữa lượt trong phiên
  T5 nên giả thuyết viết lại (đã kiểm chứng 8 lần ở các đợt
  trước) DỰ BÁO started_at KHÔNG bị viết lại trong phiên T5 —
  T10 kiểm lại lúc đóng (T5 ghi rõ đây là dự báo từ giả thuyết,
  không phải kết quả kiểm).

## 11. Sai số của T5 đợt này (F-139-T5-N)

- **F-139-T5-1 — Btime 14:03:07Z trong brief SAI (sai số của
  brief/marker, T5 phát hiện — MỚI, nghiêm trọng về mốc thời
  gian):** brief T5-139 + round-in-progress.md ghi btime boot
  541524e2 là 14:03:07Z; 8 nguồn độc lập + dpkg.log đều đọc
  13:53:41Z (chi tiết §3.1). **T1-139 (F-139-T1-1) verify độc lập:
  btime THẬT 13:53:41Z (epoch 1795010021), 4 nguồn khớp
  (/proc/stat, journal first entry 13:53:53Z, who -b/uptime,
  / birth) — khớp hoàn toàn với kết luận T5; reboot xảy ra
  TRƯỚC cờ đóng đợt 138 (14:01:14Z).** T5 lấy 13:53:41Z làm
  chuẩn và ghi rõ mâu thuẫn thay vì lặp lại số brief. **Hậu
  quả:** không ảnh hưởng số liệu kỹ thuật nào (boot_id khớp;
  replay/postboot/WFS đều đo trên boot đúng) — chỉ ảnh hưởng
  mốc thời gian và câu "reboot sau khi đóng cờ" (sai cả mốc lẫn
  thứ tự: reboot 13:53:41Z TRƯỚC cờ đóng 14:01:14Z — điểm này
  nay ĐÃ RÕ nhờ T1, không còn chờ phân xử). Còn chờ T6/T10: số
  thứ tự boot (dự kiến #96?) + có sửa marker/brief hay không.
  T5 KHÔNG tự sửa round-in-progress.md (file của parent).
  **Bài học:** btime trong brief/marker không phải chuẩn —
  luôn đối chiếu /proc/stat + uptime -s + dpkg.log trước khi
  dùng (cùng lớp lỗi với F-138-T5-3: brief ghi bracket sai —
  bài học "đối chiếu, đừng tin brief" vẫn đúng ở dạng khác).
- **F-139-T5-2 — (ghi chú) lists 37 vs 71 không đối chiếu được:**
  T5 ghi nhận lists đếm 37 trên boot này vs 71 đợt 138 nhưng
  không có listing đợt 138 để đối chiếu thành phần (xem §3.2).
  Không kết luận lists thiếu (postboot PASS là gate). Bài học:
  các đợt sau nên lưu `ls /var/lib/apt/lists/` đầy đủ, không
  chỉ số đếm.
- **F-139-T5-3 — (ghi chú) Sampler T5 dừng ở 40 mẫu theo thiết
  kế, không chạy tới hạn cứng đợt:** series 14:45:22–15:24:22Z
  + SAMPLER_DONE 15:25:22Z; RAM lúc đóng (15:26:38Z, ngoài
  series) đã rơi về 485.964 kB, balloon 6.397.220 kB — gần trần
  kẹt. Nếu T9/T10 cần mẫu RAM sau 15:25Z thì dùng sampler dài
  của T9 (chạy song song), không phải sampler T5 — T5 không
  gia hạn sampler của mình sau khi đã đủ 40 mẫu theo kế hoạch.
  (Cùng lưu ý: LIMITS này của T5 đóng góp +2 dòng vào scan
  WFS #45 của T2 — file được tạo giữa 2 lần quét; đã giải
  thích trọn vẹn ở §7.5, không phải sai số.)
- **F-139-T5-4 — (ghi chú, không phải lỗi T5) poll-t4.log dừng
  ở poll #9:** xem §9 mục 2 — T5 ghi nhận để T4/T10 đối chiếu,
  không tự chẩn đoán poller T4.

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND139_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  header + dòng `say` cho boot 541524e2; md5 cuối `6b0874ba…`;
  không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round139-t5/`
  (t5-start.txt, ram-open.txt, ram-sampler.log (40 mẫu) +
  ram-sampler.nohup.log, ram-sampler.sh,
  headroom-open.txt (1950), headroom-end.txt (1948),
  ram-end.txt, scan-wfs-t5.sh (bản copy
  — OUT đã sửa ĐÚNG round139-t5 TRƯỚC khi chạy, xem §7.4),
  scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
  wfs-r7b.txt, files-copies.txt, wfs-copies.txt — 7 file kết quả
  scan #45, t5-postboot-poll0.log (PASS exit 0),
  t5-postboot-poll0b.log (PASS exit 0 sau sửa header),
  `POSTBOOT_PASS` (cờ gate-visible — boot 541524e2, ghi
  14:47:53Z; T4 đã đọc ở poll #9).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round139-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round139-t5.done` (ghi rõ: boot
  541524e2 replay XONG HẲN (1545/221/462, boot +3m52s) trước khi
  T5 mở; postboot PASS poll0, cờ ghi 14:47:53Z, T4 đã đọc poll
  #9; btime brief 14:03:07Z SAI — kernel 13:53:41Z (F-139-T5-1,
  T1-139 F-139-T1-1 xác minh độc lập; reboot TRƯỚC cờ đóng đợt
  138 14:01:14Z);
  cây 530e10a7 không đổi; headroom 1950→1948;
  WFS #45 chênh 0; probe #58 ok=2 fail=0; 0 reboot giữa lượt).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Quét WFS (ĐỌC OUT TRƯỚC KHI CHẠY — xem F-138-T5-1):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round139-t5/scan-wfs-t5.sh
# Kiểm async .writeFile stray:
grep -rn --include='*.js' --include='*.ts' --include='*.mjs' --include='*.cjs' '\.writeFile(' ~/workspace/repo-1/apps ~/workspace/repo-1/packages | grep -v '/dist/'
```

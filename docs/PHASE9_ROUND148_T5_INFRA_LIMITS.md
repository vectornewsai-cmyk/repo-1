# PHASE9_ROUND148_T5_INFRA_LIMITS — BOOT MỚI d8a11644 REPLAY CHẠY TỐT (1545/221, +3m47s — KHÔNG PHÁ KỶ LỤC +2m56s) → postboot PASS poll=2, CỜ MỚI 17:44:24Z → T4-148 ĐO LẠI LƯỢT YÊN #21 BẰNG CỜ NÀY → KHOẢNG ~6,5 GB "KHÔNG NẰM TRONG RSS" ĐÃ QUY ĐƯỢC = BALLOON (ĐỐI CHIẾU ĐỊNH LƯỢNG) → SAMPLER n=40 ĐẦY ĐỦ, 0 MẪU ≥ GUARD (MAX 57,2%) → HEADROOM MỞ 548 → CUỐI 455 (DƯỚI NGƯỠNG LẦN 8 LIÊN TIẾP)

> Luồng T5, đợt 148, lượt cron 00:35 +07 20/11/2026 (mở 17:35:51Z;
> T5 mở thực tế 17:39:34Z, sampler chạy 17:41:49Z, burst-watch chạy
> 17:42:46Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **BOOT MỚI d8a11644** (btime **17:27:53Z** — uptime -s +
> /proc/stat btime 1795109273 KHỚP nhau; brief nói ~17:28:08Z là
> lệch 15 s, xem F-148-T5-2). Reboot xảy ra 17:27:53Z **trong lúc
> T10-147 đóng sổ** (T10 đóng 17:33:22Z theo MEMORY — TRỄ hạn cứng
> 17:30Z ~3 phút), TRƯỚC khi đợt 148 mở (17:35:51Z) — **0 reboot
> trong phiên T5-148** tới lúc đóng. Boot cũ 6fb582df chết ở
> 17:27:53Z; **tuổi thọ 18.867 s = 5h14m27s** (2 cách tính độc lập,
> xem §2.1; chờ T2-148 chứng nhận gap).
> Boot replay **CHẠY TỐT, XONG HẲN**: 1545 dòng / 221 installs /
> 462 configure, gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**,
> md5 `5ed60912…` (khác md5 file đóng băng đợt 146 — CHỈ do
> timestamp theo boot mới; số đếm + gói + phiên bản trùng tuyệt
> đối, xem §3.5). Bracket **+41s → +3m47s — KHÔNG phá kỷ lục**
> (+2m56s của 6fb582df vẫn đứng). **KHÔNG cần --repair.**
> Postboot PASS poll0 + poll1; cờ `POSTBOOT_PASS` mới ghi
> 17:44:24Z poll=2 — **T4-148 đo lại lượt yên #21 bằng cờ này**
> (quyết parent đợt 147: #21 đo lại tiếp ở đợt 148, KHÔNG chuyển
> sang #22; sửa probe là ưu tiên cao nhất của T4-148).
> **RAM: khoảng ~6,5 GB "không nằm trong RSS process nào" của
> T4-147 §6 ĐÃ QUY ĐƯỢC — LÀ BALLOON** (đối chiếu định lượng
> §5.2: RSS tổng 1.234.864 kB + balloon 4.789.124 kB + cache
> 804.476 kB + slab 352.432 kB ≈ used 7.421.876 kB, dư chỉ
> 240.972 kB). **KHÔNG phải leak, KHÔNG phải process ẩn.**
> Burst-watcher mới (delta `/proc/<pid>/stat` + `top -b -n1` +
> nr_running) **quy được nguồn tải tức thời**: cụm burst mở đợt
> (load1 tới 12,51) là tsc + WebKit/MiniBrowser + chrome +
> vite build + hatch — tải khởi động của các luồng đợt 148, KHÔNG
> phải burst bí ẩn. **SAMPLER n=40 ĐẦY ĐỦ: 0 mẫu ≥ guard**
> (max 3.598.524 kB = 57,2% guard lúc 18:04:50Z), gate A
> 38/40, balloon 0 mẫu ghim trần (max 5.491.000 kB = 85,2%
> trần). **HEADROOM MỞ 548 → CUỐI 455** (trần 63.747 không
> đổi; cap probe 30.000) — **DƯỚI NGƯỠNG LẦN 8 LIÊN TIẾP,
> CHỈ THEO DÕI** (caveat F-148-T5-5: đo giữa burst khởi động,
> có thể thấp tạm thời — nhưng cuối phiên còn thấp hơn, xem
> §6.1).
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa production**
> ngoài postboot script (dòng `say` + khối chú thích Dot 148 —
> dữ kiện boot đã đổi thật, xem §3.7). **KHÔNG tự chạy
> birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.
> **GHI CHÚ: LIMITS này OVERSIZE (42.618 B > 37.768 B)** —
> do bảng sampler 40 mẫu + burst-watcher mới; T10 push bằng
> ENABLE_PRIVSEP=0 theo tiền lệ file oversize.

## 1. Kết luận ngắn

1. **BOOT MỚI d8a11644 (btime 17:27:53Z): REPLAY CHẠY TỐT,
   ĐÃ XONG TRƯỚC KHI T5 MỞ.** dpkg.log **1545 dòng / 221
   installs / 462 configure**, md5 `5ed60912…`, mtime 17:31:40Z
   (boot **+3m47s** — không phá kỷ lục +2m56s), gói cuối
   gstreamer1.0-tools **1.24.2-1ubuntu0.2**; bracket replay
   (configure 17:28:34Z boot +41s → xong 17:31:40Z boot
   +3m47s). Cache apt **178 .deb / 156M** (sống qua reboot,
   y hệt đợt 146/147). Lists **37 (CHỈ 1 mirror azure — GIẢM
   từ 71 = 2 mirror, xem F-148-T5-3)**; term.log 0 dòng Get:
   (cài từ cache). GST hệ thống là **thư mục thật 269/269**;
   /var/log/apt có (50 Start-Date, 17:29:06–17:31:40Z).
   Postboot **PASS poll0 (17:44:04Z) + poll1 (17:44:24Z)**.
2. **CỜ POSTBOOT_PASS mới ghi 17:44:24Z poll=2**
   (`boot_id=d8a11644-1f76-4e48-94f6-97b2cf34fff8 btime=
   2026-11-19T17:27:53Z pass_at=2026-11-19T17:44:24Z poll=2
   repair=none/replay-full dpkg=1545/221`) — cờ này là cờ
   **đợt 148** (cờ đợt 147 cho boot cũ vẫn còn trong
   round147-t5/, pass_at 14:41:57Z). T4-148 đo lại lượt yên
   #21 bằng cờ này (quyết parent đợt 147).
3. **TUỔI THỌ BOOT 6fb582df = 18.867 s — XÁC NHẬN BẰNG 2 CÁCH
   TÍNH ĐỘC LẬP (xem §2.1).** (i) trừ datetime 12:13:26Z →
   17:27:53Z = 5h14m27s; (ii) trừ epoch btime 1795109273 −
   1795090406 = 18.867. **LƯU Ý:** brief nói btime mới
   "~17:28:08Z" và tuổi thọ danh nghĩa "18.882 s" — cả hai
   đều hơn số chính xác đúng 15 s (F-148-T5-2); T5 dùng số
   chính xác 17:27:53Z / 18.867 s. Chờ T2-148 chứng nhận gap
   (18.867 s) như các đợt trước.
4. **0 REBOOT trong phiên T5-148** (reboot xảy ra TRƯỚC khi
   đợt mở, trong lúc T10-147 đóng sổ). Boot vẫn d8a11644 từ
   lúc mở (17:39:34Z) tới lúc đóng (18:22:47Z, tuổi boot 54'54" = 3.294 s).
5. **SAMPLER RAM — 1 SERIES n=40 ĐẦY ĐỦ (xem §5).** Avail
   883.092–3.598.524 kB (mean 2.329.991), gate A **38/40**,
   max **3.514,2 MiB = 57,2% guard**, **0 mẫu ≥ guard**;
   balloon 2.461.672–5.491.000 kB (mean 4.131.539), **0 mẫu
   ghim trần 6.443.824 kB** — đợt thứ 5 liên tiếp sampler T5
   ghi 0 mẫu ghim. Hình dạng: răng cưa, KHÔNG đơn điệu như
   đợt 147 (balloon xả 2 lần sâu rồi phình lại). **Cửa sổ
   guard KHÔNG mở**; tự động hóa birefnet của T9 chưa có cửa
   sổ thật để kích hoạt đợt này.
6. **HEADROOM inotify MỞ 548 → CUỐI 455** (boot d8a11644,
   trần 63747) — xem §6.1. Cả hai **DƯỚI ngưỡng báo user
   (< ~1.800), lần thứ 8 liên tiếp**; tỉ lệ/vite ~0,35 →
   ~0,29. Trần **63747 — KHÔNG đổi**. Cap probe **30.000**
   (quyết (m) đợt 146) — cap không ảnh hưởng. Cuối phiên còn
   thấp hơn mở (−93) thay vì hồi lại (F-148-T5-5).
7. **CÂY:** preview.tsx **530e10a7**, media.ts **2c384ed1**,
   vite.config.ts **ee80d093** (mở = lúc đóng);
   postboot script **6e20b0ed… → c8c7c686…** (SỬA đợt này,
   xem §3.7; `bash -n` OK).
8. **EPERM (T2-148, T5 chỉ đối chiếu): probe #67 ok=2 fail=0,
   boot=d8a11644, 17:42:42Z**; log probe 190 → **193 dòng (+3
   đúng prereg: DEAD + boot-changed + #67)**. **Mù #67 ĐÓNG
   HOÀN TOÀN (T2-148, cờ 18:03Z — chuỗi lên 3)**; gap
   18.882 s → CERT 67 / FULL 82 (chuẩn /proc/1 — xem
   F-148-T5-2). **WFS scan: T5 KHÔNG chạy đợt này** (không
   thuộc brief; T2-148: WFS #54 chênh 0, lần thứ 54).
9. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
10. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 1 boot trong phiên (reboot xảy ra TRƯỚC khi đợt mở)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | d8a11644 (reboot #35? chờ T2 xác nhận; số thứ tự #111? chờ T2/T6) | 17:27:53 (uptime -s; /proc/stat btime 1795109273) | còn sống (lúc T5 đóng 54'54" tuổi = 3.294 s) | Replay CHẠY TỐT, xong boot +3m47s (1545/221, gói cuối tools 0.2) — KHÔNG phá kỷ lục +2m56s; postboot PASS poll0+poll1+poll2; cờ mới 17:44:24Z poll=2; T4-148 đo lại lượt yên #21 bằng cờ này; KHÔNG cần repair; sampler n=40 đầy đủ, 0 mẫu ≥ guard; balloon xả 2 lần sâu rồi phình lại; 0 reboot trong phiên |

- **Btime KHỚP 2 nguồn độc lập** (uptime -s 17:27:53Z +
  /proc/stat btime 1795109273 = 17:27:53Z; T2-148 probe #67
  cũng ghi boot=d8a11644, uptime since 17:27:53Z). **Brief
  nói ~17:28:08Z là lệch 15 s** (F-148-T5-2) — có thể là thời
  điểm T10 đọc/ghi chứ không phải btime thật.
- **Reboot KHÔNG xảy ra trong phiên T5:** boot_id kiểm lúc
  mở (17:39:34Z), lúc ghi cờ (17:44:35Z) và lúc đóng
  (18:22:47Z) đều là d8a11644-1f76-4e48-94f6-97b2cf34fff8.
  Reboot 17:27:53Z xảy ra trong lúc T10-147 đóng sổ (T10
  đóng 17:33:22Z, trễ hạn cứng 17:30Z ~3 phút — theo MEMORY),
  tức là TRƯỚC lượt cron 00:35 +07 (17:35:51Z) 7'58".

### 2.1 Tuổi thọ boot 6fb582df = 18.867 s — xác nhận bằng 2 cách tính độc lập

| Cách tính | Phép tính | Kết quả |
|---|---|---|
| (i) Trừ datetime (btime) | 2026-11-19T17:27:53Z − 2026-11-19T12:13:26Z | **18.867 s = 5h14m27s** |
| (ii) Trừ epoch btime | 1795109273 − 1795090406 | **18.867 s** |
| Đối chiếu | Brief đợt 148 (danh nghĩa) | 18.882 s — HƠN 15 s (F-148-T5-2) |
| Đối chiếu | T2-148 (gap chứng nhận, cờ 18:03Z) | **18.882 s → CERT 67 / FULL 82 (chuẩn /proc/1)** — khác chuẩn T5 (/proc/stat → 18.867 s); chờ parent/T10 chốt chuẩn |

- Hai cách tính độc lập nhau (datetime vs epoch) cùng ra
  18.867 s — không còn nghi ngờ số học. Đây là boot sống lâu
  nhất chuỗi gần đây (98a7c93f: 8.363 s). T5-148 KHÔNG tự
  chứng nhận gap (việc T2-148).

## 3. dpkg replay — CHẠY TỐT, KHÔNG cần repair; thực hành B4 (a)+(b)

### 3.1 Replay boot d8a11644 — kiểm trên boot mới (đã xong trước khi T5 mở)

| Hạng mục | Lúc mở (17:39–17:44Z) | Lúc đóng (18:22–18:23Z) |
|---|---|---|
| dpkg.log dòng | 1545 | 1545 (không đổi) |
| `status installed` | 221 | 221 |
| dòng chứa `configure` | 462 | 462 |
| dpkg.log md5 | `5ed60912…` | `5ed60912…` (không đổi) |
| dpkg.log mtime | 17:31:40Z (boot +3m47s) | 17:31:40Z (không đổi) |
| startup configure đầu | 17:28:34Z (boot +41s) | — |
| cài thật | 17:29:06–17:31:40Z (install đầu libaspell15 17:29:06Z) | — |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (17:31:40Z) | — |
| cache apt | 178 .deb / 156M | 178 .deb / 156M |
| lists / partial | 37 / 0 (1 mirror azure) | 37 / 0 |
| GST hệ thống / debroot | thư mục THẬT 269 file / 269 | 269 / 269 |
| /var/log/apt | có (history.log 50 Start-Date, 17:29:06–17:31:40Z) | 50 Start-Date |
| proc apt/dpkg/wrapper | 0 | 0 |
| postboot check | PASS poll0 (17:44:04Z) + poll1 (17:44:24Z) | + poll2 (18:22:38Z, exit 0) |

- Bracket replay: **(boot +41s, boot +3m47s]** — **KHÔNG phá
  kỷ lục** (+2m56s của 6fb582df vẫn đứng; nhanh thứ 2 trong
  các replay đầy đủ gần đây). Replay đã xong trước khi T5 mở
  (T5 mở 17:39:34Z, boot 11'41" tuổi, dpkg.log mtime 17:31:40Z
  đã đứng yên 8 phút).
- **KHÔNG cần watcher** (replay đã xong), **KHÔNG kích hoạt
  luật (C)**, **KHÔNG chạy --repair**.
- Số liệu **TRÙNG bracket replay đầy đủ chuẩn** (1545/221/462).
  Đây là replay đầy đủ thứ 7 liên tiếp (691a7403, cc222c8a,
  e146ca67, 98a7c93f, 6fb582df, d8a11644 — 6fb582df đếm 1 lần
  dù kiểm 2 đợt) sau 3 lần chết dạng (B) trong 4 đợt gần nhất.

### 3.2 Cờ POSTBOOT_PASS (đợt 148 — cờ mới cho boot mới)

| Boot | Cờ ghi (Z) | poll | Nội dung |
|---|---|---|---|
| d8a11644 | 17:44:24 | 2 | `boot_id=d8a11644-1f76-4e48-94f6-97b2cf34fff8 btime=2026-11-19T17:27:53Z pass_at=2026-11-19T17:44:24Z poll=2 repair=none/replay-full dpkg=1545/221` |

- Cờ ghi sau 2 poll PASS (poll0 17:44:04Z + poll1 17:44:24Z),
  theo đúng mẫu các đợt. Poll2 chạy lúc đóng (18:22:38Z,
  exit 0) — cờ đứng vững qua cả 3 poll. Cờ đợt 147 cho
  boot cũ (pass_at 14:41:57Z) vẫn còn trong round147-t5/;
  T5-148 KHÔNG ghi đè file đó.
- **Caveat (cùng họ F-147-T5-1):** pass_at 17:44:24Z là thời
  điểm *bắt đầu* poll1 (lệnh poll1 khởi động 17:44:24Z sau
  sleep 5 s từ poll0, kết thúc 17:44:25Z) — không phải thời
  điểm poll1 xong. Mẫu các đợt trước cũng ghi pass_at ≈ thời
  điểm poll1; T5 ghi rõ để T4/T10 không đọc sai.
- T4-148 đo lại lượt yên #21 bằng cờ này (quyết parent đợt
  147: #21 đo lại tiếp, KHÔNG chuyển sang #22) — T5 không
  kiểm poller T4 đợt này; T10 đối chiếu khi gộp.

### 3.3 So sánh replay các đợt gần nhất (bracket đầy đủ)

| Boot | Đợt | Bracket (configure → xong) | Gói cuối |
|---|---|---|---|
| 17db9652 (#94?) | 137 boot 2 / 138 | +49s → +6m05s | tools 1ubuntu0.1 |
| 541524e2 (#96?) | 139 | +31s → +3m52s | tools 1ubuntu0.1 |
| 2c0efe57 | 141 | +31s → +3m57s | tools 1ubuntu0.1 |
| 691a7403 (#106?) | 144 boot 1 | +34s → +4m53s | tools **1ubuntu0.2** |
| cc222c8a (#107?) | 144 boot 2 | +48s → +4m15s | tools **1ubuntu0.2** |
| e146ca67 (#108?) | 145 | +43s → +3m53s | tools **1ubuntu0.2** |
| 98a7c93f (#109?) | 146 | +44s → +4m14s | tools **1ubuntu0.2** |
| 6fb582df (#110?) | 146 boot 2 / 147 kiểm lại | +37s → **+2m56s** | tools **1ubuntu0.2** |
| **d8a11644** | **148** | **+41s → +3m47s** | tools **1ubuntu0.2** |

- Boot d8a11644 **không phá kỷ lục** (+3m47s, chậm hơn
  +2m56s đúng 51 s) nhưng là replay nhanh thứ 2 trong chuỗi
  7 replay đầy đủ liên tiếp.
- Gstreamer tools **1.24.2-1ubuntu0.2** lần thứ 7 liên tiếp
  theo boot (691a7403 → d8a11644); thread "3 phiên bản" vẫn
  đóng (T5-148 không kiểm lại madison — không có dữ kiện mới;
  dpkg.log có đủ 6 gói gstreamer tools/base/good/bad/ugly/
  libav + fontconfig 2.15.0-1.1ubuntu2, xem §3.5).

### 3.4 Cache + lists

- **Cache 178 .deb / 156M (y hệt đợt 146/147).** Sống qua
  reboot #35? — lần thứ 4 liên tiếp (đợt 145/146/147/148);
  F-141-T5-4 nay đảo chiều: sống là mẫu thường xuyên.
- **Lists 37 / partial 0 (CHỈ 1 mirror azure)** — GIẢM từ 71
  (2 mirror) đợt 146/147. Xem F-148-T5-3: 2 URI cấu hình
  trong ubuntu.sources (azure.archive.ubuntu.com +
  mirror.cogentco.com) nhưng 0 file cogentco trong lists/;
  term.log 0 dòng Get: (cài từ cache, không chạy apt update
  đợt này); mtime các file lists cũ/stale. Không ảnh hưởng
  chức năng đã đo (replay đầy đủ 1545/221, postboot PASS).

### 3.5 Gstreamer + fontconfig — đối chiếu nhanh trên dpkg.log mới

- dpkg.log boot d8a11644: tools/base/good/bad/ugly/libav
  **đều `status installed`** (6/6 gói); fontconfig
  **2.15.0-1.1ubuntu2** installed 17:31:36Z, half-configured
  → installed 17:31:38Z (2–4 s trước dòng gói cuối, cùng mẫu
  đợt 146); triggers-pending 44 dòng.
- **md5 dpkg.log `5ed60912…` KHÁC file đóng băng đợt 146
  (`d2b2e788…`) — CHỈ DO TIMESTAMP THEO BOOT MỚI.** File
  đóng băng đợt 146 là manifest 9 dòng (counts + md5), KHÔNG
  phải bản copy đầy đủ dpkg.log nên T5-148 không diff từng
  dòng được; đối chiếu thay thế: số đếm 1545/221/462 + gói
  đầu libaspell15 + gói cuối tools 0.2 + 6 gói gstreamer +
  fontconfig 1.1ubuntu2 **trùng tuyệt đối** với mẫu replay
  đầy đủ chuẩn. Manifest mới: `dpkg-frozen-d8a11644.txt`
  (frozen 17:44:35Z, xem §3.6(a)).

### 3.6 Thực hành đối chiếu B4 theo (a)+(b) — quyết parent (h) đợt 145

> Đợt 148 KHÔNG có cửa sổ B4 nào được giao cho T5 đối chiếu
> (T4-148 đang sửa probe + đo lại lượt yên #21; cửa sổ attempt
> của T4-148 thuộc T4/T10 đối chiếu lúc đóng). Thực hành đợt này:

| Bằng chứng | Nội dung | Sức nặng |
|---|---|---|
| (a) dpkg.log boot d8a11644 — file đóng băng MỚI | `dpkg-frozen-d8a11644.txt` (frozen 17:44:35Z): 1545 dòng / 221 installs / 462 configure, md5 `5ed60912…`, mtime 17:31:40Z, gói cuối tools 0.2, history 50 Start-Date — **manifest mới cho boot mới**, thay thế manifest đợt 146 (boot cũ đã chết) cho mọi đối chiếu kiểu B4 trên boot này | **SẴN SÀNG** |
| (b) ps exact-comm lúc mở (17:44Z) | `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0, exact-comm apt-get/dpkg/unattended-upgrade = 0 trong `ps -eo comm` | **DEMO ĐÚNG PHƯƠNG PHÁP** — cùng phương pháp T4-144 §6.1; không dùng grep chuỗi con (bài học F-146-T5-1) |
| (c) history.log live | 50 Start-Date, TẤT CẢ trong 17:29:06–17:31:40Z (replay boot d8a11644); **0 entry boot cũ** | **TÁI XÁC NHẬN F-145-T5-1** lần thứ 4 (reset mỗi reboot) |

### 3.7 Postboot script — SỬA đợt này (boot đã đổi — dữ kiện thật mới)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
**`6e20b0ed…` → `c8c7c686…`** (mở → sau sửa; `bash -n` OK).

- Đổi dòng `say` (dòng 631) + thêm khối chú thích `# Dot 148 —
  BOOT MOI SAU DOT 147` ghi đầy đủ dữ kiện boot mới (btime
  17:27:53Z, reboot #35? chờ T2 xác nhận, tuổi thọ boot cũ
  18.867 s, replay +3m47s, lists 37 = 1 mirror, headroom mở
  548, RAM gap đã quy = balloon). Khác quyết định của T5-147
  (không sửa vì cùng boot, dữ kiện vẫn đúng): đợt này boot ĐÃ
  ĐỔI nên dữ kiện trong dòng `say` cũ (DOT 146 / boot
  6fb582df / reboot #34 / +2m56s) là SAI cho boot hiện tại —
  sửa là bắt buộc để log poll0/poll1 đọc đúng.
- Hệ quả stage: đợt này T5 stage **2 file** (LIMITS này +
  postboot script) — khác đợt 147 chỉ stage 1 file.

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng

| File | Lúc mở 17:39–17:44Z | Lúc đóng (18:22–18:23Z) | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 6e20b0ed… → c8c7c686… | c8c7c686… | SỬA đợt này (xem §3.7) |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH
  VIỄN làm instrumentation theo quyết parent đợt 137 §12.3(a).
  T5 KHÔNG đụng file này.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 1 SERIES n=40 ĐẦY ĐỦ (17:41:49–18:21:51Z)

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup,
> đường dẫn tuyệt đối (script copy từ round147-t5/ram-sampler-
> boot2.sh, đổi OUT sang round148-t5 TRƯỚC khi chạy — kiểm
> bằng grep, không lặp lại F-138-T5-1: grep `round147|boot2`
> = 0 sau sed). **1 series, không reboot giữa phiên** (reboot
> xảy ra trước khi đợt mở).

### 5.1 Bảng mẫu — 40 mẫu đầy đủ (avail/balloon kB, load1)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
| 1 | 17:41:49 | 997.752 | 5.050.204 | 5.39 |
| 2 | 17:42:49 | 883.092 | 5.182.340 | 6.05 |
| 3 | 17:43:49 | 1.524.024 | 4.395.908 | 10.39 |
| 4 | 17:44:49 | 1.709.048 | 3.869.764 | 9.53 |
| 5 | 17:45:49 | 2.465.172 | 4.076.784 | 4.42 |
| 6 | 17:46:49 | 2.178.144 | 4.358.616 | 1.89 |
| 7 | 17:47:49 | 2.594.264 | 3.462.016 | 1.82 |
| 8 | 17:48:50 | 2.448.660 | 3.684.976 | 3.17 |
| 9 | 17:49:50 | 2.767.860 | 3.158.804 | 6.94 |
| 10 | 17:50:50 | 3.309.580 | 3.319.556 | 6.59 |
| 11 | 17:51:50 | 3.051.376 | 3.666.392 | 4.60 |
| 12 | 17:52:50 | 3.097.700 | 3.625.264 | 3.77 |
| 13 | 17:53:50 | 2.819.820 | 3.953.728 | 2.03 |
| 14 | 17:54:50 | 2.654.472 | 4.055.552 | 1.42 |
| 15 | 17:55:50 | 3.047.848 | 3.760.196 | 1.72 |
| 16 | 17:56:50 | 2.799.732 | 3.977.080 | 1.54 |
| 17 | 17:57:50 | 2.482.100 | 4.275.492 | 1.03 |
| 18 | 17:58:50 | 2.245.164 | 4.547.584 | 0.94 |
| 19 | 17:59:50 | 1.794.224 | 4.794.076 | 1.33 |
| 20 | 18:00:50 | 1.318.532 | 4.680.460 | 4.01 |
| 21 | 18:01:50 | 1.605.820 | 4.849.284 | 2.82 |
| 22 | 18:02:50 | 1.378.924 | 5.032.628 | 1.33 |
| 23 | 18:03:50 | 2.230.436 | 3.969.000 | 1.80 |
| 24 | 18:04:50 | 3.598.524 | 2.461.672 | 1.07 |
| 25 | 18:05:50 | 3.053.116 | 2.829.380 | 2.40 |
| 26 | 18:06:50 | 3.269.456 | 3.201.876 | 1.66 |
| 27 | 18:07:50 | 3.085.268 | 3.555.036 | 0.84 |
| 28 | 18:08:50 | 2.446.304 | 3.612.544 | 1.47 |
| 29 | 18:09:51 | 1.966.836 | 3.872.016 | 2.51 |
| 30 | 18:10:51 | 2.479.840 | 4.131.016 | 1.15 |
| 31 | 18:11:51 | 2.206.636 | 4.401.900 | 0.72 |
| 32 | 18:12:51 | 3.196.420 | 3.632.668 | 1.27 |
| 33 | 18:13:51 | 3.028.020 | 3.797.624 | 0.46 |
| 34 | 18:14:51 | 2.597.468 | 4.115.408 | 0.92 |
| 35 | 18:15:51 | 2.411.656 | 4.405.748 | 0.60 |
| 36 | 18:16:51 | 2.146.952 | 4.670.048 | 0.27 |
| 37 | 18:17:51 | 1.818.548 | 4.907.708 | 0.75 |
| 38 | 18:18:51 | 1.648.208 | 5.118.592 | 0.90 |
| 39 | 18:19:51 | 1.476.348 | 5.311.620 | 0.33 |
| 40 | 18:20:51 | 1.366.288 | 5.491.000 | 0.45 |
- Thống kê (tính bằng code trên 40 mẫu): min avail **883.092
  kB lúc 17:42:49Z**; max **3.598.524 kB lúc 18:04:50Z =
  3.514,2 MiB = 57,2% guard**; trung bình 2.329.991 kB;
  Balloon min **2.461.672 kB lúc 18:04:50Z**, max **5.491.000
  kB lúc 18:20:51Z (85,2% trần)**, trung bình 4.131.539 kB;
  **0 mẫu ghim trần 6.443.824 kB**; Gate A (≥1.048.576 kB):
  **38/40 mẫu** (2 mẫu dưới gate là 2 mẫu đầu, lúc burst
  khởi động); load1 0,27–10,39.
- **Hình dạng: răng cưa, KHÔNG đơn điệu như đợt 147.**
  Balloon xả 2 lần sâu (5,18M → 3,16M lúc 17:49:50Z;
  5,03M → 2,46M lúc 18:04:50Z, avail vọt đỉnh series 3,60M)
  rồi phình lại tới 5,49M cuối phiên; nửa đầu mean avail
  2.309.428 / balloon 4.094.740, nửa sau 2.350.553 /
  4.168.338 — gần như phẳng. **CỬA SỔ GUARD: KHÔNG MỞ
  trong phiên này.** Max 57,2% guard — cao hơn 43,3% đợt
  147 nhưng còn thiếu 2.695.780 kB. Tự động hóa birefnet
  của T9 (quyết (l) phương án (a)) **chưa có cửa sổ thật để
  kích hoạt đợt này** — 0 lần thử birefnet (theo log T9 tới
  18:22:37Z, không file lock/trigger; T9 xác nhận chính
  thức).
- **Balloon: 0/40 mẫu ghim trần — đợt thứ 5 liên tiếp sampler
  T5 ghi 0 mẫu ghim** (đợt 144: 0/53; đợt 145: 0/40; đợt 146
  series 1: 0/37; đợt 147: 0/40; đợt 148: 0/40). NHƯNG
  balloon vẫn phình tới 5,49M (85,2% trần) cuối phiên —
  đóng băng chưa hết, chỉ là chưa ghim trong cửa sổ 40
  phút này.
- **Caveat (F-148-T5-4):** timestamp mẫu drift :49 → :50
  từ mẫu 8 (17:48:50Z) → :51 từ mẫu 29 (18:09:51Z) — sleep
  60 + thời gian chạy lệnh tích lũy ~1 s. Cadence vẫn ~60
  s/mẫu; không ảnh hưởng số liệu.

### 5.2 Đối chiếu định lượng RAM — KHOẢNG ~6,5 GB "KHÔNG NẰM TRONG RSS" ĐÃ QUY ĐƯỢC = BALLOON

> Snapshot 17:43Z (giữa burst khởi động đợt 148, load1 ~10):

| Hạng mục | kB | Ghi chú |
|---|---|---|
| MemTotal | 8.124.900 | |
| MemFree | 703.024 | |
| MemTotal − MemFree (used) | 7.421.876 | số `free` báo "used" |
| Σ RSS mọi process (`ps -eo rss`) | 1.234.864 | process lớn nhất MainThread 579.784 kB (node tsc), hatch 284.836 kB |
| Buffers | 8 | gần như 0 |
| Cached | 804.476 | |
| Slab | 352.432 | (SReclaimable 185.660) |
| **Balloon** | **4.789.124** | **58,9% MemTotal** |
| Σ (RSS + Buffers + Cached + Slab + Balloon) | 7.180.904 | |
| **Dư chưa quy (used − Σ)** | **240.972** | PageTables 37.344 + KernelStack 7.888 + Shmem/Cached đếm trùng + kernel reserved — cùng bậc với sai số đếm RSS (shared pages đếm trùng mỗi process) |

- **Kết luận: khoảng "không nằm trong RSS" = balloon.**
  Áp lại số T4-147 §6 (avail sập 2.253 MB → 194 MB, RSS tổng
  ~900 MB, `free` used 7.548/7.934 MB, buff/cache 631 MB):
  balloon lúc đó ~6,0–6,1M (sampler T5-147 cuối phiên
  6.100.180 kB) → 900 MB + 6.100 MB + 631 MB ≈ 7.631 MB ≈
  used 7.548 MB (chênh ~1% — trong sai số đếm trùng shared
  pages). **Khoảng ~6,5 GB của T4-147 chính là balloon lúc
  đó (~6,1 GB), KHÔNG phải leak, KHÔNG phải process ẩn,
  KHÔNG phải host "ăn trộm" ngoài balloon.** Balloon là bộ
  nhớ host thu hồi qua virtio-balloon, hiện trong
  `/proc/meminfo` dòng `Balloon` nhưng không thuộc RSS của
  process nào — đúng bản chất "không nằm trong RSS".
- **Hệ quả:** khi "RAM sập mà RSS tổng thấp", đọc ngay dòng
  `Balloon` trước khi nghi leak/process ẩn — T5-148 ghi đây
  làm chuẩn (ps RSS tổng + meminfo cùng thời điểm).
- **Caveat:** Σ RSS đếm trùng shared pages nên hơi cao hơn
  anon thật; dư 240.972 kB (~3% used) nằm trong sai số
  phương pháp, không đổi kết luận (balloon ~65% used).

### 5.3 Burst-watcher — quy nguồn tải tức thời (mới đợt này, giao từ F-147-T9-6)

> Watcher: 10 s/lần đọc /proc/loadavg; load1 ≥ 3,0 thì chup
> `top -b -n1` + delta `/proc/<pid>/stat` utime+stime (2 lần
> đọc cách 1 s, top 10) + nr_running + meminfo đầy đủ.
> Script `hidden_files/round148-t5/burst-watch.sh`, log
> `burst-watch.log`. Chạy từ 17:42:46Z.

| Thời gian (Z) | load1 | nr_running | Nguồn quy được (delta jiffies/s, top 3) |
|---|---|---|---|
| 17:42:46 baseline | 5,27 | 7/551 | WebKitWebProcess 68, MiniBrowser 64, hatch 32 — probe T4 đã chạy |
| 17:42:49 | 6,05 | 6/560 | MiniBrowser 54, WebKitWebProcess 53, npm tsc 40 |
| 17:43:12 | 9,53 | 18/592 | tsc node 80, WebKitWebProcess 64, hatch 44 |
| 17:43:36 | 10,86 | 14/532 | tsc node 84, chrome 50, hatch 22 |
| 17:43:59 | 11,74 | 18/666 | tsc node 80, hatch 59, chrome renderer 35 |
| 17:44:24 | 12,51 | 12/674 | npm vite build 64, chrome renderer 56, hatch 45 |
| 17:44:47 | 9,84 | 15/677 | vite build node 96, chrome renderer 48, hatch 37 |

- **Cụm burst mở đợt (17:42–17:44Z, load1 5,27 → 12,51):
  QUY ĐƯỢC ĐẦY ĐỦ** — tsc (T1) + WebKit/MiniBrowser (T4) +
  chrome renderer + vite build (T8) + hatch daemon: tải khởi
  động của các luồng đợt 148, KHÔNG phải burst bí ẩn.
  **Delta /proc/<pid>/stat BẮT ĐƯỢC tải tức thời mà ps %CPU
  tích lũy bỏ lỡ** (đúng như F-147-T9-6 đề xuất) — vite build
  node 96 jiffies/s ≈ ~1 core đầy.
- **Cụm spike C đợt 147 (load1 4,80, 15:59:57–16:03:57Z)
  VẪN CHƯA QUY ĐƯỢC** — không có snapshot tức thời nào lúc
  đó; phương pháp mới chỉ chứng minh được trên burst đợt
  này, không hồi tố được cụm C. Ghi rõ: T5-148 KHÔNG gán
  cụm C cho bất kỳ luồng nào.
- **Tổng kết watcher: 26 dòng SPIKE (1 baseline + 25 capture),
  load1 3,04–12,51, TẤT CẢ QUY ĐƯỢC NGUỒN.** Cụm A mở đợt
  (7 dòng, 17:42:46–17:44:47Z): tsc/WebKit/chrome/vite
  build/hatch — tải khởi động các luồng. Cụm B (3,
  17:45:10–17:45:55Z): T6 scan-mtime, find, ffmpeg vidstab
  191 jiffies/s, T2 blind67-investigate. Cụm C (1,
  17:47:18Z): mask_anim.py 67. Cụm D (12, 17:48:50–
  17:52:55Z): ffmpeg ffv1 (92, 171), mask_anim (65–104),
  WebKit (49–81), T2 hole-recheck (25–102), hatch. Cụm E
  (3, 18:00:37–18:01:32Z): attempt1 của T4 (WebKit 89–98,
  MiniBrowser 30–54) + đuôi loadavg (2 capture chỉ còn
  hatch ~23–30 jiffies/s — tải đã qua, load1 là trung bình
  trượt). Watcher tự nó chỉ 1 jiffy trong 2 capture — không
  nhiễm tải đo. **0 spike nào không quy được đợt này**
  (khác cụm C đợt 147).

### 5.4 Birefnet / u2net — kiểm tra tình trạng theo quy trình đứng

- **Birefnet: KHÔNG thử bởi T5** (brief loại trừ; việc của T9
  theo quyết §12.3(f) đợt 137 + quyết (l) đợt 146 (a)). Tự
  động hóa (a) của T9 đã nối từ đợt 147 (dry-run PASS) —
  T9-148 tự theo dõi; T5 chỉ ghi sampler của mình (0 mẫu ≥ guard — xem §5.1).
- **u2net (fallback chính thức) — KHÔNG kiểm lại đợt này:**
  T5-146 đã kiểm sự hiện diện đầy đủ (rembg 2.0.87,
  `~/.u2net` có u2net.onnx + birefnet-general.onnx, models/
  218M); T5-148 không đụng đĩa thêm vì không có dữ kiện mới
  (không cài/xóa gì liên quan). T5 không chạy thử u2net (không
  thuộc brief).
- Guard **6.144 MiB GIỮ NGUYÊN** (quyết §12.3(d) đợt 138 +
  quyết (n) đợt 144 + quyết (l) đợt 146).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, cap 30.000) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 8 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 141 mở (T5) / cuối (T5) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| Đợt 143 mở (T5) / cuối (T5) | 1498 / 1494 | boot 70a5b0fc |
| Đợt 144 mở (T5) / cuối (T5) | 1289 / 1193 | boot 691a7403 / cc222c8a |
| Đợt 145 mở (T5) / cuối (T5) | 1074 / 1070 | boot e146ca67 |
| Đợt 146 mở boot 1 (T5) / mở boot 2 / cuối boot 2 | 879/880 / 784 / 772 | boot 98a7c93f / 6fb582df |
| Đợt 147 mở (T5) / cuối (T5) | 669 / 661 | boot 6fb582df |
| **Đợt 148 mở (T5, 17:43Z)** | **548** | **boot d8a11644, headroom-open.txt** |
| **Đợt 148 cuối (T5, 18:22Z)** | **455** | **boot d8a11644, headroom-end.txt** |

- Giảm −113 so với cuối đợt 147 (661 → 548, khác boot) và
  −121 so với mở đợt 147 (669 → 548); **Vẫn DƯỚI ngưỡng báo
  user (< ~1.800)** — theo quyết parent (k) đợt 144 + (m)
  đợt 146 (chỉ theo dõi, không hành động mới, không nhắc lại
  riêng), đợt này **chỉ theo dõi, không báo riêng, không tự
  đổi gì**. Tỉ lệ/vite: ~0,35 (548/1578) → ~0,29 (455/1578) — lần thứ 6 liên tiếp dưới 1,0. Trong phiên giảm thêm −93 (548 → 455): T4 giữ vite + WebKit suốt attempt1 (từ 17:59Z) nên headroom-cuối thấp hơn mở là hợp lý — không phải nhiễu đo.
- **Cap probe 30.000 áp dụng lần 2** (quyết (m) đợt 146):
  script k8 copy từ đợt 147, `CAP = 30000`, verify bằng grep
  trước khi chạy. Headroom ~548 nên cap không ảnh hưởng kết
  quả (dừng ở 548 do ENOSPC, xa cap). Trần boot này:
  **63747 — KHÔNG đổi** (flip-flop 63747 → 63756 → 63747 đã
  dừng ở 63747 ba lần đo liên tiếp trên hai boot). Số watch
  đang giữ ngoài cell suy ra: 63.747 − 548 = **63.199 watch**
  (mở).
- Caveat (F-148-T5-5): headroom mở 548 đo giữa burst khởi
  động đợt 148 (load1 5–12, T4 chạy vite/WebKit, T1 chạy tsc,
  T8 chạy vite build — các watcher inotify của chúng đều
  tính vào trần chung). Đà giảm −113 so với cuối đợt 147 có
  thể một phần là tạm thời; headroom-cuối 455 cho thấy KHÔNG
  hồi lại trong phiên (T4 giữ vite/WebKit suốt attempt1).
  T9-148 đo độc lập để đối chiếu.

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 6,8G trống** (đo 17:39Z — bằng
  đợt 147); `/tmp` tmpfs 512M, 504M trống. Không có ENOSPC
  nào trong phiên ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại
  (symlink → `../vite/bin/vite.js`, mtime 09/11 không đổi) — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock). T4-148 sửa probe + đo lại lượt yên #21 trên boot
  này (việc của T4).

## 7. EPERM scan + dmesg — đối chiếu (T2-148 đã chạy probe #67)

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #67 (T2-148): ok=2 fail=0, boot=d8a11644, 17:42:42Z**
  (`eperm-probe-v2.log`: 190 → **193 dòng (+3 đúng prereg)**:
  1 dòng DEAD-detected + 1 dòng boot-changed (6fb582df →
  d8a11644, uptime since 17:27:53Z — KHỚP btime T5 đo) + 1 dòng
  probe #67). Probe #67 chạy 17:42:42Z — cùng phút T5 chạy
  poll0 17:44:04Z — cùng boot d8a11644 mà T5 đang kiểm.
- **Mù #67: T2-148 ĐÃ PHÁN — ĐÓNG HOÀN TOÀN (chuỗi đóng hoàn
  toàn lên 3)** (cờ T2 18:03Z): đoạn A đóng bằng
  uptime-closure (merged gap 1.255 s vượt sàn 108 s), đoạn B
  đóng theo luật gap (263 s). **Gap 18.882 s → CERT 67 /
  FULL 82 (chuẩn /proc/1)** — xem F-148-T5-2 về mâu thuẫn
  chuẩn btime 15 s. Khung chết #110? (17:24:10Z, 17:28:08Z]
  238 s (theo T2-148). Chuỗi INSIDE 6 ĐỨT về 0 (d8a11644
  OUTSIDE dải #111? — theo T2-148). T5 ghi theo T2-148,
  không tự phán mù.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142/T5-143/T5-144/T5-145/
  T5-146/T5-147).
- Lưu ý log probe: dòng `boot changed` ghi **6fb582df →
  d8a11644** — probe chết theo reboot (last #66 14:41:45Z,
  DEAD-detected 17:42:41Z age 10.856 s); đây là giới hạn của
  probe log, không phải dữ kiện về boot.

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (lần kiểm
  cuối 18:22Z: 193 dòng, 0 sóng).
- `eperm-now.txt` ở repo root **ĐỌC LẠI đợt này: vẫn chỉ chứa
  `x` + newline** (không đổi từ đợt 137–147 — ĐÓNG F-147-T5-5:
  T5-148 đọc trực tiếp, không ghi theo tiền lệ).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).
- **WFS scan: T5 KHÔNG chạy đợt này** (không thuộc brief
  T5-148). Chờ T2-148 (WFS #53 chênh 0 đợt 147 — lần 53 liên
  tiếp).

### 7.3 dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–147). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 8. Nợ mở sang đợt sau

1. **Lượt yên #21: ĐANG ĐO LẠI Ở ĐỢT 148 (việc T4-148).**
   Quyết parent đợt 147: sửa probe trước (timeout cho await
   writePartial + timeout wall-clock toàn attempt — ưu tiên
   cao nhất), #21 đo lại tiếp, KHÔNG chuyển sang #22. Cờ
   POSTBOOT_PASS của T5 đã ghi 17:44:24Z poll=2 cho boot
   d8a11644. Cổng tickCost ≤60 ms đã vào poller đợt 147 nhưng
   chưa kích hoạt live lần nào — đợt này có attempt 20/20 thì
   cổng sẽ được thử lửa thật lần đầu.
2. **Cửa sổ guard: KHÔNG MỞ đợt này (max 57,2% guard).** Tự
   động hóa birefnet của T9 (quyết (l) (a)) đã nối từ đợt
   147, dry-run PASS — 0 lần kích hoạt đợt này (theo log T9
   tới 18:22:37Z, không file lock/trigger); birefnet vẫn 0
   lần thử trong chuỗi. Guard 6.144 MiB GIỮ NGUYÊN; u2net là
   fallback chính thức.
3. **Balloon: khoảng ~6,5 GB "không nằm trong RSS" ĐÃ QUY
   ĐƯỢC = BALLOON (§5.2) — đóng nợ điều tra RAM đợt 147.**
   Balloon: 0/40 mẫu ghim trần (max 5,49M = 85,2% trần); xả 2
   lần sâu (tới 2,46M lúc 18:04:50Z) rồi phình lại; chuỗi
   đóng băng của T9 đã đứt trong cửa sổ đo đợt 147 — T9-148
   theo dõi tiếp bằng series dài.
4. **Headroom VẪN DƯỚI NGƯỠNG BÁO (mở 548 → cuối 455):**
   chỉ theo dõi, không báo riêng (quyết parent (k) đợt 144 +
   (m) đợt 146). Đà giảm so với cuối đợt 147 là −113 (khác
   boot) — một phần có thể là tạm thời do burst khởi động
   (F-148-T5-5); T9 đối chiếu độc lập. Cap probe 30.000 đã
   áp dụng từ đợt 147.
5. **Tuổi thọ boot 6fb582df: HAI CHUẨN (xem F-148-T5-2).**
   T5 (/proc/stat): 18.867 s (2 cách tính độc lập). T2-148
   (/proc/1): **18.882 s → CERT 67 / FULL 82**. Chờ
   parent/T10 chốt chuẩn; T5 giữ số /proc/stat trong LIMITS
   này.
6. **Lists CHỈ 1 MIRROR (37 file, F-148-T5-3)** — theo dõi
   đợt sau xem có về lại 71 = 2 mirror không; không ảnh hưởng
   chức năng đã đo đợt này. **Mù #67: T2-148 ĐÃ ĐÓNG HOÀN
   TOÀN** (chuỗi đóng hoàn toàn lên 3 — xem §7.1).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 147 §11: G1
   chờ user quyết; ci-security.yml vẫn 403 chờ user; file
   oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`
   vẫn chưa quyết số phận; TTS 39 cấm kiểm lại; release gate
   không đổi + KHÔNG push khi user chưa nhắn "push đi"; R9 (a)
   vẫn chờ user (số đếm VẪN LÀ 16); mâu thuẫn full boot_id
   b47f7932 vẫn để mở.

## 9. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7
  lúc đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: **SỬA đợt này** (`6e20b0ed…` →
  `c8c7c686…` — xem §3.7; `bash -n` OK).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử bởi T5 (không
  thuộc brief; RAM series này: 0 mẫu ≥ guard, max 57,2% — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-148 probe
  #67 ok=2 fail=0). WFS scan: T5 KHÔNG chạy đợt này (không
  thuộc brief; chờ T2-148).
- Postboot boot d8a11644: PASS poll0 (17:44:04Z) + poll1
  (17:44:24Z) + poll2 (18:22:38Z, exit 0). **KHÔNG chạy
  --repair lần nào.**
  **Watcher 60-phút: KHÔNG lập** (replay đã xong trước khi T5 mở).
  Luật (C): KHÔNG kích hoạt (không có replay kẹt + postboot
  FAIL kéo dài).
- B4 thực hành: **(a) file đóng băng MỚI dpkg-frozen-d8a11644.txt
  + (b) exact-comm = 0** (xem §3.6) — không có cửa sổ giao đối
  chiếu đợt này.
- Headroom: mở **548** → cuối **455** — VẪN DƯỚI ngưỡng báo
  ~1.800, lần thứ 8 liên tiếp, chỉ theo dõi. Cap probe 30.000
  áp dụng lần 2.
- RAM phiên T5 (1 series, xem §5): n=40 đầy đủ: avail
  883.092–3.598.524 kB (mean 2.329.991), balloon 2.461.672–
  5.491.000 kB (mean 4.131.539), gate A 38/40, max **57,2%
  guard**, **0 mẫu ghim trần**, **0 mẫu ≥ guard**.
- **0 reboot trong phiên T5** — boot d8a11644 sống từ 17:27:53Z
  tới lúc đóng (18:22:47Z, 54'54" = 3.294 s).
- **started_at lượt 148:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10).

## 10. Sai số F-148-T5-n (mọi sai số của luồng T5 đợt này)

- **F-148-T5-1 — Burst-watch lần chạy đầu KHÔNG khởi động.**
  Lệnh nohup đầu (chung exec với sampler) không tạo
  `burst-watch.nohup.log` và không có process — lần chạy đầu
  chết lặng (nguyên nhân chưa xác định; wrapper shell pid
  8710 vẫn sống giữ session exec). T5 chạy lại bằng `setsid
  nohup` riêng: process pid 9329 chạy từ 17:42:46Z, log
  baseline + 7 spike đã ghi tới 17:44:47Z. Mất phủ sóng
  ~1 phút đầu (17:41:49–17:42:46Z) — sampler RAM vẫn chạy
  liên tục trong khoảng đó (không mất mẫu RAM). Ghi rõ để
  T10 không đọc 17:42:46Z là thời điểm T5 mở.
- **F-148-T5-2 — Brief lệch 15 s về btime/tuổi thọ boot cũ —
  ĐÃ HÒA GIẢI BỞI T2-148 (xem nhật ký ngày 19/11).** Brief nói
  btime mới "~17:28:08Z" và tuổi thọ boot cũ danh nghĩa
  "18.882 s"; đo thật của T5: btime 17:27:53Z (uptime -s +
  /proc/stat btime 1795109273 KHỚP nhau + T2 probe #67 ghi
  uptime since 17:27:53Z) → tuổi thọ 18.867 s (2 cách tính
  độc lập đều ra 18.867). T2-148 xác định: **17:28:08Z là
  /proc/1 (độ trễ init 15,21 s sau btime kernel 17:27:53Z)
  — KHÔNG phải nghịch lý đồng hồ, KHÔNG phải thời điểm
  T10 đọc/ghi.** Hai chuẩn cùng tồn tại: T5/T6-148 dùng
  /proc/stat (gap 18.867 s), T1/T2-148 dùng /proc/1 (gap
  18.882 s → **CERT 67 / FULL 82**). **Chờ parent/T10 chốt
  chuẩn** — T5 giữ số /proc/stat trong LIMITS này và ghi rõ
  cả hai số để không ai đọc nhầm.
- **F-148-T5-3 — Lists CHỈ 1 MIRROR (37 file, giảm từ 71).**
  2 URI cấu hình (azure + cogentco) nhưng 0 file cogentco
  trong /var/lib/apt/lists/; term.log 0 dòng Get: (cài từ
  cache, không apt update đợt này); mtime các file lists cũ
  /stale. Cơ chế mất file cogentco chưa xác định (có thể
  apt autoclean hoặc lists không sống qua reboot lần này —
  khác cache .deb vẫn sống). Không ảnh hưởng chức năng đã đo
  (replay đầy đủ, postboot PASS). Theo dõi đợt sau.
- **F-148-T5-4 — Timestamp sampler drift :49 → :50 → :51.**
  Mẫu 1–7 ghi giờ :49, mẫu 8–28 ghi :50, mẫu 29–40 ghi :51
  (18:09:51Z trở đi) — sleep 60 + thời gian chạy lệnh tích
  lũy ~1 s sau ~8 và ~28 phút. Cadence vẫn ~60 s/mẫu; không
  ảnh hưởng số liệu. Cùng họ F-147-T5-3.
- **F-148-T5-5 — Headroom mở 548 đo giữa burst khởi động
  (caveat, không phải lỗi đo).** Lúc probe (17:43Z) load1
  5–12, T4 chạy vite/WebKit, T1 chạy tsc, T8 chạy vite build
  — watcher inotify của các luồng này đều tính vào trần
  chung 63.747 nên headroom 548 có thể thấp tạm thời so với
  mức nền của boot. Headroom-cuối 455 — KHÔNG hồi lại mà còn
  thấp hơn (−93); một phần đà giảm là dài hạn thật (T4 giữ
  vite/WebKit suốt attempt1), không chỉ nhiễu lúc đo. T9-148
  đo độc lập để đối chiếu.
- **F-148-T5-6 — Lỗi copy dải Start-Date trong bản nháp §1
  (ĐÃ SỬA TRƯỚC KHI ĐÓNG).** Bản nháp §1 mục 1 ghi dải
  history.log "12:14:46–12:16:22Z" — đó là dải của boot cũ
  6fb582df (copy từ LIMITS đợt 147); dải đúng của boot mới là
  **17:29:06–17:31:40Z**. T5 phát hiện khi rà soát bản nháp
  và đã sửa §1; §3.1/§3.6(c) ghi đúng ngay từ đầu. Ghi lại
  làm bài học: số liệu boot mới không copy từ LIMITS đợt
  trước mà không đối chiếu.

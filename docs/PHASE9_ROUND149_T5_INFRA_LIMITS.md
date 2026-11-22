# PHASE9_ROUND149_T5_INFRA_LIMITS — BOOT 70025d3e REPLAY KHỞI ĐỘNG MUỘN +35m05s → XONG BOOT +44m33s, 1545/221/462, postboot PASS poll0+poll1, CỜ 20:49:23Z → REBOOT #39 (21:23:51Z) GIẾT BOOT 70025d3e TRONG LÚC T5 ĐÓNG SỔ (TUỔI THỌ 4.998 s); BOOT MỚI 802f358f REPLAY CHƯA TỚI (CACHE 0 .deb — LẦN ĐẦU CACHE KHÔNG SỐNG QUA REBOOT) → ĐIỀU TRA (m): RUN 148 SUCCEEDED, RUN 149 JITTER 0 s GỐC NHƯNG BỊ VIẾT LẠI TẠI #39 (OFFSET 40 s — BẰNG CHỨNG THỨ 16); #38 KHÔNG VIẾT LẠI VẪN LÀ NGOẠI LỆ DUY NHẤT → BỔ SUNG 22:31–22:35Z: REPLAY BOOT 802f358f KHÔNG TỚI TRONG 60' (WATCHER TIMEOUT 22:28:01Z, 120 POLL) → --REPAIR 1 LẦN (GST SYMLINK → DEBROOT + CÀI ĐỦ 11 GÓI, RE-CHECK TOÀN PASS, 795/113/230, GÓI CUỐI LIBC-BIN), CỜ MỚI 22:35:39Z POLL=1

> Luồng T5, đợt 149, lượt cron 03:35 +07 20/11/2026 (mở 20:35:51Z;
> T5 mở thực tế 20:39:45Z, sampler chạy 20:43:16Z, burst-watch chạy
> 20:43:37Z, replay-watch chạy 20:44:47Z, đóng 21:29Z (boot mới
> 802f358f; replay-watcher boot 2 chạy từ 21:27:57Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **BOOT MỚI 70025d3e** (btime **20:00:33Z** — uptime -s +
> /proc/stat btime 1795118433 KHỚP nhau; /proc/1 20:00:43Z, offset
> 10,85 s). Reboot #38 xảy ra 20:00:33Z **trong lúc T10-148 đóng
> sổ** (T10 đóng 20:16:46Z; suite T10 chạy 20:02:19–20:06:13Z SAU
> reboot; cờ T10 ghi boot ae8f70bb + "uptime 29 phút lúc 20:10:28Z"
> — MÂU THUẪN với btime 20:00:33Z, nghi bước nhảy clock, giao T1).
> Boot cũ ae8f70bb chết ở 20:00:33Z; **tuổi thọ 1.171 s = 19m31s**
> (stat→stat, xem §2.1). **BOOT 70025d3e CHẾT Ở 21:23:51Z
> (reboot #39) — TRONG LÚC T5 ĐÓNG SỔ, sau khi sampler xong
> (21:23:18Z) 33 s, trước khi T5 chạy poll2; tuổi thọ 4.998 s =
> 1h23m18s.** Boot mới **802f358f** (btime 21:23:51Z, /proc/1
> 21:24:01Z, offset 10 s).
> Replay boot mới **KHỞI ĐỘNG MUỘN: startup configure 20:35:38Z
> (boot +35m05s — muộn thứ 2 sau #54 +47'14")**, chỉ 13 s trước
> khi lượt cron 149 mở (20:35:51Z); apt-get update ~7m33s (rootfs
> rebuild — /var/log/apt KHÔNG tồn tại lúc mở, lists chỉ 3 file =
> 0 index Ubuntu); cài thật 20:43:12–20:45:06Z, gói cuối
> gstreamer1.0-tools **1.24.2-1ubuntu0.2**, md5 `6f70829c…`,
> 1545 dòng / 221 installs / 462 configure — TRÙNG bracket đầy
> đủ; xong boot **+44m33s — CHẬM NHẤT trong chuỗi replay đầy đủ**
> (do khởi động muộn + update fetch lại index, không phải do cài
> chậm: pha cài chỉ 1m54s). **KHÔNG cần --repair (0 lần).**
> Postboot PASS poll0 (watcher 20:45:47Z) + poll1 (20:49:23Z);
> cờ `POSTBOOT_PASS` ghi 20:49:23Z poll=2 cho boot 70025d3e —
> **cờ này nay là hồ sơ cho boot ĐÃ CHẾT** (poll2 định chạy trên
> 70025d3e đã FAIL trên boot mới 802f358f — đúng vì replay boot
> mới chưa tới; xem §3.2). Lists **71 = 2 mirror sau update — HỒI
> LẠI từ 37 = 1 mirror đợt 148 (F-148-T5-3 ĐÓNG)**; cache apt 178
> .deb / 156M sống qua reboot #38 (y hệt).
> **BOOT MỚI 802f358f — REPLAY CHƯA TỚI (xem §3.8):** dpkg.log
> chỉ 2 dòng "startup packages configure" 21:24:31Z (boot +40s),
> 0 apt/dpkg đang chạy lúc T5 đóng; /var/log/apt KHÔNG tồn tại;
> lists 5 file (chỉ cli.github.com); GST hệ thống 0 file;
> **cache apt 0 .deb — LẦN ĐẦU cache KHÔNG sống qua reboot**
> (5 lần trước đều 178 .deb / 156M). Replay-watcher boot 2 đã
> chạy từ 21:27:57Z (tối đa 60 phút, tới ~22:28Z) — nếu replay
> tới + postboot PASS trước hạn cờ 23:00Z, T5 ghi cờ mới cho
> boot 802f358f; nếu không, nợ chuyển đợt 150.
> **DỮ KIỆN ĐIỀU TRA (m) CHO T7-149 (§8 — PHẦN CHÍNH CỦA BRIEF
> ĐỢT NÀY): run 148 SUCCEEDED, finished 20:19:32Z (9.759 s từ
> started gốc, còn dư 1.041 s trong ngân sách 10.800 s — KHÔNG
> timeout); run 149 jitter 0 s (started đúng 20:35:51Z); reboot
> #38 KHÔNG viết lại started_at run 148 (vẫn 19:41:37Z = btime
> ae8f70bb + 35 s) — LẦN ĐẦU quan sát được reboot trong lúc run
> đang chạy mà KHÔNG viết lại started_at; NHƯNG reboot #39 VIẾT
> LẠI started_at run 149 (20:35:51Z → 21:24:31Z, offset 40 s
> stat / 30 s proc/1 — ĐÚNG DẢI CHUỖI 31–50 s, bằng chứng trực
> tiếp thứ 16) — trùng giây với dpkg --configure -a đầu tiên
> trên boot mới (21:24:31Z). → MẪU (m) KHÔNG TÁI DIỄN ở 148→149
> (cả hai vế đều vắng); giả thuyết "viết lại tại MỌI reboot"
> CÓ 1 NGOẠI LỆ (#38) NHƯNG ĐƯỢC CỦNG CỐ LẠI BỞI #39 — T7-149
> phán (T5 chỉ cung cấp dữ kiện + mốc neo, không tự kết luận
> cơ chế).**
> **RAM: sampler n=40 ĐẦY ĐỦ trên boot 70025d3e (20:43:16–
> 21:22:18Z): avail 709.312–2.342.132 kB (mean 1.371.995),
> gate A 28/40, max 37,2% guard, 0 mẫu ≥ guard; balloon
> 3.883.292–6.115.440 kB (mean 4.958.324), 0 mẫu ghim trần
> (max 94,9% trần); burst-watcher 44 spike, 44/44 quy được
> nguồn, 0 spike bí ẩn.** Cửa sổ guard KHÔNG MỞ → birefnet
> 0 lần thử (T9 theo dõi).
> **HEADROOM MỞ 434 (boot 70025d3e) → 336 (boot MỚI 802f358f,
> đo 21:25:32Z lúc boot 1m41s tuổi)** (trần 63.747 không
> đổi; cap probe 30.000) — **DƯỚI NGƯỠNG LẦN 9 LIÊN TIẾP, CHỈ
> THEO DÕI** (caveat F-149-T5-5: mở đo giữa lúc replay đang
> cài + burst mở đợt; cuối đo trên boot mới vừa reboot, các
> luồng khác đang khởi động lại).
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa production**
> ngoài postboot script (dòng `say` + khối chú thích Dot 149 —
> dữ kiện boot đã đổi thật, xem §3.7). **KHÔNG tự chạy
> birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.
> **GHI CHÚ: LIMITS này OVERSIZE (68.277 B > 37.768 B)** —
> bảng sampler 40 mẫu + 2 boot + §8 điều tra (m) + §3.8 boot
> mới; T10 push bằng ENABLE_PRIVSEP=0 theo tiền lệ file
> oversize (đợt 148: 43.626 B; đợt 149 T5: 68.030 B — lớn
> nhất trong các LIMITS T5 từ trước tới nay).

## 1. Kết luận ngắn

1. **BOOT MỚI 70025d3e (btime 20:00:33Z): REPLAY KHỞI ĐỘNG MUỘN
   NHƯNG CHẠY TỐT KHI ĐÃ TỚI.** dpkg.log **1545 dòng / 221
   installs / 462 configure**, md5 `6f70829c…`, gói cuối
   gstreamer1.0-tools **1.24.2-1ubuntu0.2**; bracket
   (startup configure 20:35:38Z boot +35m05s → xong 20:45:06Z
   boot +44m33s). Pha cài thật chỉ 20:43:12–20:45:06Z (1m54s);
   phần lớn độ trễ là apt-get update ~7m33s (fetch lại index
   trên rootfs rebuild) + 35m05s chờ replay khởi động (cơ chế
   khởi động muộn CHƯA XÁC ĐỊNH — xem §3.1). Cache apt **178
   .deb / 156M** (sống qua reboot, y hệt đợt 146/147/148).
   Lists **71 (2 mirror — HỒI LẠI sau update)**; history.log 50
   Start-Date, tất cả trong 20:43:11–20:45:06Z (reset mỗi
   reboot, lần thứ 5). GST hệ thống là **thư mục thật 269/269**.
   Postboot **PASS poll0 (20:45:47Z) + poll1 (20:49:23Z)**.
2. **CỜ POSTBOOT_PASS ghi 20:49:23Z poll=2**
   (`boot_id=70025d3e-ff1b-4519-aa1e-5459a616930b btime=
   2026-11-19T20:00:33Z pass_at=2026-11-19T20:49:23Z poll=2
   repair=none/replay-full dpkg=1545/221`) — cờ này là cờ
   **đợt 149 cho boot 70025d3e** (cờ đợt 148 cho boot d8a11644
   vẫn còn trong round148-t5/, pass_at 17:44:24Z). T4-149 đo
   lượt yên #22 bằng cờ này trên boot 70025d3e (quyết parent
   đợt 148 (h)) — boot này đã chết ở reboot #39 (21:23:51Z);
   T4-149 cần cờ mới cho boot 802f358f khi replay boot mới
   xong (xem §3.8).
3. **TUỔI THỌ BOOT ae8f70bb = 1.171 s = 19m31s** (stat→stat:
   19:41:02Z → 20:00:33Z; /proc/1→/proc/1 cũng 1.171 s:
   19:41:12Z → 20:00:43Z — hai chuẩn trùng nhau vì offset
   /proc/1 hai boot gần bằng nhau: 10 s vs 10,85 s). Boot
   1d610e56 trước đó sống 390 s (T7-148). **BOOT 70025d3e SỐNG
   4.998 s = 1h23m18s** (20:00:33Z → 21:23:51Z) rồi chết ở
   **reboot #39 TRONG LÚC T5 ĐÓNG SỔ** (sau sampler xong 33 s,
   trước poll2 — xem §2). **1 REBOOT trong phiên T5-149**
   (reboot #39; reboot #38 xảy ra TRƯỚC khi đợt mở, trong lúc
   T10-148 đóng sổ).
4. **ĐIỀU TRA (m) — DỮ KIỆN MỚI CHO T7-149 (xem §8):**
   (a) run 148 **SUCCEEDED** (finished 20:19:32Z, muse.db
   đọc trực tiếp đợt này); (b) run 149 **jitter 0 s GỐC**;
   (c) reboot #38 **KHÔNG viết lại** started_at run 148;
   (d) reboot #39 **VIẾT LẠI** started_at run 149 (20:35:51Z
   → 21:24:31Z, offset 40 s stat — bằng chứng trực tiếp thứ
   16, trùng giây dpkg --configure -a đầu tiên trên boot
   mới). → Mẫu (m) KHÔNG tái diễn ở 148→149; giả thuyết
   viết lại CÓ 1 NGOẠI LỆ (#38) NHƯNG ĐƯỢC CỦNG CỐ LẠI BỞI
   #39. T5 KHÔNG tự kết luận cơ chế — T7-149 phán.
5. **SAMPLER RAM — 1 SERIES n=40 ĐẦY ĐỦ trên boot 70025d3e
   (20:43:16–21:22:18Z, xem §5):** avail 709.312–2.342.132 kB
   (mean 1.371.995), gate A **28/40**, max **37,2% guard**,
   **0 mẫu ≥ guard**; balloon 3.883.292–6.115.440 kB (mean
   4.958.324), **0 mẫu ghim trần** (max 94,9% trần); load1
   0,22–11,10. **Cửa sổ guard KHÔNG MỞ** → birefnet 0 lần thử.
   Burst-watcher 44 spike, 44/44 quy được nguồn, 0 spike bí ẩn.
6. **HEADROOM inotify MỞ 434 (boot 70025d3e) → 336 (boot MỚI
   802f358f, đo 21:25:32Z)** — xem §6.1. **DƯỚI ngưỡng báo user
   (< ~1.800), lần thứ 9 liên tiếp**; tỉ lệ/vite ~0,28 → ~0,21.
   Trần **63747 — KHÔNG đổi**. Cap probe **30.000**
   (quyết (m) đợt 146) — cap không ảnh hưởng.
7. **CÂY:** preview.tsx **530e10a7**, media.ts **2c384ed1**,
   vite.config.ts **ee80d093** (mở = lúc đóng);
   postboot script **c8c7c686… → c07e6fee…** (SỬA đợt này,
   xem §3.7; `bash -n` OK).
8. **EPERM (T2-149, T5 chỉ đối chiếu): probe log 196 dòng,
   probe #68 MỚI (T2-149, ok=2 fail=0, boot=70025d3e,
   20:51:02Z)** — log +3 dòng đúng prereg (DEAD + boot-changed
   d8a11644 → 70025d3e + #68). **Mù #68/#69? MỞ → giao T2-149;
   mù #70? MỞ (reboot #38) → giao T2-149; mù #71? MỞ (reboot
   #39) → giao T2-149** (quyết parent đợt 148 (f)/(g) +
   reboot mới). **WFS scan: T5 KHÔNG chạy đợt này**
   (không thuộc brief; chờ T2-149).
9. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
10. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.
11. **REBOOT #39 TRONG LÚC T5 ĐÓNG SỔ (21:23:51Z):** boot
    70025d3e chết sau 4.998 s; sampler n=40 đã xong trước reboot
    (21:23:18Z) nên dữ liệu RAM còn nguyên; poll2 FAIL trên boot
    mới 802f358f (replay chưa tới — đúng, không phải lỗi);
    replay-watcher boot 2 chạy từ 21:27:57Z → **TIMEOUT
    22:28:01Z (120 poll, replay KHÔNG TỚI trong 60')** →
    **--repair 1 lần 22:31:03–22:35:23Z** (xem §3.8) → postboot
    PASS poll1-boot2 độc lập 22:35:39Z → **cờ mới
    POSTBOOT_PASS cho boot 802f358f 22:35:39Z poll=1** (cờ cũ
    70025d3e lưu POSTBOOT_PASS-70025d3e).
12. **CACHE APT 0 .deb TRÊN BOOT MỚI — LẦN ĐẦU CACHE KHÔNG SỐNG
    QUA REBOOT** (5 lần trước đều 178 .deb / 156M): replay boot
    802f358f KHÔNG TỚI trong 60' nên T5 --repair (xem §3.8);
    sau repair cache **110 .deb** (download 11 gói cần thiết,
    KHÔNG phải 178 .deb đầy đủ) — theo dõi đợt sau xem cache
    có hồi lại 178 .deb không (nếu replay đầy đủ tới sau).

## 2. Timeline — 2 boot trong phiên (reboot #38 TRƯỚC khi đợt mở; reboot #39 TRONG LÚC T5 ĐÓNG SỔ)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 70025d3e (reboot #38) | 20:00:33 (uptime -s; /proc/stat btime 1795118433) | 4.998 s = 1h23m18s (chết 21:23:51Z) | Replay KHỞI ĐỘNG MUỘN (+35m05s) nhưng CHẠY TỐT, xong boot +44m33s (1545/221, gói cuối tools 0.2) — CHẬM NHẤT chuỗi replay đầy đủ (do khởi động muộn + update fetch index); postboot PASS poll0+poll1; cờ 20:49:23Z poll=2 (nay là hồ sơ boot đã chết); sampler n=40 ĐẦY ĐỦ (0 mẫu ≥ guard, 0 mẫu ghim trần); burst 44/44 quy được nguồn; 1 reboot trong phiên (chính boot này chết ở #39) |
| 2 | 802f358f (reboot #39) | 21:23:51 (uptime -s; /proc/stat btime 1795123431; /proc/1 21:24:01Z, offset 10 s) | còn sống (22:35Z, ~1h12' tuổi) | dpkg.log chỉ 2 dòng "startup packages configure" 21:24:31Z (boot +40s), 0 apt/dpkg chạy lúc đóng; /var/log/apt KHÔNG tồn tại; lists 5 (chỉ cli.github.com); GST 0 file; **cache apt 0 .deb — LẦN ĐẦU cache không sống qua reboot**; replay-watcher boot 2 chạy 21:27:57Z → **TIMEOUT 22:28:01Z (120 poll — replay KHÔNG TỚI trong 60', dpkg.log vẫn 2 dòng)**; postboot poll2 FAIL (đúng — replay chưa tới); **--repair 1 lần 22:31:03–22:35:23Z** (GST symlink → debroot 269 file + cài đủ 11 gói, RE-CHECK toàn PASS; dpkg đóng băng **795 dòng / 113 installs / 230 configure, gói cuối libc-bin** — Y HỆT mẫu repair-1-phần đợt 140 boot 2 / 142); cache sau repair **110 .deb**, lists **75**; **cờ mới POSTBOOT_PASS 22:35:39Z poll=1**; headroom 336 lúc boot 1m41s tuổi |

- **Btime KHỚP 2 nguồn độc lập** (uptime -s 20:00:33Z +
  /proc/stat btime 1795118433 = 20:00:33Z; brief đợt 149 ghi
  btime 20:00:33Z — KHỚP, không lệch như brief đợt 148).
  /proc/1 20:00:43Z (`ps -o lstart -p 1`; start_ticks 1085 →
  10,85 s sau btime) — offset 10,85 s (brief nói 20:00:44Z,
  chênh 1 s do làm tròn — xem F-149-T5-2).
- **Reboot #39 XẢY RA trong phiên T5 — trong lúc đóng sổ:**
  boot_id kiểm lúc mở (20:39:45Z) và lúc ghi cờ (20:49:34Z)
  đều là 70025d3e-ff1b-4519-aa1e-5459a616930b; lúc chạy poll2
  (21:25:32Z) boot đã là 802f358f-0f12-4824-8eb9-419f0ccd67ec
  (btime 21:23:51Z). Reboot 21:23:51Z xảy ra sau khi sampler
  xong (21:23:18Z) 33 s và sau khi lệnh sleep chờ sampler của
  T5 kết thúc (21:23:39Z) 12 s — T5 không mất dữ liệu sampler
  (đã ghi đủ 40 mẫu + SAMPLER_DONE trước reboot); burst-watch
  đã dừng tay trước đó (21:25:16Z — sau reboot, log còn nguyên
  trên overlay). Reboot #38 (20:00:33Z) xảy ra trong lúc
  T10-148 đóng sổ (T10 đóng 20:16:46Z, trong hạn đóng 20:20Z),
  tức là TRƯỚC lượt cron 03:35 +07 (20:35:51Z) 35'18".
- **Mâu thuẫn cờ T10-148 (giao T1, T5 chỉ ghi nhận):** cờ
  round148-t10.done 20:16:46Z ghi boot ae8f70bb + "uptime 29
  phút lúc 20:10:28Z" — với btime 20:00:33Z, uptime lúc
  20:10:28Z lẽ ra ~9m55s, không phải 29 phút. Suite T10 chạy
  20:02:19–20:06:13Z, SAU reboot #38. Nghi bước nhảy clock
  (tiền lệ #54/#58/#63). T5 KHÔNG tự phán — T1 kiểm lại
  claim đóng sổ 148.

### 2.1 Tuổi thọ boot ae8f70bb = 1.171 s — xác nhận bằng 2 cách tính độc lập

| Cách tính | Phép tính | Kết quả |
|---|---|---|
| (i) Trừ datetime (btime /proc/stat) | 2026-11-19T20:00:33Z − 2026-11-19T19:41:02Z | **1.171 s = 19m31s** |
| (ii) Trừ epoch btime | 1795118433 − 1795117262 | **1.171 s** |
| Đối chiếu | /proc/1 → /proc/1 | 20:00:43Z − 19:41:12Z = **1.171 s** (trùng — offset hai boot gần bằng nhau: 10 s vs 10,85 s) |
| Đối chiếu | T7-148 (1d610e56) | 390 s (19:34:32Z → 19:41:02Z) — boot ngắn nhất kể từ đợt 120 cho tới khi ae8f70bb sống 1.171 s |
| Đối chiếu | Tuổi thọ boot 70025d3e | **4.998 s = 1h23m18s** (20:00:33Z → 21:23:51Z; trừ epoch 1795123431 − 1795118433 = 4.998 — khớp) — chết ở reboot #39 trong lúc T5 đóng sổ |

- Hai cách tính độc lập nhau (datetime vs epoch) cùng ra
  1.171 s — không còn nghi ngờ số học. Boot ae8f70bb sống
  19m31s — dài gấp 3 lần boot 1d610e56 (390 s) nhưng vẫn là
  boot ngắn thứ 2 trong chuỗi gần đây. T5-149 KHÔNG tự
  chứng nhận gap (việc T2-149: mù #70?).

### 2.2 Mốc neo btime các boot gần đây (cho T7-149 / T2-149)

| Boot | btime /proc/stat (Z) | btime /proc/1 (Z) | Offset /proc/1 − stat | Nguồn |
|---|---|---|---|---|
| 6fb582df | 12:13:26 (epoch 1795090406) | [không trích trực tiếp đợt này — xem ghi chú] | — | T5-148 (stat); T2-148 chứng nhận gap 18.882 s theo /proc/1 (đã bị quyết parent (b) đợt 148 thay thế bằng 18.867 s theo /proc/stat) |
| d8a11644 | 17:27:53 (epoch 1795109273) | 17:28:08 | 15,21 s | T5-148 + T2-148 (F-148-T5-2) |
| 1d610e56 | 19:34:32 (epoch 1795116872) | 19:34:48 | 16 s | T9-148 + T7-148 |
| ae8f70bb | 19:41:02 (epoch 1795117262) | 19:41:12 | 10 s | T10-148 + T7-148 |
| **70025d3e** | **20:00:33 (epoch 1795118433)** | **20:00:43** | **10,85 s** | **T5-149 đo trực tiếp (uptime -s + /proc/stat + ps lstart -p 1)** |
| **802f358f** | **21:23:51 (epoch 1795123431)** | **21:24:01** | **10 s** | **T5-149 đo trực tiếp (uptime -s + /proc/stat + ps lstart -p 1)** |

- Chuẩn btime: **/proc/stat (kernel btime)** theo quyết
  parent đợt 148 (b) — T5-149 dùng chuẩn này xuyên suốt;
  số /proc/1 chỉ ghi để đối chiếu, không dùng cho gap.
- Tuổi thọ (stat→stat): 6fb582df 18.867 s → d8a11644 7.599 s
  → 1d610e56 390 s → ae8f70bb 1.171 s → 70025d3e 4.998 s →
  802f358f còn sống.

## 3. dpkg replay — KHỞI ĐỘNG MUỘN (+35m05s) NHƯNG CHẠY TỐT, KHÔNG cần repair; thực hành B4 (a)+(b)

### 3.1 Replay boot 70025d3e — watcher quan sát live (T5 mở lúc replay đang chạy)

| Hạng mục | Lúc mở (20:39–20:45Z) | Lúc T5 đóng (21:29Z, boot mới 802f358f) |
|---|---|---|
| dpkg.log dòng | 2 (lúc 20:40:06Z) → 493 (20:43:51Z) → 1545 (20:45:17Z) | **2 dòng — ĐÂY LÀ LOG BOOT MỚI** (1545 dòng của boot 70025d3e đã chết cùng boot; file đóng băng dpkg-frozen-70025d3e.txt còn) |
| `status installed` | 0 → 221 | 0 (boot mới) |
| dòng chứa `configure` | 2 → 462 | 2 (boot mới) |
| dpkg.log md5 | c7b99bb6… (2 dòng) → 6f70829c… (1545 dòng) | 83f13288… (boot mới, 2 dòng) |
| dpkg.log mtime | 20:35:38Z (2 dòng) → 20:45:06Z | 21:24:31Z (boot mới) |
| startup configure đầu | 20:35:38Z (boot +35m05s) | 21:24:31Z (boot mới +40s — xem §3.8) |
| apt-get update | chạy 20:35:38Z → ~20:43:11Z (~7m33s) | chưa chạy (boot mới) |
| cài thật | 20:43:12–20:45:06Z (install đầu libaspell15 20:43:12Z) | chưa có (boot mới) |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (20:45:06Z) | chưa có (boot mới) |
| cache apt | 178 .deb / 156M | **0 .deb (boot mới — LẦN ĐẦU cache không sống qua reboot)** |
| lists / partial | 3 / 0 lúc mở (0 index Ubuntu) → 71 / 0 sau update | 5 / 0 (boot mới, chỉ cli.github.com) |
| GST hệ thống / debroot | KHÔNG TỒN TẠI lúc mở → thư mục THẬT 269 file / 269 | 0 file (boot mới) |
| /var/log/apt | KHÔNG TỒN TẠI lúc mở → có (history.log 50 Start-Date, 20:43:11–20:45:06Z) | KHÔNG TỒN TẠI (boot mới) |
| proc apt/dpkg/wrapper | apt-get update pid 860 + wrapper pid 839 (lúc mở) → 0 (20:45:17Z) | 0 (boot mới — replay chưa chạy) |
| postboot check | FAIL (dự kiến — replay chưa xong; T5 KHÔNG chạy check lúc replay đang chạy) | PASS poll0 (20:45:47Z) + poll1 (20:49:23Z) trên boot 70025d3e; **poll2 FAIL trên boot mới (đúng — replay chưa tới, xem §3.2/§3.8)** |

- **Replay bắt đầu MUỘN — boot +35m05s.** Bằng chứng: lúc
  T5 mở (20:39:45Z, boot 39' tuổi) dpkg.log chỉ có 2 dòng
  ("startup packages configure" 20:35:38Z), /var/log/apt
  KHÔNG tồn tại, lists chỉ 3 file, GST hệ thống KHÔNG tồn
  tại, nhưng wrapper replay pid 839 + apt-get update pid 860
  ĐANG CHẠY (etime 05:37 lúc 20:41:15Z → khởi động
  ~20:35:38Z). Không có hoạt động dpkg/apt nào trước
  20:35:38Z trên boot này (dpkg.log chỉ có 2 dòng đó) —
  replay KHÔNG chạy lúc boot +40s như các boot trước.
- **Cơ chế khởi động muộn CHƯA XÁC ĐỊNH (F-149-T5-1).**
  Replay khởi động 20:35:38Z, chỉ 13 s trước khi lượt cron
  149 mở (20:35:51Z). Khả năng: daemon/runtime chỉ reconcile
  / chạy preflight khi có run mới — T5 ghi dữ kiện, không
  khẳng định cơ chế (cần T7/T10 đối chiếu log runtime; xem
  §8.3). Đây là lần khởi động muộn thứ 2 trong lịch sử
  (sau #54 +47'14"), và là lần đầu replay khởi động TRÙNG
  với lúc mở lượt cron.
- **Rootfs rebuild — bằng chứng đầy đủ:** /var/log/apt
  KHÔNG tồn tại lúc mở; lists chỉ 3 file (auxfiles, lock,
  partial — 0 file index); GST hệ thống KHÔNG tồn tại;
  ledger os-intent vẫn còn (`/var/lib/hatch/os-intent/
  ledger.jsonl` 1 dòng compacted, ~170 package `added`,
  `removed: []`; dpkg-state.txt còn). Replay phải chạy
  apt-get update để fetch lại index (lazy index refresh
  trong script — đúng thiết kế cho rootfs rebuild).
- **Pha update ~7m33s** (20:35:38Z → ~20:43:11Z, kẹp bằng
  Start-Date đầu 20:43:11Z; update pid 860 vẫn chạy lúc
  20:41:15Z, đã xong trước install đầu 20:43:12Z). Chậm hơn
  update thường nhưng trong dải đã biết (boot #47 mất ~12
  phút vì mirror chậm).
- **Pha cài chỉ 1m54s** (20:43:12–20:45:06Z; 221 installs) —
  nhanh, ngang các replay đầy đủ trước (+2m56s/+3m47s là
  toàn bộ từ configure đầu tới xong; ở đây pha cài 1m54s
  vì phần lớn package đã có trong cache 178 .deb).
- **Bracket đầy đủ: (boot +35m05s, boot +44m33s] — CHẬM
  NHẤT trong chuỗi replay đầy đủ** (d8a11644 +41s → +3m47s;
  6fb582df +37s → +2m56s kỷ lục). Độ chậm đến từ KHỞI ĐỘNG
  MUỘN + UPDATE FETCH INDEX, không phải pha cài.
- **Watcher replay (mới đợt này):** script
  `hidden_files/round149-t5/replay-watch.sh`, poll 30 s,
  log `replay-watch.log` (3 poll: 1406 dòng 20:44:47Z →
  1545 dòng 20:45:17Z → REPLAY_DONE + postboot poll0
  20:45:47Z exit 0). Watcher TỰ KẾT THÚC sau poll0 (không
  chạy --repair — không cần).
- **KHÔNG cần watcher 60-phút thêm** (replay đã xong trước
  khi T5 đóng), **KHÔNG kích hoạt luật (C)**, **KHÔNG chạy
  --repair lần nào (0 lần)**.

### 3.2 Cờ POSTBOOT_PASS (đợt 149 — cờ mới cho boot mới)

| Boot | Cờ ghi (Z) | poll | Nội dung |
|---|---|---|---|
| 70025d3e | 20:49:23 | 2 | `boot_id=70025d3e-ff1b-4519-aa1e-5459a616930b btime=2026-11-19T20:00:33Z pass_at=2026-11-19T20:49:23Z poll=2 repair=none/replay-full dpkg=1545/221` (nay lưu `POSTBOOT_PASS-70025d3e` — hồ sơ boot đã chết) |
| 802f358f | 22:35:39 | 1 | `boot 802f358f (btime /proc/stat 21:23:51Z; reboot #39) — REPLAY CHET DANG (B), --repair 1 lan 22:31:03-22:35:23Z (GST symlink -> debroot 269 file + cai du 11 goi; RE-CHECK toan PASS); postboot PASS poll1-boot2 (check-only doc lap) exit 0; dpkg dong bang 795 dong / 113 installs / 230 configure, goi cuoi libc-bin; cache 110 .deb, lists 75; POSTBOOT_PASS moi ghi 2026-11-19T22:35:39Z poll=1` |

- Cờ 70025d3e ghi sau 2 poll PASS (poll0 20:45:47Z do
  replay-watcher chạy + poll1 20:49:23Z do T5 chạy tay), theo
  đúng mẫu các đợt. **Poll2 KHÔNG chạy được trên boot
  70025d3e** — boot chết ở reboot #39 (21:23:51Z) trước khi T5
  chạy poll2; poll2 chạy 21:25:32Z trên boot mới 802f358f cho
  **FAIL exit 1** (thiếu isomp4/libav + 11 package apt — đúng
  vì replay boot mới chưa tới; xem §3.8). **Poll2 FAIL này
  KHÔNG phủ nhận cờ** — cờ 20:49:23Z là hồ sơ cho boot
  70025d3e (2 poll PASS), không phải cho boot 802f358f.
- **Cờ boot mới ĐÃ GHI (bổ sung 22:35:39Z):** replay boot
  802f358f KHÔNG tới trong 60' (watcher TIMEOUT 22:28:01Z) →
  --repair 1 lần 22:31:03–22:35:23Z (RE-CHECK toàn PASS trong
  chính lần repair) → **poll1-boot2 kiểm độc lập check-only
  exit 0 lúc 22:35:39Z** → ghi cờ mới cho 802f358f, poll=1
  (theo mẫu đợt 142: cờ repair ghi sau 1 poll độc lập PASS;
  cờ cũ 70025d3e được lưu sang `POSTBOOT_PASS-70025d3e`
  trước khi ghi đè). T4-149 đo lượt yên #22 bằng cờ này —
  lưu ý đây là **cờ repair-1-phần** (dpkg 795/113/230, GST
  symlink → debroot), KHÔNG phải cờ replay-đầy-đủ
  (1545/221/462, GST thư mục thật) như cờ 70025d3e.
- **Caveat (cùng họ F-147-T5-1):** pass_at 20:49:23Z là thời
  điểm *bắt đầu* poll1 (lệnh poll1 khởi động 20:49:23Z, kết
  thúc 20:49:23Z — cùng giây) — mẫu các đợt trước cũng ghi
  pass_at ≈ thời điểm poll1; T5 ghi rõ để T4/T10 không đọc
  sai.
- T4-149 đo lượt yên #22 bằng cờ này (quyết parent đợt 148
  (h): #22 mở đợt 149) — T5 không kiểm poller T4 đợt này;
  T10 đối chiếu khi gộp.

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
| d8a11644 | 148 | +41s → +3m47s | tools **1ubuntu0.2** |
| **70025d3e** | **149** | **+35m05s → +44m33s** | tools **1ubuntu0.2** |

- Boot 70025d3e **CHẬM NHẤT chuỗi** (+44m33s — gấp ~12 lần
  +3m47s của d8a11644) nhưng pha cài chỉ 1m54s; độ chậm do
  khởi động muộn (+35m05s) + update fetch index (~7m33s).
  Kỷ lục +2m56s của 6fb582df vẫn đứng (kỷ lục này đo từ lúc
  replay khởi động, không tính thời gian chờ khởi động).
- Gstreamer tools **1.24.2-1ubuntu0.2** lần thứ 8 liên tiếp
  theo boot (691a7403 → 70025d3e); thread "3 phiên bản" vẫn
  đóng (T5-149 không kiểm lại madison — không có dữ kiện mới;
  dpkg.log có đủ 6 gói gstreamer tools/base/good/bad/ugly/
  libav + fontconfig 2.15.0-1.1ubuntu2, xem §3.5).

### 3.4 Cache + lists

- **Cache 178 .deb / 156M (y hệt đợt 146/147/148).** Sống qua
  reboot #38 — lần thứ 5 liên tiếp (đợt 145/146/147/148/149);
  F-141-T5-4 nay đảo chiều hoàn toàn: sống là mẫu thường
  xuyên, kể cả trên rootfs rebuild (cache nằm trên RV-backed
  /var/cache/apt/archives — đúng như chú thích trong script
  replay).
- **Lists 71 / partial 0 (2 mirror — HỒI LẠI).** Lúc mở chỉ
  3 file (auxfiles/lock/partial, 0 index — rootfs rebuild);
  sau apt-get update của replay: **71 file (34 azure)** —
  bằng đúng đợt 146/147 (71 = 2 mirror). **F-148-T5-3
  (lists chỉ 1 mirror, 37 file) ĐÓNG:** cơ chế mất file
  cogentco đợt 148 là do lists không sống qua reboot #35
  (rootfs rebuild đợt đó cũng mất index — chỉ khác là replay
  đợt 148 cài từ cache nên không chạy update, lists ở lại 37;
  đợt này replay chạy update nên lists về lại 71). Không ảnh
  hưởng chức năng đã đo (replay đầy đủ, postboot PASS).

### 3.5 Gstreamer + fontconfig — đối chiếu nhanh trên dpkg.log mới

- dpkg.log boot 70025d3e: tools/base/good/bad/ugly/libav
  **đều `status installed`** (6/6 gói); fontconfig
  **2.15.0-1.1ubuntu2** installed 20:44:51Z (dòng cuối trước
  khi dpkg.log đạt 1545 — cùng mẫu đợt 146/148: fontconfig
  cài gần cuối, trước tools); triggers-pending 44 dòng,
  trigproc 43 (TRIGGER chạy đủ — xem brief: TRIGGER).
- **md5 dpkg.log `6f70829c…` KHÁC file đóng băng đợt 148
  (`5ed60912…`) — CHỈ DO TIMESTAMP THEO BOOT MỚI + SỐ DÒNG
  STARTUP KHÁC (106 startup vs đợt 148 — xem §3.1).** Đối
  chiếu thay thế: số đếm 1545/221/462 + gói đầu libaspell15
  + gói cuối tools 0.2 + 6 gói gstreamer + fontconfig
  1.1ubuntu2 **trùng tuyệt đối** với mẫu replay đầy đủ
  chuẩn. Manifest mới: `dpkg-frozen-70025d3e.txt`
  (frozen 20:49:34Z, xem §3.6(a)).
- Phân tích dòng dpkg.log (1545): status 1040, configure
  178, install 169, startup 106 (52 archives + 54
  packages), trigproc 43, upgrade 9.

### 3.6 Thực hành đối chiếu B4 theo (a)+(b) — quyết parent (h) đợt 145

> Đợt 149 KHÔNG có cửa sổ B4 nào được giao cho T5 đối chiếu
> (T4-149 đang đo lượt yên #22; cửa sổ attempt của T4-149
> thuộc T4/T10 đối chiếu lúc đóng). Thực hành đợt này:

| Bằng chứng | Nội dung | Sức nặng |
|---|---|---|
| (a) dpkg.log boot 70025d3e — file đóng băng MỚI | `dpkg-frozen-70025d3e.txt` (frozen 20:49:34Z): 1545 dòng / 221 installs / 462 configure, md5 `6f70829c…`, mtime 20:45:06Z, gói cuối tools 0.2, history 50 Start-Date — **manifest mới cho boot mới**, thay thế manifest đợt 148 (boot cũ đã chết) cho mọi đối chiếu kiểu B4 trên boot này | **SẴN SÀNG** |
| (b) ps exact-comm lúc mở (20:49Z) | `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0, exact-comm apt-get/dpkg/unattended-upgrade = 0 trong `ps -eo comm` | **DEMO ĐÚNG PHƯƠNG PHÁP** — cùng phương pháp T4-144 §6.1; không dùng grep chuỗi con (bài học F-146-T5-1) |
| (c) history.log live | 50 Start-Date, TẤT CẢ trong 20:43:11–20:45:06Z (replay boot 70025d3e); **0 entry boot cũ** | **TÁI XÁC NHẬN F-145-T5-1** lần thứ 5 (reset mỗi reboot) |

### 3.7 Postboot script — SỬA đợt này (boot đã đổi — dữ kiện thật mới)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
**`c8c7c686…` → `c07e6fee…`** (mở → sau sửa; `bash -n` OK).

- Đổi dòng `say` (dòng 655) + thêm khối chú thích `# Dot 149 —
  BOOT MOI SAU DOT 148` ghi đầy đủ dữ kiện boot mới (btime
  20:00:33Z, reboot #38 trong lúc T10-148 đóng sổ, tuổi thọ
  boot cũ 1.171 s, replay khởi động muộn +35m05s, update
  ~7m33s rootfs rebuild, lists hồi lại 71 = 2 mirror, headroom
  mở 434, run 148 SUCCEEDED + run 149 jitter 0 s). Khác quyết
  định của T5-147 (không sửa vì cùng boot, dữ kiện vẫn đúng):
  đợt này boot ĐÃ ĐỔI nên dữ kiện trong dòng `say` cũ (DOT 148
  / boot d8a11644 / reboot #35? / +3m47s) là SAI cho boot hiện
  tại — sửa là bắt buộc để log poll0/poll1 đọc đúng.
- Hệ quả stage: đợt này T5 stage **2 file** (LIMITS này +
  postboot script) — như đợt 148.

### 3.8 Boot mới 802f358f (reboot #39) — REPLAY KHÔNG TỚI TRONG 60' → --REPAIR 1 LẦN, CỜ MỚI 22:35:39Z

| Hạng mục | Trạng thái lúc T5 đóng (21:29Z, boot ~5' tuổi) → BỔ SUNG 22:28–22:35Z |
|---|---|
| boot_id / btime | 802f358f-0f12-4824-8eb9-419f0ccd67ec / 21:23:51Z (stat 1795123431; /proc/1 21:24:01Z, offset 10 s) |
| dpkg.log | 2 dòng, md5 `83f13288…`, mtime 21:24:31Z — "startup packages configure" ×2 (boot +40s) |
| apt/dpkg/wrapper | 0 process (kiểm 21:26–21:29Z) — replay CHƯA chạy thật |
| /var/log/apt | KHÔNG tồn tại |
| lists | 5 file (auxfiles, lock, partial + 2 cli.github.com) — 0 index Ubuntu |
| GST hệ thống | KHÔNG tồn tại (0 file) |
| cache apt | **0 .deb — LẦN ĐẦU cache không sống qua reboot** (đo 21:27Z; dir tồn tại, trống — chỉ còn lock + partial) |
| ledger os-intent | CÒN (ledger.jsonl 1 dòng compacted + dpkg-state.txt 783 dòng) |
| postboot poll2 | FAIL exit 1 (21:25:32Z — thiếu isomp4/libav + 11 package; ĐÚNG vì replay chưa tới) |
| replay-watcher boot 2 | Chạy 21:27:57Z → **TIMEOUT 22:28:01Z (120 poll, poll cuối 22:27:31Z)** — replay **KHÔNG TỚI trong 60'**: dpkg.log vẫn 2 dòng (mtime 21:24:31Z), 0 apt/dpkg mọi poll, GST 0, cache 0 .deb. Check-only timeout (poll0-boot2-timeout) **FAIL exit 1** 22:28:01Z (thiếu 5 lib + GST + 11 gói — y hệt poll2). Watcher KHÔNG tự chạy --repair (theo thiết kế). |
| TRIGGER §8.2(B) form B — verify độc lập 5/5 (22:31:01Z) | (1) postboot FAIL tươi (22:28:01Z, exit 1); (2) 0 proc apt/dpkg/unattended-upgrade (pgrep + `ps -eo comm` đều 0); (3) dpkg im **3.990 s ≥ 600 s** (dòng cuối 21:24:31Z); (4) form B: 2 dòng / 0 installs / GST absent / lists 5 / cache 0 .deb; (5) MiniBrowser 0 + WebKitWebProcess 0; debroot 269 file sẵn làm đích symlink. **TRIGGER=YES** — y hệt tiền lệ đợt 140 boot 2 (90392aa5) và đợt 142 (bde599df): cùng dạng "chậm mà không cài", cùng 2 dòng/0 installs/lists 5/cache 0. Luật (C) KHÔNG đủ (lists 5 > 3, không có apt sống — giống hệt đợt 142) NHƯNG (C) chỉ dành cho replay KẸT giữa chừng khi postboot FAIL; trường hợp này kích hoạt bằng §8.2(B) form B, không phải (C). |
| --repair 1 lần | **22:31:03–22:35:23Z, exit 0 (~4'20")** — `vcut-webkit-postboot-check.sh --repair` (log `t5-postboot-repair-boot2.log`): REPAIRED GST symlink → debroot (269 file); apt-get update OK (nhanh — mirror khỏe lần này, khác đợt 140 boot 2 mất ~9'); REPAIRED apt cài đủ 11 gói; RE-CHECK trong lần repair: wrapper PASS, libs PASS (đủ 5), GST PASS (isomp4 + libav), apt PASS → KẾT LUẬN "ĐỦ ĐIỀU KIỆN chạy WebKit". **KHÔNG bị reboot giết** (khác đợt 123/125 — repair hoàn thành trọn vẹn). |
| dpkg đóng băng boot 2 | **795 dòng / 113 installs / 230 configure, gói cuối libc-bin** (mtime 22:35:23Z, md5 `e70ca069…` — `dpkg-frozen-802f358f.txt`) — Y HỆT mẫu repair-1-phần đợt 140 boot 2 và đợt 142 (795/113/230, libc-bin), KHÔNG phải replay đầy đủ (1545/221/462, tools 0.2). GST là **SYMLINK → debroot** (không phải thư mục thật như boot 70025d3e). Cache **110 .deb**, lists **75** (cũng y hệt đợt 142: 110 .deb / lists 75). |
| poll1-boot2 + cờ mới | **poll1-boot2 kiểm độc lập check-only exit 0 lúc 22:35:39Z** (log `t5-postboot-poll1-boot2.log`: PASS GST + PASS apt + "ĐỦ ĐIỀU KIỆN chạy WebKit") → **cờ mới `POSTBOOT_PASS` cho boot 802f358f ghi 22:35:39Z poll=1** (cờ cũ 70025d3e lưu `POSTBOOT_PASS-70025d3e` trước khi ghi đè). Boot 802f358f lúc ghi cờ ~1h12' tuổi, vẫn sống. |

- **2 dòng dpkg.log lúc boot +40s — GIỐNG mẫu khởi động
  nhanh của các boot trước (+37s/+41s/+48s), NHƯNG wrapper
  replay KHÔNG chạy tiếp sau đó** (0 apt/dpkg lúc 21:26–
  21:29Z, đã 2–5 phút sau 2 dòng startup). Khác boot 70025d3e
  (2 dòng lúc +35m05s KÈM wrapper + apt-get update đang
  chạy). Khả năng: (a) 2 dòng này là dpkg --configure -a của
  tiến trình boot image (không phải os-intent replay) và
  replay thật chưa được kích hoạt; (b) replay đã chạy
  --configure -a rồi chết trước khi vào vòng ledger (cần log
  runtime để phân biệt — T7/T10). T5 ghi dữ kiện, không
  khẳng định.
- **Cache 0 .deb là dữ kiện mới quan trọng:** 5 lần reboot
  trước cache đều sống (178 .deb / 156M); lần này dir trống
  hoàn toàn. Hệ quả: replay boot 802f358f (khi tới) phải
  download lại toàn bộ ~170 package qua mạng — chậm hơn hẳn
  pha cài 1m54s của boot 70025d3e (cài từ cache). T10 lưu ý
  khi tính thời gian chờ replay boot mới.
- **Trùng giây đáng chú ý cho điều tra (m):** started_at run
  149 bị viết lại thành **21:24:31Z** — đúng giây 2 dòng
  dpkg.log đầu tiên (xem §8.2 mục 4). T7-149 đối chiếu: hai
  sự kiện cùng giây có chung trigger (reconcile sau boot
  +40s) hay trùng hợp.
- **Nợ chuyển tiếp — ĐÃ XỬ LÝ TRONG BỔ SUNG (22:28–22:35Z):**
  replay boot 2 KHÔNG tới trong 60' → TRIGGER §8.2(B) form B
  = YES (verify 5/5) → --repair 1 lần → RE-CHECK PASS →
  poll1-boot2 độc lập PASS → **cờ mới 22:35:39Z poll=1 ĐÃ
  GHI** — nợ "cờ cho boot 802f358f" ĐÓNG trong đợt 149, KHÔNG
  chuyển đợt 150. Ghi chú cho T4/T10: đây là cờ
  **repair-1-phần** (GST symlink, dpkg 795/113/230) — nếu
  replay đầy đủ tới SAU (cài nốt ~170 gói còn lại, GST thành
  thư mục thật), T5-150 kiểm lại + ghi cờ replay-đầy-đủ thay
  thế. **Đoạn "KHÔNG chạy --repair trên boot mới trong phiên
  này" ghi lúc đóng 21:29Z ĐÃ LỖI THỜI** — lúc đó boot mới
  5' tuổi, chưa đủ lâu để kích hoạt form B (dpkg im mới
  ~300 s < 600 s); sau 60' watcher, điều kiện form B đủ
  (dpkg im 3.990 s) nên repair chạy theo tiền lệ đợt 140
  boot 2 / 142 — xem F-149-T5-8.

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng

| File | Lúc mở 20:39–20:49Z | Lúc đóng (21:29Z, boot mới) | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | c8c7c686… → c07e6fee… | c07e6fee… | SỬA đợt này (xem §3.7) |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH
  VIỄN làm instrumentation theo quyết parent đợt 137 §12.3(a).
  T5 KHÔNG đụng file này.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 1 SERIES n=40 ĐẦY ĐỦ (20:43:16–21:22:18Z, boot 70025d3e)

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup,
> đường dẫn tuyệt đối (script copy từ round148-t5/ram-sampler-
> boot2.sh, đổi OUT sang round149-t5 TRƯỚC khi chạy — kiểm
> bằng grep, không lặp lại F-138-T5-1: grep `round148`
> = 0 sau sed). **1 series, không reboot giữa phiên** (reboot
> xảy ra trước khi đợt mở).

### 5.1 Bảng mẫu — 40 mẫu đầy đủ (avail/balloon kB, load1)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
| 1 | 20:43:16 | 726.948 | 6.115.440 | 0,83 |
| 2 | 20:44:16 | 1.134.124 | 5.706.776 | 3,08 |
| 3 | 20:45:16 | 1.046.980 | 5.774.616 | 2,85 |
| 4 | 20:46:16 | 939.780 | 5.909.196 | 1,38 |
| 5 | 20:47:16 | 875.380 | 6.034.248 | 1,55 |
| 6 | 20:48:16 | 1.163.000 | 5.519.684 | 1,67 |
| 7 | 20:49:16 | 1.057.308 | 5.042.688 | 0,92 |
| 8 | 20:50:16 | 746.776 | 5.160.696 | 5,53 |
| 9 | 20:51:16 | 981.260 | 5.295.664 | 4,06 |
| 10 | 20:52:16 | 852.688 | 5.419.240 | 3,85 |
| 11 | 20:53:17 | 1.078.744 | 4.893.256 | 7,23 |
| 12 | 20:54:17 | 927.776 | 4.673.564 | 5,52 |
| 13 | 20:55:17 | 1.298.404 | 4.534.012 | 2,83 |
| 14 | 20:56:17 | 1.527.844 | 4.721.600 | 1,96 |
| 15 | 20:57:17 | 1.680.252 | 4.903.564 | 1,26 |
| 16 | 20:58:17 | 1.424.876 | 4.079.900 | 3,73 |
| 17 | 20:59:17 | 1.982.532 | 3.883.292 | 8,48 |
| 18 | 21:00:17 | 1.349.332 | 4.094.712 | 11,10 |
| 19 | 21:01:17 | 1.583.056 | 4.286.048 | 9,43 |
| 20 | 21:02:17 | 1.651.304 | 4.485.924 | 5,55 |
| 21 | 21:03:17 | 1.667.772 | 4.682.276 | 2,51 |
| 22 | 21:04:18 | 1.891.980 | 4.125.696 | 1,31 |
| 23 | 21:05:18 | 2.342.132 | 4.112.100 | 0,61 |
| 24 | 21:06:18 | 1.927.508 | 4.370.936 | 0,22 |
| 25 | 21:07:18 | 1.763.784 | 4.591.272 | 7,16 |
| 26 | 21:08:18 | 1.794.804 | 4.781.040 | 8,92 |
| 27 | 21:09:18 | 1.512.248 | 4.987.948 | 6,39 |
| 28 | 21:10:18 | 1.594.488 | 5.167.496 | 3,97 |
| 29 | 21:11:18 | 1.793.480 | 4.840.376 | 2,43 |
| 30 | 21:12:18 | 1.664.924 | 5.059.832 | 1,28 |
| 31 | 21:13:18 | 1.416.904 | 5.251.036 | 1,01 |
| 32 | 21:14:18 | 1.501.864 | 5.232.240 | 0,97 |
| 33 | 21:15:18 | 1.949.320 | 4.775.692 | 1,83 |
| 34 | 21:16:18 | 2.094.228 | 4.635.988 | 2,12 |
| 35 | 21:17:18 | 1.351.812 | 4.818.936 | 2,16 |
| 36 | 21:18:18 | 1.323.348 | 5.002.980 | 1,08 |
| 37 | 21:19:18 | 967.172 | 5.152.160 | 1,60 |
| 38 | 21:20:18 | 854.156 | 5.309.936 | 1,29 |
| 39 | 21:21:18 | 709.312 | 5.433.916 | 1,22 |
| 40 | 21:22:18 | 730.188 | 5.467.000 | 0,65 |
- Thống kê (tính bằng code trên 40 mẫu): min avail **709.312
  kB lúc 21:21:18Z**; max **2.342.132 kB lúc 21:05:18Z =
  2.287,2 MiB = 37,2% guard**; trung bình 1.371.995 kB;
  Balloon min **3.883.292 kB lúc 20:59:17Z**, max **6.115.440
  kB lúc 20:43:16Z (94,9% trần)**, trung bình 4.958.324 kB;
  **0 mẫu ghim trần 6.443.824 kB**; Gate A (≥1.048.576 kB):
  **28/40 mẫu** (12 mẫu dưới gate: 8 mẫu đầu phiên lúc
  replay + burst mở đợt, 1 mẫu #3 chỉ thiếu 1.596 kB, và
  4 mẫu cuối phiên 21:19–21:22Z khi balloon phình lại);
  load1 0,22–11,10.
- **Hình dạng: răng cưa, KHÔNG đơn điệu** (như đợt 148).
  Balloon xả sâu tới 3,88M lúc 20:59:17Z (avail vọt
  1,98M) rồi phình lại tới 5,47M cuối phiên; nửa đầu mean
  avail 1.201.418 / balloon 5.026.706, nửa sau 1.542.571 /
  4.889.943 — avail nửa sau cao hơn. **CỬA SỔ GUARD: KHÔNG
  MỞ trong phiên này.** Max 37,2% guard — thấp hơn 57,2%
  đợt 148 và 43,3% đợt 147; còn thiếu 3.949.324 kB mới tới
  guard. Tự động hóa birefnet của T9 (quyết (l) (a))
  **chưa có cửa sổ thật để kích hoạt đợt này** — 0 lần thử
  birefnet (T9 xác nhận chính thức — T5 chỉ ghi sampler
  của mình).
- **Balloon: 0/40 mẫu ghim trần — đợt thứ 6 liên tiếp sampler
  T5 ghi 0 mẫu ghim** (đợt 144: 0/53; đợt 145: 0/40; đợt 146
  series 1: 0/37; đợt 147: 0/40; đợt 148: 0/40; đợt 149:
  0/40). NHƯNG mẫu đầu đã 94,9% trần (6.115.440 kB) và
  balloon phình lại cuối phiên (5,47M) — đóng băng chưa
  hết, chỉ là chưa ghim trong cửa sổ 40 phút này. Chuỗi
  ghim trần MỚI của T9 (= 1 đợt từ đợt 148, 38/115 mẫu):
  **sampler T5 đợt này KHÔNG ghi thêm mẫu ghim nào** —
  T9-149 phán chuỗi bằng series dài của họ.
- **Caveat (F-149-T5-4):** timestamp mẫu drift :16 → :17
  từ mẫu 11 (20:53:17Z) → :18 từ mẫu 22 (21:04:18Z) — sleep
  60 + thời gian chạy lệnh tích lũy ~1 s. Cadence vẫn ~60
  s/mẫu; không ảnh hưởng số liệu. Cùng họ F-148-T5-4.
- **Sampler sống qua reboot? KHÔNG — sampler đã xong TRƯỚC
  reboot #39** (SAMPLER_DONE 21:23:18Z; reboot 21:23:51Z).
  Series n=40 trọn vẹn trên boot 70025d3e, không gap, không
  mẫu nào trên boot mới 802f358f (khoảng phủ sóng boot mới:
  T9-149 nếu chạy series dài sẽ phủ; T5 không chạy sampler
  thứ 2 — không thuộc brief).

### 5.2 Đối chiếu định lượng RAM — snapshot 20:49:55Z (giữa phiên, load1 ~1,5)

| Hạng mục | kB | Ghi chú |
|---|---|---|
| MemTotal | 8.124.900 | |
| MemFree | 138.412 | |
| MemTotal − MemFree (used) | 7.986.488 | số `free` báo "used" |
| Σ RSS mọi process (`ps -eo rss`) | 1.563.736 | process lớn nhất WebKitWebProcess 319.688 kB, hatch 272.132 kB, MiniBrowser 214.428 kB, MainThread 180.796 + 163.056 kB |
| Buffers | 8 | gần như 0 |
| Cached | 912.744 | |
| Slab | 431.408 | (SReclaimable 254.340) |
| **Balloon** | **5.118.668** | **63,0% MemTotal** |
| Σ (RSS + Buffers + Cached + Slab + Balloon) | 8.026.564 | |
| **Dư chưa quy (used − Σ)** | **−40.076** | Σ CAO hơn used 40.076 kB (~0,5%) — trong sai số đếm trùng shared pages của Σ RSS (đợt 148 dư +240.972 kB cùng chiều sai số ngược lại) |

- **Kết luận: khoảng "không nằm trong RSS" = balloon — TÁI
  XÁC NHẬN lần 2** (đợt 148 §5.2 đã quy; đợt này snapshot
  độc lập cho cùng kết luận với dư chỉ −0,5%). Balloon lúc
  snapshot 5.118.668 kB ≈ 64% used.
- **Hệ quả (chuẩn đứng từ đợt 148):** khi "RAM sập mà RSS
  tổng thấp", đọc ngay dòng `Balloon` trước khi nghi
  leak/process ẩn.

### 5.3 Burst-watcher — quy nguồn tải tức thời (đợt thứ 2 chạy)

> Watcher: 10 s/lần đọc /proc/loadavg; load1 ≥ 3,0 thì chụp
> `top -b -n1` + delta `/proc/<pid>/stat` utime+stime (2 lần
> đọc cách 1 s, top 10) + nr_running + meminfo đầy đủ.
> Script `hidden_files/round149-t5/burst-watch.sh`, log
> `burst-watch.log`. Chạy từ 20:43:37Z.

| Thời gian (Z) | load1 | nr_running | Nguồn quy được (delta jiffies/s, top 3) |
|---|---|---|---|
| 20:43:37 baseline | 0,96 | 5/476 | hatch 12, apt-get 7, hatch-execd 3 — replay đang cài |
| 20:43:49 | 3,02 | 7/509 | hatch 25, hatch-execd 5, apt-get 4 — replay |
| 20:44:11 | 3,09 | 6/497 | ffmpeg 130 (T0 demo_effects geq), dpkg 16, hatch 5 |
| 20:44:52 | 3,09 | 4/474 | hatch 17, find 6 (T2 eperm-probe), hatch-execd 4 |
| 20:49:54 | 3,42 | 5/579 | hatch 42, grep 13 (T2 DEAD), find 7 (T2 media.ts) |
| 20:50:16–20:52:27 | 5,53 → 5,41 | 3–8/5xx | grep DEAD (T2) 8–48, hatch 6–29, WebKit (T4 attempt1) |
| 20:52:49 | 6,80 | 11/54x | MainThread 41 (vite), esbuild 31, MainThread-vite 29 (T8) |
| 20:53:12–20:54:46 | 7,07 → 3,56 | 2–23/6xx | ffmpeg 121–135 (T0 1080p), WebKit 17–65 (T4), tsc 43–65 (T1), grep DEAD (T2) |
| 20:58:11–21:02:46 | 3,36 → 4,05 | 1–16/5xx | ffmpeg 129–162 (T0 + maskan), python3 maskan 41–98, WebKit 21–74 (T4), grep DEAD (T2) |
| 21:06:29–21:10:53 | 3,98 → 3,20 | 1–16/5xx | ffmpeg 114–173 (T0), WebKit (T4), python3 blind68-investigate (T2) 15–17, hatch |

- **Tổng kết watcher: 44 dòng SPIKE (1 baseline + 43 capture),
  load1 3,02–11,10, TẤT CẢ QUY ĐƯỢC NGUỒN.** Cụm A mở đợt
  (4 dòng, 20:43:37–20:44:52Z): replay apt/dpkg + ffmpeg T0 +
  hatch — tải khởi động các luồng + đuôi replay. Cụm B (9,
  20:49:54–20:52:49Z): grep/find T2 + hatch + vite/esbuild T8.
  Cụm C (5, 20:53:12–20:54:46Z): ffmpeg T0 1080p + WebKit T4
  + tsc T1. Cụm D (13, 20:58:11–21:02:46Z): ffmpeg + python3
  maskan + WebKit T4 — đỉnh load1 11,10 lúc 21:00:17Z (sampler
  mẫu 18). Cụm E (13, 21:06:29–21:10:53Z): ffmpeg T0 +
  blind68-investigate T2. **0 spike nào không quy được đợt
  này** (khác cụm C đợt 147). Spike 21:08:22Z (load1 8,53)
  có delta TRỐNG nhưng top -b -n1 bắt được ffmpeg pid 55621
  ở 170% CPU — ffmpeg ngắn ngủi chết giữa 2 lần đọc stat
  (giới hạn đã biết của delta, không phải spike bí ẩn).
- Watcher dừng tay lúc đóng (21:25:16Z, sau reboot #39 —
  log còn nguyên trên overlay; pkill lần đầu match cả shell
  của T5 — xem F-149-T5-5).

### 5.4 Birefnet / u2net — kiểm tra tình trạng theo quy trình đứng

- **Birefnet: KHÔNG thử bởi T5** (brief loại trừ; việc của T9
  theo quyết §12.3(f) đợt 137 + quyết (l) đợt 146 (a)). Tự
  động hóa (a) của T9 đã nối từ đợt 147 — T9-149 tự theo dõi;
  T5 chỉ ghi sampler của mình (**0 mẫu ≥ guard** — max 37,2%
  guard, xem §5.1).
- **u2net (fallback chính thức) — KHÔNG kiểm lại đợt này:**
  T5-146 đã kiểm sự hiện diện đầy đủ (rembg 2.0.87,
  `~/.u2net` có u2net.onnx + birefnet-general.onnx, models/
  218M); T5-149 không đụng đĩa thêm vì không có dữ kiện mới
  (không cài/xóa gì liên quan). T5 không chạy thử u2net (không
  thuộc brief).
- Guard **6.144 MiB GIỮ NGUYÊN** (quyết §12.3(d) đợt 138 +
  quyết (n) đợt 144 + quyết (l) đợt 146).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, cap 30.000) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 9 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 141 mở (T5) / cuối (T5) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| Đợt 143 mở (T5) / cuối (T5) | 1498 / 1494 | boot 70a5b0fc |
| Đợt 144 mở (T5) / cuối (T5) | 1289 / 1193 | boot 691a7403 / cc222c8a |
| Đợt 145 mở (T5) / cuối (T5) | 1074 / 1070 | boot e146ca67 |
| Đợt 146 mở boot 1 (T5) / mở boot 2 / cuối boot 2 | 879/880 / 784 / 772 | boot 98a7c93f / 6fb582df |
| Đợt 147 mở (T5) / cuối (T5) | 669 / 661 | boot 6fb582df |
| Đợt 148 mở (T5) / cuối (T5) | 548 / 455 | boot d8a11644 |
| **Đợt 149 mở (T5, 20:45Z)** | **434** | **boot 70025d3e, headroom-open.txt** |
| **Đợt 149 cuối (T5, 21:25Z)** | **336** | **boot MỚI 802f358f (1m41s tuổi), headroom-end.txt — KHÔNG phải cuối phiên boot 70025d3e** |

- Giảm −114 so với mở đợt 148 (548 → 434, khác boot) và
  −21 so với cuối đợt 148 (455 → 434, khác boot); **Vẫn DƯỚI
  ngưỡng báo user (< ~1.800)** — theo quyết parent (k) đợt
  144 + (m) đợt 146 (chỉ theo dõi, không hành động mới, không
  nhắc lại riêng), đợt này **chỉ theo dõi, không báo riêng,
  không tự đổi gì**. Tỉ lệ/vite: ~0,28 (434/1578) → ~0,21
  (336/1578) — lần thứ 7 liên tiếp dưới 1,0 (đợt 148: ~0,29).
  Trong phiên giảm thêm −98 (434 → 336) NHƯNG hai số đo trên
  HAI BOOT KHÁC NHAU (70025d3e → 802f358f qua reboot #39) nên
  KHÔNG đọc là "giảm trong phiên" — số cuối là headroom của
  boot mới lúc 1m41s tuổi, khi các luồng khác đang khởi động
  lại sau reboot (Xvfb + bash đã chạy lại; vite/WebKit chưa
  lên hết lúc đo). So sánh cùng boot không có (boot 70025d3e
  chết trước khi T5 đo cuối). T9-149 đo độc lập để đối chiếu;
  T10 lưu ý khi gộp: **đừng ghi "headroom cuối phiên 336"
  như số của boot 70025d3e**.
- **Cap probe 30.000 áp dụng lần 3** (quyết (m) đợt 146):
  script k8 copy từ đợt 148, `CAP = 30000`, verify bằng grep
  trước khi chạy. Headroom ~434 nên cap không ảnh hưởng kết
  quả (dừng ở 434 do ENOSPC, xa cap). Trần boot này:
  **63747 — KHÔNG đổi** (flip-flop 63747 → 63756 → 63747 đã
  dừng ở 63747 bốn lần đo liên tiếp trên ba boot). Số watch
  đang giữ ngoài cell suy ra: 63.747 − 434 = **63.313 watch**
  (mở).
- Caveat (F-149-T5-5): headroom mở 434 đo giữa lúc replay
  đang cài (apt/dpkg chạy, 20:45:12Z) + burst mở đợt (T0
  ffmpeg, T4 WebKit, T1 tsc — các watcher inotify của chúng
  đều tính vào trần chung 63.747) nên headroom 434 có thể
  thấp tạm thời so với mức nền của boot. Headroom-cuối 336 đo
  trên boot MỚI 802f358f lúc 1m41s tuổi (21:25:32Z) — các
  luồng khác đang khởi động lại sau reboot #39 nên số này
  cũng không phải mức nền của boot mới. T9-149 đo độc lập để
  đối chiếu.

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 6,8G trống** (đo 20:50Z — bằng
  đợt 147/148); `/tmp` tmpfs 512M, 491M trống. Không có ENOSPC
  nào trong phiên ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại
  (symlink → `../vite/bin/vite.js`, mtime 09/11 không đổi) — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock). T4-149 đo lượt yên #22 trên boot này (việc của T4).

## 7. EPERM scan + dmesg — đối chiếu (T2-149 ĐÃ chạy probe #68)

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #68 (T2-149): ok=2 fail=0, boot=70025d3e, 20:51:02Z**
  (`eperm-probe-v2.log`: 193 → **196 dòng (+3 đúng prereg)**:
  1 dòng DEAD-detected (last #67 17:42:42Z, age 11.300 s) + 1
  dòng boot-changed (d8a11644 → 70025d3e, uptime since
  20:00:33Z — KHỚP btime T5 đo) + 1 dòng probe #68). Probe
  #68 chạy 20:51:02Z — cùng boot 70025d3e mà T5 đang kiểm
  (trước reboot #39).
- **Mù #68/#69? MỞ → giao T2-149; mù #70? MỞ (reboot #38)
  → giao T2-149; mù #71? MỞ (reboot #39) → giao T2-149**
  (quyết parent đợt 148 (f)/(g) + reboot mới). T5 ghi theo
  T2-148/T2-149, không tự phán mù.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142/T5-143/T5-144/T5-145/
  T5-146/T5-147/T5-148).
- Lưu ý log probe: dòng `boot changed` ghi **d8a11644 →
  70025d3e** — probe chết theo reboot (last #67 17:42:42Z,
  DEAD-detected 20:51:02Z age 11.300 s); đây là giới hạn của
  probe log, không phải dữ kiện về boot. Probe #69 chưa chạy
  tới lúc T5 đóng (sẽ chạy trên boot 802f358f — việc T2-149/
  T2-150).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (lần kiểm
  cuối 21:28Z: 196 dòng, 0 sóng).
- `eperm-now.txt` ở repo root **ĐỌC LẠI đợt này: vẫn chỉ chứa
  `x` + newline** (không đổi từ đợt 137–149, kiểm lại trên
  boot mới 21:28Z).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).
- **WFS scan: T5 KHÔNG chạy đợt này** (không thuộc brief
  T5-149). Chờ T2-149 (WFS #54 chênh 0 đợt 148 — lần thứ 54).

### 7.3 dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–148; kiểm lại trên boot mới 802f358f lúc 21:28Z, kết quả
  như cũ). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 8. Dữ kiện thời gian reboot cho T7-149 — ĐIỀU TRA MẪU (m) (quyết parent đợt 148 (f))

> T5 cung cấp dữ kiện + mốc neo; **T7-149 phán cơ chế**.
> Mọi epoch đều kiểm lại bằng `date -u -d @<epoch>` trước khi
> ghi (bài học F-147-T7-1 / F-148-T7-1 — phép trừ nhẩm epoch 10
> chữ số đã nhiều lần sai; T5-149 đã bắt được HAI phép trừ
> nhẩm sai của chính mình trước khi ghi — xem F-149-T5-3).

### 8.1 Run vcut 147/148/149 — đọc trực tiếp từ muse.db (`scheduler.job_runs`, job_id `vcut-build-loop`, LIMIT 5, đọc 20:47Z + đọc lại 21:28Z sau reboot #39)

| Lượt | run_id (8 ký tự đầu) | scheduled (Z) | started_at GỐC (Z) | started_at HIỆN TẠI (Z) | finished (Z) | status | Jitter gốc |
|---|---|---|---|---|---|---|---|
| 147 | 98cf7700 | 14:35:51 | 14:35:51 | **17:28:34** (viết lại tại reboot #35) | 17:36:53 | **timeout** | 0 s |
| 148 | b33c757c | 17:35:51 | 17:36:53 | **19:41:37** (viết lại tại reboot #36 → #37) | **20:19:32** | **succeeded** | **+62 s** |
| 149 | 91ee7447 | 20:35:51 | **20:35:51** | **21:24:31** (viết lại tại reboot #39 — đọc lại 21:28Z; đọc lại 21:41Z vẫn 21:24:31Z, không đổi thêm) | null | **running** | **0 s** |

- Epoch thô (đã kiểm bằng `date -u`): run 149 sched =
  1795120551 = 20:35:51Z; started GỐC = 1795120551 =
  20:35:51Z; started HIỆN TẠI = 1795123471 = 21:24:31Z
  (đọc lại 21:28Z, sau reboot #39); run 148 finished =
  1795119572 = 20:19:32Z, started hiện tại = 1795117297 =
  19:41:37Z; run 147 finished = 1795109813 = 17:36:53Z,
  started hiện tại = 1795109314 = 17:28:34Z.
- Run 146 (`e24b5870`): started vẫn 1795090442 = 12:14:02Z,
  finished 1795098276, succeeded — KHÔNG đổi (đã finished
  nên không viết lại). Run 145 (`fcfdad2e`): started vẫn
  1795082083 = 09:54:43Z, finished, succeeded — KHÔNG đổi.
- **Run 149 ĐỌC 2 LẦN: 20:47Z started = 20:35:51Z (jitter 0,
  chưa viết lại — 0 reboot từ lúc mở tới lúc đó); 21:28Z
  started = 21:24:31Z (ĐÃ viết lại tại reboot #39).** Hai lần
  đọc kẹp chặt lần viết lại trong khoảng (20:47Z, 21:28Z] —
  đúng khoảng chứa reboot #39 (21:23:51Z).

### 8.2 Bốn dữ kiện mới (đều là dữ kiện, không phải kết luận cơ chế)

1. **Run 148 SUCCEEDED — KHÔNG timeout.** Tuổi run 148 lúc
   finished (tính từ started GỐC 17:36:53Z): 9.759 s =
   2h42m39s — còn dư **1.041 s** trong ngân sách 10.800 s
   (hạn timeout theo started gốc: 20:36:53Z; finished
   20:19:32Z, trước hạn 17m21s). Tính từ started HIỆN TẠI
   (19:41:37Z, đã viết lại): tuổi chỉ 2.275 s — hạn timeout
   theo started hiện tại sẽ là 22:41:37Z (T7-149 lưu ý khi
   phán: scheduler tính timeout theo started nào?).
   → Vế thứ nhất của mẫu (m) (run N TIMEOUT) **VẮNG** ở
   148→149.
2. **Run 149 jitter 0 s.** Started 20:35:51Z đúng giây
   scheduled (1795120551 = 1795120551). → Vế thứ hai của
   mẫu (m) (run N+1 khởi động muộn) **VẮNG** ở 148→149.
   **Mẫu (m) KHÔNG TÁI DIỄN ở 148→149** (lần đầu kiểm sau
   khi parent ra lệnh điều tra).
3. **Reboot #38 KHÔNG viết lại started_at run 148.**
   Run 148 vẫn `running` lúc reboot #38 (20:00:33Z) và
   finished sau đó (20:19:32Z), nhưng started_at vẫn
   19:41:37Z (btime ae8f70bb + 35 s — đúng số T7-148 ghi
   lần cuối). Đây là **LẦN ĐẦU quan sát được reboot trong
   lúc run đang chạy mà started_at KHÔNG đổi** (chuỗi
   trước đó: 23 lần kiểm / 15 bằng chứng trực tiếp đều
   thấy viết lại, offset stat 31–50 s). → Giả thuyết "viết
   lại tại MỌI reboot trong lúc run chạy" bị dữ kiện này
   thách thức — NHƯNG xem mục 4: reboot #39 NGAY SAU ĐÓ
   lại viết lại run 149, nên #38 là ngoại lệ đơn lẻ chứ
   không phải mẫu mới. Các khả năng T7-149 cần xét (T5 chỉ
   liệt kê, không chọn): (a) viết lại gắn với runtime
   restart chứ không phải reboot — reboot #38 có thể không
   kèm runtime restart (khác #36/#37 đều giết sleep +
   restart runtime của T7); (b) viết lại chỉ xảy ra khi
   scheduler reconcile trong một cửa sổ nào đó sau boot mà
   lần #38 không tới; (c) run 148 đã qua một pha nào đó
   khiến started_at bị khóa (run 148 lúc #38 đã 2h23m tuổi,
   gần hết ngân sách; run 149 lúc #39 mới 48m40s tuổi).
   **T7-149 phán.**
4. **Reboot #39 VIẾT LẠI started_at run 149 — bằng chứng
   trực tiếp thứ 16.** Run 149 vẫn `running` lúc reboot #39
   (21:23:51Z); đọc lại 21:28Z thấy started_at =
   **21:24:31Z** (epoch 1795123471, kiểm bằng `date -u`) —
   offset **40 s (stat)** sau btime 802f358f (21:23:51Z),
   **30 s (proc/1)** sau 21:24:01Z. Offset stat 40 s ĐÚNG
   DẢI CHUỖI 31–50 s (chính giữa dải); offset proc/1 30 s
   nằm dưới min chuỗi 31 s theo stat nhưng trên các offset
   proc/1 trước (25–27 s) — xem T7-148 §2.4.2(c). Tuổi run
   149 lúc viết lại (từ started gốc 20:35:51Z): 2.920 s =
   48m40s. Hạn timeout theo started GỐC: 23:35:51Z; theo
   started MỚI: 00:24:31Z (20/11) — T7-149/T10 lưu ý khi
   phán (scheduler tính timeout theo started nào?).
   **Trùng giây đáng chú ý:** 21:24:31Z cũng là timestamp
   2 dòng "startup packages configure" đầu tiên trong
   dpkg.log boot mới (xem §3.8) — hai sự kiện cùng giây có
   chung trigger (reconcile sau boot +40s) hay trùng hợp,
   T7-149 đối chiếu.
   → Giả thuyết viết lại ĐƯỢC CỦNG CỐ LẠI bởi #39 sau 1
   ngoại lệ (#38): chuỗi bằng chứng trực tiếp lên **16**.
   **Bổ sung 21:41Z:** đọc lại run 149 lần 3 — started_at
   vẫn **21:24:31Z** (epoch 1795123471, không đổi), status
   vẫn `running`, finished null — **KHÔNG bị viết lại thêm**
   trong lúc chờ watcher + repair (không có reboot #40).
   (đợt 148: 15).

### 8.3 Mốc neo thời gian reboot (btime /proc/stat — chuẩn parent (b))

| Boot | btime stat (Z) | Chết lúc (Z) | Tuổi thọ (s) | Run đang chạy lúc reboot | started_at có đổi không |
|---|---|---|---|---|---|
| d8a11644 | 17:27:53 | 19:34:32 (#36) | 7.599 | run 148 (started gốc 17:36:53Z) | CÓ → 19:35:15Z (+43 s stat / +27 s proc/1) |
| 1d610e56 | 19:34:32 | 19:41:02 (#37) | 390 | run 148 | CÓ lần 2 → 19:41:37Z (+35 s stat / +25 s proc/1) |
| ae8f70bb | 19:41:02 | 20:00:33 (#38) | 1.171 | run 148 | **KHÔNG** (vẫn 19:41:37Z) — NGOẠI LỆ DUY NHẤT |
| 70025d3e | 20:00:33 | 21:23:51 (#39) | 4.998 | run 149 (started gốc 20:35:51Z) | **CÓ → 21:24:31Z (+40 s stat / +30 s proc/1)** — bằng chứng thứ 16 |
| 802f358f | 21:23:51 | còn sống | — | run 149 (started mới 21:24:31Z) | chưa có reboot từ lúc mở |

- **Chuỗi offset viết lại (stat, 31–50 s) CÓ SỐ MỚI: 40 s
  (149)** — …/41 (147) / 43 (148-lần-1) / 35 (148-lần-2) /
  **[KHÔNG viết lại ở #38]** / **40 (149)**. Dải chuỗi giữ
  nguyên 31–50 s; cả 4 số mới nhất (41/43/35/40) đều trong
  dải. Offset proc/1 tương ứng 26/27/25/30 s (đều dưới min
  chuỗi stat — xem T7-148 §2.4.2(c)).
- **finished147 == started148 (trùng giây 17:36:53Z) vẫn là
  dữ kiện đợt 148** (không đổi); đợt này finished148
  (20:19:32Z) ≠ started149 (20:35:51Z) — cách nhau 975 s,
  KHÔNG trùng giây. Mẫu trùng giây không tái diễn.
- **Replay khởi động 20:35:38Z — chỉ 13 s trước khi run 149
  khởi động (20:35:51Z):** dữ kiện thời gian cho T7-149
  đối chiếu (replay có thể được kích hoạt cùng đợt với
  run — hoặc trùng hợp; T5 không khẳng định).

## 9. Nợ mở sang đợt sau

1. **Lượt yên #22: ĐANG ĐO Ở ĐỢT 149 (việc T4-149).**
   Quyết parent đợt 148 (h): #21 ĐÓNG, #22 mở đợt 149. Cờ
   POSTBOOT_PASS của T5 đã ghi 20:49:23Z poll=2 cho boot
   70025d3e — boot này ĐÃ CHẾT ở reboot #39; **cờ mới cho
   boot 802f358f ĐÃ GHI 22:35:39Z poll=1** (bổ sung — xem
   §3.8; cờ repair-1-phần, GST symlink, dpkg 795/113/230).
   T4-149 đo #22 trên boot 802f358f bằng cờ này; attempt #22
   nào chạy trên boot 70025d3e trước #39 có thể đã bị reboot
   giết — T4/T10 phán lúc đóng.
2. **Điều tra mẫu (m): GIAO T7-149 (hạn một đợt — quyết
   parent đợt 148 (f)).** T5 đã cung cấp dữ kiện §8: run 148
   SUCCEEDED + run 149 jitter 0 s gốc + reboot #38 KHÔNG viết
   lại started_at (ngoại lệ duy nhất) + reboot #39 VIẾT LẠI
   started_at run 149 (offset 40 s, bằng chứng thứ 16) → mẫu
   (m) KHÔNG tái diễn ở 148→149; giả thuyết viết lại có 1
   ngoại lệ nhưng được củng cố lại bởi #39. T7-149 phán cơ chế.
3. **Cửa sổ guard: KHÔNG MỞ đợt này (max 37,2% guard).** Tự
   động hóa birefnet của T9 (quyết (l) (a)) đã nối từ đợt
   147 — 0 lần kích hoạt (không có cửa sổ thật). Guard 6.144
   MiB GIỮ NGUYÊN; u2net là fallback chính thức.
4. **Balloon: chuỗi ghim trần MỚI (= 1 đợt từ đợt 148).**
   Đợt 148: 38/115 mẫu ghim trần (chuỗi liên tục 37 phút);
   đợt 149 sampler T5: **0/40 mẫu ghim trần** (max 94,9%
   trần lúc mẫu đầu, xả sâu tới 3,88M giữa phiên rồi phình
   lại 5,47M cuối phiên). T9-149 phán chuỗi bằng series dài
   của họ (sampler T5 không ghi thêm mẫu ghim nào).
5. **Headroom VẪN DƯỚI NGƯỠNG BÁO (mở 434 boot 70025d3e →
   336 boot MỚI 802f358f):** chỉ theo dõi, không báo riêng
   (quyết parent (k) đợt 144 + (m) đợt 146). T9 đối chiếu
   độc lập. Lưu ý: hai số đo trên hai boot khác nhau (xem
   §6.1).
6. **Replay khởi động muộn +35m05s (F-149-T5-1):** cơ chế
   chưa xác định — T7/T10 đối chiếu log runtime xem replay
   được kích hoạt bởi gì (trùng 13 s trước run 149 mở).
   Lần khởi động muộn thứ 2 sau #54 (+47'14").
7. **Lists HỒI LẠI 71 = 2 mirror — F-148-T5-3 ĐÓNG** (xem
   §3.4: lists mất theo rootfs rebuild, hồi lại sau apt-get
   update của replay).
8. **Replay boot mới 802f358f CHƯA TỚI — ĐÃ XỬ LÝ BẰNG
   --REPAIR (xem §3.8):** watcher boot 2 TIMEOUT 22:28:01Z
   (replay không tới trong 60'); --repair 1 lần 22:31–22:35Z
   → RE-CHECK PASS → poll1-boot2 PASS → cờ mới 22:35:39Z
   poll=1. Nợ "cờ cho boot 802f358f" ĐÓNG trong đợt 149.
   Cache 0 .deb (lần đầu tiên) → sau repair **110 .deb** —
   theo dõi đợt sau xem cache có hồi lại 178 .deb không
   (nếu replay đầy đủ tới sau và cài nốt ~170 gói). Nếu
   replay đầy đủ tới sau, T5-150 kiểm lại + ghi cờ
   replay-đầy-đủ thay thế cờ repair-1-phần này.
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 148 §11:
   G1 chờ user quyết; ci-security.yml vẫn 403 chờ user; file
   oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`
   vẫn chưa quyết số phận; TTS 39 cấm kiểm lại; release gate
   không đổi + KHÔNG push khi user chưa nhắn "push đi"; R9 (a)
   vẫn chờ user (số đếm VẪN LÀ 16); mâu thuẫn full boot_id
   b47f7932 vẫn để mở; mù #68/#69?/#70?/#71? mở giao T2-149.

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7
  lúc đóng, kiểm lại trên boot mới 21:29Z). `media.ts`: KHÔNG
  đổi (`2c384ed1`); `apps/web/vite.config.ts`: KHÔNG đổi
  (`ee80d093`). Postboot script: **SỬA đợt này** (`c8c7c686…` →
  `c07e6fee…` — xem §3.7; `bash -n` OK).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử bởi T5 (không
  thuộc brief; RAM series này: 0 mẫu ≥ guard, max 37,2% —
  xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-149 đã
  chạy probe #68 ok=2 fail=0 trên boot 70025d3e, 20:51:02Z).
  WFS scan: T5 KHÔNG chạy đợt này (không thuộc brief; chờ
  T2-149).
- Postboot boot 70025d3e: PASS poll0 (20:45:47Z, watcher) +
  poll1 (20:49:23Z); **poll2 FAIL exit 1 trên boot MỚI
  802f358f (21:25:32Z — replay chưa tới, đúng)**. Cờ
  POSTBOOT_PASS 20:49:23Z poll=2 đứng cho boot 70025d3e.
  **--repair: 0 lần trên boot 70025d3e; 1 lần trên boot
  802f358f** (22:31:03–22:35:23Z, exit 0 — xem §3.8).
  **Watcher replay: ĐÃ CHẠY (3 poll, REPLAY_DONE 20:45:47Z)
  + watcher boot 2 ĐÃ TIMEOUT 22:28:01Z (120 poll, replay
  KHÔNG tới)** → check-only timeout FAIL → TRIGGER §8.2(B)
  form B = YES (verify 5/5 22:31:01Z) → repair → **poll1-boot2
  độc lập PASS exit 0 (22:35:39Z) → cờ mới 22:35:39Z poll=1**.
  Luật (C): KHÔNG kích hoạt và KHÔNG đủ (lists 5 > 3, không
  có apt sống — giống hệt đợt 142); repair kích hoạt bằng
  §8.2(B) form B, không phải (C).
- B4 thực hành: **(a) file đóng băng MỚI dpkg-frozen-70025d3e.txt
  + dpkg-frozen-802f358f.txt (bổ sung, md5 `e70ca069…`)
  + (b) exact-comm = 0** (xem §3.6) — không có cửa sổ giao đối
  chiếu đợt này.
- Headroom: mở **434** (boot 70025d3e) → **336** (boot MỚI
  802f358f) — VẪN DƯỚI ngưỡng báo ~1.800, lần thứ 9 liên tiếp,
  chỉ theo dõi (hai số trên hai boot khác nhau — xem §6.1).
  Cap probe 30.000 áp dụng lần 3.
- RAM phiên T5 (1 series, xem §5): n=40 đầy đủ trên boot
  70025d3e: avail 709.312–2.342.132 kB (mean 1.371.995),
  balloon 3.883.292–6.115.440 kB (mean 4.958.324), gate A
  28/40, max **37,2% guard**, **0 mẫu ghim trần**,
  **0 mẫu ≥ guard**.
- **1 reboot trong phiên T5** — reboot #39 (21:23:51Z) giết
  boot 70025d3e (sống 4.998 s) trong lúc T5 đóng sổ; sampler
  đã xong trước reboot nên dữ liệu còn nguyên; boot mới
  802f358f sống từ 21:23:51Z tới lúc bổ sung xong (22:35Z,
  ~1h12' tuổi) — **KHÔNG có reboot #40** trong lúc chờ
  watcher + repair (boot_id kiểm 22:28:58Z + 22:35:39Z đều
  802f358f).
- **started_at lượt 149:** T5 ĐÃ kiểm đợt này (muse.db — xem
  §8): đọc 20:47Z jitter 0 s (20:35:51Z); đọc lại 21:28Z ĐÃ
  BỊ VIẾT LẠI thành 21:24:31Z tại reboot #39 (offset 40 s);
  **đọc lại 21:41Z vẫn 21:24:31Z, running, finished null —
  KHÔNG bị viết lại thêm** (xem §8.2 mục 4 + bổ sung).

## 11. Sai số F-149-T5-n (mọi sai số của luồng T5 đợt này)

- **F-149-T5-1 — Replay khởi động muộn +35m05s, cơ chế chưa xác
  định (dữ kiện, không phải lỗi đo).** T5 mở lúc boot đã 39'
  tuổi nhưng dpkg.log chỉ có 2 dòng; wrapper replay pid 839 +
  apt-get update pid 860 đang chạy, khởi động ~20:35:38Z
  (etime 05:37 lúc 20:41:15Z + dpkg.log mtime 20:35:38Z).
  Không có hoạt động dpkg/apt nào trước đó trên boot này.
  Cơ chế kích hoạt replay muộn chưa xác định — ghi rõ để
  T7/T10 đối chiếu log runtime (trùng 13 s trước run 149 mở
  — xem §8.3). T5 KHÔNG tự suy đoán cơ chế.
- **F-149-T5-2 — Brief lệch 1 s về /proc/1 (không đáng kể).**
  Brief đợt 149 nói /proc/1 20:00:44Z; T5 đo `ps -o lstart
  -p 1` = 20:00:43Z (start_ticks 1085 → 10,85 s sau btime
  20:00:33Z → 20:00:43,85Z, làm tròn lên :44). Chênh 1 s do
  làm tròn — không ảnh hưởng số liệu (offset 10,85 s dùng
  số thập phân).
- **F-149-T5-3 — Near-miss ×2: phép trừ nhẩm epoch sai, đã bắt
  được bằng `date -u` TRƯỚC khi ghi (cùng họ F-148-T7-1).**
  (a) Khi tính tuổi thọ ae8f70bb, T5 nhẩm epoch 1795114862
  cho 19:41:02Z (sai — số đúng 1795117262), cho ra tuổi thọ
  3.571 s (sai); kiểm lại bằng `date -u -d @1795117262`
  cho đúng 1.171 s. (b) Khi tính btime 1d610e56, T5 nhẩm
  epoch 1795114472 cho 19:34:32Z (sai — số đúng 1795116872),
  cho ra tuổi thọ 2.790 s (sai); kiểm lại bằng `date -u`
  cho đúng 390 s (khớp T7-148). Cả hai số sai KHÔNG đi vào
  LIMITS (bản nháp đã sửa trước khi đóng). Bài học: mọi epoch
  đều kiểm bằng `date -u` từ số thô — đã áp dụng xuyên suốt
  §8 (mọi số trong bảng §8.1/§8.3 đều kiểm lại).
- **F-149-T5-4 — Timestamp sampler drift :16 → :17 → :18
  (cùng họ F-148-T5-4).** Mẫu 1–10 ghi giờ :16, mẫu 11–21 ghi
  :17 (từ 20:53:17Z), mẫu 22–40 ghi :18 (từ 21:04:18Z) —
  sleep 60 + thời gian chạy lệnh tích lũy ~1 s sau ~10 và
  ~21 phút. Cadence vẫn ~60 s/mẫu; không ảnh hưởng số liệu.
- **F-149-T5-5 — Headroom mở 434 đo giữa lúc replay đang cài
  (caveat, không phải lỗi đo) + headroom-cuối 336 đo trên
  boot MỚI (caveat thứ hai).** Lúc probe mở (20:45:12Z) apt/
  dpkg đang cài gói cuối + T0 chạy ffmpeg + T4 chạy
  WebKit/MiniBrowser + T1 chạy tsc — watcher inotify của các
  luồng này đều tính vào trần chung 63.747 nên headroom 434
  có thể thấp tạm thời so với mức nền của boot. Headroom-cuối
  336 đo trên boot mới 802f358f lúc 1m41s tuổi (21:25:32Z) —
  các luồng khác đang khởi động lại sau reboot #39 nên cũng
  không phải mức nền. T9-149 đo độc lập để đối chiếu.
- **F-149-T5-6 — Reboot #39 trong lúc T5 đóng sổ (21:23:51Z)
  — T5 KHÔNG mất dữ liệu nhưng 3 hạng mục phải ghi lại cho
  đúng boot.** (a) Poll2 định chạy trên boot 70025d3e đã
  FAIL trên boot mới 802f358f — LIMITS ghi rõ poll2 FAIL
  thuộc boot mới, không phủ nhận cờ 20:49:23Z của boot cũ.
  (b) Headroom-cuối 336 thuộc boot mới, không phải "cuối
  phiên boot 70025d3e" — LIMITS ghi rõ hai số trên hai boot.
  (c) Bản nháp LIMITS lúc đầu ghi "0 reboot trong phiên" —
  ĐÃ SỬA thành "1 reboot trong phiên (#39)" trước khi đóng
  (xem §1 mục 3, §2, §10). Sampler n=40 không mất mẫu nào
  (xong 21:23:18Z, trước reboot 33 s); burst-watch log còn
  nguyên trên overlay; cờ POSTBOOT_PASS + manifest đóng băng
  còn nguyên (file trên overlay, không theo boot).
- **F-149-T5-7 — pkill burst-watch lần đầu match cả shell của
  T5 (lỗi thao tác, đã khắc phục).** Lệnh `pkill -f
  'burst-watch.sh'` match luôn shell exec đang chạy lệnh đó
  (cmdline chứa chuỗi) → shell bị SIGTERM, lệnh chết giữa
  chừng (exitSignal 15). Watcher cũng chết theo (đúng ý
  định) nhưng dòng BURST-WATCH-END chưa kịp ghi. T5 chạy lại
  bằng bracket trick (`pkill -f 'bash burst-watch[.]sh'`)
  và xác minh NO_WATCHER_PROC + ghi END line tay (21:25:16Z).
  Bài học: mọi pkill -f đều dùng bracket trick hoặc pgrep
  -f với pattern loại trừ shell mình.
- **F-149-T5-8 — Ghi chú "KHÔNG chạy --repair trên boot mới
  trong phiên này" (§3.8 lúc đóng 21:29Z) ĐÃ LỖI THỜI trong
  bổ sung cùng đợt (không phải lỗi đo — quyết định hết hạn
  theo thời gian).** Lúc đóng, boot 802f358f mới 5' tuổi,
  dpkg im mới ~300 s < ngưỡng 600 s của form B, nên ghi
  "chưa đủ lâu để kích hoạt luật (C)". Sau 60' watcher
  (TIMEOUT 22:28:01Z, dpkg im 3.990 s), điều kiện §8.2(B)
  form B đủ (verify 5/5 22:31:01Z) → --repair 1 lần chạy
  theo tiền lệ đợt 140 boot 2 / 142 (cùng dạng "chậm mà
  không cài", cùng 2 dòng/0 installs/lists 5/cache 0; luật
  (C) vẫn KHÔNG đủ — repair kích hoạt bằng form B, không
  phải (C)). Đoạn §3.8 cũ đã được viết lại trong bổ sung để
  không gây hiểu lầm cho T10. Bài học: mọi ghi chú "không
  làm X trong phiên này" về boot mới đều phải kèm điều kiện
  hết hạn (ngưỡng thời gian) để phiên bổ sung biết khi nào
  được làm lại.

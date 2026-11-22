# PHASE9_ROUND146_T5_INFRA_LIMITS — BOOT 98a7c93f (#109? chặt) REPLAY CHẠY TỐT (1545/221, +4m14s) → postboot PASS poll=2, CỜ 11:37:57Z → T4-146 ĐÃ MỞ CỬA YÊN #21 BẰNG CỜ NÀY → B4 THỰC HÀNH THEO (a)+(b): dpkg ĐÓNG BĂNG ĐÃ GHI + ps exact-comm = 0 → HEADROOM MỞ 879/880 (DƯỚI NGƯỠNG LẦN 6 LIÊN TIẾP, CHỈ THEO DÕI)

> Luồng T5, đợt 146, lượt cron 18:35 +07 19/11/2026 (mở 11:35:51Z;
> T5 mở thực tế 11:37:11Z, t5-start 11:37:26Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **BOOT 98a7c93f** (btime 09:54:03Z — **KHỚP brief + khớp
> T7/T9/T10-145**; #109? TẠM theo đếm chặt; reboot #33 e146ca67 →
> 98a7c93f đã xảy ra TRƯỚC khi T5 mở, T5-145 đóng trước reboot nên
> boot này chưa từng được T5 kiểm — đây là lần kiểm đầu tiên của T5).
> Boot replay **CHẠY TỐT, XONG HẲN**: 1545 dòng / 221 installs /
> 462 configure, gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**.
> **KHÔNG cần --repair.** Postboot PASS poll0 + poll1; cờ
> `POSTBOOT_PASS` ghi 11:37:57Z poll=2 — **T4-146 đã đọc cờ này
> mở cửa yên #21** (poll #1 11:39:12Z gate0=T5, pb_age ~45 s).
> **REBOOT #34 GIỮA PHIÊN (98a7c93f → 6fb582df, btime 12:13:26Z)**
> — giết sampler series 1 của T5 ở mẫu 37/40 + vòng chờ sampler
> của T5; boot 98a7c93f sống 2h19m23s (8.363 s). Boot mới
> 6fb582df replay **CHẠY TỐT NHANH NHẤT TỪ TRƯỚC TỚI NAY**:
> 1545/221/462, gói cuối tools 0.2, bracket (boot +37s →
> +2m56s); postboot PASS poll0+poll1+poll0b; cờ `POSTBOOT_PASS`
> mới ghi 12:17:25Z poll=2 (cờ cũ lưu `POSTBOOT_PASS-98a7c93f`).
> **CỬA SỔ GUARD ĐẦU TIÊN (F-146-T5-5): sampler T5 ghi 2 mẫu ≥
> guard 6.144 MiB (11:51:28Z 6.618.252 kB = 105,2% + 11:52:28Z
> 6.596.072 kB = 104,8%) — balloon XẢ HẲN VỀ 0 kB lúc 11:51:28Z;**
> guard-watcher của T9 bắt được 3 mẫu GUARD-OPEN (11:51:06Z /
> 11:52:06Z / 11:53:06Z). T5 KHÔNG tự chạy birefnet (cửa sổ đã
> đóng trước khi T5 phát hiện lúc đối chiếu; việc T9/T10 xác
> nhận có thử birefnet trong cửa sổ hay không).
> **B4 THỰC HÀNH THEO (a)+(b) (quyết parent (h) đợt 145):** (a)
> số đo dpkg.log boot 98a7c93f ĐÓNG BĂNG đã ghi trên workspace bền
> (`dpkg-frozen-98a7c93f.txt`, md5 `266b331e…`, frozen 11:40:46Z);
> (b) ps exact-comm = 0 + pgrep -x apt-get/dpkg = 0 lúc đóng băng.
> KHÔNG có cửa sổ B4 nào được giao đối chiếu đợt này (T4-146 đang
> đo #21; cửa sổ attempt của T4-146 thuộc T4/T10 đối chiếu lúc
> đóng) — thực hành ở đây là ghi bằng chứng (a) sẵn + demo (b).
> **WFS #52 chênh 0** (52 lần liên tiếp). **KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production** (preview.tsx giữ 530e10a7).
> **KHÔNG tự chạy birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 98a7c93f (#109? TẠM, btime 09:54:03Z): REPLAY CHẠY TỐT,
   ĐÃ XONG TRƯỚC KHI T5 MỞ.** dpkg.log **1545 dòng / 221 installs /
   462 configure**, md5 `266b331e…`, mtime 09:58:17Z (boot +4m14s),
   gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**; bracket replay
   (configure 09:54:47Z boot +44s → xong 09:58:17Z boot +4m14s).
   Cache apt **SỐNG qua reboot: 178 .deb / 156M** (y hệt đợt 145).
   Lists **37** (1 mirror azure — như đợt 144; xem §3.5). GST hệ
   thống là **thư mục thật 269/269**; /var/log/apt có (50
   Start-Date, đầu 09:55:26Z). Postboot **PASS ngay poll0
   (11:37:27Z, exit 0)** + poll1 (11:37:57Z).
2. **CỜ POSTBOOT_PASS ghi 11:37:57Z poll=2**
   (`boot_id=98a7c93f-83d3-40e5-8043-ee6dda19c5f1 btime=
   2026-11-19T09:54:03Z pass_at=2026-11-19T11:37:57Z poll=2
   repair=none/replay-full dpkg=1545/221`) — T4-146 đọc cờ này
   (poll #1 11:39:12Z gate0=T5, t5flag=PASS, postboot_exit=0,
   apt=0, dpkg_lines=1545); T5 không kiểm poller T4 đợt này.
3. **REBOOT #34 GIỮA PHIÊN T5** (98a7c93f → 6fb582df, btime
   12:13:26Z — ba nguồn: /proc/stat btime 1795090406 + uptime -s
   12:13:26 + boot_id). Boot 98a7c93f sống **2h19m23s** (09:54:03Z
   → 12:13:26Z = 8.363 s). Sampler series 1 bị giết ở mẫu 37/40
   (mẫu cuối 12:13:29Z — muộn hơn btime boot mới 3 s, nghịch lý
   đồng hồ cùng họ F-145-T9-2); vòng chờ sampler của T5 bị
   SIGTERM cùng lúc (F-146-T5-2). T5 khởi động lại sampler series
   2 trên boot mới 12:14:38Z + kiểm replay boot mới đầy đủ (xem
   §3.9). Khung chết boot 98a7c93f: T5 KHÔNG chốt (sampler chết
   cùng reboot); giao T2-146 merged mù #66.
4. **B4 — THỰC HÀNH THEO (a)+(b), KHÔNG CÓ CỬA SỔ GIAO ĐỐI CHIẾU
   (§3.7).** (a) `dpkg-frozen-98a7c93f.txt` ghi trên workspace bền
   11:40:46Z: 1545 dòng / md5 `266b331e…` / mtime 09:58:17Z — sẵn
   làm bằng chứng thay thế cho mọi đối chiếu kiểu B4 trên boot
   này sau reboot sau. (b) pgrep -x apt-get = 0, pgrep -x dpkg = 0,
   exact-comm apt-get/dpkg/unattended-upgrade = 0 lúc đóng băng
   (F-146-T5-1: grep chuỗi con đếm nhầm 1 — chính shell lệnh của
   T5, đã loại bằng exact-comm). history.log live 50 Start-Date
   09:55:26–09:58:16Z — CHỈ replay boot hiện tại, tái xác nhận
   F-145-T5-1 (reset mỗi reboot) trên boot mới.
5. **RAM SAMPLER — 2 SERIES (n=37 + n=40, xem §5).** Series 1
   (boot 98a7c93f, 11:37:26–12:13:29Z, CẮT NGANG Ở MẪU 37/40 DO
   REBOOT #34): avail 741.048–6.618.252 kB (mean 3.550.407),
   gate A 36/37, max **6.463,1 MiB = 105,2% guard** — **2 mẫu ≥
   guard 6.144 MiB (11:51:28Z + 11:52:28Z), CỬA SỔ GUARD ĐẦU
   TIÊN** (xem §5.3 + F-146-T5-5). Balloon 0–6.082.340 kB
   (mean 2.854.809), **0 mẫu ghim trần 6.443.824 kB** — nhưng
   balloon XẢ HẲN VỀ 0 kB lúc 11:51:28Z (lần đầu ghi được xả
   tuyệt đối). Series 2 (boot 6fb582df, 12:14:38–12:53:38Z,
   n=40 ĐẦY ĐỦ + DONE 12:54:38Z): avail 455.800–2.039.252 kB
   (mean 816.157), gate A chỉ 7/40, max **1.991,5 MiB = 32,4%
   guard**, 0 mẫu ≥ guard; balloon 4.707.932–6.443.824 kB
   (mean 5.870.161), **9/40 mẫu ghim trần** (5 + 4 mẫu liên
   tiếp) — đóng băng trở lại. Hai series đối lập nhau hoàn toàn
   trong cùng một đợt (xem §5.4).
6. **HEADROOM inotify MỞ 879/880 (boot 98a7c93f) → MỞ 784 (boot
   6fb582df, đo 12:17Z, trần 63747)** — xem §6.1. Cả hai đều
   **DƯỚI ngưỡng báo user (< ~1.800), lần thứ 6 liên tiếp**;
   tỉ lệ/vite ~0,56 (boot 1) → ~0,50 (boot 2). Theo quyết
   parent (k) đợt 144: **chỉ theo dõi, không báo riêng**. Caveat:
   trần inotify ĐỔI 63756 (boot 98a7c93f) → 63747 (boot 6fb582df)
   — trần không ổn định giữa các boot (F-145-T9-4 tái hiện);
   fd cell-visible biến động 429 → 385 → 483 → 315 trong phiên
   (xem F-146-T5-4).
7. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
    **2c384ed1**, vite.config.ts **ee80d093** (mở = lúc đóng);
    postboot script sửa 1 lần (`3299e2c4…` → **`6e20b0ed…`**,
    chỉ dòng `say`, KHÔNG đổi logic — xem §3.8).
8. **EPERM (T2-146, T5 chỉ đối chiếu): probe #65 ok=2 fail=0,
    boot=98a7c93f, 11:39:18Z**; log probe 187 dòng (184 sau #64 +
    3 đúng prereg: DEAD + boot-changed + #65). **WFS scan #52:
    chênh 0** — NEWSTD 966/273, R7b 991/290, copies 25/17; delta
    +1/+1 giải thích trọn vẹn bằng 1 dòng mới của file LIMITS
    T5-145 (xem §7.3). **Async `.writeFile(`: đúng 2 helper đã
    biết, 0 stray.**
9. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
10. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 2 boot trong phiên (reboot #33 trước khi mở, reboot #34 giữa phiên)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 98a7c93f (#109? TẠM — đếm chặt, quyết parent đợt 145) | 09:54:03 (uptime -s; /proc/stat btime 1795082043; who -b 09:54; /proc/1 09:54:19 +16s) | 2h19m23s (8.363 s) → chết bởi reboot #34 | Replay CHẠY TỐT, xong boot +4m14s (1545/221, gói cuối tools 0.2); postboot PASS poll0+poll1; cờ 11:37:57Z poll=2; T4-146 mở cửa #21 bằng cờ này; KHÔNG cần repair; sampler series 1 cắt ngang 37/40 do reboot; **cửa sổ guard đầu tiên 11:51:28–11:52:28Z (2 mẫu ≥ guard)** |
| 2 | 6fb582df (#110? TẠM — đếm chặt) | 12:13:26 (uptime -s; /proc/stat btime 1795090406; /proc/1 12:13:42 +16s) | còn sống (lúc T5 đóng ~42' tuổi) | Replay CHẠY TỐT NHANH NHẤT, xong boot +2m56s (1545/221, gói cuối tools 0.2); postboot PASS poll0+poll1+poll0b+poll2; cờ mới 12:17:25Z poll=2; KHÔNG cần repair; sampler series 2 n=40 đầy đủ; balloon ghim trần 9/40 mẫu |

- **Btime boot 1 KHỚP brief** (09:54:03Z, 4 nguồn + khớp T7-145/
  T9-145/T10-145: btime_epoch 1795082043; T2-146 boot-verify.txt
  riêng). **Btime boot 2: 12:13:26Z** (3 nguồn lúc 12:14:09Z +
  T9-146 đối chiếu — xem §10).
- **Boot tiền nhiệm e146ca67 sống 1h57m47s** (07:56:16Z →
  09:54:03Z = 7.067 s). Khung chết boot e146ca67: giao T2-146
  merged mù #65 (đã mở, probe #65 11:39:18Z). **Khung chết boot
  98a7c93f (reboot #34): T5 KHÔNG chốt** (sampler chết cùng
  reboot, mẫu cuối 12:13:29Z muộn hơn btime boot mới 3 s — nghịch
  lý đồng hồ cùng họ F-145-T9-2); giao T2-146 merged mù #66.
- Đánh số theo **đếm chặt**: 98a7c93f = #109?, 6fb582df = #110?.
  Chuỗi INSIDE: T5 không tự đếm (việc T2/T6); T2-146 xác nhận
  chính thức bằng probe #65/#66 + merged mù #65/#66.

## 3. dpkg replay — CHẠY TỐT, KHÔNG cần repair; thực hành B4 (a)+(b)

### 3.1 Replay boot 98a7c93f — xong trước khi T5 mở

| Hạng mục | Lúc mở (11:37–11:41Z) |
|---|---|
| dpkg.log dòng | 1545 |
| `status installed` | 221 |
| dòng chứa `configure` | 462 |
| dpkg.log md5 | `266b331e…` (đóng băng 11:40:46Z; file live đã reset theo reboot #34 — số đo trên workspace bền là bằng chứng (a)) |
| dpkg.log mtime | 09:58:17Z (boot +4m14s) |
| startup configure đầu | 09:54:47Z (boot +44s) |
| cài thật | 09:55:27–09:58:17Z (install đầu libaspell15 09:55:27Z) |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (09:58:17Z) |
| cache apt | 178 .deb / 156M (SỐNG qua reboot — xem §3.5) |
| lists / partial | 37 / 0 (1 mirror — xem §3.5) |
| GST hệ thống / debroot | thư mục THẬT 269 file / 269 |
| /var/log/apt | có (history.log 50 Start-Date, đầu 09:55:26Z) |
| proc apt/dpkg/wrapper | 0 |
| postboot check | PASS exit 0 (poll0 11:37:27Z + poll1 11:37:57Z; poll2 boot 1 KHÔNG chạy — reboot #34 xảy ra trước khi T5 chạy poll2; cờ boot 1 đứng vững qua poll0+poll1 và được T4 đọc 2 lần 11:39:12Z + 11:41:11Z) |

- Bracket replay: **(boot +44s, boot +4m14s]** — ngang boot 2 đợt
  144 (+4m15s) và đúng số T9-145 ghi lúc 09:58:17Z (boot +4m14s).
  KHÔNG có GAP kiểu đợt 140 boot 1 (805 s). Cài từ cache là chính
  (178 .deb / 156M sống qua reboot; replay dùng `--no-download`
  theo mẫu các đợt).
- **KHÔNG cần watcher** (replay đã xong trước khi T5 mở),
  **KHÔNG kích hoạt luật (C)** — (C) chỉ dành cho replay KẸT khi
  postboot FAIL. **KHÔNG chạy --repair** (không có gì để sửa).
- fontconfig trong dpkg.log boot này: `status triggers-pending
  fontconfig:amd64 2.15.0-1.1ubuntu2` lúc **09:56:26Z** — đúng
  **1m51s trước** dòng gói cuối (09:58:17Z); cùng mẫu như boot
  e146ca67 (1m39s trước) và 691a7403 (3 phút trước) — củng cố
  thêm kết luận thread gstreamer "3 phiên bản" đã đóng ở đợt 144
  (fontconfig 1.1ubuntu2 xuất hiện sát dòng gói cuối trên mọi
  replay đầy đủ gần đây, dễ gây ghi nhầm).

### 3.2 Cờ POSTBOOT_PASS

| Boot | Cờ ghi (Z) | poll | Nội dung |
|---|---|---|---|
| 98a7c93f | 11:37:57 | 2 | `boot_id=98a7c93f-83d3-40e5-8043-ee6dda19c5f1 btime=2026-11-19T09:54:03Z pass_at=2026-11-19T11:37:57Z poll=2 repair=none/replay-full dpkg=1545/221` |

- Cờ ghi sau 2 poll PASS (poll0 11:37:27Z + poll1 11:37:57Z),
  theo đúng mẫu các đợt. Poll2 boot 1 KHÔNG chạy (reboot #34
  xảy ra trước khi T5 chạy poll2); cờ boot 1 đứng vững qua
  poll0+poll1 và được T4 đọc 2 lần (11:39:12Z + 11:41:11Z); cờ
  mới boot 2 ghi 12:17:25Z poll=2 (xem §3.9).
- T4-146 mở cửa yên #21 bằng cờ T5 này (poll #1 11:39:12Z
  gate0=T5, t5flag=PASS, postboot_exit=0, apt=0, dpkg_lines=1545;
  poll #2 11:41:11Z cùng cờ) — T5 không kiểm poller T4 đợt này;
  T10 đối chiếu khi gộp.

### 3.3 Trạng thái sau replay (replay đầy đủ, KHÔNG phải repair-1-phần)

| Hạng mục | Lúc mở | Lúc đóng băng 11:40:46Z |
|---|---|---|
| dpkg.log dòng / installs / configure | 1545 / 221 / 462 | 1545 / 221 / 462 (md5 `266b331e…` không đổi) |
| dpkg.log mtime (gói cuối) | 09:58:17Z | 09:58:17Z (không đổi) |
| cache apt | 178 .deb / 156M | 178 .deb / 156M (không đổi) |
| lists / partial | 37 / 0 | 37 / 0 (không đổi) |
| GST hệ thống | thư mục THẬT 269 | thư mục THẬT 269 |
| proc apt/dpkg/wrapper | 0 | 0 |
| postboot check | PASS poll0+poll1 | PASS poll0+poll1 (poll2 không chạy — reboot #34) |

- Số liệu **TRÙNG bracket replay đầy đủ chuẩn** (1545/221/462 —
  như #94?/#96?/2c0efe57/691a7403/cc222c8a/e146ca67) — khác hẳn
  bracket repair-1-phần 795/113 của đợt 140 boot 2 / 142 / 143.
  Đây là replay đầy đủ thứ 5 liên tiếp (691a7403, cc222c8a,
  e146ca67, 98a7c93f, 6fb582df) sau 3 lần chết dạng (B) trong 4 đợt gần nhất.

### 3.4 So sánh replay các đợt gần nhất (bracket đầy đủ)

| Boot | Đợt | Bracket (configure → xong) | Gói cuối |
|---|---|---|---|
| 17db9652 (#94?) | 137 boot 2 / 138 | +49s → +6m05s | tools 1ubuntu0.1 |
| 541524e2 (#96?) | 139 | +31s → +3m52s | tools 1ubuntu0.1 |
| 2c0efe57 | 141 | +31s → +3m57s | tools 1ubuntu0.1 |
| 691a7403 (#106?) | 144 boot 1 | +34s → +4m53s | tools **1ubuntu0.2** |
| cc222c8a (#107?) | 144 boot 2 | +48s → +4m15s | tools **1ubuntu0.2** |
| e146ca67 (#108?) | 145 | +43s → +3m53s | tools **1ubuntu0.2** |
| 98a7c93f (#109?) | 146 | +44s → +4m14s | tools **1ubuntu0.2** |
| 6fb582df (#110?) | 146 boot 2 | +37s → **+2m56s** | tools **1ubuntu0.2** |

- Boot 6fb582df là **replay NHANH NHẤT từ trước tới nay**
  (+2m56s — nhanh hơn kỷ lục cũ #96? +3m52s đúng 56 s), nhờ
  cache sống 178 .deb.
- Boot 98a7c93f thuộc nhóm replay NHANH (dưới 4m30s wall-clock,
  không GAP), nhờ cache sống 178 .deb.
- Gstreamer tools **1.24.2-1ubuntu0.2** lần thứ 4 liên tiếp theo
  đợt (đợt 143/144/145/146), tương ứng 6 boot liên tiếp cài tools
  0.2; madison hiện tại (đo 11:37Z, 1 mirror
  azure) vẫn chỉ có 0.2 (updates + security) và 1.24.2-1 (main);
  **0.1 đã biến mất, 1.1ubuntu2 không tồn tại** — thread "3 phiên
  bản" vẫn đóng (xem §3.6 đợt 145).

### 3.5 Cache + lists

- **Cache 178 .deb / 156M (y hệt đợt 145).** Sống qua reboot #33.
  F-141-T5-4 giữ nguyên: sống/không sống là KHÔNG NHẤT QUÁN
  (đợt 142/143: 0 .deb; đợt 139/145/146: 178). Không ảnh hưởng
  replay (đủ 221 installs, xong +4m14s).
- **Lists 37 (đợt 145: 71; đợt 144: 37/39).** Chỉ 1 mirror
  (azure.archive.ubuntu.com) hiện diện trong lists đợt này — cùng
  mẫu đợt 144 (1 mirror). Đợt 145 có 71 vì apt-get update chạm cả
  2 mirror. Số 37 KHÔNG phải lỗi: đếm tổng entry
  `ls /var/lib/apt/lists/ | wc -l`, kèm breakdown theo mirror
  (xem §3.5 đợt 145).
- Partial 0 cả lúc mở lẫn lúc đóng.

### 3.6 Gstreamer — thread "3 phiên bản" VẪN ĐÓNG (kiểm lại)

| Nguồn kiểm | Kết quả |
|---|---|
| dpkg.log boot 98a7c93f (đọc trực tiếp) | `install gstreamer1.0-tools:amd64 <none> 1.24.2-1ubuntu0.2` lúc 09:58:17Z; `status installed` cùng version |
| `apt-cache madison gstreamer1.0-tools` (đo 11:37Z, 1 mirror azure) | Chỉ 2 version: **1.24.2-1ubuntu0.2** (noble-updates + noble-security) và **1.24.2-1** (noble/main). **0.1 ĐÃ BIẾN MẤT; 1.1ubuntu2 KHÔNG TỒN TẠI** |
| `apt-cache madison fontconfig` | **fontconfig 2.15.0-1.1ubuntu2 CÓ THẬT** |
| dpkg.log boot 98a7c93f — fontconfig | `status triggers-pending fontconfig:amd64 2.15.0-1.1ubuntu2` lúc **09:56:26Z** — 1m51s trước dòng gói cuối |
| Các gói GST khác trong dpkg.log boot 98a7c93f | Không đối chiếu riêng lúc mở (chỉ đối chiếu boot 2 — xem §3.9; hai boot cùng tập 221 package từ cùng cache 178 .deb) |

- **Kết luận: không có gì mới — chuỗi thật vẫn 0.1 → 0.2, thread
  ĐÓNG từ đợt 144.** Boot thứ 5 liên tiếp cài tools 0.2 (theo
  cách đếm boot của §3.6 đợt 145: từ boot 691a7403).
  Fontconfig 1.1ubuntu2 lại xuất hiện sát dòng gói cuối (1m51s
  trước) — mẫu nhầm lẫn tái hiện lần thứ 4.

### 3.7 Thực hành đối chiếu B4 theo (a)+(b) — quyết parent (h) đợt 145

> Quyết parent (h) đợt 145 cập nhật quyết (j) đợt 144: bằng chứng
> thay thế đáng tin cho đối chiếu kiểu B4 là (a) số đo dpkg.log
> đóng băng trên workspace bền + (b) ps exact-comm của T4 trong
> cửa sổ. **Đợt 146 KHÔNG có cửa sổ B4 nào được giao cho T5 đối
> chiếu** (T4-146 đang đo lượt yên #21; cửa sổ attempt của T4-146
> thuộc T4/T10 đối chiếu lúc đóng). Thực hành đợt này:

| Bằng chứng | Nội dung | Sức nặng |
|---|---|---|
| (a) dpkg.log boot 98a7c93f ĐÓNG BĂNG (T5-146, ghi trên workspace bền) | `dpkg-frozen-98a7c93f.txt` (frozen 11:40:46Z): 1545 dòng / 221 installs / 462 configure / md5 `266b331e804f4790ba27fd5f301e4abd` / mtime 09:58:17Z / gói cuối tools 0.2 / history 50 Start-Date — sẵn làm bằng chứng thay thế cho mọi đối chiếu kiểu B4 trên boot này sau reboot sau | **SẴN SÀNG** — đúng mẫu bằng chứng (1) của T5-145 §3.7 cho boot cc222c8a |
| (b) ps exact-comm lúc đóng băng (11:40:46Z) | `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0, exact-comm apt-get/dpkg/unattended-upgrade = 0 trong `ps -eo comm` | **DEMO ĐÚNG PHƯƠNG PHÁP** — cùng phương pháp T4-144 §6.1 |
| (c) history.log live hiện tại | 50 Start-Date, TẤT CẢ trong 09:55:26–09:58:16Z (replay boot 98a7c93f); **0 entry boot cũ** | **TÁI XÁC NHẬN F-145-T5-1** trên boot mới: history.log reset mỗi reboot, KHÔNG dùng làm bằng chứng thay thế được |
| (d) os-intent state | `dpkg-state.txt` mtime 09:58 (ghi lại cuối replay boot này); `ledger.jsonl` mtime 04:00:40Z — vẫn 1 snapshot compacted duy nhất (ts 03:13:53Z), không có timing theo boot | Nhất quán với F-145-T5-1: ledger không dùng đối chiếu cửa sổ thời gian được |

- **F-146-T5-1 (grep chuỗi con tự đếm chính shell lệnh — xem
  §11):** `ps aux | grep -E '[a]pt-get|[d]pkg'` đếm 1 — chính là
  shell `/bin/bash -c` chứa chuỗi pattern trong dòng lệnh của nó;
  `ps -eo comm` exact + pgrep -x đều = 0. Cùng họ với F-145-T4-2.
  Bài học: đối chiếu (b) CHỈ dùng exact-comm/pgrep -x, không
  dùng grep chuỗi con trên ps aux.
- **Caveat còn lại (nhỏ, không đổi kết luận):** `apt-get update`
  (không cài) sẽ không để lại dấu trong dpkg.log — nhưng 0 proc
  apt nào được quan sát lúc đóng băng; pha update của replay chạy
  lúc đầu boot, không phải 11:40Z.
- **T5-146 ghi nhận để parent/T10 xét:** thực hành (a)+(b) đã làm
  đúng cho boot 98a7c93f; nếu T4-146 có attempt nào bị B4 đánh
  VI PHẠM, T10/T5-147 đối chiếu bằng file đóng băng này + ps
  exact-comm của T4 trong cửa sổ đó.

### 3.8 Postboot script — sửa 1 lần (dòng `say`, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`3299e2c4…` (cuối đợt 145) → **`6e20b0ed…`** (sau sửa 12:17Z):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 12:17Z | 6fb582df | `3299e2c4…` → `6e20b0ed…` | dòng `say` boot (DOT 146, boot 98a7c93f → 6fb582df reboot #34, btime 12:13:26Z, #110?, replay +2m56s nhanh nhất, tools 0.2, cache 178, lists 71 = 2 mirror, cờ mới 12:17:25Z poll=2, B4 (a)+(b), headroom mở 879/880) — KHÔNG đổi logic |

- `bash -n` OK sau khi sửa. Check poll0b chạy lại sau khi sửa
  (exit 0 lúc 12:17:40Z) — cùng kết quả như trước sửa, chứng minh
  sửa dòng `say` không ảnh hưởng logic.
- Số liệu trong dòng `say` viết đúng số đã đo TRƯỚC khi chạy
  poll0b (không lặp lại F-142-T5-1).

### 3.9 Replay boot 6fb582df (boot 2 — sau reboot #34) — CHẠY TỐT NHANH NHẤT

| Hạng mục | Boot 2 (đo 12:14–12:17Z) |
|---|---|
| dpkg.log dòng / installs / configure | 1545 / 221 / 462 |
| dpkg.log md5 | `d2b2e788…` (đóng băng 12:17:46Z, không đổi tới lúc đóng 12:55:07Z) |
| dpkg.log mtime | 12:16:22Z (boot +2m56s) |
| startup configure đầu | 12:14:03Z (boot +37s) |
| cài thật | 12:14:46–12:16:22Z (install đầu libaspell15 12:14:46Z) |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (12:16:22Z) |
| cache apt | 178 .deb / 156M (SỐNG qua reboot #34) |
| lists / partial | 71 / 0 (2 mirror — như đợt 145) |
| GST hệ thống / debroot | thư mục THẬT 269 file / 269 |
| /var/log/apt | có (history.log 50 Start-Date, 12:14:46–12:16:22Z) |
| proc apt/dpkg/wrapper | 0 (lúc đóng băng 12:17:46Z) |
| postboot check | PASS exit 0 (poll0 12:17:20Z + poll1 12:17:25Z + poll0b 12:17:40Z + poll2 12:55:07Z) |

- Bracket replay: **(boot +37s, boot +2m56s]** — **NHANH NHẤT từ
  trước tới nay** (kỷ lục cũ #96? +3m52s). T5 theo dõi trực tiếp
  dpkg.log tăng 2 → 358 (12:15:05Z) → 800 (12:15:35Z) → 1397
  (12:16:05Z) → 1545 (12:16:35Z, ổn định qua recheck 12:17:05Z).
  **KHÔNG cần watcher dài / luật (C) / --repair.**
- Cờ POSTBOOT_PASS mới ghi **12:17:25Z poll=2**
  (`boot_id=6fb582df-455d-47cd-99dc-8bef48018536 btime=
  2026-11-19T12:13:26Z pass_at=2026-11-19T12:17:25Z poll=2
  repair=none/replay-full dpkg=1545/221`); cờ cũ boot 98a7c93f
  lưu nguyên tại `POSTBOOT_PASS-98a7c93f` (pass_at 11:37:57Z).
- Postboot script sửa 1 lần đợt này (`3299e2c4…` →
  **`6e20b0ed…`**, chỉ dòng `say` DOT 146 / boot 6fb582df +
  reboot #34 + replay +2m56s + B4 (a)+(b) + headroom mở 879/880,
  KHÔNG đổi logic — xem §3.8; `bash -n` OK + poll0b exit 0 sau
  sửa).
- Gstreamer boot 2: tools 0.2 lần thứ 5 liên tiếp; gl/base/x
  **1.24.2-1ubuntu0.7**, bad **1.24.2-1ubuntu4**, good
  **1.24.2-1ubuntu1.8**, libav/ugly **1.24.1-1build1**,
  libgstreamer1.0-0 **1.24.2-1ubuntu0.2** — y hệt boot 1.
  Fontconfig 1.1ubuntu2 triggers-pending 12:15:18Z — 1m04s trước
  dòng gói cuối (mẫu nhầm lẫn tái hiện lần thứ 5).
- **B4 thực hành (a) cho boot 2:** `dpkg-frozen-6fb582df.txt`
  (frozen 12:17:46Z): 1545 dòng / md5 `d2b2e788…` / mtime
  12:16:22Z / gói cuối tools 0.2 / history 50 Start-Date — sẵn
  làm bằng chứng thay thế cho mọi đối chiếu kiểu B4 trên boot
  này sau reboot sau. (b) pgrep -x apt-get = 0, pgrep -x dpkg = 0
  lúc đóng băng.
- history.log live boot 2: 50 Start-Date 12:14:46–12:16:22Z —
  CHỈ replay boot hiện tại, tái xác nhận F-145-T5-1 lần thứ 2
  trong đợt này (reset mỗi reboot).

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng + postboot script

| File | Lúc mở 11:37Z | Lúc đóng 12:55Z | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 3299e2c4… | 6e20b0ed… (sau sửa 1 lần) | chỉ dòng `say`, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 2 SERIES (n=37 CẮT NGANG + n=40 [CHỜ])

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup, đường
> dẫn tuyệt đối (script copy từ round145-t5, OUT đã sửa
> round146-t5 TRƯỚC khi chạy — kiểm bằng grep, không lặp lại
> F-138-T5-1). **2 series** (reboot #34 giữa phiên — như đợt 144).

### 5.1 Series 1 — boot 98a7c93f, n=37 CẮT NGANG (11:37:26–12:13:29Z, thiếu 3 mẫu cuối do reboot #34)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 11:37:26 | 741.048 | 6.082.340 | 1,84 |
| 2 | 11:38:26 | 1.532.144 | 5.069.268 | 3,16 |
| 3 | 11:39:27 | 1.650.932 | 4.642.200 | 2,18 |
| 4 | 11:40:27 | 1.343.436 | 4.498.264 | 1,11 |
| 5 | 11:41:27 | 1.108.596 | 4.630.400 | 9,96 |
| 6 | 11:42:27 | 1.853.804 | 4.318.524 | 14,04 |
| 7 | 11:43:27 | 1.571.668 | 4.051.096 | 15,59 |
| 8 | 11:44:28 | 2.062.164 | 3.808.072 | 11,21 |
| 9 | 11:45:28 | 3.260.144 | 3.169.008 | 5,44 |
| 10 | 11:46:28 | 2.943.668 | 2.661.292 | 6,28 |
| 11 | 11:47:28 | 5.539.924 | 1.088.428 | 4,63 |
| 12 | 11:48:28 | 5.992.072 | 675.012 | 3,89 |
| 13 | 11:49:28 | 5.694.612 | 827.540 | 3,74 |
| 14 | 11:50:28 | 6.173.100 | 434.324 | 3,52 |
| 15 | **11:51:28** | **6.618.252** | **0** | 5,05 |
| 16 | **11:52:28** | **6.596.072** | 131.072 | 2,83 |
| 17 | 11:53:28 | 6.182.992 | 524.216 | 1,54 |
| 18 | 11:54:28 | 5.762.828 | 917.052 | 1,63 |
| 19 | 11:55:28 | 5.482.256 | 1.309.756 | 1,29 |
| 20 | 11:56:28 | 5.116.992 | 1.702.888 | 0,82 |
| 21 | 11:57:28 | 4.704.648 | 2.090.724 | 0,71 |
| 22 | 11:58:28 | 4.316.488 | 2.483.524 | 0,67 |
| 23 | 11:59:28 | 3.229.720 | 2.863.444 | 1,39 |
| 24 | 12:00:28 | 2.732.736 | 3.194.100 | 2,18 |
| 25 | 12:01:29 | 2.985.032 | 3.504.912 | 2,02 |
| 26 | 12:02:29 | 2.696.056 | 3.823.464 | 0,80 |
| 27 | 12:03:29 | 2.752.396 | 3.839.712 | 1,05 |
| 28 | 12:04:29 | 4.543.384 | 2.266.848 | 1,14 |
| 29 | 12:05:29 | 4.133.112 | 2.660.064 | 0,94 |
| 30 | 12:06:29 | 3.537.000 | 3.053.280 | 0,50 |
| 31 | 12:07:29 | 2.568.572 | 3.376.640 | 2,97 |
| 32 | 12:08:29 | 2.694.856 | 3.651.616 | 4,21 |
| 33 | 12:09:29 | 2.616.960 | 3.953.204 | 1,54 |
| 34 | 12:10:29 | 2.238.128 | 4.236.380 | 0,65 |
| 35 | 12:11:29 | 3.033.520 | 3.056.732 | 0,69 |
| 36 | 12:12:29 | 2.609.028 | 3.375.048 | 1,02 |
| 37 | 12:13:29 | 2.746.724 | 3.657.524 | 1,35 |

- Thống kê (tính bằng code trên 37 mẫu): min avail **741.048 kB
  lúc 11:37:26Z**; max **6.618.252 kB lúc 11:51:28Z = 6.463,1 MiB
  = 105,2% guard**; trung bình 3.550.407 kB; Balloon min **0 kB
  lúc 11:51:28Z**, max **6.082.340 kB lúc 11:37:26Z**, trung bình
  2.854.809 kB; **0 mẫu ghim trần 6.443.824 kB**. Gate A
  (≥1.048.576 kB): **36/37 mẫu** (chỉ mẫu 1 dưới gate). Load1
  0,50–15,59 (cao 11:41–11:44Z: T4/T8 chạy harness + vite).
- **Hình dạng: xả sâu kỷ lục rồi phình lại.** Balloon xả đơn điệu
  11:37–11:51Z (6,08M → 0), avail vọt lên đỉnh series 6,62M
  (**vượt guard**), rồi phình lại đơn điệu 11:52–12:03Z (balloon
  0,13M → 3,84M, avail rơi về ~2,7M); xả nhỏ lúc 12:04:29Z
  (avail về 4,54M, balloon về 2,27M) rồi phình lại tới khi
  reboot giết sampler. Lúc sampler chết (12:13:29Z, mẫu cuối):
  avail **2.746.724 kB**, balloon **3.657.524 kB**.
- Mẫu 37 (12:13:29Z) muộn hơn btime boot mới 12:13:26Z đúng 3 s
  — nghịch lý đồng hồ cùng họ F-145-T9-2 (đồng hồ cũ chạy nhanh
  hơn đồng hồ mới ~3 s tại thời điểm reboot); ghi nhận, không
  dùng mẫu này chốt khung chết (xem §2).

### 5.2 Balloon — 0 mẫu ghim trần NHƯNG xả hẳn về 0 (lần đầu)

- **0/37 mẫu ghim trần kẹt 6.443.824 kB trong series 1** — đợt
  thứ 3 liên tiếp sampler T5 ghi 0 mẫu ghim (đợt 144: 0/53;
  đợt 145: 0/40). NHƯNG lần này balloon không chỉ "không ghim"
  mà **XẢ HẲN VỀ 0 kB lúc 11:51:28Z** — lần đầu tiên ghi được
  balloon = 0 trong toàn bộ chuỗi T5/T9 (trước đây chỉ thấy xả
  sâu nhất ~2,88M đợt 145, ~3,49M đợt 144). Đây là cực đối diện
  của đóng băng: balloon vừa có thể kẹt trần 6.443.824 kB nhiều
  đợt, vừa có thể xả về 0 trong một đợt.
- T5 KHÔNG kết luận "đóng băng đã hết" từ 1 series: series 2 +
  sampler dài của T9 là chuẩn dài hạn (xem §5.5).

### 5.3 CỬA SỔ GUARD ĐẦU TIÊN — 2 mẫu ≥ 6.144 MiB (F-146-T5-5)

- **2 mẫu ≥ guard 6.291.456 kB (6.144 MiB): #15 11:51:28Z
  6.618.252 kB (105,2% guard) + #16 11:52:28Z 6.596.072 kB
  (104,8% guard).** Đây là **lần đầu tiên trong toàn bộ chuỗi
  T5** một sampler ghi được mẫu vượt guard (đỉnh cũ cao nhất:
  63,8% guard đợt 145; T9-145: 61,41%). Cửa sổ bị kẹp giữa 2 mẫu
  dưới guard: #14 11:50:28Z (6.173.100 kB, thiếu 118.356 kB) và
  #17 11:53:28Z (6.182.992 kB, thiếu 108.464 kB) — cửa sổ dài
  **ít nhất 60 s (11:51:28–11:52:28Z), tối đa ~180 s
  (11:50:28–11:53:28Z)**.
- **Đối chiếu độc lập T9 (guard-watcher): BẮT ĐƯỢC CỬA SỔ.**
  `guard-open.flag` của T9-146 ghi **3 mẫu GUARD-OPEN**:
  11:51:06Z mem=6.587.692 + 11:52:06Z mem=6.752.292 +
  11:53:06Z mem=6.316.928 (cadence 60 s, lệch pha ~22 s so với
  sampler T5). Hai sampler độc lập khớp nhau: cửa sổ guard tồn
  tại ít nhất 11:51:06–11:53:06Z (120 s liên tục ≥ guard theo
  T9). **T5 KHÔNG tự chạy birefnet** — cửa sổ đã đóng trước khi
  T5 phát hiện lúc đối chiếu (avail lúc đóng series 1 chỉ
  ~2,7M); **việc T9/T10 xác nhận có thử birefnet trong cửa sổ
  hay không** (b2-watcher của T9 vẫn chạy lúc T5 kiểm 12:18Z;
  T5 không đụng quy trình của T9).
- Hệ quả cho quy trình đứng: guard 6.144 MiB GIỮ NGUYÊN; cửa sổ
  guard CÓ THẬT nhưng ngắn (~2–3 phút) và hiếm (lần đầu sau
  146 đợt) — guard-watcher của T9 là đúng công cụ bắt nó; T5
  ghi nhận để parent/T10 xét có đổi gì về quy trình bắt cửa sổ
  không (T5 không tự đổi).

### 5.4 Series 2 — boot 6fb582df, n=40 ĐẦY ĐỦ (12:14:38–12:53:38Z + DONE 12:54:38Z)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 12:14:38 | 1.840.164 | 4.968.852 | 2,68 |
| 2 | 12:15:38 | 1.192.812 | 4.707.932 | 3,55 |
| 3 | 12:16:38 | 2.039.252 | 4.867.048 | 2,45 |
| 4 | 12:17:38 | 1.816.708 | 5.088.780 | 1,03 |
| 5 | 12:18:38 | 1.571.432 | 5.290.308 | 0,83 |
| 6 | 12:19:38 | 1.350.976 | 5.469.756 | 2,08 |
| 7 | 12:20:38 | 959.192 | 5.252.708 | 1,73 |
| 8 | 12:21:38 | 903.488 | 5.404.228 | 1,29 |
| 9 | 12:22:38 | 801.672 | 5.523.344 | 2,65 |
| 10 | 12:23:38 | 664.844 | 5.655.632 | 1,41 |
| 11 | 12:24:38 | 581.840 | 5.752.288 | 1,62 |
| 12 | 12:25:38 | 598.056 | 5.844.416 | 1,67 |
| 13 | 12:26:38 | 550.832 | 5.935.160 | 0,83 |
| 14 | 12:27:38 | 916.128 | 6.034.272 | 0,36 |
| 15 | 12:28:38 | 535.460 | 5.653.128 | 1,22 |
| 16 | 12:29:38 | 731.384 | 5.509.100 | 1,35 |
| 17 | 12:30:38 | 455.800 | 5.610.204 | 1,92 |
| 18 | 12:31:38 | 755.004 | 5.429.596 | 2,11 |
| 19 | 12:32:38 | 565.064 | 5.507.040 | 1,63 |
| 20 | 12:33:38 | 657.832 | 5.611.184 | 1,40 |
| 21 | 12:34:38 | 551.708 | 5.730.544 | 0,80 |
| 22 | 12:35:38 | 1.069.572 | 5.861.736 | 0,45 |
| 23 | 12:36:38 | 950.904 | 5.994.100 | 0,32 |
| 24 | 12:37:38 | 853.652 | 6.113.684 | 0,18 |
| 25 | 12:38:38 | 769.604 | 6.226.672 | 0,06 |
| 26 | 12:39:38 | 680.912 | 6.331.264 | 0,02 |
| 27 | 12:40:38 | 586.344 | 6.426.456 | 0,13 |
| 28 | **12:41:38** | 579.000 | **6.443.824** | 0,04 |
| 29 | **12:42:38** | 557.276 | **6.443.824** | 0,15 |
| 30 | **12:43:38** | 537.172 | **6.443.824** | 0,13 |
| 31 | **12:44:38** | 527.888 | **6.443.824** | 0,64 |
| 32 | **12:45:38** | 510.820 | **6.443.824** | 0,68 |
| 33 | 12:46:38 | 847.136 | 6.090.516 | 0,43 |
| 34 | 12:47:38 | 749.100 | 6.205.576 | 0,15 |
| 35 | 12:48:38 | 670.980 | 6.309.832 | 0,16 |
| 36 | 12:49:38 | 581.276 | 6.406.700 | 0,10 |
| 37 | **12:50:38** | 541.580 | **6.443.824** | 0,10 |
| 38 | **12:51:38** | 541.196 | **6.443.824** | 0,03 |
| 39 | **12:52:38** | 530.392 | **6.443.824** | 0,12 |
| 40 | **12:53:38** | 521.852 | **6.443.824** | 0,04 |

- Thống kê (tính bằng code trên 40 mẫu): min avail **455.800 kB
  lúc 12:30:38Z**; max **2.039.252 kB lúc 12:16:38Z = 1.991,5
  MiB = 32,4% guard**; trung bình 816.157 kB; Balloon min
  **4.707.932 kB lúc 12:15:38Z**, max **6.443.824 kB**, trung bình
  5.870.161 kB; **9/40 mẫu ghim trần 6.443.824 kB** (5 mẫu liên
  tiếp 12:41:38–12:45:38Z + 4 mẫu liên tiếp 12:50:38–12:53:38Z).
  Gate A (≥1.048.576 kB): **chỉ 7/40 mẫu** (33/40 mẫu dưới gate).
  Load1 0,02–3,55 (rất lặng từ 12:35Z trở đi: 0,02–0,68 — T4/T8
  đã đóng, không còn tải đo).
- **Hình dạng: phình đơn điệu tới trần rồi ghim — ĐÓNG BĂNG TRỞ
  LẠI.** Balloon phình gần như đơn điệu 12:14–12:41Z (4,71M →
  6,44M), ghim trần 5 mẫu, xả nhẹ 1 mẫu (12:46:38Z về 6,09M)
  rồi phình lại tới trần và ghim 4 mẫu cuối. Avail dao động
  455–2.039k, không lần nào vượt 2.039.252 kB (32,4% guard).
  **0 mẫu ≥ guard series 2.** Lúc đóng (12:55:07Z, ngoài
  series): avail **469.472 kB**, balloon **6.443.824 kB (ghim)**.
- **Đối lập hai series trong cùng một đợt:** series 1 balloon xả
  hẳn về 0 + 2 mẫu vượt guard; series 2 balloon ghim trần 9/40
  mẫu + avail trung bình chỉ 816k (thấp nhất nhiều đợt). Cùng
  một VM, hai boot liên tiếp cho hai cực đối diện của balloon —
  balloon KHÔNG có trạng thái "bình thường" ổn định; T5 ghi
  nhận để T9/T10 đối chiếu với sampler dài của T9.

### 5.5 Birefnet / u2net — kiểm tra tình trạng theo quy trình đứng

- **Birefnet: KHÔNG thử bởi T5** (brief loại trừ; việc của T9
  theo quyết §12.3(f) đợt 137). **Cửa sổ guard đầu tiên đã mở
  11:51–11:53Z (xem §5.3)** — T9 guard-watcher bắt được 3 mẫu;
  T9/T10 xác nhận có thử birefnet trong cửa sổ hay không. T5
  không chạy thử thêm (cửa sổ đã đóng; RAM lúc đóng series 1
  ~2,7M, xa guard).
- **u2net (fallback chính thức) — sẵn sàng trên đĩa:** rembg
  **2.0.87** trong `server/bgremove/.venv` (có `bin/rembg` +
  `import rembg` chạy được trong venv, in đúng version — kiểm
  11:46:51Z, import chậm ~5 phút do load model lần đầu trong
  phiên); `~/.u2net` có `u2net.onnx`, `u2netp/`,
  `birefnet-general.onnx`, `models/` 218M (gồm
  `birefnet-general-lite/`). T5 KHÔNG chạy thử u2net (không thuộc
  brief; chỉ kiểm sự hiện diện).
- Guard **6.144 MiB GIỮ NGUYÊN** (quyết §12.3(d) đợt 138 + quyết
  (n) đợt 144).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63756) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 6 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 141 mở (T5) / cuối (T5) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| Đợt 143 mở (T5) / cuối (T5) | 1498 / 1494 | boot 70a5b0fc |
| Đợt 144 mở (T5) / cuối (T5) | 1289 / 1193 | boot 691a7403 / cc222c8a |
| Đợt 145 mở (T5) / cuối (T5) | 1074 / 1070 | boot e146ca67 |
| **Đợt 146 mở boot 1 (T5, 11:37Z)** | **879 / 880 (2 lần đo)** | **boot 98a7c93f, headroom-open.txt** |
| **Đợt 146 mở boot 2 (T5, 12:17Z)** | **784** | **boot 6fb582df, headroom-boot2-open.txt** |
| **Đợt 146 cuối (T5, 12:54:57Z)** | **772** | **boot 6fb582df, headroom-end.txt** |

- Giảm −195 so với mở đợt 145 (1074 → 879, boot 1) và −95 nữa
  sang boot 2 (879 → 784); **Vẫn DƯỚI ngưỡng báo user (< ~1.800)**
  — theo quyết parent (k) đợt 144 (chỉ theo dõi, không hành động
  mới, không nhắc lại riêng), đợt này **chỉ theo dõi, không báo
  riêng, không tự đổi gì**. Tỉ lệ/vite: ~0,56 (boot 1) → ~0,50
  (boot 2) — lần thứ 4 liên tiếp dưới 1,0.
- **Đo mở boot 1 hai lần: 879 (11:37:3xZ) và 880 (11:37:4xZ, lưu
  file) — chênh 1**, cùng mẫu T9-145 đo 2 lần chênh 0 trên boot
  e146ca67. Trần boot 1: 63756. **Trần boot 2: 63747 — ĐỔI LẠI
  −9** (63747 e146ca67 → 63756 98a7c93f → 63747 6fb582df); trần
  không ổn định giữa các boot (F-145-T9-4 tái hiện lần 2) — so
  sánh headroom tuyệt đối giữa các boot mang nhiễu ±9. Số watch
  đang giữ ngoài cell suy ra: 63.756 − 880 = **62.876 watch**
  (boot 1, tăng ~203 so với 62.673 đợt 145); 63.747 − 784 =
  **62.963 watch** (boot 2, tăng ~87 so với boot 1).
- **Cửa sổ thoáng ngay sau boot (>20.000, T9-145 đo lần 3 lúc boot
  98a7c93f ~62 giây tuổi) ĐÃ ĐÓNG trước khi T5 đo boot 2:**
  đo mở boot 2 lúc boot +4m30s đã về 784 — cửa sổ chỉ tồn tại
  ~1–2 phút đầu sau boot (T9-142: ~1 phút). T5 không đo cửa sổ
  thoáng (không thuộc brief; quyết (k) đợt 144 đã ghi caveat).
- Caveat (F-146-T5-4): fd cell-visible (`ls /proc/*/fd | wc -l`,
  cùng cách đếm các đợt) **429 (lúc đo mở boot 1 lần 1) → 385
  (sau probe lần 1) → 483 (lúc đo mở boot 1 lần 2) → 315 (lúc đo
  mở boot 2)** — biến động mạnh theo luồng đang chạy, không phải
  thành phần ổn định của headroom; headroom tự nó gần như không
  đổi trong 2 lần đo mở boot 1 (879 → 880) nên đà giảm −195 so
  với đợt 145 là đà dài hạn thật, không phải nhiễu lúc đo mở.
  T9-146 đo độc lập để đối chiếu.

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 6,8G trống** (đo 11:41Z — không đổi
  so với đợt 145); `/tmp` tmpfs 512M, 497M trống. Không có ENOSPC
  nào trong phiên ngoài ENOSPC inotify có chủ đích của probe K8
  (errno 28 khi hết watch — đó là cách đo headroom, không phải
  lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại
  (symlink → `../vite/bin/vite.js`, mtime 09/11 không đổi) — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock). T4-146 chạy vite cho lượt yên #21 trên boot này
  (việc của T4).

## 7. EPERM scan + WFS #52 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #65 (T2-146): ok=2 fail=0, boot=98a7c93f, 11:39:18Z**
  (`eperm-probe-v2.log`: 184 → **187 dòng (+3 đúng prereg)**:
  1 dòng DEAD-detected + 1 dòng boot-changed + 1 dòng probe #65).
  Probe #65 chạy ngay khi T2-146 mở (11:39:18Z, ~2 phút sau khi T5
  mở 11:37:11Z) — cùng boot 98a7c93f mà T5 đang kiểm.
- **Mù #65 MỚI MỞ** (từ đợt 145, do reboot #33 sau khi T2-145
  đóng) — T2-146 xử lý (probe #65 + gap e146ca67→98a7c93f +
  khung chết #109?/boot e146ca67); T5 không phán mù.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142/T5-143/T5-144/T5-145).
- Lưu ý log probe: dòng `boot changed` ghi **e146ca67 →
  98a7c93f**, khớp reboot #33 — probe chết theo reboot #33 (last
  #64 08:41:32Z, DEAD-detected 11:39:18Z age 10.665 s) và chỉ tỉnh
  lại sau reboot #33; đây là giới hạn của probe log, không phải
  dữ kiện về boot (T2-146 có boot-verify.txt riêng xác nhận
  98a7c93f, btime 1795082043).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 viết; lần kiểm cuối 12:55Z — log dừng ở probe #65).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–145).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #52 (T5 chạy, 11:38:09–11:40:23Z, 134 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round146-t5, **đổi OUT round145-t5 → round146-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round146-t5, không
  còn tham chiếu round cũ nào trong script; grep `round144` sau
  sed = 0). Kết quả:
  - NEWSTD: **966 dòng / 273 file** (phạm vi 3.215 file);
  - R7b đối chiếu: **991 dòng / 290 file** (phạm vi 12.608 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43–52.
  - Đối chiếu chéo: 966+25=991=R7b, **chênh 0**.
- **+1 dòng / +1 file so với lần 51 (T5)** (965/272 → 966/273),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #51
  còn nguyên trong round145-t5/): diff wfs-newstd.txt #51→#52 chỉ
  ra đúng **1 dòng thêm: `./docs/PHASE9_ROUND145_T5_INFRA_LIMITS.md:1`**
  (file LIMITS T5-145 hoàn thành sau quét #51); 0 file nào đổi số
  hit, không file nào mất hit. Phạm vi quét tăng 3.206 → 3.215
  file (+9 — docs mới đợt 145) nhưng chỉ 1 file có hit.
- **Kết luận: 52 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #65 (tính tới thời điểm quét).

### 7.4 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

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
  để né EPERM trong mù #65.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–145). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **Quyết parent (h) đợt 145 (cập nhật quyết (j)): bằng chứng thay
   thế cho đối chiếu kiểu B4 là (a)+(b) — T5-146 đã thực hành
   đúng:** file đóng băng `dpkg-frozen-98a7c93f.txt` + demo (b)
   exact-comm = 0 (xem §3.7). Nếu T4-146 có attempt nào bị B4
   đánh VI PHẠM, đối chiếu bằng file đóng băng này + ps
   exact-comm của T4 trong cửa sổ đó.
2. **Lượt yên WebKit #21: ĐANG ĐO Ở ĐỢT 146 (việc T4-146).**
   Ngân sách retry = 3 attempt/đợt; cờ POSTBOOT_PASS của T5 đã
   ghi 11:37:57Z poll=2 cho boot 98a7c93f (T4 đã đọc cờ mở cửa
   lúc 11:39:12Z).
3. **Balloon 0/37 mẫu ghim trần series 1 (đợt thứ 3 liên tiếp
   sampler T5 ghi 0 mẫu ghim) — NHƯNG XẢ HẲN VỀ 0 kB lúc
   11:51:28Z (lần đầu ghi được xả tuyệt đối).** Series 2 +
   sampler dài của T9 là chuẩn dài hạn (xem §5.2/§5.5).
4. **CỬA SỔ GUARD ĐẦU TIÊN ĐÃ MỞ 11:51:28–11:52:28Z (2 mẫu ≥
   guard, đỉnh 105,2%) — T9 guard-watcher bắt được 3 mẫu
   GUARD-OPEN.** Birefnet: T5 KHÔNG thử (cửa sổ đã đóng trước
   khi T5 phát hiện); **T9/T10 xác nhận có thử birefnet trong
   cửa sổ hay không** (xem §5.3). Guard 6.144 MiB GIỮ NGUYÊN.
   u2net là fallback chính thức (đã kiểm sự hiện diện — xem
   §5.5).
5. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Cộng dồn lượt
   yên hợp lệ = 17 sau đợt 145 (#20 hợp lệ); đợt 146 đo #21.
6. **Headroom VẪN DƯỚI NGƯỠNG BÁO (879/880 mở boot 1 → 784 mở
   boot 2 → 772 cuối boot 2):** chỉ theo dõi, không báo riêng
   (quyết parent (k) đợt 144). Đà giảm so với đợt 145 là −195
   (mở boot 1) / −298 (cuối boot 2 so với cuối đợt 145: 1070 →
   772) — đà dài hạn thật (headroom trong phiên gần như không
   đổi: boot 1 879 → 880, boot 2 784 → 772); T9 đối chiếu độc lập.
7. **Cache apt sống/không sống qua reboot là KHÔNG NHẤT QUÁN
   (F-141-T5-4 giữ nguyên):** đợt này cache sống qua reboot
   (178 .deb — y hệt đợt 145); đợt 142/143: 0 .deb. T5 đợt sau
   vẫn kiểm cache ngay lúc mở boot mới, không giả định trước.
8. **Replay CHẠY TỐT 4 boot liên tiếp** (691a7403, cc222c8a,
   e146ca67, 98a7c93f — đều 1545/221, +3m53s đến +4m53s) — sau 3
   lần chết dạng (B) trong 4 đợt gần nhất (#76?/90392aa5/
   bde599df/70a5b0fc). Dạng (B) không biến mất (vẫn có thể quay
   lại đợt sau); §8.2(B) form B + luật (C) giữ nguyên, không đổi
   luật nào đợt này. **KHÔNG cần --repair lần nào đợt này** (lần
   thứ 3 liên tiếp kể từ đợt 144).
9. **Mù #65 MỚI MỞ (T2-146: probe #65 + gap e146ca67→98a7c93f +
   khung chết #109?/boot e146ca67)** — việc T2; T5 chỉ đối chiếu
   probe #65 (ok=2 fail=0). **CERT 64 / FULL 79 (quyết parent
   (c) đợt 144 — đã xác nhận)**; gap 7.067 s e146ca67→98a7c93f
   chờ T2-146 chứng nhận.
10. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 145 §11: G1 chờ
    user quyết; ci-security.yml vẫn 403 chờ user; file oversize
    6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` vẫn
    chưa quyết số phận; TTS 39 cấm kiểm lại; release gate không
    đổi + KHÔNG push khi user chưa nhắn "push đi"; R9 (a) vẫn chờ
    user (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần (`3299e2c4…` → `6e20b0ed…`, dòng
  `say`, KHÔNG đổi logic — xem §3.8).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử bởi T5 (không thuộc
  brief; RAM series 1 đỉnh 105,2% guard nhưng cửa sổ đã đóng
  trước khi phát hiện, series 2 đỉnh 32,4% guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-146 probe #65
  ok=2 fail=0). WFS scan #52 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1).
- Postboot boot 98a7c93f: PASS ngay poll0 (11:37:27Z) + poll1
  (11:37:57Z) (poll2 boot 1 không chạy — reboot #34); cờ ghi
  11:37:57Z poll=2. Postboot boot 6fb582df: PASS poll0 (12:17:20Z)
  + poll1 (12:17:25Z) + poll0b (12:17:40Z) + poll2 (12:55:07Z);
  cờ mới ghi 12:17:25Z poll=2.
  **KHÔNG chạy --repair lần nào.**
  **Watcher 60-phút: KHÔNG lập** (replay đã xong trước khi T5 mở).
  Luật (C): KHÔNG kích hoạt (không có replay kẹt + postboot FAIL
  kéo dài).
- B4 thực hành: **(a) file đóng băng đã ghi + (b) exact-comm = 0**
  (xem §3.7) — không có cửa sổ giao đối chiếu đợt này.
- Headroom: 879/880 (mở boot 1) → 784 (mở boot 2) → **772 (cuối
  boot 2)** — VẪN DƯỚI ngưỡng báo ~1.800, lần thứ 6 liên tiếp,
  chỉ theo dõi.
- RAM phiên T5 (2 series, xem §5): series 1 n=37 (cắt ngang):
  avail 741.048–6.618.252 kB (mean 3.550.407), balloon 0–6.082.340
  kB (mean 2.854.809), gate A 36/37, max **105,2% guard**, 0 mẫu
  ghim trần; series 2 n=40 (boot 6fb582df, đầy đủ): avail
  455.800–2.039.252 kB (mean 816.157), balloon 4.707.932–6.443.824
  kB (mean 5.870.161), gate A 7/40, max **32,4% guard**, **9/40
  mẫu ghim trần**.
- **1 reboot trong phiên T5 (#34, 12:13:26Z)** — giết sampler
  series 1 ở mẫu 37/40 + vòng chờ sampler của T5 (F-146-T5-2);
  T5 kiểm replay boot mới đầy đủ + khởi động lại sampler series 2.
- **started_at lượt 146:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10).

## 11. Sai số F-146-T5-n (mọi sai số của luồng T5 đợt này)

- **F-146-T5-1 — grep chuỗi con tự đếm chính shell lệnh (phát
  hiện lúc đóng băng B4).** `ps aux | grep -E '[a]pt-get|[d]pkg'`
  đếm 1 — chính là shell `/bin/bash -c` chứa chuỗi pattern trong
  dòng lệnh của nó; `ps -eo comm` exact + pgrep -x đều = 0. Cùng
  họ với F-145-T4-2. Bài học: đối chiếu (b) CHỈ dùng
  exact-comm/pgrep -x, không dùng grep chuỗi con trên ps aux.
- **F-146-T5-2 — Vòng chờ sampler của T5 bị SIGTERM cùng reboot
  #34.** Lệnh chờ `SAMPLER_DONE` (khởi động ~11:43Z) bị giết
  12:13:26Z khi boot đổi 98a7c93f → 6fb582df (exitSignal 15,
  duration ~1.808 s); session làm việc của T5 vẫn sống nhờ
  runtime restart, không mất dữ liệu đọc trước đó (sampler log
  series 1 còn nguyên 37 mẫu trên đĩa). Cùng họ với F-145-T10-1
  / F-140-T10-1 / F-142-T10-1. T5 khởi động lại sampler series 2
  trên boot mới 12:14:38Z.
- **F-146-T5-3 — Output drain của exec hiện 2 dòng lạ khi khởi
  động sampler boot2.** Lúc `head -2 ram-sampler-boot2.log` sau
  khi nohup sampler, output drain hiện 2 dòng ngày 18/11 với
  format khác (`MemAvailable: ... Balloon=...`) — không khớp
  file thật. T5 kiểm trực tiếp bằng `cat` ngay sau đó: file
  đúng (1 dòng 12:14:38Z, format `avail_kB=... balloon_kB=...`),
  sampler chạy đúng (pid 2183). Ghi lại là dị thường output
  drain chưa giải thích được; số liệu trong LIMITS này lấy từ
  `cat` trực tiếp, không lấy từ output drain đó.
- **F-146-T5-4 — fd cell-visible biến động mạnh (caveat, không
  phải lỗi đo).** `ls /proc/*/fd | wc -l`: 429 (lúc đo mở lần 1)
  → 385 (sau probe lần 1) → 483 (lúc đo mở lần 2). Mức mở cao
  (nhiều luồng vừa khởi động) và dao động ±100 trong vài phút đều
  là hệ quả của số luồng đang chạy, không phản ánh headroom
  (879 → 880 gần như không đổi). T5 ghi lại để T9/T10 không đọc
  số fd như chỉ báo headroom.
- Trong phiên boot 2, headroom gần như không đổi (784 mở →
  772 cuối, −12 trong ~37 phút) — đà giảm chủ yếu là giữa các
  đợt/boot, không phải trong phiên.
- **F-146-T5-5 — CỬA SỔ GUARD ĐẦU TIÊN (phát hiện, không phải lỗi
  của T5).** Sampler T5 ghi 2 mẫu ≥ guard 6.144 MiB
  (11:51:28Z 105,2% + 11:52:28Z 104,8%) — lần đầu tiên trong
  chuỗi T5; balloon xả hẳn về 0 kB lúc 11:51:28Z (lần đầu ghi
  được xả tuyệt đối). Guard-watcher của T9 bắt được 3 mẫu
  GUARD-OPEN (11:51:06Z / 11:52:06Z / 11:53:06Z) — hai sampler
  độc lập khớp nhau. Cửa sổ đã đóng trước khi T5 phát hiện lúc
  đối chiếu; T5 KHÔNG tự chạy birefnet; T9/T10 xác nhận có thử
  birefnet trong cửa sổ hay không (xem §5.3).

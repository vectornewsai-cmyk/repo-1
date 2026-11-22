# PHASE9_ROUND145_T5_INFRA_LIMITS — BOOT e146ca67 (#108? chặt) REPLAY CHẠY TỐT (1545/221, +3m53s) → postboot PASS poll=2 + poll2, KHÔNG CẦN REPAIR → ĐỐI CHIẾU B4 DỨT KHOÁT: KHÔNG CÓ apt-get TRONG CỬA SỔ attempt2/3 (06:03–06:11Z) → NHƯNG TIỀN ĐỀ QUYẾT (j) ĐỢT 144 SAI MỘT NỬA: apt history.log CŨNG RESET MỖI REBOOT → RAM ĐỈNH 63,8% GUARD (CAO NHẤT NHIỀU ĐỢT, VẪN 0 MẪU ≥ GUARD) → BALLOON 0/40 MẪU GHIM TRẦN (ĐỢT THỨ 2 LIÊN TIẾP) → HEADROOM 1074 → 1070 (DƯỚI NGƯỠNG LẦN 5 LIÊN TIẾP, CHỈ THEO DÕI)

> Luồng T5, đợt 145, lượt cron 15:35 +07 19/11/2026 (mở 08:35:51Z;
> T5 mở thực tế 08:41:19Z, t5-start 08:42:44Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **1 BOOT trong phiên T5: e146ca67** (btime 07:56:16Z — **KHỚP
> brief**; #108? TẠM theo đếm chặt, quyết parent (f) đợt 144;
> reboot #32 đã xảy ra TRƯỚC khi T5 mở, T5-144 đóng trước reboot
> nên boot này chưa từng được kiểm — đây là lần kiểm đầu tiên).
> Boot replay **CHẠY TỐT, XONG HẲN**: 1545 dòng / 221 installs /
> 462 configure, gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**.
> **KHÔNG cần --repair.** Postboot PASS poll0 + poll1 + poll0b +
> poll2; cờ `POSTBOOT_PASS` ghi 08:45:28Z poll=2.
> **B4 (F-144-T9-9) ĐỐI CHIẾU XONG, DỨT KHOÁT: KHÔNG** — apt-get
> không chạy (không cài gì) trong cửa sổ attempt2/3 của T4-144
> (06:03:14–06:11:04Z): dpkg.log boot cc222c8a ĐÓNG BĂNG 1545 dòng
> / md5 `3569903e…` từ 05:58:41Z tới 06:35:37Z (số đo T5-144 trên
> workspace bền) — toàn bộ cửa sổ nằm trong khoảng đóng băng;
> T4-144 §6.1 độc lập: exact-comm = 0, last history entry
> 05:57:30Z, pgrep -x = 0 lúc đóng. **Phát hiện mới
> (F-145-T5-1): apt history.log CŨNG RESET mỗi reboot** — file live
> hiện tại chỉ còn 50 Start-Date của replay boot e146ca67
> (07:57:37–08:00:09Z), 0 entry 06:03–06:11Z; tiền đề quyết parent
> (j) đợt 144 ("history.log đủ làm bằng chứng thay thế") SAI MỘT
> NỬA — chỉ os-intent state (`/var/lib/hatch`, bền qua reboot)
> sống sót, và ledger của nó chỉ là 1 snapshot compacted duy nhất
> (ts 03:13:53Z), không có timing theo boot. B4 vẫn kết luận được
> nhờ số đo dpkg.log đóng băng đã ghi trên workspace — hỏi parent
> có cập nhật quyết (j) hay không (xem §9.1).
> **RAM đỉnh 63,8% guard** (4.014.444 kB lúc 08:57:50Z — cao nhất
> trong các series T5 nhiều đợt gần đây) nhưng **0 mẫu ≥ 6.144 MiB
> — không có cửa sổ birefnet. Balloon 0/40 mẫu ghim trần kẹt
> 6.443.824 kB** — đợt thứ 2 liên tiếp 0 mẫu ghim (đợt 144: 0/53).
> **Headroom 1074 (mở) → 1070 (cuối)** — vẫn DƯỚI ngưỡng báo
> ~1.800, lần thứ 5 liên tiếp; tỉ lệ/vite ~0,68. Theo quyết parent
> (k) đợt 144: **chỉ theo dõi, không báo riêng**.
> **WFS #51 chênh 0** (51 lần liên tiếp). **KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production** (preview.tsx giữ 530e10a7).
> **KHÔNG tự chạy birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

> **File LIMITS này: 49.928 B — OVERSIZE (> 37.768 B), push cần
> `ENABLE_PRIVSEP=0`.**

## 1. Kết luận ngắn

1. **BOOT e146ca67 (#108? TẠM, btime 07:56:16Z): REPLAY CHẠY TỐT,
   ĐÃ XONG TRƯỚC KHI T5 MỞ.** dpkg.log **1545 dòng / 221 installs /
   462 configure**, md5 `302f0aff…`, mtime 08:00:09Z (boot +3m53s),
   gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**; bracket replay
   (configure 07:56:59Z boot +43s → xong 08:00:09Z boot +3m53s) —
   nhanh ngang #96? (+3m52s), nhóm replay NHANH nhất. Cache apt
   **SỐNG qua reboot: 178 .deb / 156M** (khác 180 đợt 141/143/144 —
   chênh 2 file, xem §3.5). Lists **71** (2 mirror azure + cogentco
   — xem §3.5, không phải lỗi); partial 0; GST hệ thống là **thư
   mục thật 269/269** (không symlink); /var/log/apt có (50
   Start-Date, đầu 07:57:37Z). Postboot **PASS ngay poll0
   (08:43:04Z, exit 0)** + poll1 + poll0b + poll2.
2. **CỜ POSTBOOT_PASS ghi 08:45:28Z poll=2**
   (`boot_id=e146ca67-20a5-4452-9112-69155233ab99 btime=
   2026-11-19T07:56:16Z pass_at=2026-11-19T08:45:28Z poll=2
   repair=none/replay-full dpkg=1545/221`) — T4-145 đọc cờ này
   (hoặc dùng T4-check-only theo quyết gate0 mới) để mở cửa yên
   #20; T5 không kiểm poller T4 đợt này.
3. **REBOOT #32 ĐÃ XẢY RA TRƯỚC KHI T5 MỞ** (cc222c8a →
   e146ca67, btime 07:56:16Z — quyết parent (f) đợt 144 đã xác
   nhận là sự kiện #32). Boot cc222c8a sống **2h03m01s**
   (05:53:15Z → 07:56:16Z). T5-145 KHÔNG có dữ kiện cho khung
   chết boot cc222c8a (sampler T5 bắt đầu 08:42:49Z, sau reboot);
   ứng viên T10 (07:55:38Z, 07:56:16Z] (38 s) chờ T2-145 merged
   mù #64 xác nhận. **0 reboot trong phiên T5** (mở 08:41:19Z →
   đóng 09:23:25Z, cùng boot e146ca67).
4. **B4 — ĐỐI CHIẾU XONG, DỨT KHOÁT: KHÔNG (§3.7).** Không có
   apt-get install nào trong cửa sổ attempt2 (06:03:14–06:06:47Z)
   + attempt3 (06:07:30–06:11:04Z) của T4-144. Bằng chứng quyết
   định: dpkg.log boot cc222c8a đóng băng 1545 dòng từ 05:58:41Z
   tới 06:35:37Z (T5-144) + T4-144 §6.1 (exact-comm = 0,
   pgrep -x = 0, last history entry 05:57:30Z). Điểm quan sát
   07:59Z libpipewire của T9 (F-144-T9-9) nay xác định thuộc
   replay boot e146ca67 (dpkg.log hiện tại: install 07:58:51Z) —
   không phải replay cc222c8a chạy tiếp; hai điểm quan sát của T9
   ở trên 2 boot khác nhau, không điểm nào trong cửa sổ B4.
   B4 VI PHẠM ở attempt2/3 là giả-dương — ủng hộ quyết parent (b)
   đợt 144 đã chấp nhận attempt3 làm lượt yên #19 hợp lệ.
5. **F-145-T5-1 — TIỀN ĐỀ QUYẾT (j) ĐỢT 144 SAI MỘT NỬA (§3.7).**
   apt history.log KHÔNG sống qua reboot: file live chỉ còn
   replay boot hiện tại (50 Start-Date, 07:57:37–08:00:09Z).
   "Không có entry 06:03–06:11Z trong history.log live" KHÔNG
   phải bằng chứng phủ định trực tiếp — nó là hệ quả của reset.
   Chỉ os-intent state sống qua reboot, và ledger chỉ là 1
   snapshot compacted (ts 03:13:53Z — trước cả boot 691a7403),
   không có timing theo boot. Bằng chứng thay thế đáng tin là số
   đo dpkg.log đóng băng đã ghi trên workspace bền + ps
   exact-comm của T4 — hỏi parent có cập nhật quyết (j) không.
6. **RAM SAMPLER — 1 SERIES ĐẦY ĐỦ (n=40, 08:42:49–09:21:50Z),
   xem §5.** Avail 586.928–4.014.444 kB (mean 1.807.166), gate A
   34/40, max **3.920,4 MiB = 63,8% guard** (đỉnh cao nhất nhiều
   đợt gần đây — đợt 144 max 48,8%); **0 mẫu ≥ 6.144 MiB**.
   Balloon 2.876.344–5.646.236 kB (mean 4.662.095), **0 mẫu ghim
   trần 6.443.824 kB** — đợt thứ 2 liên tiếp 0 mẫu ghim. 6 mẫu
   dưới gate A liên tiếp 09:11:50–09:16:50Z (đáy 586.928 kB lúc
   09:16:50Z). **Không có cửa sổ guard nào — không ai thử
   birefnet.** u2net fallback vẫn sẵn sàng (rembg 2.0.87 + model
   trên đĩa — xem §5.4).
7. **HEADROOM inotify MỞ 1074 → CUỐI 1070** (trần 63747) — giảm
   −219 so với mở đợt 144 (1289) và −123 so với cuối đợt 144
   (1193); trong đợt gần như không đổi (−4). **Vẫn DƯỚI ngưỡng
   báo user (< ~1.800), lần thứ 5 liên tiếp**; tỉ lệ/vite ~0,68.
   Theo quyết parent (k) đợt 144: đợt này **chỉ theo dõi, không
   báo riêng**. Caveat: fd cell-visible rơi 685 (mở) → 305 (cuối)
   — đếm fd biến động mạnh theo luồng đang chạy, không phải thành
   phần ổn định của headroom (xem F-145-T5-4).
8. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
    **2c384ed1**, vite.config.ts **ee80d093** (mở = lúc đóng);
    postboot script sửa 1 lần (`4b156a7d…` → **`3299e2c4…`**,
    chỉ dòng `say` boot, KHÔNG đổi logic — xem §3.8).
9. **EPERM (T2-145, T5 chỉ đối chiếu): probe #64 ok=2 fail=0,
    boot=e146ca67, 08:41:32Z**; log probe 184 dòng (181 sau #63 +
    3 đúng prereg: DEAD + boot-changed + #64). **WFS scan #51:
    chênh 0** — NEWSTD 965/272, R7b 990/289, copies 25/17; delta
    +1/+1 giải thích trọn vẹn bằng 1 dòng mới của file LIMITS
    T5-144 (xem §7.3). **Async `.writeFile(`: đúng 2 helper đã
    biết, 0 stray.**
10. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
11. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 1 boot trong phiên (reboot #32 xảy ra trước khi mở)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | e146ca67 (#108? TẠM — đếm chặt, quyết parent (f) đợt 144) | 07:56:16 (uptime -s; /proc/stat btime 1795074976; who -b 07:56; /proc/1 07:56:31 +15s) | còn sống (lúc T5 đóng ~1h27' tuổi) | Replay CHẠY TỐT, xong boot +3m53s (1545/221, gói cuối tools 0.2); postboot PASS poll0+poll1+poll0b+poll2; cờ 08:45:28Z poll=2; KHÔNG cần repair; 0 reboot trong phiên T5 |

- **Btime KHỚP brief** (07:56:16Z, 4 nguồn + khớp T7-144/T2-145
  boot-verify: btime_epoch 1795074976; T2-145 journal first entry
  07:56:32Z).
- **Boot tiền nhiệm cc222c8a sống 2h03m01s** (05:53:15Z →
  07:56:16Z). Khung chết boot cc222c8a: T5-145 KHÔNG có dữ kiện
  (sampler bắt đầu 08:42:49Z, sau reboot #32); ứng viên T10
  (07:55:38Z, 07:56:16Z] (38 s) chờ T2-145 merged mù #64 xác nhận
  (xem aggregate đợt 144 §12.1(f)).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 145** do
  parent tạo — KHÔNG phải đợt main-chat (tiền lệ đợt 130–144).
  T5 tiến hành bình thường.
- Đánh số theo **đếm chặt (chuẩn parent từ đợt 144)**:
  e146ca67 = #108?. Chuỗi INSIDE theo đếm chặt là 2 (quyết parent
  (h) đợt 144); cc222c8a INSIDE hậu nghiệm → chuỗi lên 3, chờ
  T2-145 xác nhận chính thức bằng probe #64 + merged mù #64 —
  T5 không tự đếm chuỗi (việc T2/T6).

## 3. dpkg replay — CHẠY TỐT, KHÔNG cần repair; đối chiếu B4 (F-144-T9-9)

### 3.1 Replay boot e146ca67 — xong trước khi T5 mở

| Hạng mục | Lúc mở (08:41–08:45Z) |
|---|---|
| dpkg.log dòng | 1545 |
| `status installed` | 221 |
| dòng chứa `configure` | 462 |
| dpkg.log md5 | `302f0aff…` (không đổi tới lúc đóng 09:23Z) |
| dpkg.log mtime | 08:00:09Z (boot +3m53s) |
| startup configure đầu | 07:56:59Z (boot +43s) |
| cài thật | 07:57:37–08:00:09Z (install đầu libaspell15 07:57:37Z) |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (08:00:09Z) |
| cache apt | 178 .deb / 156M (SỐNG qua reboot — xem §3.5) |
| lists / partial | 71 / 0 (2 mirror — xem §3.5) |
| GST hệ thống / debroot | thư mục THẬT 269 file / 269 |
| /var/log/apt | có (history.log 50 Start-Date, đầu 07:57:37Z) |
| proc apt/dpkg/wrapper | 0 |
| postboot check | PASS exit 0 (poll0 08:43:04Z + poll1 08:45:22Z + poll0b 08:45:38Z + poll2 09:23:25Z) |

- Bracket replay: **(boot +43s, boot +3m53s]** — nhanh ngang
  #96? (+3m52s, nhanh nhất từ trước tới nay) và nhanh hơn boot 1
  đợt 144 (+4m53s) / boot 2 đợt 144 (+4m15s). KHÔNG có GAP kiểu
  đợt 140 boot 1 (805 s). Cài từ cache là chính (178 .deb / 156M
  sống qua reboot; replay dùng `--no-download` theo mẫu các đợt).
- **KHÔNG cần watcher** (replay đã xong trước khi T5 mở),
  **KHÔNG kích hoạt luật (C)** — (C) chỉ dành cho replay KẸT khi
  postboot FAIL. **KHÔNG chạy --repair** (không có gì để sửa).
- fontconfig trong dpkg.log boot này: `status triggers-pending
  fontconfig:amd64 2.15.0-1.1ubuntu2` lúc **07:58:30Z** — đúng
  **1m39s trước** dòng gói cuối (08:00:09Z); cùng mẫu như boot
  691a7403 (3 phút trước) và 9afdaa89 (2 phút trước) — củng cố
  thêm kết luận thread gstreamer "3 phiên bản" đã đóng ở đợt 144
  (fontconfig 1.1ubuntu2 xuất hiện sát dòng gói cuối trên mọi
  replay đầy đủ gần đây, dễ gây ghi nhầm).

### 3.2 Cờ POSTBOOT_PASS

| Boot | Cờ ghi (Z) | poll | Nội dung |
|---|---|---|---|
| e146ca67 | 08:45:28 | 2 | `boot_id=e146ca67-20a5-4452-9112-69155233ab99 btime=2026-11-19T07:56:16Z pass_at=2026-11-19T08:45:28Z poll=2 repair=none/replay-full dpkg=1545/221` |

- Cờ ghi sau 2 poll PASS (poll0 08:43:04Z + poll1 08:45:22Z),
  theo đúng mẫu các đợt. poll0b (08:45:38Z, sau khi sửa dòng
  `say` trong script) + poll2 (09:23:25Z) đều PASS exit 0, xác
  nhận cờ đứng vững tới lúc đóng.
- T4-145 mở cửa yên #20 bằng cờ T5 này hoặc bằng T4-check-only
  theo quyết gate0 mới (quyết parent (j) đợt 143) — T5 không kiểm
  poller T4 đợt này; T10 đối chiếu khi gộp.

### 3.3 Trạng thái sau replay (replay đầy đủ, KHÔNG phải repair-1-phần)

| Hạng mục | Lúc mở | Lúc đóng (09:23Z) |
|---|---|---|
| dpkg.log dòng / installs / configure | 1545 / 221 / 462 | 1545 / 221 / 462 (md5 `302f0aff…` không đổi) |
| dpkg.log mtime (gói cuối) | 08:00:09Z | 08:00:09Z (không đổi) |
| cache apt | 178 .deb / 156M | 178 .deb / 156M (không đổi) |
| lists / partial | 71 / 0 | 71 / 0 (không đổi) |
| GST hệ thống | thư mục THẬT 269 | thư mục THẬT 269 |
| proc apt/dpkg/wrapper | 0 | 0 |
| postboot check | PASS poll0+poll1+poll0b | PASS poll2 (xác nhận lại) |

- Số liệu **TRÙNG bracket replay đầy đủ chuẩn** (1545/221/462 —
  như #94?/#96?/2c0efe57/691a7403/cc222c8a) — khác hẳn bracket
  repair-1-phần 795/113 của đợt 140 boot 2 / 142 / 143. Đây là
  replay đầy đủ thứ 3 liên tiếp (691a7403, cc222c8a, e146ca67)
  sau 3 lần chết dạng (B) trong 4 đợt gần nhất.

### 3.4 So sánh replay các đợt gần nhất (bracket đầy đủ)

| Boot | Đợt | Bracket (configure → xong) | Gói cuối |
|---|---|---|---|
| 17db9652 (#94?) | 137 boot 2 / 138 | +49s → +6m05s | tools 1ubuntu0.1 |
| 541524e2 (#96?) | 139 | +31s → +3m52s | tools 1ubuntu0.1 |
| 2c0efe57 | 141 | +31s → +3m57s | tools 1ubuntu0.1 |
| 691a7403 (#106?) | 144 boot 1 | +34s → +4m53s | tools **1ubuntu0.2** |
| cc222c8a (#107?) | 144 boot 2 | +48s → +4m15s | tools **1ubuntu0.2** |
| e146ca67 (#108?) | 145 | +43s → +3m53s | tools **1ubuntu0.2** |

- Boot e146ca67 thuộc nhóm replay NHANH (dưới 4 phút
  wall-clock, không GAP), nhờ cache sống 178 .deb.
- Gstreamer tools **1.24.2-1ubuntu0.2** lần thứ 3 liên tiếp
  (đợt 143/144/145); madison hiện tại (đo 08:42Z, cả 2 mirror)
  vẫn chỉ có 0.2 (updates + security) và 1.24.2-1 (main);
  **0.1 đã biến mất, 1.1ubuntu2 không tồn tại** — thread "3 phiên
  bản" vẫn đóng (xem §3.6 đợt 144).

### 3.5 Cache + lists — 2 chênh lệch so với đợt 144, đều giải thích được

- **Cache 178 .deb (đợt 144: 180; đợt 141/143: 180; đợt 139:
  178).** Chênh −2 file, du vẫn 156M. T5 không xác định được 2
  file nào vắng (không có danh sách cache đợt 144 để đối chiếu
  từng file — cache là thư mục hệ thống, không nằm trong
  workspace bền). F-141-T5-4 giữ nguyên: sống/không sống là
  KHÔNG NHẤT QUÁN — lần này cache sống qua reboot (178 file),
  khác đợt 142/143 (0 .deb). Con số 178 cũng từng xuất hiện đợt
  139 (178 .deb / 156M) — cùng mức du, có thể là cùng tập cache
  sau một lần dọn nhẹ của apt. Không ảnh hưởng replay (đủ 221
  installs, xong +3m53s).
- **Lists 71 (đợt 144: 37/39).** Phân tích trực tiếp thư mục
  `/var/lib/apt/lists/`: 71 entry = **68 file lists (2 mirror ×
  34: azure.archive.ubuntu.com + mirror.cogentco.com, mỗi mirror
  đủ 4 suite noble/noble-updates/noble-security/noble-backports)**
  + auxfiles (thư mục) + lock + partial (thư mục). Trong đó 30
  file `*_Packages`, 8 `InRelease`, còn lại là `Release` +
  `Translation-en`. Số 71 KHÔNG phải lỗi: chính header của
  postboot script (dòng 243) từng ghi "lists noble GOC DAY DU
  (71 file, 68 noble…)" cho một boot đầy đủ trước đây. Đợt 144
  chỉ có 1 mirror hiện diện trong lists (37/39) — đợt này apt-get
  update chạm cả 2 mirror nên lists đủ cả hai. T5 ghi lại cách đếm
  đầy đủ ở đây để đợt sau đối chiếu đúng phương pháp (đếm tổng
  entry `ls /var/lib/apt/lists/ | wc -l`, kèm breakdown theo
  mirror).
- Partial 0 cả lúc mở lẫn lúc đóng.

### 3.6 Gstreamer — thread "3 phiên bản" VẪN ĐÓNG (kiểm lại)

| Nguồn kiểm | Kết quả |
|---|---|
| dpkg.log boot e146ca67 (đọc trực tiếp) | `install gstreamer1.0-tools:amd64 <none> 1.24.2-1ubuntu0.2` lúc 08:00:09Z; `status installed` cùng version |
| `apt-cache madison gstreamer1.0-tools` (đo 08:42Z, cả 2 mirror) | Chỉ 2 version: **1.24.2-1ubuntu0.2** (noble-updates + noble-security, cả azure + cogentco) và **1.24.2-1** (noble/main, cả 2 mirror). **0.1 ĐÃ BIẾN MẤT; 1.1ubuntu2 KHÔNG TỒN TẠI** |
| `apt-cache madison fontconfig` | **fontconfig 2.15.0-1.1ubuntu2 CÓ THẬT** (cả 2 mirror) |
| dpkg.log boot e146ca67 — fontconfig | `status triggers-pending fontconfig:amd64 2.15.0-1.1ubuntu2` lúc **07:58:30Z** — 1m39s trước dòng gói cuối |
| Các gói GST khác trong dpkg.log boot e146ca67 | gl/base/x **1.24.2-1ubuntu0.7**, bad **1.24.2-1ubuntu4**, good **1.24.2-1ubuntu1.8**, libav/ugly **1.24.1-1build1**, libgstreamer1.0-0 **1.24.2-1ubuntu0.2** — hậu tố version khác nhau theo từng gói là bình thường |

- **Kết luận: không có gì mới — chuỗi thật vẫn 0.1 → 0.2, thread
  ĐÓNG từ đợt 144.** Boot thứ 3 liên tiếp cài tools 0.2.
  Fontconfig 1.1ubuntu2 lại xuất hiện sát dòng gói cuối (1m39s
  trước) — mẫu nhầm lẫn tái hiện lần thứ 3.

### 3.7 Đối chiếu B4 (F-144-T9-9) — apt-get có chạy trong cửa sổ attempt2/3 của T4-144 (06:03–06:11Z) hay không

> Cửa sổ cần đối chiếu (theo LIMITS T4-144 §5/§6.1, boot
> cc222c8a): attempt2 **06:03:14–06:06:47Z**, attempt3
> **06:07:30–06:11:04Z**. Poller T4 đánh B4 VI PHẠM cả hai
> attempt bằng grep chuỗi con (`ps aux | grep -E
> '[a]pt-get|[d]pkg|[o]s-intent'`); T4 hậu kiểm §6.1 cho rằng đó
> là giả-dương. T9-144 (F-144-T9-9) không kết luận được vì chỉ có
> 2 điểm quan sát (05:55:28Z libmanette; 07:59Z libpipewire) và
> giao T5-145 đối chiếu log replay theo thời gian. Quyết parent
> (j) đợt 144: đối chiếu bằng apt history.log.

**Trả lời dứt khoát: KHÔNG — apt-get không chạy (không cài gì)
trong cửa sổ 06:03–06:11Z.**

| Bằng chứng | Nội dung | Sức nặng |
|---|---|---|
| (1) dpkg.log boot cc222c8a ĐÓNG BĂNG (T5-144, ghi trên workspace bền trước reboot #32) | 1545 dòng / md5 `3569903e…` KHÔNG ĐỔI từ poll1 (05:58:41Z) tới lúc T5-144 đóng (06:35:37Z); mtime 05:57:30Z (gói cuối tools). Toàn bộ cửa sổ 06:03–06:11Z nằm trong khoảng đóng băng | **QUYẾT ĐỊNH** — mọi apt-get install đều phải ghi thêm dòng vào dpkg.log; 0 dòng mới = 0 install |
| (2) T4-144 §6.1 (hậu kiểm độc lập) | apt history entry cuối 05:57:30Z (cài tools, kết thúc replay — TRƯỚC attempt1 05:58:53Z); dpkg.log mtime 05:57:30Z, 1545 dòng KHÔNG ĐỔI từ poll #4 (05:58:07Z) tới lúc đóng (06:12:43Z); `pgrep -x apt-get` = 0 và `pgrep -x dpkg` = 0 lúc đóng; exact-comm = 0 process `apt-get`/`dpkg`/`unattended-upgrade` trong mọi file ps-before/after của cả ba attempt | **ĐỘC LẬP, KHỚP** — cùng kết luận từ phép đo process trực tiếp |
| (3) Điểm 07:59Z libpipewire của T9 — ĐÍNH CHÍNH | dpkg.log boot e146ca67 hiện tại: `install libpipewire-0.3-0t64 1.0.5-1ubuntu3.3` lúc **07:58:51Z** (cùng libpipewire-0.3-common). Điểm quan sát 07:59Z của T9 thuộc **replay boot e146ca67** (07:57:37–08:00:09Z), KHÔNG phải replay cc222c8a chạy tiếp. Hai điểm quan sát của T9 (05:55:28Z libmanette trên cc222c8a; 07:59Z libpipewire trên e146ca67) ở trên **2 boot khác nhau**, không điểm nào trong cửa sổ 06:03–06:11Z | **GIẢI QUYẾT F-144-T9-9** — "replay vẫn chạy lúc T9 đóng" không nói gì về cửa sổ B4 |
| (4) Sampler T9-144 trong cửa sổ (ram-sampler-long-2.log) | 5 mẫu 06:03:29–06:07:29Z: avail 1.705.680–2.921.924 kB, load1 0,73–2,65, gate A mở suốt | Nhất quán (không có tải apt), không chứng minh trực tiếp |
| (5) apt history.log live hiện tại | 50 Start-Date, TẤT CẢ trong 07:57:37–08:00:09Z (replay boot e146ca67); **0 entry trong 06:03–06:11Z** | **YẾU — xem F-145-T5-1**: file đã reset theo reboot #32 nên "không có entry" là hệ quả của reset, không phải bằng chứng phủ định trực tiếp |

- **Cơ chế giả-dương đã rõ (T4-144 §6.1, T9-144 §2.5):** grep
  chuỗi con đếm nhầm (a) shell khởi động lại poller của chính T4
  (pid 3957, dòng lệnh chứa `wc -l < /var/log/dpkg.log`,
  linger suốt cả ba attempt), (b) wrapper của T5-144 (pid 7815,
  shell chỉ chạy kiểm postboot + pgrep), (c) wrapper os-intent
  `sh -c` (pid 780, cmdline chứa text `apt-get ...` dài — một
  lệnh `pgrep -f apt` match cả khi không có apt-get nào chạy).
  **Kết luận này ủng hộ quyết parent (b) đợt 144** (đã chấp nhận
  attempt3 làm lượt yên #19 hợp lệ — B4-hiệu-chỉnh ĐẠT).
- **Caveat còn lại (nhỏ, không đổi kết luận):** `apt-get update`
  (không cài) sẽ không để lại dấu trong dpkg.log — nhưng không
  có process apt nào được quan sát bởi T5-144 lúc 06:00:36Z /
  06:35:37Z (0 proc) và T4 exact-comm = 0 trong mọi cửa sổ;
  pha update của replay chạy lúc đầu boot (05:54Z, partial tăng),
  không phải 06:03Z. Khả năng "update-only" trong cửa sổ là
  không có bằng chứng và mâu thuẫn với mọi phép đo process.
- **F-145-T5-1 — TIỀN ĐỀ QUYẾT (j) ĐỢT 144 SAI MỘT NỬA.**
  Quyết (j) nói "apt history.log + os-intent state đủ làm bằng
  chứng thay thế" cho dpkg.log bị reset. Kiểm thực tế đợt này:
  **history.log CŨNG reset mỗi reboot** (cùng thư mục
  `/var/log/apt`, rebuild theo rootfs): file live chỉ còn replay
  boot hiện tại; term.log + eipp.log.xz cũng chỉ còn boot hiện
  tại (mtime 08:00Z). **Chỉ os-intent state sống qua reboot**
  (`/var/lib/hatch/os-intent/`, bền): `dpkg-state.txt` mtime
  08:00:11Z (ghi lại cuối replay boot này, 2 s sau gói cuối) và
  `ledger.jsonl` mtime 04:00:40Z (ghi cuối replay boot 691a7403)
  — nhưng ledger chỉ là **1 snapshot compacted duy nhất** (1 dòng
  JSON, ts 1795058033 = **03:13:53Z**, trước cả btime boot
  691a7403 03:55:45Z — có vẻ là mốc seed baseline, không phải
  thời điểm sự kiện), liệt kê tập package replay mà **không có
  timing theo boot** — không thể dùng để đối chiếu cửa sổ thời
  gian. **Hệ quả thực hành:** đối chiếu kiểu B4 cho boot cũ
  KHÔNG dựa vào history.log live được; bằng chứng đáng tin là
  (a) số đo dpkg.log đóng băng mà T5 đã ghi trên workspace bền
  trước reboot (như bằng chứng (1) trên), (b) ps exact-comm của
  T4 trong cửa sổ. T5-145 ghi nhận để parent/T10 xét có cập nhật
  quyết (j) hay không; T5 KHÔNG tự đổi quy trình.

### 3.8 Postboot script — sửa 1 lần (dòng `say` boot, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`4b156a7d…` (cuối đợt 144) → **`3299e2c4…`**:

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 08:45Z | e146ca67 | `4b156a7d…` → `3299e2c4…` | dòng `say` boot (DOT 145, boot e146ca67, btime 07:56:16Z, #108?, reboot #32, replay +3m53s, tools 0.2, cache 178, lists 71 = 2 mirror, cờ 08:45:28Z poll=2, B4 KHÔNG + history.log reset (F-145-T5-1), headroom mở 1074) — KHÔNG đổi logic |

- `bash -n` OK sau khi sửa. Check-only chạy lại sau khi sửa
  (poll0b exit 0 lúc 08:45:38Z) — cùng kết quả như trước sửa,
  chứng minh sửa dòng `say` không ảnh hưởng logic.
- Số liệu trong dòng `say` viết đúng số đã đo TRƯỚC khi chạy
  poll0b (không lặp lại F-142-T5-1).
- Lưu ý phương pháp (F-145-T5-2): lần chạy postboot đầu tiên của
  T5 đợt này dùng cờ `--check-only` **không tồn tại** (script chỉ
  nhận `--repair` / `--launch-test`; không tham số = chỉ kiểm) —
  exit 2, không tác dụng phụ; chạy lại không tham số thì PASS
  ngay. Các LIMITS đợt trước viết "check-only" là chỉ cách gọi
  không tham số, không phải tên cờ.

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng + postboot script

| File | Lúc mở 08:41Z | Lúc đóng 09:23Z | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 4b156a7d… | 3299e2c4… (sau sửa 1 lần) | chỉ dòng `say`, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 1 series ĐẦY ĐỦ (n=40)

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup, đường
> dẫn tuyệt đối (script copy từ round144-t5, OUT đã sửa
> round145-t5 TRƯỚC khi chạy — kiểm bằng grep, không lặp lại
> F-138-T5-1). **1 series duy nhất** (0 reboot trong phiên T5 —
> khác đợt 144 có 2 series vì reboot giữa lượt).

### 5.1 Series — boot e146ca67, n=40 ĐẦY ĐỦ (08:42:49–09:21:50Z + DONE 09:22:50Z)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 08:42:49 | 1.405.116 | 4.635.484 | 5,55 |
| 2 | 08:43:49 | 2.254.436 | 4.495.880 | 6,33 |
| 3 | 08:44:49 | 1.435.308 | 4.429.812 | 4,00 |
| 4 | 08:45:49 | 1.888.292 | 4.152.424 | 4,15 |
| 5 | 08:46:49 | 2.461.816 | 4.337.944 | 2,13 |
| 6 | 08:47:49 | 2.377.256 | 4.401.896 | 2,46 |
| 7 | 08:48:49 | 2.391.940 | 4.295.948 | 2,04 |
| 8 | 08:49:49 | 2.977.216 | 3.796.672 | 2,21 |
| 9 | 08:50:49 | 2.688.788 | 4.098.644 | 2,85 |
| 10 | 08:51:49 | 2.333.776 | 4.379.112 | 1,37 |
| 11 | 08:52:49 | 2.117.048 | 4.639.000 | 0,64 |
| 12 | 08:53:49 | 1.496.312 | 4.393.276 | 1,73 |
| 13 | 08:54:50 | 1.937.128 | 4.335.432 | 1,50 |
| 14 | 08:55:50 | 1.727.196 | 4.564.768 | 0,69 |
| 15 | 08:56:50 | 1.588.956 | 4.252.600 | 0,57 |
| 16 | 08:57:50 | **4.014.444** | **2.876.344** | 0,66 |
| 17 | 08:58:50 | 3.571.944 | 3.269.540 | 0,70 |
| 18 | 08:59:50 | 3.187.192 | 3.640.988 | 1,02 |
| 19 | 09:00:50 | 2.846.116 | 3.975.260 | 0,62 |
| 20 | 09:01:50 | 1.830.864 | 4.271.756 | 0,23 |
| 21 | 09:02:50 | 2.324.668 | 4.483.804 | 1,61 |
| 22 | 09:03:50 | 1.503.756 | 4.700.124 | 3,84 |
| 23 | 09:04:50 | 1.570.044 | 4.570.068 | 6,95 |
| 24 | 09:05:50 | 1.492.472 | 4.657.096 | 4,93 |
| 25 | 09:06:50 | 1.409.320 | 4.777.992 | 4,96 |
| 26 | 09:07:50 | 1.330.228 | 4.943.424 | 5,01 |
| 27 | 09:08:50 | 1.212.120 | 5.105.092 | 3,12 |
| 28 | 09:09:50 | 1.371.388 | 5.270.724 | 2,52 |
| 29 | 09:10:50 | 1.810.500 | 5.006.764 | 2,80 |
| 30 | 09:11:50 | 998.580 | 5.167.052 | 2,66 |
| 31 | 09:12:50 | 758.364 | 5.278.412 | 2,79 |
| 32 | 09:13:50 | 772.696 | 5.403.444 | 2,94 |
| 33 | 09:14:50 | 740.636 | 5.413.968 | 3,36 |
| 34 | 09:15:50 | 701.148 | 5.524.592 | 2,94 |
| 35 | 09:16:50 | **586.928** | **5.646.236** | 2,15 |
| 36 | 09:17:50 | 1.628.748 | 5.291.308 | 1,66 |
| 37 | 09:18:50 | 1.423.500 | 5.472.036 | 1,20 |
| 38 | 09:19:50 | 1.278.408 | 5.635.376 | 1,62 |
| 39 | 09:20:50 | 1.476.540 | 5.357.756 | 1,39 |
| 40 | 09:21:50 | 1.362.448 | 5.535.740 | 0,82 |

- Thống kê (tính bằng code trên 40 mẫu, đối chiếu trực tiếp từng
  dòng log): min avail **586.928 kB lúc 09:16:50Z**; max
  **4.014.444 kB lúc 08:57:50Z = 3.920,4 MiB = 63,8% guard**; trung
  bình 1.807.166 kB; Balloon min **2.876.344 kB lúc 08:57:50Z**,
  max **5.646.236 kB lúc 09:16:50Z**, trung bình 4.662.095 kB;
  **0 mẫu ghim trần 6.443.824 kB**. Gate A (≥1.048.576 kB):
  **34/40 mẫu**. Load1 0,23–6,95.
- **Hình dạng: 2 chu kỳ xả–phình.** Chu kỳ 1 (08:42–08:56Z):
  avail dao động 1,4–3,0M; **xả lớn lúc 08:57:50Z** — balloon rơi
  xuống đáy series 2,88M, avail vọt lên đỉnh series 4,01M
  (**63,8% guard — đỉnh cao nhất trong các series T5 nhiều đợt
  gần đây**, vượt 48,8% đợt 144 và 46,84% T9-144); rồi phình đơn
  điệu 08:58–09:16Z (balloon 2,88M → 5,65M, avail rơi xuống đáy
  series 0,59M). Chu kỳ 2 (09:17–09:21Z): xả ~1,04M kB lúc
  09:17:50Z (avail về 1,63M, balloon về 5,29M) rồi phình lại
  tới cuối series. Lúc đóng (09:23:25Z, ngoài series): avail
  **1.174.556 kB**, balloon **5.749.500 kB**.
- **6 mẫu dưới gate A liên tiếp 09:11:50–09:16:50Z** (avail
  998.580 → 586.928 kB) — cửa sổ yên WebKit #20 của T4 (nếu chạy
  trong khoảng này) sẽ gặp gate A đóng; T4/T10 đối chiếu với
  sampler riêng của T4 (T5 chỉ ghi nhận; cửa sổ này nằm sau khi
  T4-144 đóng và trước khi T5 đóng — T4-145 tự có sampler của
  mình).
- **Đối chiếu T4-144:** B2 attempt2/3 boot cũ đã hiệu chỉnh (max
  3,15 / 2,90); sampler T5 đợt này không đo cửa sổ attempt đó
  (khác boot) — chỉ đối chiếu B4 bằng log (xem §3.7), không đo
  lại B2.

### 5.2 Balloon không ghim trần — ghi nhận, không kết luận vội

- **0/40 mẫu ghim trần kẹt 6.443.824 kB trong phiên** — đợt thứ 2
  liên tiếp sampler T5 ghi 0 mẫu ghim (đợt 144: 0/53 trên 2
  series; đợt 143: 7 mẫu; đợt 142: ghim 1 mẫu). Balloon đợt này
  lên cao nhất 5,65M — vẫn thiếu ~800k kB mới tới trần; nhưng
  cũng XẢ SÂU tới 2,88M (đợt 144 boot 1 xả tới 3,49M).
- **T5 KHÔNG kết luận "đóng băng đã hết".** Series của T5 chỉ phủ
  08:42–09:22Z (~40 phút); đóng băng là hiện tượng đo trên cửa sổ
  dài (T9: 114–135 mẫu/đợt). T9-145 sampler dài là luồng xác nhận
  độc lập — nếu T9 cũng ghi 0 mẫu ghim thì mới bàn tới việc đóng
  băng đã hết. Ghi nhận ở đây để T10 đối chiếu chéo với T9.

### 5.3 Đỉnh RAM 63,8% guard — gần nhất từ trước tới nay, vẫn chưa đủ cửa sổ

- Đỉnh 3.920,4 MiB lúc 08:57:50Z = **63,8% guard 6.144 MiB** —
  cao hơn mọi đỉnh T5 gần đây (đợt 144: 48,8%; đợt 143: ~44%;
  T9-144: 46,84%). Nhưng vẫn thiếu **~2.224 MiB** mới tới guard;
  đỉnh chỉ tồn tại 1 mẫu (mẫu sau 08:58:50Z đã rơi về 3.490,2
  MiB = 56,8%). **Không có cửa sổ guard nào — không ai thử
  birefnet.** Đây là bằng chứng balloon xả mạnh có thể đẩy avail
  lên cao trong thời gian ngắn, nhưng cửa sổ (nếu có) ngắn hơn
  chu kỳ lấy mẫu 60 s của T5 — T9 sampler dài / guard-watcher là
  luồng bắt cửa sổ nếu có sau khi T5 đóng.

### 5.4 Birefnet / u2net — kiểm tra tình trạng theo quy trình đứng

- **Birefnet: KHÔNG thử** (brief loại trừ; việc của T9 theo quyết
  §12.3(f) đợt 137; RAM xa guard — xem §5.1/§5.3). Birefnet vẫn 0
  lần chạy thành công trong gói (tính tới lúc T5 đóng).
- **u2net (fallback chính thức) — sẵn sàng trên đĩa:** rembg
  **2.0.87** trong `server/bgremove/.venv` (có `bin/rembg` +
  `import rembg` chạy được trong venv, in đúng version); `~/.u2net`
  có `u2net.onnx`, `u2netp/`, `birefnet-general.onnx`, `models/`
  218M (gồm `birefnet-general-lite/`). T5 KHÔNG chạy thử u2net
  (không thuộc brief; chỉ kiểm sự hiện diện).
- Guard **6.144 MiB GIỮ NGUYÊN** (quyết §12.3(d) đợt 138 + quyết
  (n) đợt 144).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 5 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 141 mở (T5) / cuối (T5) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| Đợt 143 mở (T5) / cuối (T5) | 1498 / 1494 | boot 70a5b0fc |
| Đợt 144 mở (T5) / cuối (T5) | 1289 / 1193 | boot 691a7403 / cc222c8a |
| **Đợt 145 mở (T5, 08:43Z)** | **1074** | **boot e146ca67, headroom-open.txt** |
| **Đợt 145 cuối (T5, 09:23Z)** | **1070** | **boot e146ca67, headroom-end.txt** |

- Giảm −219 so với mở đợt 144 (1289 → 1074) và −123 so với cuối
  đợt 144 (1193 → 1070); trong đợt gần như không đổi (−4).
  **Vẫn DƯỚI ngưỡng báo user (< ~1.800)** — theo quyết parent
  (k) đợt 144 (chỉ theo dõi, không hành động mới, không nhắc lại
  riêng), đợt này **chỉ theo dõi, không báo riêng, không tự đổi
  gì**. Tỉ lệ/vite: ~0,68 (mở) → ~0,68 (cuối) — lần thứ 3 liên
  tiếp dưới 1,0.
- Caveat (F-145-T5-4): fd cell-visible (`ls /proc/*/fd | wc -l`,
  cùng cách đếm các đợt) rơi mạnh **685 (lúc đo mở) → 683 (sau
  probe mở) → 305 (lúc đo cuối)**. Mức 685 lúc mở cao hơn hẳn
  đợt 144 (429 → 504 → 548) — lúc đó nhiều luồng đợt 145 vừa
  khởi động (vite + poller + sampler); mức 305 lúc cuối thấp hơn
  hẳn — nhiều luồng đã xong. Đếm fd biến động mạnh theo luồng
  đang chạy, không phải thành phần ổn định của headroom; headroom
  tự nó gần như không đổi trong đợt (1074 → 1070) nên đà giảm
  −219 so với đợt 144 là đà dài hạn thật, không phải nhiễu lúc đo
  mở. T9-145 đo độc lập để đối chiếu.
- Cửa sổ thoáng ngay sau boot (>20.000, T9-143): T5 KHÔNG đo lại
  đợt này (đo mở lúc boot +47 phút đã về 1074 — cửa sổ chỉ tồn
  tại ~1 phút đầu sau boot theo T9-142; quyết (k) đợt 144 đã ghi
  caveat này).

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 6,8G trống** (đo 08:46Z + 09:23Z —
  không đổi); `/tmp` tmpfs 512M, 497M trống. Không có ENOSPC nào
  trong phiên ngoài ENOSPC inotify có chủ đích của probe K8
  (errno 28 khi hết watch — đó là cách đo headroom, không phải
  lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại
  (symlink → `../vite/bin/vite.js`, mtime 09/11 không đổi) — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock). T4-145 chạy vite cho lượt yên #20 trên boot này
  (việc của T4).

## 7. EPERM scan + WFS #51 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #64 (T2-145): ok=2 fail=0, boot=e146ca67, 08:41:32Z**
  (`eperm-probe-v2.log`: 181 → **184 dòng (+3 đúng prereg)**:
  1 dòng DEAD-detected + 1 dòng boot-changed + 1 dòng probe #64).
  Probe #64 chạy ngay khi T2-145 mở (08:41:32Z, ~13 s sau khi T5
  mở 08:41:19Z) — cùng boot e146ca67 mà T5 đang kiểm.
- **Mù #64 MỚI MỞ** (từ đợt 144) — T2-145 xử lý (probe #64 +
  gap #107?→#108? + khung chết #107?/boot cc222c8a); T5 không
  phán mù.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142/T5-143/T5-144).
- Lưu ý log probe: dòng `boot changed` ghi **691a7403 →
  e146ca67**, bỏ qua boot trung gian cc222c8a — vì probe chết
  theo reboot #31 (last #63 05:43:32Z, DEAD-detected 08:41:26Z
  age 10.674 s) và chỉ tỉnh lại sau reboot #32; đây là giới hạn
  của probe log, không phải dữ kiện về boot (T2-145 có
  boot-verify.txt riêng xác nhận e146ca67, btime 1795074976).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 viết; lần kiểm cuối 09:23Z — log dừng ở probe #64).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–144).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #51 (T5 chạy, 08:43:18–08:44:31Z, 73 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round145-t5, **đổi OUT round144-t5 → round145-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round145-t5, không
  còn tham chiếu round cũ nào trong script; grep `round144` sau
  sed = 0). Kết quả:
  - NEWSTD: **965 dòng / 272 file** (phạm vi 3.206 file);
  - R7b đối chiếu: **990 dòng / 289 file** (phạm vi 12.599 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43–51.
  - Đối chiếu chéo: 965+25=990=R7b, **chênh 0**.
- **+1 dòng / +1 file so với lần 50 (T5)** (964/271 → 965/272),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #50
  còn nguyên trong round144-t5/): diff wfs-newstd.txt #50→#51 chỉ
  ra đúng **1 dòng thêm: `./docs/PHASE9_ROUND144_T5_INFRA_LIMITS.md:1`**
  (file LIMITS T5-144 hoàn thành sau quét #50); 0 file nào đổi số
  hit, không file nào mất hit. Phạm vi quét tăng 3.197 → 3.206
  file (+9 — docs mới đợt 144) nhưng chỉ 1 file có hit.
- **Kết luận: 51 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #64 (tính tới thời điểm quét).

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
  để né EPERM trong mù #64.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–144). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **F-145-T5-1 — Tiền đề quyết (j) đợt 144 cần parent xem lại:**
   apt history.log CŨNG reset mỗi reboot — quyết (j) ("chấp nhận
   đọc apt history.log thay thế; không lập quy trình snapshot
   mới") dựa trên tiền đề history.log giữ lịch sử boot cũ, nay
   chứng minh là sai một nửa. Bằng chứng thay thế đáng tin cho
   đối chiếu kiểu B4 là (a) số đo dpkg.log đóng băng T5 đã ghi
   trên workspace bền trước reboot + (b) ps exact-comm của T4
   trong cửa sổ. Hỏi parent: cập nhật quyết (j) theo hướng này
   hay giữ nguyên văn bản (thực hành đã là (a)+(b))? T5-146 vẫn
   làm theo thực hành (a)+(b) cho tới khi parent quyết khác.
2. **Lượt yên WebKit #20: ĐANG ĐO Ở ĐỢT 145 (việc T4-145).**
   Quyết parent (b) đợt 144: đợt 145 đo #20 (sau khi #19 đã được
   chấp nhận qua hậu kiểm attempt3, cộng dồn lên 16 lượt);
   ngân sách retry = 3 attempt/đợt (không tính attempt bị reboot
   giết); vá B4 + sampler + attempt-tagging giao T4-145. Cờ
   POSTBOOT_PASS của T5 đã ghi 08:45:28Z poll=2 cho boot e146ca67
   (T4 đọc cờ hoặc dùng T4-check-only). Lưu ý: sampler T5 ghi 6
   mẫu dưới gate A liên tiếp 09:11:50–09:16:50Z — nếu attempt #20
   chạy trong khoảng này thì gate A đóng (T4 có sampler riêng để
   đối chiếu; T5 chỉ ghi nhận).
3. **Balloon 0/40 mẫu ghim trần — T9 XÁC NHẬN ĐỘC LẬP XEM ĐÓNG BĂNG
   ĐÃ HẾT HAY CHỈ XẢ TẠM.** Sampler T5 chỉ phủ ~40 phút, đợt thứ
   2 liên tiếp 0 mẫu ghim; T9 sampler dài là chuẩn dài hạn. Nếu
   T9 cũng ghi 0 mẫu ghim thì mới bàn tới việc đóng băng đã hết
   (xem §5.2).
4. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (đỉnh cao nhất 63,8% guard lúc 08:57:50Z
   — gần nhất nhiều đợt nhưng vẫn thiếu ~2.224 MiB, chỉ tồn tại
   1 mẫu). T9 sampler dài / guard-watcher là luồng bắt cửa sổ nếu
   có sau khi T5 đóng; guard 6.144 MiB GIỮ NGUYÊN (quyết (n) đợt
   144). u2net là fallback chính thức (đã kiểm sự hiện diện —
   xem §5.4).
5. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Cộng dồn lượt
   yên hợp lệ = 16 sau quyết (b) đợt 144 (attempt3 làm #19);
   đợt 145 đo #20.
6. **Headroom VẪN DƯỚI NGƯỠNG BÁO (1074 mở → 1070 cuối):**
   chỉ theo dõi, không báo riêng (quyết parent (k) đợt 144).
   Đà giảm so với đợt 144 là −219 (mở) / −123 (cuối) — đà dài
   hạn thật (headroom trong đợt gần như không đổi −4); T9 đối
   chiếu độc lập.
7. **Cache apt sống/không sống qua reboot là KHÔNG NHẤT QUÁN
   (F-141-T5-4 giữ nguyên):** đợt này cache sống qua reboot
   (178 .deb — khác 180 đợt 141/143/144, chênh 2 file, du vẫn
   156M); đợt 142/143: 0 .deb. T5 đợt sau vẫn kiểm cache ngay lúc
   mở boot mới, không giả định trước.
8. **Replay CHẠY TỐT 3 boot liên tiếp** (691a7403, cc222c8a,
   e146ca67 — đều 1545/221, +3m53s đến +4m53s) — sau 3 lần chết
   dạng (B) trong 4 đợt gần nhất (#76?/90392aa5/bde599df/70a5b0fc).
   Dạng (B) không biến mất (vẫn có thể quay lại đợt sau); §8.2(B)
   form B + luật (C) giữ nguyên, không đổi luật nào đợt này.
   **KHÔNG cần --repair lần nào đợt này** (lần thứ 2 liên tiếp
   kể từ đợt 144).
9. **Mù #64 MỚI MỞ (T2-145: probe #64 + gap #107?→#108? +
   khung chết #107?/boot cc222c8a)** — việc T2; T5 chỉ đối chiếu
   probe #64 (ok=2 fail=0). **CERT 64 / FULL 79 (quyết parent
   (c) đợt 144 — đã xác nhận)**; chuỗi INSIDE 2 làm chuẩn, chờ
   T2-145 xác nhận cc222c8a INSIDE đưa chuỗi lên 3.
10. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 144 §11: G1 chờ
    user quyết; ci-security.yml vẫn 403 chờ user; file oversize
    6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` vẫn
    chưa quyết số phận; TTS 39 cấm kiểm lại; release gate không
    đổi + KHÔNG push khi user chưa nhắn "push đi"; R9 (a) vẫn chờ
    user (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần (`4b156a7d…` → `3299e2c4…`, dòng
  `say`, KHÔNG đổi logic — xem §3.8).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-145 probe #64
  ok=2 fail=0). WFS scan #51 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1).
- Postboot boot e146ca67: PASS ngay poll0 (08:43:04Z) + poll1 +
  poll0b + poll2 (09:23:25Z); cờ ghi 08:45:28Z poll=2.
  **KHÔNG chạy --repair lần nào.**
  **Watcher 60-phút: KHÔNG lập** (replay đã xong trước khi T5 mở).
  Luật (C): KHÔNG kích hoạt (không có replay kẹt + postboot FAIL
  kéo dài).
- B4 đối chiếu: **KHÔNG có apt-get trong cửa sổ attempt2/3**
  (xem §3.7) — ủng hộ quyết parent (b) đợt 144.
- Headroom: 1074 (mở) → **1070 (cuối)** — VẪN DƯỚI ngưỡng báo
  ~1.800, lần thứ 5 liên tiếp, chỉ theo dõi.
- RAM phiên T5 (1 series n=40, xem §5): avail 586.928–4.014.444
  kB (mean 1.807.166), balloon 2.876.344–5.646.236 kB (mean
  4.662.095), gate A 34/40, max **63,8% guard**, 0 mẫu ở trần
  guard; **balloon 0/40 mẫu ghim trần kẹt** (xem §5.2). RAM lúc
  đóng 1.174.556 kB, balloon 5.749.500 kB.
- **0 reboot trong phiên T5** (reboot #32 xảy ra trước khi mở).
- **started_at lượt 145:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10).

## 11. Sai số F-145-T5-n (mọi sai số của luồng T5 đợt này)

- **F-145-T5-1 — apt history.log CŨNG reset mỗi reboot (phát
  hiện mới, quan trọng nhất).** Tiền đề quyết parent (j) đợt 144
  ("history.log đủ làm bằng chứng thay thế") sai một nửa: file
  live chỉ còn replay boot hiện tại (50 Start-Date,
  07:57:37–08:00:09Z). Chỉ os-intent state sống qua reboot, và
  ledger của nó là 1 snapshot compacted duy nhất (ts 03:13:53Z),
  không có timing theo boot. Hệ quả: đối chiếu B4 cho boot cũ
  phải dựa vào số đo dpkg.log đóng băng trên workspace bền +
  ps exact-comm của T4 — đã làm đúng cho B4 đợt này (xem §3.7).
  Hỏi parent có cập nhật quyết (j) không (xem §9.1).
- **F-145-T5-2 — Dùng cờ `--check-only` không tồn tại lúc chạy
  postboot lần đầu.** Script chỉ nhận `--repair` /
  `--launch-test`; không tham số = chỉ kiểm. Lần chạy đầu exit 2,
  không tác dụng phụ; chạy lại không tham số thì PASS ngay
  (poll0 08:43:04Z). Ghi lại để đợt sau không lặp lại; các LIMITS
  đợt trước viết "check-only" là chỉ cách gọi không tham số.
- **F-145-T5-3 — Đếm GST lần đầu nhầm thư mục.** T5 đếm
  `/usr/share/gstreamer-1.0` = 18 file rồi mới xác định đúng thư
  mục là `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` = 269 file
  (postboot script xác nhận 269/269). Đã sửa ngay trong phiên;
  số 269 trong LIMITS này là số đúng. Ghi lại để đợt sau đếm
  đúng thư mục ngay từ đầu.
- **F-145-T5-4 — fd cell-visible biến động mạnh (caveat, không
  phải lỗi đo).** `ls /proc/*/fd | wc -l`: 685 (mở) → 683 (sau
  probe mở) → 305 (cuối). Mức mở cao (nhiều luồng vừa khởi động)
  và mức cuối thấp (nhiều luồng đã xong) đều là hệ quả của số
  luồng đang chạy, không phản ánh headroom (1074 → 1070 gần như
  không đổi). T5 ghi lại để T9/T10 không đọc số fd như chỉ báo
  headroom.
- **F-145-T5-5 — Đính chính khung F-144-T9-9 (không phải lỗi của
  T5).** Điểm quan sát 07:59Z libpipewire của T9 thuộc replay
  boot e146ca67 (install 07:58:51Z theo dpkg.log hiện tại), không
  phải replay cc222c8a chạy tiếp. Hai điểm quan sát của T9 ở trên
  2 boot khác nhau; không điểm nào trong cửa sổ B4. Ghi ở §3.7
  để T10 đối chiếu khi gộp, không sửa LIMITS T9-144.

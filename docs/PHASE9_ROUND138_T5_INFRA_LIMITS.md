# PHASE9_ROUND138_T5_INFRA_LIMITS — REBOOT GIỮA LUỘT lần 2 trong 2 đợt (sự kiện #19?): boot #94? (17db9652) CHẾT 11:52:20Z đúng lúc RAM chạm 98,6% guard birefnet (T2: 6.204.548 kB lúc 11:51:36Z; T5: 97,2% lúc 11:51:59Z) + boot mới 914964c3 kẹt update → luật (C) kích hoạt LẦN ĐẦU (kill 802, --repair PASS, cờ viết 12:22:38Z poll 28) + WFS #44 chênh 0 (có 1 sai số ghi đè của T5 — xem F-138-T5-1) + headroom 2065→2058→2056

> Luồng T5, đợt 138, lượt cron 18:35 +07 18/11/2026 (mở 11:35Z 18/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **2 BOOT trong phiên T5:** boot lúc mở **17db9652 = #94?**
> (đã xác nhận theo quyết parent đợt 137 §12.3(g)); **CHẾT giữa lượt
> 11:52:20Z** (khung (11:52:12Z, 11:52:20Z], ~8 s — hẹp nhất từ trước
> tới nay); boot mới **914964c3** (btime 11:52:20Z, số thứ tự chờ T6
> xác nhận — dự kiến #95? theo quy ước). Nhiệm vụ đợt này thuần
> infra: kiểm cây, sampler RAM, chốt dpkg replay boot #94?, EPERM/
> WFS/writeFile scan, tình trạng chung infra — **+ postboot/watcher
> cho boot mới** theo tiền lệ T5-137 (reboot giữa lượt thì T5 làm lại
> postboot từ đầu cho boot mới). **KHÔNG có pha 2 (c2)** — điều tra
> (c2) đã ĐÓNG theo quyết parent đợt 137 §12.3(a) (giám sát thụ động
> thuộc T4). KHÔNG push. KHÔNG release/tag. KHÔNG sửa production
> (preview.tsx giữ 530e10a7). KHÔNG tự chạy birefnet (thuộc T9 theo
> quyết parent đợt 137 §12.3(f) — T5 CHỈ quan sát + báo cáo).

## 1. Kết luận ngắn

1. **BOOT #94? (17db9652) REPLAY CHỐT XONG HẲN — RỒI CHẾT GIỮA LUỘT.**
   dpkg.log **đóng băng ở 1545 dòng / 221 installs / 462 dòng chứa
   "configure"** từ 09:42:06Z (gói cuối gstreamer1.0-tools) — TRÙNG
   KHỚP bracket chuẩn #92? (1.545/221/462, T2-137 §2.1) từng dòng
   đếm; md5 `a3aae6eb…` không đổi suốt thời gian boot #94? còn sống
   (11:37–11:52Z); 0 proc apt/dpkg; cache apt 178 .deb / 156M;
   lists 71; partial 0; GST 269/269; **postboot PASS exit 0** (chạy
   lại 11:39Z). Bracket tạm 566/83/170 của T2-137 là của boot
   **#93?** (replay dở, chết giữa lượt) — KHÔNG phải của #94?
   (xem §3, đính chính cách ghi của brief).
2. **CÂY KHÔNG ĐỔI QUA REBOOT:** preview.tsx **530e10a7** (mở /
   giữa / cuối + kiểm lại trên boot mới 11:53:45Z), media.ts
   **2c384ed1**, vite.config.ts **ee80d093**; postboot script sửa
   1 lần cho boot mới (`02ea211f…` → `d4a33a9e…`, chỉ header +
   dòng `say`, KHÔNG đổi logic — xem §3.4).
3. **RAM SAMPLER: SUÝT VƯỢT GUARD — REBOOT CẮT ĐÚNG LÚC.** Mẫu T5
   trên boot #94? (n=14, 60 s/mẫu, 11:38:58–11:51:59Z — sampler
   CHẾT theo reboot): min **765.684 kB**, max **6.112.624 kB lúc
   11:51:59Z = 5.969,4 MiB = 97,2% guard 6.144 MiB** (thiếu
   178.832 kB ≈ 174,6 MiB); balloon xả 6.079.100 → 716.868 kB.
   Đà tăng 3 mẫu cuối (5.694.652 → 5.731.140 → 6.112.624 kB) cho
   thấy cửa sổ vượt guard SẮP MỞ thì reboot 11:52:20Z cắt đứt —
   **không có mẫu nào ≥ 6.144 MiB; không ai kịp thử birefnet.**
   T4 poll #12 (11:51:27Z) độc lập thấy 6.062 MB; **T2-138 kiểm
   cuối 11:51:36Z thấy 6.204.548 kB = 98,6% guard — đỉnh cao
   nhất toàn đợt, thiếu chỉ ~85 MiB** (xem §5.1). T9 sampler thấy
   5.863.552 kB trên boot MỚI lúc +31 s (balloon chưa phình lại).
   Sampler boot2 của T5 đã chạy lại (xem §5).
4. **REBOOT GIỮA LUỘT #19? (chờ T6/T10 chốt số sự kiện): boot #94?
   chết trong khung T2-xác-nhận (11:51:36Z, 11:52:20Z] (44 s) —
   khung hẹp nhất gộp mọi bằng chứng (11:52:12Z, 11:52:20Z]
   (~8 s, mốc cuối T4 poll #13); boot mới 914964c3 replay
   KẸT ở apt-get update (pid 802, 0% CPU 20 phút, partial đóng băng
   46 file) → **luật (C) KÍCH HOẠCH LẦN ĐẦU TIÊN** (5/5, cờ
   REPAIR_TRIGGERED 12:14:14Z) → kill SIGTERM 802 → wrapper chết
   theo → `--repair` 1 lần CÓ GIÁM SÁT, **PASS exit 0**
   (~12:21:20Z, đủ 11 gói + GST 269) → watcher b92 ghi cờ mới
   **12:22:38Z poll 28**; T4 đã đọc cờ (poll #36, 12:26:08Z).
   Xem §2 (mốc reboot) + §3.5.
5. **HEADROOM inotify: 2065** (mở, boot #94?) → **2058** (mở boot
   mới) → **2056** (cuối) — giảm ~103 so với cuối đợt 137 (2168);
   vẫn trên ngưỡng báo user (< ~1.800) ~256, chỉ theo dõi (quyết
   §12.3(j)). Vite chạy được (vite/6.4.5, node v24.22.1). Disk `/`
   6,7G trống.
6. **EPERM: probe #57 ok=2 fail=0** (T2-138, 11:39:07Z, boot
   #94?); log probe 0 dòng sóng; eperm-now.txt vẫn `x`.
   **WFS scan #44: chênh 0** — NEWSTD 913/255, R7b 938/272,
   copies 25/17; 913+25=938 ✓; delta +6/+2 so với #43 giải thích
   đúng hết bằng 2 file LIMITS mới (xem §7).
   **Async `.writeFile(`: đúng 2 helper đã biết, 0 stray.**
7. **SAI SỐ LỚN CỦA T5 (F-138-T5-1):** script scan-wfs T5 copy
   còn trỏ OUT về `round137-t2` (bản T2-138 chưa đổi OUT) nên lần
   chạy scan #44 đã **ghi đè 7 file bằng chứng thô của scan #43**
   (T2-137) trước khi T5 phát hiện. Số tổng kết #43 còn nguyên
   trong LIMITS T2-137 §2.7 (907/253, R7b 932/270, copies 25/17);
   file thô #43 KHÔNG khôi phục được. File #44 đã chuyển về
   `round138-t5/` đúng chỗ. **Cập nhật lúc đóng: T2 ĐÃ SỬA OUT
   trước khi chạy** (xác minh 12:27Z — scan T2 11:48:37Z ghi
   đúng `round138-t2/`, không ghi đè gì thêm; xem §7.4).
8. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM: "read kernel buffer
   failed: Operation not permitted"); journalctl -k rỗng — đúng
   như quyết parent §12.3(h) đã chấp nhận bước 4 như hiện tại.
9. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
   G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 2 boot trong 1 phiên (reboot giữa lượt 11:52:20Z)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 17db9652 (#94?) | 09:36:01 (uptime -s) / 09:36:16 (stat /proc/1) | ~2h02m lúc T5 mở → ~2h16m lúc chết | Replay xong hẳn từ 09:42:06Z (boot +6m05s); postboot PASS; cờ POSTBOOT_PASS đợt 137 còn hiệu lực cho boot này (09:43:47Z, round137-t5/); **CHẾT giữa lượt — khung T2-xác-nhận (11:51:36Z, 11:52:20Z] (44 s); khung hẹp nhất gộp mọi bằng chứng (11:52:12Z, 11:52:20Z] (~8 s)** — xem mốc chi tiết dưới bảng |
| 2 | 914964c3 (số chờ T6 — dự kiến #95?) | 11:52:20 (uptime -s) / 11:52:36 (stat /proc/1) | còn sống (lúc T5 đóng ~36 phút) | Replay KẸT ở apt-get update → luật (C) kích hoạt → kill 802 → `--repair` PASS → watcher b92 ghi cờ 12:22:38Z poll 28; T4 đã đọc cờ |

- **Mốc reboot (tách biệt trước/sau — follow-up parent đợt 138):**
  boot hiện tại xác minh lại 12:34:00Z vẫn là **914964c3,
  btime 11:52:20Z** (uptime -s; /proc/1 11:52:36Z) — không có
  reboot thứ 2.
  - **Khung T2-xác-nhận (11:51:36Z, 11:52:20Z] (44 s):** T2-138
    §6 — lần kiểm cuối của T2 còn thấy 17db9652 lúc **11:51:36Z**
    (uptime -s 09:36:01Z, MemAvailable **6.204.548 kB**); T2 phát
    hiện reboot lúc đóng phiên 11:55:20Z; btime boot mới
    11:52:20Z. T2 ghi rõ các file T2 viết trong 11:52–11:55Z nằm
    vắt qua reboot nên KHÔNG dùng làm mốc.
  - **Khung hẹp nhất gộp mọi bằng chứng (11:52:12Z, 11:52:20Z]
    (~8 s — hẹp nhất từ trước tới nay):** mốc cuối còn sống là
    T4 poll #13 11:52:12Z (dpkg 1545, postboot exit 0, RAM 5975
    MB, tree YES 530e10a7); mốc đầu chết là btime boot 2
    11:52:20Z (uptime -s). Sampler T5 mẫu cuối 11:51:59Z (RAM
    6.112.624 kB) và T2 kiểm 11:51:36Z đều nằm TRONG khung
    T2-xác-nhận, không mâu thuẫn — khung T2 là bracket bảo thủ
    từ dữ liệu riêng của T2, khung hẹp là bracket chặt nhất khi
    gộp thêm poll T4 + sampler T5. **Khung chết chuẩn cuối cùng
    chờ T2-139 chốt từ merged mù #58** (T2 §6; mù #58 nay chứa
    1 reboot này).
  - Gap danh nghĩa #94?→#95? = 11:52:20Z − 09:36:01Z =
    **8.179 s (2h16'19")** (T2 §6; T2-139 chứng nhận theo merged
    mù #58). Boot mới: T2 đo MemAvailable 1.346.120 kB lúc
    11:55:34Z — đồng thuận với sampler boot2 của T5 (1.377.596
    kB lúc 11:56:48Z, poll 1 11:55:27Z 1.326 MB).
  - **Trạng thái replay boot #95? (theo follow-up parent):**
    dpkg.log boot mới lúc T2 kiểm (11:55:49Z) chỉ có **2 dòng**
    (startup packages configure 11:53:11Z/11:53:12Z) — replay
    MỚI BẮT ĐẦU (boot +51 s); bracket chuẩn #95? thuộc về
    T2-139/T5-139. **Replay #94? đã XONG hẳn: 1.545 dòng / 221
    installs / 462 configure** (T2 xác nhận; T5-138 đối chiếu
    và chốt ở §3.1–§3.2 — bracket 566/83/170 là của #93?, không
    phải #94?). Mọi số liệu trước/sau reboot trong LIMITS này
    ghi tách biệt theo 2 boot (§2, §3.1–§3.3, §5.1 vs §5.2).
- Reboot giết: sampler RAM T5 (mẫu cuối 11:51:59Z) + poller T4
  (poll #13 cuối 11:52:12Z) + session exec/sleep của T5 (runtime
  restart — 2 lệnh sleep của T5 bị gián đoạn, xem F-138-T5-4) +
  sampler dài của T9 (T9 đã restart 11:53:32Z — xem §5).
- Chênh btime 16 s ở boot 2 (uptime -s 11:52:20Z vs stat /proc/1
  11:52:36Z; `who -b` khớp uptime -s) — cùng mẫu 15–16 s như mọi
  boot trước, không phải mâu thuẫn. Boot 1 chênh 15 s (09:36:01Z
  vs 09:36:16Z; journal first entry 09:36:17Z theo T2-138
  boot-verify). Số boot **#94? ĐÃ XÁC NHẬN** (quyết parent đợt
  137 §12.3(g)(ii) theo quy ước headline tối đa 1 ẩn; số cộng dồn
  #95?–#97? chỉ ghi kèm, không làm số chính). Số boot mới
  **chờ T6 xác nhận** (dự kiến #95? nếu không có ẩn mới — T6
  đối chiếu chuỗi boot; T5 không tự đánh số).

- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 138** do
  parent tạo (11:36:39Z, ghi rõ "Đợt 138 ĐANG CHẠY… 9 luồng T1–T9
  spawn song song lúc 11:37Z; T10 đóng sổ sau khi đủ 9/9 cờ. Hạn
  cứng đóng sổ ~14:00Z") — KHÔNG phải đợt main-chat (tiền lệ đợt
  130–137). T5 tiến hành bình thường.
- Khung chết #93? chuẩn **(09:35:47Z, 09:36:01Z] (14 s)** đã được
  parent xác nhận ở §12.3(g)(iii) đợt 137 — T5 không kiểm lại
  (không có dữ kiện mới; việc của T6 nếu cần).

## 3. dpkg replay boot #94? — CHỐT XONG HẲN (đối chiếu 3 nguồn)

### 3.1 Đính chính: bracket 566/83/170 là của #93?, không phải #94?

Brief T5-138 ghi "(đợt 137 T2 ghi bracket tạm 566 dòng/83 installs/
170 configure lúc 09:06Z; T5-137 xác nhận chính thức — đối chiếu và
chốt)". Đối chiếu T2-137 LIMITS §2.1 + bảng §2.1:

- **566 dòng / 83 installs / 170 configure** là bracket T2-137 đọc
  lần 3 (09:01:59Z) và lần 4 (09:05:48Z, lặng 4'06") trên boot
  **2104246b = #93?** — replay ĐANG CHẠY lúc đó (lần ghi cuối
  09:01:42Z, fontconfig). T2-137 ghi rõ: "**Bracket này là số tạm
  lúc đóng, KHÔNG phải bracket chuẩn**" + F-137-T2-5 (không lấy
  lần đọc đầu làm bracket chuẩn).
- T5-137 xác nhận chính thức sau đó: replay #93? **CHẾT DỞ**
  (110 installs / 753 dòng lúc boot chết ~09:35:5xZ; cờ không kịp
  viết) — bracket 566/83/170 do đó KHÔNG BAO GIỜ thành bracket
  chuẩn của #93?.
- Bracket chuẩn để đối chiếu cho #94? là bracket **#92?
  (1ca1feaa): 1.545 dòng / 221 installs / 462 configure** (T2-137
  §2.1 dòng 213) — replay cài từ cùng tập gói nên trùng baseline.

### 3.2 Số liệu chốt #94? (T5-138 đo trực tiếp + T4 poll #13 làm mốc cuối)

| Hạng mục | Lúc mở (11:37:48Z) | Mốc cuối còn sống (T4 poll #13, 11:52:12Z) | Đối chiếu |
|---|---|---|---|
| dpkg.log dòng | 1545 | 1545 | = baseline #92? ✓ |
| `status installed` | 221 | 221 (file đóng băng từ 09:42:06Z — không đổi tới lúc chết) | = baseline ✓ |
| dòng chứa `configure` | 462 | — | = baseline ✓ |
| action `configure` (cột 3) | 178 | — | — |
| action `install` (cột 3) | 169 | — | — |
| dòng `gstreamer` | 98 | — | — |
| dpkg.log md5 | `a3aae6eb…` | (file đã bị reset bởi boot mới — không đo lại được) | không đổi trong lúc boot còn sống ✓ |
| dpkg.log mtime | 09:42:06.53Z | (như vậy tới lúc chết — không có lần ghi nào sau 09:42:06Z) | đóng băng từ 09:42:06Z ✓ |
| gói cuối | gstreamer1.0-tools 09:42:06Z | như vậy | boot +6m05s ✓ |
| cache apt | 178 .deb / 156M | 178 / 156M | = số cuối đợt 137 ✓ |
| lists / partial | 71 / 0 | 71 / 0 | ✓ |
| GST hệ thống / debroot | 269 / 269 | 269 / 269 | = số cuối đợt 137 ✓ |
| term.log dòng `Get:` | 0 (980 dòng) | 0 | cài từ cache (nhất quán đợt 136–137) ✓ |
| proc apt/dpkg | 0 | 0 | replay đã dừng hẳn ✓ |
| postboot check | PASS exit 0 (11:39Z) | — (chỉ chạy 1 lần lúc mở) | đủ 11 gói + GST isomp4/libav ✓ |

- **Kết luận: replay boot #94? XONG HẲN.** Mọi chỉ số đóng băng
  từ 09:42:06Z (hơn 2 giờ trước lúc T5 mở) và trùng khớp baseline
  #92? từng dòng đếm. Không có lần ghi dpkg.log nào sau 09:42:06Z;
  không có proc apt/dpkg nào sống; cache/lists/GST ổn định.
  Bracket chuẩn #94?: **(configure 09:36:50Z = boot +49s, xong
  09:42:06Z = boot +6m05s, 1545 dòng / 221 installs / 462
  configure]** — khớp bracket T5-137 ghi cho boot 2 (§2.2).
- Cờ `POSTBOOT_PASS` đợt 137 (round137-t5/, boot 17db9652,
  pass_at 09:43:47Z poll 6) vẫn còn nguyên trên đĩa — T4-138 đã
  dùng cờ này (fallback) cho các poll #1–#13 trên boot #94?
  (t5flag=PASS, postboot exit 0, dpkg 1545). Sau reboot, T4-138
  reset gate 0 và chờ cờ MỚI trong round138-t5/ (xem
  poll-wait-t4-138.sh dòng 49) — cờ mới do watcher b92 ghi khi
  boot mới PASS ổn định (xem §3.3).

### 3.3 Boot mới 914964c3 — replay từ cache ĐANG CHẠY (watcher b92)

- Boot mới (btime 11:52:20Z): replay khởi động — configure
  11:53:11Z/11:53:12Z (boot +51s/+52s), apt-get update pid 802 +
  wrapper os-intent pid 781 đang chạy lúc +1m30s; **cache apt
  SỐNG QUA REBOOT: 178 .deb / 156M** (bằng số cuối boot #94?) —
  replay cài từ cache, dự kiến nhanh như boot #94? (+6m05s).
- Lúc T5 kiểm 11:53:45Z (boot +1m25s): dpkg.log **2 dòng / 0
  installs**, lists 3, partial 0, GST 0 file; RAM mở ~1.748 MB,
  Balloon 5.074.548 kB.
- Postboot poll0-boot2 (11:55:00Z): **FAIL exit 1** (đúng —
  replay mới chạy: thiếu 5 lib + GST + 11 gói apt; log
  `t5-postboot-poll0-boot2.log`).
- Watcher **b92 v6** (copy từ b91, chỉ đổi boot/header/đường dẫn
  — KHÔNG đổi logic C4/EVAL/luật (C)/ngưỡng poll; md5
  `1607b22a…`, `bash -n` OK; header đọc lại trước khi launch —
  xem F-138-T5-5): launch 11:55:27Z, `NO_FLAG_AT_START` (thư mục
  round138-t5/ mới, không có cờ stale — cờ cũ nằm ở round137-t5/,
  không đụng).
  - Poll 1 (11:55:27Z): dpkg=2, installs=0, frozen=no, silent
    135 s, apt-get pid 802 etime 02:13 CPU 0,0%, wrapper=1,
    lists=3, partial=20 (đang tăng — update đang download),
    GST 0, RAM 1.326 MB, postboot exit 1, TRIGGER=NO (đúng).
  - Poll 2 (11:56:27Z): dpkg=2, installs=0, frozen=yes, silent
    195 s, apt-get pid 802 etime 03:14 CPU 0,0%, partial=21
    (vẫn tăng), GST 0, RAM 1.295 MB, postboot exit 1,
    TRIGGER=NO (đúng). Luật (C): d_formC=yes nhưng b=no (partial
    đang tăng) → KHÔNG kích hoạt.
  - Poll 3–28 + kích hoạt luật (C) + repair: xem §3.3b + §3.5.

### 3.3b Kết cục watcher b92 + cờ boot mới (đóng)

- Poll 1–19 (11:55:27–12:13:34Z): dpkg=2, installs=0, postboot
  exit 1, TRIGGER=NO cả 19 poll (đúng — replay/update còn sống);
  RAM tụt 1.326 → 787 MB; partial 20 → 46 rồi đóng băng từ
  ~11:58:46Z; apt-get pid 802 etime tới 20:21, CPU 0,0%.
- Poll 20–26 (12:14:35–12:20:37Z): sau khi T5 kill 802 (12:14:20Z)
  và chạy `--repair` (12:15:29Z–~12:21:20Z) — poll 26 thấy
  apt-get pid 10946 (của repair) etime 00:48 CPU 3,2%, lists=75,
  GST 269 (symlink), postboot vẫn exit 1 (đang cài); TRIGGER=NO.
- Poll 27 (12:21:38Z): postboot_exit=0 (PASS đầu tiên), dpkg đã
  795 dòng (repair cài xong 12:21:19Z), frozen=no, TRIGGER=NO.
- Poll 28 (12:22:38Z): dpkg=795, installs=113, frozen=yes,
  silent 79 s, apt=0, wrapper=0, lists=75, partial=0, GST 269,
  RAM 550 MB, postboot exit 0 (PASS streak 2) →
  **FLAG_WRITTEN 12:22:38Z poll 28, exit 0**
  (`done_pass_stable_2polls`).
- Cờ: `POSTBOOT_PASS boot_id=914964c3-c36a-4893-bf24-d8321e75d299
  btime=2026-11-18T11:52:36Z pass_at=2026-11-18T12:22:38Z
  poll=28` — T4 đọc cờ ở poll #36 (12:26:08Z, ~3,5 phút sau
  khi ghi; t5flag=PASS(t5src=138-t5/POSTBOOT_PASS),
  postboot_exit=0, dpkg_lines=795). Không có lần mở nào bị bỏ lỡ
  (cờ cũ round137-t5/ được T4 đánh dấu stale cho boot mới —
  t5flag=cu — đúng quy trình).
- **TRIGGER=YES: 0 lần trong 28 poll.** Luật (C) không do watcher
  tự trigger (watcher chỉ ghi EVAL_C) — T5 kích hoạt bằng tay
  theo luật parent §12.4 đợt 122 sau kiểm chứng độc lập 5/5
  (xem §3.5).

### 3.5 Luật (C) KÍCH HOẠT LẦN ĐẦU TIÊN — kill apt-get update kẹt + `--repair` PASS

Chế độ lỗi: apt-get update pid 802 của replay boot mới SỐNG nhưng
KẸT — 20 phút 35 giây, cumulative CPU TIME 00:00:00, partial đóng
băng 46 file từ ~11:58:46Z, lists 3, dpkg 2 dòng / 0 installs.
Tiền lệ: boot #64? đợt 122 kẹt update 64+ phút nhưng luật (C)
KHÔNG kích hoạt (lists=111, điều kiện (d) không đạt); các đợt
123–137: (C) không kích hoạt lần nào. Đợt này (d) ĐẠT (lists=3)
nên (C) đủ 5/5 lần đầu tiên.

Kiểm chứng 5/5 (quyết parent đợt 122 §12.4 — PHẢI đủ cả 5):
| # | Điều kiện | Bằng chứng | Đạt? |
|---|---|---|---|
| (a) | postboot check-only FAIL tươi | watcher poll 19 12:13:34Z postboot_exit=1; poll0-boot2 11:55:00Z exit 1 | ✓ |
| (b) | apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15' VÀ dpkg.log im ≥15' (2 lần đọc cách nhau ≥15', không suy từ 1 lần) | check 1: poll 1 11:55:27Z (aptget etime 02:13 CPU 0,0%, dpkg=2); check 2: T5 trực tiếp 12:13:48Z (pid 802 etime 20:35, TIME 00:00:00, %CPU 0,0; partial 46, 0 file mới hơn 12:00Z, dir mtime 11:58:46Z; dpkg 2 dòng, last_line 11:53:12Z, silent 1222 s). Khoảng cách 18'21" ≥ 15' | ✓ |
| (c) | boot ≥60' tuổi HOẶC dpkg im ≥15' | dpkg im 1222 s (poll 19) ≥ 900 s (boot mới 21' tuổi — chưa đủ 60', nhưng vế im đã đủ) | ✓ |
| (d) | dạng (C): dpkg ≤2 dòng hoặc 0 install, lists trống | dpkg 2 dòng + 0 installs + lists 3 (auxfiles/lock/partial) | ✓ |
| (e) | không probe WebKit nào đang chạy trên boot đó | MiniBrowser 0 mọi poll; T4 chưa chạy attempt (đang chờ cờ) | ✓ |

Hành động (theo đúng luật — ghi cờ TRƯỚC khi làm gì):
1. **12:14:14Z — ghi cờ `REPAIR_TRIGGERED`** (round138-t5/,
   kèm PID 802 + bằng chứng 0% CPU + 2 lần đọc dpkg.log).
2. **12:14:20Z — kill SIGTERM pid 802** (ghi lệnh kill vào log
   watcher + REPAIR_TRIGGERED.log). 45 s sau (12:15:06Z): pid
   802 GONE (không cần SIGKILL); không còn proc apt methods
   nào; **wrapper pid 781 cũng chết theo** (thoát khi update
   con chết — replay KHÔNG tự tiếp tục sang installs; --repair
   trở thành đường duy nhất để có đủ gói trên boot này).
   Lock files tồn tại (0 byte) nhưng không còn proc nào giữ
   (dpkg --audit sạch; repair chạy được ngay sau đó).
3. **12:15:29Z–~12:21:20Z — chạy `postboot-check.sh --repair`
   MỘT LẦN có giám sát: REPAIR_EXIT=0 (PASS).** Diễn biến:
   GST symlink lại → debroot (269 file, vá tạm K1 ephemeral);
   `apt-get update OK` (mirror chạy lại được sau khi kill —
   stall là treo kết nối, không phải mirror chết); cài đủ 11
   gói (libevent-2.1-7t64, plugins-base/good/bad/ugly, -gl,
   -libav, -x, libavif16, libgstreamer1.0-0, libevdev2) +
   deps → dpkg.log 795 dòng / 113 installs (gói cuối libc-bin
   12:21:19Z); RE-CHECK: wrapper PASS, libs PASS (5 lib), GST
   PASS (isomp4 + libav), apt PASS (11 package). Kết luận:
   "DU DIEU KIEN chay WebKit".
4. **Chạy lại check-only sau repair: PASS exit 0** (12:21:37Z,
   log `t5-postboot-after-repair.log`) — đủ 11 gói + GST 269
   (symlink) + libs đủ.
- **Lưu ý trung thực:** repair chỉ cài 113 gói (11 gói đích +
  deps), KHÔNG phải đủ 221 gói của replay đầy đủ (thiếu các
  gói không thuộc NEED: aspell, fontconfig, libgtk… — postboot
  check không yêu cầu chúng). Boot này đủ điều kiện chạy
  WebKit theo gate postboot, nhưng dpkg set KHÁC với boot
  replay đầy đủ (795/113 vs 1545/221). GST là symlink ephemeral
  (mất sau reboot — như mọi vá K1). T10/T4 lưu ý khi đọc số
  dpkg của lượt yên #15 trên boot này.
- **(B) TRIGGER sau kill:** watcher poll 20–26 vẫn TRIGGER=NO
  (repair đang chạy, C2A=no); poll 27–28 postboot exit 0 nên
  C1=no → TRIGGER=NO. (B) không kích hoạt thêm lần nào — repair
  chỉ chạy ĐÚNG 1 lần theo luật (C) (once-only); không chạy
  repair lần 2.

### 3.4 Postboot script — sửa 1 lần cho boot mới (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5 `02ea211f…`
(cuối đợt 137) → **`d4a33a9e…`** (đợt 138, boot 914964c3):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 11:54–11:55Z | 914964c3 | `02ea211f…` → `d4a33a9e…` | header (đoạn Dot 138 boot mới) + say: boot #94? chết giữa lượt, RAM suýt vượt guard, replay boot mới từ cache — **chỉ mô tả trạng thái lúc mở, KHÔNG khẳng định kết quả poll0** (bài học F-136-T5-1) |

- `bash -n` OK sau khi sửa. **KHÔNG đổi logic** (không đổi thứ
  tự apt/GST, không đổi NEED/threshold).

## 4. Kiểm cây — md5 3 file lúc mở / giữa / cuối boot #94? + kiểm lại boot mới

| File | Lúc mở 11:37:48Z | Giữa 11:41:58Z | Trước reboot (mở boot mới 11:53:45Z) | Kết luận |
|---|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | 530e10a7 | KHÔNG ĐỔI qua reboot ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 02ea211f… | — | d4a33a9e… (sau 1 lần sửa cho boot mới, xem §3.4) | chỉ header + say, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này (không sửa, không revert).
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief + marker đợt 138, T5 không tự xác minh qua git).
- Không có file repo nào khác bị T5 sửa (xem §10).

## 5. Sampler RAM — SUÝT VƯỢT GUARD trên boot #94?, reboot cắt đúng lúc; boot mới chạy lại

### 5.1 Series boot #94? (T5, n=14, 60 s/mẫu, 11:38:58–11:51:59Z — CHẾT theo reboot)

Sampler chạy nền từ 11:38:58Z, ghi `round138-t5/ram-sampler.log`
(MemAvailable + Balloon từng mẫu). Mẫu cuối 11:51:59Z; reboot
11:52:20Z giết sampler trước mẫu thứ 15 (dự kiến 11:52:58Z).

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | Ghi chú |
|---|---|---|---|---|
| 1 | 11:38:58 | 765.684 | 6.079.100 | mở sampler |
| 2 | 11:39:58 | 1.137.936 | 5.722.604 | |
| 3 | 11:40:58 | 1.330.816 | 5.575.260 | |
| 4 | 11:41:58 | 1.327.960 | 5.483.484 | |
| 5 | 11:42:58 | 2.731.212 | 3.897.060 | balloon xả mạnh |
| 6 | 11:43:58 | 2.885.028 | 3.622.276 | |
| 7 | 11:44:58 | 2.518.272 | 3.945.664 | hồi nhẹ |
| 8 | 11:45:58 | 2.684.032 | 4.047.892 | |
| 9 | 11:46:58 | 2.498.676 | 4.244.960 | |
| 10 | 11:47:58 | 3.175.028 | 3.640.508 | |
| 11 | 11:48:59 | 4.413.372 | 2.379.748 | xả mạnh |
| 12 | 11:49:59 | 5.694.652 | 1.003.492 | |
| 13 | 11:50:59 | 5.731.140 | 1.052.100 | |
| 14 | 11:51:59 | **6.112.624** | **716.868** | **max phiên, 97,2% guard** |

- Min series: **765.684 kB** (11:38:58Z). Min tuyệt đối phiên T5
  (tính cả mẫu lẻ ngoài series): **636.400 kB** lúc 11:37:48Z
  (lúc mở). Max: **6.112.624 kB lúc 11:51:59Z = 5.969,4 MiB =
  97,2% guard 6.144 MiB (6.291.456 kB)** — thiếu **178.832 kB
  (≈ 174,6 MiB)** mới tới guard. **0 mẫu ≥ 6.144 MiB.**
- Balloon: 716.868–6.079.100 kB (xả ròng −5.362.232 kB trong
  13 phút — xả mạnh 2 đợt: 11:42–11:43Z và 11:47–11:51Z).
- Đà 3 mẫu cuối: 5.694.652 → 5.731.140 → 6.112.624 kB (+381.484
  kB trong 60 s cuối) — cửa sổ vượt guard SẮP MỞ thì reboot
  11:52:20Z cắt đứt (21 s sau mẫu cuối). **Không ai kịp thử
  birefnet** (T9 đã đóng cửa sổ đo cũ; T5 bị brief loại trừ).
- Đối chiếu độc lập:
  - **T4 poller** (cùng cửa sổ, boot #94?): poll #9 11:49:11Z
    4.866 MB → #10 5.650 MB → #11 5.716 MB → #12 11:51:27Z
    **6.062 MB** → #13 11:52:12Z 5.975 MB (đơn vị MB của
    `free -m` = MiB; 6.062 MiB ≈ 6.207.488 kB — cùng bậc với
    mẫu T5 6.112.624 kB lúc 11:51:59Z, chênh ~1,5% trong 32 s
    balloon đang xả — đồng thuận về bậc lớn, không ép khớp từng
    kB). T4 cũng thấy RAM ~6 GB ngay trước reboot.
  - **T2-138 (độc lập, lần kiểm cuối 11:51:36Z): MemAvailable
    6.204.548 kB = 6.059,1 MiB = 98,6% guard** — thiếu chỉ
    **86.908 kB (≈ 84,9 MiB)**; cao hơn max của T5 (6.112.624
    kB lúc 11:51:59Z) và là **đỉnh quan sát được cao nhất trên
    boot #94? trong toàn đợt**. T2 ghi "cửa sổ vượt guard có thể
    đang mở ra lúc T2 đóng" — đà hồi nhanh (balloon xả) rồi
    reboot 11:52:20Z cắt đứt 44 s sau. Kết luận "suýt vượt"
    của T5 được củng cố: 2 luồng độc lập đều thấy RAM ≥ 97%
    guard trong 1 phút cuối trước reboot.
- Tải song song lúc lấy mẫu (ghi theo quyết §12.3(c) đợt 137 —
  T4/T5 ghi load1/RAM kèm tickCost theo từng pass; phần tickCost
  thuộc T4, T5 chỉ ghi load/RAM cửa sổ của mình): load1 dao động
  1,22–3,86 trong phiên (mở 1,22; 11:41:03Z 3,24; 11:41:47Z
  2,14; 11:42:16Z 3,37; 11:53:45Z 3,86 trên boot mới — 9 luồng
  đợt 138 chạy song song + replay apt).
- So sánh: đợt 137 T5 quan sát được max 6.781.936 kB (09:00:26Z,
  VƯỢT guard — chớp ngắn, mẫu ~94 s sau chỉ còn 5.928 MB);
  đợt 138 max 6.112.624 kB (97,2% guard) — **suýt vượt lần thứ
  2 liên tiếp nhưng bị reboot cắt đứt trước khi chạm guard**.
  Cả hai lần đều là chớp ngắn do balloon xả, không phải mức RAM
  sẵn có bền vững.

### 5.2 Series boot mới 914964c3 (T5, chạy lại sau reboot — cập nhật lúc đóng)

- Sampler boot2: launch đầu 11:55:32Z KHÔNG nohup nên chết theo
  session exec (không ghi được mẫu nào — xem F-138-T5-4);
  **chạy lại với nohup 11:56:48Z**, 30 mẫu × 60 s, ghi
  `round138-t5/ram-sampler-boot2.log`, xong 12:26:49Z
  (`SAMPLER_BOOT2_DONE`).
- Kết quả boot2 (n=30, tính bằng code): min **449.768 kB lúc
  12:11:49Z**; max **1.377.596 kB lúc 11:56:48Z = 1.345,3 MiB =
  21,9% guard 6.144 MiB**; Balloon 5.419.556–6.443.824 kB.
  **0 mẫu ≥ 6.144 MiB trên boot2.** RAM tụt dần 1.378 → ~450 MB
  rồi lình xình 520–1.066 MB (balloon phình tối đa 6.443.824 kB
  từ 12:05:49Z — bằng trần đợt 137).
- Đối chiếu T9 sampler dài (restart 11:53:32Z sau reboot):
  mẫu 11:52:51Z trên boot mới (+31 s) **5.863.552 kB**
  (5.724,1 MiB = 93,1% guard; Balloon 979.012 kB — balloon
  chưa phình lại) rồi 11:53:32Z chỉ còn 1.862.908 kB (Balloon
  5.008.208 kB). **Boot mới cũng có chớp RAM cao ~5,86 GB
  trong ~30 s đầu sau boot** (trước khi balloon phình) — nhưng
  T9 là chủ quản số này; T5 chỉ ghi nhận đối chiếu (không tính
  vào max của mình vì không phải mẫu của T5).
- **T5 KHÔNG thử birefnet** (brief loại trừ; việc của T9 theo
  quyết §12.3(f): "T9 ở lại muộn hơn để bắt cửa sổ vượt guard;
  khi một sampler quan sát được available ≥ 6.144 MiB thì THỬ
  birefnet trong gói ngay"). Nếu cửa sổ mở SAU khi T5 đóng, T9
  (sampler dài tới 13:30Z) là luồng bắt được. u2net vẫn là
  fallback chính thức. Birefnet vẫn 0 lần chạy thành công trong
  gói (tính tới lúc T5 đóng).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 136 cuối (T5) | 2276 | boot 1ca1feaa |
| Đợt 137 mở boot 1 / mở boot 2 / cuối (T5) | 2178 / 2168 / 2168 | boot 2104246b / 17db9652 |
| **Đợt 138 mở (T5, 11:38Z)** | **2065** | **boot #94?, headroom-open.txt** |
| **Đợt 138 mở boot 2 (T5, 11:56Z)** | **2058** | **boot 914964c3, headroom-boot2-open.txt** |
| **Đợt 138 cuối (T5, 12:28Z)** | **2056** | **headroom-end.txt** |

- Giảm −103 so với cuối đợt 137 (2168 → 2065) rồi −7 qua reboot
  (2065 → 2058 — trong nhiễu đo, cùng boot mới) rồi −2 trong
  phiên boot mới (2058 → 2056); chuỗi dài hạn tiếp tục giảm đều
  (~100–110/đợt, 8 đợt gần nhất). Vẫn gấp ~1,3 lần số watch vite
  thường cần (~1.578). **Vite thường
  chạy được. Chưa tới ngưỡng báo user (< ~1.800) — chỉ theo dõi**
  (còn ~256; quyết parent đợt 137 §12.3(j) = quyết đợt 126
  §12(h)). Trần 63747 cần can thiệp host — ngoài tầm luồng này.
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **420 (lúc mở) → 370 (11:41Z)** — watch giữ ngoài
  cell như các đợt trước (~61k watch ngoài cell theo T9).

### 6.2 Disk

- Overlay `/`: 7,5G tổng, 594M đã dùng, **6,7G trống (8%)** lúc
  kiểm 11:42Z — đủ (đợt 137: 7,4G trống; tăng dùng ~425M do các
  file đợt 137 + node_modules — không phải vấn đề).
  `/tmp` tmpfs 512M, 497M trống (4% dùng).
- Không có ENOSPC nào ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` tồn tại; `vite --version` =
  **vite/6.4.5 linux-x64 node-v24.22.1** (chạy được, ~62 s gồm
  cả khởi động node trong lệnh gộp — không phải lỗi). T5 KHÔNG
  chạy dev server / build (không sửa production; việc của T8).

## 7. EPERM scan + WFS #44 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #57 (T2-138): ok=2 fail=0, boot=17db9652, 11:39:07Z**
  (`round138-t2/once.txt`, exit 0; status2 ALIVE, heartbeat
  fresh 4 s). Trước probe, status1 DEAD/STALE (heartbeat #56
  age 10.397 s — đúng, heartbeat từ probe #56 trên boot cũ;
  death được ghi vào log, không phải im lặng).
- T5 KHÔNG chạy probe riêng (phối hợp T2 để không đếm trùng sóng
  — tiền lệ T5-137). Probe #57 là probe đầu tiên trên boot #94?
  (probe #56 là trên #93?).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log` (57 dòng probe #1–#57):
  grep `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng**.
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #53→#54 (boot
  d2e66749→78b55838), #54→#55 (78b55838→1ca1feaa), #55→#56
  (1ca1feaa→2104246b), #56→#57 (2104246b→17db9652, age 10.397 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** Sweep đầy
  đủ của T2-138 (eperm-sweep57.py, `round138-t2/
  eperm-sweep-run.log`) ĐÃ CHẠY và đồng thuận: "sóng EPERM vẫn
  bật: 0", "CẢNH BÁO (10-phút): 0", "Operation not permitted: 0",
  "sóng EPERM đã tắt: 2" — cả 2 đều trong
  `round137-t10/t10-o8.log` (dòng launcher 10:31:09Z +
  10:32:04Z — **dương tính giả đã biết**, cùng 2 dòng T2-137 đã
  phân loại); extended raw 'EPERM' matches: 8 total / 8 unique
  (2 dòng "đã tắt" + 6 dòng test-pass hasEperm). EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #44 (T5 chạy lại, 11:40:01–11:40:18Z, 18 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round138-t2,
  copy sang round138-t5, đổi OUT — xem F-138-T5-1 về lỗi OUT lúc
  đầu). Kết quả:
  - NEWSTD: **913 dòng / 255 file** (phạm vi 3.141 file);
  - R7b đối chiếu: **938 dòng / 272 file** (phạm vi 12.534 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43.
  - Đối chiếu chéo: 913+25=938=R7b, **chênh 0**.
- **+6 dòng / +2 file so với lần 43** (907/253 → 913/255), giải
  thích đúng hết (không diff được file thô #43 do F-138-T5-1,
  nhưng giải thích bằng mtime + số học — xem caveat dưới):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND137_T2_EPERM_LIMITS.md | +5 (0 → 5) | 09:15:11Z 18/11 | Tài liệu T2 đợt 137 (nhắc `writeFileSync` 5 lần); chốt SAU scan #43 (09:00:50Z) nên lần này mới vào |
  | docs/PHASE9_ROUND137_LIMITS.md | +1 (0 → 1) | 10:44:21Z 18/11 | LIMITS gộp đợt 137 (nhắc 1 lần); viết SAU scan #43 nên lần này mới vào |
- Phạm vi: 3.141 = 3.133 + 8 net (**8 file mới, 0 file mất** theo
  mtime: 8 file trong phạm vi có mtime sau 09:00:50Z 18/11 là
  đúng 8 LIMITS đợt 137 — T1, T2, T3, T4, T5, T7, T8 + gộp;
  2 file còn lại có mtime sau #43 — postboot-check.sh 09:38:08Z
  (sửa lần 2 đợt 137, 0 hit) + PHASE9_GAP_ANALYSIS.md 10:41:41Z
  (28 hit, xem dưới) — đã có trong phạm vi từ #43 nên không
  tính vào +8). Copies y hệt lần 43 (diff 0 dòng).
- PHASE9_GAP_ANALYSIS.md (28 hit, mtime 10:41:41Z — T10 cập nhật
  lúc đóng đợt 137): 28 dòng nhắc đều là nội dung lịch sử (các
  đợt 68–95), không phải dòng mới viết về scan; tổng delta +6
  được giải thích TRỌN VẸN bằng 5+1 của 2 file trên nên số hit
  của file này được suy là KHÔNG ĐỔI (28) giữa #43 và #44 —
  **suy luận số học, không phải đối chiếu trực tiếp** (file thô
  #43 đã mất do F-138-T5-1 — ghi rõ, không giấu).
- **Kết luận: 44 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #57.

### 7.4 F-138-T5-1 — T5 ghi đè file thô scan #43 (sai số mới, xem §11)

- (Tóm tắt; chi tiết ở §11.) Script scan-wfs T5 copy từ
  `round138-t2/scan-wfs.sh` vẫn có `OUT=…/round137-t2` (bản
  T2-138 chưa đổi OUT); lệnh `sed s|round138-t2|round138-t5|`
  của T5 không khớp nên OUT giữ nguyên — lần chạy 11:40:01Z đã
  **ghi đè 7 file thô scan #43 trong `round137-t2/`**
  (scan-meta.txt, files-newstd.bin, wfs-newstd.txt,
  files-r7b.bin, wfs-r7b.txt, files-copies.txt,
  wfs-copies.txt — mtime mới 11:40:02–11:40:18Z).
- T5 phát hiện ngay khi đọc lại OUT (11:41Z), đã **chuyển toàn
  bộ 7 file #44 về `round138-t5/`** đúng chỗ; `round137-t2/`
  nay chỉ còn `scan-wfs.sh` (không còn file scan nào).
- **Cập nhật lúc đóng — T2 ĐÃ SỬA OUT trước khi chạy:** T2-138
  chạy scan #44 của mình 11:48:37–11:49:13Z với OUT đúng
  `round138-t2` (xác minh 12:27Z: `OUT=…/round138-t2`, đủ 7
  file kết quả trong `round138-t2/`, không ghi đè gì thêm).
  Cảnh báo của T5 do đó đã lỗi thời — ghi rõ để khỏi đọc thành
  "T2 chưa sửa".
- **Đối chiếu chéo T2 vs T5 (2 lần quét #44 độc lập, cách nhau
  ~8,5 phút):** T2: NEWSTD 915/256 (phạm vi 3.146), R7b 940/273
  (phạm vi 12.539), copies 25/17; T5: NEWSTD 913/255 (3.141),
  R7b 938/272 (12.534), copies 25/17. Delta +2/+1 (cả NEWSTD
  lẫn R7b), copies y hệt. Diff 2 file wfs-newstd.txt: **chỉ
  khác đúng 1 dòng — `./docs/PHASE9_ROUND138_T5_INFRA_LIMITS.md:2`**
  (LIMITS này, tạo ~11:45Z giữa 2 lần quét, nhắc writeFileSync
  2 lần); phạm vi +5 = đúng 5 file mới (LIMITS này + T1-138 +
  DEF_v0.5 + T3-138 + T6-138; 3 file kia 0 hit — đã kiểm
  `grep -c` từng file). 915+25=940 ✓. **Hai lần quét độc lập
  khớp nhau sau khi giải thích delta — chênh 0 được củng cố.**
- Số tổng kết #43 còn nguyên trong LIMITS T2-137 §2.7
  (907/253, R7b 932/270, copies 25/17, phạm vi 3.133) — T10/T2
  đối chiếu #44 với số đó, không cần file thô.

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
  để né EPERM trong mù #57.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–137). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **Birefnet: vẫn 0 lần chạy thành công; cửa sổ vượt guard SUÝT
   MỞ trên boot #94? (max T5 6.112.624 kB = 97,2%; T2 độc lập
   6.204.548 kB = 98,6% lúc 11:51:36Z — đỉnh cao nhất toàn đợt)
   rồi bị reboot cắt đứt; trên boot mới max chỉ 1.377.596 kB
   (21,9% guard).**
   T9 sampler dài chạy tới 13:30Z — nếu cửa sổ mở trên boot mới,
   T9 thử theo quyết §12.3(f). u2net là fallback chính thức.
   Guard 6.144 MiB GIỮ NGUYÊN.
2. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Lượt yên #15
   (T4) ĐÃ CHẾT theo reboot (poller dừng ở poll #13, chưa chạy
   attempt — việc của T4: restart poller + chờ cờ mới round138-t5/
   rồi đo lại trên boot mới). T5 ghi load1/RAM cửa sổ mình (§5)
   để T10/T4 đối chiếu tương quan tải–median khi có số tickCost
   #15. Bàn lại ngưỡng chỉ khi #15 vượt 60 ms hoặc ba lượt liên
   tiếp ≥55 ms mà đã loại trừ tải.
3. **Lượt yên #15** — đo lại trên boot mới sau khi cờ round138-t5/
   được ghi (watcher b92). Cộng dồn giữ nguyên: **P1 28/28,
   P3 24/28, P7 14/14** (quy ước từng seq); DEF v0.5 (P5 34–52
   ms + P3' stall-based) đã chấp nhận, T3 viết ở đợt 138.
4. **Reboot giữa lượt #19? + khung chết #94?** — T2-138 §6 đã xác
   nhận khung (11:51:36Z, 11:52:20Z] (44 s); khung hẹp nhất gộp
   mọi bằng chứng (11:52:12Z, 11:52:20Z] (~8 s, mốc cuối T4 poll
   #13 + btime mới); khung chuẩn cuối cùng chờ T2-139 chốt từ
   merged mù #58. Số boot mới 914964c3 chờ T6 xác nhận (dự kiến
   #95?); gap danh nghĩa #94?→#95? = 8.179 s (2h16'19"). Boot
   xác minh lại 12:34:00Z vẫn 914964c3, btime 11:52:20Z — không
   có reboot thứ 2.
5. **F-138-T5-1 (§11):** file thô scan #43 đã mất — T2 đợt sau
   đối chiếu WFS #45 với số tổng kết #43 trong LIMITS T2-137
   §2.7 + số #44 trong LIMITS này. (Cập nhật: T2 ĐÃ SỬA OUT
   trước khi chạy scan #44 của mình — xem §7.4; cảnh báo cũ
   trong bản nháp đã lỗi thời.)
6. **Headroom tiếp tục giảm** (2065 → 2058 → 2056; còn ~256 trên
   ngưỡng báo < ~1.800) — chỉ theo dõi, chưa đưa lên user (quyết
   §12.3(j)).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 137 §11: mù #57
   mới mở (việc T2 đợt 138; mù #56 đoạn A tối đa 1 ẩn / 3 cộng
   dồn; mù #55 B tối đa 2 ẩn / 3 cộng dồn; mù #53 B tối đa 3 ẩn);
   G1 chờ user quyết; ci-security.yml vẫn 403 chờ user; TTS 39
   cấm kiểm lại; release gate không đổi + KHÔNG push khi user
   chưa nhắn "push đi"; R9 (a) vẫn chờ user (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng, kể cả sau reboot). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần cho boot mới (`02ea211f…` →
  `d4a33a9e…`, header + say, KHÔNG đổi logic — xem §3.4).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM suýt vượt guard nhưng không chạm — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-138 probe #57
  ok=2 fail=0). WFS scan #44 do T5 chạy (xem §7.3 + F-138-T5-1).
- Postboot: boot #94? PASS exit 0 (chạy lại 1 lần lúc mở);
  boot mới poll0 FAIL exit 1 (đúng — replay mới chạy) + watcher
  b92 (28 poll) theo dõi tới PASS ổn định rồi ghi cờ 12:22:38Z
  poll 28 (xem §3.3b).
  **--repair: 1 lần** (luật (C) 5/5, lần kích hoạt đầu tiên —
  xem §3.5; REPAIR_EXIT=0, PASS). **TRIGGER=YES: 0 lần trong
  28 poll b92** (A2/(B)/(C) đều NO mọi poll — (C) do T5 kích
  hoạt bằng tay sau kiểm chứng độc lập, watcher chỉ ghi EVAL_C).
- Headroom: 2065 (mở boot #94?) → 2058 (mở boot mới) → 2056 (cuối).
- RAM phiên T5: boot #94? 636.400–6.112.624 kB (tự đo, n=14
  series + mẫu lẻ; Balloon 716.868–6.079.100 kB); boot mới
  449.768–1.377.596 kB (n=30; Balloon 5.419.556–6.443.824 kB).
  RAM lúc đóng 552.632 kB (12:28:22Z).
- **Reboot GIỮA LUỘT: 1 lần** (boot 17db9652 → 914964c3, khung
  (11:52:12Z, 11:52:20Z] ~8 s — sự kiện #19? chờ T10 chốt số).
- **started_at lượt 138:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: CÓ reboot giữa lượt (11:52:20Z) nên
  giả thuyết viết lại (đã kiểm chứng 8 lần) DỰ BÁO started_at
  bị viết lại 1 lần tại reboot này — T10 kiểm lại lúc đóng
  (T5 ghi rõ để khỏi đọc thành "đã kiểm là không viết lại").

## 11. Sai số của T5 đợt này (F-138-T5-N)

- **F-138-T5-1 — Scan WFS #44 ghi đè file thô scan #43 (lỗi T5,
  MỚI, nghiêm trọng về bằng chứng):** T5 copy
  `round138-t2/scan-wfs.sh` sang `round138-t5/scan-wfs-t5.sh`
  rồi chạy `sed -i 's|round138-t2|round138-t5|g'` — nhưng bản
  gốc trong `round138-t2/` vẫn có `OUT=…/round137-t2` (T2-138
  copy script từ đợt 137 mà chưa đổi OUT). sed không khớp mẫu
  nào nên OUT giữ nguyên `round137-t2`; lần chạy 11:40:01–
  11:40:18Z đã ghi đè 7 file thô scan #43 của T2-137
  (scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
  wfs-r7b.txt, files-copies.txt, wfs-copies.txt). T5 phát hiện
  khi đọc lại dòng OUT (grep OUT= → round137-t2) NGAY SAU khi
  scan xong và đã chuyển 7 file #44 về `round138-t5/` đúng chỗ.
  **Hậu quả:** file thô #43 KHÔNG khôi phục được (đã tìm mọi
  bản copy khác trong hidden_files — chỉ còn các đợt 93–96 cũ;
  overwrite không qua trash). Số tổng kết #43 còn nguyên trong
  LIMITS T2-137 §2.7 nên việc đối chiếu #44 vẫn làm được bằng
  số tổng kết + mtime (xem §7.3); diff file-thô #43→#44 không
  làm được nữa — delta +6/+2 được giải thích bằng số học +
  mtime, không phải diff trực tiếp (ghi rõ caveat ở §7.3).
  **Bài học:** sau khi copy script của luồng khác, LUÔN đọc
  dòng OUT (hoặc mọi đường dẫn ghi) TRƯỚC khi chạy — không chỉ
  sed rồi tin rằng đã đổi. (Cùng lớp lỗi với F-137-T5-3: header
  watcher copy từ boot cũ — bài học "đọc lại trước khi chạy"
  vẫn đúng ở dạng khác, lần này T5 đã mắc lại.)
  **Cảnh báo đi kèm:** T2-138 CHƯA chạy scan lúc T5 đóng và bản
  scan-wfs.sh của T2 vẫn trỏ OUT về round137-t2 — T2 phải sửa
  OUT trước khi chạy (xem §7.4).
- **F-138-T5-2 — (ghi chú) Watcher b92 KHÔNG dùng pgrep -f để tự
  kiểm:** T5 xác minh watcher sống bằng log tăng (poll 1
  11:55:27Z → poll 2 11:56:27Z) + `ps -p` trên PID launcher
  (không khớp tên script — tránh self-match F-135-T5-1). Không
  có đọc nhầm nào xảy ra.
- **F-138-T5-3 — (ghi chú) Brief ghi bracket 566/83/170 như của
  boot #94?:** thực tế là bracket tạm của #93? (T2-137 §2.1).
  T5 đã đính chính ở §3.1 thay vì lặp lại cách ghi của brief.
  Không ảnh hưởng số liệu (bracket chuẩn #94? là 1545/221/462).
- **F-138-T5-4 — Sampler RAM + 2 lệnh sleep của T5 bị giết bởi
  reboot giữa lượt (ghi chú, không phải lỗi đo — MỚI):**
  sampler boot #94? (14 mẫu, tới 11:51:59Z) chết theo reboot
  11:52:20Z — không mất dữ liệu (log còn nguyên tới mẫu 14);
  2 lệnh `sleep` chờ của T5 (1380 s + 900 s) bị gián đoạn bởi
  runtime restart đi kèm reboot — T5 kiểm lại trạng thái ngay
  sau đó (boot mới 914964c3, btime 11:52:20Z) và làm lại postboot
  + watcher + sampler cho boot mới (tiền lệ F-137-T5-5). **Lỗi
  riêng của T5 trong lần chạy lại sampler:** lần launch đầu
  sampler-boot2 (11:55:32Z, KHÔNG nohup, đường dẫn tương đối)
  chết theo session exec — không ghi được mẫu nào, file log
  không tồn tại; T5 phát hiện khi kiểm 11:56:35Z và chạy lại
  với nohup + đường dẫn tuyệt đối 11:56:48Z (mẫu đầu ghi ngay).
  Mất ~1 phút sampling boot2 (11:55:32–11:56:48Z) — khoảng trống
  nhỏ, RAM boot2 lúc đó ~1,3–1,7 GB theo watcher poll 1–2
  (1.326/1.295 MB) + mẫu T9 11:53:32Z (1.862.908 kB), không gần
  guard nên không mất tín hiệu quan trọng. Bài học: mọi tiến
  trình nền dài phải nohup + đường dẫn tuyệt đối ngay từ đầu
  (watcher b92 đã nohup nên sống; sampler đầu không nohup nên
  chết).
- **F-138-T5-5 — Header watcher b92 lúc đầu còn sót 2 tham chiếu
  sai do thay thế toàn cục (lỗi T5, MỚI — đã sửa TRƯỚC khi
  launch):** sau khi copy b91→b92, lệnh thay `round137-t5` →
  `round138-t5` toàn cục đã đổi cả 2 dòng header MỚI viết tay
  ("co round137-t5/ con hieu luc cho boot cu" và "du phong
  round137-t5/ cung boot" thành round138-t5 — sai, vì cờ boot
  cũ nằm ở round137-t5/). T5 phát hiện khi đọc lại header TRƯỚC
  khi launch (bài học F-137-T5-3 đã áp dụng — lần này phát hiện
  kịp) và sửa tay 2 dòng (md5 cuối `1607b22a…`). Không có lần
  chạy nào dùng bản header sai (chỉ là comment, không ảnh hưởng
  logic — HF dùng biến $HF; nhưng vẫn sửa cho đúng). Bài học:
  thay thế toàn cục PHẢI chạy TRƯỚC khi viết nội dung mới, hoặc
  đọc lại toàn bộ header sau thay thế.

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND138_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  header + dòng `say` cho boot 914964c3; md5 cuối `d4a33a9e…`;
  không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round138-t5/`
  (t5-start.txt, ram-open.txt, ram-sampler.log (14 mẫu boot #94?,
  CHẾT theo reboot), ram-sampler-boot2.log (30 mẫu boot mới) +
  ram-sampler-boot2.nohup.log, headroom-open.txt (2065),
  headroom-boot2-open.txt (2058), headroom-end.txt (2056),
  ram-end.txt, scan-wfs-t5.sh (bản copy — xem F-138-T5-1),
  scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
  wfs-r7b.txt, files-copies.txt, wfs-copies.txt — 7 file kết quả
  scan #44, t5-postboot-poll0-boot2.log (boot mới, FAIL),
  `t5-wait-replay-b92.sh` (`1607b22a…`, v6) + `.log` +
  `.nohup.log` + `t5-postboot-b92-poll*.log`,
  `t5-repair-boot2.log` (repair --repair, exit 0),
  `t5-postboot-after-repair.log` (check-only sau repair, exit 0),
  `REPAIR_TRIGGERED` + `REPAIR_TRIGGERED.log` (cờ luật (C) 5/5,
  PID 802 + lệnh kill),
  `POSTBOOT_PASS` (cờ gate-visible — boot 914964c3, ghi 12:22:38Z
  poll 28; T4 đã đọc ở poll #36).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round138-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round138-t5.done` (ghi rõ: boot #94?
  replay CHỐT XONG HẲN (1545/221/462) rồi CHẾT giữa lượt
  (11:52:12Z, 11:52:20Z]; RAM suýt vượt guard 6.112.624 kB
  (97,2%) lúc 11:51:59Z (T5) / 6.204.548 kB (98,6%) lúc 11:51:36Z
  (T2) — không ai kịp thử birefnet; boot mới
  914964c3 kẹt update → luật (C) kích hoạt LẦN ĐẦU (5/5), kill
  SIGTERM 802, --repair PASS exit 0, watcher b92 ghi cờ
  12:22:38Z poll 28, T4 đã đọc cờ; cây 530e10a7 không đổi qua
  reboot; headroom 2065→2058→2056; WFS #44 chênh 0 (F-138-T5-1:
  T5 ghi đè file thô scan #43 — T2 đã sửa OUT trước khi chạy
  scan của mình, đối chiếu chéo khớp); probe #57 ok=2 fail=0;
  sweep57 0 sóng thật; 1 reboot giữa lượt).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Quét WFS (ĐỌC OUT TRƯỚC KHI CHẠY — xem F-138-T5-1):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round138-t5/scan-wfs-t5.sh
# Kiểm async .writeFile stray:
grep -rn --include='*.js' --include='*.ts' --include='*.mjs' --include='*.cjs' '\.writeFile(' ~/workspace/repo-1/apps ~/workspace/repo-1/packages | grep -v '/dist/'
```

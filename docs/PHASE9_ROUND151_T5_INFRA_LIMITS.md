# PHASE9_ROUND151_T5_INFRA_LIMITS — BOOT 2e430750 REPLAY TỚI TU NHIÊN VÀ NHANH (01:26:35–01:30:13Z, bracket (44s, 4m22s]); POSTBOOT PASS POLL2 02:40:23Z, CỜ MỚI 02:43:12Z (SỬA FULL UUID 02:48:41Z — T4 POLL #8 XÁC NHẬN t5flag=PASS); CACHE SỐNG 178 .deb — CHUỖI 0 .deb 2 LẦN DỨT; WATCHER 151 CHẠY CHIẾN LƯỢC (h) REPAIR SỚM

> Luồng T5, đợt 151, lượt cron 09:35 +07 20/11/2026 (mở 02:35:51Z;
> T5 mở thực tế ~02:37Z, đóng ~02:55Z). Repo `~/workspace/repo-1`
> (cây làm việc, KHÔNG có `.git` local — KHÔNG push). **BOOT MỚI
> 2e430750** (btime **01:25:51Z** — uptime -s + /proc/stat btime
> 1795137951 KHỚP nhau; /proc/1 01:26:02Z, offset 11 s). Reboot
> #41 xảy ra 01:25:51Z, **GIỮA harness T8-150** (giết driver
> harness lần 1 giữa 86n2 WebKit P4 — theo aggregate 150).
> Boot cũ e9295700 chết ở 01:25:51Z; **tuổi thọ 6.822 s =
> 1h53m42s** (stat→stat, xem §2).
> Replay boot mới **TỚI TỰ NHIÊN VÀ NHANH**: hoạt động dpkg đầu
> tiên 01:26:35Z (boot **+44s**), cài xong 01:30:13Z (boot
> **+4m22s**), **1.545 dòng**, gói cuối gstreamer1.0-tools, 0
> entry sau đó (đóng băng 68+ phút lúc kiểm 02:38Z). Gói cài
> **y hệt đợt 146/147** (221 status-installed / 462
> configure-substring / 50 history Start-Date — xem §3).
> **Cache APT SỐNG 178 .deb/156M** (mtime trước boot — chuỗi
> **0 .deb 2 lần DỨT**, không kéo dài sang lần 3; chỉ ghi nhận
> theo quyết (l) 149 / (r) 150 — xem §4). Lists 37 (1 mirror
> azure). GST thư mục thật (apt) 269 file = debroot 269 —
> **KHÔNG cần symlink repair**. Postboot **PASS poll2 độc lập
> 02:40:23Z exit 0** (poll1: T4 manual 02:38Z, cũng PASS) →
> **cờ mới POSTBOOT_PASS cho boot 2e430750 ghi 02:43:12Z
> poll=2** (replay-đầy-đủ, KHÔNG cần repair).
> **SỬA CỜ QUAN TRỌNG (F-151-T5-1):** cờ prose kiểu 149/150
> chỉ ghi 8 ký tự đầu boot_id nên poller T4 (`grep -q
> "$BOOTID"` — full UUID) **KHÔNG BAO GIỜ nhận** (poll #1–#7
> vẫn `t5flag=cu` dù cờ đã ghi 02:43:12Z). Đã viết lại cờ
> với **full boot_id 02:48:41Z** → T4 **poll #8 02:51:00Z
> xác nhận `t5flag=PASS`, `gate0=T5`** (xem §5). Chiến lược
> mới (quyết parent 150 (h)) đã triển khai: **watcher
> replay-watch-151.sh đang chạy (pid 49781 từ 02:49:47Z)** —
> repair sớm ở boot+15' nếu dpkg.log đóng băng / 0 hoạt
> động apt, không chờ timeout 60' (xem §7).
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa production**
> ngoài postboot script (khối chú thích Dot 151 + dòng `say`
> — dữ kiện boot đã đổi thật, xem §5.2). **KHÔNG tự chạy
> birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.
> Kết cục run 150 thuộc T7-151 (quyết (q)) — T5 không đụng.

## 1. Kết luận ngắn

1. **BOOT MỚI 2e430750 (btime 01:25:51Z, reboot #41): REPLAY
   TỚI TỰ NHIÊN, NHANH.** Bracket **(boot+44s, boot+4m22s]**
   — nhanh thứ 2 trong các bracket đã kẹp bằng dpkg.log
   (#48: (40s, 2m44s]; #52: (6m28s, 8m44s]; #47:
   (22,6', 27,7']; #54: (47m14s, 52m30s]; #46:
   (1m23s, 7m08s]). Hoạt động đầu 01:26:35Z (2 dòng startup
   configure), cài thật 01:27:12–01:30:13Z, 0 entry sau đó.
2. **Gói cài y hệt đợt 146/147** (xem §3): 1.545 dòng,
   221 `status installed`, 462 dòng chứa `configure`, 50
   history Start-Date, gói cuối gstreamer1.0-tools. md5
   **khác** (`51d12c3d` vs `d2b2e788`) — là ĐIỀU KIỆN ĐÚNG
   vì dpkg.log gắn timestamp giờ boot (xem F-151-T5-2):
   md5 chỉ so được trong cùng một boot, không phải chỉ số
   trôi replay giữa các boot.
3. **Cache APT SỐNG 178 .deb/156M** — chuỗi "cache chết
   theo reboot" 2 lần (#39, #40) **DỨT**. Chỉ ghi nhận,
   không điều tra riêng (quyết (l) 149 / (r) 150).
4. **Postboot PASS poll2 02:40:23Z exit 0** (wrapper K1,
   5 lib, GST thật 269, đủ 11 gói). Cờ POSTBOOT_PASS mới
   cho boot 2e430750: ghi lần đầu 02:43:12Z, **viết lại
   với full UUID 02:48:41Z** (F-151-T5-1) → T4 poll #8
   02:51:00Z xác nhận `t5flag=PASS`, `gate0=T5` — lần đầu
   kể từ đợt 147 cờ T5 được poller nhận làm gate chính.
5. **KHÔNG cần --repair đợt này.** Chiến lược repair sớm
   (quyết (h)) đã triển khai thành watcher chạy nền
   (pid 49781, heartbeat 30 s, tự giới hạn 05:30Z) cho
   mọi reboot xảy ra trong phiên.
6. **Headroom: T5 KHÔNG probe lại** (tránh nhiễu T4 đang
   đo #22; số headroom đợt 151 do T9-151 đo). Trần
   inotify 63.747 không đổi.

## 2. Timeline — reboot #41 TRƯỚC khi đợt 151 mở

| Mốc (UTC) | Sự kiện |
|---|---|
| 19/11 23:32:09Z | Boot e9295700 bắt đầu (reboot #40, đợt 150) |
| 20/11 01:05:33Z | T5-150: postboot PASS poll1, cờ POSTBOOT_PASS cho e9295700 (sau --repair 1 lần; replay không tới) |
| 20/11 01:25:51Z | **Reboot #41: e9295700 chết → boot 2e430750** (giữa harness T8-150). Tuổi thọ e9295700 = **6.822 s = 1h53m42s** (stat→stat: 23:32:09Z → 01:25:51Z) |
| 20/11 01:26:35Z | Hoạt động dpkg đầu tiên trên boot mới (boot+44s) |
| 20/11 01:27:12Z | Bắt đầu cài thật (history.log Start-Date đầu tiên) |
| 20/11 01:30:13Z | Cài xong (gói cuối gstreamer1.0-tools); dpkg.log đóng băng từ đây |
| 20/11 02:35:51Z | Lượt cron đợt 151 mở (run 151; kết cục run 150 thuộc T7-151) |
| 20/11 ~02:37Z | T5-151 mở thực tế; kiểm tra trạng thái boot mới |
| 20/11 02:38Z | T4 manual postboot check-only PASS (poll1 trên boot này — log `postboot-t4-151-manual-0238Z.log`) |
| 20/11 02:40:23Z | **T5 postboot check-only độc lập PASS exit 0 (poll2)** |
| 20/11 02:40:46Z | T4 poller `poll-wait-t4-151.sh` bắt đầu (deadline 04:30Z) |
| 20/11 02:43:12Z | **Cờ POSTBOOT_PASS mới cho 2e430750 ghi lần đầu (poll=2)**; cờ cũ e9295700 lưu `POSTBOOT_PASS-e9295700` |
| 20/11 02:44:35Z | Verify-after-edit postboot script exit 0 (không tính poll) |
| 20/11 02:45:21Z | T4 mở cửa yên, chạy attempt1 (gate0 = T4-check-only dự phòng — cờ T5 lúc này chưa được nhận, xem §5.3) |
| 20/11 02:45:28Z | Watcher 151 instance 1 khởi động (pid 39470) |
| 20/11 02:48:41Z | **Cờ viết lại với full boot_id (sửa F-151-T5-1)** |
| 20/11 02:49:30Z | Watcher instance 1 dừng sạch qua kill-switch (để áp bản sửa flag-format) |
| 20/11 02:49:47Z | **Watcher 151 instance 2 khởi động (pid 49781, đang chạy)** |
| 20/11 02:51:00Z | **T4 poll #8: `t5flag=PASS`, `gate0=T5`** — cờ T5 được nhận làm gate chính (xác nhận sửa F-151-T5-1) |
| 20/11 02:51:00Z | T4 attempt1 xong (exit 0, 20/20 nhưng lớp B vi phạm — nhiễm tải, không tính verdict; retry poll-lại-gate theo quyết 149 (h)) |
| 20/11 ~02:55Z | T5-151 đóng (cờ `round151-t5.done`) |

## 3. dpkg replay — TỚI TU NHIÊN, NHANH, GÓI Y HỆT 146/147

### 3.1 Bracket

- Hoạt động dpkg đầu tiên: `2026-11-20 01:26:35 startup
  packages configure` (boot **+44s**); dòng thứ 2
  01:26:36Z; `startup archives unpack` 01:27:12Z.
- Cài thật: history.log Start-Date đầu 01:27:12Z, cuối
  01:30:12Z (gstreamer1.0-tools, End-Date 01:30:13Z).
- Dòng cuối dpkg.log: `2026-11-20 01:30:13 status installed
  gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2` (boot **+4m22s**).
- **0 entry sau 01:30:13Z** (kiểm lúc 02:38Z, 02:46Z và
  qua các poll watcher 30 s — md5 `51d12c3d` ổn định).
- Bracket replay: **(boot+44s, boot+4m22s]**.

### 3.2 Đếm — hai phương pháp (ghi rõ để T10 không đọc nhầm, theo bài học F-150-T5-4)

| Chỉ số | Boot 2e430750 | Đợt 146/147 | Khớp? |
|---|---|---|---|
| Tổng dòng dpkg.log | 1.545 | 1.545 | ✅ |
| `$3 = install` | 169 | — (không ghi) | — |
| `$3 = configure` | 178 | — (không ghi) | — |
| `$3 = upgrade` | 9 | — (không ghi) | — |
| `$3 = startup` | 106 | — (không ghi) | — |
| `$3 = status` | 1.040 | — (không ghi) | — |
| `$3 = trigproc` | 43 | — (không ghi) | — |
| `status installed` (= "installs" đợt 146/147) | **221** | **221** | ✅ |
| Dòng chứa `configure` (= "configure" đợt 146/147) | **462** | **462** | ✅ |
| Dòng chứa `install` (substring) | 568 | — (không ghi) | — |
| history.log Start-Date hôm nay | **50** | **50** | ✅ |
| Gói cuối | gstreamer1.0-tools | gstreamer1.0-tools | ✅ |
| dpkg.log md5 | `51d12c3d…` | `d2b2e788…` | ❌ (xem §3.3 — KHÔNG phải trôi) |

- 9 dòng `upgrade`: mesa `libgl1-mesa-dri`, `libglx-mesa0`,
  `libgbm1`, `mesa-libgallium`, `libegl-mesa0`, `libegl1`
  25.2.8-0ubuntu0.24.04.4 → 25.2.8-0ubuntu0.24.04.5
  (+ 3 dòng upgrade khác) — cùng họ mesa, cài trong lúc
  replay 01:27–01:30Z.
- Không có tiến trình apt/dpkg nào chạy lúc kiểm
  (02:38Z, 02:46Z, mọi poll watcher): replay đã xong hẳn,
  không phải đang cài dần.

### 3.3 md5 khác KHÔNG phải replay trôi (F-151-T5-2)

- `md5sum /var/log/dpkg.log` = `51d12c3df2d3d0c1772b3cb0703c8ca1`,
  khác `d2b2e788…` của đợt 146/147. **Đây là điều kiện
  đúng, không phải lỗi:** mỗi dòng dpkg.log gắn timestamp
  giờ tường của boot đó (01:26:35–01:30:13Z hôm nay vs
  12:13:xx–12:16:22Z ngày 19/11) nên hai boot khác nhau
  không thể có md5 giống nhau.
- Claim "md5 khớp y hệt" của T5-147 là **so trong cùng
  một boot 6fb582df** (đợt 146 và 147 chung boot; file
  đóng băng `dpkg-frozen-6fb582df.txt` ghi
  `dpkg_md5=d2b2e788…`, `dpkg_mtime=12:16:22Z`) — không
  phải so liên boot. File đóng băng đầy đủ của 146/147
  không còn trên đĩa (chỉ còn file 9 dòng tóm tắt trong
  `round146-t5/`), nên md5 đó không tái kiểm được nữa.
- **Chỉ số so liên boot đúng là các số đếm** — và chúng
  khớp tuyệt đối (1.545/221/462/50). Kết luận: replay
  cài **cùng một tập gói** như 146/147; không có trôi
  tập gói. T10 không nên trích "md5 khác" thành replay
  khác.

## 4. Cache APT — SỐNG 178 .deb (chuỗi 0 .deb 2 lần DỨT — chỉ ghi nhận)

- `/var/cache/apt/archives/`: **178 .deb / 156M** lúc
  02:38Z (kiểm lại 02:46Z: vẫn 178).
- mtime các .deb **trước boot** (mới nhất 2026-11-18
  16:22Z, cũ nhất 2021-02) → cache **sống qua reboot
  #41**, không phải tải lại trong replay. (Đối chiếu:
  sau repair đợt 149 chỉ 110 .deb; sau repair đợt 150
  110 .deb — nay 178 .deb đầy đủ như 5 lần sống trước
  #39.)
- Chuỗi: sống 5 lần → chết #39 (178→0) → chết #40
  (110→0) → **sống #41 (178)**. Mẫu "cache chết theo
  reboot" (2/2 lần gần nhất, quyết (r) 150) **không kéo
  dài sang lần 3**.
- Ghi nhận theo quyết (l) 149 / (r) 150: **không mở
  điều tra riêng** về cơ chế sống/chết của cache.
- debroot + ledger sống (GST debroot vẫn 269 file —
  xem §5; ledger os-intent: history.log có 50
  Start-Date hôm nay, xem §3).
- Lists: **37 file** (`/var/lib/apt/lists/`), toàn
  `azure.archive.ubuntu.com` (noble + updates + security
  + backports) — **1 mirror**. Đối chiếu: 71 file / 2
  mirror sau update trên boot 70025d3e (đợt 149); 75
  sau repair đợt 150. Replay đợt này chạy tốt chỉ với
  1 mirror azure; vì sao chỉ 1 mirror **chưa ghi nhận
  được** (không điều tra thêm — nợ mở §9).

## 5. Postboot check + cờ POSTBOOT_PASS + script

### 5.1 Kết quả check

| Lần | Thời gian | Người chạy | Kết quả |
|---|---|---|---|
| poll1 | 02:38Z | T4 manual (`postboot-t4-151-manual-0238Z.log`) | **PASS exit 0** (wrapper K1, 5 lib, GST thật 269, đủ 11 gói) |
| poll2 | 02:40:23Z | T5 độc lập (`t5-postboot-poll2-151.log`) | **PASS exit 0** — toàn mục PASS, kết luận "ĐỦ ĐIỀU KIỆN chạy WebKit (boot 2026-11-20 01:25:51)" |
| verify-after-edit | 02:44:35Z | T5 (`t5-postboot-verify-after-edit.log`) | **PASS exit 0** — kiểm lại script sau khi sửa header; **không tính poll** |

- 11 gói đủ: libevent-2.1-7t64, gstreamer1.0-plugins-base/
  good/bad/ugly/gl/libav/x, libavif16, libgstreamer1.0-0,
  libevdev2 (kiểm độc lập bằng `dpkg-query` trước khi
  chạy script — 11/11 `install ok installed`).
- 5 lib đủ: libevent-2.1.so.7, libEGL.so.1, libavif.so.16,
  libdw.so.1, libevdev.so.2 (`ldconfig -p`).
- GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là **thư
  mục thật (apt)**, 269 file = debroot 269; isomp4 +
  libav đủ. **KHÔNG cần symlink repair.**
- Wrapper MiniBrowser: PASS K1 (giữ LD_LIBRARY_PATH).

### 5.2 Script postboot đã sửa (deliverable 2)

File: `apps/web/scripts/vcut-webkit-postboot-check.sh`
(staged — xem §10).

1. **Chèn khối chú thích Dot 151** (24 dòng, trước khối
   Dot 150 — khối Dot 150 giữ nguyên): boot 2e430750,
   btime, tuổi thọ boot cũ, bracket replay, cache sống,
   lists 37, GST thật, poll1/poll2, cờ 02:43:12Z, chiến
   lược (h), headroom giao T9-151.
2. **Thay dòng `say "boot=$BOOT (DOT 150, …)"`** bằng
   bản DOT 151 (boot e9295700 → 2e430750 reboot #41,
   replay nhanh, cache sống, poll2, chiến lược (h),
   run 150 thuộc T7-151).
3. Kiểm: `bash -n` OK; chạy verify-after-edit exit 0,
   header DOT 151 in đúng (log
   `t5-postboot-verify-after-edit.log`).
4. Không đổi logic kiểm tra/repair nào trong script —
   chỉ dữ kiện boot trong header/say.

### 5.3 Cờ POSTBOOT_PASS + sửa F-151-T5-1 (quan trọng)

- Cờ ghi lần đầu **02:43:12Z** (`round151-t5/POSTBOOT_PASS`,
  poll=2, replay-đầy-đủ). Cờ cũ e9295700 lưu
  `POSTBOOT_PASS-e9295700` (copy nguyên văn từ
  `round150-t5/POSTBOOT_PASS`, 622 B).
- **F-151-T5-1 — Cờ prose 8 ký tự không bao giờ PASS
  gate T4.** Poller T4 (`poll-wait-t4-151.sh` dòng 148–
  160) kiểm: `stat mtime >= btime` **VÀ** `grep -q
  "$BOOTID"` với `BOOTID` = **full UUID** từ
  `/proc/sys/kernel/random/boot_id`. Cờ prose kiểu
  149/150 mở đầu `boot e9295700 (…)` chỉ chứa 8 ký tự
  đầu → grep không bao giờ khớp. Bằng chứng live:
  poll #1–#7 của T4 (02:40:46–02:45:21Z) đều
  `t5flag=cu(mtime-cu)(t5src=150-t5/POSTBOOT_PASS)` dù cờ
  mới đã ghi 02:43:12Z — T4 phải dùng gate0 dự phòng
  (check-only của chính T4) để mở attempt1 lúc
  02:45:21Z.
- **Gốc:** định dạng cờ đợt 147 có full UUID
  (`boot_id=6fb582df-455d-47cd-99dc-8bef48018536 btime=…
  pass_at=… poll=2`) nên poller nhận được; định dạng
  prose từ đợt 149/150 làm mất full UUID → hồi quy
  (cờ 149/150 cũng không bao giờ được poller nhận làm
  gate chính — T4-150 "gate0 không-đạt 97/97" phù hợp
  với điều này).
- **Sửa:** viết lại cờ **02:48:41Z** với full boot_id
  (`boot 2e430750-6ba0-47b6-bf22-902953eff096 (btime …)`).
  **Xác nhận end-to-end:** T4 **poll #8 02:51:00Z**
  ghi `t5flag=PASS(t5src=151-t5/POSTBOOT_PASS)`,
  `gate0=T5(…/round151-t5/POSTBOOT_PASS)` — lần đầu kể
  từ đợt 147 cờ T5 được nhận làm gate chính. Chi phí
  của 5 phút cờ chưa đúng định dạng (02:43–02:48Z):
  attempt1 của T4 chạy bằng gate0 dự phòng thay vì cờ
  T5 — attempt vẫn chạy xong, không ảnh hưởng kết quả
  đợt ngoài nhãn gate.
- **F-151-T5-3 (quan sát phía T4, KHÔNG sửa — file của
  T4):** trong vòng lặp ứng viên cờ của poller, nhánh
  `elif` (mtime mới nhưng không ghi boot_id) **không
  `break`** nên ứng viên dự phòng (round150-t5, mtime
  cũ) ghi đè trạng thái thành `cu(mtime-cu)` — log
  poll che mất trạng thái thật của cờ chính. Sau sửa
  F-151-T5-1 thì nhánh PASS `break` đúng nên không còn
  ảnh hưởng thực tế; ghi lại để T4-151/T10 biết.
- Watcher 151 cũng đã sửa `write_flag` theo cùng định
  dạng (ghi full boot_id cho mọi boot mới — xem §7).

## 6. Headroom inotify + disk + RAM snapshot (không probe)

- **T5 KHÔNG chạy probe k8 đợt này.** Lý do: probe cộng
  tới 30.000 inotify watch tạm thời + tạo/xóa 30.000
  file /tmp — nhiễu đúng lúc T4 đang đo lượt yên #22
  (poller mở cửa 02:45:21Z). Số headroom đợt 151 do
  **T9-151** đo (luồng sở hữu); T5 chỉ ghi trần và
  snapshot nhẹ.
- Trần inotify: `/proc/sys/fs/inotify/max_user_watches`
  = **63.747** (không đổi).
- Disk lúc 02:47Z: `/` overlay 7,5G, đã dùng 484M (7%),
  còn 6,8G; `/tmp` tmpfs 512M, đã dùng 70M (14%).
- RAM lúc 02:47Z (một mẫu duy nhất, không phải trend):
  tổng 7.934 MB, đã dùng 6.357 MB, available 1.576 MB;
  swap 1.023 MB, đã dùng 388 MB. (RAM available dao
  động mạnh theo poll T4: 988–2.765 MB trong các poll
  #2–#8 — xem log T4; T9-151 theo dõi chính thức.)

## 7. Chiến lược (h) — watcher repair sớm (quyết parent 150 (h))

> "Nếu sau ~15 phút từ boot mà dpkg.log vẫn đóng băng /
> 0 hoạt động apt thì T5 kích hoạt --repair ngay, mục
> tiêu cờ POSTBOOT_PASS có trước hạn cắt poller T4. Nếu
> replay tự tới thì ghi nhận, trigger sớm chỉ kích hoạt
> khi replay vắng."

### 7.1 Triển khai: `replay-watch-151.sh` (đang chạy)

- Vị trí:
  `hidden_files/round151-t5/replay-watch-151.sh`
  (không stage vào repo — theo tiền lệ watcher các đợt
  trước ở hidden_files).
- Trạng thái: **instance 2 pid 49781, chạy từ
  02:49:47Z**, heartbeat 1 dòng/30 s vào
  `replay-watch-151.log` (md5 dpkg.log ổn định
  `51d12c3d`, 0 apt/dpkg, cache 178, lists 37).
  Instance 1 (pid 39470, 02:45:28–02:49:30Z) dừng sạch
  qua file kill-switch để áp bản sửa flag-format
  (F-151-T5-1); khoảng trống phủ sóng 17 s
  (02:49:30→02:49:47Z), không có reboot trong khoảng
  đó (boot không đổi — xác nhận bằng poll đầu của
  instance 2).
- Tự giới hạn: thoát **05:30Z** (hạn cứng T5-151) hoặc
  khi gặp file `watcher-stop`.

### 7.2 Luật trigger (cho boot mới trong phiên)

- **DONE (replay tới):** dpkg > 100 dòng + ổn định 2
  poll liên tiếp + 0 apt/dpkg → postboot check-only
  1 lần → ghi `POSTBOOT_PASS-<boot8>` (ghi full
  boot_id — sửa F-151-T5-1).
- **REPAIR SỚM (h):** tại **boot+15'** (900 s sau
  btime), nếu dpkg.log **đóng băng ≥ 600 s** (md5 không
  đổi) **VÀ** 0 apt/dpkg **VÀ** chưa có tiến triển thật
  (dòng < 100) → verify form-B (postboot check-only,
  chờ exit 1; nếu exit 0 bất ngờ thì ghi cờ luôn,
  không repair) → `--repair` **1 lần duy nhất** cho
  boot đó → postboot check-only → ghi cờ.
- **Tuyệt đối KHÔNG repair** khi apt/dpkg đang chạy
  hoặc dpkg đang tăng dòng (replay đang chạy — kể cả
  khởi động muộn như boot #47 +22,6' / #54 +47').
  Điều kiện đóng băng ≥ 600 s + dòng < 100 bảo vệ
  trường hợp này.
- **Backstop 60':** nếu vì lý do nào đó trigger 15'
  không chạy mà tới boot+60' vẫn đóng băng + 0 proc +
  dòng < 100 thì repair 1 lần (cùng điều kiện).
- **1 repair / 1 boot** (cờ `repaired` trong bộ nhớ +
  file guard `repaired-<boot8>`).
- Boot hiện tại 2e430750 đã PASS → watcher chỉ giám
  sát đổi boot, không đánh giá DONE/REPAIR cho boot
  này.
- Khi ghi cờ cho boot mới: cờ cũ được lưu
  `POSTBOOT_PASS-<old8>` trước khi ghi đè (theo tiền
  lệ các đợt).

### 7.3 Caveat

- **Watcher sống qua reboot chưa kiểm chứng:** watcher
  chạy trong cell; nếu cell reboot giết tiến trình thì
  heartbeat 30 s trong log sẽ dừng — phiên sau (hoặc
  T5 đợt sau) khởi động lại từ log. Tiền lệ: chưa có
  đợt nào watcher sống qua reboot (watcher các đợt
  trước đều bắt đầu mới trên boot mới). Nợ mở §9.
- Watcher không đụng gì khác: không chạm T4/T8/T9,
  chỉ đọc dpkg.log + `pgrep` + `ls` mỗi 30 s; chỉ chạy
  apt khi trigger (h) kích hoạt trên boot mới.
- Chiến lược (h) **chưa được kích hoạt live đợt này**
  (replay boot hiện tại tới tự nhiên) — trigger sớm
  mới ở dạng code + watcher đang chạy, chưa có lần
  chạy repair thật nào để kiểm chứng. Nếu có reboot
  trong phiên và trigger chạy, kết quả ghi vào log
  watcher + LIMITS bổ sung (nếu T5 còn trong phiên)
  hoặc T5 đợt sau đối chiếu.

## 8. Dữ kiện thời gian reboot cho T7-151 / T2-151 (chỉ ghi nhận — điều tra (m) đã ĐÓNG)

- Reboot #41: e9295700 (btime 23:32:09Z 19/11) →
  2e430750 (btime 01:25:51Z 20/11). Tuổi thọ boot cũ
  **6.822 s** (stat→stat). `/proc/1` boot mới
  01:26:02Z (offset 11 s so với /proc/stat — trong
  dải offset 10–15 s các đợt trước).
- Reboot xảy ra **giữa hai đợt** (sau khi T10-150 đóng
  02:18Z, trước khi đợt 151 mở 02:35:51Z) nhưng
  **giữa harness T8-150** (theo aggregate 150).
- **Kết cục run 150 thuộc T7-151** (quyết (q) đợt
  150) — T5 không kiểm tra trạng thái scheduler/run
  150, không ghi gì thêm về run 150.
- Mù #72? (khung #115? 1.220 s sau #40) + mù #73?
  (sau #41) thuộc T2-151 — T5 không đụng.

## 9. Nợ mở sang đợt sau

1. **Watcher 151 còn chạy tới 05:30Z** (pid 49781) —
   nếu có reboot sau khi T5 đóng cờ, trigger (h) có
   thể chạy mà không có T5 trong phiên; T5 đợt sau
   đối chiếu `replay-watch-151.log` + cờ
   `POSTBOOT_PASS-<boot8>` mới (nếu có).
2. **Watcher sống qua reboot chưa kiểm chứng** (§7.3).
3. **T4 poller: nhánh elif không `break`** (F-151-T5-3,
   file của T4) — chỉ ảnh hưởng log khi cờ chính ở
   trạng thái trung gian; sau sửa F-151-T5-1 thì
   nhánh PASS `break` đúng.
4. **Lists 37 = 1 mirror azure** — vì sao chỉ 1 mirror
   (so với 71/2 mirror đợt 149) chưa ghi nhận được;
   replay chạy tốt nên chỉ ghi nhận, không điều tra.
5. **Headroom đợt 151** do T9-151 đo (T5 không probe).
6. **Chiến lược (h) chưa kích hoạt live** — lần repair
   sớm đầu tiên (nếu xảy ra) cần đối chiếu thời gian
   thực tế so với mục tiêu "cờ trước hạn cắt poller T4".
7. ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm
   lại; file oversize 6,4 MB
   `benchmarks/results/webkit-blob-flaky-96x3.json`
   chưa quyết (nợ chung các đợt).

## 10. Kiểm chứng hồi quy + file đổi

- Postboot check-only poll2 exit 0 (02:40:23Z) +
  verify-after-edit exit 0 (02:44:35Z) — script sửa
  header vẫn chạy đúng.
- T4 poll #8 02:51:00Z: `t5flag=PASS`,
  `gate0=T5(…/round151-t5/POSTBOOT_PASS)` — xác nhận
  cờ được poller nhận (F-151-T5-1 đã sửa, kiểm chứng
  end-to-end bằng log gốc của T4, không phải tự nhận).
- Watcher instance 2 sống, heartbeat 30 s đều
  (02:49:47Z → lúc đóng).
- Cây repo không đổi ngoài 2 file dưới (preview.tsx
  md5 530e10a7 — khớp cây lúc PUSH #7; kiểm qua log
  poll T4 `tree=YES:md5=530e10a7` các poll #1–#8).

### File đổi (stage — xem §10.1)

| File | Đổi |
|---|---|
| `docs/PHASE9_ROUND151_T5_INFRA_LIMITS.md` | Mới (file này) |
| `apps/web/scripts/vcut-webkit-postboot-check.sh` | Chèn khối Dot 151 + thay dòng `say` DOT 150 → DOT 151 (không đổi logic) |

### 10.1 Stage

- Paths file NUL-delimited:
  `~/workspace/repo-1-push/paths-loop/phase9-round151-t5-infra.txt`
  — 2 entry, verify bằng read-back (`tr '\0' '\n'` +
  đối chiếu đường dẫn tồn tại).
- **KHÔNG PUSH** — batch stage chờ user (lũy kế chờ
  push 136–150 = 140 batch / 196 entry / 161 file theo
  đính chính (s) đợt 150; cộng đợt 151 sau khi T10
  đóng sổ).

## 11. Sai số F-151-T5-n (mọi sai số của luồng T5 đợt này)

- **F-151-T5-1 — Cờ POSTBOOT_PASS prose (8 ký tự) không
  bao giờ PASS gate T4 (lỗi định dạng, đã sửa, có kiểm
  chứng live).** Cờ ghi lần đầu 02:43:12Z mở đầu
  `boot 2e430750 (…)`; poller T4 grep full UUID nên
  poll #1–#7 đều `t5flag=cu`, T4 phải dùng gate0 dự
  phòng cho attempt1. Gốc: định dạng cờ đợt 147 có
  full UUID (`boot_id=…-…`), prose từ 149/150 làm mất
  nó → hồi quy (cờ 149/150 cũng không được nhận).
  Sửa: viết lại cờ 02:48:41Z với full boot_id; watcher
  `write_flag` sửa cùng định dạng cho boot mới. Kiểm
  chứng: T4 poll #8 02:51:00Z `t5flag=PASS`,
  `gate0=T5`. Bài học đứng: **mọi cờ cho T4 đọc phải
  chứa full boot_id** (đừng rút gọn 8 ký tự); T5 các
  đợt sau giữ định dạng này.
- **F-151-T5-2 — md5 dpkg.log KHÔNG phải chỉ số so
  liên boot (ghi chú phương pháp, không phải lỗi đo).**
  md5 `51d12c3d` khác `d2b2e788` của 146/147 là điều
  kiện đúng (timestamp giờ boot gắn trong từng dòng);
  claim "md5 khớp y hệt" của T5-147 là so trong cùng
  một boot 6fb582df. Chỉ số so liên boot đúng là các
  số đếm (1.545/221/462/50 — khớp tuyệt đối). T10
  không trích "md5 khác" thành replay trôi.
- **F-151-T5-3 — Poller T4: nhánh elif không `break`
  (quan sát phía T4, KHÔNG sửa).** Ứng viên dự phòng
  ghi đè trạng thái `mtime-moi-khong-ghi-boot_id`
  thành `cu(mtime-cu)` trong log poll. Sau sửa
  F-151-T5-1 thì nhánh PASS `break` đúng nên không
  ảnh hưởng thực tế đợt này; ghi lại để T4-151/T10
  biết (file của T4, T5 không đụng).
- **F-151-T5-4 — Đánh số poll (ghi rõ để T10 không
  đọc nhầm).** Check 02:40:23Z của T5 là **poll2** vì
  T4 manual 02:38Z là poll1 (lần check độc lập đầu
  tiên trên boot này). File log làm việc ban đầu đặt
  tên `t5-postboot-poll1-151.log` đã đổi tên thành
  `t5-postboot-poll2-151.log`. Lần chạy verify-after-
  edit 02:44:35Z **không tính poll**.
- **F-151-T5-5 — Watcher khởi động lại giữa phiên
  (ghi nhận, không phải lỗi).** Instance 1 dừng sạch
  qua kill-switch 02:49:30Z để áp bản sửa flag-format;
  instance 2 chạy từ 02:49:47Z. Khoảng trống 17 s,
  không reboot trong khoảng đó. Log instance 1 giữ
  nguyên trong `replay-watch-151.log` (dòng STOP
  02:49:30Z), log instance 2 nối tiếp cùng file.

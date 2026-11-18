# PHASE9_ROUND118_T7_INFRA_LIMITS — Hạ tầng: reboot #54 + replay kẹp bằng dpkg.log + postboot PASS + headroom 804

> Luồng T7, đợt 118, lượt cron 18:35 +07 15/11/2026 (bắt đầu ~11:38Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 117 §10 mục 9 (replay #54 + postboot + repair policy;
> parent CHẤP NHẬN repair policy ở đợt 117 §13 Quyết 9); tiếp nối T8 đợt 117.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự reboot
> máy để test. CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Boot hiện tại là #54, KHÔNG phải #53** — boot 2026-11-15
   10:48:26Z (btime kernel 1794739706 / `uptime -s`; `stat` btime của `/`
   là 10:48:36Z, chênh 10 s như mọi boot trước — lấy 10:48:26Z làm
   chuẩn), boot_id `48a82db1-a8e4-41fe-9c9d-08719ce19250`, sau #53
   09:47:08Z (gap ~1h01'18"). `journalctl --list-boots` CHỈ CÒN 1 boot
   (hiện tại); log #53 đã mất cùng rootfs rebuild.
2. **Replay #54 CHẠY nhưng khởi động MUỘN NHẤT từ trước tới nay** —
   hoạt động apt đầu tiên 11:35:40Z (boot +47'14"), cài xong toàn bộ
   11:40:56Z (boot +52'30") → khoảng **(47'14", 52'30"]** kẹp được
   bằng dpkg.log (boot thứ 5 kẹp được, sau #46/#47/#48/#52; #53 là
   boot duy nhất không kẹp được vì replay không tới). Cửa sổ cài đặt
   4'50" (11:36:06–11:40:56), tổng 1509 dòng dpkg.log — đúng bằng số
   dòng của #52, cùng package cuối (gstreamer1.0-tools). Xem §5.
3. **Postboot #54: PASS** — kiểm check-only lúc boot ~53' tuổi
   (11:41:29Z), exit 0; kiểm lại sau khi sửa script vẫn PASS.
   Wrapper PASS, libs đủ 5/5, GST thư mục thật 269 file đủ
   isomp4+libav, apt đủ 11/11. `--repair` KHÔNG chạy (không cần —
   repair policy không kích hoạt: replay ĐÃ tới, dù muộn, và postboot
   PASS). Cờ `POSTBOOT_PASS` đã ghi cho T4/T5 lúc 11:43Z. Xem §2.
4. **Headroom inotify boot #54: 804 — tiếp tục rơi, reboot KHÔNG hồi
   (lần 3 liên tiếp có số đo boot-mới/chứng minh hướng rơi).** Rơi từ
   925 (cuối #52) → 804 (−121). Vite thường cần ~1586 watch nên vẫn
   thiếu ~782 — vite tạm `watch.ignored` vẫn bắt buộc. Xem §4.
5. **Watcher v2 KHÔNG chạy trong lượt này** — T7 bắt đầu lúc boot đã
   ~50' tuổi, replay vẫn đang chạy (11:38Z); watcher lúc đó lẽ ra có
   thể kẹp được FAIL live (apt chưa cài xong), nhưng task T7 không
   yêu cầu watcher và T7 chọn chờ replay im rồi mới chạy postboot
   một lần (PASS). Phía FAIL của bracket do đó vẫn là suy luận hậu
   kiểm từ dpkg.log (như #48/#52), không phải lần kiểm live — bracket
   vẫn chặt (rộng 5'16") nên không mất mát thực chất; ghi lại làm bài
   học quy trình cho luồng infra sau (§3, §9.5).
6. **Stale vite.lock: KHÔNG có lock sót.** Lock dir TỒN TẠI nhưng
   đang được giữ SỐNG bởi luồng đợt 118 (vite T1 pid 15062 port
   5580 + probe pid 14463); v2 log chỉ có TICKET/ACQUIRED/RELEASED
   bình thường, không STALE mới. Queue tăng 15 → 26 file cooldown
   (đều cũ, vô hại; T7 không xóa — T4 quyết). Xem §6.
7. **Cập nhật `postboot-check.sh` (md5 `32a214bb…` → `1c646a37…`):**
   chỉ đổi tham chiếu boot #52 → #54 (header + dòng `say`, thêm ghi
   chú #53 đình trệ); `bash -n` OK + chạy kiểm chỉ-đọc lại ra PASS.
   KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
   A vẫn chờ parent duyệt) — nếu `--repair` có chạy thì chạy đúng thứ
   tự hiện tại (GST trước, apt sau). Xem §8.
8. **Đề xuất R9 (a) vẫn mở (nhắc lần 4):** cron chạy watcher v2 ở đầu
   mỗi lượt với `--wait-new-boot` — parent KHÔNG PHÊ DUYỆT ở đợt 117
   §13 Quyết 9 (thay đổi thân cron, cần user đồng ý); T7 KHÔNG tự
   đổi thân cron. Xem §9.1.
9. **Không reboot mới trong lúc T7 làm** — boot vẫn #54 từ đầu tới
   cuối lượt (kiểm lại 11:43Z).

## 2. Postboot #54 — PASS (check-only, không --repair)

- Boot #54: 2026-11-15 10:48:26Z (btime kernel; `uptime -s` đồng ý;
  `stat` btime `/` = 10:48:36.263Z — chênh 10 s, lấy 10:48:26Z làm
  chuẩn theo quy ước harness), boot_id
  `48a82db1-a8e4-41fe-9c9d-08719ce19250`, sau #53 09:47:08Z (gap
  ~1h01'18"). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `wtmp`/log #53 đã mất (cùng cơ chế mất log như #49/#50/#51, T8 §7).
- Lần kiểm try1: 11:41:29Z (boot ~53' tuổi), script bản T8 (md5
  `32a214bb…`), exit 0. Log: `t7-postboot-b54-try1.log`.
  - PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
  - PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống).
  - INFO GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là thư mục thật
    (apt), 269 file plugin hệ thống = 269 file debroot.
  - PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264).
  - PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114).
  - KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit.
- `--repair` KHÔNG chạy: đã PASS nên không cần. Đối chiếu repair policy
  đã duyệt (đợt 117 §13 Quyết 9): policy kích hoạt khi "boot mới mà
  replay không tới trong ~15 phút" — ở #54 replay ĐÃ tới (dù muộn
  +47'14") và postboot PASS sau khi apt xong hẳn, nên không có điều
  kiện nào đòi repair. Task T7 cũng chỉ cho repair khi "postboot FAIL
  sau khi apt đã xong hẳn, chờ thêm ~15'" — điều này không xảy ra.
- Kết quả ghi sớm vào `hidden_files/round118-t7/POSTBOOT_PASS` lúc
  11:43Z (boot_id + thời gian PASS + bracket + headroom) cho luồng
  khác dùng (T4/T5 đang poll cờ này để bắt đầu lượt yên).
- Kiểm lại sau khi sửa script (§8): vẫn PASS, exit 0
  (`t7-postboot-b54-after-edit.log`, ~11:44Z, boot ~56' tuổi).

## 3. Watcher v2 — KHÔNG chạy (ghi rõ lý do + bài học)

- Luật đứng (quyết parent 15/11): luồng infra đầu tiên sau mỗi reboot
  chạy watcher v2 ngay. T7 bắt đầu lúc boot #54 đã ~50' tuổi, replay
  vẫn đang chạy (11:38Z đang cài `gstreamer1.0-plugins-bad`).
- T7 KHÔNG chạy watcher v2 trong lượt này vì task T7 không yêu cầu
  watcher, và T7 chọn phương án chờ replay im (watcher riêng
  `t7-wait-replay.sh`: poll 30 s/lần, chờ apt/dpkg im 60 s liên tục)
  rồi chạy postboot check-only một lần.
- **Hậu kiểm — lẽ ra nên chạy:** lúc T7 bắt đầu (11:38Z) postboot
  check-only CHẮC CHẮN FAIL apt (gstreamer1.0-plugins-bad chưa cài
  xong) — một watcher poll lúc đó sẽ kẹp được FAIL live ở boot ~50',
  rồi PASS ở boot ~53', tức là lần FAIL live đầu tiên kể từ #47.
  Bracket (47'14", 52'30"] hiện nay vẫn chặt nhờ dpkg.log (rộng
  5'16", tương đương #52 2'16" và #48 2'04" về độ tin cậy phương pháp),
  nên việc thiếu FAIL live KHÔNG làm yếu kết luận — nhưng đây là bài
  học quy trình: **luồng infra sau, nếu bắt đầu trong lúc replay còn
  chạy, nên chạy watcher v2 ngay (nó poll và ghi từng try) thay vì
  chỉ chờ im rồi kiểm một lần.** Ghi vào nợ §9.5.
- So sánh các lần watcher: #46 try1 FAIL 1'23" → try2 PASS 7'08"
  (kẹp live, Q7); #47 try#5 FAIL 22.6' → try#6 PASS 27.7' (kẹp live,
  R9); #48 try#1 PASS 83.3' (không FAIL live, S8); #52 try#1 PASS
  10.1' (không FAIL live, T8 — muộn 83 s); **#54 không chạy watcher
  (T7 — bắt đầu boot ~50', replay còn chạy tới +52'30")**.

## 4. Headroom inotify + vite (boot #54)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T8 đầu lượt, 08:40Z (boot #52, ~11' tuổi) | 948 | boot MỚI — trước thử vite |
| T8 giữa lượt, 08:47Z (boot #52, ~18' tuổi) | 934 | drift −14 là nhiễu luồng khác |
| T8 cuối lượt, 09:02Z (boot #52, ~33' tuổi) | 925 | sau thử vite; drift −23 từ đầu lượt |
| **T7, 11:41Z (boot #54, ~53' tuổi)** | **804** | **boot MỚI — sau replay + postboot PASS** |

- Xu hướng #42→#54: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 → 1298
  → 1300 (boot #46 mới) → 1207 → 1094 → 1103 → 1092 (boot #47 mới)
  → 1073 → 969 → 961 (boot #48) → 948 → 934 → 925 (boot #52) →
  **804 (boot #54)**. Rơi liên tiếp, chưa từng hồi.
- **Kết luận: reboot KHÔNG hồi headroom — lần 3 liên tiếp có số đo
  boot-mới/chứng minh hướng rơi.** R9 đã đo boot #47 mới 1092
  (≈1103 trước reboot, không hồi); T8 đo boot #52 mới 948, THẤP HƠN
  cả 961 cuối boot #48; nay T7 đo boot #54 804, THẤP HƠN cả 925 cuối
  boot #52. Caveat: T7 đo lúc boot ~53' tuổi (không phải ~2' như R9
  #47 hay ~11' như T8 #52) — các luồng T1–T10 đợt 118 đã chạy ~50
  phút và đang giữ watch (vite T1 + probe đang sống lúc đo) nên số
  804 có nhiễu âm vài chục watch; nhưng nếu reboot có hồi headroom
  thì số đo phải NHẢY LÊN gần mức đầu boot (~1300–1500 như các boot
  đầu), không thể rơi tiếp xuống 804. Hướng rơi là rõ, chỉ biên độ
  chính xác còn nhiễu.
- Vite thường cần ~1586 watch → trên boot #54 vẫn thiếu ~782 — vite
  thường KHÔNG chạy được; vite tạm `watch.ignored` vẫn là đường duy
  nhất (không thử lại vite trong lượt này — T8 đã chứng minh cả hai
  trên #52, và headroom #54 còn thấp hơn; thử lại không thêm thông
  tin mới).
- RAM khả dụng lúc đo: **1303 MB** (1389 MB lúc 11:42Z) — vẫn < 6 GB,
  birefnet không thử (đứng theo LIMITS gộp).
- Log: `t7-headroom-b54-now.log` (probe STOP ở i=804, errno 28 ENOSPC).

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do: headroom 804 < 925 của #52 (nơi vite thường đã ENOSPC sau
  "ready in 892 ms"); thử lại vite thường trên #54 chỉ lặp lại kết
  quả đã biết. Vite tạm `watch.ignored` đã được T8 chứng minh 200 +
  0 inotify trên #52 và không có gì thay đổi về cơ chế. Không lãng
  phí lock/lượt chờ để lặp lại.

## 5. Khoảng replay #54 — kẹp được bằng dpkg.log: (47'14", 52'30"]

### 5.1 Bằng chứng

- Lúc T7 kiểm đầu (11:38:10Z, boot ~49.7' tuổi): **replay ĐANG CHẠY**
  — tiến trình os-intent replay (pid 865, shell `sh -c` với payload
  replay) + `apt-get install -y --no-install-recommends
  gstreamer1.0-plugins-bad` (pid 4241, start 11:37) + apt method http
  (pid 4246). Đây là lần đầu tiên một luồng infra bắt đầu trong lúc
  replay còn chạy mà replay vẫn chưa xong (ở #52, T8 bắt đầu sau khi
  replay xong 24 s).
- `/var/log/dpkg.log` (chỉ còn log của boot hiện tại — xem §7):
  - Entry đầu tiên sau boot: `2026-11-15 11:35:40 startup packages
    configure` (boot +47'14"); entry thứ hai cùng giây; **0 entry nào
    trước 11:35:40** (kiểm bằng awk — dpkg.log bắt đầu đúng 11:35:40).
  - Install đầu tiên: `11:36:06 install libaspell15` (boot +47'40").
  - Entry cuối cùng: `11:40:56 … gstreamer1.0-tools … installed`
    (boot +52'30").
  - **0 entry nào sau 11:40:56** tới lúc kiểm lại (11:43Z) — tổng 1509
    entry, toàn bộ trong 11:35:40–11:40:56. Đúng bằng 1509 dòng của
    #52 (cùng ledger, cùng package cuối).
- `/var/log/apt/history.log`: Start-Date đầu tiên sau boot 11:35:40
  (dpkg --configure -a); End-Date cuối cùng 11:40:56 (cài
  gstreamer1.0-tools). Khớp dpkg.log.
- `/var/lib/apt/lists/`: 39 file; mtime thư mục 11:36:01 —
  `apt-get update` của replay xong quanh boot +47'35".
- GST: thư mục thật, 269 file; mtime file là ngày build package nên
  KHÔNG dùng để kẹp — chỉ dpkg.log mới có thời gian cài thật.
- Quy ước mốc boot: 10:48:26Z (btime kernel / `uptime -s`); `stat`
  btime của `/` là 10:48:36Z (chênh 10 s, rootfs mount sau kernel
  boot). Nếu lấy 10:48:36Z thì bracket là (47'04", 52'20"] — T7 lấy
  10:48:26Z làm chuẩn, cùng quy ước harness các boot trước.
- Lúc watcher kết luận replay im (11:41:29Z): không còn tiến trình
  apt-get/dpkg/os-intent nào; kiểm lại 11:43Z vẫn im.

### 5.2 Khoảng và cách đọc

- **Khoảng hoàn thành replay #54: (47'14", 52'30"]** — tức replay xong
  (đủ điều kiện chạy WebKit) trong khoảng từ sau boot 47 phút 14 giây
  tới boot 52 phút 30 giây. Cửa sổ cài đặt 4'50" (11:36:06–11:40:56).
- Phía FAIL (47'14"): suy từ vắng mặt — trước 11:35:40 không có hoạt
  động dpkg nào sau boot; rootfs vừa rebuild nên GST/libs chưa tồn
  tại; postboot tại bất kỳ thời điểm nào trong (boot, 11:35:40] chắc
  chắn FAIL. Đây là suy luận hậu kiểm, KHÔNG phải lần kiểm live
  (xem §3 — lẽ ra có thể kẹp FAIL live lúc 11:38Z).
- Phía PASS (52'30"): entry dpkg cuối cùng — sau đó không còn cài gì
  nữa, nên mọi điều kiện postboot đã đủ từ thời điểm này (và thực tế
  T7 đo PASS lúc boot ~53' + kiểm lại PASS lúc boot ~56').
- So sánh 6 boot gần nhất:

  | Boot | Khoảng replay | Cách kẹp | Ghi chú |
  |---|---|---|---|
  | #46 | (1'23", 7'08"] | watcher live (Q7) | |
  | #47 | (22.6', 27.7'] | watcher live (R9) | update ~12' vì mirror chậm |
  | #48 | (0'40", 2'44"] | dpkg.log hậu kiểm (S8) | NHANH NHẤT |
  | #52 | (6'28", 8'44"] | dpkg.log hậu kiểm (T8) | khởi động muộn nhất lúc đó |
  | #53 | KHÔNG TỚI (65+') | — | đình trệ, không kẹp được |
  | **#54** | **(47'14", 52'30"]** | **dpkg.log hậu kiểm (T7)** | **khởi động MUỘN NHẤT từ trước** |

- **Điểm mới của #54: replay KHỞI ĐỘNG CỰC MUỘN (+47'14").** Chuỗi
  thời gian khởi động replay: #48 +40s → #52 +6'28" → #47 +22.6' →
  #53 không tới (65+') → #54 +47'14". Hai boot liên tiếp (#53, #54)
  replay hoặc không tới hoặc tới sau ~47' — đây là mẫu mới, khác hẳn
  3 boot đầu (#46/#47/#48) và #52. Độ trễ nằm ở khâu KHỞI ĐỘNG replay
  (trigger/os-intent?), không phải tốc độ cài (cửa sổ cài 4'50" vẫn
  cùng bậc với #52 2'16" và #48 2'04", chỉ chậm hơn ~2×). T7 KHÔNG
  suy ra nguyên nhân (không có log trigger/os-intent trong máy để
  kiểm — journal chỉ còn boot hiện tại, wtmp đã reset); chỉ ghi nhận
  mẫu. Nợ M8 §9.4 ĐÃ ĐÓNG cho boot #54 (boot thứ 5 kẹp được, sau
  #46/#47/#48/#52; #53 là ngoại lệ đã ghi nhận).
- Caveat như S8/T8: postboot PASS ≠ replay xong toàn bộ ledger — nhưng
  ở #54, dpkg.log cho thấy KHÔNG còn hoạt động apt nào sau 11:40:56
  và apt history End-Date cuối cũng 11:40:56, nên lần này replay xong
  HẲN (toàn bộ ledger) lúc boot +52'30", chứ không chỉ đủ 11 package
  WebKit. Số dòng dpkg.log 1509 = đúng #52 càng củng cố ledger đã
  chạy trọn vẹn.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **TỒN TẠI** lúc kiểm
  (11:42Z) — NHƯNG đang được giữ SỐNG, không phải stale: vite của T1
  đợt 118 (node pid 15062, port 5580, config
  `/tmp/round116-s1/vite.r2.config.mjs`) + probe node pid 14463
  (`probe116s1.mjs --engine webkit --phase e4a1`) + script
  `test-vite-lock-v2.sh` đang chạy. Đây là hoạt động hợp lệ của luồng
  khác, không phải lock sót.
- Thư mục queue `hidden_files/vite.lock.queue` có **26 file cooldown**
  (tăng từ 15 ở #52 — thêm cooldown của T1/T2/T10 đợt 117–118, gồm
  t1-smoke-*) — đều là cooldown cũ đã hết hạn (mặc định 15 s); file
  cooldown chỉ delay cùng-thread reacquire, không chặn luồng khác,
  không tính là ticket. T7 KHÔNG xóa (không cần; để T4 — chủ mảng
  lock — quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối trước T7 là 11:41:41–11:42:24Z
  (T3 đợt 118 TICKET → ACQUIRED port 5590 wait_s=0 → RELEASED
  hold_s=42; T9 ACQUIRED port 5581 wait_s=27) — FIFO hoạt động bình
  thường, không có entry STALE nào mới.
- T7 KHÔNG đụng vào lock của T1/T3/T9 (không kill vite, không xóa
  lock tay) — đúng luật: hàng đợi FIFO là hành vi thiết kế.
- Phối hợp T4: T4 (lock v2, đợt 118) lo stale detection + đổi spec
  sang v2 (Quyết 4 đợt 117: CHẤP NHẬN đổi spec sang v2 từ đợt 118);
  T7 chỉ kiểm thực tế trên đĩa như trên, không đụng script lock.

## 7. Boot #53 — postboot + bracket: đã mất (ghi nhận từ LIMITS gộp đợt 117)

- **#53 (09:47:08Z 15/11, sau #52 08:29:12Z, gap 1h17'56"): replay
  ĐÌNH TRỆ — không tới trong 65+ phút (0 hoạt động apt); T5 đợt 117
  không chạy được lượt yên nào trên boot này; O8 WebKit exit=2 (chặn
  hạ tầng).** Chưa từng có lần postboot-check nào trên #53. Bracket đã
  mất cùng log khi sang #54 (dpkg.log, apt/history.log, journal đều
  CHỈ CÒN log của boot #54 — reset theo rootfs rebuild mỗi reboot).
  boot_id của #53 không còn lưu trong máy.
- Cơ chế mất (đã rõ từ S8 §7, T8 §7, nay xác nhận lần 3): sang boot
  sau là mất nguồn — mọi bracket PHẢI kẹp live trong cùng boot
  (watcher) hoặc hậu kiểm ngay trong boot đó (dpkg.log).
- Mù #36 (mở từ 08:42:46Z) chứa #53 và nay thêm #54 nếu chưa đóng —
  việc của luồng probe đợt 118, không phải T7. Các mù #22/#24/#28/
  #29/#30/#31 chờ user quyết (không đổi).

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `32a214bb22190438c5b5c4810f1a7b98` →
  `1c646a375779779a217389d232bf56c3` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8, không đổi logic):
  - Header: thêm đoạn boot #53 (đình trệ 65+ phút, không kẹp được
    bracket, boot_id đã mất) + boot #54 (khoảng dpkg.log + caveat
    watcher §3).
  - Dòng `say`: `#52 = 2026-11-15 08:29:12Z, boot_id 22536366-…` →
    `#54 = 2026-11-15 10:48:26Z, boot_id
    48a82db1-a8e4-41fe-9c9d-08719ce19250, sau #53 09:47:08Z`.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn PASS,
  exit 0 (`t7-postboot-b54-after-edit.log`, ~11:44Z, boot ~56' tuổi).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
  A, R9 §6.3): việc này cần parent duyệt (R9 ghi rõ "cần parent
  duyệt") và T7 không nhận được phê duyệt đó trong task — giữ nguyên
  để parent quyết. `--repair` với code mới (timeout + khóa symlink)
  vẫn CHƯA được chạy sống lần nào. **Ghi rõ: nếu T7 đã phải chạy
  `--repair` thì nó sẽ chạy đúng thứ tự hiện tại (mục 3 GST symlink
  trước, mục 4 apt install sau) — nhưng T7 KHÔNG chạy `--repair`
  trong lượt này vì postboot đã PASS.**

## 9. Nợ mở sang đợt sau

1. **Đề xuất R9 (a) vẫn mở (nhắc lần 4):** cron chạy watcher v2 ở đầu
   mỗi lượt với `--wait-new-boot` để bắt reboot giữa lượt — parent
   KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9 (thay đổi thân cron, cần
   user đồng ý; đã đưa ra hỏi user lúc đóng đợt). T7 KHÔNG tự đổi
   thân cron. Không có (a), mỗi boot nhanh đều có nguy cơ mất FAIL
   live — và #54 cho thấy cả boot chậm cũng có thể mất FAIL live nếu
   luồng infra không chạy watcher ngay.
2. **Headroom tiếp tục rơi: 804 trên boot #54.** Vite thường KHÔNG
   chạy được (thiếu ~782 so với ~1586 cần); giữ vite tạm
   `watch.ignored` cho mọi O8/vite. Trần 63747 cần can thiệp host
   (ngoài VM) mới tăng được — không thuộc tầm luồng này.
3. **`--repair` với code mới (timeout + khóa symlink) CHƯA được chạy
   sống** — cần 1 boot mà replay không chạy + postboot FAIL (tình
   huống #45/#53) để kiểm chứng, hoặc parent duyệt chạy sau khi
   bracket đóng. Đổi thứ tự mục apt trước mục GST trong `--repair`
   (phương án A) chờ parent duyệt.
4. **Symlink GST → debroot vẫn là vá tạm** — phương án A/B (R9 §6.3)
   chờ parent duyệt; tới lúc đó `--repair` chỉ symlink khi apt thất
   bại. Trên boot #54 symlink KHÔNG cần (replay cài thư mục thật).
5. **Replay khởi động ngày càng muộn (#53 không tới, #54 +47'14")** —
   mẫu mới 2 boot liên tiếp; nguyên nhân khâu khởi động replay chưa
   rõ (không có log trigger trong máy). Nếu #55 cũng đình trệ/muộn,
   parent nên xem xét đưa repair policy thành luật chạy `--repair`
   ngay khi boot >15' mà replay chưa tới (đã duyệt) thay vì chờ
   postboot FAIL — T7 ghi nhận, không tự ý mở rộng policy.
6. **Bài học quy trình (§3):** luồng infra bắt đầu trong lúc replay
   còn chạy nên chạy watcher v2 ngay để kẹp FAIL live, thay vì chỉ
   chờ im rồi kiểm một lần.
7. **Mù #36 nay chứa #53 + #54** nếu chưa đóng — việc của luồng
   probe đợt 118. Các mù #22/#24/#28/#29/#30/#31 chờ user quyết
   (không đổi).
8. **Cooldown file tích lũy (26 file, tăng từ 15)** — chưa có cơ chế
   dọn cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock
   (T4 quyết).
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 117 §10: E4 lô đo
   lớn chờ đăng ký trước + H3f sau chẩn đoán storeHeldFrame + điểm
   gãy lặp s79 + lock v2 đổi spec sang v2 từ đợt 118 + ngưỡng WebKit
   ≤60 ms + ghost ≥80 seek + birefnet 0 lần + TTS 39 CẤM kiểm lại +
   ci-security.yml 403 chờ user + release gate không đổi + KHÔNG push
   khi user chưa nhắn "push đi".

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi T7 (không đụng production).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T7 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng 1303 MB
  < 6 GB).
- O8: KHÔNG thuộc T7 (luồng khác làm).
- Postboot #54: PASS lúc boot ~53' (try1) + PASS lại sau sửa script
  (boot ~56').
- Watcher v2: KHÔNG chạy (§3 — ghi rõ lý do + bài học).
- Replay #54: (47'14", 52'30"] bằng dpkg.log (boot thứ 5 kẹp được;
  #53 là ngoại lệ đình trệ).
- Headroom #54: 804 — reboot KHÔNG hồi (lần 3 có số đo boot-mới
  chứng minh hướng rơi).
- Stale vite.lock: không có (lock đang giữ sống bởi T1 đợt 118,
  queue chỉ còn cooldown cũ, v2 log không STALE mới).
- Không reboot mới trong lúc T7 làm (boot vẫn #54 tới 11:44Z).

## 11. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND118_T7_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #52 → #54 + ghi chú #53 đình trệ trong header; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round118-t7/` (log
  watcher chờ replay, log postboot try1 + after-edit, log headroom,
  md5 trước/sau của postboot-check, `POSTBOOT_PASS`,
  `t7-initial-state.md`, `t7-replay-done.md`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round118-t7-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round118-t7.done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

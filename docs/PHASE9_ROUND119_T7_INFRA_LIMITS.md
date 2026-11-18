# PHASE9_ROUND119_T7_INFRA_LIMITS — Hạ tầng: boot mới 27c8b1d9, replay NHANH (2'05", 7'34"], postboot PASS ×3, headroom 670, repair 15' KHÔNG kích hoạt

> Luồng T7, đợt 119, lượt cron 06:35 +07 16/11/2026 (bắt đầu ~23:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 118 §10 mục 6 (headroom 804 + chính sách repair 15
> phút áp dụng từ đợt 119 + R9 (a) chờ user); tiếp nối T7 đợt 118.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự reboot
> máy để test. CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Boot mới là #57? (SỐ TẠM)** — boot 2026-11-15 23:33:34Z (btime
   kernel 1794785614 / `uptime -s`; `stat` btime của `/` là 23:33:43Z,
   chênh +9 s như mọi boot trước — lấy 23:33:34Z làm chuẩn),
   boot_id `27c8b1d9-33dd-4c63-9989-f9254a66dbc2`, sau #55 12:51:56Z
   (gap 10h41'38"). Số thứ tự CHƯA CHẮC: giữa #55 và boot này còn
   boot 6805e92d ~20:17Z (parent ghi nhận lúc đóng đợt 118); nếu
   6805e92d là #56 thì boot này là #57, nhưng gap #55→~20:17Z dài
   7h25' có thể chứa boot chưa ghi nhận — **chờ T6 đợt 119 đếm lại
   mù #37**. Trong file này gọi tạm "#57?" và luôn kèm boot_id +
   btime. `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại); log
   #55 + 6805e92d đã mất cùng rootfs rebuild.
2. **Replay #57? CHẠY và NHANH — khoảng (2'05", 7'34"]** kẹp được
   bằng dpkg.log: hoạt động apt đầu tiên 23:35:39Z (boot +2'05"),
   cài xong toàn bộ 23:41:08Z (boot +7'34") → cửa sổ cài đặt 5'29",
   tổng 1509 dòng dpkg.log — đúng bằng số dòng của #52/#54, cùng
   package cuối (gstreamer1.0-tools). Ngang lớp nhanh #48 (+40s),
   đảo ngược mẫu muộn dần #53 (không tới) → #54 (+47'14"). Xem §5.
3. **Chính sách repair 15 phút: KHÔNG KÍCH HOẠT (lần đầu áp dụng).**
   Policy duyệt đợt 117, áp dụng từ đợt 119: boot mới mà replay
   không tới trong ~15 phút thì chạy `--repair` có kiểm soát. Ở boot
   này replay tới lúc boot +2'05" — trong hạn 15 phút — nên
   `--repair` KHÔNG chạy, không cần chạy. Đây là lượt đầu tiên
   policy có hiệu lực và nó đã cho kết quả "không cần can thiệp"
   đúng. Caveat: policy vẫn CHƯA từng được kiểm chứng sống (chưa có
   boot nào từ khi duyệt mà replay quá 15' không tới) — `--repair`
   với code mới (timeout + khóa symlink) vẫn chưa chạy sống lần nào.
   Xem §2.
4. **Postboot #57?: PASS ×3** — kiểm live sớm lúc boot ~10'11"
   (23:43:45Z, replay vẫn đang cài xfonts) exit 0; kiểm lại sau khi
   replay im lúc boot ~10'43" (23:44:17Z) exit 0; kiểm lại sau khi
   sửa script lúc boot ~13'24" (23:46:58Z) exit 0. Wrapper PASS,
   libs đủ 5/5, GST thư mục thật 269 file đủ isomp4+libav, apt đủ
   11/11. Cờ `POSTBOOT_PASS` đã ghi cho T4/T5 lúc 23:47Z. Xem §2.
5. **Headroom inotify boot #57?: 670 — tiếp tục rơi, reboot KHÔNG hồi
   (lần 4 liên tiếp có số đo boot-mới chứng minh hướng rơi).** Rơi
   từ 804 (#54) → 670 (−134). Vite thường cần ~1586 watch nên vẫn
   thiếu ~916 — vite tạm `watch.ignored` vẫn bắt buộc. Xem §4.
6. **Bài học quy trình đợt 118 (§3) ĐÃ ÁP DỤNG:** T7 bắt đầu lúc
   replay còn chạy (boot ~7' tuổi) và đã chạy postboot check-only
   live NGAY (23:43:45Z) thay vì chỉ chờ im — kẹp được PASS live
   sớm ở boot +10'11". Lần này PASS tới trước cả khi replay xong
   hẳn vì 11 package WebKit đã cài xong trước phần đuôi (fonts/
   xfonts) của ledger; phía FAIL của bracket do đó vẫn là suy luận
   hậu kiểm từ dpkg.log (trước 23:35:39 chắc chắn FAIL), nhưng phía
   PASS nay có cả bằng chứng live lẫn dpkg.log. Xem §3.
7. **Stale vite.lock: KHÔNG có lock sót.** Lock dir TỒN TẠI nhưng
   đang được giữ SỐNG bởi T1 đợt 119 (vite port 5590, TICKET →
   ACQUIRED 23:44:08Z wait_s=0); v2 log không có entry STALE mới.
   Queue tăng 26 → 30 file cooldown (đều cũ, vô hại; T7 không xóa
   — T4 quyết). Xem §6.
8. **Cập nhật `postboot-check.sh` (md5 `1c646a37…` → `804be792…`):**
   chỉ đổi tham chiếu boot #54 → #57? (header + dòng `say`, thêm
   ghi chú số tạm + chờ T6 đếm mù #37); `bash -n` OK + chạy kiểm
   chỉ-đọc lại ra PASS. KHÔNG đổi thứ tự mục apt trước mục GST
   trong `--repair` (phương án A vẫn chờ parent duyệt). Xem §8.
9. **Đề xuất R9 (a) vẫn mở (nhắc lần 5):** cron chạy watcher v2 ở đầu
   mỗi lượt với `--wait-new-boot` — parent KHÔNG PHÊ DUYỆT ở đợt 117
   §13 Quyết 9 (thay đổi thân cron, cần user đồng ý); T7 KHÔNG tự
   đổi thân cron. Xem §9.1.
10. **Không reboot mới trong lúc T7 làm** — boot vẫn 27c8b1d9 từ đầu
    tới cuối lượt (kiểm lại 23:47Z).

## 2. Postboot #57? — PASS ×3 (check-only, không --repair)

- Boot #57?: 2026-11-15 23:33:34Z (btime kernel; `uptime -s` đồng ý;
  `stat` btime `/` = 23:33:43.263Z — chênh 9 s, lấy 23:33:34Z làm
  chuẩn theo quy ước harness), boot_id
  `27c8b1d9-33dd-4c63-9989-f9254a66dbc2`, sau #55 12:51:56Z (gap
  10h41'38"). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `wtmp`/log #55 + 6805e92d đã mất (cùng cơ chế mất log như
  #49/#50/#51/#52/#54).
- **Giây nháy: KHÔNG có dấu hiệu nhảy đồng hồ ở boot này** — 5 nguồn
  đồng ý trong ~23 s: btime 23:33:34, `uptime -s` 23:33:34, `stat`
  `/` 23:33:43, journal first entry 23:33:45, `/proc/uptime` 449,08 s
  lúc 23:40:51Z → suy ra boot ~23:33:22 (chênh 12 s, drift nhỏ trong
  dung sai). Không như #54 (đồng hồ VM nhảy lùi 17–21 phút).
- Lần kiểm live sớm: 23:43:45Z (boot ~10'11" tuổi), script bản T7
  đợt 118 (md5 `1c646a37…`), exit 0. Log:
  `t7-postboot-b57-live-early.log`. Lúc này replay VẪN ĐANG CHẠY
  (đang cài xfonts) nhưng 11 package WebKit + GST đã đủ — PASS tới
  trước cả khi replay xong hẳn (xem §3, §5).
  - PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
  - PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống).
  - INFO GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là thư mục thật
    (apt), 269 file plugin hệ thống = 269 file debroot.
  - PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264).
  - PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114).
  - KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit.
- Lần kiểm sau khi replay im: 23:44:17Z (boot ~10'43"), exit 0
  (`t7-postboot-b57-try1.log`, do watcher `t7-wait-replay.sh` chạy).
- Kiểm lại sau khi sửa script (§8): 23:46:58Z (boot ~13'24"), exit 0
  (`t7-postboot-b57-after-edit.log`).
- **`--repair` KHÔNG chạy: không cần.** Đối chiếu chính sách repair
  15 phút đã duyệt (đợt 117 §13 Quyết 9, áp dụng từ đợt 119):
  policy kích hoạt khi "boot mới mà replay không tới trong ~15 phút"
  — ở boot này replay tới lúc boot +2'05", trong hạn, và postboot
  PASS cả khi replay còn chạy lẫn sau khi im. Không có điều kiện nào
  đòi repair. Đây là lượt đầu tiên policy có hiệu lực; kết quả là
  "không kích hoạt" — ghi rõ để parent thấy policy đã được áp dụng
  (đánh giá), không phải bị bỏ qua.
- Kết quả ghi vào `hidden_files/round119-t7/POSTBOOT_PASS` lúc
  23:47Z (boot_id + thời gian PASS + bracket + headroom) cho luồng
  khác dùng (T4/T5 đang poll cờ này để bắt đầu lượt yên).

## 3. Watcher — chạy live sớm (áp dụng bài học đợt 118 §3) + chờ im

- T7 bắt đầu lúc boot ~7' tuổi, replay đang chạy (apt-get pid 7146
  cài xfonts-scalable lúc 23:41Z). Theo bài học đợt 118 §3 (luồng
  infra bắt đầu trong lúc replay còn chạy nên chạy watcher ngay để
  kẹp FAIL live), T7 đã chạy postboot check-only live NGAY lúc
  23:43:45Z — kết quả PASS (không phải FAIL như kỳ vọng ở #54),
  vì 11 package WebKit đã cài xong trước phần đuôi ledger (xem §5).
  Phía PASS của bracket do đó có bằng chứng live ở boot +10'11",
  sớm hơn cả mốc dpkg cuối (+7'34") + thời gian chờ im.
- Sau đó watcher riêng `t7-wait-replay.sh` (mẫu đợt 118, poll 30 s/
  lần, chờ apt/dpkg im 60 s liên tục) chạy nền: poll 1 lúc 23:43:45Z
  đã im (replay xong 23:41:08Z, T7 bắt đầu sau khi apt dừng), poll 2
  lúc 23:44:15Z xác nhận im 60 s → chạy postboot try1 (PASS) + đo
  headroom, ghi state `t7-replay-done.md`.
- So sánh các lần watcher: #46 try1 FAIL 1'23" → try2 PASS 7'08"
  (kẹp live, Q7); #47 try#5 FAIL 22.6' → try#6 PASS 27.7' (kẹp live,
  R9); #48 try#1 PASS 83.3' (không FAIL live, S8); #52 try#1 PASS
  10.1' (không FAIL live, T8); #54 không chạy watcher (T7 đợt 118
  — bắt đầu boot ~50', replay còn chạy tới +52'30"); **#57? live
  sớm PASS 10'11" + try1 PASS 10'43" (T7 đợt 119 — bắt đầu boot ~7',
  replay xong +7'34")**.
- R9 (a) (watcher v2 chạy đầu mỗi lượt với `--wait-new-boot`) vẫn
  chưa được duyệt nên T7 vẫn dùng watcher chờ-im riêng như các đợt
  trước; lần này bài học "chạy live sớm" đã bù được phần nào.

## 4. Headroom inotify + vite (boot #57?)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T8 đầu lượt, 08:40Z (boot #52, ~11' tuổi) | 948 | boot MỚI — trước thử vite |
| T8 giữa lượt, 08:47Z (boot #52, ~18' tuổi) | 934 | drift −14 là nhiễu luồng khác |
| T8 cuối lượt, 09:02Z (boot #52, ~33' tuổi) | 925 | sau thử vite; drift −23 từ đầu lượt |
| T7, 11:41Z (boot #54, ~53' tuổi) | 804 | boot MỚI — sau replay + postboot PASS |
| **T7, 23:44Z (boot #57?, ~10'43" tuổi)** | **670** | **boot MỚI — sau replay + postboot PASS** |

- Xu hướng #42→#57?: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 → 1298
  → 1300 (boot #46 mới) → 1207 → 1094 → 1103 → 1092 (boot #47 mới)
  → 1073 → 969 → 961 (boot #48) → 948 → 934 → 925 (boot #52) →
  804 (boot #54) → **670 (boot #57?)**. Rơi liên tiếp, chưa từng hồi.
- **Kết luận: reboot KHÔNG hồi headroom — lần 4 liên tiếp có số đo
  boot-mới chứng minh hướng rơi.** Lần này đo lúc boot chỉ ~10'43"
  tuổi (sớm như T8 #52 ~11'), các luồng T1–T10 đợt 119 mới bắt đầu
  (~7–10 phút, ít watch đang giữ hơn #54 lúc ~53' tuổi) mà số vẫn
  rơi tiếp −134 so với #54 — biên độ rơi lần này ít nhiễu hơn #54.
  Nếu reboot có hồi headroom thì số đo phải NHẢY LÊN gần mức đầu
  boot (~1300–1500 như các boot đầu), không thể rơi tiếp xuống 670.
- Vite thường cần ~1586 watch → trên boot #57? vẫn thiếu ~916 — vite
  thường KHÔNG chạy được; vite tạm `watch.ignored` vẫn là đường duy
  nhất (không thử lại vite trong lượt này — T8 đã chứng minh cả hai
  trên #52, và headroom #57? còn thấp hơn; thử lại không thêm thông
  tin mới).
- RAM khả dụng lúc đo: **2124 MB** (1621 MB lúc 23:46Z — dao động
  theo luồng khác đang chạy) — vẫn < 6 GB, birefnet không thử
  (đứng theo LIMITS gộp).
- Log: `t7-headroom-b57-now.log` (probe STOP ở i=670, errno 28 ENOSPC).

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do: headroom 670 < 804 của #54 (nơi vite thường đã ENOSPC sau
  "ready in 892 ms"); thử lại vite thường trên #57? chỉ lặp lại kết
  quả đã biết. Vite tạm `watch.ignored` đã được T8 chứng minh 200 +
  0 inotify trên #52 và không có gì thay đổi về cơ chế. Không lãng
  phí lock/lượt chờ để lặp lại.

## 5. Khoảng replay #57? — kẹp được bằng dpkg.log: (2'05", 7'34"]

### 5.1 Bằng chứng

- Lúc T7 kiểm đầu (23:40:51Z, boot ~7'17" tuổi): **replay ĐANG CHẠY**
  — tiến trình os-intent replay (pid 777, shell `sh -c` với payload
  replay) + `apt-get install -y --no-install-recommends
  xfonts-scalable` (pid 7146, start 23:41). Đây là lần thứ hai một
  luồng infra bắt đầu trong lúc replay còn chạy (sau #54), nhưng lần
  này replay xong chỉ ~17 s sau đó.
- `/var/log/dpkg.log` (chỉ còn log của boot hiện tại — xem §7):
  - Entry đầu tiên sau boot: `2026-11-15 23:35:39 startup packages
    configure` (boot +2'05"); entry thứ hai cùng giây; **0 entry nào
    trước 23:35:39** (kiểm bằng head — dpkg.log bắt đầu đúng 23:35:39).
  - Install đầu tiên: `23:36:21 startup archives unpack` (boot
    +2'47"); install package đầu tiên ngay sau đó.
  - Entry cuối cùng: `23:41:08 … gstreamer1.0-tools … installed`
    (boot +7'34").
  - **0 entry nào sau 23:41:08** tới lúc kiểm lại (23:44–23:46Z) —
    tổng 1509 entry, toàn bộ trong 23:35:39–23:41:08. Đúng bằng 1509
    dòng của #52/#54 (cùng ledger, cùng package cuối).
- `/var/log/apt/history.log`: Start-Date đầu tiên sau boot 23:35:39
  (dpkg --configure -a); End-Date cuối cùng 23:41:08 (cài
  gstreamer1.0-tools). Khớp dpkg.log.
- `/var/lib/apt/lists/`: 39 file; mtime thư mục 23:36:16 —
  `apt-get update` của replay xong quanh boot +2'42".
- GST: thư mục thật, 269 file; mtime file là ngày build package nên
  KHÔNG dùng để kẹp — chỉ dpkg.log mới có thời gian cài thật.
- Quy ước mốc boot: 23:33:34Z (btime kernel / `uptime -s`); `stat`
  btime của `/` là 23:33:43Z (chênh 9 s, rootfs mount sau kernel
  boot). Nếu lấy 23:33:43Z thì bracket là (1'56", 7'25"] — T7 lấy
  23:33:34Z làm chuẩn, cùng quy ước harness các boot trước.
- Lúc watcher kết luận replay im (23:44:15Z): không còn tiến trình
  apt-get/dpkg/os-intent nào; kiểm lại 23:46Z vẫn im.

### 5.2 Khoảng và cách đọc

- **Khoảng hoàn thành replay #57?: (2'05", 7'34"]** — tức replay xong
  (đủ điều kiện chạy WebKit) trong khoảng từ sau boot 2 phút 05 giây
  tới boot 7 phút 34 giây. Cửa sổ cài đặt 5'29" (23:35:39–23:41:08).
- Phía FAIL (2'05"): suy từ vắng mặt — trước 23:35:39 không có hoạt
  động dpkg nào sau boot; rootfs vừa rebuild nên GST/libs chưa tồn
  tại; postboot tại bất kỳ thời điểm nào trong (boot, 23:35:39] chắc
  chắn FAIL. Đây là suy luận hậu kiểm, KHÔNG phải lần kiểm live
  (không có lần kiểm nào trước 23:43:45Z).
- Phía PASS (7'34"): entry dpkg cuối cùng — sau đó không còn cài gì
  nữa, nên mọi điều kiện postboot đã đủ từ thời điểm này; và thực tế
  T7 đo PASS live lúc boot +10'11" (23:43:45Z) + PASS lại lúc boot
  +10'43" (23:44:17Z). Phía PASS có cả bằng chứng live lẫn dpkg.log.
- So sánh 7 boot gần nhất:

  | Boot | Khoảng replay | Cách kẹp | Ghi chú |
  |---|---|---|---|
  | #46 | (1'23", 7'08"] | watcher live (Q7) | |
  | #47 | (22.6', 27.7'] | watcher live (R9) | update ~12' vì mirror chậm |
  | #48 | (0'40", 2'44"] | dpkg.log hậu kiểm (S8) | NHANH NHẤT |
  | #52 | (6'28", 8'44"] | dpkg.log hậu kiểm (T8) | |
  | #53 | KHÔNG TỚI (65+') | — | đình trệ, không kẹp được |
  | #54 | (47'14", 52'30"] | dpkg.log hậu kiểm (T7) | khởi động MUỘN NHẤT từ trước |
  | **#57?** | **(2'05", 7'34"]** | **dpkg.log + PASS live (T7)** | **NHANH trở lại, ngang lớp #48** |

- **Điểm mới của #57?: replay KHỞI ĐỘNG NHANH TRỞ LẠI (+2'05").**
  Chuỗi thời gian khởi động replay: #48 +40s → #52 +6'28" → #47
  +22.6' → #53 không tới (65+') → #54 +47'14" → **#57? +2'05"**.
  Mẫu "khởi động ngày càng muộn" ở #53/#54 ĐÃ ĐẢO NGƯỢC — hai boot
  muộn liên tiếp không còn là xu hướng đơn điệu; độ trễ khởi động
  dao động mạnh theo boot (40 s → 47' → 2'05"), không theo hướng
  xấu dần. Nguyên nhân khâu khởi động replay vẫn chưa rõ (không có
  log trigger/os-intent trong máy để kiểm — journal chỉ còn boot
  hiện tại, wtmp đã reset); chỉ ghi nhận mẫu. Nợ M8 §9.4 ĐÃ ĐÓNG cho
  boot #57? (boot thứ 6 kẹp được, sau #46/#47/#48/#52/#54; #53 là
  ngoại lệ đã ghi nhận).
- Caveat như S8/T8: postboot PASS ≠ replay xong toàn bộ ledger — nhưng
  ở #57?, dpkg.log cho thấy KHÔNG còn hoạt động apt nào sau 23:41:08
  và apt history End-Date cuối cũng 23:41:08, nên lần này replay xong
  HẲN (toàn bộ ledger) lúc boot +7'34", chứ không chỉ đủ 11 package
  WebKit. Số dòng dpkg.log 1509 = đúng #52/#54 càng củng cố ledger
  đã chạy trọn vẹn. Thêm nữa, PASS live lúc 23:43:45Z xảy ra khi
  replay vẫn đang cài xfonts (đuôi ledger) — chứng tỏ 11 package
  WebKit xong trước phần đuôi; thứ tự cài trong ledger không phải
  WebKit-cuối.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **TỒN TẠI** lúc kiểm
  (23:46Z) — NHƯNG đang được giữ SỐNG, không phải stale: vite của T1
  đợt 119 (node pid 13388, vite --configLoader native) + T1 TICKET →
  ACQUIRED port 5590 wait_s=0 lúc 23:44:08Z; file `owner` trong lock
  dir mtime 23:44. Đây là hoạt động hợp lệ của luồng khác, không
  phải lock sót.
- Thư mục queue `hidden_files/vite.lock.queue` có **30 file cooldown**
  (tăng từ 26 ở #54 — thêm cooldown của T3/T10 đợt 118, gồm
  t3-round118, t10-round118) — đều là cooldown cũ đã hết hạn (mặc
  định 15 s); file cooldown chỉ delay cùng-thread reacquire, không
  chặn luồng khác, không tính là ticket. T7 KHÔNG xóa (không cần; để
  T4 — chủ mảng lock — quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối trước T7 là 13:03–13:13Z ngày
  15/11 (T4/T10 đợt 118, boot cũ — TICKET/ACQUIRED/RELEASED bình
  thường); hoạt động đầu trên boot mới là T1 đợt 119 TICKET +
  ACQUIRED 23:44:08Z — FIFO hoạt động bình thường, không có entry
  STALE nào mới.
- T7 KHÔNG đụng vào lock của T1 (không kill vite, không xóa lock
  tay) — đúng luật: hàng đợi FIFO là hành vi thiết kế.
- Lưu ý: còn 1 probe node pid 13325 (`probe118t2-storeheld-diag.mjs
  --engine chromium`) đang chạy lúc 23:46Z — tên script thuộc đợt
  118; T7 không kiểm ownership, không đụng (việc của T2 nếu là
  luồng của họ).
- Phối hợp T4: T4 (lock v2, đợt 119) lo stale detection; T7 chỉ kiểm
  thực tế trên đĩa như trên, không đụng script lock.

## 7. Boot #55 + 6805e92d — postboot + bracket: đã mất (ghi nhận)

- **#55 (12:51:56Z 15/11, boot_id 52d799d4):** T4 đợt 118 kiểm
  check-only PASS ngay lần đầu (theo LIMITS gộp đợt 118 §6); bracket
  đã mất cùng log khi sang boot sau (dpkg.log, apt/history.log,
  journal đều CHỈ CÒN log của boot 27c8b1d9 — reset theo rootfs
  rebuild mỗi reboot). boot_id #55 còn lưu trong LIMITS gộp đợt 118.
- **Boot 6805e92d (~20:17Z 15/11, sau #55):** chỉ biết qua ghi nhận
  của parent lúc đóng đợt 118 (03:5x +07 16/11: "boot hiện tại
  6805e92d, ~20:17Z"); không có lần postboot-check nào ghi lại,
  bracket chưa từng kẹp, số thứ tự chưa đếm chắc — việc của T6 đợt
  119 (mù #37).
- Cơ chế mất (đã rõ từ S8 §7, T8 §7, T7 đợt 118 §7, nay xác nhận lần
  4): sang boot sau là mất nguồn — mọi bracket PHẢI kẹp live trong
  cùng boot (watcher) hoặc hậu kiểm ngay trong boot đó (dpkg.log).
- Mù #37 (mở từ 08:42:46Z) chứa #55 + 6805e92d + #57? nếu chưa đóng
  — việc của luồng probe đợt 119 (T6). Các mù #22/#24/#28/#29/#30/
  #31/#35/#36 chờ user quyết (không đổi).

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `1c646a375779779a217389d232bf56c3` →
  `804be792ab9ae64aabac0f76e975b04a` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118, không đổi
  logic):
  - Header: thêm đoạn boot #57? (khoảng dpkg.log + caveat số tạm +
    chờ T6 đếm mù #37 + repair 15' không kích hoạt + headroom 670).
  - Dòng `say`: `#54 = 2026-11-15 10:48:26Z, boot_id 48a82db1-…` →
    `#57? = 2026-11-15 23:33:34Z, boot_id 27c8b1d9-…,
    sau #55 12:51:56Z — số tạm, chờ T6 đếm lại mù #37`.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn PASS,
  exit 0 (`t7-postboot-b57-after-edit.log`, 23:46:58Z, boot ~13'24"
  tuổi).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
  A, R9 §6.3): việc này cần parent duyệt (R9 ghi rõ "cần parent
  duyệt") và T7 không nhận được phê duyệt đó trong task — giữ nguyên
  để parent quyết. `--repair` với code mới (timeout + khóa symlink)
  vẫn CHƯA được chạy sống lần nào. **Ghi rõ: nếu T7 đã phải chạy
  `--repair` thì nó sẽ chạy đúng thứ tự hiện tại (mục 3 GST symlink
  trước, mục 4 apt install sau) — nhưng T7 KHÔNG chạy `--repair`
  trong lượt này vì replay đã tới trong ~15' và postboot đã PASS.**

## 9. Nợ mở sang đợt sau

1. **Đề xuất R9 (a) vẫn mở (nhắc lần 5):** cron chạy watcher v2 ở đầu
   mỗi lượt với `--wait-new-boot` để bắt reboot giữa lượt — parent
   KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9 (thay đổi thân cron, cần
   user đồng ý; đã đưa ra hỏi user lúc đóng đợt 117, chưa trả lời).
   T7 KHÔNG tự đổi thân cron. Không có (a), mỗi boot nhanh đều có
   nguy cơ mất FAIL live — và #57? cho thấy cả boot nhanh cũng có
   thể mất FAIL live nếu luồng infra không chạy live sớm (lần này
   T7 đã chạy live sớm và kẹp được PASS ở +10'11", nhưng FAIL live
   vẫn chưa từng kẹp được kể từ #47).
2. **Headroom tiếp tục rơi: 670 trên boot #57?.** Vite thường KHÔNG
   chạy được (thiếu ~916 so với ~1586 cần); giữ vite tạm
   `watch.ignored` cho mọi O8/vite. Trần 63747 cần can thiệp host
   (ngoài VM) mới tăng được — không thuộc tầm luồng này.
3. **`--repair` với code mới (timeout + khóa symlink) CHƯA được chạy
   sống** — cần 1 boot mà replay không chạy + postboot FAIL (tình
   huống #45/#53) để kiểm chứng, hoặc parent duyệt chạy sau khi
   bracket đóng. Chính sách repair 15 phút đã có hiệu lực từ đợt
   119 nhưng lượt đầu tiên cho kết quả "không kích hoạt" — policy
   vẫn chưa được kiểm chứng ở nhánh kích hoạt. Đổi thứ tự mục apt
   trước mục GST trong `--repair` (phương án A) chờ parent duyệt.
4. **Symlink GST → debroot vẫn là vá tạm** — phương án A/B (R9 §6.3)
   chờ parent duyệt; tới lúc đó `--repair` chỉ symlink khi apt thất
   bại. Trên boot #57? symlink KHÔNG cần (replay cài thư mục thật).
5. **Số thứ tự boot #57? CHƯA CHẮC** — chờ T6 đợt 119 đếm lại mù
   #37 (boot 6805e92d ~20:17Z + các boot có thể chưa ghi nhận trong
   gap #55→~20:17Z dài 7h25'). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số (boot_id + btime không đổi).
6. **Độ trễ khởi động replay dao động mạnh, không theo hướng xấu
   dần** (+40s → +6'28" → +22.6' → không tới → +47'14" →
   +2'05") — mẫu #53/#54 muộn dần đã đảo ngược; không suy ra xu
   hướng từ 2 boot liên tiếp nữa. Nguyên nhân khâu khởi động replay
   vẫn chưa rõ (không có log trigger trong máy).
7. **Cooldown file tích lũy (30 file, tăng từ 26)** — chưa có cơ chế
   dọn cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock
   (T4 quyết).
8. **Mù #37 nay chứa #55 + 6805e92d + #57?** nếu chưa đóng — việc
   của luồng probe đợt 119 (T6). Các mù #22/#24/#28/#29/#30/#31/
   #35/#36 chờ user quyết (không đổi).
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 118 §10: E4 lô đo
   lớn lượt 2–10 (T9) + H3f apply + A/B đợt 119 (T2, parent đã chấp
   nhận) + điểm gãy lặp s79 + cơ chế giữ tải + bar F2 đặt lại (T3) +
   ghost frame 23 (T4) + mù #37 + probe #38 (T6) + G1 + mù #22/#28–
   #31/#35 chờ user quyết; birefnet chỉ thử lại khi RAM đổi, u2net
   là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39
   cấm kiểm lại; release gate không đổi + KHÔNG push khi user chưa
   nhắn "push đi".

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi T7 (không đụng production).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T7 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  1621–2124 MB < 6 GB).
- O8: KHÔNG thuộc T7 (luồng khác làm).
- Postboot #57?: PASS lúc boot ~10'11" (live sớm) + PASS lúc boot
  ~10'43" (sau replay im) + PASS lúc boot ~13'24" (sau sửa script).
- Watcher: chạy live sớm (áp dụng bài học đợt 118 §3) + watcher
  chờ-im riêng (R9 (a) chưa duyệt nên không có watcher v2 đầu lượt).
- Replay #57?: (2'05", 7'34"] bằng dpkg.log + PASS live (boot thứ 6
  kẹp được; #53 là ngoại lệ đình trệ).
- Headroom #57?: 670 — reboot KHÔNG hồi (lần 4 có số đo boot-mới
  chứng minh hướng rơi).
- Stale vite.lock: không có (lock đang giữ sống bởi T1 đợt 119,
  queue chỉ còn cooldown cũ, v2 log không STALE mới).
- Repair 15 phút: áp dụng lần đầu — KHÔNG kích hoạt (replay tới lúc
  +2'05"); `--repair` chưa chạy sống lần nào.
- Không reboot mới trong lúc T7 làm (boot vẫn 27c8b1d9 tới 23:47Z).

## 11. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND119_T7_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #54 → #57? + ghi chú số tạm/chờ T6 đếm mù #37 trong header; không
  đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round119-t7/` (log
  watcher chờ replay, log postboot live sớm + try1 + after-edit, log
  headroom, md5 trước/sau của postboot-check, `POSTBOOT_PASS`,
  `t7-initial-state.md`, `t7-replay-done.md`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round119-t7-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round119-t7.done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

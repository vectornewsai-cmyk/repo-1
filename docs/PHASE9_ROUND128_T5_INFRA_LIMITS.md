# PHASE9_ROUND128_T5_INFRA_LIMITS — Boot #73? CHẾT trong khung (04:28:53Z, 04:55:04Z]; boot #74? replay TRỞ LẠI baseline 1.509 dòng, PASS +47m52s — #72 là ngoại lệ một lần; event lag (c2) chưa có dữ liệu mới, giữ case theo dõi

> Luồng T5, đợt 128, lượt cron 12:35 +07 17/11/2026 (bắt đầu ~05:40Z trên
> boot #74?, kết thúc ~05:44Z cùng boot — KHÔNG reboot trong lượt).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: quyết parent đợt 127 §12.2(i) — T5 THEO DÕI đợt 128, so số dòng
> replay #73 với #72 (350 dòng) và baseline 1.509 dòng; §12.1 mục 4
> (reboot giữa đợt đóng và lượt mở là mẫu lặp lại; các luồng chờ cờ
> POSTBOOT_PASS của boot mới theo luật STALE); R9 (a) vẫn chờ user;
> G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #73? CHẾT trong khung (04:28:53Z, 04:55:04Z].** btime
   03:04:25Z, boot_id `5e522260-235e-4394-a888-bce604728204`. Lần cuối
   còn sống: T10 đóng đợt 127 lúc 04:28:53Z (uptime 1:24). Tuổi thọ
   1h24m28s–1h50m39s (chưa kẹp hẹp hơn — journal/wtmp chỉ giữ boot
   hiện tại). Đây là reboot thứ 3 liên tiếp rơi vào khoảng giữa đợt
   đóng và lượt mở (#71→#72 lúc mở đợt 127, #72→#73 giữa đợt 127,
   #73→#74 giữa đợt 127 đóng và lượt 128 mở) — mẫu lặp lại đã ghi ở
   LIMITS gộp đợt 127 §12.1 mục 4.
2. **Boot #74? (MỚI) replay TRỞ LẠI baseline, PASS +47m52s.**
   btime 04:55:04Z, boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`,
   sau #73? 1h50m39s. Replay khởi động MUỘN (+40m39s) nhưng chạy
   NHANH và XONG HẲN: configure 05:35:43Z, unpack 05:36:14Z,
   installs xong 05:38:51Z (boot +43m47s, dpkg **1509 dòng, 217
   installs**, gói cuối gstreamer1.0-tools). Lists noble gốc ĐẦY ĐỦ
   (71 file, 68 noble, partial/ trống) — khác hẳn #72?. Postboot
   try1 PASS 05:41:30Z (boot +46m26s); watcher v4 2 poll PASS;
   **cờ `POSTBOOT_PASS` cho #74? đã viết 05:42:56Z (đúng boot_id)**
   — T3/T9 đợt 128 gate bằng cờ này; cờ đợt 127 (#73?) STALE.
   Final confirm 05:43:55Z exit 0. Tổng PASS 4/4, 0 FAIL.
3. **So sánh số dòng replay — ĐÁP ÁN cho quyết parent (i): #72 là
   ngoại lệ một lần.** #72 = 350 dòng (chết dạng (A), lists noble
   không về); #73 = 1509 dòng; **#74 = 1509 dòng** — baseline 1.509
   đã trở lại 2 boot liên tiếp. Không kết luận "bình thường"/"bất
   thường" từ một mẫu đã được tôn trọng: nay có 2 mẫu baseline sau
   1 mẫu lệch, đủ để nói #72 là ngoại lệ một lần, không phải hình
   dạng mới của replay host. Khác biệt còn lại của #74 chỉ là khởi
   động MUỘN (+40m39s — muộn thứ 2 sau #54? +47m14s), không phải
   hình dạng khác.
4. **Luật §8.2 dạng (B) ngưỡng 10' + luật (C): đánh giá ở MỖI poll,
   KHÔNG kích hoạt.** Trên #74? (replay xong + postboot PASS): (1)
   FAIL = no cả 2 poll → TRIGGER=NO; luật (C) không áp dụng.
5. **Event lag (c2) +1f: CHƯA CÓ DỮ LIỆU MỚI — giữ case theo dõi.**
   round128-t9 lúc T5 kiểm (05:42Z) mới chỉ có 2 log headroom của
   chính T9, chưa có probe/lượt yên nào; 0 tick mới để đối chiếu.
   Kết luận đợt 127 vẫn đứng: (c2) giải thích được (sai số lấy mẫu
   nhãn-vs-pixel median 38 ms); event seq 276–279 giữ làm case theo
   dõi, cần log draw rawUnit + currentTime lúc vẽ để đóng giả
   thuyết seek-latency desync.
6. **Headroom inotify: 3214 (05:40Z) → 3203 (mở, đã lưu) → 3205
   (cuối)** — gần như đứng yên trong lượt; tiếp tục xu hướng giảm
   dài hạn qua các boot (…3334 → 3317 → 3315 → ~3205). Vẫn ~2,0 lần
   số watch vite thường cần (~1586); CHƯA tới ngưỡng báo user
   (< ~1.800), chỉ theo dõi.
7. **RAM khả dụng 1071–1535 MB trong lượt** (thấp nhất 1071 MB lúc
   watcher poll 1, 05:41:54Z). Dù lấy số nào cũng < 6 GB guard —
   birefnet không thử.
8. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI
   lúc mở lẫn lúc cuối. Queue cooldown 67 file (bằng số T10 đếm
   lúc đóng đợt 127) — không đổi trong lượt. T5 KHÔNG đụng
   lock/queue.
9. **R9 (a) vẫn chờ user — nhắc lần 14.**
10. **Sửa `postboot-check.sh` 1 lần trong lượt** (md5
    `c9e2f827…` → `b3e35169…`): chỉ đổi tham chiếu boot (#73? →
    #74?); `bash -n` OK; try1 sau sửa PASS ngay lần đầu.

## 2. Boot #73? — chết trong khung (04:28:53Z, 04:55:04Z]

- Boot #73?: btime 03:04:25Z, boot_id
  `5e522260-235e-4394-a888-bce604728204`. Lần cuối còn sống được ghi
  nhận: T10 đóng đợt 127 lúc 04:28:53Z (uptime 1:24, suite 27/27 +
  O8 21/21 + 21/21 đều trên boot này).
- Boot mới btime 04:55:04Z → #73? chết trong khung (04:28:53Z,
  04:55:04Z] (rộng 26m11s). Tuổi thọ 1h24m28s–1h50m39s. Không kẹp
  hẹp hơn được: journal/wtmp chỉ giữ boot hiện tại (first entry
  boot mới 04:55:18Z, +14s); không có quan sát nào trong khung.
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m (chết trong
  khung (00:44:50Z, 02:10:17Z]), #72? 54m08s, #73? 1h24m28s–
  1h50m39s, #74? chưa biết (sống ≥48m tới cuối lượt T5).
- Đây là lần thứ 3 liên tiếp reboot rơi vào khoảng giữa đợt đóng và
  lượt mở (xem §1 mục 1) — các luồng đã quen với luật STALE (chờ cờ
  POSTBOOT_PASS của boot mới, không dùng cờ boot cũ). R9 (a) vẫn là
  vá gốc cho vấn đề này (nhắc lần 14).

## 3. Boot #74? — replay trở lại baseline 1.509 dòng, PASS +47m52s

### 3.1 Boot #74? — btime 04:55:04Z, gap 1h50m39s

- Boot #74?: 2026-11-17 04:55:04Z (btime kernel 1794891304;
  `uptime -s` đồng ý; journal first entry 04:55:18Z, chênh +14 s;
  boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`, sau #73?
  1h50m39s). Số thứ tự TẠM, chờ T6 đếm lại mù #37.
- `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 04:55Z.

### 3.2 Replay #74? — khởi động muộn (+40m39s) nhưng xong hẳn, 1509 dòng

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 04:55:04 | 0 | btime |
| Configure (2 dòng dpkg.log) | 05:35:43 | +40m39s | dpkg.log |
| Unpack (apt-get bắt đầu installs) | 05:36:14 | +41m10s | dpkg.log + apt history |
| Installs (217) | 05:36:14–05:38:51 | +41m10s–+43m47s | dpkg 2 → 1509 dòng |
| Gói cuối gstreamer1.0-tools | 05:38:51 | +43m47s | dpkg.log + apt history |
| Postboot try1 PASS | 05:41:30 | +46m26s | exit 0 |
| Cờ POSTBOOT_PASS viết | 05:42:56 | +47m52s | watcher poll 2 |
| Final confirm PASS | 05:43:55 | +48m51s | exit 0 |

- Khởi động MUỘN (+40m39s): muộn thứ 2 trong lịch sử T5 ghi (sau
  #54? +47m14s; trước #64? +30m21s, #72? +25m22s). Nhưng khác #72?:
  update chạy được và installs chạy NHANH (xong trong ~3m08s sau
  configure, 217 installs) — không có dấu hiệu kẹt.
- Ghi nhận (không suy diễn nhân quả): configure bắt đầu 05:35:43Z,
  chỉ 8 giây TRƯỚC khi lượt cron 12:35 +07 dispatch (05:35:51Z).
  Trùng thời gian, không có bằng chứng liên hệ — chỉ ghi nhận.
- Lists ĐẦY ĐỦ: `/var/lib/apt/lists/` 71 file, 68 file `noble`
  (main/universe/multiverse/restricted + updates/security/
  backports, cả 2 mirror azure.archive.ubuntu.com và
  mirror.cogentco.com); `partial/` TRỐNG (0 file) — update đã hoàn
  thành và dọn sạch. Khác hẳn #72? (28 file, noble gốc vắng, 8 file
  kẹt partial/).
- 2 gói từng thiếu ở #65? (libav, plugins-bad) ĐỀU ĐƯỢC CÀI
  (`dpkg-query` ii cả 2; gstreamer1.0-libav ii; plugins-ugly,
  libavif16, libevdev2 ii) — mẫu thiếu 2 gói không lặp lại lần
  thứ 5 liên tiếp (#68?, #70?, #71?, #73?, #74? đều đủ; #72? là
  ngoại lệ do lists noble thiếu).
- `term.log` 0 dòng lỗi; `history.log` cho thấy cùng mẫu replay
  os-intent của host (apt-get với DPkg::Post-Invoke ghi
  dpkg-state).
- 0 apt/dpkg/wrapper đang chạy lúc T5 mở (05:40Z) và mọi lần kiểm
  sau; lock dpkg rảnh; dpkg.log đóng băng ở 1509 dòng từ 05:38:51Z.

### 3.3 Bảng so sánh số dòng replay — đáp án quyết parent (i)

| Boot | dpkg.log (dòng) | Installs | Khởi động | Kết cục |
|---|---|---|---|---|
| #71? | 1509 | 217 | +9m59s | PASS |
| **#72?** | **350** | **48** | **+25m22s** | **CHẾT dạng (A), lists noble không về** |
| #73? | 1509 | 217 | +38s | PASS +5m51s |
| **#74?** | **1509** | **217** | **+40m39s** | **PASS +47m52s** |

- Baseline 1.509 dòng / 217 installs / gói cuối gstreamer1.0-tools
  đã trở lại 2 boot liên tiếp sau #72?. **#72 là ngoại lệ một lần**
  (nguyên nhân đã chứng minh đợt 127: lists `noble` gốc không về),
  không phải hình dạng mới của replay host. Nợ (i) ĐÓNG.
- Khác biệt còn lại của #74? so với baseline chỉ là thời điểm khởi
  động muộn (+40m39s) — khởi động muộn không dự báo chết dạng (A):
  #72? khởi động muộn hơn #71? và chết, nhưng #74? khởi động muộn
  nhất nhì mà vẫn xong hẳn. Không dùng "khởi động muộn" làm tín
  hiệu cảnh báo đơn lẻ.

### 3.4 Postboot #74? — PASS 4/4, 0 FAIL

- try1 05:41:30Z (boot +46m26s), exit 0 (`t5-postboot-b74-try1.log`):
  PASS wrapper (K1), PASS libs (đủ 5), PASS GST (thư mục thật,
  269 file = debroot), PASS apt 11/11.
- Watcher v4 poll 1–2 (05:41:54–05:42:56Z): postboot exit 0 cả 2
  poll; dpkg 1509 đóng băng; 0 apt/dpkg/wrapper; lists 71; GST 269;
  **cờ `POSTBOOT_PASS` viết 05:42:56Z (poll 2, đúng boot_id)**;
  watcher tự kết thúc `done_pass_stable_2polls`.
- Final 05:43:55Z, exit 0 (`t5-postboot-b74-final.log`): PASS lại
  toàn bộ. Tổng: PASS 4/4 lần kiểm trên #74? (try1 + poll1 +
  poll2 + final), 0 lần FAIL.
- **Không reboot trong lúc T5 chạy** (boot #74? sống từ 04:55:04Z
  tới cuối lượt T5 05:43:56Z, boot +48m52s).

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 03:09Z (boot #73?, ~5' tuổi) | 3317 | mở trên boot mới, đợt 127 |
| T5, 03:12Z (boot #73?, ~8' tuổi) | 3315 | cuối lượt đợt 127 |
| **T5, 05:40Z (boot #74?, ~45' tuổi)** | **3214** | **mở lượt đợt 128 (chưa lưu file)** |
| **T5, 05:42Z (boot #74?, ~47' tuổi)** | **3203** | **mở lượt (đã lưu headroom-open.txt)** |
| **T5, 05:43Z (boot #74?, ~48' tuổi)** | **3205** | **cuối lượt (headroom-end.txt)** |

- Headroom gần như đứng yên trong lượt (3203 → 3205; lần đo 3214
  trước đó 2 phút cho thấy dao động đo ±11) nhưng tiếp tục xu
  hướng giảm dài hạn qua các boot: 4438 → 4318 → 3645 → 3451 →
  3434 → 3334 → 3317 → 3315 → ~3205 (giảm ~110 qua 1 reboot).
  Vẫn gấp ~2,0 lần số watch vite thường cần (~1586).
  **Vite thường chạy được trên boot này. Chưa tới ngưỡng báo
  user (< ~1.800) — chỉ theo dõi** (quyết parent §12(h) đợt 127).
- Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 05:40Z | 1354 MB | lúc mở lượt |
| 05:41:54Z (watcher poll 1) | 1071 MB | thấp nhất lượt |
| 05:42:08Z | 1535 MB | cao nhất lượt |
| 05:42:56Z (watcher poll 2) | 1395 MB | lúc ghi cờ |
| 05:43:55Z | 1286 MB | lúc final |

- Dao động mạnh theo luồng khác (biên độ ~460 MB trong 4 phút);
  mức thấp nhất 1071 MB cao hơn kỷ lục thấp đợt 127 (547 MB).
  Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
- Swap đã dùng 254–314 MB trong lượt.

## 5. Watcher — b74 v4 (2 poll PASS, ghi cờ, tự kết thúc)

- Chạy 05:41:54–05:42:56Z (2 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script copy từ bản b73 đợt 127
  (v4) — chỉ đổi btime/mốc/log; `bash -n` OK trước khi chạy.
- Poll 1 (05:41:54Z): dpkg=1509 frozen=no (baseline), postboot 0,
  silent 184s (từ dòng cuối 05:38:51Z), apt=0, lists=71, GST=269,
  RAM 1071 MB.
- Poll 2 (05:42:56Z): dpkg=1509 frozen=yes, silent 245s, apt=0,
  lists=71, partial=0, GST=269, postboot 0 → **FLAG_WRITTEN
  05:42:56Z**.
- Cờ `POSTBOOT_PASS` (round128-t5/): `boot_id=c279cf46-a38b-4d93-
  b6e9-fa251b078108 btime=2026-11-17T04:55:04Z pass_at=
  2026-11-17T05:42:56Z poll=2` — đúng boot mới. Các luồng T3/T9
  đợt 128 gate bằng cờ này. Cờ đợt 127 (#73?, 5e522260…) STALE.
- KHÔNG reboot trong lúc watcher chạy (boot #74? sống từ 04:55:04Z
  tới cuối lượt T5 05:43:56Z, boot +48m52s).
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt 05:40Z (#74?) lẫn lúc kiểm cuối 05:43Z — sạch hoàn
  toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **67 file cooldown**
  (bằng số T10 đếm lúc đóng đợt 127 sau khi nhả ticket của mình;
  không đổi trong lượt; đều là cooldown cũ, không chặn luồng khác,
  không tính là ticket). Luật prune cooldown ĐÃ PHÊ DUYỆT (quyết
  parent §12(c) đợt 125) — việc prune là của T6, T5 chỉ ghi số.
- T5 KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb :197 sót của T3 đợt 127 đã hết theo reboot (0 Xvfb /
  MiniBrowser đang chạy lúc mở lượt).

## 7. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

> Quyết parent đợt 125 §12(b): §8.2 dạng (B) VỐN ĐÃ bao chế độ "chạm
> mà không cài"; ngưỡng chờ dạng (B) dpkg im ≥10 phút (thay vì 15);
> luồng hạ tầng đánh giá §8.2 ở MỖI poll khi dpkg đóng băng; hiệu lực
> từ đợt 126.
>
> 5 điều kiện §8.2 (quyết parent đợt 120 §12 mục 3): (1) postboot
> FAIL tươi (<10' trước quyết); (2) replay ĐÃ CHẾT — (a) 0 process
> apt-get/dpkg/wrapper, (b) dpkg.log không tăng ≥10', (c) lock dpkg
> rảnh; (3) ngưỡng chờ: boot ≥60' HOẶC dpkg im ≥15' — **với dạng
> (B): dpkg im ≥10'**; (4) dạng lỗi (A) "tới nhưng thiếu GST" HOẶC
> (B) "chạm mà không cài"; (5) không có luồng đo WebKit nào đang chạy
> probe trên boot đó.
>
> Luật (C) (quyết parent đợt 122 §12.4): đủ 5 điều kiện (postboot
> FAIL tươi; apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15'
> + dpkg.log im ≥15'; boot ≥60' hoặc dpkg im ≥15'; dạng (C); không
> probe đang chạy) mới kill tiến trình kẹt (ghi cờ + PID trước) rồi
> chạy --repair một lần có giám sát.

### 7.1 Đối chiếu §8.2 — boot #74? (watcher b74 v4, poll 1–2)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 05:41:54Z | 184s | no (exit 0) | yes | no | no | yes | **NO** |
| 2 | 05:42:56Z | 245s | no (exit 0) | yes | no | no | yes | **NO** |

- Postboot PASS cả 2 poll → không có cơ sở repair nào. (2a) đạt
  (replay đã xong từ 05:38:51Z) nhưng (1)/(4) chặn trigger.
- Luật (C) trên #74?: không áp dụng (replay xong + postboot PASS;
  (a) FAIL = no; apt đã chết sau khi hoàn thành, không phải
  sống-kẹt).

## 8. Chẩn đoán event lag (c2) — CHƯA CÓ DỮ LIỆU MỚI, GIỮ CASE THEO DÕI

- Lúc T5 kiểm (05:42Z), `hidden_files/round128-t9/` mới chỉ có 2
  log headroom của chính T9 (`headroom-measure-1.log`,
  `headroom-measure-2.log`) — **chưa có probe/lượt yên nào, 0 tick
  mới** để đối chiếu event seq 276–279 hay tái hiện (c2) +1f.
- Kết luận đợt 127 vẫn đứng, không đổi: **(c2) +1f GIẢI THÍCH
  ĐƯỢC** — nhãn ghost gán lúc đọc currentTime, pixels lấy mẫu muộn
  hơn median 38 ms (≈1,1 frame ở 30 fps); phân phối (pix−label)
  trên 740 ghost: 0: 265, +1: 175, +2: 175 — lệch +1/+2 là trạng
  thái thường. **Event seq 276–279 giữ làm case theo dõi** — chi
  tiết "frame tương lai" (strip đông cứng ở pixels frame 27 trong
  6 tick trong khi nhãn tiến 17→30) chưa giải thích được; cần log
  mỗi lần drawImage vào rawUnit/snapSrc kèm video.currentTime lúc
  vẽ + trạng thái seek đang chờ (đề xuất đợt 127 §8.4). Không kết
  luận hồi quy từ 1 event; không cần lượt đo E4 hay TTS nào cho
  việc này.
- Lượt yên WebKit #7 chạy lại ở đợt 128 (quyết parent §12.2(g),
  xếp lịch lệch T9-yên TRƯỚC, T8-harness SAU) sẽ là nguồn dữ liệu
  mới cho case này — T5 đợt sau đối chiếu histogram
  (pixFrame−label) trên lượt yên đó để xác nhận modal +1/+2 vẫn
  giữ (dự kiến giữ, vì là cấu trúc đo).

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (#74?, 05:41Z): md5 `c9e2f827efbd45a3052c8ff3bcad0990` →
  `b3e351697b139e410762ccdcb611a765` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn #73? (chết trong khung (04:28:53Z,
  04:55:04Z]) + đoạn #74? (replay trở lại baseline, PASS +47m52s);
  dòng `say` cập nhật tương ứng. **Không lặp sự cố đợt 120:** dòng
  `say` mới không chứa ký tự `"` (dùng `p`/`s` thay dấu phút/giây).
  `bash -n` OK.
- Kiểm chứng: sau sửa, try1 PASS exit 0 ngay lần đầu (05:41:30Z) +
  watcher 2 poll PASS + final PASS — logic không đổi đã được xác
  nhận bằng chạy thật.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên.

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #73?→#74? giữa đợt đóng và lượt mở này là ví dụ mới nhất
  cho thấy R9 (a) vẫn có giá trị: T5 phải tự phát hiện boot mới +
  cập nhật script + ghi cờ mới cho #74? trong ~3 phút sau khi lượt
  mở (lượt mở 05:40Z, cờ PASS 05:42:56Z — nhanh vì replay đã xong
  trước khi lượt mở). Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt hại,
  nhưng không thay thế R9 (a).
- Nhắc lần 14.

## 11. Nợ mở sang đợt sau

1. **Boot #74? đang sống + PASS — các luồng đo đợt 128 dùng cờ này**
   (`round128-t5/POSTBOOT_PASS`, boot_id c279cf46…, PASS 05:42:56Z,
   xác nhận lại 05:43:55Z). Nếu #74? cũng chết sớm như #72?
   (54m08s) hoặc #69? (~19–20') thì T5 đợt sau phải làm lại từ đầu.
   Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20,
   #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m (chết trong khung
   (00:44:50Z, 02:10:17Z]), #72? 54m08s, #73? 1h24m28s–1h50m39s,
   #74? chưa biết (sống ≥48m52s tới cuối lượt T5).
2. **Số thứ tự boot #73?/#74? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 128 đang chạy). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **Event lag seq 276–279 giữ làm case theo dõi** — chưa có dữ liệu
   mới đợt này; đối chiếu histogram (pixFrame−label) trên lượt yên
   #7 chạy lại (nếu T9 chạy được) để xác nhận modal +1/+2 vẫn giữ.
   (c2) đã giải thích được — không cần hành động sản phẩm; sửa
   instrumentation (nếu muốn) chờ parent quyết.
4. **Headroom tiếp tục giảm dài hạn:** …3434 → 3334 → 3317 → 3315 →
   ~3205. Trần 63747 cần can thiệp host — ngoài tầm luồng này.
   Ngưỡng báo user < ~1.800 chưa tới.
5. **RAM thấp nhất lượt 1071 MB** — dao động mạnh theo luồng khác;
   T9 theo dõi RAM ghim (nhiệm vụ T9).
6. **Khung giờ #73? chết (04:28:53Z, 04:55:04Z] chưa kẹp hẹp hơn** —
   journal/wtmp chỉ giữ boot hiện tại; không có cách kẹp từ trong VM.
   (Khung #72? chết đã kẹp đợt 127; khung #71? chết vẫn mở.)
7. **R9 (a) vẫn chờ user (nhắc lần 14).**
8. **Cooldown file tích lũy (67 file, không đổi trong lượt)** — luật
   prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune là
   của T6.
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 127 §11 + quyết
   parent §12.2: DEF v0.4 (T2 viết đợt 128); mù #47 probe thường lệ
   (T4); 85m4 webkit chạy lại (T8); lượt yên WebKit #7 chạy lại
   (T9, xếp lệch trước T8); G1 chờ user quyết; birefnet (chỉ thử lại
   khi RAM đổi, u2net là fallback chính thức); ci-security.yml vẫn
   403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi +
   KHÔNG push khi user chưa nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx` / `media.ts`: KHÔNG đổi trong lượt này (md5
  03bf029f / 2c384ed1, khớp lúc T10 đóng đợt 127). T5 không sửa
  production; chỉ sửa 1 script harness + thêm LIMITS.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #74?) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  1071–1535 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #74?: PASS 4/4 (try1 05:41:30Z + watcher b74 poll 1–2
  05:41:54–05:42:56Z + final 05:43:55Z) — 0 lần FAIL.
- Watcher b74 v4: 2/2 poll PASS, tự kết thúc
  `done_pass_stable_2polls`, exit 0. Reboot trong lượt: KHÔNG.
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT.**
  Trên #74?: TRIGGER=NO cả 2 poll (postboot PASS nên (1)/(4)
  chặn). **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT** (replay
  xong + postboot PASS). **Repair: KHÔNG CHẠY** (không đủ điều
  kiện nào).
- Headroom: 3214 → 3203 (mở) → 3205 (cuối).
- Stale vite.lock: không có (lock dir không tồn tại lúc mở lẫn lúc
  cuối; queue cooldown 67 file, không đổi).
- Event lag (c2): chưa có dữ liệu mới — giữ case theo dõi (§8).

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND128_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu #73? → #74? trong header + dòng `say`; md5
  `c9e2f827…` → `b3e35169…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round128-t5/` (log
  watcher b74 v4, log postboot try1/poll1/poll2/final, log headroom
  mở/cuối, md5 trước/sau của postboot-check, `POSTBOOT_PASS` (cờ
  hiện tại — cho boot #74?, PASS 05:42:56Z), `t5-initial-state.md`,
  `t5-wait-replay-b74.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round128-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round128-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

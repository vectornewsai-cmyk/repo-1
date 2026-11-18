# PHASE9_ROUND124_T5_INFRA_LIMITS — Boot #68? replay NHANH, PASS +8m12 — 2 gói thiếu ở #65? ĐỀU ĐƯỢC CÀI — luật repair dạng (C) đánh giá lần 2: KHÔNG kích hoạt

> Luồng T5, đợt 124, lượt cron 00:35 +07 17/11/2026 (bắt đầu ~17:41Z, boot #68? ~7' tuổi).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 123 §10–§11 (mù #39 J ĐỂ MỞ; E4 lượt 5 trên cây BASELINE;
> luật repair dạng (C) có hiệu lực, đánh giá lần 1 không kích hoạt; WebKit lượt
> yên #5 + điều tra RAM ghim 30' đầu lượt; R9 (a) vẫn chờ user; G1 khung (a) M2
> vẫn hoãn) + quyết parent đợt 123 §12 (F2 cửa (a); DEF v0.2; mù #39 J ĐỂ MỞ;
> RAM ghim điều tra có giới hạn; E4 lượt 5 phê duyệt; luật STALE đứng).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ 5 điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #68? (TẠM): replay NHANH, PASS +8m12 — boot ĐANG SỐNG.**
   btime 17:33:51Z, boot_id `69359761-1650-4956-b3cb-481410689a9b`, sau #67?
   2h41m32s. Replay: configure 17:35:42Z (boot +1m51), installs xong
   17:38:42Z (boot +4m51), dpkg 2 → 1509 dòng, gói cuối
   gstreamer1.0-tools 17:38:42Z; postboot PASS exit 0 lúc 17:42:03Z
   (boot +8m12), xác nhận lại exit 0 lúc 17:43:48Z sau khi cập nhật
   script. Cờ `POSTBOOT_PASS` hiện tại trong `round124-t5/` là cho boot
   này. Nhanh thứ 3 từ trước tới nay (sau #48 +2m44, #67? +3m12).
2. **2 gói từng thiếu ở #65? ĐỀU ĐƯỢC CÀI ở boot này**
   (gstreamer1.0-plugins-bad 17:37:27Z, gstreamer1.0-libav 17:37:37Z;
   `dpkg -l` xác nhận cả 2 trạng thái `ii`). Mẫu hình "thiếu đúng 2 gói"
   của #65? KHÔNG lặp lại — nợ mở đợt 123 §10.1 ĐÓNG theo hướng "một
   lần duy nhất ở #65?, nguyên nhân vẫn chưa rõ" (xem §3.2). Cache hiện
   CÓ file .deb gstreamer1.0-libav (đợt 123 ghi là không có) — xem §3.2.
3. **Luật repair dạng (C) — ĐÁNH GIÁ LẦN 2: KHÔNG KÍCH HOẠT.**
   Replay đã xong trước khi T5 bắt đầu (điều kiện (a)/(b)/(d) đều không
   đạt — xem §7). Không có kill nào được cân nhắc, không có `--repair`
   nào chạy. Luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch bản mục tiêu.
4. **Headroom inotify: 4438 (lúc mở, lần 1) → 4430 (lần 2) → 4415 (cuối).**
   Ổn định quanh ~4430 — vẫn gấp ~2,8 lần số watch vite thường cần
   (~1586). Vite thường chạy được trên boot này.
5. **RAM khả dụng dao động mạnh trong lượt:** 1627 MB (lúc mở, theo
   round-in-progress) → 1263 → 1017 → 2950 MB (17:45Z). Không còn mức
   ghim ~474 MB như đợt 123 lúc T5 kiểm — T9 điều tra RAM ghim trong
   30' đầu lượt (nhiệm vụ của T9, không phải T5). Dù lấy số nào cũng
   < 6 GB guard — birefnet không thử.
6. **Cập nhật `postboot-check.sh` 1 lần trong lượt** (md5 `f684bb6b…` →
   `457fdec7…`): chỉ đổi tham chiếu boot (header + dòng `say`);
   `bash -n` OK; check-only sau sửa vẫn PASS exit 0 như kỳ vọng. Xem §8.
7. **Stale vite.lock: KHÔNG có lock sót.** Thư mục lock v2 KHÔNG TỒN
   TẠI; queue 48 file cooldown (cũ, vô hại); v2 log có hoạt động bình
   thường của T10-round123 trên #67?. Xem §6.
8. **R9 (a) vẫn mở (nhắc lần 10 ở đợt này — do T10 ghi):** T5 chỉ ghi
   nhận trong LIMITS này, không nhắc thêm. Xem §9.
9. **Số thứ tự boot #68? CHƯA CHẮC** — chờ T6 đếm lại mù #37 (cùng
   lưu ý như #65?/#66?/#67?). Journal first entry +15s so với btime
   (đợt 123 ghi +11s ở #66?/#67?) — chênh 4s, ghi nhận không giải thích.

## 2. Postboot — PASS ngay lần kiểm đầu (không có FAIL nào trong lượt)

### 2.1 Boot #68? — PASS 2 lần (try1 + sau sửa), đang sống

- Boot #68?: 2026-11-16 17:33:51Z (btime kernel 1794850431;
  `uptime -s` đồng ý; journal first entry 17:34:06Z, chênh +15 s — đợt
  123 ghi +11 s ở #66?/#67?; boot_id
  `69359761-1650-4956-b3cb-481410689a9b`, sau #67? 14:52:19Z (gap
  2h41m32s). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 17:34Z.
- try1 17:42:03Z (boot +8m12), exit 0 (`t5-postboot-b68-try1.log`):
  PASS wrapper (K1), PASS libs đủ 5, GST thư mục THẬT (apt) 269 file,
  debroot 269, PASS GST (isomp4 + libav), PASS apt đủ 11/11.
- Sau sửa script 17:43:48Z (boot +9m57), exit 0
  (`t5-postboot-b68-after-edit.log`) — nội dung PASS y hệt.
- Xác nhận trong watcher poll 10, 17:55:01Z, exit 0
  (`t5-postboot-b68-poll10.log`); xác nhận cuối 18:00:02Z, exit 0
  (`t5-postboot-b68-final.log`). PASS ỔN ĐỊNH, boot vẫn sống tới cuối
  lượt T5 (18:00Z, boot +26m).
- Cờ `POSTBOOT_PASS` HIỆN TẠI trong `round124-t5/` là cho boot #68?
  (boot_id 69359761…). Cờ `POSTBOOT_PASS` của đợt 123 (round123-t5/,
  cho boot #67? 94e29be5…) đã CHẾT cùng reboot 17:33:51Z — các luồng
  đo đợt 124 KHÔNG được đọc cờ cũ (luật STALE đứng).

## 3. Replay #68? — chạy nhanh, xong trọn vẹn

### 3.1 Bracket hoàn thành

- Configure 17:35:42Z (boot +1m51 — khởi động NHANH, cùng nhóm với
  #63? +48s, #67? +40s, #48 +40s).
- Installs 17:35:42–17:38:42Z: dpkg 2 → 1509 dòng trong ~3 phút; gói
  cuối gstreamer1.0-tools 17:38:42Z (boot +4m51). 0 apt/dpkg chạy lúc
  kiểm đầu 17:41Z (pgrep -x: không có); lists 37 file, partial 0 file
  (update đã xong).
- Bracket hoàn thành: (FAIL chưa kịp kẹp live, PASS 17:42:03Z] theo
  check-only — T5 bắt đầu lúc boot đã +7' tuổi, replay xong trước đó
  nên không có lần FAIL nào trong lượt này; (17:35:42Z, 17:38:42Z]
  theo dpkg.log. Nhanh thứ 3 từ trước tới nay (sau #48 +2m44, #67?
  +3m12; nhanh hơn #61 +5m41, #66? +23m36).
- Cập nhật bảng chế độ lỗi replay (xem §3.3).

### 3.2 Nợ đợt 123 §10.1 — 2 gói thiếu ở #65?: KHÔNG lặp lại (đóng theo hướng một lần duy nhất)

- Đợt 123 §3.2/§10.1 để mở: replay #65? tiến triển tới 14:01:09Z rồi
  DỪNG khi còn thiếu gstreamer1.0-plugins-bad + gstreamer1.0-libav;
  ledger có cả 2 gói; cache có plugins-bad .deb nhưng KHÔNG có
  libav .deb — nguyên nhân chưa rõ; hỏi "nếu replay ở boot sau cũng
  dừng ở đúng 2 gói này thì đó là mẫu hình".
- Đáp án ở boot #68?: CẢ 2 GÓI ĐỀU ĐƯỢC CÀI (plugins-bad 17:37:27Z,
  libav 17:37:37Z theo dpkg.log; `dpkg -l` xác nhận `ii` cả 2;
  postboot apt 11/11 PASS). Không có mẫu hình — #65? là một lần duy
  nhất trong các boot đã quan sát (#65?, #66?, #67?, #68?).
- Cache hiện tại CÓ `gstreamer1.0-libav_1.24.1-1build1_amd64.deb`
  (đợt 123 ghi là không có trên boot #67?) — file này đã xuất hiện
  trong cache trong khoảng từ lúc kiểm đợt 123 tới 17:45Z, tức là
  được tải về bởi replay #67? hoặc #68? (cả 2 replay đều cài libav
  thành công theo postboot apt 11/11). Mtime của file (2024-04-01)
  là mtime gốc của gói, KHÔNG phải thời điểm tải về — không phân
  biệt được boot nào tải. Ghi nhận, không kết luận thêm.
- Nguyên nhân #65? dừng vẫn KHÔNG xác định được (dpkg.log của #65?
  đã mất cùng rootfs rebuild; /var/log/apt không bao giờ tồn tại).
  Nợ này ĐÓNG ở mức "một lần duy nhất, không lặp lại trong 3 boot
  sau (#66?, #67?, #68?)" — không điều tra thêm từ trong VM.

### 3.3 Bảng chế độ lỗi replay (cập nhật tới #68?)

| Boot | Chế độ | Bằng chứng |
|---|---|---|
| #45 | Không tới (43 phút quan sát) | 0 apt/dpkg; --repair vá symlink, apt FAIL (lists trống) |
| #46 | Chạy, kẹp được (1'23", 7'08"] | watcher live |
| #47 | Chạy chậm (22.6', 27.7'] | watcher live; update ~12' vì mirror chậm |
| #48 | Chạy nhanh (0'40", 2'44"] | dpkg.log |
| #52 | Chạy (6'28", 8'44"] | dpkg.log |
| #53 | Đình trệ, không tới (65+') | 0 hoạt động apt |
| #54 | Chạy muộn (47'14", 52'30"] | dpkg.log; configure→xong 5'16" |
| #57? | Chạy nhanh (2'05", 7'34"] | dpkg.log + PASS live |
| #58 | **Tới nhưng thiếu GST** (0'53", 30'02"], 350 dòng, kết thúc mà 0/9 GST | dpkg.log + FAIL 25/25 |
| #59 | Tới, còn sớm lúc +28' (698 dòng, vẫn libc-bin), kết thúc không quan sát | FAIL 15/15 |
| #60? | **Chạm mà không cài** — 2 dòng configure lúc +49'51", rồi im; 0/9 GST | dpkg.log + FAIL (T7 + T3 độc lập) |
| #61 | **Chạy nhanh** (0'40", 5'41"], 1509 dòng, PASS live lúc +6' | dpkg.log + PASS (T4 đợt 120) |
| #62? | **Chạy xong, chưa kịp PASS** — configure +9'52", update ~12', installs ~5', xong +26'19" (1509 dòng, gói cuối gstreamer1.0-tools); reboot 08:53:05Z trước khi kiểm PASS | dpkg.log + FAIL lúc +15' (T5 đợt 121); bracket nửa trái (FAIL 08:44Z, xong 08:52:06Z] |
| #63? | **Chết dạng (B)** — configure +48s, wrapper chết live (09:07:48Z, 09:08:48Z], không bao giờ chạy apt-get update; luật §8.2 kích hoạt lần đầu → --repair PASS | dpkg.log + FAIL + REPAIR_TRIGGERED + POSTBOOT_PASS 09:27:19Z |
| #64? | **(C) SỐNG NHƯNG KẸT Ở UPDATE** — configure +30'21" (muộn), update chạy 64'+ không tiến triển (partial im từ 11:41:39Z, lists đóng băng 111, dpkg 2 dòng); mirror khỏe (200 trong 0,79 s); luật §8.2 KHÔNG kích hoạt (apt+wrapper sống); postboot FAIL suốt lượt | dpkg.log + watcher 60/60 poll + curl probe 12:25Z + POSTBOOT_FAIL |
| #65? | **Chạy nhưng KHÔNG XONG HẲN** — configure +49s, tiến triển tới 14:01:09Z (GST 0→119 file, tools 14:01:09Z) rồi DỪNG khi còn thiếu libav + 2 gói apt; 0 apt/dpkg lúc 14:06:06Z, postboot GẦN ĐẠT; không watcher nào ghi cờ; reboot 14:24:43Z | build-loop-log (T9/T4 đợt 122) + ledger/cache trên đĩa |
| #66? | **Chạy tốt, PASS, boot chết sớm** — configure +10m56, update ~9–10', installs ~3', xong +23m36 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +23m58; boot CHẾT 14:52:19Z sau chỉ 27p36 | dpkg.log + watcher 7 poll + POSTBOOT_PASS (đã SUPERSEDED) |
| #67? | **Chạy RẤT NHANH** — configure +40s, xong +3m12 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +7m00, xác nhận exit 0 ở poll 10 + cuối; boot vẫn sống | dpkg.log + watcher 10 poll + POSTBOOT_PASS (hiện tại) |
| **#68?** | **Chạy NHANH, PASS, xong trọn vẹn** — configure +1m51, xong +4m51 (1509 dòng, gói cuối gstreamer1.0-tools); 2 gói từng thiếu ở #65? đều được cài; PASS exit 0 lúc +8m12, xác nhận lại +9m57, poll 10 + cuối; boot vẫn sống | dpkg.log + postboot try1/after-edit/poll10/final + watcher 15 poll |

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 14:43Z (boot #66?, ~19' tuổi) | 4447 | boot MỚI — replay đang chạy, postboot FAIL |
| T5, 14:53:53Z (boot #67?, ~1m34 tuổi) | 2830 | boot MỚI — replay đang chạy, postboot FAIL |
| T5, 15:06:05Z (boot #67?, cuối) | 4533 | sau replay PASS, postboot PASS (ổn định) |
| **T5, 17:41Z (boot #68?, ~7' tuổi)** | **4438** | **sau replay PASS, postboot PASS** |
| **T5, 17:43Z (boot #68?, ~10' tuổi)** | **4430** | **sau replay PASS, postboot PASS (lần 2, ổn định)** |
| **T5, 18:00Z (boot #68?, cuối)** | **4415** | **sau watcher 15 poll, postboot PASS (ổn định)** |

- Hai lần đo lúc mở chênh nhau chỉ 8 watch (4438 → 4430) — ổn định,
  không còn hiện tượng "số mở bị đè rồi hồi" như #67? (2830 → 4533).
  Lý do có thể: T5 bắt đầu lúc boot đã +7' tuổi, replay xong trước
  đó, các luồng khác đã khởi động xong.
- Xu hướng dài hạn (số đo lúc cuối lượt mỗi boot): … 5435–5436 (#63?)
  → 4552 (#64?) → 4533 (#67?) → 4415 (#68?). Ổn định quanh ~4500
  sau #63? — vẫn gấp ~2,8 lần số watch vite thường cần (~1586).
  **Vite thường chạy được trên boot này.**
- Trần 63747 vẫn đầy ở mức ~59k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.
- RAM khả dụng: 1627 MB (lúc mở, theo round-in-progress) → 1263 MB
  (17:41Z) → 1017 MB (17:43Z) → 2950–3473 MB (17:45–17:46Z) →
  1722–3540 MB trong watcher (15 poll, 17:45–18:00Z, thấp dần về cuối:
  3473 → 3037 → 3018 → 2316 → 3300 → 3540 → 3364 → 3259 → 2454 →
  2681 → 2371 → 2431 → 2108 → 1907 → 1722) → 1664 MB (cuối,
  18:00Z). Dao động mạnh theo luồng khác đang chạy; KHÔNG còn mức
  ghim ~474 MB như đợt 123 lúc T5 kiểm. T9 điều tra RAM ghim trong
  30' đầu lượt — nhiệm vụ của T9, T5 chỉ ghi số đo của mình. RAM tổng
  7934 MB, swap 1023 MB. Dù lấy số nào cũng < 6 GB guard — birefnet
  không thử (đứng theo LIMITS gộp).

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do như đợt 119/120/121/122/123: headroom đủ chạy vite thường,
  nhưng thử vite không thuộc nhiệm vụ T5 đợt này; các luồng đo tự
  quyết đường chạy của họ theo số đo từng boot.

## 5. Watcher — b68 chạy đủ 15 poll, boot ổn định, PASS xác nhận 4 lần

### 5.1 Watcher b68 (`t5-wait-replay-b68.sh`, PID 13527)

- Chạy 17:44:59Z → 18:00:04Z (15 poll, 17:45:59–18:00:01Z).
  Log `t5-wait-replay-b68.log` (15 poll + start/end): MỌI poll đều
  boot_changed=no, dpkg ĐÓNG BĂNG 1509, apt=no, wrapper=no,
  lists_files=35 (ổn định — `find -type f`; lần đếm `ls` lúc mở là
  37 entry vì gồm 2 thư mục con, không phải thay đổi thật).
- Không có reboot giữa lượt: boot_id giữ nguyên
  `69359761-…` từ đầu tới cuối; phiên exec của T5 không bị gián đoạn.
- Postboot trong watcher poll 10 (17:55:01Z): exit 0
  (`t5-postboot-b68-poll10.log`); postboot cuối (18:00:02Z): exit 0
  (`t5-postboot-b68-final.log`). Cùng try1 (17:42:03Z) + after-edit
  (17:43:48Z) → PASS đã xác nhận 4 lần độc lập trong lượt.
- Headroom cuối trong watcher: 4415 (18:00Z); RAM cuối 1664 MB.
- Watcher chạy ĐỦ 15 poll theo kế hoạch rồi tự kết thúc
  (`WATCHER_DONE 18:00:04Z`) — không dừng sớm tay (khác b67 đợt 123
  dừng ở poll 10): replay đã xong trước khi T5 bắt đầu nên watcher
  này chỉ để xác nhận boot ổn định + bắt reboot giữa lượt, và 15
  phút là đủ cho mục đích đó; các luồng đo đã có cờ PASS từ 17:42Z.
- KHÔNG lặp lỗi vận hành đợt 122/123: không dùng `pkill -f` với mẫu
  chứa tên script watcher — watcher tự kết thúc, không cần kill;
  kiểm PID 13527 bằng `ps -p` sau khi xong (đã chết, xem §11).

### 5.2 Không có reboot giữa lượt

- Boot #68? sống liên tục từ 17:33:51Z tới cuối lượt T5 (18:00Z,
  boot +26m). Đây là lượt đầu tiên kể từ đợt 121 T5 không phải xử lý
  reboot giữa chừng (đợt 123 có 1 reboot #66?→#67? giữa lượt).
- Cờ `POSTBOOT_PASS` cho #68? không cần đánh dấu SUPERSEDED; cờ
  của đợt 123 (cho #67?) đã chết cùng reboot 17:33:51Z trước khi
  đợt 124 mở.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc kiểm
  17:41Z — sạch hoàn toàn (như #64?, #66?, #67?).
- Thư mục queue `hidden_files/vite.lock.queue` có **48 file cooldown**
  (tăng từ 45 ở #67? — +3 file mỗi boot; đều là cooldown cũ đã hết
  hạn, không chặn luồng khác, không tính là ticket). T5 KHÔNG xóa
  (không cần; để T6 — chủ mảng lock — quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối trên #67? là T10-round123
  (15:47:23–15:49:08Z, TICKET/ACQUIRED port 5554 wait_s=15 /
  RELEASED hold_s=104 — bình thường); **0 hoạt động nào trên #68?
  tới lúc kiểm cuối** (17:41Z).
- T5 KHÔNG đụng vào lock/queue (không kill vite, không xóa lock tay) —
  đúng luật: hàng đợi FIFO là hành vi thiết kế.

## 7. Luật repair dạng (C) — ĐÁNH GIÁ LẦN 2 (quyết parent đợt 122 §12.4)

> Quyết parent đợt 122 §12 mục 4: PHÊ DUYỆT bổ sung điều kiện repair cho
> chế độ lỗi (C) "sống nhưng kẹt ở apt-get update" — đủ 5 điều kiện
> (postboot FAIL tươi; apt còn sống nhưng 0% CPU qua ≥2 lần kiểm ≥15'
> + dpkg.log im ≥15'; boot ≥60' hoặc dpkg im ≥15'; dạng (C); không probe
> đang chạy) mới kill tiến trình kẹt (ghi cờ + PID trước) rồi chạy
> --repair một lần có giám sát; hiệu lực từ đợt 123.

### 7.1 Đối chiếu 5 điều kiện trên boot #68? (lúc T5 bắt đầu, 17:41–17:45Z)

| # | Điều kiện (C) | Kết quả trên #68? | Bằng chứng |
|---|---|---|---|
| (a) | Postboot check-only FAIL tươi | **KHÔNG ĐẠT** | try1 17:42:03Z exit 0 (PASS ngay lần đầu); after-edit 17:43:48Z exit 0 |
| (b) | apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15' VÀ dpkg.log im ≥15' (2 lần đọc cách nhau ≥15') | **KHÔNG ĐẠT** | 0 apt/dpkg chạy lúc kiểm (pgrep -x: không có); dpkg 2 → 1509 dòng trong ~3 phút — replay ĐÃ XONG trước khi T5 bắt đầu, không có khoảng im nào để đo |
| (c) | Boot ≥60' tuổi HOẶC dpkg im ≥15' | Không đạt lúc quyết (boot ~8–11') | Moot vì (a)/(b)/(d) đã không đạt |
| (d) | Dạng (C): dpkg.log chỉ ≤2 dòng hoặc 0 dòng install, lists trống | **KHÔNG ĐẠT** | dpkg.log 1509 dòng; lists 37 file; GST 269 file — đây là replay KHỎE, đã xong, không phải dạng (C) |
| (e) | Không có probe WebKit nào đang chạy trên boot đó | Không kiểm chi tiết (moot) | Moot vì (a)/(b)/(d) đã không đạt |

- **Kết luận: luật (C) KHÔNG kích hoạt trên boot #68? — KHÔNG có kill
  nào được cân nhắc, KHÔNG có `--repair` nào chạy.** Đây là lần đánh
  giá thứ 2 sau khi luật có hiệu lực (lần 1 ở đợt 123 trên #66?/#67?),
  và kết quả vẫn là "no-trigger" — đúng thiết kế (luật chỉ kích hoạt
  khi replay kẹt thật). Luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch bản
  mục tiêu (dạng (C) thật như #64?); lần thử đầu vẫn chờ một boot
  kẹt thật trong tương lai.
- Ghi rõ để đợt sau khỏi hiểu nhầm "luật (C) đã áp dụng ở đợt 124":
  luật đã ĐÁNH GIÁ (lần 2) nhưng KHÔNG ÁP DỤNG (không đủ điều kiện).

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (#68?, 17:43Z): md5 `f684bb6b08ad64bd48d64b0f44dc2807` →
  `457fdec79e4bef5c65f2fd27b7be5756` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/119/120/121/
  122/123, không đổi logic):
  - Header: bổ sung đoạn boot #68? (replay nhanh, PASS +8m12, 2 gói
    từng thiếu ở #65? đều được cài, headroom 4438).
  - Dòng `say`: `#67? = 2026-11-16 14:52:19Z…` → `#68? = 2026-11-16
    17:33:51Z, boot_id 69359761-…, sau #67? 14:52:19Z — số tạm, chờ T6
    đếm lại mù #37`.
- **Không lặp sự cố đợt 120:** dòng `say` mới không chứa ký tự `"`
  (dùng `p`/`s` thay dấu phút/giây, như bài học T7 đợt 120 §9).
  `bash -n` OK ngay lần đầu.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn PASS exit 0
  đúng như kỳ vọng (17:43:48Z, boot +9m57) — replay đã xong trước khi
  sửa nên không có lần FAIL nào trong lượt này.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên để parent quyết. `--repair` code mới đã
  chạy sống 1 lần ở #63? (PASS) — lần chạy sau (nếu luật kích hoạt)
  vẫn chạy đúng thứ tự hiện tại (mục 3 GST symlink trước, mục 4 apt
  install sau) trừ khi phương án A được duyệt kèm.

## 9. R9 (a) vẫn mở (nhắc lần 10 ở đợt này — do T10 ghi)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng đợt
  117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Theo task T5 đợt 124, việc nhắc lần 10 do T10 ghi trong LIMITS gộp
  — T5 chỉ ghi nhận ở đây, không nhắc thêm.
- Reboot #67?→#68? giữa đợt 123 và đợt 124 (17:33:51Z, boot #67? sống
  2h41m32 — dài hơn hẳn #66? 27p36) là ví dụ mới nhất cho thấy R9 (a)
  vẫn có giá trị: cờ PASS của #67? (round123-t5/) đã chết cùng reboot
  và T5 đợt này phải ghi cờ mới cho #68? trong ~9 phút sau boot.
  Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt hại, nhưng không thay thế
  R9 (a).

## 10. Nợ mở sang đợt sau

1. **Replay #65? dừng khi còn thiếu 2 gói — ĐÓNG theo hướng một lần
   duy nhất** (xem §3.2): 3 boot sau (#66?, #67?, #68?) đều cài đủ
   cả 2 gói; nguyên nhân #65? vẫn chưa rõ nhưng không còn là mẫu
   hình cần điều tra. Không kiểm lại từ trong VM.
2. **Boot #68? đang sống + PASS — các luồng đo đợt 124 dùng cờ này.**
   Nếu #68? cũng chết sớm như #66? (27p36) thì T5 đợt sau phải làm lại
   từ đầu (khởi động lại watcher + cờ mới). Không có gì đảm bảo boot
   sống lâu — tuổi thọ boot gần đây: #64? ~1h47, #65? ~1h31, #66?
   27p36, #67? 2h41m32 (tính tới reboot 17:33:51Z).
3. **Headroom: 4438 → 4430 lúc mở** — ổn định, không còn hiện tượng
   số mở bị đè như #67?. Trần 63747 cần can thiệp host (dọn watch
   ngoài cell / tăng trần) — ngoài tầm luồng này.
4. **Symlink GST → debroot từ repair #63? đã mất theo reboot**
   (ephemeral, như mọi lần) — trên #68? thư mục GST hệ thống là thư
   mục THẬT do apt cài (269 file), không cần symlink. Phương án A/B
   (R9 §6.3) chờ parent duyệt.
5. **Số thứ tự boot #68? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (gap #67→#68 2h41m32s; nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số — boot_id + btime không đổi).
6. **R9 (a) vẫn chờ user (nhắc lần 10 ở đợt này — do T10 ghi).**
7. **Cooldown file tích lũy (45 → 48 file)** — chưa có cơ chế dọn
   cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock (T6 quyết).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 123 §10–§11: E4 lượt
   5 (A, gop250, e4a5) trên cây BASELINE đợt 124 (prereg E4 phải ghi rõ
   thư mục cờ của luồng hạ tầng ĐỢT HIỆN TẠI — đợt 124 là
   `round124-t5/`); H3f đã gỡ, không apply lại; leg B theo DEF v0.2;
   G1 chờ user quyết + mù #22/#28–#31/#35/#39 chờ user quyết (mù #39
   J đã CHẤP NHẬN ĐỂ MỞ); birefnet (chỉ thử lại khi RAM đổi, u2net là
   fallback chính thức); ci-security.yml vẫn 403 chờ user; TTS 39 cấm
   kiểm lại; release gate không đổi + KHÔNG push khi user chưa nhắn
   "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` md5 lúc T5 kiểm (17:45Z):
  `03bf029f09b8890b285eacc10a02172b` — KHỚP baseline của đợt 124
  (round-in-progress.md). **T5 KHÔNG sửa preview.tsx.**
- `media.ts` md5 `2c384ed13703809d5e999311147745e7` khớp baseline,
  không đổi.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  1017–2950 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #68?: PASS 4 lần (try1 17:42:03Z + sau sửa 17:43:48Z +
  watcher poll 10 17:55:01Z + cuối 18:00:02Z) — 0 lần FAIL trong lượt.
- Watcher b68: 15/15 poll (17:44:59–18:00:04Z, chạy đủ kế hoạch, tự
  kết thúc; boot ổn định, dpkg đóng băng 1509, apt/wrapper không chạy).
- Replay #68?: XONG +4m51, PASS +8m12 — nhanh thứ 3 từ trước tới nay.
- **Repair (cả §8.2 lẫn luật (C)): KHÔNG CHẠY** — luật (C) đánh giá
  lần 2, không kích hoạt (điều kiện (a)/(b)/(d) không đạt: replay đã
  xong trước khi T5 bắt đầu).
- Headroom: 4438 (lúc mở) → 4430 (lần 2) → 4415 (cuối).
- Stale vite.lock: không có (lock dir không tồn tại; queue chỉ còn
  cooldown cũ 45 → 48 file).
- Reboot mới: KHÔNG — 0 lần giữa lượt (boot #68? sống từ 17:33:51Z
  tới cuối lượt T5 18:00Z, boot +26m).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND124_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu #68? trong header + dòng `say`; md5 `f684bb6b…` →
  `457fdec7…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round124-t5/` (log
  watcher b68 15 poll, log postboot try1/after-edit/poll10/final,
  log headroom now/final, md5 trước/sau của postboot-check,
  `POSTBOOT_PASS` (cờ hiện tại — cho boot #68?, PASS 17:42:03Z),
  `t5-initial-state.md`, `t5-wait-replay-b68.sh` + `.pid`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round124-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round124-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

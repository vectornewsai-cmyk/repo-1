# PHASE9_ROUND122_T5_INFRA_LIMITS — Hạ tầng boot #64?: replay khởi động muộn +30p21 rồi KẸT ở apt-get update 64 phút (chế độ lỗi MỚI: sống nhưng kẹt) — luật §8.2 KHÔNG kích hoạt, KHÔNG repair, postboot FAIL suốt lượt

> Luồng T5, đợt 122, lượt cron 18:35 +07 16/11/2026 (bắt đầu ~11:37Z, boot ~32' tuổi).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 121 §10 mục 5 (hạ tầng + luật replay-chết; headroom
> hồi 0 → 5436 sau repair; số hiệu boot #62/#63 vẫn "tạm") + quyết parent
> đợt 121 §12 (E4 chạy bù lượt 3 trước rồi lượt 4; H3f đo thêm A/B có kiểm
> soát; leg B theo DEF PSI v0.1; R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ 5 điều kiện §8.2. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot hiện tại là #64? (SỐ TẠM)** — boot 2026-11-16 11:05:18Z
   (btime kernel 1794827118 / `uptime -s`; journal first entry
   11:05:29Z, chênh +11 s — cùng mẫu +11 s như #62?; `stat` btime
   của `/` 11:05:27Z), boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`,
   sau #63? 08:53:05Z (gap 2h12'13"). Số thứ tự CHƯA CHẮC (chờ T6
   đếm lại mù #37); trong file này gọi tạm "#64?" và luôn kèm
   boot_id + btime. `journalctl --list-boots` CHỈ CÒN 1 boot (hiện
   tại); `last -x` chỉ còn 1 dòng reboot 11:05Z — log các boot
   trước đã mất cùng rootfs rebuild (cùng cơ chế mất log như mọi
   boot trước).
2. **Postboot #64?: FAIL SUỐT LƯỢT, chưa từng PASS.** Check-only
   exit 1 ở mọi lần kiểm: try1 11:37Z, sau sửa script 11:38Z,
   watcher poll 10/20/30/40/50/60 + cuối (11:48Z → 12:38Z). Thiếu
   5 lib + GST (thư mục không tồn tại, 0 plugin hệ thống, debroot
   269) + 11 gói apt — y hệt FAIL lúc mở của #62?/#63?. Xem §2.
3. **Replay KHỞI ĐỘNG MUỘN rồi KẸT — CHẾ ĐỘ LỖI MỚI.** Configure
   11:35:39Z (boot +30'21", muộn nhất kể từ #60? +49'51"); wrapper
   os-intent pid 834 + `apt-get update` pid 855 chạy từ 11:35Z và
   VẪN CHẠY tới cuối lượt (etime 01:04:26 lúc 12:40Z) — nhưng
   KHÔNG TIẾN TRIỂN: dpkg.log dừng ở 2 dòng configure, thư mục
   partial không ghi thêm file nào từ 11:41:39Z (~58 phút im),
   lists dừng ở 111 file từ poll 4. Đây KHÔNG phải dạng (A)
   "tới nhưng thiếu GST" cũng KHÔNG phải dạng (B) "chạm mà không
   cài" — mà là dạng mới **"sống nhưng kẹt ở update"** (alive-but-
   wedged). Xem §3.
4. **KẸT KHÔNG PHẢI DO MIRROR.** Probe đọc-only 12:25Z:
   `azure.archive.ubuntu.com/.../InRelease` trả HTTP 200 trong
   0,79 s; `archive.ubuntu.com` 200 trong 1,46 s. Mirror khỏe,
   mạng tới được — apt-get (0% CPU, trạng thái S, methods http/
   https/gpgv/store đều sống từ 11:35Z) kẹt ở bên trong máy trạng
   thái fetch của chính nó, không phải do mirror chết/chậm. Xem §3.3.
5. **Luật replay-chết §8.2 — ĐÁNH GIÁ LẦN 2 (sau lần kích hoạt
   đầu ở #63?): KHÔNG KÍCH HOẠT.** Điều kiện 2(a) KHÔNG đạt
   (apt-get + wrapper ĐANG CHẠY) → **KHÔNG chạy `--repair`.**
   Đây là kết quả đúng thiết kế của luật (luật chỉ kích hoạt khi
   replay chết; replay sống — dù kẹt — thì chờ). Nhưng luật HIỆN
   TẠI không có điều khoản nào cho "sống nhưng kẹt": nếu update
   kẹt vô hạn thì boot này không bao giờ đủ điều kiện chạy
   WebKit mà cũng không bao giờ đủ điều kiện repair — CẦN QUYẾT
   PARENT cho đợt 123 (xem §7 + §10 mục 1). T5 KHÔNG tự mở rộng
   luật.
6. **Headroom inotify hiệu dụng: 4440 → 4552 — HỒI TỪ 0, GIẢM
   SO VỚI #63?.** Đo lúc mở 4440 (11:38Z), poll 30 = 4552,
   cuối = 4552 (ổn định, 2 lần đo cách nhau 30 phút trùng nhau).
   Vite thường (~1586 watch) chạy được trở lại; vẫn thấp hơn
   5435–5436 của #63? khoảng ~900. Xem §4.
7. **Cập nhật `postboot-check.sh` (md5 `4d7c07be…` →
   `a10b43ea…`):** chỉ đổi tham chiếu boot (thêm kết quả #63? +
   đoạn boot #64? trong header + dòng `say`); `bash -n` OK +
   chạy kiểm chỉ-đọc lại vẫn FAIL exit 1 như kỳ vọng. Xem §8.
8. **Không reboot mới trong lượt T5.** Boot vẫn 3fe7e89e từ
   11:37Z tới 12:40Z (watcher 60/60 poll, boot_changed=no mọi
   poll). T5 KHÔNG phải khởi động lại (khác đợt 121, nơi reboot
   #63 giết watcher đợt 1).
9. **Stale vite.lock: KHÔNG có lock sót.** Thư mục lock v2 KHÔNG
   TỒN TẠI trên boot #64? (sạch); queue 42 file cooldown (tăng
   từ 38 ở #62? — đều cũ, vô hại; T5 không xóa); v2 log không có
   hoạt động nào mới trên boot #64? tới lúc kiểm ngoài test của
   T6 đợt 122 đang chạy (acquire live 11:39Z — đó là việc của T6,
   T5 không đụng). Xem §6.
10. **R9 (a) vẫn mở (nhắc lần 8):** cron chạy watcher v2 ở đầu
    mỗi lượt với `--wait-new-boot` — parent KHÔNG PHÊ DUYỆT ở đợt
    117 §13 Quyết 9 (thay đổi thân cron, cần user đồng ý); T5
    KHÔNG tự đổi thân cron. Xem §9.
11. **Các luồng đo khác đã về 4/9 lúc 12:40Z (T3, T6, T7, T8)**
    dù postboot FAIL suốt lượt — họ tự xử lý gate theo prereg
    của mình (T10 xác minh khi gộp; T5 không kết luận thay họ).
    Cờ `POSTBOOT_FAIL` của T5 vẫn đứng (không có `POSTBOOT_PASS`
    nào được ghi trong đợt này).

## 2. Postboot #64? — FAIL ở mọi lần kiểm (check-only, replay đang chạy/kẹt)

- Boot #64?: 2026-11-16 11:05:18Z (btime kernel 1794827118;
  `uptime -s` đồng ý; journal first entry 11:05:29Z, chênh +11 s
  — cùng mẫu +11 s như #62?; `/proc/uptime` ~32' tuổi lúc
  11:37Z; `stat` btime của `/` 11:05:27Z — 5 nguồn đồng ý trong
  ~11 s, KHÔNG có dấu hiệu giây nháy như #54). boot_id
  `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`, sau #63? 08:53:05Z
  (gap 2h12'13"). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện
  tại); `last -x` chỉ còn 1 dòng reboot 11:05Z (wtmp begins
  11:05:29Z).
- Lần kiểm try1: 11:37Z (boot ~32' tuổi), script bản T5 đợt 121
  (md5 `4d7c07be…`), exit 1 (`t5-postboot-b64-try1.log`).
  - PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
  - FAIL libs: thiếu: libevent-2.1.so.7 libEGL.so.1 libavif.so.16
    libdw.so.1 libevdev.so.2.
  - FAIL GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` không tồn
    tại; file plugin hệ thống = 0 (debroot vẫn 269).
  - FAIL GST: thiếu isomp4=1 libav=1.
  - FAIL apt: chưa cài: libevent-2.1-7t64
    gstreamer1.0-plugins-base gstreamer1.0-plugins-good
    gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
    gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16
    libgstreamer1.0-0 libevdev2 (11 gói).
  - KẾT LUẬN: CHƯA ĐỦ — chạy lại với --repair, hoặc chờ apt
    replay xong rồi chạy lại.
- Lần kiểm sau khi sửa script (§8): 11:38Z (boot ~33'), exit 1
  (`t5-postboot-b64-after-edit.log`) — nội dung FAIL y hệt, chỉ
  khác dòng `say` đã cập nhật boot #64?.
- Watcher poll 10/20/30/40/50/60 + cuối (11:48Z → 12:38Z):
  TẤT CẢ exit 1, cùng nội dung FAIL (log
  `t5-postboot-b64-poll{10,20,30,40,50,60}.log` +
  `t5-postboot-b64-final.log`, mỗi file 1277 byte — cùng nội
  dung, không đổi suốt 60 phút quan sát).
- **`--repair` KHÔNG chạy: luật §8.2 không kích hoạt (xem §7).**
  Replay đang chạy/kẹt (apt-get pid 855 + wrapper pid 834) nên
  chữ của script "chạy lại với --repair" KHÔNG được làm theo
  mù — phải đối chiếu 5 điều kiện §8.2 trước (điều kiện 2 đã
  không đạt).
- Cờ `POSTBOOT_FAIL` đã ghi cho các luồng khác dùng lúc 11:38Z
  — theo §8.5 đã chính thức hóa từ đợt 121. Nội dung cờ ghi RÕ:
  "REPLAY ĐANG CHẠY — KHÔNG PHẢI REPLAY CHẾT: FAIL này = 'chưa
  đủ, replay đang chạy'". Gate-wait đọc cờ FAIL này thì TIẾP
  TỤC CHỜ, không kết luận gate 0 chết. Cờ được cập nhật cuối
  lượt (12:40Z) thêm dòng: watcher 60/60 xong, update kẹt 64
  phút, vẫn FAIL, không repair theo §8.2 — cờ vẫn là FAIL, không
  có cờ PASS nào trong đợt này.

## 3. Replay boot #64? — khởi động muộn, rồi kẹt ở apt-get update (chế độ lỗi MỚI)

### 3.1 Bằng chứng tại thời điểm T5 kiểm đầu (11:37–11:38Z, boot ~32–33')

- `/var/log/dpkg.log`: **chỉ 2 dòng, cả hai cùng giây**
  `2026-11-16 11:35:39 startup packages configure` (boot
  +30'21"); file mtime 11:35:39Z; 0 entry nào trước 11:35:39, 0
  entry nào sau tới cuối lượt (12:40Z vẫn 2 dòng).
- **Replay ĐANG CHẠY:** wrapper os-intent pid 834 (start 11:35,
  `sh -c` payload `HATCH_OS_INTENT_SEED_BASELINE`, kèm hook
  reseed + `dpkg --configure -a` + vòng install theo ledger) +
  `apt-get update` pid 855 (start 11:35) + methods http (859,
  860) / https (861, 862) / gpgv (1745) / store (1885). `pgrep -x
  apt-get` = 855; `pgrep -f HATCH_OS_INTENT_SEED_BASELINE` = 834
  (+ con 2359 — lưu ý: con số này đọc từ script file, không
  tự-match; xem ghi chú phương pháp §7.3 đợt 121).
- `/var/log/apt`: **KHÔNG TỒN TẠI** (giống #60?/#62?/#63? — apt-get
  update không tạo thư mục này; chỉ install/remove mới ghi
  history.log — không dùng sự vắng mặt của nó để kết luận replay
  chết).
- `/var/lib/apt/lists/`: lúc 11:37Z chỉ `auxfiles/`, `lock`,
  `partial/` (0 file lists hoàn chỉnh); `partial/` chứa 110 file
  lúc kiểm 12:16Z.
- Lock dpkg: `/var/lib/dpkg/lock`, `/var/lib/dpkg/lock-frontend`,
  `/var/lib/apt/lists/lock` đều size 0, mtime 11:35 — apt-get
  pid 855 chạy root nên `fuser` non-root không đáng tin làm bằng
  chứng duy nhất (ghi nhận lại hạn chế này từ đợt 121 §3.1).
- GST: thư mục plugin không tồn tại; `dpkg -l | grep -i
  gstreamer` — 0 package; 11 gói kiểm từng gói đều MISSING.
- Libs: 5 lib đều MISSING theo script (ldconfig -p không thấy).

### 3.2 Diễn biến qua watcher 60 poll (11:38:24Z → 12:38:33Z) — kẹt, không tiến triển

- Poll 1–4 (11:39–11:42Z): lists_files 85 → 92 → 110 → 111 —
  update ĐANG FETCH trong ~7 phút đầu (tăng 26 file lists).
- Poll 4 → poll 60 (11:42Z → 12:38Z): lists_files ĐÓNG BĂNG ở
  111; dpkg_lines ĐÓNG BĂNG ở 2; apt=yes + wrapper=yes MỌI poll
  (60/60); RAM khả dụng 387–2685 MB, cuối lượt ~400–450 MB.
- `apt-get update` pid 855: etime 39:59 lúc 12:15:39Z → 49:29 lúc
  12:25:09Z → **01:04:00 lúc 12:38:39Z → 01:04:26 lúc 12:40Z**
  — hơn 1 giờ cho MỘT lệnh update, 0% CPU, trạng thái S
  (sleeping). So sánh: #62? update ~12' rồi installs chạy;
  #63? wrapper chết sau ~15' rồi repair update ~12'.
- Thư mục `/var/lib/apt/lists/partial`: mtime **11:41:39Z** —
  KHÔNG GHI THÊM FILE NÀO trong ~58 phút (11:41Z → 12:40Z).
  110 file partial nằm đó từ lúc update fetch dở.
- **Kết luận: replay SỐNG nhưng KẸT.** Process sống, methods
  sống, nhưng không có tiến triển filesystem nào trong ~58 phút.
  Không phải "chết" (điều kiện 2(a) không đạt), không phải
  "chậm nhưng tiến triển" (như #47 update ~12' rồi xong) — đây
  là chế độ lỗi CHƯA TỪNG GẶP: **(C) "sống nhưng kẹt ở update"**.
  Bảng chế độ lỗi cập nhật ở §3.4.

### 3.3 Kẹt không phải do mirror — bằng chứng trực tiếp (12:25Z)

- Probe đọc-only (curl, timeout 15 s, không cài gì):
  `azure.archive.ubuntu.com/ubuntu/dists/noble/InRelease` →
  **HTTP 200 trong 0,79 s, 255.850 byte**;
  `archive.ubuntu.com/ubuntu/dists/noble/InRelease` → **HTTP 200
  trong 1,46 s**.
- Mirror trả lời nhanh từ chính cell này, trong khi apt-get của
  replay (chạy từ 11:35Z, cùng mirror azure trong partial) không
  ghi thêm file nào từ 11:41:39Z. → Kẹt nằm ở bên trong trạng
  thái fetch của apt (method child chờ socket không bao giờ xong
  / gpgv/store tắc — chưa xác định được child nào tắc, vì mọi
  child đều ở trạng thái S 0% CPU), KHÔNG phải do mirror chết,
  mạng đứt, hay DNS.
- Ghi rõ để đợt sau khỏi đi nhầm hướng "đổi mirror": mirror
  khỏe; vấn đề là tiến trình update của replay.

### 3.4 Bảng chế độ lỗi replay (cập nhật tới #64?)

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
| **#64?** | **(C) SỐNG NHƯNG KẸT Ở UPDATE** — configure +30'21" (muộn), update chạy 64'+ không tiến triển (partial im từ 11:41:39Z, lists đóng băng 111, dpkg 2 dòng); mirror khỏe (200 trong 0,79 s); luật §8.2 KHÔNG kích hoạt (apt+wrapper sống); postboot FAIL suốt lượt | dpkg.log + watcher 60/60 poll + curl probe 12:25Z + POSTBOOT_FAIL |

## 4. Headroom inotify + RAM (boot #64?)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T8, 08:40Z (boot #52, ~11' tuổi) | 948 | boot MỚI — trước thử vite |
| T8, 09:02Z (boot #52, ~33' tuổi) | 925 | sau thử vite |
| T7, 11:41Z (boot #54, ~53' tuổi) | 804 | boot MỚI — sau replay + postboot PASS |
| T7, 23:44Z (boot #57?, ~10'43" tuổi) | 670 | boot MỚI — sau replay + postboot PASS |
| T7, 05:44Z (boot #60?, ~58' tuổi) | 545 | boot MỚI — sau postboot FAIL |
| T5, 08:41Z (boot #62?, ~15' tuổi) | **0** | boot MỚI — replay đang chạy, postboot FAIL |
| T5, 09:26Z (boot #63?, ~34' tuổi) | 5436 | sau --repair PASS |
| T5, 09:56Z (boot #63?, ~64' tuổi) | 5435 | sau --repair PASS (ổn định) |
| **T5, 11:38Z (boot #64?, ~33' tuổi)** | **4440** | **boot MỚI — replay đang chạy, postboot FAIL** |
| **T5, 12:08Z (boot #64?, poll 30)** | **4552** | **replay kẹt ở update, postboot FAIL** |
| **T5, 12:38Z (boot #64?, cuối)** | **4552** | **replay kẹt ở update, postboot FAIL (ổn định)** |

- Xu hướng dài hạn (số đo lúc mở lượt mỗi boot): … 948 → 925 →
  804 → 670 → 545 → **0 (#62?) → 5436 (#63?) → 4440 (#64?)**.
  Headroom HỒI từ 0 sau reboot #63? (repair), rồi GIẢM ~900
  sau reboot #64? — nhưng vẫn cao hơn mọi boot trước #63? và
  vẫn gấp ~2,8 lần số watch vite thường cần (~1586). **Vite
  thường chạy được trở lại trên #64?** (không cần mirror
  `watch.ignored` vì lý do headroom — các luồng khác vẫn dùng
  mirror theo quyết của họ; T5 không ra lệnh đổi).
- Headroom ổn định trong lượt: 4440 → 4552 (+112 trong 30 phút
  đầu quan sát) rồi đóng băng 4552 ở poll 30 + cuối (2 lần đo
  cách nhau 30 phút trùng nhau tuyệt đối) — không rơi tiếp trong
  lúc các luồng khác chạy probe.
- Trần 63747 vẫn đầy ở mức ~59k watch ngoài cell (theo ghi nhận
  đợt 120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm
  luồng này.
- RAM khả dụng: 802 MB (lúc mở) → 858–2685 MB (poll 1–18) →
  **~400–450 MB liên tục từ poll 40 (12:18Z) tới cuối**
  (poll 40: 402; poll 49: 387; cuối: 442). Dao động theo luồng
  khác đang chạy (T1/T2/T4/T9 chạy probe nặng lúc đó); dù lấy số
  nào cũng < 6 GB guard — birefnet không thử (đứng theo LIMITS
  gộp). RAM tổng 7934 MB, swap 1023 MB.

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do như đợt 119/120/121: headroom 4440–4552 > 1586 vite cần
  (đủ chạy), nhưng thử vite thường không thuộc nhiệm vụ T5 đợt
  này; T9 (harness) đã phủ mirror 140/140 file đợt 121 và các
  luồng đo tự quyết đường chạy của họ theo số đo từng boot.

## 5. Watcher — ĐÃ XONG 60/60 poll (11:38:24Z → 12:38:33Z)

- Watcher `t5-wait-replay-b64.sh` (nohup setsid, PID 2922) chạy
  trọn 60 poll, không reboot giữa chừng (boot vẫn 3fe7e89e từ
  đầu tới cuối; boot_changed=no 60/60). Log
  `t5-wait-replay-b64.log` (67 dòng: 60 poll + 6 lần postboot +
  start/end).
- Poll 1–3 (11:39–11:41Z): dpkg=2, apt=yes, wrapper=yes,
  lists=85 → 92 → 110 — update đang fetch.
- Poll 4–60 (11:42–12:38Z): dpkg=2, apt=yes, wrapper=yes,
  lists=111 — ĐÓNG BĂNG toàn bộ (chỉ RAM dao động).
- Postboot trong watcher: poll 10/20/30/40/50/60 + cuối đều
  exit=1 (xem §2). Headroom poll 30 = 4552, cuối = 4552.
- RAM trong watcher: 387–2685 MB (thấp nhất 387 MB poll 49 —
  các luồng khác đang chạy; vẫn >0, không OOM; cuối 442 MB).
- Không reboot mới trong lúc watcher chạy (boot vẫn 3fe7e89e
  tới 12:40:05Z, cuối lượt T5).
- Khác đợt 121: watcher lần này KHÔNG bị giết giữa chừng (đợt
  121 watcher đợt 1 chết theo reboot #63 sau 7 poll) — không
  cần khởi động lại watcher, không ghi RESTART.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm (11:39Z) — sạch hoàn toàn trên boot #64? (khác #57? lúc
  đó lock đang được T1 giữ sống). Không có lock sót từ boot cũ.
- Thư mục queue `hidden_files/vite.lock.queue` có **42 file
  cooldown** (tăng từ 38 ở #62? — thêm cooldown của các luồng
  đợt 121/122) — đều là cooldown cũ đã hết hạn; file cooldown
  chỉ delay cùng-thread reacquire, không chặn luồng khác, không
  tính là ticket. T5 KHÔNG xóa (không cần; để T6 — chủ mảng lock
  đợt 122 — quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối 10:14:01–10:16:03Z ngày
  16/11 (T10 đợt 121, boot #63 — TICKET/ACQUIRED/RELEASED bình
  thường); **0 hoạt động nào trên boot #64? tới lúc kiểm**
  (11:39Z) ngoài test của T6 đợt 122 đang chạy live lúc đó
  (acquire `tC` 11:39Z — T5 chỉ đọc, không đụng).
- T5 KHÔNG đụng vào lock/queue (không kill vite, không xóa lock
  tay) — đúng luật: hàng đợi FIFO là hành vi thiết kế.

## 7. Luật replay-chết §8.2 — ĐÁNH GIÁ LẦN 2 (hiệu lực từ đợt 121)

> Quyết parent đợt 120 §12 mục 3: PHÊ DUYỆT luật "replay-chết"
> (§8.2 T7 đợt 120) + vá "phát hiện muộn" §8.4(ii) + chính thức
> hóa cờ POSTBOOT_FAIL (§8.5), hiệu lực từ đợt 121; `--repair`
> code mới đã chạy sống lần đầu ở #63? (PASS 09:26:57Z).

### 7.1 Đối chiếu 5 điều kiện trên boot #64? (lúc 12:39–12:40Z, boot ~94' tuổi)

| # | Điều kiện §8.2 | Kết quả trên #64? | Bằng chứng |
|---|---|---|---|
| 1 | Postboot check-only FAIL (kiểm lại ngay trước khi quyết, không dùng kết quả cũ quá 10 phút) | **ĐẠT** | exit 1 lúc 12:38:32Z (poll 60) + exit 1 lúc 12:38:33Z (final); < 10 phút trước quyết 12:40Z |
| 2 | Replay ĐÃ CHẾT — cả 3 dấu hiệu: (a) 0 process apt-get/dpkg/wrapper; (b) dpkg.log không tăng ≥10' (2 lần đọc cách nhau ≥10'); (c) lock dpkg rảnh | **KHÔNG ĐẠT** | (a) FAIL: apt-get pid 855 (etime 01:04:26) + wrapper os-intent pid 834 ĐANG CHẠY; (b) ĐẠT theo chữ (dpkg.log không tăng từ 11:35:39Z — nhưng đó là vì update chưa xong, không phải vì replay chết); (c) không kết luận được: `fuser` non-root không thấy lock của process root — nhưng (a) đã đủ bác điều kiện 2 |
| 3 | Ngưỡng chờ: boot ≥60' tuổi HOẶC dpkg im ≥15' | **ĐẠT** | Boot ~94' tuổi lúc quyết (≥60'); dpkg im từ 11:35:39Z (~64') — cả hai nhánh đều đạt; nhưng moot vì điều kiện 2 không đạt |
| 4 | Dạng lỗi (A) "tới nhưng thiếu GST" HOẶC (B) "chạm mà không cài" | **CHƯA XÁC ĐỊNH** | Replay chưa kết thúc — không thể phân loại; diễn biến thực tế là dạng mới (C) "sống nhưng kẹt ở update" (xem §3), không nằm trong (A)/(B) |
| 5 | Không có luồng đo WebKit nào đang chạy probe trên boot đó | **ĐẠT** | 0 process MiniBrowser/WebKit lúc kiểm 12:40Z (chỉ có probe Chromium/vite của các luồng khác — Chromium không dùng GST hệ thống, không chặn repair về mặt kỹ thuật); nhưng moot vì điều kiện 2 đã không đạt |

- **Kết luận: 3/5 đạt (đk 1, 3, 5), 1/5 không đạt (đk 2),
  1/5 chưa xác định (đk 4) → KHÔNG đủ 5 điều kiện → KHÔNG
  chạy `--repair`.** T5 chạy watcher 60 phút thay vào đó (theo
  đúng lệnh task: chưa đủ điều kiện thì watcher, không tự repair).
- Đây là **lần thứ hai luật §8.2 được đánh giá sau khi có hiệu
  lực** — lần 1 (#62?) "không kích hoạt" vì replay sống và đang
  tiến triển; lần này (#64?) "không kích hoạt" vì replay sống
  nhưng KẸT (không tiến triển). Hai lần đều đúng thiết kế của
  luật theo chữ, nhưng lần này phơi ra lỗ hổng: **luật không phân
  biệt "sống và tiến triển" với "sống nhưng kẹt"** — điều kiện
  2(a) chỉ nhìn process còn sống, không nhìn tiến triển. Nếu
  update kẹt vô hạn thì boot này không bao giờ đủ điều kiện chạy
  WebKit mà cũng không bao giờ đủ điều kiện repair — bế tắc.
  Xem §10 mục 1 (cần quyết parent, T5 không tự sửa luật).

### 7.2 Vá "phát hiện muộn" §8.4(ii) — không cần viện tới lần này

- Boot #64? phát hiện lúc +32' tuổi (lượt mở 11:35Z, T5 bắt đầu
  ~11:37Z) — không muộn như #60? (+55'). Vá (ii) chỉ có ý nghĩa
  khi boot đã >15' tuổi lúc phát hiện; lần này không cần. Nhưng
  vá vẫn có giá trị cho các boot phát hiện muộn sau này — giữ
  nguyên, không đề xuất bỏ.
- R9 (a) (watcher v2 đầu lượt) vẫn là đường bắt FAIL live sớm;
  xem §9.

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `4d7c07bec5e1af978760a60cbc67a273` →
  `a10b43ea6c5969d22ed190795d377115` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/119/
  120/121, không đổi logic):
  - Header: bổ sung kết quả #63? (replay chết dạng (B), luật
    §8.2 kích hoạt lần đầu, --repair PASS 09:14–09:26Z, headroom
    hồi 0 → 5436) + đoạn boot #64? (khởi động muộn +30m21,
    update kẹt, postboot FAIL, headroom 4440, watcher đợt 122).
  - Dòng `say`: `#63? = 2026-11-16 08:53:05Z, boot_id
    725453a2-…` → `#64? = 2026-11-16 11:05:18Z, boot_id
    3fe7e89e-…, sau #63? 08:53:05Z — số tạm, chờ T6 đếm lại
    mù #37`.
- **Không lặp sự cố đợt 120:** dòng `say` mới không chứa ký tự
  `"` (dùng `p`/`s` thay dấu phút/giây, như bài học T7 đợt 120
  §9). `bash -n` OK ngay lần đầu.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn FAIL
  exit 1 (đúng — replay chưa cài xong lúc đó; và vẫn FAIL tới
  cuối lượt).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair`
  (phương án A, R9 §6.3): việc này cần parent duyệt và T5 không
  nhận được phê duyệt đó trong task — giữ nguyên để parent quyết.
  `--repair` code mới đã chạy sống 1 lần ở #63? (PASS) — lần
  chạy sau (nếu luật kích hoạt) vẫn chạy đúng thứ tự hiện tại
  (mục 3 GST symlink trước, mục 4 apt install sau) trừ khi
  phương án A được duyệt kèm.

## 9. R9 (a) vẫn mở (nhắc lần 8)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc
  đóng đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Boot #64? là ví dụ cho thấy R9 (a) vẫn có giá trị: lượt mở lúc
  boot +30' (replay configure cùng phút với lượt mở) nên FAIL
  live đã kẹp được mà không cần R9 (a) — nhưng boot xảy ra giữa
  các lượt vẫn có thể lọt (như #60? lúc +55' mới có người kiểm).
  Vá §8.4(ii) đã giảm thiệt hại của trường hợp muộn, nhưng không
  thay thế R9 (a) trong việc bắt FAIL live sớm + kẹp bracket đầy đủ.
- Lưu ý mới từ đợt này: R9 (a) cũng không giải quyết được dạng
  (C) — watcher bắt được FAIL live sớm cũng chỉ quan sát replay
  kẹt; không có luật nào cho phép can thiệp khi replay còn sống.

## 10. Nợ mở sang đợt sau

1. **Dạng lỗi mới (C) "sống nhưng kẹt ở update" — CẦN QUYẾT
   PARENT (đợt 123):** apt-get update của replay chạy 64'+, 0%
   CPU, không tiến triển filesystem ~58 phút, mirror khỏe (200
   trong 0,79 s). Luật §8.2 hiện tại KHÔNG bao dạng này (điều
   kiện 2(a) chỉ nhìn process sống/chết). Các phương án để parent
   chọn (T5 KHÔNG tự chọn): (i) thêm điều khoản "kẹt" vào §8.2 —
   vd apt-get sống nhưng 0 tiến triển ≥45' + mirror kiểm được là
   khỏe → coi như chết, được repair; (ii) giữ nguyên luật, chờ
   boot sau (boot #64? coi như không dùng được cho WebKit đợt
   này); (iii) can thiệp tay có phê duyệt (kill update kẹt +
   repair). Lưu ý: phương án (i) cần ngưỡng "0 tiến triển" đo
   bằng gì (partial mtime? lists count? dpkg lines?) — phải định
   nghĩa trước khi áp dụng, không đo bằng cảm tính.
2. **Boot #64? chưa từng PASS:** postboot FAIL suốt lượt (7 lần
   kiểm exit 1). Nếu replay vẫn kẹt ở đợt 123 thì boot này coi
   như không dùng được cho WebKit — các luồng đo đợt 123 phải
   gate-wait hoặc DEFER theo prereg của mình (tiền lệ T1 đợt 121
   DEFER-POSTBOOT).
3. **Headroom: 4440 → 4552 (#64?)** — hồi từ 0 (#62?), giảm ~900
   so với 5435–5436 (#63?). Theo dõi xu hướng dài hạn tiếp; trần
   63747 cần can thiệp host (dọn watch ngoài cell / tăng trần) —
   ngoài tầm luồng này.
4. **Symlink GST → debroot từ repair #63? đã mất theo reboot**
   (ephemeral, như mọi lần) — trên #64? thư mục GST hệ thống
   không tồn tại, debroot vẫn 269 file. Phương án A/B (R9 §6.3)
   chờ parent duyệt.
5. **Số thứ tự boot #62?/#63?/#64? CHƯA CHẮC** — chờ T6 đếm lại
   mù #37 (gap #61→#62 1h34'49", #62→#63 27'18", #63→#64
   2h12'13"; nếu T6 đếm khác, LIMITS này + script postboot-check
   cần sửa lại số — boot_id + btime không đổi).
6. **R9 (a) vẫn chờ user (nhắc lần 8).**
7. **Cooldown file tích lũy (42 file, tăng từ 38)** — chưa có cơ
   chế dọn cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock
   (T6 quyết).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 121 §10: E4 lô
   lượt 3–4 (quyết parent đợt 121: chạy bù lượt 3 trước, rồi lượt
   4; prereg E4 phải ghi rõ thư mục cờ của luồng hạ tầng ĐỢT
   HIỆN TẠI — đợt 122 là `round122-t5/`); H3f A/B có kiểm soát
   (nếu cũng TRUNG TÍNH → GỠ patch); leg B theo DEF PSI v0.1;
   G1 chờ user quyết + mù #22/#28–#31/#35 chờ user quyết;
   birefnet (chỉ thử lại khi RAM đổi, u2net là fallback chính
   thức); ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại;
   release gate không đổi + KHÔNG push khi user chưa nhắn
   "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` md5 lúc T5 kiểm cuối (12:40Z):
  `03bf029f09b8890b285eacc10a02172b` — KHÁC baseline
  `5be5a250a552357c50cc189de9a9c08a` của đợt 121. **T5 KHÔNG sửa
  preview.tsx** — file đổi bởi các luồng khác trong đợt 122
  (đang chạy song song lúc T5 kiểm); T10 xác minh thay đổi này
  khi gộp. Ghi rõ để không ai đọc nhầm T5 đã đụng production.
- `media.ts` md5 `2c384ed13703809d5e999311147745e7` khớp baseline,
  không đổi (đường dẫn đúng `apps/web/src/media.ts`).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ
  đọc `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  387–2685 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #64?: FAIL 7 lần (try1 + sau sửa + poll 10/20/30/40/
  50/60 + cuối), TẤT CẢ exit 1 — chưa từng PASS trong lượt.
- Watcher: ĐÃ XONG 60/60 poll cho boot #64? (11:38:24Z →
  12:38:33Z; replay kẹt ở update, 0 tiến triển từ poll 4; không
  reboot giữa chừng).
- Replay #64?: KHỞI ĐỘNG MUỘN + KẸT — configure +30'21", update
  chạy 64'+ (pid 855, etime 01:04:26 lúc 12:40Z), dpkg 2 dòng
  không đổi, lists đóng băng 111, partial im từ 11:41:39Z.
- **Repair: KHÔNG CHẠY** — luật §8.2 không kích hoạt (điều kiện
  2 không đạt: apt-get + wrapper đang chạy). Lần đánh giá luật
  thứ 2 sau khi có hiệu lực.
- Headroom: 4440 lúc mở → **4552 (poll 30 + cuối, ổn định)** —
  hồi từ 0 (#62?), giảm ~900 so với 5435–5436 (#63?).
- Stale vite.lock: không có (lock dir không tồn tại; queue chỉ còn
  cooldown cũ 42 file, v2 log không STALE mới).
- Reboot mới: KHÔNG — boot vẫn 3fe7e89e từ 11:37Z tới 12:40Z.
  Không ghi RESTART (không cần khởi động lại).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND122_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu #63?/#64? trong header + dòng `say`; md5
  `4d7c07be…` → `a10b43ea…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round122-t5/` (log
  watcher 60 poll + log postboot try1/after-edit/poll/final +
  log headroom now/poll30/final, md5 trước/sau của postboot-check,
  `POSTBOOT_FAIL` (cờ hiện tại — vẫn FAIL cuối lượt, đã cập nhật
  dòng kết luận), `t5-initial-state.md`, `t5-wait-replay-b64.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round122-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round122-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

# PHASE9 ROUND 154 — T0: Boot survey + O8 JSON (reboot #48, ứng viên)

Đợt 154 mở lượt cron 18:35:51 +07 20/11/2026 (= 11:35:51Z). T0 mở ~11:37:21Z.
Đợt 153 verdict CHẤP NHẬN (parent §12.3 aggregate 153 — đã đọc kỹ §11 nợ mở + §12.3
trước khi làm; các quyết (a)–(p) đã ghi nhận, trong đó (e) watcher respawn chọn (1) +
quy tắc đứng (3), (d) P3' đóng xem xét, (j) chuỗi O8 10 → 11 xác nhận có caveat gate).

## §1. Reboot #48: CÓ — boot mới 2c0a7985, btime 11:26:05Z (ứng viên, chờ T2-154 xác nhận theo đếm chặt)

**Kết luận: có reboot mới giữa lúc T10-153 đóng sổ (~11:15Z) và lúc đợt 154 mở (11:35:51Z).**
Boot lúc mở khác boot lúc T10-153 đóng (cd7dcd88, #47) → số hiệu kế tiếp #48 theo đếm chặt
(T2-154 xác nhận; mù #80? giao T2-154).

Bằng chứng — 5 nguồn độc lập, đều khớp:

| Nguồn | Giá trị | Ghi chú |
|---|---|---|
| boot_id | `2c0a7985-b750-4166-b177-21d2ef7e1dc7` | khác cd7dcd88 (#47) |
| btime /proc/stat | `1795173965` = **11:26:05Z** | `uptime -s` đồng ý 11:26:05 |
| journalctl --list-boots | 1 boot duy nhất `2c0a7985…`, first entry 11:26:15Z, last 11:37:16Z | journal volatile chỉ giữ 1 boot |
| journal first entry | `1795173975.877` = 11:26:15.877Z (journald started) | = btime + 10,9 s |
| wtmp / last reboot | `reboot system boot 7.0.0-44-generic Fri Nov 20 11:26 still running`; wtmp begins 11:26:15 | — |
| eperm-probe-v2.log (nguồn thứ 6, độc lập) | `=== boot changed 401fca75 -> 2c0a7985 (reboot detected, uptime since 2026-11-20 11:26:05 ) ===` + probe #73 11:38:16Z | prober tự phát hiện, khớp btime |

- **Gap danh nghĩa #47 → #48: 1.165 s = 19m25s** (11:06:40Z → 11:26:05Z). Số danh nghĩa —
  T2-154 chứng nhận gap + mù #80? (xem §11 nợ 2).
- **Boot cũ cd7dcd88 chết trong cửa sổ (11:17:10Z, 11:26:05Z]:** mốc hoạt động cuối cùng
  trên boot cũ là aggregate 153 mtime **11:17:10Z** (parent viết §12.3; cờ T10-153
  11:15:19Z). Quét file `docs/` + `hidden_files/` mới hơn 11:06Z: KHÔNG có file nào viết
  trong (11:17:10Z, 11:26:05Z] — cửa sổ chết 8m55s. **KHÔNG có bằng chứng overlap/migration:**
  không một file nào mang dấu giờ sau btime #48 mà thuộc boot cũ (khác hẳn #45: boot cũ
  viết tới ≥08:23:04Z, sau btime mới 07:32:38Z tới ≥50'26"). #48 nhìn như reboot tại chỗ
  sạch — với caveat: vắng mặt dấu viết không chứng minh tuyệt đối cell cũ đã chết đúng
  lúc đó, chỉ chứng minh không còn hoạt động nào ghi lại được sau 11:17:10Z.
- **/proc/1 start = 1795173975 = 11:26:15Z = btime + 10 s** (so #45: +0,88 s; #46: +0,67 s).
  Journal first entry 11:26:15.877Z khớp (+10,9 s). Toàn bộ userspace khởi động ~10 s sau
  btime — đọc như **boot/init chậm ~10 s**, KHÔNG phải bước nhảy đồng hồ (xem dưới).
- **F-measure ≈ 0 — KHÔNG có nghịch lý đồng hồ đo được tại #48:** hai lần đọc cặp
  (11:38:54.113Z: now−uptime = btime +0,03 s; 11:38:59.126Z: btime +0,02 s). Đồng hồ
  monotonic và wall clock nhất quán kể từ boot. (Lưu ý: lần đọc /proc/uptime đầu tiên
  trong phiên (~11:37:2xZ, 686,43 s) nếu gán nhầm giờ đọc 11:37:21Z sẽ cho btime −10,4 s
  — đó là lỗi gán giờ của T0, KHÔNG phải dữ kiện: hai lần đọc cặp sau đó đều ≈ btime
  +0,02–0,03 s. Ghi rõ để T2 khỏi mất công điều tra số nháp này.)
- machine-id `0c4a281f11aa46a680785b504d50ebda`, hostname `htch-runtime` (khớp id thư mục
  runtime journal — nhất quán nội bộ, không dùng làm bằng chứng migration).
- Reboot #48 là reboot thứ 4 trong/quanh 2 đợt liên tiếp (#45 trước phiên 153, #46 giữa
  phiên 153, #47 giữa lúc T8-153 đóng sổ, #48 giữa lúc T10-153 đóng và đợt 154 mở).
  Tốc độ reboot lũy kế giao T2-154 tính lại (T2-153: 122 reboot / 228,78 h tới #46).

## §2. Quy tắc đứng (3) — kiểm tra watcher ngay khi mở phiên: CHẾT lúc mở (đã có người khởi động lại)

- **Kiểm độc lập của T0 (~11:38Z): 0 process replay-watch nào đang chạy.** `ps` chỉ thấy
  sampler.sh + b2-watcher.sh của T9-154 (pid 3418/3419, khởi động 11:37Z bởi T9-154 —
  đó là sampler RAM/B2 của T9, KHÔNG phải burst-watcher/replay-watch).
- **Log watcher cuối cùng: `replay-watch-152.log` dừng 07:04:36Z (boot 18e179e0)** — watcher-152
  chết theo reboot #44; **không watcher nào từ #44 tới lúc mở đợt 154** (qua #45, #46, #47,
  #48 — ~4h34m không có watcher). Không tồn tại replay-watch-153 (thư mục round153-t5 chỉ
  có t5-stats).
- **T5-154 đã khởi động lại watcher-154 bằng tay 11:40:28Z, pid 17168** (file
  `round154-t5/watcher-status-at-open.txt` — viết cho T0-154; T5 kiểm pgrep rỗng 11:37:36Z,
  khớp kiểm độc lập của T0). Log `replay-watch-154.log` poll 30 s/lần từ 11:40:28Z:
  `dpkg_lines=2 md5=aa56fb5e apt=[] apt2=[] dpkg=[] gst_sys=0 cache=0 lists=5`, ổn định
  tới 11:43:58Z. Trigger (h) dự kiến ~11:45:58Z (boot+15' + đóng băng ≥600 s),
  POSTBOOT_PASS sau repair ~12:00Z (theo T5-154 — T0 không xác minh độc lập).
- **Phương án (1) systemd unit: CHẾT trong cell — theo T5-154** (xem LIMITS T5-154 §2;
  unit file chuẩn bị sẵn tại `round154-t5/vcut-replay-watch.service`, CHƯA cài).
  T0 ghi nhận theo hồ sơ T5, không tự kiểm `systemctl --user`/persistence (thuộc T5-154).
- **POSTBOOT_PASS trên đĩa VẪN STALE #43** (`round152-t5/POSTBOOT_PASS`, boot 18e179e0,
  btime 05:20:57Z, viết 05:58:52Z; cờ cũ 2e430750 lưu riêng). Đường POSTBOOT_PASS chính mới:
  `hidden_files/round154-t5/POSTBOOT_PASS` (T4-154 poll-wait đọc đường này; dự phòng
  `round153-t5/POSTBOOT_PASS`). Chưa có POSTBOOT_PASS nào cho boot 2c0a7985 lúc T0 đóng cờ.
- **Replay hệ thống VẮNG lúc T0 kiểm (~11:47Z, boot+21'):** dpkg.log chỉ 2 dòng
  (`2026-11-20 11:35:40/41 startup packages configure`, 94 B — chữ ký rootfs rebuild như
  #43/#45); `dpkg/status` 783 gói (so 1.545 lúc postboot #46 đủ); apt cache 0 .deb;
  GST 0; lists 5 (theo log watcher-154). T4-154 gate0wait kết luận postboot **CHƯA ĐỦ**
  (thiếu isomp4/libav; thiếu 11 gói apt: libevent-2.1-7t64, gstreamer1.0-plugins-*,
  gstreamer1.0-libav/-gl/-x, libavif16, libgstreamer1.0-0, libevdev2).
  T4/T5-154 sở hữu postboot + repair; T0 chỉ ghi nhận trạng thái lúc mở.

## §3. Cơ chế O8 JSON: CÒN ĐÚNG (stamped JSON tồn tại, md5 JSON cũ không đổi)

- **JSON mới của đợt 154 — 2 file stamped riêng biệt, md5 khác nhau, không ghi đè**
  (F-151-T10-2 vẫn đóng): attempt1 `o8w-clicktest-report-2026-11-20T11-43-20-2c0a7985-attempt1-pid22422.json`
  md5 `1a224473…` (1.583 B); attempt2 `…T11-43-56-2c0a7985-attempt2-pid23870.json`
  md5 `75dc358e…` (749 B). Bản `latest` byte-identical với file stamped cuối cùng từng lần
  (sau attempt1 = `1a224473`; sau attempt2 = `75dc358e`) — đúng thiết kế "latest" của T0-152.
- **JSON cũ md5 KHÔNG ĐỔI** (đối chiếu giá trị đã ghi trong aggregate 153):
  T0-153 stamped `33bd318d…` ✓; T8-153 WebKit pid17449 `3e95c7fe…` ✓, pid17793 `2dfb2e02…` ✓,
  Chromium pid18102 `b0745c49…` ✓; T8-152 WebKit `25318b62…` / `86fbf704…` + Chromium
  `5af121e3…` ✓ (§2 aggregate 153); T0-152 stamped `19e62de8…` / `95988b8e…` (ghi nhận
  giá trị hiện tại; aggregate 153 không liệt kê từng md5 này nên chỉ ghi "tồn tại, khớp
  mẫu attempt1/attempt2", không khẳng định đối chiếu độc lập).
- **Cây md5 lúc mở khớp đúng hồ sơ T10-153 lúc đóng:** preview.tsx `530e10a7`,
  media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`,
  O8 webkit script `4994b4fc` (clicktest-87o8-mask-track-webkit.mjs). Không đổi ngoài ý muốn.
  (T8-154 OPEN-NOTE đối chiếu độc lập cùng kết quả + 84l10/85m4/86n2.)

## §4. O8 WebKit kiểm chứng trên boot mới: FAIL 0/2 — hai chữ ký khác nhau, KHÔNG phải lượt O8 chính thức

Chạy trong scratch riêng `round154-t0/o8-webkit`, cổng :191/5564/8861 (như T0-153),
script O8w md5 `4994b4fc`. GST_PLUGIN_SYSTEM_PATH trỏ debroot
(`~/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0`) vì đường hệ thống
`/usr/lib/x86_64-linux-gnu/gstreamer-1.0` KHÔNG TỒN TẠI trên boot này (replay vắng, §2);
script tự đặt LD_LIBRARY_PATH debroot (tiền lệ đợt 110 L8). KHÔNG chạy Chromium fallback
(theo tiền lệ T0-153); KHÔNG chạy tsc/vite build/npm test (không chạm code TS/app).

- **Attempt1 (11:43:19–11:43:31Z, 12 s, EXIT=2): FAIL 1/2.** S0 PASS (mẫu tự load, 3 clip);
  **S1 FAIL** — toggle auto-proxy: `không đo được rect checkbox tự tạo proxy` (method mouse);
  rồi harness lỗi `page.setInputFiles: Target crashed` (waiting for locator
  `.mediabin input[type='file']`, .mjs:555). JSON stamped 1.583 B, 2 results, 7 logLines.
- **Attempt2 retry (11:43:54–11:48:07Z, ~4m13s, EXIT=2): FAIL 0/2.** WebKit launch 27.2 OK,
  vite + bridge OK, nhưng **timeout chờ project mẫu tự load (3 clip, media bin 2 item),
  last=null** (.mjs:540, waitFor :369) — S0 không bao giờ tới. JSON stamped 749 B,
  0 results, 5 logLines.
- **Chữ ký mới F-154-T0-1 (attempt1: S1 FAIL + Target crashed ở S2-import)** và
  **F-154-T0-2 (attempt2: timeout chờ mẫu tự load, S0 không tới)**. Khác F-153-T0-1
  (S2-add-clip kẹt 447 s, EXIT=124) và khác "đợt 142 Target crashed ở S1" (lần này S1 chỉ
  FAIL toggle, crash xảy ra ở S2-import). Hai attempt lỗi ở HAI điểm khác nhau trong 5 phút —
  chưa đủ dữ kiện phân biệt flake do tải cao lúc mở phiên (load1 2,86 lúc 11:44Z, 9 luồng
  đợt 154 cùng khởi động) với lỗi hệ thống do replay vắng (thiếu 11 gói apt + GST hệ thống).
  T0 KHÔNG kết luận nguyên nhân; T8-154 phán O8 chính thức trên boot này sau postboot.
- **Đây KHÔNG phải lượt O8 chính thức của đợt 154** (T8-154 phán chuỗi) — chỉ là chạy kiểm
  chứng cơ chế của T0. Không ảnh hưởng chuỗi WebKit FULL PASS 11 (xác nhận đợt 153, quyết (j)).
- **Dọn dẹp sạch:** 0 process sót sau mỗi attempt (vite/Xvfb/WebKit đã kill, socket X191
  đã unlink; /tmp/.X11-unix lúc đóng chỉ còn X193/X194/X195 của các luồng khác).

## §5. DIAG137_SCRIPT — HOÃN (không tìm thấy hằng trong script sống; T8-154 đã xong checklist (o))

Nợ §11.11 aggregate 153: "T0-154 cân nhắc sửa hằng DIAG137_SCRIPT trong 3 script harness
về 1 mối duy nhất." Kết quả kiểm tra:

- **Không tìm thấy `DIAG137_SCRIPT` trong bất kỳ script harness đang sống nào:**
  round153-t8 (*.sh/*.py/*.mjs), round154-t8 (*.sh/*.py), repo `apps/web/scripts/
  clicktest-87o8-mask-track-webkit.mjs`, repo server/apps/packages/mcp-server
  (trừ node_modules) — đều 0 kết quả. Chỉ còn nhắc tới trong LIMITS cũ (137/139/142/153)
  và COPY-NOTE-153 (ghi chú snapshot watchdog ghi nhầm thư mục 152 do symlink).
  Cơ chế diag hiện tại trong 3 script harness (run-webkit / run-webkit-debroot /
  run-chromium) đi qua `diag-stall` script + hai symlink, không qua hằng tên đó
  (evalDiag137/WATCHDOG-137/LIVE-DIAG vẫn còn trong script — đó là hàm/label, không phải
  hằng đường dẫn cần hợp nhất).
- **Checklist (o) đã xong bởi T8-154, không cần T0 đụng vào:** CẢ HAI symlink diag
  (`hidden_files/t8-diag-stall.sh` và `repo-1/apps/web/scripts/t8-diag-stall.sh`) đã trỏ về
  `round154-t8/diag-stall-154t8.sh` lúc 11:38Z (trước: hidden-root → round152, repo → round153;
  readlink + test -x đã xác nhận — theo OPEN-NOTE-154t8; T0 xác minh lại readlink cả hai).
- **Lý do hoãn:** (1) tiền đề "3 script cùng định nghĩa hằng" không còn đúng trên cây hiện tại —
  không có gì để hợp nhất mà không bịa ra refactor; (2) T8-154 đang chạy các script đó
  (copy 11:37Z, waiter deadline 13:30Z) — sửa lúc này đụng phiên đang chạy, rủi ro lặp lại
  F-153-T8-5 (snapshot ghi nhầm thư mục); (3) T0 không có test lại an toàn trong phạm vi
  của mình (harness thuộc T8; sửa sai chỉ phát hiện khi kẹt thật xảy ra).
  Đề xuất: giao T8-154 (hoặc T8-155) xem lại khi viết lại driver — nếu lúc đó hằng vẫn tồn
  tại ở đâu đó thì hợp nhất kèm chạy harness thật.

## §6. Bối cảnh mở phiên (ghi nhận, không phán)

- Đợt 154 mở 11:35:51Z; các thư mục round154-t1/t4/t5/t6/t7/t8/t9 đã có mặt 11:37–11:38Z
  (9 luồng chạy song song). T9-154 sampler + b2-watcher chạy từ 11:37Z (pid 3418/3419).
- EPERM probe #73: 11:38:16Z, boot 2c0a7985, ok=2 fail=0; probe #72 DEAD age 10.626 s;
  log `eperm-probe-v2.log` 208 → 211 dòng (+3 đúng mẫu mọi lượt). (T2-154 sở hữu probe;
  T0 chỉ đọc log.)
- Vite lock queue: 101 file, 0 ticket + 101 cooldown (khớp OPEN-NOTE T8-154; prune lần 29
  thuộc T6-154).
- RAM lúc mở theo T8-154: avail 1.111 MB, balloon 5.733.620 kB (89,0% trần 6.443.824).
  T0 không đo lại RAM (thuộc T9-154).

## §7. Sai số của chính T0-154

- F-154-T0-0 — Lần đọc /proc/uptime đầu tiên (~11:37:2xZ, 686,43 s) suýt ghi thành nghịch
  lý đồng hồ −10,4 s do gán nhầm giờ đọc (lấy giờ của lệnh trước, 11:37:21Z). Hai lần đọc
  cặp sau đó (11:38:54Z/11:38:59Z) đều cho btime +0,02–0,03 s — kết luận đúng là F ≈ 0
  (§1). Số nháp −10,4 s không vào kết luận, ghi rõ ở §1 để T2 khỏi điều tra lại.
- F-154-T0-1/F-154-T0-2 — hai chữ ký fail O8 mới (§4); T0 không chạy attempt3 (2 attempt đủ
  để chứng minh cơ chế JSON còn đúng + ghi nhận fail; attempt thêm chỉ lặp lại cùng môi
  trường replay-vắng, thuộc T8-154 sau postboot).
- F-154-T0-3 — Lệnh grep DIAG137 đầu tiên trên repo-1/scripts+server+apps bị treo (quét cây
  lớn, gồm node_modules) — đã kill (SIGTERM) và grep lại có giới hạn, có timeout. Không
  ảnh hưởng kết luận §5 (đã quét đủ các vị trí sống).
- T0 không kiểm `systemctl --user`/persistence `~/.config/` (thuộc T5-154 theo quyết (e));
  không kiểm chứng độc lập phát hiện "systemd unit CHẾT trong cell" của T5-154 (§2).

## §8. Nợ mở chuyển T10-154 / các luồng

1. Reboot #48 (ứng viên) + gap danh nghĩa 1.165 s + mù #80? — giao T2-154 xác nhận theo
   đếm chặt + chứng nhận gap #46/#47/#48 (mù #78?/#79? từ đợt 153 vẫn mở).
2. Kết cục run 153 — giao T7-154 (started_at có viết lại lần 2 tại #47 không; nay thêm #48:
   run 153 có bị viết lại lần 3 không; hạn ngân sách 11:35:51Z đã qua lúc mở đợt 154).
3. POSTBOOT_PASS cho boot 2c0a7985 chưa có (stale #43); T4/T5-154 sở hữu (repair dự kiến
   ~12:00Z theo T5-154).
4. O8 chính thức đợt 154 thuộc T8-154 (sau postboot + lượt yên hợp lệ); hai chữ ký fail của
   T0 (§4) chỉ là kiểm chứng cơ chế, không tính vào chuỗi.
5. DIAG137_SCRIPT: hoãn có lý do (§5) — giao T8-154/155 xem lại khi viết lại driver.
6. Watcher respawn: phương án (1) systemd unit CHẾT trong cell theo T5-154 — parent quyết
   lại giữa (2) @reboot cron và (3) ở đợt 154 (quy tắc (3) đã chạy: T0 kiểm tra lúc mở,
   watcher chết, T5 khởi động lại bằng tay 11:40:28Z).
7. Prune lần 29 (T6-154): queue 101 file lúc mở (0 ticket + 101 cooldown).
8. Nợ đứng giữ nguyên: G1 khung (a) M2 hoãn chờ user; R9 (a) chờ user (số đếm 16);
   ci-security.yml 403 chờ user; TTS 39 cấm kiểm lại; birefnet 0 thử lần thứ 7 (đợt 154 là
   lần thứ 8 nếu không thử); headroom 0 + ENOSPC (quyết (g)/(h) giữ "chỉ theo dõi").

---
*T0-154 đóng cờ ~11:50Z (trong hạn cờ ~14:00Z). Không sửa code repo nào; không push/tag.*
*Stage: `phase9-round154-t0-boot-o8.txt` (1 entry NUL — LIMITS này).*

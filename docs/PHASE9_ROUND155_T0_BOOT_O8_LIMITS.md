# PHASE9 ROUND 155 — T0: Boot survey + O8 JSON (không reboot mới; watcher chết lúc mở, T5-155 đã khởi động lại; O8 21/21 ×2)

Đợt 155 mở lượt cron 21:35:51 +07 20/11/2026 (= 14:35:51Z). T0 mở ~14:39:48Z.
Đợt 154 verdict CHẤP NHẬN (parent §12.3 aggregate 154 — đã đọc LIMITS T0-154 trước
khi làm; các quyết parent đợt 154 đã ghi nhận, trong đó quy tắc đứng (3) T0 kiểm
tra watcher lúc mở, (j) chuỗi WebKit FULL PASS giữ 11, (l) 9/9 cờ có nội dung).

## §1. Reboot mới: KHÔNG — vẫn boot #49 12fc68a3, btime 13:05:12Z

**Kết luận: không có reboot mới kể từ lúc đợt 155 mở (14:35:51Z).** Boot lúc T0
bắt đầu giống hệt boot lúc mở theo task (12fc68a3-10f4-4459-908f-b0a47615afae,
reboot #49, btime 13:05:12Z). Không có số hiệu #50.

Bằng chứng — 5 nguồn độc lập, đều khớp:

| Nguồn | Giá trị | Ghi chú |
|---|---|---|
| boot_id | `12fc68a3-10f4-4459-908f-b0a47615afae` | giống task giao lúc mở |
| btime /proc/stat | `1795179912` = **13:05:12Z** | `uptime -s` đồng ý 13:05:12 |
| journalctl --list-boots | 1 boot duy nhất `12fc68a3…`, first entry 13:05:29Z, last 14:48:58Z | journal volatile chỉ giữ 1 boot |
| journal first entry | 13:05:29Z = btime + 17 s | khớp /proc/1 start (dưới) |
| wtmp / last reboot | `reboot system boot 7.0.0-44-generic Fri Nov 20 13:05 still running`; wtmp begins 13:05:29 | — |
| eperm-probe-v2.log (nguồn thứ 6, độc lập) | probe #74 14:43:07Z: `=== boot changed 2c0a7985 -> 12fc68a3 (reboot detected, uptime since 2026-11-20 13:05:12 ) ===`, ok=2 fail=0 | probe #73 cuối trên #48 là 11:38:16Z; #74 là probe đầu tiên trên #49 |

- **/proc/1 start = btime + 16,38 s** (start ticks 1638, CLK_TCK 100; mtime /proc/1
  13:05:29.16Z = btime + 17,16 s). Journal first entry 13:05:29Z khớp. Toàn bộ
  userspace khởi động ~16–17 s sau btime — đọc như **boot/init chậm ~16 s**
  (so #48: +10 s). Không phải bước nhảy đồng hồ (xem dưới).
- **F-measure = +0,78 s, ỔN ĐỊNH — không phải nghịch lý đồng hồ kiểu #45 (≥20 s):**
  hai lần đọc cặp (14:40:15Z: +0,788 s; 14:40:17Z: +0,781 s), chênh nhau −0,004 s
  trong 2 s. Đây là offset nhỏ, ổn định, dưới 1 s. **Khác đợt 154** (T0-154 đo
  +0,02–0,03 s trên boot #48): offset +0,78 s là quan sát MỚI trên boot #49.
  Giả thuyết khả dĩ nhất: migration overlap ~20 s sau btime #49 (T8-154 đã ghi)
  để lại wall clock chạy trước monotonic-derived btime ~0,8 s — T0 KHÔNG kết luận
  nguyên nhân (không có dữ kiện phân biệt với NTP step nhỏ); chỉ ghi nhận số đo
  ổn định, không ảnh hưởng kết luận "không reboot mới". Giao T2-155 ghi nhận
  (xem §7.4). Lưu ý phương pháp: `date` đọc TRƯỚC `/proc/uptime` vài ms nên
  offset thật ≥ +0,78 s (sai số phương pháp làm số nhỏ đi, không phóng đại).
- machine-id/hostname không kiểm lại (đã nhất quán nội bộ từ đợt 154, không dùng
  làm bằng chứng migration).
- Tuổi boot lúc T0 đóng cờ (~14:55Z): ~1h50m. Uptime 1:43 lúc 14:49:05Z, khớp btime.

## §2. Quy tắc đứng (3) — kiểm tra watcher ngay khi mở phiên: CHẾT lúc mở (T5-155 đã khởi động lại bằng tay)

- **Kiểm độc lập của T0 (~14:40Z): 0 process replay-watch nào đang chạy.** `ps`
  chỉ thấy sampler.sh + b2-watcher.sh của T9-155 (pid 23306/23307, khởi động
  14:40Z — đó là sampler RAM/B2 của T9, KHÔNG phải burst-watcher/replay-watch).
  (Caveat phương pháp: lần `pgrep replay-watch` đầu tiên trả rc=0 do tự khớp
  dòng lệnh exec của chính T0 — kiểm thật là `ps` + file log + hồ sơ T5-155.)
- **Log watcher-154 dừng ở poll cuối 13:05:31Z, boot 2c0a7985, KHÔNG có dòng
  NEWBOOT nào** (153 dòng). Poll cuối 13:05:31Z là **19 s SAU btime #49
  (13:05:12Z)** — xác nhận độc lập cửa sổ migration overlap ~20 s sau btime mà
  T8-154 đã ghi cho #49 (khác #48: không overlap). Watcher-154 chết theo #49.
- **T5-155 đã khởi động lại watcher-155 bằng tay trước khi T0 kiểm xong**
  (mẫu y hệt đợt 154): T5-155 mở 14:39:50Z, pgrep rỗng, POSTBOOT_PASS trên đĩa
  lúc đó CHỈ có của #48 (stale) — xem `round155-t5/watcher-status-at-open.txt`.
  Watcher-155 **pid 26066, khởi động ~14:42Z** (setsid nohup).
- **T0 xác minh độc lập watcher-155 đang sống và poll đều:** pid 26066 còn chạy
  lúc kiểm (~14:45Z, etime 02:53); log `replay-watch-155.log` poll 30 s/lần,
  `dpkg_lines=1545 md5=19522dc0 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178
  lists=37`, ổn định tới 14:45:11Z. **T0 KHÔNG khởi động watcher thứ hai.**
- **POSTBOOT_PASS cho boot #49 ĐÃ CÓ** (`round155-t5/POSTBOOT_PASS`, ghi
  14:42:38Z): `boot 12fc68a3-10f4-4459-908f-b0a47615afae (btime 2026-11-20
  13:05:12Z; watcher-155) — replay-day-du: dpkg 1545 dong; cache 178 .deb;
  lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-20T14:42:38Z`.
  Cờ cũ 2c0a7985 lưu `POSTBOOT_PASS-2c0a7985`. Cờ POSTBOOT_PASS ở
  hidden_files root VẪN STALE #48 (2c0a7985, 11:58:26Z) — T4-155 đọc đường
  round155-t5 theo định dạng cờ full-UUID (F-151-T5-1), T0 không đụng vào cờ root.
- **Postboot poll0 trên #49 (log `t5-postboot-poll0-12fc68a3.log`):** GST hệ thống
  là thư mục thật (apt), 269 plugin hệ thống = 269 debroot; PASS isomp4
  (mp4 demux) + libav (avdec_h264); PASS đủ 11 package WebKit/GST (kể cả
  libevdev2, Q7 đợt 114). **Kết luận: ĐỦ ĐIỀU KIỆN chạy WebKit** — khác hẳn lúc
  T0-154 mở (#48 replay vắng: dpkg 2 dòng, GST 0, thiếu 11 gói).
  Marker persistence `~/.config/vcut-persistence-marker` SỐNG QUA reboot #49
  (theo T5-155: còn, ghi 11:39:40Z trên #48).
- Phương án (1) systemd unit: CHẾT trong cell theo T5-154 — T0 không thử cài lại
  (theo task); unit + script ở `round154-t5/` chỉ giữ lại, không cài. Phương án
  (2) cron trong cell: không có cron — không thử. Quy tắc (3) vẫn là bảo hiểm
  duy nhất đang chạy, và đã chạy đúng ở đợt này (chết lúc mở → T5 khởi động lại
  trong ~2 phút).

## §3. Cơ chế O8 JSON: CÒN ĐÚNG (JSON cũ md5 không đổi; 2 JSON stamped mới, md5 khác nhau; latest = stamped cuối)

- **JSON cũ md5 KHÔNG ĐỔI** (đối chiếu giá trị T10-154 đã ghi):
  T0-154 attempt1 `1a224473…` ✓; attempt2 `75dc358e…` ✓;
  T8-154 WebKit pid13016 `234996ed…` ✓, pid13484 `f9f21198…` ✓,
  Chromium pid13930 `5db202d0…` ✓.
- **Bản `latest` byte-identical với file stamped cuối cùng từng thư mục:**
  round154-t0 `o8w-clicktest-report.json` = `75dc358e` ✓;
  round154-t8 webkit = `f9f21198` ✓; chromium = `5db202d0` ✓.
  Đúng thiết kế "latest" của T0-152 (F-151-T10-2 vẫn đóng).
- **JSON mới của đợt 155 — 2 file stamped riêng biệt, md5 khác nhau, không ghi đè:**
  attempt1 `o8w-clicktest-report-2026-11-20T14-48-44-12fc68a3-attempt1-pid44197.json`
  md5 `2f774e22…` (10.424 B); attempt2
  `o8w-clicktest-report-2026-11-20T14-50-10-12fc68a3-attempt2-pid46086.json`
  md5 `f6756d04…` (10.424 B). Bản `latest` trong `round155-t0/o8-webkit/` =
  `f6756d04` = attempt2 ✓.
- **Cây md5 lúc mở khớp đúng hồ sơ T10-154 lúc đóng:** preview.tsx `530e10a7`,
  media.ts `2c384ed1`, vite.config.ts `ee80d093`,
  server/render/src/effects.js `fedc0141`, O8 webkit script `4994b4fc`
  (clicktest-87o8-mask-track-webkit.mjs). Không đổi ngoài ý muốn.
  (Lưu ý tránh nhầm: `packages/video-spec/src/effects.js` md5 `c7a36b14` là bản
  copy khác — file chuẩn để đối chiếu là `server/render/src/effects.js`.)

## §4. O8 WebKit kiểm chứng trên boot #49: PASS 21/21 ×2 — lần đầu T0 tự kiểm PASS cả hai

Chạy trong scratch riêng `round155-t0/o8-webkit`, cổng :191/5564/bridge 8861
(tự chọn 8861–8869), script O8w md5 `4994b4fc`. GST_PLUGIN_SYSTEM_PATH do script
tự đặt `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` — đường này TỒN TẠI trên boot #49
(269 plugin, §2), không cần debroot fallback như đợt 154. KHÔNG chạy Chromium
fallback (theo tiền lệ T0-153/154); KHÔNG chạy tsc/vite build/npm test (không
chạm code TS/app).

- **Chờ vite lock:** T4-155 giữ lock 14:42:56Z–14:47:40Z (hold 284 s, port 5187).
  Driver của T0 chờ lock trống mới chạy attempt1 (khác T0-154: lúc đó lock trống
  sẵn, 101 cooldown/0 ticket). Trước attempt2 kiểm lại lock — vẫn trống.
  Không va chạm cổng với T8-155 (webkit :188/5560/9658, chromium :197/5554/9656,
  smoke Xvfb :199).
- **Attempt1 (14:48:42–14:50:05Z, 83 s, EXIT=0): PASS 21/21, 0 fail, 0 note.**
  JSON stamped 10.424 B, 21 results.
- **Attempt2 (14:50:08–14:51:47Z, 99 s, EXIT=0): PASS 21/21, 0 fail, 0 note.**
  JSON stamped 10.424 B, 21 results.
- **Hai mảng results giống hệt nhau trừ 1 clipId sinh ngẫu nhiên theo lượt**
  (`c_o78uxy0` vs `c_u8e6o0x`, cùng start=0 duration=6) — đúng kỳ vọng.
- **Đây KHÔNG phải lượt O8 chính thức của đợt 155** (T8-155 phán chuỗi) — chỉ là
  chạy kiểm chứng cơ chế của T0. Không ảnh hưởng chuỗi WebKit FULL PASS 11
  (giữ theo quyết (j) đợt 154 — T8-155 phán có lên 12 không sau lượt yên hợp lệ).
- **Tương phản với đợt 154:** T0-154 FAIL 0/2 trên boot #48 lúc replay vắng
  (F-154-T0-1 S1 FAIL + Target crashed S2-import; F-154-T0-2 timeout chờ mẫu
  tự load). Nay trên boot #49 postboot đầy đủ, cùng script/cổng/scratch mẫu,
  PASS 21/21 ×2 ngay lần đầu. T0 KHÔNG kết luận nguyên nhân nhân quả chắc chắn
  (chỉ 2 lượt mỗi bên, chưa đối chứng), nhưng tương quan môi trường → kết quả
  là rõ: replay đầy đủ đi cùng O8 xanh. Không có chữ ký fail mới nào ở đợt này.
- **Dọn dẹp sạch:** 0 process sót sau mỗi attempt (vite/Xvfb/WebKit đã kill,
  socket X191 đã unlink; /tmp/.X11-unix lúc đóng chỉ còn X193/X194/X195 —
  giống lúc T0-154 đóng, của các luồng khác, không phải của T0).

## §5. Bối cảnh mở phiên (ghi nhận, không phán)

- Đợt 155 mở 14:35:51Z; 10 thư mục luồng đã có mặt lúc 14:49Z: t0/t1/t2/t4/t5/
  t6/t7/t8/t9 (+ `round155-t5.done` đã có) — **không có thư mục t3** lúc kiểm.
  T1 verify đang chạy (pid 23709/23710, từ 14:41Z); T4 attempt1 chạy
  (vite lock 14:42:56–14:47:40Z); T8-155 đang wait-t4-t5; T9 sampler +
  b2-watcher chạy từ 14:40Z (pid 23306/23307).
- Load lúc 14:49Z: 1,68 (lúc mở 1,02). RAM thuộc T9-155, T0 không đo lại.
- **repo-1 KHÔNG CÓ .git** (`git status` → `fatal: not a git repository`,
  dừng ở filesystem boundary): trạng thái có sẵn, không phải do T0 gây ra —
  vòng lặp làm việc trên file, push qua API từ main chat. T0 ghi nhận, không sửa.
- EPERM probe #74: 14:43:07Z, boot 12fc68a3, ok=2 fail=0 (T2-155 sở hữu probe;
  T0 chỉ đọc log).

## §6. Sai số của chính T0-155

- F-155-T0-0 — F-measure +0,78 s (§1): offset nhỏ ổn định, KHÔNG phải nghịch lý
  đồng hồ; ghi rõ để T2-155 khỏi điều tra lại như số nháp −10,4 s của T0-154.
- F-155-T0-1 — Lần `pgrep replay-watch` đầu tiên trả rc=0 do tự khớp dòng lệnh
  exec của chính T0 (mẫu grep nằm trong command line). Kiểm thật là `ps` +
  log watcher-154 + hồ sơ T5-155 — cả ba đều khớp "chết lúc mở".
- F-155-T0-2 — Lệnh md5sum đầu tiên cho preview.tsx/media.ts/effects.js dùng
  sai đường dẫn (src/components, src/lib) nên không ra kết quả. Đường đúng:
  `apps/web/src/preview.tsx`, `apps/web/src/media.ts`,
  `server/render/src/effects.js` — đã đo lại và khớp hồ sơ T10-154 (§3).
- F-155-T0-3 — Lệnh `grep -rl 12fc68a3` toàn cây hidden_files chạy 53 s mới xong
  (filesystem chậm); không ảnh hưởng kết luận (đã tìm đủ: không có POSTBOOT*
  nào nhắc 12fc68a3 trước khi T5-155 ghi cờ mới — nay đã có ở round155-t5).
- T0 không kiểm `systemctl --user`/persistence `~/.config/` (thuộc T5-155 theo
  quyết (e) đợt 154; T5-155 đã ghi marker còn sống qua #49); không kiểm chứng
  độc lập phát hiện "systemd unit CHẾT trong cell" của T5-154.

## §7. Nợ mở chuyển T10-155 / các luồng

1. KHÔNG có reboot #50 lúc T0 đóng cờ (~14:55Z). T2-155 xác nhận theo đếm chặt:
   gap #48/#49 + mù #74?/#75?/#77?/#81? (từ đợt 154) + ghi nhận F-measure +0,78 s
   (§1, F-155-T0-0).
2. Kết cục run 154 — giao T7-155 (run 154 vẫn running lúc T10-154 đóng).
3. O8 chính thức đợt 155 thuộc T8-155 (sau postboot + lượt yên hợp lệ); hai lượt
   21/21 của T0 (§4) chỉ là kiểm chứng cơ chế, không tính vào chuỗi.
4. Watcher-155 (pid 26066) đang chạy — T5-155 sở hữu; nếu reboot #50 xảy ra
   trong phiên, quy tắc đứng (3) đã chứng minh hiệu quả ở cả hai đợt 154/155
   (T5 khởi động lại bằng tay trong ~2 phút sau khi mở).
5. Prune / vite lock queue: queue ~100 cooldown lúc mở (T6-155 sở hữu; T4 đã
   release 14:47:40Z, hold 284 s).
6. Nợ đứng giữ nguyên: G1 khung (a) M2 hoãn chờ user; R9 (a) chờ user (số đếm 16);
   ci-security.yml 403 chờ user; TTS 39 cấm kiểm lại; birefnet 0 thử (đợt 155
   là lần thứ 9 nếu không thử); headroom 0 + ENOSPC (quyết (g)/(h) giữ
   "chỉ theo dõi"); repo-1 không có .git (ghi nhận §5, không phải nợ cần sửa
   trong đợt này).

---
*T0-155 đóng cờ ~14:55Z (trong hạn cờ 17:00Z). Không sửa code repo nào; không push/tag.*
*Stage: `phase9-round155-t0-boot-o8.txt` (1 entry NUL — LIMITS này).*

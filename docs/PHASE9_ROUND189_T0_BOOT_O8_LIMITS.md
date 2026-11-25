# PHASE9_ROUND189_T0_BOOT_O8_LIMITS.md

Đợt 189 — T0 (boot survey + xác minh reboot mới + (m) thô + POSTBOOT_PASS + O8).
Mở lượt cron 02:35:51Z 25/11/2026 (= 09:35 +07), survey đo tươi 02:43:12Z, O8
03:18:30–03:21:02Z, đóng ~03:25Z 25/11/2026. Chỉ đọc + ghi file làm việc; không
sửa code sản phẩm, không push, không release/tag.
Nguồn đứng: **§12.3 aggregate 188 BẢN PARENT (56.051 B; quyết (a)–(r); parent kiểm
đếm KHỚP TỪNG SỐ lần thứ 108; SẠCH — lần sạch thứ ba kể từ đợt 179; tổng điền sẵn
GIỮ 18)** + §12.3 aggregate 187 + LIMITS T0-188. §12.3-188 ĐÃ CÓ lúc T0-189 làm
việc (parent viết trực tiếp lượt cron 09:35 +07; T10-188 để trống hoàn toàn,
aggregate 48.141 B lúc T10 đóng 02:51Z → 56.051 B sau khi parent viết, mtime
03:07Z) — khác brief lúc giao (chỉ ghi §12.3-187 làm mốc, vì lúc đó §12.3-188
chưa có); T0 dùng §12.3-188 làm mốc chính, §12.3-187 làm mốc phụ.

**BỐI CẢNH: số hiệu boot ĐÃ ĐƯỢC PARENT QUYẾT** — quyết (e)-186: cea79500 = #107;
hệ quả 7ea9d047 = #108, 6f1d9f87 = #109, 912f4a97 = #110; quyết (e)-187:
257c1eae = **#111** (btime 23:10:44Z). Boot mới 27e6714f = **#112** theo hệ quả
trực tiếp này — T0-189 xác minh 9 nguồn tươi, KHÔNG trình bày hai cách đếm nữa.
Parent cũng đã ghi ở (e)-188: boot #112 27e6714f btime 02:33:19Z thuộc đợt 189.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 02:43:12Z)**: boot_id
  `27e6714f-a60d-4105-a20b-7daca12d6421` (khác boot trước `257c1eae`); btime
  **02:33:19Z** (epoch 1795573999; uptime bracket khớp cùng giây —
  `uptime -s` 02:33:19Z, /proc/stat btime 1795573999, /proc/uptime 593,32 s lúc
  02:43:12Z → boot_est = btime −0,32 s; /proc/1 start_ticks 1140 = btime
  +11,40 s, stat mtime 02:33:30.72Z = btime +11,72 s; journal idx 0 duy nhất,
  first 02:33:31Z = btime +12 s; wtmp begins 02:33:30Z; `last` reboot 02:33
  still running; `who -b` Nov 25 02:33; Cloudflare đo chặt (local mid
  02:43:12Z vs CF-Date 02:43:14 GMT, chênh +2 s — CF trước local ~1–2 s sau khi
  trừ mạng → đồng hồ boot mới ĐÚNG trong ±2 s, như các đợt trước — xem
  F-189-T0-2 về dấu); DB: 0 requeue quanh btime (xem dưới); marker mtime
  không đổi).
  Gap #111→#112 = **12.155 s (3h22m35s) — DÀI NHẤT chuỗi gần đây** (phá mẫu ~2h:
  #110→#111 7.043 s; #109→#110 2.568 s; #107→#108 6.602 s; #104→#105 7.190 s).
  Boot mới xảy ra SAU khi run 189 finished (02:19:17Z), TRƯỚC khi đợt 189 mở
  (02:35:51Z). **Không có reboot mới trong phiên T0** (kiểm cuối 03:22:34Z boot
  vẫn 27e6714f).
- **Marker sống qua 64 reboot (#49–#112)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). Khớp công thức N−48 (T0-188: 63 qua
  #111).
- **(m) #112 — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-189 + parent)**:
  **0 event `requeued_after_restart`** trong [02:28:00Z, 02:42:00Z] và trong
  cả 25/11 00:00–03:00Z (DB đọc tươi). Không run nào sống tại btime: run 189
  (98271fb8, đợt 188) dispatched 23:38:46.387544Z, **SUCCEEDED 02:19:17.692311Z
  = btime −842 s** (14m02s TRƯỚC btime); run 190 (eb18559f, đợt này) sched/
  started 02:35:51Z = **btime +152 s**, status running lúc đọc, boot_gen
  cron_boot_70bfc03971ff4a888510e1336b0f673b (boot mới), claimed 1795574151.
  Cửa (m) [btime+33; btime+49,8] = [02:33:52Z; 02:34:08Z] trống. **Khác #111**
  (1 requeue vì run 188 spanning): ở đây 0 requeue vì không run nào spanning —
  cùng mẫu #109 (0 requeue, không run spanning). Phân loại thuộc T2-189 +
  parent.
- **POSTBOOT_PASS #112 ĐÃ CÓ 03:11:11Z (T5-189; T0 chỉ ghi nhận + xác minh
  độc lập)**: file `round189-t5/POSTBOOT_PASS`, 315 B, md5
  ca79a6b2000e8a916c106ff34871e420; mode **replay-đầy-đủ, poll=0**; dpkg
  **1.461** dòng (= `wc -l /var/log/dpkg.log` T0 kiểm độc lập lúc 03:18:25Z —
  nguồn thứ ba khớp cờ + watcher), cache 169 .deb, lists 37; postboot PASS
  poll0 độc lập exit 0 lúc 03:11:11Z; **boot+37m52s** (nhanh hơn #111
  boot+60m52s); cờ cũ #111 backup `POSTBOOT_PASS-257c1eae` md5 abe240cb (KHỚP
  byte-identical với cờ T5-188 mà T0-188 đã ghi). Mode/caveat thuộc T5-189 +
  parent (tiền lệ: replay poll=0 KHÔNG caveat ở #109/#110/#104; repair poll=1
  CÓ caveat ở #111/#107). **T0 chờ cờ 25m02s** (wait-1 02:46:52–03:01:52Z
  15 vòng timeout + wait-2 03:00:54–03:11:54Z tìm thấy vòng 12) — KHÔNG phải
  dùng điều khoản fallback trong brief (cờ #112 về kịp; POSTBOOT_PASS #111 từ
  T5-188 vẫn CÓ sẵn làm phương án dự phòng). dpkg 1.461 (khác #109/#110:
  1.468 — kém 7 dòng; T5-189 giải thích trong LIMITS T5-189).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (03:18:30–03:21:02Z)**: sau cờ 7m19s (chậm hơn đợt 188: 1m24s — vì attempt
  T4 chạy giữa, xem dưới). WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS
  03:18:42.901Z, Playwright mouse click lần 2; launched version 27.2
  03:18:35.742Z), JSON 21 results, 21 ok=true, md5
  `54345489905a108066e761169dcb04ad`; attempt2 exit=0, **21/21 PASS** (S1 PASS
  03:19:32.354Z), JSON 21 results, 21 ok=true, md5
  `1882c83e7ce159cac9e092b9bffe9e6f`; Chromium exit=0, **21/21 PASS** (S1 PASS
  03:20:31.947Z, CDP mouse click lần 2), JSON 21 results, 21 ok=true, md5
  `299b1010797148ec1f80c57da08c857e`. Đếm lại từ JSON gốc bằng python; JSON
  stamped theo lượt khớp md5 với bản copy. **0 lỗi exit 127 / launch-fail**
  trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1:8861/
  8851 bridge OK). Script gốc KHÔNG đổi so với đợt 188 (preview.tsx
  530e10a7, webkit 4994b4fc, headed c8acd72e). dpkg.log 1.461 dòng trên boot
  mới (khớp cờ T5-189).
- **0 attempt chồng — NHƯNG ĐẢO THỨ TỰ so với đợt 187/188 (như đợt 186, xem
  F-189-T0-6):** T4-189 poller bắt đầu 02:47:12Z, polls #1–#34 chờ cửa yên
  (gate0=T5 sau khi có cờ 03:11:11Z — poll #34 03:12:03Z ghi t5flag=PASS,
  gate0=T5, apt=0, dpkg_lines=1461; RAM 749 MB < gate A 1024 MB nên chưa mở
  attempt); poll #35 03:12:48Z RAM 1.091 MB → cửa yên mở, **attempt1 T4 chạy
  03:12:48–03:16:42Z, exit=0, 20/20 + class B 5/5 + tickCost median 42,0 ms
  ≤ 60 — LƯỢT HỢP LỆ, poller thoát** (lượt yên #58, budget 1/3); T0 acquire
  lock 03:18:30Z khi lock TRỐNG và poller T4 đã thoát (không còn poll nào
  trong cửa sổ O8 — poll cuối #35 03:12:48Z); chain-t4.log không có attempt
  nào sau 03:16:42Z. O8 chỉ chạy sau khi T4 xong, 0 attempt chồng. Lock
  t0-round189 giữ 152 s (03:18:30–03:21:02Z), đã nhả; lock TRỐNG sau O8.
- X11: 0 process Xvfb sót (kiểm 03:22:34Z); /tmp/.X11-unix/ còn **1 socket
  X193 của T4** (attempt1 display :193, process đã chết, socket còn — xem
  F-189-T0-3); display O8 của T0 (:189/:198) không để lại socket. Boot lúc T0
  đóng vẫn 27e6714f. Không có reboot mới trong phiên T0.
  LIMITS này ~21 KB.

## Giới hạn / sai số ghi nhận (F-189-T0-*)

- **F-189-T0-1 — Boot #112 rơi VÀO cửa sổ đóng sổ đợt 188 (ghi chú mốc thời
  gian, không đổi quyết).** Bằng chứng (DB + .done đọc trực tiếp): 9/9 cờ
  đợt 188 đã đủ từ 02:13Z; run 189 finished 02:19:17Z; boot #112 02:33:19Z;
  T10-188 bắt đầu 02:41Z, đóng ~02:53Z (aggregate 48.141 B). Tức boot xảy ra
  SAU khi công việc thực chất của đợt 188 xong (cờ + run), nhưng TRƯỚC khi
  T10-188 làm giấy tờ đóng sổ — và `.done` T10-188 KHÔNG nhắc gì tới boot
  mới (grep `27e6714f`/`02:33:19` trong round188-t10/ = 0 kết quả). Lời ghi
  (e)-188 "boot #112 xuất hiện SAU khi đợt 188 đóng" là ĐÚNG theo nghĩa cờ/
  run đã xong, CHƯA CHÍNH XÁC theo nghĩa T10-188 vẫn đang làm việc trên boot
  mới. Không ảnh hưởng số đếm (đếm file, không phụ thuộc boot; parent kiểm
  lại lần thứ 108 trên boot mới, KHỚP TỪNG SỐ). Gán #112 cho đợt 189 vẫn
  đứng. Giao parent/T10-189 ghi nhận mốc này khi viết §12.3-189.
- **F-189-T0-2 — Dấu chênh Cloudflare ở T0-188 bị đảo (đính chính phương pháp,
  không đổi verdict).** Bằng chứng: survey đợt 189 đo chặt (date trước/sau
  curl, midpoint): local mid 02:43:12Z, CF-Date 02:43:14 GMT → CF trước local
  2 s. Với phương pháp midpoint, độ trễ mạng đã được trừ hai chiều → local
  CHẬM hơn CF ~1–2 s (không phải NHANH ~+1 s như T0-188 viết: "chênh +2 s —
  trừ ~1 s mạng → đồng hồ ĐÚNG ~+1 s"). Mẫu này LẶP LẠI y hệt đợt 188 (local
  23:51:46–47Z vs CF 23:51:48 GMT, cũng CF trước 2 s) nên cả hai đợt đều cùng
  một dấu: đồng hồ cell chậm hơn CF ~1–2 s, KHÔNG phải nhanh. Verdict "đồng
  hồ ĐÚNG" KHÔNG ĐỔI (trong ±2 s); mọi phép tính gap/btime đều dùng đồng hồ
  local nhất quán nên không bị ảnh hưởng. Các đợt sau ghi chênh theo dấu
  CF − local (dương = CF trước = local chậm).
- **F-189-T0-3 — Socket X193 của T4 còn sót sau O8 (không phải của T0).**
  Bằng chứng: /tmp/.X11-unix/ lúc 03:22:34Z còn `X193` (T4 attempt1 display
  :193, 03:12:48–03:16:42Z); 0 process Xvfb còn sống; display T0 (:189/:198)
  không để lại socket. T0 KHÔNG dọn socket của luồng khác. Khác đợt 187/188
  (X11 TRỐNG hoàn toàn sau O8). Giao T4-189/T10-189 ghi nhận.
- **F-189-T0-4 — (m) #112: 0 requeue — T0 chỉ ghi số, KHÔNG phân loại (thuộc
  T2-189 + parent).** Bằng chứng (DB đọc tươi): 0 event
  `requeued_after_restart` trong [02:28:00Z, 02:42:00Z] và trong cả 25/11
  00:00–03:00Z; run 189 finished btime −842 s; run 190 sched btime +152 s;
  cửa [btime+33; btime+49,8] trống. Trong chuỗi #102–#111, mọi reboot có run
  spanning đều có ≥1 requeue tại btime +~35–44 s (#102 +40,341; #103 +37,543;
  #105 +34,931; #108 +39,438; #110 +43,959; #111 +37,468 — T0-188 đối chiếu);
  #112 nối lại mẫu 0 requeue của #109 (cả hai đều KHÔNG CÓ run spanning).
  **(m) #111 đối chiếu thô: +37,468 s** (eid 10875) — T2-189 phán cuối theo
  quyết (f)-188.
- **F-189-T0-5 — POSTBOOT_PASS #112 là replay-đầy-đủ poll=0 (mode/caveat
  thuộc T5-189 + parent).** T0 ghi nhận: replay-đầy-đủ, poll=0, dpkg 1.461
  (khớp 3 nguồn: cờ + watcher + `wc -l /var/log/dpkg.log` độc lập), cache
  169, lists 37, postboot PASS poll0 độc lập exit 0 03:11:11Z, boot+37m52s
  (nhanh hơn #111 boot+60m52s vì T5-189 spawn sớm boot+11m + replay không
  chờ apt-get update chậm như đợt 188). **libevent VẮNG lúc mở boot mới, CÓ
  sau replay (heal)** — survey 02:43:12Z MISSING (boot+9m53s); kiểm lại
  03:17:46Z file CÓ; O8 KHÔNG bị ảnh hưởng (WebKit dùng DEBROOT + libevent
  đã có trước O8; launch version 27.2, 0 lỗi). Mẫu: libevent vắng/có xen kẽ
  theo boot (#103 vắng, #104 có, #107 vắng→có sau repair, #109 vắng→có sau
  replay, #111 vắng→có sau repair, #112 vắng→có sau replay). T0 chờ cờ
  25m02s rồi mới chạy O8. Điều khoản fallback trong brief (dùng cờ #111 của
  T5-188) KHÔNG phải dùng tới. **POSTBOOT_PASS #108 VẪN KHÔNG CÓ** — tổng
  boot không cờ GIỮ 25 theo quyết (c)-188.
- **F-189-T0-6 — T0 chạy O8 SAU attempt T4 (đảo thứ tự so với đợt 187/188)
  — 0 chồng lấn, gate được kiểm trước VÀ sau lúc chạy.** Lúc T0 kiểm gate
  (03:18:25Z): lock TRỐNG, T4 poller ĐÃ THOÁT (attempt1 hợp lệ 03:16:42Z),
  apt=0 — T0 acquire lock 03:18:30Z, chờ 0 s. Không còn poll T4 nào trong cửa
  sổ O8 (poll cuối #35 03:12:48Z). Khác đợt 187/188 (T0 chạy trước khi T4 mở
  attempt): đợt này T4 mở attempt trước vì cửa yên mở ngay sau cờ (RAM
  1.091 MB tại poll #35) — T0 chạy sau là hợp lệ, lock là cơ chế serialize
  duy nhất. Phán cuối về lượt yên #58 thuộc T4-189 + parent (T0 chỉ ghi:
  attempt1 20/20 + class B 5/5 + median 42,0 ms ≤ 60).
  **Đánh giá O8 boot mới theo mốc chuỗi 1 (quyết (b) THẬT đợt 188 — FULL PASS
  GIỮ 0):** chân O8 T0 trên boot mới ĐẠT (WebKit 21/21 ×2 + Chromium 21/21,
  sau cờ 7m19s, cùng boot 27e6714f, cờ replay poll=0 — mode/caveat thuộc
  T5-189 + parent). Chuỗi lên lại chỉ khi đủ 5 chân cùng boot mới (lượt yên
  #58 + gate (a) boot mới + O8 T0 + O8 T8 + harness) — các chân còn lại thuộc
  T4/T5/T8/T10-189, T0 KHÔNG phán chuỗi.
- **F-189-T0-7 — F-187-T9-3 (đồng hồ cell nhanh) KHÔNG kiểm lại đợt này —
  theo đúng brief (T0-188 đã xác minh độc lập cả (a)+(b)).** Tiền lệ
  direction-blind vẫn đứng cho các phán overlap (m): đồng hồ NHANH trước
  #110 (δ > 22 s) và trước #111 (δ > 10 s) nên overlap đo được có thể ≤ 0 s
  thật — xem F-188-T0-2. T0-189 chỉ ghi nhận, không dùng làm bằng chứng mới.
- **F-189-T0-8 — Nguồn dùng trong LIMITS này: §12.3 aggregate 188 BẢN
  PARENT (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 108; SẠCH,
  lần sạch thứ ba kể từ đợt 179; tổng điền sẵn GIỮ 18) + §12.3 aggregate 187
  + LIMITS T0-188 + log gốc (replay-watch-189, poll-t4/chain-t4-189,
  POSTBOOT_PASS #112 + backup #111, wait-flag-189t0*.log, o8-189t0.log) + DB
  tươi (muse.db job_runs + events).** Các quyết THẬT dùng: (a) CHẤP NHẬN đợt
  188; (b) FULL PASS GIỮ 0; (c) POSTBOOT_PASS #111 CÓ caveat, tổng boot
  không cờ GIỮ 25; (d) INSIDE #107–#111 KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; (e)
  257c1eae = #111, boot #112 thuộc đợt 189; (f) (m) #110 DƯƠNG (CUỐI), (m)
  #111 SỐ THÔ DƯƠNG, n ứng viên 49/50; (g) n chính thức GIỮ 14; (h) E-238
  KẾT THÚC BỞI #111, E-239–E-243 GIỮ TÁCH, ghim 42/123; (i) holder chuỗi
  13 → 15, #112 không giết → 16 (T6-189); (j) B2/V2 bắt kẹt thật live lần
  đầu, B1 live sạch DỪNG ở 5, 84l10 PASS chuỗi 8, 86n2-P1 chuỗi 11, log sạch
  chuẩn 25; (k) replay #111 ĐÌNH TRỆ, nợ host-side VẪN MỞ; (l) headroom 0
  lần 48; (m) lượt yên #57 0 attempt, chuỗi 1 → 0 (ĐỨT); (n) run 188 TIMEOUT
  CA #20, run 189 start TRỄ +175 s, cửa slot LÀNH chuỗi 1 → 2, OUTAGE #2
  'cố định theo giờ' ĐƯỢC ỦNG HỘ MẠNH; (o) auto-trigger BẬT LIVE từ đợt 189
  (fixture clip1.mp4, load1 < 4,0, MISSED-WINDOW); (p) chuỗi 0 vi phạm 3 →
  4, live GIỮ 7; (q) đếm cuối đợt 188 = 10/16/15/14, lũy kế 111–188 =
  768/1.333/1.159/981, chờ push 166–188 = 230/354/321/317, chuỗi 9/9 = 10;
  (r) KHÔNG PUSH. T0 KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8
  trong LIMITS này không bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham
  chiếu (b)/(c)/(g)/(n)/(p)/(q) theo bản parent).
- **Ghi nhận ngoài luồng (chỉ quan sát, không phán tác giả):** MEMORY.md bị
  sửa từ bên ngoài trong phiên T0 (system watcher báo ~02:51Z: mục đợt 185
  viết lại); AGENTS.md thêm mục '§12.3 round 188 SẠCH' lúc ~03:1xZ, trong đó
  ghi parent KHÔNG sửa MEMORY.md. T0 KHÔNG sửa MEMORY.md/AGENTS.md.

## Phạm vi chưa kiểm (không thuộc T0)

- Số hiệu #112 (hệ quả trực tiếp quyết (e)-186/(e)-187 + xác minh 9 nguồn
  T0-189 — parent xác nhận ở §12.3-189); (m) #112 + (m) #111 + INSIDE #110/
  #111/#112 (T2-189); kết cục run 189 (SUCCEEDED — số thô đã ghi, T7-189
  phán) + kết cục run 190 + HB/DR + cửa slot đợt 189 + OUTAGE #2 điều tra
  'cố định theo giờ' (T7-189; T7-193 kiểm onset khung 25/11, T7-194 phán
  cuối); POSTBOOT_PASS #112 chi tiết + mode/caveat (T5-189); lượt yên #58
  (T4-189 — attempt1 hợp lệ, poller đã thoát; phán cuối thuộc T4-189 +
  parent); harness + O8 bộ thứ hai + B2 + ca P5 mới (T8-189); #112 có giết
  holder không — T6-189 đã báo không giết → chuỗi 16 (phán cuối + prune
  thuộc T6-189); headroom + ENOSPC + E-239–E-243 (T9-189); auto-trigger live
  lần FIRE thật đầu tiên (T9-189 verify end-to-end — quyết (o)-188).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 (chỉ O8); không
  xác minh actor của replay boot mới (thuộc T5-189); không kiểm lại nguyên
  nhân scheduler gap 8.406 s hay trigger của nó; không chạy `grep`/`find` đệ
  quy lúc mở đợt (bài học F-179-T9-6 — T0 đợt này chỉ đọc file trực tiếp theo
  đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round189-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round189-t0/appendix189.py` + `appendix189.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round189-t0/boot-survey-189t0.sh`
  + `boot-survey-189t0.txt` (output thô 9 nguồn boot mới — đo tươi 02:43:12Z;
  script adapt từ 188; đo Cloudflare chặt theo F-188-T0-9; KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round189-t0/wait-flag-189t0.sh`
  + `wait-flag-189t0.log` (chờ cờ vòng 1: timeout 15 vòng 02:46:52–03:01:52Z)
  + `wait-flag-189t0b.log` (chờ cờ vòng 2: FLAG-FOUND 03:11:54Z vòng 12)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round189-t0/o8-driver-189t0.sh` +
  `o8-189t0.log` + `o8-lock.log` + `o8-driver-189t0.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-189t0.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)

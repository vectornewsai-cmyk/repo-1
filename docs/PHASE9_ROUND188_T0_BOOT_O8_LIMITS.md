# PHASE9_ROUND188_T0_BOOT_O8_LIMITS.md

Đợt 188 — T0 (boot survey + xác minh reboot mới + F-187-T9-3 + O8). Mở lượt cron 23:35:51Z
24/11/2026 (= 06:35 +07 25/11), survey đo tươi 23:46:54Z, O8 00:13:00–00:15:45Z 25/11,
đóng ~00:25Z 25/11/2026. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag.
Nguồn đứng: §12.3 aggregate 186 BẢN PARENT (107.950 B; quyết (a)–(r); parent kiểm
đếm KHỚP TỪNG SỐ lần thứ 99; SẠCH, không điền sẵn — lần đầu sạch kể từ đợt 183).
§12.3 aggregate 187 CHƯA CÓ lúc T0-188 đóng (T10-187b đang đóng song song; aggregate 187
56.056 B lúc 23:54:05Z, §12.2 còn trống "(trống — chờ quyết parent)", chưa có tiêu đề §12.3)
— T0 KHÔNG chờ, KHÔNG viết vào aggregate 187.

**BỐI CẢNH: số hiệu boot ĐÃ ĐƯỢC PARENT QUYẾT** — quyết (e)-186: cea79500 = #107
(cách đếm T0-186 được chấp nhận; #106 là reboot chưa xác minh, ước ~15:13:32Z);
hệ quả 7ea9d047 = #108, 6f1d9f87 = #109 (btime 20:30:33Z), 912f4a97 = #110
(btime 21:13:21Z). Boot mới 257c1eae = **#111** theo hệ quả trực tiếp này —
T0-188 xác minh 9 nguồn tươi, KHÔNG trình bày hai cách đếm nữa.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 23:46:54Z)**: boot_id
  `257c1eae-1c20-4bd4-a710-548adb1d34d5` (khác boot trước `912f4a97`); btime
  **23:10:44Z** (epoch 1795561844; uptime bracket khớp cùng giây —
  `uptime -s` 23:10:44Z, /proc/stat btime 1795561844, /proc/uptime 2.169,79 s lúc
  23:46:54Z → boot_est = btime +0,21 s; /proc/1 start_ticks 1117 = btime
  +11,17 s, stat mtime 23:10:55.989Z = btime +11,989 s; journal idx 0 duy nhất,
  first 23:10:56Z = btime +12 s; wtmp begins 23:10:56Z; `last` reboot 23:10
  still running; `who -b` Nov 24 23:10; Cloudflare đo chặt (local 23:51:46–47Z
  vs CF 23:51:48 GMT, chênh +2 s — trừ ~1 s mạng → đồng hồ boot mới ĐÚNG ~+1 s,
  như các đợt trước); DB: run 188 requeue tại btime +37,468 s (xem dưới);
  marker mtime không đổi).
  Gap #110→#111 = **7.043 s (1h57m23s) — TRỞ LẠI mẫu ~2h** (ngắn nhất chuỗi gần
  đây: #109→#110 2.568 s; #107→#108 6.602 s; #104→#105 7.190 s). Boot mới xảy ra
  SAU khi run 187 finished (20:17:06Z), TRƯỚC khi đợt 188 mở (23:35:51Z).
  **Không có reboot mới trong phiên T0** (kiểm cuối 00:17:30Z boot vẫn 257c1eae).
- **Marker sống qua 63 reboot (#49–#111)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). Khớp công thức N−48 (parent-186: 59 qua
  #107; T0-187: 61 qua #109).
- **F-187-T9-3 — KIỂM LẠI ĐỘC LẬP: XÁC NHẬN CẢ (a) + (b)** (xem F-188-T0-2).
  (a) Trước #110: đồng hồ NHANH δ > 22 s (mẫu sampler cuối trên #109 21:13:43Z,
  sau btime #110 22 s, vẫn boot cũ). (b) Trước #111: đồng hồ NHANH δ > 2 s theo
  sampler, **δ > 10 s theo watcher-187b** (poll cuối 23:10:54Z, sau btime #111
  10 s, vẫn boot cũ) — cận dưới mạnh hơn. Đồng hồ boot mới ĐÃ ĐƯỢC xác minh
  ĐÚNG (~+1 s vs Cloudflare).
- **(m) #111 — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-188 + parent)**:
  **1 event `requeued_after_restart`** trong [23:09:00Z, 23:13:00Z]: eid 10875,
  23:11:21.467938Z, detail "daemon startup recovery", run b7d4f596 (run 188,
  sched 20:35:51Z) → offset **btime +37,468 s** (trong dải [33; 49,8] của các
  (m) DƯƠNG trước: #102 +40,341; #103 +37,543; #105 +34,931; #108 +39,438).
  Cùng run 188: dispatched eid 10876 23:11:21.529295Z; reattached_after_restart
  eid 10877 23:11:21.581306Z; **timeout eid 10882 23:38:46.354405Z** ("Ran out of
  its 10800s time budget"). Run 188 SỐNG tại btime (dispatched 20:35:51Z, đã
  requeue 1 lần sau #110, chưa finished trước btime; finished 23:38:46Z status
  timeout, timed_out true; boot_gen BỊ VIẾT LẠI thành cron_boot_f5bbd5f4...
  sau requeue — boot_gen gốc cron_boot_32707bf4... lưu trong appendix187.py).
  Cửa rộng [23:05:00Z, 23:20:00Z]: 6 event — 3 event run 188 + reconciled 10878
  + dispatched/succeeded f635e864 (run khác). Run 189 (đợt này): sched
  23:35:51Z, started=claimed 23:38:46Z (= đúng lúc run 188 finished), status
  running lúc đọc, boot_gen cron_boot_f5bbd5f4... (boot mới). **Khác #109**
  (0 requeue vì không run nào spanning): ở đây run 188 spanning nên 1 requeue
  là hệ quả của run sống — phân loại thuộc T2-188 + parent.
  **(m) #110 đối chiếu thô (cho T2-188)**: requeue eid 10848 21:14:04.95861Z =
  btime #110 **+43,959 s**; dispatched 10849 21:14:05.04824Z; reattached 10850
  21:14:05.148733Z.
- **POSTBOOT_PASS #111 ĐÃ CÓ 00:11:36Z (T5-188; T0 chỉ ghi nhận + xác minh
  độc lập)**: file `round188-t5/POSTBOOT_PASS`, 324 B, md5
  abe240cb8363816f178d1228ba372fc9; mode **repair-sớm-quyết-h, poll=1**;
  dpkg **768** dòng, cache 107 .deb, lists 68; postboot PASS poll1 độc lập
  exit 0 lúc 00:11:36Z; boot+60m52s; cờ cũ #110 backup `POSTBOOT_PASS-912f4a97`
  md5 302ae331 (byte-identical với cờ T5-187). Mode/caveat thuộc T5-188 +
  parent (tiền lệ: repair poll=1 CÓ caveat ở #107/#101/#98/#96; replay poll=0
  KHÔNG caveat ở #109/#110/#104). **T0 chờ cờ 12 phút** (wait-flag 00:00:22–
  00:12:22Z, 13 vòng) — KHÔNG phải dùng điều khoản fallback trong brief
  (cờ #111 về kịp; POSTBOOT_PASS #110 từ T5-187 vẫn CÓ sẵn làm phương án dự phòng).
  **POSTBOOT_PASS #108 (7ea9d047) VẪN KHÔNG CÓ** (T5-187 xác nhận; tổng boot
  không cờ 23 → 24 → 25 nếu parent chấp nhận #105 + #108 — T5-187/T7-187).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (00:13:00–00:15:45Z)**: sau cờ 1m24s. WebKit attempt1 exit=0, **21/21 PASS**
  (S1 PASS 00:13:18.075Z, Playwright mouse click lần 2), JSON 21 results, 21
  ok=true, md5 `b93711da24b9785a89d5d4784133978c`; attempt2 exit=0, **21/21 PASS**
  (S1 PASS 00:14:11.947Z), JSON 21 results, 21 ok=true, md5
  `fb7bf717ab25c8ae8d1a72493b20c365`; Chromium exit=0, **21/21 PASS** (S1 PASS
  00:15:14.627Z, CDP mouse click lần 2), JSON 21 results, 21 ok=true, md5
  `2f335c6d2362cfaec03c827a43ba0794`. Đếm lại từ JSON gốc bằng python.
  **libevent-2.1.so.7 VẮNG lúc 23:46:54Z → CÓ lúc 00:11:36Z** (repair T5-188;
  heal lần 4 sau #104, #107, #109); WebKit dùng DEBROOT (có libevent) nên O8
  không bị ảnh hưởng; WebKit launched version 27.2 cả hai attempt
  (00:13:07Z + 00:14:05Z); **0 lỗi exit 127 / launch-fail** trong cả 3 bộ
  (3 dòng chứa "127" trong log đều là http://127.0.0.1:8861/8851 bridge OK).
  Script gốc KHÔNG đổi so với đợt 187 (preview.tsx 530e10a7, webkit 4994b4fc,
  headed c8acd72e). dpkg 768 dòng trên boot mới (khớp con số trong cờ T5-188).
- **0 attempt chồng — NHƯNG ĐẢO THỨ TỰ so với đợt 186 (như đợt 187, xem
  F-188-T0-7):** T4-188 poller bắt đầu 23:48:13Z, polls #2–#32 vẫn chờ cửa yên
  (gate0=T5 sau khi có cờ 00:11:36Z — poll #33 00:12:20Z ghi t5flag=PASS,
  gate0=T5, apt=0, dpkg_lines=768; RAM 612 MB < gate A 1024 MB nên chưa mở
  attempt); T0 acquire lock 00:13:00Z khi lock TRỐNG và chưa có attempt T4 nào;
  polls #34/#35/#36/#37 TRONG cửa sổ O8 (00:13:06Z/00:13:51Z/00:14:37Z/
  00:15:22Z) đều ghi `lock=co:thread=t0-round188 pid=287138 port=5560` → T4 chờ,
  không khởi động attempt; poll #38 (00:16:08Z, sau khi lock nhả) lock=khong;
  chain-t4.log không có attempt nào. O8 chỉ chồng pha poll của T4, 0 attempt.
  Lock t0-round188 giữ 165 s (00:13:00–00:15:45Z), đã nhả; lock TRỐNG sau O8.
- X11: 0 process sót (kiểm 00:17:30Z); /tmp/.X11-unix/ TRỐNG — O8 không để lại
  socket. Boot lúc T0 đóng vẫn 257c1eae. Không có reboot mới trong phiên T0.
  LIMITS này ~21 KB.

## Giới hạn / sai số ghi nhận (F-188-T0-*)

- **F-188-T0-1 — Header T5-188 ghi số hiệu boot "CHƯA QUYẾT" là LỖI THỜI —
  parent ĐÃ QUYẾT ở (e)-186.** Bằng chứng: replay-watch-188.sh (T5-188, viết
  ~23:54Z) ghi "#111 ỨNG VIÊN theo cách đếm T0-186, #110 theo T2-186 — SỐ HIỆU
  CHƯA QUYẾT, F-187-T5-2". Parent quyết (e)-186 (lượt 21:07Z 24/11, TRƯỚC khi
  T5-188 spawn): cea79500 = #107 (chấp nhận cách đếm T0-186), hệ quả 7ea9d047 =
  #108, 6f1d9f87 = #109, 912f4a97 = #110 → 257c1eae = **#111**. T5-188 (hoặc
  generator của nó) dùng nguồn cũ (aggregate 187 lúc đó chưa có §12.3 parent,
  và (e)-186 chưa được cập nhật vào template). T0-188 dùng cách đếm theo quyết
  (e)-186 cho MỌI số đếm trong LIMITS này; nếu parent đổi quyết thì nhãn #111
  đổi theo — btime/gap/boot_id KHÔNG đổi. Giao T5-188 sửa header ở đợt sau
  (không sửa file đang chạy).
- **F-188-T0-2 — F-187-T9-3 ĐÃ KIỂM LẠI ĐỘC LẬP: XÁC NHẬN CẢ (a) + (b) — đồng hồ
  NHANH trước CẢ HAI reboot (giao T7-188/T10-188).** Bằng chứng (log gốc +
  source script, T0 đọc trực tiếp):
  (a) Trước #110: `round187-t9/ram-sampler-FROZEN.log` md5
  51f78d2ea328f6412a4c7486580705ef (KHỚP T9-187), 148 dòng; mẫu cuối #109 dòng 32:
  21:13:43Z boot=6f1d9f87 — SAU btime #110 (21:13:21Z) 22 s, vẫn boot cũ.
  `sampler.sh` (round187-t9) đọc `BID=$(cat /proc/sys/kernel/random/boot_id)`
  TRONG loop mỗi mẫu → mẫu thật sự chạy trên boot cũ → **δ > 22 s**
  (T9 ước 16–30 s theo tiền lệ — T0 chỉ khẳng định cận dưới 22 s).
  Corroboration độc lập: `replay-watch-187.sh` đọc `b=$(boot_now)` tươi mỗi poll
  (dòng 115); poll cuối 21:13:27Z boot=6f1d9f87 = btime #110 +6 s → δ > 6 s.
  (b) Trước #111: mẫu cuối #110 dòng 148: 23:10:46Z boot=912f4a97 — SAU btime
  #111 (23:10:44Z) 2 s, vẫn boot cũ → **δ > 2 s** (T9 ước 16–30 s — T0 chỉ
  khẳng định cận dưới 2 s). Corroboration độc lập MẠNH HƠN:
  `replay-watch-187b.sh` đọc `b=$(boot_now)` tươi mỗi poll (dòng 115); poll cuối
  23:10:54Z boot=912f4a97 = btime #111 +10 s → **δ > 10 s** (T5-188 gọi đây là
  mẫu overlap thứ 21, F-188-T5-1 — cùng mẫu, T0 xác minh độc lập).
  btime #110 đối chiếu độc lập từ POSTBOOT_PASS #110: "btime 2026-11-24
  21:13:21Z" — KHỚP epoch 1795554801. Gap sampler qua #110: 21:13:43Z →
  21:15:44Z = 121 s (T9-187 KHỚP); 32 mẫu #109 + 116 mẫu #110 = 148 (KHỚP).
  **Lưu ý phương pháp:** caveat của T0-187 (replay-watch-186.sh cache BOOT8 một
  lần — dòng replay-watch-186.log 19:10:05Z KHÔNG phải bằng chứng độc lập) đã
  bị T5-187 bác bỏ ở F-187-T5-1 (kiểm lại code: dòng 114 đọc tươi mỗi poll) —
  T0-188 KHÔNG dùng script 186 làm bằng chứng; hai script 187/187b T0-188 đã
  kiểm source trực tiếp (đọc tươi mỗi poll, dòng 115) nên caveat đó KHÔNG áp
  dụng cho chúng. Log T9 các đợt 180–187 lưu ở `~/workspace/repo-1/roundNNN-t9/`
  (không phải hidden_files) — T0-188 mất vài phút tìm mới thấy (ghi chú phương
  pháp, không phải lỗi dữ liệu).
- **F-188-T0-3 — (m) #111: 1 requeue tại btime +37,468 s — T0 chỉ ghi số,
  KHÔNG phân loại (thuộc T2-188 + parent).** Bằng chứng (DB đọc tươi):
  eid 10875 23:11:21.467938Z = btime +37,468 s; run 188 sống tại btime
  (dispatched 20:35:51Z, đã requeue sau #110, chưa finished); timeout eid 10882
  23:38:46.354405Z. Trong chuỗi #102–#110, mọi reboot có run spanning đều có
  ≥1 requeue tại btime +~35–44 s (#102 +40,341; #103 +37,543; #105 +34,931;
  #108 +39,438; #110 +43,959 — T0-188 đối chiếu); #111 nối lại mẫu này sau 2
  reboot liên tiếp 0 requeue (#109, #110-cách-đếm-cũ — cả hai đều KHÔNG CÓ run
  spanning). **(m) #110 đối chiếu: +43,959 s** (eid 10848) — T2-187 phân loại,
  T0 chỉ đối chiếu số thô.
- **F-188-T0-4 — Run 188 TIMEOUT 23:38:46Z (số thô, T0 chỉ ghi, KHÔNG phán —
  thuộc T7-188 + parent).** Bằng chứng (DB đọc tươi): rid b7d4f596...,
  sched 20:35:51Z, started (viết lại) 23:11:21Z, finished 23:38:46Z, status
  `timeout`, timed_out true, attempt 1, claimed 23:36:20Z; boot_gen viết lại
  cron_boot_f5bbd5f4... (boot mới). 8 event: dispatched 10838 20:35:51Z;
  requeued 10848 21:14:04.959Z + dispatched 10849 + reattached 10850 (sau #110);
  requeued 10875 23:11:21.468Z + dispatched 10876 + reattached 10877 (sau #111);
  timeout 10882 23:38:46.354Z. Run 189 (đợt này) started=claimed 23:38:46Z =
  đúng lúc run 188 finished. Kết cục run 188 + claimed→finished + có tính
  timeout mới không thuộc T7-188.
- **F-188-T0-5 — libevent VẮNG lúc mở boot mới, CÓ sau repair (heal lần 4).**
  Bằng chứng: boot-survey 23:46:54Z `libevent-2.1.so.7 MISSING` (boot+36m10s,
  vẫn vắng 23:55:10Z); repair T5-188 cài đặt 00:10–00:11Z (apt-get update
  00:00–00:10Z, install 10 gói 00:10–00:11Z); kiểm lại 00:12:43Z file CÓ
  (symlink → libevent-2.1.so.7.0.1); dpkg.log 2 → 768 dòng, cache 0 → 107,
  lists 5 → 68, GST 0 → 269. O8 KHÔNG bị ảnh hưởng (WebKit dùng DEBROOT +
  libevent đã có trước O8 1m24s sau cờ; launch version 27.2, 0 lỗi).
  Mẫu: libevent vắng/có xen kẽ theo boot (#103 vắng, #104 có, #107 vắng→có
  sau repair, #109 vắng→có sau replay, #111 vắng→có sau repair).
- **F-188-T0-6 — POSTBOOT_PASS #111 là repair poll=1 (mode/caveat thuộc T5-188
  + parent).** T0 ghi nhận: repair-sớm-quyết-h, poll=1, dpkg 768 (= #107,
  cũng repair 768), cache 107, lists 68, postboot PASS poll1 độc lập exit 0
  00:11:36Z, boot+60m52s (chậm hơn #110 boot+8m54s vì T5-188 spawn muộn
  ~23:54Z + apt-get update chậm ~10 phút). T0 chờ cờ 12 phút rồi mới chạy O8
  (O8 sau cờ 1m24s — nhanh thứ hai sau đợt 185: 32 s; đợt 186: 9m35s; đợt 187:
  7m45s). Điều khoản fallback trong brief (dùng cờ #110 của T5-187) KHÔNG phải
  dùng tới. **POSTBOOT_PASS #108 VẪN KHÔNG CÓ** — tổng boot không cờ 23 → 24
  → 25 nếu parent chấp nhận #105 + #108 (T5-187/T7-187).
- **F-188-T0-7 — T0 chạy O8 TRƯỚC attempt T4 (đảo thứ tự so với đợt 186) —
  0 chồng lấn, gate được kiểm trước VÀ trong lúc chạy.** Lúc T0 kiểm gate
  (00:12:43Z): lock TRỐNG, T4 poll #33 vừa ghi gate0=T5 (cờ mới 00:11:36Z) nhưng
  RAM 612 MB < gate A 1024 MB (chưa có attempt nào), apt=0 — T0 acquire lock
  00:13:00Z. Polls #34/#35/#36/#37 của T4 TRONG cửa sổ O8 đều ghi lock=co
  (T4 chờ, không khởi động attempt). Khác đợt 186 (T4 attempt1 mở trước, T0
  hoãn O8 chờ xong): đợt này T4 chưa mở attempt nên T0 chạy trước là hợp lệ —
  lock là cơ chế serialize duy nhất, và T4 retry poll sau khi lock nhả (poll
  #38 lock=khong). T0 KHÔNG biết T4 sẽ mở attempt lúc nào sau O8 (poller
  deadline 01:30:00Z); phán cuối về lượt yên #57 thuộc T4-188 + parent.
  **Đánh giá O8 boot mới theo mốc chuỗi 1 (quyết (b) THẬT đợt 185 — FULL PASS
  0→1; đợt 186 ĐỨT về 0):** chân O8 T0 trên boot mới ĐẠT (WebKit 21/21 ×2 +
  Chromium 21/21, sau cờ 1m24s, cùng boot 257c1eae, cờ repair poll=1 —
  mode/caveat thuộc T5-188 + parent). Chuỗi lên lại chỉ khi đủ 5 chân cùng
  boot mới (lượt yên #57 + gate (a) boot mới + O8 T0 + O8 T8 + harness) — các
  chân còn lại thuộc T4/T5/T8/T10-188, T0 KHÔNG phán chuỗi.
- **F-188-T0-8 — X11 SẠCH sau O8 (như đợt 187, khác đợt 186).**
  /tmp/.X11-unix/ TRỐNG, 0 process Xvfb sót (kiểm 00:17:30Z). Display O8 của
  T0 (:188/:197) không để lại socket.
- **F-188-T0-9 — Cloudflare trong survey chậm cho +10 s LÀ DO curl chậm, không
  phải đồng hồ lệch.** Bằng chứng: survey 23:46:54Z local vs CF-Date 23:47:04
  (+10 s) nhưng curl trong script chậm (~10 s, script tổng 67 s); đo chặt lại
  23:51:46–47Z (date trước/sau curl, tính midpoint) cho +2 s (trừ ~1 s mạng →
  đồng hồ ~+1 s). Bài học: so CF phải đo chặt trong cùng một lệnh, không lấy
  timestamp đầu script.
- **F-188-T0-10 — Nguồn dùng trong LIMITS này: §12.3 aggregate 186 BẢN PARENT
  (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 99; SẠCH, không điền
  sẵn) + aggregate 187 T10-187b (§12.3 CHƯA CÓ lúc T0-188 đóng — chỉ dùng làm
  bối cảnh, KHÔNG dùng số đếm chưa quyết) + T5-187/T9-187 LIMITS + log gốc
  (sampler FROZEN md5 51f78d2e, watcher-187/187b, POSTBOOT_PASS #110) + DB tươi
  (muse.db job_runs + events).** Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 186;
  (b) chuỗi FULL PASS 1 → 0 (ĐỨT); (c) POSTBOOT_PASS #107 đứng cho gate (a) CÓ
  caveat, #105 KHÔNG CÓ cờ, tổng boot không cờ 23 → 24; (d) INSIDE #104 TRUE
  (FULL150, chuỗi 5 → 6) + INSIDE #105 TRUE (FULL151, chuỗi 6 → 7); (e) số
  hiệu cea79500 = #107, 7ea9d047 = #108, 6f1d9f87 = #109; (f) (m) #105 DƯƠNG
  (CUỐI); (g) n ứng viên 47/48, n chính thức GIỮ 14; (h) E-232/E-233 GIỮ TÁCH,
  tổng ghim 21/130; (i) holder chuỗi 10/11, (A) 120/120 lần thứ 36, prune lần
  61; (j) B2 ĐÃ TRIỂN KHAI + V2 (f'') phương án chính, B1 live sạch lần thứ
  tư, 84l10 PASS chuỗi 6, 86n2-P1 chuỗi 9; (k) Hướng (3) lần thứ 33; (l)
  headroom 0 lần thứ 46, ENOSPC đợt thứ 35; (m) mù #96?/#95?/#94?/#88?/#77?
  VẪN MỞ, lượt yên #55 KHÔNG CÓ LƯỢT HỢP LỆ (chuỗi 47 → 0, ĐỨT), CERT/FULL
  GIỮ 76/91, (m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 29; (n) run 185 SUCCEEDED +232 s
  (CA mới thứ 17), run 186 SUCCEEDED +9.789 s (CA mới thứ 18), run 187 kết cục
  thuộc T7-187; (o) cửa slot đợt 186 KHÔNG LÀNH, OUTAGE 8.406 s TÍNH LÀ OUTAGE
  #2 + MỞ ĐIỀU TRA hướng "cố định theo giờ"; (p) chuỗi 0 vi phạm 1 → 2, kiểm
  chứng live lần 6 ĐẠT; (q) đếm cuối đợt 186 = 10/19/18/14, lũy kế 111–186 =
  748/1.294/1.124/946, chờ push 166–186 = 210/315/286/282, chuỗi 9/9 = 8;
  (r) KHÔNG PUSH. T0 KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8 trong
  LIMITS này không bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham chiếu
  (b)/(c)/(g)/(n)/(p)/(q) theo bản parent).

## Phạm vi chưa kiểm (không thuộc T0)

- Số hiệu #111 (hệ quả trực tiếp quyết (e)-186 — parent xác nhận ở §12.3-187
  hoặc §12.3-188); (m) #111 + (m) #110 + INSIDE #111 + INSIDE #110 (T2-188);
  kết cục run 188 (TIMEOUT — số thô đã ghi, T7-188 phán) + kết cục run 189 +
  HB/DR + cửa slot đợt 188 + OUTAGE #2 điều tra hướng "cố định theo giờ"
  (T7-188); POSTBOOT_PASS #111 chi tiết + mode/caveat (T5-188); lượt yên #57
  (T4-188 — chưa mở attempt lúc T0 đóng; poller deadline 01:30:00Z); harness +
  O8 bộ thứ hai + B2 (T8-188, V2 chính thức); #111 có giết holder không — phán
  cuối + prune lần 63 (T6-188); headroom + ENOSPC + balloon + E-238/E-239
  (T9-188); auto-trigger live từ đợt 188 (quyết (p) aggregate 186 (ii) — parent
  xem lại ở §12.3-187).
- Không kiểm lại dải FULL125–FULL154; không chạy lại suite T1 (chỉ O8); không
  xác minh actor của replay boot mới (thuộc T5-188); không kiểm lại nguyên nhân
  scheduler gap 8.406 s (xem F-187-T0-9) hay trigger của nó; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T0 đợt này chỉ đọc file
  trực tiếp theo đường dẫn đã biết, trừ hai grep POSTBOOT_PASS* có phạm vi hẹp
  (find maxdepth 2 + grep trên file POSTBOOT_PASS* đã liệt kê) + một find
  maxdepth 3–4 có phạm vi hẹp để tìm log T9 — không lặp lại đợt này; grep đệ
  quy trong boot-survey đã bị kill giữa chừng vì chậm, dữ kiện đã lấy đủ từ
  grep hẹp sau đó).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round188-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round188-t0/appendix188.py` + `appendix188.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round188-t0/boot-survey-188t0.sh`
  + `boot-survey-188t0.txt` (output thô 9 nguồn boot mới — đo tươi 23:46:54Z;
  script adapt từ 187; grep đệ quy cuối script đã kill vì chậm — dữ kiện
  POSTBOOT_PASS lấy lại bằng grep hẹp)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round188-t0/wait-flag-188t0.sh`
  + `wait-flag-188t0.log` (chờ cờ T5-188: tìm thấy 00:12:22Z, vòng 13/15)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round188-t0/o8-driver-188t0.sh` +
  `o8-188t0.log` + `o8-lock.log` + `o8-driver-188t0.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-188t0.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)

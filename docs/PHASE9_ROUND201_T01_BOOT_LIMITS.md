# PHASE9_ROUND201_T01_BOOT_VERIFY_LIMITS.md

Đợt 201 — T01 (gộp T0+T1: boot survey + O8 + GAP §129).
Mở lượt cron 21:35:51 +07 27/11/2026 (= 14:35:51Z, run 210); survey đo tươi
14:48:24Z, O8 14:53:25–14:56:10Z. Chỉ đọc + ghi file làm việc; không sửa code
sản phẩm, không push, không release/tag. Nguồn đứng: **§14.2 aggregate 200
BẢN PARENT VIẾT TRỰC TIẾP trong lượt cron 18:35 +07 27/11/2026 (~14:30Z;
aggregate 69.928 B lúc T10-200 đóng 14:23:24Z, md5 3eb3a41b; §14.2 TRỐNG khi
parent đọc — SẠCH, lần sạch thứ tám kể từ đợt 179: 179, 183, 191, 195, 197,
198, 199, 200; tổng điền sẵn GIỮ 18; parent kiểm đếm KHỚP T10-200 TỪNG SỐ
lần thứ 156 liên tiếp, dedup python + kiểm chéo shell viết mới
`hidden_files/round200-parent/count-200-parent.py` + `.sh`)**. T01 KHÔNG dùng
file `hidden_files/round199-parent-decisions.md` (GIẢ), không dùng thư mục
`hidden_files/round199-t10/` giả, không dùng script `/tmp/qq199-count.py` +
`/tmp/qq199-cross.sh` (GIẢ). **T01 tự viết script mới hoàn toàn đợt này
(appendix201.py, boot-survey-201t01.sh, o8-driver-201t01.sh).**

**BỐI CẢNH: đợt 200 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-200).**
Đợt 201 là đợt thứ mười một theo hướng mới của user (15:03 25/11 — ƯU TIÊN
hoàn thiện sản phẩm; Editing Core — parity preview/render). T10-201 do lượt
cron sau spawn để đóng sổ; T01 KHÔNG đóng sổ. **T01-201 KHÔNG đếm đợt 201**
(theo giao (r)-200 — chỉ survey + GAP + O8; đếm thuộc T10-201).

## Kết quả chính

- **KHÔNG CÓ REBOOT MỚI — vẫn boot #130 `c073c8bb-26f3-41e8-a4b5-3d56ce3564f8`,
  btime 11:21:41Z — XÁC NHẬN LẠI 9 nguồn TƯƠI (đo 14:48:24Z)**: boot_id
  c073c8bb (khác boot trước e6e070b8 #129, giống boot đợt 200); btime
  1795778501; uptime bracket khớp cùng giây — `uptime -s` 11:21:41Z,
  /proc/stat btime 1795778501, /proc/uptime 12.402,73 s lúc 14:48:24Z →
  boot_est = btime +0,27 s; /proc/1 start_ticks 1211 = btime +12,11 s, stat
  mtime 11:21:54.070Z = btime +13,07 s; journal idx 0 duy nhất, first
  11:21:54Z = btime +13 s; wtmp begins 11:21:54Z; `last` reboot 11:21 still
  running; `who -b` Nov 27 11:21; Cloudflare đo chặt (local mid 14:48:24Z
  vs CF-Date 14:48:26 GMT, chênh +2 s — đồng hồ local chậm ~2 s, khớp các
  đợt trước; marker mtime không đổi). Uptime lúc survey 3h26m43s. **Không
  có boot #131.** Gap #129→#130 GIỮ 16.965 s (4h42m45s).
- **Số hiệu #130 ĐÃ XÁC NHẬN ở (e)-200** (không còn "ứng viên CÓ ĐIỀU KIỆN"):
  daemon restart 08:41:43Z = daemon-only restart, KHÔNG phải reboot; daemon
  restart 02:34:43Z GIẢ THUYẾT REBOOT BỊ BÁC — số hiệu #128/#129 ĐỨNG;
  daemon restart 10:41:43Z cũng coi là daemon restart (không bằng chứng
  reboot). T01-201 kiểm tiếp giả thuyết này, KHÔNG tìm thấy bằng chứng mới
  (xem F-201-T01-4) — quyết (e)-200 GIỮ NGUYÊN.
- **Marker 81 — ĐÃ XÁC MINH ở (e)-200** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B, md5 cb7102c0 (nội
  dung ghi boot #48, 2c0a7985, btime 2026-11-20T11:26:05Z).
- **#129 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (cùng mẫu #122/#124/
  #125/#127/#128):** journal/wtmp/dpkg chỉ còn boot hiện tại (#130) —
  #129 đã chết 11:21:41Z trước khi đợt 200 mở. KHÁC #122: #129 **ĐÃ ĐƯỢC
  T7-199 đo btime tươi lúc 06:39:58Z** + POSTBOOT #129 CÓ (parent (c)-199)
  + parent ỨNG VIÊN ở (e)-199 — tồn tại của #129 không còn tranh cãi.
- **(m) boot #130 — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-201 +
  parent)**: **(m) #130 THÔ = 0 requeue** — 0 event BẤT KỲ trong cửa
  [btime+33; btime+49,8] = [11:22:14Z; 11:22:30,8Z] (DB tươi kiểm lại: eid
  11596 succeeded 10:45:34.161Z → eid 11597 reconciled 11:35:38.916Z;
  0 event trong cả khoảng; không run nào spanning btime — run 207 xong
  08:39:01Z, run 208 (9cd50793) xong 09:16:08Z, run 209 dispatch
  11:35:51Z). Phân loại CUỐI thuộc T2-201. **(m) #129 ĐÃ XONG ở T2-200**
  (parent (f)-200 CHẤP NHẬN DƯƠNG (CUỐI, +40,934 s, eid 11540, run 207)).
- **Khoảng event 3.004,755 s bao trùm btime #130 — T01 CHỈ BÁO SỐ THÔ,
  KHÔNG gọi là lặng scheduler hay outage (xem F-200-T01-5):** kiểm lại tươi,
  số KHÔNG ĐỔI: eid 11596 (succeeded 10:45:34.161Z) → eid 11597
  (reconciled 11:35:38.916Z); event ID liên tục 11596 → 11597 — 0 event bị
  mất khỏi bảng; btime #130 (11:21:41Z) NẰM TRONG khoảng. Khoảng trước đó:
  eid 11585 (succeeded 09:16:08.660Z) → eid 11586 (reconciled
  10:41:43.389Z) = 5.134,729 s, cũng 0 event, ID liên tục 11585 → 11586.
  Phân loại thuộc T7-201 + parent (n). Sau 11:35:38Z, event chảy bình
  thường trở lại (eid 11598–11624+ đã đọc tươi — reconciled/dispatch/
  succeeded đều đặn, không còn khoảng lặng mới tới lúc survey).
- **Run 209 SUCCEEDED 14:35:13Z** (DB tươi: status succeeded, finished
  1795790113, TRƯỚC hạn cứng 14:35:51Z 38 s; claimed 1795790026 =
  14:33:46Z; boot_gen cron_boot_0eac28bb — CÙNG gen với run 210, không có
  daemon restart nào kể từ #130; kết cục thuộc T7-201). **Run 210 RUNNING
  lúc đọc** (72de8dca, sched 14:35:51Z — chính lượt cron đợt 201; kết cục
  thuộc T7-202). **F-201-T01-5 — run 208 finished_at_utc trong row ĐÃ ĐỔI
  GIÁ TRỊ** (nay = 09:16:08Z, KHỚP event eid 11585 — xem dưới).
- **POSTBOOT_PASS #130 CÓ caveat (b1)** (parent (c)-200; tổng boot không cờ
  GIỮ 31) + **T56-201 xác minh lại 14:48:33Z poll=0 replay-day-du** (cùng
  boot c073c8bb, dpkg 777 dòng, cache 108, lists 75, md5 308b224b không đổi
  so với verify của T56-200 — T01 chỉ ghi nhận file, nội dung thuộc
  T56-201; xem F-201-T01-3). **libevent CÓ lúc survey** (sau repair —
  khác lúc T01-200 survey, boot+17m chưa repair); dpkg.log 777 dòng (đóng
  băng từ 12:01:06Z).
- **Watcher-200 CHẾT theo lịch** (END 14:35:51Z; 0 process watcher lúc
  survey 14:48Z). **Watcher-201 ĐÃ SPAWN** (replay-watch-201.sh pid
  369613, START ~14:48Z, boot c073c8bb, poll 30 s, dpkg 777 md5 308b224b —
  khớp verify T56-200; xem F-201-T01-2 về câu "chưa spawn" trong .done
  T5-201).
- **O8 trên #130 — PASS 21/21 ×2 WebKit + 21/21 Chromium (14:53:25–
  14:56:10Z, 2m45s)**: attempt1 exit=0 14:54:26Z, **21/21 PASS** (S0 PASS
  mẫu tự load 3 clip; S1 PASS "checked=true → false, Playwright mouse
  click lần 2"; JSON 21 results, 21 ok=true, md5 37b2572d); attempt2
  exit=0 14:55:19Z, **21/21 PASS** (S1 PASS y hệt; JSON 21 results, 21
  ok=true, md5 fe58294c); Chromium exit=0 14:56:10Z, **21/21 PASS** (JSON
  21 results, 21 ok=true, md5 bac61a70). Đếm lại từ JSON gốc bằng python.
  **0 lỗi exit 127** trong cả 3 bộ (3 dòng chứa "127" đều là
  http://127.0.0.1 bridge OK). Probe S1 KHÔNG CHẠY (chỉ chạy khi attempt1
  FAIL — attempt1 PASS ngay; script probe đã chuẩn bị sẵn). Script gốc
  KHÔNG đổi so với đợt 200 (webkit 4994b4fc, headed c8acd72e); preview.tsx
  lúc O8 = **477a0eac**; media.ts = **ac89aeb2**; **cả 3 bộ O8 đợt này CÙNG
  CÂY** (477a0eac/ac89aeb2) và cây KHÔNG đổi trong lúc O8 chạy. **Chân FULL
  PASS "O8 3/3 ×2 cùng boot cùng cây" ĐẠT đợt này (3/3 bộ pass, cùng boot
  #130, cùng cây)** — khác đợt 200 (2/3, attempt1 FAIL S1 là flake
  setup/timing, F-200-T01-3); parent quyết (b)-201 có tính chuỗi FULL PASS
  hay không (các chân còn lại thuộc T4/T8 + parent). O8 chạy trong lúc
  T4-201 chỉ poll (poll #3–#5 ghi lock=co t01-round201 — T4 thấy lock nên
  KHÔNG mở attempt; poll #6 14:56:50Z lock=khong sau release rồi mới mở
  cửa yên attempt1 lượt yên #69 — 0 chồng lấn attempt đang chạy; xem
  F-201-T01-1). X11: Xvfb :193 lúc kiểm sau O8 là của T4 attempt1 (mở
  14:56:50Z), không phải sót của T01. Boot lúc O8 xong vẫn c073c8bb.
  Không có reboot mới trong lúc O8 chạy.
- **Cờ các luồng khác lúc T01 đóng (~15:01Z) — 1/11 cờ có nội dung; T5 đã
  stage paths/.done**: T5 DONE (~14:49Z, .done mtime 14:50:05Z — ledger
  KHÔNG ĐỔI, 2 dòng, 5.016 B, md5 81329ce3, mtime 12:01:06Z; không boot
  mới, không repair #131; verify 18/18 PASS). P1/P2/P3/P4/T2/T4/T56/T7/T9
  chưa đóng — đều có thư mục làm việc + file trung gian: T4 đang chạy
  attempt1 lượt yên #69 (cửa yên mở poll #6 14:56:50Z); T56 watcher-201
  đang chạy + POSTBOOT_PASS xác minh lại 14:48:33Z; T9 sampler đang chạy
  (autotrigger-live, b2-spikes.log); P1 có ab201 + scratch; P2 có
  pan-s15-*.rgb/.yuv; P3 có analyze201.py + sim-hold-mute-201.ts; P4 có
  thư mục scratch; T2 có m-check201.py + eperm-sweep201.py; T7 có
  appendix201-part1.txt + appendix201.py. **T8 CHƯA CÓ thư mục làm việc
  (chưa spawn lúc T01 đóng).** T10-201 quyết giao muộn hay rớt đợt. T01
  chỉ trích dẫn trạng thái thư mục, không xác minh nội dung chuyên môn
  của các luồng chưa đóng.

## Đếm — batch của T01 (T10-201 đếm toàn đợt)

- **Batch T01-201: 2 entry / 2 đường dẫn / 1 file mới** (GAP
  `PHASE9_GAP_ANALYSIS.md` — đã có từ đợt 1, không mới; LIMITS
  `docs/PHASE9_ROUND201_T01_BOOT_VERIFY_LIMITS.md` — mới). T01-201
  KHÔNG chạy dedup toàn cục đợt 201 (theo giao (r)-200); mọi số lũy kế /
  chờ push / tổng thuộc T10-201 + parent (q)-201. T01 chỉ stage batch
  của chính mình TRƯỚC khi đóng cờ (cùng tiền lệ đợt 196/197/198/199/
  200). GAP 1.184.470 B — VƯỢT trần push 37.768 B, cần ENABLE_PRIVSEP=0
  lúc push như các đợt trước.

## Giới hạn / sai số ghi nhận (F-201-T01-*)

- **F-201-T01-1 — O8 chạy KHI T4 .done CHƯA CÓ (gate thực chất theo
  (p1)-198 — KHÔNG phải vi phạm).** Lúc O8 bắt đầu (14:53:25Z), T4-201
  CHỈ POLL (poll test #1 14:52:20Z, gate0=T5 PASS; poller chính chưa mở
  attempt lượt yên #69); giữa O8, T4 poll #3 (14:54:34Z) + #4 (14:55:19Z)
  + #5 (14:56:05Z) ghi lock=co t01-round201 pid=381631 port=5560 — T4
  thấy lock nên KHÔNG mở attempt; poll #6 14:56:50Z lock=khong sau
  release rồi mới mở cửa yên attempt1. 0 chồng lấn attempt đang chạy
  trong toàn bộ cửa sổ O8. T01 ghi rõ gate + bằng chứng vào LIMITS ngay
  lúc chạy, đúng điều khoản thay thế của (p1)-198. T8-201 vẫn chờ T4
  .done trước khi chạy harness (quy tắc đứng).
- **F-201-T01-2 — .done T5-201 ghi "Watcher-201 chưa spawn lúc T5 đóng"
  là SAI/stale (nhẹ, ~1 phút).** Watcher-201 (replay-watch-201.sh pid
  369613) START ~14:48Z — poll log đã có dòng 14:49:33Z, TRƯỚC khi T5
  đóng (~14:49Z, .done mtime 14:50:05Z); T5 kiểm ps trước khi process
  kịp hiện / trước dòng poll đầu. Không ảnh hưởng kết luận ledger của
  T5 (ledger không đổi là đúng — T01 kiểm độc lập md5 81329ce3).
- **F-201-T01-3 — POSTBOOT_PASS #130 được T56-201 xác minh lại poll=0
  replay-day-du (14:48:33Z) — KHÁC hồ sơ poll=1 repair-som-quyet-h của
  T56-200 (12:01:06Z).** Đây là xác minh lại trên CÙNG boot c073c8bb
  (dpkg 777 dòng, md5 308b224b không đổi), KHÔNG phải repair mới — T01
  ghi nhận file, KHÔNG tự đổi caveat: parent (c)-200 đã quyết #130 CÓ
  caveat (b1) theo hồ sơ repair; việc T56-201 ghi poll=0 (dạng replay
  đầy đủ như #128) có đổi caveat hay không thuộc T56-201 + parent
  (c)-201. T01 KHÔNG viết cờ thay.
- **F-201-T01-4 — Daemon restart 08:41:43Z/10:41:43Z — KIỂM TIẾP, KHÔNG
  CÓ BẰNG CHỨNG MỚI — quyết (e)-200 GIỮ NGUYÊN.** (a) 08:41:43Z: find
  toàn home trong (08:41:00, 08:41:43) = **0 file** (mở rộng phạm vi so
  với T01-200 chỉ tìm ~/workspace — vẫn 0); band (m) cho boot giả định
  ~08:41Z: implied btime 08:41:01.059Z (offset #127 +42,661 s) /
  08:41:02.786Z (offset #129 +40,934 s) → cửa [08:41:34, 08:41:51Z] chỉ
  chứa ĐÚNG requeue eid 11570 (08:41:43.720Z) — requeue mà btime được suy
  ra từ đó, VÒNG TRÒN, không có requeue độc lập nào khác (events trong
  cửa: 11570 requeue + 11571 dispatched + 11572 reattached + 11573
  reconciled 08:41:54.021Z — ngoài cửa). (b) 10:41:43Z: **0 event
  requeue/reattach nào** trong [10:40:00, 10:43:00Z] (chỉ reconciled eid
  11586 10:41:43.389Z + 2 dispatch + 2 succeeded + reconciled 11591) và
  find toàn home trong (10:41:00, 10:41:43) = **0 file** — 10:41:43Z
  thậm chí không có chữ ký daemon-restart nào trong DB, chỉ là reconciled
  sau khoảng lặng S9. (c) Bằng chứng phụ củng cố: run 209 + run 210 CÙNG
  boot_gen cron_boot_0eac28bb (gen từ #130) — không có daemon restart nào
  kể từ #130 (gen đổi theo mỗi lần daemon restart, F-200-T01-10).
  Kết luận: không có gì lật quyết (e)-200; số hiệu #130 ĐỨNG.
- **F-201-T01-5 — Run 208 (9cd50793): finished_at_utc trong row ĐÃ ĐỔI
  GIÁ TRỊ sau khi T01-200 đọc.** T01-200 ghi tươi lúc ~11:40Z:
  finished 1795768968 = 08:42:48Z, lệch đúng 2.000 s so với event eid
  11585 (09:16:08.660Z). T01-201 đọc lại tươi lúc ~14:50Z: finished
  **1795770968 = 09:16:08Z, KHỚP event từng giây**; claimed 1795770898
  = 09:14:58Z (trước event 70 s) không đổi. Row đã được viết lại/sửa
  trong (11:40Z, 14:50Z) — lúc nào, vì sao, bởi ai thuộc T7-201. T01
  KHÔNG tự sửa DB (chỉ đọc). Hệ quả: bất thường F-200-T01-6 nay KHÔNG
  CÒN trên đĩa — T10-201 + parent lưu ý khi đối chiếu (q)-200.
- **F-201-T01-6 — ĐÍNH CHÍNH §128 ĐÃ LÀM (giao (r)-200 — F-200-T56-6 /
  F-200-T10-13).** T01-201 đã sửa tại chỗ trong GAP §128 + ghi bullet
  "ĐÍNH CHÍNH §128 (T01-201…)" trong §129: tiêu đề ~11:52Z → ~11:54Z
  (round200-t01.done mtime 11:54:04Z); "T10-200 dời sang lượt cron sau"
  → T10-200 đóng sổ trong lượt cron 18:35 +07; "ứng viên #130 — CÓ ĐIỀU
  KIỆN" → "#130 ĐÃ XÁC NHẬN ở (e)-200"; "81 nếu #130 xác nhận" → "81 —
  ĐÃ XÁC MINH"; "POSTBOOT #130 CHƯA CÓ" → "CÓ 12:01:06Z (caveat (b1))";
  "watcher-200 CHƯA SPAWN" → "ĐÃ SPAWN 11:39:46Z pid 7406"; "run 208
  RUNNING lúc đọc" → "run 209 RUNNING lúc đọc" (+ "run 208 thuộc
  T7-200" → "run 209 thuộc T7-201"); "(m) #129/#130 phân loại CUỐI
  thuộc T2-200" → "#129 xong ở T2-200, #130 thuộc T2-201"; "daemon
  restart 08:41:43Z CHƯA GIẢI QUYẾT" → "DAEMON-ONLY RESTART (e)-200";
  "run 9cd50793 finished_at_utc = 08:42:48Z" → đính chính giá trị mới
  09:16:08Z (F-201-T01-5); "P1/P3/P4 + T2/T4/T56/T7/T8/T9 CHƯA ĐÓNG"
  → đã đóng hết trong lượt (12/12 cờ); bullet "Nợ mở đợt 201" cập nhật
  tương ứng (CA #29/#30 đã xong ở (n)-200; OUTAGE #8 + STALL S10).
  Kiểm lại bằng grep sau sửa: 0 chuỗi sai còn trong §128 (trừ trích dẫn
  nhãn cũ có chủ đích trong bullet đính chính §129). LƯU Ý: LIMITS
  T01-200 giữ nguyên nhãn sai (file lịch sử — không viết lại; lỗi đã
  ghi nhận tại F-200-T10-13).
- **F-201-T01-7 — ĐÍNH CHÍNH SỐ MỤC GAP: T01-201 viết §129 cho đợt
  201.** §123 đã có (T10-195 viết cho đợt 195), §124 đã có (T01-196
  viết cho đợt 196), §125 đã có (T01-197 viết cho đợt 197), §126 đã có
  (T01-198 viết cho đợt 198), §127 đã có (T01-199 viết cho đợt 199),
  §128 đã có (T01-200 viết cho đợt 200) — T01-201 viết **§129** (không
  ghi đè, không tạo § trùng; GAP nay 10 mục §120–§129, 2.593 dòng).
  T10-201 + parent lưu ý khi đối chiếu số mục GAP.
- **F-201-T01-8 — T8-201 CHƯA SPAWN lúc T01 đóng (~15:01Z).** Không có
  thư mục `round201-t8/` — T8 là luồng duy nhất chưa có cả thư mục làm
  việc (P1/P2/P3/P4/T2/T4/T56/T7/T9 đều đã có). Harness trên boot #130
  + V5/B1/B2 live của T8-201 chưa bắt đầu; T10-201 theo dõi giao muộn
  hay rớt đợt. T01 không kết luận nguyên nhân (không có bằng chứng trên
  đĩa — chỉ ghi nhận vắng mặt).

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #130 ĐÃ XÁC NHẬN (parent (e)-200); (m) #130 THÔ 0 requeue
  + (m) #129 ĐÃ XONG ở T2-200 (phân loại CUỐI thuộc T2-201 cho #130);
  POSTBOOT_PASS #130 CÓ caveat (b1) (parent (c)-200); marker 81 ĐÃ XÁC
  MINH; watcher-201 ĐÃ SPAWN; run 209 SUCCEEDED 14:35:13Z (kết cục thuộc
  T7-201); run 210 RUNNING (kết cục thuộc T7-202); run 208 finished_at_utc
  đổi giá trị (F-201-T01-5 — T7-201); lượt yên #69 (T4-201: đang attempt1
  lúc T01 đóng — mới mở cửa yên poll #6 14:56:50Z); kết quả sản phẩm
  P1/P2/P3/P4 đợt 201 (chưa luồng nào đóng lúc T01 đóng — T5 đã đóng, xem
  §129).
- CHƯA KIỂM / CHUYỂN ĐỢT 202: (m) #130 (phân loại CUỐI thuộc T2-201);
  khoảng event 3.004,755 s + 5.134,729 s (phân loại thuộc T7-201 + parent
  (n)); kết cục run 209 + run 210 (T7-201/T7-202); run 208 finished_at_utc
  đổi giá trị (T7-201); POSTBOOT_PASS #130 poll=0 xác minh lại + watcher-
  201 theo dõi tiếp (T56-201); T8-201 chưa spawn (F-201-T01-8); T2/T4/T56/
  T7/T9/P1/P2/P3/P4 đợt 201 — KHÔNG có cờ lúc T01 đóng (T10-201 quyết giao
  muộn hay rớt đợt); khung ban ngày 27/11 (15:15:34–17:35:40Z) giao
  T7-202/T7-203 (theo T7-199); OUTAGE #1–#8 VẪN MỞ + STALL S10 (phân loại
  thuộc parent); §128 đã sửa xong (F-201-T01-6).
- (m) #121 + INSIDE + (m) #56 (T2-201).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-201); không kiểm
  lại nguyên nhân khoảng event 3.004,755 s hay trigger của nó; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file
  trực tiếp theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt
  kê; 2 lệnh find có phạm vi trong mục F-201-T01-4 đều là find theo
  mtime hẹp, không phải grep đệ quy nội dung).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round201-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round201-t01/appendix201.py` + `appendix201.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — mọi epoch đã
  kiểm bằng `date -d @epoch` độc lập qua assert trong script)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round201-t01/boot-survey-201t01.sh`
  + `boot-survey-201t01.txt` (output thô 9 nguồn boot #130 — đo tươi
  14:48:24Z; script adapt từ 200; đo Cloudflare chặt theo F-188-T0-9;
  KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round201-t01/o8-driver-201t01.sh` +
  `o8-201t01.log` + `o8-lock.log` + `o8-driver-201t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-201t01.mjs` + `eperm-retry.mjs` (probe SẴN SÀNG — KHÔNG CHẠY
  vì attempt1 PASS, xem trên)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round201-t01/gap129-draft.md`
  (bản nháp GAP §129 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)

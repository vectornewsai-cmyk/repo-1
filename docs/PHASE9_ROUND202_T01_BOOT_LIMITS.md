# PHASE9_ROUND202_T01_BOOT_LIMITS.md

Đợt 202 — T01 (gộp T0+T1: boot survey + O8 + GAP §130).
Mở lượt cron 03:35:51 +07 28/11/2026 (= 20:35:51Z 27/11, run 212); survey đo tươi
20:42:50Z, O8 20:46:27–20:48:49Z, probe S1 chạy lại 20:50:05–20:50:31Z. Chỉ đọc +
ghi file làm việc; không sửa code sản phẩm, không push, không release/tag. Nguồn
đứng: **§14.2 aggregate 201 BẢN PARENT VIẾT TRỰC TIẾP trong lượt handoff 01:12
+07 28/11/2026 (THAY THẾ BẢN GIẢ MẠO CỦA LƯỢT 00:35; aggregate 92.112 B; parent
kiểm đếm KHỚP T10-201 và T10b-201 TỪNG SỐ lần thứ 163 liên tiếp, dedup python +
kiểm chéo shell viết mới `/tmp/qq201.py` + `/tmp/qq201.sh`)**. T01 KHÔNG dùng file
`hidden_files/round201-parent-decisions.md` (GIẢ), không dùng thư mục
`hidden_files/round201-parent/` (GIẢ), không dùng script `/tmp/count-201-parent*`
(GIẢ). **T01 tự viết script mới hoàn toàn đợt này (appendix202.py,
boot-survey-202t01.sh, o8-driver-202t01.sh).**

**BỐI CẢNH: đợt 201 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-201).**
Đợt 202 là đợt thứ mười hai theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn
thiện sản phẩm; Editing Core — parity preview/render). T10-202 do lượt cron
này hoặc lượt sau spawn để đóng sổ; T01 KHÔNG đóng sổ. **T01-202 KHÔNG đếm đợt
202** (theo giao (r)-201 — chỉ survey + GAP + O8; đếm thuộc T10-202).

## Kết quả chính

- **BOOT MỚI #133 (ứng viên) `05bda90d-6988-4925-97f7-71317d569aca`,
  btime 20:32:07Z — XÁC NHẬN 9 nguồn TƯƠI (đo 20:42:50Z)**: boot_id
  05bda90d (khác boot trước 9a30eb2a #132, giống boot_id T9-201 ghi); btime
  1795811527; uptime bracket khớp cùng giây — `uptime -s` 20:32:07Z,
  /proc/stat btime 1795811527, /proc/uptime 642,79 s lúc 20:42:50Z →
  boot_est = btime +0,21 s; /proc/1 start_ticks 1754 = btime +17,54 s, stat
  mtime 20:32:25.120Z = btime +18,12 s; journal idx 0 duy nhất, first
  20:32:25Z = btime +18 s; wtmp begins 20:32:25Z; `last` reboot 20:32 still
  running; `who -b` Nov 27 20:32; Cloudflare đo chặt (local mid 20:42:50Z
  vs CF-Date 20:42:52 GMT, chênh +2 s — đồng hồ local chậm ~2 s, khớp các
  đợt trước; marker mtime không đổi). Uptime lúc survey 10m42,79s. **Gap
  #132→#133 = 12.527 s (3h28m47s)**; gap #131→#132 GIỮ 7.135 s (1h58m55s).
- **#132 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (cùng mẫu #122/#124/
  #125/#127/#128/#129):** journal/wtmp/dpkg chỉ còn boot hiện tại (#133) —
  #132 đã chết 20:32:07Z trước khi đợt 202 mở. KHÁC #122: #132 **ĐÃ ĐƯỢC
  T9-201 bắt trực tiếp** (full boot_id 9a30eb2a-ffb3-4c42-9406-ebdecafdf2a6 +
  btime 17:03:20Z + epoch 1795799000 trong LIMITS T9-201 § + baseline notes
  + aggregate 201 §1) **+ bằng chứng DB độc lập** (requeue eid 11679 ở
  btime+49,208 s + gen đổi 0eac28bb → 874e02c3 — xem dưới) — tồn tại của
  #132 không còn tranh cãi; số hiệu thuộc parent (e)-202.
- **Marker 82 — ĐÃ XÁC MINH ở (e)-201** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B, md5
  cb7102c0cd6ea296759d9a5293159492 (prefix cb7102c0 khớp T01-201). **83 nếu
  #132 xác nhận, 84 nếu cả #132 + #133 xác nhận — parent quyết (e)-202.**
- **(m) #132 THÔ = 1 requeue DƯƠNG trong cửa (số thô, KHÔNG tự phân loại —
  thuộc T2-202 + parent)**: eid 11679 requeued_after_restart 17:04:09.208Z
  = btime+49,208 s; cửa [btime+33; btime+49,8] = [17:03:53Z; 17:04:09,8Z]
  đóng ở +49,8 s — **biên chỉ 0,592 s**; eid 11680 dispatched +49,283 s +
  eid 11681 reattached +49,331 s cũng trong cửa. Khoảng event bao trùm
  btime #132 = 248,968 s (eid 11678 succeeded 17:00:00.240Z → eid 11679
  17:04:09.208Z; ID liên tục; btime #132 nằm trong khoảng). T2-202 phân
  loại CUỐI (lưu ý biên 0,592 s — cửa sổ [btime+33; btime+49,8] là quy ước
  đứng; requeue này là recovery sau reboot #132 theo detail "daemon
  startup recovery" — xem F-202-T7-1).
- **(m) #133 THÔ = 0 event BẤT KỲ trong cửa (số thô, KHÔNG tự phân loại —
  thuộc T2-202 + parent)**: 0 event trong [btime+33; btime+49,8] =
  [20:32:40Z; 20:32:56,8Z] (DB tươi: 0 event trong cả khoảng; không run
  nào spanning btime — run 211 xong 18:04:35Z, run 212 dispatch 20:35:51Z).
- **Khoảng event 8.405,823 s bao trùm btime #133 — T01 CHỈ BÁO SỐ THÔ,
  KHÔNG gọi là lặng/outage (xem F-202-T01-4)**: eid 11700 succeeded
  18:15:34.254Z → eid 11701 reconciled 20:35:40.077Z; event ID liên tục
  11700 → 11701 — 0 event bị mất khỏi bảng; btime #133 (20:32:07Z) NẰM
  TRONG khoảng. Khoảng này NGẮN HƠN OUTAGE #1 (8.406 s) đúng 0,177 s và
  ngắn hơn S8 (8.407 s) 1,177 s. T7-202 đề xuất OUTAGE #9 cho lặng S11 này
  (tổng lặng 27/11 = 24.952 s) — parent (n)-202 quyết. Sau 20:35:40Z,
  event chảy bình thường trở lại (eid 11702–11710 đã đọc tươi —
  reconciled/dispatch/succeeded đều đặn, không còn khoảng lặng mới tới
  lúc survey).
- **Run 210 TIMEOUT 17:39:55Z — kết cục thuộc T7-202 + parent (n)-202**
  (DB tươi: status timeout, finished 1795801195, timed_out=true; sau hạn
  cứng 17:35:51Z 244 s; started 1795799049 = 17:04:09Z — viết lại lần 2
  sau reboot #132, xem F-202-T01-4; gen NAY cron_boot_874e02c3 — ĐỔI so
  với cron_boot_0eac28bb T01-201 đọc ~14:48Z; cf 169 s → CA MỚI #32 theo
  T7-202). **Run 211 SUCCEEDED 18:04:35Z** (finished 1795802675, cf 6 s —
  KHÔNG phải CA theo T7-202; started 1795801195 = 17:39:55Z = đúng lúc
  run 210 timeout xong; gen 874e02c3 — cùng gen sau restart 17:04:09Z).
  **Run 212 RUNNING lúc đọc** (9f038129, sched 20:35:51Z — chính lượt cron
  đợt 202, started đúng giờ 20:35:51Z, gen cron_boot_649ea114 — gen MỚI
  sau reboot #133; kết cục thuộc T7-203). **Run 208 finished_at_utc ỔN
  ĐỊNH 09:16:08Z** (đọc lại tươi 20:44Z — F-201-T10-8 thuộc T2-202).
- **POSTBOOT_PASS #133 CÓ 20:50:33Z (poll=1, repair-som-quyet-h, dpkg 777,
  cache 108, lists 75 — T56-202; caveat thuộc parent (c)-202)** + POSTBOOT
  #131 CÓ không caveat (b2) (parent (c)-201; tổng boot không cờ GIỮ 31) +
  POSTBOOT #132 thuộc T56-202. **libevent CÓ LẠI sau repair** (MISSING lúc
  survey 20:42:50Z — dpkg.log chỉ 2 dòng lúc đó; sau repair 20:50:33Z:
  libevent-2.1.so.7 CÓ, dpkg.log 777 dòng). **Watcher-202 ĐÃ SPAWN**
  (T56-202, repair #133 20:50:33Z — kiểm ps lúc survey 20:42:50Z: 0
  process watcher, TRƯỚC khi T56 repair; watcher-201 CHẾT theo reboot
  #131).
- **O8 trên #133 — WebKit FAIL ×2 + Chromium PASS 21/21 (20:46:27–
  20:48:49Z, 2m22s)**: attempt1 exit=2 20:46:55Z, **FAIL S1** ("không đo
  được rect checkbox tự tạo proxy", mouse) + HARNESS LỖI "page.setInputFiles:
  Target crashed" (waiting locator '.mediabin input[type=file]');
  attempt2 exit=2 20:47:24Z, **FAIL Y HỆT** (S1 + Target crashed); probe
  S1 lần 1 exit=1 (KHÔNG CHẠY — lỗi setup của T01, xem F-202-T01-2);
  **probe S1 chạy lại 20:50:05–20:50:31Z exit=2: "page.goto: WebKit
  encountered an internal error"** (chết ngay lúc navigate, chưa tới S1 —
  renderer chết, KHÔNG phải DOM thiếu checkbox); Chromium exit=0
  20:48:49Z, **21/21 PASS** (JSON 21 results, 21 ok=true, md5 f55a10ef).
  Đếm lại từ JSON gốc bằng python (attempt1/attempt2: 2 results, 1 ok/1
  fail; md5 attempt1 33b48e22, attempt2 8bf7fbdb). **0 lỗi exit 127**
  trong cả 3 bộ (3 dòng chứa "127" đều là http://127.0.0.1 bridge OK).
  Script gốc KHÔNG đổi so với đợt 201 (webkit 4994b4fc, headed c8acd72e);
  preview.tsx lúc O8 = **477a0eac**; media.ts = **ac89aeb2**; **cả 3 bộ O8
  đợt này CÙNG CÂY** (477a0eac/ac89aeb2 — giống O8 đợt 200/201, cây KHÔNG
  đổi trong lúc O8 chạy). **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây"
  KHÔNG ĐẠT đợt này (1/3 bộ pass)** — khác đợt 201 (3/3 PASS) và đợt 200
  (2/3, attempt1 FAIL rồi attempt2 PASS); parent quyết (b)-202 có tính
  chuỗi FULL PASS hay không (chân lượt yên #70 + harness đo trên boot nào
  thuộc T4/T8 + parent). O8 chạy TRƯỚC repair #133 (libevent MISSING,
  dpkg 2 dòng); T56 repair xong 20:50:33Z — SAU khi O8 xong; việc chạy lại
  WebKit sau repair thuộc T8-202 + parent (T01 KHÔNG retry lần 3 — driver
  chỉ định 2 attempt). O8 chạy trong lúc T4-202 chỉ poll (poll #5–#7 ghi
  lock=co t01-round202 — T4 thấy lock nên KHÔNG mở attempt; poll #8
  20:48:59Z lock=khong sau release rồi mới được mở cửa yên — 0 chồng lấn
  attempt đang chạy; xem F-202-T01-3). X11: 0 process Xvfb/vite sót sau
  release (curl 5560/5554 = 000 lúc 21:02Z). Boot lúc O8 xong vẫn 05bda90d.
  Không có reboot mới trong lúc O8 chạy.
- **Cờ các luồng khác lúc T01 đóng (~21:10Z) — 5/12 cờ có nội dung; T7/P2/P3/
  T5 đã stage paths/.done**: T7 DONE (.done mtime 20:50:43Z — run 210
  TIMEOUT cf 169 s → CA #32 đề xuất; lặng S11 8.405,823 s → OUTAGE #9 đề
  xuất; run 211 SUCCEEDED cf 6 s; cửa slot KHÔNG LÀNH; tổng lặng 27/11 =
  24.952 s); P2 DONE (.done mtime 20:59:43Z, LIMITS 16.482 B — nội dung
  thuộc P2-202 + parent); P3 DONE (.done mtime 21:10:54Z, LIMITS 18.364 B
  — nội dung thuộc P3-202 + parent); T5 DONE (.done mtime 21:02:13Z, LIMITS 17.608 B
  — nội dung thuộc T5-202 + parent). P1/P4/T2/T4/T56/T8/T9 chưa đóng —
  đều có thư mục làm việc: T4 đang poll (poll #8 20:48:59Z, gate0 chưa đạt,
  chưa mở attempt lượt yên #70); T56 đã có POSTBOOT_PASS #133 20:50:33Z;
  T9 sampler đang chạy (autotrigger-live, b2-spikes.log); P1 có ab202 +
  harness + scratch; P2 đã đóng (xem trên); P3 đã đóng (xem trên); P4 có thư
  mục scratch; T8 có README.txt + smoke. **T2 CHƯA CÓ thư mục làm việc
  (chưa spawn lúc T01 đóng).** T10-202 quyết giao muộn hay rớt đợt. T01
  chỉ trích dẫn trạng thái thư mục, không xác minh nội dung chuyên môn
  của các luồng chưa đóng.

## Đếm — batch của T01 (T10-202 đếm toàn đợt)

- **Batch T01-202: 2 entry / 2 đường dẫn / 1 file mới** (GAP
  `PHASE9_GAP_ANALYSIS.md` — đã có từ đợt 1, không mới; LIMITS
  `docs/PHASE9_ROUND202_T01_BOOT_LIMITS.md` — mới). T01-202 KHÔNG chạy
  dedup toàn cục đợt 202 (theo giao (r)-201); mọi số lũy kế / chờ push /
  tổng thuộc T10-202 + parent (q)-202. T01 chỉ stage batch của chính mình
  TRƯỚC khi đóng cờ (cùng tiền lệ đợt 196/197/198/199/200/201). GAP
  1.203.193 B — VƯỢT trần push 37.768 B, cần ENABLE_PRIVSEP=0 lúc push như
  các đợt trước.

## Giới hạn / sai số ghi nhận (F-202-T01-*)

- **F-202-T01-1 — SAI SỐ TAY VỀ GIỜ/EPOCH — ĐÃ BẮT BẰNG APPENDIX ASSERT
  (bài học mới, nghiêm trọng).** Lúc đầu T01 tính tay: run 210 started =
  17:03:49Z, requeue (m) #132 ở btime+29,208 s → NGOÀI cửa [btime+33;
  btime+49,8] → (m) #132 THÔ 0. SAI CẢ HAI: epoch 1795799049 = 17:04:09Z
  (không phải 17:03:49Z) và 1795799049.208 − 1795799000 = 49,208 s (không
  phải 29,208 s) → requeue NẰM TRONG cửa, biên 0,592 s → (m) #132 THÔ =
  1 DƯƠNG. Appendix202.py (58 assert, TẤT CẢ PASS) bắt lỗi trước khi ghi
  GAP/LIMITS — không có số sai nào lọt vào file. Bài học: KHÔNG BAO GIỜ
  tin số giờ tính tay từ epoch — chỉ tin phép trừ epoch + assert
  datetime; mọi epoch trong LIMITS này đều đã qua assert.
- **F-202-T01-2 — PROBE S1 LẦN 1 KHÔNG CHẠY (lỗi setup của T01).**
  o8-s1-probe-202t01.mjs import `eperm-retry.mjs` nhưng T01 chỉ copy file
  probe, quên copy `eperm-retry.mjs` từ round201-t01/ → probe exit=1
  ERR_MODULE_NOT_FOUND (20:46:55Z). T01 đã sửa (copy file, md5 7817da4b
  khớp bản 201) và **chạy lại probe 20:50:05–20:50:31Z, exit=2** —
  "page.goto: WebKit encountered an internal error" (renderer chết ngay
  lúc navigate). Kết luận chẩn đoán đứng trên lần chạy lại, không phải
  lần 1. Driver O8 lần sau: copy cả `eperm-retry.mjs` cùng lúc với probe.
- **F-202-T01-3 — O8 WebKit FAIL ×2 Y HỆT TRÊN #133 (TRƯỚC REPAIR).**
  Cùng chữ ký lỗi với F-200-T01-3 (attempt1 đợt 200: S1 rect fail +
  Target crashed) nhưng khác đợt 200 ở chỗ attempt2 đợt này CŨNG FAIL y
  hệt (đợt 200 attempt2 PASS 21/21). Bối cảnh khác: O8 đợt 202 chạy ở
  boot+14m trên boot CHƯA repair (libevent MISSING, dpkg.log 2 dòng,
  chưa có POSTBOOT); O8 đợt 200 chạy ở boot+21m sau khi T56 đã repair
  một phần. Chromium 21/21 trên cùng cây → app/cây không lỗi; lỗi nằm ở
  phía renderer WebKit trên boot chưa repair. T01 KHÔNG kết luận nguyên
  nhân (chưa chứng minh libevent là nguyên nhân — chỉ ghi tương quan
  thời gian); việc chạy lại sau repair thuộc T8-202 + parent. Probe S1
  chạy lại (F-202-T01-2) củng cố "renderer chết" thay vì "DOM thiếu
  checkbox" (chết ngay ở page.goto).
- **F-202-T01-4 — RUN 210 ROW ĐÃ ĐỔI GIÁ TRỊ SAU KHI T01-201 ĐỌC
  (cùng lớp F-201-T01-5; T7-202 ghi F-202-T7-1 — T01 chỉ báo số thô).**
  T01-201 đọc ~14:48Z: run 210 gen cron_boot_0eac28bb, started_at chưa
  viết lại. T01-202 đọc tươi 20:44Z: gen cron_boot_874e02c3, started_at
  1795799049 = 17:04:09Z. T7-202 làm rõ: started_at viết lại ×2
  (1795791915 lúc 15:05:15Z sau reboot #131, rồi 1795799049 lúc 17:04:09Z
  sau reboot #132) + claimed đổi thành 1795801026 (17:37:06Z); cf đúng
  169 s (không phải 11.044 s tính từ claimed cũ). T01 KHÔNG tự sửa DB
  (chỉ đọc). Hệ quả: bất kỳ số nào T01-201 ghi về run 210 (gen, started)
  đều đã cũ — T10-202 + parent dùng số T7-202/T01-202.
- **F-202-T01-5 — RUN 212 BOOT_GEN KHÔNG KHỚP GIỮA T7-202 VÀ T01-202
  (MỚI).** T7-202 LIMITS §2 ghi gen 874e02c3 "vẫn là gen hiện tại của run
  211 + run 212". T01-202 đọc tươi DB 2 lần (20:44Z + 20:52:41Z): run 212
  (9f038129) gen = **cron_boot_649ea114e0ee4d1da2e246ac285bb35d** cả hai
  lần, status running, started = sched = 20:35:51Z. Một trong hai bên
  đọc sai thời điểm / row đổi giá trị giữa các lần đọc (cùng lớp
  F-201-T10-8). T01 báo cả hai giá trị + thời gian đọc; phân loại thuộc
  T7-203 + parent. Giá trị 649ea114 khớp logic (gen mới sau reboot #133
  20:32:07Z; run 212 dispatch 20:35:51Z, sau reboot).
- **F-202-T01-6 — ĐÍNH CHÍNH SỐ MỤC GAP + SỰ CỐ CHÈN SAI CHỖ (T01-202
  tự báo).** (a) T01-202 viết **§130** cho đợt 202 (§123 đã có — T10-195
  viết cho đợt 195; §124 đã có — T01-196 viết cho đợt 196; §125 đã có —
  T01-197 viết cho đợt 197; §126 đã có — T01-198 viết cho đợt 198; §127
  đã có — T01-199 viết cho đợt 199; §128 đã có — T01-200 viết cho đợt
  200; §129 đã có — T01-201 viết cho đợt 201; không ghi đè, không tạo §
  trùng; GAP nay 11 mục §120–§130, 2.614 dòng (2.612 trước khi bổ sung bullet #134 vào §130)). (b) **SỰ CỐ:** edit chèn
  bullet "Sản phẩm/Nền đợt 202" dùng anchor KHÔNG duy nhất ("chỉ stage
  batch T01: GAP + LIMITS, 2 entry..." — xuất hiện 4 lần trong GAP) nên
  tool chèn vào §127 thay vì §130 (dòng 2562/2564). T01 phát hiện ngay
  bằng grep, **gỡ chính xác 2.318 ký tự bằng python span-deletion có
  assert** (marker đầu/cuối duy nhất, kiểm tra văn bản trước/sau span,
  kiểm 0 chuỗi "đợt 202" còn trong §127) — §127 khôi phục đúng từng byte
  (9 bullet, "Sản phẩm đợt 199" trở lại đúng vị trí), rồi chèn lại đúng
  chỗ §130 bằng anchor duy nhất ("watcher-202 ĐÃ SPAWN", 1 match).
  Kiểm cuối: §130 đủ 8 bullet; §127 đủ 9 bullet; "Sản phẩm/Nền đợt 202"
  chỉ ở dòng 2599/2601 (trong §130); GAP 2.614 dòng, 1.203.193 B (2.612 dòng / 1.201.880 B trước khi bổ sung bullet #134; 1.203.084 B trước khi cập nhật P3). Bài
  học: anchor cho muse.edit PHẢI grep kiểm duy nhất TRƯỚC khi sửa —
  T01-201 không gặp vì anchor của đợt 201 là duy nhất; đợt này T01 đã
  chủ quan ở 1 edit.
- **F-202-T01-7 — ĐÍNH CHÍNH §129 ĐÃ LÀM (giao (r)-201 — phán (q)(i)/
  (ii) của parent ở §14.2-201).** T01-202 đã sửa tại chỗ trong GAP §129
  + ghi bullet "ĐÍNH CHÍNH §129 (T01-202…)" trong §129: (1) tiêu đề
  "T10-201 dời sang lượt cron sau" là **ĐÚNG** theo (q)(i)-201 — điểm 1
  §12 của T10-201 SAI; tiêu đề GIỮ NGUYÊN. (2) **GAP first-seen = đợt
  59** theo (q)(ii)-201 (không phải đợt 100 như (q)-200) — GAP không có
  dòng nào ghi first-seen = 100 nên không có chữ nào để sửa tại chỗ, ghi
  nhận trong bullet đính chính. (3)–(11) các điểm stale khác: "Không có
  boot #131" → #131 XÁC NHẬN + #132 ỨNG VIÊN; marker 81 → 81 → 82;
  POSTBOOT #131 CÓ (b2); watcher-201 CHẾT theo #131; (m) #130 KHÔNG CÓ
  ĐIỂM (CUỐI); run 210 TIMEOUT → CA #32; cả 12 luồng đã đóng (12/12 cờ);
  verdict CHẤP NHẬN CÓ ĐIỀU KIỆN; nợ mở cập nhật (run 209 xong, run 210
  TIMEOUT, POSTBOOT #131 CÓ, lượt yên #69 HỢP LỆ); run 208 finished_at
  ỔN ĐỊNH 09:16:08Z. Kiểm lại bằng grep sau sửa: 0 chuỗi sai còn trong
  §129 (trừ trích dẫn nhãn cũ có chủ đích trong chính bullet đính chính
  này). LƯU Ý: LIMITS T01-201 giữ nguyên nhãn sai (file lịch sử — không
  viết lại; lỗi đã ghi nhận tại F-201-T56-5/F-201-T9-2).

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #131 ĐÃ XÁC NHẬN + #132 ỨNG VIÊN (parent (e)-201); (m)
  #130 KHÔNG CÓ ĐIỂM (CUỐI) (parent (f)-201); POSTBOOT #131 CÓ không
  caveat (b2) (parent (c)-201); marker 82 ĐÃ XÁC MINH; run 210 TIMEOUT cf
  169 s → CA #32 (T7-202 đề xuất, parent (n)-202 quyết); run 211
  SUCCEEDED cf 6 s (T7-202); lặng S11 8.405,823 s → OUTAGE #9 (T7-202 đề
  xuất, parent (n)-202 quyết); cửa slot KHÔNG LÀNH (T7-202); lượt yên #69
  HỢP LỆ (parent (m)-201); verdict đợt 201 CHẤP NHẬN CÓ ĐIỀU KIỆN (parent
  (a)-201); POSTBOOT #133 CÓ 20:50:33Z (T56-202, caveat thuộc parent
  (c)-202); watcher-202 ĐÃ SPAWN (T56-202); run 212 RUNNING (kết cục thuộc
  T7-203); kết quả sản phẩm P2 đợt 202 (P2 đã đóng — nội dung thuộc P2-202
  + parent); ledger fold/reseed (T5 đã đóng — nội dung thuộc T5-202 +
  parent).
- CHƯA KIỂM / CHUYỂN ĐỢT 203: (m) #132 + (m) #133 (phân loại CUỐI thuộc
  T2-202 + parent (e)/(f)-202); số hiệu #132/#133 + marker 82/83/84
  (parent (e)-202); khoảng event 8.405,823 s + 248,968 s (phân loại thuộc
  T7-202 + parent (n)-202); kết cục run 210 + run 211 (T7-202 + parent
  (n)-202); kết cục run 212 (T7-203); run 208 finished_at_utc đổi giá trị
  (T2-202, F-201-T10-8); run 212 boot_gen không khớp (T7-203 + parent,
  F-202-T01-5); POSTBOOT #132 + watcher-202 theo dõi tiếp (T56-202);
  POSTBOOT #133 caveat (parent (c)-202); lượt yên #70 (T4-202 đang poll
  lúc T01 đóng); O8 WebKit chạy lại sau repair #133 (T8-202 + parent);
  T2-202 chưa spawn (F-202-T01-8 dưới); P1/P3/P4/T4/T56/T8/T9 đợt 202 —
  KHÔNG có cờ lúc T01 đóng (T10-202 quyết giao muộn hay rớt đợt);
  OUTAGE #1–#8 VẪN MỞ + STALL S10 (phân loại thuộc parent); §129 đã sửa
  xong (F-202-T01-7).
- (m) #131 + (m) #56 (T2-202 — (m) #131 phân loại CUỐI; (m) #56 lần 44).
- Không kiểm lại dải FULL125–FULL175; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-202); không kiểm
  lại nguyên nhân khoảng event 8.405,823 s hay trigger của nó; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file
  trực tiếp theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt
  kê; 0 lệnh find toàn cây đợt này).
- **F-202-T01-8 — T2-202 CHƯA SPAWN lúc T01 đóng (~21:10Z).** Không có
  thư mục `round202-t2/` — T2 là luồng duy nhất chưa có cả thư mục làm
  việc (P1/P2/P3/P4/T4/T5/T56/T7/T8/T9 đều đã có). Phân loại CUỐI (m)
  #131 + (m) #132 + (m) #133 + B-#130 + (m) #56 lần 44 + làm rõ run 208
  finished_at_utc đổi giá trị (F-201-T10-8) chưa bắt đầu; T10-202 theo
  dõi giao muộn hay rớt đợt. T01 không kết luận nguyên nhân (không có
  bằng chứng trên đĩa — chỉ ghi nhận vắng mặt).

## Bổ sung: boot #134 — reboot trong lúc T01 đóng cờ (ghi sau .done lần đầu 21:08:49Z)

- **BOOT MỚI #134 (ứng viên) `bd22dffd-4949-4ac2-8e57-a6d3fb2868e2`,
  btime 21:05:15Z — XÁC NHẬN 9 nguồn TƯƠI (đo 21:10:07Z, SAU khi T01 viết
  .done lần đầu 21:08:49Z):** boot_id bd22dffd (khác 05bda90d #133);
  btime 1795813515; `uptime -s` 21:05:15Z; /proc/stat btime 1795813515;
  /proc/uptime 292,02 s lúc 21:10:07Z → boot_est = btime −0,02 s; /proc/1
  start_ticks 1273 = btime +12,73 s, stat mtime 21:05:28.062Z = btime
  +13,06 s; journal idx 0 duy nhất, first 21:05:28Z = btime +13 s; wtmp
  begins 21:05:28Z; `last` reboot 21:05 still running; `who -b` Nov 27
  21:05; Cloudflare đo chặt (local mid 21:10:07Z vs CF-Date 21:10:09 GMT,
  chênh +2 s — khớp các đợt trước; marker mtime/md5 không đổi). Uptime
  lúc survey 4m52,02s. **Gap #133→#134 = 1.988 s (33m08s).** Boot #133
  (05bda90d) chết trong (21:02:48Z, 21:05:15Z] — lần kiểm cuối còn #133 là
  21:02:48Z (curl 5560/5554 = 000, boot 05bda90d); T01 phát hiện #134 lúc
  kiểm chứng cuối 21:09:36Z. **Mọi survey/O8/GAP §130 bản chính trong
  LIMITS này đều đo trên #133 — VẪN ĐÚNG (làm trước reboot); chỉ khẳng
  định "boot hiện tại" sau 21:05:15Z là #134, không phải #133.**
  libevent MISSING lại + dpkg.log 2 dòng (boot mới, chưa repair — T56-203
  repair). Marker: 82 ĐÃ XÁC MINH; **85 nếu #132+#133+#134 đều xác nhận
  — parent quyết (e)-202/-203.**
- **(m) #134 THÔ = 1 requeue DƯƠNG trong cửa (số thô, KHÔNG tự phân
  loại — thuộc T2-203 + parent):** eid 11717 requeued_after_restart
  21:06:02.360Z = btime+47,360 s; cửa [btime+33; btime+49,8] đóng ở +49,8
  s — biên 2,44 s; eid 11718 dispatched +47,462 s + eid 11719 reattached
  +47,513 s cũng trong cửa. Khoảng event bao trùm btime #134 = 361,706 s
  (eid 11716 succeeded 21:00:00.654Z → eid 11717 21:06:02.360Z; btime
  #134 nằm trong khoảng).
- **Run 212 row viết lại LẦN NỮA sau reboot #134 (số thô — thuộc T7-203):**
  status STILL running, finished null; started_at 1795811751 (20:35:51Z)
  → **1795813562 = 21:06:02Z** (+1.811 s); gen cron_boot_649ea114 →
  **cron_boot_da522066853241e8b4a8aa5f3a5995e7**. T01 đã đọc gen run 212 3
  lần có giờ: 649ea114 (20:44Z + 20:52Z) → da522066 (~21:11Z); claim
  874e02c3 của T7-202 không khớp lần đọc nào — F-202-T01-5 ĐỨNG. Kết cục
  run 212 thuộc T7-203. **Mọi process đợt 202 (T4 poller, T8/T9 sampler,
  watcher-202) chết theo reboot #134** — T10-202 + parent ghi nhận khi
  quyết giao muộn/rớt đợt; lượt yên #70 + harness T8-202 chạy lại trên
  #134 (sau repair) hay giữ kết quả trên #133 thuộc T4/T8 + parent.
- **F-202-T01-9 — REBOOT #134 TRONG LÚC ĐÓNG CỜ (bài học).** T01 viết
  .done lần đầu 21:08:49Z (trên boot #133 — reboot 21:05:15Z xảy ra
  TRƯỚC đó 3m34s nhưng T01 chưa kiểm boot lại sau khi viết LIMITS).
  Kiểm chứng cuối (21:09:36Z) phát hiện boot đã đổi → T01 bổ sung mục
  này + survey #134 + cập nhật .done, thay vì để LIMITS stale như
  F-201-T56-5 (T01-201). Bài học: **kiểm lại boot_id NGAY TRƯỚC khi
  viết .done, và kiểm lại một lần nữa sau khi viết .done trước khi báo
  cáo** — reboot có thể xảy ra bất cứ lúc nào trong lượt (3 reboot trong
  đợt 202 tính tới lúc này: #132 17:03:20Z, #133 20:32:07Z, #134
  21:05:15Z).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round202-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round202-t01/appendix202.py` + `appendix202.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — mọi epoch đã
  kiểm bằng `datetime` độc lập qua assert trong script; 58/58 assert PASS)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round202-t01/boot-survey-202t01.sh`
  + `boot-survey-202t01.txt` (output thô 9 nguồn boot #133 — đo tươi
  20:42:50Z; script adapt từ 201; đo Cloudflare chặt theo F-188-T0-9;
  KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round202-t01/o8-driver-202t01.sh` +
  `o8-202t01.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` +
  `o8-probe/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-202t01.mjs` + `eperm-retry.mjs` (probe chạy lại sau khi sửa
  setup — xem F-202-T01-2) + `o8-probe-202t01.log`
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round202-t01/gap130-draft.md`
  (bản nháp GAP §129-đính-chính + §130 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)

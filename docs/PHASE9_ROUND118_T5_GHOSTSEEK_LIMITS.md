# PHASE9_ROUND118_T5_GHOSTSEEK_LIMITS — Ghost stale sau seek: H-D ĐƯỢC ỦNG HỘ (0/40 yên mới, gộp 0/60 vs 5/40, p=0,0087; tổng 100 seek)

> Luồng T5, đợt 118, lượt cron 18:35 +07 15/11/2026 (làm việc 11:38–13:0xZ 15/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — chỉ
> CHẨN ĐOÁN. F6' ĐÃ ĐÓNG (L7) — T5 không đóng lại, không mở lại.

## 0. Kết quả chính (5 ý)

1. **2 lượt yên sạch thành công, 40 seek mới, 0 stale — MỤC TIÊU ≥80
   SEEK ĐẠT VÀ VƯỢT (tổng 100).** Attempt2 (boot #54, 12:47–12:48Z)
   0/20 + attempt3 (boot #55, 12:56–12:57Z) 0/20. Gộp: yên 0/60
   vs nhiễm 5/40, Fisher một phía **p=0,0087** (< 0,01). Theo quy
   tắc prereg §4: **H-D (tải là điều kiện cần cho seek-stale)
   ĐƯỢC ỦNG HỘ có ý nghĩa thống kê.** Nợ #6 đợt 117 (lượt yên thứ
   hai phân biệt H-D) ĐÓNG — không phải bằng 1 lượt yên mà bằng 2.
2. **P4-type tái hiện 2 lần nữa, CẢ 2 LẦN TRÊN LƯỢT YÊN** (mỗi lượt
   1 event rõ): attempt2 M=35, lag max +11f (pass 12, seq 308–311,
   225 ms); attempt3 M=28, lag max +9f (pass 18, seq 418–420,
   197 ms). Tally mới: **6 rõ + 1 nhỏ / 6 lượt** (P4 1 + Q5 0 + R6
   2 rõ + 1 nhỏ + S6att1 0 + T5 2 rõ). Frame đóng băng lần lượt
   **31 → 35 → 28: KHÁC NHAU** — giả thuyết "cùng pha pass +
   run-ahead" (R6 §4.4) BỊ YẾU thêm. **Dissociation mới:** P4-type
   xảy ra cả trên lượt yên (R6 + T5 ×2), còn seek-stale thì KHÔNG
   (0/60 yên) — hai hiện tượng tách nhau về điều kiện tải.
3. **Reboot #55 (12:51:56Z, boot_id `52d799d4…`, gap #54→#55 ≈
   2h04') rơi GIỮA attempt2 và attempt3.** Giết T4 attempt7 giữa
   chừng (partial JSON 12/20 pass — KHÔNG phải dữ liệu T5, T5
   không dùng). Postboot #55 PASS NGAY lúc 12:55Z (tự kiểm exit 0:
   đủ 269 plugin GST + 11 package) — khác hẳn #53 đình trệ và #54
   tới muộn 47'; package đã có sẵn trên overlay sau replay #54.
   Lock T4 sót lại là STALE (boot #54, pid chết) — acquire của T5
   tự xóa theo đúng luật `lock_is_stale` của lock v2 (ghi trong
   chain log attempt3).
4. **Attempt1 hoãn gate A (exit 5, 30 poll không mở):** T3 s79
   56 hog + T2 giữ lock; load1 thấp nhất 0,24 nhưng load5 không
   dưới 7,09; RAM có lúc 530 MB. Đúng luật prereg (không đo ở tải
   thấp nhất), không dữ liệu.
5. **Hồi quy sạch + lock script đổi giữa đợt.** tsc exit 0,
   ghostBlend 15/15 PASS, preview.tsx md5 `03bf029f` không đổi
   suốt lượt. Lock script md5 đổi `8b02ddc8…` (11:39Z) →
   `5cac10af…` (12:47Z, T1 đổi spec sang v2 theo quyết parent §13
   mục 4); attempt2/3 dùng cùng bản `5cac10af` trước = sau mỗi
   lượt — đo nhất quán nội bộ, ghi rõ để khỏi hiểu lầm.

## 1. Môi trường + cây đo + prereg

- **Cây đo `03bf029f…`** (= cây Q5/R6/S6/T6). preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b` kiểm trước khi làm, trước/sau
  attempt2, trước/sau attempt3, và sau hồi quy (13:0xZ) —
  KHÔNG ĐỔI lần nào. T5 không sửa production.
- **Chốt chặn:** file `round-in-progress.md` KHÔNG TỒN TẠI lúc T5
  bắt đầu (đợt 117 đã đóng bởi parent, chốt chặn đã xóa; lượt cron
  18:35 +07 15/11 mở đợt 118 với 10 luồng T1–T10; T5 là luồng
  ghost-seek). Chưa có cờ `round118-tree` trong cả lượt — driver
  kiểm md5 trực tiếp trước mỗi lượt (ghi rõ trong poll log).
- **Boot trong lượt:** #54 (`48a82db1…`, 10:48:26Z) lúc bắt đầu;
  **reboot #55** lúc 12:51:56Z (boot_id `52d799d4…`). Mù chứa #55
  thuộc T7; T5 chỉ ghi nhận thời gian/boot_id tại đây, không đụng
  bookkeeping mù.
- **Replay/postboot:** #54 kẹp được (47'14", 52'30"], xong
  11:40:56Z, 1509 dòng dpkg; cờ `POSTBOOT_PASS` của T7 lúc
  11:41:29Z (exit 0) + T5 tự kiểm exit 0 lúc 11:44Z. #55: postboot
  T5 tự kiểm exit 0 lúc 12:55Z (boot mới 3 phút tuổi — package đã
  sẵn); T7 chưa viết cờ #55 lúc đó; prereg §2.1 cho phép chạy khi
  tự kiểm PASS + gate0 trong driver kiểm lại độc lập (gate0
  attempt3: postboot exit 0 + apt_procs=0, log
  `postboot-t5-attempt3-gate0.log`).
- **Prereg:** `hidden_files/round118-t5/prereg-t5.md` (viết TRƯỚC
  khi đo; không sửa sau khi thấy số). Bar quyết định xem prereg §4
  (không đổi sau khi thấy số).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb. Env launch GST như M5/L7/N4/P4/Q5/R6/S6/T6.
- **Lock v2:** `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600` explicit, v2-only (KHÔNG dùng v1).
  Attempt2: ticket `1-1794746846322446158-75659-t5`, chờ 0 s, giữ
  84 s, nhả sạch. Attempt3: ticket
  `1-1794747392862637263-6880-t5`, chờ 0 s, giữ 81 s, nhả sạch;
  acquire tự xóa lock stale của T4 (xem §2.3). Attempt1 không giữ
  lock lần nào (chết ở gate A).

## 2. Các lần chạy

### 2.1 Attempt1 (11:44–12:14Z, boot #54) — HOÃN gate A, exit 5

- T4-wait: **dương tính giả** — glob `*.json` match `b.json` của
  T4 nên chờ 0 phút (ghi rõ trong poll log; đã SỬA glob thành
  `preview-*.json` trước attempt2 — xem §2.4). Cờ cây: chưa có —
  md5 trực tiếp `03bf029f`; gate0 try 1 PASS (postboot 0,
  apt_procs 0).
- Gate A 30 poll KHÔNG MỞ: poll 1 load1 36,87 / load5 17,71
  (lock t3-round118, blockers 6, RAM 1651 MB) → poll 9 load1
  31,53 / load5 19,14 (lock t3, blockers 10, RAM 1022 MB) →
  poll 18 load1 25,95 / load5 18,60 (lock t3, blockers 9, RAM
  1157 MB) → poll 27 load1 27,68 / load5 29,60 (lock t2, blockers
  4, RAM 530 MB). Thấp nhất: load1 0,24 nhưng **load5 không dưới
  7,09 lần nào**; RAM kẹt 530–1157 MB. T3 chạy s79 dial [25,40]
  với 56 hog `node -e while(true)`; T2 giữ lock xen kẽ.
- Exit 5 đúng luật (prereg §3: không chạy ở tải thấp nhất). Không
  giữ lock, không chạy vite/probe, không dữ liệu.

### 2.2 Attempt2 (12:47–12:48Z, boot #54) — LƯỢT YÊN SẠCH, 0/20 STALE

| | Giá trị |
|---|---|
| Bắt đầu / kết thúc (UTC) | 12:47:26Z / 12:48:48Z (probe_exit=0) |
| T4-wait | T4 chưa có preview JSON, dir active → chờ đủ 15 phút rồi tự chạy (t4_done=0) |
| Cờ cây | Chưa có `round118-tree` — md5 trực tiếp = `03bf029f` ✓ |
| Gate 0 | try 1 PASS (postboot exit 0, apt_procs 0) |
| Gate A lúc bắt đầu | poll 17 MỞ: load1 0,70 / load5 1,74, không lock, blockers 0, webkit 0, RAM 1119 MB (poll 16 trước đó: load5 2,01 — suýt soát) |
| Vite | :5188, config tạm `watch.ignored: ["**/**"]` (0 watch), up sau 3 s |
| Probe | 20 pass, `--disable-rvfc`, flip sau pass 5; ~82 s; lock giữ 84 s |
| JSON | `preview-b-f3-flip-webkit-t5-attempt2.json` (3.246.166 B, mode=measure, passes=20, webkit 27.2, pageErrs=[]) |
| Lớp B | load-mid (20 s/lần): load1 0,36–0,70, load5 1,52–1,74; cuối load 1,35/1,62; **RAM 1060 → 888 MB giữa lượt** (dip dưới 1024, hồi 1442 MB cuối — caveat, xem dưới); không reboot trong lượt; lock chỉ T5 giữ; ps trước/sau: không foreign probe; không file round118-* nào khác đổi sau marker (chỉ T8 đã xong trước đó) |
| Kết thúc | vite kill pid 75765, ps sạch, curl :5188 = 000, lock nhả sạch |

- **Caveat RAM giữa lượt:** RAM khả dụng rơi 1060 → 888 MB trong
  lúc probe chạy (WebKit + vite ngốn RAM), hồi lên 1442 MB ngay
  sau khi probe thoát (browser đóng). Gate A đầu lượt 1119 MB
  (≥1024 ✓). Prereg §3 không đặt sàn RAM giữa lượt cho lớp B
  (chỉ load5 cuối ≤2,5, load1 không vượt 4, không reboot, lock
  chỉ T5) — lượt vẫn đạt lớp B, nhưng ghi rõ dip RAM để đợt sau
  đối chiếu (S6 attempt4/5 cũng kẹt RAM ngoài cell ~510 MB).
- **Kết quả đo (analyzer `analyze-t5-ghostseek.py`, copy T6):**
  20 snapshot label-0 phân biệt, **0 STALE (M=0 tất cả) → 0/20**;
  flip wallMs=26772, blendTick 522 (371 post-flip+2000ms,
  viaRvfc=0). P4-type: **1 event rõ, 6 occ, M=[35], label
  [24, 26, 29], tBlend 47381–47606 (225 ms), presented 26→34,
  pass=12, lag max +11f, skp=0** (lag5 analyzer xác nhận y hệt).
  T4 lấy lock ngay sau T5 nhả (12:48:50Z).

### 2.3 Reboot #55 (12:51:56Z) — GIỮA attempt2 VÀ attempt3

- **Reboot #55 lúc 12:51:56Z** (boot_id `52d799d4…`, sau #54
  10:48:26Z; gap #54→#55 ≈ 2h04'). Runtime restart đi kèm.
- **T4 attempt7 chết theo reboot giữa chừng:** partial JSON 12/20
  pass (`passesDone=12`, `partial=true`, mtime 12:52:25Z — T4
  tự quyết dùng hay bỏ; T5 không đụng, không dùng làm dữ liệu).
- **Lock T4 sót lại là STALE:** owner thread=t4, pid 76972 (chết),
  port 5187 (curl 000), boot `48a82db1` (#54) ≠ boot hiện tại.
  Acquire của T5 ở attempt3 tự xóa theo đúng luật
  `lock_is_stale` ("stale: owner pid 76972 chết + không vite trên
  cổng 5187 + curl 000 + boot đổi (tuổi 314s) — XÓA lock stale và
  thử lại", chain log attempt3).
- **Gate A của T5 cũng đã sửa** (trước attempt3, driver không
  chạy): coi lock stale-boot (đủ 4 điều kiện như `lock_is_stale`:
  pid chết + không vite trên cổng owner + curl 000 + boot đổi)
  là "không lock" — nếu không, dir stale sẽ chặn gate A mãi mãi
  dù holder đã chết theo reboot. Không tự xóa dir lock; việc xóa
  do acquire của lock script làm theo luật của nó. Ghi rõ để T10
  và các driver khác đối chiếu (đề xuất §10.5).
- Postboot #55 PASS ngay (xem §1). Không mất dữ liệu đo nào của
  T5 (attempt2 đã xong trước reboot).

### 2.4 Attempt3 (12:56–12:57Z, boot #55) — LƯỢT YÊN SẠCH, 0/20 STALE

| | Giá trị |
|---|---|
| Bắt đầu / kết thúc (UTC) | 12:56:32Z / 12:57:52Z (probe_exit=0) |
| T4-wait | T4 đã có preview JSON (attempt7, dù partial) → chờ 0 phút, chạy ngay (t4_done=1) |
| Cờ cây | Chưa có `round118-tree` — md5 trực tiếp = `03bf029f` ✓ |
| Gate 0 | try 1 PASS (postboot exit 0, apt_procs 0, boot #55) |
| Gate A lúc bắt đầu | poll 1 MỞ: load1 0,93 / load5 1,14, lock=stale-boot (đã xử lý §2.3), blockers 0, webkit 0, RAM 1488 MB |
| Vite | :5188, config tạm như attempt2, up sau 3 s |
| Probe | 20 pass, `--disable-rvfc`, flip sau pass 5; ~80 s; lock giữ 81 s |
| JSON | `preview-b-f3-flip-webkit-t5-attempt3.json` (3.192.371 B, mode=measure, passes=20, webkit 27.2, pageErrs=[]) |
| Lớp B | load-mid: load1 0,93–2,91, load5 1,14–1,74; cuối load 3,56/1,98 (load1 <4 ✓, load5 ≤2,5 ✓); RAM 1516 → 1100 MB; không reboot trong lượt; lock chỉ T5 giữ (sau khi xóa stale của T4); ps trước/sau: không foreign probe; không file round118-* nào khác đổi sau marker |
| Kết thúc | vite kill pid 7058, ps sạch, curl :5188 = 000, lock nhả sạch |

- **Caveat load1 giữa lượt:** load1 tăng 0,93 → 2,83–2,91 giữa
  lượt (có luồng khác khởi động lại sau reboot #55 — ps-after
  không thấy foreign probe/vite nào, chỉ process của chính T5 +
  hoạt động hệ thống sau boot). load5 giữ ≤1,98 cả lượt; không
  hog nào chạy. Lượt vẫn đạt lớp B theo prereg §3, ghi rõ để đối
  chiếu.
- **Kết quả đo:** 20 snapshot label-0 phân biệt, **0 STALE →
  0/20**; flip wallMs=24811, blendTick 483 (339 post-flip+2000ms,
  viaRvfc=0). P4-type: **1 event rõ, 4 occ, M=[28], label [19,
  22], tBlend 64482–64679 (197 ms), presented 22→27, pass=18, lag
  max +9f, skp=0** (lag5 analyzer xác nhận y hệt).

## 3. Tổng gộp — H-D ĐƯỢC ỦNG HỘ (p=0,0087)

Quy ước mẫu số như T6/parent (số pass = 20/lượt; S6att1 có 19
snapshot label-0 phân biệt trên 20 pass — xem chú thích dưới bảng).

| | Q5 | R6 | S6att1 | T5att2 | T5att3 | Gộp |
|---|---|---|---|---|---|---|
| Seek (pass) | 20 | 20 | 20 | 20 | 20 | **100** |
| Snapshot label-0 phân biệt | 20 | 20 | 19 | 20 | 20 | **99** |
| Stale (M≠0) | 1 | 0 | 4 | **0** | **0** | **5** |
| Tỉ lệ (theo pass) | 5,0% | 0,0% | 20,0% | 0,0% | 0,0% | **5,0%** |
| Điều kiện | nhiễm | yên | nhiễm | **yên** | **yên** | nhiễm 5/40 (12,5%) vs yên 0/60 (0%) |

- Fisher một phía (nhiễm vs yên, theo pass): **p=0,0087** —
  tính bằng script riêng `fisher-t5.py` (copy T6, đã xác thực:
  cho đúng 0,1205 với số cũ 5/40 vs 0/20, khớp số parent tính
  tay đợt 116; 0/40 vs 5/40 → 0,0274). CI 95% Clopper-Pearson:
  gộp 5/100 [1,6%–11,3%]; nhiễm 5/40 [4,2%–26,8%]; yên 0/60
  [0%–6,0%].
- Theo quy tắc prereg §4: nhánh "tổng ≥80 seek, 0 stale mới trên
  lượt yên" kích hoạt — và vượt xa (100 seek, 2 lượt yên mới):
  **H-D ĐƯỢC ỦNG HỘ (tải là điều kiện cần cho seek-stale, ở mức
  bằng chứng hiện có)**. Ghi rõ: 0/60 yên không chứng minh tỉ lệ
  yên = 0 (CI 95% 0%–6,0%); nếu tỉ lệ nền thật là 5% thì
  P(0/20 | n=20) ≈ 36% mỗi lượt — nhưng 0/60 liên tiếp mới là
  bằng chứng mạnh (P(0/60 | 5%) ≈ 4,6%).
- **Chú thích đính chính bảng T6 §3:** T6 ghi "Gộp 60" trong khi
  cột snapshot cộng lại là 20+20+19 = 59. T5 giữ nguyên số Fisher
  của T6 (tính theo pass: 5/40 vs 0/20 → p=0,1205, không bị ảnh
  hưởng) và trình bày cả hai mẫu số ở bảng trên (pass 100,
  snapshot 99) để khỏi lặp lại mâu thuẫn. Theo snapshot: stale
  5/99 = 5,1%.

## 4. Đánh giá lại 4 giả thuyết (có dữ liệu mới — verdict đổi ở H-D)

| Giả thuyết | Verdict sau lượt này | Căn cứ |
|---|---|---|
| **H-A** — Seek reset label nhưng pixels ghost sót từ pass trước | **Được ủng hộ về bản chất, nhưng gắn với điều kiện tải; mô hình delta CHƯA CHỐT** | 5 quan sát đều trên lượt nhiễm; 0/60 trên lượt yên. Không có occ mới nên không đo được delta M − lastDrawn. |
| **H-B** — Liên quan fix E4 steady-close | **Không đổi: BỊ YẾU, tụt hẳn ưu tiên** | Không có occ mới. |
| **H-C** — Seek chưa vẽ lại ghost | **Không đổi: dạng seek BỊ YẾU thêm** | 0/60 yên; capture mới sau seek vẫn M=0 trên lượt yên. |
| **H-D** — Sự kiện đơn lẻ do lượt nhiễm tải (cho SEEK) | **ĐỔI: ĐƯỢC ỦNG HỘ (p=0,0087)** | Yên gộp 0/60 vs nhiễm 5/40 trên 5 lượt độc lập (Q5, R6, S6att1, T5 ×2). Không còn là "chưa phân biệt được". |

**Ưu tiên sửa:** giữ CAO — event seek stale đã tái hiện 5 lần
(đều trong lượt nhiễm) và H-D đã được ủng hộ: hướng sửa ứng viên
không đổi (gán nhãn snapshot theo frame thực sự được yield, hoặc
loại/đánh dấu snapshot khi frame yield lệch `currentTime` quá
ngưỡng), nhưng giờ có thêm ràng buộc: cơ chế gây stale phải là
cơ chế CHỈ kích hoạt dưới tải (decoder lag), không phải lỗi logic
seek thuần túy.

## 5. (B) Event kiểu P4 — TÁI HIỆN 2 LẦN TRÊN LƯỢT YÊN

- Attempt2: 6 occ, M=[35], label [24, 26, 29], tBlend 47381–47606
  (225 ms), presented 26→34, pass 12, seq 308–311, lag max +11f,
  skp=0.
- Attempt3: 4 occ, M=[28], label [19, 22], tBlend 64482–64679
  (197 ms), presented 22→27, pass 18, seq 418–420, lag max +9f,
  skp=0.
- Tally P4-type sau 6 lượt: **P4 1 + Q5 0 + R6 2 rõ + 1 nhỏ +
  S6att1 0 + T5 2 rõ = 6 rõ + 1 nhỏ.** Cả 2 event mới đều trên
  lượt yên — cơ chế tổng quát (yield-ahead) tái hiện độc lập lần
  thứ 4 và 5 trên lượt yên (sau R6 2 rõ + 1 nhỏ).
- **Frame đóng băng biến thiên: 31 (P4) → 35 (T5att2) → 28
  (T5att3).** Giả thuyết "cùng pha pass + run-ahead" ở R6 §4.4
  BỊ YẾU thêm (không còn là một frame cố định). Event P4
  frame-26 + Q5 seq 282–285 vẫn KHÔNG tái hiện đúng dạng cũ
  (không có event nào ở frame 26 / seq 282–285 trong 2 lượt này)
  — ghi đúng "không tái hiện", không đọc thành bác.
- **Dissociation:** P4-type xảy ra trên lượt yên (5 event rõ +
  1 nhỏ trên 3 lượt yên: R6, T5att2, T5att3), seek-stale thì
  không (0/60). Hai hiện tượng không cùng điều kiện tải — P4-type
  là cơ chế yield-ahead nền (xảy ra cả khi yên), seek-stale cần
  thêm tải để bộc lộ.

## 6. Xác thực pipeline (dữ liệu mới, đã kiểm chứng)

- **Analyzer tái hiện đúng logic đếm:** chạy
  `analyze-t5-ghostseek.py` (copy T6, md5 `5ecfe429…`) trên 2 JSON
  mới → 20/20 snapshot label-0 mỗi lượt, 0 stale, event P4-type
  đúng từng tBlend/occ/skp như lag5 analyzer xác nhận độc lập
  (`analyze-t5-lag5.py`, copy T6). Hai analyzer khớp nhau hoàn
  toàn trên cả 2 lượt (6 occ + 4 occ).
- **Fisher/CI tự tính:** `fisher-t5.py` cho đúng p=0,1205 với số
  cũ (khớp parent tính tay) và p=0,0087 với số gộp mới; CI khớp
  công thức Clopper-Pearson (đối chiếu bằng tay: yên 0/60 →
  hi = 1 − 0,025^(1/60) ≈ 0,0596 ✓).
- **Fixture:** mp4 md5 `2e00e91c…` khớp M5/T6; probe md5
  `a690d828…` khớp T6/S6; b.json md5 `078938cf…` khớp T6/S6.

## 7. Kiểm chứng hồi quy (cây đo `03bf029f…`)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0**
  (log `tsc-t5.log`, chạy 13:0xZ — SAU attempt2/3; cây không đổi
  trong lúc đo).
- `ghostBlend.probe.test.ts`: **15/15 PASS** (log
  `ghostblend-t5.log`, chạy 13:0xZ bằng
  `node --experimental-strip-types --test` từ
  `apps/web/src/lib/`; exit 0).
- `vite build`: KHÔNG chạy lại — cây `03bf029f…` đã build PASS ở
  N1 đợt 112 + R10 gộp muộn đợt 115 + suite 27/27 đợt 116 S10 +
  suite 27/27 đợt 117 T10; T5 không sửa production (md5 không
  đổi); ghi rõ.
- preview.tsx md5 `03bf029f…` không đổi trong suốt lượt đo +
  hồi quy. Lock script md5 đổi giữa đợt (T1 đổi spec v2,
  `8b02ddc8` → `5cac10af`) nhưng attempt2/3 dùng cùng bản
  `5cac10af` trước = sau mỗi lượt. Không sửa file production nào.

## 8. Sự cố hạ tầng trong lúc đo (đã xử lý / đã báo)

1. **Attempt1 gate A không mở 30 phút** (T3 s79 56 hog + T2 giữ
   lock; load5 không dưới 7,09; RAM có lúc 530 MB) — hoãn đúng
   luật, không dữ liệu. Bài học: lượt đo sau reboot + dial T3
   dài sẽ mất cửa yên; gate A 30–45 poll là đủ dài (attempt2 mở
   ở poll 17 sau khi T3 dừng + T8 xong).
2. **T8 Q8PAUSED chạy trong cửa sổ chờ của attempt2** (probe
   `webkit_blob_flaky_118t8.mjs`, MiniBrowser + WebKitWebProcess,
   blockers=6, webkit=3 tới ~12:43Z) — gate A đếm đúng làm
   blocker; probe xong ~12:44Z, blockers về 0, gate mở poll 17
   lúc 12:47:26Z. Không can thiệp.
3. **Reboot #55 (12:51:56Z)** giết T4 attempt7 giữa chừng
   (partial JSON 12/20) + để lại lock stale; T5 xử lý theo luật
   lock v2 (§2.3), không mất dữ liệu đo nào (attempt2 đã xong
   trước reboot).
4. **Replay #55 PASS ngay** (postboot exit 0 lúc 12:55Z, boot mới
   3 phút tuổi) — khác #53 đình trệ 65+ phút và #54 tới muộn
   47'. Giải thích có khả năng nhất: package đã nằm trên overlay
   sau replay #54 nên boot mới không cần cài lại (T7/T8 xác nhận
   cơ chế; T5 chỉ ghi nhận số đo). T7 chưa viết cờ #55 lúc T5 đo
   — prereg §2.1 đã dự phòng (tự kiểm PASS + gate0 kiểm lại).
5. **T4-wait dương tính giả ở attempt1** (glob `*.json` match
   `b.json`) — đã sửa thành `preview-*.json` trước attempt2; ghi
   rõ để driver sau không lặp lại.
6. **Không có vite mồ côi của T5.** Attempt2/3: lock acquire 1
   lần mỗi lượt, nhả sạch (84 s / 81 s); kill-vite pid node chết,
   ps sạch, curl :5188 = 000 sau mỗi lượt. Cuối lượt lock trống.

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND118_T5_GHOSTSEEK_LIMITS.md` — file này. **File
  duy nhất trong repo mà T5 thay đổi** (probe/analyzer/run-script/
  prereg/dữ liệu đều ở hidden_files; probe + analyzer là copy T6
  đã stage ở đợt 117 nên KHÔNG stage lại; mp4 fixture là binary
  local-only đã có từ M5, KHÔNG stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round118-t5-ghostseek.txt`
  (NUL-delimited, đã đọc lại xác nhận; 1 entry: LIMITS).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round118-t5/`
  (prereg-t5.md, probe118t5-ghost-k7.webkit.mjs [copy T6, md5
  `a690d828…`], analyze-t5-ghostseek.py [copy T6, md5 `5ecfe429…`],
  analyze-t5-lag5.py [copy T6], fisher-t5.py [copy T6, md5
  `1e09259a…`], b.json [md5 `078938cf…`],
  vite.t5-temp.config.mjs, run-t5.sh [adapt từ run-t6.sh: cổng
  5188, chờ T4, xử lý lock stale-boot, cột webkit ở gate A],
  ghostseek-attempt{2,3}.txt + ghostseek-detail.txt +
  ghostseek-lag5-attempt{2,3}.txt + lag5-detail.txt [phân tích],
  poll-t5.log, chain-t5.log, postboot-t5-attempt{1,2,3}-gate0.log,
  run-t5-attempt{1,2,3}.nohup.log, run-webkit-t5-attempt{2,3}.log,
  vite-5188-t5-attempt{2,3}.log, load-mid-t5-attempt{2,3}.log,
  ps-before/after-t5-attempt{2,3}.txt, tsc-t5.log,
  ghostblend-t5.log, marker-t5-attempt{2,3},
  preview-b-f3-flip-webkit-t5-attempt{2,3}.json [JSON đo]).
- Cờ xong: `hidden_files/round118-t5.done` (tạo SAU KHI LIMITS +
  batch xong).

## 10. Nợ mở + đề xuất cho đợt sau

1. **H-D (seek) ĐÃ ĐÓNG — nợ #6 đợt 117 hoàn thành.** Không cần
   thêm lượt yên cho H-D (seek) nữa, trừ khi parent muốn p < 0,001
   (cần thêm ~2 lượt yên 0/20 nữa → 0/100 vs 5/40, p≈0,0016).
2. **Đo yield-frame trực tiếp (nợ cũ S6 §10.2, vẫn mở):** M là
   frame nào lúc capture (decoder yield vs currentTime)? Cần mốc
   đo trong `rvfcCaptureFrame` / `updateMotionBlurSnapshots` —
   cần sửa production, đề xuất đợt sau (không thuộc phạm vi
   probe-only đợt này).
3. **P4-type:** tally 6 rõ + 1 nhỏ / 6 lượt; frame đóng băng biến
   thiên (31/35/28) — cần mô hình mới cho "frame nào bị đóng
   băng" (không còn là hằng số 31); theo dõi tiếp, nhất là xem
   lag max có vượt +11f không.
4. **Replay #55 PASS ngay:** T7/T8 xác nhận cơ chế persist
   package qua reboot (overlay) — nếu đúng, các boot sau #55 có
   thể không cần chờ replay nữa; ghi nhận để đợt sau khỏi chờ
   thừa 45 phút.
5. **Lock stale sau reboot:** gate A của T5 đã xử lý đúng luật
   `lock_is_stale` (boot đổi + pid chết + curl 000). Đề xuất các
   driver khác áp dụng cùng cách kiểm (đừng chỉ kiểm dir tồn
   tại), hoặc lock script cung cấp subcommand kiểm stale để driver
   gọi — tránh kẹt gate A sau mỗi reboot.
6. **T4 attempt7 partial (12/20, reboot #55 giết):** T4 tự quyết
   dùng hay bỏ; T5 không đụng.
7. **G1 + mù #36 chờ user quyết, ci-security.yml vẫn 403 chờ user,
   birefnet 0 lần, TTS 39 CẤM kiểm lại, release gate không đổi.**

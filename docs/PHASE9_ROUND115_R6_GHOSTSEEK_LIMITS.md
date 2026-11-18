# PHASE9_ROUND115_R6_GHOSTSEEK_LIMITS — Chẩn đoán ghost stale sau seek seq 282–285 (Q5)

> Luồng R6, đợt 115, lượt cron 00:35 +07 15/11/2026 (bắt đầu ~17:35Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — chỉ
> CHẨN ĐOÁN (đọc code để hiểu ngữ nghĩa, không đổi code).
> F6' ĐÃ ĐÓNG (L7) — R6 không đóng lại, không mở lại.

## 0. Kết quả chính (5 ý)

1. **Event seek Q5 (seq 282–285, label 0 / pixels 68, lag +68f)
   KHÔNG tái hiện trên lượt yên sạch: 0/20 seek stale** (attempt5,
   20 pass, gate yên lớp A + lớp B mới ĐẠT). Gộp Q5+R6: **1/40 seek
   (2,5%)**. Chưa đủ bằng chứng kết luận cơ chế seek hay bác H-D
   (P(0/20 | tỉ lệ nền 5%) = 36%) — coi là sự kiện đơn lẻ trong lượt
   nhiễm tải (Q5), CHƯA kết luận hồi quy. Xem §3 + §6.
2. **Event kiểu P4 (nhãn chạy, pixels đứng yên) TÁI HIỆN 2 lần rõ
   ràng + 1 lần nhỏ trên cùng lượt yên này** — 20 occurrence lag
   ≥+5f, 3 event, tất cả mid-pass, skp=0. Đây mới là phát hiện lớn
   của lượt này: cơ chế label/pixel-divergence là thật và KHÔNG cần
   tải. Xem §4.
3. **Cơ chế tổng quát đã rõ hơn nhờ đọc code + số đo:** snapshot
   được gán nhãn bằng `currentTime` lúc `drawVideoClip` đọc, nhưng
   pixels được lấy mẫu thật từ video element ở `rawMs/rawCt`
   (đường mask) — video element có lúc yield frame ĐI TRƯỚC
   `currentTime` tới +14f (decoder chạy trước / yield frame đã
   decode). Snapshot được capture MỚI mỗi tick (labelMs khác nhau)
   nhưng pixels đóng băng ở frame 31 trong ~320–370 ms trong khi
   `currentTime` chạy tiếp. Xem §4.3 + §5.
4. **H-B (E4 steady-close) BỊ YẾU thêm:** cả 20 occurrence lag
   ≥+5f đều ở skp=0 (skipLatest TẮT), trên lượt yên — divergence
   xảy ra mà không cần skip/steady-close. Chưa bác hẳn (cần A/B cây
   cũ) nhưng không còn là hướng ưu tiên.
5. **Hồi quy sạch:** tsc exit 0, ghostBlend 15/15 PASS, preview.tsx
   md5 `03bf029f…` không đổi. Match (b) 730/730 unique, 0 nomatch,
   0 multi-match — pipeline đo khỏe, các event là thật (strip khớp
   M với 0 bit lỗi, frame gần nhất khác ≥9 bit). Xem §7.

## 1. Môi trường + cây đo + prereg

- **Cây đo `03bf029f…`** (= cây Q5, fix E4 steady-close).
  preview.tsx md5 `03bf029f09b8890b285eacc10a02172b` kiểm trước/sau
  lượt đo attempt5 — KHÔNG ĐỔI. R6 không sửa production.
- **Diễn biến cây trong lúc chờ (ghi rõ, không ảnh hưởng số đo):**
  R2 đổi cây sang `a419ae05…` lúc ~18:18Z (fix cap snapshot 640px)
  rồi REVERT về `03bf029f…` trước 18:33Z; cờ `round115-r2-tree`
  ghi `md5=03bf029f… / NO-CHANGE`. R6 đo SAU khi cờ xuất hiện,
  trên cây `03bf029f…` — SO ĐƯỢC TRỰC TIẾP với Q5. Hai bổ sung
  prereg (§5.1 cây đổi, §5.2 revert) đã ghi TRƯỚC khi đo.
- **Boot trong lúc đo attempt5: 2026-11-14 19:43:46Z = reboot #48**
  (sau #47 17:45:50Z). Postboot #48: gate0 try 2 PASS
  (postboot-check exit 0, apt_procs 0). R6 không chạy lại
  postboot-check đầy đủ; chỉ ghi nhận boot + gate0.
- **Prereg:** `hidden_files/round115-r6/prereg-r6.md` (+ 2 bổ sung
  §5.1/§5.2, đều viết TRƯỚC khi đo) — đăng ký: 4 giả thuyết H-A…
  H-D + dấu hiệu phân biệt, protocol Q5 với 40 pass (đã đổi xuống
  20 pass ở attempt4/5 — xem §2.3, lý do + công khai), quy tắc
  quyết định, lớp yên theo định nghĩa mới.
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn từ round111-m5.
  Keyframe h264 tại pts 0 / 0,833 (frame 25) / 1,667 (50) /
  2,500 (75) — frame 31 KHÔNG phải keyframe (xem §4.4).
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb. Env launch GST như M5/L7/N4/P4/Q5.
- **Analyzer mới `analyze-r6-ghostseek.py`** (tái dùng logic match
  lag5: global match, thresh ≤2 bit, strip 48px): đếm MẪU SỐ seek
  (snapshot label-0 phân biệt theo labelMs + số stale), gán mỗi
  event vào pass + frame cuối pass trước, tách riêng event kiểu P4.
  Đã xác thực trên JSON Q5 TRƯỚC khi đo: tái hiện đúng 20/20
  snapshot label-0, 1 stale (5,0%), pass 15, delta M−lastDrawn +4.

## 2. Năm lần chạy (attempt) — chỉ attempt5 chạy xong

### 2.1 Attempt1 (17:53Z) — HOÃN, không chạy probe

- Chờ R5 tối đa 45 phút + cờ R2 (chưa có lúc đó) + gate A 10 phút
  không mở (load1 tới 24,23 — các luồng round115 khác pha nặng;
  R1 giữ vite lock lúc 18:46). Kết thúc gate A vẫn còn lock/
  blockers → HOÃN đúng luật (không chen 2 WebKit), exit 5.
  Không có dữ liệu đo.

### 2.2 Attempt2 (18:51Z) — HOÃN, không chạy probe

- R5-wait 15 phút (R5 chưa xong) + cờ R2 đã có (NO-CHANGE) +
  gate0 PASS + gate A 20 phút không mở (RAM 307–622 MB suốt lượt;
  R5 giữ vite lock từ 19:11:32Z). Kết thúc vẫn còn lock R5 (11
  blocker) → HOÃN, exit 5. Không có dữ liệu đo.
- Ghi nhận: R5 attempt2 ĐÃ chạy được lượt yên (gate mở 19:11:32Z,
  RAM 1515 MB) nhưng probe KẸT ở pass 10: log mtime 19:12:14,
  17 phút không tiến (pass 1–9 xong trong ~42s như Q5);
  WebKitWebProcess chỉ +1s CPU/1,5 phút; RAM 381–600 MB + swap
  434 MB — áp lực RAM NGOÀI cell làm renderer thrash. R5 KILL
  probe 19:30:04Z (probe_exit=2), KHÔNG dùng dữ liệu dở dang,
  không có JSON. Đây là bằng chứng stall do RAM ngoài cell —
  ảnh hưởng trực tiếp quyết định đổi pass ở §2.3.

### 2.3 Attempt3 (19:29Z) — R6 TỰ HỦY giữa gate-A (quyết định có ghi)

- Sau khi đọc note stall của R5 (§2.2), R6 hủy attempt3 (đang
  gate-A, chưa giữ lock, chưa chạy probe — hủy an toàn, không mất
  dữ liệu) để đổi protocol 40 pass → **20 pass**: 40 pass phơi
  nhiễm gấp đôi thời gian trước nguy cơ stall kiểu R5 (kẹt pass 10,
  mất toàn bộ JSON vì probe chỉ ghi file lúc kết thúc), trong khi
  20 pass vẫn cho mẫu số seek bằng đúng Q5 (20) để gộp trực tiếp
  (Q5 20 + R6 20 = 40 seek). Đây là ĐỘ LỆCH KHỎI PREREG (đăng ký
  40 pass/lượt) — công khai tại đây, lý do: bằng chứng stall thực
  tế trong ngày + ngân sách ~3 giờ. Quyết định này KHÔNG làm thay
  đổi định nghĩa đo hay ngưỡng verdict; chỉ giảm mẫu số mỗi lượt.
- Attempt3 không để lại dữ liệu đo.

### 2.4 Attempt4 (19:41Z) — CHẾT DO REBOOT #48 giữa gate-A

- Gate-A poll 4 lúc 19:44:06Z; reboot #48 (19:43:46Z, boot_id
  `0c2a9f2f…`) giết script giữa chừng. Không có dữ liệu đo.
- Hậu quả reboot: lock R3 (`thread=r3-round115`, pid 105555, port
  5590, boot cũ `5578af38…`) còn sót lại thành lock stale. R6 dọn
  bằng ĐÚNG cơ chế stale-recovery của lock script (không sửa
  script, không xóa tay): xác minh đủ 3 điều kiện (owner pid chết
  + không vite trên cổng 5590 + curl 000; tuổi lock 510s > ngưỡng
  stale_min=5 phút truyền vào) → `acquire r6 5184 60 5` reclaim
  rồi `release r6` ngay, lock TRỐNG. Ghi trong chain-r6.log
  19:46:18–19:46:19Z. Không có luồng nào khác giữ lock lúc đó;
  không vite nào đang chạy (curl mọi cổng 000).

### 2.5 Attempt5 (19:46Z) — CHẠY XONG 20/20 pass (lượt đo duy nhất)

| | Giá trị |
|---|---|
| Bắt đầu / kết thúc (UTC) | 19:47:29Z / 19:48:49Z (80 s) |
| probe_exit | 0 |
| Boot | #48 19:43:46Z |
| preview.tsx md5 trước/sau | `03bf029f` → `03bf029f` (không đổi) |
| Gate A lúc bắt đầu | load1 0,68 / load5 0,96, không lock, không blocker, RAM 1407 MB — MỞ ngay poll 1 |
| Gate0 replay | try 1: postboot exit 0 nhưng apt_procs=2 → try 2 (19:47:28Z): exit 0, apt_procs=0 — PASS |
| Load giữa lượt (sampler 20 s) | 19:47:31 load 0,68/0,96 RAM 1335 MB → 19:47:51 1,07/1,03 925 MB → 19:48:11 1,52/1,14 908 MB → 19:48:31 2,62/1,40 844 MB |
| Load lúc kết thúc | 3,13 / 1,60 / 0,71, RAM 1348 MB |
| Lớp B (mới) | **ĐẠT** (xem §2.6) |
| Blend ticks | 508 total, 365 post-flip+2000ms (viaRvfc=0) |
| Pass-start ticks (ringSize==1) | 20 (khớp 20 pass) |
| JSON | `preview-b-f3-flip-webkit-r6-attempt5.json` (3.221.634 byte) |

### 2.6 Lớp B (mới) attempt5 — ĐẠT, kèm caveat

Cửa sổ đo = tick đầu → tick cuối, ~19:47:29–19:48:49Z.

| Mục lớp B (mới) | Kết quả |
|---|---|
| (B1) load5 lúc kết thúc ≤ 2,5 | **1,60 ✓** |
| (B2) không bằng chứng phân tích nặng/tải trong cửa sổ; load1 không vượt 4 | **✓** — ps-before/after chỉ khác vite/esbuild/sampler CỦA R6 (16 → 21 dòng, toàn process R6); không có python analyzer / tsc / vite / node probe / hog nào của luồng khác; load1 tối đa quan sát 3,13 (< 4, lấy mẫu mỗi 20 s + đầu/cuối) |
| (B2-ghi-nhẹ) ghi file nhẹ luồng khác trong cửa sổ | **✓ không vi phạm** (0 file `round115-*` khác sửa sau marker — find ra 0) |
| (B3) không reboot; vite.lock chỉ do R6 giữ | **✓** (boot #48 suốt lượt; lock acquire 1 lần thành công ngay, nhả sạch; kill-vite pid node chết, ps sạch, curl :5184 = 000) |

**Caveat (ghi rõ, không dùng để lật verdict):** RAM rơi 1407 → 844 MB
trong lượt; load1 tăng 0,68 → 3,13 (một phần là tải của chính probe
vite+WebKit); boot #48 mới ~4 phút tuổi lúc probe bắt đầu (replay
vừa xong ở gate0 try 2). Không có bằng chứng tải ngoài trong cửa sổ
— lượt này đủ điều kiện gọi là lượt yên theo định nghĩa mới.

## 3. (A) Event seek Q5 — KHÔNG tái hiện (0/20 seek)

| | R6 attempt5 (lượt yên, cây 03bf029f) | Q5 lần 3 (lượt nhiễm tải, cây 03bf029f) |
|---|---|---|
| Snapshot label-0 phân biệt (theo labelMs) | **20** (= số pass) | 20 |
| Snapshot label-0 STALE (M≠0) | **0** | 1 (labelMs 57890, M=68) |
| Tỉ lệ stale/seek | **0/20 = 0,0%** | 1/20 = 5,0% |
| (b) lag ≥+5f dạng SEEK (label 0 đứng yên) | **0 occurrence** | 7 occ, 1 event (seq 282–285) |
| (b) lag ≥+5f dạng P4 (label chạy) | 20 occ, 3 event (xem §4) | 0 |

- Bảng pass (D) attempt5: cả 20 pass đều có snapshot label-0
  M=0 [ok] (labelMs 9205…70474, first-use tBlend ngay sau start
  seq mỗi pass). Không có pass nào stale.
- Gộp Q5+R6 (cùng cây, cùng protocol 20 pass, khác điều kiện tải):
  **1/40 seek stale (2,5%)**. Khoảng tin cậy 95% (Clopper-Pearson,
  n=40, k=1): ~0,06%–13,2% — rộng, không đủ power để phân biệt
  0% với 5%.
- Theo quy tắc prereg §4: ngưỡng "không tái hiện trong tổng ≥80
  seek" KHÔNG đạt (chỉ có 40 seek gộp; R6 chỉ đo được 1 lượt 20
  pass vì attempt1/2/4 chết do hạ tầng — xem §2). Verdict đúng
  prereg: **"không tái hiện trong 20 seek lượt yên (điều kiện §2.5–
  2.6); coi là sự kiện đơn lẻ trong lượt nhiễm tải (Q5) — CHƯA kết
  luận hồi quy, CHƯA kết luận cơ chế seek"**. Nợ chuyển tiếp: cần
  thêm lượt yên (tổng ≥80 seek) mới kết luận được; theo dõi tiếp
  ở đợt sau.
- P(0/20 | tỉ lệ nền thật 5%) = 0,95^20 ≈ 36% — kết quả 0/20
  hoàn toàn tương thích với việc tỉ lệ nền vẫn là 5% và lượt này
  chỉ là may mắn không bắt được. KHÔNG được đọc 0/20 thành "đã
  sửa" hay "H-A bị bác".

## 4. (B) Event kiểu P4 — TÁI HIỆN 2 lần rõ + 1 lần nhỏ (phát hiện chính)

### 4.1 Danh sách event (lag ≥+5f, post-flip, viaRvfc=0)

| Event | Occ | M (pixels) | Label | tBlend | Thời lượng | Presented | Pass | Lag max |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 19 | 14 | 35960–36050 | 90 ms | 17→19 | 9 | +5f |
| 2 | 10 | 31 | 17→26 | 36050–36417 | 367 ms | 19→31 | 9 | +14f |
| 3 | 8 | 31 | 17→24 | 65461–65777 | 316 ms | 19→29 | 18 | +14f |

- Cả 3 event đều là **kiểu P4** (label chạy, pixels đứng yên) —
  KHÁC event seek Q5 (label 0 đứng yên). Event 1+2 cùng pass 9,
  liên tiếp nhau (35960–36417, tổng 457 ms): pixels nhảy 19 → 31
  rồi đứng yên ở 31.
- So với event P4 gốc (frame 26, lag +6..+12f, nhãn 14→20,
  presented 17→27, ~420 ms): event 2/3 cùng hình dạng chữ ký,
  lag lớn hơn một chút (+14f), thời lượng tương đương (316–367 ms
  vs 420 ms). **Event P4 KHÔNG còn là đơn lẻ: đã xuất hiện ở P4
  (1 lần), vắng ở Q5 (0 lần), tái hiện ở R6 (2 lần rõ + 1 nhỏ).**
  Tỉ lệ thô kiểu P4: ~1 event / 20-pass run (P4 1, Q5 0, R6 2+1).
- Tất cả 20 occurrence đều ở **skp=0** (skipLatest TẮT) — xem §6
  về H-B.
- Không occurrence nào có label==presented (label luôn < presented
  trong mọi occ) — các ghost stale này KHÔNG phải ứng viên vi phạm
  bar F6' (1)/(2). R6 không đo lại bar F6' (nhiệm vụ R5).

### 4.2 Chi tiết tick event 2 (pass 9, seq 213–219) — bằng chứng pixel-trực-tiếp

| seq | tBlend | presented | Ghost 1 (label / labelMs / pixels) | Ghost 2 (label / labelMs / pixels) |
|---|---|---|---|---|
| 212 | 35897 | 14 | 0 / 34575 / 0 ✓ | 0 / 34575 / 0 ✓ |
| 213 | 35960 | 17 | 0 / 34575 / 0 ✓ | 14 / 35375 / **19** (+5f) |
| 214 | 36050 | 19 | 14 / 35375 / **19** (+5f) | 17 / 35912 / **31** (+14f) |
| 215 | 36113 | 22 | 17 / 35912 / **31** (+14f) | 19 / 35988 / **31** (+12f) |
| 216 | 36178 | 24 | 19 / 35988 / **31** (+12f) | 22 / 36083 / **31** (+9f) |
| 217 | 36264 | 26 | 22 / 36083 / **31** (+9f) | 24 / 36149 / **31** (+7f) |
| 218 | 36342 | 29 | 24 / 36149 / **31** (+7f) | 26 / 36214 / **31** (+5f) |
| 219 | 36417 | 31 | 26 / 36214 / **31** (+5f) | 29 / 36309 / 29 ✓ |

- Mỗi ghost là một snapshot PHÂN BIỆT (labelMs tăng mỗi tick:
  35375 → 35912 → 35988 → 36083 → 36149 → 36214 → 36309) —
  snapshot ĐƯỢC capture mới mỗi tick, nhưng pixels đóng băng ở
  frame 31 trong 5 tick liên tiếp (35960–36263, ~300 ms) trong khi
  label chạy 17→26 và presented chạy 19→31. Tick 219 snapshot
  mới (label 29) đã đúng trở lại — freeze kết thúc khi presented
  bắt kịp frame bị đóng băng (31).
- Event 3 (pass 18, seq 435–440) có cấu trúc Y HỆT: seq 435 ghost
  label 14 còn gần đúng (M=15, lag +1f, dưới ngưỡng); từ seq 436
  pixels đóng băng ở 31 trong khi label chạy 17→24 và presented
  chạy 19→29; đuôi event kéo dài qua seq 441–442 ở mức dưới ngưỡng
  (lag +2..+4f) rồi hết hẳn ở seq 443 (lag 0).
- Pass 9 kết thúc: lastFrame 68, lastDrawn 68, prev 66.
  Pass 18 kết thúc: lastFrame 67, lastDrawn 67, prev 62.
  Frame đóng băng 31 KHÔNG liên quan frame cuối pass (67–68).

### 4.3 Độ tin cậy match — KHÔNG phải artifact matching

- Strip stale khớp M với **0 bit lỗi (exact match)**; frame gần
  nhất khác cách ≥9 bit: seq 214 ghost label 17 → (0, 31),
  (9, 6), (10, 27)…; seq 436 ghost label 17 → (0, 31), (9, 6)…;
  seq 215 ghost label 19 → (0, 31), (9, 6)…. Đối chứng Q5 seq 282
  ghost label 0 → (0, 68), (10, 59), (12, 7)…. Match là thật,
  không phải nhiễu threshold (ngưỡng ≤2 bit, khoảng cách tới
  frame nhì ≥9 bit).
- Match (b) toàn lượt: **730/730 ghost entry post-flip unique-match,
  0 nomatch, 0 multi-match** — pipeline (b) khỏe hoàn toàn trên
  lượt này.

### 4.4 Vì sao cả 2 event đều đóng băng ở frame 31?

- Frame 31 KHÔNG phải keyframe (keyframe h264 tại pts 0 / 0,833
  = frame 25 / 1,667 = 50 / 2,500 = 75) — giả thuyết "keyframe"
  BỊ BÁC.
- Diễn giải được ủng hộ nhất (chưa chứng minh): decoder chạy
  trước `currentTime` ~+12–14f; freeze bắt đầu ở cùng pha của pass
  (presented ~17–19, tức ~0,6 s sau seek đầu pass) nên frame bị
  đóng băng trùng nhau (31 = currentTime lúc freeze ~17–19 cộng
  run-ahead ~12–14f). Đây là diễn giải, KHÔNG phải kết luận —
  cần đo run-ahead trực tiếp (so `currentTime` với frame decoder
  yield) ở đợt sau nếu muốn chốt.
- Không kết luận gì thêm từ "31 trùng nhau" ngoài việc ghi nhận:
  2 event độc lập cùng đóng băng ở 31 (xác suất trùng ngẫu nhiên
  nếu frame đóng băng đều trên 90 frame ≈ 1/90 — thấp, gợi ý có
  yếu tố hệ thống, nhưng chưa đủ để đặt tên cơ chế).

## 5. Cơ chế — đọc code (preview.tsx, chỉ đọc, không sửa)

Ngữ nghĩa các trường ghostPix (comment trong code, dòng ~1349–1356):

- `labelMs/labelCt` = lúc `drawVideoClip` đọc `currentTime` để gán
  nhãn frame (`videoFrameIndex`).
- `rawMs/rawCt` = lúc `rawUnitSource` vừa vẽ xong từ video element
  (đường mask: pixels snapshot được lấy mẫu THẬT ở đây, không phải
  lúc copy snapshot).
- `snapMs/snapCt` = lúc `updateMotionBlurSnapshots` vẽ snapshot
  (drawImage); `srcKind="canvas"` khi drawSrc là canvas đã vẽ trước
  (snapMs chỉ là chặn trên của thời gian lấy mẫu).
- `pix` = strip pixels THẬT của snapshot, đọc ngay sau drawImage
  lúc capture (`sampleStripeStrip`).

Áp vào dữ liệu (event 2, snapshot label 17): labelMs 35912,
labelCt 0,589; rawMs 35933, rawCt 0,589; snapMs 35960; pixels
frame 31 (t=1,033 s). Tức là: **ngay tại thời điểm lấy mẫu thật
(rawMs 35933), `currentTime` đọc 0,589 nhưng frame video element
yield ra cho drawImage là frame 31**. Label và pixels lệch nhau
vì `currentTime` và frame được yield không đồng bộ — video element
(decoder GStreamer/WebKit) yield frame ĐI TRƯỚC `currentTime`
tới +14f, rồi giữ nguyên frame đó ~370 ms trong khi `currentTime`
chạy tiếp (0,589 → 0,891), tới khi `currentTime` bắt kịp frame 31
thì đồng bộ lại (snapshot label 29 đúng).

Cùng chữ ký ở event Q5 seek: snapshot label 0 (labelCt 0, rawCt 0,
snapMs 57929) nhưng pixels frame 68 — video element yield frame
cuối pass trước (68) trong khi `currentTime` đã reset về 0 sau seek.
**Cả 2 loại event đều là một cơ chế tổng quát: "video yield frame
đi trước currentTime; snapshot gán nhãn theo currentTime".** Seek
chỉ là trường hợp riêng (currentTime nhảy về 0, yield frame còn là
frame cũ cuối pass trước); mid-pass là trường hợp decoder chạy
trước rồi stall. Cơ chế tổng quát này ĐÃ CÓ bằng chứng tái hiện
(P4 1 lần + R6 2 lần rõ, trên lượt yên, skp=0). Cơ chế RIÊNG cho
seek (yield frame = đúng frame cuối pass trước, delta +4f ở Q5)
vẫn chỉ có 1 quan sát — chưa đủ để chốt (xem §3).

## 6. Đánh giá lại 4 giả thuyết (theo quy tắc prereg §4)

| Giả thuyết | Verdict sau lượt này | Căn cứ |
|---|---|---|
| **H-A** — Seek reset label nhưng pixels ghost sót từ pass trước | **VẪN DẪN ĐẦU cho seek, nhưng CHƯA CHỨNG MINH riêng cho seek** | Cơ chế tổng quát (yield-ahead, §5) đã tái hiện mid-pass (events 2/3) — ủng hộ H-A về bản chất (label theo currentTime, pixels theo frame yield). Nhưng event seek cụ thể 0/20 lượt yên → chưa có lần tái hiện thứ 2 để chốt delta M−lastDrawn (+4f ở Q5 là 1 điểm duy nhất). |
| **H-B** — Liên quan fix E4 steady-close | **BỊ YẾU thêm (không còn ưu tiên)** | Cả 20 occurrence lag ≥+5f đều skp=0; events 2/3 tái hiện trên lượt yên với skip TẮT. Divergence không cần skip/steady-close. Chưa bác hẳn (cần A/B cây cũ không có fix E4) nhưng hướng này tụt ưu tiên. |
| **H-C** — Seek chưa vẽ lại ghost | **Dạng tổng quát BỊ BÁC; dạng seek vẫn MỞ** | Events 2/3: snapshot ĐƯỢC capture mới mỗi tick (labelMs khác nhau từng tick) mà pixels vẫn sai — lỗi không phải "không vẽ lại" mà là "vẽ lại vẫn yield frame cũ". Riêng trường hợp seek: 0 tái hiện nên không có bằng chứng mới; vẫn mở. |
| **H-D** — Sự kiện đơn lẻ do lượt nhiễm tải | **Không kết luận được cho seek; BỊ BÁC cho divergence nói chung** | Seek: 0/20 lượt yên tương thích cả với "tỉ lệ nền vẫn 5%" (P=36%) lẫn "tải là cần thiết" — thiếu power, không phân biệt được. Divergence nói chung: events 2/3 tái hiện trên lượt YÊN (lớp B đạt) → tải KHÔNG phải điều kiện cần. |

**Ưu tiên sửa:** THẤP cho event seek riêng (1 quan sát, không tái
hiện, chưa rõ có phải hồi quy). TRUNG BÌNH cho divergence tổng quát
(label vs yielded-frame): đã tái hiện 3 lần (P4 + R6×2) trên lượt
yên, skp=0 — hướng sửa nên nhắm vào chỗ gán nhãn snapshot (label
theo frame thực sự được yield thay vì `currentTime`, hoặc bỏ qua/
đánh dấu snapshot khi yielded frame vượt `currentTime` quá ngưỡng),
KHÔNG phải E4 steady-close. Đây là đề xuất hướng, không phải thiết
kế sửa — luồng sửa riêng quyết định sau.

## 7. Kiểm chứng hồi quy (cây đo `03bf029f…`, sau lượt đo attempt5)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0**
  (log `tsc-r6.log`).
- `ghostBlend.probe.test.ts`: **15/15 PASS** (log
  `ghostblend-r6.log`, chạy bằng `node --experimental-strip-types`).
- `vite build`: KHÔNG chạy lại — N1 đã chạy PASS trên cùng cây
  `03bf029f…` đợt 112, R6 không sửa production (md5 không đổi);
  ghi rõ để khỏi hiểu là đã chạy.
- preview.tsx md5 `03bf029f…` không đổi trong suốt lượt đo +
  hồi quy. Không sửa file production nào.

## 8. Sự cố hạ tầng trong lúc đo (đã xử lý, không mất dữ liệu đo attempt5)

1. **Attempt1/2 hoãn do máy bận** (load1 tới 24, R1/R5 giữ vite
   lock; RAM 307–622 MB): hoãn đúng luật, không chen 2 WebKit.
2. **R5 attempt2 stall pass 10** (19:11–19:30Z, RAM ngoài cell +
   swap 434 MB): R5 kill probe, không dùng dữ liệu dở. R6 dùng
   thông tin này để đổi 40 → 20 pass (attempt3 hủy an toàn, §2.3).
3. **Reboot #48 (19:43:46Z)** giết attempt4 giữa gate-A; lock R3
   sót lại được dọn bằng stale-recovery của lock script (§2.4).
   Mù #33/#34 thuộc R7, R6 không đụng bookkeeping mù. Boot mới
   nhất lúc đo: #48 19:43:46Z.
4. **R2 đổi cây rồi revert** (a419ae05 → 03bf029f, cờ NO-CHANGE):
   R6 đo trên cây Q5, so được trực tiếp (§1).
5. **Không có vite mồ côi.** Attempt5: lock acquire 1 lần thành
   công ngay, nhả sạch; kill-vite pid node chết, ps sạch,
   curl :5184 = 000.

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND115_R6_GHOSTSEEK_LIMITS.md` — file này. **File
  duy nhất trong repo mà R6 thay đổi** (probe copy + analyzer +
  dữ liệu đo đều ở hidden_files; mp4 fixture là binary local-only
  đã có từ M5, KHÔNG stage, md5 không đổi; probe115r6* nằm ngoài
  repo nên không stage — như tiền lệ M5/L7/N4/P4/Q5).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round115-r6-ghostseek.txt`
  (NUL-delimited, đã đọc lại xác nhận; LIMITS + probe/analyzer mới
  nếu có — xem §10).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round115-r6/`
  (prereg-r6.md [kèm 2 bổ sung §5.1/§5.2], probe115r6-ghost-k7.webkit.mjs
  [copy Q5, md5 `a690d828…`], analyze-r6-ghostseek.py [mới, R6 viết,
  đã xác thực trên JSON Q5], analyze-r6-lag5.py [copy Q5],
  ghostseek-q5-check.txt [xác thực analyzer trên Q5], ghostseek-attempt5.txt, preview-b-f3-flip-webkit-r6-attempt5.json
  (3,2 MB, 20 pass), b.json [md5 `078938cf…`], vite.r6-temp.config.mjs,
  vcut-vite-lock-r6.sh [bản copy đóng băng, md5 `fd21193c…`],
  run-r6.sh [đã sửa giữa chừng: PASSES tham số hóa, R5_WAIT_MIN/
  GATE_A_POLLS tham số hóa — ghi rõ trong LIMITS này], poll-r6.log,
  chain-r6.log, run-webkit-r6-attempt5.log, vite-5184-r6-attempt5.log,
  load-mid-r6-attempt5.log, ps-before/after-r6-attempt5.txt,
  tsc-r6.log, ghostblend-r6.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ Q5). **Lưu ý:** run-r6.sh bị sửa GIỮA các attempt (attempt3 hủy
  để đổi 40→20 pass; attempt5 dùng PASSES=20) — file run-r6.sh hiện
  tại là bản cuối (PASSES tham số, mặc định 40); attempt1/2 chạy bản
  40-pass (đều hoãn, không ảnh hưởng số đo).
- Cờ xong: `hidden_files/round115-r6-done` (tạo SAU KHI LIMITS +
  batch xong).

## 10. Nợ mở + đề xuất cho đợt sau

1. **Event seek seq 282–285 (Q5): CHƯA KẾT LUẬN.** 0/20 lượt yên
   (R6) + 1/20 lượt nhiễm (Q5) = 1/40 gộp. Cần thêm lượt yên để
   tổng ≥80 seek (prereg §4) mới kết luận cơ chế seek / bác H-D.
   Theo dõi riêng, KHÔNG gộp với event kiểu P4.
2. **Divergence label/pixel tổng quát: ĐÃ TÁI HIỆN (P4 + R6×2),
   trên lượt yên, skp=0.** Hướng chẩn đoán tiếp: đo run-ahead
   trực tiếp (so frame decoder yield với `currentTime` tại thời
   điểm capture — cần đọc `updateMotionBlurSnapshots` /
   `rvfcCaptureFrame` kỹ hơn, hoặc thêm mốc đo yield-frame); kiểm
   tra vì sao cả 2 event đóng băng cùng frame 31 (có liên quan
   keyframe 25 + run-ahead ~+12–14f không — giả thuyết §4.4).
   Hướng sửa ứng viên: label snapshot theo frame thực sự được
   yield, hoặc loại snapshot khi yielded frame vượt currentTime
   quá ngưỡng — luồng sửa riêng quyết định.
3. **H-B (E4): tụt ưu tiên** (skp=0 cả 20 occ). Chỉ quay lại nếu
   có bằng chứng mới gắn divergence với steady-close/skip (hiện
   không có).
4. **Ngưỡng WebKit ≤60 ms: thuộc R5** (R5 attempt2 stall, attempt3
   hoãn gate — R6 không đụng). R6 không đo tickCost median cho
   mục đích chốt ngưỡng (chỉ dùng tickCost quanh event).
5. **Hạ tầng:** stall RAM ngoài cell (R5 attempt2) + reboot #48
   giữa đợt cho thấy lượt đo dài (40 pass) rủi ro cao hơn lượt
   ngắn khi máy đang nhiều luồng; đợt sau cân nhắc 20 pass/lượt
   khi RAM ngoài cell đang căng (swap > 0) — quyết định của parent.
   Mù #34 (chứa #48) thuộc R7; ci-security.yml vẫn 403 chờ user;
   birefnet 0 lần; TTS 39 CẤM kiểm lại; release gate không đổi.

# PHASE9_ROUND116_S6_GHOSTSEEK_LIMITS — Ghost stale sau seek: tổng seek ≥80 + xác nhận cơ chế P4-type (nợ #6 đợt 115)

> Luồng S6, đợt 116, lượt cron 03:35 +07 15/11/2026 (chạy 21:02–23:05Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — chỉ
> CHẨN ĐOÁN. F6' ĐÃ ĐÓNG (L7) — S6 không đóng lại, không mở lại.

## 0. Kết quả chính (6 ý)

1. **Event seek Q5 TÁI HIỆN 4 LẦN ĐỘC LẬP trong 1 lượt nhiễm tải
   (attempt1): 4/19 snapshot label-0 stale (21,1%; 4/20 seek).**
   Đây là lần đầu event seek tái hiện — và tái hiện tới 4 lần trong
   một lượt. Event Q5 KHÔNG còn là quan sát đơn lẻ. Xem §3.
2. **Gộp toàn chuỗi: 5/60 seek stale (8,3%) — toàn bộ 5 lần đều trên
   lượt NHIỄM TẢI (Q5 1/20 + S6att1 4/20 = 5/40 = 12,5%); lượt YÊN
   vẫn 0/20 (R6).** H-D (tải là điều kiện cần, cho seek) CHƯA bị bác
   — nhưng cũng chưa được ủng hộ có ý nghĩa thống kê (Fisher một
   phía p≈0,12). Xem §3 + §6.
3. **Mô hình delta H-A được TINH CHỈNH, không còn là "M ≈ frame cuối
   pass trước":** M − lastDrawn = 0 / +40 / +41 / +41. Chỉ 1/4 khớp
   đúng lastDrawn; 3/4 lệch +40/41. M khớp hơn với frame video element
   đang yield quanh lúc seek (frameIdx tick ngay trước capture:
   70/62/85/33 → M 70/61/76/68, lệch 0/−1/−9/+35 — vẫn chưa sạch).
   Diễn giải được ủng hộ nhất: M = frame decoder yield gần nhất lúc
   capture, dưới tải decoder lệch currentTime với biên độ thay đổi.
   Xem §4.
4. **H-C dạng seek BỊ YẾU:** cả 4 snapshot stale đều được capture
   MỚI sau seek (tick mask-direct frameIdx 0, rawCt đã = 0) mà pixels
   vẫn là frame cũ — lỗi ở capture/yield, không phải "chưa vẽ lại".
   H-B (E4) bị yếu thêm: stale xuất hiện cả skp=0 lẫn skp=1 trong cả
   4 event. Xem §5 + §6.
5. **Event kiểu P4 KHÔNG tái hiện trong attempt1 (0 occ):** cả 37
   occurrence lag ≥+5f đều là label 0 (kiểu seek). Tally P4-type giữ
   nguyên: P4 1 + Q5 0 + R6 2 rõ + 1 nhỏ + S6 0 (4 lượt).
6. **Mục tiêu ≥80 seek KHÔNG ĐẠT trong lượt này (dừng ở 60 seek):**
   attempt2/3 chết ở gate0 (replay sau reboot #49), attempt4/5 chết
   ở gate A (CPU yên hẳn nhưng RAM ngoài cell kẹt ~510 MB, dưới
   ngưỡng 1024 MB). Không có lượt yên thứ hai để phân biệt H-D.
   Xem §2.

## 1. Môi trường + cây đo + prereg

- **Cây đo `03bf029f…`** (= cây Q5/R6). preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b` kiểm trước/sau attempt1 và sau
  hồi quy — KHÔNG ĐỔI. S6 không sửa production.
- **Diễn biến cây trong lúc chờ (ghi rõ, không ảnh hưởng số đo):**
  S2 EDITING 21:08:48–21:31:05Z (zombie capture throttle 250ms/clip,
  md5 đổi tạm sang `9b724e69…`), rồi verdict BỎ, REVERT về
  `03bf029f…`, cờ `round116-tree` ghi `status: NO-CHANGE /
  md5-final: 03bf029f…`. S6 đo SAU khi cờ NO-CHANGE xuất hiện, trên
  cây `03bf029f…` — SO ĐƯỢC TRỰC TIẾP với Q5/R6.
- **Lỗi kiểm cờ của S6 (phát hiện trước khi đo, đã sửa — xem prereg
  §6):** `run-s6.sh` bản đầu dùng `grep -q 'NO-CHANGE'` trên toàn
  file cờ — chữ "NO-CHANGE" xuất hiện trong câu hướng dẫn của cờ
  EDITING ("...until FINAL/NO-CHANGE") + dòng `md5-before:
  03bf029f…` nên grep khớp sai → script đã đi tới gate0 + gate A
  (poll 1–5, chưa mở). S6 HỦY attempt1 đó lúc 21:27Z khi còn ở gate
  A (chưa giữ lock, chưa chạy vite/probe, CHƯA có dữ liệu), sửa
  script thành yêu cầu dòng status ĐÚNG là `^status: NO-CHANGE` VÀ
  md5 đo trực tiếp = `03bf029f`, bổ sung prereg §6, rồi chạy lại.
  Không có dữ liệu nào bị nhiễm bởi lỗi này.
- **Cờ chốt chặn `round-in-progress.md`:** vẫn tồn tại lúc S6 bắt đầu
  (tạo 20:42Z 14/11, main chat verify đợt 115 R10). Tuy nhiên
  build-loop-log (lượt cron 03:35 +07 15/11) ghi rõ đợt 115 đã gộp
  muộn XONG và parent ĐÃ MỞ đợt 116 với 10 luồng S1–S10, spawn S6
  với nhiệm vụ này; S6 tiến hành theo lệnh spawn trực tiếp của
  parent và KHÔNG tự xóa file chốt chặn (file của main chat).
- **Boot:** attempt1 trên boot **#48** (`0c2a9f2f…`, 19:43:46Z).
  **Reboot #49** lúc ~21:46Z (boot_id `9c6b5543…`, sau attempt1 —
  dữ liệu attempt1 đã lưu xong 21:40, không ảnh hưởng); gap
  #48→#49 ≈ 2h02'. Replay sau #49 mất ~25 phút (21:46→~22:12,
  dài hơn ước tính ~17 phút của L8). Mù chứa #49 thuộc luồng khác;
  S6 không đụng bookkeeping mù.
- **Prereg:** `hidden_files/round116-s6/prereg-s6.md` (+ bổ sung §6
  lỗi kiểm cờ, §7 reboot #49 + attempt1 là lượt nhiễm — cả hai đều
  viết TRƯỚC khi đo lượt tương ứng).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn từ round111-m5.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb. Env launch GST như M5/L7/N4/P4/Q5/R6.
- **Lock v2:** `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`, v2-only đợt 116 (KHÔNG dùng v1).
  Attempt1: ticket `1-1794692207892118114-56690-s6`, chờ 1 s, giữ
  202 s, nhả sạch. Lock S3 sót sau reboot #49 được dọn bằng
  stale-recovery của v2 (đường tắt boot đổi) — S6 không xóa tay.

## 2. Các lần chạy (attempt) — chỉ attempt1 có dữ liệu

### 2.1 Attempt1-lần-1 (21:06–21:27Z) — HỦY, không chạy probe

- Lỗi kiểm cờ (§1): qua được tree-check sai, tới gate0 PASS + gate
  A poll 1–5 (chưa mở). Hủy trong lúc gate A đang sleep; xác minh:
  lock v2 TRỐNG, vite :5184 down, không process sót. Không có dữ
  liệu đo.

### 2.2 Attempt1-lần-2 (21:26–21:40Z) — CHẠY XONG 20/20 pass, LƯỢT NHIỄM (lượt đo duy nhất)

| | Giá trị |
|---|---|
| Bắt đầu / kết thúc (UTC) | 21:36:47Z / 21:40:05Z (probe ~180 s) |
| probe_exit | 0 |
| Boot | #48 19:43:46Z |
| preview.tsx md5 trước/sau | `03bf029f` → `03bf029f` (không đổi) |
| Gate 0 | try 1 PASS (postboot exit 0, apt_procs 0) |
| Gate A lúc bắt đầu | poll 4 MỞ: load1 1,43 / load5 1,98, không lock, không blocker, RAM 1795 MB |
| Load giữa lượt (sampler 20 s) | 21:36:55 1,73/2,03 RAM 1632 MB → 21:37:15 **6,95**/2,66 RAM **402 MB** → 21:37:35 **6,95**/3,33 RAM 735 MB → 21:37:55 5,35/3,19 → 21:38:16 3,96/3,02 → 21:38:36 2,99/2,86 → 21:38:56 2,35/2,72 → 21:39:16 1,76/2,56 → 21:39:36 1,40/2,42 → 21:39:57 1,16/2,30 RAM 839 MB |
| Load lúc kết thúc | 6,02 / 3,27 / 2,83, RAM 1321 MB |
| Lớp B | **KHÔNG ĐẠT** (xem §2.3) — lượt NHIỄM TẢI |
| Blend ticks | 203 total, 151 post-flip+2000ms (viaRvfc=0) — thấp hẳn so với R6 (508/365): tick chậm dưới tải, xem §2.3 |
| Pass-start ticks (ringSize==1) | 19 (khớp 19/20 pass — xem §4.1) |
| JSON | `preview-b-f3-flip-webkit-s6-attempt1.json` (1.585.125 byte) |

### 2.3 Lớp B attempt1 — KHÔNG ĐẠT (lượt nhiễm tải)

| Mục lớp B | Kết quả |
|---|---|
| (B1) load5 lúc kết thúc ≤ 2,5 | **3,27 ✗** |
| (B2) load1 không vượt 4 trong cửa sổ; không bằng chứng tải ngoài | **✗ — load1 tối đa 6,95** (21:37:15 + 21:37:35); ps-after có **12 process `node -e while (true) { Math.sqrt(Math.random()); }`** của luồng khác xuất hiện trong cửa sổ (hog kiểu dial load-break — S3 chạy s78b cùng lúc, load1 tới 39,9 lúc 21:51:43; hog đã chạy từ ~21:37) |
| (B2-ghi-nhẹ) ghi file nhẹ luồng khác trong cửa sổ | ✓ không vi phạm (chỉ `round116-s5` sửa file sau marker — S5 ghi log/analysis của mình) |
| (B3) không reboot; vite.lock chỉ do S6 giữ | ✓ (boot #48 suốt lượt; lock acquire 1 lần, nhả sạch; kill-vite pid node chết, ps sạch, curl :5184 = 000) |

**Caveat bổ sung:** RAM rơi 1632 → 402 MB ngay đầu lượt rồi hồi
lên 839–1321 MB; tickCost 98–503 ms (R6: ~91 ms) — probe chạy ~180 s
cho 20 pass so với ~80 s của R6. Tải ngoài là hog CPU của luồng khác
(S3 s78b), KHÔNG phải apt replay (gate0 apt=0, replay #48 đã xong từ
lâu). Lượt này đủ điều kiện đếm tái hiện nhưng KHÔNG dùng để bác H-D.

### 2.4 Attempt2 (21:48–21:51Z) — HOÃN ở gate0, không chạy probe

- Gate0 3 try đều FAIL (postboot_exit=1, apt_procs=2): boot #49 mới
  ~2–5 phút tuổi, replay đang cài dần — postboot lúc 21:46:46 ghi
  thiếu libevent/libEGL/libavif/libdw/libevdev + thư mục GST chưa
  tồn tại + thiếu 11 package. Exit 6 đúng luật, không chạy probe.

### 2.5 Attempt3 (22:04–22:06Z) — HOÃN ở gate0, không chạy probe

- Gate0 3 try đều FAIL (postboot_exit=1, apt_procs 2–4): replay vẫn
  đang chạy 18–20 phút sau boot #49. Postboot 22:06 ghi đã có thư
  mục GST thật (32 plugin hệ thống, trước là 0) nhưng vẫn thiếu
  libevent/libavif/libevdev + plugins-good/bad/ugly/libav. Exit 6
  đúng luật.

### 2.6 Attempt4 (22:12–22:42Z) — HOÃN ở gate A (30 poll), không chạy probe

- Gate0 try 1 PASS (postboot exit 0 lúc ~22:12 — replay xong;
  GST 269/269 plugin, đủ 11 package). S3 đã IDLE (s78 rc=0,
  22:10:42Z), lock TRỐNG.
- Gate A 30 poll KHÔNG MỞ: load1/load5 hạ dần (poll 1: 2,48/18,17
  → poll 30: 0,06/0,44 — CPU yên hẳn) nhưng **RAM avail kẹt
  508–568 MB, không qua ngưỡng 1024 MB lần nào**. Exit 5 đúng luật
  (prereg-s6: không chạy ở tải thấp nhất).
- Nguyên nhân RAM kẹt (đo 22:43Z): MemTotal 8,1 GB, MemFree 135 MB,
  MemAvailable ~479 MB, Cached chỉ 473 MB, Swap đã dùng 453 MB /
  1 GB — bộ nhớ bị giữ NGOÀI cell (không process nào trong cell
  RSS lớn; process lớn nhất là hatch daemon 262 MB). Đây là nghẽn
  hạ tầng, không phải tải trong cell. S9 chạy probe matrix
  22:21–22:34 trong lúc chờ (blockers=5 ở poll 10–22) nhưng không
  phải nguyên nhân RAM kẹt (RAM vẫn ~510 MB sau khi S9 xong).

### 2.7 Attempt5 (22:43–22:58Z) — HOÃN ở gate A (15 poll), không chạy probe

- Gate0 PASS (S5 đã có JSON; cờ NO-CHANGE còn hiệu lực).
- Gate A 15 poll KHÔNG MỞ: RAM dao động 563–1014 MB, chỉ 1 lần
  chạm 1279 MB (poll 8 — đúng lúc S10 đang giữ lock, không đo
  được); S10 giữ lock 2 lần trong lúc chờ (port 5555 rồi 5554).
  Thấp nhất load1=0,00 / load5=0,15 — CPU yên tuyệt đối nhưng RAM
  không qua ngưỡng. Exit 5 đúng luật.
- Sau attempt5, S6 dừng đo (ngân sách lượt cron còn ~35 phút, không
  đủ cho thêm một lượt gate dài + phân tích + LIMITS + batch): đóng
  với 1 lượt có dữ liệu (attempt1).

## 3. (A) Event seek — TÁI HIỆN 4 LẦN ĐỘC LẬP (lượt nhiễm tải)

| | S6 attempt1 (lượt nhiễm, cây 03bf029f) | R6 attempt5 (lượt yên) | Q5 lần 3 (lượt nhiễm) |
|---|---|---|---|
| Snapshot label-0 phân biệt (theo labelMs) | **19** (20 seek; snapshot pass 20 chưa từng được dùng trong blend tick — xem §4.1) | 20 | 20 |
| Snapshot label-0 STALE (M≠0) | **4** | 0 | 1 (M=68) |
| Tỉ lệ stale/seek | **4/19 = 21,1%** (4/20 seek = 20,0%) | 0/20 = 0,0% | 1/20 = 5,0% |
| (b) lag ≥+5f dạng SEEK (label 0 đứng yên) | **37 occ, 3 event hậu flip** (+ 11 occ tiền flip của pass 2) | 0 occ | 7 occ, 1 event |
| (b) lag ≥+5f dạng P4 (label chạy) | **0 occ** | 20 occ, 3 event | 0 |

Chi tiết 4 snapshot stale (đều label 0, pixels đóng băng một frame muộn
của pass trước, skp cả 0 lẫn 1):

| # | labelMs / snapMs | M | Pass | First-use (seq / tBlend / ms / occ) | Presented | skp | Pass trước: lastDrawn / lastFrame / maxFrameIdx | Δ M−lastDrawn |
|---|---|---|---|---|---|---|---|---|
| 1 | 54915 / 55100 | 70 | 2 (tiền flip) | 11 / 56624–57726 / 1102 / 11 | 21→24 | [0,1] | 70 / 70 / 69 | **0** |
| 2 | 93506 / 93700 | 61 | 7 | 68 / 95922–97617 / 1695 / 15 | 20→22 | [0,1] | 21 / 21 / 78 | **+40** |
| 3 | 138234 / 138436 | 76 | 14 | 142 / 140619–142736 / 2117 / 15 | 24→27 | [0,1] | 35 / 35 / 56 | **+41** |
| 4 | 151725 / 151915 | 68 | 16 | 159 / 153002–153921 / 919 / 7 | 26→28 | [0,1] | 27 / 27 / 86 | **+41** |

- Cả 4 snapshot đều capture trong tick **mask-direct frameIdx 0**
  (total 194/200/214/201 ms; labelCt=0, rawCt=0 — `currentTime` đã
  đọc 0 lúc lấy mẫu) mà pixels vẫn là frame cũ. Xem §5.
- Gộp toàn chuỗi (cùng cây 03bf029f, cùng protocol 20 pass):
  **5/60 seek stale (8,3%; CI 95% Clopper-Pearson ~2,8%–18,4%)**;
  chia theo điều kiện: **nhiễm tải 5/40 (12,5%; ~4,3%–27,0%)** vs
  **yên 0/20 (0,0%)**. Fisher một phía (nhiễm vs yên) p≈0,12 —
  chênh lệch CHƯA có ý nghĩa thống kê; không được đọc thành "tải gây
  ra stale" hay "yên thì hết stale". Chỉ được nói: mọi quan sát stale
  tới nay đều ở lượt nhiễm tải.
- Theo quy tắc prereg §4: nhánh "0/80" ĐÃ CHẾT (đã có 4 stale mới);
  nhánh "≥1 stale trên lượt yên" KHÔNG xảy ra (không có lượt yên
  thứ hai). Verdict đúng prereg: **event seek là có thật và tái hiện
  được (5 quan sát độc lập trên 3 lượt nhiễm: Q5 ×1, S6att1 ×4),
  cơ chế riêng cho seek CHƯA chốt (mô hình delta chưa sạch — xem
  §4), H-D (seek) CHƯA phân biệt được — nợ thêm lượt yên**.

## 4. Cơ chế — M là frame nào? (xác minh độc lập từ JSON thô)

### 4.1 Mapping pass ĐÚNG (bất chấp cảnh báo 19 ≠ 20 pass-start)

- Analyzer cảnh báo 19 pass-start (ringSize==1) ≠ 20 pass trong
  JSON. S6 kiểm trực tiếp: cặp start seq 130/132 đều là start thật
  (cách nhau 5,8 s wall; mỗi cái theo sau là tick ring 2; pass 13
  chỉ có 2 blend tick vì phần lớn rAF của nó không sinh blend
  tick). Start còn thiếu là của **pass 20** (tick đầu của nó không
  có ringSize==1) — nên mapping các pass 1–19 là ĐÚNG, chỉ pass 20
  thiếu snapshot trong bảng (D). Cả 4 snapshot stale đều được dùng
  lần đầu ĐÚNG tại tick start của pass mình (seq 11/68/142/159).
  Các delta ở §3 đã đối chiếu lại với `b["dbg"]` theo từng pass —
  khớp với analyzer.
- Số blend tick thấp (203 vs 508 của R6) là do tick chậm dưới tải:
  probe log ghi 402 khung rAF/20 pass nhưng chỉ 203 tick sinh
  blend entry; tickCost 98–503 ms (R6 ~91 ms); probe mất ~180 s
  thay vì ~80 s. Đây là hệ quả của tải, không phải lỗi probe
  (probe_exit=0, pageErrs=0).

### 4.2 M so với 2 ứng viên "frame cuối pass trước"

| # | M | lastDrawn pass trước (Δ) | presented tick blend cuối trước capture (Δ M−presented) |
|---|---|---|---|
| 1 | 70 | 70 (**0**) | seq 10: presented 70, ct 2,3333 (**0**) |
| 2 | 61 | 21 (**+40**) | seq 67: presented 62, ct 2,0667 (**−1**) |
| 3 | 76 | 35 (**+41**) | seq 141: presented 85, ct 2,8333 (**−9**) |
| 4 | 68 | 27 (**+41**) | seq 158: presented 33, ct 1,1000 (**+35**; cách capture 2592 ms, không có blend tick ở giữa) |

- **"M ≈ lastDrawn" CHỈ đúng 1/4.** Ba lần còn lại lệch đúng
  +40/+41 — trùng nhau một cách đáng ngờ, nhưng +40/41 không phải
  hằng số vật lý hiển nhiên (không phải độ dài clip 90f, không phải
  keyframe — keyframe tại 0/25/50/75). S6 KHÔNG đặt tên cho +40/41.
- **"M ≈ presented ngay trước capture" cũng không sạch:** lệch
  0/−1/−9/+35. Lệch −9 (stale #3) và +35 (stale #4) cho thấy frame
  decoder yield lúc capture có lúc CHẬM hơn currentTime (~9f, decoder
  đói dưới tải), có lúc NHANH hơn hẳn (capture cách tick trước 2,6 s
  không có blend tick nào ở giữa — video đã chạy tiếp trong khoảng
  trống đó mà không vẽ).
- Diễn giải được ủng hộ nhất (chưa chứng minh, cần đo trực tiếp):
  **M = frame decoder yield gần nhất lúc capture (rawMs).** Dưới
  tải, decoder và currentTime lệch nhau với biên độ thay đổi theo
  thời điểm (±~40f); snapshot gán nhãn theo currentTime (= 0 sau
  seek) nên mọi lệch đều hiện thành ghost stale. Đây là cùng cơ chế
  tổng quát R6 §5 ("video yield frame đi trước currentTime"), mở
  rộng thêm chiều "decoder có lúc chậm hơn currentTime" (stale #3,
  M < presented). Hướng đo tiếp: so frame decoder yield với
  `currentTime` tại thời điểm capture (đọc `rvfcCaptureFrame` /
  `updateMotionBlurSnapshots` kỹ hơn, hoặc thêm mốc đo yield-frame)
  — nợ cho đợt sau, không tự suy thêm.

### 4.3 Độ tin cậy match — KHÔNG phải artifact matching

- **406/406 ghost entry unique-match, 0 nomatch, 0 multi-match**
  (kiểm lại độc lập bằng logic match của analyzer). Khoảng cách tới
  frame nhì: tối thiểu 6 bit, trung vị 10 bit (ngưỡng ≤2 bit) — các
  M 70/61/76/68 là thật, không phải nhiễu threshold.
- Mỗi stale tồn tại 7–15 occurrence liên tiếp với cùng M, label 0
  đứng yên, presented chạy tiếp — chữ ký giống hệt event Q5 (7 occ,
  327 ms), chỉ dài hơn (919–2117 ms) và lag lớn hơn (+61..+76f so
  với +68f của Q5).

## 5. (B) Event kiểu P4 — KHÔNG tái hiện trong attempt1

- 37 occurrence lag ≥+5f, TẤT CẢ đều label 0 (kiểu seek). **0
  occurrence kiểu P4** (label chạy, pixels đứng yên) — khác hẳn R6
  (20 occ, 3 event trên lượt yên).
- Tally P4-type sau 4 lượt (cùng cây, cùng protocol): P4 1 lần +
  Q5 0 + R6 2 rõ + 1 nhỏ + S6att1 0. Cơ chế tổng quát (yield-ahead
  mid-pass) vẫn chỉ có bằng chứng tái hiện ở P4 + R6; S6 không cộng
  thêm cũng không trừ đi — ghi đúng số, theo dõi tiếp.
- Không occurrence nào có label==presented — các ghost stale này
  KHÔNG phải ứng viên vi phạm bar F6' (1)/(2). S6 không đo lại bar
  F6' (nhiệm vụ R5 đợt 115, đã đóng).

## 6. Đánh giá lại 4 giả thuyết (theo quy tắc prereg §4)

| Giả thuyết | Verdict sau lượt này | Căn cứ |
|---|---|---|
| **H-A** — Seek reset label nhưng pixels ghost sót từ pass trước | **ĐƯỢC ỦNG HỘ MẠNH về bản chất; mô hình delta CHƯA CHỐT** | 4 lần tái hiện độc lập trong 1 lượt + 1 lần Q5 = 5 quan sát: label 0 + pixels là frame muộn của pass trước, capture sau khi currentTime đã = 0. Nhưng "frame cuối pass trước" chỉ đúng 1/4 (Δ 0/+40/+41/+41) — cần đo yield-frame trực tiếp mới chốt được M là frame nào (§4.2). |
| **H-B** — Liên quan fix E4 steady-close | **BỊ YẾU thêm (không còn ưu tiên)** | Cả 4 event stale đều có occurrence ở skp=0 VÀ skp=1 (như Q5). Divergence xảy ra mà không cần skip/steady-close. Chưa bác hẳn (cần A/B cây cũ) nhưng hướng này tụt hẳn ưu tiên. |
| **H-C** — Seek chưa vẽ lại ghost | **Dạng seek BỊ YẾU (chưa bác hẳn)** | Cả 4 snapshot stale đều được capture MỚI sau seek (tick mask-direct frameIdx 0, rawCt=0) mà pixels vẫn sai — lỗi ở capture/yield chứ không phải "không có lần vẽ lại nào". Dạng tổng quát đã bị bác ở R6. |
| **H-D** — Sự kiện đơn lẻ do lượt nhiễm tải | **CHƯA phân biệt được cho seek; KHÔNG còn là "đơn lẻ"** | "Đơn lẻ" đã chết: 5 quan sát trên 2 lượt nhiễm độc lập. Nhưng "tải là điều kiện cần" chưa phân biệt được: nhiễm 5/40 vs yên 0/20, Fisher p≈0,12 — thiếu power (cần thêm lượt yên; mục tiêu ≥80 seek tổng chưa đạt, mới 60). |

**Ưu tiên sửa:** CAO (tăng từ TRUNG BÌNH ở R6). Event seek stale
không còn là quan sát đơn lẻ: tái hiện 4/20 seek trên lượt nhiễm
(21%), 5/40 gộp các lượt nhiễm (12,5%). Hướng sửa ứng viên (như R6
§6, nay có thêm 4 bằng chứng): gán nhãn snapshot theo frame thực sự
được yield thay vì `currentTime`, hoặc loại/đánh dấu snapshot khi
frame yield lệch `currentTime` quá ngưỡng — luồng sửa riêng quyết
định sau khi có đo yield-frame trực tiếp (§4.2). Không sửa E4
steady-close cho vấn đề này (H-B đã yếu).

## 7. Kiểm chứng hồi quy (cây đo `03bf029f…`, sau lượt đo attempt1)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0**
  (log `tsc-s6.log`, chạy 22:59Z sau attempt5).
- `ghostBlend.probe.test.ts`: **15/15 PASS** (log
  `ghostblend-s6.log`, chạy bằng `node --experimental-strip-types
  --test`; exit 0).
- `vite build`: KHÔNG chạy lại — cây `03bf029f…` đã build PASS ở N1
  đợt 112 + R10 gộp muộn đợt 115 (suite 27/27); S6 không sửa
  production (md5 không đổi); ghi rõ để khỏi hiểu là đã chạy.
- preview.tsx md5 `03bf029f…` không đổi trong suốt lượt đo +
  hồi quy. Không sửa file production nào.

## 8. Sự cố hạ tầng trong lúc đo (đã xử lý, không mất dữ liệu đo attempt1)

1. **Lỗi kiểm cờ của S6** (grep NO-CHANGE dương tính giả) — hủy
   attempt1-lần-1 an toàn ở gate A, sửa script, bổ sung prereg §6
   (§1). Không mất dữ liệu (chưa đo).
2. **S2 đổi cây rồi revert** (03bf029f → 9b724e69 → 03bf029f, cờ
   NO-CHANGE 21:31:05Z): S6 đo trên cây Q5/R6, so được trực tiếp.
3. **Hog CPU của S3 (s78b) trong cửa sổ attempt1** (12 hog, load1
   tới 6,95) — attempt1 thành lượt nhiễm; S6 không chen, không
   can thiệp; ghi đúng lớp B.
4. **Reboot #49 (~21:46Z)** giết attempt2/3 ở gate0 (replay chưa
   xong); lock S3 sót lại được dọn bằng stale-recovery v2. Mù chứa
   #49 thuộc luồng khác.
5. **RAM ngoài cell kẹt ~510 MB** (22:37–22:43Z, swap đã dùng
   453 MB/1 GB) làm attempt4/5 không mở được gate A dù CPU yên
   hẳn (load1 thấp nhất 0,00–0,06). Đây là nghẽn hạ tầng mới cần
   parent biết: lượt yên sau reboot #49 bị chặn bởi RAM, không
   phải CPU.
6. **Service restart** giữa lúc S6 kiểm match-health (2 lệnh trùng
   nhau cùng bị hủy, chỉ đọc, không ghi gì) — chạy lại 1 lần, kết
   quả 406/406 unique-match (§4.3).
7. **Không có vite mồ côi.** Attempt1: lock acquire 1 lần, nhả
   sạch; kill-vite pid node chết, ps sạch, curl :5184 = 000.
   Attempt4/5 không giữ lock lần nào.

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND116_S6_GHOSTSEEK_LIMITS.md` — file này. **File
  duy nhất trong repo mà S6 thay đổi** (probe/analyzer/run-script/
  prereg/dữ liệu đo đều ở hidden_files; probe + analyzer là copy
  R6 đã stage ở đợt 115 nên KHÔNG stage lại; mp4 fixture là binary
  local-only đã có từ M5, KHÔNG stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round116-s6-ghostseek.txt`
  (NUL-delimited, đã đọc lại xác nhận; 1 entry: LIMITS).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round116-s6/`
  (prereg-s6.md [kèm bổ sung §6/§7], probe116s6-ghost-k7.webkit.mjs
  [copy R6, md5 `a690d828…`], analyze-s6-ghostseek.py [copy R6, md5
  `5ecfe429…`], analyze-s6-lag5.py [copy R6], b.json [md5
  `078938cf…`], vite.s6-temp.config.mjs, run-s6.sh [đã sửa giữa
  chừng: kiểm cờ cây `^status: NO-CHANGE` + md5 trực tiếp — xem §1],
  poll-s6.log, chain-s6.log, postboot-s6-attempt2/3-gate0.log,
  ghostseek-attempt1.txt, preview-b-f3-flip-webkit-s6-attempt1.json
  (1.585.125 byte, 20 pass), ps-before/after-s6-attempt1.txt,
  load-mid-s6-attempt1.log, run-webkit-s6-attempt1.log,
  vite-5184-s6-attempt1.log, run-s6-attempt{1,2,3,4,5}.nohup.log,
  tsc-s6.log, ghostblend-s6.log).
- Cờ xong: `hidden_files/round116-s6-done` (tạo SAU KHI LIMITS +
  batch xong).

## 10. Nợ mở + đề xuất cho đợt sau

1. **Tổng seek mới 60/80 (Q5 20 + R6 20 + S6att1 20), stale 5/60.**
   Cần thêm ≥20 seek trên LƯỢT YÊN SẠCH để phân biệt H-D (seek):
   nếu yên mà stale ≥1 → H-D (seek) BỊ BÁC; nếu yên 0/20 nữa (gộp
   yên 0/40 vs nhiễm 5/40, Fisher p≈0,03) → H-D được ủng hộ có ý
   nghĩa. Đây là nợ #1 — ưu tiên cao nhất của hướng này.
2. **Đo yield-frame trực tiếp:** M là frame nào lúc capture (decoder
   yield vs currentTime)? Cần mốc đo trong `rvfcCaptureFrame` /
   `updateMotionBlurSnapshots` (luồng chẩn đoán riêng, chỉ đọc hoặc
   probe/config — không sửa production để test nếu chưa duyệt).
3. **Event kiểu P4:** không tái hiện ở S6 (tally 3 rõ + 1 nhỏ / 4
   lượt). Theo dõi tiếp; nếu P4 tái hiện thêm thì cơ chế tổng quát
   đủ 4 lần độc lập.
4. **Hạ tầng lượt yên sau reboot:** RAM ngoài cell kẹt ~510 MB
   (swap 453 MB đã dùng) chặn gate A dù CPU yên — parent cân nhắc:
   (a) hạ ngưỡng RAM gate A khi CPU yên hẳn (quyết parent, sửa
   prereg trước khi đo); (b) chờ RAM hồi ở lượt cron sau; (c) đo ở
   RAM thấp với caveat rõ ràng (prereg §3 đã cho phép nhưng script
   hiện chặn — cần sửa script + bổ sung prereg trước khi đo).
   Replay sau reboot #49 mất ~25 phút (dài hơn ước tính 17 phút).
5. **Mù #33/#34 + #49:** bookkeeping thuộc luồng khác; S6 không đụng.
6. **H-B (E4):** tụt hẳn ưu tiên; chỉ quay lại nếu có bằng chứng mới
   gắn divergence với steady-close/skip. **G1 + mù chờ user quyết,
   ci-security.yml vẫn 403 chờ user, birefnet 0 lần, TTS 39 CẤM
   kiểm lại, release gate không đổi.**

# PHASE9_ROUND114_Q5_F6P60MS_LIMITS — F6' WebKit ≤60 ms: lượt yên XÁC NHẬN (KHÔNG đạt lớp B mới — không dùng để chốt ngưỡng)

> Luồng Q5, đợt 114, lượt cron 21:35 +07 14/11/2026 (bắt đầu ~14:45Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ LIMITS gộp đợt 113 §10.6 (từ P4 đợt 113): 1 lượt yên xác nhận để
> chốt ngưỡng WebKit ≤60 ms (P4: median 61,0, lượt không đạt lớp B cũ
> vì P3 chen giữa; N4: median 58,0, MỎNG) — chờ máy thật yên CẢ LƯỢT.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không đụng
> TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính (4 ý, đọc kỹ trước khi dùng số):**
> 1. **Lượt đo lần 3 (lượt duy nhất chạy xong) KHÔNG ĐẠT LỚP B (MỚI) —
>    KHÔNG dùng để chốt ngưỡng, không cố diễn giải.** Replay apt hệ
>    thống (os-intent) cài package TRONG SUỐT cửa sổ đo (ps-before:
>    `apt-get install libpipewire-0.3-common`, ps-after:
>    `apt-get install fonts-ipafont-gothic`; khung postboot Q7: FAIL
>    cuối 15:46:12Z → PASS đầu 15:51:57Z, bao trọn cửa sổ đo
>    15:47:45–15:49:12Z; load1 tăng 1,88 → 2,80 trong lượt) — vi phạm
>    mục B2-mới ("không có bằng chứng ... TẢI trong cửa sổ đo").
>    Không có luồng round114 nào chạy phân tích nặng (chỉ poller/
>    driver đang sleep; 0 file round114-* khác sửa trong cửa sổ), và
>    load1 đầu/cuối đều < 4 — nhưng tải hệ thống là tải, và load1
>    giữa lượt không được lấy mẫu nên điều kiện "<4" cũng KHÔNG kiểm
>    chứng đầy đủ. **Ngưỡng WebKit ≤60 ms giữ nguyên trạng thái N4:
>    GIỮ nhưng MỎNG, nợ lượt yên xác nhận chuyển tiếp sang đợt sau.**
> 2. **Số đo lần 3 (báo cáo đầy đủ, không dùng để chốt): tickCost total
>    median 70,0 ms (n=479), p90 96,0, max 207** — vượt bar 10 ms.
>    Median hậu flip+2000ms còn cao hơn: 74,0 (n=340). Phân rã theo
>    dải wallMs (đã đăng ký trước trong prereg-q5): warm-up 0–20k
>    chỉ 52,0 (nhanh hẳn so với P4: 86,5 — ủng hộ giả thuyết RAM,
>    lần này RAM đầu lượt 1413 MB so với P4 522 MB); dải giữa-cuối
>    45–70k tăng lên 79,0–79,5; đuôi 70–80k hạ về 60,5. Mẫu này
>    nhất quán với tải replay giữa lượt — nhưng vì lượt không đạt
>    lớp B, Q5 KHÔNG dùng các lát cắt này để chốt hay hiệu chuẩn lại
>    ngưỡng. Định nghĩa số đo chính theo prereg vẫn là median TOÀN
>    LƯỢT, và lượt này không đủ điều kiện áp dụng quy tắc quyết định.
> 3. **(b) unique-match có 1 sự kiện MỚI so với toàn bộ chuỗi trước:
>    ghost stale SAU SEEK lần đầu xuất hiện** — 7 occurrence lag
>    +68f (cả 2 skp), cùng 1 event (seq 282–285, tBlend 58606–58933,
>    327 ms): label 0, pixels đứng yên ở frame 68 trong khi presented
>    chạy 18→20. Đúng mẫu "label 0 / pixels 67–76" mà P4/N4/M5 đều
>    ghi 0. Sự kiện này KHÁC event frame-26 của P4 (lag +6..+12f,
>    nhãn chạy 14→20) — không phải tái hiện event P4. Nó KHÔNG vi
>    phạm bar F6' (label 0 ≠ presented 18–20) nhưng là bằng chứng
>    pixel-trực-tiếp đầu tiên về ghost stale sau seek. Xem §3.1.1.
> 4. **F6' vẫn đứng trên nhãn + cây hiện tại:** (1)/(2) 67/67 (skp=1)
>    và 218/218 (skp=0), 0 ứng viên ghost label==presented,
>    presented−expected |gap|≤3: 285/285 (đều =0). **F6' vẫn ĐÃ ĐÓNG
>    từ L7 — Q5 không đóng lại, không mở lại.**

## 0. Môi trường đo + prereg + cây đo

- **Boot trong lúc đo lần 3: 2026-11-14 15:44:49Z = reboot #46** (sau
  #45 13:17:42Z; gap #45→#46 = 2h27'07", không phá sàn — số thứ tự
  #46 do Q7 đợt 114 xác nhận qua `q7-postboot-b46-try1.log` + early
  watch; Q5 đối chiếu `uptime -s` khớp). Q5 KHÔNG chạy lại
  postboot-check (không phải nhiệm vụ luồng này); chỉ ghi nhận boot
  + kiểm WebKit launch được qua chính probe. Postboot #46: try1 của
  Q7 FAIL ngay sau boot (thiếu libevent/libavif/libevdev +
  isomp4/libav), try2 PASS lúc 15:51:57Z — khung replay FAIL cuối
  15:46:12Z → PASS đầu 15:51:57Z bao trọn cửa sổ đo lần 3 (§1.2).
- **Prereg:** `hidden_files/round114-q5/prereg-q5.md` — viết TRƯỚC
  lượt đo (14:47Z), đăng ký: định nghĩa lượt yên THEO QUYẾT PARENT
  MỚI (cửa sổ đo = tick đầu → tick cuối; chỉ phân tích nặng/tải mới
  vi phạm lớp B, ghi file nhẹ KHÔNG vi phạm), phân rã tickCost theo
  dải wallMs ĐĂNG KÝ TRƯỚC (P4 làm sau khi thấy số — Q5 đăng ký
  trước), quy tắc quyết định ngưỡng, kế hoạch theo dõi stale-ghost
  seq 220–223. Q5 tuân thủ đúng prereg này — xem §1.
- **Cây đo `03bf029f…`** (= cây P4 đợt 113 = cây N1 đợt 112, fix E4
  steady-close) — CÙNG cây P4 đo. preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b` kiểm trước/sau mỗi lần đo — KHÔNG
  ĐỔI trong cả 3 lần (03bf029f → 03bf029f). Q5 không sửa production.
  Mọi so sánh số với N4/M5 trong file này đều mang caveat "cây đo
  đã đổi so với N4" (cây N4: `c4198206…`).
- **Fixture `stripes-nonperiodic.mp4` còn trên đĩa, md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5** (cả
  `apps/web/public/` lẫn `hidden_files/round111-m5/`). GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn từ round111-m5.
  Mp4 là binary local-only, KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb :193 (lần 3; lần 1 :193, lần 2 :194). Env launch GST như
  M5/L7/N4/P4.
- **RAM khả dụng:** dao động mạnh cả đợt — 497 MB (14:43Z) → 1055 MB
  (14:45Z, lúc ghi prereg) → 686 MB (lúc bắt đầu lần 1) → 436 MB
  (lúc bắt đầu lần 2) → **1413 MB (lúc bắt đầu lần 3) → 1563 MB
  (lúc kết thúc lần 3)**. Lần 3 là lần duy nhất RAM đầu lượt ≥1 GB
  (và cao nhất từ đầu đợt) — caveat RAM KHÔNG áp dụng cho lần 3.
  Birefnet KHÔNG chạy (không phải nhiệm vụ luồng này; RAM dưới
  ngưỡng guard 6 GB trong mọi lần đo).

## 1. Ba lần đo — chỉ lần 3 chạy xong, và lần 3 KHÔNG đạt lớp B (mới)

### 1.1 Lần 1 (14:48:24–14:48:29Z, boot #45): WebKit không launch được

- Gate lớp A ĐẠT ngay poll 1 (load 0,63/0,56, không lock, không
  blocker; RAM 692 MB — dưới 1 GB, đã ghi caveat).
- Probe chết ngay lúc launch: `MiniBrowser: error while loading
  shared libraries: libevent-2.1.so.7: cannot open shared object
  file`. Lib chỉ có trong debroot tạm (`~/workspace/tmp-q6r3-debroot`)
  + `/opt/hatch-image/bin/rtc-sidecar-lib`, KHÔNG có trong
  `/usr/lib/x86_64-linux-gnu/` (chỉ có `libevent_core`). Khớp LIMITS
  gộp đợt 113: postboot #45 FAIL apt replay.
- Q7 đợt 114 ĐANG chạy `vcut-webkit-postboot-check.sh --repair`
  (`apt-get update` đang chạy lúc 14:50Z) — Q5 KHÔNG tự chạy apt
  (tránh đụng Q7 + không chạy lệnh hệ thống nguy hiểm), chờ lib
  xuất hiện (poll 60 s, tối đa 30 phút). Lib xuất hiện 15:01:32Z
  (poll 10; Q7 log: `apt-get update OK`).
- Vite lock nhả sạch, vite kill sạch (exit 1, không có JSON output).

### 1.2 Lần 2 (15:02:01–15:12:02Z gate + 15:12–15:45:10Z probe, boot #45): gate không mở + reboot giết giữa chừng

- Gate 10 poll / 10 phút KHÔNG MỞ lần nào (load1 tới 7,60, load5
  tới 4,14, blockers 3 lúc đầu — các luồng round114 khác đang chạy
  nặng). Theo prereg, Q5 chạy ở tải thấp nhất quan sát được và ghi
  rõ: bắt đầu 15:12:02Z, load 0,64/2,30, RAM 436 MB, gate_ok=0 —
  **lần 2 KHÔNG phải lượt yên ngay cả nếu chạy xong**.
- Probe chạy được 11/20 pass thì **reboot #46 lúc 15:44:49Z** giết
  phiên exec (SIGTERM trong lúc shutdown; trap cleanup chạy được:
  vite kill sạch, lock nhả sạch 15:45:10Z). Không có file JSON
  output. Không phải lỗi probe.
- Bài học ghi nhận: lần 2 chứng minh poll 10 phút là không đủ khi
  các luồng khác đang pha nặng; lần 3 thành công nhờ chạy ngay sau
  reboot, khi các luồng khác còn đang khởi động lại (Q3 IDLE chờ cờ
  Q5; Q9 poller restart; Q4/Q6 đã xong).

### 1.3 Lần 3 (15:47:45–15:49:12Z, boot #46): chạy xong 20/20 — KHÔNG ĐẠT LỚP B (MỚI)

#### Lớp A (gate lúc bắt đầu): ĐẠT ngay poll 1

| Điều kiện gate (prereg) | Lúc bắt đầu probe 15:47:45Z |
|---|---|
| load1 < 2 | 1,88 ✓ |
| load5 < 2 | 1,21 ✓ |
| vite.lock luồng khác | không ✓ |
| blocker process | 0 ✓ |
| RAM khả dụng | 1413 MB ✓ (≥1 GB, cao nhất từ đầu đợt) |

Không có process round114 nào chạy phân tích nặng lúc gate (ps
trước đó 15:47:04Z: không có python/node/vite/tsc/hog nào của
luồng khác). Các thư mục round114-q1/q2/q3/q7/q8/q9 đã tồn tại
nhưng các luồng đó đang ở pha chờ/khởi động lại sau reboot #46.

#### Lớp B (mới) — xác nhận yên cả lượt: VI PHẠM — mục B2

Cửa sổ đo (định nghĩa mới) = tick đầu → tick cuối, 15:47:45–
15:49:12Z (~87 s, wallMs 0–~80k).

| Mục lớp B (mới, prereg-q5) | Kết quả |
|---|---|
| (B1) load5 lúc kết thúc ≤ 2,5 | **1,64 ✓** (load cuối 2,80 / 1,64 / 0,71) |
| (B2) không bằng chứng luồng khác chạy phân tích nặng / TẢI trong cửa sổ đo; load1 không vượt 4 trong cửa sổ | **✗ VI PHẠM** (xem dưới) |
| (B2-ghi-nhẹ) ghi file nhẹ của luồng khác trong cửa sổ | **✓ không vi phạm** (0 file round114-* khác sửa trong cửa sổ — đúng định nghĩa mới) |
| (B3) không reboot; vite.lock chỉ do Q5 giữ | **✓** (boot #46 15:44:49Z suốt lượt; lock acquire 1 lần thành công ngay, nhả sạch) |

**Bằng chứng vi phạm B2 (3 điểm, đều về TẢI HỆ THỐNG, không phải luồng round114):**

1. **Replay apt hệ thống (os-intent) cài package TRONG SUỐT cửa
   sổ đo.** ps-before (15:47:45Z): PID 768 (replay `sh -c`) +
   PID 5399 `apt-get install libpipewire-0.3-common`; ps-after
   (15:49:12Z): PID 768 + PID 6985 `apt-get install
   fonts-ipafont-gothic` — package KHÁC NHAU ở 2 đầu, chứng tỏ
   replay đã cài qua nhiều package trong 87 s của cửa sổ đo.
   Replay chạy `nice -n 10 ionice -c3` (ưu tiên thấp) nhưng vẫn là
   tải CPU + I/O thật (dpkg unpack) trên cell 1,5 CPU.
2. **Khung postboot của Q7 bao trọn cửa sổ đo.** Q7 early-watch
   boot #46: try1 FAIL cuối 15:46:12Z (boot mới 1'23" tuổi, thiếu
   libevent/libavif/libevdev + isomp4/libav) → try2 PASS đầu
   15:51:57Z. Cửa sổ đo 15:47:45–15:49:12Z nằm HOÀN TOÀN trong
   khoảng replay chưa xong này.
3. **Load tăng trong lượt + máy không ổn định ngay sau lượt.**
   load1 1,88 → 2,80, load5 1,21 → 1,64 trong 87 s. Load1 lúc
   15:52:18Z (Q3 log, ngay sau lượt) đã lên **6,03** — máy đang
   bận lên ngay sau cửa sổ đo (các luồng khác resume + đuôi
   replay). Load1 GIỮA lượt không được lấy mẫu (Q5 chỉ có số
   đầu/cuối) nên điều kiện con "load1 không vượt 4" cũng KHÔNG
   kiểm chứng đầy đủ — ghi rõ như một thiếu sót bằng chứng, không
   tự cho là đạt.

**Sự thật giảm nhẹ (ghi rõ, nhưng KHÔNG dùng để lật verdict):**
- Không có luồng round114 nào chạy phân tích nặng trong cửa sổ:
  ps-before/ps-after không có python analyzer / tsc / vite / node
  probe / hog nào ngoài Q5; các process round114 khác còn sống đều
  đang sleep chờ (Q9 poller `sleep 300`, Q7 early-watch `sleep
  240`, Q3 driver `sleep 115`, Q3 status IDLE chờ cờ Q5).
  0 file trong các thư mục `hidden_files/round114-*` khác được sửa
  (mtime) trong cửa sổ đo — theo định nghĩa mới, ghi file nhẹ
  không vi phạm (và lần này cũng không có ghi nào).
- Dù vậy, prereg-q5 viết rõ: "Nếu lớp B (mới) VI PHẠM (bất kỳ mục
  nào): lượt này KHÔNG đạt điều kiện yên — GHI RÕ, KHÔNG dùng để
  chốt ngưỡng, không cố diễn giải". Q5 tuân thủ đúng chữ prereg đã
  đăng ký trước khi thấy số — không tự diễn giải lại sau khi thấy
  median 70,0. **Verdict ngưỡng giữ nguyên trạng thái N4.**
- Tiền lệ P4 còn chặt hơn: P4 từ chối diễn giải median 61,0 chỉ
  vì P3 ghi prereg/log (ghi file nhẹ). Lần 3 của Q5 nhiễm NẶNG
  hơn thế (cài package hệ thống + load tăng) — càng không có cơ
  sở để diễn giải.

### 1.4 Số đo tickCost lần 3 (báo cáo đầy đủ, không dùng để chốt)

| Lượt | Fixture | Cây đo | Tải | tickCost median | p90 | max | tBlend gap median | BlendTick/pass | rAF/pass median |
|---|---|---|---|---|---|---|---|---|---|
| L7 yên (đợt 110) | tuần hoàn | cũ | 0 hog, gate yên | **40,5** | 64,9 | 94 | 77 | 19,5 | — |
| N1 (M5) | không tuần hoàn | c4198206 | 0 hog, chưa thật yên (load5 3,58) | **50,0** | 80,1 | 115 | 92 | 22,2 | 34 |
| Q1 (N4) | không tuần hoàn | c4198206 | 0 hog, gate yên lúc bắt đầu, tải trôi lên giữa lượt | **58,0** | **79,0** | 121 | 96 | 21,9 | 34 |
| Q1 (P4) | không tuần hoàn | 03bf029f | 0 hog, gate yên lúc bắt đầu, P3 bắt đầu giữa lượt (B2 cũ vi phạm) | **61,0** | **92,0** | **176** | **101** | **21,2** | **32** |
| **Q1 (Q5 lần 3)** | **không tuần hoàn** | **03bf029f** | **0 hog, gate yên lúc bắt đầu, replay apt hệ thống cài package suốt cửa sổ (B2 mới vi phạm)** | **70,0** | **96,0** | **207** | **109** | **20,1** | **30** |
| K7 tải (đợt 109) | tuần hoàn | cũ | tải luồng khác | **66,0** | 103,5 | 194 | 112 | 20,3 | — |
| N2 (M5) | không tuần hoàn | c4198206 | 1 hog | **86,0** | 105,0 | 271 | 122 | 17,1 | 27 |
| N3 (M5) | không tuần hoàn | c4198206 | 3 hog | **167,0** | 253,2 | 520 | 279 | 10,2 | 20 |

- Q5 lần 3: tickCost total n=479, median **70,0**, p90 96,0, max 207,
  min 29; hậu flip+2000ms n=340, median **74,0** (cao hơn cả median
  toàn lượt — ngược với P4 58,0 < 61,0 và N4). tBlend gap n=401,
  median 109,0, p90 181,0, max 2003. BlendTick/pass 20,1; rAF/pass
  median 30 (min 23, max 38). pageErrs [].
- **Phân rã theo dải wallMs (ĐÃ ĐĂNG KÝ TRƯỚC trong prereg-q5,
  cùng biên dải với P4 §1.3):**

  | Dải wallMs | Q5 lần 3 (n / median) | P4 Q1 (n / median) | N4 Q1 (n / median) |
  |---|---|---|---|
  | 0–20k (warm-up, pass ~1–2) | 75 / **52,0** | 48 / 86,5 | 72 / 56,5 |
  | 20–32k (pre-flip cuối) | 86 / **65,0** | 76 / 68,5 | 107 / 60,0 |
  | 32–45k (hậu flip) | 95 / **59,0** | 110 / 49,5 | 115 / 53,0 |
  | 45–62k (giữa lượt) | 105 / **79,0** | 143 / 56,0 | 139 / 58,0 |
  | 62–70k | 56 / **79,5** | 58 / 61,0 | 68 / 59,0 |
  | 70–80k (đuôi lượt) | 62 / **60,5** | 74 / 66,5 | 36 / 57,5 |

- Đọc số (không kết luận vượt prereg): warm-up lần này NHANH
  (52,0 so với P4 86,5) — nhất quán với giả thuyết RAM của P4
  (RAM đầu lượt 1413 MB so với P4 522 MB; N4 56,5 với RAM 1089 MB
  cũng cùng hướng). Nhưng dải giữa lượt 45–70k vọt lên 79,0–79,5
  trong khi đầu (52,0–65,0) và đuôi (60,5) thấp hơn — mẫu này
  KHÔNG giống P4 (tăng dần đều về đuôi) mà giống tải chen vào
  giữa lượt (đúng lúc replay cài package). **Vì lượt không đạt
  lớp B, Q5 KHÔNG dùng các lát cắt này để chốt hay hiệu chuẩn lại
  ngưỡng** — chỉ ghi lại để đợt sau đối chiếu.
- Phụ chứng p90 ≤90 ms: Q5 p90 96,0 > 90 — trên lượt này, phụ chứng
  KHÔNG tách được lượt này khỏi các lượt tải (K7 p90 103,5).
  Ghi rõ như một điểm yếu thêm của lượt, không dùng để kết luận
  ngưỡng.
- Y2 pump log lần 3: pumpEvents 0, captures 0, blendTicks 402,
  tickCost 479 — không có late pump / CAP. Ring: skippedDuplicate
  tích tới 146, ringClears tới 49 cuối lượt (P4: 149 / 52 — cùng
  bậc, không có gì mới).

## 2. Label-at-capture — KHÔNG làm lại (đã đo xong ở N4)

Theo task giao + N4 §2.2 + prereg-q5: label-at-capture theo
currentTime ĐÃ ĐO XONG, KHÔNG đáng làm. Q5 không chạy lại mô phỏng,
không đổi production.

## 3. (b) unique-match + F6' trên lượt lần 3 (kiểm lại, không đóng lại)

### 3.1 (b) — có 1 sự kiện MỚI: ghost stale sau seek, lần đầu trong chuỗi

| Lát cắt (b) | Q5 lần 3 (cây 03bf029f) | P4 Q1 (cây 03bf029f) | N4 Q1 (cây c4198206) | N1 M5 |
|---|---|---|---|---|
| skp=1: n / nomatch | **134/134 (100%), 0** | 144/144 (100%), 0 | 126/126 (100%), 0 | 122, 0 |
| skp=1: median / p90 / max / min | 0f / 2f / **+68f** / −11f | 0f / 2f / +4f / −1f | 0f / 2f / +4f / −1f | 0f / 2f / +3f / −12f* |
| skp=0: n / nomatch | **436/436 (100%), 0** | 500/500 (100%), 0 | 532/532 (100%), 0 | 526, 0 |
| skp=0: median / p90 / max / min | 0f / 3f / **+68f** / −18f | 1f / 3f / +12f / −15f | 1f / 3f / +4f / −10f | 1f / 3f / +4f / −15f |
| (b) lag ≥+5f / ≥+10f (cả 2 skp) | **7 / 7 — cùng 1 event (§3.1.1)** | 6 / 2 — cùng 1 event | 0 / 0 | 0 / 0 |
| (c2) đáng ngờ thật | **0** | 1 ca, lag 1f | 3 ca, đều lag 1f | 4 ca, đều lag 1f |
| ghost stale sau seek (label 0 / pixels 67–76) | **7 occ (4 tick)** | 0 | 0 | 0 |

\* N1 skp=1 min −12f là 1 ghost decode-lag đơn lẻ.
- Tổng (b) Q5: 570 occurrence, tất cả match duy nhất 1 frame,
  nomatch 0 — fixture + pipeline GT hoạt động đúng trên cây này.
  (a) và (b) trùng nhau hoàn toàn ở cả 2 skp (mọi occurrence đều
  match duy nhất) — như P4.
- Trễ âm (decode lag, cơ chế (a) của M5): skp=0 có 121 occurrence
  lag <0 (min −18f) — sâu hơn P4 (−15f) và N4 (−10f) nhưng xa mức
  −58f của M5 lúc tải nặng. Ghi nhận, không phải hồi quy lớn.
- (c)/(c2) = 0 cả 2 skp (P4 còn 1 ca lag 1f) — không có ghost nào
  có strip khớp presented trong khi label khác.

#### 3.1.1 Sự kiện seq 282–285 — ghost stale SAU SEEK (label 0, pixels 68, lag +68f)

Chi tiết (trích bằng script đối chiếu GT, `lag5-detail.txt`):

| seq | tBlend | presented | label | M (frame pixel-thật) | lag | skp |
|---|---|---|---|---|---|---|
| 282 | 58606 | 18 | 0 | 68 | +68f | 0 |
| 282 | 58606 | 18 | 0 | 68 | +68f | 0 |
| 283 | 58787 | 18 | 0 | 68 | +68f | 1 |
| 283 | 58787 | 18 | 0 | 68 | +68f | 1 |
| 284 | 58886 | 18 | 0 | 68 | +68f | 1 |
| 284 | 58886 | 18 | 0 | 68 | +68f | 1 |
| 285 | 58933 | 20 | 0 | 68 | +68f | 1 |

- 4 tick liên tiếp (seq 282–285, tBlend 58606–58933, 327 ms): nhãn
  đứng yên ở 0, pixels đứng yên ở frame 68, trong khi presented
  chạy 18→20. Lag +68f ≈ 2,27 s — lớn hơn hẳn event P4 (+6..+12f).
- Đây là **lần đầu tiên** mẫu "ghost stale sau seek (label 0 /
  pixels 67–76)" xuất hiện trong chuỗi (b) (M5/N1/N4/P4 đều 0).
  Diễn giải cơ chế (giả thuyết, chưa kiểm chứng): mỗi pass bắt đầu
  bằng seek về đầu clip — label reset về 0, nhưng pixels ghost vẫn
  là frame 68 còn sót từ cuối pass trước (các pass đều kết thúc
  quanh frame 62–73 theo dbg log) — ghost chưa được vẽ lại sau
  seek trong ~0,33 s. Sự kiện nằm trong dải wallMs 45–62k (dải
  tickCost cao 79,0) — cùng lúc với tải replay, nhưng KHÔNG kết
  luận nhân quả (chỉ 1 event, không có đối chứng A/B).
- **So với event P4 seq 220–223 (frame 26, lag +6..+12f, nhãn chạy
  14→20): KHÁC BIỆT RÕ — không phải tái hiện event P4.** P4:
  pixels đứng yên + nhãn chạy; Q5: pixels đứng yên + nhãn đứng
  yên ở 0. Hai chữ ký khác nhau (một là ghost chưa cập nhật theo
  nhãn giữa lượt, một là ghost chưa cập nhật sau seek). Cả hai đều
  là "pixels đứng yên trong khi presented/nhãn chạy", nhưng cơ chế
  có thể khác nhau — cần luồng riêng chẩn đoán, không gộp chung.
- Theo kế hoạch đăng ký trước (prereg-q5 §3): event này thuộc
  trường hợp "Tái hiện" theo nghĩa rộng (≥1 event lag ≥+5f với
  pixels đứng yên ≥3 ghost liên tiếp cùng 1 frame) — nhưng là
  event MỚI, không phải tái hiện event P4. Q5 ghi chi tiết đầy đủ,
  đề xuất luồng riêng chẩn đoán cơ chế ở đợt sau (có liên quan fix
  E4 steady-close không — CHƯA kết luận, cần đối chứng A/B);
  **KHÔNG tự kết luận đây là hồi quy** (chỉ 1 sự kiện, lượt này
  lại nhiễm tải replay, không có đối chứng sạch).
- Lưu ý: skp=1 (lát chính của bar F6') CÓ 4 occurrence lag +68f
  (seq 283–284) — lần đầu lát chính của (b) có lag ≥+5f. Nhưng bar
  F6' (1)/(2) không bị ảnh hưởng vì các ghost này có label 0 ≠
  presented 18–20 (không phải ứng viên ghost==presented) — xem
  §3.2.

### 3.2 F6' trên cây hiện tại (lượt lần 3)

| | Q5 lần 3 | P4 Q1 | N4 Q1 | N1 (M5) |
|---|---|---|---|---|
| nTick skp=1 hậu flip+2000ms (cần ≥30) | **67** | 72 | 63 | 61 |
| (1) nhãn: tick KHÔNG chứa ghost==presented | **67/67 (100%)** | 72/72 (100%) | 63/63 (100%) | 61/61 (100%) |
| (2) pixel-verified: tick KHÔNG vi phạm thật | **67/67 (100%)** | 72/72 (100%) | 63/63 (100%) | 61/61 (100%) |
| ứng viên ghost label==presented | 0 strip | 0 strip | 0 strip | 0 strip |
| (1)/(2) skp=0 (đối chứng) | 218/218 (100%) | 250/250 (100%) | 266/266 (100%) | — |
| presented−expected \|gap\|≤3 | 285/285 (100%, đều =0) | 322/322 (100%, đều =0) | 329/329 (100%, đều =0) | 324/324 (100%) |

- Bar (1)/(2) đạt 100%, n=67 ≥30 — nhất quán với K7/L7/M5/N4/P4.
  (2) vẫn là hệ quả của (1) (0 ứng viên) — bằng chứng pixel độc lập
  thực sự nằm ở (b) §3.1, như M5 đã kết luận.
- **F6' vẫn ĐÃ ĐÓNG từ L7 — Q5 không đóng lại, không mở lại.**
- Nhãn ghost vẫn nhiễu (cấu trúc, không đổi): clean distinct skp=1
  7/28 (25,0%), skp=0 27/124 (21,8%); mọi occurrence skp=1
  103/126 (81,7%), skp=0 137/385 (35,6%) — cùng bậc với M5/N4/P4
  (skp=1 ~80%, skp=0 ~26–43%). Nhãn không đáng tin nhưng bar (1)
  vẫn đứng vì skip dựa trên nhãn; bar pixel (2) cần (b) để độc lập
  (nay đã có, §3.1 — và (b) lần này có event mới, xem §3.1.1).
- Bar F6' KHÔNG cần định nghĩa lại lúc này (ngữ nghĩa nhãn không
  đổi — label-at-capture không được làm).

## 4. Đo phụ: gStd spread + trail/edge (chẩn đoán, không vào bar)

Trên lần 3 (fixture sọc hẹp — các metric này KHÔNG so được trực tiếp
với L7/K7 sọc rộng, chỉ ghi số như M5 §6):

| | Q5 lần 3 | P4 Q1 | N4 Q1 | N1 (M5) |
|---|---|---|---|---|
| gStd spread cửa sổ đã vẽ: median / max / nGroups | 14,9 / 47,0 / 47 | 13,0 / 42,1 / 46 | 11,2 / 41,4 / 61 | 8,9 / 45,6 / 71 |
| gStd spread + presented: median | 13,1 | 11,9 | 9,3 | 7,9 |
| nSkipped (mẫu loại khỏi nhóm) | 210 | 219 | 246 | 272 |
| trailMax / trailFramesGt0 | 7 / 130 | 7 / 137 | 8 / 166 | 7 / 158 |
| edgeLMed / edgeRMed (px) | 2,3 / 0,6 | 2,2 / 0,7 | 2,2 / 0,7 | 2,2 / 0,7 |
| edgeLMax / edgeRMax (px) | 121,1 / 211,0 | 144,8 / 239,1 | 144,7 / 241,2 | 208,5 / 237,0 |
| pause gStd (t=0,5/1/1,5) | 115,6 / 114,6 / 116,6 | 115,6 / 114,6 / 116,6 | 115,6 / 114,6 / 116,6 | ~115,6 / 114,6 / 116,6 |

- Cùng bậc với P4/N4/M5 — không có hồi quy. Pause baseline khớp L7
  (~115) — blur gốc vẫn đúng. Spread 14,9 (so với 0,6 của L7) +
  trailMax 7 + edgeMax ~121–211 px là độ nhạy của METRIC với sọc hẹp
  (M5 §6 đã giải thích), không phải lỗi blend. Không kết luận gì thêm
  từ các metric này.

## 5. Kiểm chứng hồi quy (cây đo `03bf029f…`, sau lượt đo lần 3)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0** (log
  `tsc-q5.log` trống — sạch).
- `ghostBlend.probe.test.ts`: **15/15 PASS**, chạy bằng
  `node --experimental-strip-types` từ gốc repo như header file hướng
  dẫn (log `ghostblend-q5.log`).
- `vite build` (config gốc): KHÔNG chạy lại đợt này — N1 đã chạy PASS
  trên cùng cây `03bf029f…` đợt 112, Q5 không sửa production (md5
  không đổi), nên build không cần chạy lại; ghi rõ để khỏi hiểu là
  đã chạy.
- preview.tsx md5 `03bf029f…` không đổi trong suốt cả 3 lần đo + hồi
  quy.
- Không sửa file production nào.

## 6. Sự cố hạ tầng trong lúc đo (đã xử lý, không mất dữ liệu đo lần 3)

1. **Lần 1: libevent thiếu trên boot #45** (§1.1): postboot #45 FAIL
   apt replay. Q7 sửa xong bằng `--repair` (lib xuất hiện 15:01:32Z).
   Q5 không tự chạy apt.
2. **Lần 2: gate 10 phút không mở + reboot #46 giết probe ở pass
   11/20** (§1.2): các luồng round114 khác đang pha nặng (load1 tới
   7,60); reboot #46 15:44:49Z (gap #45→#46 = 2h27'07"). Không mất
   dữ liệu lần 3 (lần 2 không có JSON output để mất).
3. **Lần 3: replay apt hệ thống chạy suốt cửa sổ đo** (§1.3): hệ quả
   là lượt không đạt lớp B (mới). Bài học cho đợt sau: lượt yên xác
   nhận nên chạy khi replay postboot ĐÃ PASS (Q7 early-watch try2
   PASS 15:51:57Z — chỉ ~3 phút sau khi lượt Q5 kết thúc) — tức là
   chờ Q7 báo PASS rồi mới đo, thay vì đo ngay sau boot trong lúc
   replay còn chạy. Hoặc xếp lịch lượt yên chạy khi các luồng khác
   đã xong/đang pha nhẹ và replay đã xong.
4. **Không có vite mồ côi.** Cả 3 lần: lock acquire 1 lần thành công
   ngay (lần 3) / ngay (lần 1, 2), nhả sạch; kill-vite pid node chết,
   ps sạch, curl :5184 = 000. Xvfb :193 (lần 1, 3) / :194 (lần 2, đã
   dọn socket X mồ côi /tmp/.X11-unix/X194 trước khi lên).
5. **RAM dao động mạnh cả đợt** (497 → 1055 → 686 → 436 → 1413 →
   1563 MB). Lần 3 đạt ≥1 GB; các lần trước không. Không có process
   mồ côi nào để giải phóng an toàn (ps chỉ thấy hatch daemon +
   chính shell Q5); phần RAM còn lại nằm ngoài tầm nhìn process của
   cell. Ghi rõ vì có thể liên quan warm-up (§1.4).

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND114_Q5_F6P60MS_LIMITS.md` — file này. **File duy
  nhất trong repo mà Q5 thay đổi** (probe copy + analyzer + dữ liệu đo
  đều ở hidden_files; mp4 fixture ở `apps/web/public/` là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi; probe114q5*
  nằm ngoài repo nên không stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round114-q5-f6p60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round114-q5/`
  (prereg-q5.md, probe114q5-ghost-k7.webkit.mjs [copy P4, md5
  `a690d828…`], analyze-q5-{tickcost,labellag,skiplatest}.py [copy P4],
  analyze-q5-wallbands.py + analyze-q5-lag5.py [mới, Q5 viết],
  analyze-q5-{tickcost,labellag,skiplatest}.txt, lag5-detail.txt,
  b.json, vite.q5-temp.config.mjs, vcut-vite-lock-q5.sh [bản copy đóng
  băng, md5 `fd21193c…`], run-q5.sh, poll-q5.log, chain-q5.log,
  run-webkit-q1.log (lần 3; lần 1+2 ghi đè cùng tên — xem chain log),
  vite-5184-q5-q1.log, ps-before.txt, ps-after.txt (lần 3),
  preview-b-f3-flip-webkit-q1.json (2,5 MB, lần 3),
  tsc-q5.log, ghostblend-q5.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ M5/L7/N4/P4). **Lưu ý:** run-webkit-q1.log + ps-before/after bị
  ghi đè ở lần 3 (cùng tên file) — log lần 1+2 chỉ còn trong
  chain-q5.log + output exec đã lưu; lần sau nên tách tên file theo
  lần đo.
- Cờ xong: `hidden_files/round114-q5-done` (tạo SAU KHI LIMITS +
  batch xong; các luồng khác chờ cờ này — Q3 chờ đến 15:56:38Z).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ theo N4 nhưng MỎNG — VẪN CẦN 1 lượt yên
   xác nhận ở vòng sau (lần thứ 3 liên tiếp chưa chốt được: N4 tải
   trôi, P4 P3 chen, Q5 replay apt).** Lượt Q5 lần 3 không đạt lớp B
   (mới) nên không dùng để chốt hay hiệu chuẩn lại; median 70,0 là
   số đo của một lượt NHIỄM TẢI, không phải bằng chứng chống lại
   ngưỡng 60. Lượt xác nhận tiếp theo cần: (a) chạy SAU KHI Q7 báo
   postboot PASS (replay xong) — không đo ngay sau boot trong lúc
   replay còn cài package (§6 mục 3); (b) chạy khi các luồng khác đã
   xong/đang pha nhẹ; (c) bắt đầu với RAM avail ≥ ~1 GB (lần 3 đã
   đạt, giữ điều kiện này); (d) cùng cây 03bf029f (hoặc ghi rõ nếu
   cây đổi); (e) lấy mẫu load1 GIỮA lượt (Q5 chỉ có số đầu/cuối —
   thiếu sót bằng chứng cho điều kiện con load1<4).
2. **Sự kiện ghost stale sau seek seq 282–285 (§3.1.1):** 7 occurrence
   lag +68f, 1 event duy nhất, label 0 / pixels 68 trong 327 ms —
   lần đầu xuất hiện trong (b) trên toàn chuỗi. Cần luồng riêng
   chẩn đoán cơ chế ở đợt sau (có liên quan fix E4 steady-close
   không? có phải seek chưa vẽ lại ghost không?); nếu tái hiện trên
   lượt yên sạch thì ưu tiên cao; nếu không tái hiện thì coi là sự
   kiện đơn lẻ trong lượt nhiễm tải. Event P4 frame-26 (§3.1.1 đợt
   113) KHÔNG tái hiện ở lần 3 này — theo dõi tiếp, không gộp 2
   event làm một.
3. **Phân rã tickCost theo dải wallMs (§1.4):** warm-up nhanh (52,0)
   khi RAM ≥1,4 GB — ủng hộ giả thuyết RAM của P4; dải giữa lượt
   tăng lên 79,0–79,5 đúng lúc replay cài package. Cần lượt yên
   sạch trên cùng cây để xem dải giữa có về ~53–58 (như N4) không
   — phân biệt hành vi cây vs nhiễm tải.
4. **Định nghĩa lớp B mới (quyết parent) đã được áp dụng đúng:**
   ghi file nhẹ không vi phạm (lần này 0 ghi khác trong cửa sổ);
   tải hệ thống (replay apt) vẫn vi phạm B2. Đề xuất đợt sau bổ sung
   vào prereg: kiểm tra trạng thái replay postboot (Q7 try PASS)
   TRƯỚC khi mở gate lớp A — gate hiện tại không phát hiện được
   replay đang chạy (load1/load5 lúc gate vẫn < 2).
5. **(A) label-at-capture theo currentTime: ĐÃ ĐO XONG, KHÔNG đáng
   làm** (N4 §2.2). Nợ theo nghĩa rộng (nhãn theo frame đã giải mã
   thật) vẫn mở.
6. **Nhãn ghost vẫn nhiễu (cấu trúc):** clean distinct skp=1 25,0% /
   skp=0 21,8% trên lượt này. Muốn nhãn tốt hơn phải đổi cơ chế
   anchor/label — không phải chờ máy yên.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 113 §10:** G1 + mù #22 +
   mù #28 + mù #29 + mù #30 + mù #31 + mù #32 chờ user quyết; E4 cần
   đợt xác nhận tải cao trên cây 03bf029f; ring 8 MiB cần đo lag
   push/take trực tiếp; điểm gãy tải cần tích đủ tick; postboot-check
   script vẫn ghi tham chiếu #42 trong header (cần cập nhật lên boot
   hiện tại — luồng hạ tầng); birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi. Reboot
   mới nhất trong lúc đo: boot #46 15:44:49Z (gap #45→#46 = 2h27'07"),
   apt replay xong lúc ~15:51:57Z (Q7 try2 PASS) — không còn nợ infra
   từ reboot này sau 15:52Z.

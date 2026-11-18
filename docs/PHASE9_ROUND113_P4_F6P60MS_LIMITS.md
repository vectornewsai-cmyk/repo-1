# PHASE9_ROUND113_P4_F6P60MS_LIMITS — F6' WebKit ≤60 ms: lượt yên XÁC NHẬN (không đạt điều kiện yên — không dùng để chốt ngưỡng)

> Luồng P4, đợt 113, lượt cron 18:35 +07 14/11/2026 (bắt đầu ~11:38Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ LIMITS gộp đợt 112 §10 mục 8 (từ N4 đợt 112): 1 lượt yên xác nhận để
> chốt ngưỡng WebKit ≤60 ms (N4: median 58,0, biên 2 ms, tải trôi lên
> giữa lượt do N6) — chờ máy thật yên CẢ LƯỢT.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không đụng
> TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính (4 ý, đọc kỹ trước khi dùng số):**
> 1. **Lượt này KHÔNG ĐẠT ĐIỀU KIỆN YÊN theo prereg P4 (lớp B) — KHÔNG
>    dùng để chốt ngưỡng, không cố diễn giải.** P3 (luồng round113-p3)
>    bắt đầu chạy giữa cửa sổ đo (11:39:44Z) và sửa file trong cửa sổ
>    (prereg-p3.md, p3-progress.log) — vi phạm điều khoản B2 đã đăng ký
>    trước; đồng thời tickCost theo dải wallMs tăng dần đúng từ lúc P3
>    bắt đầu (56 → 61,0 → 66,5) trong khi N4 phẳng (58 → 59 → 57,5) —
>    không loại trừ được nhiễm tải ở đuôi lượt. **Ngưỡng WebKit ≤60 ms
>    giữ nguyên trạng thái N4: GIỮ nhưng MỎNG, nợ lượt yên xác nhận
>    chuyển tiếp sang đợt sau.**
> 2. **Số đo (báo cáo đầy đủ, không dùng để chốt): tickCost total median
>    61,0 ms (n=509), p90 92,0, max 176** — vượt bar 60 ms đúng 1 ms.
>    Nhưng median hậu flip+2000ms vẫn 58,0 (n=383, y hệt N4) và dải
>    giữa lượt (wallMs 32–62k) chỉ 49,5–56 — lượt bị kéo lên bởi 2 đầu:
>    warm-up đầu lượt rất chậm (wallMs 0–20k median 86,5 vs N4 56,5)
>    và đuôi lượt tăng dần (66,5 ở wallMs 70–80k). Không phân biệt được
>    phần nào là nhiễm P3, phần nào là cây mới — đó chính là lý do
>    prereg cấm diễn giải.
> 3. **(b) unique-match có 1 sự kiện mới so với N4:** 6 occurrence lag
>    ≥+5f (max +12f) ở skp=0 — nhưng chỉ là 1 sự kiện duy nhất
>    (seq 220–223, tBlend 48440–48861): 3 ghost liên tiếp đều match
>    frame 26 trong khi presented chạy 17→27, nhãn 14→20 — pixels
>    đứng yên ~0,42 s. N4 Q1 và M5 N1 đều có 0 lag ≥+5f. skp=1 (lát
>    chính của bar) vẫn max +4f, 0 ≥+5f. (c2) vẫn chỉ 1 ca lag 1f.
> 4. **F6' vẫn đứng trên nhãn + cây hiện tại:** (1)/(2) 72/72 (skp=1)
>    và 250/250 (skp=0), 0 ứng viên ghost label==presented.
>    F6' vẫn ĐÃ ĐÓNG từ L7 — P4 không đóng lại, không mở lại.

## 0. Môi trường đo + prereg + cây đo

- **Boot trong lúc đo: 2026-11-14 10:53:31Z = reboot #44** (sau #43
  08:53:37Z; gap #43→#44 = 1h59'54", không phá sàn — số thứ tự do
  luồng P3 đợt 113 xác nhận trong log của P3, P4 đối chiếu giờ boot
  khớp). Postboot-check PASS lúc ~11:38Z
  (không --repair): wrapper K1 PASS, libs đủ
  (libevent/libEGL/libavif/libdw/libevdev), GST hệ thống 269 file
  (thư mục thật apt, không phải symlink debroot), isomp4 + libav đủ,
  apt đủ 10 package. WebKit launch được, decode mp4 đủ.
  Lưu ý: header script postboot-check vẫn ghi "#42 = 08:05:10Z" (N8
  đã nêu đợt 112) — check chức năng không phụ thuộc boot nên vẫn PASS;
  nợ cập nhật tham chiếu thuộc luồng hạ tầng.
- **Prereg:** `hidden_files/round113-p4/prereg-p4.md` — viết TRƯỚC lượt
  đo, đăng ký: định nghĩa lượt yên 2 lớp (A: gate lúc bắt đầu; B: xác
  nhận yên CẢ LƯỢT — load5 cuối ≤2,5, không bằng chứng luồng khác
  chạy phân tích nặng trong cửa sổ đo, không reboot), quy tắc quyết
  định ngưỡng (median ≤60 → giữ có xác nhận; median >60 → hiệu chuẩn
  lại, KHÔNG tự nâng; lượt không đạt lớp B → KHÔNG áp dụng 2 nhánh,
  verdict giữ nguyên trạng thái N4). P4 tuân thủ đúng prereg này —
  xem §1.
- **Cây đo `03bf029f…`** (= cây N1 đợt 112, fix E4 steady-close) —
  KHÁC cây N4 đo (`c4198206…`, cây M1 đợt 111). preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b` kiểm trước/sau lượt đo — KHÔNG
  ĐỔI (03bf029f → 03bf029f). P4 không sửa production. Mọi so sánh
  số với N4/M5 trong file này đều mang caveat "cây đo đã đổi".
- **Fixture `stripes-nonperiodic.mp4` còn trên đĩa, md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5** (cả
  `apps/web/public/` lẫn `hidden_files/round111-m5/`). GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn từ round111-m5.
  Mp4 là binary local-only, KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb :193 (probe tự chọn display trống). Env launch GST như M5/L7/N4.
- **RAM khả dụng:** 522 MB lúc bắt đầu lượt, 2092 MB lúc kết thúc
  (tăng trong lúc đo — nguyên nhân chưa rõ, có thể process khác thoát;
  ghi rõ vì RAM đầu lượt thấp hơn hẳn N4: 1089 MB). Birefnet KHÔNG
  chạy (RAM dưới ngưỡng guard).

## 1. Lượt yên Q1 — KHÔNG ĐẠT ĐIỀU KIỆN YÊN (lớp B vi phạm)

### 1.1 Lớp A (gate lúc bắt đầu): ĐẠT

| Điều kiện gate (prereg) | Lúc bắt đầu probe 11:38:38Z |
|---|---|
| load1 < 2 | 1,49 ✓ (poll 1: 1,44) |
| load5 < 2 | 0,81 ✓ (poll 1: 0,79) |
| vite.lock luồng khác | không ✓ |
| blocker process | 0 ✓ (ps-before sạch, chỉ có grep của chính mình) |

Poll mở ngay poll 1 (11:38:35Z). Không có vite/probe/WebKit/tsc/python
nào của luồng khác lúc bắt đầu. Các thư mục round113-p3/p6/p8 đã tồn
tại (P6 đang viết file phân tích blind31 trước cửa sổ đo), nhưng
không có process nặng nào đang chạy tại thời điểm gate.

### 1.2 Lớp B (xác nhận yên cả lượt): VI PHẠM — mục B2

| Mục lớp B (prereg) | Kết quả |
|---|---|
| (B1) load5 lúc kết thúc ≤ 2,5 | **1,26 ✓** (load cuối 2,27 / 1,26 / 0,76) |
| (B2) không bằng chứng luồng khác chạy phân tích nặng trong cửa sổ đo | **✗ VI PHẠM** (xem dưới) |
| (B3) không reboot; vite.lock chỉ do P4 giữ | **✓** (boot 10:53:31Z suốt lượt; lock acquire 1 lần thành công ngay, nhả sạch) |

**Bằng chứng vi phạm B2 (2 điểm):**

1. **P3 bắt đầu chạy giữa cửa sổ đo.** Luồng round113-p3 ghi
   `P3-R1 start 2026-11-14T11:39:44Z` (load lúc đó 1,92/1,12/0,71)
   — nằm trong cửa sổ probe P4 (11:38:38–11:40:07Z). File
   `round113-p3/prereg-p3.md` (mtime 11:39:40) và
   `round113-p3/p3-progress.log` (mtime 11:39:44) được sửa trong cửa
   sổ — vi phạm đúng chữ điều khoản B2 ("không có file nào trong
   các thư mục `hidden_files/round113-*` khác được sửa (mtime)
   trong cửa sổ probe").
2. **tickCost theo dải wallMs tăng dần đúng từ lúc P3 bắt đầu**
   (xem §1.3): dải 45–62k median 56 → 62–70k median 61,0 → 70–80k
   median 66,5, trong khi cùng các dải ở N4 phẳng (58 → 59 → 57,5).
   Không loại trừ được nhiễm tải ở đuôi lượt.

**Sự thật giảm nhẹ (ghi rõ, nhưng KHÔNG dùng để lật verdict):**
- 4 process hog `python3 -c while True: pass` của P3 chỉ spawn lúc
  ~11:40:08–09Z theo holder log của P3 (`[11:40:09Z] HOLDER bắt đầu:
  GEN=python N=4 hogs, load0=2.27 1.26 0.76`) — SAU khi probe P4
  thoát (11:40:07Z) và sau tick cuối cùng (wallMs 79997 ≈ 11:40:02).
  **Các hog này chồng lấn 0 tick.** Driver P3 từ 11:39:44 đến
  11:40:09 chỉ chờ vite lock (log driver: "chờ lock khác (owner:
  thread=p4...)" rồi "ĐÃ GIỮ" lúc 11:40:09Z) — polling nhẹ, không
  phân tích nặng.
- Load5 cuối 1,26 rất thấp (N4 kết thúc 2,08) — máy về tổng thể vẫn
  yên; nhiễm (nếu có) chỉ ở mức nhẹ và tập trung đuôi lượt.
- Dù vậy, prereg P4 viết rõ: "Nếu lớp B VI PHẠM (bất kỳ mục nào):
  lượt này KHÔNG đạt điều kiện yên — GHI RÕ, KHÔNG dùng để chốt
  ngưỡng, không cố diễn giải." P4 tuân thủ đúng chữ prereg đã đăng
  ký trước khi thấy số — không tự diễn giải lại sau khi thấy median
  61,0. **Verdict ngưỡng giữ nguyên trạng thái N4.**

### 1.3 Số đo tickCost Q1 (báo cáo đầy đủ, không dùng để chốt)

| Lượt | Fixture | Cây đo | Tải | tickCost median | p90 | max | tBlend gap median | BlendTick/pass | rAF/pass median |
|---|---|---|---|---|---|---|---|---|---|
| L7 yên (đợt 110) | tuần hoàn | cũ | 0 hog, gate yên | **40,5** | 64,9 | 94 | 77 | 19,5 | — |
| N1 (M5) | không tuần hoàn | c4198206 | 0 hog, chưa thật yên (load5 3,58) | **50,0** | 80,1 | 115 | 92 | 22,2 | 34 |
| Q1 (N4) | không tuần hoàn | c4198206 | 0 hog, gate yên lúc bắt đầu, tải trôi lên giữa lượt | **58,0** | **79,0** | 121 | 96 | 21,9 | 34 |
| **Q1 (P4)** | **không tuần hoàn** | **03bf029f** | **0 hog, gate yên lúc bắt đầu, P3 bắt đầu giữa lượt (B2 vi phạm)** | **61,0** | **92,0** | **176** | **101** | **21,2** | **32** |
| K7 tải (đợt 109) | tuần hoàn | cũ | tải luồng khác | **66,0** | 103,5 | 194 | 112 | 20,3 | — |
| N2 (M5) | không tuần hoàn | c4198206 | 1 hog | **86,0** | 105,0 | 271 | 122 | 17,1 | 27 |
| N3 (M5) | không tuần hoàn | c4198206 | 3 hog | **167,0** | 253,2 | 520 | 279 | 10,2 | 20 |

- P4 Q1: tickCost total n=509, median **61,0**, p90 92,0, max 176,
  min 29; hậu flip+2000ms n=383, median **58,0** (y hệt N4).
  tBlend gap n=423, median 101,0, p90 177,0, max 1995.
  BlendTick/pass 21,2; rAF/pass median 32 (min 24, max 39).
  pageErrs [].
- **Phân rã theo dải wallMs (phân tích mới của P4 — N4 không làm):**

  | Dải wallMs | P4 Q1 (n / median) | N4 Q1 (n / median) |
  |---|---|---|
  | 0–20k (warm-up, pass ~1–2) | 48 / **86,5** | 72 / 56,5 |
  | 20–32k (pre-flip cuối) | 76 / **68,5** | 107 / 60,0 |
  | 32–45k (hậu flip) | 110 / **49,5** | 115 / 53,0 |
  | 45–62k (giữa lượt) | 143 / **56,0** | 139 / 58,0 |
  | 62–70k (P3 đã bắt đầu) | 58 / **61,0** | 68 / 59,0 |
  | 70–80k (đuôi lượt) | 74 / **66,5** | 36 / 57,5 |

- Đọc số (không kết luận vượt prereg): median tổng 61,0 bị kéo lên
  bởi 2 đầu — warm-up đầu lượt rất chậm (86,5/68,5, trước cả khi P3
  bắt đầu — không phải nhiễm P3) và đuôi lượt tăng dần (66,5). Dải
  giữa lượt 32–62k (49,5–56) và median hậu flip 58,0 đều nằm dưới
  60, nhất quán với N4. **Nhưng vì lượt không đạt lớp B, P4 KHÔNG
  dùng các lát cắt này để chốt hay hiệu chuẩn lại ngưỡng** — định
  nghĩa số đo chính theo prereg vẫn là median TOÀN LƯỢT, và lượt
  này không đủ điều kiện áp dụng quy tắc quyết định.
- Phụ chứng p90 ≤90 ms: P4 p90 92,0 > 90 — trên lượt này, phụ chứng
  KHÔNG tách được lượt yên khỏi lượt tải (K7 p90 103,5). Ghi rõ như
  một điểm yếu thêm của lượt, không dùng để kết luận ngưỡng.
- **Giả thuyết mở cho đợt sau (chưa kiểm chứng, không kết luận):**
  (i) warm-up chậm có thể do RAM đầu lượt chỉ 522 MB (N4: 1089 MB)
  và/hoặc cây mới; (ii) tăng dần hậu flip (49,5 → 66,5) có thể là
  chi phí mỗi tick tăng theo trạng thái ring (skippedDuplicate tích
  tới 149, ringClears tới 52 cuối lượt) trên cây 03bf029f — N4 trên
  cây cũ phẳng; (iii) nhiễm P3 ở 2 dải cuối không loại trừ được.
  Cả ba đều cần lượt yên thật trên cùng cây 03bf029f để phân biệt.

## 2. Label-at-capture — KHÔNG làm lại (đã đo xong ở N4)

Theo task giao + N4 §2.2: label-at-capture theo currentTime ĐÃ ĐO
XONG, KHÔNG đáng làm (skp=1 % lag==0 sụp 72,2% → 15,9% Q1,
79,5% → 41,8% N1). P4 không chạy lại mô phỏng, không đổi production.
Nợ theo nghĩa rộng (nhãn theo frame đã giải mã thật) vẫn mở.

## 3. (b) unique-match + F6' trên lượt Q1 (kiểm lại, không đóng lại)

### 3.1 (b) — có 1 sự kiện mới: 6 occurrence lag ≥+5f, cùng 1 event

| Lát cắt (b) | P4 Q1 (cây 03bf029f) | N4 Q1 (cây c4198206) | N1 M5 |
|---|---|---|---|
| skp=1: n / nomatch | **144/144 (100%), 0** | 126/126 (100%), 0 | 122, 0 |
| skp=1: median / p90 / max / min | 0f / 2f / **+4f** / −5f | 0f / 2f / +4f / −1f | 0f / 2f / +3f / −12f* |
| skp=0: n / nomatch | **500/500 (100%), 0** | 532/532 (100%), 0 | 526, 0 |
| skp=0: median / p90 / max / min | 1f / 3f / **+12f** / −15f | 1f / 3f / +4f / −10f | 1f / 3f / +4f / −15f |
| (b) lag ≥+5f / ≥+10f (cả 2 skp) | **6 / 2 — cùng 1 event (§3.1.1)** | 0 / 0 | 0 / 0 |
| (c2) đáng ngờ thật | 1 ca, lag **1f** (seq 219: presented 14, label 13) | 3 ca, đều lag 1f | 4 ca, đều lag 1f |
| ghost stale sau seek (label 0 / pixels 67–76) | **0** | 0 | 0 |

\* N1 skp=1 min −12f là 1 ghost decode-lag đơn lẻ.
- Tổng (b) P4: 644 occurrence, tất cả match duy nhất 1 frame,
  nomatch 0 — fixture + pipeline GT hoạt động đúng trên cây mới.
- Trễ âm (decode lag, cơ chế (a) của M5): 15 occurrence lag ≤−10f
  (min −15f) ở skp=0 — sâu hơn N4 Q1 (−10f) nhưng xa mức −58f của
  M5 lúc tải nặng. Ghi nhận, không phải hồi quy lớn.

#### 3.1.1 Sự kiện seq 220–223 — pixels đứng yên ở frame 26 (~0,42 s)

Chi tiết (trích bằng script đối chiếu GT, `lag5-detail.txt`):

| seq | tBlend | presented | label | M (frame pixel-thật) | lag |
|---|---|---|---|---|---|
| 220 | 48440 | 17 | 14 | 26 | +12f |
| 221 | 48537 | 20 | 14 | 26 | +12f |
| 221 | 48537 | 20 | 17 | 26 | +9f |
| 222 | 48671 | 24 | 17 | 26 | +9f |
| 222 | 48671 | 24 | 20 | 26 | +6f |
| 223 | 48861 | 27 | 20 | 26 | +6f |

- 3 ghost liên tiếp (labelCt 0,491 / 0,574 / 0,672) đều match frame
  26 trong khi presented chạy 17→27 và nhãn chạy 14→20: pixels
  của các ghost này đứng yên ở frame 26 trong ~0,42 s, đi TRƯỚC
  nhãn 6–12 frame và đi trước presented tới +9f ở seq 220.
- Đây là lần đầu lag ≥+5f xuất hiện trong (b) trên fixture mới
  (M5 N1/N2/N3 và N4 Q1 đều 0) — khác biệt thật, không phải do
  định nghĩa đổi (cùng analyzer, cùng fixture, cùng lát cắt).
- Diễn giải thận trọng: chỉ 1 sự kiện / 644 occurrence (0,9%),
  tập trung trong 4 tick liên tiếp giữa lượt (wallMs ~48,4–48,9k,
  TRƯỚC khi P3 bắt đầu — không phải nhiễm P3). Có thể là canvas
  vẽ trước / ghost pixel chưa cập nhật theo nhãn trong một cửa sổ
  ngắn — cơ chế chưa xác định, cần xem có tái hiện ở lượt yên sau
  trên cùng cây 03bf029f không. **Không kết luận đây là hồi quy
  của fix E4** (chỉ 1 sự kiện, không có đối chứng A/B), nhưng ghi
  rõ để đợt sau theo dõi. skp=1 (lát chính của bar F6') không bị
  ảnh hưởng: max vẫn +4f, 0 ≥+5f.

### 3.2 F6' trên cây mới (lượt Q1)

| | P4 Q1 | N4 Q1 | N1 (M5) |
|---|---|---|---|
| nTick skp=1 hậu flip+2000ms (cần ≥30) | **72** | 63 | 61 |
| (1) nhãn: tick KHÔNG chứa ghost==presented | **72/72 (100%)** | 63/63 (100%) | 61/61 (100%) |
| (2) pixel-verified: tick KHÔNG vi phạm thật | **72/72 (100%)** | 63/63 (100%) | 61/61 (100%) |
| ứng viên ghost label==presented | 0 strip | 0 strip | 0 strip |
| (1)/(2) skp=0 (đối chứng) | 250/250 (100%) | 266/266 (100%) | — |
| presented−expected \|gap\|≤3 | 322/322 (100%, đều =0) | 329/329 (100%, đều =0) | 324/324 (100%) |

- Bar (1)/(2) đạt 100%, n=72 ≥30 — nhất quán với K7/L7/M5/N4.
  (2) vẫn là hệ quả của (1) (0 ứng viên) — bằng chứng pixel độc lập
  thực sự nằm ở (b) §3.1, như M5 đã kết luận.
- **F6' vẫn ĐÃ ĐÓNG từ L7 — P4 không đóng lại, không mở lại.**
- Nhãn ghost vẫn nhiễu (cấu trúc, không đổi): clean distinct skp=1
  6/32 (18,8%), skp=0 23/136 (16,9%); mọi occurrence skp=1 110/139
  (79,1%), skp=0 130/467 (27,8%) — cùng bậc với M5/N4 (skp=1 ~80%,
  skp=0 ~26–43%). Nhãn không đáng tin nhưng bar (1) vẫn đứng vì
  skip dựa trên nhãn; bar pixel (2) cần (b) để độc lập (nay đã có,
  §3.1).
- Bar F6' KHÔNG cần định nghĩa lại lúc này (ngữ nghĩa nhãn không
  đổi — label-at-capture không được làm).

## 4. Đo phụ: gStd spread + trail/edge (chẩn đoán, không vào bar)

Trên Q1 (fixture sọc hẹp — các metric này KHÔNG so được trực tiếp với
L7/K7 sọc rộng, chỉ ghi số như M5 §6):

| | P4 Q1 | N4 Q1 | N1 (M5) |
|---|---|---|---|
| gStd spread cửa sổ đã vẽ: median / max / nGroups | 13,0 / 42,1 / 46 | 11,2 / 41,4 / 61 | 8,9 / 45,6 / 71 |
| gStd spread + presented: median | 11,9 | 9,3 | 7,9 |
| nSkipped (mẫu loại khỏi nhóm) | 219 | 246 | 272 |
| trailMax / trailFramesGt0 | 7 / 137 | 8 / 166 | 7 / 158 |
| edgeLMed / edgeRMed (px) | 2,2 / 0,7 | 2,2 / 0,7 | 2,2 / 0,7 |
| edgeLMax / edgeRMax (px) | 144,8 / 239,1 | 144,7 / 241,2 | 208,5 / 237,0 |
| pause gStd (t=0,5/1/1,5) | 115,6 / 114,6 / 116,6 | 115,6 / 114,6 / 116,6 | ~115,6 / 114,6 / 116,6 |

- Cùng bậc với N4/M5 — không có hồi quy. Pause baseline khớp L7
  (~115) — blur gốc vẫn đúng. Spread 13,0 (so với 0,6 của L7) +
  trailMax 7 + edgeMax ~145–239 px là độ nhạy của METRIC với sọc hẹp
  (M5 §6 đã giải thích), không phải lỗi blend. Không kết luận gì thêm
  từ các metric này.

## 5. Kiểm chứng hồi quy (cây đo `03bf029f…`, sau lượt đo)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0** (log
  trống — sạch).
- `ghostBlend.probe.test.ts`: **15/15 PASS**, chạy bằng
  `node --experimental-strip-types` từ gốc repo như header file hướng
  dẫn (log `ghostblend-p4.log`).
  - Ghi rõ sự cố thao tác: P4 chạy thử với đường dẫn sai
    `apps/web/scripts/ghostBlend.probe.test.ts` trước và nhận
    `MODULE_NOT_FOUND` — file này nằm ở
    `apps/web/src/lib/ghostBlend.probe.test.ts`, không phải
    `apps/web/scripts/`. Chạy lại đúng đường dẫn → 15/15. Không phải
    lỗi sản phẩm.
- `vite build` (config gốc): KHÔNG chạy lại đợt này — N1 đã chạy PASS
  trên cùng cây `03bf029f…` đợt 112, P4 không sửa production (md5
  không đổi), nên build không cần chạy lại; ghi rõ để khỏi hiểu là
  đã chạy.
- preview.tsx md5 `03bf029f…` không đổi trong suốt lượt đo + hồi quy.
- Không sửa file production nào.

## 6. Sự cố hạ tầng trong lúc đo (đã xử lý, không mất dữ liệu)

1. **P3 bắt đầu chạy giữa cửa sổ đo (§1.2):** không phải lỗi, chỉ là
   cạnh tranh lịch giữa các luồng đợt 113 (P4 giữ vite lock nên P3
   bị chặn ở lock, nhưng P3 vẫn ghi prereg/log và holder của nó spawn
   hog ngay sau khi P4 nhả lock). Hệ quả: lượt P4 không đạt lớp B —
   xem §1.2. Bài học cho đợt sau: lượt yên xác nhận nên được xếp
   lịch chạy ĐẦU đợt (trước khi các luồng khác bắt đầu) hoặc khi
   các luồng khác đã xong — không thể "tranh cửa yên" bằng poll
   trong khi các luồng khác cũng đang khởi động.
2. **Không có reboot trong lúc đo** (boot #44 10:53:31Z suốt lượt).
   Lock vite acquire 1 lần thành công ngay (không chờ), nhả sạch:
   kill-vite pid node 13370 chết, ps sạch, curl :5184 = 000. Không
   vite mồ côi.
3. **RAM đầu lượt thấp (522 MB avail):** probe vẫn chạy đủ 20 pass,
   không OOM, không pageErrs. RAM tăng lên 2092 MB cuối lượt
   (nguyên nhân chưa rõ). Ghi rõ vì có thể liên quan warm-up chậm
   §1.3.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND113_P4_F6P60MS_LIMITS.md` — file này. **File duy
  nhất trong repo mà P4 thay đổi** (probe copy + analyzer + dữ liệu đo
  đều ở hidden_files; mp4 fixture ở `apps/web/public/` là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round113-p4-f6p60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round113-p4/`
  (prereg-p4.md, probe104f3-ghost-k7.webkit.mjs [copy N4, md5
  `a690d828…`], analyze-p4-{tickcost,labellag,skiplatest}.py [copy N4],
  analyze-p4-{tickcost,labellag,skiplatest}-q1.txt, lag5-detail.txt,
  b.json, vite.p4-temp.config.mjs, vcut-vite-lock-p4.sh [bản copy đóng
  băng, md5 `fd21193c…`], run-p4.sh, poll-p4.sh, poll-p4.log,
  chain-p4.log, run-webkit-q1.log, vite-5184-p4-q1.log,
  postboot-check-p4.log, ps-before.txt, ps-after.txt,
  preview-b-f3-flip-webkit-q1.json (2,6 MB),
  tsc-p4.log, ghostblend-p4.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ M5/L7/N4).
- Cờ xong: `hidden_files/round113-p4-done` (tạo SAU KHI LIMITS + batch
  xong).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ theo N4 nhưng MỎNG — VẪN CẦN 1 lượt yên
   xác nhận ở vòng sau.** Lượt P4 không đạt lớp B nên không dùng để
   chốt hay hiệu chuẩn lại. Lượt xác nhận tiếp theo cần: (a) chạy
   ĐẦU đợt hoặc khi các luồng khác đã xong/đang pha nhẹ — tránh lặp
   lại mẫu P3 chen giữa (xem §6 mục 1); (b) bắt đầu với RAM avail
   ≥ ~1 GB nếu được (P4 chỉ có 522 MB, warm-up chậm bất thường);
   (c) cùng cây 03bf029f (hoặc ghi rõ nếu cây đổi) để phân biệt hiệu
   ứng cây vs hiệu ứng tải.
2. **Phân rã tickCost theo dải wallMs (mới, §1.3):** warm-up đầu lượt
   (86,5) + tăng dần hậu flip (49,5 → 66,5) trên cây 03bf029f, trong
   khi N4 trên cây cũ phẳng. Cần lượt yên thật trên cùng cây để xem
   đây có phải hành vi của cây mới (vd chi phí tick tăng theo trạng
   thái ring) hay chỉ là nhiễm/tình cờ. Đề xuất đợt sau đăng ký
   trước phân rã theo dải wallMs trong prereg (P4 làm phân tích này
   sau khi thấy số — ghi rõ, không giấu).
3. **Sự kiện stale-ghost seq 220–223 (§3.1.1):** 6 occurrence lag
   +6..+12f, 1 event duy nhất, pixels đứng yên ở frame 26 ~0,42 s —
   lần đầu xuất hiện trong (b) trên fixture mới. Theo dõi ở lượt yên
   sau: nếu tái hiện trên cây 03bf029f thì cần luồng riêng chẩn đoán
   (có liên quan fix E4 steady-close không?); nếu không tái hiện thì
   coi là sự kiện đơn lẻ.
4. **Định nghĩa lớp B (đề xuất sửa prereg, không phải kết luận):**
   B2 của P4 viết "không có file nào... được sửa (mtime) trong cửa
   sổ" — quá chặt theo nghĩa đen (ghi prereg/log nhẹ của luồng khác
   cũng vi phạm) và snapshot ps-after chụp sau khi probe thoát nên
   thấy cả process bắt đầu sau lượt đo. Đợt sau nên định nghĩa cửa
   sổ đo = từ tick đầu đến tick cuối (wallMs), và phân biệt ghi file
   nhẹ (prereg/log) với phân tích nặng — HOẶC giữ nguyên luật chặt
   và xếp lịch lượt yên chạy riêng. Quyết này thuộc parent, P4 chỉ
   nêu.
5. **(A) label-at-capture theo currentTime: ĐÃ ĐO XONG, KHÔNG đáng
   làm** (N4 §2.2). Nợ theo nghĩa rộng (nhãn theo frame đã giải mã
   thật) vẫn mở.
6. **Nhãn ghost vẫn nhiễu (cấu trúc):** clean distinct skp=1 18,8% /
   skp=0 16,9% trên lượt này. Muốn nhãn tốt hơn phải đổi cơ chế
   anchor/label — không phải chờ máy yên.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 112 §10:** G1 + mù #22 +
   mù #28 + mù #29 + mù #30 chờ user quyết; E4 cần đợt xác nhận tải
   cao trên cây 03bf029f; ring 8 MiB cần đo lag push/take trực tiếp;
   điểm gãy tải cần tích đủ tick; postboot-check script vẫn ghi tham
   chiếu #42 trong header (cần cập nhật lên boot hiện tại — luồng
   hạ tầng); birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml
   vẫn 403 chờ user; release gate không đổi. Reboot mới nhất trong
   lúc đo: boot #44 10:53:31Z (gap #43→#44 = 1h59'54"), apt
   replay đủ (postboot PASS) — không còn nợ infra từ reboot này.

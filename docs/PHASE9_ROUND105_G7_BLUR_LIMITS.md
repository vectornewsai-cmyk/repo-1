# PHASE9_ROUND105_G7_BLUR_LIMITS.md — Blur parity đợt 105, luồng G7

**Ngày:** 13/11/2026. **Luồng:** G7 (Phase 9 đợt 105). **Chủ đề:** Blur r7 —
stimulus KHÔNG tuần hoàn + B-band c0 (nợ LIMITS gộp đợt 104:
docs/PHASE9_ROUND104_F6_BLUR_LIMITS.md §7 mục 1–2; xem
docs/PHASE9_ROUND103_E6_BLUR_LIMITS.md, docs/PHASE9_ROUND101_C4_BLUR_LIMITS.md).

**Kết quả lớn nhất đợt này:**
- **r7 — giả thuyết "nội dung gap 2" BỊ BÁC BẰNG ĐO TRỰC TIẾP, r7 ĐÓNG
  với giả thuyết này.** Stimulus mới `frames-noise.mp4` (mỗi frame nhận
  diện duy nhất bằng pixel) cho strip nhận diện gần như hoàn hảo: MAD tới
  frame đúng 0,4 (chr) / 1,7 (wk), tới frame nhì 47–48 — tỉ lệ lề ~1:100.
  Trên đường rVFC đáng tin (chr): ghost snapshot content == nhãn riêng
  của chính nó ở **157/164 (95,7%)**; trong 5 sự kiện blend phân biệt có
  label gap 6, **content gap == label gap ở cả 5 (6,6,6,7,6)** — 0 ca
  content gap 2. Ca content-gap-2 duy nhất (1/11 sự kiện phân biệt) nằm
  trên đường tick WebKit, giải thích trọn bằng trễ nhãn đường tick
  (presented −5, ghost −1; ring đóng băng, 1 trạng thái lặp 14 tick).
  Kết hợp F6 timing (0/13) + strip stripes (0/13 xác nhận, 2/13 bác),
  "nội dung gap 2" không còn là giải thích cho cụm A.
- **Phát hiện phương pháp (ảnh hưởng mọi phân tích gap cũ):**
  `blendTick.ringLast` KHÔNG phải nhãn ghost mới nhất ĐÃ BLEND khi
  `skippedLatest=1` — khi đó ghost mới nhất đã blend là `ringPrev`
  (tương quan 100%: chr 39/39, wk 36/36; đúng comment preview.tsx ~1212).
  Ở ~48–52% tick, lấy ringLast làm nhãn ghost là lấy nhãn của 1 snapshot
  BỊ SKIP khỏi blend. May mắn: `predict_pair` của C4/D4/E6/F6 đã có nấc
  rơi về prev khi last ≥ pres nên các cap gap-6 cũ vẫn giữ gap thật 6
  (kiểm lại 4/4 cap F6) — chỉ các phân tích tick-level dùng ringLast trần
  (như bản phân tích đầu của G7) mới sai.
- **B-band c0:** gộp F6+G7: c0 4/41 (9,8%) vs c2 1/36 (2,8%), Fisher một
  phía **p=0,22 — KHÔNG ĐẠT bar p<0,05**; power normal-approx nay 46%
  (F6: 15%). Còn thiếu **74 B-cap c0 + 79 B-cap c2** để đạt ~115/nhóm
  (80% power Fisher). Thiết kế tăng tốc c0-only (`--nclips 1`) ĐÃ ĐƯỢC
  KIỂM CHỨNG: 1 lượt cho 24 B-cap c0 (gấp 2× lượt 3-clip, 1/3 thời gian
  phát). Cờ theo dõi: pair-like c0-only 4/24 (16,7%) vs c0 3-clip 0/17
  (Fisher p=0,13, chưa có ý nghĩa — nếu lệch kéo dài thì 2 thiết kế
  không hoán đổi được, phải tách pool).
- **D floor post-fix gộp: 0/2041** (F6 0/1767 + G7 stripes 0/274; Fisher
  p=5,12e-11 so với pre-fix 28/1547; 95% CI trên **0,147%**).
- **Hiệu chuẩn g trên stimulus mới:** triple 3 frame phân biệt đo live
  **0,616–0,635** (n=9 sự kiện phân biệt, lệch +0,03..+0,05 so với dự đoán
  trung bình thuần 0,589 — chưa giải thích được, ghi là nợ); pad-clone
  {a,a,b} **0,774–0,777** (dự đoán 0,755, khớp). g tách sạch 2 lớp
  multiplicity — stimulus mới là công cụ hiệu chuẩn tốt hơn stripes.

**Build:** probe chạy trên `ca378bbf` (4 lượt noise đầu + 2 lượt stripes)
rồi `f0b9e496` (2 lượt noise-blur r38 — G1 land F8 giữa chừng, xem §0).
F3 tap+relabel TẮT trong mọi lượt (baseline C4/D4/E6/F6). **Không sửa
production trong luồng này** (chỉ thêm generator + probe + LIMITS này).
Không push GitHub, không release/tag, không TTS 39, không birefnet.

---

## §0. Bối cảnh chạy

- **Reboot #31 (boot 3e4f237a, 11:26:40Z — đính chính: brief ghi #30 là
  sai; #30 = 10:54:53Z, theo log G1 đợt 105).** RAM khả dụng ~480 MB lúc
  bắt đầu lượt
  (ghi trong nhiệm vụ), tăng lên ~2,5 GB trong lúc chạy (các luồng song
  song khác thoát dần); load lúc phát 1,2–2,8. Không có reboot trong lượt.
- **Lỗi probe + sửa (bài học harness):** driver đầu chạy probe105g7 bản
  đầu với `WITH_BLUR = CONFIG === "scroll-blur"` — config `noise-blur`
  KHÔNG bật motion spec nên 2 lượt "noise-blur-r37" thực chất là noblur
  (`blendTickN=0`, `pumpN=0`). Phát hiện ngay sau lượt đầu (log KẾT QUẢ),
  sửa thành `WITH_BLUR = scroll-blur || noise-blur`, chạy lại 2 lượt
  r38 (driver105g7b) — có blend thật. 4 lượt r37 (2 blur-hụt + 2 noblur)
  KHÔNG bỏ: chúng cùng tính chất noblur nên dùng làm **baseline g** cho
  stimulus mới (245 cặp (eng,clip,fi); baseline theo (eng,clip) ~73,6 chr
  / ~74,2 wk). Ghi rõ để đợt sau không nhầm r37 là lượt blur.
- **Đổi build giữa chừng (luồng G1):** `preview.tsx` đổi md5 `ca378bbf` →
  `f0b9e496` lúc 11:52:15Z, đúng giữa lượt chr-noise-blur-r38
  (`mtimeChanged=true`). G1 land F8 (tap + gate 50ms + relabel + presented
  chung anchor) và gỡ nấc rawAnchor F8b (xem
  docs/PHASE9_ROUND105_G1_GHOST_LIMITS.md §4.1). **Không ảnh hưởng chế độ
  đo của G7:** probe đặt `__vcut104f3PresentedTap=false` +
  `__vcut104f3Relabel=false`; code đã kiểm tra: `f3TapEnabled()` trả false
  khi cờ tap false → `presentedFrameIndex` dùng "hành vi gốc verbatim"
  (comment trong code); `f3RelabelEnabled()` false → relabel = identity.
  G1 chỉ sửa đường tap-BẬT; `previewEngine.ts` không chạm. Pad-oldest còn
  nguyên trên cả 2 md5 (marker `motionBlurPadGhostCount` +
  `lastDrawnPaddedGhosts`).
- **8 lượt probe, đều exit 0:**

| lượt | engine | config | cap | pumpN | blendTickN | ghi chú |
|---|---|---|---|---|---|---|
| chr-noise-blur-r37 | chr | noise-blur (bản lỗi) | 112 | 0 | 0 | thực chất noblur → baseline |
| wk-noise-blur-r37 | wk | noise-blur (bản lỗi) | 48 | 0 | 0 | thực chất noblur → baseline |
| chr-noise-noblur-r37 | chr | noise-noblur | 80 | 0 | 0 | baseline |
| wk-noise-noblur-r37 | wk | noise-noblur | 48 | 0 | 0 | baseline |
| chr-blur-r37 | chr | scroll-blur (stripes) | 232 | 227 | 368 | load 2,8 lúc phát; lấy mẫu dày |
| chr-blur-r37c0 | chr | scroll-blur, `--nclips 1` | 78 (toàn c0) | 79 | 120 | load 2,29; thử thiết kế c0-only |
| chr-noise-blur-r38 | chr | noise-blur (đã sửa) | 89 | 80 | 82 | **lai build** (đổi md5 giữa lượt) |
| wk-noise-blur-r38 | wk | noise-blur (đã sửa) | 69 | 0 (silentEngine) | 93 | md5 f0b9e496 toàn lượt; đường tick |

- Dữ liệu thô + script: `hidden_files/round105-g7/` (`round105-g7.md`
  = pre-register viết TRƯỚC mọi lượt probe; `gen105g7-frames-noise.py`
  bản trong repo; `verify105g7-stimulus.py/.txt/.json`;
  `probe105g7-frame-parity.mjs` bản trong repo; `driver105g7*.sh/.log`;
  `analyze105g7.py` (bản đầu, định nghĩa ringLast trần — ĐÃ BỊ THAY THẾ);
  `analyze105g7b.py` (bản hiệu chỉnh, dùng nhãn ghost riêng);
  `check105g7-capid.py`, `analysis105g7*.json`).

---

## §1. r7 — "nội dung gap 2" BỊ BÁC, r7 ĐÓNG với giả thuyết này

### 1.1. Stimulus không tuần hoàn (thiết kế + kiểm chứng offline)

`frames-noise.mp4` — 1280×720, 30 fps, 90 frame (3 s), sinh bằng
`apps/web/scripts/gen105g7-frames-noise.py` (numpy seed cố định + PIL +
ffmpeg libx264 crf 16; 1.917.759 byte; script được stage, file mp4 nhị
phân KHÔNG stage). Mỗi frame f (0–89):
1. **Mosaic thô** 16×16 px (80×45 ô), xám ngẫu nhiên U(0,255), seed
   `20000+f` — đủ thô để sống sót sau H.264 + downscale, đủ ngẫu nhiên
   để mỗi frame khác nhau ở thang thấp.
2. **Code band** y∈[320,400] (cao 80 px, tâm y=360 = hàng giữa), khối 4 px
   rộng, xám ngẫu nhiên U(0,255), seed `30000+f` — nơi strip đọc
   (x video ≈256–375 qua snapshot 512 rộng): 30 khối độc lập trong tầm
   strip. 4 px là thỏa hiệp giữa độ phân giải và độ bền sau codec.
3. **Số frame** 2 chữ số, DejaVuSans-Bold ~140 px, trắng viền đen,
   góc trên-trái — đọc được bằng mắt, kiểm chứng độc lập với strip.
Xám thuần (R=G=B) để kênh G strip = đúng giá trị xám.

**Kiểm chứng offline (trước probe, trên frame trích từ video ĐÃ encode):**
strip tham chiếu đúng hình học snapshot, 48 byte G thô:

| hình học | second-nearest MAD min / med | bar ≥30 |
|---|---|---|
| unit 512×360 letterbox | 43,4 / 53,5 | ĐẠT (0 vi phạm) |
| 640×360 trực tiếp | 42,5 / 54,2 | ĐẠT |
| 1280×720 full-res | 37,3 / 51,6 | ĐẠT |

Cap 96×54: second-nearest MAD min 57,5. **Dự đoán g** (trung bình các
frame độc lập, không dùng mô hình harmonic): triple phân biệt 0,589
(đo offline 0,589±0,006); {a,a,b} 0,755; pair 0,714. **Band stripes KHÔNG
áp cho stimulus mới** — cap stimulus mới không gộp vào D floor/B-band.

### 1.2. Strip nhận diện gần như hoàn hảo khi đo live

Snapshot thực tế là **1280×720 full-res** (736/736 ghostPix, 222/222 pump
pix) nên strip đọc ở full-res, không qua downscale. Trên 2 lượt r38
(175 blendTick, 350 ghost entry):

- Ghost strip nhận diện được: **175/175 tick** (quy tắc prereg: MAD
  nearest < 0,5× second-nearest); MAD tới frame đúng: median **0,4
  (chr) / 1,7 (wk)**, tới frame nhì 47–48.
- Presented strip (curPix) nhận diện được: **175/175**.
- **Ghost content == nhãn riêng của chính nó (entry.frame): chr 157/164
  (95,7%), wk 34/186 (18,3%).** Đường rVFC: nhãn ghost ĐÚNG; đường tick
  WebKit: nhãn ghost nhiễu nặng (lệch −1 ở 71/186, −16 ở 16 ca — snapshot
  canvas giữ frame cũ; đúng cảnh báo F6 về đường tick).

**Cảnh báo cap-scale (không ảnh hưởng đo strip):** cap px 96×54 KHÔNG
khớp frame tham chiếu ffmpeg (0/288 nhận diện; MAD tới frame đúng ~53
so với ~72 tới frame sai). Nguyên nhân: đường downscale live (canvas
drawImage, std cap ~73,6 ≈ std nguồn) khác hẳn scaler ffmpeg (std 53,9)
— filter mismatch ở tỉ lệ 13,3×. Strip full-res không bị lỗi này (MAD
0,4). Bài học: đừng dùng cap 96×54 để nhận diện content; dùng strip.

### 1.3. Sửa định nghĩa gap: ringLast ≠ ghost đã blend khi skipLatest=1

`compositeMotionBlurLayer`: `skipLatest = lastCaptured === presented`
→ `ghostPool = arr.slice(0, arr.length-1)` — snapshot mới nhất bị loại
khỏi tập blend. `blendTick.ringLast` = `dbg.lastFrame` = nhãn capture
mới nhất (kể cả khi bị skip); ghost mới nhất ĐÃ BLEND là `ringPrev`
khi skip=1 (comment preview.tsx ~1212). Kiểm chứng trên r38:

| skippedLatest | gp[-1].frame == ringLast | gp[-1].frame == ringPrev |
|---|---|---|
| 0 (chr 43 / wk 57) | 100% | 0% |
| 1 (chr 39 / wk 36) | 0% | 100% |

Ở **48,0% (F6) / 51,9% (E6)** blendTick, ringLast không phải nhãn ghost
đã blend. Định nghĩa ĐÚNG (dùng trong phân tích chính):
`label_gap = presented − gp[-1].frame`, `content_gap =
content(presented) − content(gp[-1])`, với gp[-1].frame là nhãn riêng
của ghost mới nhất đã blend. `predict_pair` của C4/D4/E6/F6 đã có nấc
rơi về prev khi last ≥ pres nên **các cap gap-6 cũ vẫn giữ gap thật 6**
(kiểm lại 4/4 cap F6: 3 skip=0 gap 6; 1 skip=1 nhưng predict_pair đã
lấy prev → gap 6). Chỉ bản phân tích đầu của G7 (dùng ringLast trần,
n=6) là sai và đã bị thay thế bằng analyze105g7b.py.

### 1.4. Kết quả decisive (định nghĩa hiệu chỉnh, đã dedup)

Một "sự kiện blend phân biệt" = một bộ (clip, pres_label, ghost_label,
pres_content, ghost_content) duy nhất — vì 1 trạng thái blend có thể lặp
nhiều tick liên tiếp (ring đóng băng). 24 tick decisive → **11 sự kiện
phân biệt** (14 tick là 1 sự kiện wk lặp lại, xem dưới).

| sự kiện | đường | pres (nhãn→content) | ghosts (nhãn→content) | content gap | g |
|---|---|---|---|---|---|
| chr c0 pres 59 | rVFC | 59→59 | 48→48, 53→53 | **6** | 0,624 |
| chr c0 pres 65 | rVFC | 65→65 | 53→53, 59→59 | **6** | 0,635 |
| chr c0 pres 74 | rVFC | 74→74 | 65→65, 68→68 | **6** | 0,617 |
| chr c2 pres 8 | rVFC | 8→9 | 2→2, 2→2 (pad-clone, ringSize 1) | **7** | 0,774 |
| chr c2 pres 56 | rVFC | 56→56 | 48→48, 50→50 | **6** | 0,631 |
| wk c0 pres 80 | tick | 80→75 | 71→55, 74→73 | **2** | 0,619 |
| wk c0 pres 86 | tick | 86→86 | 74→73, 80→75 | **11** | 0,616 |
| wk c1 pres 58 | tick | 58→57 | 49→48, 52→56 | **1** | 0,619 |
| wk c1 pres 83 | tick | 83→76 | 70→72, 77→76 | **0** | 0,777 |
| wk c2 pres 22 | tick | 22→21 | 13→15, 16→20 | **1** | 0,616 |
| wk c2 pres 80 | tick | 80→79 | 70→69, 74→75 | **4** | 0,625 |

- **Đường rVFC (đáng tin): 5/5 content gap == label gap** (6,6,6,7,6;
  ca gap 7 là presented +1, trong nhiễu nhãn ±1). **0/5 content gap 2.**
- Ca gap-2 duy nhất (wk c0 pres 80) là **artifact đường tick**: presented
  content trễ nhãn −5 (80→75), ghost trễ −1 (74→73) — content gap 2 =
  6 + (−5) − (−1), tức hiệu của 2 độ trễ nhãn, không phải cơ chế blend.
  Cùng trạng thái blend này lặp **14 tick** (ring đóng băng, pump chết
  trên đường tick silentEngine) — đếm tick sẽ thổi phồng thành "14 ca".
  Ghost còn lại của nó (71→55, trễ −16) càng cho thấy snapshot đường
  tick giữ frame cũ.
- **Bar (a) prereg** (≥8 cap quyết định): n=11 sự kiện phân biệt ≥ 8 →
  đánh giá được. Đọc đúng: 1/11 gap-2, và ca đó là artifact trễ nhãn
  đường tick đã giải thích được — **"nội dung gap 2" là giải thích hệ
  thống bị bác**. Trên đường đáng tin: 0/5.
- **Bar (b) control (prereg, literal):** presented content == nhãn exact
  53/175 (30,3%) — **KHÔNG ĐẠT mốc 80% literal**. Đọc đúng: bar này gộp
  cả nhiễu nhãn presented (±1 ở 121/175 = 69,1%; chr: exact 43/82 +
  +1 ở 27/82) với sai số phương pháp — mà phương pháp thì sạch (strip
  MAD 0,4 vs 47; ghost chr 95,7%). Bar (b) như viết là quá chặt so với
  nhiễu nhãn đã biết từ F6 (±1); lần sau đặt bar theo "trong ±1" thay vì
  exact. Không dùng bar (b) literal để vô hiệu kết quả strip — strip đã
  tự chứng minh bằng MAD.
- **Bar (c) g cross-check:** triple phân biệt g 0,616–0,635 (n=9 sự kiện:
  4 chr + 5 wk); pad-clone g 0,774–0,777 (n=2: pres 8 {2,2,9},
  pres 83 {72,76,76}). g tách sạch 2 lớp multiplicity.
- **Ca loop-wrap:** 8 tick wk c0 pres 86→content 0 (cùng 1 sự kiện, video
  đã loop sang frame 0 trong khi nhãn presented còn 86) — đã loại khỏi
  decisive, ghi riêng. Cần quy ước biên clip khi strip-check lượt sau
  (đã nhắc từ E6 §5 mục 3).

**Verdict r7: ĐÓNG với giả thuyết "nội dung gap 2".** Bằng chứng trực
tiếp trên stimulus không tuần hoàn (ghost content == nhãn 96% đường
rVFC; content gap == label gap 5/5) + F6 timing (0/13) + F6 strip
(0/13 xác nhận, 2/13 bác) — không còn trục đo nào ủng hộ gap-2. Cụm A
stripes (g≈0,44, label gap 6) KHÔNG phải nội dung gap-2; thành phần
content thật của nó vẫn là nợ mở (giả thuyết dẫn đầu của E6: triple
liên tiếp khỏe mạnh với nhãn rải rác — chưa chứng minh; xem §7 mục 1).

---

## §2. B-band c0 — kiểm chứng gộp: KHÔNG ĐẠT bar, còn thiếu nhiều mẫu

Pool đăng ký trước (F6 + G7 stripes, cùng build ca378bbf, F3 tắt,
post-fix pad-oldest): Fisher một phía (c0>c2), α=0,05, bar p<0,05.

| lượt | B n | c0 (n, pair-like) | c1 | c2 (n, pair-like) |
|---|---|---|---|---|
| F6 (cũ) | 38 | 5 (0) | 20 (1) | 13 (1) |
| chr-blur-r37 (3-clip) | 57 | 12 (0) | 22 (3) | 23 (0) |
| chr-blur-r37c0 (1-clip) | 24 | 24 (4) | — | — |
| **Gộp F6+G7** | **119** | **41 (4 = 9,8%)** | **42 (4)** | **36 (1 = 2,8%)** |

- **Fisher một phía (c0>c2) gộp: p=0,22 — KHÔNG ĐẠT bar.** Hiệu ứng
  post-hoc gốc (17,1% vs 6,1%) thu hẹp còn 9,8% vs 2,8% khi thêm mẫu
  mới — đúng hướng "hiệu ứng post-hoc thường co lại", nhưng mẫu vẫn
  thiếu power nên KHÔNG kết luận "không có hiệu ứng": CI hiệu số vẫn
  bao cả 0 lẫn +11pp.
- **Power:** normal-approx nay **46%** (F6: 15%); Fisher-exact ~30%.
  Cỡ mẫu cần (tính trước khi chạy, prereg §3): ~102/nhóm (normal) /
  **~115/nhóm** (Fisher) cho 80% power. **Còn thiếu: c0 74, c2 79
  B-cap.** Với tốc độ lượt 3-clip (c0 ~1,25 B-cap/lượt, c2 ~3,25)
  cần ~59 lượt nữa cho c0; với lượt c0-only (~24 B-cap c0/lượt) cần
  ~3 lượt nữa cho c0 + ~24 lượt 3-clip cho c2. Đây là dự án nhiều đợt.
- **Thiết kế c0-only ĐÃ KIỂM CHỨNG:** 1 lượt `--nclips 1` cho 24 B-cap
  c0 (78 cap toàn c0) vs 12 B-cap c0 trong lượt 3-clip — gấp 2× số
  lượng trên 1/3 thời gian phát. B-band trung bình không đổi (chr B
  mean ~0,77).
- **Cờ theo dõi (heterogeneity):** pair-like c0-only 4/24 (16,7%) vs
  c0 3-clip 0/17 (F6 0/5 + r37 0/12), Fisher hai phía p=0,13 — chưa có
  ý nghĩa thống kê nhưng lệch đúng hướng "c0-only giàu pair-like hơn".
  Giả thuyết: mỗi lượt 1-clip là 1 session mới nên pump luôn lạnh tối
  đa (warm-up mạnh nhất); trong lượt 3-clip c0 cũng là clip đầu nhưng
  session đã "ấm" hơn ở lượt chạy trước? Không — mỗi lượt probe là 1
  page load mới, c0 luôn lạnh như nhau. Nhiều khả năng là nhiễu mẫu
  nhỏ. **Quy định:** nếu các lượt c0-only sau vẫn ~17% trong khi c0
  3-clip vẫn ~0%, 2 thiết kế KHÔNG hoán đổi được → tách pool, báo riêng.
  Hiện tại vẫn gộp theo prereg (p=0,13 chưa đủ bằng chứng tách).
- Lưu ý: chr-blur-r37 lấy mẫu rất dày (232 cap, gần đủ 270 key) nên
  band A phình to (141/205 = 69% A) — đó là triple liên tiếp khỏe mạnh
  (g≈0,449 stripes) khi tick dày, KHÔNG phải cụm A r7. Đừng đọc số A
  này như "cụm A tăng".

---

## §3. D floor — 0/2041, CI trên 0,147%

| nguồn | cap dùng | D |
|---|---|---|
| C4 post-fix | 867 | 0 |
| D4 post-fix | 566 | 0 |
| E6 post-fix | 207 | 0 |
| F6 post-fix | 127 | 0 |
| G7 stripes (r37 + r37c0) | 274 | 0 |
| **Gộp post-fix** | **2041** | **0** |

- Fisher một phía vs pre-fix 28/1547: **p=5,12e-11**. 95% CI trên
  (rule of three): **0,147%** (F6: 0,170%). Cap stimulus mới không gộp
  (band khác, xem §1.1).
- Pool=1 post-fix (stripes G7): r37+r37c0 có ringSize=1? — không tách
  riêng trong bản phân tích này (chỉ đếm D); D=0 toàn lượt nên không
  ảnh hưởng kết luận.

---

## §4. Hiệu chuẩn g trên stimulus mới (mô tả)

- Triple 3 frame phân biệt (content đã nhận diện): **g 0,616–0,635**
  (n=9 sự kiện phân biệt, dải hẹp ±0,01). Dự đoán trung bình thuần
  1/√3 = 0,577; đo offline trên refs 0,589±0,006 (mọi filter resize).
  **Lệch +0,03..+0,05 chưa giải thích được** — đã loại: tương quan cặp
  frame (ρ=0,021 → 0,589), codec (MAD decoded-vs-source 1,1),
  filter downscale (BILINEAR/NEAREST/BOX đều 0,587–0,591). Nghi: trọng
  số blend thực tế (current được vẽ 2 lần qua drawFrame + layer?) hoặc
  thành phần chia sẻ chưa thấy (vùng digits?). Ghi là nợ mở — không
  ảnh hưởng verdict r7 (strip mới là bằng chứng quyết định).
- Pad-clone {a,a,b}: **0,774–0,777** (n=2; dự đoán √(5/9)=0,745 —
  lệch +0,02..+0,03, cùng hướng với triple, nhất quán với 1 hệ số
  chung chưa rõ).
- Pair (2 frame): không có sự kiện pair thuần nào trong decisive r38.

---

## §5. Dị thường + bài học harness

1. **Lỗi WITH_BLUR (§0):** config mới `noise-blur` quên bật motion spec
   → 2 lượt r37 chạy noblur. Phát hiện qua `blendTickN=0` trong log
   KẾT QUẢ ngay sau lượt đầu; sửa 1 dòng, chạy lại r38. Bài học: khi
   thêm config probe mới, kiểm tra `blendTickN>0` ở lượt pilot đầu
   trước khi chạy tiếp (đã làm — chỉ mất 2 lượt, và 2 lượt đó vẫn dùng
   được làm baseline).
2. **Cap 96×54 không nhận diện được content (§1.2):** filter mismatch
   giữa downscale live và scaler offline ở tỉ lệ 13,3×. Mọi đo content
   từ nay chỉ dùng strip full-res (ghostPix/curPix/pump pix), không
   dùng cap px.
3. **Đổi build giữa lượt (§0):** G1 land F8 lúc 11:52:15Z. Vì probe tắt
   F3 nên chế độ đo không đổi; nhưng lượt chr r38 vẫn ghi là "lai"
   (md5 đổi giữa chừng) để đợt sau khỏi gộp mù. Quy tắc cũ vẫn đúng:
   ghi md5 trước/sau mỗi lượt + kiểm tra marker pad-oldest.
4. **Đường tick WebKit nhiễu nhãn nặng (§1.2/§1.4):** ghost content ==
   nhãn riêng chỉ 18,3% (vs 95,7% chr rVFC); snapshot giữ frame cũ tới
   −16 frame; ring đóng băng lặp 14 tick. Mọi verdict content-gap chỉ
   lấy đường rVFC làm chính; đường tick chỉ hỗ trợ và phải dedup theo
   sự kiện blend phân biệt (không đếm tick).
5. **Loop-wrap cuối clip (§1.4):** pres 86→content 0 (8 tick, 1 sự kiện)
   — video loop trong khi nhãn presented chưa loop. Loại khỏi decisive;
   lượt sau cần quy ước biên clip rõ ràng.
6. **presented +1 bias (chr):** presented content = nhãn hoặc nhãn+1 ở
   70/82 tick (85%) — trình chiếu lật khung sau khi nhãn được đọc,
   trong nhiễu ±1 đã biết (F6 hiệu chuẩn 520 capture).

---

## §6. Kiểm chứng (cây cuối, md5 f0b9e496, ~12:05Z)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass 7,08s**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `scripts/test-preview-engine.sh` (apps/web/scripts/): **354 assertions pass**.
- Pad-oldest còn nguyên (marker `motionBlurPadGhostCount` +
  `lastDrawnPaddedGhosts`); F3 tap+relabel còn tắt được bằng cờ probe;
  `motionBlurBlendPlan` không đổi.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §7. Nợ còn lại

1. **r7 ĐÓNG với giả thuyết gap-2 (luồng này). Nợ mới: thành phần content
   thật của cụm A stripes (g≈0,44, label gap 6)** — giả thuyết dẫn đầu
   (E6): triple liên tiếp khỏe mạnh với nhãn rải rác. Cần đo strip trên
   stripes với định nghĩa gap hiệu chỉnh (§1.3) + dedup sự kiện — đợt sau.
2. **B-band c0:** vẫn mở (p=0,22, power 46%); còn thiếu 74 c0 + 79 c2
   B-cap (~3 lượt c0-only + ~24 lượt 3-clip). Theo dõi heterogeneity
   c0-only vs 3-clip (hiện p=0,13).
3. **Lệch g triple +0,03..+0,05 (§4):** chưa giải thích được (đã loại
   tương quan/codec/filter). Nghi trọng số blend thực tế — cần đo blend
   weights live (vd cap của triple đã biết content, đối chiếu từng
   trọng số) ở đợt sau.
4. **Cửa sổ mù:** không đụng trong luồng này (giữ nguyên A5).
5. Các nợ ngoài phạm vi G7 (giữ nguyên từ LIMITS gộp đợt 104 §7): G1
   deinterlace (chờ user quyết metric G5/M2), 2 MiB, ghost F8 (G1 đã
   land F8 đợt 105 — theo dõi), F5 Re-arm (chờ A/B RAM cao), EPERM
   probe #24 + khoảng mù #23, birefnet (CẤM thử lại khi RAM chưa đổi),
   TTS 39 (CẤM kiểm lại), `ci-security.yml` 403 (chờ user), release
   gate giữ nguyên.

---

## File đổi/thêm (đợt 105 G7)

- `apps/web/scripts/gen105g7-frames-noise.py` — generator stimulus
  không tuần hoàn (đã sửa lỗi đường dẫn root; tái sinh chính xác bằng
  seed cố định).
- `apps/web/scripts/probe105g7-frame-parity.mjs` — probe copy probe104f6
  (config noise-blur/noise-noblur + WITH_BLUR đã sửa; SCRATCH
  round105-g7; `node --check` OK).
- `docs/PHASE9_ROUND105_G7_BLUR_LIMITS.md` — file này.
- `apps/web/public/frames-noise.mp4` (1.917.759 byte) — nhị phân, tạo bởi
  generator, KHÔNG stage (theo luật binary).
- Không push GitHub, không release/tag (giữ release gate).

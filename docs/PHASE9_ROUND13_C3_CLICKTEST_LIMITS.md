# Phase 9 đợt 13 — Luồng C3: click-test canvas thật cho 14 type transition V3 + ghost motion blur (LIMITS)

Ngày: 2026-10-27. Chạy trong đợt lớn đợt 13.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG code giả.
KHÔNG sửa file sản phẩm nào — vì không có bug vẽ canvas nào được chứng
minh (mọi frame vẽ được đều clip đúng, xem §2); các FAIL đều là frame
không tới được, không phải vẽ sai. Harness mới duy nhất + file này.

## 0. Harness

`apps/web/scripts/c3-round13-clicktest.cjs` — tái dùng mẫu CDP của
P5 đợt 11 / T5 đợt 12 (Node thuần + WebSocket, không Playwright), cổng
riêng: vite dev 5193, debug 9341, profile `/tmp/c3-cdprof`.

Chạy: `node apps/web/scripts/c3-round13-clicktest.cjs [smoke|full|diag|diag2|diag3|diag4|diag5|diag6]`
(mặc định full). Exit: 0 khi không có FAIL, 1 khi có FAIL, 2 khi harness lỗi.

- `smoke`: chẩn đoán (đủ 14 card V3, slider duration, canvas + bbox,
  phân bố pixel, MotionPanel) — không đổi transition/blur.
- `full`: đo chính (ghost pause + 14 type V3).
- `diag`/`diag2`/`diag3`/`diag4`/`diag5`/`diag6`: các lượt chẩn đoán đã dùng
  để phân biệt frame cũ stale / clip path hỏng / seek không hoàn tất
  (xem §4). Các mode diag chỉ in chẩn đoán, không tính PASS/FAIL sản phẩm
  (trừ 2 record load mẫu C0/C0b).

## 1. Mô hình đo — đọc trước khi đọc kết quả

Preview vẽ 1 clip/lần trên nền đen (xem `transitionPreview.ts`):
clip đang transitionOut chỉ hiện lớp A của cặp, phần còn lại là nền
khung `#0a0c10`. "Đúng hình học trên canvas" ở đây nghĩa là: pixel
trong vùng A = video (sáng), ngoài vùng A = nền khung (tối).

- Vùng kỳ vọng lấy từ chính `transitionPreview.ts` (bundle bằng esbuild
  rồi require trong Node): cùng 1 nguồn với code vẽ. Vì vậy test này
  chứng minh ĐƯỜNG VẼ CANVAS áp đúng spec (`applyTransitionLayer` +
  `drawVideoClipWithTransition`: clip path, seek, alpha) — KHÔNG chứng
  minh hình học đúng với render FFmpeg. Hình học đúng/sai với render là
  việc của harness V11/V12 đợt 12 (MAD 0.00–0.52 ở p=0.5 cho 14 type này).
- Chỉ đo lớp A (transitionOut), ở p=0.5 duy nhất. Lớp B (transitionIn)
  chưa đo trên canvas (cùng hàm `applyTransitionLayer`, nhưng chưa đo
  thì nói chưa đo).
- Cửa sổ đo transition: clip 2 mẫu (start 4s, duration 4s),
  transitionOut duration 2.0s (kéo slider thật bằng phím từ 0.5 lên 2.0)
  → cửa sổ [6.0s, 8.0s), p=0.5 đúng tại playhead 7.0s (snap frame 30fps).
  Chọn clip 2 vì ở 7.0s clip chữ mẫu (0.5–5.5s) đã hết, clip 1 đã hết —
  canvas chỉ có clip 2, không bị chữ phủ lên vùng đo.
- Cửa sổ đo ghost: clip 1, pause tại playhead chính xác 2.500s, frame
  hiện tại cố định, chỉ khác snapshot trong ring (xem §3).

Điều kiện đo (mọi lượt chạy): project mẫu 1280×720, canvas attr
872×776, frame bbox đo được 872×492@(0,142), lưới phân loại 80×45
(3600 điểm), lưới chờ 40×23, ngưỡng sáng LIT=32, PASS = trong vùng
sáng ≥ 90% VÀ ngoài vùng sáng ≤ 10%. Ngưỡng LIT=32 nằm giữa khoảng
trống đã đo: nền khung max channel = 16, pixel video tối nhất đo được
max channel = 64–66 (smoke S4: p1=64 rồi 66) — không có pixel nào rơi
vào (17, 65) trong các lần đo.

## 2. Kết quả

### 2.1 Lượt chính full5 (lượt full cuối cùng chạy hết, exit 1)

Tổng: 14 PASS, 3 FAIL / 17 (gồm 2 setup C0/C0b PASS).

| Type V3 (p=0.5, clip 2, 7.0s) | Kết quả | Trong vùng sáng | Ngoài vùng sáng | Chờ frame mới |
|---|---|---|---|---|
| diamondclose | FAIL — frame không tới (xem §2.2) | — | — | 45s timeout |
| squareopen | PASS | 100.0% (2000/2000) | 2.5% (40/1600) | 2.1s |
| squareclose | PASS | 92.6% (1482/1600) | 0.0% (0/2000) | 66ms |
| checker-alt | PASS | 99.1% (1783/1800) | 2.2% (40/1800) | 57ms |
| blinds-diag | PASS | 96.1% (1768/1840) | 0.5% (9/1760) | 124ms |
| split-h | PASS | 97.5% (1755/1800) | 2.2% (39/1800) | 67ms |
| split-v | FAIL — frame không tới (xem §2.2) | — | — | 45s timeout, MAD cuối 3.09 |
| barn-h | PASS | 95.0% (1710/1800) | 0.0% (0/1800) | 94ms |
| barn-v | PASS | 91.3% (1680/1840) | 0.0% (0/1760) | 61ms |
| rings | PASS | 96.8% (1720/1777) | 0.4% (7/1823) | 43ms |
| corners | PASS | 95.3% (1858/1949) | 0.0% (0/1651) | 93ms |
| star | PASS | 92.8% (655/706) | 0.0% (0/2894) | 42ms |
| clock-ccw | PASS | 92.7% (1706/1840) | 0.0% (0/1760) | 42ms |
| spiral | PASS | 97.2% (1748/1798) | 0.3% (6/1802) | 17ms |

12/14 type PASS với số đo sạch (ngoài vùng sáng ≤ 2.5% ở mọi type
pass; phần trong vùng chưa tới 100% là điểm biên antialias + pixel
video tối, không phải sai hình học — ngoài vùng gần như 0% mới là chỉ
báo clip path đúng).

### 2.2 Hai type FAIL trong full5 — và bằng chứng đối chiếu

- **diamondclose**: FAIL ở full5 (45s không thấy frame mới) NHƯNG đã
  PASS ở lượt chẩn đoán diag D3 với cùng phương pháp: trong 472/472
  (100.0%), ngoài 0/448 (0.0%), sau 8.1s chờ. Ở diag6 kiểm chứng lại
  cũng FAIL (45s). Kết luận trung thực: diamondclose VẼ ĐÚNG khi frame
  tới được (có bằng chứng PASS độc lập), nhưng tỉ lệ frame tới được
  trong môi trường này là thất thường theo lượt — FAIL ở full5/diag6
  là lỗi đo (frame không tới), không phải bằng chứng vẽ sai.
- **split-v**: FAIL ở cả full5 (45s, lit cuối 48% vs kỳ vọng 50%,
  MAD cuối vs frame cũ chỉ 3.09 — frame suýt tới nhưng không đạt
  ngưỡng MAD > 5) và diag6 (45s). Chưa từng quan sát được frame
  split-v đúng trên canvas. Hình học split-v đã KHỚP ở V11/V12
  (MAD 0.00 vs render FFmpeg) nên đây là TRẠNG THÁI CHƯA CHỨNG MINH
  trên canvas, không phải bằng chứng hình học sai. Muốn đóng: cần
  lượt chạy mà seek tới được frame (xem §5).

### 2.3 Ghost motion blur: KHÔNG ĐO ĐƯỢC (blocker môi trường)

Kết quả ghost ở full5: FAIL dạng probe lỗi, không phải FAIL dạng
signal thấp:

- Phương pháp cuối (pause, §3): seek 1.0 → 2.5, chờ canvas đổi, tối đa
  3 attempt × 20s — cả 3 attempt đều MAD = 0.00, lit cuối = 100%
  (canvas đóng băng đúng frame trước seek). Playhead nhích đúng
  (timecode 1 → 2.5 đã xác minh), nhưng không có lần vẽ pause nào xảy
  ra cho clip 1.
- Lặp lại ở diag6 (sau warm-up phát clip 1 đủ 2 lượt 0→4s): cả 12
  attempt (off1/off2/on/off3 × 3) đều MAD = 0.00. Blur bật đã xác minh
  bằng click thật (checked=true, 3 slider weights).
- Các phương pháp chơi lúc đang phát đã thử và loại: baseline
  off-vs-off = 53.43 (chụp ngoài page, lệch thời gian) và 7.89 (chụp
  trong page theo rAF, vẫn lệch vì main thread chậm làm timecode nhảy
  tới 7.3667 khi target 7.0) — đều át tín hiệu, không dùng được.
  Baseline của P5 đợt 11 (0.32–0.59) không tái lập được ở đây.

Kết luận ghost: **không PASS, cũng không phải bằng chứng ghost hỏng**.
Bằng chứng gián tiếp rằng đường blend hoạt động khi frame vẽ được:
probe composite của T1 đợt 12 (10/10, pixel 240 → 90 đúng tmix) và
12 frame transition PASS ở §2.1 (cùng đường vẽ `drawVideoClip`).
Muốn đo ghost trên canvas thật thì phải gỡ được blocker seek ở §5
trước — đừng đọc FAIL này thành "ghost vẫn vô hình như P5", vì P5 đo
được signal (0.88–1.05, dưới ngưỡng) còn ở đây không đo được gì cả
(canvas không đổi 1 pixel).

## 3. Thiết kế probe ghost (pause) — vì sao chọn cách này

P5 đo lúc đang phát và thất bại vì frame hiện tại đục che ghost (đã
sửa ở T1 đợt 12 thành blend). Để đo blend T1 trên canvas, probe phải
so 2 frame có cùng frame hiện tại nhưng khác snapshot trong ring:

1. Phát clip 1 ~2s (nạp snapshot từ frame chuyển động).
2. Pause, seek 1.0 rồi seek 2.5 (mỗi seek vẽ 1 lần; lần vẽ 2.5 blend
   snapshot lúc phát + frame 2.5).
3. Tắt blur, seek lại 1.0 → 2.5, chụp frame 2.5 sạch.
4. So MAD(on, off) với baseline MAD(off, off) — cùng playhead chính
   xác 2.500s nên baseline phải ≈ 0 nếu giải mã xác định.

Probe này đúng về mặt thiết kế nhưng không chạy được ở đây vì bước 2
không bao giờ vẽ (xem §5). Giữ lại thiết kế cho lượt sau, đừng quay
lại cách đo lúc đang phát (baseline đã chứng minh là nhiễu).

## 4. Các lỗi harness đã sửa trong lúc chạy (đọc để khỏi lặp lại)

1. **Đọc playhead bằng handle là sai**: `.tl-playhead-handle` định vị
   theo ancestor khác nên `handle.left - ruler.left` cho ra playhead
   âm giả (−0.108 thay vì 5.0). Đã sửa: đọc từ readout `.tl-timecode`
   (HH:MM:SS:FF @30fps) — chính xác tuyệt đối, đã xác minh 5.000/7.000.
2. **Đóng modal flaky**: click (20,20) một lần đôi khi không đóng
   được modal welcome. Đã sửa: thử lần lượt click backdrop → Escape →
   nút đóng (×/đóng).
3. **Early-return làm mất exit code**: `return` trong `main()` bỏ qua
   đoạn tally cuối nên FAIL vẫn exit 0. Đã sửa: tally tập trung ở
   `finish()`, mọi đường thoát đều qua đó.
4. **Bẫy frame cũ stale (nghiêm trọng nhất)**: lần full 1 chờ "canvas
   sáng" là đủ nên nhận frame cũ của clip 1 (100%/100% cho cả 11
   type) và kết luận sai thành clip path hỏng. Đã sửa: chỉ chấp nhận
   frame mới khi MAD so với frame trước seek > 5 VÀ tỉ lệ sáng khớp
   vùng kỳ vọng ±12pp VÀ timecode đúng 7.0.
5. **Paused path chỉ vẽ khi playhead đổi**: đổi type mà playhead vẫn
   7.0 thì không bao giờ có frame mới (full4: checker-alt/blinds-diag/
   split-h chờ vô ích với frame cũ của squareclose, lit 46%). Đã sửa:
   nudge bắt buộc 7.033 → 7.0 trước mỗi type.
6. **Polling tranh CPU với decode**: quét bbox toàn canvas (677k px)
   mỗi 500ms làm chậm chính video đang chờ. Đã sửa: đo bbox 1 lần
   rồi cache (mọi lượt đều ra 872×492@(0,142)), poll chờ 1000ms, lưới
   chờ 40×23 (phân loại cuối vẫn 80×45).
7. **Ghost lỗi không được chặn phần còn lại**: full3 throw ở ghost làm
   mất cả 14 type. Đã sửa: ghost try/catch → ghi FAIL rồi chạy tiếp.

## 5. Blocker môi trường — seek pause không hoàn tất (chưa phải bug sản phẩm)

Quan sát lặp lại qua 9 lượt chạy (smoke/full/diag/diag2/diag3/diag4/
diag5/diag6):

- Khi phát (playing path vẽ mỗi frame), video vẽ được: clip 1 lit 100%
  sau ~2s phát (diag3); clip 2 vẽ được từ ~7.1s khi phát từ 4.0 (diag3).
- Khi pause (Seeker: seek → chờ `seeked` → mới vẽ 1 lần), frame tới
  được rất thất thường: có lượt tới sau 8.1s (diag D3), 42s (full4
  squareclose), 2.1s (full5 squareopen); có lượt không tới sau 45–60s
  (diag3 clip 2 pause 60s; full5 ghost 3×20s; diag6 ghost 12 attempt).
- Khi frame không tới, canvas đóng băng đúng trạng thái cũ: nền
  (diag5: meanRGB đúng (10,12,16)), chữ-only 3% (diag3 clip 2 pause),
  hoặc frame cũ 100% (full5 ghost). Playhead vẫn nhích đúng (timecode
  đã xác minh) — seek "thành công" ở tầng playhead nhưng không kéo
  theo lần vẽ nào, hoặc lần vẽ xảy ra khi frame chưa giải mã xong rồi
  đóng băng (vì `lastDrawnT` đã cập nhật nên không vẽ lại).
- Cơ chế nghi ngờ (chưa chứng minh tới cùng, vì pool video là closure
  không đọc được từ CDP): webm do MediaRecorder ghi thiếu Cues nên
  seek phải quét file; element detached + decode mềm trên VM 2 CPU +
  headless làm `seeked`/HAVE_CURRENT_DATA chậm/không ổn định. Trên
  máy thật / trình duyệt thật có thể không xảy ra — đừng kết luận đây
  là bug sản phẩm nếu chưa đo trên máy thật.
- Hệ quả thực tế cho click-test: muốn đóng nốt split-v và ghost trên
  canvas thì cần (a) chạy lại vào lúc máy rỗi hơn, hoặc (b) media mẫu
  có Cues/keyframe dày để seek ổn định, hoặc (c) đo trên trình duyệt
  thật. Riêng giả thuyết "render sau `seeked` nhưng trước
  HAVE_CURRENT_DATA sẽ đóng băng khung nền/chữ" đáng để luồng sau
  kiểm tra trong code (đường pause của `PreviewCanvas`), nhưng luồng
  này không sửa vì chưa có bằng chứng phân biệt với lỗi môi trường.

## 6. Giới hạn trung thực — click-test này KHÔNG chứng minh

- Chỉ p=0.5, chỉ lớp A (transitionOut), chỉ clip 2, chỉ playhead 7.0s,
  chỉ khung 1280×720, chỉ media mẫu tổng hợp (webm canvas, không phải
  footage quay thật), không đo HD/1080p, không đo FPS khi blend.
- Không chứng minh hình học đúng với render (đó là V11/V12) — chỉ
  chứng minh canvas áp đúng spec đã có.
- Không chứng minh ghost blend (blocker §5); không chứng minh weights
  đổi thì pixel đổi (cùng blocker).
- Không chứng minh B-layer (transitionIn), không chứng minh transition
  trên clip có mask/SR/track, không chứng minh clip dài / nhiều clip.
- Vite dev đã phục vụ app thành công trong cả 9 lượt chạy (coi như
  kiểm chứng build ở mức dev); không chạy `tsc` riêng vì luồng này
  không đụng file TS/TSX sản phẩm nào (chỉ thêm file .cjs + file .md
  này), và chạy tsc giữa lúc các luồng round 13 khác đang sửa file sẽ
  cho kết quả nhiễu.

## 7. File đổi/thêm (tương đối từ repo root, KHÔNG push)

- `apps/web/scripts/c3-round13-clicktest.cjs` (mới, harness click-test C3
  gồm các mode smoke/full/diag/diag2/diag3/diag4/diag5/diag6)
- `docs/PHASE9_ROUND13_C3_CLICKTEST_LIMITS.md` (mới, file này)

Không sửa file sản phẩm nào. Không tạo tag, không push.

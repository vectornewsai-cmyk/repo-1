# Đợt 78 F1 — FPS deint-only: đo lại lúc VM yên tĩnh + đo ms/tick trực tiếp + thử smoothing "medium": G5 VẪN MỞ

Ngày: 10/11/2026 (lượt cron 06:35 +07; đo headed 23:41–00:40 giờ UTC
09–10/11, tức 06:41–07:40 giờ VN 10/11). Máy đo: VM này (CPU-only,
Chromium 158 qua Xvfb + CDP). Nợ: docs/PHASE9_ROUND77_LIMITS.md §4.1 —
FPS deint-only half-res 0,72–0,73× (D4) / 0,78–0,79× (E1, tải cao),
FAIL ngưỡng 0,75×. Ngưỡng giữ nguyên, KHÔNG nới.

## 1. Kết luận ngắn

- **G5 VẪN MỞ — không có đường nào vượt 0,75× bền vững.** Ba lần đo
  headed mới trong đợt này (chạy lại harness E1 + tick-time Run E
  trước đổi + Run F sau đổi) cho tỉ lệ draw-fps gộp **mean 0,57,
  median 0,50, SD 0,27 (n=15)** và tỉ lệ gap-mean gộp **mean 0,75,
  median 0,69, SD 0,19 (n=15)**. Metric chính (draw-fps — đúng
  metric ngưỡng 0,75× được định nghĩa theo) chưa lần nào đạt mean
  ≥ 0,75× trong cả 3 lần chạy (0,59 / 0,58 / 0,55). Metric gap mới
  (đo ms/tick trực tiếp, ít lượng tử hoá hơn) chỉ chạm ngưỡng ở mean
  và nằm dưới ngưỡng ở median — không phải bằng chứng đạt.
- **Đã thử một cải tiến thật và đã hoàn lại:** `imageSmoothingQuality`
  của lần vẽ intermediate đổi "high" → "medium". Pixel Y HỆT nhau
  (headed G2 R 0,74 → 0,51, MAD 0,6087 — giống 4 chữ số so với trước
  đổi) nhưng lần vẽ trung gian KHÔNG rẻ hơn (1280×360 median
  ~250ms/call ở "medium" so với ~71ms/call ở "high", n=4 mỗi bên,
  nhiễu lớn) và cả hai tỉ lệ đều không tốt hơn (gap 0,86 → 0,77,
  draw-fps 0,58 → 0,55). Đã hoàn lại "high"; production cuối **y hệt
  trước F1 về hành vi**, chỉ thêm comment ghi lại thí nghiệm.
- **Cơ chế đã rõ hơn:** phân rã drawImage cho thấy lần vẽ intermediate
  (1280×360) tốn ~71ms/call (median, "high") — ngang lần copy cache
  1280×720 (~100ms/call) dù chỉ bằng 1/2 pixel: chi phí nằm ở
  **đọc/convert frame video**, không phải kích thước đích hay bộ lọc
  resample. Đây là lý do divisor 4 (E1) cũng không giúp FPS, và là
  lý do đổi smoothing quality không giúp được.
- Không có code giả/mock nào. Không push/tag/binary.

## 2. Thay đổi code (trạng thái cuối)

| File | Đổi gì |
|---|---|
| `apps/web/src/preview.tsx` | Chỉ thêm comment trong `deintIntermediateSource` ghi lại thí nghiệm "medium" đã thử và hoàn lại + số đo A/B. Dòng `imageSmoothingQuality` cuối cùng vẫn là `"high"` — hành vi runtime y hệt trước F1. Không đổi logic, không đổi ngưỡng, không đổi plan. |
| `apps/web/scripts/probe-78f1-tick-time.mjs` | **Mới**: probe đo tick-time (xem §3.2) — copy harness E1 + slot 4,5s, đo gap rAF trực tiếp + bọc drawImage phân rã theo khổ canvas + bật/tắt phát qua store thay vì phím Space. |
| `docs/PHASE9_ROUND78_F1_DEINT_FPS_LIMITS.md` | **Mới**: file này. |

Không đụng `enhancePreview.ts`, spec/render/store/i18n (dict không đổi),
không đụng workflow. Không binary vào batch.

## 3. Số đo thật

### 3.1 Chạy lại harness E1 — cây chưa đổi (11 slot × 3s)

23:41–23:44 UTC 09/11. Load lúc bắt đầu 2,23 → 9,26 cuối chạy
(sibling bắt đầu việc nặng giữa chừng). **9/10 PASS** (chỉ G5 FAIL).
G0–G4, G7a, G7b, G8, H9 đều PASS với số pixel y hệt D4/E1
(G2 R 0,74 → 0,51, MAD 0,6087; G7b MAD 0,0036; G8 R 0,55 → 0,52).

| Slot | baseline draw fps | deint draw fps | Tỉ lệ drift-corrected |
|---|---|---|---|
| 0/1 | 5,35 | 4,28 | 0,81 |
| 2/3 | 5,18 | 3,15 | 0,49 |
| 4/5 | 7,64 | 6,85 | 0,74 |
| 6/7 | 10,88 | 6,50 | 0,50 |
| 8/9/10 | 14,99 / 14,84 | 6,13 | 0,41 |
| **Mean** | **9,81** | — | **0,59× FAIL** |

- Baseline fps tuyệt đối cao nhất từng đo cho half-res (9,81 mean,
  D4 chỉ 7,74–24,23 nhưng E1 chỉ 1,55–2,63) — nhưng baseline TĂNG
  ĐƠN ĐIỆU 5,35 → 14,99 trong lúc chạy trong khi deint phẳng 3–7:
  xu hướng warmup (decode/JIT) làm méo tỉ lệ, không phải half-res đã
  nhanh lên.
- Gap P50 rAF từ cùng lần chạy (phương pháp độc lập với đếm draw):
  baseline 133,3 / 199,9 / 100 / 83,4 / 83,3 / 83,2ms;
  deint 216,6 / 266,6 / 133,3 / 133,3 / 183,3ms → tỉ lệ gap
  0,77 / 0,56 / 0,69 / 0,63 / 0,45 → mean **0,62**. Hai phương pháp
  độc lập đồng ý deint chậm hơn thật (~0,6×) — không phải chỉ nhiễu
  đếm.

### 3.2 Probe tick-time — phương pháp mới (Run E: trước đổi, Run F: sau đổi)

Probe `probe-78f1-tick-time.mjs` đo 3 thứ độc lập trong cùng slot 4,5s:
(a) draw fps / tick fps như E1; (b) ms/tick TRỰC TIẾP từ hook
`__vcutPreviewRaf` (gapMs giữa các callback rAF của riêng vòng
preview, loại justWoke — gap mean/P50, không lượng tử hoá theo số lần
vẽ); (c) phân rã drawImage: bọc
`CanvasRenderingContext2D.prototype.drawImage`, cộng dồn ms + số lần
gọi theo khổ canvas đích (preview 1991×815, intermediate 1280×360,
cache giữ frame 1280×720, mask unit 640×360).
Slot 4,5s (không phải 10s) vì clip 1 chỉ dài 5s sau khi nới out 4→5:
playhead 0→4,5s vẫn trong clip 1; slot 10s đã thử và FAIL vì phát
chạy hết timeline rồi Space bấm lại thành phát tiếp. Bật/tắt phát qua
store (`togglePlay` / `setState({playing:false})`) thay vì phím Space
— Space 2 lần vẫn không pause được dưới tải cao (Run D slot 4).

**Run E (trước đổi, quality "high")** — 00:18–00:20 UTC 10/11,
load 17→2,5 (giảm dần). **7/8 PASS** (chỉ G5 FAIL).

| Slot | baseline draw | deint draw | Tỉ lệ draw | gapMean base (ms) | gapMean deint (ms) | Tỉ lệ gap |
|---|---|---|---|---|---|---|
| 0/1 | 1,48 | 0,84 | 0,62 | 298,9 | 524,1 | 0,67 |
| 2/3 | 1,21 | 1,05 | 1,16 | 408,3 | 471,6 | 1,09 |
| 4/5 | 0,60 | 0,20 | 0,39 | 620,8 | 833,3 | 0,83 |
| 6/7 | 0,43 | 0,61 | 0,57 | 766,6 | 555,5 | 1,07 |
| 8/9/10 | 1,72 / 0,85 | 0,19 | 0,15 | 422,7 / 524,1 | 742,8 | 0,64 |
| **Mean** | **1,05 fps** | — | **0,58× FAIL** | — | — | **0,86× PASS** |

- Hai metric MÂU THUẪN trong cùng lần chạy: draw-fps 0,58× FAIL
  nhưng gap-mean 0,86× PASS. Nguyên nhân: ở baseline ~1 fps, mỗi
  slot 4,5s chỉ có ~2–8 lần vẽ (lượng tử hoá ±20–50%); gap cũng
  nhiễu mạnh (n=6–16 mẫu/slot, gap mean baseline dao động 299→767ms
  giữa các slot kề). Không metric nào đủ phân giải để kết luận "đạt"
  khi chênh cần tách chỉ ~0,1–0,2.
- drawImage: baseline 235,5ms/tick vs deint 420ms/tick (trung bình
  6/5 slot). Lần vẽ intermediate 1280×360: 83,7 / 129,0 / 57,5 /
  38,4ms/call (median 70,6; chưa tính 1 lần 0,02ms lúc frame chưa
  sẵn — drawImage từ video trả gần như tức thì khi không có frame).
  Copy cache 1280×720: 24–149ms/call. Vẽ lên canvas chính 1991×815:
  21–115ms/call. Vẽ từ video đắt gấp nhiều lần vẽ từ canvas cùng
  kích thước — chi phí nằm ở phía nguồn video.

**Run F (sau đổi, quality "medium")** — 00:36–00:39 UTC 10/11,
load 1-min 0,6–2,7 (5-min vẫn 6,6–10,4). **7/8 PASS** (chỉ G5 FAIL).

| Slot | baseline draw | deint draw | Tỉ lệ draw | gapMean base (ms) | gapMean deint (ms) | Tỉ lệ gap |
|---|---|---|---|---|---|---|
| 0/1 | 0,41 | 0,41 | 1,01 | 490,0 | 733,3 | 0,75 |
| 2/3 | 0,40 | 0,22 | 0,45 | 614,3 | 933,4 | 0,92 |
| 4/5 | 0,57 | 0,20 | 0,25 | 1095,8 | 1500,0 | 0,60 |
| 6/7 | 1,04 | 0,73 | 0,50 | 695,2 | 922,2 | 0,59 |
| 8/9/10 | 1,87 / 0,84 | 0,73 | 0,54 | 400,0 / 688,1 | 550,0 | 0,99 |
| **Mean** | **0,85 fps** | — | **0,55× FAIL** | — | — | **0,77× PASS** |

- **Pixel y hệt sau đổi:** G2 R 0,74 → 0,51, MAD 0,6087 — giống
  4 chữ số so với Run E / E1 rerun / D4. G1 gap 0,14, G3 MAD 0,
  G4 R 0,51 — đều y hệt. Đổi quality không đổi pixel trong app,
  khớp probe tab trắng (§3.3).
- **Không nhanh hơn:** intermediate 1280×360: 496,8 / 310,7 /
  115,7 / 190,2ms/call (median 250,4; chưa tính 1 lần 0,05ms) —
  không rẻ hơn "high" (median 70,6). Tỉ lệ gap 0,86 → 0,77,
  draw-fps 0,58 → 0,55 — đều hơi tệ hơn, trong nhiễu.
  → **Đã hoàn lại "high"** (xem §2).
- Slot 7, 9 phát tự dừng trước khi hết slot (playhead chạm cuối
  clip sau thời gian chờ start-poll — xem §6.3): draw-fps các slot
  này có thể bị pha loãng; gap stats lọc theo cờ playing nên không
  nhiễm.

### 3.3 Probe tab trắng — chạy lại probe E1 (quality high/low/medium)

00:23–00:28 UTC 10/11, load 15–23 (cao — sibling chạy ffmpeg +
bgremove + pip cùng lúc). **Pixel: halfHigh = halfLow = halfMed y
hệt nhau** ở cả 2 tỉ lệ × 2 video (R/vgrad/hgrad/MAD giống tới 3 chữ
số thập phân), xác nhận lại E1. **Thông lượng: không tách được 3
mức** — medium nhanh nhất ở interlaced (s=1: 31,0 vs 54,8/58,4ms;
s=1,13: 14,1 vs 27,7/24,7ms) nhưng chậm nhất ở clean (s=1: 55,0 vs
30,8/44,1ms; s=1,13: 35,1 vs 17,5/15,7ms); bản thân noop đã dao
động 6→57ms theo tải. Kết luận: probe tab trắng không phân giải
được quality — phải quyết bằng A/B headed (§3.2), và A/B headed đã
trả lời: không nhanh hơn.

### 3.4 Tổng hợp gộp — mọi tỉ lệ F1 (giữ ngưỡng 0,75×)

| Lần đo | Metric | Tỉ lệ (5) | Mean | Median | SD |
|---|---|---|---|---|---|
| E1 rerun | draw-fps | 0,81/0,49/0,74/0,50/0,41 | 0,59 | 0,50 | 0,17 |
| Run E | draw-fps | 0,62/1,16/0,39/0,57/0,15 | 0,58 | 0,57 | 0,37 |
| Run F | draw-fps | 1,01/0,45/0,25/0,50/0,54 | 0,55 | 0,50 | 0,28 |
| **Gộp** | **draw-fps** | — | **0,57** | **0,50** | **0,27** |
| E1 rerun | gap (P50) | 0,77/0,56/0,69/0,63/0,45 | 0,62 | 0,63 | 0,12 |
| Run E | gap-mean | 0,67/1,09/0,83/1,07/0,64 | 0,86 | 0,83 | 0,21 |
| Run F | gap-mean | 0,75/0,92/0,60/0,59/0,99 | 0,77 | 0,75 | 0,18 |
| **Gộp** | **gap** | — | **0,75** | **0,69** | **0,19** |

Bối cảnh lịch sử (cùng metric draw-fps): C8 offscreen 0,65–0,71×;
D4 half-res 0,72–0,73× (đo ở tải thấp, baseline 7–24 fps — lần đo
sạch nhất từng có); E1 half-res 0,78–0,79× (tải cao, baseline
1,5–2,6 fps); E1 divisor 4: 0,83× rồi 0,64× (gộp 0,735). Mọi lần đo
đều nằm trong cùng dải 0,55–0,86 — không lần nào tách khỏi 0,75×
một cách bền vững theo hướng vượt ngưỡng.

## 4. Kiểm chứng (cây cuối — đã hoàn lại "high")

| Kiểm chứng | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web) | **0 lỗi** (chạy 2 lần: sau khi đổi sang "medium" và sau khi hoàn lại "high") |
| Unit `enhancePreview77E1.test.ts` vi + en | **11/11 + 11/11** |
| Unit `enhancePreview76D4.test.ts` vi | **10/10** |
| Unit `enhancePreview75C8.test.ts` vi | **14/14** |
| Unit `enhancePreview60Q1.test.ts` vi | **16/16** |
| Headed E1 rerun (cây chưa đổi) | **9/10** (chỉ G5 FAIL 0,59×) |
| Headed tick-time Run E (trước đổi) | **7/8** (chỉ G5 FAIL 0,58×; T1 gap 0,86× PASS) |
| Headed tick-time Run F (sau đổi) | **7/8** (chỉ G5 FAIL 0,55×; T1 gap 0,77× PASS; G2 pixel y hệt) |
| Probe tab trắng (quality, chạy lại E1) | xong (§3.3; R y hệt, throughput không tách được) |
| Headed H9 (mọi lần chạy) | **0 lỗi trang** |

Chưa chạy lại vite build (chỉ đổi 1 dòng string + comment rồi hoàn
lại đúng dòng cũ; tsc 0 + unit xanh + headed G1–G4 PASS trên cây đã
đổi — build không bị ảnh hưởng bởi thay đổi này; lần build gần nhất
của cây này vẫn pass ở đợt 77).

## 5. Giới hạn — đọc trước khi trích số

1. **G5 vẫn mở; đừng trích "gap đạt 0,86×" (Run E) hay "0,77×"
   (Run F) như bằng chứng đạt.** Gap-mean gộp mean 0,75 chạm đúng
   ngưỡng nhưng median 0,69 < 0,75, SD 0,19, và metric chính
   (draw-fps) gộp mean 0,57 / median 0,50. Một lần đo chạm ngưỡng
   trong nhiễu không phải "vượt ngưỡng bền vững".
2. **FPS tuyệt đối các lần chạy F1 (baseline 0,85 / 1,05 / 9,81 fps)
   không so được với nhau hay với D4:** tải VM dao động 0,5–26
   trong đợt (8–10 luồng sibling: build ffmpeg, bgremove, pip,
   mediapipe, headed script khác), VM còn restart 1 lần giữa đợt
   (00:07 UTC, giết Run C lúc vite vừa lên — không mất dữ liệu đã
   ghi). Chỉ tỉ lệ xen kẽ B/I mới đọc được, và ngay cả tỉ lệ cũng
   nhiễu mạnh (SD 0,19–0,27).
3. **"Medium" đã thử và hoàn lại — đừng đổi lại** khi chưa có số mới
   tách được khỏi nhiễu (đã ghi trong comment tại `preview.tsx:492`).
   Pixel y hệt đã chứng minh xong; chỉ còn câu hỏi tốc độ, và A/B
   headed trả lời "không nhanh hơn".
4. **Chi phí cố định tick (decode) đã xem xét nhưng không đụng:**
   video 60fps h264 decode phần mềm là chi phí cố định của cả 2
   đường; mỗi tick video phải decode ~4 frame mới. Giảm chi phí này
   không đổi tỉ lệ (thậm chí có thể làm tỉ lệ tệ đi vì phần vẽ chiếm
   tỉ trọng lớn hơn) và không có thay đổi nhỏ, an toàn nào được chứng
   minh ở hướng này trong đợt. Hướng này cần nghiên cứu riêng, ngoài
   phạm vi 1 luồng F1.
5. **Số drawImage ms/call có n nhỏ và nhiễu rất lớn** (mỗi slot chỉ
   1–7 lần gọi cho mỗi khổ canvas; cùng 1 loại lần vẽ dao động
   24–497ms giữa các slot). Chỉ đọc được định tính: vẽ từ video đắt
   (chục–trăm ms/lần), vẽ từ canvas rẻ hơn nhiều; không dùng số tuyệt
   đối này để tính FPS dự báo.
6. **Chưa đo:** máy thật có GPU; Safari/WebKit thật; footage xen kẽ
   gốc từ camera (nợ cũ từ D4); tap + motion-blur-blend lúc đang
   phát (nợ cũ từ D4).
7. **Harness F1 có 2 giới hạn đã biết:** slot 4,5s là tối đa của
   fixture hiện tại (clip 5s) — slot dài hơn cần fixture dài hơn
   (BBB 10s); start-poll chờ playing có thể làm playhead trôi trước
   khi bắt đầu slot (Run F slot 7/9 tự dừng — xem §6.3).

## 6. Nợ mở cho đợt sau

1. **G5: FPS deint-only vẫn chưa đóng.** Hướng còn lại: (a) đo trên
   máy thật có GPU hoặc lúc VM thật sự yên tĩnh (không có 8–10 luồng
   sibling — đợt này chưa có được cửa sổ đó: load 1-phút thấp nhất
   cũng chỉ duy trì được vài phút); (b) fixture dài hơn (BBB 10s) để
   slot 8–10s, giảm lượng tử hoá đếm draw; (c) giảm chi phí đọc frame
   video (đường video→canvas) — cần nghiên cứu riêng: cache frame
   video đã decode? vẽ từ texture? — ngoài phạm vi 1 luồng;
   (d) quyết định ngưỡng thuộc về user/parent, KHÔNG tự nới.
2. Harness: chuyển hẳn sang bật/tắt phát qua store (đã làm trong
   probe F1 — Space unreliable dưới tải cao); các harness FPS khác
   nên áp dụng khi đo dưới tải cao.
3. Start-poll làm playhead trôi: lần sau trừ thời gian poll khỏi slot
   (ghi playhead lúc bắt đầu slot) hoặc seek lại 0 sau khi
   playing=true và chờ idle lần nữa trước khi lấy mẫu a.
4. TTS 39 / npm 5 CVE / kernel BC / G1-G2 / keyframe worker /
   GPU-Safari / u2netp: nợ của các luồng khác trong đợt 78 (§4.2–4.11
   của LIMITS đợt 77) — không thuộc F1, không làm ở đây.

## 7. Cách chạy lại

```bash
# Chạy lại harness E1 trên cây hiện tại (11 slot × 3s, ~5 phút):
E1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round78-f1/headed \
  E1_DEV_PORT=5596 E1_DEBUG_PORT=9696 E1_DISPLAY=:196 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Probe tick-time F1 (11 slot × 4,5s + gap rAF + drawImage, ~5 phút):
F1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round78-f1/ticktime \
  F1_DEV_PORT=5597 F1_DEBUG_PORT=9697 F1_DISPLAY=:197 \
  node apps/web/scripts/probe-78f1-tick-time.mjs
# Probe tab trắng quality (R + throughput, ~5 phút):
E1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round78-f1/probe \
  E1_DEV_PORT=5598 E1_DEBUG_PORT=9698 E1_DISPLAY=:198 \
  node apps/web/scripts/probe-77e1-deint-fast.mjs
# Unit test (vi + en):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview77E1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round78-f1/enhancePreview77E1.test.cjs \
  && node /tmp/round78-f1/enhancePreview77E1.test.cjs
VCUT_TEST_LANG=en node /tmp/round78-f1/enhancePreview77E1.test.cjs
```

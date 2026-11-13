# Phase 9 đợt 90 — R1: sửa motion blur + mask ở preview (hướng (iii))

> Đóng nợ LIMITS gộp đợt 89 §4 mục 1 (Q2 §7.1): "Vòng sửa theo §7.1
> (snapshot theo frame video + mask 1 lần sau blend), kèm harness play bắt
> mốc ổn định hơn + đo lại A/B/C play + full click-test mask/track".
> Ngày: 11/11/2026. VM 4 vCPU EPYC 9D25, RAM 8 GB (không GPU).
> **Kết luận ngắn: hướng (iii) ĐÃ TRIỂN KHAI XONG và ĐO LẠI XANH — preview
> play nay không còn vệt mép mask (trail = 0 trên 383 khung play), mép sắc
> như pause (median 1.2–2.1px), tâm bám track tới ±0.001, và blur nội dung
> là thật (gStd play median 37–83 so với baseline pause ~112; render
> canonical B: 43–96 so với 127). Assert khóa preview A/B/C xanh hết.**

## 1. Thay đổi production (apps/web/src/preview.tsx + lib/previewEngine.ts)

### 1.1 Snapshot theo frame video, không theo tick (Q2 §7.1 điểm 1)

- Mới: `videoFrameIndex(timeSec, fps)` trong `lib/previewEngine.ts` —
  `floor(t·fps + 1e-6)`, -1 khi đầu vào không hợp lệ (không gate).
- `updateMotionBlurSnapshots` nhận thêm `frameIndex` (mặc định -1 = giữ
  hành vi cũ): **bỏ qua tick có cùng frame với snapshot mới nhất**
  (tick ~60fps mà video 30fps nên trước đây 2 tick liên tiếp thường
  snapshot cùng 1 frame → blend mất blur nội dung; tick lệch frame thì
  mask ở 3 vị trí track khác nhau blend thành vệt).
- Nhảy **lùi > 1 frame** (seek/loop) thì xoá ring (tránh bóng cũ trước seek
  ô nhiễm cửa sổ mới); lùi đúng 1 frame (phát ngược từng bước) vẫn nhận
  như snapshot mới (giữ hành vi reverse cũ); nhảy tiến (re-seek drift lúc
  phát xuôi) không reset.
- `frameIdx` tính trong `drawVideoClip` từ **frame thật đang vẽ**, không
  phải playhead: element video → `currentTime` (đúng cả khi speed ≠ 1 /
  reverse — tmix render blend các frame NGUỒN liên tiếp); held canvas →
  `firstHeldT` (đứng yên trong lúc hold → không thêm snapshot trùng);
  VideoFrame/ảnh → `localT` làm xấp xỉ.
- Mới: `motionBlurResetOnSeek(clipId, frameIndex)` — reset ring TRƯỚC khi
  blend (gọi ngay sau khi tính frameIdx). Lý do: chỉ xoá ở bước snapshot
  (sau khi vẽ) thì đúng tick seek đó blend vẫn dùng ring cũ 1 khung — đo
  được ở harness R1: khung đầu lượt phát 2 của case B blend bóng cuối
  lượt 1 với frame 0 (gStd 37.7 trong khi ring rỗng phải cho 112.4); sau
  sửa, khung đầu lượt phát về đúng 112.4.
- Hook đo `window.__vcutMotionBlurSnapshots` (Map clipId → {ring,
  lastFrame, skippedDuplicate, ringClears}) — mẫu `__vcutHoldStats`.
  Đo được sau phát: ring = 2 (= frames−1), skippedDuplicate = 4–47
  (gate có chạy thật, càng nhiều khi tick nhanh hơn frame).

### 1.2 Mask 1 lần sau blend (Q2 §7.1 điểm 2)

- Mới: `rawUnitSource` — đúng nửa đầu của `maskedUnitSource` (vẽ nội dung
  letterbox + cssFilter vào offscreen 640px) nhưng KHÔNG áp mask. Canvas
  riêng `rawUnitCanvas` (KHÔNG dùng chung `maskCanvas`: `maskedUnitSource`
  ghi đè maskCanvas sau blend mà snapshot rawUnit copy sau bước mask đó —
  dùng chung sẽ copy nhầm nội dung đã mask).
- Mới: `compositeMotionBlurLayer` tách từ `drawMotionBlurBlended` (trả lớp
  blend, không vẽ lên ctx); wrapper cũ giữ nguyên cho các đường không mask.
- Nhánh mask trong `drawVideoClip`: khi có blur thì **blend các unit THÔ
  (ở khổ 640×360 của unit, tránh thêm 1 vòng resample) rồi áp mask MỘT
  lần lên lớp blend tại vị trí mask HIỆN TẠI** (`maskedUnitSource(layer,
  0, 0, W, H, "", ...)`, cssFilter "" vì rawUnit đã mang), rồi mới vẽ
  lớp đã mask lên canvas chính. Transform SR (nếu có) **dời ra khỏi
  painter của lớp blend**, áp lúc vẽ lớp đã mask lên canvas chính — đúng
  cảnh báo rủi ro SR ở Q2 §7.2 (mask áp trong không gian chưa transform,
  đúng thứ tự render tmix → mask → SR).
- Blend thất bại (ring rỗng — vài tick đầu lúc phát — hoặc mask null) thì
  rơi xuống đường trực tiếp cũ; snapshot ở đường trực tiếp cũng lấy unit
  thô để ring đồng nhất (không trộn snapshot đã mask với thô).
- Các đường không mask: chỉ thêm `frameIdx` vào snapshot (gate theo
  frame) — không đổi ngữ nghĩa blend.

### 1.3 Không đổi

- `server/render/*` (render là canonical, Q2 đã khóa 51/51 — không chạy
  lại, không cần).
- Ngữ nghĩa ghost/blend (`motionBlurBlendPlan`, weights, alpha chạy),
  helper mask/track (`maskGeometryAtTrack`), gate chỉ-blend-khi-phát (R3),
  vignette, LUT/effects/enhance, transition/dip wrappers.
- Không đụng: TTS 39, file workflow, `drawImageClip` (ảnh không có motion).

## 2. Kết quả đo A/B/C play sau sửa (harness mới, xem §3)

Footage và spec GIỐNG HỆT Q2 (sọc đỏ/trắng chu kỳ 48px, 1280×720, 30fps;
mask ellipse w=0.4 h=0.5 feather=0; blur frames=3 weights [1,1,1]):
A = sọc tĩnh + track (0.3→0.7); B = sọc cuộn 12px/f + mask tĩnh x=0.5;
C = sọc cuộn + track. Mỗi case: pause baseline 3 mốc + 3 lượt phát,
đo bằng pixel thật trên canvas preview (872×276, quy về hệ project).

### 2.1 Tổng hợp (assert run, 3 lượt phát/case)

| Chỉ số | A (n=84 khung play) | B (n=98) | C (n=201) | Render canonical Q2 | Pause baseline |
|---|---|---|---|---|---|
| Trail trái (max) | **0** | **0** | **0** | 0 (18/18) | 0 (9/9) |
| Mép edgeL/R median | 2.0 / 2.1px | 1.2 / 2.1px | 2.0 / 2.1px | 0.8–1.9px | 1.1–2.6px |
| Mép edgeL/R max | 2.7 / 3.6px | 1.2 / 2.1px | 2.7 / 3.6px | ≤1.9px | ≤2.6px |
| Tâm vs track (lệch median từng khung theo ph) | 0.001 (max 0.0009) | 0.001 | 0.001 (max 0.0009) | ±0.001 | ±0.0008 |
| w50 median | 508.0–508.5 | 505.5 | 508.1–508.5 | 510.0 | 505.2–505.8 |
| gStd play median t=0.5/1.0/1.5 | 111.8 / 111.8 / 111.8 (= baseline) | 83.1 / 37.4 / 82.7 | 82.9 / 38.0 / 37.6 | B: 95.8 / 43.2 / 92.9 | ~112 |

Đọc bảng:
- **Vệt mép mask: HẾT.** Trước sửa: P3 vệt 12–16px, Q2 dưới tải tới 145px.
  Sau sửa: trail = 0 trên TẤT CẢ 383 khung play (không chỉ khung đúng mốc
  — harness mới kiểm mọi khung, xem §3).
- **Mép sắc như pause:** median 1.2–2.1px (pause 1.1–2.6px; render 0.8–1.9px).
  Max 3.6px chỉ ở khung lẻ (xem §5.2).
- **Tâm bám track:** lệch từng khung theo playhead median 0.001, max 0.0009
  — bằng độ chính xác của pause (Q2: ±0.0008) và render (±0.001).
- **Blur nội dung là thật:** B/C gStd play median 37–83 so với baseline ~112
  (giảm 26–67%); render B giảm 25–66% (127→43–96). A giữ nguyên ~111.8
  (identity — nguồn tĩnh, đúng như render MAD = 0.0).
- **w50:** play 505.5–508.6 vs pause 505.2–505.8 vs render 510.0 — chênh ≤5px
  (~1% của 512px), trong sai số lượng tử hoá của intermediate 640px +
  canvas 872px (1px canvas = 2.6px project; O4 §4 đã ghi hiệu ứng này).
  Play của B (mask tĩnh) = 505.5, bằng hệt pause — không có widening do
  blend; A/C cao hơn ~2.5px do mask track lấy mẫu ở nhiều pha sub-pixel
  (xem §5.2).

### 2.2 Trước/sau (so với số Q2 đã ghi)

| | Trước sửa (Q2) | Sau sửa (R1) |
|---|---|---|
| B play t=1.5 gStd | 112.4 = baseline (KHÔNG blur) | median 82.7 (blur thật) |
| A play t=1.0 gStd | 111.7 = baseline (KHÔNG blur) | 111.8 = baseline (đúng: nguồn tĩnh → identity) |
| Vệt mask play | 12–16px (P3), tới 145px (tải cao) | 0 trên 383 khung |
| Mép mask play | 17–25px (P3) | median 1.2–2.1px |

## 3. Harness mới + 3 bẫy đã sửa trong chính harness (Q2 §11 mục 1)

File: `apps/web/scripts/probe90r1-motionblur-preview.cdp.mjs` (kế thừa hàm đo
pixel của Q2 để số so được trực tiếp; `--assert` để khóa, `--cases a,b,c`,
`--passes 3` mặc định).

1. **Neo theo video.currentTime qua `__vcutMediaEls`, không querySelector
   ("video")** — video element của preview không gắn vào DOM (MediaPool tạo
   detached) nên querySelector trả null (vt=null ở lần chạy đầu R1).
2. **Không lọc mẫu theo cửa sổ cx** (Q2 §3.4: lọc cx loại đúng các khung bị
   vệt → mẫu "sạch" có điều kiện). Harness mới ghi MỌI khung rAF trong lúc
   phát (playhead + videoTime + đo pixel đầy đủ) rồi phân tích offline;
   trail/edge kiểm trên MỌI khung không đóng băng.
3. **Ba neo riêng cho ba đại lượng** (phát hiện từ lần đo đầu R1):
   - cx (vị trí mask) neo theo **playhead**: đo được cx = 0.3+0.2·ph chính
     xác tới ±0.001, trong khi vt lệch ph tới 0.25s (playhead chạy trước
     canvas sau seek — Q5 §6). Neo cx theo vt báo lệch giả tới 0.05.
   - **So từng khung** với track(ph của chính khung đó), không so median cx
     với track(t): mẫu ph trong cửa sổ không đối xứng quanh t làm median cx
     lệch khỏi track(t) tới 0.014 dù từng khung đều đúng tới ±0.001 (bẫy ở
     assert run 1: 6 fail giả, xem §3.1).
   - gStd (pha sọc) neo theo **videoTime** (|vt−t| ≤ 0.067).
   - Đóng băng = cùng pixHash VÀ playhead không chạy (định nghĩa cũ của
     Q2). Định nghĩa mới (chỉ hash) đã thử và BỎ: footage sọc tuần hoàn
     48px nên 2 frame cách nhau đúng 4 frame video cho canvas giống hệt
     nhau nhưng là 2 mẫu hợp lệ — làm mất mẫu B t=0.5 (n=0) ở assert run 1.

### 3.1 Assert run 1 (fail giả — lỗi harness, không phải sản phẩm)

6 fail, toàn bộ ở khâu cx: median cx so với track(t) lệch 0.006–0.014 +
B t=0.5 n=0 (do định nghĩa frozen mới loại nhầm khung tuần hoàn). Sau khi
sửa 2 điểm trên (§3 mục 3), assert run 2 **PASS toàn bộ** (xem §4).

## 4. Test khóa

### 4.1 Assert preview A/B/C (harness mới, `--assert`)

Chạy: `node apps/web/scripts/probe90r1-motionblur-preview.cdp.mjs
--cases a,b,c --passes 3 --assert`
(đòi vite dev cổng 5173 + media stripes-*.mp4 trong apps/web/public/).
**ASSERT PASS: tất cả kiểm tra xanh** (log `~/workspace/round90-r1/
assert-run2.log`, JSON `out/preview-abc-assert2.json`):
- Per case: trail = 0 mọi khung; edgeL/R median ≤ 3px; ring = 2;
  skippedDuplicate > 0.
- Per (case, mốc): đủ mẫu cx (n=7–20) + gStd (n=3–12); lệch tâm từng
  khung median 0.001 (max 0.0009) ≤ 0.005; B/C gStd median ≤ 0.85×
  baseline; A |gStd − baseline| ≤ 10%.
- Ngưỡng 0.85× baseline cho gStd là ngưỡng "blur có thật" (median), KHÔNG
  khóa giá trị tuyệt đối theo pha — vì gStd phụ thuộc pha sọc + khoảng
  cách tick (xem §5.1). Một khung lẻ có thể về baseline khi khoảng cách
  frame trong ring trúng đúng chu kỳ sọc (vd B t=1: 1/4 khung gStd 112.3);
  median vẫn vững.

### 4.2 Unit test + probe Node (chạy lại trên cây cuối)

- `previewEngine.test.ts`: **17/17** (14 cũ + 3 mới `videoFrameIndex`).
- `ghostBlend.probe.test.ts`: **15/15** (10 cũ + 5 mới §4.3).
- `maskTrack.test.ts`: **22/22**; `maskKeyframes.test.ts`: **14/14**;
  O4 `maskTrackPreview87O4`: **37/37**.
- `npx tsc --noEmit` (apps/web): **0 lỗi**. `npx vite build`: **PASS**
  (12.91s).
- Click-test O8 mask/track: **Chromium 21/21**, **WebKit 21/21** (xem §4.4).

### 4.3 Probe Node khóa ngữ nghĩa mask-sau-blend (mới trong ghostBlend)

Mô hình 1D (1 hàng pixel, sọc chu kỳ 8px cuộn 3px/frame, mask bước nhảy
dời 10→12→14px): mới == tmix-rồi-mask theo từng pixel; mới không pixel
sáng nào trái mép hiện tại; cũ có vệt 2px; mới tương phản lõi 42.5 vs
127.0 của frame hiện tại (blur thật); tâm vùng sáng cũ lệch về sau
(25.50 vs 26.50 — cùng chiều với P3 đo −0.0092).

### 4.4 Click-test mask/track O8/Q5 sau sửa

- Chromium (`clicktest-87o8-mask-track-headed.mjs`, scratch riêng
  `~/workspace/round90-r1/clicktest-o8/`): **21/21 PASS**, exit 0
  (S4 mask tĩnh, S5 mask bám track 2 mốc + lúc đang phát, S6 gợi ý O5,
  S7 bóng nằm giữa mask, E0 không lỗi JS).
- WebKit (`clicktest-87o8-mask-track-webkit.mjs`, scratch
  `~/workspace/round90-r1/clicktest-o8-webkit/`): **21/21 PASS**, exit 0
  (S5(a) blob x=0.4031/0.5973 khớp kỳ vọng 0.403/0.597; S7 Δx mask 0.194,
  bóng 0.197).
- Lưu ý: một luồng khác chạy click-test Chromium lúc 15:26 cũng 21/21
  (report ở `hidden_files/round87-o8/headed/`) — đó KHÔNG phải lần chạy
  của R1 (chạy trên cây chưa chắc có đủ sửa R1); lần chạy của R1 là
  15:37 (Chromium) + 15:38 (WebKit) trên cây cuối.

## 5. Giới hạn đã biết / chưa đo (không giấu)

### 5.1 gStd phụ thuộc khoảng cách tick (độ lớn blur biến thiên, không phải bug blend)

Ring giữ 2 snapshot PHÂN BIỆT gần nhất, không đảm bảo LIÊN TIẾP: khi tick
chậm hơn video frame (harness đo làm rAF chỉ còn ~10–12fps vì mỗi khung
đo full-canvas; tick thật không harness thường ~30–60fps), 2 snapshot
cách nhau ~3 frame video → cửa sổ blend rộng hơn tmix-3 của render →
blur mạnh hơn ở vài pha (gStd 37 thay vì ~84), và khi khoảng cách trúng
đúng chu kỳ sọc (4 frame = 48px) thì 3 frame cùng pha → gStd về baseline
(112) ở khung lẻ đó. Đây là hệ quả của thiết kế Q2 §7.1 (gate theo frame
index, không ép liên tiếp) — KHÔNG thể lấy lại frame đã trôi qua từ video
element. Hướng triệt để (chưa làm): `requestVideoFrameCallback` để snapshot
đúng mỗi frame video dù rAF chậm — cần kiến trúc riêng, để vòng sau.
Số đo R1 vẫn thỏa mục tiêu task (trail=0, mép sắc, blur có thật theo
median); không khóa gStd tuyệt đối theo pha vì lý do này.

### 5.2 Mép phải max 3.6px ở khung lẻ (A/C)

Median edgeR 2.1px (= pause) nhưng max 3.6px ở vài khung của case A/C
(mask track). Nghi là khung ngay sau refill ring / sub-pixel pha của mask
track (w50 play A/C 508 vs pause 505.5 — cùng họ lượng tử hoá, xem §2.1).
Không phải vệt (trail vẫn = 0 ở chính các khung đó). Mức này nhỏ (mép
~2px, lệch tối đa +1.5px) và không tái hiện ổn định — ghi lại, không sửa
thêm trong lượt này.

### 5.3 Combo chưa đo bằng pixel: mask+SR+blur, mask+feather>0+blur

Sửa SR đã làm đúng theo Q2 §7.2 (transform dời ra khỏi painter, mask trong
không gian chưa transform) nhưng A/B/C không có keyframes scale/rotation
nên **chưa có bằng chứng pixel cho nhánh mask+SR+blur** (chỉ có tsc +
click-test O8 không-blur cho SR). Tương tự feather>0 + blur chưa đo
(feather=0 trong A/B/C; applyMask là cùng hàm nên ngữ nghĩa không đổi,
nhưng chưa có số). Để vòng sau: thêm spec D (mask+scale/rotation
keyframes+blur) và E (feather 0.2 + blur) vào harness R1.

### 5.4 Stall/restart decoder trong lúc phát (quan sát, không do R1)

Case C pass 1: playhead đứng yên ở 0.667 trong 4 khung rAF, videoTime
nhảy 0.6667 → 0 (element restart), rồi tự hồi phục (ph=0.9, vt=0.7672,
cx đúng track). RingClears của case C lên 8–10 (so với A/B: 0–2) — mỗi
lần restart/seek lùi đều reset ring đúng thiết kế. Cơ chế (syncMedia
re-seek + MediaPool drop/recreate element) nằm ngoài file R1 sửa
(preview.tsx chỉ thêm gate/reset ở tầng snapshot, không đụng lifecycle
element) nên kết luận là hành vi sẵn có dưới tải, không phải hồi quy
của sửa này. Ảnh hưởng tới đo: vài khung đầu lượt phát / khung stall bị
loại khỏi mẫu (frozen) hoặc làm median gStd biến thiên — không ảnh hưởng
kết luận (trail/edge/cx vẫn xanh trên mọi khung còn lại).

### 5.5 Môi trường

- Runtime restart giữa lượt (~15:29Z) giết vite dev 5173 + lượt assert
  đang chạy — đã khởi động lại vite và chạy lại assert từ đầu (kết quả
  §4 là của lần chạy lại, không dùng số của lần bị giết).
- tsc từng báo 1 lỗi ở file của luồng song song (R3
  `media.blobPrefetch90R3.test.ts`, rồi R2 `playheadHold90R2.test.ts` —
  import `.ts` lúc file đang sửa dở); cả 2 đều không phải file R1 và đã
  hết ở lần tsc cuối (0 lỗi). Không sửa file của luồng khác.
- RAM khả dụng lúc đo ~1.0–3.6 GB (dao động theo các luồng song song);
  không chạy render nặng song song (render không đụng tới trong lượt này).
- Test render Q2 (51/51) KHÔNG chạy lại — render không sửa, số canonical
  dùng lại từ Q2.

## 6. File đổi (stage, KHÔNG push)

- `apps/web/src/preview.tsx` — sửa chính: `rawUnitSource`,
  `compositeMotionBlurLayer`, gate snapshot theo frame
  (`motionBlurResetOnSeek`, `frameIdx`), nhánh mask blend thô + mask sau.
- `apps/web/src/lib/previewEngine.ts` — mới `videoFrameIndex`.
- `apps/web/src/lib/previewEngine.test.ts` — +3 test `videoFrameIndex`.
- `apps/web/src/lib/ghostBlend.probe.test.ts` — +5 kiểm chứng mask-sau-blend.
- `apps/web/scripts/probe90r1-motionblur-preview.cdp.mjs` — mới, harness
  A/B/C play + `--assert` khóa preview.
- `docs/PHASE9_ROUND90_R1_MOTIONBLUR_PREVIEW_FIX_LIMITS.md` — file này.
- Log luồng: `workspace/goals/capcut-clone-video-editor/hidden_files/round90-r1.md`.
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round90-r1-motionblur-preview.txt`.
- KHÔNG stage: media sọc `stripes-*.mp4` (binary — đã xoá khỏi
  `apps/web/public/` sau khi đo; script gen nằm trong test render Q2),
  JSON/log đo ở `~/workspace/round90-r1/` (ngoài repo, để parent tra),
  png click-test ở `~/workspace/round90-r1/clicktest-o8*/` (ngoài repo).

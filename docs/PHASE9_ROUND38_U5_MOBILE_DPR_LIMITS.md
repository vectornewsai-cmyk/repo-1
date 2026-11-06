# Phase 9 đợt 38, luồng U5 — Chẩn đoán mobile touch FAIL đợt 37 + smoke dpr > 1 + tái kiểm click-test fallback — LIMITS

Ngày: 02/11/2026 (giờ +07; log probe ghi UTC 13:0x–13:19).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa file của luồng khác, KHÔNG ghi paths-loop hay build-loop-log
(parent gộp). Luồng này CHẨN ĐOÁN là chính; chỉ một sửa nhỏ ở harness
đo (§2) — KHÔNG sửa preview pipeline, KHÔNG sửa code sản phẩm.

## 0. Kết luận ngắn (không vượt số đo)

1. **Mobile touch FAIL đợt 37 đã có nguyên nhân xác định, KHÔNG phải
   lỗi handler touch / CDP / viewport / timing:** trên profile Chrome
   mới, `WelcomeModal` (màn chào lần đầu) mở sẵn và che toàn bộ điểm
   chạm mà `mobile-touch-check.mjs` chọn trên ruler. Bằng chứng đếm
   sự kiện (§1): pointerdown của CDP tới được window (pd=1) nhưng
   KHÔNG tới ruler (rulerPd=0), `elementFromPoint` tại điểm scrub
   trả về `DIV.btn-row` của modal; trong khi handler ruler thì lành
   (PointerEvent JS trực tiếp trên ruler vẫn scrub được, playhead
   00:00:00:00 → 00:00:03:10). Phân loại: điều kiện tiên quyết của
   harness (chưa đóng modal), không phải lỗi sản phẩm.
2. **Đã sửa sạch bằng một sửa nhỏ ở harness (§2):** `mobile-touch-check.mjs`
   nay đóng `WelcomeModal` (click backdrop bằng JS, chỉ là bước chuẩn
   bị) trước khi đo. Chạy lại 2 lần trên dist hiện tại: **TRUSTED SCRUB
   PASS + TRUSTED PINCH PASS, exit 0, frozenDist VALID** cả 2 lần
   (scrub 00:00:00:00 → 00:00:03:10; pinch 60 → 150, đúng dự đoán
   `pinchZoom` 60×200/80=150). Không đụng code sản phẩm.
3. **dpr > 1 đã đo bằng trình duyệt thật (§3):** fixture B-frame reorder
   thật (ctts nonzero 770, decreases 265 — xác minh lại bằng test Node
   6/6 của T6). Ở DSF=2 và DSF=3, cả đường element lẫn đường WebCodecs
   đều: backing canvas đúng trần `min(dpr,2)` (CSS 427×240 → 854×480 ở
   cả DSF 2 lẫn DSF 3, không phải 1281×720 ở DSF 3); frame đúng nội
   dung (element Δ0,60, WebCodecs Δ0,24 so với ground truth ffmpeg);
   WebCodecs vẽ đủ 62/62 frame, timestamp giảm đơn điệu chặt, khớp
   pts 62/62, khác thứ tự index giảm dần mù (đúng thứ tự B-frame).
4. **Click-test fallback PARTIAL vẫn tái hiện trên dist mới nhất (§4):**
   verdict PARTIAL, frame thật đầu tiên ở mẫu 26/28 (~13 s; đợt 37:
   18/28 ~9 s, lần đầu 24/28 ~12 s — cùng hiện tượng, thời gian dao
   động theo tải/seek). Thuộc **đường element cũ, không lan sang
   đường WebCodecs mới**: `wcHits=0`, `wcMisses=144` (mọi lần hỏi
   WebCodecs đều miss — controller khóa fallback file lớn theo thiết
   kế), skip leo tới 137, chỉ 1 draw + 7 hold, playhead lùi
   29,7 → 17,6. Luồng này KHÔNG sửa preview pipeline (đúng phạm vi).

## 1. Chẩn đoán mobile touch FAIL — bằng chứng, không đoán

### 1.1 Dist nào đã đo (ghi rõ vì dist trôi giữa đợt)

- Dist đợt 37 (`index-DAS3nyo_.js`, sha256[:16] `e02b786973edd1c3`
  theo LIMITS T4) **không còn trên đĩa** lúc U5 chạy: một luồng đợt 38
  khác đã build lại dist trước đó. Vì vậy **không thể chạy lại đúng
  bundle đợt 37** — đây là giới hạn ghi rõ, không lấp bằng cách claim
  "đã chạy lại dist đợt 37".
- Lượt mobile chẩn đoán + sửa chạy trên dist lúc đó:
  `index-BNjMwXhb.js`, sha256[:16] `0169bac961fdef10`, manifest
  `7b800a66b068e1…`, 254 file, frozenDist VALID (vite preview cổng
  4187 serve đúng dist này). Lượt fallback (§4) chạy muộn hơn trên
  dist còn mới hơn (`index-BgjA4izV.js`, sha256[:16]
  `489018363330f99`, 254 file) vì dist lại bị build đè giữa đợt.
  Nguyên nhân modal (§1.2) không phụ thuộc bundle: logic
  `WelcomeModal` (hiện khi localStorage chưa có `vcut-welcomed`)
  có từ trước đợt 37, và triệu chứng đợt 37 (ph0=ph1=00:00:00:00,
  zoom 60→60) khớp đúng triệu chứng tái hiện ở đây trước khi sửa.

### 1.2 Probe đếm sự kiện (scratch, không vào repo)

Probe chẩn đoán = bản sao `mobile-touch-check.mjs` đặt ở
`~/workspace/tmp-round38-u5/mobile-diag.mjs` (chỉ thêm đếm sự kiện,
không sửa logic đo gốc), chạy trên vite preview 4187, viewport CDP
390×844, DSF=2, `Emulation.setTouchEmulationEnabled=true`.
Ruler lúc đo: rect left=92, top=757, w=840, h=27; điểm scrub
(192, 770.5); 3 clip trong timeline (`.tl-clip` = 3).

| Arm | Cách chạm | Kết quả | Đếm sự kiện window / ruler |
|---|---|---|---|
| DIAG0 | `elementFromPoint` tại điểm scrub | Điểm bị che | hit = `DIV.btn-row`, `hitIsRuler=false`, `touchAction=none` |
| DIAG1 | Quét 7 điểm dọc ruler | Bị che toàn dải trong viewport | dx=5 → BUTTON "Để sau"; dx=30/60/100/150/200 → `DIV.btn-row`; dx=300 → null (ngoài viewport 390) |
| A | CDP touch scrub (như script gốc) | ph không đổi | pd=1, pm=1, pu=0, **pc=1**, rulerPd=**0** |
| B | CDP mouse drag cùng tọa độ | ph không đổi | pd=1, pm=1, pu=1, rulerPd=**0** |
| C | JS `PointerEvent` trực tiếp trên ruler | **ph 00:00:00:00 → 00:00:03:10** | pd=1, pm=1, pu=1, rulerPd=**1** |
| E | CDP touch scrub tại tọa độ ×2 (kiểm tra giả thuyết CDP hiểu device-px) | ph không đổi | pd=1, pm=1, pu=0, pc=1, rulerPd=**0** |
| F | CDP mouse click cùng tọa độ | ph không đổi | pd=1, pm=0, pu=1, rulerPd=**0** |
| D | CDP touch pinch (như script gốc) | zoom 60→60 | pd=2, pm=4, pu=0, pc=2, rulerPd=**0** |

Đọc đúng từng giả thuyết:

- **Handler touch lành (loại):** arm C chứng minh handler ruler
  (`onPointerDown` + window `pointermove` trong `Timeline.tsx`)
  chạy đúng: pointerdown tại x=192 (left+100) rồi move tới x=292
  (left+200) cho playhead (292−92)/60 = 3,33 s → timecode
  00:00:03:10. (Lưu ý bẫy đo: lần đầu arm C đọc timecode ngay
  trong cùng lượt evaluate nên chưa thấy đổi vì React render bất
  đồng bộ — đã sửa bằng sleep 500 ms rồi mới đọc; số 00:00:03:10
  là số sau khi sửa bẫy này.)
- **CDP / touch delivery lành (loại):** arm A/D có touchstart/
  touchmove/touchend đầy đủ (ts=1/2, tm=1/5, te=1/2) và pointerdown/
  pointermove tới window; arm B/F (mouse, không phải touch) cũng
  trượt ruler y hệt — nên lỗi không đặc thù touch.
- **Tọa độ CDP sai tỉ lệ DSF (loại):** arm E (tọa độ ×2) vẫn
  rulerPd=0; và arm B/F dùng đúng tọa độ CSS cũng trượt.
- **Timing (loại):** mọi arm đều có sleep 500 ms sau gesture trước
  khi đọc; arm C đổi ngay trong cùng điều kiện chờ.
- **Nguyên nhân còn lại, có bằng chứng trực tiếp:** DIAG1 xác định
  vật che là modal chào lần đầu — chuỗi tổ tiên:
  `DIV.btn-row > DIV.modal-body > DIV.modal > DIV.modal-backdrop >
  DIV.app > DIV#root`, rect che phủ left=31, top=584, w=328, h=216
  (bao trọn điểm scrub/pinch), nội dung nút "▶ Xem project mẫu
  ⚡ Tạo video 1 chạm 🧭 …" + nút "Để sau" ở mép trái. Script gốc
  chỉ chờ `!splash && .tl-clip` — modal không chặn timeline render
  nên điều kiện ready vẫn qua, nhưng mọi input đều rơi vào modal.
  Script chạy trên profile Chrome mới mỗi lần (không
  `user-data-dir` cố định) nên modal luôn hiện — đó là vì sao
  FAIL tái hiện ổn định, không phải flaky.

## 2. ĐÃ SỬA (sửa nhỏ ở harness, không đụng sản phẩm)

File sửa duy nhất: `apps/web/scripts/mobile-touch-check.mjs` — chèn
bước đóng modal giữa vòng chờ ready và bước tính `geom`:

- Nếu có `.modal-backdrop` thì click nó bằng JS (backdrop có
  `onClick={close}` → `markWelcomed()` + đóng modal), rồi chờ tối
  đa 30 s cho modal biến mất, in log "đã đóng WelcomeModal trước
  khi đo touch". Không có modal thì bỏ qua, hành vi cũ không đổi.
- Click backdrop là bước **chuẩn bị**, không phải gesture đang đo:
  scrub/pinch bên dưới vẫn dùng `Input.dispatchTouchEvent`
  trusted như cũ, nên kết quả PASS vẫn là bằng chứng touch thật.
- Không sửa `Timeline.tsx`, `WelcomeModal.tsx`, store, hay bất kỳ
  code sản phẩm nào. Không sửa script của luồng khác.

Kiểm chứng sau sửa (script gốc, vite preview 4187 serve dist BNj):

| Lần chạy | Kết quả | frozenDist |
|---|---|---|
| 1 (sau sửa) | SCRUB PASS (00:00:00:00 → 00:00:03:10), PINCH PASS (60 → 150) | VALID (trước = sau = `7b800a66…`, 254 file) |
| 2 (lặp lại, lấy exit code sạch) | SCRUB PASS, PINCH PASS, **exit 0** | VALID như trên |

Trước khi sửa, cùng script trên cùng dist: SCRUB FAIL + PINCH FAIL
(ph0=ph1=00:00:00:00, zoom 60→60) — đúng triệu chứng T4 đợt 37.
Pinch 60→150 khớp công thức `pinchZoom` (startDist 80 → endDist
200, 60×200/80=150, trong biên 8..240), không phải số ngẫu nhiên.

## 3. dpr > 1 — đo được gì, chưa đo gì

### 3.1 Thiết lập

- Fixture: proxy reorder 480p của T6 đợt 37
  (`~/workspace/tmp-round37-t6/noise-30s__proxy_480p.mp4`, 37.122.084
  byte, 854×480, 30 fps, 30 s). Xác minh lại trước khi đo bằng test
  Node của T6: **6/6** — ctts nonzero 770 sample, present giảm
  trong thứ tự decode 265 lần (bằng chứng B-frame reorder thật,
  không dùng `has_b_frames`).
- Probe mới (file §5): trang probe bundle `mp4Demux.ts` +
  `reverseWebcodecs.ts` từ nguồn repo bằng esbuild (có check import
  trần như T6), pipe CDP headless, `setDeviceMetricsOverride`
  DSF=2 rồi DSF=3, mỗi DSF một Chrome profile riêng trong workspace
  (không dùng /tmp, theo bài học T5). Canvas đo: CSS cố định
  427×240, backing = floor(CSS × min(2, devicePixelRatio)) — y hệt
  công thức `preview.tsx` (dòng dpr).
- Ground truth: ffmpeg trích frame PNG + PIL center 100×100.

### 3.2 Kết quả (JSON `benchmarks/results/v38-u5-dpr.json`)

GOP đo: decode index [45, 106] (62 frame), frame mục tiêu
presentation 2,0000 s (decode index 60). Cả 2 DSF cho cùng kết quả
về nội dung (chỉ khác `devicePixelRatio` báo cáo).

| Chỉ số | DSF=2 | DSF=3 | Đọc |
|---|---|---|---|
| `devicePixelRatio` báo cáo | 2 | 3 | đúng DSF đã đặt |
| Element: backing canvas | 854×480 | 854×480 | đúng trần min(dpr,2): DSF 3 không phình thành 1281×720 |
| Element: frame tại 2,0 s, centerMean | 127,58 | 127,58 | ground truth ffmpeg tại 2,0 s = 126,98 → **Δ0,60** |
| WebCodecs: backing canvas | 854×480 | 854×480 | đúng trần min(dpr,2) như nhánh element |
| WebCodecs: decode / draw / missing | 62 / 62 / 0 | 62 / 62 / 0 | đủ frame GOP |
| WebCodecs: timestamp draw giảm đơn điệu chặt | true | true | đúng chiều ngược |
| WebCodecs: khớp pts sample | 62/62, mismatch 0 | 62/62, mismatch 0 | đúng timestamp tuyệt đối |
| WebCodecs: khác thứ tự index giảm dần mù | true | true | sắp theo pts thật, không fallback index |
| WebCodecs: frame vẽ cuối (pts 1,5667 s), centerMean | 127,18 | 127,18 | ground truth ffmpeg tại 1,5667 s = 126,94 → **Δ0,24** |

Một sự cố nhỏ trong lúc đo (đã sửa, không giấu): lần chạy pipe đầu
chết vì trang truyền `Uint8Array` vào `parseMp4VideoTrack` trong khi
hàm này cần `ArrayBuffer` (lỗi `DataView constructor must be an
ArrayBuffer`) — đã sửa trang probe truyền `buf.buffer`, chạy lại
xanh như bảng trên.

### 3.3 Chưa đo (ghi rõ, không claim hộ)

- **Chưa đo qua vòng lặp preview thật của App** (`preview.tsx`):
  probe này đo demux/decode/draw + công thức trần dpr trên canvas
  riêng, không đi qua `Preview` component, store, hay vòng rAF của
  app. Nó chứng minh đường WebCodecs + element vẽ đúng ở dpr>1,
  nhưng không chứng minh App wiring ở dpr>1 (đó là bước click-test
  App ở dpr>1, vẫn mở).
- Chưa đo: đường `asset:` ở dpr>1 (chỉ footage file thường qua
  blob: fetch trong trang probe); footage 4K ở dpr>1; Safari / máy
  thật / màn hình thật (toàn bộ trên Chromium Linux headed); dpr
  phân số (ví dụ 1,5, 1,25 — chỉ đo DSF nguyên 2 và 3).

## 4. Click-test fallback — vẫn PARTIAL trên dist mới nhất, thuộc đường element cũ

### 4.1 Cách đo (không sửa script gốc của T5)

Dùng bản sao scratch của script T5
(`~/workspace/tmp-round38-u5/fallback-dist-copy.mjs`, chỉ đổi 2
điểm: `vite` → `vite preview` để đo đúng dist, và OUT sang JSON
mới) — script gốc `clicktest-round37-t5-fallback-pipe.mjs` không
đụng. Dist đo: `index-BgjA4izV.js` (sha256[:16] `489018363330f99`,
254 file — dist mới nhất lúc chạy, đã bị build đè sau lượt mobile
§2). File: `sparse-gop-noise.mp4` 419.967.521 byte (420 MB, GOP
30 [đính chính 46-B5: trước đây ghi 'GOP thưa'], như T5). Điều kiện như T5: tắt toggle "Tự tạo proxy" (clip
phát bản gốc), bật cờ `window.__vcutReverseWebcodecs`, Thêm →
End (playhead 30,0) → Phát ngược, 28 mẫu / 14 s, Xvfb :97 riêng,
profile Chrome trong workspace, dọn sau chạy. Script thoát 1 theo
đúng quy ước PARTIAL của nó (không phải crash).

### 4.2 Kết quả (JSON `benchmarks/results/v38-u5-fallback-clicktest.json`)

- **Verdict: PARTIAL** (giống T5). `firstContentIndex = 26/28`
  (chỉ 2 mẫu cuối có nội dung), tức frame thật đầu tiên tới sau
  ~13 s (mẫu cách nhau 0,5 s). T5 đo 18/28 (~9 s), lần đầu của T5
  24/28 (~12 s) — cùng hiện tượng, thời gian dao động theo
  seek-chase/tải; không claim "tệ hơn" hay "cải thiện" từ một
  lần chạy (số này nhạy tải, và lượt này chạy giữa các luồng
  đợt 38 khác).
- Routing fallback đúng: badge ngược hiện suốt, playhead lùi đơn
  điệu 29,7 → 17,6, app vẫn đáp evaluate sau khi dừng.
- **Thuộc đường element cũ, không lan sang đường mới:**
  `wcHits = 0`, `wcMisses = 144` — mọi lần hỏi WebCodecs đều miss
  vì controller khóa fallback file lớn (>128 MiB) theo thiết kế;
  đường WebCodecs không hề phục vụ frame nào ở đây nên không có
  gì để "lan sang". Thống kê từ `window.__vcutHoldStats` của
  đường element: skip leo tới **137**, chỉ **1 draw + 7 hold**,
  canvas 26 mẫu đầu chỉ vẽ nền `#0a0c10` (mean 12,67), mẫu cuối
  mean 162,09 là frame thật (hold giữ, maxHoldAge 0,53 s).
- **Không sửa preview pipeline trong luồng này** (đúng phạm vi
  nhiệm vụ): muốn frame sớm hơn trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] này vẫn cần
  cải tiến đường element (prefetch/seek) như nợ T5 §5.5 đã ghi —
  thuộc luồng sở hữu preview, không làm lén ở đây.

## 5. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (1 file):

- `apps/web/scripts/mobile-touch-check.mjs` — chỉ thêm bước đóng
  `WelcomeModal` trước khi đo touch (§2) + chú thích; logic touch,
  đóng băng dist, timeout CDP không đổi. `node --check` pass.

MỚI (2 script probe + 2 JSON + LIMITS này):

- `apps/web/scripts/probe-round38-u5-dpr-page.js` — trang probe
  dpr (element + WebCodecs trên fixture B-frame, canvas trần dpr).
- `apps/web/scripts/probe-round38-u5-dpr-pipe.mjs` — pipe CDP chạy
  DSF=2 và DSF=3, ghi JSON. `node --check` pass cả 2 script.
- `benchmarks/results/v38-u5-dpr.json` — kết quả dpr §3.
- `benchmarks/results/v38-u5-fallback-clicktest.json` — kết quả
  click-test fallback §4 (verdict PARTIAL).
- `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` — file này.

KHÔNG ĐỔI: mọi code sản phẩm (`Timeline.tsx`, `preview.tsx`,
`reverseWebcodecs.ts`, `WelcomeModal.tsx`, store), script của luồng
khác (bản sao fallback chỉ nằm ở scratch), paths-loop,
build-loop-log. Scratch chẩn đoán ở `~/workspace/tmp-round38-u5/`
(diag, log, ground truth PNG, bản sao fallback) — không vào batch.
Không chạy lại `tsc`/`vite build` ở luồng này: không có file nguồn
app nào bị đụng (chỉ script `.mjs` ngoài phạm vi build của app, đã
qua `node --check` + chạy live); parent kiểm chứng gộp vẫn chạy
tsc/build như thường lệ. Không build lại dist (dist đang bị các
luồng đợt 38 khác build đè — build thêm sẽ đua).

Dọn dẹp sau chạy: vite preview 4187/5199 đã tắt (cổng trống),
profile Chrome DPR đã xóa, socket Xvfb :97 thừa đã gỡ; không còn
tiến trình probe nào của luồng này.

## 6. Nợ còn lại

1. Mobile touch trên **dist đợt 37 gốc không còn tái kiểm được**
   (bundle DAS3nyo_ đã mất) — nhưng nguyên nhân modal giải thích
   đúng triệu chứng đợt 37 và sửa đã PASS 2/2 trên dist hiện tại;
   nếu cần bằng chứng trên đúng bundle cũ thì phải build lại đúng
   cây đợt 37 (ngoài phạm vi).
2. Mobile touch trên máy thật / Safari / viewport khác vẫn chưa đo
   (chỉ Chromium Linux, viewport 390×844 mô phỏng).
3. Click-test App ở dpr>1 (qua `preview.tsx` thật) và đường `asset:`
   ở dpr>1 vẫn mở (xem §3.3).
4. Fallback frame đầu muộn ~9–13 s trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB vẫn
   mở — cần cải tiến đường element (prefetch/seek), thuộc luồng
   sở hữu preview.
5. Mọi số timing fallback/dpr ở đây đều đo giữa các luồng đợt 38
   chạy song song (under-load) — dùng làm bằng chứng đúng/sai và
   hình học, cấm dùng làm baseline quiet hay claim fps.

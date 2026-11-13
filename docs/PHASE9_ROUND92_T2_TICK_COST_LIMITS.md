# Đợt 92 T2 — Chi phí tick main-thread của motion blur preview / rVFC: số đo, sửa chữa, giới hạn

> Nợ: LIMITS gộp đợt 91 §4 mục 2 — "rVFC chỉ capture ~1/3 frame trình chiếu vì main thread bận xử lý mask CPU".
> Luồng T2, lượt cron 03:35 12/11/2026. Repo: `~/workspace/repo-1`. KHÔNG PUSH (chỉ stage).
> Máy đo: VM này (1.5 CPU chia sẻ, 4 vCPU EPYC 9D25 từ đợt 87; RAM khả dụng ~0,5–1,6 GB lúc đo;
> loadavg biến động 0,4–15) — số tuyệt đối nhiễu theo tải; so sánh theo cụm fast/slow + median, 3 pass/spec.

## 0. Kết luận ngắn

- **Blocker đã gỡ:** tick preview mask+blur giảm từ **73–85ms → 4,5–4,8ms** (spec B, mask tĩnh)
  và **33–39ms → 8,2–9,2ms** (spec C, mask động theo track). Tỉ lệ frame rVFC capture được
  tăng từ **~1/3 (S1) / 0,09–0,25 (baseline T2 dưới tải nặng) → 0,56–0,66** trên cả 3 spec
  B/C/D (3 pass mỗi spec, headless Chromium).
- **Nguyên nhân gốc:** `applyMask` — vòng lặp JS 230k pixel (`getImageData` + `applyMask` +
  `putImageData`) mỗi tick — chiếm ~90% tick. Sửa: cache canvas alpha mask theo hình học +
  composite `destination-in` (native).
- **Hồi quy đã bắt + sửa thật:** bản đầu của đường canvas LÀM CHẬM mask động (spec C:
  95–197ms/tick, ratio 0,10–0,17 — tệ hơn cả đường cũ) vì mỗi lần miss cấp phát canvas +
  ImageData mới (~2MB/tick → GC stall). Sửa lần 2: `maskAlphaArray` hoist hình học
  (8,6ms → ~4ms Node) + tái dùng canvas/ImageData của entry bị đuổi (0 cấp phát sau warmup).
  Sau sửa lần 2, C nhanh hơn cả đường cũ (~4×) và ratio vượt đường cũ (0,59–0,63 vs 0,42–0,54).
- **Không phá motion blur:** assert A–E của S1 chạy lại **100/100 (5 pass/case, exit 0)**,
  trail = 0 mọi case; parity pixel đường mới vs cũ **MAD = 0, maxAbs = 0** (240.672 pixel,
  cả feather = 0 và 0,2).
- **Hồi quy phụ đã sửa:** tick nhanh hơn làm watchdog rVFC giết oan pump (đếm miss mỗi tick);
  sửa sang đếm theo thời gian (≥1,5s không capture mới giết). Case D/E không còn rơi về
  `no-callback` nữa (captures tích lũy tới 1105 qua 5 case).
- **Giới hạn còn lại:** tỉ lệ capture nay bị giới hạn bởi scheduling headless/VM (capture
  ~8–32ms, gap tới ~300ms), không còn bởi chi phí tick. Mask động vẫn tốn ~4,6ms/miss
  (tính lại alpha mỗi frame mới). Xem §6.

## 1. Phương pháp đo

- **Instrumentation trong app** (`apps/web/src/preview.tsx`): `window.__vcutTickCost`
  (cap 1500) ghi mỗi tick `drawVideoClip` của clip mask+blur: `total/raw/blend/mask/
  maskGet/maskApply/maskPut/draw/frameIdx/viaRvfc/maskCanvas`; 3 path `mask-blend` /
  `mask-direct` / `plain-blend`. `__vcutRvfcCost` (cap 600): ms mỗi lần capture rVFC.
  `__vcutRenderFrameMs` (cap 1500): tổng `renderFrame` mỗi tick. `__vcutLoopMs`: tổng
  `tickInner` (syncMedia + renderFrame + store). `MaskTimings` tách 3 bước CPU trong
  `maskedUnitSource` (get/apply/put/total/viaCanvas).
- **Harness** `apps/web/scripts/probe92t2-tickcost.cdp.mjs` (mới): seed spec, phát, chờ
  playhead > 2,2, đọc 1 lần cuối pass (không đo CDP mỗi khung — tự phép đo làm chậm tick).
  `presented` = delta `totalVideoFrames` lớn nhất theo từng element (đã sửa 2 lần trong
  quá trình đo); `captureRatio` = captures / presented; cụm fast (total < 40ms) / slow;
  longtask trong pass. Cờ `--no-mask-canvas` ép về đường CPU cũ để đo đối chứng A/B,
  `--disable-rvfc` tắt rVFC. Vite dev cổng 5173, headless Chromium, CDP 9231.
- **Harness phụ:** `probe92t2-raf-rate.cdp.mjs` (rAF trang trắng), `probe92t2-mask-parity.cdp.mjs`
  (so pixel A/B đường mới vs cũ trên cùng frame pause).
- **Spec:** B = sọc cuộn + mask tĩnh (feather 0); C = sọc cuộn + mask bám track (x 0,3→0,7,
  t=0→2s); D = sọc cuộn + mask tĩnh + keyframes rotation/scale (đường SR); E = như B nhưng
  feather 0,2. Media `stripes-scroll.mp4` 1280×720 30fps h264 (test-only, đã xoá khỏi
  `apps/web/public/` sau khi đo).
- **Môi trường không kẹp rAF:** rAF trang trắng 59,7fps (1440×900) / 60,7fps (800×500) —
  app ~12fps lúc baseline là do tick nặng, không phải môi trường.

## 2. Baseline (trước sửa) — spec B, 3 pass, 12/11 ~20:52, loadavg 14,76

| pass | ratio | ticks/pass | renderFrame med | mask med | maskApply nhanh/chậm |
|---|---|---|---|---|---|
| 1 | 0,25 | 20 | 84,9ms | 78,2ms | ~13ms / 65–90ms |
| 2 | 0,12 | 23 | 75,1ms | 69,3ms | ~13ms / 65–90ms |
| 3 | 0,09 | 23 | 72,8ms | 26,8ms | ~13ms / 65–90ms |

Tách thành phần (mask-blend): `mask` chiếm ~90% tick (`maskGet` ~1ms, `maskApply` nhanh
~13ms / chậm 65–90ms — bimodal do đói CPU, `maskPut` ~0,1ms), `blend` 1,4ms, `raw`
~0–0,9ms, `draw` 0,1ms. rVFC capture ~8ms (nhanh) / 60–90ms (đói CPU). Tỉ lệ tick trùng
frameIdx chỉ ~5% → cache theo frameIdx lúc đó KHÔNG đáng làm (ghi nhận, chưa implement).

Đối chiếu S1: rVFC capture 23/70 (~1/3), tick ~12fps, spread cặp 0–1,3 (5 pass).

## 3. Biện pháp hiệu quả — cache canvas alpha mask + destination-in

`apps/web/src/lib/previewEngine.ts` + `apps/web/src/preview.tsx`:

- `maskAlphaArray(mask, w, h)` → mảng alpha Uint8ClampedArray (Math.round(alpha*255),
  khớp `maskAlphaAt` từng pixel — unit test so trực tiếp).
- `maskAlphaCacheKey(mask, w, h)` — khoá theo shape/x/y/w/h/feather/invert + kích thước
  unit, 6 chữ số thập phân; keyframes/track KHÔNG nằm trong khoá (caller đã resolve).
- `maskAlphaCanvasFor(effMask, w, h)` — build canvas alpha 1 lần mỗi hình học (RGB trắng,
  alpha = mask), cache tối đa 8 hình học FIFO (~7MB trần), rồi `destination-in`
  drawImage (native). Miss thì build rồi dùng ngay trong tick đó. Build thất bại hoặc
  hook test `window.__vcutMaskCanvasPath = false` → rơi về đường CPU cũ (giữ nguyên).
  Áp dụng cho cả mask-blend, mask-direct và `drawImageClip`.
- Unit test mới trong `previewEngine.test.ts` (4 test): maskAlphaArray khớp maskAlphaAt
  từng pixel (ellipse/rect, feather, invert); khớp alpha applyMask ghi (alpha nguồn 255,
  RGB không đổi); ellipse viền cứng trong 255/ngoài 0; cache key cùng/khác hình học +
  keyframes không ảnh hưởng. **24/24 PASS** (20 cũ + 4 mới).

### Kết quả sau sửa lần 1 — spec B (mask tĩnh)

| pass | ratio | ticks | renderFrame med | mask med |
|---|---|---|---|---|
| 1 | 0,433 | 63 | 6,1ms | 0,7ms |
| 2 | 0,370 | 72 | 6,6ms | 0,6ms |
| 3 | 0,284 | 24 | 14,2ms | 0,7ms |

Mask 0,6–0,8ms (từ ~13ms nhanh / ~70ms chậm); tick fast-cluster 3,5–9ms. `longtask = 0`
mọi pass; `loopMed ≈ rfMed + ~1ms` → tickInner không còn là bottleneck. Tỉ lệ capture
giờ bị giới hạn bởi scheduling VM, không còn bởi chi phí tick. Tỉ lệ tick trùng frameIdx
tăng lên 0,29–0,36 (tick nhanh hơn video) — cache theo frameIdx giờ có thể đáng cân nhắc
nhưng chưa làm (tiết kiệm ước ~1ms trung bình/tick, chưa chứng minh).

### Parity pixel (đường mới vs cũ, cùng frame pause, canvas 872×276)

| spec | MAD | maxAbs | pixel lệch / 240.672 |
|---|---|---|---|
| B (feather 0) | 0 | 0 | 0 |
| E (feather 0,2) | 0 | 0 | 0 |

Đo lại sau sửa lần 2 (Uint32 fill + tái dùng canvas): B và E vẫn MAD = 0, maxAbs = 0.
Đường mới cho kết quả **bit-identical** với đường cũ trong cả 2 case.

## 4. Biện pháp KHÔNG hiệu quả (đã sửa, không giữ bản lỗi) — build canvas mới mỗi miss

Bản đầu của `maskAlphaCanvasFor` tạo canvas + `createImageData` mới mỗi lần miss.
Đo spec C (mask động, miss mỗi tick) sau sửa lần 1:

| pass | ratio | ticks | renderFrame med | mask med |
|---|---|---|---|---|
| 1 | 0,120 | 11 | 197,6ms | 98,2ms |
| 2 | 0,101 | 10 | 196,9ms | 93,3ms |
| 3 | 0,174 | 16 | 95,5ms | 31,5ms |

Đối chứng đường cũ trên cùng spec C (`--no-mask-canvas`, 3 pass):

| pass | ratio | ticks | renderFrame med | mask med (apply) |
|---|---|---|---|---|
| 1 | 0,420 | 38 | 39,1ms | 25,0ms (apply 21,4ms) |
| 2 | 0,507 | 46 | 33,5ms | 22,7ms (apply 20,3ms) |
| 3 | 0,535 | 47 | 32,9ms | 22,8ms (apply 20,4ms) |

**Kết luận: đường canvas v1 HỒI QUY 3–6× trên mask động** (total 95–197ms vs 33–39ms;
ratio 0,10–0,17 vs 0,42–0,54). Nguyên nhân: mỗi miss cấp phát ~2MB (canvas 640×360 +
ImageData) → GC stall; mẫu thô cho thấy mask 26ms (build) và 85–117ms (build + stall)
xen kẽ. Micro-benchmark Node: `maskAlphaArray` gọi `maskAlphaAt` từng pixel = 8,6ms
(vs `applyMask` 2,3ms) — cũng chậm hơn cần thiết.

**Sửa lần 2 (đã hạ cánh, tsc 0):**
1. `maskAlphaArray` hoist hình học ra khỏi vòng lặp pixel (cx/cy/rx/ry/band/x0..y1 tính
   1 lần, công thức ellipse/rect inline — giá trị không đổi, unit test 24/24 vẫn xanh):
   Node 640×360: 8,6ms → ~4–5ms (ellipse feather 0: 4,0–4,4ms; feather 0,2: 5,3–6,9ms).
2. `maskAlphaCanvasFor` **tái dùng canvas + ImageData của entry bị đuổi** (không cấp phát
   mới sau warmup 8 hình học); fill RGB+alpha bằng 1 lần ghi Uint32/pixel
   (`0x00FFFFFF | (alpha << 24)`, little-endian). Cache entry nay là `{canvas, img}`.

**Kết quả sau sửa lần 2 — spec C:**

| pass | ratio | ticks | renderFrame med | mask med (miss ~4,6ms / hit ~0,7ms) |
|---|---|---|---|---|
| 1 | 0,618 | 64 | 9,2ms | 4,7ms |
| 2 | 0,592 | 96 | 8,3ms | 4,5ms |
| 3 | 0,634 | 117 | 8,2ms | 0,9ms (median — nhiều tick trùng frameIdx + track kẹp sau t=2s) |

C nay **nhanh hơn đường cũ ~4×** (8,2–9,2ms vs 33–39ms) và **ratio vượt đường cũ**
(0,59–0,63 vs 0,42–0,54). Miss ≈ 4,6ms, hit ≈ 0,7ms (mẫu thô xen kẽ 4,6 / 0,6–0,7
theo tick trùng frameIdx; sau t=2s track kẹp ở x=0,7 nên toàn hit).

**Kết quả sau sửa lần 2 — spec B (không hồi quy) và D (mask+SR):**

| spec | pass | ratio | ticks | renderFrame med | mask med |
|---|---|---|---|---|---|
| B | 1 | 0,629 | 106 | 4,8ms | 0,7ms |
| B | 2 | 0,562 | 115 | 4,5ms | 0,7ms |
| B | 3 | 0,597 | 110 | 4,5ms | 0,7ms |
| D | 1 | 0,657 | 116 | 4,7ms | 0,7ms |
| D | 2 | 0,648 | 119 | 4,5ms | 0,7ms |
| D | 3 | 0,643 | 127 | 4,3ms | 0,7ms |

B: ratio 0,56–0,63 (từ 0,09–0,25 baseline), rfMed 4,5–4,8ms (từ 73–85ms). D (mask tĩnh
+ keyframes rotation/scale qua đường SR): ratio 0,64–0,66, rfMed 4,3–4,7ms — cùng mức
giảm trên đường SR. `longtask = 0` mọi pass B/C/D sau sửa lần 2.

## 5. Hai sửa chữa phụ trong lúc đo (hồi quy do tick nhanh hơn)

### 5.1 Watchdog rVFC giết oan pump

Assert A–E lần 1 sau tối ưu: 4 FAIL spread (B 29,5, C 38,6, D 46,3, E 46,2; A pass).
Chẩn đoán: case D/E `rvfcFallback="no-callback"`, `rvfcActive=false`, captures đóng băng
ở 349 qua cả D và E — watchdog giết pump giữa case D, `rvfcDeadClips` dính theo clip id
"c0" nên E kế thừa trạng thái chết. Nguyên nhân: watchdog S1 đếm 1 miss MỖI TICK khi
video tiến mà chưa có capture; tick 12fps → hiếm miss, tick 30fps → 3 miss trong ~100ms
dù pump sống (capture trung bình ~50ms, gap tới 300ms).

**Sửa** (`rvfcWatchdogMiss` + `RvfcWatchdogState.lastCaptureMs`): đếm miss theo THỜI GIAN
— tối đa 1 miss mỗi 500ms không-capture; kill sau 3 miss = ≥1,5s hạn hán capture thật
(gấp 5× gap dài nhất đã quan sát ~300ms); capture mới về thì reset misses=0. Giữ ân hạn
500ms sau tạo pump và sticky-dead.

**Hiệu quả:** assert lần 2 trở đi D/E không còn fallback (`rvfcFallback=""` mọi case,
captures tích lũy 212 → 1105 qua 5 case trong assert cuối).

### 5.2 Nhãn cửa sổ blend ĐÃ VẼ + đọc kép trước/sau khi đo pixel

Assert lần 1 còn cho thấy spread cao dù trail=0, mép đúng, captures tăng 2× — nhãn
(frameIdx theo vt + lastFrame đọc SAU lúc đo pixel) lệch vì capture rơi vào giữa lúc
harness đo pixel bằng getImageData (tốn hàng chục ms).

**Sửa:**
- Thêm `prevFrame` + `lastDrawnFrameIdx/LastFrame/PrevFrame` vào `MotionBlurDebugState`:
  `prevFrame` (snapshot kế trước lastFrame, -1 khi ring vừa xoá); `lastDrawn*` là cửa sổ
  blend ĐÃ DÙNG, ghi tại `recordDrawnBlendWindow` ở cả 3 điểm blend thành công
  (mask-blend, plain-blend SR, plain-blend thường). Debug-only, không đổi hành vi vẽ.
- Sửa harness S1 (`probe91s1-motionblur-rvfc.cdp.mjs`): đọc thêm `prevFrame`/`lastDrawn*`
  vào `dbgNow`; tính thêm `gStdSpreadDrawn` nhóm theo cửa sổ đã vẽ, chỉ mẫu ring≥1 và
  `lastDrawnFrameIdx === frameIdx`; assert spread khóa theo cửa sổ đã vẽ (median ≤15,
  cần ≥5 nhóm); spread theo cặp cũ chỉ còn là chẩn đoán in ra.
- **Đọc kép:** harness đọc nhãn cửa sổ blend TRƯỚC VÀ SAU khi đo pixel, chỉ giữ mẫu khi
  nhãn trước/sau GIỐNG NHAU (`drawnStable`) — app có thể tick và vẽ lại với cửa sổ mới
  trong lúc `__p3measure()` chạy (tick nay ~33ms, trước đây ~83ms nên hiếm gặp). Mẫu
  nhãn đổi giữa chừng là pixels của cửa sổ cũ gán nhãn mới → loại.

**Phân tích mẫu thô khẳng định cơ chế:** trong assert lần 2, spread theo cửa sổ đã vẽ
của B là 27,7 (median) với phân bố bimodal 31 nhóm spread 0–1 và 37 nhóm spread 28–111;
trong nhóm xấu, gStd xen kẽ đúng 2 mức (~36,6 và ~83,8) — pixels của 2 cửa sổ kề nhau
bị gán cùng 1 nhãn. Sau sửa đọc kép, assert cuối (lần 4) cho spread theo cửa sổ đã vẽ
0,2–1,4 mọi case (xem §5.3). Đáng chú ý: `drawnStable` = false xảy ra **0 lần** trong
assert cuối — bộ lọc làm việc chính là đẳng thức `lastDrawnFrameIdx === frameIdx`
(vt đọc lúc đo vs frame đã vẽ lúc tick lệch nhau tối đa 1 frame vì đồng hồ video chạy
liên tục); đọc kép giữ lại như biện pháp an toàn rẻ tiền. Số mẫu bị loại vì mismatch
vẫn lớn (108–187/pass/case) nhưng còn đủ nhóm (47–63) cho assert.

### 5.3 Assert A–E cuối (5 pass/case, sau mọi sửa, exit 0 — "ASSERT PASS: tất cả kiểm tra xanh")

| case | drawn-spread median | nGroups | trailMax | rvfcFallback | captures (cuối case) |
|---|---|---|---|---|---|
| A | 0,2 | 47 | 0 | "" | 212 |
| B | 1,4 | 63 | 0 | "" | 432 |
| C | 0,6 | 50 | 0 | "" | 658 |
| D | 0,2 | 61 | 0 | "" | 883 |
| E | 0,8 | 62 | 0 | "" | 1105 |

Ngưỡng assert: spread median ≤15, cần ≥5 nhóm. Mọi case PASS; trail = 0 mọi case;
mép đúng (S1 §3 giữ nguyên). Spread theo cặp cũ (chẩn đoán) vẫn cao ở một số case
(vd E 29,3) — đó là nhãn cũ lệch, không phải lỗi sản phẩm (xem §5.2).

## 6. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| tsc web (`npx tsc --noEmit`) | 0 lỗi (sau mọi sửa) |
| vite build | pass (8,65s; cảnh báo chunk >500kB có từ trước) |
| Unit previewEngine | **24/24** (20 cũ + 4 mới) |
| ghostBlend probe | **15/15** |
| maskTrack | **22/22** |
| maskKeyframes | **14/14** |
| O4 maskTrackPreview87O4 (esbuild bundle) | **37/37** |
| Assert A–E S1 (5 pass/case) | **100/100, exit 0** |
| Parity pixel B/E (mới vs cũ) | **MAD=0, maxAbs=0** (240.672 px mỗi spec) |
| Click-test O8 Chromium headed (Xvfb) | **21/21 pass, 0 fail** |
| rAF trang trắng | 59,7–60,7fps (môi trường không kẹp rAF) |

## 7. Giới hạn còn lại (trung thực)

1. **Tỉ lệ capture 0,56–0,66, chưa tới 1,0.** Tick không còn là bottleneck (loopMed
   ≈ rfMed + ~1ms, longtask = 0); giới hạn nay là scheduling headless/VM: rVFC capture
   tốn ~8–32ms mỗi lần (software rendering), gap giữa các capture tới ~300ms; capture
   ratio dao động theo tải VM (pass tải spike của B v1: 0,284). Muốn cao hơn nữa phải
   đụng tới rVFC pump/scheduling (không phải tick) — nợ đợt sau.
2. **Mask động vẫn tính lại alpha mỗi frame mới** (~4,6ms/miss). Chưa có cache theo
   frameIdx (tỉ lệ tick trùng frameIdx nay 0,29–0,43 — đáng cân nhắc, tiết kiệm ước
   ~1ms trung bình/tick, chưa chứng minh; cần đo trước khi làm).
3. **Số đo tuyệt đối nhiễu theo tải VM** (loadavg 0,4–15 trong các lượt đo; VM reboot
   1 lần giữa lượt, ~21:36Z, làm chết vite dev 5173 — đã khởi động lại). So sánh chỉ
   có ý nghĩa theo cụm fast/slow + median, 3 pass.
4. **Spread theo cặp cũ vẫn cao** ở một số case (E 29,3) — là nhãn đo lệch (§5.2),
   không phải lỗi sản phẩm; nhưng bộ lọc loại 108–187 mẫu/pass/case — assert dựa trên
   47–63 nhóm, đủ nhưng không dư dả (đặc biệt case A/C ở assert lần 3 chỉ còn 6–8 nhóm;
   assert cuối đã cải thiện nhờ tick nhanh hơn).
5. **Chưa đo:** mask+blur ở độ phân giải khác 640×360 unit (4K unit sẽ tăng chi phí
   build alpha theo diện tích); mask feather lớn + invert trên đường canvas đã có unit
   test nhưng chưa có parity pixel (chỉ B feather 0 và E feather 0,2); WebKit chưa
   click-test lại sau sửa (chỉ Chromium O8 21/21).
6. **Cache alpha canvas trần ~7MB** (8 hình học × 640×360×4B) + ImageData tái dùng —
   chưa đo áp lực RAM trên máy yếu hơn VM này.

## 8. Nợ chuyển đợt 93

1. **rVFC pump/scheduling** — tỉ lệ capture 0,56–0,66 còn thấp: đo gap capture, thử
   capture song song/không chặn rAF, hoặc giảm chi phí capture (~8–32ms) — tách khỏi
   chi phí tick (đã đóng ở đây).
2. **Cache mask theo frameIdx** — tick trùng frameIdx nay 0,29–0,43: đo xem bỏ qua
   tính lại mask khi frameIdx không đổi có giảm thêm ~1ms/tick không (baseline T2
   lúc 5% đã bác; nay khác, cần đo lại).
3. **Parity pixel feather lớn + invert** trên đường canvas (unit test đã có, parity
   probe chưa chạy).
4. **Click-test WebKit** sau sửa đường mask (chỉ mới chạy Chromium).
5. **Đo ở unit 4K / clip dài hơn 3s** để xem chi phí build alpha theo diện tích và
   cache 8 hình học có đủ không.
6. **TTS 39 — CẤM kiểm lại** (nợ cũ, giữ nguyên). **ci-security 403** (nợ cũ, chờ user).
   **G1** (deint verdict — chờ parent/user quyết, nợ cũ). **birefnet** (cần cửa sổ yên
   ≥6 GB RAM, nợ cũ).

## 9. File đổi/thêm (stage, KHÔNG PUSH)

- `apps/web/src/preview.tsx` — instrumentation tick/rVFC/loop + cache canvas alpha
  (lần 1) + tái dùng canvas/ImageData (lần 2) + watchdog rVFC theo thời gian +
  `prevFrame`/`lastDrawn*` debug state.
- `apps/web/src/lib/previewEngine.ts` — `maskAlphaArray` + `maskAlphaCacheKey`
  (lần 1) + hoist hình học trong `maskAlphaArray` (lần 2).
- `apps/web/src/lib/previewEngine.test.ts` — 4 test mới cho maskAlphaArray/cache key.
- `apps/web/scripts/probe92t2-tickcost.cdp.mjs` (mới) — harness đo tick + cờ
  `--no-mask-canvas` / `--disable-rvfc`.
- `apps/web/scripts/probe92t2-raf-rate.cdp.mjs` (mới) — đo rAF trang trắng.
- `apps/web/scripts/probe92t2-mask-parity.cdp.mjs` (mới) — parity pixel A/B.
- `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs` (sửa) — nhóm spread theo cửa sổ
  đã vẽ + đọc kép `drawnStable`.
- `docs/PHASE9_ROUND92_T2_TICK_COST_LIMITS.md` (file này).
- Scratch (không stage): `~/workspace/round92-t2/` (specs, out/*.json, log assert,
  clicktest-o8.log, vite logs). Media test `stripes-scroll.mp4` /
  `stripes-static.mp4` đã xoá khỏi `apps/web/public/`.

## 10. Nguồn số liệu

- `~/workspace/round92-t2/out/tickcost-b-baseline.json` (baseline B, load 14,76)
- `~/workspace/round92-t2/out/tickcost-b-after2.json` (B v1), `tickcost-b-after3.json` (B v2)
- `~/workspace/round92-t2/out/tickcost-c-after.json` (C v1 — hồi quy),
  `tickcost-c-oldpath.json` (C đường cũ — đối chứng), `tickcost-c-after2.json` (C v2)
- `~/workspace/round92-t2/out/tickcost-d-after.json` (D v2)
- `~/workspace/round92-t2/out/mask-parity-b.json`, `mask-parity-e.json`,
  `mask-parity-b2.json`, `mask-parity-e2.json` (MAD=0)
- `~/workspace/round92-t2/out/preview-abcde-assert3.json` (assert lần 3, sau watchdog
  + drawn-window, B 27,7 FAIL), `preview-abcde-assert4.json` (assert cuối, PASS)
- `~/workspace/round92-t2/assert-abcde3.log`, `assert-abcde4.log`,
  `~/workspace/round92-t2/clicktest-o8.log` (O8 21/21)

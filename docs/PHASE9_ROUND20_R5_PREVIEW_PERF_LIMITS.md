# Phase 9 đợt 20, luồng R5 — LIMITS: profiling + sửa nút thắt preview FPS

> Luồng R5 đợt 20. Repo làm việc: `~/workspace/repo-1`, KHÔNG push
> GitHub, KHÔNG release/tag, KHÔNG code giả. Đóng nợ đợt 19 G4 §6:
> 1 tick preview tốn ~65 ms, vòng rAF idle chỉ ~11–12 Hz, chưa
> profiling. Kết luận của luồng này: **nút thắt KHÔNG nằm trong code
> JS của preview** — xem §3–§5. Mọi số dưới đây đều đo trên VM này
> (2 vCPU, Xvfb, raster phần mềm, không GPU thật) và KHÔNG được
> trích thành FPS trên máy user.

## 0. Kết luận ngắn (không vượt số đo)

1. **Baseline tái tạo đúng G4:** trên bundle đợt 20 (xem §1), project
   mẫu chạy panel ~10,7 fps, draw thật ~13,3/s, vòng rAF riêng
   ~14,3 Hz (3 run ổn định, §2). G4 trên bundle cũ: panel
   10,6–11,6, draw 13,3–14,5 — cùng một dải, không có hồi quy.
2. **Profiling exonerate JS hoàn toàn:** CPU profile main thread
   trong lúc phát: `(idle)` 86–88%, `(program)` ~5%, `drawImage`
   native ~2,4–5%, mọi hàm JS trong bundle ≤ 0,5% self. Lúc đứng
   yên: `(idle)` 96,4%, JS tổng < 1%. Nếu tick JS tốn 65 ms thì
   self JS phải chiếm ~80% slot — số đo ngược lại hoàn toàn.
   Longtask lúc phát ổn định chỉ 2 task/22 s (bản outlier §6 có
   13 task nhưng profile vẫn idle 88% — nhiễu, không dùng).
3. **Op canvas đo được, mỗi op đều nhỏ:** mỗi frame phát: ~1
   drawImage (~7,6–8,2 ms/lần — chi phí lớn nhất đo được nhưng
   chỉ ~10% slot 82 ms), ~2,2 fillRect, ~0,7 fillText, 1 set
   `ctx.filter`, ~1,8 save/restore. Tổng thời gian drawImage
   ~100 ms/giây phát. Không có op nào giải thích được slot 82 ms.
4. **Thí nghiệm cô lập chỉ ra pipeline hiển thị phần mềm, không
   phải code preview:**
   - Ẩn canvas khỏi paint (vòng preview vẫn vẽ vào bitmap): FPS
     KHÔNG đổi (panel 11,07; idle gap 84,1 ms) → composite canvas
     không phải thủ phạm.
   - Ẩn toàn bộ body khi đứng yên: rAF riêng 12 Hz → ~50 Hz
     (250 callback/5 s, gap 17,6 ms).
   - Chỉ để preview-wrap hiện, còn lại ẩn, khi đứng yên: ~58 Hz
     (291 callback/5 s, gap 17,4 ms) → chi phí nằm ở paint toàn
     bộ DOM còn lại, không nằm ở canvas preview.
   - Cửa sổ 960×540 (layout co lại, canvas chỉ còn 392×1 px —
     KHÔNG phải test sạch, xem §5): panel 56,17 fps, draw
     72,9/s → cùng vòng lặp JS đó chạy nhanh được khi khối
     lượng raster/paint nhỏ đi.
5. **Thử sửa duy nhất (guard `ctx.filter`) đã đo trước/sau và đã
   HOÀN NGUYÊN:** guard làm số lần gán filter 12,5–13,6/s → đúng
   0/s (probe đếm được), nhưng FPS không nhúc nhích (panel
   10,39/11,06 so với baseline 10,44/10,69/10,88; draw
   13,20/13,93 so với 13,13–13,67). Theo đúng luật của brief
   ("sửa không cải thiện thì giữ nguyên code cũ"), code sản
   phẩm đã hoàn nguyên từng ký tự — **trạng thái cuối: 0 file
   sản phẩm đổi**. Kết quả âm này vẫn có giá trị: nó khóa thêm
   một giả thuyết (filter không phải thủ phạm).
6. **Hệ quả thực tế:** trên VM này, FPS preview bị trần bởi tốc
   độ raster/present toàn cửa sổ 1920×1080 qua Xvfb phần mềm
   (mỗi frame compositor phải raster lại cửa sổ; vòng rAF chạy
   liên tục ngay cả khi đứng yên nên compositor không bao giờ
   nghỉ). Không có tối ưu JS nào trong phạm vi preview.tsx có
   thể đẩy 12 → 30 fps ở đây. Trên máy thật có GPU compositing,
   trần này phần lớn biến mất — nhưng luồng này KHÔNG đo được
   trên GPU thật nên không claim số nào cho máy thật.
7. **Nợ chuyển đợt sau (ngoài phạm vi file của luồng này):**
   vòng rAF chạy liên tục khi đứng yên + MixerMeter rAF chạy
   luôn là 2 vòng giữ compositor sản xuất frame không ngừng.
   Muốn giảm tải idle thật sự phải cho cả 2 vòng ngủ khi không
   có gì đổi (cần sửa cả MixerMeter.tsx, ngoài file được phép
   của luồng này) + kiểm chứng click-test seek/pause/scrub sau
   khi đổi. Riêng việc đó cũng KHÔNG hứa hẹn tăng FPS lúc phát
   trên VM này (lúc phát frame vẫn phải sản xuất), chỉ giảm tải
   lúc đứng yên.

## 1. Phương pháp + điều kiện đo

- Kế thừa script G4 (`measure-v19-real-project-fps-pipe.mjs`):
  Playwright Chromium 156 headed dưới Xvfb 1920×1080×24, điều
  khiển qua `--remote-debugging-pipe`, build thật `apps/web/dist`
  chạy bằng `vite preview`, project mẫu tự load (2 clip webm
  640×360 tự ghi + 1 clip chữ, 1280×720@30fps, 8 s), điều khiển
  bằng nút "📈 FPS" + phím Space thật, 3 kênh PerfOverlay /
  probe-draw (identity-setTransform/2) / vòng rAF riêng.
- Mở rộng mới trong script v20 (chỉ wrap runtime, không sửa code
  sản phẩm): đếm + đo thời gian từng op canvas trên chính ctx
  preview (drawImage/fillRect/fillText/getImageData/filter-set/
  save/restore), thống kê gap của vòng rAF riêng, longtask
  observer, CPU profile qua CDP `Profiler` (idle 5 s + phát 16 s).
  Lưu ý: `STATE_JS` tự gọi getImageData 1 lần/mẫu (~1/s) nên số
  gid thô đã trừ ~1/mẫu khi báo cáo; timing drawImage bao gồm
  raster đồng bộ của backend CPU, không tách được decode video.
- Bundle đo: baseline 3 run chạy trên bundle `index-CWf95B-I.js`
  (dist do 1 luồng đợt 20 khác build 01:20 UTC 29/10 từ source
  hiện tại; `preview.tsx` không đổi từ 27/10 nên logic preview
  đo được là logic đã đọc). Run outlier §6 và run đầu BQ
  (`index-BQwvL1tV.js`, bundle G4) chỉ để đối chiếu, không dùng
  làm baseline. Script v20 dùng cổng 4181, display :96/:95 (mặc
  định) hoặc :92/:91 qua env; script thí nghiệm dùng cổng 4183.
- Tải máy ghi rõ từng run (loadavg 1 phút, xem §2/§6). `tsc
  --noEmit` = 0 lỗi, `vite build` pass cho cả bản thử guard và
  bản hoàn nguyên (dist là build output, gitignored, không stage).

## 2. Baseline đợt 20 (bundle CWf95B-I, 3 run ổn định)

Điều kiện chung: Chromium 156, Xvfb 1920×1080×24, cửa sổ
1920×1080, probe WebGL = `no-webgl`, canvas preview 1351×512,
dpr = 1, sample load 8,0–8,4 s (video webm thật).

| Run | Panel mean / median / min–max | Draw thật | Vòng rAF riêng | Idle gap mean | Play gap mean | drawImage |
|---|---|---|---|---|---|---|
| 1 | 10,44 / 11 / 8–13 | 13,20/s | 14,20 Hz | 87,6 ms | 94,6 ms | 95,4 ms/s |
| 2 | 10,69 / 11 / 7–12 | 13,13/s | 14,20 Hz | 88,5 ms | 91,7 ms | 108,9 ms/s |
| 3 | 10,88 / 11 / 9–12,2 | 13,67/s | 14,47 Hz | 84,2 ms | 91,0 ms | 100,5 ms/s |

Đọc: 3 run hội tụ chặt (panel 10,4–10,9; draw 13,1–13,7).
Đối chứng trang trần cùng đợt: 58,2–59,0 Hz. Đối chứng đứng
yên: draws = 0 ở mọi run (renderFrame không chạy khi pause),
nhưng panel idle chỉ ~10,7–11,8 fps và gap rAF riêng ~84–88 ms
— vòng rAF idle đói dù không vẽ gì (câu hỏi G4 §6, nay có đáp
án ở §4: paint toàn cửa sổ, không phải JS).

Op canvas lúc phát (trung bình 3 run, mỗi giây phát): drawImage
~13 lần (~100 ms/giây ⇒ ~7,6–8,2 ms/lần), fillRect ~28 lần,
fillText ~9 lần, filter-set ~13 lần, save/restore ~22 lần,
getImageData ~0,2 lần/s sau khi trừ mẫu đo (tức ~0 — preview
thật không đọc pixel về).

## 3. CPU profile — JS được minh oan bằng số

Profile idle 5 s (run baseline): samples 4504, wall 5089 ms:
`(idle)` 96,4%, `(program)` 2,6%, hàm bundle lớn nhất `fg`
0,6%, còn lại ≤ 0,1% (gồm `pumpLevel`, `update` của AudioEngine,
`videoFor`). Longtask idle: 0.

Profile phát 16 s (run baseline đầu, bundle BQ): samples 17120,
wall 22270 ms: `(idle)` 86,6%, `(program)` 5,0%, `drawImage`
native 4,8%, `fg` 0,4%, `(anon)` 0,4%, còn lại ≤ 0,3% (GC 0,2%,
getImageData 0,2% — phần lớn là getImageData của chính script
đo). Trên bundle CW: `(idle)` 88,2%, `(program)` 5,2%,
`drawImage` 2,4%. Không có hàm React, store, spec, filter hay
layout nào vượt 0,5% — giả thuyết "React re-render theo
setPlayhead", "tính spec mỗi tick", "ctx.filter đắt" đều chết
bằng số: setPlayhead đã snap theo frame nên đa số tick là
no-op với selector (không re-render), `buildPreviewSpec` trả
đúng object cũ khi không có nested/adjustment, và filter chỉ
là 1 lần gán/frame.

Longtask lúc phát (run ổn định): 2 task/22 s (57 ms, 122 ms).
Main thread bận ~10–13% wall nhưng rAF gap vẫn ~91–96 ms:
phần lớn slot là chờ frame từ compositor, không phải chờ JS.

## 4. Thí nghiệm cô lập (runtime DOM, không sửa sản phẩm)

Tất cả trên cùng bundle/phương pháp với §2, trừ phần ghi rõ:

| Thí nghiệm | Kết quả | Kết luận |
|---|---|---|
| Ẩn canvas khỏi paint (`display:none`, vòng preview vẫn vẽ vào bitmap), phát 16 s | panel 11,07; draw 14,07/s; rAF riêng 14,67 Hz; idle gap 84,1 ms | Gần như không đổi so với baseline → composite/upload canvas KHÔNG phải thủ phạm |
| Ẩn toàn bộ body, đứng yên 5 s | own-rAF 250 callback/5 s ≈ 50 Hz, gap 17,6 ms, draws 0 | Bỏ paint → rAF về gần mức trang trần → thủ phạm nằm ở paint |
| Chỉ preview-wrap hiện, còn lại ẩn, đứng yên 5 s | own-rAF 291 callback/5 s ≈ 58 Hz, gap 17,4 ms, draws 0 | Canvas + wrap hiện mà vẫn 58 Hz → thủ phạm là paint DOM ngoài preview, không phải canvas |
| Cửa sổ 960×540 (layout co, canvas 392×1 px) | panel 56,17; draw 72,87/s; rAF riêng 82,27 Hz; pixel-đổi 0/12 mẫu (canvas 1 px cao, hash không bắt được chuyển động — bằng chứng phát chỉ còn đồng hồ TopBar đổi 12 lần) | KHÔNG phải test sạch (2 biến đổi cùng lúc: pixel cửa sổ + pixel canvas) — chỉ dùng để chứng minh cùng vòng lặp JS chạy nhanh được khi raster nhẹ đi, không dùng số 56 fps để claim gì |

Chuỗi suy luận khóa: JS ≈ 0 (profile) + canvas-paint ≈ 0
(ẩn canvas không đổi) + bỏ paint toàn trang ⇒ 50–58 Hz ⇒
trần nằm ở khâu raster/present toàn cửa sổ 1920×1080 qua
Xvfb phần mềm. Backdrop-filter duy nhất trong CSS chỉ nằm
trên `.modal-backdrop` (modal không mở lúc đo) nên không phải
thủ phạm; animation `pulse`/`caption-spin` cũng không active
trên project mẫu.

## 5. Thử sửa duy nhất: guard `ctx.filter` — đo trước/sau, rồi hoàn nguyên

Thay đổi thử (trong `setCtxFilter`, `preview.tsx`): chỉ gán
`ctx.filter` khi giá trị đọc được khác giá trị muốn — ngữ nghĩa
giữ nguyên tuyệt đối (trạng thái filter sau gọi hàm luôn bằng
`css || "none"`), chỉ bỏ lần gán thừa. Trước: ~12,5–13,6 lần
gán/giây; sau: đúng 0 lần/giây trong cả 2 run đo (probe đếm
được — guard hoạt động đúng).

| | Panel mean | Draw thật | Vòng rAF riêng | Idle gap |
|---|---|---|---|---|
| Trước (3 run §2) | 10,44 / 10,69 / 10,88 | 13,20 / 13,13 / 13,67 | 14,20 / 14,20 / 14,47 Hz | 87,6 / 88,5 / 84,2 ms |
| Sau guard (2 run, bundle yRA98XhB) | 10,39 / 11,06 | 13,20 / 13,93 | 13,80 / 14,60 Hz | 105,4 / 83,3 ms |

Đọc: mọi chỉ số sau đều nằm trong phương sai run-trước (run1
sau có idle gap 105,4 ms cao hơn nhưng panel/draw vẫn trong
dải; tải máy lúc đó loadavg 2,89). Guard không cải thiện FPS
→ **đã hoàn nguyên** `setCtxFilter` về đúng bản gốc, `tsc
--noEmit` 0 lỗi, `vite build` pass (bundle hoàn nguyên
`index-CqSMZJSz.js`). Không cần đo parity lại: không còn thay
đổi sản phẩm nào tồn tại sau hoàn nguyên, và guard vốn không
đổi pixel (chỉ đổi số lần gán state, không đổi giá trị state).

## 6. Sự cố đo + outlier — khai trung thực (không giấu)

1. **Run outlier 5,4 fps (bundle CW, đã loại khỏi baseline):**
   panel 4,88, draw 5,40/s, rAF riêng 5,40 Hz, idle gap 176,1 ms,
   play gap 210,8 ms, 13 longtask 51–110 ms trong cửa sổ phát —
   dù loadavg lúc bắt đầu chỉ 0,67. Profile của chính run này
   vẫn `(idle)` 88,2% nên không kết luận được nguyên nhân từ
   trong trang; khả năng cao nhất là tranh chấp nhất thời với
   luồng đợt 20 khác (ffmpeg/Chrome headed chạy song song trên
   cùng 2 vCPU) — nhưng đó là suy luận, không phải số đo. Run
   này KHÔNG dùng cho baseline hay kết luận nào; 3 run §2 ngay
   sau đó trên cùng bundle đã trở lại dải 10,4–10,9.
2. **Dist bị build lại giữa chừng bởi luồng khác:** bundle đổi
   BQwvL1tV → CWf95B-I trong lúc đo (01:20 UTC 29/10). Các run
   trong cùng 1 lần gọi script dùng chung vite preview nên
   bundle trong trang không đổi giữa chừng; baseline §2 đo trên
   bundle CW, run đầu §3 đo trên bundle BQ — 2 bundle cho cùng
   một dải số nên không ảnh hưởng kết luận, nhưng khi đối
   chiếu phải ghi rõ bundle (đã ghi).
3. **Socket Xvfb mồ côi sau SIGKILL:** script kill Xvfb bằng
   SIGKILL nên socket `/tmp/.X11-unix/X<n>` còn sót, làm lần
   chạy sau tưởng display bận và fail (đã gặp 1 lần ở thí nghiệm
   cửa sổ nhỏ). Đã vá cả 2 script: khi socket tồn tại mà không
   còn tiến trình Xvfb nào (`pgrep -x Xvfb` trống) thì dọn
   socket + lock rồi dùng tiếp; nếu Xvfb khác đang chạy thì vẫn
   bỏ qua display đó. Không xóa socket của tiến trình đang sống.
4. **Thí nghiệm cửa sổ nhỏ không sạch (§4):** layout app co
   lại làm canvas chỉ còn 392×1 px nên không tách được "pixel
   cửa sổ" khỏi "pixel canvas". Số 56 fps của nó chỉ chứng
   minh vòng lặp JS không bị trần ở 12 Hz, không được trích
   làm FPS kỳ vọng ở cửa sổ nhỏ.
5. **`tsc` chạy đầu có lỗi lạ rồi tự hết:** lần chạy `tsc
   --noEmit` đầu tiên in 1 lỗi TS5097 ở `twoLevelCurve.test.ts`
   (file của luồng khác), lần chạy ngay sau đó 0 lỗi, exit 0.
   Không sửa file đó (ngoài phạm vi), không claim nguyên nhân;
   chỉ ghi nhận bản hoàn nguyên cuối cùng đã qua `tsc` 0 lỗi.

## 7. Cấm trích (nhắc lại + bổ sung)

- Cấm trích "preview 11 fps" thành FPS trên máy user: đây là
  VM 2 vCPU, raster phần mềm, Xvfb, dpr = 1, canvas 1351×512,
  project mẫu nhẹ — không GPU thật, không footage thật, không
  timeline nặng.
- Cấm trích số run outlier §6 (5,4 fps) mà không ghi "run nhiễu
  đã loại, nguyên nhân chưa xác định".
- Cấm trích số thí nghiệm cửa sổ nhỏ (56 fps) mà không ghi
  "layout co, canvas 392×1 px, không phải test sạch".
- Cấm claim "đã tối ưu preview nhanh hơn": luồng này KHÔNG để
  lại thay đổi sản phẩm nào; guard filter đã thử, đã đo, đã
  hoàn nguyên vì không cải thiện.

## 8. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `apps/web/scripts/measure-v20-preview-profile-pipe.mjs` (MỚI —
  baseline + profiling: 3 kênh G4 + đếm op canvas + gap rAF +
  longtask + CPU profile CDP; cổng 4181, display :96/:95 mặc
  định, dọn socket Xvfb mồ côi).
- `apps/web/scripts/measure-v20-experiments-pipe.mjs` (MỚI —
  thí nghiệm cô lập canvas-hidden / body-hidden-idle /
  only-preview-idle / small-window; cổng 4183).
- `docs/PHASE9_ROUND20_R5_PREVIEW_PERF_LIMITS.md` (MỚI — file này).
- `apps/web/src/preview.tsx`: ĐÃ THỬ guard `ctx.filter` rồi
  HOÀN NGUYÊN — trạng thái cuối KHÔNG đổi so với trước luồng
  này, KHÔNG đưa vào batch.
- KHÔNG sửa file nào khác. Đặc biệt: không sửa store.ts,
  nestUtils.ts, nestedPreview.ts ngữ nghĩa, render worker,
  i18n, harness của luồng khác. Không push, không ghi qua
  GitHub connector, không stage (parent sẽ stage).

## 9. Kiểm chứng đã chạy

- `node --check` cho cả 2 script mới: pass.
- `node apps/web/scripts/measure-v20-preview-profile-pipe.mjs`
  bản cuối: baseline 3 run ok 3/3 (bundle CW), baseline trang
  trần 58,2 Hz; sau guard 2 run ok 2/2 (bundle yRA98XhB),
  trang trần 58,3 Hz.
- Thí nghiệm: canvas-hidden ok, body-hidden-idle ok,
  only-preview-idle ok, small-window ok (1 lần fail do socket
  mồ côi, đã vá script rồi chạy lại thành công).
- `tsc --noEmit` (apps/web): 0 lỗi ở trạng thái cuối (bản hoàn
  nguyên); `vite build`: pass, bundle `index-CqSMZJSz.js`
  (dist gitignored, chỉ phục vụ đo, không stage).
- KHÔNG đo parity lại: không còn thay đổi sản phẩm nào sau
  hoàn nguyên nên không có pixel nào đổi để đo.

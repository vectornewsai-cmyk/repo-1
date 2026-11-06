# Phase 9 đợt 34, luồng Q3 — Cửa sổ decode-ahead cho footage nhiễu — LIMITS

Ngày: 01/11/2026 (giờ +07; log probe ghi UTC 13:11–13:15).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG code giả.
Luồng này CHỈ sở hữu: module mới + test mới + probe script mới của
mình và file LIMITS này (+ 1 dòng exclude test trong tsconfig.json
chung, + 1 file JSON kết quả probe). KHÔNG sửa `reverseWebcodecs.ts`
(luồng Q2 đang sửa — xem §7), KHÔNG đụng `seek.ts`,
`previewRafHook.ts`, `reversePlayback.ts`, i18n, bridge. Module mới
CHƯA nối vào preview (vẫn cần ctts/elst + đo GPU như nợ P5 §6).

Đọc trước khi làm: `docs/PHASE9_ROUND33_LIMITS.md` §3 mục 4 và
`docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md` §6 (decode phần
mềm footage nhiễu 31,9 fps, biên ~6% cho 30 fps ngược; cần cửa sổ
decode-ahead). Luồng này đóng đúng nợ đó — bằng số đo thật, và kết
quả KHÔNG đẹp như kỳ vọng (xem §0).

## 0. Kết luận ngắn (không vượt số đo)

1. **Bộ nhớ VideoFrame thật (1280×720, decode phần mềm): ~1,50
   MiB/frame** — 3 ước lượng độc lập đều quanh đó: tăng RSS khi
   thêm 300 frame = 1,437 và 1,620 MiB/frame; RSS giải phóng khi
   `closeAll()` 900 frame = 1,447 MiB/frame. Cao hơn NV12 lý thuyết
   1,382 MiB/frame (+4% đến +17%) — dùng số lý thuyết để đặt ngân
   sách sẽ thiếu bộ nhớ. `performance.memory` (jsHeap) gần như
   không nhúc nhích khi giữ 900 frame (211,4 → 211,9 MB, trong đó
   ~211 MB là chính ArrayBuffer file MP4) — xác nhận frame nằm
   ngoài JS heap như P5 đã cảnh báo.
2. **Cửa sổ chọn: 1 GOP = 300 frame, prefetch sâu 2 cửa sổ, giữ tối
   đa 900 frame ≈ 1,32 GiB** (ở ngân sách 2 GiB, frame 1,50 MiB).
   Đây là cấu hình lớn nhất vừa ngân sách mà module tính được —
   KHÔNG phải "càng to càng tốt" vô hạn: cửa sổ to hơn nữa vượt
   ngân sách, cửa sổ nhỏ hơn (90 frame của O5) mất slack.
3. **Cửa sổ mới KHÔNG giữ được nhịp ngược trong lượt đo này.**
   Decode phần mềm footage nhiễu dưới tải song song của đợt 34 chỉ
   đạt 7,7–26 fps (thang ladder 7,7 / 9,6 / 14,0; chuỗi runC 23,0 /
   26,1) — dưới 30 fps phát. Hệ quả đo được: cửa sổ 300 + prefetch
   sâu 1 vẫn late 30/30 frame qua biên; cửa sổ 300 + prefetch sâu 2
   vẫn late 38 frame trong cửa sổ thứ hai và 30/30 frame qua biên
   thứ hai (slack chuỗi −2,96 s). **Đây là deficit throughput,
   không phải deficit cửa sổ:** khi decodeFps < playbackFps thì
   KHÔNG cửa sổ nào giữ được nhịp về lâu dài (module chứng minh
   điều này bằng công thức, §1) — chỉ hardware decode, proxy độ
   phân giải thấp hơn, hoặc giảm chi phí decode mới cứu được.
4. **Với đúng số P5 (decode 31,9 fps, máy ít tải hơn) thì cửa sổ
   này ĐỦ nhưng biên mỏng:** slack 1,19 s ở ngân sách 2 GiB,
   0,60 s ở ngân sách 1 GiB (khi đó ahead tự hạ xuống 1). Tức thiết
   kế đúng cho điều kiện P5, nhưng biên ~6% đó bay hơi ngay khi
   máy bị tranh CPU như lượt này — không được claim "đã giải quyết
   phát ngược footage nhiễu".
5. **Present từ cache KHÔNG phải bottleneck:** mọi cửa sổ đã
   decode đủ đều present đúng pacing 30 fps (wall ≈ frames/30,
   0 late). Nút thắt duy nhất là decode.

## 1. Module mới: `apps/web/src/lib/reverseDecodeAhead.ts`

Import TYPE `ReverseFrameCache` từ `reverseWebcodecs.ts` (không sửa
file đó). Logic thuần, không cần browser — test bằng Node (§7).

### 1.1 Vì sao cửa sổ không cứu được decode chậm (lý thuyết module)

- Decode 1 GOP là decode XUÔI rồi present NGƯỢC: frame cần đầu
  tiên của cửa sổ kế (frame cuối GOP) là frame decode CUỐI cùng.
  Cửa sổ kế chỉ present được khi (gần như) toàn bộ GOP của nó đã
  xong — decode-ahead phải HOÀN THÀNH trước biên cửa sổ.
- Điều kiện ổn định không phụ thuộc kích thước cửa sổ:
  `decodeFps >= playbackFps`. Cửa sổ to / prefetch sâu chỉ mua
  slack tuyệt đối (giây) chống jitter:
  `slack = ahead × (windowSeconds − decodeSeconds)` với decode
  tuần tự các cửa sổ kế (không giả định decode song song).
- Chọn cửa sổ: snap theo bội số GOP (decode luôn từ keyframe);
  lớn nhất vừa ngân sách cho `(1 + ahead)` cửa sổ đồng thời; nếu
  ngay cả 1 GOP × (1 + ahead) cũng vượt ngân sách thì hạ `ahead`
  (2 → 1 → 0) thay vì trả về cấu hình vượt ngân sách; nếu ngay cả
  ahead = 0 với 1 GOP cũng vượt thì trả về 1 GOP kèm
  `cappedBy='memory'` + `meetsTarget=false` (không giấu).

### 1.2 API

- `chooseDecodeAheadWindow(cfg)` → `{ windowFrames, aheadWindows,
  heldWindows, heldFrames, memoryBytes, windowSeconds,
  decodeSeconds, slackSeconds, steadyMargin, cappedBy,
  meetsTarget }`. `frameBytes` PHẢI là số đo thật (§2), không dùng
  NV12 lý thuyết làm quyết định cuối.
- `planReverseWindow(totalFrames, keyIndices, playheadIndex,
  windowFrames)` → đoạn present + đoạn decode align đầu GOP cho
  cửa sổ hiện tại và cửa sổ kế theo chiều ngược.
- `gopStartFromKeys(keyIndices, index)`, `selectEvictions(held,
  keep, playhead, holdFrames)`, `evictCountForBudget(...)`.
- `ReverseDecodeAhead` (controller mỏng trên cache): `decodeWindow`,
  `prefetchWindow` (guard chống decode trùng cửa sổ đang bay, trả
  `null` khi trùng), `evictForReverse` (delegate cho
  `cache.evictExcept` với tập keep đã trừ theo chính sách).

### 1.3 Chính sách evict (chiều ngược)

1. Frame đã phát xong (`index > playhead + holdFrames`, mặc định
   hold = 2) — xa nhất (index lớn nhất) trước.
2. Frame prefetch quá xa (dưới biên dưới của tập keep) — thấp
   nhất trước.
3. KHÔNG BAO GIỜ evict frame trong tập keep, kể cả khi vẫn vượt
   ngân sách: phần thừa trả về ở `keptOutsideBudget` để caller
   báo cáo, không tự phá cửa sổ đang phát.

### 1.4 Bảng chọn cửa sổ (tính bằng chính module, frame 1,50 MiB)

| Điều kiện decode | Ngân sách | Cửa sổ | ahead | Giữ tối đa | Slack | Đạt? |
|---|---|---|---|---|---|---|
| 31,9 fps (P5) | 2 GiB | 300 | 2 | 900 fr / 1,32 GiB | +1,19 s | Có (mỏng) |
| 31,9 fps (P5) | 1 GiB | 300 | 1 (tự hạ) | 600 fr / 0,88 GiB | +0,60 s | Không (slack < 1 s) |
| 23,0 fps (runC đợt này) | 2 GiB | 300 | 2 | 900 fr / 1,32 GiB | −6,09 s | Không (thiếu throughput) |
| 14,0 fps (ladder đợt này) | 2 GiB | 300 | 2 | 900 fr / 1,32 GiB | −22,86 s | Không |

Đọc bảng này đúng cách: hàng 1–2 là "thiết kế đủ khi decode khỏe";
hàng 3–4 là "thiết kế vô nghĩa khi decode yếu" — không có hàng nào
với decode < 30 fps mà đạt, dù ngân sách bao nhiêu.

## 2. Bộ nhớ VideoFrame thật (probe browser, §4)

Fixture: testsrc2 1280×720 30 fps 30 s + `noise=alls=25`, x264
preset veryfast, GOP đúng 300 (`-g 300 -bf 0 -sc_threshold 0` →
keyframe đúng [0, 300, 600]), 900 frame, 210.771.214 byte
(~56,2 Mbps — nặng hơn fixture P5 31 Mbps, xem §3.3). Browser:
binary Playwright chromium-1248 (P5 xác định là Chrome 156),
headed qua Xvfb display :97, `prefer-software` = true.
RSS = tổng RSS cây process Chrome (browser + renderer + GPU +
utility, 11 process) đo bằng `ps`, snapshot đúng lúc cache đang
giữ frame nhờ bắt tay stage/ack qua CDP pipe.

| Mốc | RSS cây Chrome | Suy ra |
|---|---|---|
| Giữ 300 frame (GOP [600,899]) | 1.287,6 MB | — |
| Giữ 600 frame (+ GOP [300,599]) | 1.718,7 MB | +431,1 MB / 300 fr = **1,437 MiB/fr** |
| Giữ 900 frame (+ GOP [0,299]) | 2.204,7 MB | +486,0 MB / 300 fr = **1,620 MiB/fr** |
| Sau `closeAll()` | 902,6 MB | Giải phóng 1.302,1 MB / 900 fr = **1,447 MiB/fr** |

- **Số dùng để chọn cửa sổ: ~1,50 MiB/frame** (trung bình 3 ước
  lượng). Khoảng 1,44–1,62 — chênh lệch giữa các bậc có thể do
  arena allocator / GPU process giữ lại, không phải sai số đo
  frame: cả 3 ước lượng đều > NV12 lý thuyết 1,382 MiB.
- jsHeap: baseline 211,4 MB → sau release 211,9 MB (chênh +0,5 MB
  trong khi RSS dao động > 1,3 GB) — frame ngoài JS heap, jsHeap
  KHÔNG dùng được để đo cache (đúng cảnh báo P5).
- `performance.measureMemory()`: KHÔNG có trong Chrome này dù
  server đã đặt COOP `same-origin` + COEP `require-corp` + CORP
  `same-origin` — page báo `no-measureMemory`. Đây là lý do probe
  dùng RSS cây process thay vì measureMemory; lần sau muốn đo
  chính xác hơn cần Chrome tracing / `chrome://memory` thay vì
  trông chờ API này.
- Hạn chế: RSS cây process là cận trên (gồm cả decoder/GPU tăng
  thêm, không chỉ frame); nhưng 3 ước lượng độc lập hội tụ quanh
  1,50 MiB nên số này đủ để đặt ngân sách — không claim chính xác
  từng byte.

## 3. Tốc độ decode footage nhiễu (cùng probe)

### 3.1 Số đo

| Đo | Wall / 300 frame | fps | Điều kiện |
|---|---|---|---|
| Ladder GOP [600,899] | 38,888 s | **7,7** | load 1' ~1,95 lúc snapshot |
| Ladder GOP [300,599] | 31,312 s | **9,6** | load 1' ~7,88 |
| Ladder GOP [0,299] | 21,474 s | **14,0** | load 1' ~7,94 |
| RunC GOP [300,599] (nền) | 13,032 s | **23,0** | cuối lượt đo |
| RunC cả 2 GOP (nền) | 22,958 s / 600 fr | **26,1** | cuối lượt đo |
| P5 đợt 32 (để so) | 9,414 s | 31,9 | fixture 31 Mbps, tải đợt 32 |

### 3.2 Đọc số này như thế nào

- Decode cùng 1 fixture, cùng 1 phiên, dao động 7,7 → 26,1 fps —
  phương sai rất lớn, phù hợp với "decode phần mềm bị tranh CPU
  với các Chrome headed + build của luồng song song" (load 1' lên
  tới ~7,9 trên máy 4 vCPU, tức oversubscribe ~2×). Không lấy 1
  điểm nào làm "tốc độ decode của máy" — khoảng mới là sự thật.
- Ngay cả điểm cao nhất đợt này (26,1) vẫn dưới 30. Dưới tải đợt
  này, phát ngược 30 fps footage nhiễu bằng decode phần mềm là
  KHÔNG THỂ, bất kể cửa sổ.
- Present không liên quan: mọi cửa sổ đã decode đủ đều present
  đúng pacing (wall ≈ frames/30, 0 late) — drawImage từ cache rẻ.

### 3.3 Khác biệt fixture so với P5 (ghi rõ, không giấu)

Fixture đợt này encode `veryfast`, ~56 Mbps; fixture P5 ~31 Mbps.
Bitrate cao hơn làm decode nặng hơn, nên so sánh trực tiếp 31,9
của P5 với 7,7–26,1 đợt này là so sánh có 2 biến đổi cùng lúc
(bitrate + tải song song). Kết luận "tải làm mất biên" vẫn đứng
(load ~8 là bằng chứng độc lập), nhưng phần đóng góp của bitrate
chưa tách được — cần A/B cùng fixture ở đợt sau (xem §8).

## 4. Paced reverse có decode-ahead (30 fps, frame tới giờ mà chưa có = late)

Present vẽ `drawImage` thật từ cache; late = frame chưa có trong
cache tại giờ scheduled của nó (không chờ decode — đúng nghĩa
starvation). Lưu ý về số liệu runA/runB: xem §6 (lỗi đo của chính
mình) — ở đây chỉ dùng late-count và wall thật.

| Run | Diễn biến | Kết quả |
|---|---|---|
| A — cửa sổ 90 (O5) | Present 90 fr đã decode (899→810, 3 s) trong lúc decode GOP kế [300,599]; rồi đi tiếp 90 fr vào cửa sổ kế (599→510) | Present 90: **90/90 drawn, 0 late**. Cửa sổ kế: **0/90 drawn, 90/90 late**, frame late đầu = 599. Đúng như lý thuyết: decode GOP kế cần ~9–39 s, không thể xong trong 3 s. Kết luận này KHÔNG phụ thuộc tải — ngay cả ở 31,9 fps của P5 thì 9,4 s > 3 s. Cửa sổ 90 BỊ LOẠI cho footage nhiễu. |
| B — cửa sổ 300, prefetch sâu 1 | Present 300 fr đã decode (899→600, 10 s) trong lúc decode GOP kế [300,599]; rồi đi tiếp 30 fr qua biên (599→570) | Present 300: **300/300 drawn, 0 late**. Qua biên: **0/30 drawn, 30/30 late**, frame late đầu = 599. Decode GOP kế chưa xong tại biên 10 s (ladder cùng phiên: 21–39 s/GOP). |
| C — cửa sổ 300, prefetch sâu 2 (tuần tự) | Chuỗi decode 2 GOP chạy nền từ t=0 trong lúc present 2 cửa sổ (20 s) rồi đi tiếp 30 fr qua biên thứ hai | Cửa sổ 1: 300/300, 0 late. Cửa sổ 2: **262/300 drawn, 38 late** (frame 599→562 — đúng 38 frame đầu cửa sổ, là những frame decode cuối cùng của GOP). Qua biên 2: **0/30 drawn, 30/30 late** (frame 299). Decode GOP2 xong ở 13,03 s, cả 2 GOP xong ở 22,96 s → slack chuỗi = 20 − 22,96 = **−2,96 s**. Peak giữ: 900 frame (khớp thiết kế §1). |

## 5. Quyết định thiết kế (để đợt nối preview dùng)

- **Cửa sổ chuẩn cho footage 1280×720 GOP 300: 300 frame, ahead 2,
  giữ tối đa 900 frame, ngân sách tối thiểu ~1,4 GiB cho cache.**
  Dưới ngân sách đó, module tự hạ ahead (1 GiB → ahead 1, slack
  0,60 s ở 31,9 fps) — caller phải đọc `meetsTarget`/`slackSeconds`
  và báo cho user, không tự nhận "đủ".
- **Cửa sổ này là điều kiện cần, không phải đủ.** Gate nối preview
  phải thêm: (a) hardware decode đo được ≥ 30 fps ổn định, hoặc
  (b) proxy độ phân giải thấp cho chiều ngược (hạ tầng proxy Q8
  đã có — nối vào đây là hướng rẻ nhất), hoặc (c) chấp nhận drop
  frame có hold (đường cũ) khi decode hụt. KHÔNG nối rồi claim
  30 fps ngược footage nhiễu trên máy không GPU.
- **Cấm dùng cửa sổ 90 cho footage nhiễu** (runA chứng minh late
  toàn bộ cửa sổ kế). Cửa sổ 90 chỉ còn hợp lý cho footage phẳng
  (decode ~600 fps như P5) — và khi đó cửa sổ 300 cũng đủ, nên
  thực tế: luôn dùng cửa sổ GOP, không dùng 90 nữa.

## 6. Lỗi đo của chính mình (ghi đủ, không giấu)

- **runA/runB `prefetchWallSec` ở bản chạy đầu là số SAI, đã loại
  khỏi mọi kết luận.** Page đo wall TRƯỚC khi `await` prefetch
  nên con số đó chỉ là thời lượng paced (runA 6,055 s, runB
  11,032 s), không phải wall decode; kéo theo
  `slackVsBoundarySec` của runB (−1,032 s) cũng sai và đã bỏ.
  Wall decode thật dùng trong file này chỉ lấy từ ladder (§3.1)
  và chuỗi runC (marks đo trong chain, §4). Script repo đã sửa:
  đo sau `await` và ghi cả 2 mốc `pacedEndSec` + `decodeDoneSec`
  (xem comment trong file). File JSON kết quả giữ nguyên số bản
  chạy đầu để đối chiếu — ai đọc JSON phải biết 2 trường đó sai.
- **Không snapshot RSS baseline trước decode** (chỉ snapshot ở
  các mốc held/released). Vì vậy ước lượng tuyệt đối "RSS baseline
  là bao nhiêu" không có; bù lại 3 ước lượng theo chênh lệch
  (§2) không cần baseline nên kết luận bộ nhớ vẫn đứng.
- **Decode fps ladder tăng dần 7,7 → 14,0** trong khi load không
  giảm — chưa giải thích được chắc chắn (warm-up Chrome? luồng
  khác xong việc giữa chừng?). Ghi nhận là phương sai chưa quy
  kết, không chọn điểm đẹp nhất làm đại diện.

## 7. Kiểm chứng

- Test đơn vị mới `apps/web/src/lib/reverseDecodeAhead.test.ts`:
  **12/12 pass** (`node --experimental-strip-types`, không cần
  browser): chọn cửa sổ 2 GiB / 1 GiB / budget nhỏ / decode chậm
  hơn phát / snap GOP, plan cửa sổ đầu-cuối file, gopStart,
  selectEvictions (kể cả holdFrames + keptOutsideBudget),
  evictCount, guard prefetch trùng, delegate evict cho cache.
  (2 assertion ban đầu sai do chính test viết sai — holdFrames và
  floor ngân sách — đã sửa test, không sửa module để chiều test.)
- `node --check` cả 2 script probe mới: pass.
- `tsc --noEmit -p apps/web/tsconfig.json` toàn project: **2 lỗi,
  cả 2 đều ở `reverseWebcodecs.ts` dòng 395/398** (TS2322
  Promise<boolean> vs Promise<void>, TS2531 possibly null) — file
  này luồng Q2 đang sửa trong cùng đợt (dài hơn bản Q3 đọc lúc
  đầu), KHÔNG thuộc sở hữu Q3 nên Q3 không đụng vào; parent gộp
  chạy lại tsc khi Q2 chốt. Không có lỗi nào ở file của Q3.
- Probe browser thật: Chrome headed qua pipe CDP, Xvfb :97,
  fixture MP4 thật demux bằng module P5, decode qua
  `ReverseFrameCache` thật, present `drawImage` thật có pacing.
  Kết quả đầy đủ: `benchmarks/results/v34-q3-decode-ahead.json`.
- KHÔNG chạy vite build (dist là tài nguyên chia sẻ, tránh phá
  phép đo luồng khác — như P5); build thuộc bước gộp của parent.

## 8. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/reverseDecodeAhead.ts` (module cửa sổ /
  prefetch / evict).
- Mới: `apps/web/src/lib/reverseDecodeAhead.test.ts` (12/12).
- Mới: `apps/web/scripts/probe-round34-q3-decode-ahead-page.js`
  (trang probe; bản chạy thực tế ở scratch, đã sửa lỗi đo §6).
- Mới: `apps/web/scripts/probe-round34-q3-decode-ahead-pipe.mjs`
  (pipe CDP + RSS cây process + bắt tay stage/ack).
- Mới: `docs/PHASE9_ROUND34_Q3_DECODE_AHEAD_LIMITS.md` (file này).
- Mới: `benchmarks/results/v34-q3-decode-ahead.json` (JSON probe
  đầy đủ, kèm lưu ý §6 về 2 trường sai của bản chạy đầu).
- Sửa: `apps/web/tsconfig.json` (thêm 1 dòng exclude cho test mới,
  theo mẫu các test khác; file này luồng Q4 cũng đang sửa — parent
  gộp cần đối chiếu, không ghi đè).
- Không sửa: `reverseWebcodecs.ts`, `mp4Demux.ts`, `seek.ts`,
  `previewRafHook.ts`, `reversePlayback.ts`, i18n, bridge, mọi
  file luồng khác, paths-loop, build-loop-log. Fixture
  noise-30s.mp4 (210 MB) + module ESM biên dịch CHỈ nằm ở scratch
  `~/workspace/tmp-round34-q3/wc/`, không vào repo.

## 9. Nợ còn lại

1. **Nối module này vào preview** (sau khi Q2 chốt
   `reverseWebcodecs.ts` + có ctts/elst cho footage thật + đo GPU):
   dùng `chooseDecodeAheadWindow` với frameBytes đo thật theo độ
   phân giải (1,50 MiB chỉ đúng cho 1280×720 — footage khác phải
   đo lại, không scale tuyến tính mù).
2. **A/B tách bitrate khỏi tải:** cùng fixture P5 (31 Mbps) đo lại
   decode fps dưới tải đợt 34 để biết bao nhiêu phần chậm là do
   bitrate, bao nhiêu do tranh CPU.
3. **Đo lại khi máy quiet + trên máy có GPU** (hardware decode):
   nếu hardware decode ≥ 60 fps thì cửa sổ 300/ahead 2 dư slack
   lớn và kết luận §0.3 đảo ngược — chưa đo nên chưa claim.
4. **Hướng rẻ nhất nếu software decode vẫn < 30 fps:** phát ngược
   bằng proxy độ phân giải thấp (hạ tầng Q8) thay vì decode gốc;
   hoặc giữ đường hold-frame cũ và báo rõ "footage nhiễu nặng
   không đạt 30 fps ngược trên máy này".
5. **Đo bộ nhớ chính xác hơn:** Chrome tracing thay cho RSS cây
   process; `performance.measureMemory()` không có trong Chrome
   này dù đã đặt COOP/COEP (§2).
6. **Safari / máy thật / dpr > 1 / footage có B-frame:** chưa đo
   (nợ chung từ P5).

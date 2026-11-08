# LIMITS — Phase 9 đợt 66, luồng T5: backport bug n=0 + presented 1080p trong app

Ngày đo: 2026-11-08 (18:43–19:00 +07). VM: 4 vCPU, ~7,9 GB RAM, CPU-only
(SwiftShader), FFmpeg 8.1.2, Chromium headless 158 qua Xvfb + CDP.
Fixture: `long1080.mp4` 20,0 s, 1920×1080, 30 fps, testsrc2 + noise
alls=15, libx264 veryfast crf 23, maxrate 16M, 41,4 MB (tái dùng từ R64).

Nợ được giao: R65 LIMITS §8 mục 4 (S8): (a) bug n=0 trong
`clicktest-64r3-fps-long.mjs` nên backport, (b) presented 1080p trong app.
Cả 2 đều có kết quả thật hoặc bằng chứng âm tính trung thực — không bịa
số nào. FPS máy GPU thật vẫn CHƯA đo được (VM không có GPU — xem §4).

## 0. Kết luận trước (TL;DR)

1. **Bug n=0 ĐÃ SỬA GỐC RỄ + backport:** `__vcutPreviewRaf.samples`
   là ring buffer tối đa 5000 mẫu — harness cũ cắt theo CHỈ SỐ TUYỆT ĐỐI
   `samples.slice(fromIdx)` nên sau ~5000 tick rAF thì `fromIdx` vượt
   độ dài buffer → slice rỗng → `{ n: 0 }` ở MỌI slot sau đó. Đã sửa
   sang cắt theo TIMESTAMP ở cả 3 file mắc bug (`clicktest-64r3-fps-long`,
   `clicktest-61r3-fps-cal`, `bench-preview-fps`) + sửa tài liệu của hook
   (chính nó đang hướng dẫn cách cắt sai). Test hồi quy mới
   `previewRafHook66T5.test.ts` **8/8**: bản cũ tái hiện n=0 sau wrap,
   bản mới trả đúng n; chưa wrap thì hai bản cho cùng kết quả.
2. **Presented 1080p trong app (tải nặng, 3/3 slot hợp lệ, 2/2 pass):**
   presented **mean 18,24 fps (13,25–23,78, std 4,32)**, rep tốt nhất
   **23,78**; draw mean chỉ **2,75** (2,27–3,24) — vòng vẽ gãy trước,
   pipeline media gãy sau (đúng mẫu S8 ở 720p). Đối chứng tab trắng cùng
   cửa sổ: presented 17,88, rVFC 9,54 — rVFC lại đếm thiếu hệ thống.
3. **Presented 1080p LÚC LẶNG: CHƯA ĐO ĐƯỢC.** 2 lần thử đều chết vì
   tải VM vọt lên giữa chừng (lần 1: CDP timeout 60 s ở load1 26;
   lần 2: GATE drawDelta 14 < 20 ở load1 13,4) — harness từ chối ghi
   số rác đúng thiết kế, không có số lặng nào để báo. Đây là nợ mở
   lớn nhất của đợt này (§6.1).
4. **So sánh 720p ↔ 1080p CHƯA CÔNG BẰNG:** 1080p tải nặng (18,24)
   cao hơn 720p tải nặng của S8 (12,37) — nhưng 2 đợt đo ở 2 cửa sổ
   tải khác nhau (thành phần tải khác nhau), KHÔNG được kết luận
   "1080p nhanh hơn 720p". Cần đo cùng cửa sổ mới so sánh được (§6.2).

## 1. Bug n=0 — gốc rễ, cách sửa, bằng chứng

### 1.1 Gốc rễ

`createPreviewRafHook` (`apps/web/src/lib/previewRafHook.ts`) giữ tối đa
`maxSamples` (mặc định 5000) mẫu; khi đầy, mẫu cũ nhất bị `splice` ra:

```ts
samples.push(sample);
if (samples.length > maxSamples) samples.splice(0, samples.length - maxSamples);
```

Các harness cũ lấy mốc đầu slot bằng `samples.length` rồi cắt:

```js
const rafIdx0 = await cdp.evalJs(`window.__vcutPreviewRaf.samples.length`);
const s = h.samples.slice(rafIdx0).filter((x) => x.playing && !x.justWoke);
```

`fromIdx` là chỉ số TUYỆT ĐỐI (đếm từ lúc hook tạo), còn `samples` là
cửa sổ TRƯỢT dài tối đa 5000. Khi tổng tick vượt 5000 (~83 s rAF ở
60 Hz, hoặc lâu hơn khi tick thưa dưới tải), `fromIdx` ≥
`samples.length` → `slice` rỗng → `{ n: 0 }`, `gapP50` undefined ở mọi
slot sau đó. R64 gọi đây là "bug cosmetic" vì draw/tick không ảnh
hưởng — ĐÍNH CHÍNH: nó không chỉ cosmetic, nó xóa toàn bộ thống kê gap
rAF của nửa sau các lần chạy dài (mất bằng chứng gapP50/P95/lostMs),
đúng thứ cần để chẩn đoán vòng preview gãy dưới tải.

Gốc rễ sâu hơn: chính doc comment của `previewRafHook.ts` (§"Cách
harness dùng hook") đang HƯỚNG DẪN cách cắt sai ("đọc
`samples.length` tại mỗi mark rồi cắt mẫu theo chỉ số (mẫu đã tuần tự,
không cắt theo timestamp)"). Mọi harness làm theo doc đều mắc cùng bug.

### 1.2 Cách sửa (đợt 66 T5)

Cắt theo TIMESTAMP — mỗi sample có `t` (tham số rAF `now`, cùng đồng
hồ `performance.now()` với `SAMPLE_FN.wall`); ghi `performance.now()`
ở đầu/cuối slot rồi lọc `x.t >= t0 && x.t <= t1` (kèm
`x.playing && !x.justWoke` khi cần). Cách này đã được S8 chứng minh ở
`measure-65r8-presented-fps.mjs` (n=474 lúc lặng). Giới hạn còn lại:
mẫu trong slot dài vẫn có thể bị đẩy khỏi buffer nếu slot > ~83 s —
giữ slot ≤ 10–20 s (mọi harness hiện tại đều ≤ 10 s).

| File | Thay đổi |
|---|---|
| `apps/web/scripts/clicktest-64r3-fps-long.mjs` | Thêm `RAF_STATS_TIME_FN(t0, t1)`; call site bỏ `rafIdx0`, dùng `RAF_STATS_TIME_FN(a.wall, b.wall)`. `RAF_STATS_FN` cũ giữ lại để test hồi quy đối chiếu, không dùng trong vòng đo nữa. |
| `apps/web/scripts/clicktest-61r3-fps-cal.mjs` | Cùng thay đổi (cùng pattern, cùng bug). |
| `apps/web/scripts/bench-preview-fps.mjs` | Bỏ `rafFrom`; cửa sổ đo là `[ts[0], ts[cuối]]` — mảng `ts` của vòng rAF riêng của bench, cùng đồng hồ với `sample.t`. `ts` chưa đủ mẫu → `{ count: 0, note }`, kiểm tra `ts.length < 10` ở dưới vẫn ném lỗi như cũ. |
| `apps/web/src/lib/previewRafHook.ts` | Sửa doc comment: cấm cắt theo chỉ số tuyệt đối, hướng dẫn cắt theo timestamp + giới hạn slot ≤ 10–20 s. CHỈ sửa comment — không đổi hành vi code sản phẩm. |
| `apps/web/src/lib/previewRafHook66T5.test.ts` | MỚI: test hồi quy 8 case (xem §1.3). |

### 1.3 Test hồi quy — 8/8 pass

`previewRafHook66T5.test.ts` chạy logic cắt của CẢ HAI bản (sao chép
nguyên văn biểu thức lọc từ harness) trên hook THẬT với maxSamples nhỏ
để mô phỏng wrap nhanh:

| # | Case | Kết quả |
|---|---|---|
| 1 | Buffer 50 mẫu, ghi 200 tick → bản cũ (`slice(50)`) | **n=0 (tái hiện bug)** dù buffer còn 50 mẫu đang phát |
| 2 | Cùng buffer → bản mới, cửa sổ 30 tick cuối | n=30, gapP50 16,7 ms |
| 3 | Cửa sổ cắt ngang biên wrap | chỉ đếm 10 mẫu còn trong buffer |
| 4 | Cửa sổ trống hoàn toàn | `{ n: 0 }` hợp lệ (phân biệt với n=0 giả ở case 1) |
| 5 | Chưa wrap: 40 tick, mốc tại tick 10 | hai bản cùng n=30, cùng gapP50 (không đổi hành vi trước wrap) |
| 6 | Quy mô thật: 5000 mẫu, 6000 tick | bản cũ n=0; bản mới n≈600 trong cửa sổ 10 s cuối |
| 7 | `analyzePreviewRafPhase` trên buffer đã wrap | count=50, gapP50 16,7 ms, over100=0 |
| 8 | Mẫu `justWoke` trong cửa sổ | bị loại ở cả hai bản (n=9/10) |

Chạy: esbuild bundle + node → `previewRafHook66T5: 8/8 pass`.

### 1.4 Rà soát các file còn lại — không sót, không sửa thừa

Quét toàn bộ `apps/web/scripts/*.mjs|*.cjs` dùng `__vcutPreviewRaf`:

- `probe-53j5-playhead-drift.mjs`, `probe-54k9-audio-reseek.mjs`,
  `probe-55l6-audio-drift.mjs`: phân tích TOÀN BỘ buffer
  (`hook.samples.filter(...)`, không slice) → KHÔNG mắc bug n=0,
  không sửa. Giới hạn riêng của chúng: chỉ thấy ≤ 5000 mẫu gần nhất
  (wallMs tính từ mẫu đầu/cuối còn trong buffer) — không phải bug n=0.
- `measure-65r8-presented-fps.mjs`: đã cắt theo timestamp từ S8 →
  không sửa logic; chỉ thêm knob `R8_PRES_RES` (xem §2).
- `measure-v20-preview-profile-pipe.mjs`, `pause50F2-preview-loop.mjs`:
  dùng mảng `samples` riêng của chúng, không phải
  `__vcutPreviewRaf` → không liên quan.
- Sau sửa: `grep RAF_STATS_FN(` không còn call site nào gọi bản cũ
  (chỉ còn định nghĩa + comment); `node --check` cả 4 script đều OK.

## 2. Presented 1080p trong app — đo thật

Harness: `measure-65r8-presented-fps.mjs` (S8) + knob mới
`R8_PRES_RES=1080` (mặc định 720 — không đổi hành vi cũ khi không đặt
env; `LONG_FILE`/`LONG_W`/`LONG_H` lấy theo env). Mẫu slot KÉP
(draw + quality + element, cùng 1 evaluate), guard mark `__r8mark`,
RAF stats cắt theo timestamp (đã đúng từ S8).
JSON: `hidden_files/round66-t5/presented-1080p/presented-fps.json`,
log: `hidden_files/round66-t5/presented-1080p-run1.log`.

### 2.1 Lượt 1 — tải nặng (3 rep × 10 s, baseline, không enhance)

GATE warmup: draw 2 → 25 (delta 23, cần ≥20 — SÁT ngưỡng), element
1080p rs=1, ct 6,833, w=1920, buf đầy, hook baseline OK, loadavg lúc
bắt đầu 8,45 (10 luồng đợt 66 chạy song song).

| Rep | draw fps | presented fps | dropped | mediaRate | phRate | gapP50 (n) | load trước→sau |
|---|---|---|---|---|---|---|---|
| 1 | 3,24 | **23,78** (Δtotal 242/10,179 s) | 0 | 1,000x | 0,992x | 283,4 ms (34) | 10,72 → 8,90 |
| 2 | 2,73 | **17,70** (Δtotal 188/10,621 s) | 0 | 1,000x | 0,979x | 383,3 ms (30) | 8,90 → 7,07 |
| 3 | 2,27 | **13,25** (Δtotal 134/10,111 s) | 0 | 1,000x | 0,992x | 433,4 ms (24) | 6,59 → 5,57 |

Tổng: draw mean **2,75** (2,27–3,24, std 0,40); presented mean
**18,24** (13,25–23,78, std 4,32); dropped mean 0; mediaRate mean
1,000x; phRate mean 0,99x. 3/3 slot hợp lệ (mark còn nguyên),
H9 0 lỗi trang → **2/2 pass** (presentedFps không có ngưỡng, như S8).

Đối chứng tab trắng cùng cửa sổ (element VISIBLE 1080p): rVFC
**9,54** fps, presented **17,88** (Δtotal 180/10,066 s), dropped 82
(8,15 fps), mediaRate **0,579x**, load 4,14.

### 2.2 Diễn giải

- **Draw gãy trước, media gãy sau (lặp lại mẫu S8):** draw chỉ 2,75
  trong khi presented 18,24 (tỉ lệ 6,6×) — canvas vẽ lại thưa hơn
  nhiều so với frame element trình chiếu; gapP50 283–433 ms cho thấy
  vòng rAF đói CPU nặng dưới tải. Số người dùng thấy là draw; số clip
  "chạy" là presented.
- **rVFC đếm thiếu hệ thống — xác nhận lần nữa ở 1080p:** đối chứng
  rVFC 9,54 vs presented 17,88 (tỉ lệ 0,53×); trong app không đo rVFC
  nhưng cùng hiệu ứng đã thấy ở 720p (16,02 vs 26,23). Mọi số decode
  chỉ dùng rVFC đều là cận dưới.
- **Dropped trong app = 0 nhưng frame vẫn mất:** presented chỉ
  13–24 fps với mediaRate 1,000x — frame mất qua decoder skip (như S8
  §2.3), không qua droppedVideoFrames. Đối chứng tab trắng VISIBLE thì
  dropped 82 — bộ đếm dropped chỉ có ý nghĩa khi element được
  compositor trình chiếu.
- **mediaRate app 1,000x vs tab trắng 0,579x — vẫn chưa giải thích
  được cơ chế** (cùng hiện tượng S8 §6: app ~1,0x vs tab 0,283x ở
  720p). Nghi ngờ preview `syncMedia` giữ nhịp element khác với video
  tự phát — nợ S8 §7 mục 4 vẫn mở, chưa đo đối chứng có/không
  syncMedia đợt này.
- **Presented GIẢM dần qua 3 rep (23,78 → 17,70 → 13,25) trong khi
  load1 GIẢM (10,72 → 5,57):** load1 không giải thích được xu hướng
  này — có thể do tiến trình nền khác (ffmpeg encode 8K của luồng
  khác bắt đầu giữa chừng), warmup/cache, hoặc vị trí seek/GOP. Chỉ
  ghi nhận, không suy diễn nguyên nhân.
- **lostMs = 0 dù gapP50 tới 433 ms:** không phải bug — `lostMs =
  max(0, gapMs - dtMs)` với trần clamp hiện tại 2000 ms (xem probe
  53j5); gapMax lớn nhất 999,9 ms < 2000 ms nên lost = 0. Dưới trần
  clamp cũ 100 ms thì lost đã khác — đừng so lostMs giữa các đợt
  khi trần clamp đã đổi.
- **RAF stats trả n=24–34 (không còn n=0):** bằng chứng trong app
  rằng cách cắt theo timestamp hoạt động — nhưng lưu ý: tổng tick từ
  lúc mount tới rep 1 chưa tới 5000 (tick thưa ~3/s dưới tải) nên
  đây CHƯA phải bằng chứng wrap ở quy mô thật; bằng chứng wrap là
  test hồi quy §1.3 case 6.

### 2.3 Hai lần thử lúc lặng đều thất bại — không có số lặng

| Lần | Kết quả | Tải lúc lỗi |
|---|---|---|
| 1 (11:47–11:52) | `HARNESS LỖI: CDP.send timeout 60s: Runtime.evaluate` — renderer đói tới mức evaluate không trả về trong 60 s; không ghi được slot nào | load1 26 (ffmpeg encode 8K 8192×4320 crf 1 của luồng khác + tsc + test) — đúng failure mode R64 §8 mục 4 |
| 2 (11:55–11:57) | `HARNESS LỖI: GATE ... drawDelta=14 (cần ≥20)` — harness dừng đúng thiết kế, không ghi số rác. Element vẫn khỏe (ct 6,9, total 40) nhưng draw quá chậm | load1 vọt 0,82 → 13,40 trong ~60 s sau khi bắt đầu |

Bài học (như S8 §5.3): cửa sổ lặng trên VM 10 luồng song song là hiếm
và ngắn — load1 có thể vọt từ <1 lên >13 trong 1 phút. Đợt sau muốn số
lặng 1080p thì đo vào lúc ít luồng chạy, hoặc harness tự chờ lặng như
`measure-65r8-decode-idle.mjs` (load1 < 1,5) trước mỗi slot.

## 3. So sánh 720p (S8) ↔ 1080p (đợt này) — đọc đúng

| | 720p S8 tải nặng | 720p S8 lúc lặng (rep tốt nhất) | 1080p T5 tải nặng | 1080p T5 lúc lặng |
|---|---|---|---|---|
| presented mean | 12,37 (8,42–15,11) | 29,93 (rep4) | **18,24 (13,25–23,78)** | **chưa đo được** |
| draw mean | 1,72 (0,29–2,68) | 47,21 | **2,75 (2,27–3,24)** | — |
| đối chứng tab trắng presented | 8,86 (mediaRate 0,283x) | 30,70 (mediaRate 0,993x) | **17,88 (mediaRate 0,579x)** | — |

1080p tải nặng cao hơn 720p tải nặng — KHÔNG được kết luận "1080p
nhanh hơn 720p": 2 đợt đo ở 2 cửa sổ tải khác nhau (thành phần tải khác
nhau: đợt S8 load5 5,4–8,0 với 9 luồng; đợt này load1 10,7→5,6 với
ffmpeg 8K + tsc + test xen kẽ), và số tuyệt đối dưới tải nặng dao động
5–10× theo cửa sổ (S8 §6). So sánh công bằng cần đo 720p + 1080p cùng
cửa sổ, cùng clip nguồn (cùng testsrc2+noise, chỉ khác độ phân giải) —
nợ §6.2. Con số duy nhất so sánh được ngang hàng: đối chứng tab trắng
cùng phương pháp (rVFC + presented) — 1080p presented 17,88 vs 720p
8,86, nhưng cũng ở 2 cửa sổ tải khác nhau nên vẫn chỉ là tham chiếu.

## 4. FPS máy GPU thật — vẫn chưa đo được (nhắc lại)

VM không có GPU (S8 §4: không nvidia-smi, không /dev/dri, WebGL
SwiftShader; vaapi/cuda FAIL). Harness `measure-65r8-gpu-harness.mjs`
của S8 đã sẵn — chỉ cần chạy trên máy có GPU. Mọi số FPS trong doc này
đều là CPU-only SwiftShader.

## 5. Sự cố trong lúc đo (trung thực, không giấu)

1. **2 lần thử lúc lặng đều chết vì tải** (§2.3) — không có số lặng
   1080p. Đã dừng sau 2 lần thay vì retry vô hạn: VM đang chạy 10
   luồng đợt 66, retry tiếp gần như chắc chắn gặp cùng tải.
2. **GATE lượt 1 sát ngưỡng (drawDelta 23/20):** dưới tải 10,87,
   draw suýt không qua gate. Nếu tải cao hơn chút nữa, lượt 1 cũng
   đã dừng như lần thử lặng thứ 2.
3. **PIPE_EXIT gây hiểu nhầm:** lệnh đo chạy qua `| tee` nên `$?`
   là exit của `tee` (= 0) chứ không phải của script (harness lỗi
   exit 2). Kết quả trong doc này lấy từ log `HARNESS LỖI` + JSON,
   không lấy từ PIPE_EXIT.
4. **Vite build lần đầu của S8 gọi sai config** (đã ghi ở S8 §5.5) —
   đợt này không lặp lại: build chuẩn từ `apps/web` pass ngay.

## 6. Độ tin cậy & giới hạn

- **Tin được:** bug n=0 tái hiện + sửa đúng (test 8/8 trên hook thật,
  quy mô 5000 mẫu); presented 1080p tải nặng 13,25–23,78 (3/3 slot
  hợp lệ, mark nguyên, 0 lỗi trang); đối chứng tab trắng 1080p;
  rVFC đếm thiếu ở 1080p; 2 lần thử lặng thất bại có bằng chứng log.
- **Chưa tin hẳn:** số FPS tuyệt đối dưới tải nặng (dao động lớn theo
  cửa sổ tải — chỉ dùng so sánh tương đối trong cùng cửa sổ, kèm
  loadavg); xu hướng presented giảm qua 3 rep trong khi load1 giảm
  (chưa rõ nguyên nhân).
- **Không đo được đợt này:** presented 1080p lúc lặng; FPS máy GPU
  thật; so sánh 720p↔1080p cùng cửa sổ tải.
- **Không thay đổi:** thang blend piecewise (không đụng); ngưỡng FPS
  enhance 0,75x (không đụng); không sửa preview.tsx/media.ts (chỉ
  sửa comment trong `previewRafHook.ts` + 4 script harness + 1 test
  mới); không sửa PerfOverlay/FPS meter.

## 7. Nợ mở (chuyển đợt sau)

1. Presented 1080p lúc lặng (1 rep xác nhận, như S8 đã làm ở 720p) —
   đo khi VM lặng (load1 < 1,5), hoặc harness tự chờ lặng trước slot.
   Lệnh chạy lại (đã thử 2 lần, xem §2.3):
   `R8_PRES_RES=1080 R8_PRES_REPEATS=1 R8_SCRATCH=.../round66-t5/presented-1080p-quiet node apps/web/scripts/measure-65r8-presented-fps.mjs`
2. So sánh 720p ↔ 1080p cùng cửa sổ tải (chạy 2 độ phân giải liền nhau
   bằng cùng script, cùng `R8_PRES_REPEATS`).
3. mediaRate app ≈ 1,0x vs tab trắng 0,579x: đo đối chứng element tự
   phát vs element dưới syncMedia của preview (nợ S8 §7 mục 4).
4. FPS máy GPU thật: chạy `measure-65r8-gpu-harness.mjs` trên máy có
   GPU (nợ S8 §7 mục 1).
5. `ci-security.yml` vẫn chờ quyền workflows (từ Phase 6).
6. Chạy lại headed đầy đủ `clicktest-64r3-fps-long.mjs` sau backport
   (chưa chạy đợt này vì tải cao + phiên dài; unit test §1.3 đã khóa
   logic cắt, nhưng chưa có lần chạy headed nào của file đã sửa).

## 8. Chạy lại được (harness)

```bash
# Presented 1080p trong app (3 rep × 10 s) + đối chứng tab trắng
cd ~/workspace/repo-1
R8_PRES_RES=1080 R8_PRES_REPEATS=3 \
  R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round66-t5/presented-1080p \
  node apps/web/scripts/measure-65r8-presented-fps.mjs
# Trình đo lại lúc lặng (1 rep) — dùng khi load1 < 1,5
R8_PRES_RES=1080 R8_PRES_REPEATS=1 \
  R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round66-t5/presented-1080p-quiet \
  node apps/web/scripts/measure-65r8-presented-fps.mjs
# Unit test hồi quy bug n=0 (esbuild bundle + node, từ gốc repo)
./node_modules/.bin/esbuild apps/web/src/lib/previewRafHook66T5.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round66-t5/previewRafHook66T5.test.cjs && node /tmp/round66-t5/previewRafHook66T5.test.cjs
# Syntax check các script đã sửa
for f in apps/web/scripts/clicktest-64r3-fps-long.mjs apps/web/scripts/clicktest-61r3-fps-cal.mjs apps/web/scripts/bench-preview-fps.mjs apps/web/scripts/measure-65r8-presented-fps.mjs; do node --check "$f"; done
```

## 9. Kiểm chứng trong đợt

- Unit: `previewRafHook66T5` **8/8** (bug tái hiện ở bản cũ, sửa đúng
  ở bản mới, không đổi hành vi trước wrap).
- `node --check` 4 script đã sửa: **đều OK**.
- `tsc --noEmit` (apps/web) **exit 0**; `vite build` **pass** (18,87 s,
  cảnh báo chunk >500 kB có từ trước).
- Headed presented 1080p: 3/3 slot hợp lệ + đối chứng tab trắng chạy
  được; 2/2 pass (H9 + P), 0 lỗi trang.
- 2 lần thử lúc lặng thất bại có bằng chứng log (CDP timeout load1 26;
  GATE drawDelta 14 < 20 load1 13,4) — không ghi số rác.
- Grep audit: không còn call site nào gọi `RAF_STATS_FN(` bản cũ;
  probe 53j5/54k9/55l6 đã rà soát và không mắc bug (phân tích toàn bộ
  buffer, không slice).

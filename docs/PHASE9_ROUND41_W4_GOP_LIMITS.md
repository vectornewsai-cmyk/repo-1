# Phase 9 đợt 41, luồng W4 — GOP wiring: hiệu chuẩn ngưỡng + đường proxy chưa biết size + bằng chứng heap — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch, KHÔNG nới ngưỡng 128 MiB, KHÔNG bật đường > 128 MiB, KHÔNG
tự stage paths-loop hay ghi build-loop-log (parent gộp).
Đóng nợ đợt 40 §5.4 (V2) cho phần hiệu chuẩn ngưỡng, đường proxy
chưa biết size, kế toán byte lượt tải đầu, và chuẩn bị bằng chứng
heap cho quyết định file lớn — phần quyết mở lại > 128 MiB vẫn CHƯA
làm, cố tình để đợt riêng (xem §6).

## 0. Kết luận ngắn (không vượt số đo)

1. **Ngưỡng 32 MiB GIỮ NGUYÊN sau hiệu chuẩn bằng số bridge thật.**
   File 30,14 MiB (dưới) → wiring off; file 33,54 MiB (trên) →
   wiring on; cả hai đều qua HEAD thật của bridge. Lượt tải T3 đầu
   tốn 101,5–101,7% file (thừa ≈ tiền tố 512 KiB + probe 1 KiB),
   không tiết kiệm byte nào ở lượt đầu; lợi ích chỉ từ cửa sổ thứ
   hai (cache hit = 0 request/0 byte; fetch bù 1 GOP xa = 1,78 MB
   thay cho tải lại 35,16 MB, tiết kiệm 94,9%). Ở 32 MiB, overhead
   1,6% là nhỏ nhưng lượt tải lại toàn file trên bridge loopback
   cũng chỉ ~0,3–0,4 s — hạ ngưỡng xuống (vd 8 MiB, overhead
   6,4%) không được số đo ủng hộ, nên không đổi ngưỡng, không đổi
   test biên V2.
2. **Đường proxy chưa biết size nay kích hoạt được GOP.**
   `discoverSizeBytes` (HEAD → Range `bytes=0-0` lấy tổng từ
   Content-Range → unknown) chạy trước quyết wiring khi controller
   chưa biết size và caller đã bật GOP; probe thành công thì size
   đó được ghi nhận như size đã biết từ đầu, probe hỏng thì rơi về
   full-file cũ, không throw, không thử GOP. Chứng minh cả hai
   nhánh bằng test (15/15) và bằng controller qua bridge thật
   (trên ngưỡng → `gop-range`, dưới ngưỡng → `off` + full-file).
3. **Bằng chứng heap cho đợt quyết file lớn (chỉ chuẩn bị, chưa
   quyết):** GOP fetch trên file 33,54 MiB giữ transient
   ~1,5–1,7× file trong Node (xem §4 — số có nhiễu GC, ghi rõ
   phương pháp và giới hạn). Ngoại suy thô: file 128 MiB → transient
   ~190–215 MiB, cộng ngân sách frame 192 MiB + cache GOP 32 MiB
   thì vượt xa logic ngân sách tổng 320 MiB của controller. Vì vậy
   **trần 128 MiB vẫn khóa**; đợt riêng cần đo heap trên browser
   headed (nơi VideoDecoder/frame mới là chi phí chính) trước khi
   bàn mở lại.
4. **Fragmented đo thật qua bridge → fallback đúng**
   (`demux-moov: track không có sample`). Moov > 16 MiB chỉ chứng
   minh được nhánh bằng ngưỡng override (`maxMoovBytes=1000` →
   `moov-too-large`), KHÔNG có file moov 16 MiB thật. Safari, máy
   thật, footage B-frame, baseline quiet: CHƯA ĐO (xem §5).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopSizeProbe41W4.ts` — `discoverSizeBytes`
  (HEAD → Range 0-0 → unknown; không đọc body; không throw vì lỗi
  mạng/server; chỉ throw TypeError khi url rỗng, như hợp đồng T3).
- `apps/web/src/lib/gopSizeProbe41W4.test.ts` — 15 test (§3).
- `docs/PHASE9_ROUND41_W4_GOP_LIMITS.md` — file này.

### 1.2 Sửa

- `apps/web/src/lib/reverseWebcodecs.ts` — import module probe;
  trường trạng thái probe (`gopSizeProbeSourceValue/Size/Reason`);
  getters `gopSizeProbe`, `gopSizeProbeReason`; nhánh probe trước
  quyết wiring trong `ensureWindowForTime` (chỉ khi `gopEnabled`
  và `knownFileSize === null`; probe thành công →
  `applyKnownFileSize(size)` — vượt trần S4 thì khóa fallback như
  size truyền trước, probe không bypass cổng nào; probe hỏng →
  ghi lý do, KHÔNG đánh dấu `gopAttempted`, đi full-file cũ, lần
  cửa sổ sau còn được probe lại nếu load cũ hỏng mà track vẫn
  chưa có, theo gợi ý V2 §5.2); `dispose()` dọn cả trạng thái
  probe. Không sửa ngưỡng V2, gate U2, module T3, nhánh bytes cũ,
  hay logic decode-ahead/settle-drop.
- `apps/web/tsconfig.json` — chỉ thêm 1 dòng exclude cho test mới
  (tiền lệ V2: test chạy bằng esbuild, không qua tsc project).

### 1.3 Không đụng (ghi rõ)

`gopCache40V2.ts`, `gopRangeFetch39T3.ts`,
`reverseRangeGate38U2.ts`, `proxy.ts` (không cần sửa: probe đọc
size trực tiếp từ URL, không cần bridge trả thêm field),
`preview.tsx`, paths-loop, build-loop-log, mọi file luồng khác
đợt 41. `apps/web/dist/` build lại lúc kiểm chứng không vào batch
theo tiền lệ.

## 2. Kiến trúc probe (đọc kỹ trước khi trích dẫn)

```
ensureWindowForTime(timeSec) — khi !track && !gopAttempted:
  → gopEnabled && knownFileSize === null?
      → discoverSizeBytes(url, gopFetchImpl ?? global fetch)
          → HEAD 2xx + Content-Length hợp lệ → size, nguồn "head"
          → HEAD hỏng/thiếu length → GET Range bytes=0-0:
              206 + Content-Range parse được, total > 0
              → size, nguồn "content-range"
          → cả hai hỏng → size null, nguồn "unknown", lý do ngắn
      → có size → applyKnownFileSize(size) (first-wins; > 128 MiB
        thì khóa fallback S4 ngay, như size truyền trước)
      → không size → ghi lý do probe, KHÔNG đánh dấu gopAttempted,
        rơi xuống load() cũ; cửa sổ sau (load hỏng, track chưa có)
        sẽ probe lại — không phải spam vì load thành công thì track
        đã có và probe không chạy nữa
  → wiring như V2 (32 MiB < size <= 128 MiB) → T3 hoặc full-file cũ
```

Chi phí probe: tối đa 2 request nhẹ (HEAD + Range 1 byte) cho mỗi
controller chưa biết size và đã bật GOP; controller không bật GOP
không probe (test khóa: 0 request vào fake). T3 sau đó vẫn làm
HEAD + probe riêng của nó (không chia sẻ kết quả probe ngoài
knownSize) — tổng request cho controller chưa biết size trên file
trên ngưỡng là 24 (probe HEAD 1 + T3 HEAD 1 + probe/prefix/GOP
206 × 22), 0 GET toàn file (đo thật §3.3). Đây là chi phí chấp
nhận được nhưng ghi rõ để đợt sau khỏi tưởng probe là miễn phí.

## 3. Kiểm chứng + số đo thật (bridge thật, không chỉ fixture Node)

### 3.1 Giàn đo (để người khác lặp lại được)

- Video tạo bằng ffmpeg thật: `testsrc2` 1280×720 30 fps,
  libx264, `-g 30`, `-movflags +faststart`, không audio (xem lưu ý
  §5: overhead audio xen kẽ vẫn chưa đo trong đợt này).
- Bridge thật: chạy code `server/bridge/src/index.js` nguyên vẹn
  trên cổng 8892 với `BRIDGE_WORK_DIR` trỏ thư mục scratch
  `/tmp/round41-w4/bridge-work`, file đo đặt trong `proxies/` và
  phục vụ qua route thật `GET /api/proxy/file/:name` (Express
  `sendFile` — hỗ trợ Range sẵn). Chỉ nới rate-limit bằng biến
  môi trường (`BRIDGE_RATE_GENERAL=5000`) để tránh 429 làm nhiễu
  số đo; KHÔNG sửa code bridge, KHÔNG sửa route nào.
- Mọi số timing dưới đây là loopback trên máy này trong lúc các
  luồng đợt 41 khác có thể đang chạy — KHÔNG phải baseline quiet,
  cấm dùng làm baseline hiệu năng.

### 3.2 Hiệu chuẩn ngưỡng 32 MiB (§1 của task)

| File (qua bridge) | Size thật (HEAD) | Wiring | Full-file GET | T3 lượt đầu |
|---|---|---|---|---|
| `below32.mp4` (17 s) | 29.838.207 B = 28,46 MiB | off (`below-threshold`) | 359 ms | 21 req, 30.356.684 B = 101,74% file |
| `near-below.mp4` (18 s) | 31.602.329 B = 30,14 MiB | off (`below-threshold`) | 444 ms | 21 req, 32.120.446 B = 101,64% file |
| `above32.mp4` (20 s) | 35.164.484 B = 33,54 MiB | on (`gop-range`) | 291 ms | 23 req, 35.681.921 B = 101,47% file |

Chi tiết T3 trên `above32.mp4`: HEAD 1 + probe 1.024 B + prefix
524.288 B + moov riêng 0 B + 20 GOP = 35.156.609 B;
`totalSampleBytes` = `totalGopRangeBytes` (overhead audio = 0 B
vì file không có audio). Trên `near-below.mp4`: 18 GOP,
31.595.134 B GOP, tổng 101,64%. Mẫu số chung: thừa ≈ 0,5 MB
(tiền tố) + 1 KiB (probe) — tức ~1,6% tại 32 MiB, ~6,4% nếu hạ
ngưỡng xuống 8 MiB. Thời gian T3 lượt đầu (271–378 ms) tương đương
full-file GET (291–444 ms): GOP không nhanh hơn ở lượt đầu, chỉ
rẻ hơn từ lượt sau. Kết luận: giữ 32 MiB; file kẹp ngưỡng gần
nhất làm được là 30,14 / 33,54 MiB (±6% quanh ngưỡng — tốc độ
bitrate thực của encoder dao động nên không ép được file đúng
32 MiB ± 1 byte; biên byte chính xác vẫn do test V2 khóa, số
bridge ở đây hiệu chuẩn phần kinh tế, không thay biên byte).

### 3.3 Kế toán byte lượt tải đầu + cửa sổ thứ hai (§3 của task)

- Lượt tải T3 đầu tiên tốn tổng byte ≈ file (101,5–101,7%):
  probe + tiền tố + MỌI GOP. Không claim tiết kiệm ở lượt đầu —
  đúng như V2 đã cảnh báo, nay có số bridge thật.
- Cửa sổ thứ hai (mô phỏng cache V2 trên `above32.mp4`, cửa sổ
  sample 0–29 = GOP 0, 1.643.646 B): cùng cửa sổ lần nữa →
  1/1 GOP hit, **0 request, 0 byte** (đối chiếu tải lại toàn file
  = 35.164.484 B). Cửa sổ xa (sample 300–329 = GOP 10, miss) →
  `fetchSingleGopRange` đúng 1 request 206, 1.782.821 B, tiết kiệm
  94,9% so với tải lại toàn file. Đây là toàn bộ lợi ích GOP:
  từ cửa sổ thứ hai trở đi, hoặc khi fetch bù thay cho tải lại.
- Controller qua bridge thật (chưa biết size từ đầu, GOP bật):
  `above32.mp4` → `ensure=false` (Node thiếu VideoDecoder, như
  V2), `ready=true`, `gopMode=gop-range`, probe
  `{source:"head", size:35164484}`, cache 2 segment, 24 request
  (HEAD 2, 206 × 22, GET toàn file 0). `near-below.mp4` →
  `gopMode=off`, probe `{source:"head", size:31602329}`,
  `fallback=null`, rồi load() cũ tải toàn file qua global fetch
  và parse thành công (`ready=true`) — lưu ý đọc đúng: bộ đếm
  request trong runner này chỉ đếm `gopFetchImpl` (1 HEAD), lần
  GET toàn file của load() đi qua global fetch nên không nằm
  trong bộ đếm đó; không được đọc "GET-full=0" thành "không tải
  file".

### 3.4 Bằng chứng heap cho quyết định file lớn (§4 của task)

Phương pháp: Node `--expose-gc`, tiến trình sạch, 1 file duy
nhất (`above32.mp4`, 33,54 MiB), `process.memoryUsage()`:
GC → baseline → `fetchVideoTrackByGopRange` (mặc định, không
wrapper đếm) → snapshot khi transient còn giữ → thả transient
(chỉ giữ track metadata) → GC → snapshot.

| Thời điểm | heapUsed | arrayBuffers | rss |
|---|---|---|---|
| Baseline (sau GC) | 6,68 MiB | 0,14 MiB | 63,01 MiB |
| Sau T3, transient còn giữ | 8,25 MiB | 55,78 MiB | 142,56 MiB |
| Sau thả transient + GC | 7,19 MiB | 19,16 MiB | 142,32 MiB |

Đọc đúng, không tô hồng:
- Delta arrayBuffers ngay sau T3 (chưa GC sau tải):
  **+55,64 MiB = 1,66× file**. Con số này là cận trên gồm cả rác
  chưa GC (buffer GOP từng vòng lặp, buffer fetch runtime) chứ
  không phải kế toán từng allocation; runner đo gộp đầu đợt cho
  file 30,14 MiB cũng cho +45,56 MiB = 1,51×. Khoảng 1,5–1,7× là
  khoảng quan sát được, không phải hằng số đã chứng minh.
- Sau thả + GC vẫn còn 19,16 MiB arrayBuffers trên baseline
  (chưa giải thích hết — buffer runtime của fetch/undici và slab
  giữ lại là ứng viên, không khẳng định nguyên nhân). Vì vậy số
  này KHÔNG đủ để kết luận chính xác đỉnh heap browser; nó chỉ đủ
  để giữ khóa: ngoại suy thô 128 MiB × 1,5–1,7 ≈ 190–215 MiB
  transient, cộng frame 192 MiB + cache GOP 32 MiB thì vượt logic
  ngân sách tổng 320 MiB của controller. Đợt riêng quyết mở lại
  phải đo trên browser headed (heap snapshot /
  `performance.measureUserAgentSpecificMemory` nếu có, cộng bộ nhớ
  VideoFrame thật) — số Node này là đầu vào cho đợt đó, không
  phải giấy phép mở.
- **Không đổi ngưỡng 128 MiB, không bật đường > 128 MiB.**
  Test khóa: probe ra size vượt trần S4 (override
  `largeFileBytes=10000` cho test) → `gopMode=off`,
  `failed=true`, probe vẫn ghi đúng size.

### 3.5 Test mới + hồi quy

```
./node_modules/.bin/esbuild apps/web/src/lib/gopSizeProbe41W4.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round41-w4/r41w4.test.cjs \
  && node /tmp/round41-w4/r41w4.test.cjs
```

| Nhóm | Kết quả thật |
|---|---|
| Probe thuần (9) | HEAD có length → head, 1 request; HEAD thiếu length → content-range qua Range 0-0; length rác → vẫn lấy từ Content-Range; HEAD 404 nhưng Range 206 hợp lệ → vẫn có size (HEAD không chặn); HEAD throw + Range 200 → unknown, lý do `range-status-200`, không throw; Range 416 → unknown; 206 thiếu Content-Range → unknown; cả hai throw → unknown, không throw; url rỗng → TypeError |
| Controller probe bật (2) | Chưa biết size + HEAD ra size → `gop-range`, probe `{head, size=file}`, HEAD 2 + 206 × 8, 0 GET toàn file; HEAD thiếu length → `gop-range` nguồn `content-range`, 206 × 9 (thêm Range 0-0 của probe) |
| Controller fallback (3) | Probe hỏng → `off`, `fallback=null`, lý do chứa `size-probe`, không thử GOP, không throw; probe ra size dưới ngưỡng → `off` nhưng probe vẫn ghi; probe ra size vượt S4 → `off` + `failed=true` (KHÔNG mở file lớn) |
| Controller tắt (1) | GOP tắt → không probe, fake không được gọi lần nào, `gopSizeProbe=null` |

Hồi quy chạy lại: V2 `gopWiring40V2` **16/16**, T3
`gopRangeFetch39T3` **10/10**, `tsc --noEmit -p
apps/web/tsconfig.json` **0 lỗi**, `vite build` **pass (6,13 s)**,
chỉ cảnh báo chunk > 500 kB cũ. Test mới **15/15** ngay lần chạy
đầu (không sửa test sau khi chạy).

### 3.6 Fragmented + moov (phần đo được của §5 task)

- Fragmented thật qua bridge (`-movflags
  frag_keyframe+empty_moov+default_base_moof`, 24.543.336 B):
  T3 trả `mode=full-file`, lý do `demux-moov: track không có
  sample`, chỉ tốn HEAD + probe + prefix (3 request) rồi dừng —
  fallback an toàn, không throw, không đọc body lớn.
- Moov > 16 MiB: KHÔNG có file thật (tạo moov 16 MiB cần hàng
  triệu sample, không khả thi trong đợt này). Thay bằng chứng
  minh nhánh với ngưỡng override trên file thật:
  `maxMoovBytes=1000` trên `above32.mp4` (moov thật 7.827 B) →
  `moov-too-large: moov 7827 byte vượt trần 1000`, fallback đúng
  nhánh. Ghi rõ đây là chứng minh nhánh bằng override, KHÔNG phải
  đo file moov 16 MiB thật — đợt sau muốn đo thật phải tạo file
  có moov lớn (vd nối metadata/sample cực nhiều) rồi đo lại.

## 4. Số đo tóm tắt (để parent trích, không hard-code lại trong code)

- Ngưỡng giữ nguyên: (32 MiB, 128 MiB]; cache GOP: 32 MiB + 32 GOP
  (không đổi); probe size: HEAD → Range 0-0, tối đa 2 request nhẹ.
- Bridge thật (Express sendFile): HEAD → 200 + `Content-Length`
  + `Accept-Ranges: bytes`; Range 0-0 → 206 + `Content-Range:
  bytes 0-0/<tổng>` — cả hai nhánh probe đều dùng được trên bridge
  hiện tại, nên proxy bridge mới (có `proxySizeBytes`) và proxy
  bridge cũ (không có field) đều có đường tới GOP, chỉ khác số
  request.
- Lượt đầu T3: 101,5–101,7% file (21–23 request); cửa sổ 2 cache
  hit: 0 request/0 byte; fetch bù 1 GOP xa: 1 request, tiết kiệm
  94,9% so với tải lại toàn file (1,78 MB so với 35,16 MB).
- Heap Node (chỉ dẫn, không phải bằng chứng browser): transient
  T3 ≈ 1,5–1,7× file; sau thả + GC vẫn dư ~19 MiB arrayBuffers
  chưa giải thích hết. Đủ để GIỮ khóa 128 MiB, chưa đủ để mở.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA ĐO: Safari, máy thật, baseline quiet.** Mọi số timing
   đều là loopback trên VM này, có thể nhiễm tải từ các luồng đợt
   41 khác; cấm dùng làm baseline quiet hay claim fps. Safari
   (HEAD/Range/fetch behavior) chưa có môi trường đo.
2. **CHƯA ĐO: file moov > 16 MiB thật** (chỉ có chứng minh nhánh
   bằng override, §3.6). **CHƯA ĐO: footage có B-frame** cho đường
   GOP/probe này (file đo là testsrc2 không B-frame nặng, không
   audio — overhead audio xen kẽ trong range GOP vẫn là giới hạn
   kế thừa của T3, chưa đo lại ở đây).
3. **CHƯA ĐO: decode GOP thật trên browser headed** cho đường
   probe mới (test Node chỉ tới bước decode như V2; controller
   qua bridge thật dừng ở `ensure=false` vì thiếu VideoDecoder).
   Cần headed test: proxy chưa biết size → probe → GOP → frame
   ngược hiện thật trên canvas.
4. **Đợt riêng quyết mở lại > 128 MiB (nợ gốc, chưa làm):** cần
   (a) đo heap browser headed trên file 128 MiB+ thật (heap
   snapshot + bộ nhớ VideoFrame, không chỉ arrayBuffers Node);
   (b) chứng minh transient GOP + cache 32 MiB + frame nằm trong
   ngân sách tổng khi không giữ buffer file; (c) chỉ khi đó mới
   bàn đổi trần S4 — luồng này cố tình không chạm trần đó.
5. **Tối ưu chưa làm (không làm lén):** chia sẻ kết quả probe vào
   T3 để khỏi HEAD/probe trùng (hiện probe HEAD + T3 HEAD là 2
   HEAD); đường "chỉ lấy moov + GOP cần thiết" để tiết kiệm ngay
   từ lượt đầu (nợ V2 §5.3) vẫn còn; probe lại mỗi lần cửa sổ khi
   load hỏng liên tục có thể cộng dồn request nhẹ — chưa đặt cap
   số lần probe lại (hiện tại load hỏng đặt `unsupported` nên
   thực tế probe không lặp vô hạn trong cùng controller, nhưng
   controller mới cho cùng URL qua registry thì probe lại từ đầu
   — registry 1 URL = 1 controller nên production không gặp
   trường hợp này trừ khi dispose/tạo lại).
6. **Kế thừa mọi giới hạn của V2/T3:** chỉ avc1 không fragmented,
   moov > 16 MiB → fallback, Safari/Firefox/máy thật chưa đo,
   GOP chỉ bật khi preview bật tường minh (mặc định tắt).

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopSizeProbe41W4.ts` (mới)
- `apps/web/src/lib/gopSizeProbe41W4.test.ts` (mới)
- `apps/web/src/lib/reverseWebcodecs.ts` (sửa: import probe +
  trạng thái/getters probe + nhánh probe trước wiring + dọn ở
  dispose; không đổi ngưỡng, gate, nhánh cũ)
- `apps/web/tsconfig.json` (sửa, chỉ +1 dòng exclude)
- `docs/PHASE9_ROUND41_W4_GOP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `/tmp/round41-w4/` (video đo, bridge
work-dir, bundle test, runner đo `measure.ts`/`heap.ts` + log
`measure.log`) — KHÔNG đưa vào batch. Bridge đo chạy cổng 8891/
8892 bằng biến môi trường, không sửa code bridge.

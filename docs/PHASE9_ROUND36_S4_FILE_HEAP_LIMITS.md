# Phase 9 đợt 36, luồng S4 — Buffer file + heap file lớn — LIMITS

Ngày: 02/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo.
Luồng này đóng nợ §3.4 của `docs/PHASE9_ROUND35_LIMITS.md` (đo heap
thật với file 420MB + cờ bật; chặn đỉnh heap khi tải bằng `File.size`
truyền trước hoặc hướng (a) Range nếu muốn phát ngược file > 128 MiB
bằng WebCodecs). Luồng này KHÔNG ghi paths-loop hay build-loop-log
(parent gộp), KHÔNG sửa code của luồng khác, KHÔNG đụng store.

## 0. Kết luận ngắn (không vượt số đo)

1. **Đã đo heap thật trên file lớn thật:** file noise đợt 34 Q2
   `sparse-gop-noise.mp4`, **419.967.521 byte = 400,5 MiB** (tái dùng
   file đã có, không tạo binary mới, không đưa vào repo). Qua đúng
   `ReversePreviewController` với cờ `__vcutReverseWebcodecs = true`
   (kiểm chứng `resolveReverseEngine() = "webcodecs"`, có
   `VideoDecoder`): xem §2.
2. **Đỉnh heap thoáng qua là CÓ THẬT và đã đo được đúng hình dạng:**
   server không báo `Content-Length` (chunked) → trong lúc tải heap
   JS phẳng 0,5 MiB (body nằm ở tầng network, chỉ thấy qua RSS),
   tới lúc `arrayBuffer()` vật chất hóa thì heap vọt lên **401,0 MiB**
   (≈ kích thước file), controller vứt ngay (`retainedFileBytes = 0`,
   khóa fallback) nhưng heap KHÔNG hạ ngay cả sau 1 lần `gc()` ép
   buộc + 300 ms; ~3 s sau (vài task sau, kèm gc lặp) heap tự về
   **0,5 MiB**. Kết luận: đỉnh này là thật, tự hết trong vài giây,
   KHÔNG phải controller giữ (retained = 0) và KHÔNG phải leak —
   nhưng "thoáng qua" ở đây nghĩa là vài giây ở mức ~400 MiB, đủ
   để làm máy yếu chao đảo nếu trùng lúc decode khác. Đừng viết gọn
   thành "chỉ thoáng qua nên không sao".
3. **Đã làm cổng `File.size` truyền trước (phần (b) đã chọn):**
   controller nhận `knownFileSizeBytes`; vượt ngưỡng 128 MiB thì khóa
   fallback ngay từ constructor, **trước cả HEAD: 0 request, 0 ms**,
   heap phẳng. Preview đã nối: chỉ truyền `item.file.size` khi KHÔNG
   có proxyUrl (đang phát bản gốc) — khi có proxy thì size gốc không
   phải size của URL proxy nên không truyền, các cổng HEAD/GET của R3
   vẫn làm việc. Đây là chặn sớm hơn, KHÔNG phải mở đường WebCodecs
   cho file lớn.
4. **Hướng (a) Range-fetch theo GOP KHÔNG làm ở đợt này** (xem §4):
   rào cản moov-trước + hợp đồng Range vẫn còn nguyên cho nguồn
   http/proxy; mini-check mới chỉ chứng minh blob: URL trả 206 cho
   Range (1 KB mẫu), chưa đủ để claim hỗ trợ file lớn. **File
   > 128 MiB vẫn fallback về đường element cũ trong mọi phase đo.**
5. **Fallback > 128 MiB đã kiểm chứng lại:** cả 3 phase probe đều
   `failed = true`, `largeFileFallback = true`, `frameAt(0.1) = null`
   → `preview.tsx` rơi về nhánh element cũ (nhánh này không sửa,
   chỉ thêm tham số size tùy chọn vào lời gọi; xem §5 mục 3 về giới
   hạn kiểm chứng ở tầng preview).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Sửa

- `apps/web/src/lib/reverseWebcodecs.ts` — toàn bộ sửa của luồng:
  - `ReversePreviewControllerOptions` thêm `knownFileSizeBytes?`
    (kích thước file caller đã biết TRƯỚC khi fetch).
  - Constructor gọi `applyKnownFileSize()` ngay: size hợp lệ
    (> 0, hữu hạn) và vượt `largeFileBytes` → `largeFile = true` +
    `unsupported = true` từ lúc tạo, chưa phát request nào.
  - `applyKnownFileSize(size)` public (cho registry): quy tắc
    "biết trước thắng một lần" — controller đã có known size thì
    lần gọi sau bị bỏ qua, tránh ghi đè size đúng bằng size lạ của
    caller khác cùng URL; trả true khi cổng đã khóa. Không phát
    request. Size không hợp lệ (0 / âm / NaN / vô cực) coi như chưa
    biết, đường cũ chạy bình thường.
  - `getReversePreviewController(url, knownFileSizeBytes?)`:
    controller mới tạo kèm size; controller đã tồn tại thì chỉ ghi
    nhận thêm khi còn chưa biết size (kịp trước lần fetch đầu).
  - `reverseWebcodecsFrameFor(url, timeSec, knownFileSizeBytes?)`:
    truyền size xuống registry.
  - Ghi chú đầu file cập nhật (đợt 36 S4): cổng này, điều kiện
    proxy, và việc hướng (a) vẫn chưa làm.
- `apps/web/src/preview.tsx` — CHỈ 1 lời gọi (điểm nối Q2, dòng
  ~1191): thêm tham số thứ ba
  `item.proxyUrl ? undefined : item.file?.size`. Khi không có
  `item.file` (media mẫu / relink chưa có File) thì tham số là
  `undefined` và đường cũ chạy nguyên vẹn. Không sửa nhánh element,
  không sửa logic draw/hold/skip nào khác.
- `apps/web/tsconfig.json` — chỉ thêm 1 test mới vào exclude (theo
  tiền lệ R3: test dùng import `.ts` cho Node/esbuild).

### 1.2 Mới

- `apps/web/src/lib/reverseFileHeap36S4.test.ts` — 6 test (xem §3).
- `apps/web/scripts/probe-round36-s4-file-heap-pipe.mjs` — probe
  browser đợt này (Chrome thật qua CDP pipe, Xvfb riêng :97, pattern
  theo runner Q2; không sửa harness/probe của luồng khác).
- `benchmarks/results/v36-s4-file-heap.json` — kết quả probe (lần
  chạy cuối; lần chạy đầu chỉ khác ở RSS/ thời gian tải, xem §2.4).
- `docs/PHASE9_ROUND36_S4_FILE_HEAP_LIMITS.md` — file này.

### 1.3 Không đụng (ghi rõ để parent khỏi nghi ngờ)

`mp4Demux.ts` (không viết lại demux), `reversePlayback.ts` (cờ
opt-in giữ nguyên), `reverseDecodeAhead.ts`, `store.ts`,
`media.ts`, `assetStore.ts`, mọi harness/probe `scripts/*` của luồng
khác, paths-loop, build-loop-log. Dist trên đĩa bị build lại để
kiểm chứng (tài nguyên chia sẻ, không stage dist). File noise 420 MB
chỉ được đọc từ `~/workspace/tmp-round34-q2/` (scratch ngoài repo),
không copy vào repo.

## 2. Đo heap thật trên file lớn (probe browser, Chrome thật)

### 2.1 Thiết lập đo (đọc kỹ trước khi dùng số)

- File: `sparse-gop-noise.mp4` của đợt 34 Q2, **419.967.521 byte**
  (400,5 MiB), lớn hơn ngưỡng fallback 128 MiB ~3,1×. Đây là file
  "420MB" mà R3 nhắc tới (401 MiB theo đơn vị MiB của Q2).
- Trình duyệt: Playwright chromium (đường dẫn như Q2) headed qua
  Xvfb :97 riêng, cờ `--enable-precise-memory-info` +
  `--js-flags=--expose-gc` (để gọi `gc()` ép buộc và đọc
  `performance.memory` chính xác hơn).
- Cờ đường WebCodecs: trang probe đặt
  `window.__vcutReverseWebcodecs = true`; đo được
  `isReverseWebcodecsOptedIn() = true`,
  `resolveReverseEngine() = "webcodecs"`, `VideoDecoder` có sẵn.
  Probe lái TRỰC TIẾP `ReversePreviewController` — đúng object mà
  `preview.tsx` gọi qua `reverseWebcodecsFrameFor` khi cờ bật — chứ
  không chạy vòng draw đầy đủ của preview (xem §5 mục 3).
- Đo kép: `performance.memory.usedJSHeapSize` trong trang (mẫu
  50 ms trong lúc tải) + RSS cây tiến trình Chrome từ Node (poll
  100 ms, như Q2). Baseline trước phase: heap 0,7 MiB,
  RSS 1.383.676 KB.
- Server probe có 2 route cùng 1 file: `/noise-head.mp4` (trả
  `Content-Length`) và `/noise-nohead.mp4` (chunked, không
  `Content-Length`, không `Cache-Control` — mô phỏng nguồn proxy lạ
  không báo kích thước). Phase `filegate` dùng route head nhưng
  truyền `knownFileSizeBytes` = kích thước thật (mô phỏng
  `item.file.size` mà preview truyền).

### 2.2 Kết quả theo phase (lần chạy cuối — số dùng để claim)

| Phase | Thời gian | Request mới | failed / fallback | retained | frameAt | Heap JS | RSS delta |
|---|---|---|---|---|---|---|---|
| head (cổng HEAD của R3) | 6 ms | HEAD = 1, GET = 0 | true / true | 0 | null | 0,7 → 0,5 MiB (phẳng) | +7,3 MiB |
| filegate (cổng S4 mới) | 0 ms | **0** | true / true | 0 | null | 0,5 MiB (phẳng) | +7,5 MiB |
| nohead (cổng sau-tải của R3) | 4,5 s | HEAD = 1, GET = 1 | true / true | 0 | null | xem §2.3 | +880,6 MiB |

Cả 3 phase: `knownFileSizeBytes = 419967521` sau khi khóa
(filegate biết từ trước, head/nohead biết từ header hoặc sau tải).

### 2.3 Hình dạng đỉnh heap ở phase nohead (phát hiện chính)

- **Trong lúc tải (78 mẫu / 4,5 s): heap JS tối đa chỉ 0,5 MiB.**
  Body đang tải chưa vào JS heap — nó nằm ở tầng network/buffer
  của trình duyệt (chỉ RSS leo). Ai chỉ nhìn `performance.memory`
  trong lúc tải sẽ kết luận sai là "không có đỉnh".
- **Tại lúc `arrayBuffer()` vật chất hóa:** heap JS vọt lên
  **401,0 MiB** (`heapAfter`, `heapAfterGc` đều 401,0). Controller
  đã vứt ngay (`retainedFileBytes = 0`) nhưng heap KHÔNG hạ sau
  1 lần `gc()` ép buộc + chờ 300 ms trong cùng phase.
- **~3 s sau** (sau phase range-blob, gc lặp 3 lần cách nhau 1 s):
  heap về **0,5 MiB** ở mọi mẫu (`heapSeriesMiB = [0,5 × 4]`,
  `totalJSHeapSize = 1,8 MiB`). Tức đỉnh tự hết trong vài giây —
  phù hợp hành vi V8 hoãn giải phóng backing store của ArrayBuffer
  lớn tới chu kỳ GC sau, không phải controller giữ và không phải
  leak (đã về baseline). Nhưng trong vài giây đó, tiến trình mang
  ~400 MiB thừa: trên máy yếu, nếu trùng lúc decode/present khác
  thì đây là khoảng chao đảo thật, không phải "thoáng qua vô hại".
- RSS ở phase nohead leo tới +880,6 MiB (vượt kích thước file):
  RSS gồm cả renderer + network + GPU và nhiễu tiến trình nên
  KHÔNG dùng làm claim heap — chỉ ghi để thấy tầng network cũng
  phình trong lúc tải. Số heap sạch để claim là JS heap
  (0,5 → 401,0 → 0,5 MiB).

### 2.4 Lần chạy đầu (ghi để khỏi ai hỏi vì sao số lệch)

Lần chạy đầu cho cùng kết luận, chỉ khác 2 số nhiễu: tải nohead
17,4 s (thay vì 4,5 s — tải song song các luồng đợt 36 khác)
và RSS delta +478,8 MiB (thay vì +880,6). Heap JS, trạng thái
fallback, số request của mọi phase giống hệt lần 2. Vì vậy: thời
gian tải và RSS là số nhiễu theo tải hệ thống, KHÔNG claim; heap
JS và số request là số ổn định, dùng để claim.

### 2.5 Mini-check Range trên blob URL (dữ kiện cho §4)

Blob 1.024 byte, fetch kèm `Range: bytes=0-99` → **206, đúng
100 byte**; fetch thường → 200, 1.024 byte. Tức Chrome HONOR Range
trên blob: URL. Đây là dữ kiện ủng hộ hướng (a) cho NGUỒN LOCAL
(blob:) — nhưng chỉ là điều kiện cần, chưa đủ (xem §4).

## 3. Kiểm chứng (test mới + hồi quy)

### 3.1 Test mới — 6/6 pass

```
./node_modules/.bin/esbuild apps/web/src/lib/reverseFileHeap36S4.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r36s4.test.cjs \
  && node /tmp/r36s4.test.cjs
```

| Test | Chứng minh gì |
|---|---|
| Vượt ngưỡng nhỏ | `knownFileSizeBytes` 5000 > ngưỡng test 1024 → khóa từ constructor, `failed`, `largeFileFallback`, HEAD = 0, GET = 0, `arrayBuffer` = 0, `frameAt` null |
| Ngưỡng production | 128 MiB + 1 byte chặn không fetch; đúng 128 MiB KHÔNG chặn (chỉ `>` mới chặn, không chặn nhầm tại biên) |
| Trong ngưỡng | size 100 ≤ 1024 → tải + decode fixture bình thường, cache 2 frame, `retainedFileBytes = 0`, GET = 1 |
| Size không hợp lệ | 0 / −5 / NaN coi như chưa biết → fetch + decode bình thường (không vỡ vì đầu vào lệch) |
| Registry | tạo đầu với 200 MiB → khóa ngay; gọi lại cùng URL với size nhỏ không gỡ khóa (first-wins); `reverseWebcodecsFrameFor` với 300 MiB → null, 0 fetch |
| Size tới muộn | controller đã tải xong (known = kích thước header) thì `applyKnownFileSize(99999)` bị bỏ qua, không vỡ, GET vẫn = 1 |

Fixture MP4 dựng tay + fake decoder/fetch sao chép công thức R3
(12 sample, keyframe 0 và 6); test chạy TUẦN TỰ như R3 (tránh đè
stub global). Test KHÔNG cấp phát file lớn thật: cổng ở ngưỡng
production được chứng minh bằng chính số byte 134.217.729
(128 MiB + 1) mà không cần tải file đó — vì cổng chặn trước fetch.

### 3.2 Hồi quy — vẫn xanh

- `tsc --noEmit -p apps/web/tsconfig.json`: exit 0.
- `npm --prefix apps/web run build` (tsc + vite build): pass, 5,79 s.
- `reverseFileBuffer35R3`: 10/10 (cổng R3 không bị sửa chạm).
- `reversePlayback34Q2`: 4/4 (cờ opt-in + fallback element).
- Probe chạy 2 lần, kết luận giống nhau (xem §2.4).

## 4. Đánh giá hướng (a) Range-fetch theo GOP cho file > 128 MiB

**Verdict: KHÔNG làm ở đợt này; rào cản vẫn đứng nguyên như R3
§1, chỉ bổ sung thêm 1 dữ kiện mới (blob 206).**

1. **Moov trước vẫn là rào cản lớn nhất.** `parseMp4VideoTrack`
   nhận 1 `ArrayBuffer` hoàn chỉnh và không giả định vị trí moov
   (moov-cuối vẫn parse được vì đã có cả file). Fetch theo GOP
   đòi probe đầu file (ftyp + box top-level), rồi nếu moov ở cuối
   thì probe đuôi file với kích thước moov chưa biết (nhiều lượt
   Range thăm dò) — tức một demux hai giai đoạn mới, không phải
   sửa nhỏ. Probe đợt này KHÔNG viết demux đó, không claim đã có.
2. **Hợp đồng Range vẫn chưa có cho mọi nguồn preview.**
   Điểm nối dùng `item.proxyUrl ?? item.url`: proxy bridge qua
   HTTP (hợp đồng Range của bridge không được kiểm chứng ở đây —
   bridge không nằm trong repo này nên không đọc code nó để claim),
   URL tĩnh (tùy server), blob: URL (local). Mini-check §2.5 chỉ
   chứng minh blob: trả 206 — tức hướng (a) KHẢ THI VỀ MẶT KỸ
   THUẬT cho nguồn local, nhưng vẫn cần (1) + kiểm tra 206 thật
   cho từng nguồn http trước khi dùng (Range thất bại âm thầm trả
   200 toàn file sẽ biến "tiết kiệm" thành tải toàn file + code
   phức tạp, đúng cảnh báo của R3).
3. **Lợi ích của (a) so với cổng S4 hiện tại là hẹp:** (a) chỉ hơn
   ở chỗ cho phép phát ngược file > 128 MiB bằng WebCodecs thay vì
   fallback element. Với file ≤ 128 MiB, cổng S4 + cổng R3 đã chặn
   mọi đỉnh heap mà không cần (a). Vì vậy (a) là tính năng mở rộng
   (phát ngược file lớn), không phải bản vá bộ nhớ khẩn cấp nữa —
   và nên làm như một đợt riêng với demux mảnh + kiểm tra Range
   từng nguồn, kèm fallback về tải toàn file khi server không hỗ
   trợ, chứ không làm nửa vời trong đợt này.
4. **Cổng S4 không mạo nhận hỗ trợ file lớn:** file > 128 MiB dù
   biết trước size hay không đều kết thúc ở `failed` +
   `largeFileFallback` + `frameAt` null trong mọi phase đo. Đường
   WebCodecs cho file lớn vẫn ĐÓNG; chỉ khác là với nguồn local
   thì nay đóng trước cả HEAD.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Size tới muộn không hủy được fetch đang bay.** Nếu controller
   đã bắt đầu fetch (chưa biết size) rồi size mới tới thì
   `applyKnownFileSize` bị bỏ qua (first-wins) và body đang tải
   vẫn chạy tới hết — cổng S4 chỉ có tác dụng khi size có TRƯỚC
   lần fetch đầu. Đường production thỏa điều kiện này (preview
   truyền `item.file.size` ở lần gọi `frameAt` đầu tiên, trước khi
   controller nào của URL đó fetch), nhưng hợp đồng này chỉ ghi
   bằng lời, chưa có assert nào khóa nó ở tầng preview.
2. **Chưa đo đỉnh heap cho nguồn local thật qua blob: URL.**
   Probe dùng URL http (mô phỏng `item.file.size` bằng tham số).
   Cổng S4 kiểm tra size trước mọi fetch nên không phụ thuộc scheme
   URL — nhưng phát biểu "blob: cũng 0 request" là suy luận từ code,
   chưa có lần đo blob: với file lớn thật (tạo blob 400 MB trong
   trang probe sẽ tự nó tốn bộ nhớ đo, cần thiết kế riêng).
3. **Fallback về đường element chỉ kiểm chứng ở tầng controller.**
   Probe chứng minh `frameAt` null + `failed` (điều kiện để
   `preview.tsx` rơi về nhánh element — code nhánh đó không sửa),
   và `tsc` + `vite build` xanh. Chưa chạy click-test full-app để
   nhìn thấy frame element vẽ ra cho file > 128 MiB với cờ bật —
   cần luồng sở hữu preview click-test làm nếu muốn claim tới tầng
   vẽ.
4. **RSS là số nhiễu, đừng trích dẫn.** RSS delta nohead lệch
   478,8 → 880,6 MiB giữa 2 lần chạy cùng code (tải song song các
   luồng khác). Chỉ dùng JS heap + số request để claim.
5. **Nợ đứng chưa đo (kế thừa, không thuộc luồng này):** Safari /
   máy thật / dpr > 1 cho đường WebCodecs; hợp đồng Range của
   bridge proxy; demux mảnh cho hướng (a); fps ngược sau sửa
   (R3 §5.5 vẫn mở); `Cache-Control: no-store` có làm heap sau
   vứt hạ nhanh hơn không (chưa thử — server probe không gửi
   header cache nào, Chrome có thể giữ body trong memory cache
   một lúc, nhưng heap đã về 0,5 MiB nên không ảnh hưởng kết luận).

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/reverseWebcodecs.ts` (sửa)
- `apps/web/src/preview.tsx` (sửa, chỉ 1 lời gọi + ghi chú)
- `apps/web/tsconfig.json` (sửa, chỉ thêm 1 exclude)
- `apps/web/src/lib/reverseFileHeap36S4.test.ts` (mới)
- `apps/web/scripts/probe-round36-s4-file-heap-pipe.mjs` (mới)
- `benchmarks/results/v36-s4-file-heap.json` (mới)
- `docs/PHASE9_ROUND36_S4_FILE_HEAP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Fixture noise 419.967.521 byte nằm ngoài repo tại
`~/workspace/tmp-round34-q2/sparse-gop-noise.mp4` — KHÔNG đưa vào
batch.

# Phase 9 đợt 45, luồng A4 — GOP: tail-scan moov cuối file — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch. Trần wiring 128 MiB / trần moov 16 MiB / tiền tố mặc định
512 KiB / mặc định GOP TẮT GIỮ NGUYÊN (quyết §0.3). Không tự stage
paths-loop hay ghi build-loop-log (parent gộp, như tiền lệ Z4).
Đóng nợ đợt 44 §4.5: moov cuối file thật (trailing, mdat khổng lồ)
vẫn fallback — nay có tail-scan riêng (không phải đoán moov ở đuôi
bằng heuristic chuỗi byte như Z4 đã cấm).

## 0. Kết luận ngắn (không vượt số đo)

1. **Tail-scan CHẠY ĐƯỢC, có bằng chứng đầu-cuối.** File trailing
   thật (ffmpeg, không faststart) + pad cuối mdat để tiền tố 4096
   không tới được moov nay đi `gop-range` qua T3: 6 GOP, 60 sample,
   chunk byte-khớp file gốc (Node, server Range thật) và headed qua
   route bridge Express thật (7/7 cổng: mode `gop-range`, 60 sample,
   6 GOP, chunk bytes = sample bytes, 0 GET toàn file trong bước
   T3). Trước A4, cùng file này fallback `moov-unknown` (Z4 §6.2).
2. **Tail-scan không phải đoán.** Ứng viên phải qua 3 cửa cùng lúc
   (§2): kết thúc đúng ở EOF, nằm gọn trong đuôi đã fetch + dưới
   trần moov, payload parse thành cây box con có cả `mvhd` lẫn
   `trak`. Chuỗi "moov" giả trong mdat (kể cả box giả chế để kết
   thúc ở EOF với payload rác) đều bị loại — có test khóa từng cửa.
3. **GIỮ TRẦN 128 MiB — không đề xuất trần mới.** Tail-scan không
   thêm bằng chứng nào cho 3 điều kiện đợt 42: T3 vẫn fetch MỌI GOP
   ngay lượt đầu (transient tuyến tính theo file, Z4 §3.4 vẫn đúng),
   VideoFrame native tách riêng vẫn chưa đo, cửa sổ quiet vẫn chưa
   có (mọi số đợt này đều under-load, các luồng đợt 45 khác đang
   chạy). Tail-scan chỉ cứu thêm một lớp file trong trần hiện có,
   không thay đổi ngân sách bộ nhớ.
4. **Headed qua bridge thật: 7/7 cổng — nhưng là harness tương
   đương, chưa phải production vite :5173.** Production vite :5173
   và bridge :8787 hiện không chạy trong môi trường này nên script
   tự khởi động bridge thật (code nguyên vẹn) + page loopback riêng
   (cùng luật loopback CORS như vite :5173 → bridge :8787, như Z4).
   Click-test trên app thật vẫn là nợ mở (§6.5), như Z4 §6.5.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopTail45A4.ts` — lib thuần tail-scan
  (`findTrailingMoov`, `tailRangeFor`, `DEFAULT_TAIL_SCAN_BYTES`).
- `apps/web/src/lib/gopTail45A4.test.ts` — 18 test (§5).
- `apps/web/scripts/gopTail45A4-headed.mjs` — harness headed qua
  bridge thật (§4).
- `docs/PHASE9_ROUND45_A4_GOP_LIMITS.md` — file này.

### 1.2 Sửa (chỉ 1 file, marker ROUND45-A4)

- `apps/web/src/lib/gopRangeFetch39T3.ts` — thêm option
  `tailScanBytes`, kind request `"tail"`, và nhánh tail-scan ở bước
  4 (chỉ từ nhánh `unknown` mà đường Z4 không áp dụng); cập nhật
  comment đầu module. Không đổi probe 1 KiB, tiền tố mặc định,
  gate, demux, chia GOP, fallback nào khác, và không đổi bất kỳ
  nhánh Z4 nào đã xác định moov (gate chặn / vượt trần / vượt tổng
  vẫn return ngay, không fetch đuôi thừa).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (gate nguyên vẹn — `trailing` vẫn
fallback), `gopSizeProbe41W4.ts`, `gopCache40V2.ts`,
`reverseWebcodecs.ts` (controller dùng T3 với mặc định nên tự hưởng
đường mới khi file vào wiring, không cần sửa wiring),
`server/bridge/src/index.js` (chỉ chạy code thật, không sửa),
`preview.tsx`, `store.ts`, `tsconfig.json` (xem §5.2 về dòng exclude
cần parent thêm khi gộp), mọi file luồng khác đợt 45. Không tự
stage paths-loop hay ghi build-loop-log (parent gộp).

## 2. Thiết kế tail-scan (đọc kỹ trước khi trích dẫn)

### 2.1 Vì sao cần nhìn đuôi file

Tiền tố chỉ chứng minh được những gì nằm trong tiền tố. Với file
trailing thật, mdat khổng lồ đứng trước moov nên tiền tố chỉ thấy
ftyp + mdat cắt dở: `detectMoovPosition` trả `unknown` đúng luật,
và `findTruncatedMoovHeader` trả null đúng luật (header moov không
nằm trong tiền tố). Không có thông tin nào ở đầu file cho biết moov
bắt đầu ở đâu — nên phải fetch đuôi file, rồi chứng minh moov từ
chính đuôi đó. Đây là thiết kế riêng, không phải nới gate.

### 2.2 `findTrailingMoov(tail, fileSize)` — hợp đồng 3 cửa

`tail` phải là đúng N byte cuối file (`tailStart + tail.length ==
fileSize`); đầu vào không nhất quán (tail rỗng, tail dài hơn file,
fileSize không hợp lệ) → "không thấy", không suy diễn.

Với mỗi vị trí có thể là header box (`size` + type `"moov"`), ứng
viên chỉ được chấp nhận khi qua đủ 3 cửa:
1. **Kết thúc đúng ở EOF:** `start + size == fileSize`. Cửa này
   loại moov đầu file (faststart: sau moov còn mdat) và hầu hết
   chuỗi giả trong mdat (size đọc từ 4 byte trước chuỗi giả hiếm
   khi cho đúng EOF).
2. **Nằm gọn trong đuôi + dưới trần:** `start >= tailStart`,
   `size <= maxMoovBytes` (mặc định 16 MiB, cùng trần moov của T3).
   Moov lớn hơn cửa sổ, moov `size == 0` (không giới hạn được
   range), header largesize bị cắt ở đầu cửa sổ đều → không thấy.
   Hỗ trợ largesize (header 16 byte) như Z4.
3. **Payload parse thành cây box con:** đi hết các box con trong
   moov, không thừa/thiếu byte, và phải có cả `mvhd` lẫn `trak`.
   Cửa này loại box giả được chế để cửa 1 lọt qua (payload rác
   không đi thành cây box, hoặc thiếu mvhd/trak). Kiểm tra này chỉ
   chứng minh "đây là một box moov hợp lệ" — demux của T3
   (`parseMp4VideoTrack`) vẫn là cửa cuối: moov parse lỗi →
   fallback như mọi đường moov khác.

Nhiều ứng viên cùng lọt (trường hợp chế tác): chọn ứng viên có
`start` nhỏ nhất (ngoài cùng nhất). Lý do: box moov trailing thật
là box top-level cuối file; ứng viên khác cùng kết thúc ở EOF mà
bắt đầu sau nó thì nằm trong payload của box ngoài — không thể là
box top-level. Giới hạn còn lại, ghi rõ: chuỗi giả trong mdat mà
lọt cả 3 cửa thì về mặt byte đã không phân biệt được với moov thật
nếu không parse toàn bộ mdat — trường hợp này phải chế tác byte
hoàn hảo (payload giả tự nó phải là cây box mvhd+trak hợp lệ bao
quanh moov thật), và demux vẫn là cửa cuối trước khi GOP chạy.

### 2.3 Thứ tự kiểm tra trong T3 (giữ nguyên thứ tự đường cũ)

Khi gate trả fallback VÀ vị trí moov là `unknown` (chỉ trường hợp
này mới xét tail-scan):
1. Đường Z4 trước, không đổi: header moov trong tiền tố, không có
   mdat đứng trước → gate lại với `faststart` → fetch moov (trần,
   tổng file, rồi mới fetch). Nhánh này thất bại vì gate chặn /
   vượt trần / vượt tổng thì return ngay như cũ — không fetch đuôi
   thừa, không đổi lý do hay chuỗi request của test Z4/Y4.
2. Chỉ khi Z4 không áp dụng (không thấy header moov trong tiền tố,
   hoặc header moov đứng sau một box mdat nằm gọn — cả hai đều là
   trailing theo bản chất, Z4 từ chối đúng vì chứng minh faststart
   không còn đúng, nhưng tail-scan có chứng minh riêng của nó) thì
   mới xét tail-scan.
3. Tail-scan cũng cần Range thật + đã biết size: `Accept-Ranges`
   không phải `bytes` hoặc chưa biết size → giữ nguyên fallback
   gate, 0 request đuôi. (Probe 206 ở bước 2 đã chứng minh server
   trả Range, nhưng gate vẫn là cổng — không nới gate cho trailing.)
4. Fetch đuôi bằng `fetchRangeChecked` (kind `"tail"`, kiểm tra 206
   + Content-Range khớp như mọi range khác). Cửa sổ đuôi mặc định
   = trần moov (16 MiB), luôn kẹp về trần moov: cửa sổ lớn hơn moov
   lớn nhất mà ta chịu fetch thì không giúp tìm thêm moov nào chấp
   nhận được. Đuôi fetch lỗi (vd 416) → fallback, lý do giữ phần
   gate cũ rồi nối kết quả tail-scan (để test cũ bắt
   `/moov-unknown/` vẫn xanh — xem §5.1).
5. `findTrailingMoov` không thấy → fallback `gate: moov-unknown;
   tail-scan: <lý do>` (0 GOP). Thấy → cắt đúng box moov ra khỏi
   buffer đuôi (không fetch moov riêng — request `"moov"` = 0 trong
   đường này), demux và fetch từng GOP như cũ.

### 2.4 Cái mới KHÔNG làm (ghi rõ để khỏi tưởng đã xong)

- File trailing NHỎ mà moov nằm gọn trong tiền tố: gate đã kết
  luận `trailing` nên T3 đi nhánh else và fallback `moov-trailing`
  như cũ, 0 request tail. Tail-scan chỉ chạy từ nhánh `unknown`.
  Thay đổi gate `trailing` để dùng luôn moov trong tiền tố là việc
  khác (cần bàn lại hợp đồng gate U2 + test cũ bắt `moov-trailing`),
  không thuộc luồng này — dù về mặt kỹ thuật moov đó đã nằm trong
  tay. Đây là nợ mở có chủ ý, không phải sót.
- Moov sau đó còn box khác (vd free cuối file): moov không kết thúc
  ở EOF → không thấy, giữ fallback.
- Moov trailing lớn hơn trần 16 MiB → `tail-scan-moov-too-large`
  (pure) / fallback ở T3. Trần moov giữ nguyên.
- Moov bị cắt ở đầu cửa sổ đuôi (moov lớn hơn cửa sổ) → không
  thấy, giữ fallback. Cửa sổ mặc định 16 MiB là trần moov, nên
  trường hợp này chỉ xảy ra khi caller thu hẹp `tailScanBytes`
  (test) hoặc moov vượt trần.
- T3 streaming, VideoFrame native tách riêng, cửa sổ quiet: vẫn
  chưa có — đó là lý do giữ trần 128 MiB (§0.3).

## 3. Đo headed qua route bridge Express thật (7/7 cổng)

### 3.1 Giàn đo

Harness `gopTail45A4-headed.mjs` (fixture mặc định
`~/scratch-round45-a4/trailing-a4.mp4`, công thức: ffmpeg testsrc2
320×240 30 fps 2 s, `-g 10`, KHÔNG faststart, rồi pad 200.000 byte
0 vào cuối payload mdat — moov dịch theo pad, sample không dịch vì
pad nằm sau mọi sample; tiền tố 4096 khẳng định không thấy moov):
- Bridge THẬT nguyên vẹn `server/bridge/src/index.js` trên cổng
  8955, `BRIDGE_WORK_DIR=~/scratch-round45-a4/bridge-work-45a4`,
  `BRIDGE_RATE_GENERAL=5000`. Fixture đặt sẵn vào `<work>/proxies/`
  qua route thật `GET /api/proxy/file/:name`.
- Page/bundle serve từ server harness riêng trên loopback cổng 8932
  (origin khác port với bridge — đúng cấu hình cross-origin của
  web UI thật vite :5173 → bridge :8787, cùng luật loopback CORS).
- Page gọi TRỰC TIẾP `fetchVideoTrackByGopRange` với `prefixBytes:
  4096` (override test-only, như test Node): đây là cách duy nhất
  để fixture nhỏ tái hiện "mdat khổng lồ trước moov" mà không cần
  file 32+ MiB. Controller wiring (32, 128] MiB KHÔNG được test ở
  đây — controller dùng T3 với mặc định nên tự hưởng đường mới khi
  file vào wiring, nhưng đó là suy luận từ code, không phải bằng
  chứng headed của luồng này.
- Kế toán phía BROWSER bằng CDP Network (như Z4). Chromium headed
  thật, Xvfb, `--disable-gpu`.

### 3.2 Số đo thật

| Đo (qua bridge thật) | Số thật |
|---|---|
| Fixture | raw ffmpeg 92.790 byte → inflated **292.790 byte**, moov start 291.311, tiền tố 4096 không thấy moov; ffprobe video `nb_frames=60` |
| Node kiểm tra bridge | HEAD → 200 + `Content-Length: 292790` + `Accept-Ranges: bytes`; Range 0-0 → 206 + `Content-Range: bytes 0-0/292790` |
| CORS từ page: HEAD + Range 0-0 | HEAD 200 đọc được `Accept-Ranges: bytes`; Range 0-0 206 đọc được `Content-Range: bytes 0-0/292790` từ JS |
| T3 trong page | mode **`gop-range`** (trước A4: fallback), sampleCount **60** (= ffprobe nb_frames), gopCount **6** |
| T3 trong page: chunk | chunk bytes tổng **91.263** = sample bytes **91.263** |
| T3 trong page: request | kinds `head,probe,prefix,tail,gop×6`; CDP bước T3: **10 request, 0 GET toàn file** (GET không có header Range) |
| Tail range trong page | `[[0,292789]]` — xem lưu ý trung thực dưới đây |

Lưu ý kế toán (trung thực, không giấu): tail range là 0–292789
(về mặt byte phủ cả file) vì fixture 292.790 byte nhỏ hơn cửa sổ
đuôi mặc định 16 MiB — nhưng đó vẫn là request **Range 206**, không
phải GET toàn file (server trả 206 + Content-Range khớp, CDP ghi
nhận có header Range). Với file trong wiring (32, 128] MiB, tail
chỉ là 16 MiB cuối, nhỏ hơn nhiều so với tải toàn file khi fallback.
Với file nhỏ hơn cửa sổ, tail-scan không tiết kiệm byte so với tải
toàn file — nhưng file nhỏ cũng không vào wiring GOP (dưới 32 MiB),
nên đây không phải đường production cho file nhỏ; headed này chứng
minh chức năng qua bridge thật, không claim tiết kiệm byte cho
file nhỏ.

## 4. Kiểm chứng + hồi quy

```
# Test mới A4 (esbuild bundle, định dạng esm — theo task luồng)
./node_modules/.bin/esbuild apps/web/src/lib/gopTail45A4.test.ts \
  --bundle --platform=node --format=esm --outfile=/tmp/r45a4.test.mjs \
  && node /tmp/r45a4.test.mjs
# Hồi quy (esbuild bundle, format cjs như các file đó)
./node_modules/.bin/esbuild apps/web/src/lib/<tên>.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r45a4-reg-<tên>.cjs \
  && node /tmp/r45a4-reg-<tên>.cjs
```

| Nhóm | Kết quả thật |
|---|---|
| A4 mới `gopTail45A4` | **18/18** (sau khi sửa 2 lỗi test của chính A4, xem §5.1) |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** (kể cả guard "mdat khổng lồ → moov-unknown": nay có thêm 1 request tail 416 trong log nhưng lý do vẫn chứa moov-unknown, 0 moov/GOP) |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** (chuỗi request moov-lớn giữ nguyên `head,probe,prefix,moov` — nhánh Z4 return trước tail-scan) |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Hồi quy Y6 `reverseCompat43Y6` | **11/11** |
| Headed bridge qua route thật | **7/7** cổng (§3.2) |
| `tsc --noEmit -p apps/web/tsconfig.json` | Lib mới + T3 sửa: **0 lỗi**. Chỉ còn 3 lỗi TS5097 ở chính file test mới (import `.ts` — cùng lý do mọi test file khác được exclude; xem §5.2) |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass (5,67 s)**, chỉ cảnh báo chunk > 500 kB cũ |

### 5.1 Lỗi gặp trong lúc làm (ghi để khỏi vấp lại)

- Lần chạy đầu test A4: 16/18 — cả hai đều là lỗi test, không phải
  lỗi production: (a) fixture ffmpeg trailing có thêm box `free`
  sau ftyp (ftyp, free, mdat, moov) nên assertion danh sách box
  chính xác sai — sửa thành khóa thứ tự mdat trước moov; (b) test
  moov-giả dùng file nhỏ nên gate kết luận `trailing` trước khi
  tới tail-scan — sửa thành mdat payload 200.000 byte để tiền tố
  4096 cắt dở trong mdat (moovPosition unknown) mới đúng là đường
  tail-scan. Bài học: test đường tail-scan phải đảm bảo tiền tố
  không thấy moov, nếu không test đang khóa nhầm nhánh gate.
- Lỗi TS7022 ban đầu ở biến `expect` trong test (tên biến trùng
  với suy luận kiểu của tsc trong vòng lặp) — sửa bằng annotation
  tường minh `: Uint8Array`. Không liên quan tới production.

### 5.2 Dòng exclude tsconfig cần parent thêm khi gộp

Luồng này bị cấm sửa `tsconfig.json` (theo task), nên file test
mới chưa có trong exclude và `tsc` vẫn báo 3 lỗi TS5097 cho nó
(import đường dẫn `.ts` — đúng mẫu của mọi test file khác, vd Z4
cũng vậy khi chưa exclude). Parent khi gộp thêm đúng 1 dòng vào
exclude của `apps/web/tsconfig.json`:
`"src/lib/gopTail45A4.test.ts"` — sau đó `tsc` sạch như các test
khác. Lib production `gopTail45A4.ts` và `gopRangeFetch39T3.ts`
đã sạch tsc ngay cả khi chưa exclude.

## 6. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA MỞ: trần 128 MiB giữ nguyên.** Tail-scan không đổi luật
   tuyến tính của T3 (fetch mọi GOP lượt đầu), không đo VideoFrame
   native tách riêng, không có cửa sổ quiet. Muốn bàn lại vẫn cần
   đủ 3 điều kiện đợt 42 (T3 streaming + đo native tách riêng +
   lặp ở cửa sổ quiet). Không có trần mới nào được đề xuất từ đợt
   này — quyết mặc định "giữ nguyên" của task được giữ.
2. **CHƯA LÀM: file trailing nhỏ (moov nằm gọn trong tiền tố).**
   Vẫn fallback `moov-trailing`, 0 request tail — có chủ ý (§2.4).
   Muốn cứu lớp này cần bàn lại hợp đồng gate U2, không phải thêm
   tail-scan.
3. **CHƯA LÀM: moov không phải box cuối cùng** (vd free sau moov),
   moov trailing > 16 MiB, file fragmented (moof/mvex), nhiều
   track video — tất cả vẫn fallback an toàn.
4. **CHƯA ĐO: GOP qua bridge ở production thật (vite :5173 →
   bridge :8787)** — harness đo bridge :8955 từ origin harness
   :8932, cùng luật loopback CORS; cần click-test trên app thật để
   khẳng định lần cuối, dù luật CORS là như nhau. Đây cũng là nợ
   Z4 §6.5 chưa đóng.
5. **CHƯA ĐO: controller wiring đầu-cuối cho file trailing trong
   (32, 128] MiB** — headed A4 gọi T3 trực tiếp (prefixBytes 4096
   test-only); controller dùng T3 với mặc định nên suy luận là sẽ
   hưởng đường mới, nhưng chưa có bằng chứng headed qua controller
   cho file trailing lớn. Cần fixture trailing ~37+ MiB + controller
   headed như Z4 để đóng.
6. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
   quiet / fps.** Toàn bộ headed ở đây là Chromium Linux + Xvfb +
   render phần mềm, under-load.
7. **Harness phụ thuộc fixture ngoài repo:** fixture headed chỉ nằm
   ở `~/scratch-round45-a4/` (mp4 + bundle/page/profile Chrome +
   bridge work-dir — KHÔNG đưa vào batch); muốn chạy lại harness
   thì script tự tạo fixture bằng ffmpeg, không cần file sẵn. Test
   Node dùng fixture trong os.tmpdir(), cũng không vào repo.

## 7. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopTail45A4.ts` (mới, lib thuần tail-scan)
- `apps/web/src/lib/gopTail45A4.test.ts` (mới, 18 test)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: + option
  `tailScanBytes` / kind `"tail"` / nhánh tail-scan bước 4 + comment
  module; marker ROUND45-A4)
- `apps/web/scripts/gopTail45A4-headed.mjs` (mới, harness headed
  qua bridge thật)
- `docs/PHASE9_ROUND45_A4_GOP_LIMITS.md` (mới, file này)

Cộng thêm khi gộp (parent làm, luồng này không được sửa):
- `apps/web/tsconfig.json` (+1 dòng exclude
  `src/lib/gopTail45A4.test.ts`, xem §5.2).

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round45-a4/` (fixture headed,
bundle/page/profile Chrome, bridge work-dir — KHÔNG đưa vào batch).

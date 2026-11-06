# Phase 9 đợt 46, luồng B4 — GOP trailing/moov — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch. Trần wiring 128 MiB / trần moov 16 MiB / tiền tố mặc định
512 KiB / mặc định GOP TẮT GIỮ NGUYÊN. Không tự stage paths-loop
hay ghi build-loop-log (parent gộp, như tiền lệ A4).
Đóng nợ A4 §6: (a) moov không phải box cuối cùng — cứu được lớp
free/skip/wide; (b) moov trailing > 16 MiB — giữ trần, có test khóa;
(c) file fragmented — khảo sát xong, kết luận KHÔNG hỗ trợ, fallback
an toàn; (d) hợp đồng gate U2 cho file trailing nhỏ — bàn lại xong,
quyết GIỮ NGUYÊN, có test khóa + số đo; (e) headed qua vite :5173 →
bridge :8787 thật + controller wiring cho file trailing trong
(32, 128] MiB — ĐÃ ĐO, 11/11 cổng (A4 chỉ đo được harness origin
riêng + T3 trực tiếp, chưa qua controller wiring).

## 0. Kết luận ngắn (không vượt số đo)

1. **Moov + hậu tố free/skip/wide nay ra gop-range.** Tail-scan mở
   rộng có kiểm chứng (không nới 3 cửa A4): moov vẫn phải parse
   thành cây box có mvhd+trak và dưới trần, cộng thêm cửa hậu tố —
   chuỗi box sau moov phải toàn `free`/`skip`/`wide`, parse sạch
   tới đúng EOF, nằm gọn trong đuôi đã fetch. Hậu tố khác (`udta`,
   `mdat`, `moof`, chuỗi vỡ) vẫn fallback.
2. **GIỮ trần moov 16 MiB và GIỮ hợp đồng gate U2.** Cả hai quyết
   giữ đều có bằng chứng đo thật, không phải "chưa làm nên giữ":
   moov > 16 MiB tương đương ~4,2 triệu sample (≈ 38,8 giờ ở
   30 fps nếu chỉ tính stsz) — ngoài mọi file thực tế mà đường GOP
   phục vụ; file trailing nhỏ thì đường GOP chỉ bớt được 1,65%
   so với tải toàn file (đo thật §4) và wiring production vốn đã
   off dưới 32 MiB nên đổi gate không cứu được đường production
   nào, chỉ phá test khóa của U2/V2.
3. **Fragmented KHÔNG hỗ trợ, fallback an toàn có bằng chứng.**
   File fragmented thật (ffmpeg `empty_moov` + `moof`) đi tới demux
   rồi fallback `demux-moov: track không có sample`, 0 GOP — vì
   sample nằm trong `moof`/`trun`, không nằm trong sample table của
   moov nên demux hiện tại không thể dựng range GOP. Hỗ trợ thật
   cần parser moof mới, không phải nới gate.
4. **Headed qua production thật: 11/11 cổng.** Vite dev :5173 thật
   + bridge :8787 thật (cổng mặc định), file trailing 37 MiB qua
   controller wiring: `gopMode=gop-range`, decode cửa sổ thật
   thành công (`ensureWindowForTime(0)=true`, `cacheSize=1`),
   phase controller 10 request / 0 GET toàn file, tail đúng 16 MiB
   cuối (`22020096–38797311`), T3 trực tiếp 60 sample / 6 GOP /
   chunk byte-khớp. Lưu ý trung thực: file là pad-inflated như A4
   (mdat phình bằng 0, sample thật) — xem §2.3; và harness bật GOP
   tường minh như preview bật qua registry, vì mặc định production
   vẫn TẮT (không đổi mặc định).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopTail46B4.test.ts` — 13 test (§6).
- `apps/web/scripts/gopHeaded46B4.mjs` — harness headed qua vite
  :5173 + bridge :8787 thật (§2).
- `docs/PHASE9_ROUND46_B4_GOP_LIMITS.md` — file này.

### 1.2 Sửa (marker ROUND46-B4)

- `apps/web/src/lib/gopTail45A4.ts` — thêm `trailingSuffixValid`
  và mở rộng cửa 1 trong `findTrailingMoov` (moov + hậu tố hợp lệ);
  cập nhật comment module. Không đổi 3 cửa gốc, trần, hay thứ tự
  chọn ứng viên (vẫn start nhỏ nhất).
- `apps/web/src/lib/gopRangeFetch39T3.ts` — CHỈ comment đầu module
  (ghi nhận suffix B4 + quyết giữ gate U2); không đổi code fetch,
  gate, demux, chia GOP, fallback nào.
- `apps/web/tsconfig.json` — +1 dòng exclude
  `src/lib/gopTail46B4.test.ts` (cùng mẫu A4; task B4 cho phép, khác
  với task A4 cấm sửa file này).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (gate nguyên vẹn — quyết giữ §4),
`gopSizeProbe41W4.ts`, `gopCache40V2.ts`, `reverseWebcodecs.ts`
(controller nguyên vẹn — headed dùng đúng wiring sẵn có),
`server/bridge/src/index.js` (chỉ chạy code thật, không sửa),
`preview.tsx`, `store.ts`, mọi file luồng khác đợt 46. Không tự
stage paths-loop hay ghi build-loop-log (parent gộp).

## 2. Headed qua vite :5173 → bridge :8787 thật + controller wiring

### 2.1 Giàn đo (khác A4 ở 2 điểm quyết định)

Harness `gopHeaded46B4.mjs`:
- Bridge THẬT nguyên vẹn trên cổng **8787** (mặc định production,
  không phải cổng harness riêng 8955 như A4), work-dir trong
  scratch, `BRIDGE_RATE_GENERAL=5000`.
- Vite dev THẬT của `apps/web` trên cổng **5173**
  (`vite --host 127.0.0.1 --port 5173 --strictPort`). Page + bundle
  test được đặt TẠM vào `apps/web/public/` trong lúc chạy (vite
  serve `public/` theo từng request, không cần restart) và XÓA
  SẠCH trong `finally` — đã kiểm tra sau chạy: không còn file tạm
  trong `public/`. Nếu cổng 5173/8787 đã có server khác, harness in
  `NOT-MEASURED` và thoát mã 2, không chiếm cổng người dùng.
- Page gọi controller THẬT (`ReversePreviewController`, GOP bật
  tường minh + size đã biết — đúng điều kiện wiring production;
  xem lưu ý §2.3 về mặc định tắt) rồi gọi T3 trực tiếp ở phase
  riêng để lấy kinds/sample/GOP (controller không expose log
  request của T3). Kế toán CDP Network tách 2 phase bằng mốc.
- Fixture: ffmpeg testsrc2 320×240 30 fps 2 s, `-g 10`, KHÔNG
  faststart, pad mdat tới đúng **37 MiB** (xem §2.3).

### 2.2 Số đo thật (11/11 cổng)

| Đo (qua vite :5173 → bridge :8787 thật) | Số thật |
|---|---|
| Fixture | raw ffmpeg 92.790 byte → inflated **38.797.312 byte** (37 MiB), moov start 38.795.833, tiền tố 512 KiB mặc định không thấy moov; trong (32, 128] MiB = true; ffprobe video `nb_frames=60` |
| Bridge trực tiếp | HEAD → 200 + `Content-Length: 38797312` + `Accept-Ranges: bytes`; Range 0-0 → 206 + `Content-Range: bytes 0-0/38797312` |
| Page origin | `http://127.0.0.1:5173` (vite thật, không phải harness server riêng) |
| CORS từ page | HEAD 200 đọc được `Accept-Ranges: bytes`; Range 0-0 206 đọc được `Content-Range: bytes 0-0/38797312` từ JS |
| Controller phase | `gopMode=gop-range`, `ready=true`, `fallbackReason=null`; `ensureWindowForTime(0)=true`, `cacheSize=1`, `retained=15151` (decode thật bằng VideoDecoder của Chrome, không chỉ demux) |
| Controller phase: request (CDP) | **10 request, 0 GET toàn file**: HEAD, probe `0-1023`, prefix `0-524287`, tail `22020096-38797311` (đúng 16 MiB cuối), GOP×6 (`48-15198`, `15199-30560`, `30561-45839`, `45840-60174`, `60175-75719`, `75720-91310`) |
| T3 trực tiếp (phase riêng) | mode `gop-range`, sampleCount **60** (= ffprobe nb_frames), gopCount **6**, chunk bytes tổng **91.263** = sample bytes **91.263** |
| T3 trực tiếp: request | kinds `head,probe,prefix,tail,gop×6`; CDP phase T3: 10 request, 0 GET toàn file; tail ranges `[[22020096,38797311]]` |

Lưu ý kế toán (trung thực, không giấu):
- Ô status của request HEAD trong bảng CDP phase controller hiển
  thị 404, trong khi cùng route đo trực tiếp bằng fetch (cổng
  bridge-head) và từ page (cổng page-cors) đều cho HEAD 200.
  Harness ghép `responseReceived` theo entry null gần nhất nên ô
  status đó không đáng tin; các cổng dùng phân loại method/Range
  (không dùng status của HEAD) và đã cross-check bằng 2 cổng HEAD
  200 độc lập. Không dùng số 404 này để kết luận gì về bridge.
- Không như A4 (tail range phủ cả file nhỏ), ở đây tail là đúng
  16 MiB cuối của file 37 MiB — tiết kiệm byte so với tải toàn
  file là có thật ở cỡ wiring (tail + prefix + GOP ≈ 16,5 MiB
  request, trong đó GOP chỉ 91 KiB; phần lớn là tail 16 MiB —
  vẫn nhỏ hơn 37 MiB toàn file, nhưng tail là chi phí cố định
  của đường này, không phải chi phí theo GOP).

### 2.3 Hai giới hạn trung thực của số headed này

- **Fixture pad-inflated, như A4.** Pad 0 nằm cuối payload mdat,
  sau mọi sample nên sample table và byte sample không đổi; moov
  dịch theo pad. Điều này tái hiện đúng "mdat khổng lồ trước moov"
  ở cỡ wiring mà không cần encode 37 MiB video thật. Một file
  37 MiB encode thật sẽ cho cùng kết luận wiring (gate/wiring chỉ
  nhìn size + vị trí moov + Range), nhưng chưa đo ở đây — ghi rõ
  để khỏi tưởng fixture là video 37 MiB thật.
- **GOP được bật tường minh trong harness.** Mặc định production
  của controller vẫn TẮT (V2 giữ nguyên, B4 không đổi). Headed này
  chứng minh đường wiring + T3 + tail-scan chạy thật khi preview
  bật GOP qua registry (đúng cách production dùng), không chứng
  minh app UI mặc định bật GOP — đó là quyết định sản phẩm riêng,
  không thuộc luồng này.

## 3. Kết quả xử lý có căn cứ cho 3 trường hợp nợ A4

### 3.1 (a) Moov không phải box cuối cùng — SỬA CODE, có test

Luật mới trong `trailingSuffixValid` (B4): sau moov, chuỗi box
phải toàn `free`/`skip`/`wide`, mỗi box header đủ + size nằm gọn
trong phần còn lại, chuỗi kết thúc đúng ở EOF, ít nhất 1 box;
`size == 0` chỉ hợp lệ khi là box cuối (nuốt đúng phần còn lại
theo spec). Vì sao allowlist hẹp này là đủ an toàn:
- `free`/`skip`/`wide` không mang sample, không mang metadata cần
  hiểu — bỏ qua chúng không đổi sample table mà demux dựng từ
  moov. Demux của T3 vẫn là cửa cuối (moov parse lỗi → fallback).
- Chuỗi phải parse sạch tới EOF: chuỗi giả trong mdat muốn lọt
  phải tự chế cả moov (mvhd+trak hợp lệ) lẫn chuỗi hậu tố hợp lệ
  — cùng mức chế tác như giới hạn A4 đã ghi, và demux vẫn chặn.
- Các trường hợp vẫn fallback (có test khóa từng cái): hậu tố
  `udta` (metadata cần hiểu riêng — nợ §7.1), hậu tố `mdat`/
  `moof`, free khai size vượt phần còn lại, moov faststart sau đó
  là mdat (không phải hậu tố). Hậu tố nằm ngoài cửa sổ đuôi
  (vd free trailer > 16 MiB, hoặc moov bắt đầu trước tailStart)
  cũng không thấy — giới hạn của cửa sổ, ghi ở §7.2.
- Test T3: trailing thật + free 64 byte sau moov, tiền tố 4096 →
  gop-range, 6 GOP, 60 sample, chunk byte-khớp file gốc, tail 1,
  moov 0, GOP 6, 0 GET toàn file.

### 3.2 (b) Moov trailing > 16 MiB — GIỮ TRẦN, có test khóa

Quyết giữ, với 2 bằng chứng:
- **Số học sample table:** stsz tốn 4 byte/sample (chưa kể
  stts/stsc/stco) nên riêng 16 MiB đã tương đương
  16.777.216 / 4 = 4.194.304 sample ≈ 38,8 giờ video ở 30 fps.
  Moov vượt trần vì sample table thật thì file phải dài hàng chục
  giờ; moov vượt trần vì metadata phình (udta/meta lớn) thì demux
  vẫn phải giữ cả moov trong RAM cùng lúc với GOP fetch — nới trần
  là tăng ngân sách bộ nhớ transient mà không có số đo nào trong
  đợt này ủng hộ (mọi số đều under-load, 3 điều kiện đợt 42 cho
  trần 128 MiB vẫn chưa đủ — xem A4 §0.3, B4 không thêm bằng chứng
  nào cho chúng).
- **Fallback an toàn, có test khóa 2 tầng:** tầng thuần — moov
  17.825.864 byte (free 17 MiB trong moov) + tail toàn file →
  `tail-scan-moov-too-large`; tầng T3 — cùng moov đó sau mdat
  200.000 byte, tiền tố 4096 → full-file, lý do chứa `tail-scan`,
  0 GOP, 0 moov (file 18.025.896 byte; tail-scan không thấy header
  vì moov bắt đầu trước cửa sổ đuôi — lý do tầng T3 là
  `tail-scan-no-candidate`, khác tầng thuần, cả hai đều là
  fallback an toàn, không sai dữ liệu).
- Nới trần moov (vd lên 32/64 MiB) chỉ nên bàn lại khi có file
  thật vượt trần + đo RAM transient + đủ 3 điều kiện đợt 42 — đợt
  này không đề xuất số mới nào.

### 3.3 (c) File fragmented — KHÔNG HỖ TRỢ, kết luận có bằng chứng

Khảo sát bằng file fragmented thật: ffmpeg
`-movflags +frag_keyframe+empty_moov+default_base_moof`, 2 s,
320×240, `-g 10`. Box top-level đo được:
`ftyp,moov,moof,mdat,moof,mdat,moof,mdat,moof,mdat,moof,mdat,moof,mdat,mfra`
(file 93.356 byte). T3 trên file này (tiền tố mặc định, Range thật):
gate `faststart` (moov trước mdat — `moof` không làm đổi kết luận
của `detectMoovPosition`), demux chạy rồi fallback
`demux-moov: track không có sample`, 0 GOP.
- Vì sao không thể "cứu" bằng gate/tail-scan: sample của fragmented
  không nằm trong sample table của moov (stbl rỗng/không đủ
  stts/stsz/stco) mà nằm rải trong từng `moof` (`traf`/`trun` +
  `mdat` sau nó). Muốn dựng range GOP phải viết parser moof mới:
  đọc `tfhd`/`tfdt`/`trun` từng fragment, cộng dồn timestamp/
  offset, xử lý `default_base_moof` và `mfra` — một demux mới,
  không phải một nhánh gate. Nằm ngoài phạm vi luồng B4 và không
  được làm ẩu dưới danh nghĩa "hỗ trợ fragmented".
- Hành vi hiện tại là đúng: fallback về tải toàn file (đường cũ
  cũng dùng cùng demux nên cũng không decode được fragmented —
  đây là giới hạn của cả preview, không riêng đường GOP; ghi rõ
  để khỏi tưởng fallback GOP là "mất tính năng đang có").

## 4. Bàn lại hợp đồng gate U2 cho file trailing nhỏ — QUYẾT GIỮ

### 4.1 Quyết định: giữ nguyên `trailing → fallback`

Gate `resolveRangeGopFetch` vẫn trả `moov-trailing` cho mọi file
moov-sau-mdat, và T3 vẫn fallback ngay (0 request tail, 0 GOP).
Không thêm nhánh "moov đã nằm trong tiền tố thì demux luôn" — dù
về mặt kỹ thuật moov đó đã nằm trong tay. Lý do, theo thứ tự mạnh
dần:

1. **Không cứu được đường production nào.** Wiring production chỉ
   xét file > 32 MiB (`resolveGopRangeWiring`); file trailing nhỏ
   (moov gọn trong tiền tố 512 KiB) luôn dưới ngưỡng nên wiring
   trả `below-threshold` dù gate có đổi hay không — test khóa:
   file trailing nhỏ 92.790 byte, wiring với `enabled: true` vẫn
   `useGop=false`, lý do `gop-below-threshold: 92790 <= 33554432`.
   Đổi gate chỉ đổi hành vi của T3 gọi trực tiếp và test, không
   đổi hành vi production.
2. **Tiết kiệm byte không đáng kể — đo thật, không ước.** Trên
   file trailing nhỏ ffmpeg 2 s: sample bytes = 91.263, file =
   92.790, tỉ lệ sample/file = **0,9835** — đường GOP chỉ bớt
   được **1,65%** so với tải toàn file (phần bớt đúng bằng moov +
   header, vì GOP range phủ gần như toàn bộ mdat). Test khóa tỉ lệ
   > 0,9. Trường hợp moov phình bất thường so với media có thể
   cho tỉ lệ thấp hơn, nhưng đó là file bệnh lý, không phải lý do
   phá hợp đồng cho file thường.
3. **Phá hợp đồng đã khóa nhiều nơi.** Test khóa `moov-trailing`
   hiện nằm ở U2 (gate thuần), T3, Z4 (guard), V2 (controller với
   ngưỡng override 1024 byte — chính là trường hợp "file nhỏ vào
   wiring bằng override test"). Đổi hành vi đồng nghĩa sửa 4 bộ
   test khóa + hợp đồng U2 đã công bố, để đổi lấy lợi ích production
   bằng 0 theo (1) và 1,65% theo (2). Không đáng.
4. **Đường fallback hiện tại không sai, không chậm đáng kể cho
   file nhỏ.** File nhỏ tải toàn file là rẻ; rủi ro duy nhất của
   việc giữ là file trailing nhỏ không dùng được GOP — mà GOP
   sinh ra để tránh tải file LỚN, không phải file nhỏ.

### 4.2 Test khóa quyết định (trong file test B4)

- T3 trên file trailing nhỏ ffmpeg, tiền tố mặc định → full-file,
  lý do `/moov-trailing/`, 0 tail, 0 GOP (khóa lại hành vi cũ,
  không phải test mới "phát hiện" — để lần sau ai đổi gate cũng
  thấy test này đỏ trước).
- Đo tỉ lệ sample/file = 0,9835, assert > 0,9 (khóa luận cứ (2)).
- Wiring file nhỏ → `useGop=false` / `below-threshold` (khóa luận
  cứ (1)).
- Nếu tương lai ngưỡng wiring hạ xuống dưới 512 KiB hoặc có file
  trailing nhỏ nhưng moov phình bất thường thành ca production
  thật, quyết này phải được bàn lại với số đo mới — không tự động
  kế thừa.

## 5. Trần 128 MiB — giữ nguyên, không bằng chứng mới

B4 không thêm bằng chứng nào cho 3 điều kiện đợt 42 (T3 vẫn fetch
mọi GOP ngay lượt đầu — xem request controller phase: cả 6 GOP
được fetch dù cửa sổ decode chỉ cần GOP đầu; VideoFrame native
tách riêng vẫn chưa đo; cửa sổ quiet vẫn chưa có — mọi số headed
đều under-load). Tail-scan suffix chỉ cứu thêm một lớp file trong
trần hiện có, như A4. Không đề xuất trần mới nào.

## 6. Kiểm chứng + hồi quy

```
# Test mới B4 (esbuild bundle, định dạng esm — như A4)
./node_modules/.bin/esbuild apps/web/src/lib/gopTail46B4.test.ts \
  --bundle --platform=node --format=esm --outfile=/tmp/r46b4.test.mjs \
  && node /tmp/r46b4.test.mjs
# Hồi quy (esbuild bundle, format cjs — trừ A4 dùng esm như task nó)
./node_modules/.bin/esbuild apps/web/src/lib/<tên>.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r46b4-reg-<tên>.cjs \
  && node /tmp/r46b4-reg-<tên>.cjs
# Headed (vite :5173 + bridge :8787 thật)
node apps/web/scripts/gopHeaded46B4.mjs
```

| Nhóm | Kết quả thật |
|---|---|
| B4 mới `gopTail46B4` | **13/13** (7 pure suffix/giới hạn + 1 T3 suffix + 2 moov-lớn + 1 fragmented + 1 giữ-gate + 1 controller 37 MiB) |
| Hồi quy A4 `gopTail45A4` | **18/18** (suffix mới không phá test A4 nào, kể cả guard mdat khổng lồ) |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy V2 `gopWiring40V2` | **16/16** (kể cả controller fallback trailing `moov-trailing` — quyết giữ §4 không phá test này) |
| Hồi quy U2 `reverseRangeGate38U2` | **20/20** (gate nguyên vẹn) |
| Hồi quy Y6 `reverseCompat43Y6` | **11/11** |
| Headed vite :5173 → bridge :8787 | **11/11** cổng (§2.2) |
| `tsc --noEmit -p apps/web/tsconfig.json` | Sạch cho file B4 sau khi thêm exclude; chỉ còn **1 lỗi TS5097 có sẵn ở `apps/web/src/lib/seek.ts:25`** (file này B4 không đụng — lỗi có sẵn trước đợt, không phải do B4; ghi rõ để parent khỏi tưởng B4 gây ra) |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass (16,58 s)**, chỉ cảnh báo chunk > 500 kB cũ |

Lưu ý chạy hồi quy (để khỏi vấp lại): bundle format cjs phải ghi
ra file đuôi `.cjs` — ghi ra `.mjs` rồi chạy bằng node sẽ lỗi
(vì node hiểu `.mjs` là ESM). Lần chạy đầu của B4 đã vấp đúng
lỗi này rồi sửa bằng đuôi `.cjs`, không phải lỗi test.

## 7. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA MỞ: trần 128 MiB và trần moov 16 MiB giữ nguyên** (§5,
   §3.2). Muốn bàn lại vẫn cần đủ 3 điều kiện đợt 42 + file thật
   vượt trần + đo RAM transient.
2. **CHƯA LÀM: moov + hậu tố `udta` sau moov** (và mọi hậu tố ngoài
   allowlist free/skip/wide). Vẫn fallback an toàn. Muốn cứu cần
   chứng minh hậu tố đó không mang sample/metadata mà demux cần —
   riêng `udta` có thể mang metadata nên không cho vào allowlist
   một cách ẩu.
3. **CHƯA LÀM: hậu tố nằm ngoài cửa sổ đuôi** (free trailer lớn
   hơn 16 MiB, hoặc moov bắt đầu trước `tailStart`). Vẫn fallback.
   Cửa sổ đuôi = trần moov nên trường hợp này chỉ xảy ra khi hậu
   tố/moov phình bất thường — cùng họ với nợ moov > 16 MiB.
4. **CHƯA LÀM: file fragmented** (§3.3) — cần parser moof mới
   (tfhd/tfdt/trun/mfra), không phải nhánh gate. Đường cũ cũng
   không decode được fragmented nên đây là giới hạn preview chung,
   không riêng GOP.
5. **CHƯA ĐO: file trailing 37 MiB encode thật** (không pad),
   Safari, máy thật, màn hình vật lý, GPU thật, baseline quiet /
   fps. Toàn bộ headed ở đây là Chromium Linux + Xvfb + render
   phần mềm, under-load, fixture pad-inflated (§2.3).
6. **CHƯA ĐO: app UI mặc định bật GOP.** Headed bật GOP tường minh
   như registry; mặc định production vẫn tắt. Click-test trên app
   thật + quyết bật/tắt mặc định vẫn là nợ (như Z4 §6.5, A4 §6.4).
7. **Harness phụ thuộc fixture ngoài repo:** fixture headed chỉ nằm
   ở `~/scratch-round46-b4/` (mp4 + bundle/page/profile Chrome +
   bridge work-dir — KHÔNG đưa vào batch); muốn chạy lại harness
   thì script tự tạo fixture bằng ffmpeg, không cần file sẵn. Test
   Node dùng fixture trong os.tmpdir(), cũng không vào repo.
8. **Lỗi tsc có sẵn ở `seek.ts:25` (TS5097)** không thuộc B4; parent
   có thể xử lý riêng (exclude hoặc sửa import) — B4 không đụng
   vào file đó để tránh xung đột với luồng sở hữu seek.

## 8. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopTail46B4.test.ts` (mới, 13 test)
- `apps/web/scripts/gopHeaded46B4.mjs` (mới, harness headed vite
  :5173 → bridge :8787)
- `apps/web/src/lib/gopTail45A4.ts` (sửa: + `trailingSuffixValid` /
  mở rộng cửa 1 + comment module; marker ROUND46-B4)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: CHỈ comment đầu
  module; marker ROUND46-B4; không đổi code)
- `apps/web/tsconfig.json` (sửa: +1 dòng exclude
  `src/lib/gopTail46B4.test.ts`)
- `docs/PHASE9_ROUND46_B4_GOP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round46-b4/` (fixture headed,
bundle/page/profile Chrome, bridge work-dir — KHÔNG đưa vào batch).

# Phase 9 đợt 39, luồng T3 — Fetch thật theo GOP bằng HTTP Range, nối cổng gate U2 — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch, KHÔNG sửa file của luồng khác (chỉ thêm 1 dòng exclude vào
`tsconfig.json` dùng chung theo tiền lệ U2, ghi rõ ở §1.3), KHÔNG ghi
paths-loop hay build-loop-log (parent gộp).

Đóng nợ §5.3 của `docs/PHASE9_ROUND38_LIMITS.md` ("Range theo GOP thật
chưa làm: cần demux mảnh + fetch từng đoạn GOP + ghép decoder; gate
hiện chưa code nào gọi") và §2.4 của
`docs/PHASE9_ROUND38_U2_PROXY_SIZE_RANGE_LIMITS.md`.

## 0. Kết luận ngắn (không vượt số đo)

1. **Cổng Range U2 nay đã được code fetch thật gọi — không còn đứng
   yên.** `fetchVideoTrackByGopRange` (module mới
   `gopRangeFetch39T3.ts`) gọi đúng `resolveRangeGopFetch` (3 điều
   kiện: moov-trước + `Accept-Ranges: bytes` + đã biết size) và
   `checkRangeProbeResponse` cho probe lẫn từng GOP (chỉ 206 +
   Content-Range khớp đúng range mới nhận body). Gate U2 không bị
   sửa — chỉ có thêm caller đầu tiên.
2. **Demux mảnh có thật:** chỉ lấy đúng box moov (từ tiền tố, hoặc
   fetch thêm đúng range moov nếu tràn tiền tố), rồi
   `parseMp4VideoTrack` trên buffer chỉ-chứa-moov cho cùng sample
   table với parse toàn file (đối chiếu 60/60 sample: offset, size,
   isKey, codec — xem §3).
3. **Fetch từng GOP + ghép cho decoder có thật, đo trên server HTTP
   Range thật:** fixture ffmpeg testsrc2 320x240, 30 fps, 2 s, 60
   frame, `-g 10` → 6 GOP. 60/60 chunk GOP khớp từng byte với sample
   cắt từ file gốc; tổng Range GOP trả về 91.263 byte = đúng tổng
   size sample (overhead 0 vì file 1 track video, không audio xen
   kẽ); 6 request GOP đều 206; không có request toàn file nào.
4. **Mặc định an toàn giữ nguyên:** mọi bước hỏng (moov cuối, server
   phớt Range trả 200, HEAD báo `Accept-Ranges: none`, GOP giữa
   chừng 416, lỗi mạng) đều trả `{ mode: "full-file", reason }` —
   không throw, không chunk nửa vời, và 0 request GOP trong các
   trường hợp bị chặn từ trước khi fetch GOP.
5. **Chưa nối vào ReversePreviewController** (cố tình, ghi rõ §5):
   controller vẫn tải toàn file theo hướng (b) R3. Module này chứng
   minh đường fetch GOP chạy thật + fallback an toàn; luồng sở hữu
   preview nối sau khi quyết ngưỡng dùng đường GOP và cache GOP.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopRangeFetch39T3.ts` — đường fetch GOP (§2).
- `apps/web/src/lib/gopRangeFetch39T3.test.ts` — 10 test (§3).
- `docs/PHASE9_ROUND39_T3_GOP_RANGE_LIMITS.md` — file này.

### 1.2 Sửa

- `apps/web/tsconfig.json` — chỉ thêm 1 dòng exclude cho test mới
  (`src/lib/gopRangeFetch39T3.test.ts`), đúng tiền lệ U2 (test chạy
  bằng esbuild, không qua tsc project).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (chỉ gọi, không sửa cổng),
`mp4Demux.ts` (chỉ gọi `parseMp4VideoTrack`/`sampleChunkInit`,
không sửa parser), `reverseWebcodecs.ts` (controller chưa nối —
xem §5.1), `preview.tsx`, `store.ts`, mọi file luồng khác.
`assetStore.ts` KHÔNG phải file của luồng này: trong lúc chạy, file
đó đổi mtime/kích thước liên tục (19.055 → 23.327 byte, 01:23–01:25
UTC) do luồng khác đang sửa — xem §3.3 về build.

## 2. Kiến trúc demux/fetch/ghép

```
HEAD (best-effort: Accept-Ranges + Content-Length; lỗi thì bỏ qua)
  → probe Range 0–1023, checkRangeProbeResponse nghiêm ngặt
  → prefix Range (mặc định 512 KiB, kẹp theo size) → quét box
  → detectMoovPosition → resolveRangeGopFetch (CỔNG U2)
  → lấy đúng box moov (từ prefix, hoặc Range riêng nếu tràn prefix;
     moov > 16 MiB → fallback)
  → parseMp4VideoTrack(buffer chỉ-chứa-moov) → sample table
  → gopRangesFor: keyframe mở GOP mới; range GOP =
    [offset sample đầu, offset+size sample cuối]
  → fetch từng GOP bằng Range, mỗi lần checkRangeProbeResponse
  → cắt sample từ buffer GOP (offset - rangeStart) → sampleChunkInit
    (type key/delta, timestamp presentation µs, duration µs, data AVCC)
```

Chi tiết cần đọc kỹ trước khi trích dẫn:

- **Vì sao parse moov-only được:** parser chỉ cần moov để dựng
  sample table (stts/stsz/stsc/stco/stss/ctts đều nằm trong moov);
  offset sample là tuyệt đối trong file nên không đổi khi buffer
  chỉ chứa moov. Đã đối chiếu, không phải giả định (test §3).
- **Vì sao không fetch moov-cuối:** cổng gate trả fallback cho
  trailing (cần probe đuôi với kích thước moov chưa biết) — luồng
  này giữ đúng, không tự đoán moov ở cuối.
- **File có audio xen kẽ:** range GOP bao cả byte audio nằm giữa
  các sample video (overhead ghi trong stats), sample video vẫn
  cắt đúng vị trí — tốn byte, không sai dữ liệu. Chưa có fixture
  audio+video để đo overhead thật (§5.4).
- **Body không đọc khi đã fallback:** mọi response không-206 hoặc
  Content-Range lệch đều `body.cancel()` best-effort trước khi
  trả fallback, để không nuốt cả file lớn như cảnh báo R3.
- **Probe khi chưa biết size và file < 1 KiB:** probe xin 0–1023,
  server kẹp về cuối file → `checkRangeProbeResponse` nghiêm ngặt
  coi là lệch → fallback. An toàn (file video < 1 KiB là dị
  dạng), nhưng là giới hạn thật: đường GOP yêu cầu file > 1 KiB
  khi HEAD không báo size. Tiền tố thì đã xử lý kẹp cuối file
  (chấp nhận end = total-1 khi chưa biết size).
- **Không xử lý redirect/auth/cookie riêng:** dùng fetch của caller
  nên kế thừa đúng hành vi đó.

## 3. Kiểm chứng (số thật)

### 3.1 Fixture — nguồn ghi rõ

ffmpeg có sẵn trên máy (`/usr/bin/ffmpeg`, libx264), lệnh tương
đương: `ffmpeg -f lavfi -i testsrc2=size=320x240:rate=30:duration=2
-c:v libx264 -pix_fmt yuv420p -g 10 [-movflags +faststart] out.mp4`.
Cả 2 file đều 92.790 byte, 60 frame, 2,00 s:

| File | Box top-level (quét độc lập) | Vai trò |
|---|---|---|
| faststart.mp4 | ftyp 32, moov 1479 (từ byte 32), free 8, mdat 91271 | Đường GOP chính |
| trailing.mp4 | ftyp 32, free 8, mdat 91271, moov 1479 cuối file | Test fallback moov-cuối |

Fixture chỉ nằm trong `os.tmpdir()` lúc test chạy, KHÔNG copy vào
repo. Server test là `node:http` tự cài trong test (hỗ trợ Range
thật: 206 + Content-Range + Accept-Ranges, HEAD báo Content-Length,
có mode phớt Range / `Accept-Ranges: none` / 416 giữa chừng) —
không dùng bridge thật vì bridge phục vụ proxy, còn đường này test
hợp đồng Range tổng quát trên URL http bất kỳ.

### 3.2 Test mới — 10/10 pass

```
./node_modules/.bin/esbuild apps/web/src/lib/gopRangeFetch39T3.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r39t3.test.cjs \
  && node /tmp/r39t3.test.cjs
```

| Nhóm | Kết quả thật |
|---|---|
| Unit quét moov | ftyp/moov/free đúng vị trí; moov start=32, size=1479; mdat tràn tiền tố 4096 thì scanner dừng sau free (hành vi đúng, test đầu từng kỳ vọng sai đã sửa — xem ghi chú trong test) |
| Unit chia GOP | 60 sample → 6 GOP, keyframe ở 0/10/20/30/40/50, mỗi GOP 10 sample |
| Unit moov-only | 60/60 sample khớp offset/size/isKey + codec với parse toàn file |
| Tích hợp GOP thật | `mode: gop-range`, 6 GOP, 60/60 chunk khớp từng byte với sample gốc (so cả độ dài + từng byte), type key/delta đúng; `totalGopRangeBytes=91263`, `totalSampleBytes=91263`, overhead=0; request: head 200, probe 206 (1024 byte), prefix 206 (92790 byte), 6 GOP 206 (15151/15362/15279/14335/15545/15591 byte); mọi GET đều 206, 0 request toàn file |
| knownSize từ caller | HEAD không báo Content-Length nhưng caller truyền size → vẫn gop-range, 6 GOP |
| Fallback trailing | `full-file`, lý do chứa `moov-trailing`, 0 request GOP |
| Fallback server 200 | `full-file`, lý do `probe-status-200`, 0 request GOP, không đọc body toàn file |
| Fallback gate | HEAD báo `Accept-Ranges: none` (dù Range vẫn 206) → `full-file`, lý do `accept-ranges-unsupported`, 0 request GOP — chứng minh gate được gọi thật, không chỉ test đứng |
| Fallback 416 giữa chừng | GOP thứ 3 (index 2) trả 416 → `full-file`, lý do `gop-status-416`, kết quả KHÔNG chứa `gops` (không chunk nửa vời) |
| Fallback lỗi mạng | fetchImpl throw → `full-file`, lý do `exception: ...`, không throw ra ngoài |

### 3.3 Hồi quy + typecheck

- Test gate U2 cũ chạy lại: **20/20 pass** (cổng không bị sửa chạm).
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0** ở lần kiểm
  tra cuối. Ghi chú trung thực: lần đầu chạy tsc báo 2 lỗi TS5097
  vì module production dùng import đuôi `.ts` (chỉ test bị exclude
  mới được dùng) — đã sửa thành import không đuôi theo đúng cách
  `reverseWebcodecs.ts` import, sau đó tsc xanh.
- `npm --prefix apps/web run build` (tsc + vite build): **CHƯA xanh
  ổn định tại thời điểm luồng này chạy** — 2 lần chạy liên tiếp
  báo lỗi ở `assetStore.ts` nhưng với nội dung KHÁC nhau
  (`hashBlobIncremental`/`ASSET_DB_NAME` rồi `StaleAliasReport`/
  `StaleAliasRemoval`), trong khi `tsc --noEmit` chạy xen giữa lại
  exit 0 và file đó đổi mtime/kích thước liên tục. Kết luận: đó là
  trạng thái trung gian của luồng khác đang sửa `assetStore.ts`
  song song, KHÔNG phải lỗi của luồng này (file đó không import gì
  từ module mới, module mới không import nó). Parent cần chạy lại
  build sau khi các luồng đợt 39 lắng xuống; không được trích 2
  lần build lỗi này làm "build hỏng do T3".

## 4. Số đo tóm tắt (để parent trích, không hard-code lại trong code)

- File test: 92.790 byte, 60 frame, 6 GOP (GOP=10 frame).
- GOP fetch: 6 request 206, tổng 91.263 byte = đúng tổng sample.
- Tổng request cho 1 lần fetch GOP thành công: HEAD + probe
  (1.024 byte) + prefix (toàn file 92.790 byte vì file nhỏ hơn
  tiền tố 512 KiB — file lớn thật thì prefix chỉ 512 KiB) + 6 GOP.
  Lưu ý đọc đúng: với file nhỏ, prefix đã là toàn file nên đường
  GOP không tiết kiệm byte — lợi ích Range chỉ hiện trên file lớn
  (prefix 512 KiB + từng GOP thay vì toàn file). Chưa đo file lớn
  thật (> 128 MiB) vì cần footage lớn + server đo riêng (§5.3).

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Chưa nối vào ReversePreviewController.** Controller vẫn tải
   toàn file (hướng (b) R3). Nối cần quyết thêm: ngưỡng nào thì
   dùng đường GOP (file lớn? mọi file faststart?), cache GOP theo
   cửa sổ decode ra sao, và GOP fetch có chạy cùng lúc với
   decode-ahead Q3 không. Luồng sở hữu preview làm bước này; module
   này đã sẵn interface (`fetchVideoTrackByGopRange` trả track +
   chunk, fallback về full-file).
2. **Chỉ avc1 + file không fragmented.** avc3, HEVC, moof/mvex,
   nhiều track video → parse ném lỗi → fallback về tải toàn file
   (rồi controller cũ cũng có thể fallback element). Đây là giới
   hạn kế thừa của `mp4Demux.ts`, không phải giới hạn riêng của
   đường Range.
3. **Chưa đo file > 128 MiB thật.** Fixture 92.790 byte chứng minh
   cơ chế đúng, nhưng chưa chứng minh tiết kiệm byte/bộ nhớ trên
   file lớn — nơi đường GOP mới có ý nghĩa (S4 khóa file > 128
   MiB khỏi WebCodecs nên đường GOP muốn mở lại file lớn cho
   WebCodecs vẫn cần đo riêng + quyết ngưỡng với luồng preview).
4. **Chưa đo overhead audio xen kẽ.** File test 1 track video nên
   overhead = 0; file có audio interleave sẽ có overhead > 0 (chưa
   biết bao nhiêu — cần fixture audio+video).
5. **Chưa đo trên bridge thật / Safari / Firefox / máy thật.**
   Server test là `node:http` tự cài; bridge Express (U2 đã đo hỗ
   trợ Range) chưa được chạy qua đường GOP này; header Safari/
   Firefox cho cùng URL chưa đo.
6. **Moov > 16 MiB → fallback.** Trần này là chọn lựa của luồng
   (tránh fetch tiền tố khổng lồ); file có moov rất lớn (nhiều
   sample, metadata nặng) sẽ rơi về tải toàn file dù faststart.
   Trần có thể nâng sau khi đo moov thật của footage lớn.
7. **Probe file < 1 KiB khi chưa biết size → fallback** (xem §2).
   Không ảnh hưởng file video thật, nhưng là hành vi cần biết khi
   test file dị dạng.
8. **Build chưa xác nhận xanh ổn định** do luồng khác đang sửa
   `assetStore.ts` song song (§3.3) — parent chạy lại sau khi đợt
   39 lắng xuống.

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopRangeFetch39T3.ts` (mới)
- `apps/web/src/lib/gopRangeFetch39T3.test.ts` (mới)
- `apps/web/tsconfig.json` (sửa, chỉ +1 dòng exclude)
- `docs/PHASE9_ROUND39_T3_GOP_RANGE_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Fixture MP4 + server test chỉ tồn tại lúc test chạy trong
`os.tmpdir()` — KHÔNG đưa vào batch. `apps/web/dist/` build lại
trong lúc kiểm chứng không vào batch theo tiền lệ.

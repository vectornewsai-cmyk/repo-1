# Phase 9 đợt 40, luồng V2 — Nối GOP Range (T3) vào ReversePreviewController — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch, KHÔNG ghi paths-loop hay build-loop-log (parent gộp).
Đóng nợ §5.2 của `docs/PHASE9_ROUND39_LIMITS.md` ("Nối GOP fetch vào
ReversePreviewController: quyết ngưỡng + cache GOP, đo trên file
> 128 MiB thật qua bridge thật") — đóng được phần ngưỡng + cache +
nối thật; phần đo > 128 MiB vẫn CHƯA làm được, lý do ở §5.1.

## 0. Kết luận ngắn (không vượt số đo)

1. **Controller nay gọi thật module T3.** `ReversePreviewController`
   (đường preview dùng qua registry) thử `fetchVideoTrackByGopRange`
   TRƯỚC khi tải toàn file, đúng 1 lần cho 1 controller; thành công
   thì decode cửa sổ từ chunk GOP, thất bại thì rơi về `load()` cũ
   nguyên vẹn — không throw, không chunk nửa vời, không thử GOP lại.
   Cổng gate U2 KHÔNG bị sửa (chỉ được gọi qua T3 như cũ + qua
   `checkRangeProbeResponse` cho fetch bù 1 GOP).
2. **Ngưỡng đã quyết và khóa bằng test: 32 MiB < size <= 128 MiB.**
   Dưới/ngay 32 MiB thì đường GOP không tiết kiệm byte (tiền tố
   512 KiB đã gần bằng toàn file nhỏ, overhead request/GOP lớn theo
   tỷ lệ); trên 128 MiB thì cổng S4 vẫn khóa fallback element như cũ
   — luồng này KHÔNG mở lại file > 128 MiB cho WebCodecs (cần chứng
   minh heap riêng, chưa có), nên số đo khóa 0-request của đợt 39 T4
   vẫn giữ nguyên giá trị.
3. **Cache GOP có giới hạn thật: 32 MiB VÀ 32 GOP, LRU.**
   Lần tải T3 trả mọi GOP nhưng controller chỉ put GOP giao cửa sổ
   đang decode, còn lại rơi khỏi scope; cửa sổ khác bị miss thì fetch
   bù đúng 1 GOP bằng Range (không tải lại toàn file, không fetch lại
   mọi GOP). GOP đơn lẻ vượt trần thì vẫn decode được lần đó qua
   windowSegments nhưng không giữ lại.
4. **Mặc định TẮT.** Controller tự tạo / test cũ không đổi hành vi;
   chỉ preview bật tường minh qua `reverseWebcodecsFrameFor(..., {
   gopRangeEnabled: true })` tại đúng đoạn hook controller trong
   `preview.tsx` (marker `// ROUND40-V2-GOP`, +4 dòng, không reformat,
   không đụng code toggle Q3, vòng lặp draw, hay seekRuler).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopCache40V2.ts` — ngưỡng (`resolveGopRangeWiring`),
  cache GOP LRU (`GopSegmentCache`), fetch bù 1 GOP
  (`fetchSingleGopRange`, kiểm chứng bằng cổng gate), dựng segment
  từ byte GOP thô (`buildGopSegment`), metadata + tìm GOP giao cửa sổ
  (`gopMetaFor`, `gopsForDecodeRange`).
- `apps/web/src/lib/gopWiring40V2.test.ts` — 16 test (§3).
- `docs/PHASE9_ROUND40_V2_GOP_WIRING_LIMITS.md` — file này.

### 1.2 Sửa

- `apps/web/src/lib/reverseWebcodecs.ts` — import V2 + T3; options
  controller thêm `gopRangeEnabled` (mặc định false),
  `gopThresholdBytes` / `gopCacheMaxBytes` / `gopFetchImpl` (chỉ test
  truyền); trường trạng thái GOP; getters `gopMode`,
  `gopFallbackReason`, `gopCacheStats`; `retainedFileBytes` nay tính
  cả byte GOP cache khi không giữ buffer file (đường full-file cũ
  không đổi); nhánh thử GOP trước `load()` trong `ensureWindowForTime`
  (chỉ 1 lần, lỗi → full-file); `ensureWindowViaGop` +
  `gopSampleData` (decode từ GOP cache, pre-resolve mọi GOP giao cửa
  sổ trước khi decode, prefetch decode-ahead dùng chung nguồn GOP);
  `dispose()` dọn cache/meta/lý do GOP; registry
  `getReversePreviewController` + `reverseWebcodecsFrameFor` thêm
  tham số options tùy chọn (không đổi chữ ký gọi cũ).
- `apps/web/src/preview.tsx` — CHỈ đoạn gọi `reverseWebcodecsFrameFor`
  trong hook controller: thêm comment marker `// ROUND40-V2-GOP` và
  tham số `{ gopRangeEnabled: true }`. Không reformat, không đụng
  toggle Q3, vòng lặp draw, seekRuler, hay bất kỳ đoạn nào khác của
  file (lưu ý: tổng số dòng file tăng thêm trong lúc luồng chạy còn
  do các luồng đợt 40 khác đang sửa song song, không phải luồng này).
- `apps/web/tsconfig.json` — chỉ thêm 1 dòng exclude cho test mới,
  đúng tiền lệ T3/U2 (test chạy bằng esbuild, không qua tsc project).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (không sửa ngưỡng cổng),
`gopRangeFetch39T3.ts` (chỉ gọi, không sửa), `mp4Demux.ts`,
`reverseDecodeAhead.ts`, `reversePreviewGate.ts`, mọi file luồng
khác, paths-loop, build-loop-log. `apps/web/dist/` build lại lúc
kiểm chứng không vào batch theo tiền lệ.

## 2. Kiến trúc nối (đọc kỹ trước khi trích dẫn)

```
ensureWindowForTime(timeSec)
  → frame đích đã cache? trả true (đường nhanh cũ)
  → chưa có track + chưa thử GOP + wiring on (bật + đã biết size +
    32 MiB < size <= 128 MiB)
      → fetchVideoTrackByGopRange (T3: HEAD + probe + prefix + gate
        U2 + demux moov + fetch từng GOP)
        → gop-range: track + gopMeta; transient = mọi GOP (chỉ giữ
          trong lần chạy này)
        → full-file: ghi gopFallbackReason, rơi về load() cũ
        → throw bất ngờ: fail-soft về load() cũ (T3 cam kết không
          throw vì lỗi mạng/server/demux; đây là đai an toàn thứ hai)
  → gopActive? ensureWindowViaGop : load() cũ + nhánh bytes cũ
```

`ensureWindowViaGop` (mirror nhánh cũ, cùng thứ tự đo → aheadRange
trước evict → evict → prefetch; chỉ khác nguồn bytes):

1. Cửa sổ hiệu dụng trừ byte GOP cache đang giữ (không phải byte
   file) khỏi ngân sách tổng 320 MiB, rồi GOP-align về keyframe như cũ.
2. Pre-resolve mọi GOP giao `[decodeFrom, decodeTo]`: cache → transient
   lần tải T3 → `fetchSingleGopRange` (206 + Content-Range khớp đúng
   range, qua cổng gate; hỏng → trả false TRƯỚC khi decode, chưa
   decode frame nào của cửa sổ đó). Segment put vào cache best-effort
   (GOP vượt trần vẫn nằm trong windowSegments cho lần decode này).
3. Decode bằng `cache.decodeGop` với `getData` đọc chunk từ
   windowSegments; thiếu chunk sau pre-resolve thì throw để decodeGop
   nuốt thành lỗi decode mềm (không bao giờ trả bytes sai, không
   chunk nửa vời).
4. Đo wall + ghi `lastDecodeMeasurement` + auto-apply cổng toggle như
   nhánh cũ; prefetch decode-ahead dùng `gopSampleData` (cache trước,
   fetch bù sau; hỏng thì prefetch thiếu frame mềm, không chặn cửa sổ
   chính).

Quyết ngưỡng — vì sao là 32 MiB và vì sao trần trên là 128 MiB:

- 32 MiB: tiền tố 512 KiB là 1,6% của 32 MiB và càng lớn theo tỷ lệ
  khi file càng nhỏ; file nhỏ thì tiền tố gần như toàn file nên GOP
  không tiết kiệm byte nào (LIMITS T3 §4), trong khi vẫn tốn thêm
  HEAD + probe + 1 request/GOP. Tải lại toàn file 32 MiB trở xuống
  trên bridge local rẻ hơn chi phí đó. Ngưỡng này là chọn lựa của
  luồng, khóa bằng test biên (ngay 32 MiB → off, 32 MiB + 1 → on);
  chưa có số đo bridge thật để hiệu chuẩn lại (xem §5.1).
- 128 MiB: đúng ngưỡng S4. Vượt ngưỡng, constructor đã khóa fallback
  từ trước, và wiring cũng trả off — hai lớp khóa đồng thuận, không
  lớp nào bypass lớp nào. Mở lại file > 128 MiB cho WebCodecs bằng
  GOP là việc riêng cần chứng minh heap (GOP cache + frame trong
  ngân sách, không giữ buffer file) trên footage lớn thật; luồng này
  cố tình không làm bước đó trong cùng đợt nối đầu tiên.

Cache — vì sao chỉ giữ GOP giao cửa sổ đang decode:

- T3 trả mọi GOP cùng lúc (đó là API của T3, không đổi ở đây). Giữ
  hết chunk mọi GOP ≈ giữ toàn file, phá đúng lợi ích bộ nhớ của
  hướng (b) R3. Vì vậy controller chỉ put GOP giao cửa sổ decode;
  phần còn lại rơi khỏi scope ngay sau lần decode đầu. Đánh đổi ghi
  rõ: cửa sổ xa sau đó phải fetch bù từng GOP của nó (rẻ hơn tải lại
  toàn file, đắt hơn giữ hết), và lần tải T3 đầu tiên vẫn tốn tổng
  byte ≈ file (probe + prefix + mọi GOP) — lợi ích GOP chỉ hiện từ
  cửa sổ thứ hai trở đi khi cache hit, hoặc khi fetch bù thay cho
  tải lại toàn file. Không claim tiết kiệm ở lần tải đầu tiên.

## 3. Kiểm chứng (số thật)

### 3.1 Test mới — 16/16 pass

```
./node_modules/.bin/esbuild apps/web/src/lib/gopWiring40V2.test.ts \
  --bundle --platform=node --format=cjs --outfile=/home/hatch/workspace/tmp-round40-v2/r40v2.test.cjs \
  && node /home/hatch/workspace/tmp-round40-v2/r40v2.test.cjs
```

Fixture ffmpeg testsrc2 320×240 30 fps 2 s `-g 10` (92.790 byte,
6 GOP — cùng công thức T3), fake fetch in-memory hỗ trợ Range thật,
chỉ nằm trong `os.tmpdir()` lúc test chạy. Lưu ý đọc đúng: decode
thật cần VideoDecoder của browser nên test Node KHÔNG chứng minh
decode — ở Node `ensureWindowForTime` trả false vì thiếu VideoDecoder
(đúng fail-soft), nhưng track đã có (`ready`), `gopMode` và cache
stats vẫn khẳng định đường nối đã chạy tới bước decode.

| Nhóm | Kết quả thật |
|---|---|
| Ngưỡng (5) | tắt → off; size null/0/NaN → off; 16 MiB và ngay 32 MiB → off; 32 MiB + 1 → on; ngay 128 MiB → on; 128 MiB + 1 → off (large-file-locked); ghi đè test tôn trọng biên |
| Cache (3) | LRU chạm + evict cũ nhất khi vượt trần byte (1000 byte); trần số GOP evict; GOP đơn vượt trần bị từ chối mà không xóa cache cũ; `gopsForDecodeRange` giao đúng (0–9 → GOP 0; 5–15 → GOP 0,1; 59 → GOP 5) |
| Fetch bù (2) | GOP 0 fetch 206 đúng từng byte slice gốc; segment dựng lại khớp từng byte sample (10 sample); 200 phớt Range và 416 đều `ok: false`, không throw |
| Controller GOP (2) | Tải T3 thành công: `ready`, `gopMode = gop-range`, cache giữ GOP cửa sổ (segments 1–3 với window 15 frame), `retainedFileBytes` = byte cache (không giữ buffer file); request: HEAD + probe + prefix + 6 GOP = 8 lần 206, 0 GET toàn file. Cửa sổ khác bị miss chỉ phát thêm Range GET 206 (fetch bù), không HEAD/prefix/GET toàn file, không fetch lại mọi GOP |
| Controller fallback (3) | Gate từ chối (Accept-Ranges none) → `full-file-fallback`, lý do chứa accept-ranges, track vẫn có qua load() cũ, cache 0 segment. Moov cuối → lý do moov-trailing, tương tự. Server 200 phớt Range → lý do probe-status-200, tương tự. Cả 3 đều không throw, không request GOP nào |
| Controller tắt (1) | Không truyền cờ → `gopMode = off`, GOP fake không được gọi lần nào |

Ghi chú trung thực về quá trình test: lần chạy đầu 13/16 — 3 test
fallback rớt vì fake response trong test thiếu trường `ok` nên
`load()` cũ trả false (lỗi của test, không phải code production);
đã sửa fake (thêm `ok: true/false`) rồi chạy lại 16/16. Lần bundle
đầu còn cảnh báo duplicate member `gopFallbackReason` (field private
cùng tên getter, esbuild cảnh báo và getter sẽ bị field che) — đã
đổi field thành `gopFallbackReasonValue`, bundle sau không còn cảnh
báo. Một lần esbuild ghi nhầm bundle vào `repo-1/~/...` do `~` sau
dấu `=` không được shell expand — đã xóa thư mục lạ đó, repo sạch
trở lại (không còn file lạ ngoài 5 file §1).

### 3.2 Hồi quy — vẫn xanh

- Test T3 cũ: **10/10** (module T3 không bị sửa chạm).
- Test gate U2 cũ: **20/20** (cổng không bị sửa chạm).
- `reverseFileHeap36S4`: 6/6; `reverseFileCancel37T5`: 6/6;
  `reverseDecodeAheadToggle39T4`: 11/11; `reverseFileBuffer35R3`: 10/10.
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0**.
- `npm --prefix apps/web run build`: **pass (25,61 s)**; cảnh báo
  chunk > 500 kB và dynamic-import userLut đã có từ trước.

## 4. Số đo tóm tắt (để parent trích, không hard-code lại trong code)

- Ngưỡng: (32 MiB, 128 MiB]; cache GOP: 32 MiB + 32 GOP, LRU.
- Fixture test: 92.790 byte, 6 GOP; lần tải T3: 8 request 206
  (probe 1.024 byte + prefix toàn file do file nhỏ + 6 GOP), 0 GET
  toàn file; cache cửa sổ 15 frame giữ 1–3 GOP.
- Không có số đo browser/bridge nào trong luồng này (xem §5.1).

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA đo file > 128 MiB thật qua bridge thật** (nợ gốc §5.2 đợt
   39). Lý do kép, ghi rõ không giấu: (a) đường GOP đợt này cố tình
   KHÔNG kích hoạt trên 128 MiB (giữ khóa S4), nên đo > 128 MiB
   không chứng minh được gì cho đường đã nối — phép đo đó chỉ có ý
   nghĩa khi có đợt riêng quyết mở lại file lớn cho WebCodecs kèm
   chứng minh heap; (b) decode thật cần VideoDecoder trên browser
   headed, test Node này không đo được; máy lúc chạy có 6 luồng
   song song nên mọi số timing đều under-load, cấm dùng làm baseline
   quiet. Luồng sau cần: browser headed + file 32–128 MiB thật qua
   bridge thật, đo số request/lần đổi cửa sổ (cache hit vs fetch bù)
   và bộ nhớ (GOP cache + frame), rồi mới quyết có mở > 128 MiB không.
2. **GOP chỉ kích hoạt khi đã biết size trước cửa sổ đầu tiên.**
   Proxy chưa biết size (bridge cũ không trả `proxySizeBytes`) đi
   đường full-file cũ và không thử GOP muộn — an toàn nhưng mất lợi
   ích GOP cho tới khi size được biết trước. Luồng sau có thể xét:
   sau khi `load()` cũ học được size qua HEAD/GET mà track chưa có
   (trường hợp load hỏng rồi thử lại) thì đánh giá lại wiring — hiện
   tại không làm vì cửa sổ đầu đã tải xong thì GOP không còn ý nghĩa.
3. **Lần tải T3 đầu tiên vẫn tốn tổng byte ≈ file** (mọi GOP + tiền
   tố). Lợi ích chỉ từ cửa sổ thứ hai trở đi. Muốn tiết kiệm ngay từ
   lần đầu cần đường "chỉ lấy moov + GOP cần thiết" (dùng
   `scanTopBoxes`/`gopRangesFor` đã export của T3 + `fetchSingleGopRange`
   của luồng này) thay vì gọi `fetchVideoTrackByGopRange` trọn vẹn —
   đó là cải tiến riêng, không làm lén trong đợt nối này.
4. **Decode-ahead prefetch ở đường GOP dùng `gopSampleData` fetch bù
   theo yêu cầu.** Prefetch hỏng 1 GOP thì prefetch thiếu frame mềm
   (decodeGop nuốt lỗi), không chặn cửa sổ chính — đúng cho prefetch
   nền, nhưng chưa có test browser chứng minh prefetch GOP chạy đúng
   thứ tự present ngược trên footage có B-frame.
5. **Kế thừa mọi giới hạn của T3:** chỉ avc1 không fragmented, moov
   > 16 MiB → fallback, audio xen kẽ gây overhead range GOP, chưa đo
   Safari/Firefox/máy thật. Ngưỡng 32 MiB là chọn lựa chưa hiệu chuẩn
   bằng số bridge thật — luồng đo (§5.1) có quyền đổi ngưỡng nếu số
   đo chứng minh khác, kèm test biên cập nhật.
6. **Trùng lặp code có chủ ý:** `ensureWindowViaGop` mirror khối đo /
   auto-apply / prefetch / evict của nhánh bytes cũ (để không đụng
   nhánh đang chạy của các luồng khác). Luồng dọn dẹp sau có thể tách
   helper chung, nhưng phải giữ nguyên thứ tự aheadRange-trước-evict
   và luật settle-drop T4 ở cả hai nhánh.
7. **Registry 1 URL = 1 controller:** cờ GOP chỉ có tác dụng lúc tạo
   controller đầu tiên cho URL đó. Preview luôn truyền cờ nên đường
   production thỏa điều kiện; caller nào tạo controller trước mà
   không có cờ thì controller đó giữ nguyên tắt (không bật lén).

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopCache40V2.ts` (mới)
- `apps/web/src/lib/gopWiring40V2.test.ts` (mới)
- `apps/web/src/lib/reverseWebcodecs.ts` (sửa)
- `apps/web/src/preview.tsx` (sửa, chỉ đoạn hook controller + marker
  `// ROUND40-V2-GOP`)
- `apps/web/tsconfig.json` (sửa, chỉ +1 dòng exclude)
- `docs/PHASE9_ROUND40_V2_GOP_WIRING_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/workspace/tmp-round40-v2/` (bundle test
esbuild) — KHÔNG đưa vào batch.

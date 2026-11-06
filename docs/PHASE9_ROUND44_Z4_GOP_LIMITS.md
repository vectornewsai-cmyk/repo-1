# Phase 9 đợt 44, luồng Z4 — GOP: thiết kế lại fetch moov riêng + đo heap biên + headed qua bridge Express thật — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch. Ngưỡng wiring (32, 128] MiB / trần moov 16 MiB / tiền tố mặc
định 512 KiB / mặc định GOP TẮT GIỮ NGUYÊN (kết luận §0.3). Không tự
stage paths-loop hay ghi build-loop-log (parent gộp, như tiền lệ Y4).
Đóng nợ đợt 43 Y4 §6.2 + §6.4: (1) nhánh fetch moov riêng của T3 +
trần 16 MiB là code chết với tiền tố mặc định; (2) heap chỉ có 1 điểm
đo 141,52 MiB, luật 1,09× là ngoại suy từ 1 điểm; (3) headed qua route
bridge thật cần kiểm tra lại CORS expose của Y4 với code mới.

## 0. Kết luận ngắn (không vượt số đo)

1. **Thiết kế lại fetch moov riêng — CHẠY ĐƯỢC, có bằng chứng đầu-cuối.**
   Gate tầng tiền tố GIỮ NGUYÊN (moov > 512 KiB vẫn cho `unknown` ở
   tầng prefix — test gate/scan của Y4 không đổi). Cái mới nằm ở T3:
   `findTruncatedMoovHeader` phân biệt "moov không thấy" với "header
   moov đã thấy, chỉ thiếu thân box"; khi header moov nằm gọn trong
   tiền tố và không có box mdat nào đứng trước nó (moov là box media
   đầu tiên → faststart chứng minh được từ thứ tự box), T3 kiểm tra
   lại gate với `faststart` rồi fetch đúng range moov (kẹp bởi trần
   16 MiB và tổng file) và demux từ buffer đó. Bằng chứng: Node
   (moov phình thật 8192 > tiền tố 4096 → gop-range, 6 GOP, chunk
   byte-khớp gốc) + headed qua bridge thật (file moov đúng
   16.777.216 byte nay `gop-range`, vẽ ngược 91 frame missing 0,
   trong khi Y4 trên cùng file là `full-file-fallback`). Nhánh
   `moov-too-large` nay chạm tới được thật (test override trần).
   Moov cuối file thật (mdat khổng lồ trước moov, header moov không
   nằm trong tiền tố) VẪN fallback như cũ — không đoán moov ở đuôi
   file (§2.4, §6.1).
2. **Đường cong heap theo kích thước file — luật 1,09× của Y4 KHÔNG
   giữ phẳng tới 256 MiB.** Ba điểm đo headed (cùng công thức, JS
   heap delta so với baseline sau gc, xem §3):
   129,73 MiB → delta đỉnh T3 139,04 MiB = **1,072×**;
   141,52 MiB (Y4) → 153,84 MiB = **1,087×**;
   256,58 MiB → delta đỉnh T3 311,24 MiB = **1,213×**.
   Tỷ lệ TĂNG theo kích thước file (1,07 → 1,09 → 1,21), nên ngoại
   suy 1,09× ra file lớn hơn sẽ ĐÁNH GIÁ THẤP transient. Transient
   nhả sạch ở cả hai biên mới (dư sau nhả + gc chỉ 0,12–0,13 MiB),
   nhưng đó không phải giấy phép mở trần (xem §0.3).
3. **GIỮ TRẦN 128 MiB — không đề xuất trần mới.** Cả 3 điều kiện đợt
   42 để bàn lại trần đều CHƯA đủ: (1) T3 streaming CHƯA làm — Z4
   chỉ sửa fetch moov, T3 vẫn fetch MỌI GOP ngay lượt đầu nên
   transient vẫn tuyến tính theo file (bằng chứng: đỉnh heap tăng
   theo file ở §3, và số request T3 = 1 HEAD + (2 + số GOP) × 206);
   (2) RSS cây Chrome đã đo nhưng VideoFrame native RIÊNG LẺ vẫn
   chưa tách được, và RSS cộng dồn tính trùng trang chia sẻ (cận
   trên, §3.4); (3) cửa sổ quiet KHÔNG có trong phiên này — mọi số
   đều under-load (các luồng đợt 44 khác đang chạy, có lúc ffmpeg
   encode song song). Sau 1 cửa sổ decode 91 frame, RSS cây tăng
   thêm +445,53 MiB (file 129 MiB) và +789,28 MiB (file 256 MiB) so
   với baseline — dù là cận trên do tính trùng, hướng này vẫn chống
   lại việc mở trần cho thiết bị không xác định (có cả mobile-web).
4. **Headed qua bridge Express thật: 19/19 cổng.** CORS expose của
   Y4 vẫn đúng qua route thật với code T3 mới: page cross-origin đọc
   được cả `Accept-Ranges: bytes` (HEAD) lẫn `Content-Range`
   (Range 0-0, kiểm tra mới của Z4 — Y4 chỉ kiểm HEAD). File base60
   cho số Y HỆT Y4/X4 (delta cửa sổ GOP 63 request / 37.528.720 byte
   = 101,16%, vẽ ngược 91 frame missing 0, cửa sổ lặp 0 request /
   0 byte). Không sửa code bridge trong luồng này.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopMoovHeader44Z4.test.ts` — 19 test (§5).
- `apps/web/scripts/gop-headed-heap-44z4.mjs` — harness đo heap biên
  + RSS (§3).
- `apps/web/scripts/gop-headed-bridge-44z4.mjs` — harness headed qua
  bridge thật + moov lớn (§4).
- `docs/PHASE9_ROUND44_Z4_GOP_LIMITS.md` — file này.

### 1.2 Sửa (mỗi file hunk nhỏ có marker ROUND44-Z4, trừ tsconfig)

- `apps/web/src/lib/gopRangeFetch39T3.ts` — thêm
  `findTruncatedMoovHeader` (+ interface `TruncatedMoovHeader`) và
  nhánh phân giải moov cắt dở ở bước 4 + dùng moov đã fetch ở bước
  5; cập nhật comment đầu module (bước 4/5). Không đổi probe 1 KiB,
  tiền tố mặc định, gate, demux, chia GOP, fallback nào khác.
- `apps/web/src/lib/gopMoovLarge43Y4.test.ts` — CHỈ 2 test T3 đổi kỳ
  vọng theo thiết kế mới (moov 16 MiB / 600 KiB: từ fallback gate
  `moov-unknown` thành thử fetch moov rồi fallback `moov-status-416`
  vì fake chỉ phục vụ tiền tố — kèm chú thích ROUND44-Z4 giải thích
  đây là thay đổi có chủ ý, không phải nới test). Mọi test gate /
  scan / wiring trong file này GIỮ NGUYÊN.
- `apps/web/tsconfig.json` — chỉ +1 dòng exclude cho test mới
  (tiền lệ Y4/X4; JSON không viết được comment nên "marker" ở đây
  là chính tên file `gopMoovHeader44Z4.test.ts` trong dòng thêm).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (gate nguyên vẹn),
`gopSizeProbe41W4.ts`, `gopCache40V2.ts`, `reverseWebcodecs.ts`
(controller dùng T3 với mặc định nên tự hưởng đường mới, không cần
sửa wiring), `server/bridge/src/index.js` (chỉ kiểm chứng fix CORS
của Y4, không sửa), ngưỡng 32 MiB / trần 128 MiB / trần moov
16 MiB / mặc định GOP TẮT, mọi file luồng khác đợt 44.
`apps/web/dist/` build lại lúc kiểm chứng không vào batch theo tiền
lệ. Không tự stage paths-loop hay ghi build-loop-log (parent gộp).

## 2. Thiết kế mới (đọc kỹ trước khi trích dẫn)

### 2.1 Vì sao gate không đổi mà T3 vẫn chạy được

Gate (`detectMoovPosition` + `resolveRangeGopFetch`) chỉ nhìn tiền
tố đã đọc: box moov cắt dở ở cuối tiền tố thì cả hai đều dừng tay
không — đó là kết luận ĐÚNG ở tầng prefix (chưa đủ bằng chứng).
Sai lầm của thiết kế cũ không nằm ở gate mà nằm ở T3: T3 kết luận
fallback ngay từ verdict prefix, dù header moov (8 byte, hoặc 16
byte largesize) đã nằm gọn trong tiền tố và khai đủ `size` để fetch
đúng range. Thiết kế mới tách hai tầng: gate vẫn là verdict prefix
(không đổi, test cũ giữ nguyên), T3 thêm bước phân giải header
trước khi kết luận.

### 2.2 `findTruncatedMoovHeader(prefix)` — hợp đồng

Quét box top-level như scanner cũ, nhưng khi gặp box moov mà
`start + size > prefix.length` thì TRẢ VỀ header thay vì dừng.
Tính chất an toàn (test khóa từng cái, §5):
- Chỉ trả về khi header moov nằm GỌN trong tiền tố; header tự nó bị
  cắt ở cuối tiền tố (< 8 byte còn lại, hoặc thiếu 16 byte largesize)
  → null, không đọc size từ header dở.
- `precededByMdat = true` khi có box mdat nằm gọn đứng trước moov:
  đó là moov cuối file — caller PHẢI từ chối đường mới (T3 làm vậy).
- Mọi box trước moov mà bị cắt dở (kể cả mdat khổng lồ) → null:
  header moov khi đó không nằm trong tiền tố, không có gì để fetch.
- Moov nằm gọn trong tiền tố → null (đường cũ xử lý).
- Moov `size == 0` (kéo tới hết file) → null (không giới hạn được
  range fetch).
- Moov sau box free (không nằm ở đầu file) vẫn tìm đúng: mọi box
  trước header moov đều nằm gọn trong tiền tố nên thứ tự đã đủ để
  kết luận moov là box media đầu tiên. Trường hợp này có test T3
  riêng (moov start = 132 sau free 100 byte → gop-range).

### 2.3 Thứ tự kiểm tra trong T3 (giữ nguyên thứ tự đường cũ)

Khi gate trả fallback VÀ vị trí moov là `unknown` (chỉ trường hợp
này mới xét phân giải — trailing vẫn fallback gate ngay):
1. `findTruncatedMoovHeader` → null hoặc `precededByMdat` → fallback
   gate `moov-unknown` như cũ, 0 request moov.
2. Kiểm tra lại gate với `moovPosition: "faststart"` → nếu
   Accept-Ranges/size chặn → fallback gate (lý do gate đó), 0
   request moov. Nghĩa là không fetch moov khi gate khác đã chặn
   (test: Accept-Ranges none + moov phình → `accept-ranges-unsupported`).
3. `truncated.size > maxMoovBytes` → `moov-too-large`, 0 request
   moov. Nhánh này nay chạm tới được thật (trước Z4 là code chết).
4. `start + size > knownSize` (khi đã biết size) → `moov-out-of-file`,
   0 request moov.
5. Chỉ khi đó mới `fetchRangeChecked` đúng range moov (kind `moov`,
   kiểm tra 206 + Content-Range khớp như mọi range khác); moov fetch
   lỗi (vd 416) → fallback `moov-status-416`, không GOP nửa vời.
6. Demux từ buffer moov đã fetch (copy như đường cũ), rồi fetch từng
   GOP như cũ. Controller không đổi gì mà vẫn hưởng đường mới vì nó
   gọi T3 với mặc định (prefix 512 KiB, trần 16 MiB).

### 2.4 Cái mới KHÔNG làm (ghi rõ để khỏi tưởng đã xong)

- Moov cuối file thật: header moov không nằm trong tiền tố vì mdat
  khổng lồ đứng trước — không có range nào để fetch từ tiền tố.
  Muốn GOP chạy được trên file này cần thiết kế đuôi file riêng
  (tail-scan: fetch đuôi file, tìm header moov, xác minh bằng parse
  — chưa thiết kế, chưa test, thuộc đợt sau; cấm đoán moov ở đuôi
  bằng heuristic chuỗi byte).
- Moov header tự nó bị cắt ở cuối tiền tố (moov bắt đầu trong ~8
  byte cuối tiền tố) → vẫn `moov-unknown`. Đây là biên hẹp (moov
  start trong 8 byte cuối) nhưng là fallback an toàn, không phải bug.
- T3 streaming (chỉ fetch GOP của cửa sổ): KHÔNG thuộc luồng này.
  T3 vẫn fetch mọi GOP lượt đầu — đó chính là lý do trần 128 MiB
  vẫn giữ (§0.3).

## 3. Đo heap ở biên 129 MiB và 256 MiB+ (headed thật)

### 3.1 Giàn đo (khác Y4 ở đúng chỗ cần khác)

- Fixture ffmpeg thật, cùng công thức Y4 §2 (testsrc2 1280×720 30 fps
  + sine 440 Hz, libx264 crf 18, -g 30, -bf 3, aac 128k, faststart):
  `big129.mp4` 220 s = 136.032.843 byte (**129,73 MiB**, 6600 sample,
  220 GOP); `big256.mp4` 435 s = 269.043.010 byte (**256,58 MiB**,
  13050 sample, 435 GOP). Fixture tạo bằng script ngoài repo, chỉ
  nằm ở scratch `~/scratch-round44-z4/` (KHÔNG dùng /tmp: tmpfs máy
  này chỉ 512 MiB, không đủ cho fixture 256 MiB + Chrome profile;
  mp4 đã xóa sau khi đo xong để gọn đĩa, JSON kết quả giữ lại ở
  scratch — muốn chạy lại thì tạo fixture bằng đúng lệnh này).
- Harness `gop-headed-heap-44z4.mjs`: server stream từ đĩa (không
  load cả file vào RAM Node như Y4 — tránh OOM/nhiễu RAM máy đo);
  Chromium headed thật từ cache ms-playwright (chromium-1248),
  Xvfb, `--disable-gpu` + `--enable-precise-memory-info` +
  `--js-flags=--expose-gc` (công thức Y4); poll `performance.memory`
  mỗi 100 ms trong lúc promise chạy để bắt đỉnh transient; thời
  gian cửa sổ controller lấy từ ffprobe (duration − 1 = 219 s /
  434 s), không hard-code 239.0 của Y4.
- Ba bước trong cùng page như Y4: (1) T3 trực tiếp, giữ outcome rồi
  nhả + gc; (2) Controller GOP + override trần test-only 512 MiB
  (CHỈ TRONG HARNESS, không đổi mặc định production); (3) Đối chứng
  production: trần mặc định 128 MiB → phải khóa.
- Số JS heap = `usedJSHeapSize`; tỷ lệ trong LIMITS này luôn tính
  theo DELTA so với baseline sau gc (như Y4), không phải peak tuyệt
  đối chia file (field `peakOverFile` trong JSON harness tính theo
  peak tuyệt đối — đọc JSON phải phân biệt hai định nghĩa này).

### 3.2 Số đo thật — file 129,73 MiB (10/10 cổng)

| Đo | Số thật |
|---|---|
| T3 trực tiếp | mode `gop-range`, 6600 sample, 220 GOP, 223 request (1 HEAD + 222×206 = probe + tiền tố + 220 GOP), 136.206.170 byte = 100,13% file; `totalGopRangeBytes` 135.680.858, `totalSampleBytes` = chunk data tổng 132.272.303 (khớp từng byte, max GOP 639.156 byte — trùng Y4), 0 GET toàn file |
| Baseline sau gc | JS heap used 0,68 MiB, gc có sẵn |
| T3: đỉnh transient | 139,72 MiB; delta so với baseline **139,04 MiB = 1,072× file** |
| T3: lúc giữ outcome | 129,78 MiB (delta 129,11 MiB = 0,995× file) |
| T3: sau nhả + gc | 0,80 MiB (delta chỉ **0,12 MiB** — transient nhả sạch) |
| Controller override 512 MiB | `gop-range`, probe `{head, 136032843}`, drawn 91, missing 0, canvas 100% pixel khác 0, retainedFileBytes 2.475.231; đỉnh JS heap 142,94 MiB (delta 142,26 MiB); sau decode + vẽ JS heap vẫn 142,94 MiB (frame cache 91 frame + chunk cửa sổ) |
| Đối chứng mặc định 128 MiB | ensure=false, failed=true, largeFileFallback=true, `gopMode=off`, probe `{head, 136032843}`; path đối chứng chỉ 1 HEAD, **0 GET toàn file, 0 byte body** — khóa S4 vẫn chặn đúng ở biên vừa vượt 128 MiB, không tải body rồi mới khóa |
| RSS cây Chrome (xem §3.4 về cách đọc) | baseline 1157,70 MiB; đỉnh T3 1418,19 MiB (delta **+260,49 MiB**); lúc giữ 1420,38 MiB (delta +262,68); sau nhả 1260,42 MiB (delta +102,72 còn giữ lại bởi allocator); đỉnh controller 1432,54 MiB (delta +274,84); sau decode + vẽ 1603,23 MiB (delta **+445,53 MiB**) |

### 3.3 Số đo thật — file 256,58 MiB (10/10 cổng)

| Đo | Số thật |
|---|---|
| T3 trực tiếp | mode `gop-range`, 13050 sample, 435 GOP, 438 request (1 HEAD + 437×206 = probe + tiền tố + 435 GOP), 268.876.201 byte = 99,94% file (dưới 100% vì range GOP không bao moov/ftyp/free); `totalGopRangeBytes` 268.350.889, `totalSampleBytes` = chunk data tổng 261.607.410 (khớp từng byte, max GOP vẫn 639.156 byte), 0 GET toàn file |
| Baseline sau gc | JS heap used 0,68 MiB, gc có sẵn (trùng biên 129 — baseline ổn định) |
| T3: đỉnh transient | 311,91 MiB; delta so với baseline **311,24 MiB = 1,213× file** |
| T3: lúc giữ outcome | 312,00 MiB (delta 311,32 MiB = 1,213× file) |
| T3: sau nhả + gc | 0,80 MiB (delta chỉ **0,13 MiB** — transient nhả sạch) |
| Controller override 512 MiB | `gop-range`, probe `{head, 269043010}`, drawn 91, missing 0, canvas 100% pixel khác 0, retainedFileBytes 2.475.525; đỉnh JS heap 281,92 MiB (delta 281,24 MiB); sau decode + vẽ JS heap 260,88 MiB |
| Đối chứng mặc định 128 MiB | ensure=false, failed=true, largeFileFallback=true, `gopMode=off`, probe `{head, 269043010}`; path đối chứng chỉ 1 HEAD, **0 GET toàn file, 0 byte body** |
| RSS cây Chrome (xem §3.4 về cách đọc) | baseline 1166,47 MiB; đỉnh T3 (lấy mẫu mỗi 1 s) 1589,80 MiB (delta **+423,33 MiB**); lúc giữ 1671,59 MiB (delta +505,12 — cao hơn đỉnh lấy mẫu vì chunk cuối về sau mẫu cuối); sau nhả 1261,74 MiB (delta +95,27 còn giữ lại bởi allocator); đỉnh controller 1719,63 MiB (delta +553,16); sau decode + vẽ 1955,75 MiB (delta **+789,28 MiB**) |

### 3.4 Đọc đúng số RSS + đường cong 3 điểm + quyết giữ trần

- **RSS cây là cận trên, không phải tổng bộ nhớ chính xác.** Harness
  cộng RSS của tiến trình browser + mọi tiến trình con qua `ps`:
  trang bộ nhớ chia sẻ (thư viện, buffer) bị tính trùng mỗi tiến
  trình, nên tổng tuyệt đối (baseline ~1,16 GB cho một Chrome mới)
  phình to; số có nghĩa là DELTA so với baseline cùng phiên. Ngoài
  ra RSS lấy mẫu mỗi 1 s trong lúc poll (không liên tục như JS heap
  100 ms) nên đỉnh RSS lấy mẫu là CẬN DƯỚI của đỉnh thật (bằng chứng:
  lúc giữ 1671,59 > đỉnh lấy mẫu 1589,80 ở file 256 MiB). Sau nhả +
  gc, JS heap về gần baseline nhưng RSS vẫn dư ~95–103 MiB: đó là
  allocator giữ lại arena chưa trả cho OS, không phải leak JS heap
  (JS heap đã chứng minh nhả sạch 0,12–0,13 MiB).
- **Bộ nhớ VideoFrame native RIÊNG LẺ vẫn chưa tách được.** RSS
  delta bao gồm cả JS heap + native frame + buffer mạng + allocator,
  không tách riêng được ở cấu hình này (không có
  `measureUserAgentSpecificMemory`); vì vậy điều kiện (2) của đợt 42
  chỉ mới đo được một nửa (RSS có, VideoFrame native chưa).
- **Đường cong 3 điểm (JS heap delta, under-load):**
  129,73 MiB → 1,072×; 141,52 MiB (Y4) → 1,087×; 256,58 MiB →
  1,213×. Tỷ lệ tăng theo kích thước — có thể do heap V8 tăng theo
  bậc + rác fetch chưa GC kịp trong lần chạy dài hơn (đỉnh lấy mẫu
  100 ms bắt cả rác thoáng qua), nhưng với chỉ 3 điểm under-load thì
  KHÔNG khẳng định nguyên nhân, chỉ khẳng định: không được ngoại suy
  phẳng 1,09×. Với luật tuyến tính còn nguyên của T3 (fetch mọi GOP
  lượt đầu), file càng lớn thì transient càng lớn theo file — mở
  trần mà không sửa T3 chỉ dời điểm vỡ.
- **Quyết giữ trần 128 MiB** (§0.3): thiếu cả 3 điều kiện đợt 42 —
  T3 streaming chưa có, VideoFrame native chưa đo riêng, cửa sổ
  quiet chưa có. Không có trần mới nào được đề xuất từ đợt này.

## 4. Headed qua route bridge Express thật (19/19 cổng)

### 4.1 Giàn đo

Harness `gop-headed-bridge-44z4.mjs` (fixture mặc định
`~/scratch-round44-z4/base60.mp4` + `moovlarge60.mp4`, cùng công thức
X4/Y4: 60 s, B-frame + audio AAC, faststart, base 37.100.156 byte —
byte-identical với fixture Y4; moovlarge 53.812.743 byte, moov đúng
16.777.216 byte, tạo lại bằng script Y4
`make-moov-large-fixture-43y4.py` từ base60):
- Bridge THẬT nguyên vẹn `server/bridge/src/index.js` (không sửa
  code bridge trong luồng này) trên cổng 8953 với
  `BRIDGE_WORK_DIR=~/scratch-round44-z4/bridge-work-44z4`,
  `BRIDGE_RATE_GENERAL=5000`. Fixture đặt sẵn vào `<work>/proxies/`
  (bridge-a/b = base60, bridge-c = moovlarge60) qua route thật
  `GET /api/proxy/file/:name` (Express sendFile, Range sẵn).
- Page/bundle serve từ server harness riêng trên loopback (bridge
  không có route static cho page) — đúng cấu hình cross-origin của
  web UI thật (vite :5173 → bridge :8787).
- Kế toán phía BROWSER bằng CDP Network (body byte suy từ
  Content-Range/Content-Length; HEAD = 0, như Y4). Chromium headed
  thật, công thức X4 (Xvfb, `--disable-gpu`, target type=page).

### 4.2 Số đo thật

Node kiểm tra bridge (không qua browser): HEAD → 200 +
`Content-Length: 37100156` + `Accept-Ranges: bytes`; Range 0-0 →
206 + `Content-Range: bytes 0-0/37100156` (giống Y4).

| Đo (qua bridge thật) | Số thật | So với Y4 |
|---|---|---|
| CORS từ page: HEAD | status 200, length đúng file, đọc được `Accept-Ranges: bytes`; `Access-Control-Allow-Origin` đọc từ JS vẫn null — ĐÚNG luật browser (ACAO không safelisted/không exposed), không phải lỗi CORS: bằng chứng CORS cho phép là fetch thành công (fetch bị chặn sẽ reject, không trả 200) | giống Y4 (fix exposedHeaders còn hiệu lực) |
| CORS từ page: Range 0-0 (Z4 mới) | status 206, đọc được `Content-Range: bytes 0-0/37100156` + `Accept-Ranges: bytes` từ JS | Y4 chỉ kiểm HEAD; Z4 kiểm thêm header này vì T3/probe cũng cần nó cross-origin |
| GOP base60: gopMode / probe | `gop-range`, probe `{head, 37100156}`, fallback null | giống hệt |
| GOP base60: delta cửa sổ | **63 request / 37.528.720 byte = 101,16% file** (1 HEAD probe + 62×206) | giống hệt từng byte với Y4/X4 |
| GOP base60: frame ngược | drawn 91, missing 0, canvas 921.600/921.600 pixel khác 0 (100%) | giống hệt |
| Cửa sổ lặp cùng mốc | **0 request / 0 byte** | giống hệt |
| Mặc định base60 | `off`, probe null, 1 HEAD + 1 GET toàn file = 37.100.156 byte, drawn 91, missing 0 | giống hệt |
| **GOP moovlarge60 (MỚI)** | **`gop-range`** (Y4: `full-file-fallback`), probe `{head, 53812743}`, fallback null, drawn 91, missing 0, canvas 100% | **đảo ngược Y4 — đây là bằng chứng đầu-cuối của thiết kế mới** |
| Moovlarge: request | delta **64 = 1 HEAD + 63×206** (probe + tiền tố + moov + 60 GOP), **0 GET toàn file**; đúng **1 response có Content-Range dài 16 MiB** (`bytes 32-16777247/53812743` — moov start 32, size 16.777.216) | Y4: 6 request, toàn bộ qua full-file |
| Moovlarge: byte | **54.305.936 = 100,92% file** (probe 1024 + tiền tố 524.288 + moov 16.777.216 + GOP 37.003.408) | Y4: 54.338.055 = 100,98% qua full-file |

Lưu ý kế toán (trung thực, không giấu): tổng path bridge-a của
harness là 37.528.721 byte, hơn Y4 đúng 1 byte — đó là byte của
chính request Range 0-0 kiểm tra CORS mà Z4 thêm vào (không phải
request của controller); delta cửa sổ GOP (63 request /
37.528.720 byte) mới là số so sánh được với Y4, và nó khớp từng
byte. Tương tự, path GOP tổng cộng trong log CDP gồm cả các request
kiểm tra CORS của chính harness — không phải request của controller.

## 5. Kiểm chứng + hồi quy

```
# Test mới Z4 + hồi quy (esbuild bundle, như T3/V2/W4/X4/Y4)
./node_modules/.bin/esbuild apps/web/src/lib/gopMoovHeader44Z4.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r44z4.test.cjs \
  && node /tmp/r44z4.test.cjs
```

| Nhóm | Kết quả thật |
|---|---|
| Z4 mới `gopMoovHeader44Z4` | **19/19** ngay sau khi sửa 1 lỗi builder test của chính Z4 (walk stco từ offset 8 thay vì 16 khi largesize — lỗi test, không phải lỗi production; đã sửa và chạy lại xanh, xem §5.1) |
| Hồi quy Y4 `gopMoovLarge43Y4` (sau khi cập nhật 2 test T3 §1.2) | **10/10** (gate/scan/wiring giữ nguyên xanh; 2 test T3 đổi kỳ vọng theo thiết kế mới) |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Headed heap biên 129 MiB | **10/10** cổng (§3.2) |
| Headed heap biên 256 MiB | **10/10** cổng (§3.3) |
| Headed bridge qua route thật | **19/19** cổng (§4.2) |
| `tsc --noEmit -p apps/web/tsconfig.json` | **0 lỗi** tại thời điểm Z4 chạy (tốt hơn Y4 — lúc đó còn lỗi file luồng song song; parent gộp vẫn nên chạy lại sau khi các luồng đợt 44 khác xong, vì repo đang sửa song song) |
| `vite build` (từ `apps/web/`) | **pass (5,57 s)**, chỉ cảnh báo chunk > 500 kB cũ |

### 5.1 Lỗi gặp trong lúc làm (ghi để khỏi vấp lại)

- Lần chạy đầu test Z4: 18/19 — test largesize fail với
  "không dịch được entry stco/co64 nào". Nguyên nhân là builder
  test của chính Z4: `shiftChunkOffsets` walk moov payload từ offset
  8 cố định, nhưng moov largesize có header 16 byte nên walk bắt đầu
  giữa header và parse sai. Sửa: truyền `headerLen` vào hàm walk.
  Đây là lỗi builder test, không phải lỗi production (production
  không có code dịch stco này) — nhưng nó chứng minh test builder
  cũng cần test riêng (test "moov phình cho cùng sample table" đã
  bắt được lỗi trước khi test T3 chạy).
- Lần chạy đầu harness heap Z4: không có lỗi — nhưng lưu ý harness
  Y4 dùng `/tmp/round43-y4/` đã bị xóa sạch giữa các lượt (tmpfs);
  Z4 dùng scratch trên đĩa (`~/scratch-round44-z4/`) và server
  stream từ đĩa để tránh cả hai vấn đề (mất fixture + RAM Node).

Mọi số headed đều under-load (các luồng đợt 44 khác đang chạy, có
lúc ffmpeg encode big256 song song với headed bridge) — cấm dùng
làm baseline quiet hay claim fps; số frame vẽ được là bằng chứng
chức năng, không phải tốc độ. Mọi headed đều Chromium Linux + Xvfb
+ `--disable-gpu` — không claim Safari / máy thật / màn hình vật lý
/ GPU thật.

## 6. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA MỞ: trần 128 MiB giữ nguyên.** Thiếu cả 3 điều kiện đợt
   42 (§0.3, §3.4). Muốn bàn lại cần: T3 streaming (chỉ fetch GOP
   của cửa sổ — phá luật tuyến tính), đo RSS + VideoFrame native
   tách riêng, lặp lại ở cửa sổ quiet. Không có trần mới nào được
   đề xuất từ đợt này.
2. **CHƯA LÀM: moov cuối file thật (trailing với mdat khổng lồ).**
   Vẫn fallback `moov-unknown` an toàn (0 request moov/GOP thừa).
   Cần thiết kế tail-scan riêng (fetch đuôi, tìm header moov, xác
   minh bằng parse) — chưa thiết kế, cấm đoán bằng heuristic.
3. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
   quiet / fps ngược.** Toàn bộ headed ở đây là Chromium Linux +
   Xvfb + render phần mềm, under-load.
4. **CHƯA ĐO: VideoFrame native tách riêng.** RSS delta đã có
   nhưng gồm cả JS heap + native + buffer mạng + allocator, lại
   tính trùng trang chia sẻ — chưa đủ làm ngân sách bộ nhớ chính
   xác cho quyết định trần.
5. **CHƯA ĐO: GOP qua bridge ở production thật (vite :5173 → bridge
   :8787)** — harness đo bridge :8953 từ origin harness :8930, cùng
   luật loopback CORS; cần click-test trên app thật để khẳng định
   lần cuối, dù luật CORS là như nhau.
6. **Harness phụ thuộc fixture ngoài repo:** mọi fixture (base60,
   moovlarge60, big129, big256) chỉ nằm ở `~/scratch-round44-z4/`
   (mp4 đã xóa sau đo để gọn đĩa; JSON kết quả
   `heap-result-big129.json`, `heap-result-big256.json`,
   `bridge-result-44z4.json` còn giữ ở đó); muốn chạy lại harness
   phải tạo fixture trước bằng đúng lệnh trong LIMITS này, script
   tự fail rõ khi thiếu. Không thứ nào trong số đó vào batch.
7. **Biên hẹp còn fallback:** moov bắt đầu trong ~8 byte cuối của
   tiền tố (header tự nó bị cắt) → vẫn `moov-unknown`; moov
   `size == 0` → fallback (không fetch range vô hạn). Cả hai đều là
   fallback an toàn, không phải bug dữ liệu.

## 7. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: + `findTruncatedMoovHeader` / `TruncatedMoovHeader` / nhánh phân giải moov cắt dở bước 4 / dùng moov đã fetch bước 5 + comment module; marker ROUND44-Z4)
- `apps/web/src/lib/gopMoovHeader44Z4.test.ts` (mới, 19 test)
- `apps/web/src/lib/gopMoovLarge43Y4.test.ts` (sửa: chỉ 2 test T3 đổi kỳ vọng theo thiết kế mới + chú thích ROUND44-Z4; gate/scan/wiring giữ nguyên)
- `apps/web/tsconfig.json` (sửa, chỉ +1 dòng exclude)
- `apps/web/scripts/gop-headed-heap-44z4.mjs` (mới, harness đo heap biên + RSS)
- `apps/web/scripts/gop-headed-bridge-44z4.mjs` (mới, harness headed qua bridge thật + moov lớn)
- `docs/PHASE9_ROUND44_Z4_GOP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round44-z4/` (JSON kết quả đo,
bundle/page/profile Chrome, bridge work-dir — KHÔNG đưa vào batch;
mp4 fixture đã xóa sau đo, tạo lại được bằng lệnh trong LIMITS này).

# Phase 9 đợt 94 — V3/V3b: blob-load flaky 42% — chẩn đoán xong, KHÔNG sửa production

**Nợ gốc:** LIMITS gộp đợt 93 §4 mục 9 — blob-load flaky 42% không giảm sau
fix flip-flop T1 (U2 đợt 93: load-play blob 5/12, loop 0/8; flip-flop 0/10 run app).
**Ngày:** 2026-11-12 (lượt cron 09:35 +07; V3 làm 02:35–03:25Z, V3b nối tiếp
03:32–03:44Z sau reboot #14).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không đụng TTS 39,
không đụng `.github/workflows`, 0 binary vào batch.
**Trạng thái: CHẨN ĐOÁN XONG — KHÔNG SỬA PRODUCTION.** Không có biến thể nào
trong 5 biến thể đo được sửa được flaky (tốt nhất blob-direct 8/12 = 67%,
vẫn thua xa progressive 12/12 = 100%). Nguyên nhân gốc đã thu hẹp tới
qtdemux đọc nhầm atom size tại đúng offset 2 MiB của file khi phát qua
blob — xem §6. Hướng sửa đề xuất cho đợt sau ở §9 (cần đo riêng, chưa làm).

## 1. Kết luận ngắn — bảng tỉ lệ gộp (68 case load-play, WebKitGTK 27.2)

| Biến thể | Ý nghĩa | Tỉ lệ pass | Fail theo chữ ký |
|---|---|---|---|
| A — prod (blob swap, preload auto) | control, code production hiện tại | **11/24 = 46%** | error-event 11, stall-timeout 2 |
| B — preload-none (probe-only) | hướng sửa S3 §2: element không preload http trước khi blob sẵn | **6/12 = 50%** | error-event 5, stall-timeout 1 |
| C — reset-swap (probe-only) | F2: removeAttribute + load() trước khi gán blob | **2/4 = 50%** | error-event 2 |
| D — fresh-element (probe-only) | F4: drop element cũ, tạo element mới với blob làm src đầu tiên | **2/4 = 50%** | error-event 1, stall-timeout 1 |
| E — blob-direct (probe-only) | blob làm src ĐẦU TIÊN, không http, không swap | **8/12 = 67%** | error-event 4 |
| prog — progressive thuần | đối chứng, không qua blob | **12/12 = 100%** | — |

Đọc đúng: **không biến thể nào sửa được flaky.** B/C/D ngang A trong sai số
(n=4 cho C/D — chưa đủ để nói "bằng", chỉ đủ để nói "không thấy cải thiện").
E tốt nhất (67%) nhưng vẫn fail 1/3 — và E **không có swap nào cả**
(swapMs = 0, httpLoadstart 0/12) mà vẫn fail cùng chữ ký → **fail KHÔNG
phải do swap http→blob gây ra** (xem §5–§6). Progressive 12/12 chứng minh
clip + máy + probe đều ổn; chỉ đường blob là hỏng.

## 2. MATRIX runs 1–3 — A/B/prog (36 case, xen kẽ từng run để khử nhiễu tải)

| Clip | A (prod) | B (preload-none) | prog |
|---|---|---|---|
| c2 (2,0 MB, 8 s) | 0/3 | 0/3 | 3/3 |
| c4 (4,0 MB, 16 s) | 1/3 | 2/3 | 3/3 |
| c6 (5,9 MB, 24 s) | 2/3 | 1/3 | 3/3 |
| c8 (7,8 MB, 32 s) | 3/3 | 3/3 | 3/3 |
| **Tổng** | **6/12 = 50%** | **6/12 = 50%** | **12/12 = 100%** |

- Flaky phụ thuộc clip: c2 fail 6/6 blob, c8 pass 6/6 blob. Không phải ngẫu
  nhiên thuần túy — xem §6 (giá trị bogus xác định theo clip).
- B không khác A (6/12 vs 6/12, cùng 36 case xen kẽ). B cũng **không ngăn
  được loadstart http**: httpLoadstart trước swap 8/12 ở B (A: 12/24) —
  preload-none chỉ làm element suspend ngay sau loadstart (ns=IDLE, không
  fetch dữ liệu), chứ không chặn được việc pipeline http khởi động. Hướng
  sửa S3 §2 (preload-none) **bị bác bằng đo đối chứng**.
- Tải không giải thích được fail: loadavg 1 phút lúc fail (mean 3,93) chỉ
  nhỉnh hơn lúc pass (3,08); fail xảy ra cả lúc máy nhẹ (MATRIX2 A 0/4 ở
  loadavg ~2–3).

## 3. MATRIX2 run 1 — C/D/E/A (16 case, mỗi clip 1 run mỗi biến thể)

| Clip | C reset-swap | D fresh-element | E blob-direct | A prod |
|---|---|---|---|---|
| c2 | 0/1 | 1/1 | 0/1 | 0/1 |
| c4 | 0/1 | 0/1 | 1/1 | 0/1 |
| c6 | 1/1 | 1/1 | 1/1 | 0/1 |
| c8 | 1/1 | 0/1 | 0/1 | 0/1 |
| **Tổng** | **2/4** | **2/4** | **2/4** | **0/4** |

- A 0/4 trong đợt này (cả 4 clip fail — 3 error-event + 1 stall-timeout) —
  đợt đo xấu nhất của A; không phải hồi quy (MATRIX A 6/12, MATRIX3 A 5/8),
  chỉ là phương sai theo đợt đo.
- C/D/E đều 2/4 — không biến thể nào tách khỏi A. F2 (reset-swap) và F4
  (fresh-element) **không sửa được flaky** ở n=4. Lưu ý: D (fresh element)
  vẫn fail 1 error-event + 1 stall-timeout — tức ngay cả element hoàn toàn
  mới, chưa từng chạm http, vẫn fail như thường.

## 4. MATRIX3 runs 4–5 — A/E (16 case, V3b chạy lại sau reboot)

| Clip | A (prod) | E (blob-direct) |
|---|---|---|
| c2 | 0/2 | 1/2 |
| c4 | 1/2 | 1/2 |
| c6 | 2/2 | 2/2 |
| c8 | 2/2 | 2/2 |
| **Tổng** | **5/8 = 63%** | **6/8 = 75%** |

- E hơn A 1 case trong đợt này (6/8 vs 5/8) — không có ý nghĩa thống kê.
  Gộp cả 2 đợt đo E: 8/12 = 67%.
- Đợt MATRIX3 đầu (9 case) bị reboot #14 cắt ngang sau Lc6-blobA-run4;
  V3b chạy lại đủ 16 case (matrix3b.log) và dedupe JSON giữ bản mới nhất
  cho 9 tên trùng — xem §10 mục 3.

## 5. Phân loại fail — 2 chữ ký, không lẫn nhau

**Chữ ký 1 — error-event (23/27 fail, 85%):**
- Diễn biến: swap (hoặc play, ở E) → error event **128–1126 ms sau**
  (median 430 ms, n=23) → `play()` reject `"The operation is not supported."`
  → handler fallback về http (http load tốt: loadeddata/canplay sau đó)
  → probe single-shot không play lại → **0 frame**.
- `errEvents[].code = null` là artifact (pool handler chạy trước, đã gán src
  mới về http trước khi listener của probe đọc `v.error`) — V3 đã ghi trong
  log; bằng chứng dùng `playErr` "not supported" (chữ ký code 4) + GST log.
- finalSrcKind = **http** ở cả 23/23 — fallback đã chạy, chỉ thiếu lần play lại.

**Chữ ký 2 — stall lặng (4/27 fail, 15%):**
- Không error event nào; blob pipeline stall im (stalled@~3,7–4,8 s),
  play() timeout 10 s, 0 frame, finalSrcKind = **blob** (không fallback vì
  không có error để kích handler).
- Gặp ở cả A (2), B (1), D (1) — không riêng biến thể nào.

**Căn cứ trong code production (`apps/web/src/media.ts`, `videoFor`):**
error handler chỉ làm 2 việc — (a) nếu src hiện tại là blob prefetch thì
thu hồi blob + đánh dấu skipped (không bao giờ retry blob cho source đó);
(b) fallback 1 lần về URL gốc (http), đồng bộ srcKey + latch. **Không có
lệnh play() lại nào trong handler** — nên sau khi fallback, element đứng
yên ở http đã load xong mà không ai bấm play. Đây chính là cơ chế biến
"lỗi blob" thành "0 frame" ở chữ ký 1.

## 6. Phân tích GST — qtdemux bogus: CẦN cho fail, CHƯA ĐỦ để fail

GST_DEBUG (`playbin:5,uridecodebin:5,qtdemux:5,decodebin:5,avidemux:5`) cho
mọi run blob; 52 log (1/case blob, 0 log thiếu sau dedupe).

**Tương quan bogus ↔ kết quả (52 case blob, dedupe giữ bản mới nhất/tên):**

| | FAIL | PASS |
|---|---|---|
| Có `bogus size` trong log | **24** | 6 |
| Không có `bogus size` | **0** | 22 |

- **Không có fail nào mà không có bogus** (0/24) — bogus là chữ ký cần thiết
  của mọi lần fail.
- Nhưng **6 lần pass vẫn có bogus** — bogus chưa đủ để fail (có thể bogus
  rơi vào pipeline phụ/bị teardown, hoặc demuxer hồi phục được). Đừng trích
  "bogus ⇒ fail" — chỉ được trích "fail ⇒ bogus".

**Phát hiện mới của V3b — giá trị bogus là byte thật của file tại đúng
offset 2 MiB (đo bằng script, không đoán):**

| Clip | Giá trị bogus chính | Offset của 4 byte đó trong file |
|---|---|---|
| c2 | 3946787710 (0xEB3F337E) | **2097152 = 2 MiB** |
| c4 | 1805683823 (0x6BA08C6F) | **2097152 = 2 MiB** |
| c6 | 3958285619 (0xEBEEA533) | **2097152 = 2 MiB** |
| c8 | 570402281 (0x21FFA5E9) | **2097152 = 2 MiB** |

- Kiểm chứng: đọc 4 byte big-endian tại offset 2097152 của mỗi clip =
  đúng giá trị bogus của clip đó (18/18 lần c2, 10/10 c4, 6/6 c6, 7/7 c8
  trong toàn bộ log). Giá trị hiếm 162705492 (Lc2-blobB-run3) nằm tại
  2097184 = 2 MiB + 32. Giá trị hiếm thứ hai 3555402558 (c8, 1 lần ở
  MATRIX3 re-run) KHÔNG tìm thấy trong file c8 — ngoại lệ duy nhất, có
  thể từ pipeline khác/đọc dở.
- Cấu trúc MP4 của cả 4 clip: `ftyp(32) free(8) mdat(...) moov` — **moov
  ở CUỐI file** (không faststart). qtdemux muốn phát thì phải seek tới
  moov ở cuối file.
- **0 lần chuỗi "blob" trong mọi GST log (52/52);** `playbin set uri`
  luôn là `http://127.0.0.1:8897/cX.mp4` — WebKitGTK **không bao giờ đưa
  blob: URI cho playbin**. Dữ liệu blob phải đi qua một đường khác (không
  quan sát được từ log này).

**Đọc giả thuyết (ghi rõ là giả thuyết, chưa chứng minh):** khi phát qua
blob, qtdemux lúc seek tới moov ở cuối file đã đọc nhầm dữ liệu media tại
ranh giới 2 MiB thành atom header ("atom has bogus size ...") rồi báo
"Internal data stream error" / "no playable streams". Tính xác định theo
clip (cùng 1 giá trị cho cùng 1 clip, mọi lần) khớp với việc cùng 1 offset
bị đọc nhầm mọi lần. Cần test riêng để khẳng định: clip faststart (moov ở
đầu file, qtdemux không cần seek tới cuối) — nếu blob-load hết flaky thì
giả thuyết đúng; nếu vẫn fail thì cơ chế nằm chỗ khác (xem §9).

**Bác bỏ giả thuyết cũ của S3 §2:** S3 nói lỗi nổ trên demuxer pipeline
HTTP CŨ lúc teardown sau swap. V3 đã bác một phần ở run 1 (Lc2-A: lần
qtdemux fail duy nhất ~320 ms SAU swap, lúc blob preroll; teardown lúc
swap sạch). V3b bổ sung: **E không có swap, không có pipeline http cũ để
teardown, vẫn fail cùng chữ ký + cùng bogus** — teardown không thể là
nguyên nhân duy nhất. Teardown có thể vẫn góp phần ở một số run (bogus
xuất hiện cả ở run pass), nhưng không phải cơ chế chính.

## 7. Vì sao từng hướng sửa không có tác dụng (bằng chứng)

- **preload-none (B):** không ngăn loadstart http (8/12 vs A 12/24),
  loadedData trước swap 2/12 vs A 3/24 — element vẫn khởi động pipeline
  http rồi suspend. Và fail xảy ra cả khi http chưa load gì (loadedMeta/
  loadedData 0 ở nhiều run fail). Tỉ lệ 6/12 = A 6/12.
- **reset-swap (C):** teardown đồng bộ trước khi gán blob không đổi gì
  (2/4, fail cùng chữ ký error-event 283 ms / 1126 ms sau swap).
- **fresh-element (D):** element mới tinh vẫn fail (2/4, 1 error-event
  617 ms sau swap + 1 stall lặng) — loại trừ "element bị nhiễm bởi
  pipeline http cũ".
- **blob-direct (E):** loại bỏ hoàn toàn swap + http, vẫn fail 4/12 cùng
  chữ ký (error-event 359–630 ms sau play, finalSrc=http sau fallback) —
  loại trừ swap là nguyên nhân. Đây là bằng chứng mạnh nhất: **lỗi nằm
  trong đường phát blob của WebKitGTK/GStreamer, không nằm trong code
  swap của MediaPool.**

## 8. Kiểm chứng

- `node --check benchmarks/render/webkit_blob_flaky_94v3.mjs`: pass
  (V3; V3b không sửa probe).
- Không sửa code production (`src/` không đổi) → không cần tsc/vite
  build; không đụng `seek.test.ts`, không đụng TTS 39, không đụng
  `.github/workflows`.
- MATRIX 36 case + MATRIX2 16 case + MATRIX3 16 case (re-run sau reboot)
  = **68 case load-play**, tất cả đều có GST log riêng (52 log blob;
  prog không bật GST).
- Không process mồ côi của V3b: Xvfb :199 do V3b bật vẫn chạy (display
  server dùng chung, để lại như tiền lệ các luồng khác); mọi browser
  probe đã đóng (browser.close() trong finally của probe).
- Smoke trước khi đo (V3): probe U2 L2 blob FAIL stall lặng ngay run đầu,
  prog PASS 46 frame — flaky tái hiện trước khi viết probe mới.

## 9. Quyết định + nợ cho đợt sau (CHỈ chẩn đoán, không sửa)

**Quyết định: KHÔNG sửa production trong luồng này.** Không biến thể nào
có bằng chứng sửa được flaky; sửa mò (retry, đổi preload, đổi thứ tự swap)
đều đã bị đo bác hoặc chưa có số đo ủng hộ. Sửa production mà không có
bằng chứng trước/sau sẽ là đoán — trái quy tắc trung thực của vòng lặp.

**Đề xuất đo cho đợt sau (theo thứ tự ưu tiên):**
1. **Clip faststart (moov ở đầu file) — test giả thuyết §6, ưu tiên cao
   nhất:** re-encode c2/c8 với `-movflags +faststart`, chạy MATRIX A
   (prod) n=12. Nếu blob-load về ~100% thì nguyên nhân là moov-seek qua
   blob; nếu vẫn ~50% thì cơ chế nằm chỗ khác và phải bỏ giả thuyết này.
   (Đây là test rẻ, phân biệt được 2 giả thuyết, chưa ai làm.)
2. **Retry-play sau error-fallback (mitigation, đo trước/sau):** sửa
   handler trong `media.ts` (hoặc caller của `play()`) để khi error sau
   blob → fallback http xong thì `play()` lại 1 lần. Kỳ vọng: cứu được
   phần lớn 23 fail error-event (http sau fallback đã loadeddata/canplay).
   Cần đo MATRIX A trước/sau (n=12 mỗi bên) + kiểm chứng flip-flop không
   hồi quy (U2: 0/10 run app) + O8 cả 2 engine. CHƯA đo — không claim
   trước.
3. **Tăng n cho C/D nếu còn muốn cứu hướng swap:** hiện n=4 mỗi biến thể,
   khoảng tin cậy rộng (±25pp) — không đủ để loại trừ hoàn toàn một cải
   thiện nhỏ. Nhưng với E đã chứng minh fail không cần swap, giá trị của
   việc này thấp.
4. **Chữ ký stall lặng (4/27 fail) chưa có cơ chế:** blob pipeline stall
   im không error, không fallback — cần GST log riêng cho các run này
   (đã có log: Lc2-blobA-run3, Lc4-blobB-run3, Lc2-blobA-run1/MATRIX2,
   Lc4-blobD-run1) để xem demuxer kẹt ở đâu.

## 10. Chuyện bên lề khi đo (ghi trung thực)

1. **Reboot #14 (03:25Z, boot 0597b689)** giết V3 giữa MATRIX3 (dừng sau
   Lc6-blobA-run4, 9/16 case). Resume của parent không có tác dụng (agent
   vẫn "interrupted", 0 hoạt động đĩa sau ~6 phút) → spawn V3b 03:32Z làm
   tiếp từ đĩa (không làm lại từ đầu).
2. **Khôi phục môi trường sau reboot (V3b):** `cp -an
   ~/workspace/tmp-q6r3-debroot/. /` → libevent-2.1.so.7 + 269 plugin
   gstreamer; `glib-compile-schemas` → gschemas.compiled 41.821 B (trước
   khi chạy lại chỉ còn 2.349 B); Xvfb :199 mới.
3. **Trùng tên case giữa các mode (lỗi thiết kế probe, V3 đã mắc):**
   MATRIX2 A-run1 và MATRIX A-run1 cùng tên `LcX-blobA-run1`; MATRIX3
   A/E-run4/5 chạy lại trùng tên với đợt MATRIX3 bị reboot cắt. File
   JSON của probe append theo tên nên dedupe (giữ bản mới nhất) còn 64
   case — **4 case MATRIX A-run1 bị ghi đè bởi MATRIX2 A-run1** trong
   file JSON. Số liệu đầy đủ, không trùng tên, đã tách riêng trong
   `hidden_files/round94-v3/analysis-cases.json` (68 case, có trường
   `_batch`) — mọi bảng trong LIMITS này tính từ file đó, KHÔNG tính từ
   JSON đã dedupe. Đợt sau nên thêm hậu tố mode vào tên case trong probe.
4. **Lỗi đo run 1 (V3 đã vá):** cờ `http*BeforeSwap` nhiễm event của
   pipeline http fallback — đã vá probe (chỉ đếm event khi `swapMs ===
   null`); `errEvents code=null` là artifact — dùng playErr + GST log
   thay thế (xem §5).
5. **Số đo chỉ cho 1 họ clip testsrc2 720p, moov ở cuối, 1 cửa sổ tải**
   (loadavg 1-phút 1,5–12,5 lúc đo); không suy ra cho clip faststart,
   4K, codec khác, hay Safari thật. Chỉ đúng WebKitGTK 27.2 +
   GStreamer trên VM này.

## 11. File thay đổi (stage, KHÔNG push)

- `benchmarks/render/webkit_blob_flaky_94v3.mjs` — probe V3 (MATRIX /
  MATRIX2 / MATRIX3, 5 biến thể probe-only, GST_DEBUG từng run).
- `benchmarks/results/webkit-blob-flaky-94v3.json` — kết quả 64 case
  sau dedupe (giữ bản mới nhất/tên); bản đầy đủ 68 case không trùng
  trong `hidden_files/round94-v3/analysis-cases.json` (ngoài repo, không
  stage).
- `docs/PHASE9_ROUND94_V3_BLOB_FLAKY_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round94-v3-blob-flaky`
(`~/workspace/repo-1-push/paths-loop/phase9-round94-v3-blob-flaky.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v3.md`.
Log chạy: `hidden_files/round94-v3/matrix{1,23,2-r1,3,3b}.log` + `gst/`
(52 log) + `bundle/` (4 bundle probe-only).

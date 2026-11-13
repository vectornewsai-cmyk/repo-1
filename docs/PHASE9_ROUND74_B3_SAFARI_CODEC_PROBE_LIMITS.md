# Phase 9 đợt 74 — B3: Codec-probe lúc import + tên file mẫu theo container (Safari)

Ngày: 09/11/2026, lượt cron 18:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 73 §4 mục 7 (A7 §4.3 S5 + §5.2–5.3): import VP9/WebM/AV1
chưa có codec-probe; tên file media mẫu vẫn `.webm`.

**Kết luận ngắn:**
1. **Codec-probe lúc import ĐÃ CÓ.** Module mới `lib/codecProbe.ts`:
   sniff header thật (MP4 `stsd`, WebM EBML CodecID) để biết codec,
   hỏi `canPlayType` của trình duyệt đang chạy (quyết định verdict),
   ghi thêm `MediaSource.isTypeSupported` để chẩn đoán (không đổi
   verdict). File verdict `unsupported` → toast báo ngay lúc import
   (file vẫn import được, export FFmpeg không ảnh hưởng) + gắn cờ
   `unsupportedCodec` lên MediaItem. Kiểm chứng headed trên Chromium
   1254 thật: HEVC MP4 → `unsupported` + toast hiện đúng câu trong
   app thật; AV1/H.264/VP9 → `supported`, không toast oan.
2. **Tên file mẫu theo container thật.** `sample.ts` (`mau-*`) và
   `recordPackMedia` (`pack-*`) nay đặt đuôi theo `rec.mimeType`:
   Chromium ghi webm → tên `.webm` như cũ; Safari ghi mp4 → tên
   `.mp4`, khớp bytes. Kiểm chứng headed: `buildSampleProject` thật
   trên Chromium ra `mau-1.webm`/`mau-2.webm`, blob `video/webm`,
   138.316 / 262.021 byte, spec `src` khớp tên, duration 4 s.
   Nhánh `.mp4` chỉ kiểm chứng bằng mock recorder (không có Safari)
   — xem §5.
3. **Safari thật VẪN CHƯA ĐO ĐƯỢC** (VM này không có Safari/WebKit).
   Mọi kết luận về Safari là suy ra từ API công khai + hành vi
   `MediaRecorder`/`canPlayType` đã biết, KHÔNG phải số đo Safari.

## 1. Codec-probe — thiết kế

### 1.1 Vì sao cần sniff header, không đoán theo đuôi

Đuôi `.mp4` không nói lên codec: cùng một container có thể là H.264,
HEVC hay AV1 — mà trình duyệt chơi được cái này chưa chắc chơi được
cái kia (Chromium Linux: H.264/AV1 `probably`, HEVC `""`). Probe sai
codec là báo sai. Vì vậy:

- **Sniff MP4** (`sniffMp4Codec`): đi box `moov → trak → mdia →
  minf → stbl → stsd`, đọc sample-entry đầu (`avc1/avc3 → H.264`,
  `hvc1/hev1/dvh* → HEVC`, `av01 → AV1`, `mp4v`, `mp4a → AAC`).
  Chỉ quét slice đầu 1 MiB; moov nằm sau `mdat` (file chưa faststart)
  → trả null, không phải lỗi. Header cắt/rác/format lạ → null.
- **Sniff WebM** (`sniffWebmCodec`): tìm phần tử EBML CodecID
  (`0x86` + vint size + chuỗi `V_VP9`/`V_VP8`/`V_AV1`/`A_OPUS`/…).
  Đọc đúng cấu trúc vint — chuỗi `V_VP9` thô trong metadata/title
  KHÔNG được nhận (test khóa).
- **Verdict** (`probeCodecSupport`, hàm thuần):
  - Sniff được codec → chỉ mime của codec đó là *decisive*: HEVC
    `""` → `unsupported` dù H.264 `probably`.
  - Không sniff được → probe mọi ứng viên của container, verdict lấy
    tốt nhất; chỉ `unsupported` khi TẤT CẢ đều `""` (không báo oan
    file nào mà trình duyệt chơi được bằng một codec nào đó).
  - `MediaSource.isTypeSupported` ghi vào từng ứng viên (`tried[].mse`
    + `mseSupported`) để chẩn đoán, KHÔNG đổi verdict: MSE ≠ element
    playback (vd Safari phát HEVC bằng element nhưng MSE có thể khác).
- **Không có bảng phiên bản trình duyệt hard-code**: kết quả là lời
  của trình duyệt đang chạy — đúng cả trên Safari thật khi có máy đo
  (VP9/WebM cần Safari ≥ 14.1, AV1 cần Safari 17+ — chỉ là kiến thức
  API công khai, chưa đo).

### 1.2 Nối vào import (`store.ts` `importFiles`)

- Mỗi file: `probeImportedFileCodec(f)` (async, đọc slice đầu 1 MiB)
  TRƯỚC `fileToMediaItem(f)`, rồi mới `items.push(item)`. Probe
  không bao giờ throw (fail-open → null, import tiếp tục như cũ).
- Verdict `unsupported` → `item.unsupportedCodec = "HEVC / MP4"` +
  toast `error` bằng key mới `mediabin.codecUnsupported` ({name}
  {codec}) SAU khi tên đã chốt duy nhất — toast nêu đúng tên trong
  bin. Một toast mỗi file (xem giới hạn §4).
- Verdict `maybe` → KHÔNG toast: `maybe` là đáp án thường cho mime
  container trần trên Chromium (`video/webm`/`video/mp4` → `maybe`)
  — toast lúc đó chỉ là nhiễu.
- File không rõ kind (vd `.txt`, `type` rỗng + đuôi lạ) → probe trả
  null, bỏ qua lặng lẽ (đường cũ `fileToMediaItem` vẫn loại file đó).

### 1.3 i18n — 1 key mới, dict 2400 → 2405

Key mới `mediabin.codecUnsupported` (vi ≠ en, placeholder {name}
{codec} khớp hai bên; số key vi==en giữ 54):
- vi: "Trình duyệt này không phát được “{name}” ({codec}) — file vẫn
  import được, nhưng xem trước có thể không có hình; xuất file vẫn
  dùng được."
- en: "This browser can’t play “{name}” ({codec}) — the file was
  imported anyway, but preview may show no picture; export still works."

**Chia sẻ file chung với luồng B9 (chạy song song):** lúc B3 đọc dict
đã là 2404 (B9 thêm 4 key `caption.karaokeStyle*` + bump test
2400 → 2404 trước). B3 thêm 1 key → **2405**, bump 2404 → 2405 ở
10 test khóa số key (i18nAudit59P7, i18nRound57N4, reverseBadge46B6,
reverseCompat44Z6, reversePlaybackI18n49E2, reverseToggleI18n48D4,
saveToast31, structuredNotes32, i18nOrphans60Q4,
ProjectMenu.i18n55L1) + 2 comment (speedWarnTooShortDead63R10,
errorDetail34Q4). Parent gộp cần đếm lại nếu luồng khác còn thêm
key sau thời điểm này. File `vi.json`/`en.json` + các test khóa số
key là file chung B3/B9 — cả hai luồng đều sửa, không ghi đè lẫn
nhau (đã kiểm: tsconfig có cả 2 test mới, dict vi=en=2405).

## 2. Tên file mẫu theo container thật

- `lib/sampleMime.ts`: thêm `extensionForContainer(mimeType)` —
  `video/mp4` → `"mp4"`, còn lại → `"webm"` (giữ tên cũ trên Chromium).
- `sample.ts`: `ext = isVideo ? extensionForContainer(blob.type) :
  "png"` — `blob.type` đã là container thật từ đợt 73 A7, nên tên
  khớp bytes. Spec `src` lấy từ chính tên này → liên kết không vỡ
  (quy tắc (c) ở `templateContentLocale.ts` là "không localize tên",
  không cấm suy đuôi từ container — đã cập nhật chú thích ở đó).
  Vòng tỉa manifest mẫu nay tỉa cả tên cũ mang đuôi còn lại
  (`mau-1.webm` ↔ `mau-1.mp4`) để bản mẫu Safari trước đợt này
  không nằm lại IndexedDB mãi thành mồ côi.
- `lib/sampleMedia.ts` `recordPackMedia`: sau khi biết
  `containerType`, tên file trả về đổi `.webm` → `.mp4` khi container
  là mp4 (Chromium giữ `.webm` — test R5 khóa tên `ok.webm` vì mock
  recorder không có `mimeType` → container webm). `generatePackFiles`
  lấy `fileNames` từ `gen.file.name` nên spec `src` nhận đúng tên
  cuối; `templatePack.ts:159` chỉ còn là "tên yêu cầu".
- Không đổi: `stillPackMedia` (ảnh PNG), mọi fixture test dùng tên
  `mau-*.webm` làm chuỗi mẫu (rehydrate/discard — đó là dữ liệu cũ,
  không phải code tạo tên).

## 3. Kiểm chứng (chạy thật trên VM này)

### 3.1 Unit — `codecProbe74B3.test.ts`: 19/19 pass

- `extensionOfFileName`, `sniffMp4Codec` (avc1/avc3/av01/hvc1/hev1/
  mp4v đúng tag; header cắt/rác/format lạ → null),
  `sniffWebmCodec` (V_VP9/V_VP8/V_AV1/A_OPUS/A_VORBIS đúng tag;
  chuỗi thô không `0x86` → null).
- Verdict với env giả: webm VP9 → supported; MP4 HEVC đã sniff →
  unsupported dù H.264 probably; MP4 AV1 đã sniff + env kiểu Safari
  cũ (AV1 `""`) → unsupported; MP4 không sniff + H.264 probably →
  supported (không báo oan); chỉ generic `maybe` → maybe; mọi ứng
  viên `""` → unsupported; MP3 → supported; MSE ghi nhận, vắng MSE
  → null; file lạ → null.
- `extensionForContainer`: mp4 → mp4, webm → webm, lạ → webm.
- `recordPackMedia` với mock recorder: mimeType `video/mp4`
  (Safari) → file `pack-x.mp4`/`video/mp4`; mimeType webm
  (Chromium) → `pack-x.webm` không đổi.
- Chạy qua `scripts/run-node-test.mjs` (bundle esbuild cjs — file
  import `sampleMedia.ts` không đuôi `.ts` nên không chạy trực tiếp
  bằng node strip-types; vòng chạy test bọc async IIFE vì cjs không
  cho top-level await).

### 3.2 Headed Chromium 1254 (headless shell + CDP headless=new)

- **Baseline `canPlayType`** (đo thật, headless shell):
  `video/webm;codecs="vp9"` probably, `video/webm` maybe,
  `video/mp4;codecs="avc1.42E01E"` probably,
  `video/mp4;codecs="hev1.1.6.L93.B0"` `""`,
  `video/mp4;codecs="av01.0.05M.08"` probably, `video/mp4` maybe;
  MSE: AV1 true, HEVC false.
- **Adapter thật** (`probeImportedFileCodec`, bundle esbuild, file
  tổng hợp có header codec thật): `hevc.mp4` → unsupported
  (HEVC / MP4, canPlayType `""`, mse false); `av1.mp4` → supported
  (probably, mse true); `h264.mp4` → supported; `vp9.webm` →
  supported; `empty.mp4` (không sniff được) → supported qua fallback
  tốt nhất (H.264 probably — không báo oan); file không đuôi +
  `type` rỗng → null (bỏ qua).
- **App thật** (dist vừa build, CDP headless=new, import qua
  `DOM.setFileInputFiles` vào đúng input MediaBin): import
  `hevc.mp4` 88 byte → toast hiện đúng câu
  "Trình duyệt này không phát được “hevc.mp4” (HEVC / MP4) — …" và
  file có trong bin. Đối chứng `av1.mp4` → không toast, file vào
  bin sau ~1 s. (Lưu ý: lần chạy đối chứng đầu tiên báo bin không có
  file — đo lại bằng script chẩn đoán thì file vào bin ở t+1 s; kết
  luận lần đầu là flake đo CDP, đã bị đo lại bác bỏ.)
- **Sample thật** (`buildSampleProject` qua CDP headless=new, thời
  gian thực): `mau-1.webm`/`mau-2.webm`, kind video, file type
  `video/webm`, size 138.316 / 262.021 byte, spec `src` khớp tên,
  duration 4 s — sample vẫn load được, tên không đổi trên Chromium.
  (Chế độ `--dump-dom` + virtual-time không bơm rAF nên vòng ghi
  mẫu 4 s × 2 không settle được ở đó — phải lái bằng CDP headless=new
  mới đo được; `/opt/meta-chromium/chrome` bị chặn bởi policy
  "Hatch WebGL domain policy is required", không dùng được.)
- **Phát hiện thêm (nằm ngoài phạm vi, KHÔNG sửa):** file `.mp4`
  cụt 88 byte (chỉ ftyp+moov, không mdat) vẫn làm `probeVideo`
  settle bằng `error` — cả HEVC lẫn AV1 đều `error (settled)` trong
  harness riêng, nên `fileToMediaItem` không treo với file cụt này.
  (Kiểm tra này bác bỏ giả thuyết treo ban đầu khi đối chứng AV1
  báo bin trống — xem §3.2.)

### 3.3 Hồi quy

- `tsc --noEmit` (apps/web): **0 lỗi** (lúc chạy có 2 lỗi TS5097 ở
  file test của luồng B9 chưa kịp exclude — B9 tự sửa sau đó, lần
  chạy lại sạch hẳn).
- `vite build`: **pass** (30,41 s; cảnh báo chunk > 500 kB có sẵn).
- `sampleMime73A7` 4/4, `recordPackMedia61R5` 8/8,
  `keyframeBeyond90Round73A7` 18/18, `i18nAudit59P7` pass (dict
  2405, vi==en 54), `i18nOrphans60Q4` **16/16** (0 key mồ côi),
  `i18nRound57N4` 14/14, `reverseBadge46B6` 8/8,
  `reverseCompat44Z6` 10/10, `reversePlaybackI18n49E2` 3/3,
  `reverseToggleI18n48D4` 3/3, `saveToast31` 15/15,
  `structuredNotes32` 12/12, `ProjectMenu.i18n55L1` 6/6,
  `templateContentLocale56M7` 10/10, `loadSampleQueue49E6` 13/13,
  `rehydrate36S5` 27/27, `discardRestore35R6` pass,
  `binPersist59P1` 17/17, `importAsset37T3` 8/8,
  `npm run test:unit` (render self-tests) pass.

## 4. Giới hạn / nợ mở

1. **Safari thật chưa đo.** Nhánh `.mp4` của tên mẫu + ma trận
   VP9/AV1 theo phiên bản Safari chỉ kiểm chứng bằng mock + kiến
   thức API công khai. Cần máy macOS/iOS thật (hoặc dịch vụ cloud có
   Safari) để đo: (a) `canPlayType` VP9/WebM + AV1/HEVC theo phiên
   bản; (b) tên mẫu `mau-1.mp4` + phát được trên Safari thật;
   (c) toast import hiện đúng trên Safari.
2. **Sniff MP4 chỉ đọc slice đầu 1 MiB.** File chưa faststart
   (moov sau mdat > 1 MiB) → sniff null → fallback "tốt nhất" (có
   thể lạc quan — không toast oan, nhưng có thể bỏ lọt cảnh báo).
   File moov nằm trong 1 MiB đầu (đa số file thường/faststart) thì
   sniff đúng.
3. **Sniff WebM chỉ tìm CodecID đầu tiên.** File nhiều track
   (video VP9 + audio Opus) → lấy codec của track đầu gặp — đủ cho
   verdict video; track audio lạ đi kèm không được probe riêng.
4. **Một toast mỗi file không hỗ trợ.** Import cùng lúc nhiều file
   VP9/AV1 trên Safari cũ → nhiều toast chồng nhau (tự đóng sau
   4,5 s). Chưa gộp thành một toast tổng.
5. **File `type` rỗng + không đuôi → probe bỏ qua.** Trình duyệt/OS
   không gán `type` và tên không có đuôi thì không xác định được
   kind — đường cũ `fileToMediaItem` cũng loại file đó (nợ cũ,
   không thuộc đợt này).
6. **`probeVideo` (media.ts) không có timeout.** File cụt 88 byte
   vẫn settle bằng `error` (đã đo), nhưng file video hỏng theo cách
   khác có thể treo import (mẫu đợt 66 T6 đã thêm timeout cho
   `captureVideoThumb`, chưa cho `probeVideo`) — nợ riêng, không
   sửa trong đợt này vì ngoài phạm vi B3.
7. **WebKit thật (Playwright webkit-2388) có trong cache nhưng
   không có driver playwright** (không có package node/python) nên
   không lái được để đo gần-Safari; chỉ dùng Chromium 1254 đo.
8. **File chung với B9**: dict + test khóa số key + tsconfig đều
   do hai luồng cùng sửa — parent gộp cần đếm lại dict nếu có luồng
   thứ ba thêm key sau thời điểm này.

## 5. Files (stage, KHÔNG push)

- Mới: `apps/web/src/lib/codecProbe.ts`,
  `apps/web/src/lib/codecProbe74B3.test.ts`,
  `docs/PHASE9_ROUND74_B3_SAFARI_CODEC_PROBE_LIMITS.md`.
- Sửa: `apps/web/src/store.ts` (probe + toast lúc import),
  `apps/web/src/media.ts` (field `unsupportedCodec`),
  `apps/web/src/lib/sampleMime.ts` (`extensionForContainer`),
  `apps/web/src/sample.ts` (đuôi theo container + tỉa chéo),
  `apps/web/src/lib/sampleMedia.ts` (đổi đuôi `.mp4` khi ghi mp4),
  `apps/web/src/lib/templatePack.ts` + `templateContentLocale.ts`
  (comment), `apps/web/src/i18n/vi.json` + `en.json` (+1 key
  `mediabin.codecUnsupported`), `apps/web/tsconfig.json` (exclude
  test mới), 10 test khóa số key 2404 → 2405 + 2 file comment
  (chia sẻ với luồng B9 — xem §1.3).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round74-b3-safari-codec-probe.txt`.

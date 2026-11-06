# Phase 9 đợt 48, luồng D4 — GOP end-to-end trong app thật + i18n toggle TopBar — LIMITS

Ngày: 05/11/2026 (giờ +07). Đóng nợ C5 §7.2 (end-to-end trong app thật
với file lớn) và §7.3 (key i18n cho toggle TopBar). KHÔNG push, KHÔNG
release/tag, KHÔNG code giả, KHÔNG binary/dist vào batch. Không tự
stage paths-loop hay ghi build-loop-log (parent gộp, như tiền lệ B4/C5).
Trần wiring 128 MiB / trần moov 16 MiB / tiền tố 512 KiB / gate U2 GIỮ
NGUYÊN. Không sửa file của luồng khác đợt 48; snapshot i18n của B6/Z6
xem §5.2 (parent gộp cập nhật số, D4 không đụng file luồng khác).

## 0. Kết luận ngắn (không vượt số đo)

1. **End-to-end trong app thật: PHÁT NGƯỢC CHẠY, GOP KHÔNG BẬT —
   đây là phát hiện chính của đợt.** Mở file trailing 37 MiB trong
   app thật → thêm vào timeline → End về cuối → bấm "Phát ngược":
   playhead lùi 72 → 50 s trong 45 s quan sát, canvas preview hiện
   **35 frame KHÁC NHAU** (hash pixel downscale 32×18, 0 mẫu đen),
   `__vcutReverseWc.hits +10`, 0 uncaught exception, 0 console error
   — 13/14 cổng headed pass. Nhưng `gopActive` KHÔNG BAO GIỜ true:
   controller rơi về full-file với lý do
   `gate: moov-unknown: chưa xác định được vị trí moov từ tiền tố đã
   đọc`, rồi tải toàn bộ blob 37 MiB vào heap và decode bình thường
   (ensureWindow=true, cacheSize=1). Hành vi người dùng đúng, chỉ
   mất lợi ích tiết kiệm byte/RAM mà đường GOP thiết kế để mang lại.
2. **Nguyên nhân đã CHỨNG MINH bằng probe đối chứng (§2.3), không
   phải đoán:** cùng bytes đó, cùng Chrome đó — T3 qua HTTP (có
   header `Accept-Ranges: bytes`) ra `gop-range`, 2160 sample / 72
   GOP; T3 qua blob: URL ra `full-file` với đúng lý do trên, chỉ 2
   request (probe 206 + prefix 206), KHÔNG fetch đuôi. Đo header
   trực tiếp trên blob: URL: HEAD ném `TypeError: Failed to fetch`
   (Chrome không hỗ trợ HEAD trên blob: URL); Range 0-0 / 0-1023 /
   đuôi đều trả **206 + Content-Range đúng + đúng byte** (first 8
   byte `00 00 00 20 66 74 79 70` = box ftyp) nhưng **`accept-ranges`
   luôn null**. Gate `acceptsByteRanges` đòi đúng chuỗi `"bytes"`
   trước khi cho tail-scan (T3 dòng 645), nên tail-scan bị bỏ qua dù
   Range đã được chứng minh là chạy. Mọi lần đo GOP trước đây (C5…)
   đều chạy qua bridge HTTP nên không lộ lỗi này — E2E trong app
   thật là lần đầu chạm đúng đường production (blob: URL).
3. **i18n toggle GOP: XONG.** 3 key mới `topbar.reverseWebcodecs*`
   có mặt vi + en, parity toàn file vi = en = 971 key, test D4 3/3,
   toggle trên app thật hiện đúng aria-label/title qua i18n
   (locale vi mặc định). Hai snapshot cũ của luồng khác (B6, Z6)
   rớt CHỈ ở số tổng cứng 968 → 971 (xem §5.2); snapshot saveToast31
   (931) đã đỏ từ trước đợt này (xem §5.2). D4 không sửa file luồng
   khác — parent gộp cập nhật số theo đúng chú thích trong chính các
   file đó.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/reverseToggleI18n48D4.test.ts` — test parity i18n
  vi/en + nội dung 3 key mới của toggle GOP (mẫu B6). 3/3 pass.
- `apps/web/scripts/gopHeaded48D4.mjs` — harness headed E2E app thật:
  import file trailing 37 MiB → thêm vào timeline → End về cuối →
  bấm "Phát ngược" → đo frame ngược thật (canvas pixel + wc hits +
  gopActive), qua vite :5173 + bridge :8787 thật. 13/14 cổng pass
  (1 cổng FAIL là `e2e-gop-active` — xem §2, đó là phát hiện, không
  phải lỗi harness).
- `docs/PHASE9_ROUND48_D4_GOP_LIMITS.md` — file này.

### 1.2 Sửa (marker ROUND48-D4)

- `apps/web/src/i18n/vi.json` — +3 key `topbar.reverseWebcodecs`,
  `topbar.reverseWebcodecsOn`, `topbar.reverseWebcodecsOff`.
- `apps/web/src/i18n/en.json` — +3 key tương ứng.
- `apps/web/src/TopBar.tsx` — toggle GOP dùng `t(...)` thay cho chuỗi
  Việt trực tiếp; không đổi data-testid, aria-pressed, class, hành vi.
  (Nút "Phát ngược" toàn cục K4 vẫn hardcode — ngoài phạm vi D4.)
- `apps/web/tsconfig.json` — +1 dòng exclude
  `src/lib/reverseToggleI18n48D4.test.ts` (cùng mẫu A4/B4/C5).

### 1.3 Không đụng (ghi rõ)

`reversePlayback.ts`, `reverseWebcodecs.ts`, `gopTail45A4/46B4/47C5.ts`,
`gopRangeFetch39T3.ts`, `gopSizeProbe41W4.ts`, `reverseRangeGate38U2.ts`
(gate — KHÔNG sửa dù đã tìm ra rào cản, xem nợ §6.1),
`preview.tsx`, `MediaBin.tsx`, `store.ts`, `server/bridge/src/index.js`,
mọi file luồng khác đợt 48 (kể cả test snapshot B6/Z6/saveToast31 —
xem §5.2). Probe chẩn đoán blob chỉ nằm ở `/tmp/d4-blob-probe.mjs`
+ output `/tmp/d4-probe-out.json` (ngoài repo, không đưa vào batch).

## 2. Headed E2E app thật (vite :5173 + bridge :8787)

### 2.1 Giàn đo

Harness `gopHeaded48D4.mjs` (kế thừa C5, khác điểm quyết định: đo
TRONG APP, không phải page test riêng):
- Fixture TÁI DÙNG file encode thật của C5
  (`~/scratch-round47-c5/trailing-real37.mp4`, 38.996.431 byte,
  1280×720 30 fps 72 s, 2160 frame, -g 30, crf 18, moov cuối, KHÔNG
  faststart, KHÔNG pad). Script kiểm tra đúng 38.996.431 byte; nếu
  mất thì encode lại y hệt tham số C5 (không pad để ép số).
- App VCut thật ở `http://127.0.0.1:5173/` (vite dev thật), profile
  Chrome MỚI. Tắt màn chào bằng localStorage `vcut-welcomed=1` rồi
  reload; chờ project mẫu load xong (duration 00:08) TRƯỚC khi
  import — vì `loadSample` set() toàn bộ media/spec nên import trước
  lúc đó sẽ bị ghi đè mất (race đã tính trước, không phải lỗi app).
- Import bằng CDP `DOM.setFileInputFiles` lên đúng input file của
  MediaBin (`accept="video/*,audio/*,image/*"`) — cùng đường người
  dùng chọn file qua hộp thoại, chỉ khác cách đưa file vào input.
  File 720p nên `shouldAutoProxy` = false (height ≤ 720): KHÔNG tạo
  proxy, preview dùng đúng blob: URL gốc + `item.file.size` — điều
  kiện để đường GOP Range bật trên file gốc.
- Thêm clip bằng nút `.media-add` của card (`addMediaAtPlayhead`):
  clip 72 s từ 0 trên track video mới (track mẫu v1 đã có clip
  0–8 s nên không chèn chồng); duration project thành 01:12 và ở
  cuối timeline chỉ clip 37 MiB active (mẫu nằm 0–8 s).
- Seek cuối bằng phím End thật (`Input.dispatchKeyEvent`), bật phát
  ngược bằng nút `[aria-label="Phát ngược"]` (K4), quan sát 45 s,
  lấy mẫu mỗi 500 ms: playhead (đọc `.time-display`),
  `window.__vcutReverseWc`, `window.__vcutHoldStats`, pixel canvas
  (`.preview-canvas` → downscale 32×18 → mean/stddev/hash FNV).
- Bridge THẬT trên :8787 (work-dir trong scratch, rate 5000) dù E2E
  này không cần bridge — giữ nguyên giàn C5, phòng app gọi bridge.
  Cổng 5173/8787 lúc chạy đều trống nên harness tự spawn server
  (không dùng SHARED); code SHARED tự động khi cổng bận vẫn có sẵn
  trong script như lệnh D4.
- Chromium headed thật, Xvfb :96, --disable-gpu (công thức C5).

### 2.2 Số đo thật — 13/14 cổng pass

| Cổng | Kết quả thật |
|---|---|
| bridge-head | PASS — HEAD → 200, content-length=38996431, accept-ranges=bytes |
| app-toggle-present | PASS — nút toggle xuất hiện trên app thật |
| app-toggle-default-on | PASS — profile mới: aria-pressed=true, localStorage `vcut-reverse-webcodecs`=null, class `tbtn play` (mặc định BẬT) |
| app-toggle-i18n-label | PASS — aria-label="Phát ngược WebCodecs (GOP)", title On đúng từng chữ key vi mới (xem §3) |
| app-sample-ready | PASS — project mẫu load xong (duration 00:08) trước khi import |
| e2e-import | PASS — card `trailing-real37.mp4` xuất hiện trong media bin sau **1,8 s** (input file → fileToMediaItem → IndexedDB ingest) |
| e2e-no-proxy | PASS — nút proxy của card: `"Proxy 720p"` (không `"✓ PROXY"` = preview dùng blob: URL gốc + item.file.size) |
| e2e-add-clip | PASS — sau "+ Thêm": duration project=72 s; media-dur trên card="00:04.0" (xem lưu ý dưới) |
| e2e-seek-end | PASS — sau phím End: playhead=72 s, duration=72 s |
| e2e-reverse-starts | PASS — playhead lùi **72 → 50 s (22 s)** trong 45 s quan sát; engine trong lúc chạy=`webcodecs` |
| e2e-gop-active | **FAIL** — `gopActive` không bao giờ true; `gopFallbackReasons=["gate: moov-unknown: chưa xác định được vị trí moov từ tiền tố đã đọc"]` (xem §2.3 — phát hiện chính) |
| e2e-wc-frames | PASS — `__vcutReverseWc.hits +10` (misses +232, controller fetches +6) trong lúc phát ngược |
| e2e-canvas-frames | PASS — **35 frame canvas KHÁC NHAU** (hash pixel downscale 32×18, mean>2 hoặc stddev>1); mẫu đen 0/62; hold draw +29 / hold +196 / skip +7 |
| e2e-no-page-errors | PASS — 0 uncaught exception, 0 console error trong toàn bộ chạy |

Trước phát ngược: `engine=webcodecs`, `__vcutReverseWc=null`
(chưa từng gọi frameAt), `__vcutHoldStats={draw:1, hold:0, skip:10}`.
Mẫu canvas đầu (t≈0,4–2,6 s): hash 2542614053, mean 6,25, stddev
4,84 — frame tối (đang ở cuối clip testsrc2? testsrc2 cuối chu kỳ
tối); mẫu cuối (t≈43,7–44,7 s): hash 3822151673/2646983827,
mean ≈61,5, stddev ≈107 — frame sáng, khác hẳn đầu. Canvas thật
871×275 px. Tốc độ lùi 22 s / 45 s wall ≈ 0,49× realtime (under-load,
nhiều luồng đợt 48 chạy song song + decode phần mềm — cấm dùng làm
baseline quiet hay claim fps).

Lưu ý trung thực (không giấu):
- `media-dur` trên card đọc được là `"00:04.0"` trong khi file dài
  72 s: đó là text của card ĐẦU TIÊN trong `.media-card .media-dur`
  (card mẫu `mau-*.webm` 4 s), không phải card 37 MiB — selector
  của harness lấy card đầu tiên, không phải card đích. Duration
  project 72 s sau "+ Thêm" mới là bằng chứng clip đã vào timeline
  đúng. Harness không claim media-dur 4 s là của file 37 MiB.
- `misses +232` so với `hits +10`: hầu hết tick stepping chưa có
  frame WebCodecs sẵn (cửa sổ decode chưa ấm / decode chậm hơn nhịp
  stepping) nên preview rơi về đường element-seek/hold (hold +196)
  — frame canvas vẫn hiện đúng (35 hash khác nhau) nhưng phần lớn
  qua đường element, không phải WebCodecs. Đây là hành vi fail-soft
  đã thiết kế, không phải lỗi.
- `controllerFetches +6` trong 45 s: khớp chuỗi probe HEAD (ném, bắt
  gọn) + T3 probe/prefix (2 request 206) + load() full-file (HEAD +
  GET blob) — KHÔNG có request tail nào (tail-scan đã bị bỏ qua,
  xem §2.3). Full-file load của blob là local (không qua mạng) nên
  nhanh; heap giữ 37 MiB trong lúc decode là chi phí thật của đường
  fallback này (không đo heap trong đợt này — xem nợ §6.2).

### 2.3 Chẩn đoán nguyên nhân: blob: URL không có header Accept-Ranges

Probe độc lập `/tmp/d4-blob-probe.mjs` (ngoài repo): cùng bytes
fixture, cùng Chrome headed, static server tự viết trên :8899
(hỗ trợ Range + `Accept-Ranges: bytes` + CORS) làm đối chứng HTTP.

| Đo trên blob: URL (từ đúng bytes fixture) | Số thật |
|---|---|
| HEAD | ném `TypeError: Failed to fetch` — Chrome không hỗ trợ HEAD trên blob: URL |
| GET Range `bytes=0-0` | **206**, `Content-Range: bytes 0-0/38996431`, body 1 byte, **`accept-ranges: null`** |
| GET Range `bytes=0-1023` | **206**, body 1024 byte, `accept-ranges: null` |
| GET Range đuôi `bytes=22219215-22220238` | **206**, `Content-Range` đúng, body 1024 byte, `accept-ranges: null` |
| 8 byte đầu (Range 0-7) | `00 00 00 20 66 74 79 70` = box ftyp — đúng byte prefix |
| T3 thật trên blob: URL (knownSizeBytes=38996431) | `full-file`, lý do `gate: moov-unknown`, requests = [probe 206/1024 byte, prefix 206/524288 byte] — **không fetch đuôi** |
| T3 thật trên HTTP đối chứng (cùng bytes) | `gop-range`, **2160 sample / 72 GOP**, requests = head 200, probe 206, prefix 206, tail 206 (16.777.216 byte), gop×72 toàn 206 (~533–553 KB mỗi GOP) |
| Controller thật trên blob: URL (`ensureWindowForTime(0)`) | `gopMode=full-file-fallback`, cùng lý do; nhưng `ensureOk=true`, `cacheSize=1`, `ready=true` — fallback decode được |

Chuỗi nhân quả (đọc code, khớp số đo):
1. `resolveRangeGopFetch` (gate U2): `moovPosition="unknown"`
   (moov cuối file, không nằm trong tiền tố 512 KiB) → return sớm
   với DUY NHẤT lý do `moov-unknown`, chưa hề kiểm tra Accept-Ranges
   hay size.
2. T3 (dòng 629–647) rẽ sang tail-scan, nhưng cửa vào tail-scan đòi
   `acceptsByteRanges(acceptRanges)` — `acceptRanges` ở đây chỉ có
   thể đến từ HEAD (ném lỗi trên blob), probe Range 0-0 (không có
   header này trên blob), hoặc prefix Range (cũng không có) → luôn
   null → `acceptsByteRanges(null) = false` → return
   `fallback(gateReason)` với ĐÚNG chuỗi lý do cũ, không thêm thông
   tin — nên từ ngoài chỉ thấy `moov-unknown`, không thấy rào cản
   thật là header.
3. Hệ quả: đường GOP **không bao giờ bật cho file import local**
   (blob: URL) — đúng đường production mà tính năng này phục vụ.
   Mọi lần đo GOP trước đây đều qua bridge HTTP nên header có sẵn,
   không lộ lỗi này. Đây là lần đầu E2E trong app thật chạm đúng
   đường production.

### 2.4 Hai giới hạn trung thực của số headed này

- Toàn bộ headed là Chromium Linux + Xvfb + render phần mềm,
  under-load (nhiều luồng đợt 48 chạy song song) — cấm dùng làm
  baseline quiet hay claim fps; số frame/GOP là bằng chứng chức
  năng + wiring, không phải tốc độ.
- Chưa đo: Safari, máy thật, màn hình vật lý, GPU thật, baseline
  quiet / fps, đỉnh heap khi fallback tải toàn file blob 37 MiB.

## 3. i18n toggle GOP (vi + en)

3 key mới, cùng vị trí sau `redoWith` trong cả 2 file:

| Key | vi | en |
|---|---|---|
| `topbar.reverseWebcodecs` | Phát ngược WebCodecs (GOP) | Reverse playback WebCodecs (GOP) |
| `topbar.reverseWebcodecsOn` | Phát ngược WebCodecs (GOP) đang BẬT — file video lớn phát ngược bằng Range theo GOP thay vì tải toàn file. Bấm để tắt (về đường element-seek cũ). | WebCodecs reverse playback (GOP) is ON — large video files play in reverse using per-GOP Range requests instead of downloading the whole file. Click to turn off (back to the legacy element-seek path). |
| `topbar.reverseWebcodecsOff` | Phát ngược WebCodecs (GOP) đang TẮT — phát ngược dùng đường element-seek cũ (tải toàn file). Bấm để bật (file lớn dùng GOP Range). | WebCodecs reverse playback (GOP) is OFF — reverse playback uses the legacy element-seek path (downloads the whole file). Click to turn on (large files use GOP Range). |

- Test D4 (`reverseToggleI18n48D4.test.ts`, mẫu B6, đọc JSON thật):
  parity toàn file **vi = en = 971 key** (968 của B6 + 3 key mới),
  đủ 3 key cả 2 bên, nội dung đúng từng chữ, vi khác en, không
  placeholder. 3/3 pass.
- TopBar.tsx chỉ đổi toggle GOP sang `t(...)`; test khóa cả việc
  chuỗi title Việt trực tiếp cũ không còn trong file + data-testid
  còn nguyên cho harness headed.
- Toggle trên app thật (§2.2, cổng `app-toggle-i18n-label`): locale
  vi mặc định hiện đúng aria-label/title từ key mới — chứng minh
  wiring i18n chạy trong app, không chỉ ở dict.
- Nút "Phát ngược" toàn cục K4 vẫn hardcode tiếng Việt — ngoài phạm
  vi D4, xem nợ §6.3.

## 4. Trần 128 MiB + trần moov 16 MiB + gate U2 — giữ nguyên

D4 không thêm bằng chứng nào cho 3 điều kiện đợt 42. Không đề xuất
trần hay gate mới nào — NHƯNG §2.3 cho thấy gate hiện tại (đòi header
`Accept-Ranges: bytes` trước tail-scan) vô tình loại toàn bộ file
import local. Hướng sửa thuộc về đợt follow-up, xem nợ §6.1 — D4
KHÔNG tự sửa gate (ngoài phạm vi luồng, code chung của nhiều luồng).

## 5. Kiểm chứng + hồi quy

```
# Test mới D4 (esbuild bundle, định dạng esm — như A4/B4/C5/B6)
./node_modules/.bin/esbuild apps/web/src/lib/reverseToggleI18n48D4.test.ts \
  --bundle --platform=node --format=esm --outfile=/tmp/d4.test.mjs \
  && node /tmp/d4.test.mjs
# Hồi quy (esbuild bundle, format esm)
./node_modules/.bin/esbuild apps/web/src/lib/<tên>.test.ts \
  --bundle --platform=node --format=esm --outfile=/tmp/d4-reg-<tên>.mjs \
  && node /tmp/d4-reg-<tên>.mjs
# Headed E2E app thật (vite :5173 + bridge :8787 thật)
node apps/web/scripts/gopHeaded48D4.mjs
# Probe chẩn đoán blob (ngoài repo, không đưa vào batch)
node /tmp/d4-blob-probe.mjs
```

| Nhóm | Kết quả thật |
|---|---|
| D4 mới `reverseToggleI18n48D4` | **3/3** (parity 971/971 + nội dung 3 key + TopBar dùng đúng key) |
| Hồi quy A4 `gopTail45A4` | **18/18** |
| Hồi quy B4 `gopTail46B4` | **13/13** |
| Hồi quy C5 `gopTail47C5` | **11/11** |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** |
| Hồi quy U2 `reverseRangeGate38U2` | **20/20** |
| Hồi quy `reversePlayback` | **10/10** |
| Hồi quy `reversePreviewGate` | **12/12** |
| Hồi quy A6 `reverseBadge45A6` | **12/12** |
| Hồi quy B6 `reverseBadge46B6` | **7/8** — xem §5.2 (chỉ rớt snapshot tổng 968) |
| Hồi quy Z6 `reverseCompat44Z6` | **9/10** — xem §5.2 (chỉ rớt snapshot tổng 968) |
| Hồi quy `saveToast31` | **14/15** — xem §5.2 (snapshot 931 đã đỏ từ trước đợt này) |
| Headed E2E D4 `gopHeaded48D4` | **13/14** (§2.2; 1 FAIL là `e2e-gop-active` — phát hiện §2.3) |
| Probe blob D4 `/tmp/d4-blob-probe.mjs` | chẩn đoán §2.3 (T3 blob full-file vs T3 HTTP gop-range) |
| `tsc --noEmit -p apps/web/tsconfig.json` | **Sạch, exit 0** |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass (32,47 s)**, chỉ cảnh báo chunk > 500 kB cũ |

### 5.2 Snapshot i18n cũ rớt vì +3 key — phân loại rõ (D4 không sửa file luồng khác)

| Test | Kết quả | Nguyên nhân | Do D4 gây ra? |
|---|---|---|---|
| `reverseBadge46B6` | 7/8 | Chỉ rớt assert `viKeys.size === 968` (thực tế 971). Parity (vi==en, đủ key B6) vẫn pass. | **Có** (+3 key). Chú thích trong chính file B6 dặn parent gộp cập nhật số — D4 không đụng file này theo lệnh. |
| `reverseCompat44Z6` | 9/10 | Chỉ rớt assert `vi.keys.size === 968` (thực tế 971). Chú thích trong file cũng dặn parent gộp cập nhật số. | **Có** (+3 key). D4 không đụng file này. |
| `saveToast31` | 14/15 | Chỉ rớt assert `viDict.size === 931` (thực tế 971). Snapshot 931 từ đợt 31, đã lỗi thời từ khi dict lên 968 ở đợt 46 — **đã đỏ từ trước đợt 48**, không phải do D4. Parity (0 key mồ côi) vẫn pass. | **Không.** D4 không đụng file này. |

Parent gộp: bump 968 → **971** ở `reverseBadge46B6.test.ts:97`
và `reverseCompat44Z6.test.ts:92-93`; bump 931 → **971** ở
`saveToast31.test.ts:334-335` (đã nợ từ đợt 46). Ba test này sau
khi bump số sẽ xanh trở lại mà không đổi logic nào — D4 đã kiểm
chứng bằng mắt rằng ngoài assert tổng ra, mọi assert khác đều pass.

## 6. Giới hạn còn lại và nợ follow-up (trung thực)

1. **NỢ LỚN NHẤT (phát hiện của đợt này): đường GOP không bật cho
   file import local.** Gate `acceptsByteRanges` đòi header
   `Accept-Ranges: bytes` trước tail-scan, nhưng Chrome không gửi
   header đó cho blob: URL (và HEAD còn ném lỗi). Hướng sửa cho đợt
   follow-up (KHÔNG làm trong D4 — ngoài phạm vi, code gate chung):
   (a) coi probe/prefix 206 đã chứng minh Range thật — tức tail-scan
   được phép khi một Range response trên cùng URL đã trả 206 khớp
   range, thay vì đòi header; hoặc (b) trường hợp riêng blob: URL
   (size đã biết từ File + probe 206). Cả hai đều phải đối chiếu với
   nguyên tắc U2 "không giả định" (gate hiện tại cố tình không tin
   khi header vắng) và kèm test khóa: T3 trên blob URL giả lập
   (fetchImpl trả 206 nhưng không có header Accept-Ranges) phải ra
   gop-range; HTTP không header + Range hỏng vẫn fallback. Bằng chứng
   đo để làm căn cứ: §2.3.
2. **CHƯA ĐO: đỉnh heap khi fallback tải toàn file blob 37 MiB.**
   E2E này chứng minh fallback decode được, nhưng không đo RAM
   transient của `load()` (arrayBuffer 37 MiB + retainedFileBytes).
   Cần đo trước khi bàn lại trần S4 128 MiB cho đường blob.
3. **Nút "Phát ngược" toàn cục K4 vẫn hardcode tiếng Việt**
   (title + aria-label trong `TopBar.tsx`) — ngoài phạm vi D4, cần
   đợt riêng nếu muốn i18n nốt (đã có hạ tầng + tiền lệ D4).
4. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
   quiet / fps.** Toàn bộ headed ở đây là Chromium Linux + Xvfb +
   render phần mềm, under-load. Tốc độ lùi 0,49× realtime ở §2.2
   không phải baseline.
5. **Harness phụ thuộc fixture ngoài repo:** fixture headed chỉ nằm ở
   `~/scratch-round47-c5/trailing-real37.mp4` (encode thật đợt 47,
   KHÔNG đưa vào repo, không đưa vào batch); script D4 tái dùng file
   đó nếu còn trên đĩa (kiểm tra đúng 38.996.431 byte), nếu mất thì
   encode lại y hệt tham số C5. Probe chẩn đoán chỉ nằm ở
   `/tmp/d4-blob-probe.mjs` + `/tmp/d4-probe-out.json` (ngoài repo).
6. **Lưu ý nhỏ về harness:** selector `.media-card .media-dur` lấy
   card đầu tiên (card mẫu 4 s) nên số media-dur trong log không
   phải của file 37 MiB — xem lưu ý §2.2. Không ảnh hưởng cổng nào
   (cổng dùng duration project), nhưng đợt sau nên sửa selector lấy
   đúng card đích cho sạch log.

## 7. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/reverseToggleI18n48D4.test.ts` (mới, 3 test)
- `apps/web/scripts/gopHeaded48D4.mjs` (mới, harness headed E2E app thật)
- `apps/web/src/i18n/vi.json` (sửa: +3 key topbar.reverseWebcodecs*)
- `apps/web/src/i18n/en.json` (sửa: +3 key topbar.reverseWebcodecs*)
- `apps/web/src/TopBar.tsx` (sửa: toggle GOP dùng t(...); marker ROUND48-D4)
- `apps/web/tsconfig.json` (sửa: +1 dòng exclude test mới)
- `docs/PHASE9_ROUND48_D4_GOP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round48-d4/` (profile Chrome +
bridge work-dir — KHÔNG đưa vào batch). Fixture tái dùng:
`~/scratch-round47-c5/trailing-real37.mp4` (KHÔNG đưa vào batch).
Probe chẩn đoán: `/tmp/d4-blob-probe.mjs`, `/tmp/d4-probe-out.json`
(ngoài repo, không đưa vào batch).

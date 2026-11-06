# Phase 9 — Đợt 44, luồng Z3: relink file > 128 MiB + banner min-display ≤ 64 MiB + toast TTS thiếu giây

Ngày: 04/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist vào batch. Mọi số timing dưới đây là **headed, under-load**
(nhiều luồng đợt 44 chạy song song trên cùng VM) — không phải số đo máy
trống, cấm dùng làm baseline quiet hay claim fps. Fixture MP4 134,8 MiB
tái sử dụng file đợt 43 Y3 đã tạo (không encode lại, không commit):
`~/workspace/tmp-round43-y3/big-140.mp4`, đã verify lại bằng ffprobe
trước khi chạy (h264 1280×720 + aac, duration 80,000 s, size
141.350.955 byte).

## 1. Phạm vi

Đóng 3 nợ của đợt 43 (Y3 §6 + X3 §6) mà task đợt 44 Z3 giao:

1. Relink file > 128 MiB: Y3 chỉ đo import qua MediaBin, chưa click-test
   RelinkPanel với file > 128 MiB thật.
2. Banner min-display cho file ≤ 64 MiB: Y3 đã quyết 500 ms và cài tập
   trung trong `ingestWithProgress` — Z3 kiểm chứng quyết đó có nhất
   quán qua đường RelinkPanel không, và chốt lại quyết định.
3. Toast TTS thiếu hậu tố giây khi bridge không trả `X-TTS-Duration`:
   tìm nguyên nhân thật, chọn fallback, cài đặt + test.

Chỉ sửa file thuộc phạm vi Z3; file dùng chung chỉ thêm hunk có marker
`ROUND44-Z3` (xem §7). Không đổi ngữ nghĩa dedup, không nới cổng GOP/S4,
không thêm key i18n (vi = en = 966, vi-only = en-only = 0 — tăng 4 key
so với 962 của đợt 42/43 là do các luồng đợt 44 song song, không phải
luồng này).

## 2. Nợ 1 — Relink file > 128 MiB: không có trần kích thước, nhưng có 1 bug chặn đường relink (đã sửa)

### 2.1. Kiểm tra trần/cap bằng đọc code (không có trần nào trên đường relink)

| Vị trí | Có chặn > 128 MiB không? |
| --- | --- |
| `AssetStore.ingestWithProgress` | KHÔNG — không kiểm tra kích thước tối đa; file > 64 MiB băm theo lát 8 MiB, file ≤ 64 MiB băm WebCrypto một lần. |
| `store.relinkMedia` | KHÔNG kiểm tra kích thước — chỉ probe hợp lệ (video/audio phải có duration, ảnh phải có kích thước) rồi ingest. Nhưng có bug logic §2.2 chặn mọi relink chọn lại đúng tên file. |
| `ingestImportedItemWithProgress` | KHÔNG — chỉ chuyển tiếp `onProgress` tới `ingestWithProgress`, fallback về `ingest` thường khi không có callback. |
| IndexedDB (ghi blob) | KHÔNG có cap trong code — chỉ còn quota của trình duyệt, và ở mức 141 MB trên Chromium của VM này không chạm quota (xem §2.3). |
| Đường GOP (preview ngược) | CÓ khóa > 128 MiB (`gop-large-file-locked`, cổng S4) — giữ nguyên, không thuộc đường relink/import, không suy ra từ đo này. Thuộc luồng GOP. |
| Bridge upload (2 GB/file) | Không nằm trên đường relink local (relink ghi IDB trực tiếp, không upload qua bridge). |

Không cần "nới hoặc chia nhỏ" gì thêm cho kích thước: đường relink vốn
đã không chặn, và đo headed §2.3 chứng minh file 134,8 MiB đi qua hết.
Việc duy nhất phải sửa để đường relink thật sự chạy được là bug §2.2.

### 2.2. Bug thật đã sửa: relink chọn lại đúng file gốc luôn thất bại (ROUND44-Z3, `store.ts`)

Phát hiện bằng click-test headed (không phải đọc code suông): mở project
thiếu `clip2.mp4`, bấm "🔗 Chọn lại", chọn đúng file `clip2.mp4` →
panel báo `⚠️ Không còn clip nào dùng "clip2.mp4".` và kẹt vĩnh viễn,
dù clip đó đang dùng đúng src này.

Chuỗi nguyên nhân:

1. `relinkAsset(spec, oldSrc, newSrc)` cố tình trả `updatedCount = 0`
   khi `oldSrc === newSrc` (dòng 322, semantics thuần đã khóa bằng test
   `relinkNested` — "old==new → 0 và giữ spec", test này vẫn xanh sau
   sửa, xem §5).
2. `relinkMedia` trước đây coi `updatedCount === 0` là thất bại tuyệt
   đối và return sớm — **trước cả bước ingest**. Tức user chọn lại
   đúng file gốc (trường hợp thường gặp nhất: file vẫn nằm nguyên trên
   máy, chỉ là phiên mới chưa có bytes trong IDB) thì không bao giờ
   relink được, phải đổi tên file trước mới xong — thông báo lại còn
   sai sự thật ("không còn clip nào dùng" trong khi clip đang dùng).
3. Hệ quả cho nợ > 128 MiB: case relink file lớn cũng chọn đúng tên
   file gốc (`big-140.mp4` thiếu → chọn `big-140.mp4`) nên cũng kẹt
   đúng chỗ này. Không sửa bug này thì không thể đo relink > 128 MiB
   qua UI thật.

Sửa (chỉ ở `relinkMedia`, không đổi `relinkAsset`):

- Khi tên đã chốt `n === oldSrc`: spec đã đúng tên, không cần đổi src
  — lấy số clip từ entry missing đang hiện (`missingAssets.find(m =>
  m.src === oldSrc)?.clipCount`); chỉ báo thất bại khi thật sự không
  còn entry nào dùng `oldSrc`. Sau đó vẫn chạy ingest + alias + đóng
  panel như đường thường.
- An toàn với history: `execCommand` với `apply` trả đúng ref spec cũ
  → `history.execute` trả null, không push entry undo rỗng (đã đọc
  code `commands.ts` trước khi sửa).
- Trường hợp tên khác (`n !== oldSrc`) giữ nguyên hành vi cũ, kể cả
  nhánh thất bại khi `updatedCount === 0`.

### 2.3. Click-test headed RelinkPanel + file 134,8 MiB (PASS)

Phương pháp: project `.vcut.json` tự tạo (ngoài repo) có 1 clip video
`src = "big-140.mp4"` → mở qua ProjectMenu "📂 Mở" (profile Chromium
mới, IDB trống) → panel "Media thiếu" hiện → bấm "🔗 Chọn lại" →
chọn `big-140.mp4` qua CDP `setFileInputFiles` (mẫu X3). Ground truth:
MutationObserver trên `.valid-banner` của panel + đọc trực tiếp IDB
thật trong trang + reload cùng profile.

| Chỉ số | Giá trị |
| --- | --- |
| File | 141.350.955 byte = 134,8 MiB (> 128 MiB = 134.217.728) |
| Số event hashing (lát) | 17 (16 lát đủ 8 MiB + 1 lát cuối ~6,8 MiB) |
| % từng lát (observer) | 5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 94, 100 |
| Số MB từng lát (observer) | 8,0 → 16,0 → … → 128,0 → 134,8 MB (bước đúng 8,0 MB) |
| Thời gian băm (first → last hashing event) | **6.771 ms** |
| storing bắt đầu sau event hashing cuối | 4 ms (pad = 0, đúng vì băm đã > 500 ms) |
| Tổng setFile → panel đóng | 10.212 ms |
| Panel Relink sau relink | đóng (hết thiếu → `missingAssets = null`) |
| Bin có `big-140.mp4` sau relink | có |
| IDB sau relink | manifest `a_b04905e14ca8016d`, sha256 `b04905e14ca8016d…9226c6e2`, size 141.350.955, blob đọc lại băm khớp manifest |
| IDB sau reload cùng profile | manifest + blob + digest vẫn khớp |
| Lỗi trang trong lúc relink | 0 |

So sánh trung thực với Y3: Y3 đo import MediaBin cùng file này băm
18.940 ms, Z3 đo relink băm 6.771 ms. **Không được kết luận "relink
nhanh hơn import"**: hai lần đo khác tải nền (đợt 44 ít luồng nặng hơn
lúc đo này), khác đường đi (relink có thêm bước probe trước khi băm),
và cả hai đều là số under-load. Điểm duy nhất được kết luận: cả hai
đường đều không chặn file > 128 MiB, % từng lát thật, bytes IDB đúng
từng byte.

**Không dùng số import 130,6 MiB của đợt 41 làm baseline** (đúng yêu
cầu task: đợt đó tự ghi chưa log tải). Mọi số trên đều đo lại trong
luồng này, không kế thừa số đợt 41.

## 3. Nợ 2 — Banner min-display cho file ≤ 64 MiB: quyết định CHỐT (không đổi code Y3)

### 3.1. Quyết định

**Giữ banner ở pha hashing tối thiểu 500 ms cho MỌI file, áp dụng thống
nhất tại `AssetStore.ingestWithProgress` — không phân biệt file lớn/nhỏ
ở tầng quyết định, chỉ khác ở kết quả: file lớn băm lâu hơn 500 ms thì
pad = 0, file nhỏ băm nhanh thì pad tới đủ 500 ms.**

Đây là XÁC NHẬN quyết định của Y3 (§3.1), không phải quyết mới, và Z3
chứng minh nó đã bao phủ cả đường RelinkPanel (điều Y3 chưa đo):

- RelinkPanel không có logic min-display riêng — nó nhận tiến trình
  qua `store.relinkMedia → ingestImportedItemWithProgress →
  ingestWithProgress`. Test đơn vị mới (§5) khóa bước chuyển tiếp này
  (`progressUsed = true`, đủ 3 pha hashing → storing → done theo thứ
  tự); kết hợp với test Y3 (pad 500 ms trong `ingestWithProgress`) thì
  RelinkPanel hưởng min-display mà không cần sửa riêng.
- Phương án bị loại (lần nữa, cho rõ): chỉ giữ banner cho file lớn, để
  file nhỏ flash — chính là hành vi cũ gây ra nợ này (flash 1–25 ms
  không đọc được). Phương án "giữ banner sau done thêm 500 ms" đã bị Y3
  loại vì phải sửa từng panel và vô nghĩa khi component unmount — Z3
  đồng ý, không mở lại.
- Không pad đường thất bại, không pad đường không callback (Y3 đã cài,
  Z3 không đổi).

### 3.2. Click-test headed RelinkPanel + file nhỏ (PASS)

Cùng harness §2.3, project thiếu `clip2.mp4` (2.672.559 byte, 8 s):

| Chỉ số | Giá trị |
| --- | --- |
| Banner hashing quan sát | `⏳ Đang tính mã băm: 2,5 MB / 2,5 MB (100%)` (1 event, nhánh one-shot) |
| Hashing → storing (quan sát qua observer) | **472 ms** |
| Tổng setFile → panel đóng | 920 ms |
| Bin có `clip2.mp4` sau relink | có |
| Lỗi trang | 0 |

472 ms quan sát so với 500 ms danh nghĩa: chênh 28 ms là sai số của
observer (MutationObserver + React commit dưới tải), không phải pad
thiếu — tiêu chí PASS đặt ≥ 450 ms chính vì lý do này, và code pad đo
từ thời điểm callback (trước khi React commit) nên giá trị danh nghĩa
vẫn là 500 ms. Y3 đo MediaBin là 500 ms đúng bằng cùng phương pháp;
Z3 không claim RelinkPanel "chậm hơn" hay "nhanh hơn" từ chênh này.

## 4. Nợ 3 — Toast TTS thiếu hậu tố giây: nguyên nhân gốc là CORS, fallback là ước lượng có "≈"

### 4.1. Nguyên nhân gốc (không phải bridge quên gửi header)

Bridge **có gửi** `X-TTS-Duration` (xem `server/bridge/src/index.js`
dòng `/api/tts` và `/api/tts/clone`: `res.setHeader("X-TTS-Duration",
String(result.durationSec || 0))`). Nhưng CORS toàn cục của bridge chỉ
expose `Accept-Ranges` / `Content-Range` nên trình duyệt (vite :5173 →
bridge :8787, khác origin) **lọc `X-TTS-*` khỏi `fetch`** — client đọc
được `null`, code cũ `Number(null || 0) = 0` → bỏ hậu tố. Đây chính là
trường hợp Y3 ghi "header trống (dur = 0)": header không trống ở tầng
HTTP, mà bị CORS lọc ở tầng trình duyệt (curl vẫn thấy header bình
thường — đã verify bằng preflight sau sửa, §4.2).

### 4.2. Sửa gốc ở bridge (ROUND44-Z3, `server/bridge/src/index.js`)

Thêm `X-TTS-Duration`, `X-TTS-Chars`, `X-TTS-Voice`, `X-TTS-Chunks`,
`X-TTS-Cloned` vào `exposedHeaders` của CORS toàn cục. Origin vẫn chỉ
loopback như cũ — chỉ expose metadata của file caller vừa yêu cầu
tổng hợp (giây/ký tự/giọng), không mở thêm dữ liệu nào. Tiền lệ: đợt
43 Y4 đã làm đúng việc này cho `Accept-Ranges`/`Content-Range` vì cùng
lý do.

Verify bằng preflight thật (sau khi restart bridge với code mới):

```
Access-Control-Allow-Origin: http://127.0.0.1:5173
Access-Control-Expose-Headers: Accept-Ranges,Content-Range,X-TTS-Duration,X-TTS-Chars,X-TTS-Voice,X-TTS-Chunks,X-TTS-Cloned
```

**Lưu ý triển khai:** bridge đang chạy từ trước phải restart sau khi
pull thì sửa này mới có tác dụng; client cũ + bridge mới vẫn chạy
được (fallback §4.3 lo phần còn lại).

### 4.3. Fallback ở client: ƯỚC LƯỢNG có "≈", không bỏ hậu tố (quyết Z3)

Khi header vẫn không đọc được (bridge cũ chưa restart, proxy lột
header), `TtsButton` dùng helper mới `ttsDoneSuffix` trong
`apps/web/src/lib/ttsDuration44Z3.ts`:

- Header hợp lệ (> 0) → ` (12.3s)` — số đo thật, không có "≈".
- Header thiếu/không hợp lệ, text có nội dung → ` (≈12.3s)` — ước
  lượng từ độ dài text, luôn mang "≈" để không mạo nhận là số thật.
- Text rỗng → `""` (bỏ hậu tố, không bịa số). `TtsButton` vốn đã trim
  và chặn text rỗng trước khi gọi nên đây chỉ là lưới an toàn.

**Quyết chọn ước lượng thay vì bỏ hậu tố** vì: toast done là nơi duy
nhất user thấy độ dài giọng đọc vừa tạo; bỏ hậu tố thì mọi trường hợp
fallback đều mất thông tin, trong khi ước lượng có "≈" vẫn hữu ích và
trung thực về bản chất của nó. Hằng ước lượng **không dùng cho việc gì
khác** (không cắt/ghép audio, không tính timeline).

Hiệu chuẩn tốc độ (đo thật qua bridge, giọng "Hải Đăng", VieNeu-TTS
v3 Turbo; header khớp ffprobe từng mẫu):

| Mẫu | Ký tự | Header / ffprobe (giây) | Ký tự/giây |
| --- | --- | --- | --- |
| "Xin chào, đây là VCut Studio." | 29 | 2,08 | 13,9 |
| Đoạn ~1 câu VCut local-first | 114 | 5,92 | 19,3 |
| Đoạn ~2 câu TTS local | 227 | 12,08 | 18,8 |
| **Tổng → hằng dùng** | **370** | **20,08** | **18,4 ký tự/giây** |

Sai số ước lượng trên chính 3 mẫu: mẫu ngắn −24% (1,57 s ước lượng so
với 2,08 s thật — câu ngắn có quãng nghỉ tương đối lớn), 114 ký tự
+4,5%, 227 ký tự +2,0%. Kết luận trung thực: ước lượng chỉ đúng bậc
độ lớn, lệch nhiều nhất ở câu rất ngắn — đó là lý do bắt buộc có "≈"
và là lý do sửa CORS (§4.2) mới là sửa chính, fallback chỉ là lưới an
toàn.

### 4.4. Click-test headed TTS (2 case, đều PASS)

Case 1 — bridge mới (header đọc được, số thật): chọn clip text mẫu
"Xin chào!…" → bấm "🔊 Đọc thành tiếng" → timeline có clip `tts-*`,
toast: `✅ Đã thêm giọng đọc (2.1s) vào timeline.` — số thật 2,08 s
làm tròn 2,1 s, **không có "≈"**. Tổng 22.548 ms (gồm nạp model sau
khi bridge restart).

Case 2 — stub bridge không gửi header (mô phỏng bridge cũ/proxy lột
header, vite riêng port 5174 trỏ tới stub 8788): timeline có clip
`tts-*`, toast: `✅ Đã thêm giọng đọc (≈1.5s) vào timeline.` — đúng
dự đoán từ text mẫu 28 ký tự / 18,4 = 1,52 s → 1,5 s, có "≈". Tổng
1.022 ms (WAV stub trả ngay, không phải giọng thật — chỉ điều kiện
"header vắng" là thật, và hậu tố được tính từ TEXT nên kết luận về
fallback vẫn đúng; stub không dùng cho đo tốc độ hay độ dài thật).

Ghi chú harness: toast chỉ sống 4,5 s nên probe case 2 phải poll mỗi
1 s và ghi lại ngay khi thấy (bản đầu poll 10 s đã bỏ lỡ toast — lỗi
probe, không phải app; xem §6).

## 5. Kiểm chứng hồi quy (số thật, chạy lại sau mọi sửa)

- `tsc --noEmit` trong `apps/web`: **0 lỗi**.
- `vite build` (outDir `/tmp/vcut-dist-z3`, không ghi `dist/` vào
  repo): **pass** (6,46 s, chỉ cảnh báo chunk > 500 kB cũ).
- Test mới `ttsDuration44Z3.test.ts` (chạy trực tiếp Node
  type-stripping): **9/9** — parse header, đếm code point, ước lượng,
  hằng 18,4 + ước lượng lại đúng 3 mẫu, hậu tố thật/ước lượng/rỗng,
  relink chuyển tiếp onProgress, fallback không callback.
- Hồi quy chạy lại (bundle esbuild ra `/tmp`, chạy từ repo root cho
  test cần tìm src app): relink40V5 6/6, relink39T5 11/11,
  relinkDedup38U3 7/7, assetStore 22/22, importAsset37T3 8/8,
  rehydrate36S5 19/19, importProgress41W3 4/4, ingestMinDisplay43Y3
  5/5, relinkNested 13/13 (gồm assert "old==new → 0 và giữ spec" vẫn
  giữ — sửa Z3 chỉ ở `relinkMedia`, không đổi `relinkAsset`).
- Tổng hồi quy: **104/104** (95 cũ + 9 mới).
- i18n không chạm: vi = en = **966 key**, vi-only = en-only = 0.
- Click-test headed: relink-big PASS (§2.3), relink-small PASS (§3.2),
  tts-thật PASS + tts-fallback PASS (§4.4).

## 6. Nợ mở (trung thực, không claim)

- **Safari / Firefox / máy thật**: chưa kiểm chứng (toàn bộ đo trên
  Chromium headed của VM, vite bind `[::1]` nên probe dùng
  `localhost:5173`, còn `127.0.0.1:5173` không tới được vite ở VM này
  — lưu ý cho harness sau, không phải lỗi app).
- **Mở lại > 128 MiB cho đường GOP**: vẫn khóa theo thiết kế (S4);
  quyết mở lại cần đo heap browser headed riêng — thuộc luồng GOP.
- **Ước lượng TTS**: chỉ hiệu chuẩn trên 1 giọng ("Hải Đăng") và 3 mẫu
  tiếng Việt; giọng khác / text có nhiều dấu câu, số, tên riêng có thể
  lệch hơn mức ghi ở §4.3. Hậu tố "≈" là biện pháp trung thực cho sai
  số này, không phải cam kết chính xác.
- **Bridge phải restart** sau khi pull thì sửa CORS §4.2 mới có tác
  dụng; bridge đang chạy từ code cũ vẫn cho toast "≈" qua fallback
  (đúng thiết kế), không lỗi.
- **Lỗi probe đã sửa, không phải lỗi app** (ghi để harness sau khỏi
  lặp lại): (a) regex parse MB của probe relink-big ban đầu thiếu đơn
  vị "MB" (`8,0 MB / 134,8 MB`) nên `sliceOk` báo sai dù % từng lát
  đúng — đã sửa regex, chạy lại PASS; (b) probe TTS fallback poll 10 s
  bỏ lỡ toast sống 4,5 s — đã đổi poll 1 s + ghi lại ngay.
- File workflow `.github/workflows/ci-security.yml` vẫn chưa lên
  GitHub (403 quyền, nợ cũ) — ngoài phạm vi luồng này.

## 7. File đã đổi/thêm (đường dẫn tương đối repo, chỉ text, chưa push)

Đổi (hunk mới đều mang marker `ROUND44-Z3`, trừ dòng exclude tsconfig
mà JSON không cho đặt comment — tên file test đã chứa `44Z3`):

1. `apps/web/src/store.ts` — `relinkMedia`: trường hợp chọn lại đúng
   tên file gốc không còn bị coi là thất bại (§2.2).
2. `apps/web/src/components/TtsButton.tsx` — toast done dùng
   `ttsDoneSuffix` (số thật khi header đọc được, `≈` ước lượng khi
   header thiếu) thay cho `dur > 0 ? … : ""` (§4.3).
3. `server/bridge/src/index.js` — CORS toàn cục expose thêm `X-TTS-*`
   (§4.2). Origin vẫn chỉ loopback.
4. `apps/web/tsconfig.json` — thêm `src/lib/ttsDuration44Z3.test.ts`
   vào exclude (tiền lệ: mọi file test của repo đều nằm trong
   exclude).

Thêm:

5. `apps/web/src/lib/ttsDuration44Z3.ts` — helper hậu tố TTS + hằng
   tốc độ hiệu chuẩn 18,4 ký tự/giây (§4.3).
6. `apps/web/src/lib/ttsDuration44Z3.test.ts` — test mới 9/9 (§5).
7. `docs/PHASE9_ROUND44_Z3_RELINK_LIMITS.md` — chính tài liệu này.

Không đổi: file i18n JSON, `assetStore.ts`, `ingestProgress39T5.ts`
(min-display Y3 giữ nguyên), `relink.ts` (semantics `old==new → 0`
giữ nguyên), `MediaBin.tsx`, mọi panel khác, `apps/web/dist/`, mọi
binary. Probe click-test (`probe-z3.mjs`, `probe-z3-fallback.mjs`,
`diag-z3.mjs`, stub bridge), project `.vcut.json` mẫu, file WAV hiệu
chuẩn và kết quả JSON chỉ nằm ở `~/workspace/tmp-round44-z3/` (ngoài
repo) và không được stage. Fixture `big-140.mp4` là file đợt 43 Y3
tạo, tái sử dụng sau khi verify lại, không commit.

# PHASE9_ROUND85_M7 — Voice cloning: mẫu giọng NGƯỜI THẬT + export/backup giọng (LIMITS)

## Đợt làm gì

Lấp 2 nợ cuối của đợt 84 L8 (`docs/PHASE9_ROUND84_L8_TTS_VOICE_CLONING_LIMITS.md` §8):

1. **Đo voice cloning trên mẫu giọng NGƯỜI THẬT** (L8 chỉ đo trên giọng tổng
   hợp preset "Hải Đăng", cosine 0,9024).
2. **Export/backup giọng đã clone + import lại được** (L8: "không backup/
   export. Xóa home dir hoặc đổi máy → mất giọng").

## 1. Mẫu giọng người thật — nguồn, license, cách lấy

**Không có mic trên VM này** (`/dev/snd` không tồn tại, `arecord` không có)
nên không thu được giọng người thật trực tiếp. Mẫu dùng là **giọng đọc thật
của con người** từ **LibriSpeech dev-clean** — license **CC-BY 4.0** (đọc
trực tiếp file `LibriSpeech/LICENSE.TXT` trong file tải về: "LibriSpeech ASR
corpus is licensed under a Creative Commons Attribution 4.0 International
License"; nguồn gốc là audiobook LibriVox public domain, đọc bởi tình
nguyện viên). Dùng trong phạm vi đo đạc nội bộ đợt này, không đưa vào
repo, không phân phối lại; nếu sau này muốn đóng gói mẫu vào sản phẩm thì
phải ghi công CC-BY đầy đủ (xem §5.6).

- Nguồn tải: `https://www.openslr.org/resources/12/dev-clean.tar.gz`
  (chỉ tải 42MB đầu bằng HTTP Range `0-41999999`, đủ lấy 4 speaker đầu).
- Speaker chính **2277, nữ, reader "zinniz"** (theo `SPEAKERS.TXT`), chapter
  149896 (trích "Sister Carrie" của Dreiser), utterance 0000 + 0001 + 0005,
  nối bằng ffmpeg → **`ref2277.wav`: 19,335s, 48kHz mono, 1,86MB**.
  Nội dung nói (tiếng Anh): "HE WAS IN A FEVERED STATE OF MIND..." (xem
  `2277-149896.trans.txt`).
- Đối chứng "khác giọng": **speaker 2086, nam, reader "Nicodemus"**,
  chapter 149214 utt 0000+0001 → `ref2086.wav` 16,78s.
- Đối chứng "cùng người khác text": tách ref 2277 thành `ref2277a.wav`
  (utt 0000, 6,59s) và `ref2277b.wav` (utt 0001+0005, 12,75s).
- **Mẫu giọng KHÔNG đưa vào repo/batch push** (file `.wav` mẫu là dữ liệu
  giọng người thật, chỉ lưu ở `/tmp/m7-librispeech/` trên VM này + bản
  backup JSON ở cùng thư mục; xem §6 đường dẫn đầy đủ).

## 2. Kết quả đo trên giọng người thật (bridge thật, model thật)

Bridge thật cổng 18797 (`TTS_PYTHON=server/tts/.venv2/bin/python`,
`BRIDGE_CLONED_VOICES_DIR=/tmp/m7-real-voices`), đo 11/11 ~00:05–00:30 +07.

### 2.1 Tạo giọng từ mẫu người thật — THÀNH CÔNG

`POST /api/tts/cloned-voices { name: "Giọng Thật 2277", refAudio: ref2277.wav }`
→ HTTP 200 sau **131,8s wall** (nạp model + probe 35 ký tự), `done {
cloned: true, durationSec: 1.84, clonedVoice: { id: f1a1c6dd2f3fa430,
refDurationSec: 19.335 } }`. Chậm vì VM đang tải nặng (các luồng đợt 85
khác chạy Playwright/WebKit/vite cùng lúc — xem §5).

### 2.2 Tổng hợp bằng giọng người thật đã clone — THÀNH CÔNG (lần 2)

Câu 124 ký tự tiếng Việt: "Xin chào, đây là giọng đọc thử từ một giọng nói
thật của con người. Công nghệ này đang học cách bắt chước giọng nói của tôi."
- **Lần 1 THẤT BẠI**: `tts.py exit null` sau 3m36s (process python bị kill —
  không có log OOM đọc được trên VM này: `dmesg`/syslog không truy cập
  được; RAM lúc kiểm tra sau đó: 4,3/7,9GB đã dùng, swap 416MB đã dùng;
  các luồng đợt 85 khác đang chạy Chrome/WebKit/vite nặng). Không phải lỗi
  của giọng: probe lúc tạo giọng chạy được với cùng file mẫu.
- **Lần 2 (thử lại y hệt) THÀNH CÔNG**: `done { cloned: true, durationSec:
  5.92, chunks: 1 }`, WAV 5,92s 48kHz mono. Cùng câu bằng preset "Hải Đăng":
  5,36s — nhịp nói tương đương.
- Kết luận: lỗi lần 1 là **nhất thời do tải VM**, không tái hiện ở lần 2.
  Trên máy user (ít tải hơn) không nên gặp; nhưng bridge không retry tự
  động — user bấm lại nếu gặp lỗi này.

### 2.3 Độ giống giọng (cosine, script mới `server/tts/measure_voice_similarity.py`)

Phương pháp như D2 đợt 4 / L8: speaker embedding 192 chiều của chính
`encode_reference()` (VieNeu-TTS), mọi file cắt 20s đầu, encode 1 lần
nạp model. Script mới lưu lại trong repo (L8 dùng script 1 lần rồi mất).

| Cặp | Cosine | Ý nghĩa |
|---|---|---|
| ref2277 x ref2277 (encode 2 lần) | **1,0000** | Encoder xác định |
| ref2277a x ref2277b (cùng người, khác câu) | **0,8223** | Thang "cùng người" (thấp) |
| ref2277 x ref2277b | 0,8908 | Thang "cùng người" |
| ref2277 x ref2277a | 0,9618 | Thang "cùng người" (cao) |
| **ref2277 x clone2277** | **0,7618** | **Kết quả chính** |
| ref2277 x probe2277 (câu probe 1,84s) | 0,7277 | Clone câu ngắn |
| clone2277 x probe2277 | 0,7465 | 2 bản clone độc lập nhất quán |
| ref2277 x ref2086 (khác người, nam) | 0,4607 | Sàn "khác giọng" |
| ref2277 x preset Hải Đăng (cùng câu) | 0,3916 | Sàn preset |
| clone2277 x ref2086 | 0,3409 | Clone xa hẳn giọng khác |
| clone2277 x preset Hải Đăng | 0,4570 | Clone KHÔNG sụp về preset |

**Đọc trung thực:** clone giọng người thật đạt **0,7618** — rõ ràng trên sàn
"khác giọng" (0,34–0,46) và xa preset (0,39), 2 bản clone độc lập nhất quán
với nhau (0,7465), nhưng **THẤP HƠN thang "cùng người" (0,82–0,96)** và
thấp hơn hẳn số L8 đo trên mẫu tổng hợp (**0,9024**). Tức là: clone có giữ
được nét giọng người thật, nhưng kém hơn khi mẫu là giọng tổng hợp cùng
họ model. Lý do có thể: (a) mẫu là tiếng Anh, đầu ra là tiếng Việt
(clone xuyên ngôn ngữ); (b) encoder của VieNeu-TTS "quen" giọng tổng hợp
hơn giọng thu thật (nhiễu phòng thu, ngữ điệu audiobook). Chưa có test
nghe chủ quan — cosine là đo embedding, không phải "nghe giống bao nhiêu
phần trăm".

## 3. Export/backup + import giọng clone

### Định dạng

**1 file JSON, KHÔNG zip** (bridge không có dep zip nào; thêm dep chỉ để
nén là không đáng — JSON base64 vẫn round-trip y hệt):

```json
{ "format": "vcut-cloned-voice", "version": 1, "exportedAt": "...",
  "voice": { "name": "...", "refExt": ".wav", "refDurationSec": 19.335, "createdAt": "..." },
  "refAudioBase64": "<toàn bộ file mẫu, base64>", "refSha256": "<sha256 hex>" }
```

Backup toàn bộ: `{ "format": "vcut-cloned-voices-backup", "version": 1,
"count": N, "voices": [ <entry như trên>... ], "skipped": [...] }`.
Giới hạn: ref ≤20MB (như tạo giọng) → file backup ≤30MB; import verify
sha256 trước khi ghi; base64 phải round-trip đúng.

### Endpoint mới (bridge, `server/bridge/src/index.js` + `clonedVoices.js`)

- `GET /api/tts/cloned-voices/:id/export` → file JSON 1 giọng, header
  `Content-Disposition: attachment; filename="vcut-voice-<slug>-<id>.json"`
  (slug bỏ dấu tiếng Việt; id lạ → 404 `TTS_CLONED_VOICE_NOT_FOUND`).
- `GET /api/tts/cloned-voices/export` → backup toàn bộ kho (giọng mất file
  mẫu bị bỏ qua, ghi trong `skipped`).
- `POST /api/tts/cloned-voices/import` (multipart field `backup` + `name`
  tùy chọn để đổi tên khi nhập đúng 1 giọng): parse/validate (JSON hỏng,
  format/version lạ, sha không khớp, đuôi lạ → 400
  `TTS_CLONED_VOICE_REGISTRY`; thiếu file → 400 `TTS_REF_AUDIO_MISSING`;
  ref >20MB → 413 `TTS_REF_AUDIO_TOO_LARGE`) → mỗi giọng: ghi file mẫu
  vào thư mục mới → **chạy câu thăm dò PROBE_TEXT bằng `tts.py` thật**
  (verify mẫu nhập vào tổng hợp được, như lúc tạo giọng) → ghi registry.
  Trả JSON `{ imported, skipped, failed }` (luôn 200 khi file parse được).
  Trùng tên: nhập 1 giọng → 400 `TTS_CLONED_VOICE_NAME_DUP`; nhập nhiều
  giọng → bỏ qua giọng đó (`skipped: [{name, reason: "dup"}]`), nhập tiếp
  các giọng còn lại. Đổi tên khi nhập nhiều giọng → 400. Hết chỗ (20
  giọng) → 400 `TTS_CLONED_VOICE_LIMIT` (kiểm tra trước probe). Hủy/lỗi
  ở probe → xóa thư mục giọng đó, không để lại giọng dở dang.
- **Không thêm mã lỗi mới** — tái dùng mã L8 để khỏi phá khóa 3 chiều
  server/web/dict (catalog vẫn 108 mã).

### UI + i18n

- `apps/web/src/lib/clonedVoices.ts`: `fetchClonedVoiceBackup` /
  `fetchAllClonedVoicesBackup` (blob + tên file từ header server),
  `importClonedVoices`, `parseImportSummary` (validate shape),
  `buildVoiceBackupFilename` (cùng thuật toán slug với server),
  `exportClonedVoiceUrl` / `exportAllClonedVoicesUrl`.
- `TtsButton.tsx`: nút "Xuất" từng giọng, "Xuất tất cả", "Nhập giọng"
  (input `.json` ẩn), thông báo import (đã nhập/skipped/failed), nhập
  xong chọn ngay giọng vừa nhập. Tải file qua blob + thẻ `<a download>` —
  backup không tự upload đi đâu.
- i18n: **+11 key `tts.*`** (exportVoice, exportAllVoices, importVoices,
  importingVoicesBtn, voiceExported, voiceExportFailed, voiceImported,
  voiceImportFailed, importSkipped, importFailedDetail,
  allVoicesExported), vi/en đủ, fragment `round85-m7.json` khớp dict
  đúng từng chữ. **Dict: 2489 → 2500 key** (đo lúc ~00:30 11/11; các luồng
  đợt 85 khác đang sửa cùng file dict — closing recount lại).
  **KHÔNG tự bump test khóa số key** (theo lệnh luồng) — parent bump ở
  closing: dict 2489→2500 trong `codecProbeUi75C6` / `i18nAudit59P7` /
  `i18nModals79G9` / `errorDetail34Q4` / `codecProbeDebts76D8`, và
  `cssClasses60Q2` §TtsButton 48→62 call site (+11 key).

### Round-trip THẬT trên bridge thật (giọng người thật 2277)

1. Export giọng `f1a1c6dd2f3fa430` → file 2.475.283 byte; **sha256 trong
   backup khớp đúng file mẫu, base64 giải ra đúng từng byte**.
2. `DELETE` → list rỗng.
3. `POST import` file backup → 200 sau 2m10s (probe synth),
   `{ imported: [{ id: cead2580115d39b2, name: "Giọng Thật 2277",
   refDurationSec: 19.335 }], skipped: [], failed: [] }`.
4. Synth bằng giọng đã import (câu probe 35 ký tự) → `done { cloned: true,
   durationSec: 2.0 }`.
5. Cosine sau import: **ref2277 x clone-after-import = 0,7408**
   (trước import 0,7618 — cùng tầm, mẫu sau import là câu ngắn 2,0s);
   clone-trước x clone-sau-import = 0,7893. **Round-trip PASS: giọng sau
   import vẫn là đúng giọng đó, TTS vẫn chạy.**

## 4. Kiểm chứng (đều xanh, trừ 2 mục đã biết — xem §5)

| Test | Kết quả |
|---|---|
| Backup unit `test-tts-cloned-voices-backup.cjs` | **28/28** (format/parse/sha/tamper/multi/filename) |
| Export-import e2e `test-tts-cloned-voices-export-import-e2e.cjs` (bridge thật + stub python, cổng 18798) | **32/32** (export sha khớp bytes, export-all, 404, xóa→import→synth, trùng tên 400, đổi tên, JSON rác/sha sửa/thiếu file 400, multi 3 giọng, import lại skip 3, hỗn hợp imported 1 + skipped 2) |
| L8 e2e regression `test-tts-cloned-voices-e2e.cjs` | **40/40** |
| L8 unit `test-tts-cloned-voices.cjs` | **18/18** |
| Web `clonedVoices.test.ts` (esbuild bundle) | **21/21** (14 L8 + 7 M7 mới) |
| `tsc --noEmit` (apps/web) | Sạch **trừ 1 lỗi của luồng khác** (xem §5) |
| `vite build` (apps/web) | **Pass** (1m19s; chỉ warning chunk >500kB có sẵn) |
| Error-protocol `test-bridge-error-protocol.cjs` | **144/145 — 1 fail do luồng M8** (xem §5) |

## 5. Giới hạn trung thực / nợ mở

1. **Cosine 0,7618 < thang cùng người (0,82–0,96) và < L8 0,9024 (mẫu
   tổng hợp).** Clone giọng người thật có giữ nét giọng nhưng chưa đạt mức
   "nghe như cùng người" theo thang encoder. Chưa test nghe chủ quan.
   Mẫu là tiếng Anh, đầu ra tiếng Việt (xuyên ngôn ngữ) — chưa đo mẫu
   tiếng Việt người thật (không có nguồn CC0 tiếng Việt sẵn trên VM).
2. **Synth lần 1 lỗi `tts.py exit null` (3m36s), lần 2 y hệt lại chạy.**
   Nghi do tải VM nhất thời (RAM/swap căng, nhiều luồng đợt 85 chạy
   Chrome/WebKit/vite). Bridge không retry tự động.
3. **Tốc độ chậm và dao động mạnh theo tải VM**: tạo giọng 131,8s; synth
   124 ký tự 1m52s–3m36s (lần lỗi); import 2m10s (mỗi giọng 1 lần nạp
   model). Import backup nhiều giọng chạy tuần tự → N giọng ≈ N×~2 phút;
   UI chỉ báo "đang nhập" chung, không có progress từng giọng.
4. **Export là JSON, không phải ZIP** (quyết định có chủ ý — §3; file
   backup ~1,3× dung lượng mẫu do base64). File backup chứa nguyên file
   mẫu giọng của user — ai có file là có giọng; không commit vào repo,
   chỉ lưu/truyền theo ý user.
5. **Chưa click-test UI export/import trên browser thật** (nợ đứng của
   vòng lặp; chỉ kiểm chứng wiring qua test đọc source + e2e HTTP).
6. **License LibriSpeech là CC-BY 4.0** (đã đọc trực tiếp LICENSE.TXT),
   không phải CC0. Mẫu chỉ dùng để đo trong đợt này, không đưa vào repo,
   không phân phối lại — dùng đúng phạm vi đo đạc là an toàn; nếu sau này
   muốn đóng gói mẫu vào sản phẩm thì phải ghi công CC-BY đầy đủ.
7. **Xung đột với luồng M8 (đợt 85):** `test-bridge-error-protocol.cjs`
   (F) fail 1: `index.js` có 10 call site `taskErrorPayload` literal,
   test khóa 9 — site thứ 10 là của M8 ("Đợt 85 M8 — poll tiến trình job
   proxy async", 2 site `TASK_PROXY_FAILED` trong `/api/proxy`). Không
   phải code của M7 (đoạn code M7 0 call site `taskErrorPayload`); M7
   không sửa code/test của M8 — closing xử lý (gộp/bump khóa).
8. **tsc còn 1 lỗi của luồng M4:** `src/lib/webkitRestartTrace85M4.test.ts
   (15,8): TS5097` (import path kết thúc `.ts`). Không phải file M7;
   không sửa.
9. **Dict 2500 đo lúc ~00:30; các luồng đợt 85 khác đang sửa cùng
   `vi.json`/`en.json`/`index.js`** — số này có thể lệch ở closing;
   parent recount + bump các test khóa số (xem §3).
10. Import không kiểm tra "giọng trong backup có phải cùng người với tên
    không" — tên trong backup là tên user đặt lúc export; import với
    `name` khác chỉ đổi tên hiển thị, không đổi giọng.

## 6. File / đường dẫn (mẫu giọng để NGOÀI repo)

- Mẫu + kết quả đo (VM này, không stage, không push):
  `/tmp/m7-librispeech/` — `ref2277.wav` (19,335s), `ref2086.wav`,
  `ref2277a.wav`, `ref2277b.wav`, `clone2277.wav` (5,92s),
  `probe2277.wav` (1,84s), `preset2277text.wav` (5,36s),
  `clone2277-after-import.wav` (2,0s), `m7-backup2277.json`
  (2.475.283 byte), `LibriSpeech/` (42MB đầu của dev-clean.tar.gz +
  LICENSE.TXT/SPEAKERS.TXT/BOOKS.TXT), NDJSON log các lần gọi bridge
  `/tmp/m7-*.ndjson`, `/tmp/m7-*.json`.
- Kho giọng test thật (đã xóa bridge, còn thư mục):
  `/tmp/m7-real-voices/` (registry + ref đã import, id mới
  `cead2580115d39b2`); bridge test đã dừng (cổng 18797 đã đóng).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round85-m7-voice-cloning-real.txt`
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m7.md`

# PHASE9_ROUND84_L8 — TTS voice cloning: giọng đã clone LƯU LẠI ĐƯỢC (LIMITS)

## Đợt làm gì

Khoảng trống trong `PHASE9_GAP_ANALYSIS.md` §0 ("voice cloning có trong engine
nhưng chưa expose UI/bridge") thực tế đã thu hẹp một nửa từ R4 (24/10):
`POST /api/tts/clone` + checkbox "Clone giọng từ file mẫu" đã có — nhưng chỉ
clone **1 lần** (mẫu bị xóa ngay sau khi tổng hợp). Đợt này lấp nửa còn lại:
**giọng clone lưu lại được, dùng như 1 giọng preset**.

### Bridge (mới: `server/bridge/src/clonedVoices.js`)

- Kho giọng bền vững: `~/.vcut/cloned-voices/voices.json` (registry) +
  `~/.vcut/cloned-voices/<id>/ref.<ext>` (file mẫu). **Cố tình KHÔNG nằm
  dưới `WORK_ROOT`/tmpdir** — VM từng reboot 2 lần trong đợt 83, file trong
  tmp sẽ mất; giọng user tạo phải sống qua lần khởi động bridge sau.
  Override bằng env `BRIDGE_CLONED_VOICES_DIR` (test/e2e dùng thư mục tạm).
- `GET /api/tts/cloned-voices` → `{ voices: [{ id, name, refExt,
  refDurationSec, createdAt }] }` (không lộ đường dẫn tuyệt đối).
- `POST /api/tts/cloned-voices` (multipart `name` + `refAudio`): lưu mẫu tạm
  → chạy **câu thăm dò** `"Xin chào, đây là giọng mới của tôi."` bằng
  `tts.py --ref-audio` để verify mẫu thật sự tổng hợp được → ghi registry.
  Stream NDJSON như `/api/tts` (phase load/synth + progress chunk thật +
  ETA qua `createProgressSender` + hủy thật qua AbortController); event
  `done` mang thêm `clonedVoice` + `downloadUrl` là bản đọc thử (tải 1 lần).
  Hủy/lỗi giữa chừng → xóa thư mục mẫu tạm, **không để lại giọng dở dang**
  trong registry.
- `DELETE /api/tts/cloned-voices/:id` → xóa registry + file mẫu.
- `POST /api/tts` thêm `{ text, clonedVoiceId }`: bridge tự lấy file mẫu đã
  lưu, chạy `tts.py --ref-audio` như clone 1 lần. Gửi cả `voice` +
  `clonedVoiceId` → 400; id lạ → 404 `TTS_CLONED_VOICE_NOT_FOUND`; giọng mất
  file mẫu → 404 với thông báo rõ.
- 6 mã lỗi mới (`TTS_CLONED_VOICE_NAME_EMPTY/NAME_TOO_LONG/NAME_DUP/LIMIT/
  NOT_FOUND/REGISTRY`): catalog server 102 → **108**, tập mã web + key
  `bridgeErrors.*` trong dict/fragment khớp 1:1 (test khóa 3 chiều đã cập
  nhật, xem §4). Giới hạn: tối đa **20 giọng**, tên **1–40 ký tự** (trim,
  cấm `/` `\` ký tự điều khiển, trùng tên không phân biệt hoa/thường → 400),
  mẫu tối đa **20MB** + **120s** (tts.py chặn tiếp), đuôi `.wav/.mp3/.m4a/
  .ogg/.flac/.webm`.

### UI (`TtsButton.tsx` + mới `lib/clonedVoices.ts`)

- Select giọng có 2 nhóm `<optgroup>`: "Giọng có sẵn" (25 preset) + "Giọng
  đã clone" (kèm thời lượng mẫu, vd "Giọng Tôi (clone · 13s)"). Chọn giọng
  clone → nút "Đọc thành tiếng" gọi `POST /api/tts { clonedVoiceId }`.
- Section "🎭 Giọng đã clone": danh sách giọng + xóa 2 bước ("Xóa" →
  "Chắc chắn xóa?"), panel "＋ Tạo giọng clone mới" (tên + file mẫu → tạo
  với progress + ETA + nút Hủy thật như job AI; xong nghe thử bản đọc mẫu
  qua `<audio>` — blob tải 1 lần rồi phát qua object URL, không để trình
  duyệt tự fetch lại rồi 404).
- Giọng đã lưu bị xóa/mất ở bridge trong lúc đang chọn → speak() 404 →
  bỏ chọn, tải lại list, báo "Giọng đã clone không còn nữa — chọn lại
  giọng khác." Chế độ clone 1 lần cũ (checkbox R4) giữ nguyên, không đụng.
- i18n: +18 key `tts.*` + 6 key `bridgeErrors.*`, vi/en đủ, fragment
  `round84-l8.json` khớp dict đúng từng chữ. Dict: 2465 → **2489 key**.

## Kiểm chứng thật (11/11 ~04:20 +07, VM 4 vCPU EPYC 9D25)

Mẫu là giọng **tổng hợp** (preset "Hải Đăng"), KHÔNG phải giọng người thật
(xem §3 giới hạn).

1. **Tạo mẫu**: `tts.py --voice "Hải Đăng"` 91 ký tự → WAV 4.4s, 48kHz mono
   PCM16, `synthSec 45.1s`, `watermark: false` (chậm do VM đang tải — các
   luồng đợt 84 khác chạy song song; xem §3).
2. **Tạo giọng qua bridge thật** (port 18796, `TTS_PYTHON=.venv2`):
   `POST /api/tts/cloned-voices` → NDJSON phase load → synth → progress
   0/1 → 1/1 → `done` sau **47s wall**, `clonedVoice.id
   bda2ca3badb4457a`, `refDurationSec 4.4`, preview download 200, ffprobe
   preview **1.84s WAV 48kHz mono PCM16**.
3. **Dùng giọng đã lưu**: `POST /api/tts { clonedVoiceId }` 120 ký tự →
   **51s wall**, `done { cloned: true, voice: "Giọng Hải Đăng Clone",
   durationSec: 5.84, chunks: 1 }`, WAV tải về ffprobe **5.84s, 48kHz mono
   PCM16** — thời lượng trùng đúng 5.84s với bản preset cùng text.
4. **Độ giống giọng** (script D2 `test_d2_similarity.py` + script cosine
   riêng `cosine_l8.py`, speaker embedding 192 chiều của chính
   `encode_reference`): ref x clone = **0.9024**; đối chứng cùng preset
   khác text 0.8678 / 0.7732; khác giọng (Trúc Ly) 0.4479 / 0.4213; clone x
   preset Hải Đăng cùng text 0.9041. Clone giữ embedding giọng trên mức
   "cùng preset khác text" và xa hẳn sàn "khác giọng" — khớp hướng kết quả
   D2 đợt 4 (0.9160).
5. **Xóa**: `DELETE` → `{ ok: true }`, list rỗng, thư mục giọng đã xóa khỏi
   đĩa, registry chỉ còn `{"voices": []}`.

## Giới hạn trung thực

1. **Mẫu test là giọng tổng hợp, không phải giọng người thật.** Số cosine
   0.9024 đo *chuyển embedding*, không phải "nghe giống người thật".
   Chưa có test nghe chủ quan, chưa có mẫu giọng người thật nào.
2. **Tốc độ chậm và dao động mạnh theo tải VM**: cùng VM này, synth 120 ký
   tự mất 51s qua bridge (0.11x realtime), 91 ký tự mất 45.1s (0.098x),
   nhưng 2 lần chạy sau đó chỉ mất 10.0s / 6.4s (0.58x / 0.51x). Mỗi lần
   gọi `tts.py` đều **nạp lại model** (~1-2GB) — không có tiến trình TTS
   thường trú. Trên máy user sẽ nhanh hơn; đừng quote 1 con số tốc độ duy
   nhất. ETA ở event progress đầu tiên là `null` (EtaTracker chưa đủ mẫu
   — hành vi có sẵn của đợt 81 I6, không phải bug).
3. **Mẫu cần 3–30s, một giọng rõ, ít nhiễu** (khuyến nghị UI; bridge chỉ
   chặn cứng >120s / >20MB). Mẫu quá ngắn (<1s), nhiều người nói, nhạc nền
   hoặc nhiễu lớn — chưa test, chất lượng clone không đảm bảo; bridge vẫn
   "tạo thành công" nếu câu thăm dò tổng hợp được (verify chỉ kiểm tra
   *tổng hợp được*, không kiểm tra *giống*).
4. **Giọng chỉ sống trên máy chạy bridge**: lưu ở `~/.vcut/cloned-voices`,
   không commit vào repo, không đồng bộ, không backup/export. Xóa home dir
   hoặc đổi máy → mất giọng. Xóa giọng là xóa hẳn (không thùng rác).
5. **Đồng thời**: ghi registry dùng fs đồng bộ nên an toàn trong 1 process
   bridge; **2 process bridge cùng trỏ 1 `BRIDGE_CLONED_VOICES_DIR` có thể
   ghi đè registry của nhau** (không có lock file) — cấu hình không hỗ trợ.
6. **Preview chỉ nghe được 1 lần**: `downloadUrl` của bản đọc thử là
   one-time (ai-downloads). UI đã tải blob ngay sau khi tạo; nếu user đóng
   panel trước khi blob tải xong thì mất bản nghe thử (giọng vẫn đã lưu,
   nghe lại bằng cách tổng hợp 1 câu mới).
7. **Chưa click-test UI trên browser thật** (nợ đứng của vòng lặp: VM không
   tới được dev server; chỉ kiểm chứng wiring qua test đọc source +
   e2e HTTP). Chưa test mẫu dài ~120s, mẫu `.mp3/.m4a` thật (chỉ `.wav`),
   chưa test tạo giọng khi bridge restart giữa chừng.
8. **Không có** word-level timestamps cho giọng clone (như preset), SSML,
   chỉnh tốc độ/cảm xúc, đổi tên giọng sau khi tạo (muốn đổi tên: xóa rồi
   tạo lại), import/export giọng.

## Test chạy trong đợt (đều xanh)

- Bridge unit `test-tts-cloned-voices.cjs`: **18/18** (validate tên/id,
  prepare→commit→list/get→delete, registry hỏng, giới hạn 20 giọng).
- Bridge e2e `test-tts-cloned-voices-e2e.cjs` (bridge thật + stub TTS):
  **40/40** (tạo/lỗi validate/preview 1 lần/dùng giọng/trùng tên/hủy giữa
  chừng không để lại giọng dở/xóa).
- Bridge `test-bridge-error-protocol.cjs`: **144/144** (catalog 108).
- Web `bridgeErrors62R5.test.ts` (khóa 3 chiều): **9/9** (108 mã).
- Web `clonedVoices.test.ts`: **14/14** (helper + i18n + wiring UI).
- `tsc --noEmit`: **0 lỗi**; `vite build`: pass (cảnh báo chunk >500kB
  có sẵn từ trước).

## Sửa kèm phát hiện trong lúc làm (ngoài phạm vi L8 nhưng cần ghi)

- **Test khóa mã lỗi đã lệch từ đợt 80 H8**: `test-bridge-error-protocol`
  đếm 11 call site `taskErrorPayload` literal nhưng H8 gộp 2 site TTS vào
  helper tham số `failCode` nên chỉ còn 9 — test này đã fail từ trước đợt
  này (không phải do L8). Đã sửa test về 9 + khóa riêng 2 mã TTS tham số.
- **Mã `TTS_NO_WAV` chết trong catalog** (có trong catalog/web/dict nhưng
  không code nào emit — grep toàn `server/bridge/src` chỉ thấy trong
  `errorCodes.js`). Đã gắn mã thật vào `runTts` (`tts.js`): khi tts.py exit
  0 nhưng không có WAV, reject `codedError("TTS_NO_WAV", <cùng message cũ>)`.
  Không đổi hành vi: `taskErrorPayload` không đọc `.code` nên payload trả
  về như cũ; chỉ để mã có call site thật (test khóa call site).
- **`/tmp` đầy (tmpfs 512MB, 100%)** lúc chạy e2e lần đầu: `/tmp/l1-probe`
  497MB là scratch của luồng L1 đợt 84 — KHÔNG xóa (đồ của luồng khác).
  E2E/unit chạy lại với `TMPDIR` trỏ sang scratch trong goal hidden_files.
  Lỗi lần đầu do hết đĩa (ghi WAV stub thất bại), không phải do code L8.

## File đổi (batch stage: `phase9-round84-l8-tts-voice-cloning.txt`)

Mới: `server/bridge/src/clonedVoices.js`,
`server/bridge/test/test-tts-cloned-voices.cjs`,
`server/bridge/test/test-tts-cloned-voices-e2e.cjs`,
`apps/web/src/lib/clonedVoices.ts`, `apps/web/src/lib/clonedVoices.test.ts`,
`apps/web/src/i18n/fragments/round84-l8.json`,
`docs/PHASE9_ROUND84_L8_TTS_VOICE_CLONING_LIMITS.md`.
Sửa: `server/bridge/src/index.js`, `server/bridge/src/errorCodes.js`,
`server/bridge/src/tts.js`,
`server/bridge/test/test-bridge-error-protocol.cjs`,
`apps/web/src/components/TtsButton.tsx`,
`apps/web/src/components/TtsButton.css`,
`apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`,
`apps/web/src/lib/bridgeErrors.ts`,
`apps/web/src/lib/bridgeErrors62R5.test.ts`.
Không đụng file proxy (L9) hay WebKit loop (L10). Không binary, không
`.github/workflows/*`, không push.

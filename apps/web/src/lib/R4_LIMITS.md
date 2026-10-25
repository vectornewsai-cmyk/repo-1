# R4_LIMITS.md — Phase 9 R4: Caption karaoke/SRT + TTS nâng cấp

> Tài liệu giới hạn trung thực của batch R4. Đọc trước khi dùng các tính năng
> này hoặc trước khi báo cáo "đã xong". Mọi con số đều từ test thật chạy trên
> máy 2vCPU/8GB/no-GPU ngày 2026-10-24, không phải ước lượng.

## 1. Karaoke highlight (tô sáng từng từ)

### Đã làm thật
- Spec mới: `TextClip.karaoke?: KaraokeWord[]` (`{word, start, end}` — thời gian
  tính bằng GIÂY TƯƠNG ĐỐI so với `clip.start`, KHÔNG phải media time) và
  `TextStyle.highlightColor` (mặc định `"#ffff00"` khi không đặt).
- Preview (`preview.tsx`): `karaokeLayout()` + `drawKaraokeWords()` — mỗi từ đổi
  sang màu highlight từ đúng thời điểm bắt đầu của từ.
- Render thật (`server/render/src/render.js`): `buildKaraokeAss()` dùng thẻ ASS
  `\k` (centisecond), PrimaryColour = màu highlight (phần đã hát),
  SecondaryColour = màu gốc (phần chưa hát). Khoảng trống trước từ đầu được xử
  lý bằng âm tiết khoảng trắng vô hình để dòng chữ hiện từ `clip.start` với màu
  gốc. Clip karaoke được BỎ QUA ở vòng lặp drawtext và ở đường render text-SR
  PNG (giống typewriter); ASS karaoke được áp bằng filter `subtitles` thứ hai,
  sau ASS typewriter.
- CaptionModal: khi caption Whisper có word timestamps, người dùng được tick
  "karaoke" + chọn màu highlight; `addCaptionTrack` nhận `words` (media time)
  và map sang karaoke clip-local qua `wordsForSegments()` /
  `wordsToKaraoke()`. Track dịch (translate) KHÔNG BAO GIỜ có karaoke vì bản
  dịch không có word timestamps.
- Store: `trimClip` trái dịch karaoke (`shiftKaraoke`), phải cắt karaoke
  (`clampKaraoke`); `splitLinkedCaptionsMulti` chỉ GIỮ karaoke trên mảnh có độ
  dài gần bằng gốc (±0.05s) — mảnh bị cắt giữa câu MẤT karaoke nhưng giữ text
  thường, không đoán thời gian từ.

### Giới hạn — đọc kỹ
1. **Preview ≠ render ở mức từng ký tự.** Preview tô sáng CẢ TỪ ngay từ thời
   điểm bắt đầu từ đó. Render ASS `\k` quét (sweep) từng từ theo centisecond:
   trong một từ, phần đã hát tăng dần theo thời gian. Hai bên chỉ khớp ở mức
   "từ nào đang hát / đã hát xong", không khớp ở mức từng ký tự trong từ.
2. **Typewriter thắng karaoke.** Clip có cả `animation: "typewriter"` và
   `karaoke` thì chỉ typewriter được render/preview, karaoke bị bỏ qua ở cả hai
   nơi (không render chồng hai hiệu ứng).
3. **Karaoke không áp cho clip có scale/rotation keyframes** — ASS không làm
   được SR; `validate.js` chỉ cảnh báo (warning), không chặn.
4. **Karaoke dưới speed curve chỉ là xấp xỉ.** `rescaleKaraoke()` scale tuyến
   tính theo tỉ lệ duration; đúng khi tốc độ hằng số trên caption, xấp xỉ khi
   có speed curve (giống giới hạn chung của captionFollow).
5. **Dịch caption mất karaoke.** Bản dịch chỉ có segment text, không có word
   timestamps — không có cách nào khôi phục karaoke từ bản dịch.
6. **Karaoke chỉ có từ Whisper.** Caption nhập từ file SRT/VTT không bao giờ
   có karaoke (định dạng không chứa word timestamps).

### Kiểm chứng
- `server/render/test_r4_karaoke.js`: **4/4 pass** — render MP4 thật từ spec
  karaoke, trích frame và đếm pixel: t=0.4s vàng 950 / trắng 4101 (từ 1 đang
  hát); t=2.0s vàng 3545 / trắng 1436; t=3.6s vàng 4959 / trắng 0 (hát xong).

## 2. SRT/VTT xuất/nhập

### Đã làm thật
- Thư viện mới `apps/web/src/lib/subtitles.ts`: `parseSrt`, `parseVtt`,
  `parseSubtitleFile` (tự nhận diện VTT qua header `WEBVTT`), `formatSrt`,
  `formatVtt`, `clipsToCues`, `cuesToTextClips`.
- Quy tắc parse: timestamp `HH:MM:SS,mmm` hoặc `.mmm` (VTT thêm `MM:SS.mmm`);
  phút/giây ≥ 60 bị từ chối; SRT không bắt buộc số thứ tự liên tiếp; VTT bắt
  buộc có header `WEBVTT` (thiếu = lỗi toàn file, không cue nào); cue ID và
  setting sau timestamp (`align:start`…) được chấp nhận; text nhiều dòng giữ
  nguyên `\n`.
- Cue hỏng KHÔNG làm hỏng cả file: bị bỏ qua nhưng ghi vào `errors` dạng
  `{block (1-based), reason}` để UI báo rõ từng khối.
- CaptionModal: nhập file `.srt/.vtt` ở bước cấu hình (vào review step như
  caption thường, không có karaoke); xuất SRT/VTT từ các segment ĐÃ GIỮ (segment
  bị loại ở review không xuất) qua nút "⬇ Xuất SRT" / "⬇ Xuất VTT".

### Giới hạn
1. **Nhập SRT/VTT mất karaoke** — định dạng không có word timestamps (xem §1.6).
2. **Xuất SRT/VTT hiện chỉ có trong CaptionModal** (từ segments đang review).
   Hàm `clipsToCues()` đã sẵn cho timeline clip, nhưng CHƯA có nút UI xuất
   trực tiếp từ clip trên timeline — cần thêm nếu muốn xuất từ timeline.
3. **VTT không header = lỗi toàn file.** Đây là quyết định cố ý (tránh nhận
   nhầm file text thường thành VTT); file SRT không có vấn đề này.
4. **Timestamp VTT dạng giờ-phút-giây-thập phân dùng dấu chấm** (`.mmm`),
   SRT dùng dấu phẩy (`,mmm`) — đúng chuẩn từng định dạng, không hoán đổi.

### Kiểm chứng
- `src/lib/subtitles.test.ts`: **14/14 pass** (SRT cơ bản + nhiều dòng, số thứ
  tự không liên tiếp, cue hỏng + báo block, timestamp >60s, VTT header + cue
  ID + MM:SS.mmm, thiếu header VTT = lỗi toàn file, setting sau timestamp,
  round-trip SRT, round-trip VTT, SRT↔VTT tương đương, auto-detect, timestamp
  biên, clipsToCues lọc, cue rỗng báo lỗi).

## 3. TTS: voice cloning + chia text dài

### Đã làm thật
- **Voice cloning CÓ trong package đã cài** (`vieneu` 3.8.3 — VieNeu-TTS v3
  Turbo 0.5B, Apache-2.0, đã verify từ trước). API thật của engine
  `V3TurboVieNeuTTS` (đọc từ source đã cài, không phải từ trí nhớ):
  `encode_reference(ref_audio)` trả về **tuple `(speaker_emb, ref_codes)`**
  (không phải một embedding 128 chiều), và `infer()` nhận clone qua
  `ref_audio=path` hoặc `voice={"speaker_emb": emb, "codes": codes}`.
  Không cần model mới, không cần verify license mới.
- `server/tts/tts.py`: thêm `--ref-audio PATH` (ghi đè `--voice`; watermark
  vẫn TẮT; mode vẫn ép `v3turbo` — 0.3B CC BY-NC không bao giờ được mở qua
  CLI). File mẫu: tối đa 120s (đo bằng ffprobe nếu có; không có ffprobe thì
  bỏ qua bước đo). Enroll 1 lần bằng `encode_reference`, truyền dict
  `{speaker_emb, codes}` cho mọi chunk (tránh enroll lại mỗi chunk); nếu
  engine khác không trả tuple thì fallback về `infer(ref_audio=...)` mỗi
  chunk. **Bài học ghi lại:** lần thử đầu truyền `np.asarray()` lên tuple
  và `voice=embedding` đã lỗi thật ("inhomogeneous shape (2,)") — đã sửa
  theo API thật và test lại (xem §3.5).
- **Chia text dài theo câu**: `split_text_chunks()` — ngắt ở biên câu (giữ
  dấu kết câu), câu đơn quá dài thì tách ở dấu phẩy/chấm phẩy/hai chấm rồi
  khoảng trắng, KHÔNG BAO GIỜ cắt giữa từ; `concat_with_crossfade()` nối các
  chunk bằng crossfade tuyến tính 20ms ở mối nối (tránh tiếng "tách").
  Giới hạn nâng 2000 → **5000 ký tự** (đồng bộ `tts.py` ↔ `bridge/tts.js`).
- Bridge: `POST /api/tts/clone` (multipart: field `refAudio` + `text`; validate
  audio type `.wav/.mp3/.m4a/.ogg/.flac/.webm` + cap 20MB; rate-limit như
  render; file mẫu + WAV đích dọn sau khi gửi xong).
- UI (`TtsButton.tsx`): checkbox "🎭 Clone giọng từ file mẫu (local)" — chọn
  file mẫu → POST `/api/tts/clone` → cùng luồng đưa vào media pool + đặt lên
  track audio như preset. Gợi ý mẫu: 3–30s, một giọng rõ, ít nhiễu.

### Giới hạn — đọc kỹ
1. **Chia chunk là ở mức câu, không phải sample-perfect.** Crossfade 20ms
   làm mối nối không nghe tiếng tách, nhưng ngữ điệu ở biên câu vẫn là của 2
   lần infer riêng — không liền mạch tuyệt đối như một lần infer duy nhất.
2. **Chất lượng clone phụ thuộc hoàn toàn vào mẫu.** Mẫu nhiễu, nhiều người
   nói, hoặc quá ngắn (<3s) cho giọng clone kém — engine không báo lỗi trong
   các trường hợp này, chỉ cho ra giọng không giống.
3. **Giới hạn 5000 ký tự vẫn còn.** Text dài hơn vẫn bị từ chối rõ ràng; model
   tự chunk ở tầng phoneme (max_chars=256) bên trong mỗi chunk 800 ký tự, nên
   text rất dài chủ yếu tốn thời gian (~0.28x realtime trên CPU yếu: 116 ký
   tự mất 22.7s tổng hợp).
4. **Clone là local 100%, không gửi mẫu đi đâu** — nhưng giọng clone vẫn là
   giọng của người trong mẫu: chỉ clone giọng mình có quyền dùng.
5. **Xem §3.5 về kết quả test clone thực tế** (lỗi encoder, cách sửa, và
   trạng thái cuối cùng).

### Kiểm chứng
- Chia câu (không nạp model): câu thường gom đúng chunk ≤ giới hạn, câu đơn
  300 từ tách ở khoảng trắng và nối lại đúng từng từ, crossfade nối 2 chunk
  có độ dài đúng `a + b − fade`.
- Tổng hợp thật (preset, qua đường chunking mới): 116 ký tự → WAV 48kHz mono
  6.32s, `chunks: 1, cloned: false`; 523 ký tự → WAV 25.85s.
- Tổng hợp thật đa-chunk: 814 ký tự → **2 chunk** (559 + 254 ký tự) → WAV
  40.35s, `chunks: 2`, tổng hợp 103.8s (~0.39x realtime trên CPU yếu).
- Clone thật: xem §3.5.

### 3.5 Kết quả test clone thực tế (2026-10-24, đã chạy xong)
- **Lần 1 — LỖI THẬT, đã sửa.** Code đầu tiên làm `np.asarray()` lên kết quả
  `encode_reference()` và truyền embedding trần làm `voice`. Lỗi:
  `setting an array element with a sequence ... shape (2,) + inhomogeneous`.
  Nguyên nhân (debug trực tiếp bằng cách nạp engine như tts.py):
  `encode_reference()` của `V3TurboVieNeuTTS` (vieneu 3.8.3) trả về **tuple**
  `(speaker_emb shape (192,), ref_codes shape (77, 16))`, không phải một
  embedding 128 chiều; `infer()` chỉ hiểu `voice` là tên preset hoặc dict.
- **Lần 2 — SAU KHI SỬA, CHẠY ĐƯỢC.** tts.py enroll 1 lần → dict
  `{speaker_emb, codes}` → `infer(voice=dict)`:
  `giọng mẫu đã mã hoá (emb (192,), codes (77, 16))`, 49 ký tự → WAV 48kHz
  mono 2.64s, JSON `cloned: true, watermark: false`, tổng hợp 5.3s.
  Mẫu dùng test là file WAV do chính preset tổng hợp trước đó (mẫu tổng hợp,
  không phải giọng người thật) — test này chứng minh đường encode→infer chạy
  thật đầu-cuối, KHÔNG chứng minh độ giống giọng với giọng người thật (cần
  mẫu giọng người thật + nghe kiểm chứng, chưa làm).
- **Chưa test:** clone + đa-chunk cùng lúc (code đã chung đường chunking với
  `voice_dict` truyền mỗi chunk, nhưng chưa chạy test kết hợp); clone qua
  bridge `POST /api/tts/clone` đầu-cuối (endpoint đã viết + `node --check`
  pass, chưa chạy bridge thật với file mẫu); độ giống giọng clone với mẫu
  người thật (cần nghe chủ quan).

## 4. File đã đổi trong R4 (để gom batch push sau — KHÔNG PUSH)

```
packages/video-spec/src/index.ts          (KaraokeWord, TextClip.karaoke, TextStyle.highlightColor)
server/render/src/render.js               (buildKaraokeAss, karaokeAssFile, skip drawtext/SR)
server/render/src/validate.js             (validate karaoke + highlightColor)
server/render/test_r4_karaoke.js          (MỚI — test render karaoke 4/4)
apps/web/src/preview.tsx                  (karaokeLayout, drawKaraokeWords)
apps/web/src/lib/captions.ts              (CaptionWord, validateCaptionWords, wordsForSegments, wordsToKaraoke)
apps/web/src/lib/captionFollow.ts         (rescaleKaraoke, wordsBySegment, shiftKaraoke, clampKaraoke, split rule)
apps/web/src/store.ts                     (addCaptionTrack words/style opts, trimClip karaoke)
apps/web/src/components/CaptionModal.tsx  (karaoke toggle/color, SRT/VTT import/export)
apps/web/src/components/TtsButton.tsx     (chế độ clone giọng)
apps/web/src/lib/subtitles.ts             (MỚI — parse/format SRT/VTT)
apps/web/src/lib/subtitles.test.ts        (MỚI — 14/14)
apps/web/src/lib/R4_LIMITS.md             (MỚI — file này)
server/bridge/src/caption.js              (validateWords, done event kèm words)
server/bridge/src/index.js                (done words, POST /api/tts/clone)
server/bridge/src/tts.js                  (MAX 5000, validateRefAudio, runTts refAudioPath)
server/tts/tts.py                         (--ref-audio, split_text_chunks, concat_with_crossfade, MAX 5000)
server/tts/TTS_LIMITS.md                  (cập nhật R4 — xem dưới)
```

## 5. Hồi quy đã chạy (2026-10-24)
- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npx vite build` (apps/web): **pass**.
- `subtitles.test.ts` 14/14, `captionFollow.test.ts` 22/22,
  `clipboard.test.ts` 18/18.
- `node --check` render.js, validate.js, bridge caption.js/index.js/tts.js:
  **OK** (đã sửa 1 lỗi escape quote `\"` thừa trong bridge/tts.js do thao tác
  edit — đã verify lại bằng node --check).

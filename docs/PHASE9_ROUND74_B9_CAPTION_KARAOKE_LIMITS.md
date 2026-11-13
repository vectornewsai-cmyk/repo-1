# PHASE9_ROUND74_B9 — Caption karaoke highlight + xuất SRT/VTT (gap A1)

Ngày: 09/11/2026. Luồng B9, đợt 74. KHÔNG push (stage only).

## §1. Gap A1 thực trạng trước đợt này — phần lớn đã có từ R4

Trước khi code, kiểm tra thực tế trên cây cho thấy gap A1 **không còn
nguyên vẹn** như mô tả: 3 trong 4 việc đã làm xong ở Phase 9 R4:

| Việc trong A1 | Trạng thái trước B9 |
|---|---|
| Preview highlight từng từ theo word timestamps | CÓ — `preview.tsx` `karaokeLayout`/`drawKaraokeWords` (R4) |
| Render ASS `\k` theo word timestamps | CÓ — `render.js` `buildKaraokeAss` (R4), validator đã check `clip.karaoke` |
| Xuất SRT/VTT + UI xuất | CÓ — `lib/subtitles.ts` + `CaptionModal` (nút xuất review + xuất project, R4/D6) |
| **Style template karaoke có tên** | **CHƯA CÓ** — chỉ có color picker tự do, không preset nào |

Vì vậy B9 tập trung vào phần thực sự thiếu (template + kiểm chứng thật
đầu-cuối), thay vì viết lại cái đã có.

## §2. Đã làm (đợt 74 B9)

### 2.1. Ba style template karaoke có tên — `apps/web/src/lib/captions.ts`

`KARAOKE_STYLE_TEMPLATES` (mỗi template = 1 bộ `TextStyle` hoàn chỉnh):

| id | Tên (vi / en) | highlight | nền | chữ |
|---|---|---|---|---|
| `vang-noi-bat` (mặc định) | Vàng nổi bật / Bold yellow | `#ffff00` | `#000000` | `#ffffff` |
| `nen-mo` | Nền mờ / Dim background | `#00e5ff` | `#00000080` (đen 50%) | `#ffffff` |
| `hong-neon` | Hồng neon / Neon pink | `#ff4fd8` | `#000000` | `#ffffff` |

- Template chỉ là dữ liệu style nên dùng được **cả hai đường**: preview
  (canvas đọc `style.highlightColor`/`backgroundColor`) và render (ASS:
  PrimaryColour = highlight, BackColour = nền).
- `resolveKaraokeTemplate(id)`: id lạ/`undefined`/`null`/`""` → template
  mặc định, không bao giờ null.
- `karaokeActiveWordIndex(words, localT)`: tách logic "từ nào đang sáng"
  khỏi `drawKaraokeWords` để test được; tô sáng **tích lũy** (mọi từ có
  `start <= t`) như hành vi cũ. `preview.tsx` dùng helper này (khác biệt
  duy nhất ở preview: thay điều kiện inline bằng helper, hành vi không đổi).

### 2.2. UI chọn template — `CaptionModal.tsx`

- Select "Kiểu karaoke:" trong bước review, **chỉ hiện khi có word
  timestamps** (`words.length > 0`), cạnh checkbox karaoke + picker màu.
- `apply()`: áp style template lên clip phụ đề. Mặc định (Vàng nổi bật +
  picker chưa đổi) → không override để spec giữ đúng style mặc định cũ.
  Picker màu thắng template khi user đã đổi màu khác `#ffff00` (hành vi
  cũ R4 giữ nguyên). Template áp cả khi karaoke tắt (style chữ/nền vẫn
  có ích cho caption thường) — xem §4.4.

### 2.3. Hex 8 ký tự `#rrggbbaa` end-to-end (để "Nền mờ" là mờ thật)

Template `nen-mo` cần nền đen 50% (`#00000080`); validator cũ chỉ nhận
`#rgb`/`#rrggbb` nên phải mở cả chuỗi:

- `server/render/src/validate.js` — `isHexColor` chấp nhận thêm 8 ký tự
  (7 ký tự và ký tự lạ vẫn bị từ chối; test khóa trong
  `test_karaoke_alpha74b9.js`).
- `server/render/src/render.js` — `hexToAssColor`: `#rrggbbaa` →
  `&HAABBGGRR` với AA **đảo** (alpha ASS: 00 = đục, FF = trong suốt,
  ngược CSS). Vd: `#00000080` → `&H7F000000` (đã verify qua dry-run, §3).
- `server/render/src/render_text_png.py` — `hex_to_rgba` mới, `--bg` giữ
  alpha thật (trước đây ép `(255,)` nên nền mờ vẽ thành đục). Đã verify:
  `#00000080` → alpha 128, `#000000` → 255 (không đổi hành vi cũ),
  `#ff000040` → 64.
- `drawtext` `boxcolor=#RRGGBBAA`: ffmpeg 8.1.2 trên VM này chấp nhận
  trực tiếp (probe tay OK), không cần đổi `render.js:954`.
- `packages/video-spec/src/index.ts`: ghi chú `backgroundColor` chấp nhận
  `#rrggbbaa`.
- **Cố ý KHÔNG đổi** chuỗi lỗi `style.color phải là mã hex (#rgb hoặc
  #rrggbb)`: test `test_validate_codes.js` (đợt 63 R5) khóa chuỗi lỗi
  không đổi + classifier `validateCodes.js` chỉ nhận diện wording cũ.
  Đổi wording làm 1 test đỏ (đã gặp, đã revert). Nhược điểm: thông báo
  không nhắc `#rrggbbaa` — ghi nhận ở §4.7.

### 2.4. i18n: +4 key mỗi locale → dict 2400 → 2404

`caption.karaokeStyleLabel` ("Kiểu karaoke:"), `karaokeStyleYellow`,
`karaokeStyleDimBg` ("Nền mờ"), `karaokeStyleNeonPink` — vi/en parity,
placeholder không có (không placeholder nào), không rỗng.

Đã bump **mọi** test khóa số key (theo mẫu đợt 73 A9, nhưng A9 chỉ sửa
1 file — đợt này rà toàn bộ repo và sửa hết):
`ProjectMenu.i18n55L1`, `i18nAudit59P7`, `i18nRound57N4`,
`reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`,
`reverseToggleI18n48D4`, `i18nOrphans60Q4`, `saveToast31`,
`structuredNotes32` (2400 → 2404) + comment ở
`speedWarnTooShortDead63R10`/`errorDetail34Q4`.

### 2.5. Test khóa số lượng caption trong modal

- `captionModal60Q3.test.ts`: caption object 45 → **50 key**, call site
  `t(` 55 → **58**. Ghi nhận: test này **đã lệch trước B9** — 45 (đợt 60)
  + 1 object `caption.phase` (đợt 63 R1, không ai bump) = 46 trước B9;
  B9 +4 key = 50, +3 call site (label ×2 + `t(tpl.nameKey)` ×1) = 58.
- `modalClasses59P4.test.ts`: Caption 49 key / 55 call site → **50 key /
  57 call site**. Chỉ `caption.karaokeStyleLabel` được đếm ở đây (regex
  `t("...")` chỉ quét `CaptionModal.tsx`); 3 key tên template nằm trong
  `lib/captions.ts` dạng data nên không đếm — ghi rõ trong comment test.

## §3. Kiểm chứng thật (số đo)

Môi trường: VM này, ffmpeg 8.1.2, node v24.22.1, Chromium 1254 (headed
qua Xvfb).

| Kiểm chứng | Kết quả |
|---|---|
| `tsc` web (`--noEmit`) | **0 lỗi** (chạy 2 lần, sau mọi sửa) |
| `vite build` | **PASS** (57,4 s; chunk >500 kB warning cũ, không mới) |
| Test mới `captionKaraoke74B9.test.ts` (templates, resolve, active-word, segments+template, SRT/VTT round-trip, dict 4 key) | **10/10 pass** |
| Test mới `test_karaoke_alpha74b9.js` (validator 8-digit + PNG alpha) | **8/8 pass** |
| Suite liên quan (22 file test: subtitles, captionsExport59P5, captionsTrack58O5, captionModal60Q3, captionFollow, 10 test dict 2404, cssClasses60Q2 59/59, cssClasses61R4 60/60, textStyle ×2, validate_codes 1572, karaoke_alpha 8) | **22/22 file xanh, 0 fail** |
| Render thật karaoke (dry-run đọc ASS + render MP4 + ffprobe + pixel) | **21/21 pass** (xem dưới) |
| Headed thật `clicktest-74b9-caption-karaoke.mjs` (vite + bridge stub + Chromium) | **6/6 pass** (xem dưới) |

### 3.1. Render thật — ASS `\k` + MP4 + pixel

Spec: video đen 5 s 640×360 + 1 text clip karaoke template "Nền mờ",
4 từ (Xin 0–0,5 s; chào 0,5–1,0 s; các 1,0–1,7 s; bạn 1,7–3,0 s).
File ASS đọc từ dry-run (render giữ file tạm khi dry-run):

```
Style: KA0,Inter,56,&H00FFE500,&H00FFFFFF,&H80000000,&H7F000000,-1,0,0,0,100,100,0,0,3,2,0,5,10,10,10,1
Dialogue: 0,0:00:00.50,0:00:03.50,KA0,,0,0,0,,{\pos(320,306)}{\k50}Xin {\k50}chào {\k70}các {\k130}bạn
```

- PrimaryColour `&H00FFE500` = cyan `#00e5ff` ✓; BackColour
  `&H7F000000` = đen 50% ✓; `\k` đúng centisecond từng từ (50/50/70/130)
  ✓; dialogue 0:00:00.50 → 0:00:03.50 ✓.
- Render thật exit 0 (4,0 s); `karaoke.mp4` ffprobe: video 640×360,
  duration 5,0 s ✓.
- Pixel (PIL, nền đen): frame t=0,4 (trước clip): **0 pixel cyan**;
  frame t=1,2 (đang hát từ "các"): **1619 pixel cyan + 1603 pixel
  trắng** (từ "bạn" chưa hát) ✓.
- SRT sinh bằng `formatSrt` thật: ffprobe đọc được **stream subrip**,
  2 cue, timestamp `00:00:00,500 --> 00:00:03,500` ✓.
- Lưu ý: lần chạy render-verify thứ 2 báo 20/21 (1 fail) nhưng log nằm
  trong `/tmp` và `/tmp/round74-b9` bị dọn trước khi đọc nên **không xác
  định được check nào fail**; chạy lại sạch ngay sau đó: **21/21**.
  Coi đây là nhiễu môi trường (dọn `/tmp`), không phải lỗi code — nhưng
  ghi nhận trung thực vì không chứng minh được ngược lại.

### 3.2. Headed thật — modal + preview (caption stub, không cần model)

Bridge chạy với `CAPTION_PY=test-caption-stub.py` (trả 3 câu + 2 word
timestamps trong ~1 s). Chromium headed 1440×900 qua Xvfb:

| Case | Kết quả |
|---|---|
| B0 setup vi + mẫu tự load | PASS — 3 clip, media bin 2 item |
| B1 caption stub → review | PASS — select template 3 lựa chọn (Vàng nổi bật / Nền mờ / Hồng neon), mặc định `vang-noi-bat`, karaoke đang bật |
| B2 chọn "Nền mờ" | PASS — select = `nen-mo`, nút Áp dụng vẫn bấm được |
| B3 Apply bằng chuột thật | PASS — track "Phụ đề 2" 2 clip; clip 1 `bg #00000080`, `hi #00e5ff`, karaoke clip-local 2 từ `[0,0.4] [0.4,0.8]` (đọc từ store thật) |
| B4 preview highlight (pixel canvas) | PASS — playhead 1,0: **478 pixel cyan**; playhead 0,1: **0 pixel cyan** |
| H9 0 lỗi trang | PASS |

Script: `apps/web/scripts/clicktest-74b9-caption-karaoke.mjs`. Log +
screenshot: `hidden_files/round74-b9/headed/` (gồm `b9-headed-report.json`,
`b9-review-vi.png`, `b9-preview-t1.0.png`, `b9-preview-t0.1.png`).
Kinh nghiệm: welcome modal mở trễ che TopBar (đúng bẫy Q3 đã ghi) —
script đã port `ensureNoModal` + `openModal` cứng cáp từ Q3.

## §4. Hạn chế trung thực — cái gì CHƯA làm được / chưa biết

### 4.1. Độ chính xác word timestamps của faster-whisper: CHƯA ĐO trong đợt này
Đợt này **không chạy faster-whisper thật** (dùng stub cho headed; render
dùng timestamps viết tay). Mọi kiểm chứng karaoke đều đúng **theo
timestamps đầu vào** — nếu whisper trả biên từ lệch (thường ±0,1–0,3 s,
tệ hơn với tiếng Việt nói nhanh, từ ngắn, tiếng ồn), highlight và `\k`
sẽ lệch theo đúng bằng đó. `caption.py` làm tròn timestamps về 2 chữ số
thập phân (sai số làm tròn ≤0,01 s, không đáng kể so với sai số model).
**Chưa có số đo độ lệch word timestamps trên audio thật** — cần một đợt
riêng chạy caption thật trên clip nói tiếng Việt rồi so timestamps với
ground truth nghe tay.

### 4.2. Preview tô sáng theo từ, render quét mịn — không pixel-identical
Preview đổi màu **nguyên từ** khi tới lượt (ghi từ R4); render ASS `\k`
quét màu mịn **trong từng từ** theo thời gian. Vị trí từ và từ nào đã
qua thì khớp; hiệu ứng chuyển màu trong từ thì khác. Đây là giới hạn
kiến trúc (canvas vs libass), không phải bug.

### 4.3. SRT/VTT không mang karaoke — xuất rồi nhập lại thì mất highlight
Định dạng SRT/VTT không có word timestamps. Caption nhập từ SRT/VTT
(`CaptionModal` đã `setWords([])`) và track dịch đều **không karaoke**,
không có select template. Muốn giữ karaoke qua xuất/nhập thì cần định
dạng riêng (vd: ASS) — chưa làm.

### 4.4. Template chỉ có khi caption có word timestamps
Select template chỉ hiện ở bước review khi bridge trả `words`. Caption
từ SRT/VTT nhập tay, track dịch, và caption tạo từ clip không có lời
đều dùng style mặc định, không chọn được template. (Áp template cho
caption thường — không karaoke — là việc nhỏ, chưa làm vì nằm ngoài
phạm vi "karaoke" của A1.)

### 4.5. Pixel check chỉ trên nền đen
Render-verify và headed đều dùng nền tối/đen. Nền mờ `#00000080` trên
video nền sáng chưa được nhìn bằng mắt — về lý thuyết hộp đen 50% vẫn
đọc được chữ trắng, nhưng chưa có screenshot làm bằng chứng.

### 4.6. Inspector có thể cắt alpha của nền mờ (CHƯA VERIFY)
`<input type="color">` trong Inspector chỉ hiểu `#rrggbb`. Nếu user mở
clip template "Nền mờ" trong Inspector rồi lưu style, `#00000080` có
thể bị cắt thành `#000000` (mất mờ) hoặc bị từ chối — **chưa kiểm tra
hành vi này**. Ghi là nợ: cần test Inspector với style 8 ký tự rồi mới
khẳng định template an toàn qua mọi đường sửa style.

### 4.7. Thông báo lỗi validator không nhắc `#rrggbbaa`
Chuỗi `style.color phải là mã hex (#rgb hoặc #rrggbb)` được giữ nguyên
cố ý (khóa R5, §2.3). User nhập `#0000008` (7 ký tự) sẽ thấy thông báo
không nhắc tới định dạng 8 ký tự vốn được chấp nhận.

### 4.8. Headed B3 chỉ có 2 clip, không phải 3
Stub trả 3 câu nhưng track tạo ra chỉ 2 clip: câu 3 (6,0–8,7 s) nằm
ngoài clip nguồn mẫu (5 s) nên link-caption bỏ (hành vi cũ của
`linkSegmentsToClips`, không phải lỗi B9). Câu 2 không có karaoke vì
stub chỉ có words cho câu 1.

### 4.9. Chưa kiểm chứng
- Safari / thiết bị thật / mobile-web: chưa chạy headed ngoài Chromium
  trên VM.
- Hiệu năng preview với caption dài (hàng trăm từ): chưa đo.
- TTS/caption thật bằng faster-whisper: không đụng (xem §4.1).

## §5. Blocker ngoài phạm vi đã sửa (ghi rõ để parent/B4 biết)

**Bug `resolveFontFile` luôn trả null** (phát hiện khi render-verify lần
đầu fail với `Không tìm được font "Inter"` dù `fc-match` chạy tay vẫn
ra font):

- Nguyên nhân: `server/render/src/validate.js:1093` gọi `probeTimeoutMs()`
  nhưng dòng import 23 chỉ lấy `{ KILL_SIGNAL, ffprobeTimeoutMs }` từ
  `./timeouts` — `probeTimeoutMs` không được import nên `ReferenceError`
  bị `try/catch` nuốt, mọi candidate font đều fail → **mọi text clip
  render đều fail fast** (không riêng karaoke).
- Fix B9 (1 dòng): thêm `probeTimeoutMs` vào destructuring import.
  Nguồn gốc: đợt 74 B4 thêm timeout cho `fc-match` (`timeout.js` có
  export `probeTimeoutMs`) nhưng quên import ở `validate.js`.
- Verify sau fix: `resolveFontFile("Inter", {bold:true})` →
  `/home/hatch/.fonts/Inter-Bold.ttf`; render thật pass; test alpha 8/8.
- **Cảnh báo merge:** `validate.js` đang được B4 sửa (timeouts) — file
  này nằm trong batch của cả B4 và B9, parent cần gộp cả hai thay đổi
  (import + timeout). Tương tự `render.js`, `preview.tsx`,
  `vi.json`/`en.json` là file chung đợt 74 — B9 chỉ sửa đúng các dòng
  ghi trong §2, không đụng phần khác của các file đó.

## §6. Nợ mở cho đợt sau

1. Đo độ lệch word timestamps faster-whisper trên audio tiếng Việt thật
   (so với nghe tay) — §4.1.
2. Test Inspector với style 8 ký tự (`#00000080`) — §4.6.
3. Áp template cho caption không karaoke (SRT import / track dịch) — §4.4.
4. Xuất ASS karaoke (giữ được `\k` khi xuất file) — §4.3.
5. Screenshot nền mờ trên video nền sáng — §4.5.

## §7. File stage (KHÔNG push)

Batch: `phase9-round74-b9-caption-karaoke.txt` — 28 entry, toàn file
text, đường dẫn tương đối, không binary/workflow. Danh sách đầy đủ trong
file paths (xem `~/workspace/repo-1-push/paths-loop/`).
Log luồng: `hidden_files/round74-b9.md`.
Scratch (không stage): `~/workspace/.tmp-r74b9/` (script render-verify +
gen-srt + log chạy cuối 21/21); `hidden_files/round74-b9/headed/`
(log + screenshot headed).

# Phase 9 đợt 60 Q9 — Docs-only: refresh trạng thái FEATURE_STATUS + gap analysis + benchmark (đóng nợ đợt 59 §6.10)

Ngày: 2026-11-08. Luồng Q9, đợt 60. **DOCS-ONLY — KHÔNG sửa bất kỳ file
code/test nào** (không `.ts`/`.tsx`/`.json` code, không test, không config).
Chỉ đọc + sửa 3 file `.md` và viết file LIMITS này. KHÔNG push, KHÔNG
release/tag, KHÔNG binary vào batch.

## 0. Đếm lại kho trên đĩa — bằng chứng (script `/tmp/count_round60_q9.py`, chạy 08/11)

Script đếm trực tiếp trên đĩa (glob + parse file nguồn), output đầy đủ lưu
tại `/tmp/count_round60_q9.out` (không nằm trong batch vì /tmp không
stage được; toàn bộ số dưới đây trích nguyên văn từ output đó):

| Kho | Số cũ (gap §0) | Số đếm lại 08/11 | Nguồn đếm |
|---|---|---|---|
| i18n key lá vi/en | 1942 (07/11) | **1957 / 1957** | `apps/web/src/i18n/vi.json`, `en.json` (đếm lá đệ quy; khớp ROUND59 §0: 1942 + 15) |
| Transition thật | 67 (58 xfade + 9 custom) | **81** (82 entry gồm `"none"`: 58 xfade + 9 custom P5 + 14 custom V3) | `TRANSITION_TYPES`, `packages/video-spec/src/transitions.ts` (strip comment `//`, đếm literal `"..."`) |
| LUT | 174 | **174** `.cube` | `assets/filters/*.cube` (bản sao trong `apps/desktop/release*/…` và `build/bundled-server` cũng 174 — cùng một bộ, không đếm trùng) |
| Video effects | 16 | **16** | `EFFECT_TYPES`, `packages/video-spec/src/effects.ts` |
| Text preset | 96 | **96** `.css` | `assets/text-presets/*.css` (README trong thư mục cũng ghi 96) |
| Template | 50 | **50** `.json` + 50 entry `TEMPLATES` | `assets/templates/*.json`; `template: {"id"` × 50 trong `apps/web/src/lib/templates.ts` (header file cũng ghi "catalog 50 template") |
| Sticker | 244 | **244** `.png` | `assets/stickers/*.png` (manifest `sticker-manifest.json` chỉ liệt kê 214 — manifest cũ, thiếu 30) |
| Font | 59 | **59 family** (67 file `.ttf` trên đĩa = 59 + 8 biến thể bold) | `assets/fonts/catalog.json` (`count: 59`, 59 entry, 8 entry có `bold_file`); `apps/web/src/lib/fonts.ts` (59 entry `family:`); `assets/fonts/files/*.ttf` = 67 |
| Sound | 1043 | **1043 khai báo, nhưng xem kỹ §0.1** | `assets/sounds/index.json` + `assets/audio/*.ogg` |

### 0.1 Sound 1043 — phân rã trung thực (phát hiện chính của đợt này)

- `index.json`: `total_sounds: 1043` = kenney 12 + uisfx 936 + vcut-synth 95
  (theo `sources[].count`).
- Mảng `sounds` trong cùng file chỉ liệt kê **1013** mục (kenney 12 +
  uisfx 936 + vcut-synth **65** — vcut-synth thiếu 30 so với con số khai
  báo 95).
- Trên đĩa: **107 file `.ogg`** trong `assets/audio/` = 12 kenney + 95
  vcut-synth (65 có trong index + **30 file vcut-synth có trên đĩa nhưng
  không có trong index**: `vcut-synth-chime-bright/deep`,
  `downer-drop/fade/long/soft`, `impact-boom/crack/gong/thud/tick`,
  `riser-echo/glide/spark/tight/vapor`, `stinger-chime/ding/flare/pop`,
  `sweep-dip/glide/pulse/shimmer`, `transition-flick/morph/sweep/zip`,
  `whoosh-burst/spin` — đủ 30, khớp đúng số thiếu của vcut-synth).
- **936 file uisfx không có trên đĩa** (0/936 file liệt kê tồn tại dưới
  `assets/`) — chỉ lấy được qua `assets/sounds/fetch_sounds.sh`.
- Kết luận: "1043" đứng được ở nghĩa **tổng khai báo theo nguồn**
  (12 + 936 + 95 = 1043, và 95 vcut-synth đều có file thật trên đĩa),
  nhưng **không phải số file dùng được ngay**: chỉ 107 file `.ogg` có
  trên đĩa; 936 uisfx cần fetch. Gap analysis §0 nay ghi rõ chú thích
  này thay vì con số trần 1043 như trước. Index `sounds` (1013 mục)
  thiếu 30 mục vcut-synth là nợ dữ liệu nhỏ — nên bổ sung index hoặc
  ghi chú trong `assets/sounds/README.md` (đợt sau).

### 0.2 Các số khác đã đối chiếu (không đếm bằng script đếm kho)

- **TTS đính chính:** 0,12–0,75× realtime, median 0,32× (đợt 49) /
  0,44× (đợt 50), 72 lần đo, infer thuần sau warmup, chưa tính nạp model
  ~10–12,5 s — nguồn: MEMORY (đính chính 06/11) +
  `docs/PHASE9_ROUND50_F3_TTS_LIMITS.md`; số cũ ~1,5–2,5× đã bị bác bỏ.
  Không đo lại trong đợt này.
- **MCP 29 tools:** đếm lại 08/11 — 6 `server.tool(` trong
  `mcp-server/src/index.ts` + 23 trong `mcp-server/src/tools/*.ts` =
  29; khớp `mcp-server/TOOLS.md` ("Tổng: 29 tools (6 gốc + 23 mới trong
  Batch I)").
- **Enhance FPS (P9):** baseline 47,86 → denoise 12,05 / stabilize 6,82 /
  deinterlace 24,70 / combo 3,49; chạy lại lúc gộp: 53,23 / 14,68 /
  20,45 / 48,42 / 7,06 — nguồn `docs/PHASE9_ROUND59_P9_ENHANCE_RENDER_LIMITS.md`
  §3 + `docs/PHASE9_ROUND59_LIMITS.md` §3.1. Không đo lại.
- **Trial-decode (P6):** cap 32 MiB; 9,68 MiB → 1905 ms; 19,72 MiB →
  2853,8 ms; 30,73 MiB → 5090,5 ms; ~0,149 ms/KiB; rác 12 MiB fail ~7 ms
  — nguồn `docs/PHASE9_ROUND59_P6_LARGE_SAMPLE_LIMITS.md`. Không đo lại.
- **Preview FPS (I9):** đã có trong `benchmarks/RESULTS.md` §5 từ trước
  đợt này — không thêm trùng.
- **StickerPanel mount:** `apps/web/src/Inspector.tsx:122` và `:486`
  (grep trực tiếp). **MaskPanel:** `:393-395` (video), `:498-501`
  (image). **EnhancePanel:** `:398-400`. **BgRemovePanel:** `:361`.
  **TtsButton:** `:315`. **CaptionModal:** `apps/web/src/App.tsx:586`.
  **ExportPanel.startRender:** `apps/web/src/ExportPanel.tsx:476` →
  bridge `/api/render`. **TTS 25 giọng:**
  `server/bridge/src/tts.js:22-24`.
- **Keyframe SR:** render.js:457-459 — scale/rotation bỏ qua cho clip
  dính transition (validate.js cảnh báo); còn lại render thật (Phase 6 K1).
- **Speed preview (P0-07):** preview.tsx R1-013/Q1 — `sourceTimeAt` /
  `rampSourceTimeAt` + đồng bộ `playbackRate`.
- **LUT preview:** WebGL LUT thật qua `applyWebglLut` (preview.tsx:1389,
  `lib/webglLut.ts`) + CSS approx fallback (`previewEngine.ts` LUT_CSS,
  RMSE ~16).
- **Effects preview:** `previewEngine.ts:471-490` có case cho cả 9 effect
  mới (glitch, rgb-shift, shake, pixelate, mirror, edgedetect, invert,
  hue-rotate, old-film).

## 1. Đã sửa trong `docs/FEATURE_STATUS.md` (lên mốc 08/11)

- Mốc kiểm chứng 19/10 → **08/11/2026** (đợt 60 Q9, docs-only).
- Ma trận: Transitions 13 → **81**; LUT 10 → **174**; Video effects 7 →
  **16**; MCP 6 → **29 tools**; Auto-caption "chỉ CLI" →
  **VERIFIED** (CaptionModal + SRT/VTT + track dịch song ngữ);
  StickerPanel "chưa mount" → **đã mount, VERIFIED** (đóng ghi chú 3 cũ);
  Trim/Split P0-07 đã sửa; Keyframes thêm scale/rotation (trừ clip dính
  transition); Speed preview đã áp (reverse vẫn giật); LUT preview WebGL
  thật + CSS fallback.
- Thêm 9 hàng mới: Mask (IMPLEMENTED-PARTIAL — 0.97 fps), TTS
  (IMPLEMENTED-PARTIAL — chậm 0,12–0,75×, cloning chưa expose),
  Xoá nền AI (IMPLEMENTED-PARTIAL — 0.43 fps, OOM, không smoothing),
  Enhance (IMPLEMENTED-PARTIAL — preview chưa áp), i18n
  (IMPLEMENTED-PARTIAL — 1957 key, 41 key mồ côi, 26 key chưa wiring),
  Save/Load (VERIFIED), Export MP4 (VERIFIED), Proxy (VERIFIED),
  Mobile-web/PWA (IMPLEMENTED-PARTIAL — không app native, chưa test máy
  thật), Modal/Escape (IMPLEMENTED-PARTIAL — còn 30 class chưa định nghĩa).
- Mục "Chi tiết tích hợp": thêm bảng số lượng đếm lại 08/11 + danh sách
  panel đã mount; mục "Những gì CHƯA có": Export MP4 / Save-Load / TTS /
  bgremove / Masking đổi thành ĐÃ CÓ kèm giới hạn thật; CI/CD vẫn CHƯA
  (5 file workflow local, 403 chưa lên GitHub).
- Mục bổ sung 07/11 + ma trận gốc 19/10 chuyển xuống cuối file làm
  "Lịch sử mốc cũ", giữ nguyên văn.

## 2. Đã sửa trong `PHASE9_GAP_ANALYSIS.md`

- §0: thêm ghi chú cập nhật 08/11; Transition 67 → **81** (ghi rõ V3
  thêm 14 custom-expr từ đợt 10 chưa từng ghi vào file này); LUT giữ
  174 (đếm lại khớp); Video effects giữ 16 (ghi chú preview mới);
  hàng kho: font 59 family (67 file .ttf), sound 1043 + chú thích (*)
  đầy đủ (index 1013, đĩa 107, uisfx 936 chưa fetch); Benchmark:
  **TTS đính chính 0,12–0,75× (median 0,32×/0,44×, 72 lần đo)** thay
  "~0.44x tổng thể", thêm enhance FPS P9; i18n 1942 → **1957 key**
  (1942 → 1957 ở đợt 59); hàng Media mẫu thêm đóng P1; thêm chú thích
  (*) về sound + sticker manifest (214 vs 244).
- Thêm mục mới **§0.2 "Trạng thái sau đợt 59"**: tóm tắt P1–P10 + gộp
  (dict 1957, 45/45 suite xanh, tổng chờ push 732 entry) và 11 nợ mở
  cho đợt 61 lấy nguyên ý từ ROUND59 §6 (mục 10 đã đóng ở đợt này —
  ghi rõ).
- §2.1 E3: "Enhance không có UI" → "UI đã có, preview chưa áp" (theo
  đính chính đợt 59 P10); §2.3 C1: transition 67 → 81 + chú thích sound;
  §3 top-10 hạng 2: "Nối enhance ra UI" → "Áp enhance vào preview".

## 3. Đã sửa trong `benchmarks/RESULTS.md`

- §3 TTS: thêm hộp **ĐÍNH CHÍNH 08/11** — suy luận "~1,5–2,5× realtime
  khi model đã nạp" đã bị bác bỏ bằng đo thật đợt 49–50 (0,12–0,75×,
  median 0,32×/0,44×, 72 lần đo); đoạn suy luận cũ giữ nguyên làm hồ
  sơ, không xoá.
- §6 bảng so sánh: hàng TTS "~0.44x realtime tổng thể" → số đính chính
  đầy đủ.
- Thêm mục mới **§9 "Phase 9 đợt 52/59 refresh"**: 9.1 Enhance FPS P9
  (cả 2 lần chạy: luồng P9 + chạy lại lúc gộp, kèm cảnh báo dao động theo
  tải VM + phát hiện denoise làm nhanh render trên nguồn nhiễu); 9.2 GOP
  trial-decode P6 (cap 32 MiB, tốc độ decode, rác 12 MiB, 8K decode
  được); 9.3 TTS đính chính (nguồn F3/H1/H2/I1). Preview FPS I9 đã có
  ở §5 nên §9 không lặp lại.

## 4. Không đụng (cố tình, có lý do)

- **Số CapCut (ước tính)** trong toàn gap analysis: giữ nguyên 100%.
- **§4 gap (3 hướng không làm) và kết luận §5:** giữ nguyên.
- **Các hàng gap §0 còn mốc 24/10–07/11** (motion tracking, beat sync,
  voice effects, proxy, mobile, cloud…): không đo lại trong đợt
  docs-only này — chỉ sửa hàng nào có nguồn LIMITS đợt 51–59 hoặc đếm
  lại 08/11.
- **Số đo FPS/TTS/trial-decode:** không chạy lại bất kỳ phép đo nào —
  toàn bộ là số đo của luồng gốc, chỉ đối chiếu LIMITS.
- **Không sửa code/test/config/i18n dict** (docs-only đúng nghĩa).
- **Không sửa `assets/sounds/index.json`** (thiếu 30 mục vcut-synth) —
  đó là sửa dữ liệu, để đợt sau quyết (xem §5.4).

## 5. Nợ mở (cho đợt sau — không phải nợ do luồng này gây ra)

1. **Ma trận chưa kiểm chứng lại toàn diện các mảng Phase 9 đợt 1–50:**
   nested/compound/adjustment layer, motion track cho text/video/mask,
   karaoke highlight + style caption, audio ducking/markers/mixer meter,
   downbeat + phân đoạn nhạc, auto-reframe MediaPipe — các tính năng này
   được ghi trong MEMORY là đã làm ở các đợt 1–10 nhưng **chưa có hàng
   trong ma trận** và chưa được đối chiếu LIMITS trong đợt docs này.
   Cần một đợt docs riêng đọc ROUND1–21 LIMITS để thêm hàng.
2. **MCP `apply_transition`:** chưa kiểm tra có nhận đủ tập type mới
   (81) không — ma trận ghi rõ "chưa kiểm tra lại".
3. **Effects preview:** sharpen/noise (2/7 gốc) chưa kiểm chứng lại
   parity sau khi previewEngine thêm 9 effect mới.
4. **Dữ liệu kho:** `assets/sounds/index.json` thiếu 30 mục vcut-synth
   (file có trên đĩa); `assets/stickers/sticker-manifest.json` thiếu 30
   mục (214 vs 244 file). Nên đồng bộ index/manifest với đĩa.
5. **Sound uisfx:** 936 file chưa có trên đĩa — user/các đợt sau chạy
   `assets/sounds/fetch_sounds.sh` để có đủ kho khi cần dùng thật; hiện
   tại kho sound "dùng được ngay" chỉ là 107 file.
6. **Nợ từ ROUND59 §6** đã chép vào gap analysis §0.2 (11 mục) — nặng
   nhất cho đợt 61: 30 class CSS chưa định nghĩa, CaptionModal tràn/
   cao hơn viewport, 41 key mồ côi, fragment GOP 26 key chưa wiring,
   preview chưa áp enhance.
7. **TTS:** số 0,12–0,75× là trên VM 2 vCPU này; chưa có số đo trên máy
   người dùng có GPU/nhiều nhân — không suy ra ngoài VM test.
8. **Enhance FPS:** số tuyệt đối dao động ±30–40% theo tải VM; chưa đo
   enhance ở 1080p, chưa đo lặp lại, chưa đo render MP4 đúng combo
   preset (nợ ROUND59 §6.9).

## 6. Kiểm chứng của luồng (docs-only, không chạy tsc/build/test)

- Chạy script đếm `/tmp/count_round60_q9.py` (output
  `/tmp/count_round60_q9.out`): i18n 1957/1957; transitions 81 thật;
  effects 16; LUT 174; text preset 96; template 50+50; sticker 244;
  font 59 family / 67 file; sound 1043 khai báo / 1013 liệt kê /
  107 file trên đĩa / 936 uisfx thiếu.
- Grep trực tiếp: StickerPanel/MaskPanel/EnhancePanel/BgRemovePanel/
  TtsButton trong Inspector.tsx; CaptionModal trong App.tsx:586;
  ExportPanel.startRender; TTS_VOICES 25 giọng; render.js:457-459 (SR
  bỏ qua cho clip dính transition); preview.tsx:1389 (applyWebglLut);
  previewEngine.ts:471-490 (9 effect mới); MCP 29 tools (6 + 23).
- Đối chiếu từng số trong §1–§3 với file LIMITS nguồn đã liệt kê; không
  có số nào viết từ trí nhớ. Không chạy tsc/vite build/test (không sửa
  code). Không chạy lại bất kỳ phép đo headed/FPS/TTS nào của các luồng.

## 7. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round60-q9-docs.txt`
(NUL-delimited, verify read-back, 4 entry, text only):
`PHASE9_GAP_ANALYSIS.md`, `docs/FEATURE_STATUS.md`,
`benchmarks/RESULTS.md`, `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md`.

Tổng chờ push sau luồng này: **736 entry** = 732 (sau đợt 59) + 4
(luồng này; tính tại thời điểm ghi — các luồng đợt 60 khác có thể stage
thêm song song). Các đợt 1–50 đã push xong (HEAD e2cb35e1).

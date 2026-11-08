# Phase 9 đợt 61 R10 — Đóng nợ đợt 60 §5.10: ma trận FEATURE_STATUS + sounds index + sticker manifest

Ngày: 2026-11-08. Luồng R10, đợt 61. **KHÔNG push, KHÔNG release/tag,
KHÔNG binary vào batch.** Chỉ sửa docs + 2 file JSON kho + 1 file test
khóa số manifest. Không sửa `apps/web/src/i18n/vi.json` hay `en.json`
(không cần key mới — ma trận là docs, không thêm UI).

Nhiệm vụ: đóng nợ đợt 60 §5.10 (xem `docs/PHASE9_ROUND60_LIMITS.md` §5.10
và `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md` §5.4): (a) thêm hàng ma trận
cho các tính năng đợt 1–10 chưa có hàng; (b) bổ sung 30 mục vcut-synth
thiếu trong `assets/sounds/index.json`; (c) bổ sung 30 mục thiếu trong
`assets/stickers/sticker-manifest.json` + kiểm tra nhanh các kho khác.

## 0. Đếm lại kho trên đĩa sau sửa (script `/tmp/r61_r10_fix.py` +
đếm độc lập, chạy 08/11)

| Kho | Trước sửa | Sau sửa | Đếm lại trên đĩa 08/11 |
|---|---|---|---|
| Sounds index `sounds` | 1013 (vcut-synth 65) | **1043** (vcut-synth 95) | `total_sounds: 1043` = kenney 12 + uisfx 936 + vcut-synth 95; đĩa 107 file `.ogg`, cả 107 đều có trong index (0 file đĩa thiếu); 936 uisfx vẫn chỉ là khai báo, chưa có file trên đĩa (xem §5.1) |
| Sticker manifest | 214 | **244** | đĩa 244 `.png` = manifest 244 = `STICKER_LIBRARY` 244; 0 lệch cả 3 chiều |
| Template | 50 | 50 (không đổi) | 50 `.json` + 50 entry `TEMPLATES` trong `templates.ts` |
| Font | 59 family | 59 (không đổi) | `catalog.json` `count: 59`, 59 entry; đĩa 67 `.ttf` = 59 + 8 bold |
| LUT | 174 | 174 (không đổi) | 174 `.cube` trong `assets/filters/`; không có file manifest/index LUT riêng để lệch |
| Transition | 81 | 81 (không đổi) | `TRANSITION_TYPES` trong code (đếm lại ở Q9); không có manifest file |
| Text preset | 96 | 96 (không đổi) | 96 `.css`; không có file index riêng để lệch |
| i18n key lá vi/en | 1957 (ghi ở Q9) | **1972** | đếm trực tiếp `vi.json`/`en.json`: 1972/1972, cùng tập key (xem §4) |

## 1. (a) Ma trận FEATURE_STATUS — 6 hàng mới

Mỗi hàng có trạng thái thật dựa trên LIMITS đợt 1–10 và/hoặc grep code
trực tiếp ngày 08/11 — không ghi theo trí nhớ. Định nghĩa status theo
`FEATURE_STATUS.md`: VERIFIED = test/kiểm thử tái lập chứng minh chạy
được trong luồng tích hợp thật; IMPLEMENTED-PARTIAL = có code nhưng thiếu
tích hợp/test hoặc có giới hạn quan trọng.

| Hàng mới | Status | Nguồn chứng cứ chính |
|---|---|---|
| Nested / compound clip | **VERIFIED** | `docs/NESTED_ROUND_LIMITS.md` (N1 37/37, N2 24/24 MP4 thật, N3 46/46, N4 10/10, N5 14/14, N6 E2E); `docs/PHASE9_ROUND7_NESTED_UNIFY_LIMITS.md` (unify 55/55, E2E 43 PROVEN + 1 PENDING, click-test 12/15 + 3 SKIP); grep 08/11: `index.ts` export `nested.js`, `render.js:81` flatten, `Timeline.tsx:867` mount `NestedClipPanel` |
| Adjustment layer | **VERIFIED** | `server/render/src/ADJUSTMENT_LIMITS.md` (R1 nối render.js thật, 39/39 pixel-verified; R2 spec); `docs/PHASE9_ROUND7_NESTED_UNIFY_LIMITS.md` (U2/U3 normalize legacy → chuẩn); grep 08/11: `render.js:85,469-476` wiring, `index.ts` export `adjustment.js`, `Timeline.tsx:868` mount `AdjustmentLayerPanel` |
| Motion track (sticker/text/video bám quỹ đạo) | **VERIFIED** | Phase 8 Q5: header `server/tracking/track.py` (sai số TB 0.0035 khung hình) + `test_track.py` ground truth; `server/render/src/D3_LIMITS.md` (D3 22/22, render thật sai số ≤1px); grep 08/11: `render.js:62` dùng `tracking.js`, `Inspector.tsx:488,495` mount `TrackPanel` cho text/video |
| Karaoke (tô sáng từng từ) | **VERIFIED** | `apps/web/src/lib/R4_LIMITS.md` (render ASS `\k` 4/4 pixel-verified; subtitles 14/14) + `apps/web/src/lib/D6_LIMITS.md` (karaoke theo speed curve, `d6.test.ts` 11/11); grep 08/11: `render.js:353` `buildKaraokeAss`, `preview.tsx:582,595` `karaokeLayout`/`drawKaraokeWords` |
| Audio ducking | **IMPLEMENTED-PARTIAL** | `server/render/src/DUCKING_LIMITS.md` (test 15/15: nhạc −4.99/−5.02 dB khi có giọng); grep 08/11: `AudioFxPanel.tsx:67,264` mount `DuckingSection`. PARTIAL vì: preview chưa áp ducking + đổi ducking chưa qua history undo + `duckAmountDb` chỉ là trần xấp xỉ (12 dB → ~5 dB) + chỉ 1 track giọng — cùng chuẩn với hàng Enhance (PARTIAL vì preview chưa áp) |
| Beat sync + downbeat / phân đoạn nhạc | **IMPLEMENTED-PARTIAL** | `server/beats/D5_LIMITS.md` + **chạy lại 08/11: `test_structure.py` PASS, `test_beat.py` PASS (119.76 BPM, miss 1/16)**; grep 08/11: `Inspector.tsx:470` mount `BeatSyncModal`. PARTIAL vì: mọi số đo đều trên nhạc tổng hợp, chưa kiểm chứng nhạc thật; meter chỉ thử 4/4 và 3/4; chưa click-test modal; combo downbeat-only + speed curve dùng công thức tốc độ 1 |

Ghi chú 13–18 mới trong `FEATURE_STATUS.md` ghi đầy đủ giới hạn từng
hàng (transition qua biên nested, opacity nested, preview/render lệch ở
layer chồng LUT, mask bám track chưa làm, typewriter/karaoke không bám
track, preview karaoke tô cả từ vs render quét từng ký tự, ducking là
compressor không phải envelope, downbeat là heuristic).

## 2. (b) Sounds index — bổ sung 30 mục vcut-synth

- Thiếu đúng 30 file trên đĩa, khớp danh sách Q9 đã đếm:
  `chime-bright/deep`, `downer-drop/fade/long/soft`,
  `impact-boom/crack/gong/thud/tick`, `riser-echo/glide/spark/tight/vapor`,
  `stinger-chime/ding/flare/pop`, `sweep-dip/glide/pulse/shimmer`,
  `transition-flick/morph/sweep/zip`, `whoosh-burst/spin`.
- Tên + category lấy trực tiếp từ `SOUNDS` trong
  `assets/sounds/gen_vcut_sounds3.py` (30 mục, đúng danh sách thiếu) —
  script gen này từ đầu đã ghi "cập nhật index.json (total 1013 ->
  1043)" nhưng bước cập nhật chưa từng được làm; đợt này làm đúng ý đó.
  Các field còn lại sao y entry vcut-synth hiện có (`pack: "VCut Synth
  (original)"`, `source_url` repo, `author: "VCut Studio (synthesized)"`,
  `license: "MIT"`, `license_note` numpy, `format: "ogg"`),
  `fetch: "assets/sounds/gen_vcut_sounds3.py"`. 30 mục mới nối cuối mảng
  `sounds` (sau khối vcut-synth cũ, giữ đúng nhóm nguồn kenney → uisfx
  → vcut-synth).
- Verify trước khi thêm (trong script `/tmp/r61_r10_fix.py`): từng file
  tồn tại + 4 byte đầu `OggS` + size > 0. Sau sửa: `len(sounds) = 1043
  = total_sounds`; nguồn kenney 12 / uisfx 936 / vcut-synth 95; 107/107
  file `.ogg` trên đĩa đều có trong index.
- Định dạng file giữ nguyên: dump `indent=1, ensure_ascii=False`, không
  trailing newline; kiểm tra round-trip `json.loads` → `json.dumps`
  byte-identical với file sau sửa (chỉ 30 entry mới là thay đổi).

## 3. (c) Sticker manifest — bổ sung 30 mục gốc VCut

- Thiếu đúng 30 file: batch 1 (6: `star/heart/arrow-right/lightning/
  badge/bubble.png`) + batch 2 (24: `smile/wink/laugh/cool/party/fire`,
  `shape-*` ×5, `arrow-up/down/left/curved/double`, `badge-check/cross/
  medal/crown`, `bubble-speech/thought/shout/tag`). Đây là 30 sticker tự
  vẽ đầu tiên của repo — manifest chỉ được lập từ batch 3 (Twemoji/Noto)
  trở đi nên 30 mục này chưa từng vào manifest.
- Label + category lấy trực tiếp từ `STICKER_LIBRARY` trong
  `packages/video-spec/src/sticker.ts` (244 entry, đúng 244 file đĩa) —
  ví dụ `star.png` "Ngôi sao"/`shapes`, `arrow-right.png` "Mũi tên"/
  `arrows`, `badge.png` "Huy hiệu"/`badges`. Nguồn/license theo
  `assets/stickers/SOURCES.md` + `assets/SOURCES.md`: tự vẽ 100% bằng
  PIL, `source: "VCut Studio"`, `license: "MIT"`. `sha256` + `bytes`
  tính thật từ file đĩa; `origin_url`: sticker tự vẽ, không có URL fetch
  gốc → trỏ về repo (`https://github.com/vectornewsai-cmyk/repo-1`, cùng
  `source_url`) — ghi rõ lựa chọn này để khỏi hiểu lầm là link fetch.
- Verify trước khi thêm: từng file tồn tại ở cả `assets/stickers/` và
  `apps/web/public/stickers/`, magic PNG, PIL mở được + có alpha (không
  trong suốt hoàn toàn). Sau sửa: manifest 244 = đĩa 244 =
  `STICKER_LIBRARY` 244, 0 lệch cả 3 chiều.
- **Test khóa số phải sửa theo (thuộc phạm vi (c), không phải scope
  creep):** `assets/stickers/test_stickers3.py` khóa cứng 214 ở 5 chỗ
  (`len(man)`, `n_ok`, SOURCES.md, STICKER_LIBRARY) + check
  `category == "emoji"` cho mọi entry + `n_fetch == 214`. Đã cập nhật:
  214 → 244 ở các đếm manifest; category → thuộc 5 nhóm
  (`emoji/shapes/arrows/badges/bubbles` theo `STICKER_CATEGORIES` trong
  `sticker.ts`); `n_fetch` nay đối chiếu với số entry fetch được
  (214, 30 sticker gốc tự vẽ nên không có lệnh fetch) thay vì đối chiếu
  với tổng manifest. `test_stickers2.py` không đụng (khóa 24/30 của
  script gen, không liên quan manifest).

## 4. Đính chính i18n trong FEATURE_STATUS (lệch nhỏ, xác minh được,
cùng file đang sửa)

`FEATURE_STATUS.md` còn ghi 1957 key lá (mốc Q9). Đếm lại trực tiếp
08/11: `vi.json` == `en.json` == **1972 key lá**, cùng tập key — khớp
`docs/PHASE9_ROUND60_LIMITS.md` §0 (1957 − 14 key mồ côi xóa + 26 key
fragment P7 gộp = 1969, Q1 +3 = 1972). Đã cập nhật: hộp cập nhật Q9 giữ
nguyên văn làm lịch sử + thêm hộp R10; ghi chú 10 viết lại (41 key mồ
côi + 26 key GOP đã đóng ở đợt 60 Q4; còn đỏ: M3 7/13, N5, 253 literal
server/desktop); mục số lượng kho: 1957 → 1972. Không sửa dict.

## 5. Kiểm tra nhanh các kho khác — không lệch tương tự

- **LUT:** 174 `.cube`, không có file manifest/index LUT riêng — không
  có gì để lệch. `previewEngine.ts` nhắc "110/174 mục đã fit" là bảng
  xấp xỉ CSS, không phải manifest.
- **Transition:** 81 type trong code (`TRANSITION_TYPES`, đếm lại ở Q9);
  không có manifest file. 21 file GLSL trong `assets/transitions/` vẫn
  không dùng được (ghi từ Q9, không đổi).
- **Template:** 50 `.json` + 50 entry `TEMPLATES` — khớp.
- **Font:** `catalog.json` `count: 59`, 59 entry; đĩa 67 `.ttf` = 59 + 8
  bold — khớp Q9.
- **Text preset:** 96 `.css`; không có file index riêng — không có gì
  để lệch.
- **Sound uisfx (nợ cũ, không sửa):** 936 entry trong index vẫn không có
  file trên đĩa — chỉ lấy được qua `assets/sounds/fetch_sounds.sh`.
  Đây là thiết kế fetch-on-demand từ trước, không phải lệch do R10 gây
  ra; kho sound "dùng được ngay" vẫn là 107 file.

## 6. Kiểm chứng của luồng (chạy thật 08/11)

- Script sửa `/tmp/r61_r10_fix.py`: sounds +30 (1013 → 1043, nguồn
  12/936/95), stickers +30 (214 → 244), test cập nhật 8 điểm — **OK,
  exit 0**. Chạy lại lần 2 idempotent (0 mục mới, vẫn OK).
- Đếm lại độc lập sau sửa: sounds 1043 = `total_sounds`, đĩa 107/107
  trong index; manifest 244 = đĩa 244 = `STICKER_LIBRARY` 244; template
  50/50; font 59/59; LUT 174; text preset 96.
- `python3 assets/stickers/test_stickers3.py`: **TẤT CẢ PASS** (244
  entries, 244 PNG hợp lệ + sha256 khớp, SOURCES.md đủ 244 dòng,
  STICKER_LIBRARY đủ 244 entries, 214 lệnh fetch cho 214 entry fetch
  được). `python3 assets/stickers/test_stickers2.py`: **PASS** (24 mới,
  tổng 30).
- `python3 server/beats/test_structure.py`: **PASS**;
  `python3 server/beats/test_beat.py`: **PASS** (119.76 BPM, miss 1/16)
  — chạy lại để làm bằng chứng tươi cho hàng downbeat.
- JSON parse được cả 2 file; round-trip dump byte-identical (chỉ thêm
  entry mới, không reformat phần cũ).
- **Không chạy** tsc/vite build (không đụng code `.ts`/`.tsx` — chỉ docs
  + JSON + 1 file test Python; `sticker.ts` không sửa). Không chạy lại
  test render karaoke/ducking/nested (số lấy từ LIMITS gốc, đã đối chiếu
  code còn nguyên bằng grep 08/11).

## 7. Nợ mở (cho đợt sau — không phải nợ do luồng này gây ra)

1. **Q9 §5 nợ 2, 3 chưa đóng:** MCP `apply_transition` chưa kiểm tra có
   nhận đủ tập type mới (81) không; effects preview sharpen/noise chưa
   kiểm chứng lại parity sau khi previewEngine thêm 9 effect mới.
2. **Sound uisfx:** 936 file chưa có trên đĩa — user/các đợt sau chạy
   `assets/sounds/fetch_sounds.sh` khi cần dùng thật (§5).
3. **Nợ từ ROUND60 §5** vẫn nguyên (M3 đỏ 7/13, Q8 vidstabdetect, Q1
   chưa đo FPS preview enhance, Q2 53 class scoped-only, Q5 keyframe
   ≳16 MiB timeout, Q6 badge merge, Q7 bytes mồ côi IDB, Q10 Escape khi
   dropdown mở, N6/N5/Node type-stripping, `ci-security.yml` 403).
4. **Nợ trong các hàng ma trận mới** (ghi ở ghi chú 13–18): transition
   qua biên nested, opacity nested, preview/render lệch layer chồng LUT,
   mask bám track, typewriter/karaoke không bám track, preview ducking,
   downbeat chưa kiểm chứng nhạc thật.
5. **`origin_url` của 30 sticker gốc** trỏ về repo root (xem §3) — nếu
   sau này muốn chính xác từng script gen (batch 2 có
   `make_stickers2.py`, batch 1 script đã mất ở `/tmp`) thì cập nhật
   riêng; không ảnh hưởng test hay UI (không code nào đọc manifest này
   — grep 08/11 không thấy consumer trong `apps/web/src`, `server`,
   `packages`).

## 8. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round61-r10-docs-index.txt`
(NUL-delimited, verify read-back, 6 entry, text only):
`docs/FEATURE_STATUS.md`, `PHASE9_GAP_ANALYSIS.md`,
`docs/PHASE9_ROUND61_R10_DOCS_INDEX_LIMITS.md`,
`assets/sounds/index.json`, `assets/stickers/sticker-manifest.json`,
`assets/stickers/test_stickers3.py`.

Tổng chờ push sau luồng này: **839 entry** = 833 (phase10 63 + đợt
51–60 768 + đợt 61 R1 2, đếm tại thời điểm ghi — các luồng đợt 61 khác
có thể stage thêm song song) + 6 (luồng này). Các đợt 1–50 đã push xong
(HEAD e2cb35e1).

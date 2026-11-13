# PHASE9_ROUND92_T5_I18N_STICKER_LIMITS.md — Đợt 92, luồng T5: i18n StickerPanel hardcode + quét lại (nợ LIMITS gộp đợt 91 §4 mục 5: ĐÃ ĐÓNG)

Ngày: 12/11/2026 (lượt cron 03:35 +07; làm việc 20:38–20:55Z 11/11/2026). Repo `~/workspace/repo-1`. KHÔNG push. KHÔNG release/tag.
Nguồn nợ: `docs/PHASE9_ROUND91_S5_I18N_TEXT_LIMITS.md` §4 mục 1 + `docs/PHASE9_ROUND91_LIMITS.md` §4 mục 5.

## 1. Kết luận

- **Nợ ĐÃ ĐÓNG:** `StickerPanel.tsx:192` tiêu đề `🌟 Sticker` hardcode → thêm key mới
  `sticker.title` vào dict vi/en và dùng `{i18nT("sticker.title")}` (file này import
  `t as i18nT`, không phải `t` như TrackPanel — giữ đúng alias sẵn có, không đổi import).
  Dict **2517 → 2518 key lá mỗi bên**, vi == en, cùng tập key, 0 key mồ côi, 0 giá trị rỗng
  (đếm lại trực tiếp từ đĩa, 2 lần: sau sửa và cuối luồng).
- **Pin đếm key đã bump 2517 → 2518 ở toàn bộ 17 file test pin số key** (assert + tên
  test + chuỗi lịch sử trong comment — theo đúng quy tắc S5: chỉ sửa dòng assert/tên test,
  comment lịch sử nối thêm thay vì viết đè). Quét lại toàn `apps/web/src`: không còn `2517`
  nào ngoài tham chiếu lịch sử trong comment (7 dòng, toàn `//`).
- **Phát hiện thêm trong lúc bump (đã sửa, không để sót): pin số key vi==en.**
  `sticker.title` có giá trị giống hệt 2 bên (`🌟 Sticker` — loanword "Sticker" đã dùng
  khắp panel này ở locale VI: `sticker.editorSelected` = "Sticker đang chọn",
  `sticker.libTip` = "Bấm vào sticker…", nên VI giữ nguyên chuỗi, không dịch thành
  "Nhãn dán" cho lệch tông panel). Vì vậy số key vi==en tăng 60 → **61**, và 4 file pin
  con số này đã được bump 60 → 61 kèm ghi chú lịch sử: `i18nOrphans60Q4`,
  `i18nAudit59P7`, `i18nSweep81I9` (cả tên test `vi==en=60` → `vi==en=61`),
  `codecProbeUi75C6` (cả chú thích "không tính vào 60 key vi==en" → 61). Nếu chỉ bump
  pin 2517 mà quên pin 60 này thì cả 4 test đã đỏ — đây đúng là lớp pin thứ hai mà
  bài học đợt 91 (quên pin css60 §8) cảnh báo.
- **Danh sách pin theo key/call site (css60 §8) — đã kiểm tra thực tế, không đoán:**
  `cssClasses60Q2.test.ts` §8 chỉ có 4 khối `checkI18n` — `preview.tsx` (54),
  `HistoryPanel.tsx` (26), `TrackPanel.tsx` (14, đã gồm `motionTrack.title` từ closing
  đợt 91), `TtsButton.tsx` (63). **Không có khối `checkI18n` nào cho `StickerPanel.tsx`**
  nên không có danh sách nào để bump cho luồng này; css60 vẫn 59/59. (Đề xuất cho parent:
  có thể thêm khối `checkI18n` cho StickerPanel ở đợt sau để khóa 16 call site
  `sticker.*` — không tự thêm trong luồng này vì sẽ đổi tổng số check 59 → 60, ngoài brief.)
- **Không có test nào khác liệt kê key `sticker.*`:** `i18nAudit56M1` chỉ snapshot nội dung
  key `motionTrack.*` (không có sticker, không đổi); `i18nAudit55L2` chỉ spot-check 15 key
  tái dùng (`sticker.allTab` đã có từ trước, không đổi); `maskTrackUi87O5` chỉ import
  TrackPanel; `cssClasses61R4` chỉ nhắc class CSS `.sticker-*`, không phải i18n.

## 2. Thay đổi

| File | Thay đổi |
|---|---|
| `apps/web/src/i18n/vi.json` | `sticker.title`: `"🌟 Sticker"` (key đầu nhóm `sticker`, như mẫu `motionTrack.title` đợt 91 S5) |
| `apps/web/src/i18n/en.json` | `sticker.title`: `"🌟 Sticker"` (giữ nguyên chuỗi EN cũ) |
| `apps/web/src/components/sticker/StickerPanel.tsx:192` | `<div …>🌟 Sticker</div>` → `<div …>{i18nT("sticker.title")}</div>` |
| 17 file `*.test.ts` | Bump pin 2517 → 2518 (xem §3); 4 file trong số đó bump thêm pin vi==en 60 → 61 (xem §1) |

17 file test đã bump pin số key (khớp đúng danh sách S5): `ProjectMenu.i18n55L1`,
`speedWarnTooShortDead63R10` (chỉ comment), `codecProbeDebts76D8` (chỉ comment),
`codecProbeUi75C6`, `errorDetail34Q4` (chỉ comment), `i18nAudit59P7`, `i18nModals79G9`,
`i18nModals80H7`, `i18nOrphans60Q4`, `i18nRound57N4`, `i18nSweep81I9`,
`reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`,
`reverseToggleI18n48D4`, `saveToast31`, `structuredNotes32`.
Tất cả edit thực hiện bằng script Python với assert số lần xuất hiện chính xác = 1 cho
mỗi chuỗi thay thế (không sửa tay từng dòng).

## 3. Quét lại (phạm vi + kết quả)

- **StickerPanel.tsx (toàn file, đọc lại từng dòng):** sau sửa, mọi chuỗi UI đều qua
  `i18nT("sticker.*")` (16 call site: title, editorSelected, posX, posY, size, opacity,
  rotation, editorTip, libTip, searchPlaceholder, allTab, noResult, uploadBtn,
  errImageOnly, errWebp, footTip). Không còn literal UI nào: `:`/`%`/`°` là dấu câu
  và định dạng số; `⏳` là emoji đứng một mình trong dòng import-progress (không kèm chữ);
  `{c.label}`/`{s.label}` là nhãn dữ liệu từ `packages/video-spec/src/sticker.ts`
  (xem nợ dưới); `clip.src.split("/").pop()` là tên file hiển thị; còn lại là comment.
- **Panel kề — TrackPanel.tsx:** sạch, toàn `t("motionTrack.*")` (14 call site khớp pin
  css60 §8); `<code>server/tracking/track.py</code>` là tách chuỗi từ template đã dịch
  `motionTrack.intro`, không phải hardcode. **MaskPanel.tsx:** sạch (đã sửa ở S5, kiểm
  tra lại: không còn literal JSX ngoài comment).
- **Dict:** vi 2518, en 2518, cùng tập key, vi-only [], en-only [], 0 giá trị rỗng,
  61 key vi==en (60 cũ + `sticker.title`).

## 4. Kiểm chứng (cây cuối lúc luồng này xong, chạy lại lần 2 sau lần 1)

| Check | Kết quả |
|---|---|
| Dict recount (python json, đếm key lá, 2 lần) | **vi 2518, en 2518, cùng tập key, 0 mồ côi, 0 rỗng, 61 key vi==en** |
| i18nOrphans60Q4 | 16/16 pass (×2 lần chạy) |
| i18nAudit59P7 | 8/8 pass (scan: 524 literal/36 file, 4 TRKEY-MISMATCH benign có sẵn — giống hệt S5) |
| i18nSweep81I9 | 16/16 pass |
| i18nModals79G9 | 9/9 pass |
| i18nModals80H7 | 13/13 pass |
| ProjectMenu.i18n55L1 | 6/6 pass |
| codecProbeUi75C6 | 16/16 pass |
| saveToast31 | 15/15 pass |
| structuredNotes32 | 12/12 pass |
| reverseBadge46B6 | 8/8 pass |
| reverseCompat44Z6 | 10/10 pass |
| reversePlaybackI18n49E2 | 3/3 pass |
| reverseToggleI18n48D4 | 3/3 pass |
| i18nRound57N4 | 14/14 pass |
| codecProbeDebts76D8 | 14/14 pass |
| errorDetail34Q4 | 35/35 pass |
| speedWarnTooShortDead63R10 | 5/5 pass |
| cssClasses60Q2 | **59/59 pass** |
| test_validate_codes.js (server/render/src) | 1596/1596 pass |
| validateCodes63R9 (mcp-server: `npx tsc -p tsconfig.json` rồi `node dist/mcp-server/src/validateCodes63R9.test.js`) | 53/53 pass |
| tsc web (`apps/web`, `npx tsc --noEmit`) | **0 lỗi** (xem lưu ý sibling dưới) |
| vite build | PASS (24.98s; cảnh báo chunk >500 kB có sẵn, không phải lỗi mới) |

Cách chạy test: esbuild bundle từng file ra `/tmp/round92-t5/*.test.{cjs,mjs}` rồi `node`
(theo header từng file: cjs mặc định, esm cho I9/G9/H7). Script chạy: `/tmp/round92-t5/run-tests.sh`
(scratch ngoài repo, không đưa vào batch).

**Lưu ý trung thực — lỗi tsc thoáng qua do luồng sibling:** lần chạy tsc đầu (20:49Z) báo
1 lỗi `media.ts(280,11): 'srcLatch' is declared but its value is never read` — đây là code
của luồng sibling đợt 92 T1 (khóa flip-flop src, comment "Đợt 92 T1" trong file; `media.ts`
mtime 20:49:02Z, đúng lúc đang sửa; file này luồng T5 không đụng). Không sửa code sibling.
Chạy lại sau khi `media.ts` ổn định (~87s không đổi, `srcLatch` lên 7 tham chiếu): **tsc 0 lỗi**.
Toàn bộ suite pin chạy lại lần 2 sau đó vẫn 18/18 xanh với cùng số đếm.

Lưu ý: `~/workspace/repo-1` không phải git repo (bản làm việc thường) nên không có
`git diff` để đối chiếu; xác minh bằng đếm lại dict từ đĩa + grep toàn cây + chạy lại
toàn bộ suite pin 2 lần. `mcp-server/dist` và `apps/web/dist` là build output của bước kiểm
chứng, KHÔNG đưa vào batch.

## 5. Nợ mở cho parent

1. **Nhãn sticker là dữ liệu tiếng Việt duy nhất, chưa dịch theo locale** (ngoài brief,
   không tự sửa): `packages/video-spec/src/sticker.ts` — `STICKER_CATEGORIES` ("Hình khối",
   "Mũi tên", "Huy hiệu", "Bong bóng") và `STICKER_LIBRARY` ("Ngôi sao", "Trái tim", …,
   12+ nhãn) hardcode tiếng Việt trong data layer; `StickerPanel` render `c.label`/`s.label`
   trực tiếp nên locale EN vẫn hiện tiếng Việt ở tab + tên sticker. Muốn dọn cần đổi data
   sang key i18n hoặc thêm trường `labelEn` + nối `t()` — quyết định thuộc parent (đụng
   `packages/video-spec`, ngoài phạm vi "thêm 1 key title" của luồng này).
2. **Đề xuất (không tự làm):** thêm khối `checkI18n` cho `StickerPanel.tsx` vào css60 §8
   để khóa 16 call site `sticker.*` (ngăn lặp lại lỗi quên pin như TrackPanel đợt 91) —
   sẽ đổi tổng check css60 59 → 60, cần parent quyết.
3. Không có nợ mới nào khác do luồng này tạo ra.

## 6. File stage (KHÔNG push)

- Batch: `~/workspace/repo-1-push/paths-loop/phase9-round92-t5-i18n-sticker.txt` — 21 entry
  (2 dict + 1 component + 17 test + LIMITS này).
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t5.md`
  (ngoài repo, không đưa vào batch).

# PHASE9_ROUND93_U5_I18N_STICKER_DATA_LIMITS.md — Đợt 93, luồng U5: i18n nhãn sticker ở data layer + khối checkI18n StickerPanel cho css60

Ngày: 12/11/2026 (lượt cron 06:35 +07; làm việc ~23:40–00:15Z 11–12/11/2026). Repo `~/workspace/repo-1`. KHÔNG push. KHÔNG release/tag.
Nguồn nợ: `docs/PHASE9_ROUND92_LIMITS.md` §4 mục 5 + `docs/PHASE9_ROUND92_T5_I18N_STICKER_LIMITS.md` §5 mục 1–2.

## 1. Kết luận

- **Nợ ĐÃ ĐÓNG (mục 1):** nhãn sticker trong `packages/video-spec/src/sticker.ts` không còn hardcode tiếng Việt ở UI nữa. Mỗi entry của `STICKER_CATEGORIES` (5) và `STICKER_LIBRARY` (244) nay mang thêm `labelKey` (`sticker.cat.*` / `sticker.item.*`, slug theo tên file, `_` → `-`); `StickerPanel` dịch qua `t(labelKey)`, locale EN hiện tên tiếng Anh thật. Trường `label` giữ nguyên là nhãn tiếng Việt gốc — làm fallback khi thiếu key + cho tìm kiếm gõ tiếng Việt ở locale EN.
- **Nợ ĐÃ ĐÓNG (mục 2):** thêm khối `checkI18n` cho `StickerPanel.tsx` vào css60 §8 — css60 **59 → 60 check, xanh 60/60**.
- **Dict: 2518 → 2767 key lá mỗi bên** (vi == en, cùng tập key, 0 mồ côi, 0 rỗng), **vi==en: 61 → 72** (+11: `sticker.cat.emoji` + 10 key item loanword — `Pizza` có 2 file nên 9 nhãn loanword cho 10 key).
- **Mirror `.ts` ↔ `.js` giữ đồng bộ:** `packages/video-spec/src/sticker.js` được thêm `labelKey` y hệt (mirror check 427 pass, 0 fail — probe giá trị `STICKER_CATEGORIES`/`STICKER_LIBRARY` so deepEqual hai bên).
- **Không vỡ pin nào:** toàn bộ suite pin i18n chạy lại xanh (xem §4). Pin số key đã bump 2518 → 2767 ở toàn bộ 17 file (assert + tên test + message assert + comment lịch sử nối thêm, theo đúng quy tắc T5); pin vi==en bump 61 → 72 ở 4 file.

## 2. Thiết kế (quyết định đã chốt trong luồng)

- **Mẫu theo `labelKey` sẵn có của repo** (`safeArea.ts`: data mang `labelKey: "safeArea.zoneTopBar"`, UI gọi `t(labelKey)`), không phát minh mẫu mới. Data layer (`packages/video-spec`) không import hệ i18n của `apps/web` — chỉ mang key dạng chuỗi, UI là nơi dịch.
- **Key:** `sticker.cat.<id>` (5: emoji/shapes/arrows/badges/bubbles) và `sticker.item.<slug>` (244; slug = tên file trừ `.png`, `_` → `-`, vd `sticker.item.twemoji-1f600`, `sticker.item.fluent-red-heart`). Đã assert slug duy nhất sau chuẩn hoá (không va chạm).
- **Giữ `label`:** (1) tương thích ngược với mọi consumer đọc `.label` (hiện chỉ StickerPanel); (2) fallback khi key thiếu — `stickerLabel()` trả `label` thay vì lộ key thô `sticker.item.…` ra UI (hàm `t()` mặc định trả về chính key khi thiếu); (3) tìm kiếm khớp cả hai thứ tiếng. Giá trị vi trong dict được khóa bằng đúng `label` gốc (check mới trong orphans, xem §3).
- **Dịch EN:** 214 nhãn vi duy nhất dịch tay sang tiếng Anh (bảng trong `/tmp/round93-u5/gen.py`, không dùng máy dịch tự động cho batch). Hai nhãn trùng tiếng Anh được giữ nguyên ý nghĩa khác nhau theo ngữ cảnh file: `Hình thoi` và `Kim cương` cùng → "Diamond" (hình thoi / viên kim cương) — khác key nên không va chạm.
- **Nhãn vi==en mới (11):** `sticker.cat.emoji`, `sticker.item.fluent-laptop`, `sticker.item.fluent-pizza`, `sticker.item.noto-1f354` (Burger), `sticker.item.noto-1f355` (Pizza), `sticker.item.twemoji-1f3ac` (Clapperboard), `sticker.item.twemoji-1f44c` (OK), `sticker.item.twemoji-1f44d` (Like), `sticker.item.twemoji-1f44e` (Dislike), `sticker.item.twemoji-1f916` (Robot), `sticker.item.twemoji-1f918` (Rock on).

## 3. Thay đổi

| File | Thay đổi |
|---|---|
| `packages/video-spec/src/sticker.ts` | Type `STICKER_CATEGORIES` thêm `labelKey: string`; 5 cat + 244 item thêm `labelKey`; ghi chú doc comment (đợt 93 U5) |
| `packages/video-spec/src/sticker.js` | Mirror viết tay: thêm `labelKey` y hệt 249 entry (giữ format `.js`, không có cast TS) |
| `apps/web/src/i18n/vi.json` | `sticker.cat` (5) + `sticker.item` (244, giá trị = nhãn vi gốc) |
| `apps/web/src/i18n/en.json` | `sticker.cat` (5) + `sticker.item` (244, bản dịch tay) |
| `apps/web/src/components/sticker/StickerPanel.tsx` | Helper `stickerLabel()` (dịch qua key, fallback nhãn vi); tab `{c.label}` → `{stickerLabel(c)}`; lưới `title`/`alt`/`<span>` dùng `stickerLabel(s)`; tìm kiếm khớp cả nhãn dịch lẫn nhãn vi gốc |
| `apps/web/src/lib/cssClasses60Q2.test.ts` | §8: khối `checkI18n` mới cho StickerPanel (16 key / 16 call site); header (b) 4 → 5 file; §8 "4 file" → "5 file" |
| `apps/web/src/lib/i18nOrphans60Q4.test.ts` | DYNAMIC_PREFIXES thêm `"sticker.cat."`, `"sticker.item."` (truy cập động qua `t(labelKey)`, ngoài phạm vi quét `apps/web/src`); check mới `sticker labelKey` (249 cặp label/labelKey, key đủ 2 bên, vi khớp nhãn gốc) → test này 16 → 17 check |
| `apps/web/src/lib/i18nAudit59P7.test.ts` | DYNAMIC_PREFIXES thêm `"sticker.cat."`, `"sticker.item."` (cùng lý do; nếu quên thì audit đỏ 249 key mồ côi) |
| 17 file `*.test.ts` | Bump pin 2518 → 2767 (assert + tên test + message assert); 4 file trong số đó bump thêm pin vi==en 61 → 72 (xem §4) |

17 file bump pin số key (khớp đúng danh sách T5): `ProjectMenu.i18n55L1`, `speedWarnTooShortDead63R10` (chỉ comment), `codecProbeDebts76D8` (chỉ comment), `codecProbeUi75C6`, `errorDetail34Q4` (chỉ comment), `i18nAudit59P7`, `i18nModals79G9`, `i18nModals80H7`, `i18nOrphans60Q4`, `i18nRound57N4`, `i18nSweep81I9`, `reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`, `reverseToggleI18n48D4`, `saveToast31`, `structuredNotes32`. 4 file bump thêm vi==en: `i18nOrphans60Q4`, `i18nAudit59P7`, `i18nSweep81I9`, `codecProbeUi75C6`. Tất cả edit pin thực hiện bằng script Python với assert số lần xuất hiện chính xác cho mỗi chuỗi thay thế (`/tmp/round93-u5/bump.py`); sau bump, mọi `2518` còn lại trong test đều là tham chiếu lịch sử trong comment (đã grep kiểm).

## 4. Kiểm chứng (số trước → sau; chạy lại lần 2 ở cuối luồng: dict + css60 + orphans giữ nguyên)

| Check | Trước | Sau |
|---|---|---|
| Dict recount (python json, đếm key lá) | vi 2518, en 2518, vi==en 61 | **vi 2767, en 2767, cùng tập key, 0 rỗng, vi==en 72** |
| cssClasses60Q2 | 59/59 | **60/60** (khối StickerPanel mới) |
| cssClasses61R4 | 60/60 | **60/60** |
| i18nOrphans60Q4 | 16/16 | **17/17** (+1 check labelKey mới) |
| i18nAudit59P7 | 8/8 | **8/8** |
| i18nSweep81I9 | 16/16 | **16/16** |
| i18nModals79G9 / i18nModals80H7 | 9/9, 13/13 | **9/9, 13/13** (esm) |
| ProjectMenu.i18n55L1 | 6/6 | **6/6** |
| codecProbeUi75C6 | 16/16 | **16/16** |
| saveToast31 / structuredNotes32 | 15, 12 | **15, 12** |
| reverseBadge / reverseCompat / reversePlayback / reverseToggle | 8/8, 10/10, 3/3, 3/3 | **8/8, 10/10, 3/3, 3/3** |
| i18nRound57N4 / codecProbeDebts76D8 / errorDetail34Q4 / speedWarnTooShortDead63R10 | 14, 14/14, 35, 5/5 | **14, 14/14, 35, 5/5** |
| Mirror check (`check-video-spec-mirror.mjs`) | 427 pass, 0 fail | **427 pass, 6 known, 0 fail** |
| tsc web (`apps/web`, `npx tsc --noEmit`) | 0 lỗi (baseline đợt 92) | **0 lỗi** |
| vite build | pass (24,98s đợt 92) | **PASS 19,43s** (cảnh báo chunk >500 kB có sẵn, không phải lỗi mới) |

Cách chạy test: esbuild bundle từng file ra `/tmp/round93-u5/*.test.{cjs,mjs}` rồi `node` (cjs mặc định, esm cho I9 + modals79/80 vì top-level await). Script chạy: `/tmp/round93-u5/run-tests.sh` (scratch ngoài repo, không đưa vào batch). Script sinh dict + labelKey: `/tmp/round93-u5/gen.py`; script bump pin: `/tmp/round93-u5/bump.py` (cả hai ngoài repo, không đưa vào batch).

**Kiểm chứng động (không chỉ tĩnh):** script node đọc dict thật + mô phỏng `t()`:
- 13 key mẫu: cat đủ 5 (`Shapes`/`Arrows`/`Badges`/`Bubbles`/`Emoji`), item (`star` → "Star", `twemoji-1f600` → "Grinning face", `fluent-rocket` → "Rocket", `badge-crown` → "Crown", `shape-triangle` → "Triangle") — vi/en đều đúng, không rơi về key thô.
- Tìm kiếm ở locale EN: gõ `star` → 5 hit (star, star-struck, glowing star, star, star); gõ `sao` (tiếng Việt) ở locale EN → vẫn 5 hit nhờ fallback nhãn gốc; gõ `heart` → 17 hit. Đúng hành vi thiết kế §2.

## 5. Quét AST sticker.ts — chuỗi UI còn lại

Quét toàn `packages/video-spec/src/sticker.ts` sau sửa (bỏ comment, chỉ tính literal trong code):

- **249 giá trị `label` tiếng Việt còn lại trong data — ĐÃ CÓ CHỦ ĐÍCH, không phải sót:** nay là dữ liệu/fallback (UI không render trực tiếp nữa; panel dùng `t(labelKey)`, chỉ rơi về `label` khi thiếu key hoặc khi tìm kiếm). Xóa `label` sẽ mất fallback + mất tìm kiếm tiếng Việt ở locale EN, và là breaking change với mọi consumer đọc `.label`.
- **10 template message trong `validateStickerClip` (sticker.ts ~374–400) — NỢ MỞ, ngoài brief, không tự sửa:** `"sticker phải là một object"`, `kind phải là "sticker"`, `thiếu id`, `thiếu src (đường dẫn file PNG)`, `start phải là số >= 0`, `duration phải là số > 0`, `${key} phải trong khoảng 0..1, nhận được: …`, `scale phải là số > 0, nhận được: …`, `opacity phải trong khoảng 0..1, nhận được: …`, `rotation phải là số (độ), nhận được: …`. Các message này hiện ra UI qua `err` ở StickerPanel (`addStickerToTimeline` nối lỗi rồi render `<p className="warn">{err}</p>`) nên locale EN vẫn thấy tiếng Việt khi clip sticker lỗi. Không sửa trong luồng này vì: đổi sang mã lỗi là đổi API công khai của video-spec (trả `string[]`); message bị khóa cứng ở 3 nơi — mirror `packages/video-spec/src/sticker.js`, `server/render/src/sticker.js` (mirror riêng), `mcp-server/src/validate.ts:602` (bản validateStickerClip riêng) — và probe mirror so sánh kết quả `validateStickerClip` giữa `.ts`/`.js`. Muốn dọn cần parent quyết thiết kế mã lỗi + đồng bộ cả 3 mirror + probe.
- **Không còn chuỗi UI nào khác:** ngoài 2 nhóm trên, sticker.ts không còn literal tiếng Việt nào trong code (comment tiếng Việt không tính).

## 6. Nợ mở cho parent

1. **10 message `validateStickerClip` (xem §5):** cần quyết thiết kế mã lỗi + đồng bộ 3 mirror trước khi dọn.
2. **Rủi ro gộp (merge hazard) cần parent lưu ý:** pin dict đã bump theo trạng thái đĩa lúc luồng này xong (2767/72). Nếu luồng song song đợt 93 khác cũng thêm key vào dict và bump pin theo số của họ, lúc gộp parent phải đếm lại dict từ đĩa và bump lại pin về đúng tổng — không lấy số trong LIMITS này làm chuẩn tuyệt đối.
3. `apps/web/dist` là build output của bước kiểm chứng, KHÔNG đưa vào batch. Script `/tmp/round93-u5/` là scratch, có thể mất sau reboot — không đưa vào batch.

## 7. File stage (KHÔNG push)

- Batch: `~/workspace/repo-1-push/paths-loop/phase9-round93-u5-i18n-sticker-data.txt` — 24 entry = 2 data layer (.ts/.js) + 2 dict + 1 panel + 1 css60 + 17 file pin (đã gồm orphans + audit) + LIMITS này.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u5.md` (ngoài repo, không đưa vào batch).

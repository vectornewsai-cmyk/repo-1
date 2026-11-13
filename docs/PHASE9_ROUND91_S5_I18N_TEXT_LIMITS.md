# PHASE9_ROUND91_S5_I18N_TEXT_LIMITS.md — Đợt 91, luồng S5: i18n văn bản (nợ đợt 90 §4 mục 5: ĐÃ ĐÓNG)

Ngày: 12/11/2026 (lượt cron 00:35 +07). Repo `~/workspace/repo-1`. KHÔNG push. KHÔNG release/tag.
Nguồn nợ: `docs/PHASE9_ROUND90_R9_I18N_SWEEP_LIMITS.md` §4 + `docs/PHASE9_ROUND90_LIMITS.md` §4 mục 5.

## 1. Kết luận

- **Cả 2 nợ văn bản R9 §4 ĐÃ ĐÓNG.**
  - (a) `TrackPanel.tsx:140` tiêu đề `🎯 Motion tracking` hardcode → thêm key mới
    `motionTrack.title` vào dict vi/en và dùng `t("motionTrack.title")`. Dict
    **2516 → 2517 key lá mỗi bên**, vi == en, cùng tập key, 0 key mồ côi, 0 giá trị rỗng.
  - (b) `MaskPanel.tsx:104` fragment JSX gắn thêm `— xem <code>…MASK_LIMITS.md</code>.`
    sau template `mask.tipUnsupported` → **đã xóa**. Template dict vốn đã kết thúc bằng
    chính tham chiếu đó nên UI trước đây hiện tham chiếu 2 lần và từ "xem" hardcode hiện
    cả ở locale EN; nay chỉ còn 1 lần, đúng cả 2 locale. Không đổi dict cho (b).
- **Pin đếm key đã bump 2516 → 2517 ở toàn bộ 17 file test pin số key** (assert + tên
  test + chuỗi lịch sử trong comment). Quét lại toàn `apps/web/src`: không còn `2516`
  nào ngoài tham chiếu lịch sử trong comment (vd "2516 sau đợt 88 P6") — đúng, giữ lại.
- **Không đụng StickerPanel.tsx:192 (`🌟 Sticker`)** — R9 §4 nêu cùng mẫu nhưng brief
  đợt 91 S5 chỉ giao TrackPanel + MaskPanel; để parent quyết có dọn chung không
  (cần thêm key `sticker.title` + bump 2517 → 2518 nếu làm).

## 2. Thay đổi

| File | Thay đổi |
|---|---|
| `apps/web/src/i18n/vi.json` | `motionTrack.title`: `"🎯 Theo dõi chuyển động"` (key đầu nhóm `motionTrack`) |
| `apps/web/src/i18n/en.json` | `motionTrack.title`: `"🎯 Motion tracking"` (giữ nguyên chuỗi EN cũ) |
| `apps/web/src/components/sticker/TrackPanel.tsx:140` | `<div …>🎯 Motion tracking</div>` → `<div …>{t("motionTrack.title")}</div>` (`t` đã import sẵn từ `../../i18n`) |
| `apps/web/src/components/mask/MaskPanel.tsx:104` | Xóa dòng `{" "}— xem <code>server/render/src/MASK_LIMITS.md</code>.` |
| 17 file `*.test.ts` | Bump pin 2516 → 2517 (xem §3) |

17 file test đã bump: `ProjectMenu.i18n55L1`, `speedWarnTooShortDead63R10` (chỉ comment),
`codecProbeDebts76D8` (chỉ comment), `codecProbeUi75C6`, `errorDetail34Q4` (chỉ comment),
`i18nAudit59P7`, `i18nModals79G9`, `i18nModals80H7`, `i18nOrphans60Q4`, `i18nRound57N4`,
`i18nSweep81I9`, `reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`,
`reverseToggleI18n48D4`, `saveToast31`, `structuredNotes32`.
Quy tắc bump (script Python, không sửa tay từng dòng): chỉ thay `2516` → `2517` trên dòng
assert (`assert.equal`/`eq(`) và dòng tên test (`ok("dict`/`check("dict`); comment lịch sử
được nối thêm `+1 key đợt 91 S5 (motionTrack.title) → 2517` thay vì viết đè số cũ.

## 3. Kiểm chứng (cây hiện tại, sau sửa)

| Check | Kết quả |
|---|---|
| Dict recount (python json, đếm key lá) | **vi 2517, en 2517, cùng tập key, vi-only [], en-only [], 0 giá trị rỗng** |
| i18nOrphans60Q4 | 16/16 pass |
| i18nAudit59P7 | 8/8 pass |
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
| test_validate_codes.js (server/render) | 1596/1596 pass |
| validateCodes63R9 (mcp-server, đường dist: `npx tsc -p tsconfig.json` rồi `node dist/mcp-server/src/validateCodes63R9.test.js`) | 53/53 pass |
| tsc web (`apps/web`, `npx tsc --noEmit`) | 0 lỗi |
| vite build | PASS (28.31s; cảnh báo chunk >500 kB có sẵn, không phải lỗi mới) |

Lưu ý: `~/workspace/repo-1` không phải git repo (bản làm việc thường) nên không có
`git diff` để đối chiếu; xác minh bằng đếm lại dict từ đĩa + grep toàn cây + chạy lại
toàn bộ suite pin. `mcp-server/dist` và `apps/web/dist` là build output của bước kiểm
chứng, KHÔNG đưa vào batch.

## 4. Nợ mở cho parent

1. `StickerPanel.tsx:192` tiêu đề `🌟 Sticker` hardcode vẫn còn (cùng mẫu TrackPanel,
   R9 §4 đã nêu). Nếu dọn: thêm `sticker.title` + bump pin 2517 → 2518 ở đúng 17 file
   trên. Không tự làm ngoài brief.
2. Không có nợ mới do luồng này tạo ra.

## 5. File stage (KHÔNG push)

- Batch: `~/workspace/repo-1-push/paths-loop/phase9-round91-s5-i18n-text.txt` — 22 entry
  (2 dict + 2 component + 17 test + LIMITS này).
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s5.md`
  (ngoài repo, không đưa vào batch).

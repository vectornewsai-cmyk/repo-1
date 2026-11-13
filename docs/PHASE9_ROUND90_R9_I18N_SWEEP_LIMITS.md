# PHASE9_ROUND90_R9_I18N_SWEEP_LIMITS.md — Đợt 90, luồng R9: i18n sweep + dict recount + dọn nợ văn bản sau R1–R4

Ngày: 11/11/2026 (lượt cron 21:35 +07). Repo `~/workspace/repo-1`. KHÔNG push. KHÔNG release/tag.
KHÔNG sửa production. KHÔNG thêm key mới. Chỉ thêm 1 file LIMITS này (luồng sweep, không đụng code).

## 1. Kết luận

- **Dict giữ nguyên 2516 key lá mỗi bên (vi == en == 2516, cùng tập key, 0 key mồ côi).**
  Đếm lại trực tiếp từ đĩa lúc 21:58 +07: vi.json 2516, en.json 2516, vi-only [],
  en-only []. Mtime vi.json/en.json vẫn 08:46 UTC (= 15:46 +07, từ đợt 88 P6) — không ai
  sửa dict trong đợt 90 tính tới thời điểm sweep.
- **R1–R4 CHƯA thêm key nào (chưa có gì để gộp).** Lúc sweep (21:52–21:58 +07):
  R1 đã hạ cánh log nhưng đang làm dở (checklist mới xong bước đọc code, chưa sửa
  `preview.tsx`/`previewEngine.ts` — mtime preview.tsx vẫn 12:30 UTC từ đợt 89 Q3);
  R5/R6 đang chạy; R2, R3, R4 chưa có log/file nào trên đĩa. R1 là sửa motion-blur
  preview (hướng (iii), không UI mới) và R6 là sửa harness G1 — cả hai theo brief đều
  không thêm chuỗi UI; R2–R4 chưa về nên không kết luận được về key của họ.
  **Parent closing cần chạy lại sweep này sau khi R2–R4 hạ cánh** nếu họ thêm key/fragment.
- **Không bump test pin nào** (không có lý do bump: dict không đổi, mọi pin 2516 vẫn xanh).
- **Không có key thô nào hiện UI do R1–R4 để lại** — vì chưa có code R1–R4 nào hạ cánh
  ngoài log R1/R5/R6.

## 2. Kiểm chứng (cây hiện tại, trước khi R2–R4 về)

| Check | Kết quả |
|---|---|
| Dict recount (python json, đếm key lá) | vi 2516, en 2516, cùng tập key, 0 lệch |
| i18nOrphans60Q4 | 16/16 pass |
| i18nAudit59P7 | 8/8 pass |
| i18nSweep81I9 | 16/16 pass |
| i18nModals79G9 | 9/9 pass |
| i18nModals80H7 | 13/13 pass |
| ProjectMenu.i18n55L1 | 6/6 pass |
| test_validate_codes.js (server/render) | 1596/1596 pass |
| validateCodes63R9 (mcp-server, chạy đúng đường dist: `npx tsc -p tsconfig.json` rồi `node dist/.../validateCodes63R9.test.js`) | 53/53 pass |
| tsc web (`apps/web`, `npx tsc --noEmit`) | 0 lỗi |
| vite build | KHÔNG chạy (luồng không đụng TS/CSS; tsc 0 + các suite trên đủ) |
| css60/css61 | KHÔNG chạy (không chạm CSS) |

Lưu ý runner: `node scripts/run-node-test.mjs mcp-server/src/validateCodes63R9.test.ts`
FAIL với `ERR_MODULE_NOT_FOUND .../mcp-server/src/validate.js` — đó là cách chạy SAI
(test này import `./validate.js` và chỉ chạy được từ `dist/` sau khi build, đúng như
header của file). Chạy đúng đường dist thì 53/53 pass. Không phải hồi quy.

## 3. Quét chuỗi UI thật chưa wire / comment stale (preview.tsx, seek.ts, validate.js, TrackPanel, MaskPanel)

- **preview.tsx (5051 dòng):** chỉ còn 1 console log dev (`[preview] tick lỗi…`, L4610)
  và 1 chuỗi log effect (L845) — đều là chẩn đoán/dev-only, không tới UI, đúng phân loại
  của sweep I9. Các comment về "track bị bỏ qua" đều ĐÚNG với hành vi hiện tại:
  L944 (text typewriter/karaoke vẽ ASS — validate.js L741–742), L1779 (video dính
  transition ở unit đã merge — validate.js L733–734, mask vẫn bám). Comment O4 sai
  ("render bỏ qua track cho ảnh") đã được closing đợt 88 sửa; không còn bản stale nào.
- **seek.ts (578 dòng):** mọi hit tiếng Việt đều là comment. Sạch.
- **validate.js (1130 dòng):** nhiều chuỗi tiếng Việt thô — NHƯNG ĐÓ LÀ THIẾT KẾ CÓ CHỦ Ý,
  không phải chuỗi UI chưa wire: header file (L25–27, L101–102) ghi rõ `err()/warn()` giữ
  nguyên chuỗi cũ từng chữ vì tương thích client cũ/log/test cũ, đồng thời ghi thêm entry
  `{ where, code, params }` vào `errorDetails`/`warningDetails` để web dịch qua dict
  template `validation.*`. Key mới nhất `validation.TRACK_IMAGE_MASK` (P6, đợt 88) có đủ
  cả vi/en, đúng từng chữ với warn ở validate.js L752–753. Không sửa validate.js.
- **TrackPanel.tsx / MaskPanel.tsx:** mọi chuỗi UI đều qua `t()`/`i18nT()` — TRỪ 2 điểm
  ở §4 dưới (nợ có sẵn, KHÔNG phải do R1–R4).

## 4. Nợ văn bản có sẵn phát hiện thêm (KHÔNG sửa trong luồng này — cần parent quyết)

Cả hai đều có sẵn từ trước đợt 90, không phải do R1–R4. Không tự thêm key mới theo
lệnh luồng (thêm key = đổi dict 2516 → phải bump 6+ test pin, rủi ro khi các luồng
song song còn đang chạy), nên chỉ ghi lại để parent/closing quyết:

1. **TrackPanel.tsx:140 — tiêu đề panel hardcode:** `<div className="panel-head">🎯 Motion tracking</div>`
   — chuỗi EN thô, hiện nguyên cả 2 locale, không có key nào trong dict chứa
   "Motion tracking" (đã grep toàn dict). Cùng mẫu ở StickerPanel.tsx:192
   (`🌟 Sticker`). Hướng sửa: thêm 1 key `motionTrack.title` (+ `sticker.title` nếu
   dọn chung) rồi bump các pin dict 2516 → 2517 (hoặc 2518).
2. **MaskPanel.tsx:104 — tham chiếu LIMITS bị lặp 2 lần + "xem" không dịch:**
   JSX gắn thêm `{" "}— xem <code>server/render/src/MASK_LIMITS.md</code>.` sau
   `i18nT("mask.tipUnsupported", …)`, NHƯNG template dict đã kết thúc bằng chính
   tham chiếu đó (vi: `… — xem server/render/src/MASK_LIMITS.md.`,
   en: `… — see server/render/src/MASK_LIMITS.md.`). Kết quả UI hiện tham chiếu 2 lần
   liên tiếp, và từ "xem" hardcode hiện cả ở locale EN. Hướng sửa: xóa đúng fragment
   JSX ở L104 (không cần thêm key, không đổi dict) — template đã mang đủ tham chiếu.

## 5. Nợ mở cho parent closing đợt 90

1. Chạy lại sweep R9 sau khi R2–R4 hạ cánh: nếu họ thêm key/fragment thì gộp vào dict
   + bump toàn bộ pin 2516 (6 file: i18nOrphans60Q4, i18nAudit59P7, i18nSweep81I9,
   i18nModals79G9, i18nModals80H7, ProjectMenu.i18n55L1 — cộng các test khác cũng pin
   2516 trong comment: speedWarnTooShortDead63R10, errorDetail34Q4, codecProbeDebts76D8,
   codecProbeUi75C6, saveToast31, structuredNotes32, reverseBadge46B6, reverseCompat44Z6).
2. Quyết 2 nợ §4 (thêm key title hay để nguyên; xóa fragment lặp ở MaskPanel L104).
3. validate.js giữ chuỗi VI thô theo thiết kế — không coi là nợ i18n.

## 6. File stage (KHÔNG push)

- `docs/PHASE9_ROUND90_R9_I18N_SWEEP_LIMITS.md` (file này — file duy nhất luồng tạo/sửa trong repo).
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r9.md` (ngoài repo, không đưa vào batch).
- Batch: `~/workspace/repo-1-push/paths-loop/phase9-round90-r9-i18n-sweep.txt` — 1 entry.
- Tổng chờ push sau đợt 89: 1984 entry / 232 batch / 1199 file duy nhất (theo MEMORY);
  luồng này +1 entry / +1 batch (parent đếm lại số file duy nhất ở closing).

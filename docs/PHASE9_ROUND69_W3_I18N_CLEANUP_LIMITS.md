# Phase 9 đợt 69 — luồng W3: Dọn dẹp i18n + stage hygiene + kiểm chứng tích hợp đợt 68

Ngày: 09/11/2026 (~03:47–04:00 +07). KHÔNG push, KHÔNG release/tag, KHÔNG binary.
Chỉ luồng này được sửa `apps/web/src/i18n/vi.json` và `en.json` trong đợt 69.

## 1. Việc làm

1. **Xóa key chết `legacyAdopt.confirmAllBody`** khỏi `vi.json` + `en.json`
   (dòng 3079 cả hai file). Dict: **2379 → 2378 key lá, vi==en**, JSON parse OK.
   10 key fragment đợt 68 vẫn đủ (V2 2 + V6 4 + V8 4, đếm độc lập bằng script).
2. **Sửa comment** `apps/web/src/components/project/LegacyHistoryAdoptModal.tsx:27-28`:
   không còn trích tên key đã xóa (viết lại bằng chữ thường); ghi rõ chuỗi cũ đã
   xóa khỏi dict đợt 69 W3, chỉ còn trong fragment lịch sử `round67-u6.json`.
   Code modal vẫn dùng `t("legacyAdopt.confirmAllBodyMulti", ...)` (dòng 475), không đổi.
3. **Cập nhật 11 test khóa số key lá từ 2379 → 2378** (assert + tên test + text assert):
   `i18nAudit59P7`, `i18nOrphans60Q4` (tên test viết lại: "2379 sau đợt 68 − 1 key
   chết legacyAdopt.confirmAllBody xóa đợt 69 W3"), `i18nRound57N4`, `saveToast31`,
   `structuredNotes32`, `ProjectMenu.i18n55L1`, `reverseToggleI18n48D4`,
   `reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`,
   `speedWarnTooShortDead63R10` (comment tham chiếu số khóa).
4. **Audit persist V8 → 100%:** đăng ký `server/bridge/test/test-stab-single-thread-68v2.cjs`
   (luồng V2 đợt 68) vào `INVENTORY` trong `server/bridge/test/test-bridge-persist-audit.cjs`.
   File V2 vốn đã set `BRIDGE_RATE_PERSIST_PATH` riêng ở spawn (dòng 136) nên không
   sửa file V2 — chỉ thiếu đăng ký. Audit: **86 pass, 0 fail** (trước: 83 pass / 1 fail;
   inventory 39 → 40 file, quét thấy 45 site spawn bridge).
5. **Stage hygiene — file workflow khỏi danh sách stage:**
   - **Phát hiện trái tiền đề task:** file stage `phase9-round68-v9-docs-ci.txt` trên đĩa
     KHÔNG chứa `.github/workflows/ci-build.yml` (chỉ 4 entry: README, FEATURE_STATUS,
     CI_MANUAL_ADD_GUIDE, V9 LIMITS) — dù LIMITS V9 §7 liệt kê nó trong batch. Có thể
     parent đã gỡ trước hoặc V9 ghi nhầm; luồng này **không sửa file v9** (không thay đổi
     nên không liệt kê vào batch W3).
   - File thực sự chứa `ci-build.yml` là **`phase9-round53-j9-mirror-probe.txt`** (đợt 53 J9).
     Đã gỡ entry đó, ghi lại NUL-delimited, verify read-back: còn đúng 7 entry, toàn text,
     trailing NUL giữ nguyên, 287 byte, 0 match `ci-build`. Quét toàn bộ `paths-loop/`:
     không còn file stage nào chứa `workflows/` nữa.
   - `.github/workflows/ci-build.yml` **vẫn nằm trong repo local** — chỉ gỡ khỏi danh sách
     stage, không xóa file (file workflow không đẩy được qua push-files, GitHub 403 quyền
     workflows, tiền lệ push #4).

## 2. Kiểm chứng (số thật, chạy trong lượt này)

- Đếm độc lập dict (script node): trước 2379/2379 vi==en, 10/10 key fragment đợt 68 đủ,
  key chết có mặt cả 2 bên → sau: **2378/2378 vi==en, key chết đã hết cả 2 bên**,
  `confirmAllBodyMulti` còn nguyên. Recount cuối lượt vẫn 2378/2378 (không luồng nào
  khác đổi dict trong lúc chạy).
- `node apps/web/scripts/r6-i18n-check.cjs`: **PASS** (vi=en=2378).
- `node server/bridge/test/test-bridge-persist-audit.cjs`: **86 pass, 0 fail**, exit 0.
- Unit test (chạy qua `hidden_files/round68-v8/run-unit.cjs`, esbuild → node, cwd gốc repo),
  **13/13 suite xanh**:
  - `jobHistory67U7`: **31/31 pass** — assert "jobHistory.* ĐÃ có trong dict" (đã sửa từ
    trước, không còn assert lỗi thời "chưa có trong dict") nay xanh; verdict rõ ràng.
  - `i18nAudit59P7`: **8/8 pass**; `i18nOrphans60Q4`: **16/16 pass** (0 key mồ côi).
  - `i18nRound57N4`: **14 pass**; `saveToast31`: **15 pass, 0 fail**;
    `structuredNotes32`: **12 pass, 0 fail**.
  - `ProjectMenu.i18n55L1`: **6/6**; `speedWarnTooShortDead63R10`: **5/5**;
    `errorDetail34Q4`: **35 pass, 0 fail**.
  - `reverseToggleI18n48D4`: **3/3**; `reverseBadge46B6`: **8/8**;
    `reverseCompat44Z6`: **10/10**; `reversePlaybackI18n49E2`: **3/3**.
- `npx tsc --noEmit` (apps/web): **0 lỗi**. Không phát hiện lỗi tsc do luồng khác đợt 69.
- `npx vite build --configLoader runner`: **pass** (built in 30.89s; cảnh báo chunk
  >500 kB có từ trước, không mới).

## 3. Nợ / lưu ý (trung thực)

- `errorDetail34Q4.test.ts:16` vẫn chứa số "2379" trong **comment lịch sử** (mô tả số key
  lúc test được viết, kèm phép tính cộng dồn tới 2379) — **cố tình không sửa** để khỏi
  làm sai lệch ghi chép lịch sử; đây không phải assert khóa số.
- Tên test `i18nOrphans60Q4` vẫn nhắc "2379 sau đợt 68" như mốc tham chiếu — cố tình,
  là ghi chú lịch sử, không phải khóa.
- Fragment `apps/web/src/i18n/fragments/round67-u6.json` **vẫn chứa `confirmAllBody`**
  (bản ghi lịch sử của đợt U6; không test nào khóa số key của fragment này). Phạm vi
  luồng này chỉ xóa khỏi dict theo lệnh; nếu muốn dọn sạch thì xóa cả fragment ở đợt sau.
- EPERM ghi file: **không gặp trong lượt này** (ghi qua file-tools + node đều thành công,
  verify lại nội dung/kích thước sau mỗi lần ghi).
- Lần chạy đầu của loạt test dùng sai đường dẫn (`apps/web/src/...` thay vì `src/...`
  vì run-unit.cjs chạy esbuild với cwd `apps/web`) → esbuild exit 1, đã sửa đường dẫn
  và chạy lại đủ 13 suite, không ảnh hưởng kết quả.

## 4. Bổ sung (theo kiểm chứng sớm của W9): class `.mask-check` ngoài tổ tiên — ĐÃ SỬA

- **Nợ cũ từ đợt 68, không phải hồi quy đợt 69:** suite `cssClasses61R4` đỏ 1 assert —
  `ExportPanel.tsx@65065 <label> [gap] own=[field mask-check]` (65065 là offset ký tự
  trong file; dòng nguồn là **ExportPanel.tsx:1503**, khớp log đợt 68).
- **Nguyên nhân:** `.mask-check` chỉ được định nghĩa scoped dưới `.mask-panel` trong
  `apps/web/src/components/mask/mask.css` (2 rule: `.mask-panel .mask-check`,
  `.mask-panel .mask-check input`), không có rule top-level nào. Label ở ExportPanel:1503
  là toggle "stabilize single-thread" của đợt 68 V2, nằm ngoài mọi tổ tiên `.mask-panel`
  nên class này **không áp dụng style nào** — là class chết tại vị trí đó. Các lần dùng
  khác (MaskPanel, EnhancePanel ×4, MotionPanel) đều nằm trong `.mask-panel` nên test
  vẫn pass cho chúng.
- **Cách sửa (tối thiểu, không đổi hành vi):** bỏ `mask-check` khỏi label, còn
  `className="field"` + comment JSX giải thích (ExportPanel.tsx:1503-1506). Vì class vốn
  không áp dụng style nào ở đây nên hiển thị không đổi; toggle vẫn chọn bằng
  `data-testid="export-stab-single-thread-toggle"`, không dùng class. Không thêm rule CSS
  mới, không bọc thêm div `.mask-panel` (cách đó sẽ áp flex/gap vào label = đổi hiển thị,
  ngoài phạm vi). Nếu đợt sau muốn toggle này xếp hàng ngang kiểu flex thì thêm rule
  riêng có chủ ý, đừng dùng lại `mask-check` scoped của MaskPanel.
- **Kiểm chứng sau sửa:** `cssClasses61R4` **PASS 60/60** (trước 59/60);
  `stabSingleThread68V2` **16/16 pass** (toggle V2 nguyên vẹn); `tsc --noEmit` apps/web
  chạy lại sau sửa đổi: **0 lỗi**.
- File `apps/web/src/ExportPanel.tsx` được thêm vào batch stage của luồng này (§5).

## 5. Batch stage (KHÔNG push)

File: `~/workspace/repo-1-push/paths-loop/phase9-round69-w3-i18n-cleanup.txt`
(NUL-delimited, text only, verify read-back). Gồm 18 entry:

```text
apps/web/src/i18n/vi.json
apps/web/src/i18n/en.json
apps/web/src/components/project/LegacyHistoryAdoptModal.tsx
apps/web/src/components/project/ProjectMenu.i18n55L1.test.ts
apps/web/src/components/speed/speedWarnTooShortDead63R10.test.ts
apps/web/src/lib/reverseToggleI18n48D4.test.ts
apps/web/src/lib/reverseBadge46B6.test.ts
apps/web/src/lib/reverseCompat44Z6.test.ts
apps/web/src/lib/reversePlaybackI18n49E2.test.ts
apps/web/src/lib/i18nRound57N4.test.ts
apps/web/src/lib/saveToast31.test.ts
apps/web/src/lib/structuredNotes32.test.ts
apps/web/src/lib/i18nAudit59P7.test.ts
apps/web/src/lib/i18nOrphans60Q4.test.ts
server/bridge/test/test-bridge-persist-audit.cjs
apps/web/src/ExportPanel.tsx
docs/PHASE9_ROUND69_W3_I18N_CLEANUP_LIMITS.md
paths-loop/phase9-round53-j9-mirror-probe.txt  (MARKER — xem dưới)
```

**Lưu ý về entry marker cuối:** `phase9-round53-j9-mirror-probe.txt` là file stage đã sửa
(gỡ `ci-build.yml`), không phải file trong repo — liệt kê theo lệnh luồng để lần push sau
dùng đúng bản stage đã sửa trên đĩa. Khi push, **đừng đẩy entry này như file repo**;
file stage round53 trên đĩa (`~/workspace/repo-1-push/paths-loop/`) đã là bản đúng (7 entry).
File stage v9 không thay đổi nên không có trong batch này.

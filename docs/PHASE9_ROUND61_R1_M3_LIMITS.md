# Phase 9 — Đợt 61, luồng R1: đóng nợ M3 đỏ sẵn (đợt 60 §5.1)

**Ngày:** 2026-11-08 (rạng sáng, Asia/Saigon). **Phạm vi:** chỉ sửa file test
`apps/web/src/lib/i18nAudit56M3.test.ts` + LIMITS này. KHÔNG push, KHÔNG
release/tag, KHÔNG binary, KHÔNG sửa code production, KHÔNG sửa vi.json/en.json,
KHÔNG thêm key i18n mới (không có fragment R1 — không cần).

**Đóng nợ:** đợt 60 §2.2 + §5.1 (`docs/PHASE9_ROUND60_LIMITS.md`) và đợt 60 Q4
§5.1 (`docs/PHASE9_ROUND60_Q4_I18N_ORPHANS_LIMITS.md`):
`i18nAudit56M3.test.ts` đỏ sẵn **7/13**.

## 1. Kết quả

| Chỉ số | Trước sửa (đỏ-trước) | Sau sửa (xanh-sau) |
|---|---|---|
| M3 `i18nAudit56M3` | **7/13** (log `/tmp/round61-r1/red-before.log`) | **13/13** (log `/tmp/round61-r1/green-after.log`) |

Hồi quy (chạy lại bằng esbuild bundle `--format=esm` + node, như các đợt trước):

| Suite | Kết quả |
|---|---|
| M4 `i18nAudit56M4` | **25/25 pass** |
| Q4 `i18nOrphans60Q4` | **16/16 pass** |
| P7 `i18nAudit59P7` | **7/7 pass** |
| M5 `i18nRound56M5` | **21 pass** |
| errorDetail `errorDetail34Q4` | **35 pass, 0 fail** |
| `tsc --noEmit` apps/web | **0 lỗi** |
| `vite build` apps/web | **pass, 6,17 s** (chỉ cảnh báo chunk >500 kB có sẵn) |

## 2. Nguyên nhân thật của 6 fail — cả 6 đều là test stale, KHÔNG phải code sai

Đã kiểm chứng từng fail bằng code + dict thật trước khi sửa (không đoán):

### (a) `history.readFailed` — test fragment assert ngược thời gian, code đúng

- Code đúng: `HistoryPanel.tsx:54` gọi `t("history.readFailed", { error })`
  (test source HistoryPanel đã xanh từ trước sửa — 23/23 key đều gọi `t()`).
- Dict đúng: `history.readFailed` có trong cả vi.json (`Không đọc được lịch
  sử: {error}`) và en.json (`Could not read the history: {error}`).
- Test sai: test fragment assert `!mainVi.has(k)` — đúng ở đợt 56 lúc key
  mới chỉ nằm trong fragment, nhưng parent đã merge 83/84 key M3 vào dict
  cuối đợt 56 nên assert này nay sai với mọi key đã merge (fail dừng ở key
  đầu tiên là `history.readFailed`). Không có lỗi lookup/fallback/key sai.

### (b) 2 title động `templatePicker.title`, `relink.titleCount` — helper test so mẫu thô, code đúng

- Code đúng: `TemplatePicker.tsx:181` gọi
  `t("templatePicker.title", { n: String(TEMPLATES.length) })`;
  `RelinkPanel.tsx:148` gọi
  `i18nT("relink.titleCount", { n: String(missing.length) })`.
- Dict đúng: cả 2 key có trong vi/en với đúng chuỗi fragment.
- Test sai: helper `expectRendered` so HTML với chuỗi mẫu THÔ còn `{n}`
  (`"🎬 Video templates ({n} templates)"`). Nhưng `t()` (`i18n/index.ts:68-72`)
  nội suy `{n}` → số thật, nên HTML render đúng là `"(50 templates)"` /
  `"(1)"` — mẫu thô không bao giờ xuất hiện. Pre-merge test xanh nhờ fallback
  về key trần; post-merge chỉ còn chuỗi đã nội suy mới khớp.
- Cùng một lỗi helper còn ẩn 2 fail nữa, chỉ lộ ra sau khi title hết fail
  (assert throw ở fail đầu tiên nên các assert sau trong cùng test không chạy):
  `relink.intro` (`{n}`, missing.length = 1), `relink.usedIn`
  (`{label}` = `"Video"` — `RELINK_KIND_META.video.label`, locale-independent —
  + `{n}` = clipCount = 2), `relink.usedTopAndNested` (`{top}` = 1,
  `{nested}` = 1 từ `topLevelClipCount`/`nestedClipCount` của `MISSING_ONE`).
  Tổng cộng helper sai ảnh hưởng 5 assert render, không chỉ 2 title.

### (c) `enhance.renderOnly` — test đòi key đã bị xóa có chủ đích, code đúng

- Code đúng: `EnhancePanel.tsx` không gọi `t("enhance.renderOnly")` — ghi chú
  "chỉ có tác dụng khi render" đã bỏ từ đợt 59 P8; nay panel hiện ghi chú
  `enhance.previewApprox` của đợt 60 Q1 (`enhanceT(...)`, có fallback VI).
- Dict đúng: key đã bị đợt 60 Q4 xóa khỏi cả vi.json lẫn en.json sau khi
  xác minh 0 code đọc (Q4 §2.3) — grep lại đợt này: chỉ còn nhắc trong file
  test M3 này, fragment lịch sử `round56-m3.json`, và LIMITS/test Q4/P7.
- Test sai: vòng lặp EnhancePanel đòi `t("enhance.renderOnly")` cho đủ 16 key.
  Thêm lại key chỉ tái tạo key mồ côi Q4 vừa dọn — quyết định đúng là giữ
  key đã xóa và sửa test phản ánh quyết định đó (xem §3).

## 3. Cách sửa (chỉ sửa test, vì test sai — code và dict đều đúng)

Sửa duy nhất trong `apps/web/src/lib/i18nAudit56M3.test.ts`, không nới lỏng
assert nào — mọi thay đổi đều làm assert CHẶT hơn hoặc đúng hơn:

1. **Test fragment → khóa post-merge:** thay `!mainVi.has(k)` bằng: 83/84 key
   PHẢI có trong cả vi.json lẫn en.json VÀ dict value phải bằng đúng chuỗi
   fragment từng chữ (vi + en) — chặt hơn assert cũ (cũ chỉ khóa "chưa có
   trong dict"). Đã verify trước bằng script: 83 key khớp fragment 100%,
   0 mismatch; chỉ `enhance.renderOnly` vắng khỏi dict.
2. **Khóa ngược `enhance.renderOnly`:** key này PHẢI vắng khỏi cả vi.json
   lẫn en.json (nếu quay lại thì Q4 lại thành mồ côi). Fragment lịch sử
   `round56-m3.json` vẫn giữ 84 key (không sửa file lịch sử).
3. **Helper `expectRendered`/`expectRenderedVi` nhận thêm `vars?: Record<string,string>`**
   và so chuỗi ĐÃ nội suy (vẫn chấp nhận key fallback phòng dict bị lùi).
   Call site truyền vars thật, lấy từ dữ liệu test: `templatePicker.title`
   `{n:"50"}` (TEMPLATES.length == 50, đã assert), `relink.titleCount` /
   `relink.intro` `{n:"1"}` (missing.length == 1), `relink.usedIn`
   `{label:"Video", n:"2"}`, `relink.usedTopAndNested` `{top:"1", nested:"1"}`.
   Key không placeholder thì vars không đổi gì.
4. **Test EnhancePanel → 15 key + khóa ngược:** vòng lặp loại
   `enhance.renderOnly` khỏi 16 key (còn 15 key bắt buộc gọi `t()`), thêm
   assert `!src.includes('t("enhance.renderOnly"')` — không code nào được
   gọi lại key đã xóa.
5. **Comment header + ghi chú pre-merge** cập nhật sang trạng thái post-merge
   (đã merge cuối đợt 56; renderOnly là ngoại lệ đã xóa).

Không sửa production, không thêm/bớt key dict, không đổi `M3_KEYS`
(84 key — fragment lịch sử vẫn đủ 84, parity vi/en, vi khác en, placeholder
khớp đều giữ nguyên).

## 4. Kiểm chứng (số thật, chạy 2026-11-08)

- Đỏ-trước: `7/13` — đúng 6 fail như đợt 60 ghi (fragment `history.readFailed`,
  render EN/Vi TemplatePicker title, render EN/Vi Relink titleCount,
  source EnhancePanel renderOnly). Lệnh chạy theo header file:
  esbuild `--format=cjs` + node (cjs bắt buộc vì react-dom/server dùng
  require động — quirk đã biết từ đợt 56).
- Xanh-sau từng bước: sửa title → `11/13`, lộ thêm 2 fail ẩn trong cùng
  test Relink (`relink.intro`, `relink.usedIn` — cùng lỗi helper, xem §2b);
  sửa nốt vars cho intro/usedIn/usedTopAndNested → **`13/13`**.
- Hồi quy + tsc + vite build: xem bảng §1 — xanh hết.

## 5. Nợ mở (không thuộc luồng này)

1. `round56-m3.json` vẫn chứa `enhance.renderOnly` (fragment lịch sử, giữ
   nguyên có chủ đích) — mọi tool quét orphan trong tương lai cần nhớ key này
   chỉ sống trong fragment/test, không phải key dict.
2. M3 chỉ khóa render thật cho TemplatePicker/PerfOverlay/RelinkPanel;
   HistoryPanel/EnhancePanel/TemplatePackModal vẫn chỉ khóa ở mức source +
   fragment (giới hạn gốc từ đợt 56: IndexedDB / selection SSR / bridge lỗi).
3. `relink.kindAudio`/`kindImage` dùng `i18nT()` ở module-load trong
   `relink.ts` (label theo lang lúc load module) — M4 đã khóa, không đụng ở đây.
4. `ci-security.yml` 403 chưa lên GitHub (nợ từ đợt 6, không thuộc đợt này).

## 6. File thay đổi (stage ở `phase9-round61-r1-m3.txt`)

- `apps/web/src/lib/i18nAudit56M3.test.ts` (sửa test — 5 điểm §3)
- `docs/PHASE9_ROUND61_R1_M3_LIMITS.md` (file này)

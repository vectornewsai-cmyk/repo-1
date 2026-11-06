# Phase 9 đợt 27 K1 — Sửa bug text clip không style làm preview ném exception lúc load

> Nợ #1 của đợt 26 (J6 §6): text clip không có `style` làm preview ném
> exception lúc load, 5 lần/phiên, stack tới `drawTextClip` đọc
> `clip.style.animation` khi `style` undefined (seed TEXT-BLOCKED-LEAF
> của I6). UI sau đó vẫn sống. Luồng này KHÔNG push, KHÔNG tag/release,
> KHÔNG binary, KHÔNG dist vào batch.

## 1. Bug đã xác nhận (trước khi sửa, số đo thật)

Chạy repro bằng API load có sẵn (`parseProjectText`), chưa sửa gì:

- Top-level: load `ok: true`, nhưng `clip.style === undefined`; đọc kiểu
  preview (`clip.style.animation`) ném
  `TypeError: Cannot read properties of undefined (reading 'animation')`.
- Nested (lá trong `subSpec`, dạng seed TEXT-BLOCKED-LEAF): giống hệt —
  load `ok: true`, lá `style === undefined`, đọc preview ném cùng TypeError.

=> Câu hỏi mở của đợt 26 đã có đáp án: **top-level CŨNG ném**, không
riêng nested. Root cause: `validateClipDeep` nhánh `kind === "text"`
chỉ kiểm tra `text` là chuỗi, không kiểm tra `style` — trong khi type
`TextClip.style` là bắt buộc. File JSON thiếu style qua validator hợp
lệ, rồi preview mới nổ. Load không chặn file (đúng tinh thần fail-soft
của J5); lỗi nằm ở chỗ không ai điền style trước khi preview đọc.

## 2. Fix (hai lớp, cùng một hàm chuẩn hóa)

**Lớp 1 — root cause, cổng load (`apps/web/src/lib/projectRepo.ts`):**
`DEFAULT_TEXT_STYLE` + `normalizeTextStyle(style)` + `normalizeTextStyles(spec)`
+ nối vào `parseProjectText` sau validate và sau `migrateProjectMotion`.
Vì mở file (`loadProject`) và khôi phục autosave (`loadAutosave`) đều qua
`parseProjectText`, cả hai cổng đều được sửa. `normalizeTextStyles` duyệt
đệ quy cả `subSpec` của nested (chống vòng lặp theo nhánh như validator)
và trả về đường dẫn các clip đã sửa qua field mới `LoadResult.textStyleFixes`
(cộng thêm một warning tóm tắt vào `warnings` để flow toast sẵn có hiển thị).

**Lớp 2 — guard tại preview (`apps/web/src/preview.tsx`):**
`drawTextClip` chuẩn hóa clip thành bản sao nông trước mọi lần đọc
(cả `textClipVisual` trong previewEngine cũng đọc `clip.style` trực tiếp
nên phải chuẩn hóa trước khi gọi nó); `textFont` tự chuẩn hóa nên mọi
caller đều an toàn; `hitText` dùng bản sao đã chuẩn hóa để đo, nhưng vẫn
trả clip gốc để select/drag giữ đúng identity trong store. Lớp này cứu
clip tạo trong phiên không qua cổng load (store hiện tại luôn gán style
đầy đủ khi tạo chữ, nhưng guard khiến mọi đường tương lai cũng không ném).

**Giá trị mặc định (trung tính, không bịa hành vi):**
`fontFamily "Inter, system-ui, sans-serif"`, `fontSize 64`, `color "#ffffff"`,
`bold true`, `italic false`, `x 0.5`, `y 0.5`, `animation "none"`.
`animation` điền `"none"` chứ KHÔNG lấy `"fadeUp"` của store.addTextClip:
clip thiếu style trước đây chỉ crash chứ chưa từng vẽ, nên `"none"` là
lựa chọn không thêm chuyển động mà file không yêu cầu. fontSize/size
lấy theo default chữ mới của store; x/y 0.5 khớp fallback của
previewEngine khi thiếu x/y. `backgroundColor`/`highlightColor` là
optional nên chỉ giữ khi đã có, không tự gán.

**Không đổi hành vi clip đã có style:** field đã hợp lệ giữ nguyên giá
trị; chỉ field thiếu/sai kiểu mới được điền; clip có style đầy đủ giữ
nguyên từng field (test deep-equal). Clip không phải text không bị đụng.

## 3. Kiểm chứng (số thật, chạy lại sau fix)

- `textStyle27K1.test.ts`: **6/6 pass** — top-level không style load xong
  đọc preview được; lá nested được chuẩn hóa + `textStyleFixes` ghi đúng
  đường dẫn lá; style từng phần giữ field đã có, điền field thiếu
  (`animation "none"`, `x/y 0.5`); style đầy đủ deep-equal, fixes rỗng;
  `normalizeTextStyle` sửa cả `undefined`, kiểu sai, `fontSize <= 0`,
  animation lạ; clip video không bị gán style.
- Hồi quy: `projectRepo` 10/10, `projectRepoNested22` 7/7,
  `projectRepoRound26J5` 15/15, `nestedPreview` 46/46,
  `transitionPreview` 31/31, `previewEngine` 14/14.
- `vite build` pass (4.48s).
- `tsc --noEmit` toàn repo: **không 0** tại thời điểm luồng này chạy —
  nhưng KHÔNG lỗi nào thuộc file của luồng này. Các lỗi còn lại thuộc
  file các luồng song song đợt 27 đang sửa dở (xem §5). File test mới
  đã thêm vào `tsconfig.json` exclude đúng quy ước repo (như parent đợt
  26 đã làm cho J5).

## 4. Inspector / TextAnimPicker — đã kiểm tra tương thích

- `Inspector.tsx` dùng `clip.style.animation ?? "none"` (dòng ~273) và
  `clip.style.x ?? 0.5` / `y ?? 0.5`: sau chuẩn hóa, `animation` luôn có
  nên `??` chỉ còn là lưới an toàn, không đổi hiển thị — picker sẽ hiện
  "Không" cho clip từng thiếu style, đúng ngữ nghĩa trung tính.
- `TextAnimPicker` nhận `value` đã là chuỗi hợp lệ nên không cần sửa.

## 5. Giới hạn còn lại (trung thực, chưa làm)

1. **Guard preview chưa được gọi trực tiếp trong test:** `drawTextClip`
   không export nên test Node không gọi nó được; lớp guard được khóa
   gián tiếp qua `normalizeTextStyle` dùng chung + mô phỏng đúng các lần
   đọc của `drawTextClip`/`textFont` trên clip đã load. Click-test trên
   browser thật chưa làm (subagent không có live browser) — cần main
   chat kiểm chứng đầu-cuối nếu muốn khóa tuyệt đối.
2. **`previewEngine.textClipVisual` / `textSrPlacement` vẫn đọc
   `clip.style` trực tiếp.** An toàn hiện tại chỉ vì `preview.tsx` đã
   chuẩn hóa trước khi gọi; caller tương lai gọi thẳng hai hàm này với
   clip thô vẫn ném. Nếu muốn khóa tận gốc thì chuyển hai hàm đó sang
   dùng `normalizeTextStyle` — ngoài phạm vi luồng này (file của luồng
   khác), ghi nợ tại đây.
3. **Inspector vẫn đọc `clip.style.*` trực tiếp** (`bold`, `italic`,
   `fontSize`, `color`, `x/y` — chỉ `animation`/`x`/`y` có `??`). An toàn
   trong thực tế vì clip vào store chỉ qua cổng load (đã chuẩn hóa)
   hoặc store tạo chữ (luôn đủ style); clip nào chèn vào store bằng
   đường khác mà thiếu style vẫn làm Inspector ném. Nợ follow-up: chuẩn
   hóa ở `store.setSpec`/đường chèn clip, hoặc guard tại Inspector.
4. **Phía render (server/render) chưa kiểm chứng:** luồng này chỉ sửa
   web preview + cổng load web; clip thiếu style khi export có được
   render xử lý hay không thì chưa đo.
5. **Chuẩn hóa có làm mất thông tin ở 2 chỗ, đều vô hại nhưng ghi rõ:**
   key lạ trong `style` bị lược (render chỉ đọc field đã biết); chuỗi
   `animation` không nằm trong registry `TEXT_ANIMATIONS` bị reset về
   `"none"` (preview vốn đã coi animation lạ như tĩnh, nên không đổi
   hình ảnh thực tế).
6. **`textStyleFixes` chưa hiện trong load-report panel** (panel là việc
   của luồng khác đợt 27); hiện tại user chỉ thấy warning tóm tắt qua
   toast. Warning tóm tắt liệt kê tối đa 5 đường dẫn đầu.
7. **Nhiễu song song trong lúc làm:** khi luồng này chạy, các luồng đợt
   27 khác đang sửa cùng repo — `tsc` đổi kết quả giữa các lần chạy
   (có lúc `App.tsx` báo unused import, sau đó tự hết) và một lần sửa
   `tsconfig.json` đồng thời đã làm hỏng JSON (xen kẽ entry
   `loadReport.test.ts` của luồng khác với entry của luồng này). Luồng
   này đã sửa lại JSON hợp lệ, GIỮ NGUYÊN entry `loadReport.test.ts`
   của luồng khác; parent gộp cần đối chiếu lại `tsconfig.json` trước
   khi stage. Các lỗi tsc còn lại lúc cuối (ExportPanel unused,
   curveFix, curveFixRound27K2, loadReport) đều không phải file của
   luồng này — không tự sửa file luồng khác.

## 6. File đổi/thêm (đường dẫn tương đối từ repo root)

- `apps/web/src/lib/projectRepo.ts` (sửa: import `isTextAnimation` +
  type `TextStyle`; field `LoadResult.textStyleFixes`; khối
  `DEFAULT_TEXT_STYLE` / `normalizeTextStyle` / `normalizeTextStyles`;
  nối chuẩn hóa vào `parseProjectText`)
- `apps/web/src/preview.tsx` (sửa: import `normalizeTextStyle`; guard
  trong `textFont`, `drawTextClip`, `hitText` — không reformat phần khác)
- `apps/web/src/lib/textStyle27K1.test.ts` (mới, 6 test)
- `apps/web/tsconfig.json` (sửa: thêm test mới vào exclude; giữ entry
  `loadReport.test.ts` của luồng khác)
- `docs/PHASE9_ROUND27_K1_TEXT_STYLE_LIMITS.md` (mới, file này)

KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG binary, KHÔNG dist vào batch. (Thư mục `dist/` do `vite build`
sinh ra không thuộc batch.)

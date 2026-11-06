# Phase 9 đợt 27, luồng K2 — Render không còn fail-fast mù với curve vi phạm + nút sửa curve cho user — LIMITS

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không đổi ngữ nghĩa render, không đụng bridge/render worker.
Chỉ sửa file thuộc luồng mình; file của luồng khác trong đợt 27
(loadReport.ts, textStyle27K1.test.ts, preview.tsx) không đụng tới.

## 1. Đã kiểm chứng: đường export cũ mù ở đâu (trả lời thẳng)

Project có curve vi phạm (clip `bad-clip`, keyframe `{t: 0, v: 5}`):

1. Render worker nói RÕ: chạy thật `node server/render/src/render.js
   --spec <spec v=5> --out ...` → exit 1, stderr:
   `❌ Spec không hợp lệ (1 lỗi):` +
   `  1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong
   0.25..4 (nhận được: 5)`.
   (Cửa này là `validateSpec` ở server/render/src/validate.js, render.js
   gọi ở dòng ~1302.)
2. Bridge làm MÙ: server/bridge/src/jobQueue.js `_onError` (dòng ~806
   gắn ` Chi tiết: <stderr tail>`, dòng ~837 cắt lại bằng
   `String(message).split(" Chi tiết:")[0]`) — có chủ ý để không leak
   đường dẫn nội bộ ra API. Mô phỏng đúng 2 dòng đó cho thấy API
   `/api/render/:id` chỉ trả `error: "Render worker thoát với mã 1."`.
3. Web không chặn trước: ExportPanel `deepValidate` không kiểm tra
   `speedKeyframes` ở clip nào (kể cả cấp cao), nên spec vi phạm vẫn
   được gửi lên bridge rồi mới fail với thông báo mù ở trên.
   ExportPanel chỉ hiển thị nguyên văn `data.error` (dòng ~441).

Kết luận: lỗi gốc không nằm ở render validator (nó đã cụ thể), mà
ở chuỗi bridge-cắt-chi-tiết + web-không-kiểm-tra-trước. Luồng này
sửa ở phía web (chặn sớm + nút sửa), KHÔNG sửa bridge — xem §5 về
phần còn mù khi đi qua CLI/MCP.

## 2. Đã làm

- `apps/web/src/lib/curveFix.ts` (mới, thuần, không import
  projectRepo — xem §4 về lý do):
  - `sanitizeSpeedKeyframes(curve, duration)`: clamp v về [0.25, 4];
    t vượt duration → clamp về duration; t không đơn điệu → GIỮ THỨ
    TỰ VIẾT, loại keyframe sau có t không lớn hơn t giữ lại gần nhất
    (trùng t cũng loại); easing lạ → linear; bezier malformed
    (thiếu mảng / không đủ 4 số hữu hạn / x1, x2 ngoài [0, 1]) →
    linear + bỏ field bezier; keyframe không phải object, t không
    hữu hạn / t < 0, v không hữu hạn → LOẠI keyframe (không bịa số);
    quá 128 keyframe → giữ 128 đầu; curve hợp lệ → trả đúng tham
    chiếu cũ. Không cứu được (không phải object / keyframes không
    phải mảng / rỗng / mọi keyframe bị loại) → `curve: null` + lý do,
    KHÔNG tự bỏ cả curve (bỏ curve = đổi tốc độ clip về 1/speed
    hằng, là thay đổi ngữ nghĩa lén).
  - `sanitizeSpecSpeedCurves(spec)`: đệ quy qua subSpec (chống vòng
    lặp bằng seen-set sao chép theo nhánh như J5), không mutate
    input, clip/track không đổi giữ nguyên tham chiếu. Track khóa
    (`locked: true`) → bỏ qua, báo `skippedLocked` (tôn trọng khóa
    như patchClip). Trả `fixed / unsalvageable / skippedLocked` kèm
    mô tả thay đổi từng clip.
  - `checkSpeedKeyframesRenderFatal` + `collectRenderFatalSpeedWarnings`:
    mirror validator render (validate.js validateSpeedKeyframes +
    nested.js validateNestedRamp): shape, số lượng, t trong
    [0, duration], v, easing, bezier — KHÔNG kiểm tra t đơn điệu
    (render sort + dedupe nên curve chỉ lệch đơn điệu vẫn export
    được; xem speedcurve.ts normalizeSpeedKeyframes).
  - `exportCurveBlockers(spec)` / `formatExportCurveError(warnings)`:
    thông báo chặn export — nêu đường dẫn clip đầy đủ (kể cả qua
    `.subSpec.`), clipId, keyframe, giá trị vi phạm; liệt kê tối đa
    5 + câu tổng kết số còn lại; cuối câu nhắc nút sửa.
  - `formatSanitizeSummary(res)`: tóm tắt đã sửa / chưa sửa được /
    bỏ qua do khóa.
  - `SpeedCurveWarning` định nghĩa tại đây, CÙNG SHAPE với J5
    (projectRepo.ts) để tương thích cấu trúc — ExportPanel truyền
    thẳng warnings J5 vào mà không cần cast.
- `apps/web/src/store.ts`: action mới `fixSpeedCurveViolations()`
  (interface + implementation, dùng execCommand nội bộ) — 1 bước
  undo duy nhất, label "Sửa curve tốc độ vi phạm"; không đổi gì thì
  không push entry undo. CHỈ ExportPanel gọi, sau khi user xác nhận.
  Toast tóm tắt bắn sau exec (không nằm trong apply nên undo/redo
  không bắn lại, theo mẫu H3).
- `apps/web/src/ExportPanel.tsx`:
  - Banner cảnh báo khi có warnings J5 (tối đa 5 + tổng kết), kèm
    nút "🔧 Sửa curve vi phạm".
  - `startRender`: có blocker render-fatal → chặn ngay, set lỗi bằng
    đúng thông báo cụ thể (không gửi spec lên bridge); chỉ lệch đơn
    điệu → vẫn cho xuất (render chấp nhận).
  - `fixCurves`: tính sanitize trước, `window.confirm` liệt kê từng
    thay đổi + curve không cứu được + track khóa + cảnh báo "sửa
    curve có thể làm thay đổi timing", rồi mới gọi store action.
    Không tự sửa lén ở load/save/render.
- `apps/web/src/lib/curveFixRound27K2.test.ts` (mới, 17 test) +
  thêm vào `apps/web/tsconfig.json` exclude (theo quy ước repo:
  file *.test.ts mới phải nằm trong exclude).
- File đổi/thêm chính xác (6 file, KHÔNG gồm dist — xem §5):
  - `apps/web/src/lib/curveFix.ts` (mới)
  - `apps/web/src/lib/curveFixRound27K2.test.ts` (mới)
  - `apps/web/src/store.ts` (thêm action + import)
  - `apps/web/src/ExportPanel.tsx` (banner + chặn sớm + nút sửa)
  - `apps/web/tsconfig.json` (thêm 1 dòng exclude)
  - `docs/PHASE9_ROUND27_K2_CURVE_EXPORT_LIMITS.md` (mới, file này)

## 3. Sanitize làm thay đổi timing — nói thẳng

Sanitize là hành động user CHỌN (bấm nút + xác nhận), không phải
sửa lén, nhưng nó thay đổi timing thật của clip vi phạm: clamp v
đổi hệ số tốc độ; loại keyframe đổi hình dạng đường cong; clamp t
dời điểm đổi tốc độ. Sau sanitize, user PHẢI xem lại preview của
clip đó trước khi xuất — undo 1 bước khôi phục nguyên spec nếu
không ưng. Curve hợp lệ không bị đụng tới (giữ tham chiếu, test
khóa bằng assert tham chiếu). Trường hợp sanitize KHÔNG chạm:
curve không cứu được, track khóa — user sửa tay trong Speed panel.

Lưu ý ngữ nghĩa đơn điệu: sanitize GIỮ THỨ TỰ VIẾT và loại
keyframe sau, trong khi engine render sort + dedupe (keyframe sau
thắng khi trùng t). Với curve chỉ lệch đơn điệu, render và sanitize
cho kết quả khác nhau — đó là lý do ExportPanel KHÔNG chặn export
loại này, và nút sửa vẫn xin xác nhận trước khi áp dụng.

## 4. Vì sao curveFix không import projectRepo

Quy ước repo mâu thuẫn nhau ở điểm này: file trong build (tsc)
phải import không đuôi mở rộng (`./projectRepo`, mẫu archive.ts) —
tsc báo TS5097 nếu có đuôi `.ts`; còn test chạy bằng Node
type-stripping thì import không đuôi KHÔNG phân giải được
(ERR_MODULE_NOT_FOUND, đã gặp tận tay). Test file được exclude
khỏi tsc nên chúng dùng đuôi `.ts` được, nhưng file build thì
không. Vì vậy curveFix tự định nghĩa shape warning (tương thích
cấu trúc với J5) thay vì import projectRepo; nếu J5 đổi shape,
tsc ở ExportPanel (truyền warnings J5 vào hàm của curveFix) sẽ báo
ngay. Test của luồng này vẫn import projectRepo.ts có đuôi để
đối chiếu round-trip với J5 (sau sanitize, J5 quét lại = 0 warning).

## 5. Chưa làm / còn mù / giới hạn trung thực

- Bridge vẫn cắt chi tiết stderr (jobQueue.js `_onError`): project
  gửi qua CLI, MCP server, hoặc đường nào không qua ExportPanel mà
  vi phạm curve thì API vẫn chỉ trả "Render worker thoát với mã 1."
  (chi tiết chỉ có trong log server). Sửa bridge là việc riêng
  (cần cân nhắc không leak đường dẫn nội bộ) — luồng này cố tình
  không đụng bridge để tránh xung đột với luồng khác trong đợt 27.
- Chưa kiểm chứng click-test trên browser thật cho nút sửa (VM
  browser không tới được dev server; nút dùng window.confirm theo
  mẫu ProjectMenu đã có sẵn). Hành vi nút đã kiểm chứng qua store
  thật bằng esbuild bundle (xem §6).
- Chưa render MP4 thật sau sanitize (render worker fail ở bước
  validate trước khi chạm ffmpeg nên không cần media; kiểm chứng
  tới đúng cửa validate — render.js exit 1 + stderr cụ thể, §1).
  Render MP4 sau khi sửa là việc của đợt kiểm chứng export tổng thể.
- ExportPanel `deepValidate` vẫn không kiểm tra nested subSpec
  (nợ cũ, ngoài phạm vi luồng này); chặn curve ở đây dùng collector
  đệ quy riêng nên không phụ thuộc deepValidate.
- Sanitize không xử lý vi phạm render khác curve (vd reverse +
  speedKeyframes, speedKeyframes + stabilize): những lỗi đó vẫn đi
  theo đường cũ (bridge mù) cho đến khi có chặn sớm tương tự.
- `vite build` có tạo `apps/web/dist/` (đã có từ trước, .gitignore
  có `dist/`) — KHÔNG đưa dist vào batch stage.

## 6. Kết quả test (số thật)

- Mới `curveFixRound27K2`: **17 pass, 0 fail** (node trực tiếp):
  clamp v hai biên, curve hợp lệ giữ tham chiếu, đơn điệu giữ thứ
  tự + loại sau (giảm và trùng), t vượt duration clamp / t âm /
  NaN loại, v NaN loại, easing lạ → linear, bezier malformed →
  linear + bỏ bezier, bezier hợp lệ giữ nguyên, không cứu được →
  null (3 dạng), cắt 128, sanitize spec nested + tham chiếu clip
  anh em, không mutate input, track khóa bỏ qua, thông báo lỗi
  export (v=5 nêu đủ path/clipId/giá trị/nút sửa; chỉ lệch đơn điệu
  KHÔNG chặn; nested qua subSpec; liệt kê tối đa 5 + tổng kết),
  summary, hồi quy mix bezier + v biên.
- Hồi quy (node trực tiếp): J5 **15/15**, nestedPreviewFailsoft26J1
  **6/6**, twoLevelCurve **12/12**, nestedPreview **46/46**,
  nestedSpeedcurve **22/22**, speedcurveTrim **18/18**, nestedStore
  **11/11**, nestedDeepSpeed **16/16** — tổng hồi quy 146, cộng
  17 mới = **163 xanh, 0 fail**.
- Store thật qua esbuild bundle (`/tmp/k2storeSmoke.ts`, không nằm
  trong repo): spec v=5 → `fixSpeedCurveViolations()` sửa thành
  v=4, `undoDepth = 1` (đúng 1 bước), `undo()` khôi phục spec ban
  đầu khớp byte (so JSON.stringify).
- `vite build`: pass (5.43s, dist 978 kB JS).
- `tsc` (apps/web): KHÔNG có lỗi ở file của luồng này; log đầy đủ
  tại thời điểm chạy chỉ còn lỗi ở file của luồng khác đang sửa dở
  (preview.tsx, reversePlayback.test.ts — các luồng đợt 27 song
  song vẫn đang sửa, và output tsc thay đổi giữa các lần chạy do
  file họ chưa ổn định). Vì vậy `npm run build` (tsc && vite
  build) toàn repo CHƯA xanh — không phải do luồng K2, và luồng K2
  không sửa file của họ. Parent cần đợi các luồng kia ổn định rồi
  chạy lại tsc toàn repo trước khi coi đợt 27 là xong.

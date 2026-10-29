# Phase 9 — Đợt 18: dọn rác + toast nested (LIMITS, trung thực)

Luồng: dọn rác + toast nested. Phạm vi: CHỈ sửa
`apps/web/src/components/nested/NestedClipPanel.tsx` + file LIMITS này.
KHÔNG push, KHÔNG release/tag, KHÔNG sửa `store.ts` hay render worker.

## 1. Dọn rác — kết quả: ĐÃ QUÉT, SẠCH, KHÔNG DỌN GÌ

Đợt 17 ghi còn file rác `apps/web/~/workspace/repo-1-push/scratch16/`
(đường dẫn `~` lọt vào repo). Quét ngày 28/10/2026 trên repo local
`~/workspace/repo-1`, trừ `node_modules`, `.venv*` (môi trường phụ
thuộc), `apps/web/dist` (build output):

- Thư mục tên `~`: KHÔNG tìm thấy (kể cả `apps/web/~/`).
- Thư mục tên `scratch*`: KHÔNG tìm thấy (kể cả `scratch16`).
- Đường dẫn chứa thành phần `/~/`: KHÔNG tìm thấy.
- File `*.tmp`, `*.swp`, `.DS_Store`: KHÔNG tìm thấy.
- Lần nhắc duy nhất tới `scratch16` còn lại là DÒNG CHỮ trong
  `docs/PHASE9_ROUND17_LIMITS.md:45` (ghi chú của đợt 17), không phải
  đường dẫn rác thật — để nguyên, không sửa docs đợt khác.

Kết luận: file rác đợt 17 đã không còn trên đĩa ở checkout này (đã
được dọn từ trước hoặc chưa từng ghi vào cây này). Vì vậy KHÔNG có
thứ gì được chuyển ra `/tmp/vcut-cleanup-backup-20261028/` và thư mục
backup đó KHÔNG được tạo — tạo thư mục rỗng rồi báo "đã dọn" sẽ là
bịa. Các trường hợp quét trúng nhưng KHÔNG phải rác, đã loại trừ có
lý do:

- Thư mục `templates` trong `server/*/.venv*/...`: chứa chuỗi "temp"
  theo pattern grep, nhưng là file của môi trường Python phụ thuộc,
  không phải rác của đợt build.
- File `test_*.js/.py` trong `server/render/src/`, `packages/`,
  `assets/`: file test hợp lệ của repo, không phải file tạm.
- Symlink `apps/web/out -> /tmp/vcut-test-fonts/out`: có từ 19/10,
  không thuộc pattern rác của đợt này — để nguyên, không đụng.

## 2. Toast nested — đã làm gì

Vấn đề: nested clip mang `speedKeyframes` hoặc `reverse === true`
bị `splitNestedClip`/`trimNestedClip` từ chối (trả `null`, store giữ
nguyên clip) vì render worker cấm cả hai field này ở nested
(`server/render/src/nested.js`, hàm `nestedWindow`). Trước đợt này
lệnh tách/trim thất bại im lặng, user không biết lý do.

Đã thêm vào `NestedClipPanel.tsx` (chỉ file này):

- `nestedSpeedRejectionFields(clip)`: đọc duck-typed đúng điều kiện
  của `splitNestedClip`/`trimNestedClip` — `speedKeyframes !==
  undefined` hoặc `reverse === true`. `reverse: false` KHÔNG bị tính
  là vi phạm (khớp luật `=== true` của nestUtils).
- Toast riêng: khi panel liệt kê một nested clip mang field vi phạm,
  bắn 1 toast `error` qua `pushToast` (hệ toast thống nhất K5 từ
  `lib/toast.ts` — đúng pattern `Timeline.tsx` dùng khi drop bị từ
  chối: `pushToast(check.reason, "error")`). Mỗi clip chỉ nhận toast
  1 lần cho mỗi tổ hợp field trong vòng đời panel (key
  `id + field`, lưu trong `useRef` Set) để không spam khi spec đổi.
- Dòng cảnh báo bền vững: cùng câu báo hiển thị dưới clip đó bằng
  class `nested-panel-warn` đã có (toast tự đóng sau 4.5s nên dòng này
  giữ lý do lại cho user đọc).
- Nội dung câu báo nêu đủ 3 thứ: field nào (`speedKeyframes` /
  `reverse` / cả hai), ai cấm (render worker cấm cả hai ở nested
  clip), và cách gỡ (gỡ speed curve / tắt reverse khỏi nested clip
  rồi thử lại).

## 3. Kiểm chứng (số thật)

- `tsc --noEmit -p tsconfig.json` (apps/web): 0 lỗi. Trong lúc làm
  đã tự gây 1 lỗi cú pháp (edit làm rơi `clipId:` trong
  `select({ trackId, clipId: clip.id })` → TS1005), đã sửa và tsc
  sạch trở lại — lỗi này không lọt vào bản cuối.
- `vite build` (apps/web): PASS, built trong 6.62s
  (`dist/index.html` + `index-CayZMJQu.css` 62.48 kB +
  `index-CFV44ob9.js` 860.97 kB; cảnh báo chunk > 500 kB đã có sẵn,
  không liên quan đợt này). `dist/` là build output, KHÔNG stage.
- Luật từ chối kiểm chứng bằng HÀM THẬT (script tạm `/tmp`, không
  nằm trong repo): `splitNestedClip`/`trimNestedClip` từ `nestUtils`
  trên nested clip tự tạo — 8/8 check khớp detector của panel:
  plain split/trim OK (2), curve → null (2), reverse → null (2),
  cả hai → null (1), `reverse: false` → split OK (1).
- Không chạy `nestUtils.test.ts` trọn bộ vì luồng này không sửa
  `nestUtils.ts`; tsc + build đã bao phủ file panel đã đổi.

## 4. Giới hạn còn lại (nợ mở, không giấu)

1. **Toast bắn chủ động khi panel liệt kê clip, KHÔNG bắn đúng thời
   điểm tách/trim.** Lệnh tách/trim đi qua Timeline/store, mà
   `store.ts` nằm ngoài phạm vi file của luồng này nên không nối
   được lý do từ chối vào đúng thao tác đó. Hậu quả: user tách/trim
   từ Timeline mà không mở panel nested vẫn gặp thất bại im lặng.
   Sửa triệt để cần luồng store/Timeline: cho `splitClipAt`/
   `trimClip` trả lý do (hoặc check trước bằng `pushToast` kiểu
   Timeline drop-check) — việc của đợt sau, không làm lén ở đây.
2. **Toast chưa từng chạy thật trên DOM.** Repo không có DOM test
   runner (không vitest/jsdom/testing-library; test hiện có chỉ chạy
   logic thuần bằng Node type-stripping), nên không viết được test
   component thật cho panel mà không thêm dependency. Phần đã kiểm
   chứng: tsc + build + luật thật 8/8 + hiện diện cấu trúc
   (`pushToast`, điều kiện field, dòng warn) trong file. Click-test
   trên browser thật vẫn là nợ mở.
3. **Câu báo hardcode tiếng Việt.** Thêm key i18n cần sửa
   `i18n/vi.json` + `en.json`, ngoài phạm vi "chỉ file này" của
   luồng. Follow-up: luồng i18n thêm key (ví dụ
   `nested.speedRejected`) rồi thay literal bằng `i18nT`.
4. **Dedup toast theo phiên panel:** clip gỡ field rồi mang lại
   cùng tổ hợp trong cùng một lần mở panel sẽ không nhận toast lần
   hai (key đã có trong Set) — nhưng dòng cảnh báo bền vững luôn
   phản ánh đúng trạng thái hiện tại nên lý do không bị mất.
5. **Detector duck-typed:** nếu spec đổi tên field, detector im lặng
   hết khớp (cùng rủi ro duck-typing đã có trong nestUtils). Giảm
   thiểu: script kiểm chứng luật ở §3 có thể chạy lại sau mỗi lần
   spec đổi field nested.
6. **Phạm vi quét rác:** `node_modules`, `.venv*`, `dist` được trừ
   theo lệnh — rác (nếu có) trốn trong các cây đó sẽ không bị phát
   hiện. Với bản chất rác đợt 17 (đường dẫn `~` lọt vào repo) thì
   khả năng này không đáng kể, nhưng ghi rõ để không claim "quét
   toàn bộ tuyệt đối".

## 5. File đã đổi/thêm (đường dẫn tương đối từ repo)

- Đổi: `apps/web/src/components/nested/NestedClipPanel.tsx`
- Thêm: `docs/PHASE9_ROUND18_CLEANUP_TOAST_LIMITS.md`
- Không stage gì (parent stage). Không đụng file của luồng khác.
- `apps/web/dist/` thay đổi do chạy `vite build` kiểm chứng — build
  output, không tính vào batch.

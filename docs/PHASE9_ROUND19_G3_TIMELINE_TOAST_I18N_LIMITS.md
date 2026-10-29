# Phase 9 đợt 19 — G3: Toast tách/trim từ Timeline + i18n (LIMITS, trung thực)

Ngày: 2026-10-29. Luồng G3 trong đợt lớn round 19.
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop (parent gộp batch).

Đóng nợ đợt 18 (xem docs/PHASE9_ROUND18_CLEANUP_TOAST_LIMITS.md §4.1
và §4.3): toast nested khi đó chỉ bắn khi NestedClipPanel liệt kê
clip, chưa bắn đúng thời điểm tách/trim từ Timeline; câu báo hardcode
tiếng Việt, chưa qua i18n.

## 1. Việc đã làm

### 1a. Đường tách/trim từ Timeline tới store (đã khảo sát, không đổi logic)

| Điểm vào từ UI | Store action | Kết quả cũ khi nested mang field cấm |
|---|---|---|
| Nút tách TopBar (`TopBar.tsx` doSplit) + phím `S` (`App.tsx`) | `splitAtPlayhead()` → `splitClipAt()` → `splitNestedClipPure()` trả null | `false`, im lặng |
| Kéo mép clip trên Timeline (`Timeline.tsx` onMove) | `trimClip()` nhánh nested → `trimNestedClipPure()` trả null | `void`, im lặng |
| SceneModal / BeatSyncModal | `splitClipAtTimes()` → `splitClipAt()` từng điểm | `0`, im lặng |

Tất cả đều đi qua 4 điểm trong `store.ts` nên chỉ cần báo ở đó là
bao phủ mọi đường vào — không cần sửa từng component gọi.

### 1b. Toast đúng thời điểm tách/trim (store.ts, chỉ thêm side-effect)

Thêm vào `store.ts` (không đổi một dòng logic tách/trim/undo nào):

- `notifyNestedSplitTrimRejection(clip, op, trackId, clipId)`: bắn 1
  toast `error` qua `pushToast` (hệ toast thống nhất K5, cùng pattern
  các toast `speed.*` đã có trong store) với câu báo i18n (xem §1c).
- 4 điểm gắn (đúng điểm thất bại đã xác định, sau khi các cổng khác
  đã loại trừ):
  - `splitAtPlayhead`: `pair` null sau khi target đã qua cổng track
    khóa + margin 0.05s.
  - `trimClip` nhánh nested, cả mép trái và mép phải: `trimmed` null
    sau khi đích trim đã đổi thật (no-op đã return trước đó).
  - `splitClipAtTimes`: `applied === 0` và có ít nhất 1 điểm nằm hẳn
    trong clip (qua margin splitClipAt) — điểm ngoài clip vốn không
    tách được nên không báo.
- Chống spam khi kéo trim: Timeline gọi `trimClip` liên tục theo
  pointermove; cùng một (op, track, clip, tổ hợp field) chỉ báo lại
  sau 5s (toast tự đóng sau 4.5s nên cửa sổ này vừa che 1 lần kéo).
- TopBar: khi `splitAtPlayhead` đã bắn toast thì không flash câu chung
  `topbar.noClipAtPlayhead` nữa — câu đó sai sự thật trong trường hợp
  này (clip có đó, chỉ không tách được) và thành báo trùng. Nhận biết
  bằng cách đếm toast trước/sau lời gọi qua API công khai
  `subscribeToasts` (callback chạy ngay với snapshot); không đổi hợp
  đồng trả về `boolean` của action, không thêm state mới.

### 1c. Detector + câu báo dùng chung, qua i18n đủ vi + en

- Mới: `apps/web/src/components/nested/nestedRejection.ts` —
  `nestedSpeedRejectionFields(clip)` (đúng điều kiện
  split/trimNestedClip: kind `nested` + `speedKeyframes !== undefined`
  hoặc `reverse === true`; `reverse: false` và clip thường mang curve
  KHÔNG bị tính) và `nestedSpeedRejectionMessage(translate, name,
  fields)` (chọn fix theo tổ hợp field, đúng 3 nhánh của bản hardcode
  đợt 18). Panel và store nay dùng CHUNG một detector — hết nguy cơ
  hai bản lệch nhau khi spec đổi field (rủi ro đã ghi ở LIMITS đợt 18
  §4.5).
- `NestedClipPanel.tsx`: bỏ detector + câu hardcode riêng, gọi module
  chung với `i18nT`. Hành vi panel không đổi (toast khi liệt kê +
  dòng cảnh báo bền vững + dedup theo phiên panel).
- i18n mới (cả `vi.json` và `en.json`, key `nested.*`):
  `speedRejected` (biến `{name}`, `{fields}`, `{fix}`),
  `speedRejectedFixBoth`, `speedRejectedFixReverse`,
  `speedRejectedFixCurve`. Script quét toàn bộ dict: vi-only = [],
  en-only = [] — không sót key nào ở 1 ngôn ngữ (không chỉ 4 key mới).

### 1d. Chống báo giả (yêu cầu của đợt + bài học đợt 16)

Ngoài 4 cổng ở §1b, notify còn có cổng pre-field: mirror đúng các
check của hàm thuần TRƯỚC khi nó chạm tới check field (speed hữu hạn
> 0, trim hữu hạn out > in, trim vắng mặt = phát toàn bộ subSpec).
Nếu các check này đã fail thì hàm thuần trả null TRƯỚC check field —
field không phải nguyên nhân đã chứng minh được nên im lặng, không đổ
oan. Test khóa các trường hợp không-báo: clip thường mang curve tách
được (S5), playhead sát mép (S6), track khóa (S7), trim no-op delta 0
(T4), điểm tách ngoài clip (M2), trim thành công (T3), tách thành
công (S4/M3), kéo trim lặp (T5, dedup).

## 2. Kiểm chứng thật (số thật, lệnh chạy được)

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `store.nestedTimelineToast.test.ts` (esbuild bundle + node, mẫu `.store.test.ts`) | **16 pass, 0 fail** (S1–S7, T1–T5, M1–M3, I1) |
| Hồi quy `nestUtils.test.ts` (node trực tiếp) | 28 pass, 0 fail |
| Hồi quy `splitPatch.store.test.ts` (bundle) | 12 pass, 0 fail |
| Hồi quy `nestedStore.store.test.ts` (bundle) | 8 pass, 0 fail |
| Hồi quy `nestedStore.test.ts` (bundle) | 11 pass, 0 fail |
| Hồi quy `nestedDeepSpeed.store.test.ts` (bundle) | 8 pass, 0 fail |
| Hồi quy `nestedDeep.test.ts` (bundle) | 16 pass, 0 fail |
| Quét parity i18n vi/en (script Python duyệt toàn bộ dict) | vi-only [], en-only [] |
| `npx vite build` (apps/web, bỏ qua cổng tsc — xem §3.1) | **pass**, built in 9.79s (chunk > 500kB có sẵn từ trước) |
| `npx tsc --noEmit` (apps/web) | **KHÔNG sạch — nhưng 0 lỗi thuộc luồng này** (xem §3.1) |

Lệnh chạy test mới (copy đúng mẫu các file `.store.test.ts`):

```
cd <gốc repo>
node_modules/.bin/esbuild apps/web/src/store.nestedTimelineToast.test.ts \
  --bundle --platform=node --format=cjs \
  --outfile=/tmp/store.nestedTimelineToast.test.cjs --log-level=warning
node /tmp/store.nestedTimelineToast.test.cjs
```

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

1. **tsc chưa sạch do các luồng khác đang sửa dở (không phải lỗi của
   luồng này, KHÔNG tự sửa code luồng khác).** Lần chạy cuối chỉ còn
   3 lỗi, tất cả ngoài phạm vi G3, và số lỗi thay đổi giữa 2 lần chạy
   (chứng tỏ luồng khác đang sửa song song):
   - `src/lib/nestedPreview.ts(690)`: `'duration' is of type 'unknown'`.
   - `src/store.ts(109)`: import `applyNestedCurveFixedTrimPure` chưa
     được dùng (luồng khác mới thêm import, chưa dùng tới).
   - `src/store.ts(635)`: `EditorState` yêu cầu action
     `patchNestedCurveFixedTrim` (đã thêm vào interface ở dòng 565)
     nhưng thân `create()` chưa implement — luồng khác đang làm dở.
   File của luồng này (`nestedRejection.ts`, `NestedClipPanel.tsx`,
   `TopBar.tsx`, test mới) có **0 lỗi tsc**; `vite build` (không qua
   tsc) pass. Vì script `build` của repo là `tsc && vite build` nên
   `npm run build` sẽ fail cho tới khi các luồng kia hoàn tất — parent
   cần chạy lại tsc sau khi đợt 19 gộp xong, không phải do G3.
2. **Hồi quy lệch do luồng G2 đang dời guard xuống hàm thuần.**
   `store.nestedGuard.test.ts`: 8 pass, 1 fail (G1 — test cũ assert
   "hàm thuần R5 phải cho qua", nhưng G2 đã thêm guard vào
   `nestUtils.ts` dòng 547+ nên hàm thuần nay chặn, đúng ý đồ mới của
   G2). `nestedSpeedcurve.test.ts`: 19 pass, 3 fail, cả 3 đều là case
   `updateNestedInnerClip` (cùng nguyên nhân G2). G3 không đụng
   `nestUtils.ts` hay `updateNestedInnerClip` nên không gây ra 2 lệch
   này và không sửa test/code của G2 — parent gộp đợt cần cập nhật
   2 test cũ theo hành vi guard-mới của G2.
3. **Chưa chạy thật trên DOM.** Repo không có DOM test runner
   (không vitest/jsdom/testing-library) nên không viết được test
   component thật cho TopBar (flash suppression) hay NestedClipPanel
   (toast khi liệt kê) mà không thêm dependency. Phần đã kiểm chứng:
   store + toast module + i18n qua test thật 16/16, tsc sạch cho file
   của luồng, vite build pass. Click-test trên browser thật vẫn là nợ
   mở (nối tiếp nợ đợt 18 §4.2).
4. **Dedup toast 5s có thể nuốt 1 lần báo có chủ đích:** user tách thất
   bại, rồi trong vòng 5s tách lại cùng clip (ví dụ sau khi gỡ field
   thất bại rồi thử lại ngay) sẽ không thấy toast thứ hai — nhưng
   toast đầu vẫn đang hiển thị (tự đóng sau 4.5s) nên lý do không bị
   mất; và sau 5s báo lại bình thường. Panel giữ dedup riêng theo
   phiên panel (đợt 18 §4.4) — hai cơ chế dedup độc lập, không xung
   đột vì khác thời điểm bắn.
5. **TopBar flash suppression dựa vào đếm toast:** nếu một toast khác
   (không phải nested rejection) xuất hiện đúng trong lời gọi
   `splitAtPlayhead` thì flash chung cũng bị nuốt. Hiện tại action
   tách không bắn toast nào khác nên trường hợp này chưa xảy ra; nếu
   đợt sau thêm toast vào đường tách thì cần xem lại điều kiện này
   (ví dụ chỉ nuốt khi toast mới là error nested).
6. **Cổng pre-field là mirror, không phải gọi lại hàm thuần:** nếu
   `splitNestedClip`/`trimNestedClip` đổi thứ tự check trong tương lai
   (check field lên trước check speed/trim) thì cổng này trở nên thừa
   chứ không sai (vẫn báo đúng field); nếu đổi điều kiện field thì
   phải đổi cả `nestedRejection.ts` — đã có test I1 khóa detector.
7. **Phạm vi chỉ là tách/trim clip nested ngoài cùng:** `patchClip`
   đổi duration/trim trực tiếp, sửa clip con sâu (deep path) và tách
   clip con trong panel không thuộc đợt này; các đường đó vẫn có thể
   thất bại im lặng nếu hàm thuần trả null vì field — thuộc đợt sau
   nếu user yêu cầu.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- Mới: `apps/web/src/components/nested/nestedRejection.ts`
- Mới: `apps/web/src/store.nestedTimelineToast.test.ts`
- Mới: `docs/PHASE9_ROUND19_G3_TIMELINE_TOAST_I18N_LIMITS.md` (file này)
- Đổi: `apps/web/src/store.ts` (chỉ: import module chung + helper
  notify/gate + 4 điểm gắn toast + comment; KHÔNG đổi logic tách/trim)
- Đổi: `apps/web/src/components/nested/NestedClipPanel.tsx` (chỉ: dùng
  module chung + i18n, bỏ hardcode; hành vi panel không đổi)
- Đổi: `apps/web/src/TopBar.tsx` (chỉ: import `subscribeToasts` +
  nuốt flash chung khi action đã toast)
- Đổi: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
  (chỉ: thêm 4 key `nested.speedRejected*`)

KHÔNG ĐỔI (cố tình):
- `apps/web/src/components/nested/nestUtils.ts`, preview engine,
  render worker, script benchmark/harness/footage, file stage trong
  `~/workspace/repo-1-push/paths-loop/` và `build-loop-log.md` (parent
  gộp/log).
- Không push, không tag/release, không ghi qua GitHub.
- `apps/web/dist/` thay đổi do chạy `vite build` kiểm chứng — build
  output, không tính vào batch.

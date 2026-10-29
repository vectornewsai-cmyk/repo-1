# U1_LIMITS.md — Thống nhất ngữ nghĩa nested/adjustment (Phase 9 round 7, luồng U1: SPEC thuần)

> Tài liệu trung thực cho đợt 7. Chỉ tầng spec + validate + converter;
> KHÔNG đụng render worker, preview, UI, hay index.js output cũ.
> Mọi claim dưới đây đều có test đi kèm (xem cuối file).

## Quyết định đã chốt (parent chốt trước, luồng này implement đúng vậy)

- **Shape chuẩn duy nhất cho adjustment là `VideoSpec.adjustmentLayers`
  cấp project** (`packages/video-spec/src/adjustment.ts`).
  UI shape `kind: "adjustment"` trong `track.clips` là LEGACY, không bao
  giờ được thêm vào `Clip` union.
- **Shape chuẩn duy nhất cho nested là `NestedClip` mang `subSpec`**
  (`packages/video-spec/src/nested.ts`). Shape cũ dạng tracks trực tiếp
  (`{ kind: "nested", tracks: [...] }`, kiểu duck-typed của
  `nestedPreview.ts`) chỉ được normalize về chuẩn, không phải shape thứ
  hai được công nhận.

## Đã làm (có test)

### Adjustment: `tracks` + `source` + converter 2 chiều (`adjustment.ts`)

- `AdjustmentLayer` thêm 2 field tùy chọn:
  - `tracks?: number[]` — scope: chỉ số track trong `spec.tracks`.
    **Vắng hoặc rỗng = áp mọi track** (ngữ nghĩa R2 cũ, project cũ không
    đổi nghĩa). Chỉ số phải là số nguyên >= 0, không trùng nhau.
  - `source?: "panel" | "legacy-track-clip"` — chỉ truy vết nguồn gốc,
    không đổi ngữ nghĩa áp.
- `validateAdjustmentLayer(v, trackCount?)` /
  `validateAdjustmentLayers(v, trackCount?)`: `trackCount` tùy chọn, khi
  có thì chặn chỉ số vượt ngoài `[0, trackCount)`; khi vắng thì chỉ kiểm
  tra số nguyên >= 0 (không biết giới hạn trên nên không chặn).
- `adjustmentLayerAppliesToTrack(layer, trackIndex)` và
  `adjustmentLayersForClip(..., trackIndex?)`: không truyền trackIndex
  thì giữ nguyên hành vi cũ (chỉ lọc theo thời gian); có trackIndex thì
  lọc thêm theo scope. Thứ tự mảng = thứ tự áp (layer sau ở ngoài cùng);
  các layer chồng nhau về thời gian vẫn HỢP LỆ (nối filter tuần tự).
- Converter (không throw, trả `{ ok, value?, warnings?, reason? }`):
  - `legacyTrackClipToLayer(clip, trackIndex)`: nhận cả 3 hình dạng
    legacy — `filterType`/`intensity` (nestUtils), `filter`/`effects` và
    `adjustment` (nestedPreview) — gộp thành 1 filter entry, đặt
    `tracks: [trackIndex]`, `source: "legacy-track-clip"`.
  - `specLayerToLegacyTrackClip(layer)`: CHỈ khi layer có đúng 1 track;
    kết quả ok mang thêm `trackIndex` — caller PHẢI đặt clip legacy lên
    đúng track đó (clip legacy tự nó không mang trackIndex).
  - Converter KHÔNG bịa: thiếu thông tin filter, filterType/LUT lạ,
    trùng effect type, layer không-scope/đa-track, layer nhiều LUT hoặc
    nhiều color entry đều trả `ok: false` kèm lý do.

### Nested: `normalizeNestedClip` (`nested.ts`, export qua `index.ts` nhờ `export *` sẵn có)

- Shape cũ `tracks` trực tiếp → dựng `subSpec { version, meta, tracks }`:
  version = `opts.version` ?? `clip.version` ?? `"0.2.0"`;
  meta = `opts.meta` ?? `clip.meta` — **thiếu cả hai thì ok:false, KHÔNG
  bịa width/height/fps**.
- Cả `subSpec` và `tracks` cùng có: so sánh sâu (JSON). Bằng nhau → giữ
  subSpec, bỏ field tracks trùng lặp (ghi warning). Khác nhau → ok:false
  (fail fast, không tự chọn). Không so sánh được (tham chiếu vòng) →
  ok:false.
- Field `in` legacy → `trim { in, out: in + duration * speed }`
  (speed vắng = 1; đúng bất biến duration = (out − in) / speed).
  Đã có trim thì `in` phải khớp `trim.in` trong 1e-6, nếu không ok:false;
  khớp thì bỏ field `in` trùng lặp (ghi warning).
- Đệ quy cho nested clip con; vòng lặp tham chiếu theo chuỗi tổ tiên →
  ok:false; dùng lại cùng tracks/subSpec ở clip anh em là hợp lệ.
- Không mutate input (copy nông track/clip; clip lá giữ nguyên tham chiếu
  như `flattenNested`). Track thiếu id → gán `track-<index>` + warning;
  track thiếu kind → mặc định `"video"` + warning (cùng fallback mà
  nestedPreview dùng).
- Normalize CHỈ thống nhất shape, KHÔNG validate đầy đủ: kết quả vẫn cần
  qua `validateNestedClip()` trước khi tin dùng.

## Chưa hỗ trợ / giới hạn còn lại (đọc trước khi dùng đợt 7 vào project thật)

- **Scope `tracks` mới chỉ ở tầng spec + validate.** Render worker
  (`server/render/src/adjustment.js`, mirror viết tay — luồng này KHÔNG
  sửa theo phân công) và preview hiện vẫn áp layer cho mọi track như ngữ
  nghĩa R2 cũ. **Chưa được dùng layer có `tracks` trong project thật cho
  tới khi chủ sở hữu 2 tầng đó cập nhật**, nếu không layer scope hẹp sẽ
  bị áp rộng hơn ý định. `source` cũng chưa được render/preview đọc
  (không ảnh hưởng ngữ nghĩa, chỉ truy vết).
- **Chiều spec → legacy là mất mát có chủ ý** với layer phức tạp:
  layer nhiều LUT, nhiều color entry, hoặc trùng effect type giữa các
  filter entry thì không chuyển được (ok:false). Legacy shape chỉ mang
  nổi 1 LUT + 1 color + 1 danh sách effects. Round-trip legacy → spec →
  legacy giữ nguyên filterType/intensity/vị trí cho shape nestUtils, nhưng
  chiều ngược có thêm field `effects` mirror (cùng 1 effect) để reader
  kiểu nestedPreview cũng đọc được — đó là làm giàu có chủ ý, không phải
  filter khác.
- **Normalize làm rơi field preview-only, nhưng liệt kê trong warnings:**
  `opacity`, `transitionIn`, `transitionOut` không có chỗ trong
  `NestedClip` chuẩn. Caller PHẢI đọc `warnings` nếu cần biết phần nào đã
  rơi; không lặng lẽ mất nhưng cũng không giữ được.
- **Normalize không sửa lỗi nội dung:** clip đã normalize vẫn có thể
  fail `validateNestedClip()` (trim.out vượt subSpec, duration không khớp
  trim/speed, độ sâu vượt 8, subSpec thiếu meta hợp lệ khi shape chuẩn
  giữ nguyên subSpec gốc). Normalize và validate là 2 bước riêng.
- **Gap có sẵn, không phải do đợt 7 gây ra, nhưng ảnh hưởng tới đợt 7:**
  `packages/video-spec/src/index.js` (output cũ) hiện KHÔNG có dòng
  `export * from "./adjustment.js"` dù `index.ts` đã có từ R2 — kiểm
  chứng: `import` từ `index.js` thì `normalizeNestedClip` có (nhờ dòng
  export nested sẵn có) nhưng các hàm adjustment (kể cả converter mới)
  là `undefined`. JS consumer muốn dùng adjustment phải import trực tiếp
  `adjustment.js` cho tới khi `index.js` được regenerate từ `index.ts`
  (việc này ngoài phân công luồng U1: cấm sửa tay `index.js` output cũ).
- **Không làm trong đợt này (thuộc luồng khác):** UI panel ghi layer có
  `tracks`; render/preview đọc scope; migration tự động project cũ chứa
  clip legacy trong `track.clips` (converter chỉ là hàm thuần, chưa có
  bước migration nào gọi nó khi load project); chuyển đổi ngược nested
  chuẩn → shape tracks trực tiếp (không cần: shape cũ chỉ để đọc vào,
  không phải đích xuất).

## Cách chạy test lại

```bash
cd packages/video-spec
# adjustment (25 test: 13 cũ + 12 mới đợt 7)
npx tsc src/index.ts src/adjustment.test.ts \
  --outDir /tmp/adj-spec-test --module nodenext --target es2022 \
  --moduleResolution nodenext --skipLibCheck
node --test /tmp/adj-spec-test/adjustment.test.js
# nested (49 test: 37 cũ + 12 mới đợt 7)
npx tsc src/nested.ts src/nested.test.ts --outDir /tmp/nested-test \
  --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck
node --test /tmp/nested-test/nested.test.js
# mirror JS trong repo (không qua tsc): xem /tmp/u1-mirror-smoke.mjs
# (normalize + converter + scope trên chính file .js trong src)
```

## File của luồng U1 (tương đối từ repo root)

- `packages/video-spec/src/adjustment.ts` (sửa: tracks/source, validate
  có trackCount, scope cho adjustmentLayersForClip, converter 2 chiều)
- `packages/video-spec/src/adjustment.js` (sửa: regenerate bằng tsc từ
  adjustment.ts, chỉ file này được copy từ output — các file .js khác
  trong output tsc bị bỏ, không ghi đè)
- `packages/video-spec/src/adjustment.test.ts` (sửa: thêm section D/E/F)
- `packages/video-spec/src/nested.ts` (sửa: thêm normalizeNestedClip)
- `packages/video-spec/src/nested.js` (sửa: viết tay normalizeNestedClip
  khớp nested.ts — file này vốn là mirror viết tay, không qua tsc)
- `packages/video-spec/src/nested.test.ts` (sửa: thêm section normalize)
- `packages/video-spec/src/U1_LIMITS.md` (mới, chính file này)

Không đụng tới: `index.ts`, `index.js` (output cũ, đang thiếu export
adjustment — xem gap ở trên), `server/render/src/adjustment.js`
(mirror render), preview, UI, i18n, paths-loop (parent stage sau).

# Phase 9 — Đợt 58, luồng O2: Verify reload làm mất media mẫu (§6.1b đợt 57) — LIMITS

Ngày: 07/11/2026 (~18:40–19:00 +07, lượt cron 18:35 +07).
Phạm vi: đóng nợ đợt 57 §6.1(b) — quan sát của N9: sau reload, autosave
khôi phục spec nhưng **mất media mẫu** (media bin trống, 2 clip video mẫu
biến mất, chỉ còn clip chữ). Quan sát chưa kết luận bug, cần verify bằng
reload sạch có chủ đích. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Quan sát §7 N9 (reload làm mất media mẫu) | **KHÔNG tái hiện được bằng reload sạch.** Reload có chủ đích khôi phục đủ media mẫu (A1 PASS). |
| Cơ chế của quan sát N9 | **Đã giải thích bằng số đo thật:** autosave lúc reload mang spec đã xóa hết clip video (trạng thái cuối N7), và rehydrate chỉ nạp media mà spec còn tham chiếu (thiết kế S5) — bin trống là đúng thiết kế, bytes mẫu vẫn còn nguyên trong IndexedDB (A2 PASS). Không phải mất dữ liệu, không phải bug rehydrate. |
| Bug thật tìm thấy (kề bên, cùng khu vực) | **Media mẫu trong phiên thiếu `file`:** `buildSampleProject` dựng MediaItem mẫu không gắn `file`, nên ExportPanel coi mau-*.webm là thiếu (render báo lỗi missingMedia), nút Proxy/reframe cũng ẩn — cho tới khi user reload trang (rehydrate mới dựng File). **Đã sửa tối thiểu ở `sample.ts` (1 dòng + comment).** |
| Fix | `sample.ts`: gắn `file: new File([blob], name, { type: blob.type })` cho mỗi media mẫu — đồng nhất với item sau rehydrate. |
| Test | Harness headed mới 5/5 PASS sau fix (trước fix 4/5 — A0 đỏ đúng chỗ thiếu `file`). Rehydrate unit 27/27, vite build pass, tsc sạch với file O2. |

## 1. Verify bằng reload sạch có chủ đích — kết quả đo thật

Harness mới: `apps/web/scripts/clicktest-58o2-autosave-sample-reload.mjs`
(vite dev HMR tắt + Chromium headed qua Xvfb display :161 + CDP, Node
thuần, theo mẫu N9; profile Chrome mới tinh — localStorage + IndexedDB
trống; display :159 ban đầu đụng X server khác nên đổi sang :161).
Chạy 2 lượt: lượt 1 (trước fix) 4/5, lượt 2 (sau fix) 5/5.
Report JSON: `hidden_files/round58-o2/headed/o2-headed-report.json`.

| Case | Lượt 1 (trước fix) | Lượt 2 (sau fix) | Chi tiết (lượt 2) |
|---|---|---|---|
| A0 setup: mẫu tự load + autosave + manifest mẫu đủ | **FAIL** | PASS | 3 clip (v1 [0–4, 4–8], t1 [0.5–5.5]), media bin 2 item mau-1.webm/mau-2.webm (file thật 284011/414488 byte, blob: URL), autosave envelope chứa cả 2 src, IDB manifest mẫu = 2 |
| A1 reload sạch: media mẫu còn đủ sau reload | PASS | PASS | Bin 2 item (file thật 284011/414488 byte, blob: URL, assetId có), timeline 2 video + 1 chữ, missingAssets=null, không panel Relink, 2 media-card DOM, reload 5310ms |
| A2 xóa 2 clip video rồi reload (cơ chế §7) | PASS | PASS | Timeline chỉ còn 1 clip chữ, bin 0 (hiện "Chưa có file nào"), NHƯNG manifest mẫu trong IndexedDB vẫn đủ 2 (mau-1.webm:284011B, mau-2.webm:414488B) → bytes không mất; reload 3412ms |
| A3 loadSample lại + reload: media tự hồi phục | PASS | PASS | loadSample lại 8890ms → 3 clip + bin 2 item; reload lần 2 → bin lại đủ 2 item (file thật, blob: URL), missingAssets=null |
| H9 0 lỗi trang | PASS | PASS | Không có window.onerror/unhandledrejection trong cả phiên (gộp qua 3 lần reload) |

Screenshot từng case: `hidden_files/round58-o2/headed/o2-a0..a3-*.png`.
Screenshot A1 xác nhận bằng mắt: bin hiện 2 card mau-1/mau-2.webm có
thumbnail, timeline đủ 2 clip video + 1 clip chữ, toast "Khôi phục
autosave, có lưu ý: Đã điền style mặc định cho 1 text clip…" (cùng toast
như N9 §7), topbar "Autosave 11:40:40".

### 1.1 Vì sao quan sát N9 không phải bug rehydrate

Chuỗi sự kiện lượt 2 của N9 (đối chiếu log + LIMITS N9 §4, §7):

1. N7 multiselect + delete xóa cả 2 clip video → spec chỉ còn 1 clip chữ.
2. Autosave debounce 5s ghi spec này (0 src video) vào localStorage.
3. HMR invalidate `preview.tsx` → full page reload đúng lúc N8 vừa split.
4. App khởi động: `loadAutosave` → spec 0 video clip → `rehydrateMediaItems`
   quét spec, `collectMediaSrcs` trả `[]` → 0 candidate → bin trống.

Đây là hành vi đúng thiết kế S5: rehydrate nạp lại media bin **từ spec**
(`rehydrate36S5.ts`: plan theo src trong spec, khớp manifest theo
originalName/`asset:`). Spec không tham chiếu media nào thì bin trống —
dù bytes vẫn nằm trong IndexedDB. A2 đo trực tiếp: sau xóa + reload,
manifest mẫu trong IndexedDB vẫn đủ 2 (kích thước byte khớp trước/sau
reload), chứng minh không có mất mát dữ liệu nào; chỉ là bin không hiện
media không còn được spec dùng tới.

Hệ quả thiết kế (ghi nhận, không sửa trong luồng này): media user import
rồi xóa hết clip khỏi timeline cũng biến mất khỏi bin sau reload, dù
bytes còn trong IndexedDB. Muốn giữ bin độc lập với spec thì cần đổi
thiết kế rehydrate (nạp toàn bộ manifest, không chỉ src trong spec) —
quyết định của parent, xem §5.2.

### 1.2 Điều kiện đã thử (để kết luận "không tái hiện được" có nghĩa)

- Profile Chrome mới tinh (localStorage + IndexedDB trống hoàn toàn).
- Project mẫu tự load lúc mount (không gọi `loadSample` bằng tay ở A0/A1).
- Chờ autosave ghi xong rồi mới reload (poll envelope chứa cả 2 src mẫu).
- Reload sạch bằng CDP `Page.reload` (không HMR, không sửa file giữa chừng).
- Vite dev HMR tắt (config tạm `/tmp/round58-o2/vite.o2.config.mjs`,
  harness tự tạo lại — `/tmp` mất sau reboot như N9 §9.3).
- Kiểm tra cả 3 mặt: state store (`media`, `missingAssets`), DOM
  (`.media-card`, `.media-empty`), và IndexedDB thật (manifest + size).
- Boot-marker `__o2boot` xác nhận không có reload lén giữa chừng ở A1/A3.

## 2. Bug thật tìm thấy: media mẫu trong phiên thiếu `file`

### 2.1 Triệu chứng đo được (lượt 1, A0 đỏ)

Sau khi mẫu tự load (chưa reload), `useStore.getState().media`:

```json
[
  {"name":"mau-1.webm","kind":"video","hasFile":false,"fileSize":null,"urlBlob":true,"assetId":"a_360c475a0a103c3d"},
  {"name":"mau-2.webm","kind":"video","hasFile":false,"fileSize":null,"urlBlob":true,"assetId":"a_e256bd3049b512ec"}
]
```

Trong khi sau reload + rehydrate, cùng 2 item có
`hasFile=true, fileSize=324096/327952` (lượt 1) — tức item trong phiên
và item sau reload **không đồng nhất**.

### 2.2 Nguyên nhân gốc

`sample.ts` `buildSampleProject`: blob mẫu đã có sẵn trong tay (vừa ghi
bằng MediaRecorder, vừa ingest vào AssetStore), nhưng `media.push(...)`
không gắn `file` — chỉ có `url` (object URL), `thumbnail`, `assetId`.
Trong khi `rehydrate36S5.ts` dựng lại MediaItem bằng
`new File([blob], originalName, …)` nên item sau reload có `file`.

### 2.3 Tác hại thật (đọc code, khớp với triệu chứng)

- `ExportPanel.tsx:438–449` `collectMediaFiles`: media không có `file`
  → rơi vào `missing[]`; `startRender` (dòng 506–509) chặn render và
  báo lỗi `exportPanel.missingMedia` liệt kê mau-1.webm, mau-2.webm.
  **Tức là export project mẫu ngay sau khi mở app (chưa reload lần nào)
  sẽ báo thiếu media** — user phải reload trang một lần thì export mới
  chạy. Đây là lỗi trải nghiệm đầu tiên user gặp, không phải lỗi góc.
- `MediaBin.tsx:99` nút "Proxy 720p" chỉ hiện khi `item.file` có —
  trong phiên đầu nút này ẩn với clip mẫu (sau reload mới hiện).
- `ExportPanel.tsx:89` ReframeSection lọc `m.file` — clip mẫu không
  vào được danh sách reframe trong phiên đầu.
- `lib/proxy.ts:87,118` + `reverseWebcodecs.ts` dùng `item.file.size`
  làm kích thước gốc — với mẫu trong phiên sẽ rơi về nhánh undefined.

### 2.4 Sửa tối thiểu (sample.ts, 1 dòng + comment)

```ts
file: new File([blob], `mau-${variant + 1}.${ext}`, { type: blob.type }),
```

- Cùng bytes với blob đã ingest (không copy thêm, không đổi tên/mime).
- Áp dụng cho cả 2 nhánh: video ghi bằng MediaRecorder và fallback
  `stillSample` PNG (blob.type lúc đó là `image/png`).
- Không đổi format spec, không đổi đường ingest/prune, không đổi
  rehydrate — item trong phiên nay đồng nhất với item sau rehydrate.

### 2.5 Đỏ-trước / xanh-sau

- Đỏ: lượt 1 A0 FAIL đúng assert `hasFile && fileSize > 0`
  (media mẫu `hasFile:false`, trong khi manifest + autosave đều đủ).
- Xanh: lượt 2 A0 PASS — file thật 284011/414488 byte
  (kích thước khác lượt 1 vì MediaRecorder ghi bytes khác nhau mỗi lần,
  đúng như comment trong `sample.ts` về dedup).
- Hồi quy: `rehydrate36S5.test.ts` 27/27 pass; `vite build` pass
  14.22s (sau fix); `tsc` apps/web: 0 lỗi trong file O2 đụng tới.

## 3. Nợ mở

1. **Thiết kế bin theo spec (§1.1):** media import rồi xóa hết clip
   khỏi timeline sẽ biến mất khỏi bin sau reload (bytes còn trong
   IndexedDB). Muốn bin giữ media độc lập với spec thì đổi rehydrate
   sang nạp toàn bộ manifest — quyết định của parent, không làm lén.
2. **Toast "đã điền style" lặp lại mỗi lần reload:** screenshot A1 vẫn
   hiện toast "Đã điền style mặc định cho 1 text clip thiếu style…
   — lưu lại file để hoàn tất" dù autosave đã được ghi lại ở đợt 32 O6.
   Không điều tra trong luồng này (ngoài phạm vi), ghi nhận để đợt sau
   xem có phải seed autosave vẫn thiếu style không.
3. **tsc có 9 lỗi ở file test của luồng khác cùng đợt 58**
   (`gopTrialDecode58O6.test.ts` TS5097, `failsoftSurface58O3.test.ts`
   TS2352/TS2345) — không phải file O2, không sửa; các luồng đó tự
   thêm tsconfig exclude / sửa type của mình.
4. **Harness dùng config tạm trong `/tmp`:** `/tmp/round58-o2/`
   mất sau reboot — lượt sau chạy lại harness sẽ tự tạo lại config
   (harness đã tự tạo ở bước khởi động, không cần tạo tay như N9).

## 4. Môi trường chạy (lượt 2)

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1248`
  (headed qua Xvfb display riêng `:161`, 1440×900).
- Vite dev cổng 5390, CDP debug 9490, TMPDIR `/tmp/round58-o2/tmp`.
- Lệnh chạy (từ gốc repo):
  `O2_DISPLAY=:161 node apps/web/scripts/clicktest-58o2-autosave-sample-reload.mjs`
  — exit 0 khi 5/5 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Harness là `.mjs` (JS thuần) nên không chạy `tsc` cho file test
  (không áp dụng). Không sửa file sản phẩm ngoài `sample.ts` nên chỉ
  chạy lại `tsc`/`vite build` của app + test rehydrate liên quan.

## 5. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/sample.ts` | Sửa | Gắn `file: new File([blob], …)` cho media mẫu (1 dòng + comment O2) |
| `apps/web/scripts/clicktest-58o2-autosave-sample-reload.mjs` | Mới | Harness headed: A0/A1/A2/A3 + H9; reload sạch, đối chiếu IndexedDB, boot-marker, vite config tắt HMR tự tạo |
| `docs/PHASE9_ROUND58_O2_AUTOSAVE_SAMPLE_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round58-o2-autosave-sample.txt` — 3 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag. Bằng chứng chạy:
`hidden_files/round58-o2/headed/` (report JSON, vite/chrome log,
screenshot từng case).

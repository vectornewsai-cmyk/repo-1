# Phase 9 đợt 44 — luồng Z6: compat tiếp nối Y6 (i18n badge, badge = đường đã chọn, guard importFiles runtime, probe isConfigSupported)

Ngày: 04/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist vào batch. Mọi số trong đợt này đều đo dưới tải song song
(nhiều luồng đợt 44 chạy cùng lúc) — cấm dùng làm baseline quiet.

## 1. Phạm vi: đóng 4 nợ Y6 §7, và một đính chính ngữ nghĩa

Luồng này đóng các mục còn mở trong `docs/PHASE9_ROUND43_Y6_COMPAT_LIMITS.md`
§7: mục 6 (badge engine chưa qua i18n), mục 7 (guard `importFiles`
chưa có test runtime app-level), mục 8 (không probe `isConfigSupported`
trước `configure`), và mục 5 (badge = đường đã chọn).

Đính chính ngữ nghĩa cho mục 5 Y6 (đọc kỹ trước khi hiểu lầm): Y6 ghi
"badge = đường đã chọn, không phải đường vẽ từng frame" ở cột "hạn chế",
như thể đó là thiếu sót. Z6 xác định ngược lại: **badge báo đường đã
chọn LÀ ngữ nghĩa đúng theo yêu cầu đợt 44** ("badge = đường đã chọn,
không phải đường vẽ từng frame"). Code Y6 vốn đã lấy badge từ
`resolveReverseEngineDetailed()` (đường chọn theo capability), không
suy từ frame — nhưng hợp đồng đó chỉ nằm trong comment, không có hàm
riêng, không có test khóa. Z6 biến nó thành hợp đồng rõ ràng: hàm thuần
riêng + test lệch. Báo đúng từng frame (đọc trạng thái `failed` của
controller) là một tính năng khác, chưa làm, và vẫn ghi ở §6 — không
mạo nhận Z6 đã làm nó.

Không sửa hành vi happy-path nào: `resolveReverseEngine` cũ,
`resolveReverseEngineDetailed`, cổng S3, đường GOP Range, `importFiles`
đều giữ nguyên; Z6 chỉ thêm probe, tách badge, dời chuỗi sang i18n.

## 2. Các sửa (hunk nhỏ, marker `// ROUND44-Z6`, không reformat file)

### 2.1. Badge engine qua i18n (đóng nợ Y6 §7.6)

File: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`,
`apps/web/src/preview.tsx`.

- Thêm đúng 4 key mỗi bên dưới mục `reverseEngine` (đặt sau
  `decodeahead`, trước `speed`):
  - `badgeWebcodecs`: vi `◀ NGƯỢC: WEBCODECS`, en `◀ REVERSE: WEBCODECS`.
  - `badgeElementMissing`: vi `◀ NGƯỢC: ELEMENT (thiếu {api})`, en
    `◀ REVERSE: ELEMENT (missing {api})`.
  - `titleWebcodecs` / `titleElementMissing`: dời nguyên văn title cũ
    (vi) sang dict, viết mới bản en tương đương; title en cho
    webcodecs nói rõ badge báo đường đã chọn, không phải đường vẽ
    từng frame.
- `preview.tsx`: khối badge mỗi tick nay gọi
  `i18nT("reverseEngine.…", { api })` thay cho chuỗi hardcode.
  Grep sau sửa: không còn chuỗi badge cũ nào trong `preview.tsx`.
- Đếm lại i18n phẳng (test Z6 §1 tự đếm từ file thật, không ghi tay):
  **vi = en = 966 key** (đợt 42: 962/962; Z6 thêm đúng 4 key mỗi bên,
  2 tập key bằng nhau hoàn toàn, không key nào lệch).

### 2.2. Badge = đường đã chọn (đóng nợ Y6 §7.5 theo ngữ nghĩa §1)

File: `apps/web/src/lib/reversePlayback.ts`
(hàm mới `reverseEngineMissingApi` + `resolveReverseEngineBadge`),
`apps/web/src/preview.tsx` (dùng hàm mới).

- `resolveReverseEngineBadge(detailed, stepping)` là hàm thuần, CHỈ
  nhận đường đã chọn (`ReverseEngineDetail`) + cờ stepping. Nó cố
  tình KHÔNG có tham số nào về frame vừa vẽ (`wcFrame` null,
  controller failed, `drawVideoClip` rơi về element) — nên về mặt
  cấu trúc, badge không thể lệch theo frame.
- `preview.tsx` thay khối if/else cũ (tự map reason → tên API) bằng
  1 lời gọi hàm này + map kind → i18n key. Hành vi hiển thị không
  đổi khi frame vẽ đúng đường; chỉ khác ở trường hợp lệch (§3.2).
- Test lệch (§3.2) chứng minh: đường đã chọn webcodecs nhưng frame
  vẽ bằng fallback element → badge vẫn WEBCODECS, trong khi logic
  suy-từ-frame cũ (mô hình trong test, không phải code repo) sẽ cho
  ELEMENT — tức trường hợp lệch cũ nay đúng.

### 2.3. Guard `importFiles` khi IDB vắng — test runtime app-level (đóng nợ Y6 §7.7)

File mới: `apps/web/scripts/clicktest-round44-z6-compat-pipe.mjs`.
**Không sửa `store.ts`**: guard try/catch của Y6 (§4.4) đã đúng; việc
thiếu là bằng chứng runtime, và Z6 chỉ bổ sung bằng chứng đó.

- Mức test, ghi rõ để khỏi phóng đại: **headed Chromium thật, chạy
  `importFiles` THẬT từ bundle `store.ts` nguyên vẹn** (không phải
  test Node thuần, không phải stub store). Trước khi import store,
  trang test gỡ `window.indexedDB` (lần chạy này gỡ được bằng `delete`
  thuần — xem §3.3), rồi import store, gọi
  `useStore.getState().importFiles([File PNG 1×1 thật])`.
- Kết quả: `importFiles` resolve (không reject), media vào bin
  (`z6-test.png`), `typeof indexedDB` vẫn `"undefined"` lúc gọi, 0
  unhandled rejection. Đúng cam kết của guard Y6: chỉ mất bền vững,
  import trong phiên vẫn xong.
- Giới hạn trung thực của mức này: đây là store thật nhưng KHÔNG
  phải click-through UI đầy đủ của app (không bấm MediaBin, không
  chạy toàn bộ `App.tsx`); bước proxy tự động sau import của caller
  cũng không nằm trong test này. Ghi rõ để đợt sau khỏi tưởng đã đo
  hết đường import qua UI.

### 2.4. Probe `isConfigSupported` trước `configure` (đóng nợ Y6 §7.8)

File: `apps/web/src/lib/reverseWebcodecs.ts` (`decodeGop`).

- Trước khi dựng decoder: nếu
  `typeof VideoDecoder.isConfigSupported === "function"` thì await
  probe với đúng config sẽ dùng cho `configure` (codec, kích thước,
  description, `hardwareAcceleration` theo `preferHardware`).
  Probe trả `supported: false` → trả 0 ngay, KHÔNG dựng decoder
  (test đếm `constructorCalls = 0`).
- Khi API vắng (bản WebCodecs cũ, hoặc fake test không có static
  này) → bỏ qua probe, đi đường `configure` cũ; `configure` throw
  vẫn được bắt như Y6 (test đếm constructor/configure chạy đủ).
- Probe tự nó throw/reject → rơi xuống `configure`, KHÔNG đoán
  unsupported từ lỗi probe (vì `configure` mới là quyết định cuối).
- Lưu ý trung thực: probe chỉ biết codec/config có được hỗ trợ hay
  không, không chứng minh decode thật — caller vẫn khóa unsupported
  khi `decoded = 0` như cũ. Probe tốn thêm 1 async call mỗi cửa sổ
  GOP; ảnh hưởng hiệu năng chưa đo riêng (chỉ biết test vẫn pass,
  không có số ms — xem §6).

## 3. Số đo thật sau sửa

### 3.1. Test Node mới Z6: 10/10 pass

File: `apps/web/src/lib/reverseCompat44Z6.test.ts` (esbuild bundle ra
scratch ngoài repo, rồi `node` bundle — cùng cách chạy Y6):

- i18n: vi/en phẳng bằng nhau, 966/966, đủ 4 key `reverseEngine.*`,
  placeholder `{api}` còn nguyên ở cả 2 ngôn ngữ (2 test).
- Badge thuần: webcodecs + stepping → webcodecs; trường hợp lệch cũ
  (frame fallback element, đường chọn webcodecs) → vẫn WEBCODECS và
  khác kết quả logic suy-từ-frame cũ; thiếu từng API → đúng tên API;
  không stepping / opt-in tắt → null (4 test).
- Probe: `supported: false` → 0, constructor 0 lần; API vắng →
  constructor + configure chạy đủ; `supported: true` → dựng +
  configure, probe nhận đúng `codec` + `prefer-hardware`; probe throw
  → rơi xuống configure (constructor 1 lần) (4 test).

### 3.2. Hồi quy: Y6 + các bộ liên quan, tất cả xanh

- Y6 Node rerun: **11/11** (không đổi — fake VideoDecoder của Y6
  không có `isConfigSupported` nên đi đúng nhánh fallback của probe).
- Gate: `reversePreviewGate` — **12/12**.
- DecodeAhead: `reverseDecodeAhead` — **12/12** (chạy bằng
  `node --experimental-strip-types` theo đúng header file, vì esbuild
  bundle file này lỗi — không phải do Z6; xem ghi chú ở §6).
- U1: `reverseDecodeAheadToggle38U1` — **12/12**.
- T4: `reverseDecodeAheadToggle39T4` — **11/11**.
- Q2 legacy: `reversePlayback34Q2` — **4/4**.

### 3.3. Test headed Chromium: Z6 3/3 + Y6 rerun 5/5

- Script mới Z6 (`clicktest-round44-z6-compat-pipe.mjs`, Xvfb riêng,
  pipe CDP, mẫu Y6): **3/3 PASS** —
  F `importFiles` IDB vắng resolve + media vào bin,
  F2 0 unhandled rejection,
  G badge qua i18n: vi `◀ NGƯỢC: WEBCODECS`, en
  `◀ REVERSE: WEBCODECS`, en thiếu API
  `◀ REVERSE: ELEMENT (missing VideoDecoder)`.
  Phương pháp gỡ IDB ghi trong kết quả: `delete` thuần thành công
  (không cần `defineProperty`); `typeof indexedDB` sau gỡ là
  `"undefined"`, và vẫn `"undefined"` lúc gọi `importFiles`.
- Script Y6 chạy lại không sửa: **5/5 PASS** (A đủ API, B happy
  webcodecs, C caps thiếu, D xóa `VideoDecoder` thật → element, E
  opt-off). UserAgent vẫn bị cắt ở 80 ký tự như Y6 nên không suy
  version đầy đủ.
- `tsc --noEmit`: **0 lỗi ở mọi file Z6** (`reversePlayback.ts`,
  `reverseWebcodecs.ts`, `preview.tsx`, `i18n/*.json` qua bundle,
  `tsconfig.json`). Lần chạy cuối còn đúng 3 lỗi, TẤT CẢ thuộc file
  test của luồng khác cùng đợt 44 (`gopMoovHeader44Z4.test.ts`) —
  không thuộc phạm vi Z6, Z6 không sửa lén file của luồng khác.
  (Một lần chạy tsc giữa đợt còn thấy lỗi ở file test của luồng Z2
  khác; lần chạy cuối file đó đã hết lỗi — do luồng sở hữu tự sửa,
  không phải Z6.)
- `vite build`: pass (28,61 s dưới tải, chỉ cảnh báo chunk > 500 kB
  cũ). `dist/` KHÔNG đưa vào batch.
- `tsconfig.json`: thêm đúng 1 dòng exclude cho test Z6 (theo tiền
  lệ Y6: test dùng import `.ts`, tsc không bật
  `allowImportingTsExtensions`). JSON không ghi được comment nên
  dòng này không mang marker — ngoại lệ duy nhất, ghi rõ ở đây.

## 4. Ma trận tương thích — cập nhật từ Y6 §8 (chỉ tick mục đã đo thêm)

| Môi trường / mục | Trạng thái sau Z6 | Bằng chứng |
|---|---|---|
| Chrome/Chromium headed (VM, Xvfb riêng) | ✅ ĐÃ ĐO (giữ) | Headed Y6 rerun 5/5 + headed Z6 3/3 (§3.3) |
| Chrome/Chromium (logic Node) | ✅ ĐÃ ĐO (giữ) | Node Y6 11/11 + Z6 10/10 (§3.1–3.2) |
| Badge engine qua i18n | ✅ ĐÃ ĐO MỚI (Z6) | Node 966/966 + headed G vi/en (§3.1, §3.3) |
| Badge = đường đã chọn (trường hợp lệch) | ✅ ĐÃ ĐO MỚI (Z6) | Test lệch Node (§2.2, §3.1) |
| `importFiles` IDB vắng, mức runtime | ✅ ĐÃ ĐO MỚI (Z6) | Headed F/F2: store thật, IDB gỡ thật (§3.3) |
| Probe `isConfigSupported` 2 nhánh | ✅ ĐÃ ĐO MỚI (Z6) | Node: có/vắng API, false/true/throw (§3.1) |
| Firefox | ❌ CHƯA ĐO (giữ nguyên) | — |
| Safari | ❌ CHƯA ĐO (giữ nguyên) | — |
| Máy thật / màn hình vật lý | ❌ CHƯA ĐO (giữ nguyên) | — |
| Bridge Express route thật (GOP qua proxy) | ❌ CHƯA ĐO (giữ nguyên) | Nợ Y6, thuộc luồng sở hữu mảng đó |
| Tab ẩn | ❌ CHƯA ĐO (giữ nguyên) | Nợ đợt 42, không thuộc Z6 |

## 5. Danh sách file đổi/mới chính xác (9 file text, không binary/dist)

Đổi:
1. `apps/web/src/lib/reversePlayback.ts` — thêm
   `reverseEngineMissingApi` / `resolveReverseEngineBadge` (hunk
   ROUND44-Z6); hàm cũ không đổi.
2. `apps/web/src/lib/reverseWebcodecs.ts` — probe `isConfigSupported`
   trước `configure` ở `decodeGop`, dùng chung `decoderConfig` cho
   cả probe lẫn configure (hunk ROUND44-Z6).
3. `apps/web/src/preview.tsx` — badge dùng hàm thuần + i18n key
   (import có marker, khối tick, comment JSX; hết hardcode badge).
4. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test Z6
   (không marker được vì JSON — xem §3.3).
5. `apps/web/src/i18n/vi.json` — thêm mục `reverseEngine` (4 key).
6. `apps/web/src/i18n/en.json` — thêm mục `reverseEngine` (4 key).

Mới:
7. `apps/web/src/lib/reverseCompat44Z6.test.ts` — test Node 10/10.
8. `apps/web/scripts/clicktest-round44-z6-compat-pipe.mjs` — script
   headed Chromium 3/3.
9. `docs/PHASE9_ROUND44_Z6_COMPAT_LIMITS.md` — tài liệu này.

Không đổi (ghi rõ để parent khỏi tìm): `apps/web/src/store.ts` —
guard Y6 đã đúng, Z6 chỉ thêm bằng chứng runtime, không sửa code
guard. File dùng chung (`preview.tsx`, `tsconfig.json`) còn chứa
hunk của luồng khác cùng đợt 44 — đối chiếu theo marker.

## 6. Nợ còn lại trung thực (đợt sau có máy thật chỉ việc tick)

1. **Safari CHƯA ĐO, Firefox CHƯA ĐO, máy thật CHƯA ĐO**: giữ nguyên
   từ Y6 §7.1–7.3 — mọi suy luận về 2 trình duyệt này vẫn chỉ từ
   guard, chưa có bằng chứng thật nào.
2. **Badge báo đúng từng frame CHƯA LÀM**: Z6 khóa ngữ nghĩa badge =
   đường đã chọn; muốn badge đổi theo frame thực tế (controller
   failed → element) cần đọc trạng thái `failed` của controller
   trong badge — tính năng riêng, chưa làm, không mạo nhận.
3. **Badge đổi ngôn ngữ khi đang pause**: text badge cập nhật qua
   DOM mỗi tick (mẫu các badge khác); đổi lang lúc preview đang
   pause có thể giữ chuỗi ngôn ngữ cũ cho tới tick kế — cùng hạn
   chế mẫu badge cũ, chưa đo riêng.
4. **Chi phí probe chưa đo**: 1 async call `isConfigSupported` mỗi
   cửa sổ GOP; chưa có số ms, chưa biết có đáng kể trên footage
   cửa sổ ngắn hay không. Không crash, không đổi kết quả cuối.
5. **Headed `importFiles` chưa phải click-through UI đầy đủ**: xem
   §2.3 — chưa bấm MediaBin thật, chưa chạy `App.tsx` đầy đủ, chưa
   đo bước proxy tự động sau import của caller.
6. **Headed qua route bridge Express thật CHƯA ĐO**: giữ nguyên nợ
   Y6 (đợt 42 §5.5) — Z6 chỉ đo logic fallback và Chromium với
   module thuần/store bundle, không chạy GOP Range qua
   `/api/proxy/file/:name` thật.
7. **Ghi chú chạy test**: `reverseDecodeAhead.test.ts` phải chạy
   bằng `node --experimental-strip-types` (theo header file); bundle
   esbuild file này lỗi ở ký tự trong tên test — lỗi của công cụ
   với file cũ, không liên quan Z6, và bộ này vẫn 12/12 bằng cách
   chạy đúng của nó.

# Phase 9 — Đợt 64, luồng R6: Duplicate project-name registry — LIMITS

Ngày: 08/11/2026 (lượt cron 12:35 +07). Phạm vi: đóng nợ đợt 63 R7 §5 —
R7 đã khóa sổ tham chiếu theo `id:<uuid>` nhưng registry theo tên project
trùng nhau vẫn chưa xử lý. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Chuỗi lịch sử version | **Đã chuyển sang khóa theo projectId envelope.** Đổi tên project không còn đứt chuỗi (giới hạn v1 của Q7 đã hết); hai file trùng tên có hai chuỗi riêng — unit D1/D2 khóa hành vi. |
| Migration chuỗi legacy | **Đã triển khai + đo bằng test.** Mở file nhận chuỗi `file-<hash>-<tên>` cũ về id envelope khi hậu tố tên file khớp (adopt E1); chuỗi `proj-` không tự nhận (không có tín hiệu tên file). |
| Hiển thị trùng tên (panel Dọn kho) | **Đã triển khai + đo bằng test.** Tên duy nhất giữ trần; tên trùng kèm qualifier: 8 ký tự đầu projectId (bản ghi khóa id) hoặc ngày/giờ ghi (bản ghi legacy) — unit A2–A5 khóa. |
| `usedByOther` (asset bị project khác dùng) | **Hiển thị đã phân biệt** ở panel (tính từ `scan.registryProjects`); lib `idbCleanup61R9` giữ nguyên tên thô theo quy ước tự chứa của nó (xem §3.3). |
| Autosave / Recent / envelope / tên file xuất | **Kiểm chứng: không dùng tên làm khóa.** Autosave khóa cố định `vcut-studio:autosave:v1`; recent desktop khóa theo đường dẫn; tên chỉ là field/hậu tố tên file (xem §1). |
| Test | Unit mới 28/28 (chạy lại 2 lần); hồi quy: projectHistory 15/15, projectId63R7 27/27, idbCleanup61R9 16/16, projectAssetRefs62R7 28/28, projectRepo 10/10, saveToast31 15/15, loadProject54K1 7/7, store.idbCleanup61R9 + desktopMenuActions53J2 + desktopSaveAs53J4 xanh qua runner. |
| Headed | **7/7** (T0/H1–H5 + H9): adoption + đổi tên + trùng tên qua IndexedDB/localStorage thật, panel Lịch sử liệt kê đủ 4 hàng qua UI thật, 0 lỗi trang — xem §4.4. |
| tsc | **File của luồng này 0 lỗi** (sau khi gộp import `.ts` thành một dòng để `@ts-ignore` TS5097 phủ đúng dòng specifier — xem §4.5). Toàn repo còn 1 lỗi TS6133 ở file `fastMotion64R2.test.ts` của luồng R2 đợt 64 đang làm song song (không phải file luồng này, không sửa). |
| vite build | **Pass** (xem §4.3). |
| i18n | **Không cần key mới.** Qualifier phân biệt là id rút gọn / ngày ISO — trung lập ngôn ngữ. Không sửa vi.json/en.json, không tạo fragment. |

## 1. Kiểm kê đầy đủ: chỗ nào đã từng dùng TÊN làm khóa/định danh

| # | Chỗ | Dùng tên làm gì | Sau đợt này |
|---|---|---|---|
| 1 | Chuỗi lịch sử version (`projectHistory.ts`: `HISTORY_PROJECT_KEY` + `getCurrentProjectId` / `rotateProjectId` / `setProjectIdForFile`) | Khóa chuỗi = id legacy gắn với tên lúc tạo/mở: `proj-<time>-<rand>` (xoay mỗi lần tạo project mới) hoặc `file-<hash spec>-<tên file>` (đổi mỗi khi nội dung đổi). Đổi tên → chuỗi mới; sửa nội dung rồi mở lại → chuỗi mới (version cũ mồ côi). | **ĐÃ SỬA.** Lịch sử khóa theo `store.projectId` (envelope, đợt 63 R7). Ba hàm legacy deprecated, không còn caller production; chỉ còn đọc khóa legacy để migration một lần lúc mở file. |
| 2 | Sổ tham chiếu liên project (`projectRefs` trong AssetStore) — bản ghi legacy `name:<tên>` | Khóa sổ theo tên (đợt 62 R7). Hai file trùng tên chung một khóa. | R7 đã sửa đường ghi mới (khóa `id:`). Đợt này **không xóa/chuyển** bản ghi legacy (không phân biệt được bản ghi đó thuộc file nào — xóa là mất bảo vệ, đúng cảnh báo R7 §2.2). Chỉ sửa HIỂN THỊ: tên trùng kèm qualifier (§3.2). |
| 3 | Panel Dọn kho — mục sổ tham chiếu + trạng thái "Được project khác dùng" | Liệt kê bản ghi chỉ bằng tên; `usedByOther` khử trùng theo tên thô → hai project trùng tên hiện thành một mục. | **ĐÃ SỬA HIỂN THỊ.** Nhãn phân biệt qua `registryDisplayLabels` (§3.2). Ngữ nghĩa chặn xóa không đổi. |
| 4 | `deleteCleanupAsset` — `usedBy` khi từ chối `cross-project` | Trả về tên thô (khử trùng theo tên). | **KHÔNG SỬA.** `usedBy` không hiện ra UI (panel chỉ hiện số lượng đã xóa/bỏ qua); chỉ test assert nó. Ghi rõ để không ai tưởng đã sửa (xem §5.8). |
| 5 | Autosave (`projectRepo.ts`: `AUTOSAVE_KEY = "vcut-studio:autosave:v1"`) | Tên chỉ là field `name` trong envelope autosave; khóa là hằng cố định (một autosave duy nhất cho project đang mở). | Không đổi. Không có chuyện hai project trùng tên đè autosave của nhau (autosave luôn thuộc project đang mở; mở project khác thì ghi đè là đúng). |
| 6 | Recent list (desktop) | `noteProjectOpened(filePath)` — khóa theo ĐƯỜNG DẪN tuyệt đối, không theo tên. Menu recent của Electron cũng dùng path. | Không đổi. Hai file trùng tên ở hai thư mục là hai mục recent riêng. |
| 7 | Envelope `.vcut.json` / file JSON local | Tên là field `name` trong envelope; định danh file = đường dẫn + `projectId` (đợt 63 R7). | Không đổi. |
| 8 | Tên file xuất / archive (`saveProject`, `downloadArchive`, `defaultProjectFileName`) | Tên file suy từ `spec.meta.name` (chỉ là tên gợi ý lúc tải xuống). | Không đổi — tên file không phải định danh; hai file trùng tên vẫn là hai file khác nhau trên đĩa. |
| 9 | `projectKeyForName` (`projectAssetRefs62R7.ts`) | Sinh khóa `name:` cho bản ghi legacy. | Giữ nguyên cho đường ĐỌC legacy (panel + test). Không còn đường GHI mới nào dùng nó (đã kiểm chứng bằng grep: caller ghi đều dùng `projectKeyForId`). |

## 2. Thiết kế (a): lịch sử khóa theo projectId envelope

### 2.1 Đổi khóa

- `HistoryPanel`: `projectId = useStore((s) => s.projectId)` (đăng ký
  store, liệt kê lại khi đổi project) thay cho `getCurrentProjectId()`.
- `snapshotHistoryAfterSave` (đường lưu web + native): `saveVersion`
  dưới `useStore.getState().projectId` thay cho id legacy.
- `ProjectMenu.doNew` + `desktop.ts` case `new-project`: bỏ
  `rotateProjectId()` — `store.newProject()` đã xoay projectId envelope
  (đợt 63 R7), lịch sử đi theo id đó nên không cần xoay thêm một id nữa.
- `openProjectFileFlow`: bỏ `setProjectIdForFile` (không còn ai đọc
  khóa legacy sau khi mở); thay bằng `await adoptLegacyHistoryChain(
  res.projectId, file.name)` trước khi trả về — panel mở ngay sau đó
  liệt kê đủ chuỗi đã migration.
- Header `projectHistory.ts`: giới hạn v1 "đổi tên bắt đầu chuỗi mới"
  được đánh dấu ĐÃ HẾT (giữ dòng cũ làm lịch sử quyết định).
- Ba hàm legacy (`getCurrentProjectId`, `rotateProjectId`,
  `setProjectIdForFile`) giữ export + ghi DEPRECATED: không còn caller
  production nào (đã kiểm chứng bằng grep toàn `src`, kể cả test —
  không file test nào dùng chúng), chỉ `adoptLegacyHistoryChain` còn
  đọc khóa legacy qua `readLegacyHistoryProjectId()` (đọc không ghi,
  khác `getCurrentProjectId` ở chỗ không xoay id mới khi vắng).

### 2.2 Migration chuỗi legacy (`HistoryStore.migrateVersions`)

- Đổi khóa toàn bộ version từ `fromProjectId` sang `toProjectId`
  (đích phải là id envelope hợp lệ — lạ thì throw, lỗi caller).
- Id version mới XÁC ĐỊNH: `${to}@${createdAt}-${hash}` (xem
  `migratedVersionId`) thay vì ngẫu nhiên — hai lượt migration chồng
  nhau (2 tab cùng mở một file) put cùng một hàng nên hội tụ, không
  nhân đôi (unit C5 khóa). `parentId` remap theo cùng bảng; cha ngoài
  batch (đã bị prune trước đó) giữ nguyên, dangling như hành vi prune cũ.
- Hàng cũ chỉ xóa SAU khi hàng mới put xong → lỗi giữa chừng không mất
  version; lần migration sau chạy lại sẽ hội tụ.
- Gộp vào chuỗi đích đã có version thì xen kẽ theo `createdAt` — đúng
  theo thời gian, mỗi version giữ nguyên parent chain của nó (unit C6).
- Va chạm id xác định chỉ khi hai version trùng cả `createdAt` lẫn
  hash spec — `saveVersion` đã khử trùng hash với version mới nhất nên
  thực tế không xảy ra (xem §5.2).

### 2.3 Luật nhận chuỗi (`shouldAdoptLegacyChain` — pure, test được)

Chỉ nhận chuỗi `file-<hash>-<tên>` KHI hậu tố tên file (đã sanitize y
hệt `setProjectIdForFile`) khớp tên file đang mở. Hash đầu đổi theo nội
dung nên không so được — hậu tố tên là tín hiệu quy kết duy nhất còn
lại. Không nhận khi: không có khóa legacy; legacy là `proj-` (không có
tín hiệu tên file); không có tên file (đường autosave-restore / panel);
hậu tố không khớp. Sau khi nhận (kể cả chuỗi nguồn rỗng — con trỏ đã
chết), khóa legacy bị xóa để lần mở sau không nhận nhầm sang file khác
cùng tên. Lỗi giữa chừng → KHÔNG xóa khóa, lần mở sau thử lại (hội tụ
nhờ id xác định). `adoptLegacyHistoryChain` không bao giờ throw — lỗi
kho chỉ trả `reason: "error"` để đường mở file không gãy vì lịch sử.

## 3. Thiết kế (b): hiển thị phân biệt tên trùng

### 3.1 `registryDisplayLabels` (`lib/projectNameRegistry64R6.ts`, thuần)

- Tên duy nhất trong danh sách → nhãn trần, không thêm gì (không gây
  nhiễu cho trường hợp thường).
- Tên xuất hiện ≥2 lần → `Tên · qualifier`:
  - bản ghi khóa id → 8 ký tự đầu projectId (lấy từ field `projectId`,
    rơi về khóa `id:` khi field vắng);
  - bản ghi legacy khóa tên (không có id) → ngày/giờ ghi `YYYY-MM-DD
    HH:mm` (cắt từ `updatedAt` ISO, không phụ thuộc locale);
  - không có cả hai → `"legacy"` (trung lập ngôn ngữ).
- Hai qualifier không bao giờ giống nhau về hình thức (hex ngắn vs
  ngày) nên luôn phân biệt được; unit A2–A5 khóa.

### 3.2 Nối vào panel Dọn kho

- Mục sổ tham chiếu: mỗi hàng dùng nhãn từ `registryDisplayLabels`
  (tính trên toàn bộ sổ) thay cho tên thô.
- Trạng thái "Được project khác dùng": panel tự tính từ
  `scan.registryProjects` (đã có sẵn trong kết quả quét) + lọc đúng
  như lib (loại project hiện tại theo khóa) rồi map qua cùng bảng nhãn
  — thay cho `row.usedByOther` (tên thô, khử trùng theo tên). Rơi về
  tên thô khi sổ rỗng (đọc sổ lỗi). Thuộc tính
  `data-used-by-other` cũng mang nhãn mới (headed test đọc nó vẫn thấy
  tên trần khi tên duy nhất — không đổi hành vi cũ).
- Tính nhãn trên TOÀN BỘ sổ (kể cả project hiện tại) để tên trùng với
  chính project hiện tại vẫn được gắn qualifier (nếu chỉ tính trên tập
  đã lọc thì tên đó thành duy nhất → hiện trần → nhầm với project hiện tại).

### 3.3 Vì sao không sửa `usedByOther` trong lib

`idbCleanup61R9.ts` có quy ước tường minh "KHÔNG import value từ file
anh em" để chạy độc lập dưới Node type-stripping. Nhãn phân biệt sống
ở module mới; nhét nó vào lib sẽ phá quy ước đó (hoặc phải nhân đôi
logic — drift). Panel đã có đủ dữ liệu (`registryProjects`) để tính
nhãn nên lib giữ nguyên tên thô: `inUse` và chặn xóa vẫn đúng (khóa
theo key, không theo tên), chỉ hiển thị là việc của panel. `usedBy`
của `deleteCleanupAsset` cũng giữ tên thô vì không hiện ra UI (§1 #4).

## 4. Kiểm chứng (số thật)

### 4.1 Unit mới `apps/web/src/lib/projectNameRegistry64R6.test.ts` — 28/28 (chạy 2 lần)

Chạy: `node apps/web/src/lib/projectNameRegistry64R6.test.ts` (~2 s).

- A. Nhãn hiển thị (7): tên duy nhất trần (A1); 2 bản ghi id trùng tên
  → nhãn khác nhau kèm 8 ký tự đầu id (A2); id + legacy cùng tên →
  legacy mang ngày ghi (A3); 3 bản ghi trùng tên → 3 nhãn phân biệt
  (A4); legacy không updatedAt → qualifier "legacy" (A5); rỗng / trùng
  khóa (A6); helper short/projectIdFromKey/qualifier (A7).
- B. Nhận diện chuỗi legacy (3): sanitize khớp đúng `setProjectIdForFile`
  (B1 — lần chạy đầu fail do tôi tính tay sai chuỗi kỳ vọng: cụm "ự á"
  là một run nên chỉ một `_"; đã sửa expectation, code không đổi); hậu
  tố tên khớp kể cả khi hash đổi (B2); chỉ nhận file- khớp tên, từ chối
  proj-/UUID/thiếu tên/khác tên (B3).
- C. migrateVersions qua MemoryBackend thật (7): chuyển đủ 2 version,
  remap parentId, hàng cũ biến mất, id theo công thức xác định (C1);
  from===to no-op (C2); đích lạ throw (C3); nguồn rỗng moved 0 (C4);
  2 lượt chồng nhau không nhân đôi đích + chạy lại idempotent (C5);
  gộp vào chuỗi đích có sẵn → đủ 3 (C6); kiểm tra id envelope (C7).
- D. Đổi tên + trùng tên (3): đổi tên rồi snapshot tiếp → cùng chuỗi
  2 version, summary có dòng đổi tên (D1 — lỗi gốc của luồng); hai
  project trùng tên khác id → hai chuỗi riêng, không lẫn clip (D2);
  restore sau đổi tên trả đúng spec tên mới (D3).
- E. adoptLegacyHistoryChain với localStorage giả inject qua deps (8):
  nhận file- khớp tên → moved 2 + xóa khóa (E1); khác tên → không
  nhận, chuỗi + khóa còn nguyên (E2); proj- → không nhận (E3); không
  có khóa (E4); legacy === envelope (E5); envelope lạ (E6); chuỗi rỗng
  nhưng quyết định nhận → adopted, khóa vẫn bị xóa (E7); store lỗi →
  reason error, khóa KHÔNG bị xóa để thử lại (E8).

### 4.2 Hồi quy + build (chạy lại sau mọi sửa)

- projectHistory 15/15, projectId63R7 27/27, idbCleanup61R9 16/16,
  projectAssetRefs62R7 28/28, projectRepo 10/10, saveToast31 15/15,
  loadProject54K1 7/7 (chạy trực tiếp Node).
- store.idbCleanup61R9 + desktopMenuActions53J2 + desktopSaveAs53J4
  xanh qua `scripts/run-node-test.mjs` (ALL PASS).
- `tsc` apps/web: **file của luồng này 0 lỗi** (xem §4.5); toàn repo
  còn 1 lỗi TS6133 ở file của luồng R2 đợt 64 đang làm song song.
- `vite build` apps/web: **pass** (66 s, chỉ cảnh báo chunk >500 kB có sẵn).

### 4.4 Headed `apps/web/scripts/clicktest-64r6-project-name-registry.mjs` — 7/7

Chạy: `node apps/web/scripts/clicktest-64r6-project-name-registry.mjs`
(~48 s). Chromium headed qua Xvfb display :176, vite dev cổng 5640,
CDP 9740, profile mới tinh. Report JSON + 1 screenshot:
`hidden_files/round64-r6/headed/`.

| Case | Kết quả đo (lượt chạy 08/11 ~06:19 UTC) |
|---|---|
| T0 setup | App mount xong; projectId envelope thật `4d842968-...-660695` (UUID) |
| H1 adoption thật | Seed 2 version dưới chuỗi legacy `file-abcdef123456-Ki_m_tra_headed_vcut_json` + đặt khóa vào localStorage → adopt về appProjectId: **moved 2, đích 2, nguồn 0, khóa legacy đã xóa** (IndexedDB + localStorage thật) |
| H2 đổi tên (IDB thật) | Chuỗi app đủ **4 version** (2 adoption + 2 đổi tên), có dòng đổi tên trong summary |
| H3 trùng tên (IDB thật) | E1 2 version [0,2 clip], E2 1 version [1 clip] — hai chuỗi riêng, không lẫn |
| H4 nhãn (trong trình duyệt) | `"Trùng tên · 11111111"` vs `"Trùng tên · aaaaaaaa"`; tên duy nhất trần `"Duy nhất"` |
| H5 UI thật | Bấm nút "Lịch sử" → panel liệt kê **4 hàng**, có hàng đổi tên (screenshot `history-panel.png`) |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection trong suốt phiên |

Lưu ý: H1–H3 chạy qua `HistoryStore` thật trong trang (IndexedDBBackend
+ localStorage thật), không phải MemoryBackend như unit test — đây là
phần unit test không đo được. H5 đọc số hàng từ DOM thật của panel.

### 4.5 Một lỗi tsc bắt được trong lúc làm (đã sửa, đúng quy ước có sẵn)

Import đuôi `.ts` trong `projectHistory.ts` (`./projectNameRegistry64R6.ts`)
bị TS5097. Kiểm chứng: codebase đã có 8 import `.ts` tương tự, TẤT CẢ
đều mang `// @ts-ignore` kèm ghi chú "TS5097, đuôi .ts cho strip-types"
(vd `nestedPreview.ts`, `previewEngine.ts`) — vite và Node strip-types
resolve được đuôi `.ts`, chỉ tsc cần bỏ qua. Đã thêm đúng mẫu đó vào
import mới (đọc cả implementation `shouldAllowImportingTsExtension` /
`loadModuleFromFile` trong `typescript@5.6.3` để xác nhận, không đoán).
Chi tiết đáng ghi: lần sửa đầu vẫn lỗi vì import viết NHIỀU DÒNG —
`@ts-ignore` chỉ phủ dòng ngay sau nó (`import {`), còn lỗi TS5097 gắn
vào dòng chứa specifier (`} from "..."`). Đã gộp import thành MỘT DÒNG
để `@ts-ignore` phủ đúng dòng lỗi. Sau sửa: file của luồng này 0 lỗi
tsc (xem §4.2).
Lưu ý: lần chạy tsc cuối còn 1 lỗi TS6133 ở
`src/components/enhance/fastMotion64R2.test.ts` — file của luồng R2 đợt
64 đang làm song song, không phải file của luồng này, không sửa.

## 5. Nợ mở / giới hạn (trung thực)

1. **Nhận nhầm khi hai file khác nhau cùng tên file (khác thư mục).**
   Luật nhận chỉ so hậu tố tên file (§2.3) — lần nhận đầu tiên có thể
   gộp chuỗi lịch sử của file kia vào project đang mở. Cửa sổ này chỉ
   mở với chuỗi legacy tạo TRƯỚC đợt này, và đóng ngay sau lần nhận đầu
   (khóa legacy bị xóa). Version gộp nhầm vẫn khôi phục được (restore
   snapshot trạng thái hiện tại trước khi ghi đè) nên là nhầm hiển thị /
   chuỗi, không mất dữ liệu. Không có cách quy kết chắc hơn từ dữ liệu
   legacy còn lại (hash đổi theo nội dung, tên đổi được).
2. **Id version xác định va chạm khi trùng cả `createdAt` lẫn hash.**
   Hai version cùng ms + cùng hash spec sẽ chung id migration (put sau
   ghi đè put trước — nội dung gần như giống hệt vì cùng hash). `saveVersion`
   đã khử trùng hash với version mới nhất nên thực tế không xảy ra;
   nếu xảy ra thì chỉ mất một bản snapshot trùng nội dung, không mất
   version khác.
3. **Chuỗi legacy phân mảnh cũ hơn không được nhận.** Chỉ chuỗi mà
   `HISTORY_PROJECT_KEY` đang trỏ tới mới được nhận; các chuỗi
   `file-<hash cũ>-<tên>` từ những lần mở trước đó (mỗi lần sửa nội
   dung rồi mở lại là một chuỗi mới dưới code cũ) vẫn nằm trong IndexedDB
   dưới id cũ, không liệt kê trong panel. Dữ liệu không mất (còn trong
   DB) nhưng chưa có UI nhận thủ công — việc cho đợt sau nếu cần.
4. **Chuỗi `proj-` (project mới chưa từng lưu file) không tự nhận.**
   Không có tín hiệu tên file nên không quy kết được an toàn; version
   của nó ở lại IndexedDB dưới id cũ, không liệt kê. Cùng hướng xử lý
   với §5.3 (UI nhận thủ công trong tương lai, nếu user cần).
5. **Đường khôi phục autosave không nhận chuỗi legacy** (không có tên
   file để quy kết). Sau reload từ autosave, panel liệt kê chuỗi theo
   id envelope (có thể trống nếu chưa từng mở file sau đợt này); mở
   file tường minh một lần sẽ nhận chuỗi cũ về.
6. **Nhập archive không nhận chuỗi legacy.** Archive là project mới
   trên máy này (id envelope mới từ `newProject` + đè bằng id trong
   archive); chuỗi lịch sử của file gốc trên máy cũ không đi theo file
   `.vcut.zip` (lịch sử chỉ sống trong IndexedDB local).
7. **RefCount liên tab vẫn last-writer-wins** (nợ R7 §5.1, không thuộc
   phạm vi luồng này): OCC chỉ bảo vệ sổ tham chiếu, không bảo vệ
   refCount trên manifest.
8. **Bản ghi legacy khóa tên vẫn hiện như "project khác"** khi tên nó
   trùng tên project hiện tại (nợ R7 §2.2 — chỉ thừa chặn, an toàn).
   Đợt này chỉ làm nó PHÂN BIỆT ĐƯỢC (nhãn kèm ngày ghi) chứ không đổi
   ngữ nghĩa chặn; vẫn không tự động xóa bản ghi legacy trùng tên.
9. **`deleteCleanupAsset` vẫn trả `usedBy` bằng tên thô** (xem §1 #4):
   không hiện ra UI nên không sửa; nếu sau này UI hiện lý do từ chối
   chi tiết thì phải đổi sang nhãn phân biệt.
10. **Headed chưa đo đường mở file `.vcut` thật qua file picker.**
    H1 gọi `adoptLegacyHistoryChain` trực tiếp trong trang (đo đúng
    IndexedDB + localStorage thật), nhưng chưa đo toàn bộ đường
    `openProjectFileFlow` — tức mở một file `.vcut` cũ bằng UI thật
    (chọn file qua dialog) rồi kiểm tra panel. Đường mở file chỉ thêm
    một lớp gọi adoption trước khi trả về (đã đọc code, không có logic
    khác xen giữa), nhưng click-test end-to-end cho đường này vẫn chưa
    có — nợ nhỏ cho đợt sau.
11. **Headed chưa đo panel Dọn kho với 2 bản ghi trùng tên thật.**
    Nhãn phân biệt được đo ở H4 (hàm thuần trong trình duyệt) và unit
    A2–A5; panel Dọn kho dùng cùng hàm đó nhưng chưa có click-test mở
    panel với 2 bản ghi trùng tên trong sổ thật để đọc nhãn từ DOM.
12. **Không cần key i18n mới.** Qualifier là id rút gọn / ngày ISO —
    trung lập ngôn ngữ; không sửa vi.json/en.json, không tạo fragment.
    Nếu sau này muốn nhãn legacy hiện chữ "(bản ghi cũ)" theo locale
    thì mới cần key.

## 6. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectNameRegistry64R6.ts` | Mới | Nhãn phân biệt tên trùng + nhận diện chuỗi legacy file (thuần, Node-runnable) |
| `apps/web/src/lib/projectNameRegistry64R6.test.ts` | Mới | Test Node 28/28 (A–E) |
| `apps/web/src/lib/projectHistory.ts` | Sửa | `migrateVersions` + `migratedVersionId` + `isValidEnvelopeProjectId` + `adoptLegacyHistoryChain` (+deps inject) + `read/clearLegacyHistoryProjectId`; deprecate 3 hàm id legacy; cập nhật header (giới hạn v1 đổi tên đã hết); import registry module kèm `@ts-ignore` TS5097 theo quy ước |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | Mở file: bỏ `setProjectIdForFile`, await adoption về id envelope; `snapshotHistoryAfterSave` lưu version dưới `store.projectId` |
| `apps/web/src/components/project/HistoryPanel.tsx` | Sửa | `projectId` từ store (đăng ký, liệt kê lại khi đổi project) thay cho `getCurrentProjectId()` |
| `apps/web/src/components/project/ProjectMenu.tsx` | Sửa | `doNew`: bỏ `rotateProjectId()` + import |
| `apps/web/src/desktop.ts` | Sửa | Case `new-project`: bỏ `rotateProjectId()` + import |
| `apps/web/src/components/StorageCleanupPanel.tsx` | Sửa | Mục sổ + trạng thái "project khác dùng" dùng `registryDisplayLabels` (tên trùng kèm qualifier); `data-used-by-other` mang nhãn mới |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude 1 file test mới |
| `apps/web/scripts/clicktest-64r6-project-name-registry.mjs` | Mới | Harness headed T0/H1–H5 + H9 (7/7, xem §4.4) |
| `docs/PHASE9_ROUND64_R6_PROJECT_NAME_REGISTRY_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): log chi tiết
`hidden_files/round64-r6.md`; evidence headed
`hidden_files/round64-r6/headed/` (report JSON, vite/chrome log, 1
screenshot).

Stage: `paths-loop/phase9-round64-r6-project-name-registry.txt` — 11
entry, NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 7. Môi trường chạy

- VM này, không GPU.
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/projectNameRegistry64R6.test.ts` — exit 0 khi 28/28 pass.
  `node apps/web/src/lib/projectHistory.test.ts`,
  `node apps/web/src/lib/projectId63R7.test.ts`,
  `node apps/web/src/lib/idbCleanup61R9.test.ts`,
  `node apps/web/src/lib/projectAssetRefs62R7.test.ts`,
  `node apps/web/src/lib/projectRepo.test.ts`,
  `node apps/web/src/lib/saveToast31.test.ts`,
  `node apps/web/src/lib/loadProject54K1.test.ts` — hồi quy trực tiếp.
  `node scripts/run-node-test.mjs apps/web/src/store.idbCleanup61R9.test.ts apps/web/src/desktopMenuActions53J2.test.ts apps/web/src/desktopSaveAs53J4.test.ts` — runner.
- `tsc` chạy từ `apps/web` (`npx tsc --noEmit`, ~130–260 s dưới tải);
  `vite build` chạy từ `apps/web` (~66 s).
- Headed: `node apps/web/scripts/clicktest-64r6-project-name-registry.mjs`
  (~48 s; vite dev cổng 5640, CDP 9740, Xvfb display :176, TMPDIR
  /tmp/round64-r6/tmp; exit 0 khi 7/7 pass).

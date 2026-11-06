# Phase 9 đợt 41, luồng W3 — Relink/alias: chứng minh đua 2 tab end-to-end + % cho mọi caller importFiles

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG tạo
> batch paths (theo lệnh luồng: chỉ trả danh sách file + test + nợ,
> parent gộp stage sau). Đóng nợ đợt 40 §5.6 (V5):
> (a) đua alias 2 tab app thật end-to-end; (b) % cho các caller
> importFiles ngoài MediaBin; (c) đo import file > 128 MiB nếu khả thi.

## 1. Đã làm gì

### 1a. Đua alias 2 tab app thật end-to-end — CHỨNG MINH XONG (6/6 check)

Probe CDP Chromium thật, 3 page cùng origin trên bundle probe
(`probe-w3-two-tab-alias.mjs`, script + JSON ở ngoài repo, xem §2):

- Tab A import `race-base.mp4` (6,9 MiB) → tạo manifest
  `assetId = a_e4a4fe172a5c3399`, `aliases = []`.
- Tab C giữ lock Web Locks `vcut-alias:a_e4a4fe172a5c3399` bằng
  promise treo (giữ chủ đích, không phải lock của AssetStore).
- Tab A import `race-b.mp4` + Tab B import `race-c.mp4` — cùng bytes
  với base (1 hash duy nhất, verify bằng sha256sum), tên khác nhau
  nên cả hai đều phải đi qua `addAlias` của cùng assetId.
- Trong lúc C giữ lock, quan sát được đồng thời:
  - `locks.query`: held đúng **1** entry tên lock, pending đúng **2**
    entry cùng tên lock (2 yêu cầu addAlias của A/B đang chờ);
  - manifest IDB đọc từ Tab A: `aliases = []` — chứng minh addAlias
    thật sự bị chặn, không phải đã chạy xong trước khi đo.
- Nhả lock C → cả 2 alias đều sống sót: `aliases = [race-b.mp4,
  race-c.mp4]`, cả 2 tab vẫn evaluate được (không deadlock).
- Đua tự nhiên (không giữ lock): A import `race-d.mp4` + B import
  `race-e.mp4` cùng lúc → aliases cuối đủ 4 tên
  `[race-b, race-c, race-d, race-e].mp4`.

Kết luận: giới hạn một tab của đợt 39 nay được coi là **đóng hẳn
trên Chromium** ở tầng AssetStore + Web Locks — không chỉ từng mắt
xích riêng như V5, mà là luồng app thật 2 tab với lock thật, hàng
đợi thật, IDB thật. Phần chưa chứng minh (xem §4): Safari/Firefox/
máy thật.

### 1b. % cho mọi caller importFiles ngoài MediaBin — ĐÃ NỐI HẾT 7/7 call site

Helper dùng chung mới `lib/importProgressText41W3.ts`
(`formatImportProgressText`): định dạng 1 sự kiện tiến trình bằng
đúng key i18n `importProgress.*` mà V5 đã thêm cho MediaBin
(đủ vi + en, **không thêm key mới** — kiểm tra phẳng vẫn
vi = en = 962, vi-only = en-only = []). Ngữ nghĩa giữ nguyên:
% chỉ thật ở pha hashing; pha storing chỉ báo "đang ghi — không
có %"; không nội suy. MediaBin KHÔNG dùng helper này (giữ nguyên
code V5 đã click-test — trùng lặp nhỏ này là cố ý).

Các panel đã nối (mỗi panel: state `importProgress` + callback
truyền vào `importFiles` + phần tử `role="status"`
`data-import-progress=<phase>`, xoá ngay khi `importFiles` resolve):

| Panel (call site) | Chỗ % hiện | Ghi chú |
|---|---|---|
| ExportPanel — reframe (`start`) | dưới message reframe | file MP4 reframe có thể > 64 MiB nên % từng lát có ý nghĩa thật |
| StickerPanel — APNG động (`onUpload`) | dưới thông báo lỗi | APNG thường nhỏ → chỉ thấy sự kiện hashing chốt 100% rồi storing; % từng lát chỉ xuất hiện nếu APNG > 64 MiB |
| ProjectMenu — nhập bản nén (`onArchiveFile`) | trong thanh menu, trước indicator autosave | `fileIndex/fileCount` đếm theo từng media trong bản nén |
| TtsButton — (`speak`) | dưới `tts-msg` | WAV TTS thường nhỏ → chủ yếu thấy pha storing/done, không bịa % |
| BgRemovePanel — (`run`) | dưới message panel | file MOV đã xoá nền có thể lớn → % từng lát có ý nghĩa thật |
| TemplatePackModal — `create` + `makeTts` | dưới dòng "đang tạo" (dùng chung 1 state) | **cả 2 call site đều nối** (test khoá đúng 2/2) |
| MediaBin (đợt 40 V5) | banner V5 cũ | không đụng vào |

Không còn caller UI nào chưa nối: grep toàn `src` chỉ còn 8 call
site UI (MediaBin + 7 trên) — các dòng `importFiles` còn lại trong
`lib/archive.ts` / `lib/templatePack.ts` chỉ là comment/doc, và
`store.ts` là định nghĩa hàm (đường relink nội bộ ở `store.ts`
dùng `ingestImportedItemWithProgress` trực tiếp, không qua UI).
Caller không-UI theo quyết định V5 §3.1 vẫn giữ đường nhanh
(không callback → không trả giá băm JS thuần): không áp dụng ở
đây vì 7 call site trên đều là UI, user nhìn thấy được.

### 1c. Đo import file > 128 MiB — ĐO ĐƯỢC (4/4 check, xem điều kiện ở §2)

File `big-120s.mp4` = **136.970.880 byte = 130,6 MiB**, MP4 hợp lệ
(duration 120 s, ffprobe xác nhận), tạo bằng
`ffmpeg -stream_loop 1 -i big-60s.mp4 -c copy` (loop lại file 65 MB
của V5, không encode lại — đường import chỉ quan tâm số byte nên
cách tạo này không ảnh hưởng số đo hashing/ghi, và được ghi rõ
ở đây thay vì giấu). Probe 1 tab, poll banner 100 ms như V5.

## 2. Số đo thật (Chromium headless, KHÔNG phải baseline quiet)

### 2a. Đua alias (probe run8, `w3-two-tab-alias.json`, allPass = true)

| Check | Kết quả |
|---|---|
| Base manifest từ tab A | `assetId = a_e4a4fe172a5c3399` |
| Tab C giữ lock trước khi đua | held = [`vcut-alias:a_e4a4fe172a5c3399`] |
| Lúc C giữ lock | held đúng 1 + pending đúng 2 cùng tên lock |
| Lúc C giữ lock | `aliases = []` (addAlias bị chặn thật) |
| Sau khi nhả lock | `aliases = [race-b.mp4, race-c.mp4]`, 2 tab đều sống (eval = 2/2), không deadlock |
| Đua tự nhiên (không giữ lock) | aliases cuối đủ 4 tên b/c/d/e |

Số `settle = 19 ms` (từ lúc gọi nhả lock tới khi waitFor thấy đủ
2 alias) chỉ ghi theo phép đo — độ phân giải poll 500 ms cộng
round-trip CDP, **không dùng làm latency cấp lock**. Bằng chứng
chính là trạng thái trước/sau (trống → đủ), không phải con số ms.

### 2b. Import file 130,6 MiB (probe `w3-big-import.json`, allPass = true)

| Đo | Kết quả | Ghi chú |
|---|---|---|
| Mẫu hashing | 16 mẫu, % = 6, 12, 18, …, 91, 97, đơn điệu | mỗi bước đúng 8,0 MB = 1 lát băm; mẫu 100% không bắt kịp giữa 2 lần poll (97% → storing) |
| Mẫu hashing đầu tiên | +1.284 ms (đã gồm probe video + lát băm đầu) | |
| Pha hashing (mẫu đầu → storing) | ≈ 5.497 ms | ≈ 370 ms/lát 8 MiB ≈ 21–24 MB/s băm JS thuần |
| Pha storing = IDB put 130,6 MB | ≈ 2.076 ms | ≈ 63 MB/s ghi đĩa IDB thật |
| Tổng import (banner xuất hiện → bin có file) | 8.857 ms | gồm probe + băm + ghi IDB |
| Manifest IDB thật sau import | `big-120s.mp4`, size đúng 136.970.880 byte | |

**Điều kiện đo — đọc kỹ trước khi trích số:** các số trên nhanh
hơn nhiều so với số under-load của V5 (65 MB: hashing ≈ 14,4 s,
storing ≈ 11,6 s) — nhưng luồng này **không ghi log tải trong lúc
chạy probe** (chỉ có load average lúc kết thúc: 0,69 / 1,70 / 1,78
và RAM trống ~0,9 GB). Vì vậy các số này được báo cáo là "số của
lần chạy này", **chưa chứng nhận là số lúc máy yên, cấm dùng làm
baseline quiet** cho tới khi có lần chạy lại trong cửa sổ yên có
điều phối kèm log tải. File + profile Chrome của lần đo này đặt ở
`~/workspace/tmp-round41-w3-big/` (đĩa) thay vì `/tmp` vì /tmp là
tmpfs 512 MB đã dùng 96% lúc đầu đợt (chỉ còn 23 MB trống) — không
thể chứa file 130 MB cộng bản copy IDB của nó; đây là lệch khỏi
quy ước scratch `/tmp/round41-w3/` vì lý do dung lượng, không phải
để đưa file vào repo (thư mục đó nằm ngoài repo, parent có thể
xoá sau khi push).

## 3. Quyết định kỹ thuật (ghi để luồng sau khỏi làm lại)

1. **Tái dùng key i18n V5 thay vì thêm key mới.** Mọi panel mới đều
   dùng `importProgress.hashing/storing/done` — một nguồn ngữ nghĩa
   duy nhất, i18n phẳng không đổi (962/962).
2. **Helper thuần, không đụng DOM/store.** `formatImportProgressText`
   chỉ nhận event + hàm dịch nên unit test được; MediaBin giữ code
   V5 để khỏi đụng đường đã chứng minh.
3. **Đua chứng minh bằng lock giữ chủ đích + hàng đợi pending.**
   Chỉ quan sát "đủ alias cuối cùng" thì chưa đủ mạnh — phải bắt
   được trạng thái giữa chừng (pending ≥ 2 + aliases vẫn trống)
   mới khẳng định lock thật sự tuần tự hoá, thay vì 2 op tình cờ
   chạy nối tiếp nhau.
4. **Không sửa app để phục vụ probe.** Các bẫy harness gặp phải
   (§5) đều sửa ở phía probe, không đụng code app — app không có
   bug nào lộ ra từ các bẫy này.

## 4. Cái gì chưa làm / chưa chứng minh (trung thực)

- **Safari / Firefox / máy thật chưa kiểm chứng lock.** Bằng chứng
  end-to-end ở đây chỉ trên Chromium Linux headless; claim hỗ trợ
  Safari 15.4+ / Firefox 96+ vẫn chỉ dựa trên tài liệu công khai
  như V5 đã ghi, chưa đo thật.
- **% ở các panel mới chưa có click-test riêng từng panel.**
  Đường dữ liệu đã khoá bằng unit test kiểm toán tĩnh (mọi call
  site đều truyền callback + render `data-import-progress`) và
  build + tsc xanh; nhưng banner % từng panel (reframe, sticker
  APNG, nhập bản nén, TTS, bg-remove, template pack) chưa được
  bấm thật trên browser như MediaBin ở V5 — cần bridge (reframe/
  TTS/bg-remove) hoặc fixture (APNG, bản nén, pack) nên để luồng
  sau làm nếu cần bằng chứng từng panel.
- **Số file > 128 MiB chưa phải baseline quiet** (xem §2b): cần
  lần chạy lại trong cửa sổ yên có log tải mới được chốt.
- **File > 128 MiB qua bridge thật, tab ẩn hàng giờ, quota IDB bị
  evict:** kế thừa giới hạn đợt 39 T5 / V5 — chưa đo trong luồng này.
- **Tab ẩn / tab nền:** user thật luôn thao tác trên tab đang mở
  nên không ảnh hưởng sử dụng thật; chỉ harness CDP mới gặp (§5).

## 5. Bẫy harness gặp phải (ghi để luồng sau khỏi mất thời gian)

Probe 2 tab đã fail 4 lần trước khi xanh — tất cả đều là bẫy của
harness CDP, không phải bug app (đã đối chứng bằng các script
debug riêng, đều ở ngoài repo):

1. **Mở tab B/C trước khi import base → import base timeout 120 s.**
   Sửa: import base xong mới mở B/C (run2 trở đi base luôn PASS).
2. **`openPage` fallback về "trang cuối" khi target mới chưa kịp
   xuất hiện trong `/json/list`** → 2 connection trỏ cùng 1 target,
   có thể gãy WS của tab A. Sửa: poll `/json/list` đến khi đúng
   `targetId` xuất hiện mới kết nối.
3. **Tab nền bị Chromium headless-new hạn chế dispatch change sau
   `DOM.setFileInputFiles`:** input đã có file nhưng onChange React
   không chạy (đối chứng: `input.files` có tên file, banner null,
   không pending lock). Sửa: `Page.bringToFront` tab đó trước khi
   set file — user thật luôn thao tác trên tab đang mở nên đây
   không phải bug app.
4. **`bringToFront` trả về trước khi renderer kịp chuyển sang
   `visible`:** set file ngay lập tức vẫn rơi vào lúc tab còn nền.
   Sửa: poll đến khi `visibilityState === "visible"` và
   `hasFocus()` mới set file.
5. **Thứ tự chờ sai (run7):** đoạn chờ tab A hiện media nằm SAU
   lệnh bringToFront tab B → A bị nền hoá trước khi kịp hiện media
   (probeVideo kẹt ở tab nền). Sửa: chờ từng tab hiện media xong
   khi tab đó còn foreground rồi mới chuyển sang tab kia. Đua thật
   sự nằm ở addAlias (sau ingest, cả 2 đều bị lock của C chặn) nên
   cách chờ tuần tự này không làm yếu bằng chứng đua.

## 6. Kết quả kiểm chứng

- Test mới `importProgress41W3.test.ts`: **4/4, exit 0** — helper
  định dạng (hashing đúng key + index 1-based + % floor; storing/
  done không có biến percent) + kiểm toán tĩnh mọi call site UI
  (7 panel + MediaBin đều truyền callback + render banner;
  TemplatePackModal đúng 2/2 call site).
- Hồi quy chạy lại sau mọi sửa: relink V5 `relink40V5.test.ts`
  **6/6**, relink T5 `relink39T5.test.ts` **11/11**, dedup U3
  `relinkDedup38U3.test.ts` **7/7**, `assetStore.test.ts` **22/22**,
  `importAsset37T3.test.ts` **8/8**, `rehydrate36S5.test.ts`
  **19/19** (tổng hồi quy 73/73, fail 0).
- `tsc --noEmit` (apps/web): **0 lỗi** (chạy 2 lần trong đợt, lần
  cuối sau mọi sửa vẫn 0; grep file luồng W3: trống).
- `vite build` (ra `/tmp/round41-w3/dist`, không đè dist repo):
  **pass (37,01 s)**; cảnh báo chunk > 500 kB cũ, không mới.
- i18n phẳng: **vi = en = 962/962**, vi-only = en-only = [].
- Click-test browser thật: đua alias 2 tab **6/6 PASS**
  (`w3-two-tab-alias.json`, allPass = true); import file 130,6 MiB
  **4/4 PASS** (`w3-big-import.json`, allPass = true). Mọi số timing
  đều gắn điều kiện ở §2, không claim baseline quiet.

## 7. File đổi / thêm (chỉ file text, KHÔNG binary, KHÔNG push, KHÔNG batch paths)

Mới:

- `apps/web/src/lib/importProgressText41W3.ts` — helper định dạng
  tiến trình importFiles dùng chung (§1b).
- `apps/web/src/lib/importProgress41W3.test.ts` — 4 test (§6).
- `docs/PHASE9_ROUND41_W3_RELINK_LIMITS.md` — file này.

Sửa:

- `apps/web/src/ExportPanel.tsx` — state + callback + banner tiến
  trình cho reframe.
- `apps/web/src/components/sticker/StickerPanel.tsx` — như trên cho
  APNG động.
- `apps/web/src/components/project/ProjectMenu.tsx` — như trên cho
  nhập bản nén.
- `apps/web/src/components/TtsButton.tsx` — như trên cho TTS.
- `apps/web/src/components/BgRemovePanel.tsx` — như trên cho file
  MOV đã xoá nền.
- `apps/web/src/components/onboarding/TemplatePackModal.tsx` — như
  trên cho cả `create` và `makeTts` (thêm import `t` từ i18n vì
  `ot()` của modal không nhận vars).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới
  (mẫu chung, parent gộp).

Không đụng: `MediaBin.tsx` (giữ code V5), `store.ts`,
`assetStore.ts`, `ingestProgress39T5.ts`, i18n JSON, mọi file của
luồng khác. Scratch ngoài repo: `/tmp/round41-w3/` (dist probe,
probe 2 tab + probe file lớn + 5 script debug, log, JSON kết quả,
file race 5 × 6,9 MB) và `~/workspace/tmp-round41-w3-big/`
(file 130,6 MB + profile Chrome lần đo lớn) — không vào repo,
không vào batch push. `apps/web/dist/` của repo không bị đụng tới.

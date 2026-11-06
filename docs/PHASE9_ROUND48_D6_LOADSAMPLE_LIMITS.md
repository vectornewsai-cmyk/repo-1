# Phase 9 đợt 48 D6 — LIMITS: hai `loadSample` chồng nhau (retry có điều kiện)

**Luồng:** D6 (đợt 48). **Trạng thái:** HOÀN THÀNH — coalesce + retry có
điều kiện + click-test browser CDP đỏ-trước/xanh-sau n≥3 mỗi chiều.
**Nợ đóng:** C1 §4.3 (`docs/PHASE9_ROUND47_C1_LOADSAMPLE_LIMITS.md`):
hai `loadSample` chồng nhau thì lần 2 return ngay, không tự retry.

## 0. Kết luận ngắn (không vượt số đo)

- Hành vi đúng đã chọn (dựa trên code UI thật gọi `loadSample`):
  **coalesce + retry có điều kiện, không chạy song song.** Lần gọi chồng
  được ghi nhớ (kèm thế hệ project lúc yêu cầu tới); khi lượt đang bay
  xong, chỉ chạy lại MỘT lượt mới khi cả hai điều kiện đúng: (a) lượt
  vừa xong KHÔNG set được (bị bỏ do đổi project, hoặc
  `buildSampleProject` ném lỗi); (b) thế hệ không đổi kể từ khi yêu cầu
  chồng tới. Nếu lượt vừa xong đã set thành công thì ý định của lần gọi
  chồng đã thỏa (chạy lại chỉ tốn thêm ~10 s build mẫu giống hệt); nếu
  user đã đổi project SAU lần bấm đó thì lần đổi mới hơn thắng (chạy lại
  sẽ revert project user vừa mở).
- Click-test browser thật (Chromium headed + Xvfb, CDP websocket):
  **đỏ-trước 6/7 (D4 FAIL) × 3 lượt hợp lệ, xanh-sau 7/7 × 4 lượt**
  (xem §3). `tsc --noEmit` sạch, `vite build` sạch (xem §5). Hồi quy
  race C1 trên code cuối: **7/7 × 3 lượt**; hồi quy Node: **60 pass**.

## 1. Quyết định hành vi — vì sao không phải "retry luôn" hay "giữ return-ngay"

Ba đường gọi `loadSample` thật trên UI đều fire-and-forget
(`void st.loadSample()`): mount `App.tsx:238` (khi chưa có autosave),
nút "Dự án mẫu" trong `WelcomeModal.tsx:76`, nút "Tải lại dự án mẫu"
trong `MediaBin.tsx:290`. Không có đường nào `await` kết quả, nên lần
gọi chồng bị drop là **mất ý định im lặng** — user bấm nút mà không có
gì xảy ra (khi lượt đầu bị bỏ set). Bốn trường hợp phải phân biệt:

| # | Thứ tự sự kiện | Hành vi đúng | Lý do |
|---|---|---|---|
| A | call1 bay → call2 chồng → không ai đổi project | call1 set thành công, **không retry** | ý định call2 đã thỏa; retry chỉ tốn ~10 s build lại mẫu giống hệt |
| B | call1 bay → call2 chồng → user mở file/tạo mới | call1 bỏ set, **không retry** | lần đổi project mới hơn (sau lần bấm) thắng; retry sẽ revert project user vừa mở |
| C | call1 bay → user mở file/tạo mới → call2 chồng | call1 bỏ set, **retry một lượt mới** | call2 tới SAU lần đổi project — đây là ý định mới nhất, phải được thỏa |
| D | call1 bay → call1 ném lỗi → call2 đã chồng | **retry một lượt mới** | call1 thất bại nên ý định call2 chưa thỏa; guard `sampleLoading` đã reset ở `finally` (C1) |

"Chạy song song" bị loại: hai `buildSampleProject` cùng fetch media
mẫu + ghi 2 clip webm bằng MediaRecorder cùng lúc là lãng phí và tạo
thêm race trên `trackSeq`/media bin. "Giữ return-ngay" bị loại: đó
chính là bug (case C/D mất ý định). "Retry luôn" bị loại: vi phạm case
B (revert project vừa mở) và case A (tốn build thừa).

## 2. Thay đổi code

Chỉ 1 file production + 1 file test + LIMITS này (không chạm file của
luồng khác trong đợt 48):

- `apps/web/src/store.ts` — coalesce + retry (nằm trong `loadSample`,
  kế thừa generation counter C1, không đổi chữ ký hay state):
  - `let sampleReloadQueued = false; let sampleReloadGen = -1`
    (module-level, cạnh `sampleLoading`).
  - Đầu `loadSample`: nếu `sampleLoading` thì ghi nhớ
    (`sampleReloadQueued = true; sampleReloadGen = projectGeneration`)
    rồi return — không chạy song song.
  - Trong `try`: thêm `let didSet = false`, gán `true` sau `set` thành
    công (phân biệt "lượt vừa xong có set được không" — case A vs C/D).
  - Trong `finally` (sau khi `sampleLoading = false`): nếu có yêu cầu
    chờ thì xóa cờ trước rồi xét retry — `if (!didSet &&
    sampleReloadGen === projectGeneration) void get().loadSample();`
    (gọi qua `get()` để đi đúng hàm hiện tại; fire-and-forget như mọi
    caller UI, không `await` trong `finally`). Mỗi lần bấm chỉ tạo tối
    đa 1 yêu cầu chờ, đã xóa trước khi retry chạy, nên không có vòng lặp
    vô hạn; chồng tiếp trong lúc retry lại coalesce bình thường.
- `apps/web/scripts/clicktest-48d6-loadsample-overlap.mjs` (mới) —
  harness CDP tái hiện chồng nhau thật, xem §3.
- `docs/PHASE9_ROUND48_D6_LOADSAMPLE_LIMITS.md` (file này).

## 3. Harness click-test (browser thật, không mock)

`node apps/web/scripts/clicktest-48d6-loadsample-overlap.mjs`
(Chromium local headed + Xvfb, CDP websocket; build app mới ra scratch
`~/workspace/tmp-round48-d6-overlap/dist`, static server cùng origin;
profile Chrome mới → không autosave → mount gọi `loadSample` = call1;
`D6_SKIP_BUILD=1` dùng lại dist đã build):

- **D1** app load (React render `#root` có children).
- **D2** mở file TRONG lúc call1 bay: đưa file `.vcut.json` thật (1 clip
  chữ 10 s, tên "C1 race project", cùng envelope với C1) qua input ẩn
  của ProjectMenu bằng DataTransfer + dispatch `change`. Guard INVALID
  (exit 2): nếu sample đã sẵn sàng TRƯỚC khi đưa file thì cửa sổ race
  đã đóng — test rỗng, không được đọc thành pass.
- **D3** bấm nút "Tải lại dự án mẫu" (MediaBin) trong lúc call1 còn bay
  (call2 chồng, case C): ghi thời điểm bấm + trạng thái lúc bấm (sample
  chưa sẵn sàng). Guard thời gian đã SỬA trong lúc đo (xem §4.1): bấm
  phải < 5 s **sau RENDER** (không phải sau navigate).
- **D4** (case phân biệt) retry chạy: project cuối là MẪU (duration
  00:08.0, tên "Dự án mẫu", bin có mau) trong 45 s. Trên code chưa vá
  D6: call2 bị drop + call1 bị bỏ set → project ở lại file vừa mở
  (00:10.0) suốt 45 s → FAIL.
- **D5** (case bảo vệ — lần đổi mới hơn thắng, case B): từ trạng thái
  mẫu, bấm nút mẫu (call1 mới) rồi bấm lại ngay (call2 chồng), rồi mở
  file TRONG lúc call1 bay. Poll 20 s: project ở lại file vừa mở
  (00:10.0, "C1 race project", bin không mau) — retry phải bị bỏ vì
  generation đã đổi SAU lần bấm thứ 2. Trên cả code cũ và mới đều phải
  PASS (guard hồi quy: vá D6 không được revert project user vừa mở).
- **D6** autosave `localStorage` sau D5 vẫn chứa project vừa mở (name
  "C1 race project", clip C1TEXT, không clip mẫu). Ngủ 7 s trước khi
  poll như C1 C5 (bẫy đọc autosave quá sớm).
- **D7** 0 `Runtime.exceptionThrown` trong phiên.

### 3.1 Xanh-sau — code đã vá D6: 7/7 × 4 lượt

| Lượt | D3 bấm (sau navigate) | D4 mẫu xuất hiện sau khi bấm | Kết quả |
|---|---|---|---|
| xanh 1 | t+3,3 s | 15,1 s (t+18,4 s sau navigate) | 7/7, exit 0 |
| xanh 2 | t+2,3 s | 15,2 s (t+17,6 s sau navigate) | 7/7, exit 0 |
| xanh 3 | t+4,8 s | 15,6 s (t+20,7 s sau navigate) | 7/7, exit 0 |
| xanh 4 (harness đã sửa guard, §4.1) | t+5,7 s (t+2,5 s sau render) | 15,1 s (t+20,9 s sau navigate) | 7/7, exit 0 |

D4 ổn định 15,1–15,6 s sau khi bấm ở cả 4 lượt: khớp cơ chế
call1 xong (~bấm+8 s, bỏ set) + retry build (~7 s). Kết quả chi tiết:
`~/workspace/tmp-round48-d6-overlap/d6-result-green{1,2,3,4}.json`.

### 3.2 Đỏ-trước — chỉ gỡ phần D6 (giữ nguyên generation counter C1): 6/7 × 3 lượt hợp lệ

Revert bằng script `~/workspace/tmp-round48-d6-overlap/revert-d6.py`
(thay thế chuỗi chính xác, assert mỗi chỗ đúng 1 lần; kiểm tra sau
revert: 0 lần "48 D6" trong `store.ts`, còn `genAtStart` = còn C1).
Khôi phục bản xanh bằng copy đã lưu, verify sha256
`6b8de646c0701eb4de25e41162d2275cad28a244ffe16b4b2a9ad41f0b077b5e`
khớp trước và sau mỗi lần revert (xem §4.2).

| Lượt | D3 bấm | D4 | Còn lại |
|---|---|---|---|
| đỏ 1 | t+4,7 s sau navigate | **FAIL — sau 45 s không thấy mẫu**, project ở lại 00:10.0 | D1/D2/D3/D5/D6/D7 PASS |
| đỏ 2 | — (INVALID, §4.1) | — | không tính |
| đỏ 3 | t+5,8 s sau navigate | **FAIL — sau 45 s không thấy mẫu**, project ở lại 00:10.0 | D1/D2/D3/D5/D6/D7 PASS |
| đỏ 2b | — (INVALID, §4.1) | — | không tính |
| đỏ 2c (harness đã sửa guard) | t+4,9 s / t+1,9 s sau render | **FAIL — sau 45 s không thấy mẫu**, project ở lại 00:10.0 | D1/D2/D3/D5/D6/D7 PASS |

D5 PASS ở cả 3 lượt đỏ lẫn 4 lượt xanh — đúng kỳ vọng: D5 là guard hồi
quy, không phân biệt đỏ/xanh. Kết quả chi tiết:
`d6-result-red{1,3,2c}.json` (FAIL D4), `d6-result-red{2,2b}.json`
(INVALID, không tính).

### 3.3 Đo lại race C1 trên code cuối (có D6): 7/7 × 3 lượt

Chạy lại harness C1
(`apps/web/scripts/clicktest-47c1-loadsample-race.mjs`, không sửa)
trên code cuối: giữ project mới (C4: duration luôn 00:10.0 suốt 20 s)
+ autosave đúng (C5) ở cả 3 lượt. Kết quả:
`~/workspace/tmp-round48-d6-overlap/c1-result-green-d6-{1,2,3}.json`
(mỗi lượt 7/7, exit 0; C3 mở xong ở t+0,0–0,5 s sau khi đưa file).

## 4. Cái gì chưa làm / giới hạn còn lại

1. **Guard thời gian D3 đã sửa giữa chừng (§3, §3.1/§3.2):** bản đầu
   guard "bấm < 6 s sau navigate" — sai mốc (build chạy từ mount
   effect, tức từ lúc React render) và quá chặt so với dao động
   cold-start/render lần đầu (1,6–4 s giữa các lượt; máy 2vCPU, có lúc
   luồng khác đợt 48 chạy Chrome song song — còn thấy Xvfb :90 + Chrome
   `--remote-debugging-pipe` lạ trên máy lúc đo, không phải của luồng
   này, không đụng tới). Hai lượt đỏ 2 và 2b INVALID oan ở t+6,1 s /
   t+6,3 s sau navigate dù lần bấm chỉ cách render ~2,3 s — còn cách
   lúc build xong ~6-7 s, tức thực tế vẫn chồng nhau. Guard đã sửa
   thành "bấm < 5 s sau render": build đo được ~8-9 s sau render (C1
   revert ở +8,1 s sau khi mở, mở ở render+~1,2 s; D4 xanh: mẫu ở
   bấm+15,1 s = call1 xong ~bấm+8 s + retry build ~7 s), nên 5 s còn dư
   ≥ 3 s biên. Hai lượt INVALID không được tính vào n (không đọc thành
   pass cũng không đọc thành fail); lượt đỏ 2c chạy lại bằng harness đã
   sửa là lượt đỏ hợp lệ thứ 3. Các lượt xanh 1–3 chạy bằng guard cũ
   vẫn hợp lệ (bấm ở t+2,3–4,8 s sau navigate, tức càng sớm hơn sau
   render).
2. **Case D (call1 ném lỗi rồi retry) chưa đo trên browser thật:**
   `buildSampleProject` không có đường nào ép lỗi từ UI (cần phá
   media mẫu hoặc chặn fetch — can thiệp sâu vào app chỉ để test).
   Retry cho case D đi cùng một nhánh code với case C (`!didSet` —
   throw cũng để lại `didSet=false`), và case C đã đo xanh 4/4, nên
   nhánh này đã được chứng minh qua case C; nhưng case D riêng lẻ vẫn
   là chưa đo, không claim.
3. **Compat (§4.8 C1): Safari / Firefox / máy thật / màn hình vật lý
   vẫn CHƯA ĐO — lần này đã kiểm tra môi trường, không có gì để đo.**
   Quét ngày 05/11: `~/.cache/ms-playwright/` chỉ có `chromium-1248`
   + `ffmpeg-1013`; không có binary `firefox`/`google-chrome` nào
   (`which` trống), không có Safari/WebKit trên Linux,
   `~/.cache/google-chrome-for-testing-headless/` chỉ chứa thư mục
   `scoped_dir*` (profile tạm, không phải binary trình duyệt),
   Playwright không cài trong repo (`npm ls playwright` trống). Không
   tải trình duyệt về (theo đúng chỉ đạo: không tải nặng, không claim).
   Race/retry là logic async cấp store, không phụ thuộc trình duyệt —
   nhưng mọi số giây trong file này vẫn là số của Chromium headed
   dưới Xvfb trên VM này.
4. **Chưa có unit test Node cho queue/retry:** như C1 §4.4, race này
   cần wiring thật (fetch media mẫu, MediaRecorder, `URL.createObjectURL`)
   nên test Node mock nặng sẽ không chứng minh được gì; bằng chứng là
   click-test browser §3.
5. **Không đụng file của luồng khác:** chỉ `store.ts` (phần D6, có chú
   thích "Đợt 48 D6"), harness D6 mới, LIMITS này. `TopBar.tsx` /
   `tsconfig.json` trên đĩa (nếu mới hơn baseline) không phải của luồng
   này, không sửa.

## 5. Kiểm chứng

- `npx tsc --noEmit` (apps/web): sạch, exit 0, không output.
- `npx vite build` (apps/web, ra scratch `/tmp/vcut-d6-build-check`):
  sạch, exit 0, built trong 7,26 s (cảnh báo chunk > 500 kB có sẵn từ
  trước, không do đợt này).
- Click-test browser D6: đỏ-trước 6/7 (D4 FAIL) × 3 lượt hợp lệ,
  xanh-sau 7/7 × 4 lượt (§3.1–3.2); 2 lượt đỏ INVALID do guard thời
  gian sai mốc đã sửa, không tính.
- Hồi quy race C1 trên code cuối: 7/7 × 3 lượt (§3.3).
- Hồi quy Node trực tiếp (`node *.test.ts`, type-stripping, không
  vitest — repo không cài vitest): `projectRepo.test.ts` 10 pass,
  `projectRepoNested22.test.ts` 7 pass, `projectRepoRound26J5.test.ts`
  15 pass, `clipboard.test.ts` 18 pass, `loadReport.test.ts` 10 pass
  — tổng **60 pass, 0 fail**. (Lưu ý: lần chạy đầu gõ sai đường dẫn
  `clipboard.test.ts`/`loadReport.test.ts` — hai file nằm ở
  `apps/web/src/lib/`, không phải `apps/web/src/`; chạy lại đúng
  đường dẫn thì 18 + 10 pass. Không có test Node nào chạm trực tiếp
  `loadSample`/`store.ts` nên hồi quy này chỉ chứng minh không vỡ
  đường load project kề bên.)

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- `apps/web/src/store.ts` (vá D6: `sampleReloadQueued` /
  `sampleReloadGen` + `didSet` + retry có điều kiện trong `finally`
  của `loadSample`)
- `apps/web/scripts/clicktest-48d6-loadsample-overlap.mjs` (mới)
- `docs/PHASE9_ROUND48_D6_LOADSAMPLE_LIMITS.md` (mới, file này)

Scratch đo (ngoài repo, để parent đối chiếu): 
`~/workspace/tmp-round48-d6-overlap/` — `d6-result-green{1,2,3,4}.json`,
`d6-result-red{1,3,2c}.json`, `d6-result-red{2,2b}.json` (INVALID),
`c1-result-green-d6-{1,2,3}.json`, `store.ts.D6-GREEN` /
`store.ts.D6-RED`, `revert-d6.py`, `run-measurements.sh`,
`measurements.log`, các `*.stdout.log`.

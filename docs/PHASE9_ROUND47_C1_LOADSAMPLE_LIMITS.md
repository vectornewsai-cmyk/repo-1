# Phase 9 đợt 47 C1 — LIMITS: race `loadSample` ghi đè project vừa mở

**Luồng:** C1 (đợt 47). **Trạng thái:** HOÀN THÀNH — vá generation counter
+ click-test browser CDP đỏ-trước/xanh-sau 7/7.
**Bug gốc:** đợt 46 B1 §6.2 (`docs/PHASE9_ROUND46_B1_SETTLE_LIMITS.md`),
tóm tắt ở `docs/PHASE9_ROUND46_LIMITS.md` §4 mục 3.

## 0. Kết luận ngắn (không vượt số đo)

- Bug tái hiện đúng như B1 đo: mở file `.vcut.json` trong lúc `loadSample`
  còn bay → `loadSample` `set` cuối revert project về mẫu 8 s ở ~+6 s
  sau khi mở, autosave sau đó cũng bị ghi đè bằng mẫu.
- Vá tối thiểu: đếm thế hệ project (generation counter) module-level
  trong `apps/web/src/store.ts` — `loadSample` chụp thế hệ trước `await
  buildSampleProject()`, chỉ `set` khi thế hệ không đổi; `newProject` /
  `replaceProject` / `loadSample` set thành công đều tăng thế hệ.
- Click-test browser thật (Chromium headed + Xvfb, CDP websocket):
  **đỏ-trước C4 FAIL** trên code chưa vá, **xanh-sau 7/7 PASS** trên code
  đã vá (xem §3). `tsc --noEmit` sạch, `vite build` sạch (xem §5).

## 1. Thay đổi code

Chỉ 1 file production + 1 file test + LIMITS này (không chạm file của
luồng khác trong đợt 47 — `TopBar.tsx` và `tsconfig.json` trên đĩa là
của luồng C5, không sửa):

- `apps/web/src/store.ts` — generation counter:
  - `let projectGeneration = 0` (module-level, không nằm trong state,
    không phải API công khai).
  - `loadSample`: chụp `genAtStart` trước `await buildSampleProject()`;
    sau `await`, nếu `genAtStart !== projectGeneration` thì `return`
    (bỏ set stale, giữ nguyên project hiện tại); nếu không đổi thì
    `projectGeneration += 1` rồi `set` như cũ.
  - `newProject` / `replaceProject`: `projectGeneration += 1` trước `set`.
  - `sampleLoading` reset trong `finally` (đã có từ trước trong bản vá
    trên đĩa; xem §4.2 — trước đây cờ này không bao giờ reset nên nút
    "Tải lại dự án mẫu" chết sau lần tải đầu).
- `apps/web/scripts/clicktest-47c1-loadsample-race.mjs` (mới) — harness
  CDP tái hiện race, xem §2.
- `docs/PHASE9_ROUND47_C1_LOADSAMPLE_LIMITS.md` (file này).

### 1.1 Mọi đường đổi project đều đi qua cổng tăng thế hệ

Đã kiểm chứng bằng grep: mọi chỗ thay toàn bộ project đều gọi
`replaceProject` / `newProject` (không có `set({spec...})` thay project
nào khác): mở file `ProjectMenu.tsx:146,247`, khôi phục autosave
`App.tsx:195`, khôi phục version `HistoryPanel.tsx:77`, template
`TemplatePicker.tsx:66` / `TemplatePackModal.tsx:65`. Chỉnh sửa clip
trong project (qua `execCommand`) không đổi project nên không tăng thế
hệ — đúng, vì đó không phải race cần chống. `restoreMediaBin` chỉ thêm
media vào bin, không đổi spec.

## 2. Harness click-test (browser thật, không mock)

`node apps/web/scripts/clicktest-47c1-loadsample-race.mjs`
(Chromium local headed + Xvfb, CDP websocket; build app mới ra scratch
`~/workspace/tmp-round47-c1-race/dist`, static server cùng origin;
profile Chrome mới → không autosave → mount gọi `loadSample`):

- **C1** app load (React render `#root` có children).
- **C2** nút "Mở file dự án (.vcut.json)" tồn tại.
- **C3** mở file TRONG lúc `loadSample` đang bay: đưa file `.vcut.json`
  thật (1 clip chữ 10 s, tên "C1 race project") qua input ẩn của
  ProjectMenu bằng DataTransfer + dispatch `change` (đường B1 đã chứng
  minh; `DOM.setFileInputFiles` qua websocket CDP không dính). Có
  guard INVALID (exit 2): nếu sample đã sẵn sàng TRƯỚC khi đưa file
  (bin có mau hoặc duration đã 00:08.0) thì cửa sổ race đã đóng — test
  rỗng, không được đọc thành pass.
- **C4** project vừa mở KHÔNG bị revert trong 20 s sau khi mở (poll
  500 ms: duration luôn 00:10.0, tên luôn "C1 race project", bin không
  bao giờ có mau-1/mau-2). Đây là case bắt bug.
- **C5** autosave `localStorage` sau cửa sổ race vẫn chứa project vừa
  mở (name "C1 race project", clip C1TEXT, không có clip mẫu). Ngủ 7 s
  trước khi poll để debounce autosave 5 s sau một lần revert (nếu có)
  đã kịp ghi — đọc ngay sẽ pass oan (bẫy B1 đã gặp).
- **C6** nút "Tải lại dự án mẫu" (MediaBin) vẫn tải lại được sample sau
  đó — chứng minh loader không hỏng + cửa sổ race đã đóng thật
  (`loadSample` đã chạy xong trong lúc poll C4), nên C4 pass không phải
  vì `loadSample` chưa bao giờ chạy. Để case không rỗng: reset về
  project trống bằng nút "Tạo dự án mới" TRƯỚC khi bấm nút mẫu.
- **C7** 0 `Runtime.exceptionThrown` trong phiên.

## 3. Số đo (browser thật, Chromium headed dưới Xvfb)

### 3.1 Đỏ-trước — code chưa vá (tạm revert phần generation counter, chạy xong khôi phục, sha256 khớp bản đã vá)

- **Lượt này, 2026-11-05 ~07:20–07:23 UTC: 5/7, C4 FAIL + C5 FAIL**
  (kết quả lưu tại `~/workspace/tmp-round47-c1-race/c1-result-RED.json`):
  - C3 PASS — mở xong ở t+0.8 s sau khi đưa file (duration 00:10.0, tên
    "C1 race project", sample chưa sẵn sàng lúc đưa).
  - **C4 FAIL — REVERT ở +8.1 s sau khi mở:** duration 00:08.0, tên
    "Dự án mẫu", bin có mau-1.webm + mau-2.webm (đúng cơ chế B1 đo,
    chỉ chậm hơn B1 ~2 s do buildSample trên VM lần này).
  - **C5 FAIL — autosave bị ghi đè bằng mẫu:** name "Dự án mẫu",
    clips `["c_ih8tkbq","c_qtis4nh","c_ya6cm5a"]` (poll lần 24).
  - C1/C2/C7 PASS; C6 PASS (xem lưu ý trung thực ở §4.2 — lần revert
    này CHỈ gỡ phần generation counter, không gỡ `sampleLoading`
    reset ở `finally`, nên C6 pass trong lượt đỏ không chứng minh
    được gì về nút mẫu trên code gốc hoàn toàn chưa vá).
- Ghi chú về exit code: script trả exit 1 khi có FAIL (đúng thiết kế);
  trong log lượt này `CLICKTEST_EXIT=0` là do `echo $?` đọc nhầm exit
  của `tail` qua pipe, không phải exit của script — kết quả tin được
  là file `c1-result-RED.json` (5/7, 2 FAIL).

### 3.2 Xanh-sau — code đã vá

- **Lượt trước (trước daemon restart, 2026-11-05 ~07:11 UTC): 7/7 PASS**
  (kết quả còn trên đĩa tại
  `~/workspace/tmp-round47-c1-race/c1-result.json`): C3 mở xong ở
  t+0.6 s sau khi đưa file, C4 giữ 00:10.0 suốt 20 s, C5 autosave đúng
  project mới ngay poll lần 1, C6 reset về trống rồi bấm nút mẫu →
  duration 00:08.0 + tên "Dự án mẫu" + bin có mau.
- **Lượt này (sau khi khôi phục store.ts từ bản đã vá, sha256 khớp
  797a7ec5…035): 7/7 PASS, exit 0, 2026-11-05 ~07:24–07:25 UTC**
  (kết quả lưu tại `~/workspace/tmp-round47-c1-race/c1-result-GREEN.json`):
  C3 mở xong ở t+0.6 s sau khi đưa file, C4 giữ 00:10.0 suốt 20 s,
  C5 autosave đúng project mới ngay poll lần 1, C6 reset về trống rồi
  bấm nút mẫu → duration 00:08.0 + tên "Dự án mẫu" + bin có mau.

## 4. Cái gì chưa làm / giới hạn còn lại

1. **Chỉ chống được race đổi-project-trong-lúc-loadSample.** Nếu hai
   `loadSample` chạy chồng nhau (gọi lần 2 khi lần 1 còn bay), guard
   `sampleLoading` làm lần 2 return ngay; nếu lần 1 sau đó bị bỏ set
   do generation đổi thì không có lần nào load sample cả — user bấm
   lại nút "Dự án mẫu" thì được (guard đã reset), nhưng không tự
   retry. Chưa gặp trên UI thật (chỉ có 1 đường mount + 1 nút bấm),
   ghi nợ, không tự mở rộng phạm vi.
2. **`sampleLoading` reset ở `finally` là sửa kèm trong bản vá trên
   đĩa (không phải phần chính của generation counter):** trước đây cờ
   không bao giờ reset nên nút "Tải lại dự án mẫu" chết sau lần tải
   đầu — kể cả khi `buildSampleProject` ném lỗi (B1 §6.2). **Lưu ý
   trung thực về lượt đỏ:** lần revert đỏ-trước CHỈ gỡ các dòng
   generation counter (`genAtStart`, check, `projectGeneration += 1`),
   không gỡ `finally` reset — vì vậy C6 PASS trong lượt đỏ (không
   chứng minh được nút chết trên code gốc hoàn toàn chưa vá). C4/C5
   FAIL trong lượt đỏ vẫn là bằng chứng sạch cho generation counter,
   vì phần đó đã bị gỡ hoàn toàn. Không claim C6 đỏ-trước/xanh-sau.
3. **Chưa đo trên máy thật / Safari / tab ẩn:** chỉ Chromium headed
   dưới Xvfb trên VM này (n = 1 mỗi chiều đỏ/xanh). Race là logic
   async cấp store, không phụ thuộc trình duyệt, nhưng số giây
   (~10 s buildSample, revert ở +6 s) là số của VM này.
4. **Chưa có unit test Node cho generation counter:** như B1 đã phân
   tích (§6.2), race này cần wiring thật (fetch media mẫu, File,
   `URL.createObjectURL`, probe video) nên test Node mock nặng sẽ
   không chứng minh được gì; bằng chứng là click-test browser §3.
5. **Không đụng `TopBar.tsx` / `tsconfig.json`:** hai file này trên đĩa
   mới hơn baseline nhưng là của luồng C5 đợt 47 (toggle phát ngược
   WebCodecs), không thuộc batch C1.

## 5. Kiểm chứng

- `npx tsc --noEmit` (apps/web): sạch, exit 0, không output.
- `npx vite build` (apps/web, ra scratch `/tmp/vcut-c1-build-check`):
  sạch, exit 0, built trong 47.52 s (cảnh báo chunk > 500 kB có sẵn
  từ trước, không do đợt này).
- Click-test browser: đỏ-trước 5/7 (C4+C5 FAIL, §3.1), xanh-sau 7/7
  exit 0 (§3.2); lượt xanh của lượt trước cũng 7/7.
- Hồi quy Node trực tiếp (`node *.test.ts`, type-stripping, không
  vitest — repo không cài vitest): `projectRepo.test.ts` 10 pass,
  `projectRepoNested22.test.ts` 7 pass, `projectRepoRound26J5.test.ts`
  15 pass, `clipboard.test.ts` 18 pass, `loadReport.test.ts` 10 pass
  — tổng **60 pass, 0 fail**. Không có test Node nào chạm trực tiếp
  `loadSample`/`store.ts` (xem §4.4) nên hồi quy này chỉ chứng minh
  không vỡ đường load project kề bên, không phải bằng chứng cho vá.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- `apps/web/src/store.ts` (vá generation counter + reset `sampleLoading` ở `finally`)
- `apps/web/scripts/clicktest-47c1-loadsample-race.mjs` (mới)
- `docs/PHASE9_ROUND47_C1_LOADSAMPLE_LIMITS.md` (mới, file này)

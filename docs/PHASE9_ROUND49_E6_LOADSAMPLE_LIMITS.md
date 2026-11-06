# Phase 9 đợt 49 E6 — LIMITS: loadSample CASE D (call1 ném lỗi → retry) + unit test Node

**Luồng:** E6 (đợt 49). **Trạng thái:** ĐANG LÀM — khung LIMITS viết sớm,
cập nhật dần theo số đo.
**Nợ đóng:** đợt 48 §4 nợ 7 (`docs/PHASE9_ROUND48_D6_LOADSAMPLE_LIMITS.md`
§4.2: case D chưa đo riêng trên browser thật) + nợ D6 §4.4
(chưa có unit test Node cho queue/retry của `loadSample`).

## 0. Kết luận ngắn (không vượt số đo)

- **Case D ĐO XONG, xanh-sau 5/5 × 4 lượt:** call1
  ném lỗi ép (`TypeError` ở `stillSample`, xem §2) trong lúc call2 đã
  chồng nhau → retry chạy, mẫu xuất hiện sau **12,4 s / 11,5 s /
  12,1 s / 11,6 s** kể từ lúc bấm (t+13,6 / t+12,7 / t+13,3 / t+12,8 s
  sau render) —
  nhanh hơn case C của D6 (~15,1–15,6 s sau khi bấm) đúng như cơ chế:
  call1 chết ở ~render+4 s thay vì ~render+8 s nên retry bắt đầu sớm
  hơn ~4 s, còn lại vẫn là 1 lượt build mẫu ~8 s. Đỏ-trước (chỉ gỡ D6):
  **3/5 × 3 lượt** (E3 FAIL + E4 FAIL, E1/E2/E5 PASS) — không có retry
  thì mẫu không bao giờ về.
- **Unit test Node mới 13/13 pass** (`loadSampleQueue49E6.test.ts`):
  khóa 4 case A/B/C/D + các bất biến queue ở tầng logic thuần.
- Hồi quy: C1 7/7 × 3 lượt, D6 7/7 × 4 lượt (xem §3.3);
  Node cũ 60 pass; `tsc --noEmit` 0 lỗi; `vite build` pass (12,02 s).
- Compat trình duyệt thứ 2 vẫn chưa đo: không có binary Firefox/Safari
  (xem §4.1).

## 1. Case D là gì — vì sao phải đo riêng

D6 đã đo case C (call1 bị bỏ set do đổi project → retry chạy, mẫu về
sau ~15,1–15,6 s sau khi bấm). Case D khác case C ở điểm duy nhất:
call1 không bị bỏ set mà **ném lỗi** (`buildSampleProject` throw) —
nhánh retry đi qua cùng điều kiện `!didSet` nhưng `didSet` ở lại
`false` vì throw, không phải vì `return` sớm ở check thế hệ. Trên
code, throw đi qua `finally` (reset `sampleLoading` + xét retry) rồi
văng ra ngoài `loadSample` thành unhandled rejection (mọi caller UI
đều `void st.loadSample()`). Đo riêng để khẳng định: (a) throw không
làm kẹt queue, (b) retry vẫn chạy và ra mẫu, (c) không có vòng lặp
retry vô hạn, (d) thời gian retry khác case C bao nhiêu (call1 chết
sớm hơn → retry bắt đầu sớm hơn).

## 2. Cách ép call1 ném lỗi trên browser thật (chỉ can thiệp ở tầng test)

`buildSampleProject` (`apps/web/src/sample.ts`) không có đường nào ép
lỗi từ UI: `recordSample` nuốt mọi lỗi → `null`, fallback `stillSample`
vẽ PNG; lỗi `AssetStore` cũng được nuốt. Điểm duy nhất có thể ném là
`stillSample`: `canvas.getContext("2d")!` rồi `drawSampleFrame` dùng
`ctx` ngay — nếu `getContext` trả `null` thì ném `TypeError`.

Can thiệp test-only (không đổi production): `Page.addScriptToEvaluateOnNewDocument`
ghi đè `HTMLCanvasElement.prototype.getContext` — chỉ với canvas đúng
640×360 (cỡ canvas mẫu), chỉ lần gọi #2 và #3 trả `null`, còn lại
pass-through:

- #1 = `recordSample` variant 0 → chạy bình thường 4 s (cửa sổ chồng
  nhau đủ rộng cho lần bấm call2).
- #2 = `recordSample` variant 1 → `null` → `recordSample` trả `null`.
- #3 = `stillSample` variant 1 → `null` → `drawSampleFrame` ném
  `TypeError` → `buildSampleProject` ném → call1 ném lỗi ở ~render+4 s.
- Retry sau đó dùng #4/#5 bình thường → phải ra mẫu.

Đây là lỗi ép nhân tạo, không phải failure mode thực tế đã gặp —
ghi rõ để không đọc thành "lỗi thật của buildSampleProject". Cái được
chứng minh là nhánh retry sau throw (`!didSet` khi throw), không phải
nguồn lỗi.

## 3. Harness click-test (browser thật, không mock)

`node apps/web/scripts/clicktest-49e6-loadsample-case-d.mjs`
(Chromium headed + Xvfb, CDP websocket; build app mới ra scratch
`~/workspace/tmp-round49-e6-cased/dist`, static server cùng origin;
profile Chrome mới → không autosave → mount gọi `loadSample` = call1;
`E6_SKIP_BUILD=1` dùng lại dist đã build):

- **E1** app load (React render `#root` có children).
- **E2** bấm nút "Tải lại dự án mẫu" (MediaBin) trong lúc call1 còn bay
  (call2 chồng nhau, được ghi nhớ): bấm ở ~render+1,5 s, guard bấm
  < 5 s sau render (như D6) + bộ đếm `window.__e6ctx640` ≤ 1 lúc bấm
  (canvas variant 1 chưa tạo → call1 chưa thể ném trước khi bấm) +
  sample chưa sẵn sàng lúc bấm. Nếu bấm sau khi call1 đã ném thì đó
  là loadSample mới thường, không chứng minh được đường chồng nhau →
  INVALID.
- **E3** (case phân biệt) retry chạy: mẫu xuất hiện, và thời điểm xuất
  hiện PHẢI ≥ 8,5 s sau khi bấm (đường retry: call1 ném ở ~bấm+2,5 s
  + retry build ~8 s ≈ bấm+10,5 s). Nếu mẫu xuất hiện < 8,5 s sau khi
  bấm thì call1 đã thành công (ép lỗi thất bại) → INVALID, không được
  đọc thành pass. Trên code chưa vá D6 (đỏ-trước): call2 bị drop +
  call1 ném lỗi → không có lần nào load mẫu → FAIL sau 45 s.
- **E4** autosave sau E3 vẫn chứa mẫu (name "Dự án mẫu", clip
  mau-1/mau-2). Ngủ 7 s trước khi poll như C1 C5 (bẫy đọc autosave
  quá sớm).
- **E5** đúng 1 unhandled rejection trong phiên, nội dung là
  `TypeError: Cannot read properties of null` từ `drawSampleFrame`
  (lỗi ép của call1) — retry thành công nên không có rejection thứ 2.
  Thu bằng cả 2 đường: `Runtime.exceptionThrown` của CDP và
  `window.__e6rejections` (listener `unhandledrejection` cài qua
  script injection) — đường nào cũng phải khớp. Đã xác nhận bằng thực
  nghiệm (lượt đỏ 1): unhandled rejection của `void loadSample()` được
  Chrome báo qua `Runtime.exceptionThrown`, cả 2 đường đều thu đúng 1
  và cùng nội dung `TypeError: Cannot read properties of null
  (reading 'createLinearGradient')`.

### 3.1 Xanh-sau — code đã vá D6 (+ refactor E6 §5): 5/5 × 4 lượt

| Lượt | E2 bấm (sau render) | E3 mẫu xuất hiện sau khi bấm | Kết quả |
|---|---|---|---|
| xanh 1 | t+1,2 s (__e6ctx640=1) | 12,4 s (t+13,6 s sau render) | 5/5, exit 0 |
| xanh 2 | t+1,2 s (__e6ctx640=1) | 11,5 s (t+12,7 s sau render) | 5/5, exit 0 |
| xanh 3 | t+1,2 s (__e6ctx640=1) | 12,1 s (t+13,3 s sau render) | 5/5, exit 0 |
| xanh 4 | t+1,3 s (__e6ctx640=1) | 11,6 s (t+12,8 s sau render) | 5/5, exit 0 |

E3 ổn định 11,5–12,4 s sau khi bấm ở cả 4 lượt: khớp cơ chế call1
ném ở ~bấm+2,8 s (variant 0 ghi 4 s rồi variant 1 ném) + retry build
~8 s + overhead dừng MediaRecorder/poll ~1 s. `__e6ctx640=5` ở cuối
3 lượt đầu và =6 ở lượt xanh 4 (call1 dùng #1/#2/#3, retry dùng
#4/#5; lần thứ 6 là canvas thumbnail 640×360 của clip mẫu sau khi
retry set project xong — chỉ là quan sát phụ, guard lúc bấm vẫn =1 ở
cả 4 lượt). E4 autosave đúng ngay poll lần 1 ở cả 4 lượt (name
"Dự án mẫu", 3 clip mẫu). E5 đúng 1 rejection ở cả 4 lượt
(`TypeError: Cannot read properties of null (reading
'createLinearGradient')`, cả 2 đường thu window + CDP đều = 1) —
không có exception thứ 2 từ retry. Kết quả chi tiết:
`~/workspace/tmp-round49-e6-cased/e6-result-green{1,2,3,4}.json`
(+ `green{2,3,4}.log`; lượt 1 xem log trực tiếp).

### 3.2 Đỏ-trước — chỉ gỡ phần D6 (giữ nguyên generation counter C1): 3/5 × 3 lượt

Revert bằng script `~/workspace/tmp-round48-d6-overlap/revert-d6.py`
(đã dùng ở D6, assert mỗi chỗ đúng 1 lần); khôi phục bản xanh bằng
copy đã lưu `store.ts.E6-GREEN`, verify sha256
`6b8de646c0701eb4de25e41162d2275cad28a244ffe16b4b2a9ad41f0b077b5e`
khớp trước và sau mỗi lần revert (bản xanh này trùng đúng sha D6-GREEN
gốc — không luồng nào khác sửa `store.ts` từ đợt 48 tới lúc revert).

| Lượt | E2 bấm | E3 | Còn lại |
|---|---|---|---|
| đỏ 1 | t+1,2 s (__e6ctx640=1) | **FAIL — sau 45 s không thấy mẫu** | E1/E2/E5 PASS, E4 FAIL |
| đỏ 2 | t+1,2 s (__e6ctx640=1) | **FAIL — sau 45 s không thấy mẫu** | E1/E2/E5 PASS, E4 FAIL |
| đỏ 3 | t+1,2 s (__e6ctx640=1) | **FAIL — sau 45 s không thấy mẫu** | E1/E2/E5 PASS, E4 FAIL |

E4 FAIL là hệ quả của E3 (không có mẫu thì autosave không có mẫu:
`name=undefined clips=[]`). `__e6ctx640=3` ở cuối mỗi lượt đỏ
(call1 dùng #1/#2/#3 rồi ném, không có retry) và E5 PASS ở cả 3 lượt
đỏ — đúng kỳ vọng: E5 khóa "call1 ném đúng 1 lỗi ép", không phân
biệt đỏ/xanh; chỉ E3/E4 phân biệt. Kết quả chi tiết:
`e6-result-red{1,2,3}.json` (+ `red{2,3}.log`). Lưu ý: lượt đỏ 1 chạy
trước khi sửa wording chi tiết E5 (LIMITS §3 E5) nên detail của nó
còn câu "retry thành công" — wording cũ, không ảnh hưởng kết quả
(E5 vẫn PASS vì đếm đúng 1 rejection).

### 3.3 Hồi quy race trên code cuối (có refactor E6 §5)

- C1 (`clicktest-47c1-loadsample-race.mjs`, không sửa): **7/7 × 3
  lượt**, exit 0 — C4 giữ project mới 00:10.0 suốt 20 s ở cả 3 lượt,
  C5 autosave đúng, C6 nút mẫu tải lại được. Kết quả:
  `~/workspace/tmp-round49-e6-cased/c1-result-green-e6-{1,2,3}.json`.
- D6 (`clicktest-48d6-loadsample-overlap.mjs`, không sửa): **7/7 × 4
  lượt**, exit 0 — D4 mẫu về sau 15,0 / 15,1 / 15,5 / 15,1 s sau khi
  bấm (khớp 15,1–15,6 s của D6 gốc), D5 guard không-revert PASS,
  D7 0 exception. Lượt 1 build mới từ code cuối, lượt 2–4 dùng lại
  dist (`D6_SKIP_BUILD=1`). Kết quả:
  `~/workspace/tmp-round49-e6-cased/d6-result-green-e6-{1,2,3,4}.json`.
- Node: 60 pass cũ + 13 pass mới, xem §5/§6.

## 4. Cái gì chưa làm / giới hạn còn lại

1. **Compat trình duyệt thứ 2 vẫn chưa đo (không có binary
   Firefox/Safari) — đã quét lại ngày 05/11/2026, không tải, không
   claim.** `~/.cache/ms-playwright/` chỉ có `chromium-1248` +
   `ffmpeg-1013`; `which firefox / google-chrome / chromium` đều
   trống; `/usr/bin` không có binary firefox/chrome/chromium/webkit/
   safari nào; `~/.cache/google-chrome-for-testing-headless/` chỉ
   chứa thư mục `scoped_dir*` (profile tạm, không phải binary trình
   duyệt); Playwright không cài trong repo (`npm ls playwright`
   trống). Race/retry là logic async cấp store, không phụ thuộc trình
   duyệt — nhưng mọi số giây trong file này vẫn là số của Chromium
   headed dưới Xvfb trên VM này.
2. **Lỗi call1 là ép nhân tạo (§2):** không chứng minh `buildSampleProject`
   thật từng ném lỗi ngoài đời; chỉ chứng minh nhánh retry sau throw.
   Ngoài đời, `buildSampleProject` gần như không thể ném (mọi tầng
   đều nuốt lỗi/fallback) — case D thực tế hiếm; giá trị của phép đo
   là khóa nhánh `!didSet` khi throw, không phải săn lỗi thật.
3. **Chưa đo case D với lần đổi project xen vào:** chỉ đo D thuần
   (call1 ném + call2 chồng, không ai đổi project). Tổ hợp D+B
   (call1 ném + user đổi project sau lần bấm) chỉ có khóa ở tầng
   logic thuần (test §5 "case B" + "luồng đầy đủ case B"), chưa đo
   trên browser thật — cùng một điều kiện gen như case B của D6
   (đã đo browser), nên rủi ro thấp nhưng vẫn ghi rõ là chưa đo.
4. **Số đo under-load:** các lượt đo chạy trong lúc nhiều luồng đợt 49
   khác cũng chạy Chrome/build trên cùng VM 2vCPU; thời gian tuyệt đối
   (11,5–12,4 s) không phải baseline quiet — chỉ dùng để so sánh
   tương đối với case C của D6 trên cùng VM.
5. **Không đụng file của luồng khác:** chỉ `store.ts` (phần queue/retry
   loadSample — hunk của E6, xem §5), `tsconfig.json` (1 dòng exclude
   cho test mới; dòng exclude của E4 do E4 tự thêm, không phải của
   luồng này), harness E6 mới, module + test mới, LIMITS này. Lúc
   chạy `tsc` lần đầu (trước khi E4 thêm exclude cho test của họ),
   tsc báo 2 lỗi TS5097 ở file test E4 — không phải lỗi của luồng
   này; chạy lại sau khi E4 thêm exclude thì tsc 0 (xem §6).

## 5. Unit test Node cho queue/retry (nợ D6 §4.4) — XONG, 13/13 pass

- Module thuần mới: `apps/web/src/lib/loadSampleQueue.ts` (không import
  gì, không DOM) — tách đúng logic quyết định coalesce/retry khỏi
  `store.ts` để test được ở Node; `store.ts` chỉ còn gọi nó.
- Test mới: `apps/web/src/lib/loadSampleQueue49E6.test.ts` — chạy bằng
  `node apps/web/src/lib/loadSampleQueue49E6.test.ts` từ repo root
  (type-stripping, không vitest — repo không cài vitest).
- Kết quả: **13 pass, 0 fail** — khóa 4 case A/B/C/D trong bảng D6 §1
  (A: set thành công → không retry; B: đổi project sau bấm → không
  retry; C: đổi project trước bấm → retry; D: throw → retry) + các bất
  biến: chồng nhau nhiều lần chỉ giữ 1 yêu cầu chờ (gen mới nhất
  thắng), `finish` xóa queue trước khi trả `true` (không vòng lặp vô
  hạn), `noteOverlapping` ngoài lúc loading bị bỏ qua, sau `finish`
  thì `begin` lại được như lượt độc lập, 2 luồng đầy đủ case D và
  case B (call → chồng → finish → retry/bỏ → dừng).
- Đối chiếu refactor `store.ts` (hành vi giữ nguyên từng dòng):
  `sampleLoading` + `sampleReloadQueued`/`sampleReloadGen` (3 biến
  module-level) → 1 instance `loadSampleQueue`; guard
  `if (sampleLoading) { note; return; } sampleLoading = true;` →
  `if (!loadSampleQueue.begin()) { noteOverlapping(gen); return; }`
  (begin trả false đúng khi đang bay, true thì set loading); khối
  `finally` (reset cờ + `if (sampleReloadQueued) { xóa; if (!didSet
  && gen === projectGeneration) void get().loadSample(); }`) →
  `if (loadSampleQueue.finish(didSet, projectGeneration))
  void get().loadSample();` (finish reset loading + xóa queue trước
  khi xét điều kiện — cùng thứ tự). `didSet`/`genAtStart`/
  `projectGeneration` không đổi. Sau refactor, grep
  `sampleLoading|sampleReload` trong `store.ts` chỉ còn 1 hit trong
  comment lịch sử (§6 C1). Bằng chứng hành vi giữ nguyên không chỉ
  là test Node: hồi quy browser C1/D6 trên code cuối (§3.3) + case D
  xanh-sau 5/5 chạy TRÊN code đã refactor (lượt xanh 1–3 build từ
  code cuối, không phải code D6 gốc).

## 6. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** (exit 0). Lưu ý: lần chạy
  đầu báo 2 lỗi TS5097 ở `src/lib/projectRepoRound49E4.test.ts` (file
  test của luồng E4, import có đuôi `.ts`) — lúc đó E4 chưa thêm
  dòng exclude cho file của họ vào `tsconfig.json`; chạy lại sau khi
  E4 thêm exclude thì sạch. Không phải lỗi của luồng này, không sửa
  file E4.
- `npx vite build` (apps/web, ra scratch `/tmp/vcut-e6-build-check`):
  sạch, exit 0, built trong 12,02 s (cảnh báo chunk > 500 kB có sẵn từ
  trước, không do đợt này).
- Click-test browser case D: đỏ-trước 3/5 (E3+E4 FAIL) × 3 lượt,
  xanh-sau 5/5 × 4 lượt (§3.1–3.2).
- Hồi quy Node trực tiếp (`node *.test.ts`, type-stripping, từ repo
  root): `projectRepo.test.ts` 10 pass, `projectRepoNested22.test.ts`
  7 pass, `projectRepoRound26J5.test.ts` 15 pass, `clipboard.test.ts`
  18 pass, `loadReport.test.ts` 10 pass — tổng **60 pass, 0 fail** —
  cộng test mới `loadSampleQueue49E6.test.ts` **13 pass, 0 fail**.
- Hồi quy race browser C1/D6 trên code cuối: C1 7/7 × 3, D6 7/7 × 4
  (§3.3).

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- `apps/web/scripts/clicktest-49e6-loadsample-case-d.mjs` (mới)
- `apps/web/src/lib/loadSampleQueue.ts` (mới)
- `apps/web/src/lib/loadSampleQueue49E6.test.ts` (mới)
- `apps/web/src/store.ts` (nối `loadSample` sang `LoadSampleQueue`, giữ
  nguyên hunk của luồng khác — kiểm tra E4 trước khi sửa)
- `apps/web/tsconfig.json` (thêm exclude cho test mới, theo tiền lệ)
- `docs/PHASE9_ROUND49_E6_LOADSAMPLE_LIMITS.md` (mới, file này)

Scratch đo (ngoài repo, để parent đối chiếu):
`~/workspace/tmp-round49-e6-cased/` — `e6-result-red{1,2,3}.json`,
`e6-result-green{1,2,3,4}.json`, `red{2,3}.log`, `green{2,3,4}.log`,
`c1-result-green-e6-{1,2,3}.json` (+ `c1-e6-{1,2,3}.log`),
`d6-result-green-e6-{1,2,3,4}.json` (+ `d6-e6-{1,2,3,4}.log`),
`store.ts.E6-GREEN` (bản xanh gốc, sha256
`6b8de646c0701eb4de25e41162d2275cad28a244ffe16b4b2a9ad41f0b077b5e`),
`dist/` (build từ code cuối, dùng cho lượt xanh 2–4),
`e6-chrome.log`, `cdprof-e6/`.

# Phase 9 đợt 50, luồng F6 — LIMITS: loadSample case D+B browser thật + fail-fast/quirk headed (fixture mới)

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ thêm file text trong phạm vi luồng (harness +
LIMITS này); production code KHÔNG đổi — mutation đỏ tạm thời đã khôi
phục + verify sha256 (xem §1.3). Mọi số dưới đây đều đo/chạy thật; chỗ
nào chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **LoadSample case D+B ĐO XONG trên browser thật, xanh-sau 6/6 × 4
   lượt** (§1): call1 ném lỗi ép (TypeError ở `stillSample`, như E6)
   + user bấm "Tạo dự án mới" sau lần bấm mẫu, trước khi call1 ném →
   retry KHÔNG chạy: project mới ở yên "Dự án mới" suốt 25 s poll,
   mẫu không bao giờ xuất hiện, `__e6ctx640` dừng ở 3 (không có
   retry dùng canvas #4/#5), autosave vắng (đúng thiết kế), đúng 1
   unhandled rejection là lỗi ép của call1. Đỏ-trước bằng mutation
   (bỏ kiểm tra thế hệ trong `finish`): **4/6 — F4+F5 FAIL**, mẫu về
   ở +11,7 s sau khi bấm Mới và revert project mới thành "Dự án mẫu".
   Đỏ-trước bằng cách gỡ D6 KHÔNG làm được trên code hiện tại (script
   revert D6 assert-fail vì E6 đã refactor queue sang
   `loadSampleQueue.ts` — xem §1.3); và dù gỡ được thì kết quả cũng
   giống xanh (không queue thì không retry), nên mutation mới là phép
   đỏ phân biệt đúng cho case này.
2. **Fail-fast seek-landing-0 (tầng currentTime) VẪN NOT_MEASURED**,
   nhưng đã thử thêm **5 hướng fixture mới × 2 lượt** (§2): zero toàn
   bộ GOP 1, giữ keyframe + zero P/B GOP 1, zero 1 packet P-frame ở
   1.5, cắt đuôi file ở đầu keyframe 2.0 (giữ moov/stss), zero toàn bộ
   GOP 2 — không hướng nào cho landing sai ở mức currentTime: hoặc
   hỏng pipeline error 3 (cùng chữ ký cũ), hoặc đáp đúng.
3. **Phát hiện mới có bằng chứng headed ở tầng PIXEL (§2.3): file cắt
   đuôi (GOP 2 đã mất, moov còn nguyên) seek 2.5 vẫn bắn `seeked@2.5`,
   error null, rs 4 — nhưng frame hiển thị là FRAME CŨ** (frame 0.0
   nếu chưa seek trước đó; frame 1.5 nếu vừa seek 1.5 trước đó),
   ổn định qua 4 probe. Tức Chrome giữ frame đã trình bày khi không
   decode được frame đích, trong khi currentTime vẫn báo đúng —
   `seekElement` / `WrongLandingTracker` (chỉ nhìn currentTime) không
   thể phát hiện lớp sai này. Đây là quirk đáp sai frame ở tầng pixel,
   không phải quirk đáp sai currentTime mà nợ gốc hỏi — ghi rõ để
   không đọc lẫn.
4. **Hồi quy (§3):** tsc 0 lỗi, vite build pass, pause 111/111,
   Node loadSample E6 13/13 + 60 pass cũ, browser C1 7/7 + D6 7/7.

## 1. LoadSample case D+B trên browser thật

### 1.1 Case D+B là gì

E6 đo case D thuần (call1 ném + call2 chồng, không ai đổi project →
retry chạy, mẫu về sau ~11,5–12,4 s sau khi bấm). Case D+B thêm một
bước: user đổi project SAU lần bấm chồng (bấm "Tạo dự án mới" →
`newProject`, gen 0→1) nhưng TRƯỚC khi call1 ném (~render+4 s).
Kỳ vọng theo `LoadSampleQueue.finish`: `finish(false, gen=1)` với
yêu cầu chờ ghi ở gen 0 → `false` → không retry; project mới của
user ở yên. Tầng logic thuần đã khóa ở test Node E6 ("luồng đầy đủ
case B": `finish(false, genMới) = false`); harness này khóa trên
browser thật, gồm cả đường UI đổi project (`doNew` → `newProject` →
`clearAutosave` → `markSaved`) mà test Node không chạm tới.

### 1.2 Harness click-test

`apps/web/scripts/clicktest-50f6-loadsample-case-db.mjs` (mới, theo
mẫu E6; Chromium headed + Xvfb, CDP websocket; build app mới ra
scratch `~/workspace/tmp-round50-f6-casedb/dist`, static server cùng
origin; `F6_SKIP_BUILD=1` dùng lại dist). Ép lỗi call1 y hệt E6:
`Page.addScriptToEvaluateOnNewDocument` ghi đè
`HTMLCanvasElement.prototype.getContext` — chỉ canvas 640×360, chỉ
lần gọi #2/#3 trả `null` (lỗi ép nhân tạo, không phải failure mode
thực tế — cái được chứng minh là nhánh retry sau throw khi thế hệ
đã đổi).

- **F1** app load (React render `#root` có children).
- **F2** bấm nút "Tải lại dự án mẫu" trong lúc call1 còn bay (call2
  chồng nhau, ghi nhớ ở gen 0): guard như E6 — bấm ở ~render+1,5 s
  (< 5 s), `__e6ctx640 ≤ 1` lúc bấm (canvas variant 1 chưa tạo →
  call1 chưa thể ném), sample chưa sẵn sàng lúc bấm. Vi phạm →
  INVALID, không được đọc thành pass.
- **F3** bấm "Tạo dự án mới" SAU lần bấm F2, TRƯỚC khi call1 ném:
  guard `__e6ctx640 ≤ 1` lúc bấm (call1 chưa ném) + poll ≤ 5 s
  thấy tên "Dự án mới", không duration mẫu, bin không mau. Nếu
  call1 đã ném trước khi đổi project thì đó là case D thuần, không
  phải D+B → INVALID.
- **F4** (case phân biệt) KHÔNG retry: poll 25 s sau F3, project
  PHẢI ở yên "Dự án mới" — mẫu không bao giờ xuất hiện (duration
  không thành 00:08.0, tên không thành "Dự án mẫu", bin không bao
  giờ có mau). Bất kỳ lần nào thấy mẫu là FAIL (retry đã chạy và
  revert project user vừa tạo). Cuối poll, `__e6ctx640` PHẢI = 3
  (call1 dùng #1/#2/#3 rồi ném, không có retry dùng #4/#5).
- **F5** autosave sau F4 KHÔNG chứa mẫu: kỳ vọng autosave VẮNG
  (raw null) — xem §1.4. Cũng chấp nhận autosave có mặt với name
  "Dự án mới" + không clip mau. FAIL chỉ khi autosave chứa mẫu.
- **F6** đúng 1 unhandled rejection trong phiên, nội dung TypeError
  `Cannot read properties of null` từ `drawSampleFrame` (lỗi ép của
  call1) — chứng minh call1 THẬT SỰ đã ném. Cần thiết vì: nếu
  injection hỏng, call1 thành công thì set stale cũng bị chặn bởi
  gen nên F4 vẫn pass oan; chỉ F6 phân biệt được. Thu bằng cả 2
  đường: `Runtime.exceptionThrown` của CDP và
  `window.__e6rejections` — đường nào cũng phải khớp.

### 1.3 Xanh-sau 6/6 × 4 lượt + đỏ-trước

Xanh-sau (code cuối, không đổi production):

| Lượt | F2 bấm | F3 bấm | F4 | F5 | F6 |
|---|---|---|---|---|---|
| xanh 1 (F6_SKIP_BUILD, sau khi sửa kỳ vọng F5) | t+1,2 s (ctx=1) | t+1,3 s (ctx=1), mới hiện sau 0,4 s | PASS, ctx=3 cuối poll | PASS, autosave vắng | PASS, đúng 1 rejection |
| xanh 2 | t+1,2 s (ctx=1) | t+1,2 s (ctx=1), mới hiện sau 0,1 s | PASS, ctx=3 | PASS, autosave vắng | PASS, đúng 1 rejection |
| xanh 3 | t+1,2 s (ctx=1) | t+1,3 s (ctx=1), mới hiện sau 0,1 s | PASS, ctx=3 | PASS, autosave vắng | PASS, đúng 1 rejection |
| xanh 4 (build mới sau khi khôi phục mutation đỏ) | t+1,3 s (ctx=1) | t+1,5 s (ctx=1), mới hiện sau 0,1 s | PASS, ctx=3 | PASS, autosave vắng | PASS, đúng 1 rejection |

F6 ở cả 4 lượt: `window.__e6rejections=1`, CDP exceptions=1, cùng
nội dung `TypeError: Cannot read properties of null (reading
'createLinearGradient')` — đúng 1 lỗi ép của call1, không có
exception nào khác. Kết quả chi tiết:
`~/workspace/tmp-round50-f6-casedb/f6-result-green{1b,2,3,4}.json`
(+ `f6-chrome.log`, `cdprof-f6/`, `dist/`).

Đỏ-trước — mutation (không gỡ được D6, xem dưới): tạm sửa
`loadSampleQueue.ts` `finish` từ `return !didSet && gen ===
currentGen;` thành `return !didSet;` (bỏ kiểm tra thế hệ), build
mới, chạy harness → **4/6: F4 FAIL + F5 FAIL**, F1/F2/F3/F6 PASS:

- F4 FAIL: mẫu xuất hiện ở **+11,7 s sau khi bấm Mới**, tên thành
  "Dự án mẫu", duration 00:08.0 — retry đã chạy và revert project
  user vừa tạo (khớp cơ chế: call1 ném ở ~render+4 s + retry build
  ~8 s).
- F5 FAIL: autosave name "Dự án mẫu", clips mau (retry set xong
  thì autosave debounce ghi lại mẫu).
- F6 vẫn PASS (đúng 1 rejection) — mutation chỉ bỏ check thế hệ,
  không đổi đường ném lỗi.

Khôi phục sau lượt đỏ: copy lại bản xanh đã lưu
(`/tmp/f6-loadSampleQueue-GREEN.ts`), verify sha256
`d0bab683c64bd4d1c6637abed92bc18087893624e3b269e73759c19833238d74`
khớp trước và sau mutation (0 lần xuất hiện chuỗi `MUTATION-RED`
sau khôi phục), build mới + chạy lại xanh 4 → 6/6 (xác nhận code
đã về đúng bản xanh).

Đỏ-trước bằng cách gỡ D6: KHÔNG làm được trên code hiện tại.
Script revert D6 (`~/workspace/tmp-round48-d6-overlap/revert-d6.py`)
assert-fail ngay chỗ đầu tiên ("khối khai báo queue: tìm thấy 0
lần, kỳ vọng 1") vì E6 đã refactor queue/retry sang
`loadSampleQueue.ts` — các biến `sampleLoading` /
`sampleReloadQueued` / `sampleReloadGen` không còn trong `store.ts`.
Và dù gỡ được thì kết quả cũng giống xanh: không queue thì không
retry, D+B cho ra "không mẫu" cả hai đường — phép gỡ D6 không phân
biệt được case này. Mutation bỏ check thế hệ mới là phép đỏ đúng:
nó mô phỏng đúng lớp bug mà F4 khóa ("retry không kiểm tra thế
hệ").

### 1.4 Sửa kỳ vọng F5 trong lúc chạy (không phải sửa production)

Lượt xanh đầu tiên chạy ra **5/6 — F5 FAIL** với `autosave
name=undefined clips=[]` (raw null: không có autosave). Chẩn đoán:
đó là kỳ vọng của harness sai, không phải bug sản phẩm. Chuỗi đúng
theo code: `doNew` → `st.newProject()` (set spec mới → subscribe
autosave ở App.tsx đặt timer debounce 5 s) → `clearAutosave()` ngay
sau đó trong cùng call stack (xóa timer + xóa key) → `markSaved`
→ sau đó không còn lần đổi spec nào (call1 ném, retry không chạy)
nên không có gì ghi lại autosave nữa. Project trống chưa chạm gì
thì không có gì để autosave — đúng thiết kế. Đã sửa F5 trong
harness: chấp nhận autosave VẮNG (poll lần 1) hoặc autosave có mặt
với name "Dự án mới" + không clip mau; FAIL chỉ khi autosave chứa
mẫu. Chạy lại sau sửa: 6/6 (lượt xanh 1b). Không sửa production
code để "cho vừa" test.

### 1.5 Không có test Node mới cho D+B

Logic thuần của D+B đã khóa ở test E6
(`loadSampleQueue49E6.test.ts`, "luồng đầy đủ case B": call →
chồng → đổi gen → `finish(false, genMới) = false` → bấm lại chạy
lượt mới) — không viết test Node trùng lặp. Không có file `.ts`
mới nên không cần thêm dòng exclude vào `tsconfig.json`.

## 2. Fail-fast seek-landing-0 + quirk frame khác 0 headed — hướng fixture mới

Harness chính: `apps/web/scripts/pause50F6-quirk.mjs` (mới, mẫu E4:
Xvfb + chromium-1248 + cờ C3, tab mới mỗi probe, trang raw +
seekElement; exit 0 khi PASS / NOT_MEASURED / OBSERVED). Fixture
gốc Y2 `valid-gop.mp4` md5 `2c2e4771954fd26e1c377ce5900e377d` (3 s,
keyframe I ở 0.0/1.0/2.0, 30 fps, moov NẰM TRƯỚC mdat nên cắt đuôi
file không chạm moov/stss). Chrome `156.0.8078.4`.

### 2.1 Năm hướng fixture mới (đều chưa thử ở C3/D3/E4)

| Hướng | Fixture | Cách làm | Kết quả ở mức raw (2 lượt, giống hệt nhau) |
|---|---|---|---|
| V1 zero toàn bộ GOP 1 | `var-gop1zero.mp4` (30 packet, 104.408 byte, pos 101.878–206.286) | zero pts 1.0–2.0, giữ nguyên độ dài file/offsets/moov | seek 1.5 → **error code 3** `timestamp=1133333 size=4779 is_key_frame=0`, seeking kẹt rs 1 (cùng chữ ký C3/D3/E4: lỗi bung ở packet P-frame đầu sau keyframe hỏng); seek 2.5 → **`seeked@2.500`** (GOP 2 nguyên) |
| V2 giữ keyframe, zero P/B GOP 1 | `var-gop1pzero.mp4` (29 packet, 94.479 byte, pos 111.807–206.286) | zero pts 1.0333–2.0, keyframe 1.0 còn nguyên | seek 1.5 → **error code 3** `timestamp=1066667 size=3304` — decoder KHÔNG "xuất keyframe 1.0 rồi tiếp tục" như giả thuyết; gặp P-frame hỏng đầu tiên là hỏng pipeline |
| V3 zero 1 packet P-frame ở frame đích | `var-p15zero.mp4` (2 packet, 7.122 byte, pts 1.5 + 1.5333) | zero pts 1.5–1.5334 | seek 1.5 → **error code 3** `timestamp=1433333 size=3083` — không đáp frame tốt gần nhất, không đáp đúng |
| V4 cắt đuôi file, giữ moov/stss | `var-trunc-gop2.mp4` (cắt ở offset 206.286 = đầu keyframe 2.0; 313.311 → 206.286 byte) | `data.subarray(0, cutAt)`; moov khai duration 3 s / 3 keyframe nhưng sample GOP 2 không còn trong mdat | seek 2.5 → **`seeked@2.500`**, error null, rs 4 — currentTime "đáp đúng" dù dữ liệu đã mất (xem §2.3: frame hiển thị mới là chuyện khác); seek 1.5 → `seeked@1.500` (GOP 1 còn nguyên — đối chứng file cắt vẫn chơi được phần còn lại) |
| V5 zero toàn bộ GOP 2 | `var-gop2zero.mp4` (30 packet, 107.025 byte, pos 206.286–313.311) | zero pts 2.0–3.0 | seek 2.5 → **error code 3** `timestamp=2066667 size=4255` |

Đối chứng cả 2 lượt: valid raw 1.5 `seeked@1.500` PASS;
seekElement valid 1.5: 1 landing @1.5, `{seeked:true,
timedOut:false}`, 190/208 ms, PASS. Không biến thể nào đáp sai ở
mức currentTime nên không có probe seekElement trên biến thể (R10
bỏ qua) → **fail-fast seek-landing-0 headed (tầng currentTime)
VẪN NOT_MEASURED**. Kết quả chi tiết: `/tmp/f6-quirk-run{1,2}.log`
(scratch `/tmp/pause50f6-quirk-8156/` + `/tmp/pause50f6-quirk-15795/`).

### 2.2 Cộng dồn với các đợt trước

Chrome 156 gặp packet hỏng (zero hay 0xFF, keyframe hay P-frame,
GOP đầu/giữa/cuối, 1 packet hay cả GOP) thì hoặc đáp đúng, hoặc
hỏng pipeline error 3 — chưa bao giờ đáp sai currentTime. Cộng 5
hướng mới đợt này, số hướng fixture đã thử mà không tạo được
landing sai currentTime lên: zero keyframe các vị trí (C3/D3/E4),
điền 0xFF (D3), thêm track audio (D3), 2 track video (E4), zero cả
GOP, giữ keyframe + zero P/B, zero 1 P-frame đích, cắt đuôi giữ
moov. Biến binary/cờ Chrome Y2 gốc vẫn mở (không còn bản ghi; binary
meta-chromium 155 trên máy không load được trang probe loopback —
D3 §4.2 đã chẩn đoán tới cùng, không lặp lại).

### 2.3 Phát hiện mới ở tầng pixel: seek "đáp đúng" currentTime nhưng hiển thị frame cũ

V4 (file cắt đuôi) seek 2.5 bắn `seeked@2.500` trong khi dữ liệu
frame 2.5 không còn — currentTime đúng không đồng nghĩa frame
đúng. Probe pixel riêng
(`apps/web/scripts/pause50F6-quirk-pixels.mjs`, mới): seek rồi
`drawImage` lên canvas 160×90, hash FNV-1a trên pixel mẫu + mean
RGB; mỗi probe một tab mới; fixture lấy từ scratch lần chạy quirk
chính. Lần chạy đầu của probe này hỏng do lỗi harness (trang probe
kiểm tra `atSeeked` trước khi seek nên không bao giờ seek — đã sửa,
không ảnh hưởng kết quả sau).

| Probe | File / seek | Hash frame | mean RGB | Kết luận |
|---|---|---|---|---|
| P1 valid 2.5 | valid-gop @2.5 | `8a8a7fa5` | [122,106,126] | tham chiếu frame 2.5 |
| P2 trunc 2.5 | var-trunc @2.5 | `d4828fc3` | [121,106,126] | = frame 0.0 (P7), ≠ 2.5 |
| P3 valid 1.9 | valid-gop @1.9 | `f86c21ed` | [121,107,125] | tham chiếu |
| P4 valid 2.0 | valid-gop @2.0 | `bb5c122b` | [121,107,125] | tham chiếu |
| P5 trunc 1.5 | var-trunc @1.5 | `cdb6c1e3` | [121,107,126] | = valid @1.5 (P6) — đối chứng hash có nghĩa, file cắt chơi đúng GOP 1 |
| P6 valid 1.5 | valid-gop @1.5 | `cdb6c1e3` | [121,107,126] | tham chiếu |
| P7 valid 0.0 | valid-gop @0.0 | `d4828fc3` | [121,106,126] | tham chiếu frame 0 |
| P8 trunc 2.5 (lặp lại) | var-trunc @2.5 | `d4828fc3` | [121,106,126] | lặp lại P2, ổn định |
| P9 trunc 1.5→2.5 (hai bước) | var-trunc @1.5 rồi @2.5 | `cdb6c1e3` | [121,107,126] | = frame 1.5 (P6) — frame HIỆN TẠI trước lần seek, không phải 0.0 |
| P10 valid 1.5→2.5 (đối chứng) | valid-gop @1.5 rồi @2.5 | `8a8a7fa5` | [122,106,126] | = frame 2.5 — đường hai bước hoạt động đúng trên file lành |

5 frame tham chiếu đều khác hash nhau (đối chứng phương pháp
phân biệt được frame). Kết luận: **Chrome giữ nguyên frame đang
trình bày khi không decode được frame đích, nhưng vẫn bắn
`seeked` với currentTime = thời gian đích.** Từ trạng thái mới
load (frame hiện = 0.0) seek 2.5 → hiển thị frame 0.0; sau khi đã
seek 1.5 (frame hiện = 1.5) seek 2.5 → hiển thị frame 1.5. Không
phải màn đen (mean RGB ~[121,106,126], không phải ~0), không phải
reset về 0 có chủ ý — mà là giữ frame cũ. Hệ quả cho sản phẩm:
mọi kiểm tra seek chỉ nhìn currentTime (như `seekElement` /
`WrongLandingTracker`) đều PASS trong khi frame vẽ ra đã sai —
lớp sai này cần kiểm tra ở tầng pixel mới bắt được (chưa xây trong
luồng này). Đây là bằng chứng headed cho "đáp sai frame" ở tầng
pixel, nhưng KHÔNG phải quirk đáp sai currentTime mà nợ gốc hỏi —
fail-fast seek-landing-0 (currentTime) vẫn NOT_MEASURED (§2.1).

## 3. Kiểm chứng gộp của luồng

- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npx vite build --outDir /tmp/f6-vite-build-check`: **pass**
  (21,31 s; cảnh báo chunk > 500 kB có sẵn từ trước).
- Hồi quy pause tổng (chạy lại độc lập, strip-types, trừ pause45A2
  chạy esbuild như mẫu C3): seek **15/15**,
  seekZeroLanding44Z2 **5/5**, pauseLoopGuard44Z2 **11/11**,
  pauseSeekCap42X2 **22/22**, pauseSeekRecovery43Y2 **9/9**,
  pauseDraw40V3 **11/11**, pauseDraw41W2 **13/13**,
  pause46B2 **11/11**, pause45A2 **14/14** — cộng lại
  **111/111, fail 0**.
- Hồi quy Node loadSample + cổng load: `loadSampleQueue49E6`
  **13/13**, `projectRepo` **10 pass**, `projectRepoNested22`
  **7 pass**, `projectRepoRound26J5` **15 pass**, `clipboard`
  **18 pass**, `loadReport` **10 pass** — cộng **73 pass, 0 fail**.
- Hồi quy race browser trên code cuối (build mới, không SKIP_BUILD):
  C1 (`clicktest-47c1-loadsample-race.mjs`) **7/7**, D6
  (`clicktest-48d6-loadsample-overlap.mjs`) **7/7** — kết quả
  `~/workspace/tmp-round47-c1-race/c1-result.json`,
  `~/workspace/tmp-round48-d6-overlap/d6-result.json`.
- Click-test D+B: đỏ-mutation 4/6 (F4+F5 FAIL) × 1 lượt, xanh-sau
  6/6 × 4 lượt (§1.3).
- Headed quirk: 2 lần chạy harness chính (5 kiểm tra, FAIL = 0 mỗi
  lần; fail-fast NOT_MEASURED); 3 lần chạy probe pixel (lần 1 hỏng
  do lỗi harness, đã sửa; lần 2–3 exit 0, 3–4 kiểm tra, FAIL = 0).
- `node --check` cả 3 harness mới: OK.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 50, phiên solo thật, đo IDB thật, Safari / máy thật.

## 4. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI (3 harness + LIMITS này):

- `apps/web/scripts/clicktest-50f6-loadsample-case-db.mjs` — harness
  click-test case D+B (§1).
- `apps/web/scripts/pause50F6-quirk.mjs` — harness 5 hướng fixture
  mới cho fail-fast/quirk (§2.1).
- `apps/web/scripts/pause50F6-quirk-pixels.mjs` — probe pixel cho
  file cắt đuôi (§2.3).
- `docs/PHASE9_ROUND50_F6_LOADSAMPLE_PAUSE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file `.ts`/`.tsx` production (kể cả
`loadSampleQueue.ts` — mutation đỏ đã khôi phục byte-identical,
sha256 `d0bab683…` khớp trước/sau), `store.ts`, `tsconfig.json`,
paths-loop, build-loop-log (parent ghi log lượt). Scratch + fixture
+ dist tạm ở `~/workspace/tmp-round50-f6-casedb/`,
`/tmp/pause50f6-quirk-8156/`, `/tmp/pause50f6-quirk-15795/`,
`/tmp/f6-vite-build-check`, `/tmp/f6-quirk-run{1,2}.log`,
`/tmp/f6-quirk-pixels-run{1,2,3}.log`, `/tmp/f6-frame-*.png`,
`/tmp/f6-loadSampleQueue-GREEN.ts` (không vào repo, không vào
batch).

## 5. Nợ mở (không mạo nhận đã xong)

1. **Fail-fast seek-landing-0 headed (tầng currentTime) vẫn thiếu**
   (Z2 + mở rộng B2/C3/D3/E4 + F6): 5 hướng fixture mới đợt này đều
   không tạo được landing sai currentTime. Cần đúng binary/cờ của
   phiên Chrome Y2 gốc (không còn bản ghi), hoặc một fixture đáp sai
   currentTime ổn định khác — chưa có.
2. **Quirk đáp sai frame ở tầng pixel đã đo được một trường hợp**
   (§2.3) nhưng chỉ trên file cắt đuôi (dữ liệu GOP mất hẳn — trường
   hợp biên, không phải footage hỏng thường gặp). Chưa biết Chrome có
   giữ frame cũ như vậy với các dạng hỏng khác không (vd. zero
   keyframe: ở đó pipeline error 3 nên không có frame để giữ — đã
   đo), và preview của VCut có đường nào phát hiện frame stale không
   (hiện tại `seekElement` chỉ nhìn currentTime) — cần đợt sau đánh
   giá có nên thêm kiểm tra pixel vào đường seek/preview không, và
   chi phí ra sao.
3. **Compat trình duyệt thứ 2 vẫn chưa đo** (không có binary
   Firefox/Safari — như E6 §4.1): mọi số giây/hash trong file này
   vẫn là số của Chromium 156 headed dưới Xvfb trên VM này.
4. **Lỗi call1 là ép nhân tạo** (như E6 §4.2): không chứng minh
   `buildSampleProject` thật từng ném lỗi ngoài đời; chỉ chứng minh
   nhánh retry sau throw khi thế hệ đã đổi. Ngoài đời,
   `buildSampleProject` gần như không thể ném — case D+B thực tế
   hiếm; giá trị của phép đo là khóa nhánh `!didSet && gen ===
   currentGen`, không phải săn lỗi thật.
5. **Số đo under-load:** các lượt đo chạy trong lúc nhiều luồng đợt
   50 khác cũng chạy Chrome/build trên cùng VM 2vCPU; thời gian tuyệt
   đối (vd. F4 +11,7 s ở lượt đỏ) không phải baseline quiet — chỉ
   dùng để so sánh tương đối với case D của E6 trên cùng VM.

# Phase 9 đợt 62, luồng R10 — Đóng nợ đo headed đợt 61 (§5.4 R4 + §5.5 R5): LIMITS

Ngày: 08/11/2026 (lượt cron 06:35 +07; đo headed 00:04–00:17 +07).
Phạm vi: CHỈ ĐO — không sửa code sản phẩm (không có bug thật nào lòi ra
trong lúc đo; mọi FAIL đều là lỗi harness/file test, đã sửa harness và
đo lại xanh — xem §5). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG sửa `vi.json`/`en.json` (không có key i18n mới).

## 0. Kết luận tóm tắt

| Hạng mục (nợ đợt 61) | Kết luận |
|---|---|
| (a) Timeout `recordPackMedia` headed thật (R5 §6.3) | **Đóng.** Timeout xảy ra thật sau **20495 ms** (kỳ vọng 20000 ms), modal hiện **exact** chuỗi vi `pack.recordTimeout` (đã gộp dict đợt 61), recorder treo bị `stop()` 2 lần, modal mở khóa thật (Escape đóng được). |
| (b) CaptionModal running en 1280×720 + mobile 390×844 (R5 §6.1) | **Đóng, 2/2 PASS.** Spinner + Cancel hiển thị đúng cả 2 viewport/locale en; đo sau 434 ms (1280) / 528 ms (390) từ lúc bấm Start. Lưu ý: phase text vẫn tiếng Việt ở locale en (chuỗi bridge trả về — xem §4.3). |
| (c) `.tbtn-label` headed trực tiếp 1280 vs 1440 (R4 §7.1) | **Đóng.** 1280: 9/9 nhãn `display:none`; 1440: 9/9 nhãn hiện (`display:inline`, rộng 21,9–54,6 px). Bonus: biên media query đúng 1360 ẩn / 1361 hiện. |
| (d) Nút proxy bấm thật với bridge chạy (R4 §7.4) | **Đóng (sau 1 lần đo lại).** Lần 1 FAIL oan: file test r4-test.mp4 chỉ 320×180 → bridge trả `{skipped:true}` theo luật KHÔNG upscale (đúng thiết kế — xem §2.1). Đo lại với nguồn 1080p thật: proxy tạo xong sau **2509 ms** (lượt trước 4515 ms), file `r10-test-1080p__proxy_720p.mp4` 1280×720 + sidecar JSON, nút hiện "✓ PROXY 720p", HEAD 200, toast proxyAttached. Đường skipped cũng đo lại riêng: toast smallEnough exact, không proxy, nút mở lại. |
| (e) Speed warn các đường còn lại (R4 §7.2) | **Đóng 4/4 + 1 bonus.** warnOverlap, warnResetOverlap, warnNoGap, warnStabilizeRamp đều đo thật headed, chuỗi **exact** với `en.json`, màu #fbbf24 12px. warnTooShort **chứng minh là nhánh chết qua UI** (không phải chưa đo được — xem §3.3). |
| (e) Sticker warn đường còn lại (R4 §7.3) | **Đóng.** Upload WebP động thật (2 frame, có ANMF) → warn exact `sticker.errWebp`, màu #f5b453 12px. |
| Hồi quy | Harness chính **15/16 PASS** (chỉ D1 FAIL oan, đã đóng bằng redo **4/4 PASS**); `vite build` pass 10,96 s; `tsc` repo-wide còn **1 lỗi ở file của luồng R5 đợt 62 khác** (xem §4.2); 0 window error cả 2 phiên headed. |

## 1. Cách đo (harness mới, tái dùng mẫu R4/R5)

- `apps/web/scripts/clicktest-62r10-headed-gaps.mjs` — harness chính
  (16 case: S0, C1–C3, running en ×2, E1–E6, D1, A1–A2, H9).
  Vite dev đóng băng + Chromium headed qua Xvfb display `:173` + CDP
  Node thuần. Bridge TỰ spawn trong harness ở cổng riêng 8791
  (`BRIDGE_PORT` env — xem §5.1) + `VITE_BRIDGE_URL`, WORK_DIR riêng
  `/tmp/round62-r10/bridge-work`, tắt sạch lúc thoát (đã verify không
  còn process/cổng sau chạy).
- `apps/web/scripts/clicktest-62r10-proxy-redo.mjs` — harness redo riêng
  cho (d) (4 case: P0, P1, P2, P9), display `:175` (chọn động vì `:174`
  đã có luồng round-62 khác dùng — xem §5.4), bridge riêng cổng 8792,
  WORK_DIR `/tmp/round62-r10/bridge-work2`.
- Fixture (scratch, không stage): `r4-test.mp4` (tái dùng của R4,
  testsrc 320×180 2s), `anim-test.webp` (PIL: 2 frame 64×64 đỏ/xanh,
  262 byte, có chunk ANMF, `is_animated=True`),
  `r10-test-1080p.mp4` (ffmpeg `testsrc2 1920×1080 rate=30 duration=2`,
  libx264 crf 18, 2.472.307 byte — tái tạo bằng đúng lệnh này).
- Bằng chứng: `hidden_files/round62-r10/headed/` — report JSON
  (`r10-report.json`, `r10-proxy-redo-report.json`), JSON đo từng mục,
  screenshot PNG từng mục, log vite/chrome/bridge/static.

## 2. (a) Timeout recordPackMedia — đo headed thật

Fake MediaRecorder treo thật: class `HangRecorder` thay
`window.MediaRecorder` trước khi mở TemplatePackModal —
`isTypeSupported() → true`, `start()` chỉ đếm, `stop()` chỉ đếm
**không fire `onstop`**, `state` luôn `"recording"`. Bấm "Tạo ngay"
pack **"Intro YouTube"** (video 5s → timeout mặc định
`max(20s, (5+15)s) = 20000 ms`) bằng chuột thật.

| Đo | Số thật |
|---|---|
| Thời gian từ lúc bấm "Tạo ngay" tới khi lỗi hiện | **20495 ms** (kỳ vọng 20000 ms; dung sai ±5 s do poll 500 ms + overhead tạo pack) |
| Lỗi hiện trong modal (`.modal-body .error`) | **Exact** chuỗi vi `pack.recordTimeout` (so bằng `===` với `vi.json` đọc từ đĩa): "Ghi video mẫu quá lâu (quá 20 giây mà chưa xong) — có thể trình duyệt kẹt khi ghi. Hãy đóng modal rồi bấm “Tạo ngay” lại, hoặc chọn pack chỉ có ảnh (Thẻ tiêu đề, Bìa album)." |
| Recorder treo | `startCalls=1`, **`stopCalls=2`** (1 lần do `recordPackMedia` gọi sau vòng tick 5s + 1 lần do timeout handler gọi khi `state==="recording"`) — đúng code R5 |
| Modal sau lỗi | `busy=false`, nút ✕ enabled; **Escape đóng được modal thật** (A2 PASS — `finally` reset busy hoạt động) |
| Lưu ý hiển thị | Lỗi render ở **cuối** `.modal-body` (dưới danh sách 6 pack, modal body cuộn được) — screenshot `r10-pack-timeout.png` chỉ thấy danh sách pack, không thấy dòng lỗi vì nằm dưới fold; user phải cuộn modal mới đọc được lỗi. Đây là quan sát UX, không phải FAIL (chuỗi đã verify exact trong DOM + modal mở khóa). Luồng sau có thể cân nhắc đưa lỗi lên đầu modal hoặc auto-scroll tới lỗi. |

## 3. (b) CaptionModal running — locale en, 2 viewport

Bridge caption thật (faster-whisper local, model đã load từ lượt
trước — job chạy ~10 s trên clip mẫu `mau-1.webm` không lời). Poll
200 ms, đo ngay khi thấy `.caption-running`.

| Case | Đo sau bấm Start | Phase lúc đo | Spinner | Nút Cancel | Modal |
|---|---|---|---|---|---|
| 1280×720 en | 434 ms | "Đã nhận file, chuẩn bị…" | 46,4×46,4 | "Cancel" 68,6×30 | 640×313, top 203,5 bottom 516,5 |
| 390×844 en (mobile, dsf 2) | 528 ms | "Đã nhận file, chuẩn bị…" | 43,6×43,6 | "Cancel" 68,6×44 | 366×341, top 503 bottom 844 (bottom-sheet, chạm đáy đúng thiết kế) |

Cả 2 PASS: spinner hiển thị, phase + elapsed ("Running for 00:00 —
just leave the window open.") hiển thị, Cancel vừa hộp/không tràn/
trong viewport, modal vừa viewport. (Lượt chạy chính lần 1 đo 592 ms /
557 ms với cùng kết quả — số trên là lượt chạy 3 đã chốt.)

## 4. (c) `.tbtn-label` — đo headed trực tiếp

| Viewport | Kết quả |
|---|---|
| 1440×900 | **9/9 nhãn HIỆN**, `display:inline`, rộng 23,3 / 27,6 / 53,3 / 22,5 / 54,6 / 39,6 / 46,9 / 24,7 / 21,9 px |
| 1280×720 | **9/9 nhãn ẨN**, `display:none` (media query 769–1360px, `styles.css:326`) |
| 1360×720 (bonus biên) | 9/9 ẩn |
| 1361×720 (bonus biên) | 9/9 hiện — đúng `max-width: 1360px` |

## 5. (d) Nút proxy bấm thật — 2 lần đo

### 5.1 Lần 1 (harness chính, D1 FAIL — không phải bug sản phẩm)

Bấm nút proxy của card `r4-test.mp4` (320×180) với bridge chạy:
sau 120 s không có `proxyUrl`, không badge, toast rỗng (đã tắt).
Nguyên nhân đã xác minh: file upload **đã lên bridge**
(`WORK_DIR/proxies/r4-test.mp4`, 30.452 byte) nhưng
`server/render/src/proxy.js:106` có luật **KHÔNG upscale** —
`meta.height (180) <= height (720)` → trả
`{skipped:true, reason:"source-already-small"}`; bridge trả HTTP 200
`{skipped:true, ...}`; client `MediaBin.tsx:63` toast info
`mediabin.smallEnough` rồi return (không lỗi, không proxy, nút mở
lại). File test 320×180 của R4 chỉ hợp để đo nút hiện + style (R4 B1),
**không bao giờ tạo được proxy 720p**. Kết luận này đã khóa bằng redo
P2 (§5.3).

### 5.2 Lần 2 — redo với nguồn 1080p thật (P1 PASS)

Tắt auto-proxy trước (`localStorage vcut-auto-proxy=0` — mặc định BẬT
nên phải tắt để cú bấm tay là đường duy nhất tạo proxy; đã verify sau
import 3 s `proxyUrl` vẫn null). Import `r10-test-1080p.mp4`
(1920×1080, 2 s), bấm nút proxy của đúng card bằng chuột thật:

| Đo | Số thật (lượt redo 2; lượt redo 1: 4515 ms) |
|---|---|
| Thời gian tới `proxyUrl` | **2509 ms** (chênh lệch giữa 2 lượt do tải VM) |
| `proxyUrl` | `http://127.0.0.1:8792/api/proxy/file/r10-test-1080p__proxy_720p.mp4` |
| Hiển thị | Nút card đổi text thành **"✓ PROXY 720p"** (đây chính là "badge" — `MediaBin.tsx:140`, không có element badge riêng; lượt redo 1 đo sai chỗ này nên FAIL oan — xem §6.2) |
| HEAD `proxyUrl` | **200** |
| File trên đĩa bridge | `r10-test-1080p__proxy_720p.mp4` (313.972 byte) + sidecar `r10-test-1080p__proxy_720p.json` (source 1920×1080, proxy 1280×720, fps 30, `createdAt` sau lúc bấm) |
| ffprobe file proxy | **1280,720,2.000000** (đúng `scale=-2:720`, giữ fps + duration 1:1) |
| Store | `proxyHeight=720`, `proxySizeBytes=313972` |
| Toast (bắt lúc hiện) | "Đã gắn proxy 720p cho “r10-test-1080p.mp4” — preview sẽ mượt hơn." |

### 5.3 Đường skipped đo riêng (P2 PASS)

Bấm proxy trên `r4-test.mp4` (nguồn nhỏ): toast hiện sau **500 ms**,
**exact** chuỗi vi `mediabin.smallEnough` ("“r4-test.mp4” đã đủ nhỏ,
không cần proxy."), `proxyUrl` vẫn null, nút mở lại (không busy).
Khóa hành vi đúng thiết kế của D1 lần 1.

## 6. (e) Speed warn + sticker warn — đo headed thật (locale en)

Setup: clip mẫu v1[0] (`mau-1.webm`, start 0, dur 4, src 4 s) +
v1[1] (`mau-2.webm`, start 4, dur 4). Mọi chuỗi so **exact** (`===`)
với `en.json` đọc từ đĩa; màu warn đo computed thật.

| Case | Kích hoạt thật | Kết quả |
|---|---|---|
| E1 `warnOverlap` | Bấm preset **0.5×** thật (clip 4 s → newDur 8 s đè clip kề start 4) | PASS — warn exact "Not enough room on the timeline — the clip would be **00:08.0** long and overlap the next clip. Move the other clip first.", #fbbf24 12px; clip KHÔNG đổi tốc độ (speed vẫn 1, duration 4) |
| E2 `warnResetOverlap` | Patch clip1 speed 2× (dur 2) + clip2 start 2.5 qua store, bấm **Reset** thật | PASS — warn exact "Not enough room to reset to 1× — move the other clip first.", #fbbf24 12px; clip GIỮ speed 2 (duration 2) |
| E3 `warnTooShort` | Trim clip1 về srcLen 0,5 s → slider max **2.5** (= 0,5/0,2), preset 4× **disabled**; đặt slider lên max bằng native setter + event `input` | PASS (nhánh chết qua UI — xem §6.1): speed 2.5, duration đúng **0.2**, KHÔNG warn |
| E4 `warnNoGap` | Bật curve thật → patch 41 keyframe cách nhau 0,1 s → bấm **thêm điểm** thật | PASS — warn exact "No gap ≥ 0.2s left to add a point — move points apart first.", #fbbf24 12px (khoảng lớn nhất 0,1 s < 0,2 s) |
| E5 `warnStabilizeRamp` (bonus) | Curve vẫn bật + patch `enhance.stabilize` qua store (UI R2 chặn tổ hợp này nên chỉ tới được bằng store) | PASS — warn exact "⚠️ Clip has both stabilization and a speed curve — the validator blocks this combination, render will be blocked. Turn off one of them.", #fbbf24 12px |
| E6 `sticker.errWebp` | Upload **WebP động thật** (`anim-test.webp`, 262 byte, 2 frame, có ANMF) qua input file của StickerPanel | PASS — warn exact "Animated WebP cannot be rendered with the current FFmpeg (demuxer error) — use animated APNG or static WebP instead.", #f5b453 12px |

### 6.1 E3 — `warnTooShort` là nhánh chết qua UI (kết luận, không phải chưa đo)

`applySpeed` kẹp `raw` về `sliderMax` **trước** khi tính `newDur`
(`SpeedPanel.tsx:107`), mà `sliderMax = min(4, srcLen/0,2)` nên
`newDur >= 0,2` luôn; preset `p > sliderMax` bị `disabled`.
Đã đo thật: srcLen 0,5 s → slider max attr = 2,5, preset 4× disabled,
slider lên max → speed 2,5, duration đúng 0,2, không warn. Nhánh
`newDur < MIN_CLIP_DURATION` chỉ tới được nếu gọi `applySpeed` trực
tiếp với giá trị vượt `sliderMax` (không có đường UI nào làm vậy).
Đề xuất cho luồng sau (không làm trong luồng này): hoặc xóa nhánh
chết + key `speed.warnTooShort`, hoặc giữ làm phòng thủ và khóa bằng
test tĩnh — cần quyết parent vì xóa key i18n đụng dict chung.

## 7. Lỗi harness gặp trong lúc đo (đã sửa, không phải lỗi sản phẩm)

1. **Bridge bỏ qua argv `--port`** (lượt chạy 1): `server/bridge/src/
   index.js:117` chỉ đọc env `BRIDGE_PORT`, không parse `process.argv`
   — spawn với `--port 8791` nhưng bridge vẫn lên 8787 nên health
   check 8791 timeout 120 s. Sửa: truyền `BRIDGE_PORT` qua env (ghi
   chú trong harness để luồng sau khỏi vấp; comment trong R5 ghi
   `--port 8787` là sai lệch — nhưng vì trùng cổng mặc định nên R5
   không phát hiện).
2. **Click tọa độ vào SpeedPanel rơi sai chỗ** (lượt chạy 1: E1/E2
   FAIL + S4d HARNESS ERROR): SpeedPanel nằm trong `<Section>` mở mặc
   định nhưng ở **dưới fold** của Inspector cuộn được (sau mục
   Transition cao) — rect nút nằm ngoài viewport nên click rơi xuống
   timeline. Sửa: helper `scrollBtnIntoView` (cuộn nút vào giữa vùng
   nhìn rồi mới đọc rect/bấm) cho mọi nút trong Inspector/MediaBin;
   re-select clip trước mỗi bước; bọc try/catch từng mục để một lỗi
   không giết cả lượt chạy. Lượt chạy 3 sau sửa: E1/E2/E4 PASS ngay.
   Bài học: mọi click tọa độ trong panel cuộn được phải scrollIntoView
   trước (R5 đã làm cho nút TopBar mobile; Inspector/MediaBin cũng vậy).
3. **Đo badge proxy sai** (redo 1: P1 FAIL oan): "badge" PROXY thực
   chất là chính nút proxy đổi text thành "✓ PROXY 720p"
   (`MediaBin.tsx:140`), không có element badge riêng — finder cũ tìm
   element có text bắt đầu bằng "PROXY" nên miss (text bắt đầu bằng
   "✓"). Sửa: chấp nhận `btnText.includes("PROXY 720p")`.
4. **So toast exact trượt vì nút đóng "×"** (redo 1: P2 FAIL oan):
   `textContent` của toast gồm cả "×" của nút đóng. Sửa: so
   `startsWith`.
5. **Display X bị chiếm**: `:174` đã có Xvfb của luồng round-62 khác
   chạy song song — redo chọn display trống động trong 174–190 (lấy
   `:175`, rồi `:178`).

## 8. Quan sát thêm (không sửa, ghi để luồng sau biết)

1. **Phase text caption vẫn tiếng Việt ở locale en**: cả 2 lần đo
   running en đều thấy phase "Đã nhận file, chuẩn bị…" / "Đang trích
   xuất audio…" trong khi nút là "Cancel" và elapsed là tiếng Anh
   ("Running for 00:00 — just leave the window open."). Phase label
   do bridge trả về (chuỗi vi hardcode phía bridge), UI không localize
   theo locale. Nợ i18n nhỏ ngoài phạm vi luồng này.
2. **Pill FPS ở mobile**: screenshot running 390×844 cho thấy nút
   Cancel (căn giữa) không bị che; nhưng pill FPS (z-300) vẫn nằm ở
   góc dưới-phải đè lên modal bottom-sheet — nợ đã biết từ R5 §5
   (che đuôi nút action ở bước config), không sửa trong luồng này.
3. **Lỗi timeout pack nằm dưới fold modal**: xem §2.
4. **Bridge log**: trong cả 2 phiên, bridge không ghi log lỗi nào cho
   `/api/proxy` (kể cả lần skipped — skipped trả 200 nên không log);
   chỉ có log khởi động. Muốn truy vết skipped phải bật log riêng
   (không làm trong luồng này).

## 9. Kiểm chứng khác

- Harness chính: **15/16 PASS** (`r10-report.json`); redo proxy:
  **4/4 PASS** (`r10-proxy-redo-report.json`); 0 window error cả 2
  phiên (`window.onerror` / `unhandledrejection` = 0).
- `vite build` (apps/web): **pass, 10,96 s** (chỉ cảnh báo chunk
  >500 kB có sẵn).
- `tsc --noEmit` (apps/web): repo-wide còn **1 lỗi duy nhất** ở
  `src/lib/bridgeErrors62R5.test.ts:15` (TS6133 `existsSync` không
  dùng) — file test của **luồng R5 đợt 62 khác**, không phải file của
  luồng này, không sửa giùm. Luồng này không thêm/sửa file `.ts`/`.tsx`
  nào nên không tạo thêm lỗi tsc.
- Không sửa code sản phẩm, không thêm key i18n (không có fragment).
- Bridge + vite + Xvfb + Chrome của cả 2 phiên đều đã tắt sạch (verify
  không còn process/cổng 8791/8792/5490/5500 sau chạy).

## 10. Chưa đo / nợ mở (trung thực)

1. **Escape lúc running ở bước translate** (`targetLang` ≠ "") — R5
   §6.2 vẫn chưa đo (cùng handler App + AbortController nên hành vi
   giống job 1, chưa có số đo riêng).
2. **Câu `pack.recordTimeout` viết cho pack 4–6 s** (timeout 20–21 s)
   — R5 §6.4 vẫn đúng: thêm pack dài hơn phải sửa câu chữ.
3. **`warnTooShort` nhánh chết qua UI** — cần quyết parent: xóa nhánh
   + key hay giữ làm phòng thủ (xem §6.1).
4. **Phase text caption chưa localize theo locale** (xem §8.1).
5. **Lỗi timeout pack nằm dưới fold modal** (xem §2) — cân nhắc đưa
   lỗi lên đầu modal.
6. **Nợ FPS pill đè footer modal mobile** (R5 §5 / đợt 61 §5.1) —
   vẫn mở, không thuộc luồng này.
7. **`tsc` 1 lỗi file test của luồng R5 đợt 62** (xem §9) — thuộc
   luồng khác.
8. Chưa đo Safari/Firefox (chỉ Chromium headed qua Xvfb).

## 11. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round62-r10-headed-gaps.txt`
— 3 file text:

- `apps/web/scripts/clicktest-62r10-headed-gaps.mjs` (mới — harness chính 16 case)
- `apps/web/scripts/clicktest-62r10-proxy-redo.mjs` (mới — harness redo proxy 4 case)
- `docs/PHASE9_ROUND62_R10_HEADED_GAPS_LIMITS.md` (mới — file này)

Không có binary. Không sửa `vi.json` / `en.json`, không tạo fragment
i18n (không có chuỗi mới), không sửa code sản phẩm. Harness + report
JSON + screenshot + fixture MP4/WebP chỉ nằm ở
`hidden_files/round62-r10/headed/` và `/tmp/round62-r10/` (fixture tái
tạo bằng lệnh ở §1), không stage. `dist/` (vite build kiểm chứng)
không stage.

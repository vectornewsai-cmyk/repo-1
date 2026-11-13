# Phase 9 đợt 90 — R2: Đóng băng playhead lúc phát sau seek (nợ LIMITS gộp đợt 89 §4 mục 2)

**Nợ gốc:** LIMITS gộp đợt 89 §4 mục 2 / Q5 §6 mục 1 — "Playhead chạy trước canvas lúc phát sau seek: store playhead tăng theo wall-clock trong khi element đang seek và canvas chưa vẽ khung mới — lệch tới nhiều giây trên WebKit dưới tải."
**Ngày:** 2026-11-11. **Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** ĐÃ ĐÓNG — playhead không còn vượt frame nào trong lúc seek (0,5/0,5 ở cả 4 biến thể đo); click-test O8 Chromium 21/21, WebKit 21/21.

## 1. Vấn đề gốc (đo trước sửa — probe `probe90r2-playhead-canvas-sync.mjs`)

Kịch bản đo (đúng S5(a2) của O8): pause-seek có xác nhận tới t=5, rồi `setPlayhead(0.5)` + phát; sampler trong trang 100 ms ghi playhead (store), trạng thái element (`__vcutMediaEls`), darkCx canvas → ballTime (ô đen x = 0.35+0.05t). Chỉ tiêu: playhead lúc đang seek ≤ 0,5 + 2 frame (0,567); playhead lúc canvas lần đầu rời khung t=5 ≤ 0,65.

| Biến thể | playhead lúc seek xong | playhead lúc canvas đổi khung | lag ổn định (trung bình \|lag\| 1s cuối) |
|---|---|---|---|
| Chromium | 0,6 | 0,8 | 0,20 s |
| Chromium + 3× `yes` | 1,1 | 1,4 | 1,53 s |
| WebKit | 1,4 | 1,667 | 2,69 s |
| WebKit + 3× `yes` | **4,1** | **4,867** | 2,92 s |

Cơ chế (đọc từ mẫu thô): vòng lặp phát tăng playhead bằng dt wall-clock ở ĐẦU mỗi tick, TRƯỚC khi syncMedia forceSeek element; renderFrame thì N3 (đợt 86) bỏ qua khi đang seeking nên canvas giữ khung t=5. Ngoài seek đầu, **mọi drift re-seek trong lúc phát đều tái diễn lỗi**: đồng hồ media chạy chậm dưới tải → drift vượt 0,35 s → re-seek → element kẹt seeking hàng giây trên GOP 250 (đo được: element đóng băng ở 2,367 / 2,8 trong 1,3–2,4 s) trong khi playhead chạy tiếp — playhead và canvas tách nhau tới 4,4 s rồi mới hội tụ lại.

## 2. Sửa — đóng băng playhead + pause active trong lúc giữ

**`apps/web/src/lib/playheadHold90R2.ts` (mới, thuần, unit-test được):**
- `shouldHoldPlayheadWhileSeeking({playing, seekingPrevTick, forceSeekEdge, nowMs, state})`: giữ khi tick TRƯỚC syncMedia báo clip video xuôi đang seeking (cờ `skipRenderSeeking` của N3 — đúng tập actives tại playhead, không phải mọi element trong pool). Khi giữ: không tăng playhead, không tích lũy dt (`forwardAcc`/`reverseAcc` = 0) để lúc nhả không nhảy bù.
- **(a2) Giữ cả ở cạnh lên của nút Phát** (`forceSeekEdge`): phát hiện khi đo lại — tick bấm play tăng playhead bằng TRỌN dt của nó TRƯỚC khi syncMedia kịp forceSeek; dưới tải, rAF callback đầu sau `wake()` có thể tới muộn ~170 ms (`wake()` reset `last` lúc bấm play, nhưng callback đầu vẫn có thể tới muộn vì main thread bận) nên bản sửa đầu vẫn vượt 5 frame ở webkit-load (0,5 → 0,667 trong đúng 1 tick). Giữ ở cạnh lên thì forceSeek nhắm đúng playhead hiện tại, vượt 0 frame; nếu forceSeek là no-op thì tick sau cờ false → nhả ngay, chỉ mất 1 tick.
- **Trần tường 15 s** (`PLAYHEAD_HOLD_MAX_MS`): giữ liên tục quá 15 s thì nhả + latch không giữ lại cho tới khi seeking về false một lần (seek kẹt không đóng băng timeline mãi). Ngưỡng trên mọi seek đo được (Q5: WebKit dưới tải tElement max 9,7 s).

**`apps/web/src/preview.tsx`:**
- Đầu tick phát: tính quyết định giữ (dùng cờ N3 tick trước + cạnh lên nút Phát) rồi mới tăng playhead; khi giữ thì reset phần dư dt.
- `syncMedia(..., playheadHeld)`: nhánh forward — khi đang giữ thì **pause mọi active xuôi** (cả video lẫn audio) thay vì `play()`, để audio không chạy trước playhead đã đóng băng và video đã seek xong sớm không decode thừa làm chậm seek còn lại; hết giữ, resume bằng `play()` như cũ. Pause element đang seeking KHÔNG hủy seek (cùng mẫu pause-trước-seek của `seek.ts`) — **đã chứng minh bằng đo thật**: mẫu WebKit sau sửa ghi element `paused=1, seeking=1` rồi `seeking=0` ở đúng target, `currentTime` tới đích bình thường.
- Nhánh pause cũng cập nhật cờ N3 cho tick sau (pause-seek đang bay thì tick bấm play kế tiếp giữ ngay từ tick đầu).
- Hook đo `window.__vcutPlayheadHold90R2 = {ticks, holds}` (đếm tick/lần giữ).

**Không đổi:** scrub lúc pause (Seeker — giữ chỉ kích khi đang phát); phát ngược (N3 đã false cho reverse nên giữ không bao giờ kích ở chiều ngược); ngưỡng drift re-seek 0,35 s; timeout Seeker 7,2 s/attempt của Q5; hành vi seek Q5 (`timeoutExtensions`).

## 3. Kết quả sau sửa (cùng probe, 4 biến thể — bản a2 cuối)

| Biến thể | playhead lúc seek xong | playhead lúc canvas đổi khung | lag ổn định (trung bình \|lag\| 1s cuối) | hold ticks |
|---|---|---|---|---|
| Chromium | **0,5** | **0,5** | 0,13 s (trước 0,20) | 4 |
| Chromium + 3× `yes` | **0,5** | **0,5** | 0,18 s (trước 1,53) | 4 |
| WebKit | **0,5** | **0,5** | 0,46 s (trước 2,69) | 29 |
| WebKit + 3× `yes` | **0,5** | **0,5** | 0,68 s (trước 2,92) | 28 |

- Cả 4 biến thể PASS cả 2 chỉ tiêu, **vượt 0 frame** (trước sửa vượt tới 4,4 s ở webkit-load).
- S5(a2) trong click-test O8 sau sửa: Chromium playhead 0,93, blob 0,4419 vs kỳ vọng 0,4416 (lệch 0,0003); WebKit playhead 0,9, blob 0,3982 vs kỳ vọng 0,3981 (lệch 0,0001).
- **Kiểm chứng:** tsc web 0; vite build pass; `playheadHold90R2.test.ts` 14/14 (node strip-types); `seek.test.ts` 20/20; suite liên quan xanh (`seekSkipRender86N3` 9/9, pacing L2 10, J5 5/5, K9 11/11, L6 12/12, reverse L2 17/17); click-test O8 **Chromium 21/21, WebKit 21/21**.

## 4. Chuyện bên lề khi đo (đã xử lý trong probe/luồng)

- **Ngưỡng so phải cùng miền làm tròn:** bản sửa đầu đo webkit playheadMaxDuringSeek = 0,567, "FAIL" ngưỡng 0,5 + 2/30 = 0,56667 — đó là playhead snap đúng +2 frame, bị làm tròn đo (toFixed(3)) đẩy thành 0,567. Probe nay so trong cùng miền 3 chữ số thập phân (ngưỡng `+(0.5 + 2/30).toFixed(3)` = 0,567).
- **Setup pause-seek t=5 fail 2 lần dưới tải cực đoan** (webkit-load: lần 1 baseline tElement 5,5 s rồi tCanvas null sau 30 s; lần 1 fixed tElement 0,7 s rồi tCanvas null sau 30 s): canvas không tới khung t=5 trong 30 s khi VM bị các luồng round-90 khác + 3× `yes` đè (loadavg lúc đó tới 14–22). Đây là hiện tượng đã biết (Q5 §6.2: canvas chậm hơn element tới ~7 s dưới tải; ở đây vượt 30 s) — **không phải hồi quy từ sửa này** (nhánh pause không bị động vào hành vi, chỉ ghi thêm cờ; cả 2 lần retry sau đó đều pass, baseline retry: tElement 13,2 s / tCanvas 14,2 s; fixed retry: 0,51 s / 0,60 s).
- **`lagAfterMax` trong probe chỉ là tham chiếu:** giá trị ~4,5 s ở mẫu đầu là khung stale t=5 chưa kịp đổi (canvas không thể hiện frame 0,5 trước khi decoder sản xuất ra nó) — không phải lỗi sau sửa; chỉ tiêu đúng là playhead lúc đang seek + lúc canvas đổi khung (mục 1/3).

## 5. Giới hạn còn lại (trung thực)

1. **Sawtooth dư ~0,5–0,8 s trên WebKit dưới tải (không phải playhead chạy trước nữa):** sau mỗi lần nhả giữ, element WebKit kẹt ~0,3–0,5 s không tăng `currentTime` (độ trễ resume decode sau seek — CŨNG xảy ra ở baseline, không phải do pause của đợt này: baseline webkit element cũng đứng yên 0,767 → 0,833 trong 292 ms sau seek xong) trong khi playhead chạy 1× → lag tăng tới ~0,5–0,8 s rồi drift re-seek + giữ mới snap về ~0,03. Chu kỳ tự sửa, có biên (không tích lũy thành nhiều giây như trước), nhưng **mục tiêu "< 1 khung sau seek" chỉ đạt đúng nghĩa cho lỗi chạy-trước-playhead; lag ổn định sau seek dưới tải WebKit vẫn là sawtooth ~0,5–0,8 s**, gốc ở độ trễ resume decode của WebKit — ngoài phạm vi đợt này (cần can thiệp sâu vào pacing/drift threshold, không phải playhead).
2. **Trần giữ 15 s:** seek nào chậm hơn 15 s (chưa từng đo được; max 9,7 s ở Q5, 13–14 s cho cả pause-seek t=5 ở webkit-load đợt này — nhưng đó là seek PAUSE, không phải seek lúc phát) thì playhead sẽ nhả và chạy trước trở lại (hành vi cũ) thay vì đóng băng mãi. Đây là đánh đổi có chủ ý, xem §2.
3. **Khung stale trong lúc seek là tất yếu:** canvas vẫn giữ khung cũ cho tới khi decoder xong (N3 cấm vẽ lúc seeking vì làm seek chậm 3–11×) — sửa này chỉ làm playhead "nói thật" về khung đang hiện, không làm khung mới tới sớm hơn.
4. **Chỉ giữ khi có clip VIDEO xuôi đang seeking:** seek của audio-only (không video) không giữ playhead — audio seek nhanh, drift re-seek 0,35 s đã bao được; chưa đo trường hợp audio seek chậm bất thường.
5. **`previewLoop50F2.test.ts` KHÔNG chạy được bằng strip-types (có từ trước, không phải hồi quy):** import `./pauseDraw41W2` không đuôi `.ts` → `ERR_MODULE_NOT_FOUND` dưới `node --experimental-strip-types` (file này và `pauseDraw41W2.ts` đều không nằm trong diff đợt này; có thể nó chạy bằng runner khác). Ghi nhận để luồng sau xem, không sửa trong đợt này.
6. **Số đo chỉ cho clip GOP 250, 6 s, 720p, 1 clip video** (o8-ball) và tải VM lúc đo (các luồng round-90 khác chạy song song nên load nền dao động 0,6–22 giữa các lần chạy — so sánh trước/sau là so cơ chế (giữ/không giữ), không phải so tuyệt đối cùng một mức tải).

## 6. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadHold90R2.ts` — quyết định giữ thuần + trần 15 s (mới).
- `apps/web/src/lib/playheadHold90R2.test.ts` — 14 test (mới; 11 test gốc + 3 test cạnh lên nút Phát (a2)).
- `apps/web/src/preview.tsx` — giữ playhead ở đầu tick; `syncMedia(..., playheadHeld)` pause active khi giữ; cập nhật cờ N3 ở cả 2 nhánh; hook đo `__vcutPlayheadHold90R2`.
- `apps/web/tsconfig.json` — thêm `src/lib/playheadHold90R2.test.ts` vào exclude (theo mẫu mọi test lib khác).
- `apps/web/scripts/probe90r2-playhead-canvas-sync.mjs` — probe đo trước/sau 4 biến thể (mới; sampler trong trang 100 ms, chỉ tiêu playhead-lúc-seek + playhead-lúc-canvas-đổi-khung, dừng sớm khi playhead đóng băng).
- `docs/PHASE9_ROUND90_R2_PLAYHEAD_CANVAS_SYNC_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round90-r2-playhead-canvas-sync` (`~/workspace/repo-1-push/paths-loop/phase9-round90-r2-playhead-canvas-sync.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r2.md`.
Probe chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r2/probe-<engine>[-load]-{baseline,fixed}/probe-results.json`.

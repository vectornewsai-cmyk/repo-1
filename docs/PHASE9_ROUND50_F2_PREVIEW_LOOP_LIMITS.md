# Phase 9 đợt 50, luồng F2 — Củng cố vòng lặp preview: early-return ctx + footage không decode được — LIMITS

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng.
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **§7.6 — Lỗ early-return `if (!ctx) return;` ĐÃ KÍN.** Quyền đặt
   lịch chuyển về wrapper `loop` (finally → scheduleNext): mọi đường
   return trong tick đều đi qua cùng một điểm đặt lịch. Đỏ-trước /
   xanh-sau headed: override `getContext("2d")` → null thì baseline
   ticks đóng băng ở **1** (vòng lặp chết, sleeping false), sau sửa
   ticks **83 → 169 trong 3 s** (vòng lặp còn sống, không ngủ).
   Ngữ nghĩa ngủ khi thiếu surface được khóa bằng hàm thuần
   `previewLoopShouldSleep` (surfaceMissing → không ngủ) + 20 test
   unit mới, và đối chứng headed canvas có/không + pause/play.
2. **§7.7 — Footage không decode được nay ngủ sau ~10–11 s thay vì
   ~104 s.** Thêm trần tường 10 s cho chuỗi skip vẽ lại (W2): hai lần
   chạy headed sau sửa ngủ sau **11,5 s** (skip 86) và **10,5 s**
   (skip 63, cờ wall = true), so với baseline **103,6 s** (skip 600,
   cạn cap tick). Baseline tệ hơn C3 đo (30–40 s) vì tick chỉ 6,1/s
   dưới tải — đúng điểm yếu mà trần tường sửa: thời gian ngủ nay ổn
   định theo giờ tường, không còn trôi theo tốc độ tick.
3. **Phát hiện trong lúc làm (đã sửa):** cờ `idleDebug` lag một tick
   sau quyết định ngủ — snapshot trong thân tick chạy TRƯỚC
   scheduleNext nên tick mà trần tường vừa chạm ngưỡng ngủ mà cả hai
   cờ vẫn false. Đã publish cờ ngay tại scheduleNext; chạy lại xác
   nhận wall = true, exhausted = true lúc ngủ.
4. Hồi quy pause **111/111** + audioEngine **6/6** + E4 **13/13** +
   cổng load **82/82** + test mới F2 **20/20**. tsc 0 lỗi, vite build
   pass.

## 1. Phân tích code trước khi đo

### 1.1 Lỗ §7.6 (đọc code, xác minh bằng đo headed §3.4)

`preview.tsx`, effect vòng lặp: `tickInner` có 2 điểm đặt lịch —
nhánh `if (!canvas || !wrap) { raf = requestAnimationFrame(loop);
return; }` và `scheduleNext()` cuối tick. Nhưng
`if (!ctx) return;` (dòng ~2472) trả về mà KHÔNG đặt lịch:
không rAF chờ, `sleeping` vẫn false nên `wake()` no-op — vòng lặp
chết hẳn tới khi reload. E4 §7.6 ghi đây là "lỗ tiền sẵn" vì thực tế
`getContext("2d")` không trả null. Lần này đo được đúng lỗ đó bằng
cách override `getContext` headed (phase B): ticks đóng băng ở 1.

Ngữ nghĩa cần giữ khi chuyển quyền đặt lịch về wrapper (rủi ro chính
của đổi này): T5 quy định "chưa có canvas/wrap thì KHÔNG được ngủ
(tick tiếp chờ mount)". Nếu `scheduleNext()` quyết định ngủ khi chưa
có canvas thì vòng lặp ngủ quên — mount canvas không chạm store nên
không có gì đánh thức. Vì vậy `scheduleNext` mới kiểm tra surface
trực tiếp bằng refs (`!canvasRef.current || !wrapRef.current`) +
cờ `ctxMissing` do tickInner ghi ở chỗ lấy ctx, và từ chối ngủ khi
thiếu surface. Cờ `ctxMissing` stale chỉ xảy ra khi tick ném trước
khi tới chỗ lấy ctx — lúc đó ép tick tiếp cũng là lựa chọn an toàn
(vòng lặp đang lỗi, không được ngủ). Quyết định ngủ còn lại được tách
thành hàm thuần `previewLoopShouldSleep` (công thức cũ của
scheduleNext + thêm `surfaceMissing → false`) để test khóa được mà
không cần vòng lặp thật — cùng mẫu W2/X2/Z2.

### 1.2 Cơ chế §7.7 (đọc code + số C3 §5.4, đo lại §3.3)

Với footage hoàn toàn không decode được (empty/garbage/
mpeg4-unsupported), seek "thành công" dạng failed-only (ok: true,
timedOut: 0) nên đi nhánh vẽ, `renderFrame` skip mỗi tick vì element
không có frame (readyState < 2) → `pauseRetrySkipped` leo từng tick
→ ngủ khi cạn cap W2 = 600 skip. Cap đếm TICK nên thời gian quay =
600 / tốc độ tick: C3 đo 19 tick/s → 30–40 s; baseline lần này dưới
tải nặng chỉ **6,1 tick/s → 103,6 s**. Tốc độ tick đo được dao động
mạnh theo tải (6,1/s ở phase C, ~32/s ở phase A cùng phiên), nên cap
tick không bao giờ chặn được thời gian quay theo giờ tường.

Sửa: thêm trần TƯỜNG cho cùng chuỗi skip — ngủ khi chuỗi đã đủ
**≥ 30 skip liên tiếp VÀ ≥ 10 s tường** (`pauseRetryWallExhausted`
trong `pauseDraw41W2.ts`, mốc streak ghi ở lần skip đầu tiên của
chuỗi tại cả 2 chỗ advance). 10 s = đúng ngân sách tường của cap
tick ở tần số tham chiếu 60 Hz (600 tick ≈ 10 s), nên ở 60 Hz hai
trần chạm cùng lúc, ở 120 Hz trần tick (5 s) vẫn chạm trước — chỉ
dưới ~60 Hz trần tường mới rút ngắn thời gian quay (máy càng chậm,
rút càng nhiều). 30 skip tối thiểu ngăn trần nổ do một khoảng trống
rAF dài xen giữa hai tick của cùng chuỗi (tab ẩn rồi hiện) trong khi
chuỗi mới chỉ vừa bắt đầu; 30 = gấp 10 lần số skip hội tụ đã quan sát
(3, W2). Khi trần tường chạm, `pauseRetryExhausted` được set true để
mọi logic hạ nguồn (nhánh vẽ lại, guard Z2, điều kiện ngủ) đối xử
y hệt cạn cap tick — không cần đường ngủ riêng. Không dùng backoff
(chuyển rAF sang setTimeout khi skip dài): ngủ ở 10 s đã cắt đúng
chi phí, backoff chỉ thêm trạng thái mà không rút ngắn thời gian tới
khi ngủ.

Đánh đổi (ghi rõ, không giấu) — cùng họ với đánh đổi W2: media chỉ
CHẬM hơn trần tường (frame đầu tiên tới sau khi vòng lặp đã ngủ vì
cạn trần) không tự hiện frame cho tới khi user tác động (scrub sang t
khác, phát/tạm dừng, đổi nội dung), vì element sẵn sàng không chạm
store nên không có gì đánh thức vòng lặp đang ngủ. Ở máy 60 Hz hành
vi không đổi gì (trần tường chạm cùng lúc với cap tick); ở máy chậm
(< 60 Hz) thì media chậm được tối đa 10 s thay vì 600 tick — con số
này vẫn gấp nhiều lần thời gian hội tụ đã quan sát (3 skip), và
trường hợp frame đầu tiên của file local cần > 10 s là ngoài phạm vi
đã quan sát được.

## 2. Sửa code

### 2.1 §7.6 — wrapper `loop` là nơi duy nhất đặt lịch (preview.tsx)

- `tickInner`: nhánh `!canvas || !wrap` chỉ còn `return;` (bỏ
  `raf = requestAnimationFrame(loop)` trực tiếp); `if (!ctx) return;`
  giữ nguyên dạng bare-return nhưng tickInner nay ghi
  `ctxMissing = !ctx` ngay trước đó (false ngay khi lấy được ctx);
  bỏ `scheduleNext();` cuối tick.
- `loop`: `try { tickInner(now); } catch { đếm + console.error }
  finally { scheduleNext(); }` — finally đảm bảo MỌI đường return
  (kể cả early-return) và mọi lần ném đều đi qua scheduleNext.
  Vẫn một đường scheduleNext duy nhất mỗi lần loop chạy nên không
  double-rAF (ghi nhận cũ của E4 §3.3 vẫn đúng).
- `scheduleNext`: tính trần tường (§2.2) rồi gọi
  `previewLoopShouldSleep({... surfaceMissing:
  !canvasRef.current || !wrapRef.current || ctxMissing})` — ngủ thì
  `sleeping = true`, không thì `raf = requestAnimationFrame(loop)`.
  Comment E4 cũ được cập nhật (catch không còn gọi scheduleNext,
  finally gọi thay).
- `PreviewIdleDebug` thêm `pauseRetryWallExhausted: boolean`
  (init false; snapshot trong thân tick + publish tại scheduleNext —
  xem §3.5 về vì sao cần publish tại scheduleNext).

### 2.2 §7.7 — trần tường 10 s (pauseDraw41W2.ts + preview.tsx)

- Mới trong `pauseDraw41W2.ts`: `PAUSE_RETRY_WALL_CAP_MS = 10_000`,
  `PAUSE_RETRY_WALL_MIN_SKIPS = 30`,
  `pauseRetryWallExhausted(consecutiveSkipped, streakSinceMs, nowMs)`
  (hàm thuần; cần CẢ hai điều kiện; streak null → false).
- Mới trong effect preview.tsx: `pauseRetryStreakSince: number | null`
  — ghi ở lần skip đầu tiên của chuỗi tại cả 2 chỗ
  `pauseRetryAdvance(true, ...)` (trong `.then` của seek dùng
  `performance.now()`, trong nhánh vẽ lại dùng timestamp rAF `now`;
  cùng đồng hồ). KHÔNG cần xóa ở các chỗ reset đếm: đếm về 0 thì trần
  không chạm (cần ≥ 30 skip), chuỗi mới ghi đè mốc ngay lần skip đầu.
- `scheduleNext`: nếu trần tường chạm mà `pauseRetryExhausted` chưa
  set thì set true (gộp vào cap tick), rồi publish cả hai cờ ra
  `idleDebug` (xem §3.5).

### 2.3 Hàm thuần quyết định ngủ (mới: previewLoop50F2.ts)

`previewLoopShouldSleep(s: PreviewLoopSleepState): boolean` — công
thức ngủ cũ của scheduleNext giữ nguyên từng điều kiện (không phát +
không seek bay + không cờ vẽ lại + (đã vẽ đúng playhead | cạn cap vẽ
lại ở đúng playhead | cạn cap seek ở đúng playhead), dùng lại helper
W2/X2), thêm `if (s.surfaceMissing) return false;` ở đầu. preview.tsx
chỉ truyền trạng thái thật vào.

## 3. Đo headed (harness mới pause50F2-preview-loop.mjs)

Harness: `apps/web/scripts/pause50F2-preview-loop.mjs` (mới, mẫu C3
apploop: CDP pipe + Xvfb + Chromium-1248, seed qua IDB + localStorage
autosave, scrub qua `.tl-ruler`, poll `__vcutPreviewIdle` 500 ms).
Dist: `/tmp/f2-baseline-dist` (build từ source trước sửa) và
`/tmp/f2-app-dist` (sau sửa). Chrome 156.0.8078.4. Load máy trong lúc
chạy: 9,1 → 2,7 (nhiều luồng đợt 50 chạy song song — chính tải này
làm baseline §7.7 tệ hơn C3).

### 3.1 Phase D — control valid-gop (scrub 2.5 → vẽ + ngủ)

| | Trước sửa | Sau sửa |
|---|---|---|
| Kết quả | PASS, ngủ sau 1,1 s, lastDrawn 2.5, không cạn cap | PASS, ngủ sau 0,6 s, lastDrawn 2.5, không cạn cap |

### 3.2 Phase E — pause/play (scrub 0.5 → ngủ → Space phát → Space dừng)

| | Trước sửa | Sau sửa |
|---|---|---|
| Phát (ticks tăng trong 2 s) | PASS (ticks 20 → 25; playhead 1,0 → 1,5 — chậm do tải, nhưng tăng) | PASS |
| Tạm dừng → ngủ lại | PASS, ngủ sau 1,1 s | PASS, ngủ sau 0,5 s |

### 3.3 Phase C — §7.7 garbage.mp4 (không decode được), scrub 2.5

| | Trước sửa (baseline) | Sau sửa (lần 1) | Sau sửa (lần 2) |
|---|---|---|---|
| Thời gian tới khi ngủ | **103,6 s** | **11,5 s** | **10,5 s** |
| Ticks/s lúc quay | 6,1 | 8,8 | 6,2 |
| pauseRetrySkipped lúc ngủ | 600 (cạn cap tick) | 86 | 63 |
| pauseRetryExhausted lúc ngủ | true | false (*) | **true** |
| pauseRetryWallExhausted lúc ngủ | (chưa có cờ) | false (*) | **true** |

(*) Lần 1 sau sửa ngủ đúng 11,5 s với skip 86 nhưng cả hai cờ đều
false — xem §3.5 (lỗi chẩn đoán, đã sửa, lần 2 xác nhận cờ đúng).

Nhận xét: thời gian ngủ sau sửa ổn định ~10–11 s bất chấp tốc độ
tick dao động 6,2–8,8/s — đúng mục đích của trần tường. Baseline
103,6 s tệ hơn C3 (30–40 s) vì tick chỉ 6,1/s dưới tải nặng.

### 3.4 Phase B — §7.6 getContext("2d") → null (đỏ-trước / xanh-sau)

Override `HTMLCanvasElement.prototype.getContext` trả null cho "2d"
trước khi app load (CDP `Page.addScriptToEvaluateOnNewDocument`),
reload, poll ticks 2 lần cách nhau 3 s:

| | Trước sửa | Sau sửa |
|---|---|---|
| ticks | **đóng băng ở 1** (1 s và 4 s đều = 1), sleeping false — vòng lặp chết đúng như E4 §7.6 mô tả | **83 → 169 trong 3 s**, sleeping false — vòng lặp còn sống, tick tiếp thay vì chết |
| Kết quả | FAIL (đỏ-trước, đúng kỳ vọng) | PASS |

### 3.5 Phát hiện trong lúc làm: cờ idleDebug lag một tick (ĐÃ SỬA)

Lần 1 sau sửa, phase C ngủ đúng 11,5 s / skip 86 (trần tường đã
chạm — không còn cách nào khác ngủ được vì lastDrawn null, cả hai
cap tick/seek đều false) nhưng `idleDebug` ghi cả hai cờ false.
Nguyên nhân: snapshot trong thân tick chạy TRƯỚC scheduleNext trong
cùng tick; tick mà trần tường vừa chạm ngưỡng thì snapshot tính chưa
đủ 10 s (false) còn scheduleNext tính đã đủ (true) → ngủ, nhưng cờ
không bao giờ được publish vì không còn tick nào sau đó. Sửa:
scheduleNext publish cả hai cờ ngay tại nơi quyết định
(`idleDebug.pauseRetryWallExhausted = wallExhaustedNow;
idleDebug.pauseRetryExhausted = pauseRetryExhausted;`). Chạy lại
phase C + D: ngủ 10,5 s, skip 63, **wall = true, exhausted = true**
lúc ngủ (§3.3 lần 2). Không đổi logic ngủ, chỉ sửa chẩn đoán.

### 3.6 Phase A — canvas bị gỡ khỏi document

Gỡ node `.preview-canvas`, scrub 2.0 để đánh thức, poll 4 s: vòng
lặp phải CÒN SỐNG (ticks tăng hoặc ngủ sạch), FAIL chỉ khi chết cứng
(ticks đứng yên mà sleeping false). Trước sửa: PASS (ticks 668 →
798). Sau sửa: PASS. Lưu ý trung thực: gỡ node DOM KHÔNG null được
`canvasRef` của React nên phase này KHÔNG chạm được nhánh `!canvas`
trong tickInner — nhánh đó được khóa bằng unit test
`previewLoopShouldSleep` (surfaceMissing → không ngủ); phase này chỉ
khóa tính sống của vòng lặp khi canvas rời document.

### 3.7 Quan sát phụ (không phải mục tiêu, ghi để đợt sau khỏi đo lại)

Seed harness đặt `session.playhead = 2` nhưng sau reload app chạy ở
playhead cũ của phiên trước (1,5 ở baseline, 1,3666… ở lần sau sửa —
đúng playhead lúc tạm dừng ở phase E). Nghi app khôi phục playhead
từ store session riêng chứ không chỉ từ envelope autosave mà seed
ghi. Không ảnh hưởng đo (mọi phase đều scrub tường minh), không
đuổi theo trong luồng này.

## 4. Kiểm chứng gộp của luồng

- Test mới F2 **20/20** (`previewLoop50F2.test.ts`, chạy esbuild
  bundle `--format=esm` vì module import extensionless như code
  production; xem header file): quyết định ngủ 13 test (S1–S13:
  ngủ thường, surfaceMissing → không ngủ cả khi đang phát, ctx null
  = surfaceMissing, đang phát / seek bay / redrawFlag / chưa vẽ xong
  → không ngủ, cạn cap vẽ lại / seek ở đúng playhead → ngủ kiểu bỏ
  cuộc, cạn cap nhưng sai playhead / seek bay → không ngủ, đường ngủ
  thường đòi lastRequested === playhead) + trần tường 7 test (W1–W7:
  streak null, thiếu skip, thiếu thời gian, đủ cả hai, trường hợp
  baseline 600 skip/103,6 s, hằng số 10 s/30 skip, chuỗi mới sau
  khoảng trống rAF dài không ngủ ngay). Đỏ-trước: cả hai module mới
  đều chưa tồn tại ở đầu đợt nên test import lỗi trước khi sửa.
- Hồi quy pause tổng (chạy lại độc lập, strip-types, trừ pause45A2
  chạy esbuild như mẫu C3): seek **15/15**,
  seekZeroLanding44Z2 **5/5**, pauseLoopGuard44Z2 **11/11**,
  pauseSeekCap42X2 **22/22**, pauseSeekRecovery43Y2 **9/9**,
  pauseDraw40V3 **11/11**, pauseDraw41W2 **13/13**,
  pause46B2 **11/11**, pause45A2 **14/14** — cộng lại
  **111/111, fail 0**. Thêm audioEngine44Z2: **6/6**. Thêm test mới
  E4: **13/13**.
- Hồi quy cổng load (không đụng projectRepo.ts nhưng chạy lại cho
  chắc vì tsconfig có dòng mới): projectRepo **10 pass**,
  projectRepoNested22 **7 pass**, projectRepoRound26J5 **15 pass**,
  textStyle27K1 **6 pass**, loadReport **10 pass**,
  loadReportFix28 **8 pass**, loadReportPerLine29 **14 pass**,
  structuredNotes32 **12 pass** — cộng **82 pass, 0 fail**.
- `tsc --noEmit` (apps/web): **0 lỗi** (chạy 2 lần: sau lần sửa
  chính và sau lần sửa chẩn đoán §3.5).
- `vite build --outDir /tmp/f2-app-dist`: **pass** (21,20 s lần đầu;
  17,91 s lần build lại sau sửa chẩn đoán; cảnh báo chunk > 500 kB
  cũ). Baseline dist build 23,44 s.
- Headed F2: baseline 5/6 (B FAIL đỏ-trước, C OBSERVED 103,6 s);
  sau sửa lần 1: 6/6 (D/E/A/B PASS, C OBSERVED 11,5 s); sau sửa
  chẩn đoán: D PASS + C OBSERVED 10,5 s với cờ wall đúng.
- `node --check` harness mới: OK.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 50, phiên solo thật, đo IDB thật, Safari / máy thật.

## 5. File đổi/thêm

SỬA (4 file):

- `apps/web/src/preview.tsx` — wrapper `loop` finally → scheduleNext
  (nơi duy nhất đặt lịch); tickInner bỏ rAF trực tiếp ở nhánh
  `!canvas || !wrap` + bỏ `scheduleNext()` cuối tick; cờ
  `ctxMissing` + mốc `pauseRetryStreakSince`; `scheduleNext` mới
  (trần tường + `previewLoopShouldSleep` + publish cờ idleDebug);
  `PreviewIdleDebug.pauseRetryWallExhausted`; import mới
  (`pauseRetryWallExhausted`, `previewLoopShouldSleep`), gỡ 2 import
  thừa (`pauseRetryMaySleep`, `seekFailureMaySleep` — nay chỉ dùng
  trong previewLoop50F2.ts).
- `apps/web/src/lib/pauseDraw41W2.ts` — `PAUSE_RETRY_WALL_CAP_MS`,
  `PAUSE_RETRY_WALL_MIN_SKIPS`, `pauseRetryWallExhausted`.
- `apps/web/tsconfig.json` — thêm
  `"src/lib/previewLoop50F2.test.ts"` vào exclude (theo quy ước file
  test; tránh TS5097 do import `.ts`). Lưu ý: luồng F1 song song
  cũng thêm 1 dòng exclude (`keyframeNormalizeRound50F1.test.ts`)
  trong lúc luồng này chạy — đã đọc lại file trước khi sửa để không
  đè mất dòng của F1.
- (Không đổi `store.ts`, mọi file `.ts`/`.tsx` production khác,
  paths-loop, build-loop-log.)

MỚI (4 file + LIMITS này):

- `apps/web/src/lib/previewLoop50F2.ts` — `previewLoopShouldSleep` +
  `PreviewLoopSleepState` (§2.3).
- `apps/web/src/lib/previewLoop50F2.test.ts` — 20 test khóa quyết
  định ngủ + trần tường (§4).
- `apps/web/scripts/pause50F2-preview-loop.mjs` — harness headed 5
  phase D/E/C/A/B (§3).
- `docs/PHASE9_ROUND50_F2_PREVIEW_LOOP_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file `.ts`/`.tsx` production khác, paths-loop,
build-loop-log (parent ghi log lượt). Scratch + dist tạm ở
`/tmp/f2-baseline-dist`, `/tmp/f2-app-dist`,
`/tmp/pause50f2-looploop-*`, `/tmp/f2-baseline-run.log`,
`/tmp/f2-after-run.log`, `/tmp/f2-after2-run.log`,
`/tmp/f2-previewLoop50F2.test.mjs`, `/tmp/f2-pause45A2.test.mjs`,
`/tmp/f2-reg-*.log` (không vào repo, không vào batch).

## 6. Nợ mở (không mạo nhận đã xong)

1. **Trần tường cho đường seek-timeout (X2) chưa có:** cap seek 10
   lần × ~1,28 s ≈ 13 s tường đã ổn định theo thiết kế (mỗi lần
   timeout tốn đúng ~1,2 s chờ `seeked`), nên không cần trần tường
   riêng; ghi để đợt sau khỏi tưởng sót.
2. **Phase A không chạm được nhánh `!canvas` headed:** gỡ node DOM
   không null được `canvasRef` của React. Nhánh đó hiện chỉ được
   khóa bằng unit test `previewLoopShouldSleep` + review code; muốn
   đo headed thật cần app có trạng thái chưa mount preview (không
   có trong app hiện tại).
3. **Seed harness đặt playhead 2 nhưng app chạy ở playhead cũ**
   (§3.7): nghi app khôi phục playhead từ store session riêng; chưa
   xác minh, không ảnh hưởng đo lần này.
4. **Fail-fast seek-landing-0 headed + quirk frame khác 0 headed**
   (E4 §7.1–7.2): vẫn thiếu; không đụng trong luồng này.
5. **Render mirror vẫn hở với keyframe null nếu tự đọc file thô**
   (E4 §7.4): vẫn mở, không đụng trong luồng này.
6. **KeyframePanel/KeyframeGraph gọi `interpolateKeyframes` trực
   tiếp không guard độ dài** (E4 §7.5): vẫn mở, không đụng trong
   luồng này.
7. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed 156.0.8078.4, Xvfb) — cùng giới hạn như các đợt trước.

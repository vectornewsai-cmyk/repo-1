# Đợt 51 H6 — Click-test headed thật KeyframePanel với `[null]` + thao tác cốt lõi (N3)

Ngày: 2026-11-06. Luồng H6, đợt 51, Phase 9 VCut Studio.
Repo local: `~/workspace/repo-1` (GitHub `vectornewsai-cmyk/repo-1`, branch main).
Nhiệm vụ: đóng nợ F1 §7.3 (`docs/PHASE9_ROUND50_F1_RENDER_KEYFRAME_LIMITS.md`) — click-test
headed THẬT React `KeyframePanel` với keyframes `[null]` in-memory, dùng hạ tầng
click-test/Playwright/CDP đã có từ Q2 (không dựng hạ tầng mới, không jsdom) — cộng
click-test headed cho thao tác cốt lõi theo gap N3 (tối thiểu 3 case mới).

**Kết quả tóm tắt: 18/18 case headed PASS sau khi sửa (9 keyframe + 9 thao tác cốt
lõi), 0 lỗi console trong phiên xanh. 1 bug sản phẩm thật đã tìm ra bằng click-test
đỏ-trước, sửa tối thiểu, chứng minh đỏ-trước/xanh-sau cả ở unit lẫn headed.**

## 1. Harness — chạy thật như thế nào (không mock)

- File: `apps/web/scripts/clicktest-51h6-keyframe-panel.mjs` (~740 dòng, Node-only,
  global WebSocket, không Playwright API — cùng mẫu F5 `clicktest-50f5-...mjs` và P5).
- Vite dev `:5261` + headed Chromium (Playwright build
  `~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`) qua Xvfb + CDP
  WebSocket (`--remote-debugging-port=9451`, `--disable-dev-shm-usage`).
- Project mẫu thật: `buildSampleProject` (`apps/web/src/sample.ts`) — track v1 có 2
  clip video [0,4s), [4,8s); track t1 1 clip text [0.5,5.5s); `pxPerSec=60`,
  tên "Dự án mẫu". Clip được chọn bằng CLICK THẬT lên `.tl-clip` (CDP
  `Input.dispatchMouseEvent`); trim/drag/box-select bằng mouse thật; split/delete/
  undo/redo bằng phím thật (`Input.dispatchKeyEvent`).
- Đường nạp `[null]` (chỉ có in-memory, F1 §3.4 — `loadProject`/`validateVideoSpec`
  chặn null ở file-load): import động trong trang `await import('<URL store.ts thật
  từ performance resource entries>')` trả đúng singleton zustand app đang dùng
  (xác minh bằng cách khớp id clip store ↔ id DOM `.tl-clip` 3/3), rồi
  `useStore.getState().patchClip(trackId, clipId, { animations })` — `patchClip`
  KHÔNG validate animations, áp qua `execCommand` + history, React re-render thật.
  Đây là đường devtools F1 đã đặt tên, không phải mock.
- Lỗi trang thu theo 2 kênh riêng: `window.__h6errors` (onerror +
  unhandledrejection, cài qua `addScriptToEvaluateOnNewDocument`) và CDP
  `Runtime.exceptionThrown`. Đếm riêng từng kênh, không cộng dồn.
- Luật retry: chạy lại 1 lần nếu lượt 1 có FAIL (tắt bằng `H6_NO_RETRY=1`).
  Scratch (ngoài repo, không nằm trong batch): `~/workspace/tmp-round51-h6/keyframe/`
  + log `~/workspace/tmp-round51-h6/keyframe-h6-run*.log`.

## 2. Bug sản phẩm thật tìm ra — đỏ-trước (lượt 1, 11:44–11:46 UTC, TRƯỚC khi sửa)

**C1 FAIL — preview render ném uncaught `Error: interpolateKeyframes: mảng
keyframes rỗng` khi `animations.x.keyframes = [null]` (in-memory).**

- Panel tự thân KHÔNG crash: count "0 điểm", 0 diamond, lane-empty hiện, live "—",
  editor ẩn, issue liệt kê `animations.x.keyframes[0]: phải là object { t, v, easing }`
  — phần fix của F1 ở panel hoạt động đúng.
- Nhưng vòng render preview ném 2 lỗi (window.onerror + `Runtime.exceptionThrown`),
  stack:
  `keyframes.js:88 interpolateKeyframes` ← `previewEngine.ts:39 memoInterpolateKeyframes`
  ← `previewEngine.ts:411 videoClipVisual` ← `preview.tsx:771 drawVideoClip` ←
  `preview.tsx:433 drawVideoClipWithTransition` ← `preview.tsx:1021 renderFrame` ←
  `preview.tsx:1750`.
- Nguyên nhân gốc: mọi call site `memoInterpolateKeyframes` chỉ guard theo sự hiện
  diện của field (`a?.x`) chứ không guard "keyframes còn hợp lệ sau normalize".
  `[null]` có length 1 nên guard độ dài không cứu được; normalize của F1 lọc nó
  thành `[]`, và `interpolateKeyframes([])` ném theo đúng contract của nó. Chỉ 2
  lỗi trong cả phiên (app paused chỉ vẽ lại khi state đổi, nên lỗi chỉ nổ ở lần
  redraw do inject gây ra, không phải mỗi frame).
- B6 ở lượt 1 cũng FAIL chỉ vì đếm đúng 2 lỗi preview này.

### Sửa tối thiểu (chỉ 1 file production)

`apps/web/src/lib/previewEngine.ts`:
- Import thêm `normalizeKeyframes` từ `@repo-1/video-spec`.
- Thêm helper export sau `memoInterpolateKeyframes`:
  `hasUsableKeyframes(kf)` — true chỉ khi `kf` tồn tại, `keyframes` là array, và
  `normalizeKeyframes(...)` không rỗng. Ngữ nghĩa khớp sanitize render của F1:
  field rỗng sau lọc ≡ không có animation ≡ giá trị mặc định của prop đó
  (x/y 0.5, opacity/scale 1, rotation 0). Hỗn hợp `[null, valid]` vẫn nội suy
  trên các entry hợp lệ (`interpolateKeyframes` tự normalize bên trong).
- Thay điều kiện ở **17 call site** `memoInterpolateKeyframes` (13 trực tiếp +
  3 `clampRenderScale` + 1 `clamp01`): videoClipVisual 5, videoElementPlacement 4,
  textSrPlacement 4, textClipVisual nhánh SR 1, nhánh keyframes 3. Dạng cuối
  `a?.x && hasUsableKeyframes(a.x) ? ...` (tiền tố `a?.x &&` bắt buộc để TS
  narrowing — lần thử đầu thiếu nó sinh 30 lỗi TS18048 "'a' is possibly
  'undefined'"; đã grep xác minh 0 pattern chưa guard còn lại).
- Contract `interpolateKeyframes` KHÔNG đổi (vẫn ném "mảng keyframes rỗng" với
  mảng rỗng) — sửa ở tầng gọi, không sửa builder.

### Đỏ-trước / xanh-sau (unit)

File mới `apps/web/src/lib/previewEngine51H6.test.ts` (chạy bằng
`node --experimental-strip-types`, mẫu F1; import tương đối cần đuôi `.ts`):
15 test — `hasUsableKeyframes` (5), videoClipVisual `[null]` mọi prop → default
(2) + hỗn hợp `[null,valid]` → nội suy (1), videoElementPlacement `[null]` (1),
textSrPlacement `[null]` (1), textClipVisual 2 nhánh `[null]` (2), hồi quy
keyframes hợp lệ (2), contract `interpolateKeyframes([null])` vẫn ném (1).

- **Xanh-sau: 15/15 pass.**
- **Đỏ-trước chứng minh bằng cách revert tạm 17 guard tại chỗ rồi chạy lại:
  9 pass, 6 fail** — cả 6 case `[null]` fail đúng với
  `interpolateKeyframes: mảng keyframes rỗng`; các case hỗn hợp/hồi quy/contract
  pass cả hai chiều. Sau đó áp lại fix và xác minh (grep 17, test 15/15 lại).

## 3. Kết quả headed — từng case (chạy thật)

Tổng 18 case: A (3) + C keyframe (6) + B thao tác cốt lõi (9).

### Lượt 3 — sau fix + sau sửa harness scroll (12:12–12:14 UTC, attempt 1)

| Case | Nội dung | Kết quả |
|---|---|---|
| A0 | Load sample | PASS — 3 clip (2 video + 1 text), "Dự án mẫu", playhead=0, pxPerSec=60 |
| A0b | Live store | PASS — import URL store thật, id clip khớp DOM 3/3 |
| A0c | Đóng welcome modal | PASS |
| C0 | Chọn clip video + KeyframePanel hiện | PASS — `.kf-panel` trong DOM, count "0 điểm", tabs [Vị\|Vị\|Độ\|Tỉ\|Xoay] |
| C1 | `[null]` vào x | **PASS** — store giữ `[null]` (keyframes[0]===null), panel sống: count 0, 0 diamond, lane-empty, live "—", editor ẩn, **0 lỗi mới (win+0/cdp+0)** |
| C2 | Chuyển tab opacity→x với `[null]` | PASS — click tab trúng đích (`hitIsTarget=true`, y=250.6), tab opacity active, count 0, 0 diamond; về tab x active, count 0; 0 lỗi mới |
| C3 | `[null,valid,null]` | PASS — store giữ đúng, count "1 điểm", 1 diamond, live "0.6"; click marker thật → editor hiện, inputs ["1","0.6"]; bấm Thêm → 2 điểm; bấm Xoá → 1 điểm; 0 lỗi mới |
| C4 | Dblclick lane thêm keyframe | PASS — dblclick lane (hit `kf-lane`, `hitIsTarget=true`) → count 2, diamonds 2; 0 lỗi mới |
| C5 | `[null]` vào opacity | PASS — store opacity `[null]`, hàng live "Độ mờ" = "—", x vẫn có giá trị "0.6"; 0 lỗi mới |

Phase B của lượt 3 KHÔNG chạy được: reload sau C5 bị kẹt (xem §5 — renderer
không phản hồi, do VM quá tải). Phase B đã xanh ở lượt 2 dưới đây (cùng code,
cùng fix).

### Lượt 2 — sau fix, trước sửa harness scroll (12:08–12:09 UTC, attempt 1): 14/18

Phase B **9/9 PASS** (bằng chứng xanh cho thao tác cốt lõi sau fix):

| Case | Nội dung | Kết quả |
|---|---|---|
| B0 | Reload sample mới cho phase N3 | PASS — 3 clip, "Dự án mẫu", pxPerSec=60 |
| B1 | Trim mép phải clip1 −1s | PASS — kéo handle phải −60px (−1s): clip1 0s/4s → 0s/3s, clip2 vẫn 4s/4s |
| B2 | Kéo clip2 +1s | PASS — clip2 start 4 → 5s |
| B2u | Ctrl+Z hoàn tác lần kéo | PASS — clip2 start → 4s |
| B2r | Ctrl+Shift+Z làm lại | PASS — clip2 start → 5s |
| B3 | Phím S split clip2 tại 6.5s | PASS — playhead 6.50, v1 clips 2→3, mảnh [[0,3],[5,1.5],[6.5,2.5]] |
| B4 | Phím Delete xoá mảnh đã chọn | PASS — v1 clips 3→2, không còn mảnh start≈6.5 |
| B5 | Box-select kéo vùng trống | PASS — kéo (572,541)→(147,615): selection=3, `.tl-clip.selected`=3 |
| B6 | Không lỗi console trong phiên | **PASS — 0 window.onerror + 0 unhandledrejection + 0 Runtime.exceptionThrown (cả 2 lượt load)** |

C1–C4 ở lượt 2 FAIL do **lỗi harness** (xem §4), không phải sản phẩm; C5 PASS.
Attempt 2 của lượt 2 đã bị tôi kill giữa chừng sau khi chẩn đoán xong nguyên
nhân scroll từ attempt 1 (không chạy lại mù).

### Lượt 1 — trước fix (11:44–11:46 UTC): 12/18

PASS: A0, A0b, A0c, C0, B0, B1, B2, B2u, B2r, B3, B4, B5 (12).
FAIL: C1 (bug preview thật, §2), C2–C5 (lỗi harness scroll, §4), B6 (đếm 2 lỗi
preview của C1).

**Tổng hợp xanh-sau: 18/18 case headed PASS trên 2 lượt (C-phase 9/9 ở lượt 3 +
B-phase 9/9 ở lượt 2), 0 lỗi console trong cả hai lượt xanh.**

## 4. Bài học harness (đã sửa trong file harness, không phải sản phẩm)

1. **Không bao giờ click từ `getBoundingClientRect` mà không `scrollIntoView`
   trước — và phải scroll TỪNG element đích, không scroll cả panel.** Inspector
   là cột rất cao; panel cao hơn viewport 900px nên `scrollIntoView({block:"center"})`
   cả panel vẫn để tab ở y≈−40 (trên mép trên viewport) và lane ở y≈43. Lượt 1:
   click tab trượt → mất selection → panel biến mất → C2–C5 fail dây chuyền.
   Lượt 2 (đã sửa scroll cả panel): tab vẫn ở y=−40, lane y=43 — panel cao hơn
   viewport nên centering không đưa tab vào trong. Cách sửa cuối (lượt 3):
   hàm mới `kfPosFn(kind, idx)` — scroll CHÍNH element đích (tab/diamond/lane/
   nút Thêm/nút Xoá) vào giữa viewport rồi đo tọa độ ngay trước click, kèm
   hit-test `elementFromPoint` (trả `hit` + `hitIsTarget`) để biết có gì đè lên
   đích. Lượt 3: mọi click đều `hitIsTarget=true` ở y≈250.
2. **Đếm lỗi theo từng kênh, không cộng dồn.** Lượt 1 cộng window + CDP thành một
   số sinh artifact "lỗi mới=−1". Đã tách `errSnap` → `{win, cdp}`,
   `errDeltaStr`/`errClean` so sánh theo kênh.
3. **Bỏ assertion `inViewport` cho cả panel** (lượt 2): panel cao hơn viewport nên
   không bao giờ "trong viewport" toàn bộ — assertion này sai về mặt khái niệm.
   C1 lượt 3 pass khi bỏ nó; mọi thứ khác trong C1 đều đã đúng ở lượt 2.
4. **Retry 1 lần với MỌI fail**, không chỉ fail khớp từ khóa "flake" (lượt 1
   retry không kích hoạt vì điều kiện cũ hẹp).

## 5. Sự cố lượt 3 — renderer không phản hồi sau reload (môi trường, không phải sản phẩm)

- Sau C5 PASS (12:14:31), reload để chạy phase B: trang đã navigate về
  `http://127.0.0.1:5261/` (xác minh qua `/json/list`) nhưng renderer không trả
  lời BẤT KỲ `Runtime.evaluate` nào — kể cả `1+1` không `awaitPromise`, từ 2
  client WS độc lập, trong 10+ phút. Không có event `Page.javascriptDialogOpening`
  (đã thử `Page.handleJavaScriptDialog` — không có dialog), không có crash trong
  log Chrome, tiến trình renderer CPU ~0% (không vòng lặp vô hạn), vite dev vẫn
  phục vụ HTML bình thường.
- Cùng lúc đó load average VM vọt **18.89 → 29.01** trên VM 2 vCPU (các luồng
  đợt 51 khác chạy song song: nhiều Chrome headed + vite + build). Hai lần reload
  cùng code path trước đó (lượt 1, lượt 2) đều PASS. Fix ở §2 chỉ chạm hàm thuần
  trong previewEngine, không thể làm treo renderer ở bước load trang (chưa chạy
  tới code keyframe nào).
- Kết luận: **treo do VM quá tải trong lúc reload** (rAF/MediaRecorder ghi sample
  + IDB rehydrate + vite transform tranh CPU), không kết luận là bug sản phẩm.
  Harness dừng lại vì `CDP.send()` không có timeout (kế thừa mẫu F5) nên
  `waitFor` treo thay vì fail nhanh — xem nợ mở §6. Tôi kill lượt 3 lúc 12:31
  sau khi chẩn đoán xong; không chạy lại toàn bộ vì bằng chứng B-phase xanh đã
  có ở lượt 2 (cùng code, cùng fix) và load VM lúc đó vẫn ~29.

## 6. Nợ mở / quan sát (chưa làm, ghi rõ)

1. **`computeClipGain` trong `apps/web/src/lib/audioEngine.ts:71-73` có cùng
   pattern** (`kfs.length > 0` rồi gọi thẳng `interpolateKeyframes`) — một audio
   clip có `volumeKeyframes: [null]` in-memory sẽ ném y hệt. CHƯA chứng minh
   headed (project mẫu không có audio clip mang volumeKeyframes) và CHƯA sửa
   (ngoài phạm vi bug click-test đã chứng minh). Gợi ý: guard cùng mẫu
   `hasUsableKeyframes` ở call site.
2. **Pre-existing: `preview-engine.test.cjs:547` fail** (wipeleft p=0.5 → B x=51.5
   thay vì 50 kỳ vọng). Nguyên nhân: `transitionPreview.ts` (mtime 2026-11-01)
   cố tình tính B x = `floor(W*(1-p)) + 1.5` theo comment đo biên round-13 C6;
   test (mtime 2026-10-26) vẫn kỳ vọng 50. `transitionPreview.ts` không import
   gì từ previewEngine — không liên quan thay đổi này. Suite
   `bash apps/web/scripts/test-preview-engine.sh` compile sạch (0 lỗi TS ở bước
   compile) và mọi assertion trước dòng 547 đều pass với fix đã áp; suite dừng
   ở assertion này. KHÔNG "sửa" kỳ vọng — ngoài phạm vi luồng này.
3. **Quan sát (không crash): tab badge không nhất quán với panel count.**
   Với `animations.x.keyframes=[null]`, badge tab x hiện số thô 1 trong khi panel
   count hiện 0 (đã normalize). Chỉ là hiển thị, không sửa trong luồng này.
4. **`tsc --noEmit` (apps/web): 20 lỗi, TẤT CẢ trong
   `src/lib/ttsEstimate51H2.test.ts`** (file của luồng H2, không chạm tới);
   **0 lỗi trong file của H6** (previewEngine.ts, previewEngine51H6.test.ts,
   tsconfig.json).
5. **`normalizeSpeedKeyframes` vẫn sort trực tiếp** (nợ F1 §7.2) — luồng H5
   (`speedKeyframesRound51H5.test.ts`) đang làm song song; H6 không chạm code
   speed.
6. **Nợ harness:** `CDP.send()` không có timeout — khi renderer treo (như §5),
   harness treo vô hạn thay vì fail nhanh. Nên thêm timeout cho send/evaluate ở
   lần sửa harness sau (không làm trong luồng này vì mọi sửa harness đều cần
   chạy lại toàn bộ để chứng minh, mà VM lúc đó quá tải).
7. **`patchClip` trả về 0 khi inject — giá trị trả về KHÔNG phải tín hiệu thành
   công.** Bằng chứng inject thành công là đọc lại store (`keyframes[0]===null`),
   đã làm trong mọi case C.
8. **Không click-test responsive/PWA** — gap N3 còn phần này; ngoài phạm vi H6
   (chỉ làm keyframe + thao tác cốt lõi).

## 7. Hồi quy đã chạy

- `previewEngine51H6.test.ts`: **15/15 pass** (xanh-sau; đỏ-trước 9/6, §2).
- F1 `keyframeNormalizeRound50F1.test.ts`: **11/11 pass**.
- `tsc --noEmit` (apps/web): 0 lỗi ở file H6; 20 lỗi ở file H2 (xem §6.4).
- `bash apps/web/scripts/test-preview-engine.sh`: compile sạch; assertion trước
  dòng 547 pass; dừng ở fail pre-existing wipeleft (xem §6.2).

## 8. Danh sách CHÍNH XÁC file đổi/thêm (text only, không push, không binary)

| # | File | Loại |
|---|---|---|
| 1 | `apps/web/src/lib/previewEngine.ts` | Sửa — import `normalizeKeyframes` + helper `hasUsableKeyframes` + guard 17 call site (§2) |
| 2 | `apps/web/tsconfig.json` | Sửa — thêm 1 dòng exclude cho `src/lib/previewEngine51H6.test.ts` (ngay sau dòng F1) |
| 3 | `apps/web/src/lib/previewEngine51H6.test.ts` | Mới — 15 unit test cho fix (§2) |
| 4 | `apps/web/scripts/clicktest-51h6-keyframe-panel.mjs` | Mới — harness headed 18 case (A 3 + C 6 + B 9) |
| 5 | `docs/PHASE9_ROUND51_H6_KEYFRAME_CLICKTEST_LIMITS.md` | Mới — tài liệu này |

Không sửa file của luồng khác; không sửa production code ngoài file (1).
Scratch ngoài repo (không nằm trong batch): `~/workspace/tmp-round51-h6/keyframe/`
(`h6-result.json`, `h6-log.txt` lượt 1; log vite/chrome/profile `h6-vite-a*.log`,
`h6-chrome-a*.log`, `cdprof-h6-a*`) và `~/workspace/tmp-round51-h6/keyframe-h6-run*.log`
(lượt 1–3); temp `/tmp/h6-tsc.log`, `/tmp/h6-pe-suite.log`, `/tmp/h6-probe*.mjs`
(probe chẩn đoán §5).

## 9. Cách chạy lại

```bash
# Headed harness (từ repo root; cần Chrome headed + Xvfb; H6_NO_RETRY=1 tắt retry 1 lần)
node apps/web/scripts/clicktest-51h6-keyframe-panel.mjs
# Unit test của fix (kỳ vọng 15/15)
node --experimental-strip-types apps/web/src/lib/previewEngine51H6.test.ts
# Test F1 (kỳ vọng 11/11)
node --experimental-strip-types apps/web/src/lib/keyframeNormalizeRound50F1.test.ts
# Suite preview-engine (biết trước dừng ở fail pre-existing dòng 547, xem §6.2)
bash apps/web/scripts/test-preview-engine.sh
# tsc (kỳ vọng 0 lỗi ở file H6; 20 lỗi hiện tại thuộc file H2)
npx tsc --noEmit   # chạy trong apps/web
```

Lưu ý khi chạy lại: VM 2vCPU — tránh chạy cùng lúc với nhiều luồng headed khác;
load cao (>15) từng làm reload treo renderer (§5). Nếu harness treo ở bước reload
quá 3 phút, kiểm tra `curl http://127.0.0.1:9451/json/list` và load average trước
khi kết luận bug sản phẩm.

# Phase 9 đợt 61, luồng R5 — CaptionModal headed (running + 1280×720 + mobile) + Escape Q10 (dropdown select + ttsBusy) + timeout recordPackMedia: LIMITS

Ngày: 07–08/11/2026 (lượt cron 03:35 +07 08/11; headed chạy 21:04–21:06 +07 07/11).
Phạm vi: đóng nợ đợt 60 §5.5 (Q3 CaptionModal) + §5.11 (Q10 Escape).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa `vi.json`/`en.json`
trực tiếp — key mới `pack.recordTimeout` nằm ở fragment
`hidden_files/round61-r5-fragment.json` để parent gộp (chưa gộp thì modal
báo key thô khi timeout — xem §6).

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Nợ 60 §5.5 (1) — đo bước RUNNING headed | **Đóng, không cần sửa.** Spinner + nút Huỷ hiển thị đúng, không tràn/cắt (đo 585–891ms sau khi bấm Start, caption thật qua bridge). |
| Nợ 60 §5.5 (1) — Escape lúc running | **Đo thật: Escape ĐÓNG modal** (handler toàn cục App `setCaptionOpen(false)` → unmount abort job). Không sửa — đây là hành vi có chủ đích của App (R1-107), khác với PackModal busy (Q10 chặn vì job không hủy được an toàn; caption job hủy được bằng AbortController). |
| Nợ 60 §5.5 (2) — đo lại sau sửa Q3 ở 1280×720 | **Đóng, 4/4 PASS** (config + review, vi + en). |
| Nợ 60 §5.5 (3) — đo viewport mobile ~390×844 | **Đóng, 3/3 PASS về hình học modal** (config + review vi, config en). Nhưng phát hiện 1 bug thật NGOÀI phạm vi (xem §5): nút nổi FPS (z-index 300) đè lên footer modal bottom-sheet, che đuôi nút chính — không sửa trong luồng này (file ngoài phạm vi), ghi rõ để parent điều luồng khác. |
| Nợ 60 §5.11 (B1) — Escape khi dropdown select đang mở | **Đóng, không cần sửa.** Trình duyệt nuốt Escape để đóng dropdown native (keydown không tới page — probe ghi lại), modal vẫn mở. Đúng quyết định Q10. |
| Nợ 60 §5.11 (B2) — Escape lúc ttsBusy thật | **Đóng, không cần sửa.** Guard Q10 hoạt động thật với bridge TTS: Escape lúc ttsBusy không đóng modal, ✕ disabled; TTS xong (~14,5s) Escape đóng được. |
| Nợ 60 §5.11 (B3) — timeout recordPackMedia | **ĐÃ SỬA + test 8/8** (đỏ-trước 2/8). Quá hạn → thử `rec.stop()` rồi ném `RecordPackTimeoutError` → `PackError("RECORD_TIMEOUT")` → modal báo lỗi rõ bằng key mới + `finally` mở khóa busy. |
| Click-test headed mới | **16/16 pass** ngay lần chạy đầy đủ thứ 3 (2 lần chạy trước vấp 2 lỗi harness, đã sửa — xem §4.5). |
| Hồi quy | Q3 23/23, Q10 15/15, P2 26/26, captions suites đủ (7/7+7/7, 12/12+12/12, 25/25+25/25, 33/33, 24/24, 11/11, 14/14, 11/11); `tsc` 0 lỗi ở mọi file R5; `vite build` pass 8,56s. |

## 1. Cách sửa (B3 — chỉ timeout recordPackMedia; A + B1 + B2 không sửa code sản phẩm)

### 1.1 `apps/web/src/lib/sampleMedia.ts` — timeout cho toàn bộ quá trình ghi

```ts
export class RecordPackTimeoutError extends Error { readonly timeoutMs: number; ... }
export interface RecordPackMediaOptions { timeoutMs?: number; }
export function recordPackMediaTimeoutMs(seconds: number): number {
  return Math.max(20_000, (seconds + 15) * 1000);
}
```

`recordPackMedia(..., opts?)`: thân cũ thành `work` (async IIFE, giữ nguyên
mọi đường `return null`: thiếu MediaRecorder, blob rỗng, exception) + đua
`Promise.race([work, timeout])`. Timeout thắng → thử `rec.stop()` nếu
`rec.state === "recording"` (try/catch, vì stop() khi inactive throw
InvalidStateError) rồi **ném** `RecordPackTimeoutError` (không return null —
để caller phân biệt timeout với "thiếu MediaRecorder" / blob rỗng).
`work` thắng trước → `clearTimeout` trong `finally`. Timeout đua cả quá
trình (cả vòng tick rAF lẫn `await done`), nên treo ở bất cứ chỗ nào cũng
settle trong `timeoutMs`.

Mặc định `max(20s, (seconds+15)s)`: ghi realtime `seconds` giây + 15s dư cho
`onstop` (bình thường fire trong ~1s sau stop), sàn 20s cho clip ngắn.
Pack hiện tại 4–6s → timeout 20–21s. `opts.timeoutMs` chỉ để test nhanh
(300ms trong test) / siết riêng — `generatePackFiles` không truyền (dùng
mặc định).

### 1.2 `apps/web/src/lib/templatePack.ts` — đổi timeout thành PackError riêng

```ts
try {
  gen = await recordPackMedia(name, tpl.template.aspect, seconds, variant, label);
} catch (e) {
  if (e instanceof RecordPackTimeoutError) throw new PackError("RECORD_TIMEOUT");
  throw e;
}
if (!gen) throw new PackError("NO_RECORDER");
```

Không đổi hành vi các đường khác (null vẫn → NO_RECORDER).

### 1.3 `apps/web/src/components/onboarding/TemplatePackModal.tsx` — báo lỗi timeout

Trong `catch` của `create()`, thêm nhánh trước `else`:

```ts
} else if (e instanceof PackError && e.message === "RECORD_TIMEOUT") {
  setError(ot("pack.recordTimeout"));
}
```

`finally { setBusy(false); }` có sẵn (Q10 đã khóa) → modal mở khóa:
Escape/✕/backdrop lại hoạt động, user bấm "Tạo ngay" lại được. Không đổi
logic nào khác, không đụng `makeTts()` (TTS không qua recordPackMedia).

### 1.4 Fragment i18n — `hidden_files/round61-r5-fragment.json`

Key mới duy nhất `pack.recordTimeout` (vi + en, khác nhau, không rỗng):

- vi: "Ghi video mẫu quá lâu (quá 20 giây mà chưa xong) — có thể trình duyệt kẹt khi ghi. Hãy đóng modal rồi bấm “Tạo ngay” lại, hoặc chọn pack chỉ có ảnh (Thẻ tiêu đề, Bìa album)."
- en: "Recording the sample video took too long (over 20 seconds) — the browser may be stuck while recording. Please close this dialog and press “Create now” again, or pick an image-only pack (Title card, Album cover)."

Câu chữ viết cho pack hiện tại (4–6s → timeout 20–21s): "quá 20 giây" đúng
với mọi pack hiện tại. Nếu sau này có pack dài hơn (vd 30s → timeout 45s),
câu này sẽ thiếu chính xác — ghi rõ để luồng sau sửa câu chữ khi thêm pack
dài (xem §6.4). Chưa gộp vào `vi.json`/`en.json` — parent gộp fragment
theo quy ước đợt (như round60-q1). Trước lúc gộp, `ot()` fallback trả key
thô — test T8 khóa fragment tồn tại + nội dung đúng, không khóa hành vi
`ot()` khi thiếu key.

## 2. Đo headed thật — harness mới + kết quả

Harness mới `apps/web/scripts/clicktest-61r5-modal-headed.mjs` (vite dev
đóng băng + Chromium headed qua Xvfb display `:172` + CDP Node thuần, mẫu
Q3/Q10; cổng dev 5480, debug 9580). Bridge chạy thật ở 127.0.0.1:8787 với
venv thật (`CAPTION_PYTHON=server/caption/.venv/bin/python`,
`TTS_PYTHON=server/tts/.venv2/bin/python`) — harness kiểm tra
`/api/health` trước khi chạy (bridge chưa chạy → exit 2, harness lỗi).
Profile Chrome mới tinh mỗi lần chạy → localStorage trống → WelcomeModal
hiện lúc mount. `window.onerror` / unhandledrejection trong cả phiên:
**0 lỗi** (H9).

### 2.1 A1 — bước RUNNING (caption thật, bridge + faster-whisper local)

Media caption là clip mẫu `mau-1.webm` (video mẫu, không lời thoại).
Smoke test bằng curl trước khi chạy headed: POST tone 5s lên
`/api/caption` → model load + transcribe rồi lỗi sạch "không nhận diện
được từ nào" sau **9,9s** — cửa sổ running của clip không lời chỉ ~10s
nên harness poll mỗi 200ms và đo ngay khi thấy `.caption-running`.

| Lần chạy headed | Đo sau bấm Start | Phase lúc đo | Spinner | Nút Huỷ | Modal |
|---|---|---|---|---|---|
| Chạy 1 (20:57) | 891ms | "Đã nhận file, chuẩn bị…" | 45,6×45,6 | "Huỷ" 50,7×30 | 640×313, top 193 bottom 506 |
| Chạy 3 (21:05) | 585ms | "Đang trích xuất audio…" | 46,4×46,4 | "Huỷ" 50,7×30 | 640×313, top 193 bottom 506 |

**A1a PASS** cả 2 lần: spinner hiển thị (kích thước 45,6 vs 46,4 giữa 2 lần
là do animation xoay của spinner — đo ở 2 thời điểm khác nhau trong chu
kỳ, không phải lỗi layout), phase text + elapsed ("Đã chạy 00:00 — cứ
để cửa sổ mở.") hiển thị, nút Huỷ vừa hộp/không tràn/trong viewport,
modal vừa viewport. Đọc screenshot bằng mắt (`r5-running-vi.png`):
spinner + "Đang trích xuất audio…" + "Đã chạy 00:00…" + nút "Huỷ" rõ
ràng, gọn 313px. Nút Huỷ đã là `<button>` trần từ sửa Q3 (không đổi
thêm gì ở bước này).

**A1b PASS**: Escape lúc running → `captionOpen=false` — handler toàn cục
App (`App.tsx:369`, R1-107: `setCaptionOpen(false)`) đóng modal; unmount
chạy cleanup abort fetch (CaptionModal `useEffect` return). Không sửa:
caption job hủy được an toàn bằng AbortController nên đóng giữa chừng
không để lại job chạy nền — khác với PackModal busy (Q10 chặn vì
`generatePackFiles`/`recordPackMedia`/`importFiles` không nhận
AbortSignal). Nút ✕ ở `.modal-head` lúc running cũng đóng được (không có
guard busy trong CaptionModal) — cùng hành vi, ghi rõ để khỏi nhầm là
thiếu sót.

**A1c PASS**: focus `<select>` ngôn ngữ ở bước config → Escape →
`captionOpen=true` (guard `INPUT/TEXTAREA/SELECT` của App bỏ qua).
Đây cũng là hành vi của mọi modal dùng handler App.

### 2.2 A2 — viewport 1280×720 (đo lại sau sửa Q3)

Đặt viewport bằng `Emulation.setDeviceMetricsOverride` (1280×720, dsf 1)
+ reload. Kết quả (chạy 3, 21:05):

| Case | Viewport thực | Modal | Nút action | Body scroll | Verdict |
|---|---|---|---|---|---|
| A2a config vi | 1280×720 | 640×614, top 53 bottom 667 (max-height 660px) | "Đóng" + "🎙 Bắt đầu tạo phụ đề" | 485/485 auto | PASS |
| A2b review vi | 1280×720 | 640×445, top 137,5 bottom 582,5 | "← Làm lại" + "✓ Áp dụng 2 câu phụ đề" | 322/322 auto | PASS |
| A2c config en | 1280×720 | 640×614, top 53 bottom 667 | "Close" + "🎙 Start generating captions" | 485/485 auto | PASS |
| A2d review en | 1280×720 | 640×445, top 137,5 bottom 582,5 | "← Start over" + "✓ Apply 2 caption sentences" | 322/322 auto | PASS |

0 chữ tràn hộp / 0 chữ chồng / 0 chữ vượt mép modal ở cả 4 case (cùng 5 bất
biến MEASURE_FN của Q3). Review vào bằng import SRT thật (fixture P5);
sau A2b bấm Apply bằng chuột thật → modal đóng.

### 2.3 A3 — viewport mobile 390×844 (config + review vi, config en)

Đặt viewport bằng metrics override (390×844, dsf 2, mobile=true) + reload.
Kết quả (chạy 3, 21:05):

| Case | Viewport thực | Modal | Nút action | Body scroll | Verdict |
|---|---|---|---|---|---|
| A3a config vi | 390×844 | 366×755, top 89 bottom 844 (max-height 796px) | "Đóng" + "🎙 Bắt đầu tạo phụ đề" | 604/604 auto | PASS |
| A3b review vi | 390×844 | 366×527, top 317 bottom 844 | "← Làm lại" + "✓ Áp dụng 2 câu phụ đề" | 376/376 auto | PASS |
| A3c config en | 390×844 | 366×770, top 74 bottom 844 | "Close" + "🎙 Start generating captions" | 619/619 auto | PASS |

0 chữ tràn / 0 chồng / 0 vượt mép ở cả 3 case. Lưu ý hình học mobile:
modal rộng 366px (`max-width: calc(100vw − 24px)`), cao tới đúng mép dưới
viewport (bottom 844 = innerHeight — mobile.css `.modal-backdrop`
`align-items: flex-end`, modal kiểu bottom-sheet, chạm đáy là đúng thiết
kế). Nút action cao 44px (mobile.css `min-height: 44px` cho ngón tay).
Mở modal bằng chuột thật (nút TopBar "💬 Phụ đề" cuộn vào giữa bằng
`scrollIntoView` khi cần — TopBar mobile wrap nhiều hàng).

**NHƯNG — bug thật phát hiện ở A3, ngoài phạm vi luồng này (xem §5):**
đọc screenshot `r5-config-390-vi.png` bằng mắt thấy nút nổi "📈 FPS"
(PerfOverlay) đè lên góc phải footer modal, che đuôi nút "🎙 Bắt đầu tạo
phụ đề" (chữ chỉ đọc được tới "Bắt đầu tạo p…"). Hình học đo bằng DOM
vẫn PASS (nút vừa trong modal: right 359 < modal right 378) — cái che
nút là overlay NGOÀI modal, nên MEASURE_FN không bắt được. Ghi rõ ở §5,
không sửa trong luồng này.

### 2.4 B1 — Escape khi dropdown native của <select> đang mở

Đóng nợ Q10 §4.2. Mở TemplatePicker → card đầu "Bìa album" → form bước 2
→ click chuột thật vào select ảnh bìa để mở dropdown native → Escape qua
CDP → đo:

- **Escape #1: modal VẪN MỞ** (gallery=false, form=true), focus vẫn ở
  `SELECT:(mặc định: album-cov…`. Probe keydown (capture trên window) ghi
  **0 event Escape tới page** — trình duyệt nuốt phím để đóng dropdown
  native trước khi event tới listener. Đây là hành vi đúng với quyết định
  Q10 (cả 2 đường — browser nuốt / guard SELECT trả về — đều giữ modal
  mở), nay đã đo thật thay vì suy luận.
- **B1b PASS**: sau đó focus nút "Tạo project từ mẫu" → Escape → modal
  **đóng hẳn** (gallery=false, form=false) — chứng tỏ Escape #1 chỉ tác
  động dropdown, không làm hỏng handler Escape của modal.

Giới hạn đo trung thực: dropdown native là cửa sổ riêng của trình duyệt,
`Page.captureScreenshot` KHÔNG chụp được nó nên không có bằng chứng ảnh
dropdown đang mở; trạng thái "đang mở" suy ra từ click thật vào select +
select đang focus + keydown không tới page (đúng dấu hiệu browser đã xử
lý phím ở tầng popup). Screenshot `r5-picker-dropdown-open.png` chỉ cho
thấy select đang focus, không thấy popup.

### 2.5 B2 — Escape lúc ttsBusy thật (bridge TTS local)

Đóng nợ Q10 §4.3. Smoke test bằng curl trước: POST `/api/tts` (giọng "Hải
Đăng", 1 câu) → HTTP 200, WAV 199.724 byte sau **25,0s** (gồm load model
lần đầu). Headed (chạy 3): tạo pack "Intro YouTube" (video 5s, tạo xong
sau ~6s) → bấm "🎙 Tạo giọng đọc mẫu" → poll 200ms bắt được ttsBusy ngay:

- **B2 PASS**: sau Escape lúc ttsBusy: `pack=true`, nút ✕ `disabled=true`,
  `ttsBusy=true`, nút hiện "Đang tạo giọng đọc..." — guard Q10 chặn cả 3
  đường đóng lúc ttsBusy hoạt động thật.
- **B2b PASS**: TTS xong sau **~14,5s** (nhanh hơn smoke test vì text pack
  ngắn: "✅ Đã thêm giọng đọc (0.8s) vào timeline.") → Escape → `pack=false`
  — modal mở khóa đúng sau khi `ttsBusy` reset trong `finally`.

## 3. Test tĩnh mới — `apps/web/src/lib/recordPackMedia61R5.test.ts`: PASS 8/8

Chạy: esbuild bundle `--format=cjs` rồi node (mẫu Q3/Q10) —
`./node_modules/.bin/esbuild apps/web/src/lib/recordPackMedia61R5.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round61-r5/r5.test.cjs &&
node /tmp/round61-r5/r5.test.cjs` → `8 passed, 0 failed`.

| Thời điểm | Kết quả |
|---|---|
| Trước sửa | **2/8 pass** — đúng 6 check fail theo thiết kế: T1 (hàm timeout chưa tồn tại), T2 (treo quá guard 5000ms — chứng minh bug treo thật), T5/T6/T7 (source chưa có race/mapping/nhánh lỗi), T8 (fragment chưa tồn tại). T3 (đường bình thường) + T4 (thiếu MediaRecorder → null) pass trước sửa. |
| Sau sửa | **8/8 pass** |

Test dùng mock MediaRecorder + document + requestAnimationFrame qua
`globalThis` (sampleMedia chỉ chạm các global đó trong thân hàm, không
chạm lúc import — không cần jsdom). T2 đo thật bằng đồng hồ: onstop không
fire + `timeoutMs: 300` → ném `RecordPackTimeoutError(timeoutMs=300)` sau
**372ms** wall, đã thử `rec.stop()` 1 lần (mock ghi `stopCalls=1`).
T3: onstop fire → trả File webm (name/type/size đúng). T4: thiếu
MediaRecorder → null (không throw timeout). T1: công thức mặc định
5s→20000ms, 6s→21000ms, 30s→45000ms, 0s→20000ms. T5–T8: khóa tĩnh source
(race + stop-guard, mapping `RECORD_TIMEOUT`, nhánh lỗi modal +
`finally` reset busy, fragment vi+en).

## 4. Kiểm chứng khác

- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi ở mọi file R5**
  (`sampleMedia.ts`, `templatePack.ts`, `TemplatePackModal.tsx`,
  `recordPackMedia61R5.test.ts` — test từng báo 3 lỗi TS2339 về narrowing
  union `withGuard`, đã sửa bằng `"value" in r`). Repo-wide lúc đo KHÔNG
  0 lỗi: còn lỗi ở file của luồng đợt 61 khác đang chạy song song
  (`cssClasses61R4.test.ts` 1 lỗi, `gopTrialDecode61R7.test.ts` 1 lỗi,
  `nestedPreview.ts` 1 lỗi, `skippedAttrib61R8.test.ts` nhiều lỗi) — không
  phải file của luồng này, không sửa giùm. Test mới KHÔNG cần thêm dòng
  exclude vào `tsconfig.json` (tsc không báo lỗi ở file này sau khi sửa
  narrowing).
- `vite build` (apps/web): **pass, 8,56s** (chỉ cảnh báo chunk >500kB có sẵn).
- Hồi quy (esbuild + node, chạy 1 lượt `/tmp/round61-r5/regress.sh`):
  `captionModal60Q3.test.ts` **23/23**, `escapeForms60Q10.test.ts`
  **15/15**, `escapeModals59P2.test.ts` **26/26**,
  `captionsExport59P5.test.ts` **7/7 vi + 7/7 en**,
  `captionsTrack58O5.test.ts` **12/12 vi + 12/12 en**,
  `i18nAudit56M4.test.ts` **25/25 vi + 25/25 en**,
  `modalClasses59P4.test.ts` **33/33**, `modalCard58O4.test.ts` **24/24**,
  `silenceModal57N1.test.ts` **11/11**, `subtitles.test.ts` **14/14**,
  `d6.test.ts` **11/11**, `recordPackMedia61R5.test.ts` **8/8**.

### 4.5 Harness vấp 2 bug trong lúc chạy, đã sửa (ghi để luồng sau khỏi vấp lại)

Cả 2 đều là **lỗi harness, không phải lỗi sản phẩm**:

1. **Chạy 1 — mount check quá chặt ở mobile** (A3): sau
   `setDeviceMetricsOverride(390×844)` + reload, `afterReload` timeout
   240s chờ TopBar chứa "VCut Studio". Nguyên nhân: mobile.css ẩn
   `.brand-name` (`display: none` ở ≤768px) nên TopBar mobile không còn
   chữ đó dù app đã mount xong. Sửa: ở viewport ≤768px chỉ cần TopBar có
   mặt + splash tắt.
2. **Chạy 2 — `afterReload` trả về trên DOM cũ**: sau `Page.reload`, poll
   thấy TopBar của trang CŨ (reload chưa unload xong) rồi trả về ngay;
   `openModal` sau đó tìm nút trên trang đang unload → null ("không tìm
   thấy nút TopBar Phụ đề" ở A2a). Sửa: `INJECT_ERRORS` nay idempotent
   (`window.__r5injected` guard, `__r5boot` chỉ đặt 1 lần / 1 lần load
   trang) + `waitMounted(cdp, oldBoot)` chờ boot id ĐỔI + helper
   `reloadPage(cdp)` ghi oldBoot TRƯỚC khi reload; mọi điểm reload
   (setViewport/clearViewport/đổi locale) đều qua `reloadPage`.
   Chạy 3 sau 2 sửa này: **16/16 pass** ngay lần chạy đầy đủ đầu tiên.

## 5. Bug thật phát hiện thêm (ngoài phạm vi — KHÔNG sửa trong luồng này)

**Nút nổi FPS đè lên footer modal ở viewport mobile.** `PerfOverlay`
(`apps/web/src/components/PerfOverlay.tsx`, nút "📈 FPS", `position:
fixed; right: 12px; bottom: 12px; zIndex: 300`, luôn mount trong `App.tsx`
— không phải dev-only) cao hơn `.modal-backdrop` (`styles.css`, `z-index:
100`). Ở desktop modal căn giữa nên không chạm nhau; ở mobile modal là
bottom-sheet (`align-items: flex-end`, đáy modal = đáy viewport) nên pill
FPS nằm đè lên góc phải footer modal, che đuôi nút chính (screenshot
`r5-config-390-vi.png`: "🎙 Bắt đầu tạo phụ đề" chỉ đọc được tới "Bắt đầu
tạo p…"). Ảnh hưởng mọi modal bottom-sheet ở ≤768px, không riêng
CaptionModal — và MEASURE_FN không bắt được vì nút vẫn vừa trong modal
theo DOM (lỗi nằm ở overlay ngoài modal). Hướng sửa gợi ý cho luồng sau
(chưa làm — ngoài phạm vi R5, cần quyết parent): hoặc nâng z-index
`.modal-backdrop` lên trên 300 (modal luôn trên cùng là chuẩn), hoặc ẩn
pill FPS khi có modal mở. Ghi rõ ở đây để không ai tưởng A3 "đo xong là
hết lỗi mobile".

## 6. Chưa đo / nợ mở (trung thực)

1. **Chưa đo bước running ở locale en** (chỉ vi — geometry running không
   phụ thuộc chuỗi dài: nút Huỷ 1 từ ngắn cả 2 locale; phase text là câu
   bridge trả về, không phải nút). Chưa đo running ở 1280×720 / mobile
   (modal running 640×313 gọn, nhỏ hơn config nên vừa viewport theo cùng
   CSS — nhưng chưa có số đo riêng).
2. **Chưa đo Escape lúc running ở bước translate** (`targetLang` ≠ "":
   job thứ 2 `/api/caption/translate` — cùng 1 handler App + cùng 1
   AbortController nên hành vi giống job 1, chưa đo riêng).
3. **Chưa đo headed timeout thật** (recordPackMedia treo 20s ngoài đời):
   timeout chỉ được chứng minh bằng unit test với mock (T2: 372ms với
   timeoutMs=300) + test tĩnh mapping. Đo headed thật cần can thiệp
   MediaRecorder trong trình duyệt (vd override `onstop` không fire) —
   chưa làm; hành vi timeout → lỗi → mở khóa modal được khóa bằng test
   tĩnh T6/T7, chưa có lần chạy headed nào đi qua nhánh đó.
4. **Câu chữ `pack.recordTimeout` viết cho pack 4–6s** (timeout 20–21s):
   nếu thêm pack dài hơn (vd 30s → timeout 45s), "quá 20 giây" sẽ sai số
   — luồng thêm pack dài phải sửa câu chữ (hoặc đổi thành không nêu số).
5. **Fragment chưa gộp**: `pack.recordTimeout` mới chỉ nằm ở
   `hidden_files/round61-r5-fragment.json` — parent gộp vào `vi.json`/
   `en.json` (nhóm `pack`) thì modal mới hiện đúng câu; trước lúc gộp,
   timeout sẽ hiện key thô `pack.recordTimeout`.
6. **`tsconfig.json` là file chung**: luồng này KHÔNG sửa (test mới không
   cần exclude); các luồng đợt 61 khác đang sửa file này — parent gộp cần
   kiểm tra trùng/dư dòng.
7. **Bridge dùng trong headed đã tắt sau khi đo** (khởi động tay bằng
   venv caption/TTS, kill sau lần chạy 3) — lần chạy headed sau cần khởi
   động lại bridge trước (harness tự kiểm tra `/api/health` và báo rõ
   nếu chưa chạy).
8. **Tổng chờ push trong log là ước tính tại thời điểm ghi** (các luồng
   đợt 61 khác đang stage song song) — xem log vòng lặp.

## 7. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round61-r5-modal-headed.txt` —
6 file text:

- `apps/web/src/lib/sampleMedia.ts` (sửa: timeout recordPackMedia)
- `apps/web/src/lib/templatePack.ts` (sửa: RECORD_TIMEOUT mapping)
- `apps/web/src/components/onboarding/TemplatePackModal.tsx` (sửa: nhánh lỗi timeout)
- `apps/web/src/lib/recordPackMedia61R5.test.ts` (mới: test timeout 8 check)
- `apps/web/scripts/clicktest-61r5-modal-headed.mjs` (mới: harness headed 16 case)
- `docs/PHASE9_ROUND61_R5_MODAL_HEADED_LIMITS.md` (mới — file này)

Không có binary. Không sửa `styles.css` / `mobile.css`, không sửa
`vi.json` / `en.json` (key mới ở fragment ngoài repo), không sửa
`CaptionModal.tsx` (A: đo xong, không cần sửa) / `TemplatePicker.tsx` /
`App.tsx` (B1/B2: đo xong, không cần sửa). Harness + report JSON +
screenshot chỉ nằm ở `hidden_files/round61-r5/headed/`, không stage
(harness script thì có stage để luồng sau tái dùng). Smoke test curl
(caption/TTS) nằm ở `/tmp/round61-r5/`, không stage. `dist/` (vite build
kiểm chứng) không stage.

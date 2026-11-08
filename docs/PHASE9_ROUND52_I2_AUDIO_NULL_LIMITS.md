# Đợt 52 I2 — Sửa họ bug `[null]` trong audio + badge KeyframePanel (N3)

Ngày: 2026-11-06 (lượt cron 00:35 +07 ngày 07/11). Luồng I2, đợt 52, Phase 9 VCut Studio.
Repo local: `~/workspace/repo-1` (GitHub `vectornewsai-cmyk/repo-1`, branch main).
Nhiệm vụ: đóng nợ đợt 51 §4.6 (xem `docs/PHASE9_ROUND51_LIMITS.md` §2.6/§4.6
và `docs/PHASE9_ROUND51_H6_KEYFRAME_CLICKTEST_LIMITS.md` §6.1/§6.3).

**Kết quả tóm tắt: cả 2 bug đã sửa, chứng minh đỏ-trước/xanh-sau cả ở unit
lẫn headed. Test mới 15/15; hồi quy audioEngine 6/6, E4 13/13, H6 15/15,
F1 web 10/11 — 1 fail do luồng I7 sửa song song (xem §5, không phải hồi
quy của I2); click-test headed 8/8 PASS sau fix, 6/8 ở lượt đỏ-trước
badge (I1/I2 FAIL đúng như bug cũ). tsc 0 lỗi, vite build pass.**

## 1. Bug 1 — `computeClipGain` ném với `volumeKeyframes: [null]` (sửa)

Vị trí: `apps/web/src/lib/audioEngine.ts:71-73` (trước sửa). Guard cũ
`kfs.length > 0` rồi gọi thẳng `interpolateKeyframes(kfs, el)`: `[null]`
có length 1 nên guard không cứu; normalize lọc thành `[]` rồi
`interpolateKeyframes` ném `mảng keyframes rỗng` ngay đầu tick preview —
y hệt bug H6 đã sửa ở `previewEngine.ts`. Đường vào duy nhất là in-memory
(qua `patchClip`, né cổng load mà E4 đã sanitize — xem
`projectRepo.ts:838-864`).

### Sửa tối thiểu (cùng mẫu H6, contract không đổi)

- Import thêm `normalizeKeyframes` từ `@repo-1/video-spec`.
- Helper export mới `hasUsableVolumeKeyframes(kf)` — true chỉ khi `kf` tồn
  tại, `keyframes` là array, và `normalizeKeyframes(...)` không rỗng.
- Call site duy nhất trong `computeClipGain`: `if
  (hasUsableVolumeKeyframes(clip.volumeKeyframes))` thì nội suy, còn lại
  rơi về volume tĩnh. Hỗn hợp `[null, valid]` vẫn nội suy trên entry hợp
  lệ (`interpolateKeyframes` tự normalize bên trong).
- Contract `interpolateKeyframes` KHÔNG đổi (vẫn ném với mảng rỗng).

### Đỏ-trước (unit)

Probe tạm trên code chưa sửa (đã xóa sau khi dùng):
`computeClipGain({duration:4, volume:0.5, volumeKeyframes:{keyframes:[null]}},
2, false, 1)` → ném `interpolateKeyframes: mảng keyframes rỗng`.
Test mới lúc đó còn chưa load được (import helper chưa tồn tại) — probe
là bằng chứng đỏ-trước cho bug gốc. Xanh-sau: test mới 15/15 (§3).

## 2. Bug 2 — Tab badge KeyframePanel đếm thô, lệch panel count (sửa)

Vị trí: `apps/web/src/components/keyframes/KeyframePanel.tsx` (trước
sửa). Badge tab tính `anims[p]?.keyframes.length ?? 0` (số thô) trong khi
panel count dùng `normalizeKeyframes(...).length`: với `[null]`, badge
hiện 1 (kèm class `has`) trong khi panel count hiện 0, 0 diamond.

### Sửa (cùng file, 2 chỗ — đều là đếm thô → đếm usable)

1. **Badge tab** (dòng ~234): `const n =
   normalizeKeyframes(anims[p]?.keyframes ?? []).length;` — badge giờ
   khớp panel count: `[null]` → không hiện số, `[null, valid]` → 1.
2. **Hàng live của prop khác** (dòng ~327, cùng mẫu — ngoài câu chữ
   nhiệm vụ nhưng cùng bug hiển thị trong cùng file): filter cũ
   `(anims[p]?.keyframes.length ?? 0) > 0` hiện hàng "—" cho prop chỉ có
   `[null]`; nay filter theo `normalizeKeyframes(...).length > 0` và nội
   suy trên mảng đã normalize (try/catch cũ giữ nguyên).

Không đổi gì khác trong panel. `normalizeKeyframes` đã được import sẵn
trong file.

## 3. Test mới + hồi quy (chạy thật, không mock kết quả)

File mới `apps/web/src/lib/audioEngine52I2.test.ts` (mẫu
`audioEngine44Z2` / `previewEngine51H6`: `node
--experimental-strip-types`, chạy từ gốc repo): **15/15 pass**
- `hasUsableVolumeKeyframes`: `[null]`/`[]`/`undefined` → false;
  `[null, valid]`/`[valid]` → true (5).
- `computeClipGain`: `[null]` → không ném, rơi về volume tĩnh 0.5;
  `[null, valid]` → nội suy 0.5 (ghi đè volume tĩnh 0.9); `[]` → tĩnh;
  không có keyframes → tĩnh (hồi quy); `[null]` + fadeIn → fade áp lên
  volume tĩnh; `[null]` + trackMuted → 0 (6).
- Quy tắc đếm badge (đúng biểu thức badge dùng —
  `normalizeKeyframes(...).length`): `[null]` → 0; `[null, valid]` → 1;
  `[]` → 0, `[valid, valid]` → 2; entry t/v NaN/Infinity bị lọc (4).

Hồi quy (chạy lại cuối lượt, sau mọi sửa):
- `audioEngine44Z2.test.ts`: **6/6** (đúng "audioEngine 6/6" trong nhiệm vụ).
- `projectRepoRound49E4.test.ts` (E4, sanitize cổng load + computeClipGain):
  **13/13**.
- `previewEngine51H6.test.ts`: **15/15**.
- `keyframeNormalizeRound50F1.test.ts` (F1 web): **10/11 — 1 fail KHÔNG
  phải hồi quy của I2**, xem §5 (luồng I7 sửa song song).
- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass** (13,97 s; chỉ cảnh báo chunk > 500 kB có sẵn).

## 4. Click-test headed thật (harness mới, 8/8 PASS)

File mới `apps/web/scripts/clicktest-52i2-audio-null-badge.mjs` (~430 dòng,
mẫu H6: vite dev + Chromium headed qua Xvfb + CDP WebSocket, Node thuần).
Chạy: `node apps/web/scripts/clicktest-52i2-audio-null-badge.mjs`.
Scratch (ngoài repo, không nằm trong batch):
`~/workspace/tmp-round52-i2/badge/` (`i2-result.json`, `i2-log.txt`,
`i2-vite.log`, `i2-chrome.log`, `cdprof-i2`).

| Case | Nội dung | Kết quả |
|---|---|---|
| A0 | Load sample | PASS — 3 clip (2 video + 1 text), "Dự án mẫu", playhead=0, pxPerSec=60 |
| A0b | Live store | PASS — import URL store thật, id clip khớp DOM 3/3 |
| A0c | Đóng welcome modal | PASS |
| C0 | Chọn clip video + KeyframePanel hiện | PASS — count "0 điểm", tabs [Vị\|Vị\|Độ\|Tỉ\|Xoay] |
| I1 | `[null]` vào animations.x | **PASS** — store giữ `[null]`, panel count "0 điểm", 0 diamond, tab x badge=null (không hiện số), has=false, 0 lỗi mới |
| I2 | `[null,valid]` vào x | **PASS** — store giữ đúng, count "1 điểm", 1 diamond, tab x badge="1", has=true, 0 lỗi mới |
| I3 | `computeClipGain` thật trong trang | **PASS** — import module audioEngine thật qua vite dev: `[null]`→0.5, `[null,valid]`→0.5, `[]`→0.7, không kf→0.6; 0 lỗi mới |
| I4 | Không lỗi console trong phiên | **PASS** — 0 window.onerror + 0 unhandledrejection + 0 Runtime.exceptionThrown |

**Đỏ-trước headed cho badge (revert tạm 1 dòng badge về đếm thô, chạy
lại, khôi phục — đã verify 0 marker RED-BEFORE còn lại): 6/8** — I1 FAIL
đúng như bug cũ (`tabX={"label":"Vị1","badge":"1","has":true}` trong khi
panel count "0 điểm"), I2 FAIL (`badge:"2"` vs count "1 điểm"); A0/A0b/
A0c/C0/I3/I4 vẫn PASS. Khôi phục fix → chạy lại **8/8 PASS** (lượt cuối
17:55 UTC).

**Giới hạn headed — nói rõ:** I3 chứng minh `computeClipGain` trong
browser thật qua module thật, NHƯNG KHÔNG phải đường tick preview thật:
project mẫu không có audio clip, và store không có action chèn clip,
nên không dựng được audio clip mang `volumeKeyframes: [null]` để tick
preview gọi hàm qua `preview.tsx:1798`. Đường tick chỉ được khóa bằng
unit (test mới §3) + code đọc (call site duy nhất là `preview.tsx:1798`,
đã qua guard mới). Muốn chứng minh tick thật cần fixture audio + đường
chèn clip audio in-memory — nợ mở (§6.1).

**Bài học harness (đã sửa trong harness I2, không phải sản phẩm):**
lượt đỏ-trước đầu tiên dừng ở C0 — click chọn clip đã set selection
nhưng `.kf-panel` chưa kịp render khi đo ngay sau 600 ms (tải VM do các
luồng đợt 52 chạy song song). Đã sửa C0 thành `waitFor` `.kf-panel` tối
đa 30 s thay vì đo 1 lần; các lượt sau C0 ổn định. Harness I2 cũng thêm
timeout 60 s cho `CDP.send()` (nợ H6 §6.6 — renderer treo thì fail
nhanh thay vì treo vô hạn).

## 5. Xung đột với luồng I7 chạy song song (KHÔNG phải hồi quy của I2)

Trong lúc I2 chạy, một luồng khác (I7, cùng đợt 52) sửa 2 file mà I2
phụ thuộc — I2 KHÔNG chạm 2 file này, KHÔNG sửa theo, parent gộp cần
biết:

1. **`packages/video-spec/src/keyframes.ts` (mtime 17:52 UTC):**
   `applyEasing` nay NÉM `easing không hỗ trợ: <easing>` với easing lạ
   (thêm `default: throw`) — trước đây trả `undefined` → NaN. Đây là
   hành vi mà LIMITS đợt 51 §2.5/§4.5 ghi GIỮ NGUYÊN có chủ ý (lệch
   mirror TS/JS), và test F1 khóa quirk cũ. Hậu quả: F1 lúc đầu lượt I2
   chạy **11/11**, sau sửa của I7 chạy **10/11** — test fail duy nhất là
   `contract cũ (quirk tiền sẵn...): easing lạ ở tầng TS trả NaN, không
   ném` (nay ném `easing không hỗ trợ: bounce`). I2 không sửa test này
   hay `keyframes.ts` (ngoài phạm vi) — việc hòa giải quirk (giữ throw
   mới + cập nhật test F1, hay revert) thuộc về I7/parent.
2. **`apps/web/src/lib/audioEngine.ts` (mtime 17:55 UTC, cùng file I2):**
   I7 thêm helper `interpolateVolumeKeyframes` (fail-soft: easing lạ →
   coi như "linear", hết đường → rơi về volume tĩnh) và đổi call site
   trong `computeClipGain` từ `interpolateKeyframes(kfs!, el)` sang
   `interpolateVolumeKeyframes(kfs!, el, clip.volume ?? 1)`, thêm
   `EASINGS` vào import. Hunk của I2 (helper `hasUsableVolumeKeyframes`
   + guard dòng 126) còn NGUYÊN, không xung đột text. Test mới I2 vẫn
   **15/15** sau hunk I7, `tsc` 0, headed I3 (chạy sau hunk I7) vẫn PASS
   với cùng giá trị. I2 không thêm test cho hunk I7 (thuộc phạm vi I7).

## 6. Nợ mở / quan sát

1. **Tick preview thật cho `volumeKeyframes: [null]` chưa chứng minh
   headed** (xem §4): cần fixture audio + đường chèn clip audio
   in-memory (store hiện không có action chèn clip). Unit + module
   headed đã khóa hàm; tick chỉ là 1 call site (`preview.tsx:1798`).
2. **F1 10/11 do I7** (xem §5.1): parent/I7 hòa giải quirk easing lạ
   (throw mới vs test cũ khóa NaN).
3. **Không click-test responsive/PWA** — ngoài phạm vi I2.
4. `tsc` toàn apps/web 0 lỗi TẠI THỜI ĐIỂM cuối lượt I2; các luồng đợt
   52 khác vẫn đang chạy song song nên trạng thái này có thể đổi trước
   khi parent gộp — parent kiểm chứng lại lúc gộp.

## 7. Danh sách CHÍNH XÁC file đổi/thêm (text only, không push, không binary)

| # | File | Loại |
|---|---|---|
| 1 | `apps/web/src/lib/audioEngine.ts` | Sửa — import `normalizeKeyframes` + helper `hasUsableVolumeKeyframes` + guard 1 call site trong `computeClipGain` (§1). LƯU Ý: file còn chứa hunk của luồng I7 (§5.2, không phải của I2) |
| 2 | `apps/web/src/components/keyframes/KeyframePanel.tsx` | Sửa — badge tab đếm usable (§2.1) + filter hàng live prop khác đếm usable (§2.2) |
| 3 | `apps/web/tsconfig.json` | Sửa — thêm 1 dòng exclude cho `src/lib/audioEngine52I2.test.ts` (ngay sau dòng `previewEngine51H6.test.ts`) — **parent gộp: file chung, giữ dòng này khi merge với các luồng khác** |
| 4 | `apps/web/src/lib/audioEngine52I2.test.ts` | Mới — 15 unit test cho fix (§3) |
| 5 | `apps/web/scripts/clicktest-52i2-audio-null-badge.mjs` | Mới — harness headed 8 case (§4) |
| 6 | `docs/PHASE9_ROUND52_I2_AUDIO_NULL_LIMITS.md` | Mới — tài liệu này |

Không sửa file của luồng khác; không sửa production code ngoài file
(1)(2); không push, không tag/release, không binary vào batch.
Scratch ngoài repo (không nằm trong batch):
`~/workspace/tmp-round52-i2/badge/` (`i2-result.json` lượt xanh cuối
8/8, `i2-log.txt`, `i2-vite.log`, `i2-chrome.log`, `cdprof-i2`).

## 8. Cách chạy lại

```bash
# Unit test của fix (kỳ vọng 15/15)
node --experimental-strip-types apps/web/src/lib/audioEngine52I2.test.ts
# Hồi quy audioEngine (kỳ vọng 6/6) + E4 (13/13) + H6 (15/15)
node --experimental-strip-types apps/web/src/lib/audioEngine44Z2.test.ts
node --experimental-strip-types apps/web/src/lib/projectRepoRound49E4.test.ts
node --experimental-strip-types apps/web/src/lib/previewEngine51H6.test.ts
# F1 web — BIẾT TRƯỚC 10/11 sau sửa của I7 (xem §5.1), 11/11 trước đó
node --experimental-strip-types apps/web/src/lib/keyframeNormalizeRound50F1.test.ts
# Headed harness (kỳ vọng 8/8; cần Chrome headed + Xvfb)
node apps/web/scripts/clicktest-52i2-audio-null-badge.mjs
# tsc (kỳ vọng 0 lỗi) — chạy trong apps/web
npx tsc --noEmit
```

Lưu ý khi chạy lại: VM 2vCPU — tránh chạy cùng lúc với nhiều luồng
headed khác; load cao từng làm C0 fail 1 lần (§4, đã sửa bằng waitFor).

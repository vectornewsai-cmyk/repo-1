# Phase 9 đợt 50, luồng F1 — Render mirror keyframe null + guard panel — LIMITS

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng.
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Đường render CLI KHÔNG crash với keyframe null — nhưng từ chối cả
   job (đính chính E4 §7.4).** Kiểm chứng thật: spec thô mang audio
   `volumeKeyframes: [null]` chạy `node server/render/src/render.js`
   thì `validateSpec` bắt được (`volumeKeyframes.keyframes[0] phải là
   object { t, v, easing }`) và thoát 1 với thông báo rõ — KHÔNG phải
   TypeError từ `buildVolumeInterpExpr`. Lỗ thật là lệch parity: cùng
   project đó web load lại mở được (sanitize E4 ở `parseProjectText`),
   còn render thì từ chối cả job. Luồng này đóng bằng sanitize mirror
   ở cổng render (§3.1): 4/4 spec thô mang null (volume / animations /
   speed / nested leaf) nay render exit 0, MP4 2 s, kèm cảnh báo
   `⚠️ keyframes:` trên stderr.
2. **Builder vẫn ném TypeError khó hiểu khi gọi trực tiếp — ĐÃ VÁ (§3.2).**
   Đỏ-trước: `interpolateKeyframes([null])`, `buildInterpExpr`,
   `buildVolumeInterpExpr` đều ném `TypeError: Cannot read properties
   of null (reading 'v')`; `normalizeKeyframes([null])` giữ nguyên
   `[null]`. Xanh-sau: `normalizeKeyframes` lọc entry lỗi trước khi
   sort (cả 3 mirror: TS, `.js` của video-spec, render JS);
   `interpolateKeyframes`/`buildInterpExpr` ném lỗi rõ "mảng keyframes
   rỗng"; `buildVolumeInterpExpr` ném lỗi rõ "không còn keyframe hợp
   lệ"; còn entry hợp lệ thì nội suy trên chúng.
3. **Panel: 2 chỗ E4 nêu (~216, ~325) ĐÃ có guard trên đĩa — KHÔNG sửa
   thêm (§3.3).** Lỗ thật là dữ liệu `kfs` mà panel dùng khắp nơi:
   `normalizeKeyframes` giữ `[null]` nên `kfs.length` = 1 (guard length
   không cứu), live value được try/catch cứu thành null, NHƯNG marker
   trên lane (`k.t`/`k.v`, dòng 256–259) và `selKf.t`/`selKf.v`
   (dòng 295–296, 310) ném TypeError ngay khi render. Vá ở tầng chung
   `normalizeKeyframes` (§3.2) đóng cả 3 chỗ cùng lúc; khóa bằng test
   mô phỏng đúng đường derive của panel (11/11).
4. **Đường MCP in-memory KHÔNG đưa được null vào panel (§3.4).**
   `loadProject` + `saveProject` đều chạy `validateVideoSpec` (từ chối
   entry null); `add_keyframe` chỉ push entry đã qua zod
   (`time`/`value` number, `easing` enum). Đường in-memory còn lại là
   sửa tay qua devtools/store trực tiếp — panel nay chịu được nhờ (2).
5. **Kiểm chứng gộp (§4):** test mới F1 render **26/26**, test mới F1
   web **11/11**; hồi quy keyframes self-test, test_k1 21/21, test_p3
   73/73, test_keyframes_sr 31/31, test_nested_e2e 28/28, E4 13/13,
   projectRepo 10/10, nested22 7/7, audioEngine 6/6, pauseLoopGuard
   11/11; `tsc --noEmit` 0 lỗi; `vite build` pass. Parity sanitize
   web-vs-render trên cùng input: spec sau sanitize + danh sách fix
   giống hệt nhau (byte-equal).

## 1. Phân tích trước khi sửa

### 1.1 Các đường đọc file project thô của render — có qua web load không?

| Đường vào render | Spec qua web load? | Gặp `[null]` thì sao (trước luồng này)? |
|---|---|---|
| CLI `node server/render/src/render.js --spec file.json` (đường duy nhất render worker đọc spec) | **Không** — `fs.readFileSync` + `JSON.parse` trực tiếp ở main() (~1224), rồi `isVideoSpec` → legacy-adjust → flatten → `validateSpec` (~1302) → `validateMedia` → dựng graph | `validateSpec` bắt được (xem §1.2) → thoát 1, thông báo rõ. Không crash, nhưng từ chối cả job |
| Bridge `POST /api/render` | Không — ghi `spec.json` từ body rồi spawn `render.js` (cùng CLI trên) | Như CLI |
| MCP `render_video` / `export_video` | Không — ghi tmpSpec rồi spawn `render.js` (cùng CLI trên); spec đã qua `validateVideoSpec` ở `loadProject`/`saveProject` nên không mang null tới đây | Như CLI (không tới được) |
| `flattenSpecForRender` (chạy TRƯỚC `validateSpec` trong main) | — | `validateNestedRamp` fail rõ khi gặp null trong `speedKeyframes` của clip lá; `trimTimedFields`/`applyNestedLeafVisual` đã null-safe (`k && isFiniteNumber(...)`) |

Kết luận: **chỉ có một điểm nối duy nhất** — main() của render.js — nên
vá ở đó là phủ hết mọi đường render thật. Không có đường nào bypass
`validateSpec` mà tới được `buildGainFilter` trong CLI (validate chạy
trước, exit 1 khi lỗi); builder chỉ nổ khi gọi trực tiếp (test/demo/
code tương lai) — vá phòng thủ ở §3.2.

### 1.2 Validate đã bắt null ở những đâu (giữ nguyên làm gate)

- `validateVolumeKeyframes` (validate.js): entry null → lỗi
  `volumeKeyframes.keyframes[i] phải là object { t, v, easing }`.
- `validateAnimations` (keyframes.js + mirror TS): entry null → lỗi
  tương tự, từng prop.
- `validateSpeedKeyframes` (validate.js): entry null → lỗi tương tự.
- `validateNestedRamp` (nested.js): entry null trong speedKeyframes
  của clip lá → fail rõ trước cả validate.
- MCP `validateVideoSpec` (validate.ts): `isObj(kf)` → từ chối null
  ở animations/volumeKeyframes; speedKeyframes qua `validateSpeedFields`
  (chỉ speed/reverse hằng — MCP không có tool set speedKeyframes trực
  tiếp; xem §3.4).

Vì vậy luồng này KHÔNG nới validate: validate vẫn là gate chặn spec
chưa sanitize (test S8 khóa). Sanitize là tầng riêng, chạy trước
validate trong main(), đúng mẫu web (sanitize ở cổng load → validate
sau đó vẫn bắt lỗi giá trị).

### 1.3 Panel — xác minh lại số dòng E4 trên đĩa

| Chỗ E4 nêu | Trạng thái trên đĩa (06/11) | Kết luận |
|---|---|---|
| Panel ~216 (live value) | Dòng 213–220: `if (kfs.length > 0) { try { liveValue = interpolateKeyframes(kfs, localT); } catch { liveValue = null; } }` | ĐÃ guard — không sửa |
| Panel ~325 (kf-live các prop khác) | Dòng 322–335: `.map(...)` bọc `try { v = interpolateKeyframes(...) } catch { v = null; }` từng prop | ĐÃ guard — không sửa |
| Panel ~147 (`addKeyframeAt`) | `kfs.length > 0 ? interpolateKeyframes(kfs, tc) : meta.def` | ĐÃ guard — không sửa |
| KeyframeGraph ~85 (đường cong) | Dòng 76–97: `if (kfs.length > 0 && duration > 0)` + try/catch từng điểm mẫu | ĐÃ guard — không sửa |
| **Panel dòng 127** (`const kfs = normalizeKeyframes(...)`) | `normalizeKeyframes` giữ nguyên `[null]` (sort không lọc) | **Lỗ thật**: `kfs.length` = 1 nên guard length không cứu; marker lane dòng 256–259 (`k.t`/`k.v`) và `selKf.t`/`selKf.v` (dòng 295–296, 310) ném TypeError ngay khi render |
| Panel dòng ~141 `validateAnimations(anims, ...)` | Hàm này trả về danh sách lỗi, không ném với entry null (đã đọc code) | An toàn |

## 2. Đỏ-trước (ghi trước khi sửa)

Script tạm `/tmp/f1-red-baseline.cjs` (đã xóa sau khi đo), chạy trên code
chưa sửa — builder render JS:

| Lời gọi | Kết quả trước sửa |
|---|---|
| `normalizeKeyframes([null])` | KHÔNG ném, trả `[null]` (giữ null — đúng mô tả E4) |
| `interpolateKeyframes([null], 0)` | `TypeError: Cannot read properties of null (reading 'v')` |
| `buildInterpExpr({keyframes:[null]}, "t")` | `TypeError: Cannot read properties of null (reading 'v')` |
| `buildVolumeInterpExpr({keyframes:[null]})` | `TypeError: Cannot read properties of null (reading 'v')` (mảng 1 phần tử nên sort không gọi comparator — ném ở `dedup[0].v`, không phải ở `a.t` như E4 đoán; cùng họ TypeError) |

CLI đỏ-trước (spec `/tmp/f1-red/spec-volkf-null.json`, audio
`volumeKeyframes: [null]`, media `examples/media`): `❌ Spec không hợp
lệ (1 lỗi): [tracks[1].clips[0]] volumeKeyframes.keyframes[0] phải là
object { t, v, easing }`, exit 1 — fail-fast rõ ràng, KHÔNG crash.

Test web đỏ-trước (chạy trước khi sửa, 11 test mới): **5 pass, 6 fail**
— 6 fail đều là các case `[null]` (normalize giữ null, interpolate ném
TypeError). Lưu ý: case "panel `[null]` → live null" pass NGAY CẢ trước
khi sửa (live value được try/catch cứu) — bằng chứng guard live-value
đã có, và lỗ thật nằm ở marker map chứ không phải live value.

## 3. Sửa (đỏ-trước / xanh-sau)

### 3.1 Sanitize ở cổng render — `server/render/src/keyframeSanitize.js` (mới)

Mirror bằng JS thuần của `sanitizeKeyframeArrays` trong
`apps/web/src/lib/projectRepo.ts` (E4), ngữ nghĩa giống hệt:
loại entry null / không phải object / t hoặc v không hữu hạn;
easing lạ → `"linear"` (speed giữ `"bezier"`); field không phải object
/ keyframes không phải mảng / rỗng sau lọc → xóa field; đệ quy subSpec
(chống vòng lặp theo nhánh); project lành không đổi gì. Bezier array
sai KHÔNG sửa ở đây — validate sau đó vẫn bắt.

Nối vào `server/render/src/render.js` main(): sau `isVideoSpec`,
TRƯỚC legacy-adjust + flatten + validate (phải trước flatten vì
`validateNestedRamp` fail khi gặp null trong speedKeyframes của clip
lá). Mỗi fix in một dòng `⚠️  keyframes: <đường dẫn + mô tả>` ra stderr,
cùng kênh với các cảnh báo validate khác.

Parity kiểm chứng trực tiếp (script tạm ở repo root, đã xóa sau khi
chạy): cùng một spec mang null ở cả 4 loại field (volume / speed
bezier / animations.opacity / animations.scale + easing lạ), sanitize
web và sanitize render cho ra **spec sau sanitize giống hệt nhau
(byte-equal) và danh sách fix giống hệt nhau** (4 fix, cùng thứ tự,
cùng wording).

### 3.2 Harden builder — lọc entry lỗi trước khi sort

- `server/render/src/keyframes.js` `normalizeKeyframes`: lọc entry lỗi
  trước khi sort; `interpolateKeyframes`/`buildInterpExpr` giữ contract
  ném "mảng keyframes rỗng" khi hết entry hợp lệ (nay là lỗi rõ thay vì
  TypeError). `opacity.js` dùng `buildInterpExpr` nên cũng được hưởng.
- `server/render/src/audiomix.js` `buildVolumeInterpExpr`: lọc entry
  lỗi trước khi sort; hết entry hợp lệ → ném lỗi rõ `"không còn
  keyframe hợp lệ (mảng rỗng hoặc toàn entry null/không hợp lệ)"`;
  còn entry hợp lệ thì nội suy trên chúng (expr bằng đúng expr của
  mảng chỉ-entry-hợp-lệ, test U8 khóa). Easing lạ vẫn ném lỗi rõ như cũ
  (không lặng lẽ chuẩn hóa ở tầng builder).
- `packages/video-spec/src/keyframes.ts` `normalizeKeyframes`: cùng
  filter, mirror y hệt. Đây là chỗ vá panel (§3.3): sau đó `kfs` của
  panel không còn null nên marker map + selKf đều an toàn.
- `packages/video-spec/src/keyframes.js`: mirror viết tay của video-spec
  PHẢI đồng bộ theo (xem §5): `normalizeKeyframes` ở đây vẫn là bản cũ
  (không lọc). Đã sửa bằng tay cho khớp `.ts` — vì `index.ts` re-export
  `"./keyframes.js"` nên `node --experimental-strip-types` (cách chạy
  test web) nạp đúng file `.js` này, không phải `.ts`; Vite thì nạp
  `.ts`. Không đồng bộ thì test vẫn đỏ dù `.ts` đã sửa (đã gặp thật
  khi chạy test web lần đầu sau khi sửa `.ts`: 6 fail y như đỏ-trước).
  Nợ ghi lại ở §7 mục 4: repo có nhiều mirror `.js` viết tay kiểu này,
  lần sau đổi `.ts` phải nhớ soi `.js` kề bên.

### 3.3 Panel — KHÔNG sửa code, chỉ khóa bằng test

2 chỗ E4 nêu đã guard (bảng §1.3). Việc làm của luồng này: (a) vá tầng
chung `normalizeKeyframes` (§3.2) để `kfs` không còn null; (b) test web
mới `apps/web/src/lib/keyframeNormalizeRound50F1.test.ts` (11 test) mô
phỏng đúng đường derive của panel (`normalizeKeyframes` → guard
`length > 0` → `interpolateKeyframes` trong try/catch): `[null]` → live
null không ném; `[null, hợp lệ...]` → live = giá trị nội suy; `[]` →
live null. Không thêm guard thừa vào panel (guard trùng lặp không đổi
hành vi, chỉ thêm nhiễu diff cho các luồng song song).

### 3.4 Đường sửa tay in-memory (MCP) — đã kiểm tra, không hở

- `mcp-server/src/store.ts`: `loadProject` + `saveProject` đều chạy
  `validateVideoSpec` → spec có entry null không load/save được.
- `mcp-server/src/tools/modify.ts` `add_keyframe`: zod chặn sẵn
  (`time` number nonnegative, `value` number, `easing` enum
  linear/ease-in/ease-out); chỉ push entry `{t, v, easing}` hợp lệ;
  `kfs.findIndex((k) => Math.abs(k.t - ...))` có thể ném nếu mảng đã
  có null từ trước — nhưng mảng đó không qua được `loadProject` nên
  không tới được đây.
- `mcp-server/src/tools/clips.ts` / `set_clip`: đi qua
  `validateVideoClip` → từ chối entry null (xem `validateClipAnimations`
  / `validateVolumeKeyframes` trong `validate.ts`, đều check `isObj(kf)`).
- Đường in-memory còn lại duy nhất: sửa tay qua devtools / `patchClip`
  trực tiếp trong web store (không qua cổng load, không qua MCP) —
  panel nay chịu được nhờ §3.2; vòng lặp preview đã có tick-guard E4.
  Lưu ý nhỏ (không sửa ở luồng này): zod `z.number()` cho phép
  `Infinity` ở `add_keyframe` (`time`/`value`) — `Infinity` vào
  keyframes sẽ bị `normalizeKeyframes` lọc (v không hữu hạn) nên panel
  an toàn, nhưng `validateVideoSpec` ở lần save sau sẽ từ chối vì `t`
  ngoài `[0, duration]`; xem nợ §7 mục 5.

## 4. Kiểm chứng gộp của luồng

### 4.1 Test mới F1

- Render `server/render/test_round50_f1_keyframe_null.js` (chạy từ gốc
  repo: `node server/render/test_round50_f1_keyframe_null.js`):
  **26/26, 0 fail** (đỏ-trước: các case U/S/C đều fail, xem §2).
  U1–U9 unit builder qua code render thật; S1–S8 sanitize render
  (mirror E4) + gate validate giữ nguyên; C1–C4 render thật qua
  `render.js` CLI (spec thô mang null → exit 0, MP4 tồn tại > 10 KB,
  duration ≈ 2 s, stderr có cảnh báo keyframes); C5 đối chứng
  (volume v=5 ngoài 0..1 vẫn bị từ chối, exit != 0 — sanitize không
  che lỗi giá trị).
- Web `apps/web/src/lib/keyframeNormalizeRound50F1.test.ts`:
  **11/11, 0 fail** (đỏ-trước 5/11, xem §2). Chạy:
  `node --experimental-strip-types apps/web/src/lib/keyframeNormalizeRound50F1.test.ts`.
  Lưu ý: test import `@repo-1/video-spec` nên nạp
  `packages/video-spec/src/keyframes.js` (mirror viết tay) dưới
  strip-types — xem §3.2/§5.

### 4.2 Hồi quy

- Render: `keyframes.js --self-test` pass; `test_k1.js` **21/21**;
  `test_p3.js` (strip-types) **73/73, 0 skip** (unit audiomix +
  render thật ramp/volume/fade/loudnorm); `test_keyframes_sr.js`
  **31/31**; `test_nested_e2e.js` **28/28** (flatten + render nested
  thật — render.js main() đã đổi nên chạy lại).
- Web (strip-types): E4 `projectRepoRound49E4` **13/13**,
  `projectRepo` **10/10**, `projectRepoNested22` **7/7**,
  `audioEngine44Z2` **6/6**, `pauseLoopGuard44Z2` **11/11** — fail 0.
- `tsc --noEmit` (apps/web): **0 lỗi** (sau khi thêm test mới vào
  exclude của tsconfig.json theo quy ước).
- `vite build --outDir /tmp/f1-app-dist`: **pass** (21,59 s; cảnh báo
  chunk > 500 kB cũ).

### 4.3 Không chạy lại

Mọi phép đo browser headed / FPS / TTS của các luồng khác; click-test
headed thật của KeyframePanel (panel chỉ khóa bằng unit mô phỏng đường
derive, không render React thật — xem §7 mục 3); Safari / máy thật.

## 5. File đổi/thêm

SỬA (6 file):

- `server/render/src/audiomix.js` — `buildVolumeInterpExpr` lọc entry
  lỗi + ném lỗi rõ (hunk duy nhất của luồng này trong file).
- `server/render/src/keyframes.js` — `normalizeKeyframes` lọc entry
  lỗi trước khi sort (hunk duy nhất của luồng này trong file).
- `server/render/src/render.js` — require `keyframeSanitize` + nối
  sanitize vào main() trước legacy-adjust/flatten/validate (2 hunk:
  require + gọi hàm).
- `packages/video-spec/src/keyframes.ts` — `normalizeKeyframes` lọc
  entry lỗi (hunk duy nhất của luồng này trong file).
- `packages/video-spec/src/keyframes.js` — mirror viết tay đồng bộ
  `normalizeKeyframes` cho khớp `.ts` (xem §3.2 — bắt buộc vì
  strip-types nạp file `.js` này).
- `apps/web/tsconfig.json` — thêm
  `"src/lib/keyframeNormalizeRound50F1.test.ts"` vào exclude (theo quy
  ước file test).

MỚI (4 file: module + 2 test + LIMITS này):

- `server/render/src/keyframeSanitize.js` — module sanitize (§3.1).
- `server/render/test_round50_f1_keyframe_null.js` — 26 test khóa (§4.1).
- `apps/web/src/lib/keyframeNormalizeRound50F1.test.ts` — 11 test khóa
  panel (§3.3, §4.1).
- `docs/PHASE9_ROUND50_F1_RENDER_KEYFRAME_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `apps/web/src/components/keyframes/KeyframePanel.tsx`,
`KeyframeGraph.tsx` (đã guard, §1.3); `server/render/src/validate.js`
(gate giữ nguyên, test S8 khóa); `mcp-server/**` (đã chặn null, §3.4);
`packages/video-spec/src/speed.ts` / `server/render/src/speedramp.js`
(`normalizeSpeedKeyframes` vẫn sort trực tiếp — xem §7 mục 2);
paths-loop, build-loop-log (parent ghi log lượt). Scratch ở
`/tmp/f1-red*`, `/tmp/f1-app-dist`, `/tmp/vcut-p3-*`,
`/tmp/vcut-kfsr-*`, `/tmp/nested-e2e-*`, `/tmp/f1-keyframe-null-*`
(không vào repo, không vào batch).

## 6. Lưu ý cho parent gộp (tránh đụng luồng song song)

- `apps/web/tsconfig.json` là file chung: luồng này chỉ thêm 1 dòng
  exclude cuối danh sách (`keyframeNormalizeRound50F1.test.ts`). Các
  luồng F khác cũng thêm exclude của họ — gộp bằng cách giữ đủ các dòng.
- `packages/video-spec/src/keyframes.ts` + `.js` là cặp mirror: nếu
  luồng khác cũng đụng `normalizeKeyframes`/`interpolateKeyframes`
  thì đối chiếu cả 2 file.
- `server/render/src/render.js` main(): hunk sanitize nằm ngay sau
  `isVideoSpec` và trước khối legacy-adjust; không đụng logic nào khác
  trong main().

## 7. Nợ mở (không mạo nhận đã xong)

1. **Fail-fast seek-landing-0 headed + quirk frame khác 0 headed**
   (E4 §7.1–7.2): vẫn thiếu; không đụng ở luồng này.
2. **`normalizeSpeedKeyframes` vẫn sort trực tiếp** (cả
   `server/render/src/speedramp.js` và `packages/video-spec/src/speed.ts`
   / `speedcurve`): entry null trong speedKeyframes vẫn ném TypeError
   nếu gọi trực tiếp. Đường render thật đã kín (sanitize trước flatten
   + validate bắt), đường preview có try/catch ramp — chỉ còn lỗ gọi
   trực tiếp, cùng họ với builder trước luồng này. Đợt sau có thể lọc
   giống `normalizeKeyframes` (cần đối chiếu cả 3 mirror speed).
3. **Click-test headed thật của KeyframePanel với `[null]` in-memory:**
   panel chỉ khóa bằng unit mô phỏng đường derive (normalize → guard →
   interpolate); chưa render React thật với animations `[null]` rồi bấm
   qua các tab/marker. Cần harness headed như E4 nếu muốn bằng chứng
   mức UI.
4. **Mirror `.js` viết tay của video-spec có thể lệch `.ts` lần nữa:**
   lần này phát hiện vì test strip-types nạp `.js`; Vite nạp `.ts`.
   Không có cơ chế tự động bắt lệch (chỉ transitions.js có script gen).
   Đợt sau đổi bất kỳ hàm nào trong `packages/video-spec/src/*.ts`
   nên soi file `.js` kề bên.
5. **Zod `z.number()` ở MCP `add_keyframe` cho phép `Infinity`:**
   `time`/`value` Infinity vào keyframes sẽ bị `normalizeKeyframes`
   lọc ở panel và bị `validateVideoSpec` từ chối ở lần save sau — không
   crash, nhưng MCP nên chặn `Number.isFinite` ngay ở schema cho sạch.
   Chưa sửa (ngoài phạm vi render/panel của luồng này).
6. **Lệch mirror TS/JS về easing lạ (tiền sẵn, không đổi):**
   `applyEasing` bản TS trả `undefined` → NaN với easing lạ, bản JS
   (render) ném lỗi rõ. Sanitize ở cả 2 cổng load chuẩn hóa easing về
   linear nên đường project đã load không tới được đây; chỉ còn đường
   gọi trực tiếp mới thấy lệch. Đổi `applyEasing` TS thành ném sẽ đổi
   ngữ nghĩa preview (NaN lan ra gain → throw) nên cần test riêng nếu
   muốn thống nhất.
7. **Early-return `if (!ctx) return;` trong tick preview** (E4 §7.6)
   và **vòng lặp preview quay ~19 tick/s với footage không decode được**
   (E4 §7.7): chưa đụng ở luồng này.
8. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux headed /
   Node 24 + ffmpeg CLI) — cùng giới hạn như các đợt trước.

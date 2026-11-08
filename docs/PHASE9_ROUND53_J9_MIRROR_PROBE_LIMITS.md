# Phase 9 đợt 53, luồng J9 — Script đồng bộ catalog + probe hàm thuần mirror còn lại — LIMITS

Ngày: 07/11/2026 (lượt cron 03:35 +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào batch. Chỉ sửa file text
trong phạm vi luồng. Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo
được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Script đồng bộ catalog nay là công cụ chính thức trong repo**
   (§1): `packages/video-spec/scripts/sync-catalog-mirror.mjs` — thay
   script tạm của đợt 52 I7 (đã xóa). Đồng bộ 8 const catalog
   (lut/sticker/textfx) từ `.ts` sang `.js`, có chế độ `--check` cho CI.
   Chạy lần đầu: 5 khớp + 3 đồng bộ (chỉ thêm lại 5 dòng comment phân
   đoạn mà script tạm I7 đã làm rơi — giá trị không đổi). Kiểm chứng âm:
   xóa 1 LUT khỏi `.js` → `--check` exit 1 đúng tên const; chạy sync
   → khôi phục byte-identical. Chạy lại lũy đẳng (sha256 không đổi).
   Đã nối vào `package.json` scripts + CI (2 bước mới).
2. **Checker mirror: 243 → 422 probe, 0 known, 0 fail** (§2): thêm
   179 probe hàm thuần cho 9 module còn lại (adjustment/image/sticker/
   mask/motion/nested/migrations/tracking/index) bằng fixture thật
   (subSpec/nested 1–2 tầng, layer + legacy clip, mask keyframes, track
   points, spec 0.1.0/0.2.0). 243 probe gốc vẫn xanh — không hồi quy.
3. **Bắt được 1 lệch mirror thật trong lúc probe** (§2.2):
   `normalizeStickerClip` — `.ts` luôn giữ key `track` (kể cả
   `undefined`), `.js` bỏ key khi track vắng → checker FAIL 1. Đã sửa
   `.js` khớp `.ts` (an toàn: mọi caller chỉ kiểm tra
   `track !== undefined`; JSON round-trip vốn đã bỏ key undefined).
4. **Kiểm chứng gộp** (§3): checker **422 pass, 0 known, 0 fail**;
   sync `--check` 8/8 khớp; `tsc --noEmit` apps/web **0 lỗi**;
   `vite build` **pass** (25,69 s, chỉ cảnh báo chunk > 500 kB cũ);
   test video-spec 152/152; test web I7 12/12, F1 11/11, H5 13/13.
   Hai lần `npm run build` đầu fail thoáng qua do race với luồng song
   song đợt 53 (file TTS/seek của luồng khác đang được ghi dở + file
   test mới chưa kịp vào exclude) — không liên quan file J9, chạy lại
   sau khi các luồng khác ổn định thì xanh (§3.3).
5. **Hàm nào vẫn chưa probe được** (§4): chỉ còn hàm nội bộ không
   export (probe gián tiếp qua hàm công khai), class `MigrationError`
   (chỉ khóa tên export), và `buildAdjustmentChain` của render worker
   (không thuộc video-spec). Không bịa số — bảng §4 ghi rõ từng hàm.

## 1. Script đồng bộ catalog — `packages/video-spec/scripts/sync-catalog-mirror.mjs` (mới)

### 1.1 Vì sao cần script này (nợ đợt 52 I7 §7.4)

Đợt 52 I7 đồng bộ `lut.js`/`sticker.js`/`textfx.js` bằng script tạm
(`/tmp/i7-sync-*.mjs`, đã xóa sau khi chạy). Lần sau thêm LUT/sticker/
animation mới ở `.ts` mà quên `.js` thì checker sẽ FAIL (đúng thiết
kế), nhưng vẫn cần người đồng bộ tay. Script này đưa việc đó thành
công cụ chính thức, theo đúng mẫu `gen-transitions-mirror.mjs` cùng
thư mục (transitions đã có script riêng từ đợt 11 nên không gộp vào
đây — xem header script).

### 1.2 Cơ chế

- Bảng `CATALOGS`: 8 const trên 3 cặp file —
  `lut.ts→lut.js`: `LUT_IDS`, `LUT_META`;
  `sticker.ts→sticker.js`: `STICKER_LIBRARY`, `STICKER_CATEGORIES`,
  `STICKER_DEFAULTS`;
  `textfx.ts→textfx.js`: `TEXT_ANIMATION_META`, `TEXT_ANIMATIONS`,
  `DRAWTEXT_ANIMATIONS`.
- Với mỗi const: quét literal từ `.ts` bằng bộ quét cân bằng ngoặc có
  hiểu chuỗi (`"..."`, `'...'`, `` `...` ``) và comment (`//`, `/* */`)
  để không nhầm ngoặc trong chuỗi/comment; bỏ cast kiểu TS
  (` as StickerCategory`, ` as const`) chỉ ngoài chuỗi; đổi indent
  2 → 4 khoảng trắng (đúng style `.js` hiện tại, giữ cả comment phân
  đoạn `// --- batch ...` trong literal); thay đúng khối const đó
  trong `.js`, mọi phần khác của file giữ nguyên (không regenerate cả
  file — khác với gen-transitions).
- An toàn trước khi ghi: literal sinh ra được kiểm tra parse bằng
  `new Function`; cả file `.js` sau đồng bộ được kiểm tra bằng
  `node --check` trên file tạm — lỗi thì KHÔNG ghi.
- Chế độ `--check`: chỉ so sánh, không ghi; exit 1 khi có lệch, in
  đúng tên const lệch (dùng trong CI).
- Chạy từ repo root:
  `node packages/video-spec/scripts/sync-catalog-mirror.mjs [--check]`
  hoặc `npm run sync:catalog` / `npm run check:catalog` trong
  `packages/video-spec`.

### 1.3 Đo thật lúc chạy lần đầu (07/11/2026, trước khi nối CI)

| Lần chạy | Kết quả |
|---|---|
| `--check` lần 1 | 5 khớp, 3 lệch, exit 1: `lut.js:LUT_IDS`, `lut.js:LUT_META`, `textfx.js:TEXT_ANIMATION_META` |
| sync (ghi) lần 1 | 3 đã đồng bộ, 5 khớp, exit 0 |
| Diff sau sync vs trước sync | Chỉ 5 dòng comment thêm lại (xem §1.4) — **giá trị không đổi** |
| `--check` lần 2 + sync lần 2 | 8/8 khớp, exit 0; sha256 3 file `.js` không đổi → **lũy đẳng** |
| Kiểm chứng âm `--check` | Xóa 1 dòng `"vcut-solarized",` khỏi `lut.js` → `--check` exit 1, chỉ báo `lut.js:LUT_IDS` lệch; khôi phục từ backup, sha256 khớp, `--check` về exit 0 |
| Kiểm chứng sửa lệch | Xóa lại entry trên → chạy sync → file khôi phục **byte-identical** với bản trước khi xóa; checker về 422/0/0 |

### 1.4 5 dòng comment được khôi phục (không phải lệch giá trị)

Script tạm I7 đã làm rơi các comment phân đoạn trong literal khi
đồng bộ (nó serialize lại từ giá trị đã parse). Script mới giữ
nguyên text literal nên khôi phục được chúng — đây là khác biệt duy
nhất giữa `.js` trước/sau lần sync đầu:

- `lut.js` (+3 dòng): `// --- batch K6 Phase 6 (gen_vcut_luts3.py, original) ---`
  (trong `LUT_IDS`), `// --- vcut-*: tự tạo (tác phẩm gốc của VCut Studio) ---`
  và `// --- batch K6 Phase 6 ---` (trong `LUT_META`).
- `textfx.js` (+2 dòng): `// Batch G (R1-070)` và
  `// Phase 9 đợt 10 V4 (ASS — xem TEXT_ANIM_PARITY_LIMITS.md)`
  (trong `TEXT_ANIMATION_META`).
- `sticker.js`: không đổi (đã byte-identical sau phép biến đổi).

### 1.5 Nối vào package + CI + docs

- `packages/video-spec/package.json` — thêm `scripts` (trước đây
  package này không có scripts nào):
  `check:catalog` (sync `--check`), `check:mirror` (checker),
  `sync:catalog`, `sync:transitions` (script đợt 11, đã có).
  Đã chạy thử cả 3 qua npm: `check:catalog` 8/8 khớp,
  `check:mirror` 422/0/0, `sync:catalog` 8/8 khớp (không ghi).
- `.github/workflows/ci-build.yml` — thêm 2 bước sau bước typecheck
  video-spec + 1 đoạn trong header COVER:
  `Mirror catalog .js ↔ .ts (sync --check, mọi Node)` — script sync
  là `.mjs` thuần, không import `.ts`, nên chạy được cả Node 20;
  `Mirror check TS↔JS (checker, chỉ Node 22 — cần type stripping)`
  với `if: matrix.node == 22` và cờ `--experimental-strip-types`
  (matrix CI là [20, 22]; Node 20 chưa có type stripping nên checker
  exit 2 ở đó — không chạy checker trên Node 20 là có chủ ý, không
  phải bỏ sót). **CI chưa chạy thử trên GitHub** (không push trong
  phiên này) — parent kiểm tra lại khi push.
- Docs: header checker cập nhật (§2, phạm vi đợt 53 J9); header
  script sync ghi rõ phạm vi + cách chạy + quan hệ với checker;
  LIMITS này là tài liệu đầy đủ. Không sửa `PHASE9_GAP_ANALYSIS.md`
  (tài liệu hoạch định của parent).

## 2. Probe hàm thuần còn lại — checker 243 → 422

### 2.1 Fixture (dữ liệu thật, không mock kết quả)

Fixture đặt ở đầu bảng `PROBES` trong checker, theo đúng mẫu
`nested.test.ts` / `adjustment.test.ts` / `motion.test.ts` trong cùng
thư mục (plain object đúng shape spec):

- `SPEC_META` `{ name: "spec", width: 1280, height: 720, fps: 30 }`;
  `SUB_SPEC` 6 s (v1 [0,4), v2 [4,6)); `NEST` 1 tầng
  (trim 0..6, speed 2, start 10, duration 3);
  `TOP2`/`NEST2` 2 tầng (lá v3 [0,4) trong subSpec trong);
  `SPEC_020`/`SPEC_010` (cùng tracks, khác version).
- Adjustment: `ADJ_LAYER` (lut vcut-cinematic, [2,6)),
  `ADJ_LAYER_SCOPED` (color, tracks [1]),
  `ADJ_LAYER_1EFFECT` (blur 0.7, tracks [2]),
  legacy clip `ADJ_LEGACY_BLUR` / `ADJ_LEGACY_LUT`.
- `IMG_CLIP` + `IMG_MASK`; `STK_CLIP`; `MASK_KF` (2 keyframe
  0→2 s) + `MASK_STATIC`; `TRACK_PTS` (2 điểm) + `TRACK_PTS_241`
  (241 điểm, vượt `TRACK_MAX_POINTS`).
- Checker chỉ so TS ↔ JS trên cùng input; giá trị kỳ vọng đọc từ
  output in ra (không hard-code số vào checker ngoài tên probe).

### 2.2 Một lệch mirror thật bị bắt + đã sửa — `normalizeStickerClip`

Chạy checker sau khi thêm probe (lượt 1): **410 pass, 0 known,
1 fail** — đúng 1 probe fail:

- `sticker: normalizeStickerClip (điền mặc định…)`: A và B in ra
  JSON giống hệt nhau (vì `JSON.stringify` bỏ key `undefined`),
  nhưng `valuesEqual` đếm key: `.ts` trả 11 key (luôn có `track`,
  kể cả `undefined` — đúng return type
  `Required<Omit<StickerClip, "track">> & Pick<StickerClip, "track">`),
  `.js` trả 10 key (bỏ `track` khi vắng:
  `...(c.track !== undefined ? { track: c.track } : {})`).
- Sửa tối thiểu 1 hunk trong `packages/video-spec/src/sticker.js`:
  luôn giữ `track: c.track` (kèm comment đợt 53 J9). An toàn đã kiểm
  tra: caller duy nhất `StickerPanel.tsx:91` và render worker
  (`server/render/src/sticker.js`) chỉ kiểm tra
  `track !== undefined`; JSON round-trip vốn đã bỏ key undefined nên
  không đổi dữ liệu lưu trữ.
- Chạy lại checker: **411 pass, 0 known, 0 fail**.

### 2.3 Bảng probe mới theo module (179 probe = 422 − 243)

| Module | Số probe | Nội dung chính (fixture phức tạp) |
|---|---|---|
| adjustment | 42 | end/applies/overlaps (kể cả chạm biên không giao), scope tracks, layers-for-clip theo track, validate filter/layer/layers (trùng id, tracks trùng/vượt trackCount, source lạ), converter legacy 2 chiều (filterType, filter, adjustment, trùng effect, 2 LUT, không scope, 1 effect → filterType shortcut) |
| image | 12 | isImageFit/isImageClip, normalize (fit mặc định, giữ mask), validate (fit lạ, duration 0, thiếu src, mask shape lạ, null) |
| sticker | 11 | stickerUrl, isStickerClip, normalize (mặc định + giữ track), validate (opacity/x/scale/rotation sai, kèm track → []) |
| mask | 17 | sort keyframes (chưa sort + trùng t sau thắng), has/normalize, interpolate (giữa đoạn = 0.5, hold 2 đầu, không keyframes), maskGeometryAt, validate (shape/feather/w/keyframe t âm/chuỗi) |
| motion | 23 | validateMotion (10 case throw đúng message: none+targetFps, thiếu targetFps, fps 200, miMode dup, weights toàn 0, kind text, key lạ, weights lệch frames, frames 9), resolveMotionBlur (frames 4 → weights đều, weights [1,3] → [0.25,0.75]), migrateMotion (6 case cứu/không cứu) |
| nested | 31 | isNestedClip, sourceDuration/effectiveSpeed/effectiveTrim/duration, validate (duration sai, speed 9, chuỗi), flattenNested (1 tầng 2 lá, 2 tầng 1 lá, curve hằng, **curve ramp 1→3 đường τ**, speed 0/kind video → throw), composeNestedLeafWindow (1 tầng, 2 tầng, ramp, lá vắng → throw), normalizeNestedClip (shape chuẩn, tracks cũ ± meta, field `in` legacy → trim, subSpec+tracks khác nhau) |
| migrations | 19 | readSchemaVersion/isSupportedVersion/compareVersions/getVersionInfo, migrate010To020, migrate (0.2.0 nguyên vẹn, 0.1.0 → 0.2.0, không version/null, version mới hơn 9.9.9, quá cũ 0.0.1, 0.2.0 thiếu tracks) |
| tracking | 16 | validateTrackPoint/Attachment (t âm, x 1.5, score 2, rỗng, 241 điểm, t không tăng, không phải object), interpolateTrack (giữa đoạn (0.4, 0.5), kẹp 2 đầu, điểm chưa sort, rỗng → (0.5, 0.5)) |
| index | 8 | isVideoSpec (mẫu, version cũ, thiếu tracks, null), projectDuration (4 s, 6 s, tracks rỗng, nested clip → 13) |

### 2.4 Giá trị đã kiểm bằng tay (không chỉ "hai bên khớp nhau")

- `flattenNested(NEST)` → v1 `{absoluteStart: 10, absoluteDuration: 2}`,
  v2 `{absoluteStart: 12, absoluteDuration: 1}`, `path: ["n1"]`,
  `depth: 1` — đúng công thức `(max(s,in)−in)/v`.
- `flattenNested(TOP2)` → v3 `{absoluteStart: 10.5, absoluteDuration: 1,
  path: ["n1","n2"], depth: 2}`.
- `flattenNested` ramp 1→3 → v1 dur `2.274917217635375`, v2
  `@12.274917217635375` dur `0.7250827823646251` — hai bên khớp bit-exact;
  `composeNestedLeafWindow` ramp cho `cumulativeSpeed: 2`
  (= ∫₀³ s / 3, tốc độ trung bình — đúng định nghĩa trong code).
- `validateNestedClip` ramp trim.out=5 → 1 lỗi đúng message
  (`trim.out (5) không khớp trim.in + ∫speedKeyframes… = 6`).
- `migrateMotion` weights `[0,0,0]` → `migrated: true`,
  `frames: 3, weights: [1,1,1]`, 2 notes; blur rỗng → frames 3;
  motion hợp lệ sẵn → `migrated: false` (trả nguyên, không đổi).
- `legacyTrackClipToLayer` blur 0.5 → layer
  `{filters: [{effects: [{type: "blur", intensity: 0.5}]}], tracks: [0],
  source: "legacy-track-clip"}`; `specLayerToLegacyTrackClip`
  1 effect → `filterType: "blur", intensity: 0.7, trackIndex: 2`.
- `interpolateTrack` giữa đoạn → `(0.4, 0.5)`; `interpolateMaskAt`
  t=1 → `x/y/w/h = 0.5`.

## 3. Kiểm chứng gộp của luồng

### 3.1 Checker + sync (chạy lại độc lập sau mọi sửa)

- Checker `packages/video-spec/scripts/check-video-spec-mirror.mjs`:
  **422 pass, 0 known, 0 fail** (exit 0). Trong đó 243 probe gốc đợt
  52 vẫn xanh — không hồi quy. Lượt chạy cuối sau khi thêm 11 probe
  bổ sung (§2.3: adjustment +4, motion +2, nested +5): 422/0/0.
- Sync `--check`: **8/8 khớp, exit 0** (sau sync lần 1). Sync lần 2:
  không ghi file nào, sha256 3 file `.js` không đổi (lũy đẳng).
- Kiểm chứng âm sync (§1.3): xóa 1 entry LUT → `--check` exit 1
  đúng tên const; sync sửa lại byte-identical; checker về 422/0/0.
- `node --check` cho `sync-catalog-mirror.mjs`, `sticker.js`,
  `lut.js`, `textfx.js`: OK (script sync tự kiểm tra cả file `.js`
  sau đồng bộ trước khi ghi).

### 3.2 tsc + build + test hồi quy

- `npx tsc --noEmit` apps/web: **exit 0, 0 lỗi** (lượt cuối, sau khi
  các luồng khác ổn định — xem §3.3 về 2 lần fail thoáng qua trước đó).
- `npm run build` (tsc + vite build): **pass, built in 25,69 s**;
  chỉ cảnh báo chunk > 500 kB có sẵn (như mọi đợt trước).
- Test video-spec (tsc compile ra /tmp rồi `node --test`):
  adjustment + nested + motion + migrations + timebase:
  **152/152 pass, 0 fail**. (File `nestedCurveWindow23.test.ts`
  KHÔNG chạy được trong đợt này — xem §3.4, lỗi tiền sẵn.)
- Test web (strip-types): `mirrorUnifyRound52I7` **12/12**,
  `keyframeNormalizeRound50F1` **11/11**,
  `speedKeyframesRound51H5` **13/13** — fail 0.
- Standalone `tsc --strict` trên video-spec: không chạy riêng đợt này
  (CI đã có bước typecheck standalone; `tsc --noEmit` apps/web +
  test compile ở trên đã cover graph video-spec qua import).

### 3.3 Hai lần `npm run build` fail thoáng qua — phân tích (không phải lỗi J9)

- Lần 1: `gopRangeFetch39T3.ts(142,3) TS6133 'validateAvccSample'`;
  lần 2: `ttsEstimate51H1.ts(90–92) TS6133 'TTS_PROBE_TEXT_P*_50F3'`.
  Cả hai đều là báo "unused" SAI so với nội dung trên đĩa
  (`validateAvccSample` dùng ở dòng 1152/1219;
  `TTS_PROBE_TEXT_P10_50F3` dùng ở dòng 160–162).
- Nguyên nhân: các luồng song song đợt 53 đang ghi dở file đúng lúc
  build chạy — bằng chứng mtime: `ttsEstimate51H1.ts` sửa lúc
  21:00:29 UTC, `seekSeekable53J6.test.ts` (file test mới của luồng J6)
  tạo lúc 21:01:29 UTC, đều trong cửa sổ phiên J9 (bắt đầu 20:41 UTC);
  `gopRangeFetch39T3.ts` mtime 20:59:30 UTC cũng trong phiên.
  Lần `tsc --noEmit` chạy sau đó fail đúng 1 lỗi duy nhất:
  `seekSeekable53J6.test.ts(21,8) TS5097` (file test mới chưa kịp
  vào exclude của tsconfig) — và ngay sau đó file đó đã xuất hiện ở
  dòng exclude 166 (luồng J6 tự thêm). Chạy lại lần cuối: tsc 0 lỗi,
  vite build pass (§3.2).
- Kết luận: không có file nào của J9 gây ra các lần fail đó; không sửa
  gì để "chữa" chúng (đụng vào file luồng khác là ngoài phạm vi).
  Parent gộp nên chạy lại tsc/build một lần sau khi mọi luồng dừng ghi.

### 3.4 Không chạy lại / không chạy được

- `nestedCurveWindow23.test.ts`: KHÔNG compile được bằng lệnh tsc
  chuẩn của các test video-spec khác — lỗi tiền sẵn
  `TS5097: import "./nested.ts"` (import đuôi `.ts` trực tiếp, cần
  `allowImportingTsExtensions`). File này không thuộc phạm vi J9
  (không import module J9 probe); lần chạy test gộp đầu có nó thì
  152 pass + 1 fail (chính file này load lỗi), lần chạy sau loại nó
  ra thì 152/152. Không sửa file này (ngoài phạm vi).
- Click-test headed thật / Safari / máy thật / GPU thật: chưa đo
  (toàn bộ trên Node 24 + tsc + vite, như các đợt trước).
- CI GitHub chưa chạy thử (không push trong phiên này) — 2 bước CI
  mới chỉ được kiểm tra cú pháp YAML bằng mắt + chạy lệnh tương
  đương local; parent kiểm tra lại khi push.

## 4. Hàm nào vẫn chưa probe được và vì sao (không bịa số)

| Hàm / nhóm | Vì sao chưa probe |
|---|---|
| `buildAdjustmentChain` (server/render/src/adjustment.js) | Chỉ có ở render worker (dựng chuỗi filter FFmpeg), không thuộc video-spec — ngoài phạm vi checker này. Logic chọn layer/validate của render mirror theo adjustment.ts nhưng checker hiện không so render ↔ spec cho adjustment (chỉ TS ↔ JS trong video-spec). |
| Hàm nội bộ không export của nested.ts: `flattenInto`, `nestedRampTau`, `resolveNestedFlattenRate`, `validateNestedSpeedCurveShape`, `findChildInSubSpec`, `normalizeDeepEqual`, `normalizeMetaOf` | Không export nên checker không gọi trực tiếp được. Đã probe GIÁN TIẾP qua hàm công khai: ramp 1→3 qua `flattenNested`/`composeNestedLeafWindow`/`validateNestedClip` (đường τ + thông báo lỗi trim.out) đã phủ `nestedRampTau`/`resolveNestedFlattenRate`/`validateNestedSpeedCurveShape`; `flattenInto`/`findChildInSubSpec` qua flatten/compose 2 tầng. |
| `hasValidStructure` (migrations.ts, nội bộ) | Probe gián tiếp qua `migrate` (spec thiếu tracks → throw, spec thiếu meta → throw). |
| `MigrationError` (class) | Không phải hàm thuần — chỉ có field `fromVersion`/`toVersion` trên instance lỗi. Tầng A đã khóa tên export; message của `migrate` (dùng class này) đã probe ở cả 4 nhánh throw. Chưa assert trực tiếp `err instanceof MigrationError` / field của instance. |
| `validateMotion` qua `clipKind` khác "video" ngoài "text" | Chỉ probe `clipKind="text"` (đủ chứng minh nhánh throw); các kind khác cùng một câu lệnh `if`. |
| `isVideoSpec`/`projectDuration` với clip `nested` lồng 2 tầng trở lên | Chỉ probe nested 1 tầng (duration 13). `projectDuration` chỉ cộng `start+duration` của clip ngoài cùng nên độ sâu không đổi ngữ nghĩa — không cần fixture sâu hơn. |
| Render mirror thứ ba (server/render/src/*) cho các module mới probe | Checker chỉ có cặp render cho keyframes/speedcurve (từ H5/I7). Các module adjustment/mask/motion/nested… có mirror render viết tay riêng (vd `server/render/src/adjustment.js`, `motion.js` normalizeLegacyMotion) nhưng KHÔNG nằm trong checker — lệch ở đó (nếu có) chưa bị bắt. Đây là nợ mở lớn nhất của đợt này: muốn khóa thì cần thêm cặp `render:` cho từng module ở đợt sau. |

## 5. File đổi/thêm

SỬA (6 file):

- `packages/video-spec/scripts/check-video-spec-mirror.mjs` — fixture
  J9 + 179 probe mới (9 nhóm) + cập nhật header phạm vi.
- `packages/video-spec/src/sticker.js` — `normalizeStickerClip` luôn
  giữ key `track` (1 hunk + comment J9; sửa lệch thật §2.2).
- `packages/video-spec/src/lut.js` — chỉ +3 dòng comment phân đoạn
  (khôi phục bởi script sync, §1.4; giá trị không đổi).
- `packages/video-spec/src/textfx.js` — chỉ +2 dòng comment phân đoạn
  (khôi phục bởi script sync, §1.4; giá trị không đổi).
- `packages/video-spec/package.json` — thêm `scripts`
  (`check:catalog`, `check:mirror`, `sync:catalog`,
  `sync:transitions`).
- `.github/workflows/ci-build.yml` — thêm 2 bước mirror check + 1
  đoạn header COVER.

MỚI (2 file: script + LIMITS này):

- `packages/video-spec/scripts/sync-catalog-mirror.mjs` — script đồng
  bộ catalog (§1).
- `docs/PHASE9_ROUND53_J9_MIRROR_PROBE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI (ghi rõ theo lệnh): `packages/video-spec/src/keyframes.ts`,
`speedcurve.ts`, `audio.js` (dùng chung với I7 — J9 không chạm);
`packages/video-spec/src/transitions.js` (đã có script riêng);
`server/render/src/*` (mirror render — ngoài phạm vi checker đợt này,
xem nợ §4); `apps/web/tsconfig.json` (exclude của luồng J6 tự thêm
trong lúc J9 chạy — không phải file J9 sửa; parent gộp lưu ý);
`docs/PHASE9_GAP_ANALYSIS.md`; `PHASE9_ROUND52_I7_MIRROR_UNIFY_LIMITS.md`.
Scratch ở `/tmp/j9-*` (log checker, backup lut/textfx/sticker trước
sync, output test/compile) — không vào repo, không vào batch.
Build output `apps/web/dist/` của lần `npm run build` cuối là build
output, không stage (theo tiền lệ).

## 6. Lưu ý cho parent gộp (tránh đụng luồng song song)

- **File chung có thể bị nhiều luồng đợt 53 sửa:** `apps/web/tsconfig.json`
  (luồng J6 đã thêm exclude `seekSeekable53J6.test.ts` trong lúc J9
  chạy — J9 KHÔNG sửa file này, không đưa vào batch J9);
  `packages/video-spec/src/sticker.js` (chỉ J9 sửa hunk
  `normalizeStickerClip`); checker mirror (chỉ J9 mở rộng đợt này —
  nếu luồng khác cũng sửa cùng file thì đối chiếu trên đĩa trước khi
  gộp, giữ đủ probe của mọi luồng). Các file J9 sửa đều đã verify lại
  bằng checker + test + tsc + build sau lần sửa cuối.
- **Checker nay là 422 probe:** lần sau đổi 1 mirror mà quên mirror
  còn lại sẽ FAIL ngay (đúng thiết kế). Thêm mục catalog mới ở `.ts`
  thì chạy `npm run sync:catalog` (trong `packages/video-spec`) rồi
  chạy lại checker — không sửa tay `.js` catalog nữa.
- **CI mới:** bước checker chỉ chạy trên Node 22 (`if: matrix.node
  == 22`) — có chủ ý vì Node 20 không có type stripping; đừng "sửa"
  thành chạy mọi Node nếu chưa kiểm tra `process.features.typescript`.
- **Lệch render mirror chưa khóa:** xem §4 dòng cuối — nếu đợt sau
  thêm cặp `render:` cho adjustment/mask/motion/nested thì bắt đầu
  từ các hàm đã probe ở đây (fixture đã có sẵn trong checker).

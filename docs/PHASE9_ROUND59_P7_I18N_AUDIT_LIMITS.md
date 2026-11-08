# Phase 9 đợt 59 P7 — Kiểm toán i18n hậu-gộp đợt 58 (LIMITS)

Ngày: 2026-11-07 (lượt cron 21:35 +07). Test-only: KHÔNG sửa code sản phẩm,
KHÔNG sửa vi.json/en.json, KHÔNG push, KHÔNG release/tag, KHÔNG binary.
Mọi số dưới đây đều đếm/chạy thật; chỗ chưa kiểm chứng được thì ghi rõ.

## 0. Kết luận ngắn

1. **Dict khớp 1942 key**: `vi.json` == `en.json` == **1942 key lá**, cùng
   tập key, placeholder `{…}` khớp từng key, 0 giá trị rỗng. 5 key mới
   đợt 58 (4 O3 + 1 O5) đã có trong dict đúng từng chữ fragment.
   48 key vi==en là hợp lệ (tên riêng, nhãn emoji, mẫu định dạng) — đã
   khóa con số trong test.
2. **41 key mồ côi** trong dict (không tham chiếu ngoài dict, kể cả truy
   cập động): 28 key `projectRepo.validate*/keyframeFix*/invalidJson/
   untitledProject` + 13 key lẻ (`common.apply/loading`,
   `adjustment.*` ×5, `nestedBoundary.title`, `loadReport.fix`,
   `nativeFiles.*` ×3, `pack.back`). **0 key mồ côi thuộc đợt 58.**
   Nhóm projectRepo là key chết thật: `validateSpecDeep` vẫn trả chuỗi
   VI thô (không dùng messageKey cho nhóm này), không code nào đọc các
   key đó — xem §1.
3. **Literal còn sót trong 36 file đã migrate (56–58): 30 lần xuất hiện /
   27 mẫu duy nhất.** Trong đó 1 mẫu thuộc luồng song song P8
   (`enhance.badgeTitle`, Timeline.tsx — UI-visible thật, tooltip badge
   ✨ hiện tiếng Việt ở cả hai locale vì key chưa vào dict; P8 đã có
   fragment riêng nên P7 KHÔNG đề xuất trùng). 29 lần còn lại đều là
   diagnostic NON-UI: 24 lý do GOP (`gopRangeFetch39T3.ts`) + 4 lý do
   trial-decode (`gopTrialDecode55L8.ts`) + `"case xấu"`
   (`loadReport.ts`) — không tới UI, chỉ tới getter `gopFallbackReason`
   (test/diagnostics) hoặc bị catch nuốt — xem §3. Đề xuất 26 key mới
   trong fragment P7 (25 `gop.*` + 1 `loadReport.badCase`); parent quyết
   định có nối hay không.
4. **Không còn JSX-text tiếng Việt nào** trong 36 file quét (0). Không
   literal UI-visible mới nào do đợt 58 gây ra — các literal GOP/loadReport
   đều có từ trước đợt 58 nhưng chưa từng được kiểm kê (M6/N8 không quét
   2 file này hết; O6 đợt 58 chỉ đổi timeout/comment, không thêm chuỗi).
5. **4 fallback trKey "lệch tĩnh" là benign** (fallback ghi cứng giá trị
   mà dict diễn đạt bằng `{var}` — vd `128` thay cho `{value}`) — runtime
   đã được M5 kiểm chứng, không phải lỗi nối key. Test khóa đúng 4 site.
6. **Server/desktop chưa từng được kiểm kê**: 253 literal VI trong 8 file
   đổi đợt 58 ngoài web (bridge 156, desktop 64, render 33) — toàn bộ là
   diagnostic có từ trước (O8 chỉ đổi chính tả Hủy→Huỷ ở đó). Nằm ngoài
   phạm vi dict web; cần đợt quét riêng nếu muốn i18n hoá — xem §5.

## 1. Dict — số thật

Đếm bằng script (flatten + so sánh): vi 1942 lá, en 1942 lá, cùng tập
key, 0 key chỉ-một-bên, 0 placeholder lệch, 0 giá trị rỗng, 48 key
vi==en (đã liệt kê trong test — toàn bộ là tên riêng/emoji/mẫu như
`"Track"`, `"Marker"`, `"Slogan"`, `"{w}×{h} @{fps}fps · CRF {crf} …"`).

### 1.1 Key mồ côi — 41 key

Định nghĩa: key trong dict nhưng không xuất hiện dạng literal
`"key"`/`'key'`/`` `key` `` trong bất kỳ file nguồn nào của
`apps/web/src` (trừ test) + fragments, và không thuộc họ truy cập động
(`transition.opt.*`, `textanim.opt.*`, `errorDetail.summary.*`,
`structuredNotes.*` — 4 họ này có mẫu template `` `prefix.${var}…` ``
thật trong source). Đã kiểm thêm `apps/desktop/src`, `server/`,
`mcp-server`, `cli`, `packages`: 0 tham chiếu ngoài web cho cả 41 key.

| Nhóm | Key | Ghi chú |
|---|---|---|
| projectRepo (28) | `validateNotObject`, `validateMissingId`, `validateStartRange`, `validateDurationPositive`, `validateMissingSrc`, `validateMissingIn`, `validateMissingOut`, `validateMissingText`, `validateSpeedRange`, `validateTrimInvalid`, `validateMissingSubSpec`, `validateKindUnsupported`, `validateNotVideoSpec`, `validateSubSpecCycle`, `validateMetaName`, `validateMetaWidth`, `validateMetaHeight`, `validateMetaFps`, `validateTracksArray`, `validateClipsArray`, `keyframeFixNotObject`, `keyframeFixNotArray`, `keyframeFixEmptyAfterDrop`, `keyframeFixDroppedEntries`, `keyframeFixEasingNormalized`, `keyframeFixKept`, `invalidJson`, `untitledProject` | Key chết: `validateSpecDeep` (`lib/projectRepo.ts:586+`) đẩy lỗi bằng chuỗi VI thô qua `at(path, "phải là object.")` — các chuỗi ngắn đó TRÙNG giá trị dict nhưng code không hề gọi key; không có `messageKey` nào nhận các giá trị này (grep toàn repo trừ dict/fragment/test = 0). Có lẽ key được thêm theo đề xuất nhưng chưa bao giờ nối. |
| common (2) | `common.apply`, `common.loading` | Không tham chiếu nào. |
| adjustment (5) | `adjustment.addFail`, `adjustment.listTitle`, `adjustment.saveOk`, `adjustment.saveFail`, `adjustment.scopeSingleBlocked` | Không tham chiếu nào (panel adjustment dùng key khác). |
| khác (6) | `nestedBoundary.title`, `loadReport.fix`, `nativeFiles.readError`, `nativeFiles.writeError`, `nativeFiles.saveDone`, `pack.back` | Không tham chiếu nào (`loadReport.fix*` dài hơn như `fixLineConfirmTitle` thì có dùng, riêng `loadReport.fix` thì không). |

Test khóa đúng danh sách 41 key này; key mới đợt 58 không nằm trong đó.
Chưa đề xuất xóa key nào — parent quyết (xóa key mồ côi là việc dọn
dict, ngoài phạm vi kiểm toán).

### 1.2 Fragment O3/O5 đã gộp đúng

- `round58-o3.json` 4 key (`preview.nestedSkippedBadge/Toast`,
  `preview.effectSkippedBadge/Toast`) + `round58-o5.json` 1 key
  (`captions.translatedTrack`): giá trị trong vi/en.json đúng từng chữ
  fragment, vi khác en, placeholder khớp.
- 5 key đợt 58 không trùng key fragment khác. Lưu ý: các fragment cũ
  ĐƯỢC PHÉP trùng nhau (vd `caption.title` có ở cả round56-m2 và
  round56-m4) nên test chỉ khóa riêng 5 key này, không khóa toàn cục.

### 1.3 Key luồng P8 (song song)

P8 đã viết fragment riêng (11 key `enhance.*`: `badgeTitle`,
`presetLabel/Off/Light/Balanced/Strong/Custom`, `activeSummary`,
`sumDeinterlace/Stabilize/Denoise`) tại
`hidden_files/round59-p8-fragment.json`. Tại lúc kiểm toán, cả 11 key
đều chưa vào dict — test khóa: nếu key đã vào dict thì giá trị phải
đúng fragment P8. P7 không đề xuất trùng bất kỳ key nào trong 11 key này.

## 2. Quét literal — phương pháp + số thật

Scanner tạm `/tmp/round59-p7/scan.mjs` (không nằm trong repo): tách
comment, trích string literal `'...'`/`"..."`/`` `...` `` (xử lý đúng
`${...}` lồng ngoặc) + JSX-text node; chuẩn hoá `${x}`/`{var}` → `{X}`
để so với dict; đối chiếu inventory M6 (396 entry) + N8 (1650 entry).
Test mới `lib/i18nAudit59P7.test.ts` cài lại cùng logic và khóa kết quả.

Phạm vi quét: 36 file = 29 file `apps/web/src` đổi ở đợt 58 (theo 9 file
`paths-loop/phase9-round58-*.txt`, trừ test/script) + 7 file đã migrate
đợt 56–57 nhưng không đổi ở đợt 58 (`twoLevelCurve.ts`, `curveFix.ts`,
`projectRepo.ts`, `userLut.ts`, `projectHistory.ts`, `CaptionModal.tsx`,
`SilenceModal.tsx`).

Kết quả (test in ra): **520 literal** trong 36 file —
`PRE_EXISTING` (đã có trong verdicts M6/N8) 170, `DICT_VALUE` (trùng
đúng giá trị lá vi.json) 222, `WIRED-FALLBACK` (fallback trKey, đuôi
tĩnh khớp dict) 71, `DICT_VALUE-PART` (phần của 1 giá trị dict,
template nhiều dòng) 23, `CANDIDATE_NEW` 30, `TRKEY-MISMATCH` 4.

### 2.1 Tồn đọng web — 30 lần / 27 mẫu

| # | File | Literal (rút gọn) | Tính chất |
|---|---|---|---|
| 1 | `Timeline.tsx:382` | `Clip có tăng cường — xem mục Tăng cường video trong Inspector` | **UI-visible, P8 sở hữu** — `title` của badge ✨, gọi `enhanceT("enhance.badgeTitle", fallback)`; key chưa có trong dict nên cả locale EN cũng hiện fallback VI. Không đề xuất trùng (P8 đã có key trong fragment của họ). |
| 2–25 | `lib/gopRangeFetch39T3.ts` (24 lần / 21 mẫu) | `"${kind}-status-…: server không trả 206…"`, `"…-short-body: xin … byte…"`, `"fetchSampleRemainderChunked: … không hợp lệ"`, `"sample-chunk-limit: …"`, `"fetchVideoTrackByGopRange: url…"`, `"…prefixBytes/… phải > 0"`, `"prefix-status-…"`, `"prefix-short-body: …"`, `"moov-too-large: …"` ×2, `"moov-out-of-file: …"`, `"demux-moov: sample … vượt ngoài file…"`, `"… trỏ ngoài mdat…"`, `"… bố cục sample bất thường…"`, `"… ctts khai …"`, `"… stss có … keyframe ngoài…"`, `"… timestamp stts bất thường…"`, `"… không đọc được sample đầu để kiểm AVCC…"`, `"… sample 0 không phải AVCC…" ×2`, `"… trial-decode sample 0 lỗi …" ×2`, `"gop-…-out-of-file: …"`, `"gop-…-sample-out-of-range: …"` | Diagnostic NON-UI — reason trả về trong outcome, xem §3. |
| 26–29 | `lib/gopTrialDecode55L8.ts` (4) | `"no-decoder: không có probe trial-decode"`, `"timeout-${timeout}ms: trial-decode chưa xong, cho qua (fail-open)"`, `"unsupported-config: decoder không hỗ trợ codec/profile này — cho qua (fail-open)"`, `"decode-failed: VideoDecoder không decode được sample 0"` | Diagnostic NON-UI, reason của `runTrialDecode`. |
| 30 | `lib/loadReport.ts:308` | `"case xấu"` | `throw new Error("case xấu")` trong try/catch, bị catch nuốt → trả `note.fallback`; message không bao giờ hiện ra ngoài. |

**Có phải mới ở đợt 58 không? Không — với 29/30 mẫu.** Bằng chứng:
- O6 (đợt 58) chỉ đổi hằng timeout + helper + comment trong 2 file GOP
  (LIMITS O6 §5: "Không đổi `runTrialDecode`, probe, fail-open" và
  "Không đổi logic gate, probe, prefix, tail-scan, AVCC, mdat, chunk…"
  ở `gopRangeFetch39T3.ts`) — các chuỗi reason đã có từ các đợt
  39–52, chỉ là M6 (23 entry trong file này) và N8 (0 entry) chưa kiểm
  kê hết.
- O8 chỉ đổi chính tả Hủy→Huỷ trong `loadReport.ts`; `"case xấu"` có
  từ cơ chế structured-note (đợt 32) trở đi.
- Ngoại lệ duy nhất là mẫu Timeline: không xác định được chắc chắn
  xuất hiện ở đợt 58 hay đợt 59 — snapshot 06/11 không có chuỗi này,
  các batch đợt 55–57 không đụng `Timeline.tsx`, nhưng luồng P8 đợt 59
  đang sửa chính file này (mtime 14:46 UTC, sau baseline đợt 59
  14:38). Dù thuộc đợt nào thì P8 cũng đã sở hữu key — xem §6.2.

Đề xuất key (26 key, fragment tại
`hidden_files/round59-p7-fragment.json`, KHÔNG gộp vào dict):
25 key `gop.*` (4 trial + 12 range + 9 demux; 3 mẫu lặp 2 site dùng
chung 1 key) + 1 `loadReport.badCase`. Đã verify máy: 26/26 giá trị vi
khớp đúng literal nguồn (sau chuẩn hoá), vi/en parity, placeholder
khớp, không trùng dict, không trùng fragment P8. Wiring (truyền lookup
xuống `runTrialDecode`/`fetchVideoTrackByGopRange` và đổi reason thành
key) là việc riêng — parent quyết; các reason hiện là chuỗi diagnostic
nên nối key cũng phải giữ nguyên format `prefix: …` để test cũ
(`gopWiring40V2`, `gopSizeProbe41W4`, `gopBlobUrl49E2`…) vẫn match.

### 2.2 4 fallback trKey "lệch tĩnh" — benign, đã khóa

| File | Key | Vì sao lệch tĩnh nhưng đúng |
|---|---|---|
| `lib/curveFix.ts:869` | `speedCurve.keyframesTooMany` | Fallback ghi `quá ${SPEED_KEYFRAMES_MAX} keyframe` (=128), dict ghi `quá 128 keyframe (có {value})` — cùng giá trị sau khi thay var. |
| `lib/curveFix.ts:965` | `curveFix.moreViolations` | Fallback `… và ${warnings.length - shown.length} vi phạm khác`, dict `… và {n} vi phạm khác`. |
| `lib/nestedPreview.ts:1367` | `curveErr.kfVRangeDots` | Fallback ghi cứng `0.25..4`, dict `{min}..{max}`; runtime EN đã kiểm chứng trong test mới: `clipX: speedKeyframes.keyframes[0].v must be in 0.25..4 (got: 9)`. |
| `lib/projectRepo.ts:1259` | `projectRepo.keyframeDropped` | Fallback `${shown}${extra}` gộp thành var `{fields}` của dict. |

Cả 4 đều đã được M5 kiểm chứng runtime (M5 chạy lại 21/21). Test mới
khóa đúng 4 site này; site lệch mới sẽ đỏ.

### 2.3 0 JSX-text + mọi trKey đều trỏ key có trong dict

- 0 literal dạng JSX-text trong 36 file (text node JSX không qua
  `t()` được nên con số 0 này có ý nghĩa).
- Mọi `trKey(lookup, "…")` trong 36 file đều trỏ key có trong cả
  vi.json và en.json (không key thiếu).

## 3. Sink của 29 lý do GOP/loadReport — vì sao xếp NON-UI

- `runTrialDecode` trả `{ passed, skipped, reason }`; reason được
  `gopRangeFetch39T3.ts` nhúng vào reason ngoài (`demux-moov: trial-
  decode sample 0 lỗi (${trial.reason} — moov giả?)`) rồi trả về trong
  outcome của `fetchVideoTrackByGopRange`.
- Call site duy nhất: `reverseWebcodecs.ts:1418` — gán
  `this.gopFallbackReasonValue = outcome.reason`; throw
  `GopRangeFailure` cũng bị catch tại đây và gán
  `"gop-unexpected-exception: rơi về full-file"` (literal này đã có
  trong inventory M6).
- Getter công khai `gopFallbackReason` (`reverseWebcodecs.ts:760`)
  chỉ được test đọc (`gopWiring40V2`, `gopSizeProbe41W4`,
  `gopBlobUrl49E2`, `gopTail46B4`…); grep toàn `apps/web/src/*.tsx`
  = 0 consumer UI. Chuỗi reason không render ra màn hình.
- `"case xấu"` (`loadReport.ts:308`): throw trong try/catch, catch trả
  `note.fallback` — message không thoát ra ngoài.
- Kết luận: 29 literal này là diagnostic cho dev/test. Đề xuất key
  trong fragment P7 là để parent có sẵn khi muốn chuẩn hoá, không phải
  vì user đang thấy tiếng Việt ở UI. Literal UI-visible duy nhất trong
  đợt quét là `enhance.badgeTitle` — đã thuộc P8.

## 4. Kiểm chứng chạy lại (số thật)

- Test mới `lib/i18nAudit59P7.test.ts`: **7/7 pass** (esbuild bundle
  cjs + node; xem header file để chạy lại).
- Test cũ chạy lại sau đợt 58: M2 **14/14**, M5 **21/21**, N4 **14/14**,
  N8 **8/8**, L2 **20/20** — tất cả xanh.
  - Lưu ý M5: header file ghi `node --experimental-strip-types`
    nhưng cách đó gãy trên Node 24.22.1 ở đây
    (`ERR_MODULE_NOT_FOUND` do import không đuôi `.ts` —
    `from "./nestedPreview"`); chạy bằng esbuild bundle cjs như các
    test còn lại thì 21/21. Đây là quirk môi trường có từ trước (cùng
    họ với ghi chú O7 đợt 58 §6.7), không phải lỗi do đợt 58/59 gây ra.
- `tsc` apps/web: **0 lỗi** (test mới không cần thêm dòng exclude
  tsconfig — import không đuôi `.ts`, không top-level await).
- Không chạy vite build (không sửa code sản phẩm, chỉ thêm 1 file test).

## 5. Ngoài phạm vi web — server/desktop chưa từng kiểm kê

Scanner quét cả 8 file desktop/server đổi ở đợt 58: **253 literal**
CANDIDATE_NEW (không có trong dict web lẫn verdicts M6/N8 — 2 bộ
inventory đó chỉ quét `apps/web/src`):

| File | Số |
|---|---|
| `server/bridge/src/index.js` | 134 |
| `apps/desktop/src/main.ts` | 42 |
| `server/bridge/src/jobQueue.js` | 22 |
| `apps/desktop/src/services/modelDownloader.js` | 21 |
| `server/render/src/motion.js` | 19 |
| `server/render/src/speedramp.js` | 14 |
| `apps/desktop/src/preload.ts` | 1 |

Toàn bộ là diagnostic/log/error có từ trước đợt 58 (O8 chỉ đổi chính
tả trong các file này). Server/desktop không có hạ tầng `t()` như web
nên không đề xuất key cho nhóm này trong fragment P7; nếu parent muốn
i18n hoá desktop/server thì cần đợt quét + thiết kế riêng.

## 6. Nợ mở / lưu ý

1. **41 key mồ côi** (§1.1) — parent quyết giữ hay dọn; riêng nhóm
   `projectRepo.validate*/keyframeFix*` (28 key) là key chết chưa bao
   giờ được nối, cần quyết định nối thật (đổi `validateSpecDeep` sang
   messageKey) hay xóa.
2. **P8 sở hữu `enhance.*`** — parent gộp fragment P8 xong thì test P7
   vẫn xanh (nó chỉ khóa "nếu đã vào dict thì phải đúng fragment P8"),
   nhưng tooltip badge sẽ đổi sang EN đúng — không cần sửa test.
3. **P3 sở hữu `nested.failsoft.unknownEffectType` `{type}`** —
   fragment P3 đã có `{type}`, source đã truyền var, dict cũ chưa có
   placeholder nên chuỗi chưa đổi tới khi gộp (xem LIMITS P3 §2). Test
   P7 khóa fallback VI cũ + lời gọi trKey có `{ type }`.
4. **Test P7 là snapshot giữa các luồng song song**: các file
   `nestedPreview.ts`, `gopRangeFetch39T3.ts`, `gopTrialDecode55L8.ts`,
   `Timeline.tsx`, `presets.ts` đang được P3/P6/P8 sửa cùng lúc (số
   dòng đã dịch chuyển giữa 2 lần quét trong cùng buổi). Nếu test đỏ
   ở bước gộp của parent thì chạy lại scan trước, đừng nới lỏng test.
5. **M5 strip-types gãy** (§4) — header test M5 ghi cách chạy không còn
   đúng trên Node 24.22.1; các test audit khác đều dùng esbuild bundle.
6. Nợ cũ giữ nguyên: workflow `ci-security.yml` 403 chưa lên GitHub;
   N6 hoán đổi delta stts; N5 bản dịch EN template chưa qua người bản ngữ.

## 7. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round59-p7-i18n-audit.txt`
(NUL-delimited, verify read-back, 2 entry, text only, không binary/dist):
- `apps/web/src/lib/i18nAudit59P7.test.ts` (test kiểm toán mới, 7/7)
- `docs/PHASE9_ROUND59_P7_I18N_AUDIT_LIMITS.md` (LIMITS này)

Fragment đề xuất nằm NGOÀI repo tại
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round59-p7-fragment.json`
(26 key) — cố tình không đưa vào batch để parent quyết định wiring/gộp.

Tổng batch đang chờ user push sau luồng này: xem build-loop-log (parent
cộng dồn; các luồng P khác của đợt 59 có thể stage thêm song song).

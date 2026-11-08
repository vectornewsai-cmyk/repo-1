# Phase 9 đợt 59 — TỔNG HỢP GỘP (LIMITS)

Ngày: 2026-11-07. Parent gộp đợt 59 (10 luồng P1–P10) + wiring + kiểm chứng
lại trên cây đã gộp. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

Chủ đề: đóng nợ đợt 58 (§6 LIMITS tổng hợp đợt 58) + Enhance theo gap E3.
Đính chính giữa đợt (P10 kiểm chứng code): Enhance UI ĐÃ CÓ SẴN từ Phase 9
R2 (`EnhancePanel` trong Inspector) — gap E3 "không có UI" đã cũ; P8 đổi
hướng sang kiểm chứng + hoàn thiện panel hiện có, P9 giữ nguyên kiểm chứng
render. Khoảng cách thật còn lại của Enhance là preview chưa áp enhance.

## 0. Kết quả gộp dict — số thật

- Trước gộp: `vi.json` == `en.json` == **1942 key lá** (đếm thật bằng script).
- Đã gộp fragment P1 (4 key mới `mediabin.removeTitle/removeConfirm/removed`,
  `store.toastMediaInUse`) + P8 (11 key mới `enhance.*`) + P3 (GHI ĐÈ 1 key
  cũ `nested.failsoft.unknownEffectType`, thêm `{type}`).
- Sau gộp: `vi.json` == `en.json` == **1957 key lá** (1942 + 15; vi/en cùng
  tập key, placeholder khớp toàn bộ). Script gộp `/tmp/merge59.py`:
  cấm ghi đè trừ đúng key P3, cấm key mới trùng key cũ — đã verify sau ghi.
- Fragment P7 KHÔNG gộp (26 key diagnostic `gop.*` + `loadReport.badCase`,
  chưa có wiring): gộp sẽ thêm 26 key mồ côi và làm đỏ test P7 (khóa 41 key
  mồ côi + 26 mẫu tồn đọng). Để cho đợt wiring riêng; fragment vẫn nằm ở
  `hidden_files/round59-p7-fragment.json`.
- Snapshot test khóa số key: 9 file assert đã sửa `1942` → `1957` (giữ dòng
  lịch sử đợt 58, thêm dòng đợt 59); 3 file chỉ comment đã cập nhật mốc.
  Không còn assert nào khóa 1942 trong `apps/web/src` (chỉ còn dòng lịch
  sử "gộp lên 1942").

## 1. Fallback `skippedEffectReason` nêu tên type (parent, theo khuyến nghị P3 §5.1 #2)

- `nestedPreview.ts`: fallback không-lookup đổi từ chuỗi tĩnh
  `"type chưa biết, …"` thành chuỗi ráp từ `type`
  (`` `type "${type}" chưa biết, …` ``) cho nhất quán với dict đã gộp.
- Cập nhật cùng lúc (không thì đỏ): N4 §B + §C + §D, `round57-n4.json`
  (giá trị mới), `nestedPreview.test.ts:555`, O3 §E, P3 §B + §E, P7 dòng
  550. Lưu ý đã bắt được khi kiểm chứng: N4 §C assert `skippedReasons`
  của `HOLOGRAM_LAYER` phải là `"hologram"` (không phải `"sharpen"`)
  — giá trị cũ không nêu tên nên lỗi này trước đây không lộ.
- Test P3 §B "lookup chỉ từ dict → chuỗi cũ (pre-merge)" đã đổi thành
  hậu-gộp (dict nay trả chuỗi mới); test P8 khối pre-merge đổi thành
  post-merge (key đã có trong dict thật, `t()` trả chuỗi theo locale).

## 2. Đối chiếu đĩa (baseline round59-baseline.sha256)

- Hợp 10 batch luồng = **55 file duy nhất**, khớp chính xác 55 file
  đổi/mới trên đĩa so với baseline (0 file lạ, 0 file thiếu, không
  binary/dist/`__pycache__`). (60 entry batch trừ 5 lần đếm trùng
  `tsconfig.json` ở P1/P2/P4/P6/P8.)
- File chung nguyên vẹn: `tsconfig.json` đủ cả 5 dòng exclude mới
  (P1 binPersist, P2 escapeModals, P4 modalClasses, P6 gopTrialDecode,
  P8 enhancePresets); `CaptionModal.tsx` còn nguyên cả hunk P4
  (`className="modal"`, 0 `caption-modal`) lẫn hunk P5 (chuẩn hoá tên
  ASCII NFD + `appendChild`); `Timeline.tsx` có badge ✨ P8 +
  `enhanceT("enhance.badgeTitle", …)`.
- Parent sửa thêm 20 file duy nhất (xem §7) — đều nằm trong batch closing.

## 3. Kiểm chứng lại trên cây đã gộp (số thật, parent chạy lại độc lập)

- `tsc` apps/web: **0 lỗi**; `tsc` apps/desktop: **0 lỗi**;
  `vite build` apps/web: **pass, 5,85 s** (cảnh báo chunk >500 kB có sẵn).
- Chạy lại bằng esbuild bundle + node (file có top-level await phải bundle
  `--format=esm` + outfile `.mjs`; bundle cjs gãy — đã vá runner ở lần
  chạy 2): **45/45 suite xanh**, gồm test mới 10 luồng:
  P1 17/17, P2 26/26, P3 16/16, P4 33/33, P5 7/7 vi + 7/7 en,
  P6 16/16, P7 7/7, P8 21/21 vi + 21/21 en.
- Hồi quy chạy lại: N4 14/14, O3 13/13, O5 12/12, M2 14/14, M5 21/21,
  N8 8/8, L2 20/20, M4 25/25, M8 7/7, O1 9/9, O4 24/24, N1 11/11,
  saveToast31 15/15, structuredNotes32 12/12, nestedPreview 46,
  nestedRampPreview 34, previewEngine 14, subtitles 14/14, d6 11/11,
  rehydrate 27/27, projectRepo 10/10, GOP M10 28/28 + N10 17/17 +
  L8 23/23 + O6 18/18 + T3 10/10 + I6 25/25, H6 15, ProjectMenu L1 6/6,
  reverse D4 3/3 + B6 8/8 + Z6 10/10 + E2 3/3, errorDetail 35, webglLut 7/7.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của các luồng
  (P1 headed 9/9, P2 headed 5/5, P3 headed 2 lượt, P4 headed 6/6,
  P5 headed 5/5, P6 headed decode 8K, P8 headed 6/6, P9 render FPS) —
  đó là số đo của luồng, đã đối chiếu LIMITS + bằng chứng trên đĩa.
  Ngoại lệ: P9 chạy lại toàn bộ ở bước gộp (xem §3.1).

### 3.1 Chạy lại harness P9 ở bước gộp

Chạy lại toàn bộ `server/render/src/test_round59_p9_enhance_render.js`
trên cây đã gộp (job nền, 142 s): **52 pass, 0 fail, exit 0**.
FPS 720p lượt chạy lại: baseline 53,23; denoise-0.5 14,68; denoise-1.0
17,87; stabilize-30 20,45; deinterlace 48,42; combo cả ba 7,06.
Hướng so sánh khớp lượt chạy của luồng P9 (mọi enhance đều chậm hơn
baseline, combo chậm nhất), nhưng số tuyệt đối lệch nhiều so với lượt P9
(baseline 47,86; denoise 12,05; stabilize 6,82; deinterlace 24,70; combo
3,49) — do tải VM lúc chạy khác nhau (đúng cảnh báo của P9: FPS tuyệt
đối dao động mạnh theo tải, chỉ tỉ lệ/hướng mới ổn định). Khác biệt
output đo lại khớp: flat std 4,439 → 1,986 sau denoise; idet prog
0,000 → 0,993 sau deinterlace; frame diff stabilize-vs-control mean
12,789 (lượt P9: 13,913).

## 4. Tóm tắt từng luồng (số đã kiểm chứng lại)

| Luồng | Việc | Test chạy lại |
|---|---|---|
| P1 | Bin bền qua reload (manifest `binMedia` trong autosave; nút ✕ xóa media có confirm + chặn khi còn clip dùng); toast style lặp: nguyên nhân gốc là clip mẫu/thêm mới thiếu `italic`, sửa tại nguồn | 17/17 + rehydrate 27/27 |
| P2 | Escape đóng TourCard / TemplatePackModal / TemplatePicker (pattern O1) | 26/26 + O1 9/9 |
| P3 | `skippedReasons` nêu tên type + sinh cả khi không layer; lý do skip đường vẽ từng frame ra badge + toast (giữ `console.warn` song song) | 16/16 + O3 13/13 + N4 14/14 |
| P4 | Class chưa định nghĩa: CaptionModal `caption-modal`, SilenceModal `modal-x/label/hint/err`, BeatSyncModal `<p class="error">` → class đã định nghĩa | 33/33 + O4 24/24 + N1 11/11 |
| P5 | Headed nhãn "Subtitles (EN)" + xuất SRT/VTT byte-exact; bug thật: tên project tiếng Việt làm file xuất luôn thành "download" → chuẩn hoá ASCII | 7/7 vi+en + O5 12/12 + M4 25/25 |
| P6 | Stream-mode trial-decode cap 8 → 32 MiB (chunked fetch, ≤64 chunk); rác 12 MiB verdict false thật; sample 9,7 MiB decode-ok ~1,9 s | 16/16 + hồi quy GOP xanh |
| P7 | Kiểm toán i18n hậu-gộp (test-only): dict 1942 khớp; 41 key mồ côi; 26 mẫu tồn đọng (diagnostic, chưa wiring) | 7/7 + M2/M5/N4/N8/L2 xanh |
| P8 | EnhancePanel R2 đã có sẵn — thêm preset 1 chạm + chỉ báo trạng thái (dòng "Đang bật" + badge ✨ timeline); kiểm chứng từng control gốc qua click thật, khớp `validateEnhance` 0 lỗi | 21/21 vi+en |
| P9 | Cả 3 enhance render thật (hqdn3d/yadif/vidstab đúng flag); FPS 720p: baseline 47,86 → denoise 12,05 / stabilize 6,82 / deinterlace 24,70 / combo 3,49 | harness 52/52 (luồng) + chạy lại §3.1 |
| P10 | Gap analysis 160 → 247 dòng + FEATURE_STATUS mục bổ sung 07/11; phát hiện Enhance UI đã có từ R2 (đính chính brief E3) | docs-only, không test |

## 5. Đính chính / lưu ý gộp

- P10 đính chính: hàng "Enhance" trong gap analysis cũ sai — UI đã có từ
  R2; khoảng cách thật là preview chưa áp enhance (render-only). P8/P9
  đã cập nhật LIMITS của mình theo đính chính này.
- P5 đính chính: CaptionModal cao hơn viewport 900px (nút "Start
  generating" bị cắt nửa ở screenshot B3) — chưa sửa, xem §6.
- P4 phát hiện mới: nút text CaptionModal dùng `.tbtn` (nút tròn icon)
  nên chữ tràn/chồng nhau ("Bắt đầu tạo ph…" đè lên "Đóng") — lỗi có sẵn,
  chưa sửa, xem §6.
- P1: bytes media đã xóa khỏi bin vẫn mồ côi trong IndexedDB (không tự
  hiện lại, đúng thiết kế); race debounce 5 s khi replaceProject (xem
  LIMITS P1 §nợ mở).
- P9: FPS tuyệt đối dao động ±30–40% theo tải VM — chỉ tỉ lệ/hướng so
  sánh mới ổn định.
- P3: spec phẳng không qua flatten → `skippedReasons` tầng lib vẫn rỗng
  (đường frame bao cho UI); badge `whiteSpace: nowrap` (nợ cũ J1/O3)
  chưa đo tràn.
- O3 §E + P3 §E + N4 §B nay khóa fallback MỚI nêu tên type (parent đổi
  theo khuyến nghị P3) — không còn khóa chuỗi cũ.

## 6. Nợ mở (cho đợt 60)

1. **P4:** còn 30 class thật chưa định nghĩa ngoài phạm vi (SpeedPanel 12,
   `preview.tsx` 9 badge, Timeline 3, HistoryPanel/MediaBin/ExportPanel/
   TrackPanel 1 mỗi cái, TtsButton 2) + class scoped dùng ngoài tổ tiên
   (`.error`, `.muted`, `.warn`, `.small`, `.dim`).
2. **P4/P5:** nút text CaptionModal dùng `.tbtn` tràn/chồng chữ; modal
   CaptionModal cao hơn viewport 900px (nút "Start generating" bị cắt).
3. **P1:** quyết định thiết kế — media import rồi xóa khỏi bin thì bytes
   IDB mồ côi có dọn không; race debounce 5 s khi replaceProject.
4. **P7:** 41 key mồ côi (28 key `projectRepo.*` chết thật — nối thật hay
   xóa); 26 key fragment diagnostic GOP chờ wiring (không gộp đợt này).
5. **P3:** `skippedReasons` tầng lib vẫn rỗng với spec phẳng (muốn đủ 100%
   phải bỏ early-return, vỡ khóa O3 §B'); decoder tụt thì helper frame
   vẫn liệt kê effect.
6. **P6:** keyframe thật ≳16 MiB vẫn timeout → fail-open (trần 2500 ms);
   sample >32 MiB vẫn bỏ qua; T3 vẫn fetch remainder cả khi probe null;
   chưa đo Safari/Firefox; keyframe đục lỗ giữa vẫn decode OK (nợ O6).
7. **P5:** đường dịch whisper qua bridge chưa chạy headed (media mẫu
   không có lời thoại); các helper tải file khác chưa kiểm chứng headed
   có mất tên như SRT/VTT không; false-positive track tên trùng tiền tố
   (giới hạn D6).
8. **P2:** Escape khi focus trong input/select của form Picker + khi
   PackModal đang busy chưa đo headed (chỉ lập luận parity); Escape bước 2
   TemplatePicker về gallery (nếu muốn đóng hẳn thì sửa 1 nhánh `if`).
9. **P8/P9:** preview chưa áp enhance (render-only) — khoảng cách thật
   còn lại của E3; preset không chặn stabilize khi có speedKeyframes
   (chỉ cảnh báo); chưa đo render MP4 cho đúng combo preset; chưa đo FPS
   stabilize/deinterlace lặp lại, enhance ở 1080p.
10. **P10:** ma trận FEATURE_STATUS vẫn mốc 19/10 (nhiều hàng lỗi thời từ
    trước đợt 56); hàng Benchmark trong gap analysis còn số TTS cũ
    (~0,44x) so với đính chính 06/11 (0,12–0,75×); số lượng kho chưa đếm
    lại sau đợt 58.
11. **Nợ cũ chưa đụng:** N6 hoán đổi delta stts vẫn lọt (quyết định giữ
    nguyên); N5 bản dịch EN template chưa qua người bản ngữ; Node
    type-stripping vẫn không chạy được suite webglLut (cần
    `allowImportingTsExtensions` hoặc vitest); `ci-security.yml` 403 chưa
    lên GitHub (repo vẫn không có CI chạy thật).

## 7. Stage (KHÔNG push)

Batch closing: `~/workspace/repo-1-push/paths-loop/phase9-round59-closing.txt`
(NUL-delimited, verify read-back, 16 entry): dict đã gộp (vi.json,
en.json); fragment N4 đã cập nhật giá trị mới; 12 file test parent đã sửa
khi gộp mà chưa nằm trong batch luồng nào (N4, nestedPreview.test.ts,
ProjectMenu, saveToast31, structuredNotes32, reverseToggle/Badge/Compat/
Playback, L2, M5, errorDetail); LIMITS tổng hợp này. (5 file parent cũng sửa nhưng đã nằm trong
batch luồng — nestedPreview.ts, P3 test, P7 test, P8 test, O3 test §E —
không đếm lại ở closing; nội dung cuối của chúng đi theo batch luồng.)

Tổng chờ push: **732 entry** = 656 (sau đợt 58) + 60 (đợt 59, 10 batch)
+ 16 (closing; `tsconfig.json` đếm 5 lần trong các batch luồng). Các đợt
1–50 đã push xong (HEAD e2cb35e1). Tổng file duy nhất đợt 59: 71 file
(55 batch luồng + 15 parent-only + 1 LIMITS tổng hợp).

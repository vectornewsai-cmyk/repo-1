# PHASE9_ROUND56_M3_I18N_WIRING_LIMITS.md — Đợt 56, luồng M3: nối key i18n cho 6 panel

Ngày: 2026-11-07. Luồng M3 — chỉ 6 file, không đụng file luồng khác.
Nguồn key: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l2-keys.json`
(514 proposal đợt 55 L2). Không sửa `vi.json`/`en.json` trực tiếp (nhiều luồng
song song) — key nằm trong fragment riêng
`apps/web/src/i18n/fragments/round56-m3.json`, parent merge cuối đợt.

## Đã nối: 84 key (83 proposal L2 + 1 key thêm)

| File | Key đã nối | Ghi chú |
|---|---|---|
| `components/project/HistoryPanel.tsx` | 23 `history.*` | `history.note` gộp 2 fragment JSX thành 1 key; `history.restored` giữ `{label}` = `" (nhãn)"` khi có nhãn |
| `components/TemplatePicker.tsx` | 15 `templatePicker.*` | gồm `aspect169` thêm mới (xem dưới); `KIND_LABEL` đổi thành hàm `kindLabel()` vì module const không gọi được `t()` theo ngôn ngữ hiện tại; biến map gallery đổi `t` → `item` vì `t` bị shadow bởi import i18n (lỗi tsc đã sửa) |
| `components/onboarding/TemplatePackModal.tsx` | 3 `templatePack.*` + 3 `templatePicker.aspect*` dùng chung | `aspectLabel` dùng chung key với TemplatePicker |
| `components/enhance/EnhancePanel.tsx` | 16 `enhance.*` | |
| `components/PerfOverlay.tsx` | 12 `perf.*` | mới thêm `import { t, useLang }` + `useLang()` (trước đó file chưa nối i18n) |
| `components/RelinkPanel.tsx` | 15 `relink.*` | |

Tổng: 83/83 proposal có site trong 6 file đã nối (0 site bỏ qua — không có
proposal nào trong 6 file này mang note "cần xác minh theo source" và mọi
literal đều khớp source từng chữ sau khi normalize whitespace).

## Lệch khỏi proposal L2 (có chủ ý, theo chỉ đạo đợt 56)

1. **`templatePicker.title` — đếm động, không hardcode 10.** Proposal ghi
   `"🎬 Mẫu video (10 mẫu)"`; task đợt 56 yêu cầu sửa nợ "title hardcode số
   lượng mẫu". Fragment ghi `"🎬 Mẫu video ({n} mẫu)"` / `"🎬 Video templates
   ({n} templates)"`, code truyền `TEMPLATES.length`. **Số đo thật:
   `TEMPLATES.length = 50`**, không phải 10 — title cũ sai ngay cả trước đợt
   này. Render-test khóa `(50 templates)` / `(50 mẫu)`.
2. **`templatePack.ttsAdded` — thêm `{suffix}`.** Proposal ghi
   `"✅ Đã thêm giọng đọc vào timeline."` nhưng source thật có hậu tố điều kiện
   ` (dur.toFixed(1)}s)` khi `dur > 0`. Fragment ghi
   `"✅ Đã thêm giọng đọc{suffix} vào timeline."` để giữ nguyên hành vi;
   code truyền `suffix = dur > 0 ? " (Xs)" : ""`.
3. **`templatePicker.aspect169` — key thêm, không có trong JSON L2.**
   `"16:9 ngang"` là anh em cùng hàm `aspectLabel` với `aspect916`/`aspect11`
   (đã có proposal) trong cả 2 file của luồng này, nhưng L2 sót không đề xuất
   (tìm toàn JSON không có chuỗi "16:9 ngang"). Thêm key để không để 1 nhánh
   của cùng hàm còn hardcode. EN: `"16:9 landscape"` (theo mẫu `aspect916` →
   `"9:16 portrait"`).

## Mất định dạng khi gộp fragment (chấp nhận, ghi rõ)

Gộp nhiều fragment JSX / `<b>` / `<code>` thành 1 key nên các điểm sau mất
in đậm / in mono so với trước (nội dung chữ giữ nguyên từng chữ):

- `TemplatePicker.confirmNew`: tên template không còn `<b>`.
- `EnhancePanel.selectClip`: từ "video" không còn `<b>`.
- `EnhancePanel.videoOnly`: đường dẫn `ENHANCE_LIMITS.md` không còn `<code>`.
- `EnhancePanel.renderOnly`: từ "render" không còn `<b>`.
- `EnhancePanel.heavyWarning`: "mask" và "tăng cường nặng" không còn `<b>`.
  Các số đo trong cảnh báo (17.6 fps, 60s ~100s, 1080p ~3×) là text cố định
  trong key như proposal ghi — nếu số đo đổi phải sửa key.

## Literal VI còn sót trong 6 file: 0 literal UI

Quét ký tự tiếng Việt sau sửa chỉ còn:

- Comment code (`// re-render khi đổi ngôn ngữ`, `// replaceProject đặt
  playing=false nên toggle = phát`, `/* bridge chưa chạy → ... */`) — không
  phải UI, giữ nguyên theo thông lệ.
- `"Hải Đăng"` (TemplatePackModal.tsx:94) — tên riêng giọng TTS, L2 ghi rõ
  trong `notProposed`/`uncovered` là giữ nguyên mọi ngôn ngữ.
- `"🎞 Video"`, `"🎵 Audio"` (TemplatePicker `kindLabel`) — giống hệt ở en,
  không cần key.
- `"📈 FPS preview"`, `"📈 FPS"` (PerfOverlay) — nhãn trung tính, không có
  proposal.
- `meta.label` (RelinkPanel, từ `RELINK_KIND_META` trong `lib/relink.ts`:
  `"Âm thanh"`/`"Ảnh"`) — literal nằm ở **file lib, ngoài phạm vi luồng
  này**; L2 cũng không đề xuất key cho chúng. Cần luồng khác nối ở lib.
- `"📦 Trong nested: "` (RelinkPanel) — không có proposal L2; còn hardcode.
- `"❌ "` + message lỗi động (TemplatePackModal catch) — prefix ký hiệu +
  message từ bridge, không có proposal.
- `fmtTime()` (HistoryPanel) dùng locale `vi-VN` cố định cho ngày/giờ —
  định dạng ngày chưa theo ngôn ngữ (ngoài phạm vi đợt này).

## Kiểm chứng (số thật, chạy 2026-11-07 ~12:5x +07)

- **Test mới** `apps/web/src/lib/i18nAudit56M3.test.ts` — bundle esbuild
  `--format=cjs` rồi chạy node (mẫu L2):
  `./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M3.test.ts --bundle
  --platform=node --format=cjs --outfile=/tmp/round56-m3/m3.test.cjs &&
  node /tmp/round56-m3/m3.test.cjs`
  → **13/13 pass** (2 fragment + 5 render EN/VI + 6 source).
- **Test L2 cũ** `i18nAudit55L2.test.ts` chạy lại sau sửa đổi → **20/20 pass**
  (không hồi quy).
- **`tsc --noEmit` trong `apps/web`** → còn **2 lỗi, đều ở
  `components/Toasts.tsx` (không phải file của M3)** — một luồng round-56
  khác đang sửa file đó dở (cùng mẫu shadowing `t` như TemplatePicker trước
  khi M3 sửa: `toasts.map((t) => ...)` che import `t`, mtime 05:44 UTC,
  M3 không đụng vào). 6 file + test của M3 sạch tsc. **Cần chạy lại tsc sau
  khi luồng kia sửa xong Toasts.tsx.**
- **`vite build`** → pass (`✓ built in 32.57s`; chỉ warning chunk >500kB
  có sẵn từ trước).

## Giới hạn đo / nợ

- **Render-test chạy ở chế độ pre-merge.** Key M3 chưa có trong `vi.json`/
  `en.json` nên `t()` fallback về chính key khi render. Test chấp nhận cả
  chuỗi dịch thật lẫn key fallback, và khóa chặt "không còn literal VI cũ".
  **Sau khi parent merge fragment, PHẢI chạy lại test này** — lúc đó các
  chuỗi EN/VI thật phải hiện (không còn fallback key).
- **HistoryPanel không render-test được** (cần IndexedDB thật); **EnhancePanel
  không render-test được** (cần selection trỏ clip thật; zustand
  `getServerSnapshot` không đổi state lúc SSR — cùng giới hạn L2 ghi);
  **TemplatePackModal** chỉ hiện chuỗi bridge khi bridge lỗi. 3 file này chỉ
  khóa ở mức source + fragment. Cần click-test trên browser thật để phủ các
  nhánh này.
- **Nhánh SSR không đo được:** không có — test chạy trên Node bằng
  `renderToStaticMarkup` như mẫu L2; giới hạn duy nhất là 3 file nêu trên.
- Fragment `round56-m3.json` (84 key) **chưa merge** — cho tới khi parent
  merge, UI của 6 file này ở chế độ EN sẽ hiện key thay vì chuỗi dịch
  (fallback của `t()`). Đây là trạng thái trung gian có chủ ý của đợt 56,
  không phải lỗi code.

# Phase 9 Round 55 — L1: I18n hoá ProjectMenu + nút "Bắt đầu" ở TopBar (LIMITS)

Luồng L1 đóng bug M19 của đợt 54 K3: chuyển ngôn ngữ sang EN nhưng nhóm
nút project (Mới/Mở/Lưu/Lưu thành…/Xuất bản nén/Nhập bản nén/Lịch sử/
Chưa lưu) + nút "👋 Bắt đầu" vẫn tiếng Việt, vì `ProjectMenu.tsx` dùng
literal tiếng Việt cứng + không `useLang()`, `TopBar.tsx` dòng "👋 Bắt
đầu" cũng là literal. Repo local `~/workspace/repo-1`, branch main.
KHÔNG push, KHÔNG release/tag.

## 0. Kết luận ngắn

- **Bug M19 đã sửa ở tầng code + test Node + test headed (xem §4–5).**
  Mọi literal VI trong `ProjectMenu.tsx` và `TopBar.tsx` đã chuyển sang
  key `t()` (24 key mới, vi == en = 1011 key mỗi bên, 0 key mồ côi).
- Test unit mới `ProjectMenu.i18n55L1.test.ts`: **6/6 pass** (đỏ-trước
  1/6 — xem §2.2), render thật 2 component ở cả 2 ngôn ngữ bằng
  react-dom/server trên Node.
- Đo headed trên vite dev + Chromium thật (Xvfb :154): **5/5 pass**
  (lượt 3; 2 lượt trước là lỗi harness, đã sửa — xem §4).
- `tsc` apps/web: **0 lỗi**; `vite build`: **pass** (39.80 s, bundle
  `index-CLpJgBjW.js`).
- 5 test liên quan đã cập nhật snapshot 987 → 1011 đều xanh (§4.3).

## 1. Đã sửa gì

### 1.1 Key mới (24 key: 21 `projectMenu.*` + 3 `topbar.*`)

`apps/web/src/i18n/vi.json` + `en.json` (cùng cấu trúc, flatten 1011
mỗi bên, parity kiểm bằng script đếm key trong test L1):

| Key | vi | en |
|---|---|---|
| `projectMenu.new` | 🆕 Mới | 🆕 New |
| `projectMenu.newHint` | Tạo dự án mới | Create a new project |
| `projectMenu.open` | 📂 Mở | 📂 Open |
| `projectMenu.openHint` | Mở file dự án (.vcut.json) | Open a project file (.vcut.json) |
| `projectMenu.save` | 💾 Lưu | 💾 Save |
| `projectMenu.saveHint` | Lưu thành file (Ctrl+S) | Save to file (Ctrl+S) |
| `projectMenu.saveAs` | 💾 Lưu thành… | 💾 Save as… |
| `projectMenu.saveAsHint` | Lưu thành tên khác | Save under a different name |
| `projectMenu.exportArchive` | 📦 Xuất bản nén | 📦 Export archive |
| `projectMenu.exportArchiveHint` | Xuất project + media thành 1 file nén (.vcut.zip) — mang đi máy khác | Export the project + media as a single archive (.vcut.zip) — take it to another machine |
| `projectMenu.importArchive` | 📥 Nhập bản nén | 📥 Import archive |
| `projectMenu.importArchiveHint` | Nhập file bản nén (.vcut.zip) — khôi phục project + media | Import an archive file (.vcut.zip) — restore the project + media |
| `projectMenu.history` | 🕘 Lịch sử | 🕘 History |
| `projectMenu.historyHint` | Lịch sử phiên bản project (lưu local, chưa đồng bộ cloud) | Project version history (stored locally, not synced to the cloud) |
| `projectMenu.unsavedChangesHint` | Có thay đổi chưa được lưu thành file (.vcut.json) | There are changes not yet saved to a file (.vcut.json) |
| `projectMenu.allSavedHint` | Mọi thay đổi đã được lưu | All changes have been saved |
| `projectMenu.unsaved` | ● Chưa lưu | ● Unsaved |
| `projectMenu.autosaveAt` | ✓ Autosave {time} | ✓ Autosaved {time} |
| `projectMenu.saved` | ✓ Đã lưu | ✓ Saved |
| `projectMenu.saveAsPrompt` | Tên dự án | Project name |
| `projectMenu.untitledProject` | Dự án không tên | Untitled project |
| `topbar.welcome` | 👋 Bắt đầu | 👋 Get started |
| `topbar.welcomeHint` | Mở lại màn chào / tour / template pack 1 chạm | Reopen the welcome screen / tour / template pack in one tap |
| `topbar.welcomeLabel` | Mở lại màn chào | Reopen the welcome screen |

Lưu ý dịch: `historyHint` giữ đúng chủ trương local-first ("lưu local,
chưa đồng bộ cloud" — không đổi nghĩa thành cloud). `autosaveAt` giữ
placeholder `{time}` cả 2 bên. Chuỗi VI giữ nguyên từng chữ so với
literal cũ (kể cả "✓ Autosave {time}") để không đổi hành vi ở chế độ VI.

### 1.2 `apps/web/src/components/project/ProjectMenu.tsx`

- Thêm `useLang()` đầu component — trước đây không subscribe nên không
  re-render khi `setLang()` (một nửa nguyên nhân M19; nửa còn lại là
  literal cứng).
- Toàn bộ 7 nút + title: `t("projectMenu.new|open|save|saveAs|exportArchive|importArchive|history")`
  và `t("projectMenu.*Hint")`.
- Chỉ báo autosave: title + 3 trạng thái qua `t("projectMenu.unsavedChangesHint|allSavedHint|unsaved|autosaveAt|saved")`.
  Giờ hiển thị theo locale thật: `toLocaleTimeString(getLang() === "vi" ? "vi-VN" : "en-US")`
  thay cho `"vi-VN"` cứng trước đây.
- `window.prompt` ở Lưu thành…: `t("projectMenu.saveAsPrompt")` +
  fallback `t("projectMenu.untitledProject")` thay cho `"Tên dự án"` /
  `"Dự án không tên"` cứng.
- Không đổi logic nào khác (flow mở/lưu/export/import/history giữ nguyên).

### 1.3 `apps/web/src/TopBar.tsx`

- Nút "Bắt đầu": title/aria-label/label qua `t("topbar.welcomeHint|welcomeLabel|welcome")`.
  Không đổi gì khác trong file (mọi nút còn lại đã dùng `t()` từ trước).

### 1.4 Cập nhật snapshot key-count ở 4 test cũ (bắt buộc — không thì đỏ)

4 test khóa tổng số key flatten 987 đã cập nhật lên **1011** (987 + 24
key L1), kèm comment ghi nguồn: `reverseToggleI18n48D4.test.ts`,
`reverseBadge46B6.test.ts`, `saveToast31.test.ts`,
`structuredNotes32.test.ts`; comment ở `errorDetail34Q4.test.ts` cũng
cập nhật. Đây là file chung nhưng L1 là luồng DUY NHẤT được sửa
vi.json/en.json trong đợt 55 nên việc cập nhật snapshot thuộc về L1.
Nếu luồng khác cùng đợt cũng thêm key thì parent gộp lại số này — parity
(bằng nhau + đủ key mới) mới là khóa cứng, như comment sẵn có trong các
test đó.

## 2. Kiểm chứng

### 2.1 Test unit mới — `ProjectMenu.i18n55L1.test.ts` (6/6 pass)

Chạy bằng esbuild bundle (mẫu D4/B6), **bắt buộc `--format=cjs`** vì
`react-dom/server` dùng require động (bundle esm lỗi "Dynamic require
of stream is not supported"):

```bash
./node_modules/.bin/esbuild apps/web/src/components/project/ProjectMenu.i18n55L1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round55-l1/l1.test.cjs \
  && node /tmp/round55-l1/l1.test.cjs
```

Test RENDER THẬT 2 component bằng `react-dom/server` trên Node (không
jsdom, không browser): `setLang("en")` rồi `renderToStaticMarkup`,
assert không còn 20 literal VI của M19 và đủ 11 chuỗi EN; `setLang("vi")`
assert đủ chuỗi VI và không lẫn chuỗi EN. Đồng thời khóa parity vi/en
toàn file (1011 key) + nội dung đúng từng chữ của 24 key mới + source 2
file gọi đủ `t()` và không còn literal cũ.

### 2.2 Đỏ-trước (ghi rõ)

Chạy test mới TRƯỚC khi sửa code (chỉ có file test là mới): **1/6 pass**.
5 case đỏ, trong đó case lõi tái hiện đúng bug M19:
`render EN: … EN vẫn còn literal VI: "🆕 Mới"`. Log đầy đủ:
`hidden_files/round55-l1/test-red-before.log`. (Lần chạy esm đầu còn
lỗi bundle "Dynamic require of stream" — đã đổi sang cjs, xem §2.1.)

### 2.3 Xanh-sau + tsc + build + snapshot cũ

- Test L1 sau khi sửa: **6/6 pass**
  (`hidden_files/round55-l1/test-green.log`).
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `npm run build` (apps/web): **pass**, 39.80 s, `dist/assets/index-CLpJgBjW.js`
  1,176.73 kB (gzip 354.12 kB). Cảnh báo chunk > 500 kB có từ trước,
  không phải do L1.
- 5 test liên quan sau khi cập nhật snapshot 987 → 1011:
  `reverseToggleI18n48D4` 3/3, `reverseBadge46B6` 8/8, `saveToast31`
  15 pass 0 fail, `structuredNotes32` 12 pass 0 fail, `errorDetail34Q4`
  35 pass 0 fail — log `hidden_files/round55-l1/test-snapshots.log`.

## 3. Rà soát literal còn sót

Quét 2 file bằng regex ký tự tiếng Việt trên phần code (bỏ comment):
`ProjectMenu.tsx` **0 dòng** còn tiếng Việt ngoài comment;
`TopBar.tsx` chỉ còn comment JSX (K4 đợt 27, C5 đợt 47, D1 đợt 4 —
không render). `aria-label="transport"` trong TopBar vốn đã là tiếng
Anh, giữ nguyên.

## 4. Đo headed (vite dev + Chromium headed, Xvfb :154)

Script: `apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs`
(mẫu H6/I2: vite dev + CDP WebSocket, Node thuần; display RIÊNG :154,
userdata riêng `hidden_files/round55-l1/headed/chrome-userdata`,
TMPDIR riêng `/tmp/round55-l1/tmp`).

Script: `apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs`
(mẫu H6/I2: vite dev + CDP WebSocket, Node thuần; display RIÊNG :154,
userdata riêng `hidden_files/round55-l1/headed/chrome-userdata`,
TMPDIR riêng `/tmp/round55-l1/tmp`).

- **Lượt 1 (02:52–02:55 UTC): harness lỗi, không kết luận được.**
  H0 VI pass, nhưng H1 timeout 120 s chờ "Get started". Nguyên nhân là
  lỗi harness, KHÔNG phải bug sản phẩm: script chờ mount bằng
  `topbarText.includes("VCut Studio")` nhưng splash `.splash` (App
  `!ready`) phủ toàn màn hình và chặn mọi click — ảnh
  `headed/l1-topbar-vi.png` lượt 1 vẫn là màn splash "Đang mở dự án…"
  dù DOM topbar đã có chữ VI. Đã sửa harness: chờ `.splash` biến mất
  mới đo/click + hit-test `elementFromPoint` trước mỗi click thật.
  Log: `headed-run.log` (exit 2).
- **Lượt 2 (02:58–02:59 UTC): 4/5 pass.** H0, H2, H3, H4 pass; H1 FAIL
  giả — "thiếu EN: Reopen the welcome screen": chuỗi đó chỉ nằm ở
  title/aria-label của nút Bắt đầu, không có trong `innerText` nên
  assert trên innerText sai chỗ. Sản phẩm đã đúng (topbar EN hiện đủ
  "Get started" + menu EN). Đã sửa harness: đo title/aria-label riêng
  qua attribute. Log: `headed-run2.log` (exit 1). Socket X `/tmp/.X11-unix/X154`
  còn sót sau lượt 1 (Xvfb đã chết) cũng được dọn trong harness (kiểm
  tra process thật trước khi unlink — không đụng display của luồng khác:
  lúc đó :151/:155/:157 đang có Xvfb khác chạy).
- **Lượt 3 (02:59–03:00 UTC): 5/5 pass** (`headed-run3.log`, exit 0;
  report `headed/l1-headed-report.json`):
  - H0 VI mặc định: đủ chuỗi VI (Mới/Mở/Lưu/Lưu thành…/Xuất bản nén/
    Nhập bản nén/Lịch sử/✓ Đã lưu).
  - H1 click thật nút ngôn ngữ → EN: hết literal VI (20 chuỗi cấm đều
    vắng trong `header.topbar`), đủ chuỗi EN (New/Open/Save/Save as…/
    Export archive/Import archive/History/Get started/✓ Saved) +
    title/aria-label nút Bắt đầu = "Reopen the welcome screen…".
  - H2 dirty ở EN (đổi tên qua store thật): chỉ báo "● Unsaved",
    title "There are changes not yet saved to a file (.vcut.json)" —
    nhánh dirty mà test SSR Node không đo được (§5).
  - H3 click về VI: đủ chuỗi VI + dirty "● Chưa lưu".
  - H4: 0 lỗi trang trong phiên (không window.onerror/unhandledrejection).
  - Ảnh: `headed/l1-topbar-vi.png`, `l1-topbar-en.png` (xác nhận trực
    quan: toàn bộ TopBar + ProjectMenu đã EN), `l1-topbar-en-dirty.png`.
  - Lưu ý: ảnh EN vẫn thấy MediaBin/Inspector/caption còn tiếng Việt —
    ngoài phạm vi L1 (chỉ ProjectMenu + TopBar); tên project mẫu
    "Dự án mẫu" là dữ liệu project, không phải literal UI.

## 5. Hạn chế / nợ mở

- **Nhánh dirty không đo được bằng render SSR trên Node:** `renderToStaticMarkup`
  dùng `getServerSnapshot` của zustand nên luôn thấy state lúc khởi tạo
  (sạch) — đã chứng minh bằng probe riêng: sau `setProjectName("L1 dirty probe")`
  thì `isDirty(spec) === true` nhưng HTML render vẫn là "✓ Đã lưu".
  Đây là giới hạn của test SSR, KHÔNG phải bug sản phẩm (trên browser
  `useSyncExternalStore` subscribe và re-render với state live). Nhánh
  dirty được khóa bằng key-content test (đúng từng chữ cả 2 ngôn ngữ) +
  source test (gọi `t("projectMenu.unsaved")`), và đo headed H2 (xem §4).
- **Chưa đo lại M19 trên AppImage Electron:** L1 chỉ đo trên vite dev
  (web). Menu native → IPC `vcut:language-changed` → renderer đã PASS
  ở K3; sau khi đợt 55 push + rebuild AppImage thì M19 cần đo lại trên
  bản build mới (như K3 đã ghi).
- **Tên project mặc định "Dự án mới" là dữ liệu user, không phải literal
  UI:** ở chế độ EN ô tên project vẫn hiện "Dự án mới" cho project chưa
  đổi tên — đúng hành vi (tên do user đặt), không nằm trong phạm vi M19.
  Tương tự, modal chào/tour và các panel khác vẫn còn literal VI (xem
  `i18n/README.md` — ngoài phạm vi L1, chỉ ProjectMenu + TopBar).
- `window.prompt` ở Lưu thành… vẫn là prompt hệ thống (đã i18n hoá chuỗi,
  nhưng UX prompt không đổi — RenameProjectDialog là đường khác, không
  thuộc L1).

## 6. File đã chạm (trong batch này)

- `apps/web/src/i18n/vi.json` (+24 key)
- `apps/web/src/i18n/en.json` (+24 key)
- `apps/web/src/components/project/ProjectMenu.tsx` (useLang + t() toàn bộ literal)
- `apps/web/src/TopBar.tsx` (nút Bắt đầu → t())
- `apps/web/src/components/project/ProjectMenu.i18n55L1.test.ts` (mới — test 6 case)
- `apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs` (mới — harness headed)
- `apps/web/src/lib/reverseToggleI18n48D4.test.ts` (snapshot 987 → 1011)
- `apps/web/src/lib/reverseBadge46B6.test.ts` (snapshot 987 → 1011)
- `apps/web/src/lib/saveToast31.test.ts` (snapshot 987 → 1011)
- `apps/web/src/lib/structuredNotes32.test.ts` (snapshot 987 → 1011)
- `apps/web/src/lib/errorDetail34Q4.test.ts` (comment 987 → 1011)
- `docs/PHASE9_ROUND55_L1_I18N_PROJECTMENU_TOPBAR_LIMITS.md` (mới — file này)

Bằng chứng (không stage): `hidden_files/round55-l1/` — `test-red-before.log`,
`test-green.log`, `test-snapshots.log`, `headed-run.log`,
`headed/l1-headed-report.json`, `headed/l1-topbar-vi.png`,
`headed/l1-topbar-en.png`, `headed/l1-topbar-en-dirty.png`.

## 7. Chạy lại

```bash
# Test unit L1 (6 case)
./node_modules/.bin/esbuild apps/web/src/components/project/ProjectMenu.i18n55L1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round55-l1/l1.test.cjs \
  && node /tmp/round55-l1/l1.test.cjs
# tsc + build
./node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json
npm run build --workspace=apps/web
# Đo headed (display riêng :154)
node apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs
```

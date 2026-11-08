# PHASE 9 — Đợt 55 — Luồng L4: Rebuild AppImage với fix K1/K2/K4 đợt 54 + đo lại P7 argv/Recent/D4c + menu M19–M26 (LIMITS)

Ngày: 2026-11-07. Luồng L4, đợt 55 (lượt cron 09:35 +07).
Repo local `~/workspace/repo-1` (KHÔNG phải git repo).
**KHÔNG push, KHÔNG release/tag, KHÔNG code giả.**
Đóng nợ K1 §6 đợt 54: cần rebuild để đo lại P7 argv/Recent/D4c.

## 0. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| AppImage mới (build riêng, không đè `release/`) | sha `bff19724e8dd988d…`, 576.688.069 byte, build 02:59 UTC 07/11 |
| Bản cũ `release/` | sha `2a15ea90c61e86ff…`, 576.688.128 byte, 22:12 UTC 06/11 — **không đụng tới** |
| Web bundle trong bản mới | `index-CkcceBnb.js`, sha `5bea3fdd454414c8…` |
| P7 argv `.vcut` | **PASS 2/2 lượt** — tên "H9 Doubleclick" đúng (K1 đã vào build) |
| P7 Recent | **PASS 2/2 lượt** — submenu + click entry, tên đúng, 3 clip |
| D4c second-instance | **PASS 2/2 lượt** — instance 2 exit 0, instance 1 exit 0, tên "H9 Second", **không còn dialog discard-confirm** (K2) |
| D4a/D4b/D4d/D4e | **exit 0 cả 4** (lượt 2: 7/7; lượt 1: exit 0 nhưng pgrep leftover thoáng qua — xem §4) |
| Menu M19–M26 | Lượt 1: **43/45** (chỉ M19 i18n + M26 thu nhỏ fail); lượt 2: **42/45** (thêm M22 flake 1 lần); rerun P5: **20/20** |
| M19 Ngôn ngữ | **FAIL như kỳ vọng — build này CHƯA chứa fix i18n L1** (xem §5, chứng minh bằng bundle) |
| M26 Thu nhỏ | FAIL 2/2 — giới hạn Xvfb không WM (như K3) |
| Diag | **12/12** |
| `tsc --noEmit` apps/desktop | **0 lỗi**; K1 unit test **7/7** |

## 1. Bản build mới (ghi rõ — đây là điểm chính của luồng)

### 1.1 Cách build — output riêng, không đè `release/`

- `npm run build --workspace=@repo-1/web` (tsc + vite): **pass**,
  `dist/assets/index-CkcceBnb.js` 1.172.370 byte.
- `npm run build --workspace=@repo-1/desktop` (tsc + copy-services-js):
  **pass**, `dist/main.js` sha `47ee4bf62a129086…` (= đúng dist của K4),
  `dist/preload.js` sha `1d431346e7291f81…` (= đúng dist của K4).
- `npm run prepackage`: OK (icon + copy-web-dist + bundled-server 1.678,9 MiB).
- `electron-builder --linux AppImage` với **config file tạm**
  `apps/desktop/electron-builder-r55l4.json` (copy toàn bộ key `build`
  từ `package.json`, chỉ đổi `directories.output` →
  `release-round55-l4`): **EXIT 0**, 02:45 → 02:59 UTC (~14 phút).
  File config tạm đã **xóa** sau build (không để lại trong cây).
- Lưu ý: `-c '{"directories":...}'` (JSON inline) **không dùng được** —
  electron-builder 26.18.0 hiểu `-c` là đường dẫn file
  (`ENOENT ... open '{...}'`); phải dùng file config thật.
- `release/` cũ **không bị đè**: sau build, `release/*.AppImage` vẫn
  sha `2a15ea90…`, mtime 22:12 UTC 06/11. Các luồng khác đang test bản
  cũ qua `release/` không bị ảnh hưởng.
- Snapshot source lúc build (sha256, xem
  `hidden_files/round55-l4/build-snapshot.txt`):
  `projectRepo.ts 7e8f4410…` (K1), `store.ts 1fc3cef7…` (K2),
  `main.ts 944b412a…` (K4), `preload.ts 5c8941ab…` (K4).

### 1.2 Verify bundle trong bản mới

- `release-round55-l4/linux-unpacked/resources/app.asar` (3.569.104 byte)
  chứa chuỗi `index-CkcceBnb.js`, `file project trong argv` (×2, log argv
  của K4), `did-stop-loading` (flush của K4).
- Web bundle sha `5bea3fdd454414c8bbd6f99c2556183ab7d4098da9a6db3fabc78d6929ca8f5c`
  — **trùng** bundle `dist-web` lúc 01:17 UTC (đã chứa K1+K2), khác bundle
  `index-CcjxMH90.js` của bản cũ 22:12.
- Chưa verify bằng cách giải nén AppImage rồi đọc asar (linux-unpacked
  là đúng cây electron-builder vừa đóng gói thành AppImage nên đủ tin;
  xem §7).

### 1.3 Fix nào có / không có trong bản build này

- **CÓ:** K1 (`parseProjectText` đọc `meta.name` — chứng minh headed
  ở §2), K2 (`loadSample` gọi `markSaved` — chứng minh ở §3: không còn
  dialog discard-confirm trong D4c/D4d), K4 (`main.ts` log argv + flush
  ở `did-stop-loading` — asar chứa cả hai chuỗi).
- **KHÔNG CÓ:** fix i18n L1 đợt 55 (ProjectMenu + TopBar "Bắt đầu").
  Bằng chứng: 24 key mới của L1 (`projectMenu.new`, `projectMenu.saveAs`,
  `projectMenu.unsaved`, `topbar.welcome`, …) có **0 hit** trong bundle
  `index-CkcceBnb.js` của bản build; `ProjectMenu.tsx` lúc build vẫn là
  bản literal cũ (sha snapshot `465cc628…`, còn `🆕 Mới` cứng).
  L1 hạ cánh vào cây lúc 02:44:19 UTC (mtime `ProjectMenu.tsx`/
  `TopBar.tsx`), đúng lúc build web đang chạy — vite đã đọc source
  trước đó nên bundle giữ nguyên hash cũ (trùng bundle 01:17 UTC).
  M19 fail trên bản này là **đúng kỳ vọng**, không phải regression.
  M19 sau fix L1 vẫn cần một lượt rebuild + đo lại riêng (nợ mở, §6).

## 2. P7 argv / Recent — đo lại trên bản mới (đóng nợ K1 §6)

Harness `apps/desktop/scripts/probe-menu-54k3.mjs` (đã vá tối thiểu, xem
§6), display **:152** riêng, CDP 9243, userdata `/tmp/h9-r55l4-userdata`,
TMPDIR `~/.tmp-h9-k3/d152` (riêng theo display, theo bài học K2).
Fixture `H9-Fixture.vcut` / `H9-SecondInstance.vcut` (hidden_files/h9/fixtures).

| Case | Lượt 1 (43/45) | Lượt 2 (42/45) |
|---|---|---|
| P7 argv: file load (currentPath + 3 clip) | PASS | PASS |
| P7 argv: tên project | **PASS — "H9 Doubleclick"** | **PASS — "H9 Doubleclick"** |
| P7 Recent: submenu mở | PASS | PASS |
| P7 click entry Recent: onOpenFile 0→1 + tên đúng | **PASS** | **PASS** |
| P7 sau click Recent: 3 clip load lại | PASS | PASS |

- So với K3 (bản cũ): P7 tên **FAIL → PASS cả argv lẫn Recent**.
  Đây là đo headed đầu tiên xác nhận fix K1 hoạt động end-to-end
  (trước đó K1 chỉ có unit test 7/7 + hồi quy).
- Lưu ý: detail của case tên P7 trong probe vẫn ghi chú cũ kiểu
  "bản build này chứa bug loadProject pre-K1" ở lượt 1 — là chuỗi
  tĩnh lỗi thời trong probe, đã sửa ở lượt sau (§6); verdict PASS
  là đúng (tên đo được "H9 Doubleclick").

## 3. D4 exit code — đo lại trên bản mới

Harness `apps/desktop/scripts/click-test-menu.mjs --only d4` (đã vá tối
thiểu, xem §6), display **:152** riêng, CDP 9252, TMPDIR
`~/.tmp-h9/d152` (instance 2 dùng `d152/second` riêng).

### 3.1 Lượt 1 (chưa vá harness): 3 passed / 4 failed

| Case | Kết quả | Exit code đo được |
|---|---|---|
| PRE AppImage == release/ | FAIL (guard artifact — xem §6) | test sha `bff19724…` ≠ release `2a15ea90…` |
| D4a Thoát qua menu | FAIL (chỉ do pgrep leftover) | **0**, click true |
| D4b Đóng cửa sổ | FAIL (chỉ do pgrep leftover) | **0**, click true |
| D4c Double-click `.vcut` | **PASS** | instance 2 = **0**, instance 1 = **0** |
| D4d argv rồi Thoát | **PASS** | **0** |
| D4e Sống 30s rồi Thoát | FAIL (chỉ do pgrep leftover) | **0**, click true |

- **D4c chi tiết (đóng nợ K1 §6):** instance 2 exit 0 (thoát trong
  120s); `onOpenFile` nhận `H9-SecondInstance.vcut: true`; tên trong ô
  nhập **"H9 Second"** (kỳ vọng đúng); `currentPath` đúng;
  instance 1 Thoát click true, exit 0. **Dialog discard-confirm:
  KHÔNG xuất hiện** (CDP 0 entry mới; cửa sổ nhỏ 2-nút: 0) — khác hẳn
  đợt 53/54: fix K2 (`markSaved` sau `loadSample`) làm project mẫu
  sạch từ lúc sinh ra nên forward không còn bật confirm, kể cả khi
  forward tới sau khi mẫu đã load. D4c verdict nay PASS toàn diện
  (tên + exit + không dialog), không còn "FAIL chỉ do tên" như K2.
- **D4d:** `currentPath` đúng fixture; tên "H9 Doubleclick"; không
  dialog; exit 0.
- **D4a/D4b/D4e lượt 1:** exit code đều = 0, click đều true — FAIL
  chỉ vì `pgrep -f remote-debugging-port=9252` còn thấy tiến trình
  ngay sau khi main exit. Kiểm tra sau lượt 1: không còn tiến trình
  nào mang port 9252 (chỉ còn tự match của lệnh pgrep tay) — leftover
  là **thoáng qua**, không phải mồ côi thật. Harness cũ chỉ pgrep 1
  lần ngay sau exit nên bắt nhầm con Chromium (zygote/gpu/renderer)
  chưa kịp dọn — xem §6 về cách vá.

### 3.2 Lượt 2 (harness đã vá — poll pgrep tới khi sạch, tối đa 30s): 7 passed / 0 failed

| Case | Kết quả | Số đo |
|---|---|---|
| PRE | PASS | test sha `bff19724…` = knownFresh L4 |
| D4a | PASS | exit **0**, pgrep sạch sau **0s** |
| D4b | PASS | exit **0**, pgrep sạch sau **0s** |
| D4c | PASS | instance 2 exit **0**, instance 1 exit **0**, tên "H9 Second", không dialog |
| D4d | PASS | exit **0**, currentPath đúng, tên "H9 Doubleclick", không dialog |
| D4e | PASS | exit **0**, pgrep sạch sau **0,1s** |

- Lượt 2 pgrep sạch ngay (0–0,1s) trong khi lượt 1 cùng thời điểm đo
  lại thấy leftover — chênh nhau chỉ là jitter vài trăm ms dưới tải
  song song (các luồng L3/L7 đang chạy harness nặng cùng lúc). Harness
  poll mới làm verdict robust trước jitter này; không có bằng chứng
  mồ côi thật nào ở cả hai lượt.
- Kết luận D4 trên bản mới: **mọi exit code đều = 0 qua AppImage thật**
  (không cần fallback `--binary` như K2). Đây là lần đầu D4 đo đủ
  qua AppImage kể từ đợt 53 (K2 phải dùng `--binary` vì runtime flaky).

## 4. Menu M19–M26 — chạy lại trên bản mới

Cùng 2 lượt probe đầy đủ ở §2 (P4k3 + P5 + P6):

| Case | Lượt 1 | Lượt 2 | Rerun P5 |
|---|---|---|---|
| M19 submenu + lang tới renderer + về VI | PASS | PASS | — |
| M19 English đổi hết UI | **FAIL** (xem §5) | **FAIL** | — |
| M20 DevTools (mở thật, đóng được) | PASS | PASS | — |
| M21 Giới thiệu (dialog 577x365) | PASS | PASS | PASS |
| M22 Phím tắt (dialog 544x574) | PASS | **FAIL 1 lần** (dialog đóng: false) | **PASS** |
| M23 Tài liệu hướng dẫn | PASS | PASS | PASS |
| M24 Báo lỗi (dialog 824x232) | PASS | PASS | PASS |
| M25 GitHub | PASS | PASS | PASS |
| M26 Thu nhỏ | **FAIL** (map-state=2) | **FAIL** (map-state=2) | — |
| M26 Đóng cửa sổ (exit 0, không mồ côi) | PASS | PASS | — |
| Guard menubar (5 dải trước mỗi action) | 11/11 không cần can thiệp | 11/11 | — |

- Tổng: lượt 1 **43/45**, lượt 2 **42/45** (K3 trên bản cũ: 41/45).
  Tăng +2 case so với K3 chính là 2 case tên P7 (argv + Recent) đã
  chuyển FAIL → PASS nhờ fix K1. Mọi case menu khác giữ nguyên verdict.
- **M22 lượt 2 là flake (1/3 lần quan sát):** dialog xuất hiện đúng
  (544x574), nút Đóng click được (`true`), nhưng check "dialog đóng"
  trả `false`. Ngay sau đó M23–M25 vẫn PASS (guard menubar 5 dải bình
  thường) nên dialog đã đóng sau đó hoặc check đọc nhầm trạng thái
  thoáng qua. Rerun `--only p5`: **20/20 PASS** (M22 pass). Kết luận
  flake 1 lần dưới tải song song (lúc đó L3/L7 đang chạy harness),
  không phải lỗi hệ thống của M22. Nếu tái hiện ≥2 lần ở lượt sau thì
  điều tra lại.

## 5. M19 — FAIL như kỳ vọng (build chưa có fix L1)

- IPC tốt: click "English" → `lang en` tới renderer; menu native đổi
  thật sang EN (bands VI `[16,70,125,171,228]` → EN tương tự K3).
- Web UI đổi một phần: khối đã đổi EN
  `["Publish","Split","Cut silence","MEDIA LIBRARY"]` (đủ 4/4 như K3);
  còn VI ở chế độ EN: `["Lưu thành","Lịch sử","Bắt đầu"]` —
  đúng chữ ký bug K3: `ProjectMenu.tsx` literal VI cứng + không
  `useLang()`, `TopBar.tsx:196` "👋 Bắt đầu" literal.
- **Đây không phải regression:** build này được đóng gói từ cây
  trước khi L1 hạ cánh (§1.3). L1 (đợt 55, 12 entry đã stage) sửa đúng
  2 file này + 24 key i18n mới (vi == en == 1011) — cần rebuild +
  đo lại M19 riêng sau khi gộp L1.

## 6. Harness đã sửa (tối thiểu, ghi rõ)

### 6.1 `apps/desktop/scripts/probe-menu-54k3.mjs`

1. **TMPDIR riêng theo display** (bài học K2): `TMPDISK` từ
   `~/.tmp-h9-k3` → `~/.tmp-h9-k3/d${DISPLAY_NUM}` — các luồng song
   song khác display không còn dùng chung thư mục giải nén.
2. **Guard sha chấp nhận bản rebuild L4:** `knownFresh` =
   `bff19724e8dd988d…` (thay `2a15ea90…`), nhãn PRE cập nhật mô tả
   bản rebuild 02:59 UTC 07/11 + bundle `index-CkcceBnb.js` + fix
   K1/K2/K4.
3. **Sửa chuỗi tĩnh lỗi thời** ở case tên P7 argv: bỏ ghi chú
   "bản build này chứa bug loadProject pre-K1" (sai với bản mới),
   thay bằng ghi chú sau fix K1.

### 6.2 `apps/desktop/scripts/click-test-menu.mjs`

1. **PRE guard chấp nhận bản rebuild L4** (`knownFresh55L4 =
   bff19724…`) ngoài release/ hiện tại.
2. **`waitNoLeftover()` mới trong `phaseD4`:** poll `pgrep -f
   remote-debugging-port=…` mỗi 1s tới khi sạch (tối đa 30s), trả số
   giây dọn sạch hoặc `null` nếu sau 30s vẫn còn. D4a/D4b/D4e dùng
   helper này thay cho pgrep 1 lần — verdict chỉ FAIL khi còn tiến
   trình sau 30s (mồ côi thật), không FAIL vì con Chromium dọn chậm
   vài trăm ms. Chi tiết ghi `pgrep sạch sau: Xs`.
3. **Sửa chuỗi tĩnh lỗi thời** ở D4d (comment + detail): bỏ ghi chú
   "fixture bare-spec load thành Dự án không tên", thay bằng kỳ vọng
   "H9 Doubleclick" sau fix K1.
4. Không đổi logic case nào khác; `node --check` pass cả 2 harness.

## 7. Kiểm chứng khác

- `tsc --noEmit` apps/desktop: **0 lỗi**.
- `node --check` cả 2 harness đã sửa: OK.
- Unit test K1 trên cây hiện tại: `loadProject54K1.test.ts` **7/7 PASS**.
- Diag (`--only diag`, bản mới, display :152): **12/12 PASS**
  (bằng K5 trên bản cũ).
- Không chạy lại: vite build ngoài lần build chính (đã pass trong
  build), test suite web đầy đủ, TTS/GOP/proxy (không thuộc phạm vi
  luồng này), đo trên máy thật / WM thật (M26 vẫn mở).

## 8. Hạn chế (trung thực)

- **M26 Thu nhỏ:** vẫn FAIL trên Xvfb không WM (map-state=2, cửa sổ
  vẫn Viewable sau click) — giới hạn môi trường, không phải bug sản
  phẩm; cần máy thật hoặc Xvfb + WM mới kết luận được.
- **M19:** bản này chưa có fix L1 (đã chứng minh bằng bundle, §1.3);
  không claim M19 đã sửa.
- **D4a/b/e lượt 1:** leftover pgrep chỉ ghi boolean, không ghi PID/
  cmdline của tiến trình còn lại nên không chứng minh được đó là con
  Chromium nào — chỉ chứng minh được nó thoáng qua (sau lượt 1 không
  còn process port 9252 nào) và lượt 2 sạch ngay. Harness mới đã ghi
  số giây dọn sạch để lần sau có số đo.
- **AppImage runtime flaky (K2 §5.4):** lượt này KHÔNG tái hiện
  (mọi launch AppImage đều lên, kể cả D4c instance 2 giải nén lạnh) —
  có thể nhờ TMPDIR riêng + tải hệ thống lúc đo thấp hơn, không phải
  vì runtime đã hết flaky. Không claim đã sửa được tính flaky đó.
- **Bundle trong AppImage:** verify qua `linux-unpacked` (cùng cây
  đóng gói) + tên bundle trong asar, chưa giải nén AppImage thành phẩm
  để đối chiếu từng file.
- **Race với luồng L1:** L1 hạ cánh vào cây đúng lúc build web đang
  chạy (02:44:19 UTC); kết luận "build không chứa L1" dựa vào
  bundle-hash giống hệt bundle 01:17 + 0 hit key mới + đo headed
  M19 fail đúng chữ ký cũ — ba bằng chứng độc lập, không dựa vào
  mtime.
- Các luồng đợt 55 khác đang chạy song song (L3 display :151, L7
  display :153, …) — đo của luồng này dùng display :152 / CDP
  9243/9252 / TMPDIR riêng, không dùng chung userdata/testdir với
  luồng khác; không kill process lạ nào.
- Không sửa code sản phẩm trong luồng này (chỉ rebuild + harness);
  không push, không release/tag.

## 9. File đã chạm (trong batch này)

- `apps/desktop/scripts/probe-menu-54k3.mjs` — vá TMPDIR theo display,
  guard sha bản L4, chuỗi P7 (§6.1).
- `apps/desktop/scripts/click-test-menu.mjs` — PRE guard bản L4,
  `waitNoLeftover()` cho D4a/D4b/D4e, chuỗi D4d (§6.2).
- `docs/PHASE9_ROUND55_L4_REBUILD_REMEASURE_LIMITS.md` — file này.
- **KHÔNG stage:** AppImage mới (576.688.069 byte, binary) +
  `release-round55-l4/linux-unpacked` — chỉ để ở
  `apps/desktop/release-round55-l4/` trên đĩa local để các luồng sau
  dùng lại; file config electron-builder tạm đã xóa.

## 10. Nợ mở

- **M19 sau fix L1:** cần rebuild mới (gộp L1) + đo lại M19 — L1 đã
  stage (12 entry) nhưng chưa có trong bản AppImage nào.
- **M26 Thu nhỏ:** cần máy thật / Xvfb + WM.
- **M22 flake:** 1/3 lần quan sát — theo dõi, điều tra lại nếu tái
  hiện ≥2 lần.
- **D2a fail** (nợ K4) — không thuộc luồng này.
- **AppImage runtime flaky** (K2 §5.4) — chưa có lời giải gốc.
- `.github/workflows/ci-security.yml` vẫn 403 chưa lên GitHub (nợ
  chung); `.deb` không có trong bản build này (chỉ build AppImage).

## 11. Bằng chứng (không stage)

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l4/`:

- `appimage-build.log` (electron-builder, EXIT 0),
  `build-snapshot.txt` (sha256 source lúc build).
- `k3-run1/` + `k3-run1-stdout.log` (probe đầy đủ lượt 1: 43/2),
  `k3-run2/` + `k3-run2-stdout.log` (lượt 2: 42/3),
  `k3-p5rerun/` + `k3-p5rerun-stdout.log` (M21–M25 chạy lại: 20/20).
- `d4-run1/` + `d4-run1-stdout.log` (D4 lượt 1: 3/7 — exit 0 nhưng
  pgrep leftover + PRE guard cũ),
  `d4-run2/` + `d4-run2-stdout.log` (D4 lượt 2: 7/7).
- `diag-run1/` + `diag-run1-stdout.log` (diag: 12/12).
- Mỗi thư mục run chứa `h9-report*.json` + `shots/` + log app.

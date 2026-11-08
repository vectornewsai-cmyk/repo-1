# Phase 9 — Đợt 57, luồng N9: Mở rộng click-test thao tác timeline cốt lõi — LIMITS

Ngày: 07/11/2026 (~15:40–16:10 +07, lượt cron 15:35 +07).
Phạm vi: đóng nợ N3 trong `PHASE9_GAP_ANALYSIS.md` §2.7 — mở rộng bộ
click-test Playwright/CDP của Q2 bao phủ thao tác timeline cốt lõi:
trim mép clip, split, delete clip, box-select, undo/redo sau kéo clip
(+ multiselect+delete, split rồi undo).
**KHÔNG sửa code sản phẩm** (`apps/web/src` không đụng tới), KHÔNG push,
KHÔNG tag/release, KHÔNG binary vào batch.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Bộ click-test mới | **11/11 PASS** ở lượt chạy cuối (lượt 3, xem §1). 9 case mới N1–N9 + H0 setup + H9 0 lỗi trang. |
| N3 (nợ gap analysis) | **Đóng.** Trim 2 mép, split, delete, box-select, undo/redo sau kéo đều có case click thật + assert trạng thái thật. |
| Bug sản phẩm | **Không phát hiện bug sản phẩm nào.** 2 fail ở lượt 1–2 đều là nhiễu harness/môi trường (xem §3, §4), không tái hiện ở lượt sạch. |
| Nhiễu chéo luồng | **Có, đã đo + đã vá trong harness.** Luồng khác sửa `preview.tsx`/`App.tsx`/`tsconfig.json` giữa chừng gây HMR/full-reload làm fail N8 + timeout N9 ở lượt 2 (§4). Harness nay chạy vite với HMR tắt + boot-marker + retry (§5). |
| Modal chào | **Phát hiện harness:** phím Escape KHÔNG đóng được WelcomeModal — chỉ nút "Để sau" mới đóng (§6). Harness đã sửa theo hướng này. |
| Autosave restore | **Quan sát (chưa kết luận bug):** sau reload, app khôi phục autosave nhưng mất media mẫu (§7). Cần đợt riêng verify bằng reload sạch. |

## 1. Kết quả từng case (lượt chạy cuối — lượt 3, 09:05:24–09:07:12 UTC+7)

Harness: `apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs`
(vite dev + Chromium headed qua Xvfb + CDP, Node thuần, theo mẫu L1
đợt 55). Project mẫu tự load lúc mount: v1 có 2 clip video 4s
[0–4, 4–8], t1 có 1 clip chữ [0.5–5.5], `pxPerSec=60`. Mỗi case reset
về project mẫu mới bằng `store.loadSample()` (setup qua store — mẫu
các đợt trước; mọi thao tác dưới test đều là chuột/phím thật qua CDP).
Assert đọc state thật từ store (`start`/`duration`/`in`/`out`/số
clip/selection/`undoDepth`/`redoDepth`/`playhead`), sai số ±0.06s.

| Case | Kết quả lượt 3 | Chi tiết |
|---|---|---|
| H0 project mẫu tự load | PASS | v1 [0–4, 4–8], t1 [0.5–5.5], pxPerSec=60, undoDepth=0 |
| N1 trim mép phải | PASS | Kéo handle phải clip A sang trái 60px (1s): duration 4 → 3s, start=0, out=3; clip B vẫn start=4 |
| N2 trim mép trái | PASS | Kéo handle trái clip A sang phải 60px (1s): start 0 → 1, duration 3s, in=1, out=4 |
| N3 split tại playhead 6s (phím S) | PASS | v1: 2 clip → 3 clip [0–4, 4–6, 6–8], in/out chia đúng (2/2); clip chữ còn nguyên |
| N4 delete clip đã chọn (phím Delete) | PASS | Click clip B (selection=1 đúng clip) → Delete → v1 còn 1 clip (A 0–4s); clip chữ còn nguyên |
| N5 box-select | PASS | Kéo vùng trống bao cả 3 clip → selection=3 clip (2 video + 1 chữ); hộp `.tl-boxselect` biến mất sau thả |
| N6 undo/redo sau kéo clip | PASS | Kéo clip chữ 0.5 → 1.5s (undoDepth=1); Ctrl+Z → 0.5 (redoDepth=1); Ctrl+Y → 1.5 |
| N7 multiselect + delete | PASS | Click A + Shift+click B → selection=2 → Delete → v1 còn 0 clip; clip chữ còn nguyên |
| N8 split rồi undo | PASS | Split ở 6s: 2→3 clip; Ctrl+Z → 2 clip [0–4, 4–8], redoDepth=1 |
| N9 split ở 2s tách clip trên cùng (chữ) | PASS | t1: 1 clip → 2 clip [0.5–2, 2–5.5]; v1 nguyên vẹn 2 clip |
| H9 0 lỗi trang | PASS | Không có `window.onerror`/`unhandledrejection` trong phiên |

**KẾT QUẢ HEADED N9 (lượt 3): 11/11 pass.** Report JSON:
`hidden_files/round57-n9/headed/n9-headed-report.json`
(pass=11, total=11). Screenshots từng case:
`hidden_files/round57-n9/headed/n9-*.png`.

## 2. Vì sao split ở 2s tách clip chữ, không tách clip video (N9)

Đây là **hành vi có chủ đích của sản phẩm, không phải bug**.
`splitAtPlayhead` (`apps/web/src/store.ts`) duyệt track **từ cuối lên**
(track trên cùng thắng): ở playhead 2s, clip chữ t1 (0.5–5.5s) chứa
playhead nên nó là target; clip video A (0–4s) cũng chứa playhead
nhưng ở track dưới nên không được chọn. `splitClipAt` có nhánh riêng
cho text/sticker/image (chia `duration` tại điểm cắt) nên tách clip
chữ hoạt động đúng. N3/N8 vì vậy dùng playhead 6s — nằm trong clip B
(4–8s) nhưng ngoài clip chữ (kết thúc 5.5s) — để tách clip video.
N9 khóa hành vi "track trên cùng thắng" này thành case hồi quy.

## 3. Lượt 1: 7/10 — N6 flake, N3/N8 kỳ vọng sai

Lượt chạy 1 (08:44–08:47 UTC): H0, N1, N2, N4, N5, N7, H9 PASS;
N3/N8 FAIL; N6 FAIL.

- **N3/N8 lượt 1: kỳ vọng test sai, không phải bug sản phẩm.**
  Test split ở playhead 2s và assert clip video tách — nhưng theo §2,
  split tách clip chữ. Sau khi sửa kỳ vọng (split ở 6s + thêm N9),
  cả hai đều xanh ở lượt 2 và 3.
- **N6 lượt 1: kéo clip chữ không nhúc nhích** (start 0.5, undoDepth 0
  sau 2 lần kéo). **Không tái hiện được ở lượt 2 và 3** — cùng code
  kéo, cùng máy, N6 xanh cả 2 lượt sau (lượt 2 có hit-test chứng minh
  pointer event tới đúng `.tl-clip.clip-text`). Không đủ bằng chứng
  kết luận bug sản phẩm; mẫu failure khớp với nhiễu reload giữa chừng
  (§4: trang bị teardown đúng lúc pointerdown/move thì `dragRef` mất,
  kéo rơi vào khoảng không, `undoDepth` giữ 0). Ghi nhận là flake
  1/3 lượt, không phải bug đã xác nhận.

## 4. Lượt 2: 9/11 — nhiễu chéo luồng (HMR/full-reload) làm fail N8 + timeout N9

Lượt chạy 2 (08:55–09:00 UTC): H0, N1–N7, N9 PASS; **N8 FAIL
(`v1=[]` sau split)**; **N9 timeout** ở bước reset (chờ 3 clip 180s,
`last=null`); harness thoát mã 2. Không phải bug sản phẩm — bằng
chứng trong `n9-vite.log` (lượt 2):

- 08:56:34, 08:57:00, 08:57:09 — HMR update/invalidate
  `/src/preview.tsx` + `/src/App.tsx` (một luồng đợt 57 khác đang sửa
  2 file này; `preview.tsx` mtime 06:32, `App.tsx` mtime 06:32 —
  xem `ls -lt`).
- 08:57:20 — `changed tsconfig file detected:
  apps/web/tsconfig.json — Clearing cache and forcing full-reload`
  (luồng khác sửa `tsconfig.json`, mtime 08:57).

Cơ chế (đã xác minh bằng screenshot `n9-n8-split-undo.png`): HMR
invalidate `preview.tsx` ("Could not Fast Refresh") → **full page
reload** đúng lúc N8 vừa split xong → app khởi động lại và **khôi
phục autosave** (trạng thái cuối N7: 0 clip video + 1 clip chữ, tổng
thời lượng 5.5s) → `STATE_FN` đọc `v1=[]` → FAIL. Reload lần 2 lúc
08:57:20 rơi vào giữa `loadSample` của N9 → generation guard của
`loadSample` hủy set stale → `clipCount` không bao giờ về 3 →
timeout 180s.

Chẩn đoán phụ (diag tạm, đã xóa sau khi dùng xong): khi modal chào
còn mở, `elementFromPoint` tại tâm clip trả về `modal-backdrop` và
mọi pointer event rơi vào backdrop — cùng chữ ký "kéo không nhúc
nhích, selection rỗng, undoDepth 0" như N6 lượt 1. File diag tạm
`clicktest-57n9-diag-n6.mjs` đã xóa, không stage.

## 5. Cách harness chống nhiễu (đã áp dụng, lượt 3 xanh 11/11)

1. **Tắt HMR ở vite dev.** CLI vite 6.4.4 không có flag `--hmr` nên
   harness dùng config tạm **ngoài repo**
   `/tmp/round57-n9/vite.n9.config.mjs` (sao y config thật: react
   plugin, thêm `server: { hmr: false }`), chạy bằng
   `vite -c /tmp/round57-n9/vite.n9.config.mjs`. Nhờ đó các lần sửa
   `.tsx/.ts` của luồng khác giữa chừng không reload trang nữa.
   Nội dung file (để tạo lại khi `/tmp` bị xóa sau reboot):
   ```js
   import { createRequire } from "node:module";
   const require = createRequire("/home/hatch/workspace/repo-1/apps/web/package.json");
   const react = require("@vitejs/plugin-react").default;
   export default { plugins: [react()], server: { hmr: false } };
   ```
   Lưu ý: `tsconfig.json` đổi vẫn làm vite log "changed tsconfig
   file detected … forcing full-reload" (lượt 3: 09:06:50, đúng lúc
   N7) — nhưng với HMR tắt, client không nhận lệnh reload nên trang
   không reload thật (không có dòng "reload giữa chừng" nào, mọi
   assert sau đó vẫn đọc đúng state). Đây là giới hạn đã biết của
   cách tắt HMR, xem §8.2.
2. **Boot-marker + retry.** `window.__n9boot` (id ngẫu nhiên, đặt lúc
   inject, mất sau reload). `resetProject` re-inject khi marker mất
   và trả về boot; N8/N9 kiểm tra boot trước mỗi assert — lệch thì
   chạy lại case 1 lần, 2 lần lệch liên tiếp mới FAIL với lý do
   nhiễu. Lượt 3 không lần nào phải retry.
3. **Modal-guard trước mỗi case** (`ensureNoModal`, xem §6).

## 6. Modal chào: Escape không đóng được (phát hiện harness)

- `WelcomeModal` chỉ mở 1 lần khi `localStorage` chưa có
  `vcut-welcomed` (`App.tsx:74,550`); nút "Để sau" (và các nút khác)
  mới set flag + đóng. **Phím Escape không đóng được modal** (App
  `onKey` chỉ đóng export/caption/silence/load-report, không có
  nhánh đóng welcome).
- Hệ quả cho harness: vòng đóng modal chỉ dùng Escape sẽ kẹt (diag
  lượt 2: gửi Escape 3 lần, modal vẫn mở, mọi click rơi vào
  `.modal-backdrop`). Harness nay đóng bằng JS-click nút "Để sau"
  rồi mới Escape, kiểm tra lại, gọi trước mỗi case.
- Đây là khiếm khuyết UX nhỏ (user thật vẫn đóng được bằng nút), ghi
  nhận cho đợt sau, không sửa trong luồng này (cấm sửa code sản phẩm).

## 7. Quan sát: reload làm mất media mẫu (chưa kết luận bug)

Screenshot N8 lượt 2 (sau reload do HMR): app khôi phục autosave
với toast *"Khôi phục autosave, có lưu ý: Đã điền style mặc định cho
1 text clip thiếu style (tracks[1].clips[0]) — lưu lại file để hoàn
tất."* — nhưng **media bin trống** ("Chưa có file nào") và 2 clip
video mẫu biến mất; chỉ còn clip chữ. Tức là sau reload, autosave
giữ được spec (clip chữ) nhưng **không giữ được media mẫu**
(`mau-1.webm`/`mau-2.webm` là blob object-URL, không nằm trong
autosave; đường rehydrate qua AssetStore dường như không nạp lại
chúng vào bin trong trường hợp này). Đây mới là quan sát dưới nhiễu
HMR, **chưa test bằng reload sạch** nên chưa kết luận là bug — đề
xuất đợt sau verify: reload trang có chủ đích rồi kiểm tra media bin
+ timeline. Nếu đúng, đó là bug thật về bền vững media mẫu qua reload.

## 8. Môi trường chạy (lượt 3)

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1248`
  (headed qua Xvfb display riêng `:157`, 1440×900).
- Vite dev cổng 5370, CDP debug 9470, TMPDIR `/tmp/round57-n9/tmp`
  (display/cổng riêng của N9, không dùng chung với L1 `:154`/5350).
- Lệnh chạy (từ gốc repo):
  `node apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs`
  — exit 0 khi 11/11 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Harness là `.mjs` (JS thuần) nên không chạy `tsc` cho file test
  (không áp dụng). Không sửa file sản phẩm nên không chạy lại
  `tsc`/`vite build` của app.
- Tải VM lúc chạy: load average ~0.3–2.5, RAM còn trống ~1–1.8G —
  không phải nguyên nhân fail (fail lượt 2 khớp đúng thời điểm file
  luồng khác đổi, xem §4).

## 9. Nợ mở (cho đợt sau)

1. **Verify reload làm mất media mẫu (§7)** bằng reload sạch có chủ
   đích (không nhiễu HMR): sau reload, media bin + timeline còn gì?
   Nếu đúng là mất media → bug sản phẩm về rehydrate autosave.
2. **Escape không đóng WelcomeModal (§6):** thêm Escape vào
   `onKey` của App hoặc nút đóng rõ ràng — việc nhỏ, để đợt UI sau.
3. **Harness dùng config tạm trong `/tmp` (§5):** `/tmp` mất sau
   reboot — lượt chạy sau phải tạo lại
   `/tmp/round57-n9/vite.n9.config.mjs` (nội dung ở §5.1) trước khi
   chạy, nếu không vite thoát lỗi và harness báo mã 2. Cân nhắc đưa
   config tắt-HMR vào repo dưới dạng file riêng cho click-test
   (quyết định của parent — N9 không tự thêm file config vào repo).
4. **Tsconfig đổi vẫn log full-reload dù HMR tắt (§5.1):** chưa gây
   fail ở lượt 3, nhưng nếu luồng khác sửa `tsconfig.json` đúng lúc
   case đang chạy thì boot-marker + retry của N8/N9 là lưới an toàn
   duy nhất; các case N1–N7 chưa có retry — cân nhắc bọc retry cho
   toàn bộ case ở đợt sau.
5. N6 lượt 1 flake (§3): đã xanh 2/3 lượt; nếu tái hiện thì cần
   probe pointer-event ngay trong case (harness đã có sẵn probe
   `window.__n9probe` + hit-test ở N6).

## 10. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs` | Mới | Harness headed: H0 + 9 case mới N1–N9 + H9; modal-guard, hit-test/probe, boot-marker + retry N8/N9, vite config tắt HMR |
| `docs/PHASE9_ROUND57_N9_CLICKTEST_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round57-n9-clicktest.txt` — 2 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag. File diag tạm
đã xóa, config vite tạm nằm ngoài repo (`/tmp`, không stage).
Bằng chứng chạy: `hidden_files/round57-n9/headed/` (report JSON,
vite/chrome log, screenshot từng case).

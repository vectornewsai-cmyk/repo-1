# Phase 9 — Đợt 80, luồng H9: Mở rộng click-test thao tác cốt lõi (responsive + PWA) — LIMITS

Ngày: 10/11/2026 (lượt cron 15:35 +07, chạy 15:38–16:40 +07).
Phạm vi: đóng phần còn lại của nợ N3 trong `PHASE9_GAP_ANALYSIS.md` §2.7
— responsive (viewport hẹp) + PWA (manifest / service worker / offline cơ
bản). Phần thao tác cốt lõi (trim/split/delete/box-select/undo-redo) đã có
từ bộ N9 (đợt 57, 11/11) — luồng này CHẠY LẠI bộ N9 nguyên vẹn làm hồi quy
trên cây hiện tại, rồi chạy bộ mới H9 cho responsive + PWA.
**KHÔNG push, KHÔNG tag/release, KHÔNG binary vào batch.**

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Bộ click-test mới H9 | **6/6 PASS** ở lượt chạy cuối (R1/R2/P1/P2/P3/H9). |
| Bộ cũ N9 (hồi quy) | **11/11 PASS**, chạy 2 lần trong luồng này (trước và sau sửa sản phẩm) — không hồi quy desktop. |
| N3 (§2.7) | **Đóng phần responsive + PWA.** Trim/split/delete/box-select/undo-redo đã đóng từ N9; nay thêm responsive 390px + 768px và PWA (manifest/SW/offline). |
| Bug sản phẩm | **2 bug thật, đã sửa + kiểm chứng xanh:** (1) pill FPS che tay cầm trim + clip ở 390px (§2); (2) MixerMeter tràn 2px ở 390px (§3). |
| tsc / vite build | **tsc 0** (sau 1 lần fail giả do luồng khác đang sửa file giữa chừng, §6); **vite build pass** (dist rebuild 09:21 UTC, 46,6s). |
| PWA | Manifest hợp lệ, SW đăng ký + điều khiển trang ở PROD, reload offline mở được app + đủ 3 clip mẫu. Chưa test install prompt / máy thật (§7). |

## 1. Kết quả từng case

Harness mới: `apps/web/scripts/clicktest-80h9-clicktest-core.mjs`
(vite dev + vite preview PROD + Chromium headed qua Xvfb + CDP, Node thuần,
theo mẫu N9; display :181, dev :5390, debug :9490, preview :4290).
Project mẫu: v1 có 2 clip video 4s [0–4, 4–8], t1 có 1 clip chữ [0.5–5.5],
`pxPerSec=60`. Lượt chạy cuối 09:34:59–09:36:38 UTC (2 phút — mount nhanh
do vite đã warm; các lượt trước chậm hơn vì transform lạnh).

| Case | Kết quả lượt cuối | Chi tiết |
|---|---|---|
| R1 responsive 390×844: layout mobile + trim + chọn clip | PASS | Không tràn ngang (docScrollW=390, overflow=[]); brand ẩn, fabbar hiện, topbar 437px; fab 📁 mở sheet "📁 Thư viện" 390×492 rồi đóng được; trim handle phải clip A 4s → 3s (start=0, out=3), clip B vẫn start=4; cuộn timeline 200px rồi click tâm clip B → selection đúng 1 clip; pill FPS ở vị trí mới (47, 560) 70×44, bấm mở panel rồi đóng được |
| R2 responsive 768×1024: layout mobile + split | PASS | Không tràn ngang (docScrollW=768); breakpoint 768 khớp (matchMedia), brand ẩn, fabbar hiện, topbar 269px; split ở 6s (phím S): v1 2 clip → 3 clip [[0,4],[4,2],[6,2]] |
| P1 manifest PWA hợp lệ | PASS | HTTP 200, name="VCut Studio", short_name="VCut", display="standalone", start_url=".", icons 192/512/maskable-512 đều HTTP 200 |
| P2 service worker đăng ký + điều khiển trang (PROD) | PASS | vite preview dist mới: scope=http://127.0.0.1:4290/, active=activated, controller=true (không cần reload thêm — SW `clients.claim()` có tác dụng) |
| P3 offline cơ bản: reload khi mất mạng vẫn mở được app | PASS | Giả lập offline (CDP Network.emulateNetworkConditions) rồi reload: topbar mount từ cache SW; project mẫu đủ 3 clip (v1 "00:00.0 → 00:04.0" + "00:04.0 → 00:08.0", t1 1 clip) |
| H9 0 lỗi trang (dev + PROD) | PASS | Không có `window.onerror`/`unhandledrejection` trong cả 2 phiên |

Bộ cũ N9 (chạy lại, `clicktest-57n9-timeline-core-ops.mjs`): **11/11 PASS**
cả 2 lần — lần 1 lúc 08:42–08:45 UTC (trước sửa sản phẩm) và lần 2 lúc
09:36–09:39 UTC (sau sửa sản phẩm): H0 + N1 trim phải + N2 trim trái + N3
split 6s + N4 delete + N5 box-select (3 clip) + N6 undo/redo sau kéo +
N7 multiselect+delete + N8 split rồi undo + N9 split clip trên cùng + H9
0 lỗi trang. Report JSON: `hidden_files/round57-n9/headed/n9-headed-report.json`
(lần 2 ghi đè lần 1; log đầy đủ trong log luồng).

## 2. Bug thật #1 — Pill FPS che tay cầm trim + clip ở 390px (ĐÃ SỬA)

- **Triệu chứng (lượt chạy H9 đầu, R1 FAIL):** ở 390×844, kéo handle phải
  clip A không đổi gì (duration vẫn 4s, undoDepth=0) và click clip B không
  chọn được (selection=[]), dù cùng thao tác xanh ở 1440px (N9) và 768px
  (R2). Đồng thời 2 phần tử tràn ngang: `mixer-meter@149..392`,
  `mixer-meter-idle@352..392` (xem §3).
- **Chẩn đoán (script diag tạm `/tmp/round80-h9/diag-390.mjs`, đã chạy xong,
  không stage):** `elementsFromPoint` tại tâm handle phải clip A
  (320, 811.5) trả về đầu tiên là **`BUTTON rect=308,788 70x44 z=300`** —
  pill FPS của `PerfOverlay` (`position: fixed; right: 12px; bottom: 12px;
  zIndex: 300`), che trọn handle (309–331) và phần nhìn thấy của clip B
  (332–378). Kéo/chạm rơi vào nút pill, không tới clip. Sau đó click vào
  pill còn mở panel FPS (210px, z 300) nên click tiếp theo cũng trượt —
  chuỗi fail dây chuyền đã tái hiện đúng trong diag (kể cả click tâm clip B
  sau khi cuộn: lúc đó panel đang mở nên vẫn trượt).
- **Vì sao chỉ cắn ở màn hẹp:** ở desktop, pill nằm ở góc dưới-phải nơi
  lanes chỉ có khoảng trống (clip dài nhất 8s × 60px/s = 480px, pill ở
  x ≥ 1300); ở 390px, lane video (y 783–841) nằm đúng tầm pill
  (y 788–832) và clip chạm tới x ≥ 308. Bất kỳ project nào có clip vắt qua
  vùng x 308–378 ở lane video đều bấm không được ở 390px.
- **Cách sửa (sản phẩm, tối thiểu):** `apps/web/src/components/PerfOverlay.tsx`
  dùng `useIsMobile()` (breakpoint 768 có sẵn): ở ≤768px, dời cả pill lẫn
  panel sang **góc dưới-trái, ngay trên timeline** (`left: 12px;
  bottom: 262px` = timeline mobile 250px + 12px khe) — chỉ che video/
  letterbox ở góc dưới-trái preview, không che nút hay clip nào. Desktop
  giữ nguyên (`right: 12px; bottom: 12px`). Thêm class
  `perf-fps-btn` / `perf-fps-panel` để harness sau bắt được. Panel khi mở
  vẫn là overlay chẩn đoán do user mở chủ đích (đóng bằng ✕); vị trí mới
  của nó cũng dời theo pill cho nhất quán.
- **Vì sao không ẩn pill luôn:** bộ click-test 63r1 (M10) chạy ở 390px và
  CẦN pill để mở panel FPS (`openFpsPanel` bấm pill bằng rect; pill ẩn thì
  M10 fail harness). Dời vị trí giữ được M10 (pill vẫn là button render
  bình thường, cùng handler). Các case M1–M8 của 63r1 đo pill bằng
  elementFromPoint — dời vị trí chỉ làm giảm chồng lấn, không đổi verdict
  theo hướng xấu. **Nợ:** nên chạy lại bộ 63r1 ở đợt sau để xác nhận M10
  trực tiếp (luồng này chỉ kiểm chứng tiền đề: pill bấm được + panel mở/
  đóng được ở vị trí mới, trong chính case R1).
- **Kiểm chứng sửa:** R1 lượt cuối PASS — trim 4→3s, chọn clip B đúng,
  pill tại (47, 560) bấm mở panel rồi đóng được; N9 sau sửa vẫn 11/11.

## 3. Bug thật #2 — MixerMeter tràn 2px qua mép phải ở 390px (ĐÃ SỬA)

- **Triệu chứng:** `VIEWPORT_FN` ghi `mixer-meter@149..392`,
  `mixer-meter-idle@352..392` — tràn 2px qua mép phải viewport 390
  (docScrollW vẫn 390 nên không sinh thanh cuộn ngang, nhưng phần tử nhìn
  thấy bị cắt — xem screenshot `h9-r1-390px.png` lượt đầu: "-∞ dB" bị cắt).
- **Nguyên nhân:** `.mixer-meter { position: absolute; left: 140px; }`
  cố định + track 120px + nhãn dB min-width 62px + nhãn idle — tổng vượt
  khung preview hẹp (~374px). `pointer-events: none` nên không chặn thao
  tác, chỉ là lỗi hiển thị.
- **Cách sửa:** trong `@media (max-width: 768px)` của
  `apps/web/src/mobile.css`: `.mixer-meter-track { width: 84px; }`,
  `.mixer-meter-db { min-width: 48px; }` (gọn ~50px, giữ đủ nhãn idle).
  Desktop giữ nguyên.
- **Kiểm chứng:** R1 lượt cuối `overflow=[]`, screenshot lượt cuối cho thấy
  "MIX … -∞ dBFS" hiện trọn trong khung preview.

## 4. Các lỗi harness tìm ra trong lúc chạy (không phải bug sản phẩm)

1. **Mount check dùng `innerText`:** ở mobile, `.brand-name` bị
   `display: none` nên `topbar.innerText` không chứa "VCut Studio" →
   timeout mount 240s ở lượt H9 đầu. Sửa: dùng `textContent` (ghi chú:
   bộ 63r1/62r10 đã biết và dùng `innerText.includes(...) ||
   window.innerWidth <= 768`).
2. **Cổng preview 4190 là bad-port:** node fetch (undici) chặn cổng 4190
   theo danh sách bad-port của WHATWG fetch (`Error: bad port`) — vite
   preview đã listen (log có "Local: 4190", `ss` thấy LISTEN, curl tới
   được) nhưng vòng chờ bằng node fetch fail 60s rồi 180s. Đổi range
   preview sang **4290–4299**; chờ 180s + log `lastFetchErr`. Bài học:
   đừng dùng cổng 4190 (và các cổng trong danh sách bad-port) cho vòng chờ
   bằng node fetch.
3. **PROD không import được store:** `STORE_FN`/`STATE_FN` của N9 import
   `/src/store.ts` qua performance entries — ở bản PROD bundle không còn
   file đó nên P3 timeout 180s. Sửa: P3 đọc trạng thái từ DOM
   (`DOM_STATE_FN`: đếm `.tl-clip`, nhãn thời gian `fmtTime` "00:00.0 →
   00:04.0" / "00:04.0 → 00:08.0") — assert trên timeline render thật,
   không cần store.
4. **Tâm clip B ngoài viewport 390px:** clip B tâm ở x=452 > 390 nên
   click tâm không bao giờ tới clip — lỗi hình học của test, không phải
   sản phẩm. Sửa: R1 cuộn `.tl-scroll` 200px rồi mới bấm tâm clip B
   (252, 811.5).
5. **Display :180 bị chiếm:** lượt H9 đầu fail vì một luồng đợt 80 khác
   đang chạy Xvfb :180 (cùng lúc có :157/:180/:214/:215/:216). Đổi sang
   :181. Ghi chú: các luồng headed khác chọn display trùng nhau là rủi ro
   đã biết — N9/63r1 dùng display riêng; H9 nay dùng :181.
6. **Config vite tắt HMR trong /tmp đã mất sau reboot:** tạo lại
   `/tmp/round57-n9/vite.n9.config.mjs` (nội dung ở N9 LIMITS §5) trước
   khi chạy lại N9; script H9 tự tạo config của nó
   (`/tmp/round80-h9/vite.h9.config.mjs`).

## 5. Môi trường chạy (lượt cuối)

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1254`
  (Chrome for Testing 158.0.8127.18), headed qua Xvfb display riêng.
- N9 dùng lại được sau khi sửa 1 dòng đường dẫn Chrome: `chromium-1248`
  không còn trên đĩa (chỉ còn 1187/1254) → đổi sang `chromium-1254`
  trong `clicktest-57n9-timeline-core-ops.mjs` (bảo trì harness, không
  làm yếu assert). H9 cũng dùng chromium-1254.
- `tsc --noEmit`: 0 lỗi (chạy lại lúc 09:18 UTC). Lưu ý: 1 lần chạy tsc
  giữa chừng báo lỗi ở `ExportPanel.tsx` (TS6133) +
  `reverseWebcodecs.ts` (TS2339 `decodeAhead`) — đó là lúc luồng khác
  đang sửa 2 file đó (mtime 09:12:15/09:12:18), chạy lại sau khi cây ổn
  định thì sạch. Không phải lỗi của luồng này (không đụng 2 file đó).
- `npm run build` (tsc + vite build): exit 0, vite build 46,62s,
  dist rebuild 09:21 UTC. Lưu ý: dist trên đĩa sau đó được luồng khác
  build lại lúc 09:29 (cây đổi liên tục) — P2/P3 chạy trên dist 09:29,
  vẫn chứa fix H9 (fix vào cây từ 09:10).
- Tải VM lúc chạy: load ~0,4–1,4, RAM trống ~0,8–2,2 GB; các luồng đợt
  80 khác chạy song song (vite/Xvfb riêng).
- Bằng chứng chạy: `hidden_files/round80-h9/headed/` (report JSON,
  vite/chrome/preview log, screenshot R1/R2/P2/P3); diag tạm
  `/tmp/round80-h9/diag-390.mjs` + `diag-390.png` (không stage).

## 6. Giới hạn trung thực (chưa test / chưa làm)

1. **Chưa test trên máy thật:** mọi case chạy trên Chromium desktop giả
   lập viewport (deviceMetricsOverride, `mobile: false`) — chưa có
   điện thoại thật, chưa test cảm ứng (touch/ pinch/ kéo bằng ngón tay),
   chưa test Safari iOS / Chrome Android thật.
2. **PWA mới ở mức cơ bản:** manifest + SW đăng ký/điều khiển + reload
   offline mở được app shell + project mẫu. CHƯA test: install prompt /
   "Add to Home Screen", cập nhật SW khi có bản mới, cache sau nhiều lần
   dùng, offline khi chưa từng mở app lần nào (precache chưa có), iOS
   (Safari không hỗ trợ đầy đủ PWA).
3. **Responsive chỉ 2 viewport:** 390×844 (điện thoại) + 768×1024 (đúng
   breakpoint). Chưa test: 360px, 430px, landscape, tablet 1024, màn
   rất hẹp <360px.
4. **Topbar ở 390px cao 437px** (nhiều hàng wrap) — là hành vi có sẵn,
   không phải bug mới, nhưng chiếm hơn nửa màn hình; chưa đánh giá có
   nên gọn lại không (để đợt UI sau).
5. **Lane chữ ở 390px nằm dưới fold** (text lane y≈846 > viewport 844,
   phải cuộn dọc `.tl-scroll` mới thấy) — hành vi có sẵn của layout
   mobile, chưa kết luận tốt/xấu.
6. **Panel FPS khi mở ở mobile** vẫn là overlay fixed (nay ở góc
   dưới-trái, trên timeline) — user mở chủ đích thì chấp nhận; chưa đo
   lại chồng lấn panel↔modal ở vị trí mới bằng bộ 63r1 (xem §2 nợ).
7. **Không kiểm lại TTS 39 / pip-audit / Gradio** theo lệnh luồng (cấm).
8. Gap analysis: hàng N3 §2.7 vẫn ghi "chưa có click-test" (lỗi thời từ
   N9) — cần đợt gộp cập nhật: core ops đã có từ N9, responsive/PWA đã
   có từ H9 này.

## 7. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/components/PerfOverlay.tsx` | Sửa | Pill + panel FPS dời sang góc dưới-trái trên timeline ở ≤768px (`useIsMobile`); thêm class `perf-fps-btn` / `perf-fps-panel` |
| `apps/web/src/mobile.css` | Sửa | Thu `.mixer-meter-track` 120→84px + `.mixer-meter-db` min-width 62→48px trong `@media (max-width: 768px)` |
| `apps/web/scripts/clicktest-80h9-clicktest-core.mjs` | Mới | Harness headed H9: R1/R2/P1/P2/P3/H9 (dev + PROD preview, CDP, Xvfb) |
| `apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs` | Sửa (1 dòng) | Đường dẫn Chrome `chromium-1248` → `chromium-1254` (bản cũ không còn trên đĩa) |
| `docs/PHASE9_ROUND80_H9_CLICKTEST_CORE_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round80-h9-clicktest-core.txt` — 5 entry,
NUL cuối, toàn text, verify read-back 5/5. KHÔNG push, KHÔNG release/tag.
Không stage: `dist/` (build artifact), screenshot/log trong
`hidden_files/round80-h9/` (bằng chứng), script diag tạm trong `/tmp`.

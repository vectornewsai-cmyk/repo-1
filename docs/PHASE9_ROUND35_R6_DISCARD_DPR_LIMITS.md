# Phase 9 đợt 35, luồng R6 — Bền bỉ khi discard/reload + smoke dpr/viewport cho đường ngược

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Luồng này KHÔNG
> đo FPS (theo yêu cầu: để khỏi nhiễm phép đo FPS của luồng R1/R4 cùng
> đợt) — mọi lần chờ trong probe chỉ là chờ trạng thái, không đếm frame
> theo thời gian. Kết quả chi tiết: `benchmarks/results/v35-r6-discard-dpr.json`.

## 0. Đọc trước và phạm vi

Nợ đóng: `docs/PHASE9_ROUND34_LIMITS.md` §3 mục 6 — "tab ẩn hàng giờ /
discard thật" và "Safari / máy thật / dpr > 1 / viewport khác cho
dip/seek/reverse chưa đo". Luồng này đóng 2 mảnh của mục đó:

- (a) **Mô phỏng discard bằng reload trang** (KHÔNG phải discard thật).
- (b) **Smoke dpr > 1 + viewport khác cho đường phát ngược** (đường
  element cũ, cờ WebCodecs TẮT mặc định).

KHÔNG sửa code sản phẩm: chỉ thêm module thuần mới + test + probe +
file LIMITS này + JSON kết quả, và 1 dòng exclude trong
`apps/web/tsconfig.json` (mẫu chung của mọi file `.test.ts` — xem §4).
Không đụng `preview.tsx`, `reverseWebcodecs.ts`, hay script đo/snapshot
của luồng khác. Không build lại dist (các luồng khác đang đo trên cùng
cây — probe dùng dist sẵn có và ghi rõ bundle đã đo, xem §1).

## 1. Môi trường đo (ghi đúng lúc chạy)

- Bundle đo: `dist/assets/index-Cwsd35w5.js`,
  sha256 `c341d0a523da27cb2df0b89d86a86d564d709a2dee6ce83fb5e33bb64280c8ca`.
  Lưu ý trung thực: lúc khảo sát đầu đợt, dist còn là
  `index-DgObvvhC.js` — một luồng khác đã build lại dist giữa chừng,
  nên bundle probe đo được KHÁC bundle lúc khảo sát. Số đo gắn với
  bundle `Cwsd35w5`, không gắn với bundle cũ.
- Trình duyệt: Playwright Chromium 156 (Linux, headed dưới Xvfb) điều
  khiển qua `--remote-debugging-pipe` (mẫu harness đợt 23/24).
  Xvfb :85, vite preview cổng 4196 (display/port riêng, không chiếm
  :86/:87/:90–:93/:98 và cổng 4191 của các luồng khác).
- Probe: `apps/web/scripts/probe-round35-r6-discard-dpr-pipe.mjs`
  (1 lần chạy duy nhất, 3 phiên Chrome riêng: D1, D2+R-A, R-B).

## 2. Kết quả (a): reload mô phỏng discard — 2/2 case PASS

### D1 — Seed autosave rồi reload: PASS

Seed là envelope `vcut-project` hợp lệ (tên `R6-DISCARD-PROBE`):
2 clip video tên thô (`r6-a.webm`, `r6-b.webm`), 1 clip video
`blob:` chết sẵn, 2 clip text (`R6-DISCARD-PROBE`,
`caption r6 giữ lại`). Sau reload:

- Spec khôi phục **byte-khớp theo cấu trúc**: track/clip/text/src
  sau reload bằng đúng seed (`specRestoredEqual=true`), tên project
  `R6-DISCARD-PROBE` giữ nguyên.
- Autosave **không chứa key trạng thái phiên**: chuỗi JSON autosave
  không có `playhead` / `playing` / `reversePlayback`
  (`hasPlayheadKey=false`) — bằng chứng trực tiếp rằng playhead,
  trạng thái phát và chế độ ngược KHÔNG được lưu, nên reload luôn
  reset chúng (xem bảng §3).
- Panel Relink hiện và liệt kê đủ 3 src video: `r6-a.webm`,
  `r6-b.webm` và cả `blob:` — tức app tự nhận diện media thiếu sau
  reload, không im lặng vẽ placeholder sai.

### D2 — Phiên mẫu thật rồi reload: PASS (đây mới là đường user đi)

Phiên mẫu thật: app tự ghi 2 clip bằng MediaRecorder, chờ autosave
xuất hiện rồi mới reload. Sau reload:

- Spec khôi phục đúng: tên `Dự án mẫu` giữ nguyên, 3/3 clip
  (2 video + 1 text) khớp trước/sau (`specRestoredEqual=true`).
- Panel Relink hiện và liệt kê `mau-1.webm`, `mau-2.webm` — app
  KHÔNG tự tái sinh media mẫu sau reload. Đây là hành vi đúng theo
  kiến trúc hiện tại (media bin chỉ sống trong phiên), nhưng là
  **mất mát thật với user**: sau reload, project mẫu mở lại được
  khung timeline + chữ, nhưng 2 clip video không phát được cho tới
  khi user relink (hoặc tạo project mẫu mới).

### Bảng: cái gì sống, cái gì mất qua reload (đo + đọc code)

| Nhóm | Qua reload? | Bằng chứng |
|---|---|---|
| Timeline, clip, text, caption trong spec | SỐNG | D1 + D2: spec khớp trước/sau |
| Tên project | SỐNG | D1 `R6-DISCARD-PROBE`, D2 `Dự án mẫu` |
| Media mẫu / media import (blob URL, tên thô) | MẤT (thành thiếu, chờ relink) | D1 + D2: panel Relink liệt kê đủ src |
| Clip `blob:` | MẤT | D1: blob chết liệt kê trong Relink |
| Clip `asset:` (blob trong IndexedDB) | BYTES SỐNG, nhưng preview vẫn chưa vẽ lại được | Đọc code: không có code khởi động nào nạp lại media bin từ IndexedDB (không lời gọi AssetStore nào trong App/store/media) — xem module mới §4 |
| Playhead | MẤT (về 0) | store khởi tạo `playhead = 0`; autosave không lưu playhead |
| Đang phát / chế độ phát ngược | MẤT (về pause / tắt) | store khởi tạo `playing = false`, `reversePlayback = false` |
| Cache frame ngược, hold-frame, trạng thái decode | MẤT | biến module-level của tiến trình trang cũ |
| Clip text (không cần media) | SỐNG cùng spec | D1: 2 clip text trong spec khôi phục |

## 3. Kết quả (b): smoke ngược ở dpr = 2, 2 viewport — 2/2 PASS

Đường đo: phát ngược toàn cục bằng nút `aria-label="Phát ngược"`,
cờ `window.__vcutReverseWebcodecs` không đặt (undefined) → engine
`element` (đường cũ), KHÔNG qua WebCodecs. Không đo fps, chỉ
đúng/sai + kích thước + lỗi.

| Viewport (window) | dpr | Canvas CSS → backing | Playhead ngược | Lỗi trang |
|---|---|---|---|---|
| 1280×800 | 2 | 712×376 → **1424×752** (= CSS × 2, đúng trần `min(dpr,2)` của preview.tsx) | 7,5s → 5,1s (chạy lùi, chỉ kiểm tra chiều) | 0 window error, 0 CDP exception |
| 1920×1080 | 2 | 1352×656 → **2704×1312** (= CSS × 2) | 7,7s → 5,7s (chạy lùi) | 0 window error, 0 CDP exception |

Cả 2 viewport: canvas không trắng (màu distinct 34 và 37 trên lưới
thưa, nonBlack 558/594 và 432/528), không vỡ khung hình, không lỗi.
Screenshot bằng chứng chỉ lưu ở `/tmp/vcut-r6-dpr/` (scratch, KHÔNG
vào repo/batch): `r6-reverse-1280x800-dpr2.png` (510.808 byte,
sha256 đầu `80f0530cb45bf163`), `r6-reverse-1920x1080-dpr2.png`
(801.573 byte, sha256 đầu `3a730573d66eabee`).

## 4. Module + test mới (không nối vào sản phẩm)

- `apps/web/src/lib/discardRestore35R6.ts` — module thuần phân loại
  khôi phục sau reload, tách 2 câu hỏi hay bị gộp: (a) bytes media
  có sống không, (b) preview hiện tại có vẽ lại được ngay không.
  Kết luận mã hoá trong module (đối chiếu code, không suy đoán):
  `asset:` bytes sống nhưng preview vẫn false vì thiếu bước rehydrate;
  `blob:` / tên thô đều false cả hai.
- `apps/web/src/lib/discardRestore35R6.test.ts` — 8/8 pass bằng
  `node --experimental-strip-types` (chạy từ gốc repo).
- `apps/web/tsconfig.json` — thêm đúng 1 dòng exclude cho file test
  mới (mẫu chung: mọi `.test.ts` dùng import `.ts` đều bị TS5097 nếu
  không exclude; file module chính vẫn được tsc kiểm tra).
- Kiểm chứng: `tsc --noEmit` (apps/web) sạch cho file của luồng này;
  lúc chạy có lỗi thoáng qua ở file test đang sửa dở của luồng R3
  (`reverseFileBuffer35R3.test.ts`) — không phải file của luồng này,
  không đụng vào, và ở lần chạy tsc cuối đã sạch hoàn toàn.

## 5. Giới hạn mô phỏng — đọc kỹ trước khi trích dẫn

1. **Reload ≠ discard thật.** Probe chỉ reload trang có chủ ý. KHÔNG
   đo: tab ẩn hàng giờ, discard thật dưới áp lực bộ nhớ (như đợt 24
   H6 từng làm với trần 500 MB), bfcache restore, hay hành vi khi
   Chrome tự discard tab nền. Nợ "discard thật hàng giờ" của đợt 34
   vẫn MỞ — luồng này chỉ chứng minh tầng khôi phục sau khi trang
   đã tải lại, không chứng minh Chrome sẽ giữ hay huỷ tab ra sao.
2. **Safari / máy thật vẫn chưa đo.** Toàn bộ probe chạy trên
   Chromium Linux headed. dpr/viewport trên Safari, iOS/Android,
   màn hình thật vẫn là nợ mở (đúng như §3 mục 6 đợt 34 đã ghi).
3. **Đường `asset:` chưa đo bằng trình duyệt thật.** Kết luận
   "bytes sống nhưng preview chưa vẽ lại được" mới ở mức đọc code +
   phân loại thuần; probe D1/D2 không seed IndexedDB asset thật.
   Cần một probe seed `asset:` qua AssetStore rồi reload mới khẳng
   định bằng hành vi.
4. **Chỉ đo đường ngược element.** Cờ WebCodecs TẮT trong toàn bộ
   smoke; đường WebCodecs ở dpr > 1 chưa đo (thuộc luồng WebCodecs).
5. **Bundle trôi giữa đợt.** Số đo gắn với bundle `Cwsd35w5` lúc
   probe chạy; dist đã đổi 1 lần trong đợt này nên không dùng số này
   để đối chiếu với bundle khác.
6. **Không đo FPS, không đo thời gian khôi phục.** Cố ý theo yêu
   cầu luồng (tránh nhiễm phép đo R1/R4). Playhead "7,5 → 5,1s" chỉ
   là kiểm tra chiều chạy lùi, KHÔNG phải số fps hay độ mượt.

## 6. Nợ còn lại (có bằng chứng, chưa sửa — vì sửa cần nối vào App/store)

1. **Rehydrate media từ IndexedDB sau reload (nợ lớn nhất).**
   AssetStore đã giữ bytes, nhưng App không nạp lại media bin lúc
   khởi động → clip `asset:` vẫn thành thiếu. Hướng sửa: bước
   rehydrate lúc khởi động (liệt kê manifest + tạo lại blob URL) rồi
   mới `checkMissingMedia()` — cần sửa App/store nên KHÔNG làm trong
   luồng này (vượt phạm vi "chỉ module mới / file lưu-khôi phục" và
   sẽ đụng code các luồng khác đang chạy).
2. **Media mẫu mất sau reload.** User reload là gặp panel Relink cho
   `mau-1.webm`/`mau-2.webm`. Hướng sửa rẻ nhất: đưa media mẫu vào
   AssetStore lúc tạo mẫu (để bytes bền) + rehydrate ở (1); hoặc
   khi autosave trỏ tới media mẫu thì tự tái sinh mẫu thay vì đòi
   relink. Cả hai đều cần sửa App/store nên để lại làm nợ.
3. **Trạng thái phiên không bền.** Playhead/playing/reversePlayback
   reset sau reload là hành vi hiện tại, chưa rõ user có muốn giữ
   playhead qua reload không — cần quyết định sản phẩm trước khi sửa
   (lưu playhead vào autosave sẽ đổi format autosave).
4. **Discard thật + Safari/máy thật + đường `asset:` bằng trình duyệt
   thật** — xem §5 mục 1–3, vẫn mở.

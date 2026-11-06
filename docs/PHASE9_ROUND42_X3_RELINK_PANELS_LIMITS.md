# Phase 9 — Đợt 42, luồng X3: click-test banner % từng panel relink

## 1. Phạm vi và ràng buộc

- Nhiệm vụ: đóng nợ đợt 41 §5.4 — banner `%` của 7 call site ngoài MediaBin
  mà đợt 41 W3 đã thêm `%` chưa được click-test riêng từng panel.
- Phương pháp: click-test Chromium headed thật (Xvfb, `--no-sandbox`,
  profile mới mỗi case), file MP4/APNG thật có sẵn trong repo/fixture,
  không dùng file giả. Ground truth cho banner là MutationObserver cài
  trong trang (ghi mọi lần render `[data-import-progress]`); poll 100 ms
  chỉ là thông tin phụ vì nó bỏ lỡ flash ~2 ms.
- Ràng buộc giữ nguyên: KHÔNG push GitHub, KHÔNG tag/release, KHÔNG
  binary `.png/.ogg/.cube/.ttf`, KHÔNG dist, KHÔNG code giả/mock.
  Chỉ sửa file thuộc khu vực relink/import-progress + test click-test
  của riêng luồng này, trừ 1 fix chéo khu vực ở §3.2 (ghi rõ lý do).
- Mọi timing dưới đây là **headed, under-load** (nhiều luồng đợt 42 chạy
  song song trên cùng VM) — không phải số đo máy trống.

## 2. Kết quả tổng quan

9/9 case click-test PASS (7 panel đợt 41 + 2 case chẩn đoán):

| # | Panel / call site | Kết quả | Tổng thời gian |
| --- | --- | --- | --- |
| 1 | StickerPanel — APNG 29,53 MiB | PASS | 14.145 ms |
| 2 | StickerPanel — APNG 76,79 MiB (chẩn đoán, dưới mức 128 MiB) | PASS | 21.754 ms |
| 3 | MediaBin — APNG 29,53 MiB (chẩn đoán, không phải panel đợt 41) | PASS | — |
| 4 | ProjectMenu — nhập bản nén | PASS | 18.448 ms |
| 5 | TemplatePackModal — create | PASS | 17.002 ms |
| 6 | TemplatePackModal — makeTts | PASS | 15.150 ms |
| 7 | ExportPanel — reframe | PASS | 12.053 ms |
| 8 | TtsButton — speak | PASS (chạy lại lần 3, sau khi sửa tiêu chí) | 33.035 ms |
| 9 | BgRemovePanel — run | PASS (chạy lại lần 3, sau khi sửa click harness) | 465.603 ms |

Hai case 8 và 9 từng FAIL ở lần chạy đầu; nguyên nhân đã chẩn đoán xong
và không phải lỗi banner: case 8 sai tiêu chí thành công (§4.8), case 9
lỗi click của harness (§4.9). Cả hai đều PASS khi chạy lại với bản sửa.

## 3. Bug thật đã sửa (2 bug app + 1 lỗi harness)

### 3.1. Hashing `%` không bao giờ vẽ cho import nhanh (bug app, đã sửa)

- Bằng chứng trước sửa (headed, MutationObserver): StickerPanel APNG
  29,53 MiB chỉ render `storing`, banner sống 154 ms, không có lần render
  `hashing` nào. Chẩn đoán qua MediaBin (đường V5) với cùng file cũng
  chỉ thấy `storing` (144 ms) → lỗi đường chung, không phải riêng panel.
- Nguyên nhân: file ≤ 64 MiB chỉ có đúng 1 event hashing (100%), React
  batch nó chung với render `storing` ngay sau đó nên trạng thái hashing
  không bao giờ commit xuống DOM. Comment cũ ở `INGEST_CHUNKED_THRESHOLD`
  ghi "UI hiển thị đúng như vậy" là sai theo đo thực tế. File > 64 MiB
  cũng có thể mất event slice khi băm nhanh.
- Sửa (đánh dấu "Đợt 42 X3"):
  - `apps/web/src/lib/ingestProgress39T5.ts` — `hashBlobIncremental`:
    sau mỗi progress event, yield 1 macrotask (`setTimeout 0`) để React
    commit từng `%` slice. Chi phí ~1–4 ms/slice, không đáng kể so với
    ~80 ms+ băm mỗi slice 8 MiB.
  - `apps/web/src/lib/assetStore.ts` — nhánh one-shot trong
    `ingestWithProgress`: sau event hashing 100%, await 1 macrotask
    trước khi trả về, để banner 100% vẽ xong rồi mới sang storing.
- Sau sửa: mọi case ≤ 64 MiB đều có render hashing 100% thật trong
  observer (flash ~2–25 ms, xem §4). Case 76,79 MiB cho `%` từng slice
  thật: poll bắt được 10, 20, 31, 41, 52, 62, 72, 83, 93.

### 3.2. `feather_alpha` trả sai shape, phá mọi bgremove có feather > 0 (bug app, đã sửa)

- Phát hiện khi chẩn đoán BgRemovePanel: bridge trả HTTP 500, đầu tiên
  do venv thiếu `cv2` (lỗi môi trường, đã cài `opencv-python-headless`
  vào venv scratch — không phải sửa repo), sau đó lỗi NumPy về shape
  không khớp (540 vs 542).
- Nguyên nhân trong `server/bgremove/bgremove.py`, hàm `feather_alpha`:
  blur ngang để lại H+2r hàng (chỉ trim cột), rồi code pad hàng lần nữa
  trước blur dọc → kết quả có H+2r hàng thay vì H. Chứng minh cô lập
  bằng NumPy với shape (540,960), (10,12), (1,1), (720,1280), bán kính
  0–3: mọi r > 0 đều sai, r = 0 đúng.
- Sửa: bỏ lần pad hàng thứ hai trước cumsum dọc, kèm comment giải thích
  số học ((H+2r+1) − k = H). Sau sửa: mọi shape/bán kính trả đúng shape
  đầu vào, blur vẫn đúng (xung đơn 1.0 thành 0.1111 sau r = 1 — đúng giá
  trị tâm box-blur 3×3).
- Phạm vi: file này nằm ngoài khu vực relink/import-progress hẹp, nhưng
  nhiệm vụ giao "panel nào % không hiện (bug thật) thì sửa đúng chỗ đó",
  và bug này chặn BgRemovePanel tới được `importFiles` (panel mặc định
  feather = 1, mode alpha). Sửa tối thiểu, hàm thuần, đã kiểm chứng cô
  lập + end-to-end. Ghi minh bạch tại đây.
- Kiểm chứng end-to-end: bridge bgremove trực tiếp trả HTTP 200 sau
  365,97 s, output 36.428.866 byte; ffprobe xác nhận PNG codec,
  960×540, `rgba` (alpha), 8 s. Timeout bridge là 30 phút nên case UI
  chờ 900 s vẫn còn dư.

### 3.3. Harness click nhầm header section của BgRemovePanel (lỗi harness, đã sửa)

- Triệu chứng: 2 lần chạy BgRemovePanel đều timeout 900 s, bridge 0 job,
  không fetch, không msg panel.
- Nguyên nhân: có 2 nút khớp chuỗi "Xoá nền" — header section
  `▾ 🤖 Xoá nền AI` đứng TRƯỚC nút run `🤖 Xoá nền AI`. Probe cũ dùng
  `includes()` nên click trúng header (chỉ đóng/mở section, `run()`
  không chạy). Đây không phải bug app.
- Sửa trong probe: click khớp chính xác `text === '🤖 Xoá nền AI'`.
  Sau sửa, case PASS (§4.9).
- Bài học cho harness sau này: với panel dùng `<Section>`, luôn khớp
  chính xác text nút run, không dùng `includes()`.

## 4. Kết quả từng panel (banner thật, observer làm chuẩn)

### 4.1. StickerPanel — APNG 29,53 MiB: PASS

- Fixture: APNG thật 50 frame, tạo bằng ffmpeg (`testsrc2` + noise),
  đã verify chữ ký PNG và `acTL`.
- Observer: hashing 100% (29,5 MB) → storing → cleared. Poll `pcts`
  rỗng vì flash 100% chỉ ~2 ms — observer mới là bằng chứng.
- Lưu ý trung thực: với file ≤ 64 MiB, render hashing duy nhất là
  flash 100% ~1–2 ms — có thật trong DOM nhưng mắt người không đọc
  được thành tiến trình đang chạy (xem nợ mở §6).

### 4.2. StickerPanel — APNG 76,79 MiB (chẩn đoán): PASS

- Fixture: APNG thật 130 frame, cùng cách tạo.
- Poll bắt được `%` từng slice: 10, 20, 31, 41, 52, 62, 72, 83, 93
  (100% cũng render theo observer; poll dừng khi storing bắt đầu).
- Đây là case chứng minh `%` từng slice vẽ thật sau sửa §3.1.

### 4.3. MediaBin — APNG 29,53 MiB (chẩn đoán, không phải panel đợt 41): PASS

- Observer: hashing 100% render ~2 ms (ví dụ t=11731 hashing →
  t=11733 storing trong 1 lần chạy) → cleared. Xác nhận sửa §3.1 có
  tác dụng cả trên đường V5.

### 4.4. ProjectMenu — nhập bản nén: PASS (18.448 ms)

- Luồng: thêm clip2 vào timeline trước khi xuất (vì `exportArchive`
  chỉ đóng gói media mà spec tham chiếu — xem §5), xuất zip, verify zip
  trên đĩa (2.673.766 byte, manifest `files` chứa `media/clip2.mp4`),
  rồi nhập lại.
- Observer mới (cài lại ngay trước trigger nhập, tránh nhiễm từ import
  MediaBin trước đó): hashing 1/1 clip2.mp4 100% → storing → cleared.
- Lần PASS đầu của case này đã bị loại vì nhiễm observer + bin có sẵn
  nội dung; chỉ lần chạy lại này mới được tính.

### 4.5. TemplatePackModal — create: PASS (17.002 ms)

- Observer: hashing 1/1 `pack-title-card-bg-*.png` 274,9 KB 100% →
  storing → cleared. Pack tạo 1 file trong lần chạy này.

### 4.6. TemplatePackModal — makeTts: PASS (15.150 ms)

- Cùng phiên modal sau create. Observer: hashing 1/1 `tts-pack-*.wav`
  60,0 KB 100% → storing → cleared. Bridge TTS chạy được qua đường này.

### 4.7. ExportPanel — reframe: PASS (12.053 ms)

- Reframe thật qua bridge (venv OpenCV): clip2.mp4 8 s 720p → 9:16.
- Observer: hashing 1/1 `clip2_9x16.mp4` 940,6 KB 100% → storing →
  cleared; bin có file 9:16.

### 4.8. TtsButton — speak: PASS (chạy lại lần 3, 33.035 ms)

- Chẩn đoán lần FAIL: probe debug bọc `window.fetch` cho thấy POST
  `/api/tts` trả 200 sau 18,7 s, blob WAV đọc 200, rồi `.tts-msg` và nút
  speak cùng biến mất. Nguyên nhân: `speak()` gọi `addMediaAtPlayhead()`
  sau import — `execCommand` set selection sang clip audio mới →
  Inspector rời nhánh text → TtsButton unmount trước khi `setMsg(done)`
  kịp render. Dump cuối xác nhận clip được chọn là
  `tts-Hải Đăng-1793740682669.wav`, Inspector đã sang nhánh âm thanh.
- Kết luận: đây là đặc tính UX (thông báo "Đã thêm giọng đọc" không bao
  giờ hiện), KHÔNG phải lỗi banner. Tiêu chí case đã sửa thành: timeline
  có audio clip `tts-*` (chỉ xuất hiện sau khi `importFiles` resolve) +
  observer thấy banner + banner đã clear. Không sửa semantics selection
  của store (ngoài phạm vi luồng này).
- Bằng chứng PASS (lần 3): observer t=23315 hashing 100%
  (`tts-Hải Đăng-1793740682669.wav`, 202,5 KB) → t=23331 storing →
  t=23451 cleared; `binHasTts: true`, `tlTts: true`.

### 4.9. BgRemovePanel — run: PASS (chạy lại lần 3, 465.603 ms)

- Sau khi sửa click harness (§3.3), `bgremove.py` chạy thật trên bridge
  (session u2net, model đã tải trước), clip2 8 s 720p → 960×540 MOV
  PNG-alpha.
- Bằng chứng PASS: observer t=452289 hashing 100%
  (`clip2_no_bg.mov`, 34,7 MB) → t=452314 storing → t=452523 cleared;
  `binHasMov: true`. Flash hashing ~25 ms — vẽ được nhờ sửa §3.1 (file
  34,7 MB < 64 MiB nên thuộc nhánh one-shot).
- Chi phí CPU: toàn bộ case 465,6 s (~7,8 phút), phần lớn là bgremove
  trên CPU của VM này. Đây là chi phí thật, không phải lỗi.

## 5. Artifact của harness (không phải bug app)

- Tên file download: click tổng hợp qua CDP là untrusted nên Chrome bỏ
  qua thuộc tính `<a download>`, lưu export thành file `download`. Probe
  đổi tên thành `exported.vcut.zip` sau khi verify nội dung zip.
- Ngữ nghĩa export: `exportArchive` chỉ đóng gói media mà spec tham
  chiếu (`collectMediaSrcs`), không phải toàn bộ bin. Case archive phải
  thêm clip2 vào timeline trước khi xuất.
- Điều kiện hoàn thành đúng: banner **thấy-rồi-mất** (observer đã ghi
  banner, rồi banner biến mất). Chờ "bin có tên file" là sai vì
  `importFiles` thêm item vào bin TRƯỚC khi ingest chạy; chờ "banner
  vắng mặt" là sai vì nó đúng ngay cả khi banner chưa từng hiện.
- Click root của MediaCard không có tác dụng (root chỉ `draggable`,
  không có `onClick`); nút thêm là `.media-add` bên trong card.
- Tab nền ở headless-new không dispatch change sau `DOM.setFileInputFiles`
  — phải đưa tab lên foreground và chờ `visibilityState === "visible"`
  + `hasFocus()` trước khi set file (kế thừa từ W3).

## 6. Nợ mở (không claim)

- File > 128 MiB: chưa test trong luồng này (case lớn nhất là 76,79 MiB).
- Safari / Firefox / máy thật: chưa kiểm chứng.
- Flash hashing 100% ~1–25 ms cho file ≤ 64 MiB: có thật trong DOM
  nhưng không đọc được bằng mắt thường thành tiến trình; nếu muốn người
  dùng thấy `%` chạy, cần giữ banner tối thiểu (ví dụ min-display) —
  đó là quyết định UX, không làm trong luồng này.
- Thông báo done của TtsButton không bao giờ hiện (§4.8): cần quyết định
  UX riêng (ví dụ giữ msg ở cấp Inspector thay vì cấp panel, hoặc không
  đổi selection khi thêm clip TTS). Không sửa trong luồng này.
- Chi phí bgremove CPU: 366 s cho clip 8 s 720p → 960×540 u2net trên VM
  này; clip dài hơn sẽ lâu hơn tuyến tính.
- `vite build` vẫn bị chặn bởi xung đột tên workspace: luồng song song
  X1 tạo `apps/web-snapshot-x1` cùng tên package `@repo-1/web` nên build
  báo "must not have multiple workspaces with the same name" trước cả
  khi đọc config. Đây là xung đột có sẵn, không liên quan sửa của luồng
  này, và KHÔNG được xoá thư mục snapshot của X1. Thay thế kiểm chứng:
  vite dev phục vụ code mới (file đã transform chứa code `setTimeout`
  mới), `tsc --noEmit` 0 lỗi, và toàn bộ test hồi quy dưới đây xanh.
- File workflow `.github/workflows/ci-security.yml` vẫn chưa lên GitHub
  (403 quyền, nợ cũ từ đợt 41 W3) — ngoài phạm vi luồng này.

## 7. Kiểm chứng hồi quy (số thật, chạy lại sau mọi sửa)

- `tsc --noEmit` trong `apps/web`: 0 lỗi.
- Unit test (Node `--test`; test W3 bundle bằng esbuild ra `/tmp` vì
  import không đuôi mở rộng): relink40V5 6/6, relink39T5 11/11,
  relinkDedup38U3 7/7, assetStore 22/22, importAsset37T3 8/8,
  rehydrate36S5 19/19, importProgress41W3 4/4 — **tổng 77/77**.
- i18n không chạm: vi = en = 962 key, vi-only = en-only = 0.
- Click-test: 9/9 PASS như §2 và §4.

## 8. File đã đổi/thêm (đường dẫn tương đối repo, chỉ text, chưa push)

Đổi:

1. `apps/web/src/lib/ingestProgress39T5.ts` — yield 1 macrotask sau mỗi
   hashing progress event trong `hashBlobIncremental` (§3.1).
2. `apps/web/src/lib/assetStore.ts` — yield 1 macrotask sau event hashing
   100% nhánh one-shot trong `ingestWithProgress` (§3.1).
3. `server/bgremove/bgremove.py` — `feather_alpha`: bỏ lần pad hàng thứ
   hai trước blur dọc để output đúng shape đầu vào (§3.2).

Thêm:

4. `docs/PHASE9_ROUND42_X3_RELINK_PANELS_LIMITS.md` — chính tài liệu này.

Không đổi: file i18n JSON, `MediaBin.tsx`, `store.ts`,
`importProgressText41W3.ts`, mọi file panel `.tsx`, `apps/web/dist/`,
mọi binary. Probe click-test và fixture APNG chỉ nằm ở
`~/workspace/tmp-round42-x3/` (ngoài repo) và không được stage.

# Phase 9 đợt 42 — Đóng nợ đợt 41 (đợt lớn, 6 luồng, KHÔNG push)

Ngày: 04/11/2026 (giờ +07). Chốt chặn sạch: `round-in-progress.md`
KHÔNG tồn tại → lượt cron chạy bình thường. Trước đợt: 20 batch chờ
push (904 entry, các đợt 22–41; các đợt 1–21 đã push xong chiều 29/10).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist vào batch.
Mọi số timing đều under-load (6 luồng song song) hoặc gắn dist build
tạm — cấm dùng làm baseline quiet hay claim fps.

## 1. Chủ đề

Đóng nợ §5 của `docs/PHASE9_ROUND41_LIMITS.md` trong phạm vi làm
được ngay, không cần cửa sổ yên từ main chat. Hai mục cần cửa sổ yên
vẫn giữ làm nợ mở (§5.1, §5.2 dưới đây), không ép đóng.

## 2. 6 luồng song song

### X1 — settle-drop: bằng chứng browser cho tác nhân dọn lần thử lại

- Fixture suy biến (GOP hỏng, zero packet IDR ở 60 s): settle lúc
  decode bay giữ cache, lần thử lại cuối dọn thật: counter settled
  0→90 khớp chính xác cache sụt 227→137, badge TẮT, ui off.
  Đây là trường hợp suy biến có chủ đích — chứng minh lưới an toàn
  là thật, KHÔNG chứng minh nó thường dọn trong phát ngược bình
  thường (ở đó evict của W2 đã dọn thay).
- Không sửa production code nào. Test mới 7/7; hồi quy T4 11/11,
  V4 6/6, U1 12/12, W1 6/6.
- Chưa đo: GOP thưa > 32 MiB qua Range (trùng X4, không làm trùng),
  đường `asset:`, tab ẩn. Xem `docs/PHASE9_ROUND42_X1_SETTLE_CLEANUP_LIMITS.md`.

### X2 — pause t=0: cap seek-timeout / seek-error (mới)

- Xác định đúng đường lỗi: nhánh else của seek pause reset
  `lastRequested` → tick sau request lại → lặp vô hạn, mỗi vòng
  ~1,28 s; cap W2 không chặn được đường này vì media hỏng dạng này
  không tới được đường render-retry.
- Cap mới: 10 lần seek thất bại liên tiếp cho cùng playhead.
  Media cắt ngắn chạm đúng 10 sau 12,1 s rồi vòng lặp NGỦ với trạng
  thái lỗi rõ ràng (`exhausted`, kind `"timeout"`, target 2,5),
  ticks đứng yên 501 suốt 30 s. Clip lành scrub cùng vị trí vẽ
  được, đếm 0. Bẫy đã bắt bằng test: reset cap vô điều kiện ở
  nhánh request-seek mới sẽ xóa đếm mỗi retry cùng t — đã sửa bằng
  `seekFailureTarget` (retry cùng t giữ đếm, t mới mới reset).
- Test mới 22/22; hồi quy pauseDraw W2 13/13, V3 11/11, holdFrame
  13/13, seek 15/15, reversePlayback T6 10/10, L2 17/17 (tổng với
  test mới 101/101 theo báo cáo luồng).
- Chưa đo: kind `"error"` (ok=false) trên browser — cả hai biến thể
  hỏng thật đều đi kind `"timeout"`; phục hồi sau cạn cap khi
  element kẹt seeking (scrub sang t mới reset đếm đúng nhưng element
  vẫn kẹt — cần cơ chế tạo lại element trong pool, nợ riêng).
  Xem `docs/PHASE9_ROUND42_X2_PAUSE_SEEK_CAP_LIMITS.md`.
- Lưu ý cho bước gộp: luồng X2 kết thúc mà không để lại báo cáo
  cuối (handoff rỗng), nhưng LIMITS + code + test đều nằm trên đĩa
  và đã được parent kiểm chứng lại độc lập (xem §3) — không cần
  chạy lại luồng.

### X3 — relink: click-test banner % từng panel + 2 bug thật đã sửa

- Click-test Chromium headed 9/9 PASS (7 panel đợt 41 + 2 case chẩn
  đoán), ground truth là MutationObserver trong trang.
- Bug 1 (đường chung): hashing `%` không bao giờ vẽ cho import
  nhanh — file ≤ 64 MiB chỉ có 1 event hashing 100% bị React batch
  chung với render `storing`. Sửa: yield 1 macrotask sau mỗi
  progress event (`hashBlobIncremental`) và sau event 100% nhánh
  one-shot. Sau sửa: file 76,79 MiB cho `%` từng slice thật
  (10, 20, 31, 41, 52, 62, 72, 83, 93).
- Bug 2 (ngoài khu vực hẹp nhưng chặn đúng panel được giao):
  `feather_alpha` trong `server/bgremove/bgremove.py` trả sai shape
  khi feather > 0 (H+2r hàng) — đã bỏ lần pad hàng thứ hai; kiểm
  chứng cô lập mọi shape/bán kính + end-to-end bridge HTTP 200,
  output PNG-alpha 960×540.
- Hồi quy 77/77; i18n vi = en = 962 key. Flash hashing 100% cho
  file ≤ 64 MiB chỉ ~1–25 ms — có thật trong DOM nhưng mắt người
  không đọc được thành tiến trình (nợ UX min-display, không làm).
  Xem `docs/PHASE9_ROUND42_X3_RELINK_PANELS_LIMITS.md`.

### X4 — GOP: headed end-to-end + chia sẻ kết quả probe vào T3

- Headed thật (Chromium, file 35,38 MiB, B-frame + audio AAC xen
  kẽ, chưa biết size từ đầu, GOP bật tường minh): lượt đầu 63
  request = 1 HEAD (chỉ của probe) + 62×206, 0 GET toàn file, vẽ
  ngược 91 frame missing 0, canvas 100% pixel khác 0; cửa sổ lặp
  cùng mốc 0 request / 0 byte (tiết kiệm đúng 37.100.156 byte so
  với tải lại). Lượt đầu vẫn 101,16% file — KHÔNG claim tiết kiệm
  ở lượt đầu. Mặc định TẮT giữ nguyên (headed: 1 GET toàn file,
  vẽ ngược vẫn 91 frame).
- Chia sẻ probe: T3 nhận `sharedSizeProbe`, bỏ HEAD khi size khớp;
  controller chưa biết size nay tốn 1 HEAD thay vì 2 (Node + headed
  đều chứng minh); size lệch / không hợp lệ / không truyền probe →
  HEAD lại như cũ (fail-safe). Ngưỡng 32 MiB, trần 128 MiB, mặc
  định TẮT giữ nguyên; > 128 MiB vẫn khóa.
- Test mới 10/10; hồi quy W4 15/15 (kỳ vọng HEAD 2→1, hệ quả đúng
  của việc chia sẻ), T3 10/10, V2 16/16.
  Xem `docs/PHASE9_ROUND42_X4_GOP_E2E_LIMITS.md`.

### X5 — probe v2: bằng chứng runtime chuỗi solo→Q6→N2 + trần 1000 mẫu

- Chuỗi thật với `N2_PERSEEK=1` (không phải phiên solo A/B):
  solo env giữ đủ cờ, Q6 labeled absent trường `perSeek` đúng
  thiết kế (nợ V1 §4.3 vẫn mở), N2 log `perSeek: 32 entries
  (reverse 11)`, report `status=present`, validate 32/32 sạch →
  CHAIN-OK. Mẫu flat vẫn 0 lần; mẫu stall sau seeked kiểu k=22 của
  W5 không tái hiện — càng củng cố quyết không thêm nhãn của W5.
  Lỗi gặp dọc đường: REPO tính 2 cấp gây `apps/apps/...` (đúng lỗi
  đợt 38) — đã sửa thành 3 cấp, số đo sạch từ lần chạy thứ hai.
- Stress trần 1000 (pure logic, vm fake — không mạo nhận số
  Chrome): 1200 tick seeking → giữ đúng 1000 mẫu đầu,
  `droppedSeekingSamples=200`, giữ + đếm = 1200, không mất lặng lẽ,
  không crash; trần theo entry, không toàn cục. Trên Chrome thật
  max chỉ 42 mẫu/entry — trần 1000 vẫn chưa chạm.
- Test probe 21/21 (18 cũ + 3 mới); hồi quy solo 16/16, gate v3
  13/13. Xem `docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md`.

### X6 — cổng CPU: hỏi RAM trước hỏi busy, không nới ngưỡng

- Thứ tự đánh giá/báo cáo đảo thành RAM → load → busy; báo cáo
  nêu rõ gate trượt đầu tiên kèm số đo. Hai lần chạy thật đều
  exit 2, `locked: false`, RAM 17,5–18,6% < 20% (load đạt) →
  `firstFailedGate: "memAvailable"`; busy CHƯA được đánh giá khi
  cổng trượt (chỉ hỏi sau khi cổng yên đạt).
- KHÔNG thêm biến môi trường override ngưỡng (test khóa: đặt thử
  vẫn không đổi mặc định 0,2) — đổi ngưỡng sau này phải là đổi code
  + ghi LIMITS. Test mới 8/8; hồi quy W6 11/11, diag 17/17, cổng T6
  8/8. Xem `docs/PHASE9_ROUND42_X6_CPU_RAM_FIRST_LIMITS.md`.

## 3. Kiểm chứng gộp của parent (chạy lại độc lập)

- Đối chiếu baseline hash đầu đợt: đúng 13 file đổi + 14 file mới,
  khớp chính xác hợp 6 danh sách LIMITS (0 file lạ, 0 file mất).
  Loại khỏi batch: `server/bgremove/__pycache__/bgremove.cpython-312.pyc`
  (artifact biên dịch, không phải source) và `apps/web/dist/`
  (build lại lúc kiểm chứng, theo tiền lệ). Thư mục
  `apps/web-snapshot-x1` của X1 đã được dọn (X3 từng bị chặn build
  vì trùng tên workspace trong lúc snapshot còn tồn tại).
- File chung nguyên vẹn: `preview.tsx` đủ 12 marker ROUND42-X2;
  `tsconfig.json` đủ 3 dòng exclude mới (X1, X2, X4);
  `reverseWebcodecs.ts` chứa hunk X4.
- `tsc --noEmit` 0 lỗi; `vite build` pass (4,91 s, chỉ cảnh báo
  chunk > 500 kB cũ).
- Chạy lại test: X1 7/7, X2 22/22, X4 10/10, W4 15/15, T3 10/10,
  V2 16/16, W2 13/13, W3 4/4, assetStore 22/22, .mjs probe + X6 + W6
  40/40 (fail 0). Lưu ý: importProgress41W3 chạy bundle CJS lỗi
  `import.meta` rỗng — lỗi cách chạy, không phải code; chạy lại
  dạng ESM thì 4/4 pass (cùng lớp lỗi format đã ghi ở đợt 41).
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của
  các luồng, phiên solo thật, đo IDB thật, click-test X3 từng panel
  (chỉ đối chiếu LIMITS + test unit/hồi quy chạy lại được).

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round42-closing-debts41.txt`
  (27 file text, NUL-delimited, không binary, không dist, không
  pycache; đã verify read-back 27 entry + mọi file tồn tại)

## 5. Nợ mở cho đợt 43

1. **Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat** (X5/X6): kiểm tra
   `perSeekProbe.status` lúc đầu phiên (nay có cơ sở kỳ vọng
   `present`); chạy wrapper X6 → U4 đầy đủ rồi mới quyết khóa/sửa/
   loại ngưỡng CPU theo khung W6; hỏi RAM trước hỏi busy; quy tắc
   nhãn §4.3 của W5 vẫn là ứng viên, mẫu flat vẫn chưa quan sát được.
2. **Settle-drop:** GOP thưa > 32 MiB qua Range (headed), đường
   `asset:` (cần project + rehydrate IDB), tab ẩn.
3. **Pause t=0:** kind `"error"` (ok=false) chưa có bằng chứng
   browser; phục hồi sau cạn cap khi element kẹt seeking (tạo lại
   element trong pool); Safari/máy thật chưa đo.
4. **Relink:** file > 128 MiB; Safari/Firefox/máy thật; banner
   min-display cho file ≤ 64 MiB (quyết UX); thông báo done của
   TtsButton không bao giờ hiện (quyết UX riêng).
5. **GOP:** quyết mở lại > 128 MiB cần đo heap browser headed trên
   file 128 MiB+ thật; moov 16 MiB thật; headed qua route bridge
   Express thật (harness X4 dùng server node:http tối giản);
   Safari/máy thật/màn hình vật lý.
6. **Probe v2:** trần 1000 mẫu trên Chrome thật vẫn chưa chạm;
   Q6 labeled chưa mang perSeek (để luồng sở hữu Q6).
7. **Chung:** mọi số timing đợt 42 đều under-load hoặc gắn dist
   build tạm — cấm dùng làm baseline quiet hay claim fps.

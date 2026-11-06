# Phase 9 đợt 31 — Đóng nợ đợt 30: seek, fps ngược, CLI caption/tts, toast Lưu file, snapshot CDP, hiệu chuẩn dip — LIMITS tổng hợp

> Đợt lớn 6 luồng song song (N1–N6), KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Kiểm chứng gộp của parent (chạy lại độc lập,
> không lấy số của luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi
> (web), `vite build` pass (4,56s), seek.test 13/13, saveToast31
> 15/15, transitionPreview 31/31, CLI caption-tts 27/27, error-detail
> 56/56, i18n vi = en = 913 key lá, 0 key mồ côi, `node --check` các
> script mới của N2/N5/N6 pass. File build phụ (dist, *.tsbuildinfo)
> KHÔNG đưa vào batch. KHÔNG chạy lại ở bước gộp: mọi phép đo browser
> headed / FPS của N1/N2/N4/N5/N6 — đó là số đo của luồng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **N1 sửa 2 bug seek** (`docs/PHASE9_ROUND31_N1_SEEK_FIX_LIMITS.md`):
  `seek.ts` so chỉ số frame đã làm tròn thay vì epsilon giây (bug lùi
  đúng 1 frame luôn bị bỏ seek); `preview.tsx` chỉ vẽ/đánh dấu đã vẽ
  khi `timedOut === 0`, timeout thì reset để tick sau retry; chặn
  thêm trường hợp Chrome báo `currentTime = target` trong khi vẫn
  `seeking` (nguyên nhân DARK-FIRST dưới tải). Probe M1 đầy đủ 11/11
  KHỚP bằng browser thật, hồi quy K3 18/18 KHỚP, unit seek 13/13.
- **N2 fps ngược lúc máy rảnh** (`docs/PHASE9_ROUND31_N2_REVERSE_FPS_LIMITS.md`):
  Không hồi quy: GOP thưa 8,97 fps (đợt 28: 7,79), GOP dày 18,42 và
  24,05 fps (đợt 28: 23,2, nằm trong khoảng dao động). Cơ chế chạy
  chậm dưới tải đã chứng minh bằng probe rAF (tải có kiểm soát:
  0,760×, P50 gap 78,8 ms so với 8,3 ms lúc rảnh; mô hình clamp
  dt 0,1s dự báo 0,81–0,83×). Không sửa code sản phẩm.
- **N3 CLI caption/tts pipe + redact** (`docs/PHASE9_ROUND31_N3_CLI_CAPTION_TTS_LIMITS.md`):
  Áp mẫu M3 cho caption/tts (`cli/src/streamedWorker.ts` mới, stdout
  inherit, stderr pipe + redact theo dòng, exit code giữ nguyên);
  sửa kèm dòng CLI caption in `srcAbs` tuyệt đối → chỉ basename.
  Test mới 27/27 qua CLI thật (clip hỏng thật, shim exit 3/5).
  `render.ts` cố tình không refactor sang helper mới để tránh hồi
  quy đường đã kiểm chứng đợt 30.
- **N4 toast Lưu file có cấu trúc** (`docs/PHASE9_ROUND31_N4_SAVE_TOAST_LIMITS.md`):
  `StructuredNote { code, params, fallback }` cho 7 code
  (blobUrl, motionMigrated, motionMigratedHint, legacyEnvelope,
  formatVersionMismatch, schemaMigrated, textStyleFixed); chuỗi
  warnings cũ giữ song song. i18n +14 key, 913 = 913. Test mới
  15/15, hồi quy 160 xanh theo luồng, click-test browser thật 7/7.
- **N5 nối cdp-snapshot vào harness còn lại** (`docs/PHASE9_ROUND31_N5_CDP_SNAPSHOT_LIMITS.md`):
  32/32 script pipe còn lại (J6, spinnerprobe, I6, dip, measure
  v19–v24, headed-fps…); parent đã đối chiếu: cả 32 file đều chứa
  `cdp-snapshot`, kể cả file harness N2 (nỗi lo N2 ghi đè sau khi N5
  nối đã không xảy ra — wiring vẫn còn, harness N2 vẫn nguyên).
  Probe treo giả lập 4/4 target PASS, hồi quy J6 17/17. Chưa nối:
  `bench-preview-fps.mjs`, `check-proxy-auto.mjs` (WebSocket, không
  phải pipe), `mobile-touch-check.mjs` (không có timeout để nối).
- **N6 hiệu chuẩn trọng số dip** (`docs/PHASE9_ROUND31_N6_DIP_WEIGHTS_LIMITS.md`):
  `fadeDipWeights` chuyển từ smoothstep sang nội suy tuyến tính qua
  nút p cách 0,05 + kẹp bB = 0 tới p = 0,12. Ô lệch đợt 30 (FW/FG
  phẳng localT = 0,75) từ 5,00 LỆCH → 1,33 KHỚP trên lưới exact-p;
  thí nghiệm chéo màu mới + footage không hồi quy tier nào. Không
  đổi mô hình — vẫn mô hình đơn clip + badge `matched`.

## 2. Sửa / đối chiếu của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Đối chiếu file chung: `tsconfig.json`
  chứa cả 2 exclude mới (seek.test, saveToast31.test); `App.tsx`/
  `ProjectMenu.tsx` chỉ có hunk N4; `preview.tsx` chỉ có hunk N1;
  `transitionPreview.ts` chỉ có hunk N6; file harness N2 giữ cả
  probe rAF của N2 và wiring snapshot của N5.
- Không file .raw/scratch trong repo; dist không stage.
- K6 guard 7/8 của N5: parent xác nhận case K1 fail KHÔNG phải hồi
  quy do N5 — script k6diag không bị N5 đụng, log không có dòng
  CDP-HANG, 0 exception. Thực chất là kỳ vọng baseline của harness
  đã lỗi thời: nó đòi message OutOfRange cho ô trống, trong khi
  message thật "Chưa nhập mốc ngoài (ô đang trống) — không tách."
  chính là câu báo đã sửa có chủ đích ở đợt 27 (K6). Xem nợ §3.5.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **N6 — bar hiệu chuẩn:** bộ trọng số mới đạt theo thang verdict
   của M6 (không tier nào tụt: KHỚP vẫn KHỚP), nhưng KHÔNG đạt nếu
   áp bar nghiêm ngặt "không tăng MAD ở bất kỳ ô nào": 3 ô tăng MAD
   dưới ngưỡng vẫn giữ KHỚP (FW/FG phẳng gốc 0,9: 0,33→1,00; xfade
   đơn màu mới fadeblack p = 0,8: 0→0,67; fadegrays p = 0,6:
   0,33→1,00; footage 0,9: +0,15). Nếu đợt sau áp bar nghiêm ngặt,
   chỉ cần revert 1 hàm `fadeDipWeights`.
2. **N6 — điều kiện (a) của M6 chỉ đóng trên lưới exact-p:** trên
   lưới 30fps cũ, ô FW/FG 0,75 vẫn chỉ 3,33 XẤP XỈ vì lưới cũ chọn
   frame n = 113 ứng với p thật 0,7667/0,2667 chứ không phải
   0,75/0,25 — đó là lỗi chọn frame của harness, không phải lỗi
   trọng số; muốn lưới cũ KHỚP phải sửa harness chọn frame, không
   vặn thêm trọng số. Điều kiện (b)(c)(d) của M6 vẫn mở, nên chưa
   đủ căn cứ đổi model cặp.
3. **N1 — dưới tải nặng:** 2/3 probe tải nhân tạo lệch ở lần đo đầu
   (canvas giữa seek, không phải nền) nhưng tự hội tụ về đúng frame
   sau idle — triệu chứng "đen vĩnh viễn" đã hết, nhưng cửa sổ đo
   ~6s đóng trước khi seek 4,6s xong nên chưa chứng minh hội tụ
   trong mọi cửa sổ đo. Nhánh phát xuôi 0,35s và phát ngược
   stepping vẫn chưa đo; tỉ lệ gặp bug trên máy thật / GOP dày /
   Safari chưa đo; seek không bao giờ xong (retry vô hạn nhịp
   ~1,2s) chưa đo dài hạn.
4. **N3 — đường success chưa kiểm chứng trên máy này:** python3 hệ
   thống thiếu `faster_whisper` và `vieneu` nên success caption/tts
   thật chưa chạy được; chỉ có đường hỏng thật + shim. Cần chạy lại
   trên máy đủ package trước khi coi success là xong hoàn toàn.
5. **N5 — K6 K1:** cập nhật kỳ vọng baseline của harness K6 cho ô
   trống theo message đã sửa đợt 27, rồi chạy lại K6 cho 8/8. Lần
   treo thật có snapshot vẫn chưa xảy ra; tọa độ spinner tuyệt đối
   trên máy user vẫn chưa đo; snapshot nhóm không có SCRATCH nằm
   ở /tmp nên kém bền.
6. **N4 — còn thô:** notes thô bên trong `motionMigrated` vẫn tiếng
   Việt ở bản en (thuộc packages/video-spec, ngoài phạm vi); chuỗi
   thiếu media của archive vẫn thô (chưa có dạng cấu trúc); toast
   lỗi ProjectMenu chưa click-test được (file chooser native);
   blob trong nested không được quét (giới hạn kế thừa, đã khóa
   bằng test); nội dung errorDetail của bridge vẫn tiếng Việt.
7. **N2 — còn nợ:** 30 fps ngược thật vẫn cần WebCodecs + demux +
   cache frame; phương sai fps ngược GOP dày lớn (±~25% giữa 2 lượt
   rảnh) nên đợt sau chạy lặp và báo khoảng, không báo 1 số; gap
   rAF riêng vòng preview cần hook trong preview.tsx.
8. **N6 — bonus đã đo / còn nợ:** inline vòng dip trên browser thật
   nhanh hơn 2,3–2,7× và pixel-identical (MAD 0,0000), nhưng số
   tuyệt đối không so được với số headed của M6 (khác Chromium/tải/
   cách cấp buffer). Blur ở p/mode/weights khác vẫn chưa đo (chỉ có
   p = 0,5, FW-IN, weights [1,1,1] frames 3).
9. **Nợ cũ vẫn còn:** tab ẩn hàng giờ / discard thật / máy thật (từ
   đợt 24); kho dọc vẫn thiếu cảnh quay thuần ngoài vũ trụ; Safari /
   máy thật / dpr > 1 / viewport khác chưa đo cho dip; D7 autosave
   sau load vẫn không gắn style vào clip top-level (chưa quy kết
   chắc chắn cho một lớp code cụ thể).

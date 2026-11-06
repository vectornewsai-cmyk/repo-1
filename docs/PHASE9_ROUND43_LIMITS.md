# Phase 9 đợt 43 — LIMITS tổng hợp (gộp muộn bởi lượt cron 14:03 04/11)

## 0. Bản chất của tài liệu này — ĐỌC TRƯỚC

Đợt 43 chạy từ main chat sáng 04/11/2026 với 6 luồng Y1–Y6
(LIMITS từng luồng ghi 01:32–01:59 UTC, tức 08:32–08:59 giờ +07).
Bước gộp của parent chưa từng xảy ra: không có LIMITS tổng hợp,
không có mục log đợt 43, chỉ có batch stage riêng của Y6
(`phase9-round43-y6-compat.txt`, 8 file). Lượt cron 14:03 04/11
KHÔNG làm lại code đợt 43 mà đóng vai parent gộp muộn, theo đúng
mẫu đợt 38 (xem log đợt 38). Mọi số dưới đây hoặc lấy từ LIMITS
từng luồng, hoặc do 3 luồng kiểm chứng chỉ-đọc V1–V3 chạy lại
độc lập trong lượt này. KHÔNG push, KHÔNG tag/release, KHÔNG binary.

## 1. Nội dung 6 luồng (từ nợ mở đợt 42 §5)

- **Y1 settle** (`PHASE9_ROUND43_Y1_SETTLE_LIMITS.md`): đo headed
  GOP thưa > 32 MiB qua Range (SUCCESS), đường `asset:` (PARTIAL —
  nhánh thử lại riêng chưa bắt được sau 8 attempt), tab ẩn (1 lần
  SUCCESS). Không sửa production code. Test mới 14/14 (V1 chạy lại).
- **Y2 pause recovery** (`PHASE9_ROUND43_Y2_PAUSE_RECOVERY_LIMITS.md`):
  phục hồi sau cạn cap khi element kẹt seeking: `planSeekRecovery`
  thuần + `MediaPool.dropElement` + 9 hunk `// ROUND43-Y2` trong
  `preview.tsx` (drop actives 1 lần, phơi idleDebug). Test 9/9
  (V1 chạy lại). Nợ: kind `"error"` chưa có bằng chứng browser;
  lỗi ngủ/branch guard khi scrub về đúng t đã vẽ (ngoài phạm vi Y2).
- **Y3 relink** (`PHASE9_ROUND43_Y3_RELINK_LIMITS.md`): banner import
  giữ tối thiểu 500 ms (`IMPORT_BANNER_MIN_DISPLAY_MS`), toast done
  của TtsButton qua toast toàn cục thay vì `setMsg`. Test 5/5
  (V2 chạy lại, đúng cách là esbuild bundle `--format=esm` — header
  test ghi strip-types trực tiếp là sai cách chạy vì dependency
  `gopCache40V2.ts` dùng parameter properties). Nợ: file > 128 MiB
  cho relink; Safari/Firefox/máy thật; toast TTS thiếu hậu tố giây
  khi bridge không trả `X-TTS-Duration`.
- **Y4 GOP** (`PHASE9_ROUND43_Y4_GOP_LIMITS.md`): đo heap headed
  (file 141,52 MiB → luật ngoại suy 1,09×, chỉ 1 điểm đo), headed qua
  bridge thật, và CORS bridge expose thêm `Accept-Ranges` /
  `Content-Range` (origin vẫn chỉ loopback, không mở thêm dữ liệu).
  PHÁT HIỆN: moov > 512 KiB vẫn fallback — nhánh fetch moov riêng
  của T3 + trần 16 MiB là code chết với tiền tố mặc định; sửa cần
  thiết kế lại, thuộc đợt sau. Test 10/10 (V2 chạy lại). Ngưỡng
  32 MiB / trần 128 MiB / mặc định TẮT KHÔNG đổi.
- **Y5 probe** (`PHASE9_ROUND43_Y5_PROBE_LIMITS.md`): tầng Q6 nay
  mang `perSeek` (present/present-null/absent), `buildLabeled`
  export + passthrough; chuỗi solo→Q6→N2 CHAIN-OK với
  `q6PerSeekMatchesN2 = true`; trần 1000 mẫu chạm thật trên Chrome
  thật (3/3 entry, dropped 339/225/311). Test 4/4 mới, bộ cũ 50/50,
  tổng 54/54 (V3 chạy lại). Nợ: phiên solo A/B thật + phiên quiet
  vẫn chờ cửa sổ yên từ main chat; trần 1000 trong app VCut thật
  chưa đo; ghi chú "GOP 300" trong LIMITS cũ cần đính chính tập trung.
- **Y6 compat** (`PHASE9_ROUND43_Y6_COMPAT_LIMITS.md`, đã stage
  riêng): audit feature-detection toàn đường reverse-preview, sửa
  2 guard thiếu thật (decodeGop throw → fallback, AbortController
  vắng → false); headed Chromium 5/5, Node 11/11 (V3 chạy lại
  11/11). Safari/Firefox/máy thật CHƯA ĐO — mọi kết luận về chúng
  chỉ là suy luận từ guard, không phải số đo.

## 2. Kiểm chứng gộp của parent (lượt này, độc lập)

- 3 luồng kiểm chứng chỉ-đọc V1 (Y1+Y2), V2 (Y3+Y4), V3 (Y5+Y6):
  Y1 14/14, Y2 9/9, Y3 5/5, Y4 10/10, Y5 4/4 (+ bộ cũ 50/50 = 54/54),
  Y6 11/11 — tất cả khớp claim từng luồng, fail 0.
- Đối chiếu marker: preview.tsx đủ 9 hunk `// ROUND43-Y2`,
  media.ts 1 hunk `dropElement`, bridge đúng 1 hunk `// ROUND43-Y4`,
  Y5 marker đủ (3 + 4), Y6 marker đủ (1 + 4 + 1 + 3).
- Đối chiếu đĩa: toàn bộ file Y1–Y5 trong batch gộp đều tồn tại,
  text, không binary, không dist; grep `ROUND43-Y` không phát hiện
  file lạ ngoài các file Y6 đã stage. Không còn thư mục `~` lạc
  trong repo (V3 tạo nhầm lúc chạy esbuild, đã xóa ngay).
- Parent tự chạy: `tsc --noEmit -p apps/web/tsconfig.json` 0 lỗi
  (lỗi tsc lúc Y2/Y4 kiểm tra nay đã hết vì tsconfig đã exclude đủ
  file test mới), `vite build` pass (5,67 s).
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của
  các luồng, phiên solo thật, đo IDB thật, click-test headed Y6
  (chỉ đối chiếu LIMITS + test Node).
- Sửa của parent ở bước gộp: không sửa logic luồng nào; chỉ viết
  tài liệu này, file paths gộp và mục log. Batch Y6 đã stage trước
  giữ nguyên; batch gộp này chứa cả `preview.tsx` và `tsconfig.json`
  (Y2 sửa sau thời điểm Y6 stage) nên nội dung cuối khi push vẫn
  đúng dù thứ tự push đổi — 2 file này xuất hiện ở cả 2 batch là
  có chủ ý, không phải đếm trùng nội dung.

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round43-mainchat-merge.txt`
  (26 file text, NUL-delimited, không binary, không dist, đã verify
  read-back 26 entry + mọi file tồn tại) — gộp Y1–Y5 + LIMITS này.
- Batch Y6 riêng đã có từ trước:
  `phase9-round43-y6-compat.txt` (8 file).
- Tổng batch đang chờ user push sau đợt này: 23 file paths /
  965 entry (939 đợt 22–43 trước đó gồm Y6, + 26 đợt gộp này;
  các đợt 1–21 đã push xong chiều 29/10).

## 4. Nợ mở cho đợt 44 (gộp từ § nợ của Y1–Y6)

1. **Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat** (nợ gốc từ đợt 42, nay có cơ sở
   kỳ vọng `perSeekProbe.status = present` cả ở tầng Q6).
2. Settle-drop: nhánh thử lại riêng trên đường `asset:` cần ý tưởng
   mới (không nới tiêu chí SUCCESS); tab ẩn kéo dài; vỏ UI
   `.vcut.json` + vòng draw/toggle cho clip `asset:` chưa click-test.
3. Pause: sửa lỗi ngủ/branch guard khi scrub về đúng t đã vẽ sau
   cạn cap; quirk Chrome seek-landing-0 trên file hỏng; rò rỉ node
   AudioEngine nhỏ khi drop element.
4. Relink: file > 128 MiB; banner min-display cho file ≤ 64 MiB
   (quyết UX); toast TTS thiếu hậu tố giây.
5. GOP: quyết mở lại > 128 MiB cần đủ 3 điều kiện (T3 streaming,
   đo RSS + VideoFrame native, lặp ở cửa sổ quiet); thiết kế lại
   fetch moov riêng (moov > 512 KiB hiện fallback); đo heap ở biên
   129 MiB và 256 MiB+; headed qua route bridge Express thật.
6. Probe: trần 1000 trong app VCut thật (seek 40 s dưới mạng chậm,
   seek kẹt trên máy quiet); đính chính "GOP 300" trong LIMITS cũ;
   race copy frozen-dist của chain script.
7. Compat: Safari/Firefox/máy thật/màn hình vật lý (ma trận Y6 §8
   để tick); badge engine chưa qua i18n; badge = đường đã chọn,
   không phải đường vẽ từng frame; guard `importFiles` khi IDB vắng
   chưa có test runtime app-level; probe `isConfigSupported` trước
   `configure` chưa làm.
8. Chung: mọi số timing đợt 43 đều under-load hoặc gắn build tạm —
   cấm dùng làm baseline quiet hay claim fps.

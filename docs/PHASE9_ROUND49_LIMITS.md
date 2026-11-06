# Phase 9 — Đợt 49: đóng nợ đợt 48 (gộp muộn — LIMITS tổng hợp)

## 0. Bản chất đợt này (đọc trước khi trích dẫn)

- Đợt 49 chạy 05–06/11/2026 với 6 luồng E1–E6, KHÔNG push, KHÔNG tag/release, KHÔNG binary.
- Bước gộp của parent CHƯA từng xảy ra trước lượt cron 08:03 06/11: không có LIMITS tổng hợp đợt 49, không có mục log đợt 49, không có file paths đợt 49 trong `paths-loop/` — chỉ có 6 file LIMITS riêng của từng luồng và một mục log riêng của luồng E5.
- Lượt này KHÔNG làm lại code đợt 49 mà đóng vai parent gộp muộn (cùng mẫu đợt 19/25/32/38/43): kiểm chứng độc lập toàn bộ claim, đối chiếu file đổi với baseline đầu đợt, rồi mới stage + log.
- Đính chính E5: lúc E5 chạy `tsc --noEmit` báo 9 lỗi ở `ttsEstimate49E1.test.ts` là trạng thái giữa chừng (E1 đang sửa dở); parent chạy lại cuối đợt: **tsc 0 lỗi**.

## 1. Nội dung 6 luồng (tóm tắt, số thật)

- **E1 TTS theo giọng (per-voice):** đo 13 mẫu × 2 lần chạy + 2 CLI qua `tts.py` thật (WAV ở `/tmp/tts49e1`, backup số đo ở `hidden_files/tts49e1/`). Bảng hệ số theo giọng: 14 giọng normal, 6 giọng dense; TtsButton truyền voice đang chọn vào helper E1 (clone → fallback hệ số gộp). PHÁT HIỆN: Mỹ Duyên phương sai 11,5% (n=8); tốc độ tổng hợp 0,12–0,65× realtime (median 0,32×), mâu thuẫn con số "~1,5–2,5×" trong memory — chưa rõ nguyên nhân, không sửa memory. Test mới E1 **13/13**; hồi quy C4 10/10, D1 12/12, B3 7/7, A3 10/10, Z3 9/9, relinkEdge 12/12.
- **E2 gate GOP trên blob URL:** bằng chứng 206 đã kiểm chứng thay cho header `Accept-Ranges` vắng (blob URL không trả header đó — nguyên nhân D4 phát hiện GOP không bao giờ bật cho file import local). Headed app thật 16/16 (2 lần chạy; 1 lần flake 14/16 dưới tải nặng song song, không tái hiện). Đỉnh JS-heap transient của GOP +81,5 MiB, cao hơn đường tải toàn file (+37,7 MiB) — nợ đợt 50. i18n nút "Phát ngược" K4: +2 key, parity vi=en=**973**. Test mới 8/8 + 3/3.
- **E3 đuôi flush settle-drop (đường `asset:`):** hướng (b) resolve sớm khi đủ frame — sửa `decodeGop` (`expectedNew` + điều kiện resolve sớm) + vá tác dụng phụ ở `disableDecodeAhead`; hướng (a) toggle sớm bị bác bằng số đo (gap tb 422,8 ms, 0/6 SUCCESS). **SUCCESS đường `asset:` ĐÃ ĐÓNG: 6/6 `SUCCESS-early-settle`** (phạm vi hẹp: 1 fixture 360p GOP 90, slack 3, loadavg thấp). Điều tra Q1: chunk delta thứ 2 ném "key frame required" do IDR zero làm convert AVCC→AnnexB thất bại. Test mới 6/6 + 11/11.
- **E4 bug volumeKeyframes null + củng cố vòng lặp preview:** sanitize keyframe arrays ở cổng load (`parseProjectText`, `sanitizeKeyframeArrays` + `sanitizeOneKeyframedValue`, `LoadResult.keyframeFixes?`) + bọc tick preview bằng try/catch (`loop` → `tickInner` + wrapper, `idleDebug.tickErrors`). Quirk đáp sai frame khác 0: hướng mới (keyframe 1.0 hỏng, file 2 track video) đều không đáp sai — Chrome 156 luôn hoặc đáp đúng, hoặc hỏng pipeline error 3. Test mới **13/13**.
- **E5 probe filmstrip + fingerprint + trần 1000 trên B-frame:** filmstrip Timeline chạy thật qua `captureFrame` (10/10 entry, k=2–11, không mốc nào = 0); fingerprint `elementIdOf` — entry sau drop mang đúng id 11, khác id 0 đã drop (`fingerprintOk = true`). Trần 1000 trên footage không B-frame: 964 mẫu giữ + 0 dropped (hụt 36 — trần là cuộc đua thời gian seeking × tốc độ rAF, không phải giới hạn vận hành chắc chắn). Trần 1000 trên footage B-frame: KHÔNG ĐO ĐƯỢC bằng flow episode (seek B-frame "xong" ở tầng demuxer trong ~1 s trong khi frame thật không tới; vòng lặp ngủ vì cạn cap thử-vẽ-lại). Test mới **9/9**.
- **E6 loadSample case D + unit test Node:** refactor `loadSample` sang `LoadSampleQueue` thuần (coalesce + retry có điều kiện, giữ nguyên hành vi từng dòng — đối chiếu trong LIMITS E6 §5); case D browser thật đỏ-trước 3/5 × 3 lượt, xanh-sau 5/5 × 4 lượt; hồi quy race C1 7/7 × 3, D6 7/7 × 4. Test mới **13/13**.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập, lượt cron 08:03 06/11)

- Đối chiếu baseline đầu đợt (`hidden_files/round49-baseline.sha256`): đúng **19 file đổi + 25 file mới**, khớp chính xác hợp 6 danh sách LIMITS (0 file lạ, 0 file thiếu, không binary, không dist, không `__pycache__`).
- File chung nguyên vẹn: `tsconfig.json` đủ 4 dòng exclude mới (E2 2 + E4 1 + E6 1); `preview.tsx` chỉ hunk E4; `store.ts` chỉ hunk E6; `i18n` vi=en=973, vi-only = en-only = 0.
- `tsc --noEmit` (apps/web): **0 lỗi** (9 lỗi E5 thấy là trạng thái giữa chừng, xem §0).
- `vite build`: **pass** (5,24 s; cảnh báo chunk >500 kB có sẵn từ trước).
- Chạy lại test mới: E1 13/13, E2 8/8 + 3/3, E3 6/6 + 11/11, E4 13/13, E5 9/9, E6 13/13 — fail 0. Lưu ý cách chạy: 4 test (E1, E2-gop, E3 ×2) import extensionless nên phải chạy qua esbuild bundle (`--format=esm`); chạy trực tiếp `node *.test.ts` báo `ERR_MODULE_NOT_FOUND` là lỗi cách chạy, không phải code.
- Chạy lại hồi quy: C4 10/10, D1 12/12, B3 7/7, A3 10/10, Z3 9/9, relinkEdge 12/12, projectRepo 10/10, nested22 7/7 — fail 0.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed / FPS / TTS WAV của các luồng, phiên solo thật, đo IDB thật, click-test headed từng panel — đó là số đo của luồng.
- Nợ E5 §6.5 (snapshot đếm key i18n 968 lỗi thời): E2 đã xử lý trong đợt — các file snapshot assert 973, khớp parity thực tế 973=973.
- Parent không sửa logic luồng nào; chỉ viết LIMITS tổng hợp này, file paths và mục log.

## 3. Nợ mở cho đợt 50 (từ § Nợ của 6 file LIMITS E1–E6)

Nặng nhất:
1. **Render mirror vẫn hở với keyframe null** (E4 §7.4): `server/render/src/audiomix.js` `buildVolumeInterpExpr` ném với `[null]` như preview cũ; sanitize chỉ nằm ở cổng load web. Cần kiểm tra + vá ở phía render (`validate.js`) hoặc đưa sanitize vào tầng chung.
2. **KeyframePanel/KeyframeGraph gọi `interpolateKeyframes` trực tiếp không guard độ dài** (E4 §7.5): thêm guard `length > 0` ở 2 chỗ panel (~216, ~325); đường sửa tay in-memory (MCP) vẫn có thể đưa null vào panel.
3. **Early-return `if (!ctx) return;` trong tick preview** (E4 §7.6) vẫn trả về mà không đặt lịch rAF — chuyển quyền đặt lịch về wrapper `loop`; cần test riêng vì chạm ngữ nghĩa ngủ khi chưa có canvas.
4. **Vòng lặp preview với footage hoàn toàn không decode được quay ~19 tick/s trong ~30–40 s trước khi ngủ** (E4 §7.7, nợ C3 §9 mục 4).
5. **TTS per-voice vòng 2** (E1 §8.1–8.3): đo M3 cho 19 giọng còn lại (dense) + M4 cho 11 giọng (normal) để bảng phủ đủ 25 preset; thăm dò ngưỡng 10–16% bằng nhiều giọng (ngưỡng 13% vẫn tạm thời, phản ví dụ X2 vẫn đứng); đo thêm text medium thứ hai cho vài giọng (transfer 1,154 mới đo ở 1 giọng Hải Đăng).
6. **Đỉnh heap transient GOP +81,5 MiB** (E2 §7.1): hướng T3 streaming — chỉ fetch GOP của cửa sổ, không fetch mọi GOP lượt đầu; trần 128 MiB giữ nguyên, không đề xuất mở trần.
7. **Trần 1000 trên footage B-frame** (E5 §6.4): cần flow khác (B-frame serve nhanh/local để seek hoàn tất thật rồi mới đo mẫu); probe rAF-fallback đóng seek sau 5–15 ms trên B-frame (0 mẫu) là hạn chế của probe, không phải sản phẩm.
8. **Vòng draw/toggle cho clip `asset:` trên UI app thật** (E3 §7.6, nợ B1 §6.4) vẫn chưa chứng minh.
9. **LoadSample case D+B trên browser thật** (E6 §4.3): chỉ có khóa ở tầng logic thuần, chưa đo browser (call1 ném + user đổi project sau lần bấm).
10. **Fail-fast seek-landing-0 headed + quirk frame khác 0 headed** (E4 §7.1–7.2): vẫn thiếu; cần fixture đáp sai ổn định khác (cắt GOP nhưng giữ moov/stss, keyframe lỗi ở vị trí khác trong GOP) hoặc đúng binary/cờ của phiên Chrome Y2 gốc (không còn bản ghi).
11. Nợ đứng nhiều đợt (không ép đóng): phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ yên ~20–40 phút từ main chat; Safari/Firefox/máy thật chưa đo; baseline quiet vẫn chờ.

## 4. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round49-closing-debts48.txt` (45 entry: 19 file đổi + 25 file mới + LIMITS tổng hợp này; NUL-delimited, không binary, không dist, đã verify read-back khớp danh sách + mọi file tồn tại).
- Tổng batch đang chờ user push sau đợt này: 30 file paths / 1198 entry (1153 đợt 22–48 + 45 đợt 49; các đợt 1–21 đã push xong chiều 29/10).

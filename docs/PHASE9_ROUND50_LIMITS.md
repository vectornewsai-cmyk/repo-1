# Phase 9 đợt 50 — LIMITS tổng hợp (gộp muộn, parent kiểm chứng)

Ngày gộp: 06/11/2026 (giờ +07). Đợt 50 chạy 06/11 với 6 luồng F1–F6
(từ nợ mở đợt 49 §3), nhưng bước gộp của parent chưa từng xảy ra —
không có LIMITS tổng hợp, không có mục log đợt 50, không có file paths
đợt 50. Lượt cron 14:03 06/11/2026 KHÔNG làm lại code đợt 50 mà đóng
vai parent gộp muộn (cùng mẫu đợt 49, gộp muộn ở lượt cron 08:03
06/11). KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG binary hay dist vào batch.

## 1. Chủ đề đợt 50 (từ nợ mở đợt 49 §3, không trùng batch đã stage)

- F1 render mirror keyframe null + guard panel (nợ E4 §7.4–7.5)
- F2 tick preview early-return ctx + footage không decode được quay
  ~19 tick/s (nợ E4 §7.6–7.7)
- F3 TTS per-voice vòng 2: M3 19 giọng + M4 11 giọng chưa có hệ số
- F4 heap transient GOP +81,5 MiB: T3 streaming (nợ E2 §7.1)
- F5 trần 1000 B-frame bằng flow khác + draw/toggle asset: trên UI thật
- F6 loadSample case D+B browser thật + fail-fast/quirk headed

## 2. Kết quả từng luồng (chỉ ghi số đã đo, chi tiết trong LIMITS riêng)

- **F1 render/keyframe null:** sanitize mirror ở cổng render
  (`keyframeSanitize.js`, trước flatten/validate): 4/4 spec thô mang
  null (volume/animations/speed/nested leaf) nay render exit 0, MP4
  2 s, cảnh báo `⚠️ keyframes:`; parity web-vs-render byte-equal.
  Builder harden: `normalizeKeyframes` lọc entry lỗi trước sort (cả
  3 mirror TS/JS/render); panel không sửa code (2 guard E4 nêu đã có),
  khóa bằng test mô phỏng đường derive. Test mới render 26/26, web
  11/11. Hồi quy keyframes 21/21, P3 73/73, SR 31/31, nested 28/28,
  E4 13/13.
- **F2 vòng lặp preview:** quyền đặt lịch chuyển về wrapper `loop`
  (finally → scheduleNext) — lỗ early-return `if (!ctx) return;`
  ĐÃ KÍN: headed ticks đóng băng ở 1 trước sửa → 83→169 trong 3 s
  sau sửa. Trần tường 10 s cho chuỗi skip vẽ lại (W2): footage không
  decode được nay ngủ sau 10,5–11,5 s thay vì 103,6 s (skip 600).
  Test mới 20/20; hồi quy pause 111/111 + audioEngine 6/6 + E4 13/13
  + cổng load 82/82.
- **F3 TTS theo giọng vòng 2:** 44 mẫu thật mới (~32 phút driver).
  Bảng hệ số phủ đủ 25/25 giọng (normal f + dense g riêng — BẮT
  BUỘC, dense chênh 7,78→13,09 = 68%; hệ số gộp SAI hẳn thêm 2 giọng
  Trúc Ly, Quốc Tuấn). Ngưỡng 13%: KHÔNG đủ để khóa — tốc độ giảm
  trơn theo tỉ lệ chữ số, phụ thuộc giọng, KHÔNG có ngưỡng nhị phân
  đúng cho mọi giọng; helper vẫn giữ ngưỡng 13% + hệ số dense riêng.
  Tốc độ tổng hợp 0,12–0,75× realtime (median 0,44×) — mâu thuẫn
  "~1,5–2,5×" trong memory (chưa rõ nguyên nhân, không sửa memory).
  Đính chính E1: pool Hải Đăng gộp nhầm C4-M5 của Thái Sơn. Test mới
  15/15; hồi quy C4 10/10, D1 12/12, B3 7/7, A3 10/10, Z3 9/9,
  relinkEdge 12/12, E1 13/13.
- **F4 GOP streaming:** T3 mode `streamGops` chỉ demux + trả meta,
  không fetch byte GOP lượt đầu; controller fetch đúng GOP cửa sổ.
  Headed app thật (cùng fixture 37 MiB, harness E2): transient cửa
  sổ T3 +81,5 MiB (E2, t≈4 s) → **+18,20 MiB** sau sửa (after1,
  t=4,6 s); 0 GET toàn file, GOP bật thật 17/17 cổng cả 3 lần sau;
  request blob 194–195 → 75–84. Settled KHÔNG giảm (29–30 MiB) —
  retention do cache LRU 32 MiB + frame cache. Test mới 6/6 (ffmpeg +
  HTTP Range thật); 4 assertion đếm request cũ cập nhật theo streaming.
- **F5 trần 1000 B-frame + draw/toggle:** flow F5b (fallback cần 30
  tick xác nhận liên tiếp + readyState>=2) đo được trần trên B-frame
  (xem LIMITS F5 §2 — số chi tiết ở đó). Vòng draw/toggle clip
  `asset:` trên UI app thật: **9/9 × 2 lượt** (GOP TẮT element vs GOP
  BẬT WebCodecs, badge ngược đúng, 0 lỗi). Test mới 10/10; hồi quy
  probe B5 5/5, E5 9/9, seek 15/15, D5 7/7, A6 12/12.
- **F6 loadSample case D+B + quirk:** chỉ thêm 3 harness, KHÔNG
  đổi file production nào (mutation đỏ đã khôi phục byte-identical,
  `loadSampleQueue.ts` khớp sha256 trước/sau — parent xác nhận file
  này không nằm trong 18 file đổi so với baseline). 5 hướng fixture
  mới đều KHÔNG tạo được fail-fast seek-landing-0 ở tầng currentTime;
  quirk đáp sai frame ở tầng pixel đo được 1 trường hợp trên file
  cắt đuôi (GOP mất hẳn — trường hợp biên). Số đo under-load.

## 3. Kiểm chứng gộp của parent (chạy lại độc lập, lượt này)

- Đối chiếu baseline đầu đợt (`round50-baseline.sha256`, 21719 file):
  đúng **18 file đổi**, khớp chính xác hợp danh sách LIMITS F1–F6
  (TtsButton, gopCache40V2, gopRangeFetch39T3, gopSharedProbe42X4.test,
  gopSizeProbe41W4.test, gopWiring40V2.test, pauseDraw41W2,
  reverseWebcodecs, ttsEstimate46B3.test, ttsEstimate48D1.test,
  ttsEstimate49E1.test, preview.tsx, tsconfig.json, keyframes.js/.ts
  video-spec, audiomix.js, keyframes.js/render.js) — 0 file lạ.
  File mới lọc (bỏ `.venv2/__pycache__`, symlink `apps/web/out`
  hỏng từ 19/10, model caption từ 20/10): đúng **22 file** (16 code/
  script + 6 LIMITS F1–F6) khớp hợp danh sách — 0 file lạ, 0 thiếu.
- File chung nguyên vẹn: tsconfig đủ 4 dòng exclude mới (F1/F2/F3/F4);
  render.js có require keyframeSanitize; preview.tsx dùng
  previewLoopShouldSleep; TtsButton gọi helper F3; gopRangeFetch39T3
  + reverseWebcodecs có marker ROUND50-F4.
- `tsc --noEmit` (apps/web): **0 lỗi**. `vite build`: **pass**
  (5,18 s, ra /tmp/merge50-app-dist).
- Chạy lại test mới: F1 render 26/26, F1 web 11/11, F2 20/20,
  F3 15/15, F4 6/6, F5 10/10 — fail 0.
- Hồi quy chạy lại: C4 10/10, D1 12/12, B3 7/7, A3 10/10, Z3 9/9,
  E1 13/13, E4 13/13, projectRepo 10/10, nested22 7/7, seek 15/15,
  gopWiring 16/16, gopSizeProbe 15/15, gopSharedProbe 10/10,
  relinkEdge 12/12, pauseLoopGuard 11/11, audioEngine 6/6 — fail 0.
  Lưu ý cách chạy: C4/D1/B3/A3/E1/gopWiring/relinkEdge/gopSize/
  gopShared/pauseLoopGuard/audioEngine import extensionless nên phải
  chạy qua esbuild bundle; chạy trực tiếp strip-types báo
  ERR_MODULE_NOT_FOUND là lỗi cách chạy, không phải code (đã gặp
  thật ở C4/D1/B3/A3 trước khi chuyển sang esbuild).
- `node --check` OK cả 7 harness .mjs mới (F2/F5/F6).
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS/TTS WAV
  của các luồng, phiên solo thật, đo IDB thật, click-test headed
  từng panel, Safari/máy thật, compat trình duyệt thứ 2.
- Parent không sửa logic luồng nào; chỉ viết LIMITS tổng hợp này,
  file paths và mục log.

## 4. Nợ mở cho đợt 51 (tổng hợp từ §nợ mở F1–F6)

Nặng nhất:
1. **Mô hình đường cong TTS theo giọng** thay ngưỡng nhị phân 13%
   (F3 §8.1): cần đo thêm điểm giữa 5–10% và 13–16% cho nhiều giọng
   để khóa dạng đường cong; text 10–12% hiện toast dự báo nhanh hơn
   thực tế (6 mẫu sai đã khóa trong test).
2. **Hệ số TTS n = 1 cho đa số giọng mới** (F3 §8.2): đo lặp thêm cho
   các giọng n = 1, ưu tiên Trúc Ly, Quốc Tuấn, Đức Trí, Kim Thanh.
3. **Fail-fast seek-landing-0 headed + quirk frame khác 0 headed**
   (nợ đứng nhiều đợt: E4 §7.1–7.2, F2 §6.4, F6 §5.1): 5 hướng
   fixture mới của F6 đều không tạo được landing sai currentTime; cần
   đúng binary/cờ phiên Chrome Y2 gốc hoặc fixture đáp sai currentTime
   ổn định khác. Quirk pixel chỉ đo được trên file cắt đuôi — chưa
   biết Chrome có giữ frame cũ với dạng hỏng khác không, và preview
   có nên thêm kiểm tra pixel vào đường seek không.
4. **Settled heap GOP + baseline dao động** (F4 §5.1–5.2): hạ trần
   cache LRU 32 MiB cần số đo riêng về tốc độ lùi; baseline JS-heap
   dao động 21–59 MiB chưa giải thích dứt điểm — lần đo sau chạy khi
   máy yên + khóa code chung; tail-scan 16,7 MiB vẫn nằm trong đỉnh
   transient (muốn giảm nữa phải stream cả tail).
5. **`normalizeSpeedKeyframes` vẫn sort trực tiếp** (F1 §7.2):
   entry null vẫn ném TypeError khi gọi trực tiếp (3 mirror speed);
   lọc giống `normalizeKeyframes`.
6. **Mirror `.js` viết tay của video-spec có thể lệch `.ts` lần nữa**
   (F1 §7.4): không có cơ chế tự động bắt lệch; đợt sau đổi hàm nào
   trong `packages/video-spec/src/*.ts` phải soi file `.js` kề bên.
   Zod `add_keyframe` cho phép `Infinity` (F1 §7.5); lệch mirror
   TS/JS về easing lạ (F1 §7.6, tiền sẵn).
7. **Click-test headed thật của KeyframePanel với `[null]`**
   in-memory** (F1 §7.3): panel mới khóa bằng unit mô phỏng đường
   derive, chưa render React thật.
8. **Trần 1000 / draw-tog
...[truncated 1587 chars]
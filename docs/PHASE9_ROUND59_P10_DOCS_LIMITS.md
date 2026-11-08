# Phase 9 đợt 59 P10 — Docs-only: cập nhật trạng thái sau đợt 51–58 (LIMITS)

Ngày: 2026-11-07. Luồng P10, đợt 59. **DOCS-ONLY — KHÔNG sửa bất kỳ file
code/test nào** (không `.ts`/`.tsx`/`.json` code, không test, không config).
Chỉ đọc + sửa 2 file `.md` và viết file LIMITS này. KHÔNG push, KHÔNG
release/tag, KHÔNG binary vào batch.

## 0. Phạm vi và phương pháp

- Đọc: `PHASE9_GAP_ANALYSIS.md` (160 dòng, viết 24/10),
  `docs/FEATURE_STATUS.md` (mốc 19/10), `benchmarks/RESULTS.md`,
  `docs/PHASE9_ROUND56_LIMITS.md`, `docs/PHASE9_ROUND57_LIMITS.md`,
  `docs/PHASE9_ROUND58_LIMITS.md` (+ các LIMITS luồng O1–O8, N1–N10, M1–M10
  khi cần đối chiếu), `docs/PHASE9_ROUND51_LIMITS.md`,
  `docs/PHASE9_ROUND52_LIMITS.md` (+ I9),
  `docs/PHASE9_ROUND53/54/55_LIMITS.md` (đọc phần đầu/tóm tắt),
  log vòng lặp `~/workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`.
- Mọi con số viết vào 2 file `.md` đều có nguồn là file LIMITS hoặc log
  vòng lặp; số nào không tìm được nguồn thì không viết (ghi "chưa đo" hoặc
  bỏ qua). Số i18n 1942 key được đếm lại trực tiếp bằng script Python trên
  `apps/web/src/i18n/vi.json` / `en.json` (1942/1942 lá, cùng tập key).
- Giữ nguyên mọi cảnh báo "ước tính" về số CapCut; không xoá lịch sử; không
  đổi kết luận kiến trúc (local-first); không đổi §4 (3 hướng không làm).

## 1. Đã sửa trong `PHASE9_GAP_ANALYSIS.md`

### 1a. Bảng §0 — hàng sửa

| Hàng | Nội dung mới | Nguồn số |
|---|---|---|
| Dịch caption | Thêm: recognition khớp cả hai tiền tố "Phụ đề"/"Subtitles", key `captions.translatedTrack` ("Phụ đề ({code})" / "Subtitles ({code})"), test 12/12. Dịch vẫn chỉ sang EN (không đổi). | ROUND58 §4 O5; ROUND58_O5 LIMITS; verify trực tiếp giá trị key trong vi/en.json |
| Enhance | **Đổi hẳn:** UI đã có từ Phase 9 R2 (`EnhancePanel` mount trong Inspector, 16 key `enhance.*`, label `inspector.secEnhance` có cả vi/en); chỉ tác dụng khi render, preview chưa áp enhance. Ghi chú mâu thuẫn với brief trong file (xem §4). | `apps/web/src/Inspector.tsx:398-400` ("Phase 9 R2: enhance cho clip video"); `apps/web/src/components/enhance/EnhancePanel.tsx` header + dòng 131–218 (deinterlace/stabilize/denoise); đếm key `enhance.*` trong vi.json = 16 |
| LUT | Thêm: test `webglLut.test.ts` chạy được 7/7 từ đợt 58 O7 (esbuild cjs; Node type-stripping vẫn không chạy được suite này). Số 174 LUT / RMSE 15.98 giữ nguyên (chưa đo lại). | ROUND58 §4 O7; ROUND58_O7 LIMITS |
| Preview FPS trên browser thật | **Đổi từ "CHƯA ĐO" thành số đo:** ~1,4–4,6 fps khi phát (nhẹ/vừa/nặng), ~20 fps khi tạm dừng, ~32 fps trang trống; clip 1080p trơn 7–10 fps; proxy 720p 9,8/10,5 fps vs gốc 1080p 7,0/8,2 fps — vẫn xa 30 fps. | ROUND52_I9 LIMITS §2 (số thật, file JSON trong `benchmarks/results/`) |

### 1b. Bảng §0 — hàng mới thêm

| Hàng mới | Nội dung | Nguồn số |
|---|---|---|
| i18n (vi/en) | vi == en == 1942 key lá (đếm lại 07/11), cùng tập key, placeholder khớp; 1011 (đợt 55) → 1722 (đợt 56, +711) → 1937 (đợt 57, +215) → 1942 (đợt 58, +5). Chính tả "Huỷ": 141 occurrence / 50 file, giữ 7 chỗ có chủ đích. | ROUND58 §0 (1937→1942); ROUND57 §0 (1722→1937); ROUND56 §2.1 (1011→1722); ROUND58 §4 O8; đếm lại bằng script 07/11 |
| Modal / Escape | Escape đóng WelcomeModal (O1 9/9 + headed 3/3); SilenceModal hết tràn viewport (N1, re-probe headed PASS); BeatSync/SceneModal dùng class `modal` đã định nghĩa (O4 24/24 + headed 4/4). Còn thiếu: TourCard/TemplatePackModal/TemplatePicker chưa đóng bằng Escape; class `caption-modal`, `modal-x/label/hint/err` chưa định nghĩa. | ROUND57 §4 (N1 re-probe); ROUND58 §4 O1/O4; ROUND58 §6.2/§6.4 |
| GOP trial-decode / probe | Stream-mode sample tới 8 MiB, chunked fetch 512 KiB (N10 17/17). Timeout scale theo kích thước: 0,3 ms/KiB trên 256 KiB, trần 2500 ms (O6 18/18); keyframe 4K nhiễu 4,1 MiB decode-ok 662,7 ms thay vì fail-open ở 200 ms. Còn lọt: sample >8 MiB; keyframe zero-giữa; chưa đo Safari/Firefox. | ROUND57 §5 N10; ROUND58 §4 O6; ROUND58 §6.6 |
| Media mẫu / autosave | Reload sạch KHÔNG tái hiện mất media mẫu (O2): bin trống là đúng thiết kế rehydrate theo spec, manifest IndexedDB vẫn đủ. Bug thật kề bên đã sửa: media mẫu thiếu `file` trong phiên đầu → export bị chặn tới khi reload (sửa 1 dòng `sample.ts`, headed 5/5, rehydrate 27/27). Nợ: media import rồi xóa hết clip cũng biến mất khỏi bin sau reload. | ROUND58 §4 O2; ROUND58 §6.1; log vòng lặp (mục O2 đợt 58) |

### 1c. Mục mới §0.1 "Trạng thái sau đợt 51–58"

- Liệt kê chủ đề 8 đợt 51–58, những gì đã đóng (i18n, preview FPS, modal,
  captions, GOP, webglLut test, chính tả, media mẫu, TTS curve, Electron,
  tổng chờ push 656 entry — nguồn ROUND58 §7), và 9 nợ mở lớn nhất lấy
  nguyên ý từ ROUND58 §6 (không thêm số), cộng đoạn "nợ lớn từ gap gốc
  chưa đụng trong 51–58" (E1/P2, P1, C1, M1 — phát biểu dưới dạng "trong
  các LIMITS đợt 51–58 không ghi việc đóng…", đã grep kiểm tra các file
  `PHASE9_ROUND5[1-8]*_LIMITS.md` không có claim đóng các mục này).
- Số RT TTS 0,12–0,75× (median 0,32×/0,44×, 72 lần đo) được ghi rõ là của
  đợt 49–50, không phải 51–58 — nguồn là MEMORY (ghi chú đính chính
  06/11), không đo lại trong đợt này.

## 2. Đã sửa trong `docs/FEATURE_STATUS.md`

- **Chỉ thêm 1 mục bổ sung có ghi ngày 07/11/2026** ngay sau phần định nghĩa
  status, trước ma trận. **Không sửa bất kỳ hàng nào trong ma trận** vì
  không có bằng chứng đợt 56–58 nào đổi trạng thái của một hàng (đợt 56–58
  làm i18n wiring, GOP trial-decode, modal/Escape, captions track, test
  webglLut, chính tả — không đổi feature status). Mục bổ sung ghi rõ điều
  này + liệt kê các điểm đã kiểm chứng được đợt 56–58 (i18n 1942 key,
  captions track song ngữ O5, modal/Escape, webglLut 7/7, chính tả Huỷ,
  media mẫu/sample.ts) kèm nguồn, để lần cập nhật toàn bộ ma trận sau dùng.
- Hàng Auto-caption "chỉ CLI" trong ma trận đã lỗi thời từ trước đợt 56
  (caption đã có UI từ Phase 8/Q3) nhưng trạng thái UI caption đầy đủ chưa
  được kiểm chứng lại trong đợt 56–58 nên **giữ nguyên, không sửa nửa vời**
  — ghi rõ trong mục bổ sung.
- Ma trận vẫn giữ mốc kiểm chứng 19/10/2026 (commit `1844e2cc`); các hàng
  khác (LUT "10 filter", Transitions "13", MCP "6 tools", TTS "chưa
  implement", Masking "chưa có") đều đã lỗi thời từ các phase trước đợt 56,
  **không thuộc phạm vi đợt này** nên không đụng — lần cập nhật toàn bộ ma
  trận là việc riêng, cần kiểm chứng lại từng hàng bằng code.

## 3. Không đụng (cố tình, có lý do)

- **Hàng Benchmark §0** ("TTS ~0.44x tổng thể", "mask 720p 0.97 fps",
  "render 1080p ~8.6–12.5 fps"): số TTS đã được đính chính 06/11 xuống
  0,12–0,75× (median 0,32× đợt 49 / 0,44× đợt 50, 72 lần đo, nguồn MEMORY)
  nhưng đó là đợt 49–50, ngoài danh sách (a) của nhiệm vụ; không sửa để
  giữ phạm vi docs-only đợt này hẹp và kiểm chứng được. Ghi lại ở đây để
  đợt docs sau xử lý.
- **Số lượng kho §0** (transition 67, LUT 174, sticker 244, font 59, sound
  1043, template 50): không đếm lại trong đợt này (cần quét asset thật);
  chỉ ghi chú LUT test đã chạy được. M3 (đợt 56) xác nhận TEMPLATES.length
  = 50 nên template 50 vẫn đứng được, nhưng các số còn lại không có nguồn
  đo mới — không viết thêm.
- **Hàng TTS §0** ("voice cloning chưa expose UI/bridge"): đợt 1 (Phase 9)
  được ghi trong MEMORY là đã làm "TTS clone/chunk dài" nhưng không có
  LIMITS đợt 51–58 nào xác nhận trạng thái expose hiện tại; không sửa khi
  chưa có nguồn.
- **Số CapCut (ước tính)** trong toàn file: giữ nguyên 100%, không thêm,
  không sửa, không trích dẫn như số đo.
- **§4 (3 hướng không làm) và kết luận §5:** giữ nguyên.

## 4. Đính chính quan trọng — brief đợt 59 P10 về Enhance SAI so với code

Nhiệm vụ giao ghi: "Enhance vẫn chưa có UI — đó là việc của luồng P8/P9
đợt này, ghi rõ là đang làm trong đợt 59". **Kiểm chứng code cho thấy điều
ngược lại:**

- `apps/web/src/components/enhance/EnhancePanel.tsx` tồn tại từ Phase 9 R2,
  header ghi rõ "Nối clip.enhance (đã có sẵn ở server/render từ Phase 7 P2)
  ra giao diện: khử răng cưa (yadif), chống rung (vidstab 2-pass), khử nhiễu
  (hqdn3d)".
- `apps/web/src/Inspector.tsx:398-400` mount panel này trong Section
  `inspector.secEnhance` ("Phase 9 R2: enhance cho clip video").
- i18n đầy đủ: 16 key `enhance.*` + `inspector.secEnhance` ("🎥 Tăng cường
  video" / "🎥 Enhance video") đã có trong cả vi.json và en.json (verify
  trực tiếp); M3 đợt 56 đã i18n hoá EnhancePanel.
- Khoảng cách thật còn lại của Enhance là **preview chưa áp enhance**
  (render-only, ghi trong header panel) — không phải "chưa có UI".

Vì vậy file gap analysis đã ghi đúng theo code (UI đã có từ R2; còn thiếu
preview enhance), kèm ghi chú mâu thuẫn với brief để parent xác nhận lại
phạm vi thật của P8/P9 (có thể P8/P9 làm enhance preview hoặc preset,
không phải UI mới). **Không viết câu "Enhance chưa có UI / P8/P9 đang làm
UI trong đợt 59" vào tài liệu vì đó là claim sai so với code.**

## 5. Kiểm chứng của luồng (docs-only, không chạy tsc/build/test)

- Đếm lại i18n bằng script Python trên `apps/web/src/i18n/vi.json` +
  `en.json`: **1942/1942 lá, cùng tập key** (khớp ROUND58 §0).
- Grep `EnhancePanel` trong `apps/web/src`: mount tại `Inspector.tsx:212`
  (nhánh probe dev-only N3) và `:398-400` (Section chính); đọc header +
  controls của `EnhancePanel.tsx` (deinterlace/stabilize/denoise).
- Verify trực tiếp giá trị key: `captions.translatedTrack` vi "Phụ đề
  ({code})" / en "Subtitles ({code})"; `inspector.secEnhance` vi/en đều có.
- Đối chiếu từng số trong §1 với file LIMITS nguồn đã liệt kê; không có số
  nào viết từ trí nhớ. Không chạy tsc/vite build/test (không sửa code).
- KHÔNG chạy lại bất kỳ phép đo headed/FPS/TTS nào của các luồng — số đó
  là số đo của luồng, chỉ đối chiếu LIMITS.

## 6. Nợ mở (cho đợt sau — không phải nợ do luồng này gây ra)

1. Ma trận `FEATURE_STATUS.md` vẫn ở mốc 19/10: nhiều hàng đã lỗi thời từ
   các phase trước đợt 56 (LUT 10 filter, Transitions 13, MCP 6 tools, TTS
   "chưa implement", Masking "chưa có", Export MP4 "chưa nối") — cần một
   đợt docs riêng kiểm chứng lại toàn bộ ma trận bằng code.
2. Hàng Benchmark §0 còn số TTS cũ (~0.44x tổng thể) so với đính chính
   06/11 (0,12–0,75×); số lượng kho §0 chưa đếm lại sau đợt 58.
3. Nợ mở từ ROUND58 §6 (9 mục) đã chép vào gap analysis §0.1 — nặng nhất:
   thiết kế bin theo spec, Escape cho 3 modal còn lại, class chưa định
   nghĩa (`caption-modal`, `modal-x/label/hint/err`), sample >8 MiB
   stream-mode vẫn bỏ qua.
4. Mâu thuẫn brief Enhance (xem §4): cần parent xác nhận lại phạm vi P8/P9
   đợt 59 để khỏi làm trùng UI đã có từ R2.
5. i18n: chưa có claim "xong 100%" trong bất kỳ LIMITS nào — không ghi
   claim đó vào gap analysis; N5 bản dịch EN template chưa qua người bản
   ngữ; reverseGate verbatim + sentinel 'Dự án mới' cố tình không dịch.

## 7. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round59-p10-docs.txt`
(NUL-delimited, verify read-back, 3 entry, text only):
`PHASE9_GAP_ANALYSIS.md`, `docs/FEATURE_STATUS.md`,
`docs/PHASE9_ROUND59_P10_DOCS_LIMITS.md`.

Tổng chờ push sau luồng này: 656 entry (sau đợt 58) + 3 = **659 entry**
(các đợt 1–50 đã push xong, HEAD e2cb35e1; Phase 10 Electron 63 entry vẫn
nằm trong 656).

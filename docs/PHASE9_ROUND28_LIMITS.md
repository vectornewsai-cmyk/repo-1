# Phase 9 đợt 28 — Đóng nợ đợt 27: baseline footage, phát ngược, bridge hết mù, load-report tự sửa, click-test nốt, dip 1080p/4K — LIMITS tổng hợp

> Đợt lớn 6 luồng song song (L1–L6), KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Kiểm chứng gộp của parent (chạy lại độc lập,
> không lấy số của luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi
> (web + CLI + MCP), `vite build` pass (5.00s),
> loadReportFix28 8/8, reversePlaybackRound28L2 17/17,
> loadReport 10/10, projectRepo 10/10, J5 15/15, curveFix K2 17/17,
> reversePlayback 10/10, holdFrame 13/13, transitionPreview 31/31,
> previewEngine 14/14, nestedPreview 46/46, failsoft J1 6/6,
> nestedPreviewR3 21/21, bridge error-detail 56/56, jobqueue 52/52,
> node --check 7 script pass, i18n parity vi = en = 867 key, 0 key mồ côi.
> File build phụ (dist, *.tsbuildinfo) KHÔNG đưa vào batch.
> KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed / FPS của
> L1/L2/L5 và phép đo Node/FFmpeg của L6 — đó là số đo của luồng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **L1 baseline footage K** (`docs/PHASE9_ROUND28_L1_FOOTAGE_BASELINE_LIMITS.md`):
  KHÔNG phải lỗi sản phẩm. Dư số baseline của K3 là artefact của chuỗi
  control trong harness K3: (1) control làm tròn offset letterbox
  438 thay vì 437,5 thật, (2) control resample 2 bước trong khi app
  resample 1 bước. Khi đo đúng chuỗi app thật: app vs control
  MAD 0,000 từng bit ở cả 3 thời điểm. Đã loại trừ bt709/bt601
  (chênh chỉ 0,02 MAD), lệch timestamp (sweep lưới fps gốc 23,976),
  decode khác nhau (browser-vs-FFmpeg MAD 0,65). Hệ quả: verdict dip
  18/18 của K3 trên phẳng/gradient không bị ảnh hưởng, nhưng mọi số
  footage-động của K3 dùng chuỗi control cũ (sanity 5,583; 2 case dip
  footage thật) đều mang artefact và không được dùng làm bằng chứng
  "preview lệch trên footage động" nữa. Không sửa code sản phẩm.
- **L2 phát ngược** (`docs/PHASE9_ROUND28_L2_REVERSE_LIMITS.md`):
  Giải thích 54 hold pass xuôi GOP thưa: hold tụ thành cụm ngay sau
  mỗi lần drift-seek của syncMedia (decoder giải mã lại từ keyframe;
  GOP thưa keyframe duy nhất frame 0 nên seek tới 6.5s phải giải mã
  ~195 frame P). Phát hiện thêm CHƯA SỬA: playhead chạy nhanh 1.158×
  wall do `setPlayhead` snap `Math.round` ở biên nửa frame — nguyên
  nhân gốc của chu kỳ drift-seek, để luồng riêng sửa vòng phát xuôi.
  Harness ngược cho ramp/nested 17 test mới. Cải thiện ngược: pacing
  seek + cửa sổ vẽ ở tick seek vừa hoàn tất → GOP thưa 1.36 → 7.79 fps
  (PASS, chưa đạt 30 fps thật), GOP dày 16.6 → 23.2 fps. WebCodecs:
  API có sẵn, `isConfigSupported` true, nhưng latency decode 1 GOP
  bằng chunk CHƯA đo (cần demuxer MP4) — không claim 30 fps WebCodecs.
  Phím J và mute giữ nguyên.
- **L3 bridge hết mù** (`docs/PHASE9_ROUND28_L3_BRIDGE_ERRORS_LIMITS.md`):
  Đính chính: CLI và MCP không đi qua bridge (spawn worker trực tiếp)
  mà đã chặn sớm curve vi phạm ở cửa validate; cái mù thật là bridge
  API và lỗi tầng worker của CLI/MCP (stderr thô vừa mù vừa lộ đường
  dẫn). Module canonical duy nhất `server/bridge/src/errorDetail.js`
  (redact + phân loại + format) dùng chung cả 3 đường: `job.error`
  giữ nguyên chuỗi cũ, `errorCode` luôn kèm, `errorDetail` chỉ trả khi
  `GET /api/render/:id?detail=1`. Redact chặn đường dẫn tuyệt đối,
  home dir + tên user (kể cả đuôi sau home), token, URL có credential,
  stack trace; được phép qua: đường dẫn clip, keyframe + giá trị,
  basename, dòng ffmpeg đã redact. Test mới 56/56, jobqueue 52/52.
- **L4 load-report tự sửa** (`docs/PHASE9_ROUND28_L4_LOADREPORT_FIX_LIMITS.md`):
  App nay truyền `onFixWarning` thật vào LoadReportPanel: confirm liệt
  kê thay đổi rồi gọi action K2 `fixSpeedCurveViolations` (1 bước
  undo); sau sửa quét lại spec và làm mới báo cáo (warning đã sửa biến
  mất). Nút nằm trên mỗi dòng nhưng sửa là TOÀN spec — ghi rõ trong
  tiêu đề confirm để không gây hiểu lầm; sửa riêng từng dòng cần
  store action mới. Version-history restore nay set báo cáo mới
  (nguồn `"history"`) nếu project khôi phục có vi phạm, hoặc xóa báo
  cáo cũ nếu không còn. J5 message dịch theo locale hiện tại
  (10 loại vi phạm, `message` tiếng Việt giữ nguyên từng chữ để test
  cũ không đổi). Persistence: không thêm key riêng — K5 đã nối báo
  cáo qua autosave; reload không autosave thì cũng không còn project
  để gắn báo cáo nên mất là đúng; sau bấm "Sửa", App gọi `autosaveNow`
  ngay để đóng cửa sổ debounce 5s.
- **L5 click-test nốt K6** (`docs/PHASE9_ROUND28_L5_CLICKTEST_LIMITS.md`):
  10/10 trên browser thật: guard mốc rỗng locale en đúng từng chữ
  (`No outer time entered (the field is empty) — not split.`), mốc âm
  và mốc trước cửa sổ ở chain 2–3 tầng đều bị chặn đúng, NaN không tạo
  được qua UI sau 8 đường thử (ô `type="number"` controlled nuốt mọi
  input không phải số). Hồi quy J6 17/17, K6 chạy lại 8/8 (lần 1 treo
  CDP 6/8, ghi rõ là nhiễu hạ tầng, chưa loại trừ tuyệt đối 100%).
  Không sửa code sản phẩm.
- **L6 dip 1080p/4K + sweep + tổ hợp** (`docs/PHASE9_ROUND28_L6_DIP_COVERAGE_LIMITS.md`):
  Lưu ý phạm vi: luồng này KHÔNG có live browser nên đo bằng giao
  thức Node/FFmpeg của J3 (model code sản phẩm vs FFmpeg thật) — click-
  test browser ở 1080p/4K vẫn là nợ. Wiring dip KHỚP 54/54 ô ở 1080p
  và 4K (fadeblack/fadewhite/fadegrays, phẳng + footage K→L, ra/vào).
  Sweep p: lệch nhất ở biên (vào p=0,0333, ra p=0,9667), do nội dung +
  trọng số, không do offset. Phát hiện mới: ở p≈0,17–0,27 đường YUV
  của render bão hòa về trắng/đen thuần (Y 237–255) nên gapYUV ≈ 0
  trong khi gapRGB = 7–10 — canvas RGB đúng model hơn render YUV đã
  clip, không được "sửa" canvas cho khớp. Tổ hợp dip + mask/SR/track/
  motion-blur (B) KHỚP/XẤP XỈ 20/20, nhưng gap cặp (A) phình ở vùng
  không phủ vì dip render là toàn khung còn dip canvas chỉ trong vùng
  clip chiếm (giới hạn kiến trúc, không phải lỗi wiring mới). Đề xuất
  giữ badge `matched` cả 3 type + bổ sung 2 giới hạn vào mô tả badge;
  KHÔNG tự đổi badge trong code.

## 2. Sửa của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Đối chiếu file chung sau song song:
  `tsconfig.json` đủ cả 2 exclude test mới (L2 + L4);
  `preview.tsx` còn đủ hunk L2 (9 tham chiếu helper mới) và không mất
  hunk K1/K4 cũ (guard text-style + vùng reverse/hold vẫn có mặt theo
  kiểm tra tham chiếu); `App.tsx` còn handler L4 (3 tham chiếu);
  i18n vi/en đều 867 key, 0 key mồ côi.
- Test L4 lần đầu chạy từ `apps/web/src` báo ENOENT i18n — không phải
  lỗi test: test đọc đường dẫn tương đối theo CWD, chạy từ repo root
  thì 8/8 pass (đúng quy ước header test). Không sửa test để chạy từ
  mọi CWD vì header đã ghi rõ cách chạy.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Đo lại dip-trên-footage của K3 bằng chuỗi 1-bước-437,5** (L1 §nợ):
   số dip-trên-footage sạch đầu tiên vẫn chưa có; áp quy tắc đo đúng
   (1 bước, tọa độ thực không làm tròn, sweep lưới fps gốc) vào
   harness K3 kèm hồi quy 18/18 phẳng.
2. **Playhead snap nửa frame 1.158×** (L2): nguyên nhân gốc drift-seek
   pass xuôi — cần luồng riêng sửa vòng phát xuôi dùng chung; đừng
   sửa lén trong luồng phát ngược.
3. **30 fps ngược thật trên GOP thưa** (L2): cần WebCodecs + demux +
   cache frame (cache 300 frame 720p RGBA ≈ 1.1 GB nếu cache nguyên —
   cần độ phân giải preview hoặc cửa sổ trượt); latency chunk chưa đo.
4. **Web vẫn chưa hiện errorDetail** (L3): ExportPanel vẫn poll không
   kèm `?detail=1`; CLI không-quiet vẫn in stderr worker trực tiếp;
   MCP `probeVideo` và các route bridge khác (caption/silence/reframe/
   tts/beats/scene/bgremove) vẫn trả tail stderr thô; `openapi.yaml`
   chưa cập nhật field mới; chưa chạy bridge server thật end-to-end
   qua HTTP với `?detail=1`.
5. **Nút Sửa sửa toàn spec** (L4): sửa riêng từng dòng cần store action
   mới; chưa dịch hết chỗ hiện message J5 (banner ExportPanel, toast
   lúc load, toast tóm tắt sau sửa, từng dòng thay đổi trong confirm);
   chưa click-test browser thật cho nút Sửa.
6. **Click-test en 3 tầng + spinner dương** (L5): mốc âm/trước cửa sổ
   ở phiên en 3 tầng chưa bấm riêng; attempt spinner chưa trúng nút
   thật; nguyên nhân gốc lần treo CDP K6 lần 1 chưa chắc chắn 100%.
7. **Browser thật ở 1080p/4K + tổ hợp trên browser** (L6): wiring
   DOM/offscreen của tổ hợp, longtask dip 4K trên browser, clip ngắn
   cả 2 cửa sổ cùng active (alpha tích), fadeblack YUV kênh G dư số
   nhỏ chưa giải thích (fit −21,05 nhưng signed G lệch ít hơn R/B).
8. **Nợ cũ vẫn còn:** tab ẩn hàng giờ / discard thật / máy thật (từ
   đợt 24); kho dọc vẫn thiếu cảnh quay thuần ngoài vũ trụ; badge
   fadewhite/fadegrays vẫn giữ nâng kèm cảnh báo gap đơn-clip-vs-cặp
   từ đợt 26 §2.

## 4. File đổi/thêm (đường dẫn tương đối từ repo root)

- `apps/web/scripts/clicktest-footage-baseline-round28-l1.mjs` (mới, L1)
- `benchmarks/results/v28-l1-footage-baseline.json` (mới, L1)
- `benchmarks/results/v28-l1-ffmpeg-color.json` (mới, L1)
- `docs/PHASE9_ROUND28_L1_FOOTAGE_BASELINE_LIMITS.md` (mới, L1)
- `apps/web/src/lib/reversePlayback.ts` (sửa, L2)
- `apps/web/src/preview.tsx` (sửa, L2)
- `apps/web/src/lib/reversePlaybackRound28L2.test.ts` (mới, L2)
- `apps/web/tsconfig.json` (sửa, L2+L4)
- `docs/PHASE9_ROUND28_L2_REVERSE_LIMITS.md` (mới, L2)
- `server/bridge/src/errorDetail.js` (mới, L3)
- `server/bridge/src/publicJob.js` (mới, L3)
- `server/bridge/src/jobQueue.js` (sửa, L3)
- `server/bridge/src/index.js` (sửa, L3)
- `server/bridge/API.md` (sửa, L3)
- `server/bridge/test/test-error-detail.cjs` (mới, L3)
- `cli/src/paths.ts` (mới, L3)
- `cli/src/renderErrors.ts` (mới, L3)
- `cli/src/commands/render.ts` (sửa, L3)
- `mcp-server/src/tools/renderErrors.ts` (mới, L3)
- `mcp-server/src/tools/export.ts` (sửa, L3)
- `docs/PHASE9_ROUND28_L3_BRIDGE_ERRORS_LIMITS.md` (mới, L3)
- `apps/web/src/lib/projectRepo.ts` (sửa, L4)
- `apps/web/src/i18n/vi.json` (sửa, L4)
- `apps/web/src/i18n/en.json` (sửa, L4)
- `apps/web/src/lib/loadReport.ts` (sửa, L4)
- `apps/web/src/components/project/LoadReportPanel.tsx` (sửa, L4)
- `apps/web/src/App.tsx` (sửa, L4)
- `apps/web/src/components/project/HistoryPanel.tsx` (sửa, L4)
- `apps/web/src/lib/loadReportFix28.test.ts` (mới, L4)
- `docs/PHASE9_ROUND28_L4_LOADREPORT_FIX_LIMITS.md` (mới, L4)
- `apps/web/scripts/clicktest-l5-round28-pipe.mjs` (mới, L5)
- `docs/PHASE9_ROUND28_L5_CLICKTEST_LIMITS.md` (mới, L5)
- `benchmarks/results/v28-l5-clicktest.json` (mới, L5)
- `benchmarks/results/v28-l5-regress-j6.json` (mới, L5)
- `benchmarks/results/v28-l5-regress-k6.json` (mới, L5)
- `benchmarks/results/v28-l5-regress-k6-rerun.json` (mới, L5)
- `server/render/src/measure_r28_l6_dip_coverage.js` (mới, L6)
- `docs/PHASE9_ROUND28_L6_DIP_COVERAGE_LIMITS.md` (mới, L6)
- `benchmarks/results/v28-l6-dip-1080p-4k.json` (mới, L6)
- `benchmarks/results/v28-l6-dip-sweep.json` (mới, L6)
- `benchmarks/results/v28-l6-dip-combo.json` (mới, L6)
- `docs/PHASE9_ROUND28_LIMITS.md` (mới, tổng hợp này)

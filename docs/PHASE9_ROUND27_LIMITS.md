# Phase 9 đợt 27 — Đóng nợ đợt 26: preview robustness vòng 2 — LIMITS tổng hợp

> Đợt lớn 6 luồng song song (K1–K6), KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Kiểm chứng gộp của parent (chạy lại độc lập,
> không lấy số của luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi,
> `vite build` pass (4.53s), textStyle27K1 6/6, curveFixRound27K2 17/17,
> loadReport 10/10, reversePlayback 10/10, holdFrame 13/13,
> projectRepoRound26J5 15/15, nestedPreviewFailsoft26J1 6/6,
> projectRepo 10/10, projectRepoNested22 7/7, nestedPreview 46/46,
> transitionPreview 31/31, previewEngine 14/14, archive 38/38.
> File build phụ (dist, *.tsbuildinfo, vite.config emit) KHÔNG đưa
> vào batch. File paths-loop riêng của K5
> (`phase9-round27-k5-load-report.txt`, chưa từng push) đã được thay
> bằng batch tổng hợp của đợt này để tránh đếm trùng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **K1 text clip không style** (`docs/PHASE9_ROUND27_K1_TEXT_STYLE_LIMITS.md`):
  bug đợt 26 J6 §6 đã sửa: `normalizeTextStyle`/`normalizeTextStyles`
  ở cổng load (`parseProjectText`, đệ quy cả subSpec) + guard tại
  `drawTextClip`/`textFont`/`hitText`. Xác nhận top-level CŨNG ném
  (câu hỏi mở của đợt 26 đã có đáp án: có). Default trung tính
  Inter/64/`#ffffff`/bold/`x=y=0.5`/`animation: "none"`. Clip đã có
  style đầy đủ giữ nguyên từng field.
- **K2 lỗi export + nút sửa curve** (`docs/PHASE9_ROUND27_K2_CURVE_EXPORT_LIMITS.md`):
  xác minh đường export cũ mù thật ở bridge (chỉ trả "Render worker
  thoát với mã 1", do bridge cố tình cắt stderr chống leak — không sửa
  bridge). ExportPanel nay chặn sớm với thông báo nêu rõ clip/keyframe/
  giá trị vi phạm; nút "Sửa curve vi phạm" do user chủ động bấm
  (confirm liệt kê thay đổi, 1 bước undo qua `fixSpeedCurveViolations`).
  Render không kiểm tra t đơn điệu (nó sort + dedupe) nên loại này chỉ
  hiện banner, không chặn oan.
- **K3 pixel-test dip trên browser thật** (`docs/PHASE9_ROUND27_K3_DIP_BROWSER_LIMITS.md`):
  nợ #3 đợt 26 đã đóng: 18/18 case chính KHỚP (MAD resampled 0,000),
  không sửa code sản phẩm. Perf dip trên browser: longtask 50–118ms/
  frame lúc yên tĩnh. Footage thật K vẫn lệch nhưng chứng minh lệch
  thuộc baseline nguồn frame preview (sanity không transition cũng lệch
  tương tự) — không phải lỗi dip, giao follow-up riêng.
- **K4 phát ngược + hold-frame trong app thật** (`docs/PHASE9_ROUND27_K4_REVERSE_HOLD_LIMITS.md`):
  nợ #4 đợt 26 đã đóng: phát ngược toàn cục (bước lùi từng frame, chạm
  0 thì dừng, audio mute toàn bộ, badge "PHÁT NGƯỢC — không audio"),
  phím J đổi nghĩa thành phát ngược/dừng ngược (J trước đây tua −5s).
  Hold-frame chứng minh kích hoạt trong app thật: GOP dày holdDelta 629
  và GOP thưa holdDelta 740, đều 0 tick đen; frame giữ quá 3s chỉ báo
  stale "(cũ)", không expire về đen.
- **K5 load-report panel** (`docs/PHASE9_ROUND27_K5_LOAD_REPORT_LIMITS.md`):
  strip dưới TopBar + panel xem lại warnings J5 sau khi toast đóng, nối
  cả 3 cổng load (mở file, autosave, nhập .vcut.zip — phát hiện
  `importArchive` trước đây nuốt mất `speedCurveWarnings`, nay đã kèm).
  Định vị tới clip cấp cao chứa vi phạm. Panel nhận prop `onFixWarning`
  để K2 nối sau (App hiện chưa truyền nên chưa có nút "Sửa"). i18n 31
  key `loadReport.*` vi/en khớp 1–1.
- **K6 click-test nốt J6 + dọn key** (`docs/PHASE9_ROUND27_K6_CLICKTEST_LIMITS.md`):
  8/8 trên browser thật: ô mốc rỗng đã fix câu báo (chặn riêng, không
  gọi store/toast/undo), mốc ngoài miền chain 2–3 tầng qua panel pass,
  locale en pass. Key `nested.deepNestedEditNote` đã xóa khỏi cả hai
  dict; i18n parity vi = en = 852 key. Hồi quy J6 17/17, I6 13/14 (fail
  R3 là nhiễu thoáng qua đã biết, không phải hồi quy).

## 2. Sửa duy nhất của parent ở bước gộp (trung thực)

- **Archive test 37 pass → 38 pass:** fail duy nhất là tương tác K1 ↔
  archive, KHÔNG phải hồi quy của K5. Import qua `parseProjectText` nay
  chuẩn hóa style text thiếu field (đúng thiết kế K1, đã có test riêng
  6/6 khóa hành vi này), nên fixture `archive.test.cjs` có style từng
  phần (`fontFamily/fontSize/color`) không còn round-trip byte-identical.
  Parent đã sửa fixture thành style đầy đủ đúng default K1
  (`bold: true, italic: false, x: 0.5, y: 0.5, animation: "none"`) kèm
  chú thích — assertion vẫn giữ nguyên dạng so sánh chính xác, không
  nới lỏng. Đây là cập nhật hợp đồng load, không phải sửa test cho qua.
- **Đối chiếu file chung sau sửa song song:** `tsconfig.json` hợp lệ,
  đủ 4 exclude test mới (K1/K2/K4/K5); `preview.tsx` còn cả guard K1
  (4 tham chiếu normalize) lẫn vùng reverse/hold K4 (17 tham chiếu);
  `store.ts` còn cả hai action K2 + K4; `App.tsx` còn cả vùng K4 lẫn
  K5; i18n vi/en đều 852 key, `loadReport.*` 31 key, `splitOffsetEmpty`
  có mặt, `deepNestedEditNote` bằng 0. `tsc` toàn repo 0 lỗi sau gộp.
- **Không nhận công chéo:** phiên K6 đo được 0 exception text-style
  (khác đợt 26: 5 lần/phiên) nhưng bundle đo chứa cả sửa K1 — nợ D7
  được đóng là nhờ K1, K6 chỉ ghi nhận, không nhận công.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Footage thật K lệch baseline (K3):** cơ chế lệch nguồn frame
   preview còn mở (đã loại trừ proxy, fit, lệch thời gian ±15 frame) —
   cần follow-up riêng về video sync, không sửa trong đợt này.
2. **Phát ngược chưa mượt thật (K4):** tốc độ hiển thị hiệu dụng
   ≈14 fps trên GOP dày do seek latency; GOP thưa (g 300) kẹt frame
   ~8.5s vì phải giải mã lại tới 870 frame. WebCodecs decode tay là
   follow-up nếu muốn ngược mượt 30 fps thật. Phát ngược cho clip
   ramp/nested chưa harness-test riêng. Pass xuôi GOP thưa có 54 hold
   chưa giải thích chi tiết.
3. **Bridge vẫn mù với CLI/MCP (K2):** project vi phạm gửi qua CLI/MCP
   (không qua ExportPanel) vẫn nhận lỗi mù — sửa bridge cần cân nhắc
   leak đường dẫn, là việc riêng.
4. **Load-report chưa tự sửa (K5):** panel chưa nối handler sửa của K2
   (App chưa truyền `onFixWarning`); báo cáo chỉ sống trong phiên
   (reload không autosave thì mất); khôi phục từ Lịch sử phiên bản
   không set/xoá báo cáo; câu `message` của J5 luôn tiếng Việt.
5. **K6 chưa bấm:** câu guard mốc rỗng ở phiên en chưa bấm thật; mốc
   âm/trước cửa sổ ở chain sâu qua panel chưa bấm riêng (store đã khóa
   cả hai hướng); NaN qua UI không tạo được.
6. **Nợ cũ vẫn còn:** nhánh dip chưa đo 1080p/4K, sweep p trên footage,
   tổ hợp dip + motion blur/SR/track/mask; tab ẩn hàng giờ / discard
   thật / máy thật (từ đợt 24); kho dọc vẫn thiếu cảnh quay thuần ngoài
   vũ trụ; badge fadewhite/fadegrays vẫn giữ nâng kèm cảnh báo gap
   đơn-clip-vs-cặp từ đợt 26 §2 (chuẩn chặt hơn thì xóa 2 chuỗi khỏi
   tập matched).

## 4. File đổi/thêm (đường dẫn tương đối từ repo root)

- `apps/web/src/lib/projectRepo.ts` (sửa, K1)
- `apps/web/src/preview.tsx` (sửa, K1+K4)
- `apps/web/src/lib/textStyle27K1.test.ts` (mới, K1)
- `apps/web/src/lib/curveFix.ts` (mới, K2)
- `apps/web/src/lib/curveFixRound27K2.test.ts` (mới, K2)
- `apps/web/src/store.ts` (sửa, K2+K4)
- `apps/web/src/ExportPanel.tsx` (sửa, K2)
- `apps/web/scripts/clicktest-dip-browser-pipe.mjs` (mới, K3)
- `benchmarks/results/v27-k3-canvas-dip-browser.json` (mới, K3)
- `apps/web/src/lib/holdFrame.ts` (sửa, K4)
- `apps/web/src/lib/holdFrame.test.ts` (sửa, K4)
- `apps/web/src/lib/reversePlayback.ts` (mới, K4)
- `apps/web/src/lib/reversePlayback.test.ts` (mới, K4)
- `apps/web/scripts/clicktest-reverse-hold-pipe.mjs` (mới, K4)
- `apps/web/src/TopBar.tsx` (sửa, K4)
- `apps/web/src/App.tsx` (sửa, K4+K5)
- `apps/web/src/lib/loadReport.ts` (mới, K5)
- `apps/web/src/lib/loadReport.test.ts` (mới, K5)
- `apps/web/src/components/project/LoadReportPanel.tsx` (mới, K5)
- `apps/web/src/components/project/ProjectMenu.tsx` (sửa, K5)
- `apps/web/src/lib/archive.ts` (sửa, K5)
- `apps/web/src/i18n/vi.json` (sửa, K5+K6)
- `apps/web/src/i18n/en.json` (sửa, K5+K6)
- `apps/web/src/components/nested/NestedClipPanel.tsx` (sửa, K6)
- `apps/web/scripts/clicktest-k6-round27-pipe.mjs` (mới, K6)
- `benchmarks/results/v27-k6-clicktest.json` (mới, K6)
- `benchmarks/results/v27-k6-clicktest-baseline.json` (mới, K6)
- `benchmarks/results/v27-k6-regress-j6.json` (mới, K6)
- `benchmarks/results/v27-k6-regress-i6.json` (mới, K6)
- `apps/web/tsconfig.json` (sửa, K1+K2+K4+K5)
- `apps/web/scripts/archive.test.cjs` (sửa, parent — fixture style đầy đủ theo hợp đồng K1)
- `docs/PHASE9_ROUND27_K1_TEXT_STYLE_LIMITS.md` (mới)
- `docs/PHASE9_ROUND27_K2_CURVE_EXPORT_LIMITS.md` (mới)
- `docs/PHASE9_ROUND27_K3_DIP_BROWSER_LIMITS.md` (mới)
- `docs/PHASE9_ROUND27_K4_REVERSE_HOLD_LIMITS.md` (mới)
- `docs/PHASE9_ROUND27_K5_LOAD_REPORT_LIMITS.md` (mới)
- `docs/PHASE9_ROUND27_K6_CLICKTEST_LIMITS.md` (mới)
- `docs/PHASE9_ROUND27_LIMITS.md` (mới, file này)

KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG binary, KHÔNG dist vào batch.

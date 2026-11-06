# Phase 9 đợt 30 — Đóng nợ đợt 29: K3 sau vá, pass xuôi phần cứng, CLI/proxy, i18n + keyframe, snapshot CDP, quyết định gap cặp — LIMITS tổng hợp

> Đợt lớn 6 luồng song song (M1–M6), KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Kiểm chứng gộp của parent (chạy lại độc lập,
> không lấy số của luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi
> (web), `vite build` pass (8.50s), curveFixKeyframe30 21/21,
> loadReportPerLine29 14/14, bridge error-detail 56/56, jobqueue
> 52/52, error-detail-ui 52/52 (sau khi parent sửa 2 assertion stale —
> xem §2), error-detail-cli-proxy 25/25, node --check 8 script mới +
> bridge pass, i18n vi = en = 899 key lá (tăng 11 so với 888 đợt 29),
> 0 key mồ côi. File build phụ (dist, *.tsbuildinfo) KHÔNG đưa vào
> batch. KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed / FPS
> của M1/M2/M5/M6 — đó là số đo của luồng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **M1 K3 sau vá + truy nguyên chọn frame**
  (`docs/PHASE9_ROUND30_M1_K3_RERUN_LIMITS.md`):
  Harness K3 sau vá L1 chạy lại bằng browser thật: 18/18 KHỚP,
  resampled 0,000 ở cả 18 case — bản vá từ nay đã kiểm chứng
  end-to-end, không còn "mới qua node --check". Probe seek thật
  khóa cơ chế chọn frame: `seekElement` bỏ seek khi
  |currentTime − target| ≤ đúng 1 frame trong khi Chrome báo
  currentTime đã lượng tử hóa xuống (luôn ≤ giá trị đã set) → lùi
  đúng 1 frame luôn bị bỏ seek, hiển thị frame cũ (dự đoán đúng
  9/9 quan sát sạch; giả thuyết "seek đang bay" của L1 bị bác cho
  case frame cũ). Phát hiện thêm bug thứ hai, độc lập và nặng hơn:
  seek chậm hơn timeout 1200 ms → vòng lặp vẽ tick timeout rồi ngủ
  với canvas đã xóa nền → nền đen vĩnh viễn tới lần scrub tiếp theo
  (3/3 case timeout → đen vĩnh viễn; 2/2 seek nhanh → vẽ đúng).
  Không sửa code sản phẩm trong luồng này; đề xuất sửa ở §7 LIMITS
  của luồng (so chỉ số frame thay vì epsilon giây; timeout thì đừng
  đánh dấu đã vẽ/ngủ).
- **M2 pass xuôi phần cứng sau sửa snap**
  (`docs/PHASE9_ROUND30_M2_FORWARD_HARDWARE_LIMITS.md`):
  1.158× đã hết, cụm hold do drift-seek đã hết: lượt sạch nhất
  hold pass xuôi GOP thưa = 0 (so với 54 ở K4 gốc, 40 ở đợt 28),
  không lượt nào còn overspeed. Quan sát mới: dưới tải nặng
  playhead chạy CHẬM (0.72–0.84×), phù hợp với clamp dt 0.1 s có
  sẵn nhưng chưa instrument gap rAF nên chưa chứng minh. fps ngược
  đo được thấp hơn đợt 28 nhưng tất cả lượt đều chạy lúc VM nghẽn
  nặng (load 3.7–7.3, 2 Chrome + 1 ffmpeg cùng lúc) — là cận dưới
  dưới tải, không được đọc là hồi quy; cần chạy lại lúc máy rảnh.
- **M3 CLI không-quiet + /api/proxy**
  (`docs/PHASE9_ROUND30_M3_CLI_PROXY_LIMITS.md`):
  CLI render không-quiet nay pipe stderr worker qua bộ lọc redact
  theo dòng (stdout giữ inherit, exit code/signal giữ nguyên, chế
  độ -q giữ nguyên 100%); route /api/proxy bọc `taskErrorPayload`
  canonical (errorCode luôn kèm, errorDetail chỉ khi ?detail=1).
  Test mới 25/25 qua CLI thật + bridge thật (render clip hỏng thật
  → exit 1, không rò đường dẫn tuyệt đối). CLI caption/tts vẫn
  dùng stdio inherit — ngoài mô tả nợ đợt 29, để đợt sau.
- **M4 dịch nốt + sửa mức keyframe + click-test Cancel**
  (`docs/PHASE9_ROUND30_M4_I18N_KEYFRAME_LIMITS.md`):
  Banner ExportPanel, toast ProjectMenu (mở file/nhập bản nén),
  chuỗi errorDetail L3 nay qua i18n (11 key mới, 899 = 899).
  Toast sau sửa từ ExportPanel nay truyền summary đã dịch thật
  (không còn gọi không tham số). Sửa mức keyframe làm được sạch:
  `sanitizeOneKeyframeCurve`/`fixOneKeyframeViolation`, chỉ keyframe
  đích đổi, keyframe khác giữ nguyên cả giá trị lẫn tham chiếu;
  panel có nút "Sửa keyframe này". Click-test browser thật 8/8,
  gồm case Cancel (không đổi gì, không sinh undo, bấm lại mở cùng
  confirm). M4 có đụng App.tsx ngoài brief (chỉ thêm handler +
  import + prop cho nút kf, không sửa handler cũ nào).
- **M5 snapshot treo CDP + đo lại D7**
  (`docs/PHASE9_ROUND30_M5_CDP_SNAPSHOT_LIMITS.md`):
  Module dùng chung `cdp-snapshot.mjs` ghi snapshot ra file ngay
  lúc timeout (pid, bundle + sha, tiến trình chrome, không ghi đè);
  chứng minh bằng treo giả lập 1 ms có chủ đích trên pipe Chrome
  thật (PASS toàn bộ, lỗi gốc không bị che). Script CDP-DIAG của
  L5 đã nối vào module; các harness pipe khác chưa nối — để đợt
  sau. Đo lại D7 text-style: 0 exception sau load (gốc 5/phiên),
  đã đóng hoàn toàn. Hồi quy K6 guard 8/8, J6 17/17.
- **M6 quyết định gap cặp (A) + blur footage thật + dip thuần**
  (`docs/PHASE9_ROUND30_M6_PAIRGAP_DECISION_LIMITS.md`):
  QUYẾT ĐỊNH: GIỮ mô hình đơn clip + badge `matched` + giới hạn
  ghi rõ, KHÔNG đổi model cặp. M1 (cặp B+C) bị bác vì làm tệ đi ô
  đang KHỚP (FW/FW 2,00→46,00); M2 (đủ 3 clip) hoãn vì còn 1 ô
  LỆCH do hiệu chuẩn trọng số dip, không phải do thiếu clip, và
  đổi kiến trúc xong vẫn còn ô đó. Điều kiện kích hoạt đổi model
  sau (đủ cả 4) ghi trong LIMITS luồng, gồm hiệu chuẩn lại trọng
  số dip trước và composite trong ngân sách ~1,5× dip đơn. Blur
  trên footage thật phức tạp KHỚP (MAD 0,624 / 0,487, ≤8 = 100%).
  Vòng dip thuần chiếm ~93% thời gian (1080p 250–308 ms, 4K
  961–1239 ms) — giả thuyết "longtask chủ yếu là seek/decode" bị
  bác; bottleneck là vòng ImageData từng pixel.

## 2. Sửa của parent ở bước gộp (trung thực)

- Sửa duy nhất: 2 assertion stale trong
  `server/bridge/test/test-error-detail-ui.cjs` do tương tác M3↔M4
  (không phải hồi quy sản phẩm): M4 đã dịch chuỗi errorDetail qua
  i18n nên assertion cũ "UI hiển thị mã" (tìm chuỗi cứng
  "Chi tiết lỗi [") và "không đụng file i18n" đều fail. Parent đã
  cập nhật 2 assertion sang dạng i18n mới (key
  `exportPanel.errorDetailTitle` + code + summary; khẳng định dùng
  i18n thay vì không dùng), không nới lỏng kiểm tra nào khác.
  Sau sửa: error-detail-ui 52/52.
- Đối chiếu file chung sau song song: `ExportPanel.tsx` chỉ có hunk
  M4 (banner/toast/i18n), logic poll `?detail=1` của L3 còn nguyên
  (3 tham chiếu); `App.tsx` chỉ thêm handler/prop của M4;
  `store.ts`/`curveFix.ts`/i18n chỉ có hunk M4; `previewStatus.ts`
  chỉ có comment ghi chú của M6; `server/bridge/src/index.js` chỉ
  có hunk proxy của M3; CLI chỉ có hunk M3. Không mất thay đổi do
  song song.
- Không file .raw/scratch trong repo; dist không stage. File
  `benchmarks/results/v27-k3-canvas-dip-browser.json` bị harness
  M1 ghi đè bằng dữ liệu rerun 18/18 — đưa vào batch đợt 30 vì đó
  chính là bằng chứng kiểm chứng của bản vá (không phải dữ liệu
  cũ của đợt 27 nữa). Log click-test của M4 nằm ở
  `~/workspace/tmp-round30-m4/` ngoài repo, không stage.
- Caveat M1 ghi rõ trong LIMITS luồng: probe v2 chạy trên bundle
  mới `index-C0HfodWe.js` do một luồng khác build lại dist giữa
  v1 và v2; số v2 tái lập bit-identical với v1/L1 ở chỗ so sánh
  được nên kết luận vẫn đứng, nhưng v2 không được trích là "cùng
  bundle với L1".

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Sửa 2 bug seek của M1** (so chỉ số frame thay vì epsilon giây;
   timeout 1200 ms đừng đánh dấu đã vẽ/ngủ) — vòng sau sửa xong
   phải chạy lại đúng probe M1 + hồi quy K3 18/18 trước khi claim
   đã sửa. Tỉ lệ gặp cơ chế B trên máy thật / GOP dày / Safari
   chưa đo; nhánh phát xuôi 0,35s và phát ngược stepping chưa đo.
2. **Chạy lại fps ngược lúc máy rảnh** (M2): xác nhận fps ngược
   không hồi quy so với đợt 28; instrument gap rAF để chứng minh
   cơ chế chạy chậm dưới tải nặng; 30 fps ngược thật vẫn cần
   WebCodecs + demux + cache frame.
3. **CLI caption/tts vẫn stdio inherit** (M3): áp cùng mẫu pipe +
   redact cho 2 lệnh này; log server giữ e.message thô là cố tình
   (kênh local, quyết định đợt 28).
4. **Toast đường Lưu file vẫn chuỗi thô** (M4): saveProject chỉ
   trả string[]; chuỗi blob/migration và toast lỗi trong ProjectMenu
   chưa có dạng cấu trúc để dịch; nội dung errorDetail của bridge
   vẫn tiếng Việt; "không sinh undo" sau Cancel chứng minh gián
   tiếp (độ sâu undo stack không đọc được qua CDP).
5. **Nối cdp-snapshot vào các harness pipe còn lại** (M5): J6,
   spinnerprobe, I6, dip…; lần treo thật có snapshot vẫn chưa xảy
   ra; tọa độ spinner tuyệt đối trên máy user vẫn chưa đo.
6. **Hiệu chuẩn lại trọng số dip cho mô hình cặp** (M6): follow-up
   rẻ nhất, là điều kiện (a) trước khi đổi model; inline vòng lặp
   trên browser chưa đo; blur ở p/mode/weights khác chưa đo.
7. **Nợ cũ vẫn còn:** tab ẩn hàng giờ / discard thật / máy thật (từ
   đợt 24); kho dọc vẫn thiếu cảnh quay thuần ngoài vũ trụ; Safari /
   máy thật / dpr > 1 / viewport khác chưa đo cho dip; D7 autosave
   sau load vẫn không gắn style vào clip top-level (M5 không quy
   kết chắc chắn cho một lớp code cụ thể).

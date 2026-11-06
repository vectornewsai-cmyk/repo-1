# Phase 9 đợt 29 — Đóng nợ đợt 28: dip-trên-footage sạch, playhead snap, errorDetail lên web, sửa riêng từng dòng, click-test nốt, dip browser 1080p/4K — LIMITS tổng hợp

> Đợt lớn 6 luồng song song (L1–L6), KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo. Kiểm chứng gộp của parent (chạy lại độc lập,
> không lấy số của luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi
> (web), `vite build` pass (4.27s), playheadPacingRound29L2 10/10,
> loadReportPerLine29 14/14, reversePlaybackRound28L2 17/17,
> bridge error-detail-ui 51/51, error-detail 56/56, jobqueue 52/52,
> node --check 7 script click-test/đo mới pass, i18n vi = en = 888 key
> lá (tăng 21 key so với 867 đợt 28: 17 curveFix + 4 loadReport),
> 0 key mồ côi. File build phụ (dist, *.tsbuildinfo) KHÔNG đưa vào
> batch. KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed / FPS
> của L1/L5/L6 và phép đo Node/FFmpeg của L6 — đó là số đo của luồng.
> Lỗi tsc ở `curveFix.ts` mà L2/L3 gặp giữa đợt là do L4 đang sửa dở
> file đó; sau khi L4 xong, tsc toàn repo đã sạch — không phải lỗi
> còn tồn tại.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **L1 dip-trên-footage sạch** (`docs/PHASE9_ROUND29_L1_DIP_FOOTAGE_LIMITS.md`):
  Số dip-trên-footage SẠCH đầu tiên: 13/15 case KHỚP từng bit
  (MAD 0,000), hồi quy K3 18/18 không đổi, không sửa code sản phẩm.
  Phát hiện phương pháp: chuỗi đúng RẼ NHÁNH — nhánh thường/fadeblack
  1 bước (video vẽ thẳng lên ctx mang viewport transform), nhánh dip
  white/gray 2 bước (offscreen project → ImageData → device); K3 sai ở
  tọa độ làm tròn 438 thay vì 437,5 (dip white artefact 1,19–1,95,
  dip gray 3,19–4,48). 2 anomaly còn lại (FG-OUT legacy p=0,5 MAD 2,527;
  SANITY MAD 3,303) đều cho sweep dk+1 = 0,000 từng bit — tức frame app
  hiển thị là frame nguồn kề sau, không phải lỗi dip/màu/resample;
  probe run 2 tái lập hiệu ứng chọn frame theo lịch sử scrub (sanity
  tiếp cận ngược 1 frame cho frame 49, tiếp cận xuôi cho frame 48).
  Harness K3 sau vá (bỏ Math.round tọa độ, resample rẽ nhánh) mới chỉ
  qua `node --check`, CHƯA chạy lại end-to-end bằng browser.
- **L2 playhead snap nửa frame** (`docs/PHASE9_ROUND29_L2_PLAYHEAD_SNAP_LIMITS.md`):
  Nguyên nhân gốc drift-seek pass xuôi: vòng phát xuôi cũ gọi
  `setPlayhead(playhead + dt)` mỗi tick rAF trong khi `setPlayhead`
  snap Math.round về frame gần nhất; tick 16.7 ms = nửa frame ở
  30 fps nên tốc độ thành 1.158× (đo đợt 28). Sửa: nhánh phát xuôi
  tích lũy dt bằng `forwardAcc` (đối xứng `reverseAcc`), chỉ gọi
  `setPlayhead` khi đủ nguyên frame; lệch tích lũy chặn ở 1 frame.
  Cố tình KHÔNG đổi ngữ nghĩa `setPlayhead` toàn cục (scrub/trim vẫn
  cần snap). Mô phỏng dùng hàm thật: cũ 1.0912× với 9 lần vượt ngưỡng
  drift-seek 0.35 s, mới 0.9998×, 0 lần, lệch max 1 frame; test mới
  10/10; hồi quy phát ngược đủ (10/10, 17/17, 13/13, 14/14, 46/46,
  34/34, 31/31). Chưa có số đo phần cứng mới cho pass xuôi sau sửa.
- **L3 errorDetail lên web + bridge hết mù nốt**
  (`docs/PHASE9_ROUND29_L3_ERRORDETAIL_UI_LIMITS.md`):
  ExportPanel poll kèm `?detail=1` và hiển thị detail đã redact khi
  job lỗi (`error` cũ giữ làm mặc định); 10 catch route bridge còn lại
  (caption, translate, reframe, analyze, beats, bgremove, silence,
  scene, tts, tts/clone) trả errorDetail canonical, redact tail ở
  nguồn tại 7 worker module; `openapi.yaml` thêm schema ErrorCode (8
  enum), ErrorDetail, query `detail`; MCP probeVideo/render_video bỏ
  stderr thô. Bridge server thật end-to-end qua HTTP đã chạy: không
  detail → chỉ error + errorCode; `?detail=1` → có detail; danh sách
  → không detail; job asset thiếu → MISSING_ASSET, đường dẫn đã cắt.
  Test mới 51/51, hồi quy 56/56 + 52/52. Còn thô: CLI không-quiet vẫn
  in stderr worker trực tiếp (stdio inherit); route `/api/proxy` còn
  trả `e.message` trực tiếp; chuỗi UI mới đang cứng tạm, chờ i18n.
- **L4 sửa riêng từng dòng** (`docs/PHASE9_ROUND29_L4_PERLINE_FIX_LIMITS.md`):
  Store action mới `fixOneSpeedCurveViolation` + `sanitizeOneSpeedCurve`
  (parse cả path `.subSpec.` nested, chỉ clip đích đổi, clip khác giữ
  nguyên tham chiếu, track khóa → skippedLocked, không cứu được →
  unsalvageable kèm reasonKey); panel mỗi dòng có nút "Sửa dòng này",
  thêm nút riêng "Sửa tất cả curve vi phạm" giữ hành vi đợt 28 với
  nhãn rõ ràng. Dịch nốt J5 trong phạm vi luồng: 17 key curveFix +
  4 key loadReport mới, confirm/toast tóm tắt/toast autosave dịch
  theo locale, message vi giữ nguyên từng chữ. Click-test browser thật
  6/6 (per-line A=4, B vẫn 9; fix-all A=4, B=4; phiên en không rò key
  thô/vi). Test mới 14/14, hồi quy 96 xanh tổng. Hạt sửa là mức clip,
  không phải mức keyframe; chưa dịch banner ExportPanel và toast
  ProjectMenu (không sửa lén, thuộc luồng khác); confirm auto-accept
  trong click-test, case Cancel chưa có click-test.
- **L5 click-test nốt** (`docs/PHASE9_ROUND29_L5_CLICKTEST_LIMITS.md`):
  Browser thật 6/6: mốc âm và mốc trước cửa sổ ở chain 3 tầng locale
  en chặn đúng từng chữ; spinner dương đã xác định nút thật (tăng
  y 30–45%, giảm y 55–70% chiều cao ô, x cách mép phải 10–22px;
  10→11→12→11→10; ô rỗng + tăng → 1). Treo CDP K6 kết luận nhiễu hạ
  tầng thoáng qua với tin cậy cao nhưng KHÔNG tuyệt đối: 5/5 chạy
  chẩn đoán không treo, nhưng lần treo gốc thiếu snapshot process và
  bundle đã bị build đè nên không tái hiện được; script chẩn đoán
  CDP-DIAG để sẵn cho lần treo sau. Hồi quy J6 17/17, K6 guard 8/8
  (3 lần chạy đầu 7/8 do quên đặt K6_EMPTY_MODE=guard, đã chạy bù).
- **L6 dip browser 1080p/4K + tổ hợp + kênh G**
  (`docs/PHASE9_ROUND29_L6_DIP_BROWSER_LIMITS.md`):
  Click-test browser thật run cuối 25/25 KHỚP: dip 1080p và 4K giống
  hệt nhau từng chữ số (không bug phụ thuộc độ phân giải); tổ hợp
  mask/SR/track trên browser KHỚP, vùng ngoài phủ đúng nền khung
  (10,12,16), dip không lọt ra ngoài; blur browser KHỚP (MAD 0,676,
  0,83% pixel biên vạch > 8); clip ngắn 12,6 alpha tích 0,2253 KHỚP.
  Longtask cận trên (gồm seek/decode/rAF): 1080p dip 260–450 ms vs
  thường 0–95 ms; 4K dip 712–1176 ms vs thường ~100 ms. Node/FFmpeg:
  wiring clip ngắn (B) 0,0000 ở phẳng/1080p/footage, nhưng gap cặp (A)
  LỆCH từ localT 0,75 trở đi, tệ nhất FB/FW 248,33 — giới hạn kiến
  trúc: từ p_out ≈ 0,20 alpha tích = 0, preview sụp về dip thuần
  trong khi xfade thứ hai vẫn kéo về clip C. Kênh G fadeblack ĐÃ
  truy nguyên xong: xfade fadeblack cho chroma ra = 127 thay vì 128
  ở mọi p (fade thường đúng 128); qua bt601 tái tạo đúng signed đo
  tới ~0,1 (offset kênh R −20,9 / G −16,3 / B −21,6 so với hằng số
  đơn −21,05). Badge giữ `matched`, chỉ bổ sung 3 giới hạn vào ghi
  chú J3 trong `previewStatus.ts` (bão hòa YUV p≈0,17–0,27; gap tổ
  hợp; clip ngắn tới ~248); offset theo kênh cố tình không nối vào
  code vì verdict đã KHỚP.

## 2. Sửa của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Đối chiếu file chung sau song song:
  `preview.tsx` chỉ có hunk L2 (forwardAcc, 7 tham chiếu);
  `ExportPanel.tsx` chỉ có hunk L3 (`?detail=1`, 3 tham chiếu);
  `App.tsx`/`store.ts`/`curveFix.ts`/`LoadReportPanel.tsx`/i18n chỉ có
  hunk L4; `tsconfig.json` đủ exclude test mới của L2 và L4 (dedupe
  1 file chung, không xung đột); `previewStatus.ts` chỉ có comment
  badge của L6; script `clicktest-dip-browser-pipe.mjs` chỉ có vá
  tọa độ của L1 (L6 dùng script riêng, không đụng file này).
- i18n vi/en đều 888 key lá, 0 key mồ côi (17 curveFix + 4 loadReport
  mới của L4, parity 1–1).
- Không file .raw/scratch trong repo; dist không stage.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Chạy lại harness K3 sau vá bằng browser** (L1): bản vá tọa độ +
   resample rẽ nhánh mới qua syntax check; lần chạy K3 sau vá là lần
   kiểm chứng đầu tiên của bản vá.
2. **Cơ chế chọn frame theo lịch sử scrub** (L1): cần probe đọc
   `seeking`/`currentTime` thật của element app để tách cửa app-seek
   khỏi cửa harness-capture; chưa đủ căn cứ sửa code sản phẩm; bất
   đối xứng P2-vs-P6 (FG đúng / sanity sai với cùng bước lùi 1f)
   chưa khóa.
3. **Số đo phần cứng pass xuôi sau sửa snap** (L2): chạy lại harness
   clicktest K4/đợt 28 trên Chromium thật, kỳ vọng hold GOP thưa giảm
   từ ~40–54 về mức GOP dày (~5–7); 30 fps ngược thật vẫn cần
   WebCodecs + cache frame.
4. **CLI không-quiet + route `/api/proxy` còn thô** (L3): chặn hẳn
   stderr CLI cần spawn pipe + lọc redact theo dòng; `/api/proxy`
   nên bọc `taskErrorPayload`; chuỗi UI errorDetail cần key i18n
   thật thay chuỗi cứng tạm.
5. **Dịch nốt ngoài phạm vi L4**: banner ExportPanel, toast mở
   file/nhập bản nén trong ProjectMenu, toast sau sửa từ ExportPanel
   (gọi action không tham số summary); sửa mức keyframe (hiện là
   mức clip); click-test case user bấm Cancel ở confirm.
6. **Treo CDP gốc chưa tuyệt đối** (L5): lần treo sau phải có snapshot
   CDP-DIAG; tọa độ spinner đo trên Chromium VM, pixel tuyệt đối có
   thể khác trên máy user; D7 text-style chưa đo lại.
7. **Gap cặp (A) clip ngắn tới ~248** (L6): giới hạn kiến trúc preview
   sụp về dip thuần khi alpha tích = 0 trong khi xfade thứ hai vẫn
   kéo về clip C — cần quyết định kiến trúc (đổi model cặp hay chấp
   nhận badge + giới hạn ghi rõ); blur browser mới đo trên vạch tổng
   hợp, chưa phải footage thật phức tạp.
8. **Nợ cũ vẫn còn:** tab ẩn hàng giờ / discard thật / máy thật (từ
   đợt 24); kho dọc vẫn thiếu cảnh quay thuần ngoài vũ trụ; Safari /
   máy thật / dpr > 1 / viewport khác chưa đo cho dip; longtask 4K là
   cận trên, không phải thời gian hàm dip thuần.

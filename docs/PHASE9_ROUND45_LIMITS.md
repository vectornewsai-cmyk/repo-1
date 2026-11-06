# Phase 9 đợt 45 — LIMITS tổng hợp (đóng nợ đợt 44, 6 luồng, KHÔNG push)

Lượt cron 02:03 05/11/2026. Chốt chặn: `round-in-progress.md` KHÔNG tồn
tại → chạy bình thường. Trước đợt: 25 file paths / 1020 entry chờ push
(đợt 22–44; đợt 1–21 đã push xong chiều 29/10). Chủ đề lấy từ nợ mở
đợt 44 §4, trừ 2 nợ cần cửa sổ yên từ main chat (phiên solo A/B thật,
phiên quiet khóa cổng CPU) vẫn giữ làm nợ mở, không ép đóng.
KHÔNG push, KHÔNG tag/release, KHÔNG binary trong batch.

## 1. Nội dung 6 luồng

- **A1 settle** (`PHASE9_ROUND45_A1_SETTLE_LIMITS.md`): mirror W2 thuần
  (`mirrorDecodeWindow`, `classifyW2`: fast-path / unknown / fail /
  full / partial-gop / partial-inside-corrupt) + `chooseCorruptWindow`
  chọn cửa sổ W2 nằm trọn trong GOP hỏng (khả thi ⇔ effectiveWindow
  ≤ độ dài GOP, dịch +1 tránh fast-path). Phát hiện từ mô hình (không
  phải số đo headed): với tham số Z1 (32,7 s, fps 30, GOP 90, eff 75),
  decode [900,981] nằm trọn GOP hỏng [900,990) — nếu headed sau đo
  decodeFrom = 900 thật thì giả thuyết "tràn GOP lành" của Z1 là sai
  cho attempt đó. Mốc headed sau: 32,4667 s (targetPos 974). Test
  20/20; probe 6 mục 0 FAIL, 1 NOT-MEASURED. Không sửa production.
- **A2 pause** (`PHASE9_ROUND45_A2_PAUSE_LIMITS.md`): lib thuần phân
  loại quirk đáp sai (`correct` / `zero-landing` / `wrong-landing` /
  `intentional-zero`, fail ở lần sai thứ 3, seek 0 có chủ ý không tính
  quirk), test 14/14, CHƯA nối vào seek.ts/preview.tsx. Harness headed:
  guard Z2 PASS ở mức helper trong Chromium thật (chưa phải vòng lặp
  preview đầy đủ); quirk seek-landing-0 NOT_MEASURED — fixture tái tạo
  lệch vị trí packet so với Y2 nên không tái hiện đáp sai (lần PASS giả
  đầu do server thiếu Range đã HỦY, không trích dẫn); kind `"error"`
  production vẫn chưa có bằng chứng (E1 tổng hợp PASS, E2 quan sát
  không reject, E3 hazard sync-throw treo promise). Quan sát: Chrome
  thật không tạo lại source cho cùng element sau release (khác mock Z2).
- **A3 TTS** (`PHASE9_ROUND45_A3_TTS_LIMITS.md`): ước lượng phân tầng
  theo độ dài (veryShort <20 / short 20–79 / medium 80–199 / long
  ≥200), tâm mọi tầng vẫn 18,4 ký tự/giây của Z3, cờ `calibrated`
  đều false — khoảng là phòng thủ, không phải khoảng tin cậy thống kê.
  Đo thêm 2 mẫu thật qua `tts.py` (WAV ở /tmp, ngoài repo): 9 ký tự
  giọng Hải Đăng 0,720 s (12,5 ký tự/giây, tỉ lệ 1,47, trong khoảng
  veryShort); 71 ký tự giọng Trúc Ly 3,920 s (18,1 ký tự/giây, tỉ lệ
  1,02, trong khoảng short) — mỗi trường hợp n = 1 nên chỉ khóa
  "nằm trong khoảng", không đổi hệ số. Test 10/10 + relink biên
  12/12 + hồi quy Z3 9/9. Relink biên: không tìm thấy bug thật; giả
  thuyết nested quét 2 đã bị test bác bỏ (srcOf bỏ qua kind nested
  nhất quán). Lib CHƯA nối vào `TtsButton`.
- **A4 GOP** (`PHASE9_ROUND45_A4_GOP_LIMITS.md`): tail-scan moov cuối
  file với 3 cửa (kết thúc đúng EOF, gọn trong đuôi dưới trần 16 MiB,
  payload có cả `mvhd` lẫn `trak`; nhiều ứng viên thì lấy ngoài cùng
  nhất). Nối vào `gopRangeFetch39T3.ts` chỉ từ nhánh `unknown` mà
  đường Z4 không áp dụng; các nhánh Z4 đã xác định moov vẫn return
  ngay. Giữ nguyên trần wiring 128 MiB, trần moov 16 MiB, tiền tố
  512 KiB, mặc định GOP tắt. Test mới 18/18; hồi quy T3 10/10, Z4
  19/19, Y4 10/10, X4 10/10, W4 15/15, V2 16/16, Y6 11/11 (tổng 91/91).
  Headed qua bridge Express thật 7/7 cổng: fixture trailing 292.790
  byte ra `gop-range`, 60 sample, 6 GOP, 10 request, 0 GET toàn file
  (lưu ý: fixture nhỏ hơn cửa sổ 16 MiB nên tail range là toàn file
  nhưng vẫn qua Range 206). File trailing nhỏ (moov gọn trong tiền tố)
  vẫn fallback `moov-trailing` có chủ ý — tail-scan chỉ chạy từ
  nhánh `unknown`.
- **A5 probe** (`PHASE9_ROUND45_A5_PROBE_LIMITS.md`): đo lại stss độc
  lập khớp Z5 — `sparse-gop-noise.mp4` GOP hiệu dụng 30 (không phải
  300), `sparse-gop-flat.mp4` và `noise-30s.mp4` GOP 300 thật. Bảng
  audit 355 dòng: 19 dòng §2.5 của Z5 + echo tổng hợp sai nhãn (số đo
  vẫn đứng; độ trễ 9–13 s là thật nhưng không đổ được cho độ dài GOP);
  docs cũ không sửa trực tiếp, đính chính sống ở bảng A5. Sửa code
  duy nhất: 2 comment trong `per-seek-probe.mjs`. `freeze-dist.mjs`
  giữ nguyên (chain không tái hiện lỗi cũ). Chuỗi chain solo→Q6→N2
  chạy lại CHAIN-OK, exit 0 (33 entry, validate 0 problem,
  q6PerSeekMatchesN2 = true; verdict N2 riêng PARTIAL dưới tải
  under-load, không phải lỗi chuỗi). Test 11/11 (mới 4/4, Z5 3/3,
  freeze 4/4).
- **A6 compat** (`PHASE9_ROUND45_A6_COMPAT_LIMITS.md`): badge từng
  frame theo `controller.failed` (webcodecs + failed → `element-failed`,
  nền amber; chỉ xét clip đang stepping) + effect `[previewLang]` ghi
  thẳng DOM khi đổi lang lúc pause (cách cũ kẹt chuỗi cũ tới khi loop
  tỉnh lại, lâu hơn "1 tick"). `store.ts` rà và không cần sửa. Đo
  chi phí probe `isConfigSupported` thật trên Chromium headed, 3 arm
  × 600 lần, under-load: median <0,1 ms, p95 0,1 ms/cửa sổ (dưới độ
  phân giải đo, không phải 0 tuyệt đối); prefer-hardware 0/600
  supported trên VM không GPU nhưng production chỉ dùng
  prefer-software nên an toàn. Test mới 12/12, hồi quy Z6 10/10.
  Nhánh element-failed tạm dùng key element-missing với
  api="WebCodecs decode" vì luật file cấm A6 sửa `i18n/*.json` — cần
  2 key mới (`badgeElementFailed`/`titleElementFailed`) ở đợt sau cho
  đúng nghĩa "decode thất bại" thay vì "thiếu".

## 2. Kiểm chứng gộp của parent (độc lập)

- Đối chiếu baseline đầu đợt (`find -newer` so với
  round45-baseline.txt): đúng 25 file đổi/mới, khớp chính xác hợp
  6 danh sách LIMITS (0 file lạ; không binary, không dist, không
  pycache). File chung nguyên vẹn: preview.tsx chỉ có hunk A6 (6
  marker ROUND45-A6, còn lại là marker Z2/Z6 cũ); gopRangeFetch chỉ
  hunk A4; per-seek-probe chỉ 2 comment A5; store.ts không có marker
  45A (đúng giao — A3/A6 đều không sửa store).
- Sửa duy nhất của parent ở bước gộp: thêm 5 dòng exclude test mới
  vào `apps/web/tsconfig.json` (pause45A2, ttsEstimate45A3,
  relinkEdge45A3, gopTail45A4, reverseBadge45A6) theo yêu cầu các
  luồng; test settle45A1 không cần vì import không đuôi `.ts`.
  Không sửa logic luồng nào.
- Parent chạy lại: `tsc --noEmit` 0 lỗi; `vite build` pass (6,13 s,
  outDir /tmp, chỉ cảnh báo chunk cũ >500 kB). Test mới chạy lại
  bằng esbuild bundle `--format=esm`: A1 20/20, A2 14/14, A3 10/10 +
  12/12, A4 18/18, A6 12/12 — fail 0. Hồi quy chạy lại: Z4 19/19, Z6
  10/10, T3 10/10, Z3 9/9, Z1 19/19, Z2 11 passed. KHÔNG chạy lại ở
  bước gộp: mọi phép đo browser headed/FPS của các luồng, phiên solo
  thật, đo IDB thật, click-test headed từng panel (chỉ đối chiếu
  LIMITS + test Node).
- Lưu ý cách chạy: vòng hồi quy đầu của parent bị lỗi cú pháp sed
  (dấu `/` trong đường dẫn) — đã chạy lại đúng và ghi số ở trên,
  không phải lỗi code.

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round45-closing-debts44.txt`
  (27 file text, NUL-delimited, không binary, không dist, không
  pycache, đã verify read-back 27 entry + mọi file tồn tại) — gộp
  A1–A6 + tsconfig + LIMITS này.
- Tổng batch đang chờ user push sau đợt này: 26 file paths / 1047
  entry (1020 đợt 22–44 + 27 đợt này; đợt 1–21 đã push xong).
  Entry đếm theo batch, file trùng giữa các batch tính nhiều lần
  như tiền lệ.

## 4. Nợ mở cho đợt 46

1. Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat (nợ gốc nhiều đợt).
2. Settle-drop: SUCCESS trên đường `asset:` vẫn mở — lần headed sau
   dùng mốc 32,4667 s + mirror decodeFrom/decodeTo/key/decoded +
   lastWindowKey + cacheSize; tab ẩn ≥ 5 phút thật chưa đo; click-test
   thật vỏ UI `.vcut.json` qua ProjectMenu chưa làm.
3. Pause: bằng chứng headed cho fail-fast seek-landing-0 vẫn thiếu
   (cần tái tạo đúng fixture Y2 video-only/cùng tham số encode +
   chuỗi probe v3); bằng chứng vòng lặp preview đầy đủ cho cả 3 sửa
   Z2 vẫn thiếu; quirk frame khác 0 chưa nối vào seek.ts; kind
   `"error"` production + hazard Seeker sync-throw vẫn mở (cần luồng
   riêng quyết định có bọc executor thành reject hay không).
4. TTS: tầng veryShort mới n = 1, giọng khác mới n = 1 — cần ≥3 mẫu/
   tầng mới gắn `calibrated: true`; lib A3 chưa nối vào `TtsButton`;
   bridge expose `X-TTS-*` vẫn cần restart sau pull; Safari/Firefox/
   máy thật chưa đo.
5. GOP: giữ trần 128 MiB (tail-scan không thêm bằng chứng cho 3 điều
   kiện đợt 42); moov không phải box cuối cùng, moov trailing
   > 16 MiB, file fragmented; file trailing nhỏ vẫn fallback
   `moov-trailing` (cần bàn lại hợp đồng gate U2); headed qua
   production vite :5173 → bridge :8787 thật và qua controller wiring
   cho file trailing trong (32,128] MiB chưa đo.
6. Probe: trần 1000 trên element preview thật (MediaPool) vẫn chưa
   đo — cần đường asset HTTP trong app; docs cũ vẫn mang nhãn sai
   tại chỗ (đính chính chỉ ở bảng A5).
7. Compat: 2 key i18n mới cho nhánh element-failed (wording hiện tại
   dùng key element-missing); headed cho effect đổi lang lúc pause
   và badge failed trên Chromium thật chưa có; badge vẫn là 1 badge
   toàn cục ở playhead, không tách riêng từng track; Safari/Firefox/
   máy thật/màn hình vật lý vẫn CHƯA ĐO.
8. Chung: mọi số timing đợt 45 đều under-load (6 luồng song song),
   cấm dùng làm baseline quiet hay claim fps.

# Phase 9 đợt 79, luồng G5 — Kernel BC upscale: sweep rộng nội dung khác (nợ đợt 78 §4.5)

- **Luồng:** G5, đợt 79 (nợ đợt 78 §4.5 / LIMITS F6 §7.2, §7.8: thang >1,3
  chưa phân biệt được kernel; chỉ đo 4 nội dung, 2 thang sạch).
- **Ngày:** 10/11/2026. Repo local `~/workspace/repo-1`, HEAD `5f548ef8`.
  **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: KHÔNG SỬA PRODUCTION.** Kernel BC(0,25, 0,375) đã nối ở F6
  được GIỮ NGUYÊN. Sweep trên 6 nội dung mới × 4 thang (0,632 / 1,132 /
  1,264 / 2,264): tổng verdict upscale **tam giác 32/80 vs BC 31/80 — hoà
  trong sai số** (chênh 1 verdict/80). BC thắng rõ ở chỉ số nhạy-kernel
  nhất (sharp-delta KHỚP 15 vs 12), nhưng thua ở plain MAD (BC tệ hơn
  trên 12/16 cặp nội dung×thang) và noise ở thang lớn (thua 2 verdict,
  đều do hiệu ứng chroma/G-std ở project 640, không phải do kernel —
  xem §4, §6). Không có bằng chứng rõ ràng để đổi nhánh BC hay giới hạn
  theo nội dung; đổi (B,C) cũng không được ủng hộ (lưới §5 chênh ≤1
  verdict, hướng không nhất quán).

## 1. Nội dung đo (6 nội dung MỚI, chưa từng đo ở E9/F6)

| Nội dung | Mô tả | Kích thước | Thời lượng |
|---|---|---|---|
| textsmall | Nền tối + 26 dòng chữ 12px (PIL/DejaVuSans) + hàng ô màu nhỏ | 1280×720, 30fps | 4,0 s |
| gradient | Gradient 3 màu chéo mượt (`gradients` c0=1a2a6c/c1=b21f1f/c2=fdbb2d) | 1280×720, 30fps | 4,1 s |
| photo | 1 frame thật từ ocean06.ogv (t=3s), loop thành clip tĩnh | 1280×720, 30fps | 4,2 s |
| noise | 1 khung noise tĩnh (numpy uniform [0,255], seed 79), loop — **v2, xem §7** | 1280×720, 30fps | 4,3 s |
| lineart | Nền trắng + lưới 1px/16px, đường chéo, vòng tròn đồng tâm (PIL) | 1280×720, 30fps | 4,4 s |
| videoframe | ocean06.ogv transcode h264 (clip chuyển động thật, 1920×1080 25fps) | 1920×1080 → 1280×720 | 6,4 s |
| *640 | 5 bản 640×360 của textsmall/gradient/photo/noise/lineart, **sinh NATIVE ở 640** (không downscale từ 1280 — tránh nhiễm downscale của F6 §4) | 640×360, 30fps | như trên |

- Thời lượng khác nhau (4,0/4,1/4,2/4,3/4,4/6,4) để harness headed khớp
  video element theo duration (fix D3 của F6).
- **Lưu ý trung thực:** gradient640 và noise640 KHÔNG phải bản thu nhỏ của
  bản 1280 (gradients dùng góc ngẫu nhiên khác nhau; numpy seed 79 vẽ
  mảng khác kích thước) — chúng là 2 ảnh khác nhau, chỉ so sánh kernel
  ĐƯỢC trong cùng thang, không so xuyên thang cho 2 nội dung này.
  textsmall/photo/lineart 640 là cùng ảnh thu nhỏ (cùng code, cùng frame).

## 2. Phương pháp (tái dùng máy đo E9/F6, thêm 1 cột đối chứng)

- Render frame: preencode đúng chuỗi R65 (trim 0–4, scale, pad, setsar,
  fps 30, yuv420p + effect sharp05/sharp10/noise05/noise10), frame đo 30
  (playhead 1,0 s); fullrgb yuv→rgb (bt709 cho 1280, **bt601 cho 640 —
  sửa §7**). Script `r79g5-render-frames.mjs`.
- Preview: headed Chromium 1254 qua Xvfb + vite dev, snapshot full-pixel
  vùng video, giao thức D1/D2/D3 + H9 (script `r79g5-fullpixel-headed.mjs`,
  cổng dev 566x/debug 976x/display :180–:189, riêng khỏi các luồng đợt 79).
  7 run: A w2560-p1280 6 nd (19/19 pass), B w1920-p1280 6 nd (19/19),
  C w2560-p640 5 nd (15/16 — 1 FAIL D1 noise640 v1, xem §7), D w1920-p640
  5 nd (16/16), A2/B2/C2 chụp lại noise v2 (4/4 mỗi run).
- Phân tích: `r79g5-fullpixel-analyze.mjs` (sao từ F6 + thêm phương pháp
  **triangle-old**): mỗi nội dung×thang đo 5 verdict (plain MAD, sharp05
  delta, sharp10 delta, noise05 G12, noise10 G12) cho 6 phương pháp:
  trilinear (= production hiện tại), triangle-old (= production TRƯỚC F6),
  bc025-0375, lưới (1/3,1/3), (1/3,0,4), (0,25,1/3).
- **Kiểm chứng triangle-old:** tái lập đúng từng số tri PRE-wiring của E9
  trên test-pattern w2560 (plain MAD 0,969 le8 99,6%; BC 1,017/99,2%) —
  xem `/tmp/r79g5-tri-check.mjs` (đã chạy, không stage vì file /tmp).
- Ngưỡng verdict như E9/F6 (plain/sharp: KHỚP MAD ≤ 2 & le8 ≥ 99%;
  noise: std ratio [0,85, 1,18] & |Δkurt| ≤ 0,35 & |Δcorr| ≤ 0,12; cổng G12).

## 3. Kết quả tổng — BC vs tam giác (verdict KHỚP / 5 mỗi nội dung)

| Thang | Nội dung | tam giác | BC(0,25,0,375) | Ghi chú |
|---|---|---|---|---|
| 0,632 ↓ | textsmall | — (chỉ trilinear: 2/5: noise05+noise10) | = (downscale không đổi) | plain XẤP XỈ 1,747; sharp delta XẤP XỈ 0,475/0,473 |
| 0,632 ↓ | gradient | — (3/5) | = | sharp delta KHỚP 0,106/0,137; noise KHỚP |
| 0,632 ↓ | photo | — (4/5) | = | sharp delta KHỚP 0,752/0,740; noise KHỚP |
| 0,632 ↓ | noise v2 | — (2/5) | = | plain XẤP XỈ 4,64; sharp delta XẤP XỈ 4,34/4,57; noise KHỚP |
| 0,632 ↓ | lineart | — (0/5) | = | plain XẤP XỈ 5,414; sharp delta XẤP XỈ 4,90; **noise LỆCH cả 2 mức** (Δkurt G 0,43) |
| 0,632 ↓ | videoframe | — (4/5) | = | sharp delta KHỚP 0,656/0,949; noise KHỚP |
| **1,132 ↑** | textsmall | 2/5 | **3/5** | BC: sharp05 delta 0,549→0,394 **XẤP XỈ→KHỚP**; plain 1,500→1,671 (tệ hơn) |
| **1,132 ↑** | gradient | 4/5 | 4/5 | Hầu như bằng nhau (sharp delta 0,119/0,160 cả 2) |
| **1,132 ↑** | photo | 3/5 | **4/5** | BC: sharp10 delta 1,005→0,757 **XẤP XỈ→KHỚP**; plain 2,005→2,088 |
| **1,132 ↑** | noise v2 | 2/5 | 2/5 | Sharp delta BC tốt hơn nhiều (5,393→3,989 / 6,059→4,236) nhưng vẫn XẤP XỈ; plain BC tệ hơn (2,795→4,535) |
| **1,132 ↑** | lineart | 0/5 | 0/5 | Noise LỆCH cả 2 kernel (Δkurt G 0,61→0,49; Δcorr 0,15→0,146) — xem §4 |
| **1,132 ↑** | videoframe | 3/5 | 3/5 | Gần bằng nhau (sharp delta 0,785→0,765 / 1,194→1,154) |
| **1,264 ↑** | textsmall640 | 2/5 | 2/5 | BC: sharp05 delta 0,661→0,478 **XẤP XỈ→KHỚP**; plain tri KHỚP 1,473 vs BC XẤP XỈ 1,659 |
| **1,264 ↑** | gradient640 | 4/5 | 3/5 | BC thua 1: noise05 std G 0,87→0,82 (dưới ngưỡng 0,85) — xem §6 |
| **1,264 ↑** | photo640 | 3/5 | 3/5 | Sharp delta BC tốt hơn (1,118→1,020 / 1,215→1,014); noise LỆCH cả 2 (tri: Δcorr R 0,122/0,125 vượt; BC: std G 0,81/0,82) |
| **1,264 ↑** | noise640 | 0/5 | 0/5 | Sharp delta BC tốt hơn (5,886→4,496); noise LỆCH cả 2 (Δcorr R 0,143–0,156) |
| **1,264 ↑** | lineart640 | 0/5 | 0/5 | Noise LỆCH cả 2, BC tệ hơn (Δkurt G 0,54→0,98) — xem §4 |
| **2,264 ↑** | textsmall640 | 2/5 | 1/5 | BC thua 1: plain tri KHỚP 1,460 vs BC XẤP XỈ 1,644 |
| **2,264 ↑** | gradient640 | 4/5 | 3/5 | BC thua 1: noise05/10 std G 0,87/0,89→0,82/0,84 |
| **2,264 ↑** | photo640 | 3/5 | 3/5 | Sharp delta BC tốt hơn (1,108→1,013); noise LỆCH cả 2 |
| **2,264 ↑** | noise640 | 0/5 | 0/5 | Sharp delta BC tốt hơn (5,81→4,417); noise LỆCH cả 2 (Δcorr) |
| **2,264 ↑** | lineart640 | 0/5 | 0/5 | Noise LỆCH cả 2; sharp delta BC tệ hơn chút (5,305→5,526) |

**Tổng upscale (16 nội dung×thang × 5 verdict = 80/cột): tam giác 32 vs
BC 31.** Theo chỉ số: sharp-delta KHỚP **BC 15 vs tri 12**; noise G12
KHỚP tri 14 vs BC 12; plain KHỚP tri 6 vs BC 4.

## 4. Phân tích theo chỉ số — cái nào là tín hiệu kernel, cái nào là nhiễu nền

- **Sharp-delta (tín hiệu kernel sạch nhất — đã trừ plain base): BC thắng.**
  BC cho delta MAD thấp hơn tam giác trên 10/16 cặp nội dung×thang (cả 2
  mức), bằng trên 3 (gradient cả 3 thang, chênh ≤0,003), tệ hơn trên 3
  (lineart cả 3 thang, chênh ≤0,23). BC lật 2 verdict XẤP XỈ→KHỚP ở 1,132 (textsmall sharp05,
  photo sharp10) và 1 verdict ở 1,264 (textsmall640 sharp05), không làm
  mất verdict sharp nào ở 1,132. Ở thang
  lớn, sharp-delta BC vẫn tốt hơn về số tuyệt đối (vd photo640 1,02 vs
  1,12; noise640 4,50 vs 5,89) nhưng verdict không đổi vì ngưỡng KHỚP
  (MAD ≤ 2) đã vượt xa — thang lớn không phân biệt được bằng verdict,
  chỉ bằng số tuyệt đối.
- **Plain MAD (nhiễu nền chiếm ưu thế — F6 §7.1 đã ghi): tam giác thắng.**
  BC tệ hơn tam giác trên 12/16 cặp (chênh +0,02…+1,81; tệ nhất noise
  1,132: 2,795→4,535 và lineart640: 4,28→5,91; bằng nhau ở gradient cả
  3 thang và videoframe 1,132, chênh ≤0,006). Plain MAD đo chủ yếu
  base mismatch decoder/render (yuv420p round-trip, chroma subsampling,
  aliasing 1px) chứ không đo kernel — bằng chứng: plain MAD của gradient
  gần như KHÔNG ĐỔI giữa 2 kernel (1,892 = 1,892 ở 1,132; 1,240 = 1,242
  ở 1,264/2,264) trong khi sharp-delta đổi rõ. Đừng dùng plain MAD để
  kết luận kernel thua — nhưng cũng đừng bỏ qua: BC KHÔNG cải thiện plain
  trên bất kỳ nội dung mới nào (trừ bằng nhau ở gradient/videoframe).
- **Noise (thống kê delta): hoà ở 1,132, thua nhẹ ở thang lớn — nhưng
  nguyên nhân KHÔNG phải kernel.** Ở 1,132, noise KHỚP cả 2 kernel trên
  5/6 nội dung (chỉ lineart LỆCH cả 2). Ở 1,264/2,264, noise LỆCH trên
  8/10 cặp nội dung×thang ở CẢ 2 kernel — do **std kênh G thiếu hụt hệ
  thống ở project 640**: std ratio G 0,81–0,91 (dưới ngưỡng 0,85 ở
  gradient640/photo640/noise640), trong khi R 1,02–1,14 và B 1,00–1,08.
  BC chỉ làm G tệ thêm ~0,04–0,05 so với tam giác (vd gradient640
  noise05: tri 0,87 KHỚP vs BC 0,82 LỆCH). Có-d0 KHÔNG sửa được (làm
  Δkurt R tệ hơn: gradient640 noise05 0,26→0,57). Đây là hiệu ứng
  chroma/yuv420p ở project 640 bị phóng đại khi upscale lớn (khối chroma
  2×2 → 4–5px), cần đợt sau tách riêng — không phải bằng chứng chống BC.
- **Lineart (1px) là nội dung khó nhất, LỆCH noise ở MỌI thang, CẢ 2
  kernel.** Nguyên nhân: aliasing lưới 1px — preview downscale/upscale
  lưới khác render (plain MAD 2,6–5,9, le8 72–88%), nên delta noise thừa
  hưởng sai số aliasing (Δkurt G tới 0,98, Δcorr tới 0,31). Verdict
  noise trên lineart không phân biệt được kernel (BC tốt hơn ở 1,132,
  tệ hơn ở 1,264 — lật cả 2 hướng). Đề xuất: đừng dùng lineart 1px làm
  bằng chứng kernel; nếu cần, dùng lineart 2px+ hoặc đo trên ảnh đã
  render sẵn (bypass aliasing nguồn).

## 5. Lưới (B, C) — vùng fit vẫn giữ, không có điểm nào vượt trội rõ

Tổng KHỚP/5 theo thang (chỉ upscale; "trilinear" = production BC):

| Thang / nội dung | tri | (0,25,0,375) đã nối | (1/3,1/3) | (1/3,0,4) | (0,25,1/3) |
|---|---|---|---|---|---|
| 1,132 textsmall | 2 | 3 | **4** | **4** | **4** |
| 1,132 photo | 3 | 4 | 4 | 4 | 4 |
| 1,132 các nd còn lại | =BC | =BC | =BC | =BC | =BC |
| 1,264 textsmall640 | 2 | 2 | 2 | 2 | **3** |
| 1,264 gradient640 | 4 | 3 | 3 | 3 | 3 |
| 2,264 textsmall640 | 2 | 1 | 1 | 2 | 2 |
| 2,264 gradient640 | 4 | 3 | 3 | 3 | 3 |
| còn lại | =BC | =BC | =BC | =BC | =BC |

- Cả 3 điểm lưới đều KHÔNG thua (0,25,0,375) quá 1 verdict ở bất kỳ ô
  nào, và thắng 1 verdict ở đúng 2 ô (textsmall 1,132: sharp10 delta
  le8 99,1–99,2% vs BC 99,0% — **sát nút ngưỡng, là artefact làm tròn**,
  xem dưới). Không có điểm nào thắng nhất quán → giữ (0,25,0,375)
  của E9/F6, KHÔNG đổi (B,C).
- **Cảnh báo làm tròn:** textsmall sharp10 delta ở 1,132: BC le8 = 0,9899
  (in ra 99,0%) nhưng verdict XẤP XỈ, lưới le8 = 0,9901–0,9918 → KHỚP.
  BC chỉ dưới ngưỡng 0,99 đúng 0,0001 — đây không phải khác biệt kernel
  thật, đừng dùng để chọn (B,C). (Sharp05 của BC le8 = 0,9905 → KHỚP,
  cũng sát nút theo hướng ngược lại.)

## 6. Cổng G12 và step-4 (kiểm chứng lại trên nội dung mới)

- Cổng G12 full-pixel vs step-4 (harness): **đồng ý 22/22** về quyết định
  áp/không-áp d0 trên nội dung mới (khác E9/F6, nơi step-4 lệch w1920).
  Verdict noise step-4 vs full-pixel: đồng ý 43/44 (lệch duy nhất:
  textsmall640 noise10 ở 1,264 — step-4 LỆCH, full-pixel KHỚP).
- G12 quyết định đúng ở các case khó: gradient/photo (d0std_R 3,6–5,8 →
  KHÔNG áp d0; có-d0 sẽ LỆCH: Δkurt R 0,36–0,52), textsmall (ratioR
  0,33–0,87 → ÁP d0, verdict không đổi).
- **Mới:** ở project 640, d0std_R lớn (3,56–4,65 cho gradient/photo/
  noise640) nhưng plainMad vẫn ≤ 2,5 và ratioR có khi ≤ 1,0 (noise640
  0,64) — cổng KHÔNG áp vì d0std_R > 2,0. Có-d0 không sửa được noise
  LỆCH ở đây (xem §4) nên cổng giữ nguyên là đúng; đừng nới ngưỡng
  d0std_R chỉ vì thang 640.

## 7. Hai sự cố đo đã phát hiện và sửa TRONG luồng (bằng chứng số)

### 7a. Media noise v1 chụp sai khung — đã thay bằng v2 tĩnh, chụp lại, gộp snaps

- V1: `nullsrc + noise=alls=60:allf=t` (temporal). Frame trôi độ sáng
  theo thời gian: Y mean frame 0/30/60 = 14,47 / 24,00 / 38,49
  (preencode). File 78 MB, không faststart (moov ở cuối) → metadata/
  seek của `<video>` chậm: D3 đọc nhầm element (rawHash noise =
  da4264e1 = hash của textsmall; duration NaN → fallback els[0]) và
  preview seek racy: snapshot plain mean 12,67 (3 run) vs render
  28,53; plain2 44,61 ở run C; plain MAD 32,9, le8 0% — toàn bộ hàng
  noise/noise640 ở 3 run đầu là RÁC (đã backup `*.bak-v1.txt`, không
  dùng làm bằng chứng).
- V2: 1 khung noise tĩnh (numpy uniform [0,255], seed 79) loop 4,3 s +
  faststart; file 909 KB (cũ 78 MB) / 232 KB (cũ 19 MB). Chụp lại:
  plain mean 126,98 vs render 126,37; D3 hash riêng 77c66bef (1280) /
  e099097d (640), 4/4 pass mỗi run; D1/D2 PASS. Script
  `r79g5-merge-noisefix.mjs` gộp đúng 2 key (snaps + rawFrames) của
  noise/noise640 vào 3 file snaps gốc (backup `*.bak-v1.txt`); file fix
  đổi tên `r79g5-noisefix-snaps-*.json` để analyzer không quét trùng.
- **Bài học:** nội dung temporal không-stationary KHÔNG dùng được cho
  parity frame-cố-định — mọi nội dung đo sau này phải stationary theo
  frame (hoặc ghi rõ frame nào), và mp4 phải có faststart.

### 7b. Render frame 640 sai ma trận màu (bt709 thay vì bt601) — đã sửa, chạy lại analyzer

- Phát hiện: plain MAD gradient640 4,815 (le8 34,8%) và photo640 5,579
  ở thang 1,264/2,264 — quá lớn cho nội dung mượt. Chẩn đoán: mp4
  không ghi metadata màu; x264 (encode từ RGB) và Chrome (decode) đều
  mặc định theo độ phân giải: SD 640×360 → bt601, HD 1280×720 → bt709.
  Chuỗi render dùng bt709 cho cả 640 nên lệch màu hệ thống:
  gradient640 preview 173,1/114,8/60,6 ≈ decode bt601 172,2/113,6/59,0,
  trong khi fullrgb bt709 cho 176,1/116,1/55,9.
- Sửa: `r79g5-render-frames.mjs` fullRgb() dùng bt601 khi W ≤ 640,
  bt709 khi W = 1280 (đã kiểm chứng 1280 đúng bt709: preview
  84,4/63,8/85,1 ≈ decode bt709 83,5/62,6/85,3). Xoá 25 file
  fullrgb-*.raw của 640, tái sinh (preencode yuv giữ nguyên — chỉ bước
  yuv→rgb sai). Sau sửa: gradient640 plain MAD 4,815→1,242 (KHỚP),
  photo640 5,579→1,011 (KHỚP). Toàn bộ số thang 640 trong doc này là
  số SAU sửa (analyzer chạy lần 3).
- **Bài học:** mọi media tự sinh ở độ phân giải SD phải ghi rõ ma trận
  màu ở cả encode lẫn render-chain; lần sau encode với
  `-color_primaries bt709 -color_trc bt709 -colorspace bt709` hoặc ghi
  rõ bt601 trong render-chain ngay từ đầu.

## 8. Hồi quy sau khi nối (E9 + 67u2 chạy lại — yêu cầu của luồng)

| Kiểm chứng | Kết quả |
|---|---|
| E9 chạy lại (`R77E9_OUT=round79-g5/r79g5-e9-rerun-analysis.json node apps/web/scripts/r77e9-fullpixel-analyze.mjs`) | EXIT 0. JSON **giống hệt từng số** bản F6 (`r78f6-e9-rerun-analysis.json`) — diff chỉ khác timestamp `generated`. w2560 sharp05/sharp10 KHỚP (delta 0,588/0,603), noise KHỚP (Δkurt R 0,12/0,22); w1440/w1920 giống hệt E9 gốc |
| 67u2 (`node --test chrome-resample-67u2.test.mjs`) | **8/8 pass** |
| tsc (apps/web) | **0 lỗi** |
| vite build (apps/web) | **pass, 7,18 s** |
| `test_v14_parity.js` | Không import `chrome-resample` (như F6) → không chạy lại |

- **Không sửa production nào trong luồng này** (chỉ thêm script đo + doc).
  `chrome-resample.mjs` không đổi từ F6 (E9 rerun bit-identical là bằng
  chứng). `trilinear` trong analyzer ở thang upscale CHÍNH LÀ production
  (BC) — xem §2.

## 9. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **BC vs tam giác hoà 31 vs 32/80** — sweep này KHÔNG đủ sức kết luận
   kernel nào "đúng" tuyệt đối; nó chỉ nói BC không tệ hơn tam giác và
   tốt hơn ở sharp-delta. Muốn kết luận mạnh hơn cần: nội dung 4K,
   thang upscale dị hướng (sx≠sy — chưa đo, chưa nối), nhiều frame
   (hiện chỉ frame 30), và tách base mismatch khỏi kernel (vd đo trên
   ảnh render sẵn thay vì qua decoder).
2. **Plain MAD BC tệ hơn tam giác trên 12/16 cặp** (tệ nhất noise/lineart
   tần số cao). Nếu Chrome thật dùng tam giác cho plain và BC chỉ cho
   sharpen/noise thì mô hình hiện tại sai ở plain — nhưng không có cách
   nào tách 2 giả thuyết này bằng số hiện có (plain bị nhiễu nền chi
   phối). Nợ: probe xung hình vuông ở upscale (nợ F6 §7.3, vẫn mở) để
   đo kernel thuần không qua decoder.
3. **Noise LỆCH ở project 640 (G std 0,81–0,91)** — hiệu ứng chroma ở
   thang lớn, cả 2 kernel đều lệch. Cần đợt sau: đo d0/chroma riêng ở
   640 (vd noise trên nền trơn vs nền chi tiết), hoặc xem lại ngưỡng
   std ratio G ở thang lớn.
4. **Lineart 1px LỆCH noise ở mọi thang, cả 2 kernel** — aliasing nguồn,
   không phải kernel. Đừng dùng làm bằng chứng kernel (§4).
5. **Chỉ đo frame 30, 1 capture mỗi biến thể** (trừ D1/D2 lặp trong
   phiên). noise10 w1920 Δkurt R 0,34 sát nút (E9/F6) không nằm trong
   luồng này — vẫn theo dõi ở các đợt sau.
6. **Kernel BC bị cắt đuôi |x| ≤ 1,5** (quy ước E9, `chromeWeights1D`
   h=1) — giữ nguyên, không "sửa" h thành 2 nếu không đo lại (nhắc lại
   từ F6 §7.5).
7. **D3 (cùng-khung) vẫn có thể đọc nhầm element** khi metadata chưa tải
   (trường hợp noise v1: duration NaN → fallback els[0], D3 PASS giả).
   Fix tương lai: RAW_FN nên FAIL rõ khi không khớp duration (thay vì
   fallback els[0] im lặng), hoặc chờ `duration` finite trước khi đo.
8. **gradient640/noise640 không phải bản thu nhỏ của bản 1280** (§1) —
   so xuyên thang cho 2 nội dung này bị nhiễu.
9. **T3 dẹt 512×16 (tam giác KHỚP từng số ở thang 2,0)** vẫn chưa giải
   quyết triệt để (nợ F6 §7.3); probe xung vuông upscale vẫn mở.

## 10. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/r79g5-make-media.py` — sinh 6 nội dung mới (+ v2 noise tĩnh).
- `apps/web/scripts/r79g5-render-frames.mjs` — render frame R65 + bt601 cho 640.
- `apps/web/scripts/r79g5-fullpixel-headed.mjs` — capture headed (nguồn G5, cổng 566x/976x, display :180–:189).
- `apps/web/scripts/r79g5-fullpixel-analyze.mjs` — phân tích + phương pháp triangle-old.
- `apps/web/scripts/r79g5-merge-noisefix.mjs` — gộp snapshot noise v2.
- `docs/PHASE9_ROUND79_G5_KERNEL_BC_SWEEP_LIMITS.md` — doc này.
- Không sửa production, không thêm key i18n, không binary, không workflow `.yml`.

## 11. Log / bằng chứng

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round79-g5/`:
media (`*.mp4` + PNG gốc), render (`<content>/{preencode-*.yuv,
fullrgb-*.raw}`), `headed-w*/` (snaps JSON + report + vite/chrome log),
`r79g5-analysis.json` (phân tích lần 3, cuối cùng),
`r79g5-analyze.log` (lần 1 — số thang 640 TRƯỚC sửa bt601, chỉ dùng để
đối chiếu), `r79g5-analyze2.log` (lần 2 — có triangle-old, thang 640
trước sửa), `r79g5-analyze3.log` (lần 3 — cuối cùng),
`r79g5-e9-rerun-analysis.json` + `.log`, `r79g5-headed-*.log`,
log luồng `round79-g5.md`.

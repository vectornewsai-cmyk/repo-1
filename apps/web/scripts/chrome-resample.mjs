/**
 * chrome-resample.mjs — Phase 9 đợt 66, luồng T3: mô phỏng phép resample
 * viewport của Chrome (canvas drawImage, imageSmoothingQuality="high")
 * để đối chiếu preview headed với frame render một cách công bằng.
 *
 * Mô hình đã xác định bằng probe thực nghiệm trên Chromium 1254
 * (probe 1: impulse train + step edge; probe 2: dense sweep impulse tại
 * mọi vị trí nguồn; xem hidden_files/round66-t3/filter-probe/):
 *   - kernel TAM GIÁC K(x) = max(0, 1-|x|) (bilinear) — đã loại
 *     Mitchell / Catmull-Rom / B-spline / Lanczos2 / Lanczos3 bằng số đo
 *     (ở thang 2.0: K(0.25)=0.75, K(0.75)=0.25 đúng từng số).
 *   - vị trí lấy mẫu S_i = (i+0.5)/s_thực (KHÔNG trừ 0.5 như quy ước
 *     chuẩn) — s_thực = kích thước đích / kích thước nguồn (số nguyên
 *     sau làm tròn), KHÔNG phải thang danh nghĩa.
 *   - kéo giãn h = max(1, 1/(2s)) khi downscale (h = 1 khi s >= 0.5);
 *     tức kernel hẹp bằng NỬA thang chuẩn 1/s — Chrome giữ lại HF nhiều
 *     hơn ffmpeg bilinear/lanczos, đúng hướng lệch đã thấy ở R64 R9.
 *   - quality "high" == "medium" từng byte (probe 1: 18/18 case giống
 *     hệt); "low" = nearest đúng từng số (đối chứng phương pháp).
 *   - trọng số chuẩn hoá theo từng pixel đích, làm tròn gần nhất.
 * Độ chính xác (fit2 trên sweep 512 impulse × 6 thang):
 *   s=2.0 / 0.5 / 0.25: KHỚP TỪNG SỐ (madPeak = 0, peakI đúng 100%).
 *   s=0.6328 (w1920) / 1.3535 (w2560): madPeak <= 0.02 (504-510/512 đúng).
 *   s=0.3828 (w1440): LỆCH (madPeak 16.4, peakI đúng 87.5%) — KHÔNG mô
 *   hình kernel đơn nào trong lưới (triangle/Mitchell/Catmull/B-spline/
 *   Lanczos × h 0.6-2.6) fit được (tốt nhất bspline h=0.85: madPeak 7.0);
 *   hệ số phương sai V đo được 0.2141 vs mô hình h=1.306 cho 0.1948
 *   (lệch ~9% V, ~5% std) — ghi rõ trong LIMITS, không giấu.
 *
 * BỔ SUNG Phase 9 đợt 67, luồng U2 (docs/PHASE9_ROUND67_U2_NOISE_CHROME_FILTER_LIMITS.md;
 * probe vuông 512×512, Chromium 1254 headed, n=3 identical, 3 bộ flag GPU byte-identical):
 *   - Hình học nguồn làm đổi bộ lọc: sweep dẹt 512×16 (T3) vs vuông 512×512
 *     khác hẳn ở s<0.5 (MAD 0.29, madPeak tới 80); ở s=0.5 giống hệt. Dữ liệu
 *     T3 fit trên hình học dẹt KHÔNG đại diện viewport thật.
 *   - Mô hình 2 CHẶNG (halve 512→256 triangle h=1, rồi scale 256→dw triangle
 *     h=1): fullRowMAD trên sweep vuông 0.058 (tốt hơn 1-kernel 0.265, 4.6×),
 *     per-scale: s=0.35→0.010, s=0.3819→0.048, s=0.5→0.004; M=256 là optimum
 *     sắc (M khác >= 0.227); float-mid ≈ uint8-mid; h2>1 tệ hơn.
 *   - Dư còn lại: peak lệch ±16 theo pha (đan dấu, chu kỳ ~2 pha) ở s=0.3819;
 *     V_1D mô hình phẳng ~0.333 trong khi đo tăng 0.277→0.496 theo s
 *     (ở s=0.45 mô hình thiếu 30% V_2D; ở s=0.30 thừa 42%). → 2-stage là tốt
 *     nhất hiện có nhưng CHƯA phải đáp án cuối.
 *   - Quy luật theo thang (verdict nhiễu headed vs render resample):
 *     s≈0.38 (w1440): 2-stage KHỚP noise10 (std [1.01,0.98,1.04],
 *     Δkurt [0.24,0.19,0.33], Δcorr [0.118,0.002,0.03]), noise05 chỉ lệch
 *     Δcorr R-G 0.199; 1-kernel lệch cả 2 mức.
 *     s≈0.63 (w1920) / s≈1.35 (w2560): 1-kernel KHỚP (như T3), 2-stage LỆCH
 *     nặng (std G 1.53 / 1.72). → Đợt 71 Y7 ĐÃ ĐO LẠI dưới mô hình trilinear:
 *     "halve" = bật mip-1 tại s* = 0,7071 = 2^−0,5, bias LOD −0,500 ± 0,001
 *     (sweep 15 thang s=0,45–0,80, Chrome 158 headed; trong 0,45–0,63 KHÔNG
 *     có ngưỡng — 0,5 của V3 chỉ là hệ quả λ*=0,5 dưới mô hình 2-stage cũ).
 *     Xem docs/PHASE9_ROUND71_Y7_HALVE_THRESHOLD_LIMITS.md.
 *
 * BỔ SUNG Phase 9 đợt 68, luồng V3 (docs/PHASE9_ROUND68_V3_CHROME_THRESHOLD_LIMITS.md;
 * probe vuông 512×512, Chrome 158 headed, thang 0.45/0.48/0.5/0.55/0.6/0.63):
 *   - Ngưỡng halve ĐÃ PIN: 2-stage thắng ở s≤0,48 (MAD 0,184 vs 0,216 ở
 *     0,48; ×1,6 ở 0,45; ×5,6 ở 0,3819), 1-kernel thắng ở s≥0,55 (×1,8 ở
 *     0,55; ×3,2 ở 0,6; ×5,1 ở 0,63); tại s=0,5 hai mô hình trùng nhau
 *     đúng từng số (MAD 0,004 cả hai). → crossover trong (0,48, 0,55],
 *     phù hợp 0,5: ngưỡng 0,5 trong chromeResampleRgb24 là ĐÚNG (không
 *     còn là xấp xỉ), không đổi hành vi.
 *   - Chrome 158 byte-identical với Chromium 1254 ở s=0,3819 (sweep MAD
 *     0,0000, 0/50176 điểm khác) — hành vi bộ lọc không đổi theo phiên bản.
 *   - Dư ±16 theo pha của 2-stage KHÔNG giải được: lệch pha hằng số
 *     (δ1/δ2), 3 chặng (MAD 0,448 — tệ 3,8×), skew, h<1, h2(s2) đều thua
 *     BASE (pooled MAD 0,119); h2=0,95 hơi tốt hơn trên impulse (0,116)
 *     nhưng làm verdict nhiễu w1440 tệ đi (noise10 KHỚP→LỆCH, 1/2→0/2)
 *     nên bị loại. V_1D mô hình phẳng 0,333 vs đo tăng 0,277→0,413 vẫn mở.
 *   - w1440 noise05 Δcorr R-G 0,199 KHÔNG phải lỗi bộ lọc: Chrome THẬT
 *     drawImage trên cùng frame nhiễu render cho corr R-G −0,147, trùng
 *     mô hình 2-stage (−0,148) tới 0,001, đều nhau theo mọi lớp pha; trần
 *     verdict với đích Chrome-thật vẫn LỆCH (Δcorr 0,200). Phần dư nằm ở
 *     khác biệt cấu trúc nhiễu giữa 2 đường (render ffmpeg noise trên
 *     YUV420p native vs preview addYuvNoise trên base RGB-derived) —
 *     xem LIMITS đợt 68 V3 §3, §5.
 *   - Vì vậy: resampleRgb24 (1-kernel) GIỮ NGUYÊN mặc định; thêm
 *     resampleRgb24TwoStage + chromeResampleRgb24 (tự chọn theo thang:
 *     s<0.5 → 2-stage, s>=0.5 → 1-kernel) để harness dùng khi cần.
 *
 * BỔ SUNG Phase 9 đợt 70, luồng X1 (docs/PHASE9_ROUND70_X1_CHROME_TRILINEAR_LIMITS.md;
 * áp dụng đáp án W5 đợt 69 — docs/PHASE9_ROUND69_W5_CHROME_PHASE_LIMITS.md):
 *   - Chrome drawImage "high" KHÔNG phải 2-stage mà là TRILINEAR MIPMAP
 *     với LOD bias −0,5: λ=log2(1/s), λ*=max(0,λ−0,5), L=floor(λ*),
 *     f=frac(λ*), out=(1−f)·bilinear(mip L) + f·bilinear(mip L+1); mỗi
 *     mip = halve (0,5, 0,5) lặp lại, bilinear = triangle h=1, halve làm
 *     tròn NỬA-XUỐNG (127,5 → 127). Trên 18 thang đo (s=0,26–0,63):
 *     pooled MAD 0,002 (2-stage: 0,100–0,119), madPeak 0,21 (BASE:
 *     11,71–20,78), V_1D lệch ≤0,008 mọi thang.
 *   - chromeResampleRgb24 GIỜ DÙNG TRILINEAR cho mọi thang (không còn
 *     chuyển mô hình ở 0,5): ngưỡng 0,5 chỉ là hệ quả (tại s=0,5 thì
 *     λ*=0,5, hai thành phần blend trùng nhau) — chú thích "đã đo, pin"
 *     của V3 giữ nguyên ý nghĩa, đổi nội dung cho đúng cơ chế.
 *   - resampleRgb24TwoStage / resamplePlaneTwoStage GIỮ LẠI (không xoá)
 *     làm mốc đối chứng + phục vụ test so sánh; không còn là mô hình
 *     mặc định của chromeResampleRgb24.
 *
 * BỔ SUNG Phase 9 đợt 75, luồng C2 (docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md;
 * đóng nợ đợt 74 §4.2 — model dị hướng riêng):
 *   - `resamplePlaneTrilinear` ĐÃ ĐỔI quy tắc LOD: thang dùng để tính
 *     (L, f) giờ là TRUNG BÌNH NHÂN s = √(sx·sy) (thang bảo toàn diện
 *     tích), thay cho thang nhỏ nhất min(sx, sy) của A1. Khi sx = sy thì
 *     s_geo = s nên hành vi đẳng hướng KHÔNG ĐỔI (bit-identical, kiểm
 *     chứng full-plane 230×230 + 384×384: 0 ô khác; mọi test iso xanh
 *     đúng từng số). Khi sx ≠ sy, M4 khớp headed maxAbs = 1 (mức làm
 *     tròn uint8) trên toàn bộ lưới pha mịn dẹt (1.536 điểm × 6 cặp,
 *     259.584 ô, RMSE 0,046–0,077, 0 ô ≥ 4), trong khi bản min-scale
 *     lệch maxAbs 41–60 (RMSE 1,33–3,76) và bản per-axis 4-mip (M1)
 *     lệch maxAbs 39–51. M4 cũng khớp sweep DẸT độc lập của U2
 *     (512×16, sy=1: maxAbs = 1 mọi thang 0,30–0,50, RMSE 0,021–0,063;
 *     bản min-scale lệch maxAbs 89–109) — giải luôn mâu thuẫn vuông-vs-dẹt
 *     còn mở từ đợt 67. Các rule khác đã loại bằng số: LOD từng trục
 *     (M1), thang lớn nhất (M3), triangle/Gauss tách trục với (hx,hy)
 *     tự do từng cặp (tốt nhất RMSE 0,85–1,32, maxAbs 10–32), 2-stage
 *     halve-box ⊛ triangle (RMSE 4,31).
 *   - Hệ quả cho test 1D cũ: mặt phẳng 512×1 (sy=1) giờ có s_geo=√sx
 *     nên KHÔNG còn là mô hình đúng cho sweep vạch dọc trên canvas
 *     vuông — các test 1D trong chrome-resample-67u2.test.mjs đã đổi
 *     sang hình học thật của fixture (vạch dọc trên canvas 512×512),
 *     giữ nguyên mọi giá trị đo đã pin.
 *   - Module tham chiếu Z7 (r72z7-trilinear-2dblend.mjs) đổi cùng quy
 *     tắc để production vẫn bit-identical với nó.
 *   - `bilinearPlane2D` giờ tính FLOAT (bỏ `roundHalfDown` giữa các pass,
 *     chỉ làm tròn một lần ở blend cuối / nhánh f=0): dư ±1 còn lại của
 *     M4 (RMSE 0,045–0,077) hóa ra chỉ là làm tròn trung gian — bản cuối
 *     khớp headed EXACT (RMSE = 0, maxAbs = 0, 346.112 ô). Halve vẫn
 *     `roundHalfDown` (mức mip là uint8 — đã đo).
 *
 * BỔ SUNG Phase 9 đợt 73, luồng A1 (docs/PHASE9_ROUND73_A1_RESAMPLE_BLEND_LIMITS.md;
 * đóng nợ đợt 72 §4 mục 1 — Z7 đã chứng minh kernel 2D thật):
 *   - `resamplePlaneTrilinear` ĐÃ SỬA sang blend-at-end: bilinear-sample 2D
 *     từng mức mip trước (bilinearPlane2D), rồi mới trộn 2 kết quả 2D với
 *     hệ số f (bias LOD −0,5, KHÔNG đổi — fit Δf ≈ 0). Bản cũ trộn 2 mức
 *     mip ngay trong từng pass 1D (X rồi Y) nên sinh 2 hạng chéo
 *     f(1−f)·[T_L(u)T_{L+1}(v) + T_{L+1}(u)T_L(v)] không tồn tại trong
 *     pipeline thật của Chrome/Skia — lệch maxAbs tới 19, RMSE 0,47–0,65
 *     trên lưới pha mịn headed. Bản mới khớp headed maxAbs = 1 (mức làm
 *     tròn uint8) trên toàn bộ 1.536 điểm lưới pha mịn + 50 ô Y8.
 *   - (L, f) lấy theo thang nhỏ nhất (λ* = max(λx*, λy*) — quy ước LOD
 *     chuẩn theo trục co nhất); trường hợp sx = sy (đã đo) trùng hệt
 *     bản cũ theo từng trục. Thang khác nhau 2 trục CHƯA đo (nợ Z7 §9.2).
 *     [ĐỢT 75 C2: nợ này ĐÃ ĐÓNG — quy tắc min-scale SAI ở dẹt
 *     (maxAbs 41–60); LOD giờ lấy theo trung bình nhân, xem ghi chú C2
 *     ở trên và docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md.]
 *   - `trilinearRow1D` GIỮ NGUYÊN (mô hình 1D đúng — hạng chéo vô hình
 *     trên 1D; các test 1D cũ vẫn xanh đúng từng số).
 *   - `resampleRgb24Trilinear` / `chromeResampleRgb24` không đổi chữ ký,
 *     tự hưởng sửa qua resamplePlaneTrilinear.
 *   - Module tham chiếu Z7 (r72z7-trilinear-2dblend.mjs) giữ lại làm
 *     cross-check độc lập; production mới bit-identical với nó (kiểm
 *     chứng trong hidden_files/round73-a1/).
 *
 * BỔ SUNG Phase 9 đợt 78, luồng F6 (docs/PHASE9_ROUND78_F6_KERNEL_BC_LIMITS.md;
 * đóng nợ đợt 77 §4.6 — kernel upscale BC(0,25, 0,375) của E9):
 *   - Kiểm chứng trên 3 nội dung mới (ocean/basgo/slovenska, tự nhiên,
 *     1280×720) ở cùng thang upscale 1,132 của E9 + 2 thang mới 1,264 /
 *     2,264 (project 640×360): BC thắng tam giác trên MỌI chỉ số effect
 *     ở thang 1,132 (4/4 nội dung: sharpen-delta 8/8 KHỚP so với 5/8 của
 *     tam giác — sửa đúng 2 lỗi XẤP XỈ của ocean + sharp10 test-pattern;
 *     noise Δkurt R tốt hơn hoặc bằng mọi case), và nhỉnh hơn ở cả 2
 *     thang 640-project (nhưng 2 thang này NHIỄM: preview downscale nội
 *     bộ 1280→640 bằng drawImage trilinear trong khi render dùng ffmpeg
 *     bicubic — 2 bộ downscale lệch nhau MAD 1,96 trên ocean — nên
 *     không đủ sức phân biệt kernel; xem LIMITS F6 §5).
 *   - plain MAD: tam giác nhỉnh hơn BC một chút ở cả 4 nội dung
 *     (+0,02–0,15) — do nhiễu nền (decoder/render) bị tam giác làm mịn
 *     nhiều hơn; chỉ ocean vượt ngưỡng KHỚP dưới BC (2,086 so với 2,0,
 *     le8 99,3%). Lưới (B,C) quanh E9 vẫn KHỚP trên ocean (3/3 điểm
 *     lưới) — đây là một vùng, không phải điểm fit may mắn.
 *   - Quyết định (đợt 78): NỐI BC(0,25, 0,375) làm NHÁNH UPSCALE của
 *     resamplePlaneTrilinear — chỉ khi sx > 1 VÀ sy > 1 (upscale thuần
 *     cả 2 trục; thang dị hướng hỗn hợp giữ tam giác vì chưa đo).
 *     [ĐÃ THAY BẰNG MITCHELL Ở ĐỢT 83 K2 — xem khối K2 dưới đây.]
 *     Mọi thang downscale (s ≤ 1) KHÔNG ĐỔI hành vi (bit-identical —
 *     kiểm chứng lại bằng E9/F6 analysis + test 67u2). Lưu ý: probe dẹt
 *     T3 nói tam giác KHỚP TỪNG SỐ ở thang 2,0 — trên hình học dẹt
 *     512×16 mà U2 đã chứng minh không đại diện viewport thật; thang
 *     ~2 trên nội dung 2D thật vẫn CHƯA có số đo sạch (nhiễm downscale
 *     ở project 640) — nợ cho đợt sau: probe xung hình vuông ở upscale.
 *
 * BỔ SUNG Phase 9 đợt 83, luồng K2 (docs/PHASE9_ROUND83_K2_KERNEL_MITCHELL_AB_LIMITS.md;
 * đóng nợ đợt 82 §4.2 — quyết định Mitchell vs BC bằng A/B có kiểm soát):
 *   - J2 (đợt 82) probe headed chứng minh kernel upscale drawImage thật
 *     của Chrome là Mitchell (1/3, 1/3), MAD 0,000–0,003. A/B đợt này
 *     chạy lại cùng capture với cả 3 kernel (tri / BC / Mitchell):
 *     toán tử trực tiếp (probe J2): Mitchell thắng 27/27 hàng + 3/3
 *     checker 2D, tổng MAD 0,008 so với BC 6,117; sweep impulse
 *     exact 99,4–99,6% (BC 6,1% / 0,2%); step overshoot Mitchell khớp
 *     đúng từng số (BC cũng khớp — bước đơn không phân biệt được).
 *   - Đường sharp (H3 run D + A2, delta MAD): Mitchell thắng BC 15/18
 *     case (BC thắng 1: sqw32-640 d05, chênh 0,009 = nhiễu), tổng delta
 *     28,798 so với BC 29,181; nội dung tự nhiên sạch (F6 w2560-p1280):
 *     delta 3–1–2, tổng 4,808 so với 4,829 — Mitchell bù được lệch
 *     sharp, không chỉ khớp toán tử trực tiếp. 7 verdict lật, TẤT CẢ
 *     theo hướng tốt hơn (vd abs05 sqw4-640: BC LỆCH → Mitchell KHỚP);
 *     0 verdict lật tệ hơn. Hybrid (BC cho sharp + Mitchell cho plain)
 *     TỆ HƠN Mitchell-mọi-chỗ (−1,2% tổng delta) nên bị bác — và Chrome
 *     chỉ dùng MỘT kernel cho mọi frame nên hybrid cũng không có cơ chế
 *     vật lý.
 *   - QUYẾT ĐỊNH: CHROME_UPSCALE_BC (0,25, 0,375) → (1/3, 1/3)
 *     (Mitchell). Chỉ đổi hằng số nhánh upscale; downscale/dị hướng
 *     giữ tam giác như cũ. Phần dư delta sqw4 (~2,5–2,8 MAD) KHÔNG do
 *     kernel nữa — vẫn mở (base-mismatch I3 E8).
 *   - `resamplePlane` / `resampleRgb24` (1-kernel tam giác cũ) và
 *     `trilinearRow1D` KHÔNG đổi — chỉ `resamplePlaneTrilinear` (qua
 *     `bilinearPlane2D` với kernel cắm được) đổi ở nhánh upscale.
 *
 * BỔ SUNG Phase 9 đợt 86, luồng N7 (docs/PHASE9_ROUND86_N7_VIDEO_OPERATOR_LIMITS.md;
 * toán tử drawImage(VIDEO) — KHÁC đường canvas/image ở trên):
 *   - Kernel TAM GIÁC (bilinear), KHÔNG phải Mitchell: canvas-high ≡ Mitchell
 *     (MAD 0–0,008) nhưng video-high ≡ video-low ≡ tam giác, đúng từng số
 *     trên 86/87 case (xem dưới). Đường video dùng bộ lấy mẫu texture
 *     (bilinear) chứ không phải image shader Skia — high=low giống hệt.
 *   - Vị trí lấy mẫu lượng tử hoá về lưới 1/16 px: S_q = floor(16S)/16 với
 *     S = (i+0,5−offDst)/fround(s) — s là thang thực dst/src, fround là
 *     float32 (tỉ lệ lưu trong ma trận): fround(809/640) làm tròn LÊN nên
 *     tại tie S=320,0 đúng (i=404, s=809/640) Chrome cho S_q=319,9375
 *     (đo 111, không phải 127); fround(1449/640) làm tròn XUỐNG nên tại
 *     cùng S=320,0 (i=724, s=1449/640) Chrome cho S_q=320,0 (đo 127).
 *     Tương đương round về 1/16 với φ=−1/32 (round(y−0,5)=floor(y)).
 *   - float→uint8 CẮT NGỌN (trunc), không làm tròn: 111,56 → 111 (đo tại
 *     i=479, stepV255 s=1,5: đo 31, round cho 32, trunc cho 31).
 *   - CTM: cùng quy tắc, offDst là tịnh tiến theo trục đang xét (dst px);
 *     offX=0,5 không ảnh hưởng profile trục còn lại (6/6 MAD 0).
 *   - Downscale: cùng tam giác + 1/16 (KHÔNG trilinear/mipmap — giá trị
 *     sắc, khớp từng số 7/8 case); thang float64 cho 8/8, thang float32
 *     cho 7/8 — phần dư duy nhất (xem dưới).
 *   - Decode: B-1to1 = nguồn byte-identical (MAD 0) với clip xám; YUV→RGB
 *     = bt601 limited-range (khớp ffmpeg, bt709 bị loại); chroma upsample
 *     ≡ ffmpeg/swscale mặc định; scale diễn ra trong RGB sau convert
 *     (model YUV-space lệch 0,70–7,66); composite = source-over 8-bit Skia
 *     floor((128v+127bg+127)/255), alpha ra luôn 255.
 * Độ chính xác (verify3, r86n7-verify3.json): 86/87 case MAD đúng 0
 * (73 upscale + 6 CTM + 7/8 downscale; thang 1,0–3,0 + thang editor
 * 1,2638889/2,2639 + downscale 0,6/0,75; bậc 0→255, sóng vuông 64/192,
 * vạch 1px; Chromium 1254 headed, SwiftShader/CPU).
 * Phần dư: sqw4-mid s=0,6 — 16 pixel tại S=k+0,5 đúng (i=19,31,43,...):
 * mô hình cho 72/184, Chrome đo 64/192 (MAD 0,65 trên case đó) — ở đó
 * Chrome hành xử như thang float64 (S đúng 32,5) chứ không phải float32
 * (32,4999987). 15 biến thể số học đã thử, không biến thể nào được 87/87
 * (tốt nhất V1 86/87; V4 float64 được 85/87 — hỏng 2 tie s=809/640).
 * Liệt kê 296 pixel S-nguyên phân biệt được: 294 cho floor, chỉ 2 (cùng
 * s=809/640, S=320) cho S−1/16 — tie-break KHÔNG phải quy tắc chung.
 * Hành vi biên ảnh (S_q ngoài [0, srcLen)) CHƯA đo (probe chỉ đo nội bộ);
 * videoOperatorWeights1D bỏ tap ngoài biên, không chuẩn hoá lại.
 * Hàm xuất: resamplePlane / resampleRgb24 / resampleYuv420p (resample
 * theo plane YUV420p như ffmpeg scale: Y full-res, U/V nửa res rồi mới
 * convert RGB — khớp chuỗi render thật) + yuv420pToRgb24 (bt709 limited)
 * + resamplePlaneTwoStage / resampleRgb24TwoStage (mô hình 2 chặng cũ,
 * giữ làm mốc đối chứng, đợt 67 U2) + resamplePlaneTrilinear /
 * resampleRgb24Trilinear / trilinearRow1D / roundHalfDown (mô hình
 * trilinear LOD-bias −0,5, đợt 70 X1) + bcCubicKernel /
 * CHROME_UPSCALE_BC (kernel BC-cubic nhánh upscale, đợt 78 F6) +
 * chromeResampleRgb24 (mặc định trilinear cho mọi thang) +
 * videoOperatorWeights1D / videoOperatorSample1D (toán tử drawImage
 * VIDEO: tam giác + vị trí 1/16 + trunc, đợt 86 N7 — KHÁC đường canvas).
 * KHÔNG push/tag/binary. Chỉ dùng cho harness đo, không sửa code sản phẩm.
 */

/** Kernel tam giác (bilinear). */
export function triangleKernel(x) {
  const a = Math.abs(x);
  return a < 1 ? 1 - a : 0;
}

/**
 * Kernel BC-cubic (Keys 1981) với tham số (B, C) — dùng cho nhánh upscale
 * (đợt 78 F6): Chrome drawImage smoothing "high" ở upscale dùng cubic
 * chứ không phải tam giác (E9 fit trên test-pattern; F6 kiểm chứng trên
 * ocean/basgo/slovenska). Công thức chuẩn, support |x| < 2.
 */
export function bcCubicKernel(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}

/** (B, C) đã fit cho kernel upscale của Chrome — Mitchell (1/3, 1/3), đợt 83 K2 (A/B thắng BC; trước đó BC(0,25, 0,375) từ E9 + F6). */
export const CHROME_UPSCALE_BC = { B: 1 / 3, C: 1 / 3 };
/** Kernel upscale của Chrome: Mitchell (1/3, 1/3) (hàm 1 đối số, cắm được vào chromeWeights1D). */
export function chromeUpscaleKernel(x) {
  return bcCubicKernel(x, CHROME_UPSCALE_BC.B, CHROME_UPSCALE_BC.C);
}

/** Thang kéo giãn của Chrome theo thang thực s (đo được). */
export function chromeStretch(s) {
  return Math.max(1, 1 / (2 * s));
}

/**
 * Tính trọng số 1D cho 1 pixel đích: trả mảng [j, w] đã chuẩn hoá (tổng 1).
 * S = (i+0.5)/s (quy ước Chrome, không trừ 0.5); h = chromeStretch(s).
 * hOverride: ép h cố định (dùng cho chặng 2 của mô hình 2-stage, h=1).
 */
export function chromeWeights1D(i, s, srcLen, kernel = triangleKernel, hOverride = undefined) {
  const h = hOverride === undefined ? chromeStretch(s) : hOverride;
  const S = (i + 0.5) / s;
  // Kernel tam giác có support radius h (sau kéo giãn) tính theo toạ độ nguồn.
  const j0 = Math.max(0, Math.floor(S - h - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + h - 0.5));
  const ws = [];
  let wsum = 0;
  for (let j = j0; j <= j1; j++) {
    const w = kernel((j + 0.5 - S) / h);
    if (w === 0) continue;
    ws.push([j, w]);
    wsum += w;
  }
  if (wsum === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
  return ws.map(([j, w]) => [j, w / wsum]);
}

/**
 * Trọng số 1D của TOÁN TỬ VIDEO — drawImage(video), đợt 86 N7 (KHÁC
 * chromeWeights1D của đường canvas/image: tam giác + S_q = floor(16S)/16,
 * S = (i+0,5−offDst)/fround(s), KHÔNG kéo giãn h, KHÔNG chuẩn hoá lại).
 * s: thang thực dst/src (số thực, vd 809/640); offDst: tịnh tiến CTM theo
 * trục đang xét (dst px, mặc định 0; offX=0,5 không ảnh hưởng trục kia).
 * Trả mảng [j, w] (tối đa 2 tap tam giác); tap ngoài [0, srcLen) bị bỏ,
 * không chuẩn hoá lại — khớp mô hình đã fit (biên ảnh chưa đo).
 * Ví dụ đã pin (test r86n7-video-operator.test.mjs): s=809/640, i=404 →
 * [[319, 0.5625], [320, 0.4375]] (mô hình thang float64 cho 0.5/0.5 — SAI).
 */
export function videoOperatorWeights1D(i, s, srcLen, offDst = 0) {
  const S = (i + 0.5 - offDst) / Math.fround(s);
  const Sq = Math.floor(S * 16) / 16;
  const j0 = Math.floor(Sq - 0.5);
  const ws = [];
  for (const j of [j0, j0 + 1]) {
    if (j < 0 || j >= srcLen) continue;
    const w = triangleKernel(j + 0.5 - Sq);
    if (w === 0) continue;
    ws.push([j, w]);
  }
  return ws;
}

/**
 * Lấy mẫu 1 pixel theo toán tử video (đợt 86 N7): Σ w·src rồi CẮT NGỌN
 * (Math.floor) về uint8 — Chrome CẮT NGỌN, không làm tròn (111,56 → 111).
 * src: mảng số dài srcLen. Trả số nguyên 0–255.
 */
export function videoOperatorSample1D(src, i, s, offDst = 0) {
  let acc = 0;
  for (const [j, w] of videoOperatorWeights1D(i, s, src.length, offDst)) acc += w * src[j];
  const v = Math.floor(acc);
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Resample 1 plane (Float64Array/Uint8Array srcW×srcH) về dstW×dstH.
 * scaleX/scaleY: thang thực theo từng trục (dst/src). Trả Float64Array.
 * stretch: nếu đặt (số), ép h cho cả 2 pass (dùng cho mô hình 2-stage).
 */
export function resamplePlane(src, srcW, srcH, dstW, dstH, scaleX, scaleY, stretch = undefined) {
  // Pass ngang: srcW×srcH -> dstW×srcH.
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, scaleX, srcW, triangleKernel, stretch);
  for (let y = 0; y < srcH; y++) {
    const sRow = y * srcW;
    const tRow = y * dstW;
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of wCacheX[i]) acc += w * src[sRow + j];
      tmp[tRow + i] = acc;
    }
  }
  // Pass dọc: dstW×srcH -> dstW×dstH.
  const out = new Float64Array(dstW * dstH);
  const wCacheY = new Array(dstH);
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, scaleY, srcH, triangleKernel, stretch);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}

/**
 * Mô hình 2 CHẶNG (đợt 67 U2): halve src→(src/2) bằng triangle h=1, rồi
 * scale (src/2)→dst bằng triangle h=1 (ép stretch=1 cả 2 chặng). Chỉ dùng
 * khi s < 0.5 (đã đo: tốt nhất ở 0.30–0.45; ở s>=0.5 dùng 1-kernel).
 * Trả Float64Array dstW×dstH.
 * LƯU Ý đợt 70 X1: mô hình này đã bị THAY THẾ bởi trilinear LOD-bias
 * −0,5 (đợt 69 W5: pooled MAD 0,002 vs 2-stage 0,100–0,119); giữ lại
 * làm mốc đối chứng + phục vụ test so sánh, không còn là mô hình mặc
 * định của chromeResampleRgb24.
 */
export function resamplePlaneTwoStage(src, srcW, srcH, dstW, dstH) {
  const midW = Math.max(1, srcW >> 1);
  const midH = Math.max(1, srcH >> 1);
  const mid = resamplePlane(src, srcW, srcH, midW, midH, midW / srcW, midH / srcH, 1);
  // Chặng giữa là canvas uint8 thật → làm tròn trước chặng 2 (đo được:
  // tại xung p=272, s=0.3828, làm tròn khớp đúng từng số, float-mid lệch 1).
  for (let i = 0; i < mid.length; i++) mid[i] = Math.round(mid[i]);
  return resamplePlane(mid, midW, midH, dstW, dstH, dstW / midW, dstH / midH, 1);
}

/**
 * Resample 1 frame RGB24 bằng mô hình 2 chặng (xem resamplePlaneTwoStage).
 * Trả Buffer RGB24 dstW×dstH.
 */
export function resampleRgb24TwoStage(rgb, srcW, srcH, dstW, dstH) {
  const n = srcW * srcH;
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlaneTwoStage(plane, srcW, srcH, dstW, dstH);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}

/**
 * Làm tròn nửa-xuống: 127.5 -> 127 (khớp halve đo riêng của Chrome,
 * đợt 69 W5 §3: impulse chặng 1 chỉ 1 tap 127 mọi pha; làm tròn thường
 * Math.round cho 128 ở cùng vị trí). Dùng cho mọi bước halve và bước
 * bilinear trong mô hình trilinear; bước blend cuối dùng Math.round.
 */
export function roundHalfDown(x) {
  const f = Math.floor(x);
  return x - f === 0.5 ? f : Math.round(x);
}

/**
 * Resample 1 hàng 1D bằng trilinear mipmap LOD-bias −0,5 (đợt 69 W5 §1,
 * áp vào production đợt 70 X1):
 *   λ = log2(srcLen/dstLen); λ* = max(0, λ − 0,5); L = floor(λ*);
 *   f = λ* − L;
 *   out = (1−f)·bilinear(mip L → dst) + f·bilinear(mip L+1 → dst),
 * mỗi mip = halve (0,5, 0,5) lặp lại (triangle h=1, thang 0,5), bilinear
 * = triangle h=1; halve và bilinear làm tròn nửa-xuống từng pixel, blend
 * cuối làm tròn thường. Trả mảng số nguyên dài dstLen.
 * Đặc biệt: s ≥ 2^(−0,5) ≈ 0,7071 → λ* = 0 → thuần triangle h=1
 * (trùng 1-kernel); tại s = 0,5 thì λ* = 0,5, hai thành phần blend trùng
 * nhau nên bằng đúng halve một lần (khớp đo V3: hai mô hình trùng nhau).
 */
export function trilinearRow1D(src, dstLen) {
  const srcLen = src.length;
  const lam = Math.log2(srcLen / dstLen);
  const lamStar = Math.max(0, lam - 0.5);
  const L = Math.floor(lamStar);
  const f = lamStar - L;
  const halve = (row) => {
    const dw = Math.round(row.length / 2);
    const out = new Array(dw);
    for (let i = 0; i < dw; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, 0.5, row.length, triangleKernel, 1)) acc += w * row[j];
      out[i] = roundHalfDown(acc);
    }
    return out;
  };
  const bilinear = (row) => {
    const s = dstLen / row.length;
    const out = new Array(dstLen);
    for (let i = 0; i < dstLen; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, s, row.length, triangleKernel, 1)) acc += w * row[j];
      out[i] = roundHalfDown(acc);
    }
    return out;
  };
  let lvlL = Array.from(src);
  for (let k = 0; k < L; k++) lvlL = halve(lvlL);
  const a = bilinear(lvlL);
  if (f === 0) return a;
  let lvlL1 = Array.from(src);
  for (let k = 0; k < L + 1; k++) lvlL1 = halve(lvlL1);
  const b = bilinear(lvlL1);
  return a.map((v, i) => Math.round((1 - f) * v + f * b[i]));
}

/**
 * Halve 2D nội bộ (đợt 73 A1): box 2×2 qua 2 pass 1D triangle h=1,
 * roundHalfDown từng pixel — cùng cách halve của module tham chiếu Z7
 * (r72z7-trilinear-2dblend.mjs). Trả { img: Float64Array, w, h }.
 */
function halvePlane2D(src, srcW, srcH) {
  const mw = Math.max(1, Math.round(srcW / 2));
  const tmp = new Float64Array(mw * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < mw; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, 0.5, srcW, triangleKernel, 1)) acc += w * src[y * srcW + j];
      tmp[y * mw + i] = roundHalfDown(acc);
    }
  }
  const mh = Math.max(1, Math.round(srcH / 2));
  const out = new Float64Array(mw * mh);
  for (let x = 0; x < mw; x++) {
    for (let i = 0; i < mh; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, 0.5, srcH, triangleKernel, 1)) acc += w * tmp[j * mw + x];
      out[i * mw + x] = roundHalfDown(acc);
    }
  }
  return { img: out, w: mw, h: mh };
}

/**
 * Bilinear 2D nội bộ (đợt 73 A1): triangle h=1, pass X rồi Y.
 * ĐỢT 75 C2: KHÔNG làm tròn giữa các pass nữa — bilinear tính FLOAT
 * hoàn toàn, chỉ làm tròn một lần ở blend cuối (trong
 * resamplePlaneTrilinear) hoặc ở nơi nhận kết quả. Lý do đo được:
 * bilinear float + làm tròn cuối cho RMSE = 0 / maxAbs = 0 trên toàn bộ
 * lưới pha mịn (dẹt 6 cặp + iso 2 cặp, mẫu 64 điểm/cặp), trong khi
 * roundHalfDown từng pass để lại dư ±1 ở ~0,4% ô (RMSE 0,045–0,077).
 * Halve VẪN roundHalfDown (mức mip là uint8 — đã đo: impulse mip1 127).
 * ĐỢT 78 F6: thêm tham số kernel (mặc định tam giác) — nhánh upscale
 * dùng Mitchell (1/3, 1/3) qua chromeUpscaleKernel (đợt 83 K2 đổi từ
 * BC(0,25, 0,375) sau A/B; các pass khác giữ tam giác.
 * Trả Float64Array dstW×dstH (chưa làm tròn).
 */
function bilinearPlane2D(src, srcW, srcH, dstW, dstH, kernel = triangleKernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sx, srcW, kernel, 1)) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sy, srcH, kernel, 1)) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}

/**
 * Resample 1 plane (Float64Array/Uint8Array srcW×srcH) về dstW×dstH
 * bằng trilinear mipmap LOD-bias −0,5, BLEND-AT-END (đợt 73 A1, sửa từ
 * bản blend-từng-pass của đợt 70 X1 — xem docs/PHASE9_ROUND72_Z7_2D_KERNEL_LIMITS.md),
 * với LOD theo TRUNG BÌNH NHÂN (đợt 75 C2 — xem docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md):
 *   λ = log2(1/s), λ* = max(0, λ − 0,5), L = floor(λ*), f = λ* − L,
 *   với s = √(sx·sy), sx = dstW/srcW, sy = dstH/srcH (thang bảo toàn
 *   diện tích — khớp headed EXACT (RMSE = 0, maxAbs = 0) cả đẳng hướng
 *   lẫn dị hướng; quy tắc cũ s = min(sx, sy) của A1 chỉ đúng khi
 *   sx = sy và SAI LỚN ở dẹt: maxAbs 41–60 trên lưới pha mịn B2);
 *   out = (1−f)·bilinear2D(mip L) + f·bilinear2D(mip L+1), blend cuối
 *   làm tròn thường. Mỗi mức mip được bilinear-sample 2D TRƯỚC, rồi mới
 *   trộn 2 kết quả 2D — đúng cách Skia lấy mẫu trilinear; bản cũ trộn
 *   trong từng pass 1D nên sinh 2 hạng chéo f(1−f) không tồn tại trong
 *   pipeline thật (lệch maxAbs tới 19 trên lưới pha mịn headed).
 * Hệ số blend f KHÔNG đổi (fit Δf ≈ 0). Trả Float64Array dstW×dstH
 * (giá trị đã nguyên sau blend cuối). Chữ ký không đổi.
 */
export function resamplePlaneTrilinear(src, srcW, srcH, dstW, dstH) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const lam = Math.log2(1 / Math.sqrt(sx * sy));
  const lamStar = Math.max(0, lam - 0.5);
  const L = Math.floor(lamStar);
  const f = lamStar - L;
  // Đợt 78 F6: nhánh UPSCALE — khi upscale thuần cả 2 trục (sx > 1 và
  // sy > 1) thì pass bilinear dùng kernel Mitchell (1/3, 1/3) thay cho tam
  // giác (ở upscale, L = 0, f = 0 nên đây là pass duy nhất). Đợt 83 K2
  // đổi từ BC(0,25, 0,375) sang Mitchell sau A/B (xem header). Mọi thang
  // downscale hoặc dị hướng hỗn hợp giữ tam giác (chưa đo). Cùng quy ước
  // toạ độ/kéo giãn như E9 đã fit (S=(i+0.5)/s, h=1 — kernel Mitchell bị cắt
  // ở |x| ≤ 1,5 rồi chuẩn hoá lại, đúng như bản đo của E9/F6).
  const kernel = sx > 1 && sy > 1 ? chromeUpscaleKernel : triangleKernel;
  let mip = { img: Float64Array.from(src), w: srcW, h: srcH };
  for (let k = 0; k < L; k++) mip = halvePlane2D(mip.img, mip.w, mip.h);
  const a = bilinearPlane2D(mip.img, mip.w, mip.h, dstW, dstH, kernel);
  // Đợt 75 C2: bilinear tính float; làm tròn MỘT lần ở đây (f=0) hoặc ở
  // blend cuối (f≠0) — khớp đo headed RMSE = 0 (xem LIMITS C2 §3).
  if (f === 0) {
    for (let i = 0; i < a.length; i++) a[i] = Math.round(a[i]);
    return a;
  }
  const mip1 = halvePlane2D(mip.img, mip.w, mip.h);
  const b = bilinearPlane2D(mip1.img, mip1.w, mip1.h, dstW, dstH, kernel);
  const out = new Float64Array(dstW * dstH);
  for (let i = 0; i < out.length; i++) out[i] = Math.round((1 - f) * a[i] + f * b[i]);
  return out;
}

/**
 * Resample 1 frame RGB24 bằng mô hình trilinear LOD-bias −0,5
 * (xem resamplePlaneTrilinear). Trả Buffer RGB24 dstW×dstH.
 */
export function resampleRgb24Trilinear(rgb, srcW, srcH, dstW, dstH) {
  const n = srcW * srcH;
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlaneTrilinear(plane, srcW, srcH, dstW, dstH);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}

/**
 * Mô hình mặc định cho bộ lọc Chrome (đợt 70 X1): trilinear mipmap
 * LOD-bias −0,5 cho MỌI thang (không còn chuyển mô hình ở 0,5).
 * Ngưỡng 0,5 ĐÃ ĐO, PIN (đợt 68 V3: crossover trong (0,48, 0,55], tại
 * 0,5 hai mô hình cũ trùng nhau đúng từng số) — với mô hình trilinear,
 * ngưỡng đó chỉ là hệ quả: tại s=0,5 thì λ*=0,5 nên hai thành phần
 * blend trùng nhau, không phải điểm chuyển mô hình (xem LIMITS đợt 69
 * W5 §1 và LIMITS đợt 70 X1).
 */
export function chromeResampleRgb24(rgb, srcW, srcH, dstW, dstH) {
  return resampleRgb24Trilinear(rgb, srcW, srcH, dstW, dstH);
}

/** Làm tròn + kẹp 1 plane float về Uint8Array. */
export function toUint8Plane(floatPlane) {
  const out = new Uint8Array(floatPlane.length);
  for (let i = 0; i < floatPlane.length; i++) {
    const v = Math.round(floatPlane[i]);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}

/**
 * Resample 1 frame RGB24 (Buffer/Uint8Array, 3 byte/px) về dstW×dstH
 * bằng kernel Chrome, cùng thang cả 2 trục (scale = dst/src).
 */
export function resampleRgb24(rgb, srcW, srcH, dstW, dstH) {
  const scaleX = dstW / srcW;
  const scaleY = dstH / srcH;
  const n = srcW * srcH;
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlane(plane, srcW, srcH, dstW, dstH, scaleX, scaleY);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}

/**
 * Resample 1 frame YUV420p (yuv Buffer: Y srcW×srcH, U/V srcW/2×srcH/2)
 * về dstW×dstH theo đúng cách ffmpeg scale làm: mỗi plane scale riêng
 * bằng kernel Chrome (U/V scale từ nửa res), rồi convert sang RGB24
 * bt709 limited. dstW/dstH lẻ -> chroma đích ceil(dst/2) như yuv420p.
 */
export function resampleYuv420p(yuv, srcW, srcH, dstW, dstH) {
  const cw = srcW >> 1, ch = srcH >> 1;
  const dcw = Math.ceil(dstW / 2), dch = Math.ceil(dstH / 2);
  const yOff = 0, uOff = srcW * srcH, vOff = uOff + cw * ch;
  const yPlane = new Float64Array(srcW * srcH);
  const uPlane = new Float64Array(cw * ch);
  const vPlane = new Float64Array(cw * ch);
  for (let i = 0; i < yPlane.length; i++) yPlane[i] = yuv[yOff + i];
  for (let i = 0; i < uPlane.length; i++) uPlane[i] = yuv[uOff + i];
  for (let i = 0; i < vPlane.length; i++) vPlane[i] = yuv[vOff + i];
  const yRs = resamplePlane(yPlane, srcW, srcH, dstW, dstH, dstW / srcW, dstH / srcH);
  const uRs = resamplePlane(uPlane, cw, ch, dcw, dch, dcw / cw, dch / ch);
  const vRs = resamplePlane(vPlane, cw, ch, dcw, dch, dcw / cw, dch / ch);
  // Convert yuv420p (limited) -> rgb24 bt709, chroma upsample nearest
  // theo mẫu: điểm RGB (x,y) lấy chroma tại (x>>1, y>>1).
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let y = 0; y < dstH; y++) {
    const cy = Math.min(dch - 1, y >> 1);
    for (let x = 0; x < dstW; x++) {
      const cx = Math.min(dcw - 1, x >> 1);
      const Y = yRs[y * dstW + x];
      const U = uRs[cy * dcw + cx];
      const V = vRs[cy * dcw + cx];
      const yy = (Y - 16) * (255 / 219);
      const u = (U - 128) * (255 / 224);
      const v = (V - 128) * (255 / 224);
      const r = yy + 1.5748 * v;
      const g = yy - 0.1873 * u - 0.4681 * v;
      const b = yy + 1.8556 * u;
      const o = (y * dstW + x) * 3;
      out[o] = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
      out[o + 1] = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);
      out[o + 2] = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);
    }
  }
  return out;
}

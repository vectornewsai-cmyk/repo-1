# BENCH_LIMITS.md — Giới hạn trung thực của bộ benchmark

1. **Máy test yếu — và đã đổi nhiều lần**: VM test không có GPU (CPU-only toàn bộ)
   và đã đổi phần cứng dưới chân nhiều lần. Bảng thế hệ máy + quy tắc trích số
   tuyệt đối xem `RESULTS.md` mục "Nhãn máy" (đợt 78 F10): thế hệ 1 = AMD EPYC
   7D13, 2 vCPU (đo 20–24/10/2026); thế hệ 2 = 4 vCPU, model không ghi lại
   (đo 06–07/11); thế hệ 3 = AMD EPYC 9D25, 4 vCPU (đo 08–09/11); thế hệ 4
   (hiện tại, từ 10/11) = AMD EPYC 9D64, 4 vCPU. Số tuyệt đối chỉ so được trong
   cùng một thế hệ máy. Mọi số liệu CPU-bound (render x264, whisper, TTS, rembg)
   đều thấp hơn nhiều so với máy dev/laptop hiện đại có 8-16 nhân + GPU. Không
   suy ra "VCut chậm" từ số tuyệt đối — hãy nhìn realtime factor và so sánh
   tương đối trong cùng một lượt đo.
2. **Render dùng testsrc2**, không phải footage thật. testsrc2 có nhiều chi tiết chuyển động
   nên encode nặng hơn footage tĩnh, nhẹ hơn footage 4K thật có noise. Số liệu mang tính
   tham chiếu pipeline, không phải tốc độ với video người dùng.
3. **Render preset**: số chính dùng `veryfast`/CRF23 để benchmark nhanh; app mặc định
   `medium`/CRF20 (chậm hơn, đẹp hơn) — có 1 run 1080p medium để đối chiếu.
4. **Caption bench dùng audio TTS** (giọng đọc rõ, ít nhiễu) — whisper chạy nhanh hơn
   với audio sạch so với audio thực tế có nhạc nền/nhiễu.
5. **BgRemoval bench dùng u2net**, không phải birefnet-general (mặc định của app).
   Lý do: birefnet-general OOM/SIGKILL trên máy 8GB ở inference 1024×1024 (đã đo).
   u2net nhanh hơn nhưng mask kém chi tiết hơn — số fps KHÔNG đại diện cho chất lượng.
6. **TTS bench**: VieNeu-TTS 0.5B trên CPU máy thế hệ 1 (2 vCPU 7D13) đạt ~0.4x
   realtime; số infer thuần đính chính 06/11 (0,12–0,75×, median 0,32×/0,44×,
   72 lần đo) đo trên VM 4 vCPU thế hệ 2 — xem RESULTS.md §3 + §9.3. Máy mạnh
   hơn sẽ nhanh hơn đáng kể (model ONNX scale tốt theo số nhân).
7. **Preview FPS — cập nhật Phase 9 R3:** đã đo được trên Chromium headless
   bằng `apps/web/scripts/bench-preview-fps.mjs` (xem RESULTS.md mục 8).
   Số headless là THAM CHIẾU (decode phần mềm, VM chia sẻ tải), KHÔNG đồng
   nhất FPS trên máy người dùng / trình duyệt thật có màn hình.
8. **So sánh CapCut là ước tính** từ tài liệu công khai (trang chủ, blog kỹ thuật),
   không phải đo cùng máy. Ghi rõ "ước tính" ở mọi chỗ.
9. **Không đo**: thời gian import media, thumbnail generation, waveform, cold-start bridge,
   memory peak chi tiết (chỉ ghi RAM tổng của máy). Đây là benchmark throughput pipeline,
   không phải profiling toàn diện.
10. **Đánh số**: brief giao R1-104 = benchmark; master plan liệt kê R1-103 mới là
    "Performance, memory and reliability benchmarks" còn R1-104 là "User templates/brand kit".
    Implement theo brief.

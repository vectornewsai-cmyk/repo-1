# BENCH_LIMITS.md — Giới hạn trung thực của bộ benchmark

1. **Máy test yếu**: VM 2 vCPU (AMD EPYC 7D13), 8GB RAM, không GPU. Mọi số liệu CPU-bound
   (render x264, whisper, TTS, rembg) đều thấp hơn nhiều so với máy dev/laptop hiện đại
   có 8-16 nhân + GPU. Không suy ra "VCut chậm" từ số tuyệt đối — hãy nhìn realtime factor
   và so sánh tương đối.
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
6. **TTS bench**: VieNeu-TTS 0.5B trên CPU 2 nhân đạt ~0.4x realtime trên máy này;
   máy mạnh hơn sẽ nhanh hơn đáng kể (model ONNX scale tốt theo số nhân).
7. **Preview FPS không đo được** trong môi trường subagent (không có browser thật).
   Có script `preview/bench_preview.js` để chạy thủ công — mục tương ứng trong RESULTS.md
   để trống cho đến khi có số đo.
8. **So sánh CapCut là ước tính** từ tài liệu công khai (trang chủ, blog kỹ thuật),
   không phải đo cùng máy. Ghi rõ "ước tính" ở mọi chỗ.
9. **Không đo**: thời gian import media, thumbnail generation, waveform, cold-start bridge,
   memory peak chi tiết (chỉ ghi RAM tổng của máy). Đây là benchmark throughput pipeline,
   không phải profiling toàn diện.
10. **Đánh số**: brief giao R1-104 = benchmark; master plan liệt kê R1-103 mới là
    "Performance, memory and reliability benchmarks" còn R1-104 là "User templates/brand kit".
    Implement theo brief.

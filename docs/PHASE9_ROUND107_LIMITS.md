# Phase 9 — Đợt 107: Đo lại trên máy yên + đóng nợ đo lường (Re-arm, 2 MiB, Zombie, Blur, Ghost, Harness, EPERM) — GỘP, 9/9 LUỒNG VỀ ĐỦ, 0 MẤT

> Ngày: 13–14/11/2026. Lượt cron 00:35 +07 14/11 (17:35Z 13/11). 9 luồng I1–I9 spawn song song; **9/9 về đủ đúng hạn, 0 late merge, 0 mất trắng** — lần đầu kể từ đợt 105 không có luồng nào chết do reboot (reboot #34 vẫn chưa xảy ra suốt đợt; boot `63a52041` từ 14:50:59Z ổn định tới O8 xong 19:04:11Z). Phối hợp tải mới: nhóm yên (I1/I3/I4) đo trước, nhóm nặng (I5/I6/I8) chờ đủ 3 cờ done mới chạy probe. `preview.tsx` đóng băng cả đợt ở md5 `ced42efd…` (0 file production đổi). KHÔNG push. HEAD a7308ee9 (sau PUSH #5).

## 1. Kết quả từng luồng

### I1 — Ghost flip-leg máy yên: HOÀN THÀNH, NỢ H5 §8 MỤC 1 ĐÓNG

- **C3 ĐẠT bar lúc máy yên: 81,6% (80/98)** — vượt bar ≥70% và ≥ D+20pt (68,6%), +33,0pt vs D 48,6%. Phủ anchor tươi 97,5% (tap 98,6%), nhãn tap distinct 93,2%, gap presented−expected |≤3| 100% mọi cửa sổ, tickCost trung vị 11,6 ms, rAF gap 19,5 ms. Vượt cả kỳ vọng prereg (≈79,2%).
- **Verdict H5 "flip-leg phụ thuộc tải" được xác nhận cả hai chiều:** yên C 79,2% / C3 81,6% đạt; tải nặng C2 68,5% / C2b 63,0% không đạt. Land F8 không bị lật.
- **C3b KHÔNG ĐẠT (61,4%, 94/153) — nhưng là lượt nhiễm tải, không bác C3:** cờ `round107-i1-done` tạo ngay sau C3 (đúng lệnh brief) đã mở cửa cho luồng nặng bắt đầu NGAY GIỮA lượt C3b; phủ sụp giữa lượt (pass ~9–10 chỉ 34%), tickCost 17,8 ms, rAF gap 74,8 ms, load1 1,54 → 3,74. C3b là thêm một điểm dữ liệu tải nặng, khớp hướng dự đoán. **Bài học phối hợp (xem §2): cờ done chỉ được tạo sau khi MỌI lượt probe (kể cả lặp xác nhận) đã xong.**
- Gradient phủ → clean cập nhật: 68,7%→61,4% (C3b) / 82,4%→63,0% / 83,2%→68,5% / 92,4%→79,2% / **97,5%→81,6% (C3)** / 99,1%→86,6%.
- Spread đuôi lỏng VẪN MỞ: C3 max 47,8 (116 nhóm) nhưng C3b max 75,4 (36 nhóm) — max ~47 chỉ là hiệu ứng mật độ lấy mẫu.
- Hồi quy trên cây đóng băng: tsc 0, vite build PASS 8,18 s, ghostBlend 15/15, previewEngine 27/27. Batch: 1 entry (LIMITS-only; probe/analyzer/JSON ở hidden_files theo tiền lệ H5).

### I2 — Re-arm A/B RAM cao: HOÀN THÀNH, LẦN ĐẦU 2/2 LƯỢT HỢP LỆ

- **Trigger đạt check 3 (17:49:22Z):** RAM khả dụng 2.965.144 kB, load1 3,11, sibProcs 0. Cửa sổ RAM cao do sibling I1 thoát giữa check 1→2 (RAM nhảy +1.747 MB), không phải reboot.
- **f8r (gop250): CAP = 1 [5087]**, 99 ticks, RAM đầu 2.942.872 kB (RAM-CAO), dừng sớm do playhead đóng băng ≥2,5 s lúc seeking. **f9 (gop30): CAP = 3 [5023, 5201, 5255]**, 118 ticks, RAM đầu 2.428.564 kB (RAM-CAO), hết 40 s chưa đạt localPh ≥ 5,0 (giống f7). Cả 2 lượt verdict PASS/PASS, md5/mtime `preview.tsx` không đổi.
- **Tổng: 4 CAP / 2 lượt = 2,00 CAP/lượt** (baseline f1–f5: 2,80); CAP/tick 0,0184 vs 0,0200; freeze-trong-đuôi-mở trung vị 4.849 vs 4.900 ms → **nhánh "RAM bị loại" theo tiêu chí đăng ký trước (G4 §4.1)**.
- **Caveat bắt buộc kèm theo:** RAM khả dụng lúc tải-nền-bật chỉ còn 1376/989 MB, trung vị 1182 MB — ngang baseline 1189 MB. Stack khởi động ăn ~1,0–1,5 GB nên treatment RAM cao không giữ được trong cửa sổ đo. Kết luận là gợi ý mạnh trên cả 3 chỉ số, chưa phải loại trừ dứt khoát. Freeze-tail bất biến ~4,7–5,0 s qua cả 9 lượt; CAP ages cụm chặt 5004–5271 ms — giống cửa sổ cấu trúc ~5 s hơn đói tài nguyên (ghi nhận, chưa kết luận). **Bước tiếp theo: A/B tắt E4 (G4 §4.2).**
- Driver đã vá trước khi chạy: `wait-hiram107.sh` (133 check, thêm phát hiện reboot + STOP file); `run-f5-hiram107.sh` (kiểm lại RAM trước mỗi lượt + phân loại RAM-CAO/RAM-SÀN/BỎ-lượt, md5 trước/sau); `analyze-f8r-f9-cap-pattern.py` (sửa ENV join đọc log — kiểm chứng trên dữ liệu H1: RAM/load1 ra đúng 2.417.876 kB/3,98 và 2.367.940 kB/9,51 thay vì null; CAP khớp 100%). Batch: 1 entry (LIMITS-only; driver/watcher/data ở hidden_files ngoài repo, theo mẫu H1).

### I3 — 2 MiB: HOÀN THÀNH, NGUYÊN NHÂN LỖI H2 ĐÃ TÌM RA, QUEUE2 CÓ MẶT

- **Nguyên nhân lỗi H2 (đợt 106) — thiếu `GST_PLUGIN_PATH`.** I3 tái hiện đúng 3/3 lỗi `page.evaluate: Target page… has been closed` (GST log 0 byte) khi chạy không có biến này; diag mode `none` vẫn chết → loại GST/shim; minprobe: evaluate thường OK, video trần OK, nhưng gán `src` (+preload=metadata, chưa play) crash sau ~38 ms → điểm chết là lúc tạo media pipeline. MiniBrowser bắt được stderr quyết định: `GStreamer element appsink not found` + `autoaudiosink not found` + `GLib-GObject-CRITICAL` + `WebProcess CRASHED`. RAM lúc chết ~1 GB (không OOM), load <4. **Kiểm chứng đảo ngược:** với `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, video chạy ngay (ct 5.095, 123 frames). Đây là **lỗi môi trường chạy probe, không phải lỗi sản phẩm.** Bài học: header comment runner gốc đã ghi biến này nhưng H2 không ghi vào `h2-run.log`.
- **H2Q chạy được — queue2 HIỆN DIỆN (phép thử chưa từng chạy được):** 3/3 run playOk=true, 191/191/189 frames, 0 dropped, GST log ~2,0 MB/run. **GST log: 7.757 / 7.782 / 7.626 dòng `queue2`** (element `queue2-0`). **DOT (6/15 file):** node `queue2-0` ghi `ring-buffer-max-size=2097152` — đúng hằng số 2 MiB; vị trí: `typefindelement0 src → queue2-0 sink` (caps video/quicktime) → `queue2-0 src → parsebin0 sink` → qtdemux0. Queue2 nằm **sau typefind, trước parsebin/qtdemux**; pull log 0 PULL `elem=queue2` (push-mode, phù hợp).
- **Nhân quả vẫn chưa chứng minh:** 3/3 run sạch — 398 PULL/run toàn EXACT, 0 spliced pulls. Không có run bogus để đối chiếu offset với ring buffer. Giả thuyết "queue2 không có trong pipeline" bị bác; ứng viên vẫn đứng. Tỉ lệ bogus 0/3 khác G6 (2/3): máy yên + RAM 3,5 GB (G6: 1,1–2,1 GB) — race theo thời gian, n=3 nhỏ, không tách được yếu tố.
- **H2EXT + mitigation `.mp4` — đã đo (1 run mỗi biến thể):** EXT playOk 189 frames, NOEXT playOk 165 frames, cả hai 0 spliced pulls. Quan sát duy nhất (n=1): typefind tìm caps EXT 0,184 s vs NOEXT 0,369 s. Ở đường progressive, adapter webkitwebsrc chỉ push 1 lần toàn file nên không đo được số lần scan 40-vs-1. **Mitigation `.mp4` không chuyển thẳng sang blob URL** (blob: URL không mang extension) — cần cơ chế khác, ghi nợ mở.
- **H2C8 không chạy** (cần ≥1 run bogus trên c8; tỉ lệ bogus đợt này 0/5 trên c2). Batch: 7 entry (runner I3, runner diag, 2 minprobe, 2 JSON, LIMITS).

### I4 — Zombie: HOÀN THÀNH, NỢ KILL KHÔNG-BLUR ĐÓNG, GATE (b) VẪN MỞ (LƯỢT THỨ 6)

- **y3 = lặp y1, Chromium, scroll-mixed-alt, 24 clip: seek-across 23/23, 0 missed-window.** Chờ yên 55 s, load lúc phát 1,93; RAM khả dụng 2314 MB. `preview.tsx` md5 trước = sau = `ced42efd…` (mtimeChanged=false) — **lượt zombie đầu tiên không có confound build-identity giữa lượt.**
- **Zombie Δ = 0 ở 12/12 biên đo được; capture cửa sổ clip lẻ 0/12** (gộp y1: 0/24 cửa sổ seek-across). gstd D = 0/935. E4a tick stale 0/11; cap STALE-CANVAS 23/23 (đọc lại tiền-seek, như y1).
- **Kill trực tiếp blur: n=12, median 0,20 ms (0,10–0,30), mean 0,19** — lặp lại median 0,20 ms của y1.
- **Kill clip không-blur — nợ H3 §5 mục 2 ĐÓNG bằng đo + đọc code:** killsDelta = 1 ở 12/12 seek lẻ (clip cũ blur, pump active) và = 0 ở 11/11 seek chẵn (clip cũ không-blur, clip lẻ không có entry nào trong `__vcutMotionBlurSnapshots`); tSetMs chẵn median 0,20 ms (n=11) ≈ lẻ 0,20 ms (n=12). Căn cứ code: `rvfcKillPumpsOutsidePlayhead` (preview.tsx:1899–1936) chỉ ghi kill entry khi kill được pump trong map; pump chỉ tạo cho clip blur — kill entry cho clip không-blur không thể tồn tại theo thiết kế, không phải probe bỏ sót.
- **Gate (b): VẪN CHƯA QUAN SÁT ĐƯỢC — lượt thứ 6 liên tiếp.** Chỉ 1 draws-gap >300 ms (408 ms, skips=1, dph=1,27, spread=False, n_inside=7) — vẫn mẫu "1 bước nhảy + plateau" mà G2 đã loại.
- **Caveat — state100 "dày" chỉ đạt một phần:** interval đặt 10 ms nhưng gap thực tế median 56 ms / p90 119 ms / max 385 ms (n=825). Dày hơn y1 (n_mau quanh biên 14–41 vs 12–15 cuối lượt y1) nhưng không đạt 10 ms — main thread là nút thắt, không phải interval. Bài học phương pháp: đừng lặp lại "đổi interval" như một fix; cần sampler ngoài main thread. Nghịch lý: máy yên → freeze dài hiếm (y3 chỉ 1 gap vs y1 4 gap) nên cơ hội quan sát gate (b) cũng ít hơn.
- Batch: 2 entry (probe mới + LIMITS).

### I5 — Blur B-band: HOÀN THÀNH, B-BAND VẪN MỞ, GẦN NHƯ KHÔNG NHÚC NHÍCH

- **Gộp F6+G7+H4+I5: c0 7/83 (8,4%) vs c2 3/57 (5,3%), Fisher một phía p=0,3584** (hai phía 0,5282; H4 là 0,3545) — **KHÔNG ĐẠT bar p<0,05**. Hiệu số +3,2pp, 95% CI Newcombe [−6,9pp, +11,9pp]. Power tại hiệu ứng gốc 62% (normal) / 57% (Fisher-exact, 20.000 mô phỏng); tại hiệu ứng quan sát chỉ 17%. Còn thiếu **c0 32 / c2 58 B-cap** tới ~115/nhóm. Cờ heterogeneity vẫn không có ý nghĩa (c0-only 5/44 vs c0 3-clip 2/39, p=0,4388; I5 riêng 1/5 vs 1/6, p=1,0) — vẫn gộp pool.
- **D floor gộp: 0/2429** (Fisher vs pre-fix 28/1547: p=2,86e-12; CI trên 0,124%).
- Dữ liệu đợt này (6 lượt, đều exit 0, md5 `ced42efd` ổn định, F3 tắt): r41c0 5/5 cap (suy giảm nặng, H4 c0-only: 28–37 cap); r41 13/11; r42c0 9/7 (phát trong sóng tải 26,11); r42 19/17; r43c0 4/4 (**0 blend tick**, phát lúc load 27,15); r43 17/14. Tổng I5 mới: 67 cap thô / 58 cap dùng, 19 B-cap (11 c0 + 3 c2) — quá ít so với kỳ vọng prereg (~30 c0 + ~18 c2 sau 4 lượt). Nguyên nhân: máy bị các luồng đợt 107 khác chiếm dụng suốt đợt (psOther 15–16, sóng tải load 26–28 xen kẽ cửa yên, load15 ~7–11) làm rAF/pump đói — cùng mẫu như I8 (35 cap/19 tick). Đây là giới hạn của đợt, không phải của phương pháp.
- **Sự cố ENOSPC:** đợt 1: 5/6 lượt exit=2 do vite crash `ENOSPC: System limit for number of file watchers reached` (max_user_watches=63747) vì nhiều vite server luồng khác chạy song song; retry cùng thiết kế/cùng tag sau cổng chờ yên, cả 5 lượt exit 0. Lệch prereg: driver đợt 1 không dừng sớm sau 2 fail liên tiếp (đã chạy hết 6 lượt).
- Reboot #34 (dự báo tới 18:05Z) **không xảy ra** — boot 63a52041 giữ nguyên từ đầu tới cuối. r41c0 (exit 0) không chạy lại — giữ trong pool theo prereg.
- Kiểm chứng cây cuối (~18:42Z): tsc 0; vite build pass 32,94 s; previewEngine.test.ts 27/27; test-preview-engine.sh 354 assertions pass. Batch: 2 entry (LIMITS + probe script).

### I6 — Harness E1 tải nặng: HOÀN THÀNH, 0 FLAKE / 6 LẦN, KEYDOWN KỶ LỤC MỚI

- **G4 flake: 0/6 lần E1 hoàn thành dưới tải nặng** (run11–13, 15–17 đều 10/10 PASS, G4 tap=true, R=0,51). Tỉ lệ gộp nay **2/34 = 5,9% (Wilson 95% ~2–19%)**. 0/6 không bác được tỉ lệ cũ (P(0/6 | tỉ lệ thật 1/10) ≈ 53%).
- **Bar prereg CHƯA đạt đủ:** prereg đăng ký 0 flake trên ≥7 lần tải nặng — chỉ 6/7 lần tới được G4. Run14 chết trước G4 (harness timeout 3 phút chờ project mẫu tự load + hook, exit 2, không report) — đây là lỗi mong manh dưới tải, không phải flake G4.
- **Tải kéo dài G3→G4 lên 4,00–8,30 s (trung vị 6,79 s)** so với 1,72–2,33 s máy yên. Bước thừa nhất là patchClip→setEnhCheckbox (2,17–4,50 s); hook áp muộn 0,81–2,20 s sau khi store đã true ở 4/6 lần (chữ ký H-a), nhưng waitIdle (tới 2,00 s, run15) đã hấp thụ hết — không lần nào hook còn false lúc G4 đọc. 2 slot đóng băng (drawFps 0,31–0,33) nhưng vẫn PASS.
- **Keydown chậm tự nhiên: kỷ lục mới 2197 ms** (run15 pauseWait slot 1; playWait max 1124 ms). Gộp: **55 lần / 737 slot / 1474 toggle, max 2197 ms**, 0 retry/fallback/abort — biên an toàn còn 2,3× so với timeout 5000 ms. Fallback #2 vẫn mở.
- **Tải nặng:** tạo bằng 15–19 tiến trình Python busy-loop. Load1 dao động 0,63–23,58, không đạt 15–19 ổn định như prereg (cell chỉ 1,5 CPU nên busy-loop bị throttle, load1 đếm thiếu); bằng chứng tải thật: pressure CPU avg300=50,27, load5 4–13, 17–32 thread đang chạy, drawFps ~1 fps, idleClass=tải cả 6 lần. G5 cả 6 lần PASS chắc ngay vòng 1 (mean 0,99–1,51) — là số tải, không phải tốc độ deint.
- Phối hợp tải: chờ đủ 3 cờ nhóm yên (i1 17:46Z, i4 17:51Z, i3 18:00Z) mới chạy; poll log đầy đủ. **Không sửa code:** harness md5 giữ nguyên `ae6cd34a…` (log H6 đã đủ); `preview.tsx` giữ nguyên `ced42efd…`. Lỗi tự nhận: `summ_e1` in g5=None do key JSON khác giả định — số G5 trong LIMITS lấy trực tiếp từ JSON. Batch: 1 entry (LIMITS-only).

### I7 — EPERM probe #26: HOÀN THÀNH, MÙ #25 ĐÓNG HOÀN TOÀN

- **Probe #26 (checklist P8 §2.3, đúng 1 lần):** status 17:40:18Z DEAD/STALE (age 10.838 s, n=25, boot 75697729, exit 1) → `once` 17:40:22Z **ok=2 fail=0, boot=63a52041**, exit 0 → status sau ALIVE (age 11 s, n=26, exit 0). Log probe v2 tăng đúng 3 dòng (67 → 70); heartbeat nay n=26, ts 17:40:22Z.
- **Mù #25 (14:39:40Z → 17:40:22Z, 3h00'42") ĐÓNG HOÀN TOÀN — đúng 1 reboot (#33, 14:50:59Z, đã chốt từ trước).** Đóng bằng loại trừ trực tiếp, không bằng sàn: đoạn trước #33 (11'19") kẹp bởi probe #25 + 2 poll H9 cùng boot 75697729; đoạn sau #33 (2h49'23") chứng minh liên tục bởi `uptime -s` = 14:50:59Z đo trực tiếp lúc probe #26 + poller H9 (9 poll, 14:52:45Z → 16:12:47Z, cùng boot 63a52041). Đây là mù đầu tiên đóng hoàn toàn kể từ mù #23 (mù #24 không đóng được). Lưu ý phương pháp mới: lỗ mtime giả 51'55" (15:20:53Z → 16:12:48Z) chỉ lấp được bằng **nội dung** poll.log, và đuôi 50'54" không observer (16:49:28Z → 17:40:22Z) đóng được nhờ uptime — nhưng đuôi này **vẫn mù về sóng**.
- **Reboot #34 CHƯA xảy ra** lúc probe (boot vẫn 63a52041, uptime 2h49'23"). Dự báo điểm H7 (~16:51:58Z) trượt ít nhất **+48'24"** và vẫn đang lệch; dải H7 (15:10:06Z–18:05:07Z) còn mở tới 18:05:07Z. Dự báo #35 có điều kiện: nếu #34 rơi vào trần 18:05:07Z thì #35 ~20:06:07Z, dải 18:24:14Z–21:19:15Z. Độ tin cậy dự báo điểm thấp — 3 lượt liên tiếp lệch >48 phút, ngược hướng nhau.
- **Sóng EPERM:** 0 thật trong 78 file *.log có mtime trong mù #25 (0 "vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted"); 6 dòng "sóng EPERM đã tắt" đều là dương tính giả đã biết (dòng launcher). Sóng gần nhất vẫn ~11:55–12:11Z 11/11 (~53h29' trước probe #26). EPERM không được tuyên bố là đã hết.
- **writeFileSync:** 506 dòng / 158 file (phạm vi 2732); R7b 531/175; copies 25/17; đối chiếu chéo 506+25=531=R7b, **chênh 0 — lần thứ 13 liên tiếp**. +12 dòng / +4 file so với H7, giải thích đúng hết bằng diff (probe107i5 +5, H7 LIMITS +3, H9 LIMITS +2, ROUND106 LIMITS +1, GAP_ANALYSIS 15→16); 0 file biến mất. Async `.writeFile(` vẫn đúng 2 vị trí helper retry đã biết, 0 stray.
- **RAM:** 467.932 / 461.620 / 454.240 kB (~0,45 GB, ~7,4% guard). Birefnet KHÔNG chạy, vẫn 0 lần thành công.
- Đính chính tiền đề: file `eperm-now.txt` ở repo root chỉ chứa ký tự `x`, không phải checklist P8 §2.3 — lượt này làm theo checklist như H7 §1 đã ghi. Batch: 1 entry (LIMITS-only).

### I8 — Blur cụm A stripes: HOÀN THÀNH, MÔ HÌNH HARMONIC BỊ BÁC, E6 VẪN MỞ

- **Offline — mô hình harmonic BỊ BÁC:** triple liên tiếp trên stripes thuần chỉ cho g ≈0,333 (49/75 f) hoặc ≈0,745 (26/75 f), **0/75 trong [0,40, 0,50]** (bền qua BILINEAR/NEAREST/full-res). Quét toàn bộ bộ 3-frame trọng số đều cho 12 ca A của E6: **0 bộ nào vào band [0,40, 0,50]**. Khẳng định E6 "9/13 ca chỉ khớp triple liên tiếp (pred 0,449)" dựa trên mô hình harmonic — giá trị 0,449 không hề xuất hiện trong tính trực tiếp.
- **Lệch g triple +0,029 GIỮ NGUYÊN trên dữ liệu gộp:** union H4-48 + G7 decisive chr = 48 sự kiện (G7 5/5 trùng H4, 0 mới); thuần n=43: 0,625 vs 0,596; pad-clone n=5: 0,769 vs 0,741 (+0,028). Vẫn chưa giải thích được.
- **H-alt-weights (post-hoc):** w=(0,20, 0,35, 0,45) đưa 11/11 ca A labels-true vào band và dự đoán g triple noise 0,621 (đo 0,625) — chưa chứng minh, cần dữ liệu probe.
- **F1 ĐẠT:** strip second-nearest MAD min/med 30,9/46,6 trên file đã encode, 90/90 ≥30; band A' chốt [0,36, 0,48].
- **Probe (nguyên nhân dữ liệu mỏng):** chỉ 35 cap / 19 blendTick (lượt yên: 98–232 cap, 99–368 tick) — load1 tới **27,9** lúc phát lượt r43, video chạy 0,4× realtime, draw 2/s thay vì ~100/s, pump capMs 200–400 ms. Chỉ **2 sự kiện phân biệt**, **0 trong band A'** (bar ≥8): E1 r43 c0 pres20 content {18,18,18} g=1,006 (vòng kẹt, label gap 6 nhưng content gap 0); E2 r44 c1 pres46 content {22,22,45} g=0,781 vs pred đều 0,757 (Δ0,024; H-alt Δ0,057 — n=1, chỉ gợi ý yếu).
- **Strip live 19/19 tick** (MAD tới frame đúng 0,3–0,6 vs frame nhì 36–59 — chuẩn G7). **Phát hiện mới:** nhãn lệch hệ thống dưới tải — presented trễ nhãn trung vị −4 frame (chỉ 2/19 trong ±1; F2 "trong ±1" FAIL), ghost content sớm hơn nhãn +0..+4 (trung vị +3). Đây là nhiễu nhãn do tải, không phải lỗi strip.
- **Kiểm chứng cuối** (cây ced42efd): tsc 0 lỗi, vite build pass (1m16s), previewEngine.test.ts 27/27, test-preview-engine.sh 354 assertions pass.
- Batch: 3 entry (probe + generator + LIMITS; `stripes-code.mp4` nhị phân KHÔNG stage).

### I9 — Verify: HOÀN THÀNH, 8/8 VỀ ĐỦ, CÂY GỘP XANH

- **8/8 luồng về đủ trước hạn đóng băng, 0 mất, 0 late merge.** Không có reboot #34 trong suốt đợt (boot #33 từ 14:50:59Z ổn định tới O8 xong 19:04:11Z). `preview.tsx` giữ nguyên md5 `ced42efd…` ở mọi poll.
- **Đối chiếu headline độc lập: KHỚP 100% cả 8 luồng** — I9 tính lại từ dữ liệu thô bằng script viết mới của riêng mình (recount-i1/i2/i4b/i5/i5b/i6 + kiểm trực tiếp file/log I3/I7/I8): I1 C3 80/98 = 81,6% (đạt bar), C3b 61,4% (nhiễm tải); I2 f8r 1 CAP, f9 3 CAP (gộp 2,00/lượt vs baseline 2,80 — tính lại từ 5 dòng gốc, khớp cả frzTail/rate/frzPhAdv median); I3 queue2 7757/7782/7626 dòng, ring 2097152, cạnh typefind→queue2→parsebin, pull 398/run toàn EXACT, 0 spliced; I4 kill blur median 0,20 ms (n=12), gate (b) vẫn chưa quan sát được (lượt thứ 6); I5 số FINAL sau retry — Fisher gộp p=0,3584, D floor 0/2429, còn thiếu c0 32 / c2 58 (số tạm pre-retry p=0,2639 đã bị thay, chỉ dùng số final); I6 6/7 hoàn thành tới G4 (run14 chết trước), flake gộp 2/34 = 5,9% Wilson ~2–19%, keydown max 2197 ms; I7 probe #26 ok=2 fail=0, mù #25 ĐÓNG HOÀN TOÀN (3h00'42", đúng 1 reboot); I8 F1 đạt (MAD 30,9/46,6/61,5), strip 19/19, E6 vẫn mở (cần ≥8 sự kiện), harmonic bị bác.
- **Cây gộp cuối đợt: XANH hoàn toàn.** Đóng băng 18:56:18Z. tsc web 0, tsc desktop 0, vite build PASS 7,48 s, **27/27 mục suite exit 0** (hold 75/75, pacing 19/19, previewEngine 27/27, ghostBlend 15/15, css60 60/60, css61 60/60, P7 8/8, orphans 17/17, r6 PASS, U4 141/141, test-preview-engine.sh 354 assertions), **O8 21/21 cả 2 engine** (Chromium + WebKit, exit 0; Δx S7 khớp kỳ vọng cả hai).
- Điểm mới: **dải dự báo reboot của H7 bị phá lần đầu** — gap #33→#34 nay >3h14'08" (trần cũ). Mù #26 bắt đầu từ probe #26 (17:40:22Z) — probe #27 đối chiếu từ mốc này. ENOSPC (inotify watchers 63747) làm mất 5/6 lượt I5 đợt 1 — retry đã cứu đủ; đây là điểm nghẽn hạ tầng cho đợt sau.
- Giới hạn của chính I9 (ghi trong LIMITS I9 §10): chưa tính lại độc lập E4a tick stale của I4, chưa grep lại toàn bộ 78 log sóng EPERM, chưa đếm lại 114 lần BẤM checkbox của I6, không chạy lại probe lỗi H2 của I3. Batch: 1 entry (LIMITS I9).

## 2. Ghi chú gộp parent

- **Phối hợp tải hoạt động một phần:** nhóm yên đo sạch (C3 đạt bar, y3 không confound, H2Q vào được media); nhưng nhóm nặng vẫn đói dữ liệu (I5 chỉ 19 B-cap mới, I8 chỉ 2 sự kiện) vì các luồng nặng chạy chồng nhau + sóng tải xen kẽ. Đợt sau: giảm số luồng probe đồng thời ở nhóm nặng, hoặc xếp B-band/cụm A vào cửa yên riêng.
- **Lỗi phối hợp cờ (I1/C3b):** cờ done được tạo ngay sau lượt đo chính, trước lượt lặp xác nhận — luồng nặng tràn vào giữa lượt lặp. Quy định mới từ đợt 108: **luồng yên chỉ tạo cờ done sau khi MỌI lượt probe (kể cả lặp) đã xong**; luồng nặng vẫn chờ đủ 3 cờ.
- **Reboot #34 vẫn chưa xảy ra tới 19:04:11Z** (I9 O8 xong) — gap #33→#34 >3h14'08", phá trần dải dự báo H7 lần đầu. Dự báo điểm của H7 lệch ≥48'24" (lượt thứ 3 liên tiếp lệch >48 phút, ngược hướng nhau) — mô hình dự báo cần làm lại, không dùng dự báo điểm cũ để lên lịch probe nữa.
- **ENOSPC inotify watchers (63747) là điểm nghẽn hạ tầng mới:** 5/6 lượt I5 đợt 1 chết do vite crash; retry cứu được. Đợt sau: chạy ít vite song song hơn, hoặc tăng max_user_watches ở cấp hệ thống (ngoài phạm vi luồng đo — cần quyền hệ thống).
- **Không có reboot cắt ngang đợt này** — lần đầu từ đợt 105, 9/9 về đủ đúng hạn không cần late merge. Quy trình lưu sớm + đóng băng production + chia lượt nhỏ vẫn giữ nguyên cho đợt sau.
- Parent kiểm chứng độc lập: đếm lại trực tiếp từ đĩa khớp I9 — **đợt 107: 9 batch / 19 entry / 19 file duy nhất, 0 thiếu, 0 workflow, 0 binary**; `preview.tsx` md5 `ced42efd…` sau đợt. Không chạy lại toàn bộ suite (I9 vừa chạy 27/27 + O8 21/21 trên đúng cây này; I5/I8 chạy lại tsc 0 + vite build pass + previewEngine 27/27 sau lượt của mình).

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0 (I9); vite build PASS 7,48 s (I9); 27/27 suite exit 0 (I9); test-preview-engine.sh 354 assertions; O8 21/21 cả 2 engine (I9, trên cây ced42efd).
- Đếm lại trực tiếp từ đĩa: **đợt 107: 9 batch / 19 entry / 19 file duy nhất** — khớp I9; 0 trùng với đợt 106.

## 4. Nợ mở cho đợt 108

1. **G1 — chờ user quyết** (metric G5 hay M2; khung (c) 26–27/32 = 81,25% kịch bản xấu; khuyến nghị G5: M2 + khung (c), đóng có điều kiện tự mở lại). 6 câu hỏi Q1–Q6 trong file quyết định.
2. **Mù #22 — chờ user quyết** mức tin cậy (cửa sổ lý thuyết nay ≤78 s sau sàn mới; mù #21 + reboot #16 cũng chờ quyết). Mù #24 vẫn không đóng hoàn toàn (lỗ 2h03'11"); số thứ tự #32/#33 là tạm thời.
3. **Re-arm — TIẾN TRIỂN LỚN, vẫn mở.** Lần đầu 2/2 lượt hợp lệ (2,00 CAP/lượt vs baseline 2,80 — nhánh "RAM bị loại" theo tiêu chí đăng ký trước, kèm caveat treatment RAM không giữ trong cửa sổ đo). **Bước tiếp theo: A/B tắt E4 (G4 §4.2).** Watcher chạy NGAY sau reboot; giữ quy định đóng băng `preview.tsx` trong cửa sổ đo.
4. **2 MiB — TIẾN TRIỂN LỚN, vẫn mở.** Nguyên nhân lỗi H2 đã tìm ra (thiếu `GST_PLUGIN_PATH` — lỗi môi trường probe); queue2 HIỆN DIỆN (ring 2097152 sau typefind, trước parsebin) nhưng nhân quả chưa chứng minh (0/3 bogus). Thí nghiệm phân biệt: chạy tới khi có run bogus rồi đổi `max-size-bytes` xem offset có dời không; H2C8 chưa chạy; mitigation `.mp4` trên đường blob cần cơ chế khác; **nhớ export `GST_PLUGIN_PATH` trong mọi probe WebKitGTK sau này.**
5. **Zombie gate (b) — vẫn mở (lượt thứ 6 chưa quan sát được).** Cần lượt chuyên đo freeze + sampler ngoài main thread + tải vừa đủ để freeze xuất hiện (máy yên → freeze hiếm); rerun f4y3 pause-burst vẫn chưa xảy ra. Kill đã đóng cho cả blur và không-blur — không đo thêm trừ khi đường kill đổi code.
6. **Blur B-band — vẫn mở (p=0,3584).** Còn thiếu c0 32 / c2 58 B-cap; cần máy yên hơn (xếp B-band vào cửa yên hoặc giảm luồng probe đồng thời — với tốc độ đợt này cần ~18 lượt c0-only + ~19 lượt 3-clip nữa, không khả thi trong một đợt).
7. **Blur cụm A — vẫn mở (E6 chưa chứng minh/bác).** Chạy lại probe stripes-code khi máy yên (chỉ phát khi load1 <5; nếu cổng chờ yên 120 s hết mà load vẫn cao thì **HOÃN lượt thay vì phát**); H-alt-weights (0,20, 0,35, 0,45) cần dữ liệu probe; lệch g triple +0,029 và mâu thuẫn stripes-thuần (không bộ 3-frame đều nào cho g≈0,44) vẫn mở; bar "presented trong ±1" cần hiệu chuẩn lại theo tải.
8. **Ghost — flip-leg ĐÓNG (đo lại lúc máy yên đạt bar), còn nợ:** chạy lại C3b lúc máy yên (load1 <2, không có luồng nặng vừa mở cờ); spread đuôi lỏng max ~75 vẫn mở; F6' pixel-verified skipLatest cho WebKit vẫn mở.
9. **Harness — G4 flake 2/34 (5,9%), vẫn mở.** Chạy tiếp E1 tải nặng để đủ ≥7 lần hoàn thành (I6 mới 6/7); dùng load5 + thread đang chạy + fps slot làm dial tải thay vì load1; keydown chậm gộp 55 lần / 737 slot / 1474 toggle, max 2197 ms (biên 2,3× so với timeout 5000 ms).
10. **EPERM — probe #27 + mù #26** (mù #26 bắt đầu 17:40:22Z); mô hình dự báo reboot cần làm lại (3 lượt liên tiếp lệch >48 phút, gap #33→#34 >3h14' phá trần dải); cron riêng 10 phút vẫn chờ user quyết.
11. **Hạ tầng — ENOSPC inotify watchers 63747** là điểm nghẽn khi nhiều vite song song; cân nhắc tăng ở cấp hệ thống.
12. Birefnet-general trong gói: chỉ thử lại khi RAM đổi — vẫn 0 lần chạy thành công.
13. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
14. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
15. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.
16. **Quy trình đợt sau:** cờ done chỉ tạo sau khi MỌI lượt probe (kể cả lặp) đã xong; chia lượt probe dài thành lượt nhỏ + lưu sớm; đóng băng file production trước khi probe; luồng sửa production báo trước cho luồng đo; số reboot chốt bằng `uptime -s` trực tiếp (đồng hồ boot cũ chạy nhanh ~25–29 s); B-band/cụm A xếp cửa yên riêng hoặc giảm luồng probe đồng thời.

## 5. Batch đã stage (KHÔNG push)

- Đợt 107: 9 luồng, **19 entry / 9 file** (I1 1, I2 1, I3 7, I4 2, I5 2, I6 1, I7 1, I8 3, I9 1).
- Closing đợt 107: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §36).
- **Tổng chờ push thật: 19 batch / 42 entry / 41 file duy nhất + 1 file oversize** (đợt 106: 9 batch / 21 entry / 21 unique; đợt 107: 9 batch / 19 entry / 19 unique; closing 107: 1 batch / 2 entry / 1 unique mới — LIMITS gộp; gap analysis đã có trong unique từ trước; file oversize `benchmarks/results/webkit-blob-flaky-96x3.json` 6.370.678 byte vẫn chờ quyết). HEAD vẫn a7308ee9. KHÔNG push.
- Dict i18n 2767 key, không đổi.

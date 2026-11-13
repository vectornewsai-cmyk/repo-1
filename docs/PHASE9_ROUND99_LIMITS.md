# Phase 9 — Đợt 99: Đóng nợ LIMITS gộp đợt 98 §4 (mục 2–9)

> Ngày: 13/11/2026. Lượt cron 00:35 +07 (17:35Z 12/11). 10 luồng A1–A10 spawn song song; **10/10 về đủ** (9 luồng làm việc + A10 kiểm chứng; A10 lần chạy đầu kết thúc sớm không kết quả cuối nhưng poller nền của nó vẫn sống, bản chạy lại dùng lại poller + log cũ, không khởi trùng). KHÔNG push. HEAD vẫn 5f548ef8.
> Bối cảnh: reboot #22 17:25:39Z (boot 99338d31) ngay trước đợt; không reboot trong đợt lẫn lúc verify; RAM khả dụng ~0,5–2,0 GB (thấp nhất từ trước — các luồng chạy probe tuần tự).

## 1. Kết quả từng luồng

### A1 — 2 MiB basesrc: ĐIỀU TRA XONG (nợ §4 mục 2)
- 2 run bogus giống hệt Z1 (MATRIXFS c2/c8 × 6, GST nhẹ + `basesrc:5`, 24 case/run), chỉ đổi chỗ ghi log GST: run 1 ghi đĩa (blob 12/12, bogus 0/12), run 2 ghi tmpfs `/dev/shm` (blob 10/12 strict, 12/12 loose, bogus 2/12 — cùng tỉ lệ Z1 ghi đĩa) → **ghi đĩa BỊ LOẠI là yếu tố ức chế**; ức chế nằm ở chi phí debug-call/nhiễu thời gian. Gộp 3 run basesrc:5: bogus 4/36 = 11% vs nhẹ Y1a 10/12 (83%).
- Thu được 2 run bogus CÓ log basesrc, giá trị MỚI **541230788** (byte tại 2 MiB+0 của c2, dạng atom-1; Z1 chỉ có 2854668610 @2MiB+32 và 2991868683). Cả 2 fail error-event nhưng frames 54/87 (play() reject NotSupportedError, fallback http, qtdemux2 hồi phục sau). Fail⇒bogus gộp toàn lịch sử: 58/66 = 88%. Stall-timeout: 0/24.
- **Thành phần đặt ra 2 MiB đã xác định: `SMALL_MEDIA_RESOURCE_MAX_SIZE = 2×1024×1024` trong `WebKitWebSourceGStreamer.cpp`** (r248257, bug 199998) — cổng pause/resume download; máy móc còn trong đúng binary probe. qtdemux được minh oan lần nữa (hỏi đúng mọi offset; tráo nằm ở/below `webkitwebsrc.create()` hoặc handoff typefind/adapter). Điểm nối chính xác vẫn chưa chứng minh được — nợ mở.
- Không sửa production (media.ts sha 809bd3db không đổi). Batch: phase9-round99-a1-basesrc.txt (5 entry).

### A2 — Ghost residual: CƠ CHẾ MỚI Ở ĐƯỜNG TICK (nợ §4 mục 3)
- Instrumentation chỉ-đo (marker "Đợt 99 A2" ×8, preview.tsx): WeakMap gắn strip pixels (48 mẫu G) lên canvas snapshot ở cả 2 điểm capture (rVFC + tick) + stash ghost đã blend + trường `ghostPix` mới ở blend tick. Phủ ghostPix null = 0 ở cả 3 run. 3 run probe CDP (abcde 10 pass, b-only 15 pass, b no-RVFC 5 pass) — cả 3 ASSERT PASS. tsc 0, vite build PASS 19,73 s, ghostBlend 15/15, previewEngine 25/25.
- Snapshot trong ring chứa đúng pixels nhãn (đường rVFC): **867/872 = 99,4% sạch** (pump pix gộp 495/499 = 99,2%; lệch −1 thật = 0; lệch +1 thật 0,6–0,9% do callback trễ ~17–20 ms) — xác nhận lại kết luận bác race capture của Z2 với n gấp ~6 lần.
- Residual giải thích bởi thành phần cửa sổ: dự đoán gStd theo cửa sổ THẬT (ghostPix + curPix) khớp ±5 ở **127/133 = 95,5%**, so với triple(P) nhãn chỉ 85/174 = 48,9%; 94,7% cửa sổ thật khác triple(P) (gap do capture thưa + frame hiện tại lệch ±1). Lệch curPix giàu hơn có ý nghĩa ở outlier (gộp Z2+A2: 41,5% vs 24,1%, Fisher một phía **p = 0,0031** — nâng kết luận "gợi ý" của Z2 lên có ý nghĩa thống kê).
- **Cơ chế MỚI, chỉ ở đường tick (fallback khi pump chết): snapshot đường tick bị gán sai nhãn hệ thống — chỉ 119/251 = 47,4% sạch** (+1 mod 5: 27,9%; ±2/±3 mod 5: 19,1%; −1 mod 5: 5,6%). Nhãn lấy từ `currentTime` đầu tick, pixels là frame hiển thị lúc vẽ sau đó. Đúng vào trường hợp Z2 mất dữ liệu (10/23 outlier). Đường tick cũng không bao giờ blend triple liên tiếp (n=0 cửa sổ liên tiếp ở run no-RVFC).
- Metric pha không vượt gStd (gộp 61% vs 63% cùng tập) — không đưa vào assert. Caveat: các run đều thưa (tải nền từ luồng đợt 99 khác) nên tỉ lệ outlier 46–61% không so được với Y2 dense 13,8%; cơ chế đường tick ở mức "phù hợp bằng chứng" (thiếu đo thời gian trong-tick); 6/133 ca cửa sổ thật không khớp là giới hạn gán mẫu↔tick.
- Batch: phase9-round99-a2-ghost.txt (2 entry: preview.tsx + LIMITS).

### A3 — Re-arm CANCELLED: PHÂN LOẠI MỚI ARM-HELD (nợ §4 mục 4)
- **CANCELLED hẹp = 0 trên 13 lượt cũ là ĐÚNG theo thiết kế, không phải thiếu lượt đo** — detector arm lúc đóng băng 300 ms thì drift mới ~0,30 s < ngưỡng 0,35 s, nên drift hầu như không bao giờ due ở đúng tick arm.
- **Phân loại rộng mới ARM-HELD (§6) đếm được 1 ca chặn seek thật / 18 lượt** — e1r tick 41 (relMs 11829): drift 0,133 ở tick arm (NOT-DUE cũ) nhưng watch giữ playhead 2 tick, drift phản-thực 0,406/0,825, không resync. Phân loại cũ bỏ sót ca này.
- CANCELLED hẹp đầu tiên trong lịch sử (f3 tick 32, relMs 8313) là artifact của probe — ct lùi 5,9→5,5 là pause-seek khi probe dừng, không tăng `resyncsV`. 1 ca suýt-đếm (f5 tick 55, relMs 12919): phản-thực due cả 2 tick (0,703/0,697) nhưng cửa sổ k+2 chạm lúc probe dừng — không đếm, ghi rõ nhiễm.
- Đuôi/tail chặn thành công (§4): chuỗi grace **BỊ CHẶN = 8, LỌT = 0**. **Arm-vì-bò lần đầu ngoài đời: 4 ca**, 27 tick-bò, 0 re-seek sau arm-vì-bò — fix Z3 hoạt động.
- Số gộp 18 lượt (13 cũ + 5 mới f1–f5): 15 re-arm — CANCELLED=1 (artifact), DELAYED=2, NOT-DUE=7, AMBIGUOUS=5; drift re-seek 14; stall ≥300 ms 50; trần 5000 ms 0 nhả.
- Không sửa production. Kiểm chứng: tsc 0, vite build PASS 6,86 s, hold 56/56, pacing 19/19, armHeld99a3 16/16. Nợ mới: f4 tail-expiry — luật tail "2 advance = resume ổn" bị burst +1,16 s lừa → drift re-seek bắn ngay sau khi grace tắt, seek kẹt 5,5 s+ (A3 chỉ ghi nợ, không sửa).
- Batch: phase9-round99-a3-rearm.txt (5 entry).

### A4 — Watchdog `paused`: ĐÃ ĐÓNG — GIẢ THUYẾT PIPELINE TỰ LẬT BỊ BÁC (nợ §4 mục 5)
- Phát hiện lỗ hổng bằng chứng Z4 (stub `play()` prototype không thấy lệnh qua wrapper instance của MediaPool), viết probe A4 (bọc đếm `play()` tầng instance + flip-event + GST_DEBUG `GST_STATES:5`), chạy 3 lượt WebKit tuần tự (r1 trigger không bắn → nới trigger theo gợi ý Z4 §4.3; r2/r3 bắn), đối chiếu GST log.
- Cơ chế lật `paused` là **app tự gọi `play()`**: `syncMedia` (preview.tsx:4869,4888) gọi `play()` mỗi tick khi element đang paused, qua wrapper instance `media.ts:487-495` (bind native trước khi probe stub → bypass stub prototype, giải thích vì sao Z4 đo `playBlocks=0`). **Giả thuyết "pipeline WebKitGTK/GStreamer tự lật" BỊ BÁC.**
- Ghép cặp 1:1 lặp lại: **r2 17/17 flip, r3 11/11 flip** — mỗi flip đúng 1 lệnh `play()` instance từ `syncMedia` (stack `syncMedia→tickInner→loop`, `pausedBefore=true`); 0 flip không có play-call; 0 lệnh qua stub prototype.
- GST đối chiếu: pipeline media (`blob-media-player-6`) chỉ nhận 1 `PLAYING` + 0 `PAUSED` (r2) / 1 + 1 (r3) trong cửa sổ freeze, so với 17+17 / 11+11 lệnh JS — pipeline không tự chuyển trạng thái. Cú nhảy ct 0,5→1,033 ở r2 là drift re-seek (`seeking=1`), không phải rò phát.
- Không sửa production (preview.tsx mtimeChanged=false ở r2/r3). Nợ còn lại duy nhất: vì sao chỉ 1–2/17 lệnh tới được GStreamer dạng `set_state` (cần đọc code WebKit, ngoài phạm vi probe page) + bài học phương pháp: probe sau stub `play()` phải kiểm tra own-property instance trước.
- Batch: phase9-round99-a4-watchdog.txt (2 entry).

### A5 — Blur parity: B-BAND n=96, STRIP GHOST WK LẦN ĐẦU (nợ §4 mục 6)
- 8 lượt probe tuần tự (7 có kết quả, 1 mất — r14 mất nhưng fix evaluate-timeout đã chứng minh: 3×20 s + 60 s, thoát có kiểm soát thay vì treo câm 5,5 phút như r11 đợt 98). Chỉ đo/chẩn đoán, không sửa production. Probe mới có fix evaluate-timeout + giữ strip pixels (ghostPix của A2, pump pix, chẩn đoán mislabel).
- **(a) B-band wk: n=61 → 96 (+35).** Vẫn không có khe bimodal (2-means chạm nhau 0,0022; pair 42% / dc 58% không đổi). ringSize=1 ⇒ pair-like **ĐỨNG (7/7)**. Phase 4 ⇒ dc-like **YẾU ĐI (13/16, từ 13/13)**.
- Strip ghost (mới, lần đầu trên wk): **25/39 ghost wk mislabel (64%)** vs chr 6/70 (9%), capture chr 4/107 (3,7%) — khớp chéo A2 (đường tick chỉ 47,4% sạch). Mislabel **KHÔNG tách pair/dc** (Fisher p=0,225). `ctFrameIdx != frameIdx` là tín hiệu nhiễu (27% vs 3,7% thật). Mô phỏng blend offline bị bác (không tái hiện bảng harmonic Y6, sai tới 0,31) — hướng cụt.
- **(c) D chr gộp 9/693 = 1,3%** (sàn ~1% đứng). 4 cap D mới r11 kiểu ghost-đơn-cũ-kỹ (gap 7/8/10/14, ghost content sạch 4/4 qua strip); **r7 vẫn mở** (không tái hiện dạng y hệt). Ca r15 c1 fi=8 gợi ý giả thuyết presented mislabel −1 (chưa chứng minh, curPix null).
- **(d) Blind wk:** r3 c1 1291 ms / c2 0 ms (trong dải Y5); r4 c1 3792 ms / c2 671 ms (ngoại lệ tải nặng; memo c2 gộp 19/21 ≈ 0). Kết luận Y5 vẫn đứng cho 90% lượt.
- Caveat: preview.tsx đổi md5 2 lần giữa lượt do luồng song song (41b05c8e → 848d21c0 → efce65dd); đã xác minh blend math không đổi (chỉ A2 stash strip đo lường + A6 clip-active check), các lượt ghi rõ build. state100 dropped=0 mọi lượt.
- Batch: phase9-round99-a5-blur.txt (3 entry).

### A6 — Zombie straggler tiền-seek: ĐÃ ĐÓNG (nợ §4 mục 7)
- Khảo sát tín hiệu trong `rvfcCallback` rồi cài check clip-active: pump ghi thêm cửa sổ timeline (`clipStart`/`clipDuration` từ `drawVideoClip`); callback nào bắn khi playhead trong store đã ra khỏi cửa sổ clip thì kill pump ngay (mirror mẫu zombie kill, hồi dead để phát lại được) + ghi event `skip-clip-inactive`. Kèm 2 hook test (`__vcut99a6DisableOwnerKill`, `__vcut99a6DisableClipActiveCheck`, mặc định tắt) để fault-injection. Marker "Đợt 99 A6" ×5 trong preview.tsx (build efce65dd); không đụng marker Z6 (×5) / A2 (×8).
- Số đo (probe99a6 mới, Chromium, config `scroll-mixed-alt` 6 clip — 3 biên blur→noblur/lượt; cửa sổ phân tích neo theo mốc biên quan sát được, sửa lỗi cửa sổ cố định của Z6):
  - Baseline (trước sửa): zombie Δ 0/0/0, 0 capture trong cửa sổ clip lẻ.
  - Đối chứng (kill draw-path TẮT + check TẮT): zombie Δ **+12/+5/+8 = +25**, 22 capture post-seek, `lastFrame` bị ghi đè 89→35/28/33 — fault-injection phơi đúng zombie.
  - Check (kill TẮT + check BẬT): zombie Δ **0/0/0**, `skip-clip-inactive` = **3** (1/biên: frameIdx 6, 84, **89** — bắt đúng 1 straggler tiền-seek), fb `clip-inactive`.
  - Final (cả 2 kill + check BẬT): zombie Δ 0/0/0, check không bắn (owner-kill bắn trước, đúng thiết kế), lastFrame 89/89/89.
- **Kết luận khảo sát: 0 capture tiền-seek rơi vào cửa sổ clip kế ở 9 biên đợt này + 4 biên Z6 = 0/13 biên** — "sàn 0–1" của Z6 là thận trọng thừa (event-loop: callback dispatch trước tick vượt biên thì chạy trước tick đó); khe duy nhất là tick vượt biên early-return, đúng khe check mới bịt. Phương án ước playhead theo wall-clock bị bác (vỡ hold R2/S2).
- Không hồi quy: pixel parity đứng (tâm dải A 0,436–0,444 / B 0,751–0,773 / C 0,997–1,004 / D 0,303–0,307); tsc 0; vite build PASS 37,36 s; previewEngine 25/25; Hold 56/56; Pacing 19/19; seek 21/21; test-preview-engine.sh 354 assertions pass.
- Caveat: độ trễ kill fbAt − b_k âm (−6…−169 ms) là lượng tử state100 thưa dưới tải (77–1200 mẫu/lượt), không phải kill sớm; lượt check chạy lúc load1 15,48 nhưng zombie Δ là đếm nên vẫn vững; check không bắn ở đường bình thường nên giá trị của nó chỉ mới chứng minh qua fault-injection — khe early-return ngoài đời chưa quan sát được.
- Batch: phase9-round99-a6-zombie.txt (3 entry: preview.tsx + probe + LIMITS).

### A7 — G1 evidence v10: CHÂN YÊN 30fps ĐẠT ĐỦ 3/3 TIÊU CHÍ CHẶT LẦN ĐẦU (nợ §4 mục 8)
- **E1 30fps ×8 lần thử** (17:40–18:05Z, boot 99338d31, không reboot trong cửa sổ): 7 verdict **7/7 PASS** + run2 abort harness ở slot 7 (Space lần 2, playing vẫn true — không verdict, loại khỏi pool, không reset chuỗi yên).
- **N10 60fps ×5** (18:06–18:14Z): **4/5 PASS**. Không sửa production; deint-fps-verdict 17/17, vite-diagnosis-regex 9/9.
- **Chân yên 30fps: n=21, median 0,940×, mean 0,915, CI 95% [0,852; 0,979], PASS 17/21 (81%)** — từ 14/18 (78%). Mốc 16/20 đạt ở run7; chuỗi PASS yên liên tiếp nay **15**. 3 mẫu yên mới: run1 0,83 (2 vòng, cả 2 yên), run7 1,02, run8 0,93 (sạch nhất, tỉ lệ 0,82–1,06).
- Pool 30fps **57/66 = 86%** (biên 5 FAIL); tải 30fps 39/44 = 89%; pool 60fps **44/47 = 94%**; chân yên 60fps **14/14 (100%)**, +4 mẫu mới.
- Caveat: N10 run1 **0,71× FAIL** — lần FAIL 60fps đầu tiên kể từ M1; M2 cũng FAIL (0,73×) nên G5/M2 đồng thuận, số lần bất đồng lịch sử vẫn là 2. Run7 yên có caveat slot-tải đầu (baseline mean 14,83 nhưng slot 0 chỉ 5,52 fps, load 12–18) — nếu loại run7 thì chân yên còn 16/20 = 80%, vẫn đủ mốc. M2 đồng thuận G5 **12/12 lần**. Pixel giống hệt lịch sử cả 12 lần (G2 0,5821; G7a 0,6903; G7b 0,0119; G8 MAD 1,5522; D1 0,3835). H9/C3 0 lỗi trang; 0 slot đóng băng; 0 EPERM trong 13 log. `preview.tsx` đổi 1 lần giữa cửa sổ (17:54:44Z, sibling A2/A6) nhưng pixel không đổi nên giữ cả 12 lần trong pool. A7 bắt được 1 lỗi trong script gộp của chính mình (run3 2 vòng bị đọc nhầm 0,72 thay vì gộp 1,03) và đã sửa trước khi viết LIMITS.
- Khuyến nghị: phương án A (đóng một phần) nay **đủ điều kiện ở cả 4 chân** — nhưng **A7 KHÔNG tự đóng G1**, chờ parent/user quyết (chờ cả kết luận A9 về metric G5/M2). Nợ mở: harness Space-toggle flaky dưới tải (run2 abort); quy tắc phân loại slot-tải-đầu trong lần yên (run7).
- Batch: phase9-round99-a7-g1-evidence10.txt (2 entry).

### A8 — EPERM probe #18 + khoảng mù #17: ĐÃ ĐÓNG (nợ §4 mục 9)
- Checklist probe v2 đúng 1 lần: status 17:40:06Z DEAD/STALE (age 10.904 s, last #17 14:38:22Z, boot 65bc5fb6, exit 1) → once 17:40:14Z **probe #18, boot 99338d31, ok=2 fail=0, exit 0** → status chạy lại ALIVE (n=18). Log v2: 43 → 46 dòng, đúng +3.
- **Khoảng mù #17 ĐÃ ĐÓNG (~182')**: 2 reboot đã xác nhận — **#21 15:24:27Z** (65bc5fb6 → 0b32ac3a, Z10 quan sát trực tiếp) + **#22 17:25:39Z chính xác từng giây** (0b32ac3a → 99338d31). Xác minh số thứ tự #22 mà parent ghi lúc spawn ("~17:26Z, tức reboot #22") là ĐÚNG. Dòng `boot changed` lại GỘP (nuốt boot 0b32ac3a) sau 1 lần đứt ở mù #16. Chu kỳ: 22 lần / ~45h07' ≈ 2h03'/lần; reboot tiếp theo dự kiến ~19:29Z. Khoảng trống không-bản-ghi ~117' (15:37:40Z → ~17:35Z) — dài nhất từng ghi ở cuối mù; reboot thứ ba không loại trừ tuyệt đối nhưng không có bằng chứng.
- **Sóng EPERM: không tìm thấy bằng chứng thật** — 0 "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật; 2 dòng "đã tắt" của Z10 O8 (15:30:43Z, 15:31:36Z) là dương tính giả đã biết; Z9: 0 dấu EPERM trong 11 lần đo. Sóng gần nhất vẫn ~11:55–12:11Z (R7), ~29h29' trước probe #18. Kết luận "không thấy", không phải "không có" — EPERM KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync** (snapshot 17:42:32–17:42:57Z): chuẩn mới **356 dòng / 115 file** (source 183, docs 173); R7b 381; bản copy 25 (giống hệt Z7); đối chiếu chéo 356+25=381, **chênh 0 — lần thứ sáu liên tiếp**. +23 vs Z7 đã giải thích đủ bằng diff hit list (docs +12, probe98z4/z6/z3 +11 — toàn ghi SCRATCH/vite cfg tạm/file probe sóng). Async writeFile production ngoài helper: **0**. Không còn đường ghi production nào chưa nối helper.
- RAM 6 mẫu: 528 / 1302 / 1241 / 1229 / 1999 / 1324 MB (max 33% ngưỡng guard 6 GB) — birefnet KHÔNG chạy. TTS 39 không đụng. Không tự tạo cron 10 phút, không start loop nền.
- Batch: phase9-round99-a8-eperm.txt (1 entry).

### A9 — Quyết định metric G1: KHUYẾN NGHỊ GIỮ G5 RỒI CHUYỂN M2
- Tính lại toàn bộ 69 lần còn fpsSlots (R6→Z9) bằng script `hidden_files/round99-a9/analyze-g5-vs-m2.py` — M2 tính lại khớp 69/69 lần đã công bố; test offline `deint-fps-verdict` 17/17 PASS. Không chạy Chromium (RAM khả dụng ~548–688 MB). Không đo mới, không sửa production.
- Đồng thuận G5/M2: **63/69 (91,3%)**; 6 ca bất đồng, **cả 6 đều G5 PASS → M2 FAIL, 0 ca ngược**. 5/6 ca dưới tải; chân yên đồng thuận 24/25 (96%) vs máy tải 39/44 (88,6%). |G5−M2| trung bình: yên 0,058 — tải 0,112; Pearson với trải rộng tỉ lệ +0,823.
- Quy luật biên G5: G5 PASS ≥ 1,00 không bao giờ lật (0/36); [0,75; 0,90) lật 4/10; [0,90; 1,00) lật 2/19. Cả 6 ca lật đều có ≥3/5 tỉ lệ slot dưới ngưỡng, do 1–2 slot cao kéo mean lên.
- Bước làm M2 chặt hơn là **median, không phải bước loại mẫu số đóng băng**: chỉ 4/69 lần có tỉ lệ bị loại; M2 vs median-không-loại khác verdict 0/58; mean-chỉ-loại khác G5 0/58. Đính chính số X6: M2mean E1 là 22/26 (85%), không phải 21/26.
- Chân yên 30fps dưới M2: tập con tính lại được 12/14 (86%) nhưng 4 lần yên cũ mất fpsSlots (I5-1, J3-1, L3-1/2) có 3/4 FAIL dưới G5 → khoảng trung thực **12–13/18 (67–72%)**, và khung 16/20 trở nên **không đạt được** dù 2 lần tới đều PASS (tối đa 15/20 = 75%).
- Ngưỡng giữ 0,75×: 0,70 → 4 ca bất đồng gồm 1 ca FAIL→PASS duy nhất; 0,80 → 6 ca.
- **Khuyến nghị: GIỮ G5 đến khi khung 16/20 khép (còn thiếu 2 lần PASS yên liên tiếp), rồi chuyển sang M2 làm metric chính**; phương án đổi ngay kèm 6 điều kiện (định nghĩa lại khung 12/14 → cần 4 PASS trong 6 lần yên tới; xử lý 4 lần mất dữ liệu bằng cờ; định nghĩa M2 cho lần gộp 2 vòng = median 10 tỉ lệ). G1 vẫn MỞ, chờ parent/user quyết.
- Batch: phase9-round99-a9-g1-metric.txt (1 entry).

### A10 — Kiểm chứng độc lập: 9/9 VỀ ĐỦ, CÂY GỘP TOÀN XANH
- Poll đĩa: 17:40Z 0/9 → 17:51Z 2/9 (A8, A9) → 18:11Z 5/9 (A1, A4, A6) → 18:21Z 6/9 (A2) → **18:31Z 9/9 ALL LANDED**, poller cũ (pid 8156) dừng đúng lúc. Không luồng nào thiếu; bản chạy lại dùng lại poller + log cũ, không khởi poller thứ hai. Không reboot trong đợt lẫn lúc verify (boot 99338d31 suốt; reboot #22 17:25:39Z trước đợt; tiếp theo dự kiến ~19:29Z).
- Cây đóng băng 18:33Z, `preview.tsx` `efce65dd…` (A2 ×8 + A6 ×5 markers đều đủ; Z2/Z3/Z6 cũ nguyên vẹn; file duy nhất bị 2 luồng sửa, không xung đột nội dung):
  - **tsc web 0, tsc desktop 0; vite build PASS 7,27 s**
  - **24/24 mục suite offline exit 0:** Hold 56/56, Pacing 19/19, previewEngine 18+25, seek 21/21, seekSkip 9/9, previewLoop 20/20, ghostBlend 15/15, css60/61 60/60, P7 8/8 (esbuild), orphans 17/17, r6 dict 2767/2767, U4 141/141, media 3/3, retry96X3 7/7, watchdog96X3 9/9, deint-verdict 17/0, vite-regex 9/0, xvfb-lock PASS, test-preview-engine.sh **354 assertions pass** (chạy đúng qua script)
  - **O8 21/21 cả 2 engine** (18:37–18:39Z): Chromium S5 Δx=0,112 / S7 0,113; WebKit S5 Δx=0,194 / S7 0,197 — khớp đúng từng chữ với lịch sử
- Đối chiếu headline 9/9 — KHỚP (4 đính chính nhỏ, không đổi kết luận): **A2** "96,6%" là số run B (gộp 94,7%); **A4** đếm set_state toàn lượt lệch ±1 (r2 PLAYING 5→4, r3 PAUSED 5→6; riêng cửa sổ freeze khớp chính xác); **A5** "7/8 lượt" thực tế 8/9 lượt chạy; **A7** run2 abort do harness Space-toggle (không phải FAIL G1).
- Batch: phase9-round99-a10-verify.txt (1 entry).

## 2. Ghi chú gộp parent

- **A10 lần chạy đầu kết thúc sớm không kết quả cuối** (2 exec lỗi) nhưng poller nền của nó vẫn sống (pid 8156); parent spawn lại A10 với chỉ đạo dùng lại poller + log, không khởi trùng — bản chạy lại hoàn thành đầy đủ, poller dừng đúng lúc 18:31Z ALL LANDED.
- **Đếm lại trực tiếp từ đĩa (parent, sau A10): đợt 67–99: 331 batch / 2363 entry / 1425 file duy nhất** — khớp đúng số A10. Đợt 99 đóng góp 10 file / 25 entry.
- **G1 — parent chưa đóng:** A7: chân yên 30fps đạt đủ 3/3 tiêu chí chặt lần đầu (17/21 = 81%, mốc 16/20 đạt, chuỗi 15), phương án A đủ điều kiện ở cả 4 chân; A9: khuyến nghị giữ G5 đến khi khung 16/20 khép rồi chuyển M2 (dưới M2, khung 16/20 không đạt được — tối đa 15/20). Mâu thuẫn cần user quyết: khung 16/20 đã khép dưới G5 (A7) nhưng không khép được dưới M2 (A9) — quyết định đóng G1 và chọn metric thuộc về user, không tự đóng trong vòng lặp.
- **A4 đính chính kết luận Z4:** "pipeline tự lật `paused`" bị bác — app tự `play()` qua wrapper instance. Đây là đính chính quan trọng của LIMITS gộp đợt 98 §1 (Z4) và gap analysis §27.
- **A6 + A2 cùng sửa preview.tsx:** không xung đột nội dung; md5 cuối efce65dd; markers A2 ×8, A6 ×5, Z2/Z3/Z6 cũ nguyên vẹn (A10 xác minh).
- **Nợ mới từ A3 (f4 tail-expiry):** luật tail "2 advance = resume ổn" bị burst +1,16 s lừa → drift re-seek bắn ngay sau khi grace tắt, seek kẹt 5,5 s+ — nợ cho đợt 100.

## 3. Kiểm chứng parent (cây đã gộp)

- Tin A10 (độc lập, 24/24 mục suite + O8 21/21 cả 2 engine) + đếm lại từ đĩa của parent (331/2363/1425 khớp A10). Không chạy lại suite ở parent (A10 vừa chạy xong trên cùng cây efce65dd, boot không đổi).

## 4. Nợ mở cho đợt 100

1. **G1 đóng hay chưa — user quyết** (A7: chân yên 30fps 17/21 = 81%, mốc 16/20 đạt, chuỗi 15, phương án A đủ điều kiện 4 chân; A9: giữ G5 đến khi khung khép rồi chuyển M2 — nhưng dưới M2 khung 16/20 không đạt được, tối đa 15/20; cần quyết metric G5 hay M2 trước khi đóng).
2. 2 MiB — điểm nối chính xác (webkitwebsrc.create / handoff typefind/adapter) vẫn chưa chứng minh được; chỉ 1–2/17 lệnh `play()` tới được GStreamer dạng `set_state` (nợ A4 — cần đọc code WebKit).
3. Ghost residual — cơ chế đường tick (nhãn lấy từ `currentTime` đầu tick, pixels là frame hiển thị lúc vẽ sau đó) ở mức "phù hợp bằng chứng", thiếu đo thời gian trong-tick; 6/133 ca cửa sổ thật không khớp.
4. Re-arm — nợ mới f4 tail-expiry (burst +1,16 s lừa luật tail, seek kẹt 5,5 s+); trần 5000 ms vẫn 0 nhả quan sát; arm-vì-bò cần thêm lượt đo.
5. Blur parity — B-band wk n=96 vẫn không có khe bimodal; D fix-3 sàn ~1% (9/693); cap D r7 vẫn mở; presented mislabel −1 (r15 c1 fi=8) chưa chứng minh.
6. Zombie pump — khe early-return ngoài đời chưa quan sát được (check A6 chỉ chứng minh qua fault-injection); độ trễ kill âm do lượng tử state100 thưa.
7. EPERM: probe #19 + khoảng mù #18 (bắt đầu 17:40:14Z); cron riêng 10 phút vẫn chờ user quyết; giờ từng giây reboot #16 vẫn chưa chốt.
8. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định parent đợt 92) — vẫn 0 lần chạy thành công (RAM max mẫu đợt này 1999 MB < ngưỡng 6 GB).
9. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
10. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
11. Harness — Space-toggle flaky dưới tải (A7 run2 abort); quy tắc phân loại slot-tải-đầu trong lần yên (A7 run7).
12. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 99: 10 luồng, **25 entry / 10 file** (A1 5, A2 2, A3 5, A4 2, A5 3, A6 3, A7 2, A8 1, A9 1, A10 1).
- Closing đợt 99: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §28).
- **Tổng chờ push sau đợt 99: 332 batch / 2365 entry / 1426 file duy nhất** (đợt 67–98 + Z10: 321/2338/1402; đợt 99: 25/10; closing 2/2 — gap analysis đã stage từ trước nên +1 file duy nhất là LIMITS gộp mới. Đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.

# Phase 9 đợt 96 — GỘP (LIMITS)

**Lượt cron 15:35 +07 12/11/2026. Chủ đề: đóng nợ LIMITS gộp đợt 95 §4 (9 mục). 9 luồng X1–X9, tất cả đều hạ cánh (X1/X4/X5/X6/X9 qua luồng nối tiếp X1b/X4b/X5b/X6b/X9b sau reboot #18). KHÔNG push.**
**Repo:** `~/workspace/repo-1` (cây làm việc). HEAD vẫn 5f548ef8. Dict i18n 2767 key (không đổi).
**Bối cảnh:** VM reboot #17 ~08:01Z (boot a3a13d5a) trước lượt; **reboot #18 09:24:17Z chính xác từng giây (boot 04b83831)** giữa lượt — giết X1/X9 sạch, còn X4/X5/X6 resume ngắn sau reboot rồi mới dừng (đính chính §2.3). RAM khả dụng ~0,5–2,6 GB suốt lượt (mẫu thấp nhất từng ghi 507 MB).

## 1. Kết quả từng luồng

### X1/X1b — blob 2 MiB — ĐIỀU TRA XONG, GIẢ THUYẾT VẪN MỞ
- X1 gốc (36 case, probe GST nặng): blob strict 17/18, loose 18/18, prog 18/18 — nhưng **bogus 0/36 log**, hiện tượng không tái hiện; đối chứng c1 (< 2 MiB) vô hiệu. Fail duy nhất Lc2-run5 là flow-error sau parse đúng (80 frame nhờ retry W2).
- Phát hiện mới từ log GST nặng: nguồn blob là `webkitwebsrc` (lần đầu "blob:" xuất hiện trong GST log); lần đọc đầu = toàn bộ file 1 chunk, các lần sau range [offset, EOF]; seek EOF−32/EOF−128 là routine (có ở cả c1); `failed to find fragment defaults` là nhiễu nền (36/36 log kể cả prog) — đính chính cách đọc của W1; pipeline blob thứ nhất có thể fail thầm rồi pipeline thứ hai cứu.
- X1b đo lại bằng probe W1 nhẹ (24 case): **bogus TÁI HIỆN 8/12 log blob** (c2 541230788 ×5, c8 2991868683 ×3, đúng giá trị W1). Strict 3/12, loose 11/12 (retry W2+X3 cứu 8/9 fail error-event). Fail thật duy nhất Lc2-run1 stall-timeout 0 frame (cả 2 pipeline bogus trong 80 ms, không error event nên không fallback/retry được). Fail⇒bogus gộp lịch sử **39/42 = 93%**.
- Verdict: X1 0/36 là hiệu ứng thiết bị đo/cửa sổ, không phải bogus biến mất. Bundle bị loại trừ. Cơ chế "pull bắt đầu ở 2 MiB" vẫn mở — ứng viên còn lại handoff push→pull; test tách biến tiếp theo: probe nặng X1 trong cửa sổ yên. Bài học: đo GST nặng làm biến mất chính hiện tượng cần đo — đo tỉ lệ bogus phải dùng probe nhẹ. Không sửa production.
- Chi tiết: `docs/PHASE9_ROUND96_X1_BLOB_2MIB_LIMITS.md`. Batch: 5 entry.

### X2 — sửa blend sai tập ghost — ĐẠT Ở MỨC MEDIAN
- Sửa `preview.tsx` (16 marker "Đợt 96 X2"): ghost chỉ lấy snapshot cũ hơn frame đang trình chiếu P (tmix {K-2,K-1,K}); thêm `presentedFrameIndex()`, `lastPresentedFrameIdx`/`lastExpectedDisplayTime` vào pump state, `lastDrawnPresentedFrame`/`lastDrawnRingSize`/`lastDrawnSkippedLatest` vào debug state; ring capacity frames−1 → frames (lượt đo 1 bắt được thiếu 1 snapshot → pair ~79).
- Đo sau sửa (cùng clip/probe như W4): median gStd **37,5** mọi case B–E cả 2 lượt assert PASS (lần 2: B 37,6/37,5/37,5; lần 3: B/C/D 37,5–37,6; E t=1 lật 83,9 do mẫu nhỏ nG=12 dưới tải cao). Triple 74–78%. Lỗi gốc (blend {K-1,K,K}, blur yếu ~2,25×) sửa xong ở trường hợp pump bắt kịp (~73–78% tick).
- Cụm double-count 84 còn ~19–25% mẫu: giả thuyết estimate dẫn trước gây không-skip BỊ BÁC (84-mẫu skippedLatest=1 ~90%, cùng nhãn đầy đủ với 37); cơ chế còn lại: capture gán nhầm nhãn khi callback trễ mà currentTime chạy sau trình chiếu (chữ ký U1 §7) — cần pump event log đợt sau; X5 §1.3 bổ sung giải thích (presented lệch). Tiêu chí W4 §6.1 đạt 1,5/2.
- Kiểm chứng: tsc 0, vite build PASS (8,72 s), ghostBlend 15/15, previewEngine 25/25, seek 21/21, playheadHold90R2 44/44, playheadPacing54K9 19/19, O8 21/21 cả 2 engine.
- Chi tiết: `docs/PHASE9_ROUND96_X2_GHOST_FIX_LIMITS.md`. Batch: 3 entry.

### X3 — retry-play mở rộng — ĐÃ SỬA + ĐÃ ĐO, CẢ 2 FIX ĐỀU CÓ TÁC DỤNG
- Sửa `apps/web/src/media.ts` (marker "Đợt 96 X3"): retry cho đường blob-lỗi không proxy + watchdog stall lặng (videoFor tick, 8 s không tiến triển → fallback http + retry-play).
- Wall 20 s (128 case): MATRIX A 21/24 loose+strict; **7/7 error-event được cứu** (retry95W2 bắn 7/7, canplay tới sau error 0,4–1,0 s). Error đến muộn >3 s KHÔNG tái hiện trực tiếp (max đo được 2,16 s; câu "errT lớn nhất 1,19 s" trong LIMITS X3 §1 chỉ đúng subset MATRIX-A — đính chính X9b).
- Blob-lỗi không proxy: single-shot 2/8 → **6/8**, 3/3 error-event được retry96X3 cứu. Stall lặng: chữ ký blob kẹt pre-metadata (rs=0, ct=0, không error, 1 event `stalled` rồi im; GST log có `bogus size` + `no playable streams` như case error-event — cùng gốc qtdemux, error event bị nuốt). Watchdog cứu **1 ca thật ngoài đời** (Lc6-blobA20T-run6, 269 frame, ct 11,209); TICK 12/12; 0 lần bắn oan trong 12 run sau-watchdog.
- "Pass marginal" (1–6 frame, ct < 1 s): **0 case ở wall 20 s** (128 case) — nguyên nhân là cửa sổ đo, không phải decoder.
- Kiểm chứng: tsc 0, vite build PASS, media.retryPlay96X3 7/7, media.stallWatchdog96X3 9/9, seek 21/21, O8 21/21 cả 2 engine. WebKit hỏng sau reboot #18 (thiếu libevent) — X3 đã sửa bằng libevent.deb + webkit install-dependencies.sh.
- Chi tiết: `docs/PHASE9_ROUND96_X3_RETRY_PLAY_EXT_LIMITS.md`. Batch: 6 entry.

### X4/X4b — trần stall re-arm — NỢ VẪN MỞ, KẸP DT BỊ BÁC
- X4 gốc đo xong 5 lượt tiền-sửa (b1/b2/b3/b4c/b5, build hậu-fix X2) và kịp implement fix + 5 test mới (09:22–09:23Z) trước reboot #18. X4b chạy lại analyzer trên 5 JSON gốc (khớp), đo thêm 2 lượt hậu-fix c1/c2.
- Ân hạn 1 tick (W5): **0 lần hủy / 3 lần kích hoạt đủ điều kiện** (p3b đợt 95 + b1/b2 đợt 96, cả 3 DELAYED — seek bắn tick sau arm, element resume 1 tick sau đó). Tải vừa mục tiêu (300–500 ms) chỉ có đúng 1 lượt (b5, gap mean 312 ms, 0 re-arm).
- **Kẹp dt playhead cố định 0,35 s/tick: BỊ BÁC bằng đo** — 28/110 tick element tăng lành vượt 0,35 (tiền-sửa 23/56 = 41%; c1 5/20, c2 0/34). Slew chưa làm, chưa đo.
- Chu kỳ stall dài → nhảy hại → drift re-seek → seek kẹt: xác nhận lại (b5: seek kẹt 5,08 s; analyzer X4 bỏ sót ca biên Δct hơn đúng 1 frame 0,0001 s — X4b phát hiện bằng đọc tay trace).
- **Trần 5000 ms: 0 ứng viên / 7 lượt, 0 lần nhả ngoài đời.** Hạ tầng đo trần nay đã có (hook `__vcutResumeWatch96X4` + `watchCeil`).
- Fix X4 (`preview.tsx`, marker "Đợt 96 X4" ×5): ân hạn drift re-seek suốt thời gian watch còn sống; hậu-fix 0 CANCELLED — nợ vẫn mở. Lỗ hổng còn lại: stall mới sau khi watch cũ hết vẫn đi đường cũ (c1).
- Kiểm chứng: tsc web 0, vite build PASS (6,37 s), playheadPacing54K9 19/19, playheadHold90R2 44/44, seek 21/21, seekSkipRender86N3 9/9, previewLoop50F2 20/20; O8 chạy lại bởi X9b 21/21 cả 2 engine.
- Chi tiết: `docs/PHASE9_ROUND96_X4_REARM_CEILING_LIMITS.md`. Batch: 8 entry.

### X5/X5b — WebKit blur parity — D ĐÃ ĐỊNH DANH, TỰ HỒI MEMO QUYẾT KHÔNG TRIỂN KHAI
- Hoàn thiện phân tích 5 lượt X5 (build fix-1 X2) + 2 lượt bổ sung X5b (build fix-3 X2+X4, yên, load ~1,9, 0 pageErr cả 7 lượt). Không sửa production.
- **Cụm gStdRatio D (0,305–0,307, sd 0,001, n=42 → đính chính X9b: đúng là n=45, "38+4+3") = pair cách-2 {K-2,K}** — mô hình sóng vuông harmonic (1/h²) khớp A/B/D trong ±0,006; triple {K-4,K-2,K} (0,327–0,330) bị bác. A 0,440 / C 1,000 không đổi sau fix (Δ chr−wk −0,002). B là hỗn hợp pair/double-count. Tần suất D: fix-1 13% → fix-3 1% (chỉ còn đầu clip khi ring chưa đủ 3); fix-3 A chiếm 68% (160/234) — fix capacity của X2 có tác dụng đúng dự kiến. X9b tính lại độc lập mô hình harmonic: pair 0,743 khớp, double-count 0,776 khớp, pair cách-2 0,313 (≈ đo 0,305–0,307). DFT/pha trên cap 96×54 thất bại (moiré) — đã ghi.
- Mô hình cửa sổ mù đúng 3/4 cửa sổ wk không-memo. Phát hiện mới: wk-blur-r5 c1 MISS Δ −1019 ms — **element đóng băng ở ph=3,033 ~1,6 s chặn điều kiện frame-advance của watchdog** nên pump không chết, tick không tiếp quản (nợ mở: kill theo thời gian cả khi frame không tiến). Memo clip c2 blind thật ~0,4–0,5 s (không phải ~0,1 s như W3). Đối chứng chr: blind 25–494 ms.
- Exp A r1 + A2 → **QUYẾT ĐỊNH: KHÔNG triển khai tự hồi memo** (0 lần arm oan cả hai thí nghiệm; r1: 2 kill/0 arm; A2: 1 kill/0 arm; hồi phục tự động theo clip). Phát hiện phụ: **zombie pump** — pump clip cũ capture ~40 frame clip kế vào ring cũ tới ngưỡng stale 1500 ms (chỉ phồng thống kê theo clip, không ảnh hưởng pixel).
- Chi tiết: `docs/PHASE9_ROUND96_X5_WEBKIT_BLUR_LIMITS.md`. Batch: 3 entry.

### X6/X6b — G1 evidence vòng 8 — XONG, G1 VẪN MỞ (quyết thuộc user)
- Đo mới 13 lần (08:42–09:14Z, boot a3a13d5a, không reboot trong cửa sổ; RAM 1040–2612 MB). X6b xác minh LIMITS nguyên vẹn §1–§8 + stage batch + kiểm lại fault-injection.
- **Chân yên 30fps — bước tiến lớn nhất vòng này: 6 mẫu yên mới, cả 6 đều PASS** (1,02 / 0,97 / 0,84 / 1,00 / 1,23 / 0,99) → chân yên nay **n=14: median 0,955×, PASS 10/14 (71%)** — đạt 2/3 tiêu chí chặt (median ≥ 0,75 ✓, CI cận dưới 0,803 ≥ 0,75 ✓, PASS 71% < 80% ✗). Mục tiêu còn lại: **6 lần PASS yên liên tiếp nữa** (16/20 = 80%). Lần đầu tiên kể từ V5 lấy được mẫu yên (W6: 0/7), nhờ đo E1 ngay đầu lượt.
- Pool 60fps **n=37, median 0,980, PASS 35/37 (95%)**; chân yên 60fps n=10, 10/10 PASS. Pool 30fps **n=53, median 0,990, PASS 44/53 (83%)**, biên 2 FAIL; cửa sổ trượt mới nhất PASS 5/5.
- Metric M2 (median, `g5FrozenSafeFromReport`) đã cài song song với G5 + 5 test mới (17/17); **G5 KHÔNG đổi** — M2 chưa thay G5, parent quyết metric chuẩn ở đợt sau. Fix timeout fetch up-loop E1 (`AbortSignal.timeout(2000)`) — X6b kiểm lại bằng fault-injection: E1 exit 2 sau đúng 15 s, chẩn đoán "cổng bị chiếm" đúng. Hai fetch không-timeout còn lại trong E1 (media probe, vòng CDP /json/list) chưa sửa.
- Kiểm chứng: deint-fps-verdict 17/17, vite-diagnosis-regex 9/9; pixel D1 0,3835 giống hệt lịch sử ×5; không sửa production nên không chạy tsc/build (tiền lệ U6/V5/W6).
- **Khuyến nghị: G1 VẪN MỞ.** Chân yên 30fps mới đạt 2/3 tiêu chí; pool 30fps 83% biên 2.
- Chi tiết: `docs/PHASE9_ROUND96_X6_G1_EVIDENCE8_LIMITS.md`. Batch: 5 entry.

### X7 — EPERM probe #15 + quét writeFileSync — XONG
- Checklist P8 §2.3 đúng 1 lần: `status` trước **DEAD/STALE** (age 10.884 s, last #14 05:39:27Z, boot 06a92916); `once` = **probe #15, boot=a3a13d5a, ok=2 fail=0**, exit 0; `status` sau ALIVE (age 0 s, n=15). Boot xác minh độc lập trước `once` (`who -b` Nov 12 08:01, `uptime -s` 08:01:15Z) — khớp parent.
- **Khoảng mù #14 (05:39:27Z → 08:40:51Z, ~181') chứa 2 reboot:** #16 ~07:25–07:28Z (boot adcef40a, kẹp mtime 07:26:03 → 07:34:14Z) và **#17 08:01:15Z chính xác từng giây**. Dòng `boot changed` của probe lại gộp (bỏ qua adcef40a) — lần thứ 2 liên tiếp; boot trong LIMITS lấy từ `who -b` riêng. Khoảng trống không-bản-ghi ~50' (07:50:48 → 08:40:30Z). Không bằng chứng sóng EPERM trong bản ghi còn lại; sóng gần nhất vẫn ~11:55–12:11Z (R7), ~20h29' trước probe #15. **EPERM KHÔNG tuyên bố hết.** Chu kỳ reboot: 17 lần / ~35h43' (~2h06'/lần).
- Quét writeFileSync (snapshot 08:41:34–08:41:59Z): chuẩn mới **269 dòng / 94 file**; R7b: **294 dòng**; đối chiếu chéo 269+25=294, **khớp tuyệt đối** (lần thứ 3 liên tiếp). Async `fs.writeFile` production ngoài helper: **0**. Không còn đường ghi production nào chưa nối helper.
- RAM / birefnet: MemAvailable **551 / 507 / 537 MB** (+869 MB); mẫu **507 MB là thấp nhất từng ghi** (cũ 695 MB). **Birefnet KHÔNG chạy** (vẫn 0 lần thành công; u2net là fallback chính thức). Cron 10 phút KHÔNG tự tạo — vẫn chờ user quyết.
- Chi tiết: `docs/PHASE9_ROUND96_X7_EPERM_PROBE_LIMITS.md`. Batch: 1 entry.

### X8 — sửa 5 nợ harness — XONG (1 mục không kết luận được)
1. **thresholdNoiseLimited — CHỨNG MINH KHÔNG GẶP ĐƯỢC.** Chuỗi code: tick = store playhead (cố định lúc pause) → seed noise/glitch + shake đều là hàm của localT, blend chỉ khi playing, decode xác định — noise luôn 0 trong điều kiện đo được; rawThreshold 0,0001, false.
2. **GST log doErr/doDbg mang tiền tố matrix — XONG.** Log có prefix 360.116 B / 408.653 B.
3. **Thống nhất runner media.* — XONG.** Mới `apps/web/scripts/run-media-tests.mjs` (esbuild ESM bundle); log X8: blobPrefetch **25**, captureThumb 2, retryPlay95W2 **7** (tổng 34) — **đính chính X9b: bảng LIMITS X8 §3 ghi 26/2/8 (tổng 36) là SAI, log đúng.** File mới header ghi "đợt 96, luồng X8" nhưng **không chứa literal "Đợt 96 X8"** (grep 0) dù LIMITS nói marker có ở mọi chỗ đổi — lỗi chính xác doc nhỏ.
4. **Register-first dưới tải nặng có kiểm soát + baseline sạch spec C — CHƯA KẾT LUẬN ĐƯỢC.** Đo được nhưng nhiễu tải lấn át (load lấn át); A/B không kết luận.
5. **4 case MATRIX-r1 mất — KHÔNG KHÔI PHỤC ĐƯỢC VÀO FILE** (đã xác minh trong analysis-cases.json).
- Kiểm chứng: tsc 0, seek 21/21, Xvfb lock 8/8, O8 headed 21/21; O8 webkit lúc đó BLOCKED (thiếu libavif.so.16 sau reboot — X3 sửa sau).
- Lưu ý va chạm: X8 ghi sai tác giả edit preview.tsx 09:28:20Z (là fix capacity của X2, xem §2.2); X8 kill vite 5173 pid 1983 cuối lượt của nó (~09:35–09:40Z, xem §2.1).
- Chi tiết: `docs/PHASE9_ROUND96_X8_HARNESS_LIMITS.md`. Batch: 7 entry.

### X9/X9b — kiểm chứng độc lập — XONG, TOÀN XANH
- X9 gốc poll đĩa 9 lần (08:41–09:21Z) rồi chết theo reboot #18; X9b poll tiếp, **poll 6 lúc 10:35:47Z all-landed=1 — cả 8 luồng X1–X8 đã về**, không luồng nào mất; X5b về cuối (10:35:11Z).
- Chạy lại trên cây gộp: tsc web **0**, tsc desktop **0**, vite build **PASS** (6,15 s — chạy đúng từ `apps/web`; exit=1 trong script verify là lỗi cách chạy từ repo root, không phải lỗi build); playheadHold90R2 **44/44**; playheadPacing54K9 **19/19**; previewEngine **25**; seek **21/21**; seekSkipRender86N3 **9/9**; previewLoop50F2 **20/20**; css60 **60/60**; css61 **60/60**; Audit P7 **8/8** (qua esbuild; strip-types exit 1 do import không đuôi `./nestedPreview` — lỗi runner đã biết); orphans **17/17**; r6-i18n-check **PASS** (vi=en=2767 key); U4 fail-fast **141/141**; media blobPrefetch 25 / captureThumb 2 / retryPlay95W2 7; retryPlay96X3 **7/7**; stallWatchdog96X3 **9/9**; deint-fps-verdict **17/17**; vite-diagnosis-regex **9/9**; Xvfb lock test PASS; **O8 21/21 cả 2 engine** (Chromium Δx=0,112/0,113; WebKit Δx=0,194/0,197 — khớp đúng từng chữ với O8 của X2/X3).
- Đối chiếu số headline: KHỚP hết (chi tiết §2 X9b), trừ 4 lỗi doc nhỏ đã đính chính ở §1 từng luồng (X1 lặp bảng §6 sau §9; X3 "errT max 1,19 s" chỉ đúng subset; X5 n=42 → 45; X8 §3 bảng 26/2/8 sai).
- Chi tiết: `docs/PHASE9_ROUND96_X9_VERIFY_LIMITS.md`. Batch: 1 entry.

## 2. Gộp parent

- **Không xung đột file chung về nội dung.** `preview.tsx`: X2 (marker "Đợt 96 X2" ×16, vùng blend/ghost) + X4 (marker "Đợt 96 X4" ×5, vùng drift/re-seek) xen kẽ sạch, mtime cuối 09:41:00Z; `media.ts`: chỉ X3 sửa (marker "Đợt 96 X3" ×11). X5 không sửa production. Marker đợt 95 còn nguyên ("Đợt 95 W2" ×3, "Đợt 95 W5" ×5).
- **Đính chính 1 — vite 5173 pid 1983 chết: parent SAI, X2 đúng.** Log vòng lặp ghi reboot #18 giết vite 1983 trước lượt đo 3 của X2. Bằng chứng X9b: vite 1983 start 09:26Z (**sau** reboot 09:24:17Z), phục vụ lượt 2 của X2 (09:32–09:35Z) và A/B rep3 của X8; log X8: "pid 8148 (chết theo reboot) → pid 1983 sau reboot → đã kill cuối lượt". Vậy **X8 kill 1983 cuối lượt của nó (~09:35–09:40Z)**; reboot #18 giết vite **8148**. Câu "chết không rõ lý do, không reboot mới" của X2 là trung thực tại thời điểm đó.
- **Đính chính 2 — edit preview.tsx 09:28:20Z là fix capacity của X2, không phải X4** (X8 ghi sai tác giả). X2 LIMITS §0 (epoch 1794475700) + md X2; fix X4 là 09:22–09:23Z; X4b §6.3 đồng ý.
- **Đính chính 3 — reboot #18 "giết" X1/X4/X5/X6/X9 là không chính xác với X4/X5/X6.** Bằng chứng: LIMITS X6 xong 09:24:40Z (23 s sau boot mới); file probe X5 mtime 09:24:34Z; X4 sửa preview.tsx 09:28:20Z (sau reboot); file probe X3 mtime 09:26:56Z. Session X4/X5/X6 resume ngắn sau reboot rồi mới dừng ở các thời điểm khác nhau; X1 (dấu vết cuối 09:15Z) và X9 (poll cuối 09:21:27Z) không có hoạt động sau reboot.
- **Va chạm đo giữa luồng (đã ghi, bài học lặp lại):** X2 sửa preview.tsx 08:58:45Z giữa lượt đo của X5 (mọi lượt X5 đều sau fix, md5 fd588ca0 — không nhiễm); Xvfb :197 chết ~09:09Z, kẻ giết KHÔNG xác định được (restart X5 dùng :193, không phải :197). Lượt 1–2 của X6 chạy code cũ, lượt 3–5 code mới — không ảnh hưởng số deint (D1 MAD 0,3835 giống hệt 5/5).
- **Kiểm chứng parent:** dựa vào X9b (tsc web+desktop 0, build PASS, toàn bộ test + O8 21/21 cả 2 engine trên cây gộp); parent tự kiểm: read-back 9 batch đợt 96 (39/39 entry, file nào cũng tồn tại trên đĩa), 0 binary, 0 workflow; đếm lại tổng từ đĩa (xem §5). **Đính chính số X9b:** X9b ghi tổng 67–96 là 297/2266/1354 — SAI 1 đơn vị mỗi cột (quên cộng batch verify vào tổng: 289+9=298, 2228+39=2267; unique mới đợt 96 là 25, không phải 24: 1330+25=1355). Số đúng của parent: **298/2267/1355** trước batch closing.
- **Quyết định parent: G1 GIỮ MỞ.** X6 khuyến nghị giữ mở (chân yên 30fps mới 2/3 tiêu chí, pool 30fps 83% biên 2); phương án đổi metric sang M2 chưa quyết — để user quyết khi về cùng với G1.

## 3. Batch đã stage (KHÔNG push)

Đợt 96: 9 batch / 39 entry / 38 file trong đợt, 25 file duy nhất mới so với đợt 67–95 (13 file trùng đã stage trước). Chi tiết: X1b 5, X2 3, X3 6, X4b 8, X5b 3, X6b 5, X7 1, X8 7, X9b 1 (+ closing 1 batch / 2 entry / 1 file mới).

## 4. Nợ mở cho đợt 97+ (theo thứ tự ưu tiên, từ LIMITS X9b §5)

1. **2 MiB — vẫn mở:** cần test biến số độc lập: probe nhẹ kiểu W1 trong cửa sổ yên, hoặc probe nặng của X1 với log giảm.
2. **Ghost double-count ~19–25% — vẫn mở:** cần pump event log; giả thuyết capture mislabel nay có thêm giải thích (presented lệch, X5 §1.3).
3. **Retry-play lỗi muộn (>3 s) — chưa tái hiện trực tiếp** (max đo được 2,16 s trong 128 case).
4. **Re-arm grace: 0 lần CANCELLED ngoài đời; trần 5000 ms: 0 lần nhả.** Lỗ hổng stall-mới-sau-watch-cũ (X4 c1); analyzer cần nới ngưỡng nhảy hại (Δct < 1,5 frame).
5. **Blur parity:** D đã định danh (pair cách-2) nhưng tần suất fix-3 mới đo 1 lượt (n=2, chỉ đầu clip); cần thêm lượt chr-blur fix-3 + wk-blur. **Memo self-heal: ĐÃ QUYẾT — KHÔNG triển khai** (2 thí nghiệm âm tính); chỉ xem lại nếu xuất hiện hạn hán callback toàn cục đầu phiên (2 kill với 0 callback — chưa từng thấy).
6. **Watchdog đóng băng (mới, X5 §2.1):** kill theo thời gian cả khi frame không tiến; tick cưỡng bức counterfactual cứu ~1111 ms ở wk-blur-r5 c1.
7. **Memo c2 blind thật ~0,4–0,5 s** khi chuyển clip chậm (không phải ~0,1 s như W3): cần thêm lượt wk-blur với caps dày.
8. **B-band WebKit n=5:** cần thêm lượt wk-blur để tách pair/double-count (trình chiếu thưa: snapshot cách nhau ~18 khung ≈ bội chu kỳ sọc).
9. **G1 vẫn MỞ, chờ user quyết** — pool 30fps n=53 PASS 44/53 = 83% biên 2; chân yên 30fps n=14 PASS 10/14 (71%), cần 6 PASS yên liên tiếp nữa (16/20); parent quyết metric: G5 hay M2 làm chuẩn (M2 đã đo + đã cài + test xanh; nếu chọn M2: cần quyết cách xử lý 4 lần yên cũ mất fpsSlots + 5 lần lịch sử bị lật verdict).
10. **EPERM probe #16 + khoảng mù #15:** khoảng mù #15 bắt đầu 08:40:51Z (probe #15), chứa reboot #18 09:24:17Z — chưa probe nào ghi nhận lúc xảy ra. Cron 10 phút vẫn chờ user quyết (không tự tạo). EPERM KHÔNG tuyên bố đã hết.
11. **Zombie pump (mới, X5 §6):** kill pump ngay khi clip đổi hoặc loại capture zombie khỏi thống kê theo clip (số liệu theo clip phồng ~40%).
12. **Harness:** mainDraws/draws cắt 400 mẫu cuối (mất timing đầu lượt dày); tăng cap hoặc ghi tóm tắt timing live như ringFirstAt. Hai fetch không-timeout còn lại trong E1 (media probe, vòng CDP /json/list) chưa sửa. Nhiễu slot trên máy yên (tỉ lệ trong một lần yên dao động 0,46–2,67) cần hiểu nguồn trước khi tin hoàn toàn vào verdict 1 lần.
13. **Đứng yên:** TTS 39 CẤM kiểm lại (chờ Gradio stable 7.x); birefnet chỉ thử lại khi RAM đổi (RAM khả dụng max ~0,87 GB đợt 96, mẫu thấp nhất từng ghi 507 MB — đang đi xuống, vẫn 0 lần thành công; u2net là fallback chính thức); `.github/workflows/*.yml` 403 (user tự thêm qua web hoặc cấp quyền); release gate không đổi (chỉ release khi ngang/hơn CapCut thật).

## 5. Tổng chờ push sau đợt 96

- **Đợt 67–96: 298 batch / 2267 entry / 1355 file duy nhất** (đếm trực tiếp từ đĩa, `phase9-round*.txt` đợt 67–96; đợt 67–95: 289/2228/1330 — khớp closing đợt 95; đợt 96: +9/+39/+25, gồm batch verify). Sau batch closing: **299 batch / 2269 entry / 1356 file duy nhất**. HEAD vẫn 5f548ef8. KHÔNG push. Dict i18n 2767 key (không đổi).
- Batch closing stage (KHÔNG push): `~/workspace/repo-1-push/paths-loop/phase9-round96-closing.txt` — 2 entry (`docs/PHASE9_ROUND96_LIMITS.md` + `PHASE9_GAP_ANALYSIS.md` §25), verify read-back OK, 0 binary, 0 workflow.

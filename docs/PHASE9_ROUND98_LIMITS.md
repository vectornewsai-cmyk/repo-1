# Phase 9 — Đợt 98: Đóng nợ LIMITS gộp đợt 97 §4 (2 MiB, ghost residual, re-arm stall bò, watchdog freeze, blur B-band, zombie, EPERM, harness, G1)

> Ngày: 12/11/2026. Lượt cron 21:35 +07. 10 luồng Z1–Z10 spawn song song; **9 luồng Z1–Z9 về đủ** (LIMITS + log + batch stage). **Z10 (kiểm chứng độc lập) CHƯA XONG** — verify log cho thấy U4 dry-run checks đã chạy xong, O8 chromium có fixture nhưng webkit còn trống, không LIMITS, không batch, không log md; parent gộp 9 luồng đã xong thay Z10. Z10 là nợ cho đợt 99. KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### Z1 — Blob basesrc:5 (nợ §4 mục 1: ĐIỀU TRA XONG)
- **Trạng thái: ĐIỀU TRA XONG — GIẢ THUYẾT "basesrc:5 NHẸ" BỊ BÁC.** Verdict (§2): basesrc:5 ỨC CHẾ BOGUS — giả thuyết "chỉ thêm 1 element là nhẹ" bị bác. Logging nặng vẫn là yếu tố ức chế (kết luận từ Y1/X1); cần 1 run bogus có `basesrc` log để phân biệt — vẫn mở, xem §4.

### Z2 — Ghost residual 13,8% (nợ §4 mục 2: ĐÃ CHẨN ĐOÁN XONG)
- **Kết quả chính: giả thuyết RACE PIXELS LÚC CAPTURE BỊ BÁC BỎ làm cơ chế chính** của residual 13,8% (71/515 mẫu đo mức ngược với triple(P) dù nhãn hoàn hảo). Kết luận mức gStd của Y2 vẫn đứng (tỉ lệ cửa sổ/chu kỳ sọc giống nhau ở các chế độ đo); cơ chế còn lại yếu nhưng chưa kết luận chắc (n nhỏ, chế độ đo THƯA). **KHÔNG sửa production.**

### Z3 — Re-arm stall bò: velocity-based freeze (nợ §4 mục 3: ĐÃ LÀM)
- (a) `nextResumeFreezeRearm` — bò KHÔNG reset đồng hồ đóng băng 300 ms; hook mới `__vcutResumeFreezeCrawl98Z3` (`crawlArms`/`crawlTicks`) + luật bò trong `nextResumeFreezeRearm` + `isResumeCrawlAdvance98Z3`.
- Định nghĩa đóng băng theo tốc độ (đáp nợ lớn nhất đợt 97: detector mù với stall "bò" 0,055× realtime).

### Z4 — Watchdog freeze: ĐÃ ĐÓNG NỢ (nợ §4 mục 4: ĐÃ CHỨNG MINH IN VIVO)
- **Freeze-kill (`"no-callback-frozen"`) ĐÃ BẮN in vivo — 2 lần, cả 2 lần bằng deepstub** (lần đầu chứng minh in vivo; trước đó 0 lần bắn trong 17 lượt vì advance-path cũ luôn bắn trước).
- Kết luận: **pipeline WebKitGTK/GStreamer tự lật `paused` về false** — cần xác nhận thêm bằng log hoặc strace pipeline mới kết luận chắc — ghi là nợ mở, không đoán thêm.

### Z5 — Blur B-band wk (nợ §4 mục 5: ĐÃ ĐO, 1 ĐỊNH NGHĨA KHÔNG THỎA)
- B-band wk n=61, D ~1%, blind wk, state100. Định nghĩa "định" trong brief KHÔNG thỏa — ghi rõ, không ép kết luận.
- Gộp với Y5: 15/16 lượt wk ≈ 0 ms, 1/16 = 485 ms. Kết luận Y5 vẫn đứng. Tỉ lệ cap wk phải cứu bằng chr-base giảm.

### Z6 — Zombie clip-kế-không-blur (nợ §4 mục 6: ĐÃ SỬA + ĐÃ ĐO)
- **ĐÃ SỬA + ĐÃ ĐO — zombie clip-kế-không-blur đã diệt.** Hook kill ở draw path + syncMedia (`rvfcNoteVideoElementOwner`, marker "Đợt 98 Z6" ×5): element đổi chủ thì kill pump cũ ngay tick đầu clip mới, không chờ `ensureRvfcPump`. Điểm Y7 bỏ lỡ: kill của Y7 gắn với lần draw live-video đầu tiên, tới sau khi seek xong 124–224 ms — kill mới bắn ngay tick đầu clip mới dù tick đó hold vì element đang seek.
- Zombie capture/lần đổi clip (state100): biên blur→noblur **+6 → 0**; biên blur→blur **0 / +1 (Y7 fix2) → 0 / 0**. Độ trễ kill (fbAt − mốc đổi clip state100): **+3 ms (mixed c0), 0 ms / +1 ms (blur c0/c1)** — trong lượng tử state100, so với +124–224 ms của Y7 fix2. dbgFinal caps c0/c1/c2 13/—/14 → 6/—/6 (mixed) và 14/10/8 (blur), lastFrame đều 89, fb `''` → `clip-change`. Không mất frame đầu clip mới ở mức đo được. Pixel parity giữ nguyên ở tâm các dải.
- Tàn dư 0–1 capture còn lại là straggler tiền-seek (frame cuối clip cũ, không phải zombie), không rút ngắn thêm được từ draw path.

### Z7 — EPERM probe #17 (nợ §4 mục 7: ĐÃ LÀM)
- `once` ngay sau reboot #20 (13:24:41Z) là **probe #17, boot 65bc5fb6 (ĐỔI), ok=2 fail=0**, exit 0; **khoảng mù #16 ĐÃ ĐÓNG** (1 reboot). Không thể kết luận "không có sóng", chỉ kết luận "không thấy".
- Quét writeFileSync: KHÔNG còn đường ghi production nào chưa nối helper. Bài học dương tính giả (33 dòng "sóng EPERM đã tắt" là in mặc định của launcher) đã ghi.

### Z8 — Harness (nợ §4 mục 8: ĐÃ XONG)
- **Quy tắc (Y9 §3):** mean 5 tỉ lệ ≥ 0,9 → PASS chắc; ≤ 0,6 → FAIL chắc; vùng xám 0,6–0,9 → verdict theo quy tắc (lần 1 verdict theo quy tắc → nếu chắc thì pass/fail ngay; nếu không chắc thì đo tiếp).
- Slot `/json/list` 5 s (thay mặc định 180 lần → worst case ~450 s khi endpoint treo); bucket tóm tắt trừ `playT0rel`.
- **test-preview-engine.sh — SỬA XONG** (chọn sửa, không chọn ghi cách chạy): (1) `Cannot find module './previewClipKey62R6.ts'` — thêm file vào tsc include + sed rewrite `.ts` → `.js`; (2) thư mục `/tmp` dùng chung — script nay `mktemp -d` mỗi lượt, test suy OUT từ `__dirname` (thư mục chứa file test đã copy). Parent chạy lại script: **354 assertions pass** (xem §3).

### Z9 — G1 evidence v9 (nợ §4 mục 9: SỐ CHO PARENT/USER QUYẾT — G1 VẪN MỞ)
- Trạng thái G1 trước vòng: pool 30fps n=53 PASS 44/53 = 83% biên 2; chân yên 30fps n=14 PASS 10/14 (71%), cần 6 PASS yên liên tiếp nữa (16/20); pool 60fps n=37 PASS 35/37 (95%); metric M2 đã cài song song, G5 vẫn là chuẩn chính thức.
- **Chân yên 30fps — TIẾN SÁT ĐÍCH: 4 mẫu yên mới, cả 4 đều PASS → 14/18 (78%), còn thiếu 2 PASS liên tiếp nữa.** Chỉ đo, không sửa production, quyết định cuối thuộc parent/user.

## 2. Ghi chú gộp parent

- **Z10 chưa xong (nợ thật, không phải báo cáo sai):** verify log (`round98-z10-verify.log`) cho thấy U4 dry-run checks đã chạy xong (C2c-mkf4-dry: OLD 3,986s → NEW 0,192s, tiết kiệm ~3,8s); O8 chromium có fixture, webkit còn trống; không LIMITS, không batch, không log md. Parent KHÔNG stage phần việc dở dang; Z10 là nợ cho đợt 99 (kiểm chứng độc lập lại Z1–Z9 + O8 cả 2 engine).
- **test-preview-engine.sh chạy trực tiếp `node preview-engine.test.cjs` sẽ FAIL** (`Cannot find module '.../scripts/out/apps/web/src/lib/previewEngine.js'`) — đó là cách chạy sai, không phải hồi quy: test suy OUT từ `__dirname` và phải chạy qua script (script copy test vào thư mục mktemp rồi mới chạy). Parent chạy đúng qua script: **354 assertions pass**.
- Worker báo "đợt 98 đã stage thêm các batch trên" — đúng cho 9 luồng; cộng closing 2 entry thành đợt 98: 33 entry / 10 file (xem §5).

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0; vite build PASS (12,98s — chậm hơn thường lệ do tải VM cao); r6-i18n-check PASS (dict 2767, không đổi); P7 8/8; orphans 17/17; css60 60/60; css61 60/60.
- playheadPacing 19/19; playheadHold 56/56 (tăng từ 50 — Z3 thêm test); test-preview-engine.sh **354 assertions pass**.
- Không chạy lại: Z1–Z9 harness đo đầy đủ (tin LIMITS từng luồng + số đo JSON trên đĩa); O8 chưa chạy lại (Z10 chưa xong — nợ đợt 99).

## 4. Nợ mở cho đợt 99

1. Z10 kiểm chứng độc lập Z1–Z9 + O8 cả 2 engine (chưa xong).
2. 2 MiB — vẫn mở, đã thu hẹp: cần 1 run bogus có `basesrc` log (basesrc:5 ức chế bogus — giả thuyết "nhẹ" bị bác); stall thầm 0 frame; 2 pipeline blob; thành phần nào đặt ra con số 2 MiB.
3. Ghost residual 13,8% — race pixels bị bác làm cơ chế chính; cơ chế còn lại chưa rõ (n nhỏ, chế độ đo thưa); cần chẩn đoán mức pixel (expose ring snapshots).
4. Re-arm — định nghĩa đóng băng theo tốc độ đã làm (Z3); CANCELLED vẫn 0 ngoài đời; phân loại CANCELLED hẹp có thể không bao giờ đếm được đuôi chặn thành công.
5. Watchdog freeze — pipeline tự lật `paused` về false cần xác nhận thêm bằng log/strace.
6. Blur parity — B-band wk còn mở ở mức từng mẫu; D fix-3 còn ~1% sàn; cap D r7 dị thường (nhãn {3,9} gap 6); cửa sổ mù wk r7 cần luồng riêng đối chiếu Y5.
7. Zombie pump — tàn dư 0–1 capture straggler tiền-seek, không rút ngắn thêm được từ draw path.
8. G1 đóng hay chưa — parent/user quyết (Z9: chân yên 30fps 14/18 = 78%, còn thiếu 2 PASS yên liên tiếp; pool 30fps n=53 PASS 44/53 = 83% biên 2; pool 60fps n=37 PASS 35/37 = 95%).
9. EPERM: probe #18 + khoảng mù #17; cron riêng 10 phút vẫn chờ user quyết.
10. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định parent đợt 92) — vẫn 0 lần chạy thành công.
11. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
12. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
13. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 98: 9 luồng, **31 entry / 9 file** (Z1 3, Z2 3, Z3 6, Z4 2, Z5 3, Z6 3, Z7 1, Z8 8, Z9 2).
- Closing đợt 98: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §27).
- **Tổng chờ push sau đợt 98: 2337 entry / 320 file batch / 1401 file duy nhất** (đợt 67–97: 2304/310/1379; đợt 98: 33/10 — 31 entry luồng + closing 2 entry / +1 file duy nhất (LIMITS gộp mới); gap analysis đã stage từ trước. Đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
- Z10 không stage (chưa xong, không LIMITS/batch).

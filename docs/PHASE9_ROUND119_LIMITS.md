# PHASE9 ROUND119 — LIMITS gộp (đợt 119, lượt cron 06:35 +07 16/11/2026; ĐÓNG BỞI PARENT MAIN CHAT 09:4x +07 16/11)

> KHUNG do phase-1 driver viết tự động 02:26:33Z, boot fc62a4b7
> (suite+O8+recount xong). Bản này do parent hoàn thiện từ LIMITS
> từng luồng + dữ liệu thô — thay thế khung.

## 0. Kiểm chứng gộp — parent đóng thay T10 (T10 chết vì timeout cron 02:35Z)

- **T10 phase 1 XONG (02:26:34Z, boot #59 fc62a4b7):** suite cây
  gộp **27/27 exit 0** (log `round119-t10-suites.log`, preview-
  engine 354 assertions pass, chạy 01:45:46Z boot #58 622b3a92);
  O8 Chromium 21/21 exit 0 (01:46:56Z + 02:15:20Z); **O8 WebKit
  exit=2 hai lần** (01:47:08Z boot #58 + 02:15:33Z boot #59) — hạ
  tầng: môi trường boot mới thiếu GST (qtdemux), không phải lỗi
  sản phẩm. T10-OWN-FAIL-1: postboot evidence của T10 tự kiểm FAIL
  02:14:21Z (WebKit chạy 1 lần, exit=2, ghi nguyên nhân hạ tầng,
  không retry mù, không --repair).
- **Phase-1 recount:** đợt 119 = **9 batch / 15 entry / 15 file
  duy nhất**; lũy kế 86/163/138 (log `recount-push119.log`). Đếm
  đủ 9/9 trước recount (poll ghi 9/9 lúc 02:26:33Z) — khác đợt 118
  (phase-1 đếm thiếu).
- **T10 chết vì timeout cron (02:35Z):** poller ghi cuối 02:29:33Z;
  không có LIMITS gộp bản cuối, gap §48, closing batch, cờ
  t10.done. Phiên T10 chết theo timeout (cron 10800 s). Lượt cron
  09:35 +07 16/11 đã xếp hàng — sẽ bỏ qua theo chốt chặn.
- **Parent đóng thay (09:4x +07 16/11):** kiểm lại 9/9 headline
  từ LIMITS từng luồng + dữ liệu thô (xem §1–§9, không đính chính
  nào cần sửa số — chỉ bổ sung caveat); chạy lại tsc web 0 + tsc
  desktop 0 + vite build PASS 8,15 s trên cây cuối; preview.tsx
  md5 5be5a250 (cây H3f, không đổi sau T1 apply); media.ts
  2c384ed1 không đổi. Suite phase-1 chạy 01:45:46Z — trước batch
  t8 (01:52Z, runner benchmark + analyzer + LIMITS) và t4 (02:26Z,
  LIMITS doc) — hai batch sau chỉ là script đo + doc, không chạm
  code production; tsc/vite parent chạy lại trên cây cuối bù phần
  này.
- **Số chờ push sau đợt 119 (gồm closing): 87 batch / 165 entry /
  139 file duy nhất + 1 oversize 6,4 MB** (xem recount cuối §12).

## 1. T1 — H3f apply + đo A/B: GIÚP — patch ĐƯỢC GIỮ trên cây (caveat chân B n=19, chờ parent chốt §12)

- **Đã làm:** apply patch H3f (108 dòng, 5 hunks, đợt 118 chuẩn
  bị) vào preview.tsx (03bf029f → **5be5a250**, 23:57Z); tsc 0 +
  vite build PASS; giữ trên cây.
- **A/B cùng boot 27c8b1d9, liền nhau, cùng spec/hog/probe:** tick
  chậm 41 → 19 (**−53,7%**), longtask ≥200 ms tổng 36.279 →
  17.290 ms (**−52,3%**, n 131 → 67), draws-gap >300 ms tổng
  34.232 → 14.388 ms (**−58,0%**, n 84 → 38). Cả hai ngưỡng GIÚP
  của prereg §3 đều vượt với biên lớn (cần −25% tick chậm và −20%
  longtask-tổng). Không hồi quy parity: pageErrs 0/0, skipped
  16,6% → 11,8% (tốt hơn), caps 313 → 410. Tải hai chân tương
  đương (load1 med 5,84 vs 5,45; load lúc phát 2,43 vs 2,76 —
  chân B phát ở tải hơi cao hơn, không nhẹ hơn).
- **Caveat bắt buộc đọc cùng verdict (LIMITS §2):** chân B có 19
  tick chậm, DƯỚI ngưỡng điều kiện hiệu lực prereg §2 (n ≥ 30) nếu
  đọc theo chữ. Nhưng ngưỡng đó đo chính biến kết quả (số tick
  chậm) — một patch làm giảm một nửa tick chậm tất yếu sẽ phạm
  ngưỡng này. Hai chỉ báo hiệu lực còn lại của chân B đều đạt với
  biên (longtask 67 ≥ 50, gap 38 ≥ 20), stall vẫn tái hiện rõ ở
  chân B (loopMs max 415,5 ms, p90 87,8), tải tương đương. Vì vậy
  cặp A/B được chấp nhận — **parent chốt ở §12 mục 1.**
- Batch 3 entry (LIMITS + probe + patch script).

## 2. T2 — E4 lượt 2 (lô đo lớn, B gop30): VOID — lô 1/10 (1 VOID, 0 CAUGHT)

- **Lượt đếm được ĐẦU TIÊN của lô E4BATCH — lượt 2 (B, gop30,
  phase `e4b2`) = VOID** (0 steady-close trong 360 velocity tick,
  probe exit=0). Lô đang **1/10 (1 VOID, 0 CAUGHT)**. Chạy trên
  cây H3f md5 `5be5a250` (T1 apply xong 23:57Z, tsc 0 + vite build
  PASS), boot #57, lock chờ 0 s / giữ 32 s, không reboot, không
  DEFER. **H1/H3 vẫn CHƯA PHÂN ĐỊNH. E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**
- Batch 1 entry (LIMITS).

## 3. T3 — Lặp s79 trên cây H3f: s79r3 GIỮ SÁT VẠCH 80,1% @24,80; s79r4 TRUNG GIAN 56,9% @27,35 — nhiễu 23,2 điểm, lớn nhất từ trước; điểm gãy VẪN MỞ

- **s79r3 GIỮ 80,1% @24,80 — nhưng SÁT VẠCH, chỉ hơn vạch 0,1
  điểm** (xem LIMITS §3). **s79r4 TRUNG GIAN 56,9% @27,35.**
  Cùng cấu hình, cùng cây H3f, chênh **23,2 điểm — nhiễu giữa các
  lượt lớn nhất từ trước tới nay** (vượt 19,1 điểm đợt 118).
  Bối cảnh: s79 gốc (đợt 117) TRUNG GIAN 79,7% @26,98; s79r1
  (đợt 118) GIỮ 83,5% @13,22; s79r2 (đợt 118) TRUNG GIAN 79,0%
  @27,75.
- **Kết luận T3: điểm gãy VẪN MỞ; GIỮ vững 19,63 (đo trên cây cũ)
  KHÔNG được dời bằng dữ liệu này.** Một lượt GIỮ sát vạch + một
  lượt TRUNG GIAN sâu ở cùng tải ~25–27 cho thấy phép đo s79 đơn
  lẻ gần như không còn thông tin — nhiễu át tín hiệu. Bar (b) kẹt
  **0/12**.
- Batch 2 entry (probe + LIMITS).

## 4. T4 — WebKit ≤60 ms: KHÔNG CHẠY ĐƯỢC LƯỢT YÊN (0 lượt — 2 reboot + replay không cài GST)

- **0 lượt yên.** Attempt5 chết theo reboot boot B ở gateA (25
  poll, +0–48m, postboot FAIL 25/25). Replay kết thúc 0 dòng
  dpkg.log về 9 gói; postboot FAIL y hệt sau 40 phút. Gate0-wait
  bị reboot boot C giết ở poll #25, chưa tới hạn (+0–28m, postboot
  FAIL 15/15). Replay vẫn ở giai đoạn đầu.
- **Nguyên nhân: môi trường boot mới thiếu GST (qtdemux)** — replay
  apt không cài được các gói GST cần cho WebKit. Ngưỡng ≤60 ms
  GIỮ nguyên trạng thái (lượt yên attempt8 đợt 118, median 40,0
  ms). O8 WebKit exit=2 cùng nguyên nhân (xem §0).
- Batch 1 entry (LIMITS).

## 5. T5 — Chẩn đoán event ghost frame 23: XONG — họ P4, KHÔNG hồi quy

- **Event ghost frame 23 (T4 attempt8 đợt 118): CHẨN ĐOÁN XONG —
  họ P4, KHÔNG hồi quy. Cơ chế: desync clock/display sau seek
  vòng lặp.**
- Event 23 là họ P4 (event rõ thứ 6 trong họ — LIMITS §3 cũng ghi
  "thành viên thứ 7" ở §3 so sánh, chênh nhau do cách đếm gồm/không
  gồm event mờ; parent dùng "họ P4" không ghi số thứ tự): cùng cấu
  trúc 2 pha, snapshot TƯƠI (capture sau seek, khác lỗi vòng đời
  ring). Không cần đo lại.
- Batch 1 entry (LIMITS).

## 6. T6 — Probe #38 + mù #37 KHÔNG ĐÓNG (B/C mở) + gap #54→#55 ĐƯỢC CHỨNG NHẬN

- **Probe #38:** ok=2 fail=0 (checklist P8 §2.3, đúng 1 lần).
- **Khoảng mù #37: 11:39:50Z → 23:45:17Z (12h05'27") — KHÔNG
  ĐÓNG** (dự báo đoạn B/C không đóng đã đúng). Reboot trong mù:
  #55 12:51:56Z, #56 ~20:17Z, #57 23:33:34Z + tối đa 29 reboot ẩn
  (danh nghĩa).
- **Reboot #56 (tạm) ~20:17Z, boot 6805e92d — GIỜ CHỈ LÀ ƯỚC
  LƯỢNG** (0 exec-log sinh trong (20:30Z, 21:10Z]; phiên parent
  viết LIMITS gộp bằng file tool — lần đầu tiên một reboot chỉ có
  giờ ước lượng). Hệ quả: **gap #55→#56 và #56→#57 KHÔNG đưa vào
  FULL.** Dấu hiệu reboot ẩn đoạn B: #56 danh nghĩa nằm ngoài dải
  cơ học từ #55 tới 4h10'56"; #57 chỉ vượt dải từ #56 danh nghĩa
  2'26" (phù hợp #56 thật muộn hơn vài phút).
- **Gap #54→#55 = 2h03'30" ĐƯỢC CHỨNG NHẬN (caveat F55 chưa kiểm
  — xem LIMITS §2.5). CERT n=30 → n=31** (mean 1h51'15", median
  1h59'46", p10 1h08'24", p90 2h27'07", sd 0h40'37"); **FULL n=45
  → n=46** (mean 1h56'13", median 1h59'16"). Dải chứng nhận
  [19'07", 3h14'08"] không đổi. Tốc độ reboot: 57 / 123,26 h = 1
  mỗi 129,7 phút (+4 ẩn → 1 mỗi 121,2 phút).
- **EPERM: 0 sóng thật** (196 log trong mù, 3 dòng "đã tắt" đều là
  dương tính giả launcher T10 ×2 + T9 ×1). Sóng gần nhất vẫn
  ~11:55–12:11Z (R7), ~107h34' trước probe #38. EPERM không tuyên
  bố đã hết.
- **WFS lần 25 chênh 0 (lần thứ 25 liên tiếp):** NEWSTD 770 dòng /
  211 file (phạm vi 2.917), R7b 795/228, copies 25/17; 770+25=795=
  R7b. +19 dòng/+3 file giải thích hết (probe119t1-h3f-ab.mjs +7,
  probe119t3-frame-parity.mjs +8, LIMITS T6 đợt 118 +4; mtime đều
  trước lúc scan 00:03:09Z 16/11). Async `.writeFile(`: vẫn đúng 2
  helper đã biết (+1 bản build dist cũ cùng helper), 0 stray.
- **RAM max trong mù: 4.811 MB** (T4 poll5m 12:31:24Z, đoạn A) =
  78% guard — cao nhất từng thấy trong một mù nhưng vẫn dưới 6 GB.
  Birefnet KHÔNG chạy, vẫn 0 lần thành công. Không reboot mới
  trong lúc làm việc (boot vẫn 27c8b1d9 lúc 00:16:54Z).
- Batch 1 entry (LIMITS).

## 7. T7 — Hạ tầng: boot mới 27c8b1d9, replay NHANH (2'05", 7'34"], postboot PASS ×3, headroom 670, repair 15' KHÔNG kích hoạt

- **Boot mới 27c8b1d9 (up 23:33:34Z 15/11). Replay #57? CHẠY và
  NHANH — khoảng (2'05", 7'34"]** kẹp được bằng dpkg.log.
- **Chính sách repair 15 phút: KHÔNG KÍCH HOẠT (lần đầu áp
  dụng).** Luật: boot mới mà replay không tới trong ~15 phút thì
  chạy `--repair` có kiểm soát. Ở boot này replay tới trong ~15
  phút → `--repair` KHÔNG chạy, không cần chạy. Đây là lượt đầu
  tiên chính sách được áp dụng (chưa có boot nào từ khi duyệt mà
  replay quá 15' không tới) — chính sách hoạt động đúng thiết kế
  (không kích hoạt khi không cần).
- **Postboot #57?: PASS ×3** — kiểm live sớm lúc boot ~10'11".
- **Headroom inotify boot #57?: 670 — rơi tiếp** (804 đợt 118 →
  670). Vite thường cần ~1586; vite tạm vẫn bắt buộc.
- Batch 2 entry (LIMITS + postboot-check script).

## 8. T8 — Đặt lại bar F2: DỞ DANG (reboot + môi trường sau reboot thiếu GST) — bar mới CHƯA CÓ VERDICT

- **Bar F2 mới (định nghĩa tách hai pha) — ĐÃ ĐĂNG KÝ + ĐO MỘT
  PHẦN — KHÔNG VERDICT. Leg B chỉ 3/6 run hợp lệ (cần ≥6 theo
  prereg §1).** Định nghĩa + ngưỡng đề xuất ghi tại LIMITS §1 để
  parent quyết; T8 không tự áp bar, không tuyên bố đạt/không đạt
  từ mẫu thiếu.
- **Leg A xong** (xem LIMITS §2). Follow-up MSB4RB8 27,02 s
  (ngoại lệ đợt 118) dở dang vì môi trường sau reboot thiếu GST
  plugin — đo lại đợt 120.
- Batch 3 entry (runner + analyzer + LIMITS).

## 9. T9 — Lock v2 theo dõi: suite T7 chạy lại 9/9 hai lần + điều tra "KHÔNG NHẢ — owner '?'" XONG

- **Suite T7 chạy lại: 9/9 PASS HAI LẦN — T7 FAIL đợt 118 là nhiễu
  môi trường, KHÔNG phải hồi quy.** Lần 1 (23:42–23:43Z): 9/9 PASS,
  4 → 3 (diff 1), 3101 ms. Lần 2 (23:43Z): 9/9 PASS, 2 → 1
  (diff 1), 3069 ms. So sánh đợt 118 (T1): lần 1 B1=8 B2=6 (diff 2
  — một blocker), lần 2 B1=6 B2=6.
- **Điều tra "KHÔNG NHẢ — owner '?'" (T3 báo khi nhả lock sau
  s79r2 đợt 118): đây là release thừa (double-release) VÔ HẠI —
  rc=1, không đổi trạng thái nào, không ghi thêm RELEASED, lock
  vẫn trống đúng. Không phải bug lock, không phải owner bị mất,
  không phải race. KHÔNG SỬA production** (chỉ đề xuất cải tiến
  thông báo, chờ parent quyết — §12 mục 8).
- Batch 1 entry (LIMITS).

## 10. Nợ mở cho đợt 120 (gộp từ §1–§9)

1. **E4 — lô đo lớn (T2, nợ #1):** lô 1/10 (1 VOID, 0 CAUGHT) —
   chạy tiếp lượt 3–10; E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN (hướng (a)).
2. **Điểm gãy tải (T3, nợ #2):** VẪN MỞ. Nhiễu 23,2 điểm (lớn
   nhất từ trước) — phép đo s79 đơn lẻ gần như không còn thông
   tin. Parent quyết ở §12 mục 3 (TẠM DỪNG lặp s79, điều tra nguồn
   nhiễu trước).
3. **WebKit ≤60 ms (T4, nợ #3):** 0 lượt yên đợt 119 (2 reboot +
   replay không cài GST). Ngưỡng GIỮ. Nợ hạ tầng mới: replay cài
   GST sau reboot — chính sách repair 15' chỉ kích hoạt khi replay
   KHÔNG tới; trường hợp replay tới nhưng THIẾU GST chưa có luật
   xử lý (xem §12 mục 5).
4. **Bar F2 mới (T8, nợ #4):** đã đăng ký định nghĩa tách hai
   pha, leg B dở 3/6 — cần ≥6 run hợp lệ đợt 120 mới có verdict
   (xem §12 mục 4). Follow-up MSB4RB8 27,02 s đo lại.
5. **Mù #37 + probe #39 (T6, nợ #5):** mù #37 KHÔNG ĐÓNG (B/C
   mở, 12h05'27"); #56 giờ ước lượng — gap #55→#56 và #56→#57
   không vào FULL; probe #39 đợt 120 (đếm reboot từ btime/uptime,
   không tin đồng hồ VM một mình sau vụ giây nháy #54).
6. **Hạ tầng (T7, nợ #6):** headroom 670 rơi tiếp; R9 (a) (cron
   chạy watcher v2 đầu mỗi lượt với --wait-new-boot) VẪN CHỜ user
   (đã hỏi lúc đóng đợt 117, chưa trả lời).
7. **G1 + mù #22/#28/#29/#30/#31/#35 chờ user quyết** (không tự
   quyết). Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi
   (u2net là fallback chính thức). ci-security.yml vẫn 403 chờ
   user. TTS 39 CẤM kiểm lại.
8. **Thông báo lock "KHÔNG NHẢ — owner '?'"** (T9): chỉ là thông
   báo gây hiểu lầm (double-release vô hại) — đề xuất cải tiến
   thông báo, chờ parent quyết (§12 mục 8).

## 11. Ghi chú vận hành đợt 119

- Bài học T10 đợt 118 đã áp dụng một phần: LIMITS gộp KHUNG viết
  ngay sau suite+O8+recount (file này, do phase-1 driver viết tự
  động 02:26:33Z); recount chỉ chạy sau khi poll ghi 9/9 (chờ tối
  đa 60') — đợt này recount đếm đủ (9/15/15). Nhưng phase 2 vẫn
  chết — lần này vì **timeout cron 02:35Z** (không phải reboot):
  poller ghi cuối 02:29:33Z. Bài học mới: phase 2 (verify + điền
  khung + gap + closing) phải chạy NGAY trong cùng phiên driver
  hoặc có phiên follow-up được đánh thức trước khi hết giờ cron;
  không để phase 2 trôi tới sát hạn 10800 s.
- Chốt chặn `round-in-progress.md` ĐÃ TẠO lúc mở đợt 119 (23:36
  15/11) — khắc phục lỗi lượt 15:35/18:35 đợt 118. Lượt cron 09:35
  +07 16/11 đã xếp hàng và sẽ bỏ qua theo chốt chặn (đợt 119 đang
  đóng); parent xóa chốt chặn sau khi đóng.
- Reboot trong đợt: #58 00:53:41Z (boot 622b3a92) + #59 01:47:49Z
  (boot fc62a4b7) — giết phiên T4/T8/T10 (phase-1 driver chạy lại
  sau #59, xong 02:26:34Z). Gap #57→#58 và #58→#59 xem T6/T7 đợt
  120 (T6 đợt 119 chỉ kẹp tới #57).
- T7 postboot evidence của T10: T10-OWN-FAIL-1 (WebKit exit=2 do
  thiếu GST — nguyên nhân hạ tầng, không retry mù, không --repair).
- Suite phase-1 chạy trước batch t8 (01:52Z) và t4 (02:26Z) — hai
  batch sau chỉ là script đo + doc; parent chạy lại tsc + vite
  build trên cây cuối để bù (tsc 0/0, vite PASS 8,15 s).
- Lock v2: T9 xác nhận T7 FAIL đợt 118 là nhiễu; "KHÔNG NHẢ" là
  double-release vô hại — hai nợ theo dõi đợt 118 ĐÃ ĐÓNG.

## 12. Quyết parent (main chat, 09:4x +07 16/11/2026 — đóng đợt 119)

1. **H3f caveat: CHẤP NHẬN.** Verdict A/B đứng (H3f GIÚP, patch
   giữ trên cây). Ngưỡng hiệu lực n≥30 của prereg §2 đo chính biến
   kết quả nên không áp được cho patch làm giảm một nửa tick chậm;
   hai chỉ báo còn lại (longtask 67 ≥ 50, gap 38 ≥ 20) đạt với biên
   và stall vẫn tái hiện rõ ở chân B — đủ điều kiện hiệu lực.
   Bài học cho prereg sau: ngưỡng hiệu lực phải đo biến độc lập
   với biến kết quả (ví dụ: tổng thời gian đo, số tick tổng), không
   đo chính biến kết quả.
2. **E4:** lô chạy tiếp lượt 3–10 ở đợt 120+; E4 vẫn ĐÓNG CÓ ĐIỀU
   KIỆN (hướng (a)).
3. **Điểm gãy s79: TẠM DỪNG lặp s79 đơn lẻ.** Nhiễu 23,2 điểm
   (s79r3 80,1% vs s79r4 56,9%, cùng cấu hình/cây) làm phép đo đơn
   lẻ gần như vô thông tin. GIỮ vững 19,63 không đổi. Đợt 120 ưu
   tiên điều tra NGUỒN NHIỄU (giả thuyết throttle: đo cgroup trực
   tiếp — load1 thấp = main thread đói) trước khi chạy thêm s79.
   Nếu chạy s79 tiếp thì phải chạy theo lô ≥3 lượt lấy trung vị,
   không chạy lẻ.
4. **Bar F2 mới: CHẤP NHẬN định nghĩa tách hai pha đã đăng ký,
   CHƯA ÁP NGƯỠNG.** Leg B phải đủ ≥6 run hợp lệ ở đợt 120 mới có
   verdict; T8 không tự áp bar từ mẫu thiếu là đúng.
5. **WebKit + GST sau reboot: ngưỡng GIỮ; ghi nợ hạ tầng mới.**
   Replay tới nhưng THIẾU GST (qtdemux) là chế độ lỗi mới — chính
   sách repair 15' hiện chỉ kích hoạt khi replay KHÔNG tới. Đợt
   120: luồng hạ tầng kiểm tra GST sau mỗi reboot và đề xuất luật
   xử lý (ví dụ: postboot FAIL do thiếu GST → chạy --repair hoặc
   cài tay gói GST).
6. **Ghost frame 23: CHẤP NHẬN — họ P4, KHÔNG hồi quy.** Nợ chẩn
   đoán frame 23 ĐÃ ĐÓNG.
7. **Mù #37: CHẤP NHẬN KHÔNG ĐÓNG HOÀN TOÀN** (B/C mở); gap
   #54→#55 chứng nhận được chấp nhận (CERT n=31); #56 giờ ước
   lượng — gap #55→#56 và #56→#57 không vào FULL là đúng.
8. **Thông báo lock "KHÔNG NHẢ": CHẤP NHẬN cải tiến thông báo ở
   đợt 120** (chỉ sửa text thông báo, không sửa logic lock — vì
   đây là double-release vô hại, không phải bug).
9. **R9 (a): VẪN CHỜ user** (đã hỏi lúc đóng đợt 117, chưa trả
   lời — không hỏi lại dồn dập). Chính sách repair 15' đã chứng
   minh hoạt động đúng thiết kế (không kích hoạt khi replay tới
   đúng hạn, boot #57).
10. **T10 chết vì timeout cron:** parent đóng thay (LIMITS gộp này
    do parent hoàn thiện từ khung phase-1); ghi bài học vào §11
    (phase 2 chạy ngay trong phiên driver hoặc đánh thức follow-up
    trước hạn cron).

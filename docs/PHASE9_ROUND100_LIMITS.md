# Phase 9 — Đợt 100: Đóng nợ LIMITS gộp đợt 99 §4 (2 MiB, ghost tick, tail-expiry, blur, zombie, EPERM, harness, play/set_state)

> Ngày: 13/11/2026. Lượt cron 03:35 +07. 9 luồng B1–B9 spawn song song; **8 luồng B1–B8 về đủ** (LIMITS + log + batch stage). **B9 (kiểm chứng độc lập) CHƯA XONG** — poll log dừng ở 21:52Z (7/8, boot aa3f2b67, RAM 865 MB); reboot #24 lúc ~21:41:50Z (boot 66fb273d → aa3f2b67) giết poller cũ, poller khởi động lại 21:42Z; B8 hạ cánh sau poll cuối nên B9 chưa kịp thấy/verify. Parent gộp 8 luồng đã xong thay B9. B9 là nợ cho đợt 101. KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### B1 — 2 MiB: điểm nối chưa chứng minh được nhưng thu hẹp (nợ §4 mục 2)
- **Điểm nối chưa chứng minh được nhưng thu hẹp:** splice đúng 2.097.152 byte; **giả thuyết pause/resume 2019 BỊ BÁC — hai lần:** (a) code hiện tại không còn `SMALL_MEDIA_RESOURCE_MAX_SIZE` (thay bằng `HIGH_QUEUE_THRESHOLD` 20 MiB / `LOW_QUEUE_THRESHOLD` 2 MiB — bất lực với c2 2,1 MB và c8 8,2 MB vì queue không bao giờ vượt 20 MiB); (b) runtime: **0 dòng stop/restart trong cả 4 run bogus** của probe B1.
- `webkitwebsrc.create` loại trừ; **handoff typefind↔webkitwebsrc là điểm nối hẹp nhất**. Đính chính A1 §3.1 ("SMALL_MEDIA_RESOURCE_MAX_SIZE đã xác định" — hằng đó không còn trong code hiện tại).

### B2 — Ghost tick: cơ chế trễ trong-tick BỊ BÁC ở dạng mạnh (nợ §4 mục 3)
- **Kết quả chính — cơ chế "trễ trong-tick gây gán sai nhãn" BỊ BÁC ở dạng mạnh.** Thủ phạm là **phase jitter presented-frame↔currentTime (±1, thỉnh thoảng ±2)**; fix A2 không hiệu quả.
- 20 pass: 1 fail / 10 cửa sổ (pass 12, P=72, đo 112,3 ≈ gStd đơn-frame).

### B3 — Tail-expiry: FIX ĐÃ LAND (nợ §4 mục 4)
- **Kết luận ngắn: FIX ĐÃ LAND.** Luật đuôi nay chỉ đếm lần tăng LÀNH (tốc độ tăng trong chính tick ≤ 1,5× playbackRate); burst bị chặn + reset bộ đếm. Offline 65/65 test (9 test mới B3-R1..R9, gồm replay f4). Live 6 lượt WebKitGTK: **f4-like 0/6** (baseline f4 đợt 99: 1 ca), **burst bị chặn 3 lần ngoài đời** (g1×2, g2×1), grace BỊ CHẶN 6 / LỌT 0, ARM-HELD §6 = 2 (tăng từ 1/18 lượt đợt 99), không hồi quy (tsc 0, vite build PASS, 6 suite xanh).
- **Nhưng fix chưa triệt để:** burst trải trên 1 gap rAF dài (> ~770 ms cho +1,16 s) có rate ≤ 1,5× nên vẫn lọt — 2 ca như vậy đã quan sát được (g2, g5); cả 2 đều không gây hại (drift ≤ ~1,1, ph đuổi kịp trong 1 tick), nhưng cửa sổ f4 vẫn mở cho burst dài-gap đáp xa (> ~1,5 s).
- Tick probe ≠ tick app (±1 tick, caveat W5 §6.3) — và hơn thế dưới tải: gap rAF 300–1500 ms nên NHIỀU tick app có thể ẩn giữa 2 mẫu probe; verdict f4-like chỉ kết luận trên mẫu probe. ARM-HELD §6 tăng lên 2/6 lượt (từ 1/18) — có thể là nhiễu mẫu nhỏ (6 lượt), không phải bằng chứng fix làm tăng ARM-HELD; chỉ ghi nhận, không kết luận.

### B4 — Blur (nợ §4 mục 5)
- B-band n=96→132, không bimodal; curPix đường thường hoạt động (317/317 tick) — presented ±1 ở ~58% tick; D chr 12/783 = 1,5% sàn ~1%; r7 vẫn mở.
- Cho frame vẽ live trên chr (19/26 ca quyết định được, 73%); một số ca không khớp nhãn, chỉ kết luận lệch khi nhãn KHÔNG nằm trong số quyết định được bằng tiêu chí singleton.

### B5 — Zombie early-return (nợ §4 mục 6)
- **Khe early-return ngoài đời KHÔNG quan sát được** (37 biên đường bình thường, 0 ca); đối chứng dương bắn 6/6. Check A6 chỉ chứng minh qua fault-injection — vẫn là khe lý thuyết, chưa thấy ngoài đời.

### B6 — EPERM probe #19 (nợ §4 mục 7)
- **Probe #19 ok=2 fail=0, boot 66fb273d; khoảng mù #18 ĐÃ ĐÓNG (reboot #23 20:30:14Z).** Reboot #16 kẹp ~4' chưa chốt (giờ từng giây KHÔNG chốt được với dữ liệu hiện có; lỗi số của A8 không đổi kết luận của mù #17). writeFileSync chênh 0 lần thứ bảy.
- **Reboot #24 lúc ~21:41:50Z (boot 66fb273d → aa3f2b67)** — trong lúc B9 đang poll; poller cũ chết cùng reboot, khởi động lại 21:42Z. VM hiện tại boot aa3f2b67.

### B7 — Harness (nợ §4 mục 11)
- **Space-toggle fix đã land, 9/9 E1 0 abort**; quy tắc slot-tải-đầu đã cài; chân yên 30fps còn 16/20 = 80% vẫn đủ mốc (G1 — xem §4 mục 1, vẫn chờ user quyết metric G5/M2).

### B8 — play()/set_state (nợ §4 mục 2, bổ sung A4)
- **Cơ chế hấp thụ ở WebKit (5 cửa chặn)** + đính chính A4 (0 dòng already in state → WebKit chưa gọi thừa). Thí nghiệm quyết định: GST log ghi MỌI lần gọi `set_state`. Log A4 không bật category `webkitmediaplayer` nên mọi quyết định từ log đó phải dè chừng — B8 bật đủ category mới kết luận.

## 2. Ghi chú gộp parent

- **B9 chưa xong (nợ thật, không phải báo cáo sai):** poll log dừng 21:52Z ở 7/8 (B8 hạ cánh sau đó); reboot #24 giết poller cũ 21:41:50Z; không LIMITS, không batch, không verify log. Parent KHÔNG stage phần việc dở dang; B9 là nợ cho đợt 101 (kiểm chứng độc lập lại B1–B8 + O8 cả 2 engine).
- Worker báo "đợt 100 chưa cộng do B9 chưa xác nhận" — parent cộng sau khi kiểm lại: 23 entry luồng + closing 2 entry (xem §5).
- Đính chính B1: A1 nói SMALL_MEDIA_RESOURCE_MAX_SIZE "đã xác định" là sai ở code hiện tại — hằng đó không còn, thay bằng HIGH/LOW_QUEUE_THRESHOLD. Không đổi kết luận ức chế của X1/Z1/A1.

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0; vite build PASS (6,38s); r6-i18n-check PASS (dict 2767, không đổi); P7 8/8; orphans 17/17; css60 60/60; css61 60/60.
- playheadPacing 19/19; playheadHold 65/65 (tăng từ 56 — B3 thêm test); B7 deint verdict exit 0; test-preview-engine.sh **354 assertions pass**.
- Không chạy lại: B1–B8 harness đo đầy đủ (tin LIMITS từng luồng + số đo JSON trên đĩa); O8 chưa chạy lại (B9 chưa xong — nợ đợt 101).

## 4. Nợ mở cho đợt 101

1. B9 kiểm chứng độc lập B1–B8 + O8 cả 2 engine (chưa xong).
2. G1 đóng hay chưa — user quyết (metric G5 hay M2; A9 đợt 99: dưới M2 khung 16/20 không đạt được, tối đa 15/20).
3. 2 MiB — điểm nối chính xác (handoff typefind↔webkitwebsrc là hẹp nhất; splice đúng 2.097.152 byte; pause/resume 2019 đã bị bác).
4. Ghost residual — phase jitter presented-frame↔currentTime (±1, thỉnh thoảng ±2) là thủ phạm; fix A2 không hiệu quả; cần fix mới theo hướng jitter.
5. Re-arm — f4 cửa sổ còn mở cho burst dài-gap đáp xa (> ~1,5 s); tail-expiry chưa triệt để; ARM-HELD cần thêm lượt đo.
6. Blur parity — B-band wk n=132 vẫn không bimodal; D fix-3 sàn ~1% (12/783); cap D r7 vẫn mở; presented mislabel −1 (r15 c1 fi=8) chưa chứng minh.
7. Zombie pump — khe early-return ngoài đời chưa quan sát được (37 biên, 0 ca).
8. EPERM: probe #20 + khoảng mù #19 (bắt đầu sau reboot #24 ~21:41:50Z); cron riêng 10 phút vẫn chờ user quyết; giờ từng giây reboot #16 vẫn chưa chốt.
9. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định parent đợt 92) — vẫn 0 lần chạy thành công.
10. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
11. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
12. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 100: 8 luồng, **23 entry / 8 file** (B1 3, B2 2, B3 6, B4 4, B5 2, B6 1, B7 4, B8 1).
- Closing đợt 100: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §29).
- **Tổng chờ push sau đợt 100: 2390 entry / 341 file batch / 1442 file duy nhất** (đợt 67–99: 2365/332/1426; đợt 100: 25/9 — 23 entry luồng + closing 2 entry / +16 file duy nhất (LIMITS gộp mới + 15 file luồng mới; gap analysis đã stage từ trước. Đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
- B9 không stage (chưa xong, không LIMITS/batch).

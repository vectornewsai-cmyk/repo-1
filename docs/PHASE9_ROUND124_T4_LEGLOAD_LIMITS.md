# PHASE9_ROUND124_T4_LEGLOAD_LIMITS.md — F2 leg TẢI hiệu chỉnh DEF v0.2: Vừa 6/6 VALID (6/6 CHẬM) + Nặng 6/6 VALID (6/6 CHẬM) trên cây BASELINE, boot #68? — chế độ chậm TÁCH THEO BAND; tickRate tách Yên↔Vừa/Nặng, KHÔNG tách Vừa↔Nặng

**Ngày:** 16–17/11/2026. **Luồng:** T4 (Phase 9 đợt 124, lượt cron 00:35 +07 17/11/2026).
**Nhiệm vụ (quyết parent đợt 123 §12.1):** leg tải hiệu chỉnh DEF v0.2 —
thu dữ liệu band Vừa (rồi Nặng nếu khả thi) trên cây baseline, cùng boot,
để hiệu chỉnh ngưỡng Yên/tickRate. **Kết quả: CHẠY ĐƯỢC CẢ HAI LEG —
Vừa 6/6 VALID + Nặng 6/6 VALID, 12/12 run, 0 VOID, 0 reboot giữa leg.**
Không sửa production. Không push, không release/tag. Verdict KHÔNG ĐẠT
đợt 120 VẪN ĐỨNG (cửa (a) — leg này chỉ là dữ liệu hiệu chỉnh, không xét
lại verdict, không gộp số với bộ verdict hay bộ Yên đợt 123).

**Cây lúc đo:** baseline preview.tsx `03bf029f` / media.ts `2c384ed1`
(verify trước/sau leg, không đổi). **Boot đo:** `#68?` (số tạm — T5-124
đếm, T6 recount mù #37), btime `2026-11-16 17:33:51Z`, boot_id
`69359761-1650-4956-b3cb-481410689a9b`. HEAD không đổi (repo-1 không phải
git checkout — quản lý qua push-files; md5 là kiểm chứng cây).

## §0. Kết luận trước mọi chi tiết

1. **Chế độ chậm TÁCH THEO BAND — đây là phát hiện chính của leg này.**
   Band Yên đợt 123: T_startup median 0,337 s, **0/6 chậm**. Band Vừa
   đợt này: median **1,843 s, 6/6 chậm** (>1,2 s). Band Nặng: median
   **2,219 s, 6/6 chậm**. Câu hỏi DEF §6(ii) có đáp án: **CÓ, chế độ
   chậm tách theo band tải** — ranh giới nằm đâu đó giữa avg60 ~13%
   (cao nhất Yên) và ~66% (thấp nhất Vừa); **ngưỡng chuyển chính xác
   CHƯA xác định** (khoảng trống 13–66% chưa đo — không tuyên bố số).
2. **tickRate tách band theo 2 mức, KHÔNG tách Vừa↔Nặng.** Yên:
   69,5–72,6 tick/s (mean 71,50). Vừa: 15,3–20,3 (mean 18,54). Nặng:
   16,5–17,4 (mean 16,77). Gộp 3 band (n=18): r(avg60, tickRate) =
   **−0,97** — tương quan +0,90 của T2-120 được giải thích: nó so sánh
   Yên vs Nặng (chênh lệch lớn), không phải trong-band. TRONG từng
   band hẹp, tickRate bão hòa (Yên r=−0,13 — giữ nguyên kết luận đợt
   123). **Đề xuất v0.2: tickRate là chỉ báo đói 2 mức (nhàn ~70+
   vs đói ~15–20), KHÔNG dùng để tách Vừa↔Nặng** (chênh chỉ ~1,8
   tick/s, khoảng chồng nhau).
3. **Ngưỡng band v0.1 ĐỨNG, không cần dời.** Vừa 30–80% đạt được với
   3 hog (không phải 2 như pilot gợi ý); Nặng >80% đạt được với 8 hog
   (không phải 6). Cả 12 run đều trong band (bracket + mean). Bài học:
   ánh xạ hog→PSI phụ thuộc ambient — **chỉ dial theo PSI đọc được,
   không dial theo số hog** (DEF §4.2 đã đúng).
4. **Pha (b) T_seek MIỄN NHIỄM với tải:** 0,000 s ở cả 18 run (Yên +
   Vừa + Nặng) — seek tức thì một khi metadata đã load; toàn bộ chậm
   nằm ở pha startup/metadata. totalFrames rơi theo tải (Yên 384 →
   Vừa 161–279 → Nặng 163–213), dropped frames tăng (0 → 2–7 → 6–11).
5. **Tương quan gộp 3 band (n=18):** r(avg60, T_startup)=**+0,87**;
   r(avg60, threadsR)=**+0,98** (threadsR đơn điệu 2,0 → 9,3 → 13,8 —
   xác nhận vai trò trục phụ); r(tickRate, T_startup)=−0,87.
   **KHÔNG kết luận nhân quả** (1 boot, 1 cây, sibling đang chạy,
   n=6/band); tương quan trong-band yếu/hỗn hợp (Vừa +0,36 / Nặng
   −0,57 cho T_startup) — trong-band, PSI không dự báo T_startup.
6. **Leg chạy sạch:** gate ĐẠT poll #1 (17:56:40Z), driver exit 0
   (18:21:59Z), 0 reboot trong lúc đo, 0 hog sót, cây không đổi,
   registry không đổi trong run, full PSI = 0 mọi run, đủ mẫu PSI
   (41–45 mẫu/run). Không có sự cố nào cần sửa giữa chừng.

## §1. Boot + gate (gate ĐẠT ngay poll #1)

- **Boot #68?** (btime 17:33:51Z, boot_id `69359761…`): reboot mới sau
  #67? 14:52:19Z (gap danh nghĩa 2h41'32"). T5-124: replay NHANH
  (configure 17:35:42Z boot +1m51s, installs xong 17:38:42Z boot
  +4m51s, dpkg 2→1509 dòng, gói cuối gstreamer1.0-tools 17:38:42Z;
  2 gói từng thiếu ở #65? — gstreamer1.0-plugins-bad 17:37:27Z,
  gstreamer1.0-libav 17:37:37Z — đều được cài ở boot này).
  POSTBOOT_PASS viết 17:42:03Z (boot +8m12s), xác nhận lại exit 0 lúc
  17:43:48Z — **PASS NHỜ REPLAY, không repair**. Luật repair dạng (C)
  không kích hoạt đợt này (replay tiến triển).
- **Gatewaiter T4** (bản đợt 124, luật STALE + đếm apt bằng `pgrep -x`):
  poll #1 17:56:40Z — postboot_exit=0, aptx=0, dpkgx=0, dpkg_lines=1509,
  RAMavail=2479 MB, preview_md5=03bf029f, t5flag=PASS-co (cờ khớp
  boot_id hiện tại) → **GATE 0 ĐẠT ngay poll #1**. Watcher kích hoạt
  driver 17:57:09Z.
- **Ambient lúc mở driver:** avg60 3,60% (máy yên), RAM avail 2377 MB,
  0 tiến trình WebKit. Ambient dao động mạnh trong phiên (avg60 lúc
  test psi_avg60 17:50Z là 23,21% — sibling bận; lúc mở driver chỉ
  3,60%) — ghi rõ vì nó ảnh hưởng dial (xem §2).

## §2. Kết quả leg tải — 12/12 VALID (bảng đầy đủ)

Cấu hình: MSB4RB8 (J2 4194304 + L2 ring 8388608, L2 max-size UNSET),
Q8SEEKFAST c8, fresh-element, wall 30 s, seekImmediate 16, shim
`l2_queue2_probe.so` md5 `b208e8de`, lock v2 `t4-round124` cổng 8965,
Xvfb :197. Hog: `nice -n 19 node -e "while (true) { Math.sqrt(...) }"`,
quản lý bằng PID chính xác (file hogs.pids), kill tường minh cuối
driver — 0 hog sót.

### 2.1 Leg Vừa — 3 hog (dial: 2 hog → 24,30% NGOÀI band; 3 hog → 53,85% ĐẠT)

| Run | T_startup trộn (s) | T_startup thuần-blob el2 (s) | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean trong run (%) | full avg10 max (%) | threadsR mean | tickRate (tick/s) | load1 trước/sau (ĐỐI CHIẾU) | hold (s) | frames (dropped) | seekImmMs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2,481 | 1,992 | 0,000 | 75,33 / 66,19 | 65,75 | 0 | 8,7 | 19,63 | 3,82 / 6,13 | 90 | 266 (2) | 2114 |
| 2 | 1,602 | 1,602 | 0,000 | 65,14 / 66,42 | 67,13 | 0 | 8,7 | 20,33 | 5,96 / 2,65 | 300 | 256 (6) | 1717 |
| 3 | 1,527 | 1,527 | 0,000 | 66,26 / 66,73 | 67,56 | 0 | 8,7 | 20,23 | 2,44 / 1,62 | 365 | 251 (4) | 1621 |
| 4 | 2,083 | 2,083 | 0,000 | 65,97 / 72,34 | 69,02 | 0 | 10,6 | 15,28 | 1,49 / 1,03 | 428 | 161 (7) | 2208 |
| 5 | 2,992 | 2,668 | 0,000 | 71,99 / 76,98 | 75,64 | 0 | 10,3 | 16,60 | 0,95 / 0,64 | 496 | 245 (4) | 2810 |
| 6 | 1,509 | 1,509 | 0,000 | 76,78 / 71,09 | 73,18 | 0 | 8,9 | 19,16 | 0,59 / 4,15 | 566 | 279 (2) | 1728 |

- **check-valid-124t4.py (S9_BAND=MEDIUM): 6/6 VALID** (shim OK mọi run).
  Analyzer DEF: `VALID (DEF v0.1): 6/6`.
- **Pha (a) tham khảo:** T_startup median **1,843 s**, p90 2,992 s,
  **slow (>1,2 s) = 6/6** → pha (a) KHÔNG ĐẠT trên bộ Vừa này (chỉ
  tính tham khảo — leg tải không xét bar/verdict, xem §3).
  Thuần-blob el2: median 1,797 s — chậm nằm ở pipeline blob thật,
  không phải artefact đo trộn el1-http (run 1 trộn 2,481 vs blob
  1,992: el1-http chỉ cộng ~0,5 s).
- **Pha (b) tham khảo:** T_seek max **0,000 s** (seeking/seeked cùng
  timestamp ms ở cả 6 run) → pha (b) ĐẠT.
- **PSI trong run:** n mẫu 41–45/run (1 Hz, đủ); avg60 mean 65,75–
  75,64%; mean mẫu con 5 s khớp mean toàn mẫu trong 0,38 điểm.
  Bracket trước/sau mọi run trong 30–80% (thấp nhất 65,14%, cao nhất
  76,98%); không run nào chạm ngưỡng VOID (a) <20% hay >90%, (b)
  ngoài 30–80%. Full avg10 max = 0 mọi run. threadsR mean 8,7–10,6.
  Hog burn: utime delta 62.227 ticks = 622,3 CPU-s trong ~629 s
  (hold + 6 run) ≈ **0,99 CPU tổng ≈ 0,33 CPU/hog** — khớp pilot
  (0,26–0,54 CPU/hog). Hog alive 3/3 trước/sau mọi run.
- **Ghi chú trong run:** avg60 trong leg trôi lên dần (mean run 1
  65,75% → run 5 75,64%) — ambient sibling tăng trong lúc đo, không
  phải do hog đổi (hogs giữ 3 suốt leg). Run 4 memAvailMB_min =
  **210 MB** (sibling ramp-up) — run vẫn VALID (DEF không có tiêu chí
  RAM); ghi rõ để đối chiếu. seekImmMs 1621–2810 ms (Yên: 271–522 ms).
  totalFrames 161–279 (Yên: 384 mọi run) — video phát chậm lại dưới
  tải. Registry mtime không đổi trong run (gstRegChanged=false).
  Boot age lúc bắt đầu run: 1836–2167 s (boot +30'36" đến +36'07").

### 2.2 Leg Nặng — 8 hog (dial: 6 hog → 77,94% NGOÀI band; 8 hog → 84,82% ĐẠT)

| Run | T_startup trộn (s) | T_startup thuần-blob el2 (s) | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean trong run (%) | full avg10 max (%) | threadsR mean | tickRate (tick/s) | load1 trước/sau (ĐỐI CHIẾU) | hold (s) | frames (dropped) | seekImmMs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 3,313 | 2,857 | 0,000 | 87,11 / 89,71 | 89,23 | 0 | 13,7 | 17,39 | 0,96 / 0,56 | 90 | 191 (9) | 3039 |
| 8 | 1,590 | 1,590 | 0,000 | 89,57 / 89,88 | 90,40 | 0 | 14,2 | 16,72 | 0,52 / 0,49 | 152 | 213 (6) | 1590 |
| 9 | 1,685 | 1,685 | 0,000 | 89,12 / 92,31 | 90,97 | 0 | 13,0 | 16,54 | 0,42 / 3,57 | 218 | 165 (9) | 1813 |
| 10 | 2,353 | 2,353 | 0,000 | 92,47 / 90,87 | 91,76 | 0 | 14,6 | 16,67 | 3,92 / 9,68 | 282 | 163 (11) | 2404 |
| 11 | 2,084 | 2,084 | 0,000 | 90,90 / 90,73 | 91,43 | 0 | 14,2 | 16,58 | 10,18 / 12,17 | 349 | 209 (8) | 2169 |
| 12 | 2,901 | 2,901 | 0,000 | 89,93 / 91,36 | 90,33 | 0 | 13,0 | 16,71 | 12,15 / 7,69 | 408 | 196 (8) | 2577 |

- **check-valid-124t4.py (S9_BAND=HEAVY): 6/6 VALID** (shim OK mọi run).
  Analyzer DEF: `VALID (DEF v0.1): 6/6`.
- **Pha (a) tham khảo:** T_startup median **2,219 s**, p90 3,313 s,
  **slow (>1,2 s) = 6/6** → pha (a) KHÔNG ĐẠT trên bộ Nặng này
  (tham khảo — xem §3). Thuần-blob el2: 1,590–2,901 s.
- **Pha (b) tham khảo:** T_seek max **0,000 s** → pha (b) ĐẠT.
- **PSI trong run:** n mẫu 42–45/run; avg60 mean 89,23–91,76%;
  mean mẫu con 5 s khớp mean toàn mẫu trong 0,08 điểm. Bracket
  trước/sau mọi run >80% (thấp nhất 87,11%, cao nhất 92,47%); không
  run nào chạm ngưỡng VOID (a) <70%. Full avg10 max = 0 mọi run.
  threadsR mean 13,0–14,6. Hog burn: utime delta 56.110 ticks =
  561,1 CPU-s trong ~489 s ≈ **1,15 CPU tổng ≈ 0,14 CPU/hog** —
  mỗi hog cháy ít hơn leg Vừa (0,33 CPU/hog) dù nhiều hog hơn:
  **bão hòa ngân sách host** (DEF §7 đã cảnh báo; 6 vs 8 hog không
  tăng CPU cháy tổng bao nhiêu — tổng chỉ ~1 CPU cả hai leg).
  Hog alive 8/8 trước/sau mọi run.
- **Ghi chú trong run:** seekImmMs 1590–3039 ms; totalFrames 163–213,
  dropped 6–11. load1 lại nói ngược: run 11 load1 10,18/12,17 trong
  khi run 7 load1 0,96/0,56 ở cùng PSI ~90% — thêm bằng chứng load1
  vô hiệu (không dùng trong bất kỳ tiêu chí nào). Boot age lúc bắt
  đầu run: 2499–2837 s (boot +41'39" đến +47'17").

## §3. Bar F2 + verdict — leg tải KHÔNG xét verdict

- **Bar tham khảo từng band:** pha (a) KHÔNG ĐẠT ở cả Vừa (6/6 chậm)
  và Nặng (6/6 chậm); pha (b) ĐẠT ở cả hai band. Đây là số liệu hiệu
  chỉnh, **không phải verdict** — prereg §0.1 đã đăng ký rõ: leg này
  KHÔNG xét bar F2 theo nghĩa verdict, KHÔNG xét lại verdict đợt 120.
- **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (quyết parent cửa (a) đợt
  123 §12.1). Leg này không thay đổi gì về verdict — nó chỉ trả lời
  câu hỏi hiệu chỉnh DEF: chế độ chậm có tách theo band không (CÓ —
  xem §4).
- **So sánh tham khảo 3 band (KHÔNG kết luận nhân quả):**

| Band | n | T_startup median (s) | p90 (s) | chậm (>1,2 s) | T_seek max (s) | tickRate mean | threadsR mean |
|---|---|---|---|---|---|---|---|
| Yên (đợt 123, boot #67?) | 6 | 0,337 | 0,656 | 0/6 | 0,001 | 71,50 | 2,0 |
| Vừa (đợt này, boot #68?) | 6 | 1,843 | 2,992 | 6/6 | 0,000 | 18,54 | 9,3 |
| Nặng (đợt này, boot #68?) | 6 | 2,219 | 3,313 | 6/6 | 0,000 | 16,77 | 13,8 |

  Lưu ý: Yên đo trên boot khác (#67?) — so sánh giữa các band vẫn
  có nhiễu boot; nhưng bước nhảy 0,337 → 1,843 s (×5,5) và tickRate
  71,5 → 18,5 (÷3,9) lớn hơn mọi nhiễu boot từng thấy giữa các leg
  Yên (median Yên các đợt 0,3–0,5 s).

## §4. Đầu vào cho DEF v0.2 (theo DEF §6 — dữ liệu leg tải đầu tiên)

Tính trên 18 run valid gộp 3 band (Yên 123 + Vừa + Nặng đợt này),
script `hidden_files/round124-t4/corr-124t4.py` (kết quả
`corr-3band.json`):

- **(i) PSI avg60 thực tế lúc browser chạy ở mỗi band:** Yên 4,38–
  13,14% (mean các run 7,02%); Vừa 65,75–75,64% (mean 69,71%);
  Nặng 89,23–91,76% (mean 90,69%). Cả hai band tải đều đạt được
  khi browser chạy, bracket ổn định trong band. **Ngưỡng v0.1
  ĐỨNG, không đề xuất dời:** Yên <30%, Vừa 30–80%, Nặng >80% —
  cả ba band đều tách nhau rõ (khoảng trống giữa các cụm: Yên max
  13,14% → Vừa min 65,75% = 52 điểm; Vừa max 75,64% → Nặng min
  89,23% = 14 điểm).
- **(ii) T_startup theo band PSI — chế độ chậm CÓ tách theo band.**
  Yên 0/6 chậm → Vừa 6/6 → Nặng 6/6 (median 0,337 → 1,843 →
  2,219 s). Gộp 3 band: r(avg60, T_startup) = **+0,87**. TRONG từng
  band, tương quan yếu/hỗn hợp (Yên +0,76; Vừa +0,36; Nặng −0,57)
  — trong-band, PSI không dự báo T_startup; chỉ có bước nhảy GIỮA
  các band là rõ. **Ranh giới chuyển chưa xác định:** khoảng trống
  avg60 13–66% chưa có dữ liệu — KHÔNG tuyên bố ngưỡng chuyển số.
  Đề xuất đợt sau (nếu parent muốn): leg ở mức hog trung gian
  (vd 1–2 hog trên ambient yên) để dò ranh giới.
- **(iii) tickRate theo band PSI — ĐIỀU CHỈNH kết luận đợt 123.**
  Gộp 3 band: r(avg60, tickRate) = **−0,97**; r(tickRate,
  T_startup) = −0,87. Kết luận đợt 123 ("tickRate không tách mức
  tải", r=−0,13) chỉ đúng TRONG band Yên hẹp — khi có đủ 3 band,
  tickRate tách RÕ Yên↔Vừa/Nặng (71,50 vs 18,54/16,77). NHƯNG
  tickRate KHÔNG tách Vừa↔Nặng (18,54 vs 16,77 — chênh 1,77 tick/s,
  khoảng chồng nhau: Vừa 15,28–20,33 vs Nặng 16,54–17,39) và bão hòa
  trong mỗi band. **Đề xuất v0.2: tickRate giữ vai trò chỉ báo đói
  2 mức (nhàn ~70+ tick/s vs đói ~15–20 tick/s), KHÔNG dùng để
  tách mức tải trong một band, KHÔNG dùng để tách Vừa↔Nặng.**
  Tương quan +0,90 của T2-120 nay đã giải thích được: nó so sánh
  Yên vs Nặng (chênh lệch lớn giữa band), không phải trong-band.
- **(iv) threadsR (trục phụ):** r(avg60, threadsR) = **+0,98** gộp
  3 band; mean theo band 2,0 → 9,3 → 13,8 — đơn điệu, xác nhận vai
  trò trục phụ (DEF §2). Không đề xuất dùng threadsR làm trục chính
  (PSI vẫn là thước đo stall trực tiếp).
- **(v) load1 (đối chiếu ONLY):** lại vô hiệu — run 11 Nặng load1
  10,18/12,17 vs run 7 Nặng 0,96/0,56 ở cùng PSI ~90%; run 5 Vừa
  load1 0,95/0,64 trong khi run 1 Vừa 3,82/6,13. Không dùng trong bất
  kỳ tiêu chí nào, đúng DEF.

## §5. Prereg + độ lệch (ghi rõ, không giấu)

- **Prereg** `hidden_files/round124-t4/prereg-legload.md` viết 17:4xZ,
  TRƯỚC mọi phép đo. **§0.2 validate ghi TRƯỚC khi đo:** analyzer
  124t4 BAND=YEN tái hiện đúng dữ liệu 123 (6/6 VALID, median 0,337,
  p90 0,656); check-valid BAND=YEN ra VALID_COUNT=6/TOTAL=6;
  `psi_avg60()` đọc đúng 23,21% khớp dòng `some`; bracket TEST-bracket
  ghi đúng rồi xóa về `{}`. Không có điều chỉnh định nghĩa/ngưỡng
  nào sau khi đo bắt đầu.
- **Lọc band mới (đã đăng ký trong prereg §0.2):** analyzer +
  check-valid chỉ tính case có bracket band khớp `S9_BAND` (thiếu
  trường band → mặc định YEN); case khác band in SKIP, không tính
  vào TOTAL. Đã kiểm chứng trên dữ liệu 123 (6/6 VALID giữ nguyên)
  và trên OUT legload (MEDIUM lọc đúng 6 run Vừa, HEAVY lọc đúng
  6 run Nặng, 6 run còn lại SKIP).
- **Không có smoke run riêng** (như đợt 123 §5): instrumentation đã
  kiểm chứng bằng (a) validate analyzer trên dữ liệu đợt 123 trước
  khi đo (khớp đúng), (b) `node --check` runner + `bash -n` 3 script
  driver/gatewaiter/watcher + `python3 -m py_compile` analyzer/
  check-valid/bracket, (c) test `psi_avg60()` + bracket thật, và (d)
  chính run 1 mỗi leg cho thấy sampler avg60 + rafTickRate ghi đủ số
  (không null) ở cả 12 run. Không run nào bị tính sai vì thiếu smoke
  run; ghi rõ để đợt sau quyết có giữ yêu cầu smoke run riêng không.
- **Sửa lỗi tiềm ẩn TRƯỚC khi đo (không phải sau khi đo):** bản nháp
  đầu của driver dùng `trap EXIT` để kill hog + gọi `dial_leg` trong
  command substitution — trap sẽ chạy trong subshell và giết hog
  giữa leg. Đã sửa TRƯỚC khi chạy driver: bỏ trap, kill hog tường
  minh cuối driver + cuối mỗi leg (spawn leg sau kill hog leg trước)
  + lúc mở driver (dọn hog sót). Không ảnh hưởng số liệu (sửa xong
  trước khi driver chạy lần đầu 17:57:09Z).
- **Độ lệch nhỏ so với prereg §2:** tên case leg Nặng là run7..12
  trong CÙNG OUT legload (đúng prereg); bracket JSON ghi rõ band
  từng run (đúng prereg §4.3). Không lệch nào khác.
- **Nhiễu chéo sibling (prereg §8):** hog nice-19 nâng avg60 toàn
  máy lên ~65–92% trong khung 17:57–18:22Z — các luồng sibling đang
  chạy song song thấy ambient PSI cao trong thời gian đó. Hog là
  nice-19 nên không cướp CPU tiến trình thường; đã kill sạch 0 sót
  lúc 18:21:57Z (xác nhận `hogs.pids` rỗng + 0 tiến trình hog).
  RAM: hog node nhẹ, không phải nguyên nhân RAM ghim (RAM avail lúc
  mở driver 2377 MB; T9 điều tra RAM ghim độc lập).

## §6. Nợ mở cho đợt sau

1. **DEF v0.2:** dữ liệu leg tải đã đủ để viết v0.2 theo §4 (giữ
   ngưỡng 3 band; tickRate = chỉ báo đói 2 mức; ranh giới chuyển
   chế độ chậm chưa xác định — khoảng trống avg60 13–66%). Viết DEF
   v0.2 là việc của parent/luồng được giao — T4 không tự đổi DEF.
2. **Ranh giới chuyển chế độ chậm (avg60 13–66%) chưa đo:** nếu parent
   muốn dò, cần leg trung gian (1–2 hog trên ambient yên) — chưa
   đăng ký, không tự chạy.
3. **Verdict F2:** vẫn đứng (cửa (a)) — không có gì thay đổi ở đợt này.
4. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35/#39 chờ user
   quyết (mù #39 J đã CHẤP NHẬN ĐỂ MỞ đợt 123 §12.2); `ci-security.yml`
   vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ thử lại khi
   RAM đổi (u2net là fallback chính thức); R9 (a) vẫn chờ user
   (nhắc lần 10 ở đợt này — do T10 nhắc).

## §7. File và dữ liệu

- LIMITS này: `docs/PHASE9_ROUND124_T4_LEGLOAD_LIMITS.md`.
- Runner T4: `benchmarks/render/f2_startup_probe_124t4.mjs`
  (85.975 B — **>37.768 B, cần `ENABLE_PRIVSEP=0` khi push**).
- Analyzer T4: `benchmarks/render/f2_startup_analyze_124t4.py`
  (23.111 B).
- Dữ liệu thô (KHÔNG stage): `benchmarks/results/webkit-blob-flaky-124t4-f2startup-legload.json`
  (341.355 B, md5 `b4642045a2be655b0cfe6283c026451b`, 12 case, round
  `phase9-round124-t4-legload`); `hidden_files/round124-t4/`
  (prereg-legload.md, run-124t4-gatewait.sh, run-124t4-all.sh,
  t4-watch-gate.sh, bracket-124t4.py, check-valid-124t4.py,
  corr-124t4.py, corr-3band.json, brackets-124t4.json (12 bracket),
  vcut-vite-lock-v2.frozen.sh md5 cd0c05c1, gate0-wait-t4.log (1 poll,
  GATE ĐẠT), postboot-t4-gatewait-1.log, postboot-t4-driver.log,
  t4-watch.log, t4-driver-watch.log, t4-driver.out, t4-run-1..12.log,
  t4-analysis-medium.txt, t4-analysis-heavy.txt, xvfb-197.log,
  pull/ (12 pull log), gst/ (12 gst log), bundle/ (media-pool-bundle
  do runner tự tạo lúc đo), hogs.pids (rỗng sau khi kill),
  dial-MEDIUM.hogs (3), dial-HEAVY.hogs (8)).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round124-t4-legload.txt`
  (NUL-delimited; **3 entry**: runner 124t4, analyzer 124t4, LIMITS này)
  — đã verify read-back. KHÔNG push.
- Cờ: `hidden_files/round124-t4.done` (tạo sau khi ghi LIMITS + stage
  xong). Log lượt: append `hidden_files/build-loop-log.md`.

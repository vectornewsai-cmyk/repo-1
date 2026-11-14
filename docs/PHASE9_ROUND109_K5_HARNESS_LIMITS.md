# Đợt 109 K5 — Harness E1 dưới TẢI NẶNG, đủ ≥7 lần hoàn thành (nối J7) — BAR VẪN CHƯA ĐẠT, 0 lần hoàn thành mới

Ngày: 13–14/11/2026 (lượt cron 06:35 +07 14/11; K5 chạy 23:41Z–00:19Z).
Máy đo: VM này (CPU-only, Chromium qua Xvfb + CDP `--disable-gpu`;
boot #36 `ab33c58f…` từ 22:53:56Z, KHÔNG có reboot trong lúc K5 chạy).
RAM khả dụng 934–1814 MB trong lúc đo; KHÔNG sửa production, KHÔNG sửa
harness, KHÔNG push, KHÔNG release/tag. Harness KHÔNG đổi một byte
(md5 giữ nguyên, xem §2).

Nợ: LIMITS gộp đợt 108 §7 — G4 flake gộp 2/35 = 5,7%, bar prereg chưa đạt
(cần 0 flake trên ≥7 lần E1 hoàn thành tới G4 dưới tải nặng đầy đủ; mới
6/7 là I6); keydown chậm gộp 56 lần / 748 slot / 1496 toggle, max 2197 ms.

## 1. Kết luận ngắn

- **G4 flake: 0 mẫu mới — và BAR PREREG VẪN CHƯA ĐẠT.** Cả 3 lần E1
  run23–25 đều **chết TRƯỚC G4** (không lần nào tới được G4, không
  report nào): run23 chết do ENOSPC (vite của K1 bật giữa chừng),
  run24 chết do timeout chờ project mẫu load + hook, run25 chết do
  timeout chờ app mount. Số lần hoàn thành tới G4 DƯỚI TẢI NẶNG ĐẦY ĐỦ
  vẫn là **6 (chỉ I6)** — bar ≥7 chưa đạt, không nhích thêm lần nào.
- **Tỉ lệ gộp KHÔNG ĐỔI:** chặt-chỉ-report **2/35 = 5,7% (Wilson 95%
  [1,6%, 18,6%])**; tính cả run21 (G4 PASS trong log, không report)
  **2/36 = 5,6% (Wilson [1,5%, 18,1%])**. Keydown chậm gộp KHÔNG ĐỔI:
  **56 lần / 748 slot / 1496 toggle, max 2197 ms** (0 lần E1 mới có
  report nên đóng góp 0). Kỷ lục 2197 ms (I6) không đổi.
- **Tải nặng — kết quả lẫn lộn, ghi đúng cả 2 mặt:** thí nghiệm settle
  cho thấy phương pháp A (30 spin) **ĐẠT dial sau 70 s** (load5 9,76)
  lúc máy vừa yên; nhưng trong driver, A **TRƯỢT** ở run23 (load5 tụt
  7,96 → 4,34 trong 180 s dù 30 spin vẫn chạy, threads-R ~40 — throttle
  tái hiện đúng như J7), rồi **ĐẠT** ở run24 sau 130 s khi throttle
  nhả đột ngột (load1 0,37 → 22,89). Phương pháp B (A + 4 I/O churn)
  đạt dial sau 40 s ở run23 (load1 28,97 / load5 11,42) — nhưng B chưa
  bao giờ được kiểm chứng bằng dial fps (không lần nào tới G3→G4 nên
  chưa biết B là tải thật hay tải giấy; xem §6).
- **Lỗi dial gate mới phát hiện (tự nhận, §6.3):** ở run25, gate báo
  "A ĐẠT sau 20 s" trong khi load1 tức thời chỉ 2,23/1,82 (spin bị
  throttle hoàn toàn) — load5 11,87 lúc đó chỉ là **trung bình 5 phút
  còn sót lại từ tải của run24**, không phải tải đang sống. Gate chỉ
  kiểm load5 nên đã cho chạy E1 trên tải chết. Đợt sau PHẢI kiểm thêm
  load1 (tải sống) ở gate (xem §9).
- **Căng thẳng cốt lõi của bar này (bằng chứng mới):** tải đủ mạnh để
  load5 ≥ 8 trong cửa sổ G3→G4 cũng chính là tải làm chết các bước
  TRƯỚC G3 — 2/3 lần chết ở mount/project-load timeout dưới tải
  (run24, run25), 1/3 chết vì ENOSPC. Muốn chạm bar ≥7 thì phải vượt
  qua được các bước tiền-G3 dưới đúng tải đó, không chỉ đạt dial.
- **Phối hợp:** vite gate đã làm đúng việc — chờ ~9 phút ở run24 cho
  tới khi vite của K3 tắt mới bật vite của mình; nhưng run23 vẫn chết
  ENOSPC vì vite của K1 bật GIỮA chừng (gate chỉ kiểm lúc bắt đầu).
  K9 chưa đóng băng cây trong lúc K5 chạy (poll #0–#4, xem §8).
- **Không reboot** trong lúc K5 chạy (boot #36 từ đầu tới cuối).

## 2. Harness đã đổi — KHÔNG đổi gì

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` md5
  **`ae6cd34a7dff3f6bda62199b5ab6c6fc`** trước/sau MỌI lần chạy (ghi trong
  run-k5.log đầu/cuối mỗi lần) — khớp đúng md5 I6/J7.
  `preview.tsx` md5 **`ced42efd785724c8c0d1b16fc32c7341`** trước/sau mọi
  lần — giữ nguyên, không sửa production. `node --check` script harness
  PASS đầu driver.
- Chỉ thêm mới: prereg + driver + script tạo tải + script thí nghiệm
  tải + script phân tích + log/report trong
  `hidden_files/round109-k5/` và file LIMITS này. Driver `run-k5.sh`
  dựa trên `run-j7-resume.sh` (giữ watcher gate, ENOSPC đếm liên tiếp,
  summ_e1/g4line, sampler 10 s) + THÊM: vite gate (chờ vite luồng khác,
  poll 60 s, tối đa 30 phút) + dial gate (chỉ chạy E1 khi load5 ≥ 8 ở
  2 mẫu 10 s liên tiếp; thử A rồi B rồi C) + verdict dial trong cửa sổ
  G3→G4 + dừng ngay khi có 1 lần hoàn thành đạt dial.
- Analyzer `analyze-k5-g4-keydown.py` dựa trên `analyze-j7-g4-keydown.py`
  (đổi hằng lịch sử thành: E1 hoàn thành chặt-chỉ-report 35 lần /
  2 flake; keydown 56 lần / 748 slot / 1496 toggle / max 2197 ms; chạy
  run23–25; đổi tên file load `load-k5-runN.txt`). LƯU Ý: analyzer chỉ
  đếm lần hoàn thành khi CÓ report (như J7) — với đợt này 0 lần mới nên
  cả 2 số gộp (chặt 2/35, tính cả log 2/36) đều giữ nguyên, không có
  trường hợp log-verdict nào cần cộng tay.

## 3. E1 run23–25 — kết quả đầy đủ

| Lần chạy | Bắt đầu (Z) | Exit | Pass | G5 | G3→G4 | G4 tap/R | Tải lúc chạy | Kết cục |
|---|---|---|---|---|---|---|---|---|
| E1-23 | 23:47:11 | 2 | — (không report) | — | — (chưa tới G4) | — | Gate: A trượt 180 s, B đạt 40 s (load1 28,97 / load5 11,42); lúc E1: load 32–40 | ENOSPC (vite K1 bật giữa chừng) → mount timeout 23:56:58 |
| E1-24 | 00:06:04 | 2 | — | — | — | — | Gate: A đạt 130 s (load1 22,89 / load5 9,50); lúc E1: load1 40,84 → 2,54 | Mount OK 00:10:31; timeout chờ project mẫu load + hook 00:13:41 |
| E1-25 | 00:13:45 | 2 | — | — | — | — | Gate: A "đạt" 20 s NHƯNG load1 chỉ 1,82 (load5 11,30 là số cũ sót lại — xem §6.3); lúc E1: load1 1,3 → 39,57 | Vite khỏe, 0 ENOSPC; mount timeout 00:19:06 dưới burst load1 ~39 |

- Cả 3 lần: vite dev bật thành công (run23 :5581 ready 8906 ms rồi
  crash ENOSPC; run24 :5580 ready 13613 ms; run25 :5580 ready 5999 ms);
  0 lần tới G0 (không có dòng `PASS G0` nào trong cả 3 log — mọi lần
  chết ở mount hoặc project-load, TRƯỚC mọi gate đo).
- Run23: vite lên 23:52:05, mount timeout 23:56:58 (~4,9 phút chờ).
  Run24: vite lên 00:09:12, mount OK 00:10:31, modal đóng 00:10:40,
  project-load timeout 00:13:41 (3 phút chờ, đúng mẫu I6 run14).
  Run25: vite lên 00:14:26, mount timeout 00:19:06 (~4,7 phút chờ).
- RAM trước mỗi lần: run23 1257 MB, run24 934 MB, run25 1468 MB — đều
  ≥ 600 MB, không lần nào dừng sớm vì RAM, không dấu hiệu OOM.
- Tải đã dừng sạch sau mỗi lần (0 spin/io/fork còn sống sau driver;
  kiểm cuối 00:19Z: `load_alive=0`; không còn vite/chrome của K5 sót —
  các dòng `pgrep vite` còn lại lúc kiểm chỉ là chính lệnh kiểm tra).

### 3.1 Dial gate từng lần (mẫu 10 s, ghi trong run-k5.log)

| Lần | Phương pháp | Kết quả gate | Chi tiết |
|---|---|---|---|
| 23 | A (30 spin) | KHÔNG ĐẠT sau 180 s | load1 7,83 → 0,60; load5 7,96 → 4,34; threads-R 35–44 (spin sống nhưng bị throttle, đúng mẫu J7) |
| 23 | B (A + 4 I/O churn) | ĐẠT sau 40 s | load1 8,38 → 28,97; load5 5,83 → 11,42; threads-R ~42–53 |
| 24 | A (30 spin) | ĐẠT sau 130 s | load1 ~0,3–0,4 (throttle) tới t+70 s rồi NHẢ đột ngột: t+80 s 3,36; t+90 s 8,37; t+110 s 17,86; t+130 s 22,89; load5 3,63 → 9,50 |
| 25 | A (30 spin) | "ĐẠT" sau 20 s — SỐ CŨ, xem §6.3 | load1 2,23 / 1,82 (spin throttle hoàn toàn); load5 11,87 / 11,30 chỉ là trung bình 5 phút sót lại từ run24 |

## 4. G4 flake — 0 mới, bar chưa đạt

| Nhóm | Lần E1 tới G4 | Flake | Ghi chú |
|---|---|---|---|
| Lịch sử tới J7 (chặt-chỉ-report) | 35 | 2 | 34 lần tới I6 + run22 của J7 (tải thấp) |
| Mới K5 (run23–25) | 0 | 0 | Cả 3 chết trước G4, không report |
| **Gộp chặt-chỉ-report** | **35** | **2** | **2/35 = 5,7% (Wilson [1,6%, 18,6%]) — KHÔNG ĐỔI** |
| Lịch sử tính cả log-verdict | 36 | 2 | + run21 của J7 (G4 PASS trong log) |
| Mới K5 tính cả log | 0 | 0 | 0 lần tới G4 trong log |
| **Gộp tính cả log-verdict** | **36** | **2** | **2/36 = 5,6% (Wilson [1,5%, 18,1%]) — KHÔNG ĐỔI** |

- **Bar prereg CHƯA ĐẠT:** cần 0 flake trên ≥7 lần E1 hoàn thành tới
  G4 DƯỚI TẢI NẶNG ĐẦY ĐỦ — hiện vẫn chỉ 6 (I6). K5 đóng góp 0 lần
  hoàn thành (cả 3 lần chết trước G4). Đợt sau phải chạy tiếp E1 tải
  nặng; chỉ tính lần nào đạt dial trong cửa sổ G3→G4 (load5 ≥ ~8 và
  slot0Fps ≤ ~2).
- 0 lần mới không nói gì thêm về tỉ lệ flake — khoảng tin cậy vẫn
  ~2–19%. Cơ chế flake vẫn chưa biết; dữ liệu đợt này chỉ nói thêm:
  dưới tải rất nặng (load1 tới ~40), các bước tiền-G3 (mount,
  project-load) chết vì timeout TRƯỚC KHI G4 kịp được đo — tức tải
  nặng đang chặn phép đo ở cửa trước, không phải ở G4.

## 5. Keydown chậm tự nhiên — gộp toàn bộ (không đổi)

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback / abort |
|---|---|---|---|---|---|
| E8 gộp | 22 | 319 | 638 | 804ms | 0 / 0 / 0 |
| Đợt 104 (F8 + F1) | 18 | 242 | 484 | 1004ms | 0 / 0 / 0 |
| Đợt 106 H6 | 9 | 110 | 220 | 213ms | 0 / 0 / 0 |
| Đợt 107 I6 | 6 | 66 | 132 | 2197ms | 0 / 0 / 0 |
| Đợt 108 J7 (run22) | 1 | 11 | 22 | 291ms | 0 / 0 / 0 |
| **Đợt 109 K5 (mới)** | **0** | **0** | **0** | **—** | **0 / 0 / 0** |
| **Tổng** | **56** | **748** | **1496** | **2197ms** | **0 / 0 / 0** |

- K5 đóng góp 0 (không lần E1 nào có report). Kỷ lục 2197 ms (I6,
  dưới tải) không đổi; biên an toàn vẫn 2,3× so với timeout 5000 ms.
  Fallback #2 **vẫn mở**.

## 6. Tải nặng — cách tạo, cách đo, và độ lệch so với prereg

### 6.1 Thí nghiệm settle trước E1 (load-k5-experiment.txt, 23:43:53–23:45:37Z)

- Phương pháp A (30 spin) ĐẠT dial sau 70 s, xuất phát từ máy yên
  (load ban đầu 2,28/1,36): t+10 s load 7,69/2,55; t+30 s 15,41/4,64;
  t+60 s 25,44/8,34; t+70 s 28,06/9,76 (threads-R 33–37). Vì A đạt
  ngay nên B/C/D không cần thử trong thí nghiệm — ghi rõ: **chưa có
  số liệu nào về B/C/D ở trạng thái máy yên**, chỉ có B trong driver
  (run23, xem §6.2).
- So với J7 (15 spin, load1 sau 60 s chỉ 0,29–1,83): khác biệt lớn có
  thể do (a) gấp đôi số spin, (b) máy vừa yên sau reboot #36 và các
  luồng khác chưa chạy nặng lúc 23:43. Không chứng minh được cơ chế
  chính xác — chỉ ghi hiện tượng.

### 6.2 Throttle bật/tắt theo từng đợt — tái hiện đúng mẫu J7

- Run23 gate A: 30 spin sống (threads-R 35–44 suốt 180 s) nhưng
  load1 tụt dần 7,83 → 0,60 và load5 tụt 7,96 → 4,34 — spin gần như
  không được cấp CPU nào. Đúng hiện tượng J7 §6 độ lệch 1 (throttle
  ở cgroup/host; task bị throttle rời khỏi runqueue nên không tính
  vào loadavg dù `ps` vẫn thấy R).
- Run24 gate A: throttle giữ load1 ~0,3–0,4 suốt 70 s đầu, rồi NHẢ
  đột ngột trong ~50 s (load1 0,37 → 3,36 → 8,37 → 12,92 → 17,86 →
  22,89). Không rõ trigger nhả (có thể bucket token nạp lại, hoặc tải
  của luồng khác vừa dứt). Trong lúc E1 run24 chạy, throttle lại quay
  về (load1 40,84 lúc 00:10:37 → 2,54 lúc kết thúc).
- Run25: throttle giữ suốt từ gate tới ~00:18:30 (load1 1,3–1,8),
  rồi NHẢ thành burst load1 ~39,5 trong lúc chờ mount — burst này
  (cùng 30 spin của chính K5) đã đói CPU của Chrome/vite tới mức
  mount timeout. Tức cùng một burst throttle-nhả vừa giúp đạt dial
  (run24) vừa giết mount (run25) — 2 mặt của một hiện tượng.
- Kết luận: **load1 sau 60 s không còn là chỉ số đáng tin cho "đã đủ
  tải"** (đúng như J7), và **throttle là biến theo thời gian, không
  phải trạng thái ổn định** — cùng 30 spin, cùng máy, trong vòng
  30 phút cho ra cả 3 kết quả: đạt nhanh (thí nghiệm), trượt 180 s
  (run23), đạt muộn sau burst (run24).

### 6.3 LỆCH khỏi prereg — dial gate run25 đạt trên số cũ (tự nhận)

- Gate run25 báo "A ĐẠT sau 20 s" với load5 11,87 → 11,30, nhưng
  load1 tức thời chỉ 2,23 → 1,82 và threads-R 34–38 (spin bị throttle
  hoàn toàn). load5 lúc đó là **trung bình trượt 5 phút còn sót lại
  từ tải của run24** (vừa kết thúc 1 phút trước, load5 lúc đó 12,26),
  không phải tải đang sống. Prereg chỉ yêu cầu "load5 ≥ 8 ở 2 mẫu
  liên tiếp" — gate đã làm đúng chữ prereg, nhưng chữ prereg có lỗ
  hổng: **load5 là trung bình 5 phút nên có thể đạt trên số cũ sau khi
  tải đã chết**. Hậu quả: E1 run25 chạy trong lúc tải thật sự gần như
  bằng 0 (tới khi burst tới thì đã muộn — mount chết trước khi burst
  kịp giúp gì, và burst tới thì lại đói mount).
- Bài học cho đợt sau (đăng ký thành quy tắc mới, xem §9): gate phải
  yêu cầu thêm **load1 ≥ ~8 (tải sống tức thời)** cùng lúc với load5
  ≥ 8, và/hoặc yêu cầu load5 ĐANG TĂNG (mẫu sau ≥ mẫu trước) chứ không
  chỉ ≥ 8. Với quy tắc này, gate run25 đã KHÔNG đạt (load1 1,82) và
  driver đã chuyển sang thử B/C thay vì chạy E1 vô ích.
- Không lần nào trong đợt này tới được G3→G4 nên **dial cuối cùng
  (load5 + slot0Fps trong cửa sổ) chưa bao giờ được tính** — mọi
  verdict đều là NOT-QUALIFYING vì không có G4. Phương pháp B (I/O
  churn) đạt load5 11,42 ở gate run23 nhưng **chưa có bằng chứng fps
  nào** rằng B tạo contention thật với renderer (caveat prereg: B chỉ
  tính khi slot0Fps ≤ ~2) — đừng trích B là "đã tạo được tải nặng"
  nếu chưa có lần nào đo được slot0Fps dưới B.

### 6.4 Tải của luồng khác trong lúc K5 chạy

- Lúc driver kết thúc (00:19:11Z), load vẫn 39,91/24,36 dù tải K5 đã
  dừng sạch (0 spin/io/fork alive) — tải đó là của luồng khác (K1/K3
  đang chạy probe; lúc 00:19:35 load vẫn 26,82/22,53). K5 không đo
  tải của luồng khác, chỉ ghi nhận để tránh nhầm số này thành tải K5.
- Tải K5 dừng sạch sau mỗi lần E1 (driver luôn stop sau mỗi lần;
  kiểm cuối: 0 tiến trình tải K5, 0 vite/chrome K5 sót).

## 7. ENOSPC + vite chồng nhau — run23 chết, vite gate cứu run24

- **Run23 chết ENOSPC:** vite :5581 ready trong 8906 ms, rồi crash
  `Error: ENOSPC: System limit for number of file watchers reached,
  watch '.../apps/web/scripts/test_round83_k8_eperm_retry.mjs'`
  (2 dòng ENOSPC trong vite log). Watchers lúc gate run23 chỉ 5/63756
  — vite của K1 (config `/tmp/round104-f5/vite.r2.config.mjs`, cổng
  :5580) bật GIỮA chừng run23 (K1 bắt đầu chạy ~23:47, đúng lúc
  run23 bắt đầu) và chiếm watcher trước; vite K5 đăng ký sau chạm
  trần. Cùng mẫu J7 run18–20 (J3 thắng cuộc đua watcher). Lỗi hạ tầng
  phối hợp, không phải lỗi sản phẩm, không phải flake G4.
- **Vite gate run24 đã làm đúng việc:** chờ ~9 phút (log ghi các mốc
  chờ 0 s → 480 s, poll mỗi 60 s) cho vite của K1 (:5580) rồi vite
  của K3 (config `/tmp/round96-x5/vite.w3.config.mjs`, cổng :5590)
  tắt hẳn mới bật vite của mình (run24 bắt đầu 00:06:04). Run24 và
  run25 sau đó không còn ENOSPC (vite log 0 dòng ENOSPC cả 2 lần).
- Hạn chế còn lại (ghi rõ): gate chỉ kiểm lúc BẮT ĐẦU mỗi lần — vite
  luồng khác bật GIỮA chừng vẫn giết được vite K5 như run23. Đợt sau
  nên thỏa thuận cửa sổ yên-vite với các luồng nặng (K1/K3) trước khi
  chạy E1, thay vì chỉ gate lúc bắt đầu.

## 8. Reboot + phối hợp — không reboot, K9 chưa đóng băng cây

- **Không có reboot** trong lúc K5 chạy: `uptime -s` vẫn
  `2026-11-13 22:53:56Z` (boot #36) từ lúc viết prereg (23:41Z) tới
  lúc driver xong (00:19:11Z). Gap #36 → chưa xảy ra tới 00:19Z.
- K9 poll.log đã đọc trước khi chạy driver (POLL#0 23:40:25Z + POLL#1
  23:42:21Z: 0/8 cờ, chưa đóng băng) và kiểm lại giữa chừng (POLL#2
  23:52:21Z: 0/8; POLL#3 00:02:22Z: cờ K8; POLL#4 00:12:22Z: cờ K6,
  K8). K9 **chưa đóng băng cây** trong lúc K5 chạy — không có xung
  đột nào với luồng verify. K5 cũng không chạy lại sau reboot (không
  có reboot) nên không phát sinh tình huống J7 §8.
- Cờ `round109-k5-done` được tạo NGAY khi LIMITS + batch xong (xem
  §10) — không để luồng khác chờ cờ không bao giờ xuất hiện (bài học
  J3 đợt 108).

## 9. Giới hạn — đọc trước khi trích số

1. **Bar prereg CHƯA ĐẠT** — chỉ 6 lần hoàn thành tới G4 dưới tải nặng
   đầy đủ (I6); K5 đóng góp 0 lần hoàn thành (cả 3 lần chết trước G4).
   Đừng trích "đã đủ 7 lần" hay "flake đã hết" — Wilson 95% vẫn
   ~2–19% (2/35) / ~2–18% (2/36).
2. **0 lần mới không phải bằng chứng tỉ lệ đã giảm** — không có quan
   sát G4 mới nào, nên tỉ lệ gộp giữ nguyên đúng cả tử lẫn mẫu số.
   Cơ chế flake vẫn chưa biết.
3. **Phương pháp B (I/O churn) chưa được chứng minh** — chỉ đạt load5
   ở gate run23, chưa có lần nào đo được slot0Fps dưới B. Đừng trích
   B là tải nặng thật cho tới khi có lần E1 tới G3→G4 với slot0Fps
   ≤ 2 dưới B.
4. **Dial gate có lỗ hổng (số cũ, §6.3)** — gate run25 đạt trên load5
   sót lại từ run24 trong khi tải sống load1 chỉ ~1,8. Đợt sau: gate
   phải yêu cầu thêm load1 ≥ ~8 (tải sống) và/hoặc load5 đang tăng.
   Quy tắc này là bài học K5, chưa áp dụng ngược lại cho các lần đã
   chạy (không sửa kết quả run23/run24 — cả 2 đều đạt gate bằng tải
   sống thật: run23 B có load1 28,97; run24 A có load1 22,89).
5. **Run23 là lỗi hạ tầng ENOSPC, không phải flake G4** — nhưng nó cho
   thấy vite của 2 luồng nặng chạy chồng nhau sẽ giết nhau bằng trần
   watcher 63756; tăng max_user_watches ở cấp hệ thống vẫn là nợ mở
   (ngoài phạm vi luồng đo). Vite gate chỉ bảo vệ lúc bắt đầu, không
   bảo vệ giữa chừng.
6. **Tải nặng chặn phép đo ở cửa trước** — 2/3 lần chết ở
   mount/project-load timeout dưới tải. Bar ≥7 không chỉ cần tải đạt
   dial mà còn cần E1 sống sót qua các bước tiền-G3 dưới tải đó. Đợt
   sau cân nhắc: (a) tăng số lần thử tối đa trên 3 (mỗi lần ~10 phút,
   thành công là xác suất); (b) chạy E1 vào lúc throttle đang ở pha
   "nhả" (load1 sống đã cao) thay vì ép tải lên từ lúc throttle;
   (c) thỏa thuận cửa sổ yên-vite với K1/K3 trước khi chạy.
7. `tsc` / `vite build` không chạy lại: K5 không đổi production code
   (harness md5 không đổi một byte) — theo tiền lệ I6 §9.7;
   `node --check` script harness PASS; các lần chạy đều bật vite dev
   thành công (trừ run23 chết vì vite crash ENOSPC, không phải lỗi
   cây). TTS 39 CẤM kiểm lại (không kiểm); birefnet 0 lần thành công
   (không thử); ci-security.yml vẫn 403 chờ user (ngoài phạm vi).

## 10. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND109_K5_HARNESS_LIMITS.md` (file này) — mới.
- Harness KHÔNG đổi: `apps/web/scripts/clicktest-77e1-deint-fps.mjs`
  md5 giữ nguyên `ae6cd34a7dff3f6bda62199b5ab6c6fc`; `preview.tsx` giữ
  nguyên `ced42efd785724c8c0d1b16fc32c7341`.
- Log + dữ liệu: `hidden_files/round109-k5/` (`prereg-k5.md`,
  `run-k5.sh`, `make-load-k5.sh`, `load-experiment.sh`,
  `analyze-k5-g4-keydown.py` + `analyze-k5.txt`, `run-k5.log`,
  `run-k5.out`, `load-k5-experiment.txt` +
  `load-k5-experiment.result` (= `A`),
  `dial-gate-method-run23.txt` (= `B`), `dial-gate-method-run24.txt`
  (= `A`), `dial-gate-method-run25.txt` (= `A`),
  `dial-k5-run23.txt` / `run24` / `run25` (NOT-QUALIFYING),
  `e1-run23..25/` + `-run.log`, `load-k5-run23..25.txt`).
  Lưu ý: `load-k5-run24.txt`/`run25.txt` ghi đủ sampler tới lúc E1
  chết; `e1-run23-run.log` có dòng ENOSPC qua vite log (xem §7).
- Cờ done: `hidden_files/round109-k5-done` (tạo ngay khi LIMITS +
  batch xong).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round109-k5-harness.txt`
  (NUL, đọc lại sau khi ghi).

```bash
# Chạy lại E1 dưới tải nặng với harness đã thêm probe (nhớ kiểm vite
# luồng khác + đọc poll.log của luồng verify TRƯỚC — xem prereg-k5.md;
# kiểm dial TRƯỚC khi cho E1 chạy tới G3, và yêu cầu thêm load1 >= ~8
# để tránh số cũ như run25 — xem LIMITS này §6.3/§9):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k5/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Tổng hợp lại G4 + keydown từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k5/analyze-k5-g4-keydown.py
# Lần flake tới: đọc các dòng "G4-probe" trong e1-runX-run.log — bước
# nào ăn thời gian / store-hook lệch nhau sẽ hiện rõ ở đó.
```

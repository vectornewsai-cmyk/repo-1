# PHASE9_ROUND122_T4_LEGB_LIMITS.md — Bar F2 leg B theo DEF PSI v0.1: DEFER-POSTBOOT — 0 run (gate không qua trên cả 2 boot; replay kẹt rồi reboot)

**Ngày:** 16/11/2026. **Luồng:** T4 (Phase 9 đợt 122, lượt cron 18:35 +07).
**Nhiệm vụ (quyết parent đợt 121 §12.3):** chạy leg B tiếp theo DEF PSI v0.1,
band Yên, dữ liệu hiệu chỉnh DEF lên v0.2. **Kết quả: KHÔNG CHẠY ĐƯỢC RUN
NÀO — DEFER-POSTBOOT.** Không có số đo browser nào, không smoke run, 0/6
attempt đã dùng, không bịa số liệu. Không sửa production. Không push, không
release/tag. Verdict KHÔNG ĐẠT đợt 120 vẫn đứng; luật lật verdict (i) vẫn
chưa đủ điều kiện.

**Cây lúc đóng leg:** baseline `03bf029f` (H3f đã gỡ — xem §1) / media.ts
`2c384ed1`. HEAD a8f26d48 (không đổi).

## §0. Kết luận trước mọi chi tiết

1. **Gate hạ tầng không qua trên cả hai boot của đợt.** Boot #64?
   (btime 11:05:18Z): postboot FAIL suốt 11:37–12:52Z (thiếu 5 lib + GST;
   replay apt-get update 0 CPU trong 62', dpkg.log kẹt 2 dòng). Boot #65?
   (btime 12:53:25Z, sau reboot 12:53:25Z): replay tiến triển thật
   (dpkg.log 2 → 599 dòng) nhưng kẹt ở 599 dòng từ ~13:27Z, postboot vẫn
   FAIL tới poll cuối #25 (13:44:01Z). T4 chờ gate tổng cộng ~2 giờ
   (11:43–13:44Z, 46 poll) mà không có lần nào check-only PASS.
2. **T5 đã xong trên boot #64** (cờ done 12:42Z) và không còn luồng hạ tầng
   nào trên boot #65 — cờ POSTBOOT_PASS cho boot mới không bao giờ xuất
   hiện. Prereg phụ lục B đã thích ứng gate (bỏ yêu cầu cờ T5, giữ
   check-only + apt im + md5) trước khi đo; gate thích ứng này cũng không
   qua vì check-only vẫn FAIL.
3. **Cây đổi trước khi đo:** T3 đợt 122 gỡ patch H3f thật lúc 12:02:56Z
   (A/B có kiểm soát TRUNG TÍNH, theo quyết parent §12.2). Prereg phụ lục
   A đăng ký lại leg trên cây baseline — nhưng leg không chạy được nên
   **0 run baseline nào tồn tại**; câu hỏi lật verdict theo luật (i) vẫn
   mở và vẫn cần quyết cây (baseline hay khôi phục H3f) ở đợt sau.
4. **Giá trị còn lại của đợt này (không phải số đo leg):** bộ đo DEF v0.1
   đã dựng xong + validate trên dữ liệu đợt 121 (khớp đúng T_startup/
   T_seek đã công bố); quan sát ambient PSI cho v0.2 (§6); 3 lỗi vận hành
   đã sửa + ghi lại (§7).
5. **DEFER là đúng kỷ luật prereg:** không đo chui trên boot thiếu GST.
   Mọi run đăng ký (6 attempt) còn nguyên cho đợt sau — không attempt nào
   bị tính là đã dùng.

## §1. Hai thay đổi trước khi đo (phụ lục A + B của prereg — đều TRƯỚC mọi phép đo)

### 1.1 Phụ lục A (12:12Z): cây H3f → baseline

- Lúc 12:02:56Z, T3 đợt 122 GỠ patch H3f thật (`patch --batch -R -p1`,
  verify preview.tsx = `03bf029f`, tsc + vite build baseline PASS
  12:03:29Z) — theo quyết parent đợt 121 §12.2 ("Nếu A/B đó cũng TRUNG
  TÍNH → GỠ patch"). A/B có kiểm soát của T3 (ABAB, cùng boot #64?, tải
  cân bằng theo PSI: đuôi avg60 A 79,4% vs B 77,4%): TRUNG TÍNH (tick
  chậm −19,3%, 95% CI 0,552–1,180 chứa 1,0, không đạt bar −25%; longtask
  −0,9%, không đạt bar −20%). Chi tiết:
  `docs/PHASE9_ROUND122_T3_H3F_AB_LIMITS.md`. File `h3f.patch` được GIỮ
  NGUYÊN (apply lại được nếu parent quyết). media.ts KHÔNG đổi
  (`2c384ed1`).
- Hệ quả: leg đăng ký lại trên cây **baseline `03bf029f`** cho mục đích
  hiệu chỉnh DEF v0.2 + câu hỏi chế độ chậm theo band; **KHÔNG còn phục
  vụ lật verdict theo luật (i)** (đòi cùng cây với bộ verdict H3f).
  Gate (0c) đổi theo: preview md5 yêu cầu = `03bf029f`.

### 1.2 Phụ lục B (12:56Z): reboot #64? → #65? + T5 đã xong

- **Reboot 12:53:25Z** sang boot `#65?` (số tạm), boot_id
  `fbc42445-8967-473e-bab7-d690d49ce13a`, gap #64?→#65? ~1h48'. Timer 25'
  + gatewaiter + watcher của T4 đều bị giết theo reboot (SIGTERM ~12:53Z).
  Gate log cũ dừng ở poll #21 (12:52:47Z). 0 phép đo đã chạy.
- **T5 đã xong trên boot #64** (cờ round122-t5.done 12:42Z): watcher kết
  thúc 12:38:33Z với postboot cuối vẫn FAIL (exit 1), replay kẹt, headroom
  STOP ở 4552, RAM avail cuối 442 MB. **Không còn luồng hạ tầng nào trên
  boot #65.**
- **Gate (0d) thích ứng:** bỏ yêu cầu cờ POSTBOOT_PASS của T5 cho boot mới
  (không còn ai viết cờ — giữ yêu cầu sẽ deadlock leg). Gate mới =
  check-only riêng bằng chính script postboot-check của T5 (bản mới, md5
  `a10b43ea...`) exit 0 + apt/dpkg im (pgrep -x) + preview md5 baseline +
  boot không đổi trong lúc đo. Đây là cùng bộ tiêu chí thực chất T5 dùng
  để PASS; chỉ bỏ cơ chế cờ phối hợp. Gatewaiter đã sửa theo phụ lục này
  và chạy lại trên boot #65 (poll #1 12:55:52Z).

## §2. Gate không qua — bằng chứng đầy đủ

### 2.1 Boot #64? (btime 11:05:18Z, boot_id `3fe7e89e…`)

- Postboot try1 của T5 (11:05:18Z / 11:37Z): FAIL — thiếu 5 lib
  (libevent-2.1.so.7, libEGL.so.1, libavif.so.16, libdw.so.1,
  libevdev.so.2), GST dir không tồn tại (0 plugin hệ thống, debroot 269),
  thiếu isomp4/libav, 11 gói apt chưa cài.
- Replay bắt đầu MUỘN (dpkg configure 11:35:39Z, boot +30'21"); wrapper
  os-intent PID 834 + apt-get update PID 855 chạy; **apt-get update 0
  giây CPU sau 62 phút** (ELAPSED 01:02:34, TIME 00:00:00 lúc 12:38Z),
  dpkg.log kẹt 2 dòng, `/var/lib/apt/lists` chỉ có auxfiles/lock/partial
  (0 list hoàn chỉnh). Kẹt thật, không tiến triển.
- Gatewaiter T4 poll #1–#21 (11:43:57Z–12:52:47Z, chạy lại 1 lần sau khi
  sửa grep — xem §7): postboot_exit=1 mọi poll, aptx=1, dpkgx=0,
  dpkg_lines=2, RAM avail 415–1490 MB, t5flag=FAIL-co. Không poll nào
  đủ điều kiện DAT.

### 2.2 Boot #65? (btime 12:53:25Z, boot_id `fbc42445…`)

- Replay khởi động NHANH (wrapper PID 784 + apt-get update PID 805 đã
  chạy lúc 12:54Z, boot +~1'). dpkg.log tăng thật: 2 → 305 (13:15Z) →
  343 → 391 (13:19:56Z) → 599 (13:27:57Z), rồi **kẹt ở 599 dòng từ
  ~13:27Z tới poll cuối** (16+ phút không tăng) trong khi apt-get vẫn
  chạy (PID mới 9925).
- Gatewaiter T4 (bản thích ứng phụ lục B) poll #1–#25 (12:55:52Z–
  13:44:01Z): postboot_exit=1 mọi poll, aptx=1, dpkgx=0, RAM avail
  496–1490 MB, preview md5 `03bf029f` mọi poll. Không poll nào DAT.
- **Quyết định DEFER (13:44Z):** gate fail 25 poll liên tiếp trong 48'
  trên boot mới; dpkg kẹt 16+ phút; watcher hết hạn 13:45Z; kể cả gate
  qua lúc 13:45Z thì driver (~25') + LIMITS/stage (~10') cũng xong
  ~14:20Z, quá hạn T10 đóng đợt 14:15Z. Dừng gatewaiter + watcher bằng
  kill PID chính xác (2073/2155) lúc 13:44:40Z, không để chạy lấn vào
  pha đóng đợt.

### 2.3 Không đo chui — 0 run

- Không smoke run, không leg run, 0/6 attempt đã dùng. OUT JSON
  `benchmarks/results/webkit-blob-flaky-122t4-f2startup-legb.json` CHƯA
  TỒN TẠI (chưa tạo). `brackets-t4.json` = `{}` (bản ghi TEST-bracket đã
  xóa ngay sau khi thử helper). Cây không đổi trong lúc chờ (preview
  `03bf029f` / media `2c384ed1` trước = sau, verify 12:54Z và 13:44Z).

## §3. Bộ đo DEF v0.1 đã dựng xong + validate (giá trị còn lại)

Runner/analyzer/check-valid/driver/gatewaiter/watcher + bracket helper đã
viết xong TRƯỚC khi gate qua (chuẩn bị, không phải đo) và sẵn sàng cho đợt
sau — chỉ cần đổi boot/cây trong prereg mới.

- **Runner** `benchmarks/render/f2_startup_probe_122t4.mjs` (85.927 B —
  OVERSIZE > 37.768, lúc push cần `ENABLE_PRIVSEP=0`): COPY 121t7, chỉ
  đổi PORT 8953→**8954**, OUT → `webkit-blob-flaky-122t4-f2startup-legb.json`,
  S9_DIR mặc định → `round122-t4` + 2 bổ sung instrumentation (không đổi
  flow đo): (a) sampler ghi THÊM `psiSomeAvg60` + `psiFullAvg10` (+
  `psiFullTotal`) mỗi mẫu 1 Hz (bản cũ chỉ ghi avg10 — DEF yêu cầu avg60);
  (b) bộ đếm rAF thụ động trong page evaluate → `rafTicks` +
  `rafTickRate` (tick/s, chỉ báo DEF §2 — runner F2 cũ không có kênh
  tickRate); `summarizeLoad`/`summarizeLoop` truyền 2 trường này ra case
  JSON. `node --check` OK.
- **Analyzer** `benchmarks/render/f2_startup_analyze_122t4.py`
  (21.441 B): COPY 121t7, đổi mặc định S9_DIR/S9_OUT + `analyze_psi()`
  thêm avg60 mean/min/max, avg60 mean mẫu con 5 s, full avg10 max,
  rafTickRate + hàm `analyze_def_void()` (VOID theo DEF §5) + bảng tổng
  hợp DEF §6 (T_startup/T_seek/avg60/tickRate theo band, pha (a)/(b)).
  **Validate TRƯỚC khi đo trên dữ liệu đợt 121: KHỚP ĐÚNG** — T_startup
  0,911/0,421/0,479/0,636/0,564/0,458/0,489/0,751 s; T_seek 0,000–0,001 s;
  DEF-void gắn cờ đúng dữ liệu cũ thiếu bracket/avg60 (như kỳ vọng).
- **check-valid-t4.py** (3.442 B): COPY check-valid-t7.py, đổi W/OUT,
  tách `VALID_COUNT=<n>` và `TOTAL=<n>` thành 2 dòng riêng (sửa lỗi driver
  T7 so sánh chuỗi "6 TOTAL"), + áp VOID DEF §5 (a)/(b)/(d)/(e) từ
  `brackets-t4.json` + psiSamples. Tiêu chí cũ (g) giữ nguyên.
- **bracket-t4.py** (1.888 B): đọc bracket PSI trước/sau run (avg60,
  avg10, full avg10, load1, threadsR) vào `brackets-t4.json`. Đã thử 1
  lần (TEST-bracket, đã xóa khỏi file — số đọc lúc đó: avg60 45,83%,
  avg10 82,45%, load1 2,02, threadsR 11/9 — xem §6).
- **Driver** `run-t4-all.sh`: dial vòng kín theo PSI (0 hog, chờ avg60
  <30%, tối đa 20 lần đọc cách 90 s = 30'), hold 90 s trước run 1, tối đa
  6 attempt qua lock v2 `run-attempt t4-round122 8954 900 30 normal`,
  Xvfb :195, dừng sớm khi đủ 6 VALID, bracket trước/sau mỗi run, nếu
  avg60 trước run ≥30% thì chờ lại 90 s (tối đa 3 lần) rồi dừng driver.
- **Gatewaiter** `run-t4-gatewait.sh` + **watcher** `t4-watch-gate.sh`:
  poll 2'/lần, tối đa 60 poll; watcher chạy driver khi GATE DAT, hạn chờ
  13:45Z. Cả hai đã sửa 2 lỗi vận hành (§7).
- **Lock v2** copy đóng băng `vcut-vite-lock-v2.frozen.sh` md5 `cd0c05c1`
  (khớp baseline đợt 120/121). Không dùng lock lần nào đợt này (0 run).

## §4. Prereg — viết trước mọi phép đo, 2 phụ lục trước khi đo

`hidden_files/round122-t4/prereg-t4.md` — viết 11:41Z, TRƯỚC mọi phép đo
(kể cả smoke). Phụ lục A (12:12Z, đổi cây H3f → baseline) + phụ lục B
(12:56Z, reboot + gate thích ứng) đều ghi TRƯỚC khi có bất kỳ phép đo nào
— không có điều chỉnh nào sau khi đo bắt đầu, vì không có phép đo nào bắt
đầu. Mục tiêu đăng ký: 6 valid nhanh mới trên cùng boot + cây baseline,
tối đa 6 attempt, band Yên avg60 <30%, 0 hog, hold ≥90 s, VOID theo DEF
§5 — toàn bộ còn nguyên cho đợt sau (chỉ cần cập nhật boot/cây mới).

## §5. Verdict + bar F2 — không đổi

- **Verdict đợt 120 vẫn đứng: KHÔNG ĐẠT — chế độ chậm.** Pha (b) ĐẠT
  (24/24 run SEEKFAST T_seek ≤ 1 ms gộp tới đợt 121). Không có dữ liệu
  mới nào đợt này để xét lại.
- **Luật lật verdict (i) vẫn chưa đủ điều kiện:** cần ≥6 run nhanh mới
  trên CÙNG MỘT boot + CÙNG cây (H3f). Cây H3f đã gỡ (§1.1); cây baseline
  có 0 run; boot #64 có 0 run (chết trước khi đo), boot #65 có 0 run.
  Đợt sau cần quyết cây trước (baseline hay khôi phục H3f) rồi đăng ký
  lại leg.

## §6. Đầu vào cho DEF v0.2 — những gì CÓ và KHÔNG CÓ (trung thực)

**KHÔNG CÓ (vì 0 run browser):** (i) PSI avg60 thực tế trong lúc browser
chạy ở band Yên; (ii) T_startup theo band PSI; (iii) tickRate theo band
PSI + kiểm tra tương quan +0,90 của T2-120. **DEF v0.1 KHÔNG được hiệu
chỉnh đợt này — mọi ngưỡng v0.1 vẫn tạm thời, không tự sửa DEF.**

**CÓ — quan sát ambient PSI (không phải trong run, chỉ để tham khảo cho
v0.2, nguồn: đọc trực tiếp /proc/pressure/cpu + log gatewaiter):**

| Thời điểm (Z) | avg60 | avg10 | Bối cảnh |
|---|---|---|---|
| 11:37 | 6,40% | 14,65% | Boot #64 ~32', trước khi các luồng 122 ramp-up |
| 11:38–11:39 | 7,19–11,14% | 8,39–17,05% | 0 hog, ambient thấp |
| 11:42 (bracket test) | 45,83% | 82,45% | Các luồng 122 đang ramp-up + replay apt |
| 11:42:43 | 58,30% | 89,89% | Đỉnh tải |
| 11:44 | 72,33–83,41% | 86,49–91,96% | Đỉnh tải (sibling + replay) |
| 12:38 | 0,47% | 0,82% | Máy nhàn (nhiều luồng đã xong) |
| 12:56 | 5,12% | 1,41% | Boot #65 ~3', replay mới chạy |
| 13:21 | 0,79% | 0,29% | Máy nhàn |
| 13:33 | 0,42% | 0,05% | Máy nhàn |
| 13:43 | 20,41% | 46,68% | Tải tăng lại (pha đóng đợt?) |

- **Đọc cho v0.2:** band Yên <30% **không phải lúc nào cũng đạt được
  trong đợt đang chạy** — ambient một mình đã đẩy avg60 lên 45–83%
  trong lúc các luồng sibling + replay bận (11:42–11:44Z), và chỉ về
  <1% khi máy nhàn. Ngưỡng Yên <30% do đó là ngưỡng "máy nhàn", không
  phải "cổng yên trong đợt bận". Leg B đợt sau hoặc chạy khi sibling đã
  xong, hoặc v0.2 phải ghi rõ điều kiện tiên quyết này. Đây là quan sát
  ambient (n=~10 điểm rời rạc), KHÔNG phải dữ liệu trong run — không
  dùng để dời ngưỡng.
- **Dữ liệu PSI trong lúc browser chạy DUY NHẤT đợt này là của T3**
  (không phải của T4 — trích để DEF khỏi mất dấu, xem chi tiết ở LIMITS
  T3): A/B H3f, hog N=4, PSI đuôi avg60 A 79,4% vs B 77,4%, trung vị cả
  run ~71% cả hai chân — browser chạy dưới hog N=4 ngồi ở band Nặng/Vừa
  cao, không phải Yên. Load1 nói ngược (A 6,50 vs B 1,34) dù cùng PSI —
  thêm một bằng chứng load1 vô hiệu.

## §7. Lỗi vận hành đã sửa + bài học (ghi rõ, không giấu)

1. **Gatewaiter lần 1 dừng sai (11:43:28Z):** grep mở `replay[- ]chet`
   khớp dòng "REPLAY DANG CHAY — KHONG PHAI REPLAY CHET" trong
   POSTBOOT_FAIL của T5 (dương tính giả — cùng lớp lỗi như `pgrep -f`
   tự khớp của T7-121 §7.5). Đã sửa: chỉ dừng khi dòng bắt đầu bằng
   "REPLAY CHET"/"REPLAY DA CHET" hoặc có cờ REPAIR_TRIGGERED của T5.
   Gatewaiter chạy lại 11:43:56Z, poll #1 đúng ngay sau đó.
2. **Watcher lần 1 đọc lại dòng log cũ (11:44:30Z):** watcher thoát ngay
   vì khớp dòng "DUNG, khong do chui" của gatewaiter lần 1 còn trong cùng
   file log. Đã sửa: watcher chỉ xét các dòng log viết SAU thời điểm nó
   chạy (đếm số dòng lúc bắt đầu). Chạy lại 11:45:37Z, không kích hoạt
   sai nữa.
3. **`pkill -f run-t4-gatewait.sh` tự giết phiên của chính T4 (12:12Z):**
   mẫu pkill trùng với dòng lệnh của chính exec đang chạy → SIGTERM tới
   phiên mình (exec exit 15). May mắn: prereg phụ lục A + sed sửa gate
   đã xong trước lệnh pkill; gatewaiter cũ (PID 8971) cũng đã chết theo.
   Bài học: **không bao giờ `pkill -f` với mẫu có trong dòng lệnh của
   mình — kill bằng PID chính xác** (đã áp dụng khi dừng gatewaiter/
   watcher lúc 13:44:40Z: kill 2073/2155, sạch).
4. **Reboot giết tiến trình nền không báo trước (12:53:25Z):** timer +
   gatewaiter + watcher đều chết theo reboot; T4 khởi động lại cả hai
   sau khi kiểm tra trạng thái (phụ lục B). Tiền lệ đợt 120/121 đã có —
   lần này mất ~3' để chạy lại.

## §8. Nợ mở cho đợt sau

1. **Leg B phải chạy lại (nợ chính):** cần (a) một boot mà replay chạy
   xong + postboot PASS (cả #64 và #65 đều chưa PASS trong đợt này);
   (b) quyết cây trước khi đăng ký: baseline (tiếp tục hiệu chỉnh DEF)
   hay khôi phục H3f (mới xét được luật lật verdict (i)); (c) cửa sổ
   chạy khi sibling đã xong hoặc chấp nhận Yên khó đạt trong đợt bận
   (§6). Bộ đo 122t4 đã sẵn sàng, chỉ cần prereg mới (boot/cây).
2. **Hạ tầng boot:** replay #64 kẹt kiểu mới (apt-get update 0 CPU
   62' — "chạy mà không tiến triển", khác dạng (B) "chạm mà không cài"
   của #60/#62/#63); replay #65 tiến triển tới 599 dòng rồi kẹt. Luật
   replay-chết §8.2 chưa bao trường hợp "apt còn sống nhưng 0 CPU" —
   T5 đợt sau cần quyết có bổ sung điều kiện "apt 0 CPU quá N phút" không.
   T5 đã xong đợt này nên không ai xử lý boot #65 tiếp — parent/T10 cần
   biết khi đóng đợt.
3. **DEF v0.2 vẫn chờ dữ liệu leg B** (PSI trong lúc browser chạy,
   T_startup/tickRate theo band). Ngưỡng v0.1 giữ nguyên tạm thời.
4. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ user quyết;
   `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ
   thử lại khi RAM đổi (u2net là fallback chính thức); R9 (a) vẫn chờ user
   (nhắc lần 7); E4 lượt 3–4 + H3f đã có kết quả ở các luồng khác đợt 122
   (xem LIMITS gộp).

## §9. File và dữ liệu

- LIMITS này: `docs/PHASE9_ROUND122_T4_LEGB_LIMITS.md`.
- Runner T4: `benchmarks/render/f2_startup_probe_122t4.mjs`
  (85.927 B — **>37.768 B, cần `ENABLE_PRIVSEP=0` khi push**).
- Analyzer T4: `benchmarks/render/f2_startup_analyze_122t4.py`
  (21.441 B).
- check-valid T4: `hidden_files/round122-t4/check-valid-t4.py` —
  KHÔNG stage (nằm trong hidden_files theo lệ dữ liệu thô; xem dưới).
  **Đính chính so với kế hoạch stage:** check-valid, bracket helper,
  driver, gatewaiter, watcher chỉ để trong `hidden_files/round122-t4/`
  (dữ liệu thô), KHÔNG đưa vào batch push — theo đúng lệ các đợt trước
  (T7-121 chỉ stage runner + analyzer + LIMITS; script vận hành ở
  hidden_files). Batch stage do đó có 3 entry.
- Dữ liệu thô + prereg (+2 phụ lục) + driver/gatewaiter/watcher/bracket
  helper + gate log (46 poll) + postboot log từng poll (KHÔNG stage):
  `hidden_files/round122-t4/` (`prereg-t4.md`, `run-t4-all.sh`,
  `run-t4-gatewait.sh`, `t4-watch-gate.sh`, `bracket-t4.py`,
  `check-valid-t4.py`, `brackets-t4.json` ({}), `vcut-vite-lock-v2.frozen.sh`
  md5 cd0c05c1, `gate0-wait-t4.log`, `postboot-t4-gatewait-*.log`,
  `t4-watch.log`, `t4-driver.out` (không có — driver chưa chạy),
  `xvfb-195.log` (không có — Xvfb chưa khởi động)).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round122-t4-legb.txt`
  (NUL-delimited; **3 entry**: runner 122t4, analyzer 122t4, LIMITS này)
  — đã verify read-back. KHÔNG push.
- Cờ: `hidden_files/round122-t4.done` (tạo sau khi ghi LIMITS + stage
  xong). Log lượt: append `hidden_files/build-loop-log.md`.

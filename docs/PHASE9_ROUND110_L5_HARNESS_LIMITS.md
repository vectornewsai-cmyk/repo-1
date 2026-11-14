# Đợt 110 L5 — Harness E1 dưới TẢI NẶNG, đủ bar ≥7 (nối J7/K5) — BAR ĐẠT: run31 QUALIFYING (6 I6 + 1 L5 = 7), 0 flake

Ngày: 14/11/2026 (lượt cron 09:35 +07; L5 chạy 02:42Z–03:25Z, xem §3.5). Máy đo: VM này (CPU-only, Chromium qua Xvfb +
CDP `--disable-gpu`; boot #38 `2f001e9c…` từ 02:24:45Z, rồi reboot #39
`ce518c02…` từ 02:50:48Z giữa đợt). RAM khả dụng 1024–4014 MB trong
lúc đo; KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG
release/tag. Harness KHÔNG đổi một byte (md5 giữ nguyên, xem §2).

Nợ: LIMITS K5 đợt 109 — bar ≥7 lần hoàn thành vẫn 6/7 (chỉ I6); flake
gộp 2/35 = 5,7% chặt-chỉ-report; keydown chậm gộp 56 lần / 748 slot /
1496 toggle, max 2197 ms; dial gate có lỗ hổng load5-số-cũ (K5 §6.3);
vite gate chỉ kiểm lúc bắt đầu (run23 chết ENOSPC do vite K1 bật giữa
chừng).

## 1. Kết luận ngắn

- **BAR PREREG ĐẠT — run31 QUALIFYING.** Lần E1 hoàn thành thứ 7 tới
  G4 dưới tải nặng đầy đủ: **run31, exit=0, pass=10/10, G4 PASS
  (R=0,51 < 0,8), G5 PASS (3,24×), slot0Fps=0,71, idle=tải, G3→G4
  gap 7,685 s; dial trong cửa sổ: load1 35,31 / load5 20,36
  (load1 trung bình ≥ 8 ✓, load5 ≥ 8 ✓, slot0Fps ≤ 2 ✓, G4 PASS ✓),
  0 flake.** Tổng: **6 lần I6 + 1 lần L5 = 7 lần hoàn thành, 0 flake
  trên 7 lần** — bar "0 flake trên tổng ≥7 lần E1 hoàn thành tới G4
  dưới tải nặng đầy đủ" đã chạm. (Lưu ý: dòng log của driver ghi
  "6 I6 + 1 K5 = 7" — nhãn "K5" là chữ sót lại từ script gốc
  run-k5.sh; lần thứ 7 là của L5, run31 — xem §3.5.)
- **G4 flake gộp cập nhật:** chặt-chỉ-report **2/36 = 5,6% (Wilson
  95% [1,5%, 18,1%])** (lịch sử 2/35 + mới 0/1); tính cả run21 (G4
  PASS trong log, không report) **2/37 = 5,4% (Wilson [1,5%, 17,7%])**.
  Keydown chậm gộp: **57 lần / 759 slot / 1518 toggle, max 2197 ms**
  (run31 đóng góp 11 slot / 22 toggle, playMax 2082 ms / pauseMax
  1521 ms — chưa phá kỷ lục 2197 ms của I6). 0 retry / 0 fallback /
  0 abort. Fallback #2 **vẫn mở**.
- 4 lần trước run31 đều chết TRƯỚC G4 (run26 + run28 CDP page-target
  timeout — mẫu lỗi MỚI so với K5; run29 + run30 project-load timeout
  — mẫu K5 run24). Run27 dở giữa dial gate do **reboot #39**. Tỉ lệ
  thành công E1 dưới tải nặng đợt này: 1/5 lần thực chạy tới được G4
  (run31); 4/5 chết ở cửa trước — tải nặng vẫn chặn phép đo ở cửa
  trước, nhưng lần thứ 5 đã vượt qua cả 2 cửa.
- **Gate tải v2 (vá lỗ hổng K5 §6.3) ĐÃ LÀM ĐÚNG VIỆC — có bằng chứng
  trong đợt:** yêu cầu thêm load1 ≥ ~8 (tải sống) cùng load5 ≥ ~8 ở 2
  mẫu 10 s liên tiếp. Run26 phương pháp A trượt 180 s (load1 chỉ
  0,41–2,50 dù 30 spin sống, throttle hoàn toàn); run30 gate t+10 s
  có load5 8,15 ≥ 8 nhưng load1 chỉ 0,59 (tải chết sót lại từ run29)
  — gate v2 TỪ CHỐI mẫu đó, chỉ đạt khi load1 thật sự lên 10,63 /
  16,23 ở t+30/t+40 s. Dưới gate cũ (chỉ load5), mẫu t+10 s đã được
  tính 1/2 lần liên tiếp. Phương pháp B (A + I/O churn) đạt ở run26
  sau 60 s (load1 25,23/30,02); A đạt ở run28 (90 s), run29 (20 s),
  run30 (40 s), run31 (60 s). C và D chưa bao giờ cần thử.
- **L1 sửa production giữa đợt (không phải do L5):** `preview.tsx`
  md5 `ced42efd…` → `9b27abe5…` lúc 02:55:02Z (fix E4 tách cờ
  skipRender, xem §8). Run28 chạy ĐÚNG lúc fix đáp xuống (bắt đầu
  trên md5 cũ, kết thúc trên md5 mới); run29/30/31 chạy hoàn toàn
  trên md5 mới. Lỗi của run26/28 (CDP) và run29/30 (project-load)
  đều ở bước TRƯỚC khi page load nội dung preview (và run29/30 trùng
  mẫu K5 run24 trên md5 cũ) — nên fix L1 KHÔNG phải nguyên nhân các
  lần chết; run31 PASS 10/10 trên md5 mới. Run28 không phải phép đo
  sạch của bản nào (ghi rõ caveat, §8).
- **Phối hợp:** vite lock chung đã làm đúng việc — L5 giữ/nhả lock
  đúng sau mỗi lần (6 lần nhả ghi trong log); run31 chờ lock 7 phút
  do L4 giữ (L4 xong 03:17:58Z) rồi chạy và đạt bar. Reboot #39 cắt
  ngang run27; driver resume chạy tiếp run28–30 sạch (không còn
  tải/vite sót sau reboot).
- **Không có ENOSPC lần nào** (watcher 5/63756 suốt đợt, vite ready
  4,7–6,5 s). RAM không lần nào dưới 600 MB (thấp nhất 1024 MB lúc
  run29 bắt đầu).

## 2. Harness đã đổi — KHÔNG đổi production/harness, chỉ thêm gate v2 + lock

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` md5
  **`ae6cd34a7dff3f6bda62199b5ab6c6fc`** trước/sau MỌI lần chạy — khớp
  đúng md5 I6/J7/K5. `preview.tsx` md5 **`ced42efd785724c8c0d1b16fc32c7341`**
  ở run26/28-trước, **`9b27abe57975ec5b69ec2e21c3fa281c`** ở run28-sau +
  run29/30 (L1 sửa, xem §8) — L5 không sửa production.
- Chỉ thêm mới: prereg `prereg-l5.md`, driver `run-l5.sh` (+ bản resume
  `run-l5-resume.sh` chạy run28–30 sau reboot, + `run-l5-run31.sh`
  chạy run31), `make-load-l5.sh`, analyzer `analyze-l5-g4-keydown.py` +
  `analyze-l5.txt`, log/report trong `hidden_files/round110-l5/` và
  file LIMITS này. Driver dựa trên `run-k5.sh`, khác biệt:
  - **Dial gate v2:** ĐẠT khi load1 ≥ ~8 VÀ load5 ≥ ~8 ở 2 mẫu 10 s
    liên tiếp (mẫu nào load1 < 8 thì reset đếm); thử A (30 spin) →
    B (A + 4 I/O) → C (A + 4 fork) → D (30 spin nice -5), mỗi phương
    pháp tối đa 180 s.
  - **Dial verdict v2** trong cửa sổ G3→G4: QUALIFYING yêu cầu thêm
    load1 trung bình cửa sổ ≥ ~8 (ngoài load5 max ≥ 8 VÀ slot0Fps
    ≤ 2 VÀ G4 PASS); ghi đầy đủ load1/load5 min/max/mean trong cửa sổ.
  - **Vite lock thư mục chung** `hidden_files/vite.lock` (mkdir
    nguyên tử; owner `l5-runN`; nhả ngay sau mỗi lần E1; trap nhả
    lock + dừng tải khi driver bị giết; lock stale >30 phút mà không
    còn tiến trình vite thì được xóa). Trước mỗi lần: đọc cờ done các
    luồng round110 khác + `ps` vite/chrome.
  - **Tối đa 5 lần E1 thử** (run26–30; run27 dở do reboot nên chạy bù
    run31 — xem §3.5).
- Workaround `server.watch.ignored ["**/**"]` KHÔNG áp dụng (xem
  prereg §phạm vi): vite config do chính harness sinh ra lúc chạy,
  thêm ignored phải sửa harness (đổi md5, phá tính so sánh với
  J7/K5); watcher lúc bắt đầu chỉ 5/63756 nên rủi ro ENOSPC thấp,
  lock + watcher gate là đủ — và thực tế 0 ENOSPC cả đợt, quyết định
  này được xác nhận đúng.
- `node --check` script harness PASS đầu driver. `tsc` / `vite build`
  không chạy lại (L5 không đổi production; theo tiền lệ I6 §9.7; L1
  đã chạy tsc 0 + vite build pass trên cây đã sửa, xem §8).

## 3. E1 run26–31 — kết quả đầy đủ

| Lần chạy | Bắt đầu (Z) | Exit | Pass | G4 | Kết cục | Gate | Tải lúc E1 (load1 mean) |
|---|---|---|---|---|---|---|---|
| E1-26 | 02:44:32 | 2 | — (không report) | — | CDP page-target timeout 60,2 s (111 lần thử) | B đạt 60 s (A trượt 180 s) | ~30–49 (sampler 11 mẫu) |
| E1-27 | 02:51:08 | — (dở) | — | — | Reboot #39 giữa dial gate (t+10 s) | — | — |
| E1-28 | 02:53:09 | 2 | — | — | CDP page-target timeout 61,1 s (114 lần thử) | A đạt 90 s | ~28–36 (sampler 8 mẫu) |
| E1-29 | 02:56:09 | 2 | — | — | Project-load timeout 3 phút (mount OK 02:58:08) | A đạt 20 s | mean 11,85 (min 0,89 / max 35,50) |
| E1-30 | 03:01:19 | 2 | — | — | Project-load timeout 3 phút (mount OK 03:03:23) | A đạt 40 s | mean 30,85 (min 9,94 / max 42,10) |
| E1-31 | 03:18:15 | 0 | **10/10** | **PASS R=0,51** | **QUALIFYING — BAR ĐẠT** (G3 03:21:33 → G4 03:21:41, gap 7,685 s; G5 PASS 3,24×) | A đạt 60 s (chờ lock L4 7 phút) | mean 18,75 (min 1,00 / max 38,38); trong cửa sổ G3→G4: load1 35,31 / load5 20,36 |

- Cả 5 lần thực chạy: vite dev bật thành công (run26 :5581 ready;
  run28 :5580 ready 6508 ms; run29 :5580 ready 6312 ms; run30 :5580
  ready 4724 ms; run31 :5580 lên 03:19:42Z); **0 dòng ENOSPC** trong
  mọi vite log; run31 là lần duy nhất tới G0 (PASS G0 canvas 1991×815)
  và đi hết tới pass 10/10.
- RAM trước mỗi lần: run26 3702 MB, run28 2513 MB, run29 1024 MB,
  run30 1574 MB, run31 4014 MB — đều ≥ 600 MB, không lần nào dừng sớm
  vì RAM, không dấu hiệu OOM. Watcher tiền-chạy: 5/63756 cả 5 lần.
- Tải đã dừng sạch sau mỗi lần (0 spin/io/fork còn sống sau driver;
  kiểm cuối 03:25Z: `load_alive=0`; không còn vite/chrome của L5 sót
  — vite :5599 còn lại lúc kiểm là của L8, đã giữ lock sau L5).
- md5 harness `ae6cd34a…` trước/sau mọi lần; preview.md5 theo từng
  run (xem §8).

### 3.1 Dial gate v2 từng lần (mẫu 10 s, ghi trong run-l5.log)

| Lần | Phương pháp | Kết quả gate | Chi tiết |
|---|---|---|---|
| 26 | A (30 spin) | KHÔNG ĐẠT sau 180 s | load1 2,50 → 0,41 → 1,59 (max 2,50); load5 2,82 → 1,95; threads-R 33–38 (spin sống nhưng bị throttle hoàn toàn, đúng mẫu K5 run23) |
| 26 | B (A + 4 I/O churn) | ĐẠT sau 60 s | load1 4,63 → 10,53 → 17,61 → 21,59 → 25,23 → 30,02; load5 2,57 → 10,19 |
| 27 | A | DỞ (reboot #39) | 1 mẫu duy nhất t+10 s: load1 45,87 / load5 23,70 — là tải sót lại từ run26 (cửa sổ 1 phút chưa hết), không phải tải của run27 |
| 28 | A | ĐẠT sau 90 s | load1 ramp đều 2,62 → 7,85 → 11,29 → 14,85 → 17,64 → 20,32 → 23,72 → 25,46 → 27,15; load5 1,33 → 9,60 |
| 29 | A | ĐẠT sau 20 s | load1 34,54 / 34,05; load5 17,11 / 17,57 — **CAVEAT:** gate chạy chỉ 20 s sau khi tải run28 dừng; load1 lúc đó còn chứa dư tải run28 trong cửa sổ 1 phút (xem §6.3). Spin run29 sống (threads-R 37–43) và load1 duy trì trong lúc E1 (mean 11,85) nên tải là thật, nhưng mẫu gate không sạch hoàn toàn |
| 30 | A | ĐẠT sau 40 s | t+10 s: load1 0,59 / load5 8,15 — **gate v2 TỪ CHỐI** (load5 ≥ 8 nhưng load1 chết); t+20 s: load1 0,50 / load5 7,88; t+30 s: load1 10,63 / load5 9,76 (throttle nhả); t+40 s: load1 16,23 / load5 10,99 → ĐẠT |

### 3.2 Lỗi mới: CDP page-target timeout dưới tải (run26, run28)

- Cả 2 lần: vite đã lên và khỏe (ready 6,5 s / media probe OK),
  nhưng Chrome không mở được cổng debug: `HARNESS LỖI: không lấy
  được page target CDP (đã thử 111/114 lần trong 60,2/61,1 s,
  timeout 0/1 lần, deadline 60 s — endpoint treo hoặc Chrome chưa mở
  cổng debug)`. Đây là bước TRƯỚC mount — tải nặng (load1 28–49)
  đói CPU của Chrome tới mức tiến trình debug không kịp mở cổng
  trong 60 s. K5 chưa gặp mẫu này (K5 chết ở mount/project-load);
  đây là cửa chặn MỚI, sớm hơn cả mount.
- Không phải lỗi sản phẩm (chưa tới code preview), không phải flake
  G4, không phải ENOSPC. Ghi nhận là giới hạn của phép đo dưới tải,
  không phải bằng chứng về G4.

### 3.3 Project-load timeout dưới tải (run29, run30 — mẫu K5 run24)

- Cả 2 lần: app mount OK (run29 02:58:08, run30 03:03:23), modal
  chào đóng (02:58:14 / 03:03:28), rồi `HARNESS LỖI: timeout chờ
  project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện
  (last=null)` sau đúng 3 phút chờ (03:01:14 / 03:06:28).
- Run30 là bằng chứng mạnh nhất: tải SỐNG DUY TRÌ suốt lần chạy
  (sampler 26 mẫu: load1 min 9,94 / mean 30,85 / max 42,10; load5
  mean 20,50) mà project vẫn không load xong trong 3 phút. Run29
  tải dao động mạnh (load1 min 0,89 — throttle quay lại giữa chừng,
  load-sau chỉ 0,76) nhưng cùng kết cục.
- Cả 2 lần chạy trên preview.tsx mới của L1 (9b27abe5); K5 run24 chết
  cùng mẫu trên preview cũ (ced42efd) — nên nguyên nhân là tải, không
  phải fix L1 (xem §8).

### 3.4 Reboot #39 cắt ngang run27

- Boot #38 `2f001e9c…` (uptime-s 02:24:45Z) → boot #39 `ce518c02…`
  (uptime-s 02:50:48Z). Run27 bắt đầu 02:51:08Z (theo đồng hồ cell
  cũ), chết giữa dial gate t+10 s; trap của driver đã chạy (nhả vite
  lock 02:51:26Z + dừng tải). Sau reboot: không còn tải/vite/chrome
  của L5 sót; driver resume (run-l5-resume.sh) chạy tiếp run28–30
  sạch.
- **Caveat đồng hồ:** mốc giờ ghi trong log (đồng hồ cell cũ) chạy
  nhanh hơn đồng hồ cell mới ~38 s — các timestamp 02:51:06–02:51:26Z
  của run26-cuối/run27 nằm SAU uptime-s 02:50:48Z của boot mới, điều
  không thể nếu cùng một đồng hồ. Mốc đáng tin để đối chiếu là
  boot_id (2f001e9c → ce518c02), không phải giờ tuyệt đối quanh
  reboot. Gap #38→#39 ≈ 26 phút (02:24:45Z → 02:50:48Z theo đồng hồ
  cell mới) — ngắn, phá sàn gap trước đó (19'07" đợt 106).

### 3.5 Run31 — chờ lock 7 phút, rồi QUALIFYING, BAR ĐẠT

- Run27 dở do reboot nên chỉ có 4 lần E1 thực chạy trong 5 lần prereg
  (run26–30); L5 chạy bù **run31** làm lần E1 thử thứ 5, theo đúng
  giới hạn "tối đa 5 lần E1 thử".
- Lúc bắt đầu run31 (03:10:14Z): L4 đang giữ vite lock từ ~03:07Z
  (vite :5590, config `/tmp/round110-l4/vite.w3.config.mjs`) và L1
  cũng đang chờ lock (driver pid 11794 từ 03:08:41Z). Driver run31
  chờ lock 420 s (poll 60 s, các mốc 0→420 s ghi trong log); L4 xong
  03:17:58Z (`driver110l4 done`), L5 giữ lock 03:18:0xZ và E1 bắt đầu
  03:18:15Z (load-truoc 0,67/3,60; RAM 4014 MB; preview md5
  `9b27abe5…` cả trước/sau — chạy hoàn toàn trên bản L1 đã sửa).
- Gate A đạt sau 60 s (load1 ramp 3,37 → 8,44 → 14,70 → 17,91 →
  20,53 → 23,14; load5 4,06 → 9,48 — tải sống, không sót lại vì lần
  trước đã dừng từ 03:06Z, hơn 10 phút trước). E1: vite lên 03:19:42Z,
  mount 03:20:46Z, modal đóng 03:20:50Z, PASS G0, G3 03:21:33.362Z
  (PASS, MAD=0 pixel-identical), G4 03:21:41.047Z (PASS, R=0,51),
  gap 7,685 s; G5 PASS 3,24× (03:24:14Z); exit=0 lúc 03:25:44Z,
  pass=10/10, slot0Fps=0,71, idle=tải, frozenSlots 4/11.
- Dial trong cửa sổ G3→G4: **load1 35,31 / load5 20,36, slot0Fps 0,71,
  flake=False → QUALIFYING**. Caveat (ghi rõ): cửa sổ chỉ 7,685 s
  trong khi sampler lấy mẫu mỗi 10 s nên chỉ có **n=1 mẫu** rơi vào
  trong cửa sổ; nhưng mẫu ngay trước cửa sổ (03:21:30Z, 3 s trước G3)
  cũng cho load1 38,06 / load5 20,34, và sampler cả lần chạy (36 mẫu:
  load1 mean 18,75 / min 1,00 / max 38,38; load5 mean 14,98 / min
  9,83 / max 20,36) cho thấy tải sống duy trì quanh cửa sổ — verdict
  không đứng trên một mẫu đơn độc. Load1 min 1,00 trong lần chạy là
  throttle quay lại thoáng qua giữa chừng (load-sau 0,92), không ảnh
  hưởng cửa sổ G3→G4.
- Driver dừng ngay sau run31 theo prereg (BAR_DONE=1, 03:25:45Z);
  lock nhả 03:25:44Z; L8 giữ lock ngay sau đó (vite :5599).
- Lưu ý nhãn trong log driver: dòng "BAR ĐẠT: 1 lần hoàn thành đạt
  dial 0 flake (6 I6 + 1 K5 = 7)" ghi sai "K5" — chữ này sao chép từ
  script gốc run-k5.sh; lần thứ 7 đúng là **1 L5 (run31)**. Không sửa
  log sau khi ghi (log là bằng chứng gốc); đính chính tại đây.

## 4. G4 flake — 1 lần hoàn thành mới (run31, 0 flake), BAR ĐẠT

| Nhóm | Lần E1 tới G4 | Flake | Ghi chú |
|---|---|---|---|
| Lịch sử tới K5 (chặt-chỉ-report) | 35 | 2 | 34 lần tới I6 + run22 của J7 (tải thấp) |
| Mới L5 (run31) | 1 | 0 | run31 QUALIFYING (load1 35,31 / load5 20,36 / slot0Fps 0,71) |
| **Gộp chặt-chỉ-report** | **36** | **2** | **2/36 = 5,6% (Wilson [1,5%, 18,1%])** |
| Lịch sử tính cả log-verdict | 36 | 2 | + run21 của J7 (G4 PASS trong log) |
| Mới L5 tính cả log | 1 | 0 | run31 (có cả report + log) |
| **Gộp tính cả log-verdict** | **37** | **2** | **2/37 = 5,4% (Wilson [1,5%, 17,7%])** |

- **BAR PREREG ĐẠT:** 0 flake trên tổng **7 lần E1 hoàn thành tới G4
  DƯỚI TẢI NẶNG ĐẦY ĐỦ (6 lần I6 + 1 lần L5 run31)**. Run31 là lần
  hoàn thành thứ 7 và là lần duy nhất đợt này tới được G4; 4 lần
  còn lại chết trước G4 (không tính vào bar, không tính là flake).
- Run31 (chi tiết, analyzer `analyze-l5.txt`): gap G3→G4 7,685 s,
  tap=True, R=0,51, flake=False, store={"deinterlace":true},
  load-G3G4 n=1 (load1 35,31 / load5 20,36 / threadsR 36),
  report=(10, 10), slots=11, 5 dòng G4-probe. G4-probe cho thấy
  store/hook lệch nhau đúng mẫu đã biết (sau setEnhCheckbox(true):
  hook tap=false cho tới khi setPlayhead(1.0) mới tap=true, idle
  sleeping=true, ticks=84) — nhưng verdict cuối là PASS, không flake.
- 1 lần mới không nói gì thêm về tỉ lệ flake — khoảng tin cậy vẫn
  ~2–18%. Cơ chế flake vẫn chưa biết. Điều đợt này chứng minh được:
  dưới tải nặng đầy đủ (load1 ~35, load5 ~20, slot0Fps 0,71), G4
  **có thể** PASS — tải nặng không làm G4 flake trong lần đo này.
  Nhưng 4/5 lần E1 chết ở cửa trước (CDP, project-load) nên phép đo
  G4 dưới tải vẫn mong manh: muốn thêm mẫu G4 dưới tải thì phải vượt
  qua các cửa trước trước đã (xem §9.5).

## 5. Keydown chậm tự nhiên — gộp toàn bộ

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback / abort |
|---|---|---|---|---|---|
| E8 gộp | 22 | 319 | 638 | 804ms | 0 / 0 / 0 |
| Đợt 104 (F8 + F1) | 18 | 242 | 484 | 1004ms | 0 / 0 / 0 |
| Đợt 106 H6 | 9 | 110 | 220 | 213ms | 0 / 0 / 0 |
| Đợt 107 I6 | 6 | 66 | 132 | 2197ms | 0 / 0 / 0 |
| Đợt 108 J7 (run22) | 1 | 11 | 22 | 291ms | 0 / 0 / 0 |
| Đợt 109 K5 | 0 | 0 | 0 | — | 0 / 0 / 0 |
| **Đợt 110 L5 (mới, run31)** | **1** | **11** | **22** | **2082ms** | **0 / 0 / 0** |
| **Tổng** | **57** | **759** | **1518** | **2197ms** | **0 / 0 / 0** |

- L5 đóng góp 1 lần (run31): 11 slot / 22 toggle, playMax 2082 ms /
  pauseMax 1521 ms, methods space/space, pass 10/10. Kỷ lục 2197 ms
  (I6, dưới tải) **không đổi** — run31 chậm thứ 2 trong toàn bộ dữ
  liệu (2082 ms), biên an toàn vẫn 2,4× so với timeout 5000 ms.
  Fallback #2 **vẫn mở**.

## 6. Tải nặng — cách tạo, cách đo, và độ lệch so với prereg

### 6.1 Gate v2 đã vá được lỗ hổng — bằng chứng trong đợt

- Prereg K5 chỉ yêu cầu load5 ≥ 8 ở 2 mẫu liên tiếp; K5 run25 đạt
  gate trên load5 sót lại trong khi load1 sống chỉ 1,82. Gate v2
  (load1 ≥ ~8 VÀ load5 ≥ ~8) đã bắt được đúng trường hợp đó trong
  đợt này: run30 t+10 s load5 8,15 ≥ 8 nhưng load1 0,59 → mẫu bị
  từ chối; gate chỉ đạt khi load1 thật sự lên (t+30/t+40 s).
  Không lần nào trong đợt này đạt gate trên tải chết — lỗ hổng K5
  §6.3 đã được vá và kiểm chứng bằng số đo thật.
- Throttle vẫn là biến theo thời gian, không phải trạng thái ổn định
  (đúng K5 §6.2): cùng 30 spin, trong vòng ~25 phút cho ra cả trượt
  180 s (run26 A), đạt sau 90 s (run28 A), đạt sau 20 s (run29 A),
  trượt 20 s rồi đạt sau 40 s (run30 A), đạt sau 60 s (run31 A).
  Throttle nhả đột ngột (run30: load1 0,50 → 10,63 trong 10 s) và
  quay lại giữa chừng (run29: load1 tụt tới 0,89 trong lúc E1 chạy;
  run31: load1 min 1,00 trong lúc E1 chạy dù cửa sổ G3→G4 ở
  load1 35,31).

### 6.2 Phương pháp B (I/O churn) — đạt gate nhưng chưa chứng minh bằng fps

- B đạt gate ở run26 sau 60 s (load1 25,23/30,02; load5 8,29/10,19)
  — nhưng E1 run26 chết ở CDP trước khi tới G3→G4 nên **vẫn chưa có
  bằng chứng fps nào** rằng B tạo contention thật với renderer
  (caveat prereg K5 còn nguyên: B chỉ tính khi slot0Fps ≤ ~2).
  Đừng trích B là "đã tạo được tải nặng" nếu chưa có lần nào đo được
  slot0Fps dưới B.

### 6.3 Caveat còn lại của gate v2 — load1 cũng có cửa sổ 1 phút

- Run29 gate đạt sau 20 s với load1 34,54/34,05 — nhưng driver chỉ
  dừng tải run28 20 s trước đó, nên load1 lúc đó còn chứa dư tải
  run28 trong cửa sổ trung bình 1 phút. Gate v2 dùng load1 (cửa sổ
  1 phút) nên **vẫn có thể đạt trên tải vừa dừng**, dù cửa sổ ngắn
  hơn load5 (5 phút) rất nhiều. Spin run29 sống (threads-R 37–43)
  và load1 duy trì trong lúc E1 (mean 11,85, 27 mẫu) nên tải run29
  là thật — nhưng mẫu gate không sạch hoàn toàn. Đợt sau cân nhắc:
  (a) chờ 60 s sau khi dừng tải của lần trước trước khi bắt đầu gate
  lần sau (để load1 xả hết dư); (b) yêu cầu thêm threads-R sống
  (spin thật sự đang chạy) cùng lúc với load1 ≥ 8. Không áp dụng
  ngược lại cho run29 (ghi nhận, không sửa kết quả).
- Run27 gate t+10 s (load1 45,87 / load5 23,70) là ví dụ cực đoan của
  cùng hiện tượng: toàn bộ là tải sót lại từ run26, vì spin run27
  mới bật được 10 s.

### 6.4 Tải của luồng khác trong lúc L5 chạy

- Lúc driver chính kết thúc (03:06:31Z), load vẫn 9,14/19,04 dù tải
  L5 đã dừng sạch (0 spin/io/fork alive) — tải đó là của luồng khác
  (L4 đang chạy probe, L1 đang chờ). L5 không đo tải của luồng khác,
  chỉ ghi nhận để tránh nhầm số này thành tải L5.
- Tải L5 dừng sạch sau mỗi lần E1 (driver luôn stop sau mỗi lần;
  kiểm cuối: 0 tiến trình tải L5, 0 vite/chrome L5 sót).

## 7. ENOSPC + vite chồng nhau — 0 lần, lock làm đúng việc

- **0 ENOSPC cả đợt:** watcher 5/63756 trước mọi lần; mọi vite log
  0 dòng ENOSPC; vite ready trong 4,7–6,5 s. Vite lock chung đã giữ
  đúng 1 vite của L5 tại một thời điểm (giữ/nhả 6 lần, đều ghi trong
  log: 02:51:05Z, 02:51:26Z, 02:56:08Z, 03:01:18Z, 03:06:31Z,
  03:25:44Z). Sau L5, L8 giữ lock (vite :5599) — không phải của L5.
- Hạn chế còn lại (ghi rõ): lock chỉ bảo vệ khi các luồng khác CÙNG
  dùng lock; L4 giữ lock từ ~03:07Z và L1 + L5 cùng chờ — hàng đợi
  lock hoạt động nhưng L5 phải chờ lượt (run31, xem §3.5). File owner
  trong lock lúc L4 giữ **trống** (không có tên owner) — L4 dường như
  chỉ mkdir mà không ghi owner; quy tắc stale (>30 phút + không còn
  vite) vẫn áp dụng được vì kiểm bằng `ps`, nhưng đợt sau nên thống
  nhất ghi owner để tránh nhầm lock mồ côi với lock đang giữ.

## 8. L1 sửa production giữa đợt — run28 không phải phép đo sạch

- File chia sẻ `hidden_files/round110-preview-md5.txt` lúc L5 bắt đầu
  CHƯA có; tới 02:55:02Z L1 ghi `9b27abe57975ec5b69ec2e21c3fa281c ...
  L1-fix`. Nội dung fix (theo `round110-l1/round110-l1-status.md`):
  tách 2 cờ trong `combineSkipRender()` (`lib/driftConfirmSkip103E4.ts`)
  — skipRender = N3||E4, skipRenderSeeking = chỉ N3 — để sửa cơ chế
  E4 gây CAP; L1 kiểm chứng trên cây đã sửa: unit test 12/12 + 5/5
  PASS, tsc exit 0, vite build exit 0.
- Run28 bắt đầu 02:53:09Z trên md5 cũ `ced42efd…`, kết thúc 02:56:08Z
  trên md5 mới `9b27abe5…` (fix đáp xuống 02:55:02Z, 1 s trước khi
  vite báo lên 02:55:03Z) — run28 **không phải phép đo sạch của bản
  nào**; nhưng lỗi của nó (CDP timeout, trước cả khi page load) không
  liên quan tới nội dung fix (E4/skipRender) nên không quy lỗi cho
  fix. Run29/30 chạy hoàn toàn trên md5 mới; lỗi project-load của
  chúng trùng mẫu K5 run24 trên md5 cũ — nguyên nhân là tải.
- Hệ quả cho đợt sau: khi L1 (hoặc luồng production khác) có thể sửa
  cây giữa đợt đo, cần ghi md5 đầu/cuối mỗi run (L5 đã làm) và, nếu
  có thể, thỏa thuận cửa sổ đóng băng cây với L1 trước khi chạy E1
  (như K9 đợt 109).

## 9. Giới hạn — đọc trước khi trích số

1. **Bar prereg ĐẠT** — 0 flake trên tổng 7 lần E1 hoàn thành tới G4
   dưới tải nặng đầy đủ (6 lần I6 + 1 lần L5 run31). Tỉ lệ flake gộp
   vẫn 2/36 = 5,6% chặt-chỉ-report (Wilson [1,5%, 18,1%]) / 2/37 =
   5,4% tính cả log (Wilson [1,5%, 17,7%]) — đừng trích "flake đã
   hết"; chỉ riêng 7 lần dưới tải nặng đầy đủ là 0 flake (6 I6 + 1
   L5). Cơ chế flake vẫn chưa biết.
2. **1 lần mới không nói gì thêm về tỉ lệ flake chung** — khoảng tin
   cậy vẫn ~2–18%. Điều run31 chứng minh: dưới tải nặng đầy đủ, G4
   có thể PASS (0 flake trong lần đo này).
3. **Phương pháp B (I/O churn) chưa được chứng minh** — chỉ đạt load5
   ở gate run26, chưa có lần nào đo được slot0Fps dưới B. Đừng trích
   B là tải nặng thật cho tới khi có lần E1 tới G3→G4 với slot0Fps
   ≤ 2 dưới B.
4. **Gate v2 đã vá lỗ hổng số cũ, nhưng load1 cũng có cửa sổ 1 phút**
   (§6.3) — gate run29 đạt 20 s sau khi tải lần trước dừng, mẫu gate
   chứa dư tải. Đợt sau: chờ 60 s xả tải giữa các lần +/hoặc yêu cầu
   threads-R sống cùng lúc.
5. **2 mẫu chết tiền-G3 (CDP timeout, project-load timeout) không phải
   flake G4** — nhưng chúng cho thấy dưới load1 ~30–49, Chrome có thể
   không mở được cổng debug trong 60 s, và project-load có thể không
   xong trong 3 phút; 4/5 lần E1 đợt này chết ở đó. Bar ≥7 đã đạt
   nhờ run31 vượt qua cả 2 cửa, nhưng muốn thêm mẫu G4 dưới tải thì
   vẫn phải vượt qua các cửa trước trước đã. Đợt sau cân nhắc:
   (a) tăng timeout CDP của harness (cần sửa harness — đổi md5, phải
   đăng ký trước và ghi rõ); (b) chạy E1 vào lúc throttle đang ở pha
   "nhả" (load1 sống đã cao) thay vì ép tải lên từ lúc throttle;
   (c) tăng số lần thử tối đa trên 5 (mỗi lần ~10 phút, thành công là
   xác suất) — run31 cho thấy lần thứ 5 mới thành công, nên tăng lần
   thử CÓ giá trị nếu vẫn cần thêm mẫu.
6. **Dial trong cửa sổ G3→G4 của run31 chỉ có n=1 mẫu** (§3.5) —
   cửa sổ 7,685 s ngắn hơn chu kỳ sampler 10 s; verdict đứng được là
   nhờ mẫu ngay trước cửa sổ (load1 38,06) + tải duy trì cả lần chạy
   (36 mẫu, load1 mean 18,75). Đợt sau cân nhắc sampler dày hơn
   (5 s) để cửa sổ ngắn vẫn có ≥2 mẫu.
7. **Run28 không phải phép đo sạch** (§8) — bắt đầu trên preview cũ,
   kết thúc trên preview mới (L1 fix giữa chừng). Không dùng run28
   để kết luận về bản nào.
8. **Reboot #39 + lệch đồng hồ** (§3.4) — gap #38→#39 chỉ ~26 phút,
   ngắn nhất kể từ sàn 19'07"; timestamp quanh reboot không so trực
   tiếp được giữa 2 cell (lệch ~38 s), dùng boot_id làm mốc.
9. `tsc` / `vite build` không chạy lại (L5 không đổi production; L1
   đã chạy tsc 0 + vite build pass trên cây đã sửa). TTS 39 CẤM kiểm
   lại (không kiểm); birefnet 0 lần thành công (không thử);
   ci-security.yml vẫn 403 chờ user (ngoài phạm vi).

## 10. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND110_L5_HARNESS_LIMITS.md` (file này) — mới.
- Harness KHÔNG đổi: `apps/web/scripts/clicktest-77e1-deint-fps.mjs`
  md5 giữ nguyên `ae6cd34a7dff3f6bda62199b5ab6c6fc`; `preview.tsx` giữ
  nguyên theo từng run (L1 sửa, không phải L5 — xem §8).
- Log + dữ liệu: `hidden_files/round110-l5/` (`prereg-l5.md`,
  `run-l5.sh`, `run-l5-resume.sh`, `run-l5-run31.sh`,
  `make-load-l5.sh`, `analyze-l5-g4-keydown.py` + `analyze-l5.txt`,
  `run-l5.log`, `run-l5.out`, `run-l5-resume.out`, `run-l5-run31.out`,
  `dial-gate-method-run26.txt` (= `B`), `run28.txt` (= `A`),
  `run29.txt` (= `A`), `run30.txt` (= `A`), `run31.txt` (= `A`),
  `dial-l5-run26.txt` / `run28` / `run29` / `run30` (NOT-QUALIFYING)
  / `run31.txt` (**QUALIFYING**),
  `e1-run26..31/` + `-run.log`, `load-l5-run26..31.txt`).
  Lưu ý: `load-l5-run29.txt`/`run30.txt`/`run31.txt` ghi đủ sampler
  tới lúc E1 chết/xong; `e1-run26-run.log`/`e1-run28-run.log` có dòng
  CDP timeout; `e1-run29-run.log`/`e1-run30-run.log` có dòng
  project-load timeout; `e1-run31/` có report 10/10 + G4 PASS.
  Analyzer `analyze-l5-g4-keydown.py` ban đầu quét thiếu run31
  (range 26–31) — đã sửa thành range 26–32 và chạy lại, khớp số
  trong LIMITS này (xem `analyze-l5.txt`).
- Cờ done: `hidden_files/round110-l5-done` (tạo ngay khi LIMITS +
  batch xong).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round110-l5-harness.txt`
  (NUL, đọc lại sau khi ghi).

```bash
# Chạy lại E1 dưới tải nặng với gate v2 (nhớ kiểm vite luồng khác +
# vite lock + đọc poll.log của luồng verify TRƯỚC; gate v2 yêu cầu
# load1 >= ~8 VÀ load5 >= ~8 ở 2 mẫu 10s liên tiếp — xem prereg-l5.md):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l5/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Tổng hợp lại G4 + keydown từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l5/analyze-l5-g4-keydown.py
# Lần flake tới: đọc các dòng "G4-probe" trong e1-runX-run.log — bước
# nào ăn thời gian / store-hook lệch nhau sẽ hiện rõ ở đó.
```

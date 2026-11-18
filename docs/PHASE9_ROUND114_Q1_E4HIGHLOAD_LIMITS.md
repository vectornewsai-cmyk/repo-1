# PHASE9_ROUND114_Q1_E4HIGHLOAD_LIMITS.md

## Kết luận trước

**E4 ĐÓNG ĐẦY ĐỦ — qua đường gộp N1+P1+Q1 đã đăng ký trước (prereg-q1 §7),
với caveat ghi rõ dưới đây. Đây là lần đầu tiên E4 được xác nhận trên
tải cao thật (không phải tải thấp như N1/P1).**

- **Nguồn tải đã tìm được:** hog `nice -n 19` ĐẠT — 3 lượt hợp lệ tải cao
  (play-mean load1 12,25 / 14,21 / 19,17), browser vẫn sống (ALIVE cả 3,
  VERDICT PASS/PASS cả 3, md5 không đổi). SCHED_IDLE và I/O O_DIRECT
  đều **KHÔNG DÙNG ĐƯỢC** (xem §2).
- **A/B tải cao (3 lượt hợp lệ, 160 play-tick): 0 CAP** theo cả 3 luật
  (N1/M1/cũ); 2 steady-close đã xác minh (1892 ms, drift 0,63; 1797 ms,
  drift 0,67) + 1 ended-close đã xác minh (1601 ms); **0 đuôi nào tới
  tuổi 4000 ms** (cuộc đua không đi tới sát trần như P1); stall-watch
  rộng sạch (0 stall; re-seek sau steady-close 1594 ms và 396 ms).
- **Fisher 2 phía vs K1-on (6/284): Q1-lẻ 0/160 p=0,0919 — KHÔNG đạt
  <0,05** (đúng như dự báo prereg §8: 160 tick → ~0,09). **Gộp
  N1+P1+Q1 (0/824) p=0,000273 — ĐẠT.** Theo §7, verdict = **ĐÓNG ĐẦY
  ĐỦ (qua gộp)** với caveat: mẫu gộp trộn tải thấp (N1 0/180 + P1 0/484)
  + tải cao (Q1 0/160); phần tải cao (Q1) một mình chưa đủ lực
  (p=0,0919). Lượt phụ q1f1 att2 (ngoài dải n=2, 0/61 tick) gộp vào cho
  0/221, p=0,0377 — chỉ báo kèm, KHÔNG dùng để quyết định.
- q1f1 không có lượt hợp lệ nào (att1 lỗi harness seek-timeout; att2
  ngoài dải vì play-mean n=2 sau khi probe dừng sớm — xem §3). 2 lỗi
  harness đều là pause-seek 30 s timeout (canvas không xác nhận), cả 2
  đều retry đúng luật và không ảnh hưởng verdict.
- Dị thường dial (ghi nhận, không chặn verdict): load1 đáp ứng chậm
  60–150 s sau khi khởi hog nice-19 (đọc 0,14–1,48 trong 60–120 s đầu
  dù 24 hog đang chạy), rồi bước lên 10–21; dial có thể bị lừa bởi tải
  dư đang suy giảm (q1f3 att1: dial 8,32 nhưng play-mean 4,67). Xem §3.3.

## 1. Prereg và phương pháp

- Prereg: `hidden_files/round114-q1/prereg-q1.md` (viết trước mọi phép
  đo; §10.7 đính chính browser-alive và §12.1 ghi reboot #46 — cả hai
  đều trước mọi lượt A/B). Luật CAP, tick, luật đếm **y hệt N1/P1**.
  Mẫu số chính = **play-ticks** (velocity tick tới và gồm tick đầu tiên
  ph≥5,999); 10 s quan sát sau cuối tự nhiên không tính vào mẫu số (P1
  §10.4). Fisher chính = play-ticks.
- Cây đo: **không đổi production trong lúc đo**. `preview.tsx` md5
  `03bf029f09b8890b285eacc10a02172b` (cây đã fix N1), `playheadHold90R2.ts`
  `1b68849a3f69dc13622e2a62e0ef37d1`, test `2f5c147cf4f557edc933720432b97cd2`
  — kiểm tra trước/sau mỗi lượt, **không đổi** (xác minh lần cuối
  16:40Z sau A/B: md5 vẫn 03bf029f…).
- Probe: `apps/web/scripts/probe114q1.mjs` (47.541 B) — bản sao của
  `probe113p1.mjs`, diff chỉ đổi 3 đường path (scratch/CFG_DIR/
  BRIDGE_WORK_DIR) + 1 nhãn log + header comment; không đổi logic nào.
- A/B: q1f1 gop250 / q1f2 gop30 / q1f3 gop250 / q1f4 gop30, loadN=4
  (4 `yes` của probe, y hệt N1/M1/P1) + hog nice-19 ngoài (N=12 khởi
  đầu, dial ±4, tối đa 24). Dải hợp lệ: play-mean load1 ∈ [8,30] VÀ RAM
  đầu lượt ∈ [600.000, 3.500.000] kB VÀ browser-alive (§10.5+§10.7).
  Mỗi slot retry tối đa 1 lần khi ngoài dải (theo covariate, không theo
  CAP); lỗi harness chạy lại; lượt dừng sớm (nSamples<20) là vô hiệu.
- Vite nối tiếp + lock: acquire riêng từng lượt (timeout 900 s), nhả
  lock giữa các lượt, dial-wait ngoài vùng lock, nhả ≥15 s trước khi giữ
  lại. Helper là bản copy đóng băng `vcut-vite-lock-frozen.sh` (md5
  fd21193c, khớp bản P1 dùng). Không lượt nào DEFER vì lock.
- Boot #45 → **#46 giữa đợt** (xem §1.1). WebKit launch được trên cả 2
  boot sau khi Q7 sửa libevent (Q5 q1 FAIL 14:48Z; Q5 chạy lại 15:12Z,
  MiniBrowser launch được). Q1 chạy toàn bộ A/B trên **WebKit** (không
  cần fallback Chromium).
- Stall-watch cửa sổ RỘNG + quan sát cuối clip A/B: y hệt P1 §5.

### 1.1 Reboot #46 + phối hợp Q5/Q3/Q2 (ghi trước A/B)

- **Reboot #46:** `uptime -s` = 2026-11-14 15:44:49Z, boot_id
  `7a0638c4-950a-45a0-a068-c290310fc0de`. Gap #45→#46 = 2h27'07"
  (13:17:42Z → 15:44:49Z), trong dải chứng nhận [19'07", 3h14'08"],
  không phá sàn. Q5 bị giết giữa lượt yên (pass 11/20); Q5 dọn sạch sau
  reboot (kill vite :5184 OK, nhả lock 15:45:10Z), chạy lại và probe
  exit 0 lúc 15:49:12Z; cờ round114-q5-done xuất hiện ~16:01Z.
- Q1 chờ cờ Q5 theo prereg §11.1 (mốc 60 phút ~15:55Z; Q5 đo xong
  15:49Z, cờ có 16:01Z — Q1 khởi A/B 16:23:51Z sau khi lock trống).
- Q3 chạy s76 lan 1/3 16:00–16:16Z (giữ lock, 40 node-spinners, load1
  23–28) rồi xong (rc=0, IDLE 16:16:37Z). Q1 KHÔNG khởi hog lúc Q3 đo
  (tránh làm nhiễm breakpoint s76) và KHÔNG chen lock giữa các lượt Q3
  — ghi trong run-q1.log 16:04:12Z. Q2 chạy r2 16:16–16:23Z rồi nhả lock;
  Q1 khởi A/B ngay khi lock trống (16:23:32Z).
- Cây đo nguyên vẹn sau reboot (md5 khớp §0, kiểm 15:46Z + 16:40Z).

### 1.2 Đính chính browser-alive (§10.7 prereg — trước mọi lượt A/B)

- Tiêu chí (i) gốc ("không early-stop") quá chặt: lượt p1f1 attempt 2
  (được P1 tính, 70 play-tick, VERDICT PASS/PASS) CÓ marker early-stop
  trong log. Đổi thành dữ liệu đủ: nSamples ≥ 20 VÀ VERDICT PASS/PASS.
- Tiêu chí (iv) gốc đo sai cửa sổ: maxGap chỉ trên rafSamples
  playing=true cho hog 1187–1399 ms vs lượt hợp lệ 676–782 ms — không
  tách được ở ngưỡng 3000 ms. Đổi thành **maxGap trên TẤT CẢ
  rafSamples < 3000 ms** (hog P1: 8106/8602 ms; lượt hợp lệ P1:
  676–782 ms; gap lớn của hog nằm ở pha seek).
- Checker `check-q1-browser-alive.py` đã kiểm chứng trên dữ liệu P1:
  2 hog .bak → DEAD (fail (i)–(iv)); 2 lượt hợp lệ → ALIVE.
- Analyzer Q1 (`analyze-q1-*.py`) đã kiểm chứng trên dữ liệu P1: chạy
  lại 4 file 2+2 cho đúng 268 play-tick, 0 CAP, 2 ended-close,
  1 steady-close (5274 ms) — khớp LIMITS P1 §3. (Sửa cosmetic sau đó:
  regex ENV join `run-p1.log`→`run-q1.log`, `p1f`→`q1f`, thêm
  `engine=` vào pattern — chỉ để CAP line hiện đúng stratum/load1_start;
  số CAP/tick không đổi, kiểm lại khớp sau sửa.)

## 2. Thử nguồn tải (không browser, prereg §10.3)

> Ghi đầy đủ trong `hidden_files/round114-q1/load-trials.log` (3 phiên,
> 90 s/phiên). Canary = vòng busy-loop Python cố định (~0,30–0,32 s lúc
> không tải); >3× baseline = dấu hiệu đói CPU. Q5 chưa đo yên trong lúc
> thử (Q5 q1 FAIL 14:48Z, đang chờ Q7 sửa; mọi phiên thử xong trước
> 15:09Z). Q3 IDLE (chờ cờ Q5) nên ứng viên (a) không khả dụng lúc thử.

| # | Ứng viên | Kết quả 90 s | Canary | Verdict |
|---|---|---|---|---|
| (b) | nice-19 `yes` N=12 | load1 3,17→11,71 (đang lên); mean 8,10; 10/18 mẫu trong [8,30]; max 11,71 | baseline 0,321/0,321/0,309; lúc tải 0,824 (t+30) / 0,906 (t+60) / 0,909 (cuối) = 2,6–2,9× | **ĐẠT** — dùng cho A/B. Ổn định kỳ vọng ~13–14 |
| (c) | SCHED_IDLE `yes` N=12 | load1 2,53→0,71 (GIẢM dần); mean 1,45; 0/18 trong [8,30]; max 2,53 | baseline 0,306; lúc tải 0,708 / 0,983 / 1,001 = 2,3–3,3× | **KHÔNG DÙNG ĐƯỢC** — không đẩy được load1 dù hog chạy 94% CPU (xác minh `chrt -p`: SCHED_IDLE thật, state R, 94% CPU). Giả thuyết: task SCHED_IDLE bị throttle bởi cgroup quota nên không được đếm vào loadavg (chưa xác minh sâu — không ảnh hưởng verdict) |
| (d) | I/O O_DIRECT đọc gguf 292 MB, N=8 | load1 →7,87 (đang lên); mean 5,42; 0/18 trong [8,30]; max 7,87 | baseline 0,317/0,303/0,329; cuối 1,388 = 4,3× | **KHÔNG DÙNG ĐƯỢC** — D-state = 0–1 suốt phiên (đĩa quá nhanh, không tạo D-state); canary tệ nhất (4,3×). Cơ chế không phải D-state như giả thuyết |
| (a) | Tải nền Q3 s76 | Q3 IDLE, chờ cờ Q5 (status.txt 14:56:38Z) — s76 chưa chạy lúc thử | — | Không khả dụng lúc thử; Q3 chạy s76 sau đó (16:00–16:16Z) nhưng giữ lock nên Q1 không dùng được (xem §1.1) |
| (e) | Kết hợp | Chưa thử — (b) đã ĐẠT nên dừng theo prereg §10.2 | — | Dự phòng nếu (b) fail browser-alive ở A/B (không cần tới) |

- Dọn dẹp sau mỗi phiên: `yes` còn lại = 0, `dd` còn lại = 0 (xác minh
  bằng pgrep sau mỗi phiên). Sau A/B: 0 hog còn lại (kiểm 16:40Z).
- Lưu ý: phiên I/O làm MemAvailable rơi còn ~625–724 MB (từ ~1,2 GB)
  và load1 sau dọn còn 8,51 (suy giảm chậm theo loadavg) — RAM/load
  trôi mạnh theo các luồng khác; gate RAM mỗi lượt A/B kiểm tra riêng.

## 3. Bảng lượt chạy A/B (4 slot, WebKit, cây 03bf029f)

| Lượt | gop | Attempt | load1 dial → play-mean (n) | RAM đầu lượt (kB) / stratum | Browser-alive | Kết quả |
|---|---|---|---|---|---|---|
| q1f1 | 250 | 1 | dial 10,33 → 17,48 (n=13) | 1.688.936 / J | ? (không có JSON) | **Lỗi harness** exit 2, không có probe-results.json (pause-seek 30 s timeout, §3.2) — chạy lại |
| q1f1 | 250 | 2 | dial 20,66 → **18,67 (n=2)** | 1.519.812 / J | ALIVE | exit 0, PASS/PASS, **NGOÀI DẢI (n<3, không đáng tin)** — probe dừng sớm (§3.1); báo riêng |
| q1f2 | 30 | 1 | dial 18,28 → **12,25 (n=5)** | 1.494.100 / J | ALIVE | exit 0, PASS/PASS, **TRONG DẢI** ✓ |
| q1f3 | 250 | 1 | dial 8,32 → 4,67 (n=14) | 1.323.468 / L | ? (không có JSON) | **Lỗi harness** exit 2 (pause-seek 30 s timeout, §3.2) + ngoài dải tải — chạy lại |
| q1f3 | 250 | 2 | dial KHÔNG ĐẠT (0,39) → **14,21 (n=8)** | 864.024 / L | ALIVE | exit 0, PASS/PASS, **TRONG DẢI** ✓ |
| q1f4 | 30 | 1 | dial 19,48 → **19,17 (n=4)** | 1.095.220 / L | ALIVE | exit 0, PASS/PASS, **TRONG DẢI** ✓ |

- 3 lượt hợp lệ tải cao: q1f2 + q1f3 att2 + q1f4 (play-mean 12,25 /
  14,21 / 19,17 — cả 3 trong [8,30]; RAM J/L/L trong dải; ALIVE;
  md5/mtime không đổi; VERDICT PASS/PASS).
- Tổng lượt A/B: 6 attempt (4 slot), 3 hợp lệ, 1 ngoài dải n=2, 2 lỗi
  harness (đều retry đúng luật; không lượt nào DEFER vì lock; không
  lượt nào browser DEAD).
- tsc + test trước A/B: `tsc --noEmit` exit 0, playheadHold90R2.test.ts
  93 passed (15:17Z). Sau A/B: md5 preview.tsx vẫn 03bf029f… (16:40Z).

### 3.1 q1f1 attempt 2 — ngoài dải vì play-mean n=2 (giữ nguyên luật, không sửa)

- Probe dừng sớm: "bắt đầu phát sau seek" 16:27:24 → "dừng sớm đóng
  băng-seeking" 16:27:39 (chỉ ~15 s phát; naturalEnd=False). Play-mean
  18,67 nhưng chỉ n=2 mẫu sampler (cửa sổ phát ~10 s) → **n<3, KHÔNG
  ĐÁNG TIN** theo prereg §4/P1 §10.3 → ngoài dải. Không sửa luật sau
  khi thấy số liệu: điều kiện sửa (naturalEnd=true) KHÔNG thỏa, và
  tiền lệ p1f1 att2 cũng dừng sớm tương tự (ph 5,3) nhưng có n=7 nên
  được tính — luật n≥3 phân biệt đúng 2 trường hợp này.
- Lượt này vẫn có dữ liệu CAP đầy đủ (61 play-tick, 0 CAP, 1
  ended-close đã xác minh 1770 ms) và được báo riêng ở §4 (phụ) — không
  tính vào Fisher chính.

### 3.2 Hai lỗi harness: pause-seek 30 s timeout (không phải lỗi app)

- q1f1 att1 (24 hog, dial overshoot): "pause-seek tới t=5:
  confirmed=false tElement=1589ms tCanvas=nullms" → PROBE LỖI exit 2.
- q1f3 att1 (12 hog, dial trên tải dư): "tElement=886ms tCanvas=nullms"
  → PROBE LỖI exit 2.
- Cả 2: seek tới t=5 không được canvas xác nhận trong 30 s (tCanvas
  null) — probe từ chối đo trên khung stale. Đây là giới hạn của probe
  dưới tải cao (canvas xác nhận chậm), không phải CAP và không phải lỗi
  production; cả 2 đều retry đúng luật prereg §4 (chạy lại vì lỗi
  harness, không săn kết quả). Không lượt nào trong 2 lượt này có
  probe-results.json nên không có dữ liệu CAP.

### 3.3 Dị thường dial: load1 đáp ứng chậm 60–150 s sau khi khởi hog (quan sát mới)

- q1f1 att1 dial: load1 đọc 0,14–0,18 trong 60 s đầu dù đã 24 hog
  nice-19 đang chạy (state R, ~8% CPU mỗi hog); tới ~92 s mới nhảy lên
  10,33 → DIAL-ĐẠT. Dial đã tăng hog 12→16→20→24 trong lúc chờ (tối
  đa 24) — overshoot này có thể góp phần gây seek-timeout ở att1.
- q1f3 att2 dial: load1 đọc 0,39–1,48 suốt 120 s (24 hog) → KHÔNG ĐẠT;
  chạy theo luật "vẫn chạy ở mức đo được" — nhưng load1 bước lên
  17–21 TRONG LÚC probe chạy (sampler: 17,60 lúc 16:33:52 → 21,45 lúc
  16:34:07) nên play-mean vẫn 14,21 (n=8) trong dải. Đường "chạy dù dial
  không đạt" đã cứu lượt này — vì probe mất ~60–90 s mới tới lúc phát
  (vite boot + seek), đủ cho load1 bước lên.
- q1f3 att1: dial ĐẠT nhanh (8,32 trong 10 s) trên **tải dư đang suy
  giảm** từ q1f2 (hogs cũ vừa dừng) — tới lúc phát, tải dư đã suy và
  hogs mới chưa bước lên → play-mean chỉ 4,67 (n=14). **Bài học: 2 mẫu
  liên tiếp trong dải có thể bị lừa bởi tải dư suy giảm; dial nên yêu
  cầu tải ổn định/không giảm, hoặc chờ hogs chạy đủ ~90–120 s trước
  khi tuyên bố ĐẠT.** Ghi vào nợ mở đợt 115 (không sửa luật giữa đợt).
- Cơ chế gây chậm chưa xác minh: giả thuyết là cgroup CPU quota (1,5
  CPU) throttle làm task bị dequeue khỏi runqueue nên loadavg không đếm
  (ủng hộ một phần: có lúc đếm 27 tiến trình R-state nhưng load1 chỉ
  0,64 — tuy nhiên mẫu đó lấy sau khi hogs đã dừng nên không kết luận
  được). Ghi là giả thuyết chưa xác minh, không ảnh hưởng verdict (dial
  + play-mean đo trực tiếp mới là số phân dải).

## 4. CAP và Fisher

- CAP (luật N1 = M1 = cũ): **0 trên mọi lượt có dữ liệu, mọi luật.**
  3 lượt hợp lệ: 0/160 play-tick. Lượt phụ q1f1 att2: 0/61. Tất cả Q1
  có dữ liệu: 0/221.
- Fisher 2 phía (play-ticks; tính bằng hàm analyzer VÀ kiểm lại độc
  lập bằng `math.comb` — khớp đúng 6 chữ số):

| So sánh | p | Kết luận |
|---|---|---|
| Q1 chính 3 lượt (0/160) vs K1-on (6/284) | **0,0919** | KHÔNG đạt <0,05 (đúng dự báo §8: 160 tick → ~0,09) |
| Q1 chính 0/160 vs L1-fix (1/179) | 1,0000 | Không có ý nghĩa (L1-fix vốn chỉ 1 CAP) |
| Q1 chính 0/160 vs M1-fix (1/157) | 0,4953 | Không có ý nghĩa |
| Q1 chính 0/160 vs N1 (0/180) | 1,0000 | Tham chiếu (cùng cây, tải thấp) |
| **Gộp N1+P1+Q1 (0/824) vs K1-on** | **0,000273** | **ĐẠT <0,05** — đường gộp §7 |
| Phụ: tất cả Q1 (0/221) vs K1-on | 0,0377 | Đạt về số, nhưng gồm lượt ngoài dải (q1f1 att2) — chỉ báo kèm |
| Phụ: gộp N1+P1+tất-cả-Q1 (0/885) vs K1-on | 0,000197 | Báo kèm |
- Poisson hỗ trợ (báo kèm, không quyết định): P(0 CAP | 160 tick, rate
  K1-on 6/284) = 0,0340; 221 tick → 0,0094; 824 tick → ~0,0000.
- Đối chiếu quy tắc quyết định prereg §7: (a) 0 CAP trong các lượt hợp
  lệ tải cao ✓; (b) kiểm cơ chế đạt ✓ (§5: 0 đuôi age ≥4000 ms);
  (c) mọi steady/ended-close được loại đều có bằng chứng ✓ (§5);
  (d) ≥1 steady-close đã xác minh ✓ (2: q1f2 1892 ms, q1f4 1797 ms);
  (e) stall-watch rộng sạch ✓ (§6: 0 stall); (f) Fisher Q1-lẻ p=0,0919
  KHÔNG đạt → đi đường gộp: Fisher gộp N1+P1+Q1 p=0,000273 <0,05 →
  **ĐÓNG ĐẦY ĐỦ (qua gộp), caveat: mẫu gộp trộn tải thấp (N1+P1) +
  tải cao (Q1); phần tải cao (Q1) một mình chưa đủ lực.**

## 5. Cơ chế: steady-close, ended-close (tải cao)

- **Steady-close đã xác minh (2, trên tải cao):**
  - q1f2: đuôi ended=6503, tuổi ở tick cuối 1312 ms, đóng ở tuổi **1892
    ms** (tick 26; steadyAdvances_last=3, drift_last=0,63 > 0,35).
  - q1f4: đuôi ended=4573, tuổi ở tick cuối 1316 ms, đóng ở tuổi **1797
    ms** (tick 22; steadyAdvances_last=3, drift_last=0,67 > 0,35).
  - Cả 2 đều đóng SỚM (tuổi ~1,3 s ở tick cuối, ~1,8–1,9 s lúc đóng) —
    khác hẳn P1 (1 đuôi sát trần 4793 ms): dưới tải cao, decoder vẫn
    tăng đều đủ để steady-close bắt sớm.
- **Ended-close đã xác minh (1, trên tải cao):** q1f3: đuôi ended=11279,
  tuổi ở tick cuối 1110 ms, đóng ở tuổi **1601 ms** (tick 27; ct=6,
  dur=6, ended=true).
- **Phụ (q1f1 att2, ngoài dải):** ended-close đã xác minh (1770 ms;
  ended=7906, tuổi tick cuối 1589 ms).
- **Không có đuôi nào age ≥ 4000 ms trong cả 3 lượt hợp lệ** (MECH:
  0 đuôi) — cuộc đua đuôi-vs-trần không đi tới sát trần dưới tải cao
  trong đợt này. (P1 tải thấp có 2 đuôi 4892/5002 ms được rearm cứu.)
  Vì vậy (b) prereg §7 đạt theo dạng mạnh (không có đuôi già để kiểm),
  và paused<20% trong đuôi age≥4000 ms đạt theo dạng rỗng (không có
  đuôi nào để đo).
- Đuôi cuối clip: q1f2 (tuổi 907 ms, đóng không rõ đường ở tick 51);
  q1f3 rearm cứu (tuổi 1016 ms, rearms 2→3 ở tick 50); q1f4 không có
  đuôi nào mở tại localPh≥5,0. Tất cả đều KHÔNG CAP.

## 6. Stall-watch cửa sổ rộng và quirk frame cuối

- **Stall-watch: 0 STALL.** q1f2: drift re-seek đầu tiên sau
  steady-close ở tick 33, seeking **1594 ms** (<2000 ms, không stall).
  q1f4: re-seek ở tick 29, seeking **396 ms**. q1f3: 0 steady-close nên
  không có stall-watch. Không có seeking >2000 ms nào sau steady-close.
- **Quirk frame cuối (luật prereg §5.2): cả 3 lượt đều (iii) không đủ
  cửa sổ** — chỉ 5 / 14 / 5 tick playing=true trong cửa sổ ph≥5,0
  (dưới tải cao, rAF thưa nên cửa sổ 5,0→6,0 chỉ có vài tick);
  playing=false (timeline kết thúc) trước khi đủ 2 tick loại (ii), và
  không có tick loại (i). **Không kết luận quirk có hay không** — đúng
  như dự báo prereg §9 (kết quả (iii) là có thể xảy ra nhất).
  Không quan sát được ended bắn trong lúc phát ở lượt nào trong đợt này
  (khác P1: 4/8 lượt có (i)) — nhưng cửa sổ quá mỏng nên không kết
  luận đây là khác biệt thật.

## 7. Kiểm chứng

- `tsc --noEmit` (apps/web): **exit 0** (trước A/B 15:17Z).
- `playheadHold90R2.test.ts`: **93 passed** (trước A/B 15:17Z).
- md5 cây đo trước/sau mỗi lượt đều không đổi (xem §3); không thay đổi
  production nào trong Q1 — chỉ đo + thêm probe/LIMITS.
- Analyzer: `analyze-q1-cap-pattern.py`, `analyze-q1-mechanism.py`,
  `analyze-q1-endframe.py` + wrapper `analyze-q1-file.py` (code Fisher
  y hệt N1/P1) — đã kiểm chứng khớp 100% trên dữ liệu P1 2+2 trước A/B
  (268 play-tick, 0 CAP, 2 ended-close, 1 steady-close 5274 ms).
  Fisher gộp tính lại độc lập bằng `math.comb` (khớp analyzer: Q1-lẻ
  p=0,0919; gộp p=0,000273).
- Checker browser-alive: DEAD/DEAD trên 2 hog P1, ALIVE trên lượt hợp
  lệ P1 (kiểm trước A/B); ALIVE cả 3 lượt hợp lệ Q1 + q1f1 att2.
- Sau A/B: 0 hog còn lại (pgrep yes = 0, 16:40Z); lock vite trống;
  md5 preview.tsx 03bf029f… không đổi.

## 8. Hạn chế và nợ mở

- **Đường gộp trộn tải:** verdict ĐÓNG ĐẦY ĐỦ đi qua Fisher gộp
  N1+P1+Q1 (caveat §4). Phần tải cao một mình (Q1 0/160, p=0,0919)
  chưa đủ lực thống kê — cần thêm tick tải cao nữa (vd ~50–60 tick
  nữa là tới ngưỡng 210 tick, p≈0,04) mới đóng đầy đủ mà không cần gộp.
  Đề xuất đợt sau: 1–2 lượt tải cao nữa (cùng luật) để củng cố phần
  tải cao, nếu user muốn bỏ caveat.
- **q1f1 không có lượt hợp lệ:** 2 attempt đều hỏng (harness + n=2).
  Slot gop250 chỉ có q1f3 đại diện (64 tick); gop30 có q1f2+q1f4
  (54+42 tick). Không ảnh hưởng verdict (Fisher gộp theo tick, không
  theo slot) nhưng cân bằng gop chưa đều.
- **Dial tải:** load1 đáp ứng chậm 60–150 s sau khi khởi hog nice-19;
  dial 2-mẫu-liên-tiếp có thể bị lừa bởi tải dư suy giảm (q1f3 att1).
  Đợt sau: dial nên yêu cầu hogs chạy đủ ~90–120 s hoặc tải
  ổn-định/không-giảm trước khi tuyên bố ĐẠT; cân nhắc sampler dày hơn
  (2 s) để play-mean có n lớn hơn (q1f1 att2 chỉ n=2 vì cửa sổ phát
  ~10 s).
- **Seek-timeout dưới tải cao:** 2/6 attempt lỗi harness vì canvas
  không xác nhận seek trong 30 s (cả 2 đều ở lượt gop250). Probe nên
  có retry seek hoặc timeout dài hơn dưới tải cao — nợ dụng cụ.
- **Quirk no-ended chưa có câu trả lời:** cả 3 lượt đều (iii) không đủ
  cửa sổ. Cần clip dài hơn hoặc cửa sổ quan sát rộng hơn (prereg riêng,
  như P1 §5 đã ghi).
- **Tải cao chưa tới 30:** play-mean cao nhất 19,17; dial tối đa ~21.
  Dải [8,30] đạt được nhưng chưa chạm biên trên. Muốn đo ở 25–30 cần
  nhiều hog hơn (24 đã là tối đa prereg) hoặc tải nền thật lớn hơn.
- Chưa lên: đợt 111+112+113 (28 batch / 60 entry / 52 file duy nhất) +
  1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`;
  ci-security.yml vẫn 403 chờ user; G1 + mù #22/#28/#29/#30/#31/#32 chờ
  user quyết; TTS 39 CẤM kiểm lại; birefnet 0 lần thành công (RAM <6 GB).

## 9. File trong batch

- `docs/PHASE9_ROUND114_Q1_E4HIGHLOAD_LIMITS.md` (file này).
- `apps/web/scripts/probe114q1.mjs` — **47.541 B > 37.768 B, cần
  `ENABLE_PRIVSEP=0` khi push**.
- Dữ liệu thô + script + prereg + analyzer: `hidden_files/round114-q1/`
  (không push; prereg 2 đính chính, load-trials.log, run-q1.sh,
  check-q1-browser-alive.py, analyzer, 4 thư mục probe, hog-load-*.txt,
  analyze-q1-main.txt, analyze-q1-q1f1att2.txt, tsc-test.log).

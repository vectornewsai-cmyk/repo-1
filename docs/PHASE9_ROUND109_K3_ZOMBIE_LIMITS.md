# PHASE9_ROUND109_K3_ZOMBIE_LIMITS — Zombie gate (b) DẠNG MẠNH + dial tải [3, 8] + zombie Δ trên dữ liệu pause-burst R0 của J3

> Luồng K3, đợt 109. Lượt cron 06:35 +07 14/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.
> Không sửa production** — chỉ probe mới (`probe109k3-frame-parity.mjs`, kế thừa
> probe108j3 + band-wait + flush worker ring) + analyzer rev3 + holder tải.
> Prereg (viết TRƯỚC khi đo): `hidden_files/round109-k3/prereg-k3.md`.
> Dữ liệu thô: `hidden_files/round109-k3/` (driver-k3.log, các lượt probe + analysis,
> round109-k3-analyze.py, round109-k3-zombie-r0.py, j3r0-zombie-analysis.txt, run-k3.sh,
> load-holder-k3.sh, build-k3.py, prereg-k3.md).

## 0. Tóm tắt

- **R2 (lượt trong dải thứ hai): TRONG DẢI 100% (load5 median 5,16; 16/16 snap) và
  DẠNG MẠNH QUAN SÁT ĐƯỢC LẦN ĐẦU:** in-page 8 gap đạt bar (trusted 6), trong đó
  **1 gap distinct_strict = 2** (330 ms, ph 69,17→70,00, skips=2, inside [69,433,
  69,833], bracket 614 ms); CDP 0/60 gap đạt bar (như mọi lượt trước). Giám định
  bằng dữ liệu thô: CDP đọc đúng 2 giá trị trung gian, khớp chính xác state100;
  drawsTotal đứng yên 804; e4skip 24→25 trong gap. Đây là lần đầu dạng mạnh xuất
  hiện trong chuỗi J3 (0/4 lượt) + K3. Xem §2.3 và §3.
- **R3 (lượt trong dải thứ ba): TRONG DẢI 100% (load5 median 4,87; 18/18 snap) nhưng
  gate (b) 0 gap:** chỉ 1 draws-gap >300 ms — stall 5 s tại biên clip 60 s
  (ph đỗ 60,00, skips=297, main thread vẫn sống: worker r-gap max 498 ms, CDP chỉ
  2 gap >300 ms). Đây là stall chuyển clip, KHÔNG phải gate (b). Xem §2.4.
- **Kết quả chung đợt K3: dial tải [3,8] giữ được 3/3 lượt (49/50 snap trong dải);
  dạng mạnh 1/3 lượt (R2); dạng yếu 2/3 lượt (R1, R2); CDP bar 0/3 lượt.**
  Cộng J3 (4 lượt, 0 dạng mạnh) → dạng mạnh 1/7 lượt toàn chuỗi J3+K3.
- **Zombie Δ trên dữ liệu pause-burst R0 của J3 (đã xong, phân tích offline): 0/12 biên
  blur→noblur** (zombie Δ = 0 mọi biên; 0 capture trong cửa sổ clip lẻ — post-seek 0,
  pre-seek 0, giữa 45–84 cũng 0; skip-clip-inactive 0). Xem §5.
- **Analyzer rev3 unit-test PASS trên dữ liệu J3 (trước khi đo):** CDP R0 7 / R1 5
  (khớp J9 đính chính 1), trusted gộp 22/33 (khớp J9 đính chính 2), distinct_strict
  ≥ 2 = 0 mọi lượt. Xem §6.
- **Hiệu chỉnh bộ tạo tải (trước R1):** node spin-loop chỉ nhận ~4–5% CPU mỗi hog khi
  ~40 tiến trình runnable tranh 1,5 CPU — hog vẫn cộng vào loadavg (state R) nhưng
  không tạo được tải thật khi máy đã đông. Holder điều chỉnh N theo load1 (xem §1.2).
  (Đính chính sau R1: hog vẫn quay thật — 6 hog ăn tổng ~1,15 CPU, TIME 18–48 s mỗi
  hog; load1 đọc được dao động mạnh 0,29–9,60 trong cùng điều kiện — xem §1.2.)
- `preview.tsx` md5 `ced42efd785724c8c0d1b16fc32c7341` trước = sau R1, R2 và R3
  (mtimeChanged=false cả ba lượt).

## 1. Phương pháp và điều kiện chạy

### 1.1 Bar dạng mạnh + dial tải (đăng ký trước trong prereg-k3.md §2–§3)

- Dạng mạnh = ≥1 gap đạt bar J3 (skips>0 + spread G2 in-page, hoặc bản CDP:
  recv-gap >300 ms + Δe4skip>0 + Δph ≥ 0,7×gap + drawsTotal không đổi) VÀ
  distinct_strict ≥ 2 (≥2 giá trị ph khác nhau nghiêm ngặt giữa hai đầu gap).
  Bar J3 cũ (chỉ cần spread) vẫn báo cáo song song để so sánh.
- Trusted (rev3): n_inside ≥ 2 (theo đính chính prereg J3 §1.3 + J9 đính chính 2);
  bracket báo cáo kèm riêng.
- Sentinel e4skip=-1 = "chưa khởi tạo": analyzer rev3 chỉ tính Δe4skip khi cả hai
  đầu ≥ 0 (J9 đính chính 1).
- Dial tải: load5 (trường thứ 2 /proc/loadavg) ghi mỗi 5 s trong lúc phát
  (progressSnaps). Giữ tải bằng holder ngoài probe (load-holder-k3.sh): N hog node
  busy-loop, điều chỉnh theo load1 mỗi 15 s (load1 < 4 → +1 hog tối đa 6;
  load1 > 7 → -1 hog tối thiểu 0). Probe chạy --sysload 0, cổng chờ yên cũ
  (load1 < 2,0) thay bằng cổng dải tải (band-wait): chờ load5 ∈ [3, 8] tối đa
  300 s rồi vẫn phát.
- Luật loại lượt (đăng ký trước): lượt bị LOẠI khỏi bar dạng mạnh nếu <50% snapshot
  trong cửa sổ đo có load5 ∈ [3, 8] (dữ liệu vẫn giữ kèm bối cảnh). Lượt "trong dải"
  nếu load5 median ∈ [3, 8] VÀ ≥80% snapshot trong dải.
- Đối chiếu CDP-vs-worker (rev3): nearest-duration matching cho từng gap CDP đạt bar
  (không so max-vs-max nữa — J3 §4 thừa nhận metric sai); bar ±50 ms tính trên các
  cặp đã khớp.
- Worker clock: probe drain W3.workerTicks ra worker-ticks.jsonl mỗi 5 s (bài học J3
  R0 mất đầu lượt do ring 20000 tự cắt); analyzer rev3 gộp file drained + tail trong
  results.json theo r tăng dần.
- KHÔNG đo thêm kill (đã ĐÓNG). KHÔNG sửa production.

### 1.2 Hiệu chỉnh bộ tạo tải (trước R1, 23:46–23:48Z)

- Test 1 (23:46:01Z, 3 hog node spin, 90 s): load1 14,80 → 5,51 trong lúc hog chạy
  (sóng sibling đang tan; không tách được đóng góp của hog). procs_running 6–9 →
  36–43 cuối test (sibling spawn nhiều tiến trình).
- Test 2 (23:47:5xZ, 2 hog, 15 s): mỗi hog chỉ nhận %CPU 4,1–5,5%, TIME 00:00:00
  sau 15 s (state Rl) — khi ~40 tiến trình runnable tranh 1,5 CPU thì mỗi hog gần
  như không có CPU. Hog vẫn là tiến trình runnable nên vẫn cộng ~1 vào load1 mỗi
  hog, nhưng KHÔNG tạo được áp lực CPU thật lên main thread của trình duyệt khi
  máy đã đông — đúng như J7 ghi ("busy-loop không tạo được tải"). Kết luận: holder
  điều chỉnh N theo load1 là cách giữ dải duy nhất khả thi; nếu sibling đã đông thì
  holder tự giảm N về 0 và dải được giữ bằng tải sibling (ghi rõ nguồn tải từng lượt).
- Máy lúc viết prereg (23:45Z): load 25,44/8,34/3,37, procs 35, RAM khả dụng 1143 MB
  (có lúc ~433 MB). Sóng sibling đợt 109 (K1/K2/K4/K5/K7) chi phối tải đầu lượt.
- **Lỗi holder phát hiện lúc chạy thật (00:09:03–00:10:21Z):** `count_hogs()` in ra
  "0\n0" khi file pids rỗng (`grep -c` đã in 0 rồi `|| echo 0` in thêm 0) → test
  `[ 0\n0 -lt 6 ]` lỗi "integer expression expected", nhánh +1 hog bị bỏ qua lặng lẽ
  trong lúc N=0. Nhánh −1 hog vẫn chạy đúng (N 3→2→1→0 khi load1 22,89 → 26,46 →
  29,31). Đã sửa file (`grep -c . file || true`); các lượt sau dùng bản sửa. Holder
  đang chạy lúc đó giữ bản lỗi (chỉ ảnh hưởng nhánh +1 khi N=0 — không ảnh hưởng
  R1-abort vì load1 lúc đó >7). Bản sửa đã kiểm chứng ở R1 lần 2: nhánh +1 chạy
  đúng (N 0→1→2→3→4→5→6 khi load1 < 4).
- **Hog quay thật nhưng load1 đọc được dao động mạnh (phát hiện ở R1 lần 2):** 6 hog
  node spin ăn tổng ~1,15 CPU (mỗi hog %CPU 14–29%, TIME 18–48 s) nhưng load1 đọc
  được trong cùng lúc dao động 0,29 → 5,59 trong 1 phút, có lúc 0,22–0,29 trong khi
  hog vẫn quay. Giải thích có thể: task bị throttle bởi CPU quota của cell (1,5 CPU)
  không còn counted là runnable trong lúc bị throttle; hoặc loadavg của VM này
  nhiễu. Hệ quả thực hành: load1 KHÔNG dùng làm dial chính (đã đúng từ J3/I6);
  load5 là dial chính và hành xử ổn định (hạ đơn điệu 21,46 → 4,16 khi máy yên).
  Holder vẫn điều chỉnh theo load1 (luật prereg) nhưng kết quả cuối cùng đánh giá
  bằng load5 — ghi nhận mâu thuẫn này, không giấu.
- **Bài học R1 (ghi cho lượt sau):** holder KHÔNG nên chạy trong lúc probe lấy kết
  quả — 6 hog ăn ~1,15 CPU làm chậm pha serialize results.json 57 MB (probe kẹt
  ~3,5 phút ở bước lấy kết quả sau khi phát xong 00:30:06Z; giết holder tay lúc
  00:33:45Z xong probe exit ngay 00:33:55Z). run-k3.sh hiện chỉ giết holder SAU khi
  probe exit — vòng sau nên giết holder ngay khi phát xong (trước khi lấy kết quả)
  hoặc giảm N về 0 ở bước đó. Đã áp dụng bằng tay ở R2 (giết 00:37:47Z, lấy kết quả
  chỉ ~1 phút) và R3 (giết 00:53:36Z) — hiệu quả, ghi nhận để sửa run-k3.sh sau.
- **Hog không nâng được load5 khi máy yên (phát hiện ở R3, 00:45–00:50Z):** 6 hog
  node spin ăn tổng ~1,6 CPU (mỗi hog %CPU 14–33%, state R, TIME tích lũy nhanh)
  nhưng load1 đọc được chỉ 0,28–1,52 và load5 rơi đơn điệu 2,13 → 1,08 trong 285 s
  WAIT-BAND. Nghĩa là **loadavg của VM này không phản ánh CPU hog** (có thể task bị
  throttle bởi CPU quota cell 1,5 CPU không còn counted là runnable, hoặc loadavg
  đo ở tầng khác). Hệ quả: (a) WAIT-BAND trước khi vite lên KHÔNG THỂ đưa load5
  vào [3, 8] bằng hog khi máy yên — R3 chỉ vào dải ở giây 285 nhờ sóng sibling
  (load1 nhảy 8,71); (b) dải tải trong lúc phát được giữ bằng **vite + Chromium +
  tải sibling**, holder chỉ đóng vai trò phụ (tự giảm N về 0 khi sibling đông, tự
  tăng N khi máy yên nhưng không hiệu quả); (c) kết quả "trong dải 3/3 lượt" vẫn
  đứng (đo bằng load5 trong lúc phát), nhưng **không được diễn giải là "holder giữ
  được dải"** — holder giữ dải là tuyên bố SAI với dữ liệu R3. Vòng sau cần bộ tạo
  tải khác (vd: tải I/O, hoặc chạy thêm vite/Chromium nền) nếu muốn dial độc lập
  với sibling.
- **ENOSPC thoáng qua ở R3 (00:50:11Z):** vite attempt 1 chết
  `ENOSPC: System limit for number of file watchers reached` (watch
  `apps/web/scripts/probe-round35-r6-discard-dpr-pipe.mjs`); attempt 2 lên ngay
  00:50:26Z. Lúc kiểm tra sau đó chỉ còn 8 inotify FD (trần 63756) — ENOSPC thoáng
  qua, có thể do vite sibling vừa tắt/chưa giải phóng watchers, hoặc vite tự spike
  lúc khởi động. Ghi nhận (K8 đang điều tra ENOSPC); không ảnh hưởng dữ liệu R3.

### 1.3 Phối hợp vite / K9 poll.log

- K9 (verify đợt 109) đã có thư mục + poll.log lúc 23:52Z (đã đọc trước R1):
  POLL#0 23:40:25Z, #1 23:42:21Z, #2 23:52:21Z — boot #36 (22:53:56Z), 0/8 cờ done.
  K8-done xuất hiện sau poll #2 (~23:5xZ).
- Vite sibling lúc bắt đầu R1: K4 probe109k4 (chr-code-blur-r52) dùng vite :5590
  (PID 30592, từ 00:00Z); K1 probe104f5 (webkit, phase k4on, loadN 4) cũng dùng vite
  (5580–5589, chưa spawn lúc 00:00Z). run-k3.sh chờ vite luồng khác tắt (poll 60 s,
  tối đa 20 phút) trước khi bật vite của mình. Tổng inotify watches lúc 00:00Z chỉ
  1628 (trần 63756) — ENOSPC chưa phải nguy cơ lúc này.
- **Lỗi vite-wait tự trúng launcher (00:01–00:07Z):** `pgrep -af vite` trúng cả shell
  launcher của chính driver (dòng echo chứa chữ "vite-wait") nên vòng chờ không bao
  giờ qua được (chờ 300 s vô ích, log WAIT-VITE 00:06:32Z vẫn thấy "vite"). Đã giết
  lượt chờ cũ, sửa run-k3.sh chỉ khớp tiến trình vite thật (`pgrep -af '\.bin/vite'`),
  relaunch R1 00:08:14Z — vite-wait qua ngay.
- **Sóng tải K5 run24 (00:07–00:13Z):** ~30 tiến trình `python3 -c "while True: pass"`
  (PPID 1, bộ tạo tải của K5, bắt đầu ~00:06–00:07Z) đẩy load1 0,38 → 37,49, load5 lên
  19,55; K5 vite :5580 (round77-e1) chạy E1 run24. K5 run24 CHẾT 00:13:41Z (HARNESS LỖI:
  timeout chờ project mẫu + hook) nhưng vite :5580 còn sót; K1 k4on cũng chết trước
  đó (exit=2, enospc-fail-k4on). K1 tìm được cửa yên 00:13:59Z và chạy k1on (webkit
  launched 00:15:02Z, loadN 4, timeout 900 s); K5 sang run25 (dial gate A ĐẠT sau 20 s,
  load5 ≥ 8). Cửa yên 00:13–00:15Z (load1 0,54) đóng lại ngay khi K1/K5 cùng chạy.
- K9 poll.log đã đọc trước R1 (POLL#2 23:52Z, boot #36, 0/8 cờ); đọc lại trong lúc
  chạy: POLL#6 00:32:23Z (cờ K5 K6 K8, 3/8), POLL#7 00:42:23Z (cờ K2 K4 K5 K6 K8,
  5/8). Tới cuối K3 (~00:54Z): K1, K7 chưa có cờ done (K9 verify chưa xong — đúng
  quy trình, K9 verify sau cùng).
- R3: vite attempt 1 chết ENOSPC (00:50:11Z, xem §1.2); attempt 2 lên 00:50:26Z.
  Không có lần chờ vite nào khác trong R2/R3 (không có vite sibling lúc khởi động).

## 2. Kết quả từng lượt

### 2.1 R1 — freeze, holder N=3 — LẦN 1: ABORT ở WAIT-BAND (không tính là lượt chạy)

- 00:08:14Z relaunch sau fix vite-wait: vite-wait qua ngay, holder bật N=3 hogs.
  Nhưng sóng tải K5 run24 ập tới ngay lúc đó (load1 19,07 → 39,57; load5 8,12 →
  19,55; 30 python spinner của K5). Holder tự giảm N 3→2→1→0 theo đúng luật
  (load1 > 7 → −1 hog) nhưng tải sibling vẫn tăng.
- 00:10:17Z WAIT-BAND 120 s: load5=19,13 (load1 39,18) — vẫn ngoài dải. Quyết định
  GIẾT lượt chờ lúc 00:10:58Z thay vì để band-wait (300 s) + band-wait trong probe
  (300 s) trôi hết rồi phát dưới tải cực nặng (draws sẽ đói, vite + Chromium thêm
  tải cho sibling, dữ liệu gần như chắc chắn ngoài dải). 0 dữ liệu probe, vite K3
  chưa bật, holder đã giết hết hogs — lần này KHÔNG tính là lượt chạy.

### 2.2 R1 (lần 2) — freeze, holder N=3 → TRONG DẢI, DẠNG YẾU (3 gap), DẠNG MẠNH 0

- Thời gian: vite-wait 00:17:49–00:19:50Z (chờ vite K5 :5580 run25 tắt, ~2 phút);
  WAIT-BAND 00:19:50–00:24:51Z (300 s, load5 21,46 → 10,00 — chưa vào dải);
  probe band-wait 00:25:37–00:28:47Z (190 s, load5 10,48 → 7,96 — VÀO DẢI);
  phát 00:28:47–00:30:06Z (~79 s wall cho 72 s timeline); lấy kết quả tới 00:33:55Z
  (kẹt ~3,5 phút do holder N=6 ăn CPU — đã giết holder tay 00:33:45Z, xem §1.2);
  phân tích xong 00:33:56Z. Exit=0. Boot #36 suốt lượt (không reboot).
- Điều kiện: load lúc phát 3,92/7,96; load5 trong lúc phát 8,01 → 6,40 (16 snap,
  median 7,21; 15/16 = 94% trong [3, 8] — snap đầu 8,01 chỉ vượt 0,01);
  procs_running median 8 (2–15); draws/s median 19,2 (draws/5s 287 → 41, giảm dần
  suốt lượt — xem caveat §8); RAM khả dụng lúc phát 1957 MB. preview.tsx md5
  `ced42efd…` trước = sau, mtimeChanged=false.
- Dữ liệu: caps 813, drawsTotal 2007 (drawsKept 2000 — ring tràn 7 mẫu đầu, xem
  caveat), mainDraws 847, state100 649 mẫu, CDP 876 mẫu (0 lỗi), workerTicks gộp
  20747 (drained 20606 + tail 141 — flush ring CHẠY ĐƯỢC, không mất đầu lượt như
  J3 R0), pumpN 353, driftConfirmSkips 23, seekSkipTicks 67, pageErrs 0.
  results.json 57.255.128 byte (caps dày trong dải — lớn gấp 3,3× R0 của J3).
- Gate (b) in-page: **3/9** gap đạt bar (skips>0 + spread), trusted 2, **distinct_strict
  ≥ 2 = 0** — cả 3 gap đều distinct=1 (1 bước trung gian + plateau): 396 ms ph
  53,50→54,20 skips=1 inside [53,9, 53,9, 54,2]; 411 ms ph 65,30→66,07 skips=1
  inside [65,867, 66,067×3]; 302 ms ph 67,57→69,07 skips=1 inside [68,267].
  Dạng yếu, đúng chữ ký J3.
- Gate (b) CDP: **0/23** recv-gap đạt bar. Ràng buộc chặn là Δdraws>0: 21/23 gap có
  Δdraws 2–3 (draws vẫn xảy ra trong cửa sổ — canvas không đóng băng hẳn); chỉ 1 gap
  có Δdraws=0 (412 ms, Δph=0,133, Δe4skip=0 — đóng băng toàn bộ, bị loại đúng);
  1 gap có Δe4skip=1 (309 ms, Δph=0,200 < 0,22 cần — suýt đạt). 2 gap dài nhất
  (498 ms, 1739 ms) có Δph=0, Δe4skip=None (sentinel −1 ở đầu mút — rev3 loại đúng).
  Spread test trên mẫu CDP: 8/9 draws-gap có ph CDP trong gap nằm giữa hai đầu —
  CDP củng cố spread in-page.
- Worker cross-check: 5641 tick trong lúc phát; w-gap median 10 ms max 80 ms
  (worker không stall); r-gap >300 ms: 14, cả 14 có w-gap <100 ms (freeze thật).
  Freeze thật max trong lúc phát 513 ms. CDP top gaps [1739, 580, 513, 499, 498]
  vs worker top [513, 509, 469, 460, 429] — trừ outlier CDP 1739 ms (gap đầu lượt,
  pre-play/sentinel), các gap còn lại khớp nhau.
- Sampler: CDP recv-gap median 61 ms (dày nhất từ trước tới nay — J3 R1 là 394 ms;
  tải vừa nên CDP giữ được nhịp), rtt median 45 ms (J3 R1: 325 ms); ct distinct 719
  (rev2 chạy đúng, ct 0→3); state100 median 96 ms.
- Kết luận R1: **TRONG DẢI, dạng yếu quan sát được (3 gap in-page), dạng mạnh CHƯA
  quan sát được (0 gap distinct ≥ 2), CDP 0 gap.** Đếm lượt trong dải: 1/1.

### 2.3 R2 — freeze, holder N=3→6 — TRONG DẢI 100%, DẠNG MẠNH QUAN SÁT ĐƯỢC (LẦN ĐẦU)

- Thời gian: BAND-READY ngay 00:35:15Z (load5 5,13, chờ 0 s — không cần vite-wait
  vì không có vite sibling); holder bật N=3, tự tăng N 3→4→5→6 trong lúc chờ vì
  load1 đọc được < 4 (load5 lúc đó 4,45–5,43); band-wait trong probe 0 s
  (load5 5,47 đã trong dải); phát 00:35:51–00:37:14Z (~83 s wall); lấy kết quả tới
  00:38:00Z (nhanh hơn R1 vì đã giết holder tay ngay khi phát xong 00:37:47Z —
  bài học §1.2); phân tích xong 00:38:01Z. Exit=0. Boot #36 suốt lượt.
- Điều kiện: load lúc phát 5,51/5,47; load5 trong lúc phát 5,47 → 4,53 (16 snap,
  median 5,16; **16/16 = 100% trong [3, 8]** — tuân thủ dải tốt nhất từ trước tới
  nay); procs_running median 10 (5–17); draws/s median 10,8 (draws/5s 4 → 71 → 32,
  snap đầu 4 do trang chưa ấm — probe khởi động ngay sau vite, không có thời gian
  chờ dài như R1); RAM khả dụng lúc phát 2006 MB. preview.tsx md5 `ced42efd…`
  trước = sau, mtimeChanged=false.
- Dữ liệu: caps 338, drawsTotal 820 (drawsKept 820 — không tràn ring), mainDraws 352,
  state100 406 mẫu, CDP 405 mẫu (0 lỗi), workerTicks gộp 4290 (drained 4026 + tail
  264 — drain CHẠY ĐƯỢC), pumpN 145, driftConfirmSkips 26, seekSkipTicks 72,
  pageErrs 0. results.json 24.268.644 byte (nhỏ hơn R1 vì caps thưa hơn).
- Gate (b) in-page: **8/35** gap đạt bar (skips>0 + spread), trusted 6, **distinct_strict
  ≥ 2 = 1 — DẠNG MẠNH QUAN SÁT ĐƯỢC**. Gap dạng mạnh: 330 ms relPlay [79180, 79509]
  ph 69,17→70,00 skips=2 spread=True n_inside=2 distinct_strict=2 inside_ph=
  [69,433, 69,833] bracket=614 ms trusted=True. 7 gap còn lại đạt bar đều
  distinct=1 (dạng yếu, như J3/R1).
- **Giám định gap dạng mạnh bằng dữ liệu thô (làm thêm sau phân tích, không qua
  analyzer):** state100 thô quanh gap: relPlay 79101 ph 69,167; 79400 ph 69,433;
  79502 ph 69,833; 79715 ph 70; 79799 ph 70 (plateau). CDP thô trong cùng cửa sổ
  tường [1794616630657, 1794616630986]: tRecv 79393 ph 69,433 drawsTotal 804 e4skip 24;
  tRecv 79499 ph 69,833 drawsTotal 804 e4skip 25 — **CDP đọc đúng 2 giá trị trung
  gian, khớp chính xác state100 (69,433 và 69,833)**; drawsTotal đứng yên 804 suốt
  cửa sổ (draws đóng băng thật); e4skip 24→25 trong gap (drift-confirm bắn thêm 1
  lần — khớp skips=2 in-page). CDP ngay trước/sau: 79095 ph 69,167 drawsTotal 802;
  79690 ph 69,833 drawsTotal 806; 79782 ph 70 e4skip 26. Hai giá trị 69,433/69,833
  đều trong clip 23 (69–72 s), không qua biên clip, không seek (freeze-run,
  driverActions=0). **Kết luận giám định: dạng mạnh CÓ THẬT, 3 sampler đồng thuận
  (draws-gap + state100 + CDP), không phải artifact của state100.**
  Lưu ý: bracket 614 ms > 300 ms — theo định nghĩa bracket cũ của J3 thì gap này
  KHÔNG đạt (bracket ≤ 300 ms), nhưng theo bar prereg K3 §2 (skips>0 + spread,
  không yêu cầu bracket) thì ĐẠT. Ghi rõ cả hai để người đọc tự đánh giá.
- Gate (b) CDP: **0/60** recv-gap đạt bar (60 gap >300 ms — nhiều hơn R1 vì CDP
  thưa hơn: recv-gap median 193,5 ms, rtt median 167 ms). Ràng buộc chặn vẫn là
  Δdraws>0 (53/60 gap có Δdraws 2–7); 7 gap có e4skip=-1 ở đầu mút (sentinel, loại
  đúng theo rev3); chỉ 1 gap có Δdraws=0 (691 ms, Δph=0 — đóng băng toàn bộ, bị
  loại đúng). Spread test trên mẫu CDP: 32/35 draws-gap có ph CDP trong gap nằm
  giữa hai đầu.
- Worker cross-check: 4290 tick trong lúc phát; w-gap median 10 ms max 97 ms
  (worker không stall); r-gap >300 ms: 51, cả 51 có w-gap <100 ms (freeze thật);
  freeze thật max trong lúc phát 711 ms (tick #655 relPlay≈12108 ms). CDP top gaps
  [773, 691, 617, 615, 607] vs worker top [711, 604, 587, 583, 513] — cùng thang,
  không có outlier thổi phồng như R1 (1739 ms).
- Sampler: state100 median 196 ms (thưa hơn R1 96 ms — xem caveat §8.11); CDP
  recv-gap median 193,5 ms (thưa hơn R1 61 ms); ct distinct 309 (rev2 đúng).
  Lưu ý: state100 thưa hơn thì distinct_strict bị ĐẾM THIẾU (ít mẫu trong gap hơn)
  — dạng mạnh quan sát được dù sampler thưa là bằng chứng mạnh hơn, không yếu hơn.
- Kết luận R2: **TRONG DẢI 100%, dạng mạnh QUAN SÁT ĐƯỢC (1 gap, 3 sampler đồng
  thuận), CDP 0 gap.** Đếm lượt trong dải: 2/2; lượt có dạng mạnh: 1/2.

### 2.4 R3 — freeze, holder N=3→6→0→1 — TRONG DẢI 100%, GATE (b) 0 GAP (+ STALL CHUYỂN CLIP 5 s)

- Thời gian: WAIT-BAND 00:45:09–00:49:56Z (285 s, load5 2,13 → 1,08 — KHÔNG vào
  dải vì máy yên + hog không nâng được load5, xem §1.2); BAND-READY 00:49:56Z
  (load5 3,15, load1 nhảy 8,71 — sóng sibling vừa tới); vite attempt 1 chết ENOSPC
  (00:50:11Z, xem §1.2), attempt 2 lên 00:50:26Z; app boot + seed 24 clip xong
  00:50:55Z; band-wait trong probe 0 s (load5 4,74 đã trong dải); phát
  00:50:57–00:52:24Z (~87 s wall); lấy kết quả tới 00:53:53Z (đã giết holder tay
  00:53:36Z ngay khi phát xong — 1 hog còn lại); phân tích xong 00:53:55Z. Exit=0.
  Boot #36 suốt lượt (không reboot).
- Điều kiện: load lúc phát 10,42/4,74; load5 trong lúc phát 4,74 → 5,04 (18 snap,
  median 4,87; **18/18 = 100% trong [3, 8]**, dải ổn định nhất 3 lượt: 4,7–5,0);
  procs_running median 6 (1–14); draws/s median 48,2 (draws/5s 105–301 — trang chạy
  NHANH NHẤT 3 lượt); RAM khả dụng lúc phát 1182 MB (thấp nhất 3 lượt — vite +
  Chromium + sibling wave). preview.tsx md5 `ced42efd…` trước = sau,
  mtimeChanged=false. Holder N đi 3→6 (lúc chờ) → 0 (sóng sibling, load1 > 7) → 1
  (sau phát, load1 hạ 3,65) — dải được giữ bằng tải sibling + vite/Chromium, không
  phải hog (xem §1.2).
- Dữ liệu: caps 1440, drawsTotal 3685 (**drawsKept 2000 — ring TRÀN 1685 mẫu đầu**,
  xem caveat §8.13), mainDraws 1545, state100 2052 mẫu, CDP 2378 mẫu (0 lỗi),
  workerTicks gộp 8034 (drained 7906 + tail 128), pumpN 622, driftConfirmSkips 618
  (cao gấp ~25× R1/R2 — xem stall dưới), seekSkipTicks 681, pageErrs 0.
  results.json 104.875.294 byte (lớn nhất 3 lượt — caps dày).
- Gate (b) in-page: **0/1** gap đạt bar. Gap duy nhất: **4989 ms** relPlay
  [69535, 74524] ph 59,97→60,00 dph=0,03 skips=297 spread=False n_inside=490
  distinct_strict=0 inside toàn 60,00 (trừ mẫu đầu 59,967 < ph0) bracket=5080 ms.
  Đây KHÔNG phải gate (b): playhead không tiến qua giá trị trung gian nào — nó
  nhảy 0,03 s lên đúng 60,00 rồi ĐỖ 5 s. **Đây là stall chuyển clip c19→c20
  (biên 60 s):** pump chuyển clip, video element kẹt ~5 s, drift-confirm bắn 297
  lần trong gap (tổng cả lượt 618). Phát hiện phụ, ghi lại cho vòng sau — không
  thuộc phạm vi gate (b).
- Gate (b) CDP: **0/2** recv-gap đạt bar (416 ms Δdraws=0 nhưng Δph=0 và e4skip=None;
  530 ms Δdraws=3). Spread test CDP: 0/1 draws-gap có ph CDP trong gap nằm giữa
  hai đầu (đúng — gap này ph không tiến).
- Worker cross-check: 8034 tick trong lúc phát; w-gap median 10 ms max 68 ms
  (worker không stall); r-gap >300 ms: **chỉ 1** (498 ms, tick #553 relPlay≈8013 ms,
  w-gap 10 ms — freeze thật duy nhất); CDP top gaps [530, 416]; worker top [498].
  **Main thread SỐNG suốt stall 5 s** (worker r-gap max 498 ms, CDP recv-gap max
  530 ms, state100 max 502 ms — cả 3 sampler ngoài draws đều tiếp tục tick trong
  lúc draws đứng 5 s). Stall nằm ở draw-pipeline/video element, không phải
  main-thread freeze.
- Sampler: dày nhất 3 lượt — state100 median 12 ms (đúng nhịp 10 ms đặt), CDP
  recv-gap median 34 ms, rtt median 23 ms; ct distinct 1190 (rev2 đúng). Mật độ
  sampler cao làm draws-gap >300 ms hiếm đi về mặt cơ học (draws ~48/s → cần ~15
  draw liên tiếp bị miss mới thành gap 300 ms; R2 draws ~11/s → chỉ cần ~4 miss).
  So sánh số gap tuyệt đối giữa các lượt phải tính tới mật độ draws — xem §8.11.
- Kết luận R3: **TRONG DẢI 100%, gate (b) KHÔNG quan sát được (0 gap đạt bar,
  dạng mạnh 0), CDP 0 gap. Lượt chạy mượt nhất; 1 stall chuyển clip 5 s (phát
  hiện phụ).** Đếm lượt trong dải: 3/3; lượt có dạng mạnh: 1/3.

## 3. Gate (b) dạng mạnh — verdict (KẾT LUẬN ĐỢT K3)

- R1 (trong dải, load5 median 7,21): dạng yếu 3 gap in-page (trusted 2), CDP 0/23.
  **Dạng mạnh: 0 gap.**
- R2 (trong dải 100%, load5 median 5,16): dạng yếu 7 gap + **dạng mạnh 1 gap
  (330 ms, ph 69,17→70,00, inside [69,433, 69,833], skips=2, trusted)** — giám định
  bằng dữ liệu thô: CDP đọc đúng 2 giá trị trung gian, khớp chính xác state100;
  drawsTotal đứng yên 804; e4skip 24→25 trong gap. **Dạng mạnh ĐÃ quan sát được,
  3 sampler đồng thuận.** CDP 0/60 gap đạt bar (không corroborate dạng CDP).
  Bracket gap này 614 ms (>300 ms — theo định nghĩa bracket cũ của J3 thì không đạt;
  theo bar prereg K3 thì đạt — ghi rõ cả hai).
- R3 (trong dải 100%, load5 median 4,87): **0 gap đạt bar, dạng mạnh 0.** Lượt mượt
  nhất (draws 48/s, CDP median 34 ms); 1 stall chuyển clip 5 s (không phải gate (b)).
- **Kết luận đợt K3: DẠNG MẠNH ĐÃ QUAN SÁT ĐƯỢC — 1 gap (R2), 3 sampler đồng thuận,
  trong dải tải vừa [3, 8], freeze-run, không seek.** Tần suất thấp: 1/3 lượt K3,
  1/7 lượt toàn chuỗi J3 (0/4) + K3 (1/3). Dạng yếu: 3 + 8 + 0 = 11 gap in-page
  (trusted 2 + 6 + 0 = 8). CDP bar: 0 gap cả 3 lượt K3 (R1 0/23, R2 0/60, R3 0/2) —
  trái với J3 (12 gap CDP đạt bar ở R0/R1 dưới tải nặng load5 ~10).
- **Diễn giải (ghi rõ là diễn giải, không phải số đo):** bar CDP đòi Δdraws==0
  (draws đóng băng hoàn toàn). Trong dải tải vừa, các freeze chỉ làm draws CHẬM LẠI
  (Δdraws 2–7) chứ không dừng hẳn, nên bar CDP không bao giờ bắn — dù in-page vẫn
  thấy gate (b) (yếu và mạnh). Dưới tải nặng (J3 R0/R1), draws dừng hẳn trong freeze
  nên bar CDP bắn 12 lần. Nghĩa là **bar CDP và bar in-page đo hai mặt khác nhau
  của cùng hiện tượng, và bar CDP kém nhạy hơn ở tải vừa** — không phải gate (b)
  vắng mặt ở tải vừa. Dạng mạnh R2 (CDP corroborate từng giá trị ph, drawsTotal
  đứng yên 804) cho thấy khi freeze đủ sâu thì cả hai bar cùng thấy — chỉ là hiếm
  (1 gap / 3 lượt).

## 4. Sampler — CDP + worker (KẾT LUẬN ĐỢT K3)

- R1: CDP dày nhất từ trước (recv-gap median 61 ms, rtt median 45 ms) nhờ tải vừa;
  ct rev2 đúng (distinct 719); worker drain CHẠY ĐƯỢC (20606 mẫu drained + 141 tail
  = 20747, không mất đầu lượt); worker không stall (w-gap max 80 ms); freeze thật
  max trong lúc phát 513 ms; CDP max 1739 ms là outlier đầu lượt (pre-play/sentinel),
  không dùng làm độ dài freeze (đúng bài học J3 §4).
- R2: CDP thưa hơn (recv-gap median 193,5 ms, rtt median 167 ms) dù tải thấp hơn
  R1 (median 5,16 vs 7,21) — mật độ CDP không đơn điệu theo load5; state100 cũng
  thưa hơn (median 196 ms vs 96 ms). Worker drain vẫn chạy (4026 + 264 = 4290);
  worker không stall (w-gap max 97 ms); freeze thật max 711 ms; CDP top [773, 691,
  617, 615, 607] vs worker top [711, 604, 587, 583, 513] — cùng thang, không outlier.
  **Giám định dạng mạnh R2 (§2.3): CDP + state100 khớp chính xác 2 giá trị trung
  gian — sampler chéo CHẠY ĐƯỢC ở mức từng gap, không chỉ mức tổng.**
- R3: sampler DÀY NHẤT 3 lượt (state100 median 12 ms, CDP recv-gap median 34 ms,
  rtt median 23 ms; ct distinct 1190); worker drain 7906 + 128 = 8034; worker không
  stall (w-gap max 68 ms); freeze thật max 498 ms (chỉ 1 r-gap >300 ms); CDP top
  [530, 416] vs worker top [498] — cùng thang. **Cả 3 sampler ngoài draws đều
  sống suốt stall 5 s tại biên clip (max gap ~500 ms) — stall nằm ở draw-pipeline,
  không phải main thread.**
- Quirk analyzer rev3 (không ảnh hưởng verdict): khi CDP đạt bar = 0 thì khối đối
  chiếu nearest-duration không in gì (cả hai nhánh `if/elif cdp_observed` đều bỏ qua)
  — chỉ còn bảng top-5 gap để so tay. Sẽ bổ sung dòng "không có gap CDP đạt bar để
  đối chiếu" nếu sửa analyzer sau (không sửa giữa chừng trong đợt).
- **Tổng kết sampler:** worker drain hoạt động cả 3 lượt (20747 / 4290 / 8034 mẫu
  gộp — không mất đầu lượt như J3 R0); worker không stall lượt nào (w-gap max
  80/97/68 ms); CDP-vs-worker nearest-duration trên dữ liệu J3 cho 7/7 và 5/5 cặp
  khớp ±50 ms (unit-test), nhưng trong 3 lượt K3 không có gap CDP đạt bar nào để
  đối chiếu — bar ±50 ms KHÔNG kiểm chứng được thêm trong đợt này (giữ nguyên kết
  quả unit-test J3).

## 5. Zombie Δ trên dữ liệu pause-burst R0 của J3 — ĐÃ PHÂN TÍCH XONG

- Nguồn: `hidden_files/round108-j3/chr-mixedalt-j3y0-pb/frame-parity-results.json`
  (J3 R0, rerun f4y3: 21/23 pause-burst + 2 missed-window, sysload 0 nhưng nhiễm tải
  nặng load1 lúc phát 23,28; caps 217, pumpN 92, state100 970 mẫu). Analyzer:
  `hidden_files/round109-k3/round109-k3-zombie-r0.py` (kế thừa phương pháp C5
  §2/§3/§4/§5, stdlib-only; không làm §6 pixel-parity vì cần baseline noblur).
  Kết quả đầy đủ: `hidden_files/round109-k3/j3r0-zombie-analysis.txt`.
- **Zombie Δ = 0 ở cả 12 biên blur→noblur** (caps clip chẵn không tăng trong cửa sổ
  clip lẻ sau biên — vd c0: 1→1, c4: 6→6, c20: 8→8). Tổng zombie Δ = 0.
- **0 capture trong mọi cửa sổ clip lẻ** (post-seek frameIdx<45 = 0, pre-seek
  straggler frameIdx≥85 = 0, giữa 45–84 = 0; tổng 12 cửa sổ).
- **skip-clip-inactive = 0** — nhất quán với C5 R4 (pause-burst, phát tick-by-tick):
  check A6 không bắn khi phát thường; pump cũ chết qua owner-kill/seek-inactive
  (fb: 'seek-inactive' 10/12 clip, 'no-callback' 3/12: c0, c2, c8 — tổng 13 do c2
  vừa 'no-callback' vừa được đếm ở dbgFinal; xem file phân tích).
- Pump decisions (n=92): skip-stale-frame 29, capture 38, skip-seeking 5,
  reset-capture 11, skip-stale 9; không có skip-inactive/skip-clip-inactive nào —
  nên §5b (kill latency trực tiếp từ pump event) không có event để đo, nhất quán
  với việc pump chết không qua callback check.
- fbAt − b_k: phần lớn 0 ms (fb ghi đúng mẫu biên), 2 ca âm lớn (c0 −2924 ms,
  c8 −4770 ms) và 2 ca âm nhỏ (c2 −114 ms, c6 −279 ms) — là lượng tử sampler
  (state100 thưa dưới tải nặng; fb ghi ở mẫu trước mốc biên nội suy), KHÔNG phải
  kill sớm; không dùng làm số đo độ trễ kill. Độ trễ kill trực tiếp trên R0 không
  đo được (không có skip event) — ghi nhận, không suy diễn.
- 2 missed-window (k=4 ph 12,467 jumpPast 0,467; k=8 ph 24,1 jumpPast 0,1):
  playhead nhảy burst qua cửa sổ bắn [b−0,8, b) — chữ ký freeze nhảy, nhất quán
  với gate (b) quan sát ở J3 R0 (13 gap in-page đạt bar).
- Caveat (không giấu):
  1. R0 nhiễm tải nặng (load1 23,28) nên caps thưa: chỉ 217 caps (so với C5 R1
     1192 caps lúc yên) và 92 pump events — zombie Δ = 0 trên mẫu thưa có sức
     mạnh thấp hơn C5; không dùng R0 để khẳng định "không bao giờ có zombie dưới
     pause-burst", chỉ ghi "0/12 biên trong lượt này".
  2. lastFrame vượt 89 ở nhiều clip (c4 103, c6 110, c16 100, c18 94, c22 95):
     element chạy quá 3 s/clip (ct > 2,97 s) — cùng file stripes cho mọi clip nên
     pixel parity không phân biệt được frame cũ/mới; không kết luận đây có phải
     zombie capture không (0 capture trong cửa sổ lẻ đã loại trừ capture sau biên).
  3. Chỉ phân tích pause-burst (không seek-across): đường seek vẫn là đường duy
     nhất từng cho check bắn (C5 24/24) — R0 không bổ sung gì cho đường đó.
- Nợ "zombie Δ/capture trên dữ liệu pause-burst R0 chưa phân tích" (J3 §5, LIMITS
  gộp đợt 108 §4) nay **ĐÓNG về mặt phân tích** (kết quả trên; file phân tích đã lưu).

## 6. Unit-test analyzer rev3 trên dữ liệu J3 (trước khi đo — PASS)

- Chạy `round109-k3-analyze.py` trên cả 4 lượt J3 (`../round108-j3/chr-mixedalt-j3y*`):
  R0 in-page 13 / trusted 9 / CDP **7** / distinct≥2 = 0; R1 19 / 12 / **5** / 0;
  R2 1 / 1 / 0 / 0; R3 0 / 0 / 0 / 0. Trusted gộp **22/33** — khớp đúng J9 đính
  chính 1 (CDP 12, không phải 14) và đính chính 2 (trusted 22/33, không phải 0).
- CDP-vs-worker nearest-duration trên dữ liệu J3: R0 7/7 cặp khớp trong ±50 ms
  (median |Δ| = 1 ms), R1 5/5 (median 0 ms) — đối chiếu từng gap khớp tốt, khác hẳn
  so max-vs-max (J3: chênh 2408/3304 ms). Metric mới dùng được.
- Tuân thủ dải trên dữ liệu J3 (kiểm lại): cả 4 lượt đều ngoài dải (R0 load5 median
  10,42, 3/37 snap trong dải; R1 10,08, 0/21; R2 1,83, 0/16; R3 1,31, 0/16) — đúng
  như J3 báo ("không lượt nào chạm [3,8]").

## 7. Reboot / điều kiện tải

- Boot #36 = 2026-11-13 22:53:56Z suốt toàn bộ phần đo của K3 (prereg → R1 → R2 →
  R3, tới 00:53:55Z). **Reboot #37 = 2026-11-14 00:55:42Z** (boot_id mới
  a7bdedd2-1f2f-4eb0-8dc5-3898c2719b99; `uptime` "up 3 min" lúc 00:59:36Z; K9 poller
  restart ghi rõ "POLLER-RESTART after reboot #37" lúc 00:57:13Z) — xảy ra SAU khi
  R3 phân tích xong, TRONG lúc viết LIMITS/batch. Gap #36→#37 = 2h01'46" (dài nhất
  kể từ khi theo dõi; sàn cũ 31'47" đã bị phá ở #33 với 19'07" — nay gap dài trở
  lại). **Không mất dữ liệu K3:** LIMITS (00:58:34Z), batch (00:59:14Z) và cờ done
  (00:59:23Z) đều ghi sau reboot và đã verify lại đầy đủ (LIMITS 543 dòng /
  44.570 byte, batch 2 entry, preview.tsx vẫn ced42efd…).
- Điều kiện tải tóm tắt: R1 load5 median 7,21 (15/16 snap trong dải); R2 5,16
  (16/16); R3 4,87 (18/18) — **49/50 snap trong dải, 3/3 lượt trong dải**.
  Sóng sibling chi phối: K5 run24 (load1 tới 39,57, 00:07–00:13Z, làm R1 lần 1
  abort); sóng sibling không rõ nguồn lúc 00:49:56Z (load1 8,71) đưa R3 vào dải.

## 8. Giới hạn và caveat (trung thực, gộp — KẾT LUẬN ĐỢT K3)

1. Dạng mạnh chỉ 1 gap trong 3 lượt trong dải (1/3 lượt; 1/7 lượt toàn chuỗi J3+K3)
   — tần suất thấp, chưa đủ để ước lượng tỷ lệ xuất hiện; chỉ khẳng định "đã quan
   sát được", không khẳng định "thường xuyên".
2. Zombie Δ R0 = 0 trên mẫu thưa dưới tải nặng (§5 caveat 1) — sức mạnh thấp hơn C5.
3. Holder node spin-loop không tạo được áp lực CPU thật khi máy đã đông (§1.2) —
   dải tải được giữ bằng tổng tải (holder + sibling + vite/Chromium), không phải
   dial độc lập hoàn toàn. R3 chứng minh hog không nâng được load5 khi máy yên —
   **không được nói "holder giữ được dải"**; dải được giữ bằng tải ambient.
   load1 đọc được dao động mạnh (0,28–11,04 cùng điều kiện) — chỉ dùng load5 làm dial.
4. `preview.tsx` không đổi suốt đợt K3 (md5 `ced42efd…` trước = sau cả 3 lượt,
   mtimeChanged=false).
5. drawsTotal R1 = 2007 vượt ring 2000 của probe (drawsKept=2000) — 7 draw đầu lượt bị
   cắt khỏi mảng draws; gap đầu lượt có thể thiếu (analyzer đã cảnh báo trong §3).
   Không ảnh hưởng 9 gap đã phân tích (đều ở giữa/cuối lượt).
6. draws/5s R1 giảm dần suốt lượt (287 → 41, tức ~57/s → ~8/s) — nguyên nhân chưa
   điều tra (có thể rAF/pump chậm dần khi clip tiến xa, hoặc sampler thưa dần);
   không dùng draws/s tuyệt đối để suy diễn thêm ngoài dial tải.
7. In-page spread test: hiển thị ph 2 chữ số thập phân làm tròn — gap 374 ms
   (inside toàn 48,067, ph1 hiển thị 48,07) bị tính spread=False vì ph1 thật cũng
   ≈48,067 (không nằm nghiêm ngặt giữa) — hành vi analyzer đúng, chỉ là hiển thị
   làm tròn gây khó đọc. Không đổi verdict.
8. Analyzer rev3 không in khối đối chiếu CDP-vs-worker khi CDP đạt bar = 0 (§4) —
   quirk hiển thị, không ảnh hưởng verdict.
9. R1 lần 2: holder chạy suốt cả pha lấy kết quả (thiết kế run-k3.sh chỉ giết holder
   sau probe exit) làm chậm serialize results.json 57 MB ~3,5 phút — đã giết tay;
   dữ liệu không ảnh hưởng (kết quả đã đủ trước khi giết). Đã áp dụng giết tay ở
   R2/R3 — vòng sau nên sửa run-k3.sh giết holder ngay khi phát xong.
10. R1-abort lần 1: không tính là lượt chạy (0 dữ liệu probe).
11. R2: sampler thưa hơn R1 dù tải thấp hơn (state100 median 196 ms vs 96 ms; CDP
    recv-gap median 193,5 ms vs 61 ms; caps 338 vs 813; drawsTotal 820 vs 2007) —
    mật độ sampler không đơn điệu theo load5; nguyên nhân chưa điều tra (có thể do
    probe R2 khởi động ngay sau vite — trang chưa ấm, snap đầu draws/5s chỉ 4 —
    hoặc sibling K1/K2/K7 tranh CPU trong lúc R2 phát). Hệ quả: distinct_strict bị
    đếm thiếu (ít mẫu trong gap) — dạng mạnh R2 quan sát được DÙ sampler thưa nên
    bằng chứng mạnh hơn, không yếu hơn. Nhưng so sánh số gap tuyệt đối giữa R1 (9)
    và R2 (35) không có ý nghĩa trực tiếp vì mật độ sampler khác nhau.
12. R2: holder tự tăng N 3→6 trong lúc chờ vì load1 đọc được < 4 liên tục — luật
    holder theo load1 (prereg) hoạt động đúng, nhưng load1 nhiễu (§1.2) nên N tăng
    lên max dù load5 đã trong dải từ đầu (5,13). Không ảnh hưởng tuân thủ dải
    (load5 vẫn 4,45–5,52).
13. R3: drawsTotal 3685 vượt ring 2000 — **1685 draw đầu lượt bị cắt** khỏi mảng
    draws; số gap in-page (1) là cận dưới cho nửa đầu lượt. Nhưng state100 (2052
    mẫu, median 12 ms), CDP (2378 mẫu) và worker (8034 tick) phủ toàn lượt và chỉ
    thấy 1 freeze thật >300 ms (498 ms) + 2 CDP gap >300 ms — nên kết luận "lượt
    mượt, gate (b) 0 gap" vẫn đứng dù draws bị cắt. Vòng sau nên tăng ring draws
    (vd 5000) hoặc ghi draws ra file trực tiếp để khỏi mất đầu lượt khi draws dày.
14. R3: stall chuyển clip 5 s tại biên 60 s (c19→c20) là phát hiện phụ — ph đỗ 60,00,
    drift-confirm 297 lần, main thread sống. Chưa điều tra nguyên nhân (có thể seek/
    buffer ở clip switch); ghi lại cho vòng sau, không suy diễn thêm.
15. R3: vite attempt 1 chết ENOSPC thoáng qua (xem §1.2); attempt 2 lên ngay.
    Không ảnh hưởng dữ liệu.
16. Gap dạng mạnh R2 có bracket 614 ms (>300 ms): theo định nghĩa bracket cũ của J3
    thì KHÔNG đạt; theo bar prereg K3 (§2, không yêu cầu bracket) thì ĐẠT. Ghi rõ
    cả hai — người đọc dùng định nghĩa nào cũng tự đánh giá được. Nếu vòng sau
    muốn bar chặt hơn, đăng ký trước bracket ≤ 300 ms vào bar dạng mạnh.
17. Số gap tuyệt đối không so được trực tiếp giữa các lượt vì mật độ draws khác nhau
    (R1 19,2/s, R2 10,8/s, R3 48,2/s): draws càng dày thì gap >300 ms càng hiếm về
    mặt cơ học. So sánh đúng là: số gap đạt bar / số gap >300 ms, và worker r-gap
    (độc lập với draws): R1 14, R2 51, R3 1 freeze thật >300 ms.

## 9. Nợ mở (cho đợt sau)

1. Gate (b) dạng mạnh — **K3 ĐÓNG phần chính: đã quan sát được 1 gap (R2), 3 sampler
   đồng thuận, trong dải [3, 8].** Còn mở: (a) tần suất thấp (1/7 lượt J3+K3) —
   muốn ước lượng tỷ lệ cần nhiều lượt hơn; (b) bar CDP chưa bao giờ bắn trong dải
   (0/3 lượt K3) — cần quyết xem bar CDP có giữ làm bar song song hay chỉ dùng
   in-page + giám định CDP từng gap như R2; (c) gap dạng mạnh R2 có bracket 614 ms —
   nếu muốn bar chặt hơn thì đăng ký trước bracket ≤ 300 ms (xem §8.16).
2. Stall chuyển clip 5 s tại biên 60 s (R3, §2.4) — phát hiện phụ, chưa điều tra:
   nguyên nhân seek/buffer ở clip switch? Có lặp lại ở biên clip khác không?
   (driftConfirmSkips 618 cả lượt, 297 trong stall — cao bất thường so với R1/R2.)
3. Bộ tạo tải: hog node spin không nâng được load5 khi máy yên (§1.2) — vòng sau
   cần dial độc lập với sibling (tải I/O, hoặc vite/Chromium nền) nếu muốn giữ dải
   [3, 8] mà không phụ thuộc sóng sibling; sửa run-k3.sh giết holder ngay khi phát
   xong; tăng ring draws (5000) hoặc ghi draws ra file.
4. Analyzer rev3: bổ sung dòng "không có gap CDP đạt bar để đối chiếu" khi CDP = 0
   (quirk §4); hiển thị ph đủ 3 chữ số thập phân (quirk §8.7).
5. Nợ đứng yên đợt 108 (xem LIMITS gộp đợt 108 §4): G1 + mù #22 chờ user quyết,
   re-arm A/B tắt E4 (K1), điều kiện cần của bogus (K2), cụm A sysload nhẹ (K4),
   E1 tải nặng đủ ≥7 lần (K5), EPERM probe #28 + mù #27 (K6), birefnet 0 lần,
   TTS 39 CẤM kiểm lại, ci-security.yml 403, release gate — không thuộc K3.

## 10. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Analyzer rev3 unit-test trên dữ liệu J3 | CDP R0 7 / R1 5; trusted 22/33; distinct≥2 = 0 (khớp J9) | §6; chạy lại được bằng round109-k3-analyze.py |
| Zombie Δ J3 R0 | 0/12 biên; 0 capture cửa sổ lẻ; skip-clip-inactive 0 | §5; hidden_files/round109-k3/j3r0-zombie-analysis.txt |
| Probe rev3 | node --check PASS; band-wait + worker drain + sentinel fix | apps/web/scripts/probe109k3-frame-parity.mjs |
| Build identity (suốt đợt K3) | preview.tsx md5 `ced42efd785724c8c0d1b16fc32c7341` trước = sau cả 3 lượt | §2.2–2.4; prereg-k3.md |
| R1 | Trong dải (7,21; 15/16); dạng yếu 3, dạng mạnh 0; CDP 0/23 | §2.2; chr-mixedalt-k3y1-fr4-analysis.txt |
| R2 | Trong dải 100% (5,16; 16/16); dạng yếu 7, **dạng mạnh 1** (giám định CDP khớp state100); CDP 0/60 | §2.3; chr-mixedalt-k3y2-fr4-analysis.txt |
| R3 | Trong dải 100% (4,87; 18/18); gate (b) 0 gap; stall chuyển clip 5 s tại biên 60 s | §2.4; chr-mixedalt-k3y3-fr4-analysis.txt |
| Reboot #37 | 2026-11-14 00:55:42Z, boot_id a7bdedd2…; sau R3, trong lúc viết LIMITS; không mất dữ liệu (LIMITS/batch/done ghi sau reboot, đã verify) | `uptime -s` trực tiếp; K9 poll.log 00:57:13Z |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round109-k3-zombie.txt`
— chứa LIMITS này + `apps/web/scripts/probe109k3-frame-parity.mjs` (2 file text).

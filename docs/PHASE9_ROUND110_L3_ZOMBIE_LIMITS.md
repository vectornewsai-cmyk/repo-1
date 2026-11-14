# PHASE9_ROUND110_L3_ZOMBIE_LIMITS — Zombie gate (b) dạng mạnh lặp lại + stall chuyển clip 5 s + dial tải độc lập

> Luồng L3, đợt 110. Lượt cron 09:35 +07 14/11/2026 (giao lại sau reboot #39).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.
> Không sửa production** — chỉ probe mới (`probe110l3-frame-parity.mjs`, kế thừa
> probe109k3 + ring 8000 + chẩn đoán video element qua CDP + vite watch.ignored)
> + analyzer rev3.1 + holder tải.
> Prereg (viết TRƯỚC khi đo, luồng L3 đầu): `hidden_files/round110-l3/prereg-l3.md`.
> Dữ liệu thô: `hidden_files/round110-l3/` (driver-l3.log, 2 lượt probe + analysis,
> round110-l3-analyze.py, run-l3.sh, load-holder-l3.sh, load-test-l3.sh,
> load-test-l3.txt, prereg-l3.md).
>
> **MỘT PHẦN — đọc trước:** prereg đăng ký 3 lượt probe trong dải + thử nghiệm tải
> đầy đủ (A/B/C 90 s + liều N=3/N=10) + điều tra stall trong 3 lượt. Luồng này chỉ
> làm được **2 lượt probe (R1, R2)** và thử nghiệm tải rút gọn (xem §1.2, §8).
> Lý do: luồng L3 đầu bị reboot #39 (02:50:48Z) giết lúc 02:51:23Z khi chưa chạy
> được lượt probe nào; luồng giao lại bắt đầu 04:29Z, hạn cứng 05:15Z, probe phải
> dừng 05:00Z. Không bịa thêm lượt, không chạy bù ngoài hạn.

## 0. Tóm tắt

- **DẠNG MẠNH LẶP LẠI ĐƯỢC — cả 2 lượt (2/2):** R1: 3 gap distinct_strict ≥ 2
  (trong đó 2 gap freeze sạch + 1 gap stall 2669 ms cũng qua bar theo đúng chữ);
  R2: 1 gap distinct_strict ≥ 2 (freeze sạch). Theo bar prereg K3 (không yêu cầu
  bracket): dạng mạnh 2/2 lượt L3. Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms):
  **0 gap** cả 2 lượt — mọi bracket đều 402–2987 ms (xem §3, §8.9).
- **Tần suất gộp toàn chuỗi (bar prereg K3): J3 0/4 + K3 1/3 + L3 2/2 = 3/9 lượt**
  có dạng mạnh. Đây là lần đầu dạng mạnh xuất hiện 2 lượt liên tiếp.
- **Stall chuyển clip 5 s (K3 R3, biên 60 s) KHÔNG tái hiện (0/2 lượt):** R1 qua
  biên 60 s chỉ với gap 528 ms (ph gần như đỗ tại 60,067, distinct=1); R2 qua biên
  60 s sạch (không có gap >300 ms nào quanh 60 s). Thay vào đó R1 có **stall khác:
  2669 ms giữa clip c15 (ph 45,10→47,70, không ở biên clip)**, phân tầng
  seek/decode theo quy tắc đăng ký trước (seeking=true, readyState=1 trước gap;
  decodedFrameCount vẫn tăng +72 trong lúc draws đứng — xem §2.4, không phải
  decode đói frame).
- **CDP bar: 0/2 lượt L3 (R1 0/28, R2 0/37 recv-gap)** — gộp với K3 thành 0/5 lượt
  (K3 0/3 + L3 0/2; trong đó 4 lượt trong dải chặt + R2 ngoài dải nhưng không loại).
  Ràng buộc chặn vẫn là Δdraws 2–5 ở tải vừa. **ĐỀ XUẤT BỎ bar CDP làm bar song
  song** (giữ in-page làm bar chính + CDP giám định từng gap) — xem §6. Đây là
  đề xuất có lý do, không phải kết luận đóng hẳn (verify/parent quyết cuối);
  lưu ý điều kiện chữ trong prereg §6 (0/3 lượt trong dải đợt này) không thỏa mãn
  theo đúng chữ vì L3 chỉ có 2 lượt (xem §6).
- **Dial tải độc lập: THẤT BẠI có bằng chứng.** Python spin ×6 chạy 60 s trên máy
  yên: load1 0,13 → 0,08 (không nhúc nhích) dù hog quay thật (1 hog đơn: state R,
  99,5% CPU, utime tăng đúng tốc độ). Node spin ×6 (biến thể A) bị nhiễm sóng
  sibling (load1 43–49) nên không kết luận được; `yes` chưa thử; liều N=3/N=10
  chưa thử; biến thể D (tải I/O D-state) chưa thử. Dải [3,8] ở R1/R2 được giữ bằng
  **sóng tải host/sibling** (load1 nhảy lên 8,30 lúc phát R1; load5 0,89 → 3,04
  trong 65 s — quá nhanh so với hog local), không phải holder. **Không được nói
  "holder giữ được dải"** — kết luận này nay có 2 đợt độc lập ủng hộ (K3 R3 + L3).
  Xem §1.2.
- **Ring draws 2000→8000 (nợ K3): ĐÓNG.** drawsTotal R1 1244, R2 919 — đều < 8000,
  không tràn, không mất mẫu đầu (K3 R3 đã tràn 1685 mẫu).
- `preview.tsx` md5 `9b27abe57975ec5b69ec2e21c3fa281c` (bản L1-fix) trước = sau cả
  2 lượt (mtimeChanged=false). Boot #39 (02:50:48Z) suốt cả 2 lượt, không reboot
  trong lúc đo.

## 1. Phương pháp và điều kiện chạy

### 1.1 Bar dạng mạnh + dial tải (giữ nguyên prereg K3 + prereg-l3 §2)

- Dạng mạnh = ≥1 gap đạt bar J3 (skips>0 + spread G2 in-page, hoặc bản CDP:
  recv-gap >300 ms + Δe4skip>0 + Δph ≥ 0,7×gap + drawsTotal không đổi) VÀ
  distinct_strict ≥ 2. Trusted (rev3): n_inside ≥ 2. Với MỖI gap đạt bar, báo cáo
  CẢ HAI: (a) bar prereg K3 (không yêu cầu bracket), (b) định nghĩa bracket cũ J3
  (bracket ≤ 300 ms).
- Luật loại lượt: lượt bị LOẠI khỏi bar dạng mạnh nếu <50% snapshot trong cửa sổ đo
  có load5 ∈ [3, 8]; "trong dải" nếu load5 median ∈ [3, 8] VÀ ≥80% snapshot trong
  dải; 50–80% là "ngoài dải nhưng không loại" (dữ liệu giữ kèm bối cảnh).
- Probe probe110l3-frame-parity.mjs (kế thừa probe109k3): CDP_EXPR thêm chẩn đoán
  video element (readyState, seeking, paused, decodedFrameCount,
  droppedFrameCount, bufferedEnd, videoWidth/Height); ring draws + mainDraws
  2000→8000; vite config server.watch.ignored ["**/**"] (vite 0 inotify FD);
  marker play-done.marker ngay sau khi phát xong (driver giết holder ngay — bài học
  K3 §1.2); CFG_DIR riêng /tmp/round110-l3. Còn lại giữ nguyên probe109k3 (sampler,
  state100 10 ms, spec 24 clip scroll-mixed-alt, freeze-run, band-wait 300 s).
- Phân tầng stall (quy tắc đọc, đăng ký trước — áp dụng cho mọi draws-gap >1000 ms):
  seeking=true và/hoặc readyState < 3 trong lúc ph đỗ → stall ở seek/decode;
  seeking=false, readyState=4, decodedFrameCount đứng yên, drawsTotal đứng yên →
  stall ở draw-pipeline; decodedFrameCount vẫn tăng trong lúc ph đỗ → stall ở lớp
  playhead/tick. Stall được tính là "tái hiện" nếu có ≥1 draws-gap >1000 ms với ph
  đỗ tại biên clip (ph1 − ph0 < 0,1 s và ph1 gần bội số 3 s) trong các lượt.
- Phối hợp vite: lock thư mục mkdir nguyên tử + pgrep `\.bin/vite`; không có vite
  sibling lúc chạy (các luồng L khác đã xong); lock lấy ngay 0 s chờ cả 2 lượt,
  thả ngay sau mỗi lượt. Vite log append theo lượt (không ghi đè).
- KHÔNG đo thêm kill. KHÔNG sửa production. KHÔNG push / release / tag.

### 1.2 Bộ tạo tải — thử nghiệm có kiểm soát (prereg-l3 §3; CHỈ LÀM ĐƯỢC MỘT PHẦN)

- **Biến thể A (node spin ×6, 90 s): KHÔNG KẾT LUẬN ĐƯỢC — nhiễm sóng sibling.**
  Luồng L3 đầu chạy 02:50:26–02:51:27Z, chỉ được 8 mẫu rồi bị reboot #39 giết.
  Trong 8 mẫu: load 43,49–49,40 / 19,01–23,76 / 7,88–10,17; procs_running 18–68;
  hogCPU% tổng chỉ ~17–31% (mỗi hog ~3–5% — bị đói CPU vì ~40–60 tiến trình
  runnable tranh 1,5 CPU cell). Không tách được đóng góp của hog khỏi sóng sibling.
  File: `hidden_files/round110-l3/load-test-l3.txt` (8 mẫu, dừng giữa chừng).
- **Biến thể B (python spin ×6, 60 s, máy yên sau reboot): THẤT BẠI — đo trực tiếp.**
  Luồng giao lại chạy 04:31–04:32Z (rút gọn 60 s thay vì 90 s vì hạn giờ):
  load1 0,13 → 0,17 → 0,13 → 0,10 → 0,08 (load5 0,83 → 0,78); procs_running 7–9.
  **6 spinner không nhúc nhích loadavg.** Kiểm chứng hog quay thật: 1 spinner đơn
  chạy 12 s: state R, %CPU 99,5%, utime 196 → 1196 tick/10 s (đúng 1 core đầy).
  Giải thích phù hợp nhất (giống K3 §1.2): task bị throttle bởi CPU quota cell
  (1,5 CPU) thì rời runqueue trong lúc bị throttle nên không còn được tính là
  runnable cho loadavg; 6 spinner tranh 1,5 CPU nên phần lớn thời gian ở trạng
  thái bị throttle. Bằng chứng phụ: load1 đơn spinner 12 s lên 0,94 (hog đơn
  không bị throttle, vẫn được tính) — nhưng con số này cũng lẫn nhiễu host nên
  không dùng làm định lượng.
- **Biến thể C (`yes` ×6): CHƯA THỬ** (cùng cơ chế busy-loop như A/B, kỳ vọng hành
  vi giống — ghi rõ là chưa thử, không suy diễn thành "đã thất bại").
- **Liều thắng N=3 / N=10: CHƯA THỬ** (không có biến thể nào thắng để thử liều).
- **Biến thể D (tải I/O D-state, dd + fdatasync): CHƯA THỬ.** Ghi rõ quan điểm:
  D-state nâng loadavg mà không tạo tranh CPU thật — nếu dùng thì chỉ là tải "số",
  sẽ làm giả dải [3,8] mà không tạo điều kiện freeze cần cho gate (b). Không dùng
  cho probe nếu không có quyết định phương pháp riêng.
- **Holder đợt này (load-holder-l3.sh, GEN=python, N khởi điểm 4, max 8):** điều
  chỉnh theo load1 (load1 < 4 → +1; load1 > 7 → −1; load5 > 8 → −1 ngay). Hành vi
  thật ở R1: N 4→8 trong lúc chờ band (load1 đọc được < 4 liên tục) rồi bị giết
  ngay khi marker play-done xuất hiện (04:44:22Z — đúng thiết kế mới, không kẹt
  serialize như K3 R1). **Holder không đưa load5 vào dải:** driver WAIT-BAND R1
  hết 300 s với load5 chỉ 0,59; R1 chỉ vào dải nhờ sóng host ập tới lúc probe
  band-wait (load5 0,89 → 3,04 trong 65 s, load1 8,24–8,30 — xem §2.1). R2 vào
  dải ngay 0 s vì sóng vẫn còn (load5 3,97 lúc bật driver) rồi sóng tan dần trong
  lúc phát (load5 3,53 → 2,74).
- **Kết luận §1.2: không có bộ tạo tải CPU local nào dial được load5 vào [3,8]
  trên cell này khi máy yên.** Dải tải trong đợt này (và K3) được giữ bằng tải
  ambient host/sibling + vite/Chromium, không phải dial độc lập. Nợ "dial độc lập"
  vẫn mở — hướng thử tiếp theo (cho vòng sau, không phải kết luận): tải I/O
  D-state (chỉ nâng số loadavg, xem caveat trên), hoặc chạy thêm vite/Chromium
  nền làm tải thật (tốn RAM), hoặc chấp nhận dải ambient và ghi rõ nguồn tải
  từng lượt như đợt này.

## 2. Kết quả từng lượt

### 2.1 R1 — freeze, holder python N=4→8 — TRONG DẢI 100%, DẠNG MẠNH 3 GAP (2 freeze sạch + 1 stall)

- Thời gian: driver lấy vite-lock 04:35:55Z (0 s chờ); WAIT-BAND 04:35:55–04:40:57Z
  (300 s, load5 0,42 → 0,59 — KHÔNG vào dải bằng holder); probe band-wait
  04:41:49–04:42:54Z (65 s, load5 0,89 → 3,04 — VÀO DẢI nhờ sóng host, xem §1.2);
  phát 04:42:55–04:44:22Z (~87 s wall cho 72 s timeline); lấy kết quả tới 04:44:41Z
  (nhanh vì holder đã giết ngay khi marker play-done 04:44:22Z); phân tích xong
  04:44:41Z. Exit=0. Boot #39 suốt lượt (không reboot).
- Điều kiện: load lúc phát 8,30/3,04; load5 trong lúc phát 3,34 → 4,90 (16 snap,
  median 4,36; **16/16 = 100% trong [3, 8]**); procs_running median 8 (5–14);
  draws/s median 11,8 (draws/5s 0 → 160, tăng dần suốt lượt — snap đầu 0 do trang
  chưa ấm); RAM khả dụng lúc phát 712 MB (thấp — vite + Chromium + sóng host;
  free 2162 MB sau khi probe exit). preview.tsx md5 `9b27abe5…` trước = sau,
  mtimeChanged=false.
- Dữ liệu: caps 500, drawsTotal 1244 (drawsKept 1244 — ring 8000 KHÔNG tràn),
  mainDraws 542, state100 647 mẫu, CDP 617 mẫu (0 lỗi), workerTicks gộp 7320
  (drained 7061 + tail 259 — flush ring CHẠY ĐƯỢC), pumpN 216,
  driftConfirmSkips 85, seekSkipTicks 55, pageErrs 0. results.json 36.410.298 byte.
- Gate (b) in-page: **7/20** gap đạt bar (skips>0 + spread), trusted 7,
  **distinct_strict ≥ 2 = 3**. Ba gap dạng mạnh (bar prereg K3):
  1. 396 ms relPlay [16629, 17025] ph 11,60→12,33 skips=1 inside [11,8, 12,033,
     12,133] distinct=3 bracket=892 ms trusted — **freeze sạch** (qua biên clip
     12 s; ph tiến qua 3 giá trị trung gian trong lúc draws đứng).
  2. 324 ms relPlay [42602, 42926] ph 35,60→36,33 skips=1 inside [35,9, 36,1,
     36,167] distinct=3 bracket=803 ms trusted — **freeze sạch** (qua biên clip
     36 s).
  3. 2669 ms relPlay [52931, 55601] ph 45,10→47,70 skips=61 inside 59 mẫu
     distinct=32 bracket=2987 ms trusted — **stall giữa clip c15, KHÔNG phải
     freeze gate (b) theo bản chất** (xem §2.4). Analyzer vẫn tính vào bar vì
     bar chỉ kiểm skips>0 + spread + distinct — **đây là điểm yếu của bar
     in-page: không phân biệt freeze và stall seek/decode**. Đếm sạch: dạng mạnh
     freeze = **2 gap**; cộng stall = 3 gap theo đúng chữ bar.
  4 gap đạt bar còn lại đều distinct=1 (dạng yếu, như J3/K3).
- Gate (b) CDP: **0/28** recv-gap đạt bar. Ràng buộc chặn: Δdraws 2–4 ở 25/28 gap
  (draws vẫn xảy ra trong cửa sổ — freeze chỉ làm draws chậm lại, không dừng hẳn);
  3 gap có Δdraws=0 nhưng Δph=0 (đóng băng toàn bộ, bị loại đúng); 7 gap có
  e4skip=None ở đầu mút (sentinel −1, loại đúng theo rev3). Spread test trên mẫu
  CDP: 18/20 draws-gap có ph CDP trong gap nằm giữa hai đầu — CDP củng cố spread
  in-page. CDP top gaps [2689, 902, 666, 584, 516] (2689 ms = stall §2.4, rtt
  2679 ms — CDP evaluate cũng bị kẹt trong cửa sổ stall, xem §8.8).
- Worker cross-check: 4404 tick trong lúc phát; w-gap median 10 ms max 85 ms
  (worker không stall); r-gap >300 ms: 17, cả 17 có w-gap <100 ms (freeze thật);
  freeze thật max trong lúc phát 667 ms. CDP top (trừ stall) [902, 666, 584, 516]
  vs worker top [667, 583, 489, 474, 391] — cùng thang.
- Sampler: state100 median 101 ms (interval đặt 10 ms — thưa gấp 10×, xem §8.9);
  CDP recv-gap median 101 ms, rtt median 88 ms; ct distinct 508.
- Kết luận R1: **TRONG DẢI 100%, dạng mạnh QUAN SÁT ĐƯỢC (2 freeze sạch + 1 stall
  qua bar), CDP 0 gap.** Đếm lượt trong dải: 1/1; lượt có dạng mạnh: 1/1.

### 2.2 R2 — freeze, holder python N=4 — NGOÀI DẢI NHƯNG KHÔNG LOẠI (62% snap), DẠNG MẠNH 1 GAP

- Thời gian: vite-lock 04:46:12Z (0 s chờ); BAND-READY ngay 0 s (load5 3,97 đã
  trong dải nhờ sóng còn lại từ R1); probe band-wait 0 s (load5 3,53 lúc phát);
  phát ~04:46:3x–04:48:08Z; lấy kết quả tới 04:48:26Z (holder giết ngay khi
  marker 04:48:08Z); phân tích xong 04:48:26Z. Exit=0. Boot #39 suốt lượt.
- Điều kiện: load lúc phát 1,23/3,53; load5 trong lúc phát 3,53 → 2,74 (16 snap,
  median 3,12; **10/16 = 62% trong [3, 8]** — sóng tan dần; median vẫn ∈ [3,8]
  nhưng <80% snap → **NGOÀI DẢI NHƯNG KHÔNG LOẠI** theo luật prereg §2, dữ liệu
  giữ kèm bối cảnh, vẫn tính vào bar dạng mạnh); procs_running median 14 (10–17);
  draws/s median 11,6 (draws/5s 0 → 75, ổn định); RAM khả dụng lúc phát 1263 MB.
  preview.tsx md5 `9b27abe5…` trước = sau, mtimeChanged=false.
- Dữ liệu: caps 394, drawsTotal 919 (drawsKept 919 — ring 8000 KHÔNG tràn),
  mainDraws 401, state100 457 mẫu, CDP 446 mẫu (0 lỗi), workerTicks gộp 3769
  (drained 3528 + tail 241), pumpN 159, driftConfirmSkips 23, seekSkipTicks 52,
  pageErrs 0. results.json 28.268.332 byte.
- Gate (b) in-page: **10/21** gap đạt bar (skips>0 + spread), trusted 10,
  **distinct_strict ≥ 2 = 1**. Gap dạng mạnh: 500 ms relPlay [40489, 40990]
  ph 35,67→36,27 skips=1 inside [35,9, 35,9, 36,1, 36,267, 36,267] distinct=2
  bracket=693 ms trusted — **freeze sạch** (qua biên clip 36 s; ph tiến qua
  2 giá trị trung gian). 9 gap đạt bar còn lại đều distinct=1 (dạng yếu).
- Gate (b) CDP: **0/37** recv-gap đạt bar (nhiều gap CDP nhất từ trước — CDP thưa
  hơn nên recv-gap >300 ms nhiều hơn). Ràng buộc chặn vẫn Δdraws 2–5 (36/37 gap);
  chỉ 1 gap có Δdraws=0 (589 ms, Δph=0 — đóng băng toàn bộ, bị loại đúng); 1 gap
  có e4skip=None ở đầu mút (sentinel). Spread test CDP: 19/21 draws-gap có ph CDP
  trong gap nằm giữa hai đầu. CDP top [897, 589, 515, 510, 488] vs worker top
  [574, 520, 511, 432, 415] — cùng thang.
- Worker cross-check: 3769 tick trong lúc phát; w-gap median 10 ms max 94 ms
  (worker không stall); r-gap >300 ms: 20, cả 20 có w-gap <100 ms (freeze thật);
  freeze thật max trong lúc phát 574 ms.
- Sampler: state100 median 185 ms (càng thưa hơn R1 dù tải thấp hơn — xem §8.9);
  CDP recv-gap median 186 ms, rtt median 121 ms; ct distinct 343.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái hiện ở lượt
  này.** Biên 60 s (c19→c20) qua sạch: không có gap >300 ms nào quanh relPlay
  ~60.000 ms (gần nhất là gap 318 ms tại 53,73→54,10 và 386 ms tại 54,30→54,97).
- Kết luận R2: **NGOÀI DẢI NHƯNG KHÔNG LOẠI (62% snap), dạng mạnh QUAN SÁT ĐƯỢC
  (1 gap freeze sạch), CDP 0 gap.** Đếm lượt trong dải chặt: 1/2; lượt có dạng
  mạnh: 2/2.

## 3. Gate (b) dạng mạnh — verdict (KẾT LUẬN ĐỢT L3)

- R1 (trong dải 100%, load5 median 4,36): dạng yếu 4 gap + **dạng mạnh 3 gap theo
  đúng chữ bar (2 freeze sạch + 1 stall 2669 ms)**; CDP 0/28. Bracket mọi gap
  dạng mạnh: 892 / 803 / 2987 ms — **đều > 300 ms**.
- R2 (ngoài dải nhưng không loại, 62% snap, load5 median 3,12): dạng yếu 9 gap +
  **dạng mạnh 1 gap freeze sạch** (500 ms, ph 35,67→36,27, distinct=2); CDP 0/37.
  Bracket gap dạng mạnh: 693 ms — **> 300 ms**.
- **Kết luận đợt L3: DẠNG MẠNH LẶP LẠI ĐƯỢC — 2/2 lượt (4 gap theo đúng chữ bar,
  trong đó 3 freeze sạch).** Lần đầu dạng mạnh xuất hiện 2 lượt liên tiếp.
  Tần suất gộp toàn chuỗi (bar prereg K3): **3/9 lượt** (J3 0/4 + K3 1/3 + L3 2/2).
  Chỉ tính lượt trong dải chặt (median ∈ [3,8] và ≥80% snap): K3 1/3 + L3 R1 1/1
  = 2/4 lượt.
- **Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): 0 gap cả 2 lượt L3 — dạng
  mạnh KHÔNG đạt theo định nghĩa này.** Ghi rõ cả hai định nghĩa như prereg yêu
  cầu. Lưu ý: bracket ở L3 (402–2987 ms, nhỏ nhất 402 ms) lớn hơn hẳn K3 R2
  (614 ms) và J3 — nguyên nhân là sampler thưa (state100 median 101–185 ms thay
  vì 10 ms đặt; xem §8.9). Bracket đo khoảng cách giữa 2 mẫu state100 kẹp gap
  draws, nên sampler càng thưa thì bracket càng lớn một cách cơ học — định nghĩa
  bracket cũ có thể quá chặt khi sampler thưa; vòng sau nên đăng ký trước xem
  bracket có còn dùng làm điều kiện loại hay chỉ báo cáo kèm (như prereg K3 đã
  làm).
- **Mẫu phụ (n=3, chưa đủ để kết luận): cả 3 gap dạng mạnh freeze sạch đều
  straddle một biên clip 3 s** (R1: biên 12 s và 36 s; R2: biên 36 s). Gợi ý freeze
  dạng mạnh có thể tập trung ở lúc chuyển clip (pump/seek làm main thread bận
  trong lúc media clock vẫn chạy) — nhưng n=3 quá nhỏ, và 14 gap dạng yếu còn
  lại phân bố khắp timeline, nên chỉ ghi là quan sát, không kết luận.

## 4. Sampler — CDP + worker (KẾT LUẬN ĐỢT L3)

- R1: state100 median 101 ms (đặt 10 ms); CDP recv-gap median 101 ms, rtt median
  88 ms; ct distinct 508; worker drain CHẠY ĐƯỢC (7061 + 259 = 7320); worker không
  stall (w-gap max 85 ms); freeze thật max 667 ms.
- R2: state100 median 185 ms; CDP recv-gap median 186 ms, rtt median 121 ms;
  ct distinct 343; worker drain CHẠY ĐƯỢC (3528 + 241 = 3769); worker không stall
  (w-gap max 94 ms); freeze thật max 574 ms.
- **Sampler thưa hơn khi tải thấp hơn** (R2 load5 median 3,12 thưa hơn R1 4,36;
  K3 R2 cũng thưa hơn R1 dù tải thấp hơn) — mật độ sampler không đơn điệu theo
  load5; nguyên nhân chưa điều tra (có thể do probe khởi động ngay sau vite ở R2
  — trang chưa ấm, snap đầu draws/5s = 0 cả 2 lượt — hoặc do sóng host rút làm
  Chromium bị throttle khác đi). Hệ quả: distinct_strict bị ĐẾM THIẾU (ít mẫu
  trong gap hơn) — dạng mạnh quan sát được DÙ sampler thưa là bằng chứng mạnh
  hơn, không yếu hơn; nhưng so sánh số gap tuyệt đối giữa các lượt không có ý
  nghĩa trực tiếp.
- CDP-vs-worker nearest-duration: không có gap CDP đạt bar nào để đối chiếu ở cả
  2 lượt (analyzer rev3.1 đã sửa quirk K3 §4 — in rõ dòng "không có gap CDP đạt
  bar để đối chiếu"). Bar ±50 ms vẫn chỉ có bằng chứng unit-test trên dữ liệu J3
  (7/7 và 5/5 cặp khớp).
- CDP corroborate spread in-page tốt: 18/20 (R1) và 19/21 (R2) draws-gap có ph CDP
  nằm giữa hai đầu gap — CDP vẫn có giá trị giám định từng gap dù bar CDP không
  bắn (như K3 R2: CDP đọc đúng 2 giá trị trung gian của gap dạng mạnh).

## 5. Stall chuyển clip — điều tra (KẾT LUẬN ĐỢT L3)

- **Stall 5 s tại biên 60 s (K3 R3) KHÔNG tái hiện: 0/2 lượt.** R1 qua biên 60 s
  với gap 528 ms relPlay [69196, 69724] ph 59,87→60,07 skips=1 spread=True
  distinct=1 n_inside=18 (17/18 mẫu là 60,067 — ph gần như ĐỖ tại 60,067 trong
  528 ms, chữ ký đỗ biên nhưng ngắn hơn 10× so với K3 R3); R2 qua biên 60 s sạch
  (không gap >300 ms quanh 60 s). Kết luận: stall 5 s là hiện tượng hiếm/không
  ổn định, không phải hành vi hệ thống mỗi lần qua biên 60 s. Không kết luận
  "không tồn tại" — chỉ ghi "không tái hiện trong 2 lượt này".
- **Thay vào đó, R1 có stall 2669 ms giữa clip c15 (ph 45,10→47,70, relPlay
  [52931, 55601]) — KHÔNG ở biên clip.** Phân tầng theo quy tắc đăng ký trước:
  CDP vd TRƯỚC gap: ct=0,1 rs=1 seeking=True paused=True dec=1372 drop=589
  bufEnd=3 1280x720; SAU gap: ct=3 rs=4 seeking=False paused=True dec=1444
  drop=597 bufEnd=3. Worker r-gap max trong cửa sổ: 91 ms (main thread SỐNG).
  Pump trong cửa sổ: 0 event. → **tầng stall: seek/decode** (seeking=true, rs<3
  trong lúc ph đỗ). Chi tiết cần ghi rõ (vượt ra ngoài quy tắc phân tầng đơn
  giản):
  * decodedFrameCount tăng +72 trong lúc draws đứng 2,67 s — **decode KHÔNG đói
    frame**; frame đã decode mà không được vẽ trong lúc element đang seek. Stall
    nằm ở handoff seek→draw, không phải decode starvation.
  * ct của element nhảy 0,1 → 3,0 trong gap (gần hết clip 3 s) trong khi ph trang
    tiến dần 45,10 → 47,70 qua 59 mẫu trung gian — media clock vẫn chạy trong lúc
    seek; draws đóng băng vì element đang seek.
  * 0 pump event trong cửa sổ, driverActions=0 — **nguyên nhân gây ra seek giữa
    clip chưa xác định được từ dữ liệu này** (không phải seek do driver; có thể
    là seek hiệu chỉnh drift của chính trang hoặc pump seek không ghi event trong
    cửa sổ — cần điều tra thêm, không suy diễn).
  * driftConfirmSkips 61 trong gap (tổng cả lượt 85) — drift-confirm bắn liên tục
    trong lúc ph đỗ, giống chữ ký K3 R3 (297 lần trong stall 5 s).
- **Đề xuất + bằng chứng (KHÔNG tự sửa production — chỉ L1 được sửa đợt này):**
  stall xảy ra khi video element đang seek (seeking=true) trong lúc media clock
  vẫn chạy — draws đóng băng tới ~2,7 s (lượt này) / ~5 s (K3 R3) dù frame đã
  decode xong. Hướng điều tra cho L1/vòng sau: (a) vì sao có seek giữa clip khi
  không có driver action (drift-correction seek? pump seek?); (b) draw-pipeline
  có chờ seek xong mới vẽ frame đã decode không (handoff seek→draw); (c) có nên
  vẽ frame cuối đã decode trong lúc seeking thay vì đóng băng canvas. Bằng chứng:
  §2.4 chi tiết CDP vd trước/sau gap + worker r-gap max 91 ms + 0 pump event
  (file `chr-mixedalt-l3r1-fr4-analysis.txt` §9; dữ liệu thô
  `chr-mixedalt-l3r1-fr4/cdp-samples.jsonl` + `frame-parity-results.json`).
- Gap 688 ms ngay trước stall (relPlay [52233, 52921] ph 44,93→45,10, skips=1,
  spread=False, distinct=0) có thể là tiền triệu của stall (ph bắt đầu đỗ tại
  45,10) — ghi nhận, không khẳng định quan hệ nhân quả.

## 6. Quyết bar CDP (ĐỀ XUẤT — prereg-l3 §6)

- Dữ liệu đợt này: CDP 0/2 lượt L3 (R1 0/28, R2 0/37 recv-gap). Gộp K3: **0/5 lượt**
  (K3 0/3 + L3 0/2); chỉ tính lượt trong dải chặt: 0/4 (K3 3 + L3 R1 1; R2 ngoài
  dải chặt với 62% snap nên không tính vào mẫu này — nếu tính cả R2 thì 0/5).
  Trái với J3 dưới tải nặng (12 gap CDP đạt bar ở R0/R1, load5 ~10).
- Ràng buộc chặn giống hệt K3: Δdraws 2–5 ở tải vừa (R1 25/28 gap, R2 36/37 gap
  có Δdraws 2–5); các gap có Δdraws=0 đều có Δph=0 (đóng băng toàn bộ, bị loại
  đúng). Bar CDP đòi draws đóng băng HOÀN TOÀN trong freeze — ở tải vừa freeze
  chỉ làm draws chậm lại chứ không dừng hẳn, nên bar không bao giờ bắn.
- **ĐỀ XUẤT: BỎ bar CDP làm bar song song.** Giữ in-page làm bar chính; giữ CDP
  làm công cụ giám định từng gap (đọc giá trị ph trung gian, xác nhận drawsTotal
  đứng yên — như K3 R2 và L3 R1 §4: CDP corroborate spread 18/20 và 19/21 gap).
  Lý do: bar kém nhạy ở tải vừa, không phải gate (b) vắng mặt (in-page thấy dạng
  mạnh 2/2 lượt trong khi CDP 0/2).
- **Caveat bắt buộc:** điều kiện chữ trong prereg §6 ("CDP 0/3 lượt trong dải đợt
  này → đề xuất bỏ") không thỏa mãn theo đúng chữ vì L3 chỉ có 2 lượt (1 trong
  dải chặt + 1 ngoài dải nhưng không loại) do hết giờ sau reboot #39. Đề xuất này
  dựa trên bằng chứng gộp 0/5 lượt (K3+L3), không dựa trên điều kiện chữ. Đây là
  ĐỀ XUẤT có lý do — verify/parent quyết cuối, không phải kết luận đóng hẳn.

## 7. Reboot / điều kiện tải

- Boot #38 = 2026-11-14 02:24:45Z (boot_id 2f001e9c…). **Reboot #39 = 2026-11-14
  02:50:48Z** (boot_id ce518c02-0368-46f4-8416-d61e7d042d84; `uptime -s` đo trực
  tiếp) — xảy ra TRƯỚC khi luồng giao lại bắt đầu (04:29Z), giết luồng L3 đầu lúc
  ~02:51:23Z khi đang chạy biến thể A của thử nghiệm tải (8 mẫu, xem §1.2). Gap
  #38→#39 = 26'03" (ngắn — sàn gần nhất #33 là 19'07"). Không mất dữ liệu L3:
  prereg + script + analyzer + kết quả dở variant A đều còn trên đĩa; luồng giao
  lại tái dùng toàn bộ, không làm lại phần chuẩn bị.
- Boot #39 suốt cả 2 lượt probe (R1 04:35–04:44Z, R2 04:46–04:48Z) — không reboot
  trong lúc đo. L9 poll log (verify đợt 110) đã đọc theo run-l3.sh khi boot đổi:
  không có poll.log mới của L9 trong thư mục round110-l9* lúc chạy (chỉ có cờ
  round110-l9-done) — ghi nhận, không ảnh hưởng dữ liệu.
- Điều kiện tải tóm tắt: R1 load5 median 4,36 (16/16 snap trong dải — sóng host);
  R2 load5 median 3,12 (10/16 snap trong dải — sóng tan dần). Nguồn sóng host
  không xác định được (không ghi lại tiến trình ngoài cell lúc sóng tới) — ghi rõ
  là chưa biết, không đổ cho sibling cụ thể nào.
- RAM khả dụng lúc phát: R1 712 MB, R2 1263 MB (thấp nhất lúc phát R1 — vite +
  Chromium + sóng host). Không OOM, không ENOSPC lượt nào (vite dùng workaround
  server.watch.ignored ["**/**"], 0 inotify FD).

## 8. Giới hạn và caveat (trung thực, gộp — KẾT LUẬN ĐỢT L3)

1. **MỘT PHẦN:** prereg đăng ký 3 lượt probe trong dải + thử nghiệm tải đầy đủ;
   chỉ làm được 2 lượt probe (R1 trong dải chặt, R2 ngoài dải nhưng không loại)
   và thử nghiệm tải rút gọn (A nhiễm sóng + B rút gọn 60 s; C/D/liều chưa thử).
   Nguyên nhân: reboot #39 giết luồng đầu + hạn cứng 05:15Z. Không chạy bù ngoài
   hạn. Mọi tần suất gộp đều tính trên mẫu thực tế (2 lượt L3), không suy diễn
   thành 3 lượt.
2. Dạng mạnh chỉ 4 gap theo đúng chữ bar trong 2 lượt (3 freeze sạch + 1 stall
   qua bar) — tần suất gộp 3/9 lượt toàn chuỗi vẫn thấp; chỉ khẳng định "đã quan
   sát được và lặp lại được", không khẳng định "thường xuyên" hay ước lượng tỷ lệ.
3. **Bar in-page không phân biệt freeze và stall seek/decode:** gap stall 2669 ms
   (R1) qua bar dạng mạnh theo đúng chữ (skips>0 + spread + distinct=32) dù bản
   chất là stall seek, không phải freeze. Đếm sạch (chỉ freeze): R1 2 gap, R2 1 gap.
   Vòng sau nên đăng ký trước quy tắc loại stall >1000 ms khỏi đếm dạng mạnh
   (hoặc đếm riêng hai loại) trước khi chạy.
4. Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap cả 2 lượt
   (bracket nhỏ nhất 402 ms). Theo bar prereg K3 (không yêu cầu bracket): 4 gap.
   Người đọc dùng định nghĩa nào cũng tự đánh giá được — ghi rõ cả hai, không
   giấu. Vòng sau nên quyết trước bracket còn là điều kiện loại hay chỉ báo cáo
   kèm (xem §3).
5. Stall 5 s biên 60 s không tái hiện trong 2 lượt — không kết luận "không tồn
   tại"; stall 2669 ms giữa clip là hiện tượng khác (seek/decode), không phải bản
   sao của stall K3 R3. Nguyên nhân gây seek giữa clip chưa xác định (0 pump
   event trong cửa sổ, driverActions=0).
6. Holder python/node spin không dial được load5 vào [3,8] khi máy yên (§1.2) —
   dải tải đợt này được giữ bằng sóng host/sibling, không phải dial độc lập.
   **Không được nói "holder giữ được dải".** Nợ "dial độc lập" vẫn mở (xem §1.2).
7. `preview.tsx` không đổi suốt đợt L3 (md5 `9b27abe5…` trước = sau cả 2 lượt,
   mtimeChanged=false) — build-identity ổn định (bản L1-fix).
8. CDP rtt 2679 ms trong cửa sổ stall R1 (CDP evaluate bị kẹt 2,7 s trong lúc
   worker r-gap max chỉ 91 ms) — CDP sampler tự nó bị kẹt trong stall, không chỉ
   đo stall. Không dùng rtt CDP làm số đo độ dài stall; chỉ dùng draws-gap +
   worker r-gap.
9. Sampler thưa (state100 median 101 ms R1 / 185 ms R2 thay vì 10 ms đặt; CDP
   median 101/186 ms) — distinct_strict bị đếm thiếu và bracket bị thổi phồng
   một cách cơ học. Dạng mạnh quan sát được DÙ sampler thưa nên bằng chứng mạnh
   hơn, không yếu hơn; nhưng số gap tuyệt đối không so được trực tiếp giữa các
   lượt (draws/s R1 11,8 vs R2 11,6 — gần nhau, may mắn so được lần này).
10. R1: draws/5s snap đầu = 0 (trang chưa ấm — probe khởi động ngay sau vite);
    R2 tương tự. Không ảnh hưởng gap đã phân tích (đều ở giữa/cuối lượt).
11. Analyzer rev3.1 đã sửa quirk K3 §4 (in rõ "không có gap CDP đạt bar để đối
    chiếu") — xác nhận chạy đúng ở cả 2 lượt. Quirk hiển thị ph 2 chữ số thập phân
    (K3 §8.7) vẫn còn — không ảnh hưởng verdict.
12. Sóng tải host đưa R1 vào dải có nguồn không xác định (không ghi lại tiến trình
    ngoài cell lúc sóng tới 04:42Z) — không đổ cho sibling cụ thể nào; R2 sóng
    tan dần (load5 3,53 → 2,74) nên chỉ 62% snap trong dải.
13. Không đo thêm kill (đã ĐÓNG từ K3). Không sửa production.

## 9. Nợ mở (cho đợt sau)

1. Gate (b) dạng mạnh — **L3 ĐÓNG phần lặp lại: đã quan sát được 2/2 lượt (3 gap
   freeze sạch + 1 stall qua bar).** Còn mở: (a) tần suất vẫn thấp (3/9 lượt toàn
   chuỗi) — muốn ước lượng tỷ lệ cần nhiều lượt hơn; (b) quyết bar CDP (đề xuất
   bỏ làm bar song song, §6 — chờ verify/parent quyết); (c) bar in-page cần quy
   tắc loại stall >1000 ms khỏi đếm dạng mạnh + quyết vai trò bracket (xem §8.3,
   §8.4); (d) cả 3 gap freeze sạch đều straddle biên clip — cần mẫu lớn hơn để
   kiểm tra freeze có tập trung ở chuyển clip không.
2. Stall chuyển clip — **5 s biên 60 s KHÔNG tái hiện (0/2 lượt); stall mới 2669 ms
   giữa clip c15 (seek/decode, frame đã decode mà không vẽ) đã ghi + đề xuất hướng
   điều tra (§5).** Còn mở: (a) nguyên nhân gây seek giữa clip khi không có driver
   action; (b) handoff seek→draw (vẽ frame cuối đã decode trong lúc seeking?);
   (c) drift-confirm bắn 61 lần trong stall — có phải triệu chứng hay chỉ hệ quả.
3. Bộ tạo tải — **dial độc lập vẫn mở:** python/node spin không nâng được load5
   khi máy yên (§1.2); `yes` chưa thử; liều N=3/N=10 chưa thử; biến thể D (I/O
   D-state) chưa thử và có caveat "tải số" (§1.2). Vòng sau cần phương án khác
   (vite/Chromium nền, hoặc chấp nhận dải ambient + ghi rõ nguồn tải từng lượt).
4. Sampler thưa (state100 median 101–185 ms thay vì 10 ms) — nguyên nhân chưa điều
   tra; ảnh hưởng đếm distinct_strict và bracket (§8.9).
5. Nợ đứng yên đợt 109/110 (xem LIMITS gộp đợt 109 §4 và K3 §9): G1 + mù #22 chờ
   user quyết, E4 + A/B xác nhận, E6 thiếu 1 sự kiện, EPERM probe #29 + mù #28,
   F6' lượt xác nhận lúc yên, ENOSPC vite nối tiếp bắt buộc, WebKit sau reboot,
   birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security.yml 403, release gate —
   không thuộc L3.

## 10. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Analyzer rev3.1 trên dữ liệu L3 | R1 in-page 7 / trusted 7 / distinct≥2 = 3 (2 freeze + 1 stall); R2 10 / 10 / 1 | §2.1–2.2; `chr-mixedalt-l3r1-fr4-analysis.txt`, `chr-mixedalt-l3r2-fr4-analysis.txt` |
| Probe rev L3 | ring 8000 (không tràn); CDP vd diag; vite watch.ignored; marker play-done | `apps/web/scripts/probe110l3-frame-parity.mjs` |
| Build identity (suốt đợt L3) | preview.tsx md5 `9b27abe57975ec5b69ec2e21c3fa281c` trước = sau cả 2 lượt | §2.1–2.2; `round110-preview-md5.txt` |
| R1 | Trong dải 100% (4,36; 16/16); dạng mạnh 3 (2 freeze + 1 stall); CDP 0/28; stall 2669 ms giữa clip c15 | §2.1 |
| R2 | Ngoài dải nhưng không loại (3,12; 10/16); dạng mạnh 1 (freeze sạch); CDP 0/37; stall 0 | §2.2 |
| Reboot #39 | 2026-11-14 02:50:48Z, boot_id ce518c02…; giết luồng L3 đầu lúc ~02:51:23Z; không reboot trong lúc đo (R1/R2) | `uptime -s` trực tiếp; §7 |
| Load-test B | python ×6, 60 s, máy yên: load1 0,13 → 0,08 (thất bại); hog đơn quay thật 99,5% CPU | §1.2; `load-test-l3.txt` (A, 8 mẫu, nhiễm sóng) |
| Vite/ENOSPC | 0 ENOSPC; lock lấy ngay 0 s chờ cả 2 lượt; không vite sibling | driver-l3.log |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round110-l3-zombie.txt`
— chứa LIMITS này + `apps/web/scripts/probe110l3-frame-parity.mjs` (2 file text).

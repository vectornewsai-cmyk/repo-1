# PHASE9_ROUND111_M3_ZOMBIE_LIMITS — Zombie gate (b) lượt thứ 3 + điều tra stall + dial tải độc lập + quyết định bar CDP

> Luồng M3, đợt 111. Lượt cron 12:35 +07 14/11/2026 (bắt đầu 05:38Z, xong
> ~06:40Z). Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG
> release/tag. Không sửa production** — chỉ probe mới
> (`probe111m3-frame-parity.mjs`, copy probe110l3 chỉ đổi đường dẫn scratch)
> + analyzer rev3.1 tái dùng nguyên vẹn + holder/load-test mới.
> Prereg (viết TRƯỚC khi đo): `hidden_files/round111-m3/prereg-m3.md`.
> Dữ liệu thô: `hidden_files/round111-m3/` (prereg, load-test, driver-m3.log,
> 3 lượt probe + analysis, run-m3.sh, load-holder-m3.sh, m3-progress.log).
>
> **HOÀN THÀNH ĐẦY ĐỦ:** 3/3 lượt probe trong dải + thử nghiệm tải đầy đủ
> (C/E1–E4/D) + điều tra stall trong 3 lượt — hoàn thành chuỗi 3 lượt mà L3
> đợt 110 chỉ làm được 2/3. Điều kiện chữ prereg §6 cho quyết định bar CDP
> **THỎA MÃN theo đúng chữ lần đầu tiên** (CDP 0/3 lượt trong dải đợt này).

## 0. Tóm tắt

- **Dạng mạnh: 1/3 lượt M3 (R2, 4 gap freeze sạch).** R1 0 gap, R3 0 gap.
  Tần suất gộp toàn chuỗi (bar prereg K3): J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3
  = **4/12 lượt**. Theo quy tắc loại stall mới (§2, đăng ký trước): kết quả
  KHÔNG đổi — không có gap >1000 ms nào trong cả 3 lượt M3, nên đếm
  freeze-only cũng là 4/12 lượt (L3: 4 gap theo chữ → 3 gap freeze; lượt
  vẫn 2/2). Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): **0 gap**
  cả 3 lượt M3 (bracket nhỏ nhất 401 ms).
- **CDP bar: 0/3 lượt trong dải đợt này (R1 0/3, R2 0/62, R3 0/12 recv-gap)
  — ĐIỀU KIỆN CHỮ prereg §6 THỎA MÃN → ĐỀ XUẤT BỎ bar CDP làm bar song
  song** (giữ in-page làm bar chính + CDP giám định từng gap). Gộp dải chặt:
  K3 0/3 + L3 0/1 + M3 0/3 = **0/7 lượt**; gộp mọi lượt: 0/8 lượt
  (K3 0/3 + L3 0/2 + M3 0/3). Ràng buộc chặn vẫn Δdraws 2–5 ở tải vừa.
- **Stall chuyển clip 5 s biên 60 s: KHÔNG tái hiện 0/3 lượt M3** (gộp L3+M3:
  0/5; từ trước tới nay chỉ K3 R3 thấy 1 lần/8 lượt). **Stall giữa clip kiểu
  c15 (2669 ms, seek/decode): cũng 0/3 lượt M3** (gộp L3+M3: 1/5 lượt — chỉ
  L3 R1). Không có draws-gap >1000 ms nào trong cả 3 lượt M3.
- **Dial tải độc lập: THẤT BẠI, lần này có bằng chứng sạch.** `yes` ×10 chạy
  60 s khi sóng sibling đã tan: load1 RƠI 2,36 → 1,02 dù 10 spinner quay
  thật (~29% CPU mỗi hog, procs_running 12–21) — busy-loop không nâng được
  loadavg trên cell này. `yes` ×6 tăng 2,12 → 7,28 NHƯNG nhiễm sóng sibling
  (M4 chrome scan + M6 vite cùng lúc) nên không kết luận thắng. Python N=3/N=10
  chạy trên cao nguyên tải nên không đọc được. Biến thể D (I/O D-state):
  procs_blocked ~0, không tạo được D-state bền. Dải [3,8] ở cả 3 lượt M3
  được giữ bằng **sóng ambient** (sóng tải M7 + suy giảm load5 sau sóng),
  không phải holder — **không được nói "holder giữ được dải"**.
- **Build-identity đổi giữa prereg và R1:** M1 (luồng round111-m1) sửa
  production 05:46:19Z: preview.tsx 9b27abe5 → **c4198206** (+ playheadHold90R2).
  Cả 3 lượt M3 chạy trên c4198206, md5 ổn định trước/sau mỗi lượt. Nhánh mới
  của M1 chưa từng chạy live theo M1 (0 ended-close trong 4 lượt A/B) nên
  khả năng cao không ảnh hưởng hành vi gate (b) — ghi rõ là caveat, xem §7.
- Vite lock: R1 lần 1 BLOCKED sau 20 phút (M7 giữ lock suốt 05:51–06:18Z);
  đổi poll lock 60 s → 5 s (cùng protocol mkdir nguyên tử) vì khe hở giữa
  các lượt chỉ vài giây — R1 lần 3 lấy lock sau 45 s; R2/R3 lấy ngay 0 s.
  Không ENOSPC, không reboot trong lúc đo (boot #40 suốt đợt).

## 1. Phương pháp và điều kiện chạy

### 1.1 Bar dạng mạnh + quy tắc loại stall (prereg-m3 §2 — đăng ký TRƯỚC khi chạy)

- Dạng mạnh = ≥1 gap đạt bar J3 (skips>0 + spread G2 in-page, hoặc bản CDP:
  recv-gap >300 ms + Δe4skip>0 + Δph ≥ 0,7×gap + drawsTotal không đổi) VÀ
  distinct_strict ≥ 2. Trusted (rev3): n_inside ≥ 2.
- **Quy tắc loại stall (MỚI, đăng ký trước):** mọi draws-gap duration
  **>1000 ms** phân loại STALL, **LOẠI KHỎI đếm dạng mạnh** (cả đếm gap lẫn
  đếm lượt); báo cáo riêng kèm phân tầng. Đếm dạng mạnh M3 chỉ tính gap
  ≤1000 ms. Để so sánh được với chuỗi cũ, mỗi lượt báo cáo CẢ HAI số (đúng
  chữ bar K3 + loại stall).
- Với MỖI gap đạt bar, báo cáo CẢ HAI: (a) bar prereg K3 (không yêu cầu
  bracket), (b) định nghĩa bracket cũ J3 (bracket ≤ 300 ms). Bracket chỉ báo
  cáo kèm, KHÔNG phải điều kiện loại.
- Luật loại lượt (giữ K3 §3): lượt bị LOẠI khỏi bar dạng mạnh nếu <50%
  snapshot trong cửa sổ đo có load5 ∈ [3, 8]; "trong dải" nếu load5 median
  ∈ [3, 8] VÀ ≥80% snapshot trong dải; 50–80% là "ngoài dải nhưng không loại".
- Probe probe111m3-frame-parity.mjs: copy probe110l3, CHỈ đổi đường dẫn
  scratch round110-l3 → round111-m3, CFG_DIR /tmp/round110-l3 →
  /tmp/round111-m3, tên driver global __vcut110l3Drv → __vcut111m3Drv
  (diff đã kiểm: chỉ các dòng đó + dòng tiêu đề; `node --check` OK). Mọi
  logic đo giữ nguyên: CDP vd diag, ring draws + mainDraws 8000, vite
  watch.ignored ["**/**"], marker play-done, sampler/state100/spec 24 clip
  scroll-mixed-alt, freeze-run, band-wait 300 s. Analyzer rev3.1 tái dùng
  nguyên vẹn (`round110-l3/round110-l3-analyze.py`).
- Phân tầng stall (giữ L3 §4): seeking=true và/hoặc readyState < 3 trong lúc
  ph đỗ → seek/decode; seeking=false, readyState=4, decodedFrameCount đứng
  yên, drawsTotal đứng yên → draw-pipeline; decodedFrameCount vẫn tăng trong
  lúc ph đỗ → lớp playhead/tick (handoff seek→draw). Luôn đối chiếu worker
  r-gap max, pump decisions, biên clip, driftConfirmSkips, CDP vd trước/sau.
- Phối hợp vite: lock thư mục mkdir nguyên tử + file owner (pid + tên luồng +
  giờ bắt đầu) + pgrep `\.bin/vite`; nhả lock ngay sau mỗi lượt; kill vite
  theo pid node thật, kiểm ps + curl sau khi kill. **Thay đổi giữa đợt (ghi
  rõ, không giấu):** poll lock đổi 60 s → 5 s sau khi R1 lần 1 BLOCKED —
  xem §7. Cổng probe 5590 (R1/R2/R3); vite log append theo lượt.
- KHÔNG đo thêm kill. KHÔNG sửa production. KHÔNG push / release / tag.
  CẤM kiểm lại TTS 39 (không kiểm). Birefnet không thử (RAM chưa đổi).

### 1.2 Bộ tạo tải — thử nghiệm có kiểm soát (prereg-m3 §3; LÀM ĐẦY ĐỦ)

- Máy lúc thử nghiệm: load 2,12/2,09/1,04 lúc 05:42:09Z (đang yên, load5
  dưới dải) — điều kiện thuận lợi. 6 biến thể, mỗi biến thể lấy mẫu
  load1/load5/procs_running/procs_blocked + %CPU tổng + %CPU hog mỗi 5 s
  (file `hidden_files/round111-m3/load-test-m3.txt`, 63 mẫu). Khung giờ thử
  nghiệm 05:42:09–05:49:56Z (ghi rõ để sibling đối chiếu).
- **(C) `yes` ×6, 90 s: load1 2,12 → 7,28 (đỉnh 7,38), load5 1,04 → 3,99 —
  TĂNG RÕ NHƯNG NHIỄM SÓNG, KHÔNG KẾT LUẬN THẮNG.** Chuỗi mẫu tăng đơn điệu
  mượt (2,12 → 2,67 → 3,26 → 4,28 → 4,90 → 5,23 → 6,04 → 6,76 → 6,86 →
  7,11 → 7,33 → 7,38 → 7,27 → 7,17 → 7,22) — nhưng cùng lúc M4 chạy chrome
  scan (blind29-hole-chrome 05:42:19/05:42:31Z), M6 chạy vite A/B
  (05:44:53Z), M1 chạy postboot-check (05:44:13Z); procs_running 5–16 suốt
  C. Sau khi giết yes, load1 KHÔNG hồi ngay (6,96 sau 10 s) — nhưng 10 s
  quá ngắn để load1 suy giảm, và E1 bắt đầu ngay sau nên không có cửa sổ
  hồi sạch. Không tách được đóng góp của yes khỏi sóng sibling.
- **(E1) python N=3, 60 s: load1 6,96 → 6,89 — PHẲNG, KHÔNG ĐỌC ĐƯỢC.**
  Chạy trên cao nguyên tải do sóng sibling giữ (M6 vite + M4 scan vẫn chạy);
  python ×3 quá ít để thay đổi cao nguyên. Không kết luận gì về liều N=3.
- **(E2) python N=10, 60 s: load1 6,94 → 6,03 — SUY NHẸ, KHÔNG TĂNG.**
  Chạy trên cùng cao nguyên đang tan dần; không thấy python ×10 nâng load.
- **(E3) `yes` N=3, 60 s: load1 5,73 → 2,35 — RƠI ĐỀU, KHÔNG GIỮ ĐƯỢC
  TẢI.** Sóng sibling tan trong lúc chạy (procs_running vẫn 6–13); yes ×3
  không bù được đà rơi.
- **(E4) `yes` N=10, 60 s: load1 2,36 → 1,02 — RƠI ĐỀU, BẰNG CHỨNG SẠCH
  NHẤT.** Sóng đã tan trước khi E4 bắt đầu (load1 2,36); 10 spinner `yes`
  quay thật (ps kiểm trực tiếp lúc E3: mỗi hog ~29% CPU, state R) mà
  load1 vẫn rơi đơn điệu về 1,02; procs_running 12–21 suốt lúc chạy.
  **Busy-loop ×10 không nâng được loadavg trên cell này khi máy yên.**
  Đây là đối chứng sạch cho C (cùng cơ chế, liều cao hơn, kết quả ngược) —
  nên C được diễn giải là nhiễm sóng, không phải thắng.
- **(D) tải I/O D-state ×6, 60 s: load1 0,94 → ~1,9, procs_blocked ~0 —
  THẤT BẠI.** 6 vòng `dd ... bs=4M count=32 conv=fdatasync` lặp (file trên
  /home, đã xóa sau test): procs_blocked = 0 ở 5/9 mẫu, 1 ở 2 mẫu, 2 ở
  1 mẫu, 6 ở 1 mẫu (blip thoáng qua, không bền); load1 chỉ nhích 0,94 →
  2,65 rồi về ~1,9. Đĩa quá nhanh để tạo D-state bền. D không dùng được
  làm dial; caveat "tải số" trong prereg vẫn đứng (D cũng không tạo tranh
  CPU thật).
- **Lỗi đo (tự nhận):** cột hogN/hogCPU% trong load-test-m3.txt LUÔN = 0 —
  pattern grep/pgrep trong load-test-m3.sh dòng 28 dùng `\\(` (double
  backslash, copy từ L3) nên ERE không khớp cmdline thật (`while True: pass`
  không có dấu ngoặc). Hog quay thật được xác minh độc lập: pid spawn ghi
  trong log + `ps` trực tiếp (yes ~29% CPU mỗi hog lúc E3). Lỗi này chỉ
  hỏng 2 cột phụ; load1/load5/procs_running/procs_blocked/cpuBusy% đo độc
  lập và vẫn dùng được. Vòng sau sửa pattern trước khi chạy.
- **Bằng chứng độc lập từ sibling M7 (đọc từ log của họ, không phải của M3):
  40 hog node spin → load1 0,24–0,43 (05:56–05:58Z, dial r66 của M7); sau
  đó 16–24 hog trùng với load1 12–14 (06:10Z, sóng host/sibling ập tới).
  Cùng một cơ chế hog cho 2 kết quả trái ngược theo sóng nền — ủng hộ kết
  luận "hog không dial được, sóng mới quyết định load".** (M7 sau đó đẩy
  load1 tới 37,23 lúc 06:18:51Z bằng hog + vite + chromium + sóng — con số
  đó là tổng hợp, không tách được phần hog.)
- **Holder đợt này (load-holder-m3.sh, GEN=python, N khởi điểm 4, max 8):**
  điều chỉnh theo load1 như L3; giết ngay khi marker play-done xuất hiện.
  **Holder không đưa load5 vào dải ở bất kỳ lượt nào:** R1 WAIT-BAND 60 s
  chờ load5 rơi từ 8,52 → 7,79 (suy giảm sau sóng M7); R2 BAND-READY 0 s
  (load5 3,78 đã trong dải nhờ sóng còn lại); R3 BAND-READY 0 s (load5
  3,78). Dải được giữ bằng sóng ambient + đà suy giảm load5, không phải
  holder. **Không được nói "holder giữ được dải".**
- **Kết luận §1.2: không có bộ tạo tải local nào dial được load5 vào [3,8]
  trên cell này khi máy yên** — busy-loop (node/python/yes, N=3/6/10, kể cả
  40 hog của M7) không nâng được loadavg; I/O D-state không tạo được
  D-state bền. Nợ "dial độc lập" vẫn mở — hướng thử tiếp theo (cho vòng
  sau, không phải kết luận): chạy thêm vite/Chromium nền làm tải thật (tốn
  RAM), hoặc chấp nhận dải ambient + ghi rõ nguồn tải từng lượt như đợt này.

## 2. Kết quả từng lượt

### 2.1 R1 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 0 GAP

- Thời gian: R1 lần 1 BLOCKED sau 20 phút chờ lock (05:53:31–06:13:41Z, M7
  giữ lock suốt — xem §7); khởi động lại lần 2, chờ tiếp; đổi poll lock
  60 s → 5 s lúc ~06:23Z; lần 3 lấy lock 06:24:33Z (sau 45 s chờ).
  WAIT-BAND 06:24:33–06:25:33Z (60 s, load5 8,52 → 7,79 — chờ sóng M7 suy
  giảm vào dải); phát 06:25:33–06:28:02Z (~87 s wall cho 72 s timeline);
  phân tích xong 06:28:03Z. Exit=0. Boot #40 suốt lượt (không reboot).
- Điều kiện: load lúc phát 4,85/7,91; load5 trong lúc phát 7,91 → 7,55
  (16 snap, median 7,70; **16/16 = 100% trong [3, 8]**); procs_running
  median 8 (4–18); draws/s median 29,4 (draws/5s 0 → 256, tăng dần — snap
  đầu 0 do trang chưa ấm); RAM khả dụng lúc phát 1103 MB. preview.tsx md5
  `c4198206…` trước = sau, mtimeChanged=false.
- Dữ liệu: caps 905, drawsTotal 2397 (drawsKept 2397 — ring 8000 KHÔNG
  tràn), mainDraws 1020, state100 835 mẫu, CDP 1012 mẫu (0 lỗi),
  workerTicks gộp 5618 (drained 5508 + tail 110), pumpN 424,
  driftConfirmSkips 23, seekSkipTicks 68, pageErrs 0. results.json
  64.509.672 byte.
- Gate (b) in-page: **0 gap** đạt bar (chỉ 1 draws-gap >300 ms trong cả
  lượt: 302 ms relPlay [77745, 78048] ph 71,87→71,97 skips=0 spread=False
  distinct=0 — ph gần như đỗ tại 71,967 qua 7 mẫu, không đạt bar).
  distinct_strict ≥ 2 = 0. Theo quy tắc loại stall: cũng 0 (không gap
  >1000 ms). Theo bracket cũ J3: 0 (bracket gap duy nhất 401 ms > 300).
- Gate (b) CDP: **0/3** recv-gap đạt bar (378 ms Δdraws=0 nhưng Δph=0 và
  e4skip=None; 380 ms Δdraws=2; 314 ms Δdraws=4). Spread test CDP: 0/1
  draws-gap có ph CDP trong gap nằm giữa hai đầu (chỉ 1 gap để kiểm).
- Worker cross-check: 5118 tick trong lúc phát; w-gap median 10 ms max
  76 ms (worker không stall); r-gap >300 ms: 1 (364 ms tại tick #0,
  relPlay≈8 ms — artifact khởi động, không phải freeze trong lúc phát);
  freeze thật max trong lúc phát: không có (ngoài tick #0). CDP top
  [380, 378, 314] vs worker top [364] — cùng thang, đều nhỏ.
- Sampler: state100 median 89,5 ms (dày nhất trong 3 lượt M3; vẫn thưa gấp
  ~9× so với 10 ms đặt); CDP recv-gap median 79 ms, rtt median 58 ms;
  ct distinct 791.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái hiện.**
  Biên 60 s (c19→c20) qua không có gap >300 ms nào quanh relPlay ~60.000 ms.
- Kết luận R1: **TRONG DẢI 100%, dạng mạnh 0 gap, CDP 0 gap, stall 0.**
  Đếm lượt trong dải: 1/1; lượt có dạng mạnh: 0/1.

### 2.2 R2 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 4 GAP FREEZE SẠCH

- Thời gian: vite-lock 06:29:4xZ (0 s chờ — lấy ngay sau khi M5 nhả);
  BAND-READY ngay 0 s (load5 3,78 đã trong dải); phát ~06:29:45–06:31:57Z;
  phân tích xong 06:31:57Z. Exit=0. Boot #40 suốt lượt.
- Điều kiện: load lúc phát 1,41/4,89; load5 trong lúc phát 4,81 → 3,74
  (16 snap, median 4,25; **16/16 = 100% trong [3, 8]**); procs_running
  median 16 (8–23); draws/s median 9,6 (draws/5s 2 → 61); RAM khả dụng
  lúc phát 1951 MB. preview.tsx md5 `c4198206…` trước = sau,
  mtimeChanged=false.
- Dữ liệu: caps 327, drawsTotal 750 (drawsKept 750 — ring 8000 KHÔNG
  tràn), mainDraws 331, state100 389 mẫu, CDP 374 mẫu (0 lỗi),
  workerTicks gộp 3433 (drained 3299 + tail 134), pumpN 131,
  driftConfirmSkips 23, seekSkipTicks 46, pageErrs 0. results.json
  23.475.135 byte.
- Gate (b) in-page: **11/44** gap đạt bar (skips>0 + spread), trusted 10,
  **distinct_strict ≥ 2 = 4**. Bốn gap dạng mạnh (đều là freeze sạch, đều
  ≤1000 ms nên quy tắc loại stall không đổi số đếm):
  1. 425 ms relPlay [7179, 7604] ph 5,77→6,23 skips=1 inside [5,933,
     6,133, 6,233, 6,233] distinct=2 bracket=703 ms trusted — **freeze
     sạch** (qua biên clip 6 s).
  2. 608 ms relPlay [20082, 20689] ph 17,73→18,33 skips=1 inside [17,933,
     18,2, 18,333, 18,333, 18,333] distinct=2 bracket=839 ms trusted —
     **freeze sạch** (qua biên clip 18 s).
  3. 430 ms relPlay [40176, 40606] ph 35,43→36,27 skips=1 inside [35,767,
     36,067, 36,167] distinct=3 bracket=861 ms trusted — **freeze sạch**
     (qua biên clip 36 s).
  4. 594 ms relPlay [46806, 47400] ph 41,47→42,23 skips=1 inside [41,767,
     42,067] distinct=2 bracket=868 ms trusted — **freeze sạch** (qua
     biên clip 42 s).
  7 gap đạt bar còn lại đều distinct=1 (dạng yếu). Gap 923 ms relPlay
  [3378, 4301] ph 2,27→3,27 distinct=2 NHƯNG skips=None (e4skip chưa khởi
  tạo) nên KHÔNG tính vào bar — ghi rõ để khỏi đếm nhầm.
- Gate (b) CDP: **0/62** recv-gap đạt bar (nhiều gap CDP nhất từ trước —
  CDP thưa nên recv-gap >300 ms nhiều hơn). Ràng buộc chặn vẫn Δdraws 2–4
  (60/62 gap); 2 gap có Δdraws=0 (584 ms Δph=0; 401 ms Δph=0,167,
  Δct=−2,733 — đóng băng toàn bộ nhưng Δph không đủ, bị loại đúng);
  6 gap có e4skip=None ở đầu mút (sentinel). Spread test CDP: **44/44**
  draws-gap có ph CDP trong gap nằm giữa hai đầu — CDP củng cố spread
  in-page tuyệt đối ở lượt này. CDP top gaps [609, 584, 583, 516, 509]
  vs worker top [596, 588, 495, 488, 472] — cùng thang.
- Worker cross-check: 3433 tick trong lúc phát; w-gap median 10 ms max
  173 ms (worker không stall); r-gap >300 ms: 39, cả 39 có w-gap <100 ms
  (freeze thật); freeze thật max trong lúc phát 596 ms.
- Sampler: state100 median 199 ms (thưa nhất trong 3 lượt M3 — xem §8.9);
  CDP recv-gap median 195 ms, rtt median 181 ms; ct distinct 301.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái
  hiện.** Biên 60 s qua với gap lớn nhất quanh đó chỉ 317 ms relPlay
  [66891, 67208] ph 59,77→60,07 skips=1 distinct=1 (dạng yếu, không phải
  stall).
- Kết luận R2: **TRONG DẢI 100%, dạng mạnh QUAN SÁT ĐƯỢC (4 gap freeze
  sạch), CDP 0 gap, stall 0.** Đếm lượt trong dải: 2/2; lượt có dạng
  mạnh: 1/2.

### 2.3 R3 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 0 GAP

- Thời gian: vite-lock 06:33:47Z (0 s chờ); BAND-READY ngay 0 s (load5
  3,78 đã trong dải); phát 06:33:47–06:36:11Z; phân tích xong 06:36:12Z.
  Exit=0. Boot #40 suốt lượt.
- Điều kiện: load lúc phát 7,30/4,74; load5 trong lúc phát 4,74 → 5,04
  (15 snap, median 4,94; **15/15 = 100% trong [3, 8]**); procs_running
  median 8 (6–16); draws/s median 21,2 (draws/5s 2 → 130); RAM khả dụng
  lúc phát 1136 MB. preview.tsx md5 `c4198206…` trước = sau,
  mtimeChanged=false.
- Dữ liệu: caps 609, drawsTotal 1498 (drawsKept 1498 — ring 8000 KHÔNG
  tràn), mainDraws 637, state100 624 mẫu, CDP 670 mẫu (0 lỗi),
  workerTicks gộp 4057 (drained 3649 + tail 408), pumpN 289,
  driftConfirmSkips 23, seekSkipTicks 45, pageErrs 0. results.json
  43.695.399 byte.
- Gate (b) in-page: **0 gap** đạt bar (5 draws-gap >300 ms; gap đáng chú
  ý nhất: 516 ms relPlay [73595, 74111] ph 68,43→69,33 skips=1 NHƯNG
  spread=False — ph nhảy mà không có mẫu trung gian; gap 367 ms ph đỗ tại
  45,267 qua 4 mẫu nhưng skips=0). distinct_strict ≥ 2 = 0. Theo quy tắc
  loại stall: cũng 0. Theo bracket cũ J3: 0 (bracket nhỏ nhất 499 ms).
- Gate (b) CDP: **0/12** recv-gap đạt bar. Ràng buộc chặn: Δdraws 2–4 ở
  10/12 gap; 2 gap có Δdraws=0 (788 ms Δph=0; 867 ms Δph=0,100, Δct=0 —
  đóng băng toàn bộ nhưng Δph không đủ); 4 gap có e4skip=None ở đầu mút.
  Spread test CDP: 4/5 draws-gap có ph CDP trong gap nằm giữa hai đầu.
  CDP top gaps [867, 788, 678, 515, 465] vs worker top [826, 666, 600,
  550, 462] — cùng thang.
- Worker cross-check: 4057 tick trong lúc phát; w-gap median 10 ms max
  125 ms (worker không stall); r-gap >300 ms: 7, cả 7 có w-gap <100 ms
  (freeze thật); freeze thật max trong lúc phát 826 ms (relPlay≈77.414 ms,
  gần cuối lượt).
- Sampler: state100 median 106 ms; CDP recv-gap median 101 ms, rtt median
  88 ms; ct distinct 556.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái
  hiện.** Biên 60 s qua sạch (không gap >300 ms nào quanh relPlay
  ~60.000 ms; gap gần nhất là 422 ms tại 28,3 s và 367 ms tại 48,7 s).
- Kết luận R3: **TRONG DẢI 100%, dạng mạnh 0 gap, CDP 0 gap, stall 0.**
  Đếm lượt trong dải: 3/3; lượt có dạng mạnh: 1/3.

## 3. Gate (b) dạng mạnh — verdict (KẾT LUẬN ĐỢT M3)

- R1 (trong dải 100%, load5 median 7,70): dạng yếu 0 gap, **dạng mạnh 0**;
  CDP 0/3. Bracket gap duy nhất: 401 ms — > 300 ms.
- R2 (trong dải 100%, load5 median 4,25): dạng yếu 7 gap + **dạng mạnh 4
  gap freeze sạch** (425 / 608 / 430 / 594 ms); CDP 0/62. Bracket các gap
  dạng mạnh: 703 / 839 / 861 / 868 ms — **đều > 300 ms**.
- R3 (trong dải 100%, load5 median 4,94): dạng yếu 0 gap, **dạng mạnh 0**;
  CDP 0/12. Bracket nhỏ nhất: 499 ms — > 300 ms.
- **Kết luận đợt M3: DẠNG MẠNH QUAN SÁT ĐƯỢC Ở 1/3 LƯỢT (R2, 4 gap).**
  Tần suất gộp toàn chuỗi (bar prereg K3): **4/12 lượt** (J3 0/4 + K3 1/3 +
  L3 2/2 + M3 1/3). Theo quy tắc loại stall mới: cũng **4/12 lượt** (L3 R1
  vẫn có 2 gap freeze sau khi loại stall 2669 ms; M3 không có gap >1000 ms
  nào nên hai cách đếm trùng nhau ở đợt này). Số gap: theo chữ bar K3
  1 (K3) + 4 (L3) + 4 (M3) = 9 gap; freeze-only (loại stall): 1 + 3 + 4 =
  **8 gap**.
- **Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap cả
  3 lượt M3 — dạng mạnh KHÔNG đạt theo định nghĩa này.** Ghi rõ cả hai
  định nghĩa như prereg yêu cầu. Bracket nhỏ nhất đợt M3 là 401 ms (R1);
  các gap dạng mạnh R2 có bracket 703–868 ms. Nguyên nhân là sampler thưa
  (state100 median 89,5–199 ms thay vì 10 ms đặt; xem §8.9) — bracket đo
  khoảng cách giữa 2 mẫu state100 kẹp gap draws, nên sampler càng thưa thì
  bracket càng lớn một cách cơ học.
- **Mẫu phụ (n=8, chưa đủ để kết luận): 7/8 gap dạng mạnh freeze sạch toàn
  chuỗi đều straddle một biên clip 3 s** (K3 R2: 69,17→70,00 KHÔNG qua biên
  3 s — ngoại lệ duy nhất; L3: 12 s, 36 s, 36 s; M3 R2: 6 s, 18 s, 36 s,
  42 s). Gợi ý freeze dạng mạnh có thể tập trung ở lúc chuyển clip
  (pump/seek làm main thread bận trong lúc media clock vẫn chạy) — nhưng
  n=8 quá nhỏ, và các gap dạng yếu phân bố khắp timeline, nên chỉ ghi là
  quan sát, không kết luận. Vòng sau có thể đăng ký trước kiểm tra giả
  thuyết này trên mẫu lớn hơn.

## 4. Sampler — CDP + worker (KẾT LUẬN ĐỢT M3)

- R1: state100 median 89,5 ms (đặt 10 ms); CDP recv-gap median 79 ms, rtt
  median 58 ms; ct distinct 791; worker drain CHẠY ĐƯỢC (5508 + 110 =
  5618); worker không stall (w-gap max 76 ms); freeze thật max trong lúc
  phát: không có (ngoài tick #0).
- R2: state100 median 199 ms; CDP recv-gap median 195 ms, rtt median
  181 ms; ct distinct 301; worker drain CHẠY ĐƯỢC (3299 + 134 = 3433);
  worker không stall (w-gap max 173 ms); freeze thật max 596 ms.
- R3: state100 median 106 ms; CDP recv-gap median 101 ms, rtt median
  88 ms; ct distinct 556; worker drain CHẠY ĐƯỢC (3649 + 408 = 4057);
  worker không stall (w-gap max 125 ms); freeze thật max 826 ms.
- **draws/s dao động mạnh giữa các lượt cùng build, cùng config: R1 29,4 /
  R2 9,6 / R3 21,2.** R1 (draws/s cao nhất) chỉ có 1 gap >300 ms; R2
  (draws/s thấp nhất) có 44 gap. Tương quan này phù hợp cơ chế (draws càng
  dày thì gap càng hiếm) nhưng nguyên nhân khiến draws/s dao động 3× giữa
  các lượt chưa điều tra (có thể do độ ấm của vite/trang, sóng tải, hoặc
  hành vi của build M1 dưới tải khác nhau). Ghi là quan sát, không kết luận;
  draws/s không phải biến kiểm soát của đợt này.
- CDP-vs-worker nearest-duration: không có gap CDP đạt bar nào để đối chiếu
  ở cả 3 lượt (analyzer rev3.1 đã sửa quirk K3 §4 — in rõ dòng "không có gap
  CDP đạt bar để đối chiếu"). Bar ±50 ms vẫn chỉ có bằng chứng unit-test
  trên dữ liệu J3 (7/7 và 5/5 cặp khớp).
- CDP corroborate spread in-page tốt: R1 0/1 (chỉ 1 gap để kiểm), R2 44/44,
  R3 4/5 — CDP vẫn có giá trị giám định từng gap dù bar CDP không bắn.

## 5. Stall chuyển clip — điều tra (KẾT LUẬN ĐỢT M3)

- **Stall 5 s tại biên 60 s (K3 R3) KHÔNG tái hiện: 0/3 lượt M3.** R1 qua
  biên 60 s không có gap >300 ms nào quanh đó; R2 qua biên 60 s với gap
  lớn nhất 317 ms (dạng yếu); R3 qua biên 60 s sạch. Gộp L3+M3: **0/5 lượt**.
  Từ trước tới nay chỉ K3 R3 thấy 1 lần/8 lượt — hiện tượng hiếm/không ổn
  định, không phải hành vi hệ thống mỗi lần qua biên 60 s. Không kết luận
  "không tồn tại" — chỉ ghi "không tái hiện trong 5 lượt này (L3+M3)".
- **Stall giữa clip kiểu c15 (2669 ms, seek/decode, frame đã decode mà
  không vẽ): cũng 0/3 lượt M3.** Không có draws-gap >1000 ms nào trong cả
  3 lượt, nên không có dữ liệu mới về handoff seek→draw, và nguyên nhân
  gây seek giữa clip ở L3 R1 vẫn chưa xác định (0 pump event trong cửa sổ,
  driverActions=0 — xem L3 §5). Gộp L3+M3: 1/5 lượt có stall giữa clip.
- **Quy tắc loại stall đã áp dụng và cho kết quả trùng với đếm theo chữ bar
  ở đợt này** (không gap >1000 ms) — quy tắc chỉ phát huy tác dụng khi có
  stall; đợt này nó đóng vai trò kiểm chứng rằng đếm dạng mạnh M3 là đếm
  freeze sạch, không lẫn stall. Đối chiếu L3 theo quy tắc mới: R1 2 gap
  freeze (loại stall 2669 ms), R2 1 gap — lượt vẫn 2/2.
- driftConfirmSkips = **23 ở cả 3 lượt M3** (R1 23, R2 23, R3 23) — giống
  hệt nhau. Nhiều khả năng đây là số đếm cố định trong giai đoạn khởi động/
  warmup của probe, không phải số đo theo lượt. Ghi là quan sát; không dùng
  driftConfirmSkips để so sánh các lượt M3 với nhau.

## 6. Quyết bar CDP (ĐỀ XUẤT — ĐIỀU KIỆN CHỮ prereg §6 THỎA MÃN)

- Dữ liệu đợt này: CDP 0/3 lượt trong dải (R1 0/3, R2 0/62, R3 0/12
  recv-gap). Cả 3 lượt M3 đều trong dải chặt (100% snap) nên điều kiện chữ
  trong prereg-m3 §6 ("CDP 0/3 lượt trong dải đợt này") **thỏa mãn theo
  đúng chữ — lần đầu tiên kể từ khi quy tắc được đặt ra** (L3 không thỏa
  theo đúng chữ vì chỉ có 2 lượt).
- Gộp: dải chặt K3 0/3 + L3 0/1 + M3 0/3 = **0/7 lượt**; gộp mọi lượt
  K3 0/3 + L3 0/2 + M3 0/3 = **0/8 lượt**. Trái với J3 dưới tải nặng
  (12 gap CDP đạt bar ở R0/R1, load5 ~10).
- Ràng buộc chặn giống hệt K3/L3: Δdraws 2–5 ở tải vừa (R1 2/3 gap, R2
  60/62 gap, R3 10/12 gap có Δdraws 2–4); các gap có Δdraws=0 đều có Δph
  quá nhỏ (R1: 378 ms Δph=0; R2: 584 ms Δph=0, 401 ms Δph=0,167; R3:
  788 ms Δph=0, 867 ms Δph=0,100) — đóng băng toàn bộ nhưng ph không tiến
  đủ, bị loại đúng. Bar CDP đòi draws đóng băng HOÀN TOÀN trong freeze —
  ở tải vừa freeze chỉ làm draws chậm lại chứ không dừng hẳn, nên bar
  không bao giờ bắn.
- **ĐỀ XUẤT: BỎ bar CDP làm bar song song.** Giữ in-page làm bar chính; giữ
  CDP làm công cụ giám định từng gap (đọc giá trị ph trung gian, xác nhận
  drawsTotal đứng yên — như R2: CDP corroborate spread 44/44 gap). Lý do:
  bar kém nhạy ở tải vừa (0/7 lượt dải chặt), không phải gate (b) vắng mặt
  (in-page thấy dạng mạnh 1/3 lượt M3 trong khi CDP 0/3; toàn chuỗi 4/12
  lượt in-page vs 0/8 lượt CDP).
- Đây là ĐỀ XUẤT có lý do, dựa trên điều kiện chữ đã thỏa mãn — verify/
  parent quyết cuối, không phải kết luận đóng hẳn. Nếu parent giữ bar CDP
  thì cần đăng ký trước ngưỡng Δdraws nới lỏng (vd Δdraws ≤ 5 thay vì == 0)
  và chạy lại, không sửa bar sau khi đã thấy dữ liệu.

## 7. Reboot / build-identity / điều kiện tải

- Boot #40 = 2026-11-14 05:16:36Z (boot_id 73316ed9-3823-4512-a52d-3cc5d455a6fd)
  suốt cả đợt M3 — không reboot trong lúc đo. Gap #39→#40 = 2h25'48"
  (02:50:48Z → 05:16:36Z) — KHÔNG phá sàn 19'07" (khoảng đã chứng nhận
  [19'07", 3h14'08"], xem L9 §0.1).
- **Build-identity đổi giữa prereg và R1 (caveat bắt buộc):** prereg-m3 viết
  05:42Z ghi preview.tsx md5 `9b27abe5…` (bản L1-fix). M1 (luồng
  round111-m1) sửa production lúc **05:46:19Z**: preview.tsx →
  `c4198206cb916c0f1c6d8996330335a1` (441.338 byte, trước đó 439.893 byte),
  + `apps/web/src/lib/playheadHold90R2.ts` (6721b982…) +
  `playheadHold90R2.test.ts` (d535e814…). Nội dung sửa (theo
  round111-m1-status.md): `nextResumeGraceTail97Y4` đóng đuôi khi ended +
  ct>=duration−0,1s (endedClosed), preview.tsx nối wiring + hook
  `__vcutTailEndedClosed111M1`; unit test 84 passed (75 cũ + 9 mới), tsc 0,
  vite build pass. Cả 3 lượt M3 chạy trên **c4198206**, md5 ổn định
  trước/sau mỗi lượt (mtimeChanged=false cả 3 lượt).
  Đánh giá ảnh hưởng tới gate (b): M1 tự báo nhánh mới **chưa từng chạy
  live** trong A/B 2+2 của họ (ended không bao giờ đúng, 0 ended-close
  trong 4 lượt; CAP m1f4 do cơ chế khác) — nên khả năng cao sửa đổi này
  không thay đổi hành vi đường freeze/draw trong các lượt M3. Nhưng đây là
  suy luận từ báo cáo của M1, không phải đo trực tiếp của M3: **chuỗi
  J3/K3/L3 chạy trên ced42efd/9b27abe5, M3 chạy trên c4198206 — so sánh
  tần suất gộp qua các đợt mang caveat build khác nhau.** Vòng sau nên
  đăng ký trước build baseline cố định cho cả đợt (đóng băng preview.tsx
  trong lúc đo) nếu muốn so sánh tần suất sạch.
- Điều kiện tải tóm tắt: R1 load5 median 7,70 (16/16 snap — suy giảm sau
  sóng M7: load1 tới 37,23 lúc 06:18:51Z); R2 load5 median 4,25 (16/16 —
  sóng tan dần 4,81 → 3,74); R3 load5 median 4,94 (15/15 — ổn định
  4,74 → 5,04). Nguồn sóng: M7 dial hog + vite/chromium sibling; không đổ
  cho sibling cụ thể nào ngoài những gì log ghi (M7 load 37,23 lúc
  06:18:51Z là số đo từ log M7).
- RAM khả dụng lúc phát: R1 1103 MB, R2 1951 MB, R3 1136 MB. Không OOM,
  không ENOSPC lượt nào (vite dùng workaround server.watch.ignored
  ["**/**"], 0 inotify FD — probe config kế thừa L3).
- Vite lock (xem §8.10): R1 lần 1 BLOCKED sau 20 phút (M7 giữ lock
  05:51:36–06:18:51Z, các lượt r64–r68); sau khi đổi poll 60 s → 5 s, R1
  lần 3 lấy lock sau 45 s; R2/R3 lấy ngay 0 s. Lock đi qua M7 → M1 →
  M5 → M8 → M5 trong đợt. Không còn vite mồ côi của M3 sau khi xong
  (cổng 5590 down, holder-pids rỗng, không còn hog python/yes của M3).

## 8. Giới hạn và caveat (trung thực, gộp — KẾT LUẬN ĐỢT M3)

1. **Dạng mạnh chỉ 4 gap trong 3 lượt M3 (1/3 lượt)** — tần suất gộp 4/12
   lượt toàn chuỗi vẫn thấp; chỉ khẳng định "đã quan sát được và lặp lại
   được", không khẳng định "thường xuyên" hay ước lượng tỷ lệ. Muốn ước
   lượng tỷ lệ cần nhiều lượt hơn.
2. **Build-identity đổi giữa prereg và R1** (9b27abe5 → c4198206 do M1 sửa
   05:46:19Z, xem §7) — các lượt M3 chạy trên build khác với J3/K3/L3.
   Nhánh mới của M1 chưa từng chạy live theo M1 nên khả năng cao không
   ảnh hưởng gate (b), nhưng đây là suy luận từ báo cáo M1, không phải đo
   trực tiếp của M3. So sánh tần suất gộp qua các đợt mang caveat này.
3. Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap cả
   3 lượt (bracket nhỏ nhất 401 ms). Theo bar prereg K3 (không yêu cầu
   bracket): 4 gap. Người đọc dùng định nghĩa nào cũng tự đánh giá được —
   ghi rõ cả hai, không giấu. Bracket bị thổi phồng một cách cơ học bởi
   sampler thưa (§8.9).
4. Stall 5 s biên 60 s không tái hiện trong 3 lượt (gộp L3+M3: 0/5) —
   không kết luận "không tồn tại"; stall giữa clip kiểu c15 cũng 0/3 lượt
   (gộp 1/5) — nguyên nhân gây seek giữa clip ở L3 R1 vẫn chưa xác định.
5. Holder python/node/yes spin không dial được load5 vào [3,8] khi máy yên
   (§1.2) — dải tải đợt này được giữ bằng sóng ambient, không phải dial độc
   lập. **Không được nói "holder giữ được dải".** Nợ "dial độc lập" vẫn mở,
   nay có bằng chứng sạch nhất từ trước (E4 yes ×10).
6. `preview.tsx` không đổi trong lúc đo của M3 (md5 `c4198206…` trước = sau
   cả 3 lượt, mtimeChanged=false) — build-identity ổn định TRONG đợt M3
   (chỉ đổi TRƯỚC R1, xem §7).
7. CDP rtt lớn trong các cửa sổ gap lớn (R3: rtt max 855 ms, CDP recv-gap
   max 867 ms) — CDP sampler tự nó bị kẹt trong freeze, không chỉ đo
   freeze. Không dùng rtt CDP làm số đo độ dài freeze; chỉ dùng draws-gap
   + worker r-gap.
8. **Sampler thưa** (state100 median 89,5 ms R1 / 199 ms R2 / 106 ms R3
   thay vì 10 ms đặt; CDP median 79/195/101 ms) — distinct_strict bị đếm
   thiếu và bracket bị thổi phồng một cách cơ học. Dạng mạnh quan sát được
   DÙ sampler thưa nên bằng chứng mạnh hơn, không yếu hơn; nhưng số gap
   tuyệt đối không so được trực tiếp giữa các lượt (draws/s R1 29,4 vs R2
   9,6 vs R3 21,2 — dao động 3× chưa rõ nguyên nhân, xem §4).
9. **draws/s dao động 3× giữa các lượt** (29,4 / 9,6 / 21,2) cùng build,
   cùng config — nguyên nhân chưa điều tra. R1 draws/s cao nhất thì chỉ có
   1 gap; R2 draws/s thấp nhất thì có 44 gap. Không kết luận quan hệ nhân
   quả; draws/s không phải biến kiểm soát đợt này.
10. driftConfirmSkips = 23 ở cả 3 lượt — nhiều khả năng là số đếm cố định
    giai đoạn khởi động, không dùng để so sánh các lượt.
11. **Vite lock:** R1 lần 1 BLOCKED sau 20 phút chờ (M7 giữ lock suốt);
    đã đổi poll lock 60 s → 5 s giữa đợt (cùng protocol mkdir nguyên tử +
    owner; chỉ tăng tần suất thăm dò — khe hở giữa các lượt chỉ vài giây
    nên poll 60 s không bao giờ thắng). Thay đổi này được ghi rõ ở đây và
    trong m3-progress.log; vòng sau nên chuẩn hóa poll nhanh + ghi owner
    đầy đủ cho mọi driver. Lúc kill driver R1 lần 2 đang chờ, phải kill
    đúng pid run-m3.sh (không phải pid wrapper) — lần đầu kill nhầm wrapper
    để lại orphan 30349, đã kill lại và xác nhận chỉ còn 1 driver.
12. Lỗi cột hogN/hogCPU% trong load-test (luôn 0, xem §1.2) — chỉ hỏng cột
    phụ; kết luận tải dựa trên load1/load5/procs + ps trực tiếp.
13. Không đo thêm kill (đã ĐÓNG từ K3). Không sửa production.
14. Analyzer rev3.1 tái dùng nguyên vẹn — quirk hiển thị ph 2 chữ số thập
    phân (K3 §8.7) vẫn còn, không ảnh hưởng verdict.

## 9. Nợ mở (cho đợt sau)

1. Gate (b) dạng mạnh — **M3: 1/3 lượt (R2, 4 gap freeze sạch).** Còn mở:
   (a) tần suất vẫn thấp (4/12 lượt toàn chuỗi) — muốn ước lượng tỷ lệ cần
   nhiều lượt hơn; (b) quyết bar CDP (ĐỀ XUẤT BỎ làm bar song song, §6 —
   điều kiện chữ đã thỏa, chờ verify/parent quyết); (c) quy tắc loại stall
   >1000 ms đã đăng ký + áp dụng xong đợt này (không đổi số đếm M3; đã
   đối chiếu lại L3: 4 gap → 3 gap freeze, lượt vẫn 2/2) — giữ quy tắc này
   cho các đợt sau; (d) 7/8 gap freeze sạch toàn chuỗi straddle biên clip
   3 s — cần mẫu lớn hơn + đăng ký trước để kiểm tra giả thuyết freeze tập
   trung ở chuyển clip; (e) draws/s dao động 3× giữa các lượt chưa rõ
   nguyên nhân (§8.9).
2. Stall chuyển clip — **5 s biên 60 s KHÔNG tái hiện (0/3 lượt M3, gộp
   0/5 với L3); stall giữa clip kiểu c15 cũng 0/3 lượt.** Còn mở: (a)
   nguyên nhân gây seek giữa clip khi không có driver action (L3 R1);
   (b) handoff seek→draw (vẽ frame cuối đã decode trong lúc seeking?);
   (c) drift-confirm bắn 61 lần trong stall L3 R1 — triệu chứng hay hệ quả.
3. Bộ tạo tải — **dial độc lập vẫn mở, nay có bằng chứng sạch nhất:**
   busy-loop (node/python/yes, N=3/6/10, cả 40 hog của M7) không nâng được
   loadavg khi máy yên; I/O D-state không tạo được D-state bền. Vòng sau
   cần phương án khác (vite/Chromium nền làm tải thật, hoặc chấp nhận dải
   ambient + ghi rõ nguồn tải từng lượt). Sửa pattern đo hogN/hogCPU%
   trước khi chạy lại load-test.
4. Sampler thưa (state100 median 89,5–199 ms thay vì 10 ms) — nguyên nhân
   chưa điều tra; ảnh hưởng đếm distinct_strict và bracket (§8.8).
5. Build baseline: vòng sau nên đăng ký trước build cố định cho cả đợt
   (đóng băng preview.tsx trong lúc đo) để so sánh tần suất sạch — đợt M3
   bị M1 đổi build giữa prereg và R1 (§7).
6. Nợ đứng yên đợt 109/110/111 (xem LIMITS gộp đợt 110 §4 và K3 §9): G1 +
   mù #22 chờ user quyết, E4 + A/B xác nhận (M1 đợt 111: KHÔNG ĐÓNG, 1 CAP
   mới, xem round111-m1-status.md), E6 ĐÃ ĐÓNG (L4), EPERM probe #30 + mù
   #29, F6' ĐÃ ĐÓNG (L7), ENOSPC vite nối tiếp bắt buộc, WebKit sau reboot,
   birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security.yml 403, release gate —
   không thuộc M3.

## 10. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Prereg M3 (viết TRƯỚC khi đo) | Quy tắc loại stall §2 + điều kiện chữ CDP §6 + bar K3 + bracket J3 | `hidden_files/round111-m3/prereg-m3.md` |
| Analyzer rev3.1 trên dữ liệu M3 | R1 in-page 0 / trusted 0 / distinct≥2 = 0; R2 11 / 10 / 4; R3 0 / 0 / 0 | §2.1–2.3; `chr-mixedalt-m3r*-fr4-analysis.txt` |
| Probe rev M3 | copy probe110l3, chỉ đổi đường dẫn (diff đã kiểm); ring 8000 (không tràn); CDP vd diag; vite watch.ignored; marker play-done | `apps/web/scripts/probe111m3-frame-parity.mjs` |
| Build identity (trong lúc đo) | preview.tsx md5 `c4198206cb916c0f1c6d8996330335a1` trước = sau cả 3 lượt (M1-fix; prereg ghi 9b27abe5, đổi 05:46:19Z trước R1) | §2.1–2.3; §7; `round111-m1/md5-fixed.txt` |
| R1 | Trong dải 100% (7,70; 16/16); dạng mạnh 0; CDP 0/3; stall 0 | §2.1 |
| R2 | Trong dải 100% (4,25; 16/16); dạng mạnh 4 (freeze sạch, qua biên 6/18/36/42 s); CDP 0/62; stall 0 | §2.2 |
| R3 | Trong dải 100% (4,94; 15/15); dạng mạnh 0; CDP 0/12; stall 0 | §2.3 |
| Load-test | yes ×6 nhiễm sóng; yes ×10 THẤT BẠI sạch (2,36→1,02); python N=3/N=10 không đọc được; D fail (pb~0) | §1.2; `load-test-m3.txt` (63 mẫu) |
| Quyết CDP | Điều kiện chữ 0/3 lượt trong dải THỎA MÃN → đề xuất BỎ bar CDP; gộp dải chặt 0/7, mọi lượt 0/8 | §6 |
| Reboot #40 | 2026-11-14 05:16:36Z, boot_id 73316ed9…; gap #39→#40 = 2h25'48" (không phá sàn 19'07"); không reboot trong lúc đo | `uptime -s` trực tiếp; §7 |
| Vite/ENOSPC | 0 ENOSPC; R1 lần 1 BLOCKED 20 phút (M7 giữ lock); poll 60 s → 5 s, R1 lần 3 lấy lock sau 45 s, R2/R3 0 s; không vite mồ côi M3 | driver-m3.log; §7–§8 |
| Tần suất gộp | Dạng mạnh 4/12 lượt (J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3); freeze-only cũng 4/12; bracket J3 0 gap | §3 |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round111-m3-zombie.txt`
— chứa LIMITS này + `apps/web/scripts/probe111m3-frame-parity.mjs` (2 file text).

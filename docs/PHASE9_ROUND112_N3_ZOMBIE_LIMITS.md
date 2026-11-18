# PHASE9_ROUND112_N3_ZOMBIE_LIMITS — Zombie gate (b): kiểm tra giả thuyết freeze ở chuyển clip + kiểm chứng quyết bỏ bar CDP

> Luồng N3, đợt 112. Lượt cron 15:35 +07 14/11/2026 (bắt đầu 08:51Z, xong
> 09:49Z). Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG
> release/tag. Không sửa production** — chỉ probe mới
> (`probe112n3-frame-parity.mjs`, copy probe111m3 chỉ đổi đường dẫn scratch)
> + classifier mới (`classify-n3.py`, chỉ đọc file phân tích có sẵn, không đo
> mới). Prereg (viết TRƯỚC khi đo): `hidden_files/round112-n3/prereg-n3.md`
> + addendum `addendum-prereg-n3.md` (đổi build giữa R1 và R2).
> Dữ liệu thô: `hidden_files/round112-n3/` (prereg, addendum, classifier,
> driver-n3.log, 3 lượt probe + analysis, run-n3.sh, load-holder-n3.sh,
> n3-progress.log).
>
> **HOÀN THÀNH ĐẦY ĐỦ:** 3/3 lượt probe trong dải 100% + kiểm chứng CDP độc
> lập từ dữ liệu thô + kiểm định giả thuyết chuyển clip theo đúng quy tắc
> đăng ký trước (kết quả: CHƯA ĐỦ MẪU, không kết luận — như kỳ vọng đã ghi
> trong prereg).

## 0. Tóm tắt

- **Dạng mạnh: 1/3 lượt N3 (R1, 2 gap freeze sạch).** R2 0 gap (không có cả
  draws-gap >300 ms nào), R3 0 gap (không có cả draws-gap >300 ms nào).
  Tần suất gộp toàn chuỗi (bar prereg K3, loại stall): J3 0/4 + K3 1/3 + L3
  2/2 + M3 1/3 + N3 1/3 = **5/15 lượt**. Theo quy tắc loại stall: cũng 5/15
  (không có gap >1000 ms nào trong cả 3 lượt N3). Theo định nghĩa bracket cũ
  J3 (bracket ≤ 300 ms): **0 gap** cả 3 lượt (bracket 2 gap dạng mạnh R1 là
  1102/766 ms; R2/R3 không có gap nào để đo bracket).
- **Giả thuyết chuyển clip: KHÔNG KẾT LUẬN (chưa đủ mẫu — đúng như kỳ vọng
  đăng ký trước).** Gap freeze sạch MỚI của N3: 2 gap, cả 2 đều straddle biên
  clip (R1: 5,00→6,20 qua biên 6 s; 11,53→12,13 qua biên 12 s), p
  Poisson-binomial một phía = 0,0149, p cố định 0,25 = 0,0625 — NHƯNG n=2 <
  5 theo quy tắc prereg §3.2 nên KHÔNG xác nhận. Gộp mô tả (kèm caveat
  double-dip): 8 gap cũ + 2 gap mới = **9/10 gap straddle**.
- **CDP bar: 0/3 lượt trong dải đợt này (R1 0/11, R2 0/3, R3 0/3 recv-gap) —
  falsifier đăng ký trước KHÔNG kích hoạt → ĐỒNG Ý với đề xuất bỏ bar CDP
  của M3 vẫn đứng** (giữ in-page làm bar chính + CDP giám định từng gap).
  Gộp dải chặt: K3 0/3 + L3 0/1 + M3 0/3 + N3 0/3 = **0/10 lượt**; gộp mọi
  lượt: 0/11 lượt.
- **Stall chuyển clip 5 s biên 60 s: KHÔNG tái hiện 0/3 lượt N3** (gộp
  L3+M3+N3: 0/8). **Stall giữa clip kiểu c15: cũng 0/3 lượt N3** (gộp
  L3+M3+N3: 1/8 lượt — chỉ L3 R1). Không có draws-gap >1000 ms nào trong cả
  3 lượt N3.
- **Build-identity đổi giữa R1 và R2** (N1 sửa production 09:08:07Z:
  preview.tsx c4198206 → 03bf029f, +1335 byte, hook tail-steady-closed).
  R1 chạy trên c4198206; R2/R3 chạy trên 03bf029f ổn định (md5 trước = sau
  cả 2 lượt). Xử lý theo tiền lệ M3 + addendum: giữ R2 làm lượt 1 trên
  baseline mới (không giết giữa chừng — chạy lại trên cùng build mới không
  làm sạch thêm gì). Mọi đếm gộp qua các đợt mang caveat build khác nhau.
- **Reboot #43 ≈ 08:54Z thực** giết lượt R1 lần 1 trong lúc WAIT-BAND (chưa
  đo gì, không mất dữ liệu); chạy lại từ đầu, vẫn đủ 3 lượt trong hạn.
- Vite lock: R1 lần 2 lấy lock 09:00:49Z (lock mồ côi N5 biến mất trước tuổi
  stale 30 phút — do phía khác dọn, N3 không xóa tay); R2 chờ N5 09:06:18Z
  tới 09:22:26Z; R3 chờ N5 09:33:44Z tới 09:43:21Z. Không ENOSPC, không vite
  mồ côi của N3 sau khi xong (cổng 5590 down, holder-pids rỗng).

## 1. Phương pháp và điều kiện chạy

### 1.1 Bar dạng mạnh + quy tắc loại stall + quyết bracket (prereg-n3 §2)

- Dạng mạnh = ≥1 gap đạt bar J3 (skips>0 + spread G2 in-page, hoặc bản CDP:
  recv-gap >300 ms + Δe4skip>0 + Δph ≥ 0,7×gap + drawsTotal không đổi) VÀ
  distinct_strict ≥ 2. Trusted (rev3): n_inside ≥ 2.
- **Quy tắc loại stall (giữ nguyên):** mọi draws-gap duration **>1000 ms**
  phân loại STALL, **LOẠI KHỎI đếm dạng mạnh** (cả đếm gap lẫn đếm lượt);
  báo cáo riêng kèm phân tầng. Đếm dạng mạnh N3 chỉ tính gap ≤1000 ms.
  Mỗi lượt báo cáo CẢ HAI số (đúng chữ bar K3 + loại stall).
- **Bracket J3 ≤300 ms: GIỮ NGUYÊN companion-only, KHÔNG nới** (đăng ký
  trước, prereg-n3 §2): chỉ báo cáo kèm, KHÔNG phải điều kiện loại. R1 có
  bracket 1102/766 ms cho 2 gap dạng mạnh; R2/R3 không có gap nào. Không đổi
  ngưỡng sau khi thấy số.
- Luật loại lượt (giữ K3 §3): lượt bị LOẠI khỏi bar dạng mạnh nếu <50%
  snapshot trong cửa sổ đo có load5 ∈ [3, 8]; "trong dải" nếu load5 median
  ∈ [3, 8] VÀ ≥80% snapshot trong dải; 50–80% là "ngoài dải nhưng không loại".
- Probe probe112n3-frame-parity.mjs: copy probe111m3, CHỈ đổi đường dẫn
  scratch round111-m3 → round112-n3, CFG_DIR /tmp/round111-m3 →
  /tmp/round112-n3, tên driver global __vcut111m3Drv → __vcut112n3Drv
  (diff đã kiểm: chỉ các dòng đó + dòng tiêu đề; `node --check` OK). Mọi
  logic đo giữ nguyên: CDP vd diag, ring draws + mainDraws 8000, vite
  watch.ignored ["**/**"], marker play-done, sampler/state100/spec 24 clip
  scroll-mixed-alt, freeze-run, band-wait 300 s. Analyzer rev3.1 tái dùng
  nguyên vẹn (`round110-l3/round110-l3-analyze.py`).
- Classifier mới `classify-n3.py` (chỉ đọc file phân tích có sẵn, không đo
  mới): phân loại straddle (ph0 < 3k < ph1, nghiêm ngặt), p-value
  Poisson-binomial với p0_i = duration/3 từng gap (+ biến thể bảo thủ p0 cố
  định 0,25), kiểm chứng CDP độc lập từ các dòng §4. Đã kiểm thử trên dữ
  liệu cũ trước khi dùng: M3 R2 cho đúng 4 gap (biên 6/18/36/42),
  p=0,000815; gộp K3+L3+M3 cho đúng 8 gap, 7 straddle; CDP recount khớp
  analyzer ở mọi file đã thử (K3/L3/M3/N3).
- Phân tầng stall (giữ L3 §4): seeking=true và/hoặc readyState < 3 trong lúc
  ph đỗ → seek/decode; seeking=false, readyState=4, decodedFrameCount đứng
  yên, drawsTotal đứng yên → draw-pipeline; decodedFrameCount vẫn tăng trong
  lúc ph đỗ → lớp playhead/tick (handoff seek→draw). Luôn đối chiếu worker
  r-gap max, pump decisions, biên clip, driftConfirmSkips, CDP vd trước/sau.
- Phối hợp vite: lock qua BẢN COPY ĐÓNG BĂNG của script chuẩn
  vcut-vite-lock.sh (md5 fd21193c5b4b7ba1769bb16fd5482984, khớp gốc lúc đóng
  băng); acquire `n3` port danh nghĩa 5590 (probe tự pickFreePort 5590–5599),
  timeout 1200 s, poll 5 s (VITE_LOCK_POLL_S=5); owner pid = pid driver; nhả
  lock khi xong (trap EXIT); chờ ≥15 s sau khi nhả trước khi giữ lại. Vite
  tạm dùng server.watch.ignored ["**/**"] (0 watch). Kill vite theo pid node
  thật, kiểm ps + curl sau khi kill (probe tự kill vite trong finally; driver
  kiểm lại các cổng 5590–5599 sau lượt).
- Holder (load-holder-n3.sh, kế thừa M3): python N khởi điểm 4, max 8, điều
  chỉnh theo load1 + chốt load5 > 8 → −1 ngay; giết ngay khi marker play-done
  xuất hiện. Dial đã biết thất bại — dải (nếu có) nhờ sóng ambient, KHÔNG
  nói holder giữ được dải.
- KHÔNG đo thêm kill. KHÔNG sửa production. KHÔNG push / release / tag.
  CẤM kiểm lại TTS 39 (không kiểm). Birefnet không thử (RAM chưa đổi).

### 1.2 Kiểm chứng CDP độc lập (prereg-n3 §5 — làm TRƯỚC khi chạy probe mới)

- Phương pháp: tính lại từ DỮ LIỆU THÔ (file *-analysis.txt của analyzer
  rev3.1), không tin mù LIMITS. Classifier đếm lại độc lập từ từng dòng §4.
- M3 (tính lại): R1 0/3, R2 0/62, R3 0/12 — cả 3 lượt trong dải 100% → điều
  kiện chữ prereg-m3 §6 THỎA MÃN theo đúng chữ. KHỚP LIMITS M3.
- K3 (tính lại từ round109-k3/*-analysis.txt): R1 0/23 (15/16, 7,21), R2
  0/60 (16/16, 5,16), R3 0/2 (18/18, 4,87) — cả 3 lượt trong dải chặt.
  KHỚP K3 LIMITS.
- L3 (tính lại từ round110-l3/*-analysis.txt): R1 0/28 (16/16, 4,36) trong
  dải; R2 0/37 (10/16 = 62% — NGOÀI DẢI nhưng không loại, median 3,12).
  KHỚP L3.
- Gộp dải chặt tới trước N3: K3 0/3 + L3 0/1 + M3 0/3 = **0/7 lượt** — KHỚP
  M3 LIMITS §6. Gộp mọi lượt: 0/8 lượt — KHỚP.
- **Verdict N3: ĐỒNG Ý với đề xuất bỏ bar CDP làm bar song song** (giữ
  in-page làm bar chính + CDP giám định từng gap). Lý do có bằng chứng: (i)
  điều kiện chữ thỏa mãn theo đúng chữ, xác nhận từ dữ liệu thô; (ii) 0/7
  lượt trong dải chặt qua 3 đợt độc lập, 0/8 mọi lượt; (iii) ràng buộc chặn
  giống hệt cả 3 đợt (Δdraws 2–5 ở tải vừa; mọi gap Δdraws=0 đều có Δph quá
  nhỏ nên bị loại đúng); (iv) in-page thấy dạng mạnh 4/12 lượt trong khi CDP
  0/8 — bar kém nhạy ở tải vừa, không phải gate (b) vắng mặt. Quyết cuối
  thuộc parent. Falsifier đăng ký trước (CDP bắn ≥1 gap trong dải ở lượt N3)
  KHÔNG kích hoạt (xem §2: N3 CDP 0/3 lượt) → sự đồng ý vẫn đứng.

## 2. Kết quả từng lượt

### 2.1 R1 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 2 GAP

- Thời gian: lần 1 bị reboot #43 giết trong lúc WAIT-BAND (chưa đo gì —
  xem §7); lần 2 (detached) lấy lock 09:00:49Z; WAIT-BAND 165 s (load5 rơi
  vào 3,00); phát 09:03:35–09:06:12Z; phân tích xong 09:06:13Z. Exit=0.
  Boot #43 suốt lượt (không reboot thêm).
- Điều kiện: load lúc phát 11,76/4,68; load5 trong lúc phát 4,68 → 6,14
  (15 snap, median 5,70; **15/15 = 100% trong [3, 8]**); procs_running
  median 7 (2–16); draws/s median 30,6 (draws/5s 2 → 501, tăng dần);
  RAM khả dụng lúc phát 951 MB. preview.tsx md5 `c4198206…` trước = sau,
  mtimeChanged=false (baseline cũ — N1 chưa sửa lúc này).
- Dữ liệu: caps 1020, drawsTotal 2976 (drawsKept 2976 — ring 8000 KHÔNG
  tràn), mainDraws 1281, state100 994 mẫu, CDP 1273 mẫu (0 lỗi),
  workerTicks gộp 5071 (drained + tail), pumpN 460, driftConfirmSkips 23,
  seekSkipTicks 44, pageErrs 0. results.json 73.898.554 byte.
- Gate (b) in-page: **6 draws-gap >300 ms; 3 gap đạt bar** (skips>0 +
  spread), trusted 3, **distinct_strict ≥ 2 = 2**. Hai gap dạng mạnh (đều là
  freeze sạch, đều ≤1000 ms nên quy tắc loại stall không đổi số đếm):
  1. 337 ms relPlay [7269, 7606] ph 5,00→6,20 skips=1 inside [5,867, 6,1,
     6,2, 6,2] distinct=2 bracket=1102 ms trusted — **freeze sạch** (qua
     biên clip 6 s).
  2. 398 ms relPlay [13792, 14190] ph 11,53→12,13 skips=1 inside [11,833,
     12,033, 12,133, 12,133, 12,133] distinct=2 bracket=766 ms trusted —
     **freeze sạch** (qua biên clip 12 s).
  Gap đạt bar còn lại: 314 ms ph 17,87→18,17 distinct=1 (dạng yếu, cũng
  straddle biên 18 s). 2 gap có skips=None, 1 gap skips=0.
- Gate (b) CDP: **0/11** recv-gap đạt bar (classifier đếm lại độc lập: 0,
  khớp analyzer). CDP top gaps [1175, 656, 422, 417, 394] — gap 1175 ms là
  CDP sampler tự kẹt (draws-gap lớn nhất chỉ 420 ms), không phải freeze
  dài. Spread test CDP: 6/6 draws-gap có ph CDP trong gap nằm giữa hai đầu.
- Worker cross-check: 5071 tick trong lúc phát; w-gap median 10 ms max
  117 ms (worker không stall); r-gap >300 ms: 9, cả 9 có w-gap <100 ms
  (freeze thật); freeze thật max trong lúc phát 398 ms.
- Sampler: state100 median 53 ms (dày nhất trong chuỗi J3–N3 tới nay);
  CDP recv-gap median 34 ms, rtt median 21 ms (max 1113 ms);
  ct distinct 978. Bracket 2 gap dạng mạnh: 1102/766 ms — đều > 300 ms.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái hiện.**
  Biên 60 s qua với gap lớn nhất quanh đó < 300 ms (không có gap >300 ms
  nào sau relPlay 20.690 ms).
- Kết luận R1: **TRONG DẢI 100%, dạng mạnh QUAN SÁT ĐƯỢC (2 gap freeze
  sạch), CDP 0 gap, stall 0.** Đếm lượt trong dải: 1/1; lượt có dạng mạnh: 1/1.

### 2.2 R2 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 0 GAP

- Thời gian: vite-lock 09:22:26Z (chờ N5 từ 09:08Z); WAIT-BAND đủ 300 s
  (load5 29,76 → 11,67, chưa vào dải trong lúc chờ driver); probe band-wait
  thêm 110 s → load5 7,98; phát 09:29:34–09:31:31Z; phân tích xong
  09:31:33Z. Exit=0. Boot #43 suốt lượt.
- Điều kiện: load lúc phát 1,41/7,98; load5 trong lúc phát 7,98 → 7,72
  (16 snap, median 7,85; **16/16 = 100% trong [3, 8]**); procs_running
  median 7 (2–15); draws/s median 32,4 (draws/5s
  0 → 369); RAM khả dụng lúc phát 1342 MB. preview.tsx md5 `03bf029f…`
  trước = sau, mtimeChanged=false (baseline MỚI — N1-fix, xem §7).
- Dữ liệu: caps 1043, drawsTotal 2945 (drawsKept 2945 — ring 8000 KHÔNG
  tràn), mainDraws 1290, state100 1093 mẫu, CDP 1273 mẫu (0 lỗi),
  workerTicks gộp 5066, pumpN 470, driftConfirmSkips 23, seekSkipTicks 89,
  pageErrs 0. results.json 74.435.829 byte.
- Gate (b) in-page: **0 draws-gap >300 ms trong cả lượt** — không có gap
  nào để đạt bar. distinct_strict ≥ 2 = 0. Theo quy tắc loại stall: cũng 0.
  Theo bracket cũ J3: 0 (không có gap).
- Gate (b) CDP: **0/3** recv-gap đạt bar (763 ms Δph=0, Δdraws=0,
  Δe4skip=None; 392 ms Δdraws=7; 317 ms Δdraws=4 — đều bị loại đúng).
  Classifier đếm lại độc lập: 0, khớp analyzer.
- Worker cross-check: 5066 tick trong lúc phát; w-gap median 10 ms max
  79 ms (worker không stall); r-gap >300 ms: 1 (314 ms, w-gap cùng cặp
  <100 ms — freeze thật nhưng draws không gap >300 ms: main thread đỗ
  ~314 ms mà draws vẫn chảy); freeze thật max trong lúc phát 314 ms.
- Sampler: state100 median 74 ms; CDP recv-gap median 65 ms.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái hiện.**
- Kết luận R2: **TRONG DẢI 100%, dạng mạnh 0 gap, CDP 0 gap, stall 0.**
  Đếm lượt trong dải: 2/2; lượt có dạng mạnh: 1/2.

### 2.3 R3 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 0 GAP

- Thời gian: vite-lock 09:43:21Z (chờ N5 từ 09:35Z); WAIT-BAND 165 s
  (load5 12,76 → 7,84); probe band-wait 0 s (load5 7,80 đã trong dải);
  phát 09:46:28–09:48:15Z; phân tích xong 09:48:16Z. Exit=0. Boot #43
  suốt lượt.
- Điều kiện: load lúc phát 3,04/7,80; load5 trong lúc phát 7,80 → 7,47
  (16 snap, median 7,72; **16/16 = 100% trong [3, 8]**); procs_running
  median 6 (3–12); draws/s median 22,1 (draws/5s
  0 → 149); RAM khả dụng lúc phát 1321 MB. preview.tsx md5 `03bf029f…`
  trước = sau, mtimeChanged=false (baseline mới, ổn định).
- Dữ liệu: caps 727, drawsTotal 1760 (drawsKept 1760 — ring 8000 KHÔNG
  tràn), mainDraws 761, state100 684 mẫu, CDP 774 mẫu (0 lỗi),
  workerTicks gộp 3928, pumpN 304, driftConfirmSkips 23, seekSkipTicks 38,
  pageErrs 0. results.json 51.902.075 byte.
- Gate (b) in-page: **0 draws-gap >300 ms trong cả lượt** — không có gap
  nào để đạt bar. distinct_strict ≥ 2 = 0. Theo quy tắc loại stall: cũng 0.
  Theo bracket cũ J3: 0 (không có gap).
- Gate (b) CDP: **0/3** recv-gap đạt bar (343 ms Δph=0, Δdraws=0,
  Δe4skip=None; 308 ms Δdraws=2; 307 ms Δdraws=2). Classifier đếm lại độc
  lập: 0, khớp analyzer. CDP top gaps [343, 308, 307].
- Worker cross-check: 3928 tick trong lúc phát; w-gap median 10 ms max
  94 ms (worker không stall); r-gap >300 ms: 0; freeze thật max trong lúc
  phát 279 ms (r-gap max).
- Sampler: state100 median 104 ms; CDP recv-gap median 96,5 ms.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái hiện.**
- Kết luận R3: **TRONG DẢI 100%, dạng mạnh 0 gap, CDP 0 gap, stall 0.**
  Đếm lượt trong dải: 3/3; lượt có dạng mạnh: 1/3.

## 3. Gate (b) dạng mạnh — verdict (KẾT LUẬN ĐỢT N3)

- R1 (trong dải 100%, load5 median 5,70, build c4198206): dạng yếu 1 gap +
  **dạng mạnh 2 gap freeze sạch** (337 / 398 ms); CDP 0/11. Bracket các gap
  dạng mạnh: 1102 / 766 ms — **đều > 300 ms**.
- R2 (trong dải 100%, load5 median 7,85, build 03bf029f): 0 draws-gap
  >300 ms; **dạng mạnh 0**; CDP 0/3. Worker r-gap max 314 ms.
- R3 (trong dải 100%, load5 median 7,72, build 03bf029f): 0 draws-gap
  >300 ms; **dạng mạnh 0**; CDP 0/3. Worker r-gap max 279 ms.
- **Kết luận đợt N3: DẠNG MẠNH QUAN SÁT ĐƯỢC Ở 1/3 LƯỢT (R1, 2 gap).**
  Tần suất gộp toàn chuỗi (bar prereg K3, loại stall): **5/15 lượt** (J3 0/4
  + K3 1/3 + L3 2/2 + M3 1/3 + N3 1/3). Theo quy tắc loại stall mới: cũng
  **5/15 lượt** (N3 không có gap >1000 ms nào nên hai cách đếm trùng nhau ở
  đợt này). Số gap freeze sạch toàn chuỗi: 8 (cũ) + 2 (N3) = **10 gap**.
- **Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap cả
  3 lượt N3.** Ghi rõ cả hai định nghĩa như prereg yêu cầu. Bracket bị thổi
  phồng một cách cơ học bởi sampler thưa (state100 median 53–104 ms thay vì
  10 ms đặt) — dù R1 có state100 median 53 ms (dày nhất chuỗi) thì bracket
  vẫn 766–1102 ms, cho thấy bracket còn chịu ảnh hưởng khác ngoài mật độ
  state100 (ghi là quan sát, không kết luận).

## 4. Giả thuyết chuyển clip — kết luận (KẾT LUẬN ĐỢT N3)

- 8 gap cũ (kiểm lại từ dữ liệu thô, chỉ làm bối cảnh — KHÔNG dùng kiểm
  định): K3 R2 330 ms 69,17→70,00 KHÔNG straddle; L3 R1 396 ms 11,60→12,33
  straddle 12, 324 ms 35,60→36,33 straddle 36; L3 R2 500 ms 35,67→36,27
  straddle 36; M3 R2 425 ms 5,77→6,23 (6), 608 ms 17,73→18,33 (18), 430 ms
  35,43→36,27 (36), 594 ms 41,47→42,23 (42) — đều straddle. Tổng 7/8.
  (Gap stall L3 R1 2669 ms 45,10→47,70 KHÔNG straddle, đã LOẠI khỏi cả tử
  lẫn mẫu theo quy tắc loại stall.)
- Gap MỚI của N3 (mẫu chính duy nhất cho kiểm định, prereg §3.2): **2 gap,
  cả 2 đều straddle** — R1: 337 ms 5,00→6,20 (biên 6 s), 398 ms 11,53→12,13
  (biên 12 s). p Poisson-binomial một phía = 0,0149; p cố định 0,25 =
  0,0625. **NHƯNG n=2 < 5 → KHÔNG KẾT LUẬN** theo đúng quy tắc đã đăng ký
  trước (cần n≥5 VÀ p<0,01 VÀ ≥80% mới xác nhận). Kết quả này ĐÚNG như kỳ
  vọng trong prereg §7 (~3 gap mới, chưa đủ n=5) — đợt này chỉ tích lũy.
- Gộp mô tả (kèm caveat double-dip — 8 gap cũ đã sinh ra giả thuyết): 8 + 2
  = **9/10 gap freeze sạch straddle biên clip** (tử: 7 cũ + 2 mới; mẫu: 8 cũ
  + 2 mới). Chỉ mang tính mô tả, KHÔNG dùng làm bằng chứng xác nhận.
- Phân tích phụ (đăng ký trước, §3.3): trong các lượt N3, tỷ lệ straddle
  của (i) mọi gap đạt bar (yếu+mạnh, ≤1000 ms): R1 3/3, R2/R3 0/0 — gộp
  3/3 (p Poisson-binomial 0,00156, mô tả); (ii) mọi draws-gap >300 ms: R1
  3/6 (frac 0,5, p=0,0258), R2/R3 0/0 — gộp 3/6. Mẫu KHÔNG đặc hiệu tuyệt
  đối cho dạng mạnh theo nghĩa mọi draws-gap đều straddle (chỉ 3/6 draws-gap
  straddle), nhưng trong 3 gap đạt bar thì cả 3 đều straddle — gợi ý mẫu
  tập trung ở các gap đạt bar, không phải mọi gap. n quá nhỏ để kết luận;
  cần tích lũy thêm (quy tắc §3.2 vẫn đứng cho các đợt sau).
- Phân loại theo build (addendum): cả 2 gap mới đều ở R1 trên build
  c4198206; R2/R3 trên build 03bf029f có 0 gap (cả 0 draws-gap >300 ms).
  Không thể tách hiệu ứng build khỏi hiệu ứng lượt với n=2 — ghi rõ, không
  suy diễn rằng build mới hết freeze.

## 5. Sampler — CDP + worker (KẾT LUẬN ĐỢT N3)

- R1: state100 median 53 ms (đặt 10 ms); CDP recv-gap median 34 ms; ct
  distinct chưa ghi; worker drain CHẠY ĐƯỢC (5071 tick); worker không stall
  (w-gap max 117 ms); freeze thật max 398 ms.
- R2: state100 median 74 ms; CDP recv-gap median 65 ms; worker drain CHẠY
  ĐƯỢC (5066 tick); worker không stall (w-gap max 79 ms); freeze thật max
  314 ms (r-gap) nhưng draws-gap max ≤300 ms.
- R3: state100 median 104 ms; CDP recv-gap median 96,5 ms; worker drain
  CHẠY ĐƯỢC (3928 tick); worker không stall (w-gap max 94 ms); freeze thật
  max 279 ms (r-gap max, không có r-gap >300 ms).
- **draws/s dao động giữa các lượt N3: R1 30,6 / R2 32,4 / R3 22,1** (dao
  động ~1,5×; M3 dao động 3×). Tương quan draws/s↔số gap của M3 §4 KHÔNG lặp
  lại ở N3: R2 draws/s cao nhất (32,4) mà 0 gap; R1 draws/s 30,6 mà 2 gap;
  R3 draws/s thấp nhất (22,1) mà 0 gap. Không có quan hệ đơn điệu draws/s →
  số gap trong 3 lượt N3 — ghi là quan sát phản ví dụ, không kết luận quan
  hệ nhân quả; draws/s không phải biến kiểm soát đợt này.
- CDP-vs-worker nearest-duration: không có gap CDP đạt bar nào để đối chiếu
  ở cả 3 lượt (analyzer rev3.1 đã sửa quirk K3 §4). Bar ±50 ms vẫn chỉ có
  bằng chứng unit-test trên dữ liệu J3 (7/7 và 5/5 cặp khớp).
- CDP corroborate spread in-page tốt: R1 6/6 draws-gap có ph CDP trong gap
  nằm giữa hai đầu (R2/R3 không có draws-gap để kiểm) — CDP vẫn có giá trị
  giám định từng gap dù bar CDP không bắn.
- CDP rtt lớn trong các cửa sổ gap lớn (R1: CDP recv-gap max 1175 ms) — CDP
  sampler tự nó bị kẹt trong freeze, không chỉ đo freeze. Không dùng rtt CDP
  làm số đo độ dài freeze; chỉ dùng draws-gap + worker r-gap.

## 6. Stall chuyển clip — điều tra (KẾT LUẬN ĐỢT N3)

- **Stall 5 s tại biên 60 s (K3 R3) KHÔNG tái hiện: 0/3 lượt N3.** Không có
  draws-gap >1000 ms nào trong cả 3 lượt, nên không có dữ liệu mới về stall
  chuyển clip. Gộp L3+M3+N3: **0/8 lượt**. Từ trước tới nay chỉ K3 R3 thấy
  1 lần/11 lượt — hiện tượng hiếm/không ổn định, không phải hành vi hệ thống
  mỗi lần qua biên 60 s. Không kết luận "không tồn tại" — chỉ ghi "không tái
  hiện trong 8 lượt này (L3+M3+N3)".
- **Stall giữa clip kiểu c15 (2669 ms, seek/decode) cũng 0/3 lượt N3.**
  Không có draws-gap >1000 ms nào trong cả 3 lượt, nên không có dữ liệu mới
  về handoff seek→draw, và nguyên nhân gây seek giữa clip ở L3 R1 vẫn chưa
  xác định. Gộp L3+M3+N3: 1/8 lượt có stall giữa clip.
- Quy tắc loại stall đã áp dụng và cho kết quả trùng với đếm theo chữ bar ở
  đợt này (không gap >1000 ms) — quy tắc chỉ phát huy tác dụng khi có stall;
  đợt này nó đóng vai trò kiểm chứng rằng đếm dạng mạnh N3 là đếm freeze
  sạch, không lẫn stall.
- driftConfirmSkips = **23 ở cả 3 lượt N3** (R1 23, R2 23, R3 23) — giống
  hệt M3 (23 cả 3 lượt). Gộp M3+N3: 6/6 lượt = 23. Củng cố giả thuyết đây là
  số đếm cố định trong giai đoạn khởi động/warmup của probe, không phải số
  đo theo lượt. Ghi là quan sát; không dùng driftConfirmSkips để so sánh các
  lượt với nhau.

## 7. Reboot / build-identity / điều kiện tải

- **Reboot #43 ≈ 08:54Z thực** (uptime -s 08:53:37Z, boot_id
  1af50bdb-2872-4542-aaa6-dbec82fa1b51; caveat ~30 s lệch RTC — btime ghi
  08:53:37Z trong khi các driver còn chạy tới 08:54:09Z mới bị SIGTERM).
  Gap #42→#43 ≈ 48'50" (08:05:10Z → ~08:54Z) — trong khoảng chứng nhận
  [19'07", 3h14'08"], KHÔNG phá sàn 19'07". Reboot giết lượt R1 lần 1 trong
  lúc WAIT-BAND (chưa đo gì, không mất dữ liệu) + lượt N5 s70 cùng giây.
  Chạy lại từ đầu, vẫn đủ 3 lượt trong hạn (xong 09:49Z).
- **Build-identity đổi giữa R1 và R2 (caveat bắt buộc, xem addendum):**
  N1 (luồng round112-n1, luồng duy nhất được sửa production đợt 112) sửa
  preview.tsx lúc **09:08:07Z**: md5 `c4198206cb916c0f1c6d8996330335a1` →
  `03bf029f09b8890b285eacc10a02172b` (441.338 → 442.673 byte, +1335 byte),
  nội dung: đếm + hook `__vcutTailSteadyClosed112N1` + công bố (tiếp nối fix
  E4 của M1). Cây N1 đã ĐÓNG BĂNG tại 03bf029f (md5-fixed.txt); locked-run
  của N1 bắt đầu 09:24:40Z với md5=03bf029f. R1 chạy trên c4198206; R2/R3
  chạy trên 03bf029f, md5 ổn định trước/sau mỗi lượt (mtimeChanged=false
  cả 3 lượt). Xử lý: KHÔNG giết R2 giữa chừng (chạy lại trên cùng build mới
  không làm sạch thêm gì); giữ R2 làm lượt 1 trên baseline mới; báo cáo gộp
  tách theo build. Nhánh mới của N1 là đếm/hook tail — theo M1, nhánh tail
  chưa từng chạy live trong A/B, nên khả năng cao không ảnh hưởng hành vi
  gate (b), nhưng đây là suy luận từ báo cáo N1, không phải đo trực tiếp
  của N3. **So sánh tần suất gộp qua các đợt mang caveat build khác nhau**
  (J3/K3/L3 chạy trên ced42efd/9b27abe5, M3/R1-N3 trên c4198206, R2/R3-N3
  trên 03bf029f).
- Điều kiện tải tóm tắt: R1 load5 median 5,70 (15/15 snap — tăng dần
  4,68 → 6,14 trong lúc phát); R2 load5 median 7,85 (16/16 — ổn định
  7,98 → 7,72 sau khi sóng N5 tan: driver WAIT-BAND đủ 300 s với load5
  29,76 → 11,67 + probe band-wait 110 s); R3 load5 median 7,72 (16/16 —
  ổn định 7,80 → 7,47 sau WAIT-BAND 165 s từ 12,76). Nguồn sóng: N5 dial
  hog + vite/chromium sibling (N5 giữ lock 09:06:18Z–09:22:26Z và
  09:33:44Z–09:43:21Z); không đổ cho sibling cụ thể nào ngoài những gì log
  ghi.
- RAM khả dụng lúc phát: R1 951 MB, R2 1342 MB, R3 1321 MB. Không OOM,
  không ENOSPC lượt nào (vite dùng workaround server.watch.ignored
  ["**/**"], 0 inotify FD — probe config kế thừa M3).
- Chromium headless kiểm tra sau reboot #43: launch OK (v158.0.8127.18,
  3,9 s) — probe N3 dùng Chromium, không cần postboot WebKit (N7 đã PASS
  postboot-check trên boot #42; boot #43 chưa có postboot-check mới — ghi rõ,
  probe N3 không phụ thuộc WebKit).
- Vite lock: R1 lần 1 bị reboot giết (trap nhả lock 08:54:09Z); R1 lần 2 lấy
  lock 09:00:49Z (lock mồ côi N5 biến mất trước tuổi stale 30 phút — do phía
  khác dọn, N3 không xóa tay; acquire qua mkdir nguyên tử); R2 lấy lock
  09:22:26Z (chờ N5); R3 lấy lock 09:43:21Z (chờ N5). Không còn vite mồ côi
  của N3 sau khi xong (cổng 5590 down sau mỗi lượt, holder-pids rỗng, không
  còn hog python của N3). Sửa cosmetic trong run-n3.sh giữa R1 và R2 (dòng
  VITE-CLEAN in "000000" do `curl || echo 000` — chỉ sửa cách in, không đổi
  logic đo; VITE-CLEAN R2/R3 in đúng "000").
- Quyết bar CDP (ĐỀ XUẤT — ĐỒNG Ý, xem §1.2): CDP 0/3 lượt trong dải đợt
  N3 (R1 0/11, R2 0/3, R3 0/3); gộp dải chặt 0/10 lượt, gộp mọi lượt 0/11
  lượt. Falsifier đăng ký trước không kích hoạt. Đề xuất BỎ bar CDP làm bar
  song song (giữ in-page làm bar chính + CDP giám định từng gap) — quyết
  cuối thuộc parent.

## 8. Giới hạn và caveat (trung thực, gộp — KẾT LUẬN ĐỢT N3)

1. **Dạng mạnh chỉ 2 gap trong 3 lượt N3 (1/3 lượt)** — tần suất gộp 5/15
   lượt toàn chuỗi vẫn thấp; chỉ khẳng định "đã quan sát được và lặp lại
   được", không khẳng định "thường xuyên" hay ước lượng tỷ lệ. Muốn ước
   lượng tỷ lệ cần nhiều lượt hơn.
2. **Giả thuyết chuyển clip CHƯA KẾT LUẬN** — mẫu mới chỉ n=2 (cả 2 đều
   straddle, p=0,0149) nhưng quy tắc đăng ký trước đòi n≥5 nên không xác
   nhận. Gộp mô tả 9/10 straddle mang caveat double-dip (8 gap cũ đã sinh
   ra giả thuyết). Cần tích lũy thêm theo đúng quy tắc §3.2.
3. **Build-identity đổi giữa R1 và R2** (c4198206 → 03bf029f do N1 sửa
   09:08:07Z, xem §7 + addendum) — R1 chạy trên build khác với R2/R3.
   Nhánh mới của N1 chưa từng chạy live theo M1/N1 nên khả năng cao không
   ảnh hưởng gate (b), nhưng đây là suy luận từ báo cáo N1, không phải đo
   trực tiếp của N3. So sánh tần suất gộp qua các đợt mang caveat này.
   Riêng trong N3: cả 2 gap mới đều ở R1 (build cũ); R2/R3 (build mới) có
   0 gap — không tách được hiệu ứng build khỏi hiệu ứng lượt với n=2.
4. Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap cả
   3 lượt (bracket 2 gap R1 là 1102/766 ms; R2/R3 không có gap). Theo bar
   prereg K3 (không yêu cầu bracket): 2 gap. Người đọc dùng định nghĩa nào
   cũng tự đánh giá được — ghi rõ cả hai, không giấu. Bracket vẫn phồng dù
   state100 R1 dày nhất chuỗi (median 53 ms) — nguyên nhân khác ngoài mật
   độ sampler chưa điều tra.
5. Stall 5 s biên 60 s không tái hiện trong 3 lượt (gộp L3+M3+N3: 0/8) —
   không kết luận "không tồn tại"; stall giữa clip kiểu c15 cũng 0/3 lượt
   (gộp 1/8) — nguyên nhân gây seek giữa clip ở L3 R1 vẫn chưa xác định.
6. Holder python/node/yes spin không dial được load5 vào [3,8] khi máy yên
   (M3 §1.2) — dải tải đợt này được giữ bằng sóng ambient (chủ yếu sóng N5),
   không phải holder. **Không được nói "holder giữ được dải".** Nợ "dial
   độc lập" vẫn mở.
7. `preview.tsx` ổn định TRONG từng lượt (md5 trước = sau cả 3 lượt,
   mtimeChanged=false) — build-identity chỉ đổi GIỮA R1 và R2 (xem §7).
8. CDP rtt lớn trong các cửa sổ gap lớn (R1: CDP recv-gap max 1175 ms) —
   CDP sampler tự nó bị kẹt trong freeze, không chỉ đo freeze. Không dùng
   rtt CDP làm số đo độ dài freeze; chỉ dùng draws-gap + worker r-gap.
9. **Sampler thưa** (state100 median 53 ms R1 / 74 ms R2 / 104 ms R3 thay
   vì 10 ms đặt; CDP median 34/65/96,5 ms) — distinct_strict bị đếm thiếu
   và bracket bị thổi phồng một cách cơ học. Dạng mạnh quan sát được DÙ
   sampler thưa nên bằng chứng mạnh hơn, không yếu hơn; nhưng số gap tuyệt
   đối không so được trực tiếp giữa các lượt (draws/s R1 30,6 vs R2 32,4 vs
   R3 22,1 — dao động ~1,5×, xem §5).
10. **draws/s dao động giữa các lượt** (30,6 / 32,4 / 22,1) cùng build mới
    (R2/R3) và build cũ (R1) — nguyên nhân chưa điều tra. Tương quan
    draws/s↔số gap của M3 không lặp lại ở N3 (R2 cao nhất mà 0 gap; R3 thấp
    nhất mà 0 gap). Không kết luận quan hệ nhân quả; draws/s không phải biến
    kiểm soát đợt này.
11. driftConfirmSkips = 23 ở cả 3 lượt (gộp M3+N3: 6/6 lượt) — nhiều khả
    năng là số đếm cố định giai đoạn khởi động, không dùng để so sánh các lượt.
12. **Vite lock:** R1 lần 1 bị reboot giết; lock mồ côi N5 biến mất trước
    tuổi stale 30 phút (do phía khác dọn — N3 không xóa tay, acquire qua
    mkdir nguyên tử); R2/R3 đều phải chờ N5 giữ lock (16 phút và 8 phút).
    Hàng đợi vite là điểm nghẽn thật. Không còn vite mồ côi của N3 sau khi
    xong. Sửa cosmetic dòng VITE-CLEAN giữa R1 và R2 (chỉ cách in mã curl).
13. Reboot #43 giết lượt R1 lần 1 trong lúc WAIT-BAND (chưa đo gì) — lượt
    này không tính là lượt đã chạy; chạy lại từ đầu trong cùng hạn 4 lượt
    probe (đã dùng: R1-lần-1-không-đo + R1 + R2 + R3 = 4 lần chạy driver,
    3 lượt đo hợp lệ).
14. Không đo thêm kill (đã ĐÓNG từ K3). Không sửa production.
15. Analyzer rev3.1 tái dùng nguyên vẹn — quirk hiển thị ph 2 chữ số thập
    phân (K3 §8.7) vẫn còn, không ảnh hưởng verdict. Classifier classify-n3.py
    chỉ đọc file phân tích; đã kiểm thử trên dữ liệu cũ trước khi dùng.

## 9. Nợ mở (cho đợt sau)

1. Gate (b) dạng mạnh — **N3: 1/3 lượt (R1, 2 gap freeze sạch).** Còn mở:
   (a) tần suất vẫn thấp (5/15 lượt toàn chuỗi) — muốn ước lượng tỷ lệ cần
   nhiều lượt hơn; (b) quyết bar CDP (ĐỒNG Ý bỏ làm bar song song, §1.2 +
   §7 — điều kiện chữ đã thỏa từ M3, N3 kiểm chứng độc lập + falsifier
   không kích hoạt, chờ parent quyết cuối); (c) quy tắc loại stall >1000 ms
   giữ nguyên cho các đợt sau (đã đăng ký + áp dụng xong 2 đợt M3/N3);
   (d) giả thuyết freeze tập trung ở chuyển clip: mẫu mới chỉ n=2 (2/2
   straddle) — CHƯA KẾT LUẬN, cần tích lũy tới n≥5 theo quy tắc prereg §3.2
   (gộp mô tả hiện 9/10); (e) draws/s dao động giữa các lượt chưa rõ nguyên
   nhân (§8.10); (f) bracket vẫn phồng dù state100 dày nhất chuỗi (§8.4).
2. Stall chuyển clip — **5 s biên 60 s KHÔNG tái hiện (0/3 lượt N3, gộp
   0/8 với L3+M3); stall giữa clip kiểu c15 cũng 0/3 lượt.** Còn mở: (a)
   nguyên nhân gây seek giữa clip khi không có driver action (L3 R1);
   (b) handoff seek→draw; (c) drift-confirm bắn 61 lần trong stall L3 R1 —
   triệu chứng hay hệ quả.
3. Bộ tạo tải — **dial độc lập vẫn mở:** busy-loop không nâng được loadavg
   khi máy yên (M3 E4); dải đợt này nhờ sóng ambient (chủ yếu N5). Vòng sau
   cần phương án khác (vite/Chromium nền làm tải thật, hoặc chấp nhận dải
   ambient + ghi rõ nguồn tải từng lượt).
4. Sampler thưa (state100 median 53–104 ms thay vì 10 ms) — nguyên nhân
   chưa điều tra; ảnh hưởng đếm distinct_strict và bracket (§8.9).
5. Build baseline: vòng sau nên đăng ký trước build cố định cho cả đợt
   (đóng băng preview.tsx trong lúc đo) để so sánh tần suất sạch — đợt N3
   bị N1 đổi build giữa R1 và R2 (§7 + addendum).
6. Nợ đứng yên đợt 109/110/111 (xem LIMITS gộp đợt 111 §10 và M3 §9): G1 +
   mù #22 chờ user quyết, E4 + A/B xác nhận (N1 đợt 112: fix tail-steady
   mới, xem round112-n1-status.md), E6 ĐÃ ĐÓNG (L4), EPERM probe #30 + mù
   #29, F6' ĐÃ ĐÓNG (L7), ENOSPC vite nối tiếp bắt buộc, WebKit sau reboot
   (boot #43 chưa có postboot-check mới), birefnet 0 lần, TTS 39 CẤM kiểm
   lại, ci-security.yml 403, release gate — không thuộc N3.

## 10. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Prereg N3 (viết TRƯỚC khi đo) + addendum đổi build | Quy tắc loại stall §2 + bracket GIỮ companion-only + kiểm định chuyển clip §3 (n≥5, p<0,01, ≥80%) + quyết CDP §5 | `hidden_files/round112-n3/prereg-n3.md`, `addendum-prereg-n3.md` |
| CDP verify độc lập (dữ liệu thô, trước khi đo mới) | M3 R1 0/3, R2 0/62, R3 0/12; K3 0/23+0/60+0/2; L3 R1 0/28, R2 0/37; gộp dải chặt 0/7, mọi lượt 0/8 — KHỚP LIMITS các đợt | §1.2; `classify-n3.py` (recount khớp analyzer mọi file) |
| Analyzer rev3.1 trên dữ liệu N3 | R1 in-page 3 / trusted 3 / distinct≥2 = 2; R2 0 / 0 / 0; R3 0 / 0 / 0 | §2.1–2.3; `chr-mixedalt-n3r*-fr4-analysis.txt` |
| Classifier classify-n3.py trên dữ liệu N3 | R1: 2 gap mới, biên 6 + 12, p=0,0149; R2/R3: 0 gap; CDP recount khớp analyzer 3/3 lượt | §2.1–2.3, §4; `hidden_files/round112-n3/classify-n3.py` |
| Probe rev N3 | copy probe111m3, chỉ đổi đường dẫn (diff đã kiểm); ring 8000 (không tràn); CDP vd diag; vite watch.ignored; marker play-done | `apps/web/scripts/probe112n3-frame-parity.mjs` |
| Build identity (trong lúc đo) | R1: preview.tsx md5 `c4198206…` trước = sau; R2/R3: `03bf029f…` trước = sau (N1-fix 09:08:07Z, +1335 byte) | §2.1–2.3; §7; `round112-n1/md5-fixed.txt` |
| R1 | Trong dải 100% (5,70; 15/15); dạng mạnh 2 (freeze sạch, qua biên 6/12 s); CDP 0/11; stall 0; draws/s 30,6 | §2.1 |
| R2 | Trong dải 100% (7,85; 16/16); dạng mạnh 0 (0 draws-gap >300 ms); CDP 0/3; stall 0; draws/s 32,4 | §2.2 |
| R3 | Trong dải 100% (7,72; 16/16); dạng mạnh 0 (0 draws-gap >300 ms); CDP 0/3; stall 0; draws/s 22,1 | §2.3 |
| Quyết CDP | Falsifier không kích hoạt (CDP N3 0/3 lượt) → ĐỒNG Ý bỏ bar CDP; gộp dải chặt 0/10, mọi lượt 0/11 | §1.2; §7 |
| Giả thuyết chuyển clip | Gap mới 2/2 straddle, n=2 < 5 → KHÔNG KẾT LUẬN (đúng kỳ vọng prereg); gộp mô tả 9/10 (caveat double-dip) | §4 |
| Reboot #43 | ~08:54Z thực (uptime -s 08:53:37Z, boot_id 1af50bdb…; caveat lệch RTC ~30 s); gap #42→#43 ≈ 48'50" (không phá sàn 19'07"); giết R1 lần 1 trong WAIT-BAND | `uptime -s` trực tiếp; §7 |
| Vite/ENOSPC | 0 ENOSPC; R1 lần 2 lấy lock 09:00:49Z; R2 chờ N5 09:22:26Z; R3 chờ N5 09:43:21Z; không vite mồ côi N3 | driver-n3.log; §7–§8 |
| Tần suất gộp | Dạng mạnh 5/15 lượt (J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3 + N3 1/3); freeze-only cũng 5/15; bracket J3 0 gap | §3 |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round112-n3-zombie.txt`
— chứa LIMITS này + `apps/web/scripts/probe112n3-frame-parity.mjs` (2 file text).

# PHASE9_ROUND113_P3_ZOMBIE_LIMITS — Zombie gate (b): tích mẫu chuyển clip tới n≥5 — GIẢ THUYẾT ĐƯỢC XÁC NHẬN

> Luồng P3, đợt 113. Lượt cron 18:35 +07 14/11/2026 (bắt đầu 11:39Z, xong
> 11:47Z). Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG
> release/tag. Không sửa production** — chỉ probe mới
> (`probe113p3-frame-parity.mjs`, copy probe112n3 chỉ đổi đường dẫn/names)
> + classifier `classify-p3.py` (copy classify-n3.py, chỉ đổi nhãn CDP →
> forensics-only). Prereg (viết TRƯỚC khi đo):
> `hidden_files/round113-p3/prereg-p3.md`. Dữ liệu thô:
> `hidden_files/round113-p3/` (prereg, classifier, driver-p3.log,
> 1 lượt probe + analysis, run-p3.sh, load-holder-p3.sh,
> classify-p3-pooled.json, p3-progress.log).
>
> **HOÀN THÀNH ĐẦY ĐỦ — DỪNG SỚM THEO QUY TẮC ĐĂNG KÝ TRƯỚC:** chỉ 1 lượt
> probe (R1) đã đủ mẫu gộp n≥5 → quy tắc dừng prereg §3.2 kích hoạt, KHÔNG
> chạy R2/R3. Kết quả: **GIẢ THUYẾT FREEZE TẬP TRUNG Ở CHUYỂN CLIP ĐƯỢC
> XÁC NHẬN** theo đúng 3 điều kiện đăng ký trước (n_gộp=5, p=4,2e-05 < 0,01,
> tỷ lệ straddle 100% ≥ 80%).

## 0. Tóm tắt

- **Giả thuyết chuyển clip: XÁC NHẬN.** Mẫu gộp N3+P3: **5 gap freeze sạch,
  cả 5 đều straddle biên clip 3 s** (N3: biên 6, 12; P3-R1: biên 9, 15, 18),
  p Poisson-binomial một phía = **4,2e-05** (< 0,01), p cố định 0,25 =
  0,000977, tỷ lệ straddle 100% ≥ 80% — ĐỦ CẢ BA điều kiện prereg §3.2.
  Mẫu chỉ-P3: 3/3 straddle, p=0,002822, n=3 < 5 (chưa đủ một mình — ghi rõ
  cả hai con số, không giấu).
- **Dạng mạnh: 1/1 lượt P3 (R1, 3 gap freeze sạch).** Tần suất gộp toàn chuỗi
  (bar prereg K3 in-page, loại stall): J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3 +
  N3 1/3 + P3 1/1 = **6/16 lượt**. Theo định nghĩa bracket cũ J3 (bracket
  ≤ 300 ms): **0 gap** (bracket 3 gap R1 là 722/712/809 ms — companion-only).
- **Stall chuyển clip 5 s biên 60 s: KHÔNG tái hiện 0/1 lượt P3** (gộp
  L3+M3+N3+P3: 0/9). **Stall giữa clip kiểu c15: cũng 0/1 lượt P3** (gộp
  L3+M3+N3+P3: 1/9 lượt — chỉ L3 R1). Không có draws-gap >1000 ms nào.
- **Build CỐ ĐỊNH giữ được cả đợt** (bài học đợt 112 đã khắc phục):
  preview.tsx md5 `03bf029f…` trước = sau, mtimeChanged=false. Boot #44
  suốt lượt, không reboot giữa chừng.
- **Sự cố lock (lỗi copy của P3, đã xử lý):** run-p3.sh dòng release còn
  `release n3` (sed sót) nên driver không nhả được lock sau R1; đã nhả tay
  đúng cách `release p3` lúc 11:46:44Z, status TRỐNG; đã sửa run-p3.sh.
  Sibling chờ tối đa ~5 phút, không mất dữ liệu.
- **CDP forensics-only (bar đã bỏ, quyết parent 14/11):** 18 recv-gap
  >300 ms; phép tính bar cũ sẽ đếm 1 gap (392 ms, Δph=0,467, Δdraws=0,
  Δe4skip=1; worker r-gap gần nhất 394 ms, |Δ|=2 ms) — lần đầu tiên phép
  tính cũ bắn trong 12 lượt (trước đó 0/11). KHÔNG verdict, KHÔNG falsifier
  (prereg không đặt) — chỉ ghi nhận để parent biết nếu muốn xem lại quyết
  bỏ bar CDP. Quyết bỏ bar vẫn đứng.
- **draws/s median 20,10** (dao động chuỗi vẫn chưa rõ nguyên nhân).
  driftConfirmSkips = **23** — lần thứ 7 liên tiếp (M3 3 + N3 3 + P3 1).

## 1. Phương pháp và điều kiện chạy

### 1.1 Bar dạng mạnh + quy tắc loại stall + quyết bracket (prereg-p3 §2, giữ N3)

- Bar dạng mạnh: **CHỈ in-page** (quyết parent 14/11 — bar CDP đã bỏ):
  ≥1 gap đạt bar J3 in-page (skips>0 + spread G2) VÀ distinct_strict ≥ 2.
  Trusted (rev3): n_inside ≥ 2.
- **Quy tắc loại stall (giữ nguyên):** mọi draws-gap duration **>1000 ms**
  phân loại STALL, **LOẠI KHỎI đếm dạng mạnh** (cả đếm gap lẫn đếm lượt);
  báo cáo riêng kèm phân tầng. Đếm dạng mạnh P3 chỉ tính gap ≤1000 ms.
  Mỗi lượt báo cáo CẢ HAI số (đúng chữ bar K3 + loại stall).
- **Bracket J3 ≤300 ms: GIỮ NGUYÊN companion-only, KHÔNG nới** — chỉ báo
  cáo kèm, KHÔNG phải điều kiện loại. Bracket 3 gap dạng mạnh R1 là
  722/712/809 ms — đều > 300 ms.
- Luật loại lượt (giữ K3 §3): lượt bị LOẠI khỏi bar dạng mạnh nếu <50%
  snapshot trong cửa sổ đo có load5 ∈ [3, 8]; "trong dải" nếu load5 median
  ∈ [3, 8] VÀ ≥80% snapshot trong dải; 50–80% là "ngoài dải nhưng không loại".
- Probe probe113p3-frame-parity.mjs: copy probe112n3, CHỈ đổi đường dẫn
  scratch round112-n3 → round113-p3, CFG_DIR /tmp/round112-n3 →
  /tmp/round113-p3, tên driver global __vcut112n3Drv → __vcut113p3Drv
  (diff đã kiểm: chỉ các dòng đó + dòng tiêu đề; `node --check` OK). Mọi
  logic đo giữ nguyên: CDP vd diag, ring draws + mainDraws 8000, vite
  watch.ignored ["**/**"], marker play-done, sampler/state100/spec 24 clip
  scroll-mixed-alt, freeze-run, band-wait 300 s. Analyzer rev3.1 tái dùng
  nguyên vẹn (`round110-l3/round110-l3-analyze.py`).
- Classifier `classify-p3.py` (copy classify-n3.py, chỉ đổi nhãn CDP →
  forensics-only + docstring; phép tính giữ nguyên): phân loại straddle
  (ph0 < 3k < ph1, nghiêm ngặt), p-value Poisson-binomial với p0_i =
  duration/3 từng gap (+ biến thể bảo thủ p0 cố định 0,25). Đã kiểm thử
  trên dữ liệu cũ trước khi dùng: M3 R2 cho đúng 4 gap (p=0,000815); gộp
  K3+L3+M3 cho đúng 8 gap, 7 straddle; gộp N3 cho đúng 2 gap, p=0,014903;
  CDP forensic recount khớp analyzer ở mọi file đã thử.
- Phân tầng stall (giữ N3 §4 / L3 §4): seeking=true và/hoặc readyState < 3
  trong lúc ph đỗ → seek/decode; seeking=false, readyState=4,
  decodedFrameCount đứng yên, drawsTotal đứng yên → draw-pipeline;
  decodedFrameCount vẫn tăng trong lúc ph đỗ → lớp playhead/tick (handoff
  seek→draw). Luôn đối chiếu worker r-gap max, pump decisions, biên clip,
  driftConfirmSkips, CDP vd trước/sau (CDP chỉ forensics).
- Phối hợp vite: lock qua BẢN COPY ĐÓNG BĂNG của script chuẩn
  vcut-vite-lock.sh (md5 fd21193c5b4b7ba1769bb16fd5482984, khớp gốc lúc đóng
  băng); acquire `p3` port danh nghĩa 5590 (probe tự pickFreePort 5590–5599),
  timeout 1200 s, poll 5 s (VITE_LOCK_POLL_S=5); owner pid = pid driver; nhả
  lock khi xong (trap EXIT); chờ ≥15 s sau khi nhả trước khi giữ lại. Vite
  tạm dùng server.watch.ignored ["**/**"] (0 watch). Kill vite theo pid node
  thật, kiểm ps + curl sau khi kill (probe tự kill vite trong finally; driver
  kiểm lại các cổng 5590–5599 sau lượt).
- Holder (load-holder-p3.sh, kế thừa N3): python N khởi điểm 4, max 8, điều
  chỉnh theo load1 + chốt load5 > 8 → −1 ngay; giết ngay khi marker play-done
  xuất hiện. Dial đã biết thất bại — dải (nếu có) nhờ sóng ambient, KHÔNG
  nói holder giữ được dải.
- KHÔNG đo thêm kill. KHÔNG sửa production. KHÔNG push / release / tag.
  CẤM kiểm lại TTS 39 (không kiểm). Birefnet không thử (RAM chưa đổi).

### 1.2 Quy tắc dừng + mẫu gộp (prereg-p3 §3.2 — đăng ký TRƯỚC)

- Mẫu chính: gap freeze sạch MỚI của N3 (2 gap) + P3 (mới). 2 gap N3 được
  thu làm mẫu KIỂM ĐỊNH dưới prereg-n3 §3.2 (đăng ký trước, cùng định nghĩa
  straddle, cùng probe/analyzer/classifier, cùng quy tắc loại stall) — chúng
  KHÔNG dùng để sinh ra giả thuyết (giả thuyết sinh từ 8 gap cũ K3/L3/M3),
  nên gộp hai mẫu kiểm định liên tiếp cùng phương pháp là hợp lệ. 8 gap cũ
  vẫn LOẠI khỏi kiểm định (chỉ báo cáo mô tả gộp kèm caveat double-dip).
- Xác nhận nếu ĐỦ CẢ BA trên mẫu gộp: (i) n_gộp ≥ 5; (ii) p một phía
  (Poisson-binomial) < 0,01; (iii) tỷ lệ straddle ≥ 80%.
- Quy tắc dừng: dừng sau lượt đầu tiên mà tổng số gap straddle gộp (N3+P3)
  ≥ 5, HOẶC sau tối đa 5 lượt đo hợp lệ — tùy điều kiện nào tới trước.
  Caveat đăng ký trước: quy tắc dừng phụ thuộc kết quả nên p-value tính
  dưới giả định n cố định hơi lạc quan; ngưỡng p<0,01 là chặt (với 5/5
  straddle, p ~4e-05, biên an toàn ~240×) — ghi rõ, không giấu.

## 2. Kết quả lượt duy nhất

### 2.1 R1 — freeze, holder python N=4 — TRONG DẢI 100%, DẠNG MẠNH 3 GAP

- Thời gian: vite-lock 11:40:09Z (chờ p4 ~25 s); WAIT-BAND 150 s (load5
  1,26 → 3,05); phát 11:42:40–11:44:56Z; phân tích xong 11:45:43Z. Exit=0.
  Boot #44 suốt lượt (không reboot thêm).
- Điều kiện: load lúc phát 11,68/4,84; load5 trong lúc phát 4,84 → 6,31
  (16 snap, median 5,68; **16/16 = 100% trong [3, 8]**); procs_running
  median 9 (5–16); draws/s median 20,10 (draws/5s 2 → 310, tăng dần);
  RAM khả dụng lúc phát 742 MB (lúc viết prereg chỉ ~514 MB; cuối lượt
  4007 MB — sibling thoát giữa chừng, xem §7). preview.tsx md5
  `03bf029f…` trước = sau, mtimeChanged=false (build cố định giữ được).
- Dữ liệu: caps 658, drawsTotal 1710 (drawsKept 1710 — ring 8000 KHÔNG
  tràn), mainDraws 730, state100 658 mẫu, CDP 757 mẫu (0 lỗi),
  workerTicks gộp 4514 (drained 4358 + tail 156), pumpN 320,
  driftConfirmSkips 23, seekSkipTicks 61, pageErrs 0. results.json
  47.420.317 byte.
- Gate (b) in-page: **11 draws-gap >300 ms; 5 gap đạt bar** (skips>0 +
  spread), trusted 5, **distinct_strict ≥ 2 = 3**. Ba gap dạng mạnh (đều là
  freeze sạch, đều ≤1000 ms nên quy tắc loại stall không đổi số đếm):
  1. 493 ms relPlay [11073, 11566] ph 8,43→9,23 skips=1 inside [8,8, 9,1]
     distinct=2 bracket=722 ms trusted — **freeze sạch** (qua biên clip 9 s).
  2. 483 ms relPlay [17480, 17964] ph 14,47→15,13 skips=1 inside [14,733,
     15,033] distinct=2 bracket=712 ms trusted — **freeze sạch** (qua biên
     clip 15 s).
  3. 320 ms relPlay [20674, 20993] ph 17,60→18,20 skips=1 inside [17,8,
     18, 18,1] distinct=3 bracket=809 ms trusted — **freeze sạch** (qua biên
     clip 18 s).
  Gap đạt bar còn lại (dạng yếu): 704 ms ph 5,40→6,07 distinct=1 (cũng
  straddle biên 6 s); 485 ms ph 11,60→12,17 distinct=1 (cũng straddle biên
  12 s). 3 gap có skips=0, 1 gap skips=None (379 ms, spread=False).
- Gate (b) CDP — **FORENSICS-ONLY, KHÔNG verdict** (bar đã bỏ, quyết parent
  14/11): 18 recv-gap >300 ms; phép tính bar cũ sẽ đếm **1 gap** (392 ms
  Δph=0,467 ≥ 0,27, Δdraws=0, Δe4skip=1; classifier đếm lại độc lập: 1,
  khớp analyzer; worker r-gap gần nhất 394 ms, |Δ|=2 ms — freeze thật mà
  CDP corroborate). Đây là lần đầu phép tính cũ bắn trong 12 lượt (trước
  đó 0/11). Không dùng làm bar, không falsifier (prereg không đặt) — chỉ
  ghi nhận. CDP top gaps [1353, 488, 474, 449, 415] — gap 1353 ms là CDP
  sampler tự kẹt (draws-gap lớn nhất chỉ 704 ms), không phải freeze dài.
  Spread test CDP: 9/11 draws-gap có ph CDP trong gap nằm giữa hai đầu.
- Worker cross-check: 4514 tick trong lúc phát; w-gap median 10 ms max
  88 ms (worker không stall); r-gap >300 ms: 13, cả 13 có w-gap <100 ms
  (freeze thật); freeze thật max trong lúc phát 470 ms.
- Sampler: state100 median 98 ms (đặt 10 ms); CDP recv-gap median 90 ms,
  rtt median 75 ms (max 1343 ms); ct distinct 612.
- Stall: **không có draws-gap >1000 ms — stall chuyển clip KHÔNG tái hiện.**
  Biên 60 s qua với gap lớn nhất quanh đó 306 ms (68,70→68,97, skips=0,
  spread=False — không phải freeze).
- Kết luận R1: **TRONG DẢI 100%, dạng mạnh QUAN SÁT ĐƯỢC (3 gap freeze
  sạch, cả 3 straddle), stall 0.** Đếm lượt trong dải: 1/1; lượt có dạng
  mạnh: 1/1.

## 3. Gate (b) dạng mạnh — verdict (KẾT LUẬN ĐỢT P3)

- R1 (trong dải 100%, load5 median 5,68, build 03bf029f): dạng yếu 2 gap +
  **dạng mạnh 3 gap freeze sạch** (493 / 483 / 320 ms); stall 0.
  Bracket các gap dạng mạnh: 722 / 712 / 809 ms — **đều > 300 ms**.
- **Kết luận đợt P3: DẠNG MẠNH QUAN SÁT ĐƯỢC Ở 1/1 LƯỢT (R1, 3 gap).**
  Tần suất gộp toàn chuỗi (bar prereg K3 in-page, loại stall): **6/16 lượt**
  (J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3 + N3 1/3 + P3 1/1). Theo quy tắc loại
  stall: cũng 6/16 (P3 không có gap >1000 ms nào nên hai cách đếm trùng nhau
  ở đợt này). Số gap freeze sạch toàn chuỗi: 10 (cũ) + 3 (P3) = **13 gap**.
- **Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap.**
  Ghi rõ cả hai định nghĩa như prereg yêu cầu. Bracket vẫn phồng dù state100
  R1 median 98 ms — nguyên nhân khác ngoài mật độ sampler chưa điều tra
  (ghi là quan sát, không kết luận).

## 4. Giả thuyết chuyển clip — KẾT LUẬN (XÁC NHẬN)

- Gap MỚI của P3 (mẫu chính cùng với N3, prereg §3.2): **3 gap, cả 3 đều
  straddle** — R1: 493 ms 8,43→9,23 (biên 9), 483 ms 14,47→15,13 (biên 15),
  320 ms 17,60→18,20 (biên 18). p Poisson-binomial một phía (chỉ-P3) =
  0,002822; p cố định 0,25 = 0,015625 — nhưng n=3 < 5 nên chỉ-P3 KHÔNG đủ
  xác nhận một mình.
- **Mẫu gộp N3+P3 (chính): n=5, 5/5 straddle (100%), p Poisson-binomial =
  4,2e-05 < 0,01, p cố định 0,25 = 0,000977.** Tính tay kiểm chứng:
  p0_i = dur/3 = 0,1123 × 0,1327 × 0,1643 × 0,1610 × 0,1067 = 4,21e-05
  (khớp classifier). **ĐỦ CẢ BA điều kiện prereg §3.2 → GIẢ THUYẾT ĐƯỢC
  XÁC NHẬN: freeze dạng mạnh tập trung ở chuyển clip.**
- Gộp mô tả với 8 gap cũ (kèm caveat double-dip — 8 gap cũ đã sinh ra giả
  thuyết): 8 + 2 + 3 = **12/13 gap freeze sạch straddle biên clip** (tử:
  7 cũ + 2 N3 + 3 P3; mẫu: 8 + 2 + 3). Chỉ mang tính mô tả, KHÔNG dùng làm
  bằng chứng xác nhận (bằng chứng xác nhận là mẫu gộp N3+P3 ở trên).
- Phân tích phụ (đăng ký trước, §3.3): trong lượt R1, tỷ lệ straddle của
  (i) mọi gap đạt bar (yếu+mạnh, ≤1000 ms): **5/5** (p Poisson-binomial
  0,000107, mô tả); (ii) mọi draws-gap >300 ms: **6/11** (frac 0,5455,
  p=0,001828). Mẫu CÓ đặc hiệu cho dạng mạnh theo nghĩa: trong 6 draws-gap
  straddle thì 5 đạt bar, trong 5 draws-gap không straddle thì 0 đạt bar.
  Bảng 2×2 (post-hoc, KHÔNG đăng ký trước — chỉ mô tả): straddle×bar-pass
  5, straddle×không-bar 1, không-straddle×bar-pass 0, không-straddle×
  không-bar 5; Fisher một phía p≈0,013. Không dùng bảng này để xác nhận
  (xác nhận đã đủ bằng mẫu gộp §3.2); ghi để soi tính đặc hiệu.
- Phân loại theo build: 2 gap N3 trên build c4198206 (biên 6, 12); 3 gap
  P3 trên build cố định 03bf029f (biên 9, 15, 18). Mẫu gộp trải hai build —
  cả hai build đều cho gap straddle 100% (2/2 và 3/3), nên hiệu ứng không
  gắn với một build riêng; vẫn ghi caveat build khác nhau cho người đọc.

## 5. Sampler — CDP (forensics) + worker (KẾT LUẬN ĐỢT P3)

- R1: state100 median 98 ms (đặt 10 ms); CDP recv-gap median 90 ms; ct
  distinct 612; worker drain CHẠY ĐƯỢC (4514 tick); worker không stall
  (w-gap max 88 ms); freeze thật max 470 ms.
- **draws/s median 20,10** (draws/5s từng snap: [2, 51, 44, 43, 44, 67,
  111, 97, 151, 180, 310, 148, 131, 84, 104, 107] — tăng dần rồi giữ).
  Dao động draws/s giữa các lượt chuỗi (M3 29,4/9,6/21,2; N3 30,6/32,4/
  22,1; P3 20,1) vẫn chưa rõ nguyên nhân; draws/s không phải biến kiểm
  soát đợt này.
- CDP-vs-worker nearest-duration: phép tính cũ 1 gap CDP 392 ms ↔ worker
  r-gap 394 ms (|Δ|=2 ms) — khớp trong ±50 ms: 1/1 (forensics, không phải
  bar). CDP rtt lớn trong các cửa sổ gap lớn (recv-gap max 1353 ms, rtt
  max 1343 ms) — CDP sampler tự nó bị kẹt trong freeze, không chỉ đo
  freeze. Không dùng rtt CDP làm số đo độ dài freeze; chỉ dùng draws-gap
  + worker r-gap.
- CDP corroborate spread in-page tốt: R1 9/11 draws-gap có ph CDP trong gap
  nằm giữa hai đầu — CDP vẫn có giá trị giám định từng gap dù bar CDP đã bỏ.

## 6. Stall chuyển clip — điều tra (KẾT LUẬN ĐỢT P3)

- **Stall 5 s tại biên 60 s (K3 R3) KHÔNG tái hiện: 0/1 lượt P3.** Không có
  draws-gap >1000 ms nào, nên không có dữ liệu mới về stall chuyển clip.
  Gộp L3+M3+N3+P3: **0/9 lượt**. Từ trước tới nay chỉ K3 R3 thấy 1 lần/12
  lượt — hiện tượng hiếm/không ổn định, không phải hành vi hệ thống mỗi lần
  qua biên 60 s. Không kết luận "không tồn tại" — chỉ ghi "không tái hiện
  trong 9 lượt này (L3+M3+N3+P3)".
- **Stall giữa clip kiểu c15 (2669 ms, seek/decode) cũng 0/1 lượt P3.**
  Không có draws-gap >1000 ms nào, nên không có dữ liệu mới về handoff
  seek→draw, và nguyên nhân gây seek giữa clip ở L3 R1 vẫn chưa xác định.
  Gộp L3+M3+N3+P3: 1/9 lượt có stall giữa clip.
- Quy tắc loại stall đã áp dụng và cho kết quả trùng với đếm theo chữ bar ở
  đợt này (không gap >1000 ms) — quy tắc chỉ phát huy tác dụng khi có stall;
  đợt này nó đóng vai trò kiểm chứng rằng đếm dạng mạnh P3 là đếm freeze
  sạch, không lẫn stall.
- driftConfirmSkips = **23** (R1) — lần thứ 7 liên tiếp = 23 (M3 3 + N3 3
  + P3 1). Củng cố giả thuyết đây là số đếm cố định trong giai đoạn khởi
  động/warmup của probe, không phải số đo theo lượt. Ghi là quan sát; không
  dùng driftConfirmSkips để so sánh các lượt với nhau.

## 7. Reboot / build-identity / điều kiện tải / sự cố lock

- **Reboot #44 = 10:53:31Z** (trước lượt P3 — xảy ra giữa đợt 112 và lượt
  này; uptime -s + boot_id 6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0; P6 đợt 113
  cũng xác nhận bằng btime/journal). Gap #43→#44 = 1h59'54" (08:53:37Z →
  10:53:31Z) — trong khoảng chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn
  19'07". Số thứ tự #44 vẫn tạm thời (mù #30 chưa đóng). **Không có reboot
  nào trong lúc P3 đo** (boot_id trước = sau = 6ad1ef9e…, uptime_s trước =
  sau = 10:53:31).
- **Build-identity CỐ ĐỊNH cả đợt (đã khắc phục bài học N3):** preview.tsx
  md5 `03bf029f09b8890b285eacc10a02172b` trước = sau R1, mtimeChanged=false.
  Không có luồng nào đổi production trong lúc P3 đo. Không cần addendum.
- Điều kiện tải: WAIT-BAND 150 s (load5 1,26 → 3,05, nhờ sóng sibling);
  load lúc phát 11,68/4,84; load5 trong lúc phát 4,84 → 6,31 (16 snap,
  median 5,68, 16/16 trong dải). Nguồn sóng: sibling đợt 113 (p4 giữ lock
  trước P3; P5/P7/P1 đang chờ lock lúc R1 chạy) + holder python N=4 của P3.
  Không đổ cho sibling cụ thể nào ngoài những gì log ghi.
- RAM khả dụng: lúc viết prereg ~514 MB; lúc phát 742 MB; cuối lượt 4007 MB
  (sibling thoát giữa chừng — dao động lớn, ghi là quan sát). Không OOM,
  không ENOSPC lượt nào (vite dùng workaround server.watch.ignored
  ["**/**"], 0 inotify FD — probe config kế thừa N3).
- **Sự cố lock (lỗi copy của P3 — trung thực):** run-p3.sh dòng release còn
  `release n3` (sed khi copy run-n3.sh chỉ đổi `acquire n3` → `acquire p3`,
  sót `release n3`) nên trap EXIT của driver gọi release sai tên → lock
  script từ chối ("KHÔNG NHẢ — owner hiện tại là 'p3', không phải 'n3'")
  → lock mồ côi thread=p3 pid=13763 (đã chết) port=5590 từ 11:45:43Z.
  Phát hiện khi kiểm sau lượt; đã nhả tay đúng cách `release p3` bằng bản
  copy đóng băng lúc **11:46:44Z** (chỉ ~1 phút sau khi R1 xong), status
  TRỐNG; đã sửa run-p3.sh thành `release p3` (bản stage là bản đã sửa).
  Sibling p5/p7/p1 chờ lock tối đa ~5 phút, không mất dữ liệu; nếu không
  nhả tay, lock sẽ tự hồi qua stale-recovery sau 30 phút (12:10:09Z).
  Không còn vite mồ côi của P3 sau khi xong (cổng 5590 down, holder-pids
  rỗng, không còn hog python của P3).

## 8. Giới hạn và caveat (trung thực, gộp — KẾT LUẬN ĐỢT P3)

1. **Xác nhận dựa trên mẫu gộp n=5 (2 N3 + 3 P3), tất cả đều straddle.**
   Mẫu nhỏ nhưng p=4,2e-05 rất xa ngưỡng 0,01; tỷ lệ 100% trên 5 gap ở 5
   biên khác nhau (6, 9, 12, 15, 18) và 2 build khác nhau. Không ước lượng
   tỷ lệ straddle "thật" ngoài việc nó cao — muốn ước lượng tỷ lệ cần nhiều
   lượt hơn (hiện chỉ có 13 gap freeze sạch toàn chuỗi).
2. **Quy tắc dừng phụ thuộc kết quả** (prereg §3.2, đăng ký trước): dừng sau
   lượt đầu tiên đạt tổng straddle gộp ≥5. p-value tính dưới giả định n cố
   định nên hơi lạc quan; biên an toàn lớn (p ~4e-05 so với ngưỡng 0,01,
   ~240×) và mẫu chỉ-P3 độc lập cũng cho p=0,0028 (n=3) — kết luận không
   mong manh vào một gap duy nhất. Ghi rõ, không giấu.
3. **Mẫu gộp trải hai build** (N3: c4198206; P3: 03bf029f). Cả hai build đều
   cho 100% straddle (2/2 và 3/3), nhưng không thể loại trừ hoàn toàn hiệu
   ứng build với n=5. Người đọc dùng mẫu nào cũng tự đánh giá được — báo
   cáo cả hai con số (gộp 5/5, chỉ-P3 3/3).
4. Theo định nghĩa bracket cũ J3 (bracket ≤ 300 ms): dạng mạnh 0 gap
   (bracket 3 gap R1 là 722/712/809 ms). Theo bar prereg K3 (không yêu cầu
   bracket): 3 gap. Người đọc dùng định nghĩa nào cũng tự đánh giá được —
   ghi rõ cả hai, không giấu. Bracket vẫn phồng dù state100 R1 median 98 ms
   — nguyên nhân khác ngoài mật độ sampler chưa điều tra.
5. Stall 5 s biên 60 s không tái hiện trong 1 lượt (gộp L3+M3+N3+P3: 0/9) —
   không kết luận "không tồn tại"; stall giữa clip kiểu c15 cũng 0/1 lượt
   (gộp 1/9) — nguyên nhân gây seek giữa clip ở L3 R1 vẫn chưa xác định.
6. Holder python/node/yes spin không dial được load5 vào [3,8] khi máy yên
   (M3 §1.2) — dải đợt này được giữ bằng sóng ambient (sibling đợt 113 +
   holder), không phải holder. **Không được nói "holder giữ được dải".**
   Nợ "dial độc lập" vẫn mở.
7. `preview.tsx` ổn định TRONG lượt (md5 trước = sau, mtimeChanged=false)
   — build-identity cố định cả đợt, không cần addendum như N3.
8. CDP rtt lớn trong các cửa sổ gap lớn (R1: CDP recv-gap max 1353 ms,
   rtt max 1343 ms) — CDP sampler tự nó bị kẹt trong freeze, không chỉ đo
   freeze. Không dùng rtt CDP làm số đo độ dài freeze; chỉ dùng draws-gap
   + worker r-gap.
9. **Sampler thưa** (state100 median 98 ms thay vì 10 ms đặt; CDP median
   90 ms) — distinct_strict bị đếm thiếu và bracket bị thổi phồng một cách
   cơ học. Dạng mạnh quan sát được DÙ sampler thưa nên bằng chứng mạnh hơn,
   không yếu hơn; nhưng số gap tuyệt đối không so được trực tiếp giữa các
   lượt (draws/s R1 20,10 — thấp nhất trong các lượt có dạng mạnh).
10. **draws/s dao động giữa các lượt** (chuỗi: 9,6–32,4) — nguyên nhân chưa
    điều tra. Tương quan draws/s↔số gap của M3 không lặp lại ở P3 (draws/s
    20,10 thấp mà 3 gap — nhiều nhất một lượt từ trước tới nay, ngang M3 R2
    4 gap). Không kết luận quan hệ nhân quả; draws/s không phải biến kiểm
    soát đợt này.
11. driftConfirmSkips = 23 lần thứ 7 liên tiếp (M3+N3+P3) — nhiều khả năng
    là số đếm cố định giai đoạn khởi động, không dùng để so sánh các lượt.
12. **Vite lock:** sự cố release sai tên do lỗi copy của P3 (xem §7) — đã
    nhả tay đúng cách sau ~1 phút, đã sửa run-p3.sh; không còn vite mồ côi
    của P3. Hàng đợi vite là điểm nghẽn thật (p4/p5/p7/p1 cùng chờ/xếp
    hàng trong lúc R1 chạy).
13. Chỉ 1 lượt probe (R1) — dừng sớm theo quy tắc đăng ký trước. Không chạy
    R2/R3 nên không có dữ liệu lặp lại trong đợt P3; tính lặp lại của kết
    quả dựa vào việc 3 gap R1 đều straddle + 2 gap N3 độc lập trước đó cũng
    straddle (5 biên khác nhau, 2 build khác nhau).
14. Phép tính bar CDP cũ bắn 1 gap ở R1 (lần đầu trong 12 lượt) — chỉ ghi
    nhận forensics; bar CDP đã bỏ theo quyết parent 14/11, prereg P3 không
    đặt falsifier CDP nên sự kiện này không đổi verdict nào của P3. Nếu
    parent muốn xem lại quyết bỏ bar, đây là dữ liệu đầu vào (1 gap, worker
    corroborate |Δ|=2 ms).
15. Analyzer rev3.1 tái dùng nguyên vẹn — quirk hiển thị ph 2 chữ số thập
    phân (K3 §8.7) vẫn còn, không ảnh hưởng verdict (straddle kiểm tra trên
    ph 2 chữ số; gap nào chạm đúng biên sẽ không tính — không có gap nào
    chạm đúng biên trong đợt này). Classifier classify-p3.py chỉ đọc file
    phân tích; đã kiểm thử trên dữ liệu cũ trước khi dùng.
16. Không đo thêm kill (đã ĐÓNG từ K3). Không sửa production.

## 9. Nợ mở (cho đợt sau)

1. Gate (b) dạng mạnh — **P3: 1/1 lượt (R1, 3 gap freeze sạch).** Còn mở:
   (a) tần suất vẫn thấp (6/16 lượt toàn chuỗi) — muốn ước lượng tỷ lệ cần
   nhiều lượt hơn; (b) **giả thuyết freeze ở chuyển clip: ĐÃ XÁC NHẬN**
   (mẫu gộp N3+P3: 5/5 straddle, p=4,2e-05) — câu hỏi tiếp theo chuyển từ
   "có tập trung ở chuyển clip không" sang "TẠI SAO freeze ở chuyển clip"
   (cơ chế: pump kill/restart? seek? decode? — cần luồng chẩn đoán cơ chế,
   không phải tích mẫu nữa); (c) quy tắc loại stall >1000 ms giữ nguyên
   cho các đợt sau; (d) draws/s dao động giữa các lượt chưa rõ nguyên nhân
   (§8.10); (e) bracket vẫn phồng dù state100 dày (§8.4).
2. Stall chuyển clip — **5 s biên 60 s KHÔNG tái hiện (0/1 lượt P3, gộp
   0/9 với L3+M3+N3); stall giữa clip kiểu c15 cũng 0/1 lượt.** Còn mở: (a)
   nguyên nhân gây seek giữa clip khi không có driver action (L3 R1);
   (b) handoff seek→draw; (c) drift-confirm bắn 61 lần trong stall L3 R1 —
   triệu chứng hay hệ quả. (seekSkipTicks R1 = 61 — trùng con số 61 của
   L3 R1 nhưng là số đếm khác, không suy diễn.)
3. Bộ tạo tải — **dial độc lập vẫn mở:** busy-loop không nâng được loadavg
   khi máy yên (M3 E4); dải đợt này nhờ sóng ambient (sibling đợt 113).
   Vòng sau cần phương án khác (vite/Chromium nền làm tải thật, hoặc chấp
   nhận dải ambient + ghi rõ nguồn tải từng lượt).
4. Sampler thưa (state100 median 98 ms thay vì 10 ms) — nguyên nhân chưa
   điều tra; ảnh hưởng đếm distinct_strict và bracket (§8.9).
5. Cơ chế freeze ở chuyển clip (mới sau xác nhận): cần đo pump lifecycle /
   seek / decode quanh biên 3 s để tìm nguyên nhân gốc — hướng điều tra
   mới, chưa có trong nợ cũ.
6. Nợ đứng yên đợt 112 (xem LIMITS gộp đợt 112 §10 và N3 §9): G1 + mù #22
   chờ user quyết, E4 + A/B xác nhận (cần đợt xác nhận tải cao), E6 ĐÃ ĐÓNG,
   EPERM probe #32 + mù #31 (P6 đợt 113 đang chạy), F6' ĐÃ ĐÓNG (ngưỡng
   WebKit ≤60 ms mỏng 2 ms), ENOSPC vite nối tiếp bắt buộc, WebKit sau
   reboot (boot #44 chưa có postboot-check mới — probe P3 dùng Chromium,
   không phụ thuộc WebKit), birefnet 0 lần, TTS 39 CẤM kiểm lại,
   ci-security.yml 403, release gate — không thuộc P3.

## 10. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Prereg P3 (viết TRƯỚC khi đo) | Build cố định 03bf029f + quy tắc loại stall §2 + bracket GIỮ companion-only + kiểm định chuyển clip §3 (mẫu gộp N3+P3, n≥5, p<0,01, ≥80%) + quy tắc dừng + CDP forensics-only | `hidden_files/round113-p3/prereg-p3.md` |
| Classifier kiểm thử trước khi đo | M3 R2 đúng 4 gap p=0,000815; gộp K3+L3+M3 đúng 8 gap 7 straddle; gộp N3 đúng 2 gap p=0,014903; CDP recount khớp analyzer mọi file | §1.1; `classify-p3.py` |
| Analyzer rev3.1 trên dữ liệu P3 | R1 in-page 5 / trusted 5 / distinct≥2 = 3; stall 0; trong dải 16/16 | §2.1; `chr-mixedalt-p3r1-fr4-analysis.txt` |
| Classifier classify-p3.py trên dữ liệu P3 | R1: 3 gap mới, biên 9 + 15 + 18, p=0,002822; gộp N3+P3: n=5, 5/5, p=4,2e-05, confirm_rule=true; P3-only confirm=false (n<5) | §2.1, §4; `classify-p3-pooled.json` |
| Probe rev P3 | copy probe112n3, chỉ đổi đường dẫn/names (diff đã kiểm); ring 8000 (không tràn); CDP vd diag; vite watch.ignored; marker play-done | `apps/web/scripts/probe113p3-frame-parity.mjs` |
| Build identity (trong lúc đo) | R1: preview.tsx md5 `03bf029f…` trước = sau, mtimeChanged=false (build cố định, không đổi) | §2.1; §7 |
| R1 | Trong dải 100% (5,68; 16/16); dạng mạnh 3 (freeze sạch, qua biên 9/15/18 s); stall 0; draws/s 20,10; driftConfirmSkips 23 | §2.1 |
| Quyết dừng | Tổng straddle gộp = 5 sau R1 → dừng, KHÔNG chạy R2/R3 (prereg §3.2) | §1.2; §2.1 |
| Giả thuyết chuyển clip | **XÁC NHẬN**: gộp N3+P3 5/5 straddle, p=4,2e-05 < 0,01, 100% ≥ 80%; chỉ-P3 3/3 p=0,002822 (n<5); gộp mô tả với 8 gap cũ 12/13 (caveat double-dip) | §4 |
| CDP forensics | 18 recv-gap; phép tính cũ sẽ đếm 1 gap (392 ms, worker corroborate \|Δ\|=2 ms) — lần đầu trong 12 lượt; KHÔNG verdict (bar đã bỏ) | §2.1; §5 |
| Reboot #44 | = 10:53:31Z (trước lượt P3); gap #43→#44 = 1h59'54" (không phá sàn 19'07"); không reboot trong lúc đo | `uptime -s` trực tiếp; §7 |
| Vite/ENOSPC | 0 ENOSPC; R1 lấy lock 11:40:09Z (chờ p4 ~25 s); sự cố release sai tên — nhả tay `release p3` 11:46:44Z, status TRỐNG; không vite mồ côi P3 | driver-p3.log; §7–§8 |
| Tần suất gộp | Dạng mạnh 6/16 lượt (J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3 + N3 1/3 + P3 1/1); freeze-only cũng 6/16; bracket J3 0 gap | §3 |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round113-p3-zombie.txt`
— chứa LIMITS này + `apps/web/scripts/probe113p3-frame-parity.mjs` (2 file
text; probe 58.391 byte > 37.768 byte — ghi chú rõ).

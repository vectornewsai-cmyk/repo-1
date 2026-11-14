# PHASE9_ROUND108_J3_ZOMBIE_LIMITS — Zombie gate (b) lượt thứ 7: QUAN SÁT ĐƯỢC lần đầu sau 6 lượt (dạng yếu, chỉ dưới tải nặng) + sampler CDP ngoài main thread + rerun f4y3 pause-burst HOÀN THÀNH

> Luồng J3, đợt 108. Lượt cron 03:35 +07 14/11/2026 (bắt đầu probe 21:16:42Z sau khi chờ đủ 3 cờ nhóm yên).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.
> Không sửa production** — chỉ probe mới (`probe108j3-frame-parity.mjs`, kế thừa probe107i4
> + CDP sampler + worker clock sampler + rev2 sửa trường ct) + analyzer mới.
> Prereg (viết TRƯỚC khi chạy): `hidden_files/round108-j3/prereg-j3.md` (+ 1 đính chính
> về guard bracket, ghi thêm trước khi chạy probe thật, sau unit-test analyzer trên dữ liệu giả).
> Dữ liệu thô: `hidden_files/round108-j3/` (driver-j3.log, 4 lượt probe + 4 file analysis,
> round108-j3-analyze.py, run-j3.sh, prereg-j3.md).

## 0. Tóm tắt

- **Gate (b) QUAN SÁT ĐƯỢC — lần đầu sau 6 lượt chưa quan sát được (e4y1/e4y2/f4y1/f4y2 +
  h3y1 + i4y3).** Tổng 4 lượt J3: **in-page 33 gap** đạt bar (skips>0 + spread G2) và
  **CDP 14 gap** đạt bar ngoài main thread (recv-gap >300 ms + Δe4skip>0 + Δph ≥ 0,7×gap +
  drawsTotal không đổi) — R0: 13 + 8; R1: 19 + 6; R2: 1 + 0; R3: 0 + 0.
- **Nhưng chỉ ở DẠNG YẾU, và chỉ dưới TẢI NẶNG — đây là caveat lớn nhất của lượt này (§3.5):**
  cả 33 gap in-page đạt bar đều chỉ có **1 giá trị ph trung gian duy nhất** (distinct_strict=1,
  0 gap đạt distinct_strict ≥ 2); bracket đều >300 ms (0 gap trusted); ph tiến theo **bước
  catch-up dt (wall-clock, clamp 2 s)**, không phải chạy đều bền vững. Dạng mạnh (chạy tự do
  đều, nhiều giá trị trung gian) vẫn chưa từng quan sát được trong 7 lượt. R2/R3 lúc máy yên
  (load5 1,3–1,8) chỉ còn 1/0 gap — xác nhận nghịch lý I4: máy yên → freeze dài hiếm →
  cơ hội quan sát gate (b) cũng ít.
- **Rerun f4y3 pause-burst HOÀN THÀNH LẦN ĐẦU (R0):** 21/23 burst bắn đủ, 2 missed-window
  (f4y3 chết do reboot #29; H3 y2 rerun chết do reboot #33; C5 R4 chỉ là lineage khác).
  Nhưng R0 chạy dưới tải nặng (load1 lúc phát 23,28), không yên như thiết kế H3 y2 — dữ liệu
  pause-burst có sẵn cho phân tích zombie sau, J3 KHÔNG kết luận zombie Δ (ngoài phạm vi).
- **Sampler CDP ngoài main thread: CHẠY ĐƯỢC, cho bằng chứng độc lập — nhưng thô hơn thiết kế
  và thổi phồng freeze dài (§4).** Mật độ sụp dưới tải (R1: 235 mẫu, recv-gap median 394 ms
  thay vì 10 ms thiết kế; rtt median 325 ms). Gap CDP dài nhất (4,9–5,1 s) bị worker/state100/
  draws bên trong bác bỏ — là đói CPU của tiến trình Node sampler, không phải freeze của trang.
  Trường ct của CDP ở R0/R1 LUÔN = 0 (đọc nhầm element) — đã sửa ở rev2, kiểm chứng chạy đúng
  ở R2/R3 (ct distinct 391/464, Δct ≈ 1× qua gap).
- **Worker clock sampler: CHẠY ĐƯỢC, là cross-check freeze đáng tin nhất.** 0 lần worker cũng
  stall (w-gap >300 ms: 0/4 lượt); mọi r-gap lớn đều có w-gap <100 ms — freeze là thật, worker
  vẫn tick trong lúc main thread không nhận. Freeze thật dài nhất trong lúc phát: R0 2488 ms,
  R1 1774 ms, R2 483 ms, R3 300 ms (đúng 300, không vượt).
- **Reboot #35 = 2026-11-13 21:42:41Z** (gap #34→#35 = 1h08'24") cắt giữa R1 và R2: R0/R1 trên
  boot `cc460738…`, R2/R3 trên boot `26cbdc1e…`. Không lượt nào chết do reboot (dữ liệu đủ cả 4).
- **Dải tải mục tiêu prereg [3, 8] KHÔNG lượt nào chạm tới:** R0/R1 load5 ~10 (vượt, do sóng
  tải sibling), R2/R3 load5 1,3–1,8 (dưới, sóng đã tan + reboot). Quan sát gate (b) chỉ có
  ở load5 ~10, không có ở load5 ~1,5 — chưa đo được ở dải vừa [3, 8].
- `preview.tsx` md5 `ced42efd…` trước = sau ở cả 4 lượt (mtimeChanged=false) — cây đóng băng
  giữ nguyên cả đợt. Batch: 2 entry (LIMITS này + probe108j3).

## 1. Phương pháp và điều kiện chạy

### 1.1 Bốn lượt chạy (đều Chromium 158, scroll-mixed-alt, 24 clip c0–c23, 3 s/clip)

| Lượt | Thời gian (Z) | Boot | Chế độ | sysload | loadAtPlay (load1) | load5 med | draws/s med |
|---|---|---|---|---|---|---|---|
| R0 `chr-mixedalt-j3y0-pb` | 21:17:00–21:26:10 | cc460738 (#34) | pause-burst (rerun f4y3) | 0 | 23,28 | 10,4 (7,6–13,0) | 2,4 |
| R1 `chr-mixedalt-j3y1-fr4` | 21:26:14–21:33:06 | cc460738 (#34) | freeze-run | 4 | 12,89 | 10,1 (8,4–12,1) | 3,2 |
| R2 `chr-mixedalt-j3y2-fr4` | 21:45:44–21:48:28 | 26cbdc1e (#35) | freeze-run | 4 | 1,12 | 1,8 (0,6–2,0) | 13,7 |
| R3 `chr-mixedalt-j3y3-fr4` | 21:48:28–21:51:23 | 26cbdc1e (#35) | freeze-run | 4 | 1,12 | 1,3 (1,2–1,5) | 15,2 |

- Phối hợp tải: chờ đủ 3 cờ nhóm yên (j4 20:57Z, j6 21:09Z, j5 21:16Z) mới chạy probe
  (chờ 28 phút; trong lúc chờ làm xong prereg + sampler + analyzer + unit test). Nhóm nặng J7
  cũng chờ cùng 3 cờ nên sóng tải sibling vẫn tràn vào R0/R1 (load5 ~10, procs_running
  median 26–28, vượt mục tiêu 6–16). Sóng tan dần qua R0 (load5 12,29→7,64) và R1
  (12,12→8,43); sau reboot #35 máy yên hẳn (R2/R3 load5 ~1,3–1,8, procs 9–10).
- R2/R3 là 2 lượt xác nhận độc lập cùng mức sysload 4 theo prereg §5 (R1 đã đạt bar nên lặp
  lại mức đó thay vì đổi nấc). R3 chạy vì thời gian còn (xong 21:51Z, hạn cron ~23:35Z).
- Không đo kill (đã ĐÓNG cả blur và không-blur — I4 §2.4; đường kill không đổi code).
  Không sửa production. `node --check` probe PASS (cả rev1 và rev2).

### 1.2 Sampler mới (đăng ký trước trong prereg §4)

- **CDP sampler (chính):** vòng lặp riêng trong tiến trình Node của probe, `Runtime.evaluate`
  qua CDP session riêng (`page.context().newCDPSession(page)`), mỗi ~10 ms (self-chaining,
  không bù burst), đọc playhead + playing + drawsTotal + e4skip + video currentTime, timestamp
  tường do Node ghi (`tSendWall`/`tRecvWall`). Flush tăng dần vào `cdp-samples.jsonl`
  (mỗi 50 mẫu). Giới hạn đã ghi trước: evaluate vẫn thực thi trên main thread nên lúc đóng
  băng cứng thì không có mẫu trong gap — suy luận là so sánh hai đầu gap.
- **Worker clock sampler (phụ):** DedicatedWorker từ Blob URL, `setInterval(postMessage, 10 ms)`
  trên thread riêng; main thread ghi `{w, r}` vào `W3.workerTicks` (giới hạn 20000, R0 bị cắt
  còn 10000 mẫu cuối). Chỉ so độ dài gap (time origin worker khác main thread). Worker không
  đọc được ph/draws (không SAB — vite dev không set COOP/COEP) nên chỉ cross-check freeze.
- **state100 cũ (đối chứng):** giữ nguyên interval 10 ms như I4.
- **Analyzer mới** (`round108-j3-analyze.py`, rev2): draws-gap in-page + spread test G2
  (+ `distinct_strict` = số giá trị ph khác nhau nghiêm ngặt giữa hai đầu gap), CDP external
  gap test, worker cross-check (chỉ tick trong lúc phát, rev2), dial tải load5/procs/draws-5s.
  Unit-test trên dữ liệu giả PASS trước khi chạy thật (gap gate-(b) thật được nhận, gap
  seek-landing + plateau bị loại đúng).

### 1.3 Bar "quan sát được" (giữ nguyên G2 §3.1 + bản CDP mới, đăng ký trước)

Gap >300 ms + (a) e4skip tăng trong gap VÀ (b) playhead chạy tự do bền vững:
- Bản in-page: mẫu ph trong gap nằm nghiêm ngặt giữa mẫu đầu–cuối (spread test G2).
  Đính chính prereg (trước probe thật): guard bracket ≤300 ms của G2 §4.3 áp cho draws-check,
  không áp cho spread test — spread test tin khi n_inside ≥ 2; bracket vẫn báo cáo kèm.
- Bản CDP: Δph qua gap ≥ 0,7 × độ dài gap VÀ drawsTotal không đổi qua gap.
- Chỉ một trong hai điều kiện thì KHÔNG tính.

## 2. Kết quả từng lượt

### 2.1 R0 — rerun f4y3 pause-burst (sysload 0, nhưng nhiễm tải nặng)

- Driver: **21/23 pause-burst bắn đủ, 2 missed-window**, 0 seek-across (đúng chế độ).
  f4y3 lần đầu hoàn thành (exit 0, results.json 17.602.309 byte, cdp 113.432 byte).
- Điều kiện: load lúc phát 23,28/12,04/5,98; load5 7,6–13,0 (median 10,4); procs_running
  median 26 (5–42); draws/s median 2,4 (min 0/5s ở 3 snap); RAM khả dụng lúc phát 1346 MB.
  **Không yên như thiết kế H3 y2** — sóng tải sibling tràn vào ngay sau khi phát (load1 lúc
  bắt đầu chờ yên chỉ 0,30).
- Dữ liệu: caps 217, drawsTotal 607, state100 970 mẫu (gap median 95 / p90 569 / max 3923 ms),
  CDP 738 mẫu (recv-gap median 166 / p90 622 / max 4896 ms; sched median 126; rtt median 103 /
  p90 601 / max 4791 ms), workerTicks 10000 (bị cắt ring), r-gap >300 ms trong lúc phát: 178
  (171 có w-gap <100 ms — freeze thật; 0 worker stall), driftConfirmSkips cuối lượt 282,
  seekSkipTicks 569, pageErrs 0, md5 không đổi.
- Gate (b): in-page **13/167** gap đạt bar; CDP **8/199** gap đạt bar. Ví dụ CDP:
  317 ms Δph=0,500 Δdraws=0 Δe4skip=2; 411 ms Δph=0,666 Δe4skip=1; 796 ms Δph=1,200 Δe4skip=1;
  1036 ms Δph=0,766 Δe4skip=2; 496 ms Δph=0,900 Δe4skip=1.
- Zombie: J3 KHÔNG phân tích zombie Δ/capture ở R0 (ngoài phạm vi — chỉ chạy rerun + đo gate (b)
  + sampler). Dữ liệu pause-burst (caps/draws/state100/pump) có đủ trong results.json cho
  phân tích sau.

### 2.2 R1 — freeze sysload 4 (lượt freeze chính, tải nặng)

- Điều kiện: load lúc phát 12,89/12,32/8,03; load5 8,4–12,1 (median 10,1); procs_running
  median 28 (2–43); draws/s median 3,2; RAM khả dụng 1112 MB. Sóng tải sibling vẫn cao.
- Dữ liệu: caps 148, drawsTotal 326, state100 325 mẫu (gap median 208 / p90 819 / max 2002 ms),
  CDP 235 mẫu (recv-gap median 394,5 / p90 904 / max 5078 ms; sched median 390; rtt median 325 /
  p90 889 / max 5066 ms), workerTicks 9342 (4281 trong lúc phát), r-gap >300 ms trong lúc phát:
  136 (134 có w-gap <100 ms), driftConfirmSkips 42, seekSkip 116, pageErrs 0, md5 không đổi.
- Gate (b): in-page **19/119** gap đạt bar; CDP **6/144** gap đạt bar. Ví dụ CDP (đã kiểm
  tay từ `.jsonl` thô, §3.3): 385 ms Δph=1,867 Δdraws=0 Δe4skip=2; 505 ms Δph=1,300 Δe4skip=1;
  589 ms Δph=1,133 Δe4skip=1; 507 ms Δph=1,600 Δe4skip=1; 395 ms Δph=0,900 Δe4skip=1;
  405 ms Δph=0,900 Δe4skip=1.
- In-page mạnh nhất: gap 3831 ms relPlay [86902, 90733] ph 56,10→57,60 skips=2 spread n_inside=7
  (inside [56,467, 57,6×6]); gap 1469 ms ph 10,97→12,07 skips=2 n_inside=6; gap 2376 ms
  ph 28,93→30,73 skips=1 n_inside=5. Nhưng mọi gap đều distinct_strict=1 (§3.5).

### 2.3 R2 — freeze sysload 4, xác nhận 1 (máy yên sau reboot #35)

- Điều kiện: load lúc phát 1,12/0,62/0,26; load5 0,6–2,0 (median 1,8 — DƯỚI mục tiêu [3, 8]);
  procs_running median 10 (7–14); draws/s median 13,7; RAM khả dụng 1591 MB. Phát mượt.
- Dữ liệu: caps 442, drawsTotal 1054, state100 487 mẫu (gap median 174 / p90 310 / max 1052 ms),
  CDP 489 mẫu (recv-gap median 173 / p90 223 / max 1136 ms; rtt median 114 ms), workerTicks 3873,
  r-gap >300 ms: 9 (cả 9 có w-gap <100 ms), driftConfirmSkips 23, seekSkip 60, pageErrs 0.
- **CDP ct đã sửa đúng (rev2):** ct min 0 / max 3 / distinct 391; drawCt distinct 399. Các gap
  CDP bị loại nay có Δct ≈ 1× (vd 477 ms Δct=0,478, draws=3) — media clock chạy đúng tốc độ.
- Gate (b): in-page **1/6** gap đạt bar (361 ms relPlay [36395, 36756] ph 32,60→33,00 skips=1
  spread n_inside=4, inside [32,9, 33, 33, 33], bracket 599 ms — dạng yếu, §3.5);
  CDP **0/17**. Hai sampler không đồng thuận ở gap duy nhất này (CDP không thấy bar) —
  gap biên, không dùng làm bằng chứng chính.
- CDP gap dài nhất 1136 ms: Δph=0, Δdraws=0, Δe4skip=0, Δct=0 — đóng băng toàn bộ, bị loại
  đúng; worker max trong lúc phát chỉ 483 ms nên 1136 ms này vẫn là thổi phồng CDP (§4).

### 2.4 R3 — freeze sysload 4, xác nhận 2 (máy yên, âm tính sạch)

- Điều kiện: load lúc phát 1,12/1,48/0,70; load5 1,2–1,5 (median 1,3); procs_running median 9
  (6–12); draws/s median 15,2; RAM khả dụng 1599 MB.
- Dữ liệu: caps 511, drawsTotal 1181, state100 495 mẫu (gap median 128,5 / p90 295 / max 505 ms),
  CDP 555 mẫu (recv-gap median 118 / p90 198 / max 413 ms; rtt median 105 ms), workerTicks 3655,
  **r-gap >300 ms: 0 (max đúng 300 ms)**, driftConfirmSkips 23, seekSkip 46, pageErrs 0.
- Gate (b): in-page **0/0** gap >300 ms (không có draws-gap nào vượt 300 ms); CDP **0/4**
  (gap dài nhất 413 ms: Δph=0, Δdraws=0, Δe4skip=0 — đóng băng toàn bộ, bị loại đúng).
- R3 là âm tính sạch lúc máy yên — đối chứng trực tiếp cho R0/R1: gate (b) chỉ lộ mặt khi có
  freeze dài, mà máy yên thì freeze dài hiếm (đúng nghịch lý I4 §4.2).

## 3. Gate (b) — QUAN SÁT ĐƯỢC (lượt thứ 7), kèm giám định

### 3.1 Verdict theo bar đã đăng ký

| Lượt | In-page đạt bar / tổng gap >300 ms | CDP đạt bar / tổng recv-gap >300 ms | Verdict lượt |
|---|---|---|---|
| R0 | 13 / 167 | 8 / 199 | Quan sát được |
| R1 | 19 / 119 | 6 / 144 | Quan sát được |
| R2 | 1 / 6 | 0 / 17 | Quan sát được (1 gap, dạng yếu) |
| R3 | 0 / 0 | 0 / 4 | Không quan sát được |
| **Gộp** | **33 / 292** | **14 / 364** | **QUAN SÁT ĐƯỢC** |

Nợ LIMITS gộp đợt 107 §4 mục 5 ("gate (b) vẫn mở, lượt thứ 6 chưa quan sát được") nay
**ĐÓNG về mặt đo lường**: gate (b) đã quan sát được ở lượt thứ 7, bằng cả hai sampler độc lập,
trên 2 lượt tải nặng độc lập (R0/R1) + 1 gap yếu lúc yên (R2). Chưa quan sát được ≠ đã bác bỏ
nay không còn áp dụng — đã quan sát được, với các giới hạn ở §3.5.

### 3.2 Cơ chế ph tiến — đã đọc code (giải thích vì sao ph nhảy nhanh hơn wall)

- Vòng lặp preview (preview.tsx ~6501, ~6785–6805): `dt = clampPreviewDt((now - last) / 1000)`,
  `PREVIEW_DT_CAP_S = 2` (lib/playheadPacing.ts); `forwardStep` tích lũy dt rồi bước nguyên
  frame khi đủ. **Playhead chạy theo wall-clock, không bám currentTime của element.**
- Hệ quả: sau khi main thread bị chặn ~1,9 s, tick resume tiêu thụ dt ~1,9 s và ph nhảy
  +1,867 s trong một tick — đó là nguồn của các Δph > độ dài gap (vd R1: 385 ms gap mà
  Δph=1,867 — gấp 4,8× wall). "Playhead chạy tự do" ở đây nghĩa là: playhead bám wall-clock
  bằng catch-up sau stall, trong khi canvas không vẽ và gate (b) skip — không phải media
  clock chạy đều. Bằng chứng media vẫn phát đến từ draws ct (0→3/clip, tiến đều qua cả lượt)
  và CDP drawCt rev2 (Δct ≈ 1× qua gap ở R2/R3), không phải từ Δph.
- Drift re-seek của syncMedia (ngưỡng 0,35 s, xác nhận 2 tick — playheadPacing.ts) SEEK
  ELEMENT về playhead, không di chuyển playhead — nên ph nhảy không phải do re-seek.

### 3.3 Kiểm chứng tay các gap CDP đạt bar (không chỉ tin analyzer)

- Đọc trực tiếp `cdp-samples.jsonl` R1: 6 gap đạt bar đều có Δdraws=0, Δe4skip ∈ {1, 2},
  Δph 0,900–1,867 (vượt xa ngưỡng 0,7×gap). Đối chứng: các gap CDP dài nhưng bị loại đều
  có Δdraws ∈ {2, 3, 4, 5} (draws vẫn xảy ra trong cửa sổ) hoặc Δph=0 (đóng băng toàn bộ).
- CDP gap dài nhất R1 (5078 ms, relPlay [−500, 4578]) KHÔNG đạt bar (Δph=0, Δe4skip=0) —
  là freeze lúc bắt đầu phát; worker thấy cùng freeze đó 4990 ms (chênh 88 ms).
- R0: 8 gap CDP đạt bar đều Δdraws=0, Δe4skip ∈ {1, 2}, Δph 0,500–1,200.

### 3.4 Vì sao tin đây là gate (b) chứ không phải main thread đóng băng đơn thuần

- (i) e4skip tăng GIỮA hai lần đọc CDP liên tiếp (Δe4skip=1–2): logic skip của E4 đã CHẠY
  trong khoảng đó — tick loop sống và chủ động skip draw, không phải mọi thứ cùng chết.
  (ii) state100 có mẫu ph trung gian trong gap (spread=True): tick đã chạy giữa gap và đẩy
  ph tới giá trị trung gian — playhead không bị giữ (hold) trong gap. (iii) Không có draw
  nào trong gap (Δdraws=0 cả in-page lẫn CDP). Ba điều kiện cùng lúc = đúng định nghĩa E4 §1.6
  ("grace dài mà playhead không bị giữ").
- Đối chứng âm: R3 (máy yên) có 0 draws-gap >300 ms và 0 worker r-gap >300 ms — khi không có
  freeze thì không có quan sát nào; không phải analyzer "thấy bar ở đâu cũng được".

### 3.5 Caveat — dạng quan sát được là DẠNG YẾU (không giấu)

1. **Tiến theo bước, không chạy đều:** mọi gap in-page đạt bar (33/33) chỉ có đúng 1 giá trị
   ph trung gian khác nhau (distinct_strict=1, 0 gap đạt ≥2) — mẫu quen thuộc là "1 bước
   trung gian + plateau ở giá trị cuối" (vd R1 gap 3831 ms: inside [56,467, 57,6×6]).
   Dạng mạnh (nhiều giá trị trung gian tạo thành tiến trình đều) chưa từng quan sát được
   trong 7 lượt. Đây là hệ quả của mật độ lấy mẫu (tick thưa dưới tải) lẫn bản chất catch-up
   dt — không phân biệt được hai yếu tố này bằng dữ liệu hiện có.
2. **Bracket rộng:** mọi gap đạt bar đều có bracket >300 ms (0 gap trusted; bracket tới
   5019 ms ở R1). Gán skips theo bracket là lỏng — skips có thể xảy ra ở mép bracket chứ
   không hẳn trong gap. CDP thì gán chặt theo hai đầu đọc liên tiếp (§3.3), nên 14 gap CDP
   là chân trụ mạnh hơn 33 gap in-page.
3. **Chỉ dưới tải nặng:** 32/33 gap in-page và 14/14 gap CDP nằm ở R0/R1 (load5 ~10); lúc yên
   (R2/R3, load5 1,3–1,8) chỉ 1 gap yếu / 0 gap. **Dải tải vừa prereg [3, 8] không lượt nào
   chạm tới** — chưa biết gate (b) có lộ mặt ở tải vừa không.
4. **Ph là wall-clock catch-up (§3.2), không phải media clock:** đừng trích Δph như bằng
   chứng "video vẫn phát đều trong gap". Bằng chứng media chạy là draws ct / drawCt rev2.
5. **CDP thô hơn thiết kế (§4):** mật độ sụp dưới tải; gap dài nhất thổi phồng (§4.2).
   Kết luận dựa vào các gap CDP NGẮN (303–1036 ms) đạt bar, không dựa vào gap dài nhất.

## 4. Sampler mới vs state100 — cái mới cho gì, cái mới hỏng gì

### 4.1 Mật độ thực tế (gap giữa 2 mẫu liên tiếp, ms)

| Sampler | R0 (tải nặng) | R1 (tải nặng) | R2 (yên) | R3 (yên) |
|---|---|---|---|---|
| state100 (đặt 10 ms) | med 95 / p90 569 / max 3923 | med 208 / p90 819 / max 2002 | med 174 / p90 310 / max 1052 | med 128,5 / p90 295 / max 505 |
| CDP recv-gap | med 166 / p90 622 / max 4896 (n=738) | med 394,5 / p90 904 / max 5078 (n=235) | med 173 / p90 223 / max 1136 (n=489) | med 118 / p90 198 / max 413 (n=555) |
| CDP sched-gap (nhịp gửi Node) | med 126 / p90 665 | med 390 / p90 903 | med 165 / p90 236 | med 122 / p90 199 |
| CDP rtt (độ trễ đáp) | med 103 / p90 601 | med 325 / p90 889 | med 114 / p90 204 | med 105 / p90 183 |
| Worker r-gap (trong lúc phát) | med 0 / p90 71 / max 2488 | med 0 / p90 11 / max 1774 | med 0 / p90 102 / max 483 | med 0 / p90 106 / max 300 |

- state100 vẫn thưa như I4 đã ghi (median 95–208 ms dù interval đặt 10 ms) — main thread
  là nút thắt, không phải interval. CDP KHÔNG dày hơn state100 dưới tải nặng (R1: CDP
  median 394 ms tệ hơn state100 median 208 ms) vì mỗi evaluate tốn rtt median 325 ms.
  CDP chỉ dày hơn ở máy yên (R3: 118 ms vs state100 128,5 ms — tương đương).
- **Cái mới cho được mà state100 không cho:** (a) timestamp tường ngoài tiến trình — gap CDP
  là độ trễ đáp đo từ ngoài, không bị đồng hồ trong trang bóp méo; (b) test "external gap"
  không cần mẫu trong gap (so hai đầu gap) — bắt được 14 ca mà spread test trong gap
  không bắt được khi main thread đóng băng cứng; (c) rtt đo trực tiếp main thread có đáp
  ứng không (median 103–325 ms là số đo độ đói main thread, độc lập với state100).
- **Cái mới hỏng:** (a) mật độ sụp dưới tải — thiết kế 10 ms không giữ được (xem bảng);
  (b) recv-gap dài nhất thổi phồng freeze thật: R1 CDP 5078 ms vs worker 4990 ms (cùng
  freeze lúc bắt đầu phát, chênh 88 ms — khớp); nhưng R0 CDP 4896 ms trong lúc phát thì
  worker chỉ thấy tối đa 1795 ms chồng lấn + state100 bắn 3 mẫu + 1 draw trong cửa sổ —
  **không phải freeze của trang, là đói CPU của tiến trình Node sampler** (sched-gap 2198 ms
  cho thấy chính Node gửi trễ); R2 CDP 1136 ms vs worker 483 ms (chênh 653 ms) cùng mẫu.
  Kết luận: **dùng CDP cho gap ngắn + đếm skip, đừng dùng CDP max-gap làm độ dài freeze.**
  (c) Trường ct ở rev1 luôn = 0 (đọc element VIDEO đầu tiên trong `__vcutMediaEls`, không
  phải element đang phát) — rev2 sửa bằng max ct + drawCt cuối, kiểm chứng đúng ở R2/R3.
- **Worker clock là cross-check freeze đáng tin nhất:** w-gap median 10 ms ở cả 4 lượt
  (worker vẫn tick đều); w-gap >300 ms: **0/4 lượt** (max w-gap 275 ms R0 / 202 ms R1 /
  143 ms R2 / 85 ms R3) — worker không bao giờ stall; mọi r-gap lớn đều là main thread
  không nhận (freeze thật). Bar prereg "chênh lệch gap lớn nhất CDP vs worker ±50 ms"
  KHÔNG đạt theo nghĩa đen (R0 2408 ms, R1 3304 ms, R2 653 ms, R3 113 ms trên max đã lọc
  trong-lúc-phát) — vì CDP max là outlier thổi phồng; các gap lớn còn lại khớp nhau trong
  ~10–80 ms (R2: CDP [483, 477, 467, 413] ≈ worker [483, 477, 382, 377]). So sánh max là
  metric sai cho 2 sampler có cửa sổ khác nhau (CDP bắt đầu lúc phát, worker bắt đầu lúc
  cài sampler gồm cả 120 s chờ yên) — ghi nhận, không dùng lại.
- Bài học phương pháp (nối tiếp I4 §4.1): đừng lặp lại "đổi interval" hay "thêm sampler cùng
  main thread" như fix cho mật độ — nút thắt là main thread + CPU cell 1,5. Muốn dày thật
  cần giảm tải trong tab hoặc sampler ở tiến trình riêng KHÔNG chia sẻ CPU đói (CDP vẫn chia
  sẻ cell nên vẫn đói theo).

## 5. f4y3 pause-burst — rerun HOÀN THÀNH lần đầu (R0)

- f4y3 (đợt 104) chết do reboot #29 lúc bắt đầu (chỉ có `frame-parity-error.txt`,
  `ERR_CONNECTION_REFUSED :5591`); H3 y2 rerun chết do reboot #33 (0 dữ liệu). C5 R4 đã đo
  pause-burst 0/12 nhưng là lineage khác (đợt 101), không thay thế f4y3.
- R0 lần đầu chạy xong f4y3 đúng nghĩa: **23 actions, 21 pause-burst + 2 missed-window**,
  exit 0, Chromium, scroll-mixed-alt, 24 clip, sysload 0. Nợ "rerun f4y3 chưa xảy ra"
  (G2 §7.4, H3 §5.3, I4 §5.3, LIMITS gộp đợt 107 §4 mục 5) **ĐÓNG về mặt chạy**.
- Caveat: R0 nhiễm tải nặng (load1 lúc phát 23,28; load5 median 10,4) — không phải lượt yên
  như H3 y2 thiết kế. J3 không phân tích zombie Δ/capture trên R0 (ngoài phạm vi nhiệm vụ);
  dữ liệu thô (caps 217, draws 607, state100 970, pump, driverActions với relPlayMs từng
  burst) đã lưu tại `hidden_files/round108-j3/chr-mixedalt-j3y0-pb/` cho phân tích sau.
  Nếu cần pause-burst lúc yên thì chạy lại R0 khi máy yên (không gộp vào J3 nữa).

## 6. Reboot #35 và điều kiện tải

- **Reboot #35 = 2026-11-13 21:42:41Z** (`uptime -s` đo trực tiếp; boot `cc460738…` →
  `26cbdc1e…`). Gap #34→#35 = **1h08'24"** (từ 20:34:17Z). Nằm trong dải đã biết
  (19'07"–5h43'18"). R0/R1 chạy trên boot #34, R2/R3 trên boot #35 — không lượt nào bị
  giết giữa chừng (R1 xong 21:33:06Z, R2 bắt đầu 21:45:44Z).
- Sóng tải sibling: cao suốt R0/R1 (load5 ~10, procs_running median 26–28 — gồm J7 harness
  + J1/J2 + J8/J9 chạy song song), tan dần cuối R1, hết hẳn sau reboot #35 (R2/R3 load5
  1,3–1,8, procs 9–10). Đây là nguyên nhân chính khiến R0 không yên và R2/R3 quá yên so
  với dải mục tiêu — dial tải của J3 (sysload 4) không đủ sức kéo load5 vào [3, 8] khi
  sóng sibling chi phối.
- ENOSPC: không gặp ở J3 (mỗi lượt chỉ 1 vite, tắt khi xong; probe cleanup đã làm).
  max_user_watches vẫn 63747.

## 7. Giới hạn và caveat (trung thực, gộp)

1. Gate (b) quan sát được ở dạng yếu (§3.5): 1 bước trung gian, bracket rộng, chỉ tải nặng.
   Dạng mạnh (distinct_strict ≥ 2) chưa từng quan sát được trong 7 lượt.
2. CDP sampler thô hơn thiết kế: mật độ sụp dưới tải (R1 median 394 ms); max-gap thổi phồng
   do Node đói CPU; ct rev1 luôn 0 (đã sửa rev2, chỉ R2/R3 hưởng).
3. Dải tải vừa [3, 8] không lượt nào chạm tới (R0/R1 ~10, R2/R3 ~1,5).
4. In-page spread test: bracket tới 5019 ms, gán skips lỏng; 0 gap trusted.
5. R0 nhiễm tải nặng (load1 23,28) nên không phải rerun f4y3 lúc yên; zombie Δ R0 chưa phân tích.
6. WorkerTicks R0 bị cắt ring còn 10000 mẫu cuối (giới hạn 20000 của probe bị vượt do lượt
   dài 9 phút + chờ yên) — số r-gap R0 là trên mẫu còn lại, không phải toàn bộ lượt.
7. `preview.tsx` không đổi trong cả 4 lượt (md5 `ced42efd…` trước = sau, mtimeChanged=false) —
   không có confound build-identity. Không sửa production trong J3.
8. Analyzer rev2 thay đổi 3 điểm so với rev1 (hiển thị mainDrawsN thay vì dump mảng; thêm
   distinct_strict; worker chỉ tính trong lúc phát; chẩn đoán ct/drawCt) — verdict §7
   KHÔNG đổi khi chạy lại (R0 13/8, R1 19/6 giữ nguyên), đã kiểm chứng trên dữ liệu giả
   (gap thật được nhận, gap seek-landing bị loại đúng).

## 8. Nợ mở (cho đợt sau)

1. **Gate (b): ĐÓNG nợ "chưa quan sát được" (lượt thứ 7), mở nợ hẹp hơn:** (a) dạng mạnh
   (distinct_strict ≥ 2, chạy đều bền vững) chưa từng quan sát được; (b) chưa đo ở dải tải
   vừa [3, 8] — cần lượt chuyên đo với dial tải giữ được load5 trong dải (giảm luồng probe
   đồng thời hoặc chạy khi sibling đã xong). Không cần lặp lại lượt tải nặng — đã đủ 14 gap CDP.
2. **Rerun f4y3 lúc yên (nếu cần):** R0 đã hoàn thành nhưng nhiễm tải; zombie Δ/capture
   trên dữ liệu pause-burst R0 chưa phân tích — giao cho luồng zombie sau (đọc
   `chr-mixedalt-j3y0-pb/frame-parity-results.json`, driverActions relPlayMs từng burst).
3. **Sampler CDP:** muốn dày thật dưới tải thì cần tiến trình sampler riêng không chia sẻ
   CPU đói, hoặc giảm tải trong tab — CDP trên cùng cell vẫn đói theo. Đừng dùng CDP
   max-gap làm độ dài freeze; dùng gap ngắn + skip + worker cross-check.
4. **Worker clock sampler:** giữ lại làm cross-check freeze chuẩn cho các lượt sau (rẻ, chạy
   được cả 4 lượt, 0 stall). Lưu ý ring 20000 mẫu — lượt dài cần tăng giới hạn hoặc flush
   ra file (R0 đã mất đầu lượt).
5. Nợ đứng yên đợt 107 (xem LIMITS gộp đợt 107 §4): G1 + mù #22 chờ user quyết, re-arm A/B
   tắt E4 (J1), thí nghiệm phân biệt queue2 (J2), B-band (J4), cụm A (J5), C3b (J6),
   E1 tải nặng (J7), EPERM probe #27 + mù #26 (J8), birefnet 0 lần, TTS 39 CẤM kiểm lại,
   ci-security.yml 403, release gate — không thuộc J3.
6. Reboot #35 đã chốt 21:42:41Z, gap #34→#35 = 1h08'24" — số liệu cho mô hình dự báo reboot
   (J8) thay cho dự báo điểm H7 cũ (đã lệch 3 lượt liên tiếp >48 phút).

## 9. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Gate (b) in-page | 33 gap đạt bar / 292 gap >300 ms (R0 13, R1 19, R2 1, R3 0); distinct_strict=1 hết, 0 trusted | analysis §3 cả 4 lượt |
| Gate (b) CDP | 14 gap đạt bar / 364 recv-gap >300 ms (R0 8, R1 6, R2 0, R3 0) | analysis §4 + kiểm tay `.jsonl` R1 |
| Sampler CDP | Chạy được cả 4 lượt (235–738 mẫu/lượt); rtt median 103–325 ms; ct rev1 luôn 0, rev2 đúng (distinct 391/464) | analysis §2; probe rev2 |
| Worker clock | Chạy được cả 4 lượt; w-gap >300 ms: 0/4; freeze thật max trong lúc phát 2488/1774/483/300 ms | analysis §5 |
| f4y3 pause-burst | 21/23 burst, 2 missed-window, exit 0 — hoàn thành lần đầu | R0 driverActions |
| Kill | Không đo thêm (đã đóng — I4 §2.4) | — |
| Build identity | preview.tsx md5 `ced42efd…` trước = sau cả 4 lượt, mtimeChanged=false | results.json mtimeBefore/After |
| Reboot #35 | 2026-11-13 21:42:41Z, gap #34→#35 = 1h08'24" | `uptime -s` trực tiếp |
| Analyzer unit test | Dữ liệu giả: gap thật được nhận, gap seek-landing bị loại đúng; rev2 không đổi verdict | /tmp/j3-test (đã xoá sau test) |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round108-j3-zombie.txt`
— `docs/PHASE9_ROUND108_J3_ZOMBIE_LIMITS.md`,
`apps/web/scripts/probe108j3-frame-parity.mjs` (probe mới của J3, gồm rev2 sửa ct).
Analyzer + prereg + driver + dữ liệu thô nằm ở `hidden_files/round108-j3/` (ngoài repo,
không đưa vào batch push — theo tiền lệ I4).

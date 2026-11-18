# Đợt 112 N1 — E4 freeze-sát-cuối, cơ chế mới m1f4: steady-close

- **Kết luận: ĐÓNG CÓ ĐIỀU KIỆN** (theo đúng luật quyết định đã đăng ký trong
  `prereg-n1.md` §6 — xem §5 dưới đây). Không phải ĐÓNG đầy đủ: Fisher vs K1-on
  p=0,0862 ≥ 0,05 (n=2+2 nhỏ, thiếu lực thống kê). Cơ chế đã diệt tận gốc phần
  m1f4 (đuôi kẹt tới trần vì C3 chặn mọi lần tăng), 0 CAP/180 tick trên cây đã sửa,
  4 lần steady-close đã xác minh + 1 lần ended-close đã xác minh, stall-watch sạch.
- Repo: `vectornewsai-cmyk/repo-1`, branch main. **KHÔNG push** (stage batch chỉ).
  Chỉ N1 sửa `preview.tsx` trong đợt 112.
- Cây đo: `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b` (trước fix M1:
  `c4198206`), `playheadHold90R2.ts` md5 `1b68849a3f69dc13622e2a62e0ef37d1`,
  `playheadHold90R2.test.ts` md5 `2f5c147cf4f557edc933720432b97cd2`,
  `probe112n1.mjs` md5 `53239bc0acb8b9999a4292578552122d`. md5 trước/sau mỗi lượt
  đo đều khớp (không đổi giữa lượt; xem §4).

## §1. Đính chính cơ chế m1f4 (đọc lại dữ liệu thô, không tin mù LIMITS M1)

M1 LIMITS §4.2 mô tả m1f4 là "freeze ở 5,9667, `ended` không bao giờ đúng".
Đọc lại dữ liệu thô `round111-m1/probe-webkit-load4-gop30-m1f4/` cho thấy một nửa
của mô tả đó là **hiểu sai**:

- **Đúng:** đuôi kẹt tới trần 5000 ms. Timeline (clip bóng 6 s, gop30, loadN=4,
  cây c4198206): đuôi mở t=3807 sau ct burst 0,5667→1,1167 (ct lead ph ~0,6 s).
  Trong đuôi (t=4195–9004) element decode ổn định (ct 1,2→5,8667 ~0,91×,
  ph 0,8→5,4667 ~0,96×) nhưng lead ph bền vững +0,4…+0,7 s, nên **mọi lần tăng
  đều bị drift-gate C3 chặn** (gate counter 0→8; burst B3 0→1; chỉ 1 lần tăng
  được đếm, ở vel 7710, reset ở vel 8113). `advances` giữ 0 → đuôi không bao
  giờ đóng qua luật 2-advance; tuổi đạt 5197 ms ở tick rAF cuối (rel 9004) và
  đóng ở rel 9400 (tuổi ~5593 ms, trần 5000 ms) → CAP theo prereg M1.
- **Sai (đính chính):** "freeze ở 5,9667" sau khi đuôi đóng KHÔNG phải quirk
  WebKit tự kẹt khi đang phát. Bằng chứng: rafSamples `playing=False` từ rel
  9400; renderTicks dừng ở rel 9004 (frame cuối đã vẽ, skipped=False); sampler
  dừng ở relMs 8993 (localPh 5,467, playing=True); probe-log 06:21:01.515Z
  14/11/2026 "chờ phát tới localPh>=5.0: đạt" rồi `togglePlay()` pause app ở
  ph 5,967 — đúng 1 frame trước cuối clip. **Element dừng ở 5,9667 VÌ BỊ
  PAUSE.** `ended` không bao giờ đúng vì phát dừng trước khi ct kịp chạm 6,0
  (khác l1f3: lead +0,77 s đủ lớn để ct chạm 6,0 trước khi probe pause).
  Element KHÔNG BAO GIỜ ngồi ở frame cuối TRONG LÚC ĐANG PHÁT trong m1f4.
- **Khiếm khuyết production thật:** đuôi đã chặn một drift re-seek cần thiết
  suốt 5,2 s trong khi element decode ổn định nhưng lệch bền vững — preview
  hiển thị frame lead ph ~0,5 s suốt ~5 s (lỗi đồng bộ, không phải freeze;
  renderTicks 0/11 skipped trong đuôi, canvas vẫn vẽ). Đuôi được thiết kế làm
  cầu ngắn (~300 ms tới watch mới), không phải bộ chặn 5,2 s.
- **Ngoài phạm vi đợt này (đã ghi trong prereg):** một freeze frame-cuối THẬT
  TRONG LÚC ĐANG PHÁT (ended không bao giờ đúng với playing=true), nếu tồn
  tại trong đường preview, không quan sát được bằng probe này (probe pause ở
  localPh≥5,0; timeline 6 s kết thúc ngay sau đó). Fix diệt nguyên nhân gốc
  (lead bền vững → drift re-seek bắn sớm → ct không chạy tới frame cuối
  trước ph); không tuyên bố đã sửa bản thân quirk no-ended.

## §2. Fix: steady-close (đã land trước đo, xem prereg-n1.md)

Trong `nextResumeGraceTail97Y4` (`apps/web/src/lib/playheadHold90R2.ts`):

- Bộ đếm mới `steadyAdvances` = số lần tăng lành-về-tốc-độ liên tiếp (qua luật
  rate B3 ≤1,5×), **bất kể C3 đáp xa hay đáp đúng vị trí**. Đủ
  `PLAYHEAD_TAIL_STEADY_CLOSE_ADVANCES = 4` (đã pin) thì đóng đuôi, cờ
  `steadyClosed=true` (đồng thời báo `driftGateBlocked=true` ở lần tăng đóng).
- Burst (B3) và tick đóng băng reset steady về 0 — giữ nguyên bảo vệ f4 (seek
  kẹt 5,5 s của f4 do re-seek bắn 1 tick sau burst; re-seek sớm nhất sau burst
  nay là 4 tick, ~1,6–2,4 s dưới tải).
- Không đổi: luật 2-advance, B3 1,5×, C3 0,35 s, trần 5000 ms, ended-close M1,
  H5 restart-ended, detector/watch.
- `preview.tsx`: đếm `resumeTailSteadyClosed112N1` + hook
  `__vcutTailSteadyClosed112N1` (kèm dọn khi unmount) + công bố
  `steadyAdvances` trong hook đuôi `__vcutResumeGraceTail97Y4`.
- Lý do chọn 4: gấp đôi bằng chứng của luật 2-advance (lần tăng đáp xa là
  bằng chứng yếu hơn); 4 tick ≈1,6–2,4 s dưới tải, nằm sâu trong bar CAP
  4800 ms (m1f4 sẽ đóng ở tuổi ~1800 ms thay vì 5197 ms).

## §3. Kiểm thử (trước đo)

- Unit test `playheadHold90R2.test.ts`: 9 test mới N1-R1..R9 (pin =4; replay
  m1f4 → đóng + steadyClosed ở tuổi ~1593 ms; 3 lần tăng đáp xa vẫn mở; burst
  reset steady; tick đóng băng reset steady; đáp đúng vị trí vẫn đóng ở 2;
  hỗn hợp 1 đáp-đúng + 3 đáp-xa đóng qua steady ở lần thứ 4; drift đúng
  0,35 tính là đáp đúng; !playing/hasWatch đóng trước). Chạy 09:09:45Z:
  **93 passed** (84 cũ + 9 mới). Một test ban đầu lỗi (N1-R7, sai số float:
  1,15−1,1167 = 0,0333 < 1/30−1e-9, không đủ 1 frame) — sửa số test thành
  lastCt=1,1 (Δ=0,05), không sửa production.
- `npx tsc --noEmit`: **exit 0** (722 s wall — bị load test của N5 làm chậm;
  xem §8). `npx vite build`: **exit 0** (12,02 s; cảnh báo chunk >500 kB có
  từ trước).

## §4. A/B 2+2 trên cây đã sửa (webkit, loadN=4)

Driver `run-n1-locked.sh` (bản copy đóng băng `vcut-vite-lock-frozen.sh`,
poll 5 s, port 5580, owner pid 16319): giữ lock 09:31:37Z, 4 lượt probe
`probe112n1.mjs`, nhả lock 09:33:42Z. Boot #43
(`1af50bdb-2872-4542-aaa6-dbec82fa1b51`), postboot-check PASS trước lượt đầu.
Tất cả lượt: exit 0, VERDICT PASS/PASS, md5 trước/sau khớp, mtime không đổi.

| lượt | gop | tầng RAM | RAM_kB | load1 | ticks | tails | CAP N1 | CAP M1 | CAP cũ | steady-close (đã xác minh) | ended-close |
|------|-----|----------|--------|-------|-------|-------|--------|--------|--------|----------------------------|-------------|
| n1f1 | 250 | H | 2.866.432 | 3,53 | 57 | 2 | 0 | 0 | 0 | 2 (tuổi 1393 ms, 1902 ms) | 0 |
| n1f2 | 30 | H | 3.153.076 | 2,63 | 35 | 1 | 0 | 0 | 0 | 1 (tuổi 2396 ms) | 0 |
| n1f3 | 250 | H | 3.020.144 | 1,86 | 41 | 2 | 0 | 0 | 0 | 0 | 1 (tuổi 807 ms, ct=6, dur=6, ended=True) |
| n1f4 | 30 | H | 2.852.648 | 1,13 | 47 | 2 | 0 | 0 | 0 | 1 (tuổi 1614 ms) | 0 |
| **gộp** | | | **2.874 (median)** | | **180** | **7** | **0** | **0** | **0** | **4** | **1** |

- Luật CAP N1 (prereg §2): tuổi đuôi ≥4800 ms VÀ không rearm ở tick sau span
  VÀ không ended-close đã xác minh VÀ không steady-close đã xác minh.
- **0 CAP dưới cả ba luật** (N1, M1, luật cũ không loại trừ). Tuổi đuôi lớn
  nhất: **4087 ms** (n1f3, được cứu bởi rearm, không phải CAP). Không có đuôi
  nào tuổi ≥4000 ms mà paused ≥20% (đuôi 4087 ms: paused 0%, renderTicks
  0/11 skipped).
- **Ended-close M1 bắn thật lần đầu (live):** n1f3, đuôi đóng ở tuổi 807 ms
  khi ct=6, dur=6, ended=True — đường ended-close của M1 chạy thật trên
  production, không chỉ unit test.
- Baseline so sánh: K1-on 6 CAP/284 tick; L1-fix 1 CAP/179 tick; M1-fix
  1 CAP/157 tick.
- Fisher hai phía: vs K1-on **p=0,0862** (bảng [[0,180],[6,278]]); vs L1-fix
  p=0,4986; vs M1-fix p=0,4659. Poisson với rate K1-on: kỳ vọng 3,80 CAP,
  P(0)=0,0223, P(≤1)=0,1071.
- Tốc độ phát median 0,472×; freeze playhead median 2494 ms (giữ trong
  seek/tail — không phải CAP).

## §5. Áp luật quyết định prereg §6 → ĐÓNG CÓ ĐIỀU KIỆN

- (a) 0 CAP theo luật N1 trong 2+2: **ĐẠT** (0/180 tick, cả ba luật).
- (b) Kiểm cơ chế: không đuôi nào tuổi ≥4800 thiếu rearm/ended-close/
  steady-close: **ĐẠT** (max 4087 ms, rearm cứu); paused <20% ở mọi đuôi
  tuổi ≥4000 ms: **ĐẠT** (0%).
- (c) Mọi lần đóng được loại trừ đều xác minh theo §3: **ĐẠT** (4/4
  steady-close + 1/1 ended-close, xem §4).
- (d) ≥1 steady-close đã xác minh trong 2+2: **ĐẠT** (4).
- (e) Stall-watch sạch: **ĐẠT** (xem §6 — cửa sổ 3 tick của prereg là hẹp,
  đã đo lại cửa sổ rộng: 3 re-seek sau steady-close, seeking dài nhất
  1401 ms < 2000 ms, 0 stall).
- **Fisher p=0,0862 ≥ 0,05** → theo prereg, không đủ cho ĐÓNG đầy đủ.
  **Kết luận: ĐÓNG CÓ ĐIỀU KIỆN.** Điều kiện: bằng chứng cơ chế + 0/180 tick
  là mạnh, nhưng n nhỏ và tải thấp (§7); cần 1 đợt xác nhận tải cao hơn
  (hoặc gộp thêm lượt trên cây này ở đợt sau) để Fisher đạt p<0,05 trước
  khi tuyên bố ĐÓNG đầy đủ. Không chạy thêm lượt săn 0 CAP trong đợt này
  (đúng prereg).

## §6. Stall-watch sau steady-close (rủi ro f4 tái phát)

Prereg §5 đặt bar: mọi drift re-seek trong 3 tick sau 1 steady-close mà
seeking >2 s = hồi quy → KHÔNG ĐÓNG. Kết quả cửa sổ 3 tick: **0 re-seek
trong cửa sổ** — nhưng đo lại dữ liệu thô cho thấy cửa sổ 3 tick quá hẹp:
re-seek thực tế bắn muộn hơn (xác nhận drift cần nhiều tick rAF thưa dưới
tải). Đo lại cửa sổ rộng (re-seek đầu tiên sau đóng, bất kể bao nhiêu tick;
seeking từ sampler 100 ms):

| steady-close | re-seek đầu sau đóng | seeking | kết luận |
|---|---|---|---|
| n1f1 tick 19, tuổi 1393 ms | tick 27 (t=7598, ~2,0 s sau đóng), drift re-seek về ph 3,7 | **1401 ms** (7393..8794) | không stall (<2000 ms), nhưng là seek dài nhất — ghi nhận |
| n1f1 tick 49, tuổi 1902 ms | **không có** (resyncsV giữ 2 tới cuối lượt) | không có seeking sau đóng (sampler seeking=False 13994–14286) | không stall; xem §7 về re-arm frame-cuối |
| n1f2 tick 17, tuổi 2396 ms | tick 26 (t=8475, ~2,9 s sau đóng), restart-ended (restartV 0→1) | **277 ms** (8195..8472) | sạch |
| n1f4 tick 20, tuổi 1614 ms | tick 39 (t=9884, ~4,3 s sau đóng), drift re-seek 6,0→5,6 | **không đo được bằng sampler** (sampler dừng ở relMs 9117, trước re-seek); bằng chứng vel: ct về 5,6 trong ≤212 ms (tick 37 ct=6,0 → tick 38 ct=5,6) | không có bằng chứng stall |

**Gộp: 4 steady-close, 0 stall >2000 ms.** Seek dài nhất 1401 ms (n1f1) —
dưới bar nhưng đáng chú ý: re-seek sau steady-close vẫn có thể kẹt ~1,4 s
dưới tải (f4 là 5,5 s; chưa tái phát).

Ghi chú kiểm chứng chi tiết n1f1 steady-close #2 (tick 49): vel tick 48
ct=5,9667 steady=3, tick 49 ct=5,9667 tail=None sc=2 gate 9→10. Nhìn thoáng
qua tưởng step đếm tăng trong khi ct đóng băng — không phải: vel sample và
bước đuôi đọc currentTime ở các tick rAF khác nhau; bước đặt steady=3 đọc
ct=5,9333, bước đóng đọc ct=5,9667 (tăng đúng 1 frame, 0,0333 ≥ 1/30−1e-9),
đóng hợp lệ ở tuổi 1902 ms. (Bài học float N1-R7 áp dụng ở đây.)

## §7. Caveat — đọc kỹ trước khi dùng kết quả này

1. **Tải thấp hơn baseline.** Các lượt N1 chạy ở tầng RAM H với load1 đầu
   lượt 3,53 → 1,13 (tải nền đã hạ sau khi N5 kill hog lúc 09:22:25Z), trong
   khi các lượt M1 chạy ở load1 8–37. Tải thấp = ít freeze hơn = ít cơ hội
   CAP hơn. 0 CAP này là trên cây đã sửa **trong điều kiện tải thấp**; so
   sánh Fisher với K1-on (chạy tải cao) bị nhiễu bởi tải. Cần xác nhận tải
   cao để đóng đầy đủ.
2. **n nhỏ.** 180 tick, 7 đuôi. Fisher p=0,0862 — chưa đủ lực. Poisson
   P(0)=0,0223 ủng hộ hướng đúng nhưng luật quyết định dùng Fisher.
3. **Re-arm frame-cuối sau steady-close #2 (n1f1) — quan sát mở.** Sau khi
   đuôi đóng ở tick 49, element ngồi ở frame cuối 5,9667, ended=False, đang
   phát; một đuôi MỚI re-arm ở tick 50 (rearms 0→1). Probe pause app ở
   localPh≥5,0 (teardown) trước khi đuôi mới kịp già — **không đo được**
   đuôi mới có CAP hay không. Đây đúng là giới hạn phạm vi đã đăng ký trong
   prereg (probe pause ở localPh≥5,0 nên hành vi sau-đóng ở frame cuối không
   được đo). Fix đã diệt được đuôi m1f4; nhưng đường re-arm ở frame cuối vẫn
   mở và cần một probe không pause ở localPh≥5,0 (hoặc timeline dài hơn)
   để quan sát — bước tiếp theo, xem §9.
4. **Probe không đo hành vi sau-đóng ở frame cuối.** Cùng giới hạn như
   prereg: `ended` không-bao-giờ-đúng trong lúc đang phát (nếu tồn tại)
   vẫn chưa được quan sát hay loại trừ.
5. **Cửa sổ stall-watch 3 tick của prereg quá hẹp** (re-seek bắn sau 2,0–4,3 s,
   tức 8–9 tick vel). §6 đã đo lại cửa sổ rộng; kết luận không đổi (0 stall),
   nhưng đợt sau nên đăng ký cửa sổ rộng ngay từ đầu.
6. **Lỗi tên file log driver (đã sửa, không ảnh hưởng số đo).** `run-n1.sh`
   (chuyển từ mẫu M1 bằng sed) còn trỏ `RUN_LOG` về `run-m1.log` (sed bỏ
   sót chữ thường) — toàn bộ log lượt đo đã vào `round112-n1/run-m1.log`
   thay vì `run-n1.log`. Đã nối nội dung vào `run-n1.log` và sửa `RUN_LOG`
   trong script; analyzer đã đọc được ENV (RAM/load1/STRATUM khớp §4).
   Dữ liệu probe (`probe-results.json` ×4) không bị ảnh hưởng.
7. **N5 bị nhiễm bởi fix của N1 (ghi nhận, không thuộc phạm vi N1).** N1
   sửa `preview.tsx` ~09:06–09:09Z trong lúc N5 đang chạy
   chr-code-blur-s72; log N5 ghi `preview.md5=03bf029f` (cây N1-fix) ở cuối
   lượt, và lượt đó FAIL (EVAL_TIMEOUT, exit 2) lúc 09:22:18Z. N5 tự xử lý
   nhiễm; N1 chỉ ghi nhận. Các lượt N1 chạy sau đó trên cây đóng băng
   03bf029f ổn định (md5 trước/sau khớp mọi lượt).
8. **Reboot #43** 08:53:37Z (boot `1af50bdb-2872-4542-aaa6-dbec82fa1b51`),
   gap #42→#43 ≈48'27", trong khoảng chứng nhận [19'07", 3h14'08"], không
   phá sàn. Postboot-check boot #43 PASS exit 0 (log
   `postboot-check-b43.log`). Dòng thông tin trong script postboot vẫn ghi
   "#42 = 2026-11-14 08:05:10Z" (chữ cũ; các check chức năng không phụ thuộc
   boot — công việc N7 cho boot #42, N7 đã xong).

## §8. Môi trường đợt đo

- Vite nối tiếp: lock giữ bởi n5-round112 tới 09:22:25Z (nhả sau khi run
  FAIL), rồi n3 (09:22:26Z–09:31:37Z, WAIT-BAND tải), rồi n1 09:31:37Z–
  09:33:42Z. Driver N1 poll 5 s, chờ 360 s.
- Tải nền đợt 112 rất cao lúc đầu: N5 dial 40 hog tới 09:22 (load đỉnh
  48,31), N3 chromium sysload; tsc mất 722 s vì bị đói CPU (không kill hog
  của luồng khác — đúng luật). Lúc đo N1: load 3,53→1,13, RAM H.
- Xvfb display `:193` (claim qua lock); bridge + vite tạm (watch.ignored
  `**/**`, 0 watch) khởi động/kill sạch mỗi lượt (log `r2-bridge.log`,
  `r2-vite-attempt1.log` trong từng thư mục probe).

## §9. Bước tiếp theo (không làm trong đợt này)

1. **Xác nhận tải cao:** chạy lại A/B 2+2 (hoặc gộp thêm lượt) trên cây
   03bf029f ở loadN=4 với tải nền cao như M1 (load1 ~8–30) để Fisher vs
   K1-on có cơ đạt p<0,05 → ĐÓNG đầy đủ.
2. **Probe không pause ở localPh≥5,0** (hoặc timeline dài hơn 6 s) để quan
   sát đuôi re-arm ở frame cuối sau steady-close (§7 mục 3) và quirk
   ended-không-bao-giờ-đúng trong lúc đang phát, nếu tồn tại.
3. **Đăng ký stall-watch cửa sổ rộng** (re-seek đầu sau đóng, bất kể số
   tick) thay vì 3 tick.
4. G1 + mù #22/#28/#29 chờ user quyết (không thuộc N1).

## §10. File đổi/thêm (batch stage, KHÔNG push)

- `docs/PHASE9_ROUND112_N1_TAILFREEZE_LIMITS.md` (file này)
- `apps/web/scripts/probe112n1.mjs` (46.646 B — >37.768, cần ENABLE_PRIVSEP=0)
- `apps/web/src/lib/playheadHold90R2.ts` (56.791 B — >37.768)
- `apps/web/src/lib/playheadHold90R2.test.ts` (50.701 B — >37.768)
- `apps/web/src/preview.tsx` (442.673 B — >37.768)
- Scratch (không stage): `hidden_files/round112-n1/` (prereg, analyzer,
  log chạy, 4 thư mục probe, md5-fixed.txt, postboot-check-b43.log).
- Batch: `repo-1-push/paths-loop/phase9-round112-n1-tailfreeze.txt`
  (NUL-delimited, đã read-back verify).

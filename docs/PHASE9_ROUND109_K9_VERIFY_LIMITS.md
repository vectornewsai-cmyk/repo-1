# PHASE9_ROUND109_K9_VERIFY_LIMITS — Verify độc lập đợt 109 (8/8 luồng)

> Luồng K9, đợt 109, lượt cron 06:35 +07 14/11/2026.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production.
> Verify độc lập: tính lại từ dữ liệu thô trên đĩa bằng code riêng của K9
> (không tin mù LIMITS của các luồng, không import analyzer của luồng khác),
> trừ khi ghi rõ là "chạy lại analyzer của luồng" (chỉ để kiểm tính tái hiện).

## 0. Tóm tắt

- **8/8 luồng đã về và đã verify: K1–K8 KHỚP toàn bộ headline.**
  K8, K6, K2, K1: KHỚP 100% (K1 kèm 1 đính chính nhãn phương pháp).
  K5, K3: KHỚP kèm đính chính nhỏ. K4: KHỚP 100% số liệu + 2 đính chính nhỏ.
  K7: KHỚP kèm 3 đính chính (về tường thuật vite, không về số đo).
- **Headline đợt 109 (sau verify):**
  - **K1 Re-arm A/B tắt E4 (4+4): E4 CÓ ĐÓNG GÓP** theo tiêu chí đăng ký trước —
    on 6 CAP/284 ticks (0,0211), off 0 CAP/159 ticks (0,0000); Fisher p=0,0924
    (không đạt <0,05 — đã ghi rõ caveat); 2 span dài nhánh off được re-arm cứu.
  - **K2 2 MiB: error KHÔNG phải điều kiện cần của bogus** (E r2: 2 splice mà
    errEvents=[]); nhân quả queue2→splice giữ nguyên (J2).
  - **K3 Zombie gate (b) dạng mạnh: QUAN SÁT ĐƯỢC LẦN ĐẦU** — 1 gap R2
    (330 ms, ph 69,17→70,00, inside [69,433, 69,833], distinct_strict=2),
    3 sampler đồng thuận, trong dải tải [3, 8]; dial giữ được 3/3 lượt (49/50 snap).
  - **K4 cụm A sysload nhẹ: E6 vẫn mở** (7/7 Nhãn-đúng, thiếu 1 sự kiện);
    số liệu khớp 100% khi tính lại bằng code riêng.
  - **K5 Harness E1 tải nặng: bar vẫn 6/7** (3 lần chạy đều chết trước G4 do
    ENOSPC/timeout); flake 2/35 + keydown 56/748/1496 không đổi.
  - **K6 EPERM probe #28 + mù #27 ĐÓNG HOÀN TOÀN.**
  - **K7 F6' WebKit: driver ghost CHẠY ĐƯỢC THẬT trên WebKit lần đầu; bar số
    đạt 100%/100% (n=78) nhưng F6' MỞ MỘT PHẦN** — lượt đo không đạt gate yên
    prereg, còn chờ 1 lượt xác nhận lúc yên.
  - **K8 đính chính LIMITS gộp 108: 7/7 khớp** (run22 10/10 G4 PASS, flake 2/35,
    keydown 56/748/1496, CDP 12 gap, trusted-ĐC 22/33, 4990 ms pre-play).
- **Cây cuối đợt: tsc web 0, tsc desktop 0, vite build PASS, test-preview-engine
  354 assertions PASS, preview.tsx md5 `ced42efd…` không đổi; 0 file production
  đổi ngoài ý muốn (K1 toggle đã khôi phục, diff rỗng).**
- **Chờ push (đếm lại từ đĩa): đợt 109 thêm 9 batch / 15 entry / 15 file duy nhất;
  tổng 106+107+108+109 = 38 batch / 74 entry / 72 file duy nhất + 1 file oversize**
  `benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B, vẫn chờ xử lý).
- **Reboot #37 = 2026-11-14 00:55:42Z** (gap #36→#37 = 2h01'46"); không mất dữ liệu
  luồng nào (K3/K7 viết xong sau reboot; K1 k1off xong trước reboot 29 s).

## 1. Verdict từng luồng

### 1.1 K1 — Re-arm A/B tắt E4: KHỚP kèm 1 đính chính nhỏ

- Tính lại bằng code riêng (`recount-k1.py`, luật CAP J1/F5) từ 8 file
  `probe-results.json` thô: k1on 166 ticks CAP 4 [5201, 5014, 5035, 5016] C40 1;
  k2on 29 ticks CAP 0; k3on 45 ticks CAP 1 [5107]; k4on 44 ticks CAP 1 [5123];
  k1off 40 / k2off 38 / k3off 36 / k4off 45 ticks, CAP 0 cả 4 lượt.
  Tổng on 6/284 = 0,0211, off 0/159 = 0,0000; CAP/40 3/149 vs 0/154;
  CAP/lượt 1,50 vs 0,00. Tails 4/0/1/1 vs 1/2/1/3; rate, wall, frzMax,
  stopped, pageErrs=0 — khớp từng số trong `cap-pattern-rows.json` và LIMITS §1.1/§3.
- Span dài được cứu (off): k1off 5209 ms tick 29, k3off 4910 ms tick 28
  (rearm tăng ở tick sau); k2off max 4008 ms, k4off max 2577 ms; nhánh on 0 span
  được cứu. Fisher tự tính (liệt kê đầy đủ): CAP/tick p=0,0924; CAP/40 p=0,1177;
  bảng span [[6,0],[0,2]] p=0,0357 — khớp đúng 4 chữ số với K1.
  Freeze-đuôi-mở trung vị on 4520,5 ms vs off 315,5 ms (LIMITS làm tròn 4520/316);
  RAM đầu lượt trung vị on 1609,5 MB vs off 1345,5 MB (1610/1346); rate trung vị
  on 0,151 vs off 0,424.
- Lý do kết thúc (probe log): k1on "HẾT 40s"; k2on/k3on/k4on "dừng sớm: playhead
  đóng băng ≥2,5s trong lúc seeking" (3/4 on); k1off–k4off "chờ phát tới
  localPh>=5.0: đạt" (4/4 off).
- Toggle + cây: preview.tsx md5 hiện tại `ced42efd785724c8c0d1b16fc32c7341`;
  `toggle.diff` đúng 1 dòng tại preview.tsx:5586 (chèn `false && `);
  toggle-md5 `8cb3122352a7279078bd16d988d48b42`; md5-trước trong log: on `ced42efd`,
  off `8cb31223`; mtime trước=sau mỗi lượt.
- RAM/tầng/load1 (run-k1.log, lần cuối mỗi phase): k1on 00:43:52Z RAM 2681268 H
  load1 0,67; k2on 1004616 L 1,68; k3on 1720120 J 27,34; k4on 00:48:29Z 1577800 J
  0,28; k1off 00:54:34Z 3247712 H 2,84; k2off (lần 6) 01:13:28Z 912692 L 0,41;
  k3off 1241196 L 0,89; k4off 1514940 J 1,43. Phân tầng §1.3 khớp: H on 4/166
  off 0/40; L on 0/29 off 0/74; J on 2/89 off 0/45.
- Prereg: birth 2026-11-13 23:44:24Z (trước lượt đầu 23:47:52Z); sửa lần cuối
  00:43:31Z (đính chính #2 tầng H, trước mọi lượt off + trước mọi phân tích CAP K1).
- Sự cố: k1on 3 lần (Xvfb fail 23:47, mẫu không load 00:13, hợp lệ 00:43); k4on
  2 lần (ENOSPC lần 1 CÓ bằng chứng surviving:
  `vite-attempt1-enospc.log` dòng 9 "ENOSPC: System limit for number of file
  watchers reached, watch '.../scripts/r82j4-screen-motion.mjs'"); k2off 6 lần
  (00:56, 00:58, 01:00 libevent; 01:07, 01:09 Target crashed; 01:13 hợp lệ).
- Sửa hạ tầng: wrapper MiniBrowser hiện tại dòng 5
  `LD_LIBRARY_PATH="...:${LD_LIBRARY_PATH}"` (nối thêm), bản `.orig` ghi đè;
  symlink `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` → debroot, 269 file plugin.
  Reboot #37: k1off xong 00:55:13Z (trước reboot, md5 đã khôi phục), k2off bắt đầu
  lại 00:56:29Z trên boot mới.
- Kiểm chéo J1: code của K9 chạy trên JSON j2on gốc (round108-j1) cho n_vt=161
  CAP=[5025, 5165, 5302, 5123] rate=0,102 frzMax=5014 — khớp đúng số K1 nêu (§2.3).
- Batch `phase9-round109-k1-rearm.txt`: 1 entry NUL (LIMITS, 32069 B).
- **Đính chính 1 (nhãn phương pháp §1.2/§1.4):** "Poisson P(0 CAP | rate on) =
  0,0335" — giá trị 0,0335 đúng bằng (278/284)^159 (xác suất nhị thức 0 CAP trên
  159 tick), KHÔNG phải Poisson e^-3,359 = 0,0348. Cả hai đều < 0,05 nên kết luận
  "nhánh Poisson đạt" không đổi; chỉ sửa nhãn/công thức. Fisher chính vẫn
  p=0,0924 (không đạt <0,05) — LIMITS đã ghi rõ caveat này.

### 1.2 K2 — 2 MiB điều kiện cần bogus: KHỚP 100%

- Parser PULL riêng (`recount-k2.py`, đọc trực tiếp clip + JSON + GST/DOT): 18 case
  JSON khớp bảng LIMITS §2 từng run — A r3 6 splice +2097152 / err 1 / qtdemux
  0,1,2 / 88 / 7,792; A r4 396 EXACT; B 396 EXACT 168/183; C 396 EXACT 68/133;
  D 6 splice err 1 inst 3 126/85; E r1 6 splice (req 0/32/41666) err 1 inst 3 187;
  E r2 2 splice req 0 err 0 inst 2 60/7,583; F r2 156 EXACT 10/2,167; F r3 2 splice
  req 0 +2097152, 88 PULL, 2/0,083; G 378/396 EXACT 80/120; H 160 EXACT 12/2,042;
  0 OTHER, 0 pull lệch delta.
- E r2 BÁC error là điều kiện cần: 2 splice mà errEvents=[] (JSON), playOk=true,
  finalSrcKind=blob; GST log có qtdemux0 "atom has bogus size 541230788" 0,211 s —
  pipeline tự hồi phục nội bộ.
- Thứ tự splice TRƯỚC restart: A r3 2105 ms → qtdemux1 2201 ms; D r1 1720→2410;
  E r1 894→943; E r2 746→780; F r3 9106→10128. Hex 0x204286c4 = bytes tại
  c2+2097152, đúng 541230788.
- Chặn ring 8 MiB: J2Q2 readback 8388608 OK + J2Q2SET override 2097152→8388608 cả 2
  run G; DOT 4 file có queue2-0 ring-buffer-max-size=8388608; 0 splice 5/5 gộp
  ring>file. Run vô hiệu: A r1 2 PULL/0 frames (GST 58327 B), A r2 32 PULL/0 frames
  (51028 B), F r1 2 PULL/0 frames (46965 B).
- J2 kế thừa (§3 GST-clock): qtdemux0 bogus 541230788 lúc 0,157 s trong log J2 blobF
  run1 (J9 đã xác nhận J2 đợt 108).
- Batch `phase9-round109-k2-2mib.txt`: 4 entry NUL.

### 1.3 K3 — Zombie gate (b) dạng mạnh + dial tải [3, 8]: KHỚP kèm 2 đính chính nhỏ

- Dial [3,8] khớp (từ `progressSnaps` thô): R1 load5 median 7,21, 15/16 snap trong
  dải, range [6,40, 8,01]; R2 median 5,16, 16/16, [4,53, 5,52]; R3 median 4,87,
  18/18, [4,74, 5,04]. Tổng 49/50 snap.
- In-page bar khớp: R1 3 bar (trusted 2, strong 0) / 9 draws-gap; R2 8 bar
  (trusted 6, strong 1) / 35; R3 0 bar / 1 draws-gap (stall 4989 ms ph 59,97→60,
  skips=297, spread=False, distinct=0).
- **Dạng mạnh R2 khớp — giám định bằng dữ liệu thô (3 sampler đồng thuận):**
  state100: relPlay 79101 ph 69,167; 79400 ph 69,433; 79502 ph 69,833; 79715 ph 70;
  79799 ph 70 (plateau). CDP (rel = tRecv−playStartWall 1794616551477): 79095 ph
  69,167 drawsTotal 802 e4skip 24; 79393 ph 69,433 drawsTotal 804 e4skip 24; 79499
  ph 69,833 drawsTotal 804 e4skip 25; 79690 ph 69,833 drawsTotal 806 e4skip 25;
  79782 ph 70 drawsTotal 806 e4skip 26. Khớp từng giá trị K3 §2.3. drawsTotal đứng
  yên 804 trong cửa sổ; e4skip 24→25 trong gap. Gap: 330 ms relPlay [79180,79509],
  ph 69,17→70,00, skips=2, inside [69,433, 69,833], distinct_strict=2, trusted,
  bracket 614 ms (theo bar prereg K3 thì ĐẠT, theo bracket cũ J3 ≤300 ms thì KHÔNG
  — K3 đã ghi cả hai).
- CDP bar khớp (luật riêng: recv-gap>300, Δe4skip>0 cả hai đầu ≥0, Δph≥0,7×gap,
  drawsTotal không đổi): R1 0/23 (top [1739,580,513,499,498]); R2 0/60 (top
  [773,691,617,615,607]); R3 0/2 (top [530,416]).
- Worker r-gap trong lúc phát khớp: R1 14 (tổng thô 15, trừ 1 gap 327 ms tại r=61781
  TRƯỚC khi phát — playT0rel=190430; top [513,509,469,460,429]); R2 51 (max 711,
  top [711,604,587,583,513]); R3 1 (498 ms). Tổng workerTicks gộp 20747/4290/8034 khớp.
- Zombie Δ J3 R0 khớp: 0/12 biên (mỗi biên caps không tăng: c0 1→1, c4 6→6,
  c20 8→8...); 0 capture cửa sổ lẻ; pump 92 events (skip-stale-frame 29, capture 38,
  skip-seeking 5, reset-capture 11, skip-stale 9); caps 217, state100 970,
  loadAtPlay 23,28. fbAt−b_k: c0 −2924 ms, c8 −4770 ms khớp file phân tích.
- Unit-test analyzer rev3 trên dữ liệu J3 khớp (chạy lại analyzer K3): R0 13/9/CDP 7/0;
  R1 19/12/CDP 5/0; R2 1/1/0/0; R3 0/0/0/0; trusted gộp 22/33 — khớp J9 đính chính
  + recount độc lập của K9 (recount-k8b-j3.txt).
- Reboot #37 khớp: boot_id `a7bdedd2-1f2f-4eb0-8dc5-3898c2719b99` (đọc trực tiếp
  `/proc/sys/kernel/random/boot_id`), uptime -s 00:55:42Z.
- preview.tsx md5 `ced42efd…` trước=sau cả 3 lượt, mtimeChanged=False; loadAtPlay R1
  3,92/7,96, R2 5,51/5,47, R3 10,42/4,74; driftConfirmSkips 23/26/618;
  driverActions=0 cả 3 lượt (freeze-run).
- Batch `phase9-round109-k3-zombie.txt`: 2 entry NUL, cả 2 tồn tại (LIMITS 45130 B,
  probe mjs 57082 B), chỉ text.
- **Đính chính 1 (§5 fb):** 'seek-inactive' là 9/12, KHÔNG phải 10/12;
  'no-callback' 3/12 (c0, c2, c8); tổng đúng 12, không phải 13. File phân tích zombie
  §1 của chính K3 liệt kê đúng 9 seek-inactive; dữ liệu thô dbgFinal J3 R0 cũng xác
  nhận 3 no-callback + 9 seek-inactive (12 mục). Câu "c2 vừa no-callback vừa được
  đếm ở dbgFinal" không đúng — c2 chỉ xuất hiện 1 lần trong dbgFinal với 'no-callback'.
  Không đổi headline zombie Δ=0.
- **Đính chính 2 (§7 tự tham chiếu):** LIMITS hiện 548 dòng / 45.130 byte, không phải
  543 dòng / 44.570 byte như §7 ghi — file được sửa thêm sau khi §7 viết; nội dung
  đã verify khớp, không ảnh hưởng verdict.

### 1.4 K4 — Blur cụm A sysload nhẹ: KHỚP 100% số liệu + 2 đính chính nhỏ

- Tính lại độc lập bằng code riêng (`recount-k4.py`, không dùng analyzer K4):
  caps/ticks, baseline 88,06/88,11, events phân biệt từng lượt (51/38/20/43/4/0;
  J5 tái tính 233/184/44/252/91), tổng 156/804/960; band A' 7 sự kiện giống hệt từng
  trường (pres/content/ghosts/g tới 0,001), 7/7 Nhãn-đúng, E6 vẫn mở (thiếu 1);
  gap6 3/12; Bar (b) K4 n=155 0,060/+0,054 vs 0,058/+0,048, gộp n=958 0,064/+0,055 vs
  0,040/+0,017; Bar (c) K4 n=2 +0,039/+0,013, gộp n=507 +0,051/−0,008; w-scan gộp
  w=(0,70, 0,00, 0,30) median 0,014 signed −0,087; F2 350/350 nhận diện, 318/350
  trong ±1; Bar (d) r51+r52 180/182 (98,9%), r56 trung vị −4, 2/16 (12,5%) dải tới
  −9, r55 11/20 (55%); r53/r55 chờ yên nội bộ 110 s / 45 s khớp. Vite gate r50 retry
  chờ 303 s cho vite K1:5580.
- Batch 2 entry (probe mjs + LIMITS).
- **Đính chính 1 (nguồn):** LIMITS §6 ghi r50 attempt-1 "vite chết ENOSPC...
  templates.test.cjs (vite-attempt1.log)" — KHÔNG KIỂM CHỨNG ĐƯỢC:
  vite-attempt1.log hiện chỉ chứa log của RETRY (ready 309 ms, khỏe mạnh); không dòng
  ENOSPC nào còn sót trong toàn thư mục round109-k4. Chỉ xác nhận: attempt-1 exit=2,
  vite chết sau "ready" ~43 s, ERR_CONNECTION_REFUSED, retry exit=0. ENOSPC là suy
  luận hợp lý theo mẫu (giống thí nghiệm K8) nhưng file cụ thể không có bằng chứng
  surviving.
- **Đính chính 2 (số nhỏ §0):** r50 attempt-1 chờ yên là 100 s (12,42 → 4,58) theo
  driver log — không phải "~120 s (→ 4,89)"; "4,89" không có trong log. "load5 lên
  tới 24,88 lúc r50 retry chờ vite" cũng không tìm thấy trong log driver.

### 1.5 K5 — Harness E1 tải nặng: KHỚP kèm 1 đính chính nhỏ

- 3 lần E1 đều chết TRƯỚC G4, 0 report: run23 mount timeout 23:56:58.869Z (vite:5581
  lên 23:52:05, ENOSPC 2 dòng trong vite log, watch
  `test_round83_k8_eperm_retry.mjs`); run24 project-load timeout 00:13:41.174Z
  (mount OK 00:10:31, modal 00:10:40); run25 mount timeout 00:19:06.154Z; exit=2 cả 3.
  Bar vẫn 6/7, flake 2/35 + keydown 56/748/1496 không đổi.
- Dial gate khớp từng mẫu: run23 A trượt 180 s (load1 7,83→0,60, load5 7,96→4,34,
  threads-R 35–44), B đạt 40 s (28,97/11,42); run24 A đạt 130 s (load1 22,89, load5
  9,50); run25 "đạt" 20 s trên load5 cũ (load1 2,23/1,82, load5 11,87/11,30) — lỗ
  load5 xác nhận. Thí nghiệm A đạt sau 70 s (28,06/9,76). Vite gate run24 chờ ~9 phút
  (480 s) cho vite K1:5580 rồi K3:5590. Harness md5 ae6cd34a + preview ced42efd khớp.
- Batch 1 entry.
- **Đính chính:** LIMITS §3 + §6.2 ghi run24 "load1 40,84" — số 40,84 KHÔNG CÓ trong
  dữ liệu K5 (grep toàn thư mục 0 hit); sampler run24 max load1 = 39,98 (00:10:43Z).
  Run25 "1,3 → 39,57" là xấp xỉ (sampler thật min 0,57 / max 39,59; 39,57 có tại
  00:18:36Z). Không đổi headline nào.

### 1.6 K6 — EPERM probe #28 + mù #27: KHỚP 100%

- Probe log 76 dòng (+3 đúng checklist: DEAD + "boot changed cc460738 -> ab33c58f
  (uptime since 22:53:56)" + probe#28 ok=2 fail=0); heartbeat n=28 ts 23:40:43Z boot
  ab33c58f pid 13175.
- Reboot #35 21:42:41Z: 2 uptime-s độc lập (J3 driver line 800 + J7 wait line 1, cùng
  boot 26cbdc1e); #36 22:53:56Z đo nhiều lần.
- Mù #27 ĐÓNG HOÀN TOÀN: poller J7 35 mục 20:42:38→21:16:40 max gap 61 s; waiter 61
  mục 21:50:13→22:50:14 max gap 61 s; run21 ghi tới 21:43:09.892Z (28,9 s sau #35);
  run22 attempt-1 start 22:53:04Z boot 26cbdc1e; lỗ mtime 53'48" là ảo (waiter lấp đầy).
- Sóng: 123 log, 10 "đã tắt" (dương tính giả), 0 "vẫn bật"/"CẢNH BÁO"/"Operation not
  permitted" thật.
- WFS từ file thô: newstd 557/170, r7b 582/187, copies 25/17; 557+25=582 chênh 0
  (lần 15); diff +17 đúng 5 file; scope 2765 = 2752+14−1; async writeFile đúng 2 vị
  trí helper retry.
- Gap stats tính lại khớp chính xác từng giây: n30 mean 2h03'04" median 1h59'16"
  sd 65,8' p10 48'18" p90 3h06'06"; n21 mean 1h51'38" median 1h58'47" p10 1h08'24"
  p90 3h01'21"; phân bố 16/30 trong 90–150', 4 <60', 6 >180', 2 >240'.
- RAM max mù #27: 2850 MB (J4 driver108j4.log 20:43:47Z). Ngoài 2 cây đúng 3 file
  trong lỗ (j3-zombie.txt 21:56:47Z + 2 exec-log); số "27" trung gian không lưu danh
  sách, không tái hiện được. Sóng gần nhất ~11:55–12:11Z (R7), 59h29'43" trước
  probe #28.
- Batch 1 entry NUL.

### 1.7 K7 — F6' WebKit ghost: KHỚP kèm 3 đính chính (về tường thuật vite)

- Tính lại bằng code riêng (`recount-k7.py`, tự cài lại định nghĩa (1)/(2)/(3)/(4)/(4b)
  từ prereg, đọc trực tiếp JSON + ground-truth frames-stripes): engine=webkit 27.2,
  passes=20, pageErrs=[]; flip afterPass=5 wallMs=33590; blendTick 406 (viaRvfc=0 cả
  406); post-flip+2000ms n=284 (skp=1: 78, skp=0: 206).
- (1) skp=1 78/78, skp=0 206/206; (2) ứng viên label==presented 0 strip cả hai nhóm
  → vi phạm thật 0 → skp=1 78/78, skp=0 206/206; (3) skp=1 alias 59 + đáng ngờ 7
  đúng danh sách [(210,33,25),(301,64,46)...(306,64,46)]; skp=0 alias 45 + đáng ngờ
  72 (10 đầu khớp); (4) skp=1 distinct 21 {clean 9, mislabeled 8, ambiguous 4} det
  17 clean 9/17=52,9%; skp=0 distinct 137 {ambiguous 35, mislabeled 58, clean 44}
  det 102 clean 44/102=43,1%; (4b) skp=1 156 {clean 133, mislabeled 8, ambiguous 15}
  det 141 clean 133/141=94,3%; skp=0 412 {ambiguous 92, mislabeled 137, clean 183}
  det 320 clean 183/320=57,2%.
- Flip: ALL-post distinct n=137 {35/58/44} det 102 clean 44/102 (xác nhận: 21 key
  distinct của skp=1 đều nằm trong 137 key của skp=0 nên gộp vẫn 137 — số 44/102
  của LIMITS §4 là số gộp toàn bộ post-flip); ALL-post all-occ n=568 {107/145/316}
  det 461 clean 316/461=68,5%; anchorSrc frameIdx 284/284, tap 0; gap
  presented-expected 284/284 |gap|≤3, median/min/max 0.
- tickCost total n=486 median 66,0 p90 104 max 194; tBlend gap median 112 p90 208;
  frames/pass [33,29,30,31,132,27,35,29,31,31,32,32,28,72,30,20,80,28,20,24]
  (3 pass 72–132, còn lại 20–35); canvas 872×476 scale 0,66111.
- Gate yên không đạt: lượt đo bắt đầu 00:38:27Z load 2,13/3,97 (chain-k7.log), kết
  thúc 00:40:20Z load 0,83/2,98; poll 1–20 load1 0,79–39,91, load5 thấp nhất 9,56
  (poll 8) — không lần nào load5<2; poll-confirm 00:45–00:55Z: poll 2–4 load
  0,70/1,71; 0,47/1,45; 0,21/1,19 (load yên nhưng gate process không mở), poll 5–10
  load1 3,22/9,88/9,15/6,51/4,44/3,35; kết thúc 00:55:25Z, reboot #37 00:55:42Z
  (17 s sau).
- Prereg sửa (2) trước khi đo: prereg-k7.md mtime 00:05:11Z, analyzer 00:04:05Z,
  JSON đo 00:40:19Z — "Sửa lần 1" viết trước khi có dữ liệu WebKit; hiệu chuẩn trên
  JSON Chromium J6 chạy lại analyzer cho file test IDENTICAL (diff 0): skp=1 (1)
  678/679=99,9%, (2) 679/679=100%, (4) 71/82=86,6%, (4b) 1337/1356=98,6%; skp=0 (4)
  74/94=78,7%, (4b) 1589/1641=96,8% — khớp mọi bảng LIMITS §4/§5.
- Smoke: webkit 27.2 launch OK; video state playOk=false, ct=0, paused=false, rs=0,
  err=null (smoke-k7.log) — khớp LIMITS §3.1. (Số tải "27,22" lúc smoke không còn
  trong log smoke — chỉ có video state; phù hợp bối cảnh K5 tạo tải lúc đó, không
  dùng làm số đo.)
- Batch `phase9-round109-k7-webkit-ghost.txt`: 1 entry NUL (LIMITS).
  `vite.config.k7-temp.ts` đã xoá khỏi repo (khớp LIMITS §7). Cờ done 01:00Z.
- Lưu ý trung thực (K7 đã tự ghi, K9 xác nhận): (2) đạt 100% vì 0 ứng viên (không
  phải vì đã kiểm pixel nhiều ứng viên) — recount độc lập xác nhận 0 ứng viên. Dòng
  "KẾT LUẬN: F6' ĐÓNG" trong file analyzer txt chỉ là verdict số học, không tính
  gate yên; LIMITS đúng khi kết luận "MỞ MỘT PHẦN" theo prereg.
- **Đính chính 1 (số lần vite fail):** vite fail 3 lần, KHÔNG phải 2 lần. 00:28 VITE
  KHONG LEN (exit 3); 00:33 vite up 11 s rồi chết → page.goto Connection refused;
  00:35 vite up 8 s rồi chết → VITE KHONG LEN (run-k7-retry2.out + chain-k7.log).
  LIMITS §2.1 + §1 bước 7 chỉ kể 2 lần; lần 00:35:38Z không được nhắc tới.
- **Đính chính 2 (nguyên nhân ENOSPC không kiểm chứng được):** grep
  "ENOSPC"/"watchers"/"System limit"/"inotify" = 0 hit trong toàn thư mục round109-k7.
  vite-5184-k7.log bị ghi đè (>) mỗi lần chạy run-k7.sh nên chỉ còn log lượt thành
  công (ready 410 ms). Chỉ xác nhận: vite fail 3 lần (2 lần không lên, 1 lần lên rồi
  chết), lượt cuối chạy trọn 20 pass. ENOSPC là suy luận hợp lý theo mẫu (giống K4/K8)
  nhưng 2 file watch cụ thể (probe-round34-q3-decode-ahead-pipe.mjs,
  reverseCompat44Z6.test.ts) không có bằng chứng surviving; "0 inotify FD" cũng
  không có phép đo nào còn sót.
- **Đính chính 3 (probe_exit trong chain log sai):** chain-k7.log ghi lượt 00:33
  "probe_exit=0" nhưng RC=$? sau `node ... | tee` lấy exit code của tee, không phải
  của probe — probe 00:33 thực tế crash (page.goto Connection refused, node throw).
  LIMITS không dựa vào số này (mô tả đúng lượt 00:33 là fail) nên không đổi headline;
  ghi để sửa script sau (dùng PIPESTATUS).

### 1.8 K8 — Đính chính LIMITS gộp 108: KHỚP 100%

- Tính lại độc lập: run22 10/10, 11 slot, playWait [291,217,15,50,29,150,92,5,37,50,45]
  max 291, pauseWait max 63, G4 PASS 22:59:40.063Z R=0,51, report mtime 23:01:06.877Z;
  run21 G4 PASS 21:42:45.084Z, không report; run23 không có thư mục; driver lần 1
  22:53:04Z / lần 2 22:56:53Z; Wilson 2/35 [1,6,18,6]%, 2/36 [1,5,18,1]%, 2/34
  [1,6,19,1]%; CDP thô 8/6/0/0=14, sạch 7/5/0/0=12 (sentinel R0 idx24 317 ms, R1 idx6
  385 ms, e4skip −1→1); trusted-ĐC 22/33 (R0 9/13, R1 12/19, R2 1/1), trusted-old 0,
  distinct_strict=1, bar 33 (lưu ý: 300 dòng "gap " gồm 8 dòng tóm tắt, 292 dòng
  draws-gap thật); 4990 ms R1 worker max r-gap relPlay [−292,4698] pre-play, in-play
  max 1774, top-diff 2408/3304/653/113.
- ENOSPC: trần 63756; headroom đo lại độc lập = 2433 (K8: 2539/2537 — chênh ~105 do dao
  động cell khác, kết luận không đổi: 2433 < 3156 = 2 vite, 1 vite 1578 vừa); log 2-vite
  T0 14 / T1 1592 (vite 1578) / T2 crash ENOSPC `store.nestedGuard.test.ts` / T3 14,
  0 vite sót. Cụm "c2 thiếu 7 B-cap" có nguồn từ J4 LIMITS (108/115) — không phải lỗi K8.
- Batch 2 entry NUL (addendum + LIMITS), chỉ docs.

## 2. Kiểm cây gộp cuối đợt (K9 chạy lại, boot #37)

- **27/27 suite exit 0** (`round109-k9-suites.log`, 01:37:41–01:41:27Z, script
  `round109-k9-verify.sh` kế thừa từ J9 đợt 108):
  tsc web 0 lỗi; tsc desktop 0 lỗi; vite build PASS 6,36 s (chạy tay riêng 6,67 s);
  playheadHold90R2 75 passed (hold 75/75); playheadPacing54K9 19 pass 0 fail
  (pacing 19/19); previewEngine 27 test passed; seek exit 0; seekSkipRender86N3
  exit 0; previewLoop50F2 exit 0; ghostBlend.probe 15 kiểm chứng xanh;
  rvfcClipWindow102D3 exit 0; driftConfirmSkip103E4 exit 0; css60 PASS (60/60);
  css61 PASS (60/60); P7-esbuild 8/8 pass; orphans (binOrphan60Q7) 17 pass 0 fail;
  r6 i18n check PASS; U4 failfast 141 pass 0 fail; media-tests 3/3 PASS
  (blobPrefetch 25 pass, captureThumb PASS 2 FAIL 0, retryPlay 7 pass);
  media-retry96X3 7 pass 0 fail; media-watchdog96X3 9 pass 0 fail; deint-verdict
  PASS; deint-verdict-100b7 PASS; armHeld99a3 PASS; vite-diagnosis-regex PASS;
  xvfb-lock PASS; test-preview-engine.sh 354 assertions pass.
- **O8 21/21 cả 2 engine** (`round109-k9-o8.log`):
  Chromium 21/21 pass, 0 fail (01:45:57Z, exit=0); WebKit 21/21 pass, 0 fail
  (01:48:00Z, exit=0).
  - Lần 1 Chromium fail do K9 chưa copy fixture (HARNESS LỖI: thiếu
    o8-white-720p-6s.mp4, o8-ball-720p-6s.mp4, o8-track-35-65.json trong SCRATCH)
    — copy từ `hidden_files/round87-o8/headed/` rồi chạy lại thì PASS. Đây là lỗi
    thao tác của K9 (J9 đã copy trước khi chạy), không phải lỗi sản phẩm.
  - Lần 1 WebKit fail do MiniBrowser không load được libevent-2.1.so.7 (mất sau
    reboot #37; script O8 không đặt LD_LIBRARY_PATH). Chạy lại với
    `LD_LIBRARY_PATH=<debroot>/usr/lib/x86_64-linux-gnu` (đúng cách probe104f5
    đặt ở dòng 254–255) thì launch OK và PASS 21/21. Wrapper MiniBrowser đã vá
    (K1) giữ lại path truyền vào — xác nhận vá có tác dụng. Ghi nợ: script O8
    WebKit nên tự đặt LD_LIBRARY_PATH debroot như probe104f5 thay vì trông chờ env
    ngoài (xem §5 mục 9).
- **preview.tsx md5 `ced42efd785724c8c0d1b16fc32c7341`** trước/sau suites + O8;
  chỉ preview.tsx đổi mtime từ 23:00Z (K1 toggle + restore — nội dung về nguyên trạng,
  md5 khớp); 0 file production khác đổi trong đợt. K1 toggle đã khôi phục, diff rỗng.
  K7 `vite.config.k7-temp.ts` đã xoá. Không sửa production trong đợt 109 ngoài toggle
  tạm của K1.

## 3. Đếm lại từ đĩa (batch chờ push)

- round106: 9 batch / 21 entry / 21 unique. round107: 10 batch / 21 entry / 21 unique.
  round108: 10 batch / 17 entry / 17 unique.
  106+107+108 gộp: 29 batch / 59 entry / 57 unique (`PHASE9_GAP_ANALYSIS.md` xuất hiện
  3 batch → trùng 2) — KHỚP J9.
- round109 (8 luồng, chưa tính K9): 8 batch / 14 entry / 14 unique
  (K1 1, K2 4, K3 2, K4 2, K5 1, K6 1, K7 1, K8 2), 0 workflow, 0 binary,
  0 trùng với 106–108.
- K9 batch này: 1 entry (LIMITS này) → đợt 109: 9 batch / 15 entry / 15 unique.
- **Tổng chờ push: 38 batch / 74 entry / 72 file duy nhất + 1 file oversize**
  `benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B, vẫn chờ xử lý).
  0 thiếu, 0 workflow, 0 binary trong batch đợt 109. HEAD vẫn a7308ee9. KHÔNG push.

## 4. Poll + reboot

- Poller `poll-k9.sh` (600 s/lần, tối đa 72 lần): POLL#0–#8 boot #36 (22:53:56Z),
  reboot #37 = 2026-11-14 00:55:42Z (gap #36→#37 = 2h01'46", trong dải chứng nhận
  [19'07", 3h14'08"] và trong dải cơ học K6 cho #37 [23:13:03Z, 02:08:04Z]);
  poller restart 00:57:13Z; POLL#9–#11 boot #37. Cờ done: K8 23:54:39Z 13/11,
  K6 00:07:29Z, K5 00:24Z, K4 00:33Z, K2 ~00:35–00:43Z, K3 00:59:23Z, K7 01:00Z,
  K1 01:26Z (8/8 đủ 01:31Z). Không tạo hộ cờ luồng nào.
- Boot #37 hiện tại vẫn đứng lúc viết LIMITS này (uptime -s 00:55:42Z, boot_id
  a7bdedd2-1f2f-4eb0-8dc5-3898c2719b99).

## 5. Nợ mở (cho đợt sau — gộp từ LIMITS các luồng + LIMITS gộp 108 §4)

1. **G1 + mù #22 — chờ user quyết** (G5/M2; mù #22 cửa sổ lý thuyết nay ≤78 s).
2. **Re-arm E4:** K1 verdict "có đóng góp" (Fisher chính p=0,0924 chưa đạt 0,05) —
   cần sửa E4 + unit test + lượt A/B xác nhận độc lập (2+2) trên cây đã sửa trước
   khi coi là đóng hẳn. Cơ chế chưa chứng minh (gợi ý: E4 ức chế re-arm).
3. **2 MiB:** error không phải điều kiện cần (K2); còn mở: điều kiện cần thật của
   bogus là gì; H2C8 chưa chạy; chặn ring lúc tạo element chưa giữ được mức.
4. **Zombie gate (b):** dạng mạnh đã quan sát được 1 gap (K3, R2) — còn mở: tần suất
   thấp (1/7 lượt J3+K3); bar CDP chưa bao giờ bắn trong dải (0/3 lượt K3); bracket
   614 ms của gap dạng mạnh (đăng ký bracket ≤300 ms nếu muốn bar chặt hơn).
   Stall chuyển clip 5 s tại biên 60 s (K3 R3) chưa điều tra.
5. **Blur:** B-band ĐẠT BAR (đợt 108, đóng ở cấp luồng). Cụm A E6 vẫn mở (7/7
   Nhãn-đúng, cần 1 sự kiện nữa → 8/8); H-alt-weights; lệch g triple +0,029;
   bar "presented trong ±1" cần hiệu chuẩn lại theo tải.
6. **Ghost:** flip-leg ĐÓNG; **F6' MỞ MỘT PHẦN** — cần đúng 1 lượt xác nhận lúc yên
   (script `run-k7-quiet.sh` + `poll-confirm-k7.sh` đã sẵn). Nhãn ghost WebKit nhiễu
   (clean distinct 43,1%); capture lag trên đường tick (lệch tới 18 frame); cửa sổ
   blend WebKit không ổn định (spread median 47,4); ngưỡng tickCost WebKit cần hiệu
   chuẩn riêng (median 66 ms vs Chromium 11,4 ms).
7. **Harness:** bar E1 tải nặng vẫn 6/7 (K5: 3 lần chết trước G4); flake gộp 2/35 =
   5,7%; keydown gộp 56/748/1496 max 2197 ms.
8. **EPERM:** probe #28 xong, mù #27 ĐÓNG HOÀN TOÀN (K6). Probe #29 + mù #28 cho
   đợt sau. Cron riêng 10 phút vẫn chờ user quyết.
9. **Hạ tầng:** ENOSPC inotify watchers 63756 là nghẽn (K1/K4/K5/K7 đều gặp; workaround
   `server.watch.ignored: ["**/**"]` = 0 inotify FD đã kiểm chứng — nên áp dụng cho
   mọi vite tạm). Sau reboot #37: wrapper MiniBrowser đã vá tạm 1 dòng (tồn tại qua
   reboot); symlink GStreamer hệ thống là ephemeral (mất sau reboot sau — cần sửa bền
   vững: apt-install hoặc đưa plugin vào debroot path probe đọc). Vite log ghi đè (>)
   làm mất bằng chứng ENOSPC (K4/K7) — vòng sau nên append log vite theo lượt.
   Script đo: `RC=$?` sau pipe qua tee lấy exit code của tee (K7) — dùng PIPESTATUS.
10. **Birefnet 0 lần thành công** — chỉ thử lại khi RAM đổi (ngưỡng guard 6 GB);
    u2net là fallback chính thức. **TTS 39 CẤM kiểm lại. ci-security.yml vẫn 403 chờ
    user. Release gate không đổi: KHÔNG release/tag cho đến khi ngang/hơn CapCut.**

## 6. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| K1 Re-arm A/B 4+4 | on 6/284, off 0/159; Fisher p=0,0924; Poisson (nhị thức) 0,0335 / Poisson đúng 0,0348 | §1.1; recount-k1.py/.txt |
| K2 2 MiB | 18 case khớp; E r2 bác error là điều kiện cần | §1.2; recount-k2.py/.txt |
| K3 Zombie gate (b) | Dạng mạnh 1 gap R2, 3 sampler đồng thuận; dial 49/50 snap | §1.3; recount-k3.py/.txt |
| K4 Blur cụm A | Số liệu khớp 100% (code riêng); E6 7/7, vẫn mở | §1.4; recount-k4.py/.txt |
| K5 Harness E1 | 3 lần chết trước G4; bar vẫn 6/7 | §1.5; (verdict-k8-k6.txt) |
| K6 EPERM | Probe #28 ok=2 fail=0; mù #27 đóng hoàn toàn | §1.6; recount-k6.py/.txt |
| K7 F6' WebKit | Bar số 78/78 = 100% cả (1)/(2); F6' mở một phần (thiếu lượt yên) | §1.7; recount-k7.py/.txt |
| K8 Đính chính 108 | 7/7 khớp; ENOSPC headroom 2433 | §1.8; recount-k8a/b.py/.txt |
| Cây cuối đợt | tsc web 0, desktop 0; vite build PASS; test-preview-engine 354 PASS; preview.tsx ced42efd | §2 |
| Batch chờ push | 38 batch / 74 entry / 72 unique + 1 oversize (6.370.678 B) | §3 |
| Reboot #37 | 2026-11-14 00:55:42Z, gap 2h01'46" | §4; poll.log |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round109-k9-verify.txt`
— chứa LIMITS này (1 file text).

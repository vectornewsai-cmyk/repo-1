# PHASE9_ROUND106_H3_ZOMBIE_LIMITS — Zombie gate (b): seek-across y1 xong, kill trực tiếp đo được lần đầu, gate (b) vẫn mở

> Luồng H3 gốc bị reboot #33 (14:50:59Z) cắt ngang trước khi viết LIMITS/batch.
> File này là **late merge** (13/11/2026 ~23:30 +07, boot mới
> `63a52041-cdb6-4824-bb17-32c8f5aba5ee`): tính lại độc lập từ dữ liệu thô đã
> có trên đĩa, KHÔNG chạy probe live mới. Mọi số dưới đây đã kiểm chứng 2
> lần độc lập: chạy lại `round106-h3-analyze.py` (byte-identical với
> `round106-h3-analysis-y1.txt` gốc) + script kiểm chứng mới viết riêng
> `round106-h3-verify-independent.py` (kết quả khớp 100%).
> KHÔNG push. KHÔNG release/tag. Dữ liệu thô:
> `hidden_files/round106-h3/` (driver-y1.log, driver-y2.log,
> round106-h3-analysis-y1.txt, round106-h3-analyze.py,
> round106-h3-verify-independent.py, chr-mixedalt-h3y1/,
> chr-mixedalt-h3y2/).

## 0. Tóm tắt

- **y1 seek-across: 23/23 seek bắn đủ** (driver đã sửa — F4 đợt 104 chỉ bắn
  2/23). 24 clip c0–c23 (3 s/clip, clip chẵn blur, clip lẻ không blur),
  Chromium 158.0.8127.18, config scroll-mixed-alt, probe mới
  `probe106h3-frame-parity.mjs`, cây preview.tsx f0b9e496 (G1 land F8).
- **Zombie Δ = 0 ở 12/12 biên đo được.** 11 biên còn lại không đo được
  (clip lẻ không có dbg/pump — giới hạn phương pháp, không phải bằng chứng).
- **Capture trong cửa sổ clip lẻ: 0/12 cửa sổ, 0 capture** (nối tiếp G2:
  gộp 0/36 cửa sổ).
- **Độ trễ kill TRỰC TIẾP (E4b) — lần đầu đo được:** n=12, min 0,10 /
  **median 0,20** / max 1,00 / mean 0,27 ms. **Caveat bắt buộc kèm theo:**
  chỉ 12/23 seek có kill entry — toàn seek lẻ (k=1,3,…,23); 11 seek chẵn
  không có kill entry. Mẫu lệch có cấu trúc (xem §2.4), đừng trích
  "kill 0,2 ms" mà không kèm "n=12/23, chỉ seek lẻ, chỉ clip blur".
- **gstd D = 0/787 caps** (mọi clip) — D floor post-fix vẫn đứng.
- **E4a:** tick stale **0/11**; cap STALE-CANVAS 23/23 nhưng cap có thể là
  frame giữ trước nhảy — chỉ tick mới chứng minh draw (theo chính phân
  tích H3).
- **Gate (b) — đóng băng canvas trong khi playhead chạy tự do: VẪN CHƯA
  QUAN SÁT ĐƯỢC.** Test draws-gap chạy thêm trên dữ liệu y1 (mục mới so
  với analysis gốc): 4 gap >300 ms, 0 gap có gate-(b) skips + playhead
  chạy tự do bền vững (spread=False hết). Đây là lượt thứ 5 liên tiếp
  không quan sát được (e4y1/e4y2/f4y1/f4y2 + h3y1).
- **y2 pause-burst (rerun f4y3): CHẾT DO REBOOT, 0 dữ liệu dùng được**
  (chỉ có vite-attempt1.log; không có results JSON, không có action nào).

## 1. Phương pháp và điều kiện chạy

### 1.1 y1 — chr-mixedalt-h3y1 (xong)

- Thời gian: 14:43:07–14:47:59Z, boot cũ `75697729-9014-47e0-a0cc-c1aad4926fe5`.
  Vite :5590, Xvfb :194, Chromium 158.0.8127.18, app boot OK 14:43:35Z.
- Seed: `stripes-scroll.mp4`, 24 clip c0–c23. Sampler frame-sync (rAF +
  10 ms, drawImage wrapper) + state100 (25 ms) + stall watcher. Driver
  in-page 10 ms, mode=seek-across.
- Driver: **23 actions (23 seek-across, 0 pause-burst, 0 missed-window)**,
  seek từ 2,067 s → 3,15 s, 5,033 s → 6,15 s, …, 68,167 s → 69,15 s
  (mỗi biên nhảy qua 1 clip 3 s, đáp xuống đầu clip lẻ).
- Kết quả thô (driver log + JSON): caps=787, pump=362 (capture 324,
  skip-stale-frame 38), state100=665 mẫu, tick=417, draws=2000/2368,
  delayRvfc=0, delayed=[], liveness=null, pageErrs=0, stallBlocks=[],
  silentEngine=false, collisions=0, tagAgree=585/1888, tagDisagree=1303.
- **Tải lúc phát: load1=6,35** (chờ yên 120 s: 10,71 → 8,8 → 7,18 → 6,33
  → 6,35, không xuống ngưỡng nên vẫn phát; log ghi rõ "lượt này có thể
  nhiễm tải"). Mem lúc phát: 5722/7934 MB đã dùng. Tải cao làm sampler
  thưa dần về cuối lượt (xem §4.3).
- `disableOwnerKill=false`, `disableClipCheck=false`, `sysload=0`.

### 1.2 y2 — chr-mixedalt-h3y2 (chết do reboot #33)

- Thời gian: 14:49:04–14:51:28Z (giờ đồng hồ boot cũ; xem §4.4), vite :5591,
  Xvfb :194, Chromium 158.0.8127.18, app boot OK 14:49:17Z, mode=pause-burst
  (rerun f4y3). Chờ yên 120 s (load1 5,32 → 6,35 → 8,46 → 6,55 → 5,06).
- Log dừng ở dòng cuối "load lúc phát" 14:51:28Z — ngay sau đó reboot #33
  giết driver, trước khi action pause-burst nào chạy. Thư mục y2 chỉ có
  `vite-attempt1.log` (72 byte): **không có frame-parity-results.json,
  không có frame-parity-log.txt, không có action/cap nào.**
- Kết luận y2: **không dùng được, không tính vào kết quả nào.** Rerun f4y3
  vẫn chưa xảy ra — nợ cho đợt sau.

### 1.3 Cách tính lại (late merge)

- Chạy lại `round106-h3-analyze.py chr-mixedalt-h3y1` → stdout
  **byte-identical** với `round106-h3-analysis-y1.txt` gốc (259 dòng).
- Script mới `round106-h3-verify-independent.py` (viết lại từ đầu, không
  dùng code analyzer gốc): tính lại seek, b_k, zombie Δ, capture cửa sổ
  lẻ, kill latency, gstd D, E4a tick, + test draws-gap gate (b) theo
  phương pháp F4 (cài lại). **Tất cả khớp với analysis gốc.**
- Baseline gstd: noblur chr round95-w3 (r1+r2), n=90, mean=81,17, sd=0,32,
  CV=0,40%. Dải D = ratio 0,27–0,34 (như các đợt trước).

## 2. Kết quả y1 (đã kiểm chứng độc lập)

### 2.1 Zombie Δ từ state100 — 0 ở 12/12 biên đo được

- Mốc biên b_k (mẫu state100 đầu tiên có ph ≥ 3k): xác định đủ 23/23
  (b_1=5303 ms … b_23=51732 ms relPlay; nội suy tuyến tính cho b_k_noisuy).
- Zombie Δ = caps(clip k−1) tăng trong [b_k, b_{k+1}):
  **12/12 biên đo được có Δ=0** (c0→c1: 29→29, c2→c3: 30→30, c4→c5: 55→55,
  c6→c7: 40→40, c8→c9: 45→45, c10→c11: 38→38, c12→c13: 30→30, c14→c15:
  14→14, c16→c17: 14→14, c18→c19: 13→13, c20→c21: 9→9, c22→c23: 7→7).
- **11/23 biên KHÔNG đo được** (k=2,4,…,22): dbgFinal chỉ có clip chẵn,
  clip lẻ không có pump/dbg nên caps_at=None. Đây là giới hạn của probe
  (chỉ clip blur mới có pump để đếm), không phải bằng chứng zombie vắng
  mặt ở các biên đó. Nói đúng: "zombie Δ=0 ở 12/12 biên đo được", không
  nói "0 ở 23/23 biên".
- dbgFinal: mọi clip chẵn caps 7–55, lastFrame 49–65, dups=0, clears=0,
  active=False, fb='seek-inactive'.

### 2.2 Capture trong cửa sổ clip lẻ — 0/12

- Mọi capture trong cửa sổ clip lẻ (không blur) đều là zombie/straggler
  của clip chẵn trước: **tổng 0 capture ở cả 12 cửa sổ** (c1, c3, …, c23),
  0 post-seek (frameIdx<45), 0 pre-seek straggler (frameIdx≥85), 0 giữa
  (45–84). Nối tiếp G2 (0/24) → gộp **0/36 cửa sổ, 0 capture**.
- skip-clip-inactive: **0**. B5 seekSkip (tick bỏ vẽ do seeking) tăng
  đều theo cửa sổ: delta 1–9/cửa sổ (c22 +9 cao nhất), tổng state100
  e4skip 1→23 (delta 22); `seekSkipTicks86N3`=93; `driftConfirmSkips103e4`
  cuối lượt=23.

### 2.3 gstd — D = 0/787

- Theo clip: chẵn A 50–76% / B 7–62% / C 4–36%, D=0; lẻ C 95–98%
  (A ~2–5%, B 0–5%), D=0. Tổng **D=0/787 caps, out=0**.
- D floor post-fix vẫn đứng (như G2/A6). B-band lẻ c20 (B 62%) là nhiễu
  mẫu nhỏ (n=13), không phải tín hiệu mới — không đào sâu ở luồng này.

### 2.4 Độ trễ kill TRỰC TIẾP (E4b) — lần đầu đo được, mẫu lệch có cấu trúc

- Định nghĩa: kill latency = killTs − tSeekRaw (timestamp kill trực tiếp
  trong `seekKills103e4`, đối chiếu seek qua ph target ±0,05 — snap frame
  R1-055: target 3,15 → kill ph 3,1667 = +1 frame @30fps).
- **n=12, min 0,10 / median 0,20 / max 1,00 / mean 0,27 ms.**
  Từng ca: k=1: 0,30; k=3: 0,20; k=5: 0,20; k=7: 0,20; k=9: 0,30; k=11:
  0,20; k=13: 0,10; k=15: 0,10; k=17: 0,10; k=19: 0,30; k=21: 1,00;
  k=23: 0,20 ms (tSetMs 0,1–1,1 ms, tương quan với latency).
- **Mẫu lệch — đã giải thích (mới so với H9 "chưa giải thích"):**
  JSON chỉ có đúng 12 kill entry (`seekKills103e4`, 12 mục), và cả 12 đều
  kill clip CHẴN (c0, c2, …, c22). 11 seek chẵn (k=2,4,…,22) đáp xuống
  clip chẵn → clip bị kill là clip LẺ (c1, c3, …, c21) — clip lẻ không
  blur, không có pump, nên không có kill entry nào được log. Tương tự
  `fbAt` chỉ có 12 key (clip chẵn) và `dbgFinal` chỉ có 12 dòng (clip
  chẵn). **Kill latency trực tiếp chỉ đo được cho clip blur (có pump);
  độ trễ kill clip không-blur là KHÔNG ĐO ĐƯỢC (không có gì để quan
  sát), không phải bằng 0.** Đừng suy ra "mọi kill đều 0,2 ms".
- So sánh: E4 gián tiếp qua A6 là 23–123 ms (đo qua proxy fbAt−b_k, gồm
  cả độ trễ sampler + seek-landing). Số trực tiếp 0,20 ms nhanh hơn
  ~100× — **số E4 cũ không phải độ trễ kill thật**, nó đo qua proxy.
  Số trực tiếp mới (n=12, chỉ clip blur) mới là độ trễ kill của
  owner-kill đồng bộ. Cả hai số cùng đứng, đo hai thứ khác nhau.
- Kill latency gián tiếp fbAt−b_k (để đối chiếu): −84..+12 ms
  (đa số −20..+15 ms; c22: −84 ms là ngoại lệ — sampler thưa cuối lượt,
  xem §4.3). fbAt−b_k_noisuy: −52..+30 ms.
- B5 (kill qua pump callback): **0/12 biên** có skip-inactive/
  skip-clip-inactive đầu tiên sau biên trong cửa sổ — pump chết không qua
  callback (kill đồng bộ trước khi pump kịp chạy), hoặc chưa chết. Cửa sổ
  phơi: pump event đầu tiên sau seek ở +1937..+2901 ms (đa số decision
  capture; k=21 là skip-stale-frame; k=23 không có pump sau seek).
- E4c: `driftConfirmSkips103e4` cuối lượt = 23; `seekSkipTicks86N3` = 93.

### 2.5 E4a — stale-draw ở tick đầu sau nhảy

- **Tick: examined 11, stale 0.** Chỉ 11/23 cú seek có tick record trong
  1500 ms sau seekRel chính xác (từ tSeekRaw − playT0raw); 12 cú còn lại
  không có tick record nào sau seek (tick thưa, n=417). Tick đầu sau seek
  ở +97..+1165 ms, frameIdx 5–29, expected ~5–28, viaRvfc=1, đều ok.
- Cap: examined 23, **STALE-CANVAS 23/23** (cap đầu sau seek +3,7..+67,9
  ms, frameIdx 61–67, expected ~5,0, tag=tick). Nhưng cap là sampler đọc
  lại tick record mới nhất lúc lấy mẫu — frame 61–67 là frame giữ từ
  TRƯỚC cú nhảy, không chứng minh draw stale. Chỉ tick mới chứng minh
  draw, và tick 0/11 stale. Kết luận E4a: **không có draw stale sau seek
  trong 11 cú đo được; 12 cú còn lại không đo được (thiếu tick).**
- RingFirstAt: offset trong clip âm và loe dần (c0: +3542 ms; c2: +1473;
  c4: −719; …; c22: −16036 ms) — artifact của mốc relPlay tích lũy, không
  phải mất frame đầu clip (như các đợt trước đã ghi nhận).

## 3. Gate (b) — VẪN CHƯA QUAN SÁT ĐƯỢC (lượt thứ 5)

### 3.1 Định nghĩa (theo G2 §3)

Gate (b) = canvas đóng băng trong khi playhead chạy tự do. Quan sát được
khi và chỉ khi có draws-gap >300 ms đồng thời (a) e4skip tăng trong gap
(gate (b) skip) VÀ (b) playhead chạy tự do bền vững trong gap (spread
test: mẫu ph giữa gap nằm nghiêm ngặt giữa mẫu đầu–cuối; một bước nhảy
seek-landing + plateau KHÔNG tính — đính chính G2 §3.1 rút 62 ca cũ về 0).

### 3.2 Test draws-gap trên dữ liệu y1 (mới — analysis gốc không có mục này)

- draws=2000 (drawsTotal 2368, drawsKept 2000). **4 gap >300 ms:**
  393 ms (skips=1, dph=0,10, spread=False, n_inside=4),
  473 ms (skips=1, dph=0,10, spread=False, n_inside=6),
  342 ms (skips=1, dph=0,10, spread=False, n_inside=6),
  429 ms (skips=1, dph=1,30, spread=False, n_inside=7).
- **0 gap có gate-(b) skips > 0 VÀ spread=True.** Gap 429 ms có dph=1,30
  nhưng spread=False — đúng mẫu "1 bước nhảy + plateau" mà G2 đã loại
  (playhead nhảy 1 lần rồi đứng yên, không phải chạy tự do bền vững).
  Các gap còn lại dph=0,10 (playhead đứng yên).
- max gap 473 ms, nhỏ hơn max freeze thật của F4 (189–321 ms) cùng bậc.
  Không có gap nào dài như e4y1 clip-18 (3107 ms, cũng đã loại là
  nhảy + plateau).
- **Kết luận: gate (b) vẫn chưa quan sát được sau 5 lượt
  (e4y1/e4y2/f4y1/f4y2 + h3y1).** Chưa quan sát được ≠ đã bác bỏ: phép đo
  thiếu độ nhạy — state100 thưa (xem §4.3) làm spread test mất lực ở
  các gap ngắn; và y1 là seek-across (seek liên tục), không phải lượt
  máy yên chuyên đo freeze như F4. Cần lượt máy yên + state100 dày
  (nợ §5.1).

### 3.3 Gate (b) có bắn không? Có — nhưng không kèm freeze-chạy-tự-do

- Counter gate vẽ E4 vẫn sống: `driftConfirmSkips103e4` = 23 cuối lượt,
  state100 e4skip 1→23. Gate (b) bắn (skip render khi seeking), nhưng
  không có ca nào freeze dài mà playhead chạy tự do bền vững. Như G2:
  "gate (b) có bắn, không phải gate chết".

## 4. Giới hạn và caveat (trung thực)

### 4.1 Build identity của y1 không rõ ràng — confound lớn nhất

- y1 ghi trước chạy: preview.tsx mtime 14:42:56Z, **md5 `e5e1d292…`**.
  File đổi giữa lượt lúc **14:43:56Z → md5 `ced42efd…`** (H5 sửa 6 comment
  "0/30 clean", chỉ comment, không đổi logic — theo H5 LIMITS §2; marker
  104f3 vẫn 50 dòng / 58 lần). `mtimeChangedMidRun=true`,
  `mtimeAfter` = ced42efd.
- Vấn đề: md5 trước chạy `e5e1d292…` **không khớp** land state `f0b9e496…`
  (G1 land F8) mà H5/H1 ghi lúc bắt đầu — tức file đã đổi một lần nữa
  trước 14:42:56 bởi luồng khác (không rõ luồng nào, không có git để
  diff; repo-1 local không có .git). Chuỗi đổi không khôi phục được:
  f0b9e496 → ? → e5e1d292 (14:42:56) → ced42efd (14:43:56, H5 comment).
- Hệ quả: **không quy được số y1 về đúng một md5.** Vite dev HMR có thể
  đã reload module giữa app boot (14:43:35) và lúc phát (14:45:46) —
  các seek đo sau 14:45:46 nhiều khả năng chạy trên ced42efd, nhưng
  không chứng minh được từng seek chạy build nào. Số y1 (zombie Δ,
  kill latency, gstd) vẫn tự nhất quán trong một phiên liên tục, không
  page error, nhưng **ghi nhận là đo trên cây "e5e1d292→ced42efd (đổi
  giữa lượt)", không phải trên một md5 duy nhất.** H9 §2.3 không nhắc
  điểm này — đây là đính chính của late merge.
- H9 đã loại các lượt H1 vì cùng lý do (H5 sửa file giữa lượt); y1 của
  H3 cũng nhiễm cùng confound nhưng là lượt duy nhất có dữ liệu zombie/
  kill đầy đủ của đợt 106 nên vẫn ghi nhận, kèm caveat này thay vì loại.

### 4.2 Mẫu kill latency lệch (đã giải thích §2.4)

- n=12/23, chỉ seek lẻ, chỉ clip blur. Không đo được kill clip
  không-blur. Đừng trích median 0,20 ms tách khỏi caveat.

### 4.3 Sampler thưa dần về cuối lượt — độ nhạy giảm

- state100 quanh biên: n_mau trong [b_k−1000, b_k+1000] giảm từ 26–42
  (biên đầu) xuống 12–15 (biên c20–c23); gap_max giữa 2 mẫu liên tiếp
  lên tới 400 ms (c21→c22), gap_med cuối lượt 102–130 ms (đầu lượt
  38–75 ms). Nguyên nhân: tải cao (load1 6,35 lúc phát, §1.1) + playhead
  chạy 0,25–0,76× wall.
- Ảnh hưởng: (a) b_k nội suy kém chính xác hơn ở biên cuối (fbAt−b_k
  c22 = −84 ms là triệu chứng); (b) spread test gate (b) mất lực khi
  n_inside nhỏ; (c) zombie sống <~400 ms ở biên cuối có thể lọt qua
  state100 — nhưng capture-window check (§2.2) dùng pump event trực
  tiếp, không qua state100, nên kết luận 0 capture không bị ảnh hưởng.
- E4a tick chỉ đo được 11/23 cú vì tick thưa (n=417).

### 4.4 Giờ y2 và reboot #33 — đính chính đồng hồ

- `uptime -s` trên boot hiện tại: **2026-11-13 14:50:59** — reboot #33
  đúng 14:50:59Z (khớp log vòng lặp: gap #32→#33 chỉ 19'07", ngắn nhất
  từng ghi). Nhưng driver-y2.log có dòng tới 14:51:28Z — **đồng hồ boot
  cũ chạy nhanh ~29 s** so với giờ thật (cùng hiện tượng H6 đã đính
  chính cho reboot #29: đồng hồ boot cũ nhanh ~25–27 s). 14:51:28Z
  theo đồng hồ cũ ≈ 14:50:59Z giờ thật = đúng lúc reboot. Không có
  mâu thuẫn sau khi hiệu chỉnh; mọi giờ trong §1.2 hiểu theo đồng hồ
  boot cũ.
- Boot hiện tại (late merge): `63a52041-cdb6-4824-bb17-32c8f5aba5ee`,
  bắt đầu 14:50:59Z.

### 4.5 Những gì KHÔNG đo

- y2 pause-burst / rerun f4y3: 0 dữ liệu (chết do reboot).
- y3 seek-across lặp (kế hoạch H3): không chạy (hết phiên do reboot).
- Kill latency clip không-blur: không đo được (§2.4).
- Zombie Δ ở 11 biên lẻ→chẵn: không đo được (§2.1).
- Gate (b): chưa quan sát được (§3) — cần lượt máy yên + state100 dày.
- tagDisagree 1303/1888 (tag vs rvfc lệch) là hiện tượng đã biết từ các
  đợt trước, không phải phát hiện mới của H3; không đào sâu ở đây.

## 5. Nợ mở (cho đợt 107)

1. **Gate (b) vẫn mở (lượt thứ 5 không quan sát được).** Cần lượt máy
   yên + state100 dày, chuyên đo freeze (không seek-across): draws-gap
   spread test + dense-freeze như F4/G2. Tiêu chí spread (G2 §3.1) giữ
   nguyên; đừng dùng lại tiêu chí dph>0,30 s cũ (đã rút về 0).
2. **Kill trực tiếp mẫu lệch:** cần probe log kill cho cả clip
   không-blur (hoặc xác nhận bằng code rằng kill path chỉ tồn tại cho
   clip có pump — nếu đúng thì n=12 là đủ cho clip blur, và nợ này đóng
   bằng đọc code, không cần đo thêm). Đừng trích median 0,20 ms tách
   khỏi "n=12/23, chỉ seek lẻ".
3. **Rerun f4y3 (pause-burst) chưa xảy ra** — y2 chết do reboot. Chạy
   lại khi có lượt mới.
4. **y3 seek-across lặp chưa chạy** — lặp y1 để kiểm tra ổn định số
   kill/zombie (đặc biệt median 0,20 ms có lặp lại không).
5. **Build identity giữa lượt:** các luồng song song cùng sửa
   preview.tsx làm md5 trước/sau chạy lệch nhau (H1 bị loại, H3 nhiễm
   confound §4.1). Đợt sau: đóng băng file trước khi probe chạy, hoặc
   ghi md5 vào từng seek (không chỉ đầu/cuối lượt).
6. **Nợ đứng yên đợt 105** (xem LIMITS H9 §5): re-arm, 2 MiB, B-band
   p=0,35, ghost flip-leg đo lại lúc máy yên, G4 flake cần tải nặng,
   EPERM probe #26 + mù #24, reboot phá sàn gap — không thuộc H3.

## 6. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Seek bắn đủ | 23/23 | driver-y1.log; JSON driverActions |
| Zombie Δ | 0 ở 12/12 biên đo được | state100, §2.1 |
| Capture cửa sổ clip lẻ | 0/12, 0 capture | pump events, §2.2 |
| Kill latency trực tiếp | n=12, median 0,20 ms (0,10–1,00) | seekKills103e4, §2.4 |
| gstd D | 0/787 | baseline W3, §2.3 |
| E4a tick stale | 0/11 | tick records, §2.5 |
| Gate (b) draws-gap | 4 gap >300 ms, 0 spread=True | draws, §3.2 |
| y2 pause-burst | 0 dữ liệu (reboot #33) | driver-y2.log, §1.2 |
| Kiểm chứng độc lập | analyzer chạy lại byte-identical; script mới khớp 100% | §1.3 |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round106-h3-zombie.txt`
— `docs/PHASE9_ROUND106_H3_ZOMBIE_LIMITS.md`,
`apps/web/scripts/probe106h3-frame-parity.mjs` (driver probe mới của H3).
Analyzer + script kiểm chứng nằm ở `hidden_files/round106-h3/` (ngoài
repo, không đưa vào batch push).

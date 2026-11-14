# PHASE9_ROUND107_I4_ZOMBIE_LIMITS — Zombie gate (b) lượt thứ 6: y3 lặp y1, kill không-blur đóng bằng đo + code, gate (b) vẫn mở

> Luồng I4, đợt 107. Lượt cron 00:35 +07 14/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.
> Không sửa production** — chỉ probe mới (`probe107i4-frame-parity.mjs`,
> copy probe106h3 + 2 thay đổi đã đăng ký trong prereg) + analyze mới.
> Prereg (viết TRƯỚC khi chạy):
> `hidden_files/round107-i4/prereg-i4.md`. Dữ liệu thô:
> `hidden_files/round107-i4/` (driver-y3.log, round107-i4-analysis-y3.txt,
> round107-i4-analyze.py, chr-mixedalt-i4y3/).

## 0. Tóm tắt

- **y3 seek-across: 23/23 seek bắn đủ, 0 missed-window.** 24 clip c0–c23
  (3 s/clip, clip chẵn blur, clip lẻ không blur), Chromium 158.0.8127.18,
  config scroll-mixed-alt, probe mới `probe107i4-frame-parity.mjs`, cây
  preview.tsx `ced42efd…` trước = sau (mtimeChanged=false — lần đầu tiên
  trong chuỗi zombie không có confound build-identity giữa lượt).
- **Zombie Δ = 0 ở 12/12 biên đo được** (như y1). 11 biên còn lại không đo
  được (clip lẻ không có dbg/pump — giới hạn phương pháp, không phải bằng
  chứng).
- **Capture trong cửa sổ clip lẻ: 0/12 cửa sổ, 0 capture** (gộp y1: 0/24).
- **Kill trực tiếp blur lặp lại y1: n=12, min 0,10 / median 0,20 / max 0,30 /
  mean 0,19 ms** (y1: median 0,20, max 1,00). Median 0,20 ms ổn định qua 2
  lượt độc lập.
- **Kill clip KHÔNG-blur — NỢ H3 §5 MỤC 2 ĐÓNG (bằng đo + đọc code):**
  killsDelta = 1 ở 12/12 seek lẻ (clip cũ blur, pump active) và = 0 ở
  11/11 seek chẵn (clip cũ không-blur, clip lẻ không có entry nào trong
  `__vcutMotionBlurSnapshots`). tSetMs seek chẵn median 0,20 ms (n=11)
  ≈ seek lẻ median 0,20 ms (n=12). Căn cứ code §2.4: kill entry chỉ tồn
  tại cho clip có pump; clip không-blur không bao giờ có pump nên không
  có kill entry — không phải probe bỏ sót, không cần đo thêm.
- **gstd D = 0/935 caps** — D floor post-fix vẫn đứng.
- **E4a:** tick stale **0/11**; cap STALE-CANVAS 23/23 (cap là sampler đọc
  lại tick record tiền-seek — chỉ tick mới chứng minh draw, như H3).
- **Gate (b) — VẪN CHƯA QUAN SÁT ĐƯỢC, lượt thứ 6 liên tiếp**
  (e4y1/e4y2/f4y1/f4y2 + h3y1 + i4y3). Draws-gap >300 ms chỉ 1 gap
  (408 ms, skips=1, dph=1,27, spread=False, n_inside=7) — đúng mẫu "1 bước
  nhảy + plateau" mà G2 đã loại.
- **state100 "dày" CHỈ ĐẠT MỘT PHẦN (caveat chính của lượt này):** interval
  đặt 10 ms nhưng gap thực tế median 56 ms / p90 119 ms / max 385 ms.
  Dày hơn y1 (n_mau quanh biên 14–41, cuối lượt 14–19 so với 12–15 của
  y1) nhưng KHÔNG đạt 10 ms — sampler vẫn thưa do main thread bận, không
  phải do interval. Đừng trích "state100 10 ms" tách khỏi số thực tế này.

## 1. Phương pháp và điều kiện chạy

### 1.1 y3 — chr-mixedalt-i4y3 (xong, exit 0)

- Thời gian: probe khởi động 17:44:34Z; chờ yên 55 s (load1 2,31 → 2,65 →
  1,93); phát 17:45:57Z; driver xong 17:46:49Z; kết quả 17:47:53Z. Boot
  `63a52041-cdb6-4824-bb17-32c8f5aba5ee` (bắt đầu 14:50:59Z, reboot #33).
  Reboot #34 (dự báo ~16:51:58Z) KHÔNG xảy ra trong lượt này.
- Vite :5590, Xvfb :193, Chromium 158.0.8127.18, app boot OK 17:44:51Z.
- Seed: `stripes-scroll.mp4`, 24 clip c0–c23. Sampler frame-sync (rAF +
  10 ms, drawImage wrapper) + state100 (interval đặt 10 ms, xem §4.3) +
  stall watcher. Driver in-page 10 ms, mode=seek-across.
- Driver: **23 actions (23 seek-across, 0 pause-burst, 0 missed-window)**,
  seek từ 2,067 s → 3,15 s, 5,033 s → 6,15 s, …, 68,167 s → 69,15 s
  (mỗi biên nhảy qua 1 clip 3 s, đáp xuống đầu clip lẻ).
- Kết quả thô (driver log + JSON): caps=935, pump=449 (capture 435,
  skip-stale-frame 14), state100=825 mẫu, tick=448, draws=2000/2591,
  delayRvfc=0, delayed=[], liveness=null, pageErrs=0, stallBlocks=[],
  silentEngine=false, collisions=0, tagAgree=501/1892, tagDisagree=1391.
- **Tải lúc phát: load1=1,93** (cổng chờ yên load1<2,0; sibling i1 đã xong
  probe trước khi phát). Mem lúc phát: 5620/7934 MB đã dùng, khả dụng
  2314 MB. Load cuối lượt tăng lại 5,31 (sibling khác burst sau khi phát
  xong — không ảnh hưởng dữ liệu đã lấy).
- `disableOwnerKill=false`, `disableClipCheck=false`, `sysload=0`.
- Build identity SẠCH: mtimeBefore = mtimeAfter = `ced42efd…`,
  mtimeChanged=false. Đây là lượt zombie đầu tiên không nhiễm confound
  đổi file giữa lượt (đối chiếu H3 §4.1: y1 đổi e5e1d292→ced42efd giữa
  lượt; f4y1 đổi c2251e39→ca378bbf).

### 1.2 Thay đổi probe so với y1 (đã đăng ký trong prereg, trước khi chạy)

Probe `probe107i4-frame-parity.mjs` = copy probe106h3, `node --check`
PASS, diff chỉ 5 điểm (xem `diff` trong log luồng):
1. SCRATCH → `hidden_files/round107-i4`.
2. `setInterval(snap100, 25)` → **10 ms** (state100 dày cho spread test).
3. `result.state100Ms = 10`.
4. Tên driver `__vcut106h3Drv` → `__vcut107i4Drv`.
5. Mỗi driver action seek-across ghi thêm `killsBefore`/`killsAfter`/
   `killsDelta` (độ dài `__vcut103e4SeekKills` quanh setPlayhead) +
   `pumpActiveBefore` (clip nào có pump active lúc seek, đọc từ
   `__vcutMotionBlurSnapshots`).

### 1.3 Cách phân tích

- Script mới `round107-i4-analyze.py` (viết lại từ
  round106-h3-verify-independent.py, không dùng code analyzer gốc):
  seek, b_k, zombie Δ, capture cửa sổ lẻ, kill latency, kill-per-seek,
  gstd D, E4a tick/cap, draws-gap gate (b) theo phương pháp F4/G2, mật độ
  state100. Output: `round107-i4-analysis-y3.txt` (73 dòng, exit 0).
- Baseline gstd: noblur chr round95-w3 (r1+r2), n=90, mean=81,17, sd=0,32,
  CV=0,40%. Dải D = ratio 0,27–0,34 (như các đợt trước).
- Số bổ sung (fbAt−b_k, seekSkip delta, dbgFinal) tính lại từ JSON thô
  bằng script một lần, không qua analyzer gốc.

## 2. Kết quả y3

### 2.1 Zombie Δ từ state100 — 0 ở 12/12 biên đo được

- Mốc biên b_k (mẫu state100 đầu tiên có ph ≥ 3k): xác định đủ 23/23.
- Zombie Δ = caps(clip k−1) tăng trong [b_k, b_{k+1}):
  **12/12 biên đo được có Δ=0** (như y1; chi tiết từng biên trong
  analysis §2 — mọi cặp caps_at bằng nhau).
- **11/23 biên KHÔNG đo được** (k=2,4,…,22): dbgFinal chỉ có clip chẵn,
  clip lẻ không có pump/dbg nên caps_at=None. Giới hạn của probe, không
  phải bằng chứng zombie vắng mặt ở các biên đó.
- dbgFinal: mọi clip chẵn caps 13–52, lastFrame 60–65, dups=0, clears=0,
  active=False, fb='seek-inactive' **12/12** (y1 cũng 12/12
  seek-inactive; không có ca no-callback nào ở y3).

### 2.2 Capture trong cửa sổ clip lẻ — 0/12

- Mọi capture trong cửa sổ clip lẻ (không blur) đều là zombie/straggler
  của clip chẵn trước: **tổng 0 capture ở cả 12 cửa sổ** (c1, c3, …, c23),
  0 post-seek (frameIdx<45), 0 pre-seek straggler (frameIdx≥85), 0 giữa
  (45–84). Nối tiếp y1 (0/12) → gộp seek-across **0/24 cửa sổ, 0 capture**
  trên 2 lượt (h3y1 + i4y3). Riêng f4y1+f4y2 (tick-by-tick dưới tải,
  không phải seek-across) cũng 0/24 — xem G2 §2; không gộp chung vào
  con số seek-across này.
- skip-clip-inactive: **0**. B5 seekSkip (tick bỏ vẽ do seeking) tăng đều
  theo cửa sổ: delta 2–7/cửa sổ, tổng 96; `seekSkipTicks86N3`=102;
  `driftConfirmSkips103e4` cuối lượt=23 (state100 e4skip 1→23, delta 22).

### 2.3 gstd — D = 0/935

- Theo clip: mọi clip D=0 (chẵn và lẻ). Tổng **D=0/935 caps, out=0**.
- D floor post-fix vẫn đứng (như G2/A6/H3). Không có B-band lẻ bất thường
  như y1 (c20 B 62% trên n=13) — y3 không cần đào sâu B-band.

### 2.4 Độ trễ kill TRỰC TIẾP (E4b) — lặp lại y1, và kill clip không-blur đóng bằng đo + code

- Định nghĩa: kill latency = killTs − tSeekRaw (timestamp kill trực tiếp
  trong `seekKills103e4`, đối chiếu seek qua ph target ±0,05).
- **Blur (clip cũ chẵn, có pump): n=12, min 0,10 / median 0,20 / max 0,30 /
  mean 0,19 ms.** Từng ca: k=1: 0,30; k=3: 0,20; k=5: 0,20; k=7: 0,20;
  k=9: 0,30; k=11: 0,20; k=13: 0,10; k=15: 0,10; k=17: 0,10; k=19: 0,30;
  k=21: 0,20; k=23: 0,20 ms (xem analysis §4 — khớp pattern y1, max thấp
  hơn y1 là 1,00 ms ở k=21).
- **Median 0,20 ms lặp lại qua 2 lượt độc lập (y1 + y3, cùng cây
  ced42efd… về logic, khác mtime giữa lượt ở y1).** Số E4 gián tiếp cũ
  23–123 ms qua proxy fbAt−b_k vẫn không phải độ trễ kill thật (xem
  H3 §2.4); số trực tiếp mới là độ trễ kill của owner-kill đồng bộ.
- **Kill-per-seek (mới ở y3 — probe107i4 ghi thêm):**
  - Seek lẻ k=1,3,…,23 (clip cũ blur): killsDelta = **1 ở 12/12**,
    pumpActiveBefore(clip cũ) = **True ở 12/12** — mỗi seek giết đúng
    1 pump của clip cũ, khớp kill entry.
  - Seek chẵn k=2,4,…,22 (clip cũ không-blur): killsDelta = **0 ở 11/11**,
    pumpActiveBefore(clip cũ) = **None ở 11/11** — clip lẻ không có entry
    nào trong `__vcutMotionBlurSnapshots` (không chỉ "inactive", mà là
    không tồn tại trong map).
  - tSetMs (thời gian gọi setPlayhead đồng bộ, gồm cả vòng kill sweep):
    seek lẻ n=12, min 0,10 / median 0,20 / max 0,30 / mean 0,23 ms;
    seek chẵn n=11, min 0,10 / median 0,20 / max 0,20 / mean 0,16 ms.
    Đường setPlayhead đồng bộ tốn như nhau dù clip cũ có pump hay không —
    vòng kill sweep qua map rỗng/không khớp không thêm chi phí đo được.
- **Căn cứ code (đọc trước khi chạy, prereg §4):**
  `rvfcKillPumpsOutsidePlayhead` (preview.tsx:1899–1936) chỉ lặp map
  `rvfcPumps` và chỉ ghi `__vcut103e4SeekKills` khi `killed > 0`;
  pump chỉ được tạo trong `ensureRvfcPump` (gọi từ drawVideoClip "khi
  clip đang phát xuôi + có blur + snapshot thô dùng được") — clip
  không-blur không bao giờ có pump trong map. **Kết luận: kill entry
  cho clip không-blur KHÔNG THỂ tồn tại theo thiết kế; "độ trễ kill
  clip không-blur" là khái niệm rỗng trên đường kill này, không phải
  đại lượng chưa đo được.** Nợ H3 §5 mục 2 ĐÓNG — không cần đo thêm,
  không trích median 0,20 ms tách khỏi "n=12/23, chỉ clip blur".
- Kill latency gián tiếp fbAt−b_k (để đối chiếu): **0..−39 ms**
  (vals: 0, 0, −9, −10, 0, −8, −9, −12, −8, −39, −9, 0 — fbAt tại hoặc
  trước b_k; lượng tử sampler, không phải trễ kill âm; c18: −39 ms là
  ngoại lệ do sampler thưa quanh biên đó, xem §4.3).
- B5 (kill qua pump callback): pump decisions chỉ có capture 435 +
  skip-stale-frame 14, **0 skip-inactive / 0 skip-clip-inactive** —
  pump chết không qua callback (kill đồng bộ trước khi pump kịp chạy),
  như y1.

### 2.5 E4a — stale-draw ở tick đầu sau nhảy

- **Tick: examined 11, stale 0.** Chỉ 11/23 cú seek có tick record trong
  1500 ms sau seekRel chính xác (từ tSeekRaw − playT0raw); 12 cú còn lại
  không có tick record nào sau seek (tick thưa, n=448 — như y1: 11/23).
- Cap: examined 23, **STALE-CANVAS 23/23** (như y1). Cap là sampler đọc
  lại tick record mới nhất lúc lấy mẫu — frame giữ từ TRƯỚC cú nhảy,
  không chứng minh draw stale. Chỉ tick mới chứng minh draw, và tick
  0/11 stale. Kết luận E4a: **không có draw stale sau seek trong 11 cú
  đo được; 12 cú còn lại không đo được (thiếu tick).**
- RingFirstAt: offset trong clip vẫn âm và loe dần (c0: +403 ms; c2:
  −1442; c4: −3448; …; c22: −18042 ms) — artifact của mốc relPlay tích
  lũy, không phải mất frame đầu clip (như các đợt trước đã ghi nhận).
  Chú ý c0 offset +403 ms (y1: +3542 ms) — mốc đầu lượt khác nhau, không
  phải thay đổi hành vi.

## 3. Gate (b) — VẪN CHƯA QUAN SÁT ĐƯỢC (lượt thứ 6)

### 3.1 Định nghĩa (theo G2 §3, giữ nguyên)

Gate (b) = canvas đóng băng trong khi playhead chạy tự do. Quan sát được
khi và chỉ khi có draws-gap >300 ms đồng thời (a) e4skip tăng trong gap
(gate (b) skip) VÀ (b) playhead chạy tự do bền vững trong gap (spread
test: mẫu ph giữa gap nằm nghiêm ngặt giữa mẫu đầu–cuối; một bước nhảy
seek-landing + plateau KHÔNG tính).

### 3.2 Test draws-gap trên dữ liệu y3

- draws=2000 (drawsTotal 2591, drawsKept 2000). **Chỉ 1 gap >300 ms:**
  408 ms (skips=1, dph=1,27, spread=False, n_inside=7).
- **0 gap có gate-(b) skips > 0 VÀ spread=True.** Gap 408 ms có dph=1,27
  nhưng spread=False — đúng mẫu "1 bước nhảy + plateau" mà G2 đã loại
  (playhead nhảy 1 lần rồi đứng yên, không phải chạy tự do bền vững).
  So sánh y1: 4 gap >300 ms (max 473 ms), cũng 0 spread=True.
- Ít gap hơn y1 (1 vs 4) dù draws tương đương (2000 = 2000): lượt y3
  chạy mượt hơn (load lúc phát 1,93 vs 6,35) nên canvas ít đóng băng
  dài — nhưng chính vì thế mà cơ hội quan sát gate (b) cũng ít hơn:
  **gate (b) chỉ lộ mặt khi có freeze dài, mà máy yên thì freeze dài
  hiếm.** Đây là nghịch lý của phép đo này (xem §4.3).
- **Kết luận: gate (b) vẫn chưa quan sát được sau 6 lượt
  (e4y1/e4y2/f4y1/f4y2 + h3y1 + i4y3).** Chưa quan sát được ≠ đã bác bỏ:
  phép đo thiếu độ nhạy — state100 vẫn thưa (§4.3) và y3 là seek-across
  (seek liên tục), không phải lượt chuyên đo freeze như F4; hơn nữa máy
  yên làm freeze dài hiếm đi.

### 3.3 Gate (b) có bắn không? Có — nhưng không kèm freeze-chạy-tự-do

- Counter gate vẽ E4 vẫn sống: `driftConfirmSkips103e4` = 23 cuối lượt,
  state100 e4skip 1→23 (delta 22). Gate (b) bắn (skip render khi seeking),
  nhưng không có ca nào freeze dài mà playhead chạy tự do bền vững. Như
  G2/H3: "gate (b) có bắn, không phải gate chết".

## 4. Giới hạn và caveat (trung thực)

### 4.1 state100 "dày" chỉ đạt một phần — caveat chính của lượt này

- Interval đặt 10 ms, nhưng gap thực tế giữa 2 mẫu state100 liên tiếp:
  **median 56 ms / p90 119 ms / max 385 ms** (n=825 mẫu trên ~52 s phát).
  Kỳ vọng 10 ms không giữ được — setInterval trên main thread bị trễ bởi
  tải vẽ/decode trong trang (dù load hệ thống lúc phát chỉ 1,93; tải nằm
  trong chính tab Chromium, không phải tải hệ thống).
- So với y1 (interval 25 ms, 665 mẫu, gap_med cuối lượt 102–130 ms):
  y3 dày hơn — n_mau trong [b_k−1000, b_k+1000] là 14–41 (y1: 12–15 ở
  biên cuối), gap_med quanh biên 38,5–113,5 ms (y1: 38–130 ms). Nhưng
  vẫn thưa dần về cuối: biên c12→c13 n_mau=19, c13→c14 n_mau=14,
  c14→c15 n_mau=19, gap_max tới 385 ms (c15→c16). Spread test ở gap
  408 ms chỉ có n_inside=7 — vẫn mỏng.
- Hệ quả: (a) b_k nội suy kém chính xác hơn ở biên cuối (fbAt−b_k c18 =
  −39 ms là triệu chứng); (b) spread test gate (b) vẫn mất lực khi
  n_inside nhỏ; (c) zombie sống <~385 ms ở biên cuối có thể lọt qua
  state100 — nhưng capture-window check (§2.2) dùng pump event trực
  tiếp, không qua state100, nên kết luận 0 capture không bị ảnh hưởng.
- **Bài học phương pháp:** tăng interval setInterval không làm sampler dày
  tương ứng khi main thread là nút thắt. Muốn state100 thật sự dày cần
  sampler ngoài main thread (worker/CDP) hoặc giảm tải trong tab — nợ
  cho đợt sau (§5.1). Đừng lặp lại "đổi interval 25→10 ms" như một fix.

### 4.2 Nghịch lý máy yên vs gate (b)

- y3 chạy yên (load 1,93) → chỉ 1 draws-gap >300 ms (y1 tải 6,35 → 4 gap).
  Gate (b) cần freeze dài để lộ mặt; máy yên làm freeze dài hiếm.
  Muốn quan sát gate (b) có thể cần tải VỪA ĐỦ để freeze xuất hiện mà
  vẫn giữ sampler đủ dày để spread test có lực — hai yêu cầu này kéo
  ngược nhau với sampler hiện tại (tải cao → sampler thưa). Đây là lý do
  6 lượt chưa quan sát được, không phải bằng chứng gate (b) không tồn tại.

### 4.3 Những gì KHÔNG đo

- y2 pause-burst / rerun f4y3: vẫn chưa chạy (nợ từ H3, không thuộc I4).
- Zombie Δ ở 11 biên lẻ→chẵn: không đo được (§2.1).
- E4a tick: chỉ 11/23 cú đo được (§2.5).
- Gate (b): chưa quan sát được (§3) — cần lượt chuyên đo freeze +
  sampler ngoài main thread (§5.1).
- tagDisagree 1391/1892 (tag vs rvfc lệch) là hiện tượng đã biết từ các
  đợt trước, không phải phát hiện mới của I4; không đào sâu ở đây.
- `mainDraws` count không trích riêng (drawsKept=2000 là số dùng cho
  draws-gap test); drawsTotal=2591.

## 5. Nợ mở (cho đợt sau)

1. **Gate (b) vẫn mở (lượt thứ 6 không quan sát được).** Cần (a) lượt
   chuyên đo freeze (không seek-across, như F4) + (b) sampler dày THẬT
   (ngoài main thread hoặc giảm tải tab) để spread test có lực ở gap
   ngắn; và (c) cân nhắc tải vừa đủ để freeze dài xuất hiện (§4.2).
   Tiêu chí spread (G2 §3.1) giữ nguyên; đừng dùng lại tiêu chí dph>0,30 s
   cũ (đã rút về 0).
2. **Kill trực tiếp: ĐÓNG cho cả blur (n=12, median 0,20 ms, lặp lại 2
   lượt) và không-blur (không có kill entry theo thiết kế, §2.4).**
   Không cần đo thêm trừ khi đường kill đổi code.
3. **Rerun f4y3 (pause-burst) chưa xảy ra** — y2 chết do reboot #33 ở
   đợt 106; I4 không chạy (ngoài phạm vi y3). Chạy lại khi có lượt mới.
4. **Sampler state100 thưa dù interval 10 ms** (§4.1) — cần giải pháp
   ngoài việc đổi interval.
5. Nợ đứng yên đợt 106 (xem LIMITS gộp đợt 106 §4): G1 + mù #22 chờ user
   quyết, re-arm (đóng băng preview.tsx trước khi probe), 2 MiB queue2,
   zombie gate (b), blur B-band + cụm A, ghost flip-leg lúc máy yên,
   G4 flake dưới tải nặng, EPERM probe #26 + mù #25, birefnet 0 lần
   thành công, ci-security.yml 403, TTS 39 CẤM kiểm lại — không thuộc I4.
   Lưu ý: nợ "đóng băng preview.tsx trước khi probe" (§5.5 của H3) KHÔNG
   áp dụng cho y3 — cây đã giữ nguyên ced42efd… cả lượt (mtimeChanged=
   false), vì I4 không sửa production và không có sibling nào sửa file
   trong lúc probe chạy.

## 6. Hồ sơ kiểm chứng

| Mục | Kết quả | Nguồn |
|---|---|---|
| Seek bắn đủ | 23/23, 0 missed-window | driver-y3.log; JSON driverActions |
| Zombie Δ | 0 ở 12/12 biên đo được | state100, §2.1 |
| Capture cửa sổ clip lẻ | 0/12, 0 capture (gộp y1: 0/24) | pump events, §2.2 |
| Kill latency trực tiếp (blur) | n=12, median 0,20 ms (0,10–0,30) | seekKills103e4, §2.4 |
| Kill clip không-blur | killsDelta 0 ở 11/11 seek chẵn; tSetMs median 0,20 ms (n=11) | driver action killsBefore/After + code preview.tsx:1899–1936 |
| gstd D | 0/935 | baseline W3, §2.3 |
| E4a tick stale | 0/11 | tick records, §2.5 |
| Gate (b) draws-gap | 1 gap >300 ms (408 ms), 0 spread=True | draws, §3.2 |
| state100 mật độ thực tế | n=825, gap median 56 ms / p90 119 ms / max 385 ms (interval đặt 10 ms) | state100, §4.1 |
| Build identity | mtimeChanged=false, md5 ced42efd… trước = sau | JSON mtimeBefore/After |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round107-i4-zombie.txt`
— `docs/PHASE9_ROUND107_I4_ZOMBIE_LIMITS.md`,
`apps/web/scripts/probe107i4-frame-parity.mjs` (probe mới của I4).
Analyzer + dữ liệu thô nằm ở `hidden_files/round107-i4/` (ngoài repo,
không đưa vào batch push).

# Phase 9 đợt 101 — luồng C3: Re-arm — drift-gate đóng cửa sổ f4 cho burst dài-gap + thêm lượt đo ARM-HELD

- **Ngày:** 2026-11-13 (code + test offline 23:35Z 12/11 – 00:08Z 13/11; probe live 00:16–00:24Z 13/11; viết doc sau đó, giờ VN).
- **Nợ đóng:** LIMITS gộp đợt 100 §4 mục 5 — "f4 cửa sổ còn mở cho burst dài-gap đáp xa (> ~1,5 s); tail-expiry chưa triệt để; ARM-HELD cần thêm lượt đo".
- **Kết luận ngắn:** **FIX ĐÃ LAND (drift-gate).** Luật đuôi nay có thêm luật thứ hai độc lập với luật burst-rate B3: một lần tăng chỉ được đếm khi element **đáp trong ngưỡng drift 0,35 s** (= ngưỡng drift re-seek); đáp xa hơn thì không đếm + reset advances + rebase lastCt, y hệt burst. Offline 75/75 test (10 test mới C3-R1..R10, gồm replay g2/g5/f4/f2). Live 12 lượt WebKitGTK (gấp đôi B3): **f4-like 0/12** (sau khi loại restartEnded — xem §4.1), **drift-gate chặn 44 lần ngoài đời**, burst-rate chặn thêm 31 lần, **đóng ADV2 với drift vượt: 6/7 lượt cũ → 0/5 lượt mới** (1 ca biên +0,363 là drift sau-đóng, xem §4.3), grace BỊ CHẶN 11 / LỌT 0, **ARM-HELD §6 = 1/12** (gộp 3 đợt: 4/36 lượt — B3 tăng 2/6 là nhiễu mẫu nhỏ, xem §5), không hồi quy (tsc 0, vite build PASS, 6 suite xanh), không seek kẹt nào. **Đánh đổi đo được:** tuổi đuôi trung vị tăng 1339 → 1942 ms (+45%), 2 đuôi đóng do trần 5000 ms (h4, h8 — đều vô hại, xem §4.1); seek sửa drift bị hoãn tối đa tới trần trong chế độ burst mãn tính. Xem §6.

## §1. Điều tra — vì sao rate không phân biệt được g5, và thứ gì phân biệt được

Luật B3 (rate = |Δct| / (gap tick × playbackRate) ≤ 1,5×) có điểm mù dài-gap đã biết: burst trải trên 1 gap rAF dài có rate ≤ 1,5× nên vẫn đếm — g2 (+0,97 s / 684 ms = 1,41×) và g5 (+0,90 s / 788 ms = 1,14×). Trích lại từ tick thô (`hidden_files/round101-c3/drift-at-close.txt`, script `analyze-drift-at-close.py` — drift = ct − ph, đúng vì probe clip đơn start=0/speed 1/sourceStart 0 nên target == playhead):

| Lượt | Mở (drift) | Advance #1 (Δct/gap/rate) | Drift sau #1 | Đóng (drift) |
|---|---|---|---|---|
| g2 | ct 1,6 (+0,633) | +0,9667 / 684 ms / 1,41× | **+1,067** (biên thật +1,067…+1,600) | +0,500 |
| g5 | ct 1,4 (+0,500) | +0,9000 / 788 ms / 1,14× | **+0,933** (biên thật +0,933…+1,400) | +0,867 |

**Rate không phân biệt được g5:** tốc độ lành tối đa ~1,2× (header B3, kể cả jitter lấy mẫu media-clock) còn g5 chỉ 1,14× — mọi ngưỡng rate chặn được g5 đều chặn oan decode lành. Mọi luật chỉ dùng (|Δct|, gap, playbackRate) đều chung số phận: excess của g5 so với kỳ vọng lành là 0,90 − 0,788 = 0,112 s, nhỏ hơn excess của decode lành 1,2× (0,158 s). **Thứ phân biệt được là ĐIỂM ĐÁP:** sau lần tăng #1, drift của g2 là +1,07…+1,60 và g5 là +0,93…+1,40 — đều vượt xa ngưỡng drift re-seek 0,35 s — trong khi decode lành đáp với drift ~0. (Biên drift là khoảng do tick app ẩn giữa 2 mẫu probe: drift sau-#1 ∈ [drift tại mẫu sau, drift tại mẫu sau + ph đã đi trong khoảng]; đầu dưới đã vượt xa 0,35 nên kết luận chặn là chắc chắn, không phụ thuộc biên.)

Đếm lại toàn bộ 11 lượt cũ (g1–g6 + f1–f5, script `analyze-close-reasons.py` — phân loại lý do đóng: ADV2 / REARM / CAP / UNKNOWN): **7 lần đóng ADV2 thì 6 lần xảy ra khi drift trước-đóng > 0,35** — 4 đo trực tiếp tại mẫu sau-đóng (f3 +0,425; g2 +0,500; f5 +0,567; g5 +0,867), 2 ca drift về 0 chỉ vì resync đã bắn trước mẫu probe (f4 +2,49; f5-5110 +0,667); chỉ 1/7 đóng sạch (f2 +0,233). Nói cách khác luật Y4+B3 thường xuyên đóng đuôi trong lúc element còn lệch khỏi target quá ngưỡng seek — rồi drift re-seek bắn ngay sau đó (f4 kẹt seek 5,5 s+; f5-5110 seek 0,6 s). 8 lần đóng còn lại là watch mới arm tiếp quản (REARM — đường handoff thiết kế, gate không can thiệp), 1 UNKNOWN (g2-15986, drift 0, vô hại).

## §2. Phương án đã chọn — drift-gate (landing gate), luật thứ hai độc lập

**Quy tắc mới:** một lần tăng chỉ được đếm khi element đáp trong ngưỡng drift: `|drift| ≤ PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S = 0,35 s`, với drift = currentCt − target ở chính tick tăng đó. Đáp xa hơn thì KHÔNG đếm mà reset advances về 0 + rebase lastCt (cùng hành vi với burst B3). Ngưỡng 0,35 s = đúng ngưỡng drift re-seek `FORWARD_RESEEK_THRESHOLD_S` (test C3-R1 khóa bằng nhau): đuôi tồn tại để ân hạn seek khi drift vượt ngưỡng — đóng đuôi trong lúc drift còn vượt ngưỡng là tự phá mục đích của nó. Kiểm tra drift SAU luật rate: burst vừa nhanh vừa đáp xa báo `burstBlocked` (hành vi B3 giữ nguyên); chỉ lần tăng lành-về-tốc-độ mà đáp xa mới báo `driftGateBlocked`.

**Vì sao không phải các phương án khác:**
- *Siết ngưỡng rate theo gap* (vd 1,5× ở gap ngắn → 1,1× ở gap dài): không chặn được g5 (1,14×) mà không chặn oan decode lành 1,2× — đã chứng minh ở §1 là không thể bằng rate.
- *Ngưỡng tuyệt đối |Δct|* (vd > 1,0 s là burst bất kể gap): chặn oan decode lành trên gap dài (gap 1500 ms lành đã tăng 1,5 s) — cảnh báo B3 §6 vẫn đúng; gate tránh được vì nó đo điểm đáp, không đo độ lớn cú nhảy.
- *Chỉ gate ở tick đóng (advances 1→2), không gate #1:* cũng chặn được g2/g5 (đóng bị chặn), nhưng để lại advance #1 giả trong bộ đếm — đuôi chỉ cần thêm 1 lần tăng nhỏ nữa là đóng; gate-mọi-lần-tăng (đã chọn) nhất quán với ngữ nghĩa B3 "burst thì reset", và ca f2 (§3, C3-R6) cho thấy chi phí chỉ là hoãn đóng, không kẹt đuôi.

**Đuôi đóng vì hasWatch (watch mới arm) hoặc quá trần 5000 ms thì gate không can thiệp** — chỉ nhánh đếm advance mới bị gate. Trần cứng chặn mọi hoãn vô hạn.

**Nguồn drift ở caller:** bước đuôi trong `preview.tsx` chạy TRƯỚC khi `spec` (failsoft) và `t` (playhead sau-tăng) được gán trong tick, nên không dùng được chúng. Helper mới `driftTargetForTailElement101C3` dùng `st.spec` (spec gốc trong store) + `poolRef.current` + `mediaByNameRef.current.map` + `st.playhead` (playhead ĐẦU tick — lệch tối đa ~1 frame so với drift mà drift re-seek dùng, không đáng kể so với ngưỡng 0,35 s), đối chiếu đúng điều kiện chọn clip của `collectActives` (track video + clip video + t trong cửa sổ clip + item video + `pool.videoFor(item) === el` → `rampSourceTimeAt(clip, t)`). Không tìm được clip (nội dung nested trong spec gốc có kind "nested" nên bị bỏ qua; pool chưa sẵn) thì drift = undefined → gate bỏ qua, chạy như B3 (tương thích ngược, C3-R8 khóa).

**Đánh đổi (ghi rõ, không giấu):** element ỔN ĐỊNH nhưng SAI vị trí (decode lành 1×, drift hằng 0,35–1,0) sẽ không đóng đuôi cho tới khi drift tự về dưới ngưỡng (element đóng băng để playhead đuổi kịp — như g2/g5 ngoài đời) hoặc chạm trần cứng 5000 ms — seek sửa drift bị hoãn tối đa tới trần. Ca f5-5110 ngoài đời cho thấy phía lợi: drift tự về qua đóng băng nên gate sẽ TRÁNH được cả lần resync đó (không seek nào cần bắn), không chỉ hoãn nó. Đo thật của đánh đổi này ở §4.4 (tuổi đuôi trung vị +45%, 2 đóng trần).

## §3. Thay đổi code (chỉ vùng luật tail/grace + probe/analyzer, marker "Đợt 101 C3")

- `apps/web/src/lib/playheadHold90R2.ts`:
  - Hằng mới `PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S = 0,35` (+ header C3 giải thích, §1–§2).
  - `ResumeGraceTailInput` thêm `drift?: number` (không truyền = bỏ qua gate); `ResumeGraceTailResult` thêm `driftGateBlocked?: boolean`.
  - `nextResumeGraceTail97Y4`: sau luật rate B3, nếu drift đã truyền và |drift| > ngưỡng thì không đếm + reset advances + rebase lastCt + `driftGateBlocked: true`.
- `apps/web/src/lib/playheadHold90R2.test.ts`: C3-R1..R10 (xem §5.1).
- `apps/web/src/preview.tsx` (chỉ vùng đuôi/grace; marker C3 còn nguyên 5 chỗ):
  - Helper `driftTargetForTailElement101C3` (ngay sau `collectActives` — nơi nó mirror logic chọn clip).
  - Bước đuôi mỗi tick: truyền `drift` + đếm `driftGateBlocked` vào biến `resumeTailDriftGateBlocked101C3`.
  - Hook mới `__vcutTailDriftGateBlocked101C3` (khai báo kiểu + công bố mỗi tick) để probe đo trực tiếp.
- `apps/web/scripts/probe101c3.mjs` (copy probe100b3, scratch round101-c3, CFG /tmp/round101-c3; sampler ghi thêm `tailDriftGate` mỗi tick) + **sửa môi trường WebKit sau reboot #25** (xem §7).
- `apps/web/scripts/analyze101c3-tail-expiry.mjs` (copy analyze100b3 + đếm `tailDriftGate` + **loại restartEnded khỏi f4-like** — xem §4.1).

Không đổi: ngưỡng drift 0,35 s, 2 tick xác nhận, trần đuôi 5000 ms, detector re-arm 300 ms, luật bò Z3, luật burst-rate B3, CANCELLED/ARM-HELD §6.

## §4. Số đo live — trước/sau

Probe: WebKitGTK, clip bóng 720p 6 s, chạy tuần tự, 1 instance/lượt, dọn process sau mỗi lượt; `preview.tsx` mtime không đổi suốt 12 lượt (2026-11-13T00:07:56.623Z). Trước = 11 lượt cũ g1–g6 (B3) + f1–f5 (A3); sau = 12 lượt mới h1–h12 (13 lần chạy — h9 lần đầu lỗi harness pause-seek, xem §7, chạy lại PASS). 12/12 verdict probe PASS (giữ playhead trong seek + lúc canvas đổi khung).

| Chỉ số | Trước (11 lượt cũ) | Sau (C3, 12 lượt) |
|---|---|---|
| f4-like (đuôi đóng-drift-vượt + drift re-seek trong 2 tick) | **1** (f4, kèm seek kẹt 5,5 s+) | **0** |
| tailDriftGate (gate chặn đáp xa — hook trực tiếp) | — (chưa có luật) | **44** |
| tailBursts (luật B3 chặn burst — hook trực tiếp) | 3 / 6 lượt B3 | **31** |
| Đóng ADV2 với drift trước-đóng > 0,35 | **6/7** | **0/5** (1 ca biên +0,363, xem §4.3) |
| Đóng ADV2 với drift ≤ 0,35 | 1/7 (f2 +0,233) | 5/5 (−0,033; +0,067; +0,236; +0,305; +0,363-biên) |
| Đuôi đóng khi drift vượt (analyzer — gồm cả đóng trần) | 2 (g2, g5 — ADV2) | 2 (h4, h8 — **đều đóng trần**, xem §4.1) |
| Grace chuỗi ≥2 tick BỊ CHẶN / LỌT (§4 analyzer A3) | 6 / 0 (6 lượt B3) | **11 / 0** |
| ARM-HELD §6 | 2/6 lượt (B3) | **1/12** (h12-9985, xem §5) |
| CANCELLED hẹp / DELAYED | 0 / 0 (6 lượt B3) | 1 (h11-7863, **artifact pause-seek**, xem §5) / 0 |
| Drift re-seek (đã trừ forceSeek+restart) | 3 (đều g3) | **2** (h12, h5 — đều đáp đúng ph, không kẹt) |
| Seeking kẹt ≥ 3 s | 1 (g5, seek đầu forceSeek) | **0** |
| Tuổi đuôi trung vị / max / ≥ 5000 ms | 1339 ms / 5286 ms / 1 (REARM) | **1942 ms / 5508 ms / 3** (2 CAP + 1 REARM) |
| re-arm / arm-vì-bò | 6 arm / 4 ca bò (6 lượt B3) | 12 arm / 5 ca bò, 0 re-seek sau arm-vì-bò |
| Tick element tăng ≥ 1 frame, trong đó Δct > 0,35 | — | 221, trong đó 71 (32%) |

### 4.1 Hai ca "đóng khi drift vượt" còn lại (h4, h8) — đều là đóng TRẦN, không phải ADV2 (kiểm tay)

- **h4** (load4 GOP250): đuôi mở ở endedAtMs 5068, sống với advances=0 suốt (gate chặn 6 + burst chặn 6 = 12 lần trên 1 đuôi — element burst liên tục đáp drift +0,47…+0,93, không lần nào đáp đúng vị trí); đóng ở t=10072, tuổi **5131 ms > trần 5000 ms** (đóng do trần — đúng thiết kế, xem §2). Resync ngay sau (resyncsV 1→2 ở 10370) là **restartEnded** (restartV 0→1, ct chạm 6 = cuối clip) — KHÔNG phải drift re-seek. Analyzer B3 cũ đếm oan ca này là f4-like=1; analyzer C3 đã loại restartEnded khỏi f4-like (§3) → f4-like = 0. Không kẹt seek (ph không đóng băng sau restart).
- **h8** (load4 GOP30): đuôi mở ở endedAtMs 4006, đóng ở t=9514, tuổi **5508 ms** (đóng do trần); drift lúc đóng +0,90 nhưng KHÔNG resync sau — element đóng băng ở ct 5,9, playhead tự đuổi kịp (drift → +0,167 ở mẫu sau), không seek nào cần bắn. Đúng hành vi gate thiết kế: hoãn seek tới khi drift tự về hoặc trần.
- Cả 2 ca đều là giá phải trả đã ghi rõ của gate (§2), không phải gate thất bại: đuôi không bao giờ đóng ADV2 khi drift vượt nữa, nhưng có thể sống tới trần trong chế độ burst mãn tính.

### 4.2 44 lần gate chặn ngoài đời — kiểm chứng bằng biên (bounds)

Counter là số đo trực tiếp từ hook (code production tự đếm khi hàm lib trả `driftGateBlocked: true` — drift ở đó tính từ target thật, không dính caveat probe). Việc TÁI HIỆN từng ca từ mẫu probe thì dính caveat (§6): script `verify-gate-bounds.py` tính, cho mỗi lần tăng counter, khoảng drift có thể tại tick chặn (ct/ph đơn điệu trong khoảng mẫu): **19/44 ca CHẮC chắn đúng** (cận dưới drift > 0,35), **0 ca SAI** (không ca nào có khoảng drift nằm trọn trong ±0,35 — tức không ca nào chứng minh được là gate chặn oan), còn lại MỜ (khoảng chứa ngưỡng vì ph đi ~1× trong gap probe 200–600 ms — đúng như kỳ vọng, không phải bằng chứng chống lại gate). Không ca nào có `tailAdv > 0` tại mẫu chặn — mọi lần chặn đều reset advances về 0 như thiết kế. Phân bố: load4 GOP30/250 chiếm 33/44 (h2 5, h3 5, h4 6, h5 5, h8 6, h12 7 — đúng chế độ burst mãn tính mà gate sinh ra để xử lý); load1–3 nhẹ: gate = 0 ở h1/h6/h7/h9/h10 (đuôi đóng bình thường qua ADV2 — gate không can thiệp khi drift nhỏ, đúng tiêu chí (b)).

### 4.3 Ca biên duy nhất: h9 đóng ADV2 với drift +0,363 tại mẫu sau-đóng

Kiểm tay: đuôi mở 1582; 1887 burst bị rate chặn (tb 0→1, advances về 0); 2104 advance #1 đáp drift +0,200 (đếm); 2286 đuôi đóng, mẫu đọc drift +0,363. Lần tăng đóng nằm trên tick app ẩn giữa 2104–2286 (ct 1,2→1,563, ph 1,0→1,2): nó PHẢI đáp ≤ 0,35 — nếu đáp xa hơn, gate hoặc burst đã chặn (cả hai counter đều đứng yên 2104→2286) — và Δct +0,363 trên ≤ 182 ms ở 1 tick cũng sẽ bị rate chặn (rate ≥ 2,0×). Cách tái hiện duy nhất nhất quán: lần tăng đóng đáp ~+0,28 (đếm, đóng), rồi element burst THÊM sau khi đuôi đã đóng, đẩy drift lên +0,363 ở mẫu probe. Vậy +0,363 là drift SAU-đóng, không phải drift lúc đóng. Ghi rõ để không ai trích sai số này thành "gate để lọt 1 ca".

### 4.4 Chi phí đo được của gate (đánh đổi §2)

Tuổi đuôi (tuổi = t lúc đóng − endedAtMs, theo mẫu probe): trung vị **1339 ms (cũ) → 1942 ms (mới), +45%**; ≥ 5000 ms: 1 (cũ, đóng REARM) → 3 (mới: 2 CAP + 1 REARM). 2 đóng trần h4/h8 đều vô hại (§4.1). Drift re-seek giảm 3/6 lượt (B3) → 2/12 lượt — seek sửa drift ít bắn hơn vì drift hay tự về qua đóng băng trong lúc đuôi còn mở (f5-5110 đã báo trước hiệu ứng này); 2 lần còn lại (h12, h5) đều đáp đúng ph, seeking 1,43 s / 0,12 s, không kẹt. Không có lượt nào drift > 0,35 kéo dài mà không được xử lý: mọi chuỗi grace ≥ 2 tick đều BỊ CHẶN (11/0), không LỌT.

## §5. ARM-HELD §6 — thêm lượt đo (nhiệm vụ 2)

A3 analyzer chạy lại trên 12 lượt mới: re-arm 12 lần; CANCELLED hẹp 1, DELAYED 0, NOT-DUE 7, AMBIGUOUS 4; **ARM-HELD §6 = 1** (h12 relMs 9985 — kiểm tay dưới đây); INCONCLUSIVE 0.

- **Ca ARM-HELD h12-9985:** element đóng băng 699 ms (stall 9286→9985, ct≈5,933), watch arm lúc drift (ph−ct, quy ước A3) −1,300 — tức element CHẠY TRƯỚC playhead 1,3 s; watch sống ở k+1/k+2, drift phản-thực −0,999/−0,677 (cả hai due, đúng với mọi tốc độ playhead ≥ 0×…1,52×, chứa 1,0×), không resync nào. Đây là ARM-HELD đầu tiên ở chế độ drift dương (element chạy trước — các ca trước đều là element chạy sau hoặc drift nhỏ). Watch giữ playhead đứng yên ở 4,6667 trong khi element đóng băng ở 5,9667 (gần cuối clip 6 s); không seek nào bắn.
- **CANCELLED hẹp h11-7863 là artifact, cùng họ với f3-8313:** drift (ph−ct) −0,567 due ở k−1/k, watch arm, drift về 0 ở k+2 — nhưng về 0 bằng **pause-seek của probe** (ct lùi 5,9→5,3333 = đúng ph, không resync/restart nào, đúng lúc probe dừng ở localPh ≥ 5,0). §6 verdict đúng là NOT-HELD + cờ [NHIỄM-PAUSE-SEEK]; số CANCELLED hẹp = 1 không phải bằng chứng máy chặn được seek thật. Phân loại hẹp càng cho thấy nó đo artifact nhiều hơn đo máy (A3 §5.1 đã kết luận).
- **B3 tăng 2/6 là nhiễu mẫu nhỏ — nay có bằng chứng:** gộp 3 đợt ARM-HELD = **4/36 lượt** (A3 1/18 = 5,6%; B3 2/6 = 33%; C3 1/12 = 8,3%). Tỷ lệ C3 (1/12) khớp A3 (1/18), không khớp B3 — với mẫu gộp 36 lượt, 2/6 của B3 nằm ngoài khoảng tin cậy của tỷ lệ chung (~11%/lượt). Kết luận: ARM-HELD thật ~1 ca / 9–12 lượt; B3 chỉ là may mắn mẫu nhỏ, không phải fix B3 làm tăng ARM-HELD. Không kết luận gì thêm về xu hướng — cần mẫu lớn hơn nữa mới nói được.

## §6. Caveat (đọc trước khi trích số) — probe-vs-app tick ảnh hưởng verdict ra sao

1. **Tick probe ≠ tick app (±1 tick, caveat W5 §6.3) — và hơn thế dưới tải (ảnh hưởng LỚN NHẤT ở đợt này):** gap rAF 110–830 ms (h9 mean 143 ms … h5 max 832 ms) nên NHIỀU tick app ẩn giữa 2 mẫu probe. Ảnh hưởng cụ thể tới từng verdict:
   - *Số lần gate/burst chặn (44/31):* KHÔNG dính caveat này — counter đọc trực tiếp từ hook do code production tự đếm (chỉ tăng khi hàm lib thật sự trả `driftGateBlocked`/`burstBlocked` ở 1 tick app). Đây là số đo trực tiếp, tin được nguyên vẹn.
   - *Drift/Δct/rate của từng ca chặn:* CHỈ CÓ BIÊN, không có số chính xác — mẫu probe chỉ cho khoảng (vd g2 drift sau-#1 ∈ [+1,067, +1,600]). Mọi con số drift từng ca trong doc này đều ghi kèm biên hoặc ghi rõ là "tại mẫu probe". Kết luận "gate chặn đúng" dựa vào counter + biên (19/44 chắc chắn, 0 sai — §4.2), không dựa vào drift từng mẫu.
   - *Verdict ADV2-đóng-với-drift-vượt (0/5):* kết luận trên mẫu probe + logic counter (ca h9 +0,363 đã phân tích tay ở §4.3 — drift tại mẫu sau-đóng có thể cao hơn drift lúc đóng do burst sau-đóng). Nếu dịch ±1 tick, không ca ADV2 nào đổi verdict sang "đóng khi drift vượt" — đã kiểm tay 5/5 ca.
   - *Verdict f4-like = 0:* kết luận trên mẫu probe + loại restartEnded; ca h4 đã kiểm tay là cap-close + restart, không phải f4-like. Một ca f4-like thật nhưng resync rơi vào tick app ẩn giữa 2 mẫu probe thì analyzer vẫn bắt được (resyncsV là counter tích lũy — tăng là thấy ở mẫu sau), nên f4-like = 0 là chắc chắn ở độ phân giải probe.
   - *ARM-HELD §6:* dùng phản-thực với tốc độ 1,0× cố định + khoảng tốc độ kèm theo (h12-9985 đúng với mọi tốc độ ≤ 1,52×, chứa 1,0×); median tốc độ playhead khi không giữ ở các lượt load4 chỉ n=1 (flag không đủ mẫu trong analyzer — đối chiếu yếu, nhưng ca đếm được không phụ thuộc median này vì đã báo khoảng tốc độ).
2. **Drift của gate lệch ~1 frame so với drift re-seek:** gate dùng playhead ĐẦU tick (st.playhead trước khi tăng), syncMedia dùng playhead SAU tăng — lệch tối đa 1 frame (33 ms) so với ngưỡng 0,35 s. Không ca nào trong 12 lượt nằm trong vùng xám ±1 frame quanh ngưỡng ở tick đóng (ca gần nhất h9 +0,363 là drift sau-đóng, xem §4.3).
3. **Gate bỏ qua khi không tìm được clip (fail-open):** nội dung nested (spec gốc có kind "nested") → lookup miss → chạy như B3. Trong 12 lượt probe (clip đơn phẳng) lookup trúng 100% (gate chặn 44 lần — nếu lookup miss thì gate đã = 0). Chưa đo trên project nested thật.
4. **Phạm vi đo hẹp:** chỉ 1 clip 720p 6 s, WebKitGTK, GOP 30/250, load 1–4, 12 lượt; không đo Chromium; RAM khả dụng lúc đo ~1,4–3,0 GB (dao động theo luồng song song khác). Số đo là bằng chứng ngoài đời trên cấu hình này, không phải đảm bảo cho mọi clip/máy.
5. **G1 (deinterlace) vẫn mở, chờ user quyết** (metric G5 hay M2 — đợt 99 A9).
6. **Trần 5000 ms:** lần đầu quan sát được 2 lần đóng trần của ĐUÔI (h4, h8 — trước đây 0/18 lượt cũ + 0/11 lượt gộp; trần của watch thì đã biết). Nhả trần vẫn 0 quan sát (ứng viên trần 0 theo analyzer A3 — analyzer đếm theo watch, không đếm đuôi; 2 đóng trần đuôi này là bằng chứng trần đuôi CÓ cháy, nhưng "nhả" sau trần — playhead chạy tiếp — không nằm trong phạm vi đo của đợt này).
7. **ci-security.yml vẫn 403** (chờ user); **TTS 39 và birefnet vẫn cấm**.

## §7. Nợ môi trường + sự cố trong lượt (ghi rõ, không giấu)

- **Reboot #25 (boot 3a12a7d3, up 21 phút lúc bắt đầu lượt):** apt-install WebKit của B9 bay mất sau reboot — file ngoài `~` là ephemeral. MiniBrowser thiếu đúng 22 lib như sau reboot #24 (ldd). **Khắc phục BỀN trong `probe101c3.mjs`** (chỉ `launchEnv` của tiến trình browser): `LD_LIBRARY_PATH` = debroot `~/workspace/tmp-q6r3-debroot` (18 lib hệ thống, KHÔNG chứa libc/libstdc++ nên không shadow) + `minibrowser-gtk/lib` + `minibrowser-gtk/sys/lib` của bundle playwright (4 lib còn lại: libwebkitgtk, libjavascriptcoregtk, libbacktrace, libjxl); ldd sau khi đặt: 0 thiếu. Bài học cho đợt sau: **đừng dựa vào apt install ngoài `~` nữa** — mọi lib hệ thống cần cho probe phải nằm trong `~/workspace` hoặc được cài lại sau mỗi reboot.
- **h9 lần đầu lỗi harness** ("pause-seek tới t=5 không xác nhận được sau 30s — không đo phát sau seek trên khung stale"): lỗi probe, không phải lỗi sản phẩm; chạy lại cùng cấu hình PASS ngay. Không tính lượt lỗi vào 12 lượt (chỉ tính lượt PASS).
- **Sự cố do chính C3 gây ra (đã dọn sạch):** lúc kiểm chứng stage file, lệnh `node probe101c3.mjs --help` đã vô tình CHẠY 1 probe Chromium (script không có cờ --help — mọi argv lạ đều bị bỏ qua, chạy với mặc định). Đã kill ngay + xóa scratch `probe-chromium-load0-gop250-pre` + kill vite :5580 còn sót. Không dữ liệu nào từ lần chạy nhầm này được dùng. Bài học: không bao giờ chạy script probe với argv chưa đọc kỹ — nó không có --help.

## §8. Hồi quy (cây cuối, sau mọi sửa đổi)

- `tsc` web: **0 lỗi**.
- `vite build`: **PASS** (9,60 s).
- `playheadHold90R2.test.ts`: **75/75** (65 cũ + 10 mới C3-R1..R10, gồm replay g2 C3-R2, replay g5 C3-R3, replay f4 có drift C3-R4, f2 hồi phục C3-R6, speed 2× C3-R7, biên ±0,35 C3-R9, điểm mù B3-R5 nay đóng khi biết drift C3-R10, tương thích ngược C3-R8).
- `playheadPacing54K9.test.ts`: 19/19; `previewEngine.test.ts`: pass; `seek.test.ts`: pass; `seekSkipRender86N3.test.ts`: 9/9; `armHeld99a3.test.mjs`: 16/16.
- Không sửa production nào ngoài vùng tail/grace + probe/analyzer; không đụng TTS 39, không thử birefnet, không đụng ci-security.yml.

## Phụ lục — file liên quan

- Fix + test: `apps/web/src/lib/playheadHold90R2.ts` (`PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S`, `drift`, `driftGateBlocked`), `apps/web/src/lib/playheadHold90R2.test.ts` (C3-R1..R10), `apps/web/src/preview.tsx` (helper `driftTargetForTailElement101C3` + truyền drift + counter/hook `__vcutTailDriftGateBlocked101C3`).
- Probe + analyzer: `apps/web/scripts/probe101c3.mjs`, `apps/web/scripts/analyze101c3-tail-expiry.mjs` (đếm gate + loại restartEnded khỏi f4-like).
- Phân tích số liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c3/` (`analyze-drift-at-close.py` + `drift-at-close.txt`, `analyze-close-reasons.py` + `close-reasons.txt`, `analyze-close-reasons-c3.py` + `close-reasons-c3.txt`, `verify-gate-bounds.py` + `verify-gate-bounds.txt`, `analyze-h1-h12-c3.txt`, `analyze-h1-h12-a3.txt`, `boot-id.txt`, `run-log.md`, `probe-webkit-load*-h*/probe-results.json` + `probe-log.txt`).
- Doc tiền lệ: `docs/PHASE9_ROUND100_B3_TAIL_EXPIRY_LIMITS.md` (§1 f4, §6 điểm mù dài-gap), `docs/PHASE9_ROUND99_A3_REARM_CANCELLED_LIMITS.md` (§6 ARM-HELD), `docs/PHASE9_ROUND100_LIMITS.md` §4 mục 5 (nợ gốc).
- Stage (không push): `~/workspace/repo-1-push/paths-loop/phase9-round101-c3-rearm.txt`.

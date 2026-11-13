# Phase 9 đợt 99 — luồng A3: Re-arm CANCELLED ngoài đời + phân loại rộng ARM-HELD (§6)

- **Ngày:** 2026-11-12/13 (lượt đo 17:54–18:14Z ngày 2026-11-12; viết doc 2026-11-13 giờ VN).
- **Nợ đóng:** LIMITS gộp đợt 98 §4 mục 4 — "Re-arm CANCELLED vẫn 0 ngoài đời".
- **Phạm vi:** chỉ đo + phân loại; **không sửa code production** (`preview.tsx`,
  `playheadHold90R2.ts` không đụng). File mới chỉ trong `apps/web/scripts/`.
- **Kết quả đo:** 18 lượt (13 lượt cũ đợt 96–98 + 5 lượt mới f1–f5), 15 lần re-arm.

## §0. Tóm tắt kết luận (đọc phần này là đủ)

1. **CANCELLED hẹp = 0 trên 13 lượt cũ là ĐÚNG theo thiết kế, không phải thiếu
   lượt đo** — nhưng nó đo sai thứ cần đo. Cơ chế (§1): detector arm khi element
   đóng băng đủ 300 ms; lúc đó playhead mới chạy trước element ~0,30 s < ngưỡng
   drift 0,35 s, nên drift hầu như không bao giờ "due" ở đúng tick arm — mà
   phân loại hẹp đòi due ở **cả** tick k−1 lẫn tick arm k. CANCELLED hẹp đo sự
   trùng hợp của hai đồng hồ (300 ms vs 2 tick xác nhận), không đo việc máy
   re-arm chặn seek.
2. **Phân loại rộng mới ARM-HELD (§6) đếm được đuôi chặn thành công: 1 ca thật
   trên 18 lượt** (e1r tick 41, relMs 11829, đợt 98) — drift ở tick arm chỉ
   0,133 (NOT-DUE theo phân loại cũ), nhưng watch giữ playhead 2 tick, drift
   phản-thực 0,406 / 0,825 (cả hai đều due), không resync, element về drift 0
   ở k+3. Ca này phân loại cũ bỏ sót.
3. **CANCELLED hẹp đầu tiên trong lịch sử (f3 tick 32, relMs 8313) là artifact
   của probe, không phải hủy seek thật** (§4.3: ct lùi 5,9→5,5 = pause-seek khi
   probe dừng; mọi seek lúc phát đều tăng `resyncsV`, ca này không tăng).
4. **1 ca suýt-đếm (f5 tick 55, relMs 12919):** phản-thực due cả 2 tick
   (0,703 / 0,697), watch sống ở k+1, nhưng cửa sổ k+2 chạm đúng lúc probe
   dừng (pause-seek kéo ct về ph, dọn watch) nên KHÔNG đếm — ghi rõ là nhiễm
   cuối lượt, không phải bằng chứng chống lại máy (§4.4).
5. **Đuôi/tail chặn thành công đo đúng bằng §4, không phải bằng CANCELLED:**
   chuỗi grace ≥2 tick **BỊ CHẶN = 8, LỌT = 0** trên 18 lượt (3 cũ + 5 mới).
   Chế độ drift âm dưới tải nặng (f1+f4: 5 arm, drift −1,6…−2,5) không cho ra
   ARM-HELD nào — việc chặn seek thật trong chế độ này do máy grace §4 làm
   (chuỗi len 10 và len 6 BỊ CHẶN), không phải do một lần arm giữ 2 tick.
6. **Arm-vì-bò lần đầu quan sát được ngoài đời: 4 ca** (0/13 lượt cũ → 4/5
   lượt mới), 27 tick-bò, 0 re-seek trong 3 tick sau arm-vì-bò. Fix Z3 hoạt
   động.

## §1. Phân loại cũ CANCELLED hẹp — vì sao nó đếm 0 theo thiết kế

Cơ chế (đọc từ code, không đoán):

- `nextResumeFreezeRearm` (`apps/web/src/lib/playheadHold90R2.ts`): detector arm
  watch mới khi element đóng băng ≥ 300 ms
  (`PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS = 300`) mà chưa có watch; Z3: tăng bò
  (tốc độ < 0,1× realtime, `isResumeCrawlAdvance98Z3`) KHÔNG reset đồng hồ.
  Watch arm với `completedAtMs` = mốc tăng cuối (đầu stall); trần giữ 5000 ms.
- Detector chạy TRƯỚC khối quyết định giữ và TRƯỚC `syncMedia` trong mỗi tick
  `preview.tsx`; watch vừa arm nằm ngay trong tập live cho `syncMedia` cùng tick.
- `shouldIssueForwardReseek` (`apps/web/src/lib/playheadPacing.ts`): drift
  re-seek bắn khi `|currentTime − target| > 0,35 s` trong **2 tick liên tiếp**
  (`FORWARD_RESEEK_CONFIRM_TICKS = 2`); grace (watch sống / tail sống / vừa
  re-arm cùng tick) giữ `overCount` ở 1, hoãn seek.
- **Phân loại CANCELLED hẹp (§1 analyzer, kế thừa X4/Y4):** tại tick arm k,
  `due` = |drift| > 0,35 ở CẢ tick k−1 lẫn k; CANCELLED = due + không resync
  trong 3 tick sau arm + drift về dưới ngưỡng trong 2 tick sau arm.

Vì sao CANCELLED ≈ 0 theo thiết kế: detector arm lúc đóng băng đủ 300 ms, lúc
đó playhead mới chạy trước element đóng băng ~0,30 s < 0,35 s nên drift hầu như
không bao giờ due ở đúng tick arm; watch arm xong giữ playhead nên drift cũng
không lớn lên sau đó. Muốn CANCELLED > 0 phải có drift đã due **trước** khi
đóng băng đủ 300 ms — tức element vừa chạy trước playhead > 0,35 s rồi mới
đóng băng (chế độ drift âm, §4.5) — hoặc drift đúng lúc arm vượt ngưỡng do
nhiễu tick. Trên 18 lượt, chỉ đúng 1 ca thỏa (f3-8313) và nó là artifact (§4.3).

## §2. Phân loại rộng mới ARM-HELD (§6) — đếm "seek bị re-arm chặn"

### 2.1 Định nghĩa

Một lần arm ở probe tick k được đếm khi TẤT CẢ đúng:

1. Không tail sống ở tick k (quy công cho §4, tránh đếm trùng);
2. Watch vừa arm còn sống ở CẢ k+1 lẫn k+2;
3. Drift phản-thực `driftCF(j) = drift(k) + 1,0×(t(j)−t(k)) − (ct(j)−ct(k))`
   vượt ngưỡng 0,35 ở CẢ k+1 lẫn k+2;
4. Không resync ở k+1..k+3;
5. Đủ tick k+3, thiếu thì INCONCLUSIVE (báo riêng, không đếm).

Tốc độ 1,0× là tốc độ thiết kế (playhead tăng đúng wall-clock 1×, header R2;
`PREVIEW_DT_CAP_S = 2 s` không siết ở gap < 2 s) và là tốc độ BẢO THỦ so với
median đo được (§4.6: đa số ~1,0×; các lượt lệch cao 1,36–1,60× đều là
catch-up sau giữ — dùng 1,0× thì drift phản-thực tính THIẾU, không tính thừa,
nên không đếm oan). `ct(j)−ct(k)` là số đo thật nên element burst thì driftCF
tụt theo. Mỗi ca đếm được báo kèm khoảng tốc độ mà nó vẫn đúng (e1r-41: đúng
với mọi tốc độ ≥ 0,795×).

### 2.2 Cờ nhiễm pause-seek (`windowContaminated`)

Probe dừng ở `localPh ≥ 5,0` rồi pause app → nhánh pause/Seeker seek element về
playhead (`seek.ts:397`, **không** tăng `__vcutSyncReseeksVideo`). Nếu cửa sổ
k+1..k+2 chạm lúc probe dừng, bằng chứng bị nhiễm. Hai dấu hiệu (cả hai đều
được test, T11/T13–T15):

- **(a) ct lùi:** decoder phát xuôi không bao giờ lùi `currentTime`; ct lùi
  > 1 ms trong cửa sổ → nhiễm seek ngoài.
- **(b) pause-seek đáp đúng ph:** watch chết đúng tick ct đáp CHÍNH XÁC lên
  ph (|ct−ph| < 1 ms) mà KHÔNG mở tail (dọn watch vì seeking — chỉ nhánh
  advance mới mở tail) và KHÔNG có resync nào (mọi seek lúc phát đều đếm vào
  `resyncsV`/`restartV`). Burst thật của decoder cũng dọn watch nhưng MỞ tail
  nên không chạm cờ này; drift re-seek thật thì có resync nên cũng không chạm.

Cờ chỉ để báo — verdict vẫn theo các điều kiện §2.1 (vd f3-8313: cf1 đã không
due trên dữ liệu sạch nên verdict NOT-HELD đứng dù k+2 nhiễm).

### 2.3 File mới + test

- `apps/web/scripts/armHeld99a3.mjs` — classifier thuần §6 (hàm
  `classifyArmHeld99A3`, `counterfactualDrift99A3`,
  `counterfactualRateInterval99A3`, `intersectRateIntervals99A3`).
- `apps/web/scripts/armHeld99a3.test.mjs` — **16/16 pass** (`node --test`):
  T1 CANCELLED-cũ-điển-hình; T2 replay e1r-41; T3 replay e2r-27; T4 DELAYED;
  T5 tail-sống; T6 watch-chết-1-tick; T7 arm-vì-bò; T8 cuối trace →
  INCONCLUSIVE; T9/T9b drift âm; T10 khoảng tốc độ; T11 replay f3-32; T12
  e1r-41 không nhiễm; **T13 replay f5-55 (suýt-đếm, nhiễm pause-seek đáp ph)**;
  **T14 burst thật mở tail → không nhiễm; T15 drift re-seek thật → không
  nhiễm**.
- `apps/web/scripts/analyze99a3-grace-ceiling.mjs` — analyzer = copy analyze98z3
  + §6 ARM-HELD + đối chiếu tốc độ playhead khi không giữ (median dph/dt, flag
  khi n < 5 hoặc lệch 1,0× quá 0,3). Đã verify §1–§5 tái hiện **đồng nhất** với
  analyzer Z3 trên cùng 13 file cũ (diff chỉ khác các dòng §6).
- `apps/web/scripts/probe99a3.mjs` — probe = copy probe98z3, scratch sang
  `hidden_files/round99-a3`, CFG `/tmp/round99-a3`; đã sửa nhãn log
  `load=${LOAD}` → `loadN=${LOAD_N}` (quirk kế thừa: log cũ in `load=false`
  dù loadN=4).

## §3. Phương pháp đo

- **13 lượt cũ** (đợt 96 b1/b2/b3/b4c/b5/c1/c2 + đợt 97 d1/d2/d3 + đợt 98
  e1r/e2r/e3): phân tích lại bằng analyzer 99a3; prototype `/tmp/a3-proto.mjs`
  (output lưu ở `hidden_files/round99-a3/proto-old13-a3.txt`): 6 lần arm / 13
  lượt; CANCELLED = 0 (khớp X4b + Z3).
- **5 lượt mới f1–f5** (probe99a3, WebKitGTK, clip bóng 720p 6 s, chạy tuần
  tự, 1 instance mỗi lần, dọn process sau mỗi lượt; tất cả exit 0, 2 verdict
  probe PASS; `preview.tsx` mtime không đổi giữa lượt:
  2026-11-12T17:54:44.064Z):

| Lượt | Cấu hình | Gap mean | Arm (cũ) | ARM-HELD §6 |
|---|---|---|---|---|
| f1 | load4 GOP250 | 541 ms (nặng) | 3, đều AMBIGUOUS | 0 |
| f2 | load3 GOP30 | 206 ms (nhẹ) | 0 | 0 |
| f3 | load2 GOP250 | 211 ms (nhẹ) | 2: NOT-DUE 1, **CANCELLED 1** | 0 |
| f4 | load4 GOP30 | 436 ms (tải vừa) | 2, đều AMBIGUOUS | 0 |
| f5 | load1 GOP250 | 252 ms (nhẹ) | 2, NOT-DUE | 0 |

- **Kiểm tay:** mọi ca ARM-HELD / CANCELLED / suýt-đếm đều được kiểm lại từ tick
  thô (xem §4.2–§4.4), không tin mù analyzer.
- **Kiểm chứng cuối trên cây cuối** (sau khi viết classifier + analyzer):
  `tsc` web 0 lỗi; `vite build` PASS (6,86 s);
  `playheadHold90R2.test.ts` 56/56; `playheadPacing54K9.test.ts` 19/19;
  `armHeld99a3.test.mjs` 16/16. `preview.tsx` mtime lúc kiểm chứng cuối vẫn
  2026-11-12T17:54:44.064Z — cây không đổi từ lúc đo f1–f5, số đo hợp lệ trên
  cây này.

## §4. Số đo thô

### 4.1 Bảng gộp 18 lượt

- re-arm: **15** | CANCELLED (hẹp) = **1** (f3 artifact) | DELAYED = 2 |
  NOT-DUE = 7 | AMBIGUOUS = 5
- **ARM-HELD §6 = 1** (e1r-11829, dữ liệu cũ) | INCONCLUSIVE = 0
- Grace §4: chuỗi ≥ 2 tick **BỊ CHẶN = 8, LỌT = 0** (3 cũ: e1r×2, e2r×1;
  5 mới: f1×1 len 10 maxDrift 2,500; f3×1 len 4 maxDrift 1,124; f4×1 len 6
  maxDrift 2,467; f5×2 len 2 maxDrift 0,500 + len 3 maxDrift 0,878)
- Crawl: arm-vì-bò = 4, tick-bò = 27, re-seek sau arm-vì-bò = 0
- Drift re-seek (đã trừ forceSeek+restart): 14; re-seek video tổng: 23;
  nhảy hại Δph: 8 (carve-out 3); sau nhảy hại ≤ 2 tick: 3; seeking kẹt ≥ 3 s: 3;
  stall ≥ 300 ms: 50; ứng viên trần (≥ 4,5 s): 1, nhả trần quan sát: 0
- Tick element tăng ≥ 1 frame: 255, trong đó Δct > 0,35: 86 (34%)

### 4.2 Bảng 15 ca arm (đủ 15, theo thứ tự thời gian)

| # | Lượt | relMs | drift k−1 / k | Phân loại cũ | §6 ARM-HELD | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | b1 | 12394 | 1,033 / 1,033 | DELAYED (resync +2) | NOT-HELD | watch chết ngay, resync bắn +2 tick |
| 2 | b2 | 7215 | 0,367 / 0,367 | DELAYED (resync +2) | NOT-HELD | như trên |
| 3 | c1 | 2864 | 0,100 / −0,684 | NOT-DUE | NOT-HELD | watch chết sau 1 tick |
| 4 | e1r | 6637 | −0,167 / −1,126 | NOT-DUE | NOT-HELD | tail tiếp quản — công quy §4 |
| 5 | **e1r** | **11829** | **0,133 / 0,133** | **NOT-DUE** | **ARM-HELD** | **ca chặn seek thật duy nhất (§4.2 chi tiết)** |
| 6 | e2r | 7490 | 0,000 / 0,000 | NOT-DUE | NOT-HELD | phản-thực chưa due ở k+1 (0,21 < 0,35) — cần 3 tick mới đủ 2 lần xác nhận |
| 7 | f1 | 8199 | −0,467 / −1,600 | AMBIGUOUS | NOT-HELD | drift âm, arm-vì-bò (tick 20) |
| 8 | f1 | 9789 | −1,033 / −2,500 | AMBIGUOUS | NOT-HELD | drift âm |
| 9 | f1 | 12205 | −1,600 / −1,733 | AMBIGUOUS | NOT-HELD | drift âm; phản-thực cf2 = +0,15 không due |
| 10 | f3 | 6922 | −0,233 / −1,124 | NOT-DUE | NOT-HELD | arm-vì-bò (tick 29) |
| 11 | f3 | 8313 | −0,400 / −0,400 | **CANCELLED** | NOT-HELD | **artifact pause-seek (§4.3)** |
| 12 | f4 | 8896 | −0,667 / −2,000 | AMBIGUOUS | NOT-HELD | drift âm, arm-vì-bò |
| 13 | f4 | 10183 | −1,267 / −2,467 | AMBIGUOUS | NOT-HELD | drift âm, arm-vì-bò |
| 14 | f5 | 4090 | −0,267 / −0,886 | NOT-DUE | NOT-HELD | watch chỉ sống 1 tick (chuỗi grace len 1) |
| 15 | f5 | 12919 | 0,279 / 0,279 | NOT-DUE | NOT-HELD | **suýt-đếm, nhiễm pause-seek (§4.4)** |

### 4.3 Ca ARM-HELD duy nhất — e1r tick 41, relMs 11829 (đợt 98, dữ liệu cũ)

Kiểm tay từ tick thô (tick 37–47): watch `completedAtMs` = 11506; ph giữ
5,5333 suốt tick 41–43; ct đóng băng 5,4; drift phản-thực 0,406 / 0,825 ở
k+1/k+2 (cả hai due); không resync; element về drift 0 ở k+3. Đúng với mọi tốc
độ playhead ≥ 0,795×. Đây là ca chặn seek thật mà CANCELLED hẹp bỏ sót: drift
0,133 ở tick arm (NOT-DUE cũ) nhưng máy re-arm đã giữ playhead đủ lâu để
drift phản-thực vượt ngưỡng 2 tick liên tiếp mà không có seek nào bắn.

Lưu ý tick 44 (ct→5,5333): decoder burst +0,133/108 ms = 1,23× HOẶC
pause-seek của probe — không phân biệt được, và verdict §6 không phụ thuộc
tick 44 vì chỉ dùng tick k..k+2; pause rơi vào khoảng relMs 12521–12629+ vì
watch còn sống ở tick 43 chứng tỏ vẫn đang phát.

### 4.4 CANCELLED hẹp đầu tiên — f3 tick 32, relMs 8313: ARTIFACT, không phải hủy seek thật

Chứng minh tay từ tick thô: drift −0,4 due ở k−1/k; watch arm ở k rồi chết ở
k+1 (pause-seek của probe khi dừng ở localPh ≥ 5,0 làm `seeking=true` → dọn
watch, không tail); ct lùi 5,9→5,5 ở k+2 = pause-seek kéo element về playhead
(đường Seeker `seek.ts:397`, không tăng `resyncsV`; mọi seek lúc phát đều tăng
counter; `restartV` = 0; nhánh reverse không áp dụng). §6 loại đúng ca này
(cf1 = −0,288 không due trên dữ liệu sạch; cờ `[NHIỄM-PAUSE-SEEK: ct-lùi]` đã
cài và chỉ bắn đúng 1 lần này trên 18 lượt cho dấu hiệu (a)).

### 4.5 Ca suýt-đếm — f5 tick 55, relMs 12919 (nhiễm pause-seek đáp ph)

Tick thô: k−1 tick 54 ct = 4,7881, ph = 5,0667, tail sống; k tick 55 arm
(drift 0,279); k+1 tick 56 ct = 4,8333 (+0,045 bò), ph giữ 5,0667, watch sống;
k+2 tick 57 ct = 5,0667 (đáp ĐÚNG ph), watch chết, không tail, `resyncsV` = 3
không đổi, `restartV` = 0. Phản-thực due cả 2 tick: cf1 = 0,703, cf2 = 0,697
(khoảng tốc độ [0,50, ∞)). Watch chết ở k+2 vì seeking mà không có resync/
restart nào — loại trừ hết chỉ còn pause-seek của probe (probe dừng ở
localPh ≥ 5,0 ngay trong cửa sổ). Nếu probe không dừng, ca này có thể đã đếm
(cf2 không có pause-seek còn lớn hơn: 0,931). **Không đếm** (verdict NOT-HELD
+ cờ `[NHIỄM-PAUSE-SEEK: pause-seek-đáp-ph]`), và ghi rõ: đây là ca suýt-đếm
bị probe cướp mất bằng chứng, không phải bằng chứng máy thất bại.

### 4.6 Chế độ drift âm (element chạy trước playhead) dưới tải nặng — f1 + f4

5 arm với drift −1,6 / −2,0 / −2,47 / −2,5 / −1,73, đều AMBIGUOUS cũ, đều
NOT-HELD §6 — vì (a) element burst dọn watch trong 1 tick, (b) drift âm tự về
khi ph đuổi kịp nên phản-thực hiếm khi due đủ 2 tick (vd f1 arm 12205:
cf2 = +0,15). Việc chặn seek thật trong chế độ này do máy grace §4 làm
(chuỗi len 10 và len 6 BỊ CHẶN), không phải do một lần arm giữ 2 tick.

Quan sát phụ (f4, ngoài phạm vi §6 nhưng đáng ghi nợ): tail đóng khi element
burst +1,16 s (đủ 2 advance theo luật tail) rồi drift re-seek bắn ngay tick
sau (tick 21/22, ct 5,4242→3,5333 = đúng ph, `resyncsV` 1→2), seek kẹt 5,5 s+
(`seeking=true` ở mẫu cuối relMs 16386, ph đóng băng 3,5333; probe dừng sớm
vì "playhead đóng băng ≥ 2,5 s trong lúc seeking"). Luật "2 advance = resume
ổn" bị burst lừa — xem nợ §7.

### 4.7 Tốc độ playhead khi không giữ (đối chiếu 1,0× dùng trong phản-thực)

Median/lượt: b1 0,81× (n=5); b2 0,97×; b3 0,99×; b4c 1,02×; b5 1,66× (n=2);
c1 0,98×; c2 0,99×; d1 1,00×; d2 1,04×; d3 1,09×; e1r 1,09×; e2r 1,13×;
e3 1,08×; f1 1,44× (n=1, flag không đủ mẫu); f2 1,20×; f3 0,82×;
f4 1,60× (n=1, flag); f5 1,36× (n=10, flag lệch > 0,3). Đa số ~1,0×; các
lượt lệch cao là catch-up sau giữ (ph nhảy bù dt đã tích lũy) — dùng 1,0× cố
định trong phản-thực là bảo thủ (tính thiếu drift, không tính thừa), và mỗi
ca đếm được đều báo khoảng tốc độ để người đọc tự kiểm.

## §5. Kết luận — trả lời nợ đợt 98 §4 mục 4

1. **Phân loại CANCELLED hẹp KHÔNG đếm được đuôi chặn thành công.** Bằng
   chứng: 13 lượt cũ CANCELLED = 0 dù có 1 ca chặn seek thật (e1r-41) mà §6
   bắt được; 5 lượt mới chỉ cho ra 1 CANCELLED và đó là artifact probe. Nguyên
   nhân là thiết kế (§1), không phải thiếu lượt đo — chạy thêm lượt cùng thiết
   kế sẽ vẫn ra ~0.
2. **ARM-HELD (§6) đếm được, và không đếm oan:** 1 ca thật / 18 lượt
   (e1r-41), 0 ca trên 5 lượt mới (1 suýt-đếm f5-12919 bị probe nhiễm — không
   đếm, ghi rõ lý do). Tỷ lệ thấp là thật: re-arm chỉ giữ được 2 tick khi
   element đóng băng sâu mà playhead chưa đuổi kịp; phần lớn arm chết trong
   1 tick vì element burst ngay (DELAYED b1/b2, c1, f1/f4) hoặc tail đã tiếp
   quản (e1r-23).
3. **Đuôi/tail chặn thành công nên đo bằng §4, không bằng CANCELLED:**
   BỊ CHẶN = 8, LỌT = 0 trên 18 lượt — máy grace (tail + watch) chặn được mọi
   chuỗi drift vượt ≥ 2 tick quan sát được. CANCELLED hẹp nên được xem là chỉ
   số phụ đã lỗi thời, không phải thước đo chính của re-arm.
4. **Z3's fix (bò không reset đồng hồ 300 ms) hoạt động ngoài đời:** arm-vì-bò
   0/13 lượt cũ → 4/5 lượt mới (f1: 1, f3: 1, f4: 2), 27 tick-bò, 0 re-seek
   trong 3 tick sau arm-vì-bò.

## §6. Caveat (đọc trước khi trích số)

- **Tick probe ≠ tick app (±1 tick, caveat W5 §6.3):** mọi verdict đều có sai
  số ±1 tick; hook `resyncsV` chậm 1 nhịp (vd f4 tick 21/22). Không ca nào
  trong doc này đổi verdict nếu dịch ±1 tick — đã kiểm tay từng ca.
- **Tốc độ phản-thực 1,0× cố định:** là tốc độ thiết kế, bảo thủ (§2.1);
  median tốc độ đo được nhiễu khi n nhỏ (f1/f4 n=1 — flag trong analyzer).
  Mọi ca ARM-HELD đều kèm khoảng tốc độ; ca e1r-41 đúng với mọi tốc độ
  ≥ 0,795×, ca f5-12919 với mọi tốc độ ≥ 0,50×.
- **Pause-seek nhiễm cửa sổ arm gần cuối lượt:** probe dừng ở localPh ≥ 5,0
  nên mọi arm ở ~0,5 s cuối lượt đều có nguy cơ nhiễm; cờ
  `windowContaminated` (2 dấu hiệu, §2.2) bắt được 2/2 ca nhiễm trên 18 lượt
  (f3-8313, f5-12919) và không bắn oan trên 13 ca còn lại (T14/T15 khóa hai
  đường bắn oan: burst mở tail, drift re-seek có resync).
- **Phạm vi đo hẹp:** chỉ 1 clip 720p 6 s, WebKitGTK, GOP 30/250, load 1–4;
  không đo Chromium (RAM khả dụng ~0,7–1,8 GB, VM reboot ~2 h/lần). Số đo là
  bằng chứng ngoài đời trên cấu hình này, không phải đảm bảo cho mọi clip/
  máy.
- **Không đụng TTS 39 (cấm kiểm lại), không thử birefnet (RAM không đủ).**

## §7. Nợ còn lại

- **G1 (deinterlace) vẫn mở, chờ user quyết** (đợt 98 Z9: chân yên 30fps
  14/18 = 78%, còn thiếu 2 PASS liên tiếp).
- **Arm-vì-bò mới 4 ca, cần thêm lượt đo bò** sau khi watch hết (kiểu d3 đợt
  97) để xem bò có arm lại được không.
- **Trần 5000 ms vẫn 0 nhả quan sát trên 18 lượt** (ứng viên trần: 1, nhả
  trần: 0) — chưa đo được hành vi trần.
- **f4 tail-expiry (§4.6):** luật tail "2 advance = resume ổn" bị burst
  +1,16 s lừa → drift re-seek bắn ngay sau khi grace tắt, seek kẹt 5,5 s+.
  Đề xuất cho luồng khác: xem lại ngưỡng đóng tail (vd đòi 2 advance LIÊN
  TIẾP ở tốc độ gần 1× thay vì 2 advance bất kỳ), hoặc grace kéo dài 1 tick
  sau khi tail đóng. A3 chỉ ghi nợ, không sửa production.
- **ci-security.yml vẫn 403** (chờ user); **TTS 39 và birefnet vẫn cấm**.
- Phân loại CANCELLED hẹp (§1 analyzer) giữ nguyên để tương thích lịch sử;
  ARM-HELD §6 là thước đo chính mới cho "seek bị re-arm chặn" từ đợt 99.

## Phụ lục — file liên quan

- Classifier + test: `apps/web/scripts/armHeld99a3.mjs`,
  `apps/web/scripts/armHeld99a3.test.mjs` (16/16).
- Analyzer + probe: `apps/web/scripts/analyze99a3-grace-ceiling.mjs`,
  `apps/web/scripts/probe99a3.mjs`.
- Log phân tích: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round99-a3/`
  (`analyze-all18-a3.txt`, `analyze-f1..f5-a3.txt`, `probe-f1..f5.log`,
  `probe-webkit-load*-f*/probe-results.json`, `analyze-old13-a3.txt`,
  `proto-old13-a3.txt`).
- Doc tiền lệ: `docs/PHASE9_ROUND98_Z3_REARM_CRAWL_LIMITS.md`,
  `docs/PHASE9_ROUND98_LIMITS.md` §4 mục 4.

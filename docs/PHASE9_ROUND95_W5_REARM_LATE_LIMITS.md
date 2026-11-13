# Phase 9 đợt 95 — W5: Trần stall re-arm vào trễ ~1 tick (nợ LIMITS gộp đợt 94 §4 mục 5)

**Nợ gốc:** V2 đợt 94 sửa re-arm (`nextResumeFreezeRearm`,
`playheadHold90R2.ts` + `preview.tsx`) nhưng vào trễ ~1 tick rAF —
stall 2+ ngắn (300–600 ms, đúng cỡ thường gặp) vẫn để playhead
+0,37–0,67 s, có thể tự kích drift re-seek; chỉ stall 2+ dài
(≥~800 ms–1 s) mới giữ được phần còn lại.
**Ngày:** 12/11/2026 (lượt cron 12:35 +07; làm việc 05:50–06:50Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). **Không đụng
TTS 39, không đụng `.github/workflows`, 0 binary vào batch. Không giết
process của luồng khác.**
**Trạng thái:** **ĐÃ SỬA HƯỚNG (b), ĐÃ ĐO LẠI — nợ GIẢM THÊM, CHƯA ĐÓNG
HẲN** (xem §1 + §5 mục 1): ân hạn drift re-seek 1 tick sau re-arm đã
chứng minh là kích hoạt + hoãn seek đúng 1 tick ngoài đời (p3b), nhưng
chưa có trường hợp nào nó HỦY được re-seek (element chưa resume kịp
trong đúng 1 tick đó); hướng (a) bị bác bằng đo (xem §2).

## 1. Kết quả

### 1.1 Hướng (a) — dự đoán stall bằng vận tốc advance: BỊ BÁC, KHÔNG LÀM

Đo 8 lượt pre-fix (4 lượt luồng này: WebKit + tải 3/4×`yes`, GOP 250/30)
+ phân tích lại 2 lượt V2 có re-arm:

- **Không có trường hợp nào để (a) cứu:** 0 stall ngắn 300–600 ms
  không-giữ trong 4 lượt pre-fix. 8 stall ≥300 ms bắt được đều DÀI
  (2,4–6,7 s) và đều đã được giữ bởi watch S2 (rTicks tăng qua mọi
  stall) — arm sớm cho chúng không mua được gì.
- **Vận tốc onset không phân biệt được:** vận tốc thật ở tick tăng cuối
  trước khi đóng băng là 0,00–0,23× (6/8 dưới 0,1; 2 trường hợp
  0,11/0,23); nhưng tick bình thường cũng có vận tốc thấp — xem dưới.
  Ngược lại, stall ở p2 post-fix có v_onset = 1,54× (tick burst
  trước khi đóng băng) — vận tốc CAO lại đi trước stall, tức tín hiệu
  này còn PHẢN dự đoán trong trường hợp đó.
- **Tỉ lệ giữ oan cao, mẫu nhỏ:** tick bình thường sạch (sau khi loại
  tick seeking ±600 ms + tick sau khi probe dừng phát + trước
  seekDone) chỉ n=6 pre-fix / n=19 post-fix. Giữ oan: pre-fix 1/6
  (17%) ở ngưỡng v<0,1–0,3 và 2/6 (33%) ở v<0,5; post-fix gộp 3/19
  (16%) ở v<0,1 và 9/19 (47%) ở v<0,5. Mẫu quá nhỏ để kết luận chặt,
  nhưng cùng hướng với cảnh báo V2: decode bursty — v nhảy 0,04 →
  2,45 giữa 2 tick kề nhau (r3 pre-fix), 0,00 → 2,58 trong pool
  post-fix. Mọi ngưỡng đều arm oan một phần đáng kể tick bình thường.
- **Kết luận (a): KHÔNG triển khai.** Bằng chứng đo không ủng hộ:
  không có benefit case nào quan sát được, tín hiệu vận tốc không
  tách được stall khỏi phát bình thường dưới tải này, và ngưỡng nào
  cũng giữ oan. Ghi nhận để không ai làm lại mà không có số đo mới.

### 1.2 Hướng (b) — khoan kích drift re-seek 1 tick sau re-arm: ĐÃ SỬA + ĐÃ ĐO

**Bằng chứng chọn (b):** truy vết lại JSON thô V2 — GOP 250 r5 stall 3
(323 ms, elT 5,367, ph +0,667): re-arm và drift re-seek #2 bắn CÙNG
cửa sổ liên-mẫu (14436→14624 ms), tức re-seek bắn đúng tick mà giữ
vừa vào. Đó là đúng cuộc đua mà (b) nhắm tới. 4 lượt pre-fix của luồng
này: 0 re-arm nên không thêm bằng chứng mới, cũng không mâu thuẫn
(cơ chế chỉ kích khi có re-arm).

**Sửa (marker "Đợt 95 W5" / `95W5`):**
- `apps/web/src/lib/playheadPacing.ts` — `shouldIssueForwardReseek`
  thêm tham số tùy chọn `graceTick = false`: khi drift đã đủ số tick
  xác nhận mà grace bật thì trả `{ seek: false, overCount:
  confirmTicks − 1 }` — tick sau (không còn grace) drift vẫn vượt thì
  seek ngay, đúng trễ 1 tick; nếu element resume trong tick ân hạn và
  drift về dưới ngưỡng thì không seek nữa (overCount reset về 0 như
  thường). Mọi tick khác hành vi giữ nguyên như cũ.
- `apps/web/src/preview.tsx` — set `resumeRearmedThisTick95W5` (làm
  mới mỗi tick trước khối detector, ghi element vừa được arm) → truyền
  vào `syncMedia` (tham số tùy chọn mới) → nhánh forward truyền
  `has(a.el)` làm graceTick. Chỉ video xuôi, chỉ đường drift qua
  helper; `freshSeekDue` không ân hạn (element mới chưa từng qua tick
  phát nào không thể có re-arm cùng tick); đường `restartEnded` không
  đổi; đường pause (syncMedia với playing=false) không truyền set nên
  không ân hạn.

**Đo lại sau sửa — 4 lượt WebKit + tải (p1/p2/p3b/p4; p3 lỗi setup
pause-seek không xác nhận canvas sau 30 s, chạy lại thành p3b):**
- **Stall 1 vẫn giữ 4/4 lượt** (playhead đứng yên 0,500 suốt stall 1;
  rTicks tăng; VERDICT probe PASS cả 4 lượt).
- **Re-arm kích hoạt 2/4 lượt post-fix** (p2, p3b; pre-fix 0/4 — tải
  nhẹ dần trong lượt: rAF gap mean 424–608 ms post-fix so với
  617–728 ms pre-fix, RAM khả dụng lên ~2,5 GB).
- **Ân hạn kích hoạt ngoài đời 1 lần (p3b, GOP 250 load3):** stall ở
  ct 5,367, playhead nhảy 5,333 → 5,867 trong 1 tick (drift 0,5,
  overCount=1); tick arm re-arm giữ playhead ở 5,867, grace hoãn
  drift re-seek đáng lẽ bắn tick đó (resyncsV giữ 2); tick sau
  element vẫn chưa resume → re-seek bắn (trễ đúng 1 tick như thiết
  kế), element seek về 5,867. **Ân hạn đã chứng minh là hoãn đúng
  1 tick, nhưng CHƯA hủy được re-seek nào** — element phải resume
  trong đúng 1 tick ân hạn mới hủy được, và ở trường hợp này nó
  không resume kịp.
- **p2 (GOP 30 load4):** re-arm arm + giữ 1 tick (rTicks 6→7, rHolds
  1→2, rearms 0→1) trong stall 1128 ms ở ct 3,433; re-seek sau đó
  (2,2 s sau arm) là đường `restartEnded` (element chạm cuối clip
  6,0 rồi seek về 5,667) — không phải drift re-seek, grace không liên
  quan theo thiết kế.
- **Không hồi quy:** re-seek video 8 lượt post-fix (2,0/lượt) so với
  10 lượt pre-fix (2,5/lượt); không có giữ oan / re-seek thừa nào
  quy được cho ân hạn (ân hạn chỉ kích đúng tick arm, tối đa 1 tick
  mỗi lần arm).

### 1.3 Kiểm chứng

- tsc web **0 lỗi**.
- vite build **PASS** (14,83 s).
- `playheadPacing54K9.test.ts` **17/17** (11 cũ + 6 mới W5-R1..R6 —
  R1 hoãn đúng 1 tick, R2 resume trong ân hạn thì hủy seek, R3 không
  grace thì hành vi cũ, R4 grace vô tác dụng khi dưới ngưỡng/đang
  seeking, R5 grace ở tick vượt đầu tiên, R6 confirmTicks=3).
- `playheadHold90R2.test.ts` **41/41**; `seek.test.ts` **21/21**
  (file đã có 21 test — luồng sibling sửa lúc 06:04Z, 20→21, không
  phải của luồng này); `seekSkipRender86N3.test.ts` **9/9**;
  `previewLoop50F2.test.ts` **20/20**.
- Click-test O8 (đụng preview pipeline): Chromium **21/21**,
  WebKit **21/21** (xem §4).

## 2. Vì sao (a) bị bác — số đo vận tốc chi tiết

Probe mới `probe95w5-velocity.mjs` (copy probe94v2 + sampler vận tốc
rAF trong trang: mỗi rAF ghi {t, ct, ph, rearms, rTicks, rHolds,
resyncsV} vào `window.__w5ticks`, tối đa 5000 tick; không đổi hành vi
app) + analyzer `analyze95w5-velocity.mjs` (phân phối v = Δct/Δt theo
từng tick; stall = chạy tick ct không tăng ≥1 frame, ≥300 ms; tick
bình thường = sau seekDone, không seeking ±600 ms, chưa hết clip,
chưa qua lúc probe dừng phát).

### 2.1 Pre-fix (4 lượt, WebKit + tải)

| Lượt | rAF gap mean | Stall ≥300 ms | v_onset thật | Tick bình thường (n) | Giữ oan v<0,1 | Giữ oan v<0,5 |
|---|---|---|---|---|---|---|
| GOP 250 load4 r1 | 676 ms | 1 (2372 ms) | 0,00 | 1 (v=0,09) | 1/1 | 1/1 |
| GOP 30 load4 r2 | 728 ms | 2 (6201/5499 ms) | 0,00 / 0,05 | 1 (v=1,02) | 0/1 | 0/1 |
| GOP 250 load3 r3 | 726 ms | 2 (6702/4335 ms) | 0,00 / 0,11 | 3 (v 0,47–0,64) | 0/3 | 1/3 |
| GOP 30 load3 r4 | 617 ms | 3 (5384/2736/3812 ms) | 0,00 / 0,23 / 0,08 | 1 (v=0,82) | 0/1 | 0/1 |
| **Gộp (sau khi loại tick sau-stop)** | — | **8, dài 2,4–6,7 s** | **0,00–0,23** | **6** | **1/6 (17%)** | **2/6 (33%)** |

Ghi chú về n=6: pool tick bình thường sạch rất nhỏ vì cửa sổ phát
dưới tải này gần như chỉ gồm stall dài + seeking + burst: element
hoặc đóng băng nhiều giây, hoặc seeking 6–9 s (seek kẹt WebKit), hoặc
nhảy burst +0,5–2,4 s/tick. Có rất ít tick "phát bình thường" để đo
tỉ lệ giữ oan — đó tự nó đã là một kết quả: dưới tải này, vận tốc
theo tick gần như luôn là 0 hoặc burst, không có miền giữa ổn định
để đặt ngưỡng. (Bản phân tích đầu chưa loại tick seeking/đuôi đã báo
giữ oan 92–100% — sai; xem §6 mục 4.)

### 2.2 Post-fix (4 lượt — cùng để đối chiếu, không phải để cứu (a))

| Lượt | rAF gap mean | Stall ≥300 ms | v_onset | Tick bình thường (n) | Giữ oan v<0,1 | Giữ oan v<0,5 |
|---|---|---|---|---|---|---|
| GOP 250 load4 p1 | 473 ms | 2 | 0,00 / 0,00 | 3 | 2/3 | 2/3 |
| GOP 30 load4 p2 | 513 ms | 2 | 0,00 / **1,54** | 4 | 1/4 | 2/4 |
| GOP 250 load3 p3b | 424 ms | 1 | 0,00 | 7 | 0/7 | 2/7 |
| GOP 30 load3 p4 | 608 ms | 2 | 0,00 / 0,18 | 5 | 0/5 | 3/5 |
| **Gộp** | — | **7** | — | **19** | **3/19 (16%)** | **9/19 (47%)** |

- Stall p2 thứ 2 (1128 ms, ct 3,433): v_onset = 1,54× — tick tăng
  cuối trước khi đóng băng là tick BURST (element nhảy tới điểm đóng
  băng với vận tốc 1,54×), nên ngưỡng vận tốc không những không arm
  sớm mà còn "chắc chắn" không arm (v cao = phát tốt theo logic (a)).
  Đây là phản ví dụ trực tiếp cho (a).
- Phân phối v tick bình thường gộp post-fix: p5=0,00, p25=0,14,
  p50=0,55 — đuôi thấp dày đặc (25% tick có v ≤ 0,14 trong lúc phát
  bình thường), đuôi cao tới 2,58. Không có ngưỡng nào tách được.

### 2.3 Chế độ lỗi chi phối dưới tải hiện tại (phát hiện phụ, ngoài brief)

Dưới tải lượt này (rAF gap mean 424–728 ms, max tới 1,7 s), chu kỳ
chi phối KHÔNG phải stall 2+ ngắn của V2 mà là: stall dài (giữ đúng
bởi watch S2, rTicks tăng qua mọi stall) → playhead nhảy theo dt rAF
khổng lồ (1,0–1,7 s/tick) → drift vượt 0,35 → drift re-seek → seek
kẹt 6–9 s trên WebKit → stall dài tiếp (watch S2 mới từ re-seek giữ).
Re-arm không bao giờ kích trong 4 lượt pre-fix vì mọi lần đóng băng
đều nằm trong watch S2 còn sống (element đóng băng trong ~1 frame của
target re-seek nên filter chưa dọn watch — cùng pattern V2 đã ghi ở
GOP 250 r5 stall 2). Nợ re-arm trễ 1 tick chỉ biểu hiện khi tải vừa
đủ để stall 2+ ngắn xuất hiện mà watch S2 đã đóng — ở tải hiện tại
nó gần như không xuất hiện. Hướng sửa tương lai cho chu kỳ này (không
thuộc brief này): kẹp dt playhead mỗi tick, hoặc slew playhead sau
stall thay vì nhảy theo dt rAF.

## 3. Đo sau sửa — truy vết 2 lần re-arm (p2, p3b)

### 3.1 p3b — ân hạn kích hoạt ngoài đời (GOP 250, load3)

| relMs | ct | ph | rearms | rTicks | resyncsV | Diễn giải |
|---|---|---|---|---|---|---|
| 12405 | 5,367 | 5,333 | 0 | 7 | 2 | drift 0,034, overCount 0 |
| 12819 | 5,367 | 5,867 | 0 | 7 | 2 | ph nhảy +0,534/tick; drift 0,5, overCount 1 |
| 13227 | 5,367 | 5,867 | **1** | **8** | 2 | **re-arm arm + giữ ph; grace hoãn seek đáng lẽ bắn tick này** |
| 13497 | 5,867 | 5,867 | 1 | 9 | 2 | element resume (burst +0,5); drift 0 |
| 13914 | 5,867 | 5,867 | 1 | 9 | **3** | re-seek bắn ở tick sau arm (trễ đúng 1 tick); hook cập nhật chậm 1 nhịp do frame interleave |

Đọc đúng: grace đã hoãn seek đúng 1 tick như thiết kế (seek không
bắn ở tick arm dù drift 0,5 + overCount 2). Seek vẫn bắn ở tick sau
vì element chưa resume kịp trong tick ân hạn (ct vẫn 5,367 ở tick
sau arm; seeking=True ở mẫu 13413 chứng tỏ seek đã phát trước khi
element resume tự nhiên). **Chưa có trường hợp hủy seek nhờ ân hạn.**
Để hủy được, element phải resume trong đúng 1 tick ân hạn — cửa sổ
này hẹp (1 gap rAF, 300–600 ms dưới tải).

### 3.2 p2 — re-arm giữ nhưng re-seek sau đó không liên quan grace (GOP 30, load4)

| relMs | ct | ph | rearms | rTicks | resyncsV | Diễn giải |
|---|---|---|---|---|---|---|
| 8587 | 3,433 | 2,767 | 0 | 6 | 1 | stall 2: ct đóng băng, ph dưới ct |
| 9117 | 3,433 | 3,567 | 0 | 6 | 1 | ph nhảy +0,8/tick; drift 0,134 |
| 9715 | 4,721 | 3,567 | **1** | **7** | 1 | **re-arm arm + giữ ph 1 tick**; ct burst +1,288 ngay sau tick arm |
| 10400 | 4,833 | 4,133 | 1 | 7 | 1 | drift 0,7 — không seek (overCount mới 1 sau tick arm) |
| 11221 | 6,000 | 4,833 | 1 | 7 | 1 | element chạm cuối clip |
| 11618 | 5,667 | 5,667 | 1 | 7 | 1 | seeking (restartEnded) |
| 11904 | 5,667 | 5,667 | 1 | 7 | **2** | re-seek đường restartEnded, 2,2 s sau arm |

Re-arm vẫn arm + giữ đúng (rHolds 1→2). Re-seek sau đó là đường
`restartEnded` (element chạm cuối clip 6,0), không phải drift
re-seek — grace không áp dụng theo thiết kế, và cũng không nên áp
dụng (element ended cần seek về ngay).

## 4. Kiểm chứng O8

- **Chromium 21/21 PASS, 0 fail** (scratch `round95-w5/o8-chromium`,
  report JSON: 21 case pass; S7 mask Δx=0,112, bóng Δx=0,113 — khớp
  kỳ vọng canvas 0,112; E0 không lỗi JS).
- **WebKit 21/21 PASS, 0 fail** (scratch `round95-w5/o8-webkit`; S7
  mask Δx=0,194, bóng Δx=0,197 — khớp kỳ vọng canvas WebKit 0,194;
  E0 không lỗi JS/pageerror/crash).
- Không hồi quy parity render do sửa (b): ân hạn chỉ đổi thời điểm
  phát drift re-seek tối đa 1 tick, không đổi đường vẽ hay seek.

## 5. Giới hạn còn lại (trung thực)

1. **Nợ re-arm trễ 1 tick CHƯA ĐÓNG HẲN, chỉ giảm thêm một nấc:**
   (b) đã chứng minh hoãn đúng 1 tick ngoài đời (p3b) nhưng chưa
   chứng minh hủy được re-seek nào — mẫu duy nhất cho thấy element
   không resume kịp trong 1 tick ân hạn. Cần thêm lượt đo (đặc biệt
   ở tải vừa — rAF gap 300–500 ms — nơi stall 2+ ngắn hay xuất hiện
   nhất theo V2) để bắt trường hợp hủy-seek, hoặc chấp nhận (b) chỉ
   là giảm tần suất re-seek thừa chứ không loại được hẳn. Trần
   5000 ms vẫn chưa có bằng chứng nhả ngoài đời (stall dài nhất bắt
   được đợt này 6,98 s ở p4 — NHƯNG đó là stall sau seekDone được
   giữ bởi watch S2, không phải stall chạm trần; stall dài nhất
   trước đây 3904 ms ở U3; vẫn chưa có stall nào chạm 5000 ms).
2. **Hướng (a) đã đóng bằng đo âm tính** (xem §2): không triển khai,
   không nên làm lại nếu không có số đo mới ở tải khác hẳn (máy nhẹ,
   rAF ~16 ms — lúc đó stall 300–600 ms cũng hiếm).
3. **Chu kỳ stall dài → dt nhảy → re-seek → seek kẹt (§2.3)** vẫn mở
   và đang là chế độ lỗi chi phối dưới tải hiện tại — (b) không sửa
   được đường này (drift re-seek ở đó không đi qua tick arm).
4. **Chu kỳ resume-chậm → drift → re-seek (U3 §2.3)** vẫn mở: p2 là
   một biến thể (element burst vượt playhead rồi chạm cuối clip).
5. **Bằng chứng (b) còn mỏng:** 1 lần ân hạn kích hoạt ngoài đời
   (p3b) + 1 lần re-arm không liên quan grace (p2) + 6 unit test.
   Chưa có phân phối đầy đủ; re-arm là hiện tượng hiếm và phụ thuộc
   tải (0/4 lượt pre-fix, 2/4 lượt post-fix khi tải nhẹ dần).
6. **Độ phân giải sampler suy giảm dưới tải:** rAF gap mean
   424–728 ms, max 1,7 s; sampler 100 ms chỉ bắn ~2 mẫu/s; biên
   khoảng stall thô ±~300–500 ms; thời điểm arm/re-seek chỉ xác định
   được tới ±1 tick probe (tick probe ≠ tick app — xem §6 mục 3).
7. **Số đo chỉ cho 1 clip video, 720p, 6 s, WebKitGTK 27.2** — GOP
   30/250; Chromium không stall ở cùng tải nên không đo được stall
   2+ trên Chromium (O8 Chromium/WebKit 21/21 chứng minh không hồi
   quy chức năng).

## 6. Chuyện bên lề khi đo (đã xử lý)

1. **Lượt p3 post-fix lỗi setup** (pause-seek t=5 không xác nhận
   canvas sau 30 s, tElement=1586 ms nhưng tCanvas=null) — probe dừng
   đúng thiết kế, không dùng làm bằng chứng; chạy lại thành p3b rc=0.
   Cùng lỗi đã gặp ở U3 GOP 30 r2 (seek quá chậm dưới tải).
2. **seek.test.ts đổi dưới tay luồng khác** (mtime 06:04:09Z, 20→21
   test — có thể W2/W8 đợt 95): luồng này không sửa file đó; chạy
   lại vẫn xanh 21/21. W4 chưa sửa `preview.tsx` tới lúc luồng này
   xong (không có marker "Đợt 95 W4" trong file; mtime preview.tsx
   06:15:41Z là sửa của luồng này).
3. **Tick probe ≠ tick app:** sampler rAF của probe và vòng lặp preview
   là 2 callback rAF khác nhau; dưới tải, 1 tick probe có thể chứa
   2 tick app (hoặc ngược lại) nên thời điểm arm/re-seek chỉ xác
   định được tới ±1 tick probe, và hook `resyncsV` có thể cập nhật
   chậm 1 nhịp so với lúc seek phát (p3b: seek phát trước mẫu
   seeking 13413 nhưng hook chỉ lên 3 ở tick 13914). Mọi kết luận
   về "cùng tick" trong LIMITS này đều có biên này.
4. **Analyzer phải loại 2 loại tick nhiễu** (đã sửa trong
   `analyze95w5-velocity.mjs`): tick trong khoảng seeking ±600 ms
   (R2 seeking-hold lo, detector dừng theo dõi khi seeking — không
   phải stall resume) và tick sau khi probe dừng phát (sampler rAF
   vẫn chạy sau togglePlay tắt). Bản phân tích đầu chưa loại 2 loại
   này đã báo giữ oan 92–100% (sai — phần lớn là tick seeking/đuôi).
   Số cuối trong LIMITS này là số sau khi loại (pool sạch n=6
   pre-fix / n=19 post-fix — vẫn nhỏ, ghi rõ).
5. **Tải máy thay đổi mạnh trong lượt:** loadavg 1-phút 9,4 lúc bắt
   đầu (RAM khả dụng 678 MB) → ~2,6 lúc đo post-fix (RAM ~2,5 GB);
   rAF gap mean pre-fix 617–728 ms → post-fix 424–608 ms. So sánh
   trước/sau chỉ so được theo bậc độ lớn, không so từng chữ số —
   re-arm xuất hiện 2/4 lượt post-fix so với 0/4 pre-fix nhiều khả
   năng là do tải nhẹ dần, không phải do sửa (b) (sửa (b) không đổi
   detector).
6. **Va chạm với luồng W4:** sửa `preview.tsx` của luồng này lúc
   06:15:41Z rơi giữa lượt đo assert95b của W4 → HMR, 28 fail vô lý,
   lượt đó VÔ HIỆU (W4 đã ghi trong log của họ và dùng dữ liệu yên cũ
   thay thế). Đúng bài học đợt 94 §2 (luồng sửa cùng file phải báo
   nhau; probe phải kiểm tra mtime trước/sau lượt chạy). Luồng này đã
   kiểm tra mtime preview.tsx trước/sau mọi lượt đo của mình (không
   đổi trong các lượt đo), nhưng không báo trước cho W4 khi sửa —
   ghi nhận để đợt sau tránh.
7. **Server scratch O8:** script O8 tự dọn vite/bridge/browser khi xong
   (kiểm tra sau khi chạy: không còn process probe95w5/clicktest-87o8
   hay `yes` nào của luồng này). Xvfb :187/:188/:193–:197 để lại cho
   luồng sau dùng chung (tiền lệ V2); vite 5173 của W4 vẫn chạy — không
   phải của luồng này, không đụng.

## 7. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadPacing.ts` — `shouldIssueForwardReseek`
  thêm `graceTick` (Đợt 95 W5).
- `apps/web/src/lib/playheadPacing54K9.test.ts` — 6 test mới W5-R1..R6
  (17/17).
- `apps/web/src/preview.tsx` — set `resumeRearmedThisTick95W5`
  (detector ghi, syncMedia đọc), tham số mới cho `syncMedia`, truyền
  graceTick ở nhánh forward.
- `apps/web/scripts/probe95w5-velocity.mjs` — probe đo vận tốc rAF
  (copy probe94v2 + sampler vận tốc + `resyncsV` trong mẫu 100 ms).
- `apps/web/scripts/analyze95w5-velocity.mjs` — phân tích vận tốc /
  giữ oan / re-seek-vs-re-arm (mới).
- `docs/PHASE9_ROUND95_W5_REARM_LATE_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round95-w5-rearm-late`
(`~/workspace/repo-1-push/paths-loop/phase9-round95-w5-rearm-late.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w5.md`.
Dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w5/probe-*/probe-results.json`
+ `analyze-pre-r1r2r3r4.txt` + `analyze-post-p1p2p3bp4.txt` +
`o8-chromium/` + `o8-webkit/` (`o8-clicktest-report.json`).
Clip GOP 30/60: fixture của T3 ở `round92-t3/clips/` (binary, KHÔNG stage).

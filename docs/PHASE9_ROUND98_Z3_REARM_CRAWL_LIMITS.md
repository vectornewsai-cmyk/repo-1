# Phase 9 đợt 98 — Z3: đóng băng theo tốc độ (re-arm crawl) + carve-out analyzer b5

**Nợ gốc:** LIMITS gộp đợt 97 §4 mục 3 — re-arm là nợ lớn nhất còn lại:
(a) detector mù với stall "bò" (element tăng đúng ~1 frame/tick dài,
0,055× realtime, reset đồng hồ đóng băng 300 ms → drift re-seek bắn,
kẹt seek 1,63 s ở d3 đợt 97); (b) analyzer cần carve-out cho tick nhảy
ở đầu khoảng seeking (ca b5); (c) trần 5000 ms vẫn 0 ứng viên / 10 lượt;
(d) CANCELLED vẫn 0 ngoài đời.
**Ngày:** 12/11/2026 (lượt cron 21:35 +07; Z3 làm việc 14:38–15:15Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** **ĐÃ SỬA (định nghĩa đóng băng theo tốc độ 98Z3), ĐÃ ĐO
TRƯỚC + SAU SỬA — nợ GIẢM THÊM, CHƯA ĐÓNG HẲN** (xem §1 + §5): carve-out
bắt được ca b5 (xem §1.1); luật vận tốc giữ playhead qua 4 lần tăng bò
ngoài đời ở e3 (xem §1.3 + §3.3); lần đầu tiên chuỗi grace ≥2 tick
BỊ CHẶN khác 0 (3 chuỗi, 0 lọt — xem §1.3, công của máy grace X4+Y4,
không phải của Z3); nhưng arm-vì-bò vẫn 0/3 lượt và CANCELLED vẫn 0.

## 0. Dữ liệu nào dùng, lượt nào hợp lệ

- **Tiền-sửa (đo lại bằng analyzer Z3, không chạy lại probe):** 7 JSON
  gốc đợt 96 — b1/b2/b3/b4c/b5 (X4) + c1/c2 (X4b) — + 3 JSON hậu-fix
  đợt 97 d1/d2/d3 (Y4). Kết quả
  `hidden_files/round98-z3/analyze-old7-plus-d3-z3.txt` (10 lượt gộp).
- **Hậu-fix (probe98z3, build đã gộp Z3 + Z2 + Z6 — xem §6):** 3 lượt
  hợp lệ, cả 3 đều PASS 2 verdict probe, mtime `preview.tsx` không đổi
  trong lượt (xem probe-*.log):
  - e1r: webkit load2 GOP250, gap mean 278 ms (nhẹ), 53 tick.
  - e2r: webkit load3 GOP30, gap mean 229 ms (nhẹ), 42 tick.
  - e3: webkit load4 GOP250, gap mean 513 ms (NẶNG), 57 tick.
  - 2 lượt đầu TIÊN bị loại theo đúng thiết kế probe (xem §6 mục 3):
    e1 lỗi setup (pause-seek tới t=5 không xác nhận canvas sau 30 s,
    tElement=4306 ms, tCanvas=null — cùng lỗi b4/b4b đợt 96, Y4 d1;
    lúc đó loadavg VM 19,7); e2 mẫu không tự load sau 240 s (page
    evaluate trả null dưới tải). Cả hai chạy lại khi VM yên thì PASS
    (e1r/e2r).
- **Gộp hậu-fix:** `round98-z3/analyze-post3-z3.txt`.

## 1. Kết quả

### 1.1 Câu (2a) — Carve-out analyzer: CA B5 ĐÃ ĐƯỢC BẮT

| | Analyzer Y4 (không carve-out) | Analyzer Z3 (carve-out đầu-seeking) |
|---|---|---|
| Nhảy hại gộp 7 lượt cũ | 2 | **3** |
| Ca bắt thêm | — | **b5 relMs=5270: Δph=+0,833, Δct=0,033, drift=0,767 [CARVE-OUT đầu-seeking]** |
| Re-seek sau nhảy hại ≤2 tick (gộp 7 lượt) | 0 | **1 (chính ca b5 — chu kỳ stall dài nay nối được nhảy → re-seek → kẹt seek 5,08 s)** |

- **Quy tắc carve-out (xem header analyzer):** tick có relMs trong
  [iv.start−600, iv.start) của một khoảng seeking — tức chỉ nằm trong
  phần mở rộng TRƯỚC mốc bắt đầu, không chạm mẫu seeking thật — thì
  usable cho riêng phép đếm nhảy hại. Tick TRONG khoảng seeking thật
  vẫn loại (seek đang bay lo). Phân biệt nhảy-hại vs tick-trong-seeking
  bằng thứ tự thời gian: nhảy TRƯỚC khi seeking bắt đầu thì nhảy là
  nguyên nhân (drift re-seek bắn rồi element mới seeking); tick trong
  lúc seeking đã bay thì seek là nguyên nhân, nhảy chỉ là playhead
  theo seek.
- **Không bắt thêm ca oan nào:** trên 10 lượt (7 cũ + 3 d), carve-out
  chỉ bắt thêm đúng 1 ca (b5); các lượt khác carve-out = 0. Ngưỡng
  1,5 frame + điều kiện Δph ≥ 0,5 + ph < 5,9 + sau seekDone vẫn giữ.
- **Chẩn đoán Y4 §1.1 nay đã đủ:** ngưỡng 1,5 frame là nguyên nhân cần,
  bộ lọc seeking-window là nguyên nhân thứ hai — cả hai đã được vá
  (ngưỡng ở Y4, carve-out ở Z3). Ca b5 không còn sót.

### 1.2 Sửa Z3 — định nghĩa đóng băng theo TỐC ĐỘ (marker "Đợt 98 Z3" / `98Z3`)

**Cơ chế (3 chỗ, 1 luật):** tăng >= 1 frame chỉ tính là tăng THẬT khi
tốc độ tăng trung bình kể từ lần tăng thật cuối >=
`PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX = 0,1×` realtime
(`isResumeCrawlAdvance98Z3(advanceS, elapsedMs)` trong
`playheadHold90R2.ts`, thuần). Tăng chậm hơn là tăng BÒ:
(a) `nextResumeFreezeRearm` — bò KHÔNG reset đồng hồ đóng băng 300 ms
→ detector arm sau 300 ms bò như đóng băng hẳn (vá đúng điểm mù d3);
(b) khối dọn watch trong `preview.tsx` — bò KHÔNG kết thúc watch
(nếu không watch arm rồi hết ngay tick sau, playhead chạy tự do xen kẽ
và drift re-seek vẫn bắn — đúng cơ chế d3); (c)
`shouldHoldForResumeStall` — bò KHÔNG nhả giữ (giữ tiếp tới khi
decoder burst ở tốc độ lành hoặc chạm trần 5000 ms). Đo trực tiếp qua
hook mới `__vcutResumeFreezeCrawl98Z3` (`crawlArms`/`crawlTicks`,
đếm ở vòng detector trong `preview.tsx`).

**Vì sao ngưỡng 0,1× (không phải 0,2× như ví dụ trong brief):** 0,1×
là dạng vận tốc của định nghĩa stall sẵn có (1 frame / 300 ms ≈
0,111× — probe92t3/93u3 định nghĩa stall là >= 300 ms không tăng
>= 1 frame); nằm giữa tốc độ bò đã đo (0,055×, d3 đợt 97) và tốc độ
tích lũy chậm nhất còn lành trong test pin (0,167× — V2-R9: nửa frame
mỗi tick 100 ms) với biên ~1,7–1,8× cả hai phía; dưới mọi slow-mo
thực tế (0,25× là chậm nhất thường dùng). Ngưỡng 0,2× sẽ nuốt V2-R9
(0,167×) — test pin "tăng chậm tích lũy là lành" phải sửa theo, trong
khi 0,167× vượt định nghĩa stall dạng vận tốc (1 frame/200 ms < 300 ms)
nên detector KHÔNG arm cho nó là đúng theo định nghĩa sẵn có. Xem §5
mục 2: bò nhanh (0,1–0,2×, gap 167–333 ms) vẫn là nợ mở.

**Vì sao không rút ngắn ngưỡng detector 300 ms:** đã bác ở Y4 §2 —
rút ngưỡng sẽ arm oan cho mọi lần tăng chậm tích lũy; luật vận tốc
chỉ arm khi tốc độ duy trì < 0,1×, còn tăng chậm tích lũy ở 0,167×
vẫn reset mốc như cũ (pin Z3-R4).

### 1.3 Đo hậu-fix — detector arm vì bò: 0 lần / 3 lượt; giữ-vận-tốc: CÓ; BỊ CHẶN: 3

| Lượt | rAF gap mean | Re-arm (tổng) | Arm-vì-bò | Tick bò | Drift re-seek | Kẹt seek ≥3 s |
|---|---|---|---|---|---|---|
| e1r load2 GOP250 | 278 ms (nhẹ) | 2 (NOT-DUE ×2) | 0 | 2 | 1 | 0 |
| e2r load3 GOP30 | 229 ms (nhẹ) | 1 (NOT-DUE) | 0 | 1 | 0 | 0 |
| e3 load4 GOP250 | 513 ms (NẶNG) | 0 | 0 | 5 | 1 | 0 (2,99 s, sát nút) |
| **Gộp 3 lượt** | | **3** | **0** | **8** | **2** | **0** |

- **Arm-vì-bò = 0/3 lượt, tick bò = 8.** Vì sao detector không arm
  dù thấy 8 tick bò — chứng minh bằng trace, không phải do thiếu lượt:
  mọi stall trong 3 lượt đều đã có watch S2 (sau seek) còn sống che
  phủ — detector bị `hasWatch` chặn arm theo thiết kế (e3 §3.3: cả 2
  stall dài đều có watchCeil non-null suốt; e1r/e2r tương tự, watch
  sống + đuôi sống 5/2 tick). Arm-vì-bò chỉ bắn khi bò xảy ra mà
  KHÔNG có watch nào sống — cấu hình đó không xuất hiện trong 3 lượt
  này (cần bò sau khi watch đã hết, như d3 đợt 97 — ở đó detector cũ
  cũng mù, detector mới chưa có cơ hội chứng minh ngoài đời). Phần
  detector của fix (a) mới chỉ chứng minh bằng unit replay Z3-R3
  (dãy tick bò d3: arm ngay tick bò đầu).
- **Giữ-vận-tốc (phần c) ĐÃ CHỨNG MINH NGOÀI ĐỜI ở e3:** 4 lần tăng bò
  không nhả giữ — stall 1: ct 0,5→0,5333 (rel 9531, 0,0077×) và
  0,5333→0,5667 (rel 10499) mà playhead vẫn giữ 0,5; stall 2:
  ct 1,9333→2,006 (rel 19492, 0,014×) và →2,1667 (rel 19900,
  0,055×) mà playhead vẫn giữ 1,8667 (xem §3.3). Theo luật cũ, giữ
  đã nhả ngay lần tăng bò đầu tiên mỗi stall. Đây là bằng chứng live
  đầu tiên luật vận tốc làm đúng việc nó được tạo ra để làm.
- **Chuỗi grace ≥2 tick BỊ CHẶN = 3, LỌT = 0 — lần đầu tiên khác 0
  trong lịch sử hướng re-arm** (Y4: 0/3 lượt; X4: 0): e1r 2 chuỗi
  (rel 3206→3836 len 3 maxDrift 0,567; rel 6637→7005 len 2 maxDrift
  1,126) + e2r 1 chuỗi (rel 2611→3714 len 3 maxDrift 1,033) — cả 3
  đều tail-covered, drift vượt ngưỡng đủ 2–3 tick liên tiếp mà KHÔNG
  có resync nào bắn. Nói thẳng về quy công: đây là máy grace X4
  (watch sống) + Y4 (đuôi) làm việc, KHÔNG phải fix Z3 — Z3 không
  nhận công này; Z3 chỉ ghi nhận vì nó chạy trên cùng build và vì
  chỉ tiêu "BỊ CHẶN" là chỉ tiêu đúng cho cả hướng (Y4 §1.3 mục 3).
- **CANCELLED vẫn = 0 (0/3 lượt hậu-fix; tiền-sửa 0/7; gộp 0/13).**
  Cả 3 lần re-arm hậu-fix đều NOT-DUE (drift chưa đủ xác nhận lúc
  arm: e1r −1,126 ở tick arm nhưng tick trước chỉ −0,167; e1r
  0,133; e2r 0,000). Phân loại CANCELLED hẹp đòi drift đủ xác nhận ở
  đúng tick arm — với fix Z3, arm-vì-bò xảy ra khi drift CHƯA vượt
  (bò vừa bắt đầu) nên CANCELLED càng khó đếm được; chỉ tiêu đúng
  cho fix này vẫn là §5 "arm-vì-bò + không re-seek trong 3 tick sau
  arm" (đang 0 vì chưa có arm-vì-bò nào).
- **Drift re-seek hậu-fix: 2 (tick formula) / 2 (mẫu 100 ms)** — e1r 1
  (rel 8106, ngoài phạm vi grace: không watch, không đuôi lúc bắn),
  e3 1 (rel ~11320, sau khi watch chạm trần — xem §3.3). Không có
  re-seek nào bắn trong 3 tick sau arm-vì-bò (vì không có arm-vì-bò
  nào) và không có re-seek nào bắn trong lúc bò đang được giữ.
- **Trần 5000 ms: NHẢ TRẦN ĐÃ QUAN SÁT ĐƯỢC LẦN ĐẦU (xác minh bằng
  tay, xem §3.3):** watch S2 ở e3 (completedAtMs rel 5227) hết trần
  ở 10227 và được dọn giữa rel 10499–10920 (watchCeil 6220 → null,
  playhead nhảy +0,933) — nhưng analyzer §3 KHÔNG đếm được vì nó
  lấy mốc trần = đầu stall theo tick (5800+5000=10800 > cuối stall
  10499) thay vì completedAtMs của watch. Đây là hạn chế của
  analyzer, không phải của fix — ghi vào §5 mục 4 để luồng sau sửa
  mốc trần theo watchCeil. Theo đếm tự động của analyzer thì vẫn
  "0 ứng viên / 13 lượt" — con số đó SAI cho ca này, đọc kèm caveat
  này.

### 1.4 Kiểm chứng (cây đã gộp Z3+Z2+Z6, `preview.tsx` mtime 14:57:21Z, md5 `41b05c8e`)

- tsc web **0 lỗi** (chạy lại 15:12Z trên cây cuối, sau lần sửa
  `preview.tsx` cuối của luồng khác — xem §6); vite build **PASS**
  (6,38 s, lần chạy 15:12Z; lần 1 29,80 s lúc 14:54Z trên cây chỉ có Z3).
- `playheadPacing54K9.test.ts` **19/19**;
  `playheadHold90R2.test.ts` **56/56** (50 cũ + 6 mới Z3-R1..R6, gồm
  replay đúng dãy tick bò d3: arm ngay tick bò đầu sau 608 ms,
  mốc hoàn tất = đầu bò, burst sau đó reset mốc);
  `seek.test.ts` **21/21**; `seekSkipRender86N3.test.ts` **9/9**;
  `previewLoop50F2.test.ts` **20/20**.
- 3 test cũ phải sửa theo semantics mới (xem §2): V2-R2 (1 frame/1000 ms
  nay là bò, đổi thành 1 frame/100 ms lành), V2-R6 (tăng lại 2 frame/
  4100 ms nay là bò — không reset cờ trần; thêm ca lành reset cờ),
  T3-R5 (1 frame lẻ sau 2500 ms nay là bò — vẫn giữ; burst +0,5 s mới nhả).

## 2. Vì sao sửa là luật vận tốc ở 3 chỗ (không phải hướng khác)

1. Điểm mù đã đo chính xác ở d3 đợt 97: detector reset mốc ở MỌI lần
   tăng >= 1 frame, không kể tốc độ — bò 0,055× reset mốc mỗi tick
   nên không bao giờ đủ 300 ms đóng băng liên tục. Chỉ sửa detector
   (a) thì watch arm rồi hết ngay tick bò sau (dọn watch cũ cũng dùng
   luật >= 1 frame) — playhead chạy tự do xen kẽ, drift vẫn vượt
   ngưỡng sau 2 tick. Chỉ sửa detector + dọn watch (a+b) mà không sửa
   giữ (c) thì watch sống nhưng `shouldHoldForResumeStall` nhả ngay
   tick bò đầu — playhead vẫn chạy. Cả 3 chỗ phải cùng luật mới giữ
   được playhead xuyên suốt đợt bò.
2. Luật vận tốc dùng chung 1 predicate thuần (`isResumeCrawlAdvance98Z3`)
   nên 3 chỗ không lệch nhau; diện tích thay đổi: 1 hằng + 1 predicate
   + 3 điểm gọi (detector/hold/cleanup) + 1 hook đếm. Không đổi đường
   playhead, không đổi helper drift, không đổi ngưỡng detector 300 ms,
   không đổi trần 5000 ms.
3. Slew/kẹp dt đã bác bằng đo ở X4 §1.2 (28/110 tick lành vượt 0,35) —
   không làm lại. Luật vận tốc không cắt tick lành nào: tăng ở tốc độ
   >= 0,1× (kể cả tích lũy chậm 0,167×) vẫn reset mốc như cũ.

## 3. Đo hậu-fix — truy vết

### 3.1 e1r (load2 GOP250, gap 278 ms, nhẹ) — 2 chuỗi grace BỊ CHẶN đầu tiên

- Chuỗi 1 (rel 3206→3836, len 3, maxDrift 0,567, tail sống): element
  burst ct 0,5667→1,0661 (+0,5) trong lúc playhead giữ 0,5 (drift
  −0,567) rồi drift về — không resync nào bắn trong chuỗi + 1 tick sau.
- Chuỗi 2 (rel 6637→7005, len 2, maxDrift 1,126, tail sống): đúng tick
  detector re-arm (relMs 6637, NOT-DUE — drift tick trước chỉ −0,167)
  rồi drift −1,126 ở tick arm, về dưới ngưỡng tick sau — không resync.
- 1 drift re-seek ở rel 8106 (resyncsV 1→2, drift 0 tại tick ghi —
  hook chậm 1 nhịp; không watch, không đuôi lúc bắn): ngoài phạm vi
  grace, đúng thiết kế (grace chỉ bao watch/tail), không phải lọt.
- 2 tick bò (rel 2929, 3206 — xem caveat đếm ở §5 mục 5); 0 arm-vì-bò
  (watch S2 sống che phủ: watchCeil non-null ở cả 2 tick bò).

### 3.2 e2r (load3 GOP30, gap 229 ms, nhẹ) — 1 chuỗi grace BỊ CHẶN, 0 re-seek

- Chuỗi grace rel 2611→3714 (len 3, maxDrift 1,033, tail sống): element
  burst ct →1,5235 trong lúc playhead giữ 0,5, drift về dưới ngưỡng
  sau 3 tick — không resync. 0 drift re-seek cả lượt (tick formula và
  mẫu 100 ms đều 0) — lượt sạch nhất trong 3 lượt hậu-fix.
- 1 tick bò (rel 2611); 0 arm-vì-bò (watch S2 sống che phủ).

### 3.3 e3 (load4 GOP250, gap 513 ms, NẶNG) — giữ-vận-tốc live + nhả trần đầu tiên + re-seek sau trần

Stall 1 (rel 5800→10499, ct 0,5 đóng băng 4,7 s; seekDone 5139):

| t | ct | ph | watchCeil | Diễn giải |
|---|---|---|---|---|
| 5228→8693 | 0,5 | 0,5 | 6220 từ rel 6429 | watch S2 sau seek giữ playhead |
| 9531 | 0,5333 | 0,5 | 6220 | **tăng bò lần 1 (0,0077×): giữ KHÔNG nhả** (luật cũ đã nhả) |
| 10499 | 0,5667 | 0,5 | 6220 | **tăng bò lần 2: giữ KHÔNG nhả**; tick bò 0→1 |
| 10920 | 0,5667 | **1,4333** | null | **watch chạm trần 5000 ms** (completedAtMs rel 5227 → trần 10227) **và được dọn** — playhead nhảy +0,933 trong 1 tick (catch-up sau giữ dài; xem §5 mục 3) |
| 11321 | 1,8667 | 1,8667 | null | element seek về = ph (drift re-seek hoàn tất — seek này bắn ở tick app ngay sau 10920, khi drift 0,867 đủ 2 tick xác nhận) |
| 11521 | 1,8667 | 1,8667 | null | resyncsV 1→2 (hook chậm 1 nhịp); seeking 11320→14309 (~3 s, sát nút kẹt ≥3 s) |

- Trần: watch hết VÌ trần (loại trừ: không phải tăng — dct=0 ở rel
  10920 và luật bò giữ watch qua 2 lần tăng trước; không phải seeking
  — seeking chỉ bắt đầu 11320). Đây là lần đầu tiên nhả trần 5000 ms
  được quan sát trực tiếp (watchCeil → null + nhảy playhead), dù
  analyzer §3 không đếm được (mốc trần của nó lấy theo đầu stall).
- Stall 2 (rel 15012→19492, ct 1,933 đóng băng 4,48 s; watch S2 mới
  sau re-seek, completedAtMs rel 14420): tăng bò lần 3 (rel 19492,
  ct→2,006, 0,014×) và lần 4 (rel 19900, ct→2,1667, 0,055×) đều
  KHÔNG nhả giữ (ph vẫn 1,8667); watch hết vì trần (~19420) rồi
  element burst, drift âm (element chạy trước playhead) tự về bằng
  playhead đuổi kịp — KHÔNG re-seek nào bắn sau đó. Giữ-vận-tốc đúng
  cả 4/4 lần tăng bò trong lượt này.
- Nhảy hại carve-out cũng bắt được live ở e3: rel 10920 Δph=+0,933
  Δct=0,000 drift=0,867 [CARVE-OUT đầu-seeking] — nhảy này LÀ hậu quả
  của nhả trần (playhead nhảy sau giữ dài), không phải nguyên nhân
  stall; carve-out phân biệt đúng (nhảy trước khoảng seeking 11320).
  Cơ chế "nhảy sau giữ dài → drift → re-seek" này là đất của slew
  (chưa làm, xem X4 §1.2), không thuộc phạm vi fix bò.

## 4. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadHold90R2.ts` — hằng
  `PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX = 0.1` + predicate thuần
  `isResumeCrawlAdvance98Z3` + luật bò trong `nextResumeFreezeRearm`
  và `shouldHoldForResumeStall` (Đợt 98 Z3).
- `apps/web/src/lib/playheadHold90R2.test.ts` — 6 test mới Z3-R1..R6
  (56/56); sửa V2-R2/V2-R6/T3-R5 theo semantics mới (xem §1.4).
- `apps/web/src/preview.tsx` — marker Đợt 98 Z3: import predicate,
  2 bộ đếm bò, đếm tick-bò/arm-vì-bò ở vòng detector, điều kiện dọn
  watch theo tốc độ, hook type + gán + dọn
  `__vcutResumeFreezeCrawl98Z3`. **Chồng lấn:** file này cũng chứa
  thay đổi của Z2 (ghost strip pixels) + Z6 (zombie pump) trong đợt 98
  — batch Z3 stage cả file (parent gộp/khử trùng với các batch đợt 98
  khác lúc push, như mẫu push #4).
- `apps/web/scripts/analyze98z3-grace-ceiling.mjs` — analyzer mới
  (carve-out đầu-seeking + §5 crawl).
- `apps/web/scripts/probe98z3.mjs` — probe hậu-fix (sao probe97y4,
  scratch round98-z3, sampler ghi thêm `crawlArms`/`crawlTicks`).
- `docs/PHASE9_ROUND98_Z3_REARM_CRAWL_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round98-z3-rearm-crawl`
(`~/workspace/repo-1-push/paths-loop/phase9-round98-z3-rearm-crawl.txt`).
Log Z3: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z3/`
(`round98-z3.md`, `analyze-old7-plus-d3-z3.txt`, `analyze-post3-z3.txt`,
`probe-e1.log`, `probe-e2.log`, `probe-e3.log`,
`probe-webkit-load2-gop250-e1/`, `probe-webkit-load3-gop30-e2/`,
`probe-webkit-load4-gop250-e3/` — mỗi thư mục có `probe-results.json`).

## 5. Giới hạn còn lại (trung thực)

1. **CANCELLED ngoài đời VẪN = 0 — nợ re-arm CHƯA ĐÓNG, chỉ giảm thêm
   một nấc:** giữ-vận-tốc đã chứng minh live (4/4 lần tăng bò không
   nhả giữ ở e3); chuỗi grace ≥2 tick BỊ CHẶN lần đầu khác 0 (3 chuỗi,
   0 lọt — công của máy grace X4+Y4); nhưng **arm-vì-bò vẫn 0/3 lượt**
   (watch S2 che phủ mọi stall) nên phần detector của fix (a) mới chỉ
   chứng minh bằng unit replay Z3-R3. Cần thêm lượt đo ở tải vừa/nặng
   khi VM bận hơn, đặc biệt cấu hình "bò sau khi watch đã hết" như d3
   đợt 97, hoặc chấp nhận detector chỉ là lưới an toàn cho cấu hình
   hiếm đó.
2. **Bò nhanh (0,1–0,2×, gap 167–333 ms) VẪN MÙ theo thiết kế:** ngưỡng
   0,1× là dạng vận tốc của định nghĩa stall 300 ms (1 frame/300 ms
   ≈ 0,111×) — bò 1 frame mỗi tick 200 ms (0,167×) vượt định nghĩa
   stall nên detector không arm, drift re-seek vẫn là phản ứng được
   thiết kế cho decoder giao chậm-nhưng-đều. Nếu đo thấy bò nhanh gây
   kẹt seek ngoài đời thì phải nâng ngưỡng lên ~0,2× và sửa lại V2-R9
   (đánh đổi: tích lũy chậm 0,167× sẽ arm sau 300 ms).
3. **Nhảy playhead sau giữ dài (+0,933 ở e3) vẫn gây re-seek:** watch
   chạm trần 5000 ms rồi playhead nhảy 1 tick ~0,93 s → drift 0,867
   → re-seek → seek ~3 s. Đây là đất của slew/kẹp dt sau stall (X4
   §1.2 — kẹp cứng đã bác, slew chưa làm), không thuộc phạm vi fix bò.
   Fix bò chỉ giữ playhead ĐANG bò; khi trần nhả thì nhảy bù vẫn xảy ra.
4. **Analyzer §3 đếm trần SAI cho ca e3:** mốc trần của nó lấy theo
   đầu stall theo tick (5800+5000=10800) thay vì completedAtMs của
   watch (5227+5000=10227) nên báo "stall kết thúc trước mốc trần"
   trong khi watch đã nhả trần thật (xác minh bằng tay §3.3). Luồng
   sau nên sửa §3 dùng watchCeil làm mốc trần; con số "0 lần nhả trần"
   của analyzer trên 13 lượt phải đọc kèm caveat này (số nhả trần
   xác minh bằng tay: 1 — watch S2 ở e3).
5. **Caveat đếm `crawlTicks`:** bộ đếm ở vòng detector dùng
   `prevTrack` stale (lastCt/lastAdvanceMs chỉ cập nhật khi tăng
   lành) nên nó đếm "tick mà advance TÍCH LŨY kể từ lần tăng lành
   cuối ở tốc độ bò" — bao gồm cả tick burst đáp xuống trong lúc
   track còn stale (e1r rel 3206, e2r rel 2611: dct +0,5/+0,96 trong
   tick sampler nhưng bộ đếm tăng ở tick app kề trước, khi ct còn bò).
   `crawlTicks` là chỉ báo vùng bò, không phải đếm chính xác từng lần
   tăng bò; `crawlArms` mới là chỉ tiêu chặt (arm chỉ bắn khi đủ
   300 ms bò liên tục và không có watch).
6. **Số đo chỉ cho 1 clip video, 720p, 6 s, WebKitGTK 27.2** — GOP
   30/250; Chromium không stall ở cùng tải nên không đo được stall 2+
   trên Chromium. Tick probe ≠ tick app (±1 tick), hook resyncsV chậm
   1 nhịp (kế thừa W5 §6.3). Phân loại CANCELLED hẹp có thể không bao
   giờ đếm được đuôi/watch chặn thành công (xem Y4 §1.3 mục 3) — chỉ
   tiêu đúng cho fix này là §5 "arm-vì-bò + không re-seek trong 3 tick
   sau arm" (đang 0 vì chưa có arm-vì-bò nào) và giữ-vận-tốc live (§3.3).
7. **Re-seek thứ 2 ở d3 đợt 97 (t=14101, drift 0, sau điều kiện dừng)
   vẫn chưa giải thích được** (xem Y4 §5 mục 5) — không thuộc phạm vi
   luồng này, dữ liệu e1r–e3 không tái hiện ca đó.

## 6. Chuyện bên lề khi đo (đã xử lý)

1. **Va chạm Z2/Z6 cùng sửa `preview.tsx`:** file đổi mtime trong lúc
   Z3 làm việc (Z3 sửa xong ~14:49Z; Z2/Z6 sửa tiếp, mtime cuối
   14:57:21Z, md5 `41b05c8e`). Z3 chỉ sửa bằng exact-text match trong
   vùng drift/re-seek/watchdog nên không ghi đè thay đổi của họ;
   marker Z3 còn nguyên sau lần sửa cuối (kiểm 15:12Z: marker
   "Đợt 98 Z3" ×7 dòng trong `preview.tsx`, Y4 ×8 còn nguyên, Z2/Z6
   ở vùng blend/pump riêng). tsc/build/5 suite chạy lại xanh trên cây
   cuối (15:12Z), không chỉ trên cây lúc Z3 sửa xong. Các lượt probe
   đều kiểm mtime đầu/cuối và KHÔNG lượt nào bị đổi giữa chừng
   (e3/e1r/e2r đều "đổi giữa lượt: không").
2. **Tải VM thay đổi mạnh trong lượt:** loadavg 19,7 lúc e1 thử lần đầu
   (làm lỗi setup pause-seek) → 18,7 lúc e2 thử lần đầu (mẫu không
   load sau 240 s) → 0,86 lúc e3 bắt đầu (VM yên dần khi các luồng
   đợt 98 khác xong việc). Gap mean các lượt hậu-fix hợp lệ: 278/229/
   513 ms (chỉ e3 vào dải nặng; không lượt nào vào đúng dải tải vừa
   300–500 ms — e1r 278 ms sát nút dưới). So sánh trước/sau chỉ so
   được theo bậc độ lớn; nghịch lý đo vẫn còn (Y4 §5 mục 2): đo lúc VM
   bận thì setup hay lỗi, đo lúc VM yên thì stall hiếm.
3. **e1/e2 lần đầu lỗi setup (đã xử lý, LOẠI theo thiết kế probe):**
   e1 pause-seek tới t=5 không xác nhận canvas sau 30 s
   (tElement=4306 ms, tCanvas=null — cùng lỗi b4/b4b đợt 96, Y4 d1);
   e2 mẫu không tự load sau 240 s (page evaluate trả null). Cả hai
   đều do tải VM cực cao lúc đó (loadavg 18–20, nhiều luồng đợt 98
   chạy probe song song), không phải lỗi fix Z3 (fix không đụng đường
   load mẫu/pause-seek); chạy lại khi tải hạ thì PASS cả hai.
   Không dùng 2 lượt lỗi làm bằng chứng.

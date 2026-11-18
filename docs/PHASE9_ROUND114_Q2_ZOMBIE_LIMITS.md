# Phase 9 — Đợt 114, luồng Q2: Zombie chẩn đoán cơ chế freeze ở chuyển clip

> **Kết quả gọn:** Freeze ở chuyển clip KHÔNG phải do một nguyên nhân duy nhất.
> Nó là **hợp của hai cơ chế** — (1) **cổng bỏ vẽ E4+N3 bắn ở MỌI biên clip**
> (1 tick E4 drift-confirm + 1–3 tick N3 seeking, đo được per-tick ở cả 24 biên
> trong cả 2 lượt) và (2) **main thread bị chiếm bởi các longtask đơn lẻ
> 200–800 ms** (mỗi worker r-gap >300 ms đều bằng đúng một longtask; khoảng
> một nửa các longtask lớn khớp đúng thời điểm pump capture của rVFC, nửa còn
> lại chưa rõ nguyên nhân). **Seek chỉ ~100–300 ms** (thành phần nhỏ),
> **decoder vẫn chạy**, **ring không tràn**, **pump kill không phải nguyên
> nhân**. Một draws-gap >300 ms xuất hiện khi và chỉ khi các tick bị bỏ vẽ
> trùng với lúc pump im/không có và/hoặc một longtask chiếm main thread.

## 0. Bối cảnh và nhiệm vụ

- Đợt 113 P3 đã xác nhận giả thuyết freeze ở chuyển clip (gộp N3+P3 n=5, 5/5
  gap straddle biên clip 6/9/12/15/18, p=4,2e-05; dạng mạnh gộp 6/16 lượt;
  stall 5 s: 0/9 lượt gộp). Nhiệm vụ đợt 114 Q2: **TÌM CƠ CHẾ, không tích
  mẫu nữa** (ROUND113_LIMITS §10.3) — tại sao freeze ở biên: pump
  kill/restart? seek? decode? ring?
- **Không đổi code production trong luồng này** (chỉ đo + chẩn đoán).
  Build cố định: `apps/web/src/preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b`
  (442.673 byte), trước/sau mọi lượt đều khớp.
- Prereg viết TRƯỚC khi đo: `hidden_files/round114-q2/prereg-q2.md`
  (gồm phân tích lại dữ liệu cũ P3/N3 §0 + 6 giả thuyết + tiêu chí chấp nhận/
  bác bỏ §3 + quy tắc dừng tối đa 2 lượt). Addendum A trong prereg ghi
  reboot #46 (xem §1.3).

## 1. Phương pháp đo

### 1.1 Probe mới — `apps/web/scripts/probe114q2-frame-parity.mjs`

Copy `probe113p3-frame-parity.mjs`, chỉ đổi tên/đường dẫn (round113-p3 →
round114-q2, `__vcut113p3Drv` → `__vcut114q2Drv`) + 3 bổ sung đo (§2 prereg):

1. **Export log per-tick render** `window.__vcutRenderFrameTicks92T3`
   (đã có sẵn trong trang, probe cũ không export; ring 600 trong trang nên
   drain 5 s cùng nhịp workerTicks ra `render-ticks.jsonl`, gộp
   drained+tail ở Node, đổi t sang relPlayMs theo playT0raw). Đây là phép đo
   phân biệt chính: mỗi tick có cờ `skipped`/`held` + `preMs`/`renderMs`,
   cho phép quy kết từng tick bỏ vẽ thay vì kẹp bằng sampler thưa.
2. **Longtask observer in-page** (`PerformanceObserver('longtask')`, lưu
   `{start, dur}`; từ lượt R2 thêm `attribution` — xem §1.4).
3. **Seek-transition log in-page** (poll `__vcutMediaEls` trong snap100,
   ghi khi `seeking` lật, kèm ph + ct).

Driver `hidden_files/round114-q2/run-q2.sh` (copy run-p3.sh, đã sửa lỗi
copy của P3: `release q2` thay vì `release n3`; acquire timeout 900 s,
poll 5 s). Classifier `hidden_files/round114-q2/classify-q2.py`: phân loại
mỗi draws-gap >300 ms thành M1/M2/MIX/UNK theo prereg §3 (dùng log
per-tick + worker r-gap cover + longtask cover + seek-transition + pump +
seekKill + straddle).

### 1.2 Spec đo

Cả 2 lượt: `--engine chromium --config scroll-mixed-alt --tag
chr-mixedalt-q2r{1,2}-fr4 --nclips 24 --freeze-run --sysload 0`, 4 python
hog, vite watch.ignored (headroom inotify ~1307, trần 63747). Dải tải
prereg §3: load5 median ∈ [3,8] và ≥80% snapshot trong dải.

### 1.3 Sự cố trong đợt — reboot #46 và chờ Q5

- **Chờ cờ yên Q5:** Q5 giữ vite lock từ 15:12:02Z (lượt yên WebKit).
  Q2 chờ cờ tối đa 60 phút theo task; driver R1 lần 1 (pid 33372, chạy
  15:39:00Z) chờ lock 900 s rồi BLOCKED.
- **Reboot #46 = 2026-11-14 15:44:49Z** (`uptime -s` trực tiếp; boot_id mới
  `7a0638c4-950a-45a0-a068-c290310fc0de`, khác #45
  `cd4cac0b-17a6-408d-8c4e-be163f96dc61`). Số thứ tự #46 vẫn tạm thời
  (mù #32 mở). Reboot giết driver R1 lần 1 trong lúc chờ lock; driver chưa
  bao giờ lấy được lock, chưa chạy probe, **KHÔNG mất dữ liệu đo** — lần 1
  KHÔNG tính là lượt đo (không tính vào tối đa 2 lượt §3 prereg). Dòng
  BLOCKED 15:45:09Z trong driver log mang timestamp lệch RTC (~20–60 s,
  cùng hiện tượng như reboot #43) so với mốc reboot 15:44:49Z — thứ tự
  giây-chính-xác không chắc, nhưng boot_id đổi là bằng chứng dứt khoát.
- Q5: lần 2 (q1) xong 15:45:10Z (nhả lock), chạy lại lần 3 (RUN3) sau
  reboot, probe_exit=0 lúc 15:49:12Z, nhả lock 15:49:13Z. Đo yên của Q5 đã
  xong khi Q2 chạy R1 (cờ file `round114-q5-done` chỉ xuất hiện sau, lúc
  15:58Z — Q5 đang ở pha phân tích/viết LIMITS, không còn đo bằng browser).
  RAM khả dụng tăng từ ~640 MB lên ~1669 MB sau reboot.
- R2: driver chờ lock Q3-round114 (giữ từ 16:00:46Z) rồi lấy được lúc
  16:16:19Z. **Caveat tải:** R2 chạy trong lúc Q3 còn chạy tsc + vite build
  đồng thời (thấy trong pgrep lúc VITE-CLEAN 16:21:42Z); load15 lúc bắt đầu
  phát là 10,87–12,77. R2 vẫn TRONG DẢI theo quy tắc prereg (load5 median
  7,23; 16/16 snap trong [3,8]), nhưng biên độ gap của R2 bị tải đồng thời
  thổi phồng — xem §2.2 và §5.

### 1.4 Thay đổi probe giữa R1 và R2 (chỉ instrumentation, không production)

Sau R1, longtask observer được vá để ghi thêm `entry.attribution`
(`{n:name, t:containerType, s:containerSrc}` tối đa 3 mục) — nhằm phân
biệt nửa số longtask lớn không khớp pump invoke (xem §3.5). `node --check`
OK. Các phép đo cốt lõi (renderTicks, worker ticks, CDP, seek-transition)
không đổi. Kết quả: attribution trả về đồng nhất
`[{n:'unknown', t:'window', s:''}]` cho cả 409/409 longtask (xem §3.5) —
API không phân biệt được, giả thuyết "attribution sẽ chỉ ra nguồn" bị bác
bỏ bởi chính dữ liệu.

## 2. Kết quả hai lượt đo

### 2.1 Lượt R1 — `chr-mixedalt-q2r1-fr4` (boot #46, load5 median 5,34)

- **TRONG DẢI:** load5 median 5,34; 15/15 snap trong [3,8] (100%).
- draws-gaps >300 ms: **5** (P3 R1: 11). draws/s median **58,8** (P3: 20,1)
  — máy sau reboot nhanh hơn hẳn (RAM 1669 MB). Gate (b) dạng mạnh: 1 gap.
  Không có gap >1000 ms.
- renderTicks: 2275 (spacing median 17 ms, p90 67 ms); skipped **67**,
  held 0; longtasks 370; seekTransitions 54.
- Classifier: M1 0, M2 2, MIX 3, UNK 0. Gap biên [600, 588, 598] ms;
  gap giữa clip [414, 400] ms.

| Gap | Vị trí | rtSkip | wCover | lCover | Lớp | Ghi chú |
|-----|--------|--------|--------|--------|-----|---------|
| 414 ms [3304,3718] | giữa clip c0 | 0 | 0,97 | 0,80 | M2 | r-gap [3103,3699] 596 ms |
| 400 ms [4210,4610] | giữa clip c0 | 0 | 0,75 | 0,93 | M2 | r-gap [4040,4511] 471 ms |
| 600 ms [5532,6133] | biên 3 | 1 (6005) | 0,81 | 0,81 | MIX | kill c0 ở 6221 (SAU khi gap kết thúc) |
| 588 ms [6133,6721] | biên 3 | 2 (6322,6588) | 0,00 | 0,89 | MIX | kill 6221 trong gap |
| 598 ms [9326,9924] | biên 6 | 3 (9505,9688,9805) | 0,00 | 0,69 | MIX | không có kill (noblur→blur) |

- **Gap 3 + 4 thực chất là MỘT freeze [5532,6721] dài 1189 ms**, bị tách
  làm đôi bởi một lần vẽ duy nhất ở 6133 (ct 3,0) — đó là **pump capture
  cuối của c0** trước khi bị kill ở 6221, không phải tick render (không có
  tick không-skip nào trong [5205,6805]).

### 2.2 Lượt R2 — `chr-mixedalt-q2r2-fr4` (boot #46, load5 median 7,23)

- **TRONG DẢI:** load5 median 7,23; 16/16 snap trong [3,8] (100%).
  Nhưng WAIT-BAND bắt đầu ở load5=12,43 (trên dải, do Q3 chạy đồng thời)
  và phải chờ 180 s mới về 7,95.
- draws-gaps >300 ms: **38** (R1: 5). draws/s ≈ 11 (R1: 58,8).
  drawsTotal chỉ 786 (R1: 5092). Gate (b) dạng mạnh: 7 gap.
  Không có gap >1000 ms (lớn nhất 977 ms).
- renderTicks: chỉ **408** (spacing median **200 ms**, p90 316 ms, max
  683 ms; 45 khoảng >300 ms); skipped **59** (14,5% số tick);
  longtasks 409; seekTransitions 36.
- Classifier: M1 0, **M2 24, MIX 14**, UNK 0. **Gap biên 15/15 đều là MIX**
  (e4d=1 ở tất cả); **gap giữa clip 23/23 đều là M2**.
- **38 so với 5 là hiệu ứng tải, không phải khác cơ chế:** R2 chạy dưới
  tải đồng thời nặng (Q3 tsc + vite build + 4 hog + load15 ~11–13), tick
  loop chạy ở ~5/s thay vì ~59/s nên mỗi tick bị bỏ vẽ tốn ~200 ms thay
  vì ~17 ms. Cơ chế (skip + stall) giống hệt R1; chỉ biên độ thay đổi.
  Không được so sánh trực tiếp số lượng gap R1↔R2.

### 2.3 Sampler thưa (nợ đã biết, tái hiện ở cả 2 lượt)

| Sampler | R1 | R2 | Đặt |
|---------|----|----|-----|
| state100 median | 98 ms | 197 ms | 10 ms |
| CDP recv-gap median | 22 ms | 195,5 ms | — |
| CDP rtt median | 12 ms | 180 ms | — |

Vì vậy mọi bracket bằng state100/CDP đều thô (±1 mẫu, ~200–400 ms ở R2).
**Log per-tick renderTicks là nguồn quy kết đáng tin** (không phụ thuộc
CDP/state100); các con số seek dưới đây đều đối chiếu renderTicks +
seekTransitions + CDP, không dựa vào một nguồn duy nhất.

## 3. Cơ chế — bằng chứng số

### 3.1 Cổng bỏ vẽ E4+N3 bắn ở MỌI biên clip (thành phần hệ thống)

- **R1: 67 tick bị bỏ vẽ, gom cụm ở cả 24 biên** (mỗi biên 1–4 tick):
  6005/6322/6588 @3, 9505/9688/9805 @6, 12721 @9, 15804–15921 @12, 19004
  @15, 22104 @18, 25187 @21, 28187–28237 @24, 31304–31421 @27, 34404 @30,
  37620 @33, 40720–40803 @36, 43837–43920 @39, 46970 @42, 50053–50120 @45
  (các biên sau 45 cũng có, tổng 67).
- **R2: 59 tick bị bỏ vẽ, có mặt ở mọi bin 3 s** (bin 1–25 đều có 1–6
  tick; bin 24 có 6 — cụm biên 66).
- **Mọi draws-gap ở biên đều chứa tick bị bỏ vẽ:** R1 3/3 (1–3 tick/gap);
  R2 15/15 (1–6 tick/gap; e4d=1 ở tất cả 15 gap). Gap biên 66 (R2, 977 ms,
  lớn nhất đợt): 6 tick liên tiếp bị bỏ vẽ (73163, 73363, 73613, 73679,
  73696, 73763) rồi tick 73796 vẽ lại.
- Trình tự chuẩn ở một biên (đo được ở biên 3 R1): tick vẽ frame cuối
  (~11085 vẽ ct 2,67 ở dữ liệu cũ; R1: tick 5205) → playhead vượt biên →
  subscriber kill pump đồng bộ → tick E4 bỏ vẽ (drift-confirm) → tick sau
  syncMedia phát seek → tick N3 bỏ vẽ (seeking) → tick vẽ lại sau khi seek
  xong. Chuỗi này lặp lại ở mọi biên, không chỉ các biên có gap >300 ms:
  **đa số biên có skip nhưng không có gap** (pump vẫn capture và vẽ, hoặc
  tick nhanh) — skip là điều kiện cần, không đủ, của draws-gap.

### 3.2 Main-thread stall = một longtask đơn lẻ (thành phần thứ hai)

- **Mọi worker r-gap >300 ms đều bằng đúng một longtask** (thời lượng khớp
  trong ~70 ms): R1 9/9 (vd [5229,6017] 788 ms = longtask [5229,6016]
  787 ms; [3103,3699] 596 ms = longtask [3103,3630] 527 ms + đuôi).
  R2 35 r-gap >300 ms.
- **Worker vẫn tick đúng nhịp trong stall:** R1 w-gap <100 ms với mọi
  r-gap >300 ms; R2 w-gap median 10 ms, p90 70 ms, max 87 ms, **0 lần
  >300 ms** — r-gap là main thread không nhận message, không phải worker
  đói CPU hay hệ thống đói toàn cục.
- **Gap giữa clip là stall thuần:** R1 2/2 M2 (rtSkip 0, wCover 0,75–0,97);
  R2 23/23 M2. Gap biên luôn là MIX (R1 3/3, R2 15/15) — skip + stall
  cùng xuất hiện.
- **Stall lớn nhất đợt:** longtask [5229,6016] dur **787 ms** ở biên 3
  R1 — chiếm phần lớn freeze 1189 ms ở biên này. Tick 5205 ngay trước
  stall có pre 121 ms + render 397 ms (tick chậm bất thường).
- **Longtask chiếm phần lớn thời gian:** R1 tổng 35.024 ms / 78 s ≈ 45%
  thời gian tường; R2 tổng 71.297 ms / ~72 s ≈ 99% (main thread gần như
  liên tục nằm trong longtask 100–500 ms nối đuôi nhau — chế độ bão hoà
  dưới tải nặng). Tick interval giãn theo: R1 median 17 ms nhưng 200–400
  ms trong cửa sổ gap; R2 median 200 ms. **Mỗi tick bị bỏ vẽ tốn một
  khoảng tick** — dưới tải, 2–3 tick bỏ vẽ = 400–1000 ms freeze.

### 3.3 Pump capture LÀ (một phần) các longtask

- **R1:** 17 longtask ≥200 ms; 10/17 bắt đầu trong 13 ms sau một lần
  pump invoke (7 trong 5 ms: 5229/4 ms, 4040/1, 4836/1, 3712/0, 11031/1,
  6132/1, 11988/5). Stall 787 ms ở biên 3 bắt đầu 4 ms sau pump capture
  invoke ở 5233 (mt 2,27).
- **R2 (bằng chứng mạnh hơn vì pump thưa):** pump chỉ invoke 153 lần,
  spacing median 218 ms → P(một thời điểm ngẫu nhiên nằm trong 2 ms của
  một invoke) ≈ 2%. Trong 15 longtask lớn nhất, **7/15 khớp trong 1–2 ms**
  (47473/1, 76673/1, 46800/1, 74402/1, 53991/1, 61195/2, 67208/1) —
  vượt xa mức ngẫu nhiên (~0,3/15). **Pump capture (rVFC callback làm
  drawImage snapshot) là longtask 200–500 ms.**
- **Nhưng chỉ khoảng một nửa:** R1 7/17 và R2 8/15 longtask lớn cách mọi
  pump invoke 500–4300 ms (rơi vào clip không-blur — không có pump — hoặc
  lúc pump chưa kịp chạy sau khi tạo). Nửa này **chưa rõ nguyên nhân**.

### 3.4 Seek chỉ ~100–300 ms — thành phần nhỏ, không phải nút cổ chai

- Biên 3 R1: seek phát trong (6411, 6618], xong trong (6713, 6721]
  (CDP seeking True 6618/6713, False 6837; draws vẽ lại 6721) → **~100–
  200 ms**. Biên 6 R1: True 9825 → False 9919 → **~94 ms** (giới hạn trên
  206 ms: phát ≥9713, xong ≤9919).
- R2: 18 cặp True→False đo được bằng sampler: 9–505 ms, median ~195 ms.
  Các giá trị 372–505 ms bị sampler lag thổi phồng (state100 median
  197 ms ở R2 — flip False được quan sát muộn; draws vẽ lại TRƯỚC khi
  sampler thấy False, vd biên 69: gap kết thúc 77483 nhưng False mới thấy
  ở 77704). Giới hạn trên đúng bằng (draws-vẽ-lại − True-quan-sát):
  biên 69 ≤283 ms.
- So sánh: gap 598–1189 ms (R1) / 977 ms (R2, biên 66) >> seek ~100–
  300 ms. **Seek không giải thích được độ dài gap.** Decoder cũng không:
  dec tăng đơn điệu qua mọi gap kiểm tra (R1 biên 3: 72→90→100→107→112,
  biên 6: 167→176→180→194→200; R2 biên 66: 1954→1971→1982→1985→1990→1996
  →1999, biên 69: 2059→…→2088, biên 9: 250→…→282).

### 3.5 Nửa longtask lớn còn lại: chưa rõ — attribution không phân biệt được

- R2 ghi `entry.attribution` cho mọi longtask: **409/409 trả về
  `[{n:'unknown', t:'window', s:''}]`** — Chromium không ghi nguồn cụ thể
  cho các task này trong môi trường này. Attribution **không phân biệt**
  được pump capture / GC / tick work / layout.
- Nghi phạm hàng đầu cho nửa chưa rõ là **major GC dưới áp lực bộ nhớ**
  (mỗi capture/tick cấp phát canvas/frame; RAM khả dụng ~1,6 GB; các
  longtask này rơi vào clip không-blur và lúc warmup, nơi không có pump
  invoke nào gần đó) — nhưng **chưa chứng minh được**. Cần Chrome tracing
  hoặc Long Animation Frame API nếu muốn chốt (xem §6).
- Cũng chưa chốt được thành phần con bên trong một capture chậm: capMs
  đo trong pump log ở P3 chỉ ~60–85 ms, trong khi longtask chứa capture
  dài 200–800 ms — phần dư có thể là GC bị capture kích hoạt, hoặc
  drawImage chậm hơn nhiều dưới tải. Không suy đoán thêm.

### 3.6 Điều kiện đủ của draws-gap (tổng hợp R1+R2 + dữ liệu cũ)

Một draws-gap >300 ms xuất hiện khi **cả hai** điều kiện cùng đúng:

1. **Có tick bị bỏ vẽ ở biên** (E4+N3 — luôn xảy ra ở mọi biên), VÀ
2. **Không có gì khác vẽ trong lúc đó** — tức là pump im/không có (clip
   không-blur; pump vừa bị kill; pump đang ở giữa hai lần capture) VÀ/hoặc
   một longtask chiếm main thread đúng lúc đó.

Kiểm chứng: ở đa số biên, skip vẫn bắn nhưng pump tiếp tục capture
(vd biên 21/27/… ở P3 R1: e4skip+n3skip vẫn tăng mà không có gap >300 ms
vì pump c12 vẫn capture tới lúc kill). Ngược lại, stall giữa clip (không
có skip) vẫn tạo gap (R1 2/2, R2 23/23 M2) vì lúc đó không có tick nào
chạy để vẽ.

## 4. Phán quyết từng giả thuyết (theo tiêu chí prereg §3)

| Giả thuyết | Phán quyết | Bằng chứng |
|---|---|---|
| **H-M1** skip-gate là cơ chế DUY NHẤT | **BÁC** (với tư cách duy nhất) | Tiêu chí bác bỏ prereg kích hoạt: worker r-gap phủ >50% gap biên (R1 gap 3: wCover 0,81; R2: mọi gap biên đều có wCover/lCover cao). Không có gap biên nào là M1 thuần (R1 0/3, R2 0/15). |
| **H-M1** skip-gate là thành phần CẦN | **CHẤP NHẬN** | Skipped tick trong 18/18 gap biên (R1 3/3, R2 15/15); e4d=1 ở cả 15 gap biên R2; 67 (R1) + 59 (R2) tick bỏ vẽ gom cụm ở mọi biên. |
| **H-M2** main-thread stall | **CHẤP NHẬN** | Gap giữa clip 25/25 là M2 (R1 2/2, R2 23/23, rtSkip 0); mọi r-gap >300 ms = một longtask; w-gap <100 ms chứng tỏ worker vẫn tick. |
| **H-pump** kill/restart gây freeze | **BÁC** | Freeze biên 3 R1 bắt đầu 5532, stall 5229 — TRƯỚC kill 6221. Biên 6 R1 không có kill mà vẫn freeze. R2: đa số gap biên không có kill gần đó. |
| **H-pump** capture = longtask | **CHẤP NHẬN MỘT PHẦN** | ~1/2 longtask lớn khớp pump invoke (R1 10/17 trong 13 ms; R2 7/15 trong 1–2 ms, vượt xa ngẫu nhiên ~2%). Nửa còn lại chưa rõ (§3.5). |
| **H-seek** seek là nút cổ chai | **BÁC** (với tư cách chủ đạo) | Seek ~100–300 ms << gap 598–1189 ms; draws vẽ lại ngay khi seek xong, không chờ thêm. |
| **H-decode** decoder chùm/dừng | **BÁC** | dec tăng đơn điệu qua mọi gap kiểm tra (R1 + R2, §3.4). |
| **H-ring** splice/queue2 | **BÁC** | drawsTotal=drawsKept (R1 5092, R2 786) < 8000; không sự kiện splice nào quanh gap. |
| **H-CDP** sampler của probe gây stall | **BÁC** (với stall lớn) | R1 (đã sửa đúng gốc thời gian): chỉ 195/370 longtask nằm trong 10 ms của một CDP-eval-START, ở mức ngẫu nhiên (eval mỗi ~22–37 ms); longtask ≥200 ms cách eval-start gần nhất 2–254 ms (3/17 trong 10 ms, ở mức ngẫu nhiên). R2: rtt median 180 ms là TRIỆU CHỨNG queueing (eval chờ sau longtask), không phải nguyên nhân — eval tự thân ~12 ms như R1. Lưu ý: phép thử sớm "334/370 trong 15 ms của một CDP sample" là SAI do nhầm gốc thời gian (perfNow là lúc eval KẾT THÚC, không phải bắt đầu) — không được trích dẫn. |

**Kết luận cơ chế (một câu):** Freeze ở chuyển clip = **cổng bỏ vẽ E4+N3
(có ở mọi biên) + main-thread stall (longtask đơn, một nửa là pump
capture, nửa còn lại chưa rõ) + tick interval giãn dưới tải**; seek, decode,
ring và pump kill đều đã loại trừ; độ dài freeze phụ thuộc tải, còn sự xuất
hiện của nó gắn với biên clip.

## 5. Caveats (đọc trước khi dùng số liệu này)

1. **R2 bị tải đồng thời thổi phồng:** R2 chạy lúc Q3 đang tsc + vite
   build (load15 10,87–12,77 lúc bắt đầu phát). Gap 38 so với 5 ở R1 là
   hiệu ứng tải (tick 200 ms so với 17 ms), không phải khác cơ chế. Cả
   hai lượt đều trong dải prereg, nhưng không được so sánh số lượng gap
   trực tiếp.
2. **Sampler thưa:** state100 median 98 ms (R1) / 197 ms (R2) thay vì
   10 ms đặt; CDP recv-gap median 22 ms (R1) / 195,5 ms (R2). Mọi bracket
   bằng state100/CDP đều thô ±1 mẫu. Chỉ log per-tick renderTicks là
   quy kết chính xác từng tick.
3. **Longtask cover bị nhiễu nền:** longtask chiếm 45% (R1) đến ~99%
   (R2) thời gian tường, nên một cửa sổ 600 ms ngẫu nhiên cũng phủ
   longtask 51% (median) đến 88% (p90) ở R1 — lCover cao một mình không
   chứng minh stall; tín hiệu phân biệt là **worker r-gap** (w-gap
   <100 ms) và **rtSkip per-tick**.
4. **Attribution không dùng được:** `entry.attribution` trả về
   'unknown'/'window' cho mọi longtask — nửa số longtask lớn chưa rõ
   nguồn vẫn mở.
5. **Reboot #46** (15:44:49Z) giết driver R1 lần 1 (không mất dữ liệu;
   lần 1 không tính là lượt). Cờ yên Q5 xuất hiện muộn (15:58Z) so với
   lúc Q5 đo xong (15:49:12Z) — R1 chạy sau khi Q5 đo xong, không nhiễu
   lẫn nhau.
6. **Bar "skips>0" của analyzer cũ có tính chọn lọc:** theo định nghĩa,
   bar chọn đúng các gap chứa 1 tick E4 drift-confirm — tick này chỉ bắn
   ở sự kiện drift (chuyển clip) — nên 5/5 straddle ở P3 là hệ quả một
   phần của định nghĩa bar. Kết luận ở đây KHÔNG dựa vào bar đó mà dựa
   vào log per-tick (renderTicks) + r-gap + longtask.

## 6. Bước tiếp theo đề xuất

1. **Hướng sửa (cho luồng build sau, không phải luồng này):** freeze có
   hai chân — (a) cổng bỏ vẽ E4+N3 và (b) pump capture chiếm main thread
   200–800 ms. Các hướng đáng đánh giá: (i) đưa capture của pump ra khỏi
   main thread (OffscreenCanvas trong worker, hoặc snapshot nhỏ hơn);
   (ii) giảm chi phí của tick bị bỏ vẽ (vẽ lại frame cũ thay vì bỏ hẳn —
   cần cân nhắc vì N3 đã chứng minh vẽ lúc seeking làm seek chậm 3–11×);
   (iii) giới hạn thời lượng capture (cap snapshot resolution). Đây là
   quyết định sản phẩm, Q2 không triển khai.
2. **Nếu cần chốt nửa longtask chưa rõ nguồn:** dùng Chrome tracing
   (`--trace` / `chrome://tracing`) hoặc Long Animation Frame API
   (`PerformanceObserver('long-animation-frame')` với scripts attribution)
   — longtask attribution API đã chứng minh là không đủ trong môi trường
   này. Không cần thêm lượt freeze-run kiểu cũ (mẫu đã đủ: 18/18 gap
   biên có skip, 25/25 gap giữa clip là M2).
3. **Nợ mở còn lại từ đợt 114 Q2:** không có nợ đo mới. Nợ cũ liên quan:
   E4 cần đợt xác nhận tải cao (Q1 đợt 114); ngưỡng WebKit ≤60 ms (Q5);
   postboot #45 FAIL apt replay (Q7).

## 7. File và dữ liệu

- LIMITS này: `docs/PHASE9_ROUND114_Q2_ZOMBIE_LIMITS.md`
- Probe: `apps/web/scripts/probe114q2-frame-parity.mjs` (copy probe113p3 +
  export renderTicks + longtask observer + seek-transition log; R2 thêm
  longtask attribution — diff 66 dòng so với probe113p3 + 1 dòng attribution)
- Prereg: `hidden_files/round114-q2/prereg-q2.md` (+ Addendum A: reboot #46)
- Classifier: `hidden_files/round114-q2/classify-q2.py`
- Driver: `hidden_files/round114-q2/run-q2.sh`, holder
  `load-holder-q2.sh`, lock `vcut-vite-lock-frozen.sh` (md5 khớp gốc
  `fd21193c5b4b7ba1769bb16fd5482984`)
- Dữ liệu thô (KHÔNG stage): `hidden_files/round114-q2/chr-mixedalt-q2r1-fr4/`
  (results.json 104,8 MB, render-ticks.jsonl, worker-ticks.jsonl,
  cdp-samples.jsonl, analysis txt) và `chr-mixedalt-q2r2-fr4/` (results.json
  24,8 MB, cùng bộ file); `chr-mixedalt-q2r1-fr4-classify.json`,
  `chr-mixedalt-q2r2-fr4-classify.json`, `r1-analysis.md`,
  `driver-q2.log`, `q2-progress.log`
- Phân tích lại dữ liệu cũ (chỉ đọc, không stage):
  `hidden_files/round114-q2/analyze-old.py`, `window-analyze.py`,
  `window-analyze2.py`
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round114-q2-zombie.txt`
  (NUL-delimited; chỉ LIMITS + probe). Lưu ý đẩy: probe 62.660 byte >
  37.768 byte (giới hạn push-files) — cần `ENABLE_PRIVSEP=0` khi đẩy,
  như P3.

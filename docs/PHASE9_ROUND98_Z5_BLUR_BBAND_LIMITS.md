# PHASE9_ROUND98_Z5_BLUR_BBAND_LIMITS — blur parity: B-band wk n=61, D ~1%, blind wk, state100

> Luồng Z5, đợt 98. Lượt cron 21:35 +07 12/11/2026 (driver 14:40:39–15:08:07Z,
> boot 65bc5fb6 = reboot #20, 13:24:41Z; reboot tiếp theo dự kiến ~15:28Z).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Không sửa production trong luồng này** — chỉ đo + 2 probe harness mới
> (copy probe97y6 / probe97y5, chỉ đổi SCRATCH + cap state100, xem §5).
> Không đụng `.github/workflows`, 0 binary.

## 0. Môi trường + build nào đo cái gì (QUAN TRỌNG — preview.tsx bị sửa 3 lần giữa lượt)

Các luồng song song Z2/Z3/Z6 sửa `preview.tsx` giữa lượt đo của Z5
(không phải lỗi Z5 — vòng lặp đợt 98 chạy song song). Dòng thời gian md5:

| md5 | nội dung | lượt đo trên build đó |
|---|---|---|
| `a0a078e1` | cây gộp đợt 97 (Y10 xác minh) | wk-blur-r8, wk-blur-r9: **SẠCH** toàn lượt |
| `fa16bb50` | + Z2 (pixel-strip chẩn đoán ghost) / Z3 (detector bò) — một phần | wk-blur-r10: đổi giữa lượt (`mtimeChanged=true`) |
| `7238158c` | + Z2 ×10 + Z3 ×7 đầy đủ | wk-blur-r11 (MẤT, xem §0.1), wk-noblur-r3/r4 |
| `41b05c8e` | + Z6 ×5 (zombie-pump đổi chủ element) | chr-blur-r9 (đổi giữa lượt), chr-blur-r10 + wk-blind-r1/r2: **SẠCH** toàn lượt |

- **Xác minh blend math không đổi:** thân hàm `compositeMotionBlurLayer`
  chứa **0 marker "Đợt 98"**; Z2 chỉ thêm đọc strip pixel chẩn đoán
  (`getImageData` 48×1, ~chục µs/tick, không đổi pixels); Z3 ở vùng
  watchdog/detector; Z6 ở vùng pump-ownership/đổi clip. Ring capacity,
  skip logic X2, weights blend nguyên vẹn → **số liệu cụm D/A/B/C của cả
  9 lượt có kết quả đều dùng được**. Chỉ số liệu watchdog/fallback của
  các lượt lai (r10, chr-r9) phải gắn cờ build.
- **Z4 CHƯA ổn định watchdog:** lúc Z5 chạy blind (15:02–15:08Z), Z4 vẫn
  đang chạy thử nghiệm freeze (`wk-freeze-deepstub-r3`), **0 marker Z4**
  trong `preview.tsx` → đối chiếu blind ở §3 là so với watchdog **Y5
  nguyên trạng**, không phải code mới của Z4. Điều kiện "sau khi Z4 ổn
  định" trong brief KHÔNG thỏa — ghi rõ, không ép kết luận.
- Tải: các lượt chạy dưới tải song song nặng (load1 lúc phát 1,17–19,57;
  đỉnh 18,31 lúc chr-blur-r10). tagAgree: wk r8 80%, r9 67%, r10 45%;
  chr r9 49%, r10 65% — nhiễm tải rõ, xem §0.2. 0 pageErr, 0 collision.
- 9/10 lượt có kết quả; xem §0.1 cho lượt mất.

### 0.1 Lượt mất wk-blur-r11 — CDP evaluate treo (tái hiện lỗi Y5 §3.4)

- Chạy 14:46:28Z, phát lúc 14:46:42 (load 1,17). Sau đó probe không ghi
  log thêm; node probe (pid 19985) ngủ, CPU ~0 (utime 114 tick), renderer
  WebKit (pid 20058) 0% CPU — `page.evaluate` treo, renderer không đáp
  ứng. Đúng mẫu lỗi lượt mất wk-freeze-r9 của Y5 (cũng WebKit, cũng
  `evaluate` treo), lần này trên lượt wk-blur thường, **không có
  freeze-injection** → lỗi không riêng injection.
- Xử lý 14:52:35Z (sau ~5,5 phút kẹt): kill node 19985 + vite 20031 (:5590)
  + Xvfb 20043 (:194) + webkit 20058; driver tự tiếp tục sang
  wk-noblur-r3 (exit=137 ghi trong log, reclaim :194 thành công). Không
  file kết quả cho r11 (chỉ có `vite-attempt1.log`).
- Hệ quả: B-band wk mất 1 lượt (dự kiến ~7–9 cap B). Vẫn đạt mục tiêu
  n≥60 nhờ 3 lượt wk còn lại + đối chứng cũ (xem §2). Khuyến nghị cho
  đợt sau: đặt timeout cho `page.evaluate` trong vòng chờ playhead
  (nợ Y5 §5 mục 2, vẫn mở).

### 0.2 Hạn chế harness / lượt đo

- Baseline wk đã mở rộng 77 → **133 key** (+56 từ wk-noblur-r3/r4 Z5;
  xem §5). Tỉ lệ cap wk phải cứu bằng chr-base giảm: B-band Z5 dùng
  wk-base 15 / chr-base 10 (Y6: 8/28). Key chung chr–wk n=116, max|d|
  vẫn 1,395 (≈ gStdRatio ≤0,0172 xấu nhất — không đổi so với Y6).
- wk-blind-r1/r2 phát cực chậm dưới tải (playhead 0,24× / 0,12× realtime;
  phCross c2 ở 20,1 s / 34,8 s cho timeline 6 s) — blind đo bằng phCross
  vẫn đúng (mốc entry chính xác ±16 ms), nhưng mọi con số wall-clock
  phải đọc kèm tải.

## 1. Kết quả chính

### (a) Tần suất cụm D trên Chromium fix-3 — XÁC NHẬN ~1%, cơ chế tinh chỉnh

| lượt | D n / tổng | % | mean | nhãn |
|---|---|---|---|---|
| chr-blur-r6 (X5b) | 2 / 234 | 0,9% | 0,307 | gap 2, ringSize 2, skipped 1 |
| chr-blur-r7 (Y6) | 1 / 108 | 0,9% | 0,307 | **dị thường gap 6** |
| chr-blur-r8 (Y6) | 0 / 115 | 0,0% | — | — |
| chr-blur-r9 (Z5) | 2 / 41 | 4,9% | 0,306 | gap 2, ringSize **1**, skipped 0 |
| chr-blur-r10 (Z5) | 0 / 77 | 0,0% | — | — |
| **gộp r6–r10** | **5 / 575** | **0,9%** | **0,306 (sd 0,001)** | — |

- **Verdict (a): D fix-3 = ~1% (0,9% gộp 575 cap chr) — XÁC NHẬN, không
  về 0.** Tỉ lệ r9 cao (4,9%) là nhiễu mẫu nhỏ (n=41, nhiễm tải nặng);
  gộp 5 lượt vẫn 0,9%.
- **Tinh chỉnh cơ chế (mới):** 2 cap D r9 có ringSize=1 (không phải 2):
  c1 fi=4 (last=2, prev=−1, pres=4) và c2 fi=5 (last=3, prev=−1, pres=5)
  — ring chỉ giữ 1 ghost, cách presented đúng 2 khung → pair gap 2 →
  0,307 đúng số đo. D không chỉ xuất hiện khi "ring thoáng qua size 2"
  (Y6) mà **bất cứ khi nào ring chỉ còn 1 ghost cách presented 2 khung**
  (size 1 hoặc 2 đều được, miễn ghost cách 2). Muốn D về 0 cần giữ ring
  đủ 3 ghost đúng pha ngay cả khi pump thưa — hoặc chấp nhận ~1% là sàn.
- Tâm cụm không đổi: D 0,306 / A 0,439 / B 0,771 / C 0,998 (chr gộp
  r6–r10: A n=374 sd 0,004; B n=165 sd 0,011; C n=31 sd 0,007).
  0 mẫu ngoài-dải trong cả 5 lượt Z5 có kết quả — thang đo ổn định.

### (b) B-band WebKit — ĐẠT n=61, VẪN KHÔNG CÓ KHE BIMODAL, KHÔNG TÁCH SẠCH TỪNG MẪU

| gộp wk (wk-base mở rộng + chr-base cứu) | B n / tổng | mean | med | sd | pair-like [0,70–0,76) | dc-like [0,76–0,82] |
|---|---|---|---|---|---|---|
| r4+r5 (X5) | 20 / 56 | 0,768 | 0,775 | 0,018 | 6 (mean 0,746) | 14 (mean 0,778) |
| r6+r7 (Y6) | 16 / 52 | 0,764 | 0,761 | 0,011 | 8 (mean 0,756) | 8 (mean 0,772) |
| r8+r9 (Z5) | 22 / 106 | 0,765 | 0,771 | 0,017 | 10 (mean 0,748) | 12 (mean 0,779) |
| r10 (+r11 mất) | 3 / 33 | 0,774 | 0,781 | 0,013 | 1 | 2 |
| **r4–r11 GỘP** | **61 / 247** | **0,766** | **0,769** | **0,016** | **25 (mean 0,750)** | **36 (mean 0,777)** |

- **Mục tiêu n≥60 ĐẠT (61 mẫu B wk).** Tỉ lệ pair/dc 41%/59% — khớp
  Y6 (42%/58%). Phân bố không đổi khi thêm 25 mẫu mới.
- **Không có khe bimodal:** histogram bin 0,005 trên dải 0,720–0,788 —
  vùng dày 0,745–0,790 liên tục, mọi bin đều có mẫu (3, 3, 6, 9, 14, 1);
  chỉ có 2 bin trống ở đuôi thưa dưới (0,725–0,730 và 0,740–0,745, tổng
  5 mẫu dưới 0,745) — không phải khe phân tách hai quần thể.
  2-means 1D: cụm 1 n=28 (mean 0,752, sd 0,011, 0,720–0,762) vs cụm 2
  n=33 (mean 0,779, sd 0,005, 0,765–0,788) — **khe giữa hai cụm chỉ
  0,0029** (max cụm 1 = 0,762, min cụm 2 = 0,765), tách 1,70σ. Hai cụm
  chạm nhau ở biên; không thể gán từng mẫu chắc chắn.
- **Thử tách bằng đặc trưng khác (gộp 61 mẫu) — không có đặc trưng nào
  tách sạch, nhưng có 2 tín hiệu một phía mới:**
  - `skipped`: −1 (n=21, mean 0,768) vs 0 (n=40, mean 0,765) — **không tách**
    (khớp Y6).
  - `ringSize`: 1 → **n=4, mean 0,737, dải 0,720–0,749 — TẤT CẢ pair-like**
    (ring 1 ghost ⇒ blend pair {ghost, presented} ⇒ gần dự đoán pair
    0,743); 2 → n=4 mean 0,766; 3 → n=32 mean 0,769 (dải đầy 0,748–0,785);
    −1 → n=21 mean 0,768. ringSize=1 nhận diện được 4/25 mẫu pair-like,
    nhưng ringSize=3 trải khắp cả hai phía → không phải phân hoạch.
  - **Phase sọc (fi mod 6): phase 4 → n=13, mean 0,779, sd 0,008, dải
    0,759–0,788 — TẤT CẢ dc-like.** Các phase khác: 0 → 0,765 (n=11),
    1 → 0,763 (n=13), 2 → 0,757 (n=9), 3 → 0,763 (n=9, dải đầy
    0,724–0,782), 5 → 0,765 (n=6). Phase 4 nhận diện được 13/36 mẫu
    dc-like với độ chặt cao (sd 0,008) — khớp cơ chế Y2 (triple ở pha
    K mod 6 ∈ {3,4} cho std cao ~84), nhưng phase 3 không tách (trải
    đầy), và 23/36 mẫu dc-like ở phase khác 4 → phase là yếu tố dự báo
    một phía, không phải phân hoạch.
  - `tag`: cả 61 mẫu đều là tick (wk không có cap B tag draw).
  - Nguồn baseline: chr-base n=29 (mean 0,766) vs wk-base n=32 (mean
    0,766) — **cứu baseline không làm lệch** (khớp nhau tới 0,001).
  - Gap cửa sổ theo nhãn (`last−pres`, `prev−pres`): trải rộng −1…−32
    (có cả −29/−40, −32/−49), không có mẫu hình — nhãn cửa sổ trên wk
    không phải cửa sổ blend thật (trình chiếu thưa, nhãn stale), nên
    không dùng để tách. Dự đoán harmonic từ gap nhãn sai lệch hẳn với
    số đo ở hầu hết mẫu B (vd gap=2 dự đoán 0,307 nhưng đo 0,77–0,78) —
    bằng chứng độc lập rằng nhãn wk không phản ánh cửa sổ thật.
- **Verdict (b): B-band wk LÀ hỗn hợp pair (~41%) + double-count (~59%)
  ở mức quần thể — XÁC NHẬN với n=61; vẫn không tách sạch từng mẫu.**
  Hai tín hiệu một phía mới (ringSize=1 ⇒ pair-like; phase 4 ⇒ dc-like)
  là manh mối cho đợt sau, không phải đáp án: mỗi tín hiệu chỉ bao phủ
  một tập con, phần còn lại vẫn chồng lấn. Muốn tách sạch cần nhãn cửa
  sổ tin cậy hơn — pixel strip của Z2 (đã có trong build 41b05c8e) là
  ứng viên: đọc content thật của ghost thay vì nhãn.
- Đối chứng chr B (gộp r6–r10): n=165, mean 0,771, sd 0,011; pair-like
  25 vs dc-like 140 (85% dc-like) — chr vẫn trội double-count như X5/Y6.

### (c) Cap D dị thường — chr r7 KHÔNG lặp lại; wk có 4 mẫu mới ỦNG HỘ mislabel ±1 (Z2)

- **Chr:** 2 cap D mới (r9) đều sạch gap 2, dự đoán 0,307 = số đo 0,306.
  **Dị thường r7 ({3,9} gap 6 → mô hình 0,549 nhưng đo 0,307) KHÔNG lặp
  lại** trong 118 cap chr mới. Vẫn là n=1, chưa giải thích được.
- **Đối chiếu Z2 (đọc từ đĩa: `round98-z2/analyze-z2.txt`):** Z2 chứng
  minh bằng pixel strip rằng capture **lệch nhãn đúng ±1 khung** trong
  25/138 capture pump (23 ca content = label−1, 2 ca content = label+1,
  hamming 0). Áp vào 4 cap D wk có nhãn đầy đủ mà dự đoán ≠ số đo:
  - r6 c0 fi=21: nhãn {18,21} gap 3 → pred 0,586, đo 0,301. Nếu snapshot
    "18" chứa frame 19 (label+1) → pair {19,21} gap 2 → 0,307 ✓.
  - r9 c0 fi=19: nhãn {16,19} gap 3 → pred 0,586, đo 0,303. Snapshot "16"
    chứa 17 (label+1) → {17,19} gap 2 → 0,307 ✓.
  - r9 c2 fi=10: nhãn {7,10} gap 3 → pred 0,586, đo 0,304. Snapshot "7"
    chứa 8 (label+1) → {8,10} gap 2 → 0,307 ✓.
  - r10 c1 fi=10: nhãn {9,10} gap 1 → pred 0,743, đo 0,304. Snapshot "9"
    chứa 8 (label−1) → {8,10} gap 2 → 0,307 ✓.
  - r5 c1 fi=14 (gap 11, không nhãn ringSize/skipped): nhãn không đáng
    tin, không dùng để kiểm.
  **Cả 4 mẫu đều khớp giả thuyết mislabel ±1 với sai số ≤0,006.**
  Đây là bằng chứng độc lập thứ hai (sau Z2) cho cơ chế mislabel —
  nhưng vẫn là suy luận từ số đo gStdRatio, chưa phải đọc pixel trực
  tiếp trên chính các cap này (probe Z5 không đọc strip Z2).
- **Giới hạn quan trọng:** mislabel ±1 **KHÔNG giải thích được dị thường
  r7** — snapshot "3" phải chứa frame 7 (lệch +4) mới cho pair {7,9}
  gap 2. Z2 chỉ thấy lệch ±1 (25/25 ca lệch đều ±1). Ứng viên còn lại
  cho r7: nhãn tick/ph lệch dưới tải (Y6 ứng viên 2) hoặc mislabel lớn
  hiếm — cả hai đều chưa có bằng chứng. Dị thường r7 vẫn mở.
- **Wk D gộp:** 7/247 = 2,8% (mean 0,304, med 0,304) — khớp Y6 (2,8%).

### (d) Cửa sổ mù wk — đối chiếu Y5 trên build mới (watchdog Y5 nguyên trạng)

| lượt (build) | fbAt c0/c1 | ringFirstAt c0/c1/c2 | blind c1 (phCross) | blind c2 (phCross) |
|---|---|---|---|---|
| wk-blur-r6 (Y6) | 1314 / 5915 | 1314 / 5915 / 8500 | — | — |
| wk-blur-r7 (Y6) | 3187 / 7676 | 3187 / 7676 / 10999 | — | — |
| wk-blur-r8 (Z5, a0a078e1) | 1666 / 5449 | 1666 / 5449 / 8265 | — | — |
| wk-blur-r9 (Z5, a0a078e1) | 1532 / 5172 | 1532 / 5172 / 7440 | — | — |
| wk-blur-r10 (Z5, lai) | 1273 / 5402 | 1273 / 5402 / 8600 | — | — |
| wk-blind-r1 (Z5, 41b05c8e) | 3268 / 15567 | 3268 / 15567 / 20060 | **2973 ms** | **0 ms** |
| wk-blind-r2 (Z5, 41b05c8e) | 2990 / 26293 | 2990 / 26293 / 34799 | **990 ms** | **0 ms** |
| Y5 (17 lượt) | — | — | 1018–1480 ms (median ~1110–1150) | ~0 ms (13/14), 485 ms (1/14) |

- **ringFirstAt c2 đã về mức bình thường:** 7440–8600 ms (Y6 r7: 10999)
  — r7 là ngoại lệ do tải, không phải Y5 làm tệ hơn. Cửa sổ mù wk r7
  nay có lời giải: tải + khởi động element chậm, không phải hồi quy
  watchdog.
- **Blind c1:** r2 = 990 ms — nằm trong dải Y5 (1018–1480, thấp hơn biên
  dưới một chút do sai số phCross ±16 ms + làm tròn) → **không hồi quy
  watchdog** trên build mới (Z2/Z3/Z6 không đụng watchdog — Z3 chỉ thêm
  đếm bò, chưa đổi ngưỡng kill). r1 = 2973 ms là ngoại lệ do **độ trễ
  khởi động element** (phCross c1 ở 12594 ms nhưng pump chỉ tạo ~14500
  ms; fbAt−pump ≈ 1000 ms đúng cửa sổ watchdog) — blind = startup delay
  (~2 s) + watchdog 1000 ms, không phải watchdog chậm.
- **Blind memo c2 = 0 ms cả 2 lượt** (ringFirstAt = phCross đúng từng ms)
  → gộp với Y5: 15/16 lượt wk ≈ 0 ms, 1/16 = 485 ms. Kết luận Y5
  ("blind memo = độ trễ khởi động element, watchdog đóng góp 0 ms")
  **được củng cố**.
- Freeze-kill `"no-callback-frozen"`: 0 lần bắn trong cả 9 lượt Z5
  (khớp Y5: 0/17) — không có ca đóng băng cứng nào xuất hiện; không
  kill oan (fbAt chr r9/r10 là `"no-callback"` advance-path / clip-change
  dưới tải, không phải freeze-kill).

### (e) state100 cắt 1200 mẫu — NGUYÊN NHÂN TÌM RA, FIX ĐÃ KIỂM CHỨNG (chỉ probe)

- **Nguyên nhân (đã chứng minh bằng số):** sampler `snap100` chạy từ lúc
  cài (trước phát) với chu kỳ 100 ms; vòng chờ yên trước phát tối đa
  120 s ⇒ 120 s × 10 mẫu/s = **1200 mẫu đúng bằng cap cũ** — cap cũ cắt
  đúng toàn bộ lịch sử trước phát + đầu lượt phát mỗi khi chờ yên lâu.
  Với `--state-ms 50` (probe Y5) thì 120 s = 2400 mẫu, cap cắt còn tệ hơn.
- **Fix (probe-only, đã áp dụng trong 2 probe Z5):** cap 1200 → 10000 +
  đếm `state100Dropped` (số mẫu bị cắt, 0 = không cắt). Không sửa production.
- **Kiểm chứng trên 7 lượt có kết quả:**

| lượt | state100 len | dropped (cap mới) | cap cũ 1200 đã cắt |
|---|---|---|---|
| wk-blur-r8 | 1228 | 0 | 28 |
| wk-blur-r9 | 1221 | 0 | 21 |
| wk-blur-r10 | 164 | 0 | 0 |
| chr-blur-r9 | 1257 | 0 | 57 |
| chr-blur-r10 | 1271 | 0 | 71 |
| wk-blind-r1 | 138 | 0 | 0 |
| wk-blind-r2 (--state-ms 50) | 2113 | 0 | **913 (43% dữ liệu timing)** |
| **tổng** | | **0** | **1090** |

- wk-blind-r2 là bằng chứng rõ nhất: 2113 mẫu / 105,6 s sampling, cap
  cũ đã cắt 913 mẫu (43%) — toàn bộ chờ yên + đầu lượt phát. Với cap
  mới, `firstRelPlay=None` (mẫu đầu là pre-play, relPlay null — đúng
  thiết kế) và toàn bộ lịch sử được giữ.
- **Đề xuất:** port fix này sang probe gốc dòng 96x5b/97y5 (hoặc lấy
  `probe98z5-frame-parity.mjs` làm bản sao chuẩn cho đợt sau). Ngoài ra
  nên trừ `playT0rel` khi phân tích bucket timing (nợ Y9 §8, vẫn mở —
  bucket hiện tính theo t0, không phải mốc phát).

## 2. Phương pháp

- Probe Z5: `apps/web/scripts/probe98z5-frame-parity.mjs` (copy probe97y6:
  SCRATCH → `round98-z5`; state100 cap 10000 + `state100Dropped`;
  draws/mainDraws cap 400 → 2000 theo Y9). `node --check` OK.
  Blind: `apps/web/scripts/probe98z5-y5blind.mjs` (copy probe97y5, chỉ đổi
  SCRATCH + cùng fix state100; `--state-ms 50`, không freeze-el).
- Driver: `hidden_files/round98-z5/driver98z5.sh` — 10 lượt tuần tự:
  wk-blur r8–r11, wk-noblur r3–r4 (scroll-noblur, mở baseline),
  chr-blur r9–r10, wk-blind r1–r2.
- Phân tích: `hidden_files/round98-z5/analyze98z5.py` (+ `analysis.txt`,
  `analysis.json`) — nối tiếp analyze97y6.py; baseline chr W3 r1+r2
  (241 key), baseline wk W3 r1+r2 + Z5 wk-noblur r3+r4 (133 key);
  dải D [0,27–0,34] / A [0,40–0,50] / B [0,70–0,82] / C [0,95–1,05];
  mô hình harmonic Y6 (gap 1 → 0,743; gap 2 → 0,307; gap 3 → 0,586;
  gap 6 → 0,549; gap 18 → 0,965). Cap wk thiếu key wk-baseline được cứu
  bằng baseline chr (sai số chéo-engine ≤ ±0,017; kiểm lại: mean cứu
  = mean gốc tới 0,001).
- Dữ liệu thô: `hidden_files/round98-z5/<tag>/frame-parity-results.json`
  (9 lượt) + `driver98z5.log`.

## 3. Kiểm chứng

- 9 lượt headed có kết quả, 0 pageErr, 0 collision; caps JSON 53/56/34/
  43/41/50/87/26/34; pump chr 50/90, wk 0/0 (silentEngine=true mọi lượt wk).
- Không sửa production → không chạy tsc/vite build/test suite (tiền lệ
  Y6: build đã được Y10 kiểm chứng tsc 0 + build PASS + O8 21/21 trên
  cây gộp đợt 97; Z5 chỉ thêm probe harness, `node --check` OK cả 2 file).
- Không đụng render pipeline → O8 không chạy lại.
- Build hash ghi rõ từng lượt (md5 trước/sau trong JSON + driver log);
  2 lượt lai (r10, chr-r9) gắn cờ `mtimeChanged=true`.

## 4. Nợ mở cho đợt sau (từ Z5)

1. **B-band wk vẫn mở ở mức từng mẫu** (n=61, không khe bimodal,
   2-means chạm nhau 0,0029). Hai tín hiệu một phía mới cần kiểm chứng
   thêm: ringSize=1 ⇒ pair-like (n=4) và phase 4 ⇒ dc-like (n=13,
   sd 0,008). Hướng mạnh nhất: đọc pixel strip Z2 trên chính các cap
   B wk (content thật của ghost thay vì nhãn) — instrumentation đã có
   trong build 41b05c8e, chỉ cần probe đọc ra.
2. **Dị thường chr r7 ({3,9} gap 6) vẫn chưa giải thích được** — mislabel
   ±1 (Z2) không đủ (cần +4); không lặp lại trong 118 cap chr mới.
   Cần pixel strip trên cap D dị thường nếu nó tái hiện.
3. **D fix-3 sàn ~1% (0,9% gộp 575 cap)** — cơ chế tinh chỉnh: ring chỉ
   còn 1 ghost cách presented 2 khung cũng cho D. Muốn về 0 cần giữ ring
   đủ 3 ghost đúng pha khi pump thưa (chưa có thiết kế).
4. **Blind wk:** r1 (2973 ms) cho thấy startup delay element dưới tải có
   thể tới ~2 s — tách blind thành (startup delay) + (watchdog ~1000 ms)
   khi báo cáo; cần thêm lượt blind yên để chốt đuôi phân phối memo c2
   (hiện 15/16 ≈ 0 ms). Đối chiếu với Z4 khi Z4 hạ cánh (Z4 chưa sửa
   preview.tsx lúc Z5 đo).
5. **Lượt mất do CDP evaluate treo** (r11; tái hiện lỗi Y5 §3.4 trên lượt
   thường): thêm timeout cho `page.evaluate` trong vòng chờ playhead +
   log nhịp tim vào probe trước khi chạy lại injection/blind dài.
6. **Harness:** port fix state100 (cap 10000 + `state100Dropped`) sang
   probe gốc dòng 96x5b/97y5; bucket tóm tắt Y9 cần trừ `playT0rel`
   (nợ cũ). Đợt sau nên chạy thêm lượt wk-blur để bù r11 đã mất.

## 5. Batch đã stage (KHÔNG push)

- Batch stage: `phase9-round98-z5-blur-bband.txt` — 3 entry, read-back
  OK (splitter NUL), 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND98_Z5_BLUR_BBAND_LIMITS.md` (file này)
  - `apps/web/scripts/probe98z5-frame-parity.mjs` (probe Z5: SCRATCH
    round98-z5, state100 cap 10000 + dropped counter, draws cap 2000)
  - `apps/web/scripts/probe98z5-y5blind.mjs` (probe blind: copy Y5, chỉ
    đổi SCRATCH + cùng fix state100)
- Dữ liệu (không stage, ở hidden_files): `round98-z5/` — driver98z5.log/
  .sh/.out, analyze98z5.py, analysis.txt/.json, 9 thư mục lượt chạy.

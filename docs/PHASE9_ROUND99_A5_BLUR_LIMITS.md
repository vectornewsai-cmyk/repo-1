# PHASE9_ROUND99_A5_BLUR_LIMITS — blur parity: B-band wk n=96, D chr 1,3%, strip ghost wk 64% mislabel, blind wk r3/r4, evaluate-timeout fix đã chứng minh

> Luồng A5, đợt 99. Lượt cron 00:35 +07 13/11/2026 (driver 17:45:03–18:01:57Z
> + bổ sung 18:08:05–18:13:25Z; boot 99338d31 = reboot ~17:26Z; reboot tiếp
> theo dự kiến ~19:26Z).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Không sửa production trong luồng này** — chỉ đo + 2 probe harness mới
> (copy probe98z5, chỉ đổi SCRATCH + evaluate timeout + giữ strip/blendTick;
> xem §5). Không đụng `.github/workflows`, 0 binary.

## 0. Môi trường + build nào đo cái gì (preview.tsx bị sửa 2 lần giữa lượt)

Các luồng song song đợt 99 sửa `preview.tsx` giữa lượt đo của A5
(không phải lỗi A5 — vòng lặp đợt 99 chạy song song). Dòng thời gian md5:

| md5 | nội dung | lượt đo trên build đó |
|---|---|---|
| `41b05c8e` | cây gộp đợt 98 (Z6) | (lúc A5 bắt đầu đo, đã đổi trước driver) |
| `848d21c0` | + A2 (ghostPix) / A6 (clip-active) — một phần | wk-blur-r12, wk-blur-r13: **SẠCH** toàn lượt |
| `efce65dd` | + A2 ×8 + A6 ×5 đầy đủ | wk-blur-r14 (**MẤT**, xem §0.1), chr-blur-r11/r12, wk-blur-r15/r16, wk-blind-r3/r4: **SẠCH** toàn lượt |

- **Xác minh blend math không đổi:** thân hàm `compositeMotionBlurLayer`
  chứa đúng **1 marker "Đợt 99"** — A2 stash strip đo lường (không đổi
  pixels, không đổi weights/plan); A6 chỉ ở vùng rvfcCallback/clip-active
  (check clip-active, hook test `__vcut99a6DisableOwnerKill`), không đụng
  blend. Ring capacity, skip logic, weights blend nguyên vẹn → **số liệu
  cụm D/A/B/C của cả 7 lượt có kết quả đều dùng được**. Chỉ số liệu
  watchdog/fallback của lượt lai phải gắn cờ build (không có lượt lai
  nào ngoài r14 đã mất).
- Tải: các lượt chạy dưới tải song song nặng (load1 lúc phát 0,54–14,75;
  đỉnh 16,28 lúc r14). tagAgree: wk r12 80%, r13 70%, r15 85%, r16 82%;
  chr r11 62%, r12 43% — nhiễm tải rõ. 0 pageErr, 0 collision.
- 7/8 lượt có kết quả; xem §0.1 cho lượt mất.

### 0.1 Lượt mất wk-blur-r14 — evaluate treo, NHƯNG timeout mới đã chặn đúng thiết kế

- Chạy 17:50:39Z (load 16,28), phát lúc ~17:52. Vòng chờ playhead:
  `EVAL_TIMEOUT_20000ms` ×3 (17:53:33, 17:53:54, 17:54:14Z) → log
  `EVAL HUNG x3 — thoát vòng chờ, lấy kết quả đã có` → evaluate lấy kết
  quả cuối cũng timeout 60s (`EVAL_TIMEOUT_60000ms` trong
  `frame-parity-error.txt`) → probe exit=2 lúc 17:55:46Z.
- **Fix timeout (mới ở A5) ĐÃ CHỨNG MINH:** thay vì treo câm ~5,5 phút như
  r11 đợt 98 rồi bị kill ngoài, lượt này tự phát hiện treo sau 3×20s,
  ghi log nhịp tim + lý do, thoát có kiểm soát trong ~5 phút, driver tiếp
  tục lượt sau. Không file kết quả cho r14 (chỉ có `vite-attempt1.log` +
  `frame-parity-error.txt` + log). B-band wk mất 1 lượt (~7–9 cap B dự
  kiến) nhưng vẫn vượt mục tiêu nhờ r15/r16 (xem §2).
- Giữa r14, preview.tsx đổi md5 848d21c0 → efce65dd (luồng khác) — lượt
  mất không dùng để kết luận build.

### 0.2 Hạn chế harness / lượt đo

- Baseline giữ nguyên Z5 (chr 241 key, wk 133 key); key chung chr–wk
  n=116, max|d| vẫn 1,395 (≈ gStdRatio ≤0,0172 xấu nhất — không đổi).
- **Pump im lặng trên wk (silentEngine=true) mọi lượt wk** — pumpN=0,
  pumpPix=0: strip của wk chỉ lấy được qua **ghostPix của A2** (r15/r16),
  không qua pump log. r12/r13 chạy bằng probe chưa map ghostPix nên
  không có strip (chỉ dùng cho thống kê B-band).
- **Snapshot chr đổi hình học:** pump pix chr r11/r12 là (1280, 720),
  không còn (640, 360) như Z2 — A2 đổi đường capture. Đối chiếu strip
  phải thử cả 2 hình học (resize thẳng + letterbox); thực tế G1 khớp
  hết các ca sạch (h=0), G2 không cần tới — ghi rõ để đợt sau không
  giả định kích thước snapshot.
- wk-blind-r3/r4 chạy bằng probe blind copy Y5 (không có ghostPix —
  không cần cho blind).

## 1. Kết quả chính

### (a) B-band WebKit — n=96, VẪN KHÔNG CÓ KHE BIMODAL; ringSize=1 ĐỨNG, phase 4 YẾU ĐI

| gộp wk (wk-base + chr-base cứu) | B n / tổng | mean | med | sd | pair-like [0,70–0,76) | dc-like [0,76–0,82] |
|---|---|---|---|---|---|---|
| r4+r5 (X5) | 20 / 56 | 0,768 | 0,775 | 0,018 | 6 (mean 0,746) | 14 (mean 0,778) |
| r6+r7 (Y6) | 16 / 52 | 0,764 | 0,761 | 0,011 | 8 (mean 0,756) | 8 (mean 0,772) |
| r8–r10 (Z5) | 25 / 139 | 0,766 | 0,773 | 0,017 | 11 (mean 0,749) | 14 (mean 0,779) |
| r12+r13+r15+r16 (A5) | 35 / 146 | 0,765 | 0,766 | 0,017 | 15 (mean 0,749) | 20 (mean 0,776) |
| **r4–r16 GỘP** | **96 / 393** | **0,766** | **0,768** | **0,016** | **40 (mean 0,750)** | **56 (mean 0,777)** |

- **Mục tiêu thêm mẫu ĐẠT: B wk 61 → 96 (+35).** Tỉ lệ pair/dc 42%/58%
  — khớp Z5 (41%/59%). Phân bố không đổi khi thêm 35 mẫu mới.
- **Không có khe bimodal:** histogram bin 0,005 trên dải 0,714–0,788 —
  vùng dày 0,745–0,790 liên tục; chỉ có bin trống ở đuôi thưa dưới
  (0,700–0,710, 0,715–0,720, 0,725–0,730, 0,740–0,745) — không phải khe
  phân tách hai quần thể. 2-means 1D: cụm 1 n=43 (mean 0,751, sd 0,012,
  0,714–0,762) vs cụm 2 n=53 (mean 0,778, sd 0,006, 0,765–0,788) —
  **khe giữa hai cụm chỉ 0,0022** (Z5: 0,0029), tách 1,66σ. Hai cụm chạm
  nhau ở biên; không thể gán từng mẫu chắc chắn.
- **Tín hiệu một phía — một đứng, một yếu đi:**
  - `ringSize=1` ⇒ pair-like: **n=7, TẤT CẢ pair-like (7/7, mean 0,733,
    dải 0,714–0,749)** — Z5 là 4/4; A5 thêm 3 mẫu mới, cả 3 đều
    pair-like (r15/r16 + r12/r13). **Tín hiệu ĐỨNG và mạnh lên.**
    ringSize=2 → n=8 mean 0,765; ringSize=3 → n=59 mean 0,769 (dải đầy
    0,748–0,788) — vẫn không phải phân hoạch.
  - `phase sọc 4` ⇒ dc-like: **gộp n=16, dc-like 13/16 (81%), mean
    0,776, sd 0,010** — Z5 là 13/13 (100%). A5 mới chỉ 1/3 dc-like
    (r15/r16: 3 mẫu phase 4, mean 0,762, dải 0,753–0,775). **Tín hiệu
    YẾU ĐI: không còn "tất cả dc-like";** vẫn giàu dc hơn tỉ lệ nền
    (58%) nhưng không còn là luật một phía chắc chắn.
  - `skipped`: −1 (n=22, mean 0,767) vs 0 (n=74, mean 0,765) — **không tách**.
  - Nguồn baseline: chr-base n=49 (mean 0,763) vs wk-base n=47 (mean
    0,768) — cứu baseline không làm lệch (chênh 0,005, trong sai số
    chéo-engine).
- **Verdict (a): B-band wk LÀ hỗn hợp pair (~42%) + double-count (~58%)
  ở mức quần thể — XÁC NHẬN với n=96; vẫn không tách sạch từng mẫu.**
  ringSize=1 ⇒ pair-like là tín hiệu một phía duy nhất còn đứng vững;
  phase 4 đã yếu đi và không dùng làm luật được nữa.

### (b) Strip ghost — LẦN ĐẦU ĐỌC ĐƯỢC PIXELS THẬT CỦA GHOST WK: mislabel 64%, không tách pair/dc

Đọc strip qua ghostPix (A2, wk r15/r16: 39 ghost) và pump pix (chr
r11/r12: 70 ghost + 107 capture). Đối chiếu với frame nguồn bằng
hamming ≤2 trong nhãn ±3 (phương pháp Z2; frame sọc trùng pha nên tập
khớp có thể chứa nhiều frame kề — chỉ kết luận lệch khi nhãn KHÔNG nằm
trong tập khớp).

| tập | ghost/capture có strip | sạch (nhãn trong tập khớp) | lệch thật | không dữ liệu/không khớp |
|---|---|---|---|---|
| wk ghost (r15/r16, ghostPix) | 39 | 14 (36%) | **25 (64%)** | 0 |
| chr ghost (r11/r12, pump pix) | 70 | 62 (89%) | 6 (9%) | 2 không dữ liệu |
| chr capture (r11/r12, pump pix) | 107 | 103 (96%) | **4 (3,7%)** | 0 |

- **Ghost wk mislabel 64% (25/39) — phát hiện mới, lớn.** Hầu hết lệch
  ±1 pha sọc (vd nhãn 27 → content 28; 65 → 66; 8 → 7; 21 → 22; 71 →
  72), một số mơ hồ nhiều frame do sọc tuần hoàn (vd nhãn 83 → [80, 81,
  85]; 42 → [40, 44, 45] — content chắc chắn không phải nhãn nhưng
  strip không pin được đúng 1 frame). Ghost sạch vẫn có (14/39, h=0).
  Cơ chế hợp lý: đường tick trên wk (pump im lặng) capture snapshot mà
  không có freshness guard của rVFC như chr — nhãn lấy lúc khác với
  pixels vẽ lúc capture. Đây là lần đầu có số trực tiếp trên ghost wk
  (Z2 chỉ đo trên chr). **Đối chiếu chéo: A2 (đợt 99, cùng boot) độc lập
  đo đường tick chỉ 119/251 = 47,4% sạch (lệch +1 mod 5: 27,9%) — khớp
  hướng và bậc với 64% lệch của A5; hai luồng đo khác nhau cùng kết
  luận đường tick gán nhãn sai hệ thống.**
- **Ghost chr sạch hơn hẳn (89%)**; capture chr chỉ 4/107 lệch thật
  (3,7%), tất cả ở pha kề (12 → [9,13]; 24 → [21,25]; 3 → [4]; 9 →
  [10]) — khớp tỉ lệ Z2 (2/138 ≈ 1,4%, cùng bậc).
- **`ctFrameIdx != frameIdx` là tín hiệu NHIỄU, đừng dùng làm proxy
  mislabel:** chr r11 19/50 (38%), r12 10/57 (18%) — gộp 29/107 (27%)
  capture có ctFrameIdx lệch nhãn, nhưng strip chỉ xác nhận 4/107
  (3,7%) lệch pixels thật. Chẩn đoán Y2 qua ctFrameIdx phóng đại
  mislabel ~7 lần: currentTime chạy trước metadata không đồng nghĩa
  drawImage đã vẽ frame mới.
- **Mislabel KHÔNG tách pair/dc (wk B, r15/r16):** pair-like 3/7 ghost
  lệch (43%) vs dc-like 22/32 (69%) — Fisher chính xác p=0,225, không
  có ý nghĩa thống kê. Mislabel tràn lan cả hai phía; nó làm bẩn mọi
  phân tích dựa trên nhãn, nhưng không phải đáp án của B-band.
- **Mô phỏng blend offline từ frame nguồn — KHÔNG DÙNG ĐƯỢC, đã bác
  bằng validate:** mô phỏng mean 3 frame trên hình học canvas Z2 cho
  pair gap 2 = 0,000 (Y6 đo 0,307), gap 1 = 0,694 (Y6 0,743), gap 3 =
  0,719 (Y6 0,586), gap 6 = 0,694 (Y6 0,549), gap 18 = 0,719 (Y6
  0,965) — 4/5 điểm harmonic lệch 0,05–0,31. Pipeline thật không phải
  mean đơn giản của frame nguồn (weights/alpha/scaling khác). Mọi dự
  đoán từ mô phỏng này đều vô giá trị — không dùng để kết luận pair/dc
  hay cap D. Cần đọc alpha plan trong `compositeMotionBlurLayer` thay
  vì mô phỏng thêm (nợ cho đợt sau, xem §4).

### (c) Cap D — D fix-3 1,3% gộp; 4 cap D mới kiểu "ghost đơn cũ kỹ", ghost content SẠCH; r7 vẫn mở

| lượt | D n / tổng | % | mean | nhãn |
|---|---|---|---|---|
| chr-blur-r6–r8 | 3 / 457 | 0,7% | 0,307 | gap 2 ×2; **r7 gap 6 dị thường ×1** |
| chr-blur-r9+r10 (Z5) | 2 / 118 | 1,7% | 0,306 | gap 2, ringSize 1 |
| chr-blur-r11+r12 (A5) | 4 / 118 | 3,4% | 0,305 | **gap 7/8/10/14, ringSize 1, ghost cũ** |
| **gộp r6–r12** | **9 / 693** | **1,3%** | **0,306 (sd 0,001)** | — |

- **Verdict (c1): D fix-3 = ~1% (1,3% gộp 693 cap chr) — XÁC NHẬN, không
  về 0.** Tỉ lệ r11+r12 cao (3,4%) là nhiễu mẫu nhỏ (4 cap đều trong
  r11, 0 trong r12); gộp 7 lượt vẫn 1,3% (KTC 95% ≈ 0,6–2,4%). Tâm
  cụm không đổi: D 0,306 / A 0,439 / B 0,770 / C 0,999 (chr gộp r6–r12).
  0 mẫu ngoài-dải trong cả 6 lượt A5 có kết quả — thang đo ổn định.
- **4 cap D mới r11 — cùng chữ ký "ghost đơn cũ kỹ":** ringSize=1,
  prev=−1, ghost duy nhất là frame cũ (1 hoặc 6), presented đã tiến xa
  (gap 7/8/10/14), đo đúng 0,304–0,307:
  - c1 fi=8: {1,8} gap 7; c2 fi=13: {6,14} gap 8; c2 fi=17: {6,16} gap
    10; c2 fi=19: {6,20} gap 14.
  - **Strip xác nhận ghost content = nhãn ở cả 4 cap (4/4 sạch, h=0)**
    — mislabel ghost KHÔNG giải thích được các cap này. Mô hình
    harmonic Y6 không có dự đoán cho gap 7/8/10/14 (chỉ có 1/2/3/6/18)
    nên đây là **khoảng trống của mô hình, không phải mâu thuẫn** —
    nhưng đáng chú ý: cả 4 đều đo đúng giá trị pair gap-2 (0,306).
- **Dị thường r7 ({3,9} gap 6 → mô hình 0,549 nhưng đo 0,307) KHÔNG
  tái hiện dạng y hệt** trong 118 cap chr mới của A5 (60+58 usable; 0
  cap D gap 6 trong r11/r12; chỉ còn n=1). Mislabel ±1 (Z2/A5)
  vẫn không đủ (cần +4). **r7 VẪN MỞ.**
- **Ca wk đáng chú ý — r15 c1 fi=8 (D, g=0,304):** nhãn {6,8} gap 2 →
  dự đoán 0,307 ✓, nhưng strip nói ghost 6 chứa pixels frame **5**.
  Nếu blend thật là {5,8} gap 3 → mô hình 0,586, mâu thuẫn với số đo
  0,304 — trừ khi presented 8 cũng lệch −1 (thật là 7, {5,7} gap 2 →
  0,307 ✓). Đây là bằng chứng gợi ý **presented cũng có thể mislabel
  −1** (cả ghost lẫn presented cùng trượt 1 khung, giữ nguyên gap) —
  nhưng **chưa chứng minh được** (curPix null ở đường thường, không đọc
  được content presented). Ghi là giả thuyết n=1, cần curPix hoặc
  instrumentation presented-strip để kiểm.
- **Wk D gộp:** 10/393 = 2,5% (mean 0,303) — khớp Y6 (2,8%).

### (d) Cửa sổ mù wk — r3 đứng trong dải Y5; r4 là ngoại lệ tải, memo c2 có thêm 1 ca 671 ms

| lượt (build) | fbAt c0/c1 | ringFirstAt c0/c1/c2 | blind c1 (phCross) | blind c2 (phCross) |
|---|---|---|---|---|
| wk-blind-r1 (Z5) | 3268 / 15567 | 3268 / 15567 / 20060 | 2973 ms | 0 ms |
| wk-blind-r2 (Z5) | 2990 / 26293 | 2990 / 26293 / 34799 | 990 ms | 0 ms |
| wk-blind-r3 (A5, efce65dd) | 2017 / 9903 | 2017 / 9903 / 21395 | **1291 ms** | **0 ms** |
| wk-blind-r4 (A5, efce65dd) | 5600 / 19721 | 5600 / 19721 / 25501 | **3792 ms** | **671 ms** |
| Y5 (17 lượt) | — | — | 1018–1480 ms (median ~1110–1150) | ~0 ms (13/14), 485 ms (1/14) |

- **Blind c1:** r3 = 1291 ms — nằm trong dải Y5 (1018–1480) →
  **không hồi quy watchdog** trên build mới (A2/A6 không đụng watchdog).
  r4 = 3792 ms là **ngoại lệ tải lớn nhất từng thấy** (vượt Z5 r1 =
  2973 ms): load lúc phát 14,75, playhead ~0,12× realtime, phCross c1
  ở 15929 ms cho biên 3 s — blind = startup delay (~2,8 s) + watchdog
  ~1000 ms, không tách được phần watchdog từ lượt này một mình.
- **Blind memo c2:** r3 = 0 ms; r4 = **671 ms — ca khác 0 thứ hai trong
  lịch sử** (sau Y5 485 ms). Gộp Y5+Z5+A5: 19/21 lượt wk ≈ 0 ms, 1/21
  = 485 ms, 1/21 = 671 ms. Cả 2 ca khác 0 đều dưới tải nặng. Kết luận
  Y5 ("blind memo = độ trễ khởi động element, watchdog đóng góp 0 ms")
  **vẫn đứng cho 90% lượt**; đuôi phân phối memo c2 nay có 2 điểm dữ
  liệu (485, 671 ms) — cần thêm lượt blind yên để chốt đuôi, không vội
  sửa kết luận.
- ringFirstAt c2 r3/r4 (21395/25501 ms) là wall-clock dưới tải chậm,
  không phải hồi quy — r7 Y6 (10999 ms) đã được Z5 giải thích bằng tải,
  nay có thêm 2 điểm củng cố.
- Freeze-kill `"no-callback-frozen"`: 0 lần bắn trong cả 7 lượt A5 có
  kết quả (khớp Y5: 0/17; Z5: 0/9) — không có ca đóng băng cứng nào;
  không kill oan.

### (e) state100 + evaluate timeout

- state100 cap 10000: dropped=0 ở cả 8 lượt (7 có kết quả + r14 mất
  nhưng log ghi đủ); cap cũ 1200 đã cắt tới **438 mẫu (r4)** và 49/38/25
  (r16/r15/r12) — fix Z5 vẫn cần và vẫn hoạt động.
- Evaluate timeout (mới A5): đã chứng minh ở r14 (§0.1) — 3×20s +
  60s, log nhịp tim, thoát có kiểm soát. Khuyến nghị port vào probe
  gốc dòng 96x5b/97y5 (nợ Y5 §5 mục 2 nay có bản mẫu chạy được).

## 2. Phương pháp

- Probe A5: `apps/web/scripts/probe99a5-frame-parity.mjs` (copy probe98z5:
  SCRATCH → `round99-a5`; evalTimeout 20s vòng chờ playhead + 20s boot
  + 60s lấy kết quả cuối + heartbeat 10s; pump map giữ `pix/pixW/pixH/
  ctFrameIdx/lateMs/ctDeltaMs/ringSize/ringLast/ringPrev` (Z5 đã bỏ);
  blendTick map thêm `ghostPix/currentTime` (A2)). `node --check` OK.
  Blind: `apps/web/scripts/probe99a5-y5blind.mjs` (copy probe98z5-y5blind,
  chỉ đổi SCRATCH + cùng fix evaluate timeout).
- Driver: `hidden_files/round99-a5/driver99a5.sh` (r12–r14 wk, r11–r12
  chr, r3–r4 blind; mỗi lượt bọc `timeout 900`) + `driver99a5b.sh`
  (r15–r16 wk với ghostPix, sau khi patch probe). Chạy tuần tự.
- Phân tích: `hidden_files/round99-a5/analyze99a5.py` (+ `analysis.txt`,
  `analysis.json`) — nối tiếp analyze98z5.py; baseline như Z5; dải
  D [0,27–0,34] / A [0,40–0,50] / B [0,70–0,82] / C [0,95–1,05]; mô hình
  harmonic Y6 (gap 1 → 0,743; gap 2 → 0,307; gap 3 → 0,586; gap 6 →
  0,549; gap 18 → 0,965). Strip: frame tham chiếu
  `round97-y2/frames-stripes/f001..f090.png` (1280×720); bits = strip
  G > 128; khớp = hamming ≤2 trong nhãn ±3, thử 2 hình học (G1 resize
  thẳng, G2 letterbox).
- Mô phỏng blend: `hidden_files/round99-a5/simulate99a5.py` (+
  `simulate.txt`, `simulate.json`) — **kết quả: mô phỏng KHÔNG tái hiện
  được bảng harmonic Y6 (sai tới 0,31), mọi dự đoán từ nó đều bỏ; chỉ
  dùng để ghi lại rằng hướng mô phỏng offline từ frame nguồn là cụt
  (xem §1b).**
- Cross-tab mislabel × pair/dc: `/tmp/crosstab99a5.py` (Fisher p=0,225).
- Dữ liệu thô: `hidden_files/round99-a5/<tag>/frame-parity-results.json`
  (7 lượt) + `driver99a5.log` (+ `driver99a5b` gộp chung log).

## 3. Kiểm chứng

- 7 lượt headed có kết quả, 1 lượt mất (r14, đã giải thích §0.1);
  0 pageErr, 0 collision; caps JSON 39/26/37/50/72/68/35/24 (r12/r13/
  r15/r16/r11/r12/blind-r3/blind-r4); pump chr 67/67, wk 0/0
  (silentEngine=true mọi lượt wk); pumpPix chr 50/57; ghostPixTicks
  wk r15/r16 42/56 (100% blend tick có ghostPix).
- Không sửa production → không chạy tsc/vite build/test suite (tiền lệ
  Z5/Y6: build đã được kiểm chứng; A5 chỉ thêm probe harness,
  `node --check` OK cả 2 file; probe mới không đụng render pipeline).
- Build hash ghi rõ từng lượt (md5 trước/sau trong JSON + driver log);
  0 lượt lai (mtimeChanged=false mọi lượt có kết quả — r14 đổi md5
  giữa lượt nhưng đã mất, không dùng số liệu).
- Strip matching tự kiểm chứng: ca sạch khớp h=0 (cả 2 engine); ca lệch
  có h(label)=24/48 (nửa hoặc toàn bộ bit đảo — content chắc chắn không
  phải nhãn); 0 ca "không khớp frame nào" ở ghost-level wk (39/39 đều
  khớp 1 frame kề trong ±3).

## 4. Nợ mở cho đợt sau (từ A5)

1. **B-band wk vẫn mở ở mức từng mẫu** (n=96, không khe bimodal,
   2-means chạm nhau 0,0022). ringSize=1 ⇒ pair-like là tín hiệu duy
   nhất còn đứng (7/7); phase 4 đã yếu (13/16). Ghost mislabel wk 64%
   làm bẩn mọi phân tích nhãn — nhưng không tách pair/dc (Fisher
   p=0,225). Hướng mạnh nhất nay là **đọc alpha plan thật trong
   `compositeMotionBlurLayer`** (weights/plan từng tick) thay vì đoán
   từ nhãn hay mô phỏng offline (mô phỏng đã bị bác).
2. **Dị thường r7 vẫn chưa giải thích được** — mislabel ±1 không đủ
   (cần +4); không tái hiện dạng y hệt trong 140 cap chr mới. 4 cap D
   r11 kiểu ghost-đơn-cũ-kỹ (ghost content sạch) cho thấy mô hình
   harmonic thiếu dự đoán gap 7/8/10/14 — cần đo/bảng harmonic cho các
   gap này hoặc đọc code blend khi ring chỉ còn 1 ghost cũ.
3. **Giả thuyết presented mislabel −1** (ca wk r15 c1 fi=8: ghost thật
   5, nhãn {6,8}, đo 0,304): cần instrumentation đọc strip của frame
   hiện tại ở đường thường (curPix hiện chỉ có ở đường mask) hoặc log
   presented-strip trong recordDrawnBlendWindow.
4. **D fix-3 sàn ~1% (1,3% gộp 693 cap)** — cơ chế tinh chỉnh Z5 vẫn
   đứng (ring chỉ còn 1 ghost cách presented 2 khung cũng cho D); nay
   thêm chữ ký ghost-đơn-cũ-kỹ (gap lớn vẫn đo 0,306). Muốn về 0 cần
   giữ ring đủ 3 ghost đúng pha khi pump thưa (chưa có thiết kế).
5. **Blind wk:** đuôi memo c2 nay có 2 điểm khác 0 (485, 671 ms, đều
   dưới tải nặng) — cần thêm lượt blind yên để chốt đuôi phân phối;
   blind c1 r4 3792 ms là ngoại lệ tải, không phải hồi quy watchdog.
   Đối chiếu với Z4 khi Z4 hạ cánh (Z4 chưa ổn định lúc A5 đo — xem
   LIMITS gộp đợt 98).
6. **Harness:** port fix evaluate-timeout (A5, đã chứng minh ở r14)
   sang probe gốc dòng 96x5b/97y5; port fix state100 (Z5) vẫn chưa
   port (nợ cũ). Bucket tóm tắt Y9 cần trừ `playT0rel` (nợ cũ).
7. **Mô phỏng blend offline từ frame nguồn là hướng cụt** — đã chứng
   minh không tái hiện được bảng harmonic Y6; đợt sau đừng lặp lại
   hướng này mà không sửa hình học/trọng số trước (validate bắt buộc
   với 5 điểm harmonic trước khi dùng).

## 5. Batch đã stage (KHÔNG push)

- Batch stage: `phase9-round99-a5-blur.txt` — 3 entry, read-back OK
  (splitter NUL), 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND99_A5_BLUR_LIMITS.md` (file này)
  - `apps/web/scripts/probe99a5-frame-parity.mjs` (probe A5: SCRATCH
    round99-a5, evaluate timeout + heartbeat, pump pix + chẩn đoán
    mislabel, blendTick ghostPix)
  - `apps/web/scripts/probe99a5-y5blind.mjs` (probe blind: copy Y5, chỉ
    đổi SCRATCH + cùng fix evaluate timeout)
- Dữ liệu (không stage, ở hidden_files): `round99-a5/` — driver99a5.log/
  .sh/.out, driver99a5b.sh/.out, analyze99a5.py, analysis.txt/.json,
  simulate99a5.py, simulate.txt/.json, 8 thư mục lượt chạy (7 có JSON,
  r14 chỉ có error/log).

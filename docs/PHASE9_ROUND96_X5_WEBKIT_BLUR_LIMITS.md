# PHASE9_ROUND96_X5_WEBKIT_BLUR_LIMITS — rVFC WebKit: blur parity + tự hồi memo + cửa sổ mù

> Luồng X5 + nối tiếp X5b sau reboot #18. Lượt cron 15:35 +07 12/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Không sửa production trong luồng này** — quyết định §5: KHÔNG triển khai cơ chế
> tự hồi memo (không đủ bằng chứng theo đúng điều kiện đã đặt). Không đụng vùng
> blend của X2 hay vùng drift của X4. Không đụng TTS 39, birefnet,
> `.github/workflows`, 0 binary.

## 0. Môi trường + dòng thời gian (X5 vs X5b — build nào đo cái gì)

- Reboot #17 ~08:01Z (boot `a3a13d5a`); **reboot #18 09:24:17Z (boot `04b83831`)**
  giết X5 giữa chừng (sau khi driver 5 lượt đã phát xong 09:09–09:17Z, trước khi
  phân tích xong). X5b nối tiếp từ đĩa, không chạy lại 5 lượt đó.
- **X5 (gốc, 5 lượt, boot a3a13d5a): build fix-1 của X2** — `preview.tsx`
  md5 `fd588ca0`, mtime 08:58:45Z, ring=2 (`frames-1`). Mọi lượt X5 đều
  `mtimeChanged=false`, 0 pageErr.
- **X5b (2 lượt bổ sung, boot 04b83831): build HIỆN TẠI (fix-3 X2 + X4)** —
  `preview.tsx` md5 `6cac637d`, mtime 09:41:00Z, ring=3. `mtimeChanged=false`,
  0 pageErr. Build này đã được X2 kiểm chứng (LIMITS X2 §2: tsc web 0, vite
  build PASS 8,72 s, O8 21/21 cả 2 engine) — X5b không chạy lại suite đó.
- Tải lúc phát: X5 chr-blur-r4 nhiễm nặng (load1 14,82 sau 120 s chờ yên không
  đạt); các lượt còn lại 0,73–1,96. X5b yên (load1 1,86–1,91). RAM khả dụng
  ~0,99–1,39 GB lúc X5b. Không reboot mới trong lúc X5b chạy (boot 04b83831
  giữ nguyên 09:24→10:28Z).
- Harness: `apps/web/scripts/probe96x5-frame-parity.mjs` (X5, kế thừa W3 +
  state100 100 ms + snapshot mainDraws/draws/loopMs + `--stall` Exp A +
  lock Xvfb W8) và `probe96x5b-frame-parity.mjs` (X5b: copy + ghi thêm
  `lastDrawnRingSize`/`lastDrawnSkippedLatest` + `--delay-rvfc` Exp A2 +
  probe liveness cuối lượt). Cả hai `node --check` OK.
- Dữ liệu X5: `hidden_files/round96-x5/` (driver96x5.log/.out, 5 thư mục lượt,
  new-runs-analysis/blind/stall.txt sơ bộ 09:20–09:22Z, w3-reanalysis-full.txt,
  w3b-clusters.txt). Phân tích hoàn thiện X5b:
  `hidden_files/round96-x5b-analyze.py`, `round96-x5b-analyze2.py`,
  `round96-x5b-phase.py`, `round96-x5b-analyze-r6.py` (+ `.txt` kèm theo).
  Dữ liệu X5b: `hidden_files/round96-x5b/` (driver96x5b.log, chr-blur-r6,
  chr-delay-r1).

## 1. Cụm gStdRatio hậu-fix — tâm cụm + cụm D mới + mô hình sóng vuông

Baseline noblur W3 (chr/wk): mean ~81,2/81,0, **CV 0,48% cả hai** — thang đo
ổn định theo frame nên nhãn cap sai (tagAgree thấp ở lượt nhiễm tải) không
làm lệch tỉ lệ. 0 mẫu ngoài-dải trong cả 7 lượt (tổng 778 cap blur).

### 1.1 Tâm cụm (dải D ~0,30 / A ~0,44 / B ~0,76 / C ~1,00)

| lượt (build) | D n/mean | A n/mean | B n/mean | C n/mean |
|---|---|---|---|---|
| chr-blur-r4 (fix-1) | 6 / 0,306 | 12 / 0,438 | 20 / 0,751 | 11 / 1,001 |
| wk-blur-r4 (fix-1) | 0 | 5 / 0,441 | 3 / 0,781 | 5 / 1,002 |
| chr-blur-r5 (fix-1) | 32 / 0,305 | 2 / 0,442 | 171 / 0,740 | 33 / 1,000 |
| wk-blur-r5 (fix-1) | 0 | 1 / 0,435 | 2 / 0,774 | 3 / 1,002 |
| chr-stall-r1 (fix-1) | 4 / 0,306 | 10 / 0,440 | 17 / 0,756 | 10 / 1,002 |
| **chr-blur-r6 (fix-3)** | **2 / 0,307** | **160 / 0,440** | **68 / 0,771** | **4 / 1,000** |
| chr-delay-r1 (fix-3) | 1 / 0,303 | 137 / 0,440 | 59 / 0,774 | 41 / 0,999 |

Gộp fix-1 (blur r4+r5): chr D n=38 mean 0,305; A n=14 mean 0,439;
B n=191 mean 0,741; C n=44 mean 1,000. wk D n=0; A n=6 mean 0,440;
B n=5 mean 0,778; C n=8 mean 1,002.
**Δ tâm chr−wk: A −0,002, B −0,037, C −0,002** (W3 pre-fix: A +0,000,
B +0,007, C −0,003). A và C không đổi sau fix; B dịch — xem §1.3.

### 1.2 Mô hình sóng vuông (harmonic) giải thích các mức tốt hơn sinusoid đơn

Pattern sọc không phải sinusoid thuần (nền tảng: std toàn khung 80,79 nhưng
biên độ DFT tại k\*=27 chỉ 68,30 — 64% công suất nằm ở harmonic lẻ). Với
a = 1,41 rad/khung (shift 0,80 px/khung) và trọng số 1/h² cho harmonic lẻ:

| cửa sổ | dự đoán (harmonic) | đo được |
|---|---|---|
| triple {K-2,K-1,K} | 0,446 | A 0,438–0,442 |
| pair {K-1,K} | 0,743 | B chr r5 0,740 |
| double-count {K-1,K,K} | 0,776 | B fix-3 0,771–0,774; B wk 0,778 |
| **pair cách-2 {K-2,K}** | **0,307** | **D 0,305–0,307 (sd 0,001)** |
| triple {K-4,K-2,K} | 0,327 | (không khớp D — loại, xem §1.4) |
| direct {K} | 1,000 | C 0,999–1,002 |

Mô hình sinusoid đơn dự đoán sai B (pair 0,762 vs đo 0,740) và sai D
({K-4,K-2,K} 0,299 vs đo 0,306); mô hình harmonic khớp cả ba mức A/B/D
trong ±0,006. Mức D chỉ khớp duy nhất pair cách-2 (0,307); KHÔNG có triple
đều-trọng-số nào cho 0,306 (triple gần nhất 0,326–0,327).

### 1.3 Dải B là hỗn hợp pair/double-count — tâm dịch theo fix + mật độ capture

- Pre-fix W3 chr B 0,773 = hỗn hợp pair (0,743) + double-count (0,776).
- Fix-1 chr r5 (capture dày, 348 capture/353 callback): B 0,740 ≈ pair thuần —
  skip logic của X2 đã chuyển double-count → pair khi pump bắt kịp.
- Fix-1 chr r4 (capture thưa, 42 capture/70 callback): B 0,751 (hỗn hợp).
- Fix-3 chr r6: B 0,771 ≈ double-count thuần — skip nay cho triple (A) thay
  vì pair nên phần pair biến mất khỏi B, chỉ còn double-count sót lại (do
  ước lượng presented lệch — đúng cụm 84 còn lại mà X2 §3.3 đã ghi, ~19–25%).
- wk B 0,778 (n=5, yếu): ≈ double-count — không pump nên presented rơi về
  frameIdx, skip hiếm khi kích hoạt. Cần thêm lượt wk để chốt (nợ §6.4).

### 1.4 Cụm D — ĐÃ ĐỊNH DANH: pair cách-2, bằng chứng nhãn fix-3

- Tồn tại chắc chắn: 0,305–0,307, sd 0,001, n=45 (38 blur fix-1 + 4 stall +
  3 fix-3), chr-only trong dữ liệu này (wk n=19 cap — chưa đủ để nói wk
  không có D). 0 mẫu ngoài-dải nào khác. [Đính chính parent gộp đợt 96:
  "n=42" cộng sai — 38+4+3=45, bảng §1.1 cộng lại cũng = 45.]
- **Bằng chứng nhãn (fix-3, probe96x5b ghi đủ trường lượt 3):** 2 cap D ở
  chr-blur-r6 đều `ringSize=2, skippedLatest=1, lastDrawnLast=2,
  lastDrawnPrev=0, lastDrawnPresented=2` (clip c2, frame 1–2, rp 6318–6329):
  ring lúc blend chỉ có 2 snapshot {0, 2} (capture bỏ qua frame 1), skip
  snapshot 2 → ghost duy nhất frame 0 + frame hiện tại 2 → **pair {0,2}**
  = 0,307 đúng số đo. Cùng cửa sổ {0,2} vẽ 2 lần (tick frameIdx 1 và 2 —
  capture frame 2 rơi vào đúng ms của tick frame 1).
- Cap D thứ 3 (delay-run, đường tick, `ringSize=1, skipped=0, last=30,
  prev=-1, pres=31`): pair {ghost 30, current 31} theo nhãn là cách-1
  (phải ra 0,743) nhưng đo 0,303 — tức snapshot nhãn 30 chứa nội dung 29
  (tick snapshot: currentTime đi trước trình chiếu 1 khung) → pair nội dung
  {29,31} cách-2. Cùng một mức, hai đường sinh gap khác nhau (bỏ capture
  trên đường pump; lệch nhãn/nội dung trên đường tick).
- **Tần suất theo build: fix-1 13% (r5) → fix-3 1% (r6, chỉ còn ở đầu clip
  khi ring chưa đủ 3).** D là hệ quả của skip-pair khi ring chưa đủ:
  fix-1 ring tối đa 2 nên mọi skip đều thành pair; fix-3 skip còn 2 ghost
  → triple, D chỉ còn trong cửa sổ ring-size-2 thoáng qua (đầu clip/sau
  clear). Giả thuyết cũ {K-4,K-2,K} (mô hình sinusoid đơn) BỊ BÁC: mô hình
  harmonic cho 0,327 (lệch 0,021, gấp 3–7× sai số mô hình đã kiểm chứng
  trên A/B) và capture fix-1 r5 liên tiếp toàn bộ (gap capture = 1, không
  có snapshot cách-2 trong ring).
- Nhãn 4 trường (frameIdx,last,prev,presented) KHÔNG tách được D khỏi B
  trên fix-1 (cùng chữ ký (0,−1,0) cho cả B/D/C) — đúng lý do X2 thêm
  ringSize/skippedLatest ở lượt 3. Trên fix-1, lastDrawn==frameIdx đúng
  100% ở các dải blur (D 32/32, A 2/2, B 170/171 ở r5) — nhãn không stale;
  chỉ dải C (direct, không ghi blend) mới stale (28/33).

### 1.5 Phân rã DFT/pha — THỬ VÀ THẤT BẠI (ghi để khỏi làm lại)

DFT tại k\*=27 trên cap 96×54: biên độ nền CV 5,2% (moiré do downsample
gần-Nyquist), pha scatter sd 0,8–1,4 khung; control A cho H1 = 0,312 so với
dự đoán 0,440 (lệch 29%). **Không dùng DFT/pha trên cap downsample để định
danh cửa sổ.** Chỉ gstd + mô hình harmonic mới đủ tin cậy ở đây.

### 1.6 Đối chiếu số X2 assert96b/c (fix-3, thang đo khác)

Thang đo X2 (gStd_core vùng lõi full-res, baseline 112) khác thang đo này
(gstd toàn khung downsample 96×54, baseline ~81) nên không map trực tiếp.
Trong thang X2: không có cụm [32,36) nào (0 mẫu, cả assert96b/c, case
B–E); bucket triple [36,39) rộng (vd case D assert96b: 36:147 / 37:134 /
38:18) — không loại trừ được D ở ~36 trong thang đó. Kết luận: đối chiếu
không mâu thuẫn, nhưng cũng không độc lập xác nhận tần suất D trên fix-3;
con số D fix-3 (1%) lấy từ chr-blur-r6, không từ assert.

## 2. Mô hình cửa sổ mù — đầy đủ 5 lượt X5 + đối chứng

Quy ước: entry = nội suy từ caps (ph, relPlay); created = mainDraw đầu tiên
sau entry; kill = mainDraw đầu tiên ≥ created+1000 ms (mốc watchdog
fast-path); obs_fill = ringFirstAt; forced = blind nếu tick cưỡng bức tại
created+1000. Sai số entry nội suy ~±100 ms dưới tải (cap.t lệch relPlay
tới ~74 ms do chi phí capture; caps thưa ở wk).

| lượt / clip | blind_obs | pred_fill | Δpred−obs | forced~ |
|---|---|---|---|---|
| wk-blur-r4 c0 | 1409 ms | 1301 ms | −108 ms | 1013 ms |
| wk-blur-r4 c1 | 1984 ms | 1782 ms | −202 ms | 1603 ms |
| wk-blur-r4 c2 (memo) | 1101 ms | 1211 ms | +110 ms | 1018 ms |
| wk-blur-r5 c0 | 2031 ms | 1919 ms | −112 ms | 1122 ms |
| wk-blur-r5 c1 | 2132 ms | 1113 ms | **−1019 ms** | 1021 ms |
| wk-blur-r5 c2 (memo) | 96 ms | 1573 ms | +1477 ms | 1372 ms |
| chr-blur-r4 c0/c1/c2 (đối chứng) | 224 / 437 / 76 ms | — (mô hình không áp dụng) | — | — |
| chr-blur-r5 c0/c1/c2 (đối chứng) | 25 / 39 / 68 ms | — (pred VOID, xem dưới) | — | — |
| chr-stall-r1 c0/c1/c2 (đối chứng) | 376 / 494 / 399 ms | — | — | — |

- **Mô hình đúng ở 3/4 cửa sổ wk không-memo** (Δ −108/−202/−112 ms): blind
  ≈ chờ watchdog kill (~1000 ms sau created) + 1 tick. Trong mọi cửa sổ mù
  wk: state100 tickLenΔ = 0 (không tick blend nào), loopLenΔ = 6–11 (vòng
  lặp vẫn chạy ~5/s), sleeping = 0 — vòng lặp chạy nhưng không blend, đúng
  như W3 mô tả.
- **wk-blur-r5 c1 MISS (Δ −1019 ms) — đã giải thích, phát hiện mới (§2.1).**
- **Clip memo c2: W3 nói ~0,1 s KHÔNG tái hiện ổn định.** r4 blind_obs
  1101 ms nhưng entry nội suy sớm ~600 ms (playhead thực qua 6,0 s ở
  ~11100, không phải 10488 — ph đóng băng 5,933 tới 11006): blind thật
  ~400–500 ms. r5 96 ms nhưng entry không tin cậy (caps c2 chỉ 6 mẫu,
  ring đã = 1 ở mẫu state100 đầu tiên trong cửa sổ). Kết luận: memo bỏ
  được chờ 1000 ms, còn lại độ trễ chuyển clip + 1 tick (~0,1–0,5 s, tệ
  hơn khi element đóng băng).
- **Đối chứng chr:** ring lấp trong 25–494 ms nhờ pump (mô hình kill không
  áp dụng — pred lệch +1000–2700 ms đúng như kỳ vọng, chứng tỏ mô hình
  không sinh false-positive).
- **Hạn chế harness (ghi rõ):** mainDraws/draws cắt ở 400 mẫu cuối trong
  probe → chr-blur-r5 (1342 draws) mất timing đầu lượt: created/pred của
  c0/c1 VOID (created=1811 chỉ là mainDraw còn lại sớm nhất); chỉ obs_fill
  (ringFirstAt, ghi live) còn dùng được. LoopMs gap max 96912 ms ở r4 là
  ngoại lệ đơn lẻ ngoài cửa sổ phát (state100 loopLenΔ cho thấy vòng lặp
  vẫn chạy đều trong các cửa sổ mù) — không dùng gap đó. Loop gaps trong
  cửa sổ phát: r4 med 207 ms p90 311 ms; r5 med 278 ms p90 511 ms max 1881 ms.

### 2.1 Phát hiện mới: element đóng băng chặn watchdog → cửa sổ mù kéo dài

wk-blur-r5 c1 [7484, 9616]: playhead đóng băng ở ph = 3,033 suốt ~1,6 s
(state100 7804→9393), tickLen đóng băng ở 9 (0 tick blend), loopLen vẫn
tăng 36→47, ring = 0 tới tận 9393, video draws vẫn xảy ra theo cặp ~200 ms
(direct, frame 1). **Watchdog fast-path đòi `frameIdx > lastFrameIdx`
(frame phải tiến) mới kill** — frame đóng băng nên pump không bao giờ chết,
đường tick không tiếp quản, ring rỗng suốt thời gian đóng băng. Ring lấp
đúng lúc fbAt = ringFirstAt = 9616 (element tiến lại → kill → tick lấp
ring). **Đề xuất (chưa làm, nợ mở):** watchdog kill theo thời gian cả khi
frame không tiến (element đóng băng thì snapshot tick của frame đóng băng
vẫn đúng — kill lúc đó là an toàn). Tick cưỡng bức tại created+1000
(counterfactual) đã cứu được ~1111 ms ở cửa sổ này (2132 → ~1021 ms).

## 3. Exp A r1 (X5): stall main-thread 1600 ms × 2 clip, Chromium

- Stall c0 @ relPlay 1005–2605, c1 @ 4802–6402 (chặn đồng bộ ở tick đầu
  mỗi clip; watcher rAF bắn muộn ~200 ms sau tick đầu vì rAF thưa dưới tải).
- c0: đúng 1 callback @801 (capture, frame 6) → stall → **kill
  "no-callback", fb@2804 (199 ms sau hết stall)**; dbgFinal caps=1,
  active=false, fb="no-callback". c1: 5 callback 3806–4598 (capture ×3,
  skip ×1, skip-stale-frame ×1) → stall → **kill, fb@6500 (98 ms sau hết
  stall)**; dbgFinal caps=3, clears=1, fb="no-callback". c2: 30 pump event
  (capture 26, skip-stale-frame 4) tới relPlay 10415, active=true, fb="".
- **silentEngine=false, silentSeenAt=None, state100 silent 0/43.**
  Pump gap lớn nhất 3005 ms (801→3806, qua stall c0 + đổi clip) và 2895 ms
  (4598→7493, qua stall c1 + đổi clip). Ticks quanh stall c0 chỉ
  [908, 2699, 2887] (frameIdx 8→60 — playhead nhảy ~1,7 s); quanh stall c1
  [6478, 6578] (tick đầu 76 ms sau hết stall). Tick gaps toàn lượt med
  95 ms, max 1791 ms.
- Cơ chế (đối chiếu code `rvfcKillPump`): kill chỉ đếm vào `rvfcSilentKills`
  khi `rvfcCallbacksSeen === 0`. Callback đầu tiên @801 < stall đầu @1005
  → callbacksSeen ≥ 1 trước mọi kill → **2 kill, 0 lần đếm, không arm**.
  Hồi phục tự động theo clip: c2 có pump mới sống khỏe (không cần cơ chế
  nào khác).

## 4. Exp A2 (X5b): hoãn đăng ký rVFC đầu 1600 ms — đo arm oan

- Thiết kế (probe-only, không sửa production): wrap
  `HTMLVideoElement.prototype.requestVideoFrameCallback` — hoãn đăng ký
  ĐẦU TIÊN của 2 element đầu 1600 ms rồi đăng ký thật (mô phỏng decoder
  chưa có frame trong khi tick vẫn chạy — đúng điều kiện watchdog kill:
  tick chạy, callback vắng). Ngân sách theo element (Set).
- Kết quả chr-delay-r1 (load lúc phát 1,86, yên):
  - c0: pump tạo @ relPlay ~153 → **chết "no-callback" @ fbAt 1215**,
    caps=0, active=false. Lúc kill chưa callback nào bắn trong phiên
    (pump event đầu tiên là seq 0 @1826) → **kills = 1 (suy ra từ code +
    dữ liệu, xem dưới)**. Ring lấp bởi đường tick đúng lúc kill
    (ringFirstAt = fbAt = 1215).
  - Callback bị hoãn bắn @1826 dạng **"skip-inactive"** (frame 49,
    mediaTime 1,633) trên pump đã chết → **`rvfcCallbacksSeen` tăng lên 1
    ngay cả khi pump đã chết** (hàm `rvfcCallback` tăng bộ đếm TRƯỚC khi
    kiểm tra `active`). Từ đây không kill nào còn đếm được nữa.
  - c1: pump sống (first capture @3292, 79 capture, active=true, fb="").
    **Đăng ký của c1 không bị hoãn** — MediaPool tái dùng cùng element
    blob của c0 (element đã nằm trong Set hoãn) → đăng ký đi qua bình
    thường, callback trong ~33 ms ≪ ngưỡng kill 1000 ms. c2 tương tự
    (first capture @6026, 135 capture).
  - delayed[1] (@ relPlay 9853, src http vite) hoá ra là **element của
    probe liveness cuối lượt**, không phải clip — ngân sách 2 element đã
    bắt cả element probe (thiết kế probe chưa sạch, xem §6.6).
  - **silentEngine=false, silentSeenAt=None, state100 silent 0/323.**
    Liveness: fresh element 12 callback trong ~400 ms sau đăng ký,
    ct 0,003→2,006, playing, readyState 4 — **engine sống**.
- Kết luận A2: **KHÔNG arm oan.** Cửa sổ arm oan đòi 2 kill với ZERO
  callback ở giữa — gần như không thể trong thiết kế hiện tại: kill cần
  1000 ms im lặng, callback bắt đầu ~33 ms sau đăng ký trên element tái
  dùng/mới, và cả callback trên pump đã chết (skip-inactive) cũng đếm vào
  `rvfcCallbacksSeen`. Kịch bản còn lại duy nhất là hạn hán callback TOÀN
  CỤC lúc bắt đầu phiên kéo dài qua 2 clip — chưa từng quan sát trong
  17 lượt (W3 10 + X5 5 + X5b 2); các lần arm WebKit đều là arm thật
  (0 callback cả phiên).

## 5. Quyết định: KHÔNG triển khai cơ chế tự hồi memo

Điều kiện đã đặt từ đầu: triển khai (probe pump mỗi clip thứ K khi memo
arm) **chỉ khi Exp A chứng minh arm oan + đo được hồi phục**. Cả hai đều
KHÔNG đạt:

1. **Không chứng minh được arm oan:** Exp A r1: 2 kill, 0 arm. Exp A2:
   1 kill (counter dừng ở 1), 0 arm — và phân tích cho thấy cấu trúc hiện
   tại (ngưỡng 2 kill + guard callbacksSeen + tái dùng element + callback
   ~33 ms vs ngưỡng kill 1000 ms) gần như loại trừ arm oan qua đường
   hoãn callback.
2. **Không cần đo hồi phục vì không có gì để hồi:** hồi phục đã tự động
   theo clip (r1: c2 pump mới 26 capture; A2: c1/c2 pump sống sau khi c0
   chết). Memo chỉ arm khi engine im thật (WebKit: 0 callback cả phiên,
   pump = 0 ở mọi lượt wk) — probe pump lúc đó chỉ chết lại, không hồi
   được gì; không có bằng chứng engine WebKit từng hồi giữa phiên.

**Giữ cơ chế tự hồi ở mức đề xuất + số đo. Không viết code production.**
Nếu đường hạn hán callback toàn cục đầu phiên xuất hiện trong tương lai
(2 kill với 0 callback — chưa từng thấy), lúc đó mới có cơ sở để triển
khai probe-pump. Nợ mở này giữ nguyên trong GAP §4 mục 5 với trạng thái
mới: "đã đo 2 thí nghiệm, đều âm tính".

## 6. Phát hiện phụ: zombie pump (ghi nhận, chưa sửa)

dbgFinal ở mọi lượt Chromium khỏe: c0 lastFrame ≈ 42–44, caps ≈ 130–132
(r5: c0 43/132, c1 44/132, c2 89/86; r6: c0 42/130, c1 43/129, c2 89/80;
r4 thưa: c0 20/15, c1 22/15). Giải thích: pump của clip cũ sống thêm tới
ngưỡng stale 1500 ms sau khi clip đổi (lastWantedMs), trong lúc đó nó
capture frame của clip KẾ vào ring của clip cũ (90 capture của clip mình
+ ~40 capture zombie ≈ 130; frame cuối ~42–44 ≈ 1,5 s × 30 fps). Ring
chết không được vẽ nữa nên không ảnh hưởng pixel; nhưng số liệu capture
theo clip (caps, lastFrame) bị phồng ~40%. Đề xuất hygiene cho đợt sau:
kill pump ngay khi clip đổi thay vì chờ stale 1500 ms (hoặc ít nhất không
đếm capture zombie vào thống kê theo clip). Không sửa trong luồng này
(ngoài phạm vi + không ảnh hưởng đo chính: pump event theo relPlay vẫn
đúng, chỉ attribution theo clipId qua dbgFinal là sai).

## 7. Nợ mở cho đợt sau

1. **D đã định danh nhưng tần suất fix-3 mới đo 1 lượt** (n=2, chỉ ở đầu
   clip): cần thêm lượt chr-blur fix-3 + wk-blur để chốt tần suất D khi
   ring đầy và trên WebKit.
2. **Watchdog đóng băng (§2.1):** kill theo thời gian cả khi frame không
   tiến (element đóng băng) — thiết kế + đo; tick cưỡng bức counterfactual
   cứu ~1111 ms ở wk-blur-r5 c1.
3. **Memo c2 blind thật ~0,4–0,5 s** khi chuyển clip chậm (không phải
   ~0,1 s như W3): cần thêm lượt wk-blur với caps dày hơn để chốt phân
   phối (entry nội suy hiện sai ~±600 ms khi playhead đóng băng).
4. **B-band wk n=5:** cần thêm lượt wk-blur để tách pair/double-count
   trên WebKit (trình chiếu thưa: snapshot cách nhau ~18 khung ≈ bội
   chu kỳ sọc → gần như direct, C cao 38–50%).
5. **Harness:** mainDraws/draws cắt 400 mẫu cuối (mất timing đầu lượt
   dày — chr-blur-r5 c0/c1 pred VOID); tăng cap hoặc ghi tóm tắt timing
   live như ringFirstAt. cap.t lệch relPlay tới ~74 ms dưới tải.
6. **Liveness probe A2 bị delay-hook bắt** (ngân sách 2 element): lần sau
   miễn element liveness khỏi hook hoặc tăng ngân sách; bằng chứng liveness
   (12 callback) vẫn đứng.
7. **DFT/pha trên cap 96×54 không dùng được** (moiré, §1.5) — đừng dùng
   lại để định danh cửa sổ; dùng gstd + mô hình harmonic.
8. Zombie pump (§6): kill ngay khi clip đổi hoặc loại capture zombie khỏi
   thống kê theo clip.

## 8. Kiểm chứng + batch đã stage (KHÔNG push)

- 7 lượt, `mtimeChanged=false` tất cả, 0 pageErr, 0 collision. Ticks:
  r4 48, r5 485, stall 50, r6 434, delay 414 (chr); wk 38/30.
- Không sửa production → không chạy tsc/build/test suite cho luồng này
  (không có code để kiểm chứng ngoài probe: `node --check` OK cả 2 file
  probe; build dùng cho X5b đã được X2 kiểm chứng tsc 0 + build PASS +
  O8 21/21).
- 2 sự cố X5 đã ghi trong `round96-x5.md`: bug probe `STALL_MS` lọt vào
  object page (2 lượt đầu mất dữ liệu, đã sửa + chạy lại); suýt tự kill
  shell bằng `pkill -f` trùng pattern (driver sống sót, đã dọn Xvfb :197
  mồ côi). X5b không gặp sự cố mới (1 lần redirect log lỗi do thư mục
  chưa tồn tại — đã tạo thư mục rồi chạy lại, driver chạy đủ 2 lượt).
- Batch stage: `phase9-round96-x5-webkit-blur.txt` — 3 entry, read-back
  OK, 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND96_X5_WEBKIT_BLUR_LIMITS.md` (file này)
  - `apps/web/scripts/probe96x5-frame-parity.mjs` (X5, chưa từng stage)
  - `apps/web/scripts/probe96x5b-frame-parity.mjs` (X5b mới)

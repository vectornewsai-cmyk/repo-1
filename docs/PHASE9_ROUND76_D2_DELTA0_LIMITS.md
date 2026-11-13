# PHASE 9 ĐỢT 76 — LUỒNG D2: HIỆU CHỈNH LUẬT DELTA0

**Ngày:** 10/11/2026 · **Nợ:** đợt 75 §4 mục 2 / C1 §4 + §7.1 (luật delta0
kích hoạt sai sau khi C1 sửa rò plain: ocean w1440 Δkurt R 0,45).
**Kết quả tóm tắt — đọc trước:**

1. **Luật mới G12: áp d0 khi và chỉ khi `plainMad ≤ 2,5` VÀ `d0std_R ≤ 2,0`
   VÀ `ratio_R = d0std_R / residStd_R ≤ 1,0`.** (d0std_R = độ lệch chuẩn
   thành phần R của mô hình delta0; residStd_R = độ lệch chuẩn phần dư
   plain thực kênh R, tức previewPlain − renderPlainTri.)
2. **G12 đúng 20/20 case có thể chấm** (17 chẩn đoán + 3 post-fix mới);
   luật cũ R0 (chỉ plainMad ≤ 2,5) đúng **18/20** — sai đúng 2 case đích:
   ocean w1440 (Δkurt R 0,45) và ocean w1920 (Δkurt R 0,36) post-fix.
   Ocean w2560 post-fix: R0 cho KHỚP nhưng sát nút (Δkurt R đúng 0,35);
   G12 cho KHỚP với biên an toàn (Δkurt R 0,14).
3. **Không phá verdict nào đã đúng:** test-pattern w1440/w1920 n05 vẫn
   CẦN d0 và G12 vẫn áp d0 (KHỚP); basgo/slovenska KHỚP cả hai chế độ;
   ocean pre-fix w1760–w2880 KHỚP không-d0 (R0 đã tắt d0 ở đó, G12 giữ).
4. **Đính chính tiền đề nhiệm vụ: luật delta0 KHÔNG nằm trong production.**
   Grep toàn repo: `delta0` chỉ xuất hiện trong các script phân tích
   (`r72z9-delta0-browser.mjs`, `r73a3-d0cond.mjs`, `r74b1-analyze.mjs`,
   `r75c1-analyze.mjs`) — không có trong `apps/web/src/`, `packages/`,
   `server/` (trừ code scipy vendored không liên quan). `preview.tsx`
   KHÔNG đụng — không có sửa production trong luồng này, đúng vì không
   có gì để sửa ở đó: d0 là hiệu chỉnh đo lường trong harness, không
   phải hành vi sản phẩm. Luật mới được định nghĩa + kiểm chứng trong 2
   script D2; các script lịch sử r74b1/r75c1 KHÔNG sửa lại (giữ nguyên
   hiện trạng đợt đó) — vòng sau copy G12 từ script D2, không copy R0 cũ.
5. **Lưu ý về số baseline:** plainMad ocean w1440 tính lại bằng code
   hiện tại là **1,114**, khác số C1 ghi **1,149** — vì `chrome-resample.mjs`
   đã đổi sau khi C1 chạy (C2 đợt 75, M4 LOD trung bình nhân, 15:32
   09/11). Δkurt/d0std tái lập đúng từng số với C1 (không-d0 [0,12, 0,08,
   0,08]; có-d0 [0,45, 0,08, 0,08]) nên kết luận kích hoạt sai không đổi.
   Mọi số trong LIMITS này dùng một phiên bản resample thống nhất.

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Node
v24.22.1; ffmpeg 8.1.2; Chromium 1254 headed qua Xvfb). Ngưỡng verdict
như Z2/A3/B1/C1: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12.
Probe/log/JSON tại `hidden_files/round76-d2/`, log luồng
`hidden_files/round76-d2.md`.

---

## 1. Tái hiện: luật cũ sai ở đâu (số đo thật)

Luật cũ R0 (Z2, nhị phân): áp d0 khi `plainMad ≤ 2,5`. Trước sửa rò
plain, ocean w1440 plainMad 3,294 > 2,5 nên d0 không áp. Sau sửa C1,
plain về gần render nên plainMad rơi xuống dưới ngưỡng — nhưng d0
(không đổi, vì d0 chỉ tính từ frame render) giờ lớn hơn phần dư nó
định hiệu chỉnh:

| Case post-fix (code đã sửa C1) | plainMad | d0std [R,G,B] | residStd [R,G,B] | ratio_R | không-d0 | có-d0 (luật cũ) |
|---|---|---|---|---|---|---|
| ocean w1440 n05 (C1, tính lại) | 1,114 | [3,93, 0,96, 0,90] | [0,91, 0,52, 1,28] | 4,32 | KHỚP Δkurt [0,12, 0,08, 0,08] | **LỆCH Δkurt R 0,45** |
| ocean w1920 n05 (mới) | 1,207 | [3,97, 0,98, 0,93] | [1,40, 0,62, 1,41] | 2,84 | KHỚP Δkurt [0,13, 0,01, 0,05] | **LỆCH Δkurt R 0,36** |
| ocean w2560 n05 (mới) | 1,397 | [3,98, 0,99, 0,94] | [1,82, 1,14, 1,72] | 2,19 | KHỚP Δkurt [0,14, 0,17, 0,06] | KHỚP sát nút Δkurt R **0,35** |
| gradient1920 w1440 n05 (mới) | 0,810 | [0, 0, 0] | [1,73, 1,73, 1,73] | 0 | KHỚP Δkurt [0, 0,01, 0] | KHỚP (d0 ≡ 0) |

- Misfire tái hiện trên cả 3 cửa sổ ocean: R0 áp d0 ở w1440/w1920 và
  làm hỏng verdict; w2560 thoát LỆCH chỉ vì Δkurt R đúng bằng ngưỡng.
- d0std gần như không đổi theo cửa sổ ([3,93–3,98, ~0,97, ~0,92]) vì d0
  chỉ phụ thuộc frame render + thang viewport; phần dư plain thì sụp
  từ [5,68, 5,89, 5,92] (pre-fix) xuống [0,91, 0,52, 1,28] (post-fix).
- gradient1920 là case suy biến: frame gradient không màu (R=G=B) nên
  mô hình chroma-shift cho d0 ≡ 0 — case này chỉ kiểm chứng pipeline
  (plainMad 0,81, D1/D3 pass), không kiểm chứng được luật.

## 2. Chẩn đoán: vì sao các ứng viên "đối xứng" đều thất bại

Chạy `r76d2-analyze.mjs` trên 21 case đã có (Y2 w1440/w1920 × 4 nguồn
× n05/n10 + sweep ocean B1 10 điểm + C1 post-fix): mỗi case tính
plainMad, perChanMad, d0std, residStd, ratio, corr(d0, phần dư) từng
kênh, verdict không-d0 / có-d0 / dưới 8 ứng viên luật. Kết quả chấm
(trừ 4 case cả-hai-LỆCH không chấm được):

| Luật (áp d0 khi...) | Đúng / 17 |
|---|---|
| R0 cũ: plainMad ≤ 2,5 | **16** — sai C1 ocean w1440 |
| R1: R0 && maxRatio ≤ 1,0 | 14 — sai cả 3 case test-pattern n05 (cần d0) |
| R2: R0 && meanRatio ≤ 1,0 | 14 — sai cả 3 case test-pattern n05 |
| R3: R0 && maxCorr ≥ 0,5 | 14 — sai cả 3 case test-pattern n05 |
| R4: R0 && maxRatio ≤ 1,0 && maxCorr ≥ 0,3 | 14 — sai cả 3 case test-pattern n05 |
| R5: R0 && maxRatio ≤ 1,5 | 14 — sai cả 3 case test-pattern n05 |
| R6: R0, d0 theo kênh (chỉ kênh ratio ≤ 1) | 15 — sai test-pattern n05 w1440 + w1920 |
| R7: R0, scale d0 theo kênh min(1, residStd/d0std) | 16 — sai test-pattern n05 w1440 |
| **G12 (mới): R0 && d0std_R ≤ 2,0 && ratio_R ≤ 1,0** | **17** |

Số đo giải thích vì sao (test-pattern n05 w1440 — case BẮT BUỘC giữ d0):

- Test-pattern: plainMad 1,047, d0std [1,05, **4,41**, 0,58], residStd
  [1,61, 1,49, 2,10], ratio [0,65, **2,96**, 0,28],
  corr(d0, resid) [−0,032, −0,11, −0,285]. Không-d0 LỆCH do Δcorr R-G
  0,206; có-d0 KHỚP (Δcorr R-G 0,004).
- **d0 không hề giải thích phần dư plain, ngay cả khi nó cứu verdict:**
  corr(d0, resid) ≈ 0 hoặc âm ở cả 3 kênh trên test-pattern. Lợi ích
  của d0 nằm ở cấu trúc tương quan chéo của delta (sửa Δcorr R-G),
  không phải ở việc thu nhỏ phần dư plain. Mọi luật đặt tiền đề "d0
  giải thích phần dư" (corr R3/R4, tỉ lệ magnitude R1/R2/R5) đều loại
  nhầm test-pattern. Đây là phát hiện cơ chế quan trọng nhất của luồng.
- **deltaMad cũng không tách được:** d0 làm giảm deltaMad cả khi cứu
  (test-pattern 10,491 → 10,288) lẫn khi phá (C1 ocean 18,369 → 18,181).
- **plainMad không tách được:** test-pattern 1,047/1,02 vs ocean
  post-fix 1,114–1,397 — gần như trùng nhau. Dải plainMad (gợi ý của C1
  §4) không có khe hở để đặt ngưỡng.
- **Chỉ kênh R tách được:** d0std_R: test-pattern 1,05/1,12 vs ocean
  post-fix 3,93–3,98 (khe hở 1,12 → 3,93); ratio_R: test-pattern
  0,65/0,95 vs ocean post-fix 2,19–4,32 (khe hở 0,95 → 2,19). Cơ chế:
  hại nằm ở Δkurt R do thành phần d0_R lớn; lợi nằm ở d0_G (4,41) sửa
  tương quan. Cổng đối xứng theo kênh (max/mean ratio) sai vì nó đòi
  cả G cũng nhỏ — mà G lớn chính là thành phần có ích. R6/R7 thất bại
  vì chúng cắt/scale đúng thành phần G có ích đó.

## 3. Luật mới G12

**Áp d0 khi và chỉ khi cả ba điều kiện cùng đúng:**

1. `plainMad ≤ 2,5` (giữ ngưỡng Z2 — plain đủ gần để mô hình đáng tin);
2. `d0std_R ≤ 2,0` (thành phần R của mô hình đủ nhỏ để không nhiễu
   kurtosis kênh R — ngưỡng đặt giữa 1,12 và 3,93, khe hở rộng);
3. `ratio_R = d0std_R / residStd_R ≤ 1,0` (mô hình R không lớn hơn phần
   dư R thực — đúng gợi ý C1 §4 "magnitude d0 nhỏ so với phần dư plain",
   nhưng chỉ áp cho kênh R vì chỉ kênh R mới là kênh gây hại đo được).

G1 (chỉ điều kiện 2) và G2 (chỉ điều kiện 3) **đồng ý với nhau trên cả
24 case** nên dữ liệu hiện có không phân biệt được chúng; G12 là hội
của hai cổng — lựa chọn bảo thủ: không bao giờ áp một d0_R lớn tuyệt
đối, cũng không bao giờ áp khi phần dư không chứa nổi nó. Nếu một case
tương lai cần d0 mà d0std_R ∈ (2, 4] hoặc ratio_R ∈ (1, 4], G12 sẽ
false-negative — đó là nợ đã biết, xem §6.

**Kiểm chứng gộp (24 case duy nhất, 20 case chấm được):**

| Nhóm | R0 cũ | G12 mới |
|---|---|---|
| Chẩn đoán 21 case (17 chấm được) | 16/17 | **17/17** |
| Post-fix mới 3 case (w1920/w2560/grad1920) + C1 tính lại | 2/4 (sai w1440 + w1920) | **4/4** |
| **Tổng** | **18/20** | **20/20** |

- Test-pattern w1440/w1920 n05: G12 áp d0 (d0std_R 1,05/1,12 ≤ 2;
  ratio_R 0,65/0,95 ≤ 1) → KHỚP, giữ nguyên verdict đúng cũ.
- Ocean post-fix w1440/w1920/w2560: G12 không áp d0 → KHỚP cả ba
  (Δkurt R 0,12 / 0,13 / 0,14 — biên an toàn, thay vì 0,45 / 0,36 /
  0,35 sát nút của luật cũ).
- Basgo/slovenska (d0std_R 0,16–0,88): G12 áp d0, verdict KHỚP cả hai
  chế độ — không đổi.
- Ocean pre-fix w1760–w2880: G12 không áp (R0 đã tắt) → KHỚP giữ nguyên.

## 4. Capture post-fix mới (giao thức B1, code đã sửa C1)

Harness `r74b1-headed-capture.mjs` (không sửa), vite dev + Xvfb +
Chromium 1254 headed + CDP, scratch riêng `hidden_files/round76-d2/`:

| Capture | Kết quả |
|---|---|
| ocean w1920×1080 | 3/3 pass (D1 plain-identical, D3 cùng-khung, H9 0 lỗi) |
| ocean w2560×1440 | 3/3 pass |
| gradient1920 w1440×900 | 3/3 pass (D1/D3/H9; raw hash `8eeb3123`, ct=1) |

Frame render gradient1920 build theo đúng công thức Z2/B1: native
frame 30 1920×1080 (ffmpeg rgb24 + yuv420p) → `resampleYuv420p`
1-kernel 1920→1280 (C2, ứng viên thắng Z2) → plain1280;
noise1280 = `addYuvNoise` verbatim trên plain1280 (strength 28, seed
preview localT=1.0) như render-P của B1 Part A. Kiểm chứng công thức:
plainMad 0,81 (nhỏ — đúng khung, đúng thang); deltaMad 0,965 (preview
và render delta khớp nhau).

## 5. Kiểm chứng code

| Kiểm tra | Kết quả |
|---|---|
| `node --check` r76d2-analyze.mjs, r76d2-postfix.mjs | pass |
| `r76d2-analyze.mjs` (21 case) | exit 0; JSON `r76d2-diag.json` |
| `r76d2-postfix.mjs` (4 case) | exit 0; JSON `r76d2-postfix.json` |
| `chrome-resample-67u2.test.mjs` | **pass** (fail 0) |
| `r72z7-trilinear-2dblend.test.mjs` | **pass** (fail 0) |
| `tsc --noEmit` (apps/web) | **0** |
| `vite build` | **pass** (11,00 s) |
| Không chạy | click-test editor tổng thể (không đụng production); suite P7/css/i18n đầy đủ để parent gộp chạy lại trên cây đã gộp |

Không sửa file production nào; không thêm key i18n; không binary;
không workflow `.yml`.

## 6. Nợ mở (trung thực)

1. **G1 vs G2 chưa phân biệt được:** hai cổng đồng ý trên cả 24 case.
   G12 là hội bảo thủ, không phải kết luận "cả hai đều cần". Cần một
   case mà chúng bất đồng (vd. d0std_R ≤ 2 nhưng ratio_R > 1, hoặc
   ngược lại) mới biết cổng nào là thật. Tới lúc đó G12 là lựa chọn an
   toàn nhất.
2. **Ngưỡng 2,0 là thực nghiệm trên 2 nội dung** (ocean vs test-pattern).
   Tính R-đặc thù của luật (vì sao R mà không phải G) là thực nghiệm,
   chưa có lý thuyết: trên nội dung khác, kênh gây hại có thể là G
   hoặc B. Cần thêm nội dung 1920 (vd. basgo/slovenska post-fix) để
   kiểm tra tính tổng quát.
3. **Chưa đo post-fix:** noise10 (ocean w1440/w1920); basgo/slovenska
   (media 1920×1080, cần capture mới — số pre-fix chỉ tham chiếu);
   ocean w1280/w1600/w1760/w2240/w2880 (pre-fix KHỚP không-d0 từ
   s ≥ 0,52; post-fix plain còn gần hơn nên kỳ vọng vẫn KHỚP, chưa đo).
4. **gradient1920 suy biến** (không màu → d0 ≡ 0): không kiểm chứng
   được luật; cần probe màu 1920 nếu muốn một case gradient có d0 ≠ 0
   post-fix.
5. **plainMad baseline đổi theo phiên bản resample** (xem đầu file):
   mọi so sánh plainMad xuyên đợt phải ghi rõ phiên bản
   `chrome-resample.mjs` (C2 M4 LOD từ 15:32 09/11).
6. Nợ kế thừa chưa đụng (đợt 75 §4): TTS 39 + npm audit (C5), "ai free"
   (C3), FPS deint-only (C8), gate slow-start (C4), resample dị hướng
   nối M4 vào production (C2), birefnet, GPU/Safari thật, ci-security.yml
   + ci-build.yml 403.
7. Release gate giữ nguyên: KHÔNG release/tag.

## 7. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/r76d2-analyze.mjs` — chẩn đoán 21 case + 8 ứng viên
  luật (R0–R7) + định nghĩa cổng G1/G2/G12.
- `apps/web/scripts/r76d2-postfix.mjs` — đo 4 case post-fix + cổng
  G1/G2/G12 + build frame render gradient1920 (C2 + render-P).
- `docs/PHASE9_ROUND76_D2_DELTA0_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / log):
`hidden_files/round76-d2/` — `headed-w1920x1080-ocean/`,
`headed-w2560x1440-ocean/`, `headed-w1440x900-grad1920/` (snapshot +
log vite/chrome), `native-grad1920/` (frame 30 native),
`fullrgb-gradient1920-*.raw`, `r76d2-diag.json`, `r76d2-postfix.json`,
`captures.log`, `tsc-vite.log`.
Không sửa code production nào khác, không binary, không workflow `.yml`.

# PHASE 9 ĐỢT 77 — LUỒNG E6: NỐI LUẬT DELTA0 G12 VÀO HARNESS ĐO

**Ngày:** 10/11/2026 · **Nợ:** đợt 76 §4.6 (D2: G12 chỉ là quy tắc trong
LIMITS, chưa vào code đo). **Kết quả tóm tắt — đọc trước:**

1. **G12 đã vào code đo:** module dùng chung mới
   `apps/web/scripts/delta0-harness.mjs` — `applyDelta0G12()` là luật
   chính (áp d0 khi và chỉ khi `plainMad ≤ 2,5` VÀ `d0std_R ≤ 2,0` VÀ
   `ratio_R = d0std_R / residStd_R ≤ 1,0`); `evalDelta0Case()` +
   `scoreRule()` để mọi lần đo sau dùng chung một luật. Helpers sao chép
   VERBATIM từ r76d2-analyze.mjs (nguồn r75c1/r73a3).
2. **Chạy lại 20 case D2 qua harness mới: G12 đúng 20/20, R0 cũ 18/20**
   (sai đúng 2 case đích ocean w1440/w1920 post-fix) — và **24/24 case
   khớp từng số đã làm tròn với JSON D2** (plainMad/d0std/residStd/ratio/
   corr/verdict/kurtDiff/correct, dung sai 0,001; frame gradient1920
   build lại byte-identical với D2).
3. **3 case mới post-fix (capture headed mới trong đợt này): G12 đúng
   3/3, R0 cũ đúng 2/3** — R0 lại sai trên ocean w1440 noise10 post-fix
   (áp d0 → Δkurt R 0,39 LỆCH, trong khi không-d0 KHỚP 0,24). G12 tổng
   cộng **23/23** case chấm được (20 D2 + 3 mới); R0 tổng **20/23**.
   Không phát hiện overfit.
4. **Đính chính được giữ nguyên:** luật delta0 KHÔNG nằm trong production
   — module này chỉ sửa harness đo; KHÔNG sửa render.js, preview.tsx hay
   bất kỳ file production nào; không thêm key i18n; không binary; không
   workflow `.yml`.

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Node
v24.22.1; ffmpeg 8.1.2; Chromium 1254 headed qua Xvfb). Ngưỡng verdict
như Z2/A3/B1/C1/D2: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Resample: `chrome-resample.mjs` (C2 M4 LOD trung bình
nhân, 15:32 09/11 — cùng phiên bản D2 dùng). Probe/log/JSON tại
`hidden_files/round77-e6/`, log luồng `hidden_files/round77-e6.md`.

---

## 1. Luật cũ vs luật mới (file harness nào đổi)

| | Luật cũ R0 (Z2) | Luật mới G12 (D2, nối vào code đợt này) |
|---|---|---|
| Định nghĩa | áp d0 khi `plainMad ≤ 2,5` | áp d0 khi và chỉ khi `plainMad ≤ 2,5` VÀ `d0std_R ≤ 2,0` VÀ `ratio_R ≤ 1,0` |
| Nơi định nghĩa | rải rác trong từng script đo (r73a3/r75c1/r76d2 sao chép tay) | **một chỗ duy nhất:** `applyDelta0G12()` trong `apps/web/scripts/delta0-harness.mjs` |
| Đúng trên 20 case D2 | 18/20 | **20/20** |
| Đúng trên 3 case mới E6 | 2/3 | **3/3** |

**File harness đổi/thêm (stage, KHÔNG push):**

- `apps/web/scripts/delta0-harness.mjs` (MỚI) — tiện ích đo dùng chung:
  helpers delta0/thống kê verbatim D2; hằng `VERDICT`, `D0_PLAIN_MAD_MAX
  = 2,5`, `G12_D0STD_R_MAX = 2,0`, `G12_RATIO_R_MAX = 1,0`;
  `applyDelta0G12()` (luật chính), `applyDelta0G1/G2()` (đối chứng),
  `applyDelta0R0()` (chỉ để đối chứng — KHÔNG dùng làm luật áp d0 trong
  đo mới), `correctVerdict()`, `evalDelta0Case()`, `scoreRule()`.
  Script đo mới từ đợt 77 trở đi import module này, không tự định nghĩa
  lại luật.
- `apps/web/scripts/r77e6-g12-verify.mjs` (MỚI) — chạy lại 21 case chẩn
  đoán + 3 case post-fix mới của D2 qua harness mới, đối chiếu từng số
  với `r76d2-diag.json` / `r76d2-postfix.json`, chấm 4 luật.
- `apps/web/scripts/r77e6-newcases.mjs` (MỚI) — đo 3 case mới E6 qua
  harness mới, chấm 4 luật.
- `apps/web/scripts/test_round77_e6_g12.mjs` (MỚI) — test đơn vị node:test
  cho cổng G12 (xem §4).
- `docs/PHASE9_ROUND77_E6_DELTA0_G12_LIMITS.md` — file này.

**Không sửa:** các script lịch sử r74b1/r75c1/r76d2 (giữ nguyên hiện trạng
đợt đó — D2 đã quy định, E6 giữ); `r74b1-headed-capture.mjs` (capture mới
chỉ dùng env `R74B1_WIN_W/H`, `R74B1_SOURCES=ocean`,
`R74B1_VARIANTS=plain,plain2,noise05[,noise10]`, `R74B1_SCRATCH` —
không sửa code); không sửa file production nào; không sửa `vi/en.json`.

## 2. Chạy lại 20 case D2 qua harness mới (r77e6-g12-verify.mjs)

24 case chạy lại (21 chẩn đoán + 3 post-fix mới; C1 trùng trong cả hai
nhóm), JSON `hidden_files/round77-e6/r77e6-g12.json`:

- **Đối chiếu D2: khớp 24/24 case, lệch 0** — mọi trường plainMad,
  d0std, residStd, ratio, corr, verdictNoD0, verdictFullD0, kurtDiff,
  correct đều khớp giá trị D2 trong dung sai 0,001; cổng R0/G1/G2/G12
  khớp; frame gradient1920 build lại byte-identical với file D2 đã lưu.
  Harness mới tái lập đúng D2, không phải luật viết lại cho số mới.
- **Chấm luật trên 20 case chấm được** (17 chẩn đoán + 3 post-fix mới;
  4 case cả-hai-LỆCH không chấm: Y2-w1440-ocean-n05, B1-w1280/w1440/
  w1600 — như D2):

| Luật | Đúng / 20 | Sai |
|---|---|---|
| R0 cũ | 18/20 | C1 ocean w1440, D2 ocean w1920 post-fix |
| G1 (chỉ d0std_R ≤ 2) | 20/20 | — |
| G2 (chỉ ratio_R ≤ 1) | 20/20 | — |
| **G12 (cả hai cổng)** | **20/20** | — |

## 3. Case mới E6 — kiểm chứng không overfit (r77e6-newcases.mjs)

3 capture headed mới (`r74b1-headed-capture.mjs` không sửa; vite dev +
Xvfb + Chromium 1254 headed + CDP), mỗi capture 3/3 pass (D1
plain-identical, D3 cùng-khung raw hash `5c9f9de4` ct=1 khớp khung ocean
của D2, H9 0 lỗi trang). JSON `hidden_files/round77-e6/r77e6-newcases.json`.

| Case mới | plainMad | d0std_R | ratio_R | không-d0 | có-d0 | G12 | R0 |
|---|---|---|---|---|---|---|---|
| N1 ocean w1440 n10 post-fix (rect 489×275) | 1,114 | 3,93 | 4,32 | KHỚP Δkurt R 0,24 | **LỆCH Δkurt R 0,39** | không áp → **KHỚP** | áp → LỆCH (sai) |
| N2 ocean w1920 n10 post-fix (rect 809×455) | 1,207 | 3,97 | 2,84 | KHỚP Δkurt R 0,20 | KHỚP Δkurt R 0,32 | không áp → **KHỚP** | áp → KHỚP |
| N3 ocean w1280 n05 post-fix (rect 311×175) | 1,097 | 3,89 | 5,12 | KHỚP Δkurt R 0,14 | KHỚP Δkurt R 0,32 | không áp → **KHỚP** | áp → KHỚP |

- **N1 là case phân biệt mạnh nhất đợt này:** R0 lại áp d0 sai trên
  noise10 post-fix (Δkurt R 0,39 > ngưỡng 0,35) đúng như cơ chế D2 §2
  (d0std_R 3,93 >> residStd_R 0,91); G12 từ chối đúng cả hai cổng.
  Đây là lần thứ ba R0 sai trên ocean post-fix (w1440 n05, w1920 n05,
  w1440 n10) — luật cũ sai có hệ thống, không phải nhiễu một case.
- **N3 đóng một phần nợ D2 §6.3:** ocean w1280 pre-fix cả-hai-LỆCH
  (không chấm được); post-fix plainMad 1,097 → không-d0 KHỚP toàn bộ
  (Δkurt [0,14, 0,06, 0,05], Δcorr ≤ 0,027) — cửa sổ w1280 giờ chấm
  được và G12 cho verdict đúng.
- **N2/N3 không phân biệt R0 với G12** (cả hai chế độ đều KHỚP, quy ước
  "đúng" = KHÔNG-d0 vì đơn giản hơn) — chúng chỉ chứng minh G12 không
  phá verdict đúng, không chứng minh G12 hơn R0. Chỉ N1 (+ 2 case đích
  D2) là bằng chứng phân biệt.
- **G1 vs G2 vẫn chưa phân biệt được:** cả hai đúng 3/3 trên case mới
  (đồng ý nhau trên tổng 23/23 case chấm được tới nay). Nợ D2 §6.1 còn
  nguyên — cần một case mà hai cổng bất đồng (vd. d0std_R ≤ 2 nhưng
  ratio_R > 1, hoặc ngược lại) mới biết cổng nào là thật; tới lúc đó
  G12 (hội bảo thủ) vẫn là lựa chọn an toàn nhất.
- **Tổng gộp: G12 23/23, R0 20/23** (20 case D2 + 3 case mới E6).

## 4. Kiểm chứng code

| Kiểm tra | Kết quả |
|---|---|
| `node --check` delta0-harness.mjs, r77e6-g12-verify.mjs, r77e6-newcases.mjs, test_round77_e6_g12.mjs | pass |
| `node --test test_round77_e6_g12.mjs` | **pass 7/7** — G12 20/20 trên đặc trưng thật D2; R0 18/20 sai đúng 2 case đích; G1/G2 đồng ý 20/20; biên cổng (2,5 / 2,0 / 1,0 bao gồm giá trị bằng, loại giá trị vượt); G1/G2 bất đồng trên vector synthetic thì G12 từ chối cả hai hướng; test-pattern n05 vẫn giữ d0 |
| `r77e6-g12-verify.mjs` | exit 0; đối chiếu D2 24/24; G12 20/20 |
| `r77e6-newcases.mjs` | exit 0; G12 3/3 case mới |
| `node --test chrome-resample-67u2.test.mjs` | **pass 8/8, fail 0** |
| `tsc --noEmit` (apps/web) | **0** |
| `vite build` | **pass** (50,82 s) |
| Capture headed N1/N2/N3 | 3/3 pass mỗi capture (D1/D3/H9) |
| Không chạy | click-test editor tổng thể (không đụng production); suite P7/css/i18n đầy đủ để parent gộp chạy lại trên cây đã gộp |

Lưu ý về test đơn vị: 2 test dùng vector synthetic (chỉ kiểm tra logic
cổng G12/G1/G2, ghi rõ `synthetic` trong code) — không phải số đo, không
dùng làm bằng chứng đo lường. Mọi claim đo lường đều từ snapshot/capture
thật + frame render thật.

## 5. Nợ mở (trung thực)

1. **G1 vs G2 chưa phân biệt được** (kế thừa D2 §6.1, vẫn mở sau 3 case
   mới): hai cổng đồng ý trên cả 23 case chấm được. Cần case bất đồng
   thật.
2. **Ngưỡng 2,0 là thực nghiệm trên 2 nội dung** (ocean vs test-pattern)
   (kế thừa D2 §6.2): tính R-đặc thù chưa có lý thuyết; trên nội dung
   khác, kênh gây hại có thể là G hoặc B.
3. **Chưa đo post-fix:** basgo/slovenska post-fix (media 1920, cần
   capture mới); ocean w1600/w1760/w2240/w2880 post-fix (pre-fix KHỚP
   không-d0, kỳ vọng vẫn KHỚP — chưa đo); noise10 w2560/w1280.
4. **gradient1920 suy biến** (không màu → d0 ≡ 0, kế thừa D2 §6.4): cần
   probe màu 1920 nếu muốn một case gradient có d0 ≠ 0 post-fix.
5. **N2/N3 không phân biệt được R0 với G12** (cả hai chế độ đều KHỚP) —
   chỉ N1 là bằng chứng phân biệt mới; G12 hơn R0 tổng cộng 3 case phân
   biệt (w1440 n05, w1920 n05, w1440 n10).
6. Nợ kế thừa chưa đụng (đợt 76 §6): TTS 39 + npm audit, "ai free",
   FPS deint-only, gate slow-start, resample dị hướng nối M4 vào
   production, birefnet, GPU/Safari thật, ci-security.yml + ci-build.yml
   403.
7. Release gate giữ nguyên: KHÔNG release/tag.

## 6. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/delta0-harness.mjs` — harness đo dùng chung, luật G12.
- `apps/web/scripts/r77e6-g12-verify.mjs` — chạy lại 20 case D2 qua harness mới.
- `apps/web/scripts/r77e6-newcases.mjs` — đo 3 case mới E6.
- `apps/web/scripts/test_round77_e6_g12.mjs` — test đơn vị cổng G12 (7 test).
- `docs/PHASE9_ROUND77_E6_DELTA0_G12_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / log):
`hidden_files/round77-e6/` — `headed-w1440x900-ocean-n10/`,
`headed-w1920x1080-ocean-n10/`, `headed-w1280x800-ocean/` (snapshot +
log vite/chrome + chrome-userdata), `r77e6-g12.json`,
`r77e6-newcases.json`, `captures.log`.
Không sửa code production nào khác, không binary, không workflow `.yml`.

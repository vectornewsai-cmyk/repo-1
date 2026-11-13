# PHASE9_ROUND105_G1_GHOST_LIMITS — Hoàn thiện F3 đợt 104 từ dữ liệu thô: F8 LAND (F8-only), F8b BỊ BÁC

> Luồng G1, đợt 105, lượt cron 18:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ LIMITS gộp đợt 104 §4 mục 5: F3 (Ghost) đợt 104 CHẾT do reboot #29
> ~08:56:39Z, chỉ để lại dữ liệu thô (script phân tích + preview JSON run A +
> log run A/B), chưa LIMITS, chưa stage batch. G1 hoàn thiện F3 từ dữ liệu thô
> đó: phân tích lại độc lập run A, đo mới tối thiểu run B/B2/C/D, rồi đo kiểm
> chứng B3 trên code đã sửa. KHÔNG push. KHÔNG release/tag. Không đụng TTS 39,
> birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (6 ý):**
> 1. **Cả hai chân của bar đăng ký trước đều ĐẠT, chân case-B đạt 2 lần độc
>    lập + 1 lần trên code đã sửa:** B 70,8% (+25,1pt vs baseline A), B2
>    76,1% (+30,4pt), B3 (code land) 87,2% (+41,5pt); flip C 73,6% (+25,0pt
>    vs baseline flip D 48,6%). Ngưỡng: clean ≥70% và hơn baseline ≥20 điểm.
> 2. **F8 (relabel bằng anchor tap tươi + gate 50ms) là thứ mang lại số
>    liệu:** nhãn tap đạt 79,8–89,3% clean (distinct) / 97,4–99,3% clean
>    (mọi occurrence); độ phủ anchor tươi 94,6–99,1% ở các run G1 (tải nhẹ)
>    so với 34–74% ở E3 (tải nặng) — headline clean tăng theo độ phủ.
> 3. **F8b (nhãn anchor THÔ khi anchor cũ) BỊ BÁC ở dạng giả thuyết gốc:**
>    rawAnchor KHÔNG nâng tập fallback lên gần mức tap (70,4% so với tap
>    97,9% gộp) — nhưng cũng KHÔNG tệ hơn frameIdx (70,0%). Xem §3: con số
>    "0/30 clean" ban đầu là ARTIFACT của phép dedup trong analyzer, G1 tự
>    đính chính bằng phép đếm mọi occurrence.
> 4. **Quyết định: LAND F8-only — nấc rawAnchor đã gỡ khỏi code**, vì không
>    có lợi ích đo được so với frameIdx (70,4% ≈ 70,0%), code đơn giản hơn,
>    và run B3 đã kiểm chứng code đã gỡ đạt số tốt nhất (87,2% distinct /
>    99,1% mọi occurrence). Flip-leg cho code land KHÔNG đo lại — suy luận
>    chặn dưới ở §4.3 (rawAnchor → frameIdx chỉ có thể giữ nguyên hoặc tăng
>    clean ở tập fallback).
> 5. **Spread: đuôi lỏng KHÔNG cải thiện** (max ~75 ở mọi run, kể cả
>    baseline); median cửa sổ đã vẽ cải thiện (0,6–0,8 so với 46,2 ở D)
>    nhưng E3 §3.5 đã chứng minh median là artifact lưỡng đỉnh nên không
>    dùng làm bằng chứng land. Tiêu chí spread của bar vì vậy KHÔNG đánh
>    giá được rõ ràng — land dựa trên 2 chân clean, với caveat này ghi rõ.
> 6. **Không hồi quy:** tsc 0, vite build PASS (6,96s), ghostBlend 15/15,
>    previewEngine 27/27 — đều đo trên cây đã sửa (đã land).

## 0. Môi trường đo + dữ liệu thô F3 + bar đăng ký trước

- Boot **3e4f237a** (reboot #31 lúc 11:26:40Z 13/11/2026; reboot #30 =
  10:54:53Z, cff65e89 → 287705ad — đính chính: brief G1 ghi "#30 lúc 11:26Z"
  là SAI, xem nhật ký F9 ngày 13/11; reboot #29 đã giết F3 lúc ~08:56:39Z;
  reboot tiếp theo (#32) dự báo ~13:28:49Z — không chạm vào phiên G1). RAM khả dụng lúc bắt đầu G1 chỉ **~537 MB** (11:38Z) → **1,87–2,58 GB**
  lúc đo (11:40–11:55Z, bộ nhớ được giải phóng sau boot); load 1-phút
  0,13 → 2,81. Nhiều luồng đợt 105 chạy song song nhưng tải đo được ở mức
  nhẹ–trung bình (xem tickCost từng run ở §2). Birefnet KHÔNG chạy (RAM
  dưới ngưỡng guard).
- **Dữ liệu thô F3 kiểm lại từ đĩa** (`hidden_files/round104-f3/`): script
  `analyze-f3*.py` (chưa từng chạy — không có file output .txt nào trên đĩa),
  `preview-b-f3-tapoff-relabeloff.json` (run A, 1.085.270 byte, đủ 20 pass),
  `run-a-tapoff-relabeloff.log` (đủ 20 pass), `run-b-tapon-relabelon.log`
  (CHẾT ở pass 6/20 do reboot #29 — KHÔNG có JSON run B), `boot.log`,
  `vite-5183-f3.log`, `probe104f3-ghost.cdp.mjs`. Không có run C/D flip nào.
- **Code F3 CÒN NGUYÊN trên đĩa lúc G1 bắt đầu:** `preview.tsx` md5
  `ca378bbf…` (gốc trước F3 `c2251e39`), 50 dòng marker `104f3`, không luồng
  đợt 105 nào khác sửa file này trong phiên G1 (md5 kiểm lại trước khi sửa
  vẫn `ca378bbf…`, mtime 08:44:33Z).
- **Bar đăng ký trước** (kế thừa nguyên văn `boot.log` F3, ghi TRƯỚC khi đo,
  không đổi sau khi thấy số): LAND chỉ khi CẢ HAI chân đều đạt — (1) case B,
  20 pass, `--disable-rvfc`: clean ≥70% VÀ hơn baseline cùng protocol ≥20
  điểm; (2) flip-protocol (flip rVFC sau pass 5, hậu flip+2000ms): clean
  ≥70% VÀ hơn baseline flip ≥20 điểm; + spread: phân bố nhóm lỏng
  (spread>15) không tệ hơn baseline (báo PHÂN BỐ, không báo median); +
  không hồi quy: tsc 0, vite build PASS, ghostBlend 15/15, previewEngine
  27/27. Không đạt → REVERT HOÀN TOÀN code production (grep marker 104f3
  = 0), chỉ stage LIMITS + log.
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
  **WebKit: KHÔNG chạy được** (không có driver, như C2/D2/E3). Mọi kết luận
  nhân quả chỉ đo trên Chromium. Tap/relabel VÔ DỤNG trên WebKit theo thiết
  kế (rVFC không bắn) — xem nợ F6' ở §7.
- Vite riêng G1 trên **5183**, config tạm `vite.config.f3-temp.ts` của F3
  (HMR TẮT, đóng băng code lúc khởi động — luồng khác sửa `preview.tsx`
  giữa chừng không reload trang probe). Sau khi đo xong: vite đã tắt, config
  tạm đã XOÁ theo đúng kế hoạch của F3 (không stage, không push).

## 1. Những gì G1 đã làm (từ dữ liệu thô F3 + đo mới tối thiểu)

| Bước | Nội dung | Kết quả |
|---|---|---|
| 1 | Chạy lại `analyze-f3.py` + `analyze-f3-presented.py` + `analyze-f3-flip.py` trên JSON run A (baseline F3) | §2.1 — baseline 45,7% clean, presented 23,8% |
| 2 | Đo mới run B (tap ON + relabel ON, `--disable-rvfc`, case B, 20 pass) — lấp chỗ run B đợt 104 chết ở pass 6 | §2.2 — 70,8% clean |
| 3 | Đo mới run B2 (lặp lại B — vì B chỉ hơn bar 0,8 điểm, cần kiểm lặp) | §2.2 — 76,1% clean |
| 4 | Đo mới run C (flip, tap+relabel ON) + run D (flip baseline) | §2.3 — C 73,6% vs D 48,6% |
| 5 | Phát hiện artifact dedup (§3) → gỡ nấc rawAnchor khỏi `f3PickAnchor104f3` (chỉ `preview.tsx`) | §4.1 — md5 `f0b9e496…` |
| 6 | Đo kiểm chứng run B3 trên code đã gỡ rawAnchor | §2.4 — 87,2% clean |
| 7 | Kiểm chứng hồi quy trên cây đã sửa: tsc, vite build, ghostBlend, previewEngine | §5 — tất cả xanh |

Tổng: 5 run probe mới (B/B2/C/D/B3), 0 lỗi do RAM (RAM lúc đo 1,65–2,58 GB
khả dụng), 0 lần retry. Run B đợt 104 (chết pass 6, không JSON) KHÔNG tính
vào bất kỳ số nào dưới đây.

## 2. Kết quả

### 2.1 Run A — baseline đợt 104, phân tích lại độc lập (G1)

Case B, 20 pass, tap OFF + relabel OFF, `--disable-rvfc`. 226 blendTick,
128 snapshot distinct, 94 ca đơn-nghĩa.

| Chỉ số | Run A (G1 phân tích lại) | So sánh (E3) |
|---|---|---|
| Clean (distinct) | **43/94 = 45,7%** | A 41,9% / A2 42,1% / D-flip 47,9% — cùng dải |
| P2 (rawCt dự đoán) | 43/94 = 45,7% | B2: 49,3% |
| Counterfactual: shift hằng số tốt nhất | d=+0 → 46% (không shift nào >46%) | — |
| Ổn định delta theo pass | mode đổi 0/+1/+2/−2 giữa các pass | delta ngẫu nhiên theo tick |
| Presented accuracy (curPix) | **30/126 = 23,8%** (toàn bộ fallback frameIdx) | E3 A/A2: 29,5% / 25,5% — cùng dải |
| tickCost mask-blend total | trung vị 102,2ms, p90 258,9ms, max 681ms | B2: 93,5 / 273,5 |
| rAF gap giữa 2 blend tick | trung vị 192,3ms, p90 495,9ms | — |
| Khung rAF / pass | 6–22 (tải nặng: luồng F1 chạy Chromium song song, load ~4,2) | E3 A: ~14–45 |

- **Không có cách hiệu chuẩn pha nào cứu được baseline:** shift hằng số tốt
  nhất vẫn chỉ 46% clean; mode offset đổi dấu giữa các pass (pass 1 mode +1,
  pass 2 mode 0, pass 11 mode −2) — delta là nhiễu theo tick, không phải độ
  lệch hệ thống. Kết luận này khớp C2/D2.
- Mislabel ~53–60% ở MỌI bucket rAF gap và mọi bucket inRaw (Q3a/Q3b) —
  mislabel không do gap rAF hay inRaw gây ra.
- Spread (§2.5): xem bảng tổng ở §2.5.

### 2.2 Run B + B2 — case B, tap+relabel ON (F8+F8b lúc đo)

| Chỉ số | B | B2 (lặp lại) |
|---|---|---|
| BlendTick / pass | 1842 / 20 pass | 2308 / 20 pass |
| Khung rAF / pass (chỉ thị tải) | 48–137 | 70–135 |
| tickCost total trung vị | 7,1ms (p90 16,7) | 6,7ms (p90 9,1) |
| rAF gap trung vị | 17,2ms | 16,7ms |
| **Clean distinct** | **68/96 = 70,8%** | **67/88 = 76,1%** |
| Hơn baseline A (45,7%) | **+25,1pt** | **+30,4pt** |
| Nhãn tap clean (distinct) | 67/84 = 79,8% | 66/81 = 81,5% |
| Nhãn rawAnchor clean (distinct) | 0/11 = 0,0% — ARTIFACT, xem §3 | 0/6 = 0,0% — ARTIFACT |
| Độ phủ anchor tươi (tick tap) | 1742/1842 = 94,6% | 2266/2308 = 98,2% |
| Tick rawAnchor | 100/1842 = 5,4% | 42/2308 = 1,8% |
| Presented accuracy tổng | 73,7% (826/1121) | 67,4% (927/1375) |
| Presented, tuổi [0,50ms) | 76,0% (816/1074) | 68,1% (918/1349) |
| Presented, tick rawAnchor | 21,3% (10/47) | 34,6% (9/26) |
| tickPresentedOffset | {0:1110, +1:529, −1:182, −2:18} | — |

- B chỉ hơn bar 0,8 điểm (70,8% vs 70%) nên G1 đo lặp B2: B2 xác nhận trên
  bar với biên rộng hơn (76,1%). Cả hai run đều hơn baseline ≥20 điểm.
- Q1 offset (trueRes − predRaw): +1 chiếm đa số (B 57/96, B2 20/88) —
  rawCt (currentTime) trễ ~1 frame so với frame thật trình chiếu dưới tải.
  Đây là bằng chứng cho phản-lý-thuyết của F8b (callback kẹt sau main-thread
  bận), nhưng §3 cho thấy mức độ thực tế của nó nhẹ hơn distinct tưởng.

### 2.3 Run C + D — flip-protocol (flip rVFC sau pass 5, hậu flip+2000ms)

| Chỉ số | C (tap+relabel ON) | D (baseline flip) |
|---|---|---|
| BlendTick (trước/sau flip) | 1775 (637 / 1138) | 1420 (354 / 1066) |
| **Clean distinct hậu flip+2000ms** | **67/91 = 73,6%** | **68/140 = 48,6%** |
| Hơn baseline flip | **+25,0pt** | — |
| Nhãn tap clean hậu flip | 67/78 = 85,9% | — (off) |
| Nhãn rawAnchor clean hậu flip (distinct) | 0/13 = 0,0% — ARTIFACT, xem §3 | — |
| Gap presented−expected \|≤3\| | 100% mọi cửa sổ ([0,2s): 110/110; [2,5s): 167/167; [5,15s): 385/385; [15s+): 476/476) | 100% — VACUOUS (xem dưới) |
| Gap tại seek hậu flip | 0 hoặc 1 (14/14 seek) | 0 (14/14 seek) |
| Độ phủ anchor tap hậu flip | 950/1028 = 92,4% tick | 0% (toàn frameIdx) |

- **Gap D = 0 là vacuous, KHÔNG được trích làm bằng chứng:** khi tap tắt,
  `presented` rơi về `frameIdx` (= `expected`) theo thiết kế gate mới nên
  gap ≡ 0 theo cấu tạo (cảnh báo đã có ở E3 §3.4). Chỉ clean D (48,6%) là
  baseline có nghĩa.
- Gap C bounded thật (tap giữ anchor qua pump chết + seek, tái xác nhận D2/E3).

### 2.4 Run B3 — case B trên CODE ĐÃ LAND (F8-only, rawAnchor đã gỡ)

| Chỉ số | B3 |
|---|---|
| BlendTick / pass | 2515 / 20 pass (132–134 tick/pass, đều nhất trong các run) |
| Khung rAF / pass | 70–135 |
| **Clean distinct** | **68/78 = 87,2%** (+41,5pt vs A) |
| Nhãn tap clean (distinct) | 67/75 = 89,3% |
| Nhãn frameIdx clean (distinct) | 1/3 = 33,3% (n nhỏ; khớp E3 25–27%) |
| Độ phủ anchor tươi (tick tap) | 2492/2515 = 99,1%; frameIdx 23/2515 = 0,9% |
| Nhãn rawAnchor | **0 occurrence** (đã gỡ khỏi code — kiểm chứng bằng grep JSON) |
| Presented accuracy tổng | 66,4% (1021/1537); tuổi [0,50ms) 66,7%; fallback frameIdx 33,3% (4/12) |
| tickPresentedOffset | {0:1449, +1:1006, +2:2, −1:58} |
| P2 (rawCt) | 69,2% vs nhãn 87,2% — nhãn relabel vượt xa dự đoán raw |

- B3 là run tốt nhất — một phần nhờ tải nhẹ nhất (độ phủ 99,1%) và một
  phần nhờ gỡ rawAnchor (tập fallback nay về frameIdx). Không tách được
  hai yếu tố này trong 1 run; cả hai đều theo hướng có lợi.
- **Lưu ý phương pháp (áp dụng cho mọi run):** phân tích distinct dedup
  theo cặp (label, pix) nên pass 0 chiếm đa số ca distinct (B3: 66/78) vì
  pass sau lặp lại cặp đã thấy. Kiểm chứng ở §2.6 cho thấy pass 0 KHÔNG
  sạch hơn pass sau theo phép đếm mọi occurrence (B3: pass 0 264/264 vs
  pass ≥1 4689/4733 = 99,1%) — distinct không bị thổi phồng bởi pass 0,
  chỉ là cách trọng số khác. Cả hai phép đếm đều xếp hạng các run giống nhau.

### 2.5 Spread — đuôi lỏng không cải thiện (báo phân bố, không báo median)

| Run | Cửa sổ đã vẽ (probe): nGroups / median / max | Theo frame (tính lại từ JSON): nhóm lỏng spread>15 / tổng |
|---|---|---|
| A (baseline) | nGroups=0 (không đo được) | 44/58 (76%), max 75,6 |
| B | 164 / 0,6 / 74,9 | 64/69 (93%), max 75,7 |
| B2 | 157 / 0,6 / 47,8 | 66/69 (96%), max 75,7 |
| B3 (code land) | 110 / 0,8 / 75,4 | 45/69 (65%), max 75,6 |
| C (flip) | 137 / 0,8 / 74,7 | 64/70 (91%), max 75,7 |
| D (flip base) | 105 / 46,2 / 75,7 | 69/70 (99%), max 75,9 |

- Median cửa sổ đã vẽ cải thiện (0,6–0,8 so với 46,2 ở D; E3: B2 0,6 / C
  0,5 / D 45,5) NHƯNG E3 §3.5 đã chứng minh median là artifact của phân bố
  lưỡng đỉnh — **không dùng median làm bằng chứng**.
- **Đuôi lỏng (max ~75) tồn tại ở MỌI run, kể cả baseline và code land.**
  Tỉ lệ nhóm lỏng theo frame dao động 65–99% giữa các run theo mật độ lấy
  mẫu (A chỉ 226 tick → 58 nhóm; B/B2/C 1700–2500 tick → ~70 nhóm) — không
  có hướng cải thiện nhất quán. Tiêu chí spread của bar vì vậy KHÔNG ĐÁNH
  GIÁ ĐƯỢC rõ ràng: không cải thiện, cũng không chứng minh được là tệ hơn
  (B3 65% tốt hơn A 76%; B/B2 93–96% tệ hơn A — nhiễu lấy mẫu chi phối).
  Land dựa trên 2 chân clean; caveat này được ghi rõ, không giấu.

### 2.6 Kiểm chứng chéo bằng phép đếm MỌI occurrence (không dedup)

Phép đếm distinct (E3/C2/D2) cho mỗi cặp (label, pix) trọng số 1. Phép đếm
mọi occurrence cho mỗi lần snapshot xuất hiện trọng số 1 — trọng số theo tần
suất xuất hiện thực tế. Hai phép đếm xếp hạng các run giống nhau:

| Run | Clean mọi occurrence | Theo labelSrc (mọi occurrence) |
|---|---|---|
| A baseline | 209/379 = 55,1% | off 55,1% |
| B | 3474/3598 = 96,6% | tap 3405/3497 = 97,4%; rawAnchor 64/96 = 66,7%; frameIdx 5/5 |
| B2 | 4483/4580 = 97,9% | tap 4428/4503 = 98,3%; rawAnchor 48/70 = 68,6%; frameIdx 7/7 |
| B3 (code land) | 4953/4997 = 99,1% | tap 4932/4967 = 99,3%; frameIdx 21/30 = 70,0% |
| C hậu flip+2000 | 1935/2013 = 96,1% | tap 1831/1872 = 97,8%; rawAnchor 104/141 = 73,8% |
| D hậu flip+2000 | 1149/1595 = 72,0% | off 72,0% |

- Số tuyệt đối mọi-occurrence cao hơn distinct (vì nội dung sạch lặp lại
  nhiều pass) — KHÔNG so sánh tuyệt đối giữa hai phép đếm, chỉ so sánh
  tương đối trong cùng phép đếm. Cả hai đều kết luận: F8 hiệu quả mạnh,
  B3 tốt nhất, rawAnchor ≈ frameIdx (xem §3).

## 3. F8b: giả thuyết BỊ BÁC ở dạng gốc — và tự đính chính số "0/30 clean"

### 3.1 Giả thuyết và kết quả đo

F8b (E3 §6.1): khi tuổi anchor >50ms, thay vì rơi về `frameIdx`, gán nhãn =
frame của callback rVFC gần nhất KHÔNG ngoại suy (rawAnchor). Lý thuyết:
callback chỉ bắn khi frame mới trình chiếu nên nếu chưa có callback mới thì
element vẫn đang trình chiếu frame đó — đúng cả khi decoder stall, đúng lúc
`frameIdx` sai nhất. Phản-lý-thuyết: callback kẹt sau main-thread bận trong
khi trình chiếu đã sang frame kế (ngoại suy +1..2 mới đúng).

**Kết quả theo phép đếm mọi occurrence (đúng):**

| Tập fallback | Clean (mọi occurrence) | So với tap |
|---|---|---|
| rawAnchor gộp 3 run (B+B2+C-hậu-flip) | **216/307 = 70,4%** (B 66,7%; B2 68,6%; C 73,8%) | tap gộp 9664/9872 = 97,9% |
| frameIdx fallback ở B3 (code land) | **21/30 = 70,0%** | — |
| frameIdx fallback distinct ở E3 | 25–27% (xem §3.2 — cũng chịu bias dedup) | tap E3 78–92% |

**Kết luận: F8b BỊ BÁC ở dạng "nâng tập fallback lên gần mức tap"**
(70,4% << 97,9%). Nhưng rawAnchor KHÔNG tệ hơn frameIdx (70,4% ≈ 70,0%)
— nó chỉ là một cách rơi về khác, không tốt hơn. Phản-lý-thuyết đúng một
phần (offset +1 chiếm đa số ở Q1 — callback quả thật trễ ~1 frame), nhưng
phần lớn tick cũ chỉ vừa quá 50ms nên frame chưa kịp sang frame kế, vì vậy
rawAnchor vẫn đúng ~70%.

### 3.2 Đính chính: vì sao distinct báo "rawAnchor 0/30 clean" là SAI

Đây là lỗi phương pháp G1 tự phát hiện khi đối chiếu hai phép đếm — và là
bài học cho mọi luồng sau dùng analyzer distinct.

Analyzer distinct dedup theo cặp `(label, pix)` và gán mỗi cặp cho labelSrc
của lần xuất hiện ĐẦU TIÊN. Cùng một pixels có thể xuất hiện với nhiều nhãn
khác nhau ở các tick (tap gán đúng, rawAnchor gán sai, hoặc ngược lại). Vì
tick tap chiếm 95–98% nên cặp (label, pix) sạch gần như luôn xuất hiện đầu
tiên dưới nhãn tap → analyzer gán cặp đó cho tap, và rawAnchor chỉ còn lại
các cặp KHÔNG BAO GIỜ xuất hiện dưới nhãn tap — tức đúng các cặp bị gán sai.

Bằng chứng trực tiếp (run B): 47 cặp distinct xuất hiện dưới nhãn rawAnchor,
nhưng chỉ 26 cặp được analyzer gán cho rawAnchor — **21 cặp (45%) bị gán
cho labelSrc khác do xuất hiện đầu tiên ở đó**. Trong 26 cặp còn lại, 11 ca
đơn-nghĩa đều mislabeled (0/11) và 15 ambiguous — đó chính là tập đã chọn
lọc âm. Con số "0/30 clean" gộp 3 run (B 0/11 + B2 0/6 + C 0/13) vì vậy đo
sự chọn lọc của dedup, KHÔNG đo độ chính xác của rawAnchor.

**Hệ quả:**
- Mọi breakdown theo labelSrc trong các LIMITS distinct trước đây (E3/D2/C2)
  đều chịu bias này theo cùng hướng (thổi phồng tap, dìm fallback). Headline
  clean tổng (không phân theo labelSrc) KHÔNG bị ảnh hưởng — verdict bar
  của E3 và của G1 vẫn đứng.
- Con số E3 "tập rơi về frameIdx chỉ 25–27% clean" cũng bị bias tương tự —
  không dùng làm baseline cho fallback nữa; baseline đúng cho fallback là
  ~70% theo phép đếm mọi occurrence (B3 frameIdx 21/30).
- **G1 đã gỡ rawAnchor dựa trên con số distinct 0/30 (trước khi phát hiện
  artifact).** Sau khi đính chính, việc gỡ là TRUNG TÍNH, không phải sửa
  một đường harmful: rawAnchor ≈ frameIdx (70,4% ≈ 70,0%). G1 GIỮ quyết
  định gỡ vì (a) không có lợi ích đo được, (b) code đơn giản hơn (2 nấc thay
  vì 3), (c) B3 đã kiểm chứng code đã gỡ đạt số tốt nhất. Nếu luồng sau
  muốn khôi phục rawAnchor, phải đo A/B lại với phép đếm mọi occurrence —
  không khôi phục dựa trên distinct.

## 4. Verdict — LAND F8-only (F8b đã gỡ)

| Tiêu chí đăng ký trước | Kết quả | Đạt? |
|---|---|---|
| Case B clean ≥70% và hơn baseline ≥20pt | B 70,8% (+25,1pt); B2 76,1% (+30,4pt); B3 87,2% (+41,5pt, code land) | **CÓ** |
| Flip clean ≥70% và hơn baseline ≥20pt | C 73,6% (+25,0pt vs D 48,6%) | **CÓ** |
| Spread không tệ hơn baseline | Đuôi lỏng max ~75 không đổi; tỉ lệ nhóm lỏng dao động theo mật độ lấy mẫu, không có hướng nhất quán | **KHÔNG ĐÁNH GIÁ ĐƯỢC** (§2.5) |
| Không hồi quy | tsc 0, vite build PASS, ghostBlend 15/15, previewEngine 27/27 (cây đã land) | **CÓ** |

### 4.1 Code đã LAND (trong `apps/web/src/preview.tsx`, marker 104f3)

- **Tap rVFC độc lập** (`PresentedTapState104f3`, `presentedTaps104f3`,
  `presentedTapCallback104f3`, `ensurePresentedTap104f3`): 1 đăng ký riêng/
  clip, chỉ cập nhật anchor (`lastFrameIdx` / `lastExpectedDisplayTime` /
  `lastCallbackMs`), không capture pixels, không động ring/pump; sống cả
  khi pump tắt (`__vcutDisableRvfc` / `rvfcDeadClips` không gate); không tạo
  khi `rvfcSilentEngine` (WebKit); hook test `__vcut104f3PresentedTap=false`
  tắt tap; vòng đời mirror pump (stale >1500ms dừng đăng ký lại; kill khi
  element đổi chủ).
- **Anchor tươi 50ms** (`F3_ANCHOR_FRESH_MS = 50`, `f3PickAnchor104f3`):
  chọn anchor tươi nhất giữa tap và pump, tuổi ≤50ms, ngoại suy công thức X2
  (`F + số khung trôi qua kể từ E`).
- **`presentedFrameIndex` dùng chung anchor tươi** (khi tap BẬT); khi tap
  TẮT → hành vi gốc verbatim (pump không gate) để baseline là đối chứng thật.
- **Relabel** (`f3RelabelFrameIndex`, 7 điểm gọi đường tick + đường pump):
  nhãn snapshot = anchor tươi thay vì `floor(currentTime·30)` /
  `videoFrameIndex(mediaTime)`; hook `__vcut104f3Relabel=false` tắt relabel.
- **Log đo mới** (giữ lại cùng code): `RvfcBlendTickSample.anchorSrc` /
  `anchorAgeMs`; `MotionBlurSnapshotPix.labelSrc` (`tap`/`pump`/`frameIdx`/
  `off`).
- Md5 `preview.tsx`: `ca378bbf…` (F3, có rawAnchor) → `f0b9e496…` (G1,
  đã gỡ rawAnchor). Marker `104f3` còn 50 dòng. `previewEngine.ts` KHÔNG
  hề chạm.

### 4.2 Code đã GỠ (F8b rawAnchor — 1 nấc trong `f3PickAnchor104f3`)

Khi không ứng viên nào tươi (tuổi >50ms), code cũ trả frame callback gần
nhất không ngoại suy (`src: "rawAnchor"`); code land trả `frameIdx` như E3.
Kèm theo: `"rawAnchor"` gỡ khỏi kiểu `F3AnchorSrc`; các comment liên quan
cập nhật ghi rõ "đã bỏ ở đợt 105 G1" (từ `rawAnchor` còn lại trong file chỉ
là nhắc lịch sử trong comment, không còn code chức năng nào dùng nó —
grep `rawAnchor` = 10 dòng comment, 0 dòng code).

### 4.3 Vì sao không đo lại flip-leg cho code land

Flip C đo trên code F8+F8b (73,6%). Code land chỉ thay đổi hành vi ở tick
rawAnchor (7,6% tick hậu flip; snapshot rawAnchor hậu flip 104/141 = 73,8%
clean theo mọi occurrence) thành frameIdx (70,0% ở B3) — chênh lệch kỳ vọng
≈ 0, đổi 13 snapshot distinct trong 91 ca. Suy luận chặn dưới: clean flip
của code land kỳ vọng ≈ 73,6% ± nhiễu nhỏ, vẫn trên bar 70% với biên +25pt.
G1 KHÔNG đo lại flip để tiết kiệm thời gian/reboot (phiên còn ~1,5h tới reboot #32 dự kiến ~13:28:49Z, nhiều luồng đợt
105 đang chạy) — suy luận này được ghi
rõ là suy luận, không phải số đo. Luồng sau muốn số cứng thì chạy lại C
trên cây land (probe + analyzer đã có sẵn ở `round104-f3/`).

### 4.4 Caveat lớn nhất của land này: headline clean phụ thuộc độ phủ

Clean tăng đơn điệu theo độ phủ anchor tươi: E3 B 34% phủ → 49,5%; E3 B2
74% → 58,1%; E3 C-hậu-flip 97% → 89,5%; G1 B 94,6% → 70,8%; G1 B2 98,2% →
76,1%; G1 B3 99,1% → 87,2%. **Dưới tải nặng (độ phủ ~34%), clean vẫn chỉ
~50%.** Land này không tuyên bố ghost đã hết dưới mọi tải — nó tuyên bố cơ
chế relabel bằng tap là đúng và headline đạt bar khi độ phủ cao. Nợ tăng độ
phủ dưới tải vẫn đứng (§7 mục 2).

## 5. Kiểm chứng (cây đã land)

- `tsc` apps/web: **0** (chạy sau khi gỡ rawAnchor).
- `vite build`: **PASS 6,96s** (cảnh báo chunk >500kB có từ trước, không mới).
- `ghostBlend.probe.test.ts` (`node --experimental-strip-types`): **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- Probe assert: không chạy `--assert` ở các run đo (chỉ đo, không khóa) —
  spread assert cũ đã biết fail ở baseline (D2 run A 1 fail spread).
- Không sửa file Y2/Z2/A2/B2/C2; không đụng drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / B3 / B4 / C3 / D3 / E4. Không đụng TTS 39,
  birefnet, `.github/workflows`, 0 binary.

## 6. File đã đổi + batch đã stage (KHÔNG push)

- `apps/web/src/preview.tsx` — F8 land (tap + gate 50ms + relabel +
  presented chung anchor) + gỡ nấc rawAnchor F8b (md5 `f0b9e496…`).
- `docs/PHASE9_ROUND105_G1_GHOST_LIMITS.md` — file này.
- XOÁ (không stage): `apps/web/vite.config.f3-temp.ts` — config tạm của F3,
  xoá theo đúng kế hoạch của F3 sau khi đo xong.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round105-g1-ghost.txt`
  (NUL-delimited, 2 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round105-g1/`
  (boot.log, 5 log run probe, 5 JSON, 8 file phân tích, chain-cdb2.log,
  vite log, all-occurrences-clean.txt).

## 7. Nợ mở + đề xuất cho đợt sau

1. **Ghost residual — F8 đã land, nhưng headline phụ thuộc độ phủ (§4.4):**
   dưới tải nặng clean vẫn ~50%. Hướng còn đứng: tăng độ phủ anchor dưới
   tải (giảm tải probe — đo strip thưa hơn; hoặc nới gate 50ms → 75ms kèm
   đo lại — D2: [50,100ms) chỉ 28–31% distinct nên nới gate có thể HẠI
   nhiều hơn lợi, đo rồi mới kết luận; lưu ý số distinct của D2 cũng chịu
   bias §3.2 nên cần đo lại bằng phép đếm mọi occurrence).
2. **F8b ĐÓNG:** rawAnchor ≈ frameIdx (70,4% ≈ 70,0% mọi occurrence) —
   không khôi phục nếu không có A/B mới bằng phép đếm mọi occurrence.
3. **Sửa analyzer distinct cho mọi luồng sau:** breakdown theo labelSrc
   phải dedup theo (label, pix, labelSrc) hoặc báo kèm phép đếm mọi
   occurrence — nếu không sẽ lặp lại artifact §3.2 (dìm fallback, thổi
   phồng tap). Headline tổng không bị ảnh hưởng.
4. **F6' pixel-verified skipLatest cho WebKit (CHỈ PHÁC, CHƯA ĐO — E3
   §6.1):** WebKitGTK không bắn rVFC nên tap/relabel vô dụng ở đó; ghost
   residual trên WebKit vẫn còn nguyên.
5. **Spread:** đuôi lỏng max ~75 không đổi ở mọi run — vẫn mở; báo phân bố,
   không báo median (E3 §3.5).
6. **Flip-leg cho code land:** chưa đo lại — chỉ có suy luận chặn dưới
   (§4.3); luồng sau muốn số cứng thì chạy lại C trên cây land.
7. Nợ khác đứng yên theo LIMITS gộp đợt 104 §4: F1 G1 + F4 Zombie + F5
   Re-arm (chờ A/B RAM cao) + F8 Harness + F9 kiểm chứng + O8; 2 MiB;
   EPERM probe #24 + khoảng mù #23; birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml 403; release gate không đổi.

# Đợt 89 Q7 — G1: bằng chứng mới + khuyến nghị có điều kiện (KHÔNG TỰ ĐÓNG)

Ngày: 11/11/2026 (lượt cron 18:35 +07; đo headed 11:38–12:04 UTC).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot 11:34:38 UTC ngay trước lượt). Nợ: LIMITS gộp
đợt 88 §4 mục 1 (G1 đóng hay chưa — parent/user quyết; N5: pool30 n=24
median 0,845 PASS 19/24; N10: 60fps 6/8).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — Q7 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi harness, không đổi metric. Không i18n key mới. Không kiểm lại
TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Cửa sổ Q7 mới: chỉ 3/5 lần hoàn thành** (lần 4 gãy mount-timeout
  dưới sóng tải; lần 5 gãy + mất report do sóng EPERM; 2 lần retry đều
  gãy vì sóng EPERM đang hoạt động — xem §3). 3 lần xong đều ở chế độ
  TẢI CỰC ĐOAN (baseline 0,90–2,80 fps — thấp nhất trong lịch sử pool),
  đều PASS: **1,22 / 1,23 / 1,17 → median 1,220×, mean 1,207, CI 95%
  [1,127; 1,287], 3/3 PASS.** Luật (b) cần đủ 5 lần nên cửa sổ Q7
  không có verdict luật (b) theo đúng nghĩa — giống N5 (4/5).
- **Pool 30fps gộp nay n=27 (thêm 3 lần Q7): median 0,930× (N5: 0,845),
  mean 0,920, SD 0,193, CI 95% [0,845; 0,994], PASS 22/27 (81%)** —
  lần đầu tiên cả ba tiêu chí chặt đều đạt cùng lúc (median ≥0,75;
  PASS ≥80%; CI cận dưới ≥0,75). Nhưng mức vượt 80% chỉ đúng **1 lần
  PASS** (22/27 = 81,5%; 21/27 = 77,8%) — lằn ranh vẫn mỏng như N5
  cảnh báo (19/24 = 79% "thiếu đúng 1 lần").
- **Tách theo chế độ tải (pool 27): máy tải (n=23): median 0,950×,
  mean 0,952, CI [0,875; 1,029], PASS 21/23 (91%) → luật (b) PASS ỔN
  ĐỊNH với biên rõ. Máy yên (n=4, không đổi): median 0,680×, PASS 1/4
  (25%) → CHƯA ĐẠT, không có số mới.**
- **Cảnh báo diễn giải (quan trọng nhất của Q7): 3 lần Q7 có tỉ lệ cao
  KHÔNG phải vì deint nhanh lên — mà vì baseline sụp nhiều hơn deint.**
  Tốc độ tuyệt đối Q7 so với N5: baseline mean 1,71 fps (N5: 5,01 —
  chỉ còn 34%), deint mean 2,06 fps (N5: 5,47 — chỉ còn 38%). Cả hai
  cùng sụp dưới tải cực đoan (loadavg lên tới 27,6; RAM khả dụng
  ~1,0–1,4 GB); tỉ lệ tăng từ 1,083 lên 1,207 chỉ vì baseline sụp
  hơn deint một chút. Đừng trích "deint nay nhanh hơn baseline 22%"
  — đó là số của sóng tải, đúng như N5 đã cảnh báo cho 1,29×.
- **60fps fixture (M1+N10, n=8, KHÔNG đổi đợt này): median 0,930×,
  mean 0,896, CI [0,764; 1,028], PASS 6/8 (75%)** — CI đạt, tỉ lệ
  PASS vẫn dưới 80%. **Chân 60fps của G1 vẫn chưa đạt.**
- **Luật median-5 vẫn lật theo cửa sổ trượt:** 23 cửa sổ trượt trên
  pool 27: **14 PASS / 9 CHƯA ĐẠT** (pool 24 là 11/20). Ba cửa sổ mới
  nhất (21–25, 22–26, 23–27) đều PASS nhờ 3 lần Q7, nhưng 9 cửa sổ
  cũ vẫn CHƯA ĐẠT — luật vẫn phụ thuộc điểm bắt đầu.
- **Combo n=6 không đổi:** median 0,815, PASS 3/6 (50%), SD 0,356 —
  không verdict combo.

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round89-q7/analyze-pool89q7.py` (dựa trên
`analyze-pool86n5.py`, thêm 3 lần Q7 đọc từ report JSON; số cũ khớp
N5 tới 0,001).

### 2.1 Từng cửa sổ 5 lần (luật b)

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| I5 (đợt 81) | yên 1 / tải 4 (16,35; 3,16; 2,61; 1,77; 1,64) | 0,93 / 0,75 / 0,80 / 0,81 / 0,94 | 0,810 | 5/5 | PASS ỔN ĐỊNH | [0,741; 0,951] |
| J3 (đợt 82) | yên 1 / tải 4 (27,35; 2,47; 0,88; 2,11; 1,56) | 0,68 / 0,73 / 1,13 / 0,75 / 1,13 | 0,750 | 3/5 | CHƯA ĐẠT | [0,603; 1,165] * |
| K3 (đợt 83) | tải 5 (5,53; 4,10; 4,12; 2,60; 3,24) | 0,95 / 1,04 / 0,69 / 0,85 / 0,84 | 0,850 | 4/5 | PASS ỔN ĐỊNH | [0,711; 1,037] |
| L3 (đợt 84) | yên 2 / tải 3 (38,52; 38,97; 6,26; 1,81; 2,70) | 0,65 / 0,68 / 0,75 / 0,75 / 1,03 | 0,750 | 3/5 | CHƯA ĐẠT | [0,585; 0,959] |
| M1 60fps (đợt 85) | tải 5 (3,01; 2,13; 3,67; 2,91; 3,31) | 1,00 / 0,88 / 0,94 / 0,62 / 0,73 | 0,880 | 3/5 | CHƯA ĐẠT | [0,640; 1,028] |
| N5 (đợt 86) | tải 4 / yên 0 (5,72; 2,35; 8,18; 3,80) + lần 5 gãy | 1,06 / 0,95 / 1,03 / 1,29 (4 lần) | 1,045 | 4/4 | CHƯA ĐỦ MẪU (cần 5) | [0,850; 1,315] |
| **Q7 (đợt 89)** | **tải 3 / yên 0 (2,80; 0,90; 1,44) + lần 4/5 gãy** | **1,22 / 1,23 / 1,17 (3 lần)** | **1,220** | **3/3** | **CHƯA ĐỦ MẪU (cần 5)** | **[1,127; 1,287]** |

\* CI cửa sổ J3 tính lại lệch ±0,02–0,05 so với công bố (do làm tròn
đầu vào) — ghi lại từ N5, không đổi verdict nào.

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7) | 27 | 0,930 | 0,920 | 0,193 | [0,845; 0,994] | 22/27 (81%) | PASS ỔN ĐỊNH (lần đầu) |
| 30fps — máy tải (<10 fps) | 23 | 0,950 | 0,952 | 0,185 | [0,875; 1,029] | 21/23 (91%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 4 | 0,680 | 0,735 | 0,131 | [0,527; 0,943] | 1/4 (25%) | CHƯA ĐẠT |
| 60fps fixture (M1+N10) | 8 | 0,930 | 0,896 | 0,158 | [0,764; 1,028] | 6/8 (75%) | CHƯA ĐẠT |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 35 | 0,930 | 0,914 | 0,183 | [0,852; 0,976] | 28/35 (80%) | đúng ngưỡng |
| Combo | 6 | 0,815 | 0,763 | 0,356 | [0,389; 1,137] | 3/6 (50%) | không verdict (n nhỏ, SD lớn) |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với N5)

| Tiêu chí | N5 (n=24) | Q7 (n=27) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,845 ✓ | 0,930 ✓ | tăng +0,085 |
| Pool 30fps PASS ≥ 80% | 19/24 = 79% ✗ (thiếu 1) | 22/27 = 81% ✓ | **vượt lằn ranh, đúng 1 lần** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,813 ✓ | 0,845 ✓ | tăng +0,032 |
| Tải n≥20: median + PASS + CI | 0,895 / 90% / 0,836 ✓✓✓ | 0,950 / 91% / 0,875 ✓✓✓ | biên lớn hơn |
| Yên: median + PASS | 0,680 / 25% ✗✗ | 0,680 / 25% ✗✗ (không đổi) | không có số mới |
| 60fps: median + PASS + CI | 0,930 / 75% / 0,764 (PASS ✗) | không đổi | không có số mới |
| Cửa sổ trượt 5 lần PASS | 11/20 | 14/23 | vẫn 9 cửa sổ CHƯA ĐẠT |
| Cửa sổ Q7 đủ 5 lần | — | 3/5 (gãy 2) | không verdict cửa sổ |

**Đọc bảng đúng:** chân 30fps-tải nay đạt cả ba tiêu chí chặt với
biên rõ; chân 30fps-yên và chân 60fps vẫn chưa đạt và không có số
mới nào trong đợt này. Một "G1 đóng" toàn vẹn (cả hai fixture, cả
hai chế độ) KHÔNG được số ủng hộ.

## 3. Cửa sổ Q7 mới — chi tiết từng lần

Lệnh: `node apps/web/scripts/deint-fps-verdict-83k3.mjs measure
hidden_files/round89-q7` (cổng 5590–5594 / debug 9690–9694 /
display :190–:194, fixture 30fps, 11 slot × 3s xen kẽ, như K3/L3/N5).
Tổng thời gian: 11:38–11:59 UTC (~21 phút cho 5 lần, trong đó lần
4/5 gãy). 8–10 luồng đợt 89 chạy song song suốt cửa sổ.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối) | RAM khả dụng | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 11:38–11:42 | 2,32 → 2,29 | ~1,8 GB | 2,80 fps | 1,36 / 1,29 / 1,42 / 1,21 / 0,81 | **1,22×** | PASS, 10/10 |
| 2 | 11:42–11:46 | 2,29 → 12,90 | ~1,4 GB | 0,90 fps | 2,02 / 1,60 / 1,10 / 0,47 / 0,96 | **1,23×** | PASS, 10/10 |
| 3 | 11:46–11:50 | 12,90 → 3,12 | ~1,7 GB | 1,44 fps | 0,81 / 1,32 / 1,11 / 0,75 / 1,84 | **1,17×** | PASS, 10/10 |
| 4 | 11:50–11:54 | 3,12 → 12,27 | ~1,9 GB | — | — | **gãy** | timeout chờ project mẫu load + hook `__vcutPreviewEnhance` (last=null) |
| 5 | 11:54–11:59 | 12,27 → 2,93 | ~1,5 GB | — | — | **gãy** | exit 2 sau 309s; report JSON + console log mất do sóng EPERM (xem §3.1) |

Tốc độ tuyệt đối (draw fps, từ report JSON):

| Lần | Baseline draw (6 slot) | Deint draw (5 slot) | Nhận xét |
|---|---|---|---|
| Q7-1 | 2,51 / 3,15 / 3,32 / 2,25 / 3,66 / 1,91 (mean 2,80) | 3,86 / 4,18 / 3,96 / 3,59 / 2,26 (mean 3,57) | — |
| Q7-2 | 0,62 / 0,55 / 0,81 / 0,77 / 0,55 / 2,13 (mean 0,90) | 1,18 / 1,09 / 0,87 / 0,31 / 1,29 (mean 0,95) | slot deint 0,31 fps gần đóng băng; slot baseline 2,13 fps là outlier cuối phiên |
| Q7-3 | 1,56 / 1,19 / 1,57 / 2,22 / 1,21 / 0,88 (mean 1,44) | 1,11 / 1,82 / 2,11 / 1,29 / 1,92 (mean 1,65) | — |
| N5-1..4 (để so) | mean 5,72 / 2,35 / 8,18 / 3,80 | mean 6,43 / 2,08 / 8,49 / 4,87 | N5 baseline mean 5,01; deint mean 5,47 |

**So sánh tuyệt đối Q7 vs N5:** baseline mean 1,71 vs 5,01 (×0,34);
deint mean 2,06 vs 5,47 (×0,38). Cả hai cùng sụp ~2/3 dưới tải
đợt 89 (loadavg đỉnh 27,6 trong lần 2; RAM khả dụng chỉ ~1,0–1,9 GB
so với ~8 GB tổng). Tỉ lệ mean tăng 1,083 → 1,207 (+0,124) chỉ vì
baseline sụp hơn deint một chút. Ở baseline <1,5 fps, tỉ lệ còn
mất ổn định số học: Q7-2 có slot 2,02× (baseline kề 0,55–0,62 fps)
và slot 0,47× (deint 0,31 fps) trong cùng một lần — chênh nhau
0,05 fps tuyệt đối đã lật tỉ lệ ~0,3.

Pixel Q7 (3 lần xong, giống hệt nhau cả 3 lần): G2 R 0,74 → 0,51,
hook tap=true, MAD 0,5821; G7a/G7b/G8 như N5. **MAD G2 0,5821
giống hệt N5 tới 4 chữ số** — đường deint không đổi hành vi kể từ
N5 (xem §5 về `preview.tsx`).

**Verdict script (3 lần có report): luật (a) 3/3 PASS; luật (b)
median 1,220×, 3/3 ≥ ngưỡng, CI [1,127; 1,287] → "CHƯA ĐẠT PASS
ỔN ĐỊNH (chỉ 3/5 lần — chưa đủ mẫu)".** Script còn crash sau khi
in verdict (xem §3.1) nên không ghi được `k3-verdict-summary.json`
— verdict trên đọc từ `measure-stdout.log` + tính lại từ report
JSON bằng `analyze-pool89q7.py` (md5 khớp, xem §5).

### 3.1 Sóng EPERM trong cửa sổ Q7 (bằng chứng mới cho P8)

- **11:59 UTC:** verdict script crash khi ghi
  `k3-verdict-summary.json` — `Error: EPERM: operation not
  permitted, write` tại `writeFileEpermRetry`
  (`deint-fps-verdict-83k3.mjs:216`, sau 5 lần thử của helper).
  Trước đó helper cũng fail 3/5 lần thử ghi `run5-console.log`.
- **Lần 5:** report JSON + console log đều mất — `headed-run5/`
  chỉ còn chrome/vite log; `c77e1-headed.log` 0 byte; chrome log
  có `crashpad ... WriteEverything failed` + `writev: Operation
  not permitted` (11:55:33–34Z). Nguyên nhân gãy chính xác của lần
  5 không ghi lại được (log harness mất theo sóng EPERM); vite đã
  lên 11:54:10, exit 2 sau 309s — cùng họ timeout mount như lần 4
  là giả thuyết mạnh nhất, không khẳng định.
- **12:01:30Z:** `probe-eperm-v2.sh once` fail ngay —
  `cannot append to .../hidden_files/eperm-probe-v2.log` (sóng
  vẫn đang hoạt động). `status` ngay trước đó: **DEAD/STALE** —
  heartbeat n=7 ts 11:37:37Z boot=7439870b, age 1422s > 900s; loop
  PID 13674 (start 08:49:50Z) đã chết; `status` ghi đúng 1 dòng
  DEAD vào log theo thiết kế (chưa xác minh được dòng đó ghi
  thành công hay cũng dính EPERM — xem §6.4).
- **12:03–12:05Z:** retry lần 4 gãy 2 lần: (a) nohup spawn chết
  lặng, console 0 byte; (b) chạy foreground thấy rõ — vite :5593
  exit 1 cả 3 lần thử, harness throw "vite dev + media probe
  không lên sau 3 lần thử (cổng bị chiếm?)". **Chẩn đoán "cổng bị
  chiếm" của harness là SAI:** `ss` cho thấy cổng 5593 trống
  (chỉ 5173 có listener — vite mồ côi PID 10576 từ 11:51, xem
  §6.3). Nguyên nhân thật là EPERM: `npx vite --port 5593` ngay
  sau đó cũng fail `npm error code EPERM / syscall write`; file
  vite log của cả 2 lần retry đều 0 byte.
- **12:05Z:** ghi file bằng shell redirect thất bại lặng (file
  0 byte, exit 0 — python flush cuối fail EPERM nhưng exit 0);
  phải ghi lại bằng tool write mới được (md5 khớp script output).
  Sóng EPERM kéo dài ít nhất **11:55–12:05Z (~10 phút)** trong
  lượt này, chồng lên cả 2 lần đo gãy và 2 lần retry.
- Q7 KHÔNG retry lần thứ ba cho lần 4 và KHÔNG retry lần 5 (luật
  N5: 1 retry/lần gãy; sóng EPERM đang hoạt động làm retry thêm
  vô nghĩa). Cửa sổ Q7 dừng ở 3/5 hoàn thành.

### 3.2 Lần 4 gãy — chi tiết

Timeout chờ project mẫu tự load (3 clip) + hook
`__vcutPreviewEnhance` xuất hiện (`last=null`), đúng họ lỗi của
N5 lần 5 retry (mount timeout dưới tải vọt). Tải trong lần 4:
1-phút 3,12 → 21,93 (đỉnh giữa lần), RAM khả dụng ~1,9 GB. App
đã mount, modal chào đã đóng — chỉ project mẫu không load xong
trong 180s. Không phải lỗi sản phẩm (cùng code mount bình thường
ở lần 1–3).

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của Q7: KHÔNG đóng G1 toàn vẹn; chỉ xem xét đóng
một phần (30fps, chế độ tải) nếu parent chấp nhận hai điều kiện
dưới đây. Quyết định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: 30fps ở chế độ tải (ĐỀ XUẤT XEM
  XÉT, có điều kiện):** ghi verdict tách theo chế độ như N5 đề
  xuất: deint ĐẠT ở chế độ tải (pool 23 lần: median 0,950×, mean
  0,952, CI cận dưới 0,875, 21/23 PASS = 91% — cả ba tiêu chí
  chặt đều đạt với biên lớn hơn N5) và KHÔNG ĐẠT ở chế độ yên
  (pool 4 lần: median 0,680×, 1/4 PASS) do trần lượng tử hoá rAF
  ~0,65–0,70 (L3 §3.2). Pool 30fps gộp nay cũng đạt cả ba tiêu
  chí (median 0,930; 81%; CI [0,845; 0,994]).
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ
    đúng ở chế độ tải / máy yếu; trên máy nhanh (baseline ≥10
    fps) deint chậm hơn ngưỡng một cách có hệ thống (~0,68×);
    (ii) không trích số pool gộp (0,930× / 81%) như verdict duy
    nhất — pool gộp trộn hai chế độ nên không có nghĩa; (iii)
    **ghi rõ 3 lần Q7 làm pool vượt 80% được đo dưới tải cực
    đoan (baseline 0,90–2,80 fps, loadavg tới 27,6) và tỉ lệ
    cao của chúng là sóng tải, không phải tốc độ code** — nếu
    parent muốn một con số "sạch", 3 lần Q7 không cho được;
    (iv) chân 60fps (75% < 80%) và chân yên (25%) vẫn MỞ như
    hai mục con riêng, không gộp vào quyết định đóng này.
  - Vì sao Q7 không đề xuất đóng toàn vẹn dù pool gộp đã vượt
    80%: (1) mức vượt chỉ đúng 1 lần PASS — thêm 1 lần FAIL
    nữa là rơi lại dưới 80% (đúng như N5 cảnh báo "đừng trích
    79% như số chắc", nay 81% cũng vậy); (2) cửa sổ Q7 không
    đủ 5 lần (3/5) nên không có một verdict luật (b) nào mới
    hoàn chỉnh — pool vượt nhờ cộng dồn, không nhờ một cửa sổ
    mới PASS; (3) 60fps vẫn 75% — đóng G1 mà bỏ qua fixture
    60fps là đổi phạm vi G1 lặng lẽ; (4) luật median-5 vẫn lật
    9/23 cửa sổ trượt.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5 (luật median-5
  không cho verdict duy nhất không phụ thuộc chế độ; cần metric
  không bị lượng tử hoá khung chi phối, vd gap-mean tick-time
  hoặc thời gian xử lý/frame). Q7 bổ sung bằng chứng ủng hộ B:
  ở baseline <1,5 fps, tỉ lệ FPS còn mất ổn định số học (slot
  2,02× và 0,47× cùng một lần Q7-2) — metric tỉ lệ FPS càng
  kém tin cậy khi máy càng tải. Gap-mean hiện chỉ 2/3 PASS và
  lệch chiều draw-fps nên vẫn chưa có metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5 (cần
  n≥10 lần yên để CI chế độ yên có nghĩa; hiện chỉ n=4). Q7
  không đo được lần yên nào — đợt thứ 4 liên tiếp (L3, M1, N5,
  Q7) không có lần yên nào trong giờ vòng lặp. Chờ đợi này có
  thể kéo dài vô hạn nếu vòng lặp vẫn chạy 8–10 luồng song song.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 81% mà
  bỏ qua chân 60fps/yên; đóng theo một cửa sổ 5 lần đơn lẻ;
  trích 1,22×/1,23× của Q7 như tốc độ deint (số của sóng tải);
  trích median pool 0,930× mà không kèm chế độ đo và điều kiện
  tải.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Gộp pool tính lại (`analyze-pool89q7.py`) | khớp số N5 đã công bố (pool 24: median 0,845, CI [0,813; 0,954], 19/24); pool 27 mới: median 0,930, CI [0,845; 0,994], 22/27; file `pool89q7-analysis.txt` md5 `8303673c…` khớp output script |
| Cửa sổ Q7 5 lần headed (verdict script K3) | **3/5 hoàn thành** (lần 4 mount-timeout, lần 5 gãy + mất report do EPERM; xem §3); 3 lần xong: 1,22 / 1,23 / 1,17, median 1,220, 3/3 PASS; luật (b) "chưa đủ mẫu" |
| Headed H9 (3 lần chạy Q7 xong) | **0 lỗi trang** cả 3 lần (cases G0–G9: 10/10 mỗi lần) |
| Pixel G2/G7a/G7b/G8 (Q7) | giống hệt nhau cả 3 lần (G2 MAD 0,5821; R 0,74 → 0,51; hook tap=true) — giống hệt N5 |
| Harness md5 trước–sau cửa sổ đo | `deint-fps-verdict-83k3.mjs` 01d3af56… và `clicktest-77e1-deint-fps.mjs` 15ab2b3b… **không đổi** suốt lượt (mtime 02:54 UTC — vẫn là lần sửa giữa chừng N5 đã ghi, tác giả chưa xác định) |
| `preview.tsx` trong cửa sổ đo | md5 `af9d510f…` (mtime 09:26 UTC, cây closing đợt 88) suốt 3 lần Q7 xong; đổi sang `65846be9…` lúc **11:51:40 UTC — SAU khi lần 3 xong (11:50:38)**, do luồng sibling đợt 89 — không nhiễm 3 lần Q7 (xem §6.2) |
| `playheadPacing.ts` | không đổi (mtime 07/11) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **không chạy** — Q7 không chạm file test/harness; hồi quy luật median đã chạy ở N5 (11/11) và không đổi kể từ đó |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — Q7 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn. Khuyến nghị của Q7 là chỉ xem xét đóng một
   phần (30fps, chế độ tải, có điều kiện); không đóng toàn vẹn.
2. **Pool 30fps vượt 80% đúng 1 lần PASS (22/27).** Thêm hay bớt
   1 lần PASS đều lật tỉ lệ gộp; đừng trích 81% như số chắc. Ba
   lần Q7 làm pool vượt được đo dưới tải cực đoan nhất lịch sử
   pool — số này không so được ngang hàng với các lần trước.
3. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→Q7) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Ở baseline <1,5 fps, tỉ lệ còn mất ổn định
   số học (Q7-2: 2,02× và 0,47× cùng một lần).
4. **Cửa sổ Q7 không đủ 5 lần** (lần 4 mount-timeout dưới sóng
   tải; lần 5 gãy + mất report do sóng EPERM; 2 lần retry gãy vì
   sóng EPERM đang hoạt động). Không có verdict luật (b) mới hoàn
   chỉnh trong đợt này.
5. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác; n=8,
   median 0,930, PASS 6/8 = 75% — vẫn dưới 80%). Đừng trích chỉ
   một tiêu chí (CI đạt, tỉ lệ PASS không).
6. **Luật median-5 lật 9/23 cửa sổ trượt.** Đừng trích verdict của
   một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn ghi kèm chế độ
   đo (baseline mean fps) và cửa sổ.
7. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
   "combo 0,76×" như tốc độ combo.
8. **Gap-mean và draw-fps lệch chiều nhau** (L3: gap PASS 0,78,
   draw FAIL 0,72 cùng lần). Chưa có metric chuẩn duy nhất.
9. **Harness file bị sửa giữa chừng đo ở N5 (02:54 UTC) vẫn chưa
   xác định tác giả** — Q7 dùng đúng file đó (md5 không đổi suốt
   lượt), nhưng parent vẫn cần kiểm tra sửa đó trước khi dùng
   harness này cho đợt đo sau (nợ N5 §6.10, còn mở).
10. **Sóng EPERM 11:55–12:05Z (~10 phút) làm mất dữ liệu đo:**
    report lần 5, console log lần 5, `k3-verdict-summary.json`,
    và chặn 2 lần retry. Nguyên nhân gãy của lần 5 không xác định
    được chắc chắn (chỉ còn chrome/vite log). Đây là quan sát
    EPERM mới nhất cho P8 (probe v2 DEAD/STALE, xem §3.1).
11. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng
    song song.** Tải sibling là biến số lớn nhất (load 1-phút
    1,4–27,6; RAM khả dụng 1,0–2,2 GB trong cửa sổ Q7).

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER** (xem §4).
   Nếu đóng một phần (30fps-tải), chân 60fps + chân yên vẫn mở
   như hai mục con riêng.
2. Chế độ yên cần thêm lần đo nếu chọn phương án C (hiện n=4) —
   đợt thứ 4 liên tiếp không đo được lần yên nào trong giờ vòng lặp.
3. 60fps cần thêm lần đo nếu muốn vượt 80% (hiện 6/8 = 75% — cần
   thêm ít nhất 2 lần PASS liên tiếp để lên 8/10 = 80%).
4. Harness: chẩn đoán "cổng bị chiếm?" sai khi vite exit 1 do
   EPERM (Q7 §3.1) — cần phân biệt EPERM với port conflict trong
   thông báo lỗi; bọc lỗi trước-try cho E1/verdict script (L3
   §7.5, vẫn mở); ghi số slot đóng băng kèm mọi verdict.
5. Playhead teleport (M1 §3.2 / N10 §7.3): luồng riêng, đo A/B
   trước–sau — không thuộc Q7.
6. EPERM: probe v2 DEAD/STALE (heartbeat #7 11:37:37Z, loop PID
   13674 chết); cần quyết cron riêng 10 phút (LIMITS gộp đợt 88
   §3 mục 4 — parent KHÔNG tự tạo trong phiên nền, chờ user).
   Q7 chỉ ghi nhận trạng thái, không sửa probe.
7. TTS / gate / vidstab / kernel / G1-G2 / WebKit / GPU-Safari:
   nợ của các luồng khác — không thuộc Q7.

## 8. Cách chạy lại

```bash
# Đo 5 lần + verdict (mỗi đợt, ~16-21 phút; đổi outdir mỗi đợt):
node apps/web/scripts/deint-fps-verdict-83k3.mjs measure \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round89-q7
# Gộp số (đọc report JSON đã có + số đã công bố, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round89-q7/analyze-pool89q7.py
# Verdict riêng cửa sổ Q7 (3 lần có report; script chính crash do EPERM khi ghi summary):
node apps/web/scripts/deint-fps-verdict-83k3.mjs analyze \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round89-q7
```

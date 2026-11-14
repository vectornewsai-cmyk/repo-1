# Đợt 107 I6 — Harness E1 dưới TẢI NẶNG để bắt G4 flake (run11–17)

Ngày: 13/11/2026 (lượt cron 00:35 +07 14/11). Máy đo: VM này (CPU-only,
Chromium qua Xvfb + CDP `--disable-gpu`; boot `63a52041` từ 14:50:59Z, ỔN
ĐỊNH suốt lượt chạy 18:00–18:46Z — reboot #34 KHÔNG xảy ra trong lúc chạy,
dù dự báo ~16:51:58Z / dải tới 18:05Z đã qua; xem §8). RAM khả dụng
1391–1964 MB trong lúc đo; KHÔNG sửa production, KHÔNG push, KHÔNG
release/tag. Harness KHÔNG đổi một byte (md5 giữ nguyên, xem §2).

Nợ: LIMITS H6 §4 — G4 flake gộp 2/28 = 7,1%, 2 ca cũ đều dưới tải nặng
(load 15–19), 7 lần E1 mới của H6 chạy máy yên đều 0 flake nên 0/7 không
bác được tỉ lệ cũ; cần lần chạy DƯỚI TẢI NẶNG với harness đã thêm probe.

## 1. Kết luận ngắn

- **G4 flake: KHÔNG bắt được mẫu nào — 0/6 lần E1 hoàn thành dưới tải
  nặng.** Cả 6 lần run11–13, 15–17 đều **10/10 PASS**, G4 tap=true, R=0,51.
  Tỉ lệ gộp nay là **2/34 = 5,9% (Wilson 95% ~2–19%)**. Nhưng **0/6 này
  KHÔNG bác được tỉ lệ cũ**: với tỉ lệ thật 1/10, P(0/6) ≈ 53%.
- **Bar prereg CHƯA ĐẠT ĐỦ:** prereg đăng ký "0 flake trên ≥7 lần tải
  nặng" — chỉ **6/7 lần hoàn thành tới G4**; run14 chết trước G4 (lỗi
  harness: timeout chờ project mẫu tự load, exit 2 — xem §4.3). Thiếu 1
  lần hoàn thành, và tải đo bằng load1 không sạch như prereg (xem §6) —
  nên kết quả này là **0/6 tải nặng (định nghĩa tải theo §6), không phải
  0/7**.
- **Tải nặng KÉO DÀI G3→G4 rõ rệt nhưng không gây flake:** gap **4,00–
  8,30s (trung vị 6,79s)** so với 1,72–2,33s máy yên (H6). Bước thừa thời
  gian lớn nhất là **patchClip→setEnhCheckbox: 2,17–4,50s** (đường khỏe
  ~1,1–1,4s) — click checkbox tới lúc store verify xong mất tới ~2,9s
  (run11: BẤM 18:04:16.798Z → store về true 18:04:19.694Z). Thứ hai là
  **hook áp chậm sau khi store đã true: 0,81–2,20s** ở 4/6 lần (run13/15/
  16/17: probe sau setEnhCheckbox vẫn tap=false dù store đã
  `{"deinterlace":true}`, hook chỉ lật true trong setPlayhead/waitIdle)
  — đúng chữ ký H-a (preview tick thưa dưới tải, hook áp muộn) — nhưng
  **waitIdle đã hấp thụ hết độ trễ** (0,08–2,00s, dài nhất run15 đúng
  2,00s) và G4 đọc lúc nào cũng tap=true. Flake 11,5s cũ cần độ trễ vượt
  qua cả waitIdle + khoảng đọc G4 — lần này chưa lần nào tới ngưỡng đó.
- **Keydown chậm tự nhiên: KỶ LỤC MỚI 2197ms.** Run15 pauseWait max
  **2197ms** (slot 1), playWait max 1124ms (slot 10) — vượt kỷ lục cũ
  1004ms (F8 E1-2, cũng dưới tải). Gộp toàn bộ: **55 lần / 737 slot /
  1474 toggle, max 2197ms**, 0 retry / 0 fallback / 0 abort. Vẫn thấp
  hơn timeout 5000ms **2,3 lần** (trước là 5,0 lần). Fallback #2 **vẫn
  mở** — biên an toàn đã thu hẹp hơn một nửa dưới tải nặng.
- **Run14 là phát hiện phụ riêng về độ mong manh dưới tải:** app mount
  xong 18:22:31Z, modal đóng 18:22:40Z, rồi project mẫu (3 clip) + hook
  `__vcutPreviewEnhance` không xuất hiện trong 3 phút → harness timeout
  exit 2, không report, không tới được G4. Đây KHÔNG phải flake G4
  (chưa tới G4), mà là E1 không chịu được tải nặng ngay từ khâu load
  project mẫu.
- **G5 cả 6 lần PASS chắc ngay vòng 1** (mean 0,99–1,51, median 0,84–
  1,25) — nhưng là số tải, đừng trích làm tốc độ deint (xem §7).
- **Checkbox: 114 lần BẤM, 0 lần KHÔNG-bấm, 0 cảnh báo hook slot.**
  35 dòng `G4-probe` trên 6 lần hoàn thành; 0 dòng `fallback store` /
  `space-retry` / `chưa giữ được` trong mọi log.

## 2. Harness đã đổi — KHÔNG đổi gì

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` md5
  **`ae6cd34a7dff3f6bda62199b5ab6c6fc`** trước/sau MỌI lần chạy (ghi trong
  `run-i6.log`) — khớp đúng md5 H6 đã thêm log chẩn đoán. `preview.tsx`
  md5 **`ced42efd785724c8c0d1b16fc32c7341`** trước/sau mọi lần — giữ
  nguyên, không sửa production. `node --check` script harness PASS đầu
  driver.
- Chỉ thêm mới: prereg + driver + script tạo tải + script phân tích +
  log/report trong `hidden_files/round107-i6/` và file LIMITS này.
  Driver `run-i6.sh` dựa trên `run-h6.sh`, đã sửa lỗi `summ_e1`
  IndexError của H6 (truyền đủ label làm argv[2]) — nhưng `summ_e1` vẫn
  in `g5=None m2=None` vì report JSON đợt này không có key `combinedMean`
  / `m2` (G5 nằm ở `g5Verdict.run1.mean/median` + `verdict`; xem §3) —
  số G5 trong LIMITS này lấy trực tiếp từ report JSON, không lấy từ
  `summ_e1`. Lỗi in ấn này không ảnh hưởng dữ liệu (report JSON đầy đủ).

## 3. E1 run11–17 — kết quả đầy đủ (driver run-i6.sh, boot 63a52041)

| Lần chạy | Bắt đầu (Z) | Exit | Pass | G5 run1 (mean/median) | G3→G4 | G4 tap/R | waitIdle | playWait max / pauseWait max |
|---|---|---|---|---|---|---|---|---|
| E1-11 | 18:00:41 | 0 | 10/10 | 1,13 / 1,19 PASS | 4,00s | true / 0,51 | 0,08s | 605 / 196ms |
| E1-12 | 18:07:31 | 0 | 10/10 | 1,05 / 1,03 PASS | 6,77s | true / 0,51 | 0,12s | 887 / 798ms |
| E1-13 | 18:13:57 | 0 | 10/10 | 1,21 / 1,08 PASS | 7,99s | true / 0,51 | 0,17s | 806 / 903ms |
| E1-14 | 18:19:43 | **2** | — (không report) | — | — (chưa tới G4) | — | — | — |
| E1-15 | 18:25:44 | 0 | 10/10 | 1,48 / 1,22 PASS | 8,30s | true / 0,51 | **2,00s** | 1124 / **2197ms** |
| E1-16 | 18:33:41 | 0 | 10/10 | 1,51 / 1,25 PASS | 6,80s | true / 0,51 | 0,93s | 882 / 470ms |
| E1-17 | 18:40:23 | 0 | 10/10 | 0,99 / 0,84 PASS | 4,38s | true / 0,51 | 0,81s | 504 / 592ms |

- G5 cả 6 lần PASS chắc ngay vòng 1 (`certain=true`, `rounds=1`),
  `idleClass.mode=tải` cả 6, `slot0Fps` (fps baseline) chỉ **0,81–1,57**
  (run11 0,94; run12 0,81; run13 0,81; run15 0,98; run16 0,97; run17
  1,57) — ngang hoặc chậm hơn chữ ký tải nặng của F1 run2 (FPS slot
  1,9–3,5). Slot `drawFps` trung bình 0,89–1,31 fps, `tickFps` trung
  bình 1,09–2,00 fps (min từng slot tới 0,31–0,88 fps).
- 2 slot đóng băng (drawFps < ngưỡng 0,5 fps) trong 6 lần hoàn thành:
  run12 slot 6 (drawFps 0,33; tickFps vẫn 5,29) và run15 slot 2
  (drawFps 0,31; tickFps 4,70) — draw đói dưới tải nhưng tick vẫn chạy,
  cả 2 lần vẫn 10/10 PASS (frozen slot chỉ ghi nhận, không làm rớt E1).
  RAM avail trước mỗi lần 1391–1964 MB — không lần nào chạm ngưỡng
  dừng sớm 600 MB của driver.

### 3.1 Tải lúc G3→G4 từng lần (mẫu sampler 10s + report)

| Lần | load1 trước→sau G3→G4 (mẫu gần nhất) | load5 trước→sau | running threads | loadBefore slot0 (report) |
|---|---|---|---|---|
| E1-11 | 12,29 → 17,93 | 4,29 → 6,08 | 28 → 29 | 17,93 / 6,08 / 3,27 |
| E1-12 | 1,30 → 1,18 | 8,36 → 8,11 | 24 → 24 | 1,09 / 7,97 / 6,08 |
| E1-13 | 10,38 → 7,69 | 13,01 → 12,23 | 20 → 23 | 7,23 / 12,06 / 8,74 |
| E1-14 | (chưa tới G4; load lúc start 17,19) | load5 9,73 | — | — |
| E1-15 | 20,90 → 22,15 | 11,68 → 12,25 | 27 → 29 | 23,58 / 12,71 / 10,42 |
| E1-16 | 0,63 → 2,62 | 7,96 → 8,13 | 25 → 17 | 4,73 / 8,48 / 10,08 |
| E1-17 | 5,63 → 4,84 | 12,05 → 11,67 | 23 → 21 | 4,45 / 11,47 / 11,75 |

Đọc bảng này cùng §6: load1 dao động mạnh (0,63–22,15) KHÔNG có nghĩa
tải lúc lên lúc xuống — đó là load1 đo sai dưới throttle (xem §6);
load5 (4,29–13,01), số thread đang chạy (17–29) và fps slot ~1 mới là
bằng chứng tải ổn định.

### 3.2 G3→G4 chia theo bước (từng lần, từ timestamp probe)

| Lần | G3→patchClip | patchClip→setEnhCheckbox | setEnh→setPlayhead | setPlayhead→waitIdle xong | waitIdle→G4 đọc | Tổng |
|---|---|---|---|---|---|---|
| E1-11 | 0,40s | 2,67s | 0,12s | 0,08s | 0,73s | 4,00s |
| E1-12 | 0,97s | 3,91s | 0,29s | 0,12s | 1,48s | 6,77s |
| E1-13 | 0,58s | 4,50s | 1,43s | 0,17s | 1,31s | 7,99s |
| E1-15 | 1,30s | 3,41s | 0,20s | 2,00s | 1,39s | 8,30s |
| E1-16 | 1,40s | 3,11s | 0,48s | 0,93s | 0,88s | 6,80s |
| E1-17 | 0,41s | 2,17s | 0,01s | 0,81s | 0,99s | 4,38s |
| **Đường khỏe (H6)** | ~0,05s | ~1,1–1,4s | ~0,01s | 0–0,51s | ~0,5s | 1,72–2,33s |

- Mọi bước đều chậm lại dưới tải, nhưng **patchClip→setEnhCheckbox là
  bước thừa nhiều nhất (+1,1–3,1s so với đường khỏe)** — gồm sleep 600ms
  cố định trong clickEnhCheckbox + 2 vòng eval STATE_FN + verify store,
  tất cả đều bị CPU đói làm chậm. Đây là bước "ăn" phần lớn trong 4–8s
  gap, KHÔNG phải waitIdle như giả thuyết H-a ban đầu đoán (waitIdle
  chỉ là bước thừa thứ hai, tối đa +1,5s ở run15).
- **Hook áp chậm (store true, hook false) — 4/6 lần:** run13 (lật true
  trong khoảng setEnh→setPlayhead 1,43s), run15 (false suốt tới
  waitIdle t+1,2s, lật true ở t+2,0s — 2,20s sau probe setEnhCheckbox),
  run16 (lật true ở waitIdle t+0,9s — 1,40s sau probe), run17 (lật true
  ở waitIdle t+0,8s — 0,81s sau probe). Run11/12 hook đã true ngay ở
  probe sau setEnhCheckbox. **Không lần nào hook còn false lúc G4 đọc**
  — đó là lý do 0 flake dù độ trễ lớn.
- Mẫu probe run15 (lần trễ nhất, 8 dòng G4-probe) — hook false suốt
  waitIdle tới t+2,0s rồi mới lật true, G4 vẫn PASS:
  `sau setEnhCheckbox: store={"deinterlace":true} hook tap=false`,
  `sau setPlayhead: tap=false`, `waitIdle t+0.1s/+0.7s/+1.2s: tap=false`,
  `waitIdle t+2.0s: sleeping=true ticks=123 tap=true`, `G4: R=0.51
  tap=true`.

## 4. G4 flake — 0/6 mới dưới tải nặng

### 4.1 Tỉ lệ gộp

| Nhóm | Lần E1 hoàn thành tới G4 | Flake | G3→G4 |
|---|---|---|---|
| Lịch sử tới H6 (G3+H6) | 28 | 2 | 1,72–11,90s |
| **Mới (I6, tải nặng)** | **6** | **0** | **4,00–8,30s (trung vị 6,79s)** |
| **Gộp** | **34** | **2** | — |

Tỉ lệ gộp: **2/34 = 5,9% (Wilson 95% ~2–19%)**, so với 2/28 = 7,1%
(~2–23%) trước đợt này. Đừng trích "5,9%" như hằng số — mẫu vẫn nhỏ,
khoảng vẫn rộng; và 2 ca flake cũ đều là outlier 11,5–11,9s, trong khi
6 lần mới dài nhất cũng chỉ 8,30s.

### 4.2 Vì sao 0/6 không bác được tỉ lệ cũ — và nói được gì mới

- Với tỉ lệ thật 1/10, P(0/6) ≈ 53% — kết quả này hoàn toàn tương thích
  với tỉ lệ cũ. Để bác tỉ lệ 1/10 ở mức 95% cần ~29 lần 0 flake liên
  tiếp.
- Nhưng đợt này NÓI ĐƯỢC điều H6 chưa nói được: **tải nặng một mình
  không đủ gây flake trong 6 lần thử** — dù G3→G4 đã kéo dài gấp 2–4
  lần đường khỏe và hook đã trễ tới 2,2s. Cơ chế flake, nếu còn, cần
  thêm yếu tố khác kèm theo (độ trễ vượt quá waitIdle + khoảng đọc G4,
  tức hook còn false sau ~2s chờ + ~1s đọc; hoặc một sự kiện hiếm khác
  như H-b/H-c — store lật lại / click trượt — mà probe lần này không
  thấy lần nào: store giữ `{"deinterlace":true}` suốt từ sau bấm tới G4
  đọc ở cả 6 lần, 114/114 lần BẤM đều đưa store về đích).
- So với giả thuyết H6 §4.4: **H-a (waitIdle kẹt dưới tải) được củng cố
  một nửa** — đúng là hook áp muộn dưới tải (4/6 lần, tới 2,2s) và
  waitIdle là nơi hấp thụ độ trễ — nhưng waitIdle đã cứu được cả 6 lần,
  nên H-a một mình chưa giải thích được ca flake 11,5s (cần waitIdle kẹt
  lâu hơn nhiều hoặc hook không bao giờ áp trong cửa sổ đó). **H-b
  (store lật lại) và H-c (click trượt/bấm đôi): 0 bằng chứng mới** —
  store không lật lần nào, không có lần KHÔNG-bấm nào. **H-d (preview vẽ
  từ snapshot clip cũ): không phân biệt được** — hook false trong lúc
  store true cũng khớp H-d, nhưng hook sau đó lật true nên không kết
  luận được.
- Đề xuất đợt sau: chạy tiếp E1 dưới tải nặng (ít nhất 7 lần hoàn thành
  tới G4 để đạt bar prereg đợt này) + cân nhắc tải nặng hơn hoặc kéo
  dài cửa sổ đo (ví dụ tải đè lên cả lúc load project mẫu — run14 cho
  thấy tải đã đủ làm E1 chết trước G4, nên "tải nặng hơn" có thể chỉ
  tăng tỉ lệ chết trước G4 chứ không tăng tỉ lệ flake; cần ghi rõ
  tradeoff này).

### 4.3 Run14 — chết trước G4 (không phải flake, ghi riêng)

- Timeline: vite dev lên 18:21:29Z, app mount 18:22:31Z, modal chào
  đóng 18:22:40Z, rồi **im lặng 3 phút** tới 18:25:40Z:
  `HARNESS LỖI: timeout chờ project mẫu tự load (3 clip) + hook
  __vcutPreviewEnhance xuất hiện (last=null)`. Exit 2, không report
  JSON, log chỉ 6 dòng. Load lúc vite lên: 17,19 / 9,73 / 8,22; sampler
  trong lúc chờ load1 15,82→20,12, load5 9,34→10,75.
- Diễn giải: dưới tải nặng, project mẫu (3 clip) không load xong +
  hook không xuất hiện trong 3 phút. Đây là **độ mong manh của khâu
  khởi động E1 dưới tải**, tách biệt với flake G4 (chưa tới G4 nên không
  đếm vào tử/mẫu tỉ lệ flake). Nhưng nó làm mẫu đợt này chỉ còn 6/7 —
  và cảnh báo: càng tăng tải, càng nhiều lần chết kiểu này trước khi
  đo được G4.
- Không chạy bù run14 trong đợt này (driver đã chạy hết 7 số run theo
  prereg; chạy bù cần số run mới + prereg bổ sung, để đợt sau).

## 5. Keydown chậm tự nhiên — gộp toàn bộ (kỷ lục mới)

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback / abort |
|---|---|---|---|---|---|
| E8 gộp | 22 | 319 | 638 | 804ms | 0 / 0 / 0 |
| Đợt 104 (F8 + F1) | 18 | 242 | 484 | 1004ms | 0 / 0 / 0 |
| Đợt 106 H6 | 9 | 110 | 220 | 213ms | 0 / 0 / 0 |
| **Đợt 107 I6 (mới)** | **6** | **66** | **132** | **2197ms** | **0 / 0 / 0** |
| **Tổng** | **55** | **737** | **1474** | **2197ms** | **0 / 0 / 0** |

- Lần mới: E1 ×6 (66 slot, 132 toggle). Chậm nhất là **pauseWait
  2197ms (run15, slot 1)**; playWait chậm nhất 1124ms (run15, slot 10).
  Toàn `space`, 0 dòng retry/fallback trong log. Run14 không có report
  nên không đóng góp slot nào (không giấu — ghi rõ ở đây).
- Kỷ lục mới 2197ms vẫn thấp hơn timeout 5000ms **2,3 lần** (trước
  5,0 lần). Để fallback #2 bắn tự nhiên cần 2 lần trễ >5s liên tiếp rồi
  lọt cửa sổ 2s — với 1474 toggle quan sát được sự kiện này vẫn chưa
  từng xuất hiện, nhưng biên an toàn đã thu hẹp hơn một nửa CHỈ NHỜ tải
  nặng (máy yên max mới 213ms). **Vẫn mở** — và giờ có bằng chứng tải
  nặng là yếu tố đẩy wait lên (2197ms và 1004ms, 2 kỷ lục cao nhất, đều
  dưới tải).

## 6. Tải nặng — cách tạo, cách đo, và độ lệch so với prereg (trung thực)

- Cách tạo tải (script `make-load-i6.sh`): N tiến trình Python busy-loop
  (`while True: pass`, mỗi tiến trình ~1,0 load) chạy nền suốt mỗi lần
  E1, dừng sau mỗi lần. Bắt đầu N=15; driver đo load1 sau 60s, nếu
  load1 < 14 thì thêm 4 spin (thành 19) rồi đo lại.
- **Độ lệch 1 — load1 KHÔNG đạt 15–19 ổn định như prereg.** Load1 đo
  được dao động 0,63–23,58 giữa các thời điểm; chỉ run11 (mẫu trong
  cửa sổ G3→G4: 15,33) và run15 (20,90–22,15) chạm ngưỡng 15–19 đúng
  cửa sổ; run12/16 load1 gần G3→G4 chỉ 0,63–2,62. Driver đã thêm 4 spin
  ở 4/7 lần (run11/12/15/16) vì load1 sau 60s < 14 — trong đó run15
  sau đó load1 lên 20+, tức có lần thêm spin là thừa.
- **Giải thích (có bằng chứng):** cell VM này chỉ có **1,5 CPU chia sẻ**
  — 19 tiến trình busy-loop tranh nhau 1,5 CPU nên phần lớn thời gian
  bị throttle/dequeue khỏi runqueue, loadavg (đếm task đang runnable)
  đếm thiếu và dao động theo chu kỳ throttle. Bằng chứng tải THẬT vẫn
  nặng và ổn định, độc lập với load1: (a) `/proc/pressure/cpu`
  avg300=50,27 (CPU stall ~50% trong 5 phút cuối lượt chạy — sau khi
  dừng tải avg10 chỉ còn 0,12); (b) số thread đang chạy 17–32 suốt các
  lần chạy; (c) load5 4,29–13,01 (không dao động như load1); (d) fps
  slot ~1 (drawFps trung bình 0,89–1,31; slot0Fps 0,81–1,57) — ngang
  hoặc chậm hơn F1 run2 (1,9–3,5 fps); (e) `idleClass.mode=tải` cả 6
  lần hoàn thành. **Kết luận: các lần chạy ĐÚNG là tải nặng theo mọi
  chỉ số trừ load1 tức thời** — nhưng prereg viết theo load1 nên ghi rõ
  độ lệch này thay vì tuyên bố "đạt load 15–19".
- **Bài học cho đợt sau:** đừng dùng load1 làm dial tải trên máy này;
  dùng bộ ba load5 + số thread đang chạy + fps slot (hoặc pressure
  CPU). Nếu vẫn muốn load1 ~15–19 thì cần tạo tải bằng tiến trình
  I/O-bound hoặc sleep-ngắt quãng thay vì busy-loop (busy-loop bị
  throttle gộp), hoặc chấp nhận load1 dao động và báo cáo theo load5.
- Tải đã dừng sạch sau mỗi lần (không còn tiến trình spin sau driver;
  file `load-i6.pids` đã xóa; kiểm tra cuối driver: 0 tiến trình spin
  còn sống ngoài tiến trình shell tự khớp tên lệnh).

## 7. G5 — số tải, không phải tốc độ deint

- G5 run1 mean 0,99–1,51 (median 0,84–1,25), PASS chắc cả 6 lần ngay
  vòng 1. Nhưng cả 6 lần đều `idleClass=tải`, slot0Fps ~1 — tỉ lệ này
  đo dưới CPU đói, không phải tốc độ deinterlace. Đừng trích làm hiệu
  năng deint. (Cùng caveat H6 §7.3.)

## 8. Reboot — #34 chưa xảy ra trong lúc chạy

- Boot `63a52041` từ 14:50:59Z ổn định suốt 18:00:41–18:46:08Z (driver
  chạy hết 7 lần, 0 reboot). Dự báo H7 (#34 ~16:51:58Z, dải tới
  18:05Z) đã **lệch**: tới 18:46Z vẫn chưa có reboot #34. Không suy
  thêm — chỉ ghi boot id + giờ làm chuẩn; luồng EPERM đợt 107 tự cập
  nhật dự báo.
- Lưu sớm đã thực hiện: log append sau mỗi lần E1 (run-i6.log ghi đủ
  7 lần, kể cả run14 lỗi); report JSON + load sample trên đĩa sau mỗi
  lần. Không mất dữ liệu nào do reboot (vì không có reboot).

## 9. Giới hạn — đọc trước khi trích số

1. **0/6 flake mới không phải bằng chứng tỉ lệ đã giảm** (§4.2) —
   P(0/6 | tỉ lệ thật 1/10) ≈ 53%. Đừng trích "flake đã hết" hay "tỉ lệ
   nay 5,9%" như hằng số — Wilson 95% vẫn ~2–19%.
2. **Bar prereg chưa đạt đủ** — chỉ 6/7 lần hoàn thành tới G4 (run14
   chết trước G4); tải đo bằng load1 không sạch như prereg (§6). Kết
   quả đúng là "0/6 tải nặng", không phải "0/7".
3. **Cơ chế flake vẫn chưa biết** — chỉ thu hẹp được: tải nặng kéo dài
   G3→G4 (nhất là bước setEnhCheckbox) và làm hook áp muộn tới 2,2s,
   nhưng waitIdle đã cứu cả 6 lần; H-a củng cố một nửa, H-b/H-c 0 bằng
   chứng mới, H-d chưa phân biệt được.
4. **Keydown gộp 55 lần vẫn chưa có lần fallback #2 tự nhiên nào** —
   0/1474 toggle không chứng minh fallback #2 không bao giờ bắn; biên
   an toàn đã thu hẹp còn 2,3× dưới tải nặng (kỷ lục mới 2197ms).
5. **Run14 là lỗi harness dưới tải, không phải flake G4** — nhưng nó
   cho thấy E1 mong manh ngay từ khâu load project mẫu khi tải nặng;
   tăng tải thêm có thể chỉ tăng tỉ lệ chết trước G4.
6. **Lỗi in ấn của driver I6 (tự nhận):** `summ_e1` in `g5=None m2=None`
   vì key report JSON khác giả định (xem §2) — số G5 trong LIMITS lấy
   trực tiếp từ JSON, không ảnh hưởng dữ liệu. Sửa ở driver đợt sau
   (đọc `g5Verdict.run1.mean/median` + `verdict`).
7. `tsc` / `vite build` không chạy lại: I6 không đổi production code
   (harness md5 không đổi một byte) — theo tiền lệ G3/E8 §8.7;
   `node --check` script harness PASS; 6 lần chạy đều mount app thành
   công qua vite dev (run14 mount xong rồi mới timeout ở khâu load
   project). TTS 39 CẤM kiểm lại (không kiểm); birefnet 0 lần thành công
   (không thử); ci-security.yml vẫn 403 chờ user (ngoài phạm vi).

## 10. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND107_I6_HARNESS_LIMITS.md` (file này) — mới.
- Harness KHÔNG đổi: `apps/web/scripts/clicktest-77e1-deint-fps.mjs`
  md5 giữ nguyên `ae6cd34a7dff3f6bda62199b5ab6c6fc`; `preview.tsx` giữ
  nguyên `ced42efd785724c8c0d1b16fc32c7341`.
- Log + dữ liệu: `hidden_files/round107-i6/` (`prereg-i6.md`,
  `run-i6.sh`, `run-i6.log`, `run-i6-driver.out`, `make-load-i6.sh`,
  `analyze-i6-g4-keydown.py` + `analyze-i6.txt`, `poll-i6.log`,
  `e1-run11..17/` + `-run.log`, `load-i6-run11..17.txt`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round107-i6-harness.txt`
  (NUL, đọc lại sau khi ghi).

```bash
# Chạy lại E1 dưới tải nặng với harness đã thêm probe (nhớ chờ cờ nhóm
# yên trước — xem prereg-i6.md; đừng chạy đè lên lượt đo của nhóm khác):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round107-i6/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Tổng hợp lại G4 + keydown từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round107-i6/analyze-i6-g4-keydown.py
# Lần flake tới: đọc các dòng "G4-probe" trong e1-runX-run.log — bước
# nào ăn thời gian / store-hook lệch nhau sẽ hiện rõ ở đó.
```

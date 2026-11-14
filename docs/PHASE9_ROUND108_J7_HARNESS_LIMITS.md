# Đợt 108 J7 — Harness E1 dưới TẢI NẶNG, đủ ≥7 lần hoàn thành (nối I6) — BAR CHƯA ĐẠT

Ngày: 13–14/11/2026 (lượt cron 03:35 +07 14/11). Máy đo: VM này (CPU-only,
Chromium qua Xvfb + CDP `--disable-gpu`; boot #34 `cc460738…` từ 20:34:17Z,
boot #35 `26cbdc1e-…` từ 21:42:41Z, boot #36 `ab33c58f-…` từ 22:53:56Z).
RAM khả dụng 925–1734 MB trong lúc đo; KHÔNG sửa production, KHÔNG sửa
harness, KHÔNG push, KHÔNG release/tag. Harness KHÔNG đổi một byte
(md5 giữ nguyên, xem §2).

Nợ: LIMITS gộp đợt 107 §4 mục 9 — G4 flake gộp 2/34 = 5,9%, bar prereg I6
chưa đạt đủ (cần 0 flake trên ≥7 lần E1 hoàn thành tới G4 dưới tải nặng;
I6 mới 6/7); keydown chậm gộp 55 lần / 737 slot / 1474 toggle, max 2197 ms.

## 1. Kết luận ngắn

- **G4 flake: 0 mẫu mới — nhưng BAR PREREG VẪN CHƯA ĐẠT.** Có thêm 2 quan
  sát G4 PASS mới (run21 từ log, run22 đầy đủ 10/10), 0 flake — nhưng
  **cả 2 đều KHÔNG đạt chuẩn tải nặng theo dial prereg** (run21 load5
  trong cửa sổ G3→G4 chỉ 3,35 < 8; run22 load5 ~0,9 < 8 và slot0Fps
  3,98 > 2, lại bị J7 dừng tải chủ động trước G4 — xem §4.3). Số lần
  hoàn thành tới G4 DƯỚI TẢI NẶNG ĐẦY ĐỦ vẫn là **6 (chỉ I6)** — bar
  ≥7 chưa đạt. Đợt sau phải chạy tiếp E1 và CHỈ tính lần nào đạt dial
  tải trong cửa sổ G3→G4.
- **Tỉ lệ gộp (báo cả 2 số đã đăng ký trước):** chặt-chỉ-report
  **2/35 = 5,7% (Wilson 95% [1,6%, 18,6%])** (lịch sử 2/34 + run22
  0/1); tính cả run21 (G4 PASS trong log, không report) **2/36 = 5,6%
  (Wilson [1,5%, 18,1%])**. Trước đợt này 2/34 = 5,9% ([1,6%, 19,1%]).
  0 flake mới không bác được tỉ lệ cũ (P(0/2 quan sát mới | tỉ lệ thật
  1/10) ≈ 81%).
- **Run18–20: 0/3 hoàn thành — chết trước G4 do ENOSPC** (vite crash
  vì hết file watchers, xem §4.1). Nguyên nhân: J3 bật vite :5590 lúc
  21:17:12Z, đúng 1 phút trước vite J7 — J3 chiếm watcher trước, J7
  thua cả 3 lần. Lỗi hạ tầng phối hợp, không phải lỗi sản phẩm, không
  phải flake G4. Retry run21 thoát ENOSPC (vite khỏe) nhưng chết do
  reboot #35 sau G4.
- **Run21: G4 PASS trong log (R=0,51, tap=true, gap 4,98 s), E1 chết
  SAU G4 do reboot #35** (21:42:41Z), không report/G5/keydown. Tải
  trong cửa sổ G3→G4: load1 5,78 (đang tăng mạnh 0,36→5,78), load5
  3,35, threads-R 22 — tải vừa, dưới chuẩn nặng (load5 ≥ 8). Hook đã
  true ngay ở probe sau setEnhCheckbox (không áp muộn như 4/6 lần I6).
- **Run22: 10/10 PASS đầy đủ (có report) — nhưng dưới tải THẤP.**
  G4 PASS (R=0,51, tap=true, gap 2,79 s); G5 mean 0,92x / median 0,99
  PASS chắc; 11 slot, 0 slot đóng băng, drawFps 3,95–9,05. Tải bị J7
  dừng chủ động lúc ~22:59:0x (để bảo vệ kiểm cây cuối của J9 — xem
  §4.3) nên G4 diễn ra khi không còn tải (load1 ~0,6, load5 ~0,9).
  Đây là lần E1 mồ côi tự chạy xong sau khi driver bị giết (xem §8) —
  dữ liệu dùng được nhưng phải kèm đúng bối cảnh này.
- **Keydown chậm gộp: 56 lần / 748 slot / 1496 toggle, max 2197 ms**
  (run22 đóng góp 11 slot / 22 toggle, max 291 ms — tải thấp nên chờ
  nhanh, đúng kỳ vọng). 0 retry / 0 fallback / 0 abort. Kỷ lục 2197 ms
  (I6) không đổi; biên an toàn vẫn 2,3× so với timeout 5000 ms.
  Fallback #2 vẫn mở.
- **Checkbox: 25 lần BẤM, 0 lần KHÔNG-bấm, 0 cảnh báo hook slot**
  (run21 6 BẤM, run22 19 BẤM); 11 dòng `G4-probe` trên 2 lần tới G4;
  0 dòng `fallback store` / `space-retry` / `chưa giữ được`.
- **Reboot #35 (21:42:41Z, gap 1h08'24") và #36 (22:53:56Z, gap
  1h11'15")** cắt ngang đợt 2 lần — lần đầu trong một đợt J7 (xem §8).
- **Cờ `round108-j3-done` KHÔNG BAO GIỜ xuất hiện** dù J3 đã xong việc
  từ 21:51Z (LIMITS + batch ~22:11Z, J9 đã kiểm xong) — J3 quên tạo cờ.
  J7 chờ đủ 60 phút rồi chạy theo prereg bổ sung #3 (xem §2.1). J9 đã
  đóng pha probe và đóng băng cây ~22:55Z trước khi J7 chạy lại lần 2.

## 2. Harness đã đổi — KHÔNG đổi gì

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` md5
  **`ae6cd34a7dff3f6bda62199b5ab6c6fc`** trước/sau MỌI lần chạy (ghi trong
  run-j7.log, run-j7-retry.log, run-j7-resume.log) — khớp đúng md5 I6.
  `preview.tsx` md5 **`ced42efd785724c8c0d1b16fc32c7341`** trước/sau mọi
  lần — giữ nguyên, không sửa production. `node --check` script harness
  PASS đầu mỗi driver.
- Chỉ thêm mới: prereg ×4 + driver ×3 + script tạo tải + script phân
  tích + log/report trong `hidden_files/round108-j7/` và file LIMITS
  này. Driver `run-j7.sh` / `run-j7-retry.sh` / `run-j7-resume.sh` dựa
  trên `run-i6.sh`, đã sửa lỗi in `summ_e1` g5=None của I6 (đọc
  `g5Verdict.run1.mean/median` + `verdict` trực tiếp) — lần này
  `summ_e1` in đúng số G5 cho run22 (mean 0,92 median 0,99 PASS).
- **Lỗi tự nhận — regex sampler của analyzer (đã sửa):** bản đầu của
  `analyze-j7-g4-keydown.py` không khớp dòng sampler J7 (sampler ghi
  thêm cột `procs/total pid` trước `threads-R=`) nên `load-G3G4=None`
  cho cả run21/run22. Đã sửa regex, chạy lại — run21 ra đúng mẫu
  trong cửa sổ (load1 5,78 / load5 3,35 / threads-R 22); run22 vẫn
  None là ĐÚNG (sampler chết trước cửa sổ G3→G4, xem §4.3) — số tải
  run22 lấy từ dòng log E1. Sửa này chỉ ảnh hưởng bản in phân tích,
  không đổi dữ liệu.
- **Prereg và các lần lệch (ghi trung thực, cả 4 addendum đều viết
  TRƯỚC khi chạy bước tương ứng):**
  - `prereg-j7.md` (20:41Z): run18–20, bar ≥7 lần hoàn thành tải nặng,
    dial tải mới load5 + thread + fps slot (không dùng load1).
  - `prereg-j7-retry.md` (21:38Z): retry run21–23 sau khi run18–20
    chết ENOSPC (theo điều khoản "gặp ENOSPC thì chờ rồi retry" trong
    prereg gốc + task); thêm cổng kiểm tra watcher tiền-chạy + dừng
    sau 2 lần ENOSPC liên tiếp.
  - `prereg-j7-resume.md` (21:49Z): resume run22–23 sau reboot #35,
    đổi trigger thành chờ cờ `round108-j3-done` (tránh chạy chồng J3);
    đăng ký cách đếm run21 (báo cả 2 số) và quy tắc hết timeout thì
    DỪNG, không chạy luôn.
  - `prereg-j7-resume2.md` (22:52Z): LỆCH chữ prereg resume — chạy
    run22–23 ngay sau khi hết timeout vì J3 đã xong thật từ 21:51Z
    (driver log xong, LIMITS + batch có, J9 đã kiểm xong, 0 process/
    vite của J3) — cờ thiếu chỉ là J3 quên tạo, nguy cơ va chạm bằng 0.
  - `prereg-j7-resume3.md` (22:56Z): chạy LẠI run22–23 sau reboot #36
    giết run22 lần 1 trong lúc chờ tải (E1 chưa chạy); đăng ký dừng ở
    đó nếu reboot nữa cắt ngang (không chạy lại lần thứ ba trong đợt).
  - **Lệch ngoài prereg (tự nhận):** lần chạy lại run22 (22:56:53Z)
    bắt đầu SAU KHI J9 đã đóng pha probe và đóng băng cây (~22:55Z) —
    J7 không đọc poll.log của J9 trước khi chạy lại, chỉ kiểm
    `round-in-progress.md` (vẫn tồn tại). Khi đọc được poll.log J9
    (đã đóng băng + đang chạy suite kiểm cây), J7 **dừng driver ngay**
    (~22:59:0x, đang chờ tải, E1 chưa chạy) để bảo vệ kiểm cây cuối.
    E1 run22 mồ côi vẫn tự chạy xong (xem §4.3) — dữ liệu của nó được
    dùng kèm đúng bối cảnh này, không giấu.

## 3. E1 run18–23 — kết quả đầy đủ

| Lần chạy | Bắt đầu (Z) | Exit | Pass | G5 run1 (mean/median) | G3→G4 | G4 tap/R | Tải trong cửa sổ G3→G4 | Kết cục |
|---|---|---|---|---|---|---|---|---|
| E1-18 | 21:16:40 | 2 | — (không report) | — | — (chưa tới G4) | — | — (vite chết trước) | ENOSPC, mount timeout 21:22:52 |
| E1-19 | 21:22:55 | 2 | — | — | — | — | — | ENOSPC, mount timeout 21:28:58 |
| E1-20 | 21:29:01 | 2 | — | — | — | — | — | ENOSPC, mount timeout 21:35:19 |
| E1-21 | 21:39:16 | 2* | — (không report) | — | 4,98s | true / 0,51 | load1 5,78 / load5 3,35 / threads-R 22 (1 mẫu) | G4 PASS trong log; chết SAU G4 do reboot #35 |
| E1-22 (lần 1) | 22:53:04 | — | — | — | — | — | — | Chết trong lúc chờ tải do reboot #36; E1 chưa chạy |
| E1-22 (lần 2) | 22:56:53 | 0† | 10/10 | 0,92 / 0,99 PASS | 2,79s | true / 0,51 | load1 ~0,6 / load5 ~0,9 (log E1; sampler chết) | 10/10 PASS đầy đủ; tải THẤP (tải đã dừng trước G4) |
| E1-23 | — | — | — | — | — | — | — | KHÔNG CHẠY (dừng sau run22) |

\* run21 exit=2 là exit của driver (E1 chết giữa chừng do reboot), không
phải exit của một lần chạy E1 hoàn chỉnh. † run22 lần 2 exit=0 là của
tiến trình E1 mồ côi tự chạy xong sau khi driver bị giết (xem §4.3).

- G5 run22: mean 0,92x / median 0,99 → PASS chắc ngay vòng 1
  (`certain=true`, `rounds=1`), `idleClass.mode=tải`, `slot0Fps=3,98`,
  0 slot đóng băng — nhưng là số tải THẤP, đừng trích làm tốc độ deint
  dưới tải nặng (xem §7). Baseline mean 7,87 fps.
- FPS slot run22: draw 3,98 / 3,95 / 8,64 / 8,67 / 8,49 / 8,95 / 9,05 /
  8,42 / 8,37 / 8,47 / 8,70 — nhanh gấp ~4–9 lần I6 (0,89–1,31 fps),
  đúng chữ ký máy yên/tải thấp. Run21: slot 0 draw 1,82, slot 1 draw
  0,29 (slot đóng băng duy nhất của đợt) — tải đang lên mạnh trong lúc
  chạy slot (load1 9,06→14,06).
- G7a run22 PASS (R 0,67 → 0,51, MAD=0,6903); G8 run22 PASS (BBB thật:
  R 0,55 → 0,52, MAD=1,5522); H9 0 lỗi trang. Run21 chết trước các gate
  này (chỉ tới slot 1).

### 3.1 Tải lúc G3→G4 từng lần (sampler 10 s + dòng log E1)

| Lần | load1 trong cửa sổ | load5 trong cửa sổ | threads-R | slot0Fps / drawFps | Đạt dial prereg? (load5 ≥8, slot0Fps ≤2) |
|---|---|---|---|---|---|
| E1-21 | 5,78 (1 mẫu 21:42:42Z; load1 đang tăng 0,36→5,78) | **3,35** | 22 | slot0 draw 1,82 | KHÔNG (load5 < 8) |
| E1-22 (lần 2) | ~0,6 (dòng log E1) | **~0,9** | — (sampler chết) | slot0Fps 3,98 | KHÔNG (cả 2) |

Đọc cùng §6: run21 là tải vừa đang lên (load5 3,35, load1 tăng mạnh),
run22 là tải thấp (tải đã dừng). Không lần nào đạt chuẩn tải nặng đầy đủ.

### 3.2 G3→G4 chia theo bước (từng lần, từ timestamp probe)

| Lần | G3→patchClip | patchClip→setEnhCheckbox | setEnh→setPlayhead | setPlayhead→waitIdle xong | waitIdle→G4 đọc | Tổng |
|---|---|---|---|---|---|---|
| E1-21 | 0,29s | 2,82s | 0,29s | 0,20s | 1,38s | 4,98s |
| E1-22 (lần 2) | 0,19s | 1,42s | 0,00s | 0,57s | 0,61s | 2,79s |
| **Đường khỏe (H6)** | ~0,05s | ~1,1–1,4s | ~0,01s | 0–0,51s | ~0,5s | 1,72–2,33s |
| **Tải nặng (I6)** | 0,40–1,40s | 2,17–4,50s | 0,01–1,43s | 0,08–2,00s | 0,73–1,48s | 4,00–8,30s |

- Run21 giống mẫu I6 (patchClip→setEnhCheckbox thừa nhiều nhất,
  +1,4s so với đường khỏe) nhưng waitIdle chỉ 0,20s — hook đã true
  ngay ở probe sau setEnhCheckbox, KHÔNG áp muộn như 4/6 lần I6.
- Run22 gần đường khỏe (2,79s, chỉ nhỉnh hơn trần 2,33s một chút) —
  đúng kỳ vọng khi tải đã dừng: patchClip→setEnhCheckbox 1,42s chỉ
  nhỉnh hơn đường khỏe ~0,1–0,3s. Hook true ngay ở probe sau
  setEnhCheckbox, không áp muộn.
- Cả 2 lần: store giữ `{"deinterlace":true}` suốt từ sau bấm tới G4
  đọc; 25/25 lần BẤM đều đưa store về đích; 0 lần KHÔNG-bấm.

## 4. G4 flake — 0 mới, bar chưa đạt

### 4.1 Tỉ lệ gộp (báo cả 2 số đã đăng ký)

| Nhóm | Lần E1 tới G4 | Flake | Ghi chú |
|---|---|---|---|
| Lịch sử tới I6 | 34 | 2 | 28 lần H6 trở về trước + 6 lần I6 tải nặng |
| Mới chặt-chỉ-report (run22) | 1 | 0 | 10/10, có report; tải THẤP |
| **Gộp chặt-chỉ-report** | **35** | **2** | **2/35 = 5,7% (Wilson [1,6%, 18,6%])** |
| Mới tính cả log-verdict (run21 + run22) | 2 | 0 | run21 G4 PASS trong log, không report |
| **Gộp tính cả log-verdict** | **36** | **2** | **2/36 = 5,6% (Wilson [1,5%, 18,1%])** |
| Trước đợt này | 34 | 2 | 2/34 = 5,9% (Wilson [1,6%, 19,1%]) |

- 0 flake mới không bác được tỉ lệ cũ: P(0/2 quan sát mới | tỉ lệ thật
  1/10) ≈ 81%. Để bác tỉ lệ 1/10 ở mức 95% vẫn cần ~29 lần 0 flake
  liên tiếp.
- **Bar prereg CHƯA ĐẠT:** cần 0 flake trên ≥7 lần E1 hoàn thành tới G4
  DƯỚI TẢI NẶNG ĐẦY ĐỦ — hiện vẫn chỉ 6 (I6). Run21 (load5 3,35) và
  run22 (load5 ~0,9) đều không đạt dial tải nên không tính vào bar.
  Đợt sau: chạy tiếp E1 tải nặng; chỉ tính lần nào đạt dial trong cửa
  sổ G3→G4 (load5 ≥ ~8 và slot0Fps ≤ ~2); cân nhắc kiểm dial TRƯỚC
  khi cho E1 chạy tới G3 (xem §6.3).

### 4.2 Run18–20 — chết trước G4 do ENOSPC (không phải flake)

- Cả 3 lần: vite dev lên (~10 s sau khi bật), rồi crash
  `Error: ENOSPC: System limit for number of file watchers reached`
  ngay sau khi ready (5–6 s); app không serve được → Chromium không
  mount được → harness timeout chờ app mount sau ~4,5 phút, exit 2,
  không report. Thời điểm timeout: run18 21:22:52Z, run19 21:28:58Z,
  run20 21:35:19Z (J9 đã kiểm lại khớp 100%).
- File bị watch khi crash (mỗi lần một file khác — điểm chết là lúc
  đăng ký watcher, không phải file cụ thể nào): run18
  `apps/web/src/components/nested/nestUtils.ts`; run19
  `apps/web/src/lib/ttsEstimate48D1.test.ts` (kèm esbuild deadlock sau
  đó); run20 `apps/web/src/lib/reversePlaybackRound39T6.test.ts`.
- Cơ chế va chạm (bằng chứng từ log J3 + log J7): J3 (nhóm nặng, cùng
  chờ 3 cờ nhóm yên) bật vite của nó trên :5590 lúc 21:17:12Z, lên
  21:17:15Z — đúng 1 phút trước vite J7 (21:18:15Z). Vite J3 chiếm
  watcher trước; vite J7 đăng ký sau chạm trần 63747. Lượt y1 của J3
  (vite lên 21:26:31Z) chồng lên run19 (21:24–21:29) và run20
  (21:30–21:35). Log J3 không có ENOSPC — J3 thắng cuộc đua watcher,
  J7 thua cả 3 lần. Đây là **lỗi hạ tầng phối hợp, không phải lỗi sản
  phẩm** — cùng mẫu ENOSPC đã làm chết 5/6 lượt I5 đợt 107.
- Bài học (đã áp dụng ở resume): luồng nặng không chạy vite chồng
  nhau; chờ cờ done của luồng nặng còn lại trước khi bật vite; cổng
  kiểm tra watcher tiền-chạy (retry/resume driver) đã chứng minh có
  ích — run21 và run22 lần 2 đều qua cổng với watcher 5/63747 và
  vite khỏe.

### 4.3 Run21 + run22 — G4 PASS, nhưng tải không đạt chuẩn

- **Run21 (retry sau ENOSPC):** vite khỏe (ready 2985 ms, không
  ENOSPC); app mount 21:41:55Z; G0/G1/G2/G3 PASS; **G4 PASS 21:42:45Z
  (R=0,51, tap=true)**; FPS slot 0 draw 1,82 / slot 1 draw 0,29
  (đóng băng); rồi **reboot #35 (21:42:41Z theo đồng hồ boot mới)**
  cắt ngang — E1 chết trong lúc chạy slot, không report. Lưu ý đồng
  hồ: dòng log cuối của run21 là 21:43:09Z, SAU giờ boot mới 21:42:41Z
  — vì đồng hồ boot #34 chạy nhanh so với đồng hồ boot #35 (hiện
  tượng đã biết: đồng hồ boot cũ chạy nhanh ~25–29 s, đợt này lệch
  tới ~28–88 s); thứ tự sự kiện thật là: G4 PASS → slot 1 → reboot.
  Boot_id đổi cc460738 → 26cbdc1e là bằng chứng reboot, không phải
  suy đoán.
- **Run22 lần 1:** driver chạy lại 22:53:04Z; đo load sau 60 s spin15
  (load1=1,83), đã thêm 4 spin — rồi **reboot #36 (22:53:56Z)** giết
  driver trong lúc chờ tải; E1 chưa bao giờ chạy.
- **Run22 lần 2 (mồ côi):** driver chạy lại 22:56:53Z theo prereg bổ
  sung #3/#4; E1 bật vite 22:58:28Z, lên 22:58:35Z. J7 đọc poll.log J9
  lúc ~22:59:0x (J9 đã đóng băng cây ~22:55Z + đang chạy suite kiểm
  cây cuối) và **giết driver + dừng tải ngay** (đang chờ tải xong,
  E1 vừa bật vite) để bảo vệ kiểm cây cuối. Nhưng giết driver shell
  KHÔNG giết tiến trình E1 con (node) — E1 mồ côi tự chạy tiếp, mount
  app 22:59:20Z, G0–G3 PASS, **G4 PASS 22:59:40Z**, FPS slot 0–10,
  G5/G7a/G8 PASS, H9 0 lỗi trang, **10/10 PASS, report ghi 23:01:06Z**,
  rồi tự thoát sạch (không còn vite/chrome/Xvfb/spin sót — đã kiểm
  23:05Z). J7 chờ 90 s cho nó tự xong thay vì giết ngay (quyết định
  tại chỗ, ghi ở đây): G4 + report đã ở trên đĩa, giết lúc đó chỉ
  mất dữ liệu mà không giảm được bao nhiêu rủi ro (tải đã dừng, chỉ
  còn 1 chrome + node; vite :5580 có thể va J9-O8 nhưng E1 sắp xong).
- **Vì sao run22 không tính vào bar:** tải (19 spin) đã bị J7 dừng
  lúc ~22:59:0x, TRƯỚC cửa sổ G3→G4 (22:59:37–40Z); load trong cửa sổ
  chỉ load1 ~0,6 / load5 ~0,9 (dòng log E1; sampler chết cùng driver
  nên không có mẫu 10 s trong cửa sổ); slot0Fps 3,98 > 2; drawFps
  3,95–9,05 (nhanh gấp ~4–9 lần I6). `idleClass.mode=tải` trong report
  là phân loại TƯƠNG ĐỐI (slot0 3,98 fps so với baseline của chính lần
  này 7,87 fps) — KHÔNG đủ làm bằng chứng tải nặng; dial tuyệt đối
  của prereg (load5 ≥ ~8, slot0Fps ≤ ~2) mới là chuẩn đếm, và run22
  trượt cả 2. Tương tự, run21 trượt load5 (3,35 < 8) dù load1 trong
  cửa sổ đã lên 5,78.

## 5. Keydown chậm tự nhiên — gộp toàn bộ (kỷ lục không đổi)

| Nguồn | Lần chạy | Slot | Toggle | Wait chậm nhất | Retry / fallback / abort |
|---|---|---|---|---|---|
| E8 gộp | 22 | 319 | 638 | 804ms | 0 / 0 / 0 |
| Đợt 104 (F8 + F1) | 18 | 242 | 484 | 1004ms | 0 / 0 / 0 |
| Đợt 106 H6 | 9 | 110 | 220 | 213ms | 0 / 0 / 0 |
| Đợt 107 I6 | 6 | 66 | 132 | 2197ms | 0 / 0 / 0 |
| **Đợt 108 J7 (mới, chỉ run22)** | **1** | **11** | **22** | **291ms** | **0 / 0 / 0** |
| **Tổng** | **56** | **748** | **1496** | **2197ms** | **0 / 0 / 0** |

- Lần mới: E1 run22 ×1 (11 slot, 22 toggle). Chậm nhất là playWait
  291ms (slot 0); pauseWait chậm nhất 63ms. Toàn `space`, 0 dòng
  retry/fallback trong log. Run21 không có report nên đóng góp 0 slot
  (không giấu — ghi rõ ở đây).
- Kỷ lục 2197ms (I6, dưới tải) không đổi. Run22 tải thấp nên chờ nhanh
  (max 291ms) — đúng kỳ vọng: 2 kỷ lục cao nhất (2197ms, 1004ms) đều
  dưới tải nặng. Biên an toàn vẫn 2,3× so với timeout 5000ms.
  Fallback #2 **vẫn mở**.

## 6. Tải nặng — cách tạo, cách đo, và độ lệch so với prereg

- Cách tạo tải (script `make-load-j7.sh`, copy `make-load-i6.sh`):
  N tiến trình Python busy-loop (`while True: pass`) chạy nền suốt mỗi
  lần E1, dừng sau mỗi lần. Bắt đầu N=15; driver đo load1 sau 60 s,
  nếu load1 < 14 thì thêm 4 spin (thành 19) rồi đo lại — giữ đúng thủ
  tục I6 để so sánh được; ĐÁNH GIÁ tải bằng dial mới (load5 + thread
  đang chạy + fps slot), không dùng load1.
- **Độ lệch 1 — bộ tạo tải busy-loop KHÔNG tạo được tải trong đợt này.**
  Sau 60 s spin15: run18 load1=5,68; run19 load1=1,27; run20 load1=
  7,18; run21 load1=0,29; run22 lần 1 load1=1,83; run22 lần 2 load1=
  1,14. Cùng một thủ tục, I6 đo được load1 5–23 sau 60 s. Các spin bị
  throttle gần như hoàn toàn lúc đầu (threads-R vẫn 17–32 — tiến trình
  tồn tại nhưng không được cấp CPU), rồi nới dần theo phút (run21:
  load1 0,29 → 5,78 → 9–14 trong lúc chạy slot). Nguyên nhân có thể là
  throttle ở cgroup/host (cell 1,5 CPU chia sẻ) sau thời gian dài máy
  chạy nặng liên tục (J3 + J9 + các lượt J7 trước đó) — không chứng
  minh được cơ chế chính xác, chỉ ghi hiện tượng: **load1 sau 60 s
  không còn là chỉ số đáng tin cho "đã đủ tải"**.
- **Độ lệch 2 — load5 trong cửa sổ G3→G4 không đạt mục tiêu ở cả 2 lần
  tới G4** (run21 3,35; run22 ~0,9; mục tiêu ≥ ~8). Một phần là trễ
  trung bình 5 phút (tải mới chạy ~3,5 phút tới lúc G3→G4); phần lớn
  là do độ lệch 1 (spin bị throttle nên load5 không lên được). Dial đã
  làm đúng việc của nó: bắt được 2 lần "tưởng tải nặng nhưng thật ra
  chưa" — nếu chỉ nhìn load1 tức thời hoặc `idleClass`, đã tính sai
  vào bar.
- **Độ lệch 3 — `idleClass.mode=tải` KHÔNG đủ làm bằng chứng tải
  nặng.** Run22 được report phân loại `tải` (slot0Fps 3,98 so với
  baseline 7,87 fps của chính lần này) trong khi load tuyệt đối chỉ
  load5 ~0,9. Phân loại này là tương đối theo lần chạy; dial tuyệt
  đối của prereg (load5 + slot0Fps) mới là chuẩn đếm. Đừng trích
  `idleClass=tải` của run22 làm bằng chứng tải nặng.
- **Bài học cho đợt sau:** (a) kiểm dial tải TRƯỚC khi cho E1 chạy
  tới G3 (ví dụ: yêu cầu load5 ≥ ~8 lúc bắt đầu E1, nếu không thì chờ
  thêm / tăng thời gian settle / bỏ lần đó thay vì chạy rồi mới biết
  tải thiếu); (b) cân nhắc bộ tạo tải khác busy-loop thuần (I/O-bound
  hoặc sleep-ngắt quãng) nếu throttle còn tái diễn; (c) xếp lượt vite
  của các luồng nặng không chồng nhau (ENOSPC §4.2) và chờ cờ done
  thật của luồng còn lại — nhưng cờ phải được tạo (J3 quên tạo cờ là
  lỗi phối hợp riêng, xem §8).
- Tải đã dừng sạch sau mỗi lần (không còn tiến trình spin sau driver;
  lần dừng cuối: J7 dừng tay lúc ~22:59:0x + kiểm lại 23:05Z: 0 spin,
  0 vite, 0 chrome, watcher 6/63747).

## 7. G5 — số tải thấp, không phải tốc độ deint dưới tải nặng

- G5 run22: mean 0,92x / median 0,99 → PASS chắc ngay vòng 1. Nhưng
  lần này tải đã dừng trước G4 (load 0,6→0,3 trong lúc chạy slot) —
  đây là số tải THẤP, gần với đường yên hơn là đường tải nặng. Đừng
  trích làm hiệu năng deint dưới tải nặng (cùng caveat I6 §7, nhưng
  ngược chiều: I6 cảnh báo số tải, J7 cảnh báo số này cũng không phải
  số yên sạch vì tải đang được gỡ dần trong lúc đo).
- Run21 không có G5 (chết trước khi chạy slot xong).

## 8. Reboot — #35 và #36, mỗi cái cắt ngang một lần chạy

- **Reboot #35 = 2026-11-13 21:42:41Z** (boot_id cc460738 →
  26cbdc1e). Gap #34→#35 = **1h08'24"**. Cắt ngang run21 sau G4 PASS
  (E1 chết trong lúc chạy FPS slot; log cuối 21:43:09Z theo đồng hồ
  boot #34 chạy nhanh — xem §4.3). Watcher của J7 chết theo (SIGTERM
  lúc shutdown).
- **Reboot #36 = 2026-11-13 22:53:56Z** (boot_id 26cbdc1e →
  ab33c58f). Gap #35→#36 = **1h11'15"**. Cắt ngang run22 lần 1 trong
  lúc chờ tải (E1 chưa chạy). Watcher của J7 chết theo. J9 ghi nhận
  cả 2 gap đều nằm trong dải cơ học suy ra từ J8.
- Lưu sớm đã thực hiện: log append sau mỗi lần E1 (run-j7.log ghi đủ
  run18–20; run-j7-retry.log ghi run21; run-j7-resume.log ghi run22
  lần 1 + lần 2); report JSON + load sample trên đĩa sau mỗi lần (trừ
  run22 lần 2: sampler chết cùng driver, chỉ còn 3 mẫu). Không mất dữ
  liệu G4 nào do reboot (G4 run21 + run22 đều đã ghi log trước khi
  chết/dừng).
- **Phối hợp cờ:** cờ nhóm yên đủ 3/3 lúc 21:16:40Z (j4, j5, j6 — j5
  về cuối); J7 + J3 (nhóm nặng) cùng bắt đầu sau đó → va chạm ENOSPC
  (§4.2). Cờ `round108-j3-done` KHÔNG BAO GIỜ xuất hiện dù J3 xong
  việc từ 21:51Z (LIMITS + batch ~22:11Z, J9 kiểm xong 22:1xZ) — J3
  quên tạo cờ; J9 không tự tạo hộ ("đó là tín hiệu của J3"). J7 chờ
  đủ 60 phút (tới 22:50:14Z) rồi chạy theo prereg bổ sung #3. J9 ghi
  nhận 22:53Z rằng tất cả 8 luồng đã kết thúc (J7 về với 0 lần hoàn
  thành mới, chưa LIMITS) và chuyển sang kiểm cây gộp cuối đợt; J9
  đóng băng cây ~22:55Z. J7 chạy lại run22 lần 2 lúc 22:56:53Z mà
  không đọc poll.log J9 trước — đã dừng driver ngay khi đọc được
  (~22:59:0x); E1 mồ côi tự chạy xong (§4.3). Đây là lỗi phối hợp của
  J7, ghi rõ để đợt sau: **luồng đo phải đọc poll.log của luồng verify
  trước khi chạy lại sau reboot, không chỉ kiểm round-in-progress.md.**

## 9. Giới hạn — đọc trước khi trích số

1. **Bar prereg CHƯA ĐẠT** — chỉ 6 lần hoàn thành tới G4 dưới tải nặng
   đầy đủ (I6); run21 + run22 là G4 PASS nhưng trượt dial tải (§4.3).
   Đừng trích "đã đủ 7 lần" hay "flake đã hết" — Wilson 95% vẫn
   ~2–19% (2/35) / ~2–18% (2/36).
2. **0 flake mới không phải bằng chứng tỉ lệ đã giảm** (§4.1) —
   P(0/2 | tỉ lệ thật 1/10) ≈ 81%. Cơ chế flake vẫn chưa biết; dữ liệu
   đợt này chỉ nói thêm: G4 PASS cả khi tải vừa (run21, gap 4,98 s,
   hook không áp muộn) lẫn khi tải thấp (run22, gap 2,79 s).
3. **Run22 là dữ liệu mồ côi, tải đã dừng** — G4/G5/keydown của nó
   không được trích làm số tải nặng; chỉ dùng cho tỉ lệ G4 chung và
   keydown gộp (với ghi chú tải thấp). Việc J7 dừng tải chủ động giữa
   lần chạy là lệch khỏi thiết kế đo (đã ghi lý do §4.3).
4. **Keydown gộp 56 lần vẫn chưa có lần fallback #2 tự nhiên nào** —
   0/1496 toggle không chứng minh fallback #2 không bao giờ bắn; biên
   an toàn vẫn 2,3× (kỷ lục 2197 ms dưới tải nặng, I6).
5. **Run18–20 là lỗi hạ tầng ENOSPC, không phải flake G4** — nhưng
   chúng cho thấy vite của 2 luồng nặng chạy chồng nhau sẽ giết nhau
   bằng trần watcher 63747; tăng max_user_watches ở cấp hệ thống vẫn
   là nợ mở (ngoài phạm vi luồng đo).
6. **`idleClass=tải` không đồng nghĩa tải nặng** (§6 độ lệch 3) —
   đừng trích nhãn này của run22 làm bằng chứng tải.
7. `tsc` / `vite build` không chạy lại: J7 không đổi production code
   (harness md5 không đổi một byte) — theo tiền lệ I6 §9.7; `node
   --check` script harness PASS; các lần chạy đều mount app thành công
   qua vite dev (trừ run18–20 chết vì vite crash ENOSPC, không phải
   lỗi cây). TTS 39 CẤM kiểm lại (không kiểm); birefnet 0 lần thành
   công (không thử); ci-security.yml vẫn 403 chờ user (ngoài phạm vi).

## 10. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND108_J7_HARNESS_LIMITS.md` (file này) — mới.
- Harness KHÔNG đổi: `apps/web/scripts/clicktest-77e1-deint-fps.mjs`
  md5 giữ nguyên `ae6cd34a7dff3f6bda62199b5ab6c6fc`; `preview.tsx` giữ
  nguyên `ced42efd785724c8c0d1b16fc32c7341`.
- Log + dữ liệu: `hidden_files/round108-j7/` (`prereg-j7.md`,
  `prereg-j7-retry.md`, `prereg-j7-resume.md`, `prereg-j7-resume2.md`,
  `prereg-j7-resume3.md`, `run-j7.sh`, `run-j7-retry.sh`,
  `run-j7-resume.sh`, `make-load-j7.sh`, `analyze-j7-g4-keydown.py` +
  `analyze-j7.txt`, `poll-j7.log`, `wait-j3.log`,
  `run-j7.log`, `run-j7-retry.log`, `run-j7-resume.log`,
  `e1-run18..22/` + `-run.log`, `load-j7-run18..22.txt` — lưu ý
  `load-j7-run22.txt` chỉ có 3 mẫu (sampler chết cùng driver);
  `load-j7-run21.txt` đầy đủ tới lúc reboot #35).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round108-j7-harness.txt`
  (NUL, đọc lại sau khi ghi).

```bash
# Chạy lại E1 dưới tải nặng với harness đã thêm probe (nhớ chờ cờ nhóm
# yên + cờ luồng nặng còn lại TRƯỚC — xem prereg-j7.md và bài học §8;
# đọc poll.log của luồng verify trước khi chạy lại sau reboot):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j7/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Tổng hợp lại G4 + keydown từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j7/analyze-j7-g4-keydown.py
# Lần flake tới: đọc các dòng "G4-probe" trong e1-runX-run.log — bước
# nào ăn thời gian / store-hook lệch nhau sẽ hiện rõ ở đó.
```

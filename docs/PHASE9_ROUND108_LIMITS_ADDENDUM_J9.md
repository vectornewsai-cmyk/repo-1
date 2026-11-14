# Đính chính LIMITS gộp đợt 108 (theo J9 + kiểm chứng độc lập K8 đợt 109)

> Luồng K8, đợt 109 (lượt cron 06:35 +07 14/11/2026). File này CHỈ đính chính
> `docs/PHASE9_ROUND108_LIMITS.md` — KHÔNG sửa file đó tại chỗ (giữ nguyên lịch sử).
> Mọi điểm dưới đây do K8 kiểm chứng ĐỘC LẬP từ dữ liệu thô trên đĩa bằng script viết
> mới (`hidden_files/round109-k8/k8-recount-j7.py`, `k8-recount-j3-full.py`), không
> dùng lại code đếm của J9 hay analyzer của J3/J7. Số nào K8 tự tính lại được thì ghi
> "K8 XÁC NHẬN"; không có điểm nào ở mức "chưa kiểm chứng độc lập" trong file này.
> KHÔNG sửa production, KHÔNG push, KHÔNG release/tag.

## 0. Tóm tắt

LIMITS gộp đợt 108 của parent được viết từ dữ liệu J9 TRƯỚC khi J7 về muộn (late merge
23:13Z) nên 3 điểm về J7 trong đó là số TRƯỚC đợt / stale; cộng 1 điểm về J3 (§4 mục 5
ghi "14 gap CDP" — số cũ chưa trừ sentinel). **Verdict các luồng KHÔNG đổi:**
bar E1 ≥7 lần vẫn CHƯA ĐẠT (vẫn 6/7); gate (b) vẫn QUAN SÁT ĐƯỢC 3/4 lượt (dạng yếu);
B-band, Ghost, re-arm, 2 MiB, EPERM không bị ảnh hưởng. Chỉ số đếm và nhãn mới là sai.

## 1. J7 — "run22–23 không chạy" là SAI

- **Chỗ sai:** `PHASE9_ROUND108_LIMITS.md` §1 bullet J7: "run22–23 không chạy (J7 timeout
  chờ cờ round108-j3-done không bao giờ xuất hiện, dừng resume theo đúng prereg đã đăng
  ký)"; §2 bullet "Lỗi phối hợp cờ": "J7 timeout 22:50:14Z, dừng resume, 0 lần E1 hoàn
  thành mới".
- **Số đúng:** run22 lần 2 (mồ côi) **ĐÃ CHẠY XONG 10/10, G4 PASS**, report ghi
  23:01:06Z. Chỉ run22 lần 1 (chết do reboot #36 trong lúc chờ tải, E1 chưa chạy) và
  run23 là không chạy.
- **Bằng chứng (K8 XÁC NHẬN):**
  - `hidden_files/round108-j7/e1-run22/c77e1-headed-report.json` — `pass=10, total=10`,
    mtime file `2026-11-13 23:01:06.877Z`; `fpsSlots` 11 slot; `g5Verdict` mean 0,92 /
    median 0,99 PASS.
  - `hidden_files/round108-j7/e1-run22-run.log` dòng 29–30: `[22:59:40.063Z] G4 progressive
    + deint BẬT: R=0.51, hook tap=true`; dòng 86: `[23:01:06.878Z] KẾT QUẢ HEADED D4:
    10/10 pass`. Dòng đầu log 22:58:28Z (vite :5580 lên) — thuộc lần 2; driver lần 2
    bắt đầu 22:56:53Z theo `run-j7-resume.log` (boot ab33c58f, sau reboot #36).
  - Run22 lần 1: driver bắt đầu 22:53:04Z (`run-j7-resume.log`), reboot #36 22:53:56Z
    giết driver trong lúc chờ tải; không có dòng E1 nào trước 22:56:53Z — E1 chưa chạy.
  - Run23: không có thư mục `hidden_files/round108-j7/e1-run23/` — chưa chạy.
- **Hệ quả:** có **1 lần E1 hoàn thành mới** trong đợt (run22 lần 2), không phải 0.
  Nhưng lần này tải THẤP (load5 ~0,9, slot0Fps 3,98 — trượt cả 2 dial prereg) nên
  KHÔNG tính vào bar ≥7 lần tải nặng — bar vẫn 6/7, CHƯA ĐẠT (verdict không đổi).
  LIMITS J7 gốc (§3, §4.1) đã ghi đúng điểm này; chỉ LIMITS gộp viết sai.

## 2. J7 — "chặt-chỉ-report 2/34 = 5,9%" là số TRƯỚC đợt

- **Chỗ sai:** §1 bullet J7: "G4 flake gộp: 2/35 = 5,7% (Wilson [1,6%, 18,6%]);
  chặt-chỉ-report 2/34 = 5,9%"; §4 mục 9: "G4 flake gộp 2/35 = 5,7%
  (chặt 2/34 = 5,9%)".
- **Số đúng:** 2/34 = 5,9% là tỉ lệ LỊCH SỬ trước đợt (tới I6). Sau đợt:
  - Chặt-chỉ-report (lịch sử 2/34 + run22 0/1): **2/35 = 5,7%**, Wilson 95%
    [1,6%, 18,6%].
  - Tính cả run21 (G4 PASS trong log, không report): **2/36 = 5,6%**, Wilson 95%
    [1,5%, 18,1%].
  - Con số 2/35 = 5,7% trong LIMITS gộp tự nó ĐÚNG, nhưng nhãn "chặt-chỉ-report 2/34"
    đi kèm là sai — 2/34 không phải số sau đợt.
- **Bằng chứng (K8 XÁC NHẬN):**
  - Lịch sử 2/34: `docs/PHASE9_ROUND107_I6_HARNESS_LIMITS.md` dòng 18 ("Tỉ lệ gộp nay
    là **2/34 = 5,9%**") và dòng 157 — đúng là số cuối đợt 107, trước đợt 108.
  - Run22 0 flake / 1 lần có report: report 10/10 ở mục 1 trên; run21 G4 PASS trong
    log 21:42:45.084Z (`hidden_files/round108-j7/e1-run21-run.log` dòng 29, R=0,51,
    tap=true), thư mục `e1-run21/` KHÔNG có file report — đúng "G4 PASS trong log,
    không report".
  - Tính lại Wilson (script K8, z=1,96): 2/35 → [1,6%, 18,6%]; 2/36 → [1,5%, 18,1%];
    khớp đúng số LIMITS J7 §4.1 đã ghi.

## 3. J7 — "Keydown gộp 55/737/1474" là số TRƯỚC đợt

- **Chỗ sai:** §1 bullet J7: "Keydown gộp: 55 lần / 737 slot / 1474 toggle, max 2197 ms
  (run22 đóng góp 11 slot, max 291 ms)"; §4 mục 9: "Keydown chậm gộp 55 lần / 737 slot
  / 1474 toggle, max 2197 ms".
- **Số đúng sau đợt:** **56 lần / 748 slot / 1496 toggle, max 2197 ms** (kỷ lục không đổi).
  Run22 đóng góp **11 slot / 22 toggle / max 291 ms** (playWait max 291 ms slot 0,
  pauseWait max 63 ms).
- **Bằng chứng (K8 XÁC NHẬN):**
  - Lịch sử 55/737/1474: `docs/PHASE9_ROUND107_I6_HARNESS_LIMITS.md` dòng 40–41
    ("Gộp toàn bộ: **55 lần / 737 slot / 1474 toggle, max 2197ms**") và dòng 217
    (bảng tổng) — số cuối đợt 107.
  - Run22 từ report thô: 11 `fpsSlots`; playWaitMs [291, 217, 15, 50, 29, 150, 92, 5,
    37, 50, 45] → max 291; pauseWaitMs max 63; 11 slot × 2 toggle = 22 toggle.
    Cộng: 55+1=56, 737+11=748, 1474+22=1496.
  - Số trong LIMITS gộp tự mâu thuẫn nội bộ: đã ghi "run22 đóng góp 11 slot" nhưng tổng
    vẫn giữ nguyên 737 slot của trước đợt (737+11=748 mới đúng).
  - LIMITS J7 gốc §5 và `hidden_files/round108-j7/analyze-j7.txt` (dòng cuối) đã ghi
    đúng 56/748/1496; chỉ LIMITS gộp viết sai.

## 4. J3 — CDP đúng 12 gap, không phải 14 (sentinel e4skip=-1)

- **Chỗ sai:** §4 mục 5: "không cần lặp lại lượt tải nặng (đã đủ 14 gap CDP)". Số 14 là
  số của LIMITS J3 gốc (§3.1: R0 8 + R1 6), chưa trừ gap sentinel. (§2 của chính LIMITS
  gộp đã ghi đúng đính chính J9 này — §4 mục 5 chưa cập nhật theo, nên hai chỗ trong
  cùng một file mâu thuẫn nhau.)
- **Số đúng:** CDP đạt bar **R0 7 (không phải 8), R1 5 (không phải 6), R2 0, R3 0 —
  gộp 12 (không phải 14)**.
- **Bằng chứng (K8 XÁC NHẬN, tính lại từ `cdp-samples.jsonl` thô):**
  - R0: e4skip = -1 ở idx 0–24, giá trị hợp lệ đầu = 1 tại idx 25. Gap CDP đầu đạt bar
    (317 ms, Δph=0,500, Δdraws=0, Δe4skip=2) là cặp idx 24→25 — Δe4skip=2 là số học
    của sentinel (-1→1), không phải skip thật. Loại gap này: 8→7. 7 gap còn lại đều
    có e4skip-trước ≥ 1.
  - R1: e4skip = -1 ở idx 0–6, giá trị hợp lệ đầu = 1 tại idx 7. Gap đầu (385 ms,
    Δph=1,867, Δe4skip=2) là cặp idx 6→7 — cùng lỗi sentinel. Loại gap này: 6→5.
  - Đếm lại toàn bộ 4 lượt bằng rule bar CDP của J3 (recv-gap >300 ms, Δph ≥ 0,7×gap,
    Δdraws=0, Δe4skip>0): thô 8/6/0/0 = 14; trừ sentinel 7/5/0/0 = 12. Khớp đúng
    recount của J9 (`hidden_files/round108-j9/recount-j3.txt` §4).
- **Hệ quả:** verdict "gate (b) quan sát được 3/4 lượt" KHÔNG đổi (12 gap CDP vẫn đủ,
  cộng 33 gap in-page).

## 5. J3 — "0 trusted" là SAI theo chính đính chính prereg của J3

- **Chỗ sai:** LIMITS J3 gốc §3.5 ghi "0 gap trusted" (guard bracket ≤300 ms, G2 cũ).
  LIMITS gộp §2 đã ghi đúng đính chính này; ghi lại ở đây để đủ bộ và vì §4 mục 5
  không nhắc tới.
- **Số đúng (K8 XÁC NHẬN):** theo đính chính prereg J3 §1.3 (spread test tin khi
  n_inside ≥ 2; guard bracket chỉ áp cho draws-check), trusted-ĐC = **R0 9/13, R1 12/19,
  R2 1/1, gộp 22/33** (không phải 0). distinct_strict ≥ 2 = 0 ở mọi lượt (KHỚP với J3)
  nên caveat "dạng yếu" vẫn đứng — chân in-page mạnh hơn J3 báo, nhưng vẫn là 1 bước
  trung gian.
- **Bằng chứng:** đếm lại từ 4 file `chr-mixedalt-j3y*-analysis.txt` (292 dòng draws-gap;
  bar = skips>0 + spread=True; trusted-ĐC = bar và n_inside ≥ 2): R0 13 bar / 9 trusted-ĐC;
  R1 19 / 12; R2 1 / 1; R3 0 / 0; gộp 33 / 22. trusted-old (bracket ≤300 ms) = 0 đúng như
  J3 ghi. Khớp đúng recount J9.

## 6. J3 — freeze 4990 ms là THẬT nhưng PRE-PLAY; bar ±50 ms không đạt lượt nào

- **Chỗ cần sửa khung diễn giải:** LIMITS J3 §3.3/§4.1: "worker thấy cùng freeze 4990 ms
  (chênh 88 ms)" — đọc như freeze trong lúc phát. LIMITS gộp §2 đã ghi đúng đính chính;
  ghi lại ở đây để đủ bộ.
- **Số đúng (K8 XÁC NHẬN):** worker r-gap lớn nhất R1 = **4990 ms, w-gap 12 ms, cửa sổ
  relPlay [-292, +4698]** — bắt đầu TRƯỚC lúc phát (relPlay -292 ms), tức freeze lúc
  bắt đầu phát, không phải freeze trong lúc phát. Freeze lớn nhất TRONG lúc phát ở R1
  là **1774 ms** (relPlay [7326, 9100]). CDP gap dài nhất R1 (5078 ms) là cặp mẫu đầu
  tiên (idx 0→1, Δph=0, Δe4skip=0) — cùng freeze lúc bắt đầu phát, KHÔNG đạt bar.
- **Top-diff CDP-max vs worker-max-in-play (K8 XÁC NHẬN):** R0 4896−2488 = **2408 ms**;
  R1 5078−1774 = **3304 ms**; R2 1136−483 = **653 ms**; R3 413−300 = **113 ms**.
  Bar prereg ±50 ms cho thỏa thuận gap lớn nhất **KHÔNG đạt ở lượt nào** (J3 §4 đã tự
  ghi nhận; so sánh max là metric sai cho 2 sampler có cửa sổ khác nhau — không dùng lại).
- **Bằng chứng:** tính lại từ `chr-mixedalt-j3y1-fr4/frame-parity-results.json`
  (`workerTicks`, `playT0rel=121799`): r-gap max toàn lượt 4990 ms tại relPlay [-292, 4698];
  r-gap max có r_lo ≥ playT0rel là 1774 ms. R0/R2/R3 tính cùng cách, khớp số J9.

## 7. Những gì KHÔNG sai (đã kiểm lại, để tránh sửa thừa)

- J7: run18–20 chết ENOSPC (timeout 21:22:52Z / 21:28:58Z / 21:35:19Z) — khớp
  `analyze-j7.txt`. Run21 G4 PASS 21:42:45Z, chết sau G4 do reboot #35 — khớp log.
  Reboot #35 21:42:41Z, #36 22:53:56Z — khớp `uptime -s` và J9 §3.
- J7: Wilson 2/35 [1,6%, 18,6%] và 2/36 [1,5%, 18,1%] trong LIMITS J7 gốc là đúng;
  chỉ LIMITS gộp gán nhãn sai (mục 2 trên).
- J3: in-page 33/292 (R0 13, R1 19, R2 1, R3 0), CDP thô 14, f4y3 21/23 burst,
  worker 0 stall — khớp dữ liệu thô; chỉ 3 đính chính ở mục 4–6 là cần sửa.
- J9: recount-j7/j3 của J9 khớp 100% với tính lại của K8 trên cả 6 nhóm số (J7: run22
  10/10 + keydown + flake; J3: CDP 12, trusted-ĐC 22/33, 4990 ms pre-play, top-diff
  4 lượt). J9 không sai điểm nào trong các điểm K8 kiểm lại.

## 8. Hồ sơ kiểm chứng (chạy lại)

```bash
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-recount-j7.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-recount-j3-full.py
```

Dữ liệu thô: `hidden_files/round108-j7/` (report + log run21/run22, `analyze-j7.txt`),
`hidden_files/round108-j3/` (`cdp-samples.jsonl` + `frame-parity-results.json` 4 lượt +
4 file `*-analysis.txt`), `hidden_files/round108-j9/recount-j3.txt` (đối chiếu),
`docs/PHASE9_ROUND107_I6_HARNESS_LIMITS.md` (lịch sử trước đợt).

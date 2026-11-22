# PHASE9_ROUND146_T4_WEBKIT_QUIET21_LIMITS.md

**Đợt:** 146. **Luồng:** T4 — lượt yên WebKit #21. **Ngày:** 19/11/2026.
**Boot đo:** 98a7c93f (btime 09:54:03Z) — **reboot #34 giữa lượt** → 6fb582df
(btime 12:13:26Z), giết finalization attempt3. **Cây:**
`apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở poller, lúc attempt1/2/3,
lúc đóng trên boot mới — không đổi). **Trạng thái: KHÔNG CÓ LƯỢT YÊN #21
HỢP LỆ — cả 3 attempt đều fail tickCost median (99,0 / 101,0 / 97,0 ms
> 60 ms); ngân sách 3/3 đã dùng hết.**

## 0. Verdict tổng

- **Attempt1-98a7c93f (11:59:13–12:03:07Z): 20/20 exit 0, lớp B ĐẠT 5/5,
  NHƯNG tickCost median 99,0 ms (n=411; post-flip 100,0; p90 137,0; max 281;
  min 53) > 60 ms → KHÔNG ĐẠT tiêu chí lượt yên.** (c2)=0.
- **Attempt2-98a7c93f (12:06:24–12:10:24Z): 20/20 exit 0, NHƯNG lớp B VI
  PHẠM B2 (load1_max=4,67 > 4) VÀ tickCost median 101,0 ms (n=398;
  post-flip 102,0) > 60 ms → KHÔNG ĐẠT.** (c2)=0. Poller tự retry theo luật
  lop-B-vi-pham.
- **Attempt3-98a7c93f (probe 12:11:13–12:13:13Z): probe 20/20 hoàn tất
  (partial JSON 20/20, JSON 2.399.927 B, passes=20), lớp B hậu kiểm cửa sổ
  probe ĐẠT 5/5, NHƯNG tickCost median 97,0 ms (n=425; post-flip 98,5)
  > 60 ms → KHÔNG ĐẠT.** (c2)=0. Finalization (classb + analyzer) bị
  reboot #34 giết — đã chạy hậu kiểm bằng tay (xem §5).
- **Số cộng dồn (c2) KHÔNG ĐỔI (vẫn 17 lượt hợp lệ):** P1 **51/51**, P2
  **42/42**, P3-A1 **46/51**, P3' **23/23**, P7 **37/37**. Chuỗi median 17
  lượt giữ nguyên 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 ms. Ba
  median đợt này (99,0 / 101,0 / 97,0) đều đứng ngoài chuỗi. **Lần đầu
  tiên trong 18 lượt: không có attempt nào đạt.** Điều tra (c2) vẫn ĐÓNG,
  verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên — 0 occurrence
  không ủng hộ cũng không bác (không có bằng chứng mới).
- **Chậm là hệ thống, không phải tải:** attempt3 chạy YÊN (load1
  0,71–1,54 cả lượt, RAM 2.252–3.582 MB) vẫn median 97 ms; tương quan
  Pearson median~load1 r=−0,12 (A3), r=0,23 (A1), r=0,48 (A2 — chỉ mô tả);
  min tick 52–54 ms (so với 31 ms ở #20); rAF/pass median 25–26 (so với
  32 ở #20); BlendTick/pass 16,6–17,6 (so với 20,2). Chậm đều khắp các
  pass, các dải wall, cả 3 attempt (~1,7× so với #20). Nghi boot/host
  98a7c93f — cần quyết parent / điều tra (xem §10). F6' ĐÓNG cả 3 attempt
  (skipLatest pixel-verified 100%).
- **Không có gì T4 tự quyết thêm được đợt này.** Ngân sách 3/3 đã hết;
  không chạy attempt4. Nợ chờ quyết parent: xem §10.

## 1. Vá poller trước khi đo (quyết parent đợt 145 (o): F-145-T4-2)

Tái dùng script đợt 145 (đổi 145→146, hạn cắt poller 13:45Z, cờ T5 chính
round146-t5, dự phòng round145-t5). Vá F-145-T4-2 — loại trừ chuỗi
`vite.config.ts` (md5sum-arg của shell T2) khỏi bộ đếm blockers, bằng
cách khớp tên process thay vì chuỗi con:

- **Luật mới (argv0-based):** đếm khi argv0 (token đầu của args) là
  node/vite và args chứa vite|probe116t5|probe115r5|probe114q5|webkit|
  WebProcess|MiniBrowser; hoặc comm/argv0 khớp MiniBrowser/WebProcess/
  WebKit. Loại trừ riêng: dòng có `md5sum ... vite.config.ts` hoặc
  comm == md5sum. Giữ số đếm chuỗi con cũ làm THAM CHIẾU (giống B4 đợt
  145). B2-display trong check-classb cũng loại trừ dòng md5sum.
- **Phát hiện khi kiểm chứng (F-146-T4-2):** comm của node là
  `"MainThread"`, KHÔNG phải `"node"` — luật comm-only ban đầu bỏ sót
  vite thật. Test poll 11:39:12Z (luật comm-only): blockers=0 trong khi
  T8 đang chạy vite (legacy=4). Đã sửa sang argv0 TRƯỚC khi đo thật.
- **Kiểm chứng bằng test poll (POLL_TEST=1) với đối chứng âm + dương:**
  - Đối chứng ÂM: shell tái hiện đúng T2-145 (`bash -c '... md5sum ...
    vite.config.ts ...'`) + node giả `node -e ... vite-fake-server`.
  - Test 11:41:11Z (luật argv0): **blockers=6** (5 process thật của T8:
    clicktest node, vite :5560, MiniBrowser, WebKitNetworkProcess,
    WebKitWebProcess + node giả) — **legacy=8** (đếm thêm shell md5sum +
    con md5sum). File `blockers-list-TEST146.txt` chứa đúng 6 dòng thật,
    **0 dòng `vite.config.ts`** — shell md5sum đã loại đúng.
  - `bash -n` OK cả 5 script; analyzer parse OK. Cờ T5 round146-t5 đã
    PASS cho boot 98a7c93f ngay từ test đầu (không cần check-only dự
    phòng đợt này).

## 2. Poller — 24 poll lượt 1 + mở cửa ngay lượt 2 + reboot #34

| Lượt poller | Poll | Thời gian | Kết quả |
|---|---|---|---|
| Test (POLL_TEST=1) | #1 | 11:39:12Z | blockers=0 (luật comm-only cũ, legacy=4) — ĐÃ SỬA sau đó |
| Test (POLL_TEST=1) | #1 | 11:41:11Z | blockers=6 (luật argv0 mới, legacy=8) — VÁ ĐÚNG |
| 1 (pid 25759) | #1–#24 | 11:41:35–11:59:10Z | Cửa mở poll #24, chạy attempt1 |
| 2 (pid 33700) | #1 | 12:06:24Z | Cửa mở ngay, chạy attempt2; retry → attempt3 |
| 2 | — | 12:13:26Z | **Reboot #34 giết poller giữa finalization attempt3** |

- Poller 1: 24 poll. Đầu lượt: lock T8 (vite :5560, pid 24173) +
  blockers=5 + load cao (load1 7,60/load5 3,02 lúc test 11:41, RAM
  1.103 MB) do clicktest T8 đang chạy; load5 decay dần 3,78 → 1,76,
  RAM 1.103 → 5.958 MB; lock hết + blockers=0 từ ~poll #17. Cửa mở
  poll #24 (11:59:10Z): load1=0,49 load5=1,76 RAM=3.959 MB, gate0 cờ T5
  chính (`round146-t5/POSTBOOT_PASS`, boot khớp 98a7c93f), apt=0,
  dpkg=1545, cây YES 530e10a7.
- Poller 2: mở cửa ngay poll #1 (12:06:24Z, load1=0,45 load5=1,17
  RAM=3.610 MB, gate0 T5 chính). Sau attempt2 B-vi-phạm: retry → attempt3
  chạy 12:11:13Z (không poll lại, theo luật retry trong poller).
- Reboot #34: boot 98a7c93f → 6fb582df, btime 12:13:26Z (đồng hồ boot
  mới). Waiter2 (proc_f41b33a7f9cb) chết SIGTERM theo reboot. T4 không
  còn process nào sống trên boot mới (đã kiểm tra ps). Không còn
  vite.lock.

## 3. Attempt1-98a7c93f — FAIL tickCost (median 99,0 ms)

- **20/20 exit 0** (probe 11:59:13–12:03:07Z; run-attempt exit 0
  12:04:00Z). tickCost median **99,0 ms** (n=411; post-flip 100,0; p90
  137,0; max 281; min 53). tBlend gap n=341 median 172,0.
  BlendTick/pass=17,1; rAF/pass median=26 (21–30). webkit=27,2;
  pageErrs=[].
- **Lớp B ĐẠT 5/5:** sampler n=116, load1_max=2,76, RAM_min=2.413 MB,
  RAM_max=3.913 MB, 0 mẫu <500 MB, 0 mẫu <1.024 MB; load5 cuối 1,52;
  boot không đổi; B4 ĐẠT (pgrep -x=0, dpkg delta=0, ps exact-comm=0).
  ps-before/after: chỉ vite/probe của chính T4.
- **(c2)=0:** labellag skippedLatest=0 n=342 occurrence, (c)=0,
  (c2)=0; skiplatest 0 vi phạm, F6' ĐÓNG (75 tick, 100%/100%); lag5
  (b) lag≥+5f: 0 occurrence.
- **Per-pass:** median/pass 85,0–118,5 ms (đều cao, không có pass
  ngoại lệ); load1 mean/pass 1,46 → 2,72 (tăng dần); RAM mean/pass
  3.177 → 2.433 MB (giảm dần); Pearson median~load1 r=0,23,
  median~RAM r=−0,21 — đều yếu.
- **Balloon (T5 ram-sampler): +1,36 GB trong cửa sổ** (2.483.524 →
  3.839.712 kB, 11:58:28–12:03:29Z); RAM avail 4.316 → 2.752 MB.
- **Retry:** poller thoát 0 và in "LUOT HOP LE" vì chỉ kiểm exit 0 +
  lớp B, KHÔNG kiểm tickCost (xem F-146-T4-1). Agent quyết retry
  attempt2 (lý do: tickcost-vuot-nguong), ghi vào poll-t4.log 12:06:24Z.
  Ngân sách đã dùng 1/3.

## 4. Attempt2-98a7c93f — FAIL tickCost + B2 VI PHẠM

- **20/20 exit 0** (12:06:24–12:10:24Z; run-attempt exit 0 12:11:03Z).
  tickCost median **101,0 ms** (n=398; post-flip 102,0; p90 144,3; max
  280; min 54). tBlend gap n=330 median 171,5. BlendTick/pass=16,6;
  rAF/pass median=25 (21–28).
- **Lớp B VI PHẠM — B2 (load1 giua luot ≤4): load1_max=4,67.**
  Sampler n=116, RAM_min=2.133 MB, 0 mẫu <500 MB; load5 cuối 1,63;
  B1/B3/B4/B5 ĐẠT. Per-pass: load1 mean/pass tăng đều 1,40 → 4,67
  (pass 13–20 mean 3,9–4,67), RAM mean/pass 2.910 → 2.157 MB;
  Pearson median~load1 r=0,48, median~RAM r=−0,47 (mô tả, không kết
  luận nhân quả). Median/pass 91,5–130,5 ms — pass đầu (load1 thấp)
  cũng đã ~100 ms.
- **(c2)=0:** (c)=0, (c2)=0; F6' ĐÓNG (75 tick, 100%/100%).
- **Nguyên nhân tải:** ps-before/after không thấy process phân tích
  nặng của luồng khác (chỉ waiter sleep của chính T4) — tải tự sinh
  của stack đo + balloon. Balloon +1,19 GB trong cửa sổ (3.053.280 →
  4.236.380 kB, 12:06:29–12:10:29Z; T5 ram-sampler ghi load1 4,21 lúc
  12:08:29Z).
- Poller tự retry theo luật lop-B-vi-pham → attempt3 (ngân sách 2/3).

## 5. Attempt3-98a7c93f — probe 20/20 xong, FAIL tickCost, reboot giết finalization

- **Probe 20/20 hoàn tất (12:11:13–12:13:13Z):** partial JSON 20/20
  (12:13:13Z, tickCost n=424, blendTick n=353, c2DrawLog n=819), JSON
  2.399.927 B, passes=20, webkit=27,2, pageErrs=[]. tickCost median
  **97,0 ms** (n=425; post-flip 98,5; p90 136,0; max 209; min 52).
  tBlend gap n=352 median 171,0. BlendTick/pass=17,6; rAF/pass
  median=26 (21–30).
- **Lớp B hậu kiểm (cửa sổ probe 12:11:16–12:13:15Z, tính tay từ
  sampler + ps-before + dpkg frozen — xem F-146-T4-3): ĐẠT 5/5.**
  B1 DAT (load5 ~1,39 cuối cửa sổ ≤2,5); B2 DAT (load1_max=1,54 ≤4,
  ps-before không có process lạ); B3 DAT (không reboot trong cửa sổ
  probe — reboot 12:13:26Z sau khi probe xong 12:13:13Z); B4 DAT
  (dpkg frozen T5-146: 1545 dòng = baseline trước attempt; ps-before
  exact-comm apt/dpkg=0); B5 DAT (RAM min 2.252 MB, 0 mẫu <500 MB).
  Sampler cửa sổ probe: n=59 (toàn file n=76 — mẫu sau 12:13:15Z là
  sampler chưa kịp dừng khi reboot tới).
- **(c2)=0:** (c)=0, (c2)=0; F6' ĐÓNG (77 tick, 100%/100%); lag5 (b)
  0 occurrence; wallbands median 90,0–107,0 ms mọi dải (chậm đều từ
  đầu lượt, không suy giảm dần).
- **Per-pass:** median/pass 85,5–113,0 ms; load1 mean/pass 0,71–1,47
  (THẤP — yên nhất trong 3 attempt); RAM mean/pass 2.994 → 2.279 MB;
  Pearson median~load1 r=−0,12, median~RAM r=−0,04 — không tương quan.
  **Attempt yên nhất vẫn chậm nhất nhì (97 ms) → tải không phải nguyên
  nhân.**
- **Reboot #34 giết finalization:** run-attempt chết trong lúc chạy
  classb/analyzer (không có classb-t4-attempt3, ps-after, analyze do
  run-attempt chạy — đã chạy hậu kiểm bằng tay, kết quả ở đây).
  `attempt-done-attempt3-98a7c93f` tồn tại (trap EXIT, exit=0,
  12:13:49Z theo đồng hồ boot cũ) → ngân sách tính **3/3 đã dùng**,
  không còn attempt. Bằng chứng cuối boot cũ: dòng sampler 12:13:48Z
  + attempt-done 12:13:49Z (đồng hồ boot cũ) vs btime boot mới
  12:13:26Z — lệch ~23 s, ghi chú clock skew giữa hai boot (cùng mẫu
  offset started_at các đợt trước). Cửa sổ chết T4 ghi nhận:
  (12:13:15Z, 12:13:26Z] theo đồng hồ boot mới (last-seen = dòng probe
  cuối 12:13:15Z).

## 6. Bằng chứng (c2) + số cộng dồn — KHÔNG ĐỔI

- **0 occurrence (c2) trong cả 3 attempt** (mỗi attempt n=0/342–364
  occurrence skippedLatest=0). P1/P3-A1/P7 không có gì để tính (script
  p1p3p7 crash với seq rỗng — xem F-146-T4-5, đã vá guard và chạy lại
  OK: "(c2) seqs: [] — khong co seq"). P3' 0 seq. P2: lag5 (b) 0
  occurrence ≥+5f cả 3 attempt. P7 đối chứng drawSrc: không áp dụng
  (0 seq).
- **Cộng dồn giữ nguyên 17 lượt hợp lệ:** P1 51/51, P2 42/42, P3-A1
  46/51, P3' 23/23, P7 37/37 — theo quy ước chỉ đếm occurrence trong
  lượt hợp lệ; 3 attempt đợt này đều không hợp lệ nên không cộng.
- Lưu ý trung thực: 3 attempt liền đều (c2)=0, khác các lượt trước
  (thường 1–3 seq/lượt). Không suy diễn từ đó (lượt không hợp lệ, mẫu
  nhỏ, và (c2)=0 cũng khớp với "không có ghost" — nhưng không dùng làm
  bằng chứng cộng dồn).

## 7. Balloon + tải — dữ kiện (T5 ram-sampler)

- Balloon trong lượt: A1 +1,36 GB (2,48→3,84 GB), A2 +1,19 GB
  (3,05→4,24 GB), A3 +0,60 GB (3,06→3,66 GB); **xả 4,24→3,06 GB giữa
  A2 và A3** (12:10:29→12:11:29Z). Balloon dao động ±1,2 GB ở thang
  phút. RAM avail trong các lượt 2.133–3.913 MB.
- Tải không giải thích được chậm (xem §0/§5): A3 yên nhất vẫn 97 ms.
  Balloon cũng không giải thích sạch: A3 balloon chỉ +0,60 GB mà vẫn
  chậm như A1/A2. Yếu tố chung còn lại của 3 attempt: cùng boot
  98a7c93f (và cùng cell/host sau reboot #33).
- Steal CPU trên boot mới 6fb582df lúc 12:17:08Z: 335/88.064 tick
  ≈ 0,38% tích lũy (boot mới ~3 phút tuổi — chưa đủ kết luận về
  throttle trên boot cũ; T9/T5 có thể đối chiếu thêm).

## 8. Sai số F-146-T4-1..5

- **F-146-T4-1 — Poller tuyên bố "LUOT HOP LE" mà không kiểm tickCost.**
  `poll-wait-t4-146.sh` chỉ kiểm probe exit 0 + `LOP-B-TONG: DAT 5/5`
  rồi thoát 0; attempt1 (median 99,0 > 60) bị ghi "LUOT HOP LE" trong
  poll-t4.log lúc 12:04:00Z. Verdict tickCost chỉ nằm ở LIMITS (agent
  phải chạy lại poller bằng tay cho attempt2). Không ảnh hưởng số liệu
  (JSON/analyzer đầy đủ), chỉ tốn 1 vòng agent. Nợ T4-147: thêm cổng
  tickCost vào poller — đọc median từ `analyze-t4-$TAG-tickcost.txt`,
  >60 ms thì retry như lop-B-vi-pham (tối đa 3 attempt/đợt).
- **F-146-T4-2 — Luật đếm blocker comm-only ban đầu bỏ sót node thật.**
  comm của node là `"MainThread"` (node đặt tên thread), không phải
  `"node"`. Test poll 11:39:12Z (luật comm-only): blockers=0 trong khi
  T8 đang chạy vite thật (legacy=4). Đã sửa sang argv0-based TRƯỚC khi
  đo thật; test lại 11:41:11Z đạt (blockers=6, 0 dòng vite.config.ts).
  Bài học: khớp comm phải kiểm tra comm thật trên máy (ps), không đoán
  tên process.
- **F-146-T4-3 — Reboot #34 giết finalization attempt3.** Probe xong
  12:13:13Z, reboot btime 12:13:26Z; run-attempt chết trước khi chạy
  classb/analyzer (thiếu classb-t4-attempt3, ps-after, analyze do
  run-attempt chạy). Đã chạy hậu kiểm bằng tay: 7 analyzer + B hậu
  kiểm cửa sổ probe (§5). `attempt-done-attempt3` vẫn được ghi bởi trap
  EXIT (exit=0) → ngân sách tính 3/3. Clock skew ~23 s giữa hai boot
  (attempt-done 12:13:49Z đồng hồ cũ vs btime 12:13:26Z đồng hồ mới).
- **F-146-T4-4 — `chain-t4.log` trùng dòng (cosmetic, có từ đợt 145).**
  Mọi dòng do inner script tee vào chain-t4.log đều xuất hiện 2 lần
  (inner tee + outer tee của run-attempt). Không ảnh hưởng verdict hay
  số liệu; chỉ làm log khó đọc. Nợ: bỏ 1 trong 2 tee ở đợt sau.
- **F-146-T4-5 — `analyze-t4-p1p3p7.py` crash với (c2)=0.** Lần đầu
  gặp (c2)=0 nên lỗi tiềm ẩn mới lộ: `p=None` → `TypeError` format ở
  dòng 77. Đã vá guard (thoát sớm, in "(c2) seqs: []") và chạy lại OK
  cho attempt3 (exit 0). Script đã vá nằm trong hidden_files/round146-t4
  (đợt sau copy tiếp sẽ mang theo bản vá).

## 9. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND146_T4_WEBKIT_QUIET21_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script đã vá (trong hidden_files, không stage — file làm việc nội
  bộ, theo tiền lệ đợt 145):** `poll-wait-t4-146.sh` (luật đếm blocker
  argv0-based, F-145-T4-2 + F-146-T4-2), `check-classb-t4.sh` (loại trừ
  md5sum ở B2-display), `analyze-t4-p1p3p7.py` (guard (c2)=0,
  F-146-T4-5); tái dùng từ luồng trước: `run-attempt-146.sh`,
  `t4-attempt-inner.sh`, `vite.t4-temp.config.mjs`,
  `probe121t3-ghost-k7.webkit.mjs`, `b.json`, 10 analyzer
  `analyze-t4-*.py`, `wait-t4-146.sh`.
- **Log/evidence (hidden_files/round146-t4/, không stage):**
  `poll-t4.log` (24 poll lượt 1 + 1 poll lượt 2 + 2 dòng test
  POLL_TEST + dòng RETRY-AGENT), `poll-t4.nohup.log`,
  `poll-t4.nohup2.log`, `chain-t4.log` (trùng dòng — xem F-146-T4-4),
  `postboot-t4-146-gate0wait-*.log` (check-only, không cần dùng vì cờ
  T5 chính đã PASS),
  `blockers-ps-TEST146.txt` + `blockers-list-TEST146.txt` (bằng chứng
  vá F-145-T4-2: 6 dòng thật, 0 dòng vite.config.ts),
  `blockers-ps-1.txt` + `blockers-list-1.txt` (poller 1, poll #1:
  5 process T8),
  `tree-md5.txt` (530e10a7),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-98a7c93f.json`
  (2.318.403 / 2.279.448 / 2.399.927 B),
  `classb-t4-attempt{1,2}-98a7c93f.txt` (attempt3: B hậu kiểm tay ở §5,
  không có file classb do reboot),
  `load-mid-t4-attempt{1,2,3}-98a7c93f.log` (116/116/76 dòng),
  `analyze-t4-attempt{1,2,3}-98a7c93f-*.txt` (tickcost/c2coverage/
  stall/p1p3p7 — chỉ attempt3 có p1p3p7 sau vá guard — /labellag/lag5/
  skiplatest/c2drawlog/wallbands/perpass),
  `ps-before/after-t4-attempt{1,2}-98a7c93f.txt` (attempt3 chỉ có
  ps-before — ps-after chưa kịp ghi đã reboot),
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-98a7c93f.txt`,
  `attempt-done-attempt{1,2,3}-98a7c93f` (exit=0 cả 3),
  `coverage-check-attempt{1,2,3}-98a7c93f.txt` ((c2)=0 cả 3),
  `run-webkit-t4-attempt{1,2,3}-98a7c93f.log`,
  `vite-5187-t4-attempt{1,2,3}-98a7c93f.log`,
  `marker-t4-attempt{1,2,3}-98a7c93f`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này; không process T4
  nào còn sống lúc đóng (reboot đã dọn sạch; vite.lock không còn).
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round146-t4-quiet21.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round146-t4.done`.
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 146).

## 10. Chờ quyết parent / nợ đợt 147

- **(a) Lượt yên #21 KHÔNG có lượt hợp lệ — chuỗi 17 lượt giữ nguyên.**
  Đợt 147 có đo lại #21 trên boot mới 6fb582df không (để phân biệt chậm
  do boot 98a7c93f vs chậm hệ thống)? Nếu trên boot mới median về
  ~50 ms → chậm là boot-specific; nếu vẫn ~100 ms → cần điều tra sâu
  (host throttle / thay đổi hệ thống sau reboot #33).
- **(b) Chậm hệ thống ~100 ms trên boot 98a7c93f (3/3 attempt, đều
  20/20, (c2)=0):** có mở điều tra nguyên nhân (balloon/host/CPU) hay
  chỉ đo lại đợt sau? T4 không tự mở điều tra ngoài phạm vi brief.
- **(c) Thêm cổng tickCost ≤60 ms vào poller (F-146-T4-1)** — giao
  T4-147 (đọc median từ analyzer, retry như lop-B-vi-pham).
- **(d) Reboot #34:** cửa sổ chết (12:13:15Z, 12:13:26Z] + clock skew
  ~23 s — giao T2/T10 đối chiếu với bằng chứng các luồng khác.
- **(e) F-146-T4-4 (log trùng dòng):** bỏ 1 tee trong run-attempt/inner
  ở đợt sau.
- Các nợ đứng khác giữ nguyên từ đợt 145 §11 (mù #65, khung chết
  #106?/#107?, quyết (j), headroom, watchdog, G1, R9, ci-security.yml,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại).

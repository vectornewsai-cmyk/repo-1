# PHASE9_ROUND147_T4_WEBKIT_QUIET21_LIMITS.md

**Đợt:** 147. **Luồng:** T4 — đo lại lượt yên WebKit #21 trên boot mới
+ cổng tickCost vào poller. **Ngày:** 19/11/2026.
**Boot đo:** 6fb582df (btime 12:13:26Z — boot sau reboot #34).
**Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở poller, lúc
start attempt1/2, lúc inner-end cả hai — không đổi). **Trạng thái:
THÍ NGHIỆM PHÂN BIỆT (h) CÓ ĐÁP ÁN — CHẬM LÀ BOOT-SPECIFIC
(98a7c93f), KHÔNG PHẢI CHẬM HỆ THỐNG; nhưng #21 VẪN CHƯA CÓ LƯỢT
HỢP LỆ (cả 2 attempt đều partial do probe kẹt, không attempt nào
20/20).**

## 0. Verdict tổng

- **Attempt1-6fb582df (14:47:43–16:38:57Z): 17/20 pass, tickCost
  median 51,0 ms (n=472; post-flip 51,0; p90 78,9; max 114; min 28)
  — VỀ LẠI DẢI BÌNH THƯỜNG.** Probe kẹt sau pass 17 (writePartial 3
  fetch timeout 30 s rồi pass 18 không bao giờ chạy — xem
  F-147-T4-1); agent kill probe bằng SIGTERM 16:38:49Z, probe chết
  16:39:01Z, exit 2, JSON partial 2.726.096 B. Lớp B VI PHẠM (B2
  load1_max=4,86; B5 RAM min 194 MB) — nhưng cả hai vi phạm đều do
  cửa sổ kẹt 108 phút sau khi probe đứng, không phải trong 17 pass
  đã đo. (c2)=2 seq (319, 341), coverage 2/2, P3' 2/2 DAT, F6' ĐÓNG
  (51 tick, 100%). **KHÔNG TÍNH vào cộng dồn (partial, không hợp lệ).**
- **Attempt2-6fb582df (16:39:28–16:52:42Z): 11/20 pass, tickCost
  median 37,0 ms (n=351; post-flip 37,0; p90 60,0; max 98; min 27)
  — CÒN NHANH HƠN attempt1.** Probe kẹt sau pass 11 (cùng mẫu:
  writePartial 3 fetch timeout rồi pass 12 không chạy); agent kill
  probe bằng SIGTERM 16:52:35Z, chết 16:52:38Z, exit 2, JSON partial
  2.033.032 B. Lớp B VI PHẠM CHỈ B5 (RAM min 397 MB — 29 mẫu <500 MB
  ở đầu lượt, lúc RAM đang hồi từ 386 MB; B1/B2/B3/B4 ĐẠT,
  load1_max=1,04). (c2)=4 seq (175, 202, 233, 263), coverage 4/4;
  F6' CHƯA ĐỦ MẪU (20 tick post-flip < 30). **KHÔNG TÍNH vào cộng dồn.**
- **Kết luận thí nghiệm phân biệt (h) — BOOT-SPECIFIC, ĐÃ CHỨNG MINH:**
  boot 98a7c93f (đợt 146): median 99,0 / 101,0 / 97,0 ms (3 attempt
  20/20). Boot 6fb582df (đợt này): median **51,0 ms** (17 pass,
  n=472) và **37,0 ms** (11 pass, n=351) — cả hai đều ≤60 ms, rAF/pass
  median 36 / 42 (so với 25–26 ở boot cũ, 32 ở #20), BlendTick/pass
  22,6 / 26,2 (so với 16,6–17,6 ở boot cũ, 20,2 ở #20), min tick
  28 / 27 ms (so với 52–54 ở boot cũ). Mọi median/pass đều 35–64 ms
  — không pass nào gần 97–101 ms. Chậm KHÔNG tái diễn trên boot mới,
  kể cả khi attempt2 bắt đầu lúc RAM avail chỉ ~386 MB (median vẫn
  37 ms). **Theo quyết (i) đợt 146: KHÔNG mở điều tra sâu** — việc đo
  lại đã trả lời; chậm là của boot 98a7c93f. Tương quan median~load1
  r=−0,13 / −0,08, median~RAM r=−0,15 / +0,09 — không tương quan.
- **Caveat trung thực:** cả 2 attempt đều PARTIAL (kẹt, không 20/20)
  và lớp B đều vi phạm, nên #21 vẫn **KHÔNG CÓ lượt hợp lệ** — chuỗi
  17 lượt giữ nguyên (P1 51/51, P2 42/42, P3-A1 46/51, P3' 23/23,
  P7 37/37). Các số (c2)/P1/P3-A1/P7 của 2 attempt partial chỉ ghi
  nhận, KHÔNG cộng dồn (theo quy ước chỉ đếm lượt hợp lệ — như đợt
  146). Điều tra (c2) vẫn ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên.
- **Ngân sách dùng 2/3; attempt3 KHÔNG CHẠY (quyết của T4, ghi rõ lý
  do ở §2).** Poller bị agent SIGTERM 16:53:08Z ngay sau khi attempt2
  finalize (đã log RETRY 2→3) để chặn attempt3 — không còn thời gian
  trước hạn cờ 17:00Z, và mẫu kẹt lặp 2/2 lần khiến attempt3 kẹt nữa
  là rất có thể, sẽ giữ vite.lock quá hạn cứng toàn đợt 17:30Z.

## 1. Vá poller trước khi đo — cổng tickCost (F-146-T4-1, quyết (j)) + bỏ 1 tee (F-146-T4-4)

- **Cổng tickCost ≤60 ms (quyết parent đợt 146 §12.3(j)):** trong
  `poll-wait-t4-147.sh`, sau khi run-attempt exit 0 và lớp B ĐẠT 5/5,
  poller đọc median từ `analyze-t4-$TAG-tickcost.txt` (dòng
  `tickCost total n=... median=...`). Chỉ tuyên bố "LUOT HOP LE" khi
  cả B ĐẠT 5/5 VÀ median ≤60 ms. Median >60 hoặc không đọc được file
  → retry như vi phạm lớp B (fail-closed, tối đa 3 attempt/đợt).
- **Kiểm chứng cổng trước khi đo thật (unit-test, không cần chạy probe):**
  file tickcost đợt 146 attempt1 (median 99,0) → TC_OK=0 (retry);
  file giả median 50,0 → TC_OK=1 (hợp lệ); file không tồn tại →
  TC_OK=0 (fail-closed). Cả 3 trường hợp đúng như thiết kế.
- **Thực tế đợt này cổng CHƯA KÍCH HOẠT live:** cả 2 attempt đều exit
  2 (partial/wedged), không attempt nào đi qua nhánh RC=0 — nên cổng
  mới chỉ được chứng minh bằng unit-test + đọc code, chưa bằng một
  lượt hợp lệ thật. Poller không tuyên bố "LUOT HOP LE" sai lần nào
  (đúng — không có lượt hợp lệ).
- **Bỏ 1 tee (F-146-T4-4):** đã bỏ `| tee -a chain-t4.log` ở các echo
  của chính run-attempt (stdout của nó đã được poller tee vào chain 1
  lần) và ở dòng probe-start trong inner. Kết quả: các dòng start /
  run-attempt-exit của run-attempt nay xuất hiện 1 lần. NHƯNG log
  vẫn trùng dòng ở output của inner/probe (xem F-147-T4-2) — bản vá
  này chỉ sửa được một nửa.
- **Các script đợt 147** copy từ đợt 146, đổi 146→147 (W, tên file,
  T5FLAG chính round147-t5 + dự phòng round146-t5, hạn cắt poller
  16:30Z, hạn waiter 16:35Z, nhãn analyzer T4-147a1, kiểm file vòng
  trước round146-*). `bash -n` OK cả 5 script; analyzer p1p3p7 đã
  mang bản vá guard (c2)=0 từ đợt 146.
- **Test poll POLL_TEST=1 (14:45:01Z):** 1 poll, exit 7. blockers=0
  (legacy=0), lock=khong, tree YES 530e10a7, **T5 flag PASS
  (round147-t5/POSTBOOT_PASS, boot 6fb582df, pass_at 14:41:57Z,
  dpkg 1545/221)**, postboot exit 0, RAM 2109 MB, load1 2,32
  (gate A chưa đủ lúc đó), dpkg_lines=1545.

## 2. Poller — 4 poll, cửa mở poll #4, 2 attempt, dừng trước attempt3

| Poll | Thời gian | Kết quả |
|---|---|---|
| Test (POLL_TEST=1) | 14:45:01Z | exit 7, gate0 T5 PASS, load1 2,32 chưa đủ |
| #1–#3 | 14:45:27–14:46:58Z | load1 4,23 → 3,84 → 2,40 (chưa đủ <2); blockers=0, lock=khong, RAM 2.177–2.457 MB, T5 PASS |
| #4 | 14:47:43Z | **Cửa mở**: load1=1,46 load5=1,64 RAM=2.322 MB, gate0 T5, apt=0, dpkg=1545, cây YES — chạy attempt1 |
| — | 16:39:18Z | attempt1 exit 2 (partial 17/20) → poller retry → attempt2 16:39:28Z |
| — | 16:53:06Z | attempt2 exit 2 (partial 11/20) → poller log RETRY 2→3 |
| — | 16:53:08Z | **Agent SIGTERM poller (pid 32801)** — chặn attempt3 |

- **Lý do chặn attempt3 (quyết của T4, không phải poller lỗi):**
  lúc đó 16:53Z, chỉ còn ~7 phút tới hạn cờ 17:00Z; một attempt
  khỏe cũng mất ~6 phút, một attempt kẹt (mẫu lặp 2/2 lần đợt này)
  sẽ giữ vite.lock quá hạn cứng 17:30Z và chặn T10 đóng đợt.
  Ngân sách còn 1/3 nhưng không dùng được trong thời gian còn lại
  — ghi rõ để parent/T10 phán, không tự ý chạy thêm.
- Poller không bao giờ chạm hạn cắt 16:30Z (đang chạy attempt thì
  hạn cắt chỉ kiểm ở đầu vòng poll — theo thiết kế cũ).

## 3. Attempt1-6fb582df — 17/20 pass, median 51,0 ms, kẹt 108 phút

- **17/20 pass** (14:47:46–14:50:29Z; mỗi pass wall ~3,0–3,6 s;
  rAF/pass 30–42, median 36). tickCost median **51,0 ms** (n=472;
  post-flip 51,0; p90 78,9; max 114; min 28). tBlend gap n=383
  median 92,0. BlendTick/pass=22,6. webkit=27,2; pageErrs=[].
- **Per-pass:** median/pass 39,0–64,0 ms; load1 mean/pass 2,07–3,46
  (tăng dần); RAM mean/pass 2.253→1.440 MB (giảm dần trong 17 pass);
  Pearson median~load1 r=−0,13, median~RAM r=−0,15.
- **Wallbands:** 0–20k median 55,0; 20–32k 49,0; 32–45k 48,0;
  45–62k 56,0; 62–70k 46,0 ms — đều nhanh từ đầu, không suy giảm dần.
- **Kẹt (F-147-T4-1):** sau pass 17, 3 fetch writePartial timeout
  30 s mỗi cái (tickCost 14:49:29–14:49:59Z, blendTick, c2DrawLog
  14:50:29Z — "giữ tc cũ n=472 / blendTick cũ n=384 / c2 n=915"),
  partial JSON 17/20 ghi 14:50:29Z, rồi pass 18 không bao giờ chạy:
  không còn dòng log nào tới khi agent kill probe 16:38:49Z
  (**~108 phút đứng yên**, probe node 0:04 CPU, trạng thái S,
  `do_epoll_wait`). Probe chết ngay sau SIGTERM, exit 2 (đường
  target-closed, ghi partial JSON lần cuối — file tăng 33 B).
- **Lớp B VI PHẠM — B2 + B5 (xem §6):** sampler n=3313,
  load1_max=4,86, RAM_min=194 MB, 2.516/3.313 mẫu <500 MB,
  3.113/3.313 mẫu <1.024 MB; load5 cuối 0,63; B1/B3/B4 ĐẠT.
  Cả B2 và B5 đều do cửa sổ kẹt 108 phút (sampler chạy suốt trong
  lúc probe đứng) — trong 17 pass đã đo, load1 mean ≤3,46 và RAM
  mean ≥1.440 MB. Vì attempt partial nên B không quyết verdict.
- **(c2):** 2 seq (319, 341), coverage 2/2 (delta −22/−21 ms),
  P3' 2/2 DAT; P1 YEU (p=0,0192, 2/2 gần run-end, n=2 <3);
  P3-A1 YEU (p=0,0555); P7 DUNG (làm yếu desync, 0 entry tre ≥+1f);
  lag5 (b) 0 occurrence. F6' ĐÓNG (skippedLatest=1 post-flip 51
  tick ≥30, pixel-verified 100%/100%). **Không cộng dồn** (partial).

## 4. Attempt2-6fb582df — 11/20 pass, median 37,0 ms, kẹt 11 phút

- **11/20 pass** (16:39:37–16:41:50Z; mỗi pass wall ~2,9–3,3 s;
  rAF/pass 34–45, median 42). tickCost median **37,0 ms** (n=351;
  post-flip 37,0; p90 60,0; max 98; min 27). tBlend gap n=287
  median 74,0. BlendTick/pass=26,2. webkit=27,2; pageErrs=[].
- **Per-pass:** median/pass 35,0–42,0 ms; load1 mean/pass 0,67–1,04;
  RAM mean/pass 2.063→1.758 MB (trong các pass đã đo); Pearson
  median~load1 r=−0,08, median~RAM r=+0,09.
- **Wallbands:** 0–20k median 37,0; 20–32k 37,0; 32–45k 37,0 ms —
  phẳng, nhanh đều.
- **Kẹt (cùng mẫu F-147-T4-1):** pass 1–7 writePartial OK; từ sau
  pass 8, 3 fetch writePartial timeout 30 s mỗi cái
  (16:40:20–16:41:50Z); probe vẫn chơi tiếp được pass 9–11, partial
  JSON 11/20 ghi 16:41:50Z, rồi pass 12 không bao giờ chạy — đứng
  yên tới khi agent kill probe 16:52:35Z (**~11 phút**). Probe chết
  ngay sau SIGTERM, exit 2.
- **Lớp B VI PHẠM — CHỈ B5:** sampler n=392, load1_max=1,04,
  RAM_min=397 MB, 29 mẫu <500 MB, 181 mẫu <1.024 MB; load5 cuối
  0,27; B1/B2/B3/B4 ĐẠT. 29 mẫu <500 MB nằm ở đầu lượt (RAM đang hồi
  từ 386 MB sau khi kill attempt1 — xem §6); trong 11 pass đã đo,
  RAM mean ≥1.758 MB. Vì attempt partial nên B không quyết verdict.
- **(c2):** 4 seq (175, 202, 233, 263), coverage 4/4; lag5 (b) 0
  occurrence. F6' CHƯA ĐỦ MẪU (skippedLatest=1 post-flip 20 tick
  < 30 — vẫn mở). **Không cộng dồn** (partial).

## 5. Số cộng dồn (c2) — KHÔNG ĐỔI

- **17 lượt hợp lệ giữ nguyên:** P1 51/51, P2 42/42, P3-A1 46/51,
  P3' 23/23, P7 37/37 — theo quy ước chỉ đếm occurrence trong lượt
  hợp lệ; 2 attempt đợt này đều partial nên không cộng. Ghi nhận
  ngoài cộng dồn: attempt1 (c2)=2 seq (P3' 2/2, P1/P3-A1 YEU, P7
  DUNG), attempt2 (c2)=4 seq (coverage 4/4) — đều khớp hướng
  "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH", không dùng làm bằng chứng cộng dồn.

## 6. RAM — sập trong attempt1, hồi sau kill

- Attempt1 bắt đầu RAM avail 2.253 MB (14:47:44Z) → **<1.024 MB lần
  đầu 14:54:25Z** → **<500 MB lần đầu 14:59:35Z** → dao động
  194–500 MB suốt ~100 phút kẹt (load1 chỉ 0,2–0,5 trong thời gian
  đó; có spike load1 3,47 lúc 16:03:14Z). Lúc đóng attempt1
  (16:38:52Z) RAM 1.086 MB; sau kill attempt2 (16:52:37Z) RAM 881 MB;
  lúc đóng T4 (16:53Z) RAM avail 2.733 MB (free: total 7.934 MB,
  used 5.201 MB). Swap đã dùng 445/1.023 MB lúc thấp nhất.
- **Quan sát chưa quy được nguyên nhân:** lúc RAM thấp nhất, tổng
  RSS của mọi process chỉ ~900 MB (WebProcess 310 MB, hatch daemon
  252 MB, MiniBrowser 143 MB, vite 79 MB, probe 74 MB…) trong khi
  `free` báo used 7.548/7.934 MB — khoảng ~6,5 GB không nằm trong
  RSS process nào (buff/cache chỉ 631 MB lúc đó). T4 ghi nhận con
  số, KHÔNG kết luận balloon/host — giao T5/T9 đối chiếu (nợ đứng:
  balloon đóng băng đợt thứ 9, quyết (o) đợt 146).
- Tải không giải thích được gì ở đây: attempt2 chạy lúc RAM vừa hồi
  vẫn median 37 ms; attempt1 chậm nhất cũng không phải lúc RAM thấp
  nhất (các pass đã đo xong trước 14:50Z, khi RAM còn >1.600 MB).

## 7. Bằng chứng + files

- **LIMITS này:** `docs/PHASE9_ROUND147_T4_WEBKIT_QUIET21_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script đã vá (trong hidden_files, không stage — file làm việc nội
  bộ, theo tiền lệ):** `poll-wait-t4-147.sh` (cổng tickCost (j) +
  hạn cắt 16:30Z), `run-attempt-147.sh` (bỏ tee echo — xem
  F-147-T4-2), `t4-attempt-inner.sh` (bỏ tee probe-start),
  `check-classb-t4.sh`, `wait-t4-147.sh`; tái dùng từ đợt 146:
  `vite.t4-temp.config.mjs`, `probe121t3-ghost-k7.webkit.mjs`,
  `b.json`, 10 analyzer `analyze-t4-*.py` (p1p3p7 đã có guard
  (c2)=0).
- **Log/evidence (hidden_files/round147-t4/, không stage):**
  `poll-t4.log` (test poll + poll #1–#4 + RETRY 1→2 + RETRY 2→3),
  `poll-t4.nohup.log`, `chain-t4.log` (vẫn trùng dòng ở output
  inner/probe — xem F-147-T4-2),
  `postboot-t4-147-gate0wait-1.log`,
  `tree-md5.txt` (530e10a7),
  `preview-b-f3-flip-webkit-t4-attempt{1,2}-6fb582df.json`
  (2.726.096 / 2.033.032 B),
  `classb-t4-attempt{1,2}-6fb582df.txt`,
  `load-mid-t4-attempt{1,2}-6fb582df.log` (3.313 / 392 dòng),
  `analyze-t4-attempt{1,2}-6fb582df-*.txt` (tickcost/c2coverage/
  stall/p1p3p7/labellag/lag5/skiplatest/c2drawlog/wallbands/perpass),
  `ps-before/after-t4-attempt{1,2}-6fb582df.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2}-6fb582df.txt`,
  `attempt-done-attempt{1,2}-6fb582df` (exit=2 cả hai),
  `coverage-check-attempt{1,2}-6fb582df.txt` (2/2, 4/4),
  `run-webkit-t4-attempt{1,2}-6fb582df.log`,
  `vite-5187-t4-attempt{1,2}-6fb582df.log`,
  `marker-t4-attempt{1,2}-6fb582df`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này; không process T4
  nào còn sống lúc đóng (poller đã SIGTERM 16:53:08Z, vite.lock đã
  nhả, RAM avail 2.733 MB lúc đóng).
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round147-t4-quiet21.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round147-t4.done` (16:5xZ).

## 8. Sai số F-147-T4-1..3

- **F-147-T4-1 — Probe kẹt sau writePartial timeout (MỚI, nặng nhất
  đợt này; cùng họ lỗi đợt 120).** Sau khi cả 3 fetch writePartial
  (tickCost, blendTick, c2DrawLog) timeout 30 s mỗi cái, pass tiếp
  theo không bao giờ chạy và KHÔNG có timeout nào cứu được: attempt1
  đứng 108 phút sau pass 17, attempt2 đứng 11 phút sau pass 11
  (đủ 2/2 attempt đợt này). Probe tự ghi chú trong code (dòng
  62–63, 458, 710): writePartial await pwEval nằm NGOÀI phạm vi
  timeout 120 s/pass, và "timeout thì probe treo sau pass cuối".
  Hậu quả: attempt1 giữ vite.lock 111 phút; cả 2 attempt đều partial
  nên #21 vẫn chưa có lượt hợp lệ dù median đã về dải bình thường.
  Cách xử lý đợt này: SIGTERM tới process node probe (chết ngay,
  exit 2, ghi partial JSON lần cuối) — là cách khôi phục, không phải
  sửa nguyên nhân. **Nợ:** cần quyết parent — có sửa probe (thêm
  timeout cho await trong writePartial / timeout wall-clock toàn
  attempt) hay giữ nguyên và chấp nhận kill tay khi kẹt? T4 không tự
  mở sửa probe ngoài phạm vi brief.
- **F-147-T4-2 — Bản vá F-146-T4-4 chỉ sửa được một nửa: log vẫn
  trùng dòng.** Đã bỏ tee ở các echo của run-attempt (dòng start /
  run-attempt-exit nay 1 lần — kiểm bằng grep chain-t4.log) và ở
  probe-start trong inner. NHƯNG mọi dòng output của inner/probe
  vẫn xuất hiện 2 lần (64 dòng "partial JSON" cho 32 sự kiện;
  inner-end 2 lần/attempt). Nguyên nhân thật: HAI tee nối tiếp cùng
  ghi vào chain-t4.log — tee của pipe LOCKV2 trong run-attempt VÀ
  tee của pipe run-attempt trong poller. Muốn hết trùng phải bỏ 1
  trong 2 tee pipeline này (vd: bỏ tee ở pipe LOCKV2 trong
  run-attempt, chỉ để poller tee làm writer duy nhất) — nhưng việc
  đó đổi hành vi khi chạy run-attempt độc lập, nên T4 ghi nợ cho
  đợt sau, không tự sửa trong lúc đo. Cosmetic, không ảnh hưởng số
  liệu hay verdict.
- **F-147-T4-3 — Nhãn analyzer tickCost/wallbands ghi sai attempt
  (cosmetic, có từ đợt 146).** `run-attempt-147.sh` truyền nhãn cứng
  `T4-147a1=` cho mọi attempt nên file attempt2 cũng ghi
  "== T4-147a1:" — số liệu trong file vẫn là của attempt2 (n=351,
  median 37,0). Sửa: truyền `T4-147a$ATT=` theo attempt thật ở đợt
  sau. Không ảnh hưởng verdict.

## 9. Chờ quyết parent / nợ đợt 148

- **(a) Thí nghiệm (h) ĐÃ CÓ ĐÁP ÁN: boot-specific.** Chậm 97–101 ms
  là của boot 98a7c93f; boot mới 6fb582df median 51,0 / 37,0 ms.
  Theo quyết (i) đợt 146: KHÔNG mở điều tra sâu về chậm hệ thống.
  Còn lại: #21 vẫn chưa có lượt hợp lệ (2 attempt partial) — đợt
  148 có đo lại #21 tiếp không (ngân sách attempt đợt 147 còn 1/3
  nhưng đã hết giờ, không chuyển sang đợt sau)?
- **(b) F-147-T4-1 (probe kẹt sau writePartial timeout, 2/2 attempt):**
  có sửa probe (timeout cho await writePartial / timeout wall-clock
  toàn attempt) hay giữ nguyên + kill tay khi kẹt? Đây là lỗi đã biết
  từ đợt 120, nay tái diễn và là lý do duy nhất khiến #21 chưa có
  lượt hợp lệ dù tốc độ đã bình thường.
- **(c) F-147-T4-2:** bỏ 1 trong 2 tee pipeline (LOCKV2-pipe trong
  run-attempt vs poller-pipe) để hết trùng dòng chain-t4.log.
- **(d) Cổng tickCost (j):** đã vào poller + unit-test đúng, nhưng
  chưa kích hoạt live lần nào (chưa có attempt exit 0 đợt này) —
  đợt sau có attempt 20/20 thì cổng sẽ được thử lửa thật lần đầu.
- **(e) RAM sập ~6,5 GB không nằm trong RSS process nào trong
  attempt1 (§6):** giao T5/T9 đối chiếu balloon/host.
- Các nợ đứng khác giữ nguyên từ đợt 146 §10 (mù #66, khung chết
  #108?/#109?, G1 chờ user, R9, ci-security.yml 403, file oversize
  6,4 MB, TTS 39 cấm kiểm lại).

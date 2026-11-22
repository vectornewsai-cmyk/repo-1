# PHASE9_ROUND151_T4_WEBKIT_QUIET22_LIMITS.md

**Đợt:** 151. **Luồng:** T4 — đo lượt yên WebKit #22 trên boot mới
(reboot #41). **Ngày:** 20/11/2026.
**Boot đo:** 2e430750 (btime 01:25:51Z 20/11 /proc/stat; boot_id đầy đủ
2e430750-6ba0-47b6-bf22-902953eff096). **Trạng thái:
#22 CÓ LƯỢT HỢP LỆ MỚI — attempt2-2e430750: 20/20 + lớp B ĐẠT 5/5 +
tickCost median 39,0 ms ≤60 → lượt hợp lệ thứ 19; cộng dồn (c2)
P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48.**
Attempt1 nhiễm tải (B1+B2 vi phạm, tickCost median 108,0 ms) và
đã retry đúng luật: poller poll lại gate trước attempt kế
(quyết parent 149 §12.3(h)) — **lần đầu retry poll-lại-gate được
kiểm chứng live** (F-150-T4-3 ĐÓNG). p1p3p7 chạy tay sau poller,
exit 0 (F-148-T4-1 ĐÓNG cho lượt này).

## 0. Verdict tổng

- **Lượt hợp lệ #19: attempt2-2e430750, 02:58:32–03:02:25Z.**
  Probe 20/20, JSON 3.685.576 B, tickCost total n=648
  **median=39,0 ms** (p90=64,0, max=95, min=27); hậu flip+2000ms
  n=489 median=39,0 ms. Lớp B **ĐẠT 5/5** (B1 load5 cuối 1,48;
  B2 load1 max 2,18, ps-before/after chỉ có vite của mình; B3
  không reboot; B4 pgrep apt/dpkg=0, dpkg delta=0; B5 RAM min
  904 MB, 0 mẫu <500 MB). Coverage (c2) 10/10. Poller thoát
  exit 0 lúc 03:02:25Z.
- **Attempt1 NHIỄM TẢI (không hợp lệ):** 02:45:21–02:51:00Z,
  20/20, JSON 1.808.297 B, tickCost n=303 **median=108,0 ms**
  (p90=208,8, max=404); B1 VI PHAM (load5 cuối 6,18 > 2,5),
  B2 VI PHAM (load1 max 11,51 > 4); B3/B4/B5 ĐẠT; (c2)=0.
  Nguồn nhiễm quy được tên: T1 `count-final-151.py` + suite
  verify, T2 `blind72-investigate.py`, và job render U4
  `mask_anim.py` (ellipse 1280x720, 60 s) — xem F-151-T4-1.
- **Ngân sách dùng 2/3 attempt.** 0 reboot trong phiên (boot
  2e430750 suốt). Không process T4 nào còn sống lúc đóng
  (poller đã thoát; vite :5187 chết; vite.lock không tồn tại
  lúc đóng 03:13Z).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round151-t4.done` viết 03:15Z (trong hạn
  cờ ~05:00Z, trước hạn cứng 05:30Z).

## 1. Poller — 18 poll thật, cửa mở 2 lần

- **Test (POLL_TEST=1) 02:40:38Z:** 1 poll, exit 7, ghi RIÊNG
  vào `poll-test-151.log` (sửa F-150-T4-5 — `poll-t4.log`
  KHÔNG còn dòng test nào; đúng 18 dòng "poll #"). load1=3,02,
  load5=1,91, RAM=1108 MB, postboot_exit=0, gate0=T4-check-only,
  t5flag=cu(mtime-cu), apt=0, dpkg_lines=1545.
- **Poll #1–#7 (02:40:46–02:45:21Z):** gate0=T4-check-only
  (cờ T5-150 cũ, không khớp boot mới; cờ T5-151 chưa có).
  load1 0,44–6,13, load5 1,96–3,35; RAM 988–2211 MB (chỉ poll
  #2 dưới 1024: 988 MB). **Poll #7 (02:45:21Z): load1=0,44,
  load5=1,97, RAM=2211 MB — CỬA MỞ lần 1** → chạy attempt1.
- **Poll #8–#17 (02:51:00–02:57:47Z):** chờ gate mở lại cho
  retry. Cờ T5-151 đã có (POSTBOOT_PASS boot 2e430750,
  mtime 02:48:41Z, poll=2) nên gate0=T5 từ poll #8. Nhưng
  load5 còn cao sau attempt1 (5,71 → 2,11, hạ dần từng poll)
  — poller KHÔNG chạy mù mà chờ load5 <2 đúng quyết (h).
  RAM 1411–2765 MB trong giai đoạn này.
- **Poll #18 (02:58:32Z): load1=0,22, load5=1,81, RAM=1411 MB
  — CỬA MỞ lần 2 (gate0=T5)** → chạy attempt2 (retry).
- **Phân rã 18 poll thật:** RAM≥1024: 17/18; RAM 500–1023:
  1/18; RAM<500: 0/18; RAM min 988 / max 2765 MB. load1<2:
  11/18; load5<2: 3/18 (poll #1, #7, #18). Chỉ 2 poll mà
  load + RAM cùng đạt (#7, #18) — đúng 2 lần cửa mở.
  gate0: T4-check-only 7 poll, T5 11 poll.
- **RAM sập đợt 150 KHÔNG tái diễn trong cửa sổ chờ:** 0 poll
  <500 MB (đợt 150: 34/97 poll <500 MB, min 411 MB).

## 2. Attempt1 — nhiễm tải (02:45:21–02:51:00Z)

- Probe 20/20 (run-attempt exit 0), JSON 1.808.297 B.
  tickCost total n=303 median=108,0 p90=208,8 max=404 min=30;
  hậu flip+2000ms n=238 median=103,0. tBlend gap n=218
  median=209,0 p90=580,8 max=8283. BlendTick/pass=10,9;
  rAF/pass median=21 (9–28). webkit=27.2, pageErrs=[].
- Lớp B: **B1 VI PHAM** (load5 lúc kết thúc 6,18 > 2,5);
  **B2 VI PHAM** (load1 max 11,51 > 4); B3 ĐẠT (không reboot);
  B4 ĐẠT (pgrep apt/dpkg=0, dpkg delta=0); B5 ĐẠT (RAM min
  1406 MB, 0 mẫu <500/<1024 MB). Sampler n=121.
- Nguồn nhiễm (ps-before/after, kiểm tay): T1
  `count-final-151.py` + `round151-t1-verify.sh` (suite, PID
  16492); T2 `blind72-investigate.py` (PID 22762/22773); job
  render U4 `mask_anim.py --shape ellipse --width 1280
  --height 720 --fps 30 --duration 60` (PID 36788). Cả ba đều
  là process phân tích/render của luồng khác trong cùng cửa sổ
  đo. (c2)=0 trong attempt này (không có occurrence để xét —
  không cộng dồn).
- Per-pass: pass 1 tick n=16 median=129,5 (load1 mean 0,37 —
  tải ập vào giữa lượt, sau khi pass 1 đã chạy yên một phần).
  Poller đánh giá: 20/20 nhưng lớp B vi phạm → retry, poll
  lại gate trước attempt kế (quyết (h)).

## 3. Attempt2 — LƯỢT HỢP LỆ #19 (02:58:32–03:02:25Z)

- Probe 20/20 (run-attempt exit 0), JSON 3.685.576 B.
  **tickCost total n=648 median=39,0 ms** (p90=64,0, max=95,
  min=27); hậu flip+2000ms n=489 median=39,0 ms. tBlend gap
  n=515 median=76,0 p90=100,6 max=2091. BlendTick/pass=25,8;
  rAF/pass median=40 (36–47). webkit=27.2, pageErrs=[].
  Wallbands: 0–20k median 41,0; 20–32k median 41,5; 32–45k
  median 39,0 (toàn lượt median 39,0).
- Lớp B **ĐẠT 5/5** (xem file classb gốc): B1 ĐẠT (load5 cuối
  1,48 ≤2,5); B2 ĐẠT (load1 max 2,18 ≤4; ps-before/after chỉ
  có vite :5187 của chính T4); B3 ĐẠT (boot lúc bắt đầu =
  boot hiện tại = 01:25:51Z); B4 ĐẠT (pgrep apt/dpkg=0, ps
  exact-comm=0, dpkg delta=0); B5 ĐẠT (RAM min 904 MB,
  0 mẫu <500 MB). Sampler n=100.
  Ghi nhận (không vi phạm): 16/100 mẫu RAM <1024 MB — xem
  F-151-T4-2.
- Per-pass (20 pass): median 36,0–49,0 ms; load1 mean theo
  pass 0,68 → 1,94 (tăng dần nhẹ trong lượt); RAM mean theo
  pass 1073 → 974 MB (giảm dần nhẹ). Tương quan Pearson:
  median~load1_mean r=-0,52; median~RAM_mean r=0,58 (chỉ mô
  tả — load1 là trung bình 1 phút nên biến thiên chậm; không
  kết luận nhân quả từ 1 lượt).
- Coverage (c2) **10/10**: seq 144, 164, 218, 248, 275, 304,
  365, 365, 414, 492 (365 xuất hiện 2 lần — 2 occurrence
  khác label tại cùng seq, xem labellag); blendTick hậu-flip
  393, 100% trong ±500 ms của log draw. c2DrawLog n=1256
  (drawSrc 648, rawUnit 608), 1 epoch, loopNo 1–21.
- labellag (skippedLatest=0): (c) 10 occurrence, lag
  **1,1,1,1,1,1,6,3,1,1** (frame) — tất cả ≥+1f, 0 lag âm.
  skippedLatest=1: nTick=76, lag median 0f p90 2f max 3f.
  lag5 (b): 1 event, 6 occ, M=[36], tBlend 59443–59720
  (277 ms), presented 28→36, label 26→30, **lag max +10f**
  — chính là event seq 365 (xem F-151-T4-3/4).

## 4. p1p3p7 chạy tay + số cộng dồn (c2) — 19 LƯỢT HỢP LỆ

- p1p3p7 chạy TAY sau poller (nợ F-148-T4-1 — run-attempt
  không gọi tự động), exit 0:
  `python3 analyze-t4-p1p3p7.py
  preview-b-f3-flip-webkit-t4-attempt2-2e430750.json
  "144,164,218,248,275,304,365,365,414,492"`.
- **P1: ĐÚNG — 10/10** (c2) gần run-end (baseline 39/393,
  p=9,26e-11; run_end seqs n=13, gồm cả 10 seq (c2)).
- **P2: ĐÚNG — 10/10** lag ≥+1f, 0 lag âm (lag 1,1,1,1,1,1,
  6,3,1,1 theo §3).
- **P3-A1: ĐÚNG — 8/10** (c2) đóng băng-tại-tick (baseline
  90/392, p=0,00022; 2 occurrence seq 365 KHÔNG đóng băng —
  stall_truoc=1).
- **P3': KHÔNG ĐẠT tròn — 8/10** (stall analyzer: seq 365 ×2
  stall_truoc=1 → KHÔNG-DAT; 8 seq còn lại stall_truoc 4–7).
- **P7: ĐÚNG — 0 entry tre ≥+1f** (drawSrc delta {-1: 64,
  0: 64}; đối chứng toàn bộ drawSrc post: 0/488 entry).
- **Cộng dồn MỚI (19 lượt hợp lệ): P1 62/62, P2 53/53,
  P3-A1 55/62, P3' 32/34, P7 48/48** (trước đợt này, 18 lượt:
  P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38).
  P3' lần đầu không tròn trong một lượt hợp lệ (24/24 →
  32/34) — xem F-151-T4-3.
- Chuỗi median tickCost 19 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / **39,0 ms**
  (trung bình 48,9 ms). Không lượt nào vượt ngưỡng 60 ms
  trong chuỗi 19 lượt — lượt này 39,0 ms là thấp thứ hai
  (sau 39,5 ms).
- Điều tra (c2) vẫn ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — không có điều kiện nào trong ba điều
  kiện mở lại (§13 DEF v0.5) xảy ra (P1 ĐÚNG; 0 lag âm;
  +2f = 0 trong lượt — lag +6f/+3f tại seq 365 là lag
  (c2) dương, không phải điều kiện mở lại).

## 5. Replay/postboot trên boot mới — KHÔNG CẦN REPAIR

- Boot 2e430750 (reboot #41, btime 01:25:51Z): **replay TỚI
  TỰ NHIÊN, đầy đủ** — dpkg.log 1545 dòng (106 startup /
  169 install / 9 upgrade / 178 configure / 1040 status /
  43 trigproc), hoạt động đầu 01:26:35Z (boot+44s), cài xong
  01:30:13Z (boot+4m22s, gói cuối gstreamer1.0-tools), 0 entry
  sau đó. Cache apt **SỐNG 178 .deb / 156M** (chuỗi 0 .deb
  2 lần liên tiếp ở #39/#40 DỨT, không kéo dài sang lần 3).
  Lists 37 (1 mirror azure). GST thư mục thật (apt) 269 file
  = debroot 269.
- Cờ T5-151: `round151-t5/POSTBOOT_PASS` cho boot 2e430750
  (ghi full boot_id), mtime **02:48:41Z, poll=2** — postboot
  PASS poll2 độc lập 02:40:23Z exit 0 (poll1: T4 check tay
  02:38:49Z, cũng PASS exit 0 — xem §7). **KHÔNG cần repair**
  (quyết parent 150 §12.3(h): repair sớm chỉ khi sau ~15'
  dpkg.log vẫn đóng băng / 0 hoạt động apt — không xảy ra:
  replay đã chạy từ boot+44s).
- Đối chiếu đợt 150: boot e9295700 replay KHÔNG tới (2 dòng,
  0 install sau boot+88m) + RAM sập — đợt này cả hai đều
  đảo ngược: replay đầy đủ + RAM chờ 17/18 poll ≥1024.
- T4 check-only tay lúc 02:38:49Z: exit 0 (PASS wrapper K1,
  đủ libevent/libEGL/libavif/libdw/libevdev hệ thống, GST đủ
  isomp4 + libav, đủ 11 package WebKit/GST) — log riêng
  `postboot-t4-151-manual-0238Z.log`, không ghi chung poll.

## 6. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND151_T4_WEBKIT_QUIET22_LIMITS.md`.
- **Script snapshot để stage (theo mẫu đợt 149/150), trong
  repo `apps/web/scripts/` (md5 khớp bản làm việc ở
  `hidden_files/round151-t4/`):** `poll-wait-t4-151.sh`
  (md5 `11200f29fb2d0fb06b0375627d8cb7c1`),
  `run-attempt-151.sh` (md5 `2efd1a09f60b415d79f8a2ac8029a1d1`).
  Thay đổi so với 150: deadline poller 04:30Z (hạn cờ
  ~05:00Z, cứng 05:30Z); cờ T5 ưu tiên round151-t5/, dự phòng
  round150-t5/; sửa F-150-T4-5 (test poll log riêng qua
  biến POLLLOG); nhãn analyzer T4-151a; inner kiểm file
  round150-* (thay vì round149-*).
  **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` md5 `4291e539...` —
  byte-identical với bản đã vá đợt 148/149/150) và **KHÔNG
  ghi đè `t4-attempt-inner.sh` / `check-classb-t4.sh`**
  (bản làm việc ở `hidden_files/round151-t4/`, chỉ đổi số
  vòng/đường dẫn so với 150 — theo đúng mẫu 149/150).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-151.sh`, `run-attempt-151.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7).
- **Log/evidence (hidden_files/round151-t4/, không stage):**
  `poll-t4.log` (19 dòng: start + 18 poll thật, 0 dòng test),
  `poll-test-151.log` (test exit 7, riêng),
  `poll-t4.nohup.log`, `chain-t4.log` (ghi đủ 2 lần CUA MO +
  verdict lượt hợp lệ), `postboot-t4-151-manual-0238Z.log`
  (check tay exit 0), `postboot-t4-151-gate0wait-*.log`
  (check-only mỗi 4 poll), `burst-snapshot-0241Z.txt` (mở),
  `burst-snapshot-0313Z.txt` (đóng); attempt1:
  `preview-b-f3-flip-webkit-t4-attempt1-2e430750.json`
  (1.808.297 B) + 9 analyzer + classb + coverage-check
  ((c2)=0) + ps-before/after + load-mid + vite log;
  attempt2: `preview-b-f3-flip-webkit-t4-attempt2-2e430750.json`
  (3.685.576 B) + 10 analyzer (gồm p1p3p7 chạy tay) +
  classb + coverage-check 10/10 + ps-before/after +
  load-mid + vite log; `attempt-done-attempt1-2e430750`,
  `attempt-done-attempt2-2e430750` (ngân sách 2/3).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§6); không process T4 nào còn sống lúc đóng.
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round151-t4-quiet22.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã
  verify bằng `od`).
- **Cờ:** `hidden_files/round151-t4.done` (03:15Z — trong hạn
  cờ ~05:00Z).

## 7. Sai số F-151-T4-1..4 (+ nợ cũ ĐÓNG)

- **F-151-T4-1 — Attempt1 nhiễm tải (B1+B2 vi phạm, tickCost
  median 108,0 ms).** load1 max 11,51, load5 cuối 6,18.
  Nguồn: T1 suite verify + T2 blind72-investigate + job
  render U4 `mask_anim.py` (60 s, 720p). Đây là **lần thứ ba
  job mask_anim.py nhiễm lượt đo T4** (đợt 149: A2/A3;
  đợt 151: attempt1) — hướng dẫn đứng "job nặng tránh cửa
  đo T4 khi có thể" (quyết (h) đợt 149) chưa được tuân
  triệt để. Lượt nhiễm đã retry đúng luật và lượt retry
  hợp lệ, nên không ảnh hưởng verdict đợt này; ghi để
  T10/parent nhắc lại nếu cần.
- **F-151-T4-2 — RAM tụt trong lượt hợp lệ.** Gate mở lúc
  RAM 1411 MB (poll #18) nhưng trong attempt2 RAM min
  904 MB, 16/100 mẫu <1024 MB (mean theo pass giảm 1073 →
  974 MB). B5 chỉ cấm <500 MB nên không vi phạm, nhưng
  gate-A chỉ đo tại thời điểm mở cửa — RAM trong lượt có
  thể tụt dưới ngưỡng mà không ai chặn. Ghi nhận, không đổi
  luật (T4 không tự đổi luật chờ).
- **F-151-T4-3 — P3' 8/10, không tròn.** Seq 365 ×2
  stall_truoc=1 (labelMs=59482, prev=59412) → KHÔNG-DAT;
  8 seq còn lại stall_truoc 4–7. Cộng dồn P3' 24/24 → 32/34
  — lần đầu P3' không tròn trong một lượt hợp lệ. Cùng
  event với F-151-T4-4 (lag5 (b) +10f tại seq 362–365):
  khả năng label tại seq 365 bị kẹt sau 1 tick stall ngắn
  rồi nhảy +6f/+3f — ghi nhận, không mở điều tra riêng
  (P3-A1 vẫn ĐÚNG 8/10, p=0,00022; verdict (c2) đứng).
- **F-151-T4-4 — lag5 (b) 1 event, lag max +10f.** Seq
  362–365, M=[36], 6 occ, tBlend 59443–59720 (277 ms),
  presented 28→36, label 26→30. Đây là lag (b) lớn nhất
  trong một lượt hợp lệ gần đây (đợt 149: A3 lag5 (b) 1 event
  +8f — nhưng đó là attempt nhiễm tải, không cộng dồn).
  Event này trùng seq 365 của F-151-T4-3 — cùng một hiện
  tượng, không đếm hai lần khi đánh giá.
- **F-150-T4-3 — ĐÓNG.** Retry poll-lại-gate (quyết parent
  149 §12.3(h)) kiểm chứng live lần đầu: sau attempt1
  nhiễm tải, poller `wait_gate()` poll lại 11 lần (poll
  #8–#18) chờ load5 hạ 5,71 → 1,81 rồi mới chạy attempt2
  lúc 02:58:32Z. Không còn `sleep 10; continue` chạy mù.
- **F-150-T4-5 — ĐÓNG.** Test poll ghi riêng
  `poll-test-151.log` (exit 7); `poll-t4.log` đúng 18 dòng
  poll thật, thống kê §1 không cần tách tay nữa.
- **F-148-T4-1 — ĐÓNG (cho lượt này).** p1p3p7 KHÔNG được
  run-attempt gọi tự động (vẫn đúng — chạy tay sau poller,
  exit 0, xem §4). Nợ đứng này vẫn còn ở mức cơ chế (script
  chưa tự gọi); mỗi đợt T4 phải chạy tay và ghi rõ.

## 8. Chờ quyết parent / nợ đợt 152

- **(a) #22 CÓ lượt hợp lệ mới (thứ 19, median 39,0 ms) —
  đo tiếp đợt 152** với cùng cổng tickCost ≤60 ms + probe đã
  vá (không đổi ngưỡng — lượt này median 39,0 ms, xa dưới
  ngưỡng; không có căn cứ nào để bàn ngưỡng).
- **(b) P3' 32/34 (F-151-T4-3):** theo dõi đợt sau — nếu
  seq 365-style tái diễn thì có thể là mẫu mới, lúc đó mới
  bàn có mở điều tra không. Hiện tại chỉ ghi nhận.
- **(c) mask_anim.py U4 nhiễm tải lần thứ ba (F-151-T4-1):**
  nhắc lại hướng dẫn đứng (job nặng tránh cửa đo T4) — T4
  không có quyền chặn job luồng khác, chỉ ghi nhận.
- **(d) F-148-T4-1 (cơ chế):** p1p3p7 vẫn chạy tay — có nên
  nối vào run-attempt không? Parent phán (hiện tại chạy tay
  vẫn xong đúng hạn, không gấp).
- **(e) Các nợ đứng khác giữ nguyên từ đợt 150 §9:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #73? giao T2-151; birefnet 0 thử;
  u2net là fallback chính thức.

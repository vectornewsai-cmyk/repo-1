# PHASE9_ROUND152_T4_WEBKIT_QUIET22_LIMITS.md

**Đợt:** 152. **Luồng:** T4 — đo lượt yên WebKit #22 trên boot mới
(boot #43 18e179e0, sau boot #41 2e430750 của đợt 151 — có boot #42
fad2aab9 ở giữa, btime 03:25:16Z, theo LIMITS T5-152).
**Ngày:** 20/11/2026.
**Boot đo:** 18e179e0 (btime 05:20:57Z 20/11 /proc/stat; boot_id đầy đủ
18e179e0-365e-4298-92b8-b61b147f9600). **Trạng thái:
#22 CÓ LƯỢT HỢP LỆ MỚI — attempt1-18e179e0: 20/20 + lớp B ĐẠT 5/5 +
tickCost median 60,0 ms ≤60 (ĐÚNG NGƯỠNG, không có dư) → lượt hợp lệ
thứ 20; NHƯNG (c2)=0 occurrence — lượt này KHÔNG đóng góp bằng chứng
mới cho điều tra ghost-freeze; cộng dồn (c2) KHÔNG ĐỔI: P1 62/62,
P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48.**
Ngân sách dùng 1/3 attempt (không cần retry). p1p3p7 chạy tay sau
poller, exit 0 (F-148-T4-1 ĐÓNG cho lượt này — seq rỗng).

## 0. Verdict tổng

- **Lượt hợp lệ #20: attempt1-18e179e0, 05:59:46–06:04:10Z.**
  Probe 20/20, JSON 2.675.918 B, tickCost total n=489
  **median=60,0 ms** (p90=89,0, max=172, min=31); hậu flip+2000ms
  n=362 median=59,5 ms. Lớp B **ĐẠT 5/5** (B1 load5 cuối 1,12;
  B2 load1 max 1,34, ps-before/after chỉ có vite của mình; B3
  không reboot; B4 pgrep apt/dpkg=0, dpkg delta=0; B5 RAM min
  894 MB, 0 mẫu <500 MB). Coverage (c2) 0/0 — không có seq để
  kiểm (xem §4). Poller thoát exit 0 lúc 06:04:10Z.
- **Cảnh báo trung thực về verdict này:** median **đúng ngưỡng
  60,0 ms** (quyết parent 146 §12.3(j): median ≤60 → hợp lệ;
  60,0 ≤ 60 nên đạt theo luật máy, nhưng không có biên an toàn).
  Đây là lượt chậm nhất trong chuỗi 20 lượt cùng với 1 lượt 60,0
  trước đó (chuỗi §4). Per-pass median 48,0–73,0 ms, 7/20 pass
  median ≥62 ms. Lượt này chậm hơn hẳn đợt 151 (median 39,0 ms)
  — boot mới sau repair + tải nền đầu phiên cao hơn.
- **(c2)=0 — lượt "rỗng bằng chứng":** labellag (c)=0, (c2)=0 ở cả
  skippedLatest=0/1 (454 + 124 occurrence, 0 strip nào khớp
  presented mà label khác với pixel thật khác). Không có seq để
  chạy coverage-check / P1 / P3-A1 / P3' / P7 — tất cả đều 0/0
  (không có occurrence để đánh giá, không cộng dồn, theo đúng
  tiền lệ attempt1-nhiễm-tải đợt 151 cũng (c2)=0). **Verdict
  "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên** — không có điều
  kiện nào trong ba điều kiện mở lại (§13 DEF v0.5) xảy ra
  (không có occurrence (c2) nào; 0 lag âm (c2); không có gì để
  xét), và lượt này cũng không bổ sung bằng chứng mới.
- **Ngân sách dùng 1/3 attempt.** 0 reboot trong phiên (boot
  18e179e0 suốt). Không process T4 nào còn sống lúc đóng
  (poller đã thoát; vite :5187 chết; vite.lock không tồn tại
  lúc đóng 06:08Z).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round152-t4.done` viết ~06:15Z (trong hạn
  cờ ~08:00Z, trước hạn cứng 08:30Z).

## 1. Poller — 25 poll thật, cửa mở 1 lần

- **Test (POLL_TEST=1) 05:39:57Z:** 1 poll, exit 7, ghi RIÊNG
  vào `poll-test-152.log` (F-150-T4-5 ĐÓNG — `poll-t4.log`
  KHÔNG còn dòng test nào; đúng 25 dòng "poll #" thật).
  load1=6,92, load5=3,90, RAM=3992 MB, postboot_exit=1,
  gate0=khong-dat, t5flag=cu(mtime-cu), apt=0, dpkg_lines=2.
  Lưu ý trung thực: header text của test poll còn ghi deadline
  cũ `04:30:00Z` vì test chạy TRƯỚC khi sửa text header —
  DEADLINE_S thực tế lúc đó đã là 07:30Z (đã sửa bằng sed trước
  test); test poll thoát sau 1 poll nên deadline không ảnh
  hưởng gì. Poller thật chạy sau đó ghi đúng `07:30:00Z`.
- **Poll #1–#23 (05:41:31–05:58:16Z):** gate0=khong-dat.
  postboot_exit=1 suốt (replay chưa tới — xem §5); t5flag=
  cu(mtime-cu) (chỉ có cờ T5-151 cũ, không khớp boot mới).
  load1 0,30–10,90, load5 1,78–6,50; RAM 1232–3469 MB
  (giảm đơn điệu suốt phiên chờ, xem F-152-T4-4).
  Blockers>0 ở poll #3–#10 (xem dưới).
- **Poll #24 (05:59:01Z):** t5flag=PASS lần đầu
  (cờ T5-152 mới, mtime 05:58:52Z, dpkg_lines=795) nhưng
  postboot_exit=1 (pb_age=3) + load5=2,08 → **chưa mở**
  (poller đòi cả PB=0 — đúng luật).
- **Poll #25 (05:59:46Z): load1=0,91, load5=1,78, RAM=1232 MB,
  postboot_exit=0 — CỬA MỞ (gate0=T5)** → chạy attempt1.
  Đây là poll duy nhất mà load + RAM cùng đạt.
- **Phân rã 25 poll thật:** RAM≥1024: 25/25; RAM 500–1023:
  0/25; RAM<500: 0/25; RAM min 1232 / max 3469 MB.
  load1<2: 10/25; load5<2: 1/25 (chỉ poll #25).
  gate0: khong-dat 23 poll, T5 2 poll (#24–25),
  T4-check-only 0 poll.
- **Blockers trong lúc chờ (poll #3–#10):** toàn bộ là job
  O8 của T0-152, không phải của T4: poll #3 node
  `clicktest-87o8-mask-track-webkit.mjs` (1 blocker); poll
  #4–#8 đủ bộ 4 (clicktest node + vite :5562 + MiniBrowser +
  WebKitNetworkProcess); poll #9–#10 vite :5556 (O8 Chromium).
  Từ poll #11 blockers=0. Load1 max 10,90 ở poll #10 (O8 +
  apt-get update của T5 repair chạy song song). Các job này
  chỉ ảnh hưởng lúc CHỜ — attempt chạy sau khi blockers=0,
  load đã hạ, nên không nhiễm lượt đo (xem §2, B2 ĐẠT).
- **RAM sập đợt 150 KHÔNG tái diễn trong cửa sổ chờ:** 0 poll
  <500 MB (đợt 150: 34/97 poll <500 MB, min 411 MB). Nhưng
  RAM chờ giảm đơn điệu 3469 → 1232 MB — xem F-152-T4-4.

## 2. Attempt1 — LƯỢT HỢP LỆ #20 (05:59:46–06:04:10Z)

- Probe 20/20 (run-attempt exit 0), JSON 2.675.918 B.
  **tickCost total n=489 median=60,0 ms** (p90=89,0, max=172,
  min=31); hậu flip+2000ms n=362 median=59,5 ms. tBlend gap
  n=388 median=108,0 p90=168,0 max=2256. BlendTick/pass=19,4;
  rAF/pass median=28 (24–34). webkit=27.2, pageErrs=[].
  Wallbands: 0–20k median 63,0; 20–32k median 62,0; 32–45k
  median 62,0; 45–62k median 56,0; 62–70k median 55,0;
  70–80k median 56,5 (toàn lượt median 60,0).
  n=489 tick (ít hơn 648 của đợt 151 — mỗi tick chậm hơn nên
  cùng 20 pass thì đếm được ít tick hơn).
- Lớp B **ĐẠT 5/5** (xem file classb gốc): B1 ĐẠT (load5 cuối
  1,12 ≤2,5); B2 ĐẠT (load1 max 1,34 ≤4; ps-before/after chỉ
  có vite :5187 của chính T4 + esbuild của nó); B3 ĐẠT (boot
  lúc bắt đầu = boot hiện tại = 05:20:57Z); B4 ĐẠT (pgrep
  apt/dpkg=0, ps exact-comm=0, dpkg delta=0); B5 ĐẠT (RAM min
  894 MB, 0 mẫu <500 MB). Sampler n=107.
  Ghi nhận (không vi phạm): 17/107 mẫu RAM <1024 MB — xem
  F-152-T4-4.
- Per-pass (20 pass): median 48,0–73,0 ms; load1 mean theo
  pass 1,14 → 0,64 (giảm dần); RAM mean theo pass 1128 →
  918 MB (giảm dần). Tương quan Pearson: median~load1_mean
  r=0,10; median~RAM_mean r=0,07 (chỉ mô tả — không kết luận
  nhân quả từ 1 lượt).
- **mask_anim.py KHÔNG nhiễm cửa đo đợt này** (xem F-152-T4-5):
  ps-before/after không có mask_anim hay job render nào của
  luồng khác; load1 max trong attempt chỉ 1,34.

## 3. (c2)=0 — phân tích chi tiết

- labellag: skippedLatest=1: nTick=62, nOccurrence=124,
  (c)=0, (c2)=0; lag (a)/(b) median=0f, p90=2f, max=4f,
  min=-9f, 4 lag âm. skippedLatest=0: nTick=227,
  nOccurrence=454, (c)=0, (c2)=0; lag (a)/(b) median=2f,
  p90=3f, max=10f, min=-12f, ≥5f: 12, 59 lag âm.
  Lưu ý theo analyzer: lag (a)/(b) KHÔNG đo được trễ thật
  >2f do alias chu kỳ 4 frame — chỉ (c2) mới có thông tin,
  và (c2)=0 nên không kết luận gì thêm từ các lag (a)/(b)
  này, kể cả 59 lag âm ở skippedLatest=0.
- **lag5 (b): 12 occurrence, 3 event, lag max +10f**
  (event 1: seq 162–163, M=[22], lag max +6f; event 2:
  seq 163–165, M=[26], lag max +8f; event 3: seq 239–242,
  M=[29], tBlend 57657–57943, presented 21→30, label 19→24,
  lag max +10f). Đây là lag (b) — strip KHỚP label nên
  không phải (c2). Ghi nhận: mức +10f tương tự event
  seq 362–365 đợt 151 (+10f), NHƯNG đợt 151 event đó kèm
  (c2) seq 365, còn đợt này 3 event (b) đều KHÔNG kèm (c2)
  nào. Khác biệt này được ghi lại, không suy diễn thêm.
- skiplatest: **F6' DONG** — skippedLatest=1: 62/62 tick
  không vi phạm (nhãn 100%, pixel-verified 100%, 0 vi phạm
  thật); skippedLatest=0 đối chứng: 227/227 tick sạch.
- c2drawlog: n=941 (drawSrc 489, rawUnit 452), 1 epoch,
  loopNo 1–21, frameIdx 0–72 (62 distinct), wallMs span
  74.500 ms. **Loop 18 chỉ 1 entry** (các loop khác 39–56)
  — lỗ hổng log, xem F-152-T4-2. RE-ARM 7 lần trong lượt
  (sau pass 4, 7, 9, 11, 13, 15, 17 — window.__vcutC2DrawLog
  cứ ~2 pass lại về false rồi re-arm).
- stall analyzer: baseline P(stall≥2)=76/288 = 0,264;
  "(c2)=0 — khong co seq de kiem P3'".

## 4. p1p3p7 chạy tay + số cộng dồn (c2) — 20 LƯỢT HỢP LỆ

- p1p3p7 chạy TAY sau poller (nợ F-148-T4-1 — run-attempt
  không gọi tự động), exit 0:
  `python3 analyze-t4-p1p3p7.py
  preview-b-f3-flip-webkit-t4-attempt1-18e179e0.json ""`.
  Output: `(c2) seqs: [] — khong co seq de tinh P1/P3-A1/P7
  (0 occurrence)`.
- **P1: 0/0 — P2: 0/0 — P3-A1: 0/0 — P3': 0/0 — P7: 0/0**
  (không có occurrence để đánh giá).
- **P3' theo dõi (quyết parent (n) đợt 151):** mẫu seq-365
  KHÔNG tái diễn — không có (c2) nào trong lượt này để xét;
  **KHÔNG mở điều tra** (đúng brief: chỉ ghi rõ để mở xem
  xét đợt sau NẾU tái diễn — lần này không tái diễn).
- **Cộng dồn KHÔNG ĐỔI (20 lượt hợp lệ): P1 62/62, P2 53/53,
  P3-A1 55/62, P3' 32/34, P7 48/48** (giữ nguyên từ 19 lượt
  đợt 151 — lượt này đóng góp 0 occurrence).
- Chuỗi median tickCost 20 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  **60,0 ms** (trung bình ~49,5 ms). Không lượt nào vượt
  ngưỡng 60 ms trong chuỗi 20 lượt — nhưng lượt này chạm
  ĐÚNG ngưỡng 60,0 (lần thứ hai trong chuỗi, sau 1 lượt
  60,0 trước đó).

## 5. Replay/postboot trên boot mới — KHÔNG TỚI TỰ NHIÊN, T5 REPAIR SỚM

- Boot #43 18e179e0 (btime 05:20:57Z): **replay KHÔNG tới tự
  nhiên** — dpkg.log đóng băng 2 dòng từ 05:35:44–45Z
  (boot+14m48s, chỉ "startup packages configure", 0 install),
  cache apt **0 .deb**, lists 5, GST thư mục hệ thống 0 file
  (debroot 269). Đây là mẫu "replay không tới" giống boot
  e9295700 đợt 150 (khác đợt 151: replay tới tự nhiên, xong
  boot+4m22s).
- **T5-152 repair sớm (quyết parent 150 §12.3(h)):** watcher
  T5 trigger ở boot+900s (05:46:03Z, frozen ≥600s) — verify
  form-B exit=1, rồi --repair (symlink GST → debroot) +
  apt-get update + install. Kết quả: dpkg.log 2 → 795 dòng
  (xong 05:58:51Z, gói cuối libc-bin), cache **110 .deb**,
  lists 75, GST sys 269. Cờ T5-152: `round152-t5/POSTBOOT_PASS`
  cho boot 18e179e0 (ghi full boot_id), mtime **05:58:52Z,
  poll=1** — **KHÔNG cần repair thêm**.
- T4 check-only độc lập PASS ở poll #25 (05:59:46Z, exit 0)
  — gate0 được xác nhận kép (cờ T5 + check-only T4).
- Lưu ý nhỏ cho T5 (không ảnh hưởng verdict T4): text trong
  cờ T5-152 ghi "postboot PASS poll1 exit 0 luc 05:46:03Z"
  nhưng log verify form-B của T5 lúc 05:46:03Z ghi exit=1
  (CHƯA DU) — mốc 05:46:03Z thực tế là thời điểm trigger
  repair, còn PASS sau repair là ~05:58Z (mtime cờ
  05:58:52Z). T5 nên đính chính text cờ trong LIMITS T5-152.
- Đối chiếu đợt 150: boot e9295700 replay KHÔNG tới + RAM sập
  — đợt này replay cũng không tới tự nhiên NHƯNG repair sớm
  đã cứu được (dpkg 795, cache 110); RAM chờ 25/25 poll
  ≥1024 (không sập).

## 6. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND152_T4_WEBKIT_QUIET22_LIMITS.md`.
- **Script snapshot để stage (theo mẫu đợt 149/150/151), trong
  repo `apps/web/scripts/` (md5 khớp bản làm việc ở
  `hidden_files/round152-t4/`):** `poll-wait-t4-152.sh`
  (md5 `78204ce92083c34f261baebaacea5100`),
  `run-attempt-152.sh` (md5 `55301b69c982e8b82e26c8691f65a9b2`).
  Thay đổi so với 151: deadline poller 07:30Z (hạn cờ
  ~08:00Z, cứng 08:30Z); cờ T5 ưu tiên round152-t5/, dự phòng
  round151-t5/; nhãn analyzer T4-152a; inner kiểm file
  round151-* (thay vì round150-*); **sửa F-151-T5-3**
  (mọi nhánh vòng lặp ứng viên cờ T5 đều `break` — xem §7).
  **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` — byte-identical với bản
  đã vá đợt 148/149/150/151) và **KHÔNG ghi đè
  `t4-attempt-inner.sh` / `check-classb-t4.sh`**
  (bản làm việc ở `hidden_files/round152-t4/`, chỉ đổi số
  vòng/đường dẫn so với 151 — theo đúng mẫu 149/150/151).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-152.sh`, `run-attempt-152.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7).
- **Log/evidence (hidden_files/round152-t4/, không stage):**
  `poll-t4.log` (start + 25 poll thật + CUA MO + verdict;
  0 dòng test), `poll-test-152.log` (test exit 7, riêng),
  `poll-t4.nohup.log`, `chain-t4.log`,
  `postboot-t4-152-gate0wait-*.log` (check-only mỗi 4 poll),
  `burst-snapshot-close-0608Z.txt` (đóng),
  `blockers-ps-*.txt` / `blockers-list-*.txt` (poll #3–#10);
  attempt1: `preview-b-f3-flip-webkit-t4-attempt1-18e179e0.json`
  (2.675.918 B) + 10 analyzer (gồm p1p3p7 chạy tay) +
  classb + coverage-check ((c2)=0) + ps-before/after +
  load-mid + vite log; `attempt-done-attempt1-18e179e0`
  (ngân sách 1/3).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§6); không process T4 nào còn sống lúc đóng.
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round152-t4-quiet22.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã
  verify bằng `od`).
- **Cờ:** `hidden_files/round152-t4.done` (~06:15Z — trong hạn
  cờ ~08:00Z).

## 7. Sai số F-152-T4-1..5 (+ nợ cũ)

- **F-152-T4-1 — Lượt hợp lệ nhưng (c2)=0 + median đúng ngưỡng
  60,0 ms.** Lượt hợp lệ thứ 20 theo luật máy (20/20 + B 5/5
  + median ≤60), nhưng là lượt "rỗng bằng chứng" cho điều tra
  ghost-freeze: 0 occurrence (c2), cộng dồn P-counts không đổi
  (62/62, 53/53, 55/62, 32/34, 48/48). Median đúng ngưỡng
  (không dư) — lần thứ hai trong chuỗi 20 lượt chạm đúng 60,0.
  Có thể do tick chậm hơn (n=489 tick, rAF/pass median 28 so
  với 40 đợt 151) nên strip sampling bắt được ít mismatch hơn
  — chỉ là giả thuyết mô tả, không kết luận. Ghi nhận, không
  đổi luật (T4 không tự đổi luật chờ).
- **F-152-T4-2 — RE-ARM draw log 7 lần + loop 18 chỉ 1 entry.**
  Cửa sổ draw log cứ ~2 pass lại đóng
  (window.__vcutC2DrawLog=false) rồi re-arm (sau pass 4, 7, 9,
  11, 13, 15, 17); log vẫn đủ 941 entry nhưng có lỗ ở loop 18
  (1 entry so với 39–56 ở các loop khác). Không ảnh hưởng
  verdict lượt này (không có seq (c2) để cover), nhưng nếu
  lượt sau có (c2) rơi đúng lỗ log thì coverage-check có thể
  sai lệch. Giao T0/probe xem xét (T4 không sửa probe).
- **F-152-T4-3 — Replay boot mới KHÔNG tới tự nhiên, phải
  repair sớm (T5).** dpkg.log 2 dòng đóng băng từ boot+14m48s;
  T5 repair 05:46:03Z → 795 dòng lúc 05:58:51Z. T4 chờ 25 poll
  (~18 phút) mới mở cửa. Không phải lỗi T4; ghi nhận cho
  T5/T10. Chuỗi "replay tới tự nhiên" 1 → 0 ĐỨT (đợt 151 tới,
  đợt 152 không tới).
- **F-152-T4-4 — RAM giảm đơn điệu trong lúc chờ + trong lượt.**
  Chờ: 3469 → 1232 MB qua 25 poll (giảm suốt, không hồi);
  trong attempt: RAM mean theo pass 1128 → 918 MB, min 894 MB,
  17/107 mẫu <1024 MB. Chưa vi phạm B5 (<500 MB) nhưng xu
  hướng giảm giống mẫu đợt 150 (RAM sập) ở mức nhẹ hơn.
  Ghi nhận, theo dõi đợt sau.
- **F-152-T4-5 — mask_anim.py KHÔNG nhiễm cửa đo đợt này.**
  ps-before/after sạch (chỉ vite :5187 của T4); load1 max
  trong attempt 1,34. Đây là lần đầu sau 3 lần nhiễm (đợt 149
  A2/A3, đợt 151 attempt1) job nặng không tái diễn trong cửa
  đo T4. Ghi nhận tích cực; hướng dẫn đứng vẫn giữ.
- **F-151-T5-3 — ĐÃ SỬA, chưa kiểm chứng live đường elif/else.**
  Poller 152 đã thêm `break` vào nhánh `elif`/`else` của vòng
  lặp ứng viên cờ T5 (ứng viên đầu tiên TỒN TẠI quyết định T5S;
  fallback cũ không ghi đè). Đã test lại: test poll exit 7 +
  25 poll thật chạy đúng (T5S hiển thị đúng
  "cu(mtime-cu)(t5src=151-t5/POSTBOOT_PASS)" lúc chỉ có cờ cũ,
  và "PASS(t5src=152-t5/POSTBOOT_PASS)" khi cờ mới xuất hiện).
  NHƯNG đường elif/else cụ thể (cờ chính tồn tại nhưng
  non-PASS) không được chạm trong lượt này — cờ chính vắng
  mặt cho tới khi đã PASS — nên kiểm chứng live của nhánh sửa
  vẫn chưa xảy ra; chờ lượt sau có cờ chính non-PASS. Không
  đánh ĐÓNG vội.
- **F-148-T4-1 — ĐÓNG (cho lượt này).** p1p3p7 KHÔNG được
  run-attempt gọi tự động (vẫn đúng — chạy tay sau poller,
  exit 0, seq rỗng, xem §4). Nợ đứng này vẫn còn ở mức cơ chế
  (script chưa tự gọi); mỗi đợt T4 phải chạy tay và ghi rõ.
- **F-150-T4-5 — ĐÓNG.** Test poll ghi riêng
  `poll-test-152.log` (exit 7); `poll-t4.log` đúng 25 dòng
  poll thật (+ các dòng start/CUA MO/verdict và 8 dòng ghi
  blockers-snapshot), thống kê §1 không cần tách tay nữa.

## 8. Chờ quyết parent / nợ đợt 153

- **(a) #22 CÓ lượt hợp lệ mới (thứ 20, median 60,0 ms ĐÚNG
  NGƯỠNG, (c2)=0) — đo tiếp đợt 153** với cùng cổng tickCost
  ≤60 ms + probe đã vá (không đổi ngưỡng — lượt này chạm đúng
  ngưỡng nhưng vẫn đạt theo luật máy; không có căn cứ nào để
  bàn ngưỡng từ 1 lượt).
- **(b) P3' vẫn 32/34 (0/0 lượt này, F-151-T4-3 không tái diễn):
  ** theo dõi đợt sau — nếu (c2) xuất hiện trở lại thì xét
  tiếp. Hiện tại chỉ ghi nhận.
- **(c) mask_anim.py U4 không nhiễm đợt này (F-152-T4-5):**
  hướng dẫn đứng (job nặng tránh cửa đo T4) vẫn giữ — T4
  không có quyền chặn job luồng khác, chỉ ghi nhận.
- **(d) F-148-T4-1 (cơ chế):** p1p3p7 vẫn chạy tay — có nên
  nối vào run-attempt không? Parent phán (hiện tại chạy tay
  vẫn xong đúng hạn, không gấp).
- **(e) F-152-T4-2 (RE-ARM 7 lần + loop 18 lỗ):** giao T0 xem
  probe/draw-log — có thể ảnh hưởng coverage-check lượt sau.
- **(f) F-151-T5-3:** sửa xong nhưng chưa kiểm chứng live
  đường elif/else — theo dõi lượt sau.
- **(g) Các nợ đứng khác giữ nguyên từ đợt 151 §8:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #72?/#73? giao T2; birefnet 0 thử;
  u2net là fallback chính thức.

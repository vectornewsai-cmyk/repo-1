# PHASE9_ROUND150_T4_WEBKIT_QUIET22_LIMITS.md

**Đợt:** 150. **Luồng:** T4 — đo lượt yên WebKit #22 trên boot mới
(reboot #40). **Ngày:** 19–20/11/2026.
**Boot đo:** e9295700 (btime 23:32:09Z 19/11 /proc/stat; boot_id đầy đủ
e9295700-bda0-4a9b-8aab-4dd57661212e). **Trạng thái:
#22 VẪN MỞ — 0 ATTEMPT (cửa không mở lần nào trong 97 poll thật;
poller hết hạn chờ 01:00Z, thoát exit 5 lúc 01:00:32Z).** Không có
số đo tickCost nào đợt này; không có attempt nào để cộng dồn hay
đánh giá lớp B. Hai việc bắt buộc của đợt đều xong ở mức script:
retry poll-lại-gate theo quyết parent 149 §12.3(h) đã cài + kiểm
bằng test poll, và tên gọi run-attempt trong poll-wait đã sửa đúng
(F-149-T4-2) — nhưng cả hai đều CHƯA được kiểm chứng live vì
không attempt nào chạy.

## 0. Verdict tổng

- **0 attempt / 0 lượt hợp lệ / 0 lượt nhiễm tải.** Poller chạy
  23:47:02Z–01:00:32Z, 97 poll thật (cộng 1 test poll trước đó),
  **gate0 = khong-dat trong 97/97 poll** (postboot_exit=1 trong
  97/97; cờ T5-150 không có; cờ round149-t5 cũ, mtime-cu, không
  khớp boot mới). **Cửa không mở lần nào.**
- **Nguyên nhân chặn chính — gate0 (postboot):** apt replay hệ
  thống KHÔNG khởi động trên boot e9295700 (xem §3): dpkg.log
  đóng băng 2 dòng từ 23:35:42Z đến lúc đóng, 0 install, cache
  0 .deb, lists 3 file. Libs/GST thiếu suốt phiên nên postboot
  check-only FAIL mọi lần. T5-150 chạy --repair lúc ~00:50Z
  (GST symlink lại + apt-get update) nhưng đến lúc poller cắt
  (01:00Z) update vẫn đang chạy, chưa có POSTBOOT_PASS.
- **Nguyên nhân chặn thứ hai — RAM (gate A):** RAMavail ≥1024 MB
  chỉ 37/97 poll; poll RAM≥1024 cuối là #39 (00:16:05Z, 1090 MB)
  — sau đó **58 poll liên tiếp (00:16:50Z–00:59:47Z) đều <1024 MB**.
  RAM <500 MB trong 34/97 poll (min 411 MB) — hiện tượng RAM sập
  đợt 147 TÁI DIỄN trong cửa sổ chờ (xem F-150-T4-1).
- **Chỉ 3/97 poll mà load1<2 + load5<2 + RAM≥1024 cùng đạt**
  (lúc đó chỉ gate0 chặn). Còn lại, ngay cả khi postboot đã PASS
  thì phần lớn thời gian gate A cũng không đủ (RAM).
- **Retry poll-lại-gate (quyết (h)): ĐÃ CÀI, CHƯA KIỂM CHỨNG LIVE.**
  Vòng retry mới (hàm `wait_gate()` dùng chung cho attempt đầu và
  mọi retry) đã qua `bash -n` + test poll exit 7, nhưng vì 0
  attempt nên không có retry nào xảy ra — đường code mới chưa
  chạy live lần nào. Kiểm chứng dời sang đợt 151 (xem §9).
- **F-149-T4-2: ĐÃ SỬA.** Poll-wait-150 gọi đúng
  `run-attempt-150.sh` (dòng 250); grep toàn bộ script đợt 150
  không còn lệnh gọi `run-attempt-148.sh` nào (chỉ còn 1 dòng
  comment giải thích lỗi cũ). Không cần symlink vá lúc chạy như
  đợt 149.
- **Số cộng dồn (c2) — VẪN 18 lượt hợp lệ, không đổi:** P1 52/52,
  P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38 (như cuối đợt 149).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở poller,
  lúc test poll, lúc đóng — không đổi). **0 reboot trong phiên**
  (boot e9295700 suốt). Không process T4 nào còn sống lúc đóng
  (poller đã thoát exit 5 lúc 01:00:32Z; vite :5187 không bao giờ
  chạy; vite.lock lúc đóng do T8 giữ, xem §5).
- **Cờ:** `hidden_files/round150-t4.done` viết 01:05:18Z (trong hạn
  cờ ~01:30Z). Lưu ý thứ tự: T8 đã lấy vite.lock lúc 01:02:14Z —
  sau khi poller T4 thoát nhưng TRƯỚC khi cờ T4 viết (xem
  F-150-T4-4).

## 1. Poller — 97 poll thật, cửa không mở lần nào

- **Test (POLL_TEST=1) 23:46:38Z:** 1 poll, exit 7. load1=0,27,
  load5=0,95, RAM=900 MB, postboot_exit=1, gate0=khong-dat,
  t5flag=cu(mtime-cu), apt=0, dpkg_lines=2, cây YES 530e10a7.
  (Test poll ghi chung vào poll-t4.log — log có 98 dòng "poll #"
  = 1 test + 97 thật; thống kê dưới đây tách test ra bằng
  `tail -n +2`, xem F-150-T4-5.)
- **Poll #1–#8 (23:47:02–23:52:0xZ):** boot mới 15 phút tuổi,
  RAM 570–1130 MB (dao động mạnh), load1 0,27–2,87, load5 0,77–
  3,52. postboot_exit=1 (libs/GST thiếu), t5flag=cu(mtime-cu),
  gate0=khong-dat. apt=0, dpkg_lines=2 (replay chưa chạy).
- **Poll #9–#27 (23:53–00:07Z):** RAM hồi lên 1014–1976 MB
  (nhiều poll ≥1024), nhưng load5 leo 3,21–5,34 (đỉnh load1 8,88
  lúc 00:06:59Z — T2 hole-recheck, xem §5). postboot vẫn exit=1.
- **Poll #28–#41 (00:07–00:17Z):** máy yên lại (load1 0,10–
  1,62; load5 0,76–1,68); RAM 993–1410 MB — poll #39 (00:16:05Z,
  1090 MB) là poll RAM≥1024 CUỐI CÙNG. postboot vẫn exit=1.
- **Poll #42–#97 (00:17–00:59:47Z):** RAM sập hẳn: 58 poll liên
  tiếp <1024 MB (dao động 411–842 MB, phần lớn 430–570 MB);
  34/97 poll toàn phiên <500 MB. Load yên (load1<2 trong 76/97
  poll toàn phiên; load5<2 trong 62/97). postboot vẫn exit=1;
  gate0=khong-dat 97/97.
- **Hết hạn:** poll #98 (01:00:32Z) chạm DEADLINE_S → ghi "HET HAN
  CHO 01:00Z — GATE DO LUC HET HAN (poll cuoi #97):
  gate0(co-T5=cu(mtime-cu),postboot_exit=1) gateA-RAM(777MB<1024)"
  rồi "0 attempt — dong theo brief dot 150", thoát exit 5.
  (poll-t4.log mtime 01:00:32Z khớp.)
- **Phân rã 97 poll thật:** RAM≥1024: 37; RAM 500–1023: 26;
  RAM<500: 34; RAM min 411 / max 2269 MB. load1<2: 76/97;
  load5<2: 62/97. postboot_exit=0: 0/97. Chỉ 3 poll mà load +
  RAM cùng đạt, chỉ còn gate0 chặn.

## 2. Script — retry poll-lại-gate (quyết (h)) + sửa tên run-attempt

- **Thiết kế mới (quyết parent 149 §12.3(h), sửa F-149-T4-3):**
  thân poll tách thành hàm `poll_once()` (reboot-detect, RAM/load,
  lock, blockers snapshot comm-based, cây, cờ T5, postboot
  check-only mỗi 4 poll, apt/dpkg, đánh giá gate0+gateA, ghi log
  1 dòng; đặt GATE_OPEN / DEADLINE_HIT). Hàm `wait_gate()` lặp
  `poll_once` + sleep 45 s đến khi cửa mở hoặc hết hạn — dùng
  CHUNG cho attempt đầu và mọi retry. Hàm `eval_attempt()` giữ
  nguyên luật verdict đợt 149 (lớp B DAT 5/5 + tickCost median
  ≤60 ms mới là lượt hợp lệ; RC=10 dừng; hết ngân sách exit 11).
  Luồng chính: `wait_gate` → chạy attempt → `eval_attempt` →
  nếu retry thì `wait_gate` lại rồi mới chạy attempt kế (KHÔNG
  còn `sleep 10; continue` chạy mù như 148/149).
- **Kiểm chứng script (không live):** `bash -n` OK cho cả 4 script
  (.sh); POLL_TEST=1 exit 7, dòng poll đầy đủ trường; grep không
  còn lệnh gọi `run-attempt-148.sh` (chỉ 1 dòng comment); tên
  gọi đúng `run-attempt-150.sh` (dòng 250). Probe
  `probe121t3-ghost-k7.webkit.mjs` md5 `4291e539ce1d330bd35ec7b3b6764f05`
  — **byte-identical với bản đã vá đợt 148/149**, không sửa.
- **Các script khác:** copy từ 149, chỉ đổi số vòng/đường dẫn/
  nhãn (run-attempt-150: nhãn analyzer T4-150a; inner: kiểm file
  vòng trước round149-*; check-classb: đổi W). `bash -n` OK.
- **Hạn:** poller cắt 01:00Z 20/11 (brief: cờ ~01:30Z, cứng
  02:00Z) — giữ 30 phút đệm để đóng cờ, theo bài học đợt 143.
  Cờ T5: ưu tiên round150-t5/, dự phòng round149-t5/ (cùng boot).

## 3. Apt replay hệ thống KHÔNG khởi động trên boot e9295700

- **Bằng chứng:** `/var/log/dpkg.log` 2 dòng (94 B, mtime 23:35:42Z
  "startup packages configure") ĐÓNG BĂNG suốt phiên — lúc đóng
  (01:02Z) vẫn 2 dòng. `/var/log/apt/history.log` KHÔNG tồn tại.
  `pgrep -x apt-get/dpkg` = 0 trong mọi poll (97/97). Cache apt
  0 .deb; `/var/lib/apt/lists/` 3 file. Replay-watch của T5-150
  ghi 120 poll giống hệt nhau (dpkg_lines=2, apt=[], dpkg=[],
  gst_sys=0, cache=0, lists=3) rồi **TIMEOUT 00:44:15Z**
  (boot+72m).
- **So sánh:** đợt 149 replay khởi động muộn boot+35m05s rồi cài
  xong trong ~2 phút (1545 dòng / 221 installs). Đợt này đến
  boot+88m (lúc đóng) vẫn 0 install — tệ hơn hẳn, không phải
  "khởi động muộn" mà là "không khởi động".
- **T5-150 --repair (~00:50Z):** sau khi replay-watch timeout,
  T5 chạy postboot --repair: `t5-postboot-repair.log` ghi
  "REPAIRED GST: symlink lại -> debroot (269 file)" + "lists có
  thể trống sau reboot — chạy apt-get update trước khi install".
  Lúc đóng (01:02–01:03Z) `apt-get update` (PID 62453) VẪN ĐANG
  CHẠY; dpkg_lines vẫn 2; chưa có POSTBOOT_PASS. Repair đến quá
  muộn so với hạn cắt poller 01:00Z (chỉ ~10 phút), và RAM lúc
  đó đã <1024 nên dù postboot PASS thì gate A vẫn chưa đủ.
- **Hệ quả cho T4:** gate0 không thể đạt trong phiên này bằng
  bất kỳ đường nào (cờ T5 không có; check-only FAIL vì libs
  thiếu). Đây là nguyên nhân chặn chính, không phải tải đo.

## 4. RAM — sập dưới 500 MB tái diễn trong cửa sổ chờ

- **Diễn biến:** mở cửa RAM 570 MB (23:47Z) → hồi lên đỉnh
  2269 MB (~00:00Z) → 37 poll ≥1024 (chủ yếu 23:53–00:16Z) →
  từ poll #39 (00:16:05Z) sập và KHÔNG hồi lại: 58 poll liên tiếp
  <1024 MB, dao động 411–842 MB, phần lớn 430–570 MB; 34/97 poll
  <500 MB (min 411 MB). Swap đã dùng tăng 329 → 418 MB trong
  phiên (tổng 1023 MB). Lúc đóng RAMavail 830 MB (01:02Z).
- **Đối chiếu đợt 149:** trong 373 mẫu sampler giữa 3 attempt,
  0 mẫu <500 MB — hiện tượng RAM sập đợt 147 KHÔNG tái diễn
  trong cửa sổ đo. Đợt này nó tái diễn ở CỬA SỔ CHỜ (poller
  45 s/poll), không phải giữa attempt (không có attempt nào).
  Ngưỡng B5 (<500 MB giữa lượt) không áp dụng trực tiếp ở đây —
  đây là dữ kiện gate-A (ngưỡng 1024 MB), nhưng cùng một hiện
  tượng balloon ghìm trần (T9-149: balloon ghim trần trở lại trên
  boot mới, 49/82 mẫu).
- **Ghi nhận, không kết luận vượt dữ kiện:** RAM sập xảy ra trong
  lúc máy YÊN (load1 0,10–1,62 giai đoạn 00:17–01:00Z), không
  gắn với job nặng nào — giống mẫu balloon hơn là mẫu tải.
  Cần T9-150 đối chiếu sampler của họ.

## 5. Nhiễm tải trong cửa sổ chờ + trạng thái lúc đóng

- **Đỉnh tải duy nhất (00:04–00:07Z):** load1 leo 4,68 → 7,36 →
  7,53 → 8,88; load5 3,19 → 5,34. Nguồn quy được tên: T2
  `python3 hole-recheck.py` (PID 45593, ~18% CPU, 1m36s) +
  các lệnh `find` của T2 (bench_pixelate_geq.sh). Tải tan sau
  ~00:08Z; phần còn lại của phiên load1<2 trong 76/97 poll.
  Các luồng khác lúc mở cửa: T10 `tsc --noEmit`, T9 sampler/
  b2-watcher, T8 waiter, T5 replay-watch/testsrc2-watch — nhẹ,
  không ghi nhận job render nặng nào trong cửa sổ chờ.
- **Lúc đóng (01:02Z):** load 1,14/0,58/0,65; RAMavail 830 MB;
  swap đã dùng 418/1023 MB; `apt-get update` (PID 62453) của
  T5-repair vẫn chạy; dpkg_lines=2; không có POSTBOOT_PASS.
  **vite.lock do T8-round150 giữ** (pid 65431, port 5560,
  started 01:02:14Z, boot e9295700) — T8 lấy lock SAU khi poller
  T4 thoát (01:00:32Z) nhưng TRƯỚC khi cờ T4 viết (01:05:18Z),
  xem F-150-T4-4. :5187 chết (http=000); không process T4 nào
  còn sống.
- **Burst snapshot:** mở cửa `burst-snapshot-2347Z.txt`
  (23:47Z, RAM 570 MB); đóng `burst-snapshot-0102Z.txt`
  (01:02Z, RAM 830 MB).

## 6. Số cộng dồn (c2) — 18 LƯỢT HỢP LỆ, KHÔNG ĐỔI

- **P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38** — như
  cuối đợt 149. Không attempt nào đợt này nên tử số/mẫu số đều
  giữ nguyên. Không có số đo tickCost, (c2), lag5 hay skiplatest
  nào mới.

## 7. Bằng chứng + files

- **LIMITS này:** `docs/PHASE9_ROUND150_T4_WEBKIT_QUIET22_LIMITS.md`.
- **Script snapshot để stage (theo mẫu đợt 149), trong repo
  `apps/web/scripts/` (md5 khớp bản làm việc ở
  `hidden_files/round150-t4/`):** `poll-wait-t4-150.sh`,
  `run-attempt-150.sh`. **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` md5 `4291e539...` —
  byte-identical với bản đã stage đợt 148) và **KHÔNG ghi đè
  `t4-attempt-inner.sh` / `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round150-t4/`, chỉ đổi số vòng/đường dẫn so với
  149 — theo đúng mẫu 149).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-150.sh`, `run-attempt-150.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7).
- **Log/evidence (hidden_files/round150-t4/, không stage):**
  `poll-t4.log` (103 dòng: start + 98 dòng poll [1 test + 97
  thật] + 2 dòng HET HAN), `poll-t4.nohup.log`,
  `chain-t4.log` (4 dòng — chỉ start + HET HAN, không có
  CUA MO/attempt nào), `poll-test-150.log` (test exit 7),
  `postboot-t4-150-gate0wait-*.log` (check-only mỗi 4 poll,
  đều FAIL), `burst-snapshot-2347Z.txt`,
  `burst-snapshot-0102Z.txt`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§7); không JSON/classb/sampler/analyzer attempt nào
  (0 attempt); không process T4 nào còn sống lúc đóng.
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round150-t4-quiet22.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round150-t4.done` (01:05:18Z — trong hạn
  cờ ~01:30Z).

## 8. Sai số F-150-T4-1..5

- **F-150-T4-1 — RAM sập <500 MB tái diễn trong cửa sổ chờ.**
  34/97 poll <500 MB (min 411 MB); sau poll #39 (00:16:05Z)
  RAM không hồi lên ≥1024 lần nào trong 58 poll còn lại. Khác
  147 ở chỗ: không có attempt nào chạy nên không có dữ kiện B5
  giữa lượt; đây là dữ kiện gate-A trong lúc máy yên (không gắn
  job nặng). Nợ T9-150 đối chiếu sampler; nợ T4-151: nếu RAM
  vẫn sập thì cửa khó mở dù postboot PASS.
- **F-150-T4-2 — Apt replay hệ thống KHÔNG khởi động trên boot
  e9295700.** 0 install sau boot+88m (đợt 149: khởi động muộn
  boot+35m05s rồi cài xong). T5 --repair bắt đầu 00:50Z nhưng
  apt-get update vẫn chạy lúc đóng; chưa có POSTBOOT_PASS.
  Đây là nguyên nhân chặn chính của đợt (gate0 0/97). Nợ T5-151
  (xem §9).
- **F-150-T4-3 — Retry poll-lại-gate (quyết (h)) chưa kiểm chứng
  live.** Đã cài đúng (hàm `wait_gate()` dùng chung; `bash -n`
  OK; test poll exit 7) nhưng 0 attempt → 0 retry → đường code
  mới chưa chạy live lần nào. Không được coi là "đã xong" cho
  đến khi có 1 retry thật ở đợt sau.
- **F-150-T4-4 — T8 lấy vite.lock trước cờ T4.** T8-round150 lấy
  lock 01:02:14Z, sau khi poller T4 thoát (01:00:32Z) nhưng
  trước khi T4 viết cờ done (01:05:18Z). T4 viết cờ đúng hạn
  (~01:30Z) nhưng thứ tự "T8 sau cờ T4" không giữ được theo
  nghĩa chặt đợt này (khác 149: cờ viết sớm 21:1xZ, T8 chạy sau).
  T10 ghi nhận khi trích O8 đợt 150: trích là "harness sau khi
  poller T4 thoát", KHÔNG trích là "sau cờ T4" (theo tinh thần
  quyết (f) đợt 149).
- **F-150-T4-5 — Test poll ghi chung file poll-t4.log.**
  Log có 98 dòng "poll #" (1 test 23:46:38Z + 97 thật); thống
  kê đã tách bằng `tail -n +2`. Lần sau: test poll ghi file
  log riêng, không ghi chung poll-t4.log.

## 9. Chờ quyết parent / nợ đợt 151

- **(a) #22 VẪN MỞ — đo lại đợt 151** với cùng cổng tickCost
  ≤60 ms + probe đã vá (không đổi ngưỡng — đợt này 0 số đo nên
  không có căn cứ nào để bàn ngưỡng).
- **(b) F-150-T4-3: retry poll-lại-gate giữ nguyên, kiểm chứng
  live ở đợt 151** khi có attempt đầu tiên (cần ít nhất 1 retry
  thật để coi quyết (h) là đã kiểm chứng).
- **(c) F-150-T4-2: replay không khởi động + RAM sập — có nên
  đổi chiến lược chờ?** Ví dụ: T5 repair sớm hơn (không chờ
  replay-watch timeout 60'), hoặc T4-151 chờ qua 1 lượt cron để
  repair xong rồi mới mở poller. Parent phán — T4 không tự đổi
  luật chờ.
- **(d) F-148-T4-1 vẫn nợ:** p1p3p7 KHÔNG được run-attempt gọi tự
  động (chạy tay sau poller). Không ảnh hưởng đợt này (0 attempt).
- **(e) Các nợ đứng khác giữ nguyên từ đợt 149 §9:** G1 chờ user,
  R9 (16), ci-security.yml 403, file oversize 6,4 MB, TTS 39 cấm
  kiểm lại; mù #71? giao T2-151; birefnet 0 thử; u2net là
  fallback chính thức.

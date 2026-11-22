# PHASE9_ROUND158_T4_WEBKIT_QUIET27_LIMITS.md

**Đợt:** 158. **Luồng:** T4 — đo lượt yên WebKit #27 trên 1 boot
+ LƯỢT HỢP LỆ #23 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 → #23 đợt 158)
+ KHÔNG PAGE-WEDGED (0 wedge — chữ ký đợt 156 không tái diễn đợt thứ hai liên tiếp).
**Ngày:** 20–21/11/2026 (lượt cron 06:35 +07 21/11 = 23:35:51Z 20/11).
**Boot đo:** 28366bd0 (reboot #58 ĐÃ XÁC NHẬN, quyết (s) đợt 157;
btime 23:06:08Z — boot lúc mở; KHÔNG có reboot mới trong lúc đo
hay lúc đóng sổ; kiểm cuối 00:01:03Z vẫn 28366bd0).
**Trạng thái:
#27 CÓ LƯỢT HỢP LỆ — attempt3 chạy sau 2 attempt lỗi setup do
chính T4 (thiếu file b.json — F-158-T4-1/2), ĐẠT NGAY ở attempt
cuối cùng, ngân sách 3/3 dùng hết (poller thoát 23:57:16Z, trước
hạn cắt 01:30Z gần 1h33m). Attempt3-28366bd0 probe 20/20, LỚP B
ĐẠT 5/5, tickCost median 41,0 ms ≤60 (dư 19 ms). (c2)=7 occurrence
/ 7 distinct-seq, COVERED 7/7. P1 ĐÚNG (7/7 occ), P2 ĐÚNG (7/7 lag
+1f, 0 âm), P3-A1 ĐÚNG (7/7 occ, p=9,68e-05 — đảo lại sau SAI đợt
157), P3' 7/7 occ ĐẠT (DAT seq 153, 234, 289, 318, 378, 436, 463),
P7 ĐÚNG (0 entry trễ ≥+1f). lag≥+5f = 0 occurrence (sạch hơn hẳn
đợt 157: 30 occ). Cộng dồn MỚI (23 lượt hợp lệ): P1 86/87, P2
78/78, P3-A1 72/87, P3' 51/59 occurrence = 51/54 distinct-seq, P7
57/57. Cờ T5-158 CÓ cho boot đo (POSTBOOT_PASS 23:43:22Z, replay
đầy đủ, không cần repair).**

## 0. Verdict tổng

- **#27 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #23, attempt3).**
  Ngân sách 3 attempt/đợt dùng **3/3**: attempt1 + attempt2 lỗi
  setup (exit 2, KHÔNG CÓ JSON — probe chưa từng chạy, xem §2),
  attempt3 ĐẠT. Poller thoát 23:57:16Z vì LUOT HOP LE — KHÔNG
  phải hết ngân sách hay hết hạn (hạn cắt 01:30Z còn 1h33m).
- **Attempt3-28366bd0 (23:53:09–23:57:16Z): probe 20/20, LỚP B
  ĐẠT 5/5, tickCost median 41,0 ms ≤60 (dư 19 ms) — LƯỢT HỢP
  LỆ.** Vite :5187 (giữ lock ~7 s cho attempt1/2, ~4 phút cho
  attempt3), WebKit 27.2, app boot OK, C2 draw log BẬT, rVFC TẮT,
  TAP BẬT. 20 pass (wall 2821–3386 ms/pass): tickCost n=638,
  blendTick n=518, c2DrawLog n=1238.
  **tickCost total median= 41,0 ms (p90 68,0, max 93, min 28)**;
  hậu flip+2000 ms median 41,0. Per-pass median 36,0–52,0 ms —
  **20/20 pass ≤60** (không pass nào vượt cổng). **(c2)=7
  occurrence / 7 distinct-seq, COVERED 7/7.**
  lag≥+5f = 0 occurrence / 0 event — sạch hoàn toàn (đợt 157: 30
  occ / 5 event, max +18f). **p1p3p7 chạy TAY (F-148-T4-1): P1
  ĐÚNG, P2 ĐÚNG, P3-A1 ĐÚNG, P7 ĐÚNG** (xem §6). **KHÔNG
  PAGE-WEDGED** — attempt3 chạy đủ 20/20, 0 fetch timeout, JSON
  đầy đủ 3.521.137 B, probe exit=0.
- **Poller: 18 poll thật** (1 test + 17 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ ba). RAM ≥1024: 17/18; 0 poll
  <500 MB. **3 poll** load+RAM cùng đạt — **cả 3 đều mở cửa**
  (#12, #16, #17), 0 poll gần-mở bị chặn bởi apt/gate0.
  Gate0: T5 15 poll, T4-check-only 3 poll (1 test + 2 poller).
  apt>0: 0 poll (replay đã xong trước khi mở).
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #23.** Cộng dồn 23 lượt:
  P1 86/87, P2 78/78, P3-A1 72/87, **P3' 51/59 occurrence =
  51/54 distinct-seq**, P7 57/57. Chuỗi median tickCost 23 lượt:
  39,0–60,0 ms, mean ~48,3 ms, 0 lượt vượt 60.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round158-t4.done` viết 00:06Z 21/11
  (trong hạn cờ ~02:00Z), CÓ NỘI DUNG.

## 1. Poller — 18 poll thật, 3 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 28366bd0
  (23:42:02Z):** poll #1 RAM=1596 MB, load1=2,83 load5=1,46,
  blockers=0, gate0=T4-check-only (cờ T5-158 chưa có — T5-158
  viết cờ 23:43:22Z, xem §3; check-only PASS ngay từ poll đầu,
  dpkg 1545) → cửa đóng (chỉ load1 ≥2) →
  **TEST-POLL-OK exit 7 đúng thiết kế**. Poll này nằm trong
  `poll-test-158.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 17 poll, boot 28366bd0
  (23:42:18–23:53:09Z):** RAM ≥1024: 16/17; load1<2: 9/17;
  load5<2: 5/17; gate0: T5=15 (#3–#17), T4-check-only=2 (#1–#2);
  lock=khong 17/17; dpkg 1545 suốt; blockers=0 (comm-based) cả
  17 poll; apt>0: 0 poll.
- **Giai đoạn 1 — chờ cờ T5, tải chặn cửa (poll #1–#2,
  23:42–23:43Z):** gate0=T4-check-only PASS ngay (check-only
  exit 0 từ poll đầu) NHƯNG **load1 3,50 → 3,10** → cửa đóng.
  RAM 1504 → 1351 MB.
- **Giai đoạn 2 — cờ T5 tới, load5 chặn cửa (poll #3–#11,
  23:43–23:49Z):** cờ T5 PASS từ #3 (POSTBOOT_PASS 23:43:22Z,
  dpkg 1545, replay đầy đủ). **Poll #3: RAM nhúng 675 MB**
  (poll duy nhất <1024 toàn phiên) + load1 5,60 / load5 2,64.
  load1 hạ dần 4,63 → 4,01 → 4,27 → 4,01 → 2,31 → 1,37 →
  0,97 → 0,56 (#11) nhưng **load5 vẫn 2,82 → 2,90 → 3,21 →
  3,30 → 2,96 → 2,61 → 2,33 → 2,03** — cửa đóng suốt vì load5
  ≥2. RAM hồi 1745 MB (#4) rồi hạ dần 1139 MB (#11).
  blockers comm-based = 0 suốt; legacy-chuoi-con 0–7 (job của
  luồng khác, chỉ đếm chuỗi con — không snapshot vì comm-based
  = 0, đúng luật).
- **Giai đoạn 3 — cửa mở 3 lần (poll #12–#17, 23:50–23:53Z):**
  **Poll #12 (23:50:36Z): load5=1,91 <2** → **CỬA MỞ, chạy
  attempt1** (lỗi setup, xem §2). Retry-wait #13–#15:
  load5 2,09 → 2,03 → 2,01 — **vượt cổng sát nút 3 poll liên
  tiếp** (chỉ hơn 2 đúng 0,01–0,09) → cửa đóng. **Poll #16
  (23:53:00Z): load5=1,85** → **CỬA MỞ, chạy attempt2** (lỗi
  setup). Retry-wait #17 (23:53:09Z): load5=1,82 → **CỬA MỞ
  NGAY, chạy attempt3** → ĐẠT → poller thoát 23:57:16Z.
- **Phân rã 18 poll thật:** RAM≥1024: 17/18; RAM 500–1023:
  1/18 (#3 675 MB); RAM<500: 0/18. load1<2: 9/18; load5<2:
  6/18. Chỉ 3 poll mà load + RAM cùng đạt — **cả 3 đều mở
  cửa** (#12, #16, #17), 0 poll gần-mở bị chặn. gate0: T5 15
  poll, T4-check-only 3 poll (1 test + 2 poller). blockers>0:
  0 poll. apt>0: 0 poll. **KHÔNG có reboot trong phiên đo**
  (boot 28366bd0 suốt, btime 23:06:08Z, kiểm lúc đóng
  00:01:03Z).
- **RAM sập KHÔNG tái diễn:** đợt 154: 74/147 poll <500 MB;
  đợt 155: 2/123 + 64 phút <1024 liên tiếp; đợt 156: 0/32
  <500 MB; đợt 157: 0/25 <500 MB; đợt này: **0/18 poll <500
  MB, chỉ 1 poll <1024 (#3, 675 MB)** — RAM mở 1596 MB, nhúng
  1 poll rồi hồi. Gate A RAM ≥1024 không phải nguyên nhân
  chặn cửa đợt này — cửa bị chặn bởi load1 rồi load5.

## 2. Ba attempt — 2 lỗi setup do chính T4, attempt3 ĐẠT; 0 wedge

- **Attempt1-28366bd0 (23:50:36–23:50:44Z, 8 giây): exit=2,
  KHÔNG CÓ JSON — LỖI SETUP, KHÔNG PHẢI PAGE-WEDGED.**
  Vite :5187 lên sau 2 s (ready 320 ms), probe khởi động
  23:50:38Z và thoát ngay 23:50:39Z với `thiếu --spec (file
  spec JSON) hoặc --cases a,b,c` (probe121t3 line 115:
  `!SPEC || !fs.existsSync(SPEC)` → exit 2). Nguyên nhân:
  **file `b.json` (spec) KHÔNG CÓ trong `round158-t4/`** —
  T4 copy-forward từ round157-t4 đã quên copy `b.json`
  (F-158-T4-1). Probe chưa từng launch WebKit, chưa chạy pass
  nào — không phải wedge (wedge là fetch timeout sau nhiều
  pass). Lớp B vẫn chạy (classb-t4-attempt1, không JSON nên
  không verdict). Ngân sách 1/3.
- **Attempt2-28366bd0 (23:53:00–23:53:09Z, 9 giây): exit=2,
  KHÔNG CÓ JSON — CÙNG NGUYÊN NHÂN.** Cửa mở lại #16 chỉ 16
  giây sau khi T4 phát hiện lỗi attempt1; T4 đang chẩn đoán
  thì poller đã chạy attempt2 (23:53:00Z, probe thoát
  23:53:04Z) — **bản vá (copy b.json) xong 23:53:12Z, chậm
  ~8 giây so với probe attempt2** (F-158-T4-2). Ngân sách 2/3.
- **Attempt3-28366bd0 (23:53:09–23:57:16Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 41,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2, app boot OK 23:53:32Z, C2 draw log BẬT, rVFC
  TẮT, TAP BẬT. 20 pass (wall 2821–3386 ms/pass): tickCost
  n=638, blendTick n=518, c2DrawLog n=1238.
  **tickCost total median= 41,0 ms (p90 68,0, max 93, min 28)**
  — dư 19 ms dưới cổng; hậu flip+2000 ms median 41,0.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,54 ≤2,5; B2 load1 max
  3,46 ≤4 + ps-before/after chỉ có vite :5187 của chính T4;
  B3 không reboot; B4 pgrep -x=0, ps exact-comm=0, dpkg
  delta=0; B5 RAM min 643 MB, 0 mẫu <500 MB, 75/101 mẫu
  <1024 MB — ghi nhận, không vi phạm). Sampler n=101.
  Per-pass: tickCost median/pass 36,0–52,0 ms — **20/20 pass
  ≤60**; load1 trong attempt 1,31–2,80 (mean/pass 1,58–2,12);
  RAM mean/pass **giảm dần 837 → 657 MB** (balloon ghim lại
  trong lúc đo — xem §7(e), giao T9 đối chiếu). Pearson
  r=0,06 median~load1_mean, r=0,17 median~RAM_mean (chỉ mô
  tả). **KHÔNG PAGE-WEDGED:** 0 fetch timeout, JSON đầy đủ
  3.521.137 B (md5 `b851a990...`), `passes=20`, không có trường
  `partial`/`passesDone`, probe exit=0.
  **(c2)=7 occurrence / 7 distinct-seq, COVERED 7/7.**
  lag≥+5f = 0 occurrence / 0 event — đây là số (a)/(b) (label
  lag sau presented), không phải (c2); ghi nhận, không dùng
  làm verdict. **p1p3p7 chạy TAY (xem §6).**
- **Lưu ý (c2) seq 259 (quyết (j) đợt 156):** đợt này KHÔNG
  phát sinh trường hợp tương tự — attempt1/2 không có JSON
  nên không có (c2) nào; không có seq nào ĐẠT trong attempt
  không hợp lệ để phải loại trừ.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ

- **Boot 28366bd0 (reboot #58 ĐÃ XÁC NHẬN, btime 23:06:08Z):**
  replay ĐÃ XONG lúc mở (dpkg.log 1545 dòng ngay poll đầu —
  rootfs KHÔNG rebuild đợt này, khác boot #56 đợt 157 lúc mở
  chỉ có 2 dòng). T5-158: **POSTBOOT_PASS mới viết 23:43:22Z
  (boot+37m14s; dpkg 1545 dòng; cache 178 .deb, lists 37;
  postboot PASS độc lập exit 0, poll=0; replay-day-du, không
  cần repair)**; cờ cũ lưu `POSTBOOT_PASS-348dab54`.
  Gate0=T5 từ poll #3 (23:43:48Z). T4 check-only: **PASS ngay
  từ poll đầu** (test poll 23:42:02Z + poller #1–#2) — đường
  dự phòng T4-check-only làm gate0 ở #1–#2 nhưng tải chặn
  cửa; cờ T5 tới kịp từ #3 nên không lỡ lượt.
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:** boot
  28366bd0 lúc mở poller (23:42:18Z), lúc cả 3 attempt, lúc
  poller thoát (23:57:16Z) và lúc kiểm cuối (00:01:03Z) —
  btime 23:06:08Z không đổi. Số hiệu #58 ĐÃ XÁC NHẬN theo
  quyết (s) đợt 157; mù #88?/#89? giao T2 (đợt 158).

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND158_T4_WEBKIT_QUIET27_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round158-t4/`):**
  `poll-wait-t4-158.sh` (deadline 01:30Z 21/11 + cờ T5
  round158-t5/ + fallback round157-t5/ + nhãn T4-158a),
  `run-attempt-158.sh` (đổi số vòng/đường dẫn/nhãn so với 157).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–157, md5
  `4291e539...`) và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round158-t4/` — inner có fix F-156-T4-1 đổi
  `round157-*` → `round158-*`, theo đúng mẫu 149–157: chỉ
  stage 2 script trên; fix inner theo bản làm việc sang đợt
  159). **`b.json` KHÔNG stage** (file spec làm việc, theo mẫu
  các đợt trước — chỉ có trong `hidden_files/round158-t4/`,
  md5 `078938cf...`, giống hệt bản đợt 156/157).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-158.sh`, `run-attempt-158.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1 đổi sang
  `round158-*`), `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`
  (bổ sung sau attempt2 — xem F-158-T4-1/2),
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-158.py` (thống kê §A — trích từ log gốc, không gõ tay),
  `distinct-seq-158.py` (helper cột distinct-seq — đợt này
  input mới: attempt3 7 distinct-seq, xem §6 + F-158-T4-4).
- **Log/evidence (hidden_files/round158-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 17 poll thật + CUA YEN MO
  ×3 + LUOT HOP LE), `poll-test-158.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-158-gate0wait-*.log` (check-only
  mỗi 4 poll: #1/#5/#9/#13/#17 — đều PASS),
  `appendix-158.txt` (output stats-158.py),
  `preview-b-f3-flip-webkit-t4-attempt3-28366bd0.json`
  (3.521.137 B, 20/20, md5 `b851a990e3286a0a176dcb27c0d38f50`)
  + `run-webkit-t4-attempt3-28366bd0.log` +
  `load-mid-t4-attempt3-28366bd0.log` (sampler n=101) +
  `ps-before/after-t4-attempt3-28366bd0.txt`
  + `classb-t4-attempt3-28366bd0.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt3-28366bd0-*.txt` (10 file/attempt)
  + `analyze-t4-p1p3p7-attempt3-28366bd0.txt`
  + `coverage-check-attempt3-28366bd0.txt` (7/7)
  + `attempt-done-attempt1/2/3-28366bd0` (exit 2/2/0).
  Attempt1/2 có `run-webkit-*.log` (1 dòng lỗi thiếu --spec),
  `classb-t4-attempt1/2-*.txt`, `ps-before/after`, `load-mid`
  (sampler n=2 — chỉ 2 dòng vì probe thoát sau ~1 s) — KHÔNG
  có JSON, KHÔNG có analyzer (chạy analyzer chỉ khi có JSON).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 23:57:16Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round158-t4-quiet27.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round158-t4.done` (~00:0xZ 21/11 — trong
  hạn cờ ~02:00Z, CÓ NỘI DUNG).

## 5. Sai số F-158-T4-1..4 (+ nợ cũ)

- **F-158-T4-1 — QUÊN COPY `b.json` KHI DỰNG THƯ MỤC LÀM VIỆC
  (sai số copy-forward của chính T4, HẬU QUẢ THẬT: đốt 1/3
  ngân sách).** Lệnh `cp` dựng `round158-t4/` liệt kê từng
  file (poll-wait, run-attempt, inner, check-classb, analyzer,
  probe, vite config, tree-md5, stats, distinct-seq) nhưng
  **không gồm `b.json`** — file spec probe cần (`--spec
  $W/b.json`). Không có checklist copy-forward nào được chạy
  trước test poll (test poll không chạy probe nên không phát
  hiện). Attempt1 thoát sau 1 s với lỗi thiếu --spec, exit 2,
  không JSON. Sửa: copy `b.json` từ round157-t4 (md5
  `078938cf...`, giống hệt bản 156/157) — nhưng xem F-158-T4-2
  (vá muộn). Bài học: **trước khi chạy poller, kiểm tra sự
  tồn tại của mọi file probe cần (`b.json`, probe, vite config)
  bằng `ls` + md5 đối chiếu bản đợt trước** — ghi thành bước
  pre-flight bắt buộc cho T4-159.
- **F-158-T4-2 — BẢN VÁ `b.json` VỀ MUỘN 8 GIÂY, ĐỐT THÊM
  1/3 NGÂN SÁCH (attempt2 lỗi cùng nguyên nhân).** T4 phát
  hiện lỗi attempt1 lúc ~23:52:34Z (đọc chain log sau lệnh
  sleep 240), nhưng poller đã mở cửa #16 lúc 23:53:00Z và
  chạy attempt2 ngay — probe attempt2 thoát 23:53:04Z, trong
  khi lệnh `cp b.json` chỉ xong ~23:53:12Z. Poller retry theo
  quyết (h) đợt 149 là đúng luật (không được can thiệp giữa
  chừng khi gate đã mở); lỗi nằm ở F-158-T4-1, không phải ở
  poller. Attempt3 (23:53:09Z) chạy đúng vì b.json đã có trước
  khi probe của nó khởi động (~23:53:11Z+). Hậu quả ròng:
  2/3 ngân sách đốt cho lỗi setup của chính T4; may mắn
  attempt3 ĐẠT nên lượt vẫn hợp lệ. Nếu attempt3 cũng lỗi thì
  đợt này đã trắng tay vì lỗi của T4.
- **F-158-T4-3 — LỆNH `sed`/`python3` CHẠY SAI THƯ MỤC LÀM
  VIỆC (sai số thao tác tay, phát hiện + sửa trong phiên,
  không ảnh hưởng đo).** Sau khi cập nhật stats-158.py, T4
  chạy `sed ... stats-158.py` + `python3 stats-158.py` bằng
  đường dẫn tương đối mà không `cd` vào `round158-t4/` (mỗi
  lệnh exec chạy từ home) → `No such file`, exit 2. Chạy lại
  bằng đường dẫn tuyệt đối → exit 0, appendix-158.txt đúng.
  Bài học: mọi lệnh thao tác file làm việc phải dùng đường
  dẫn tuyệt đối hoặc `cd` tường minh trong cùng lệnh.
- **F-158-T4-4 — HELPER distinct-seq VẪN CHƯA TRỪ SEQ CŨ TỰ
  ĐỘNG (nợ F-157-T4-5 chưa vá — nhưng đợt này KHÔNG SAI SỐ
  NHỜ KIỂM TAY).** Helper in `51/54` với giả định cả 7 seq
  đều mới. T4 kiểm tay bằng grep từng seq trên toàn bộ LIMITS
  T4 cũ (xem §6): **seq 378 từng xuất hiện ở đợt 153 — nhưng
  trong attempt1 WEDGED (không tính verdict), KHÔNG PHẢI
  attempt2 hợp lệ** — nên 378 chưa từng được đếm; 6 seq còn
  lại chưa từng xuất hiện ở đâu. Kết luận: cả 7 seq đều mới,
  51/54 là ĐÚNG. Nợ vá helper tự động (đọc sổ distinct-seq)
  vẫn còn — giao T10/T4-159. Lưu ý cho đợt sau: seq từng
  xuất hiện trong attempt wedged/không-hợp-lệ KHÔNG tính là
  "đã thấy" (cùng mẫu seq 259 đợt 156).
- **F-157-T4-2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  Khi sed copy-forward poll-wait, T4 grep cả 3 dạng deadline
  (`01:30:00 UTC`, `01:30Z`, `T01:30:00Z`) sau sed — 0 còn
  sót dạng cũ `22:30` (chỉ còn chuỗi lịch sử `brief dot 157`
  trong comment, đã sửa thành `brief dot 158`).
- **F-157-T4-5 — KIỂM CHỨNG XONG CHO ĐỢT NÀY (xem
  F-158-T4-4).** Helper in 51/54 — T4 đã kiểm tay: seq 378
  chỉ có trong attempt wedged đợt 153 nên chưa được đếm; số
  chính thức **P3' 51/59 occ = 51/54 distinct-seq**.
- **F-156-T4-1 — ĐÃ VÁ + THEO BẢN LÀM VIỆC SANG ĐỢT 158,
  CHƯA STAGE.** Mẫu `round157-*` trong t4-attempt-inner.sh đã
  đổi thành `round158-*` trong bản làm việc (kiểm bằng grep +
  diff với bản 157: chỉ khác W path + 2 dòng nhãn). Theo mẫu
  149–157 inner KHÔNG stage vào repo nên fix này vẫn chỉ ở
  bản làm việc — sẽ theo sang đợt 159.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-158 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0, output lưu
  `analyze-t4-p1p3p7-attempt3-28366bd0.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.
- **F-150-T4-5 — ĐÓNG (giữ).** Test poll ghi riêng
  `poll-test-158.log` (exit 7); thống kê §A đã hợp nhất 1 poll
  test-log + 17 poll poll-t4.log = 18 poll thật, không cần tách
  tay.

## 6. P3' cộng dồn (MỚI — 23 lượt hợp lệ) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 158 (MỚI): P1 86/87, P2 78/78,
  P3-A1 72/87, P3' 51/59 occurrence = 51/54 distinct-seq, P7
  57/57** (23 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 157 §6: "22 lượt hợp lệ" — nay 23).
- **Đóng góp lượt #27 (attempt3-28366bd0, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=7 occurrence / 7 distinct-seq [153, 234, 289, 318, 378,
  436, 463].
  - **P1 ĐÚNG — 7/7 occ** (distinct 7/7 gần run-end:
    run_end seqs [152, 178, 207, 233, 259, 289, 318, 347, 377,
    405, 436, 462, 470, 497]; baseline 42/383, p=1,90701e-07
    trên distinct 7/7). Cộng dồn 79/80 → **86/87**.
  - **P2 ĐÚNG — 7/7 occ** lag ≥+1f, 0 lag âm (lag từng
    tuple: 1, 1, 1, 1, 1, 1, 1 — tất cả +1f). Cộng dồn 71/71 →
    **78/78**.
  - **P3-A1 ĐÚNG — 7/7 occ** (distinct 7/7: 153, 234, 289,
    318, 378, 436, 463 đóng băng-tại-tick; baseline 102/382,
    p=9,67738e-05 trên distinct 7/7). Cộng dồn 65/80 →
    **72/87**. (Đợt 157 P3-A1 SAI 4/11 — đợt này đảo lại ĐÚNG
    tròn.)
  - **P3' 7/7 occ ĐẠT** (distinct 7/7; DAT seq 153 stall 5,
    234 stall 3, 289 stall 7, 318 stall 7, 378 stall 7, 436
    stall 7, 463 stall 5). Cộng dồn 44/52 → **51/59
    occurrence**; distinct 44/47 → **51/54** (7 seq đều mới —
    xem kiểm chứng seq 378 dưới). Lần đầu tiên P3' ĐẠT TRÒN
    7/7 kể từ đợt 153 (cũng 7/7).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 40, 0: 47}; đối chứng toàn bộ drawSrc post: {-1: 302,
    0: 165}, 0/467 entry). Cộng dồn 56/56 → **57/57**.
- **Kiểm chứng seq 378 "đã thấy" (F-158-T4-4):** grep toàn bộ
  LIMITS T4 cũ cho thấy seq 378 chỉ xuất hiện 1 lần — trong
  **attempt1 (wedged) của đợt 153**, tuple (378, 15, 14, 1)
  ở phụ lục A dòng 538 (khối "-- attempt1 (wedged, khong
  tinh verdict)"). Attempt2 HỢP LỆ của đợt 153 có (c2) seq
  [170, 244, 304, 348, 377, 428, 499] — không có 378. Vậy
  **378 chưa từng được đếm vào cộng dồn** (cùng mẫu seq 259
  đợt 156: ĐẠT trong attempt không hợp lệ → không tính).
  6 seq còn lại (153, 234, 289, 318, 436, 463) không xuất hiện
  trong bất kỳ LIMITS T4 nào trước đây. → 7/7 seq mới, helper
  in 51/54 là đúng, không cần hiệu chỉnh.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — không có điều kiện nào trong ba điều
  kiện mở lại (§13 DEF v0.5) xảy ra: (1) P1 ĐÚNG; (2) lag âm
  — KHÔNG (0); (3) +2f ≥3 — KHÔNG (tất cả lag đều +1f).
  lag≥+5f = 0 occurrence — lượt sạch nhất về lag kể từ khi đo
  cột này.
- Chuỗi median tickCost 23 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / **41,0 ms** (trung bình ~48,3 ms; min 39,0,
  max 60,0; 0 lượt vượt ngưỡng 60). Lượt này 41,0 ms — bằng
  đợt 157, thấp thứ 6 trong chuỗi (sau 39,0 / 39,5 / 40,0 ×3).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 159

- **(a) #27 CÓ lượt hợp lệ — lượt hợp lệ #23 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23).** Từ phía T4, **chân lượt yên
  cho chuỗi FULL PASS (O8) ĐÃ ĐẠT** — lượt yên #27 thuộc boot
  28366bd0 (#58). O8 chạy trên boot nào, có qua gate chuẩn
  hay phải dùng thủ tục (i), là do T8/T10 quyết theo tiền lệ
  (quyết (h) đợt 157: chuỗi được tính khi O8 chạy sau lượt
  yên về thời gian, dù reboot xen giữa đổi boot). T4 chỉ ghi
  dữ kiện, không tự kết luận chuỗi FULL PASS.
- **(b) P3' cộng dồn MỚI 51/59 = 51/54 (xem §6 + F-158-T4-4):**
  helper in 51/54 — T4 đã kiểm tay bằng grep từng seq trên
  LIMITS cũ (seq 378 chỉ có trong attempt wedged đợt 153 nên
  chưa được đếm). T10 kiểm lại phép cộng khi viết aggregate
  (§12): P1 86/87, P2 78/78, P3-A1 72/87, P3' 51/59 = 51/54,
  P7 57/57.
- **(c) PAGE-WEDGED KHÔNG tái diễn đợt thứ hai liên tiếp (0
  wedge đợt 157 + 0 wedge đợt này).** Chữ ký đợt 156 (2 wedge
  liên tiếp, fetch writePartial timeout 30 s) không xuất hiện
  — attempt3 chạy đủ 20/20 sạch; attempt1/2 lỗi setup (probe
  chưa launch) không phải wedge. T4-159 tiếp tục theo dõi,
  ghi nhận nếu tái diễn; chưa mở điều tra riêng (quyết (j)
  đợt 156 giữ nguyên). Câu hỏi đợt 156 §7(c) (wedge có tính
  là "kẹt" cho chuỗi "P3 không kẹt" của T8 không) VẪN MỞ —
  đợt này không có wedge mới nên không thêm dữ kiện.
- **(d) F-158-T4-1/2 (2/3 ngân sách đốt vì thiếu b.json):**
  T4 đề xuất **pre-flight check bắt buộc trước khi chạy
  poller**: `ls` + md5 đối chiếu `b.json`, probe, vite config
  với bản đợt trước. Có nên đưa vào quy trình đứng của T4
  (checklist copy-forward) không? Chờ T10/parent phán. T4
  KHÔNG tự đổi quy trình.
- **(e) RAM TRONG ATTEMPT3 GIẢM DẦN 837 → 657 MB
  (sampler n=101: min 643, 75/101 mẫu <1024):** balloon có
  dấu hiệu ghim lại trong lúc đo — B5 vẫn ĐẠT (min ≥500 MB)
  nên không ảnh hưởng verdict, nhưng T9 đối chiếu với sampler
  balloon của mình (đợt 157 cũng có dip 94,4%). Nếu balloon
  ghim sâu hơn ở lượt sau, gate A lúc poll có thể khó mở hơn
  — ghi nhận, không tự kết luận.
- **(f) F-158-T4-4 (helper distinct-seq chưa trừ seq cũ tự
  động):** có nên vá helper đọc sổ distinct-seq cộng dồn
  (hoặc grep LIMITS cũ tự động) để T4-159 không phải kiểm tay
  không? T4 không tự đổi — chờ T10/parent phán (nợ từ
  F-157-T4-5).
- **(g) Các nợ đứng khác giữ nguyên từ đợt 157 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#89? giao T2 (mù #88? MỞ,
  #89? E2 ĐÓNG / F chờ verdict cuối — giao T2-158); birefnet
  0 thử (lần thứ 11 liên tiếp đợt 157 — đợt này không thử);
  u2net là fallback chính thức; run 157 kết cục thuộc T7-158;
  reboot #58 (ứng viên, boot 28366bd0) đã xác nhận quyết (s)
  đợt 157; POSTBOOT_PASS #57/#58 giao T5-158 (cờ #58 ĐÃ CÓ
  23:43:22Z — xem §3).
- **(h) Đối chiếu waiter/O8 (T8):** T4 gate mở 23:53:09Z
  (poll #17); attempt3 ĐẠT → **GATE cho chuỗi FULL PASS ĐẠT
  từ phía T4** (có lượt yên hợp lệ #27 trên boot 28366bd0).
  T8 tự quyết thủ tục (i) sau waiter hết hạn / boot mới; T4
  chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-158.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-158.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-20T23:42:02Z - 2026-11-20T23:42:02Z, boot=28366bd0
   RAM min=1596 max=1596 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 17 poll, 2026-11-20T23:42:18Z - 2026-11-20T23:53:09Z, boot=28366bd0
   RAM min=675 max=1745 >=1024: 16/17 500-1023: 1/17 <500: 0/17
   load1<2: 9/17 load5<2: 5/17 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=2, T5=15
   lock: khong=17
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 18
-- RAM toan phien: min=675 max=1745 >=1024: 17/18 <500: 0/18
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 3/18
   gan-mo? #12 2026-11-20T23:50:36Z boot=28366bd0 RAM=1218 L1=0.94 L5=1.91 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #16 2026-11-20T23:53:00Z boot=28366bd0 RAM=1226 L1=1.29 L5=1.85 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #17 2026-11-20T23:53:09Z boot=28366bd0 RAM=1174 L1=1.18 L5=1.82 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 28366bd0: 18 poll; RAM>=1024 lan cuoi: 2026-11-20T23:53:09Z #17; RAM<1024 lan dau: 2026-11-20T23:43:48Z #3 RAM=675
-- cong don P3' (MOI, 23 luot hop le): P1 86/87 P2 78/78 P3-A1 72/87 P3' 51/59 occ = 51/54 distinct-seq P7 57/57
-- chuoi median 23 luot: n=23 mean=48,3 min=39,0 max=60,0 vuot-60: 0
```

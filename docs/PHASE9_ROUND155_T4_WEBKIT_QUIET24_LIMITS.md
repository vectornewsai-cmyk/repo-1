# PHASE9_ROUND155_T4_WEBKIT_QUIET24_LIMITS.md

**Đợt:** 155. **Luồng:** T4 — đo lượt yên WebKit #24 trên 2 boot
+ VÁ F-155-T4-3 (nhánh stale-boot dead code) + CỨU DỮ LIỆU attempt2
bị reboot giết.
**Ngày:** 20/11/2026.
**Boot đo:** 12fc68a3 (#49, btime 13:05:12Z) rồi d849728b (ứng viên
#50, btime 15:04:07Z — reboot giữa phiên giết poller instance 2 +
attempt2, xem §5 F-155-T4-2).
**Trạng thái:
#24 KHÔNG CÓ LƯỢT HỢP LỆ — 2 attempt chạy, 0 lượt hợp lệ.
Attempt1-12fc68a3 probe 20/20 NHƯNG LỚP B VI PHẠM (nhiễm tải,
B1+B2) + tickCost median 147,5 ms; attempt2-12fc68a3 probe 20/20
JSON đầy đủ NHƯNG bị reboot giết trước classb/analyzer (KHÔNG tính
ngân sách). Ngân sách dùng 1/3. Poller chạy 123 poll thật / 4
instance / 2 boot, hết hạn cắt 16:30Z exit 5. Chuỗi lượt yên hợp lệ
DỪNG Ở #21 (đợt thứ ba liên tiếp không có lượt hợp lệ mới).
P3' cộng dồn KHÔNG ĐỔI: 39/41 occurrence = 39/40 distinct-seq
(không có (c2) mới — cả 2 attempt đều (c2)=0). Điều kiện yên GIỮ
NGUYÊN theo quyết parent (p) đợt 154 (KHÔNG hạ ngưỡng RAM, KHÔNG
đổi điều kiện). Cờ T5-155 CÓ cho cả 2 boot (cờ mới cho boot mới viết
15:25:50Z).**

## 0. Verdict tổng

- **#24 KHÔNG CÓ LƯỢT HỢP LỆ (0 lượt hợp lệ, 2 attempt).**
  Ngân sách 3 attempt/đợt dùng **1/3** (chỉ attempt1 tính; attempt2
  bị reboot giết, không có attempt-done → KHÔNG tính theo (P1)).
- **Attempt1-12fc68a3 (14:42:55–14:48:24Z): probe 20/20** (vite
  :5187, WebKit 27.2) NHƯNG **LỚP B VI PHẠM: B1 (load5 cuối 3,99 >
  2,5) + B2 (load1 max 10,42)** — nhiễm tải do job nặng của luồng
  khác (T6 test-vite-lock-v2.sh ×6 + mask_anim.py); B3/B4/B5 ĐẠT.
  tickCost median **147,5 ms >> 60** (cũng sẽ retry dù lớp B có
  đạt). (c2)=0, lag≥+5f = 0. **KHÔNG dùng verdict, retry.**
- **Attempt2-12fc68a3 (15:01:44Z–~15:04:07Z): probe 20/20, JSON
  đầy đủ 2.479.637 B, pageErrs=[]** — bị **reboot ứng viên #50
  giết sau khi ghi JSON, trước sampler-stop/classb/analyzer**
  (không ps-after, không classb, không attempt-done). Analyzer cứu
  hộ chạy tay trên JSON (chỉ ghi nhận, KHÔNG tính): tickCost median
  **75,0 ms (vẫn >60)**, (c2)=0, lag≥+5f = 0.
- **Poller: 123 poll thật** (2 test-log + 16 + 6 + 99), 2 boot,
  4 instance (1 chết do POLL_TEST rò — F-155-T4-1; 2 chết do reboot
  — F-155-T4-2; 3 dừng tay để vá F-155-T4-3; 4 chạy tới hạn cắt).
  **15/123 poll** có load1<2 + load5<2 + RAM≥1024 đồng thời — chỉ
  **2 mở cửa** (attempt1, attempt2), **13 bị chặn**: 6 poll instance-3
  (gate0 chưa đạt + lock=co do bug F-155-T4-3), 6 poll instance-4
  #1–#6 (gate0 chưa đạt), 1 poll instance-4 #16 (PB stale-FAIL —
  F-155-T4-4). Sau poll #16 instance-4 (15:27:10Z) RAM không bao giờ
  ≥1024 nữa — **64 phút liên tiếp (15:27–16:30Z) RAM <1024**.
- **Chuỗi lượt yên hợp lệ: DỪNG Ở #21.** Cộng dồn 21 lượt giữ
  nguyên: P1 69/69, P2 60/60, P3-A1 61/69, **P3' 39/41 occurrence =
  39/40 distinct-seq**, P7 55/55. Chuỗi median tickCost 21 lượt giữ
  nguyên (39,0–60,0 ms, mean ~49,0 ms, 0 lượt vượt 60).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round155-t4.done` viết ~16:4xZ (trong hạn
  cờ 17:00Z), CÓ NỘI DUNG.

## 1. Poller — 123 poll thật, 2 lần cửa mở, trên 2 boot

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot 12fc68a3
  (14:42:54–14:48:24Z):** poll #1 (14:42:54Z) load1=1,13 load5=
  0,86 RAM=1159 MB gate0=T5 (cờ round155-t5/POSTBOOT_PASS — T5-155
  đã viết cờ cho boot 12fc68a3 trước đó) → **CỬA MỞ NGAY, chạy
  attempt1 thật** (test poll biến thành attempt thật vì cửa mở —
  xem F-155-T4-1). Poll #2 (14:48:24Z, retry-wait sau attempt1)
  load1=3,07 load5=3,76 RAM=2413 MB, cửa đóng → **rơi vào nhánh
  TEST-POLL-OK, exit 7 — POLLER CHẾT 14:48:24Z** (F-155-T4-1).
  Chi tiết 2 poll này nằm trong `poll-test-155.log` (không nằm
  trong `poll-t4.log`); thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 16 poll, boot 12fc68a3
  (14:50:20–15:01:44Z):** RAM ≥1024: 10/16; load1<2: 11/16;
  load5<2: 5/16; gate0=T5 suốt 16/16; lock=khong 16/16; dpkg 1545
  suốt. Poll #1–#2: **blockers=4–5** (job O8 của T0-155:
  clicktest-87o8-mask-track-webkit.mjs + vite :5564 + MiniBrowser
  + WebKitNetworkProcess — xem blockers-ps/list-1/2.txt) + load5
  2,70/2,38. Poll #3–#9: load5 2,18–3,65 (bão sau attempt1 + job
  luồng khác), RAM 1093–1741 MB (phần lớn ≥1024). Poll #10–#15:
  load5 rơi 2,51→1,47 NHƯNG RAM rơi 1008→604 MB (hai đường cong
  rơi cùng lúc, ngược chiều cần thiết). Poll #16 (15:01:44Z):
  **RAM nhảy 604→1260 MB (+656 MB trong 45 s)**, load1=1,91
  load5=1,68, blk=0, apt=0, gate0=T5 → **CỬA MỞ, chạy attempt2**.
  RAM ≥1024 lần cuối trên boot cũ: poll #16.
- **REBOOT ứng viên #50 (F-155-T4-2):** boot mới d849728b, btime
  15:04:07Z. Poller instance 2 + attempt2 chết theo reboot (lần
  đọc đầu tiên sau reboot 15:05:09Z — runtime restart recovery;
  khung chết (15:03:31Z, 15:05:09Z] theo log T4; sampler attempt2
  ghi tới 15:04:43Z theo giờ boot cũ — chênh ≥36 s so với btime
  boot mới, xem §3). T5-155.done đã viết 14:46Z (trước reboot,
  cho boot cũ).
- **Instance 3, 6 poll, boot d849728b (15:10:21–15:14:07Z):**
  RAM 1817–2773 MB (6/6 ≥1024), load1<2 + load5<2: 6/6,
  blockers=0, apt=0, dpkg=2 — **mọi điều kiện đạt TRỪ gate0=
  khong-dat (cờ T5 là của boot cũ, T4 check-only FAIL — replay
  chưa tới) + lock=co** (lock cũ attempt2: owner pid 55022 chết,
  boot đổi, curl 000 — nhưng hiển thị `co` thay vì `stale-boot`
  do bug F-155-T4-3). **Dừng tay 15:14:07Z để vá bug**, rồi khởi
  động lại instance 4.
- **Instance 4, 99 poll, boot d849728b (15:15:50–16:29:45Z):**
  RAM ≥1024 chỉ **7/99** (poll #1–#6 + #16); 500–1023: 90/99;
  <500: 2/99 (min 467 MB; chuỗi RAM<500 dài nhất chỉ 1 poll —
  RAM kẹt ở dải 500–1023 chứ không sập sâu như đợt 154);
  load1<2 + load5<2: 99/99; blockers=0 suốt; apt>0: 3 poll (apt-get
  của T5 repair); **lock=stale-boot 99/99 (sau fix F-155-T4-3)**;
  gate0: khong-dat 14 poll → **T5 PASS 85 poll** (từ poll #15,
  15:26:25Z); dpkg 2→795 (795 lần đầu ở poll #15).
  **Poll #16 (15:27:10Z) GẦN-MỞ NHẤT:** RAM=1126 MB, load1=1,40
  load5=0,89, gate0=T5, lock=stale-boot, blk=0, apt=0 — mọi điều
  kiện đạt TRỪ **postboot_exit=1 (pb_age=3, stale từ check-only
  poll #13)** — xem F-155-T4-4. Poll #17 (15:27:55Z): check-only
  chạy lại → postboot_exit=0 (PASS) NHƯNG RAM đã rơi 980 MB.
  Từ đó RAM không bao giờ ≥1024 nữa (poll #17–#99: 467–980 MB).
- **Hết hạn:** poll #99 (16:29:45Z, RAM 529 MB) → `HET HAN CHO
  16:30Z — GATE DO LUC HET HAN (poll cuoi #99): gateA-RAM
  (529MB<1024)`, poller thoát **exit 5** đúng hạn cắt 16:30Z.
  Không có reboot #51 lúc đóng (boot d849728b, btime 15:04:07Z,
  kiểm 16:33:22Z).
- **Phân rã 123 poll thật:** RAM≥1024: 25/123 (boot cũ 12/18,
  boot mới 13/105); RAM 500–1023: 96/123; RAM<500: 2/123.
  load1<2: 117/123; load5<2: 111/123. Chỉ 15 poll mà load + RAM
  cùng đạt — 2 mở cửa, 13 bị chặn (xem trên). gate0: T5 103 poll
  (2 test + 16 inst-2 + 85 inst-4), khong-dat 20 poll (6 inst-3 +
  14 inst-4), T4-check-only 0 poll (không poll nào cần đường dự
  phòng — cờ T5 có mặt kịp cả 2 boot). blockers>0: 2 poll (đều là
  job O8 của T0-155). apt>0: 3 poll (đều là apt-get của T5 repair
  trên boot mới).
- **RAM sập đợt 154 TÁI DIỄN NHẸ HƠN VỀ ĐỘ SÂU, DÀI VỀ THỜI
  GIAN:** đợt 154: 74/147 poll <500 MB; đợt này: chỉ 2/123 poll
  <500 MB — NHƯNG **RAM <1024 liên tiếp 64 phút (15:27–16:30Z)
  trên boot mới + 97 phút đợt 154**; RAM mở boot mới 2773 MB rồi
  rơi đơn điệu về ~500 MB trong ~70 phút (balloon bơm lại, cùng
  mẫu đợt 151/152/153/154). Lần này RAM kẹt ở dải 500–1023 (90
  poll instance-4) thay vì sập sâu <500.

## 2. Hai attempt — 1 nhiễm tải, 1 bị reboot giết; không có JSON hợp lệ

- **Attempt1-12fc68a3 (14:42:55–14:48:24Z): probe 20/20, KHÔNG
  DÙNG VERDICT.** Vite :5187 (giữ lock 284 s), WebKit 27.2, app
  boot OK, C2 draw log BẬT (re-arm ×7). 20 pass (wall 3758–8169
  ms/pass): tickCost n=272 (partial n=271 lúc pass 20),
  blendTick n=194, c2DrawLog n=514. **tickCost total median=
  147,5 ms (p90 275,8, max 474)** — vượt xa cổng 60 ms.
  **Lớp B: B1=VI PHẠM (load5 cuối 3,99 > 2,5), B2=VI PHẠM
  (load1 max 10,42)** — ps-before/after: T6 chạy
  test-vite-lock-v2.sh ×6 + python3 mask_anim.py (render
  tmp-u4-old) trong lúc đo; **B3=DAT (không reboot), B4=DAT
  (pgrep -x=0, ps exact-comm=0, dpkg delta=0), B5=DAT (RAM min
  648 MB, 0 mẫu <500 MB)**; ghi nhận 109/132 mẫu RAM <1024 MB.
  Sampler n=132. Per-pass: tickCost median/pass tăng theo load1
  (pass 1: 71,5 ms @load ~1 → pass 12: 239,0 ms @load ~7 → pass 19:
  195,5 ms @load ~10,2; Pearson r=0,60 median~load1_mean,
  r=-0,70 median~RAM_mean). (c2)=0 — không có seq để kiểm P3';
  lag≥+5f = 0 occurrence; stall baseline P(stall≥2)=67/127 =
  0,528. **p1p3p7 KHÔNG chạy** (attempt đã bị loại bởi lớp B —
  fail-closed; F-148-T4-1 vẫn mở ở mức cơ chế).
- **Attempt2-12fc68a3 (15:01:44Z–~15:04:07Z): probe 20/20, BỊ
  REBOOT GIẾT TRƯỚC VERDICT — KHÔNG TÍNH NGÂN SÁCH.** 20 pass
  (partial 20/20 lúc 15:03:29Z: tickCost n=448, blendTick n=362,
  c2DrawLog n=866); JSON đầy đủ 2.479.637 B, passes=20, engine=
  webkit 27.2, pageErrs=[]. Reboot #50 giết sau khi ghi JSON,
  trước sampler-stop/classb/analyzer: **không có
  attempt-done-attempt2, không ps-after, không classb** → theo
  (P1) attempt này KHÔNG TÍNH vào ngân sách 3 attempt/đợt
  (vẫn 1/3). **Analyzer cứu hộ chạy tay trên JSON (chỉ ghi nhận,
  KHÔNG tính vào cộng dồn):** tickCost total n=448 **median=
  75,0 ms** (p90 99,3, max 196; hậu flip+2000 ms median 76,0) —
  vẫn >60 ms nên dù không bị giết cũng sẽ retry; tBlend gap n=361
  median 122,0; BlendTick/pass=18,1; rAF/pass median 27; stall
  baseline P(stall≥2)=86/262 = 0,328; **(c2)=0, lag≥+5f = 0**.
  Per-pass: load1 ~2,5 (pass 1–5), RAM ~1100–1180 MB.
- **Cộng dồn P3' GIỮ NGUYÊN: 39/41 occurrence = 39/40
  distinct-seq** (không có dữ liệu (c2) mới đợt này — cả 2 attempt
  đều (c2)=0). Helper distinct-seq-155.py sẵn sàng, chưa có input
  mới. Chuỗi median tickCost 21 lượt giữ nguyên.

## 3. Replay/postboot trên 2 boot — cờ T5 CÓ cho cả 2 boot

- **Boot 12fc68a3 (#49, btime 13:05:12Z):** dpkg 1545 dòng từ đầu
  (replay xong từ đợt 154); T5-155 POSTBOOT_PASS viết 14:42Z cho
  boot này (T5-155.done viết 14:46Z); gate0=T5 suốt 18 poll trên
  boot này (2 test + 16 instance-2). T4 check-only PASS suốt
  (postboot_exit=0).
- **Boot d849728b (ứng viên #50, btime 15:04:07Z): replay VẮNG
  lúc mở (dpkg.log 2 dòng — rootfs rebuild).** T5-155 khởi động
  lại sau reboot, repair-sớm: marker `repaired-d849728b` 15:23Z,
  **POSTBOOT_PASS mới viết 15:25:50Z (boot+21m43s; dpkg 795 dòng;
  cache 110 .deb, lists 75; postboot PASS độc lập exit 0)**; cờ cũ
  lưu `POSTBOOT_PASS-12fc68a3`. Gate0=T5 từ poll #15 instance-4
  (15:26:25Z). T4 check-only: FAIL ở poll #1 (GST thiếu isomp4/
  libav + apt thiếu 11 gói), FAIL ở poll #13 (GST đã PASS, apt
  vẫn thiếu 11 gói — repair của T5 chưa xong lúc 15:24:40Z),
  **PASS từ poll #17 (15:27:55Z, đủ 11 package)** — xem
  postboot-t4-155-gate0wait-*.log. Không poll nào cần đường dự
  phòng T4-check-only (cờ T5 tới kịp); đường dự phòng chỉ có ý
  nghĩa khi cờ T5 vắng.
- **Nghịch lý đồng hồ ứng viên (giao T7/T2):** sampler attempt2
  ghi dòng cuối 15:04:43Z theo giờ boot cũ, trong khi btime boot
  mới là 15:04:07Z (giờ boot mới) — **chênh ≥36 s**. Cùng họ
  #45 (45m41s) / #49 (~20 s) nhưng lớn hơn #49 nhiều. Khung chết
  boot cũ theo T4: (15:03:31Z, 15:05:09Z] (dòng chain cuối →
  lần đọc đầu sau reboot).

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND155_T4_WEBKIT_QUIET24_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round155-t4/`):**
  `poll-wait-t4-155.sh` (md5 `d2a9a132db3a0e15e4212f083cc713ea`
  — CÓ fix F-155-T4-3 + deadline 16:30Z + cờ T5 round155-t5/
  fallback round154-t5/ + nhãn T4-155a), `run-attempt-155.sh`
  (md5 `eada62466775ae92c0307154594810a1` — đổi số vòng/đường dẫn/
  nhãn so với 154). **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` — byte-identical với bản đã vá
  đợt 148–154, 0 lượt hợp lệ) và **KHÔNG ghi đè
  `t4-attempt-inner.sh` / `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round155-t4/` — inner chỉ sửa 1 dòng echo curl
  cùng họ F-155-T4-3, theo đúng mẫu 149–154: chỉ stage 2 script
  trên).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-155.sh`, `run-attempt-155.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `appendix-155.py` (phụ lục §A đợt 154 — đợt này dùng
  `stats-155.py` mới vì poll chia 4 instance/2 boot),
  `stats-155.py` (thống kê §A — trích từ log gốc, không gõ tay),
  `distinct-seq-155.py` (helper cột distinct-seq — đợt này không
  có input mới).
- **Log/evidence (hidden_files/round155-t4/, không stage):**
  `poll-t4.log` (start ×3 instance + 121 poll thật instance 2/3/4
  + HET HAN exit 5), `poll-test-155.log` (test start + 2 poll thật
  instance 1 + TEST-POLL-OK exit 7), `poll-t4.nohup2/3/4.log`,
  `chain-t4.log`, `postboot-t4-155-gate0wait-*.log` (check-only mỗi
  4 poll), `blockers-ps-1/2.txt` / `blockers-list-1/2.txt` (job O8
  T0-155), `appendix-155.txt` (output stats-155.py),
  `preview-b-f3-flip-webkit-t4-attempt1-12fc68a3.json` (1.707.741 B)
  + `preview-b-f3-flip-webkit-t4-attempt2-12fc68a3.json`
  (2.479.637 B) + `run-webkit-t4-attempt*.log` +
  `load-mid-t4-attempt*.log` + `ps-before/after-t4-attempt1-*.txt`
  + `classb-t4-attempt1-12fc68a3.txt` +
  `analyze-t4-attempt1-12fc68a3-*.txt` (9 file) +
  `analyze-t4-attempt2-12fc68a3-KILLED-*.txt` (9 file, cứu hộ) +
  `coverage-check-attempt1-12fc68a3.txt` +
  `attempt-done-attempt1-12fc68a3` (duy nhất).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng (poller
  instance 4 đã thoát exit 5 lúc 16:30Z; attempt2 chết theo
  reboot; vite :5187 curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round155-t4-quiet24.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round155-t4.done` (~16:4xZ — trong hạn
  cờ 17:00Z, CÓ NỘI DUNG).

## 5. Sai số F-155-T4-1..4 (+ nợ cũ)

- **F-155-T4-1 — POLL_TEST=1 RÒ VÀO RETRY-WAIT, GIẾT POLLER
  INSTANCE 1 (exit 7, 14:48:24Z).** Cơ chế: `poll_once` kiểm tra
  TESTMODE ở cuối hàm, SAU nhánh gate-mở; poll test #1 mở cửa
  (gate đạt) nên chạy attempt1 thật trong khi `POLL_TEST` vẫn =1;
  poll retry-wait #2 cửa đóng → rơi vào nhánh `TEST-POLL-OK ...
  exit 7`. Đây là lỗi vận hành của T4 (chạy test poll bằng đúng
  script poller thật thay vì tách riêng), không phải lỗi logic
  đo. Khắc phục: khởi động lại instance 2 KHÔNG POLL_TEST
  (14:50:19Z). Đề xuất cho đợt 156 (chưa sửa trong script đã
  stage): sau khi `wait_gate` trả về lần đầu, đặt `POLL_TEST=0`,
  hoặc chỉ cho phép nhánh exit 7 khi đó là poll đầu tiên của
  phiên (`i==1`).
- **F-155-T4-2 — REBOOT (ỨNG VIÊN #50) GIẾT POLLER + ATTEMPT2
  GIỮA PHIÊN.** Boot mới d849728b, btime 15:04:07Z; poller instance
  2 (pid 46520) + attempt2 chết theo reboot; attempt2 probe 20/20
  JSON đầy đủ nhưng chết trước classb/analyzer. Khung chết boot
  cũ: (15:03:31Z, 15:05:09Z] theo log T4 (dòng chain cuối → lần
  đọc đầu sau reboot); sampler attempt2 ghi tới 15:04:43Z theo giờ
  boot cũ — **nghịch lý đồng hồ ≥36 s** (xem §3). Số hiệu #50 là
  ỨNG VIÊN (T0-155 xác nhận #49; T2-155/T10 xác nhận theo đếm
  chặt). Khác #49: lần này reboot giết đúng lúc attempt đang chạy
  (không chỉ poller đang chờ).
- **F-155-T4-3 — BUG CURL "000000": NHÁNH stale-boot LÀ DEAD
  CODE (phát hiện + vá trong phiên).** `$(curl ... -w
  '%{http_code}' ... || echo 000)` khi curl thất bại in "000" ra
  stdout VÀ exit!=0 nên `|| echo 000` nối thêm "000" → luôn
  "000000", so sánh `= "000"` KHÔNG BAO GIỜ đúng → nhánh
  stale-boot không bao giờ chạy; lock cũ (owner chết + boot đổi +
  curl 000) vẫn hiển thị `lock=co`, cửa không bao giờ mở (instance
  3: 6/6 poll `lock=co` dù mọi điều kiện khác đạt). Vá: tách mã
  curl ra biến `_CURLCODE=$(curl ... || true)` rồi so sánh (đã
  kiểm chứng tay: stale-boot=TRUE; instance 4: lock=stale-boot
  99/99). Cùng họ bug ở `t4-attempt-inner.sh:68` (echo `curl :5187
  = 000000` — chỉ sai số in log, đã sửa cùng lúc). Script snapshot
  đã stage là bản ĐÃ VÁ. Nợ: kiểm tra xem mẫu `|| echo 000` còn ở
  script luồng khác không (grep toàn repo scripts — giao T10).
- **F-155-T4-4 — POLL #16 INSTANCE-4 GẦN-MỞ BỊ CHẶN BỞI
  postboot_exit STALE-FAIL.** Poll #16 (15:27:10Z): RAM=1126 MB,
  load1=1,40 load5=0,89, gate0=T5, lock=stale-boot, blk=0, apt=0
  — mọi điều kiện đạt TRỪ `postboot_exit=1 (pb_age=3)` (check-only
  poll #13 chạy 15:24:40Z, trước khi repair của T5 xong 15:25:50Z,
  FAIL apt thiếu 11 gói). Điều kiện mở cửa đòi `PB=0` độc lập với
  gate0 (đúng thiết kế), nhưng check-only chỉ chạy mỗi 4 poll
  (~3 phút) nên kết quả stale tới 3 poll; poll #17 check lại PASS
  (15:27:55Z) thì RAM đã rơi 980 MB. Đây là cửa sổ RAM ngắn
  (879→1126→980 MB trong 90 s) + cadence check thưa. Ghi để parent
  quyết: có nên chạy check-only mỗi poll khi RAM đang ≥1024 (hoặc
  khi cờ T5 vừa PASS) không — T4 không tự đổi (mỗi lần check tốn
  ~10 s+ và chạm apt/dpkg).
- **F-155-T4-5 — RAM SẬP TRÊN BOOT MỚI (nguyên nhân chính của 0
  lượt hợp lệ mới).** Boot d849728b: RAM ≥1024 chỉ 13/105 poll;
  từ 15:27:10Z RAM không bao giờ ≥1024 nữa (64 phút liên tiếp tới
  hạn cắt); RAM mở 2773 MB → ~500 MB trong ~70 phút. Cùng họ
  F-154-T4-1 (97 phút). Ngưỡng gate A RAM ≥1024 GIỮ NGUYÊN theo
  quyết parent đợt 132 §12.3(a) + quyết (p) đợt 154 — T4 KHÔNG hạ
  ngưỡng để chạy cho có. Hệ quả dây chuyền: T8-155 waiter t4=0
  suốt phiên (O8 không qua gate chuẩn từ phía T4 — T8 tự quyết
  thủ tục (i) như đợt 153/154 nếu áp dụng).
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-155 cho boot mới xuất hiện dạng PASS (đủ boot_id); trên
  boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152 vẫn đứng;
  chờ lượt sau có cờ chính non-PASS. Không đánh ĐÓNG vội.
- **F-148-T4-1 — KHÔNG ÁP DỤNG đợt này (0 lượt hợp lệ).** p1p3p7
  không có JSON hợp lệ để chạy (attempt1 nhiễm tải, attempt2 chết
  trước verdict). Nợ đứng vẫn còn ở mức cơ chế (script chưa tự gọi
  p1p3p7); mỗi đợt có attempt hợp lệ T4 phải chạy tay và ghi rõ.
- **F-150-T4-5 — ĐÓNG (giữ).** Test poll ghi riêng
  `poll-test-155.log` (exit 7); thống kê §A đã hợp nhất 2 poll
  test-log + 121 poll poll-t4.log = 123 poll thật, không cần tách
  tay. Nhưng xem F-155-T4-1: test poll lần này MỞ CỬA nên 2 poll
  test-log mang dữ liệu attempt thật — quy ước "test ghi riêng"
  vẫn đúng về mặt file, nhưng T4 phải nhớ hợp nhất khi đếm.

## 6. P3' cộng dồn (KHÔNG ĐỔI) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 155 (KHÔNG ĐỔI): P1 69/69, P2 60/60,
  P3-A1 61/69, P3' 39/41 occurrence = 39/40 distinct-seq, P7
  55/55** (21 lượt hợp lệ). Không có (c2) mới: attempt1 (c2)=0,
  attempt2-killed (c2)=0 — helper distinct-seq-155.py không có
  input mới.
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại (theo brief).
- Chuỗi median tickCost 21 lượt giữ nguyên (39,0–60,0 ms, mean
  ~49,0 ms, 0 lượt vượt 60). Không có lượt #22/#23/#24 để nối
  chuỗi.

## 7. Chờ quyết parent / nợ đợt 156

- **(a) #24 KHÔNG CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ dừng
  ở #21, đợt thứ ba liên tiếp không có lượt hợp lệ mới (#22/#23/
  #24).** Đợt 156 đo tiếp với cùng cổng tickCost ≤60 ms + probe
  đã vá (không đổi ngưỡng). Câu hỏi cho parent/T10: chuỗi #19/
  #20/#21 có tính là "đứt" không, hay chỉ là "gián đoạn do môi
  trường" (đợt 155: 2 attempt, 0 lượt hợp lệ — không phải lượt đo
  thất bại)? T4 ghi dữ kiện: attempt1 nhiễm tải (lớp B), attempt2
  bị reboot giết (không verdict).
- **(b) RAM sập tái diễn đợt thứ hai liên tiếp (F-155-T4-5):**
  có nên bàn lại ngưỡng gate A RAM cho lượt sau không (hiện tại
  quyết đứng giữ ≥1024)? T4 không đề xuất hạ — chỉ ghi để parent
  quyết. Nếu RAM sập tái diễn đợt 156 thì T4 vẫn sẽ 0 lượt hợp lệ
  (trừ khi cửa mở đúng lúc RAM nhảy như poll #16 instance-2).
- **(c) Reboot ứng viên #50 + nghịch lý đồng hồ ≥36 s
  (F-155-T4-2):** T10-155/T2 đợt sau xác nhận số hiệu + khung
  chết + mù (nếu có). T4 chỉ ghi: boot d849728b, btime 15:04:07Z,
  overlap đồng hồ ≥36 s.
- **(d) F-155-T4-1 (đề xuất sửa script đợt 156):** đặt
  `POLL_TEST=0` sau lần `wait_gate` đầu tiên, hoặc chỉ cho exit 7
  khi `i==1` — để test poll không giết poller ở retry-wait.
- **(e) F-155-T4-4 (câu hỏi cadence check-only):** có nên chạy
  check-only mỗi poll khi RAM đang ≥1024 (hoặc khi cờ T5 vừa
  PASS) để không lỡ cửa sổ RAM ngắn? T4 không tự đổi — chờ
  parent/T10 phán (đổi cadence có chi phí chạy check mỗi 45 s).
- **(f) F-155-T4-3 (nợ kiểm tra diện rộng):** mẫu `|| echo 000`
  sau `curl -w '%{http_code}'` có còn ở script luồng khác không
  — giao T10 grep toàn repo scripts.
- **(g) Các nợ đứng khác giữ nguyên từ đợt 154 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #74?/#75?/#77?/#81? giao T2; birefnet
  0 thử; u2net là fallback chính thức.

## A. Phụ lục số liệu (script trích từ log gốc — stats-155.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-155.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-20T14:42:54Z - 2026-11-20T14:48:24Z, boot=12fc68a3
   RAM min=1159 max=2413 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 1/2 load5<2: 1/2 blockers>0: 0 apt>0: 0
   gate0: T5=2
   lock: khong=2
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 16 poll, 2026-11-20T14:50:20Z - 2026-11-20T15:01:44Z, boot=12fc68a3
   RAM min=604 max=1741 >=1024: 10/16 500-1023: 6/16 <500: 0/16
   load1<2: 11/16 load5<2: 5/16 blockers>0: 2 apt>0: 0
   gate0: T5=16
   lock: khong=16
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 3: 6 poll, 2026-11-20T15:10:21Z - 2026-11-20T15:14:07Z, boot=d849728b
   RAM min=1817 max=2773 >=1024: 6/6 500-1023: 0/6 <500: 0/6
   load1<2: 6/6 load5<2: 6/6 blockers>0: 0 apt>0: 0
   gate0: khong-dat=6
   lock: co=6
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 4: 99 poll, 2026-11-20T15:15:50Z - 2026-11-20T16:29:45Z, boot=d849728b
   RAM min=467 max=1517 >=1024: 7/99 500-1023: 90/99 <500: 2/99
   load1<2: 99/99 load5<2: 99/99 blockers>0: 0 apt>0: 3
   gate0: T5=85, khong-dat=14
   lock: stale-boot=99
   dpkg 2->795
   chuoi RAM<500 dai nhat: 1 poll
-- TONG poll that: 123
-- RAM toan phien: min=467 max=2773 >=1024: 25/123 <500: 2/123
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 15/123
   gan-mo? #1 2026-11-20T14:42:54Z boot=12fc68a3 RAM=1159 L1=1.13 L5=0.86 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #16 2026-11-20T15:01:44Z boot=12fc68a3 RAM=1260 L1=1.91 L5=1.68 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #1 2026-11-20T15:10:21Z boot=d849728b RAM=2773 L1=1.06 L5=0.88 blk=0 apt=0 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #2 2026-11-20T15:11:06Z boot=d849728b RAM=2637 L1=0.90 L5=0.88 blk=0 apt=0 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #3 2026-11-20T15:11:52Z boot=d849728b RAM=2421 L1=0.47 L5=0.77 blk=0 apt=0 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #4 2026-11-20T15:12:37Z boot=d849728b RAM=2142 L1=0.37 L5=0.71 blk=0 apt=0 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #5 2026-11-20T15:13:22Z boot=d849728b RAM=1970 L1=0.17 L5=0.61 blk=0 apt=0 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #6 2026-11-20T15:14:07Z boot=d849728b RAM=1817 L1=0.08 L5=0.52 blk=0 apt=0 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #1 2026-11-20T15:15:50Z boot=d849728b RAM=1373 L1=0.31 L5=0.51 blk=0 apt=0 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #2 2026-11-20T15:16:36Z boot=d849728b RAM=1517 L1=0.28 L5=0.47 blk=0 apt=0 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #3 2026-11-20T15:17:21Z boot=d849728b RAM=1414 L1=0.26 L5=0.43 blk=0 apt=0 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #4 2026-11-20T15:18:06Z boot=d849728b RAM=1328 L1=0.25 L5=0.40 blk=0 apt=0 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #5 2026-11-20T15:18:51Z boot=d849728b RAM=1214 L1=0.43 L5=0.44 blk=0 apt=0 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #6 2026-11-20T15:19:37Z boot=d849728b RAM=1066 L1=0.34 L5=0.42 blk=0 apt=0 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #16 2026-11-20T15:27:10Z boot=d849728b RAM=1126 L1=1.40 L5=0.89 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=stale-boot t5=PASS
-- boot 12fc68a3: 18 poll; RAM>=1024 lan cuoi: 2026-11-20T15:01:44Z #16; RAM<1024 lan dau: 2026-11-20T14:57:13Z #10 RAM=1008
-- boot d849728b: 105 poll; RAM>=1024 lan cuoi: 2026-11-20T15:27:10Z #16; RAM<1024 lan dau: 2026-11-20T15:20:22Z #7 RAM=951
-- cong don P3' (KHONG DOI, 21 luot hop le): P1 69/69 P2 60/60 P3-A1 61/69 P3' 39/41 occ = 39/40 distinct-seq P7 55/55
-- chuoi median 21 luot (giu nguyen): n=21 mean=49,0 min=39,0 max=60,0 vuot-60: 0
```

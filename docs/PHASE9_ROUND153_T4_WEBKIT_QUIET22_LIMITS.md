# PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md

**Đợt:** 153. **Luồng:** T4 — đo lượt yên WebKit #22 trên boot mới
+ XEM XÉT P3' (quyết parent (d) đợt 152, hạn một đợt).
**Ngày:** 20/11/2026.
**Boot đo:** 401fca75 (boot #45 theo T5-153, btime 07:32:38Z 20/11
/proc/stat; boot_id đầy đủ 401fca75-bece-45b6-88fa-b12f602d6390).
**Trạng thái:
#22 CÓ LƯỢT HỢP LỆ MỚI — attempt2-401fca75: 20/20 + lớp B ĐẠT 5/5 +
tickCost median 40,0 ms ≤60 → lượt hợp lệ thứ 21; (c2) 7 occurrence,
tất cả lag +1f; P3' 7/7 ĐẠT trong lượt này — mẫu seq-365 KHÔNG tái
diễn. Cộng dồn (21 lượt): P1 69/69, P2 60/60, P3-A1 61/69,
P3' 39/41, P7 55/55.
XEM XÉT P3' ĐÃ XONG (hạn một đợt): kết luận (b) — 2 tick không đạt
là MỘT event thật (seq 365 đợt 151), cơ chế thứ hai "catch-up lag
sau đóng băng", KHÔNG phải artifact đo; verdict ghost-freeze đứng
nguyên; P3' nghiêm ngặt vẫn không tròn (39/41) — parent quyết (§9).**
Attempt1 wedged sau pass 16 (3 fetch writePartial timeout 30 s,
exit=2, partial 16/20 pass) — KHÔNG tính verdict, retry đúng luật
cho lượt hợp lệ. Ngân sách dùng 2/3 attempt. p1p3p7 chạy tay sau
poller, exit 0 (F-148-T4-1 ĐÓNG cho lượt này).

## 0. Verdict tổng

- **Lượt hợp lệ #21: attempt2-401fca75, 08:59:22–09:02:43Z.**
  Probe 20/20, JSON 3.672.854 B, tickCost total n=647
  **median=40,0 ms** (p90=66,0, max=97, min=27); hậu flip+2000ms
  n=463 median=40,0 ms. Lớp B **ĐẠT 5/5** (B1 load5 cuối 1,42;
  B2 load1 max 2,48, ps-before/after chỉ có vite của mình; B3
  không reboot; B4 pgrep apt/dpkg=0, dpkg delta=0; B5 RAM min
  1597 MB, 0 mẫu <500 MB, 0 mẫu <1024 MB). Coverage (c2) 7/7.
  Poller thoát exit 0 lúc 09:03:09Z.
- **Attempt1 WEDGED (không hợp lệ, không tính verdict):**
  08:56:15–08:58:55Z, exit=2, 16/20 pass; cả 3 fetch writePartial
  (tickCost, blendTick, c2DrawLog) timeout 30 s liên tiếp sau pass
  16 (08:57:54 / 08:58:24 / 08:58:54Z) — probe tự thoát sau pass
  16, partial JSON 2.769.033 B đã ghi (tickCost n=495 median
  41,0; blendTick n=403; c2DrawLog n=963). Lớp B trên partial
  cũng 5/5 (load1 max 1,55, RAM min 1341 MB, dpkg delta 0) nhưng
  không có ý nghĩa verdict vì run chưa xong. 6 (c2) của nó
  (160, 245, 273, 327, 353, 378 — tất cả P3' ĐẠT, stall 5, 7, 4,
  3, 3, 5; coverage 6/6) KHÔNG được cộng dồn (run partial).
  Retry đúng luật: poller poll lại gate trước attempt2 (quyết (h)).
- **(c2) lượt hợp lệ: 7 occurrence, TẤT CẢ lag +1f**
  (170, 244, 304, 348, 377, 428, 499) — mẫu "sạch" kiểu A, không
  có lag5 (b) nào (0 occurrence, 0 event — khác đợt 151: 1 event
  +10f; đợt 152: 3 event (b) không kèm (c2)). 0 lag âm (c2).
- **P3' trong lượt này: 7/7 ĐẠT** (stall 7, 5, 3, 5, 5, 6, 3;
  baseline 0,219). Mẫu seq-365 KHÔNG tái diễn. Cộng dồn P3'
  32/34 → **39/41** (xem §4 + §9).
- **Ngân sách dùng 2/3 attempt.** 0 reboot TRONG LÚC ĐO
  (08:39–09:03Z, boot 401fca75 suốt). **Reboot #46 xảy ra SAU
  khi poller thoát** — phát hiện lúc đóng 09:10:51Z: boot mới
  1450ac80, btime 09:04:49Z theo /proc/stat (uptime lúc 09:11:16Z
  là 6 phút → boot ≈09:05:xxZ — btime/uptime lệch ~30–60 s,
  cùng họ mâu thuẫn đồng hồ T5-153 đã nêu; xem F-153-T4-6).
  Reboot này KHÔNG ảnh hưởng verdict T4 (mọi artifact đo đã
  ghi xong trước đó; cờ + file stage ghi sau reboot, còn
  nguyên vẹn, đã verify). Không process T4 nào còn sống lúc
  poller thoát (vite :5187 đã kill 09:02:46Z; vite.lock không
  tồn tại); snapshot đóng 09:10:51Z chạy trên boot mới nên
  mặc nhiên không có process T4.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round153-t4.done` viết ~09:10Z (trong hạn
  cờ ~11:00Z, trước hạn cứng 11:30Z).

## 1. Poller — 24 poll thật, cửa mở 2 lần

- **Test (POLL_TEST=1) 08:39:31Z:** 1 poll, exit 7, ghi RIÊNG
  vào `poll-test-153.log` (F-150-T4-5 ĐÓNG — `poll-t4.log`
  KHÔNG còn dòng test nào; đúng 24 dòng "poll #" thật).
  load1=2,33, load5=1,44, RAM=2050 MB, postboot_exit=1,
  gate0=khong-dat, t5flag=cu(mtime-cu), apt=1, dpkg_lines=2.
- **Poll #1–#12 (08:39:39–08:47:56Z):** gate0=khong-dat.
  postboot_exit=1 suốt (replay chưa tới — xem §5); t5flag=
  cu(mtime-cu) (chỉ có cờ T5-152 cũ, không khớp boot mới;
  cờ T5-153 KHÔNG bao giờ xuất hiện trong 24 poll — xem §5).
  load1 0,76–4,52, load5 1,33–2,19; RAM 1333–2708 MB.
  Blockers: poll #12 có 1 (node clicktest O8 vừa khởi động,
  etime 00:00 — xem blockers-list-12.txt).
- **Poll #13–#22 (08:48:42–08:55:30Z):** gate0=T4-check-only
  (postboot_exit=0 từ poll #13, pb_age 0–3) NHƯNG blockers=5
  suốt (job O8 của T0-153 — xem dưới) + load5 còn 1,14–2,67
  nên cửa chưa mở. RAM 1069–2136 MB (min 1069 ở poll #14).
- **Poll #23 (08:56:15Z): load1=0,75, load5=1,86, RAM=2218 MB,
  postboot_exit=0, blockers=0 — CỬA MỞ lần 1 (gate0=T4-check-only
  pb_age=2)** → chạy attempt1 (wedged).
- **Poll #24 (08:59:21Z): load1=1,04, load5=1,48, RAM=2745 MB,
  postboot_exit=0, blockers=0 — CỬA MỞ lần 2 (gate0=T4-check-only
  pb_age=3)** → chạy attempt2 (lượt hợp lệ). Poller thoát
  09:03:09Z.
- **Phân rã 24 poll thật:** RAM≥1024: 24/24; RAM 500–1023:
  0/24; RAM<500: 0/24; RAM min 1069 / max 2745 MB.
  load1<2: 13/24; load5<2: 14/24. Chỉ 2 poll mà load + RAM
  cùng đạt (#23, #24) — đúng 2 lần cửa mở.
  gate0: khong-dat 12 poll, T4-check-only 12 poll, T5 0 poll.
- **Blockers trong lúc chờ (poll #12–#22, 11 poll):** toàn bộ
  là job O8 của T0-153, không phải của T4: poll #12 có 1
  (vite O8? — xem blockers-list-12.txt); poll #13–#22 đủ bộ 5
  (clicktest-87o8-mask-track-webkit.mjs node + vite :5564 +
  MiniBrowser + WebKitNetworkProcess + WebKitWebProcess —
  xem blockers-list-14.txt). Từ poll #23 blockers=0. Các job
  này chỉ ảnh hưởng lúc CHỜ — attempt chạy sau khi blockers=0,
  load đã hạ, nên không nhiễm lượt đo (xem §2, B2 ĐẠT).
- **RAM sập đợt 150 KHÔNG tái diễn trong cửa sổ chờ:** 0 poll
  <500 MB (đợt 150: 34/97 poll <500 MB, min 411 MB). RAM chờ
  dao động 1069–2745 MB, không giảm đơn điệu (khác đợt 152).

## 2. Attempt2 — LƯỢT HỢP LỆ #21 (08:59:22–09:02:43Z)

- Probe 20/20 (run-attempt exit 0), JSON 3.672.854 B.
  **tickCost total n=647 median=40,0 ms** (p90=66,0, max=97,
  min=27); hậu flip+2000ms n=463 median=40,0 ms. tBlend gap
  n=518 median=80,0 p90=101,0 max=2056. BlendTick/pass=25,9;
  rAF/pass median=40 (33–45). webkit=27.2, pageErrs=[].
  Wallbands: 0–20k median 41,0; 20–32k median 37,0; 32–45k
  median 41,0; 45–62k median 40,0; 62–70k median 43,0;
  70–80k median 39,5 (toàn lượt median 40,0).
- Lớp B **ĐẠT 5/5** (xem file classb gốc): B1 ĐẠT (load5 cuối
  1,42 ≤2,5); B2 ĐẠT (load1 max 2,48 ≤4; ps-before/after chỉ
  có vite :5187 của chính T4 + esbuild của nó); B3 ĐẠT (boot
  lúc bắt đầu = boot hiện tại = 07:32:38Z); B4 ĐẠT (pgrep
  apt/dpkg=0, ps exact-comm=0, dpkg delta=0); B5 ĐẠT (RAM min
  1597 MB, 0 mẫu <500 MB, **0 mẫu <1024 MB**). Sampler n=100.
- Per-pass (20 pass): median 36,0–52,0 ms; load1 mean theo
  pass 1,27 → 2,42 (đỉnh pass 8–9) → 2,07; RAM mean theo pass
  2098 → 1613 MB (giảm dần — xem F-153-T4-4). Tương quan
  Pearson: median~load1_mean r=-0,04; median~RAM_mean r=-0,08
  (chỉ mô tả — không kết luận nhân quả từ 1 lượt).
- **mask_anim.py KHÔNG nhiễm cửa đo đợt này** (xem F-152-T4-5
  tiếp tục): ps-before/after sạch (chỉ vite :5187 của T4);
  load1 max trong attempt chỉ 2,48. Đây là lần thứ hai liên
  tiếp job nặng không tái diễn trong cửa đo T4.

## 3. (c2)=7 — phân tích chi tiết (attempt2)

- labellag: skippedLatest=1: nTick=67, nOccurrence=134,
  (c)=0, (c2)=0; lag (a)/(b) median=0f, p90=2f, max=4f,
  min=-1f, 1 lag âm. skippedLatest=0: nTick=304,
  nOccurrence=608, (c)=7, (c2)=7; lag (a)/(b) median=1f,
  p90=2f, max=4f, min=-1f, 36 lag âm.
  Lưu ý theo analyzer: lag (a)/(b) KHÔNG đo được trễ thật
  >2f do alias chu kỳ 4 frame — chỉ (c2) mới có thông tin,
  và (c2) ở đây toàn lag +1f, 0 lag âm.
  **(c2) 7 occurrence, tất cả lag +1f:**
  (170, 14, 13, 1), (244, 15, 14, 1), (304, 25, 24, 1),
  (348, 13, 12, 1), (377, 22, 21, 1), (428, 27, 26, 1),
  (499, 21, 20, 1). (c1) alias=0, (d) nomatch=0.
- **lag5 (b): 0 occurrence, 0 event** — không có event lag
  ≥+5f nào trong lượt hợp lệ này (đợt 151: 1 event +10f tại
  seq 365; đợt 152: 3 event (b) không kèm (c2)).
- skiplatest: **F6' ĐÓNG** — skippedLatest=1: 67/67 tick
  không vi phạm (nhãn 100%, pixel-verified 100%, 0 vi phạm
  thật); skippedLatest=0 đối chứng: 304/304 tick sạch.
- c2drawlog: n=1256 (drawSrc 647, rawUnit 609), 1 epoch,
  loopNo 1–21, frameIdx 0–70 (62 distinct), wallMs span
  69.622 ms. **Loop 9 chỉ 1 entry** (các loop khác 52–74)
  — lỗ hổng log, xem F-153-T4-2. RE-ARM 7 lần trong lượt
  (sau pass 4, 7, 9, 11, 13, 15, 17 — window.__vcutC2DrawLog
  cứ ~2 pass lại về false rồi re-arm).
- stall analyzer: baseline P(stall≥2)=81/370 = 0,219;
  "(c2) 7/7 DAT" — xem §4.

## 4. p1p3p7 chạy tay + số cộng dồn (c2) — 21 LƯỢT HỢP LỆ

- p1p3p7 chạy TAY sau poller (nợ F-148-T4-1 — run-attempt
  không gọi tự động), exit 0:
  `python3 analyze-t4-p1p3p7.py
  preview-b-f3-flip-webkit-t4-attempt2-401fca75.json
  "170,244,304,348,377,428,499"`.
- **P1: ĐÚNG — 7/7** (c2) gần run-end (baseline 39/371,
  p=1,42e-07; run_end seqs n=13, gồm cả 7 seq (c2)).
- **P2: ĐÚNG — 7/7** lag ≥+1f, 0 lag âm (lag 1,1,1,1,1,1,1).
- **P3-A1: ĐÚNG — 6/7** (c2) đóng băng-tại-tick (baseline
  81/370, p=0,000626; seq 304 KHÔNG đóng băng-tại-tick —
  labelMs=48174, prev=47936 — nhưng stall_truoc=3 nên P3'
  vẫn ĐẠT; xem F-153-T4-5).
- **P3': ĐẠT tròn — 7/7** (stall_truoc 7, 5, 3, 5, 5, 6, 3).
- **P7: ĐÚNG — 0 entry tre ≥+1f** (drawSrc delta {-1: 44,
  0: 41}; đối chứng toàn bộ drawSrc post: 0/462 entry).
- **Cộng dồn MỚI (21 lượt hợp lệ): P1 69/69, P2 60/60,
  P3-A1 61/69, P3' 39/41, P7 55/55** (trước đợt này, 20 lượt:
  P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48).
  P3' lần này 7/7 — mẫu seq-365 không tái diễn (xem §9).
- Chuỗi median tickCost 21 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  **40,0 ms** (trung bình ~49,0 ms). Không lượt nào vượt
  ngưỡng 60 ms trong chuỗi 21 lượt.
- Điều tra (c2) vẫn ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — không có điều kiện nào trong ba điều
  kiện mở lại (§13 DEF v0.5) xảy ra (P1 ĐÚNG; 0 lag âm (c2);
  +2f = 0 trong lượt).

## 5. Replay/postboot trên boot mới — TỚI MUỘN, KHÔNG CÓ CỜ T5

- Boot #45 401fca75 (btime 07:32:38Z): **replay TỚI MUỘN,
  không tới sớm** — dpkg.log đóng băng 2 dòng từ lúc mở
  poller (08:39:39Z, boot+67m) tới poll #10 (08:46:26Z,
  133 dòng), rồi tăng dần 433 → 729 → 1149 → 1274 → 1471 →
  **1545 dòng lúc poll #16 (08:50:59Z, boot+78m)**, khớp
  đúng 1545 dòng của đợt 151 (replay đầy đủ). apt=1 (apt-get
  update chạy) trong poll #1–#15, apt=0 từ poll #16.
  Theo T5-153.done (~08:52Z): replay muộn boot+63'02",
  đủ 11/11 gói + GST 269 lúc ~boot+76' (08:49:10Z) — chậm
  ~38' so với đường watcher ở #43; watcher-152 chết theo
  reboot #44, không watcher nào chạy từ đó tới nay.
- **Cờ T5-153 KHÔNG bao giờ xuất hiện:** t5flag=cu(mtime-cu)
  (cờ T5-152 cũ, boot 18e179e0) trong cả 24 poll; thư mục
  round153-t5/ lúc T4 đóng chỉ có t5-stats-153.py +
  t5-stats-153-output.txt, KHÔNG có POSTBOOT_PASS.
  T5-153.done xác nhận: "chưa có POSTBOOT_PASS cho #45
  (cờ trên đĩa vẫn là #43 stale)"; T5-153 KHÔNG khởi động
  watcher, KHÔNG repair, KHÔNG chạy postboot check-only.
- **Gate0 của T4 dựa hoàn toàn vào check-only của chính T4**
  (quyết (j) đợt 143): postboot check-only PASS từ poll #13
  (08:48:42Z) và giữ PASS suốt (pb_age 0–3); gate0=T4-check-only
  trong 12/12 poll cuối. T4 check-only độc lập PASS — gate0
  được xác nhận bởi chính phép đo của T4, không dựa vào cờ T5.
- Đối chiếu đợt 151: replay tới tự nhiên boot+4m22s;
  đợt 152: replay không tới, repair sớm cứu (dpkg 795);
  đợt này: replay tới muộn tự nhiên (không repair),
  T4 chờ 23 poll (~17 phút) mới mở cửa lần đầu.
- Ghi nhận cho T2 (không thuộc T4, không ảnh hưởng verdict):
  T5-153.done nêu mâu thuẫn đồng hồ MỚI — btime #45 chồng lấn
  2.741 s (45m41s) với hoạt động trên #44 — giao T2-153 phán
  (mù #76?). Trong phiên T4: boot 401fca75 không đổi, 0 reboot,
  tBlend đơn điệu, không thấy nhảy đồng hồ.

## 6. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md`.
- **Script snapshot để stage (theo mẫu đợt 149/150/151/152),
  trong repo `apps/web/scripts/` (md5 khớp bản làm việc ở
  `hidden_files/round153-t4/`):** `poll-wait-t4-153.sh`
  (md5 `d48c13484b89fd77f048b954d1536041`),
  `run-attempt-153.sh` (md5 `94e81831d806bed5240c062510596cb4`).
  Thay đổi so với 152: deadline poller 10:30Z (hạn cờ
  ~11:00Z, cứng 11:30Z); cờ T5 ưu tiên round153-t5/, dự phòng
  round152-t5/; nhãn analyzer T4-153a; inner kiểm file
  round152-* (thay vì round151-*).
  **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` — byte-identical với bản
  đã vá đợt 148/149/150/151/152) và **KHÔNG ghi đè
  `t4-attempt-inner.sh` / `check-classb-t4.sh`**
  (bản làm việc ở `hidden_files/round153-t4/`, chỉ đổi số
  vòng/đường dẫn/W-path so với 152 — theo đúng mẫu 149–152).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-153.sh`, `run-attempt-153.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `appendix-153.py` (phụ lục §A), `p3prime-investigate-151.py`
  + `p3prime-investigate-151b.py` + `p3prime-save-outputs.sh`
  (điều tra §9).
- **Log/evidence (hidden_files/round153-t4/, không stage):**
  `poll-t4.log` (start + 24 poll thật + 2 lần CUA MO +
  verdict; 0 dòng test), `poll-test-153.log` (test exit 7,
  riêng), `poll-t4.nohup.log`, `chain-t4.log`,
  `postboot-t4-153-gate0wait-*.log` (check-only mỗi 4 poll),
  `blockers-ps-*.txt` / `blockers-list-*.txt` (poll #12–#22);
  attempt1 (wedged): `preview-b-f3-flip-webkit-t4-attempt1-401fca75.json`
  (2.769.033 B) + 9 analyzer + classb + coverage-check 6/6 +
  ps-before/after + load-mid + vite log;
  attempt2 (hợp lệ): `preview-b-f3-flip-webkit-t4-attempt2-401fca75.json`
  (3.672.854 B) + 10 analyzer (gồm p1p3p7 chạy tay) +
  classb + coverage-check 7/7 + ps-before/after +
  load-mid + vite log; `attempt-done-attempt1-401fca75`,
  `attempt-done-attempt2-401fca75` (ngân sách 2/3);
  điều tra P3': `p3prime-investigate-151a.txt`,
  `p3prime-investigate-151b.txt`, `p3prime-investigate-151c.txt`
  (strip-match + hash pix + kiểm định nhị thức),
  `appendix-153.txt`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§6); không process T4 nào còn sống lúc đóng.
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round153-t4-quiet22.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã
  verify bằng `od`).
- **Cờ:** `hidden_files/round153-t4.done` (~09:10Z — trong hạn
  cờ ~11:00Z).

## 7. Sai số F-153-T4-1..5 (+ nợ cũ)

- **F-153-T4-1 — Attempt1 PAGE-WEDGED sau pass 16 (exit=2).**
  Cả 3 fetch writePartial (tickCost, blendTick, c2DrawLog)
  timeout 30 s liên tiếp sau pass 16 (08:57:54 / 08:58:24 /
  08:58:54Z); probe tự thoát, partial JSON 2.769.033 B đã ghi
  (16/20 pass). Trang không đáp ứng pwEvalTimeout — page wedged
  thật (không phải timeout mạng/vite: vite :5187 vẫn sống tới
  khi kill tay; load1 lúc đó chỉ 0,55). Retry đúng luật cho
  lượt hợp lệ attempt2. Ghi để T0/probe xem xét nếu tái diễn
  (T4 không sửa probe). 6 (c2) của attempt1 KHÔNG cộng dồn.
- **F-153-T4-2 — RE-ARM draw log 7 lần + loop 9 chỉ 1 entry
  (F-152-T4-2 tái diễn).** Cửa sổ draw log cứ ~2 pass lại đóng
  rồi re-arm (sau pass 4, 7, 9, 11, 13, 15, 17); log vẫn đủ
  1256 entry nhưng có lỗ ở loop 9 (1 entry so với 52–74 ở
  các loop khác). Entry duy nhất của loop 9 là drawSrc
  frameIdx 68, ct 2,2667, wallMs 36186 — đuôi loop trước khi
  wrap (cùng mẫu loop 15 đợt 151 / loop 18 đợt 152), KHÔNG
  phải lỗ giữa lượt: coverage seq 170 vẫn 28 entry ±500ms.
  Giao T0/probe xem xét (T4 không sửa probe).
- **F-153-T4-3 — Replay boot mới TỚI MUỘN + KHÔNG CÓ CỜ T5.**
  dpkg.log 2 dòng đóng băng tới boot+74m (poll #10); tới đủ
  1545 dòng lúc boot+78m (poll #16) mà không có repair nào
  (T5-153 không khởi động watcher/repair/check-only — xem
  T5-153.done). Gate0 dựa hoàn toàn vào T4-check-only (12/12
  poll cuối PASS). T4 chờ 23 poll (~17 phút) mới mở cửa lần
  đầu. Không phải lỗi T4; ghi nhận cho T5/T10.
- **F-153-T4-4 — RAM giảm đơn điệu trong lượt hợp lệ.**
  Gate mở lúc RAM 2745 MB (poll #24) nhưng trong attempt2 RAM
  mean theo pass giảm 2098 → 1613 MB (min 1597 MB). Nhẹ hơn
  đợt 152 (17/107 mẫu <1024 MB): đợt này **0/100 mẫu <1024 MB**,
  B5 xa ngưỡng. Ghi nhận, theo dõi đợt sau (mẫu giảm RAM trong
  lượt tái diễn 3 đợt liên tiếp: 151, 152, 153).
- **F-153-T4-5 — P3-A1 6/7: seq 304 label đổi ngay tại tick
  (c2).** labelMs=48174, prev=47936 (label đổi tại chính tick
  (c2)), nhưng stall_truoc=3 → P3' ĐẠT. Phân biệt rõ A1
  (đóng băng TẠI tick: labelMs[seq]==labelMs[seq-1]) với P3'
  (đóng băng TRƯỚC tick: chuỗi kết thúc tại seq-1 ≥2 tick):
  304 là ca A1-fail/P3'-pass — mô hình nhãn vẫn đúng theo P3'
  (nhãn đóng băng 3 tick rồi nhảy đúng lúc (c2) nổ).
  Không ảnh hưởng verdict (P3-A1 vẫn ĐÚNG, p=0,000626).
- **F-153-T4-6 — Reboot #46 sau khi poller thoát (phát hiện
  lúc đóng).** Boot mới 1450ac80-d1d2-46b4-a87c-c209a58c4798,
  btime 09:04:49Z theo /proc/stat; uptime 6 phút lúc 09:11:16Z
  → boot thực ≈09:05:xxZ (btime/uptime lệch ~30–60 s — cùng
  họ mâu thuẫn đồng hồ mà T5-153 đã nêu cho #45, nhưng nhỏ
  hơn nhiều so với 2.741 s kia). Lần đọc boot_id cuối trên
  boot cũ là 09:05:19Z (401fca75) — khung chết của #45 nằm
  trong (09:05:19Z, 09:10:51Z]; btime 09:04:49Z nằm TRƯỚC
  lần đọc đó nên btime không dùng được làm mốc chính xác —
  giao T2/T5 phán (mù #76? + chuỗi reboot). Không ảnh hưởng
  verdict T4 (xem §0). Ghi để T10/T2 đối chiếu: T7 đang theo
  dõi kết cục run 152, T8/T9 chưa đóng lúc T4 phát hiện.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-153 không xuất hiện nên nhánh "cờ chính tồn tại nhưng
  non-PASS" (mtime-mới-không-ghi-boot_id) không được chạm trong
  lượt này — poller chỉ gặp cờ cũ "cu(mtime-cu)" trong cả 24
  poll. Sửa từ đợt 152 vẫn đứng; chờ lượt sau có cờ chính
  non-PASS. Không đánh ĐÓNG vội.
- **F-152-T4-2 — TÁI DIỄN (xem F-153-T4-2).** RE-ARM 7 lần +
  loop 9 lỗ 1 entry — cùng mẫu đợt 152 (7 lần + loop 18).
- **F-148-T4-1 — ĐÓNG (cho lượt này).** p1p3p7 KHÔNG được
  run-attempt gọi tự động (vẫn đúng — chạy tay sau poller,
  exit 0, xem §4). Nợ đứng này vẫn còn ở mức cơ chế (script
  chưa tự gọi); mỗi đợt T4 phải chạy tay và ghi rõ.
- **F-150-T4-5 — ĐÓNG.** Test poll ghi riêng
  `poll-test-153.log` (exit 7); `poll-t4.log` đúng 24 dòng
  poll thật (+ các dòng start/CUA MO/verdict và 11 dòng ghi
  blockers-snapshot), thống kê §1 không cần tách tay nữa.
- **F-152-T4-5 — TIẾP TỤC ĐÓNG (lần thứ hai liên tiếp).**
  mask_anim.py KHÔNG nhiễm cửa đo (ps-before/after sạch,
  load1 max 2,48). Hướng dẫn đứng vẫn giữ.

## 8. Chờ quyết parent / nợ đợt 154

- **(a) #22 CÓ lượt hợp lệ mới (thứ 21, median 40,0 ms) —
  đo tiếp đợt 154** với cùng cổng tickCost ≤60 ms + probe đã
  vá (không đổi ngưỡng — lượt này median 40,0 ms, xa dưới
  ngưỡng; không có căn cứ nào để bàn ngưỡng).
- **(b) XEM XÉT P3' ĐÃ XONG — parent quyết (§9):** T4 kết luận
  (b) — 2 tick không đạt là 1 event thật, cơ chế thứ hai
  "catch-up lag sau đóng băng", không phải artifact; verdict
  ghost-freeze đứng nguyên; P3' nghiêm ngặt 39/41 vẫn không
  tròn. Parent chọn: (i) đóng xem xét, chấp nhận P3' với 1
  ngoại lệ có giải thích (+ ghi nhận cơ chế thứ hai, đếm theo
  distinct-seq từ nay); (ii) giữ P3' mở để theo dõi thêm;
  (iii) sửa DEF (P3'' tính đóng băng trong 5 tick trước (c2)
  — event 365 có đóng băng kết thúc 4 tick trước).
  T4 đề xuất (i) kèm ghi chú DEF — nhưng quyết là của parent.
- **(c) F-153-T4-1 (attempt1 wedged):** theo dõi đợt sau —
  nếu page-wedged tái diễn thì giao T0/probe xem xét (T4
  không sửa probe).
- **(d) F-153-T4-3 (không có cờ T5 cho boot #45):** T5-153
  đã đóng mà không viết POSTBOOT_PASS; gate0 đợt này dựa hoàn
  toàn vào T4-check-only (đúng quyết (j) nhưng là đường dự
  phòng). Parent/T5 phán: watcher sau reboot (kết luận (b)
  của T5-153 — cần cơ chế respawn tối thiểu, chưa code).
- **(e) F-148-T4-1 (cơ chế):** p1p3p7 vẫn chạy tay — có nên
  nối vào run-attempt không? Parent phán (hiện tại chạy tay
  vẫn xong đúng hạn, không gấp).
- **(f) Các nợ đứng khác giữ nguyên từ đợt 152 §8:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #74?/#75?/#76? giao T2; birefnet 0 thử;
  u2net là fallback chính thức.

## 9. XEM XÉT P3' — KẾT LUẬN (nhiệm vụ chính, hạn một đợt)

Quyết parent (d) đợt 152: mở xem xét P3' trong đúng đợt 153 này.
Đối tượng: 2 tick P3' không đạt trong các lượt hợp lệ gần đây —
cả hai đều là seq 365 ×2 trong attempt2 đợt 151 (stall_truoc=1),
làm P3' cộng dồn 24/24 → 32/34. Câu hỏi: đóng băng nhãn thật
hay artifact đo?

### 9.1 Kết luận: (b) — vấn đề thật với mô hình nhãn (cơ chế thứ hai), KHÔNG phải artifact đo

- **2 tick không đạt = MỘT event duy nhất** (seq 365, 2 ghost
  snapshot cùng tick), không phải 2 failure độc lập. Tính theo
  distinct-seq: P3' trước đợt 153 là 32/33 (không phải 32/34);
  sau đợt 153: **39/40 distinct-seq (97,5%)**.
- **stall_truoc=1 là ĐÚNG, không phải đo sai.** Quỹ đạo labelMs
  (ghostPix[0]) quanh event, trích từ JSON gốc đợt 151:
  57773 (đóng băng seq 355–361, ≥7 tick) → 58967 (362) →
  59354 (363) → 59412 (364) → 59482 (365). Nhãn đổi MỖI tick
  trong 4 tick trước (c2) — không có chuỗi đóng băng ≥2 tick
  nào kết thúc ngay trước seq 365 theo đúng định nghĩa DEF v0.5.
  Draw log độc lập xác nhận: frame 25@59309, 26@59362,
  28@59418, 30@59489, 33@59582, 36@59693 — mỗi frame vẽ đúng
  1 lần, không thiếu/không trùng.
- **(c2) tại 365 là mismatch pixel-nhãn THẬT, không phải phân
  loại sai.** Strip bytes của cả 2 ghost entry đều là strip
  frame 36 (M=[36] duy nhất, thresh ≤2 bit); presented=36;
  label 30/33; lag +6f/+3f; (c1) alias=0, (d) nomatch=0.
  Đối chiếu: tại 8 seq ĐẠT, M(g1)=[presented], M(g0)=[0],
  label=presented−1, stall 4–7 — mẫu "đóng băng rồi presented
  nhích +1f" sạch.
- **Bằng chứng then chốt — strip đóng băng byte-identical ở
  frame TƯƠNG LAI:** strip frame-36 (md5 `2842a43a`) giữ nguyên
  từng byte từ 362-g1 qua 367-g0 (6 tick) trong khi label đi
  26→33 và presented đi 28→39. Nội dung snapshot canvas đóng
  băng thật ở frame 36 — frame mà presented chỉ chạm tới ở tick
  365. Không phải nhiễu sampler (bytes giống hệt nhau qua 6
  tick không thể là nhiễu), không phải clock (tBlend đơn điệu
  59443→59720, currentTime trơn 0,8338→1,6333, không reboot),
  không phải lỗ draw-log (loop 16 đủ 64 entry quanh event;
  entry duy nhất của loop 15 là đuôi loop trước — frameIdx 68
  @57406 — không phải lỗ tại event).
- **Cơ chế (đã chứng minh bằng dữ kiện): "catch-up lag sau
  đóng băng".** Chuỗi sự kiện: (1) video stall thật qua loop
  wrap — currentTime đóng băng 0,8338 + presented đóng băng 25
  trong 8 tick (seq 354–361), tBlend nhảy +1759 ms tại
  353→354; (2) khi phát lại, presented chạy +1/+2/+2/+3/+3
  frame mỗi tick (361→365) trong khi chuỗi ghost snapshot nạp
  lại với pixels ĐI TRƯỚC label (strip đã là frame 36 từ tick
  362 trong khi label mới 26); (3) khi presented bắt kịp 36 ở
  tick 365, (c) nổ trên cả 2 entry của ring. Nhãn KHÔNG đóng
  băng tại lúc (c2) nổ — nó đang chạy nhưng tụt 3–6 frame sau
  presented.
- **Thống kê:** baseline P(stall≥2)=0,230 (đợt 151);
  P(X≥8 | n=10, p=0,230)=2,23e-04; theo distinct-seq
  P(X≥8 | n=9, p=0,230)=5,61e-05 — liên hệ đóng băng–(c2)
  vẫn rất mạnh; P3' nghiêm ngặt chỉ gãy đúng 1 event này.
  P3' là kiểm tra phụ (prereg DEF v0.5); các trụ chính P1
  (10/10, p=9,26e-11), P3-A1 (8/10, p=0,00022), P2 (10/10),
  P7 (đúng) của đợt 151 không bị ảnh hưởng — và đợt 153 này
  P3' 7/7 ĐẠT, mẫu 365 không tái diễn.

### 9.2 Điều này có nghĩa gì — và không có nghĩa gì

- **CÓ nghĩa:** mô hình "nhãn bị kẹt" cần thêm cơ chế thứ hai:
  sau một lần đóng băng dài + loop wrap, nhãn có thể tụt lại
  3–6 frame trong lúc bắt kịp (catch-up lag) và gây (c2) mà
  không cần đóng băng ngay trước đó. P3' dạng nghiêm ngặt
  ("mọi (c2) đều ở cuối chuỗi đóng băng ≥2 tick") đã bị bác
  bỏ ở dạng phổ quát — 39/41 occurrence, 39/40 distinct-seq.
- **KHÔNG có nghĩa:** mô hình đóng băng nhãn bị sai. Đóng băng
  ĐÃ xảy ra ngay trước event (57773 đóng băng ≥7 tick,
  seq 355–361) — event 365 là hệ quả xuôi của chính lần đóng
  băng đó (đóng băng kết thúc 4 tick trước khi (c2) nổ).
  Verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên; không
  có điều kiện mở lại nào xảy ra.
- **KHÔNG phải artifact:** đã loại trừ từng giả thuyết artifact
  bằng dữ kiện — sampler (bytes giống hệt, draw log đầy đủ),
  clock (đơn điệu, không nhảy), harness (không reboot, loop 16
  đầy), phân loại (c1=0, d=0, M duy nhất). Thứ duy nhất "sai"
  là giả định hẹp của tiêu chí P3', không phải dữ liệu.
- **Đếm:** P3' đếm theo occurrence nên 1 event đếm 2 lần.
  Từ nay nên báo thêm số theo distinct-seq (39/40) cạnh số
  occurrence (39/41) để parent thấy đúng mức độ.

### 9.3 Đề xuất cho parent (quyết là của parent)

- **(i) Đóng xem xét (T4 đề xuất):** chấp nhận P3' với 1 ngoại
  lệ có giải thích — ghi nhận cơ chế thứ hai "catch-up lag sau
  đóng băng" vào DEF/GAP, đếm P3' thêm cột distinct-seq từ
  đợt 154. Không cần điều tra thêm trừ khi mẫu 365-style tái
  diễn.
- **(ii) Giữ P3' mở:** tiếp tục theo dõi thêm vài lượt xem
  catch-up lag có tái diễn không rồi mới kết luận.
- **(iii) Sửa DEF:** P3'' — tính đóng băng trong cửa sổ 5 tick
  trước (c2) thay vì chuỗi kết thúc ngay trước seq (event 365
  có đóng băng kết thúc 4 tick trước → sẽ ĐẠT theo P3'').
  Cần parent chốt định nghĩa trước khi áp dụng hồi tố.
- T4 KHÔNG tự chọn — chờ quyết parent ở §8(b).

### 9.4 File điều tra (script, không gõ tay)

- `p3prime-investigate-151.py` / `p3prime-investigate-151b.py`:
  quỹ đạo labelMs seq 335–372, histogram stall, phân phối
  (presented − g0.frame), draw log quanh event.
- `p3prime-investigate-151a.txt` / `151b.txt` / `151c.txt`:
  output đầy đủ (strip-match M cho seq 361–366, hash pix
  361–367, đối chiếu 8 seq ĐẠT, kiểm định nhị thức).
- Nguồn: JSON gốc
  `hidden_files/round151-t4/preview-b-f3-flip-webkit-t4-attempt2-2e430750.json`
  + analyzer labellag/p1p3p7/stall đợt 151 + `preview.tsx`
  (định nghĩa labelMs/snapMs/rawMs, đợt 100 B2) — chỉ đọc,
  không sửa.

## A. Phụ lục số liệu (script appendix-153.py trích từ log gốc)

```
== PHU LUC A — so lieu trich tu log goc (script appendix-153.py) ==
-- attempt2 tickcost:
  tickCost total n=647 median=40.0 p90=66.0 max=97 min=27 | hau flip+2000ms n=463 median=40.0
-- attempt2 (c2) (tu labellag):
  (c2) dang ngo that, tat ca (seq, presented, label, lag): [(170, 14, 13, 1), (244, 15, 14, 1), (304, 25, 24, 1), (348, 13, 12, 1), (377, 22, 21, 1), (428, 27, 26, 1), (499, 21, 20, 1)]
-- attempt2 stall (P3'):
== P3' STALL-BASED (DEF v0.5) /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round153-t4/preview-b-f3-flip-webkit-t4-attempt2-401fca75.json
    tick hau-flip n=371; baseline P(stall>=2)=81/370 = 0.219
    seq 170: labelMs=29578 prev=29578 stall_truoc=7 -> P3' DAT
    seq 244: labelMs=40215 prev=40215 stall_truoc=5 -> P3' DAT
    seq 304: labelMs=48174 prev=47936 stall_truoc=3 -> P3' DAT
    seq 348: labelMs=54388 prev=54388 stall_truoc=5 -> P3' DAT
    seq 377: labelMs=57991 prev=57991 stall_truoc=5 -> P3' DAT
    seq 428: labelMs=65072 prev=65072 stall_truoc=6 -> P3' DAT
    seq 499: labelMs=76010 prev=76010 stall_truoc=3 -> P3' DAT
    P3' TONG: 7/7 seq stall>=2 — P3' DAT (moi seq deu o cuoi chuoi dong bang >=2 tick)
    (P3' la prereg DEF v0.5 cho 138+; P3 A1 nghiem ngat van giu va bao rieng.)
-- attempt2 coverage:
  TONG: (c2) trong cua so log: 7/7
-- attempt2 classb:
  LOP-B-TONG: DAT 5/5 (phan load/RAM/boot/apt; kiem ps tay o tren)
  sampler: n=100 load1_max=2.48 RAM_min=1597MB RAM_max=2697MB mau_RAM<500MB=0 mau_RAM<1024MB=0
-- attempt2 p1p3p7:
  P1 (unsigned): baseline 39/371 = 0.1051; (c2) gan run-end: 7/7 [170, 244, 304, 348, 377, 428, 499]; p = 1.41852e-07
  verdict P1: DUNG (luat DEF §3: >=2/3 VA p<0.01, n>=3)
  P3-A1: baseline dong bang 81/370 = 0.2189; (c2) dong bang-tai-tick: 6/7 [170, 244, 348, 377, 428, 499]; khong xac dinh: []; p = 0.000625956
  verdict P3-A1: DUNG (luat DEF §5)
  P7 (c2) drawSrc delta floor(ct*30)-frameIdx: {-1: 44, 0: 41} — tre >=+1f: 0 entry
  P7 (c2) rawUnit - drawSrc gan nhat: {0: 85}
  verdict P7: DUNG (lam yeu desync) (luat DEF §10; log thua ~100ms — chi lam yeu, khong bac tuyet doi)
-- attempt1 (wedged, khong tinh verdict):
  tickCost total n=495 median=41.0 p90=66.0 max=115 min=28 | hau flip+2000ms n=320 median=40.0
  (c2) dang ngo that, tat ca (seq, presented, label, lag): [(160, 13, 12, 1), (245, 15, 14, 1), (273, 17, 16, 1), (327, 16, 15, 1), (353, 15, 14, 1), (378, 15, 14, 1)]
  TONG: (c2) trong cua so log: 6/6
-- poll that (24 poll, tu poll-t4.log):
  n_poll=24 RAM min=1069 max=2745 >=1024: 24/24 <500: 0
  load1<2: 13/24 load5<2: 14/24 blockers>0: 11 poll
  dpkg dau=2 cuoi=1545
-- cong don (co so 20 luot: P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48; cong attempt2: P1 7/7, P2 7/7, P3-A1 6/7, P3' 7/7, P7 7/7):
  P1 69/69  P2 60/60  P3-A1 61/69  P3' 39/41  P7 55/55
-- chuoi median 21 luot (tu LIMITS 133-152 + luot nay 40.0):
  n=21 mean=49.0 min=39.0 max=60.0 vuot-60: 0
-- P3' kiem dinh nhi thuc (tu p3prime-investigate-151c.txt): P(X>=8|n=10,p=0.230)=2.232e-04; distinct-seq P(X>=8|n=9,p=0.230)=5.607e-05
```

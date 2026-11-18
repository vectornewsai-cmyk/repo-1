# PHASE9_ROUND131_T4_WEBKIT_QUIET9_LIMITS — WebKit lượt yên #9 (BẬT LOG DRAW lần đầu): ĐÓNG ở attempt1 — ngưỡng GIỮ

> Luồng T4, đợt 131, lượt cron 21:35 +07 17/11/2026 (bắt đầu ~14:41Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **Chạy 1 attempt duy nhất (attempt1): 20/20, exit 0 — LƯỢT YÊN #9
> ĐÓNG ngay attempt1, không cần a2/a3.**

## Kết quả chính

1. **Attempt1 (20/20, exit 0): tickCost total median 56,0 ms —
   LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ #9.** Gate A mở ngay poll 1;
   0 dòng [HB129] (lượt sạch, không stall); load1 max 3,08; RAM min
   1157 MB (0 mẫu <1024 MB); load5 cuối 1,33; không reboot trong
   cửa sổ đo; apt/dpkg 0; ps-before sạch hoàn toàn.
2. **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** — lần 9 đóng với median
   56,0 ms, biên còn 4,0 ms (mỏng nhất từ trước tới nay). 8 lượt yên
   xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
   **56,0** ms, trung bình 47,9 ms. Median 56,0 là CAO NHẤT trong
   8 lượt (vượt 54,0 của lượt #7).
3. **LOG DRAW BẬT LẦN ĐẦU — CÓ DỮ LIỆU (mục đích thứ hai của lượt
   #9, quyết parent §12.3(a)(b)): c2DrawLog n=103** (drawSrc 53 /
   rawUnit 50; loop 1: 53 / loop 2: 50 — đúng cửa sổ thiết kế: chỉ
   2 vòng loop sau wrap đầu tiên). frameIdx 0–67, ct 0–2,233 s,
   seeking False 103/103, readyState 4 103/103, srcKind
   'canvas 1280x720' 103/103, stage drawSrc='plain-native' /
   rawUnit='rawUnit', wallMs 10382→17223 (span 6841 ms), 1 wrap.
   Dữ liệu chuyển T5 phân tích đối chiếu histogram/log draw.
4. **(c2) +1f tái hiện 8 lần + 1 lần +3f (seq 421, 19/16) — tổng 9
   occurrence (skp=0), CAO NHẤT từ trước** (trước đó max 7, đợt
   130); lần đầu có (c2) +3f. skp=1: (c2)=0. Lag ≥+5f: 0.
   F6' ĐÓNG (nTick skp=1 = 61, (1) 100,0%, (2) 100,0%).
5. **Histogram #9 (phương pháp T3/T5, n=656 ghost, nomatch 0):
   bin 0 33,8%, +1/+2 43,1%, +3 13,0% — GIẢ THUYẾT THỨ TỰ THEO
   TICK KHÔNG XẾP ĐÚNG Ở LƯỢT #9** (xem §5): median 56,0 ms
   nhưng +1/+2 và +3 không tiếp nối sau lượt 54,0 ms (33,9% /
   18,3%) — chuỗi đơn điệu 7/7 thành 7/8. Dải dự báo prereg của
   T3 §4.3 chỉ tới median ~54 ms nên không có band prereg nào cho
   56 ms để "đúng/sai" trực tiếp; nhưng tuyên bố đơn điệu đã bị
   phá vỡ — chuyển T3 xem lại (xem §5.2).
6. **Không reboot trong cửa sổ đo.** Boot f868abad (btime
   14:26:41Z) sống suốt lượt; số boot #79? theo tên file T5
   (t5-postboot-b79-*) — TẠM, chờ T6 chốt mù #37. Boot trước
   (#78?) chết trong khung (14:15:34Z, 14:26:41Z] theo T7 đợt 131
   — T4 chỉ ghi nhận, không quan sát trực tiếp khung này.
   Reboot xảy ra SAU cửa sổ đo (xem §7.3) — không ảnh hưởng
   verdict.
7. Cờ mở leg T8 (`round131-t4-done`) đã touch 14:59Z — NHƯNG
   boot f868abad chết SAU đó trong khung (15:00:06Z, 15:01:30Z]
   (xem §7.3): cờ POSTBOOT_PASS 14:50:18Z đã STALE, T8 CHỈ chạy
   harness sau cờ POSTBOOT_PASS MỚI cho boot ad1327ef do T5 viết
   (T5 đã mở watcher b80 lúc 15:06Z). Cờ T4 đã sửa 15:08Z để ghi
   rõ điều này. Verdict lượt yên GIỮ NGUYÊN (xong trước reboot).

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round131-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (14:4xZ), đăng ký: gate 0 + lớp A + lớp B, ngưỡng
  ≤60 ms, protocol S5 tối đa 3 attempt, BẬT log draw trong lúc đo,
  touch cờ `round131-t4-done` ngay khi attempt xong, Xvfb unlink
  socket sau kill, KHÔNG đo lại RAM idle, KHÔNG đo TTS 39, KHÔNG
  thử birefnet, gate A không mở sau 60 phút thì dừng.
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu nhưng
  là marker MỞ ĐỢT 131 do parent tạo (14:35Z), KHÔNG phải đợt
  main-chat — T4 tiến hành bình thường (tiền lệ đợt 130).
- **Boot trong đợt: f868abad-66fb-46e7-bbaa-cd3ec0cddf34, btime
  2026-11-17 14:26:41Z** (uptime 14 phút lúc T4 bắt đầu 14:41Z).
  Boot mới sau reboot #78?→mới; số thứ tự chờ T6 chốt (T5 gọi
  là b79 trong tên file của mình — TẠM). Reboot xảy ra TRƯỚC lượt
  mở đợt 131 (không reboot giữa lượt lần này — lần đầu sau 2 đợt
  liên tiếp reboot giữa lượt, đợt 129 + 130).
  Một reboot KHÁC xảy ra SAU khi T4 xong (15:01:30Z, xem
  §7.3) — không ảnh hưởng verdict.
- **Replay boot mới: CHẠY ĐẦY ĐỦ** (T5 đợt 131): dpkg.log 2 dòng
  lúc 14:35:39Z → 1409 dòng lúc 14:48:26Z → **1509 dòng lúc
  14:50:27Z** (đúng baseline 1509 dòng / 217 installs như boot
  #78? đợt 130); §8.2(B) TRIGGER=NO (poll 4 của T5, 14:48:17Z);
  postboot-check PASS từ poll đầu. **KHÔNG cần --repair.**
- **Cây đo — KHÔNG ĐỔI trong cả đợt:** preview.tsx md5 `805409f0`
  (có instrumentation log draw (c2) của T5 đợt 130: 2 điểm log,
  cờ window.__vcutC2DrawLog mặc định TẮT), media.ts `2c384ed1`,
  vite.config.ts (apps/web) `ee80d093` — khớp lúc gate 0, gate A,
  probe-start, inner-end và kiểm cuối. Không sửa file production
  nào trong luồng này.
- **Probe MỚI + adapt bật log draw:** copy từ
  `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`, bản gốc md5
  `920a5122ca9573363eacf74b1b0d6625`; bản adapt trong round131-t4
  md5 **`4950f8773ce93743ca9ce22c2b55c27e`** (`node --check` OK).
  Adapt DUY NHẤT: thêm cờ `--c2-draw-log` (đặt
  `window.__vcutC2DrawLog = true` sau khi app boot, trước các
  pass; fetch `window.__vcutC2DrawLogEntries` tăng dần sau mỗi
  pass + ở y2Logs cuối lượt, cùng cơ chế giữ-bản-tốt-nhất như
  tickCost/blendTick). KHÔNG đổi logic đo nào khác. KHÔNG dùng
  probe cũ md5 `dccb8f4c…`.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS 100%.**
  `analyze-t4-{tickcost,wallbands,labellag,skiplatest,lag5}.py`
  trên JSON attempt3 đợt 130 tái tạo đúng median 40,0 / p90 66,0
  + wallbands phẳng + labellag (c2)=6 skp=0 (seq 161/263/315/341/
  441/484) + skiplatest F6' 100%/100% + lag5 0. Analyzer
  `analyze-t4-c2drawlog.py` MỚI chạy đúng trên JSON giả (n=4,
  byPoint/byLoop/wrap đúng) và trên JSON đợt 130 (n=0 — đúng vì
  đợt 130 không bật log draw).
- **Đính chính interface analyzer (phát hiện ở dry-run, sửa
  prereg §4 TRƯỚC khi đo):** tickcost/wallbands CHỈ nhận
  `tag=<path>` (gọi đường dẫn trần → ValueError) — bản copy đợt
  130 ĐÃ LÀ bản thống nhất interface của T3 đợt 130. Ghi chú
  trong LIMITS T4 đợt 130 §7.4 ("bản copy KHÔNG nhận tag=") chỉ
  đúng cho labellag; labellag/skiplatest/lag5/c2drawlog nhận
  đường dẫn trần. T4 đợt này gọi đúng ngay từ đầu.
- **Lock v2 md5 `cd0c05c1` — bản ĐÚNG.** Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG).
- **Vite lock v2-ONLY**, cổng T4 **5187**. T4 giữ lock 1 lần duy
  nhất cho attempt1, nhả sạch ngay sau probe (giữ 209 s, nhả
  14:55:53Z).
- **Các luồng đợt 131 khác:** lúc T4 bắt đầu (14:41Z) đã có
  round131-t1/t2/t3/t5/t6/t7/t8/t9/t10 (thư mục trống, vừa tạo);
  lúc gate 0 đạt (14:50Z) T7 đã .done (14:46:07Z); T5 .done sau
  khi viết cờ (14:50:18Z); T8 chỉ chờ cờ T4.

## 1. Gate 0 — ĐẠT ở poll #2 (14:50:27Z)

- **Poll #1 (14:48:26Z):** t5flag=chưa-có, t7flag=VANG-T7-DONE
  (`round131-t7.done` mtime 14:46:07Z ≥ boot), postboot_exit=0,
  apt_procs=1 (apt-get update đang chạy — replay chưa xong),
  dpkg_lines=1409, load1 1,79, RAM 1796 MB, preview_md5=`805409f0`.
- **Poll #2 (14:50:27Z): GATE 0 ĐẠT** — t5flag=PASS (cờ T5
  `round131-t5/POSTBOOT_PASS`: `boot_id=f868abad-66fb-46e7-bbaa-
  cd3ec0cddf34 btime=2026-11-17T14:26:41Z pass_at=2026-11-17T14:
  50:18Z poll=6` — KHỚP boot đang chạy) + t7flag=VANG-T7-DONE +
  check-only riêng PASS (exit 0) + apt_procs=0 + dpkg_lines=1509
  + load1=0,40 + RAMavail=1593 MB + preview_md5=`805409f0`.
  Tổng chờ gate 0: 14:48:26Z → 14:50:27Z = **2 phút** (nhanh nhất
  từ trước tới nay; đợt 130 chờ tới poll #12).
- run-t4.sh gate 0 try 1 PASS ở attempt1 (postboot 0, aptx 0,
  dpkgx 0).

## 2. Gate A — MỞ NGAY poll 1 (14:52:24Z)

- Cửa sổ duy nhất (14:52:24Z): poll 1 load1=0,74 load5=0,93
  lock=không blockers=0 RAMavail=1178 MB tree=YES:md5=`805409f0`
  — **CỬA YÊN MỞ NGAY**. Không phải chờ RAM như đợt 130 (34
  phút, 4 cửa sổ): RAM đã ở 1187 MB lúc bắt đầu attempt và
  balloon không kẹt lại trong đợt này (RAMavail 482 MB lúc
  14:44Z đã vọt lên 1772–1850 MB lúc 14:48Z rồi ổn định
  1157–1698 MB trong lúc đo).
- Tổng chờ gate A: **0 phút** (mở ngay poll 1).

## 3. Attempt1 — 20/20 pass, exit 0, median 56,0 ms — LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ #9 (14:52:24–14:55:49Z)

- **Probe:** 20/20 pass, exit 0. Gate A mở ngay poll 1.
  0 dòng [HB129] — lượt sạch, không lần chờ nào >5 s. Vite
  :5187 kill sạch (curl 000); lock v2 nhả sạch (giữ 209 s).
  **C2 draw log BẬT** (dòng log `C2 draw log BAT
  (window.__vcutC2DrawLog=true)` ngay sau `app boot OK`).
- **Số đo:** tickCost total n=557 median **56,0** / p90 81,0 /
  max 109 / min 28; hậu flip+2000ms n=412 median 56,0.
  tBlend gap n=439 median 97,0 / p90 136,2 / max 2594.
  BlendTick/pass=22,0; rAF/pass median 34 (min 27, max 40).
  webkit=27.2, pageErrs=[]. JSON hoàn chỉnh (y2Summary có,
  20 passes / 20 dbg, blendTick n=440, tickCost n=557, pump 0),
  2.832.517 B — giữ trên đĩa, KHÔNG đưa vào paths.
  Y2: pumpEvents 0, blendTicks 440, tickPresentedOffset {0: 440}
  (tất cả blend tick offset 0), ticksNoPump 440, tickCost 557.
- **Phân rã wallMs — dải 45–62k CAO NHẤT (61,0), dải đầu
  không cao:** 0–20k median 56,0 (n=78); 20–32k 57,0 (n=88);
  32–45k 48,0 (n=115); 45–62k **61,0** (n=125); 62–70k 57,5
  (n=62); 70–80k 55,0 (n=82). Khác đợt 130 a3 (phẳng 38–43 mọi
  dải) — lần này toàn lượt chậm hơn (mọi dải ≥48) và dải giữa
  45–62k chậm nhất. Quan sát này gắn với §5 (histogram không
  xếp theo median) — xem §5.2.
- **Lớp B: 5/5 ĐẠT** — B1 DAT (load5 cuối 1,33 ≤ 2,5);
  **B2 DAT** (load1 max 3,08 ≤4; 11 mẫu; ps-before trống hoàn
  toàn, ps-after chỉ vite của T4); B3 DAT (không reboot trong
  cửa sổ đo — boot f868abad, btime 14:26:41Z không đổi);
  B4 DAT (apt/dpkg 0); **B5 DAT** (RAM min 1157 MB, 0 mẫu
  <500 MB; 0/11 mẫu <1024 MB). Sampler 20 s, 11 mẫu: load
  0,74→3,08; RAM 1157–1698 MB.
- **(b)/(c2)/lag:** labellag skp=1: nTick=61, nOccurrence=122,
  (c)=0, **(c2)=0**; skp=0: nTick=267, nOccurrence=534, (c)=9,
  **(c2)=9 — seq 161 (15/14), 204 (16/15), 246 (16/15),
  267 (16/15), 288 (15/14), 375 (16/15), 397 (17/16),
  420 (16/15), 421 (19/16), 8 lần lag +1f + 1 lần lag +3f**
  (seq 421 là (c2) +3f ĐẦU TIÊN trong chuỗi lượt yên). (a)/(b)
  lag max 3f (skp=1) / −15f…4f (skp=0); phân phối (b) skp=1:
  <0: 3, 0: 98, 1–2: 15, 3–4: 6; skp=0: <0: 61, 0: 124, 1–2:
  268, 3–4: 81.
  Skiplatest: (1) 100,0% (61/61), (2) 100,0% (61/61) —
  **F6' ĐÓNG**.
- **Lag ≥+5f: 0 occurrence** (cả 2 skp). Event cũ đợt 126
  (seq 276–279, frame 27) KHÔNG tái hiện.
- **Chẩn đoán riêng của probe (measure mode, không assert —
  chỉ ghi nhận, không thuộc verdict lượt yên):** play
  all-frames nFrames=506, trailMax=7 (160 khung trail>0),
  edgeLMed 2,2 / edgeRMed 0,8, edgeRMax 241,2; gStd spread theo
  cửa sổ ĐÃ VẼ spreadMed 9,7 / max 62,2 (nGroups=59). Các số
  này là output chẩn đoán của probe (như mọi lượt), không khóa
  verdict lượt yên (verdict chỉ dựa tickCost median + lớp B).
- **Kết luận attempt1: LƯỢT YÊN HỢP LỆ — lần 9 ĐÓNG.**
  Median 56,0 ≤ 60 + lớp B 5/5 ĐẠT + 20/20 pass hoàn chỉnh.
  Dừng ở attempt1 (không chạy a2/a3 — verdict đã chốt).

## 4. Log draw (c2) — LẦN ĐẦU CÓ DỮ LIỆU THẬT

- **Bật cờ:** probe đặt `window.__vcutC2DrawLog = true` sau
  `app boot OK` (14:52Z), trước mọi pass. Cờ runtime, không
  sửa file production nào.
- **Thu thập:** partial JSON sau mỗi pass đều fetch OK
  (status `ok`): pass 1 n=53 → pass 2 n=103 → giữ nguyên
  n=103 tới pass 20 (đúng thiết kế: chỉ ghi 2 vòng loop sau
  wrap đầu tiên rồi tự dừng). Final y2Logs: n=103.
- **Tóm tắt (analyzer `analyze-t4-c2drawlog.py`):**
  n=103; byPoint drawSrc 53 / rawUnit 50; byLoop 1: 53 /
  2: 50; byStage drawSrc='plain-native' 53 / rawUnit='rawUnit'
  50; bySrcKind 'canvas 1280x720' 103/103; byReadyState 4
  103/103; bySeeking False 103/103; frameIdx min 0 / max 67 /
  distinct 32; ct min 0,000 / max 2,233 / null 0; wallMs min
  10382,0 / max 17223,0 / span 6841,0 ms; wraps (frameIdx giảm
  liên kề) = 1 (đúng wrap duy nhất giữa loop 1→2); drawSrc
  nonmono-lần-giảm = 1 (chính wrap đó).
- **Đọc 5 entry đầu:** toàn frameIdx 0, ct 0, wallMs 10382–
  10620 (loop 1, đầu pass 1 — chuỗi drawSrc/rawUnit xen kẽ
  theo từng frame vẽ). **5 entry cuối:** frameIdx 59/59/63/63/
  67, ct 1,967–2,233, wallMs 16938–17223 (loop 2, cuối pass 2).
  Không entry nào có seeking=true hay readyState≠4 — video
  đã sẵn sàng trong cả cửa sổ ghi.
- **Lưu ý cho T5:** final JSON không mang trường
  `c2DrawLogStatus` (chỉ partial JSON mới có — status `ok` ở
  mọi lần fetch); analyzer in status `?` cho final JSON là
  đúng (thiếu trường, không phải lỗi fetch). Số n=103 lấy từ
  mảng `y2.c2DrawLog` trong final JSON + dòng log probe
  `C2DrawLog cuoi luot: n=103` — hai nguồn khớp nhau.
- **Kết luận:** lượt #9 đã cung cấp dữ liệu log draw đầu
  tiên như quyết parent §12.3(a)(b) yêu cầu. Phân tích đối
  chiếu histogram/log draw là việc của T5 đợt 131 — T4 chỉ
  tóm tắt, không kết luận cơ chế.

## 5. Histogram #9 + kiểm chứng giả thuyết thứ tự theo tick

- **Phương pháp:** đúng phương pháp T3/T5 (histogram
  pixFrame−label trên ghost entry hậu flip+2000ms, viaRvfc=0;
  script `t4-histogram-with9.py` copy từ
  `t10-histogram-with8.py` của T10 đợt 130, chỉ chạy lượt #9).
- **Kết quả lượt #9 (n=656 ghost, nomatch 0):** hist chi tiết
  {-15: 2, -13: 2, -12: 6, -10: 4, -9: 4, -6: 2, -3: 2, -1: 42,
  **0: 222 (33,8%)**, +1: 118 (18,0%), +2: 165 (25,2%),
  **+1/+2: 283 (43,1%)**, **+3: 85 (13,0%)**, +4: 2 (0,3%),
  ≥3: 87 (13,3%), <0: 64 (9,8%)}; snapMs−labelMs median 44 ms
  (mean 48,8); rawMs−labelMs median 9 ms (mean 13,2 — khớp
  đính chính F-130-4: median 9 ms, không phải 10 ms);
  label−floor: {1: 447, 0: 209}; curPix run đồng cung ≥3 tick:
  21 run (dài nhất 7 tick, seq 129–135 và 239–245).
- **Bin 0 = 33,8% — DƯỚI dải 35,8–38,6% của 6 lượt trước**
  (và dưới 35,4% của lượt #8) nhưng vẫn là mode (bin đơn lớn
  nhất: +2 chỉ 25,2%). Mode 0 vẫn giữ.
- **§5.1 Đối chiếu với dải dự báo prereg T3 §4.3:** T3 đăng ký
  trước cho median ~44–48 ms → +3 ≈ 6–8%, +1/+2 ≈ 44–48%;
  median ~52–54 ms → +3 ≈ 13–18%; median ~40 ms → +3 ≈ 4%,
  +1/+2 ≈ 50–53%. **Không có band prereg nào cho median 56,0
  ms** (ngoài dải đã đăng ký) nên không thể nói "dự báo ĐÚNG/
  SAI" trực tiếp cho lượt #9 theo cùng nghĩa như lượt #8.
- **§5.2 Giả thuyết đơn điệu BỊ PHÁ VỠ ở lượt #9:** 7 lượt
  trước xếp thứ tự đơn điệu hoàn hảo theo median tickCost
  (+1/+2 giảm dần 52,7 → 52,4 → 47,3 → 43,5 → 39,5 → 36,6 →
  33,9 theo median 40,0 → 40,0 → 44,0 → 47,5 → 49,5 → 52,0 →
  54,0; +3 tăng dần 3,8 → 4,6 → 5,7 → 7,4 → 10,5 → 12,5 →
  18,3). Lượt #9 median 56,0 ms cho **+1/+2 = 43,1%** (CAO
  hơn 33,9% của lượt 54,0 ms — đáng lẽ phải THẤP hơn nếu đơn
  điệu giảm) và **+3 = 13,0%** (THẤP hơn 18,3% của lượt 54,0
  ms — đáng lẽ phải CAO hơn nếu đơn điệu tăng). Phân phối #9
  giống lượt ~48–52 ms hơn là lượt 56 ms. **Chuỗi đơn điệu
  7/7 thành 7/8.** Kết luận đứng: hình dạng phân phối KHÔNG
  chỉ do median tickCost quyết định (hoặc median 56,0 bị kéo
  bởi dải chậm cục bộ 45–62k median 61,0 trong khi phần lớn
  lượt chạy ở ~48–57 ms — xem §3). DEF v0.5 vẫn KHÔNG viết
  đợt này. Chuyển T3 xem lại giả thuyết (cần biến xếp khác
  hoặc tách warm-up/dải chậm khỏi median) + T5 đối chiếu log
  draw (dữ liệu mới của lượt này) trước khi kết luận gì thêm
  về cơ chế.
- **Pool 8 lượt hợp lệ (tính bằng cộng số học từ số đã công bố
  của T10 đợt 130 + lượt #9):** pool 7 lượt n=4892 (0: 37,3%,
  +1/+2: 44,2%, +3: 8,6%) + lượt #9 n=656 (0: 222, +1: 118,
  +2: 165, +3: 85) → **pool 8 lượt n=5548, 0: 2046 (36,9%),
  +1/+2: 2445 (44,1%), +3: 506 (9,1%)**. (T10 đợt 131 nên chạy
  lại histogram toàn bộ 8 lượt bằng cùng code để kiểm chứng
  độc lập số pool này, như đã làm cho lượt #8.)

## 6. Vì sao 1 attempt (không chạy a2/a3) + phân tích verdict ngưỡng

- Task đợt 131: "tối đa 3 attempt" — trần, không phải định mức.
  Attempt1 hoàn chỉnh 20/20 + lớp B 5/5 + median ≤60 → verdict
  chốt ngay, dừng (không chạy attempt 2/3 — không có lý do).
  Tiền lệ: đợt 129 cũng chỉ 1 attempt.
- **Lượt yên hợp lệ lần 9: median 56,0 ms ≤ 60 ms → GIỮ ngưỡng
  ≤60 ms.** 8 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / **56,0**; trung bình 47,9 ms. Median lần
  này CAO NHẤT (56,0) — biên còn 4,0 ms, mỏng nhất từ trước.
- **Không mở lại nợ ngưỡng, không nâng ngưỡng** — median ≤60.
  Nhưng biên 4,0 ms + histogram phá vỡ đơn điệu là 2 tín hiệu
  cần theo dõi ở lượt #10 (xem §9).

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 Cây không đổi trong lúc đo

- `preview.tsx` md5 `805409f0` không đổi: ghi lúc gate 0
  (14:50Z) = gate A = probe-start = inner-end = kiểm cuối
  (15:0xZ). `media.ts` md5 `2c384ed1` không đổi.
  `vite.config.ts` (apps/web) md5 `ee80d093` không đổi.
- **`tsc` / `vite build`: KHÔNG chạy** — không sửa cây (chỉ bật
  cờ runtime lúc đo), T5 đã verify tsc+build exit 0 sau
  instrumentation đợt 130 và cây md5 không đổi nên verify đó
  vẫn áp dụng (theo luật task: chỉ chạy khi cần kiểm cây).
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production.
- Postboot-check sau lượt: KHÔNG chạy lại — gate 0 try 1 của
  attempt1 đã PASS (exit 0) và không có thay đổi hạ tầng nào
  trong lúc đo.

### 7.2 Sự cố hạ tầng + vận hành trong lúc đo

1. **Xvfb :193 để lại socket sót sau attempt1** (SIGKILL không
   dọn socket — cùng mẫu đợt 130). T4 đã xóa tay sau attempt
   (kiểm `pgrep -f '^Xvfb'` = 0 process rồi `rm
   /tmp/.X11-unix/X193`); cuối đợt `/tmp/.X11-unix/` trống.
   Lưu ý: lần xóa đầu suýt bỏ qua vì `pgrep -f "Xvfb :193"`
   khớp cả dòng lệnh shell của chính T4 (self-match) — phải
   dùng `^Xvfb` mới đúng. Đề xuất vẫn đứng: probe nên unlink
   socket của mình sau kill.
2. **RAM host balloon KHÔNG kẹt đợt này** (§2): RAMavail 482 MB
   lúc 14:44Z → 1772–1850 MB lúc 14:48Z → 1157–1698 MB trong
   lúc đo. Gate A mở ngay poll 1 (khác hẳn đợt 130 chờ 34
   phút). Balloon co giãn theo host, ngoài tầm T4.
3. **Không kẹt rAF pass-timeout đợt này** (0 dòng HB129) —
   sau 2 lần kẹt/đợt ở đợt 130 (a1 pass 7, a2 pass 11). Lần
   sạch đầu tiên kể từ đợt 129 (a1 sạch). Nguyên nhân kẹt vẫn
   chưa chứng minh; HB129 đã sẵn sàng (không phải bắn đợt này).
4. **Lịch lệch T4-yên TRƯỚC, T8-harness SAU — CÓ REBOOT SAU
   LƯỢT ĐO:** T4 touch cờ `round131-t4-done` 14:59Z (sau khi a1
   xong + phân tích xong, trước LIMITS/batch). Lúc đó chưa có
   reboot (khác đợt 130, khi reboot giết boot giữa lượt) nên cờ
   ghi "T8 không cần chờ cờ POSTBOOT mới" — **câu này đã SAI sau
   reboot 15:01:30Z** (xem §7.3). Cờ đã sửa 15:08Z: T8 CHỈ chạy
   harness sau cờ POSTBOOT_PASS MỚI cho boot ad1327ef do T5
   viết. Bài học: cờ mở leg T8 viết trước reboot có thể lỗi
   thời trong vài phút — T8 phải tự kiểm boot_id trong cờ
   POSTBOOT_PASS khớp boot đang chạy trước khi chạy harness
   (luật STALE đứng).
5. **Reboot xảy ra TRƯỚC lượt mở đợt 131** (#78?→mới, khung
   (14:15:34Z, 14:26:41Z] theo T7 đợt 131) — lần đầu sau 2 đợt
   liên tiếp reboot GIỮA lượt, lần này reboot rơi trước lượt
   mở nên không ảnh hưởng lượt yên. T4 không tự kiểm khung này
   (không quan sát trực tiếp) — chỉ ghi nhận từ T7.
6. **Analyzer `tag=` quirk:** tickcost/wallbands CHỈ nhận
   `tag=path` (xem §0) — T4 gọi đúng từ đầu, không mắc lại
   quirk đợt 127/128/129. Ghi chú trong LIMITS đợt 130 §7.4
   về "bản copy KHÔNG nhận tag=" đã được đính chính ở đây
   (chỉ đúng cho labellag).

### 7.3 Reboot SAU lượt đo — lần thứ ba liên tiếp (nhưng lần này sau khi đo xong)

- **Diễn biến:** attempt1 probe exit 0 lúc 14:55:49Z
  (inner-end); lock nhả 14:55:53Z; phân tích xong + cờ
  `round131-t4.done` / `round131-t4-done` touch 14:59:51Z; sửa
  giờ trong cờ (sed) 15:00:06Z — tất cả trên boot f868abad.
  Sau đó VM reboot: **boot mới ad1327ef-e045-4d44-ae14-
  13c76bab50ec, btime 15:01:30Z** (số #80? theo tên file T5
  `t5-wait-replay-b80.*` — TẠM, chờ T6 chốt). T4 phát hiện lúc
  15:06:13Z (`uptime -s` 15:01:30Z, uptime 5 phút, dpkg.log về
  2 dòng, T5 đã mở watcher b80 lúc 15:06Z). Khung chết của
  f868abad: **(15:00:06Z, 15:01:30Z]** — hẹp 84 giây, một nguồn
  duy nhất (mtime cờ sau sed 15:00:06Z + btime boot mới
  15:01:30Z); không có bản ghi thứ hai mâu thuẫn lần này (khác
  khung #77 đợt 130). Vòng poll nền của T4 chết theo reboot
  (poll cuối 14:58:26Z) — không cần chạy lại.
- **Toàn bộ phép đo (probe 14:52:24–14:55:49Z) + phân tích +
  cờ xong hoàn tất trên f868abad, không reboot trong cửa sổ đo
  → B3 ĐẠT, lượt yên #9 GIỮ NGUYÊN** (tiền lệ đợt 129/130: T4
  xong trước reboot thì giữ). LIMITS này viết xong 15:05Z trên
  boot mới (file trên đĩa persistent, không mất) — nội dung đo
  không đổi, chỉ bổ sung §7.3 + sửa các câu về cờ T8 (Kết quả
  #7, §7.2 #4, §9 #7).
- **Hậu quả:** cờ POSTBOOT_PASS 14:50:18Z của f868abad STALE.
  T8 CHỈ chạy harness sau cờ POSTBOOT_PASS mới cho boot
  ad1327ef (T5 viết; watcher b80 đã chạy từ 15:06Z). T4 KHÔNG
  tự viết cờ POSTBOOT_PASS cho boot mới (không phải việc của T4;
  T5 là chủ POSTBOOT/REPAIR).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND131_T4_WEBKIT_QUIET9_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe adapt (md5
  `4950f877…`, thêm `--c2-draw-log`) là bản copy trong
  `hidden_files/round131-t4/`, ngoài repo — không stage.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round131-t4-quiet9.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round131-t4/`
  (prereg-t4.md [viết trước khi đo; §4 đính chính interface
  analyzer trước khi đo],
  probe121t3-ghost-k7.webkit.mjs [md5 `4950f877…`, probe MỚI +
  adapt `--c2-draw-log`],
  analyze-t4-{tickcost,wallbands,labellag,skiplatest,lag5}.py
  [bản copy đợt 130 — tickcost/wallbands chỉ nhận `tag=`],
  analyze-t4-c2drawlog.py [MỚI — tóm tắt log draw],
  t4-histogram-with9.py + t4-histogram-with9.txt [copy từ
  t10-histogram-with8.py đợt 130, chỉ chạy lượt #9],
  b.json, vite.t4-temp.config.mjs,
  vcut-vite-lock-v2.frozen.sh [md5 `cd0c05c1`],
  run-t4.sh + t4-attempt-inner.sh + check-classb-t4.sh +
  gate0-wait-t4-f868abad.sh + poll-t4.sh,
  gate0-wait-t4-f868abad.log + .nohup.log,
  poll-t4.log [gate0 2 poll + gateA 1 poll + poll nền],
  postboot-t4-f868abad-attempt1-gate0.log,
  run-t4-attempt1.nohup.log,
  chain-t4.log, ps-before/after-t4-attempt1.txt,
  load-mid-t4-attempt1.log,
  vite-5187-t4-attempt1.log,
  run-webkit-t4-attempt1.log [0 dòng HB129; dòng `C2 draw log
  BAT` + `C2DrawLog cuoi luot: n=103`],
  preview-b-f3-flip-webkit-t4-attempt1.json [20/20, 2.832.517 B
  — giữ trên đĩa, KHÔNG đưa vào paths],
  analyze-t4-attempt1-{tickcost,wallbands,labellag,
  skiplatest,lag5,c2drawlog}.txt, classb-t4-attempt1.txt,
  tree-md5.txt [`805409f0` — cây lúc đo]).
- Cờ xong: `hidden_files/round131-t4.done` (verdict 1 dòng,
  14:59Z + ghi chú reboot sau lượt đo, sửa 15:08Z). Cờ mở leg
  T8: `hidden_files/round131-t4-done` đã touch 14:59Z, sửa
  15:08Z sau reboot (ghi rõ: POSTBOOT_PASS cũ STALE, T8 chỉ
  chạy sau cờ POSTBOOT_PASS mới cho boot ad1327ef).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Nợ lượt yên theo dõi lần 9: ĐÃ ĐÓNG ở đợt 131** (median
   56,0 ms, lớp B 5/5, attempt1). Ngưỡng WebKit ≤60 ms GIỮ
   (8 lượt yên xác nhận, trung bình 47,9 ms). Lượt yên theo dõi
   TIẾP THEO là lần 10 — chạy lại theo lịch thường lệ ở đợt sau.
   **Cảnh báo:** biên chỉ còn 4,0 ms (mỏng nhất từ trước) —
   nếu lượt #10 vượt 60 ms thì cần xem lại ngưỡng/verdict theo
   luật đứng, không tự hạ ngưỡng.
2. **(c2) lệch nhãn +1f: tái hiện 9 lần đợt này** (8× +1f +
   1× +3f đầu tiên, tất cả skp=0) — chuyển T3 (xem lại giả
   thuyết thứ tự theo tick sau §5.2) + T5 (phân tích log draw
   n=103 của lượt này đối chiếu histogram — quyết parent
   §12.3(b)). **Event lag ≥+5f: 0 occurrence đợt này** — event
   seq 276–279 frame 27 giữ làm case theo dõi.
3. **Giả thuyết thứ tự theo tick: ĐƠN ĐIỆU BỊ PHÁ VỠ ở lượt
   #9** (§5.2) — chuỗi 7/7 thành 7/8; DEF v0.5 vẫn KHÔNG viết.
   T3 đợt sau xem lại (biến xếp khác / tách dải chậm khỏi
   median); T10 đợt sau chạy lại histogram toàn bộ 8 lượt bằng
   cùng code để kiểm chứng độc lập số pool §5 (n=5548).
4. **Kẹt rAF pass-timeout: 0 lần đợt này** (sau 2 lần/đợt ở
   đợt 130) — nguyên nhân vẫn chưa chứng minh; HB129 sẵn sàng.
5. **RAM host balloon: không kẹt đợt này** (gate A mở ngay) —
   theo dõi đợt sau; không hạ ngưỡng.
6. **Không reboot giữa lượt đợt này** (lần đầu sau 2 đợt liên
   tiếp) — boot f868abad sống suốt; số boot #79? TẠM, chờ T6
   chốt mù #37. Khung chết boot trước (14:15:34Z, 14:26:41Z]
   theo T7 — T4 chỉ ghi nhận. Reboot xảy ra SAU khi T4 xong (xem §7.3) —
   verdict giữ nguyên, chỉ cờ POSTBOOT_PASS cũ thành STALE.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 130 §11 + quyết parent
   §12.3:** mù #49 B mở + mù #50 mới mở (T2 đợt 131 — probe
   thường lệ); R9 (a) VẪN CHỜ user (nhắc lần 16); G1 khung (a)
   M2 VẪN HOÃN — chờ quyết G1 của user; birefnet 0 lần (RAM khả
   dụng vẫn dưới guard 6 GB); TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi.
   T8 đang chờ cờ T4 để chạy harness sau (cờ đã có 14:59Z,
   đã sửa 15:08Z sau reboot) — NHƯNG boot f868abad đã chết,
   POSTBOOT_PASS cũ STALE; T8 CHỈ chạy sau cờ POSTBOOT_PASS mới
   cho boot ad1327ef (T5 đang làm, watcher b80 từ 15:06Z).

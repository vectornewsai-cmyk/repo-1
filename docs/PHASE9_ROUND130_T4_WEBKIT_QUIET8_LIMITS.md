# PHASE9_ROUND130_T4_WEBKIT_QUIET8_LIMITS — WebKit lượt yên #8 (probe MỚI): CÓ LƯỢT YÊN HỢP LỆ — LẦN 8 ĐÓNG — ngưỡng GIỮ

> Luồng T4, đợt 130, lượt cron 18:35 +07 17/11/2026 (bắt đầu ~11:38Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **Chạy 3 attempt (tối đa 3): a1 + a2 dở dang pass-timeout (rAF kẹt),
> a3 20/20 hoàn chỉnh — LƯỢT YÊN #8 ĐÓNG ở attempt3.**

## Kết quả chính

1. **Attempt3 (20/20, exit 0): tickCost total median 40,0 ms —
   LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ #8.** load1 max 3,15; RAM min
   1722 MB (0 mẫu <1024 MB); load5 cuối 1,08; không reboot trong
   cửa sổ đo; apt/dpkg 0; ps-before/after sạch (chỉ vite của T4).
2. **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** — lần 8 đóng với median
   40,0 ms. 7 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 /
   54,0 / **40,0** ms, trung bình 46,7 ms.
3. **Probe MỚI (blendTick tăng dần + heartbeat [HB129]) dùng lần đầu
   cho lượt yên thật — và đã thử lửa thật ngay:** a1 kẹt pass 7,
   a2 kẹt pass 11; HB129 bắn 23 dòng (a1) + 33 dòng (a2), chỉ đúng
   pass kẹt + đã xong mấy pass; partial JSON giữ được blendTick
   (a1 n=159, a2 n=253) + tickCost (a1 n=193, a2 n=314) — đúng như
   T3 đợt 129 thiết kế. Trước đợt này, partial attempt3 đợt 128
   mất hoàn toàn blendTick; nay không còn "KHÔNG CÓ DỮ LIỆU".
4. **(c2) +1f: tái hiện 6 lần trên lượt yên hợp lệ a3** (skp=0;
   skp=1: 0) — seq 161 (14/13), 263 (19/18), 315 (14/13),
   341 (15/14), 441 (13/12), 484 (29/28); cộng 1 lần trên partial
   a2 (seq 149, 15/14, skp=0), 0 lần trên partial a1. Tổng đợt 130:
   7 occurrence, tất cả +1f, tất cả skp=0 — chuyển T3 (modal cần
   thêm lượt) + T5 (instrumentation log draw đã phê duyệt).
5. **Event lag ≥+5f: 0 occurrence** (cả 3 attempt, cả 2 skp).
6. **F6' ĐÓNG LẠI trên lượt đầy đủ a3** (nTick skp=1 = 56 ≥30,
   (1) 100,0%, (2) 100,0%). Trên 2 partial a1/a2, analyzer báo
   "CHƯA ĐỦ MẪU" (nTick 2 và 19) — đây là thiếu mẫu của lượt dở
   dang, KHÔNG phải mở lại F6'.
7. **Reboot GIỮA LUỘT lần thứ hai** (sau đợt 129): boot #77 chết
   trong khung (13:02:42Z, 13:04:14Z]; boot mới #78? btime
   13:02:41Z, boot_id `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`.
   Attempt3 HOÀN TẤT TRƯỚC reboot (probe exit 0 lúc 13:02:39Z,
   class B đánh giá xong 13:02:42Z, đọc boot lúc đánh giá vẫn là
   #77) nên lượt yên #8 GIỮ NGUYÊN — cùng tiền lệ đợt 129 (T4 xong
   trước reboot 31 giây thì giữ). Cờ POSTBOOT_PASS #77 STALE;
   T8 CHỈ được chạy harness sau cờ POSTBOOT_PASS mới cho #78.
8. Cờ mở leg T8 (`round130-t4-done`) đã touch 13:08:03Z — kèm cảnh
   báo reboot + yêu cầu T8 gate lại bằng POSTBOOT_PASS #78.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round130-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (11:4xZ), đăng ký: gate 0 + lớp A + lớp B gồm B5,
  ngưỡng ≤60 ms, B2 GIỮ NGUYÊN theo quyết parent đợt 129 §12.3(b),
  protocol S5 tối đa 3 attempt, touch cờ `round130-t4-done` ngay
  khi attempt xong, Xvfb unlink socket sau kill, KHÔNG đo lại RAM
  idle, KHÔNG đo TTS 39, KHÔNG thử birefnet, gate A không mở sau
  60 phút thì dừng (như đợt 127).
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu nhưng
  là marker MỞ ĐỢT 130 do parent tạo (11:35Z), KHÔNG phải đợt
  main-chat — T4 tiến hành bình thường (ghi rõ trong prereg).
- **Boot trong đợt: #77 rồi #78 (reboot sau attempt3, xem §6).**
  Boot #77 (`uptime -s` 2026-11-17 10:56:31Z, boot_id
  `86538084-410e-41d4-a4bf-e68574dc2d91`, số #77 theo T5 — tạm,
  chờ T6 đếm lại mù #37). Gap #76→#77 = 1h54m19s = **6859 s**
  (theo `round130-t5/t5-initial-state.md`). Reboot xảy ra trong
  khung (10:02:05Z, 10:56:31Z] — lần thứ 5 liên tiếp reboot giữa
  đợt đóng và lượt mở.
- **Replay boot #77: dạng (B) "chạm mà không cài"** (T5):
  configure 11:35:39Z rồi im, 2 dòng dpkg.log, 0 install;
  §8.2(B) trigger ~11:45:40Z; T5 `--repair` 1 lần có giám sát
  (apt-get chạy từ ~11:47Z); dpkg 2 → 759 dòng lúc 12:00:22Z;
  POSTBOOT_PASS #77 ghi 12:01:24Z (poll=24). So với #76 (109
  installs), lần này 759 dòng dpkg.log — T5 theo dõi số dòng.
- **Cây đo — ĐỔI GIỮA ĐỢT (đã phê duyệt, ghi rõ thứ tự):**
  baseline lúc T4 bắt đầu `03bf029f` / media.ts `2c384ed1`.
  T5 làm instrumentation log draw (c2) TRƯỚC khi viết cờ
  POSTBOOT_PASS (trái với dự kiến trong task là làm sau cờ):
  preview.tsx `03bf029f` → `f7e4a293` (trạng thái giữa lúc sửa,
  poll gate0 #2 11:40:20Z) → **`805409f0`** (ổn định từ mtime
  11:40:32Z; `round130-t5/instrumentation-done.txt` 11:41:28Z;
  `md5-after-instrumentation.txt` xác nhận; kiểm lại 11:42:20Z +
  11:44:56Z + 12:03:48Z + 13:0xZ đều khớp). media.ts KHÔNG đổi
  `2c384ed1`. T5 verify sau sửa: tsc exit 0 (24 s), vite build
  exit 0 (8,09 s). tree-md5.txt đã cập nhật `03bf029f` →
  `805409f0` lúc 11:45Z (ghi vào prereg §8) để gate 0 / gate A so
  đúng cây lúc attempt chạy. **Mọi attempt đều đo trên cây
  `805409f0`** (ghi ở gate0/gateA/kiểm cuối trong chain-t4.log).
  Instrumentation là chẩn đoán-only đã phê duyệt (quyết parent
  đợt 129 §12.3(a)), mặc định tắt, không đổi hành vi render.
- **Probe MỚI:** copy từ `benchmarks/render/
  probe121t3-ghost-k7.webkit.mjs`, md5 `920a5122ca9573363eacf74b1b0d6625`
  (verify sau copy; `node --check` OK; 4 dòng HB129;
  `lastBlendOk`/`blendTickStatus` có mặt). KHÔNG dùng probe cũ
  md5 `dccb8f4c…`.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS 100%.**
  `analyze-t4-{tickcost,wallbands}.py` trên JSON attempt1 đợt 129
  tái tạo đúng median 54,0 / p90 81,0 + wallbands đầy đủ.
  Quirk `tag=` (đợt 127/128/129): `labellag/skiplatest/lag5` chỉ
  nhận đường dẫn trần — đợt này T4 gọi đúng ngay từ đầu (bare
  path), không mắc lại quirk. T3 đợt 130 thống nhất interface
  analyzer (tag=path) — việc của T3, T4 không sửa giữa đợt.
- **Lock v2 md5 `cd0c05c1` — bản ĐÚNG.** Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG).
- **Vite lock v2-ONLY**, cổng T4 **5187**. T4 giữ lock 1 lần mỗi
  attempt, nhả sạch ngay sau probe (a3: giữ 203 s, nhả 13:02:42Z).
- **Các luồng đợt 130 khác:** lúc T4 bắt đầu (11:38Z) đã có
  round130-t2/t5/t6/t8/t9; lúc gate 0 đạt (12:00Z) T1/T2/T3/T6/
  T7/T9 đã .done; T5 .done sau khi viết cờ (12:01Z); T8 chỉ chờ
  cờ T4 (wait-t4-130t8.sh từ 11:38Z).

## 1. Gate 0 — ĐẠT ở poll #12 (12:00:22Z)

- **Poll #1–#4 (11:38–11:44Z):** t5flag=chưa-có, postboot_exit=1
  (thiếu libevent/libEGL/libavif/libdw/libevdev + GST isomp4/
  libav + 11 gói apt), dpkg_lines=2, load1 3,10→1,17, RAM
  966→3317 MB, preview_md5 đổi `03bf029f` → `f7e4a293` →
  `805409f0` (T5 đang sửa instrumentation — xem §0).
- **Poll #5–#11 (11:46–11:58Z):** t7flag=VANG-T7-DONE
  (`round130-t7.done` mtime 11:39:19Z ≥ boot); apt-get của T5
  repair chạy từ ~11:47Z (aptx=1); dpkg vẫn 2 dòng tới 11:58Z;
  RAM rơi 626 MB (11:58Z).
- **Poll #12 (12:00:22Z): GATE 0 ĐẠT** — t7flag=VANG-T7-DONE +
  check-only riêng PASS (exit 0) + apt_procs=0 + dpkg_lines=759
  + load1=0,42 + RAMavail=520 MB + preview_md5=`805409f0`.
  Lúc poll #12, cờ T5 vẫn "chưa-có"; T5 ghi POSTBOOT_PASS
  62 giây sau (12:01:24Z, poll=24) — T4 đã verify trực tiếp
  sau đó (12:03:48Z): boot_id `86538084…` KHỚP, btime
  10:56:31Z KHỚP, pass_at 12:01:24Z. Gate 0 hợp lệ cả hai
  đường (VANG-T7-DONE + check-only, rồi cờ T5 khớp).
- run-t4.sh gate 0 try 1 PASS ở mọi attempt (postboot 0, aptx 0,
  dpkgx 0).

## 2. Gate A — KHÔNG MỞ 3 cửa sổ đầu (RAM host kẹt ~500 MB), MỞ ở cửa sổ 4

### 2.1 RAM host kẹt — nguyên nhân ngoài tầm T4

- Sau khi apt repair xong (~12:00Z), RAMavail kẹt **~500 MB
  suốt 12:00–12:43Z** (466→520→497→500 MB, rồi dao động
  482–676 MB qua 3 cửa sổ gate A), dù load1 ~0,0–0,1 và KHÔNG
  process nào chạy nặng. `ps aux --sort=-rss`: process lớn nhất
  là hatch daemon 290 MB; tổng RSS các process chỉ ~350 MB.
  `/proc/meminfo`: AnonPages 419 MB, Cached 493 MB, Slab 384 MB
  — cộng lại chỉ ~1,3 GB trên tổng 7,9 GB; **~6,5 GB không nằm
  trong bất kỳ trường meminfo nào**. Driver `virtio_balloon` +
  `virtio_mem` đều có mặt → host đang giữ RAM bằng balloon
  (ngoài tầm can thiệp của T4). RAM từng vọt lên 1377 MB
  (11:52Z) và 926 MB (12:10:33Z) rồi rơi lại — balloon co giãn
  theo host.
- **KHÔNG hạ ngưỡng RAM, KHÔNG đo "cho có"** — T4 chờ đúng
  prereg: gate A yêu cầu RAMavail ≥1024 MB.

### 2.2 4 cửa sổ gate A (run-t4.sh attempt1, tag trùng — xem chú thích)

- Cửa sổ 1 (12:09:33–12:18:34Z, 10 poll): RAM 527→926→778→
  673→558→525→548→520→526→533 MB — KHÔNG MỞ (exit 5).
- Cửa sổ 2 (12:20:20–12:29:20Z, 10 poll): RAM 482→508→504→
  496→494→500→575→676→558→534 MB — KHÔNG MỞ (exit 5).
- Cửa sổ 3 (12:30:46–12:39:47Z, 10 poll): RAM 507→441→536→
  517→503→591→580→580→558→532 MB (thấp nhất đợt: 441 MB lúc
  12:31:46Z) — KHÔNG MỞ (exit 5).
- Cửa sổ 4 (12:42:31Z): poll 1 RAM 838 MB; **poll 2
  12:43:32Z: load1=0,59 load5=0,36 lock=không blockers=0
  RAMavail=1540 MB tree=YES:md5=`805409f0` — CỬA YÊN MỞ.**
  Tổng chờ gate A: 12:09:33Z → 12:43:32Z = **34 phút, trong
  ngân sách 60 phút của prereg.**
- Chú thích file: cả 4 lần chạy đều là `run-t4.sh attempt1`
  (cùng tag), chain-t4.log append đủ 4 lần; chỉ lần 4 tới được
  probe-start. Các file `*-attempt1.*` (JSON, log probe,
  load-mid, ps-before/after, classb) thuộc lần 4.

## 3. Attempt1 — 6/20 pass, exit 3, pass-timeout ở pass 7 (12:43:32–12:47:09Z)

- **Probe:** 6/20 pass rồi kẹt. Pass 1–6 bình thường (~3,0–
  3,3 s/pass, 35–40 khung rAF/pass). FLIP rVFC tắt sau pass 5
  (wallMs=25694). Pass 7: rAF kẹt 120 s (timeout).
- **Heartbeat [HB129] thử lửa thật LẦN ĐẦU:** 23 dòng
  `play pass 7/20 elapsed=5s…115s passesDone=6 timeoutMs=120000`
  (12:44:13–12:46:03Z) — chỉ đúng pass kẹt + đã xong mấy pass;
  sau đó 5 dòng `pwEvalTimeout writePartial-tickCost` (5–25 s)
  + 5 dòng `pwEvalTimeout writePartial-blendTick` (5–25 s) khi
  2 lần fetch cuối lượt treo 30 s. Tổng 33 dòng [HB129] trong
  log a1. Không dòng HB129 nào trên đường thường (pass 1–6
  <5 s) — đúng thiết kế.
- **Partial JSON (probe MỚI):** `partial=true,
  partialReason="pass-timeout", passesDone=6/20`, tickCost
  n=193 (status=`timeout` ở lần fetch cuối — giữ bản tốt nhất),
  blendTick n=159 (status=`timeout`, giữ bản tốt nhất),
  `blendTickStatus`/`blendTickNote` có mặt. File
  `preview-b-f3-flip-webkit-t4-attempt1.json` (944.914 B).
  So với attempt3 đợt 128 (partial mất blendTick hoàn toàn):
  **nợ blendTick tăng dần ĐÃ ĐÓNG về mặt dữ liệu thật.**
- **Phân tích partial (n nhỏ — chỉ 6 pass, dưới ngưỡng 10 pass
  để báo cáo median DỞ DANG đầy đủ):** tickCost n=193 median
  41,0 / p90 63,8 / max 97 / min 29; hậu flip+2000ms n=13
  median 41,0; tBlend gap n=158 median 83,5; BlendTick/pass=
  26,5; rAF/pass median 37. Labellag: skp=1 nTick=2, skp=0
  nTick=11 — **(c2)=0 cả 2 skp**. Lag ≥+5f: 0. F6':
  nTick skp=1 = 2 (<30) → "CHƯA ĐỦ MẪU" (không kết luận).
- **Lớp B (cửa sổ 6 pass): 5/5 ĐẠT** — load1 max 1,53 (11 mẫu);
  RAM min 944 MB (0 mẫu <500 MB; 5/11 mẫu <1024 MB — cảnh báo,
  không vi phạm); load5 cuối 0,44; không reboot; apt 0;
  ps-before/after sạch (chỉ vite của T4).
- Xvfb :193 để lại socket sót — T4 xóa tay sau attempt
  (xem §7.3).

## 4. Attempt2 — 10/20 pass, exit 3, pass-timeout ở pass 11 (12:52:02–12:55:51Z)

- **Probe:** 10/20 pass rồi kẹt. Pass 1–10 bình thường.
  FLIP sau pass 5 (wallMs=25281). Pass 11: rAF kẹt 120 s.
  HB129: 33 dòng (pass 11 + 2 lần fetch writePartial).
- **Partial JSON:** `partial=true, passesDone=10/20`,
  tickCost n=314 (timeout ở fetch cuối, giữ bản tốt),
  blendTick n=253 (timeout, giữ bản tốt). File
  `preview-b-f3-flip-webkit-t4-attempt2.json`.
- **Phân tích partial (10 pass — ĐỦ ngưỡng 10 để báo cáo median
  DỞ DANG + (b)/(c2)/lag tới pass cuối):** tickCost n=314
  median **42,0 (DỞ DANG)** / p90 64,0 / max 92 / min 28; hậu
  flip+2000ms n=145 median 40,0; tBlend gap n=252 median 80,0;
  BlendTick/pass=25,3; rAF/pass median 37. Wallbands: 0–20k
  median 47,0 (n=98); 20–32k 40,5 (n=118); 32–45k 39,5 (n=98)
  — dải đầu cao hơn, cùng quan sát đợt 129 (63,0).
  Labellag: skp=1 nTick=19 **(c2)=0**; skp=0 nTick=100
  **(c2)=1 — seq 149, presented 15, label 14, lag +1f**
  (tái hiện (c2) trên partial). Lag ≥+5f: 0. F6': nTick skp=1
  = 19 (<30) → "CHƯA ĐỦ MẪU" (không kết luận).
- **Lớp B (cửa sổ 10 pass): 5/5 ĐẠT** — load1 max 1,46
  (12 mẫu); RAM min 1431 MB (0 mẫu <1024 MB); load5 cuối 0,44;
  không reboot; apt 0; ps-before/after sạch.
- Xvfb :193 để lại socket sót — T4 xóa tay sau attempt.

## 5. Attempt3 — 20/20 pass, exit 0, median 40,0 ms — LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ #8 (12:59:19–13:02:39Z)

- **Probe:** 20/20 pass, exit 0. Gate A mở ngay poll 1
  (RAM 2521 MB lúc bắt đầu). 0 dòng [HB129] — lượt sạch,
  không lần chờ nào >5 s. Vite :5187 kill sạch (curl 000);
  lock v2 nhả sạch (giữ 203 s).
- **Số đo:** tickCost total n=630 median **40,0** / p90 66,0 /
  max 103 / min 28; hậu flip+2000ms n=451 median 40,0.
  tBlend gap n=501 median 80,0 / p90 105,0 / max 2365.
  BlendTick/pass=25,1; rAF/pass median 38 (min 34, max 48).
  webkit=27.2, pageErrs=[]. JSON hoàn chỉnh (y2Summary có,
  20 passes / 20 dbg, blendTick n=502, tickCost n=630, pump 0),
  3.270.737 B — giữ trên đĩa, KHÔNG đưa vào paths.
- **Phân rã wallMs — PHẲNG, không còn dải đầu cao:** 0–20k
  median 41,0 (n=110); 20–32k 43,0 (n=117); 32–45k 39,0
  (n=125); 45–62k 40,0 (n=165); 62–70k 38,0 (n=69); 70–80k
  40,5 (n=44). Khác đợt 129 (dải đầu 63,0) và partial a2
  (47,0) — lần này dải đầu không cao; quan sát dải đầu cao
  có thể chỉ là nhiễu theo lượt, không phải quy luật.
- **Lớp B: 5/5 ĐẠT** — B1 DAT (load5 cuối 1,08 ≤ 2,5);
  **B2 DAT** (load1 max 3,15 — cao hơn a1/a2 nhưng ≤4; 10/10
  mẫu; ps-before trống hoàn toàn, ps-after chỉ vite của T4 +
  esbuild service); B3 DAT (không reboot trong cửa sổ đo —
  xem §6 về reboot NGAY SAU lượt); B4 DAT (apt/dpkg 0);
  **B5 DAT** (RAM min 1722 MB, 0 mẫu <500 MB; 0/10 mẫu
  <1024 MB). Sampler 20 s, 10 mẫu: load 1,02→3,15→0,66;
  RAM 1722–2479 MB.
- **(b)/(c2)/lag:** labellag skp=1: nTick=56, nOccurrence=112,
  (c)=0, **(c2)=0**; skp=0: nTick=303, nOccurrence=606, (c)=6,
  **(c2)=6 — seq 161 (14/13), 263 (19/18), 315 (14/13),
  341 (15/14), 441 (13/12), 484 (29/28), tất cả lag +1f**,
  cùng chữ ký cũ (label kém presented đúng 1f). (a)/(b) lag
  max 3f (skp=1) / −10f…3f (skp=0); phân phối (b) skp=1:
  <0: 5, 0: 80, 1–2: 21, 3–4: 6.
  Skiplatest: (1) 100,0% (56/56), (2) 100,0% (56/56) —
  **F6' ĐÓNG** (không đóng lại từ partial, đóng trên lượt đầy
  đủ này).
- **Lag ≥+5f: 0 occurrence** (cả 2 skp). Event cũ đợt 126
  (seq 276–279, frame 27) KHÔNG tái hiện.
- **Kết luận attempt3: LƯỢT YÊN HỢP LỆ — lần 8 ĐÓNG.**
  Median 40,0 ≤ 60 + lớp B 5/5 ĐẠT + 20/20 pass hoàn chỉnh.

## 6. Reboot GIỮA LUỘT lần thứ hai (sau attempt3) — lượt yên GIỮ NGUYÊN

- **Diễn biến:** attempt3 probe exit 0 lúc 13:02:39Z (inner-end);
  vite kill + lock nhả + check-classb xong 13:02:42Z (đọc boot
  lúc đánh giá vẫn là #77, btime 10:56:31Z). Sau đó VM reboot:
  **boot mới #78? btime 13:02:41Z, boot_id
  `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`** (số #78 tạm — chờ
  T6 đếm lại mù #37). T4 phát hiện lúc 13:04:14Z (`uptime -s`
  13:02:41Z, uptime 1 phút, dpkg.log về 2 dòng, apt-get update
  của replay đang chạy 13:03Z). Khung chết của #77:
  (13:02:42Z, 13:04:14Z].
- **Lệch 1 giây cần ghi rõ (trung thực):** dòng class-B ghi
  13:02:42Z trong khi btime #78 là 13:02:41Z — 1 giây chồng
  lấn, trong sai số làm tròn giây của `date`/`uptime -s` và
  độ trễ khởi động kernel. Bằng chứng quyết định: (a) probe
  inner-end 13:02:39Z với probe_exit=0; (b) check-classb đọc
  `uptime -s` lúc đánh giá vẫn là 10:56:31Z (#77); (c) lock v2
  đã nhả + class-B 5/5 đã ghi vào chain-t4.log — cả ba chỉ có
  thể do process của boot #77 viết trước khi chết. **Toàn bộ
  phép đo (probe 12:59:19–13:02:39Z) hoàn tất trên #77, không
  reboot trong cửa sổ đo → B3 ĐẠT, lượt yên #8 GIỮ NGUYÊN**
  (tiền lệ đợt 129: T4 xong trước reboot thì giữ).
- **Hậu quả:** cờ POSTBOOT_PASS #77 STALE. Postboot-check
  check-only trên #78 lúc 13:0xZ: exit 1 (thiếu libs + GST +
  11 gói apt, dpkg=2 — replay mới bắt đầu). **T8 CHỈ được chạy
  harness sau cờ POSTBOOT_PASS mới cho #78** (T5 viết lại) —
  ghi rõ trong cờ `round130-t4-done` (touch 13:08:03Z) để T8
  không chạy WebKit trên boot chưa sẵn sàng. T5 đợt 130 phải
  làm lại hạ tầng boot #78 (cờ + replay + instrumentation?
  — instrumentation đã nằm trong cây `805409f0` trên đĩa, không
  mất theo reboot; chỉ cờ POSTBOOT_PASS là stale).
- T4 KHÔNG tự viết cờ POSTBOOT_PASS cho #78 (không phải việc
  của T4; T5 là chủ POSTBOOT/REPAIR).

## 7. Vì sao 3 attempt (không dừng ở a1/a2) + phân tích verdict ngưỡng

- Task đợt 130: "tối đa 3 attempt" — trần, không phải định mức.
  a1 (6/20) và a2 (10/20) đều dở dang pass-timeout → KHÔNG phải
  lượt yên hợp lệ, không chốt được verdict → chạy tiếp trong
  ngân sách 3 attempt. a3 hoàn chỉnh + lớp B 5/5 + median ≤60
  → verdict chốt, dừng (không chạy attempt 4 — không có).
- **Lượt yên hợp lệ lần 8: median 40,0 ms ≤ 60 ms → GIỮ ngưỡng
  ≤60 ms.** 7 lượt yên xác nhận: S5 49,5 / T4-118 40,0 / T3-121
  52,0 / T9-125 47,5 / T9-126 44,0 / T4-129 54,0 / **T4-130
  40,0**; trung bình 46,7 ms. Median lần này thấp nhất cùng
  với T4-118 (40,0) — biên dưới ngưỡng 20,0 ms.
- **Không mở lại nợ ngưỡng, không nâng ngưỡng** — median ≤60.
- **(c2) cho T3/T5:** đợt này 7 occurrence +1f (6 trên lượt
  hợp lệ a3 + 1 trên partial a2), tất cả skp=0, tất cả lag +1f,
  label kém presented đúng 1f. Modal +1f tiếp tục tái hiện
  (đợt 129: 2 lần; đợt 130: 7 lần) — dữ liệu cho T3 phân tích
  modal qua các lượt + T5 instrumentation log draw (đã chạy
  trên cây `805409f0` trong lượt này nhưng mặc định tắt — không
  có log draw nào được bật trong lúc đo; chẩn đoán (c2) vẫn
  dựa trên dữ liệu blendTick như trước).

## 8. Kiểm chứng hồi quy + hạ tầng

### 8.1 Cây không đổi trong lúc đo (sau instrumentation)

- `preview.tsx` md5 `805409f0` không đổi: ghi lúc gate 0
  (12:00Z) = mọi poll gate A = probe-start a1/a2/a3 = kiểm cuối
  trên boot #78 (13:0xZ). `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy trên boot #78 sau reboot,
  log `tsc-after.log`). `vite build`: KHÔNG chạy lại — T5 đã
  chạy sau instrumentation (exit 0, 8,09s) và cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production (chỉ T5 sửa instrumentation, đã verify tsc+build).
- Postboot-check sau lượt: KHÔNG chạy được trên #77 (boot đã
  chết); trên #78 exit 1 do replay mới bắt đầu (xem §6) —
  không phải lỗi của lượt đo.

### 8.2 Sự cố hạ tầng + vận hành trong lúc đo

1. **Xvfb :193 để lại socket sót sau a1 và a2** (SIGKILL không
   dọn socket). T4 đã xóa tay sau mỗi attempt; sau a3, reboot
   xóa /tmp (tmpfs) nên cuối đợt `/tmp/.X11-unix/` trống
   (0 socket, 0 Xvfb process lúc 13:07Z). Đề xuất vẫn đứng:
   probe nên unlink socket của mình sau kill.
2. **RAM host kẹt ~500 MB do balloon (xem §2.1)** — gate A
   không mở 30 phút đầu; mở ở cửa sổ 4 sau 34 phút. Đây là
   lần đầu gate A phải chờ 4 cửa sổ; các đợt trước mở ngay
   poll 1. Ghi nhận để T10/parent biết: nếu balloon còn giữ
   RAM ở đợt sau, lượt yên có thể lại phải chờ dài — không
   hạ ngưỡng để "cho qua".
3. **Hai lần pass-timeout liên tiếp (a1 pass 7, a2 pass 11)**
   rồi a3 sạch — cùng failure mode rAF kẹt như attempt3 đợt
   128 (kẹt pass 17). Nguyên nhân kẹt vẫn chưa chứng minh
   (giống hb128); điểm mới: HB129 nay chỉ đúng pass kẹt +
   đã xong mấy pass (a1: pass 7/20, 6 xong; a2: pass 11/20,
   10 xong), và partial giữ được blendTick/tickCost — lần
   kẹt sau có dữ liệu đầy đủ hơn để chẩn đoán.
4. **Analyzer `tag=` quirk KHÔNG tái hiện đợt này** (T4 gọi
   đúng từ đầu: `tag=` cho tickcost/wallbands, đường dẫn trần
   cho labellag/skiplatest/lag5). T3 đợt 130 thống nhất
   interface — việc của T3.
5. **Lịch lệch T4-yên TRƯỚC, T8-harness SAU:** T4 touch cờ
   `round130-t4-done` 13:08:03Z (sau khi a3 xong + phân tích
   xong, trước LIMITS/batch) — nhưng kèm cảnh báo reboot:
   T8 phải gate lại bằng POSTBOOT_PASS #78 mới. Nếu T8 chờ
   cờ mới của T5 thì harness sẽ chạy muộn hơn mọi đợt — T10
   đóng sổ cần tính tới (hạn đóng đợt 14:35Z).
6. **Runtime restart giữa lúc T4 poll:** phiên exec
   sleep-360 của T4 bị gián đoạn bởi runtime restart lúc
   ~13:03Z (đúng lúc VM reboot); T4 khôi phục bằng cách kiểm
   lại chain-t4.log + JSON trên đĩa — không mất dữ liệu, không
   chạy lại attempt nào (a3 đã xong trước reboot).

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND130_T4_WEBKIT_QUIET8_LIMITS.md` — file này.
- **KHÔNG đổi file production nào** (instrumentation là của T5,
  đã stage trong batch T5 — T4 không stage lại). Probe MỚI
  không đổi trong luồng này (T3 đợt 129 đã stage) nên KHÔNG
  stage lại.
- Script `gate0-wait-t4-86538084.sh` (adapt từ đợt 129),
  `run-t4.sh` / `t4-attempt-inner.sh` / `check-classb-t4.sh` /
  `poll-t4.sh` (adapt round130 + boot #77) + `prereg-t4.md` +
  probe copy (md5 `920a5122…`) + analyzers — bản copy trong
  `hidden_files/round130-t4/`, ngoài repo — không stage.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round130-t4-quiet8.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round130-t4/`
  (prereg-t4.md [viết trước khi đo; §8 đính chính cây],
  probe121t3-ghost-k7.webkit.mjs [md5 `920a5122…`, probe MỚI],
  analyze-t4-{tickcost,wallbands,labellag,skiplatest,lag5}.py,
  b.json, vite.t4-temp.config.mjs,
  vcut-vite-lock-v2.frozen.sh [md5 `cd0c05c1`],
  run-t4.sh + t4-attempt-inner.sh + check-classb-t4.sh +
  gate0-wait-t4-86538084.sh + poll-t4.sh,
  gate0-wait-t4-86538084.log + .nohup.log,
  poll-t4.log [gate0 12 poll + gateA 34 poll (32 cho attempt1 qua
  4 cửa sổ + 1 cho a2 + 1 cho a3, cả hai mở ngay poll 1)],
  postboot-t4-86538084-gate0wait-*.log [gate 0 #77] +
  postboot-t4-86538084-attempt*-gate0.log +
  postboot-t4-86538084-after.log [trên #78: exit 1, replay mới],
  run-t4-attempt{1,2,3}.nohup.log + retry2/3/4,
  chain-t4.log, ps-before/after-t4-attempt{1,2,3}.txt,
  load-mid-t4-attempt{1,2,3}.log,
  vite-5187-t4-attempt{1,2,3}.log,
  run-webkit-t4-attempt{1,2,3}.log,
  preview-b-f3-flip-webkit-t4-attempt{1,2,3}.json [a1: 6/20
  944.914 B; a2: 10/20; a3: 20/20 3.270.737 B — giữ trên đĩa,
  KHÔNG đưa vào paths],
  analyze-t4-attempt{1,2,3}-{tickcost,wallbands,labellag,
  skiplatest,lag5}.txt, classb-t4-attempt{1,2,3}.txt,
  tsc-after.log [tsc exit 0 trên #78],
  tree-md5.txt [`805409f0` — cây lúc đo]).
- Cờ xong: `hidden_files/round130-t4.done` (kèm verdict 1 dòng).
  Cờ mở leg T8: `hidden_files/round130-t4-done` đã touch
  13:08:03Z (kèm cảnh báo reboot + yêu cầu POSTBOOT_PASS #78).

## 10. Nợ mở + đề xuất cho đợt sau

1. **Nợ lượt yên theo dõi lần 8: ĐÃ ĐÓNG ở đợt 130** (median
   40,0 ms, lớp B 5/5, attempt3). Ngưỡng WebKit ≤60 ms GIỮ
   (7 lượt yên xác nhận, trung bình 46,7 ms). Lượt yên theo dõi
   TIẾP THEO là lần 9 — chạy lại theo lịch thường lệ ở đợt sau.
2. **(c2) lệch nhãn +1f: tái hiện 7 lần đợt này** (6 trên lượt
   hợp lệ a3 + 1 trên partial a2; tất cả skp=0, tất cả +1f) —
   chuyển T3 (phân tích modal qua các lượt) + T5 (instrumentation
   log draw đã có trên cây, chờ bật khi cần). **Event lag ≥+5f:
   0 occurrence đợt này** — event seq 276–279 frame 27 giữ làm
   case theo dõi.
3. **Kẹt rAF pass-timeout tái hiện 2 lần/đợt** (a1 pass 7, a2
   pass 11) — nguyên nhân vẫn chưa chứng minh; HB129 nay cho
   điểm kẹt chính xác + partial giữ blendTick/tickCost. Nếu
   đợt sau kẹt nữa thì có dữ liệu chẩn đoán đầy đủ.
4. **RAM host balloon kẹt ~500 MB** (§2.1) — gate A chờ 34 phút
   mới mở. Theo dõi đợt sau; không hạ ngưỡng.
5. **Reboot giữa lượt lần thứ hai** (#77→#78 sau attempt3) —
   T5 phải viết cờ POSTBOOT_PASS mới cho #78; T8 gate lại trước
   khi chạy harness; T6 đếm lại số boot (mù #37) để chốt #78.
   T10 đóng sổ cần tính thời gian T8 chạy muộn.
6. **Dải wallMs 0–20k:** a3 phẳng (41,0) sau 2 lượt dải đầu
   cao (đợt 129: 63,0; partial a2: 47,0) — quan sát dải đầu cao
   có thể chỉ là nhiễu theo lượt, chưa đủ bằng chứng tách
   warm-up khỏi verdict.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 129 §11 + quyết parent
   §12.3 (cập nhật đợt 130):** mù #49 (T2 đợt 130 — probe thường
   lệ); (c2) chẩn đoán (T5 đợt 130 — instrumentation đã xong);
   replay #77 dạng (B) + repair 1 lần (T5); R9 (a) VẪN CHỜ user
   (nhắc lần 16); G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của
   user; birefnet 0 lần (RAM khả dụng vẫn dưới guard 6 GB);
   TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user;
   release gate không đổi. Boot mới nhất: #78? 13:02:41Z
   (gap #77→#78 ≈ 2h06m10s, từ btime 10:56:31Z → 13:02:41Z).
   T8 đang chờ cờ POSTBOOT_PASS #78 để chạy harness sau cờ T4.

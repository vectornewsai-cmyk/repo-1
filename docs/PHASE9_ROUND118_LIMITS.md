# PHASE9 ROUND118 — LIMITS gộp (đợt 118, lượt cron 18:35 +07 15/11/2026; ĐÓNG BỞI PARENT MAIN CHAT 03:5x +07 16/11)

## 0. Kiểm chứng gộp — parent đóng thay T10 (T10 chết trước phase 2)

- **T10 phase 1 XONG (13:13:10Z, boot #55 52d799d4):** suite cây gộp
  27/27 exit 0 (log `round118-t10-suites.log`, preview-engine 354
  assertions pass); O8 Chromium 21/21 exit 0 (13:12:19Z) + O8 WebKit
  21/21 exit 0 (13:13:10Z). Poller ghi 9/9 lúc 10:53:57Z (poll #2
  sau khi chạy lại). **Phase 1 recount CHỈ ĐẾM 7 BATCH** (t1, t2,
  t3, t6, t7, t8, t9 — 14 entry) vì t4 (13:18Z) + t5 (13:06Z) chưa
  stage lúc recount chạy — số lũy kế phase 1 (74/144/122) THIẾU.
- **T10 chết trước phase 2:** không file mới nào trong
  `hidden_files/round118-t10/` sau 13:20:16Z (poll-t10.log); không
  có LIMITS gộp, gap §47, closing batch, cờ t10.done. Phiên T10
  chết theo một reboot sau phase 1 (boot hiện tại 6805e92d, ~20:17Z
  15/11 — sau #55 12:51:56Z). Lượt cron 03:35 +07 16/11 bỏ qua
  theo chốt chặn và báo T10 im lặng 7+ giờ.
- **Parent đóng thay (03:5x +07 16/11):** chạy lại recount
  (`recount-push118.py`): đợt 118 = **9 batch / 16 entry / 16 file
  duy nhất** (chưa gồm closing); chạy lại tsc web 0 + tsc desktop 0
  + vite build PASS 6,28 s trên cây cuối; kiểm lại 9/9 headline
  từ LIMITS từng luồng + dữ liệu thô (xem §1–§9). preview.tsx md5
  03bf029f + media.ts 2c384ed1 trước = sau mọi lượt. Chốt chặn
  (parent tạo lại 20:25 vì lượt 18:35 không tạo) ĐÃ XÓA sau khi
  đóng — lượt 06:35 mở đợt 119 bình thường.
- **Số chờ push sau đợt 118 (gồm closing): 77 batch / 148 entry /
  125 file duy nhất + 1 oversize 6,4 MB** (xem recount cuối §12).

## 1. T1 — Lock v2 đổi spec sang v2: XONG (suite 8/9, T7 FAIL là nhiễu môi trường)

- **Đã làm:** đổi `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2 (nguồn chuẩn
  duy nhất đổi từ `vcut-vite-lock.sh` (v1) sang
  `vcut-vite-lock-v2.sh`; §1–§8 viết lại theo v2: poll mặc định 2 s,
  cooldown 15 s script tự bắt, exit code thêm 3, stale-recovery v2
  với đường tắt boot-change, bảng mặc định aging 600/timeout 1800/
  cooldown 15/poll 2). `vcut-vite-lock-v2.sh` chỉ đổi comment header
  khối TRẠNG THÁI TRIỂN KHAI (ghi v2 là spec đóng băng duy nhất từ
  đợt 118 + lịch sử migration) — **không đổi một dòng code hành vi
  nào**. v1 frozen md5 `fd21193c` nguyên vẹn làm sao lưu. Caveat tải
  dao động chu kỳ ~5 phút mang theo từ T4 đợt 117 §2/§6.
- **Smoke test live trên lock thật:** xanh (11:39:24–11:39:49Z,
  cổng 5580). **Suite 8/9 hai lần liên tiếp** — cùng 8 PASS, **T7
  FAIL: B1=6 B2=6.** T1 kết luận T7 FAIL là nhiễu môi trường, KHÔNG
  liên quan đổi spec (spec đổi chỉ là doc + comment). Parent chấp
  nhận kết luận này có caveat: parent không chạy lại suite của T1,
  nhưng suite cây gộp phase-1 27/27 + tsc 0/0 + vite build PASS
  (parent chạy lại) xác nhận cây khỏe; T7 FAIL ghi làm nợ theo dõi
  đợt 119 (§10 mục 7).
- Batch 3 entry (spec doc + script v2 + LIMITS). Lock v2 production
  md5 8b02ddc8 → 5cac10af (T1 đổi spec đợt 118).

## 2. T2 — Zombie H3f: chẩn đoán XONG — H3f ĐÁNG LÀM (patch chuẩn bị, chưa apply)

- **DIAG-GATE ĐẠT (prereg §5: ĐÁNG LÀM nếu S_store ≥ 0,25 HOẶC
  S_first ≥ 0,35 trên tick chậm):** stall tái hiện (longtask ≥200 ms
  n=145, tổng 44.996 ms; draws-gap >300 ms n=104; tick chậm n=63/
  366). **S_store (held-first) med 0,601 p90 0,951 (n=39; first draw
  vào HELD 39/51 tick = 76%), S_first med 0,375 p90 0,935 (n=51),
  R_new/same = 4,10** (new-frame n=334 durMed 16,0 ms vs same-frame
  n=313 durMed 3,9 ms). Strip RẺ (đọc từ canvas id=2, không phải
  video — bác nửa giả thuyết đợt 117).
- **Phát hiện M10:** mỗi tick có HAI lần đọc video (storeHeldFrame
  + plainNativeSource :4287) — H3f phải bỏ cả hai. **Caveat:** 12/63
  tick chậm ZERO video draw (H3f không sửa được); second-draw med
  75 ms dù cùng frame (contention phình mọi drawImage trong tick
  chậm). Nhiễu tải: load1 med 42,02 (T3 s79r2 dial 56 hog đồng thời)
  — số tuyệt đối không so được B1; share trong-tick + R_new/same là
  bằng chứng chính. Creator-tag HỎNG (mọi canvas creator=
  "evaluate") → analyzer chính S_store=0,0 sai; khắc phục bằng pháp
  y offline (bản đồ canvas tự nhất quán).
- **Patch H3f chuẩn bị, CHƯA apply:** `hidden_files/round118-t2/
  h3f.patch` (108 dòng, 5 hunks, baseline 03bf029f → patched
  5be5a250…; git apply --check rc=0 trên bản copy /tmp; guard
  tick-nóng loopMs ≥100 + skip cùng-frame, staleness ≤3 tick, ép
  refresh khi đổi clip/seek nhảy >0,2 s) + build-h3f-patch.py.
  Đợt 119 apply + đo A/B mới biết hiệu quả thật. Attempt 1 lỗi
  regex (exit=2 ×2, 12:02–12:04Z) — đã sửa build-probe.py, rerun
  12:07–12:12Z thành công (giữ lock 308 s).
- Batch 2 entry (LIMITS + probe). preview.tsx md5 03bf029f trước =
  sau (không đổi).

## 3. T3 — Điểm gãy tải: lặp s79 — vùng chuyển tiếp ~27 được củng cố; điểm gãy VẪN MỞ

- **s79r1 GIỮ 83,5% @13,22** (1901 tick, trung vị 0, mean +0,55,
  ≤−2 0,0%) — dial ĐẠT 38,35 (24 hog lúc phát, 3 lần từ chối ĐẠT
  sớm, hog-runtime 127 s) nhưng sampled mean trong lúc phát chỉ
  13,22 (sibling rút sau dial) → GIỮ ở tải thấp, KHÔNG xác nhận
  biên 21,07. **s79r2 TRUNG GIAN 79,0% @27,75** (1727 tick, trung
  vị 0, mean +0,71, ≤−2 0,5%) — dial ĐẠT 35,64 (56 hog, 283 s;
  load1 rơi đơn điệu 9,87→0,24 trong 230 s rồi nhảy vọt lên 35,64
  trong 40 s) + chờ lock 280 s → tái hiện gần đúng s79 gốc (79,7%
  @26,98, chênh 0,7 điểm).
- **Kết luận: điểm gãy VẪN MỞ; GIỮ vững vẫn 19,63 (s77c); vùng
  chuyển tiếp (21,07, 26,98] được củng cố ở đầu trên (~27: 79,0–
  79,7%).** Nhiễu giữa các lượt ở tải ~12–13 lên tới 19,1 điểm:
  s79r1 GIỮ 83,5% @13,22 vs s80b TRUNG GIAN 64,4% @12,03 (cùng 24
  hog lúc phát, cùng cây/probe) — bằng chứng nhiễu trực tiếp mạnh
  nhất từ trước tới nay. Yếu tố khác biệt chưa tách được (boot age
  #53 23 phút vs #54 56 phút; RAM min 265 MB vs 542 MB).
- **Trong lượt, quý tải cao → %±1 tốt hơn (3/3 lượt dài gần
  nhất):** s79r2 Q2 tải 42,52 → 86,1% tốt nhất, Q1 tải 13,57 →
  74,0% tệ nhất; s79r1 Q4 tải 6,27 → 80,5% tệ nhất. Giả thuyết
  throttle (load1 thấp = đang bị bóp = main thread đói) — chưa
  chứng minh, cần đo cgroup trực tiếp nếu muốn.
- **Bar (b) kẹt 0/10** (s79r1 #9 + s79r2 #10, 0 episode; 30 s min
  advance 15,97 s / 18,83 s; 10 s min 4,73 s / 6,10 s). Vùng chậm
  nhất khác nhau giữa 2 lượt và khác đợt 117 → giả thuyết "vùng
  clip xấu ổn định" yếu đi. **Bar (c) KHÔNG kiểm chứng đợt này**
  (quyết parent đợt 117); mô tả: tickRate 2,14/s + skipStale 28,0%
  (s79r1), 1,91/s + 33,4% (s79r2) — lại vùng xám cũ (không đếm).
  D1 hỗn hợp: s79r2 skipStale↔%±1 đơn điệu sạch theo quý, s79r1
  phẳng.
- Batch 2 entry (probe 48.898 B oversize + LIMITS).

## 4. T4 — WebKit ≤60 ms: lượt yên ĐẠT lớp B — ngưỡng GIỮ; phát hiện event ghost frame 23 MỚI

- **CHẠY ĐƯỢC 1 LƯỢT YÊN ĐẠT LỚP B — NGƯỠNG ≤60 ms GIỮ NGUYÊN.**
  Attempt8 (boot #55): 20/20 pass, probe_exit=0, tickCost total
  median **40,0 ms**, p90 64,7 ms, n=644 (tốt nhất trong các lượt
  yên: L7 40,5 / N1 50,0 / N4 58,0 / S5 49,5); hậu flip median 40,0;
  wallbands phẳng 39,0–42,5; lớp B 5/5 ĐẠT (load1 max 3,41; load5
  cuối 1,31; RAM min 1157 MB, 0 mẫu <1024 MB; không reboot; không
  apt). Nợ lượt yên theo dõi đợt 118 ĐÃ ĐÓNG. Không siết (cần thêm
  lượt yên độc lập).
- **(b) unique-match:** skp=1 nomatch 0/130, lag max +2f; skp=0
  nomatch 0/642, lag (b) median 1f, max +9f, ≥5f: 10, ≥10f: 0.
  **F6' bar (1)/(2): 100,0% / 100,0% (nTick=65)** — F6' VẪN ĐÓNG
  (xác nhận lại).
- **Stale-ghost — PHÁT HIỆN EVENT MỚI frame 23:** 10 occurrence lag
  ≥+5f (đều skp=0) thành 3 event: frame 19 (2 occ, 74 ms), frame 22
  (2 occ, 77 ms), **frame 23 (6 occ, 229 ms, lag max +9f, pixels
  đứng yên ở frame 23 trong khi presented 16→23, label 14→18)**.
  Event 23 đạt tiêu chí ≥3 ghost liên tiếp — phân loại event MỚI
  (khác P4-26, ngắn hơn P4 420 ms; không sau seek như Q5-68).
  Không kết luận hồi quy từ 1 event — đề xuất luồng riêng chẩn đoán
  đợt 119.
- **Attempt7 (boot #54) CHẾT THEO REBOOT #55 (12:51:56Z, boot_id
  52d799d4, gap #54→#55 = 2h03'30") ở pass 12/20:** partial JSON
  median DỞ DANG 44,0 ms (n=344, KHÔNG dùng chốt ngưỡng); lớp B VI
  PHẠM (B2 load1 max 5,41; B3 reboot; B5 RAM min 286 MB). Pass 11
  nhiễu 15,801 ms đúng biên reboot. Poller 5 phút chết theo reboot,
  khởi động lại 13:02:33Z.
- **Gate 0:** replay #54 tới muộn +47'14" (xong 11:40:56Z), postboot
  #54 PASS (T7 + check-only riêng), GATE 0 ĐẠT poll #2 (11:43:26Z,
  trong ngân sách 45 phút). Replay #55 NHANH bracket (0'42",
  2'46"] (hoạt động dpkg đầu 12:52:38Z, cuối 12:54:42Z); postboot
  #55 PASS ngay lần kiểm đầu (T4 check-only — T7 đã DONE trước #55
  nên không có cờ T7 cho boot mới; gate 0 #55 dùng check-only riêng,
  đã ghi rõ trong LIMITS).
- **Attempts 1–6: gate A không mở (exit 5)** — T3 dial s79r2 (56
  hog) + T2 chẩn đoán H3f + T9 lô E4 (load1 đỉnh 61,52; load5 tới
  36,73; RAM đáy 381 MB). Attempt6 poll 9: T5 mở gate trước T4 đúng
  2 giây (12:47:26Z vs 12:47:28Z) — T5 đo trước (attempt2, 20/20,
  probe_exit=0, giữ lock 84 s), T4 đo sau (FIFO lock v2 đúng).
  Attempt8 gate mở poll 2 (13:03:46Z); browser.close() treo ~2 phút
  sau khi JSON ghi xong (không ảnh hưởng số đo).
- **Lock v2:** script md5 8b02ddc8 → 5cac10af (T1 đổi spec đợt 118),
  giữ nguyên qua attempts 1–8. T3 báo "KHÔNG NHẢ — owner '?'" khi
  nhả lock sau s79r2 (12:31:19Z) — lock cuối cùng vẫn trống đúng;
  ghi nhận để T1 xem lại (§10 mục 7).
- **Xác thực:** dry-run analyzer trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 (diff sạch với T5 đợt 117). Hồi quy trên
  cây 03bf029f: tsc exit 0, ghostBlend 15/15 PASS. Cây 03bf029f
  không đổi suốt đợt. Không sửa production.
- Batch 1 entry (LIMITS).

## 5. T5 — Ghost seek: H-D ĐƯỢC ỦNG HỘ (0/60 yên vs 5/40 nhiễm, p=0,0087; tổng 100 seek)

- **H-D ĐƯỢC ỦNG HỘ — ĐÓNG.** 0/40 seek yên mới (attempt2 boot #55
  0/20 + attempt3 boot #55 0/20). Gộp: yên 0/60 vs nhiễm 5/40,
  Fisher một phía **p=0,0087** (< 0,01). Theo quy tắc prereg §4:
  **H-D (tải là điều kiện cần cho seek-stale) ĐÓNG — không phải
  bằng 1 lượt yên mà bằng 2.** Tổng 100 seek — nợ ≥80 seek ĐÃ
  ĐÓNG.
- **2 event P4-type mới** (chi tiết trong LIMITS §2). Hai hiện
  tượng tách nhau về điều kiện tải: seek-stale chỉ xảy ra khi nhiễm
  tải (5/40), không bao giờ khi yên (0/60).
- Batch 1 entry (LIMITS). Analyzer copy S6 tái hiện đúng 4/19
  stale (M=70/61/76/68) trên JSON S6; Fisher/CI tự tính khớp số
  parent đợt 117.

## 6. T6 — EPERM: probe #37 + mù #36 ĐÓNG HOÀN TOÀN + GIÂY NHÁY (clock discontinuity) tại #54

- **Probe #37 (checklist P8 §2.3, đúng 1 lần):** ok=2 fail=0,
  boot 48a82db1 (#54), ALIVE (n=37). **Mù #36 ĐÓNG HOÀN TOÀN**
  (từ probe #36 08:42:46Z → probe #37) — mù đóng hoàn toàn đầu
  tiên sau chuỗi đứt ở #35.
- **Phát hiện GIÂY NHÁY (clock discontinuity) tại #54: đồng hồ VM
  NHẢY LÙI 17–21 phút.** Bằng chứng (§2.2): gap #53→#54 theo đồng
  hồ VM = 1h01'18" — SAI; btime + uptime + journal/wtmp + ps
  systemd PID 1 START cho thấy boot #54 thực tế muộn hơn đồng hồ
  VM ghi 17–21 phút. Hệ quả: mọi gap dùng đồng hồ VM quanh #54
  phải chứng nhận theo KHOẢNG (bracket), không dùng số tuyệt đối
  của đồng hồ VM. Gap #53→#54 chứng nhận theo khoảng (xem §2.2).
  Bài học: mọi phép tính gap sau này đối chiếu btime/uptime, không
  tin đồng hồ VM một mình.
- **WFS lần 24 chênh 0.** EPERM: 0 sóng thật. RAM max trong mù #36
  xem LIMITS §3 (birefnet vẫn 0 lần thành công).
- Mù #37 mới mở (từ probe #37), chứa #55 + các reboot sau đó —
  probe #38 đợt 119.
- Batch 1 entry (LIMITS 57.382 B oversize).

## 7. T7 — Hạ tầng: replay #54 tới muộn +52'30", postboot PASS, headroom 804

- **Replay #54 tới muộn:** hoạt động apt đầu tiên 11:40:56Z
  (boot +52'30") → khoảng **(47'14", 52'30"]** kẹp được bằng
  dpkg.log. **Postboot #54: PASS** — kiểm check-only lúc boot ~53'
  tuổi (không --repair). Cờ `POSTBOOT_PASS` đã ghi cho T4/T5 lúc
  11:43Z. **Không repair** — replay tự tới (muộn), không cần can
  thiệp. (Lưu ý: chính sách repair 15 phút duyệt ở đợt 117 áp dụng
  từ đợt 119 trở đi — #54 boot trước khi chính sách được duyệt.)
- **Headroom inotify boot #54: 804 — tiếp tục rơi, reboot KHÔNG
  hồi** (lần 2 liên tiếp có số đo boot-mới chứng minh). Vite thường
  cần ~1586 nên vẫn thiếu ~638; vite tạm `watch.ignored` vẫn bắt
  buộc. RAM khả dụng 1143 MB (< 6 GB, birefnet không thử).
- #49/#50/#51: chỉ còn #49 PASS (S10 kiểm live 22:57–22:59Z, boot
  +1h10'); bracket #49 chỉ còn cận trên, #50/#51 chưa từng có lần
  postboot-check nào, bracket đã mất cùng log (dpkg.log/apt/
  history.log/journal chỉ còn boot #52 — cùng cơ chế mất log như
  #45). Mù #35 nay chứa 4 reboot (#49–#52) — việc T7 đợt 117.
- Batch 2 entry (LIMITS + postboot-check script).

## 8. T8 — Seek/preload: trần bám max-size-bytes; F2 thực chất là khởi động pipeline; fallback 0,94 s; Chromium 6/6 sạch

- **Leg (a) — trần bám theo max-size hay ring? KHẲNG ĐỊNH H6 (giá
  trị điển hình):** MSB4RB8 (max-size 4 MiB + ring 8 MiB) cho C =
  **17,421 s** (median 3 run đăng ký; smoke cũng 17,421) — giống
  hệt CTL (msb4/rb4) và khác hẳn RING8 (msb2/rb8: 9,22 s). **Trần
  KHÔNG đi theo ring. Ngoại lệ:** 1/3 run đăng ký (r1) vượt lên
  **27,02 s** — xem §1, không giấu.
- **Leg (b) — F2 seek lạnh (bar cũ ≤940 ms): KHÔNG ĐẠT trên chế độ
  chậm; ĐẠT trên chế độ nhanh.** 6 run MSB4RB8: seekImmMs **2311–
  4284 ms** (valid sạch 3/4: 4284/2906/3186). Nhưng seeking→seeked
  = **0,0 s mọi run** — thời gian nằm ở khởi động pipeline, không
  phải seek. Chế độ nhanh (CTL4, cùng boot): **539/627 ms** — trong
  bar cũ. Kết luận: bar cũ đo sai thứ (khởi động pipeline, không
  phải seek) — cần tách hai pha khi đặt bar mới (§10 mục 4).
- **Leg (c1) — chi phí fallback (n=1):** đo được 1 mẫu duy nhất
  (race chỉ nổ 1/20 run): hồi phục full buffer sau **0,94 s**;
  loadstart HTTP sau **0,21 s**; progress đầu sau **0,39 s**;
  **0 byte fetch lại** (cache); frames "mất" 277 **bị nhiễm tải**
  (không quy được cho fallback). KHÔNG báo p95 (n<4, theo prereg).
- **Leg (c2) — Chromium có race tương tự? KHÔNG.** 6/6 run Chromium
  hợp lệ: **0 error-event, 0 fallback**, finalSrc blob 6/6, phát
  tới cuối 6/6. Race blob là **đặc thù WebKitGTK** (môi trường đo),
  không phải sản phẩm (Chromium/Electron).
- Batch 3 entry (runner 80.121 B oversize + analyzer + LIMITS).

## 9. T9 — E4: lô đo lớn ĐÃ ĐĂNG KÝ (10 lượt) — lượt 1 ĐỂ TRỐNG; E4 giữ đóng có điều kiện

- **Lô đo lớn E4 đã ĐĂNG KÝ (10 lượt đếm được, 5 A + 5 B, sau
  seek), attempt 2 (retry duy nhất) DEFER-LOCK (timeout 900 s sau
  T3 giữ 1055 s). Lượt 1 ĐỂ TRỐNG theo đúng prereg. Lô đang 0/10
  lượt.** Đợt 117 T1: 3 lượt VOID + 1 DEFER-LOCK, 0 lượt bắt được
  steady-close.
- Hướng (c) (quyết từ phân tích cơ chế) bị CẤM trong prereg T9 —
  khớp quyết parent đợt 117 (chọn hướng (a)). E4 giữ ĐÓNG CÓ ĐIỀU
  KIỆN.
- Batch 1 entry (LIMITS).

## 10. Nợ mở cho đợt 119 (gộp từ §1–§9)

1. **E4 — lô đo lớn (T9, nợ #1):** lô 0/10 — chạy tiếp lượt 2–10
   (5 A gop250 + 5 B gop30, cửa sổ seek 60 s); E4 vẫn ĐÓNG CÓ ĐIỀU
   KIỆN (hướng (a), quyết parent đợt 117).
2. **Zombie H3f (T2, nợ #2):** apply patch H3f (108 dòng, 5 hunks)
   + đo A/B (cặp cùng boot, liền nhau). Caveat: 12/63 tick chậm
   zero video draw (H3f không sửa được); second-draw med 75 ms
   cùng frame (contention); M10: bỏ cả hai lần đọc video.
3. **Ghost frame 23 (T4, nợ #3):** luồng riêng chẩn đoán event
   frame 23 (6 occ, 229 ms, lag max +9f) — cơ chế gì, có phải họ
   P4 không, có hồi quy không.
4. **Điểm gãy tải (T3, nợ #4):** VẪN MỞ. Lặp lại s79 đúng 56 hog/
   dial [25,40] thêm 1–2 lượt để tách nhiễu (quyết parent đợt 117);
   cơ chế GIỮ tải trong lúc phát (dial ĐẠT không khóa được tải);
   giả thuyết throttle (load1 thấp = main thread đói) cần đo cgroup
   trực tiếp nếu muốn chứng minh. **Bar F2 cần đặt lại:** tách
   khởi động pipeline khỏi seek (T8 leg (b)); bar (b) playhead kẹt
   0/10 — giữ mức ưu tiên thấp.
5. **Mù #37 + probe #38 (T6, nợ #5):** mù #37 mở từ probe #37,
   chứa #55 + các reboot sau (số lượng chưa kẹp — T6 đợt 119 đếm
   lại từ btime/uptime, không tin đồng hồ VM một mình sau vụ giây
   nháy #54).
6. **Hạ tầng (T7, nợ #6):** headroom 804 rơi tiếp; chính sách
   repair 15 phút áp dụng từ đợt 119 (duyệt đợt 117); R9 (a) (cron
   chạy watcher v2 đầu mỗi lượt với --wait-new-boot) VẪN CHỜ user
   quyết (đã hỏi lúc đóng đợt 117, chưa trả lời).
7. **Theo dõi nhỏ:** T1 suite T7 FAIL (B1=6 B2=6, nhiễu môi trường
   theo T1) + T3 "KHÔNG NHẢ — owner '?'" khi nhả lock sau s79r2
   (lock cuối vẫn trống đúng) — T1 xem lại đợt 119.
8. **G1 + mù #22/#28/#29/#30/#31/#35 chờ user quyết** (không tự
   quyết). Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi
   (u2net là fallback chính thức). ci-security.yml vẫn 403 chờ
   user. TTS 39 CẤM kiểm lại.

## 11. Ghi chú vận hành đợt 118

- T10 chết trước phase 2 (phiên chết theo reboot sau phase 1) —
  parent đóng thay; bài học: phase-1 driver nên viết LIMITS gộp
  khung ngay sau khi suite + O8 xong, đừng để phase 2 cho phiên
  follow-up dễ chết; hoặc T10 chạy phase 2 ngay trong cùng phiên
  driver.
- Phase-1 recount đếm thiếu (7 batch vì t4/t5 chưa stage) — parent
  chạy lại recount đầy đủ (9/16/16); bài học: recount chỉ chạy khi
  poll ghi đủ 9/9 + batch đã stage đủ, không chạy sớm.
- Chốt chặn KHÔNG được tạo bởi lượt 15:35 lẫn 18:35 (hai lượt liên
  tiếp) — parent tạo lại tay cả hai lần; đưa "tạo chốt chặn lúc mở
  đợt" vào checklist mở đợt của lượt cron (nợ §10 mục 6).
- Reboot #55 (12:51:56Z, gap #54→#55 = 2h03'30", trong dải) giết
  poller T10 + sleep session T10 + driver T3 s80 + attempt3 T6 +
  launch F1 T2 (đều hồi phục/xong). Poller khởi động lại 13:02:33Z;
  phase-1 driver tự launch khi 7/9 về (13:05Z).
- Lock v2 đổi spec giữa đợt (T1, 11:39–11:43Z) — driver T10 phải
  copy lại script v2 (md5 8b02ddc8 → 5cac10af); các driver đang chạy
  không bị ảnh hưởng (lock giữ nguyên qua đổi spec).
- T4 batch stage sau phase-1 suite (13:18Z > 13:11Z) nhưng chỉ là
  file LIMITS (doc) — không ảnh hưởng code; parent chạy lại tsc +
  vite build trên cây cuối để bù.
- T5 mở gate trước T4 đúng 2 giây (12:47:26Z vs 12:47:28Z) — FIFO
  lock v2 đúng; T5 đo trước, T4 đo sau, không tranh chấp.

## 12. Quyết parent (main chat, 03:5x +07 16/11/2026 — đóng đợt 118)

1. **E4:** giữ hướng (a) (quyết đợt 117) — lô đo lớn T9 chạy tiếp
   lượt 2–10 ở đợt 119; E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN.
2. **Zombie H3f: CHẤP NHẬN apply H3f ở đợt 119 + đo A/B.** Chẩn
   đoán đủ mạnh (S_store med 0,601, R_new/same 4,10; M10 hai lần
   đọc video). Caveat ghi rõ: 12/63 tick chậm zero draw (không sửa
   được); second-draw med 75 ms (contention).
3. **Điểm gãy:** GIỮ vững 19,63 (không đổi); vùng chuyển tiếp
   (21,07, 26,98] đã củng cố ở đầu trên; đợt 119 lặp s79 đúng 56
   hog/dial [25,40] thêm 1–2 lượt; cơ chế GIỮ tải giữ làm nợ (chưa
   quyết); giả thuyết throttle cần đo cgroup nếu muốn chứng minh.
4. **WebKit ≤60 ms:** ngưỡng GIỮ (lượt yên attempt8 median 40,0
   ms, tốt nhất từ trước); event ghost frame 23 → luồng riêng chẩn
   đoán đợt 119 (nợ #3).
5. **Ghost seek H-D: CHẤP NHẬN ĐƯỢC ỦNG HỘ (p=0,0087, yên 0/60 vs
   nhiễm 5/40, tổng 100 seek) — ĐÓNG.** Nợ ≥80 seek ĐÃ ĐÓNG. Công
   việc còn lại là cơ chế (event P4-type mới).
6. **Mù #36: CHẤP NHẬN ĐÓNG HOÀN TOÀN.** Gap #53→#54 chứng nhận
   theo KHOẢNG (đồng hồ VM nhảy lùi 17–21 phút tại #54 — số tuyệt
   đối của đồng hồ VM quanh #54 không dùng được). Bài học giây nháy
   ghi vào §10 mục 5.
7. **Hạ tầng:** chính sách repair 15 phút áp dụng từ đợt 119; R9
   (a) VẪN CHỜ user (đã hỏi lúc đóng đợt 117, chưa trả lời — không
   hỏi lại dồn dập).
8. **Seek/preload:** chấp nhận kết luận T8 (trần bám max-size, F2
   là khởi động pipeline, fallback 0,94 s, race đặc thù WebKitGTK);
   B-Q8-1 giữ nguyên KHÔNG ĐẠT; bar F2 đặt lại ở đợt 119 (tách hai
   pha).
9. **Lock v2 spec: PHÊ CHUẨN việc đổi spec sang v2 (T1).** T7 FAIL
   (B1=6 B2=6) ghi là nhiễu môi trường theo T1, theo dõi ở đợt 119
   (§10 mục 7); spec đổi chỉ là doc + comment, không đổi code hành
   vi; suite cây gộp 27/27 + tsc 0/0 + vite build PASS xác nhận cây
   khỏe.
10. **T10 chết trước phase 2:** parent đóng thay (LIMITS gộp này do
    parent viết từ LIMITS từng luồng + phase-1 summary); ghi bài học
    vào §11 (viết LIMITS gộp khung ngay sau suite + O8).

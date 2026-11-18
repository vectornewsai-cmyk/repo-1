# PHASE9_ROUND113_LIMITS — LIMITS gộp đợt 113 (verify độc lập P8)

> Luồng P8, đợt 113, lượt cron 18:35 +07 14/11/2026. Poll P1–P7 từ 11:37:05Z,
> đủ 7/7 lúc 13:02:10Z (poll #18; log `hidden_files/round113-p8/poll-p8.log`).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> **KHÔNG push. KHÔNG release/tag.** Không sửa production trong verify.
> `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b` trước = sau verify.
> Boot trong lúc poll + đo P1–P7: **#44** (10:53:31Z, `6ad1ef9e`); **reboot #45**
> = 13:17:42Z (`cd4cac0b`) xảy ra GIỮA suite verify và O8 (xem §8).
> Dữ liệu verify: `hidden_files/round113-p8/` (`recount-p8-all.py` +
> `recount-p8-all.txt`, `wrapcheck-*-rerun.txt`, `round113-p8-suites.log`,
> `p8-o8.log`, `p8-postboot-b45-*.log`, `p8-wait-postboot-webkit.sh`).

## 0. Kết luận trước — bảng verdict 7/7 (P8 tính lại từ dữ liệu thô)

| Luồng | Headline (LIMITS luồng) | P8 tính lại | Verdict |
|---|---|---|---|
| P1 E4 tải cao | 0 CAP 8 lượt / 484 play-tick; Fisher 2+2 p=0,0308, 8 lượt p=0,00247, gộp N1+P1 0/664 p=0,000696; 0/8 lượt trong [8,30] → E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN | 2+2 = 268 ✓, 8 lượt = 484 ✓ (chạy lại analyzer trên 4 file attempt1-outofband: 69+51+46+50=216), CAP 0 cả 3 luật ✓, Fisher 4 số khớp đúng 4 chữ số ✓ (code Fisher riêng bằng `math.comb`), steady-close 2 (1190 att1 + 5274 att2) ✓, ended-close 2 (4736/1326) ✓, rearm-cứu 2 (4892/5002) ✓, quirk (ii) 14 tick ct=5,9 4915 ms ✓ verbatim | **KHỚP** |
| P2 ring lag | 21 pull spliced logic (push_lag 7–86, residence 7–65, splice_delay 0–21); B1 KHÔNG phân biệt; B2 ĐẠT; wrap 33/38 vượt; seek 0,44 s ×2, preload-wait chạm trần 20 s 2/2 | Đọc lại `p2_lag_p2.json`: spliced logic r5 0 / r6 8 / r7 6 / r8 7 = 21 ✓; lag từng run khớp ✓; clean r5/r7/r8 median 0, max 155/145/77 ✓; r6 violations 354/729 ✓; **chạy lại `p2_wrapcheck.py` trên P2 + N2 offline: 18/21 + 15/17 = 33/38** ✓; 3 ca chưa vượt 4.001.792/4.055.040/4.124.672 = 95,4/96,7/98,3% ✓; B2 req_off=9939 R8: 56/63/37/78 ms ✓; near-miss clean take_bytes_after=3.764.384 ✓; SEEK seekedOk=TRUE, preloadWaitMs 20052/20055, preloadFull=FALSE ✓ | **KHỚP** |
| P3 zombie | Giả thuyết freeze ở chuyển clip XÁC NHẬN: gộp N3+P3 5/5 straddle, p=4,2e-05; dạng mạnh 1/1 lượt (3 gap); stall 5 s 0/1 (gộp 0/9); CDP forensics 1 gap (lần đầu trong 12 lượt) | Đọc lại `classify-p3-pooled.json`: 5 gap (N3: biên 6/12, dur 337/398; P3: biên 9/15/18, dur 493/483/320), straddle 5/5 ✓; **tích p0_i = dur/3000 tính tay = 4,21e-05** ✓; p cố định 0,25^5 = 0,000977 ✓; analysis R1 §7 verdict "3 gap" ✓; CDP `QUAN SÁT ĐƯỢC` đúng 1 dòng (392 ms) ✓ | **KHỚP** |
| P4 F6' 60 ms | Lượt KHÔNG ĐẠT điều kiện yên (lớp B vi phạm — P3 bắt đầu giữa cửa sổ) → ngưỡng GIỮ theo N4, không chốt; tickCost median 61,0 (n=509), hậu flip 58,0 (n=383); (b) 6 occurrence lag ≥+5f, 1 event (frame 26, ~0,42 s); F6' 72/72 + 250/250, vẫn ĐÃ ĐÓNG | Tính lại từ `preview-b-f3-flip-webkit-q1.json`: tickCost n=509 median 61 p90 92 max 176 ✓; hậu flip n=383 median 58 ✓; tBlend gap n=423 median 101 ✓; labellag: skp=1 max +4f 0 ≥+5f, skp=0 max +12f 6 ≥+5f / 2 ≥+10f ✓; `lag5-detail.txt`: đúng 6 dòng lag≥+5f, seq 220–223, tất cả M=26 ✓; skiplatest: 72/72 + 250/250 ✓ | **KHỚP** |
| P5 điểm gãy | (a1) trích chunked ĐÃ SỬA XONG 4/4 lượt 0 lỗi; (a2) s76 KHÔNG CHẠY (DEFERRED ×2 do p1 giữ lock ~35'); điểm gãy VẪN MỞ, biên GIỮ 9,59; (b) playhead kẹt KHÔNG tái hiện 0/2; (c) s73 KHÔNG phải hiệu ứng build (s75: 1187 tick, 98,2% ±1) | Tính lại từ results JSON: dry 441/100% ✓, s75 1187 tick med 0, **1165/1187 = 98,1466%** — số 98,2% của LIMITS là làm tròn kép (round 4 chữ số → 0,9815 → 98,2%; từ tỉ lệ thô ra 98,1% — xem §5 đính chính, số đếm 1165 KHỚP); s77 20 tick / s78 29 tick ✓; extraction.errors=[] cả 4 lượt ✓; **cửa sổ stall tính lại đúng phương pháp [25,30]s: s77 10,67 s / s78 11,13 s; [8,10]s: 4,47 / 5,77 — khớp đúng 2 chữ số** ✓; s76 không có thư mục ✓; DEFERRED đúng 2 dòng trong driver logs ✓ | **KHỚP kèm đính chính** (s75 98,2% là làm tròn kép; xem §5) |
| P6 EPERM | Probe #32 ok=2 fail=0; reboot #44 = 10:53:31Z; gap #42→#43 = 48'27" ĐƯỢC CHỨNG NHẬN (mới); mù #31 KHÔNG ĐÓNG HOÀN TOÀN (1 cửa sổ mở 8'55"); EPERM 0 sóng thật; quét writeFileSync lần 19: 637/187, R7b 662/204, copies 25/17, chênh 0 | Log probe v2: **88 dòng** ✓, heartbeat n=32 ts 11:37:14Z boot 6ad1ef9e ✓; scan-meta: 637/662/25 ✓, **cộng lại từ file wfs-*.txt: 637 + 25 = 662** ✓; gap 48'27" = 2907 s ✓; cửa sổ mở 535 s = 8'55" ✓; **grep lại 89 log: "vẫn bật" 0, "CẢNH BÁO 10 phút" 0, "Operation not permitted" 0, "đã tắt" 10** ✓; **chạy lại `recount-p6.py` → output IDENTICAL với `recount-p6.txt`** ✓ | **KHỚP** (chứng nhận xuyên mù #42→#43 là quyết phương pháp của P6, P8 chỉ kiểm số học — chờ parent xác nhận, xem §6) |
| P7 infra | O8 Chromium 21/21 PASS, ENOSPC 0 (headroom 1507); postboot #44 PASS; vá poll M5/L7 (M5 tự đếm thật, L7 không — đính chính N4) | Đếm lại report JSON O8 Chromium của P7: **21 results, 21 ok, 0 fail** ✓; headroom log: probe STOP ở 1507 ✓; 3 poll script đã sửa đều chứa `[W]ebProcess` ✓, poll-p4.sh giữ `grep -v "grep -E"` ✓; postboot log: PASS đủ mục + "KET LUAN: DU DIEU KIEN" ✓; **P8 chạy lại `p7-poll-verify-fixed.sh`: exit 0, 0 dòng grep tự khớp, cả 4 pipeline bắt được blocker giả +1** ✓ | **KHỚP** |

**Kết luận chung P8: 6/7 KHỚP hoàn toàn, 1/7 KHỚP kèm đính chính nhỏ (P5 — chỉ là cách làm tròn hiển thị, không đổi số đếm). Không có luồng nào KHÔNG KHỚP. Không phát hiện code giả/mock.**

## 1. P1 — E4 xác nhận tải cao (không đạt tải cao)

- **Số liệu P8 tính lại:** `cap-pattern-rows.json` chỉ chứa 4 hàng = 2+2 attempt cuối
  (không phải 8 — P8 ghi rõ để đợt sau khỏi nhầm: attempt 1 nằm trong 4 file
  `probe-results.json.attempt1-outofband`). Chạy lại `analyze-p1-file.py` trên
  cả 4 file attempt1: play-tick 69/51/46/50 = 216; cộng 2+2 (70/80/47/71 = 268)
  = **484** ✓. CAP = 0 trên cả 3 luật ở cả 8 lượt ✓.
- **Fisher (code riêng P8, `math.comb`, hai phía):** 2+2 0/268 vs K1-on 6/284
  p=0,0308; 8 lượt 0/484 p=0,00247; gộp 2+2 0/448 p=0,0033; gộp 8 lượt 0/664
  p=0,000696 — **khớp đúng 4 chữ số thập phân với LIMITS P1**.
- **Cơ chế:** steady-close 2 (p1f4 att1: 1190 ms verified; p1f4 att2: tuổi quan sát
  5274 ms, tuổi thật ∈ (4793, 5000]); ended-close 2 (4736/1326 ms); rearm-cứu 2
  (p1f3 att2 4892 ms trong `mechanism-rows.json` + p1f3 att1 5002 ms trong
  outofband — P8 chạy lại endframe analyzer và thấy đúng dòng rearm).
  Quirk (ii): P8 chạy lại endframe analyzer trên p1f2 attempt1, thấy đúng
  dòng `QUIRK: (ii) ... 14 tick liên tiếp, tick 34..48, t=10497..15412
  (4915 ms), ct=5.9..5.9, ended=false` ✓ verbatim.
- **Verdict P1 giữ nguyên:** E4 **ĐÓNG CÓ ĐIỀU KIỆN** — 0/8 lượt trong dải tải
  [8, 30] (load1 lúc phát max 4,40); Fisher đạt nhưng chỉ trên tải thấp.
  Tải cao vẫn chưa có câu trả lời. P1 không đổi production (chỉ đo).

## 2. P2 — Ring 8 MiB: lag push/take đo trực tiếp

- **Spliced pulls:** đọc lại `p2_lag_p2.json`: P2CTL r5 0 / r6 8 / r7 6 / r8 7
  = **21 pull logic** (dòng: 0/16/12/14); req_off trùng hệt N2
  (9939/48426/66916/80895/97529/114176/126851); match_fail = 0 mọi run.
  Lag spliced từng run khớp LIMITS (r6: push_lag 7–86 median 85,5, residence
  7–65 median 65, splice_delay 0–21 median 20,5; r7: 9–10/9/0–1; r8: 16–17/14/2–3).
- **B1:** clean r5/r7/r8 push_lag median 0, max 155/145/77, min −5/−4/−2 —
  khoảng spliced 7–86 nằm trọn trong khoảng clean → KHÔNG phân biệt theo luật
  khoảng đã đăng ký ✓. r6 clean violations **354** (48,6%) — loại khỏi so sánh ✓.
- **B2:** `p2_equiv_p2.txt`: pull 9939 ở R8 r1–r4: push_lag 56/63/37/78,
  residence 9/35/11/9, splice_delay 47/28/26/69 ✓ đúng bảng LIMITS; pull sạch
  P2CTL r5 req_off=9939 take_bytes_after=3.764.384 (89,7% wrap) ✓.
- **Wrap — P8 chạy lại `p2_wrapcheck.py` trên cả P2 và N2 offline:**
  P2 **18/21 vượt wrap**, N2 **15/17 vượt** → **gộp 33/38** ✓ đúng LIMITS §4.2.
  3 ca P2 chưa vượt: 4.001.792 / 4.055.040 / 4.124.672 = 95,4 / 96,7 / 98,3% wrap ✓.
- **B3 seek:** cases P2SEEK r1/r2 trong results JSON: seekedOk=TRUE,
  preloadWaitMs 20052/20055, preloadFull=FALSE, 0 errEvents ✓ (seek 0,44 s
  lấy từ event log — P8 không tính lại thời lượng seek từ log sự kiện, chỉ
  kiểm các field JSON; con số 0,44 s lấy theo LIMITS).
- **Caveat P8 ghi thêm:** 4 run P2CTL r1–r4 void do thiếu `GST_DEBUG_BLOB=1`
  (đã chạy lại r5–r8) — P8 xác nhận các case void vẫn nằm trong OUT JSON như
  LIMITS nói (14 case). Không đổi production.

## 3. P3 — Zombie: giả thuyết chuyển clip ĐƯỢC XÁC NHẬN

- **Tính lại từ `classify-p3-pooled.json`:** 5 gap mới (N3: dur 337/398 ms,
  biên 6/12; P3: dur 493/483/320 ms, biên 9/15/18), straddle **5/5**;
  p Poisson-binomial = tích p0_i = (337·398·493·483·320)/3000^5 = **4,21e-05**
  (P8 tính tay, khớp 4,2e-05 của classifier); p cố định 0,25^5 = 0,000977 ✓;
  `confirm_rule_prereg_3.2: true` ✓.
- **Dạng mạnh R1:** analysis §7 verdict "3 gap" ✓; CDP forensics đúng **1**
  dòng `gate-(b)-CDP=QUAN SÁT ĐƯỢC` (392 ms) ✓ — lần đầu trong 12 lượt, chỉ
  ghi nhận, không verdict (bar CDP đã bỏ theo quyết parent 14/11).
- **Ghi chú P8:** mẫu gộp trải 2 build (N3: c4198206; P3: 03bf029f), cả hai đều
  100% straddle; quy tắc dừng phụ thuộc kết quả đã được đăng ký trước (p ~4e-05
  so với ngưỡng 0,01, biên ~240×). Câu hỏi tiếp theo là cơ chế (tại sao freeze
  ở chuyển clip), không phải tích mẫu nữa.
- P3 không đổi production. Sự cố lock `release n3` (sed sót) đã nhả tay
  11:46:44Z, run-p3.sh đã sửa — P8 xác nhận lock TRỐNG lúc verify.

## 4. P4 — F6' WebKit ≤60 ms: lượt KHÔNG đạt điều kiện yên

- **Tính lại từ `preview-b-f3-flip-webkit-q1.json`:** tickCost total n=509,
  median **61**, p90 92,0, max 176, min 29 ✓; hậu flip+2000ms n=383,
  median **58** ✓; tBlend gap n=423, median 101 ✓. Số đo báo cáo đầy đủ
  nhưng **không dùng để chốt ngưỡng** (lớp B vi phạm — P8 đồng ý với verdict
  này của P4: P3 bắt đầu chạy giữa cửa sổ đo 11:39:44Z, file prereg/log của P3
  sửa trong cửa sổ).
- **(b) unique-match:** labellag skp=1: n=144, max +4f, 0 ≥+5f; skp=0: n=500,
  max +12f, **6 ≥+5f / 2 ≥+10f** ✓. `lag5-detail.txt`: đúng 6 dòng lag≥+5f,
  seq 220–223, tất cả M=26 (pixels đứng yên frame 26 ~0,42 s) ✓ — 1 sự kiện
  duy nhất, skp=1 không ảnh hưởng.
- **F6':** skiplatest 72/72 (skp=1) + 250/250 (skp=0) ✓ — F6' vẫn ĐÃ ĐÓNG từ L7.
- P4 không đổi production; vite build không chạy lại trong luồng (N1 đã PASS
  trên cùng cây) — P8 đã chạy vite build trên cây gộp, xem §8.

## 5. P5 — Điểm gãy tải: dụng cụ sửa xong, lượt dài không chạy được

- **(a1) chunked extraction:** tính lại từ results JSON: extraction.errors=[]
  cả 4 lượt (dry/s75/s77/s78) ✓; lát px lớn nhất s77 32.224 ms / s78 46.192 ms
  (theo LIMITS; P8 kiểm errors=[] chứ không đo lại thời gian từng chunk).
- **Offsets (tính lại từ `blendTick`, presented−expected):** dry n=441 med 0,
  100% ±1 ✓; s75 n=1187 med 0, **1165 trong ±1 = 98,1466%**; s77 n=20 med +6,
  25,0% ✓; s78 n=29 med +5, 27,6% ✓; 0% ≤ −2 cả 4 lượt ✓.
- **Đính chính duy nhất của P8 (hiển thị, không đổi số đếm):** LIMITS P5 ghi
  s75 "98,2%". Số đếm 1165/1187 là đúng. Tỉ lệ thô 98,1466% làm tròn 1 chữ số
  → 98,1%; analyzer làm tròn 4 chữ số trước (0,9815) rồi ×100 → 98,15% →
  hiển thị 98,2%. Cả hai đều từ cùng một số đếm; P8 ghi rõ để khỏi nhầm là
  lệch dữ liệu.
- **(b) stall playhead — P8 tính lại đúng phương pháp cửa sổ:** cặp mẫu có
  wall-diff trong [25 s, 30 s]: tiến nhỏ nhất s77 **10,67 s**, s78 **11,13 s**;
  cặp [8 s, 10 s]: **4,47 s / 5,77 s** — khớp đúng 2 chữ số với LIMITS.
  (P8 lưu ý: cách tính "mọi cặp ≤30 s" cho số nhỏ hơn hẳn — 1,57/1,10 s —
  vì nó gồm cả cửa sổ cụt ở cuối lượt; cách tính đúng là cửa sổ ~30 s đầy.)
  0 episode stall; s76 không có thư mục (MISSING) ✓; DEFERRED đúng 2 dòng ✓.
- **(a2)/(c):** điểm gãy VẪN MỞ, biên GIỮ 9,59 (s71); s73 không phải hiệu ứng
  build (s75 GIỮ trên build 03bf029f, gần hệt s74 trên build cũ) ✓.
  Đói lock: p1 giữ lock ~35 phút làm s76 timeout acquire 900 s ×2 — P8 xác
  nhận DEFERRED ×2 trong driver log; đây là pattern đói lock mới (xem §10.3).

## 6. P6 — EPERM: probe #32, reboot #44, mù #31 không đóng hoàn toàn

- **Checklist:** log probe v2 **88 dòng** ✓ (86 sau N6 + 2 dòng checklist);
  heartbeat pid=12736, ts 11:37:14Z, boot 6ad1ef9e, **n=32** ✓;
  `status` đầu DEAD/STALE (age 10.575 s), `once` probe #32 ok=2 fail=0,
  `status` lại ALIVE ✓.
- **Quét writeFileSync lần 19:** scan-meta NEWSTD 187 file / 637 dòng,
  R7b 204 / 662, copies 17 / 25 ✓; **P8 cộng lại từ `wfs-*.txt`: 637, 662,
  25 — 637+25=662, chênh 0, lần thứ 19 liên tiếp** ✓.
- **Gap:** #42→#43 = 08:05:10Z → 08:53:37Z = **2907 s = 48'27"** ✓;
  cửa sổ mở mù #31: 10:23:54Z → 10:32:49Z = **535 s = 8'55"** ✓.
  **P8 chạy lại `recount-p6.py` → output IDENTICAL với `recount-p6.txt`**
  (CERT n=23, toàn chuỗi n=38, trung bình 1h56'06", trung vị 1h58'30") ✓.
- **EPERM:** grep lại đúng 89 file log trong `blind31-logfiles-hf.txt`:
  "sóng EPERM vẫn bật" 0, "CẢNH BÁO 10 phút" 0, "Operation not permitted" 0,
  "sóng EPERM đã tắt" **10** (dương tính giả launcher đã biết) ✓.
- **Lưu ý P8 về chứng nhận gap #42→#43:** P8 kiểm được số học, poller N8,
  và recount chạy lại khớp 100%. Nhưng bản thân việc "chứng nhận xuyên mù"
  (đoạn C mù #30 + đoạn A mù #31 đều đóng → khoảng (08:05:10, 08:53:37)
  không chứa cửa sổ mở) là quyết phương pháp của P6 — P6 đã ghi rõ chờ
  parent xác nhận; P8 không tự phê chuẩn hay bác bỏ, chỉ ghi lại rằng cơ sở
  số học là đúng. Nếu parent không đồng ý thì hạ về cận trên, CERT về n=22.
- RAM lúc probe 506.972 kB (~0,49 GB) — mẫu thấp nhất chuỗi N6/P6; max trong
  mù #31 từ log sibling 1182 MB. Birefnet KHÔNG chạy (0 lần thành công).

## 7. P7 — Hạ tầng: O8 Chromium, postboot #44, vá poll mẫu

- **O8 Chromium (P7 chạy):** đếm lại report JSON: **21 results, 21 ok,
  0 fail** ✓; S7 mask Δx=0,112 / bóng Δx=0,113 ✓; ENOSPC 0 lần ✓.
  Headroom boot #44: probe STOP ở **1507** ✓ (thấp hơn #43: 1511, #42: 1534).
- **Postboot #44:** log PASS đủ mục (wrapper K1, 5 lib, GST 269=269, apt 10/10),
  kết luận "DU DIEU KIEN" ✓. Tham chiếu script đã cập nhật #42 → #44 ✓.
- **Vá poll:** 3 file đã sửa đều chứa `[W]ebProcess` ✓; poll-p4.sh giữ
  `grep -v "grep -E"` ✓. **P8 chạy lại `p7-poll-verify-fixed.sh`: exit 0,
  0 dòng grep tự khớp, cả 4 pipeline (M5/L7/N4/P4) bắt được blocker giả +1**
  — đính chính N4 được xác nhận độc lập: chỉ M5 tự đếm thật, L7 không
  (nhờ `grep -v grep` đứng trước).
- P7 không đổi production (chỉ sửa 2 script harness + 1 file chữ trong repo:
  clicktest Chromium + postboot-check + LIMITS).

## 8. Kiểm chứng cây gộp (P8 chạy sau khi 7/7 xong)

Cây gộp = repo sau khi P1–P7 stage xong (không luồng nào còn chạy).
`preview.tsx` md5 **03bf029f** trước = sau verify. Boot lúc verify:
#44 (suite offline) → **reboot #45 = 13:17:42Z** (`cd4cac0b`) → O8 trên #45.

### 8.1 Suite offline (script `round113-p8-verify.sh`, copy N8, log `round113-p8-suites.log`)

Tất cả **27 mục exit 0** (chạy 13:13–13:17Z, boot #44):

| Mục | Kết quả |
|---|---|
| tsc web / tsc desktop | exit 0 / exit 0 |
| vite build | PASS |
| playheadHold90R2 (hold) | **93 passed** (84 cũ + 9 N1) |
| playheadPacing54K9 (pacing) | **19 pass, 0 fail** |
| ghostBlend.probe | **15/15** ✓ (đếm dòng ✓ trong log) |
| driftConfirmSkip103E4 (test E4) | **5/5 PASS** |
| css60 / css61 | **60/60 / 60/60** |
| P7-esbuild (i18n audit) | **8/8 pass** |
| orphans (binOrphan60Q7) | **17 pass, 0 fail** |
| r6 (i18n check) | **PASS** |
| U4 failfast | **141 pass, 0 fail** |
| test-preview-engine.sh | **354 assertions pass** |
| Khác (previewEngine, seek 21, seekSkipRender 9/9, previewLoop 20, rvfcClipWindow, media-tests 3/3, deint-verdict ×2, armHeld, vite-diagnosis-regex, xvfb-lock) | exit 0 |

### 8.2 Reboot #45 giữa verify (13:17:42Z)

- Suite offline xong 13:17:02Z trên boot #44; reboot #45 = **13:17:42Z**
  (`uptime -s` 2 lần + btime/journal/wtmp/`ps` systemd PID 1 START 13:17:52 —
  P8 đo trực tiếp lúc 13:20Z). Gap #44→#45 = **2h24'11"** (10:53:31Z →
  13:17:42Z) — trong dải chứng nhận [19'07", 3h14'08"], không phá sàn.
  Số thứ tự #45 TẠM THỜI (mù #31 chưa đóng; mù #32 bắt đầu từ probe #32
  11:37:14Z — reboot #45 nằm trong mù #32, chờ probe #33 đóng).
- Không mất dữ liệu verify: suite log đã ghi xong trước reboot; poller P8
  đã xong từ 13:02Z; preview.tsx md5 không đổi.

### 8.3 O8 Chromium 21/21 (P8 chạy lại trên cây gộp, boot #45)

- Driver `p8-o8-driver.sh` (lock đóng băng md5 `fd21193c`, vite tạm
  `watch.ignored`, DISPLAY :197, port 5554): acquire lock ngay, vite lên
  attempt 1, chạy 13:18:25–13:19:20Z.
- **`== KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note ==`, exit 0**;
  report JSON đếm độc lập: 21 results, 21 ok ✓. S7 mask Δx=0,112 / bóng
  Δx=0,113 ✓. **ENOSPC 0 lần** (headroom boot #45 lúc đo: 1401, rồi 1307
  cuối ngày — vẫn < ~1586 vite thường; vite tạm bắt buộc).
- Lưu ý: P7 cũng đã chạy O8 Chromium 21/21 trên cùng cây (boot #44).
  P8 chạy lại trên boot #45 sau reboot — cả hai đều PASS.

### 8.4 O8 WebKit 21/21 (P8, boot #45 — sau 2 lần thử + vá hạ tầng)

- **Lần 1 (13:19:20Z): CHƯA CHẠY — lỗi driver của P8, không phải lỗi sản phẩm:**
  `p8-o8-driver.sh` dùng `set -u` trong khi `LD_LIBRARY_PATH` chưa set →
  `line 39: LD_LIBRARY_PATH: unbound variable`, driver thoát ngay, lock đã
  nhả sạch. P8 sửa thành `${LD_LIBRARY_PATH:-}` (file trong hidden_files,
  không đụng repo).
- **Postboot #45: FAIL 8 lần liên tiếp (13:20–14:00Z, mỗi 5 phút):**
  libs thiếu (libevent/libEGL/libavif/libdw/libevdev), thư mục GST hệ thống
  không tồn tại, apt thiếu 10 package. **apt replay KHÔNG chạy:**
  `ps` không thấy tiến trình apt/dpkg nào; danh sách thiếu giống hệt nhau
  cả 8 lần. Khác boot #39 (replay ~17 phút): lần này replay không tới sau
  43 phút. Nợ M8 §9.4 (kẹp khoảng replay chính xác) vẫn mở — lần này khoảng
  là ">43 phút, chưa xong".
- **`--repair` (14:06Z):** symlink GST hệ thống → debroot đã tạo lại
  (269 file) ✓; nhưng bước apt **FAIL** — `/tmp/l8-postboot-apt.log`:
  `Unable to locate package` cho cả 10 package (apt package lists trống
  sau reboot; script --repair không chạy `apt-get update` trước).
  P8 KHÔNG chạy `apt-get update` tay (vượt phạm vi repair của script;
  ghi nợ cho đợt sau — xem §10.11).
- **Lần 2 (14:07Z): PASS.** Nhờ symlink GST → debroot, WebKit launch 27.2
  và decode được: **`== KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail,
  0 note ==`, exit 0, 14:07:59Z**; report `o8w-clicktest-report.json` đếm
  độc lập: 21 results, 21 ok ✓. S7 (WebKit): mask Δx=0,194 / bóng Δx=0,197
  (kỳ vọng canvas 0,194) ✓. ENOSPC 0.
- **Kết luận O8 đợt 113:** cả hai engine 21/21 trên cây gộp, boot #45.
  WebKit PASS nhờ đường debroot (symlink GST), KHÔNG nhờ apt hệ thống —
  postboot-check vẫn FAIL về apt/libs hệ thống tại thời điểm verify xong.
  Đây là nợ hạ tầng, không phải lỗi sản phẩm.

## 9. Batch đợt 113 + lũy kế chờ push (đếm lại từ đĩa, P8)

| Đợt | Batch | Entry | File duy nhất |
|---|---|---|---|
| 111 | 10 | 21 | 21 |
| 112 | 9 | 21 | 21 |
| **113** | **7** | **16** | **16** |
| **Lũy kế 111+112+113** | **26** | **58** | **51** |

- Đợt 113: P1 2 / P2 5 / P3 2 / P4 1 / P5 2 / P6 1 / P7 3 = 16 entry, 16 file
  duy nhất, 0 trùng lặp trong đợt, 0 workflow `.github/*`, 0 binary.
  2 file trùng với đợt 111+112 (`clicktest-87o8-mask-track-headed.mjs`,
  `vcut-webkit-postboot-check.sh` — P7 sửa tiếp bản N8/L8 đã stage).
- File >37.768 B trong đợt 113 (cần `ENABLE_PRIVSEP=0` khi push):
  probe113p1.mjs (47.541), probe113p3-frame-parity.mjs (58.391),
  probe113p5-frame-parity.mjs (48.908), webkit_blob_flaky_113p2_2mib.mjs
  (72.791), webkit-blob-flaky-113p2-2mib.json (63.794),
  PHASE9_ROUND113_P6_EPERM_LIMITS.md (52.805), clicktest-87o8-...mjs (70.868).
- **Chưa lên (ngoài batch):** 1 file oversize 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (vượt giới hạn 2,8 MB/lần
  đẩy, từ đợt 112); dữ liệu thô + prereg + analyzer của P1–P7 ở
  `hidden_files/round113-p*/` (không stage, theo tiền lệ); 2 file JSON lag
  lớn của P2 (9,7 + 10,4 MB, không stage).
- **Batch verify P8:** `phase9-round113-p8-verify.txt` — 1 entry:
  `docs/PHASE9_ROUND113_LIMITS.md` (file này). P8 không đổi file repo nào
  khác (chỉ đo + verify). Lũy kế với batch P8: **27 batch / 59 entry /
  52 file duy nhất** chờ user push (cộng 1 file LIMITS gộp mới).
- **KHÔNG push.** User tự push sau từ main chat.

## 10. Nợ mở sang đợt 114 (cập nhật từ §10 đợt 112)

1. **E4 — cần 1 đợt xác nhận tải cao (nợ lớn nhất đợt này).** P1 chứng minh
   0 CAP trên tải thấp rất vững (0/664 gộp, p=0,000696) nhưng 0/8 lượt đạt
   tải [8, 30]. Cần nguồn tải thật không làm đói browser (hog `yes` đã chứng
   minh không dùng được — browser chỉ còn ~1/45 fair-share; tải nền của các
   luồng nặng đang chạy là ứng viên, hoặc dụng cụ tải mới). Giữ ĐÓNG CÓ ĐIỀU KIỆN.
2. **Ring 8 MiB — đo lag xong, production vẫn bế tắc (giữ đề xuất M2/L2/N2).**
   P2 đã đo trực tiếp: splice ⟺ số byte take vượt wrap (33/38, 5 ca còn lại
   ≥95,4%); lag chỉ là dấu vết burst. 3 rào cản kiến trúc không đổi (shim
   không ship; repo không có API đổi ring queue2 của WebKit; không mức cố định
   nào phủ video user). Hướng duy nhất còn mở: can thiệp WebKit (cần quyết riêng).
   Nợ mới: đo lag slot trong ring (cần hook mới) nếu muốn đi sâu hơn — không
   bắt buộc vì wrap-count đã giải thích đủ.
3. **Zombie — giả thuyết chuyển clip ĐÃ XÁC NHẬN, chuyển sang tìm cơ chế.**
   Mẫu gộp N3+P3 5/5 straddle p=4,2e-05. Đợt sau: đo pump lifecycle / seek /
   decode quanh biên 3 s để tìm nguyên nhân gốc (pump kill/restart? seek?
   decode?). Không tích mẫu nữa. Tần suất dạng mạnh toàn chuỗi 6/16 lượt.
   Stall 5 s biên 60 s: 0/9 lượt gộp (L3+M3+N3+P3) — hiếm/không ổn định.
   draws/s dao động giữa các lượt chưa rõ nguyên nhân; bracket vẫn phồng dù
   state100 dày; sampler thưa (state100 median 98 ms thay vì 10 ms đặt).
4. **Điểm gãy tải — VẪN MỞ.** Biên GIỮ 9,59 (s71). s76 (70 clip) chưa chạy
   được do đói lock; cần cửa lock cho lượt dài (xem mục 5). Playhead kẹt ở
   biên clip: 0/2 lần thử (s77/s78) — sự kiện hiếm, hạ ưu tiên nếu s76 cũng 0.
   Dị thường s73: ĐÃ GIẢI QUYẾT về phía build (s75 GIỮ trên build mới).
   Chỉ số đói pump tức thời (tick rate / tỉ lệ skip-stale-frame) là ứng viên
   bar dự báo — cần đăng ký riêng đợt sau. Element chết format error trong
   s77 (pool giữ element lỗi) — vệ sinh pool, không ưu tiên cao.
5. **Đói lock giữa các luồng (MỚI, đợt 113).** p1 giữ lock cả chuỗi f1–f3
   trong lúc chờ tải nền (~35 phút) làm P5 mất 2 cửa acquire 900 s; P7 thắng
   race mkdir sau khi P3 được nhả tay (lock không có FIFO). Đề xuất parent xem:
   holder nhả lock giữa các lượt (mẫu N5/P5), hoặc acquire timeout dài hơn
   cho lượt dài, hoặc tách dial-chờ-tải ra khỏi vùng giữ lock. P5/P7 không tự
   đổi protocol giữa đợt.
6. **Ngưỡng WebKit ≤60 ms — GIỮ theo N4 nhưng MỎNG, vẫn cần 1 lượt yên xác nhận.**
   P4 không đạt lớp B (P3 chen giữa). Lượt sau: chạy ĐẦU đợt hoặc khi các luồng
   khác đã xong; bắt đầu với RAM avail ≥ ~1 GB (P4 chỉ có 522 MB, warm-up
   86,5 ms); cùng cây 03bf029f; đăng ký trước phân rã tickCost theo dải wallMs.
   Sự kiện stale-ghost seq 220–223 (pixels đứng yên frame 26 ~0,42 s, lag
   +6..+12f) — theo dõi ở lượt yên sau trên cùng cây.
   Định nghĩa lớp B nên sửa (phân biệt ghi file nhẹ với phân tích nặng) hoặc
   giữ luật chặt + xếp lịch riêng — quyết thuộc parent.
7. **Mù #31 KHÔNG ĐÓNG HOÀN TOÀN (mới) + mù #32 đã mở.** Mù #31: 1 cửa sổ mở
   8'55" (10:23:54Z → 10:32:49Z); 2 reboot đã chốt (#43 08:53:37Z, #44
   10:53:31Z) + tối đa 1 ẩn. **Mù #32 bắt đầu 11:37:14Z (probe #32) và đã
   chứa reboot #45 (13:17:42Z)** — probe #33 đối chiếu từ mốc này.
   Gap #44→#45 = 2h24'11" là cận trên cho tới khi mù #32 đóng.
   Gap #42→#43 = 48'27" ĐƯỢC CHỨNG NHẬN theo khoảng (chờ parent xác nhận
   cách chứng nhận xuyên mù — xem §6).
   Mù #22 (mức tin cậy hạ) + #24/#26/#28/#29/#30 chờ user quyết (không đổi).
   Reboot #16 vẫn mở (kẹp ~4'). Đề xuất cron riêng 10 phút vẫn chờ user quyết.
8. **Postboot #45 + apt replay (MỚI, nợ hạ tầng nóng).** Sau reboot #45,
   apt replay KHÔNG chạy (0 tiến trình apt/dpkg; 8 lần check 43 phút không
   đổi). `--repair` vá được symlink GST → debroot nhưng apt install FAIL
   (package lists trống — script không chạy `apt-get update`). Đợt sau:
   (a) cập nhật tham chiếu postboot-check #44 → #45; (b) quyết xem có cho
   `apt-get update` + install trong --repair không, hay chờ replay hệ thống;
   (c) chạy postboot-check sớm (5–10 phút sau boot) để kẹp khoảng replay
   chính xác (nợ M8 §9.4 vẫn mở). WebKit O8 đợt này PASS nhờ debroot, không
   nhờ apt hệ thống — postboot vẫn FAIL về apt/libs tại thời điểm verify xong.
9. **Headroom inotify tiếp tục rơi:** #42: 1534 → #43: 1511 → #44: 1507 →
   #45 lúc đo: 1401 → cuối verify: 1307. Vite thường (~1586 watch) KHÔNG
   chạy được trên boot này; vite tạm `watch.ignored` vẫn bắt buộc.
   Đo lại headroom sau reboot tiếp theo trước khi chạy vite thường.
10. **Seek/preload UX (P2 B3):** preload-wait chạm trần 20 s mà không full
    buffer 2/2 (tái hiện M2/N2EL) — điều tra riêng vì sao element kẹt ở trần
    buffer khi paused. Seek tự nó nhanh (0,44 s) nên không phải ưu tiên sửa seek.
11. **G1 deinterlace + các nợ đứng khác:** G1 chờ user quyết; E6 ĐÃ ĐÓNG;
    F6' ĐÃ ĐÓNG (ngưỡng ≤60 ms mỏng, xem mục 6); birefnet 0 lần thành công
    (chỉ thử lại khi RAM ≥ 6 GB); TTS 39 CẤM kiểm lại; ci-security.yml vẫn
    403 chờ user (repo không có CI chạy thật); release gate giữ nguyên
    (không release/tag cho tới khi ngang/hơn CapCut thật).
12. **Nợ nhỏ từ verify P8:** (a) `cap-pattern-rows.json` của P1 chỉ chứa
    2+2 — đợt sau ghi rõ trong LIMITS rằng attempt 1 nằm ở file outofband;
    (b) analyzer P5 làm tròn kép 98,15% → hiển thị 98,2% (số đếm đúng, chỉ
    ghi chú để khỏi nhầm); (c) `poll-p4.sh` vẫn mang pattern trần `WebProcess`
    (được `grep -v "grep -E"` bảo vệ) — luồng sau copy mẫu M5/L7 đã vá;
    (d) driver O8 của P8 từng lỗi `set -u` + `LD_LIBRARY_PATH` chưa set —
    đã sửa trong hidden_files, không ảnh hưởng repo.

## 11. Hồ sơ kiểm chứng P8 (đợt 113)

| Mục | Kết quả | Nguồn |
|---|---|---|
| Poll P1–P7 | Đủ 7/7 lúc 13:02:10Z (poll #18, bắt đầu 11:37:05Z) | `round113-p8/poll-p8.log` |
| Recount độc lập | `recount-p8-all.py` → `recount-p8-all.txt` (exit 0); Fisher riêng bằng `math.comb`; wrapcheck chạy lại 33/38; recount-p6.py chạy lại IDENTICAL; poll-fix P7 chạy lại exit 0 | `round113-p8/recount-p8-all.py`, `wrapcheck-*-rerun.txt` |
| Suite cây gộp | 27/27 exit 0 (tsc 0/0, vite build, hold 93, pacing 19, ghostBlend 15/15, E4 5/5, css60/61 60/60, P7 8/8, orphans 17/17, r6 PASS, U4 141/141, preview-engine 354) | `round113-p8/round113-p8-suites.log` |
| O8 Chromium | 21/21, exit 0, 13:19:20Z, boot #45 | `round113-p8/p8-o8.log`, `o8-chromium/o8-clicktest-report.json` |
| O8 WebKit | 21/21, exit 0, 14:07:59Z, boot #45 (sau vá symlink GST; lần 1 lỗi driver P8, postboot #45 FAIL apt) | `round113-p8/p8-o8.log`, `o8-webkit/o8w-clicktest-report.json`, `p8-postboot-b45-*.log` |
| Reboot #45 | 13:17:42Z, boot_id `cd4cac0b-17a6-408d-8c4e-be163f96dc61`, gap #44→#45 = 2h24'11" | `uptime -s` trực tiếp, journal/wtmp/ps |
| Batch verify | `phase9-round113-p8-verify.txt` (1 entry: LIMITS gộp này) | `~/workspace/repo-1-push/paths-loop/` |
| Cờ done | `hidden_files/round113-p8-done` (tạo sau khi LIMITS + batch xong) | — |

Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round113-p8-verify.txt`
— chứa LIMITS gộp này (1 file text).

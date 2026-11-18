# PHASE9_ROUND116_LIMITS — Gộp đợt 116 (verify độc lập S10, lượt cron 03:35 +07 15/11/2026)

> Đợt 116: 10 luồng S1–S10 đóng nợ đợt 115 (QUYẾT PARENT 15/11, xem
> docs/PHASE9_ROUND115_LIMITS.md §10). S10 verify độc lập: poll cờ done
> mỗi 5 phút, bắt đầu recount khi đủ 7/9 (không chờ 9/9 — bài học đợt 115
> R10 hết giờ), chạy suite cây gộp 27 mục song song với recount, O8 cả 2
> engine, đếm lại batch từ đĩa.
>
> **Trạng thái lúc S10 gộp (23:0xZ 14/11/2026): 8/9 luồng đã xong
> (S2, S3, S4, S5, S6, S7, S8, S9 — S6 về lúc 23:03:41Z, sau khi S10
> đã viết xong bản gộp đầu; §6 đã cập nhật theo S6). Chỉ còn S1 CHƯA
> XONG** — chưa có cờ done, chưa có batch; LIMITS S1 đã có trên đĩa
> (phân tích offline xong, tái hiện chưa đo). Phần S1 dưới đây là tạm,
> chờ gộp muộn.
>
> **Kết quả gộp: verify 8/9 — 8/8 khớp số headline, 2 đính chính (S2
> resid-share; tổng lũy kế chờ push). Cây gộp XANH: suite 27/27 exit 0;
> O8 21/21 Chromium + 21/21 WebKit.** KHÔNG push. KHÔNG release/tag.

## 0. Kiểm chứng gộp của S10

- **Poll:** poller S10 (setsid, 5 phút/lần) — poll #1 0/9 (21:06:42Z);
  5/9 lúc 21:46:43Z (S2, S4, S5, S7, S8); 6/9 lúc 22:37:53Z; **7/9 lúc
  22:48:05Z** (thêm S3, S9) — waiter 7/9 về, S10 bắt đầu recount + suite
  ngay; **8/9 lúc 23:03:41Z** (thêm S6 — S10 recount bổ sung ngay trong
  lúc viết gộp). Thiếu: S1. Log: `hidden_files/round116-s10/poll-s10.log`.
- **Reboot #49 = 21:46:46Z** (boot_id `9c6b5543-…`, gap #48→#49 =
  2h03'00" — trong dải chứng nhận, không phá sàn 19'07"). Reboot giết
  poller S10 #1 + waiter #1; cả hai đã chạy lại (poller#2, waiter#2).
  Mù #34 đã đóng (S7) nên #49 mở mù #35 — chờ probe đợt 117.
- **Cây:** `preview.tsx` md5 `03bf029f…` trước = sau mọi lượt S10
  (suite, O8). S2 là luồng duy nhất sửa production (fix H2
  `9b724e69`), đã revert về đúng `03bf029f`; fix giữ dạng patch.
- **Suite cây gộp 27/27 exit 0** (script verify R10, chạy 22:48:52–
  22:52:41Z, boot #49, RAM avail 489 MB lúc bắt đầu, dưới lock vite v2
  `VITE_LOCK_AGING_S=600`, giữ 0 s chờ): tsc web 0, desktop 0; vite
  build PASS; playheadHold90R2, pacing, previewEngine, seek,
  seekSkipRender86N3, previewLoop50F2, ghostBlend 15/15,
  rvfcClipWindow102D3, driftConfirmSkip103E4, css60/61 60/60, P7 8/8,
  orphans 17/17, r6, U4 141/141, media-tests, media-retry96X3,
  media-watchdog96X3, deint-verdict ×2, armHeld99a3,
  vite-diagnosis-regex, xvfb-lock, test-preview-engine.sh 354
  assertions pass. Log: `hidden_files/round116-s10/round116-s10-suites.log`.
- **O8 21/21 Chromium + 21/21 WebKit** (driver S10, chạy 22:57–22:59Z,
  boot #49, lock v2 giữ 107 s): Chromium exit 0, `KẾT QUẢ CLICK-TEST
  O8: 21/21 pass, 0 fail, 0 note`; WebKit exit 0, `21/21 pass, 0 fail,
  0 note`. Điều kiện vào: S8 báo postboot #48 PASS + S10 tự kiểm
  postboot #49 check-only (wrapper/libs/GST 269 file/apt 11/11 đều
  PASS, kết luận ĐỦ ĐIỀU KIỆN chạy WebKit) — log
  `hidden_files/round116-s10/s10-postboot-49-check.log`. RAM avail lúc
  O8 ~880–1135 MB. LƯU Ý VẬN HÀNH: lần chạy O8 đầu tiên của S10 thất
  bại acquire sau 1 s vì driver copy từ R10 còn `W=$HF/round115-r10`
  (ghi nhầm log/lock vào thư mục R10 + lock script không tồn tại ở đó)
  — đã sửa `W` về round116-s10, dọn file lạc khỏi thư mục R10, chạy lại
  OK. Lỗi của S10, không phải của cây.
- **Recount độc lập:** S10 đếm lại từ JSON thô bằng script riêng
  (`hidden_files/round116-s10/recount-s10-part1.py` + đếm trực tiếp +
  chạy lại analyzer lag5 của Q5 trên JSON S6), không ghi vào thư mục
  luồng, không tin mù LIMITS. Kết quả từng luồng ở §1–§9. Tổng kết:
  **8/8 khớp số headline; 2 đính chính** (xem §2 và §11).

## 1. S1 — E4 stall r1f3 att2: CHƯA XONG (phân tích offline xong, tái hiện chưa đo)

- **Kết quả gọn (theo LIMITS S1, S10 kiểm lại từ analyzer output):**
  Stall r1f3 att2 KHÔNG phải cơ chế zombie Q2 (không biên clip, main
  thread không stall, chỉ 1 drift re-seek được đếm, các tick bỏ vẽ là hệ
  quả N3 của seek). Nó là **một drift re-seek chậm/kẹt của decoder**:
  element kẹt `seeking=True`, ct đóng băng 2,4667, readyState=4,
  ≥5771 ms chưa xong (quan sát bị cắt).
- **Kiểm lại S10 (từ `analyze-s1-r1f3att2.txt`):** r1f3 seeking run
  samples 17..39, relMs 8330..14101, dur ≥5771 ms, ct=2,467 đóng băng,
  rs=[4] — khớp xác minh độc lập của parent đợt 115 (28 tick đóng băng,
  span 5771 ms). **Đính chính quan trọng của S1 ĐƯỢC XÁC NHẬN:**
  r1f4 (lượt HỢP LỆ tải cao) cũng stall sau steady-close — seeking run
  samples 25..32, relMs 9267..11675, dur ≥2408 ms (≈2,4–2,6 s), ct=3,667
  đóng băng, rs=[4]. Kết luận R1 "stall-watch sạch trên tập hợp lệ" là
  SAI (analyzer đợt 115 đo thiếu do cửa sổ đo + publish lag). **Đường
  "loại r1f3att2 ngoài dải để tuyên E4 ĐÓNG ĐẦY ĐỦ" bị đóng lại bởi
  chính r1f4.**
- **Chưa xong:** phần tái hiện có kiểm soát (lượt A gop250 loadN=0,
  lượt B gop30 loadN=0, cửa sổ quan sát seek 60 s) ĐANG CHỜ cờ cây S2
  (EDITING) — chưa đo. S1 chưa có cờ done, chưa có batch. LIMITS S1
  (`docs/PHASE9_ROUND116_S1_E4STALL_LIMITS.md`, 18.598 B) đã có trên
  đĩa nhưng là bản tạm (sẽ cập nhật sau tái hiện).
- **Hệ quả cho E4:** E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN (QUYẾT PARENT 1, 15/11).
  Điều tra stall chưa kết luận được cơ chế mới — chỉ loại được zombie
  Q2 và loại được đường tuyên đóng đầy đủ bằng cách loại r1f3att2. Nợ
  sang đợt 117: tái hiện có kiểm soát + xác định stall này có thuộc
  phạm vi E4 không.

## 2. S2 — Zombie hướng sửa H2: VERDICT BỎ (giữ) + LoAF chốt attribution

- **Verdict BỎ — S10 đồng ý.** H2 giới hạn tần suất capture tối đa
  1 capture/250 ms/clip, đồng hồ chung cả đường pump lẫn tick. Throttle
  ràng thật nhưng capMs median không đổi → không giữ.
- **Recount S10 (đếm trực tiếp từ `frame-parity-results.json`, cặp mini
  6-clip không-hog — bằng chứng quyết định): KHỚP HOÀN TOÀN.**
  Captures 238→33 (−86,1%); rate-limited 0→190; capMs median 4,8→4,9
  (**+2,1%**, bar −40%); longtask ≥200 ms 0/0 cả hai (bar (b) không có
  gì để giảm). Cặp A/B 24-clip chính BỊ NHIỄM (holder 2 lượt đi ngược
  nhau: baseline xả hog 4→0, fix tăng hog 4→8) nên không dùng để quyết
  — S10 xác nhận dấu nhiễm từ số thô: fix capMs median 74,3 (baseline
  4,8), longtask ≥200: 117 vs 8. Cây đã revert về `03bf029f`; fix giữ
  dạng patch `s2-throttle-250ms.patch`.
- **Attribution LoAF — S10 xác nhận phần lõi, đính chính phần số:**
  longtask lớn không khớp pump có LoAF chồng lấn **3/3 baseline +
  62/62 fix = 100%** (S10 chạy lại đúng thuật toán analyzer);
  script trội là **`loop` của preview.tsx** (BASE 1002 ms, FIX
  12.068 ms — áp đảo các hàm còn lại). Kết luận "nửa longtask chưa rõ
  nguồn là `loop` (rAF), KHÔNG phải GC" đứng.
- **ĐÍNH CHÍNH S2 (duy nhất trong đợt ngoài §11):** LIMITS S2 ghi
  resid-share median **0,04 / 0,30** và top `loop` FIX **13.028 ms**,
  performWorkUntilDeadline **199 ms** — nhưng file output của chính
  analyzer trên đĩa (`s2-ab-analysis.txt` dòng 50–53) ghi **0.0 / 0.0**,
  `loop` FIX **12068 ms**, performWork **193 ms**; S10 đếm lại độc lập
  cũng ra 0,0 / 0,0. Số trong LIMITS không khớp output analyzer (LIMITS
  viết 21:32:19Z, SAU file analyzer 21:23:16Z — không rõ nguồn số
  0,04/0,30). **Số đúng: resid-share median 0,0 / 0,0.**
  Không đổi verdict (BỎ H2 + attribution `loop` vẫn đứng).
- **Chốt chặn:** file `round-in-progress.md` tồn tại lúc S2 bắt đầu
  (bản cũ đợt 115) — S2 đã xóa theo đúng chỉ dẫn trong nó (điều kiện
  xóa đã thỏa: parent đã gộp muộn + báo cáo đợt 115). Parent sau đó
  tạo file mới cho đợt 116 lúc 21:11:17Z (xem §11).

## 3. S3 — Điểm gãy tải: s78b SẠCH, GIỮ ở tải 21,07 — biên GIỮ dời 19,63 → 21,07

- **Recount S10: KHỚP HOÀN TOÀN.** Từ
  `chr-code-blur-s78b/frame-parity-results.json`: 1957 blendTick,
  median 0, mean 0,659, **80,9% trong ±1** (1583/1957), **≤−2: 2 tick
  (0,10%)**; loadSamples n=180, **load1 mean 21,07, median 11,73,
  max 58,17** — khớp từng số với LIMITS + output analyzer
  (`analyze116s3b.txt`). (Lưu ý phương pháp: load1 mean 21,07 lấy từ
  loadSamples trong JSON; file sampler của driver n=241 cho mean 24,16
  là tập mẫu khác — không mâu thuẫn.)
- **Caveat giữ nguyên:** GIỮ SÁT NGƯỠNG (80,9% so với ngưỡng 80% —
  chỉ hơn ~17 tick) và tải HAI ĐỈNH (trung vị load1 11,73 trong khi
  mean 21,07; 51% mẫu <12, 27% mẫu >40). Điểm gãy VẪN MỞ (0 lượt GÃY).
- **Luật dial MỚI ĐẠT 2/2 lượt** (attempt 1: 34,38; attempt 2: 39,90 —
  cả hai cần hog-runtime ≥90 s + cửa sổ 600 s). Bar (c) vùng xám lần 4
  (tickRate 2,19/s, skipStale 31,52%). Bar (b) 0/6. Reboot #49 cắt
  attempt 1 (loại hoàn toàn); attempt 2 (s78b) sạch, hợp lệ.
- Batch: `phase9-round116-s3-loadbreak.txt` (2 entry: probe 48.898 B +
  LIMITS 42.806 B — cả hai >37.768, cần ENABLE_PRIVSEP=0 khi push).

## 4. S4 — Migration lock fairness v2 nguyên tử: default AGING 600 đã đổi

- **Đã làm:** đổi mặc định `VITE_LOCK_AGING_S` 1800 → 600 ở 3 chỗ
  trong `apps/web/scripts/vcut-vite-lock-v2.sh` (comment §2, doc biến
  môi trường, `${VITE_LOCK_AGING_S:-600}` trong `ticket_sort_key`
  dòng 254 — S10 grep xác nhận). Không đổi timeout acquire (1800 s),
  cooldown (15 s), poll (2 s). v1 frozen md5 `fd21193c` nguyên vẹn
  (S10 kiểm lại).
- **Verify S10:** test suite `test-vite-lock-v2.sh` **3 lần liên tiếp
  9/9** (S10 đếm `PASS=9 FAIL=0` ×3 trong
  `test-v2-after-600.log`). Batch 2 entry (script v2 + LIMITS).
- **Verdict S4: CHƯA ĐỦ ĐIỀU KIỆN ĐỂ QUYẾT NGAY** v2 làm mặc định
  đợt 117+ — không còn lỗi chặn, nhưng còn thiếu 3 điều kiện: (1) mẫu
  waiter thật còn mỏng; (2) vá C (timeout wall-clock) chưa đo dưới tải
  hog; (3) aging 600 chưa quan sát trực tiếp (chưa waiter nào chờ
  >600 s). **Bằng chứng thêm từ S10:** suite + O8 đợt này dùng v2,
  acquire chờ 0 s cả hai lần, không DEFERRED, không STALE-LOCK — nhưng
  đó là mẫu tải nhẹ, không bù được điều kiện (3). Giữ v1 frozen làm bản
  sao lưu. Nợ sang đợt 117: 1 waiter timeout (~300 s) dưới load1 >15
  + 1 waiter chờ >600 s.

## 5. S5 — WebKit ≤60 ms: lượt yên XÁC NHẬN LẦN 5 — CHỐT ĐƯỢC NGƯỠNG

- **Recount S10: KHỚP HOÀN TOÀN.** Từ
  `preview-b-f3-flip-webkit-s5-attempt3.json` (20 pass, engine
  webkit): tickCost total **n=570, median 49,5 ms, p90 75,0 ms, min 29,
  max 109**; hậu flip+2000 ms **n=412, median 49,5 ms** — khớp từng số
  với LIMITS + output analyzer (`analyze-s5-tickcost.txt`).
- **Ngưỡng ≤60 ms nay ĐÃ CÓ lượt yên xác nhận** (lần thứ 5, sau 4 lần
  liên tiếp chưa chốt): attempt3 chạy đủ 20/20 pass, probe exit 0,
  21:32:42–21:36:02Z, trên cây `03bf029f`, đạt lớp B mới (gồm B5
  RAM-mid) 5/5 mục. Theo quy tắc prereg (median ≤60 ms trên lượt đạt
  lớp B): **GIỮ ngưỡng WebKit ≤60 ms.** Nợ 5 lượt đã đóng.
- **F6' 100,0% / 100,0% (n=71 ≥30)** — xác nhận lại trên lượt yên này
  (F6' đã đóng từ L7). Stale-ghost: 0 occurrence lag ≥+5f — event P4
  frame-26 và event Q5 seq 282–285 đều không tái hiện trên lượt yên
  sạch (trông như sự kiện đơn lẻ dưới tải/nhiễm, không phải cấu trúc
  của cây). Cơ chế mới đã chứng minh: ghi JSON tăng dần sau mỗi pass
  (20/20 lần ghi partial), timeout wall-clock 120 s/pass không kích
  hoạt (mọi pass ~3,0–3,7 s), RAM giữa lượt min 658 MB, 0 mẫu <500 MB.

## 6. S6 — Ghost stale sau seek: event seek Q5 TÁI HIỆN 4 LẦN — không còn là quan sát đơn lẻ

- **Kết quả chính 1 — event seek tái hiện 4 lần độc lập trong 1 lượt
  nhiễm tải (attempt1): 4/19 snapshot label-0 stale (21,1%; 4/20
  seek).** Đây là lần đầu event seek tái hiện — và tái hiện tới 4 lần
  trong một lượt. Event Q5 KHÔNG còn là quan sát đơn lẻ.
- **Kết quả chính 2 — gộp toàn chuỗi: 5/60 seek stale (8,3%) — toàn
  bộ 5 lần đều trên lượt NHIỄM TẢI** (Q5 1/20 + S6att1 4/20 = 5/40 =
  12,5%); lượt YÊN vẫn 0/20 (R6). H-D (tải là điều kiện cần, cho seek)
  CHƯA bị bác — nhưng cũng chưa được ủng hộ có ý nghĩa thống kê.
- **Recount S10: KHỚP.** Từ `ghostseek-attempt1.txt` (output analyzer
  S6): "(A) snapshot label-0 STALE (M!=0): 4 -> ti le stale/seek =
  4/19 = 21.1%"; delta M−lastDrawn = **0 / +40 / +41 / +41** (S10 tính
  lại từ 4 dòng pass-trước: 70−70, 61−21, 76−35, 68−27). Fisher một
  phía S10 tính bằng `math.comb`: C(40,5)/C(60,5) = **p = 0,1205**
  (LIMITS: p≈0,12); 5/60 = 8,3%, 5/40 = 12,5% — khớp.
- **Kết quả chính 3 — mô hình delta H-A được TINH CHỈNH, không còn là
  "M ≈ frame cuối pass trước":** M − lastDrawn = 0 / +40 / +41 / +41.
  Chỉ 1/4 khớp đúng lastDrawn; 3/4 lệch +40/41. Diễn giải được ủng hộ
  nhất: M = frame decoder yield gần nhất lúc capture, dưới tải decoder
  lệch currentTime với biên độ thay đổi.
- **Kết quả chính 4 — H-C dạng seek BỊ YẾU:** cả 4 snapshot stale đều
  được capture MỚI sau seek (tick mask-direct frameIdx 0, rawCt đã =
  0) mà pixels vẫn là frame cũ — lỗi ở capture/yield, không phải "chưa
  vẽ lại". H-B (E4) bị yếu thêm: stale xuất hiện cả skp=0 lẫn skp=1
  trong cả 4 event (S10 kiểm từ file analyzer: skp=[0, 1] ở cả 4 event).
- **Kết quả chính 5 — event kiểu P4 KHÔNG tái hiện trong attempt1
  (0 occ):** S10 chạy lại analyzer lag5 của Q5
  (`analyze-s5-lag5.py`) trên JSON attempt1 của S6:
  **"(b) lag>=+5f: 37 occurrence" — tất cả 37 đều label 0** (kiểu
  seek), skp 0 và 1 đều có. Tally P4-type giữ nguyên: P4 1 + Q5 0 + R6
  2 rõ + 1 nhỏ + S6 0 (4 lượt). Nuance S10 ghi thêm: M của 4 event là
  70/61/76/68 nhưng danh sách (b) chỉ có M 61/68/76 — event M=70
  không xuất hiện (có thể do luật match |M|==1 của analyzer); không
  ảnh hưởng kết luận P4-type 0 occ.
- **Kết quả chính 6 — mục tiêu ≥80 seek KHÔNG ĐẠT trong lượt này
  (dừng ở 60 seek):** attempt2/3 chết ở gate0 (replay sau reboot #49),
  attempt4/5 chết ở gate A (CPU yên hẳn nhưng RAM ngoài cell kẹt
  ~510 MB, dưới ngưỡng 1024 MB). Không có lượt yên thứ hai để phân
  biệt H-D. Nợ "ghost ≥80 seek" vẫn mở sang đợt 117.
- **Lỗi kiểm cờ của S6 (đã sửa trước khi đo):** `run-s6.sh` bản đầu
  dùng `grep -q 'NO-CHANGE'` trên toàn file cờ — chữ "NO-CHANGE" xuất
  hiện trong câu hướng dẫn của cờ EDITING nên grep khớp sai; S6 hủy
  attempt1 đó lúc 21:27Z (chưa giữ lock, chưa có dữ liệu), sửa script
  thành yêu cầu dòng status đúng là `^status: NO-CHANGE` VÀ md5 đo trực
  tiếp = `03bf029f`, rồi chạy lại. Attempt1 đo SAU khi cờ NO-CHANGE
  xuất hiện, trên cây `03bf029f` — so được trực tiếp với Q5/R6.
- Batch: `phase9-round116-s6-ghostseek.txt` (1 entry: LIMITS S6,
  26.538 B).

## 7. S7 — EPERM: probe #35 + mù #34 ĐÓNG HOÀN TOÀN + WFS lần 22 chênh 0

- **Recount S10: KHỚP.** `once.txt`: probe #35 boot `0c2a9f2f`
  **ok=2 fail=0**, exit 0. `status1.txt`: DEAD/STALE (heartbeat age
  11.982 s, last #34 17:45:02Z, boot `7a0638c4`, exit 1); `status2.txt`:
  ALIVE (n=35, 21:04:50Z, boot `0c2a9f2f`, exit 0). Log v2 tăng đúng
  3 dòng (94 → 97) như prereg dự báo. Checklist P8 §2.3 chạy ĐÚNG 1 lần.
- **Mù #34: 17:45:02Z → 21:04:50Z (3h19'48") — ĐÓNG HOÀN TOÀN.**
  Đoạn A (48 s tới #47) đóng bằng số học sàn + đoạn B mù #33 đã đóng;
  đoạn B (1h57'56", boot #47) đóng bằng poller R5 v2 một tiến trình duy
  nhất (21 poll, 300/301 s đều) + dấu boot tươi + session bắc qua;
  đoạn C (sau #48) đóng bằng đo uptime trực tiếp ×2 + probe #35 + dấu
  boot tươi S3/S5/S8/S10. **Đây là mù thứ ba liên tiếp đóng hoàn toàn**
  (#32, #33, #34) — lần đầu có 3 mù đóng liên tiếp kể từ #27. S10 kiểm
  lại các cross-check N6/P6/Q6 CERT/FULL trong `blind34-gaps.txt`:
  các số recompute khớp đúng kỳ vọng (CERT22/FULL36/CERT23/FULL39…).
  Mù #35 mới mở (chứa #49) — chờ probe đợt 117.
- **WFS lần 22 chênh 0 — S10 xác nhận bằng số học từ
  `scan-meta.txt`:** NEWSTD 200 file / 708 dòng + COPIES 17 file /
  25 dòng = R7B 217 file / 733 dòng — đúng 708+25=733, 200+17=217.
  Sóng EPERM: 0 thật (xem LIMITS S7). Birefnet: KHÔNG chạy (dưới ngưỡng
  guard) — đúng quy định.

## 8. S8 — Hạ tầng: postboot #48 + replay kẹp bằng dpkg.log + headroom + stale vite.lock

- **Postboot #48: PASS** (check-only 21:03:02Z, boot ~79' tuổi): wrapper
  PASS, libs đủ 5/5, GST thư mục thật 269 file đủ isomp4+libav, apt đủ
  11/11. `--repair` KHÔNG chạy (không cần). S10 đã đọc
  `postboot-48-result.txt` — khớp LIMITS.
- **Replay #48 kẹp được bằng dpkg.log: (0'40", 2'44"]** — hoạt động apt
  đầu tiên 19:44:26 (boot +40 s), cài xong toàn bộ 19:46:30 (boot
  +2'44"), 0 entry sau đó. Nhanh nhất trong 3 boot kẹp được (#46:
  (1'23", 7'08"]; #47: (22,6', 27,7']). Watcher v2 early-run (luật
  đứng mới, phê duyệt 15/11) đã chạy ngay đầu lượt, try#1 PASS lúc
  boot 83,3' tuổi, exit 0 — nhưng S8 bắt đầu lúc boot đã ~79' tuổi nên
  watcher không có lần FAIL live nào, chỉ chứng minh PASS tại lần kiểm
  đầu; khoảng chặt lấy từ dpkg.log (bằng chứng hậu kiểm).
- **Headroom inotify boot #48: 969 (đầu lượt) → 961 (cuối lượt, drift
  −8 là nhiễu luồng khác)** — S10 kiểm log end: STOP ở i=961, 961
  watch. Tiếp tục rơi so với 1073 cuối #47. Vite thường ENOSPC (chết
  khi watch `MediaBin.tsx`, exit 1); vite tạm `watch.ignored` vẫn là
  đường duy nhất (ready, localhost 200, 0 inotify FD).
- **Stale vite.lock: KHÔNG CÓ lock nào sót trên đĩa** — S10 kiểm:
  thư mục `hidden_files/vite.lock` không tồn tại. (Queue dir chỉ còn
  file cooldown — bình thường, không phải lock.)

## 9. S9 — Seek/preload: BỎ cả hai fix, KHÔNG sửa production

- **Verdict BỎ cả hai fix — S10 đồng ý.** Fix V1 `preload-none`
  FAILED 3/5, tệ hơn control (2/5). Fix V2 `reset-swap` FAILED 2/5,
  bằng đúng control (2/5). Bar FIX prereg §2 (treatment FAILED ≤1/5
  VÀ SURVIVED ≥3/5) KHÔNG ĐẠT — không biến thể nào đạt (a).
  Production `apps/web/src/media.ts` KHÔNG ĐỔI (md5 `2c384ed1…`
  trước/sau). Patch thử chỉ tồn tại trong bundle probe
  (`benchmarks/render/webkit_blob_flaky_116s9_2mib.mjs`, nhánh
  `S9MATRIX`).
- **Recount S10: KHỚP HOÀN TOÀN** (từ `s9-classify-matrix.txt`, 15
  run, boot #49, tải sạch, load1 0,49–1,86): fresh-element FAILED 2/5,
  preload-none 3/5, reset-swap 2/5, STARVE 0/15. S10 đếm lại từng run
  trong file classify — khớp bảng §1 LIMITS S9.
- **Nuance S10 ghi thêm:** 1 trong 3 lỗi của V1 (preload-none-r3)
  FAILED mà KHÔNG do wrap: firstPull `00000020…` (byte đúng),
  wrapPulls 0/1138, bogusGST 0, failKind=error-event. Tức V1 có thêm 1
  cơ chế lỗi khác ngoài cuộc đua ring-wrap — nhưng vì V1 đã BỎ nên chỉ
  ghi nhận, không điều tra thêm trong đợt này.
- **Ý nghĩa sản phẩm:** cả 7 run FAILED đều phát 382–384 frames trên
  HTTP sau fallback — fallback blob→HTTP hoạt động 7/7, video không
  vỡ. Cuộc đua ring-wrap tốn một lần fetch lại qua HTTP, không phá trải
  nghiệm xem. Đây là lý do verdict BỎ là an toàn.
- **B-Q8-1 KHÔNG CHẠY LẠI** — điều kiện vào prereg §4 (bar FIX đạt)
  không thỏa. Bar seek lạnh CHỈ ĐỀ XUẤT (không có dữ liệu F2 mới, không
  chạy SEEKFAST). Nợ sang đợt 117: B-Q8-1 với hướng khác (không phải
  DOM-level preload/reset) hoặc chấp nhận race + fallback như hành vi
  hiện tại.

## 10. Nợ mở cho đợt 117 (gộp từ §1–§9)

1. **E4 — stall r1f3 att2 + r1f4 (S1, nợ #1):** tái hiện có kiểm soát
   (lượt A gop250 loadN=0, lượt B gop30 loadN=0, cửa sổ seek 60 s);
   xác định stall này có thuộc phạm vi E4 không; E4 vẫn ĐÓNG CÓ ĐIỀU
   KIỆN. (S1 chưa xong — gộp muộn trước.)
2. **Zombie (S2, nợ #2):** H2 đã BỎ; attribution `loop` đã chốt. Nợ
   mới: chốt nửa longtask chưa rõ nguồn đã xong — nhưng cơ chế freeze
   ở chuyển clip vẫn cần hướng sửa khác (H2 thất bại, H1 thất bại);
   cân nhắc giới hạn tần suất capture theo hướng khác hoặc chấp nhận
   stall ~200–800 ms ở biên clip như hành vi hiện tại (parent quyết).
3. **Điểm gãy tải (S3, nợ #3):** đẩy cao hơn 21,07 tìm điểm gãy thật;
   GIỮ sát ngưỡng (80,9%) + tải hai đỉnh cần lượt xác nhận; bar (c)
   vùng xám lần 4 — cần chẩn đoán chỉ số đói pump (có thể bar sai chứ
   không phải pump đói); chuẩn tải vẫn hog nice -n 19.
4. **Lock v2 (S4, nợ #4):** 3 điều kiện để đổi spec sang v2 ở đợt 117
   (mẫu waiter thật đủ dày; vá C đo dưới tải hog — 1 waiter timeout
   ~300 s dưới load1 >15; 1 waiter chờ >600 s để quan sát aging).
   Quyết parent: có đổi `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2 ở đợt 117
   không (giữ v1 frozen làm sao lưu).
5. **WebKit ≤60 ms (S5, nợ #5):** ĐÃ ĐÓNG (lượt yên xác nhận lần 5).
   Không còn nợ — chỉ theo dõi: nếu lượt yên sau median lại >60 ms thì
   mở lại.
6. **Ghost stale sau seek (S6, nợ #6):** event seek Q5 đã tái hiện
   4 lần (không còn đơn lẻ); gộp 5/60 (8,3%), toàn bộ trên lượt nhiễm
   tải; H-D chưa bác (Fisher p=0,12) nhưng chưa có ý nghĩa thống kê.
   Mục tiêu ≥80 seek vẫn mở (dừng ở 60) — cần thêm lượt yên để phân
   biệt H-D; event P4 frame-26 + Q5 seq 282–285 không tái hiện trên
   lượt yên S5 (trông như đơn lẻ).
7. **EPERM + mù (S7, nợ #7):** mù #35 mới mở (chứa #49) — probe #36
   đợt 117; mù #31 KHÔNG thử lại (đã thử hết nguồn); G1 + mù #22 +
   #28 + #29 + #30 chờ user quyết (như các đợt trước).
8. **Hạ tầng (S8, nợ #8):** postboot #49 S10 đã kiểm PASS (không
   phải S8); replay #49 chưa kẹp bằng dpkg.log (S8 chỉ kẹp #48) —
   đợt 117 kẹp lại; headroom rơi tiếp (969→961) — vite
   `watch.ignored` vẫn bắt buộc; watcher v2 (b) luật đứng: luồng infra
   đầu tiên sau mỗi reboot chạy watcher v2 ngay (S8 đã áp dụng lần đầu,
   nhưng bắt đầu muộn nên không kẹp được FAIL live — đợt sau bắt đầu
   sớm hơn).
9. **Seek/preload (S9, nợ #9):** B-Q8-1 với hướng khác (không
   DOM-level); hoặc chấp nhận race ring-wrap + fallback HTTP (7/7
   phát đủ frames); V1-r3 lỗi không-do-wrap ghi nhận thêm 1 cơ chế lỗi
   chưa rõ.
10. **Nợ nhỏ S10:** (a) đính chính S2 resid-share (0,0/0,0 — đã ghi
    §2); (b) đính chính tổng lũy kế (§11); (c) driver O8 copy R10 còn
    `W` cũ — đã sửa trong lượt, lần sau kiểm `W=` trước khi chạy;
    (d) S10 chưa chạy lại probe dài nào (chỉ đếm lại từ dữ liệu thô +
    suite + O8) — cây không đổi (`03bf029f`) nên không cần.
11. **TTS 39 CẤM kiểm lại; birefnet 0 lần thành công** — chỉ thử lại
    khi RAM đổi (RAM khả dụng ~0,5–2,0 GB < ngưỡng 6 GB; u2net là
    fallback chính thức). ci-security.yml vẫn 403 chờ user. Dial load1
    đáp ứng chậm 150–275 s (luật hog ≥90 s vẫn đứng).

## 11. Ghi chú vận hành đợt 116

- **Reboot #49 (21:46:46Z, gap 2h03'00"):** giết poller S10 #1 +
  waiter #1; S10 chạy lại cả hai (poller#2, waiter#2). Reboot cũng cắt
  attempt 1 của S3 (loại hoàn toàn) và làm S6 hoãn attempt2–3 (gate 0).
  Tần suất reboot dày (3 reboot/4 giờ quanh #47–#49) — lượt dài ~30'
  có nguy cơ bị cắt ~25% (như R3 đã ghi).
- **round-in-progress.md:** bản cũ (đợt 115) S2 đã xóa đúng chỉ dẫn;
  parent tạo file MỚI cho đợt 116 lúc 21:11:17Z ("Đợt 116 đang chạy
  với 10 luồng S1–S10… Xóa file này khi đợt 116 xong và đã báo cáo").
  File này vẫn tồn tại lúc S10 gộp — **parent xóa khi đợt 116 xong +
  báo cáo** (S10 không tự xóa).
- **Đính chính tổng lũy kế chờ push (S10 đếm lại trực tiếp từ đĩa):**
  đợt 111–115 = **48 batch / 98 entry / 84 file duy nhất** (không phải
  47 / 96 / 83 như log gộp muộn đợt 115 — lệch +1 batch / +2 entry /
  +1 unique; nguyên nhân chưa xác định, có thể là đếm thiếu ở lần
  tổng hợp trước; S10 đếm bằng script đọc NUL-delimited từ mọi file
  `phase9-round11[1-5]-*.txt`).
- **Batch đợt 116 (8/9 luồng đã stage; chỉ còn S1): 8 batch luồng /
  14 entry / 14 file duy nhất, 0 thiếu, 0 binary, 0 workflow** (+ 1
  batch closing = **9 batch / 15 entry / 15 file duy nhất** cho cả đợt);
  **5 file oversize >37.768 B** (cần ENABLE_PRIVSEP=0 khi push): probe116s2-frame-parity.mjs
  (64.284 B), probe116s3-frame-parity.mjs (48.898 B),
  PHASE9_ROUND116_S3_LOADBREAK_LIMITS.md (42.806 B),
  PHASE9_ROUND116_S7_EPERM_LIMITS.md (56.153 B),
  webkit_blob_flaky_116s9_2mib.mjs (79.318 B). S1 chưa có batch.
- **Lũy kế chờ push thật sau đợt 116 (gồm closing 116): 57 batch /
  113 entry / 97 file duy nhất** + 1 file oversize 6,4 MB
  (`benchmarks/results/webkit-blob-flaky-96x3.json`, vượt giới hạn
  2,8 MB/lần đẩy) + batch S1 (chưa stage). 8 file nằm trong >1
  batch (lấy bản mới nhất khi push): PHASE9_GAP_ANALYSIS.md (5),
  vcut-webkit-postboot-check.sh (6), vcut-vite-lock-v2.sh (3),
  preview.tsx (2), playheadHold90R2.ts/.test.ts (2),
  vcut-poll-quiet-v2.sh (2), clicktest-87o8-mask-track-headed.mjs (2).
  File stray `phase9-round11-preview-parity2.txt` không thuộc đợt
  111–116 (tên không khớp mẫu đợt) — không đếm vào tổng; parent kiểm
  lại khi push.
- **S10 dùng lock v2 suốt:** suite (giữ 0 s chờ) + O8 (giữ 107 s) —
  không DEFERRED, không STALE-LOCK. File lock v2 S10 dùng là bản copy
  trong thư mục S10 (`vcut-vite-lock-v2.s10.sh`, copy từ script sau khi
  S4 đổi default 600).

## 12. Quyết parent đề xuất (chờ duyệt, đợt 117)

1. **E4:** giữ ĐÓNG CÓ ĐIỀU KIỆN; chờ S1 tái hiện xong mới quyết tiếp.
   Không tuyên ĐÓNG ĐẦY ĐỦ (r1f4 đã chặn đường này).
2. **Zombie:** chấp nhận verdict BỎ của S2 (H2); attribution `loop`
   đã chốt — không cần thêm lượt attribution. Hướng sửa mới (nếu có)
   do parent chọn.
3. **Điểm gãy:** biên GIỮ 21,07 (chế độ hog nice -n 19) — giữ chuẩn
   tải này; đẩy cao hơn đợt 117.
4. **Lock v2:** chưa đổi spec sang v2 cho đợt 117 cho đến khi đủ 3
   điều kiện §4 (S4 + S10 đều ghi "chưa đủ điều kiện quyết ngay").
   V2-only trong đợt vẫn tiếp tục (mọi driver đợt 116 đều v2).
5. **WebKit ≤60 ms:** CHẤP NHẬN là đã chốt (lượt yên xác nhận lần 5) —
   đóng nợ #5.
6. **Mù #34:** chấp nhận ĐÓNG HOÀN TOÀN (mù thứ 3 liên tiếp).
7. **Seek/preload:** chấp nhận verdict BỎ cả 2 fix của S9; B-Q8-1 dời
   sang đợt 117 với hướng khác, hoặc chấp nhận race + fallback.
8. **S1:** gộp muộn khi S1 về (parent lượt sau); LIMITS gộp này sẽ bổ
   sung §12+ khi đó (như đợt 115 §12).
9. **S6:** chấp nhận kết quả — event seek đã tái hiện 4 lần, H-D chưa
   bác (p=0,12); nợ ≥80 seek dời sang đợt 117 (cần lượt yên thứ hai).

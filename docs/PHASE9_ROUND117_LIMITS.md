# PHASE9_ROUND117_LIMITS — Gộp đợt 117 (verify độc lập T10, lượt cron 15:35 +07 15/11/2026)

> Đợt 117: 10 luồng T1–T10 đóng nợ đợt 116 §10 (QUYẾT PARENT 15/11).
> T10 verify độc lập: poll cờ done mỗi 5 phút (poller chết theo reboot
> #53, đã chạy lại), bắt đầu recount + suite khi đủ 7/9 (theo bài học
> đợt 116 S10 — không chờ 9/9), O8 sau suite.
>
> **Trạng thái lúc T10 gộp (10:5xZ 15/11/2026): 9/9 luồng đã xong
> (T1–T9), 0 late merge, 0 luồng mất.** T5 về cuối cùng (~10:52Z).
>
> **Kết quả gộp: verify 9/9 — 9/9 khớp số headline, 1 đính chính
> (T9 §0 về md5 cây ở leg playing-clean — không đổi verdict).
> Cây gộp XANH MỘT NỬA: suite 27/27 exit 0; O8 Chromium 21/21;
> O8 WebKit exit=2 — BỊ CHẶN BỞI HẠ TẦNG (replay #53 đình trệ, thư
> mục GST hệ thống không tồn tại), KHÔNG phải lỗi sản phẩm.**
> KHÔNG push. KHÔNG release/tag.

## 0. Kiểm chứng gộp của T10

- **Poll:** poller T10 #1 (setsid, 5 phút/lần) — poll #1 0/9
  (08:38:55Z); 2/9 lúc 09:03:55Z (T7, T8); 4/9 lúc 09:23:55Z (thêm
  T1, T4); poller CHẾT theo reboot #53 (dừng ở poll #14, 09:43:56Z,
  4/9). Poller #2 chạy lại 09:48:56Z (ghi rõ vào log, đánh số lại
  từ #1): 5/9 lúc 09:53:56Z (thêm T9); 6/9 lúc 10:08:57Z (thêm T2);
  **7/9 lúc 10:38:57Z** (thêm T3) — T10 bắt đầu recount + suite
  ngay; 8/9 lúc 10:43:57Z (thêm T6); **9/9 lúc 10:53:57Z** (thêm
  T5 — "ALL 9 DONE"). Log: `hidden_files/round117-t10/poll-t10.log`.
- **Reboot #53 = 09:47:08Z** (boot_id `574e3d6b-4a99-4b6b-b6e4-
  307148232a98`, gap #52→#53 = 1h17'56" — trong dải chứng nhận
  [19'07", 3h14'08"], không phá sàn). Reboot giết poller T10 #1 +
  sleep session của T10 (runtime restart cùng lúc), driver T3 s80
  (cắt ở ph 110,8/750), attempt3 của T6 trong gate A, lệnh sleep
  600 của T5, và lần launch F1 của T2 (F1 chạy lại hoàn toàn trên
  boot mới). Số thứ tự #53 vẫn TẠM THỜI (mù #35 chưa đóng).
- **Replay sau #53 ĐÌNH TRỆ — phát hiện hạ tầng mới của đợt này:**
  0 hoạt động apt/dpkg trong 65+ phút sau boot (T5 + T6 xác nhận
  độc lập; T10 tự kiểm: postboot #53 check-only exit=1, dpkg.log
  chỉ còn 2 dòng "startup packages configure" 09:48:02–03Z).
  Đây là boot đầu tiên trong chuỗi #46/#47/#48/#52 (đều kẹp được
  replay) mà replay không tới. Hệ quả: T5 không chạy được lượt yên
  nào, T6 0 seek mới, O8 WebKit exit=2. Xem §5/§6/§8 + §10 mục 9.
  Mù #36 mới mở từ probe #36 (08:42:46Z), chứa #53 — probe #37
  đợt 118.
- **Cây:** `preview.tsx` md5 `03bf029f…` trước = sau mọi lượt T10
  (suite, O8). Giữa đợt T2 sửa tạm sang `af4d5753…` (fix H3e,
  09:41:30Z) rồi revert về đúng `03bf029f` trước khi T10 verify
  (xem §2); fix giữ dạng patch. `media.ts` md5 `2c384ed1…` không
  đổi suốt đợt. Lock v2 script md5 `8b02ddc8…` không đổi; v1 frozen
  `fd21193c…` nguyên vẹn. Lock trống lúc gộp (0 ticket + 22 file
  cooldown — tích lũy, xem §11).
- **Suite cây gộp 27/27 exit 0** (script verify T10, chạy
  10:40:50–10:45:40Z, boot #53, RAM avail 922 MB lúc bắt đầu, dưới
  lock vite v2 `VITE_LOCK_AGING_S=600`, giữ 0 s chờ): tsc web 0,
  desktop 0; vite build PASS; playheadHold90R2, pacing, previewEngine,
  seek, seekSkipRender86N3, previewLoop50F2, ghostBlend 15/15,
  rvfcClipWindow102D3, driftConfirmSkip103E4, css60/61 60/60, P7 8/8,
  orphans 17/17, r6, U4 141/141, media-tests, media-retry96X3,
  media-watchdog96X3, deint-verdict ×2, armHeld99a3,
  vite-diagnosis-regex, xvfb-lock, test-preview-engine.sh 354
  assertions pass. Log: `hidden_files/round117-t10/round117-t10-suites.log`.
- **O8 Chromium 21/21 exit 0** (driver T10, 10:46:41–10:47:36Z,
  boot #53, lock v2 giữ 68 s): `KẾT QUẢ CLICK-TEST O8: 21/21 pass,
  0 fail, 0 note`.
- **O8 WebKit exit=2 — BỊ CHẶN BỞI HẠ TẦNG, không phải lỗi sản
  phẩm** (driver T10, 10:47:36–10:51:49Z, boot #53): WebKit 27.2
  launch được, vite dev lên, bridge OK — nhưng harness timeout chờ
  project mẫu tự load (3 clip, media bin 2 item, last=null).
  Nguyên nhân: script webkit BẮT BUỘC
  `GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`
  (dòng 328–334, hardcode trong script) — thư mục này KHÔNG TỒN
  TẠI trên boot #53 vì replay đình trệ (postboot #53 FAIL: 5 lib +
  GST + 11 package apt thiếu). Debroot còn đủ 269 file plugin nhưng
  script không trỏ tới đó. T10 KHÔNG retry (lỗi xác định, retry sẽ
  fail y hệt) và KHÔNG chạy `--repair` (sửa hệ thống để O8 pass sẽ
  che mất phát hiện replay đình trệ; quyết repair thuộc về parent
  — xem §10 mục 9). Tiền lệ P8 đợt 113 (O8 WebKit PASS nhờ debroot
  dù postboot FAIL) KHÔNG áp dụng được ở đây vì thư mục GST hệ
  thống vắng hẳn, không chỉ thiếu package.
- **Recount độc lập:** T10 đếm lại từ JSON thô + log bằng script
  riêng (`hidden_files/round117-t10/recount-t10.py` +
  `recount-push.py` + đếm trực tiếp + chạy lại analyzer của luồng
  trên dữ liệu của họ), không ghi vào thư mục luồng, không tin mù
  LIMITS. Kết quả từng luồng ở §1–§9. Tổng kết: **9/9 khớp số
  headline; 1 đính chính** (xem §9).

## 1. T1 — E4 stall: KHÔNG TÁI HIỆN ĐƯỢC (3 lượt VOID + 1 DEFER) — E4 giữ ĐÓNG CÓ ĐIỀU KIỆN

- **Kết quả gọn:** 0 steady-close trong cả 3 lượt đo → không có
  drift re-seek nào sau steady-close để đo. H1 (seek chậm ~6–13 s,
  xong) và H3 (seek kẹt vĩnh viễn) đều CHƯA PHÂN ĐỊNH ĐƯỢC. E4 giữ
  **ĐÓNG CÓ ĐIỀU KIỆN** theo đúng luật prereg. Đây KHÔNG phải bằng
  chứng stall không tồn tại (r1f3att2/r1f4 là quan sát thật).
- **Recount T10: KHỚP HOÀN TOÀN** (đếm lại từ probe-results.json
  thô + analyze-t1-all.txt): 3 lượt VOID, steady-close ticks []
  (n=0) cả 3; resyncsV 0→1 ở tick 2/4/4; seeking run chỉ có seek
  ban đầu (≥219 ms / ≥222 ms, ct=0,5, rs=4); renderTicks n=68/65/31;
  rvfc 0 mẫu cả 3 lượt; pageErrs 0. Drift (ct−ph, bỏ 3 tick đầu):
  t1a max 0,1797 / min −0,0667 (≈0,18/−0,07 như LIMITS); t1a2 max
  0,2334 / min −0,1333 (≈0,23/−0,13); t1b **8 lần vượt 0,35 đúng
  tại tick 12/14/16/18/20/22/26/31 với đúng giá trị 0,5917/0,3667/
  0,4/0,3667/0,3686/0,3667/0,3767/0,4333 — khớp từng số**, 0 cặp
  liên tiếp → luật xác nhận drift 2 tick KHÔNG BAO GIỜ thỏa.
  tailSteadyClosed max 0 cả 3 lượt; tailBursts max 1/0/5.
- **B-retry DEFER-LOCK:** ticket 09:03:14Z, TIMEOUT waited=902 s
  (hàng đợi: t4-hold giữ 630 s + t3 70 s + t2) — đúng prereg, không
  ép lock; retry đã dùng hết 1 lần cho phép của lượt B.
- **Nuance:** decoder ì lúc mở đầu ở t1b (ct đứng yên ở 0,5 từ
  tick 3→11, ~1,4 s) — cùng chữ ký với r1f3att2 nhưng nhẹ hơn nhiều
  (r1f3att2 ì ~4,7 s). Stall là hiện tượng xác suất, phụ thuộc mức
  ì decoder từng lượt; n=3 không đủ bắt đuôi hiếm.
- **Nợ:** E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN. T1 đề xuất 3 hướng cho parent:
  (a) chấp nhận giữ ĐÓNG CÓ ĐIỀU KIỆN tới khi có lượt bắt được
  steady-close + drift re-seek (cần lô đo lớn đăng ký trước);
  (b) điều tra riêng "vì sao decoder ì 4,7 s ở r1f3att2 nhưng ~0 s
  ở 3 lượt T1"; (c) parent quyết E4 dựa trên phân tích cơ chế
  offline của S1 mà không cần số tái hiện.
- Batch: `phase9-round117-t1-e4stall.txt` (1 entry: LIMITS T1).

## 2. T2 — Zombie H3e: VERDICT BỎ (cặp B1/F1 cùng boot #53)

- **Verdict BỎ — T10 đồng ý.** Cặp verdict (B1 baseline, F1 fix)
  cùng boot #53: longtask ≥200 ms tổng −2,6% (bar −30%), số lượng
  196→198 (tăng); draws-gap straddle biên 24→21 (−12,5%, bar
  −30%); seek median tệ hơn 174→205 ms. Cả 3 bar (a)(b)(c) đều
  không đạt. Cây đã về đúng baseline `03bf029f`; fix giữ dạng patch
  `h3e-fix.patch` (164 dòng) + `apply-h3e.py` (tái tạo đúng md5
  `af4d5753`).
- **Recount T10: KHỚP HOÀN TOÀN** (từ file analysis của T2):
  B1: draws-gap total=95, straddle=24, 39871/10302 ms; longtask
  ≥200 n=196 totalMs=55459 (tất cả 381/76564); residual 0,95,
  S_pre 0,36. F1: draws-gap 90, straddle=21, 34948/7620 ms;
  longtask n=198 totalMs=53999 (tất cả 359/74619); residual 0,94.
  B0 att2 (baseline boot #52): draws-gap 118/29, 61390/15749 ms;
  longtask n=151 totalMs=54330 — khớp LIMITS §4.1. Cặp (B1, F1)
  HỢP LỆ, không LAI (load1 med Δ0,60; load5 med Δ0,40; draws/s
  1,09×; cùng boot #53; md5 ổn định; pageErrs 0). Cặp (B0, F1)
  LAI do boot đổi — chỉ tham khảo.
- **Chẩn đoán mới:** trên tick chậm, S_render ≈ 0,99, residual
  0,90–0,95 (blend chỉ 0,05–0,10) — residual KHÔNG phải capture
  (capture nằm sau recordTickCost ở đường plain) và KHÔNG phải
  blend; 2 drawImage full-res trong total ngoài blend là
  `storeHeldFrame` + `samplePlainCurrentPixStrip`. Mỗi tick
  plain-blend có 4 lần đọc video — giải thích vì sao H1/H2 đều
  thất bại (mỗi cái chỉ chạm 1/4 lần đọc).
- **Giả thuyết mới sau khi H3e thất bại (§1.3, chưa chẩn đoán
  xong):** tick block chờ decoder ở lần đọc video ĐẦU TIÊN trong
  tick (storeHeldFrame — lần đọc duy nhất H3e giữ lại); các lần
  đọc sau cùng frame đã rẻ. H3e KHÔNG làm residual giảm (0,94 vs
  0,95 baseline cùng boot). Hướng tiếp theo H3f (CHƯA code): loại
  bỏ lần đọc video block khỏi tick nóng — cần chẩn đoán tách riêng
  thời gian storeHeldFrame trước khi thiết kế.
- **Boot tự nó đổi phân phối tick:** baseline B0 (#52) loopMs p50
  17,5 ms → B1 (#53) 89,6 ms, draws/s 5,6→7,4 — bằng chứng độc lập
  cho điều khoản "boot đổi → LAI".
- **Bài học vận hành:** exec session bị SIGKILL ở ~900 s
  wall-clock — driver lượt dài PHẢI chạy detached (nohup +
  disown), chỉ poll log file. Load1/load5 méo bởi trần CFS quota
  1,5 CPU — draws/s + số hog cố định mới là thước so sánh đáng
  tin. Không sửa cây khi probe luồng khác đang chạy (T2 chờ T3
  xong probe + T1 done mới apply H3e — nhưng vẫn nhiễm dial s80
  của T3, xem §3 §0).
- **Đề xuất cho parent (§8):** A — chấp nhận stall ~200–800 ms ở
  biên clip dưới tải (196 longtask/lượt, tổng ~55 s stall tích lũy
  mỗi ~87 s phát; 95 draws-gap >300 ms/lượt); B — cho làm H3f ở
  đợt sau, nhưng chỉ sau bước chẩn đoán tách riêng storeHeldFrame.
  T2 khuyến nghị B sau chẩn đoán.
- Batch: `phase9-round117-t2-zombie.txt` (2 entry: LIMITS T2 +
  probe117t2-frame-parity.mjs 68.311 B — oversize).

## 3. T3 — Điểm gãy tải: s79 TRUNG GIAN 79,7% @26,98; s80b TRUNG GIAN 64,4% @12,03 — liều–đáp ứng KHÔNG đơn điệu; bar (c) TUYÊN BỐ KHÔNG ÁP DỤNG cho nice-hog

- **Recount T10: KHỚP HOÀN TOÀN** (tính lại từ
  frame-parity-results.json thô): s79 n=1757, trong ±1 = 1401
  (**79,74%**), ≤−2 = 3, trung vị 0, mean +0,69, loadSamples mean
  **26,98** (n=179, median 20,17), pump 2190, skipStale 721
  (**32,92%**). s80b n=1697, trong ±1 = 1093 (**64,41%**), ≤−2 = 0,
  trung vị **+1**, mean +1,19, loadSamples mean **12,03** (n=175,
  median 9,86), pump 2054, skipStale 558 (**27,17%**). dry-t3b:
  249 tick, 100% ±1, loadMean 1,64, skipStale 3/230 (1,30%).
  dry-t3 (dưới tải sibling): 40 tick, 72,5%, loadMean 27,37,
  skipStale 17/46 (36,96%).
- **Biên GIỮ 21,07 KHÔNG được xác nhận — GIỮ vững lùi về 19,63
  (s77c, 88,7%):** s79 thiếu GIỮ đúng ~5 tick (1401/1757; vạch 80%
  = 1405,6). Vùng chuyển tiếp GIỮ→TRUNG GIAN nằm trong
  **(21,07, 26,98]**.
- **s80b phá vỡ liều–đáp ứng:** tải THẤP NHẤT (12,03) cho offset
  TỆ NHẤT (64,4%) trong 4 lượt nice-hog (19,63→88,7%; 21,07→
  80,9%; 26,98→79,7%; 12,03→64,4%). Mean offset cũng không tăng
  theo tải (+0,70 → +0,66 → +0,69 → +1,19). Load1 mean KHÔNG dự
  báo được offset trong chế độ này. Điểm gãy như hàm của load1
  mean có thể KHÔNG TỒN TẠI ở dạng sắc nét — dữ liệu ủng hộ "vùng
  chuyển tiếp rộng + nhiễu lớn giữa các lượt". Caveat: s80b có 2
  yếu tố khác biệt (chỉ 24 hog lúc phát; boot #53 mới 23 phút).
- **Bar (c) — TUYÊN BỐ KHÔNG ÁP DỤNG ĐƯỢC cho chế độ hog nice
  -n 19** (theo quyết đăng ký trước prereg-t3 §3): s79 xám lần 5
  (1,98/s, 32,92%) + s80b xám lần 6 (1,96/s, 27,17%) — cả hai lượt
  hợp lệ mới đều xám → dừng kiểm chứng bar (c) ở chế độ này.
  Chẩn đoán D1/D2/D3: skipStale PHẲNG trong khi offset dao động
  (không theo dõi offset); ngưỡng tickRate ≥5/s chưa bao giờ tới
  được ở chế độ nice-hog (5/5 lượt 1,96–3,37/s); ngữ nghĩa
  skip-stale là guard đúng (đọc code `preview.tsx` ~dòng 2216:
  rVFC bắn trễ → skip để không gán nhầm nhãn), không phải đói
  pump. Bar (c) còn nguyên giá trị ở chế độ không-nice và lượt
  yên — nhưng cần prereg mới.
- **Bar (b) playhead kẹt: KHÔNG TÁI HIỆN, 0/8 lần thử thực chạy**
  (s79 #7, s80b #8). s79: cửa sổ 30 s min advance 16,07 s; s80b:
  17,97 s; 0 cửa sổ 10 s <1,33 s cả hai lượt; 0 chuỗi mẫu đứng yên.
  Vùng chậm nhất cả hai lượt cùng ở ph ~255–296 (clip c85–c97) —
  ghi lại để đợt sau đối chiếu, chưa đủ tuyên bố "vùng clip xấu".
- **s80 VOID hoàn toàn (2 lý do độc lập):** (i) T2 apply H3e giữa
  lúc s80 đang dial (md5 03bf029f → af4d5753, cờ EDITING) — nhiễm
  cây; (ii) reboot #53 cắt ở ph 110,8/750 (14,8%). Chỉ giữ partial
  + stall-watch 25 mẫu làm vết audit.
- **Kẽ hở phối hợp (mới, §0/§10 mục 8):** luồng sửa cây chỉ nhìn
  lock + cờ, không thấy dial (dial diễn ra NGOÀI lock theo thiết
  kế); luồng đo chỉ kiểm cây TRƯỚC dial; dial dài (387 s) là cửa
  sổ mù. Đề xuất: luồng đo dài ghi cờ "đang dial", hoặc luồng sửa
  cây hỏi trực tiếp trước khi apply.
- **Dial ĐẠT không khóa được tải trong lúc phát (mới, §5):**
  s80b dial ĐẠT 38,26 nhờ tải sibling (chỉ 24 hog) → sampled mean
  trong lúc phát chỉ 12,03 khi sibling rút. Luật dial mới ĐẠT 3/3
  lượt đợt này (lũy kế 5/5) — đề xuất thành luật đứng; nhưng cần
  cơ chế giữ tải (parent quyết).
- **Lock v2:** 0 TIMEOUT cho T3; dry-t3 chờ **632 s** trong hàng
  đợi sau t4-hold — waiter thường đầu tiên chờ >600 s sống (ghi
  cho T4, điều kiện #3). Stale-lock s80 sau reboot được T2 dọn
  qua đường tắt boot-đổi (lần 2).
- Batch: `phase9-round117-t3-loadbreak.txt` (2 entry: probe117t3
  48.898 B + LIMITS T3 59.600 B — cả hai oversize).

## 4. T4 — Lock v2: CẢ 3 ĐIỀU KIỆN ĐỔI SPEC ĐỀU ĐẠT — khuyến nghị đổi `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2

- **(a) Mẫu waiter thật: ĐẠT.** Đếm từ `vite-lock-v2.log` lúc
  chốt (133 dòng): tổng **44 ticket / 38 acquired / 6 TIMEOUT /
  31 lượt giữ thật**, trải 3 đợt; **5 waiter chờ >600 s rồi vẫn
  giữ được lock** trong đợt 117 (t1 773 s, t8 634 s, t3 632 s,
  t4-wc 702 s, t2 668 s). Không waiter nào bị đói / bị vượt mặt
  trái thiết kế; 0 STALE-TICKET; 2 STALE-LOCK đều là dọn lock chết
  sau reboot đúng cơ chế.
- **Recount T10: KHỚP.** `analyze-final.txt` của T4 ghi đúng
  TICKET 44 / ACQUIRED 38 / TIMEOUT 6 / STALE-LOCK 2 /
  STALE-TICKET 0. Log hiện tại đã tăng lên 48/42/6 do hoạt động
  sau thời điểm chốt của T4 — T10 đếm bằng file checkpoint của T4,
  không đếm log trôi. Các dòng wb/wc/wl trong log khớp từng dòng:
  wb TICKET 09:02:18Z → TIMEOUT 09:07:19Z `waited=300s`; wc
  TICKET 09:02:20Z → ACQUIRED 09:14:02Z `wait_s=702`, RELEASED
  hold 5 s; wl TICKET 09:12:32Z (key `0-…`, prio long) → TIMEOUT
  09:17:35Z `waited=302s`.
- **(b) Vá C dưới tải hog: ĐẠT VỚI CAVEAT VỀ TẢI.** Waiter B
  timeout danh nghĩa 300 s → TIMEOUT sau **301 s tường** (giãn
  1,003×; trước vá giãn 1,34×). Caveat: tải KHÔNG giữ >15 suốt
  300 s — sampler 5 s (61 mẫu): mean 16,91, >15 trong 38/61 mẫu
  (62%); đoạn >15 liên tục dài nhất **189 s** (09:03:15–09:06:24Z,
  đỉnh 26,99). Nguyên nhân đo được: **load1 dao động theo chu kỳ
  ~5 phút** — hogs `nice -n 19 node` (20 con) lúc đẩy load lên
  25–27, lúc chỉ còn ~2–6% CPU mỗi con dù `procs_running` vẫn ~28
  (giả thuyết mạnh nhất: quota CPU của cell có burst). Một phép đo
  timeout 300 s nằm trọn trong pha BẬT ~200 s là không thể với
  cách hog hiện tại — giới hạn của phương pháp đo, không phải của
  vá C. Overshoot chỉ 1 s (so với ~100 s nếu còn lỗi cũ) + 189 s
  liên tục ở load 15–27 là đủ để kết luận vá C đúng.
- **(c) Aging 600: ĐẠT ĐẦY ĐỦ.** Waiter C chờ **702 s** (>600 s),
  giữ 5 s, nhả sạch. **Lật hạng quan sát trực tiếp:** snapshot
  09:12:04Z key wc vẫn `1-…`, snapshot 09:12:25Z đã thành `0-…`
  — đúng quanh mốc created+600 s = 09:12:20Z; cùng snapshot, t3
  cũng lật sang `0-`, còn t2/t1 (chờ ~550 s) vẫn `1-`. **T10 kiểm
  lại từ `queue-snapshots.txt`: khớp đúng từng key** (09:12:04Z:
  t3 + wc đều `1-…`; 09:12:25Z: cả hai đều `0-…`; t2 vẫn `1-…`).
  Thứ tự giữ thực tế: t3 (632 s) → wc (702 s) → t2 (668 s) → …
  — waiter long tới sau cùng (wl) xếp CUỐI dù mang prio long.
- **Khuyến nghị T4: ĐỦ ĐIỀU KIỆN ĐỔI SPEC SANG v2 ở đợt 117/118.**
  Giữ `vcut-vite-lock.sh` frozen làm sao lưu (md5 `fd21193c`
  nguyên vẹn). V2-only trong đợt vẫn tiếp tục. Không cần đo lại
  (b) trừ khi parent yêu cầu nghiêm ngặt "load1 >15 suốt 300 s"
  — với phương pháp hog hiện tại thì phép đo đó gần như không thể.
- **Hạn chế:** giữ lock 630 s của T4 GÓP PHẦN gây ra TIMEOUT 902 s
  ngoài ý muốn của T1 (09:18:16Z) — hành vi timeout đúng thiết kế
  (FIFO giữ nguyên), nhưng là bằng chứng giữ lock 600 s+ trong đợt
  đông sẽ làm waiter timeout 900 s đói. Lỗi đo của driver T4
  (wall 613 s cho wb là sai — số đúng 301 s từ log lock; đã ghi rõ
  trong LIMITS T4 §5, đừng trích số 613 s).
- Batch: `phase9-round117-t4-lockv2.txt` (1 entry: LIMITS T4).

## 5. T5 — WebKit ≤60 ms: KHÔNG CHẠY ĐƯỢC LƯỢT YÊN NÀO (replay #53 đình trệ) — ngưỡng GIỮ nguyên trạng thái S5

- **Kết quả gọn:** 0 lượt yên, 0 số tickCost mới, không verdict
  GIỮ/MỞ LẠI nào từ lượt đo. Ngưỡng ≤60 ms **GIỮ nguyên trạng
  thái S5** ("GIỮ — đã có lượt yên xác nhận"). Nợ lượt yên theo
  dõi chuyển tiếp sang đợt sau.
- **Recount T10: KHỚP.** Analyzer dry-run của T5 trên JSON S5
  attempt3 tái tạo đúng median 49,5 / p90 75,0 (total n=570; hậu
  flip+2000 ms n=412 median 49,5) — pipeline sẵn sàng, chỉ thiếu
  cửa sổ đo. Attempt1/2: gate A không mở trong 10 phút mỗi lần
  (T6 giữ lock 779 s + hog tải cao, RAM sụt tới 500 MB).
  Attempt3: gate 0 FAIL cả 2 try (postboot #53 exit 1). Gate 0
  poll 30 phút: 6/6 lần exit 1 (10:25–10:50Z), từ poll #2 trở đi
  máy ĐÃ YÊN (load1 0,26–1,70, RAM 995–2673 MB) — chỉ gate 0
  chặn. Kiểm cuối 10:52:12Z (boot+65') vẫn exit 1.
- **Bằng chứng replay #53 không chạy (không phải chạy chậm):**
  dpkg.log chỉ 2 dòng "startup packages configure" 09:48:02–03Z,
  0 entry sau đó; apt/history.log TRỐNG; journal 09:53–09:57Z
  không apt/dpkg/os-intent nào; ps không thấy apt-get/dpkg nào
  (apt_procs=0 ở cả 6 poll). T10 xác nhận độc lập: postboot #53
  check-only exit=1 + dpkg.log hiện tại vẫn chỉ 2 dòng đó.
- **Hồi quy:** tsc exit 0, ghostBlend 15/15 PASS, md5 `03bf029f`
  không đổi. T5 chờ đúng lệnh khi T2 EDITING cây (không đo trên
  cây đổi). Trùng cổng vite 5186 với T6 — đề xuất đổi sang 5187
  đợt sau.
- Batch: `phase9-round117-t5-f6p60ms.txt` (1 entry: LIMITS T5).

## 6. T6 — Ghost seek: 0 seek mới (vẫn 60/80) — H-D chưa phân biệt được; replay #53 đình trệ chặn cả T5/T6

- **Kết quả gọn:** không lượt probe nào hoàn thành. Attempt1 bị
  kill giữa chừng (renderer bò, ~2 s CPU/phút, ~2 phút/pass, 3
  WebKit cùng cell; lớp B đã hỏng); attempt2 hoãn gate A (exit 5,
  30 poll không mở); attempt3 chết theo reboot #53 trong gate A;
  attempt4 không bao giờ launch (replay #53 đình trệ, gate 0
  FAIL 8 lần kiểm 09:49–10:41Z). T6 KHÔNG chạy `--repair` (prereg
  đã đăng ký CHỜ replay; replay là mảng T8).
- **Gộp toàn chuỗi KHÔNG ĐỔI: 5/60 seek stale (8,3%; CI 95%
  2,8%–18,4%)**; nhiễm tải 5/40 (12,5%) vs yên 0/20 (0%);
  Fisher một phía **p=0,1205**. H-D (seek) VẪN CHƯA PHÂN BIỆT
  ĐƯỢC; nợ lượt yên thứ hai dời nguyên vẹn sang đợt sau. Event
  P4 frame-26 + Q5 seq 282–285: không có dữ liệu mới để khẳng định
  hay bác. Tally P4-type giữ nguyên (P4 1 + Q5 0 + R6 2 rõ + 1 nhỏ
  + S6att1 0, 4 lượt).
- **Recount T10: KHỚP.** T6 chạy lại analyzer S6 trên JSON S6
  attempt1 → **19 snapshot label-0, 4 STALE (21,1%), M=70/61/76/
  68, pass 2/7/14/16** — đúng từng số như LIMITS S6 §3 (T10 đọc
  `ghostseek-s6-recheck.txt`). Fisher tính lại bằng `math.comb`:
  C(40,5)/C(60,5) = **0,1205** ✓. Hồi quy: tsc exit 0,
  ghostBlend 15/15 PASS, md5 `03bf029f` không đổi.
- **Đề xuất cho đợt sau:** gate A kiểm thêm "số WebKit đang chạy"
  (attempt1 bò vì 3 WebKit cùng cell dù load1/load5/RAM lúc mở
  cửa đều đạt); đo yield-frame trực tiếp (M là frame nào lúc
  capture) vẫn mở.
- Batch: `phase9-round117-t6-ghostseek.txt` (1 entry: LIMITS T6).

## 7. T7 — EPERM: probe #36 + mù #35 KHÔNG ĐÓNG HOÀN TOÀN + WFS lần 23 chênh 0

- **Recount T10: KHỚP.** `once.txt`: probe #36 boot `22536366`
  **ok=2 fail=0**, exit 0. Log probe v2 đúng **100 dòng** (97 sau
  S7 + 3 dòng checklist: DEAD mới cho #35 + `boot changed` +
  probe #36); heartbeat n=36, ts 08:42:46Z, boot 22536366. Đúng 1
  dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
  Baseline lượt sau là **100**, không phải 97.
- **Reboot #52 mới: 08:29:12Z**, boot `22536366-8716-46f0-a999-
  cd4199080854` — T10 xác nhận độc lập từ đầu đợt (boot_id +
  uptime 9 phút lúc 08:38Z khớp đúng).
- **Mù #35: 21:04:50Z 14/11 → 08:42:46Z 15/11 (11h37'56") —
  KHÔNG ĐÓNG HOÀN TOÀN.** Đoạn A **ĐÓNG** (poller S10 #1 + đọc
  boot tươi lúc START + sàn đuôi); đoạn E **ĐÓNG** (đo uptime trực
  tiếp lúc probe + dấu boot tươi sibling đợt 117). Đoạn B, C, D
  **MỞ**: 3 cửa sổ mở, tổng **6h49'50"** — B (23:17:54Z,
  ~01:57:53Z] 2h39'59" (tối đa 9 ẩn); C [~02:36:07Z, ~04:11:53Z]
  1h35'46" (tối đa 5–6 ẩn); D (~05:36Z, 08:10:05Z] 2h34'05" (tối
  đa 9 ẩn). **Tổng tối đa 24 reboot ẩn danh nghĩa** (23–24 với
  biên không chắc chắn). **Đây là mù đầu tiên KHÔNG đóng hoàn
  toàn kể từ mù #31 — chuỗi 3 mù đóng liên tiếp (#32/#33/#34) đã
  đứt.** Số thứ tự #47–#52 đều TẠM THỜI ("thực tế #52" có thể tới
  #80 nếu cộng tối đa ẩn từ #29/#30/#31/#35). Giá trị các gap
  không phụ thuộc số thứ tự.
- **Gap #48 → #49 = 2h03'00" — ĐƯỢC CHỨNG NHẬN (mới).** Khoảng
  (19:43:46Z, 21:46:46Z) không chứa cửa sổ mở nào (đuôi đoạn C mù
  #34 + đoạn A mù #35 đóng kín). Tập gap đơn đã chứng nhận tăng
  **n=27 → n=28**; toàn chuỗi **n=42 → n=43**. Dải chứng nhận
  [19'07", 3h14'08"] không đổi (gap mới nằm giữa). T10 kiểm lại
  phương pháp: T7 tính lại CERT n=27 ra đúng 100% số S7 trước khi
  thêm gap mới — số mới đáng tin ở cùng mức.
- **Gap #49 → #50 ≈ 4h30'14", #50 → #51 ≈ 2h14'00", #51 → #52 ≈
  3h58'12" — đều là CẬN TRÊN, KHÔNG được chứng nhận** (đoạn B/C/D
  mở; #50/#51 chỉ là giờ khoảng ± vài phút — T7 đã thử kẹp chính
  xác từng giây qua mọi nguồn còn lại mà không được).
- **Đính chính prereg (quan trọng):** prereg §2 viết "đầu đoạn A
  đóng bằng sàn" là **SAI** — sàn không loại được t trong khoảng
  đó. Đoạn A đóng được là nhờ **dòng START của poller S10 #1 đọc
  boot tươi**. Kết luận "đoạn A đóng" vẫn đứng, bằng chứng đúng là
  đọc boot tươi, không phải sàn.
- **Sóng EPERM: 0 thật.** Đếm lại từ đĩa (128 file *.log có mtime
  trong mù #35): 0 dòng sóng thật; 3 hit "vẫn bật"/"CẢNH BÁO"/
  "Operation not permitted" đều là **dòng nhãn trong chính file
  sweep-log của S7** (meta-hit — bẫy đếm mới, lượt sau loại file
  `eperm-sweep*.log` khỏi tập đếm); 2 dòng "sóng EPERM đã tắt"
  thật đều là **dương tính giả đã biết** (dòng launcher S10 O8).
  Sóng gần nhất vẫn là ~11:55–12:11Z (R7) — **~92h32'** trước
  probe #36. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 23: 722 dòng / 203 file** (phạm vi 2887
  file); R7b **747 dòng / 220 file**; copies **25 dòng / 17 file**
  — y hệt lần 22; đối chiếu chéo 722+25=747=R7b, **chênh 0 — lần
  thứ hai mươi ba liên tiếp**. +14 dòng / +3 file so với lần 22,
  giải thích đúng hết bằng diff (5 LIMITS S7 + 1 probe116s1 + 8
  probe117t3). Async `.writeFile(`: vẫn đúng **2 vị trí, cả hai
  trong helper retry đã biết** — 0 stray. **T10 kiểm lại từ
  `scan-meta.txt` + wc -l: 203/220/17 dòng khớp đúng.**
- **RAM:** max biết được trong mù #35: **3.681 MB ≈ 3,59 GB**
  (60% ngưỡng guard). Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói.
- **Mù #31 KHÔNG thử lại** (đã thử hết nguồn). G1 + mù #22/#28/
  #29/#30 chờ user quyết (không đổi).
- Batch: `phase9-round117-t7-eperm.txt` (1 entry: LIMITS T7
  66.715 B — oversize).

## 8. T8 — Hạ tầng: postboot #52 PASS + replay kẹp (6'28", 8'44"] + headroom 948 (reboot KHÔNG hồi, lần 2) + watcher try#2 không kẹp FAIL live

- **Postboot #52: PASS** (check-only 08:39:28Z, boot ~10,1' tuổi,
  exit 0; kiểm lại sau sửa script 08:41:41Z vẫn PASS): wrapper
  PASS, libs đủ 5/5, GST thư mục thật 269 file đủ isomp4+libav,
  apt đủ 11/11. `--repair` KHÔNG chạy (không cần). **T10 kiểm lại
  từ `t8-postboot-b52-try1.log`: khớp.**
- **Khoảng replay #52 KẸP ĐƯỢC bằng dpkg.log: (6'28", 8'44"]** —
  hoạt động apt đầu tiên 08:35:40 (boot +6'28"), cài xong toàn bộ
  08:37:56 (boot +8'44"), 0 entry sau đó. Boot thứ 4 liên tiếp
  kẹp được (#46, #47, #48, #52). Điểm mới: replay #52 **KHỞI
  ĐỘNG MUỘN** (+6'28" mới có hoạt động apt đầu tiên, so với +40s
  của #48); cửa sổ cài đặt 2'16" tương đương #48 (2'04"). T10
  lưu ý: dpkg.log hiện tại đã bị #53 ghi đè (chỉ còn 2 dòng
  09:48:02–03Z) nên bracket này lấy từ bản đọc contemporaneous
  của T8 — file `t8-early-watch-state.md` của T8 cũng ghi đúng
  "entry dpkg cuối 08:37:56Z" và bracket (6'28", 8'44"], nhất quán
  nội bộ; không có mâu thuẫn nào để nghi ngờ.
- **Watcher v2 try#2 KHÔNG kẹp được FAIL live** — dù bắt đầu sớm
  hơn S8 nhiều (boot 10,1' so với 79'), replay đã xong 08:37:56Z,
  tức 83 s TRƯỚC khi watcher bắt đầu (08:39:19Z). Cửa sổ replay
  chỉ rộng ~2'16" và lượt cron bắt đầu đúng giữa cửa sổ đó — độ
  trễ spawn subagent (~2,5 phút) đã nuốt trọn cửa sổ. Chỉ đề xuất
  R9 (a) (cron chạy watcher ở đầu mỗi lượt với `--wait-new-boot`)
  mới bắt được FAIL live một cách có hệ thống — vẫn cần parent
  duyệt (nhắc lần 3).
- **Headroom inotify boot #52 (boot MỚI): 948 → 934 → 925 —
  reboot KHÔNG hồi headroom (lần 2 liên tiếp có số đo boot-mới
  chứng minh).** Rơi tiếp từ 961 (cuối #48) → 948. Vite thường
  cần ~1586 watch nên vẫn thiếu ~638 — vite tạm `watch.ignored`
  vẫn bắt buộc. **T10 kiểm lại từ log headroom: STOP ở i=948,
  errno 28 ENOSPC ✓.**
- **Thử vite trên boot #52: CẢ HAI ĐỀU XÁC NHẬN** — vite thường
  ENOSPC (ready 892 ms rồi CHẾT khi watch `test-relink.sh`, chờ
  lock 634 s); vite tạm 200 + 0 inotify FD (chờ lock 322 s,
  cooldown 14736 ms đúng cơ chế). Attempt đầu bị defer (T6 giữ
  lock ~13 phút; ticket T8 chờ 121 s wall rồi TIMEOUT — vá C giữ
  đúng, giãn +1 s).
- **Postboot + bracket #49/#50/#51: CHỈ CÒN #49 PASS (nhờ S10),
  còn lại ĐÃ MẤT VĨNH VIỄN cùng log** (dpkg.log, apt/history.log,
  journal đều chỉ còn log boot hiện tại — rebuild cùng rootfs sau
  mỗi reboot). #50/#51 chưa từng có lần postboot-check nào.
- **Cập nhật `postboot-check.sh` (md5 `f443dc5f…` →
  `32a214bb…`):** chỉ đổi tham chiếu boot #48 → #52 (header +
  dòng `say` + ghi chú #49/#50/#51 đã mất log); `bash -n` OK +
  chạy kiểm chỉ-đọc lại ra PASS. Không đổi logic. **T10 kiểm lại
  md5 hiện tại: `32a214bb…` ✓.**
- **Stale vite.lock: KHÔNG CÓ** (lock dir vắng mặt; queue chỉ còn
  file cooldown cũ; 0 vite đang chạy lúc kiểm; v2 log không STALE
  mới). T10 kiểm lúc gộp: lock TRỐNG, 0 ticket + 22 cooldown.
- Batch: `phase9-round117-t8-infra.txt` (2 entry: LIMITS T8 +
  postboot-check.sh).

## 9. T9 — Seek/preload B-Q8-1 hướng ring-layer: bar FIX "đạt theo chữ" nhưng KHÔNG chứng minh được nhân quả; B-Q8-1 KHÔNG ĐẠT

- **Verdict — đọc kỹ: bar FIX đạt theo chữ nhưng KHÔNG có ý nghĩa
  nhân quả.** RING8: FAILED 0/5, SURVIVED 5/5 (bar prereg §2:
  FAILED+STARVE ≤1/5 VÀ SURVIVED ≥3/5). Nhưng CTL cũng chỉ FAILED
  1/5 (SURVIVED 4/5); Fisher hai phía **p=1,0000**. Quyết định:
  **cuộc đua ring-wrap KHÔNG HỀ XẢY RA Ở CẢ 2 ARM** — PULL
  req_off=0 trả byte wrap: **0/14 run** (~15.000 pull); bogus GST:
  **0/14 run**. Treatment không có gì để ngăn nên 0/5 không chứng
  minh được ring 8 MiB "chữa" race trên protocol Q8PAUSED.
- **Recount T10: KHỚP HOÀN TOÀN** (từ file classify + JSON thô):
  CTL FAILED=1, STARVE=0, SURVIVED=4 (r1 369 frames blob 20063 ms;
  r2 372/20024; r3 325 http 1144 FAILED; r4 139/20096; r5 144/
  20081); RING8 FAILED=0, STARVE=0, SURVIVED=5 (371/20068,
  370/20080, 236/20070, 133/20047, 196/20096); wrapPulls 0 mọi run;
  bogusGST 0; shim L2Q2 OK mọi run (CTL 4194304/4194304, RING8
  2097152/8388608). Fisher hai phía tính lại: **p=1,0000** ✓.
  Gộp FAILED mọi leg Q8PAUSED tương đương: **19/48 (40%)** ✓
  (Q8+R8 13/23 + S9 5/15 + T9 1/10).
- **B-Q8-1: KHÔNG ĐẠT.** PAUSED arm **ĐẠT 5/5** (3 run RING8 r1–r3
  đăng ký trước: C = **9,22 s** < 31,5; flatness 0,0; T_c ≤ 2 s;
  im lặng GST 18,902–19,520 ms; 0 progress sau suspend).
  PLAYING arm **KHÔNG ĐẠT 0/2** (2 run sạch load1 0,86/0,56: cả 2
  đều ở trên blob suốt 20 s, 0 errEvents, nhưng KHÔNG đạt full
  [0,32] trong 20 s — chỉ tới [0,23,4]/[0,24,6]). **T10 kiểm lại
  từ JSON playing-clean: r1 lastBuf [[0,23.397]], finalCt 14,375,
  99 frames; r2 lastBuf [[0,24.565]], finalCt 15,542, 101 frames
  ✓.** 2 run PLAYING nhiễm tải cũng không full — nhất quán, không
  phải do tải.
- **Phát hiện mới: trần buffer khi paused bám theo
  max-size-bytes, không phải ring.** CTL (max-size 4.194.304,
  ring 4.194.304): C = **17,421 s**; RING8 (max-size 2.097.152,
  ring 8.388.608): C = **9,22 s**. Cả hai trần ≈ max-size-bytes +
  ~6–12% (bitrate c8 ≈ 255.718 B/s); ring đổi chiều ngược lại mà
  trần lại GIẢM. Đây là bằng chứng trực tiếp rằng **ring 8 MiB
  KHÔNG đóng được B-Q8-1**: nó cho PAUSED đạt 5/5 nhưng làm
  PLAYING rớt 0/2 — đổi một bar lấy một bar khác, không phải fix.
  Cần 1 leg đối chứng nữa (max-size 4 MiB + ring 8 MiB) để khẳng
  định — nợ cho đợt sau.
- **Mode lỗi không-do-wrap — tái hiện LẦN 3 (CTL r3):** firstPull
  đúng, 0 wrap, 0 bogus — nhưng error-event ở t=1,07 s + fallback
  HTTP (325 frames, phát tới cuối clip). Bằng chứng mới: **2
  instance qtdemux cùng chết** (qtdemux0 0,865 s + qtdemux1
  1,024 s, cùng "Internal data stream error", KHÔNG có dòng
  bogus-size nào). Tần suất ~6% (3 instance / ~48 run) — thấp
  nhưng đều đặn. Cơ chế vẫn CHƯA RÕ.
- **Fallback HTTP phát đủ frames 8/8** (S9 7/7 + T9 1/1). 2 fix
  DOM-level đã BỎ ở S9; hướng ring-layer KHÔNG chứng minh được
  hiệu quả trên Q8PAUSED; treatment là env/shim-only, không ship
  được qua app. Production `media.ts` KHÔNG ĐỔI (md5 `2c384ed1…`
  trước/sau). T9 KHÔNG tự quyết chấp nhận race + fallback — parent
  quyết.
- **F2 seek lạnh:** 2 run SEEKFAST env RING8 nhiễm tải: 2271/
  1399 ms (đều vượt bar cũ ≤940 ms). Gộp 8 lượt SEEKFAST: median
  **903,5 ms**, seekedOk 8/8. Đề xuất bar phân phối của S9 §6
  (median ≤1,0 s / p90 ≤1,2 s): median ✓, p90 ≈ 1.400–2.271 s ✗
  nếu gộp cả 2 run nhiễm tải. Cần lượt SEEKFAST sạch để chấm lại.
- **ĐÍNH CHÍNH T9 (duy nhất trong đợt ngoài §11):** LIMITS T9 §0
  viết "preview.tsx md5 `03bf029f`… không đổi trước/sau mọi leg
  (verify trước/sau matrix, trước/sau extra, trước/sau
  playing-clean)" là **KHÔNG ĐÚNG với leg playing-clean** —
  playing-clean chạy 09:42:32–09:43:57Z trên cây H3e md5
  **`af4d5753…`** (T2 apply H3e 09:41:30Z, revert sau đó). T10 xác
  minh từ 2 nguồn độc lập: `t9-progress.md` ghi "md5 truoc
  playing-clean: preview.tsx af4d5753… / md5 sau playing-clean:
  preview.tsx af4d5753…" và JSON playing-clean ghi
  `env.previewMd5=af4d5753…`. Md5 ỔN ĐỊNH trước/sau leg
  (af4d5753 cả hai đầu), và probe Q8PLAYING không load
  preview.tsx — **verdict B-Q8-1 KHÔNG ĐẠT không đổi**. Chỉ câu
  §0 cần sửa thành: matrix + extra trên 03bf029f; playing-clean
  trên af4d5753 (ổn định trong leg). Đây là hệ quả thứ hai của kẽ
  hở phối hợp dial–sửa cây (§3 §0): T9 kiểm md5 trước/sau leg và
  ghi đúng vào progress log, nhưng câu tổng kết §0 viết sai.
- Batch: `phase9-round117-t9-seekpreload.txt` (3 entry: runner
  79.321 B + analyzer + LIMITS T9 — runner oversize).

## 10. Nợ mở cho đợt 118 (gộp từ §1–§9)

1. **E4 — stall r1f3 att2 + r1f4 (T1, nợ #1):** 3 lượt tái hiện
   VOID + 1 DEFER — tiền điều kiện (decoder ì kéo dài → drift bền
   vững >0,35) không xuất hiện. E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN. Parent
   chọn 1 trong 3 hướng T1 §3: (a) giữ ĐÓNG CÓ ĐIỀU KIỆN tới khi có
   lượt bắt được steady-close + drift re-seek (lô đo lớn đăng ký
   trước); (b) điều tra riêng phương sai ì decoder WebKit/
   GStreamer; (c) quyết E4 dựa trên phân tích cơ chế offline của
   S1 (không phải zombie Q2, không phải do cổng E4/N3).
2. **Zombie (T2, nợ #2):** H1/H2/H3e đều BỎ. Stall ở biên clip vẫn
   còn (baseline cùng boot #53, 4 hog cố định: 196 longtask ≥200
   ms/lượt, tổng ~55 s; 95 draws-gap >300 ms/lượt). Parent quyết:
   A — chấp nhận stall hiện tại; B — cho làm H3f ở đợt sau, nhưng
   CHỈ SAU bước chẩn đoán tách riêng thời gian storeHeldFrame
   (giả thuyết §1.3: tick block chờ decoder ở lần đọc video đầu
   tiên trong tick). T2 khuyến nghị B sau chẩn đoán.
3. **Điểm gãy tải (T3, nợ #3):** VẪN MỞ. GIỮ vững: **19,63**
   (s77c). Vùng chuyển tiếp GIỮ→TRUNG GIAN: **(21,07, 26,98]**.
   Bar (c) TUYÊN BỐ KHÔNG ÁP DỤNG cho chế độ hog nice -n 19 (xám
   6 lần liên tiếp) — DỪNG kiểm chứng nó ở chế độ này; nếu muốn
   thử lại thì đăng ký bar MỚI (vd chỉ tickRate, ngưỡng trong
   [1,5]), KHÔNG chỉnh ngưỡng hậu kiểm. Cần parent quyết: (i) trục
   đo cho lượt tải dao động mạnh — giữ sampled MEAN hay chuyển
   sang trung vị/phân vị (s80b thấp nhất trên mọi trục mà offset tệ
   nhất — đổi trục không cứu được liều–đáp ứng); (ii) có chấp nhận
   "vùng chuyển tiếp rộng + nhiễu lớn giữa các lượt" thay cho một
   điểm gãy sắc không, hay cần thêm lượt ở cùng mức tải để tách
   nhiễu (vd lặp lại s79 đúng 56 hog/dial [25,40] thêm 1–2 lượt);
   (iii) cơ chế GIỮ tải trong lúc phát (dial ĐẠT không khóa được
   tải: s80b 38,26 → mean 12,03). Chuẩn tải vẫn hog nice -n 19;
   dãy không-nice vẫn dừng ở 9,59. Luật dial mới (600 s + hog
   ≥90 s) ĐẠT 5/5 lũy kế — đề xuất thành luật đứng. Sampler chết
   sau clip c2 (lần 5 + 6 liên tiếp) — cần luồng khác kiểm tra,
   đừng dùng làm bằng chứng đói nữa. Playhead kẹt 0/8 — giữ mức ưu
   tiên thấp. Element chết format error 0/6 lượt liên tiếp — hạ
   mức ưu tiên.
4. **Lock v2 (T4, nợ #4):** CẢ 3 ĐIỀU KIỆN ĐẠT — khuyến nghị parent
   đổi `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2 ở đợt 117/118 (giữ v1
   frozen làm sao lưu). Caveat (b): tải không giữ >15 suốt 300 s
   (chỉ 62% mẫu, đoạn liên tục dài nhất 189 s) — parent quyết có
   cần đo lại nghiêm ngặt hơn không (với phương pháp hog hiện tại
   thì gần như không thể — pha BẬT ~200 s). Cooldown file tích lũy
   (22 file lúc gộp) — T4 quyết có dọn cooldown cũ không. Giữ lock
   600 s+ trong đợt đông sẽ làm waiter timeout 900 s đói (T1
   TIMEOUT 902 s) — luồng sau giữ dài nên cân nhắc.
5. **WebKit ≤60 ms (T5, nợ #5):** GIỮ nguyên trạng thái S5 (đã có
   lượt yên xác nhận). Không có lượt yên mới trong đợt này. Nợ lượt
   yên theo dõi chuyển tiếp sang đợt 118 (chạy lại 1 lượt yên theo
   cùng prereg trên cây hiện tại; nếu cây đổi thì đo lại baseline
   trên cây mới, không dùng số S5 để chốt cho cây mới). Đổi cổng
   vite T5 sang 5187 (tránh trùng 5186 với T6).
6. **Ghost stale sau seek (T6, nợ #6):** tổng seek vẫn **60/80**,
   stale 5/60 (8,3%), H-D chưa phân biệt được (p=0,1205). Cần thêm
   ≥20 seek trên LƯỢT YÊN SẠCH: nếu yên 0/20 nữa (gộp yên 0/40 vs
   nhiễm 5/40, p≈0,027) → H-D được ủng hộ có ý nghĩa; nếu yên mà
   stale ≥1 → H-D (seek) BỊ BÁC. Event P4 frame-26 + Q5 seq
   282–285: không có dữ liệu mới. Gate A nên kiểm thêm số WebKit
   đang chạy. Đo yield-frame trực tiếp vẫn mở.
7. **EPERM + mù (T7, nợ #7):** mù #35 KHÔNG ĐÓNG HOÀN TOÀN (3 cửa
   sổ mở, tổng 6h49'50", tối đa 24 ẩn danh nghĩa) — chuỗi 3 mù đóng
   liên tiếp đã đứt; parent/user quyết. Mù #36 mới mở (từ probe
   #36, 08:42:46Z) — chứa #53; probe #37 đợt 118. Gap #48→#49 =
   2h03'00" ĐƯỢC CHỨNG NHẬN (CERT n=28, toàn chuỗi n=43). Số thứ
   tự #47–#53 vẫn TẠM THỜI. Mù #31 KHÔNG thử lại (đã thử hết
   nguồn); G1 + mù #22/#28/#29/#30 chờ user quyết (như các đợt
   trước). WFS lần 23 chênh 0.
8. **Seek/preload (T9, nợ #8):** B-Q8-1 KHÔNG ĐẠT (PAUSED 5/5 với
   trần 9,22 s; PLAYING 0/2). Ring 8 MiB KHÔNG phải fix cho
   B-Q8-1. Parent quyết: chấp nhận race + fallback (bằng chứng:
   fallback HTTP phát đủ frames 8/8; mode lỗi không-wrap ~6% cũng
   được fallback che — cả 3 instance đều phát đủ frames) hay hướng
   khác. Nếu chấp nhận: ghi nhận "blob race → HTTP fallback" là
   hành vi thiết kế + đo thêm chi phí fallback. Nợ nhỏ: leg đối
   chứng tách max-size khỏi ring (max-size 4 MiB + ring 8 MiB) để
   khẳng định trần bám theo max-size-bytes; lượt SEEKFAST sạch để
   chấm lại F2 (gộp 8 lượt median 903,5 ms); hook gán qtdemux
   instance cho từng pull (mode không-wrap 3 instance, cơ chế chưa
   rõ); kiểm tra Chromium/Electron production có race tương tự
   không (nếu race chỉ tồn tại trong probe WebKitGTK thì B-Q8-1 là
   vấn đề của môi trường đo, không phải của sản phẩm).
9. **Hạ tầng — replay #53 đình trệ (MỚI, T5+T6+T10):** replay sau
   boot #53 0 hoạt động trong 65+ phút (dpkg.log chỉ 2 dòng
   09:48:02–03Z) — lần đầu tiên trong chuỗi #46/#47/#48/#52 mà
   replay không tới. Postboot #53 FAIL (5 lib + GST + 11 package);
   O8 WebKit exit=2 vì thư mục GST hệ thống không tồn tại; T5/T6
   bị chặn gate 0. Parent quyết: (a) vì sao replay không kích hoạt
   trên boot #53 (cơ chế trigger là gì?); (b) có nên cho luồng hạ
   tầng chạy `postboot-check.sh --repair` cho boot hiện tại khi
   replay đã quá hạn mà không chạy — hay vẫn giữ luật "chờ replay,
   không repair mù" của R9; (c) đề xuất của T5: ở lượt cron sau,
   nếu boot mới mà replay vẫn không tới trong ~15 phút thì luồng
   hạ tầng chạy --repair có kiểm soát (ghi rõ trước/sau, không
   repair trong lúc apt đang chạy). Đề xuất R9 (a) (cron chạy
   watcher v2 ở đầu mỗi lượt với `--wait-new-boot`) vẫn mở — nhắc
   lần 3 (T8 chứng minh độ trễ spawn subagent ~2,5' nuốt trọn cửa
   sổ replay nhanh ~2'16"). Headroom rơi tiếp (948 → 925) — vite
   `watch.ignored` vẫn bắt buộc. `--repair` với code mới (timeout
   + khóa symlink) vẫn CHƯA được chạy sống lần nào; đổi thứ tự mục
   apt trước mục GST trong `--repair` (phương án A) chờ parent
   duyệt. Postboot #50/#51 chưa từng được kiểm — đã mất log vĩnh
   viễn. Bracket replay #49 chỉ còn cận trên (PASS trước +1h10'14").
10. **Nợ nhỏ T10:** (a) đính chính T9 §0 về md5 playing-clean
    (af4d5753, không phải 03bf029f — đã ghi §9); (b) O8 WebKit
    exit=2 là chặn hạ tầng, không phải hồi quy — chạy lại sau khi
    replay/repair xong trên boot sau; (c) poller T10 #1 chết theo
    reboot #53, đã chạy lại (đánh số poll lại từ #1 — đọc log kèm
    ghi chú restart); (d) T10 không chạy lại probe dài nào (chỉ
    đếm lại từ dữ liệu thô + suite + O8) — cây không đổi
    (`03bf029f`) nên không cần.
11. **TTS 39 CẤM kiểm lại; birefnet 0 lần thành công** — chỉ thử
    lại khi RAM đổi (RAM khả dụng ~0,5–2,7 GB < ngưỡng 6 GB; u2net
    là fallback chính thức). ci-security.yml vẫn 403 chờ user. Dial
    load1 đáp ứng chậm 150–390 s (luật hog ≥90 s vẫn đứng; luật
    dial mới 5/5 đề xuất thành luật đứng). Load1 dao động theo chu
    kỳ ~5 phút (giả thuyết quota CPU burst — T4 §6) — báo tải kèm
    threadsR + phân bố tải, đừng tin "dial ĐẠT" theo nghĩa đen.

## 11. Ghi chú vận hành đợt 117

- **Reboot #53 (09:47:08Z, gap 1h17'56"):** giết poller T10 #1 +
  sleep session T10 (runtime restart cùng lúc); driver T3 s80;
  attempt3 T6; lệnh sleep 600 của T5; lần launch F1 của T2. Nhịp
  reboot rút ngắn (~1h18' so với ~2h trước đó). Tần suất reboot
  ~1–2 h/lượt — lượt dài ~35 phút có nguy cơ bị cắt ~30% (T3 §10
  mục 10); checkpoint tăng dần của probe đã cứu dữ liệu thô s80
  (partial + stall-watch 25 mẫu).
- **round-in-progress.md:** KHÔNG TỒN TẠI trong suốt đợt 117
  (đợt 116 đã đóng bởi parent 12:37 +07 15/11, chốt chặn đã xóa) —
  lượt cron 15:35 +07 15/11 mở đợt 117 bình thường. Không có đợt
  main-chat nào chạy song song.
- **Kẽ hở phối hợp dial–sửa cây (§3 §0):** T2 apply H3e trong lúc
  T3 đang dial s80 (dial ngoài lock) → s80 nhiễm cây + VOID; T9
  playing-clean chạy trên cây H3e (af4d5753) → câu §0 viết sai.
  Đề xuất: luồng đo dài ghi cờ "đang dial", hoặc luồng sửa cây hỏi
  trực tiếp trước khi apply. T2 đã chờ T3 xong probe + T1 done mới
  apply — nhưng "xong probe" theo cờ lock không thấy dial sắp
  chạy. Không đổ lỗi — chỉ ghi cơ chế.
- **Exec SIGKILL ~900 s wall-clock (T2 §9):** driver lượt dài PHẢI
  chạy detached (nohup + disown), chỉ poll log file. B0-att2 của T2
  bị kill sau probe exit=0, phải làm tay analyzer + nhả lock.
- **Đếm lại tổng chờ push (T10 đếm trực tiếp từ đĩa bằng script
  đọc NUL-delimited từ mọi file `phase9-round11[1-7]-*.txt`):**
  đợt 117 = **9 batch / 14 entry / 14 file duy nhất**, 0 thiếu, 0
  binary, 0 workflow; **5 file oversize >37.768 B** (cần
  ENABLE_PRIVSEP=0 khi push): probe117t2-frame-parity.mjs
  (68.311 B), probe117t3-frame-parity.mjs (48.898 B),
  PHASE9_ROUND117_T3_LOADBREAK_LIMITS.md (59.600 B),
  PHASE9_ROUND117_T7_EPERM_LIMITS.md (66.715 B),
  webkit_blob_flaky_117t9_2mib.mjs (79.321 B). Đợt 117 + closing
  = **10 batch / 16 entry / 16 file duy nhất** (closing thêm
  LIMITS gộp mới + GAP_ANALYSIS đã có trong batch trước; LIMITS
  gộp 51.310 B cũng oversize, cần ENABLE_PRIVSEP=0).
- **Lũy kế chờ push thật sau đợt 117 (gồm closing): 67 batch /
  130 entry / 111 file duy nhất** + 1 file oversize 6,4 MB
  (`benchmarks/results/webkit-blob-flaky-96x3.json`, vượt giới hạn
  2,8 MB/lần đẩy). Kiểm chéo: lũy kế sau đợt 116 là 57/114/97;
  57+10=67 ✓; 114+16=130 ✓; 97+16−2=111 ✓ (2 file đợt 117 đã
  có trong batch trước: postboot-check.sh (T8) + GAP_ANALYSIS
  (closing)). 8 file nằm trong
  >1 batch (lấy bản mới nhất khi push): PHASE9_GAP_ANALYSIS.md
  (7), vcut-webkit-postboot-check.sh (7),
  vcut-vite-lock-v2.sh (3), preview.tsx (2), playheadHold90R2.ts/
  .test.ts (2), vcut-poll-quiet-v2.sh (2),
  clicktest-87o8-mask-track-headed.mjs (2). File stray
  `phase9-round11-preview-parity2.txt` không thuộc đợt 111–117
  (tên không khớp mẫu đợt) — không đếm vào tổng; parent kiểm lại
  khi push.
- **T10 dùng lock v2 suốt:** suite (giữ 0 s chờ) + O8 (giữ 68 s)
  — không DEFERRED, không STALE-LOCK. File lock v2 T10 dùng là
  bản copy trong thư mục T10 (`vcut-vite-lock-v2.t10.sh`, copy từ
  script sau khi S4 đổi default 600 — md5 `8b02ddc8…` khớp T4).
- **O8 WebKit exit=2** — xem §0: chặn hạ tầng (thư mục GST hệ
  thống không tồn tại trên boot #53), không phải hồi quy sản phẩm.
  Chạy lại sau khi replay/repair xong trên boot sau.
- **T5 dự báo reboot #54 ~11:47Z** (theo nhịp ~2h, chỉ là ước
  tính — nhịp thực vừa rút xuống ~1h18' nên không chắc).

## 12. Quyết parent đề xuất (chờ duyệt, đợt 118)

1. **E4:** giữ ĐÓNG CÓ ĐIỀU KIỆN; chọn 1 trong 3 hướng T1 §3 (giữ
   chờ lô đo lớn / điều tra phương sai ì decoder / quyết theo phân
   tích cơ chế S1).
2. **Zombie:** chấp nhận verdict BỎ của T2 (H3e); quyết A (chấp
   nhận stall ~200–800 ms ở biên dưới tải) hay B (cho làm H3f sau
   bước chẩn đoán storeHeldFrame).
3. **Điểm gãy:** chấp nhận GIỮ lùi về 19,63 + vùng chuyển tiếp
   (21,07, 26,98]; chấp nhận bar (c) KHÔNG ÁP DỤNG cho nice-hog
   (dừng kiểm chứng ở chế độ này); chấp nhận luật dial mới thành
   luật đứng (5/5); quyết trục đo (mean/trung vị) + cơ chế giữ tải
   trong lúc phát.
4. **Lock v2:** chấp nhận khuyến nghị đổi spec sang v2 (3 điều kiện
   đạt, caveat tải §4 đã ghi rõ) — quyết ở đợt 117/118.
5. **WebKit ≤60 ms:** CHẤP NHẬN giữ nguyên trạng thái S5 (không có
   lượt yên mới, không mở lại) — nợ lượt yên theo dõi sang đợt 118.
6. **Ghost seek:** chấp nhận kết quả — H-D chưa phân biệt được
   (p=0,12); nợ ≥80 seek dời sang đợt 118 (cần lượt yên thứ hai).
7. **Mù #35:** KHÔNG ĐÓNG HOÀN TOÀN (3 cửa sổ mở, tổng 6h49'50") —
   parent/user quyết (chấp nhận mức đóng hay để mở như #24/#28/
   #29/#30/#31); mù #36 mới mở (chứa #53) — probe #37 đợt 118.
   Chấp nhận chứng nhận gap #48→#49 = 2h03'00" (CERT n=28).
8. **Seek/preload:** chấp nhận B-Q8-1 KHÔNG ĐẠT; ring 8 MiB KHÔNG
   phải fix; quyết chấp nhận race + fallback (bằng chứng fallback
   8/8) hay hướng khác.
9. **Hạ tầng:** quyết repair policy cho replay đình trệ (T5 §6:
   nếu boot mới mà replay không tới trong ~15 phút thì luồng hạ
   tầng chạy --repair có kiểm soát) + quyết đề xuất R9 (a) (cron
   chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot`) — nhắc
   lần 3. Chấp nhận O8 WebKit exit=2 là chặn hạ tầng, chạy lại sau
   khi replay/repair xong.
10. **Đính chính T9:** chấp nhận đính chính §9 (playing-clean chạy
    trên cây H3e af4d5753, không phải 03bf029f; verdict B-Q8-1
    không đổi).

## 13. Quyết parent (main chat, 18:0x +07 15/11/2026 — đóng đợt 117)

- **Kiểm chứng của parent:** T10 gộp 9/9 luồng (T1–T9) + tự verify:
  suite cây gộp 27/27 exit 0; O8 Chromium 21/21 exit 0 (boot #53);
  O8 WebKit exit=2 (chặn hạ tầng, không phải lỗi sản phẩm);
  preview.tsx md5 03bf029f trước = sau; media.ts 2c384ed1 không
  đổi. Parent kiểm lại từ đĩa: 10/10 cờ done, aggregate 51.397 B,
  gap §46, closing batch 2 entry; đếm lại **đợt 117 = 10 batch /
  16 entry / 16 file duy nhất; chờ push thật (đợt 111–117) = 67
  batch / 130 entry / 111 file duy nhất + 1 oversize 6,4 MB** —
  khớp đúng số T10 ghi, không cần đính chính. Chốt chặn
  (parent tạo lại 17:45 vì lượt 15:35 không tạo) ĐÃ XÓA sau khi
  đóng — lượt 18:35 mở đợt 118 bình thường.
- **Quyết 1 — E4: chọn hướng (a).** Giữ ĐÓNG CÓ ĐIỀU KIỆN tới khi
  có lô đo lớn đăng ký trước bắt được steady-close + drift re-seek.
  Không chọn (c) — quyết từ phân tích offline một mình sẽ lặp lại
  sai lầm đợt 114 (tuyên đóng trên bằng chứng chưa đủ); không chọn
  (b) — điều tra phương sai ì decoder là đường vòng, không trả lời
  được fix E4 có giữ không.
- **Quyết 2 — Zombie: chọn B.** Cho làm H3f ở đợt sau, CHỈ SAU
  bước chẩn đoán tách riêng thời gian storeHeldFrame (giả thuyết
  T2 §1.3: tick block chờ decoder ở lần đọc video đầu tiên trong
  tick). Không chọn A (chấp nhận stall ~200–800 ms ở biên) — đó là
  vết khựng lớn nhất còn lại của phát lại, và T2 đã có giả thuyết
  cụ thể để kiểm.
- **Quyết 3 — Điểm gãy:** chấp nhận GIỮ lùi về 19,63 + vùng chuyển
  tiếp (21,07, 26,98]; chấp nhận bar (c) KHÔNG ÁP DỤNG cho
  nice-hog (dừng kiểm chứng ở chế độ này; thử lại thì đăng ký bar
  MỚI, không chỉnh ngưỡng hậu kiểm); chấp nhận luật dial mới
  (600 s + hog ≥90 s, 5/5) thành LUẬT ĐỨNG. Trục đo: giữ sampled
  MEAN (liên tục với mọi biên trước đây; s80b thấp nhất trên mọi
  trục nên đổi trục không cứu được liều–đáp ứng). Mô hình làm việc:
  chấp nhận "vùng chuyển tiếp rộng + nhiễu lớn giữa các lượt" thay
  cho một điểm gãy sắc; đợt 118 lặp lại s79 đúng 56 hog/dial
  [25,40] thêm 1–2 lượt để tách nhiễu. Cơ chế GIỮ tải trong lúc
  phát: chưa quyết — giữ làm nợ đợt 118 (cần thiết kế, không quyết
  vội).
- **Quyết 4 — Lock v2: CHẤP NHẬN đổi spec sang v2 từ đợt 118.**
  Cả 3 điều kiện đạt (mẫu waiter thật đủ dày; timeout 300 s nổ sau
  301 s tường, giãn 1,003× so với 1,34× trước vá; aging 600: waiter
  702 s vẫn giữ lock, key lật đúng mốc created+600 s). Caveat (b)
  đã ghi rõ (tải không giữ >15 suốt 300 s do chu kỳ tải ~5 phút) —
  không chặn vì (a) và (c) đạt đầy đủ và v2 đã là chuẩn thực tế
  trong đợt từ đợt 116. Giữ v1 frozen (fd21193c) làm sao lưu.
  `VCUT_VITE_LOCK_FREEZE_SPEC` đổi sang v2 ở đợt 118.
- **Quyết 5 — WebKit ≤60 ms:** chấp nhận giữ nguyên trạng thái S5
  (không có lượt yên mới, không mở lại); nợ lượt yên theo dõi sang
  đợt 118.
- **Quyết 6 — Ghost seek:** chấp nhận kết quả; H-D chưa phân biệt
  được (p=0,12); nợ ≥80 seek dời sang đợt 118 (cần lượt yên thứ
  hai).
- **Quyết 7 — Mù #35:** KHÔNG ĐÓNG HOÀN TOÀN (ghi đúng mức: đoạn
  A+E đóng, B/C/D mở, tổng 6h49'50", tối đa 24 reboot ẩn) — để mở
  như #24/#28/#29/#30/#31, không tuyên đóng. Chấp nhận chứng nhận
  gap #48→#49 = 2h03'00" (CERT n=28, FULL n=43).
- **Quyết 8 — Seek/preload:** chấp nhận B-Q8-1 KHÔNG ĐẠT; ring 8
  MiB KHÔNG phải fix; chấp nhận race + fallback làm hành vi hiện
  tại (fallback HTTP 8/8 đã chứng minh). Không thử thêm hướng
  ring-layer trừ khi có cơ chế mới.
- **Quyết 9 — Hạ tầng:** CHẤP NHẬN repair policy — nếu boot mới
  mà replay không tới trong ~15 phút thì luồng hạ tầng chạy
  --repair có kiểm soát (luật đứng mới). Đề xuất R9 (a) (cron chạy
  watcher v2 ở đầu mỗi lượt với --wait-new-boot) KHÔNG PHÊ DUYỆT
  ở đây — đó là thay đổi thân cron, cần user đồng ý; đã đưa ra
  hỏi user lúc đóng đợt (lần nhắc thứ 3 của vòng lặp). Chấp nhận
  O8 WebKit exit=2 là chặn hạ tầng, chạy lại sau khi replay/repair
  xong.
- **Quyết 10 — Đính chính T9:** chấp nhận (playing-clean chạy trên
  cây H3e af4d5753, không phải 03bf029f; verdict B-Q8-1 không đổi).

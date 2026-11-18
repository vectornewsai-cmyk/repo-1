# PHASE9_ROUND122_T9_WEBKIT60MS_LIMITS — WebKit lượt yên theo dõi lần 4: KHÔNG CHẠY ĐƯỢC (chặn bởi hạ tầng, 2 boot) — ngưỡng GIỮ

> Luồng T9, đợt 122, lượt cron 18:35 +07 16/11/2026 (bắt đầu ~11:37Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — 0 LƯỢT YÊN ĐỢT NÀY (CHẶN BỞI HẠ TẦNG, 2 BOOT).**
> 1. **Boot #64 (11:05:18Z): gate 0 KHÔNG BAO GIỜ ĐẠT — 37 poll**
>    (b64 #1–#30, 11:40–12:38Z + b64b #31–#37, 12:41–12:53Z),
>    postboot check-only exit 1 ở MỌI poll, apt không bao giờ im.
>    Replay kẹt ở `apt-get update` pid 855 (11:35Z → reboot, 63+
>    phút, 0 tiến triển: dpkg.log 2 dòng, lists kẹt 111 file từ
>    11:48Z, partial im từ 11:41:39Z). T5 kết luận chế độ lỗi MỚI
>    "sống nhưng kẹt" — luật replay-chết §8.2 KHÔNG kích hoạt
>    (apt còn chạy) → KHÔNG repair; postboot FAIL suốt lượt.
> 2. **Reboot #65 (12:53:25Z)** giết gate0-wait + poller + phiên chờ
>    của T9. Khởi động lại gate0-wait trên boot mới theo tiền lệ
>    (phụ lục 3 prereg): **10 poll (#1–#10, 12:56–13:14Z), gate 0
>    vẫn KHÔNG ĐẠT** — replay #65 chạy thật (dpkg 2→279 dòng) nhưng
>    chưa xong; postboot FAIL ở mọi poll; apt không im lúc poll #10
>    (apt-get pid 6642, dpkg 279 dòng, RAM 859 MB).
> 3. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi).** Không có lượt yên
>    mới nên không áp dụng quy tắc quyết định prereg §1 — 3 lượt yên
>    hợp lệ trước đó vẫn đứng (S5 49,5 / T4-118 40,0 / T3-121 52,0).
>    **Nợ lượt yên theo dõi lần 4 CHUYỂN TIẾP sang đợt 123.**
> 4. **Cây đo ĐỔI giữa chừng (prereg phụ lục 1, trước khi đo):**
>    T3 A/B H3f TRUNG TÍNH → patch ĐÃ GỠ 12:02:56Z, cây về baseline
>    `03bf029f` (theo quyết parent đợt 121 "TRUNG TÍNH → GỠ").
>    Lượt yên lần 4 (khi chạy được) sẽ đo trên baseline này — cùng
>    cây với S5/T4-118, chỉ T3-121 đo trên cây patch.
> 5. Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…`
>    khớp). Dry-run analyzer PASS (S5 49,5/75,0; A8 40,0/64,7).
>    tsc apps/web exit 0 trên cây cuối. T9 không sửa production.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round122-t9/prereg-t9.md` — viết TRƯỚC
  mọi phép đo (11:39Z), đăng ký: dùng probe đã sửa đợt 121 nguyên
  vẹn, chờ cờ postboot T5 đợt 122, gate 0 + lớp A + lớp B gồm B5,
  ngưỡng ≤60 ms, quy tắc quyết định, theo dõi stale-ghost.
  **Phụ lục 1 (~12:11Z):** cây đo đổi 5be5a250 → 03bf029f (patch
  H3f gỡ theo quyết parent; T3 A/B TRUNG TÍNH). **Phụ lục 2
  (~12:20Z):** gia hạn gate0-wait thêm 30 phút (tổng tối đa 90
  phút) vì replay #64 chưa chết (apt còn chạy) và watcher T5 còn
  chạy tới ~12:38Z. **Phụ lục 3 (~12:56Z):** reboot #65 → khởi
  động lại gate0-wait, tối đa 10 poll (~12:57→~13:17Z), thích ứng
  (0a'') VANG-T7-DONE vì T5/T7 đều đã done. Cả 3 phụ lục đều viết
  TRƯỚC khi chạy phép đo mà chúng điều chỉnh (và đợt này KHÔNG CÓ
  phép đo nào — chỉ có poll gate 0).
- **Boot trong đợt: HAI boot — #64 rồi #65.**
  - Boot #64 (`uptime -s` 2026-11-16 11:05:18Z, boot_id
    `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`, số tạm "#64" — chờ T6
    đếm lại): T9 bắt đầu trên boot này (~11:37Z, boot ~32' tuổi).
    Gap sau #63 (08:53:05Z) = 2h12'13".
  - Boot #65 (`uptime -s` 2026-11-16 12:53:25Z, boot_id
    `fbc42445-8967-473e-bab7-d690d49ce13a`): reboot giữa đợt, xảy ra
    GIỮA lúc gate0-wait nối tiếp b64b đang chạy (poll #37 lúc
    12:53:35Z — timestamp muộn hơn giờ boot 10 giây, khớp hiện
    tượng NHẢY CLOCK tại reboot đã thấy ở #54/#58/#63; xem §7.4).
    Gap #64→#65 = 1h48'07".
- **Replay từng boot:**
  - Boot #64: KHỞI ĐỘNG MUỘN + KẸT — dpkg.log 2 dòng
    `startup packages configure` lúc 11:35:39Z (boot +30'21",
    muộn nhất kể từ #60 +49'51" theo T5); wrapper os-intent pid
    834 + `apt-get update` pid 855 chạy từ 11:35Z và VẪN CHẠY tới
    lúc reboot (etime 01:04:26 lúc 12:40Z theo T5) nhưng KHÔNG
    TIẾN TRIỂN: dpkg 2 dòng suốt, lists kẹt 111 file từ 11:48Z,
    partial im từ 11:41:39Z. `/var/log/apt` không tồn tại.
    Chế độ lỗi MỚI "sống nhưng kẹt" (T5) — không phải dạng (A)
    "tới nhưng thiếu GST", không phải dạng (B) "chạm mà không cài".
    Mirror khỏe (T5 probe đọc-only 12:25Z: azure.archive 200
    trong 0,79 s; archive.ubuntu 200 trong 1,46 s) — apt kẹt ở
    bên trong máy trạng thái fetch của chính nó.
  - Boot #65: CHẠY THẬT — configure 12:54:14Z (boot +49s, nhanh);
    wrapper pid 784 + `apt-get update` pid 805 từ 12:54Z; update
    xong rồi sang install: dpkg.log 2→73 dòng (13:06Z) →130
    (13:08Z) →213 (13:12Z) →226 (13:14Z) →279 (13:15Z); apt-get
    pid đổi liên tục theo từng gói (4187 → 5723 → 6642);
    lists 3→30 file. Replay chưa xong lúc T9 dừng (13:15Z).
- **Cây đo:** lúc T9 bắt đầu preview.tsx `5be5a250` (H3f) /
  media.ts `2c384ed1`; từ 12:02:56Z (T3 gỡ patch) cây ở baseline
  `03bf029f` — ổn định từ 12:04Z qua cả reboot #65 (kiểm lại
  12:55Z + cuối đợt 13:16Z: 03bf029f / 2c384ed1). Lock v2 md5
  `cd0c05c1` — bản ĐÚNG. Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t9-tickcost.py`
  + `analyze-t9-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 và trên JSON T4 attempt8 đợt 118 tái tạo
  đúng median 40,0 / p90 64,7 (khớp 100% với dry-run đợt 120/121).
  Analyzer copy từ đợt 121 hoạt động đúng.
- **RAM host bị ghim thấp (xem §7.1):** boot #64 RAM avail rơi về
  ~403–516 MB trong các poll cuối (giống đợt 121 ~440 MB — áp lực
  ngoài cell); boot #65 mở lại 1879 MB rồi rơi 1450→583 MB trong
  lúc replay cài gói. Inotify headroom (T5): 4440 lúc mở → 4552
  ổn định (hồi từ 0, thấp hơn 5435–5436 của #63 ~900). Vite vẫn
  chỉ chạy với `server.watch.ignored: ["**/**"]` (0 watch) theo
  protocol — không liên quan đợt này vì không chạy vite.
- **Vite lock v2-ONLY**, cổng T9 **5187**. Lock TRỐNG suốt đợt
  (không có attempt nào giữ lock).
- **Các luồng đợt 122 khác (theo cờ .done):** T1, T2, T3, T5, T6, T7,
  T8 đã DONE lúc T9 dừng (~13:17Z); T4, T10 chưa có cờ. T3 done
  12:04:52Z (H3f A/B TRUNG TÍNH → gỡ patch); T5 done ~12:40Z
  (LIMITS hạ tầng đã stage); T6/T7/T8 done trước 12:00Z; T2 done
  trong lúc T9 viết LIMITS (cờ xuất hiện giữa 13:05Z và 13:17Z).

## 1. Gate 0 — boot #64 KHÔNG ĐẠT (37 poll); boot #65 KHÔNG ĐẠT (10 poll)

### 1.1 Boot #64 — gate0-wait b64 30 poll + b64b 7 poll, KHÔNG ĐẠT

- **b64 (11:40:31–12:38:47Z, poll #1–#30):** postboot check-only
  exit 1 ở MỌI poll; apt_procs 2–4 (apt-get update pid 855 +
  wrapper + methods http/https/gpgv/store); dpkg_lines = 2 suốt;
  load1 0,08–10,88 (spike 10,88 ở poll #3 do T3 chạy leg A/B —
  không liên quan gate 0); RAM 403–2319 MB (dao động mạnh, rơi về
  ~410 MB cuối); preview_md5 5be5a250 ở poll #1–#3 rồi 03bf029f
  từ poll #4 (11:46:35Z) — flip do T3 đổi chân A/B, ổn định ở
  03bf029f từ poll #13 (12:04:44Z). t5flag=chua-co suốt 30 poll;
  t7flag=VANG-T7-DONE từ poll #8 (T7 done ~11:54Z).
  Kết thúc b64: "GATE 0 KHONG DAT sau 60 phut poll — CHAN"
  (12:38:47Z).
- **b64b nối tiếp (12:41:33–12:53:35Z, poll #31–#37):** postboot
  exit 1 ở MỌI poll; apt_procs 2; dpkg 2 dòng; RAM 411–898 MB;
  md5 03bf029f ổn định. Reboot 12:53:25Z cắt ở poll #37 (8 poll
  còn lại #38–#45 chưa bao giờ chạy).
- **T5 (chủ hạ tầng) song song:** POSTBOOT_FAIL 11:38Z ("REPLAY
  ĐANG CHẠY — KHÔNG PHẢI REPLAY CHẾT"); watcher 60 poll × 1 phút
  (11:38–12:38Z) + final: postboot exit 1 mọi lần; kết luận chế
  độ lỗi mới "sống nhưng kẹt"; luật §8.2 KHÔNG kích hoạt (điều
  kiện 2(a) không đạt — apt+wrapper đang chạy) → KHÔNG repair;
  T5 done ~12:40Z, LIMITS `docs/PHASE9_ROUND122_T5_INFRA_LIMITS.md`
  đã stage. T5 KHÔNG tự mở rộng luật — CẦN QUYẾT PARENT cho đợt
  123 (xem §9.1).

### 1.2 Reboot #65 — giết tiến trình nền, khởi động lại gate0-wait

- Reboot 12:53:25Z giết gate0-wait b64b + poller 5 phút + phiên
  exec đang sleep chờ của T9 (runtime restart — xem §7.4). Log
  gate0-wait tới poll #37 còn nguyên trên đĩa; không mất dữ liệu
  đo (0 lượt đo).
- Khởi động lại theo tiền lệ đợt 120/121 (prereg phụ lục 3):
  `gate0-wait-t9-b65.sh` (poll #1–#10) + poller, bắt đầu 12:56:15Z.

### 1.3 Boot #65 — gate0-wait b65 10 poll, KHÔNG ĐẠT

- **b65 (12:56:16–13:14:18Z, poll #1–#10):** postboot exit 1 ở
  MỌI poll; apt_procs 2–4; dpkg 2→226 dòng (install đang chạy);
  load1 0,19–1,84; RAM 583–1450 MB; md5 03bf029f ổn định cả 10
  poll. t5flag=chua-co (T5 đã done, không viết cờ cho #65);
  t7flag=VANG-T7-DONE cả 10 poll (thích ứng (0a'') prereg phụ lục
  3). Kết thúc b65: "GATE 0 KHONG DAT sau 10 poll boot #65 — CHAN"
  (13:14:18Z).
- Lúc T9 dừng (13:15:30Z): apt-get pid 6642 vẫn chạy, dpkg 279
  dòng (vẫn đang cài), RAM 859 MB. Replay #65 chưa xong — nhưng
  đã qua hạn mềm 13:15Z trong prereg (phụ lục 3), T9 DỪNG theo
  ngân sách, không chờ thêm.

## 2. Không có lượt yên — verdict ngưỡng giữ nguyên

- **0 lượt yên đợt 122 (T9).** Không có số tickCost mới, không có
  phân tích (b)/F6'/lag5/stale-ghost mới.
- **Verdict ngưỡng (theo prereg §1 — không có lượt ĐẠT lớp B nên
  không áp dụng nhánh quyết định): GIỮ ngưỡng WebKit ≤60 ms.**
  3 lượt yên hợp lệ trước đó vẫn đứng: S5 49,5 ms (đợt 116, cây
  03bf029f) / T4-118 attempt8 40,0 ms (đợt 118, cây 03bf029f) /
  T3-121 attempt1 52,0 ms (đợt 121, cây 5be5a250).
  **Nợ lượt yên theo dõi lần 4 CHUYỂN TIẾP sang đợt 123** — đo trên
  cây baseline 03bf029f hiện tại (patch H3f đã gỡ).
- T9 KHÔNG bịa lượt yên, KHÔNG hạ ngưỡng RAM, KHÔNG đo "cho có".

## 3. Cây đo đổi giữa chừng — H3f TRUNG TÍNH → gỡ patch (prereg phụ lục 1)

- T3 đợt 122 (H3f A/B có kiểm soát, n≥30/chân, cùng boot) DONE
  12:04:52Z: verdict **TRUNG TÍNH** (chân A gộp 58/896 = 6,47%
  tick chậm vs chân B gộp 49/938 = 5,22% — không đạt bar −25%)
  → **patch H3f ĐÃ GỠ THẬT khỏi cây lúc 12:02:56Z** (theo quyết
  parent đợt 121 §12 "TRUNG TÍNH → GỠ"). Nguồn:
  `docs/PHASE9_ROUND122_T3_H3F_AB_LIMITS.md` §0/§5 + cờ
  `round122-t3.done`. `media.ts` không đổi `2c384ed1`;
  `tsc + vite build` PASS trên baseline mới (T3 đã verify;
  T9 kiểm lại tsc exit 0, xem §6).
- Các flip md5 trong lúc gate0-wait (5be5a250 → 03bf029f ở poll #4
  11:46:35Z, 03bf029f ở poll #8 11:54:40Z, rồi 03bf029f liên tục
  từ poll #13 12:04:44Z) là do T3 đổi chân A/B trong lúc chạy —
  đã kết thúc khi T3 done; cây ổn định ở 03bf029f từ 12:04Z qua
  cả reboot #65.
- T9 không sửa production: preview.tsx / media.ts md5 lúc T9 bắt
  đầu (theo cây lúc đó) = lúc T9 dừng (theo cây hiện tại 03bf029f
  — thay đổi duy nhất là do T3 gỡ patch theo quyết parent, không
  phải do T9).

## 4. Probe — dùng nguyên bản đã sửa đợt 121, KHÔNG sửa

- Probe làm việc `hidden_files/round122-t9/probe121t3-ghost-k7.webkit.mjs`
  md5 `dccb8f4c…` — KHỚP bản đã sửa đợt 121 (cả bản trong repo
  `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`). KHÔNG sửa
  probe đợt này (không phát hiện lỗi mới — chưa chạy probe lần nào
  vì gate 0 không mở).
- **Probe KHÔNG đưa vào batch đợt này** (không đổi; đã stage ở đợt
  121, 57.283 B oversize).
- Dry-run analyzer PASS (§0): S5 49,5/75,0; A8 40,0/64,7.

## 5. Kiểm chứng lớp B — KHÔNG ÁP DỤNG (không có lượt đo)

- Không có attempt nào chạy nên không có sampler load-mid, không
  có ps-before/after, không có classb. Ghi rõ để khỏi hiểu lầm:
  file `check-classb-t9.sh` đã chuẩn bị nhưng chưa bao giờ chạy.

## 6. Kiểm chứng hồi quy — cây không đổi (sau khi T3 gỡ patch), tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: kiểm lúc T9 bắt đầu
  (sau khi T3 gỡ patch, 12:04Z) = mọi poll gate0-wait b64b/b65 =
  kiểm cuối (13:16Z). `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 13:16Z, ~23 s).
  `vite build`: KHÔNG chạy lại — T3 đã verify `tsc + vite build`
  PASS trên baseline mới sau khi gỡ patch (12:02–12:04Z); cây md5
  không đổi nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo.

## 7. Sự cố hạ tầng + vận hành trong lúc đo

1. **Replay boot #64 "sống nhưng kẹt" (chế độ lỗi MỚI):** xem §0 +
   §1.1 + LIMITS T5 đợt 122. `apt-get update` pid 855 chạy 63+
   phút, 0% CPU, methods http/https/gpgv/store đều sống, nhưng
   lists kẹt 111 file từ 11:48Z, partial im từ 11:41:39Z, dpkg 2
   dòng. Mirror khỏe (probe đọc-only của T5: HTTP 200). Luật
   §8.2 hiện tại không có điều khoản cho chế độ này — nếu update
   kẹt vô hạn thì boot không bao giờ đủ điều kiện chạy WebKit mà
   cũng không bao giờ đủ điều kiện repair. **CẦN QUYẾT PARENT cho
   đợt 123** (T5 §7 + §10 mục 1; xem §9.1).
2. **RAM host bị ghim thấp (boot #64, xem §0):** RAM avail rơi về
   ~403–516 MB trong các poll cuối dù máy yên (load1 0,08–0,44)
   — áp lực từ ngoài cell (cùng hiện tượng đợt 121 ~440 MB).
   Boot #65 mở lại 1879 MB rồi rơi 1450→583 MB trong lúc replay
   cài gói. Dù gate 0 có mở thì gate A (RAM ≥1024 MB) cũng khó
   đạt ở các lượt sau nếu host không hồi RAM. Ghi nhận: RAM host
   là yếu tố ngoài tầm kiểm soát của luồng đo (không hạ ngưỡng RAM
   để "cho qua").
3. **Reboot #65 12:53:25Z (boot_id `fbc42445…`, gap #64→#65 =
   1h48'07"):** giết toàn bộ tiến trình nền của T9 (gate0-wait
   b64b + poller 5 phút + phiên exec đang sleep chờ — runtime
   restart). T9 khởi động lại cả 3 trên boot mới theo tiền lệ
   đợt 120/121 (prereg phụ lục 3). Bài học: kiểm "ALIVE" bằng
   pgrep PHẢI dùng mẫu bracket `[.]` (bài học đợt 121 §7.1 —
   T9 đã áp dụng khi kiểm poller/gate0-wait sau reboot).
4. **Nhảy clock tại reboot #65 (nghi ngờ, lần 4):** poll #37 của
   gate0-wait b64b ghi 12:53:35Z — muộn hơn giờ boot mới 12:53:25Z
   10 giây (tiến trình boot cũ không thể ghi log sau khi boot mới
   bắt đầu). Cùng mẫu nhảy clock tại reboot như #54/#58/#63 (T4
   đợt 121). Ghi nhận cho T4 chẩn đoán nếu cần; không ảnh hưởng
   kết luận gate 0 (mọi poll đều FAIL rõ ràng).
5. **Lỗi vận hành của T9:** lệnh `pkill -f "poll-t9.sh"` lúc dọn
   tiến trình nền đã tự khớp cmdline của chính phiên exec (chứa
   chuỗi "poll-t9.sh") và kill luôn phiên exec đó (SIGTERM). May
   mắn: poller đã bị kill trước nên không còn tiến trình nền nào
   sót (kiểm lại: NONE-LEFT). Bài học: mọi lệnh pkill/grep-ps đều
   phải dùng mẫu bracket `[.]` để loại chính tiến trình kiểm —
   cùng họ với bài học đợt 120 §7.2 / đợt 121 §7.5.
6. **Runtime restart / exec gián đoạn:** phiên sleep chờ của T9 bị
   gián đoạn do service restart (~12:52Z) — các tiến trình detached
   (gate0-wait, poller) sống qua restart nhưng CHẾT theo reboot
   #65; T9 kiểm tra lại trạng thái từ đĩa; không mất dữ liệu
   (log tới poll #37 còn nguyên).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND122_T9_WEBKIT60MS_LIMITS.md` — file này.
- **KHÔNG đổi file production nào** (preview.tsx thay đổi duy nhất
  là do T3 gỡ patch H3f theo quyết parent, không phải do T9).
  Probe KHÔNG đổi nên KHÔNG stage lại.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round122-t9-webkit.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round122-t9/`
  (prereg-t9.md [viết trước khi đo + phụ lục 1 (cây đổi baseline)
  + phụ lục 2 (gia hạn gate0-wait) + phụ lục 3 (reboot #65,
  khởi động lại gate0-wait)],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t9-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 121],
  analyze-t9-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  b.json [copy đợt 121, md5 `078938cf…`],
  vite.t9-temp.config.mjs [copy đợt 121, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t9.sh [adapt đợt 122: cổng 5187, gate 0 kiểm apt bằng pgrep -x],
  t9-attempt-inner.sh [adapt: $2=PASSES, $3=TICKCOST_TIMEOUT_MS —
  CHƯA BAO GIỜ CHẠY],
  check-classb-t9.sh [lớp B gồm B5 — CHƯA BAO GIỜ CHẠY],
  gate0-wait-t9-b64.sh [boot #64: 30 poll] +
  gate0-wait-t9-b64b.sh [boot #64 nối tiếp: poll #31–#37] +
  gate0-wait-t9-b65.sh [boot #65: 10 poll],
  gate0-wait-t9-b64.log [boot #64: 30 poll, GATE 0 KHÔNG ĐẠT] +
  gate0-wait-t9-b64b.log [boot #64 nối tiếp: 7 poll, reboot cắt] +
  gate0-wait-t9-b65.log [boot #65: 10 poll, GATE 0 KHÔNG ĐẠT],
  gate0-wait-t9-b64.nohup.log + gate0-wait-t9-b64b.nohup.log +
  gate0-wait-t9-b65.nohup.log,
  poll-t9.sh + poll-t9.log [mẫu 5 phút + gate0/gateA] +
  poll-t9.nohup.log + poll-t9-b65.nohup.log,
  postboot-t9-b64-gate0wait-{1..30}.log [boot #64: FAIL hết] +
  postboot-t9-b64b-gate0wait-{31..37}.log [boot #64 nối tiếp: FAIL
  hết] + postboot-t9-b65-gate0wait-{1..10}.log [boot #65: FAIL hết],
  tree-md5.txt [`03bf029f` — sau phụ lục 1]).
- Cờ xong: `hidden_files/round122-t9.done` (kèm verdict 1 dòng).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — 0 lượt yên đợt 122 (chặn bởi hạ
   tầng). Nợ lượt yên theo dõi lần 4 CHUYỂN TIẾP sang đợt 123,**
   đo trên cây baseline 03bf029f hiện tại (patch H3f đã gỡ) theo
   cùng prereg (gate 0 + lớp A + lớp B gồm B5). Các lượt yên đã có:
   S5 49,5 / T4-118 40,0 / T3-121 52,0 (chỉ T3-121 trên cây patch).
2. **Chế độ lỗi replay MỚI "sống nhưng kẹt ở update" (boot #64):
   CẦN QUYẾT PARENT cho đợt 123** (theo T5 LIMITS §7 + §10 mục 1):
   luật §8.2 hiện tại chỉ kích hoạt khi replay CHẾT (apt/dpkg
   im); replay sống-nhưng-kẹt thì không đủ điều kiện repair mà
   cũng không bao giờ đủ điều kiện chạy WebKit. Đề xuất parent
   quyết: thêm điều kiện "kẹt" (vd update không tiến triển >X phút
   dù process sống → coi như chết, cho repair) hoặc quy trình xử
   lý riêng. T9 KHÔNG tự mở rộng luật.
3. **Replay boot #65 ĐANG CHẠY lúc T9 dừng (13:15Z, dpkg 279
   dòng, apt-get pid 6642):** nếu replay #65 cài đủ GST sau đó thì
   đợt 123 có thể đo trên boot #65 mà không cần chờ reboot mới —
   luồng hạ tầng đợt 123 kiểm tra postboot #65 đầu lượt. (T5 đợt
   122 đã done nên không ai theo dõi replay #65 nữa sau 13:15Z.)
4. **RAM host bị ghim thấp (~410 MB boot #64; 583–1450 MB boot
   #65):** áp lực ngoài cell. Gate A (RAM ≥1024 MB lúc bắt đầu)
   và B5 sẽ khó đạt ở các lượt sau nếu host không hồi RAM. Đề xuất
   giữ nguyên ngưỡng RAM (không hạ để "cho qua"); luồng riêng đo
   RAM baseline của trang preview khi chạy idle (nợ quan sát từ
   đợt 120 §9.4, vẫn mở) để tách bleed của trang khỏi áp lực host.
5. **Nhảy clock tại reboot #65 (nghi ngờ, lần 4 sau #54/#58/#63):**
   poll #37 b64b ghi 12:53:35Z muộn hơn giờ boot 12:53:25Z 10
   giây. Ghi nhận cho T4 (mù/clock) chẩn đoán nếu cần; không ảnh
   hưởng kết luận gate 0 đợt này.
6. **(c2) "dang ngo thật" +1f (đợt 121) + stale-ghost:** không có
   dữ liệu mới đợt này (0 lượt đo) — theo dõi tiếp ở lượt yên sau.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 121 §10 + quyết parent
   §12:** E4 chạy bù lượt 3 rồi lượt 4 (T1/T2 đợt 122); H3f A/B
   đợt 122 ĐÃ XONG — TRUNG TÍNH → patch ĐÃ GỠ (nợ A/B ĐÃ ĐÓNG);
   leg B theo PSI v0.1; G1 khung (a) M2 HOÃN chờ user; R9 (a) VẪN
   CHỜ user; birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi.
   Reboot mới nhất: boot #65 12:53:25Z (gap #64→#65 = 1h48'07").
   7/10 luồng đợt 122 đã DONE lúc T9 dừng (T1, T2, T3, T5, T6, T7,
   T8); các luồng còn lại xem build-loop-log.

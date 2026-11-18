# PHASE9_ROUND127_T9_WEBKIT60MS_LIMITS — WebKit lượt yên theo dõi lần 7: KHÔNG CHẠY ĐƯỢC — 3/3 attempt gate A KHÔNG MỞ — ngưỡng GIỮ, nợ chuyển tiếp

> Luồng T9, đợt 127, lượt cron 09:35 +07 17/11/2026 (bắt đầu ~02:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> Không có lượt đo nào chạy được đợt này — 0 probe, 0 số đo tickCost.
>
> **Kết quả chính — KHÔNG CÓ LƯỢT YÊN HỢP LỆ ĐỢT 127.**
> 1. **Reboot giữa đợt:** boot #72 (02:10:17Z) CHẾT ~03:04:25Z
>    (cell reboot, thọ 54m08s); boot #73 mới (03:04:25Z,
>    boot_id `5e522260…`). Gate 0 trên #72 không đạt sau 12 poll
>    (replay kẹt, postboot FAIL, T5 không viết cờ). Không có lượt
>    yên nào trên #72.
> 2. **Gate 0 trên boot #73: ĐẠT ở poll #1 (03:12:45Z)** — T5
>    POSTBOOT_PASS hợp lệ cho boot mới + check-only riêng PASS +
>    apt=0 + cây md5 khớp. Một verdict "GATE 0 ĐẠT" ở poll #13
>    trước đó là **VOID** (dùng cờ T7 stale của boot #72) — đã
>    loại bỏ, không dùng làm cơ sở chạy attempt; lỗi script đã sửa.
> 3. **3/3 attempt gate A KHÔNG MỞ, 0 probe:** attempt1 T8 giữ
>    lock vite suốt 10 phút + RAM rơi 790→253 MB; attempt2 T8 giữ
>    lock (lấy ticket mới giữa chừng) + RAM 187–871 MB, poll 10
>    lock đã nhả nhưng RAM chỉ 418 MB; attempt3 lock trống, load
>    tốt, nhưng RAM kẹt 500–684 MB suốt 10 phút, không lần nào
>    ≥1024 MB. **Không hạ ngưỡng RAM, không đo "cho có".**
> 4. **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** (không đổi) — verdict
>    giữ nguyên trạng thái đợt 126 ("GIỮ — đã có 5 lượt yên xác
>    nhận": 49,5 / 40,0 / 52,0 / 47,5 / 44,0 ms, trung bình
>    46,6 ms). **Nợ lượt yên theo dõi lần 7 CHƯA ĐÓNG — chuyển
>    tiếp sang đợt sau.**
> 5. **(c2) + event lag ≥+5f: KHÔNG CÓ DỮ LIỆU đợt này** — không
>    probe nào chạy nên không quan sát được tái hiện hay không.
>    Không kết luận gì về (c2)/event lag từ đợt này; T5 chẩn đoán
>    đợt 127 dựa trên dữ liệu các đợt trước.
> 6. **Cờ mở leg tải T3 đã touch 03:46:18Z** ngay khi attempt3
>    xong (trước LIMITS/batch) — phối hợp đúng hẹn.
> 7. Probe/analyzer KHÔNG đổi (md5 khớp). Dry-run analyzer PASS
>    (S5 49,5/75,0; A8 40,0/64,7; R126a2 44,0/71,6 tái tạo đúng
>    100%). tsc apps/web exit 0. Cây baseline 03bf029f/2c384ed1
>    không đổi suốt đợt.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round127-t9/prereg-t9.md` — viết TRƯỚC
  mọi phép đo (02:41Z), đăng ký: chờ cờ postboot T5 đợt 127
  (thư mục `round127-t5`, KHÔNG chờ cờ đợt cũ), gate 0 + lớp A +
  lớp B gồm B5, ngưỡng ≤60 ms, quy tắc quyết định, touch cờ
  `round127-t9-done` ngay khi attempt xong để T3 bắt đầu leg tải,
  KHÔNG đo lại RAM idle, KHÔNG đo TTS 39, KHÔNG thử birefnet.
- **Phụ lục prereg boot #73:**
  `hidden_files/round127-t9/prereg-t9-addendum-boot73.md` — viết
  TRƯỚC khi đo trên boot mới (03:11Z), sau khi xác nhận reboot:
  verdict gate-0 poll #13 VOID, lỗi stale VANG-T7-DONE, gate 0
  boot #73 chạy lại từ poll #1 với waiter đã sửa.
- **Boot trong đợt: HAI boot — #72 chết, #73 mới.**
  Boot #72 (`uptime -s` 2026-11-17 02:10:17Z, boot_id
  `81464315-ba1a-460d-b370-92a1673accc1`, số #72 theo task).
  Gap #71→#72 = 2h44'36" (#71 btime 23:25:41Z 16/11 → #72
  02:10:17Z). Boot #73 (`uptime -s` 2026-11-17 03:04:25Z,
  boot_id `5e522260-235e-4394-a888-bce604728204`, số #73 tạm —
  T5/T6 xác nhận; T9 không đụng bookkeeping mù). Gap #72→#73 =
  54m08s. Reboot xảy ra giữa gate0-wait poll #12 trên #72
  (03:04:44Z) và lúc T9 khởi động lại waiter (03:10:16Z). T5 xác
  nhận chéo trong `round127-t5/t5-reboot-note.md` (journal/wtmp
  chỉ còn boot mới, first entry 03:04:36Z, +11s).
- **Replay boot #72: CHẾT DỞ.** 48 installs, gọi cuối 02:48:06Z,
  dpkg im từ đó (dpkg_lines kẹt 350 từ poll #4 tới #12); T5
  EVAL_8.2B TRIGGER=YES dạng (A) lúc 02:58:29Z; `--repair` chạy
  03:04:31Z (PID 18652, GST symlink → debroot xong, apt update
  vừa bắt đầu) thì REBOOT GIẾT repair — POSTBOOT_PASS không bao
  giờ được viết cho #72. Symlink GST trên #72 mất theo rootfs
  rebuild (ephemeral). T9 không tự repair (luật đứng).
- **Replay boot #73: KHỎE, XONG NHANH.** Configure 03:05:03Z
  (boot +38s), installs 195 lúc 03:08:43Z, xong ~03:09:22Z;
  dpkg_lines=1509; T5 POSTBOOT_PASS hợp lệ poll=2 pass_at
  03:11:16Z ("done_pass_stable_2polls").
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 02:41Z = mọi poll gate0/gate A =
  kiểm cuối 03:46Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t9-tickcost.py`
  + `analyze-t9-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0; trên JSON T4 attempt8 đợt 118 tái tạo
  đúng median 40,0 / p90 64,7; trên JSON T9 attempt2 đợt 126 tái
  tạo đúng median 44,0 / p90 71,6 (khớp 100% với LIMITS đợt 126).
  Analyzer copy từ đợt 126 hoạt động đúng.
- **RAM host dao động mạnh + sụt dài (xem §7.1):** boot #72:
  538–2327 MB; boot #73 trong cửa sổ attempt: 187–955 MB, phần
  lớn <1024 MB. Vite vẫn chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) theo protocol
  (không có vite T9 nào chạy đợt này vì gate A không mở).
- **Vite lock v2-ONLY**, cổng T9 **5187** (không dùng đợt này —
  không attempt nào tới được probe). T9 không giữ lock lần nào.
- **Các luồng đợt 127 khác:** lúc T9 bắt đầu (02:41Z) đã có
  round127-t1/t4/t6/t8/t9; round127-t5 xuất hiện 02:42Z, round127-t3
  xuất hiện ~03:05Z (watcher T3 pid 1874, poll cờ T9). Các .done
  trên boot #72 (đều trước reboot, ghi nhận, không dùng cho gate 0
  boot mới): t1.done 02:45:35Z, t2.done 02:43:31Z, t4.done
  02:53:35Z, t6.done 02:50:32Z, t7.done 02:45:38Z. T4.done lúc
  02:53:35Z — T4 kết thúc việc của nó trên #72 mà không cần cờ T9
  (load trong các poll gate0 #10–#12 chỉ 0,26–0,89, không có hog
  nào chạy trong cửa sổ chờ của T9).

## 1. Gate 0 — boot #72 KHÔNG ĐẠT sau 12 poll; boot #73 ĐẠT ở poll #1 (03:12:45Z)

### 1.1 Boot #72 (02:42:41–03:04:44Z, poll #1–#12, KHÔNG ĐẠT)

- Poll #1 (02:42:41Z): t5flag=chưa-có + t7flag=chưa-có +
  postboot_exit=1 + apt_procs=1 (aptx=1) + dpkg_lines=2 +
  load1 0,76 + RAMavail 1394 MB + preview_md5=03bf029f.
- Poll #2 (02:44:41Z): postboot_exit=1 + aptx=1 + dpkg_lines=2
  + load1 3,29 + RAM 1716 MB.
- Poll #3 (02:46:42Z): t7flag=VANG-T7-DONE (round127-t7.done
  02:45:38Z) + postboot_exit=1 + aptx=1 + dpkg_lines=2 + load1
  3,47 + RAM 2011 MB.
- Poll #4 (02:48:42Z): postboot_exit=1 + apt_procs=0 + dpkg_lines
  350 (nhảy 2→350, installs 48) + load1 3,18 + RAM 2327 MB.
- Poll #5–#9 (02:50:42–02:58:43Z): postboot_exit=1 + apt=0 +
  dpkg_lines KẸT 350 + load1 1,21→0,51 + RAM 2202→1314 MB.
  T5 EVAL_8.2B TRIGGER=YES dạng (A) từ poll 4 (02:58:29Z) nhưng
  chưa có repair process nào chạy tới 03:04Z.
- Poll #10–#11 (03:00:43–03:02:43Z): postboot_exit=1 + apt=0 +
  dpkg 350 + load1 0,26 + RAM 936→719 MB.
- Poll #12 (03:04:44Z): postboot_exit=1 + aptx=1 (apt-get xuất
  hiện lại — repair của T5 bắt đầu 03:04:31Z) + dpkg 350 +
  load1 0,89 + RAM 487 MB. **Đây là poll cuối trên #72 — reboot
  giết gate0-wait + poll-t9.sh ngay sau đó (~03:05Z, service
  restart).**
- Nguyên nhân gate 0 #72 không đạt: postboot FAIL suốt 12 poll
  (thiếu libEGL/libavif/libevdev + GST thiếu isomp4/libav + apt
  thiếu 9 package — xem `postboot-t9-81464315-gate0wait-4.log`:
  "CHUA DU — chạy lại với --repair, hoặc chờ apt replay xong").
  Replay kẹt từ 02:48:06Z (silent 924s lúc T5 poll 9).

### 1.2 Verdict "GATE 0 ĐẠT" poll #13 — VOID (03:10:17Z, không dùng)

- Sau reboot, T9 khởi động lại waiter (resume từ poll #13,
  03:10:16Z). Poll #13 ghi: t5flag=chưa-có + t7flag=VANG-T7-DONE
  + postboot_exit=0 + apt=0 + dpkg 1509 + load1 2,59 + RAM 1037 MB
  + md5 03bf029f → script kết luận "GATE 0 ĐẠT".
- **VOID vì:** `round127-t7.done` mtime 02:45:38Z thuộc boot #72,
  TRƯỚC boot mới 03:04:25Z — cờ STALE. Script gốc chỉ kiểm sự
  tồn tại của file .done, không kiểm mtime/boot (lỗi chỉ lộ ra khi
  reboot giữa đợt; các đợt trước không reboot trong lúc chờ nên
  chưa từng kích hoạt). Postboot_exit=0 lúc đó là THẬT trên boot
  mới (replay #73 đã xong), nhưng (0a) không thỏa vì cờ T5/T7
  hợp lệ cho boot mới chưa có. **Không có attempt nào chạy theo
  verdict này.** Đã ghi chú VOID vào log + phụ lục prereg boot73
  TRƯỚC khi chạy waiter mới.
- **Đã sửa:** waiter boot #73 (`gate0-wait-t9-5e522260.sh`) chỉ
  tính VANG-T7-DONE khi mtime .done ≥ boot mới; các đợt sau nên
  mang fix này vào script gốc.

### 1.3 Boot #73 (03:12:44–03:12:45Z, poll #1, ĐẠT)

- **Poll #1 (03:12:45Z):** t5flag=PASS (T5 POSTBOOT_PASS cho #73,
  boot_id `5e522260…` KHỚP, btime 03:04:25Z KHỚP, mtime
  03:11:16Z ≥ boot — luật STALE thỏa) + t7flag=cu(mtime-cu)
  (stale .done đã bị loại đúng) + postboot-check check-only riêng
  PASS (exit 0 — libs đủ, GST đủ isomp4+libav, apt đủ 11 package)
  + apt_procs=0 + dpkg_lines=1509 + load1=0,69 + RAMavail=768 MB
  + preview_md5=03bf029f. **GATE 0 ĐẠT từ poll #1.**
- run-t9.sh gate 0 try 1 PASS ở cả 3 attempt (postboot 0, aptx 0,
  dpkgx 0).

## 2. Gate A — 3/3 attempt KHÔNG MỞ (0 probe)

### 2.1 Attempt1 (03:14:13–03:24:22Z, poll 1–10, KHÔNG MỞ)

- T8 giữ lock vite suốt 10 phút (thread=t8-round127, pid 8172,
  port 5490, ticket 1-1794885235577279874-8652-t8-round127,
  vite m4 config + clicktest-85m4-webkit-w7.mjs + MiniBrowser/
  WebKitWebProcess) + blockers=9 suốt + RAM rơi liên tục.
- Poll 1 (03:14:14Z): load1=2,20 load5=1,49 lock=T8 blockers=9
  RAM=784MB; p2: 1,74/1,48 T8 9blk 742MB; p3: 0,68/1,22 T8 9blk
  704MB; p4: 0,47/1,07 T8 9blk 631MB; p5: 0,17/0,87 T8 9blk 528MB;
  p6: 0,48/0,83 T8 9blk 449MB; p7: 1,10/0,88 T8 9blk 410MB;
  p8: 0,73/0,81 T8 9blk 350MB; p9: 0,60/0,75 T8 9blk 317MB;
  p10 (03:23:15Z): 0,43/0,66 T8 9blk 253MB.
  **HẾT 10 PHÚT GATE A KHÔNG MỞ — KHÔNG chạy probe (exit 5).**
  Chặn cả 3 điều kiện cùng lúc: lock + blockers + RAM (RAM không
  lần nào ≥1024 trong 10 phút).

### 2.2 Attempt2 (03:24:39–03:34:40Z, poll 1–10, KHÔNG MỞ)

- Poll 1 (03:24:39Z): load1=1,09 load5=0,77 lock=T8 blockers=9
  RAM=223MB; p2: 0,57/0,69 T8 9blk 309MB; p3: 1,15/0,85 T8 9blk
  871MB; p4: 0,59/0,76 T8 9blk 742MB; p5: 0,22/0,62 T8 9blk 643MB;
  p6 (03:29:40Z): 1,25/0,82 lock=T8 **ticket MỚI
  1-1794886150842** 9blk 603MB — T8 lấy ticket mới (harness nối
  tiếp); p7: 1,71/0,99 T8-mới 9blk 515MB; p8: 1,20/1,01 T8-mới
  9blk 527MB; p9: 0,47/0,84 T8-mới 9blk 520MB;
  p10 (03:33:40Z): 0,95/0,86 **lock=khong blockers=0** RAM=418MB
  — T8 vừa nhả lock ở poll cuối nhưng RAM chỉ 418 MB.
  **HẾT 10 PHÚT GATE A KHÔNG MỞ (exit 5).** Chặn: lock 9/10 poll
  + RAM không lần nào ≥1024.

### 2.3 Attempt3 (03:35:25–03:44:26Z, poll 1–10, KHÔNG MỞ)

- Lock TRỐNG cả 10 poll, blockers=0, load1/load5 đều <2 —
  **chỉ còn RAM chặn.**
- Poll 1 (03:35:26Z): load1=1,29 load5=1,06 lock=khong blockers=0
  RAM=646MB; p2: 0,56/0,89 627MB; p3: 0,67/0,88 570MB;
  p4: 0,38/0,76 531MB; p5: 0,29/0,66 534MB; p6: 0,20/0,57 535MB;
  p7: 0,10/0,48 558MB; p8: 0,59/0,53 591MB; p9: 0,84/0,68 662MB;
  p10 (03:44:26Z): 0,45/0,60 500MB.
  **HẾT 10 PHÚT GATE A KHÔNG MỞ (exit 5).** RAM kẹt 500–684 MB
  suốt 10 phút, không lần nào ≥1024 MB. Máy yên hoàn toàn về
  load/lock nhưng RAM host không hồi.
- **Hết ngân sách 3 attempt theo prereg — T9 DỪNG, không chạy
  attempt 4.** Không hạ ngưỡng RAM, không đo "cho có".

## 3. Lượt yên attempt — KHÔNG CÓ (0 probe, 0 số đo)

- Không có probe nào chạy: không có JSON lượt đo, không có
  tickCost median, không có phân rã wallMs, không có lớp B (lớp B
  chỉ đánh giá sau probe — không áp dụng), không có sampler
  load-mid, không có ps-before/after.
- **(b) unique-match / F6': KHÔNG CÓ DỮ LIỆU** — không chạy
  analyzer trên lượt yên (không có JSON). F6' vẫn ĐÃ ĐÓNG từ L7,
  không thay đổi.
- **(c2) lệch nhãn +1f: KHÔNG QUAN SÁT ĐƯỢC đợt này** — không
  probe nên không biết có tái hiện lần 4 hay không. Không kết
  luận gì; T5 chẩn đoán đợt 127 dựa trên dữ liệu đợt 121/125/126.
- **Event lag ≥+5f (seq 276–279, frame 27, đợt 126): KHÔNG QUAN
  SÁT ĐƯỢC đợt này** — cùng lý do. Không có event mới nào để
  đối chiếu.

## 4. Phân tích verdict ngưỡng — GIỮ ≤60 ms, nợ lần 7 chuyển tiếp

- **Không có lượt yên hợp lệ đợt 127 nên quy tắc quyết định
  prereg §1 KHÔNG áp dụng nhánh median ≤60 hay >60.**
  Verdict ngưỡng giữ nguyên trạng thái đợt 126: **GIỮ ≤60 ms —
  đã có 5 lượt yên xác nhận** (S5 49,5 / T4-118 40,0 / T3-121
  52,0 / T9-125 47,5 / T9-126 44,0; trung bình 46,6 ms).
- **Nợ lượt yên theo dõi lần 7: CHƯA ĐÓNG — chuyển tiếp sang
  đợt 128** (hoặc lượt parent xếp). Không siết, không mở lại
  ngưỡng từ đợt không có số đo.

## 5. Đo RAM baseline idle — KHÔNG CHẠY (nợ đã đóng)

- Nợ đợt 120 §9.4 ĐÃ ĐÓNG ở đợt 125 (trang preview idle ~800 MB).
  Theo task đợt 127, T9 KHÔNG đo lại. Không có file ram-idle mới.

## 6. Cây đo — baseline, không đổi

- preview.tsx md5 `03bf029f` không đổi: lúc bắt đầu (02:41Z) =
  mọi poll gate0/gate A = kiểm cuối (03:46Z). `media.ts` md5
  `2c384ed1` không đổi.
- T9 không sửa production: không có thay đổi nào do T9; cây giữ
  baseline theo quyết parent đợt 122 (H3f đã gỡ, không apply lại).
- Probe KHÔNG đổi nên KHÔNG stage lại probe. Script
  `gate0-wait-t9-5e522260.sh` đã sửa lỗi stale VANG-T7-DONE
  (bản copy trong `hidden_files/round127-t9/`, ngoài repo — không
  stage). Sampler trong `t9-attempt-inner.sh` dùng nguyên bản đã
  sửa đợt 125 (không chạy đợt này vì không attempt nào tới probe).
- Hậu tố log: `81464315` = boot #72 (gate0-wait #1–#12, poll #13
  VOID); `5e522260` = boot #73 (gate0-wait #1 ĐẠT, attempt1–3,
  tsc/postboot sau lượt). Log attempt trong `run-t9.sh` mang hậu
  tố `5e522260` (đã sửa trước attempt1).

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 RAM host sụt dài, không hồi (không ghim phẳng)

- RAMavail trong đợt: boot #72: 538–2327 MB (lúc mở đợt 1481 MB,
  lên 2327 MB lúc replay đang cài, rồi rơi dần 936→719→487 MB
  trước reboot); boot #73: 187–955 MB trong cửa sổ attempt
  (03:14–03:44Z), chỉ 2 lần >900 MB (871 MB poll attempt2 #3,
  955 MB lúc 03:46Z sau khi dừng) và **không lần nào ≥1024 MB
  trong 30 poll gate A**. Sau khi T9 dừng (03:46Z): 955 MB.
- Không có process đơn lẻ nào chiếm RAM lớn (top %MEM lúc
  03:24Z: hatch daemon 2,6%, WebKitWebProcess 2,5%, MiniBrowser
  1,8%) — áp lực host-level (ngoài cell), giống đợt 124/125/126.
  Ngưỡng RAM giữ nguyên (không hạ để "cho qua").

### 7.2 Hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (02:41Z) = mọi poll gate0-wait/gate A = kiểm cuối (03:46Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy 03:46:18–03:46:40Z, ~22 s).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo nào cần hồi quy thêm.
- Postboot-check sau lượt: exit 0 (03:46Z) — replay boot #73 vẫn
  PASS sau khi đo xong.

### 7.3 Sự cố hạ tầng + vận hành trong lúc đo

1. **Cell reboot giữa đợt (~03:04:25Z):** giết gate0-wait +
   poll-t9.sh của T9, giết repair --repair của T5 trên boot #72,
   giết watcher v3 của T5 (PID 15469). T5 đã khởi động lại watcher
   v4 + postboot-check cho boot mới; T9 khởi động lại waiter +
   poller sau reboot (03:10:16Z). Bài học: mọi waiter/poller
   detached đều chết theo reboot — đợt sau nếu reboot cắt giữa
   chừng phải kiểm tra tiến trình của mình còn sống không trước
   khi tin log.
2. **Verdict gate-0 VOID poll #13 (03:10:17Z):** nhánh
   VANG-T7-DONE không kiểm mtime — đã sửa trong waiter boot #73
   (chỉ tính khi mtime .done ≥ boot mới). Fix này cần mang vào
   script gốc các đợt sau (không chỉ bản copy đợt 127).
3. **Attempt1+2 gate A không mở:** T8 vite harness giữ lock gần
   như liên tục (clicktest-85m4-webkit-w7.mjs, 2 ticket nối tiếp:
   1794885235577… rồi 1794886150842) + RAM không lần nào ≥1024.
   Không phải lỗi T9; attempt1/2 không chạy probe, không mất số
   đo. T9 chờ cửa yên rồi chạy attempt3.
4. **Attempt3 gate A không mở vì CHỈ CÒN RAM:** lock trống,
   blockers 0, load <1 cả 10 poll, nhưng RAM kẹt 500–684 MB.
   Đây là lần đầu tiên T9 gặp attempt mà mọi điều kiện trừ RAM
   đều thỏa suốt 10 phút — bằng chứng RAM host là nút thắt chính
   đợt này, không phải tranh lock.
5. **Phối hợp lịch T3 ĐÚNG HẸN đợt này:** T3 chờ cờ T9, không
   chạy hog trước 03:46:18Z; T9 touch cờ `round127-t9-done` ngay
   03:46:18Z khi attempt3 xong (trước LIMITS/batch); T3 watcher
   (pid 1874) đang poll cờ. Cửa yên đã mở cho leg tải T3.
6. **Quirk check-classb (ghi lại, không sửa giữa đợt):** dòng
   `--- KET LUAN LOP B:` trong file classb trống (không in verdict
   tổng) — cả đợt 125/126 đều vậy. Không chạy classb đợt này (không
   có probe) nên không ảnh hưởng.
7. **Quirk tên thread trong vite lock:** ticket/lock ghi
   `thread=t3` (do run-attempt wrapper đặt) trong khi luồng là T9
   — tiền lệ đợt 126 §8.4. Không attempt nào giữ lock đợt này nên
   không ảnh hưởng.
8. **T4.done 02:53:35Z trên boot #72** — T4 kết thúc việc của nó
   mà không cần cờ T9 (xem §0). Ghi nhận, không phải nhiễm tải
   trong cửa sổ T9.

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND127_T9_WEBKIT60MS_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại. Script `gate0-wait-t9-5e522260.sh` đã sửa lỗi stale
  VANG-T7-DONE + `gate0-wait-t9-81464315-resume.sh` (bản resume
  sau reboot, verdict VOID) + `t9-attempt-inner.sh`/`run-t9.sh`
  (đổi hậu tố log sang `5e522260`) — bản copy trong
  `hidden_files/round127-t9/`, ngoài repo — không stage.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round127-t9-webkit.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round127-t9/`
  (prereg-t9.md [viết trước khi đo],
  prereg-t9-addendum-boot73.md [viết trước khi đo trên boot mới],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t9-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 126],
  analyze-t9-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run
  refs copy đợt 126] + analyze-t9-dryrun-all-{tickcost,wallbands}.txt
  [dry-run PASS đợt này: S5 49,5/75,0 + A8 40,0/64,7 + R126a2
  44,0/71,6],
  b.json [copy đợt 126, md5 `078938cf…`],
  vite.t9-temp.config.mjs [copy đợt 126, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t9.sh [adapt đợt 127: round127-t9, hậu tố log 5e522260] +
  t9-attempt-inner.sh [adapt round127-* + hậu tố 5e522260 + sampler
  đã sửa đợt 125]
  + check-classb-t9.sh [lớp B gồm B5 — KHÔNG CHẠY đợt này, không
  có probe]
  + gate0-wait-t9-81464315.sh [gốc, 30 poll — gate 0 #72 KHÔNG
  ĐẠT sau 12 poll, chết theo reboot]
  + gate0-wait-t9-81464315-resume.sh [resume sau reboot, verdict
  poll #13 VOID] + gate0-wait-t9-5e522260.sh [ĐÃ SỬA stale
  VANG-T7-DONE — gate 0 #73 ĐẠT poll #1]
  + gate0-wait-t9-81464315.log + gate0-wait-t9-81464315.nohup.log
  + gate0-wait-t9-81464315-resume.nohup.log
  + gate0-wait-t9-5e522260.log + gate0-wait-t9-5e522260.nohup.log,
  poll-t9.sh + poll-t9.log [mẫu 5 phút + gate0/gateA: #72 12 poll
  không đạt, #73 đạt poll #1, attempt1–3 mỗi attempt 10 poll
  không mở] + poll-t9.nohup.log + poll-t9-resume.nohup.log,
  postboot-t9-81464315-gate0wait-{1..12}.log [gate 0 #72: exit 1]
  + postboot-t9-81464315-gate0wait-13.log [VOID poll — postboot
  PASS thật trên boot mới nhưng (0a) stale]
  + postboot-t9-5e522260-gate0wait-1.log [gate 0 #73: exit 0]
  + postboot-t9-5e522260-attempt{1,2,3}-gate0.log [gate 0 run-t9.sh:
  PASS] + postboot-t9-5e522260-after.log [sau lượt: exit 0],
  run-t9-attempt{1,2,3}.nohup.log [attempt1–3: gate A KHÔNG MỞ
  10 poll, exit 5],
  chain-t9.log [gate0/gateA attempt1–3 + ghi chú VOID + touch cờ],
  tsc-after.log [tsc exit 0],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round127-t9.done` (kèm verdict 1 dòng).
  Cờ mở leg tải T3: `hidden_files/round127-t9-done` đã touch
  03:46:18Z ngay khi attempt3 xong (trước LIMITS/batch).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Nợ lượt yên theo dõi lần 7: CHƯA ĐÓNG — chuyển tiếp sang
   đợt 128.** Ngưỡng WebKit ≤60 ms GIỮ (5 lượt yên hợp lệ:
   S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5 / T9-126
   44,0; trung bình 46,6 ms). Đợt sau chạy lại lượt yên lần 7
   (không phải lần 8) — không siết/mở ngưỡng từ đợt không có số đo.
2. **(c2) lệch nhãn +1f + event lag ≥+5f: KHÔNG CÓ DỮ LIỆU đợt
   này** (0 probe). T5 chẩn đoán đợt 127 dựa trên dữ liệu đợt
   121/125/126; đợt sau có lượt yên mới thì đối chiếu lại.
3. **Sửa script gốc gate0-wait:** mang fix stale VANG-T7-DONE
   (kiểm mtime .done ≥ boot) vào bản gốc + sửa dòng kết
   "KHONG DAT sau 10 poll" (thực tế 30 poll) + sửa check-classb
   in verdict tổng rõ ràng (dòng KẾT LUẬN trống — cả đợt
   125/126 đều vậy).
4. **RAM host là nút thắt chính đợt này:** attempt3 chứng minh
   lock/load đều sạch nhưng RAM kẹt 500–684 MB suốt 10 phút.
   Đợt sau nên cân nhắc: chờ RAM hồi lâu hơn trước khi mở attempt
   (poll RAM riêng), hoặc xếp lượt yên vào cửa sổ RAM cao (đầu
   boot, khi replay vừa xong RAM thường >1500 MB — boot #72 lúc
   02:48Z RAM 2327 MB nhưng gate 0 chưa đạt; boot #73 lúc
   03:12Z RAM chỉ 768 MB). Giữ nguyên ngưỡng RAM (không hạ để
   "cho qua").
5. **Reboot giữa đợt:** waiter/poller detached chết theo reboot —
   đợt sau kiểm tra tiến trình của mình còn sống không trước khi
   tin log; T5 cũng cần watcher chịu được reboot (v4 đã làm).
6. **Nợ khác đứng yên theo LIMITS gộp đợt 126 §10–§11 + quyết
   parent §12 (cập nhật đợt 127):** E4 (T2), DEF v0.3.1 + leg kiểm
   tra xen kẽ (T4), probe #46 + mù #46, T5 chẩn đoán event lag +
   (c2), G1 khung (a) M2 HOÃN chờ user; R9 (a) VẪN CHỜ user;
   birefnet 0 lần (RAM khả dụng vẫn dưới guard 6 GB); TTS 39 CẤM
   kiểm lại; ci-security.yml vẫn 403 chờ user; release gate không
   đổi. Reboot mới nhất: boot #73 03:04:25Z (gap #72→#73 =
   54m08s). T3 đang chạy leg tải sau cờ T9 (mở 03:46:18Z).

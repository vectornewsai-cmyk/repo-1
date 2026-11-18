# LIMITS — Đợt 122 T2: E4BATCH lượt 4 chạy bù (B, gop30, phase e4b4) — KILLED-REBOOT, STOP-md5 rồi DEFER-POSTBOOT (không đo, không đếm)

> Đợt 122, luồng T2 (tiếp nối), 16/11/2026. Chạy bù lượt 4 theo quyết parent đợt 121
> §12.1 (lượt 3 trước do T1 đợt 122 chạy, rồi lượt 4 do T2 chạy sau khi T1 xong).
> Prereg: `hidden_files/round122-t2/prereg-e4batch-luot4.md` (viết TRƯỚC khi đo).
> Driver: `hidden_files/round122-t2/run-t2.sh`, log `run-t2.log`, analyzer
> `hidden_files/round122-t2/analyze-t2.py`. Sổ cái gốc:
> `hidden_files/round118-t9/e4batch-ledger.md` (đã cập nhật cả lượt 3 att2 của T1
> và lượt 4 att2 của luồng này — T10 không ghi trùng).

## 1. Kết quả — một dòng

**Lượt 4 att2: KHÔNG ĐẾM vào lô (0 phép đo). Lượt 4 att3 (chạy lại trên cây
baseline theo quyết parent, xem §9): cũng KHÔNG ĐẾM — DEFER-POSTBOOT.** Lần
chạy 1 (att1) bị reboot giết giữa lúc chờ cờ postboot; lần chạy lại bằng tay
(att2) trên boot mới DỪNG ngay ở cổng md5 vì cây đã đổi: preview.tsx giờ là
baseline `03bf029f` (H3f đã bị T3 gỡ lúc 12:02:56Z), không còn là H3f `5be5a250`
mà prereg kỳ vọng; lần chạy lại att3 trên cây baseline (driver đã sửa
`EXPECTED_MD5` theo quyết parent) chờ cờ postboot T5 đủ 60 phút mà không có cờ
nào — postboot boot #65 lúc hết hạn chỉ còn thiếu 2 gói
(gstreamer1.0-plugins-bad, gstreamer1.0-libav). Không chạy probe lần nào, không
lấy lock, không sửa production. **Lô E4BATCH vẫn 1/10** (0 CAUGHT, 1 VOID —
lượt 2, B gop30, cây H3f). Lượt 4 chạy lại ở đợt sau trên cây baseline.

## 2. Lần chạy 1 — KILLED-REBOOT (boot #64, chưa đo gì)

- Driver gốc do luồng T2 đầu phiên khởi động detached (nohup) lúc 11:40:44Z,
  PID 7230, lệnh `bash run-t2.sh 4 30 e4b4`. Luồng gốc kết thúc sớm do lỗi kỹ
  thuật của phiên (exec output-drain timeout), KHÔNG phải do công việc thất
  bại; driver vẫn chạy sống. Luồng tiếp nối (luồng này) giám sát bằng poll
  5 phút (11:48, 11:53, 11:58, 12:03, 12:08, 12:13, 12:18, 12:23, 12:28,
  12:33, 12:38, 12:43, 12:48, 12:53Z — driver sống suốt, không marker kết thúc).
- Boot #64 (số tạm, chờ T6 đếm lại mù #37): btime 11:05:18Z, boot_id
  `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`. RAM khả dụng 907 MB lúc khởi động.
- md5 preview.tsx lúc khởi động: `5be5a250a552357c50cc189de9a9c08a` (H3f,
  khớp prereg). Lock script live md5 `cd0c05c1f9304d58f7aaf041c25bb8b9`
  (khớp đợt 120/121; driver chạy bản copy).
- Postboot check-only lúc khởi động: FAIL — wrapper PASS (vá K1); thiếu 5 lib
  (libevent-2.1.so.7, libEGL.so.1, libavif.so.16, libdw.so.1, libevdev.so.2);
  thư mục GST hệ thống KHÔNG TỒN TẠI (0 plugin; debroot 269 file); apt thiếu
  11 pkg. dpkg.log cuối: `2026-11-16 11:35:39 startup packages configure`.
- Giai đoạn 0: chờ cờ `round122-t1.done` đủ 13 poll × 5 phút = ~65 phút.
  Cờ xuất hiện 12:45 (T1 done 12:44Z — lượt 3 att2 DEFER-POSTBOOT, xem §4).
  Driver ghi nhận 12:45:45Z và chuyển sang chờ cờ T5.
- Giai đoạn 1: chờ cờ T5 đợt 122 từ 12:45:46Z (tối đa 60 phút); ghi checkpoint
  5 phút lúc 12:50:46Z (POSTBOOT_FAIL: CÓ; GST sys 0 file; dpkg im từ 11:35:39Z).
- **Reboot lúc ~12:53:25Z giết driver giữa lúc chờ** (log cuối 12:50:46Z, không
  có marker kết thúc hay DEFER; monitor `monitor-t2.sh` của luồng gốc cũng
  chết theo — poll cuối 12:52:43Z; phiên giám sát của luồng tiếp nối cũng bị
  gián đoạn bởi chính lần reboot này). Boot mới: btime 12:53:25Z
  (epoch 1794833605), boot_id `fbc42445-8967-473e-bab7-d690d49ce13a`, số tạm
  #65 (chờ T6 đếm lại mù #37); gap #64→#65 = 1 giờ 48 phút 07 giây.
  Replay boot mới khởi động lại từ đầu (dpkg configure 12:54:14/15Z, apt-get
  update đang chạy, os-intent replay đang chạy; RAM khả dụng 1612 MB lúc
  12:55Z).
- Kết quả lần 1: **KILLED-REBOOT (không đếm)** — chưa probe, chưa lock, chưa
  tới cổng postboot (mới chờ được ~5/60 phút).

## 3. Lần chạy lại bằng tay — STOP-md5 (boot #65, chưa đo gì)

- Theo đúng nhiệm vụ tiếp nối ("driver chết bất ngờ → chạy lại bằng tay theo
  lệnh trong run-t2-driver.out") và ghi chú trong chính `run-t2.sh` ("nếu
  reboot giết driver giữa chừng thì driver khởi động lại, chạy lại tay theo
  tiền lệ đợt 121"), luồng này chạy lại driver lúc 12:56:03Z:
  `nohup bash run-t2.sh 4 30 e4b4`. Trước đó đã sao lưu log lần 1
  (`run-t2-driver.out.boot64.bak`, `run-t2.log.boot64.bak`, 5343 byte mỗi file)
  vì lần chạy lại ghi đè `run-t2-driver.out`; `run-t2.log` thì nối tiếp
  (tee -a) nên giữ đủ cả hai lần chạy.
- Driver khởi động lại ghi: boot 2026-11-16 12:53:25 `fbc42445…`, RAM khả dụng
  1420 MB, md5 preview.tsx lúc khởi động `03bf029f09b8890b285eacc10a02172b`
  (kỳ vọng H3f `5be5a250a552357c50cc189de9a9c08a`).
- Postboot check-only lúc khởi động (đọc, không repair) trên boot #65: FAIL
  y hệt boot #64 — wrapper PASS; thiếu 5 lib như trên; GST: thư mục hệ thống
  không tồn tại, 0 plugin, debroot 269, thiếu isomp4=1, libav=1; apt thiếu
  11 pkg như trên. dpkg.log cuối: `2026-11-16 12:54:15 startup packages
  configure`; 8 apt/dpkg đang chạy (replay mới bắt đầu, chưa cài xong).
- **12:56:03Z — lượt 4 STOP, exit 4: "md5 live khác md5 kỳ vọng H3f; cây đang
  đổi giữa chừng, không đo mò".** Đây là cổng bảo vệ có sẵn trong driver
  (kiểm md5 ngay sau postboot check-only, trước giai đoạn chờ cờ) — driver
  tự dừng, không đo trên cây sai. Không chạy probe, không lấy lock, không
  sửa production. Không có thư mục probe, không có `probe-results.json`.
- Kết quả lần 2: **STOP-md5 (không đếm)** — không phải DEFER-POSTBOOT (chưa
  tới giai đoạn chờ cờ T5 trên boot mới; đồng hồ 60' của boot #65 chưa chạy).

## 4. Vì sao md5 đổi — cây H3f đã gỡ, cần quyết parent trước khi đo lại

- T3 đợt 122 đã GỠ patch H3f khỏi preview.tsx lúc **12:02:56Z**, sau khi A/B
  H3f có kiểm soát (leg B, đợt 122) ra **TRUNG TÍNH** — đúng quyết parent đợt
  121: "nếu cũng TRUNG TÍNH → GỠ patch" (xem `round122-t3.done` 12:04:52Z và
  `docs/PHASE9_ROUND122_T3_H3F_AB_LIMITS.md`). preview.tsx hiện là baseline
  `03bf029f09b8890b285eacc10a02172b` (media.ts không đổi `2c384ed1…`).
- T1 đợt 122 cũng ghi trong `round122-t1.done` (12:44Z): "Cay H3f DA GO…
  preview.tsx hien baseline 03bf029f; T2/luot 4 can quyet parent truoc khi do
  (prereg T2 ky vong H3f)". Driver lần 2 đã thực thi đúng tinh thần đó bằng
  cổng md5: dừng lại thay vì đo mò trên cây không đúng prereg.
- **Hệ quả cho lô:** lượt đếm trên cây H3f: 1 (lượt 2 VOID). Lượt đếm trên cây
  baseline: 0. KHÔNG gộp số H3f với số baseline cho verdict H1/H3 (prereg §5).
  Lượt 4 chạy lại ở đợt sau trên cây nào là do parent quyết (đo trên baseline
  hay apply lại H3f — nếu apply lại H3f thì số đó thuộc cây H3f).
- Cờ cây `round116-tree` vẫn `status: NO-CHANGE` (md5-final ghi trong cờ là
  `03bf029f` — md5 cây gốc trước H3f; cờ này không cập nhật sau khi H3f apply
  đợt 119; chuẩn đo là md5 live, như các lượt 2/4). Driver lần 2 dừng trước
  khi tới bước kiểm cờ cây nên cờ không được driver tham chiếu lần này.

## 5. Lượt 3 của T1 (để đối chiếu — không phải việc của T2, chỉ ghi lại)

- Lượt 3 att2 (A, gop250, phase e4a3): **DEFER-POSTBOOT (không đếm)** — xem
  `docs/PHASE9_ROUND122_T1_E4BATCH_R3_LIMITS.md` và `round122-t1.done`.
  Driver T1 chờ cờ T5 đợt 122 đủ 60 phút (11:39:23–12:39:27Z) mà không có cờ
  PASS nào; postboot FAIL ở đầu và cuối (y hệt §2). Không chạy probe, không
  lấy lock. Cờ `round122-t1.done` xuất hiện 12:45 (sau khi T1 viết LIMITS +
  sổ cái bản copy xong). **Điều kiện "lô 1/10 → 3/10 nếu cả T1+T2 xong" trong
  nhiệm vụ KHÔNG đạt** — cả hai lượt đều không đếm, lô vẫn 1/10.
- Bối cảnh chung boot #64 (từ T5 đợt 122, `POSTBOOT_FAIL` cập nhật 12:40Z):
  replay kẹt ở `apt-get update` — pid 855 chạy từ 11:35Z, lúc 12:43Z đã
  1 giờ 08 phút, 0% CPU, partial im từ 11:41:39Z (~58 phút); dpkg.log đóng
  băng 2 dòng @11:35:39Z; lists đóng băng 111 file; postboot exit=1 ở mọi
  poll 10/20/30/40/50/60 + cuối — CHƯA TỪNG PASS trên boot #64. Luật
  replay-chết §8.2 KHÔNG kích hoạt (điều kiện 2 không đạt: apt+wrapper vẫn
  sống) → không repair. Đây là chế độ lỗi MỚI (C) "sống nhưng kẹt ở update",
  cần quyết parent đợt 123. Watcher T5 kết thúc 12:38:33Z (60/60 poll).
- Ghi chú thêm từ log cuối của T5: headroom cuối STOP ở i=4552
  (`inotify_add_watch errno=28`, No space left on device) — trần inotify
  lại chạm; RAM khả dụng lúc đó 442 MB. Không phải việc của T2, chỉ ghi
  nhận vì nó ảnh hưởng các lượt đo sau (vite cần watch).

## 6. Những gì KHÔNG có (trung thực)

- Không có số đo velocity tick / drift / tailSteadyClosed nào cho lượt 4
  att2 VÀ att3 — không chạy probe lần nào thì không có số, và luồng này không
  bịa ra số nào.
- Analyzer `analyze-t2.py` KHÔNG chạy trên dữ liệu lượt 4 (không có
  `probe-results.json` — không có gì để phân tích). Nhưng analyzer đã được
  verify sống bằng dry-run trên dữ liệu lượt 2 (đợt 119 T2,
  `round116-s1/probe-webkit-load0-gop30-e4b2/`), chạy lúc 12:5xZ sau khi
  driver STOP: tái hiện đúng verdict VOID đã ghi trong sổ cái — velTicks=360,
  steady-close ticks 0, resyncsV transitions [(2, 1)], seeking run samples
  0..0 relMs 122..122, pageErrs=0. Analyzer sẵn sàng cho lượt chạy lại ở
  đợt sau; logic không đổi so với `round121-t1/analyze-t1.py` (prereg §3).
- Không lấy lock v2 lần nào (0 dòng `t2-round122` trong vite-lock-v2.log —
  driver dừng trước bước acquire). Không sửa file production nào. Không push.
- Quirk nhỏ (không ảnh hưởng verdict): header của script postboot-check vẫn
  in nhãn boot cũ — trên boot #65 nó in "(reboot #64? = 2026-11-16 11:05:18Z,
  boot_id 3fe7e89e…)" trong khi btime thực tế dùng là 12:53:25Z. Các phép kiểm
  (libs/GST/apt) chạy trên hệ thống sống nên kết quả FAIL là thật; chỉ nhãn
  trong header là cũ, chờ luồng hạ tầng cập nhật nếu cần.

## 7. Sổ cái + stage

- Sổ cái gốc `hidden_files/round118-t9/e4batch-ledger.md` đã cập nhật: thêm
  hàng lượt 3 att2 (mượn nguyên văn từ bản copy làm việc của T1 trong
  `round122-t1/e4batch-ledger.md` — T1 chỉ cập nhật bản copy, chưa chạm bản
  gốc), hàng lượt 4 att2 (KILLED-REBOOT + STOP-md5) và hàng lượt 4 att3
  (DEFER-POSTBOOT trên baseline, xem §9); mục "Tiến độ lô" cập nhật: lượt
  không đếm: **6**; lượt tiếp theo: lượt 3 và lượt 4 đều chạy lại ở đợt sau
  trên cây baseline. T10 đợt 122 KHÔNG ghi trùng ba hàng này.
- Batch stage: `phase9-round122-t2-e4batch-r4.txt` — chỉ chứa file LIMITS này
  (`docs/PHASE9_ROUND122_T2_E4BATCH_R4_LIMITS.md`), theo đúng mẫu T1 đợt 122
  (batch của T1 cũng chỉ chứa LIMITS của nó). File LIMITS này đã cập nhật
  thêm §9 (att3) sau khi stage lần đầu — đường dẫn stage không đổi nên không
  cần stage lại, chỉ cần verify read-back lần cuối. Không có file
  code/production nào đổi trong lượt này nên không có gì khác để stage.
  KHÔNG push.
- Cờ `hidden_files/round122-t2.done` đã tạo và cập nhật lần cuối, ghi rõ kết
  quả đầy đủ (KILLED-REBOOT + STOP-md5 + DEFER-POSTBOOT att3, không đo, lô
  vẫn 1/10).

## 8. Việc còn lại (cho đợt sau / parent)

- Lượt 3 (A, gop250) và lượt 4 (B, gop30) đều chạy lại ở đợt sau **trên cây
  baseline `03bf029f`** (quyết parent đã rõ cho lượt 4 — đo trên baseline,
  không apply lại H3f; xem §9 và phụ lục §6 của prereg).
- Chế độ lỗi replay (C) "sống nhưng kẹt ở apt-get update" trên boot #64 cần
  quyết parent đợt 123 (T5 đã ghi rõ trong POSTBOOT_FAIL 12:40Z): có cho
  repair/kill apt-get update kẹt hay không, vì luật §8.2 hiện không kích
  hoạt với dạng này.
- Boot #65 (btime 12:53:25Z) replay tiến triển tốt nhưng chậm: lúc att3 hết
  hạn 60 phút (14:04:55Z) postboot chỉ còn thiếu 2 gói (bad, libav); lúc
  14:06Z vẫn thiếu 2 gói đó và không còn apt/dpkg nào chạy. **Bài học cho đợt
  sau: sau mỗi lần reboot cần có watcher hạ tầng theo dõi replay của boot MỚI
  tới khi ghi cờ PASS/FAIL** — att3 DEFER không phải vì hệ thống không bao giờ
  sẵn sàng, mà vì không có ai ghi cờ cho boot #65 trong 60 phút (watcher T5
  đợt 122 đã kết thúc trên boot #64 từ 12:38:33Z; không có round123-t5 nào lúc
  att3 chạy). Các luồng đo đợt sau phải chờ cờ postboot của boot đang chạy,
  không đo mù.

## 9. Chạy lại att3 (quyết parent: đo trên baseline) — DEFER-POSTBOOT

- Quyết parent (coordinator, theo quyết parent đợt 121 §12.2; nhận 13:02Z):
  lượt 4 **ĐO TRÊN CÂY BASELINE** (lựa chọn (a) của T1), KHÔNG apply lại H3f.
  Phụ lục §6 trong `prereg-e4batch-luot4.md` ghi rõ: cây đo là baseline md5
  `03bf029f09b8890b285eacc10a02172b` (media.ts `2c384ed1…` không đổi); số lượt 4
  lần này thuộc loạt baseline, KHÔNG gộp với số lượt 2 (VOID trên H3f) hay các
  số H3f cũ cho verdict H1/H3.
- Thay đổi driver `run-t2.sh` (ghi rõ theo yêu cầu): `EXPECTED_MD5` đổi từ
  `5be5a250a552357c50cc189de9a9c08a` sang `03bf029f09b8890b285eacc10a02172b`;
  các chuỗi log "kỳ vọng H3f" đổi thành "kỳ vọng baseline"; ghi chú CÂY ĐO
  trong header cập nhật theo (ghi rõ quyết parent + ngày giờ). Không đổi gì
  khác (probe, lock, cổng, timeout, luật chờ T5 60' giữ nguyên). `bash -n`
  OK trước khi chạy lại. Sao lưu trước khi chạy lại:
  `run-t2-driver.out.boot65-stop.bak` (2247 B, log lần att2 STOP).
- Driver att3 khởi động 13:04:52Z (PID 4220), boot #65, RAM khả dụng 1420 MB
  (lúc att2) / ~1004 MB (lúc viết phụ lục prereg 13:03Z). md5 live khớp kỳ
  vọng baseline: `03bf029f09b8890b285eacc10a02172b` — qua cổng md5 ngay từ đầu.
  Giai đoạn 0 qua ngay (cờ T1 đã có từ 12:45, 0 poll). Lock script live md5
  `cd0c05c1f9304d58f7aaf041c25bb8b9` (khớp đợt 120/121; driver chạy bản copy).
- Postboot check-only lúc khởi động (13:04:52Z, đọc không repair): FAIL —
  wrapper PASS; thiếu 5 lib; GST: thư mục hệ thống không tồn tại (0 plugin);
  apt thiếu 11 pkg. dpkg.log cuối lúc đó: `13:04:34 status installed
  libc-bin:amd64 2.39-0ubuntu8.9` — replay boot #65 ĐANG CÀI (khác boot #64).
- Chờ cờ T5 đợt 122 đủ 60 phút (13:04:52–14:04:55Z), checkpoint mỗi 5 phút
  (5/10/15/20/25/30/35/40/45/50/55/60 phút — driver sống suốt, poll giám sát
  của luồng này khớp từng mốc). Diễn biến replay boot #65 trong lúc chờ:
  - 13:06:53Z cài libglib2.0-0t64 + gsettings-desktop-schemas; GST 0 file.
  - 13:14:43Z cài libc-bin; GST lên 3 file (thư mục GST hệ thống xuất hiện).
  - 13:19–13:27Z: dpkg im ~8–13 phút (chỉ libc-bin/fontconfig lặp lại),
    GST giữ 3 file — có dấu hiệu chững lại giữa chừng.
  - 13:47:57Z trở đi: cài nhanh trở lại — GST 3 → 106 file (13:49:54Z) →
    119 file (13:54:54Z, giữ nguyên tới cuối); cài libc-bin 2.39-0ubuntu8.12,
    gstreamer1.0-tools (14:01:09Z), pocketsphinx-en-us (13:55:10Z).
  - 14:01:09Z là dòng dpkg.log cuối cùng trong lúc chờ; lúc 14:04:55Z apt/dpkg
    đang chạy = 0.
- **14:04:55Z — lượt 4 att3 DEFER-POSTBOOT (không đếm): "hết 60 phút vẫn chưa
  có cờ T5 đợt 122 (replay/postboot boot chưa xong)".** Postboot check-only
  cuối (driver chạy, đọc không repair) cho thấy hệ thống GẦN ĐẠT, chỉ còn
  thiếu 2 gói: wrapper PASS; libs PASS (đủ 5 lib); GST là thư mục thật (apt),
  119 file plugin hệ thống, debroot 269, isomp4=0 (đủ), libav=1 (thiếu);
  apt thiếu: `gstreamer1.0-plugins-bad`, `gstreamer1.0-libav`; kết luận
  CHƯA ĐỦ. Kiểm độc lập lúc 14:06:06Z: `gstreamer1.0-libav` chưa có trong hệ
  thống, `gstreamer1.0-plugins-bad` not-installed, `libavif16` +
  `libevent-2.1-7t64` installed, GST 119 file, 0 apt/dpkg đang chạy, dpkg.log
  im từ 14:01:09Z — replay có vẻ đã hết lượt cài của nó mà vẫn thiếu 2 gói.
- **Vì sao DEFER dù hệ thống gần đủ:** không có watcher nào ghi cờ cho boot
  #65. T5 đợt 122 đã kết thúc (watcher 60/60 poll trên boot #64, WATCHER_DONE
  12:38:33Z; `round122-t5.done` 12:42Z); lúc att3 chạy không có process
  watcher/postboot nào sống và không có thư mục round123-* nào. Cờ duy nhất
  trong `round122-t5/` vẫn là POSTBOOT_FAIL của boot #64. Driver chỉ đi tiếp
  khi có cờ PASS — đúng luật "không đo mù khi postboot chưa PASS". Luồng này
  KHÔNG tự ghi cờ PASS (đó là việc của luồng hạ tầng; tự ghi là bịa trạng
  thái hạ tầng).
- Không chạy probe, không lấy lock (0 dòng `t2-round122` — driver dừng trước
  bước acquire), không sửa production. md5 preview.tsx trước=sau = `03bf029f`
  (kiểm 14:06:06Z). Không có `probe-results.json` cho att3.
- Sổ cái: thêm hàng lượt 4 att3 (xem §7); lô vẫn 1/10; lượt không đếm: 6.
  Lượt đếm trên baseline vẫn 0 — lượt đếm baseline đầu tiên vẫn chưa có.

## 10. Phụ lục — chỉ đạo dừng att3 của coordinator (nhận 14:10:48Z) — T2 kết thúc

- Chỉ đạo coordinator: DỪNG driver att3 đang chạy và kết thúc T2 ở trạng thái
  đã wrap-up lúc 13:00Z, vì att3 đang chờ cờ POSTBOOT_PASS của T5 đợt 122
  nhưng T5 đã xong lúc 12:43Z với POSTBOOT_FAIL suốt lượt và sẽ KHÔNG bao giờ
  ghi cờ PASS cho đợt này (không ai còn theo dõi postboot #65); giữ att3 chạy
  chỉ làm T10 khó đóng đợt đúng hạn 14:15Z và có nguy cơ xung đột với suite
  đóng đợt. Quyết đo lượt 4 trên baseline chuyển thành nợ đợt 123.
- **Sự thật kiểm chứng lúc nhận chỉ đạo (14:11:21Z): driver att3 (PID 4220) ĐÃ
  TỰ KẾT THÚC từ 14:04:55Z với DEFER-POSTBOOT (exit 3) — tức khoảng 6 phút
  TRƯỚC khi chỉ đạo tới. Không còn process `run-t2.sh` nào chạy nên KHÔNG
  CẦN kill; không có PID nào bị kill trong lần này.** Trạng thái cuối mà chỉ
  đạo mong muốn (không driver nào chạy, T2 đã wrap-up, không xung đột với
  suite đóng đợt của T10) đã đúng sẵn. `run-t2.log` giữ nguyên làm bằng chứng
  (log cuối là postboot check-only cuối lúc 14:04:55Z, kết luận CHƯA ĐỦ).
- 0 phép đo trong toàn bộ lượt 4 (att1 + att2 + att3); lô vẫn 1/10; lượt đếm
  trên baseline vẫn 0. Cờ `round122-t2.done` đã thêm một dòng ghi nhận chỉ
  đạo này (giữ nguyên nội dung cũ). Batch stage không đổi (chỉ LIMITS).
  **Không khởi động lại driver nữa.**

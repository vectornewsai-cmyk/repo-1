# PHASE9_ROUND144_T4_WEBKIT_QUIET19_LIMITS.md

**Đợt:** 144. **Luồng:** T4 — lượt yên WebKit #19 (đo lại từ đầu, giám sát thụ
động (c2) theo DEF v0.5). **Ngày:** 19/11/2026. **Boot đo:** HAI boot —
691a7403 (#106? theo cách đếm chặt, btime 03:55:45Z) và cc222c8a (btime
05:53:15Z, boot lúc đóng). **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7`
(kiểm lúc mở poller 05:44Z, sau reboot 05:55Z, lúc đóng 06:12Z — không đổi).
**Trạng thái:** poller thoát exit 11 lúc 06:11:55Z — **0 LƯỢT HỢP LỆ theo quy
tắc đã lập trình** (5 attempt 20/20 trên 2 boot, tất cả bị lớp B loại).
**NHƯNG hậu kiểm hiệu chỉnh cho thấy 2 trong 3 lần loại ở boot mới là SAI**
(B4 giả-dương + B2 tính trên mẫu sampler cũ) — attempt3 boot mới đủ mọi điều
kiện làm lượt #19 (median 55,0 ms), **CHỜ QUYẾT PARENT, T4 KHÔNG tự tuyên bố**
(xem §0.1 + §10.1).

## 0. Verdict tổng (đọc trước)

### 0.1 Hai lớp kết quả — đừng lẫn

- **Lớp 1 (quy tắc đã lập trình, poller tự chạy): 0 lượt hợp lệ.**
  Poller chạy 5 attempt 20/20 (1 boot cũ + 3 boot mới hoàn chỉnh + 1 boot cũ
  dở dang bị reboot giết); lớp B (check-classb-t4.sh) loại cả 4 attempt hoàn
  chỉnh; hết 3 attempt ở boot mới → poller thoát exit 11 lúc 06:11:55Z
  ("DA HET 3 ATTEMPT, khong co luot hop le"). Theo lớp này, chuỗi lượt hợp
  lệ **đứng nguyên 15 lượt** (P1 45/45, P2 36/36, P3-A1 40/45, P3' 17/17,
  P7 31/31), không median mới, #19 đo lại ở đợt 145.
- **Lớp 2 (hậu kiểm hiệu chỉnh của T4, CHỜ PARENT CHẤP NHẬN): attempt3 boot
  mới (06:07:30–06:11:04Z) ĐỦ MỌI ĐIỀU KIỆN làm lượt #19 HỢP LỆ.**
  tickCost median **55,0 ms** (n=566, post-flip 54,0; ≤60); B1/B2/B3/B5 ĐẠT;
  B4-hiệu-chỉnh ĐẠT (không có process apt/dpkg thật nào trong cửa sổ — xem
  §6.1); P1 DUNG 4/4 (p=0,00059), P3-A1 DUNG 4/4 (p=0,0038), P3' DAT 4/4,
  P7 DUNG (0/406 tre ≥+1f), P2 4/4 lag +1, coverage 4/4. Nếu parent chấp
  nhận: cộng dồn lên **16 lượt** (P1 49/49, P2 40/40, P3-A1 44/49, P3'
  21/21, P7 35/35), median #19 = 55,0 ms. Nếu parent bác: giữ 15 lượt,
  đo lại #19 ở đợt 145 với poller đã vá (xem §10).
- **Attempt2 boot mới là ứng viên dự phòng YẾU:** median 58,0 ms (≤60),
  B-hiệu-chỉnh ĐẠT, nhưng chỉ 1 occurrence (c2) nên P1/P3-A1 YẾU (p>0,01,
  n<3). Không đề xuất làm #19; chỉ ghi làm bằng chứng phụ.
- **Attempt1 boot cũ (median 44,0 ms) KHÔNG phải ứng viên:** B2 vi phạm
  THẬT (load1 max 4,06 trong chính cửa sổ của nó, §5.1). **Attempt1 boot
  mới (median 62,0 ms) KHÔNG phải ứng viên:** vượt ngưỡng tickCost 60 ms
  dù B đã hiệu chỉnh.

### 0.2 Gate0 theo quyết parent (j) đợt 143 — LẦN ĐẦU KIỂM CHỨNG THỰC TẾ, HOẠT ĐỘNG ĐÚNG

- Poll #5 boot mới (05:58:52Z): **gate0 = T4-check-only (pb_age=0)** —
  kiểm postboot check-only của chính T4 PASS trong lúc chưa có cờ T5 cho
  boot mới; cửa yên mở ngay, attempt1 chạy. Cờ T5 cho boot mới chỉ tới lúc
  06:00:44Z (sau đó 1'52"), tức **không có dự phòng thì cửa đã mở muộn
  ~2 phút** (poll đầu tiên sau cờ). Nguồn gate0 được ghi rõ từng poll
  (`gate0=T5(...)` / `gate0=T4-check-only(...)` / `gate0=khong-dat`).
- T5-144 vẫn làm đúng nghĩa vụ A: post cờ cho boot cũ 05:43:07Z (dùng làm
  gate0=T5 ở poll #1 boot cũ) và cho boot mới 06:00:44Z (tới trong lúc
  attempt1 đang chạy nên không đổi gì giữa chừng). Quyết (j) đã đúng: B là
  dự phòng, A vẫn là chính khi có.
- Gate A ≥1024 MB GIỮ NGUYÊN. Ngưỡng tickCost ≤60 ms GIỮ NGUYÊN. DEF v0.5,
  fix 530e10a7 KHÔNG ĐỔI. Không có code repo nào viết/sửa ngoài LIMITS này.
  Không push, không release/tag.

### 0.3 Reboot #31 (TẠM — chờ T2/T6 chốt số) + runtime restart

- Boot 691a7403 chết, boot mới **cc222c8a, btime 05:53:15Z**. Poller 1
  (pid 36668) chết theo reboot giữa attempt2 boot cũ; waiter cũng chết
  theo runtime restart. T4 khôi phục từ đĩa, chạy lại poller 05:55:51Z
  (pid 3959) theo RESTART-NOTE — không mất poll log (ghi append).
- **Dị thường đồng hồ (F-144-T4-5):** chain log còn timestamp probe tới
  05:53:42Z trong khi btime boot mới là 05:53:15Z — chồng lấn 27 s, nhiều
  khả năng đồng hồ nhảy lúc reboot. Khung chết boot cũ theo T4:
  (05:53:42Z, 05:54:11Z]; btime nằm ngoài khung — để T2/T7 hòa giải.
- **Mất mát duy nhất:** poller chạy lại dùng lại tag attempt1/2 nên
  GHI ĐÈ JSON + file analyzer của attempt boot cũ (F-144-T4-4). JSON
  attempt1 boot cũ (3.418.778 B) + phân tích P1/P3/P7 của nó đã mất; chỉ
  còn số tóm tắt T4 đọc được lúc 05:54Z trước khi bị đè (ghi ở §5.1 —
  đọc từ file, không bịa).

## 1. Bối cảnh

- Lượt yên #18 HỢP LỆ ở đợt 142 (attempt3 20/20, median 49,0 ms; cộng dồn
  15 lượt). Đợt 143: #19 KHÔNG ĐO ĐƯỢC (0 attempt — thiếu cờ T5 cho boot
  mới sau reboot #30; 16 poll thỏa mọi thứ trừ cờ). Brief đợt 144: đo lại
  #19 từ đầu; ngưỡng median ≤60 ms giữ; retry tối đa 2 lần khi lỗi setup
  (tính lại từ đầu mỗi đợt); áp dụng quy trình gate0 mới theo quyết (j)
  đợt 143 (không đề xuất lại A/B — chỉ ghi việc áp dụng + kết quả đo);
  không để T4 đóng muộn quá hạn cờ 08:15Z (bài học đợt 143: T4 đóng 05:26Z
  sau hạn cờ 11 phút). Đợt 144 mở 05:35:51Z, hạn cờ 08:15Z, hạn cứng 08:30Z.
- Script sao từ đợt 143 sang `round144-t4/`, đổi 143→144; poller deadline
  **08:00Z** (sớm hơn hạn cờ 15 phút để kịp đóng — bài học đợt 143);
  **vá gate0 theo quyết (j)** (cờ T5 chính; check-only của T4 là dự phòng
  khi không có cờ T5 khớp boot, tuổi ≤3 poll; ghi nguồn gate0 từng poll);
  **vá text hết hạn** (F-143-T4-3: ghi rõ gate nào đỏ lúc hết hạn, không
  ghi chung "gate A khong mo"). `bash -n` OK cả 4 script.
- Analyzer `analyze-t4-p1p3p7.py` kiểm lại TRƯỚC khi chạy: tái tạo #18
  khớp 100% file T4-142 (`repro-18-p1p3p7.txt`, diff sạch — chạy bằng
  script copy sang round144-t4 với đúng argv[2] seqs, không sửa logic).
- Chốt chặn `round-in-progress.md` TỒN TẠI nhưng đó là marker của chính
  đợt 144 này ("Đợt 144 đang chạy", mở 05:35:51Z) — không phải đợt
  main-chat đang chạy; T4 tiến hành theo đúng brief parent giao (cùng
  tiền lệ đợt 139–143).
- Note phối hợp gate0 gửi T5-144 (`GATE0-NOTE-FOR-T5-144.md`): ghi quyết
  (j) đã áp dụng + nhờ T5 vẫn post cờ cho boot hiện tại khi chạy. T5-144
  đã post cờ cho cả hai boot (xem §3–§4). T5-144 lúc T4 đóng (06:17Z)
  CHƯA đóng cờ (chưa có `round144-t5.done`) — chỉ ghi nhận thời điểm,
  không phải verdict về T5.

## 2. Poller — boot 691a7403: 1 poll, cửa mở ngay, attempt1 B2 vi phạm thật

- Poll #1 05:44:12Z: gate0=T5 (cờ `round144-t5/POSTBOOT_PASS`,
  pass_at 05:43:07Z, poll=2, repair=none/replay-full, dpkg=1545/221),
  RAM 1815 MB, load 1,02/0,99, không lock/blocker, cây YES 530e10a7,
  apt=0, dpkg 1545 dòng → **CỬA YÊN MỞ NGAY, attempt1 chạy**.
- **Attempt1 boot cũ (05:44:12–05:47:40Z): 20/20 exit 0.**
  tickCost median **44,0 ms** (n=625; post-flip 45,0; p90 73,0; max 211;
  min 28 — đọc từ `analyze-t4-attempt1-tickcost.txt` lúc 05:54Z, TRƯỚC
  khi file bị ghi đè; xem F-144-T4-4). tBlend gap n=509 median 88,0.
  c2seqs=[200,252,382,492], coverage 4/4 (ghi append, còn trong
  `coverage-check-attempt1.txt`).
- Lớp B attempt1 boot cũ (đọc lúc 05:54Z, trước khi bị đè): B1 DAT,
  **B2 VI PHAM (load1 max 4,06)**, B3 DAT, B4 DAT, B5 DAT (RAM min
  1016 MB, 1/100 mẫu <1024 MB, 0 mẫu <500 MB). **B2 này là THẬT:**
  thống kê giới hạn theo cửa sổ (tính lại §7) cho n=100, load1_max=4,06
  với 2 mẫu 4,06 lúc 05:45:27Z/05:45:29Z — nằm trong cửa sổ attempt.
  Poller retry attempt2 theo đúng luật (vá F-142-T4-4).
- **Attempt2 boot cũ (bắt đầu 05:48:15Z): DỞ DANG — bị reboot giết.**
  JSON 819.542 B / 11 key (không đủ 20 pass), không có file classb;
  log ghi writePartial timeout từ 05:53:22Z (pass-timeout, giữ blendTick
  cũ n=107). Sampler riêng phần (giới hạn theo cửa sổ [05:48:15Z,
  05:53:42Z]): n=162, load1_max=2,42, RAM_min=1887 MB — tải/RAM lúc đó
  vẫn ổn; cái chết là do reboot, không phải do đo.

## 3. Reboot #31 (TẠM) — boot 691a7403 chết (05:53:15Z btime), poller chết theo

- **Poller pid 36668 CHẾT** cùng reboot (poll log dừng ở "RETRY 1 -> 2";
  chain log còn timestamp probe tới 05:53:42Z). **Waiter proc_d5f3dfebca67
  KHÔNG chết cùng reboot** — nó chết theo **runtime restart** (recovery
  notice: không có kết quả cuối xác nhận sau restart; session làm việc
  của T4 vẫn sống). Không mất dữ liệu (poll log + chain log + JSON
  attempt1/2 còn nguyên tới lúc reboot).
- **Boot mới cc222c8a, btime 05:53:15Z.** Theo quy tắc đứng (mỗi lần đổi
  boot_id là 1 sự kiện) đây là **reboot #31 (TẠM — chờ T2/T6 chốt số
  chính thức)**. T4 ghi khung chết quan sát được; số reboot do T2-144 chốt.
- **Dị thường đồng hồ (F-144-T4-5):** btime boot mới (05:53:15Z) SỚM HƠN
  timestamp probe cuối trong chain log (05:53:42Z) 27 s. Hai mốc không
  thể cùng đúng trên một đồng hồ đơn điệu — nhiều khả năng đồng hồ nhảy
  (lùi ~30 s) lúc reboot. Khung chết theo T4: (05:53:42Z, 05:54:11Z]
  (last-seen log cũ → first-seen boot mới lúc kiểm 05:54:11Z); btime
  nằm ngoài khung này. Để T2/T7 hòa giải (đồng hồ cell đã có tiền lệ
  lệch — xem F104? các đợt trước).
- Poller chạy lại **05:55:51Z (pid 3959)** trên boot mới; tree md5 kiểm
  lại vẫn 530e10a7; không có vite lock sót lại. Waiter mới chạy lại cho
  pid 3959, thoát khi poller kết thúc 06:11:55Z.
- T5-144 post cờ cho boot mới lúc **06:00:44Z** (poll=2,
  repair=none/replay-full, dpkg=1545/221) — trong lúc attempt1 boot mới
  đang chạy (xem §4).

## 4. Poller — boot cc222c8a: 5 poll, cửa mở bằng gate0 dự phòng T4-check-only

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 05:55:51Z | 1.947 MB | 3,18/1,75 | chưa đạt | apt replay (dpkg 539), postboot exit 1 |
| #2 | 05:56:37Z | 1.844 MB | 3,17/1,93 | chưa đạt | dpkg 539→1256 |
| #3 | 05:57:22Z | 1.732 MB | 2,81/2,04 | chưa đạt | dpkg 1497, apt vẫn 1 |
| #4 | 05:58:07Z | 1.652 MB | 1,41/1,78 | chưa đạt | apt=0, dpkg 1545, postboot vẫn exit 1 (pb_age=3) |
| #5 | 05:58:52Z | 1.662 MB | 1,23/1,66 | **T4-check-only (pb_age=0)** | postboot PASS, apt=0 → **CỬA MỞ** |

- **Lần đầu tiên trong lịch sử lượt yên: cửa mở bằng gate0 dự phòng của
  chính T4** (quyết (j) đợt 143). Lúc poll #5, cờ T5 cho boot mới CHƯA
  CÓ (T5 post lúc 06:00:44Z, sau đó 1'52"); nếu giữ luật cũ (chỉ cờ T5),
  cửa đã mở muộn tới poll đầu tiên sau 06:00:44Z. Dự phòng hoạt động
  đúng như thiết kế: check-only chạy lại ngay trên boot mới (poll #1),
  PASS ở poll #5 khi replay xong (apt=0, dpkg đủ 1545 dòng).
- Blockers = 0 trong cả 5 poll; lock không có; cây YES 530e10a7.
- Replay boot mới: dpkg 539 → 1545 dòng trong ~2'16" (05:55:51–05:58:07Z)
  — nhanh hơn nhiều so với replay chết dạng (B) ở boot cũ đợt 143;
  gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2 (apt history 05:57:30Z).

## 5. Ba attempt boot mới — cả ba 20/20, cả ba bị lớp B loại theo luật đã lập trình

| Attempt | Thời gian | tickCost median (n) | post-flip | p90 / max | c2seqs | Coverage | Lớp B (luật đã lập trình) |
|---|---|---|---|---|---|---|---|
| 1 | 05:58:53–06:02:32Z | **62,0 ms** (531) | 59,0 | 89,0 / 150 | [125] | 1/1 | B2 VI PHẠM + B4 VI PHẠM |
| 2 | 06:03:14–06:06:47Z | **58,0 ms** (531) | 59,0 | 82,0 / 147 | [346] | 1/1 | B4 VI PHẠM |
| 3 | 06:07:30–06:11:04Z | **55,0 ms** (566) | 54,0 | 78,0 / 110 | [299,342,367,392] | 4/4 | B4 VI PHẠM |

- Cả ba attempt đều 20/20 exit 0, không COVERAGE-0, không lỗi setup
  (0/2 lượt retry setup đã dùng — các lần retry đều là retry do
  B-vi-phạm theo vá F-142-T4-4, không phải lỗi setup).
- **Attempt1 vượt ngưỡng tickCost (62,0 > 60)** nên bị loại dù B có
  hiệu chỉnh hay không. Attempt2/3 dưới ngưỡng (58,0 / 55,0).
- Poller thoát **exit 11 lúc 06:11:55Z** ("DA HET 3 ATTEMPT, khong co
  luot hop le") — đúng luật đã lập trình của nó. Hạn poller 08:00Z
  không tới (poller tự dừng sớm vì hết attempt). T4 đóng sổ lúc 06:21Z,
  TRƯỚC hạn cờ 08:15Z gần 2 giờ (không lặp lại lỗi đóng muộn đợt 143).

### 5.1 Lớp B chi tiết (luật đã lập trình — xem §6 về hậu kiểm)

- **Attempt1 boot mới:** sampler (file TRỘN, xem F-144-T4-3) n=204,
  load1_max=4,06, RAM_min=1016 MB, 1/204 mẫu <1024 MB; load5 cuối 1,37.
  B1 DAT, B2 VI PHẠM (load), B3 DAT, B4 VI PHẠM (apt/dpkg đang chạy),
  B5 DAT. **Cả hai vi phạm đều SAI khi hậu kiểm (§6).**
- **Attempt2 boot mới:** sampler (file TRỘN) n=266, load1_max=3,15,
  RAM_min=1556 MB, 0 mẫu <1024 MB; load5 cuối 1,36. B1 DAT, B2 DAT,
  B3 DAT, **B4 VI PHẠM**, B5 DAT. **B4 SAI khi hậu kiểm (§6.1); B2
  đúng cả khi tính lại theo cửa sổ (§6.2).**
- **Attempt3 boot mới:** sampler (file SẠCH) n=102, load1_max=2,90,
  RAM_min=1836 MB, 0 mẫu <1024 MB; load5 cuối 1,38. B1 DAT, B2 DAT,
  B3 DAT, **B4 VI PHẠM**, B5 DAT. **B4 SAI khi hậu kiểm (§6.1).**
- **Attempt1 boot cũ (đọc lúc 05:54Z):** sampler n=100, load1_max=4,06,
  RAM_min=1016 MB, 1/100 mẫu <1024 MB. B1 DAT, **B2 VI PHẠM (THẬT)**,
  B3 DAT, B4 DAT, B5 DAT. Khác với boot mới: B4 ở đây ĐẠT (lúc đánh giá
  05:47:40Z chưa có process nào khớp grep).

## 6. Hậu kiểm hiệu chỉnh — vì sao 2/3 lần loại ở boot mới là sai

### 6.1 B4 GIẢ-DƯƠNG ở cả ba attempt boot mới (F-144-T4-2 — quan trọng nhất)

- Cách `check-classb-t4.sh` đánh B4: `APTN=$(ps aux | grep -E
  '[a]pt-get|[d]pkg|[o]s-intent' | wc -l)` — **khớp chuỗi con trên toàn
  bộ dòng lệnh**, không phải process apt/dpkg thật. Bất kỳ shell nào có
  dòng lệnh NHẮC tới apt-get/dpkg đều bị đếm.
- Các process khớp grep trong ps-before/after của cả ba attempt:
  - pid 3957: shell chạy lệnh KHỞI ĐỘNG LẠI poller của chính T4 (dòng
    lệnh chứa `wc -l < /var/log/dpkg.log`) — process này LINGER như
    orphan sau cú output_drain_timeout của exec restart, còn sống suốt
    cả ba attempt (F-144-T4-7), chết trước lúc T4 kiểm 06:1xZ.
  - pid 7815 (chỉ attempt1): wrapper của T5-144 (`sleep 110; ...
    vcut-webkit-postboot-check.sh ...; pgrep -a apt-get; pgrep -a dpkg`)
    — shell chỉ CHẠY KIỂM postboot + pgrep, không chạy apt-get/dpkg.
- **Kiểm exact-comm: 0 process** có comm `apt-get`/`dpkg`/
  `unattended-upgrade` trong mọi file ps-before/after của cả ba attempt.
- **Bằng chứng độc lập không có replay trong bất kỳ cửa sổ attempt nào:**
  apt history entry cuối 05:57:30Z (cài gstreamer1.0-tools, kết thúc
  replay — TRƯỚC attempt1 05:58:53Z); dpkg.log mtime 05:57:30Z, 1545
  dòng KHÔNG ĐỔI từ poll #4 (05:58:07Z) tới lúc đóng (06:12:43Z);
  `pgrep -x apt-get` = 0 và `pgrep -x dpkg` = 0 lúc đóng.
- **Kết luận: không có replay apt/dpkg nào trong cửa sổ attempt1/2/3
  boot mới. Ba verdict B4 VI PHẠM là giả-dương của phép đo (grep chuỗi
  con), không phải bằng chứng replay.** Vá đề xuất: `pgrep -x apt-get`
  / `pgrep -x dpkg` (khớp comm chính xác) + kiểm dpkg.log tăng dòng
  trong cửa sổ (xem §10.2).

### 6.2 B2 attempt1 boot mới TÍNH TRÊN MẪU CŨ (F-144-T4-3)

- Sampler trong `t4-attempt-inner.sh` ghi bằng `>>` (append) vào
  `load-mid-t4-$TAG.log` — file KHÔNG bị cắt khi poller chạy lại sau
  reboot. Kết quả: `load-mid-t4-attempt1.log` 204 dòng = mẫu boot cũ
  (05:44:14Z–) + mẫu boot mới (–06:02:27Z); attempt2.log 266 dòng =
  mẫu attempt2-cũ dở dang (05:48:17Z–) + mẫu boot mới. Chỉ attempt3.log
  (102 dòng, 06:07:33–06:10:58Z) là sạch.
- Thống kê **giới hạn theo đúng cửa sổ từng attempt** (tính lại từ file
  thô, không dùng số classb):

| Attempt | Cửa sổ | n | load1_max | Lúc max | RAM_min | <1024 |
|---|---|---|---|---|---|---|
| 1 boot cũ | 05:44:12–05:47:40Z | 100 | **4,06** | 05:45:27Z | 1016 MB | 1 |
| 1 boot mới | 05:58:53–06:02:32Z | 104 | **2,62** | 06:00:37Z | 1507 MB | 0 |
| 2 boot mới | 06:03:14–06:06:47Z | 102 | **3,15** | 06:04:42Z | 1556 MB | 0 |
| 3 boot mới | 06:07:30–06:11:04Z | 102 | **2,90** | 06:09:03Z | 1836 MB | 0 |
| 2 boot cũ (dở) | 05:48:15–05:53:42Z | 162 | 2,42 | — | 1887 MB | 0 |

- **Attempt1 boot mới: B2-hiệu-chỉnh ĐẠT (max 2,62, không phải 4,06).**
  Số 4,06 trong classb của nó là 2 mẫu lúc 05:45:27Z/05:45:29Z trên
  BOOT CŨ (RAM 1037/1016 MB lúc đó). Attempt2 boot mới: B2 ĐẠT cả hai
  cách tính (max 3,15; số classb trùng vì max cũ 2,42 < max mới).
  Attempt3: file sạch, số classb = số tính lại.
- Vá đề xuất: cắt (truncate) file load-mid khi run-attempt bắt đầu,
  hoặc đặt tên file theo boot (xem §10.2).

### 6.3 Trả lời câu B2 của brief đợt 143 (tải tự sinh của stack đo?)

- Câu brief: "nếu attempt1 lại nhiễm tải thì xem lại nguồn tải tự sinh
  của stack đo". Dữ liệu đợt này: **spike load1 4,06 chỉ xảy ra ở
  attempt1 boot cũ** (05:45:27Z, giữa lúc chạy, ~75 s sau khi bắt
  đầu); cả ba attempt boot mới đều ≤3,15; per-pass load1 mean ≤2,41
  trong mọi pass của cả ba attempt boot mới. Tải KHÔNG bền vững giữa
  probe — các attempt 2/3 chạy với load1 trung bình ~1,1–1,4.
- **Quy kết chính xác VẪN MỞ:** dữ liệu per-pass của attempt1 boot cũ
  đã mất theo file bị ghi đè (F-144-T4-4) nên không xác định được spike
  4,06 tới từ vite cold-start, probe, hay process T9-144 chạy cùng lúc
  (pid 29568 có trong ps-before/after của attempt đó — script appendix
  + `sleep 900`, phần lớn thời gian idle). Ghi nhận thêm: đỉnh load1
  của attempt1 boot mới (2,62 lúc 06:00:37Z) trùng thời điểm T5 chạy
  postboot b2-poll2 (log 06:00:36Z) — tương quan thời gian, không kết
  luận nhân quả. Mang câu hỏi sang đợt 145 với sampler đã vá (cắt file
  theo attempt + ghi rõ process nặng lúc max).

## 7. P1–P7 + P3' — gói verdict ĐẦY ĐỦ cho attempt3 (chờ parent chấp nhận B4-hiệu-chỉnh)

- **Attempt3 boot mới (ứng viên #19):**
  - P1 DUNG 4/4 [299, 342, 367, 392] (baseline 51/327 = 0,1560;
    p = 0,00059; luật DEF §3). P1 signed đối chiếu 4/4 (p = 0,00055).
  - P3-A1 DUNG 4/4 (baseline đóng băng 81/326 = 0,2485; p = 0,0038;
    luật DEF §5). Không có seq không xác định.
  - P3' DAT 4/4 (stall trước mỗi seq: 2/5/6/7 tick ≥2).
  - P7 DUNG (làm yếu desync; (c2) drawSrc delta {-1: 19, 0: 23}, tre
    ≥+1f: 0 entry; đối chứng toàn bộ drawSrc: 0/406; luật DEF §10; log
    thua ~100 ms — chỉ làm yếu, không bác tuyệt đối).
  - P2: 4/4 occurrence lag ≥+1f, 0 âm (lag từng seq đều +1:
    (299,16,15,1), (342,18,17,1), (367,14,13,1), (392,16,15,1)).
  - Coverage (c2) trong cửa sổ log: 4/4. tickCost median 55,0 ms.
- **Attempt2 boot mới (dự phòng yếu):** P1 YEU 1/1 [346] (p = 0,19,
  n<3); P3-A1 YEU 1/1 (p = 0,24); P3' DAT 1/1 (stall 2); P7 DUNG
  (0/386 tre ≥+1f); P2 1/1 lag +1; coverage 1/1; median 58,0 ms.
  Chỉ 1 occurrence (c2) nên không đủ mạnh làm lượt hợp lệ độc lập.
- **Attempt1 boot mới:** không chạy P1/P3/P7 đầy đủ (median 62,0 đã
  vượt ngưỡng; không phải ứng viên). c2seqs=[125], coverage 1/1.
- **Attempt1 boot cũ:** P1/P3/P7 KHÔNG TÍNH ĐƯỢC (JSON + file labellag
  bị ghi đè sau reboot — F-144-T4-4). Chỉ còn tickCost median 44,0 ms
  + coverage 4/4 + B2 vi phạm thật.
- **Cộng dồn (CHỈ KHI parent chấp nhận attempt3):** 16 lượt hợp lệ —
  P1 **49/49**, P2 **40/40**, P3-A1 **44/49**, P3' **21/21**, P7 **35/35**.
  Chuỗi median tickCost 16 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 /
  54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  **55,0 ms** (trung bình 48,3 ms). Không lượt nào vượt ngưỡng 60 ms
  trong 16 lượt hợp lệ (nếu tính attempt3).
- **Cộng dồn (NẾU parent bác):** đứng nguyên 15 lượt như đợt 142/143
  (P1 45/45, P2 36/36, P3-A1 40/45, P3' 17/17, P7 31/31).
- Ba điều kiện mở lại điều tra (DEF §13): không áp dụng — điều tra (c2)
  **vẫn ĐÓNG**, verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên
  (attempt3 ủng hộ thêm nếu được chấp nhận).

## 8. Balloon — xả sau reboot rồi phồng lại

| Thời điểm | Boot | Balloon | RAMavail | Ghi chú |
|---|---|---|---|---|
| 05:39Z (T4 bắt đầu) | 691a7403 | 5.931.128 kB | 821 MB | Đã xả một phần so với đóng băng 6.443.824 |
| 05:44Z (poll #1) | 691a7403 | — | 1.815 MB | Cửa mở ngay |
| 05:55:51Z (poller chạy lại) | cc222c8a | — | 1.947 MB | Xả mạnh sau reboot |
| 06:12:43Z (đóng) | cc222c8a | 4.159.132 kB | 2.747 MB | Xả sâu nhất đợt |
| 06:18:10Z | cc222c8a | 5.354.516 kB | 1.466 MB | Phồng lại +1,2 GB trong 6 phút |

- Balloon KHÔNG xả bền: xả sau reboot rồi phồng lại về phía giá trị
  đóng băng 6.443.824 kB (mẫu xả–phồng như đợt 143; khác đợt 141/142 xả
  bền). Chu kỳ xả–phồng ~20–40 phút; cửa RAM ≥1024 mở trong các pha xả
  và lần này trùng được với gate0 (nhờ dự phòng T4-check-only).
- Headroom inotify: không phải phần T4 đo (T9-144) — không ghi số ở đây.
  RAM đỉnh/đáy trong các attempt (sampler): min 1016 MB (boot cũ),
  min 1836 MB (attempt3 boot mới); 0 mẫu ≥ guard 6.144 MiB; birefnet
  KHÔNG thử (không thuộc brief; u2net là fallback chính thức).

## 9. Sai số F-144-T4-1..9

- **F-144-T4-1 — Reboot #31 (TẠM) + runtime restart giết poller 1 +
  waiter.** Poller pid 36668 chết giữa attempt2 boot cũ; waiter
  proc_d5f3dfebca67 mất kết quả xác nhận sau runtime restart. Khôi phục
  bằng cách đọc lại từ đĩa (poll log append còn nguyên; chain log +
  JSON + classb còn nguyên tới lúc reboot). Poller chạy lại tay
  05:55:51Z (pid 3959) theo RESTART-NOTE, như tiền lệ đợt 142/143.
  Watcher mới cho pid 3959 chạy tới khi poller thoát 06:11:55Z.
- **F-144-T4-2 — B4 GIẢ-DƯƠNG ở cả ba attempt boot mới (xem §6.1).**
  `check-classb` đếm process bằng grep chuỗi con trên cmdline
  (`ps aux | grep -E '[a]pt-get|[d]pkg|[o]s-intent'`): shell của chính
  T4 (pid 3957, dòng lệnh chứa `dpkg.log`) + wrapper của T5 (pid 7815,
  dòng lệnh chứa `pgrep -a apt-get`) đều bị đếm là "apt/dpkg đang chạy".
  Không có process apt/dpkg thật nào (exact-comm = 0; apt history cuối
  05:57:30Z; dpkg.log 1545 dòng không đổi). Đây là lỗi phép đo, không
  phải replay thật. Vá đề xuất ở §10.2.
- **F-144-T4-3 — Sampler log append trộn mẫu hai boot (xem §6.2).**
  `t4-attempt-inner.sh` dòng 38 ghi `>>` vào `load-mid-t4-$TAG.log`
  không cắt file: attempt1.log 204 dòng (cũ+mới), attempt2.log 266
  dòng (cũ+mới), chỉ attempt3.log (102 dòng) sạch. Hệ quả: classb
  attempt1 boot mới báo load1_max=4,06 (mẫu boot cũ) và RAM_min=1016 MB
  (mẫu boot cũ) — sai số đo, đã tính lại theo cửa sổ ở §6.2.
- **F-144-T4-4 — Poller chạy lại dùng lại tag attempt → GHI ĐÈ artifact
  boot cũ.** JSON attempt1 boot cũ (3.418.778 B, median 44,0 ms) +
  file analyzer P1/P3/P7 của nó đã mất; JSON attempt2 boot cũ dở dang
  (819.542 B) cũng mất. Chỉ còn số tóm tắt T4 đọc lúc 05:54Z (ghi ở
  §2/§5.1) + file coverage-check (ghi append nên còn cả hai boot) +
  chain log. Vá đề xuất: tên file attempt kèm boot id, hoặc archive
  artifact cũ khi phát hiện reboot (xem §10.2).
- **F-144-T4-5 — Dị thường đồng hồ 27 s lúc reboot (xem §3).** Chain log
  còn timestamp probe tới 05:53:42Z trong khi btime boot mới 05:53:15Z.
  Nhiều khả năng đồng hồ nhảy lúc reboot; khung chết (05:53:42Z,
  05:54:11Z] có btime nằm ngoài. Để T2/T7 hòa giải; T4 không tự sửa
  btime.
- **F-144-T4-6 — Ngân sách retry reset khi poller chạy lại.** Bộ đếm
  attempt nằm trong tiến trình poller nên reboot reset nó: tổng cộng
  đợt này chạy 5 attempt (2 boot cũ + 3 boot mới) trong khi cap mỗi
  poller là 3 attempt. Không có lỗi setup nào (0/2 retry setup đã dùng
  theo nghĩa brief). Parent xét có cần cap theo đợt (không theo
  process) hay không (xem §10.1).
- **F-144-T4-7 — Shell restart exec (pid 3957) linger thành orphan.**
  Lệnh chạy lại poller kết thúc bằng output_drain_timeout; shell
  `bash -c` của nó (pid 3957) còn sống suốt cả ba attempt boot mới
  (thấy trong mọi file ps-before/after) rồi chết trước lúc T4 kiểm
  06:1xZ. Nó góp phần gây B4 giả-dương (dòng lệnh chứa `dpkg.log`).
  Bài học: sau output_drain_timeout phải kiểm tra process còn sót;
  lần sau chạy poller lại bằng lệnh detached (`setsid nohup ...`) để
  shell cha không linger.
- **F-144-T4-8 — Attempt1 boot mới median 62,0 ms, vượt ngưỡng 60 ms.**
  Không phải lỗi phép đo (JSON + tickcost còn nguyên, n=531). Xu hướng
  62,0 → 58,0 → 55,0 qua ba attempt khi boot ổn định dần sau reboot —
  cùng mẫu "attempt1 nóng" các đợt trước. Chỉ ghi nhận; attempt1 đã bị
  loại đúng dù B có hiệu chỉnh hay không.
- **F-144-T4-9 — T5 post cờ boot mới muộn hơn cửa mở (không phải lỗi).**
  Cờ T5 cho boot cc222c8a tới 06:00:44Z, sau khi cửa đã mở bằng dự
  phòng 05:58:52Z. Đây chính là ca mà quyết (j) sinh ra để xử lý — đã
  xử lý đúng. T5-144 lúc T4 đóng (06:17Z) chưa đóng cờ — chỉ ghi nhận
  thời điểm.

## 10. Files + stage + chờ quyết / nợ đợt 145

### 10.1 Chờ quyết parent (để T10-144 đưa vào §12.1)

1. **Lượt yên #19 — CHẤP NHẬN attempt3 boot mới (median 55,0 ms) làm
   lượt HỢP LỆ (cộng dồn lên 16), hay GIỮ 0 lượt hợp lệ theo luật đã
   lập trình của poller?** Bằng chứng hậu kiểm: B4-hiệu-chỉnh ĐẠT
   (§6.1 — không có replay thật; grep chuỗi con là lỗi phép đo), B2
   theo cửa sổ ĐẠT (§6.2), P1/P3-A1/P7/P3'/P2 DUNG đầy đủ (§7).
   T4 KHÔNG tự chọn (đó là việc bỏ qua verdict đã lập trình của poller
   — chỉ parent mới được quyết). Nếu chấp nhận: cộng dồn §7 (16 lượt).
   Nếu bác: #19 đo lại ở đợt 145 với poller đã vá (§10.2).
2. **Ngân sách retry theo đợt hay theo process (F-144-T4-6)?** Đợt này
   chạy 5 attempt vì reboot reset bộ đếm. Có cần cap 3 attempt/đợt
   (không tính attempt bị reboot giết) hay giữ nguyên luật hiện tại?
3. **Vá B4 + sampler + attempt-tagging (§10.2) — giao T4-145 hay luồng
   khác?** Cả ba đều là vá script trong hidden_files, không đụng repo.

### 10.2 Nợ đợt 145

1. **#19 (xem §10.1.1).** Nếu parent bác attempt3: đo lại #19 từ đầu
   ở đợt 145 với poller đã vá B4/sampler/tagging.
2. **Vá check-classb B4:** thay grep chuỗi con bằng `pgrep -x apt-get`
   / `pgrep -x dpkg` (khớp comm chính xác) + kiểm dpkg.log tăng dòng
   trong cửa sổ attempt. Áp dụng từ đợt 145.
3. **Vá sampler append:** cắt (truncate) `load-mid-t4-$TAG.log` khi
   run-attempt bắt đầu (hoặc tên file kèm boot id) — tránh trộn mẫu
   hai boot sau reboot.
4. **Vá attempt tagging:** tên file attempt/analyzer kèm boot id
   (vd `attempt1-cc222c8a`) hoặc archive artifact cũ khi poller phát
   hiện reboot — tránh ghi đè như F-144-T4-4.
5. **Câu B2 (tải tự sinh) vẫn mở một nửa (§6.3):** spike 4,06 chỉ ở
   attempt1 boot cũ; attempt boot mới ≤3,15; per-pass ≤2,41 — tải không
   bền vững giữa probe; quy kết chính xác vẫn mở (dữ liệu per-pass
   attempt1-cũ đã mất).
6. **Watchdog bản vá vẫn chưa kiểm chứng thực tế** (0 kẹt đợt này —
   đợt thứ ba liên tiếp không có kẹt thật để thử; harness 6/6 của T8
   không thuộc phần T4).
7. **Balloon xả–phồng trở lại** (§8) — tiếp tục theo dõi; headroom do
   T9-144 báo.
8. **Thủ tục T8 kèm theo quyết (j):** gate không mở + T4 0 attempt thì
   T8 được chạy harness sau waiter hết hạn kèm ghi rõ — **không áp dụng
   đợt này** (gate mở ngay cả hai boot, T4 có 5 attempt).

### 10.3 Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND144_T4_WEBKIT_QUIET19_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script/phân tích mới (trong hidden_files, không stage — file làm
  việc nội bộ):** `poll-wait-t4-144.sh` (deadline 08:00Z, gate0
  T5-chính/T4-check-only-dự-phòng theo quyết (j) đợt 143, vá text hết
  hạn F-143-T4-3); `run-attempt-144.sh`, `t4-attempt-inner.sh`,
  `check-classb-t4.sh`, `vite.t4-temp.config.mjs`,
  `probe121t3-ghost-k7.webkit.mjs`, `b.json`, 10 analyzer
  `analyze-t4-*.py`, `t4-histogram-with19.py` (chưa chạy — chờ quyết
  parent về attempt3), `repro-18-p1p3p7.txt` (tái tạo #18, diff sạch),
  `GATE0-NOTE-FOR-T5-144.md`, `RESTART-NOTE.md`, `wait-t4-144.sh`.
- **Log/evidence (hidden_files/round144-t4/, không stage):**
  `poll-t4.log` (6 poll: 1 boot 691a7403 + 5 boot cc222c8a, ghi
  append cả hai poller), `chain-t4.log`, `poll-t4.nohup.log`,
  `poll-t4.nohup2.log`, `postboot-t4-144-gate0wait-*.log`
  (check-only: FAIL poll #1–#4 boot mới, PASS poll #5),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (0 poll có blockers>0
  đợt này — không có file nào), `tree-md5.txt` (530e10a7),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}.json` (boot mới;
  attempt1/2 boot cũ ĐÃ BỊ GHI ĐÈ — xem F-144-T4-4),
  `classb-t4-attempt{1,2,3}.txt` (boot mới; bản boot cũ đã mất),
  `load-mid-t4-attempt{1,2,3}.log` (attempt1/2 TRỘN hai boot —
  xem F-144-T4-3; attempt3 sạch),
  `analyze-t4-attempt{1,2,3}-*.txt` (boot mới; bản boot cũ đã mất
  trừ coverage-check ghi append), `analyze-t4-attempt{2,3}-p1p3p7.txt`
  (chạy hậu kiểm cho parent quyết), `ps-before/after-t4-attempt*.txt`,
  `run-webkit-t4-attempt*.log`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này; file
  `preview-b-f3-flip-webkit-t4-attempt*.json` của boot cũ (đã bị đè).
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round144-t4-quiet19.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round144-t4.done` (1 dòng tóm tắt — xem dưới).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 144).
- **Dọn dẹp lúc đóng (06:21Z):** 0 tiến trình T4 còn sống (poller đã
  thoát exit 11, waiter đã ghi log, probe/vite đã nhả lock); vite.lock
  không còn; 0 Xvfb/WebKit/vite-5187 process của T4. Socket Xvfb
  `:193/:194/:195` trong `/tmp/.X11-unix/` (nếu còn) là của luồng khác
  — **không xóa**, để chủ sở hữu dọn.

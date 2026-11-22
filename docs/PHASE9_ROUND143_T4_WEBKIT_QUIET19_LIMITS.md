# PHASE9_ROUND143_T4_WEBKIT_QUIET19_LIMITS.md

**Đợt:** 143. **Luồng:** T4 — lượt yên WebKit #19 (đo lại, giám sát thụ
động (c2) theo DEF v0.5). **Ngày:** 19/11/2026. **Boot đo:** HAI boot,
không boot nào đo được — 70a5b0fc (btime 01:55:25Z, chết 03:55:45Z)
và 691a7403 (btime 03:55:45Z, boot lúc đóng). **Cây:**
`apps/web/src/preview.tsx` md5 `530e10a7` (kiểm lúc mở poller
02:42Z, sau reboot 03:56Z, lúc đóng 05:21Z — không đổi).
**Trạng thái:** LƯỢT YÊN #19 **KHÔNG ĐO ĐƯỢC — 0 ATTEMPT**
(0/20 pass, không median, không P-verdict nào).

## 0. Verdict tổng (đọc trước)

- **Lượt yên WebKit #19 KHÔNG ĐO ĐƯỢC trong đợt 143.** Poller chạy
  209 poll (98 trên boot 70a5b0fc + 111 trên boot 691a7403),
  02:42:30Z–05:20Z, **cửa yên KHÔNG BAO GIỜ mở** (0 lần "CUA YEN
  MO"); poller thoát exit 5 đúng hạn 05:20Z. Không có JSON probe,
  không tickCost, không (c2) occurrence nào.
- **Chuỗi lượt hợp lệ DỪNG ở 15 lượt, KHÔNG ĐỔI:** P1 **45/45**,
  P2 **36/36** occurrence lag ≥+1f (0 âm), P3-A1 **40/45**,
  P3' **17/17 (3 lượt)**, P7 **31/31**. Chuỗi median tickCost 15
  lượt giữ nguyên: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / **49,0 ms**
  (trung bình 47,8 ms). Không lượt nào vượt ngưỡng 60 ms — vì
  không lượt nào chạy.
- **Nguyên nhân kép, chưa từng đồng thời thỏa trên cùng một boot:**
  - Boot 70a5b0fc: gate 0 ĐỎ tới 03:17:08Z (T5 repair apt), XANH
    từ poll #47 (52 poll PASS) — nhưng RAM ≥1024 chỉ xảy ra khi
    gate 0 còn đỏ (23/98 poll); **0 poll có cả cờ T5 PASS + RAM
    ≥1024**. Cửa không mở.
  - Boot 691a7403 (sau reboot 03:55:45Z): postboot check-only
    PASS, RAM ≥1024 trong 29/111 poll, **16 poll thỏa MỌI điều
    kiện trừ cờ T5** — nhưng cờ T5 cho boot mới KHÔNG BAO GIỜ
    xuất hiện (T5-143 đã XONG 03:29Z, trước reboot; không còn
    process T5 nào để post lại). Cửa không mở.
- **Câu hỏi brief đợt 143 về B2 / tải tự sinh CHƯA CÓ ĐÁP ÁN:**
  attempt1 đợt này không chạy nên không có dữ liệu mới về việc
  "attempt1 lại nhiễm tải thì xem lại nguồn tải tự sinh của stack
  đo". Giả thuyết vẫn mở, mang sang đợt 144.
- **Ngân sách retry:** 0/2 lượt retry setup đã dùng (không có lỗi
  setup nào vì không attempt nào chạy). Không có lượt nhiễm tải
  nào để retry.
- **DEF v0.5, fix 530e10a7, ngưỡng tickCost ≤60 ms, gate A ≥1024 MB:
  KHÔNG ĐỔI.** Không có code nào được viết/sửa trong repo ở lượt
  này (chỉ poll + log); preview.tsx không chạm tới. Không push,
  không release/tag.
- **Nợ kỹ thuật đã vá nhưng chưa được thử:** bản vá poller cho
  F-142-T4-4 (kiểm verdict lớp B trước khi thoát sau attempt
  exit 0) đã vào `poll-wait-t4-143.sh` nhưng 0 attempt nên chưa
  bao giờ kích hoạt — mang sang đợt 144, vẫn chưa kiểm chứng
  thực tế.

## 1. Bối cảnh

- Lượt yên #18 HỢP LỆ ở đợt 142 (attempt3 20/20, median 49,0 ms;
  attempt1+2 nhiễm tải B2; P1–P7 + P3' đều ĐÚNG; cộng dồn 15 lượt
  hợp lệ). Brief đợt 143: đo lượt #19, ngưỡng median ≤60 ms,
  retry tối đa 2, gate A ≥1024 MB giữ nguyên; NẾU attempt1 lại
  nhiễm tải thì xem lại nguồn tải tự sinh của stack đo.
- Script sao từ đợt 142 sang `round143-t4/`, đổi 142→143, deadline
  poller 05:20Z 19/11 (hạn cứng T10 ~05:30Z), cờ T5 ưu tiên
  `round143-t5/` + dự phòng `round142-t5/`. `bash -n` OK cả 4
  script. Analyzer `analyze-t4-p1p3p7.py` kiểm lại TRƯỚC khi chạy:
  tái tạo #18 khớp 100% file T4-142 (`repro-18-p1p3p7.txt`, diff
  sạch) — chạy bằng script copy sang round143-t4, không sửa logic.
- Chốt chặn `round-in-progress.md` TỒN TẠI nhưng đó là marker của
  chính đợt 143 này ("Đợt 143 đang chạy", mở 02:35Z) — không phải
  đợt main-chat đang chạy; T4 tiến hành theo đúng brief parent
  giao (cùng tiền lệ đợt 139/140/141/142).
- Poller pid 9169 chạy 02:42:30Z; **chết theo reboot 03:55:45Z**
  (cùng đợt runtime restart — xem F-143-T4-1); poller mới pid
  2019 khởi động lại 03:56:50Z trên boot mới, chạy tới hạn
  05:20Z (exit 5).

## 2. Poller — boot 70a5b0fc: 98 poll, gate 0 mở muộn, RAM không trùng

### 2.1 T5 repair: lần 1 TIMEOUT, lần 2 PASS (02:43–03:16Z)

- Boot 70a5b0fc btime 01:55:25Z; replay hệ thống CHẾT DẠNG (B) lần
  4 (dpkg chỉ 2 dòng configure 01:55:55Z boot +30s rồi im, 0 proc
  apt/dpkg, cache 0 .deb, lists 5, GST dir ABSENT — theo cờ T5).
- T5 `--repair` lần 1 (02:43:36Z): **FAIL, apt-update TIMEOUT
  1500 s** (mirror chậm, partial 117 file/457M, 63 Get),
  exit=1 lúc 03:08:37Z; GST symlink OK (269 file), 0 gói apt
  được cài, dpkg vẫn 2 dòng.
- T5 `--repair` lần 2 (03:09:59Z, ngoại lệ có lý do F-143-T5-6):
  **PASS ~03:13:53Z** (~4 phút, RE-CHECK toàn PASS, dpkg
  795/113); cờ `POSTBOOT_PASS` post 03:16:42Z (poll=2,
  `boot_id=70a5b0fc-... btime=2026-11-19T01:55:25Z`).
- Poller ghi nhận cờ PASS lần đầu ở **poll #47, 03:17:08Z**
  (RAM 513 MB lúc đó); cờ PASS trong **52/98 poll** trên boot cũ
  (từ #47 tới #98).

### 2.2 RAM xả–phồng 3 chu kỳ, không trùng cửa với cờ

| Khoảng | Balloon | RAMavail (poll) | Gate 0 |
|---|---|---|---|
| 02:42–02:51Z | 6.443.824 → 5.291.148 kB | 1.360–2.714 MB (max poll #10, 02:49:18Z) | ĐỎ (postboot 1, apt=1, dpkg 2) |
| 02:53–03:02Z | 5.093.752 → 6.115.412 kB | 2.243 → ~600 MB | ĐỎ (T5 repair lần 1 chạy) |
| 03:12–03:20Z | 6.407.572 → 6.443.824 kB | ~500 MB | ĐỎ→XANH (#47, 03:17:08Z) |
| 03:20–03:40Z | 6.443.824 → 6.306.840 kB | ~470 → 823 MB | XANH (cờ PASS) |
| 03:40–03:55Z | 6.443.824 kB (đóng băng) | ~450–717 MB | XANH (cờ PASS) |

- RAM ≥1024 trong **23/98 poll** — toàn bộ rơi vào lúc gate 0
  còn đỏ (poll #1–#16, lúc apt replay/repair đang chạy; load1
  tới 4,67). Từ khi cờ PASS (#47) tới lúc boot chết (#98),
  **RAM không một lần ≥1024 MB** (max 823 MB poll #76).
- **0 poll thỏa mọi điều kiện trừ cờ** trên boot cũ (postboot=0
  + RAM≥1024 + load<2 + blockers=0 + lock free + apt=0: 0 lần).
  Cửa yên trên boot 70a5b0fc KHÔNG BAO GIỜ mở đủ cả hai gate
  cùng lúc — cùng mẫu như boot bde599df ở đợt 142 §2.1.
- Blockers trên boot cũ: poll #1–#2 (T6 grep/find, thoáng qua);
  poll #74–#94 (T8 chạy `run-webkit-143t8.sh`, clicktest-85m4 +
  vite m4 — xem §4); poll #109 là trên boot mới (vite build của
  luồng khác, xem §4). Tổng **60 poll có blockers>0** trong cả
  đợt (cả 2 boot).
- Load1 max boot cũ **4,67** (lúc apt replay + T6/T8 chạy song
  song); load1 <2 trong phần lớn thời gian sau 03:00Z.

## 3. Reboot — boot 70a5b0fc chết (03:55:30Z, 03:55:45Z], poller chết theo

- **Poller pid 9169 CHẾT** cùng reboot (poll log dừng ở #98,
  03:55:30Z; `kill -0 9169` xác nhận DEAD lúc kiểm 03:56:28Z).
  Cùng lúc đó **runtime restart** (watcher proc_dd90a350d7e7 +
  sleep-check proc_b0e519426a32 mất kết quả xác nhận — xem
  F-143-T4-1); không mất dữ liệu (poll log còn nguyên tới #98).
- **Boot 70a5b0fc chết trong khung (03:55:30Z, 03:55:45Z]**
  (last-seen poll #98; btime boot mới 691a7403 là 03:55:45Z).
  Theo chuỗi đợt 142 (#26, #27, #28, #29 trong lúc đóng sổ
  142) thì đây là **reboot #30 (TẠM — chờ T2/T7 chốt số chính
  thức)**. T4 ghi khung chết quan sát được; số reboot do T2-143
  chốt.
- **Cửa yên trên boot cũ MẤT vĩnh viễn** — attempt nào cũng chưa
  chạy; RAM sau reboot vọt 1.947 MB (balloon 4.943.356 kB) nhưng
  gate 0 reset về đỏ (cờ T5 cũ không khớp boot mới — poller
  KHÔNG tính cờ cũ là PASS, đúng luật gate 0).
- Poller khởi động lại **03:56:50Z (pid 2019)** trên boot mới;
  tree md5 kiểm lại vẫn 530e10a7; không có vite lock sót lại.
- T5-143 đã **XONG 03:29Z** (cờ `round143-t5.done`: "T5-143 XONG
  03:29Z ... postboot PASS poll1+poll2+poll0b; co 03:16:42Z
  poll=2") — tức T5 kết thúc TRƯỚC reboot 26 phút. Không còn
  process T5 nào để post cờ mới cho boot 691a7403 (xem §4 +
  F-143-T4-2).

## 4. Poller — boot 691a7403: 111 poll, 16 poll "chỉ thiếu cờ T5", hết hạn

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1–#2 | 03:56:50–57:35Z | 1.768 / 1.597 MB | 3,59–4,56 | ĐỎ | apt replay boot mới (dpkg 28→526), T8 giữ lock |
| #3–#6 | 03:58:20–04:00:37Z | 920–2.472 MB | 4,18–4,74 | ĐỎ | T8 giữ lock (pid 5034, port 5560), blockers 5–7 |
| #7–#15 | 04:01:22–04:07:23Z | 2.472 → 1.224 MB | 0,30–2,16 | ĐỎ* | postboot 0, apt 0, dpkg 1545 — **chỉ thiếu cờ T5** |
| #16–#43 | 04:08–04:28Z | 587–1.633 MB | 0,03–0,70 | ĐỎ* | RAM rơi <1024 (balloon phồng lại 6.443.824 kB) |
| #44–#73 | 04:29–04:51Z | ~490–998 MB | 0,03–1,08 | ĐỎ* | RAM cao nhất 998 MB (#100, 05:11:21Z — thiếu 26 MB) |
| #88–#94 | ~05:02Z | 646–690 MB | 2,03 | ĐỎ* | T8 giữ lock lần 2 (pid 17944, port 5490), blockers 5 |
| #109–#111 | 05:18:07–19:38Z | 1.081 / 1.158 / 1.128 MB | 0,48–1,33 | ĐỎ* | **RAM ≥1024 trở lại, mọi thứ xanh trừ cờ T5** |

\* ĐỎ ở đây = chỉ thiếu cờ T5 (`t5flag=cu(mtime-cu)`, cờ duy nhất
còn là của boot cũ 70a5b0fc); postboot check-only exit 0 trong
27/28 lần chạy gate0wait (1 lần CHƯA ĐỦ là trên boot cũ lúc
02:42Z).

- **16 poll trên boot mới thỏa MỌI điều kiện trừ cờ T5**
  (RAM≥1024 + load1<2 + load5<2 + blockers=0 + lock free +
  postboot=0 + apt=0): #9–#15 (04:02:53–04:07:23Z, RAM
  1.224–2.232 MB) và #110–#111 (05:18:53–19:38Z, RAM
  1.128–1.158 MB) cùng các poll kẹp giữa — đếm bằng awk trên
  poll log. Nếu cờ T5 cho boot mới tồn tại, cửa đã mở ở poll #9
  (04:02:53Z) và attempt1 đã chạy.
- **RAM 998 MB ở poll #100 (05:11:21Z)** — thiếu đúng 26 MB so
  với gate A; sau đó RAM rơi về 758–925 MB rồi mới vượt lại ở
  #109–#111, chỉ 2 phút trước hạn poller.
- **T8 giữ vite lock 23 poll** trên boot mới (2 đợt: pid 5034
  port 5560 lúc 03:58–~04:01Z và pid 17944 port 5490 lúc
  ~05:02Z, chạy lại S1/O8 sau repair — đúng việc T8 được giao;
  lock được tôn trọng, không xung đột; T8 nhả trước #100).
- **Hết hạn:** poll #111 (05:19:38Z) là poll cuối; poller thoát
  **exit 5 lúc 05:20Z** ("HET HAN CHO 05:20Z 19/11 — 0 attempt").
  Lúc đóng 05:21:29Z: boot 691a7403, RAM 1.917 MB, balloon
  4.891.992 kB (đã xả lại sau hạn — muộn).
- Load1 max boot mới **4,74** (lúc T8 vite + apt replay chồng
  nhau, poll #4); sau 04:08Z load1 hầu hết <1.

## 5. Balloon — xả–phồng cả 2 boot, KHÔNG xả bền đợt này

| Thời điểm | Boot | Balloon | RAMavail | Ghi chú |
|---|---|---|---|---|
| 02:40:24Z (T4 bắt đầu) | 70a5b0fc | 6.443.824 kB | ~400 MB | Đóng băng đợt 5 (như #15/#17/#18) |
| 02:43–02:53Z | 70a5b0fc | 5.291.148 → 5.093.752 kB | 1.360–2.714 MB | Xả −1,35 GB |
| 03:02–03:20Z | 70a5b0fc | 6.115.412 → 6.443.824 kB | ~500 MB | Phồng lại đúng giá trị đóng băng |
| 03:40–03:52Z | 70a5b0fc | 6.306.840 → 6.443.824 kB | 627–823 MB | Xả nhẹ rồi phồng lại |
| 03:56:28Z (sau reboot) | 691a7403 | 4.943.356 kB | 1.947 MB | Xả mạnh sau reboot |
| 04:06–04:28Z | 691a7403 | 5.601.212 → 6.443.824 kB | 1.633 → 486 MB | Phồng lại đúng giá trị đóng băng |
| 04:51–05:02Z | 691a7403 | 6.027.056 → 5.348.404 kB | 934 → 646 MB | Xả −679 MB (T8 đang chạy) |
| 05:11–05:21Z (đóng) | 691a7403 | ~5.348.404 → 4.891.992 kB | 998 → 1.917 MB | Xả tiếp sau hạn poller |

- **Kết luận cho parent: balloon KHÔNG xả bền trong đợt 143**
  (khác đợt 141/142 xả bền 2 lần liên tiếp) — mẫu xả–phồng về
  đúng 6.443.824 kB quay lại trên cả 2 boot. Chu kỳ xả–phồng
  ~20–40 phút; cửa RAM ≥1024 chỉ mở trong các pha xả, và trên
  boot cũ pha xả không trùng cờ T5, trên boot mới pha xả không
  trùng cờ T5 (vì không có cờ).
- Headroom: T5-143 ghi headroom-end 1494 (mở đợt 1498) — dưới
  ngưỡng báo < ~1.800, nhắc lại một dòng theo quyết parent
  (chỉ theo dõi).
- Gate A ≥1024 MB GIỮ NGUYÊN (quyết parent) — và đã đủ về mặt
  RAM trong 52/209 poll (23 cũ + 29 mới); vấn đề đợt này không
  phải ngưỡng RAM mà là **sự trùng pha** giữa RAM và cờ T5.

## 6. Vì sao 0 attempt — hai blocker độc lập, không trùng pha

1. **Boot 70a5b0fc (02:42–03:55Z):** blocker là THỜI GIAN —
   T5 repair mất 34 phút (02:43–03:17Z, lần 1 timeout mạng
   1500 s); khi cờ xanh thì RAM đã rơi <1024 và không hồi lại
   trước reboot. 0/98 poll thỏa đủ.
2. **Boot 691a7403 (03:56–05:20Z):** blocker là CỜ T5 —
   postboot check-only PASS độc lập (libs đủ, GST đủ isomp4 +
   libav, apt đủ 11 package, "ĐỦ ĐIỀU KIỆN chạy WebKit" —
   `postboot-t4-143-gate0wait-13.log`), RAM đủ trong 29 poll,
   16 poll thỏa mọi thứ trừ cờ; nhưng cờ cho boot mới không
   tồn tại vì T5 đã xong trước reboot. 0/111 poll thỏa đủ.
3. T4 **KHÔNG tự viết cờ POSTBOOT_PASS** (đó là chứng nhận độc
   lập của T5; tự viết = giả mạo chứng nhận). Đúng luật gate 0
   là chờ cờ thật — và cờ thật không tới trước hạn.
4. Không có lỗi setup nào (0/2 retry đã dùng); không có lượt
   nhiễm tải nào (không attempt nào chạy để mà nhiễm).

## 7. Sai số F-143-T4-1..6

- **F-143-T4-1 — Reboot giết poller + runtime restart làm mất
  kết quả watcher.** Poller pid 9169 chết theo reboot
  03:55:45Z (poll log dừng #98). Watcher proc_dd90a350d7e7
  (đợi poller 9169) và sleep-check proc_b0e519426a32 mất kết
  quả xác nhận sau runtime restart — khôi phục bằng cách đọc
  lại từ đĩa (poll log còn nguyên tới #98, boot_id/btime mới
  xác nhận reboot); không mất dữ liệu. Poller khởi động lại
  tay 03:56:50Z (pid 2019), như tiền lệ đợt 142 sau reboot #26.
  Watcher mới cho pid 2019 (`poller2019-watcher.log`) chạy tới
  khi poller thoát 05:20Z.
- **F-143-T4-2 — Cờ T5 cho boot mới không bao giờ xuất hiện
  (blocker cấu trúc, không phải lỗi thao tác).** T5-143 XONG
  03:29Z (`round143-t5.done`), reboot 03:55:45Z — 26 phút sau.
  Không process T5 nào còn sống để post cờ mới; poller đúng
  luật từ chối cờ cũ (boot_id không khớp). Đây là lần đầu
  pattern này xảy ra: các đợt trước T5 còn sống khi reboot tới
  (đợt 142 T5 post cờ mới 00:00:22Z sau reboot #26). Cần quyết
  parent cho đợt sau (xem §10.2).
- **F-143-T4-3 — Thông báo hết hạn của poller ghi sai nguyên
  nhân.** Dòng "HET HAN CHO 05:20Z — 0 attempt (gate A khong
  mo...)" chỉ nêu gate A; thực tế trên boot mới gate A ĐÃ mở
  (RAM≥1024 trong 29 poll, 16 poll thỏa mọi thứ trừ cờ) —
  thứ không mở là **gate 0 (cờ T5)**. Text cũ từ các đợt
  trước (khi gate A là blocker chính). Sửa text ở bản poller
  đợt 144 (ghi rõ gate nào đỏ lúc hết hạn).
- **F-143-T4-4 — Poller kiểm lớp B (vá F-142-T4-4) chưa được
  thử thực tế.** Bản vá đã vào `poll-wait-t4-143.sh` (sau
  attempt exit 0, kiểm `LOP-B-TONG: DAT 5/5` trong
  `classb-t4-attemptN.txt`, vi phạm thì retry tối đa 3
  attempt) nhưng 0 attempt nên nhánh này chưa bao giờ chạy.
  Mang sang đợt 144, vẫn là nợ chưa kiểm chứng.
- **F-143-T4-5 — RAM 998 MB ở poll #100 (05:11:21Z): suýt
  soát gate A.** Thiếu đúng 26 MB; RAM vượt lại ở #109–#111
  nhưng chỉ 2 phút trước hạn và vẫn thiếu cờ T5. Không phải
  lỗi — chỉ ghi nhận độ sát của cửa (cửa RAM mở muộn nhất
  trong các đợt gần đây).
- **F-143-T4-6 — Blockers 60/209 poll, phần lớn là việc thật
  của luồng khác (không phải nhiễu grep).** T8 giữ vite lock +
  chạy WebKit (poll #3–#6, #88–#94 boot mới; #74–#94 boot
  cũ), 1 vite build của luồng khác (#109 boot mới), còn lại
  là grep/find thoáng qua của T6. Cơ chế snapshot-trước-đếm-
  sau hoạt động đúng (file `blockers-ps-*.txt` /
  `blockers-list-*.txt` lưu đủ); blocker đếm đúng nên cửa
  không mở sai lúc T8 đang chạy — đó là hành vi đúng, không
  phải sai số đo.

## 8. P1–P7 + P3' — KHÔNG CÓ (0 attempt)

- Không JSON probe, không tick, không (c2) occurrence → không
  P-verdict nào, không median/p90/max/min, không histogram.
- Cộng dồn KHÔNG ĐỔI (15 lượt hợp lệ): P1 45/45, P2 36/36,
  P3-A1 40/45, P3' 17/17, P7 31/31.
- Ba điều kiện mở lại điều tra (DEF §13): không áp dụng (không
  có lượt hợp lệ nào để đánh giá) — điều tra (c2) **vẫn ĐÓNG**,
  verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên.
- Câu brief đợt 143 ("nếu attempt1 lại nhiễm tải thì xem lại
  nguồn tải tự sinh của stack đo"): **chưa có dữ liệu mới** —
  không attempt nào chạy. Ghi nhận thêm: load1 max 4,67 (boot
  cũ) / 4,74 (boot mới) đều xảy ra khi apt replay + vite của
  luồng khác chồng nhau, KHÔNG phải lúc stack đo chạy một mình
  (stack đo chưa bao giờ chạy đợt này) — không kết luận được
  gì về tải tự sinh.

## 9. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND143_T4_WEBKIT_QUIET19_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script/phân tích mới (trong hidden_files, không stage — file làm
  việc nội bộ):** `poll-wait-t4-143.sh` (deadline 05:20Z 19/11, cờ
  T5 round143-t5 + dự phòng round142-t5, **vá kiểm lớp B sau
  exit 0 — F-142-T4-4, chưa thử thực tế**); `run-attempt-143.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`,
  `vite.t4-temp.config.mjs`, `probe121t3-ghost-k7.webkit.mjs`,
  `b.json`, `analyze-t4-p1p3p7.py` (+ 9 analyzer khác),
  `t4-histogram-with19.py` (chưa chạy — không có JSON hợp lệ),
  `repro-18-p1p3p7.txt` (tái tạo #18, diff sạch).
- **Log/evidence (hidden_files/round143-t4/, không stage):**
  `poll-t4.log` (209 poll: 98 boot 70a5b0fc + 111 boot 691a7403),
  `chain-t4.log`, `poll-t4.nohup.log`, `poll-t4.nohup2.log`,
  `poller2019-watcher.log`, `postboot-t4-143-gate0wait-*.log`
  (28 file; 27 "ĐỦ ĐIỀU KIỆN", 1 "CHƯA ĐỦ" trên boot cũ),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (60 poll có
  blockers>0), `tree-md5.txt` (530e10a7).
- **KHÔNG có:** JSON probe nào, file `preview-b-f3-flip-*.json`
  nào, `classb-t4-attempt*.txt` nào, sửa code repo nào ngoài
  LIMITS này.
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round143-t4-quiet19.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round143-t4.done` (1 dòng: KHÔNG ĐO ĐƯỢC
  — 0 attempt, không median).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 143).
- **Dọn dẹp lúc đóng (05:21Z):** 0 tiến trình T4 còn sống
  (poller đã thoát exit 5, watcher đã ghi log), lock vite đã
  nhả/không có, 0 Xvfb/WebKit/vite-5187 process của T4. Socket
  Xvfb `:193/:194/:195` trong `/tmp/.X11-unix/` là của luồng
  khác (T8/T10 — T4 đợt này không chạy vite/WebKit nên không
  tạo socket nào) — **không xóa**, để chủ sở hữu dọn.

## 10. Chờ quyết / nợ đợt 144

1. **Lượt yên #19 CHƯA ĐO — đợt 144 phải đo lại #19 từ đầu**
   (chuỗi hợp lệ vẫn 15 lượt; retry budget tính lại từ đầu:
   tối đa 2 lần như mọi đợt).
2. **Cờ T5 sau reboot khi T5 đã xong (F-143-T4-2) — CẦN QUYẾT
   PARENT.** Các phương án: (a) T5 (hoặc T5b) phải ở lại / được
   gọi lại để post cờ mới khi reboot xảy ra sau khi T5 xong;
   (b) cho phép T4 dùng postboot check-only PASS độc lập làm
   gate 0 khi T5 đã xong và cờ cũ đã hết hạn theo boot (kèm
   ghi rõ trong LIMITS); (c) giữ nguyên — chấp nhận mất lượt
   khi reboot rơi vào khoảng trống này. T4 KHÔNG tự chọn; đợt
   144 vẫn chờ cờ T5 theo luật cũ nếu parent chưa quyết.
3. **Câu B2 / tải tự sinh (brief đợt 143) vẫn mở** — chưa có
   dữ liệu mới (0 attempt). Đợt 144 đo được attempt1 thì mới
   trả lời được.
4. **Balloon không xả bền đợt này** (§5) — mẫu xả–phồng về đúng
   6.443.824 kB quay lại cả 2 boot sau 2 đợt xả bền (141/142).
   Tiếp tục theo dõi; headroom-end 1494 (dưới ngưỡng báo) chỉ
   nhắc một dòng.
5. **Vá poller F-142-T4-4 (kiểm lớp B sau exit 0) vẫn chưa
   kiểm chứng thực tế** — đợt 144 có attempt 20/20 đầu tiên
   sẽ là lần thử đầu; nếu attempt vi phạm B mà poller không
   retry thì đó là lỗi vá, báo ngay.
6. **Sửa text hết hạn của poller (F-143-T4-3):** ghi rõ gate
   nào đỏ lúc hết hạn (gate 0 / gate A), không ghi chung
   "gate A khong mo".
7. **Không có gì khác chờ parent ở lượt này** — 0 attempt, 0
   số đo mới, không code repo nào đổi ngoài LIMITS này.

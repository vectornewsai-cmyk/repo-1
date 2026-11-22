# PHASE9_ROUND140_T4_WEBKIT_QUIET17_LIMITS.md

**Đợt:** 140. **Luồng:** T4 — lượt yên WebKit #17 (giám sát thụ động (c2)
theo DEF v0.5). **Ngày:** 18/11/2026. **Boot:** af558fb5 (btime
15:54:37Z) lúc mở → **90392aa5 (btime 17:52:56Z) sau 1 reboot giữa
lượt** (xem §3). **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7`
(kiểm lúc mở poller 17:41:12Z, sau attempt1 17:54Z, lúc đóng
19:31:54Z — không đổi). **Trạng thái:** LƯỢT YÊN #17 **KHÔNG ĐO
ĐƯỢC** — 0 attempt đầy đủ 20/20 trong cả đợt.

## 0. Verdict tổng (đọc trước)

- **Lượt yên #17 KHÔNG ĐO ĐƯỢC.** Chỉ có 1 attempt chạy dở:
  **attempt1 partial 10/20** trên boot cũ af558fb5 (pass 11 timeout
  120 s, rồi bị reboot giết giữa lúc ghi partial JSON). **P1–P7 +
  P3' KHÔNG KIỂM ĐƯỢC** (DEF v0.5 §1: attempt partial không tính
  verdict).
- **Nguyên nhân duy nhất trên boot mới: gate A không mở.** Balloon
  đóng băng ở đúng giá trị của #15 — **6.443.824 kB** — suốt 124
  poll trên boot 90392aa5; RAMavail không một lần ≥1024 MB trong
  96 poll gate 0 đã xanh (max 832 MB). Gate A giữ nguyên ≥1024 MB
  theo quyết parent đợt 139 (d) — **KHÔNG hạ, KHÔNG chạy attempt
  khi gate chưa mở, KHÔNG gia hạn** (poller tự đóng đúng 19:30Z,
  exit 5).
- **Cộng dồn KHÔNG ĐỔI (vẫn 13 lượt yên hợp lệ):** P1 **32/32**,
  P2 **23/23** occurrence lag ≥+1f (0 âm), P3-A1 **28/32**, P3'
  **4/4 (1 lượt)**, P7 **18/18**. Điều tra (c2) vẫn ĐÓNG — không có
  điều kiện nào trong ba điều kiện mở lại (§13 DEF v0.5) xảy ra
  (không có lượt hợp lệ mới để xét).
- **Retry theo quyết parent đợt 139 (h): 0 lượt đã dùng.** Attempt1
  partial do wedged (pass-timeout) + reboot — không phải lỗi setup;
  không có lỗi setup nào trong đợt này, nên không có retry nào được
  kích hoạt. Ngân sách retry tối đa 2 lần còn nguyên cho đợt sau.
- **Lượt #17 phải đo lại ở đợt 141** (trên boot hiện tại 90392aa5
  nếu còn sống, hoặc boot mới nếu reboot tiếp).
- **DEF v0.5, fix 530e10a7, ngưỡng tickCost ≤60 ms, gate A: KHÔNG
  ĐỔI.** Không có code nào được viết/sửa trong repo ở lượt này (chỉ
  poll + probe + log); preview.tsx không chạm tới. Không push,
  không release/tag.

## 1. Bối cảnh

- Lượt yên #16 (đợt 139) HỢP LỆ ở attempt3, median tickCost 41,0 ms;
  P3' được kiểm thật LẦN ĐẦU 4/4. Cộng dồn 13 lượt hợp lệ: P1 32/32,
  P2 23/23, P3-A1 28/32, P3' 4/4, P7 18/18.
- Đợt 140 mở 17:36Z (cron 00:35 +07 19/11, sched 17:35:51Z) trên boot
  af558fb5 (btime 15:54:37Z 18/11). Chốt chặn
  `round-in-progress.md` TỒN TẠI nhưng đó là marker của chính đợt
  140 này ("Đợt 140 đang chạy", mở 17:36Z) — không phải đợt main-chat
  đang chạy; T4 tiến hành theo đúng brief parent giao (cùng tiền lệ
  đợt 139).
- Quyết parent đợt 139 áp dụng cho đợt này: (d) GIỮ NGUYÊN gate A
  ≥1024 MB (balloon không xả bền, không có kênh can thiệp host từ
  cell — ghi rõ nếu gate không mở); (h) PHÊ DUYỆT poller retry tối
  đa 2 lần khi lỗi setup (áp dụng từ đợt 140).
- Script `analyze-t4-p1p3p7.py` (đã sửa ở đợt 139) được kiểm lại
  TRƯỚC khi chạy: tái tạo #16 khớp 100% file T4-139
  (`analyze-t4-attempt3-p1p3p7.txt`, diff sạch) và tái tạo #14 đúng
  (P1 5/5 seq, P3-A1 SAI 3/5 — khớp DEF v0.5 §5; lưu ý script đếm
  theo seq riêng biệt, còn số công bố #14 P1 6/6 đếm theo occurrence
  — seq 145 có 2 occurrence; cùng verdict).
- Snapshot-trước-đếm-sau (F-137-T4-1): giữ ở mọi poll — mỗi poll chỉ
  chạy `ps` một lần vào `ps-snap-tmp.txt`, đếm blockers từ file đã
  chụp; file tạm chỉ giữ lại khi blockers>0.

## 2. Poller boot cũ — 10 poll, cửa mở ở poll #10, attempt1 partial

Poller pid 25124, script `poll-wait-t4-140.sh` (sao từ 139, đổi
deadline 19:30Z + cờ T5 round140-t5 (dự phòng round139-t5 cùng boot)
+ vòng retry attempt1→3 theo quyết (h)). 17:41:12Z–17:48:00Z.

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 17:41:12Z | 942 MB | 3,04 / 2,02 | XANH | load1 ≥2 |
| #2 | 17:41:57Z | 1.062 MB | 3,41 / 2,23 | XANH | blockers=1 (lệnh `vite-lock status` của T6 — false positive, đếm đúng từ snapshot); load1 ≥2 |
| #3 | 17:42:43Z | 994 MB | 2,40 / 2,12 | XANH | load1 ≥2 |
| #4 | 17:43:28Z | 868 MB | 1,55 / 1,94 | XANH | RAM <1024 |
| #5 | 17:44:13Z | 788 MB | 1,01 / 1,75 | XANH | RAM <1024 |
| #6 | 17:44:59Z | 754 MB | 1,35 / 1,71 | XANH | RAM <1024 |
| #7 | 17:45:44Z | 692 MB | 1,59 / 1,71 | XANH | RAM <1024 (min đợt) |
| #8 | 17:46:29Z | 961 MB | 1,50 / 1,66 | XANH | RAM <1024 |
| #9 | 17:47:14Z | 1.145 MB | 2,30 / 1,86 | XANH | load1 ≥2 |
| #10 | 17:48:00Z | 1.060 MB | 1,79 / 1,77 | XANH | **CỬA YÊN MỞ** — chạy attempt1 |

- RAMavail 10 poll: min 692 MB, max 1.145 MB, mean 926,6 MB,
  median 952 MB; **≥1024 MB: 3/10** (#2, #9, #10).
- Gate 0 xanh từ poll #1 (cờ T5 round140-t5 `POSTBOOT_PASS`
  boot_id=af558fb5 btime 15:54:37Z pass_at 17:40:19Z poll=0;
  postboot_exit=0; apt=0; dpkg_lines 1.545; cây YES md5=530e10a7;
  lock=khong 10/10 poll).
- Cửa bị chặn 9 poll đầu bởi LOAD (4 poll load1 ≥2) hoặc RAM (5
  poll RAM <1024) — không phải gate 0.

### 2.1 Attempt1 — partial 10/20 (boot cũ)

- Chạy 17:48:00Z (vite ready 511 ms, lock v2 giữ). Pass 1–10 xong
  (~18 tick/pass, 180 blendTick, flip sau pass 5, wallMs 31.917);
  **pass 11 kẹt: không tiến trong 120.000 ms wall-clock**
  (kẹt rAF/renderer), pass-timeout lúc 17:52:31Z.
- Sau timeout, probe ghi partial JSON: writePartial-tickCost
  TIMEOUT sau 30.000 ms (17:53:01Z, giữ tickCost cũ n=218);
  writePartial-blendTick đang chạy dở (elapsed 25 s lúc 17:53:26Z)
  thì **reboot giết toàn bộ tiến trình** (xem §3). Probe không bao
  giờ thoát bình thường; `run-attempt-140.sh` không chạy tới
  check-classb (lớp B không được đánh giá cho attempt này — không
  áp dụng cho partial).
- JSON partial trên đĩa:
  `preview-b-f3-flip-webkit-t4-attempt1.json` 1.275.188 B,
  `partial=true`, `passesDone=10/20`, `partialReason='sau pass'`
  (chuỗi lý do bị cắt cụt do bị giết giữa chừng),
  `blendTickStatus=tickCostStatus=c2DrawLogStatus=timeout`,
  `pageErrs=[]`.
- RAM giữa attempt1 (sampler 2 s, 161 mẫu): min 682 MB, max
  1.181 MB, mean 875,5 MB; 0 mẫu <500 MB (mốc B5 không vi phạm
  nếu tính), 154/161 mẫu <1024 MB.

## 3. Reboot giữa lượt — boot af558fb5 → 90392aa5

- **Reboot xảy ra trong lúc attempt1 đang ghi partial** (sự kiện
  reboot giữa lượt; số hiệu chờ T2/T6 chốt — tiếp sau sự kiện #21
  của đợt 139). Boot mới **90392aa5, btime 17:52:56Z** (kernel
  `/proc/stat`); phát hiện 17:54:22Z (uptime 1 phút, boot_id mới).
- Poller cũ (pid 25124) + probe + vite chết theo reboot; lock
  `vite.lock` không còn; cây preview.tsx md5 vẫn 530e10a7.
- Lệnh exec `sleep 115` của chính T4 cũng bị gián đoạn bởi restart
  dịch vụ cùng thời điểm — cùng một sự kiện, không phải lỗi riêng.
- **Khung chết (quan sát): (17:53:26Z, 17:54:22Z]** — last-seen boot
  cũ là dòng log probe cuối cùng 17:53:26Z (writePartial-blendTick
  elapsed 25 s); first-seen boot mới 17:54:22Z. **F-140-T4-1 (lệ
  đồng hồ):** btime mới 17:52:56Z TRƯỚC last-seen 17:53:26Z 30
  giây — btime kernel và đồng hồ wall quan sát lệch nhau; khung
  chết ghi theo quan sát, btime ghi kèm để T2/T10 đối chiếu. Số
  hiệu boot mới (#97? hay khác) chờ T2.
- Hậu reboot, T5 làm việc trên boot mới: cờ cũ được đổi tên thành
  `POSTBOOT_PASS.stale-af558fb5` (17:55:58Z); `t5-wait-replay-
  boot90392aa5.sh` chạy; replay hệ thống ban đầu đóng băng
  (dpkg=2, installs=0, silent 372 s lúc 18:00:00Z), TRIGGER=YES lúc
  18:04:01Z, rồi `apt-get update` (timeout 1500 s) chạy từ ~18:05Z;
  cờ mới `POSTBOOT_PASS` boot_id=90392aa5 btime 17:52:56Z pass_at
  **18:17:07Z** poll=22; dpkg_lines 795 từ poll #29 trở đi.
- **Poller khởi động lại:** `poll-wait-t4-140b.sh` (bản sao của
  poll-wait-t4-140.sh, chỉ đổi tên + bắt đầu từ attempt2 — attempt1
  đã dùng 1 lượt, còn tối đa 2 lượt chạy attempt2/3 theo quyết (h)),
  chạy từ 17:57:08Z trên boot mới, deadline giữ 19:30Z.

## 4. Poller boot mới — 124 poll, gate 0 xanh nhưng gate A không mở

Poller-b pid 3878, 17:57:08Z–19:29:47Z, 124 poll (tổng đợt: 134 poll).

| Giai đoạn | Poll | Thời gian | RAMavail | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| RAM thừa, gate 0 đỏ | #1–#10 | 17:57:08–18:03:55Z | 2.199 → 1.058 MB (mean ~1.685) | ĐỎ (postboot_exit=1, chưa có cờ T5 mới; libs/GST thiếu, replay chưa xong) | RAM ≥1024: **10/10** — nhưng không chạy được vì gate 0 đỏ |
| RAM rơi, gate 0 đỏ | #11–#28 | 18:04:40–18:17:29Z | 970 → ~500 MB | ĐỎ → XANH ở #29 | apt=1 ở 13 poll (T5 repair `apt-get update`); balloon phồng lại 6.443.824 kB lúc ~18:12Z |
| Gate 0 xanh, RAM kẹt | #29–#124 | 18:18:14–19:29:47Z | min 443, max 832, mean 551,8 MB | **XANH 96/96** (t5 PASS + postboot 0 + apt 0) | RAM ≥1024: **0/96** |

- Toàn boot mới: RAM min 443 MB, max 2.199 MB, mean 656,5 MB,
  median 533 MB; **≥1024 MB: 10/124 — tất cả đều ở poll #1–#10,
  khi gate 0 còn đỏ**. Hai điều kiện (RAM đủ + gate 0 xanh) **không
  bao giờ trùng nhau** trên boot mới.
- Poll xanh đầu tiên: **#29, 18:18:14Z** (RAM 779 MB). Từ đó tới
  hết hạn: load1 0,15–1,08 (0 poll ≥2), load5 <2, lock=khong,
  blockers=0, cây YES, apt=0, dpkg_lines=795 — mọi điều kiện khác
  đều xanh suốt 96 poll; **chỉ RAM chặn cửa**.
- **Balloon — nguyên nhân duy nhất:** đóng băng ở **6.443.824 kB**
  (đúng giá trị đóng băng của #15) gần như suốt boot mới. Hai lần
  xả thoáng qua rồi phồng lại ngay: xuống 6.247.216 kB lúc ~18:33Z
  (RAM lên 730 MB ở poll #49) và RAM lên 756 MB (poll #112),
  832 MB (poll #113, max trong giai đoạn xanh), 818 MB (poll #92)
  — tất cả đều xa dưới 1.024 MB, balloon trở lại 6.443.824 kB ngay
  poll sau. **Xả không bền — lần thứ ba liên tiếp** (đợt 139 đã ghi
  hai đợt liên tiếp; quyết parent đợt 139 (d): điều kiện can thiệp
  host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ;
  GIỮ NGUYÊN gate A ≥1024 MB).
- Poller-b tự đóng đúng hạn: "HET HAN CHO 19:30Z 18/11 — 0 attempt
  (gate A khong mo trong cua so cho)" (sau poll #124, 19:29:47Z;
  kiểm 19:31:22Z: 0 tiến trình poller còn sống). Chữ "0 attempt"
  trong log poller-b nghĩa là 0 attempt TRÊN BOOT MỚI; toàn đợt là
  1 attempt partial (xem §2.1). **KHÔNG gia hạn, KHÔNG chạy attempt
  khi gate chưa mở.**

## 5. Attempt1 partial — chỉ quan sát, KHÔNG verdict

Analyzer chuẩn chạy trên JSON partial (file
`analyze-t4-attempt1-*.txt`), **chỉ để ghi nhận, không tính vào
P1–P7/P3'** (DEF v0.5 §1):

- (c2) = 0 occurrence trong 180 tick (10 pass; cửa sổ post-flip
  chỉ 89 tick sau flip+2000 ms).
- tickCost: total n=218 **median 73,0 ms** (p90 95,0; max 186;
  min 32); hậu flip+2000 ms n=89 **median 69,0 ms** — trên ngưỡng
  60 ms, NHƯNG đây là attempt bị wedged (pass 11 kẹt 120 s, tBlend
  gap median 112 ms, max 2.092 ms) nên median bị phồng bởi stall;
  **không được đọc như một số đo lượt yên #17**, và không dùng để
  bàn lại ngưỡng tickCost.
- `skippedLatest`: xem `analyze-t4-attempt1-skiplatest.txt`
  (partial — không kết luận F6').
- Không chạy histogram P5/P6 và không chạy `analyze-t4-p1p3p7.py`
  trên partial (không có (c2), không có lượt hợp lệ để kiểm).

## 6. Retry theo quyết parent đợt 139 (h) — 0 lượt đã dùng

- Quyết (h): poller retry tối đa 2 lần khi **lỗi setup**.
- Đợt này: **0 lỗi setup** (vite lên 511 ms ở attempt1; không thiếu
  file probe/b.json; không lỗi lock). Attempt1 hỏng do **wedged
  (pass-timeout)** — là partial, không phải lỗi setup — rồi bị
  reboot giết; poller-b trên boot mới không chạy attempt nào vì
  gate A không mở.
- Vòng retry trong poller (`poll-wait-t4-140.sh` /
  `poll-wait-t4-140b.sh`, attempt1→3, phân biệt setup/partial/
  COVERAGE-0) **không được kích hoạt lần nào**. Ngân sách retry
  tối đa 2 lần còn nguyên cho đợt sau. (Ghi chú: nếu attempt2/3
  chạy ở đợt sau và cũng partial do wedged thì vẫn tính vào ngân
  sách 2 retry này theo cùng vòng lặp — không tự tăng.)

## 7. Cộng dồn — KHÔNG ĐỔI

- Không có lượt yên hợp lệ mới: chuỗi 13 lượt hợp lệ đứng nguyên
  (#1–#10, #12–#14, #16; #11 không tồn tại, #15 không đo được,
  **#17 không đo được**).
- P1 32/32, P2 23/23, P3-A1 28/32, P3' 4/4, P7 18/18. Chuỗi median
  tickCost 13 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 ms (trung bình 47,7 ms).
- Ngưỡng tickCost ≤60 ms: KHÔNG BÀN LẠI (không có số đo mới; số
  69,0/73,0 ms của partial attempt1 không phải số đo lượt yên).

## 8. Kiểm chứng script (trước khi chạy)

- `analyze-t4-p1p3p7.py` (bản đã sửa ở đợt 139, sao nguyên sang
  round140-t4): chạy lại trên JSON #16 cho ra file **khớp 100%**
  với `analyze-t4-attempt3-p1p3p7.txt` của T4-139 (diff sạch);
  chạy trên JSON #14 với seq (c2) [145, 265, 327, 368, 389] cho
  P1 5/5 seq (p=0,00055), P3-A1 SAI 3/5 (p=0,0747) — khớp DEF v0.5.
- Poller + run-attempt + inner + check-classb: sao từ đợt 139, chỉ
  đổi tên đợt/deadline/vòng retry; `bash -n` OK cả 3 file.
- Histogram `t4-histogram-with17.py`: đã chuẩn bị (đổi RUNS sang
  attempt3/round140-t4, nhãn #17) nhưng **chưa chạy** (không có
  JSON lượt hợp lệ).

## 9. Sai số (F-140-T4-n)

- **F-140-T4-1 (lệ đồng hồ — reboot):** btime boot mới 17:52:56Z
  TRƯỚC last-seen log boot cũ 17:53:26Z 30 giây (xem §3). Khung
  chết ghi theo quan sát (17:53:26Z, 17:54:22Z]; btime ghi kèm để
  T2/T10 đối chiếu; không tự chọn một mốc làm chuẩn.
- **F-140-T4-2 (vá script hỏng lần đầu — không ảnh hưởng dữ liệu):**
  lần vá `poll-wait-t4-140.sh` đầu tiên bằng chuỗi khớp toàn khối
  thất bại (AssertionError, file không bị ghi); làm lại bằng vá theo
  dòng + khối retry mới, rồi kiểm `bash -n` OK và grep xác nhận
  deadline 19:30Z + ATT bắt đầu đúng trước khi chạy poller.

## 10. Câu hỏi mở cho parent / T10 (ghi vào LIMITS gộp)

(a) **Lượt yên #17 đo lại ở đợt 141?** (T4 đề xuất: giữ nguyên kế
hoạch, đo lại ở đợt sau trên boot 90392aa5 nếu còn sống.)
(b) **Gate A / balloon:** đây là đợt thứ ba liên tiếp balloon xả
không bền (đợt 138: 0 attempt; đợt 139: đo được nhờ xả thoáng qua
trước poll #1; đợt 140: 1 partial rồi kẹt). Quyết parent đợt 139
(d) đã ghi "không có kênh can thiệp host từ cell" — có kênh nào
khác (nhờ user can thiệp host, hay đổi cách đo) hay vẫn tiếp tục
chờ xả tự nhiên?
(c) **Số hiệu boot mới 90392aa5 + khung chết reboot 17:52:56Z/**
(17:53:26Z, 17:54:22Z] — chờ T2 chứng nhận (F-140-T4-1).
(d) **Attempt1 partial có đếm vào "số attempt đã dùng" cho ngân
sách retry đợt sau không?** T4 đã tính: attempt1 = 1 lượt chạy,
retry còn 2 — nhưng retry ở đợt sau bắt đầu lại từ attempt1 mới
hay tiếp tục attempt2/3? (Đề xuất: mỗi đợt tính lại từ đầu; ngân
sách 2 retry áp dụng trong một lượt poller.)
(e) **TickCost median 69,0/73,0 ms của partial attempt1** — ghi rõ
chỉ là quan sát, không bàn ngưỡng; parent có đồng ý không dùng số
này cho bất kỳ quyết định ngưỡng nào?

## 11. Nợ mở cho đợt 141

- Lượt yên #17 chưa đo (đo lại; P1–P7 + P3' chưa kiểm).
- Balloon đóng băng 6.443.824 kB — chờ xả hoặc quyết parent (xem
  §10(b)).
- Khung chết reboot + số hiệu boot 90392aa5 chờ T2 chứng nhận
  (F-140-T4-1).
- T5 đã viết cờ mới cho boot 90392aa5 (pass_at 18:17:07Z) — nếu
  boot này còn sống sang đợt 141 thì gate 0 có thể xanh ngay.
- ci-security.yml vẫn 403 (nợ chung, không thuộc T4).

## 12. File stage + cờ

- LIMITS này: `docs/PHASE9_ROUND140_T4_WEBKIT_QUIET17_LIMITS.md`
  (18.619 B — dưới ngưỡng oversize 37.768 B).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round140-t4-quiet17.txt`
  (1 entry NUL-delimited — chỉ LIMITS; verify `od`).
- Cờ: `hidden_files/round140-t4.done` (tạo lúc đóng, 19:35Z).
- KHÔNG PUSH. KHÔNG release/tag. Không sửa preview.tsx.

## Phụ lục — file làm việc trong round140-t4/

- `poll-wait-t4-140.sh` (poller boot cũ, deadline 19:30Z, vòng
  retry attempt1→3) + `poll-wait-t4-140b.sh` (poller boot mới, bắt
  đầu attempt2); `run-attempt-140.sh`; `t4-attempt-inner.sh`;
  `check-classb-t4.sh`; `analyze-t4-*.py` (10 script, sao từ 139);
  `t4-histogram-with17.py` (đã chuẩn bị, chưa chạy);
  `probe121t3-ghost-k7.webkit.mjs`; `b.json`;
  `vite.t4-temp.config.mjs`; `tree-md5.txt` (530e10a7).
- Log: `poll-t4.log` (134 poll + reboot note), `chain-t4.log`,
  `poll-t4.nohup.log`, `poll-t4b.nohup.log`,
  `postboot-t4-140-gate0wait-{1,5,9}.log`,
  `blockers-ps-2.txt` + `blockers-list-2.txt` (false positive T6).
- Attempt1: JSON partial 1.275.188 B + `run-webkit-t4-attempt1.log`,
  `vite-5187-t4-attempt1.log`, `load-mid-t4-attempt1.log` (161 mẫu),
  `ps-before-t4-attempt1.txt`, `marker-t4-attempt1`,
  `analyze-t4-attempt1-{c2drawlog,labellag,skiplatest,lag5,
  tickcost,wallbands,perpass}.txt`.

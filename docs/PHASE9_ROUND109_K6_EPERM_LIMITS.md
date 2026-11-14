# PHASE9 ROUND109 K6 — EPERM: probe #28 + khoảng mù #27 ĐÓNG HOÀN TOÀN

> Luồng K6, đợt 109 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07,
> 14/11/2026; làm việc 23:40Z 13/11 → 00:0xZ 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù
> #27 kể từ probe #27 (20:40:28Z 13/11) + quét sóng EPERM + quét
> writeFileSync lần thứ 15 + ghi RAM (birefnet: KHÔNG chạy — vẫn dưới
> ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #26, mù #24, mù #21, hay
> reboot #16** — chỉ báo cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 23:40:43Z
  báo **DEAD/STALE** (heartbeat age 10.815 s, last #27 20:40:28Z,
  boot cc460738, exit 1); `once` ngay sau đó là
  **probe #28, boot ab33c58f (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 0 s, n=28), exit 0. Log v2 tăng đúng 3
  dòng (73 → 76); heartbeat nay n=28, ts 23:40:43Z, boot ab33c58f.
- **Reboot #36 = 22:53:56Z — XÁC NHẬN ĐỘC LẬP bằng 2 phép đo
  `uptime -s` trực tiếp** (23:40:22Z và 23:40:43Z, giống nhau từng
  giây) + journal/wtmp/who + J9 verify + J7 attempt-2 cùng boot
  ab33c58f. Gap #35 → #36 = **1h11'15" — NẰM TRONG dải chứng nhận**,
  dải KHÔNG bị vượt thêm lần nào.
- **Reboot #35 = 21:42:41Z — XÁC NHẬN bằng 2 phép đo `uptime -s`
  ĐỘC LẬP trên boot 26cbdc1e** (J3 R2 lúc 21:45:44Z; J7 wait-j3 lúc
  21:50:13Z; cả hai ghi đúng 21:42:41). Gap #34 → #35 = **1h08'24"
  — NẰM TRONG dải chứng nhận.**
- **Khoảng mù #27: 20:40:28Z → 23:40:43Z (3h00'15") — ĐÓNG HOÀN
  TOÀN (mới, lượt này — mù đầu tiên đóng hoàn toàn kể từ mù #25,
  cắt chuỗi 2 mù liên tiếp không đóng được #24, #26).** Đúng 2
  reboot trong mù (#35, #36), cả hai chốt giờ chính xác từng giây;
  mọi đoạn của mù đều được đóng bằng loại trừ trực tiếp (poller
  60 s), chốt `uptime -s`, hoặc đo uptime trực tiếp — xem §2.3.
  **Số thứ tự #35/#36 vẫn là TẠM THỜI** (kế thừa tính tạm thời từ
  mù #26/#24 chưa đóng — xem §2.2).
- **Lỗ mtime 53'48" (21:56:26Z → 22:50:14Z) là ẢO — bài học phương
  pháp quan trọng (mới, lượt này, xem §2.3 + §4 mục 1):** mtime
  của file log append chỉ ghi lần ghi CUỐI; nội dung wait-j3.log
  chứng minh poller đã ghi đều mỗi 60 s suốt lỗ đó (61 mục, max
  gap 61 s). Đếm mtime mà không đọc nội dung sẽ kết luận sai là
  "không có observer". J8 §4 mục 4 đã cảnh báo đúng hướng này;
  lượt này gặp trường hợp thật đầu tiên mà mtime và nội dung
  mâu thuẫn nhau 53'48".
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 123 file *.log có mtime trong mù #27 (0 file repo-1, 123
  file hidden_files); 10 dòng "sóng EPERM đã tắt" đều là **dương
  tính giả đã biết** (dòng launcher). Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — **59h29'43"** trước probe #28. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 557 dòng / 170 file** (phạm vi
  2765 file); R7b đối chiếu 582 dòng / 187 file; copies 25 dòng /
  17 file; đối chiếu chéo 557+25=582=R7b, **chênh 0 — lần thứ mười
  lăm liên tiếp**. +17 dòng / +4 file so với J8, giải thích đúng
  hết bằng diff. Async `.writeFile(`: vẫn đúng **2 vị trí, cả hai
  trong helper retry đã biết** — 0 stray.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (không bị
  vượt thêm): 2 gap mới đều nằm trong dải và đều là gap đơn đã
  chứng nhận → tập gap đơn đã chứng nhận tăng n=19 → **n=21**
  (min/max không đổi; trung vị 1h58'47", trung bình 1h51'38",
  p10–p90 1h08'24"–3h01'21"). Toàn chuỗi n=30: trung bình
  2h03'04", trung vị 1h59'16" — xem §2.5.
- RAM: max biết được trong mù #27 là **2.850 MB** (J4, 20:43:47Z)
  = 46% ngưỡng guard. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user
  quyết); cron riêng 10 phút vẫn chờ user quyết. **Chưa có reboot
  #37 tới 00:02:03Z 14/11** (boot ab33c58f, up 1:08).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 23:40:22Z + 23:40:43Z | boot_id `ab33c58f-e171-4c96-8dfc-eb9000cc6dab`; `who -b` Nov 13 22:54; `uptime -s` **2026-11-13 22:53:56Z** (2 lần, giống nhau từng giây); journal chỉ 1 boot (ab33c58f, first entry 22:54:09Z, last 23:40:33Z lúc kiểm tra); `last -x reboot` 22:54 still running; wtmp bắt đầu 22:54:08Z |
| `bash scripts/probe-eperm-v2.sh status` | 23:40:43Z | **DEAD/STALE**, exit 1 — heartbeat n=27, ts 20:40:28Z, boot cc460738, age **10.815 s** (đúng 3h00'15"); last sample probe #27; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 23:40:43Z | **probe #28, boot=ab33c58f, ok=2 fail=0**, exit 0; dòng `boot changed cc460738 -> ab33c58f` (uptime since 2026-11-13 22:53:56) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 23:40:43Z | **ALIVE**, age 0 s, n=28, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 76 dòng, trước lượt 73 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=28, ts
23:40:43Z, pid=13175, boot ab33c58f-…).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
(od: `x \n`) — không phải checklist P8 §2.3, như I7/J8 đã đính chính.

## 2. Điều tra khoảng mù #27 (20:40:28Z → 23:40:43Z, 3h00'15")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #28: `uptime -s` = **2026-11-13 22:53:56Z**,
  boot_id `ab33c58f-e171-4c96-8dfc-eb9000cc6dab` — khác boot của
  probe #27 (cc460738).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, ab33c58f,
  first entry 22:54:09Z, last 23:40:33Z). `last -x reboot`: chỉ 1
  dòng (22:54, still running). wtmp bắt đầu 22:54:08Z.
  Journal/wtmp của boot 26cbdc1e đã mất theo reboot #36 — như mọi
  lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Hai reboot đã chốt trong mù — #35 (21:42:41Z) và #36 (22:53:56Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 35 | **21:42:41Z (chính xác từng giây)** | cc460738 → 26cbdc1e | **2 phép đo `uptime -s` độc lập trên boot mới:** J3 R2 start 21:45:44Z (`uptime_s=2026-11-13 21:42:41`, driver-j3.log dòng 800) + J7 wait-j3 start 21:50:13Z (`uptime-s=2026-11-13 21:42:41`, wait-j3.log dòng 1) — cả hai cùng boot 26cbdc1e, cùng giây. Kẹp thêm: J7 run21 G4-probe cuối trên boot cũ 21:42:40.391Z (1 s trước reboot) + tiến trình cũ ghi tiếp tới 21:43:09.892Z (xem §2.3). **Số thứ tự TẠM THỜI** (xem dưới). |
| 36 | **22:53:56Z (chính xác từng giây)** | 26cbdc1e → ab33c58f | K6 đo trực tiếp 2 lần lúc 23:40:22Z và 23:40:43Z (`uptime -s` + `boot_id` + `who -b` + journal first entry 22:54:09Z); dòng `boot changed … (uptime since 2026-11-13 22:53:56)` trong log probe v2; J9 verify start 22:56:12Z + J7 run22 attempt-2 start 22:56:53Z cùng boot ab33c58f, cùng `uptime-s=2026-11-13 22:53:56`. **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #34 → #35 = **1h08'24"**; gap #35 → #36 = **1h11'15"** —
cả hai **nằm trong dải chứng nhận [19'07", 3h14'08"]** và đều là
**gap đơn đã chứng nhận** (mù #27 đóng hoàn toàn, xem §2.3) —
dải KHÔNG bị vượt thêm lần nào (xem §2.5).

**Tính tạm thời của số thứ tự (ghi rõ, không giấu):** #35/#36
đúng giờ nhưng số thứ tự kế thừa tính tạm thời từ mù #26 và mù
#24 chưa đóng hoàn toàn (J8 §2.3, §5 mục 1–2): nếu lỗ mù #26 chứa
k reboot ẩn thì "reboot #35" thực tế là #(35+k), "reboot #36" là
#(36+k). **Giá trị gap không phụ thuộc số thứ tự** — chỉ phụ thuộc
giờ đã chốt — nên 2 gap mới vẫn được tính vào tập gap đơn đã chứng
nhận (n=21) bất kể số thứ tự có dịch chuyển sau này hay không.

**Đính chính tiền đề lượt này (ghi để parent sửa hồ sơ):**
tiền đề ghi "đồng hồ boot cũ chạy nhanh ~25–29s" — **cách diễn đạt
này chưa chính xác; hiện tượng thật là TIẾN TRÌNH CŨ SỐNG SÓT
~29 s sau reboot** (xem §2.3): log run21 của J7 (boot cc460738)
ghi tiếp tới **21:43:09.892Z, tức 28,9 s SAU reboot #35
(21:42:41Z)** — cell restart chỉ dọn tiến trình cũ ~30 s sau boot
mới (parent đã ghi nhận dị thường này ở closing đợt 108). Không
có bằng chứng đồng hồ chạy nhanh: đồng hồ boot mới khớp UTC
(`uptime -s` 22:53:56Z vs journal first entry 22:54:09Z = trễ
khởi động journald 13 s, bình thường; wtmp 22:54:08Z; `who -b`
22:54). **Hệ quả phương pháp: chốt giờ reboot bằng `uptime -s`
trên boot mới (đo 2 lần), KHÔNG BAO GIỜ dùng mtime file cuối của
boot cũ** — mtime đó có thể vượt quá giờ reboot thật tới ~29 s.

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **18 file**
(không tính dist/node_modules) + hidden_files **479 file** (không
tính chrome-userdata); 492 mốc giây phân biệt trong cửa sổ. Nhưng
**con số mtime không phải bằng chứng đóng mù — nội dung log
append mới là bằng chứng** (xem lỗ ảo dưới đây). Chia mù làm ba
đoạn bởi #35 (21:42:41Z) và #36 (22:53:56Z):

- **Đoạn A: 20:40:28Z → 21:42:41Z (1h02'13", boot cc460738) —
  ĐÓNG bằng loại trừ trực tiếp:**
  - **Poller J7 là kẹp trực tiếp:** poll mỗi ~60 s, tất cả cùng
    boot cc460738, uptime-s 20:34:17Z: 20:42:38 → 21:16:40Z
    (**35 mục, max gap 61 s, 0 gap > 70 s** — tính lại từ nội dung
    poll-j7.log, không phải mtime). Một reboot ẩn trong đoạn này
    phải giết poller — không, nó poll đều suốt 34'.
  - Đầu đoạn: probe #27 (20:40:28Z) + file hạ cánh 20:40:45Z
    (probe108j4), 20:41:58Z, 20:43:23Z + poller bắt đầu 20:42:38Z
    — không có khoảng trống nào > 2'10" từ đầu mù tới poll đầu.
  - Đuôi đoạn (sau poller dừng 21:16:40Z): driver J7 chạy
    21:16:40–21:35:22Z (run18/19/20), prereg-j7-retry.md 21:38Z,
    run-j7-retry.log 21:40Z, run21 G4-probe **21:42:40.391Z** (boot
    cũ, 1 s trước #35) + J3 R0 21:17:00–21:26:10Z, R1
    21:26:14–21:33:06Z. Max gap nội dung trong đuôi đoạn ~2–3'.
  - **Tiến trình cũ sau #35:** log run21 ghi tiếp tới
    21:43:09.892Z (28,9 s sau #35) — đây là dư âm boot cũ, KHÔNG
    phải bằng chứng boot mới; giờ #35 được chốt bằng 2 phép đo
    `uptime -s` độc lập (§2.2), không dùng các dòng này.
- **Đoạn B: 21:42:41Z → 22:53:56Z (1h11'15", boot 26cbdc1e) —
  ĐÓNG bằng loại trừ trực tiếp + chốt `uptime -s`:**
  - **Chốt đầu đoạn bằng phép đo, không bằng hoạt động:** J3 R2
    start 21:45:44Z ghi `uptime_s=2026-11-13 21:42:41` trên boot
    26cbdc1e. Một reboot ẩn bất kỳ trong [21:42:41Z, 21:45:44Z]
    đều làm `uptime -s` lúc 21:45:44Z đọc ra giờ khác — nó đọc
    đúng 21:42:41Z, nên không có reboot nào trong 3'03" đó. Đoạn
    con 21:43:10Z → 21:45:44Z (2'34", chỉ có dư âm boot cũ + im
    lặng) được đóng bằng chính phép đo này.
  - **Waiter J7 là kẹp trực tiếp cho phần lớn đoạn B:**
    wait-j3.log, poll mỗi ~60 s, tất cả cùng boot 26cbdc1e,
    `uptime-s=2026-11-13 21:42:41`: 21:50:13 → 22:50:14Z
    (**61 mục, max gap 61 s, 0 gap > 70 s** — tính lại từ nội
    dung). Một reboot ẩn trong đoạn này phải giết waiter — không,
    nó poll đều suốt 60'.
  - Giữa R2/R3 của J3 (21:45:44–21:51:23Z) và waiter bắt đầu
    (21:50:13Z) chồng lấn nhau; không có khoảng trống nội dung
    nào > 2'34" trong toàn đoạn B.
  - **LỖ MTIME ẢO 53'48" (21:56:26Z → 22:50:14Z) — KHÔNG PHẢI LỖ
    THẬT:** đếm mtime file trong hai cây cho thấy 0 file có mtime
    trong khoảng này — nhưng đó là vì **mtime của file log append
    chỉ ghi lần ghi CUỐI CÙNG**: wait-j3.log được append mỗi 60 s
    suốt khoảng đó nhưng mtime của nó chỉ là 22:50:14Z (lần ghi
    cuối). Nội dung file (61 mục có timestamp, max gap 61 s) lấp
    đầy hoàn toàn khoảng này. Đây là trường hợp thật đầu tiên mà
    đếm mtime và đọc nội dung mâu thuẫn nhau tới 53'48" — bài học
    I7 §4 mục 1 / J8 §4 mục 4 được chứng minh bằng dữ liệu mới.
  - Ngoài hai cây, toàn ~/workspace chỉ có **3 file** có mtime
    trong khoảng 21:56:26–22:50:14Z (đếm lại 2 lần, có lưu file):
    `repo-1-push/paths-loop/phase9-round108-j3-zombie.txt`
    21:56:47Z (batch stage của J3) + 2 exec-log runtime
    (`agents/15552276-…/exec-logs/proc_b7694cf2e444.log`
    22:11:54Z, `proc_351871263b6d.log` 22:32:25Z). Cả 3 đều là ghi
    đơn lẻ của job ngắn (theo chuẩn H7 §4 mục 2, không dùng làm
    bằng chứng loại trừ) — nhưng cũng không cần tới chúng: waiter
    đã đóng đoạn này. **Ghi rõ dị thường đếm:** một lần đếm trung
    gian (không lưu file) in ra 27 — hai lần đếm có lưu file sau
    đó đều ra 3 (2 file agents + 1 file repo-1-push, kiểm lại
    từng cây riêng cũng ra 2+1=3). Số 27 không có danh sách lưu
    kèm nên không kiểm chứng được; chênh lệch không ảnh hưởng kết
    luận (lỗ đã đóng bằng nội dung waiter), ghi lại đây để parent
    biết có một lần đếm không khớp.
  - Đuôi đoạn (sau waiter timeout 22:50:14Z): prereg-j7-resume2.md
    22:52Z + J7 run22 attempt-1 start **22:53:04Z** (boot
    26cbdc1e, `uptime-s=2026-11-13 21:42:41`, ram-avail 973MB) —
    driver sống tới 52 s trước #36 rồi chết theo reboot. Max gap
    nội dung trong đuôi đoạn 2'50" (22:50:14 → 22:53:04Z).
- **Đoạn C: 22:53:56Z → 23:40:43Z (46'47", boot ab33c58f) — ĐÓNG
  bằng đo uptime trực tiếp:** `uptime -s` = 22:53:56Z đo lúc
  23:40:43Z chứng minh máy up liên tục từ 22:53:56Z; cộng thêm J9
  verify 22:56:12–23:03:23Z + O8 23:05:53–23:18:20Z + LIMITS
  23:25:41Z/23:26:04Z/23:30:29Z + spawn đợt 109 23:35:51Z, tất cả
  trên boot ab33c58f. Lỗ mtime 10'00" (23:30:29 → 23:40:26Z) là
  không đáng kể — uptime đã chứng minh tính liên tục, không cần
  hoạt động lấp.

**Kết luận trung thực: khoảng mù #27 ĐÓNG HOÀN TOÀN.** Đúng 2
reboot trong mù (#35 21:42:41Z, #36 22:53:56Z), cả hai chốt giờ
chính xác từng giây bằng ≥2 phép đo độc lập; không đoạn nào của
mù thiếu observer (poller 60 s / waiter 60 s / chốt uptime-s / đo
uptime trực tiếp). Đây là mù đầu tiên đóng hoàn toàn kể từ mù #25
— cắt chuỗi #24, #26 không đóng được. **Điều kiện duy nhất còn
lại là số thứ tự:** giờ đã chốt, nhưng số #35/#36 là tạm thời cho
tới khi parent/user quyết về mù #26/#24 (xem §2.2). K6 không tự
quyết thêm.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 108 + spawn đợt 109

Khoảng mù 20:40:28Z → 23:40:43Z (3h00'15") được phủ bởi các luồng
sibling đợt 108 (J1–J9, làm việc tới ~23:30Z) + spawn đợt 109
(23:35:51Z). Đã đọc lại log thật (grep `sóng EPERM vẫn bật` /
`CẢNH BÁO` / `Operation not permitted` / `sóng EPERM đã tắt` trên
123 file *.log có mtime trong mù #27 — 0 file repo-1, 123 file
hidden_files, trừ chrome-userdata):

| Nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| driver108j4.log + driver108j5.log + driver-j3.log | 20:46–21:12Z | 7 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| round108-j9-o8.log | 23:05–23:17Z | 3 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| Toàn bộ 123 log | toàn mù | "vẫn bật" 0 hit; "CẢNH BÁO" 0 hit; "Operation not permitted" 0 hit thật |

Tổng trong *.log có mtime trong mù #27: **10 dòng "đã tắt"**
(đều mẫu launcher) + **0 dòng "vẫn bật", 0 "CẢNH BÁO", 0
"Operation not permitted" thật**.

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4):** cả 10 dòng đều là dòng launcher "sóng EPERM đã tắt,
khởi động vite" in khi lần ghi thử ĐẦU TIÊN thành công ngay (code
launcher `waveOff=true` ở lần write đầu) — in mặc định cả khi
không có sóng. Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn bật
sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"**
trong toàn bộ 123 log; **0 lần "Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — và lần này, khác mù #26, **không có lỗ quan sát
  nào về reboot** (mù đóng hoàn toàn, §2.3). Về sóng thì vẫn có
  một hạn chế nhỏ hơn: không có lần khởi động vite nào trong
  21:51–22:53Z (62'), nên một sóng ngắn trong khoảng đó không có
  nhân chứng vite nào — nhưng có 3 lần ghi thành công rải đều
  trong khoảng đó (21:56:47Z, 22:11:54Z, 22:32:25Z), nên một sóng
  dài ~16' kiểu R7 chỉ có thể lọt vào khe 20'35" giữa 2 lần ghi
  (22:11:54 → 22:32:25Z) mà không để lại dấu — khả năng thấp,
  không loại trừ tuyệt đối được. Ngoài khe đó, vite khởi động
  thành công ngay ở 20:46–21:12Z (7 lần), 21:17Z, 21:26Z, 21:45Z,
  21:48Z, 22:53Z, 22:56Z, 23:05–23:17Z (3 lần).
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **59h29'43"** trước
  probe #28 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #28 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 23:40:43Z ghi được.

### 2.5 Phân phối gap cập nhật — dải chứng nhận CÒN DÙNG ĐƯỢC

Hai gap mới (#34 → #35 = 1h08'24", #35 → #36 = 1h11'15") đều là
gap đơn đã chứng nhận và đều nằm trong dải [19'07", 3h14'08"] —
**dải KHÔNG bị vượt thêm lần nào.** Tính lại từ bảng J8 §2.5.3 +
2 gap mới (kiểm tra chéo: tính lại n=28 cũ ra trung bình 2h06'53"
vs J8 2h06'54", trung vị 1h59'50" vs 1h59'48", p10 44'54" vs
44,9', p90 3h07'53" vs 3h07'54" — chênh ≤2 s do làm tròn điểm
giữa các gap approx; bảng gốc chép đúng):

| Thống kê | Toàn bộ n=30 | Chỉ gap đơn đã chứng nhận n=21 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 2h03'04" | 1h51'38" |
| Trung vị | 1h59'16" | 1h58'47" |
| Độ lệch chuẩn (mẫu) | 65,8' (CV 0,54) | — |
| p10 | 48'18" | 1h08'24" (= gap #34 → #35 mới) |
| p90 | 3h06'06" | 3h01'21" |

Đọc thêm: 16/30 gap (53%) nằm trong 90'–150'; 4 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=21)** — min/max không đổi sau khi thêm 2 gap mới.
Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần bởi các gap chưa
chứng nhận (#11 → #12 4h10'33", #33 → #34 5h43'18") — nó là phát
biểu về các gap đơn đã biết, không phải bảo đảm. **Không đưa dự
báo điểm cho #37** — chỉ dải cơ học áp lên #36 (22:53:56Z):
**[23:13:03Z, 02:08:04Z 14/11]**; p10–p90 toàn chuỗi →
[23:42'Z, 02:00'Z]. **Chưa có #37 tới 00:02:03Z 14/11** (boot
ab33c58f, up 1:08).

### 2.6 Quét writeFileSync (snapshot 23:50:49–23:56:41Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round109-k6`. Tính lại từ file wfs-*.txt + files-*.bin gốc, khớp
100% scan-meta.txt. **Lưu ý thời gian:** scan mất 5'52" (J8 chỉ
44 s) vì máy đang chịu tải 9 luồng đợt 109 song song (load 5–17)
— không phải lỗi script; số đếm kiểm lại sau scan vẫn khớp.

- Chuẩn mới: **557 dòng / 170 file** (phạm vi 2765 file).
  J8: 540 dòng / 166 file (phạm vi 2752 file).
- R7b (đối chiếu): **582 dòng / 187 file**. J8: 565 / 183.
- Copies: **25 dòng / 17 file** — y hệt J8, I7, H7, G8 và F7.
- Đối chiếu chéo 557+25=582=R7b, **chênh 0 — lần thứ mười lăm
  liên tiếp**. Tổng hit trên cả 3 bảng: 557+582+25 = **1.164 dòng**.
- **+17 dòng / +4 file so với J8, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ ngoài
  GAP_ANALYSIS, không file nào giảm):
  - +1 `PHASE9_GAP_ANALYSIS.md` (17 → 18 — mục tóm tắt đợt 108
    mới thêm, 23:26:04Z)
  - +6 `apps/web/scripts/probe109k3-frame-parity.mjs` (K3 đợt 109
    — file mới, sibling đang chạy)
  - +5 `apps/web/scripts/probe109k4-frame-parity.mjs` (K4 đợt 109
    — file mới, sibling đang chạy)
  - +4 `docs/PHASE9_ROUND108_J8_EPERM_LIMITS.md` (file LIMITS của
    chính J8 — 20:52:47Z, sau snapshot J8 20:46:04Z)
  - +1 `docs/PHASE9_ROUND108_LIMITS.md` (closing đợt 108,
    23:25:41Z)
  - Tổng: 1+6+5+4+1 = **17** ✓, 4 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets)
- **0 file biến mất khỏi hit list** (chỉ GAP_ANALYSIS đổi số đếm
  17 → 18).
- Scope: **+14 file mới / −1 file** so với J8 (2765 = 2752+14−1
  ✓): 14 file mới = 4 file hit trên + 10 file không hit
  (`benchmarks/render/j2_offsets_108.py`,
  `benchmarks/render/webkit_blob_flaky_109k2_2mib.mjs` + 8 LIMITS
  đợt 108 J1/J2/J3/J4/J5/J6/J7/J9); 1 file biến mất khỏi scope là
  `apps/web/vite.config.j6-temp.ts` — file tạm của J6 (cùng mẫu
  i1-temp trước đây: file tạm biến mất ở lượt sau, như J8 đã dự
  báo). Comm hai chiều khớp đúng.
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt J8 — xem files-copies.txt).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 109 vẫn đang chạy; 2 file probe109k3/k4 đã hạ cánh trước
  khi scan bắt đầu (xem mtime trong blind27-repo.txt: K3/K4 là
  file mới của đợt 109 — đếm lại trực tiếp sau scan: K3 đúng 6
  dòng, K4 đúng 5 dòng `writeFileSync`, khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 109 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.7 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2765 file), NUL-safe, chạy từ trong repo-1 — 37 file chứa mẫu,
trong đó 35 file `.md` đều là trích dẫn trong LIMITS cũ;
**chỉ đúng 2 hit trong code**:

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như J8: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable của lượt: **444.972 kB (23:40:22Z, trước
status — lúc spawn đợt 109 đang burst, thấp nhất lượt) /
617.964 / 617.220 / 617.448 / 617.300 kB (23:40:43Z, quanh probe
#28)** — ~0,43 / 0,60 / 0,60 / 0,60 / 0,60 GB. Mức này bằng
**~10% ngưỡng guard 6144 MB** — thấp vì 9 luồng đợt 109 vừa
spawn, tải cao (load 5–17 lúc quét). Max RAM biết được trong mù
#27 là **2.850 MB** (J4 chr-blur-r44c0 exit, 20:43:47Z, boot
cc460738, lúc tải còn thấp đầu đợt 108) = **46% ngưỡng guard**;
các mẫu cao khác trong mù: 2.809 MB (J5, 21:04:39Z), 2.790 MB
(J5, 20:58:05Z), 2.305 MB (J3 R2, 21:48:28Z), 2.212 MB (J3 R3,
21:48:29Z); không mẫu nào trong mù #27 tiến gần ngưỡng.
Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử
lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử
lại). Birefnet-general vẫn **0 lần chạy thành công** trong gói.
Lúc 00:02:03Z 14/11, MemAvailable đã hồi lên 1.573.124 kB
(1,54 GB) khi tải đợt 109 hạ.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Mtime của file log append CHỈ GHI LẦN GHI CUỐI — đếm mtime
   mà không đọc nội dung sẽ kết luận sai là "lỗ"** (mới, lượt
   này — xem §2.3): lỗ mtime 53'48" (21:56:26 → 22:50:14Z) được
   lấp đầy hoàn toàn bằng nội dung wait-j3.log (61 mục, max gap
   61 s). **Quy tắc mới: mọi kết luận "lỗ không-bản-ghi" phải đối
   chiếu NỘI DUNG các file log append có mtime chạm biên lỗ, trước
   khi tuyên bố lỗ.** Bài học I7 §4 mục 1 / J8 §4 mục 4 đã nói
   đúng hướng này nhưng chưa có trường hợp mtime–nội dung mâu
   thuẫn lớn tới 53'48" — từ nay lỗ mtime > 2 × sàn mà có file
   log append chạm biên thì PHẢI đọc nội dung file đó.
2. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
   KHÔNG dùng mtime file cuối của boot cũ** (mới, lượt này — xem
   §2.2): tiến trình boot cũ sống sót tới **28,9 s sau reboot**
   (run21 ghi tới 21:43:09.892Z sau #35 21:42:41Z); mtime file
   cuối của boot cũ có thể vượt quá giờ reboot thật tới ~29 s.
   Tiền đề lượt này diễn đạt hiện tượng này là "đồng hồ boot cũ
   chạy nhanh ~25–29s" — **đính chính: không phải đồng hồ chạy
   nhanh, mà là tiến trình cũ chưa bị dọn** (đồng hồ boot mới khớp
   UTC, xem §2.2).
3. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
   reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
   bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
   thức nằm trong các file LIMITS EPERM theo đợt.
4. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
   lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
   đã chứng nhận (n=21) sau lượt này; trên toàn chuỗi vẫn có 2
   gap vượt (đều là cận trên).
5. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
   lượt này (2 gap mới 1h08'24" và 1h11'15" đều >> sàn), nhưng mù
   #27 đóng được là nhờ poller/waiter + chốt uptime, không nhờ
   sàn.
6. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
   poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ mtime ảo
   21:56:26–22:50:14Z, toàn ~/workspace ngoài hai cây chỉ có 3
   file (1 batch stage + 2 exec-log runtime) — write đơn lẻ của
   job ngắn, không dùng làm bằng chứng loại trừ; waiter mới là
   bằng chứng.
7. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
   4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
   vị trí đã biết trước khi kết luận.
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 10 dòng "đã tắt" trong mù #27
   đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
   "Operation not permitted" thật.
9. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9):
   lượt này probe + quét xong là ghi LIMITS/batch ngay, không đợi
   luồng khác — reboot #37 có thể cắt ngang bất cứ lúc nào (dải
   cơ học mở tới 02:08:04Z 14/11).
10. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 123 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
11. **Scan writeFileSync chậm bất thường khi máy tải nặng** (mới,
    lượt này): scan mất 5'52" (J8: 44 s) dưới tải 9 luồng đợt 109
    (load 5–17). Số đếm không hỏng (đếm lại sau scan khớp), nhưng
    các lượt sau nên chạy scan lúc tải thấp hơn nếu có thể, và ghi
    rõ thời gian scan khi nó lệch nhiều khỏi chuẩn ~1'.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #27 ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   đúng 2 reboot (#35 21:42:41Z, #36 22:53:56Z), cả hai chốt giờ
   chính xác từng giây; mọi đoạn đóng bằng loại trừ trực tiếp /
   chốt uptime-s / đo uptime trực tiếp. **Số thứ tự #35/#36 vẫn
   TẠM THỜI** (kế thừa tính tạm thời từ mù #26/#24) — parent/user
   quyết về mù #26/#24 sẽ quyết luôn số thứ tự này. K6 không tự
   quyết.
2. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
   — không xác định được; số thứ tự #34 là TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết xem có chấp
   nhận "ít nhất 1 reboot, có thể nhiều hơn" làm mức đóng của mù
   #26 hay để mở như mù #24. K6 không tự quyết. Probe #28 không
   đóng được mù #26 hồi tố.
3. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33/#34/#35/#36 là TẠM
   THỜI. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. K6 không tự quyết.
4. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. K6 không tự quyết.
5. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn 19'07". K6 không thử
   lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có
   điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận I7). **Khoảng mù #27 nay ĐÓNG HOÀN TOÀN**
   (mới, lượt này).
6. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5 mục
   5): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). K6 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới: mù #27 đóng được LÀ NHỜ các
   poller/waiter của sibling đợt 108 chạy xuyên suốt — không có
   observer thường trực thì các mù vẫn có thể mở; nhưng cũng cần
   ghi nhận: đợt 108 tự nó đã có đủ observer để đóng mù #27 mà
   không cần cron riêng.
7. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6):
   không đưa dự báo điểm cho #37 hay reboot nào sau đó; thay bằng
   dải chứng nhận [19'07", 3h14'08"] + p10–p90 thực nghiệm + đo
   uptime trực tiếp + poller. Dải cơ học cho #37:
   [23:13:03Z, 02:08:04Z 14/11] — là phép áp dải máy móc, không
   phải dự báo.
8. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; log tăng đúng 3 dòng checklist, 73 → 76 —
   không thêm dòng lạ mới trong lượt này.)
9. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
10. **VM reboot ~1 lần / 2h04'19"** (36 lần / 74h35'46" từ ~20:18:10Z
    10/11 tới 22:53:56Z 13/11, số thứ tự tạm thời — xem §2.2 +
    §2.5): mọi probe nền đều chết theo reboot; v2 chỉ đảm bảo cái
    chết được ghi nhận + lượt sau hồi phục bằng 1 mẫu mới. Reboot
    #37 chỉ có dải cơ học [23:13:03Z, 02:08:04Z 14/11] (xem §2.5)
    — không điểm; chưa có #37 tới 00:02:03Z 14/11.
11. **Birefnet: KHÔNG chạy trong lượt này** — RAM 5 mẫu MemAvailable
    **444.972 / 617.964 / 617.220 / 617.448 / 617.300 kB**
    (~0,43 / 0,60 / 0,60 / 0,60 / 0,60 GB); max RAM biết được
    trong mù #27 là 2.850 MB (46% guard 6144 MB). Birefnet-general
    vẫn 0 lần chạy thành công trong gói.
12. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
13. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
14. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    K6 không thử lại nguồn nào, theo đúng lệnh.
15. **Khoảng mù #28 bắt đầu từ 23:40:43Z** (probe #28) — lượt sau
    (probe #29) đối chiếu từ mốc này, trên boot ab33c58f (#36,
    từ 22:53:56Z, số thứ tự tạm thời). Reboot #37 chỉ có dải cơ
    học [23:13:03Z, 02:08:04Z 14/11], không điểm (xem §2.5).
16. **Đính chính phương pháp (mới, lượt này):** (a) "đồng hồ boot
    cũ chạy nhanh ~25–29s" trong tiền đề — thực chất là tiến trình
    cũ sống sót 28,9 s sau reboot, không phải đồng hồ chạy nhanh
    (xem §2.2); (b) một lần đếm trung gian ngoài hai cây in ra 27
    file nhưng không lưu danh sách — hai lần đếm có lưu file sau
    đó đều ra 3 file (xem §2.3); (c) scan writeFileSync mất 5'52"
    thay vì ~44 s chuẩn do tải 9 luồng đợt 109 — số đếm không hỏng
    (xem §2.6).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND109_K6_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round109-k6-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k6/`
(probe-notes.txt, scan-meta.txt, scan-wfs.sh, files-newstd.bin,
wfs-newstd.txt, files-r7b.bin, wfs-r7b.txt, files-copies.txt,
wfs-copies.txt, scope-new-files.txt, scope-gone-files.txt,
async-writefile.txt, async-all.txt, blind27-repo.txt,
blind27-hf.txt, blind27-epochs.txt, blind27-logfiles.txt,
blind27-logfiles-repo.txt, blind27-logfiles-hf.txt,
blind27-wave-hits.txt, blind27-hole-outside-trees.txt) + log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 109 vẫn
đang chạy; parent đếm lại khi đợt 109 đóng băng).

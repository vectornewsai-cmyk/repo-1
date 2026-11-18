# PHASE9 ROUND111 M4 — EPERM: probe #30 + khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN

> Luồng M4, đợt 111 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07,
> 14/11/2026; làm việc 05:38Z → 05:5xZ 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù
> #29 kể từ probe #29 (02:40:36Z) + quét sóng EPERM + quét
> writeFileSync lần thứ 17 + ghi RAM (birefnet: KHÔNG chạy — vẫn dưới
> ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #29, mù #28, mù #26, mù #24,
> mù #21, hay reboot #16** — chỉ báo cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (05:38:51Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.695 s, last #29
  02:40:36Z, boot 2f001e9c, exit 1); `once` ngay sau đó là
  **probe #30, boot 73316ed9 (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 0 s, n=30), exit 0. Log v2 tăng đúng 3
  dòng (79 → 82, đã kiểm lại từ đĩa); heartbeat nay n=30,
  ts 05:38:51Z, boot 73316ed9.
- **Reboot #40 = 05:16:36Z — XÁC NHẬN bằng 2 phép đo `uptime -s`
  trực tiếp** (05:38:39Z và 05:38:51Z, giống nhau từng giây) +
  `who -b` Nov 14 05:16 + boot_id 73316ed9 + journal first entry
  05:16:47Z + wtmp begins 05:16:47Z + `ps` systemd PID 1 START
  05:16:46, journald 05:16:46, hatch daemon 05:16:47 + **nguồn độc
  lập: log của sibling M8 "M8 start 2026-11-14T05:38:49Z boot
  73316ed9"** (2 s trước probe #30). Gap #39 → #40 = **2h25'48" —
  CHƯA ĐƯỢC CHỨNG NHẬN** (mù #29 chưa đóng, xem dưới) — ghi là
  **cận trên** trong toàn chuỗi.
- **Reboot #39 = 02:50:48Z — XÁC NHẬN LẠI bằng nội dung poller L9:**
  POLL#2 02:51:05Z vẫn đọc boot 2f001e9c/up 02:24:45 (tiến trình cũ
  sống sót ~17 s sau reboot — hiện tượng đã biết), REBOOT-NOTE
  02:52:22Z ghi boot mới ce518c02/up 02:50:48, POLL#0 mới 02:52:22Z
  cùng boot. Gap #38 → #39 = **26'03" — CHƯA ĐƯỢC CHỨNG NHẬN**
  (thuộc mù #29) — ghi là **cận trên**; nằm trong dải chứng nhận
  [19'07", 3h14'08"], **KHÔNG phá sàn** (đính chính L9 §0.1 nhắc
  lại: 26'03" > 19'07").
- **Khoảng mù #29: 02:40:36Z → 05:38:51Z (2h58'15") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Lỗ thật duy nhất **14'31"
  (04:56:10Z → 05:10:41Z)**: không file nào trong toàn ~/workspace
  + /tmp + chrome-userdata có mtime trong lỗ (đã tìm cả ngoài hai
  cây, xem §2.3 + §4 mục 1); exec-log của parent trong lỗ: 0 file
  có mtime trong lỗ, và exec-log U4 (mtime 05:13:57Z) không chứa
  timestamp nào trong lỗ. Sàn 19'07" loại trừ reboot ẩn trong
  (04:57:29Z, 05:10:41Z), còn **khe 79 s [04:56:10Z, 04:57:29Z]
  không loại trừ được** — theo K6 §4.5 (không đóng mù chỉ bằng
  sàn), mù #29 KHÔNG đóng. Hậu quả: số reboot trong mù là 2 đã
  chốt + có thể 1 ẩn trong khe; số thứ tự #40 có thể thực ra là
  #41; gap #38 → #39 và #39 → #40 không chứng nhận được.
- **Lỗ thứ hai 24'25" (05:14:24Z → 05:38:49Z) KHÔNG tạo khe:**
  chứa reboot #40 (05:16:36Z); phần trước #40 (2'12") loại trừ
  bằng sàn (gap2 < 2'12" < 19'07"); phần sau #40 ĐÓNG bằng đo
  uptime trực tiếp (uptime -s = 05:16:36 đo lúc 05:38:39Z +
  05:38:51Z). Đây là lỗ thật về quan sát nhưng không để lại khe
  không loại trừ được — khác lỗ 23'39" của mù #28.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 99 file *.log có mtime trong mù #29 (0 file repo-1, 99
  file hidden_files — đếm lại độc lập từ đĩa); 8 dòng "sóng EPERM
  đã tắt" đều là **dương tính giả đã biết** (dòng launcher). Sóng
  gần nhất vẫn là **~11:55–12:11Z** (R7) — **~65h27'** trước probe
  #30. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 17: 595 dòng / 178 file** (phạm vi
  2797 file); R7b đối chiếu 620 dòng / 195 file; copies 25 dòng /
  17 file — y hệt lần 16; đối chiếu chéo 595+25=620=R7b, **chênh 0
  — lần thứ mười bảy liên tiếp**. +18 dòng / +4 file so với lần
  16, giải thích đúng hết bằng diff. Async `.writeFile(`: vẫn
  đúng **2 vị trí, cả hai trong helper retry đã biết** — 0 stray.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (tập gap đơn
  đã chứng nhận không đổi, n=22 — không gap mới nào được chứng
  nhận trong lượt này). Toàn chuỗi n=34 (thêm #38 → #39 và
  #39 → #40, cả hai là cận trên): trung bình 1h59'51", trung vị
  1h59'16" — xem §2.5.
- RAM: 2 mẫu MemAvailable của lượt: **1.347.128 kB (05:38:51Z) /
  1.345.352 kB (sau probe #30)** — ~1,32 GB. Max RAM biết được
  trong mù #29 từ log sibling: **4014 MB** (L5 run31, 03:18:15Z)
  = 65% ngưỡng guard. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user
  quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 05:38:39Z + 05:38:51Z | boot_id `73316ed9-3823-4512-a52d-3cc5d455a6fd`; `who -b` Nov 14 05:16; `uptime -s` **2026-11-14 05:16:36Z** (2 lần, giống nhau từng giây); journal chỉ 1 boot (73316ed9, first entry 05:16:47Z, last 05:39:14Z lúc kiểm tra); `last -x reboot` 05:16 still running; wtmp bắt đầu 05:16:47Z; `ps` systemd PID 1 START 05:16:46, journald 05:16:46, hatch 05:16:47 |
| `bash scripts/probe-eperm-v2.sh status` | 05:38:51Z | **DEAD/STALE**, exit 1 — heartbeat n=29, ts 02:40:36Z, boot 2f001e9c, age **10.695 s** (đúng 2h58'15"); last sample probe #29; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 05:38:51Z | **probe #30, boot=73316ed9, ok=2 fail=0**, exit 0; dòng `boot changed 2f001e9c -> 73316ed9` (uptime since 2026-11-14 05:16:36) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 05:38:51Z | **ALIVE**, age 0 s, n=30, exit 0 |

Kiểm lại từ đĩa (05:48Z): log probe v2 **82 dòng** (79 sau L6 +
đúng 3 dòng checklist này); heartbeat **n=30, ts
2026-11-14T05:38:51Z, boot 73316ed9-…** (pid=6804); log vẫn chỉ
có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11) và **0 dòng
`=== probe end`** — loop v2 chưa từng được start lại kể từ đợt 88.

Nguồn độc lập cho boot #40 (sibling, không phải của M4): log
`round111-m8/m8-progress.log` dòng đầu "M8 start
2026-11-14T05:38:49Z boot 73316ed9-…" — M8 spawn đợt 111 (lượt
cron 12:35 +07) cũng thấy boot 73316ed9, 2 s trước probe #30.
M8 còn ghi postboot PASS 5/5 lúc 05:39:50Z (WebKit launch OK trên
boot #40) — dữ liệu của sibling, M4 chỉ trích dẫn, không tự nhận.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6 đã đính chính.

## 2. Điều tra khoảng mù #29 (02:40:36Z → 05:38:51Z, 2h58'15")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #30: `uptime -s` = **2026-11-14 05:16:36Z**,
  boot_id `73316ed9-3823-4512-a52d-3cc5d455a6fd` — khác boot của
  probe #29 (2f001e9c).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (05:39Z): chỉ **1 boot**
  (73316ed9, first entry 05:16:47Z, last 05:39:14Z). `last -x
  reboot`: chỉ 1 dòng (05:16, still running). wtmp bắt đầu
  05:16:47Z. Journal/wtmp của boot ce518c02 đã mất theo reboot
  #40 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Hai reboot đã chốt trong mù — #39 (02:50:48Z) và #40 (05:16:36Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 39 | **02:50:48Z (chính xác từng giây)** | 2f001e9c → ce518c02 | L6 đã chốt từ 4 phép đo `uptime -s` (02:52:10Z–03:02:18Z). **Xác nhận lại lượt này bằng nội dung poller L9** (xem §2.3, đoạn A): POLL#2 02:51:05Z vẫn đọc boot 2f001e9c/up 02:24:45 (tiến trình cũ sống sót 17 s sau reboot); REBOOT-NOTE 02:52:22Z ghi boot mới ce518c02/up 02:50:48; POLL#0 mới 02:52:22Z cùng boot; L3-retry `last-boot.txt` 04:46:12Z vẫn là ce518c02. **Số thứ tự TẠM THỜI** (xem dưới). |
| 40 | **05:16:36Z (chính xác từng giây)** | ce518c02 → 73316ed9 | **2 phép đo `uptime -s` độc lập trên boot mới** (05:38:39Z + 05:38:51Z, giống nhau từng giây) + `who -b` 05:16 + boot_id 73316ed9 + journal first entry 05:16:47Z + wtmp begins 05:16:47Z + `ps` systemd PID 1 START 05:16:46 (đều ghi trong probe-notes.txt lúc 05:38Z). **Nguồn độc lập thứ hai (sibling M8):** m8-progress.log "M8 start 2026-11-14T05:38:49Z boot 73316ed9". **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #38 → #39 = **26'03" — KHÔNG ĐƯỢC CHỨNG NHẬN** (thuộc mù
#29 chưa đóng, ghi là cận trên trong toàn chuỗi); gap
#39 → #40 = **2h25'48" — KHÔNG ĐƯỢC CHỨNG NHẬN** (cùng lý do).
Cả hai gap đều nằm trong dải chứng nhận [19'07", 3h14'08"] nhưng
nằm trong dải không đồng nghĩa được chứng nhận — chứng nhận đòi
mù chứa nó phải đóng (xem §2.3).

**Tính tạm thời của số thứ tự (ghi rõ, không giấu):** #39/#40
đúng giờ nhưng số thứ tự kế thừa tính tạm thời từ mù #26 và mù
#24 chưa đóng hoàn toàn (J8 §2.3, §5 mục 1–2) **và từ chính mù
#28 chưa đóng (khe 4'32", L6 §2.3) và mù #29 chưa đóng (khe 79 s,
xem §2.3)**: nếu khe 4'32" của mù #28 chứa 1 reboot ẩn thì
"reboot #39" thực tế là #40 và "reboot #40" thực tế là #41; nếu
thêm khe 79 s của mù #29 cũng chứa 1 reboot ẩn thì "reboot #40"
thực tế là #42. **Giá trị các gap không phụ thuộc số thứ tự** —
chỉ phụ thuộc giờ đã chốt.

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **22 file**
(không tính dist/node_modules) + hidden_files **449 file** (không
tính chrome-userdata); **464 mốc mtime phân biệt** (độ chính xác
đầy đủ; 306 giây nguyên phân biệt — đính chính cách đếm của L6
theo L9 §6.1: "506 mốc giây" của L6 thực ra là 506 giá trị
mtime đầy đủ, chỉ 350 giây nguyên). Chia mù làm ba đoạn bởi #39
(02:50:48Z) và #40 (05:16:36Z):

- **Đoạn A: 02:40:36Z → 02:50:48Z (10'12", boot 2f001e9c) —
  ĐÓNG bằng sàn + poller:**
  - **Poller L9 (5 phút) là kẹp trực tiếp:** POLL-START 02:41:04Z
    → POLL#0 02:41:04Z → POLL#1 02:46:05Z → POLL#2 02:51:05Z
    (đọc từ nội dung poll-l9.log, không phải mtime) — cả ba đều
    boot 2f001e9c, up=02:24:45. POLL#2 lúc 02:51:05Z (17 s SAU
    #39) vẫn đọc boot cũ — tiến trình cũ sống sót sau reboot,
    hiện tượng đã biết (K6/J7: ~29 s; L9 §3: ~29–38 s).
  - **Sàn đóng toàn bộ đoạn:** một reboot ẩn tại t bất kỳ trong
    đoạn A cho gap2 = 02:50:48Z − t < 10'12" < sàn 19'07" → loại
    trừ mọi t trong đoạn. Không cần dựa vào tính "tươi" của lần
    đọc POLL#2.
  - Kết luận đoạn A: **ĐÓNG**.
- **Đoạn B: 02:50:48Z → 05:16:36Z (2h25'48", boot ce518c02) —
  ĐÓNG MỘT PHẦN, còn lỗ 14'31" với khe 79 s:**
  - **Poller L9 restart 02:52:22Z sau #39:** POLL#0 02:52:22Z →
    POLL#16 04:12:24Z (**17 mục, đều boot ce518c02, up=02:50:48,
    max gap 5'01"** — đọc từ nội dung poll-l9.log). Một reboot ẩn
    trước 04:12:24Z phải đổi boot đọc được — không.
  - Sau poller: exec của parent hoàn thành **04:17:00Z**
    (exec-log proc_f0fe72e15815.log — listing repo kết thúc bằng
    dòng ngày "Sat Nov 14 04:17:00 UTC 2026"); cờ done của L9
    **04:24:27Z**; LIMITS của L9 **04:26:55Z** (mtime — L9 viết
    xong sau khi tạo cờ, ghi rõ thứ tự này); L3-retry được spawn
    **04:29Z** (build-loop-log của parent); driver L3 WAIT-BAND
    **04:35:55Z → 04:44:41Z** (~60 s một mục, load5 0,42–2,94);
    file R1/R2 của L3 **04:41:06Z → 04:48:26Z**; `last-boot.txt`
    của L3 **04:46:12Z = ce518c02** (boot #39 vẫn hiện hành);
    cờ done L3 **04:51:57Z**; LIMITS L3 **04:51:53Z**; LIMITS gộp
    đợt 110 **04:55:48Z**; GAP_ANALYSIS **04:56:06Z**; batch
    closing đợt 110 **04:56:10Z** (repo-1-push, ngoài hai cây).
  - Các "lỗ mtime" trong đoạn B trước 04:56:10Z đều là **ẢO**
    (đã đọc nội dung, theo bài học K6/L6): lỗ 10'05"
    (03:52:23Z → 04:02:28Z) được lấp bằng POLL#13 03:57:24Z +
    POLL#14 04:02:24Z; lỗ 12'03" (04:12:24Z → 04:24:27Z) được
    lấp bằng exec của parent hoàn thành 04:17:00Z + cờ done L9
    04:24:27Z; lỗ 14'11" (04:26:55Z → 04:41:06Z) được lấp bằng
    spawn L3-retry 04:29Z (parent log) + WAIT-BAND đầu tiên của
    driver L3 04:35:55Z. Lưu ý trung thực: hai khoảng lấp sau
    (04:12:24Z → 04:26:55Z và 04:26:55Z → 04:35:55Z) dựa vào
    **hoạt động của agent (ghi file/spawn) + không có gián đoạn
    hay giao lại nào được ghi** — yếu hơn kẹp poller trực tiếp,
    nhưng cùng loại lập luận L6 đã dùng cho đoạn A của mù #28
    (poller + trạng thái K1); không có bằng chứng nào ngược lại.
  - **LỖ 14'31" (04:56:10Z → 05:10:41Z): KHÔNG CÓ OBSERVER NÀO.**
    Đây là lỗ THẬT, không phải lỗ mtime ảo — đã kiểm chứng bằng
    4 lớp (xem §4 mục 1): (a) mtime find trong hai cây để xác
    định lỗ (quan sát cuối 04:56:06Z GAP_ANALYSIS trong cây, đầu
    sau 05:10:41Z file U4); (b) đọc NỘI DUNG các file log append
    chạm biên lỗ (exec-log U4 proc_140e9b8da275.log, 36 dòng,
    mtime 05:13:57Z — **không chứa timestamp ISO nào**, chỉ là
    output chạy kiểm chứng: tsc 0/0, r6 PASS, vite build 7,64 s,
    P7 8/8, orphans 17/17, hold 75/75, E4 test 5/5,
    preview-engine 354 assertions, U4 141/141; build-loop-log
    mtime 05:14:24Z, mục cuối là kiểm chứng parent đợt 110,
    không timestamp nào sau 05:14:24Z); (c) **tìm ngoài hai cây**:
    find toàn ~/workspace (không prune) trong đúng cửa sổ lỗ chỉ
    ra đúng 1 file — batch closing đợt 110
    (phase9-round110-closing.txt, mtime **04:56:10Z**, ngoài hai
    cây — chính là quan sát cuối cùng, thu hẹp lỗ từ 14'35" còn
    14'31"); /tmp: 0 file trong lỗ; chrome-userdata: 0 file
    trong lỗ; agents/ exec-logs: 0 file có mtime trong lỗ; (d)
    **số học sàn** để bound khe không loại trừ được (xem dưới).
  - **Phân tích sàn cho lỗ 14'31":** reboot ẩn tại t trong
    (04:56:10Z, 05:10:41Z) cho gap1 = t − 02:50:48Z ∈
    (2h05'22", 2h19'53") — luôn > sàn 19'07" (không loại trừ
    được); gap2 = 05:16:36Z − t < 19'07" ⟺ t > 04:57:29Z. Nên
    sàn loại trừ reboot ẩn trong **(04:57:29Z, 05:10:41Z)**
    (13'12"), còn **khe [04:56:10Z, 04:57:29Z] (79 s) không loại
    trừ được** — trong khe này cả hai gap đều ≥ sàn
    (gap1 2h05'22"–2h06'41", gap2 19'07"–20'26"; tại biên
    t=04:57:29Z gap2 đúng bằng sàn 19'07" nên không loại trừ).
  - Kết luận đoạn B: **KHÔNG ĐÓNG** — lỗ 14'31", trong đó
    13'12" loại trừ bằng sàn, 79 s không loại trừ được bằng bất
    cứ bằng chứng nào còn tồn tại.
- **Đoạn C: 05:16:36Z → 05:38:51Z (22'15", boot 73316ed9) — ĐÓNG
  bằng đo uptime trực tiếp + lỗ 24'25" không tạo khe:**
  - **Lỗ mtime 24'25" (05:14:24Z → 05:38:49Z)** chứa reboot #40:
    quan sát cuối trước lỗ là build-loop-log 05:14:24Z (parent
    đóng đợt 110); quan sát đầu sau lỗ là m8-progress.log
    05:38:49Z (sibling M8 spawn đợt 111). Ngoài hai cây trong
    cửa sổ lỗ: đúng 1 file — `~/workspace/system/system_prompt.md`
    mtime 05:35:38Z (runtime ghi khi spawn đợt 111; hatch-execd
    mới START 05:35:38Z theo `ps`) — SAU #40, không lấp phần
    trước #40; /tmp: 0 file; chrome-userdata: 0 file.
  - Phần lỗ trước #40 chỉ dài **2'12" (05:14:24Z → 05:16:36Z)**:
    reboot ẩn tại t trong khoảng này cho gap2 = 05:16:36Z − t <
    2'12" < 19'07" → **loại trừ bằng sàn**.
  - Phần lỗ sau #40 (05:16:36Z → 05:38:49Z): **ĐÓNG bằng đo
    uptime trực tiếp** — `uptime -s` = 05:16:36Z đo lúc 05:38:39Z
    + 05:38:51Z chứng minh máy up liên tục từ 05:16:36Z; cộng
    thêm log M8 05:38:49Z trên boot 73316ed9.
  - Kết luận đoạn C: **ĐÓNG**. Lỗ 24'25" là lỗ thật về quan sát
    nhưng không để lại khe không loại trừ được.

**Kết luận trung thực: khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN.**
Đúng 2 reboot đã chốt giờ (#39 02:50:48Z, #40 05:16:36Z) + có thể
1 reboot ẩn trong khe 79 s [04:56:10Z, 04:57:29Z]. Đây là mù thứ
tư liên tiếp không đóng hoàn toàn sau #24, #26 và #28 (chuỗi đóng
#25 → #27 đã cắt từ #28). **Điều kiện duy nhất để đóng là dữ liệu
trong khe 79 s — không còn nguồn nào để tìm** (journal/wtmp
volatile chỉ giữ boot hiện tại; không syslog/kern.log; toàn
workspace + /tmp + agents/ + chrome-userdata đã tìm hết). M4
không tự quyết — parent/user quyết xem có chấp nhận "ít nhất 2
reboot, có thể 3" làm mức đóng của mù #29 hay để mở như mù
#24/#26/#28.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 110 + spawn đợt 111

Khoảng mù 02:40:36Z → 05:38:51Z (2h58'15") được phủ bởi các luồng
sibling đợt 110 (L1–L9, làm việc tới ~04:26Z; L3-retry tới
04:51:57Z) + parent đóng đợt (tới 05:14:24Z) + spawn đợt 111
(05:35:51Z). Đã đọc lại log thật — **đếm lại độc lập từ đĩa**
(grep trên đúng 99 file *.log có mtime trong mù #29 — 0 file
repo-1, 99 file hidden_files, trừ chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **8** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4):** cả 8 dòng đều có dạng `[timestamp]
sóng EPERM đã tắt, khởi động vite` — in khi lần ghi thử ĐẦU TIÊN
thành công ngay (code launcher `waveOff=true` ở lần write đầu) —
in mặc định cả khi không có sóng. Phân bố: L1 run-l1.log 4 dòng
(03:29:49Z → 03:31:25Z), L8 l8-o8-run.log + l8-vite-window.log
cùng timestamp 03:26:38Z (1 sự kiện, 2 log), L9
round110-l9-o8.log 2 dòng (04:10:09Z + 04:11:03Z). Bằng chứng phân
biệt: **0 dòng "sóng EPERM vẫn bật sau …s chờ"** và **0 dòng
"CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ 99 log; **0 lần
"Operation not permitted" thật**. Đếm này là whole-file (không chỉ
dòng trong cửa sổ mù) nên còn mạnh hơn: không có dòng sóng thật
nào trong toàn bộ nội dung 99 file.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng lần này, như mù #28, **có một lỗ quan
  sát về reboot** (14'31", §2.3) nên một sóng ngắn trong lỗ đó
  cũng không có nhân chứng vite nào. Ngoài lỗ đó: vite khởi động
  thành công ngay ở 03:26–03:31Z (nhiều lần), 04:10–04:11Z (O8
  của L9, 2 engine). Một sóng dài ~16' kiểu R7 chỉ có thể lọt
  vào khe 14'31" của lỗ (04:56:10–05:10:41Z) mà không để lại dấu
  — khả năng thấp, không loại trừ tuyệt đối được. Lỗ 24'25" chứa
  #40 cũng không có nhân chứng vite nào (không vite nào chạy
  05:14–05:38Z), nhưng đó là khoảng máy vừa reboot + parent idle,
  không phải khoảng nghi sóng.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~65h27'** trước
  probe #30 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #30 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 05:38:51Z ghi được.

### 2.5 Phân phối gap cập nhật — dải chứng nhận CÒN DÙNG ĐƯỢC

Không gap mới nào được chứng nhận trong lượt này (cả #38 → #39
và #39 → #40 đều thuộc mù #29 chưa đóng). Tập gap đơn đã chứng
nhận giữ nguyên **n=22**; toàn chuỗi tăng n=32 → **n=34** (thêm 2
cận trên). Tính lại từ bảng J8 §2.5.3 + 2 gap K6 + 2 gap L6 + 2
gap mới, bằng code (percentile tuyến tính, index = p·(n−1) —
cùng phương pháp J8/K6/L6/L9). **Kiểm tra chéo: tính lại CERT n=22
ra đúng 100% số L6** (trung bình 1h52'05", trung vị 1h59'16",
p10 1h08'41", p90 2h57'18", sd 43'58") **và tính lại toàn chuỗi
n=32 ra đúng 100% số L6** (trung bình 2h01'58", trung vị
1h59'16", p10 51'50", p90 3h05'08", sd 1h03'55") — nên số mới
dưới đây đáng tin ở cùng mức (script `recount-m4.py`, output
`recount-m4.txt`):

| Thống kê | Toàn bộ n=34 | Chỉ gap đơn đã chứng nhận n=22 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h59'51" | 1h52'05" |
| Trung vị | 1h59'16" | 1h59'16" |
| Độ lệch chuẩn (mẫu) | 1h04'16" (CV 0,54) | 43'58" |
| p10 | 38'06" | 1h08'41" |
| p90 | 3h05'01" | 2h57'18" |

Đọc thêm: 18/34 gap (53%) nằm trong 90'–150'; 5 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=22)** — min/max không đổi (không gap mới nào
được chứng nhận). Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần
bởi các gap chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. **Không đưa dự báo điểm cho #41 hay reboot
nào sau đó** — chỉ dải cơ học áp lên #40 (05:16:36Z):
**[05:35:43Z, 08:30:44Z 14/11]**; p10–p90 toàn chuỗi →
[05:54'Z, 08:22'Z]. Lưu ý: đầu dải cơ học 05:35:43Z đã qua lúc
probe #30 (05:38:51Z) mà chưa có reboot — điều đó không vi phạm
dải (dải là khoảng, không phải thời điểm).

### 2.6 Reboot #40 (05:16:36Z) — thuộc mù #29, đã xác nhận ở §2.2

- `uptime -s` = **2026-11-14 05:16:36Z**, đo **2 lần** (05:38:39Z,
  05:38:51Z — đều giống nhau từng giây); boot_id
  `73316ed9-3823-4512-a52d-3cc5d455a6fd`; `who -b` Nov 14 05:16;
  journal first entry 05:16:47Z; wtmp begins 05:16:47Z; systemd
  PID 1 START 05:16:46.
- Reboot này xảy ra sau khi parent đóng đợt 110 (build-loop-log
  05:14:24Z) và trước khi spawn đợt 111 (05:35:51Z) — không cắt
  ngang luồng đợt 110 nào đang chạy (đợt 110 đã xong hết lúc
  04:51:57Z; parent chỉ còn kiểm chứng, xong 05:14:24Z).
- Gap #39 → #40 = **2h25'48"** (02:50:48Z → 05:16:36Z) — nằm trong
  dải chứng nhận nhưng **CHƯA đưa vào tập gap đơn đã chứng nhận**:
  nó thuộc mù #29 chưa đóng, chờ lượt sau đóng mù #29 mới xét.
  Số thứ tự #40 là TẠM THỜI (kế thừa từ #39 và khe 79 s).
- Tốc độ reboot cập nhật: **40 reboot đã chốt giờ / 80,97h** (từ
  ~20:18:10Z 10/11 tới 05:16:36Z 14/11) = **1 lần / 121,5'
  (2,02h)**; nếu khe 79 s chứa thêm 1 reboot ẩn thì 41 lần /
  80,97h = 1 lần / 118,5'.

### 2.7 Quét writeFileSync (snapshot 05:44:32–05:45:25Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round111-m4`. Chạy trọn vẹn trên boot mới (53 s, SCAN-END có đủ).
Kết quả NEWSTD khớp 100% scan-meta.txt (tính lại từ file
wfs-*.txt + files-*.bin gốc).

- Chuẩn mới: **595 dòng / 178 file** (phạm vi 2797 file).
  Lần 16 (L6): 577 dòng / 174 file (phạm vi 2782 file).
- R7b (đối chiếu): **620 dòng / 195 file**. Lần 16: 602 / 191.
- Copies: **25 dòng / 17 file** — y hệt lần 16, J8, I7, H7, G8
  và F7.
- Đối chiếu chéo 595+25=620=R7b, **chênh 0 — lần thứ mười bảy
  liên tiếp**. Tổng hit trên cả 3 bảng: 595+620+25 = **1.240 dòng**.
- **+18 dòng / +4 file so với lần 16, giải thích đúng hết bằng
  diff hit list** (không có dòng nào tăng trong file cũ ngoài
  GAP_ANALYSIS, không file nào giảm):
  - +1 `PHASE9_GAP_ANALYSIS.md` (19 → 20 — mục closing đợt 110
    mới thêm, 04:56:06Z)
  - +7 `apps/web/scripts/probe111m3-frame-parity.mjs` (M3 đợt 111
    — file mới, sibling đang chạy; mtime 05:41:37Z, trước khi
    scan bắt đầu 05:44:32Z)
  - +5 `apps/web/scripts/probe111m7-frame-parity.mjs` (M7 đợt 111
    — file mới, sibling đang chạy; mtime 05:41:17Z, trước khi
    scan bắt đầu)
  - +4 `docs/PHASE9_ROUND110_L6_EPERM_LIMITS.md` (file LIMITS của
    chính L6 — 03:19:36Z, sau snapshot lần 16 02:52:48Z; 4 hit
    đều là trích dẫn "writeFileSync" trong văn bản, đã đọc nội
    dung từng dòng)
  - +1 `docs/PHASE9_ROUND110_LIMITS.md` (closing đợt 110,
    04:55:48Z)
  - Tổng: 1+7+5+4+1 = **18** ✓, 4 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: GAP_ANALYSIS đúng 20,
    probe111m3 đúng 7, probe111m7 đúng 5, L6 LIMITS đúng 4,
    round110 LIMITS đúng 1.
- **0 file biến mất khỏi hit list** (chỉ GAP_ANALYSIS đổi số đếm
  19 → 20).
- Scope: **+15 file ròng / −1 file** so với lần 16 (2797 =
  2782+16−1 ✓): 16 file mới = 4 file hit trên + 12 file không
  hit (8 LIMITS đợt 110 — L1/L2/L3/L4/L5/L7/L8/L9 — +
  `apps/web/scripts/vcut-vite-lock.sh` (L8) +
  `apps/web/scripts/vcut-webkit-postboot-check.sh` (L8) +
  `benchmarks/render/l2_attrib_110.py` +
  `benchmarks/render/webkit_blob_flaky_111m2_2mib.mjs` (M2 đợt
  111)); 1 file biến mất = `apps/web/vite.config.l7-temp.ts`
  (config tạm của L7, đã xoá sau khi L7 xong). Comm hai chiều
  khớp đúng (16 = 4+12 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 16 — xem files-copies.txt).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 111 vẫn đang chạy; 2 file probe111m3/m7 đã hạ cánh trước
  khi scan bắt đầu (đếm lại trực tiếp sau scan khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 111 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2797 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại độc lập, không tin mù file cũ; các hit còn
lại đều nằm trong file `.md` trích dẫn code):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như L6: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

2 mẫu MemAvailable của lượt: **1.347.128 kB (05:38:51Z, trước
probe #30) / 1.345.352 kB (sau probe #30)** — ~1,32 GB. Max RAM
biết được trong mù #29 từ log sibling: **4014 MB** (L5 run31,
03:18:15Z; run30 03:10:14Z 4010 MB; min trong mù 1024 MB, run29)
= **65% ngưỡng guard 6144 MB** — máy chưa từng tiến gần ngưỡng
trong mù #29. Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3
mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥
6 GB mới thử lại). Birefnet-general vẫn **0 lần chạy thành công**
trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   áp dụng lượt này — xem §2.3):** (a) mtime find trong hai cây
   để xác định lỗ; (b) **đọc NỘI DUNG** các file log append chạm
   biên lỗ (exec-log U4 — 36 dòng, không timestamp nào trong lỗ;
   build-loop-log — mục cuối không timestamp sau 05:14:24Z);
   (c) **tìm ngoài hai cây**: find toàn ~/workspace (không prune)
   + /tmp + ~/workspace/agents/ + chrome-userdata trong đúng cửa
   sổ lỗ; (d) **số học sàn** để bound khe không loại trừ được
   (khe 79 s — tính gap1/gap2 theo t, cả hai biên). Lỗ 14'31" lần
   này qua cả 4 lớp vẫn là lỗ thật — và lỗ 24'25" qua cả 4 lớp
   vẫn là lỗ thật về quan sát nhưng không để lại khe (sàn +
   uptime trực tiếp đóng được). **Quy tắc giữ nguyên: mọi kết
   luận "lỗ" phải qua cả 4 lớp, và phải ghi rõ khe còn lại sau
   mỗi lớp.**
2. **Quan sát ngoài hai cây có thể thu hẹp lỗ (mới, lượt này —
   xem §2.3):** batch closing đợt 110 (repo-1-push, mtime
   04:56:10Z) là quan sát cuối cùng của lỗ 1 — nếu chỉ tìm trong
   hai cây thì lỗ tưởng là 14'35" (04:56:06Z → 05:10:41Z), tìm
   ngoài cây mới thấy lỗ thật là 14'31" và khe thật là 79 s (chứ
   không phải 83 s). L6 đã tìm ngoài cây cho mù #28; lượt này
   xác nhận lại giá trị của bước đó — **không bao giờ bỏ lớp (c)**.
3. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, áp dụng lượt này — xem §2.2):** systemd PID 1
   START 05:16:46, journald 05:16:46, hatch 05:16:47 — khớp
   `uptime -s` 05:16:36Z ở mức phút. Log của sibling M8
   ("M8 start 05:38:49Z boot 73316ed9") là nguồn độc lập thứ hai
   cho boot #40.
4. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
   KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
   lại): tiến trình boot cũ sống sót tới ~17 s sau reboot (POLL#2
   của L9 lúc 02:51:05Z vẫn đọc boot 2f001e9c — trường hợp thật
   thứ ba sau run21 của J7 và L6 đợt 110).
5. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
   reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
   bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
   thức nằm trong các file LIMITS EPERM theo đợt.
6. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
   lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
   đã chứng nhận (n=22) sau lượt này; trên toàn chuỗi vẫn có 2
   gap vượt (đều là cận trên). **Nằm trong dải không đồng nghĩa
   được chứng nhận** (mới, lượt này — xem §2.2): gap #38 → #39
   (26'03") và #39 → #40 (2h25'48") đều nằm trong dải nhưng vẫn
   là cận trên vì mù #29 chưa đóng.
7. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (H7 §4 mục 1, nhắc lại + áp dụng mới): sàn 19'07"
   vẫn đứng sau lượt này, nhưng mù #29 KHÔNG đóng được chính vì
   khe 79 s chỉ còn sàn làm chỗ dựa — sàn loại trừ được 13'12"
   của lỗ nhưng không loại trừ được 79 s còn lại. Sàn là công cụ
   bound, không phải bằng chứng đóng.
8. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
   poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ 14'31",
   toàn ~/workspace ngoài hai cây chỉ có 0 file mới (1 file duy
   nhất trong cửa sổ rộng hơn là batch closing 04:56:10Z, ngay
   đầu lỗ); parent idle 04:56–05:10Z không để lại dấu nào;
   poller L9 đã exit lúc 04:12:24Z ("POLL#16", L9 xong việc) nên
   không còn observer thường trực nào sau 04:12:24Z.
9. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
   4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
   vị trí đã biết trước khi kết luận.
10. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 8 dòng "đã tắt" trong mù #29
    đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
    "Operation not permitted" thật. Đếm whole-file (không chỉ
    dòng trong cửa sổ) nên 0 còn mạnh hơn.
11. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10): lượt này probe + quét xong là ghi LIMITS/
    batch ngay, không đợi luồng khác — reboot #40 (05:16:36Z) đã
    xảy ra giữa đợt 110 và đợt 111; lượt sau có thể bị reboot
    giết bất cứ lúc nào. File blind29-*.txt + scan-*.txt đã ghi
    sớm vào round111-m4/ với cửa sổ ghi rõ.
12. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 99 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
13. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 53 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
14. **Đính chính đếm mốc mtime (L9 §6.1, áp dụng lượt này):**
    blind #29 có **464 mốc mtime phân biệt** (độ chính xác đầy
    đủ) nhưng chỉ **306 giây nguyên phân biệt** — ghi cả hai số,
    không ghi một số mập mờ như "506 mốc giây".

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** lỗ thật 14'31" (04:56:10Z → 05:10:41Z); sàn loại trừ
   được 13'12", còn khe 79 s [04:56:10Z, 04:57:29Z] không loại
   trừ được — có thể chứa 1 reboot ẩn. Số reboot trong mù: 2 đã
   chốt (#39 02:50:48Z, #40 05:16:36Z) + có thể 1 ẩn. **Số thứ tự
   #39/#40 vẫn TẠM THỜI** — parent/user quyết xem có chấp nhận
   "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #29 hay để mở
   như mù #24/#26/#28. M4 không tự quyết. Gap #38 → #39 =
   26'03" và #39 → #40 = 2h25'48" KHÔNG được chứng nhận (cận
   trên); tập gap đơn đã chứng nhận giữ nguyên n=22.
2. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1): lỗ 23'39" (02:01:06Z → 02:24:45Z), khe 4'32" không loại
   trừ được; số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ
   tự #37/#38 vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm
   — parent/user quyết. M4 không tự quyết. Probe #30 không đóng
   được mù #28 hồi tố.
3. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
   — không xác định được; số thứ tự #34 là TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết. M4 không tự
   quyết.
4. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33/#34/#35/#36/#37/#38/
   #39/#40 là TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. M4 không tự quyết.
5. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. M4 không tự quyết.
6. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn 19'07". M4 không thử
   lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có
   điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận I7). **Khoảng mù #27 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận K6). **Khoảng mù #28 nay KHÔNG ĐÓNG HOÀN
   TOÀN** (L6). **Khoảng mù #29 nay KHÔNG ĐÓNG HOÀN TOÀN** (mới,
   lượt này).
7. **Khoảng mù #30 BẮT ĐẦU từ 05:38:51Z** (probe #30) — lượt sau
   (probe #31) đối chiếu từ mốc này, trên boot 73316ed9 (#40,
   từ 05:16:36Z, số thứ tự tạm thời). Dải cơ học cho #41 từ #40
   là [05:35:43Z, 08:30:44Z] — là phép áp dải máy móc, không phải
   dự báo.
8. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5 mục
   5, K6 §5 mục 6, L6 §5 mục 7): lệnh cron chỉ là `bash
   ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài giây,
   không giữ tiến trình nền). M4 KHÔNG tự tạo, KHÔNG start loop
   nền. Bằng chứng mới: mù #29 không đóng được LÀ VÌ poller L9
   đã exit lúc 04:12:24Z và không còn observer thường trực nào
   sau đó — cùng mẫu với mù #28 (poller K9 exit 01:27:13Z).
9. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6):
   không đưa dự báo điểm cho #41 hay reboot nào sau đó; thay bằng
   dải chứng nhận [19'07", 3h14'08"] + p10–p90 thực nghiệm + đo
   uptime trực tiếp + poller.
10. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
    và các lượt sau; log tăng đúng 3 dòng checklist, 79 → 82 —
    không thêm dòng lạ mới trong lượt này.)
11. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
    đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
    được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
    cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
12. **VM reboot ~1 lần / 2h01'30"** (40 lần đã chốt giờ / 80,97h từ
    ~20:18:10Z 10/11 tới 05:16:36Z 14/11, số thứ tự tạm thời — xem
    §2.2 + §2.6; nếu khe 79 s chứa thêm 1 reboot ẩn thì 41 lần /
    80,97h = 1 lần / 118,5'): mọi probe nền đều chết theo reboot;
    v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục bằng
    1 mẫu mới.
13. **Birefnet: KHÔNG chạy trong lượt này** — RAM 2 mẫu MemAvailable
    **1.347.128 / 1.345.352 kB** (~1,32 GB); max trong mù #29 từ log
    sibling **4014 MB** = 65% guard 6144 MB. Birefnet-general vẫn 0
    lần chạy thành công trong gói.
14. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
15. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
16. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    M4 không thử lại nguồn nào, theo đúng lệnh.
17. **Đính chính nhỏ (mới, lượt này):** (a) L9 LIMITS §0.1 đúng —
    gap #38 → #39 = 26'03" KHÔNG phá sàn 19'07"; M4 xác nhận lại
    bằng nội dung poller L9 (REBOOT-NOTE 02:52:22Z). (b) Cờ done
    của L9 (04:24:27Z) được tạo TRƯỚC khi file LIMITS của L9 viết
    xong (mtime 04:26:55Z) — thứ tự này không ảnh hưởng kết luận
    nào, chỉ ghi để lượt sau khỏi nhầm cờ done là mốc kết thúc
    viết file. (c) File `round110-l9-done` và LIMITS của L9 đều
    nằm trong hai cây giám sát nên đã có trong blind29-*.txt —
    không phải quan sát ngoài cây.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND111_M4_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round111-m4-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round111-m4/`
(probe-notes.txt, m4-progress.log, scan-meta.txt, scan-wfs.sh,
scan-wfs-run.log, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
wfs-r7b.txt, files-copies.txt, wfs-copies.txt, recount-m4.py,
recount-m4.txt, blind29-repo.txt, blind29-hf.txt, blind29-all.txt,
blind29-logfiles.txt, blind29-logfiles-hf.txt,
blind29-logfiles-repo.txt, blind29-hole1-outside.txt,
blind29-hole2-outside.txt, blind29-hole1-tmp.txt,
blind29-hole2-tmp.txt, blind29-hole1-chrome.txt,
blind29-hole2-chrome.txt, blind29-u4-execlogs.txt,
blind29-spawn-execlogs.txt) + log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 111 vẫn
đang chạy; parent đếm lại khi đợt 111 đóng băng — đợt 106–110 là
49 batch / 98 entry / 93 file duy nhất + 1 file oversize, theo
kiểm chứng parent 11:5x +07 14/11).

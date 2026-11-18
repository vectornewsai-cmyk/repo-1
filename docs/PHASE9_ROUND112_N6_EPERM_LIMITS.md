# PHASE9 ROUND112 N6 — EPERM: probe #31 + reboot #42 + khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN

> Luồng N6, đợt 112 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 14/11/2026; làm việc 08:40Z → 09:0xZ 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + xác định reboot
> #42 + điều tra khoảng mù #30 kể từ probe #30 (05:38:51Z) + quét sóng
> EPERM + quét writeFileSync lần thứ 18 + ghi RAM (birefnet: KHÔNG
> chạy — vẫn dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #30, mù #29, mù #28, mù #26,
> mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy" vs
> "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (08:40:59Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.928 s, last #30
  05:38:51Z, boot 73316ed9, exit 1 theo quy định script — số exit
  trong probe-notes là của `tee`, xem §1); `once` ngay sau đó là
  **probe #31, boot cc39f151 (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 0 s, n=31), exit 0. Log v2 tăng đúng 3
  dòng checklist (82 → 85); heartbeat nay n=31, ts 08:40:59Z,
  boot cc39f151. (Sau checklist, 1 lần `status` trực tiếp lúc
  08:56:42Z ghi thêm đúng 1 dòng DEAD — log nay 86 dòng; lần
  `status` 08:57:34Z không ghi thêm nhờ dedupe, xem §1.)
- **Reboot #42 = 08:05:10Z — XÁC NHẬN bằng 2 phép đo `uptime -s`
  trực tiếp** (08:40:39Z và 08:40:51Z, giống nhau từng giây) +
  btime 1794643510 = 08:05:10Z + `who -b` Nov 14 08:05 + boot_id
  cc39f151 + journal first entry 08:05:21Z + wtmp begins 08:05:20Z
  + `ps` systemd PID 1 START 08:05:20, journald 08:05:20, hatch
  08:05:21 + **nguồn độc lập: sibling N7
  (`round112-n7/postboot-status.md`)** — N7 xác minh độc lập
  `uptime -s` + btime + boot_id đều khớp, postboot-check PASS
  08:41:22Z, WebKit launch PASS cả 3 chế độ 08:41:44–48Z.
  Gap #41 → #42 = **1h11'44" — CHƯA ĐƯỢC CHỨNG NHẬN** (mù #30
  chưa đóng, xem dưới) — ghi là **cận trên** trong toàn chuỗi;
  **KHÔNG phá sàn** (1h11'44" > 19'07").
- **Reboot #41 = 06:53:26Z, boot 35099846 — KHÔNG đo lại được
  lượt này** (journal/wtmp volatile, chỉ giữ boot hiện tại):
  giữ nguyên giờ do parent chốt (build-loop-log + ROUND111
  LIMITS), được củng cố bởi log M9 (verify start 06:59:24Z +
  O8 06:59:24–07:06:03Z đều ghi boot 35099846) và N7
  postboot-status. Không tìm thấy file output `uptime -s` gốc
  nào cho #41 (grep "06:53:26" trong exec-logs của parent +
  agent M9: 0 hit; không tìm thấy proc log của "1 exec sleep"
  mà parent nói #41 đã cắt — chỉ 1 proc log có mtime
  06:40–07:00Z, birth 06:41:00, mtime 06:43:25, không liên
  quan). Gap #40 → #41 = **1h36'50" — CHƯA ĐƯỢC CHỨNG NHẬN**
  (cùng lý do) — cận trên.
- **Khoảng mù #30: 05:38:51Z → 08:40:59Z (3h02'08") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Đoạn A (tới #41) **ĐÓNG** bằng
  poller M9 (POLL#0–#14, 05:39:07Z → 06:49:11Z, đều boot
  73316ed9) + sàn cho đuôi 4'15". Đoạn B (tới #42) **KHÔNG
  ĐÓNG**: còn **3 cửa sổ mở** — cửa sổ 1 **11'32"
  (07:12:33Z → 07:24:05Z)** trong lỗ mtime 747 s (07:11:38Z →
  07:24:05Z); cửa sổ 2 **72 s (07:26:45Z → 07:27:57Z)** (đuôi
  theo đúng nghĩa chặt sau khi trừ 38 s "sống sót" khỏi session
  U4); cửa sổ 3 **18'06" [07:27:57Z, 07:46:03Z]** trong lỗ lớn
  73'02" (07:27:57Z → 08:40:59Z) — dù trong lỗ có quan sát
  ngoài cây (relationships 07:28:37Z, proactivity 07:41:55Z),
  chúng chỉ là mtime, không xác định boot, nên không thu hẹp
  khe (xem §2.3). Đoạn C (sau #42) **ĐÓNG** bằng đo uptime trực
  tiếp + N7 + probe #31.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 116 file *.log có mtime trong mù #30 (0 file repo-1,
  116 file hidden_files — đếm lại độc lập từ đĩa); 6 dòng "sóng
  EPERM đã tắt" đều là **dương tính giả đã biết** (dòng
  launcher: 4× M1 06:18:54–06:20:33Z, 2× M9 O8 07:03:15 +
  07:05:12Z). Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) —
  **~68h30'** trước probe #31. EPERM vẫn KHÔNG được tuyên bố
  là đã hết.
- **Quét writeFileSync lần 18: 613 dòng / 182 file** (phạm vi
  2814 file); R7b đối chiếu 638 dòng / 199 file; copies 25 dòng /
  17 file — y hệt lần 17; đối chiếu chéo 613+25=638=R7b, **chênh 0
  — lần thứ mười tám liên tiếp**. +18 dòng / +4 file so với lần
  17, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry
  đã biết** — 0 stray.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (tập gap đơn
  đã chứng nhận không đổi, n=22 — không gap mới nào được chứng
  nhận trong lượt này). Toàn chuỗi n=34 → **n=36** (thêm 2 cận
  trên #40 → #41, #41 → #42): trung bình 1h57'52", trung vị
  1h58'30" — xem §2.5.
- RAM: 2 mẫu MemAvailable của lượt: **737.988 kB (08:40:59Z) /
  741.604 kB (sau probe #31)** — ~0,72 GB. Max RAM biết được
  trong mù #30 từ log sibling: **1468 MB** (M9 verify start,
  06:59:24Z) = 24% ngưỡng guard. Birefnet KHÔNG chạy, vẫn 0 lần
  chạy thành công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ
  parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:40:39Z + 08:40:51Z | boot_id `cc39f151-05bc-42bf-b5fa-ee9ac5ff28ba`; `who -b` Nov 14 08:05; `uptime -s` **2026-11-14 08:05:10Z** (2 lần, giống nhau từng giây); btime **1794643510 = 2026-11-14T08:05:10Z**; journal chỉ 1 boot (cc39f151, first entry 08:05:21Z, last 08:40:31Z lúc kiểm tra); `last -x reboot` 08:05 still running; wtmp bắt đầu 08:05:20Z; `ps` systemd PID 1 START 08:05:20, journald 08:05:20, hatch 08:05:21 |
| `bash scripts/probe-eperm-v2.sh status` | 08:40:59Z | **DEAD/STALE**, heartbeat n=30, ts 05:38:51Z, boot 73316ed9, age **10.928 s** (đúng 3h02'08"); last sample probe #30; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 08:40:59Z | **probe #31, boot=cc39f151, ok=2 fail=0**, exit 0; dòng `boot changed 73316ed9 -> cc39f151` (uptime since 2026-11-14 08:05:10) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 08:40:59Z | **ALIVE**, age 0 s, n=31, exit 0 |

Kiểm lại từ đĩa (08:57Z): log probe v2 **86 dòng** — 82 sau M4 +
đúng 3 dòng checklist này (= 85) + **1 dòng DEAD nữa lúc
08:56:42Z** (age 943 s) do N6 chạy `status` trực tiếp sau
checklist để kiểm exit code thật; heartbeat **n=31, ts
2026-11-14T08:40:59Z, boot cc39f151-…** (pid=6967); log vẫn chỉ
có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11) và **0 dòng
`=== probe end`** — loop v2 chưa từng được start lại kể từ đợt 88.

**Đính chính exit code (mới, lượt này):** các `exit=` ghi trong
probe-notes.txt ở bước checklist là **exit của `tee`** (lệnh chạy
qua pipeline `| tee`), không phải của script — N6 đã ghi sai
dạng này trong probe-notes và đính chính tại đây. Quy định thật
của script (header): `status` exit 0 ALIVE / 1 STALE-DEAD / 2
chưa chạy bao giờ; `once` exit 0. Kiểm lại trực tiếp không qua
pipe: `status` lúc 08:57:34Z cho **STALE, exit=1** (age 995 s) —
đúng, vì không có loop nào đang chạy; heartbeat chỉ tươi trong
900 s sau mỗi mẫu `once`. Lần `status` 08:57:34Z **không ghi
thêm dòng DEAD nào** (log vẫn 86 dòng): script chỉ ghi 1 dòng
DEAD cho mỗi heartbeat (dedupe) — lần ghi duy nhất sau probe #31
là 08:56:42Z. Lượt sau ghi exit code phải lấy từ `$?` trực tiếp,
không qua pipe.

Nguồn độc lập cho boot #42 (sibling, không phải của N6): file
`round112-n7/postboot-status.md` — N7 xác minh độc lập
`uptime -s` + `/proc/stat` btime + boot_id đều khớp 08:05:10Z /
cc39f151; postboot-check lần 1 PASS toàn bộ 08:41:22Z; launch
WebKit thật cả 3 chế độ PASS 08:41:44–48Z. N7 chạy song song đợt
112 trên cùng boot #42.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4 đã đính chính.

## 2. Điều tra khoảng mù #30 (05:38:51Z → 08:40:59Z, 3h02'08")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #31: `uptime -s` = **2026-11-14 08:05:10Z**,
  boot_id `cc39f151-05bc-42bf-b5fa-ee9ac5ff28ba` — khác boot của
  probe #30 (73316ed9).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (08:40Z): chỉ **1 boot**
  (cc39f151, first entry 08:05:21Z, last 08:40:31Z). `last -x
  reboot`: chỉ 1 dòng (08:05, still running). wtmp bắt đầu
  08:05:20Z. Journal/wtmp của boot 35099846 đã mất theo reboot
  #42 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Hai reboot đã chốt trong mù — #41 (06:53:26Z) và #42 (08:05:10Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 41 | **06:53:26Z (giờ do parent chốt — N6 KHÔNG đo lại được)** | 73316ed9 → 35099846 | Parent build-loop-log + `PHASE9_ROUND111_LIMITS.md` ("Boot hiện tại 35099846 (từ 06:53:26Z)"). **Củng cố lượt này:** M9 `round111-m9-suites.log` dòng 1 "verify start 06:59:24Z boot 35099846-8ebb-4476-a8fe-2a83978aee86 RAMavail 1468MB" + dòng cuối "ALL DONE 07:03:13Z boot 35099846"; `round111-m9-o8.log` "O8 Chromium start 07:03:13Z boot 35099846" → "O8 done 07:04:05Z boot 35099846" + re-run 07:05:10Z cùng boot. N7 postboot-status (đợt 112) cũng ghi "#41 = 06:53:26Z". **Không còn file output `uptime -s` gốc** (grep "06:53:26" trong exec-logs của parent e033d2dd + agent M9 d11661c2: 0 hit); không tìm thấy proc log của "1 exec sleep" mà parent nói #41 đã cắt (chỉ 1 proc log có mtime 06:40–07:00Z: birth 06:41:00, mtime 06:43:25, agent 5fec1d5a, không liên quan). **Số thứ tự TẠM THỜI** (xem dưới). |
| 42 | **08:05:10Z (chính xác từng giây)** | 35099846 → cc39f151 | **2 phép đo `uptime -s` độc lập trên boot mới** (08:40:39Z + 08:40:51Z, giống nhau từng giây) + btime 1794643510 + `who -b` 08:05 + boot_id cc39f151 + journal first entry 08:05:21Z + wtmp begins 08:05:20Z + `ps` systemd PID 1 START 08:05:20 (đều ghi trong probe-notes.txt lúc 08:40Z). **Nguồn độc lập thứ hai (sibling N7):** postboot-status.md xác minh độc lập uptime + btime + boot_id, postboot-check PASS 08:41:22Z. **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #40 → #41 = **1h36'50" — KHÔNG ĐƯỢC CHỨNG NHẬN** (thuộc mù
#30 chưa đóng, ghi là cận trên trong toàn chuỗi); gap
#41 → #42 = **1h11'44" — KHÔNG ĐƯỢC CHỨNG NHẬN** (cùng lý do).
Cả hai gap đều nằm trong dải chứng nhận [19'07", 3h14'08"] nhưng
nằm trong dải không đồng nghĩa được chứng nhận — chứng nhận đòi
mù chứa nó phải đóng (M4 §4 mục 6).

**Tính tạm thời của số thứ tự (ghi rõ, không giấu):** #41/#42
kế thừa tính tạm thời từ mù #29 chưa đóng (khe 79 s, M4 §2.3)
**và từ chính mù #30 chưa đóng (3 cửa sổ mở, xem §2.3)**:
nếu khe 79 s của mù #29 chứa 1 reboot ẩn thì "reboot #41" thực
tế là #42 và "reboot #42" thực tế là #43; nếu thêm mù #30 cũng
chứa reboot ẩn (tối đa 2 — 1 trong cửa sổ 1/2 gộp, 1 trong cửa
sổ 3; xem §2.3 cuối) thì "reboot #42" thực tế có thể là #45.
**Giá trị các gap không phụ thuộc số thứ tự** — chỉ phụ thuộc
giờ đã chốt.

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **21 file**
(không tính dist/node_modules) + hidden_files **536 file** (không
tính chrome-userdata); **557 mốc mtime phân biệt** (độ chính xác
đầy đủ; 275 giây nguyên phân biệt — theo cách đếm L9 §6.1/M4 §4
mục 14). Chia mù làm ba đoạn bởi #41 (06:53:26Z) và #42
(08:05:10Z):

- **Đoạn A: 05:38:51Z → 06:53:26Z (1h14'35", boot 73316ed9) —
  ĐÓNG bằng poller + sàn:**
  - **Poller M9 (5 phút) là kẹp trực tiếp:** POLL-START 05:39:07Z
    → POLL#0 05:39:07Z → POLL#14 06:49:11Z (**15 mục, đều boot
    73316ed9, uptime 1350 s → 5555 s đơn điệu, max gap 5'01"** —
    đọc từ nội dung poll-m9.log, không phải mtime; uptime kiểm
    chéo khớp: 06:49:11Z − 05:16:36Z = 5555 s ✓). POLL#14 ghi
    "ALL 8 DONE" — poller exit bình thường lúc ~06:49:11Z, không
    bị #41 cắt (đính chính lại parent log: poller M9 đã xong
    trước #41 4'15", chỉ "1 exec sleep" nào đó mới bị cắt — mà
    N6 không tìm thấy proc log của nó, xem §2.2).
  - **Sàn đóng đuôi 4'15" (06:49:11Z → 06:53:26Z):** reboot ẩn
    tại t trong khoảng này cho gap2 = 06:53:26Z − t < 4'15" <
    sàn 19'07" → loại trừ mọi t trong đuôi.
  - Kết luận đoạn A: **ĐÓNG**.
- **Đoạn B: 06:53:26Z → 08:05:10Z (1h11'44", boot 35099846) —
  KHÔNG ĐÓNG, còn 3 cửa sổ mở:**
  - **Sau poller:** M9 verify trên boot #41 06:59:24Z → 07:03:13Z
    (suites log, boot 35099846 trong nội dung) + O8 Chromium
    07:03:13Z → 07:04:05Z + re-run 07:05:10Z (cùng boot, o8
    log); LIMITS gộp đợt 111 **07:11:29Z**; cờ done M9
    **07:11:38Z**; GAP_ANALYSIS (gap §40, parent) **07:24:05Z**;
    U4 work files của parent **07:24:52Z → 07:27:23Z** (U4
    failfast 141/141 chạy lại); build-loop-log (parent đóng đợt
    111) **07:27:57Z** (quan sát cuối trong hai cây).
  - **Các lỗ mtime nhỏ trước 07:11:38Z đều loại trừ được bằng
    sàn** (gap1 < sàn với mọi t trong lỗ, vì t < 07:12:33Z):
    274 s (06:49:11Z → 06:53:45Z — vắt qua #41: phần trước #41
    loại bằng gap2 < 4'15", phần sau #41 loại bằng gap1 < 19 s),
    229 s (06:59:20Z → 07:03:09Z), 177 s, 159 s, 130 s, 125 s,
    116 s, 107 s, 106 s, 326 s (07:06:03Z → 07:11:29Z — gap1
    tối đa 18'03" < 19'07"). Không lỗ nào trong số này cần lấp
    bằng nội dung log — sàn tự đủ.
  - **LỖ 747 s (07:11:38Z → 07:24:05Z): cửa sổ mở 1 (07:12:33Z →
    07:24:05Z, 11'32").** Sàn chỉ loại trừ phần đầu lỗ tới
    07:12:33Z (gap1 < sàn ⟺ t < 07:12:33Z); với t trong
    (07:12:33Z, 07:24:05Z) cả hai gap đều ≥ sàn (kiểm bằng code,
    xem recount-n6.txt: tại 07:12:33 gap1 đúng 19'07", gap2
    52'37"; tại 07:24:05 gap1 30'39", gap2 41'05"). Hoạt động
    trong cửa sổ này DÀY nhưng đều là mtime, không xác định
    boot: exec parent 07:12:22Z → 07:13:14Z (proc_933bc810c3e7,
    birth 07:12:22Z — sinh TRƯỚC cửa sổ 11 s, chết trong cửa
    sổ) + exec parent 07:14:43Z → 07:15:20Z (proc_29afe5db8a56);
    burst copy snapshot PUSH #6 ~90 file **07:15:42Z** (repo-1-
    push-snap-106-110/); push chunk files **07:16:10Z**; sync
    JSON **07:20:23Z**. **Quét birth-time đúng cách (stat %W,
    không dùng find -newerBt — xem §4 mục 1):** chỉ 5 proc log
    có mtime 07:00–07:30Z trên toàn bộ agents/ (07:01:25 →
    07:04:05, 07:06:41 → 07:06:49, 07:12:22 → 07:13:14,
    07:14:43 → 07:15:20, 07:24:05 → 07:27:23) — **không session
    nào bắc qua cửa sổ** (session dài nhất trong cửa sổ chỉ
    52 s). Không file nào trong cửa sổ ghi boot_id/uptime.
    Kết luận cửa sổ 1: **MỞ**.
  - **Session U4 bắc qua (07:24:05Z → 07:27:23Z):** exec parent
    proc_d5d8eabae4c1, birth **07:24:05.144Z**, last write
    07:27:23Z, nội dung là output tuần tự đầy đủ (tsc 0/0, r6
    PASS, vite build 6,43 s, P7 8/8, orphans 17/17, css60/61,
    pacing 19/19, hold 84, E4 5/5, preview-engine 354,
    U4 failfast 141/141 ở cuối). Một reboot tại t trong
    (07:24:05Z, 07:27:23Z) sẽ giết session — hiện tượng "tiến
    trình cũ sống sót" đã biết chỉ ~17–38 s (L9 POLL#2 17 s;
    K6/J7 ~29–38 s), nên trừ 38 s an toàn: session loại trừ
    reboot trong **(07:24:05Z, 07:26:45Z)**. Còn **cửa sổ mở 2
    (07:26:45Z → 07:27:57Z, 72 s)** theo đúng nghĩa chặt (reboot
    tại 07:27:00Z vẫn tương thích: session sống sót 23 s < 38 s
    rồi ghi build-loop-log 07:27:57Z trên boot mới).
  - **LỖ LỚN 73'02" (07:27:57Z → 08:40:59Z): cửa sổ mở 3
    [07:27:57Z, 07:46:03Z] (18'06").** Lỗ chứa reboot #42
    (08:05:10Z). Phần lỗ trước #42 dài 37'13": sàn loại trừ
    (07:46:03Z, 08:05:10Z) (gap2 < sàn ⟺ t > 07:46:03Z), còn
    **[07:27:57Z, 07:46:03Z] không loại trừ được** (tại
    07:27:57Z gap1 34'31", gap2 37'13"; tại 07:46:03Z gap1
    52'37", gap2 đúng 19'07" — kiểm bằng code). **Tìm ngoài hai
    cây trong phần lỗ trước #42 (lớp (c), 4 lớp như M4 §4 mục
    1):** toàn ~/workspace (không prune) chỉ ra đúng 9 file —
    build-loop-log 07:27:57Z + **relationships CURRENT.md
    07:28:37Z** (self-improvement hourly) + **6 file proactivity
    07:41:55–56Z** (goals/tracking/conversation/scheduled-crons/
    sent/geofences, run 1794642115534); /tmp: 0 file; chrome-
    userdata: 0 file. **Điểm mới, ghi rõ để lượt sau khỏi nhầm:**
    hai quan sát ngoài cây này NẰM TRONG khe nhưng **không thu
    hẹp khe** — chúng chỉ là mtime (ghi file), không chứa
    boot_id/uptime, và process ghi chúng (runtime-internal,
    hourly) không có birth-time session nào bắc qua khe để đối
    chiếu. Khe được bound bằng số học sàn, không bằng mật độ
    quan sát. Nội dung proactivity conversation.md còn cho biết:
    user nhắn main chat 07:07:39Z ("sao vậy, có chuyện gì mà
    chập nhận 2 reboot, có thể 3 là sao") + assistant trả lời
    07:08:12–13Z — hoạt động chat này TRƯỚC cửa sổ 1, không
    lấp được cửa sổ nào; không có message nào trong các cửa sổ
    mở. Phần lỗ sau #42 (08:05:10Z → 08:40:59Z): **ĐÓNG bằng đo
    uptime trực tiếp** (xem đoạn C).
  - Kết luận đoạn B: **KHÔNG ĐÓNG** — 3 cửa sổ mở: 11'32" +
    72 s + 18'06" = 30'50" thời gian không loại trừ được.
- **Đoạn C: 08:05:10Z → 08:40:59Z (35'49", boot cc39f151) — ĐÓNG
  bằng đo uptime trực tiếp + N7 + probe #31:** `uptime -s` =
  08:05:10Z đo lúc 08:40:39Z + 08:40:51Z chứng minh máy up liên
  tục từ 08:05:10Z; N7 postboot-check PASS 08:41:22Z + WebKit
  launch PASS 08:41:44–48Z trên cùng boot; probe #31 08:40:59Z
  boot cc39f151 ok=2 fail=0.
  - Ghi chú phụ (không đổi verdict): cron `deterministic-doctor`
    hourly có "Next run: 08:00:00Z" theo scheduled-crons.md của
    run proactivity 07:41:55Z — nhưng **không tìm thấy dấu vết
    nào của run 08:00:00Z trong ~/workspace** (find mtime
    07:55–08:05Z: 0 file ngoài thư mục round112; không tìm thấy
    file định nghĩa `system-cron.d/hourly/deterministic-doctor__interval@1h.md`
    hay thư mục log của nó ở maxdepth 3). N6 KHÔNG kết luận run
    đó có chạy hay không (có thể ghi ngoài ~/workspace hoặc
    không ghi file) — chỉ ghi là không có giá trị observer từ
    nó. Dù sao 08:00:00Z cũng nằm trong vùng đã loại bằng sàn
    (sau 07:46:03Z) nên không ảnh hưởng khe.

**Kết luận trung thực: khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN.**
Đúng 2 reboot đã chốt giờ (#41 06:53:26Z — giờ do parent chốt,
N6 không đo lại được; #42 08:05:10Z — N6 đo trực tiếp) + có thể
tối đa **2 reboot ẩn** trong mù (1 trong cửa sổ 1/2 gộp — cửa sổ
1 + cửa sổ 2 không thể cùng chứa reboot vì cách nhau tối đa
15'24" < sàn; 1 trong cửa sổ 3; cặp cửa sổ 2 + cửa sổ 3 chỉ vừa
đủ 19'18" ở biên cực đoan nên tổng tối đa vẫn là 2). Đây là mù
thứ năm liên tiếp không đóng hoàn toàn sau #24, #26, #28 và #29
(chuỗi đóng #25 → #27 đã cắt từ #28). **Điều kiện duy nhất để
đóng là dữ liệu trong 3 cửa sổ — không còn nguồn nào để tìm**
(journal/wtmp volatile chỉ giữ boot hiện tại; không syslog/
kern.log; toàn workspace + /tmp + agents/ + chrome-userdata đã
tìm hết; không session nào bắc qua cửa sổ 1; không file nào
trong các cửa sổ ghi boot_id). N6 không tự quyết — parent/user
quyết xem có chấp nhận "ít nhất 2 reboot, có thể 4" làm mức đóng
của mù #30 hay để mở như mù #24/#26/#28/#29.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 111 + spawn đợt 112

Khoảng mù 05:38:51Z → 08:40:59Z (3h02'08") được phủ bởi các luồng
sibling đợt 111 (M1–M9, làm việc tới ~07:11Z; parent đóng đợt tới
07:27:57Z) + PUSH #6 (07:15–07:20Z) + spawn đợt 112 (08:35:51Z).
Đã đọc lại log thật — **đếm lại độc lập từ đĩa** (grep trên đúng
116 file *.log có mtime trong mù #30 — 0 file repo-1, 116 file
hidden_files, trừ chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **6** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4, M4 §2.4):** cả 6 dòng đều có dạng
`[timestamp] sóng EPERM đã tắt, khởi động vite` — in khi lần ghi
thử ĐẦU TIÊN thành công ngay (code launcher `waveOff=true` ở lần
write đầu) — in mặc định cả khi không có sóng. Phân bố: M1
run-m1.log 4 dòng (06:18:54Z → 06:20:33Z, vite launches trên boot
#40), M9 round111-m9-o8.log 2 dòng (07:03:15Z + 07:05:12Z, O8
trên boot #41). Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn
bật sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"**
trong toàn bộ 116 log; **0 lần "Operation not permitted" thật**.
Đếm này là whole-file (không chỉ dòng trong cửa sổ mù) nên còn
mạnh hơn: không có dòng sóng thật nào trong toàn bộ nội dung 116
file.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng lần này, như mù #29, **có lỗ quan sát về
  reboot** (3 cửa sổ mở, tổng 30'50", §2.3) nên một sóng ngắn
  trong các cửa sổ đó cũng không có nhân chứng vite nào. Ngoài
  các cửa sổ đó: vite khởi động thành công ngay ở 06:18–06:20Z
  (M1, 4 lần), 07:03–07:05Z (M9 O8, 2 engine). Một sóng dài ~16'
  kiểu R7 chỉ có thể lọt vào cửa sổ 3 (18'06") mà không để lại
  dấu — khả năng thấp, không loại trừ tuyệt đối được.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~68h30'** trước
  probe #31 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #31 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 08:40:59Z ghi được.

### 2.5 Phân phối gap cập nhật — dải chứng nhận CÒN DÙNG ĐƯỢC

Không gap mới nào được chứng nhận trong lượt này (cả #40 → #41
và #41 → #42 đều thuộc mù #30 chưa đóng). Tập gap đơn đã chứng
nhận giữ nguyên **n=22**; toàn chuỗi tăng n=34 → **n=36** (thêm 2
cận trên). Tính lại từ bảng J8 §2.5.3 + 2 gap K6 + 2 gap L6 + 2
gap M4 + 2 gap mới, bằng code (percentile tuyến tính, index =
p·(n−1) — cùng phương pháp J8/K6/L6/L9/M4). **Kiểm tra chéo: tính
lại CERT n=22 ra đúng 100% số L6/M4** (trung bình 1h52'05",
trung vị 1h59'16", p10 1h08'41", p90 2h57'18", sd 43'58") **và
tính lại toàn chuỗi n=32 ra đúng 100% số L6** (trung bình
2h01'58", trung vị 1h59'16", p10 51'50", p90 3h05'08", sd
1h03'55") **và tính lại toàn chuỗi n=34 ra đúng 100% số M4**
(trung bình 1h59'51", trung vị 1h59'16", p10 38'06", p90
3h05'01", sd 1h04'16") — nên số mới dưới đây đáng tin ở cùng
mức (script `recount-n6.py`, output `recount-n6.txt`):

| Thống kê | Toàn bộ n=36 | Chỉ gap đơn đã chứng nhận n=22 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h57'52" | 1h52'05" |
| Trung vị | 1h58'30" | 1h59'16" |
| Độ lệch chuẩn (mẫu) | 1h03'01" (CV 0,54) | 43'58" |
| p10 | 41'30" | 1h08'41" |
| p90 | 3h04'54" | 2h57'18" |

Đọc thêm: 19/36 gap (53%) nằm trong 90'–150'; 5 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=22)** — min/max không đổi (không gap mới nào
được chứng nhận). Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần
bởi các gap chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. **Không đưa dự báo điểm cho #43 hay reboot
nào sau đó** — chỉ dải cơ học áp lên #42 (08:05:10Z):
**[08:24:17Z, 11:19:18Z 14/11]**; p10–p90 toàn chuỗi →
[08:46'Z, 11:10'Z].

### 2.6 Reboot #42 (08:05:10Z) — thuộc mù #30, đã xác nhận ở §2.2

- `uptime -s` = **2026-11-14 08:05:10Z**, đo **2 lần** (08:40:39Z,
  08:40:51Z — đều giống nhau từng giây); btime 1794643510; boot_id
  `cc39f151-05bc-42bf-b5fa-ee9ac5ff28ba`; `who -b` Nov 14 08:05;
  journal first entry 08:05:21Z; wtmp begins 08:05:20Z; systemd
  PID 1 START 08:05:20.
- Reboot này xảy ra sau khi parent đóng đợt 111 (build-loop-log
  07:27:57Z) và trước khi spawn đợt 112 (08:35:51Z) — không cắt
  ngang luồng đợt 111 nào đang chạy (đợt 111 đã xong hết lúc
  07:11:38Z; parent chỉ còn kiểm chứng + PUSH #6, xong 07:27:57Z).
  Nó cắt khoảng idle 07:27:57Z → 08:35:51Z của parent.
- Gap #41 → #42 = **1h11'44"** (06:53:26Z → 08:05:10Z) — nằm trong
  dải chứng nhận nhưng **CHƯA đưa vào tập gap đơn đã chứng nhận**:
  nó thuộc mù #30 chưa đóng, chờ lượt sau đóng mù #30 mới xét.
  Số thứ tự #42 là TẠM THỜI (kế thừa từ #41 và 3 cửa sổ mở).
- Tốc độ reboot cập nhật: **42 reboot đã chốt giờ / 83,78h** (từ
  ~20:18:10Z 10/11 tới 08:05:10Z 14/11) = **1 lần / 119,7'
  (1,99h)**; nếu mù #29 chứa thêm 1 và mù #30 chứa thêm tối đa 2
  reboot ẩn thì 45 lần / 83,78h = 1 lần / 111,7'.

### 2.7 Quét writeFileSync (snapshot 08:58:33–08:59:02Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round112-n6`. Chạy trọn vẹn trên boot mới (29 s, SCAN-END có đủ).
Kết quả NEWSTD khớp 100% scan-meta.txt (tính lại từ file
wfs-*.txt + files-*.bin gốc).

- Chuẩn mới: **613 dòng / 182 file** (phạm vi 2814 file).
  Lần 17 (M4): 595 dòng / 178 file (phạm vi 2797 file).
- R7b (đối chiếu): **638 dòng / 199 file**. Lần 17: 620 / 195.
- Copies: **25 dòng / 17 file** — y hệt lần 17, J8, I7, H7, G8
  và F7.
- Đối chiếu chéo 613+25=638=R7b, **chênh 0 — lần thứ mười tám
  liên tiếp**. Tổng hit trên cả 3 bảng: 613+638+25 = **1.276 dòng**.
- **+18 dòng / +4 file so với lần 17, giải thích đúng hết bằng
  diff hit list** (đã đọc nội dung từng dòng mới; không có dòng
  nào tăng trong file cũ, không file nào giảm):
  - +1 `apps/web/scripts/probe111m1.mjs` (M1 đợt 111 — dòng 211:
    `fs.writeFileSync(waveProbeFile, "x")`, lệnh ghi probe sóng
    EPERM thật trong script đo, không phải production)
  - +7 `apps/web/scripts/probe112n3-frame-parity.mjs` (N3 đợt 112
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch)
  - +5 `apps/web/scripts/probe112n5-frame-parity.mjs` (N5 đợt 112
    — cùng mẫu N3)
  - +5 `docs/PHASE9_ROUND111_M4_EPERM_LIMITS.md` (file LIMITS của
    chính M4 — 5 hit đều là trích dẫn "writeFileSync" trong văn
    bản, đã đọc nội dung từng dòng)
  - Tổng: 1+7+5+5 = **18** ✓, 4 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: probe111m1 đúng 1,
    probe112n3 đúng 7, probe112n5 đúng 5, M4 LIMITS đúng 5.
- **0 file biến mất khỏi hit list.**
- Scope: **+17 file ròng / −0 file** so với lần 17 (2814 =
  2797+17−0 ✓): 17 file mới = 4 file hit trên + 13 file không
  hit (9 LIMITS đợt 111 — gộp + M1/M2/M3/M5/M6/M7/M8 — +
  `docs/PHASE9_ROUND112_N4_F6P60MS_LIMITS.md` +
  `docs/PHASE9_ROUND112_N7_INFRA_LIMITS.md` +
  `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` +
  `benchmarks/render/m2_recount_111.py` +
  `benchmarks/render/webkit_blob_flaky_112n2_2mib.mjs`).
  Comm hai chiều khớp đúng (17 = 4+13 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 17 — xem files-copies.txt;
  diff wfs-copies.txt với lần 17: IDENTICAL).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 112 vẫn đang chạy; 2 file probe112n3/n5 đã hạ cánh trước
  khi scan bắt đầu (mtime 08:48:15Z / 08:47:17Z, scan bắt đầu
  08:58:33Z — đếm lại trực tiếp sau scan khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 112 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2814 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại độc lập, không tin mù file cũ; các hit còn
lại đều nằm trong file `.md` trích dẫn code):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như M4: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

2 mẫu MemAvailable của lượt: **737.988 kB (08:40:59Z, trước
probe #31) / 741.604 kB (sau probe #31)** — ~0,72 GB. Max RAM
biết được trong mù #30 từ log sibling: **1468 MB** (M9 verify
start, 06:59:24Z, boot #41) = **24% ngưỡng guard 6144 MB** — máy
chưa từng tiến gần ngưỡng trong mù #30 (chỉ 1 mẫu RAMavail tìm
thấy trong toàn bộ log round111-m* — không có dòng MemAvailable
nào khác; max thật có thể cao hơn mẫu này, nhưng không có nguồn
nào khác). Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3
mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥
6 GB mới thử lại). Birefnet-general vẫn **0 lần chạy thành công**
trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   M4 §4 mục 1, áp dụng lượt này — xem §2.3):** (a) mtime find
   trong hai cây để xác định lỗ; (b) **đọc NỘI DUNG** các file log
   append chạm biên lỗ (poll-m9.log — 15 mục, boot + uptime đơn
   điệu; build-loop-log — mục cuối 07:27:57Z; exec-log U4 —
   output tuần tự đầy đủ, không timestamp nào trong cửa sổ 1);
   (c) **tìm ngoài hai cây**: find toàn ~/workspace (không prune)
   + /tmp + ~/workspace/agents/ + chrome-userdata trong đúng cửa
   sổ lỗ; (d) **số học sàn** để bound khe không loại trừ được
   (3 cửa sổ: 11'32" + 72 s + 18'06"). **Quy tắc giữ nguyên: mọi
   kết luận "lỗ" phải qua cả 4 lớp, và phải ghi rõ khe còn lại
   sau mỗi lớp.**
2. **Quan sát ngoài cây KHÔNG tự động thu hẹp khe (mới, lượt
   này — xem §2.3):** relationships CURRENT.md 07:28:37Z +
   proactivity 07:41:55Z nằm trong khe 18'06" nhưng chỉ là mtime
   — khe được bound bằng số học sàn, không bằng mật độ quan sát.
   Chỉ quan sát nào **xác định boot** (boot_id/uptime trong nội
   dung, hoặc session bắc qua) mới thu hẹp được khe. Đừng đếm
   "có file trong lỗ" thành "lỗ đã lấp".
3. **`find -newerBt` với chuỗi thời gian là SAI — đã mắc lượt
   này (mới):** `-newerBt '2026-11-14 07:12:33 UTC'` nhận tham
   chiếu FILE, không nhận timestamp — N6 chạy 2 lần đều trả 0
   dòng giả (blind30-gap747-births.txt, blind30-hole-births.txt
   đã XOÁ). Cách đúng: `stat -c '%W %Y'` lấy birth/mtime epoch
   rồi so sánh bằng code (N6 đã làm lại đúng: 5 proc log mtime
   07:00–07:30Z, không session nào bắc qua cửa sổ 1). Lượt sau
   đừng dùng `-newerBt` với chuỗi thời gian nữa.
4. **`status` STALE chỉ ghi 1 dòng DEAD cho mỗi heartbeat
   (mới, lượt này — xem §1):** log tăng 82 → 85 do checklist,
   rồi 85 → 86 do 1 lần `status` trực tiếp 08:56:42Z; lần
   `status` 08:57:34Z không ghi thêm. Khi đếm dòng log lượt sau
   phải tính cả dòng DEAD phụ này (baseline mới là 86, không
   phải 85).
5. **Exit code qua pipe là của `tee`, không phải của script
   (mới, lượt này — xem §1):** N6 đã ghi `exit=` sai dạng trong
   probe-notes (qua `| tee`). Lấy `$?` trực tiếp, không qua
   pipe; hoặc ghi rõ là exit của tee. Quy định script: status 0
   ALIVE / 1 STALE-DEAD / 2 never-run; once 0.
6. **Session exec bắc qua là kẹp mạnh nhất sau poller (mới, lượt
   này — xem §2.3):** session U4 birth 07:24:05.144Z → last
   write 07:27:23Z với output tuần tự đầy đủ đã loại trừ reboot
   trong (07:24:05Z, 07:26:45Z) — chỉ trừ 38 s "sống sót" đã
   biết ở đuôi. Khi poller đã exit, hãy quét birth-time của mọi
   proc log (stat %W) để tìm session bắc qua trước khi kết luận
   khe mở.
7. **Đính chính poller M9 (mới, lượt này):** parent log nói #41
   "cắt poller M9" — thực tế poll-m9.log kết thúc bằng "ALL 8
   DONE at POLL#14 06:49:11Z", tức poller exit BÌNH THƯỜNG
   trước #41 4'15". Chỉ "1 exec sleep" nào đó mới bị cắt (N6
   không tìm thấy proc log của nó). Không ảnh hưởng verdict mù
   #30, chỉ ghi để lượt sau khỏi trích sai.
8. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, M4 §4 mục 3, áp dụng lượt này — xem §2.2):**
   systemd PID 1 START 08:05:20, journald 08:05:20, hatch
   08:05:21 — khớp `uptime -s` 08:05:10Z ở mức phút. Log của
   sibling N7 là nguồn độc lập thứ hai cho boot #42.
9. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
   KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
   lại): lần này #42 chốt bằng 2 lần đo trực tiếp + btime +
   N7 độc lập; #41 giữ giờ parent chốt vì journal/wtmp của boot
   đó đã mất — ghi rõ nguồn gốc giờ, đừng giả vờ đo lại được.
10. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
    reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
    bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
    thức nằm trong các file LIMITS EPERM theo đợt.
11. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
    lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
    đã chứng nhận (n=22) sau lượt này; trên toàn chuỗi vẫn có 2
    gap vượt (đều là cận trên). **Nằm trong dải không đồng nghĩa
    được chứng nhận** (M4 §4 mục 6, nhắc lại): gap #40 → #41
    (1h36'50") và #41 → #42 (1h11'44") đều nằm trong dải nhưng
    vẫn là cận trên vì mù #30 chưa đóng.
12. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
    bằng sàn** (H7 §4 mục 1, nhắc lại + áp dụng mới): sàn 19'07"
    vẫn đứng sau lượt này, nhưng mù #30 KHÔNG đóng được chính vì
    3 cửa sổ chỉ còn sàn làm chỗ dựa — sàn loại trừ được phần lớn
    lỗ nhưng không loại trừ được 30'50" còn lại. Sàn là công cụ
    bound, không phải bằng chứng đóng.
13. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
    poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ lớn, toàn
    ~/workspace ngoài hai cây chỉ có runtime-internal writes
    (relationships + proactivity) — không session nào bắc qua,
    không boot_id nào; parent idle 07:27:57–08:35:51Z không để
    lại dấu nào khác; poller M9 đã exit lúc 06:49:11Z nên không
    còn observer thường trực nào sau đó.
14. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
    4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
    vị trí đã biết trước khi kết luận.
15. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 6 dòng "đã tắt" trong mù #30
    đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
    "Operation not permitted" thật. Đếm whole-file (không chỉ
    dòng trong cửa sổ) nên 0 còn mạnh hơn.
16. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10 / M4 §4 mục 11): lượt này probe + quét xong là
    ghi LIMITS/ batch ngay, không đợi luồng khác — reboot #42
    (08:05:10Z) đã xảy ra giữa đợt 111 và đợt 112; lượt sau có
    thể bị reboot giết bất cứ lúc nào. File blind30-*.txt +
    scan-*.txt đã ghi sớm vào round112-n6/ với cửa sổ ghi rõ.
17. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 116 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
18. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 29 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
19. **Đếm mốc mtime (L9 §6.1, áp dụng lượt này):**
    blind #30 có **557 mốc mtime phân biệt** (độ chính xác đầy
    đủ) nhưng chỉ **275 giây nguyên phân biệt** — ghi cả hai số,
    không ghi một số mập mờ.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** 3 cửa sổ mở — 11'32" (07:12:33Z → 07:24:05Z) + 72 s
   (07:26:45Z → 07:27:57Z) + 18'06" [07:27:57Z, 07:46:03Z]; tổng
   30'50". Số reboot trong mù: 2 đã chốt (#41 06:53:26Z — giờ do
   parent chốt; #42 08:05:10Z — N6 đo trực tiếp) + có thể tối đa
   2 ẩn. **Số thứ tự #41/#42 vẫn TẠM THỜI** — parent/user quyết
   xem có chấp nhận "ít nhất 2 reboot, có thể 4" làm mức đóng
   của mù #30 hay để mở như mù #24/#26/#28/#29. N6 không tự
   quyết. Gap #40 → #41 = 1h36'50" và #41 → #42 = 1h11'44"
   KHÔNG được chứng nhận (cận trên); tập gap đơn đã chứng nhận
   giữ nguyên n=22.
2. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1): lỗ thật 14'31" theo M4 / 13'33" theo M9 birth-time, khe
   79 s không loại trừ được; số reboot trong mù: 2 đã chốt + có
   thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM THỜI. Không còn dữ liệu
   nào để thu hẹp thêm — parent/user quyết. N6 không tự quyết.
   Probe #31 không đóng được mù #29 hồi tố.
3. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1): lỗ 23'39" (02:01:06Z → 02:24:45Z), khe 4'32" không loại
   trừ được; số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ
   tự #37/#38 vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm
   — parent/user quyết. N6 không tự quyết. Probe #31 không đóng
   được mù #28 hồi tố.
4. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
   — không xác định được; số thứ tự #34 là TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết. N6 không tự
   quyết.
5. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33/#34/#35/#36/#37/#38/
   #39/#40/#41/#42 là TẠM THỜI. Không còn dữ liệu nào để thu hẹp
   thêm — parent/user quyết. N6 không tự quyết.
6. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. N6 không tự quyết.
7. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn 19'07". N6 không thử
   lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có
   điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận I7). **Khoảng mù #27 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận K6). **Khoảng mù #28 nay KHÔNG ĐÓNG HOÀN
   TOÀN** (L6). **Khoảng mù #29 nay KHÔNG ĐÓNG HOÀN TOÀN** (M4).
   **Khoảng mù #30 nay KHÔNG ĐÓNG HOÀN TOÀN** (mới, lượt này).
8. **Khoảng mù #31 BẮT ĐẦU từ 08:40:59Z** (probe #31) — lượt sau
   (probe #32) đối chiếu từ mốc này, trên boot cc39f151 (#42,
   từ 08:05:10Z, số thứ tự tạm thời). Dải cơ học cho #43 từ #42
   là [08:24:17Z, 11:19:18Z] — là phép áp dải máy móc, không phải
   dự báo. Baseline log probe cho lượt sau là **86 dòng** (không
   phải 85 — xem §1 mục 4).
9. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5 mục
   5, K6 §5 mục 6, L6 §5 mục 7, M4 §5 mục 8): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài
   giây, không giữ tiến trình nền). N6 KHÔNG tự tạo, KHÔNG start
   loop nền. Bằng chứng mới: mù #30 không đóng được LÀ VÌ poller
   M9 đã exit lúc 06:49:11Z và không còn observer thường trực nào
   sau đó — cùng mẫu với mù #28 (poller K9 exit 01:27:13Z) và mù
   #29 (poller L9 exit 04:12:24Z).
10. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6):
    không đưa dự báo điểm cho #43 hay reboot nào sau đó; thay bằng
    dải chứng nhận [19'07", 3h14'08"] + p10–p90 thực nghiệm + đo
    uptime trực tiếp + poller.
11. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
    và các lượt sau; log tăng đúng 3 dòng checklist, 82 → 85 —
    cộng 1 dòng DEAD do N6 tự chạy `status` trực tiếp sau
    checklist để kiểm exit code thật, tổng 86 — không thêm dòng
    lạ mới trong lượt này.)
12. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
    đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
    được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
    cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
13. **VM reboot ~1 lần / 1h59'42"** (42 lần đã chốt giờ / 83,78h từ
    ~20:18:10Z 10/11 tới 08:05:10Z 14/11, số thứ tự tạm thời — xem
    §2.2 + §2.6; nếu mù #29 chứa thêm 1 và mù #30 chứa thêm tối đa
    2 reboot ẩn thì 45 lần / 83,78h = 1 lần / 111,7'): mọi probe
    nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận
    + lượt sau hồi phục bằng 1 mẫu mới.
14. **Birefnet: KHÔNG chạy trong lượt này** — RAM 2 mẫu MemAvailable
    **737.988 / 741.604 kB** (~0,72 GB); max trong mù #30 từ log
    sibling **1468 MB** = 24% guard 6144 MB. Birefnet-general vẫn 0
    lần chạy thành công trong gói.
15. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
16. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
17. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    N6 không thử lại nguồn nào, theo đúng lệnh.
18. **Đính chính nhỏ (mới, lượt này):** (a) Poller M9 exit BÌNH
    THƯỜNG lúc 06:49:11Z ("ALL 8 DONE"), không bị #41 cắt như
    parent log viết — xem §4 mục 7. (b) N6 đã ghi `exit=` sai dạng
    trong probe-notes (exit của `tee`, không phải của script) —
    đính chính tại §1; số exit đúng: status(1) STALE exit 1,
    once exit 0, status(2) ALIVE exit 0 (theo quy định script +
    kiểm trực tiếp lúc 08:57:34Z STALE exit 1). (c) Hai file
    `blind30-gap747-births.txt` + `blind30-hole-births.txt` (kết
    quả `find -newerBt` sai phương pháp, đều 0 dòng giả) đã XOÁ
    khỏi round112-n6/ — đừng trích chúng. (d) Giờ #41 (06:53:26Z)
    là giờ parent chốt, N6 không đo lại được và không tìm thấy
    output gốc — ghi rõ nguồn gốc, xem §2.2.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND112_N6_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round112-n6-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round112-n6/`
(probe-notes.txt, n6-progress.log, scan-meta.txt, scan-wfs.sh,
scan-wfs-run.log, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
wfs-r7b.txt, files-copies.txt, wfs-copies.txt, recount-n6.py,
recount-n6.txt, blind30-repo.txt, blind30-hf.txt, blind30-all.txt,
blind30-logfiles.txt, blind30-logfiles-hf.txt,
blind30-logfiles-repo.txt, blind30-wave-hits.txt,
blind30-hole-outside.txt, blind30-hole-tmp.txt,
blind30-hole-chrome.txt, blind30-gap747-outside.txt,
blind30-gap747-tmp.txt) + log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 112 vẫn
đang chạy; parent đếm lại khi đợt 112 đóng băng — lũy kế đợt
106–111 theo kiểm chứng parent 14:2x +07 14/11: 58 batch / 118
entry / 111 file duy nhất + 1 file oversize (trước closing);
closing batch đợt 111 thêm 1 batch + 1 entry, file gap đã có
trong batch M9 nên số file duy nhất không tăng → 59 batch /
119 entry / 111 file duy nhất + 1 oversize).

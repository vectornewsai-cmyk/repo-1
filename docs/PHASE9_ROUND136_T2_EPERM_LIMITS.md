# PHASE9 ROUND136 T2 — EPERM: probe #55 ok=2 fail=0 + mù #55 HỞ đoạn B (tối đa 2 ẩn) + gap #90?→#91? CHỨNG NHẬN DẠNG KHOẢNG + CERT n=54 / FULL n=69 + mù #53 B RECHECK KHÔNG ĐỔI + RAM chạm 97,4% guard

> Luồng T2, đợt 136 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07
> 18/11/2026; làm việc 05:40Z → ~06:10Z 18/11/2026).
> Nhiệm vụ: probe #55 theo lịch thường lệ + mù #55 (từ probe #54) +
> recheck mù #53 B (brief giao) + chuỗi reboot (2 reboot mới #91?/#92?)
> + quét sóng EPERM + WFS lần 42. Quyết parent đợt 135 §12.3: (a) KHÔI
> PHỤC FIX T3 preview.tsx 530e10a7 (GIỮ) — đợt 136 đo lượt yên #13 bằng
> logger nới; (b) khung chết #90? bản hẹp (03:32:23Z, 03:35:20Z] làm
> chuẩn; (c) gap #90?→#91? INSIDE dải: ghi nhận; (d) giao T8 điều tra
> chung ba lần kẹt; (e) mù #55 + #53 B: giữ lịch probe thường lệ;
> (f) CHẤP NHẬN đóng đợt 135 9/9. Prereg viết TRƯỚC khi đo:
> hidden_files/round136-t2/prereg-t2.md. **Prereg có 2 dự báo SAI**
> (RAM max + mốc cuối đoạn B — xem §4; các dự báo verdict còn lại đúng
> hoặc ghi rõ "chưa rõ" / "chưa quyết"). KHÔNG push, KHÔNG release/tag,
> KHÔNG binary, KHÔNG workflow, KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG
> kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN TOÀN đợt 128) / mù #46 đoạn A /
> mù #45 đoạn G1 / mù #44 đoạn D / mù #40 đoạn B / mù #43 / mù #42
> đoạn B** (quyết parent đợt 124 §12.3 + §12.4, đợt 125 §12(h),
> đợt 126 §12(h), đợt 127 §12(c)). **Mù #50 ĐÃ ĐÓNG HOÀN TOÀN đợt 131
> — KHÔNG kiểm lại. Mù #49 B: KHÔNG kiểm lại thường lệ** theo quyết
> parent đợt 132 §12.3(d). **Mù #51 B: KHÔNG kiểm lại đợt này** (đã
> kiểm 3 lần, verdict ổn định, không có bằng chứng mới).
> **KHÔNG có reboot giữa phiên T2 lượt này** — boot 1ca1feaa từ lúc mở
> (05:40Z) tới lúc đóng (~06:10Z). Mù #56 MỚI MỞ từ probe #55 — việc
> của T2 đợt 137.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (05:50:26Z):** `status`
  báo **DEAD/STALE** (heartbeat age 11.103 s, last #54 02:45:23Z, boot
  78b55838, exit 1); `once` ngay sau đó là **probe #55, boot
  1ca1feaa, ok=2 fail=0**, exit 0, 05:50:26Z; `status` chạy lại
  **ALIVE** (age 0 s, n=55), exit 0. Log v2 tăng đúng **3 dòng**
  (154 → 157) — **như mọi lượt trước**; prereg §3 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=55, ts 05:50:26Z, boot 1ca1feaa.
- **Boot #92? (tạm) lúc 05:29:18Z, boot
  `1ca1feaa-af3b-41dc-aaae-34376329b0a3`** — xác minh bằng `uptime -s`
  + btime 1794979758 + `who -b` + journal 1 boot (xem §1). **Brief
  ghi "~05:29:34Z" là GIỜ FIRST ENTRY của journal (05:29:34Z), chậm
  hơn btime thật 16 s — KHÔNG phải btime** (xem §1 + §2.2).
  Clock VM hiện tại: HTTP `Date` cả 3 server đều hơn local **+1 s**
  → **F92? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
- **Đáp án câu hỏi của brief — brief NHẦM BOOT, không có dự báo sai:**
  btime ~05:29Z là của boot hiện tại 1ca1feaa = **#92?**, không phải
  #91?. #91? là bcc71e61, btime **03:35:20Z — NẰM TRONG dải dự báo
  [02:54:47Z, 04:53:38Z]** (T10-135 đã chốt; code kiểm lại). Boot
  #92? cũng **NẰM TRONG dải của nó [04:02:40Z, 06:01:31Z]**.
  Chuỗi INSIDE nay là 4 lần liên tiếp (#89?/#90?/#91?/#92?) sau cụm
  4 lần OUTSIDE (#85?–#88?).
- **Khoảng mù #55 (02:45:23Z → 05:50:26Z 18/11, 3h05'03" =
  11.103 s) — HỞ ĐOẠN B, tối đa 2 ẩn (quy ước) / 3 ẩn (cộng dồn).**
  Đoạn A ĐÓNG (merged 108 mốc, lỗ lớn nhất 252 s); đoạn B MỞ
  (merged 61 mốc, lỗ lớn nhất **2.843 s** 04:41:55Z → 05:29:18Z
  theo 4 phạm vi — **2.811 s** tính thêm ~/agents sessions, xem
  §2.4 phát hiện 4 — + lỗ lớn thứ hai **1.368 s** 04:19:07Z →
  04:41:55Z — cả hai đều vượt sàn 1.147 s); đoạn C ĐÓNG (merged
  72 mốc, lỗ lớn nhất 381 s + uptime trực tiếp). Merged 242 mốc giây. Chuỗi mù đóng hoàn toàn
  dừng ở #54 (chuỗi: #50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng,
  **#55 hở**).
- **Gap #90?→#91? = [4.063 s, 4.083 s] (mid 4.073 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn A mù #55 đóng (merged) + đoạn G mù #54 đóng
  bằng uptime. **CERT n=53 → n=54 / FULL n=68 → n=69.**
- **Gap #91?→#92? = 6.838 s GIỮ SPAN** (đoạn B mù #55 mở).
- **Gap #83?→#84? = 6.318 s GIỮ SPAN — recheck mù #53 B KHÔNG ĐỔI:**
  merged đoạn B vẫn lỗ lớn nhất **4.227 s**, tối đa 3 ẩn, **0 mốc
  mới trong lỗ** (20 mốc mất chỉ do mtime các file bị viết lại sau
  lần quét đợt 134 — xem §2.6).
- **Khung chết 2 boot mới:** #90? chuẩn parent (03:32:23Z,
  03:35:20Z] (177 s) VẪN ĐỨNG — merged tìm được mốc muộn hơn
  **03:34:51Z** (exec-log 0 byte, runtime spawn ngay trước reboot)
  → **ứng viên khung hẹp (03:34:51Z, 03:35:20Z] (29 s), chờ parent
  xác nhận** (xem §2.2 — không tự thay chuẩn); #91? ứng viên
  **(04:42:27Z, 05:29:18Z] (2.811 s)** — mốc cuối là session
  proactivity (jsonl + sessions.json, agent 906cd2df) 04:42:27Z,
  hẹp hơn mốc merged 4 phạm vi (04:41:55Z) và mốc T6 đọc lúc đầu
  (04:42:10Z — lần ghi giữa chừng, file được ghi thêm 04:42:27Z);
  không còn file nào muộn hơn trong ~/agents + ~/memory +
  ~/dreams + ~/side-chats trước btime (xem §2.4 phát hiện 4).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 69 file
  *.log có mtime trong mù #55 (0 file repo-1, 69 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **9 match thô / 9 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher + 1 dòng tên file trong log T2-135). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** — **~161,7h** trước probe #55. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 42: 901 dòng / 251 file** (phạm vi 3.126
  file); R7b đối chiếu 926 dòng / 268 file; copies 25 dòng / 17
  file — y hệt lần 41 về copies. Đối chiếu chéo 901+25=926=R7b,
  **chênh 0 — lần thứ bốn mươi hai liên tiếp**. +5 dòng / +2 file so
  với lần 41, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #55 **5.985 MB** (T4 poll #4,
  05:44:42Z, đoạn C) = **97,4% ngưỡng guard** — **chỉ thiếu 159 MB
  nữa là chạm guard 6 GB**; đoạn A max **1.711 MB** (02:54:23Z);
  đoạn B **0 mẫu script + 1 mẫu văn xuôi 475 MB** (T10 suite start
  03:52:14Z trên bcc71e61). **Birefnet KHÔNG chạy — 5.985 MB vẫn
  DƯỚI guard** (quyết §12.7 vẫn đứng: chỉ thử lại khi một probe quan
  sát được available ≥ 6 GB). MemAvailable trực tiếp lượt này:
  3.311 MB lúc 05:49:44Z; 3.490 MB lúc 05:50:47Z; 2.160 MB lúc
  06:10:14Z (đang giảm khi các luồng đợt 136 chạy).
- **preview.tsx ĐÃ KHÔI PHỤC fix 530e10a7** (md5 530e10a7, đúng quyết
  parent đợt 135 §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1;
  vite.config.ts KHÔNG ĐỔI ee80d093. T2 không sửa production file nào.
- **Replay boot #92? (bracket của T2, đọc 05:49Z — ĐỦ 3 chi tiết
  trong CÙNG một lần đọc, bài học T2-134 §4 mục 4): 1.545 dòng /
  221 installs / 462 configure**, gói đầu libaspell15 05:42:34Z,
  gói cuối gstreamer1.0-tools 05:45:44Z (boot +16m26s),
  gstreamer1.0-gl 05:42:50Z, configure đầu 05:42:34Z — cùng hình
  dạng baseline #82?/#83?/#84?/#90?.
- **Đợt 136 lúc T2 đóng (~06:10Z 18/11):** các luồng khác đang chạy
  (round136-t1/t4/t5/t6/t9 có file mới trong đoạn C); boot hiện tại
  #92? (kiểm 06:10:14Z). Hạn cứng T10 đóng sổ: 08:00Z 18/11 (theo
  round-in-progress.md). T2 KHÔNG mở Xvfb (không cần) nên không có
  gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 05:49:44Z | boot_id `1ca1feaa-af3b-41dc-aaae-34376329b0a3`; `who -b` Nov 18 05:29; `uptime -s` **2026-11-18 05:29:18**; btime **1794979758 = 2026-11-18T05:29:18Z**; journal chỉ 1 boot (1ca1feaa, first entry 05:29:34Z, last 05:49:12Z lúc kiểm tra). MemAvailable 3.390.420 kB lúc 05:49:44Z. |
| Đo F92? (HTTP Date, 3 server) | 05:49:44–05:49:48Z | example.com Date 05:49:46Z vs local_after 05:49:45Z (+1 s); google.com Date 05:49:47Z vs local_after 05:49:46Z (+1 s); cloudflare.com Date 05:49:48Z vs local_after 05:49:47Z (+1 s) → **F92? ≈ −1 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới. |
| Đọc dpkg.log bracket #92? | 05:49Z | **1.545 dòng / 221 installs / 462 configure**; gói đầu libaspell15 05:42:34Z; gói cuối gstreamer1.0-tools 05:45:44Z (boot +16m26s); gstreamer1.0-gl 05:42:50Z; configure đầu 05:42:34Z; startup packages configure 05:35:43Z. Đủ 3 chi tiết trong CÙNG một lần đọc. |
| `bash scripts/probe-eperm-v2.sh status` | 05:50:26Z | **DEAD/STALE**, heartbeat n=54, ts 02:45:23Z, boot 78b55838, age **11.103 s** (đúng 3h05'03"); last sample probe #54; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 05:50:26Z | **probe #55, boot=1ca1feaa, ok=2 fail=0**, exit 0; dòng `boot changed 78b55838 -> 1ca1feaa` (uptime since 2026-11-18 05:29:18) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~05:50:26Z | **ALIVE**, age 0 s, n=55, exit 0 |
| Xác minh boot lại (sau probe) | 05:50:47Z | Cùng boot 1ca1feaa, `uptime -s` 05:29:18Z, btime 1794979758. MemAvailable 3.573.904 kB. |
| Xác minh boot lần 3 (lúc đóng) | 06:10:14Z | Cùng boot 1ca1feaa — **KHÔNG reboot giữa phiên T2**. MemAvailable 2.211.688 kB. |

Kiểm lại từ đĩa: log probe v2 **157 dòng** — 154 sau T2-135 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #54 +
dòng `boot changed` + dòng probe #55). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #54 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §3 đã dự báo đúng +3
trước khi đo. Heartbeat **n=55, ts 2026-11-18T05:50:26Z, boot
1ca1feaa-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime brief "~05:29:34Z" (đính chính):** btime thật là
**05:29:18Z** (/proc/stat 1794979758 + `uptime -s` + `who -b`).
Journal first entry là **05:29:34Z** — chậm hơn btime 16 s (journald
khởi động sau kernel boot ~16 s). Brief lúc mở đợt ghi "~05:29:34Z"
— con số này TRÙNG KHỚP first entry của journal, nên nguồn của nó
rất có thể là journal (hoặc uptime làm tròn phút), không phải btime.
Sai lệch 16 s này KHÔNG đổi verdict nào (cả hai mốc đều nằm trong
dải #92? với biên hàng nghìn giây). Ghi rõ để luồng sau khỏi lấy
05:29:34Z làm btime.

Nguồn độc lập cho boot #92?: 11 session T2 trong vùng C (xem §2.3)
+ 72 mốc merged gộp trong vùng C (mốc đầu 05:35:39Z —
system_prompt.md; mốc cuối 05:50:16Z — khong-nha-grep.txt của T6
đợt 136) + 4 exec-log nhắc 1ca1feaa. **Số thứ tự TẠM THỜI**
(như #69/#70/#71/#72/#73/#74/#75/#76/#77/#78?/#79?/#80?/#81?/#82?/
#83?/#84?/#85?/#86?/#87?/#88?/#89?/#90?/#91?; T6-136 sẽ chốt chuỗi
tương đối, số tuyệt đối vẫn tạm).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #55 (02:45:23Z → 05:50:26Z 18/11, 3h05'03" = 11.103 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #55: `uptime -s` = **2026-11-18 05:29:18Z**,
  boot_id `1ca1feaa-af3b-41dc-aaae-34376329b0a3` — khác boot của
  probe #54 (78b55838).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (05:49:44Z): chỉ **1 boot**
  (1ca1feaa, first entry 05:29:34Z, last 05:49:12Z). Journal/wtmp
  của các boot trước đã mất theo reboot #92? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #92? — bracket ghi trong lượt, ĐỦ 3 chi tiết
  trong CÙNG một lần đọc (bài học T2-134 §4 mục 4).** Lúc 05:49Z
  file có **1.545 dòng, 221 dòng "status installed", 462 dòng
  chứa "configure"** — khớp hình dạng #82?/#83?/#84?/#90?; gói đầu
  libaspell15 05:42:34Z; gói cuối gstreamer1.0-tools 05:45:44Z
  (boot +16m26s); gstreamer1.0-gl 05:42:50Z; configure đầu
  05:42:34Z; startup packages configure 05:35:43Z (replay postboot
  đợt 136 mở 05:35Z — muộn hơn #90? vì lượt cron mở muộn hơn).
  **Hồ sơ đầy đủ thuộc về T5-136 (chủ quản postboot)** — T5 xác
  nhận chính thức cho boot #92?; bracket #92? của T2 chỉ là xác
  nhận hình dạng. (Lưu ý đếm: pattern "configure " có dấu cách
  cuối chỉ cho 178 dòng vì bỏ các dòng "startup packages
  configure" ở cuối dòng; pattern "configure" không dấu cách cho
  462 dòng — khớp #90?. Số dùng là 462, pattern ghi rõ.)
- **dpkg.log của boot #91? (bcc71e61) đã MẤT** (file lúc T2 kiểm chỉ
  còn bracket #92?): /var/log reset mỗi boot. Bản ghi T10-135
  (suite + O8 chạy 03:52–03:58Z trên bcc71e61) là bằng chứng còn
  lại cho boot đó — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này:** boot 1ca1feaa xác minh
lúc 05:49:44Z (mở lượt), 05:50:47Z (sau probe #55) và 06:10:14Z
(lúc đóng) — cùng boot_id + btime 05:29:18Z. (Tiền lệ: T2-134 gặp
reboot giữa phiên; lượt này không gặp.)

### 2.2 Reboot đã chốt trong mù — #91? + #92? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 91? | **03:35:20Z** (chính xác từng giây) | 78b55838 → bcc71e61 | Chốt từ đợt 135 (T10-135: `uptime -s` + btime 1794972920 + `who -b` + journal; LIMITS gộp 135 §10.1). Gap #90?→#91? = 4.073 s, INSIDE dải. **Số thứ tự TẠM THỜI.** |
| 92? | **05:29:18Z** (chính xác từng giây) | bcc71e61 → 1ca1feaa | Chốt từ lượt này: `uptime -s` đọc tươi (05:49:44Z + kiểm lại 05:50:47Z + 06:10:14Z) + btime 1794979758 + `who -b` 05:29 + boot_id 1ca1feaa + journal first entry 05:29:34Z + probe #55 05:50:26Z boot 1ca1feaa ok=2 fail=0 + 11 session trong vùng C. **Số thứ tự TẠM THỜI.** |

**Clock:** F92? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` cả 3 server đều
hơn local **+1 s** (example.com +1 s, google.com +1 s,
cloudflare.com +1 s). **F92? là lần đo trực tiếp đầu tiên trên
boot #92?** — không dùng cận hai lần đo. F90? ≈ −1 s (±~1 s, đã
đo đợt 135). **F91? CHƯA TỪNG đo trực tiếp** — không có phiên T2
nào trên boot bcc71e61 trước khi nó chết (T10 chạy suite/O8 trên
boot đó nhưng không đo F). Hai đầu chuỗi đo được (F90?, F92?) đều
≈ −1 s — đồng hồ local ổn định ở mức chậm ~1 s ở cả hai đầu; xem
§2.5 về cách caveat này được xử lý.

**CẬN NHẢY CLOCK TẠI CÁC REBOOT (0 nhân chứng nhảy ở cả 2):**
- **0 nhân chứng nhảy tại #91?/#92?:** **0 session** sinh trước
  btime có mtime sau btime (quét 244 exec-log).
- Cận session: **|X91?| < 29 s** (session muộn nhất 03:34:51Z —
  chặt thứ hai từng đo, sau |X86?| < 6 s đợt 135); **|X92?|
  KHÔNG có cận trong 1h** (0 session có mtime trong (04:29:18Z,
  05:29:18Z] — máy yên hoàn toàn 1h trước reboot; F92? đo trực
  tiếp (±~1 s) là bằng chứng chính).
- Session sớm nhất sau mỗi btime: #91? 03:36:39Z (T3 wait-t8.sh
  khởi động lại sau reboot); #92? 05:36:33Z (phiên main agent
  1a792530, spawn lượt cron đợt 136).
- **Ranh giới sạch hoàn toàn (mới — khác mù #54):** 0 file trong
  (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime] ở cả
  #91? và #92? (merged kiểm cả 3 cây repo-1/hidden_files/outside).
  Không có file +s kiểu mù #54 (#88? +8 s, #89? +3 s) hay mù #50.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #90?→#91? = **4.073 s (1h07'53")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [4.063 s, 4.083 s]** (mới, xem §2.5).
- Gap #91?→#92? = **6.838 s (1h53'58")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #55 mở, tối đa 2 ẩn theo quy ước / 3 ẩn cộng dồn).
- Gap #83?→#84? = **6.318 s (1h45'18")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #53 mở, tối đa 3 ẩn; ĐÃ RECHECK đợt này — xem §2.6).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #91? từ #90? dự kiến [02:54:47Z, 04:53:38Z] (p10–p90 FULL68 —
  bản script; prereg tính bằng p10/p90 nguyên cho [02:54:48Z,
  04:53:39Z] — lệch 1 s do cắt float, xem F-136-T2-6); thực tế
  **#91? 03:35:20Z NẰM TRONG dải**. #92? từ #91? dự kiến
  [04:02:40Z, 06:01:31Z] (bản script; prereg [04:02:41Z,
  06:01:32Z] — lệch 1 s cùng nguyên nhân); thực tế 05:29:18Z —
  **NẰM TRONG dải** (sau cận dưới 5.198 s, trước cận trên 1.933 s
  theo bản script).
- **Chuỗi INSIDE nay là 4 lần liên tiếp (#89?/#90?/#91?/#92?)**
  sau cụm 4 lần OUTSIDE (#85?–#88?). **Lần đầu tiên có reboot
  NẰM TRONG dải sau khi dải đã thu hẹp về p10 27'21"** — không
  còn lần ngoài dải nào kể từ đợt 134.

**Khung chết các boot mới (từ merged — xem §2.4):**
- **Khung chết #90?: (03:32:23Z, 03:35:20Z] (177 s) — CHUẨN PARENT
  VẪN ĐỨNG** (§12.3(b) đợt 135). Merged lượt này tìm được mốc muộn
  hơn: **03:34:51Z** (exec-log proc_360681f49c95.log, agent
  79c7635d — session sinh 03:34:51Z, mtime 03:34:51Z, file 0 byte)
  → **ứng viên khung hẹp (03:34:51Z, 03:35:20Z] (29 s), CHỜ PARENT
  XÁC NHẬN — T2 không tự thay chuẩn.** Caveat: mốc 03:34:51Z là
  file log 0 byte (runtime tạo file khi spawn lệnh, lệnh không kịp
  ghi output trước khi reboot giết — hoặc lệnh xong ngay không
  output); nó chứng minh runtime còn spawn lệnh ở 03:34:51Z trên
  boot cũ, nhưng yếu hơn mốc có nội dung (retry T8 DONE 03:32:23Z).
  Parent có thể giữ khung 177 s (an toàn) hoặc xác nhận khung 29 s.
  Tuổi thọ boot #90? theo khung chuẩn: 1h04'56"–1h07'53".
- **Khung chết #91?: (04:42:27Z, 05:29:18Z] (2.811 s) — ỨNG VIÊN**
  — mốc muộn nhất là session proactivity (agent 906cd2df:
  `sessions/906cd2df-27de-4588-bf9e-1b728653f7a3.jsonl` +
  `sessions/sessions.json`, mtime 04:42:27.248/249Z — runtime ghi
  session, seq 17–18: proactivity kết luận không có cơ hội mới sau
  khi T10 đóng đợt 135). Mốc này NẰM NGOÀI 4 phạm vi merged của T2
  (~/agents + ~/memory không thuộc repo-1/hidden_files/ngoài cây
  workspace//tmp) — T2 chỉ tìm ra nhờ đối chiếu LIMITS T6-136
  (xem §2.4 phát hiện 4). Mốc merged 4 phạm vi là 04:41:55Z
  (snapshot proactivity); T6 đọc 04:42:10Z là lần ghi giữa chừng
  của cùng session (file được ghi thêm 04:42:27Z). Đã kiểm bổ sung:
  không còn file nào trong ~/agents + ~/memory + ~/dreams +
  ~/side-chats có mtime trong (04:42:27Z, 05:29:18Z]. Sau 04:42:27Z
  máy yên 46'51" tới reboot. Tuổi thọ boot #91?: 1h07'07"–1h53'58".
- **Khung chết #89? không đổi:** (02:15:29Z, 02:27:27Z] (718 s) —
  chuẩn đợt 135. Khung chết #83? không đổi: (22:16:31Z,
  23:26:58Z] (4.227 s) — chuẩn đợt 134 (recheck đợt này xác nhận
  lại, xem §2.6). Khung chết #82? bản hẹp (21:29:47Z, 21:41:40Z]
  (713 s) làm chuẩn (§12.3(c) đợt 134).

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #90?→#91?
là **sự kiện thứ 15** (đợt 135); #91?→#92? là **sự kiện thứ 16**
(đợt này). Các đợt 129–135 đều có ≥1 reboot (7 đợt liên tiếp);
đợt 136 đã có 1 reboot sau khi đợt 135 đóng (sự kiện thứ 16).
**Số thứ tự TẠM THỜI** (như #69–#92?; chuỗi tương đối do T6-136
chốt, số tuyệt đối vẫn tạm; giá trị gap không phụ thuộc số thứ tự).

### 2.3 Hoạt động trong khoảng mù — HỞ ĐOẠN B (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **14 file** +
hidden_files **323 file**; **337 file, 332 mốc float phân biệt /
194 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3 — "mốc" là mtime float phân biệt, không phải
giây tròn). Ngoài hai cây: **91 file** (agents — exec-log/tool-output
chiếm đa số + system/memory/proactivity/feed + repo-1-push/paths-loop;
chi tiết xem blind55-outside.txt); **/tmp: 26 file** trong mù #55
(xem blind55-tmp.txt — TẤT CẢ trong đoạn C, xem caveat §2.4).
Gộp cả 4 phạm vi: **242 mốc giây phân biệt**. Chia mù làm ba
đoạn bởi 2 reboot:

- **Đoạn A: 02:45:23Z → 03:35:20Z (49'57" = 2.997 s, boot #90?
  78b55838) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **145 mốc** (hai cây), lỗ lớn nhất hai cây **374 s**
    (03:05:39Z → 03:11:53Z); lỗ lớn thứ hai 290 s. Mốc đầu
    02:45:23Z (head 0 s — chính probe #54); mốc cuối hai cây
    **03:32:23Z** (đuôi hai cây **177 s** < sàn 1.147 s).
    **19 session** chạm đoạn A.
  - **Merged 4 phạm vi: 108 mốc, lỗ lớn nhất 252 s**
    (03:07:41Z → 03:11:53Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 02:45:37Z (head 14 s), mốc cuối gộp **03:34:51Z**
    (đuôi 29 s — session exec-log proc_360681f49c95.log).
  - Cửa sổ sàn [A-lo=03:04:30Z, A-hi=03:16:13Z] có mốc dày ở cả 4
    phạm vi (T5/T4/T7/T8 đợt 135 còn chạy). 2 session bắc qua cắt
    A-lo, 4 session bắc qua cắt A-hi; 8 session chạm A-tail
    (03:16:13Z, 03:35:20Z].
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn.**
- **Đoạn B: 03:35:20Z → 05:29:18Z (1h53'58" = 6.838 s, boot #91?
  bcc71e61) — MỞ (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **96 mốc** (hai cây), lỗ lớn nhất hai cây **4.211 s**
    (04:19:07Z → 05:29:18Z); lỗ lớn thứ hai 720 s. Mốc đầu
    03:36:37Z (head 77 s — T3 wait-t8.sh khởi động lại sau reboot);
    mốc cuối hai cây **04:19:07Z** (đuôi hai cây **4.211 s** >
    sàn). **3 session** chạm đoạn B (đều 03:36–03:56Z).
  - **Merged 4 phạm vi: 61 mốc, lỗ lớn nhất 2.843 s**
    (04:41:55Z → 05:29:18Z), floor=2 → **MỞ, tối đa 2 ẩn (quy
    ước)**. Mốc đầu gộp 03:36:37Z (head 77 s), mốc cuối gộp
    **04:41:55Z** (đuôi 2.843 s — 6 file snapshot proactivity).
    Lỗ lớn thứ hai gộp **1.368 s** (04:19:07Z → 04:41:55Z) —
    cũng vượt sàn (xem §2.4 về cách đếm tối đa ẩn).
    **Đính chính sau đối chiếu T6 (§2.4 phát hiện 4):** tính thêm
    phạm vi thứ 5 (~/agents sessions + ~/memory), mốc cuối đoạn B
    là **04:42:27Z** (session proactivity) → lỗ lớn nhất còn
    **2.811 s** (04:42:27Z → 05:29:18Z); verdict không đổi (vẫn
    MỞ, tối đa 2 ẩn quy ước — 2.811//1.147 = 2).
  - Cửa sổ sàn [B-lo=03:54:27Z, B-hi=05:10:11Z]: 1 session bắc qua
    cắt B-lo; **0 session bắc qua cắt B-hi và 0 session chạm
    B-tail** — không session nào, không file nào ở cả 4 phạm vi
    trong B-tail (05:10:11Z, 05:29:18Z] — kiểm riêng từng phạm vi,
    0 file. Máy yên hoàn toàn sau mốc cuối 04:42:27Z (phạm vi thứ 5,
    xem §2.4 phát hiện 4).
  - Hoạt động trên bcc71e61: suite T10 03:52–03:58Z + O8
    03:56–03:58Z + đóng sổ 04:10Z + parent verify 04:13Z + LIMITS
    gộp viết quyết 04:19:07Z + snapshot proactivity 04:41:55Z +
    session proactivity 04:42:27Z — sau đó im lặng 46'51" tới
    reboot. Không có cron nào chạy trong khoảng này (lượt cron tiếp
    theo mở 05:35Z — đã sang boot mới).
  - **Kết luận đoạn B: MỞ — tối đa 2 ẩn (quy ước lỗ lớn nhất //
    sàn); đọc cộng dồn hai lỗ vượt sàn thì tối đa 3 ẩn (xem §2.4).**
- **Đoạn C: 05:29:18Z → 05:50:26Z (21'08" = 1.268 s, boot #92?
  1ca1feaa) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 05:49:44Z = 05:29:18Z** chứng minh máy up
    liên tục từ #92? tới lúc đo; probe #55 05:50:26Z đọc boot_id
    1ca1feaa tươi — cùng boot_id với boot bắt đầu 05:29:18Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G.)
  - **91 mốc** (hai cây), lỗ lớn nhất **453 s** (05:29:18Z →
    05:36:51Z — head, do cron đợt 136 chỉ mở 05:35:51Z);
    mốc cuối **05:50:16Z** (đuôi **10 s** < sàn). **11 session**
    chạm đoạn C (đều là phiên đợt 136 / main agent).
  - **Merged 4 phạm vi: 72 mốc, lỗ lớn nhất 381 s** (05:29:18Z →
    05:35:39Z — head), floor=0 → **ĐÓNG cả theo luật lỗ**
    (không chỉ uptime). Mốc đầu gộp 05:35:39Z (head 381 s —
    system_prompt.md), mốc cuối gộp 05:50:16Z (đuôi 10 s).
  - Đoạn C dài hơn sàn (1.268 s > 1.147 s) nhưng ngắn hơn 2×sàn —
    không có cửa sổ sàn; uptime là closer, luật lỗ chỉ là kiểm
    chứng thêm.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #55 HỞ ĐOẠN B.** Đoạn A và C đóng
(merged), đoạn B mở với tối đa 2 ẩn (quy ước) / 3 ẩn (cộng dồn).
2 reboot đã chốt giờ (#91? 03:35:20Z + #92? 05:29:18Z — chính xác
từng giây trên đĩa) + **tối đa 2 ẩn (quy ước)**. Chuỗi mù đóng hoàn
toàn dừng ở #54: #50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng,
**#55 hở**.

Ngoài hai cây: **91 file** có mtime trong mù #55 (agents —
exec-log/tool-output chiếm đa số + system/memory/proactivity/feed;
chi tiết xem blind55-outside.txt); **/tmp: 26 file** trong mù #55
(xem blind55-tmp.txt + caveat §2.4 — TẤT CẢ trong đoạn C).
Boot_id nhắc trong exec-log sinh/viết trong mù: 78b55838 15 file,
bcc71e61 3 file, 1ca1feaa 4 file (phiên T2 này nằm trong số đó).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp nối tiếp T2-135 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind55-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 108 mốc, lỗ lớn nhất **252 s** (03:07:41Z →
  03:11:53Z), floor=0 → **ĐÓNG**.
- Đoạn B gộp: 61 mốc, lỗ lớn nhất **2.843 s** (04:41:55Z →
  05:29:18Z), floor=2 → **MỞ, tối đa 2 ẩn (quy ước)**.
  Lỗ lớn thứ hai **1.368 s** (04:19:07Z → 04:41:55Z); lỗ lớn
  thứ ba 720 s (03:58:30Z → 04:10:30Z). (Tính thêm phạm vi thứ 5
  ~/agents sessions: mốc cuối 04:42:27Z → lỗ lớn nhất 2.811 s;
  xem phát hiện 4 dưới — verdict không đổi.)
- Đoạn C gộp: 72 mốc, lỗ lớn nhất **381 s** (05:29:18Z →
  05:35:39Z), floor=0 → **ĐÓNG**.
- Tổng gộp 242 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CÓ 26 file trong mù #55, tất cả trong đoạn C
(mới, ngược mù #53/#54):** /tmp trên VM này là tmpfs — reboot #92?
(05:29:18Z) xóa mọi file /tmp viết trước đó (và reboot #91? cũng
vậy). Vì vậy merged cho đoạn A và B **không có đóng góp /tmp** —
nhưng đoạn C (boot hiện tại còn sống) có 26 file /tmp (t1-136,
jarvis-tool-output, X193, node-compile-cache 05:48:40Z...). **Verdict
không đổi:** đoạn A đóng và đoạn B mở đều không phụ thuộc /tmp
(A đóng nhờ mốc đĩa, B mở vì cả 4 phạm vi đều trống trong B-tail).
Ghi rõ để luồng sau khỏi hiểu "26 file /tmp" là bằng chứng cho cả
mù — chúng chỉ phủ đoạn C.

**Phát hiện 2 — Đoạn B có HAI lỗ vượt sàn, quy ước đếm tối đa ẩn
chưa từng gặp trường hợp này (mới):** lỗ lớn nhất 2.843 s
(2.843//1.147 = 2) và lỗ lớn thứ hai 1.368 s (1.368//1.147 = 1)
đều vượt sàn. Quy ước từ trước tới nay (code merged các đợt) chỉ
đếm lỗ lớn nhất → **tối đa 2 ẩn**. Nhưng một reboot ẩn có thể ngồi
trong lỗ thứ hai mà không cần lỗ lớn nhất — cộng dồn hai lỗ thì
**tối đa 3 ẩn**. T2 báo cả hai số: headline lấy 2 (quy ước, nhất
quán với các đợt trước), và ghi rõ 3 là số bảo thủ nếu parent muốn
chuẩn chặt hơn. Gap #91?→#92? giữ SPAN theo cả hai cách đọc — không
đổi verdict nào. Tốc độ reboot (§2.5) tính cả hai biến thể.

**Phát hiện 3 — Mốc cuối đoạn A 03:34:51Z là file 0 byte (mới,
xem §2.2):** exec-log proc_360681f49c95.log (agent 79c7635d — phiên
T10 đợt 135) có birth = mtime = 03:34:51.575597751Z, size 0, không
có file tool-output kèm. Runtime spawn lệnh lúc 03:34:51Z, lệnh
không kịp ghi output trước khi reboot 03:35:20Z giết (hoặc xong
ngay không output). Mốc này hẹp khung chết #90? từ 177 s xuống
ứng viên 29 s — nhưng là mốc yếu (không nội dung), nên T2 chỉ đề
xuất ứng viên, chờ parent xác nhận, không tự thay chuẩn.

**Phát hiện 4 — Merged 4 phạm vi BỎ SÓT ~/agents + ~/memory;
đối chiếu T6 hẹp khung chết #91? thêm 32 s (mới):** T6-136 (§8.3)
ghi khung chết #91? bản hẹp (04:42:10Z, 05:29:18Z] từ session jsonl
`~/agents/agent-906cd2df-…/sessions/….jsonl` — T2 kiểm lại trực
tiếp bằng stat: file đó (`906cd2df-27de-4588-bf9e-1b728653f7a3.jsonl`
+ `sessions.json`) có mtime **04:42:27.248/249Z** — muộn hơn mốc
T6 đọc 17 s (T6 đọc lúc file đang được ghi dở; lần ghi cuối cùng
là 04:42:27Z). Đã quét bổ sung ~/agents + ~/memory + ~/dreams +
~/side-chats: **không còn file nào** có mtime trong (04:42:27Z,
05:29:18Z] — mốc cuối đoạn B chốt ở **04:42:27Z**, khung chết #91?
(04:42:27Z, 05:29:18Z] = 2.811 s. Kiểm tương tự cho đoạn A:
không file nào trong các cây đó có mtime trong (03:34:51Z,
03:35:20Z] — mốc cuối đoạn A 03:34:51Z đứng nguyên. Bài học:
merged 4 phạm vi của T2 không phủ ~/agents (session runtime) và
~/memory — khi chốt khung chết, luồng sau kiểm thêm 2 cây này
(xem F-136-T2-8). Verdict đoạn B không đổi (vẫn MỞ, tối đa 2 ẩn);
chỉ khung chết hẹp thêm 32 s so với mốc merged 4 phạm vi.

### 2.5 Phân phối gap — CERT n=53 → n=54 / FULL n=68 → n=69 (1 gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Một gap mới (xem blind55-gaps.py + blind55-gaps.txt):**
- **Gap #90?→#91? = [4.063 s, 4.083 s] (mid 4.073 s) CHỨNG NHẬN
  DẠNG KHOẢNG (mới)** — đoạn A mù #55 đóng (merged, §2.3) + đoạn G
  mù #54 đóng bằng uptime (T2-135 §2.3). Biên ±10 s của T5 dùng
  nguyên văn; mid không dịch chuyển (thực hành của T5).
  Caveat: **F91? CHƯA TỪNG đo trực tiếp** (F90? đã đo ≈ −1 s)
  — cùng lớp các gap khoảng trước #72→#73 / #75→#76 /
  #77→#78? / #79?→#80? / #82?→#83? / #89?→#90? (một đầu chưa đo).
  Cận nhảy clock tại #91? **|X91?| < 29 s** (chặt thứ hai từng đo
  — session viết 03:34:51Z, 29 s trước btime; chỉ sau |X86?| < 6 s
  đợt 135) và F90?/F92? đều đo trực tiếp ≈ −1 s kẹp hai đầu chuỗi
  (xem lập luận "kẹp hai đầu" dưới).

**Lập luận "kẹp hai đầu" cho gap này (ghi rõ để parent xét):**
F90? ≈ −1 s và F92? ≈ −1 s đều đo trực tiếp, kẹp reboot #91? ở
giữa — đồng hồ ≈ −1 s ở cả hai đầu. Một sai số >10 s tại #91? sẽ
đòi một bước nhảy ở đó VÀ một bước nhảy ngược trước/tại #92? để
quay về −1 s. Lập luận này đã dùng cho mọi gap khoảng trước có một
đầu F chưa đo; gap này cùng lớp đó (không phải lớp yếu "cả hai đầu
chưa đo" của 4 gap giữa đợt 135).

**Gap #91?→#92? = 6.838 s (1h53'58") VẪN CHỈ LÀ SPAN** — đoạn B
mù #55 mở (tối đa 2 ẩn quy ước / 3 ẩn cộng dồn).
**CERT/FULL không tính gap này.**

**Gap #83?→#84? = 6.318 s (1h45'18") VẪN CHỈ LÀ SPAN** — đoạn B
mù #53 mở (tối đa 3 ẩn; ĐÃ RECHECK đợt này — xem §2.6).
**CERT/FULL không tính gap này.**

**Gap #81?→#82? = [7.797 s, 7.817 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 133 (đoạn A mù #52 đóng). Không đổi lượt này.

**Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B
mù #51 mở (tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem §2.6).
**CERT/FULL không tính gap này.**

**Gap #79?→#80? = [2.079 s, 2.099 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 132 (đoạn A mù #51 đóng). Không đổi lượt này.

**Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.

**Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-131 §2.3; KHÔNG kiểm lại lượt này theo quyết parent
đợt 132 §12.3(d) — xem §2.6). **CERT/FULL không tính gap này.**

**Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.

**Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù
#48 mở (T2-129 §2.3). Không đưa vào FULL/CERT.

**Gap #73→#74 = 6.639 s (1h50'39") VẪN LÀ KHOẢNG [6.629 s,
6.649 s]** — đã chứng nhận đợt 128 (đoạn B mù #47 đóng). Không
đổi lượt này.

**Gap #72→#73 = 3.248 s (54'08") VẪN LÀ KHOẢNG [3.238 s,
3.258 s]** — đã chứng nhận đợt 128 (đoạn A mù #47 đóng). Không
đổi lượt này.

**Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN** — đoạn A mù
#46 mở (T4-127 §2.3). Không đưa vào FULL/CERT.

**Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
#45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.

**Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
#44 mở (T7-126 §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T2(135) 100%:** chạy blind54-gaps.py
verbatim cho lại đúng CERT n=53 / FULL n=68 của T2 đợt 135 (xem
blind55-gaps.txt: CERT53 mean 1h33'17" median 1h48'41" p10
0h26'37" p90 2h19'19" sd 0h46'46" min 0h00'55" max 3h14'08";
FULL68 mean 1h40'36" median 1h49'58" p10 0h27'21" p90 2h26'12"
sd 0h57'43" min 0h00'55" max 5h43'18"; in 90–150' = 34, <60' = 17,
>180' = 6, >240' = 2 — khớp T2-135 §2.5 từng số). 1 gap mới vào
nên cả CERT lẫn FULL đều +1.

- **CERT n=54 (mới):** mean 1h32'48" median 1h47'34" p10 0h26'45"
  p90 2h18'35" sd 0h46'27" min 0h00'55" max 3h14'08".
- **FULL n=69 (mới):** mean 1h40'08" median 1h49'17" p10 0h27'29"
  p90 2h26'04" sd 0h57'25" min 0h00'55" max 5h43'18"; in 90–150'
  = 34, <60' = 17, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của gap mới: CERT54 mean chỉ dao động ±1 s
  (1h32'48"–1h32'49"), FULL69 mean không đổi ±1 s (1h40'08") —
  biên ±10 s không làm lệch phân phối.
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (gap mới
  4.073 s nằm trong dải).
- **Dải cơ học cho #93? (p10–p90 FULL69): [05:56:47Z,
  07:55:21Z 18/11]** — từ btime #92? 05:29:18Z; dải hiệu dụng sau
  probe #55: [05:50:26Z, 07:55:21Z].
- **Tốc độ reboot (đồng hồ ghi nhận):** 92 / 177,19 h = **1 reboot
  mỗi 115,6 phút** (từ #1 2026-11-10T20:18:10Z tới #92?
  2026-11-18T05:29:18Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 96 / 177,19 h = **1 mỗi 110,7 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 99 / 177,19 h = **1 mỗi 107,4
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 101 /
  177,19 h = **1 mỗi 105,3 phút** (đọc cộng dồn đoạn B tối đa 3
  → 102 / 177,19 h = **1 mỗi 104,2 phút**). Chưa tính ẩn danh
  nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38 đoạn G (+6),
  mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43 đoạn B (+3),
  mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46 đoạn A (+4),
  mù #48 đoạn A (+2), mù #49 đoạn B (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt này xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). **Mù #55: +2 (quy ước) / +3
  (cộng dồn) — mới.**
- **#91? vào dải cơ học** (p10–p90 FULL68). **#92? vào dải cơ
  học.** Chuỗi INSIDE 4 lần liên tiếp (#89?/#90?/#91?/#92?) sau
  cụm 4 lần OUTSIDE (#85?–#88?).

### 2.6 Mù #53 B RECHECK đợt này + mù #51 B + mù #49 B: KHÔNG kiểm lại

- **Mù #53 B: ĐÃ RECHECK đợt này (brief giao) — VERDICT KHÔNG
  ĐỔI.** Chạy lại toàn bộ pipeline quét (blind53b-recheck-*.py —
  cùng code với đợt 134, chỉ đổi thư mục đích + tên file ra):
  repo-1 10 file (đợt 134: 11), hidden_files 270 file (đợt 134:
  316), ngoài cây 52 file (đợt 134: 78), /tmp 0 file. Merged 4 phạm
  vi: đoạn B **39 mốc (đợt 134: 59), lỗ lớn nhất 4.227 s
  (22:16:31Z → 23:26:58Z) — Y HỆT đợt 134**, tối đa 3 ẩn; lỗ lớn
  thứ hai 409 s (đợt 134: 384 s — mốc GAP_ANALYSIS.md 22:11:01Z đã
  mất vì file được viết thêm §64, mtime nay 04:11:11Z 18/11); lỗ
  lớn thứ ba 354 s — y hệt. Đoạn A y hệt (822 s); đoạn C 536 s
  (đợt 134: 518 s — mốc system_prompt.md 23:35:36Z đã mất vì file
  được viết lại 05:35:39Z đợt 136). **0 mốc mới trong lỗ đoạn B**
  (diff danh sách file hai lần quét: 0 dòng thêm ở cả 4 phạm vi).
  20 mốc merged mất chỉ do mtime các file bị viết lại/xóa sau lần
  quét đợt 134 (build-loop-log.md, round-in-progress.md,
  GAP_ANALYSIS.md, wait-t4-t5-134t8.sh, ~40 file round93-u4/work —
  file vẫn tồn tại nhưng mtime đã ra khỏi cửa sổ; tmp-q6r3-debroot
  đã dọn). Khung chết #83? (22:16:31Z, 23:26:58Z] (4.227 s) giữ
  nguyên. **Gap #83?→#84? = 6.318 s GIỮ SPAN.**
- **Mù #51 B: KHÔNG kiểm lại đợt này.** Đã kiểm lại 3 lần (đợt
  131, 132, 133) với cùng verdict (lỗ lớn nhất 4.393 s, tối đa
  3 ẩn); hồ sơ đã ổn định. T2 đợt này không thấy bằng chứng mới
  nào về mù #51 B. Gap #80?→#81? = 8.558 s giữ SPAN. (Tiền lệ:
  không giao luồng sau kiểm lại B mù #51 — quyết đợt 126 §12(h)
  + quyết đợt 130 §12.3(e).)
- **Mù #49 B: KHÔNG kiểm lại đợt này.** Quyết parent đợt 132
  §12.3(d) đã phê duyệt bỏ mục kiểm lại thường lệ khỏi brief T2;
  chỉ kiểm lại khi có bằng chứng mới cụ thể. T2 đợt này không thấy
  bằng chứng mới nào về mù #49 B. Gap #76→#77 = 6.859 s giữ SPAN.
  Ghi rõ đã bỏ mục này theo quyết parent.

### 2.7 Quét writeFileSync lần thứ 42 — chênh 0 (lần thứ 42 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round136-t2, đã đổi OUT sang
  round136-t2) **06:09:39Z → 06:09:57Z 18/11 (18 s, có SCAN-END)**.
  **Scan chạy trên boot #92?** — kết quả vẫn hợp lệ vì scan chỉ đếm
  code hiện tại trên đĩa, không phụ thuộc boot hay giờ mù.
- NEWSTD: **901 dòng / 251 file** (phạm vi 3.126 file); R7b đối
  chiếu: **926 dòng / 268 file** (phạm vi 12.519 file); copies:
  **25 dòng / 17 file** — y hệt lần 41 về copies. Đối chiếu chéo:
  901+25=926=R7b, **chênh 0**.
- **+5 dòng / +2 file so với lần 41** (896/249 → 901/251), giải
  thích đúng hết bằng diff
  (kiểm bằng diff danh sách file + diff từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND135_T2_EPERM_LIMITS.md | +4 (0 → 4) | 03:04:28Z 18/11 | Tài liệu T2 đợt 135 (nhắc `writeFileSync` 4 lần); viết SAU scan lần 41 (02:56:01Z 18/11) nên lần này mới vào |
  | docs/PHASE9_ROUND135_LIMITS.md | +1 (0 → 1) | 04:19:07Z 18/11 | LIMITS gộp đợt 135 (nhắc `writeFileSync` 1 lần); viết sau scan lần 41 |
- Phạm vi: 3.126 = 3.114 + 12 net (**12 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 12 file mới gồm 7 LIMITS đợt 135
  + 5 LIMITS đợt 136 đã viết trước scan (T1 + T4 + T5 + T6 + T9);
  0 file mất). Copies y hệt lần 41 (diff 0 dòng).
- **Kết luận: 42 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #55.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Lưu ý phương pháp: pattern phải là `\.writeFile\(` (có dấu chấm).
  Pattern không dấu chấm còn bắt thêm các mock `async writeFile(`
  trong file test `apps/web/scripts/test_round83_k8_eperm_retry.mjs`
  (định nghĩa fake fs, mtime 10/11, không phải đường ghi thật) —
  không tính vào 2 helper; T7-126 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #55.

## 3. RAM trong mù #55 — max 5.985 MB (97,4% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable trực tiếp của lượt:**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 05:49:44Z | **3.390.420 kB** (3.311 MB) | Trước probe #55 (boot #92?, đoạn C) |
  | 05:50:47Z | **3.573.904 kB** (3.490 MB) | Sau probe #55 (boot #92?, đoạn C) |
  | 06:10:14Z | **2.211.688 kB** (2.160 MB) | Lúc đóng phiên T2 (boot #92?) — NGOÀI mù #55 |
- **Max RAM biết được TRONG mù #55 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 48 mẫu RAM; **max 5.985 MB**
  (T4 poll #4, 05:44:42Z, đoạn C — đã xác minh trực tiếp dòng log:
  `poll #4 2026-11-18T05:44:42Z boot=1ca1feaa ... RAMavail=5985MB`)
  = **97,4% ngưỡng guard** — chỉ thiếu **159 MB** nữa là chạm
  guard 6 GB (6.144 MB); đoạn A max **1.711 MB** (02:54:23Z, T4
  attempt1 exit — đã xác minh trực tiếp dòng log); đoạn B **0 mẫu
  script** (không ai ghi mẫu RAM theo pattern script bắt được trong
  đoạn này) **+ 1 mẫu văn xuôi 475 MB** (T10 suite start
  03:52:14Z trên bcc71e61 — `RAMavail 475MB` không dấu `=`, script
  không bắt được; ghi rõ để không hiểu "0 mẫu" là "không đo");
  đoạn C max **5.985 MB** (05:44:42Z). Chuỗi poll T4 đoạn C cho thấy
  RAM hồi mạnh sau boot rồi giảm dần khi các luồng đợt 136 chạy:
  5.985 → 5.949 → 5.692 → 5.343 → 5.059 → 4.940 → 4.782 → 4.780 →
  4.662 MB (05:44:42Z → 05:48:31Z); mẫu trực tiếp của T2 tiếp tục
  đà giảm (3.311 → 3.490 → 2.160 MB).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 5.985 MB < ngưỡng guard 6 GB (6.144 MB); u2net là fallback
  chính thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. **Lưu ý cho parent: đây là lần
  tiến gần guard nhất từ trước tới nay** (kỷ lục cũ: 4.576 MB mù
  #42; 2.350 MB mù #54) — nếu một lượt sau quan sát được ≥ 6.144 MB
  thì đủ điều kiện thử birefnet theo quyết §12.7; lượt này chưa đủ.

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg có 2 dự báo SAI — ghi rõ (mới, §0):**
   (a) **RAM max dự báo ~1.000–2.500 MB, thực tế 5.985 MB**
   (F-136-T2-4): prereg lấy mức RAM đợt 135 (~1–2,5 GB) làm neo mà
   không mô hình hóa balloon hồi sau boot mới — boot #92? hồi RAM
   mạnh (T4 poll 5.985 MB lúc 05:44:42Z, chỉ 15' sau btime). Bài học:
   prereg RAM phải tính cửa sổ "hồi balloon sau boot" (15–30' đầu
   boot mới thường cao nhất lượt), không neo vào mức RAM cuối lượt
   trước.
   (b) **Mốc cuối đoạn B dự báo quanh 04:10–04:13Z, thực tế
   04:41:55Z** (F-136-T2-5): prereg quên snapshot proactivity
   (04:41:55Z) — hệ proactivity ghi trạng thái của nó sau khi T10
   đóng + parent verify. Khung chết #91? nhờ đó hẹp hơn dự kiến
   (2.843 s thay vì ~4.578 s đuôi). Không đổi verdict nào (đoạn B
   mở theo cả hai cách tính).
   Các dự báo verdict còn lại đúng hoặc ghi "chưa rõ/chưa quyết":
   probe #55 ok=2 fail=0 + log +3 (đúng); A đóng (đúng); B "chưa rõ"
   (nay MỞ — prereg không cam kết sai hướng nào); C đóng bằng uptime
   (đúng); gap #90?→#91? chứng nhận được (đúng); gap #91?→#92? giữ
   SPAN nếu B mở (đúng); #53 B recheck không đổi (đúng); EPERM 0
   sóng thật + WFS chênh 0 (đúng); dpkg baseline 1.545/221 (đúng
   từng số); #91?/#92? INSIDE dải (đúng).
2. **F-136-T2-1 — blind55-sessions.py chết BrokenPipeError lần chạy
   đầu (mới):** chạy kèm `| head -120` để xem nhanh — head đóng pipe
   sau 120 dòng, script chết giữa chừng (exit 1, chỉ in tới đoạn
   A-tail), thiếu toàn bộ mục B-tail/C. **KHÔNG dùng số nào từ lần
   chạy lỗi** — đã chạy lại không qua head, exit 0, đủ "sessions
   scan done". Bài học: không pipe output script dài qua head (cùng
   lớp F-135-T2-2 — script dừng giữa chừng vì lỗi ngoài code).
3. **F-136-T2-2 — blind53b-recheck-sessions.py exit 1 ở cuối
   (mới):** vòng lặp tail-loop còn tham chiếu tên file cũ
   `blind53-repo-1.txt` (patch đổi tên sót 2 đường dẫn); script chết
   sau khi đã ghi xong blind53b-outside.txt + blind53b-tmp.txt nên
   merged recheck vẫn hợp lệ. Chỉ mất phần in B-tail/C của riêng
   script sessions — merged đã chứng minh không có mốc nào trong lỗ
   đoạn B. Bài học: sau khi adapt script bằng sed, grep cả tên file
   cũ (không chỉ hằng số cửa sổ) trước khi chạy — nối tiếp T2-135
   §4 mục 3.
4. **F-136-T2-3 — tên file sha256 trong danh sách observer sai
   (mới):** investigate.py ghi `round135-t10/PHASE9_ROUND135_LIMITS.
   closing-copy.sha256` — file này KHÔNG tồn tại; file sha thật là
   `round135-t10/t10-closing-sha256.txt` (mtime 04:10:59Z, đã thấy
   trong listing thư mục). Chỉ sai tên trong danh sách kiểm observer;
   không ảnh hưởng số liệu nào. Bài học: kiểm tên file observer bằng
   ls trước khi ghi vào script.
5. **F-136-T2-4 — prereg RAM sai (xem mục 1a trên).**
6. **F-136-T2-5 — prereg mốc cuối đoạn B sai (xem mục 1b trên).**
7. **F-136-T2-6 — dải cơ học prereg lệch 1 s do cắt float (lặp
   lại):** prereg tính bằng p10/p90 nguyên (1.641 s / 8.772 s) cho
   dải #91? [02:54:48Z, 04:53:39Z] và #92? [04:02:41Z, 06:01:32Z];
   script gaps.py dùng p10/p90 float nội suy cho [02:54:47Z,
   04:53:38Z] và [04:02:40Z, 06:01:31Z]. Cùng mẫu F-135-T2-1 /
   T2-133 §4 mục 1. Chỉ lệch 1 s; không đổi verdict trong/ngoài nào
   (các khoảng lệch đều ≥ 1.933 s). Số quyết định trong LIMITS này là
   bản script (khớp bản công bố đợt 135).
8. **Docstring các script blind55 đã kiểm cửa sổ (mới):** investigate/
   sessions/merged/ram-max đều ghi đúng cửa sổ (02:45:23Z →
   05:50:26Z 18/11) + SEGS 3 đoạn viết mới — đã kiểm bằng grep trước
   khi chạy (bài học T2-133 §4 mục 6: kiểm SEGS sau khi adapt).
   Ngoại lệ: eperm-sweep55.py lần đầu còn sót docstring cửa sổ cũ —
   đã sửa trước khi chạy (xem F-136-T2-7 dưới).
9. **F-136-T2-7 — docstring eperm-sweep55.py sót cửa sổ cũ lần đầu
   (mới):** sau sed adapt, docstring vẫn ghi "(23:46:54Z 17/11 →
   02:45:23Z 18/11)" trong khi hằng số B0/B1 đã đúng (02:45:23Z →
   05:50:26Z) — số liệu không sai; đã sửa docstring rồi mới chạy.
   Bài học: sau adapt bằng sed, grep cả docstring, không chỉ code.
10. **F-136-T2-8 — merged 4 phạm vi bỏ sót ~/agents + ~/memory;
    đối chiếu T6 hẹp khung chết #91? thêm 32 s (mới, §2.4 phát hiện
    4):** mốc cuối đoạn B theo 4 phạm vi là 04:41:55Z (snapshot
    proactivity); T6-136 đọc 04:42:10Z từ session jsonl
    `~/agents/agent-906cd2df-…/sessions/….jsonl`; T2 kiểm trực tiếp
    bằng stat: file đó + `sessions.json` có mtime **04:42:27Z**
    (T6 đọc lúc file đang ghi dở). Khung chết #91? chốt
    (04:42:27Z, 05:29:18Z] = 2.811 s. Bài học: khi chốt khung chết,
    kiểm thêm ~/agents (session runtime) + ~/memory ngoài 4 phạm vi
    merged — hai cây này đã từng cho mốc muộn hơn trong quá khứ
    (tiền lệ: mốc session T10 đợt 135). Verdict đoạn B không đổi.
11. **preview.tsx ĐÃ KHÔI PHỤC fix 530e10a7 — theo quyết parent,
    không phải sai số (mới, §0 + §3 cuối):** md5 530e10a7 — fix
    instrumentation của T3-134 theo quyết parent đợt 135 §12.3(a)
    (KHÔI PHỤC/GIỮ làm instrumentation chẩn đoán tới khi điều tra
    (c2) đạt verdict; đợt 136 đo lượt yên #13 bằng logger nới).
    media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts (apps/web/)
    KHÔNG ĐỔI ee80d093. T2 không sửa production file nào.
12. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 134 §12.3(d) đã đính chính T5-134 viết
    "nhắc lần 17" là sai; số đếm giữ 16. File LIMITS này KHÔNG
    viết số 17 ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND136_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–135).
- **Thư mục làm việc:** `hidden_files/round136-t2/` — prereg-t2.md,
  boot-verify.txt, status1/once/status2 + .exit, blind55-investigate.py
  + .log, blind55-sessions.py + .log, blind55-merged.py + .log,
  blind55-gaps.py + .txt, blind55-repo-1.txt, blind55-hidden_files.txt,
  blind55-outside.txt, blind55-tmp.txt, sessions-all.txt,
  blind53b-recheck-investigate.py + .log, blind53b-recheck-sessions.py
  + .log, blind53b-recheck-merged.py + .log, blind53b-repo-1.txt,
  blind53b-hidden_files.txt, blind53b-outside.txt, blind53b-tmp.txt,
  eperm-sweep55.py + eperm-sweep-run.log, ram-max55.py + ram-max.txt,
  scan-wfs.sh + scan-meta.txt + files-*.bin +
  wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round136-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round136-t2.done`.
- **Mù #56 MỚI MỞ** từ probe #55 (05:50:26Z 18/11) — việc của T2
  đợt 137.


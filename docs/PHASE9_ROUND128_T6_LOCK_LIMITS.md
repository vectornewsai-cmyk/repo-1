# PHASE9 ROUND128 T6 — Sức khỏe lock v2 + prune cooldown lần 3 + dọn Xvfb sót — LIMITS

- Đợt: 128, luồng T6 (sức khỏe lock v2 + prune cooldown + kiểm dọn Xvfb sót).
  Lượt cron 12:35 +07 17/11/2026. Chạy 05:39–05:44Z 17/11/2026
  (12:39–12:44 +07 17/11).
- Nhiệm vụ: đếm lại lock vite theo đúng phương pháp chính thức
  (số file + tổng byte), kiểm lock trống/sạch, ghi ticket/cooldown;
  kiểm prune cooldown theo đúng luật; kiểm dọn Xvfb (:197 sót
  đợt 127); ghi nhận luật đứng mới "mỗi driver tự kill Xvfb
  của mình" ở các driver đợt 128 (chỉ ghi nhận, không can thiệp
  luồng khác). KHÔNG sửa logic lock, KHÔNG sửa script lock,
  KHÔNG đụng production. Mọi thí nghiệm acquire/release dùng
  lock dir /tmp riêng; lock thật chỉ đọc qua `status` — ngoại
  trừ chính thao tác prune file cooldown đã phê duyệt.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round128-t6/` (analyze-log.py,
  analyze-log-final.txt, new-lines-since-681.txt,
  cooldown-now.txt, cooldown-after-prune.txt,
  prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
  ps-full-2.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg.sh, repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI #74 (sau khi đợt 127 đã đóng)

- **Boot mới: boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`,
  btime 04:55:04Z** (`uptime -s` = 04:55:04Z, `who -b` =
  Nov 17 04:55). Uptime ~45 phút lúc T6 bắt đầu (05:40Z).
- Boot #73 (btime 03:04:25Z) sống **1h50m39s** (6.639 s) rồi
  chết trong khoảng (04:28:53Z, 04:55:04Z] — tức SAU khi T10
  đóng đợt 127 (RELEASED cuối 04:28:53Z) và TRƯỚC khi lượt
  cron đợt 128 mở (12:35:51 +07 = 05:35:51Z). Số hiệu #74 là
  số tạm theo thứ tự thời gian (T5 đợt 128 đã gọi b74 trong
  `round128-t5/t5-postboot-b74-*` — khớp nhau; việc chốt số
  hiệu/thời điểm reboot thuộc T5, mù #47).
- **Reboot #74 đã xóa Xvfb :197 sót của T3 đợt 127** (pid
  15103, start 03:47Z): lúc mở đợt `/tmp/.X11-unix/` TRỐNG,
  0 Xvfb đang chạy, pid 15103 không còn. T3 vẫn KHÔNG tự
  kill Xvfb của mình — việc dọn lần này là do reboot, không
  phải do driver dọn (xem §8).
- md5 khớp baseline đợt 120–127: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 128 khác đang bắt đầu song song (lúc T6 kết
  thúc 05:44Z đã có thư mục round128-t1/t4/t5/t8/t10; t1 còn
  trống, t5 đang chờ replay boot #74, t8 đang verify DEF,
  t4 chuẩn bị probe #47, t10 chuẩn bị O8).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit thật, 0 cổng lắng nghe

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 05:41Z và
  05:43Z (2 snapshot `ps-full-1.txt`, `ps-full-2.txt`).
- Đếm trạng thái Z (cột STAT): **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  05:41Z và 05:43Z.
- Kiểm theo cột comm (`node`/`vite`/`webkit`/`MiniBrowser`/
  `Xvfb`): **0 tiến trình thật** ở cả 2 snapshot. Không có
  dòng nào khớp `vite|node|webkit` ngoài shell chẩn đoán của
  chính T6 (đã loại như các đợt trước).
- Replay apt-get sau boot mới #74: **đang chạy, T5-128 đang
  chờ** (`round128-t5/t5-wait-replay-b74.log`) — thuộc T5,
  T6 chỉ ghi nhận. **Lock không bị ảnh hưởng: trống trong
  suốt thời gian replay chạy.**

## 2. Lock sau boot mới #74: TRỐNG, holder cuối đợt 127 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 05:40Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 127,
  `t10-round127-chr` RELEASED hold 53s lúc **04:28:53Z**, tức
  **26'11" TRƯỚC boot mới (04:55:04Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như boot #60 ở T9 đợt 120, boot #62 ở T6
  đợt 121, boot #64 ở T6 đợt 122, boot #66 ở T6 đợt 123,
  boot #68 ở T6 đợt 124, boot #69? ở T6 đợt 125, boot #71
  ở T6 đợt 126, boot #72 ở T6 đợt 127).
- `status` lúc 05:41Z và 05:43Z: `TRỐNG (không có lock)`,
  `0 ticket + 67 cooldown`, rc=0 (cả hai lần).
- Khoảng yên: **không có event lock nào từ 04:28:53Z tới
  lúc T6 đóng (05:44Z)** — 1h15' yên lặng, bao gồm ~45 phút
  đầu sau boot mới. Yên lặng này là do đợt 127 đã đóng và
  các luồng đợt 128 chưa tới lượt dùng lock — không phải do
  lock kẹt (bằng chứng: suite /tmp §6 chạy xanh trên bản
  script hiện hành).
- **Đợt 128 tới 05:44Z: 0 event lock** (`grep -c round128`
  trên log = 0). Các luồng đợt 128 chưa dùng lock thật tới
  thời điểm này — T6 đợt 129 kiểm tiếp.

## 3. Đóng nợ T6-127: 21 chu kỳ mới sau snapshot 02:47Z, tất cả nhả sạch — round 127 khép sạch trên lock

Từ sau snapshot T6 đợt 127 (681 dòng lúc ~02:47Z 17/11) tới
nay (748 dòng lúc 05:44Z): **+67 dòng = TICKET +21 /
ACQUIRED +21 / RELEASED +21 / COOLDOWN +4 / TIMEOUT +0 /
STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng con số, không
có event nào mất dấu hay thêm lạ. (21 chu kỳ = 6 của t8 +
12 của t3 + 1 của t3-warm + 1 của t10 + 1 của t10-chr.)

- **`t8-round127`: 6 chu kỳ sạch sau snapshot** (tổng đợt
  127: 9 chu kỳ, 33 dòng):
  - Retry 1 trên boot #72 (02:56Z): 3 chu kỳ probe, hold
    2/1/2s, wait 0/15/15s (15s = chờ cooldown).
  - Attempt 3 trên boot #73: **84l10** (03:12:33Z, hold 67s,
    cổng 5390, wait 0s); **85m4** (03:13:55Z, hold **900s**,
    cổng 5490, wait 15s); **86n2** (03:29:10Z, hold 232s,
    cổng 5490, wait 16s).
  - **85m4 hold 900s là hold dài nhất từng ghi trên lock
    này** (vượt 250s của t8 đợt 126) — driver `timeout 900`
    kill harness đúng lúc 900s, nhưng lock vẫn được **nhả
    sạch qua trap** (RELEASED 03:28:55Z, đúng giây bị kill;
    không có TIMEOUT event nào được log vì kill đến từ bên
    ngoài driver, không phải từ cơ chế timeout nội bộ của
    lock). Đây là bằng chứng live rằng trap release hoạt
    động ngay cả khi harness bị giết giữa chừng — lock
    không kẹt lại sau 85m4.
- **`t3-round127`: 12 chu kỳ sạch** (03:50:08–04:08:07Z),
  hold 34–44s, wait 0–1s — đúng 12 run của leg xen kẽ
  (6 dial + 6 Yên). Không có COOLDOWN log nào cho t3 (các
  lần acquire cách nhau >15s nên không chờ cooldown).
- **`t3-round127-warm`: 1 chu kỳ sạch** (03:49:38Z, hold
  ~1s — chỉ có 3 dòng TICKET/ACQUIRED/RELEASED).
- **`t10-round127` + `t10-round127-chr`: 1 chu kỳ sạch mỗi
  luồng** (04:26:16Z hold 55s; 04:28:00Z hold 53s, cổng
  5554, wait 0s) — suite đóng + O8 Chromium rerun trên
  display :199.
- **Round 127 khép lại sạch trên lock: 24 TICKET = 24
  ACQUIRED = 24 RELEASED (mang tên round127), 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 04:28:53Z.**
  (T6-127 tới 02:47Z mới chỉ kiểm được 3 chu kỳ của t8;
  21 chu kỳ còn lại đã kiểm hết tại đây — ĐÓNG NỢ.)
- Các luồng đợt 127 còn lại (t1/t2/t4/t5/t6/t7/t9) không có
  event lock thật nào trong cả đợt — tức không dùng lock
  thật (không phải vi phạm, chỉ là không dùng).

## 4. Nhất quán log lock: 748 dòng, 216/216 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~05:44Z
(14/11 18:01:32Z → 17/11 04:28:53Z; script ghép cặp
`round128-t6/analyze-log.py` — tái dùng từ round127, output
`analyze-log-final.txt` lúc 748 dòng):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 229 | 138 | 132 |
| ACQUIRED | 220 | 138 | 132 |
| RELEASED | 216 | 138 | 132 |
| COOLDOWN | 69 | 61 | 56 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 5 | **0** | 0 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **748** | **475** | **452** |

- So với snapshot T6 đợt 127 (681 dòng lúc ~02:47Z 17/11):
  +67 dòng, đúng bằng TICKET +21 / ACQUIRED +21 /
  RELEASED +21 / COOLDOWN +4 / TIMEOUT +0 / STALE-LOCK +0
  — khớp từng con số, không có event nào mất dấu hay thêm
  lạ.
- Ghép cặp theo thread: **216 cặp ACQUIRED→RELEASED, 0 lock
  đang giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước
  đó.** Chênh ACQUIRED − RELEASED = 4, đúng bằng 4 ca
  "double-acquire" cũ — không có lock nào mất dấu.
- 4 ca "double-acquire" — **cùng đúng 4 ca T9 đợt 120 đã
  liệt kê** (s3-round116, t3-round117, t4, t3-round119), tất
  cả giải thích được bằng STALE-LOCK cướp sau reboot; **không
  có ca mới nào** từ sau snapshot T9.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũng toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11, dọn holder chết vì reboot #58
  theo luật boot đổi — đã xác nhận ở T9 đợt 120 §4).
- Round 120/121/122/123/124/125/126/127 khép lại sạch trên
  lock (đã ghi các đợt trước; round 127 khép sạch — xem §3).
  Cửa sổ R120: **138 = 138 = 138**, 0 TIMEOUT, 0 STALE-LOCK
  (tăng từ 117=117=117 ở T6-127 đúng bằng 21 chu kỳ mới).
- Đếm loại event trên toàn log: 229+220+216+69+8+5+1 = 748 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log. **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 127 (toàn đợt) và đợt 128 (tới 05:44Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round127-t*/` + `round128-t*/` (tới 05:44Z). Tổng
**15 dòng khớp, phân loại đủ 15/15 — tất cả đều là bản sao
script, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 15 | 5 file × 3 dòng: `round127-t3/vcut-vite-lock-v2.frozen.sh`, `round127-t9/vcut-vite-lock-v2.frozen.sh`, `round127-t10/vcut-vite-lock-v2.t10.sh`, `round128-t4/vcut-vite-lock-v2.frozen.sh`, `round128-t10/vcut-vite-lock-v2.t10.sh` — mỗi file 3 dòng: comment dòng 118 ("BỎ QUA pid đó") + 2 dòng code `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| File grep-output của chính T6 | 0 | Đợt này T6 loại `khong-nha-grep.txt` và `repro-newmsg.log` khỏi grep ngay từ đầu (như T6 đợt 123–127 đã loại `khong-nha-grep`); file `khong-nha-grep.txt` của T6 đợt này (15 dòng, toàn bản sao script) sẽ bị grep đợt sau khớp lại — T6 đợt 129 tiếp tục loại `khong-nha-grep` |
| Tái hiện có kiểm soát trên /tmp | 0 trong đếm này | `round128-t6/repro-newmsg.log` (và `round127-t6/repro-newmsg.log`) đã loại khỏi grep; repro đợt này có đúng 2 dòng `BỎ QUA` + 1 dòng `KHÔNG NHẢ` có kiểm soát (xem §6) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 127 (toàn đợt) / 128 nào |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 tới 05:44Z = 0.** Khớp với log pairing sạch
  ở §4 (216/216 cặp, 0 TIMEOUT, 0 STALE-LOCK).
- Lưu ý đếm: T6-127 đếm 14 dòng bản sao script (7 file × 2
  dòng `echo`) vì grep đợt đó không khớp comment dòng 118;
  đợt này grep khớp cả comment nên mỗi file 3 dòng. Khác
  biệt chỉ là phạm vi grep, không phải sự kiện mới — 0 sự
  kiện thật ở cả hai cách đếm.
- Giới hạn phạm vi: các luồng đợt 128 vẫn đang chạy, log của
  chúng có thể tăng sau 05:44Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 128, T6 đợt 129 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
#74 (`c279cf46…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round128-t6/test-v2-t6-run1.log` 05:42:00Z,
  `test-v2-t6-run2.log` 05:42:26Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ tư liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127 cũng vậy). Tính
    flaky của T7 (T9 đợt 119 §1.2) vẫn được ghi nhận là bản
    chất — bốn lần xanh kép không xóa nó; quyết tách T7 khỏi
    gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không tự
    đổi test.
  - Kết luận suite: xanh lần thứ mười liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128).
- **Tái hiện message mới (`round128-t6/repro-newmsg.log`,
  05:42:26Z)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122/123/124/125/126/127, kết quả giống hệt:
  - A. Double-release (acquire tA → release → release lần 2):
    lần 2 in đúng `BỎ QUA release thừa — lock đã trống...`,
    rc=1; status TRỐNG trước và sau; log repro chỉ có đúng
    1 dòng RELEASED cho tA.
  - B. Release khi lock trống từ đầu: cùng câu `BỎ QUA...`,
    rc=1.
  - C. Đối chứng — release sai thread trong lúc tH đang giữ:
    `KHÔNG NHẢ — lock đang do 'tH' giữ, không phải 'tX'...`,
    rc=1; status sau đó vẫn hiện owner tH (guard hoạt động),
    rồi release tH sạch rc=0.
  - Kết luận: **fix text đợt 120 không đổi hành vi; guard còn
    nguyên; thông báo mới phân biệt rõ 2 trường hợp.**
- Bằng chứng lock thật đang chạy tốt trên bản `cd0c05c1`:
  **21 chu kỳ acquire/release thật sau snapshot T6 đợt 127
  đều sạch (§3)** — trong đó có chu kỳ 900s của 85m4 vẫn
  nhả qua trap khi harness bị giết — đây là bằng chứng live
  (không phải chỉ suite /tmp) rằng lock v2 hoạt động đúng
  qua boot #73 và trống sạch sang boot mới #74.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #74,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (216/216
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120–127
  (toàn đợt) và đợt 128 (tới 05:44Z), suite 9/9 độc lập ×2
  lần chạy (T7 xanh cả hai lần), và holder live cuối đợt 127
  đã nhả sạch trước reboot (hold dài nhất 900s vẫn nhả đúng
  qua trap).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 3 liên tiếp)

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG).

- **Trình tự thực hiện:**
  - 05:41Z: lock TRỐNG, 67 cooldown. Liệt kê ứng viên
    mtime >7 ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng). File cũ nhất
    `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
    lúc 05:43Z mới **~2,5 ngày tuổi**, còn xa ngưỡng 7 ngày.
  - 05:43Z: lock vẫn TRỐNG (0 ticket + 67 cooldown). Quét
    lại ứng viên mtime >7 ngày: **vẫn 0 file**. Tổng 67 file
    ≤ trần mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 128: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` rỗng. Vì tập ứng viên rỗng nên
    không thực thi thao tác xóa nào (không có gì để xóa).
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày vào khoảng **21/11 18:38Z**; T6 các đợt sau đếm
    tiếp. Đây là lần thứ 3 liên tiếp prune xóa 0 file
    (đợt 126: 0; đợt 127: 0; đợt 128: 0).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126):** 67 file / 938 byte lúc 05:41Z (khớp cả ba cách
  đếm độc lập: `find` 67, `ls` 67, `status` "67 cooldown";
  67 × 14 = 938 khớp) → **67 file / 938 byte lúc 05:43Z**
  (khớp ba cách đếm; 67 × 14 = 938 khớp). Chuỗi: 62 (đợt
  127 lúc 02:41Z) + 5 tên mới từ các lượt nhả muộn đợt 127
  (`cooldown-t3-round127-warm`, `cooldown-t3-round127`,
  `cooldown-t8-round127`, `cooldown-t10-round127`,
  `cooldown-t10-round127-chr`) = 67 ✓. (Số 63 của T6-127
  là lúc 02:47Z — đã gồm `cooldown-t8-round127`; +4 net kể
  từ 02:47Z là 4 tên còn lại.) Danh sách `comm` cho 0 tên
  mất. **T6 ghi số đếm chính thức 67 theo phương pháp
  đợt 126.** Không file nào bị xóa giữa hai lần đếm.
- Phân tầng tuổi lúc 05:43Z: **>7 ngày: 0 file; 48h–7 ngày:
  0 file; 24–48h: 0 file** — toàn bộ 67 file nằm trong
  khoảng **0–2,5 ngày tuổi** (cũ nhất 14/11 18:38Z, mới
  nhất 17/11 04:28:53Z), không file nào >48h. (So với đợt
  127: 63 file / 882 byte, cũ nhất 14/11 18:38Z — cùng file
  cũ nhất, +4 net kể từ 02:47Z.)

## 8. Dọn Xvfb: :197 sót đợt 127 ĐÃ MẤT sau reboot #74 — KHÔNG phải do driver dọn; luật đứng mới đã có trong code driver đợt 128

- **Lúc mở đợt (05:39Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy, pid 15103 (Xvfb :197 của T3 đợt 127, start
  03:47Z) không còn. Kiểm lại lúc 05:43Z: vẫn trống, vẫn
  0 Xvfb. **:197 đã mất sau reboot #74 (04:55:04Z)** — tmpfs
  `/tmp` bị xóa khi reboot; T3 đợt 127 vẫn không tự kill
  Xvfb của mình (không có bằng chứng nào cho thấy T3 đã
  dọn trước reboot: Xvfb còn sống tới ít nhất 04:28Z khi
  T10 phải chạy lại O8 trên :199 vì :197 bận).
- **Luật đứng mới (quyết parent đợt 127 §12.2(k)): "mỗi
  driver tự kill Xvfb của mình khi xong" — kiểm các driver
  đợt 128 (chỉ ghi nhận, không can thiệp):**
  - **T4 đợt 128 — TUÂN THỦ THEO THIẾT KẾ (chưa chạy tới
    lúc kiểm):** script probe
    `round128-t4/probe121t3-ghost-k7.webkit.mjs` tự spawn
    Xvfb trên display trống :193–:197 (kiểm socket + process
    trước khi chọn) và có `cleanup()` SIGKILL Xvfb của mình,
    đăng ký trên `process.on("exit")` + `SIGINT`, cộng 2
    điểm gọi cleanup tường minh (dòng 565, 937) và kill thử lại khi
    đổi display (dòng 270). Tới 05:43Z T4 chưa mở Xvfb nào
    (0 Xvfb đang chạy) nên chưa có hành vi live để kiểm —
    T6 đợt 129 kiểm sau khi T4 chạy probe.
  - **T10 đợt 128 — CÓ Ý THỨC PHÒNG NGỪA:** script
    `t10-o8-chromium-rerun128.sh` ghi chú rõ lần 1 đợt 127
    exit=2 vì Xvfb :197 sót; verify script có bước
    `xvfb-lock` chạy `test-xvfb-display-lock.mjs`. T10 chưa
    chạy O8 tới lúc kiểm.
  - **T5 đợt 128 — GHI NHẬN ĐÚNG:** `round128-t5/
    t5-initial-state.md` ghi "Xvfb :197 sót của T3 đợt 127
    đã hết (reboot xóa); 0 Xvfb" — khớp quan sát độc lập
    của T6.
  - **T1/T8 đợt 128:** t1 chưa có file; t8 đang verify DEF
    bằng script Python (không dùng Xvfb). Không có Xvfb
    nào của đợt 128 tới 05:44Z.
  - **Kết luận:** tới 05:44Z đợt 128 chưa mở Xvfb nào nên
    chưa có Xvfb sót mới; code driver T4 đã có cleanup theo
    luật đứng. **Không kill process nào** trong phiên này
    (không có Xvfb sót để kill; T6 không đụng process luồng
    khác theo nhiệm vụ).

## 9. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#74) là số tạm, chưa xác minh độc
  lập:** boot đợt 127 là #73 (T5 ghi, T6 đợt 127 ghi);
  journal/wtmp chỉ giữ boot 04:55:04Z nên T6 suy ra đây là
  boot sau #73 (= #74) từ thứ tự thời gian, và T5 đợt 128
  cũng gọi b74. Việc chốt số hiệu/thời điểm reboot thuộc T5
  (mù #47 — parent đã chấp nhận ĐỂ MỞ theo tiền lệ).
  Khoảng chết của #73: (04:28:53Z, 04:55:04Z] — trong khoảng
  này không có event lock nào (lock đã yên từ 04:28:53Z)
  nên không có quan sát lock nào thu hẹp được khoảng; T6
  không tự đếm mù (thuộc T4/T5).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ tư
  liên tiếp không xóa tính flaky. Quyết tách T7 khỏi gate
  9/9 khi đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** —
  `vite-lock: KHÔNG NHẢ — owner hiện tại là '...', không
  phải '...'` (T6 đợt 126 đã kiểm dòng 191; đợt này T6
  không đọc lại dòng 191 — md5 v1 khớp baseline
  `fd21193c` nên nội dung frozen không đổi theo định nghĩa).
  T6 đợt 120 đã ghi nợ; đang đóng băng, cần parent quyết
  "mở băng" nếu muốn đồng bộ message. Chỉ ghi nhận, không
  tự mở băng.
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round127-t*/` (toàn đợt)
  + `round128-t*/` tới 05:44Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 128 vẫn đang tăng sau thời điểm đếm; T6 đợt 129 đếm
  tiếp.
- **Prune cooldown lần 3 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 67 ≤ trần 100). File cũ nhất đủ
  7 ngày vào khoảng 21/11 18:38Z — T6 các đợt sau đếm tiếp.
  Luật đã chạy đúng trình tự (quét ứng viên 2 lần khi lock
  trống; tập ứng viên rỗng nên không thực thi xóa).
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 05:43Z (trống, 0 ticket + 67 cooldown); đợt còn
  chạy tới ~08:00Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124/125/126/127 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 128 chưa kiểm:** 0 event
  tới 05:44Z. T6 đợt 129 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 128 chưa kiểm live:**
  chưa có Xvfb nào được mở tới 05:44Z; code T4 đã có
  cleanup. T6 đợt 129 kiểm sau khi T4/T8/T10 chạy probe/
  harness (đặc biệt: T4 có kill Xvfb sau probe #47 không).
- **Replay apt-get sau boot mới #74 chưa kết thúc lúc T6 đóng**
  (T5-128 đang chờ — `t5-wait-replay-b74.log`): T6 không kết
  luận nó kết thúc ra sao — thuộc T5, hạ tầng/postboot;
  lock không bị ảnh hưởng (trống, 0 ticket).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 10. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND128_T6_LOCK_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file), Xvfb (không có gì để kill — :197 đã
mất sau reboot #74).
Stage: `repo-1-push/paths-loop/phase9-round128-t6-lock.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round128-t6/` (analyze-log.py,
analyze-log-final.txt, new-lines-since-681.txt,
cooldown-now.txt, cooldown-after-prune.txt,
prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
ps-full-2.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg.sh, repro-newmsg.log).

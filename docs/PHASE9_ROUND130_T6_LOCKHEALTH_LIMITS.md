# PHASE9 ROUND130 T6 — Sức khỏe lock v2 + prune cooldown lần 5 + ghi ngữ nghĩa find -mtime vào luật prune — LIMITS

- Đợt: 130, luồng T6 (sức khỏe lock v2 + prune cooldown + ghi ngữ
  nghĩa `find -mtime`).
  Lượt cron 18:35 +07 17/11/2026. Chạy 11:37–11:40Z 17/11/2026
  (18:37–18:40 +07 17/11).
- Nhiệm vụ: kiểm lock vite sau boot mới #77 theo đúng phương pháp
  chính thức; prune cooldown lần 5 theo luật đã phê duyệt (KHÔNG
  đổi phương pháp đếm — quyết parent LIMITS gộp đợt 129 §12.3(e));
  ghi rõ ngữ nghĩa `find -mtime` (≥192h/≥72h) vào luật prune;
  kiểm nợ mù #37 (đã đếm xong ở T6-129 §8 — xem §8). KHÔNG sửa
  logic lock, KHÔNG sửa script lock, KHÔNG đụng production. Mọi
  thí nghiệm acquire/release dùng lock dir /tmp riêng; lock thật
  chỉ đọc qua `status` — ngoại trừ chính thao tác prune file
  cooldown đã phê duyệt.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round130-t6/` (analyze-log.py,
  analyze-log-final.txt, new-lines-since-763.txt,
  cooldown-now.txt, cooldown-after-prune.txt,
  prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
  ps-full-2.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT MỚI #77

- **Boot mới: boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`,
  btime 10:56:31Z** (`uptime -s` = 10:56:31Z, `who -b` =
  Nov 17 10:56, `/proc/1` 10:56:42Z). Uptime ~41' lúc T6
  bắt đầu (11:37Z).
- Khớp log mở đợt 130 của parent (boot_id + btime + RAM mở
  ~1.025 MB). Số hiệu #77 là số theo thứ tự thời gian sau
  #76 (btime 09:02:12Z); việc chốt số hiệu/thời điểm reboot
  thuộc T5 (mù #49 — T2 đang probe #49 đợt 130).
- Boot #76 (88f62ae6, btime 09:02:12Z) sống **1h54'19" danh
  nghĩa** (6.859 s, btime→btime) rồi chết trong khoảng
  **(10:02:05Z, 10:56:31Z]** — 10:02:05Z là lúc T10 đóng đợt
  129 (LIMITS gộp đợt 129). Không có event lock nào trong
  khoảng chết (lock đã yên từ 09:58:53Z).
- md5 khớp baseline đợt 120–129: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 130 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round130-t2/t4/t5/t8/t9; T5 đang watcher replay
  boot #77 — xem §9; T4 chưa chạy probe vì gate POSTBOOT_PASS
  chưa có).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit thật, 0 cổng lắng nghe

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 11:38Z và
  11:39Z (2 snapshot `ps-full-1.txt`, `ps-full-2.txt`).
- Đếm trạng thái Z: **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  11:38Z và 11:39Z (chỉ dòng header).
- Kiểm theo comm (`node`/`vite`/`webkit`/`MiniBrowser`/
  `Xvfb`): **0 tiến trình thật** ở cả 2 snapshot (đã loại
  shell chẩn đoán của chính T6 như các đợt trước).
- Replay apt-get sau boot mới #77: **ĐANG CHẠY** lúc T6 kiểm
  (T5 watcher poll 1 lúc 11:38:18Z, postboot_exit=1 — xem
  §9). **Lock không bị ảnh hưởng: trống trong suốt thời
  gian replay chạy.**

## 2. Lock sau boot mới #77: TRỐNG, holder cuối đợt 129 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 11:37Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 129,
  `t10-round129` RELEASED hold 138s lúc **09:58:53Z**, tức
  **57'38" TRƯỚC boot mới (10:56:31Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như các boot #60/#62/#64/#66/#68/#71/#72/
  #74/#75 ở các đợt trước).
- `status` lúc 11:37Z và 11:39Z: `TRỐNG (không có lock)`,
  `0 ticket + 71 cooldown`, rc=0 (cả hai lần).
- Khoảng yên: **không có event lock nào từ 09:58:53Z tới
  lúc T6 đóng (11:40Z)** — 1h41' yên lặng, bao gồm ~44'
  đầu sau boot mới. Yên lặng này là do đợt 129 đã đóng và
  các luồng đợt 130 chưa tới lượt dùng lock — không phải do
  lock kẹt (bằng chứng: suite /tmp §6 chạy xanh trên bản
  script hiện hành).
- **Đợt 130 tới 11:40Z: 0 event lock.** Các luồng đợt 130
  chưa dùng lock thật tới thời điểm này — T6 đợt 131 kiểm
  tiếp.

## 3. Đóng nợ T6-129: 10 chu kỳ mới sau snapshot 763 dòng — 9 nhả sạch, 1 acquire chết theo reboot #75→#76 (đã có STALE-LOCK dọn đúng luật)

Từ sau snapshot T6 đợt 129 (763 dòng lúc ~08:48Z 17/11) tới
nay (796 dòng lúc 11:40Z): **+33 dòng = TICKET +10 /
ACQUIRED +10 / RELEASED +9 / COOLDOWN +3 / TIMEOUT +0 /
STALE-LOCK +1 / STALE-TICKET +0.** Khớp từng con số, không
có event nào mất dấu hay thêm lạ. (Chi tiết từng dòng trong
`round130-t6/new-lines-since-763.txt`.)

- **`t4`: 1 chu kỳ sạch** (08:51:24–08:54:56Z), hold 212s,
  cổng 5187, wait 0s — lượt yên WebKit #7 attempt1 (phần
  vite). Tái dùng file `cooldown-t4` đã có nên +0 cooldown
  net.
- **`t8-round129` trên boot #75: 2 chu kỳ, 1 sạch + 1 chết
  theo reboot** — ACQUIRED 08:59:52 cổng 5390 wait 0,
  RELEASED 09:01:03 hold 71s (sạch); ACQUIRED 09:01:36
  cổng 5490 wait 33s, **KHÔNG có RELEASED — process chết
  theo reboot #75→#76 lúc ~09:02:12Z** (đúng sự kiện reboot
  giữa lượt T8 đã ghi trong LIMITS T8 đợt 129).
- **`t3`: 3 chu kỳ sạch** — 09:00:58–09:01:35Z hold 30s
  cổng 5191 wait 7s (boot #75); 09:04:38–09:04:51Z hold 13s
  cổng 5191 wait 0s (boot #76, kèm STALE-LOCK dọn holder
  chết của t8 — xem dưới); 09:37:50–09:40:41Z hold 58s
  cổng 5191 wait 113s (boot #76).
- **`t8-round129` trên boot #76: 3 chu kỳ sạch** — ACQUIRED
  09:35:10 hold 97s; 09:37:02 hold 160s wait 15s; 09:40:42
  hold 274s wait 60s (cổng 5390/5490; 3 COOLDOWN, tái dùng
  1 file `cooldown-t8-round129` nên +1 file net).
- **`t10-round129`: 1 chu kỳ sạch** (09:56:35–09:58:53Z),
  hold 138s, cổng 5554, wait 0s — đóng đợt.
- **STALE-LOCK mới duy nhất (dòng 777, 09:04:38Z):** `t3`
  dọn holder chết `t8-round129` — owner pid 17164 chết +
  không vite trên cổng 5490 + curl 000 + **boot đổi**
  (tuổi 182s). Đây là **STALE-LOCK đầu tiên kể từ
  01:04:21Z 16/11** (đợt 119) và là ca "double-acquire" thứ
  5 toàn log (analyzer dòng 781: t8 ACQUIRED 09:35:10Z
  trong khi ACQUIRED 09:01:36Z trước đó chưa có RELEASED).
  Cả hai đều giải thích được bằng **reboot giữa lượt giết
  holder** — không phải bug lock: luật dọn stale theo boot
  đổi đã hoạt động đúng như thiết kế (T8 đã ghi reboot này
  trong LIMITS T8 đợt 129 §1).
- **Hệ quả trung thực — đợt 129 KHÔNG khép 100% sạch trên
  ghép cặp:** 10 ACQUIRED = 9 RELEASED + 1 acquire mất
  theo reboot (không thể RELEASED vì process đã chết cùng
  máy). Lock vẫn TRỐNG lúc đóng đợt (T10 đã đếm 0 ticket +
  71 cooldown lúc 10:02Z) và không còn gì đang giữ ở cuối
  log (§4). T10 đợt 130 ghi nhận caveat này khi đóng sổ;
  không phải lỗi cần sửa.
- Các luồng đợt 129 còn lại (t1/t2/t5/t6/t7/t9) không có
  event lock thật nào trong cả đợt — tức không dùng lock
  thật (không phải vi phạm, chỉ là không dùng).

## 4. Nhất quán log lock: 796 dòng, 230/230 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~11:40Z
(14/11 18:01:32Z → 17/11 09:58:53Z; script ghép cặp
`round130-t6/analyze-log.py` — tái dùng từ round129, output
`analyze-log-final.txt` lúc 796 dòng):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 244 | 153 | 147 |
| ACQUIRED | 235 | 153 | 147 |
| RELEASED | 230 | 152 | 146 |
| COOLDOWN | 72 | 64 | 59 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 6 | **1** | 1 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **796** | **523** | **500** |

- So với snapshot T6 đợt 129 (763 dòng lúc ~08:48Z 17/11):
  +33 dòng, đúng bằng TICKET +10 / ACQUIRED +10 /
  RELEASED +9 / COOLDOWN +3 / TIMEOUT +0 / STALE-LOCK +1
  — khớp từng con số, không có event nào mất dấu hay thêm
  lạ. (Lưu ý đếm: `grep -c TICKET` thô đếm 245 vì khớp cả
  dòng STALE-TICKET; số chính thức 244 dùng khớp từ chính
  xác như script analyze-log.py.)
- Ghép cặp theo thread: **230 cặp ACQUIRED→RELEASED, 0 lock
  đang giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước
  đó.** Chênh ACQUIRED − RELEASED = 5, đúng bằng 5 ca
  "double-acquire" — không có lock nào mất dấu.
- 5 ca "double-acquire" — 4 ca cũ T9 đợt 120 đã liệt kê
  (s3-round116, t3-round117, t4, t3-round119), tất cả giải
  thích được bằng STALE-LOCK cướp sau reboot; **+ 1 ca MỚI
  t8-round129 (dòng 781)** — giải thích bằng reboot #75→#76
  giết holder giữa lượt (§3), không phải ca mới do bug.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũ toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11) + **1 STALE-LOCK mới
  09:04:38Z 17/11 do reboot giữa lượt** (§3).
- Round 120/121/122/123/124/125/126/127/128 khép lại sạch
  trên lock (đã ghi các đợt trước). **Round 129 khép với
  caveat §3: 10 ACQUIRED / 9 RELEASED / 1 STALE-LOCK** (1
  acquire mất theo reboot, đã dọn đúng luật). Cửa sổ R120:
  **153 = 153 T/A, RELEASED 152** (chênh 1 đúng bằng ca
  reboot-kill), 0 TIMEOUT, STALE-LOCK 1 (mới, do reboot).
- Đếm loại event trên toàn log: 244+235+230+72+8+6+1 = 796 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log. **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 128 (toàn đợt), đợt 129 (toàn đợt) và đợt 130 (tới 11:40Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round128-t*/` + `round129-t*/` + `round130-t*/`
(tới 11:40Z). Tổng **10 dòng khớp, phân loại đủ 10/10 — tất
cả đều là bản sao script, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 10 | 5 file × 2 dòng: `round128-t4/vcut-vite-lock-v2.frozen.sh`, `round128-t10/vcut-vite-lock-v2.t10.sh`, `round129-t4/vcut-vite-lock-v2.frozen.sh`, `round129-t10/vcut-vite-lock-v2.t10.sh`, `round130-t4/vcut-vite-lock-v2.frozen.sh` — mỗi file 2 dòng `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| File grep-output của chính T6 | 0 | T6 loại `khong-nha-grep.txt` và `repro-newmsg.log` khỏi grep ngay từ đầu (như T6 đợt 123–130 đã loại `khong-nha-grep`); file `khong-nha-grep.txt` của T6 đợt này (10 dòng, toàn bản sao script) sẽ bị grep đợt sau khớp lại — T6 đợt 131 tiếp tục loại `khong-nha-grep` |
| Tái hiện có kiểm soát trên /tmp | 0 trong đếm này | `round130-t6/repro-newmsg.log` đã loại khỏi grep; repro đợt này có đúng 2 dòng `BỎ QUA` + 1 dòng `KHÔNG NHẢ` có kiểm soát (xem §6) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 128 (toàn đợt) / 129 (toàn đợt) / 130 nào |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn đợt),
  đợt 130 tới 11:40Z = 0.** Khớp với log pairing sạch ở §4
  (230/230 cặp, 0 TIMEOUT, STALE-LOCK mới duy nhất do
  reboot — không liên quan nhánh release).
- Giới hạn phạm vi: các luồng đợt 130 vẫn đang chạy, log của
  chúng có thể tăng sau 11:40Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 130, T6 đợt 131 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý: phạm vi đợt này bỏ round127 (T6-129 đã đóng toàn
  đợt 127); số dòng giảm 18→10 là do thu hẹp phạm vi, không
  phải file biến mất.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
#77 (`86538084…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round130-t6/test-v2-t6-run1.log` 11:39:11Z,
  `test-v2-t6-run2.log` 11:39:35Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ sáu liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127, 128, 129 cũng
    vậy). Tính flaky của T7 (T9 đợt 119 §1.2) vẫn được ghi
    nhận là bản chất — sáu lần xanh kép không xóa nó; quyết
    tách T7 khỏi gate 9/9 khi đợt đông vẫn thuộc về parent;
    T6 không tự đổi test.
  - Kết luận suite: xanh lần thứ mười hai liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128 + T6 đợt 129 + T6 đợt 130).
- **Tái hiện message mới (`round130-t6/repro-newmsg.log`,
  11:39:xxZ)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122/123/124/125/126/127/128/129, kết quả giống
  hệt:
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
  **9/10 chu kỳ acquire/release thật sau snapshot T6 đợt 129
  đều sạch (§3)** — chu kỳ thứ 10 mất theo reboot giữa lượt,
  đã được STALE-LOCK dọn đúng luật. Đây là bằng chứng live
  (không phải chỉ suite /tmp) rằng lock v2 hoạt động đúng qua
  boot #76 và trống sạch sang boot mới #77.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #77,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (230/230
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT mới từ đợt 120,
  STALE-LOCK mới duy nhất do reboot giữa lượt (đã dọn đúng
  luật, §3), 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  120–129 (toàn đợt) và đợt 130 (tới 11:40Z), suite 9/9 độc
  lập ×2 lần chạy (T7 xanh cả hai lần), và holder live cuối
  đợt 129 đã nhả sạch trước reboot.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 5 liên tiếp)

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG).

- **Trình tự thực hiện:**
  - 11:38Z: lock TRỐNG, 71 cooldown. Liệt kê ứng viên
    mtime >7 ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng). File cũ nhất
    `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
    lúc 11:38Z mới **~65h tuổi**, còn xa ngưỡng 7 ngày.
  - 11:39Z: lock vẫn TRỐNG (0 ticket + 71 cooldown). Quét
    lại ứng viên mtime >7 ngày: **vẫn 0 file**. Tổng 71 file
    ≤ trần mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 130: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày theo đồng hồ tường vào khoảng
    **21/11 18:38Z**; theo phương pháp `find -mtime +7`
    (≥192h, xem đính chính dưới) sẽ khớp ứng viên vào
    khoảng **22/11 18:38Z**. T6 các đợt sau đếm tiếp. Đây là
    lần thứ 5 liên tiếp prune xóa 0 file (đợt 126: 0; đợt
    127: 0; đợt 128: 0; đợt 129: 0; đợt 130: 0).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** 71 file / 994 byte lúc 11:38Z (khớp cả ba cách
  đếm độc lập: `find` 71, `ls` 71, `status` "71 cooldown";
  71 × 14 = 994 khớp) → **71 file / 994 byte lúc 11:39Z**
  (khớp ba cách đếm; 71 × 14 = 994 khớp). Khớp đúng số
  chính thức T10 đếm lúc đóng đợt 129 (71/994) — **0 file
  cooldown mới từ lúc đóng đợt 129 tới nay** (đợt 130 chưa
  dùng lock thật). Danh sách `comm` cho 0 tên mất. **T6 ghi
  số đếm chính thức 71 theo phương pháp đợt 126/128.**
  Không file nào bị xóa giữa hai lần đếm.
- Phân tầng tuổi lúc 11:38Z (ngữ nghĩa `find -mtime`,
  số ngày bị cắt phần lẻ — xem đính chính dưới): **>7 ngày
  (`-mtime +7`, tức ≥192h): 0 file; ≥72h (`-mtime +2`):
  0 file; ≥48h (`-mtime +1`): 20 file.** File cũ nhất
  65h01' tuổi lúc 11:38Z; mới nhất 09:58:53Z.
- **GHI NGỮ NGHĨA VÀO LUẬT (nhiệm vụ đợt này, quyết parent
  LIMITS gộp đợt 129 §12.3(e)) — ĐÃ LÀM:** chú thích ngữ
  nghĩa `find -mtime` đã được bổ sung vào luật prune đứng
  tại `docs/PHASE9_ROUND125_LIMITS.md` §12(c) (ngay sau
  bullet (c), dạng blockquote có ghi rõ "bổ sung đợt 130,
  theo quyết parent LIMITS gộp đợt 129 §12.3(e)"): `-mtime
  +7` chỉ khớp file **≥192h (8 ngày)**, `-mtime +2` chỉ
  khớp file **≥72h**; phương pháp `find` bảo thủ hơn chữ
  luật tối đa 24h — xóa muộn, không bao giờ xóa sớm. Chỉ
  bổ sung chú thích, **KHÔNG đổi hành vi prune, KHÔNG đổi
  phương pháp đếm** (file `PHASE9_ROUND125_LIMITS.md` có
  trong batch stage đợt này vì có sửa chú thích — xem §12).
  File cũ nhất đợt này mới 65h tuổi nên kết quả prune
  không đổi theo cách đếm nào.

## 8. Mù #37 — KHÔNG ĐỔI, KHÔNG ĐẾM LẠI (đã đếm xong ở T6-129 §8)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8): khoảng **11:39:50Z → 23:45:17Z 16/11
  (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ mở, tổng
  ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn
  C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7 đợt
  119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 16/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Nợ đếm đuôi sau mốc cuối đợt 128 → boot #75 đã ĐÓNG ở
  T6-129 §8.2 (53'26", 2 quan sát muộn + 49'01" im lặng).
  Đuôi sau mốc cuối đợt 129 (T10 đóng 10:02:05Z) → boot
  #77 (10:56:31Z) thuộc T5/T2 đợt 130 (mù #49) — T6 không
  đếm lại vì không phải nhiệm vụ đợt này và không thuộc
  mù #37.

## 9. Replay apt sau boot #77: ĐANG CHẠY (ghi nhận — thuộc T5)

- Watcher T5 (`round130-t5/t5-wait-replay-b77.sh`) poll 1
  lúc 11:38:18Z: postboot_exit=1. Postboot check poll0/poll1
  (11:38Z): **CHƯA ĐỦ** — GST: `/usr/lib/.../gstreamer-1.0`
  không tồn tại, file plugin hệ thống=0 (debroot=269), thiếu
  isomp4=1 libav=1; apt: 11 package chưa cài
  (libevent-2.1-7t64, gstreamer1.0-plugins-base/good/bad/
  ugly/gl/libav/x, libavif16, libgstreamer1.0-0, libevdev2)
  — replay hệ thống có thể đang cài dần.
- Lúc T6 đóng (11:40Z) replay vẫn đang chạy, cờ
  POSTBOOT_PASS đợt 130 **chưa có**; T4 (lượt yên #8) gate
  bằng cờ này nên chưa chạy probe. **Lock không bị ảnh
  hưởng** (trống, 0 ticket, suốt replay). T6 không kết luận
  gì thêm về replay — thuộc T5, hạ tầng/postboot.
- RAM khả dụng lúc T6 đóng: **2.479 MB** (free -m 11:40Z;
  total 7.934 MB). Dù lấy số nào cũng **< guard birefnet
  6.144 MB — birefnet KHÔNG thử** (u2net là fallback chính
  thức).

## 10. Dọn Xvfb: 0 Xvfb, 0 socket sót — chưa có gì để kiểm live về luật đứng

- **Lúc mở đợt (11:37Z), 11:39Z và lúc đóng (11:40Z):
  `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb đang chạy. Không có
  Xvfb sót nào từ đợt 129 (reboot #77 đã xóa tmpfs; T10 đợt
  129 cũng đã dọn tay 3 socket sót X193/X194/X195 lúc đóng).
- **Luật đứng "mỗi driver tự kill Xvfb của mình khi xong"
  (quyết parent đợt 127 §12.2(k)) — chưa có hành vi live để
  kiểm đợt này:** T4 đợt 130 chưa chạy probe (đang gate
  POSTBOOT_PASS #77 — xem §9); T8/T10 chưa chạy O8 tới lúc
  kiểm. **T6 đợt 131 kiểm sau khi T4/T8/T10 chạy probe/
  harness** (đặc biệt: T4 có kill Xvfb sau probe #49 không).
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).

## 11. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#77) là số tạm theo thứ tự thời gian:**
  boot đợt 129 là #76 (T5/T6 đợt 129 ghi, parent chốt btime
  chuẩn 09:02:12Z ở §12.3(h)); journal/wtmp chỉ giữ boot
  10:56:31Z nên T6 suy ra đây là boot sau #76 (= #77) từ
  thứ tự thời gian, và log mở đợt 130 của parent cũng gọi
  b77/btime 10:56:31Z. Việc chốt số hiệu/thời điểm reboot
  thuộc T5 (mù #49).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ sáu
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round128-t*/` (toàn đợt) +
  `round129-t*/` (toàn đợt) + `round130-t*/` tới 11:40Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). Log các luồng đợt 130 vẫn đang tăng sau thời điểm
  đếm; T6 đợt 131 đếm tiếp.
- **Prune cooldown lần 5 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 71 ≤ trần 100). File cũ nhất đủ
  7 ngày theo đồng hồ tường ~21/11 18:38Z, theo `find`
  ~22/11 18:38Z — T6 các đợt sau đếm tiếp. Chú thích ngữ
  nghĩa `find -mtime` đã ghi vào luật prune đứng
  (ROUND125 §12(c)) theo quyết parent — nợ này ĐÓNG.
- **Đợt 129 khép với caveat trên lock (§3):** 10 ACQUIRED /
  9 RELEASED / 1 STALE-LOCK do reboot giữa lượt giết holder
  (đã dọn đúng luật). Không phải bug lock; T10 đợt 130 ghi
  nhận caveat khi đóng sổ.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 11:39Z (trống, 0 ticket + 71 cooldown); đợt còn
  chạy tới ~14:35Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124/125/126/127/128/129 T10 đã đếm lúc đóng).
  T6 không chờ tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 130 chưa kiểm:** 0 event
  tới 11:40Z. T6 đợt 131 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 130 chưa kiểm live:**
  chưa có Xvfb nào được mở tới 11:40Z; T4 đang gate
  postboot. T6 đợt 131 kiểm sau khi T4/T8/T10 chạy probe/
  harness.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại. Đuôi
  sau mốc cuối đợt 129 → boot #77 thuộc T5/T2 (mù #49),
  không thuộc T6 đợt này.
- **Replay apt #77 đang chạy + watcher T5 chưa kết thúc**
  lúc 11:40Z (xem §9) — T6 chỉ ghi nhận, thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại; chỉ sửa chú
  thích trong 1 file LIMITS).

## 12. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND130_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |
| `docs/PHASE9_ROUND125_LIMITS.md` | Bổ sung chú thích ngữ nghĩa `find -mtime` vào luật prune đứng §12(c) (quyết parent đợt 129 §12.3(e)); không đổi hành vi prune |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file), Xvfb (không có gì để kill — 0 Xvfb,
0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round130-t6-lockhealth.txt`
(NUL-delimited, 2 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round130-t6/` (analyze-log.py,
analyze-log-final.txt, new-lines-since-763.txt,
cooldown-now.txt, cooldown-after-prune.txt,
prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
ps-full-2.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg.sh, repro-newmsg.log).

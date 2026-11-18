# PHASE9 ROUND129 T6 — Sức khỏe lock v2 + prune cooldown lần 4 + đếm mù #37 (đuôi sau boot #75) — LIMITS

- Đợt: 129, luồng T6 (sức khỏe lock v2 + prune cooldown + đếm mù #37).
  Lượt cron 15:35 +07 17/11/2026. Chạy 08:38–08:48Z 17/11/2026
  (15:38–15:48 +07 17/11).
- Nhiệm vụ: kiểm lock vite sau boot mới #75 theo đúng phương pháp
  chính thức; prune cooldown lần 4 theo luật đã phê duyệt; đếm đuôi
  mù #37 từ mốc cuối đợt 128 tới boot #75; ghi nhận replay apt #75
  (thuộc T5). KHÔNG sửa logic lock, KHÔNG sửa script lock, KHÔNG
  đụng production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` — ngoại trừ chính thao tác
  prune file cooldown đã phê duyệt.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round129-t6/` (analyze-log.py,
  analyze-log-final.txt, new-lines-since-748.txt,
  cooldown-now.txt, cooldown-after-prune.txt,
  prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
  ps-full-2.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/` (thư mục đó không chứa log
  lock; T6 đợt này đã xóa nhầm thư mục rỗng
  `repo-1/hidden_files/round129-t6/` tự tạo lúc đầu — chỉ chứa
  1 file ps, không mất dữ liệu).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI #75

- **Boot mới: boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`,
  btime 07:13:31Z** (`uptime -s` = 07:13:31Z, `who -b` =
  Nov 17 07:13, btime kernel 1794899611). Uptime ~1h25' lúc T6
  bắt đầu (08:38Z).
- Khớp T2 prereg đợt 129 + T5 watcher `t5-wait-replay-b75`
  (cùng boot_id + btime). Số hiệu #75 là số theo thứ tự thời
  gian sau #74 (btime 04:55:04Z); việc chốt số hiệu/thời điểm
  reboot thuộc T5 (mù #48 — T2 đang probe #48, xem §3).
- Boot #74 (c279cf46, btime 04:55:04Z) sống **2h18'27" danh
  nghĩa** (8.307 s, btime→btime) rồi chết trong khoảng
  **(06:24:30Z, 07:13:31Z]** — 06:24:30Z là quan sát cuối
  cùng của #74 (LIMITS gộp đợt 128, xem §3). Không có event
  lock nào trong khoảng chết (lock đã yên từ 06:20:06Z).
- md5 khớp baseline đợt 120–128: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 129 khác đang chạy song song (lúc T6 kết thúc
  08:48Z đã có thư mục round129-t2/t4/t5/t8/t9; t2 đã probe
  #48 xong, t5 watcher replay đã xong, t9 đang đo headroom,
  t4 đang gate0-wait, t8 đang verify).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit thật, 0 cổng lắng nghe

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:39Z và
  08:42Z (2 snapshot `ps-full-1.txt`, `ps-full-2.txt`).
- Đếm trạng thái Z: **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  08:39Z và 08:47Z (chỉ dòng header).
- Kiểm theo comm (`node`/`vite`/`webkit`/`MiniBrowser`/
  `Xvfb`): **0 tiến trình thật** ở cả 2 snapshot (đã loại
  shell chẩn đoán của chính T6 như các đợt trước).
- Replay apt-get sau boot mới #75: **ĐÃ XONG** lúc T6 kiểm
  (xem §4) — thuộc T5, T6 chỉ ghi nhận. **Lock không bị ảnh
  hưởng: trống trong suốt thời gian replay chạy và sau đó.**

## 2. Lock sau boot mới #75: TRỐNG, holder cuối đợt 128 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 08:39Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 128,
  `t10-round128` RELEASED hold 116s lúc **06:20:06Z**, tức
  **53'25" TRƯỚC boot mới (07:13:31Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như các boot #60/#62/#64/#66/#68/#71/#72/#74
  ở các đợt trước).
- `status` lúc 08:40Z, 08:42Z và 08:47Z: `TRỐNG (không có
  lock)`, `0 ticket + 69 cooldown`, rc=0 (cả ba lần).
- Khoảng yên: **không có event lock nào từ 06:20:06Z tới
  lúc T6 đóng (08:48Z)** — 2h28' yên lặng, bao gồm ~1h34'
  đầu sau boot mới. Yên lặng này là do đợt 128 đã đóng và
  các luồng đợt 129 chưa tới lượt dùng lock — không phải do
  lock kẹt (bằng chứng: suite /tmp §6 chạy xanh trên bản
  script hiện hành).
- **Đợt 129 tới 08:48Z: 0 event lock.** Các luồng đợt 129
  chưa dùng lock thật tới thời điểm này — T6 đợt 130 kiểm
  tiếp.

## 3. Đóng nợ T6-128: 5 chu kỳ mới sau snapshot 748 dòng, tất cả nhả sạch — round 128 khép sạch trên lock

Từ sau snapshot T6 đợt 128 (748 dòng lúc ~05:44Z 17/11) tới
nay (763 dòng lúc 08:48Z): **+15 dòng = TICKET +5 /
ACQUIRED +5 / RELEASED +5 / COOLDOWN +0 / TIMEOUT +0 /
STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng con số, không
có event nào mất dấu hay thêm lạ. (5 chu kỳ = 3 của t4 +
1 của t3-round128 + 1 của t10-round128 — khớp đúng con số
T10 đã báo lúc đóng đợt 128: "748 + 15: T3 3 + T4 9 +
T10 3".)

- **`t4`: 3 chu kỳ sạch** (05:45:48–06:02:47Z), hold
  219/213/258s, cổng 5187, wait 0s — probe WebKit lượt yên
  #7 attempt 1+2 (a1/a2). Tái dùng file `cooldown-t4` đã có
  nên +0 cooldown net.
- **`t3-round128`: 1 chu kỳ sạch** (06:06:44Z, hold 134s,
  cổng 5490, wait 0s) — 85m4 chạy lại.
- **`t10-round128`: 1 chu kỳ sạch** (06:18:10Z, hold 116s,
  cổng 5554, wait 0s) — O8 Chromium.
- **Round 128 khép lại sạch trên lock: 5 TICKET = 5
  ACQUIRED = 5 RELEASED (mang tên round128), 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 06:20:06Z.**
  (T6-128 tới 05:44Z mới kiểm được 0 chu kỳ của đợt 128;
  5 chu kỳ này đã kiểm hết tại đây — ĐÓNG NỢ.)
- Các luồng đợt 128 còn lại (t1/t2/t5/t6/t7/t8/t9) không có
  event lock thật nào trong cả đợt — tức không dùng lock
  thật (không phải vi phạm, chỉ là không dùng).

## 4. Nhất quán log lock: 763 dòng, 221/221 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~08:48Z
(14/11 18:01:32Z → 17/11 06:20:06Z; script ghép cặp
`round129-t6/analyze-log.py` — tái dùng từ round128, output
`analyze-log-final.txt` lúc 763 dòng):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 234 | 143 | 137 |
| ACQUIRED | 225 | 143 | 137 |
| RELEASED | 221 | 143 | 137 |
| COOLDOWN | 69 | 61 | 56 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 5 | **0** | 0 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **763** | **490** | **467** |

- So với snapshot T6 đợt 128 (748 dòng lúc ~05:44Z 17/11):
  +15 dòng, đúng bằng TICKET +5 / ACQUIRED +5 /
  RELEASED +5 / COOLDOWN +0 / TIMEOUT +0 / STALE-LOCK +0
  — khớp từng con số, không có event nào mất dấu hay thêm
  lạ. (Lưu ý đếm: `grep -c TICKET` thô đếm 235 vì khớp cả
  dòng STALE-TICKET; số chính thức 234 dùng khớp từ chính
  xác như script analyze-log.py.)
- Ghép cặp theo thread: **221 cặp ACQUIRED→RELEASED, 0 lock
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
- Round 120/121/122/123/124/125/126/127/128 khép lại sạch
  trên lock (đã ghi các đợt trước; round 128 khép sạch —
  xem §3). Cửa sổ R120: **143 = 143 = 143**, 0 TIMEOUT,
  0 STALE-LOCK (tăng từ 138=138=138 ở T6-128 đúng bằng
  5 chu kỳ mới).
- Đếm loại event trên toàn log: 234+225+221+69+8+5+1 = 763 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log. **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 128 (toàn đợt) và đợt 129 (tới 08:48Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round127-t*/` + `round128-t*/` + `round129-t*/`
(tới 08:48Z). Tổng **18 dòng khớp, phân loại đủ 18/18 — tất
cả đều là bản sao script, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 18 | 6 file × 3 dòng: `round127-t3/vcut-vite-lock-v2.frozen.sh`, `round127-t9/vcut-vite-lock-v2.frozen.sh`, `round127-t10/vcut-vite-lock-v2.t10.sh`, `round128-t4/vcut-vite-lock-v2.frozen.sh`, `round128-t10/vcut-vite-lock-v2.t10.sh`, `round129-t4/vcut-vite-lock-v2.frozen.sh` — mỗi file 3 dòng: comment dòng 118 ("BỎ QUA pid đó") + 2 dòng code `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| File grep-output của chính T6 | 0 | T6 loại `khong-nha-grep.txt` và `repro-newmsg.log` khỏi grep ngay từ đầu (như T6 đợt 123–128 đã loại `khong-nha-grep`); file `khong-nha-grep.txt` của T6 đợt này (18 dòng, toàn bản sao script) sẽ bị grep đợt sau khớp lại — T6 đợt 130 tiếp tục loại `khong-nha-grep` |
| Tái hiện có kiểm soát trên /tmp | 0 trong đếm này | `round129-t6/repro-newmsg.log` đã loại khỏi grep; repro đợt này có đúng 2 dòng `BỎ QUA` + 1 dòng `KHÔNG NHẢ` có kiểm soát (xem §6) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 127 (toàn đợt) / 128 (toàn đợt) / 129 nào |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 tới 08:48Z = 0.**
  Khớp với log pairing sạch ở §4 (221/221 cặp, 0 TIMEOUT,
  0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 129 vẫn đang chạy, log của
  chúng có thể tăng sau 08:48Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 129, T6 đợt 130 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
#75 (`475406f6…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round129-t6/test-v2-t6-run1.log` 08:43:47Z,
  `test-v2-t6-run2.log` 08:44:10Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ năm liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127, 128 cũng vậy).
    Tính flaky của T7 (T9 đợt 119 §1.2) vẫn được ghi nhận là
    bản chất — năm lần xanh kép không xóa nó; quyết tách T7
    khỏi gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không
    tự đổi test.
  - Kết luận suite: xanh lần thứ mười một liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128 + T6 đợt 129).
- **Tái hiện message mới (`round129-t6/repro-newmsg.log`,
  08:44:11Z)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122/123/124/125/126/127/128, kết quả giống hệt:
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
  **5 chu kỳ acquire/release thật sau snapshot T6 đợt 128
  đều sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua boot #74 và
  trống sạch sang boot mới #75.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #75,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (221/221
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120–128
  (toàn đợt) và đợt 129 (tới 08:48Z), suite 9/9 độc lập ×2
  lần chạy (T7 xanh cả hai lần), và holder live cuối đợt 128
  đã nhả sạch trước reboot.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 4 liên tiếp)

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG).

- **Trình tự thực hiện:**
  - 08:41Z: lock TRỐNG, 69 cooldown. Liệt kê ứng viên
    mtime >7 ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng). File cũ nhất
    `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
    lúc 08:41Z mới **~2,6 ngày tuổi**, còn xa ngưỡng 7 ngày.
  - 08:47Z: lock vẫn TRỐNG (0 ticket + 69 cooldown). Quét
    lại ứng viên mtime >7 ngày: **vẫn 0 file**. Tổng 69 file
    ≤ trần mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 129: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày vào khoảng **21/11 18:38Z**; T6 các
    đợt sau đếm tiếp. Đây là lần thứ 4 liên tiếp prune xóa
    0 file (đợt 126: 0; đợt 127: 0; đợt 128: 0; đợt 129: 0).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** 69 file / 966 byte lúc 08:41Z (khớp cả ba cách
  đếm độc lập: `find` 69, `ls` 69, `status` "69 cooldown";
  69 × 14 = 966 khớp) → **69 file / 966 byte lúc 08:47Z**
  (khớp ba cách đếm; 69 × 14 = 966 khớp). Khớp đúng số
  chính thức T10 đếm lúc đóng đợt 128 (69/966) — **0 file
  cooldown mới từ lúc đóng đợt 128 tới nay** (đợt 129 chưa
  dùng lock thật). Danh sách `comm` cho 0 tên mất. **T6 ghi
  số đếm chính thức 69 theo phương pháp đợt 126/128.**
  Không file nào bị xóa giữa hai lần đếm.
- Phân tầng tuổi lúc 08:41Z (ngữ nghĩa `find -mtime`,
  số ngày bị cắt phần lẻ — xem đính chính dưới): **>7 ngày
  (`-mtime +7`, tức ≥8 ngày tuổi): 0 file; ≥72h (`-mtime
  +2`): 0 file; ≥48h (`-mtime +1`): 14 file.** File cũ nhất
  62h03' tuổi lúc 08:41Z; mới nhất 06:20:06Z.
- **Đính chính nhỏ (không đổi kết quả prune):** T6-128 §7
  ghi "không file nào >48h" — theo đồng hồ tường thì file
  cũ nhất lúc đó đã ~59h tuổi; con số 0 đó thực chất là
  tầng `find -mtime +2` (≥72h), không phải >48h. Tương tự,
  `find -mtime +7` chỉ khớp file ≥192h (8 ngày), không phải
  >7 ngày đúng nghĩa — luật (a) theo chữ sẽ tới hạn sớm
  hơn phương pháp `find` tối đa 24h. T6 KHÔNG tự đổi phương
  pháp giữa chừng (theo brief); chỉ ghi nhận để parent
  quyết có chỉnh phương pháp đếm hay không. Kết quả đợt này
  không đổi theo cách đếm nào (file cũ nhất mới 62h tuổi).

## 8. Đếm mù #37 — KHÔNG ĐỔI + đuôi sau mốc cuối đợt 128

### 8.1 Mù #37: KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6): khoảng **11:39:50Z → 23:45:17Z 16/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn C). Parent đã
  **chấp nhận để mở** (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG
  thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 16/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.

### 8.2 Đuôi mù sau mốc cuối đợt 128 → boot #75 (đếm mới lượt này)

Mốc cuối đợt 128: T10 đóng 06:20:05Z (O8 WebKit xong;
event lock cuối 06:20:06Z). Đuôi từ mốc này tới btime boot
mới #75 (07:13:31Z) dài **53'26" (3.206 s)**:

| Đoạn đuôi | Khoảng | Quan sát |
|---|---|---|
| Đầu đuôi (4'25") | 06:20:05Z → 06:24:30Z | **CÓ 2 quan sát muộn** trên boot #74: `round128-t10.done` mtime 06:23:30Z; `docs/PHASE9_ROUND128_LIMITS.md` (LIMITS gộp, quyết parent §12.3) mtime 06:24:30Z. Cả hai đều là ghi file sau khi đóng, không phải đo mới. |
| Đuôi im lặng (49'01") | 06:24:30Z → 07:13:31Z | **0 quan sát**: log lock 0 event sau 06:20:06Z; `dpkg.log` 0 dòng trong cửa sổ (log hiện tại chỉ còn các dòng từ 08:35:43Z — replay #75); không file nào trong `hidden_files/` hay `docs/` có mtime trong (06:24:30Z, 07:13:31Z]. |
| **Toàn đuôi** | **06:20:05Z → 07:13:31Z** | **53'26" (3.206 s), 2 quan sát muộn + 49'01" im lặng** |

- **Boot #74 chết trong khoảng (06:24:30Z, 07:13:31Z]**
  (49'01") — quan sát cuối 06:24:30Z, btime #75 07:13:31Z.
- **Gap #74→#75 danh nghĩa 6.507 s (1h48'27") theo prereg
  T2 đợt 129: VẪN SPAN.** T6 chỉ đếm đuôi, KHÔNG tự kết
  luận đoạn A của mù #48 đóng hay mở — việc đó thuộc T2
  (probe #48 + điều tra đoạn từ #74; T2 đã chạy probe #48
  lúc 08:39:55Z, ok=2 fail=0, boot 475406f6 — khớp boot #75
  của T6). Đuôi 49'01" im lặng + 2 quan sát muộn trên là dữ
  liệu đầu vào cho T2, không phải kết luận đóng/mở.
- Lưu ý phương pháp: "quan sát" ở đây đếm theo chuẩn các
  đợt trước (event lock / heartbeat probe / file ghi có
  mtime trong cửa sổ / dòng dpkg.log). File `build-loop-log.md`
  (mtime 08:38:39Z) và `~/memory/2026-11-17.md` (08:43:23Z)
  đều nằm trên boot #75, không thuộc đuôi.

## 9. Replay apt sau boot #75: ĐÃ XONG (ghi nhận — thuộc T5)

- Replay #75 khởi động muộn **+1h22m12s** sau btime
  (configure 08:35:43Z; theo `t5-wait-replay-b75.sh`).
- **1.509 dòng dpkg.log, 08:35:43Z → 08:41:46Z, đã đóng
  băng từ 08:41:46Z** (poll 3 của watcher T5: frozen=yes,
  silent 79 s). Cùng hình dạng 1.509 dòng như replay #74
  (quyết parent §12(g) đợt 128: #72 350 dòng là ngoại lệ
  một lần).
- Watcher T5 đã ghi **FLAG 08:43:05Z** (poll 3,
  `done_pass_stable_2polls`, postboot exit=0 ở cả 3 poll) và
  kết thúc (`WATCHER_END 08:43:05Z`). Postboot check PASS:
  đủ lib/GST 269 file/apt 11 package WebKit.
- Lúc T6 mở (08:38Z) replay vẫn đang chạy (apt-get install
  gdb, pid 6251); lúc T6 đóng (08:48Z) replay đã xong +
  watcher đã kết thúc. **Lock không bị ảnh hưởng** (trống,
  0 ticket, suốt replay). T6 không kết luận gì thêm về
  replay — thuộc T5, hạ tầng/postboot.
- RAM khả dụng trong lượt: 962 MB lúc mở (T2 prereg) →
  1.343–1.561 MB lúc T5 poll → 2.291 MB lúc T6 đóng. Dù lấy
  số nào cũng **< guard birefnet 6.144 MB — birefnet KHÔNG
  thử** (u2net là fallback chính thức).

## 10. Dọn Xvfb: 0 Xvfb, 0 socket sót — chưa có gì để kiểm live về luật đứng

- **Lúc mở đợt (08:39Z), 08:42Z và lúc đóng (08:47Z):
  `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb đang chạy. Không có
  Xvfb sót nào từ đợt 128 (reboot #75 đã xóa tmpfs; T10 đợt
  128 cũng đã dọn tay 3 socket sót X193/X194/X195 lúc đóng).
- **Luật đứng "mỗi driver tự kill Xvfb của mình khi xong"
  (quyết parent đợt 127 §12.2(k)) — chưa có hành vi live để
  kiểm đợt này:** T4 đợt 129 mới ở giai đoạn gate0-wait
  (script probe `probe121t3-ghost-k7.webkit.mjs` vẫn có
  `cleanup()` SIGKILL Xvfb của mình như đợt 128 — chỉ ghi
  nhận, không can thiệp); T8/T10 chưa chạy O8 tới lúc kiểm.
  **T6 đợt 130 kiểm sau khi T4/T8/T10 chạy probe/harness**
  (đặc biệt: T4 có kill Xvfb sau probe #48 không).
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).

## 11. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#75) là số tạm theo thứ tự thời gian:**
  boot đợt 128 là #74 (T5/T6 đợt 128 ghi, parent chốt btime
  chuẩn 04:55:04Z ở §12.3(i)); journal/wtmp chỉ giữ boot
  07:13:31Z nên T6 suy ra đây là boot sau #74 (= #75) từ
  thứ tự thời gian, và T2/T5 đợt 129 cũng gọi b75/btime
  07:13:31Z. Việc chốt số hiệu/thời điểm reboot thuộc T5
  (mù #48).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ năm
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round127-t*/` (toàn đợt) +
  `round128-t*/` (toàn đợt) + `round129-t*/` tới 08:48Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). Log các luồng đợt 129 vẫn đang tăng sau thời điểm
  đếm; T6 đợt 130 đếm tiếp.
- **Prune cooldown lần 4 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 69 ≤ trần 100). File cũ nhất đủ
  7 ngày vào khoảng 21/11 18:38Z — T6 các đợt sau đếm tiếp.
  Luật đã chạy đúng trình tự (quét ứng viên 2 lần khi lock
  trống; tập ứng viên rỗng nên không thực thi xóa). Nợ nhỏ
  về ngữ nghĩa `find -mtime` (xem §7 đính chính) chờ parent
  quyết — không tự đổi phương pháp.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 08:47Z (trống, 0 ticket + 69 cooldown); đợt còn
  chạy tới ~11:00Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124/125/126/127/128 T10 đã đếm lúc đóng). T6
  không chờ tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 129 chưa kiểm:** 0 event
  tới 08:48Z. T6 đợt 130 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 129 chưa kiểm live:**
  chưa có Xvfb nào được mở tới 08:48Z; code T4 đã có
  cleanup. T6 đợt 130 kiểm sau khi T4/T8/T10 chạy probe/
  harness.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại. Đuôi sau
  mốc cuối đợt 128 đã đếm ở §8.2 (53'26", 2 quan sát muộn +
  49'01" im lặng); gap #74→#75 VẪN SPAN — đóng đoạn A mù #48
  thuộc T2.
- **Replay apt #75 đã xong + watcher T5 đã kết thúc**
  08:43:05Z (xem §9) — T6 chỉ ghi nhận, thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 12. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND129_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file), Xvfb (không có gì để kill — 0 Xvfb,
0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round129-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round129-t6/` (analyze-log.py,
analyze-log-final.txt, new-lines-since-748.txt,
cooldown-now.txt, cooldown-after-prune.txt,
prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
ps-full-2.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg.sh, repro-newmsg.log).

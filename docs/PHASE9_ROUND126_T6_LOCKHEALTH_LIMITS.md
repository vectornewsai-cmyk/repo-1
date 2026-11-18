# PHASE9 ROUND126 T6 — Sức khỏe lock v2 sau boot mới #71 + prune cooldown (lần đầu áp dụng luật đã phê duyệt) — LIMITS

- Đợt: 126, luồng T6 (sức khỏe lock v2 sau boot mới + đếm mù #37 + prune cooldown).
  Lượt cron 06:35 +07 17/11/2026. Chạy 23:40–23:47Z 16/11/2026
  (06:40–06:47 +07 17/11).
- Nhiệm vụ: kiểm chứng độc lập, ÁP DỤNG luật prune cooldown đã
  phê duyệt (quyết parent đợt 125 §12(c)), KHÔNG sửa logic lock,
  KHÔNG sửa script lock, KHÔNG đụng production. Mọi thí nghiệm
  acquire/release dùng lock dir /tmp riêng; lock thật chỉ đọc qua
  `status` (không đổi trạng thái) — ngoại trừ chính thao tác prune
  file cooldown đã phê duyệt.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`. Không mở băng v1 frozen dòng 191.
- Thư mục làm việc: `hidden_files/round126-t6/` (analyze-log.py,
  analyze-log.txt, analyze-log-final.txt, new-lines-since-577.txt,
  cooldown-now.txt, cooldown-after-prune.txt, prune-candidates.txt,
  prune-deleted.txt, ps-full-2340Z.txt, ps-full-2347Z.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log, test-v2-t6-run2.log,
  repro-newmsg.sh, repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI (số tạm #71)

- **Boot mới: boot_id `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`,
  btime 1794871541 = 23:25:41Z theo `/proc/stat`
  (23:25:52Z theo `stat /proc/1` — chênh 11 s giữa hai
  nguồn, cùng mẫu chênh như các boot trước; T6 ghi cả hai,
  không tự chọn một). `uptime -s` = 23:25:41Z,
  `who -b` = 23:25. Uptime ~15 phút lúc T6 bắt đầu
  (23:40Z).**
- Số hiệu: T6 ghi tạm **#71**. Lý do: T5 đợt 125 đã chốt boot
  #70? (btime 20:54:19Z, boot_id `310f07e4…`, T5 đợt 126
  xác nhận lại trong `round126-t5/t5-initial-state.md`:
  "boot #71 tạm", "gap danh nghĩa #70→#71 = 2h31m22s").
  Gap danh nghĩa #70?→#71 = **2h31'22"** (9.082 s).
  T6 KHÔNG tự xác minh số hiệu (thuộc T5, mù #37);
  `journalctl --list-boots` và wtmp chỉ còn giữ boot này
  (wtmp bắt đầu 23:25:52Z 16/11) — không có lịch sử boot độc
  lập trên máy này.
- md5 khớp baseline đợt 120/121/122/123/124/125: v2 `cd0c05c1`
  (script live `apps/web/scripts/vcut-vite-lock-v2.sh`), v1
  frozen `fd21193c`, suite `1c0d7eaa`. Không script nào đổi
  từ đợt 120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD tại chỗ bằng git — việc verify ref thuộc lúc push
  (parent, public API).
- Các luồng đợt 126 khác đang bắt đầu song song (lúc T6 kết
  thúc 23:47Z đã có thư mục round126-t1/t2/t3/t4/t5/t7/t8/t9;
  t3 đã có cờ `.done`).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót sau khi holder nhả, 0 cổng lắng nghe

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 23:40Z và
  23:47Z (2 snapshot `ps-full-2340Z.txt`, `ps-full-2347Z.txt`).
- Đếm trạng thái Z (cột STAT, không đếm chữ "Z" trong cmdline):
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  23:40Z và 23:47Z.
- Replay apt-get sau boot mới: **không còn chạy** —
  `pgrep -x apt-get` = 0, `pgrep -x apt` = 0,
  `pgrep -x dpkg` = 0 lúc 23:40Z và 23:47Z (thuộc T5, hạ
  tầng/postboot; T5 đợt 126 ghi replay xong 23:37:46Z —
  lock không bị ảnh hưởng, trống lúc T6 kiểm cuối).
- Ngoại lệ duy nhất trong cửa sổ làm việc: lúc 23:45:58Z,
  `status` của chính T6 in ra "vite bất kỳ đang chạy: pid
  13858 node … vite … --port 5580" — đó là **vite của
  chính holder lock lúc đó (`t1-round126`, acquire
  23:45:50Z, xem §2)**, không phải process sót. Bằng chứng:
  pid 13858 đã **không còn tồn tại** ở snapshot cuối
  23:47Z (sau khi t1-round126 RELEASED 23:46:43Z) và grep
  vite/node/webkit lúc 23:47Z = 0. Vite của holder chết
  cùng lúc nhả lock — sạch, không zombie.

## 2. Lock sau boot mới: TRỐNG, holder cuối đợt 125 đã nhả sạch trước reboot — và chu kỳ đầu tiên của đợt 126 cũng sạch

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 23:40Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 125,
  `t10-round125` RELEASED hold 100s lúc **21:48:11Z**, tức
  **1h37'30" TRƯỚC boot mới (23:25:41Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như boot #60 ở T9 đợt 120, boot #62 ở T6
  đợt 121, boot #64 ở T6 đợt 122, boot #66 ở T6 đợt 123,
  boot #68 ở T6 đợt 124, boot #69? ở T6 đợt 125).
- `status` lúc 23:40Z: `TRỐNG (không có lock)`,
  `0 ticket + 56 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — không phải bug).
- Khoảng yên: **không có event lock nào từ 21:48:11Z tới
  23:45:50Z (1h57'39")**, bao gồm ~20 phút đầu sau boot mới.
  Yên lặng này là do các luồng đợt 125 đã đóng và các luồng
  đợt 126 chưa tới lượt dùng lock — không phải do lock kẹt
  (bằng chứng: suite /tmp §6 chạy xanh trên bản script hiện
  hành; và ngay sau đó t1-round126 acquire/release bình
  thường — xem dưới).
- **Chu kỳ đầu tiên của đợt 126 — `t1-round126`: SẠCH.**
  TICKET 23:45:50Z, ACQUIRED cùng giây wait 0s (cổng 5590),
  RELEASED 23:46:43Z hold 53s. Log tăng 618 → 621 dòng
  đúng bằng 3 dòng này. Đây cũng là lần đầu tiên T6 chứng
  kiến trực tiếp một acquire thật trong lúc làm việc (các
  đợt trước chỉ đọc log sau khi xong).

## 3. Lock dùng sau snapshot T6 đợt 125: 12 chu kỳ mới, tất cả nhả sạch, 0 kẹt, 0 quá hạn — ĐÓNG NỢ T6-125

Từ sau snapshot T6 đợt 125 (577 dòng lúc ~20:46Z) tới nay
(621 dòng lúc 23:47Z): **+44 dòng = TICKET +13 / ACQUIRED
+13 / RELEASED +13 / COOLDOWN +5 / TIMEOUT +0 /
STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng con số, không
có event nào mất dấu hay thêm lạ. (13 chu kỳ = 12 chu kỳ
đợt 125 sau 20:46Z + 1 chu kỳ đợt 126 của t1.)

- **Tuân thủ lock của các luồng đo đợt 125: KIỂM ĐƯỢC —
  SẠCH.** Đóng nợ mở đợt 125 (§8: "chưa kiểm được — chưa
  có ai dùng lock thật"). 35 dòng mang tên `round125` =
  TICKET 10 / ACQUIRED 10 / RELEASED 10 / COOLDOWN 5,
  4 luồng, 10 chu kỳ, tất cả nhả sạch:
  - **`t1-round125`: 1 chu kỳ sạch trên cổng 5590**,
    20:59:50–21:00:51Z, hold 61s, wait 0s.
  - **`t2-round125`: 1 chu kỳ sạch trên cổng 5590**,
    TICKET 21:11:02Z, ACQUIRED 21:11:53Z **wait 51s —
    xếp hàng sau `t3` (tên trần) đang giữ tới 21:11:52Z**
    (FIFO đúng thiết kế, không TIMEOUT; timeout prio
    normal là 900s), RELEASED 21:12:27Z hold 34s.
  - **`t4-round125`: 6 chu kỳ sạch trên cổng 8975**,
    21:19:02–21:24:29Z. Chu kỳ đầu hold 43s, wait 0s;
    5 chu kỳ sau đều chờ cooldown ~9,1–9,3s
    (COOLDOWN 9085–9296ms), hold 41–42s.
  - **`t10-round125`: 2 chu kỳ sạch**,
    21:42:05–21:45:54Z (hold 229s, cổng 5555, wait 0s) và
    21:46:31–21:48:11Z (hold 100s, cổng 5554, wait 0s).
  - Hold dài nhất đợt 125 (sau 20:46Z): **t10 229s**; wait
    dài nhất: **t2 51s** (hàng đợi, không phải kẹt). Cả hai
    đều nhả sạch.
- **2 chu kỳ tên trần (không hậu tố round) trong cùng
  khoảng** — cùng mẫu như `t3` đợt 124:
  - **`t3`: 1 chu kỳ sạch trên cổng 5187**,
    21:08:29–21:11:52Z, hold 203s, wait 0s.
  - **`t9`: 1 chu kỳ sạch trên cổng 5187**,
    21:14:16–21:15:30Z, hold 74s, wait 0s.
  - 35 dòng `round125` + 6 dòng tên trần = 41 dòng delta
    sau snapshot T6 đợt 125 (577 → 618) — khớp.
- Các luồng đợt 125 còn lại (t5/t6/t7/t8/t9) không có event
  lock thật nào sau 20:46Z — tức không dùng lock thật trong
  phần còn lại của đợt 125 (không phải vi phạm, chỉ là
  không dùng).
- **Round 125 khép lại sạch trên lock: 10 TICKET = 10
  ACQUIRED = 10 RELEASED (mang tên round125), 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 21:48:11Z.**
- **Tuân thủ lock đợt 126 tới 23:47Z:** mới chỉ có t1
  (1 chu kỳ sạch, §2). Các luồng đợt 126 còn lại chưa dùng
  lock thật tới thời điểm này (`grep -c round126` trên log
  = 1 chu kỳ duy nhất của t1) — T6 đợt 127 kiểm tiếp.

## 4. Nhất quán log lock: 621 dòng, 178/178 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~23:47Z
(14/11 18:01:32Z → 16/11 23:46:43Z; script ghép cặp
`round126-t6/analyze-log.py` — tái dùng từ round125, output
`analyze-log.txt` lúc 618 dòng và `analyze-log-final.txt`
lúc 621 dòng):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 191 | 100 | 94 |
| ACQUIRED | 182 | 100 | 94 |
| RELEASED | 178 | 100 | 94 |
| COOLDOWN | 56 | 48 | 43 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 5 | **0** | 0 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **621** | **348** | **325** |

- So với snapshot T6 đợt 125 (577 dòng lúc ~20:46Z): +44
  dòng, đúng bằng TICKET +13 / ACQUIRED +13 / RELEASED +13
  / COOLDOWN +5 / TIMEOUT +0 / STALE-LOCK +0 — khớp từng
  con số, không có event nào mất dấu hay thêm lạ.
- Ghép cặp theo thread: **178 cặp ACQUIRED→RELEASED, 0 lock
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
- Round 120/121/122/123/124 khép lại sạch trên lock (đã ghi
  các đợt trước); **round 125 cũng khép lại sạch trên lock:
  10 TICKET = 10 ACQUIRED = 10 RELEASED (mang tên round125),
  0 TIMEOUT, 0 STALE-LOCK, 0 lock nào còn giữ sau 21:48:11Z.**
  Cửa sổ R120: 100 = 100 = 100, 0 TIMEOUT, 0 STALE-LOCK.
- Đếm loại event trên toàn log: 191+182+178+56+8+5+1 = 621 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log. **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 125 (sau 20:46Z) và đợt 126 (tới 23:47Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round125-t*/` + `round126-t*/` (grep ~1 s).
Tổng 27 dòng khớp, phân loại đủ 27/27:

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 24 | 8 file `vcut-vite-lock-v2-*.sh` × 3 dòng code `echo` (round125-t1/t2/t4/t9/t10 + round126-t1/t2/t9) |
| Tái hiện có kiểm soát trên /tmp (đợt 125) | 3 | `round125-t6/repro-newmsg.log` ×3 (A/B/C của T6 đợt 125) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 125 (sau 20:46Z) / 126 nào |

- Kiểm sạch độc lập (loại hết script copy, repro và comment):
  `khong-nha-grep.txt` sau khi loại = **0 dòng sự kiện
  thật**.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 tới 23:47Z = 0.** Khớp với log pairing
  sạch ở §4 (178/178 cặp, 0 TIMEOUT, 0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 126 vẫn đang chạy, log của
  chúng có thể tăng sau 23:47Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 126, T6 đợt 127 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Bẫy đếm gặp lần này: file grep-output của chính T6
  (`khong-nha-grep*.txt`) sẽ bị grep đợt sau khớp lại — phải
  loại `khong-nha-grep` khỏi grep mới đếm đúng (T6 đợt
  123/124/125/126 đã loại; ghi lại để T6 đợt sau không đếm
  trùng). Bẫy mới đợt này: có 8 bản sao script (5 của đợt
  125 + 3 của đợt 126) thay vì 7 như đợt 125 — đếm theo file,
  không đếm theo đợt, để không sót.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
(`ff7afbbb…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round126-t6/test-v2-t6-run1.log` 23:45:08Z,
  `test-v2-t6-run2.log` 23:45:30Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ hai liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125 cũng vậy). Tính flaky của
    T7 (T9 đợt 119 §1.2) vẫn được ghi nhận là bản chất —
    hai lần xanh kép không xóa nó; quyết tách T7 khỏi gate
    9/9 khi đợt đông vẫn thuộc về parent; T6 không tự đổi
    test.
  - Kết luận suite: xanh lần thứ tám liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126).
- **Tái hiện message mới (`round126-t6/repro-newmsg.log`,
  23:45:56–23:45:59Z)** — cùng 3 thí nghiệm A/B/C như T9
  đợt 120 và T6 đợt 121/122/123/124/125, kết quả giống hệt:
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
  **12 chu kỳ acquire/release thật đợt 125 sau snapshot T6
  đợt 125 + 1 chu kỳ đợt 126 của t1 đều sạch (§2–§3)** —
  đây là bằng chứng live (không phải chỉ suite /tmp) rằng
  lock v2 hoạt động đúng qua boot #70? và trống sạch sang
  boot mới #71.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #71,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (178/178
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/
  122/123/124/125 (toàn đợt) và đợt 126 (tới 23:47Z), suite
  9/9 độc lập ×2 lần chạy (T7 xanh cả hai lần), và holder
  live cuối đợt 125 đã nhả sạch trước reboot (hold dài nhất
  229s vẫn nhả đúng).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG).

- **Trình tự thực hiện (tuân thủ (e) nghiêm ngặt):**
  - 23:40Z: lock TRỐNG, 56 cooldown. Liệt kê ứng viên
    mtime >7 ngày: **0 file** (`prune-candidates.txt`
    rỗng). File cũ nhất `cooldown-r4-round115`, mtime
    2026-11-14T18:38:25Z — lúc 23:45:59Z mới **2 ngày
    5 giờ tuổi**, còn xa ngưỡng 7 ngày.
  - 23:45:50Z: **lock bị giữ giữa chừng** — `t1-round126`
    acquire (cổng 5590, pid 7767) đúng lúc T6 chuẩn bị
    chạy prune. T6 **DỪNG LẠI, không prune khi lock đang
    giữ** (đúng luật (e)), chờ holder nhả.
  - 23:46:43Z: t1-round126 RELEASED hold 53s. 23:46:51Z:
    `status` TRỐNG trở lại (0 ticket + 57 cooldown — tăng
    1 do file `cooldown-t1-round126` mới).
  - 23:47Z: chạy prune khi lock TRỐNG: `find … -mtime +7
    -print -delete` → **xóa 0 file** (`prune-deleted.txt`
    rỗng). Đếm lại sau prune: **57 file / 798 byte**
    (57 × 14 = 798 khớp). Lock vẫn TRỐNG sau prune.
- **Kết quả prune đợt 126: 0 file đã xóa — không có file
  nào đủ điều kiện.** Danh sách file đã xóa: (không có).
  Lý do: file cũ nhất mới ~2,2 ngày tuổi (ngưỡng 7 ngày
  chưa tới với bất kỳ file nào); tổng 57 file ≤ trần mềm
  100 nên điều (b) cũng không kích hoạt. Đây là kết quả
  đúng của luật — luật đã chạy, không phải luật chưa chạy.
  File cooldown cũ nhất sẽ đủ 7 ngày vào khoảng 21/11;
  T6 các đợt sau đếm tiếp.
- **Đối chiếu số lượng:** khung nhiệm vụ ghi lúc mở đợt
  "queue 60 file cooldown (đếm thô)". Đếm chính xác của T6
  lúc 23:40Z: **56 file** — khớp cả ba cách đếm độc lập
  (`find` 56, `ls` 56 dòng, `status` "56 cooldown") và
  khớp chuỗi 52 (đợt 125) + 4 file mới đợt 125
  (`cooldown-t1/t2/t4/t10-round125`). **Chênh 4 file so
  với con số thô 60 trong khung — T6 không giải thích
  được chênh này** (không có thao tác xóa nào chạy trước
  23:40Z; file cooldown chỉ bị ghi đè cùng tên, không bị
  xóa); ghi nhận trung thực để parent đối chiếu. Số sau
  prune: 57 (56 + `cooldown-t1-round126`).
- Phân tầng tuổi lúc 23:47Z: **>7 ngày: 0 file; 48h–7 ngày:
  0 file; 24–48h: 0 file** — toàn bộ 57 file nằm trong khoảng
  **0–2,2 ngày tuổi** (cũ nhất 14/11 18:38Z, mới nhất 16/11
  23:46:43Z), không file nào >48h. (So với đợt 125: 52 file / 728 byte,
  cũ nhất 14/11 18:38Z — cùng file cũ nhất, +5 net: 4 file
  round125 + 1 file round126.)

## 8. Đếm mù #37 — gap #70?→#71 SPAN, mù #37 VẪN MỞ (như parent đã chấp nhận)

- **Gap mới: #70? → #71 = 2h31'22" danh nghĩa**
  (20:54:19Z → 23:25:41Z). T5 đợt 126 xác nhận boot #70?
  chết trong khung (21:48Z, 23:25:41Z] và ghi số tạm #71
  chờ T6 đếm lại — T6 đếm như sau.
- **Quan sát cuối cùng trên boot #70?:**
  `round125-t10.done` mtime **21:55:51Z** (T10 đóng đợt 125).
  Đuôi mù: **(21:55:51Z, 23:25:41Z] = 1h29'50"** không có
  quan sát nào trên VM: 0 file /tmp có mtime trong cửa sổ,
  0 file mới trong hidden_files ngoài các thư mục round126
  (14 file trong cửa sổ đều là file đóng đợt 125 của T10,
  mtime ≤21:55:51Z); journal/wtmp chỉ giữ boot #71.
- **Không có bằng chứng boot trung gian** trong đuôi mù —
  nhưng cũng **không có nguồn nào trên VM loại trừ được**
  boot trung gian (cùng giới hạn như mọi lần đếm mù #37
  trước). Gap #70?→#71 do đó **VẪN SPAN, không chứng nhận
  được**; mù #37 **VẪN MỞ**, đúng trạng thái parent đã chấp
  nhận ở đợt 119 §12(7). T6 không tự đổi CERT/FULL (thuộc
  T7; giữ nguyên số T7 đợt 125: CERT n=38, FULL n=53 — T6
  chỉ ghi lại, không xác minh lại).
- Gap #69?→#70? = 19'08" danh nghĩa (20:35:11Z →
  20:54:19Z); T5 đợt 125 đã ghi nhận dấu nhảy clock tại
  #70 (btime 20:54:19Z sớm hơn lần quan sát cuối trên #69?
  20:54:39Z) — thuộc T5, T6 chỉ ghi lại, không kết luận
  thêm.

## 9. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#71) là số tạm, chưa xác minh độc
  lập:** boot đợt 125 là #70? (T5 ghi tạm); journal/wtmp
  chỉ giữ boot 23:25:41Z nên T6 suy ra đây là boot sau #70?
  (= #71) từ thứ tự thời gian. Việc chốt số hiệu/thời điểm
  reboot thuộc T5 (mù #37 — parent đã chấp nhận ĐỂ MỞ).
  Gap #70?→#71 VẪN SPAN (đuôi mù 1h29'50" không quan sát).
- **Chênh 4 file cooldown so với con số thô 60 trong khung
  nhiệm vụ** (đếm chính xác 56 lúc 23:40Z, khớp 3 cách đếm
  + chuỗi +4 từ đợt 125) — chưa giải thích được, ghi nhận
  để parent đối chiếu.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ hai
  liên tiếp không xóa tính flaky. Quyết tách T7 khỏi gate
  9/9 khi đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** —
  `vite-lock: KHÔNG NHẢ — owner hiện tại là '...', không
  phải '...'` (đã kiểm lại dòng 191 trong đợt này). T6 đợt
  120 đã ghi nợ; đang đóng băng, cần parent quyết "mở băng"
  nếu muốn đồng bộ message. Chỉ ghi nhận, không tự mở băng.
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round125-t*/` (sau 20:46Z)
  + `round126-t*/` tới 23:47Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 126 vẫn đang tăng sau thời điểm đếm; T6 đợt 127 đếm
  tiếp.
- **Prune cooldown lần đầu áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 57 ≤ trần 100). File cũ nhất đủ
  7 ngày vào khoảng 21/11 — T6 các đợt sau đếm tiếp. Luật
  đã chạy đúng trình tự (dừng khi lock bị giữ, chạy lại khi
  lock trống).
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 23:47Z (trống, 0 ticket + 57 cooldown); đợt còn
  chạy tới ~02:00Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124/125 T10 đã đếm lúc đóng). T6 không chờ tới
  lúc đóng.
- **Tuân thủ lock của luồng đo đợt 126 chưa kiểm hết:**
  mới chỉ có t1 (1 chu kỳ sạch, §2); các luồng còn lại chưa
  dùng lock thật tới 23:47Z. T6 đợt 127 kiểm tiếp.
- **Replay apt-get sau boot mới đã kết thúc** (pgrep -x = 0
  lúc 23:40Z/23:47Z; T5 ghi replay xong 23:37:46Z): T6 không
  kết luận nó kết thúc ra sao — thuộc T5, hạ tầng/postboot;
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
| `docs/PHASE9_ROUND126_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file).
Stage: `repo-1-push/paths-loop/phase9-round126-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round126-t6/` (analyze-log.py,
analyze-log.txt, analyze-log-final.txt, new-lines-since-577.txt,
cooldown-now.txt, cooldown-after-prune.txt, prune-candidates.txt,
prune-deleted.txt, ps-full-2340Z.txt, ps-full-2347Z.txt,
khong-nha-grep.txt, test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg.sh, repro-newmsg.log).

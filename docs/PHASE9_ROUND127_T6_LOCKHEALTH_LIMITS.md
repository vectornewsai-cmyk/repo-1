# PHASE9 ROUND127 T6 — Sức khỏe lock v2 sau boot mới #72 + prune cooldown (lần 2 áp dụng luật đã phê duyệt) — LIMITS

- Đợt: 127, luồng T6 (sức khỏe lock v2 sau boot mới + đếm mù #37 + prune cooldown).
  Lượt cron 09:35 +07 17/11/2026. Chạy 02:40–02:47Z 17/11/2026
  (09:40–09:47 +07 17/11).
- Nhiệm vụ: kiểm chứng độc lập, ÁP DỤNG luật prune cooldown đã
  phê duyệt (quyết parent đợt 125 §12(c)), KHÔNG sửa logic lock,
  KHÔNG sửa script lock, KHÔNG đụng production. Mọi thí nghiệm
  acquire/release dùng lock dir /tmp riêng; lock thật chỉ đọc qua
  `status` (không đổi trạng thái) — ngoại trừ chính thao tác prune
  file cooldown đã phê duyệt.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`. Không mở băng v1 frozen dòng 191.
- Thư mục làm việc: `hidden_files/round127-t6/` (analyze-log.py,
  analyze-log.txt, analyze-log-final.txt, new-lines-since-621.txt,
  new-lines-since-670.txt, cooldown-now.txt,
  cooldown-after-prune.txt, prune-candidates.txt,
  prune-deleted.txt, ps-full-1.txt, ps-full-2.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log, test-v2-t6-run2.log,
  repro-newmsg.sh, repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI (số tạm #72, T5-127 gọi b72)

- **Boot mới: boot_id `81464315-ba1a-460d-b370-92a1673accc1`,
  btime 1794881417 = 02:10:17Z theo `/proc/stat`
  (02:10:28Z theo `stat /proc/1` — chênh 11 s giữa hai
  nguồn, cùng mẫu chênh như các boot trước; T6 ghi cả hai,
  không tự chọn một). `uptime -s` = 02:10:17Z,
  `who -b` = 02:10. Uptime ~30 phút lúc T6 bắt đầu
  (02:40Z).**
- Số hiệu: T6 ghi tạm **#72**. T5 đợt 127 đã độc lập ghi
  cùng boot_id và btime trong `round127-t5/t5-initial-state.md`
  (`boot_id=81464315…`, `btime=2026-11-17 02:10:17 (UTC)`)
  và đặt tên file `t5-postboot-b72-*` — hai luồng khớp nhau
  về boot mới, nhưng số hiệu vẫn là tạm cho tới khi T5 chốt
  (thuộc T5, mù #37).
  Gap danh nghĩa #71→#72 = **2h44'36"** (9.876 s).
  `journalctl --list-boots` và wtmp chỉ còn giữ boot này
  (wtmp bắt đầu 02:10:28Z 17/11) — không có lịch sử boot độc
  lập trên máy này.
- md5 khớp baseline đợt 120/121/122/123/124/125/126: v2
  `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD tại chỗ bằng git — việc verify ref thuộc lúc push
  (parent, public API).
- Các luồng đợt 127 khác đang bắt đầu song song (lúc T6 kết
  thúc 02:47Z đã có thư mục round127-t1..t9; t2 đã có cờ
  `.done` lúc 02:43Z).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót sau khi holder nhả, 0 cổng lắng nghe

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:41Z và
  02:47Z (2 snapshot `ps-full-1.txt`, `ps-full-2.txt`).
- Đếm trạng thái Z (cột STAT, không đếm chữ "Z" trong cmdline):
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  02:41Z và 02:47Z.
- Trừ nhiễu: mỗi snapshot có 1–2 dòng khớp `vite|node|webkit`
  trong cmdline — đều là **shell bash của chính T6 hoặc của
  luồng khác đang chạy lệnh chẩn đoán chứa chữ webkit trong
  câu lệnh** (vd pid 3949: `ldd …/MiniBrowser …`, công việc
  của T9), không phải tiến trình vite/node/webkit thật.
  Kiểm theo cột comm (`node`/`vite`/`webkit`): **0 tiến
  trình thật** ở cả 2 snapshot.
- Replay apt-get sau boot mới: **ĐANG CHẠY, chưa xong** —
  thuộc T5 (hạ tầng/postboot), T6 chỉ ghi nhận, không kết
  luận. Chi tiết: payload replay của nền tảng bắt đầu
  02:35:38Z (tức **~25 phút SAU boot**, muộn hơn mẫu boot
  #71 — T5 đợt 126 ghi replay xong 12 phút sau boot);
  `apt-get update` pid 842 chạy 02:35:39Z tới khoảng
  02:46Z, rồi chuyển sang pha install (pid 10523,
  `install … libdw1t64` từ cache, vẫn chạy lúc 02:47Z).
  T5-127 đang chờ replay (`t5-wait-replay-b72.log`).
  **Lock không bị ảnh hưởng: trống trong suốt thời gian
  replay chạy.**

## 2. Lock sau boot mới: TRỐNG, holder cuối đợt 126 đã nhả sạch trước reboot — và chu kỳ đầu tiên của đợt 127 cũng sạch

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 02:40Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 126,
  `t10-round126` RELEASED hold 106s lúc **00:37:34Z**, tức
  **1h32'43" TRƯỚC boot mới (02:10:17Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như boot #60 ở T9 đợt 120, boot #62 ở T6
  đợt 121, boot #64 ở T6 đợt 122, boot #66 ở T6 đợt 123,
  boot #68 ở T6 đợt 124, boot #69? ở T6 đợt 125, boot #71
  ở T6 đợt 126).
- `status` lúc 02:41Z: `TRỐNG (không có lock)`,
  `0 ticket + 62 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — không phải bug).
- Khoảng yên: **không có event lock nào từ 00:37:34Z tới
  02:42:03Z (2h04'29")**, bao gồm ~32 phút đầu sau boot mới.
  Yên lặng này là do các luồng đợt 126 đã đóng và các luồng
  đợt 127 chưa tới lượt dùng lock — không phải do lock kẹt
  (bằng chứng: suite /tmp §6 chạy xanh trên bản script hiện
  hành; và ngay sau đó t8-round127 acquire/release bình
  thường — xem dưới).
- **Chu kỳ đầu tiên của đợt 127 — `t8-round127`: SẠCH
  (3 chu kỳ probe, xem §3).** Chu kỳ đầu: TICKET 02:42:03Z,
  ACQUIRED cùng giây wait 0s (cổng 5390), RELEASED
  02:42:05Z hold 2s. Log tăng 670 → 681 dòng đúng bằng
  11 dòng của t8 (3 chu kỳ + 2 COOLDOWN).

## 3. Lock dùng sau snapshot T6 đợt 126: 17 chu kỳ mới, tất cả nhả sạch, 0 kẹt, 0 quá hạn — ĐÓNG NỢ T6-126 + mở đầu đợt 127

Từ sau snapshot T6 đợt 126 (621 dòng lúc ~23:47Z 16/11) tới
nay (681 dòng lúc 02:47Z 17/11): **+60 dòng = TICKET +17 /
ACQUIRED +17 / RELEASED +17 / COOLDOWN +9 / TIMEOUT +0 /
STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng con số, không
có event nào mất dấu hay thêm lạ. (17 chu kỳ = 14 chu kỳ
sau 23:47Z — 13 mang tên round126 + 1 tên trần `t3` — cộng
3 chu kỳ đợt 127 của t8.)

- **Tuân thủ lock của các luồng đo đợt 126: KIỂM ĐƯỢC —
  SẠCH.** Đóng nợ mở đợt 126 (§9: "chưa kiểm hết — mới chỉ
  có t1"). 49 dòng mang tên `round126` = TICKET 14 /
  ACQUIRED 14 / RELEASED 14 / COOLDOWN 7, 6 luồng, 14 chu
  kỳ, tất cả nhả sạch:
  - **`t8-round126`: 3 chu kỳ sạch trên cổng 5390/5490**,
    23:48:03–23:56:20Z, hold 76/140/250s, wait 0/15/15s
    (15s = chờ cooldown, đúng thiết kế).
  - **`t2-round126`: 1 chu kỳ sạch trên cổng 5590**,
    00:01:06–00:01:40Z, hold 34s, wait 0s.
  - **`t4-round126-warm`: 1 chu kỳ sạch trên cổng 8985**,
    00:11:14–00:11:58Z, hold 44s, wait 1s.
  - **`t4-round126`: 6 chu kỳ sạch trên cổng 8985**,
    00:13:28–00:18:44Z. Chu kỳ đầu hold 40s, wait 0s;
    5 chu kỳ sau đều chờ cooldown ~9,1–9,4s
    (COOLDOWN 9079–9386ms), hold 39–42s.
  - **`t10-round126`: 2 chu kỳ sạch**,
    00:31:11–00:35:03Z (hold 232s, cổng 5555, wait 0s) và
    00:35:48–00:37:34Z (hold 106s, cổng 5554, wait 0s).
  - Hold dài nhất đợt 126 (sau 23:47Z): **t8 250s**; wait
    dài nhất: **t8 15s** (cooldown, không phải kẹt). Cả hai
    đều nhả sạch.
- **1 chu kỳ tên trần (không hậu tố round) trong cùng
  khoảng** — cùng mẫu như `t3` đợt 124/125:
  - **`t3`: 1 chu kỳ sạch trên cổng 5187**,
    00:02:14–00:05:37Z, hold 202s, wait 1s.
  - Đối chiếu đếm: file `new-lines-since-621.txt` 49 dòng =
    TICKET 14 / ACQUIRED 14 / RELEASED 14 / COOLDOWN 7,
    trong đó 3 dòng là của `t3` trần, 46 dòng còn lại mang
    tên round126; cộng 3 dòng t1-round126 đã có trong
    snapshot 621 = 49 dòng round126 tổng cộng — khớp với
    `grep -c round126` = 49 trên toàn log.
- Các luồng đợt 126 còn lại (t5/t6/t7/t9) không có event
  lock thật nào sau 23:47Z — tức không dùng lock thật trong
  phần còn lại của đợt 126 (không phải vi phạm, chỉ là
  không dùng).
- **Round 126 khép lại sạch trên lock: 14 TICKET = 14
  ACQUIRED = 14 RELEASED (mang tên round126), 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 00:37:34Z.**
- **Tuân thủ lock đợt 127 tới 02:47Z:** mới chỉ có t8
  (3 chu kỳ sạch, dưới đây). Các luồng đợt 127 còn lại
  chưa dùng lock thật tới thời điểm này (`grep -c round127`
  trên log = 11 dòng duy nhất của t8) — T6 đợt 128 kiểm
  tiếp.
  - **`t8-round127`: 3 chu kỳ sạch trên cổng 5390/5490**,
    02:42:03–02:42:38Z, hold 2/2/1s, wait 0/15/15s
    (15s = chờ cooldown). Hold ngắn 1–2s: dạng probe
    kiểm tra lock (cùng mẫu cổng 5390/5490 và cooldown
    ~15s như t8 đợt 126), không phải chạy vite dài —
    vẫn là chu kỳ acquire/release đầy đủ, nhả sạch.

## 4. Nhất quán log lock: 681 dòng, 195/195 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~02:47Z
(14/11 18:01:32Z → 17/11 02:42:38Z; script ghép cặp
`round127-t6/analyze-log.py` — tái dùng từ round126, output
`analyze-log-final.txt` lúc 681 dòng):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 208 | 117 | 111 |
| ACQUIRED | 199 | 117 | 111 |
| RELEASED | 195 | 117 | 111 |
| COOLDOWN | 65 | 57 | 52 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 5 | **0** | 0 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **681** | **408** | **385** |

- So với snapshot T6 đợt 126 (621 dòng lúc ~23:47Z 16/11):
  +60 dòng, đúng bằng TICKET +17 / ACQUIRED +17 /
  RELEASED +17 / COOLDOWN +9 / TIMEOUT +0 / STALE-LOCK +0
  — khớp từng con số, không có event nào mất dấu hay thêm
  lạ.
- Ghép cặp theo thread: **195 cặp ACQUIRED→RELEASED, 0 lock
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
- Round 120/121/122/123/124/125 khép lại sạch trên lock (đã
  ghi các đợt trước); **round 126 cũng khép lại sạch trên
  lock: 14 TICKET = 14 ACQUIRED = 14 RELEASED (mang tên
  round126), 0 TIMEOUT, 0 STALE-LOCK, 0 lock nào còn giữ
  sau 00:37:34Z.** Cửa sổ R120: 117 = 117 = 117,
  0 TIMEOUT, 0 STALE-LOCK.
- Đếm loại event trên toàn log: 208+199+195+65+8+5+1 = 681 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log. **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 126 (sau 23:47Z) và đợt 127 (tới 02:47Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round126-t*/` + `round127-t*/` (grep ~9 s vì cây
đã lớn). Tổng 46 dòng khớp, phân loại đủ 46/46:

| Loại | Số dòng | Chi tiết |
|---|---|---|
| File grep-output của chính T6 (bẫy đếm) | 29 | `round126-t6/khong-nha-grep.txt` ×19 + `round127-t6/khong-nha-grep.txt` ×10 (file của T6 đợt này, sẽ bị grep đợt sau khớp lại — phải loại `khong-nha-grep` khỏi grep, như T6 đợt 123/124/125/126 đã loại) |
| Tái hiện có kiểm soát trên /tmp (đợt 126) | 3 | `round126-t6/repro-newmsg.log` ×3 (A/B/C của T6 đợt 126) |
| Bản sao script (không phải sự kiện) | 14 | 7 file `vcut-vite-lock-v2-*.sh` / `.frozen.sh` / `.t10.sh` × 2 dòng code `echo` (round126-t1/t2/t4/t9/t10 + round127-t3/t9) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 126 (sau 23:47Z) / 127 nào |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 tới 02:47Z
  = 0.** Khớp với log pairing sạch ở §4 (195/195 cặp,
  0 TIMEOUT, 0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 127 vẫn đang chạy, log của
  chúng có thể tăng sau 02:47Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 127, T6 đợt 128 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Bẫy đếm gặp lần này: file grep-output của T6 đợt 126
  (`round126-t6/khong-nha-grep.txt`, 19 dòng) đã bị grep
  đợt này khớp lại đúng như cảnh báo đợt 126 §5 — đã loại
  khỏi đếm. File `khong-nha-grep.txt` của T6 đợt này
  (10 dòng, toàn bản sao script) cũng sẽ bị grep đợt sau
  khớp lại; T6 đợt 128 tiếp tục loại `khong-nha-grep`.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
(`81464315…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round127-t6/test-v2-t6-run1.log` 02:45:56Z,
  `test-v2-t6-run2.log` 02:46:23Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ ba liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126 cũng vậy). Tính flaky
    của T7 (T9 đợt 119 §1.2) vẫn được ghi nhận là bản chất —
    ba lần xanh kép không xóa nó; quyết tách T7 khỏi gate
    9/9 khi đợt đông vẫn thuộc về parent; T6 không tự đổi
    test.
  - Kết luận suite: xanh lần thứ chín liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127).
- **Tái hiện message mới (`round127-t6/repro-newmsg.log`,
  02:46:44–02:46:45Z)** — cùng 3 thí nghiệm A/B/C như T9
  đợt 120 và T6 đợt 121/122/123/124/125/126, kết quả giống
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
  **14 chu kỳ acquire/release thật đợt 126 sau snapshot T6
  đợt 126 + 3 chu kỳ đợt 127 của t8 đều sạch (§2–§3)** —
  đây là bằng chứng live (không phải chỉ suite /tmp) rằng
  lock v2 hoạt động đúng qua boot #71 và trống sạch sang
  boot mới #72.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #72,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (195/195
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/
  122/123/124/125/126 (toàn đợt) và đợt 127 (tới 02:47Z),
  suite 9/9 độc lập ×2 lần chạy (T7 xanh cả hai lần), và
  holder live cuối đợt 126 đã nhả sạch trước reboot (hold dài
  nhất 250s vẫn nhả đúng).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG).

- **Trình tự thực hiện:**
  - 02:41Z: lock TRỐNG, 62 cooldown. Liệt kê ứng viên
    mtime >7 ngày: **0 file** (`prune-candidates.txt`
    rỗng). File cũ nhất `cooldown-r4-round115`, mtime
    2026-11-14T18:38:25Z — lúc 02:47Z mới **~2 ngày
    8 giờ tuổi**, còn xa ngưỡng 7 ngày.
  - 02:47Z: lock vẫn TRỐNG (0 ticket + 63 cooldown — tăng
    1 do file `cooldown-t8-round127` mới từ chu kỳ probe
    của t8). Quét lại ứng viên mtime >7 ngày: **vẫn 0
    file**. Tổng 63 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 127: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` rỗng. Vì tập ứng viên rỗng nên
    không thực thi thao tác xóa nào (không có gì để xóa).
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày vào khoảng 21/11; T6 các đợt sau đếm tiếp.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126):** 62 file / 868 byte lúc 02:41Z (khớp cả ba cách
  đếm độc lập: `find` 62, `ls` 62, `status` "62 cooldown";
  62 × 14 = 868 khớp) → **63 file / 882 byte lúc 02:47Z**
  (khớp ba cách đếm; 63 × 14 = 882 khớp). Chuỗi: 57 (đợt
  126 sau prune) + 5 tên mới từ các lượt nhả muộn đợt 126
  (`cooldown-t2/t4/t4-warm/t8/t10-round126`) + 1 tên mới
  đợt 127 (`cooldown-t8-round127`) = 63. Không file nào
  bị xóa giữa hai lần đếm (danh sách `comm` cho 0 file
  mất, 5+1 tên mới đúng như log). **T6 ghi số đếm chính
  thức 63 theo phương pháp đợt 126; không điều tra lại
  chênh 60 vs 56 của đợt 126 (quyết parent §12(f) đợt
  126: chấp nhận là số đếm thô sai).**
- Phân tầng tuổi lúc 02:47Z: **>7 ngày: 0 file; 48h–7 ngày:
  0 file; 24–48h: 0 file** — toàn bộ 63 file nằm trong khoảng
  **0–2,4 ngày tuổi** (cũ nhất 14/11 18:38Z, mới nhất
  17/11 02:42:38Z), không file nào >48h. (So với đợt 126:
  57 file / 798 byte, cũ nhất 14/11 18:38Z — cùng file cũ
  nhất, +6 net.)

## 8. Đếm mù #37 — gap #71→#72 SPAN, mù #37 VẪN MỞ (như parent đã chấp nhận)

- **Gap mới: #71 → #72 = 2h44'36" danh nghĩa**
  (23:25:41Z → 02:10:17Z; 9.876 s). T5 đợt 127 xác nhận
  boot #72 (boot_id `81464315…`, btime 02:10:17Z) và ghi
  số tạm b72 chờ T6 đếm lại — T6 đếm như sau.
- **Quan sát cuối cùng trên boot #71:**
  `round126-t10/t10-phase1-summary.md` mtime
  **00:45:06.977Z** (T10 đóng đợt 126; cờ
  `round126-t10.done` mtime 00:44:50.182Z).
  Đuôi mù: **(00:45:06.977Z, 02:10:17Z] = 1h25'10"**
  (5.110 s) không có quan sát nào trên VM: 0 file /tmp có
  mtime trong cửa sổ, 0 file mới trong hidden_files ngoài
  3 mục ≤00:45:06Z (t10.done, thư mục round126-t10,
  t10-phase1-summary.md); journal/wtmp chỉ giữ boot #72.
  /tmp sau reboot không còn file thường nào mang mtime
  trước boot (tmpfs trống sau reboot) nên không cho quan
  sát nào trong đuôi mù.
- **Không có bằng chứng boot trung gian** trong đuôi mù —
  nhưng cũng **không có nguồn nào trên VM loại trừ được**
  boot trung gian (cùng giới hạn như mọi lần đếm mù #37
  trước). Gap #71→#72 do đó **VẪN SPAN, không chứng nhận
  được**; mù #37 **VẪN MỞ**, đúng trạng thái parent đã chấp
  nhận ở đợt 119 §12(7). T6 không tự đổi CERT/FULL (thuộc
  T7; giữ nguyên số T9 đợt 126: CERT n=39, FULL n=54 — T6
  chỉ ghi lại, không xác minh lại).
- Gap #70?→#71 = 2h31'22" danh nghĩa (20:54:19Z →
  23:25:41Z); T5 đợt 125 đã ghi nhận dấu nhảy clock tại
  #70 — thuộc T5, T6 chỉ ghi lại, không kết luận thêm.
- Yên lặng lock trước boot: sự kiện lock cuối trên boot #71
  là 00:37:34Z (t10-round126 RELEASED), tức lock đã yên
  1h32'43" trước khi boot #72 xảy ra; khoảng yên lock kéo
  dài tới 02:42:03Z (tổng 2h04'29").

## 9. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#72) là số tạm, chưa xác minh độc
  lập:** boot đợt 126 là #71 (T5 ghi tạm, T6 đợt 126 ghi
  tạm); journal/wtmp chỉ giữ boot 02:10:17Z nên T6 suy ra
  đây là boot sau #71 (= #72) từ thứ tự thời gian, và T5
  đợt 127 cũng gọi b72. Việc chốt số hiệu/thời điểm reboot
  thuộc T5 (mù #37 — parent đã chấp nhận ĐỂ MỞ).
  Gap #71→#72 VẪN SPAN (đuôi mù 1h25'10" không quan sát).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ ba
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round126-t*/` (sau 23:47Z)
  + `round127-t*/` tới 02:47Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 127 vẫn đang tăng sau thời điểm đếm; T6 đợt 128 đếm
  tiếp.
- **Prune cooldown lần 2 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 63 ≤ trần 100). File cũ nhất đủ
  7 ngày vào khoảng 21/11 — T6 các đợt sau đếm tiếp. Luật
  đã chạy đúng trình tự (quét ứng viên 2 lần khi lock
  trống; tập ứng viên rỗng nên không thực thi xóa).
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 02:47Z (trống, 0 ticket + 63 cooldown); đợt còn
  chạy tới ~05:00Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124/125/126 T10 đã đếm lúc đóng). T6 không chờ
  tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 127 chưa kiểm hết:**
  mới chỉ có t8 (3 chu kỳ sạch, §3); các luồng còn lại chưa
  dùng lock thật tới 02:47Z. T6 đợt 128 kiểm tiếp.
- **Replay apt-get sau boot mới chưa kết thúc lúc T6 đóng**
  (update xong khoảng 02:46Z, pha install vẫn chạy 02:47Z;
  T5-127 đang chờ — `t5-wait-replay-b72.log`): T6 không kết
  luận nó kết thúc ra sao — thuộc T5, hạ tầng/postboot;
  lock không bị ảnh hưởng (trống, 0 ticket). Khác mẫu boot
  #71 (replay xong 12 phút sau boot): lần này payload
  replay bắt đầu muộn (~25 phút sau boot).
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
| `docs/PHASE9_ROUND127_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file).
Stage: `repo-1-push/paths-loop/phase9-round127-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round127-t6/` (analyze-log.py,
analyze-log.txt, analyze-log-final.txt, new-lines-since-621.txt,
new-lines-since-670.txt, cooldown-now.txt,
cooldown-after-prune.txt, prune-candidates.txt,
prune-deleted.txt, ps-full-1.txt, ps-full-2.txt,
khong-nha-grep.txt, test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg.sh, repro-newmsg.log).

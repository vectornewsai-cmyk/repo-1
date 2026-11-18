# PHASE9 ROUND131 T6 — Sức khỏe lock v2 + prune cooldown lần 6 + CHỐT SỐ BOOT #77?/#78?/#79? (chuỗi tương đối CHỐT, số tuyệt đối VẪN TẠM) — LIMITS

- Đợt: 131, luồng T6 (sức khỏe lock v2 + prune cooldown + chốt số
  boot + mù #37).
  Lượt cron 21:35 +07 17/11/2026. Chạy 14:41–15:10Z 17/11/2026
  (21:41–22:10 +07 17/11).
- Nhiệm vụ: kiểm lock vite sau boot mới #79? theo đúng phương pháp
  chính thức; prune cooldown lần 6 theo luật đã phê duyệt; ĐẾM LẠI
  toàn bộ chuỗi boot từ mù #37 và chốt số thứ tự cho #77?/#78?/boot
  mới (quyết parent LIMITS gộp đợt 130 §12.3(h)); ghi rõ trạng thái
  mù #37. KHÔNG sửa logic lock, KHÔNG sửa script lock, KHÔNG đụng
  production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` — ngoại trừ chính thao tác
  prune file cooldown đã phê duyệt.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round131-t6/` (analyze-log.py,
  analyze-log-final.txt, new-lines-since-796.txt,
  cooldown-now.txt, cooldown-after-prune.txt,
  cooldown-list-now.txt, prune-candidates.txt, prune-deleted.txt,
  ps-full-1.txt, ps-full-2.txt, ss-1.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg.sh,
  repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT MỚI #79? (số tạm, xem §8)

- **Boot mới: boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`,
  btime 14:26:41Z** (`uptime -s` = 14:26:41Z, `who -b` =
  Nov 17 14:26, `/proc/1` 14:26:52Z — chênh +11 s, cùng mẫu
  các boot trước). Uptime ~15' lúc T6 bắt đầu (14:41Z).
- Khớp brief mở đợt 131 + T5-131 initial-state + T2-131 prereg
  (cả ba đều ghi cùng boot_id + btime). T5-131 đã gọi boot này
  là **b79** trong tên watcher (`t5-wait-replay-b79.sh`,
  `t5-postboot-b79-poll*.log`); T2-131 prereg gọi **#79?**.
  Việc chốt số hiệu thuộc T6 đợt này — xem §8.
- Xác nhận độc lập từ T2: **probe #50 đã chạy 14:46:56Z,
  boot f868abad, ok=2 fail=0** (`round131-t2/status2.txt` +
  `once.txt`) — boot mới đã được probe heartbeat xác nhận
  sống, không chỉ `uptime -s`.
- Boot #78? (57c3e5e2, btime 13:02:41Z) chết trong khoảng
  **(14:14:23Z, 14:26:41Z]** — hẹp hơn khung brief/T5-131
  (xem §8.4: quan sát cuối trên #78? là mtime LIMITS gộp đợt
  130, 14:14:23Z — §12.3 quyết parent thêm sau khi đóng).
- md5 khớp baseline đợt 120–130: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 131 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round131-t1 → round131-t10; T2 đã probe #50 xong,
  T5 watcher replay b79 đang poll, T4 đang chạy lượt yên #9
  attempt1 — xem §1/§2).

## 1. Quét zombie: 0 zombie; 1 vite + 1 probe node ĐANG SỐNG của T4-131 (hợp lệ, đang đo) — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 14:43Z và
  14:54Z (2 snapshot `ps-full-1.txt`, `ps-full-2.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT
  (không dùng `grep ' Z '` thô — grep thô khớp nhầm chuỗi
  trong lệnh chẩn đoán của chính T6, xem ghi chú dưới):
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: lúc 14:43Z **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header); lúc 14:54Z chỉ có
  **`[::1]:5187`** (vite của T4-131, pid 14931 — xem dưới).
- Tiến trình thật lúc 14:54Z (snapshot 2): **vite + probe
  của T4-131, đang đo lượt yên #9 attempt1** — hợp lệ, KHÔNG
  phải sót/kẹt:
  - pid 14819: `vcut-vite-lock-v2.sh run-attempt t4 5187 ...`
    (giữ lock, xem §2).
  - pid 14931 (MainThread): `node .../vite -c .../round131-t4/
    vite.t4-temp.config.mjs --port 5187 --strictPort` —
    vite đang lắng nghe [::1]:5187.
  - pid 14968 (MainThread): `node .../probe121t3-ghost-k7.
    webkit.mjs ... --c2-draw-log --url http://localhost:5187/`
    — probe lượt yên #9, **cờ `--c2-draw-log` ĐÃ BẬT**
    (quyết parent đợt 130 §12.3(a): lượt #9 bật log draw).
  - pid 14943 esbuild service (con của vite 14931).
  - Lúc snapshot 1 (14:43Z) T4 chưa tới lượt chạy nên
    **0 tiến trình vite/node/webkit thật**.
- Replay apt-get sau boot mới #79?: **ĐANG CHẠY** lúc T6 kiểm
  (dpkg.log 2 dòng 14:35:39–40Z lúc 14:41Z → đã 1.509 dòng
  lúc 14:48:40Z — xem §9). **Lock không bị ảnh hưởng:
  trống trước khi T4 acquire (14:52:24Z) và trống lại sau
  khi T4 release (14:55:53Z).**
- Ghi chú phương pháp: `grep -c ' Z '` thô trên ps-full-1
  trả 1 — đó là **dương tính giả**: chuỗi `grep -c ' Z '`
  nằm trong chính lệnh `bash --norc` của T6 in trong cột
  args. Đếm đúng phải lọc theo cột STAT (`awk '$4 ~ /^Z/'`
  = 0). Ghi lại để T6 đợt sau khỏi lặp bẫy này.

## 2. Lock sau boot mới #79?: TRỐNG lúc mở, holder cuối đợt 130 đã nhả sạch trước reboot; T4-131 acquire/release sạch trong lúc kiểm

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 14:42Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 130,
  `t10-round130` RELEASED hold 116s lúc **14:02:08Z**, tức
  **24'33" TRƯỚC boot mới (14:26:41Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như các boot #60/#62/#64/#66/#68/#71/#72/
  #74/#75/#76/#77 ở các đợt trước).
- `status` lúc 14:42Z: `TRỐNG (không có lock)`,
  `0 ticket + 73 cooldown`, rc=0.
- **Trong lúc T6 kiểm, T4-131 đã dùng lock thật 1 chu kỳ
  sạch, quan sát trực tiếp:** `t4` TICKET + ACQUIRED
  14:52:24Z cổng 5187 wait 0s → RELEASED 14:55:53Z hold
  209s (log dòng 820–822). Lúc 14:54:09Z T6 đọc `status`
  thấy lock ĐANG GIỮ bởi t4 (dir tồn tại, tuổi 105s,
  pid 14819 sống, vite 14931 trên cổng 5187) — holder
  sống, cổng lắng nghe, **không phải stale** nên T6 không
  can thiệp; lúc 14:57:06Z lock đã TRỐNG lại
  (0 ticket + 73 cooldown, rc=0).
- Khoảng yên trước đó: **không có event lock nào từ
  14:02:08Z (t10-round130 release) tới 14:52:24Z (t4
  acquire)** — 50'16" yên, bao gồm ~26' đầu sau boot mới.
  Yên lặng này là do đợt 130 đã đóng và các luồng đợt 131
  chưa tới lượt dùng lock — không phải do lock kẹt (bằng
  chứng: suite /tmp §6 chạy xanh trên bản script hiện hành
  + T4 acquire/release thật sạch ngay sau đó).

## 3. Đóng nợ T6-130: 8 chu kỳ mới sau snapshot 796 dòng — TẤT CẢ nhả sạch, round 130 khép sạch trên lock

Từ sau snapshot T6 đợt 130 (796 dòng lúc ~11:40Z 17/11) tới
nay (833 dòng lúc 15:10Z): **+37 dòng = TICKET +11 /
ACQUIRED +11 / RELEASED +11 / COOLDOWN +4 / TIMEOUT +0 /
STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng con số, không
có event nào mất dấu hay thêm lạ. (Chi tiết từng dòng trong
`round131-t6/new-lines-since-796.txt`.)

- **`t4` (đợt 130): 3 chu kỳ sạch** — attempt1 12:43:32–
  12:47:13Z hold 221s; attempt2 12:52:02–12:55:55Z hold 233s;
  attempt3 12:59:19–13:02:42Z hold 203s (lượt yên WebKit #8,
  cổng 5187, wait 0s cả ba). Tái dùng file `cooldown-t4` đã
  có nên +0 cooldown net. Lưu ý ranh giới: RELEASED
  attempt3 ghi 13:02:42Z — 1 giây SAU btime boot mới #78?
  (13:02:41Z) theo đồng hồ boot #77? — cùng mẫu chênh đồng
  hồ tại reboot đã ghi ở LIMITS gộp đợt 130 §12.1(5); không
  phải event mất dấu (cặp TICKET/ACQUIRED/RELEASED đủ).
- **`t8-round130` (T8b, đợt 130): 3 chu kỳ sạch** —
  13:40:29–13:41:40Z hold 71s (cổng 5390, wait 0s);
  13:41:55–13:44:10Z hold 134s (cổng 5490, wait 16s);
  13:44:25–13:48:18Z hold 233s (cổng 5490, wait 15s).
  +2 COOLDOWN (2 dòng, tái dùng 1 file `cooldown-t8-
  round130` nên +1 file net — xem F-131-T6-2 §11 về tên
  file trong LIMITS T10).
- **`t10-round130`: 1 chu kỳ sạch** (14:00:12–14:02:08Z),
  hold 116s, cổng 5554, wait 0s — đóng đợt (suite + O8).
  +1 file `cooldown-t10-round130`.
- **`t4` (đợt 131): 1 chu kỳ sạch** — attempt1 lượt yên #9
  14:52:24–14:55:53Z hold 209s, cổng 5187, wait 0s
  (T4-131, quan sát trực tiếp lúc kiểm — xem §2).
- **`t8-round131`: 3 chu kỳ sạch, hold 1s mỗi chu kỳ** —
  15:03:27–15:03:28Z (cổng 5390, wait 0s), 15:03:43–
  15:03:44Z (cổng 5490, wait 15s), 15:03:59–15:04:00Z
  (cổng 5490, wait 15s). Hold 1s + chờ cooldown ~15s rồi
  acquire lại ngay — dạng kiểm lock nhanh (không phải chạy
  harness dài); cả 3 đều nhả sạch, +2 COOLDOWN, +1 file
  `cooldown-t8-round131` net (tạo 15:04:00Z).
- **Round 130 khép lại sạch trên lock: 7 chu kỳ của chính
  luồng đợt 130 (t4×3 + t8b×3 + t10×1) đều TICKET =
  ACQUIRED = RELEASED, 0 TIMEOUT, 0 STALE-LOCK.** Ca
  acquire mất theo reboot duy nhất của cửa sổ này vẫn là
  của đợt 129 (t8-round129, đã có STALE-LOCK dọn đúng luật
  — T6-130 §3); không có ca mới nào trong đợt 130.
- Các luồng đợt 130 còn lại (t1/t2/t3/t5/t5b/t6/t7/t9) không
  có event lock thật nào trong cả đợt — tức không dùng lock
  thật (không phải vi phạm, chỉ là không dùng).

## 4. Nhất quán log lock: 833 dòng, 241/241 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~15:10Z
(14/11 18:01:32Z → 17/11 15:04:00Z; script ghép cặp
`round131-t6/analyze-log.py` — tái dùng từ round130, output
`analyze-log-final.txt` lúc 833 dòng):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 255 | 164 | 158 |
| ACQUIRED | 246 | 164 | 158 |
| RELEASED | 241 | 163 | 157 |
| COOLDOWN | 76 | 68 | 63 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 6 | **1** | 1 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **833** | **560** | **537** |

- So với snapshot T6 đợt 130 (796 dòng lúc ~11:40Z 17/11):
  +37 dòng, đúng bằng TICKET +11 / ACQUIRED +11 /
  RELEASED +11 / COOLDOWN +4 / TIMEOUT +0 / STALE-LOCK +0
  — khớp từng con số, không có event nào mất dấu hay thêm
  lạ. (Lưu ý đếm: `grep -c TICKET` thô đếm 256 vì khớp cả
  dòng STALE-TICKET; số chính thức 255 dùng khớp từ chính
  xác như script analyze-log.py.)
- Ghép cặp theo thread: **241 cặp ACQUIRED→RELEASED, 0 lock
  đang giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước
  đó.** Chênh ACQUIRED − RELEASED = 5, đúng bằng 5 ca
  "double-acquire" — không có lock nào mất dấu.
- 5 ca "double-acquire" — **cùng đúng 5 ca T6 đợt 130 đã
  liệt kê** (s3-round116, t3-round117, t4, t3-round119,
  t8-round129 dòng 781), tất cả giải thích được bằng
  STALE-LOCK cướp sau reboot; **không có ca mới nào**.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũ toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11) + **1 STALE-LOCK 09:04:38Z
  17/11 do reboot #75→#76 giữa lượt** (§3 đợt 130).
- Round 120/121/122/123/124/125/126/127/128/129/130 khép
  lại sạch trên lock (đợt 129 với caveat 1 acquire mất theo
  reboot đã dọn đúng luật — T6-130 §3; đợt 130 sạch hẳn —
  xem §3 trên). Cửa sổ R120: **164 = 164 T/A, RELEASED
  163** (chênh 1 đúng bằng ca reboot-kill), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log: 255+246+241+76+8+6+1 = 833 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log. **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 129 (toàn đợt), đợt 130 (toàn đợt) và đợt 131 (tới 15:10Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round129-t*/` + `round130-t*/` + `round131-t*/`
(tới 15:10Z). Tổng **10 dòng khớp, phân loại đủ 10/10 — tất
cả đều là bản sao script, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 10 | 5 file × 2 dòng: `round129-t4/vcut-vite-lock-v2.frozen.sh`, `round129-t10/vcut-vite-lock-v2.t10.sh`, `round130-t4/vcut-vite-lock-v2.frozen.sh`, `round130-t10/vcut-vite-lock-v2.t10.sh`, `round131-t4/vcut-vite-lock-v2.frozen.sh` — mỗi file 2 dòng `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| File grep-output của chính T6 | 0 | T6 loại `khong-nha-grep.txt` và `repro-newmsg.log` khỏi grep ngay từ đầu (như T6 đợt 123–130 đã loại `khong-nha-grep`); file `khong-nha-grep.txt` của T6 đợt này (10 dòng, toàn bản sao script) sẽ bị grep đợt sau khớp lại — T6 đợt 132 tiếp tục loại `khong-nha-grep` |
| Tái hiện có kiểm soát trên /tmp | 0 trong đếm này | `round131-t6/repro-newmsg.log` đã loại khỏi grep; repro đợt này có đúng 2 dòng `BỎ QUA` + 1 dòng `KHÔNG NHẢ` có kiểm soát (xem §6) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 129 (toàn đợt) / 130 (toàn đợt) / 131 nào |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn đợt),
  đợt 130 = 0 (toàn đợt), đợt 131 tới 15:10Z = 0.** Khớp
  với log pairing sạch ở §4 (241/241 cặp, 0 TIMEOUT,
  STALE-LOCK mới duy nhất do reboot — không liên quan nhánh
  release).
- Giới hạn phạm vi: các luồng đợt 131 vẫn đang chạy, log của
  chúng có thể tăng sau 15:10Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 131, T6 đợt 132 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý: phạm vi đợt này bỏ round128 (T6-130 đã đóng toàn
  đợt 128); số dòng giữ 10 (thay vì giảm) vì round131-t4 đã
  thêm 1 bản sao script mới.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
#79? (`f868abad…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round131-t6/test-v2-t6-run1.log` 14:47:55Z,
  `test-v2-t6-run2.log` 14:48:17Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ bảy liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127, 128, 129, 130
    cũng vậy). Tính flaky của T7 (T9 đợt 119 §1.2) vẫn được
    ghi nhận là bản chất — bảy lần xanh kép không xóa nó;
    quyết tách T7 khỏi gate 9/9 khi đợt đông vẫn thuộc về
    parent; T6 không tự đổi test.
  - Kết luận suite: xanh lần thứ mười ba liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128 + T6 đợt 129 + T6 đợt 130 + T6 đợt
    131).
- **Tái hiện message mới (`round131-t6/repro-newmsg.log`,
  14:53:xxZ)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122/123/124/125/126/127/128/129/130, kết quả
  giống hệt:
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
  **11/11 chu kỳ acquire/release thật sau snapshot T6 đợt 130
  đều sạch (§3)** — bao gồm 1 chu kỳ T4-131 attempt1 quan
  sát trực tiếp trong lúc kiểm + 3 chu kỳ nhanh của T8-131.
  Đây là bằng chứng live
  (không phải chỉ suite /tmp) rằng lock v2 hoạt động đúng
  qua boot #78? và trống sạch sang boot mới #79?.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #79?,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (241/241
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT mới từ đợt 120,
  STALE-LOCK mới duy nhất do reboot giữa lượt (đã dọn đúng
  luật, đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  120–130 (toàn đợt) và đợt 131 (tới 15:10Z), suite 9/9 độc
  lập ×2 lần chạy (T7 xanh cả hai lần), và holder live cuối
  đợt 130 đã nhả sạch trước reboot.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 6 liên tiếp)

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c);
chú thích ngữ nghĩa `find -mtime` đã ghi vào luật ở đợt 130
theo quyết parent đợt 129 §12.3(e)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG). Ngữ nghĩa `find -mtime`:
`-mtime +7` chỉ khớp file **≥192h (8 ngày)**,
`-mtime +2` chỉ khớp file **≥72h** — phương pháp `find`
bảo thủ hơn chữ luật tối đa 24h (xóa muộn, không bao giờ
xóa sớm).

- **Trình tự thực hiện:**
  - 14:54Z: lock ĐANG GIỮ bởi t4 (attempt1 lượt yên #9,
    xem §2) — **không chạy prune lúc này** (đúng điều (e)).
    Chỉ quét đọc ứng viên: `find -mtime +7`: **0 file**.
  - 14:57Z: lock đã TRỐNG lại (t4 release 14:55:53Z;
    0 ticket + 73 cooldown, rc=0). Quét lại ứng viên
    mtime >7 ngày (`find -mtime +7`): **vẫn 0 file**
    (`prune-candidates.txt` rỗng). Tổng 73 file ≤ trần
    mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 131: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày theo đồng hồ tường vào khoảng
    **21/11 18:38Z**; theo phương pháp `find -mtime +7`
    (≥192h) sẽ khớp ứng viên vào khoảng **22/11 18:38Z**.
    T6 các đợt sau đếm tiếp. Đây là lần thứ 6 liên tiếp
    prune xóa 0 file (đợt 126: 0; đợt 127: 0; đợt 128: 0;
    đợt 129: 0; đợt 130: 0; đợt 131: 0).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc prune (14:57Z) 73 file / 1022 byte (khớp
  cả ba cách đếm độc lập: `find` 73, `ls` 73, `status`
  "73 cooldown"; 73 × 14 = 1022 khớp; tổng kích thước file
  đo trực tiếp cũng 1022 B) — khớp đúng số chính thức T10
  đếm lúc đóng đợt 130 (73/1022), tức **0 file cooldown mới
  từ lúc đóng đợt 130 tới lúc prune**. Sau prune, T8-131
  thêm **+1 file `cooldown-t8-round131`** (15:04:00Z, xem
  §3) nên lúc T6 đóng (15:10Z) là **74 file / 1036 byte**
  (khớp ba cách đếm: `find` 74, `ls` 74, `status`
  "74 cooldown"; 74 × 14 = 1036 khớp). **T6 ghi số đếm
  chính thức lúc đóng là 74** (số lúc prune 73 chỉ còn là
  số trung gian). Không file nào bị xóa giữa hai lần đếm.
- Phân tầng tuổi lúc 14:57Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 0 file; ≥48h (`-mtime +1`): 27 file**
  (tăng từ 20 ở đợt 130 vì thời gian trôi — thêm file
  vượt 48h, chưa file nào vượt 72h). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 14:57Z mới **~68h19' tuổi**; mới nhất 14:55:53Z
  (t4 attempt1, tái dùng file cũ nên mtime file không đổi
  — file `cooldown-t4` giữ mtime 13:02Z).

## 8. CHỐT SỐ BOOT — đếm lại toàn bộ chuỗi từ mù #37 (quyết parent đợt 130 §12.3(h))

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + ĐÍNH CHÍNH NGÀY (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8): khoảng **11:39:50Z →
  23:45:17Z (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ
  mở, tổng ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B +
  8 đoạn C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7
  đợt 119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11 (xem đính chính dưới), đã đóng băng từ đợt
  119; mọi quan sát sau đó đều nằm ngoài khoảng mù. Trạng
  thái mù #37 KHÔNG ĐỔI.
- **F-131-T6-1 (mới, đính chính ngày — nội dung khoảng mù
  không đổi): T6-129 §8.1 và T6-130 §8 đều ghi khoảng mù
  #37 là "16/11" — SAI NGÀY.** Nguồn gốc (T6-119, tài liệu
  gốc của mù): probe #37 lúc 11:39:50Z, probe #38 lúc
  **2026-11-15T23:45:17Z** (heartbeat ts ghi rõ năm-tháng-
  ngày trong file `PHASE9_ROUND119_T6_EPERM_LIMITS.md`:
  "Heartbeat **n=38, ts 2026-11-15T23:45:17Z, boot
  27c8b1d9**"; "boot changed 48a82db1 -> 27c8b1d9 (uptime
  since 2026-11-15 23:33:34)"); đợt 119 làm việc 23:41Z
  15/11 → 00:1xZ 16/11 (lượt cron 06:35 +07 16/11 =
  23:35Z 15/11). **Khoảng mù #37 đúng là 15/11
  11:39:50Z → 23:45:17Z.** Lỗi "16/11" xuất hiện lần đầu
  ở T6-129 §8.1 rồi được T6-130 §8 chép lại. Ảnh hưởng
  KHÔNG ĐÁNG KỂ: chỉ sai nhãn ngày, không đổi độ dài
  khoảng, trạng thái A/B/C/D, hay số reboot ẩn tối đa (29).
  Từ đợt này trở đi ghi đúng **15/11**.
- Đuôi sau mốc cuối đợt 130 → boot #79? đã đếm ở §8.4
  (khung chết #78? hẹp hơn). Đuôi sau mốc cuối đợt 129 →
  boot #77 thuộc T5/T2 đợt 130 (mù #49) — đã có kết luận
  (B mở, tối đa 1 ẩn — xem §8.3(b)).

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ)

Phương pháp: mỗi boot liệt kê với boot_id + btime lấy từ
≥1 nguồn độc lập (LIMITS T5/T2 của đợt tương ứng, probe
heartbeat, `uptime -s`/`who -b` đọc tươi, hoặc T6 các đợt
trước); btime→btime danh nghĩa = khoảng cách giữa hai btime
liên tiếp. Số thứ tự là số tạm theo thứ tự thời gian (tất
cả đều mang "?") — xem verdict §8.3. Không có boot_id lạ
nào xuất hiện trong bất kỳ bằng chứng 17/11 nào ngoài
chuỗi này (quét toàn bộ boot_id trong LIMITS T5/T2 đợt
120–130 + toàn bộ thư mục round131-t*: chỉ còn
`f868abad` là boot mới; mọi id khác đều ≤ 16/11 23:25Z
hoặc thuộc chuỗi dưới).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #57 | 27c8b1d9 | 23:33:34Z 15/11 | — (boot cuối quan sát trong mù #37; probe #38) | T6-119 |
| #58 | (không pin lại ở đây) | 00:53:41Z 16/11 | 1h20'07"–1h25'39" (KHOẢNG do nhảy clock 32–332s tại reboot này — T5-120 §2.2) | T5-120 |
| #59 | (không pin lại ở đây) | 01:47:49Z 16/11 | 54'08" | T5-120 (gap #58→#59) |
| #60 | 0260101b | 04:45:49Z 16/11 | 2h58'00" | T5-120 (probe #39) |
| #61 | 80a940d7 | 06:50:58Z 16/11 | 2h05'09" | T5-121/T10-121 |
| #62 | 9788ce28 | 08:25:47Z 16/11 | 1h34'49" | T5-121 |
| #63 | 725453a2 | 08:53:05Z 16/11 | 27'18" | T5-121 |
| #64 | 3fe7e89e | 11:05:18Z 16/11 | 2h12'13" | T5-122 |
| #65 | fbc42445 | 12:53:25Z 16/11 | 1h48'07" | T5-122/123 (epoch 1794833605 khớp btime; gate0-wait b65) |
| #66 | 9bbda390 | 14:24:43Z 16/11 | 1h31'18" | T5-123 |
| #67 | 94e29be5 | 14:52:19Z 16/11 | 27'36" (#66 chết đúng lúc này) | T5-123 |
| #68 | 69359761 | 17:33:51Z 16/11 | 2h41'32" | T5-124 |
| #69 | 670c07f6 | 20:35:11Z 16/11 | 3h01'20" | T5-125 |
| #70 | 310f07e4 | 20:54:19Z 16/11 | 19'08" | T5-125/126 |
| #71 | ff7afbbb | 23:25:41Z 16/11 | 2h31'22" | T5-126 |
| #72 | 81464315 | 02:10:17Z 17/11 | 2h44'36" | T5-127 |
| #73 | 5e522260 | 03:04:25Z 17/11 | 54'08" | T5-127/128 |
| #74 | c279cf46 | 04:55:04Z 17/11 | 1h50'39" | T5-128/T6-129 |
| #75 | 475406f6 | 07:13:31Z 17/11 | 2h18'27" (8.307 s) | T6-129/T2-129 |
| #76 | 88f62ae6 | 09:02:12Z 17/11 | 1h48'41" (6.521 s) | T6-130/T2-130 |
| #77 | 86538084 | 10:56:31Z 17/11 | 1h54'19" (6.859 s) | T6-130/T2-130 |
| #78 | 57c3e5e2 | 13:02:41Z 17/11 | 2h06'10" (7.570 s) | T5b-130/T2-131 |
| #79 | f868abad | 14:26:41Z 17/11 | 1h24'00" (5.040 s, #78→#79); đang sống | T5-131/T2-131/T6 này |

- Ghi chú bảng: tuổi thọ #57 không tính vì btime boot
  trước nó (#56 ~20:17Z 15/11) chỉ là ước lượng; tuổi thọ
  #58 là khoảng do nhảy clock (bước lùi 32–332s — tiền lệ
  cho chênh đồng hồ tại ranh giới reboot, xem §8.5).
  Boot_id #58/#59 không pin lại ở đây (T5-120 chỉ chốt
  btime chính xác từng giây cho cả hai; id đầy đủ nằm
  trong hồ sơ đợt 120) — không ảnh hưởng verdict vì hai
  boot này nằm trước #60 và đã được chốt btime.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #74: (06:24:30Z, 07:13:31Z] (T6-129 §8.2).
  - #75: (09:01:36Z, 09:02:12Z] — 36 giây (ACQUIRED cuối
    của t8-round129 09:01:36Z, T6-130 §3).
  - #76: (10:41:55Z, 10:56:31Z] — 14'36" (snapshot
    proactivity 10:41:55Z, T2-130 §2).
  - #77: HAI khung (quyết parent §12.3(f), xem §8.5).
  - #78: (14:14:23Z, 14:26:41Z] — 12'18" (T6 này, §8.4).

### 8.3 VERDICT: chuỗi tương đối CHỐT — số tuyệt đối VẪN TẠM (giữ "?")

- **CHỐT ĐƯỢC — chuỗi tương đối:** 23 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #79 (14:26:41Z 17/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→#76→#77→#78
  →#79 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 +
  file mtime). Không có bằng chứng nào về một boot quan sát
  được mà chưa đếm.
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Ba lý do độc lập,
  bất kỳ lý do nào cũng đủ để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn.** Toàn bộ chuỗi sau
    mù #37 mang cùng một độ lệch chưa biết k (0 ≤ k ≤ 29):
    nếu k reboot ẩn xảy ra trong cửa sổ B/C của mù #37 thì
    số thật của mọi boot sau đó là (số tạm + k). T5-120
    §2.2 đã tính gộp: cộng thêm mù #38 (G mở, tối đa 6 ẩn)
    và mù #29/#30/#31 (+4) thì boot tạm gọi "#60" thực tế
    có thể tới #123. Độ lệch này là **cấu trúc, không gỡ
    được từ trong VM** — không có quan sát mới nào trong
    cửa sổ B/C của mù #37 từ đợt 119 tới nay.
  - (b) **Mù #49 đoạn B (đời boot #76) MỞ, tối đa 1 ẩn**
    (T2-130 §2): lỗ quan sát lớn nhất 2.252 s
    (10:04:23Z → 10:41:55Z) đủ rộng cho một reboot ẩn —
    bước #76→#77 có thể là +2 thay vì +1, độc lập với (a).
  - (c) **Mù #50 đoạn B (đời boot #78?) CHƯA CÓ VERDICT**
    (T2-131 prereg: "KHÔNG CHẮC"): khung chết #78?
    (14:14:23Z, 14:26:41Z] im lặng 12'18" — đủ rộng cho một
    reboot ẩn về mặt thời gian; T2-131 sẽ kết luận đoạn B
    sau khi probe #50 phân tích xong. Tới lúc đó, bước
    #78→#79 cũng chỉ chốt được ở mức tương đối.
- **Kết luận cho parent:** T6-131 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC; số thứ tự tuyệt đối **vẫn TẠM** và phải giữ "?"
  cho tới khi có bằng chứng ngoài VM (hoặc một mù được
  đóng hoàn toàn làm neo mới). Không bịa số, không bỏ "?"
  khi chưa đủ bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T5-131 gọi boot mới là "b79" và T2-131
  gọi "#79?" — cả hai đều dùng đúng quy ước tạm; không cần
  đổi tên file/cờ nào. Các quyết parent trước (§12.3(h)
  đợt 130) vẫn đứng: không quyết con số tuyệt đối nào ở đây.

### 8.4 Khung chết #78? HẸP HƠN (đóng góp mới của T6 đợt này)

- Brief mở đợt 131 + T2-131 prereg dùng khung
  (14:10Z, 14:26:41Z] (T10 đóng đợt 130 lúc 14:09–14:10Z);
  T5-131 dùng (14:09:54Z, 14:26:41Z] (mtime
  `round130-t10.done` 14:09:54Z).
- **T6 đợt này hẹp hơn: (14:14:23Z, 14:26:41Z] (12'18").**
  Bằng chứng: file `docs/PHASE9_ROUND130_LIMITS.md` có
  mtime **14:14:23Z** và kích thước **67.500 B** (lúc T10
  đóng là 63.143 B — xem LIMITS gộp §10.4) — đúng phần
  §12.3 quyết parent được thêm sau khi đóng (F-130-1 đã
  ghi mẫu này: sửa sau khi đóng để thêm §12.3 là có chủ
  đích). Đây là lần ghi file cuối cùng trên boot #78?.
  Quét `find -newermt` trên toàn `hidden_files/` +
  `docs/` cho khoảng (14:10Z, 14:26:41Z] chỉ trả đúng 1
  file này — không có quan sát nào khác trong khoảng chết.
- Tuổi thọ #78? theo khung hẹp: **1h11m42s–1h24m00s**
  (thay cho 1h07m13s–1h24m00s của T5-131). Gap #78→#79
  danh nghĩa (btime→btime) vẫn 5.040 s.
- Lưu ý: khung hẹp này T2-131 có thể chưa dùng (prereg
  viết trước khi T6 kiểm) — T2-131 tự quyết có nhận khung
  này cho mù #50 hay không; T6 chỉ ghi bằng chứng.

### 8.5 Khung chết #77 hai bản ghi — GIỮ NGUYÊN (quyết parent §12.3(f))

- T8/T5b: (13:02:16Z, 13:02:41Z]; T4: (13:02:42Z,
  13:04:14Z]. Chênh ~1 s ở ranh giới (làm tròn giây /
  đồng hồ hai boot chênh nhau). Ghi cả hai, không tự chọn
  một — quyết parent đã chấp nhận. Không có bằng chứng mới
  nào đợt này làm hẹp hay loại một khung.
- Tiền lệ củng cố cách ghi này: nhảy clock tại reboot #58
  (bước lùi 32–332s, T5-120 §2.2) và chênh ~33s tại #76
  (T2-130) — đồng hồ VM tại ranh giới reboot vốn không
  đáng tin ở mức giây; khung chết dạng khoảng + ghi cả hai
  nguồn là cách ghi đúng.

## 9. Replay apt sau boot #79?: ĐÃ ĐẠT BASELINE NHANH (ghi nhận — thuộc T5)

- Watcher T5 (`round131-t5/t5-wait-replay-b79.sh`) đang poll
  (poll1/2/3 lúc 14:45–14:46Z). T5-131 initial-state:
  configure 14:35:39Z (boot +8m58s), apt-get update đang
  chạy, postboot FAIL exit 1 lúc mở.
- Quan sát của T6: `/var/log/dpkg.log` chỉ có 2 dòng lúc
  14:41Z, nhưng tới **14:48:40Z đã 1.509 dòng** (dòng cuối:
  `status installed gstreamer1.0-tools:amd64` — đúng gói
  cuối của baseline như T5b-130 ghi). Replay đạt baseline
  1.509 dòng / 217 installs trong ~13 phút (14:35:39Z →
  14:48:40Z) — dạng "chạy đầy đủ" như #78?, KHÁC dạng (B)
  của #76?/#77?. **T6 không kết luận PASS/FAIL — thuộc
  T5** (watcher + postboot check mới có quyền verdict).
- **Lock không bị ảnh hưởng** (trống trước/sau T4 acquire,
  xem §2).

## 10. Dọn Xvfb: 0 Xvfb, 1 socket sót X193 (0 process) — sinh trong lúc T4 chạy attempt1, chờ T4/T10 dọn

- **Lúc mở đợt (14:43Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy. Không có Xvfb sót nào từ đợt 130 (reboot #79?
  đã xóa tmpfs; T10 đợt 130 cũng đã dọn tay 3 socket sót
  X193/X194/X195 lúc đóng).
- **Lúc 14:54Z: socket X193 xuất hiện (mtime 14:52Z), 0
  process Xvfb.** Kiểm kỹ: quét toàn bộ `/proc/*/cmdline`
  không có process nào tên Xvfb; quét `/proc/*/fd` không
  process nào giữ socket inode của X193; `pgrep -x Xvfb`
  = 0. Log T4 ghi "Xvfb :193 đã lên" + "WebKit launched,
  version: 27.2" lúc attempt1 bắt đầu — Xvfb đã chạy rồi
  thoát (hoặc bị kill) khi probe xong, chỉ còn socket sót
  lại. T4 attempt1 đã xong lúc T6 kiểm (analyzer
  `analyze-t4-lag5.py` đang chạy trên JSON attempt1 lúc
  14:56:35Z); socket X193 còn lúc 14:57Z nhưng **đã được
  dọn trước 15:04Z** (xem dưới) — T4/T8 tự dọn giữa các
  attempt, không cần T10 dọn tay đợt này.
- **Lúc 15:09Z: `/tmp/.X11-unix/` TRỐNG LẠI — socket X193
  đã được dọn** (thư mục mtime 15:04Z; không còn socket nào).
  T4/T8 đã dọn socket giữa các attempt — đây là lần đầu
  trong các đợt gần đây socket sót được dọn TRƯỚC lúc T10
  đóng (các đợt 129/130 đều phải chờ T10 dọn tay). Luật
  đứng "mỗi driver tự kill Xvfb của mình khi xong" có bằng
  chứng live tích cực đợt này: Xvfb :193 đã thoát (0
  process) VÀ socket đã được dọn trong cùng lượt.
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).

## 11. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#79?) VẪN TẠM (xem §8.3):** chuỗi
  tương đối #57→#79 đã chốt; số tuyệt đối giữ "?" vì (a)
  mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6, mù
  #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới #123);
  (b) mù #49 đoạn B mở, tối đa 1 ẩn (T2-130); (c) mù #50
  đoạn B chưa có verdict (T2-131). Journal/wtmp chỉ giữ
  boot hiện tại (journal `--list-boots` chỉ 1 dòng f868abad;
  wtmp bắt đầu 14:26:52Z) nên T6 suy ra số hiệu từ thứ tự
  thời gian + hồ sơ các đợt trước, không phải từ log hệ
  thống.
- **F-131-T6-1 (mới): ngày của mù #37 là 15/11, không phải
  16/11** (T6-129 §8.1 + T6-130 §8 ghi sai ngày; xem §8.1).
  Nội dung khoảng mù không đổi; từ đợt này ghi đúng 15/11.
- **F-131-T6-2 (mới, nhỏ — trong LIMITS gộp đợt 130 §10.1):
  tên file cooldown của T8b ghi sai.** T10 viết "+cooldown-
  t8b-round130" nhưng file thật trên đĩa là
  **`cooldown-t8-round130`** (mtime 13:48Z; thread trong
  log lock là `t8-round130`, T8b dùng tên thread này).
  Số đếm 73/1022 B không đổi (chỉ sai tên gọi). Không sửa
  file đợt 130; chỉ ghi nhận để lần sau khỏi trích sai tên.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ bảy
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round129-t*/` (toàn đợt) +
  `round130-t*/` (toàn đợt) + `round131-t*/` tới 14:57Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). Log các luồng đợt 131 vẫn đang tăng sau thời điểm
  đếm; T6 đợt 132 đếm tiếp.
- **Prune cooldown lần 6 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 73 ≤ trần 100). File cũ nhất đủ
  7 ngày theo đồng hồ tường ~21/11 18:38Z, theo `find`
  ~22/11 18:38Z — T6 các đợt sau đếm tiếp. Lần này prune
  phải chờ T4 release (lock bị giữ 14:52–14:55Z) mới chạy
  chính thức lúc 14:57Z — đúng điều (e) của luật.
- **Đợt 130 khép sạch trên lock (§3):** 7 chu kỳ của luồng
  đợt 130 đều sạch; ca reboot-kill duy nhất trong cửa sổ
  thuộc đợt 129 (đã dọn đúng luật). Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 15:10Z (trống, 0 ticket + 74 cooldown); đợt còn
  chạy tới ~17:35Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124/125/126/127/128/129/130 T10 đã đếm lúc đóng).
  T6 không chờ tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 131 mới kiểm 4 chu kỳ:**
  t4 attempt1 sạch (14:52:24–14:55:53Z, hold 209s) + t8
  3 chu kỳ nhanh sạch (15:03:27–15:04:00Z, hold 1s mỗi
  chu kỳ). Các attempt sau của T4 + T8/T10 chưa chạy tới
  15:10Z — T6 đợt 132 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 131: CÓ BẰNG CHỨNG LIVE
  TÍCH CỰC** — Xvfb :193 của T4 đã thoát và socket đã được
  dọn trước 15:04Z (xem §10). T4 còn attempt2/3; T6 đợt 132
  kiểm tiếp sau khi T4/T8/T10 chạy xong.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; chỉ
  đính chính ngày (F-131-T6-1). Mù #49 đoạn B mở + mù #50
  mới mở thuộc T2-131.
- **Replay apt #79? đã đạt baseline 1.509 dòng lúc 14:48:40Z**
  (xem §9) — T6 chỉ ghi nhận, verdict thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).
- **Bẫy đếm zombie (ghi cho T6 sau):** đừng dùng
  `grep -c ' Z '` thô trên `ps` — chuỗi pattern nằm trong
  chính lệnh chẩn đoán sẽ khớp giả. Đếm theo cột STAT bằng
  `awk '$4 ~ /^Z/'`.

## 12. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND131_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file; +1 file mới do T8-131 thêm sau prune),
Xvfb (0 process; socket X193 của T4 đã được dọn trước 15:04Z).
Stage: `repo-1-push/paths-loop/phase9-round131-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round131-t6/` (analyze-log.py,
analyze-log-final.txt, new-lines-since-796.txt,
cooldown-now.txt, cooldown-after-prune.txt,
cooldown-list-now.txt, prune-candidates.txt, prune-deleted.txt,
ps-full-1.txt, ps-full-2.txt, ss-1.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg.sh,
repro-newmsg.log).

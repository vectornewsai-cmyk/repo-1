# PHASE9 ROUND136 T6 — lock health + prune lần 11 + CHỐT SỐ BOOT #92? — LIMITS

- Đợt: 136, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 12:35 +07 18/11/2026 (= 05:35Z). Chạy 05:40:51Z →
  05:54:11Z 18/11/2026, toàn bộ trên một boot duy nhất #92?
  (1ca1feaa) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune, suite kiểm lock 9/9 ×2, chốt
  chuỗi boot với boot mới 1ca1feaa, kiểm lại mâu thuẫn boot đợt
  135 (T1-135 "boot giữ 8ae55060" vs parent đo 78b55838 lúc mở),
  ghi mọi sai số F-136-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên).
- Thư mục làm việc: `hidden_files/round136-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-906.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-909-close.log, analyze-log.py,
  cooldown-now.txt, cooldown-prev-names.txt,
  prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log,
  repro-newmsg-fixed.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT #92? (số tạm, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `1ca1feaa-af3b-41dc-aaae-34376329b0a3`, btime 05:29:18Z**
  (`uptime -s` = 05:29:18Z, `who -b` = Nov 18 05:29,
  `/proc/1` 05:29:34Z — chênh +16 s, cùng mẫu các boot trước;
  `journal --list-boots` chỉ 1 dòng 1ca1feaa, first entry
  05:29:34Z). Uptime ~11'33" lúc T6 bắt đầu (05:40:51Z),
  ~24' lúc đóng (05:53:22Z). Đây là **reboot #91?→#92? —
  sự kiện gộp #16** (ranh giới, sau khi đợt 135 đóng 04:10Z,
  trước khi đợt 136 mở 05:35Z).
- **Đính chính brief mở đợt:** brief ghi boot mới là "#91?"
  với "gap #90?→#91?" và btime "~05:29:34Z" — CẢ HAI đều cần
  sửa (xem §8.2): boot mới là **#92?** (giữa #90? và nó còn
  #91? bcc71e61, btime 03:35:20Z — sự kiện gộp #15 giữa lượt
  đợt 135, T10-135 đã chốt); btime chuẩn là **05:29:18Z**
  (`uptime -s`), còn ~05:29:34Z là giờ `/proc/1` (+16 s).
  T2-136 (prereg-t2.md) đã độc lập đi tới cùng kết luận
  trước khi T6 đo — không phải sai số đo, chỉ là brief viết
  theo số ước lượng lúc mở ("~", "ứng viên"); không đánh số
  F cho brief.
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 136 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round136-t1…t10; T6 không đọc nội dung cờ của
  luồng khác, T10 đối chiếu).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 05:40Z
  (mở, `ps-full-open.txt`) và lúc 05:53Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: cả 2 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot (1 dòng khớp "vite" trong mỗi file ps chỉ là
  chuỗi lệnh shell của chính lệnh đo của T6 — không phải
  process vite; đã đối chiếu trực tiếp từng dòng).
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot
  (lúc mở chưa có acquire nào của đợt 136; lúc đóng T4-136
  vừa nhả xong — xem §2).

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; giữa phiên T4-136 giữ 1 chu kỳ lượt yên #13 (hợp lệ)

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 05:40Z (mở) và lúc 05:53Z (đóng) — không có file owner
  stale nào, không cần dọn lock stale.
- `status` lúc mở và lúc đóng: `TRỐNG (không có lock)`,
  `0 ticket + 82 cooldown`, rc=0 cả hai lần.
- **Giữa phiên (05:50:15Z) lock ĐANG GIỮ bởi t4 — hợp lệ:**
  `status` hiện dir tồn tại, tuổi 106 s, thread=t4,
  pid=14425, port=5187, ticket
  `1-1794980909359001317-14425-t4`, started=05:48:29Z,
  boot=1ca1feaa; vite node pid 14528 đang chạy trên cổng
  5187 với config `round136-t4/vite.t4-temp.config.mjs` —
  đây là **attempt1 lượt yên #13 của T4-136** (theo quyết
  parent đợt 135 §12.3(a), mở với cây 530e10a7). T4 nhả
  **05:52:07Z, hold_s=218**, lock TRỐNG trở lại. T6 không
  can thiệp, chỉ quan sát.
- Log thật lúc mở: **912 dòng thô / 906 dòng chính thức** —
  dòng cuối `2026-11-18T03:58:03Z t10-round135 RELEASED
  hold_s=103`. Lúc đóng: **915 dòng thô / 909 dòng chính
  thức** — +3 dòng đúng bằng 1 chu kỳ t4-136 (xem §4).
  **Không có event lock nào khác của đợt 136** tới lúc T6
  đóng (T8-136 chưa acquire; không có bản frozen lock nào
  trong `round136-t4/` hay `round136-t8/` — T4 dùng thẳng
  script repo, xem §11).
- Khoảng yên trước đợt: không có event lock nào từ
  03:58:03Z (t10-round135 release) tới 05:48:29Z (t4-136
  acquire) — 1h50'26" yên; yên lặng này là do đợt 135 đã
  đóng và đợt 136 mới mở — không phải do lock kẹt (bằng
  chứng: T4-136 acquire + release sạch ngay sau đó, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã được chứng minh trên lock thật (7 chu kỳ)

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 7 chu kỳ mới kể từ
  lúc T6-135 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED, file
  cooldown được ghi — xem §4):
  - t4-135 (02:50:57Z, hold 206 s), t8-135 ×4 (03:05–
    03:32Z, hold 901/130/232/69 s), t10-135 (03:56:20Z,
    hold 103 s) — 6 chu kỳ đợt 135 sau khi T6-135 đóng;
  - t4-136 (05:48:29Z, hold 218 s) — 1 chu kỳ đợt 136.
  - Bằng chứng phiên bản: T4-135/T8-135/T4-136 đều gọi
    thẳng script repo (`LOCKV2=.../vcut-vite-lock-v2.sh`,
    md5 `520b8baa`); T10-135 dùng bản frozen
    `round135-t10/vcut-vite-lock-v2.t10.sh`, md5
    `520b8baa` (dòng echo ở 432/434 — số dòng của bản
    mới, khác bản cũ 421/423). Tất cả đều chạy sau thời
    điểm T6-135 đổi script (phiên T6-135 02:40–02:49Z).
- **File `cooldown-t4` đã bị ghi đè 2 lần hợp lệ kể từ đợt
  135** (xem §4): mtime 23:53:53Z (17/11, ca F-134-T6-2)
  → 02:54:23Z (t4-135 release) → 05:52:07Z (t4-136
  release). File cooldown của ca cũ không còn tồn tại
  riêng — đã bị ghi đè bởi 2 lần release hợp lệ; bằng
  chứng duy nhất còn lại của ca cũ là dòng ACQUIRED 869
  trong log (giữ nguyên lịch sử, không sửa — xem §4).
  T6-135 §3.3 ghi "mtime 23:53:53Z không đổi" là đúng
  tại thời điểm T6-135 đóng; thay đổi sau đó là do
  release hợp lệ, không phải prune hay sửa log.

## 4. Nhất quán log lock: 906 dòng chính thức lúc mở → 909 lúc đóng, 263 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc mở
(05:40Z) và lúc đóng (05:53Z). Số chính thức đã loại 6
dòng repro lỗi của T6-132 (tA/tH 17:43:46Z, dòng 848–853
thô). 847 dòng đầu của bản đã lọc có md5 `9048174e…` —
khớp đúng snapshot đã lọc của T6-132/T6-133/T6-134/T6-135
(chuỗi không đứt). Diff bản đã lọc lúc đóng so với lúc
mở: **đúng +3 dòng append** (TICKET + ACQUIRED +
RELEASED của t4-136), không có dòng nào khác thay đổi.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-135 (886) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 278 | 271 | 187 | 181 |
| ACQUIRED | 269 | 262 | 187 | 181 |
| RELEASED | 263 | 256 | 185 | 179 |
| COOLDOWN | 84 | 82 | 76 | 71 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **909** | **886** | **636** | **613** |

- So với snapshot T6-135 đóng (886 dòng): **+23 dòng =
  TICKET +7 / ACQUIRED +7 / RELEASED +7 / COOLDOWN +2 /
  TIMEOUT +0 / STALE +0** — đúng bằng 7 chu kỳ mới: 6 chu
  kỳ đợt 135 sau khi T6-135 đóng (t4 ×1 hold 206 s;
  t8 ×4 hold 901/130/232/69 s — chu kỳ t8 thứ 2 và 3 có
  chờ cooldown 15–16 s, đúng cơ chế; t10 ×1 hold 103 s)
  = 20 dòng, + 1 chu kỳ t4-136 (hold 218 s) = 3 dòng.
  Mọi chu kỳ đều sạch, ghép cặp đủ — khớp từng con số,
  không có event nào mất dấu hay thêm lạ ngoài ca t4 cũ
  §3.
- Ghép cặp theo thread (`analyze-log.py` của T6-134):
  **263 cặp ACQUIRED→RELEASED; 0 "đang giữ" theo cách
  ghép tham lam của script** — nhưng đọc kỹ: chênh
  ACQUIRED − RELEASED = 6 = **5 ca double-acquire đã biết
  + 1 ca t4 mồ côi (dòng 869, ACQUIRED 23:50:17Z)**.
  Script ghép tham lam gán dòng RELEASED 02:54:23Z
  (hold 206 s) cho ACQUIRED 02:50:57Z — đúng, vì
  hold_s=206 khớp đúng khoảng 02:50:57Z→02:54:23Z —
  nên dòng 869 **vẫn là ACQUIRED duy nhất không có
  RELEASED thật của chính nó** (F-134-T6-2, §3); KHÔNG
  phải lock kẹt. 0 lần RELEASED không có ACQUIRED
  trước đó.
- 6 ca "double-acquire" trong output analyzer — **cùng
  đúng 6 ca đã biết** (5 ca cũ s3-round116, t3-round117,
  t4, t3-round119, t8-round129 dòng 781 + ca t4 dòng
  888/02:50:57Z — chính là lần acquire mới sau dòng mồ
  côi 869); tất cả giải thích được bằng STALE-LOCK cướp
  sau reboot (5 ca cũ) hoặc reboot-kill (ca t4);
  **không có ca mới nào**.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11) — đợt 120+ có **0 TIMEOUT**; 5 STALE-LOCK + 1
  STALE-TICKET cũ toàn bộ từ trước đợt 120 + **1
  STALE-LOCK 09:04:38Z 17/11 do reboot #75→#76 giữa
  lượt** (đợt 130).
- Cửa sổ R120: **187 = 187 T/A, RELEASED 185** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  278+269+263+84+8+6+1 = 909 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 135 khép lại sạch trên lock** (6 chu kỳ sau
  T6-135 đóng đều sạch — khớp recount T10-135: 886 + 20
  = 906 lúc T6-136 mở). **Đợt 136 tới lúc T6 đóng có 1
  chu kỳ, sạch** (t4 lượt yên #13 attempt1, hold 218 s,
  chạy trên thứ tự mới — §3).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 134 (toàn đợt), đợt 135 (toàn đợt) và đợt 136 (tới 05:54Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round134-t*/` + `round135-t*/` +
`round136-t*/` (tới 05:54Z) — theo quy tắc lăn: bỏ
round133, thêm round136. Tổng **18 dòng khớp chuẩn (đã
loại các dòng echo trong các file `khong-nha-grep*.txt`
của T6-133/134/135 — chỉ là tiếng vọng của các lần grep
trước), phân loại đủ 18/18 — tất cả đều là bản sao script
/ log repro / trích dẫn tài liệu, 0 sự kiện trên lock
thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round134-t10/vcut-vite-lock-v2.t10.sh` (dòng 421/423, bản cũ), `round135-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round134-t6/repro-newmsg.log` + `round135-t6/repro-newmsg.log` + `round136-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.3) |
| Trích dẫn trong tài liệu | 5 | `round134-t10/aggregate-draft.md` (1) + `round134-t10/PHASE9_ROUND134_LIMITS.closing-copy.md` (1) + `round135-t10/PHASE9_ROUND135_LIMITS.closing-copy.md` (1) + `round134-t6.done` (1) + `round135-t6.done` (1) — câu trích số liệu T6, không phải sự kiện |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 134 (toàn đợt) / 135 (toàn đợt) / 136 nào |
| Round136-t* (trừ repro /tmp của T6) | 0 dòng | T4-136 acquire/release sạch (§4); T8-136 chưa acquire; T1/T3/T9/T10-136 không dùng lock tới lúc đếm |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt
  134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  tới 05:54Z = 0.** Khớp với log pairing sạch ở §4
  (263 cặp + 1 ca reboot-kill cũ đã giải thích — không
  liên quan nhánh release).
- Giới hạn phạm vi: T8/T10-136 chưa chạy xong tới 05:54Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  136, T6 đợt 137 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-135 đếm 17 dòng (4 script + 9
  repro + 4 trích dẫn); đợt này bỏ round133 (−2 script
  −3 repro −1 trích dẫn = −6) nhưng thêm round135-t10
  script (2), round135-t10 closing-copy (1),
  round135-t6.done (1) và round136-t6 repro (3) = +7 →
  17 − 6 + 7 = **18 dòng** ✓. (Đính chính nhãn bảng
  đợt 135: trích dẫn thứ 4 của T6-135 là
  `round134-t6.done`, không phải `round134-t10.done` —
  xem F-136-T6-2, §12. Tổng 17 của đợt 135 không đổi.)

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#92? (`1ca1feaa…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round136-t6/test-v2-t6-run1.log` 05:45:58Z,
`test-v2-t6-run2.log` ~05:46Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười hai liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười hai lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ mười tám liên tiếp (T6 đợt
  120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 135 + T6 đợt
  136).

### 6.2 Repro message ĐÚNG (`round136-t6/repro-newmsg.log`, 05:46:29Z)

Copy verbatim script của T6-135, chỉ đổi tên TDIR
(`vcut-t6r135-repro` → `vcut-t6r136-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–135, kết quả giống hệt:
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
- **Bằng chứng đang ở /tmp, không phải lock thật:**
  status trong repro hiện `0 ticket + 1 cooldown` (sau A/B)
  rồi `0 ticket + 2 cooldown` (sau C) — trong khi lock thật
  lúc đó có 82 cooldown; log thật vẫn 912 dòng thô và
  queue vẫn 82 file sau khi repro xong; không có file
  `cooldown-tA/tH/tB` nào xuất hiện trong queue thật.
  **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (263 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất
  dấu khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy
  nhất do reboot giữa lượt (đợt 130), 0 sự kiện "KHÔNG
  NHẢ" trên lock thật đợt 120–135 (toàn đợt) và đợt 136
  (tới 05:54Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh cả
  hai lần), và thứ tự ghi mới đã có **7 chu kỳ thật**
  chứng minh (§3). **Không còn caveat nào về mất dòng
  RELEASED cho các chu kỳ mới** — caveat cũ chỉ còn là 1
  dòng lịch sử (t4, §3–§4).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 11 liên tiếp)

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
  - 05:50:15Z: quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — NHƯNG lúc này lock
    ĐANG GIỮ bởi t4 (attempt1 lượt yên #13, §2) nên theo
    điều (e) T6 **không thực thi thao tác xóa nào** ở thời
    điểm này (và cũng không có gì để xóa).
  - 05:54:11Z: lock TRỐNG trở lại (t4 đã nhả 05:52:07Z)
    — quét lại chính thức: **0 ứng viên**, tổng 82 file
    ≤ trần mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 136: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 11 liên tiếp prune xóa 0 file
    (đợt 126–136: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t4` mtime 05:52:07Z là **do
    release hợp lệ của t4-136 (§3–§4), KHÔNG phải do
    prune** (prune không tạo/cập nhật file, chỉ xóa). Số
    file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (05:40Z) **82 file / 1148 byte**;
  lúc đóng (05:53Z) **82 file / 1148 byte** (82 × 14 =
  1148 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 82 + 0 = 82 ✓. Chỉ 2 file mới so với lúc
  T6-135 đóng: `cooldown-t8-round135` và
  `cooldown-t10-round135` (đúng 2 chu kỳ mới của đợt 135
  có tên riêng; `cooldown-t4` ghi đè cùng tên nên tổng
  chỉ +2, không phải +3). Không file nào bị xóa hay thêm
  giữa hai lần đếm của đợt này.
- Phân tầng tuổi lúc 05:50Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 14 file** (giữ nguyên 14 như đợt 135);
  **≥48h (`-mtime +1`): 32 file** (giữ nguyên 32 như đợt
  135). File cũ nhất `cooldown-r4-round115`,
  mtime 2026-11-14T18:38:25Z — lúc 05:50Z mới **~83h12'
  tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#92; số tuyệt đối VẪN TẠM; khung chết #91? MỘT bản ghi + một bản hẹp

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1): khoảng
  **11:39:50Z → 23:45:17Z ngày 15/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn C). Parent
  đã **chấp nhận để mở** (QUYẾT PARENT 7 đợt 119) — T6
  KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #91? và #92?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 (mỗi boot liệt kê với boot_id + btime lấy từ
≥1 nguồn độc lập; btime→btime danh nghĩa = khoảng cách
giữa hai btime liên tiếp). Số thứ tự là số tạm theo thứ tự
thời gian (tất cả đều mang "?") — xem verdict §8.5.
**Định nghĩa đếm dùng: định nghĩa gộp của T10 (LIMITS gộp
đợt 133 §10.2) — mọi reboot quanh đợt, cả giữa lượt lẫn
ranh giới — theo quyết F-133-6.** Bảng dưới chỉ ghi 5
boot cuối (chuỗi đầy đủ #57→#87 xem T6-131 §8.2 +
T6-132 §8.2 + T6-133 §8.2 + T6-134 §8.2 + T6-135 §8.2 —
không chép lại để khỏi drift; T6 đợt này đã đối chiếu
lại với LIMITS gộp đợt 135: các boot #88?→#90? dưới đây
khớp đúng btime/boot_id T10-135 đã chốt, không có boot_id
lạ nào xuất hiện trong bất kỳ bằng chứng 18/11 nào ngoài
chuỗi này).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #88 | cc1f9de0 | 00:17:36Z 18/11 | ~3m46s (226 s, #87→#88 — SPAN) | T10-134/T5-134/T8-134 |
| #89 | 8ae55060 | 01:31:18Z 18/11 | 1h13m42s (4.422 s, #88→#89 — SPAN); sống tới 02:27:27Z | T10-134 (boot lúc đóng đợt 134) |
| #90 | 78b55838 | 02:27:27Z 18/11 | 56m09s (3.369 s, #89→#90 — SPAN); sống tới 03:35:20Z | T6-135 (brief + uptime/journal//proc/1) |
| #91 | bcc71e61 | 03:35:20Z 18/11 | 1h53m58s (6.838 s, #90→#91 — SPAN, xem §8.3); sống tới 05:29:18Z | T10-135 (t10-reboot1.md; LIMITS gộp §đầu) |
| #92 | 1ca1feaa | 05:29:18Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1) + T2-136 prereg |

- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #90?→#91? là sự kiện thứ 15** (giữa lượt đợt 135,
  sau khi T8 xong việc 03:32:23Z, trước khi T3 revert
  03:47Z — T10-135 chốt); **#91?→#92? là sự kiện thứ
  16** (ranh giới, sau khi đợt 135 đóng 04:10Z, trước khi
  đợt 136 mở 05:35Z). Không đợt nào từ 129 tới nay thiếu
  reboot.
- **Đính chính brief (không đánh số F — brief ghi "~" và
  "ứng viên"):** brief mở đợt 136 hỏi về "btime 05:29:34Z
  NẰM NGOÀI cửa sổ dự báo cho #91?" — nhưng btime
  ~05:29Z là của boot hiện tại **#92?**, không phải #91?;
  #91? bcc71e61 btime 03:35:20Z **NẰM TRONG** dải T2 dự
  báo cho nó [02:54:47Z, 04:53:38Z] (xem §8.4). Btime
  chuẩn của #92? là **05:29:18Z** (uptime -s); ~05:29:34Z
  là giờ `/proc/1` (+16 s, cùng mẫu các boot trước).
  T2-136 prereg-t2.md đã độc lập đi tới cùng kết luận
  (tính bằng code, trước khi đo) — hai luồng khớp nhau.
- **F-136-T6-1 — T1-135 viết sai nhãn boot (chỉ sai cách
  diễn đạt, xem §12):** T1-135 dòng 26 ghi "Boot hiện tại
  lúc kiểm: 8ae55060" cho phiên kiểm 02:40–02:54Z — sai
  với boot sống lúc đó (78b55838, T2-135 boot-verify.txt
  + journal xác nhận, xem §8.4). Không lặp lại ở đợt
  này: T6-136 ghi đúng boot sống 1ca1feaa.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#90: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 (không chép lại).
  - #91: MỘT khung + một bản hẹp (xem §8.3).

### 8.3 Khung chết #91? (bcc71e61) — MỘT bản ghi + một bản hẹp (không mâu thuẫn)

- **Khung chết #91?: (04:19:07Z, 05:29:18Z] (1h10m11s,
  4.211 s) — MỘT bản ghi chính, CÓ thể quy trách nhiệm.**
  Quan sát cuối là mtime file
  `docs/PHASE9_ROUND135_LIMITS.md` 04:19:07Z (LIMITS gộp
  đợt 135 viết lúc đóng, quy trách nhiệm được). Quét
  `find -newermt` trên toàn `hidden_files/` + `docs/` +
  `repo-1` (trừ node_modules) + `/tmp` cho khoảng
  (04:10:00Z, 05:29:18Z] chỉ trả thêm các mốc ≤04:19:07Z
  (`round135-t10.done` 04:12:25Z;
  `PHASE9_GAP_ANALYSIS.md` 04:11:11Z; closing-copy
  04:10:59Z + .sha256 04:10:22Z; t10-count-final
  04:10:22Z) — không có quan sát nào khác trong khoảng
  chết theo mtime. Tuổi thọ #91? theo khung này:
  **43m47"–1h53'58"** (btime 03:35:20Z → quan sát cuối
  04:19:07Z = 43'47"; danh nghĩa 1h53'58"). /tmp trống
  trong cửa sổ.
- **Bản hẹp hơn: (04:42:10Z, 05:29:18Z] (47m08s, 2.828 s),
  KHÔNG quy trách nhiệm được** — mtime file session jsonl
  `~/agents/agent-906cd2df-…/sessions/….jsonl` 04:42:10Z
  (runtime ghi session, không gắn được với luồng cụ thể;
  cùng mốc 04:42:10Z còn có `~/memory/2026-11-18.md` và
  `sessions.json` — đều là ghi hệ thống, không phải việc
  của luồng). Theo tiền lệ khung #82? (T6-133 §8.4 /
  T6-134 §8.3 / T6-135 §8.3), ghi cả hai bản ghi và
  **khung hẹp nhất làm chuẩn** — hai bản ghi này KHÔNG
  mâu thuẫn nhau (chỉ khác độ quy trách nhiệm), khác hẳn
  trường hợp #84? đợt 134 (khung rỗng do dị thường đồng
  hồ) nên tiền lệ "khung hẹp nhất làm chuẩn" áp được ở
  đây.
- **Gap #91?→#92? danh nghĩa (btime→btime) = 1h53'58"
  (6.838 s) — SPAN** (chưa chứng nhận; T2-136 kiểm mù
  #55, đoạn B). T2-136 prereg (tính bằng code): gap này
  **NẰM TRONG** dải từ #91? [04:02:41Z, 06:01:32Z] —
  sau cận dưới 5.197 s, trước cận trên 1.934 s → INSIDE
  (lần INSIDE thứ 4 liên tiếp sau cụm OUTSIDE #85?–#88?);
  chứng nhận dạng khoảng [6.828 s, 6.848 s] CHỈ NẾU đoạn
  B mù #55 đóng (merged) + đoạn C đóng bằng uptime — nếu
  B mở thì gap GIỮ SPAN, không ép chứng nhận.
- **Không có dị thường đồng hồ mới ở ranh giới này:**
  btime mới 05:29:18Z (uptime -s) khớp /proc/1 05:29:34Z
  (+16 s, cùng mẫu các boot trước) và journal first entry
  05:29:34Z; không có heartbeat/log nội dung nào vượt qua
  btime boot mới. Các quan sát cuối trên boot cũ đều
  ≤04:42:10Z < btime mới — khung chết không rỗng, không
  đảo ngược.

### 8.4 Đối chiếu mâu thuẫn boot đợt 135 (nhiệm vụ brief #4) — KẾT LUẬN: không có mâu thuẫn về boot sống; chỉ sai nhãn ở T1-135

- **Bằng chứng trực tiếp (đọc lại đợt này):**
  - `round135-t2/boot-verify.txt`: `78b55838-d09e-4cfc-
    b491-a15935b7a447`, journal `0 78b55838… Wed
    2026-11-18 02:27:38 UTC` — T2-135 đo lúc ~02:44Z.
  - `round135-t2/prereg-t2.md`: "#90? 78b55838 btime
    02:27:27Z (boot hiện tại"; probe #54 ok=2 fail=0,
    boot 78b55838.
  - `round135-t2/status2.txt`: heartbeat n=54,
    ts=02:45:23Z, boot=78b55838.
  - T6-135 §0: boot lúc mở/đóng 78b55838, btime 02:27:27Z
    (uptime -s + /proc/1 + journal khớp nhau).
  - Parent đo lúc mở đợt 135: **78b55838** — khớp tất cả.
- **Phía T1-135:** `PHASE9_ROUND135_T1_VERIFY134_LIMITS.md`
  dòng 26: "Boot hiện tại lúc kiểm: **8ae55060**, thời gian
  kiểm: 02:40–02:54Z". Nhưng nội dung T1 kiểm là **bằng
  chứng của đợt 134** — suite 01:44:12–01:48:07Z và O8
  01:57:43–01:59:31Z, cả hai đều chạy trên boot 8ae55060
  (dòng 166/170/322–323 của chính file T1) — tức 8ae55060
  là boot CỦA BẰNG CHỨNG ĐANG KIỂM, không phải boot sống
  lúc T1 chạy (02:40–02:54Z, boot sống là 78b55838 từ
  02:27:27Z). T1 viết nhầm nhãn phạm vi: "boot hiện tại
  lúc kiểm" thay vì "boot của bằng chứng đang kiểm".
- **Kết luận:** không có hai boot sống cùng lúc, không có
  reboot nào bị bỏ sót giữa 02:27Z và 02:54Z; parent đo
  đúng; T2-135 đo đúng; T1 kiểm đúng nội dung nhưng **sai
  nhãn** (F-136-T6-1, §12 — chỉ sai cách diễn đạt, không
  đổi verdict verify nào của T1; LIMITS gộp đợt 135 không
  lặp lại nhãn sai này, mà ghi đúng 78b55838 cho đợt 135).

### 8.5 Reboot #91?→#92? — không mất việc của luồng nào; T6 không bị cắt

- Reboot bcc71e61 → 1ca1feaa (btime 05:29:18Z) xảy ra sau
  khi đợt 135 đóng (04:10Z) và trước khi đợt 136 mở
  (05:35Z) — **không giết attempt hay holder lock nào**
  (lock đã trống từ 03:58:03Z, §2; đợt 135 đã đóng sổ).
- **Không luồng đợt 136 nào mất việc:** T6 mở 05:40:51Z
  và đóng 05:53:22Z toàn bộ trên boot mới, không bị reboot
  cắt (uptime liền mạch 11' → 24'); các cờ `.done` đợt
  136 xuất hiện trên boot mới.
- **Replay apt sau boot #92?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-136 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới. Lưu ý
  từ T2-136 prereg: `dpkg.log` của boot #91? (bcc71e61)
  đã MẤT theo reboot #92? (`/var/log` reset mỗi boot) —
  bracket #91? chỉ còn trong hồ sơ T10-135 nếu có.

### 8.6 VERDICT: chuỗi tương đối CHỐT #57→#92 — số tuyệt đối VẪN TẠM (giữ "?")

- **CHỐT ĐƯỢC — chuỗi tương đối:** 32 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #92 (05:29:18Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→#76→#77→#78
  →#79→#80→#81→#82→#83→#84→#85→#86→#87→#88→#89→#90
  →#91→#92 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 +
  T6 + T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Bốn lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-136 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #91?→#92? lần này KHÔNG
    có dị thường — §8.3 — nhưng một lần sạch không xóa
    tiền lệ.)
- **Kết luận cho parent:** T6-136 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#91? giữa lượt đợt 135,
  #92? ranh giới); số thứ tự tuyệt đối **vẫn TẠM** và
  phải giữ "?" cho tới khi có bằng chứng ngoài VM. Không
  bịa số, không bỏ "?" khi chưa đủ bằng chứng — đúng như
  brief giao.
- Hệ quả thực hành: T9-136 gọi boot lúc mở là "#92?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #16 cho reboot này — là sự kiện RANH GIỚI,
  không phải giữa lượt). Các quyết parent trước vẫn đứng:
  không quyết con số tuyệt đối nào ở đây.

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **05:40:51Z** (boot #92? đã 11'33"
  tuổi); đóng **05:53:22Z** (boot #92? đã ~24' tuổi).
  Đợt 136 mở **05:35:51Z** (round-in-progress.md, mtime
  05:36) — tức **393 s sau btime boot #92? (05:29:18Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s) và tái diễn đợt 135 (lần thứ 6 liên
  tiếp, +36 s sau btime 03:35:20Z — T10-135 §10.2).
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-136 là
  chủ quản kiểm slot/started_at. Ghi nhận để T7/T10 đối
  chiếu: đợt 136 mở 393 s sau btime #92? — nếu dị thường
  tái diễn thì so với mẫu đợt 134/135 (started_at = btime
  + ~40 s) sẽ thấy started_at lượt này rơi vào khoảng
  05:29:58Z, tức TRƯỚC khi đợt mở 05:35:51Z; nguyên nhân
  vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 1 socket sót X193 (T4 attempt1) — KHÔNG xóa vì T4 còn làm việc

- **Lúc mở (05:40Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy (`pgrep -x Xvfb` rc=1; quét `/proc/*/cmdline`
  không có process nào tên Xvfb).
- **Lúc đóng (05:53Z): 0 Xvfb đang chạy** (pgrep rc=1),
  nhưng `/tmp/.X11-unix/` có **1 socket sót: `X193`,
  mtime 05:48** — tạo trong lúc T4-136 chạy attempt1
  lượt yên #13 (WebKit harness). Không có process Xvfb
  nào sở hữu socket này nữa (attempt1 xong 05:52:07Z).
- **T6 KHÔNG xóa socket này:** T4-136 vẫn đang làm việc
  lúc T6 đóng (chain-t4.log cập nhật 05:52, các script
  chờ của T3/T8 vẫn chạy) và có thể mở attempt tiếp theo
  dùng lại display :193 — xóa socket của luồng khác giữa
  đợt có thể làm hỏng lần chạy sau của họ (tiền lệ
  T10-134 dọn X193/194/195 là dọn lúc ĐÓNG ĐỢT, khi
  không còn luồng nào dùng). Ghi nhận để **T10 dọn lúc
  đóng đợt 136 nếu socket vẫn sót** khi đó.
- **Không kill process nào** trong phiên này (không có
  Xvfb sót để kill; T6 không đụng process luồng khác theo
  nhiệm vụ).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-136).

## 11. Tuân thủ lock của luồng đo đợt 136 ĐÃ kiểm được

- **T4-136 acquire + release sạch** (05:48:29Z →
  05:52:07Z, hold 218 s, port 5187, ticket khớp log —
  §2/§4). T4 gọi thẳng script repo
  (`run-attempt-136.sh` dòng 13:
  `LOCKV2=~/workspace/repo-1/apps/web/scripts/
  vcut-vite-lock-v2.sh`, md5 `520b8baa`) — tức chạy trên
  **thứ tự ghi mới** (§3). Đây là chu kỳ đầu tiên của
  đợt 136 và là chu kỳ thứ 7 liên tiếp sạch trên thứ tự
  mới.
- **T8-136 chưa acquire** tới lúc T6 đóng (§2) — chưa có
  gì để kiểm tuân thủ. Khi họ acquire, họ sẽ dùng bản
  script `520b8baa`; T6 đợt 137 kiểm tuân thủ + đếm chu
  kỳ mới.
- **Tuân thủ Xvfb luật đứng của đợt 136: CHƯA CÓ bằng chứng
  mới** (T4-136 chạy harness WebKit — socket X193 sót,
  §10; T8-136 chưa chạy tới lúc T6 đóng).

## 12. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#92?) VẪN TẠM (xem §8.6):** chuỗi
  tương đối #57→#92 đã chốt (32 boot); số tuyệt đối giữ
  "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa
  6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134). Journal/wtmp chỉ giữ boot hiện tại
  (journal `--list-boots` chỉ 1 dòng 1ca1feaa; wtmp bắt
  đầu 05:29:xxZ) nên T6 suy ra số hiệu từ thứ tự thời gian
  + hồ sơ các đợt trước, không phải từ log hệ thống.
- **F-136-T6-1 — T1-135 sai nhãn boot (chỉ sai cách diễn
  đạt, không đổi verdict):** file
  `PHASE9_ROUND135_T1_VERIFY134_LIMITS.md` dòng 26 ghi
  "Boot hiện tại lúc kiểm: 8ae55060" cho phiên kiểm
  02:40–02:54Z 18/11 — sai với boot sống lúc đó
  (78b55838, btime 02:27:27Z; bằng chứng: T2-135
  boot-verify.txt + journal + T6-135 §0 + parent đo lúc
  mở). 8ae55060 là boot của BẰNG CHỨNG đợt 134 mà T1
  đang kiểm (suite/O8 01:44–01:59Z), không phải boot sống
  lúc kiểm. Nội dung verify của T1 đúng; LIMITS gộp đợt
  135 không lặp lại nhãn sai. Ghi nhận để T1 các đợt sau
  phân biệt "boot sống lúc kiểm" với "boot của bằng chứng
  đang kiểm". Đây là kết luận của nhiệm vụ brief #4 (§8.4).
- **F-136-T6-2 — T6-135 §5 ghi sai tên file trích dẫn:**
  bảng §5 đợt 135 ghi trích dẫn thứ 4 là
  "`round134-t10.done` (1)" — sai; bằng chứng trong
  chính file `round135-t6/khong-nha-grep.txt` của T6-135
  cho thấy dòng đó là `round134-t6.done:4` ("KHÔNG NHẢ"
  trên lock thật: 0; ...). Đối chiếu trực tiếp đợt này:
  `round134-t10.done` có **0** dòng khớp mẫu (grep -c =
  0; chữ "NHA" duy nhất trong file là từ "CHAP NHAN"),
  còn `round134-t6.done` có 1 dòng khớp. **Tổng 17 dòng
  của đợt 135 KHÔNG đổi** (4 script + 9 repro + 4 trích
  dẫn = 17, đã đếm lại từ file grep gốc) — chỉ sai nhãn
  tên file trong bảng. T6-136 đã sửa nhãn đúng trong
  bảng §5 đợt này (trích dẫn = 5, gồm cả 2 file .done).
- **F-135-T2-1 (ghi nhận, thuộc T2 — T2-136 tự ghi trong
  prereg):** dải T2-135 công bố cho #91? [02:54:47Z,
  04:53:38Z] lệch 1 s so với dải tính bằng code
  [02:54:48Z, 04:53:39Z] (cắt float); cả hai bản đều chứa
  03:35:20Z nên verdict INSIDE không đổi.
- **Đính chính brief mở đợt (không đánh số F):** boot mới
  là #92? (không phải #91?), btime chuẩn 05:29:18Z (không
  phải ~05:29:34Z — đó là giờ `/proc/1`); xem §8.2.
  Brief ghi "~" và "ứng viên" nên đây là số ước lượng lúc
  mở, không phải sai số đo.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở + mù #53 B recheck (T2-136)
  + mù #55 mới mở (T2-136); mù #52 đã đóng hoàn toàn
  (T2-133); mù #54 đã đóng hoàn toàn (T2-135).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  hai liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
  gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không tự
  đổi test.
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round134-t*/` (toàn đợt) +
  `round135-t*/` (toàn đợt) + `round136-t*/` tới 05:54Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T8/T10-136 chưa chạy xong tới thời điểm đếm; T6
  đợt 137 đếm tiếp.
- **Prune cooldown lần 11 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 82 ≤ trần 100 lúc chạy). Lần
  quét đầu (05:50Z) gặp lock đang giữ nên không thực thi
  thao tác xóa theo điều (e); quét lại chính thức lúc lock
  trống (05:54Z) vẫn 0 ứng viên. File cũ nhất đủ 7 ngày
  theo đồng hồ tường ~21/11 18:38Z, theo `find` ~22/11
  18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 135 khép sạch trên lock (§4):** 6 chu kỳ sau
  T6-135 đóng (t4 ×1 + t8 ×4 + t10 ×1) đều sạch — T6 mở
  đợt 136 đếm lại khớp đúng recount T10-135; **đợt 136
  tới 05:54Z có 1 chu kỳ, sạch** (t4 lượt yên #13
  attempt1, hold 218 s). Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 05:53Z (trống, 0 ticket + 82 cooldown); đợt
  còn chạy tới ~08:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–135 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 7 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Socket X193 sót (§10):** T6 không xóa vì T4-136 còn
  làm việc; T10 dọn lúc đóng đợt nếu vẫn sót.
- **Replay apt #92? chưa có verdict** (thuộc T5-136 — xem
  §8.5).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned"). Thư mục cut-sim /tmp của T6-135
  (`/tmp/vcut-t6r135-cut-*`) vẫn còn trên đĩa lúc T6-136
  đóng (chỉ dùng cho kiểm chứng, không phải lock thật);
  T6 đợt sau có thể xóa.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND136_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm; 6
dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt —
số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t4` mtime 05:52:07Z do release hợp
lệ của t4-136 — xem §3), Xvfb (0 process; 1 socket sót
X193 chưa dọn — xem §10).
Stage: `repo-1-push/paths-loop/phase9-round136-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round136-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-906.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-909-close.log, analyze-log.py,
cooldown-now.txt, cooldown-prev-names.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg.log).

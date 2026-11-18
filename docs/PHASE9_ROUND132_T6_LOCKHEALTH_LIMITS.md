# PHASE9 ROUND132 T6 — Sức khỏe lock v2 + prune cooldown lần 7 + CHỐT SỐ BOOT #79?/#80?/#81? (chuỗi tương đối CHỐT #57→#81, số tuyệt đối VẪN TẠM) — LIMITS

- Đợt: 132, luồng T6 (sức khỏe lock v2 + prune cooldown + chốt số
  boot + mù #37).
  Lượt cron 00:35 +07 18/11/2026. Chạy 17:40–17:47Z 17/11/2026
  (00:40–00:47 +07 18/11).
- Nhiệm vụ: kiểm lock vite sau boot mới #81? theo đúng phương pháp
  chính thức; prune cooldown lần 7 theo luật đã phê duyệt; ĐẾM LẠI
  toàn bộ chuỗi boot từ mù #37 và chốt số thứ tự cho #79?/#80?/boot
  mới (quyết parent LIMITS gộp đợt 131 §12.3(h)); ghi rõ trạng thái
  mù #37 (ngày đúng 15/11 — F-131-T6-1) + verdict mù #51 đoạn B
  của T2 đợt 132. KHÔNG sửa logic lock, KHÔNG sửa script lock,
  KHÔNG đụng production. Mọi thí nghiệm acquire/release đúng ra
  phải dùng lock dir /tmp riêng; lock thật chỉ đọc qua `status` —
  ngoại trừ thao tác prune file cooldown đã phê duyệt và 1 sự cố
  repro ghi nhầm vào lock thật (xem F-132-T6-1 §6 — đã khắc phục
  và ghi rõ).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round132-t6/` (analyze-log.py,
  analyze-log-final.txt, analyze-log-cleaned.txt,
  analyze-log-raw-853.txt, vite-lock-v2-cleaned-847.log,
  new-lines-since-833.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
  ps-full-2.txt, ps-full-3.txt, ss-1.txt, ss-2.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg.sh (BẢN LỖI — xem §6),
  repro-newmsg-fixed.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT MỚI #81? (số tạm, xem §8)

- **Boot mới: boot_id `b379ecd7-311c-4053-a43f-507d21432ecc`,
  btime 17:24:08Z** (`uptime -s` = 17:24:08Z, `who -b` =
  Nov 17 17:24, `/proc/1` 17:24:18Z — chênh +10 s, cùng mẫu
  các boot trước). Uptime ~16' lúc T6 bắt đầu (17:40Z).
- Khớp brief mở đợt 132 + round-in-progress.md + T9-132
  (cả ba đều ghi cùng boot_id + btime). Đây là **reboot thứ
  5 liên tiếp quanh ranh giới đợt** (#79?→#80? 15:01:30Z,
  rồi #80?→#81? 17:24:08Z).
- Boot #80? (ad1327ef, btime 15:01:30Z) chết trong khoảng
  **(16:10:55Z, 17:24:08Z]** — hẹp hơn khung brief
  (16:07Z, 17:24:08Z]; xem §8.4: quan sát cuối trên #80?
  là mtime LIMITS gộp đợt 131, 16:10:55Z (parent thêm
  §12.3 sau khi đóng).
- md5 khớp baseline đợt 120–131: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 132 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round132-t1, round132-t9; round132-t2 mới xuất
  hiện lúc 17:44Z, còn TRỐNG lúc T6 đóng — xem §8.3(c)).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:40Z,
  17:43Z và 17:45Z (3 snapshot `ps-full-1/2/3.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT
  (không dùng `grep ' Z '` thô — bẫy đợt 131 §1):
  **0 zombie** ở cả 3 snapshot.
- `ss -tlnp`: lúc 17:40Z và 17:45Z **không có cổng TCP nào
  đang lắng nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở snapshot
  3 (17:45Z, sau khi suite của T6 đã xong). Snapshot 2
  (17:43Z) chỉ thấy chính suite của T6 đang chạy
  (`run-attempt tH 5995` trên lock dir /tmp + test script)
  — không phải tiến trình đợt 132.
- **Không có event lock nào của đợt 132 tới lúc đóng**
  (log dừng ở t10-round131 15:59:48Z — xem §3): T4-132
  (lượt yên #10, gate POSTBOOT_PASS boot mới) + T8-132 +
  T10-132 chưa tới lượt dùng lock. T6 đợt 133 kiểm tiếp.

## 2. Lock sau boot mới #81?: TRỐNG lúc mở và lúc đóng; holder cuối đợt 131 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 17:40Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale.
- Lý do không có stale: sự kiện lock cuối cùng của đợt 131,
  `t10-round131` RELEASED hold 118s lúc **15:59:48Z**, tức
  **1h24'20" TRƯỚC boot mới (17:24:08Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như các boot #60/#62/#64/#66/#68/#71/#72/
  #74/#75/#76/#77/#78/#79 ở các đợt trước).
- `status` lúc 17:40Z và lúc đóng 17:45Z: `TRỐNG (không có
  lock)`, `0 ticket + 75 cooldown`, rc=0 — khớp cả hai lần.
- Khoảng yên: **không có event lock nào từ 15:59:48Z
  (t10-round131 release) tới lúc đóng 17:45:49Z** — 1h46'
  yên, bao gồm ~21' đầu sau boot mới. Yên lặng này là do
  đợt 131 đã đóng và các luồng đợt 132 chưa tới lượt dùng
  lock — không phải do lock kẹt (bằng chứng: suite /tmp §6
  chạy xanh trên bản script hiện hành).

## 3. Đóng nợ T6-131: 4 chu kỳ mới sau snapshot 833 dòng — TẤT CẢ nhả sạch, round 131 khép sạch trên lock

Từ sau snapshot T6 đợt 131 (833 dòng lúc ~15:10Z 17/11) tới
nay (847 dòng chính thức lúc 17:45Z — xem §4 về 6 dòng
repro lỗi F-132-T6-1): **+14 dòng = TICKET +4 / ACQUIRED +4
/ RELEASED +4 / COOLDOWN +2 / TIMEOUT +0 / STALE-LOCK +0 /
STALE-TICKET +0.** Khớp từng con số, không có event nào mất
dấu hay thêm lạ. (Chi tiết từng dòng trong
`round132-t6/new-lines-since-833.txt`.)

- **`t8-round131` (T8 chạy lại, đợt 131): 3 chu kỳ sạch** —
  15:35:56–15:37:10Z hold 74s (cổng 5390, wait 0s);
  15:37:25–15:39:39Z hold 134s (cổng 5490, wait 15s);
  15:39:54–15:43:51Z hold 237s (cổng 5490, wait 15s).
  Đây là 3 harness chạy lại sau cờ POSTBOOT_PASS mới
  (84l10 / 85m4-hb128 / 86n2, exit 0 — LIMITS gộp đợt 131
  §10.1). +2 COOLDOWN, tái dùng file `cooldown-t8-
  round131` nên +0 file net.
- **`t10-round131`: 1 chu kỳ sạch** (15:57:50–15:59:48Z),
  hold 118s, cổng 5554, wait 0s — đóng đợt (suite 27/27 +
  O8 Chromium 21/21 + WebKit 21/21). +1 file
  `cooldown-t10-round131`.
- **Round 131 khép lại sạch trên lock: 8 chu kỳ của chính
  luồng đợt 131 sau snapshot T6-131 (t8×3 + t10×1, cộng
  t4×1 + t8×3 đã đếm ở T6-131 §3) đều TICKET = ACQUIRED =
  RELEASED, 0 TIMEOUT, 0 STALE-LOCK.** Ca acquire mất theo
  reboot duy nhất của cửa sổ này vẫn là của đợt 129
  (t8-round129, đã có STALE-LOCK dọn đúng luật — T6-130
  §3); không có ca mới nào trong đợt 130 hay 131.
- Các luồng đợt 131 còn lại (t1/t2/t3/t5/t5b/t6/t7/t9) không
  có event lock thật nào trong cả đợt — tức không dùng lock
  thật (không phải vi phạm, chỉ là không dùng).
- T4-131 không có chu kỳ nào thêm sau attempt1 lượt yên #9
  (14:52:24–14:55:53Z, đã đếm ở T6-131 §3) — attempt1 đóng
  lượt ngay, đúng như LIMITS gộp đợt 131.

## 4. Nhất quán log lock: 847 dòng chính thức, 245/245 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~17:45Z
(14/11 18:01:32Z → 17/11 15:59:48Z; script ghép cặp
`round132-t6/analyze-log.py` — tái dùng từ round130/131):

| Sự kiện | Tổng chính thức | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 259 | 168 | 162 |
| ACQUIRED | 250 | 168 | 162 |
| RELEASED | 245 | 167 | 161 |
| COOLDOWN | 78 | 70 | 65 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 6 | **1** | 1 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **847** | **574** | **551** |

- So với snapshot T6 đợt 131 (833 dòng lúc ~15:10Z 17/11):
  +14 dòng, đúng bằng TICKET +4 / ACQUIRED +4 / RELEASED
  +4 / COOLDOWN +2 / TIMEOUT +0 / STALE-LOCK +0 — khớp
  từng con số, không có event nào mất dấu hay thêm lạ.
  (Lưu ý đếm: `grep -c TICKET` thô đếm 260 vì khớp cả
  dòng STALE-TICKET; số chính thức 259 dùng khớp từ chính
  xác như script analyze-log.py.)
- Ghép cặp theo thread: **245 cặp ACQUIRED→RELEASED, 0 lock
  đang giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước
  đó.** Chênh ACQUIRED − RELEASED = 5, đúng bằng 5 ca
  "double-acquire" — không có lock nào mất dấu.
- 5 ca "double-acquire" — **cùng đúng 5 ca T6 đợt 131 đã
  liệt kê** (s3-round116, t3-round117, t4, t3-round119,
  t8-round129 dòng 781), tất cả giải thích được bằng
  STALE-LOCK cướp sau reboot; **không có ca mới nào**.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũ toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11) + **1 STALE-LOCK 09:04:38Z
  17/11 do reboot #75→#76 giữa lượt** (§3 đợt 130).
- Round 120/121/122/123/124/125/126/127/128/129/130/131
  khép lại sạch trên lock (đợt 129 với caveat 1 acquire mất
  theo reboot đã dọn đúng luật — T6-130 §3; đợt 130 và 131
  sạch hẳn — xem §3 trên). Cửa sổ R120: **168 = 168 T/A,
  RELEASED 167** (chênh 1 đúng bằng ca reboot-kill), 0
  TIMEOUT, STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  259+250+245+78+8+6+1 = 847 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**
  trong log. **0 dòng chứa DEFER / KILLED / ERROR** trong
  toàn log (grep -i).
- **Về 6 dòng repro lỗi (F-132-T6-1, §6):** file log thật
  hiện có **853 dòng** (6 dòng tA/tH lúc 17:43:46Z do repro
  lỗi của T6 ghi vào). Số liệu bảng trên là số **chính
  thức, đã loại 6 dòng đó** (bản sao đã lọc
  `vite-lock-v2-cleaned-847.log`, 847 dòng; phân tích
  `analyze-log-cleaned.txt`). Bản phân tích thô trên file
  853 dòng (`analyze-log-raw-853.txt`) cũng được lưu để
  đối chiếu: TICKET 261 / ACQUIRED 252 / RELEASED 247 /
  tổng 853 — chênh đúng +2/+2/+2, cặp 247, vẫn 0 đang giữ,
  0 mất dấu. **T6 đợt 133 dùng số chính thức 847 làm
  snapshot; 6 dòng tA/tH dòng 848–853 là của T6-132, không
  phải của luồng sản xuất.**

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 130 (toàn đợt), đợt 131 (toàn đợt) và đợt 132 (tới 17:45Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round130-t*/` + `round131-t*/` + `round132-t*/`
(tới 17:45Z) — theo quy tắc lăn: bỏ round129 (T6-131 đã
đóng toàn đợt 129), thêm round132. Tổng **8 dòng khớp,
phân loại đủ 8/8 — tất cả đều là bản sao script, 0 sự kiện
trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 8 | 4 file × 2 dòng: `round130-t4/vcut-vite-lock-v2.frozen.sh`, `round130-t10/vcut-vite-lock-v2.t10.sh`, `round131-t4/vcut-vite-lock-v2.frozen.sh`, `round131-t10/vcut-vite-lock-v2.t10.sh` — mỗi file 2 dòng `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| File grep-output của chính T6 | 0 | T6 loại `khong-nha-grep.txt` và `repro-newmsg.log` khỏi grep ngay từ đầu (như T6 đợt 123–131 đã loại `khong-nha-grep`); file `khong-nha-grep.txt` của T6 đợt này (8 dòng, toàn bản sao script) sẽ bị grep đợt sau khớp lại — T6 đợt 133 tiếp tục loại `khong-nha-grep` |
| Tái hiện có kiểm soát trên /tmp | 0 trong đếm này | `round132-t6/repro-newmsg.log` đã loại khỏi grep; repro đúng (bản fixed) có đúng 2 dòng `BỎ QUA` + 1 dòng `KHÔNG NHẢ` có kiểm soát (xem §6) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 130 (toàn đợt) / 131 (toàn đợt) / 132 nào |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn đợt),
  đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt), đợt 132
  tới 17:45Z = 0.** Khớp với log pairing sạch ở §4
  (245/245 cặp, 0 TIMEOUT, STALE-LOCK mới duy nhất do
  reboot — không liên quan nhánh release).
- Giới hạn phạm vi: các luồng đợt 132 vẫn đang chạy, log của
  chúng có thể tăng sau 17:45Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 132, T6 đợt 133 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý: phạm vi đợt này bỏ round129 (T6-131 đã đóng toàn
  đợt 129); số dòng giảm 10 → 8 đúng bằng 1 bản sao script
  của round129-t4/t10 bị loại khỏi phạm vi (2 file × 2 dòng
  = 4 dòng — 10 − 4 = 6? — xem ghi chú). Thực tế: T6-131
  đếm 10 dòng trên 5 file (round129-t4, round129-t10,
  round130-t4, round130-t10, round131-t4) — round131-t10
  chưa có bản sao lúc đó. Đợt này có 8 dòng trên 4 file
  (round130-t4/t10, round131-t4/t10): bỏ round129 (−4 dòng)
  nhưng thêm round131-t10 (+2 dòng) → 10 − 4 + 2 = 8 ✓.
  Số học khớp.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message đều xanh — VÀ 1 SỰ CỐ REPRO CỦA CHÍNH T6 (F-132-T6-1)

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật — ngoại trừ sự cố dưới đây. Boot ghi
trong status repro: boot mới #81? (`b379ecd7…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round132-t6/test-v2-t6-run1.log` 17:42:59Z,
  `test-v2-t6-run2.log` 17:43:21Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ tám liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127, 128, 129, 130,
    131 cũng vậy). Tính flaky của T7 (T9 đợt 119 §1.2) vẫn
    được ghi nhận là bản chất — tám lần xanh kép không xóa
    nó; quyết tách T7 khỏi gate 9/9 khi đợt đông vẫn thuộc
    về parent; T6 không tự đổi test.
  - Kết luận suite: xanh lần thứ mười bốn liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128 + T6 đợt 129 + T6 đợt 130 + T6 đợt
    131 + T6 đợt 132).
- **F-132-T6-1 (MỚI — lỗi của chính T6 đợt này, đã khắc phục
  và ghi rõ): lần chạy repro ĐẦU TIÊN dùng sai biến môi
  trường.** Script `round132-t6/repro-newmsg.sh` (T6 viết
  mới) export `VCUT_VITE_LOCK_DIR=/tmp/...` — biến này
  **script v2 KHÔNG đọc** (grep v2: không có chuỗi
  `VCUT_VITE_LOCK_DIR` hay `LOCK_DIR=` nào khớp). Biến đúng
  là `VITE_LOCK_DIR` / `VITE_LOCK_QUEUE_DIR` /
  `VITE_LOCK_LOG` (như script repro của T6-131). Hậu quả:
  cả 3 thí nghiệm A/B/C chạy trên **lock thật** lúc
  17:43:46Z — 6 dòng ghi vào log thật (tA TICKET/ACQUIRED/
  RELEASED + tH TICKET/ACQUIRED/RELEASED, dòng 848–853)
  và 2 file cooldown thật (`cooldown-tA`, `cooldown-tH`).
  Không có luồng nào khác đang dùng lock lúc đó (lock
  TRỐNG trước/sau; T4/T8/T10-132 chưa chạy) nên không ảnh
  hưởng luồng nào; cả 2 chu kỳ test đều acquire/release
  sạch (hold 0s), guard hoạt động đúng (BỎ QUA / KHÔNG
  NHẢ in đúng như kỳ vọng — đó cũng là bằng chứng live
  rằng guard còn nguyên, dù không phải bằng chứng /tmp).
  - **Khắc phục:** (1) Xóa 2 file cooldown test
    (`cooldown-tA`, `cooldown-tH`) — queue về đúng 75 file
    / 1050 B như trước repro (§7). (2) KHÔNG sửa log thật
    (append-only; sửa lịch sử còn tệ hơn để lại) — 6 dòng
    được ghi rõ ở đây + §4, loại khỏi mọi số đếm chính
    thức; bản sao đã lọc + cả hai bản phân tích đều lưu
    trong `round132-t6/`. (3) Chạy lại repro ĐÚNG bằng
    script của T6-131 (copy verbatim, chỉ đổi tên TDIR):
    `repro-newmsg-fixed.sh` → `repro-newmsg.log`, xem dưới.
  - Bài học cho T6 sau: **không viết lại script repro từ
    đầu — copy script repro của đợt trước rồi chỉ đổi tên
    TDIR**; kiểm tra `status` sau acquire đầu tiên: nếu
    số cooldown hiện số thật (~75) thay vì 1–2 thì DỪNG
    ngay (đang ở lock thật).
- **Tái hiện message ĐÚNG (`round132-t6/repro-newmsg.log`,
  17:45:03–04Z, bản fixed)** — cùng 3 thí nghiệm A/B/C như
  T9 đợt 120 và T6 đợt 121–131, kết quả giống hệt:
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
  - Log thật KHÔNG đổi sau bản fixed (vẫn 853 dòng gồm 6
    dòng lỗi; queue vẫn 75 file) — xác nhận bản fixed chạy
    đúng trên /tmp.
- Bằng chứng lock thật đang chạy tốt trên bản `cd0c05c1`:
  **4/4 chu kỳ acquire/release thật sau snapshot T6 đợt 131
  đều sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua boot #80?
  và trống sạch sang boot mới #81?.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #81?,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (245/245
  cặp + 0 đang giữ, 0 mất dấu — số chính thức đã loại 6
  dòng repro lỗi), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới
  duy nhất do reboot giữa lượt (đã dọn đúng luật, đợt 130),
  0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120–131 (toàn
  đợt) và đợt 132 (tới 17:45Z), suite 9/9 độc lập ×2 lần
  chạy (T7 xanh cả hai lần), và holder live cuối đợt 131
  đã nhả sạch trước reboot.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 7 liên tiếp)

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
  - 17:42Z: lock TRỐNG (`status` 0 ticket + 75 cooldown,
    rc=0) — đủ điều kiện (e). Quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng). Tổng 75 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 132: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày theo đồng hồ tường vào khoảng
    **21/11 18:38Z**; theo phương pháp `find -mtime +7`
    (≥192h) sẽ khớp ứng viên vào khoảng **22/11 18:38Z**.
    T6 các đợt sau đếm tiếp. Đây là lần thứ 7 liên tiếp
    prune xóa 0 file (đợt 126: 0; đợt 127: 0; đợt 128: 0;
    đợt 129: 0; đợt 130: 0; đợt 131: 0; đợt 132: 0).
  - Lưu ý: 2 file `cooldown-tA`/`cooldown-tH` bị xóa ở §6
    là **dọn sự cố repro của T6, KHÔNG phải prune theo
    luật** (chúng mới 17:43Z, <48h, không đủ điều kiện
    prune; việc xóa chúng chỉ khôi phục trạng thái queue
    trước repro lỗi). Số file prune = 0, không tính 2 file
    này.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc đóng (17:45Z) **75 file / 1050 byte**
  (khớp cả ba cách đếm độc lập: `find` 75, `ls` 75, `status`
  "75 cooldown"; 75 × 14 = 1050 khớp; tổng kích thước file
  đo trực tiếp cũng 1050 B) — khớp đúng số chính thức T10
  đếm lúc đóng đợt 131 (75/1050), tức **0 file cooldown mới
  từ lúc đóng đợt 131 tới lúc T6 đóng** (ngoại trừ 2 file
  test của T6 đã xóa — xem §6). Không file nào bị xóa giữa
  hai lần đếm.
- Phân tầng tuổi lúc 17:42Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 0 file; ≥48h (`-mtime +1`): 27 file**
  (giữ nguyên 27 như đợt 131 — không file nào vượt 72h
  thêm vì mới trôi ~3h). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 17:45Z mới **~71h07' tuổi**.

## 8. CHỐT SỐ BOOT — đếm lại toàn bộ chuỗi từ mù #37 (quyết parent đợt 130 §12.3(h) + đợt 131 §12.3(h))

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NHẮC LẠI ĐÍNH CHÍNH NGÀY (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1): khoảng
  **11:39:50Z → 23:45:17Z ngày 15/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn C). Parent đã
  **chấp nhận để mở** (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG
  thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- **Nhắc lại F-131-T6-1 (đính chính ngày — nội dung khoảng mù
  không đổi): khoảng mù #37 là 15/11 11:39:50Z →
  23:45:17Z, KHÔNG phải 16/11.** Nguồn gốc (T6-119): probe
  #37 lúc 11:39:50Z, probe #38 lúc **2026-11-15T23:45:17Z**
  (heartbeat ts ghi rõ năm-tháng-ngày; "boot changed
  48a82db1 -> 27c8b1d9 (uptime since 2026-11-15 23:33:34)").
  Lỗi "16/11" xuất hiện lần đầu ở T6-129 §8.1 rồi được
  T6-130 §8 chép lại; T6-131 đã đính chính. Từ đợt 131 trở
  đi ghi đúng **15/11** — tài liệu này ghi đúng.
- Đuôi sau mốc cuối đợt 131 → boot #81? đã đếm ở §8.4
  (khung chết #80? hẹp hơn). Đuôi sau mốc cuối đợt 130 →
  boot #80? thuộc T5/T2 đợt 131 (mù #50 đã đóng — xem
  §8.3(c)).

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #80? và #81?)

Phương pháp: như T6-131 §8.2 (mỗi boot liệt kê với boot_id +
btime lấy từ ≥1 nguồn độc lập; btime→btime danh nghĩa =
khoảng cách giữa hai btime liên tiếp). Số thứ tự là số tạm
theo thứ tự thời gian (tất cả đều mang "?") — xem verdict
§8.3. Bảng dưới chỉ ghi 5 boot cuối (chuỗi đầy đủ #57→#79
xem T6-131 §8.2 — không chép lại để khỏi drift; T6 đợt này
đã đối chiếu lại: không có boot_id lạ nào xuất hiện trong
bất kỳ bằng chứng 17/11 nào ngoài chuỗi này).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #77 | 86538084 | 10:56:31Z 17/11 | 1h54'19" (6.859 s) | T6-130/T2-130 |
| #78 | 57c3e5e2 | 13:02:41Z 17/11 | 2h06'10" (7.570 s) | T5b-130/T2-131 |
| #79 | f868abad | 14:26:41Z 17/11 | 1h24'00" (5.040 s, #78→#79) | T5-131/T2-131/T6-131 |
| #80 | ad1327ef | 15:01:30Z 17/11 | 34'49" (2.089 s, #79→#80); xem §8.4 | T5-131/T2-131/T10-131 |
| #81 | b379ecd7 | 17:24:08Z 17/11 | 2h22'38" (8.558 s, #80→#81); đang sống | T6 này / T9-132 / round-in-progress |

- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77: HAI khung (quyết parent §12.3(f) đợt 130 — giữ
    nguyên, xem §8.5).
  - #78: (14:14:23Z, 14:26:41Z] (T2-131) và (14:15:34Z,
    14:26:41Z] (T7-131) — ghi cả hai, lấy khung hẹp nhất
    làm chuẩn (quyết parent đợt 131 §12.3(c)).
  - #79: HAI khung (T4 (15:00:06Z, 15:01:30Z] vs T8
    (15:01:22Z, 15:01:30Z]) — ghi cả hai, khung T8 nằm
    trong khung T4 (quyết parent đợt 131 §12.3(c)).
  - #80: **(16:10:55Z, 17:24:08Z]** — hẹp hơn, T6 này
    (§8.4).

### 8.3 VERDICT: chuỗi tương đối CHỐT #57→#81 — số tuyệt đối VẪN TẠM (giữ "?")

- **CHỐT ĐƯỢC — chuỗi tương đối:** 25 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #81 (17:24:08Z 17/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→#76→#77→#78
  →#79→#80→#81 đều có ≥2 nguồn độc lập xác nhận (T5 + T2
  + T6 + T9 + file mtime). Không có bằng chứng nào về một
  boot quan sát được mà chưa đếm.
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Ba lý do độc lập,
  bất kỳ lý do nào cũng đủ để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn.** Toàn bộ chuỗi sau
    mù #37 mang cùng một độ lệch chưa biết k (0 ≤ k ≤ 29).
    T5-120 §2.2 đã tính gộp: cộng thêm mù #38 (G mở, tối đa
    6 ẩn) và mù #29/#30/#31 (+4) thì boot tạm gọi "#60"
    thực tế có thể tới #123. Độ lệch này là **cấu trúc,
    không gỡ được từ trong VM** — không có quan sát mới nào
    trong cửa sổ B/C của mù #37 từ đợt 119 tới nay.
  - (b) **Mù #49 đoạn B (đời boot #76) MỞ, tối đa 1 ẩn**
    (T2-130 §2; T2-131 kiểm lại: VERDICT KHÔNG ĐỔI) —
    bước #76→#77 có thể là +2 thay vì +1, độc lập với (a).
  - (c) **Mù #51 CHƯA CÓ VERDICT từ T2 đợt 132.** T2-131
    mở mù #51 từ probe #50 (khoảng từ 14:46:56Z 17/11 tới
    probe #51); gap #79?→#80? = 2.089 s danh nghĩa giữ
    **SPAN** (T2-131). Lúc T6 đóng (17:45:49Z), thư mục
    `round132-t2/` mới được tạo lúc 17:44Z và **còn trống**
    — T2-132 chưa chạy probe #51, chưa có verdict đoạn B
    nào để đối chiếu. Cả hai bước chuyển trong mù #51
    (#79?→#80? 2.089 s và #80?→#81? 8.558 s) đều chỉ chốt
    được ở mức tương đối cho tới khi T2-132 kết luận.
- **Kết luận cho parent:** T6-132 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#81?); số thứ tự tuyệt đối
  **vẫn TẠM** và phải giữ "?" cho tới khi có bằng chứng
  ngoài VM (hoặc một mù được đóng hoàn toàn làm neo mới).
  Ngay cả khi T2-132 đóng mù #51 hoàn toàn thì (a)+(b)
  vẫn chặn số tuyệt đối — việc "chốt số boot" theo nghĩa
  bỏ dấu "?" là **không thể đạt được bằng bằng chứng
  trong VM** chừng nào mù #37 còn mở. Không bịa số, không
  bỏ "?" khi chưa đủ bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T9-132 gọi boot mới là "#81?" trong
  LIMITS của mình là đúng quy ước tạm; không cần đổi tên
  file/cờ nào. Các quyết parent trước (§12.3(h) đợt 130 và
  131) vẫn đứng: không quyết con số tuyệt đối nào ở đây.

### 8.4 Khung chết #80? HẸP HƠN (đóng góp mới của T6 đợt này)

- Brief mở đợt 132 + round-in-progress dùng khung
  (16:07Z, 17:24:08Z] (T10 đóng đợt 131 lúc 16:07Z).
- **T6 đợt này hẹp hơn: (16:10:55Z, 17:24:08Z] (1h13'13").**
  Bằng chứng: file `docs/PHASE9_ROUND131_LIMITS.md` có
  mtime **16:10:55Z** và kích thước **57.139 B** (lúc T10
  đóng là 53.291 B — xem LIMITS gộp §10.4 + build-loop-log:
  tăng do §12.3 quyết parent được thêm sau khi đóng).
  Đây là lần ghi file cuối cùng trên boot #80?.
  Quét `find -newermt` trên toàn `hidden_files/` +
  `docs/` + cây `repo-1` cho khoảng (16:07:20Z,
  17:24:08Z] chỉ trả đúng 2 file: `round131-t10.done`
  (16:07:20Z — mốc biên cũ) và LIMITS gộp 131 này —
  không có quan sát nào khác trong khoảng chết.
- Tuổi thọ #80? theo khung hẹp: **1h09m25s–2h22m38s**
  (thay cho 1h05m30s–2h22m38s của khung brief). Gap
  #80→#81 danh nghĩa (btime→btime) vẫn 8.558 s.
- Lưu ý: khung hẹp này T2-132 có thể chưa dùng (T2 mới
  spawn lúc 17:44Z) — T2-132 tự quyết có nhận khung này
  cho mù #51 hay không; T6 chỉ ghi bằng chứng.

### 8.5 Khung chết #77 / #79 hai bản ghi — GIỮ NGUYÊN (quyết parent đã chấp nhận)

- #77: T8/T5b (13:02:16Z, 13:02:41Z]; T4 (13:02:42Z,
  13:04:14Z]. #79: T4 (15:00:06Z, 15:01:30Z]; T8
  (15:01:22Z, 15:01:30Z]. Ghi cả hai, không tự chọn một —
  quyết parent đã chấp nhận (đợt 130 §12.3(f) cho #77;
  đợt 131 §12.3(c) cho #79). Không có bằng chứng mới nào
  đợt này làm hẹp hay loại một khung.
- Tiền lệ củng cố cách ghi này: nhảy clock tại reboot #58
  (bước lùi 32–332s, T5-120 §2.2) và chênh ~33s tại #76
  (T2-130) — đồng hồ VM tại ranh giới reboot vốn không
  đáng tin ở mức giây; khung chết dạng khoảng + ghi cả hai
  nguồn là cách ghi đúng.

## 9. Replay apt sau boot #81?: THUỘC T5 — T6 không kết luận

- T6 đợt này không kiểm `dpkg.log` (không thuộc 4 việc
  brief giao; T6-131 §9 chỉ ghi nhận vì lúc đó watcher
  đang chạy trước mặt). Lúc kiểm ~17:42Z chưa thấy thư mục
  `round132-t5/` — T5-132 chưa có output để đối chiếu.
  Verdict replay / cờ POSTBOOT_PASS boot mới thuộc T5-132.
- **Lock không bị ảnh hưởng** (trống trước/sau mọi thao tác
  của T6, xem §2).

## 10. Dọn Xvfb: 0 Xvfb, 0 socket sót — /tmp/.X11-unix/ trống lúc mở và lúc đóng

- **Lúc mở đợt (17:40Z) và lúc đóng (17:45Z):
  `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb đang chạy
  (`pgrep -x Xvfb` rc=1 cả hai lần; quét `/proc/*/cmdline`
  không có process nào tên Xvfb). Không có Xvfb sót nào từ
  đợt 131 (reboot #81? đã xóa tmpfs; T10 đợt 131 cũng đã
  dọn tay 3 socket sót X193/X194/X195 lúc đóng).
- T4-132 chưa chạy lượt yên #10 tới lúc T6 đóng nên chưa
  có Xvfb nào của đợt 132 xuất hiện — T6 đợt 133 kiểm tiếp
  sau khi T4/T8/T10 chạy xong (luật đứng "mỗi driver tự
  kill Xvfb của mình khi xong" — đợt 131 có bằng chứng
  live tích cực: socket X193 của T4 đã được dọn trước
  15:04Z).
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).
- **RAM khả dụng (đo của T6, không phải số chính thức —
  thuộc T9):** 909 MB lúc 17:41Z, 825 MB lúc 17:43Z,
  1.593 MB lúc 17:45Z (tổng 7.934 MB). T9-132 đo chính
  thức trong 17:40:33–17:42:19Z: **857–1.095 MB, đang rơi
  do balloon virtio phình** (5,76 → 6,02 GB trong lúc apt
  replay chạy `apt-get update`). Tất cả đều **< 6 GB guard**
  (6.144 MB) — birefnet vẫn không chạy được; T9 là nguồn
  chính thức cho RAM/headroom.

## 11. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#81?) VẪN TẠM (xem §8.3):** chuỗi
  tương đối #57→#81 đã chốt (25 boot); số tuyệt đối giữ
  "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6,
  mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới #123);
  (b) mù #49 đoạn B mở, tối đa 1 ẩn (T2-130; T2-131 kiểm
  lại KHÔNG ĐỔI); (c) mù #51 chưa có verdict từ T2-132
  (thư mục round132-t2 còn trống lúc T6 đóng). Journal/wtmp
  chỉ giữ boot hiện tại (journal `--list-boots` chỉ 1 dòng
  b379ecd7; wtmp bắt đầu 17:24:18Z) nên T6 suy ra số hiệu
  từ thứ tự thời gian + hồ sơ các đợt trước, không phải từ
  log hệ thống.
- **F-132-T6-1 (mới — lỗi của chính T6, xem §6):** repro
  đầu dùng sai biến môi trường (`VCUT_VITE_LOCK_DIR` không
  được script v2 đọc) nên chạy trên lock thật: 6 dòng ghi
  vào log thật (dòng 848–853) + 2 file cooldown thật. Đã
  khắc phục: xóa 2 file cooldown (queue về 75), log để
  nguyên và loại 6 dòng khỏi mọi số đếm chính thức, chạy
  lại repro đúng trên /tmp (A/B/C xanh). Số chính thức đợt
  này: **847 dòng / 245 cặp** (file thật 853 dòng / 247
  cặp). T6 đợt 133 dùng 847 làm snapshot.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 chưa có verdict thuộc T2-132.
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ tám
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round130-t*/` (toàn đợt) +
  `round131-t*/` (toàn đợt) + `round132-t*/` tới 17:45Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). Log các luồng đợt 132 vẫn đang tăng sau thời điểm
  đếm; T6 đợt 133 đếm tiếp.
- **Prune cooldown lần 7 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 75 ≤ trần 100). File cũ nhất đủ
  7 ngày theo đồng hồ tường ~21/11 18:38Z, theo `find`
  ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 131 khép sạch trên lock (§3):** 8 chu kỳ của luồng
  đợt 131 sau snapshot T6-131 đều sạch; ca reboot-kill duy
  nhất trong cửa sổ thuộc đợt 129 (đã dọn đúng luật). Không
  phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 17:45Z (trống, 0 ticket + 75 cooldown); đợt còn
  chạy tới ~20:35Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124–131 T10 đã đếm lúc đóng). T6 không chờ tới
  lúc đóng.
- **Tuân thủ lock của luồng đo đợt 132 chưa kiểm được:** T4
  attempt lượt yên #10 + T8/T10 chưa chạy tới 17:45Z — T6
  đợt 133 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 132: chưa có bằng chứng
  mới** (chưa có Xvfb nào của đợt 132 xuất hiện tới lúc T6
  đóng — xem §10). T6 đợt 133 kiểm tiếp sau khi T4/T8/T10
  chạy xong.
- **Replay apt #81? chưa có verdict** (thuộc T5-132 — xem
  §9).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 12. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND132_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file; 2 file test của T6 đã xóa để khôi phục
queue — xem §6), Xvfb (0 process; 0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round132-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round132-t6/` (analyze-log.py,
analyze-log-final.txt, analyze-log-cleaned.txt,
analyze-log-raw-853.txt, vite-lock-v2-cleaned-847.log,
new-lines-since-833.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, ps-full-1.txt,
ps-full-2.txt, ps-full-3.txt, ss-1.txt, ss-2.txt,
khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg.sh (BẢN LỖI — xem §6),
repro-newmsg-fixed.sh, repro-newmsg.log).

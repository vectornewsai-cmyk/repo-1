# PHASE 9 — ROUND 201 — T5: RECORDER LEDGER RE-CHECK — LIMITS

**Đợt:** 201. **Luồng:** T5 — kiểm lại ledger recorder (giao (r)-200).
**Trạng thái:** ĐÃ ĐÓNG. **Kết luận: LEDGER KHÔNG ĐỔI — KHÔNG CÓ REPAIR MỚI,
KHÔNG CÓ APPEND BẤT THƯỜNG. Không có báo động.**

**Nguồn quyết:** aggregate 200 §14.2 (`docs/PHASE9_ROUND200_LIMITS.md`, 83.680 B —
parent CHẤP NHẬN CÓ ĐIỀU KIỆN; đếm lần thứ 156). Giao (r)-200: "T5-201: kiểm
lại ledger nếu watcher-201 repair #131 (dòng 2 mới là đúng thiết kế)".
**Nguồn đọc:** `docs/PHASE9_ROUND200_T5_RECORDER_SILENCE_LIMITS.md` (cơ chế
silencing ĐÚNG, F-199-T56-9 ĐÓNG); `docs/PHASE9_ROUND200_T56_INFRA_LOCK_LIMITS.md`
§1.5/§4 (ledger 2 dòng sau repair #130); aggregate 200 §14.1 dòng 33 + §14.2
(F-199-T56-9 ĐÓNG); ledger + snapshot trực tiếp trên đĩa lúc kiểm
(14:46–14:48Z 27/11/2026).
**Hạn cờ:** ~17:00Z 27/11/2026. **Hạn cứng:** 17:35:51Z (END watcher-201).
**Đóng T5:** ~14:49Z. Kiểm tra CHỈ ĐỌC — không chạy apt, không sửa hệ thống,
không chạy workload nặng trong W1 của T4 (không có W1 nào mở lúc kiểm).

## §1. Kết quả tóm tắt — vẫn boot #130, không có repair #131

- Boot hiện tại **vẫn `c073c8bb`, btime 1795778501 = 11:21:41Z** — chính là boot
  #130 đã repair xong lúc 12:01:06Z. **Không có boot mới, không có #131**
  (btime không đổi; T01-201/T56-201 tự chứng nhận số hiệu — T5 chỉ ghi nhận
  btime trên đĩa).
- Ledger `/var/lib/hatch/os-intent/ledger.jsonl`: **KHÔNG ĐỔI — 2 dòng,
  5.016 B, md5 `81329ce398b36a154d16b885e2f37b60`, mtime 12:01:06Z** — byte-identical
  với trạng thái T56-200 ghi (§1.5). Dòng 1: compacted, ts 1795763286
  (= 07:08:06Z — repair #129), added 173, removed 0. Dòng 2: ts 1795780866
  (= 12:01:06Z — repair #130), added 106, removed 0, không có webkit.
- `dpkg-state.txt`: **890 dòng, mtime 12:01:06Z, md5 `a2ff83c9…`** — không đổi
  so với T56-200. `dpkg-query -W` live lúc 14:48Z **KHỚP 100% snapshot**
  (tập tên-bare + version bằng nhau tuyệt đối, diff 0; cả 890 dòng đều có
  status `install ok installed`).
- `dpkg.log`: 777 dòng, mtime 12:01:06Z, dòng cuối `libc-bin … 12:01:06
  status installed` — đóng băng từ lúc repair #130 xong. `/var/log/apt`
  không có file mới sau 12:01:06Z. **0 process apt/dpkg lúc kiểm.**
- journalctl 12:01–14:50Z grep `intent|compact|fold|preflight`: **0 dòng** —
  không có fold, không có hoạt động os-intent nào trong cell kể từ repair #130.
- Watcher-201: T56-201 đã sinh `replay-watch-201.sh` (14:48:18Z) nhưng
  **chưa spawn** lúc T5 đóng (ps: 0 process replay-watch, 14:48:25Z). Việc
  spawn thuộc T56-201; T5 không spawn, không chạm watcher.

**Vì sao không có repair #131:** watcher chỉ repair khi gặp boot mới dạng B
đóng băng (dpkg 2 dòng). Boot hiện tại đã repair xong (dpkg 777 dòng, ổn định
từ 12:01:06Z) nên watcher-201 khi spawn sẽ thấy hệ thống đã đủ điều kiện —
không có early-repair trigger nào chờ sẵn trên boot này. Chỉ khi một boot mới
xuất hiện trong đợt 201 thì watcher-201 mới repair và ledger mới append dòng
mới — đó là hành vi đúng thiết kế, T5-202 kiểm lại nếu xảy ra.

## §2. Tái dựng độc lập dòng 2 (repair #130) — KHỚP TUYỆT ĐỐI

Tái dựng từ apt log của repair #130
(`hidden_files/round200-t56/t5-postboot-repair-apt-c073c8bb.log`, 53.631 B,
mtime 12:01:06Z — copy ra khỏi /tmp ngay sau --repair theo F-173-T5-9):

- 108 dòng `Setting up <pkg>` − 2 upgrade gói đã cài sẵn (`libelf1t64`
  0.190-1.1ubuntu0.1 → .2, `libssh-4` 0.10.6-2ubuntu0.5 → .6 — `Unpacking …
  over …`) = **đúng 106 tên gói mới**.
- Cả 106 tên đều nằm trong `added` của dòng 2 ledger: **missing = [],
  extra = []** (so sánh sau khi strip hậu tố `:amd64` — ledger ghi tên trần,
  apt log ghi `tên:amd64`).
- Dòng 2 ⊆ dòng 1 (overlap 106/106) — cùng tập NEED + deps như repair #129
  (tiền lệ đợt 168: repair #75 cũng append 106 added — cùng con số vì cùng
  tập NEED + deps).
- Ba lớp khớp nhau như T56-200 ghi: apt log 108−2=106, ledger added 106,
  snapshot 784 → 890 (+106).

Script kiểm + output: `hidden_files/round201-t5/verify-t5-201.py` (+ `.out`),
`verify-t5-201-fix.py` (+ `.out`), `verify-t5-201-snap.out`,
`verify-t5-201-snap2.out` — **18/18 PASS sau khi sửa lỗi script**
(xem §4 về 3 FAIL giả do format).

## §3. Đối chứng silencing — vẫn đúng, không có vi phạm

- **Replay không append:** không có replay nào chạy kể từ repair #130
  (không boot mới → không replay mới). Ledger mtime đứng yên 12:01:06Z
  trong suốt 2h47m kể từ đó — không có append nào từ bất kỳ actor nào.
- **Repair đã append đúng:** dòng 2 (ts 12:01:06Z, added 106) là bằng chứng
  repair #130 ĐÃ ghi ledger — đúng thiết kế (installs của repair là intent
  thật, phải ghi; chỉ replay của host mới bị silence).
- **Reseed silenced đúng:** reseed boot #130 lúc 11:36:04Z (890 → 784 dòng)
  không sinh delta line — đã xác minh ở T5-200 §3(iii); không có reseed mới
  đợt này (không boot mới).
- **Không có fold mới:** ledger vẫn 2 dòng (chưa fold về 1 dòng compacted như
  sau repair #129). Fold tiếp theo (nếu host chạy) sẽ gộp dòng 2 vào dòng 1
  với ts = 1795780866, added giữ 173 (re-add no-op) — T5-202 đối chiếu theo
  nội dung dòng compacted, không đếm số dòng (F-200-T5-3).

**Quy tắc giám sát (T5-200 §6(c)) vẫn đứng:** repair append dòng ledger là
BÌNH THƯỜNG; chỉ báo động khi REPLAY append dòng (silence hỏng) hoặc REPAIR
không append (ghi hỏng). Đợt này: **không có trường hợp nào trong hai trường
hợp báo động** — repair #130 đã append (xác minh §2), không có replay nào để
append sai.

## §4. Sai số của chính T5-201 (đã sửa ngay, không ảnh hưởng kết luận)

Ba FAIL giả trong lần chạy verify đầu — đều là lỗi format của script kiểm,
không phải lỗi dữ liệu (cùng họ lỗi quoting/format như F-200-T5-5):

1. `snapshot-live-diff0`: so sánh list theo thứ tự — `dpkg-query -W` trả
   `tên\tphiên-bản`, snapshot ghi `tên phiên-bản install ok installed`.
   Sửa: so sánh theo tập (name, version).
2. `line2-equals-aptlog-new`: apt log ghi `tên:amd64`, ledger ghi tên trần
   (`glib-networking:amd64` vs `glib-networking`). Sửa: strip `:amd64`
   trước khi so sánh — sau sửa missing = [] extra = [].
3. `snapshot-live-name-version-equal`: cùng nguyên nhân (1) + (2) gộp —
   live có `:amd64`, snapshot không. Sửa: strip arch ở cả hai phía —
   sau sửa KHỚP TUYỆT ĐỐI (890 = 890, only-live = [] only-snap = []).

Sau 3 lần sửa, **18/18 PASS**: verify chính 16/18 (2 FAIL giả) + fix 2/3
(1 FAIL giả) + snap2 1/1. Mọi con số trong LIMITS này lấy từ output sau sửa.

## §5. Findings F-201-T5-n

- **F-201-T5-1 (chính): ledger KHÔNG ĐỔI — không có repair #131, không có
  append bất thường, không có báo động.** Boot vẫn #130 (btime 11:21:41Z);
  ledger 2 dòng, md5 81329ce3, mtime 12:01:06Z (y hệt T56-200); snapshot 890
  dòng khớp live 100%; dòng 2 tái dựng tuyệt đối từ apt log repair #130
  (108−2=106, missing = [] extra = []). Cơ chế silencing vẫn đúng;
  F-199-T56-9 vẫn ĐÓNG (không mở lại).
- **F-201-T5-2:** không có fold mới kể từ repair #130 (ledger vẫn 2 dòng).
  Nếu host fold trong đợt 201, dòng compacted sẽ mang ts 1795780866, added
  173 — T5-202 đối chiếu theo nội dung, không đếm số dòng.
- **F-201-T5-3 (caveat thời gian):** kiểm này chốt lúc ~14:48Z, watcher-201
  chưa spawn (script đã sinh 14:48:18Z, chưa có process). Nếu một boot mới
  xuất hiện sau thời điểm này và watcher-201 repair, ledger sẽ append dòng
  mới — đúng thiết kế; T5-202 kiểm lại (ts/added/diff, tái dựng độc lập như
  T5-200/T5-201). Trên boot #130 hiện tại, không có trigger repair nào chờ
  sẵn (dpkg đã 777 dòng ổn định).
- **F-201-T5-4:** T5-200 LIMITS sai 2 timestamp (btime #130 "11:35:01Z",
  deadline "11:50:01Z") đã được T56-200 đính chính (F-200-T56-5) — T5-201
  dùng btime đúng 11:21:41Z từ /proc/stat + uptime -s; không lặp lại sai số.

## §6. Đề xuất cho parent (quyết ở aggregate 201)

- (a) Chấp nhận kết luận T5-201: ledger không đổi, không có repair #131,
  không có append bất thường; F-199-T56-9 vẫn ĐÓNG.
- (b) Giữ nguyên quy tắc giám sát (T5-200 §6(c)): repair append là bình
  thường; chỉ báo động khi replay append hoặc repair không append.
- (c) Không có thay đổi code nào từ T5-201 (chỉ kiểm tra đọc).

## §7. Batch stage

- 1 file mới: `docs/PHASE9_ROUND201_T5_RECORDER_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round201-t5-recorder.txt`
  (NUL-delimited, 1 entry, có byte NUL cuối).
- KHÔNG stage file làm việc trong `hidden_files/round201-t5/` (script kiểm +
  output — chỉ để tham chiếu, T10 đối chiếu).
- Chờ push: 191–200 = 120/460/355/334 (theo aggregate 200 §14.2) + đợt 201
  (sau khi T10-201 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).

# PHASE 9 — ROUND 202 — T5: RECORDER LEDGER + FOLD/RESEED — LIMITS

**Đợt:** 202. **Luồng:** T5 — kiểm ledger recorder + cơ chế fold/reseed (giao (r)-201).
**Trạng thái:** ĐÃ ĐÓNG. **Kết luận: FOLD 2 → 1 ĐÚNG — RESEED TRÊN BOOT MỚI SILENCED
ĐÚNG — REPAIR #133 GHI DÒNG 2 ĐÚNG — KHÔNG CÓ BÁO ĐỘNG.**
**Đóng T5:** ~21:02Z 27/11/2026 (verify sau-repair 21/21 PASS lúc 21:00:05Z).

**Nguồn quyết:** aggregate 201 §14.2 (`docs/PHASE9_ROUND201_LIMITS.md`, 92.112 B —
parent CHẤP NHẬN CÓ ĐIỀU KIỆN). Giao (r)-201: "T5-202: kiểm lại ledger nếu
watcher-202 repair #132 (dòng mới là đúng thiết kế); cơ chế fold/reseed
(T56 ghi fold 2 → 1 dòng COMPACTED)". (q)-201/(j)-201: "ledger fold 2 → 1 dòng
COMPACTED — đúng silencing, cơ chế fold/reseed thuộc T5-202".
**Nguồn đọc:** `docs/PHASE9_ROUND201_T5_RECORDER_LIMITS.md` (T5-201: ledger 2 dòng
lúc 14:48Z, fold dự báo ts 1795780866 / added 173); `docs/PHASE9_ROUND200_T5_RECORDER_SILENCE_LIMITS.md`
(cơ chế silencing ĐÚNG, F-199-T56-9 ĐÓNG); `docs/PHASE9_ROUND201_T56_INFRA_LIMITS.md`
§1.5 (fold 2 → 1 đã ghi: 3.107 B, md5 e3b9d767, mtime 15:11Z); aggregate 201
§14.1/§14.2; ledger + snapshot + dpkg.log trực tiếp trên đĩa; mã nguồn host đọc
tươi đợt này: `/opt/hatch/runtime-cell/os-intent-ledger.py` (`fold`, dòng 130–221),
`/opt/hatch/runtime-cell/hatch-preflight-opportunistic` (`fold_os_intent_ledger`,
`compact_os_intent_ledger`, reseed), `/usr/local/sbin/hatch-apt-intent-record`,
`/etc/apt/apt.conf.d/90hatch-intent-ledger`.
**Hạn cờ:** ~06:00 +07 28/11/2026 (~23:00Z 27/11). **Hạn cứng:** 06:35:51 +07 (END watcher-202).
**Kiểm tra CHỈ ĐỌC** — không chạy apt, không sửa hệ thống, không chạy workload nặng
trong W1 của T4 (không có W1-ACTIVE nào mở trong suốt lúc kiểm; chỉ đọc + `dpkg-query -W`).

## §1. Kết quả tóm tắt

- **Boot mới `05bda90d-6988-4925-97f7-71317d569aca`, btime 1795811527 = 20:32:07Z —
  ỨNG VIÊN #133** (nếu #132 = `9a30eb2a` btime 17:03:20Z đứng; gap #132→mới =
  12.527 s = 3h28m47s; số hiệu thuộc T01-202/T2-202 + parent (e)-202 — T5 chỉ ghi
  nhận boot_id + btime trên đĩa). Journal `list-boots` chỉ còn idx 0 = boot mới
  (journal các boot trước đã mất sau reboot — như mọi reboot trước).
- **Ledger FOLD ĐÚNG:** 1 dòng COMPACTED, 3.107 B, md5 `e3b9d767aa7a9aa1b68f44db28123893`,
  mtime 15:11:39Z, ts 1795780866 (= 12:01:06Z, repair #130), added **173**,
  removed 0, gồm libwebkitgtk-6.0-4 + libjavascriptcoregtk-6.0-1 — KHỚP TUYỆT ĐỐI
  với dự báo của T5-201 (F-201-T5-2) và với bản ghi độc lập của T56-201 (§1.5).
  Tái fold bằng đúng mã host trên bản sao cho ra **byte-identical** (xem §2).
- **Reseed trên boot mới SILENCED ĐÚNG:** dpkg-state.txt reseed 890 → **784 dòng**
  lúc 20:36:17Z (boot+250 s); `dpkg-query -W` live KHỚP 100% snapshot (784 = 784,
  only-live = [] only-snap = []); ledger **KHÔNG append** (mtime vẫn 15:11:39Z).
  dpkg.log reset về 2 dòng `startup packages configure` lúc 20:35:46/47Z — mẫu boot
  dạng B đóng băng (như #129/#130).
- **Repair #133 GHI DÒNG 2 ĐÚNG:** watcher-202 (pid 4676, START 20:42:59Z)
  `EARLY-REPAIR TRIGGER` 20:47:31Z (boot_age 924 s, frozen 704 s, dpkg_lines 2),
  `--repair exit=0`, xong 20:50:33Z (poll1, FLAG-WRITTEN mode=repair-som-quyet-h).
  Ledger append dòng 2 lúc **20:50:31Z** (ts 1795812631): added **106**, removed 0,
  không webkit, ⊆ dòng compacted 106/106; tái dựng từ apt log repair: 108 Setting
  up − 2 upgrade = 106, **khớp tuyệt đối** (missing = [] extra = []); tập 106 gói
  **giống hệt** tập repair #130 (diff = [] — lần thứ ba liên tiếp cùng tập NEED +
  deps: #129/#130/#133). Snapshot 784 → **890 dòng**, live == snapshot 100%;
  dpkg.log 2 → **777 dòng**. Verify sau-repair **21/21 PASS** lúc 21:00:05Z
  (xem §4). POSTBOOT_PASS #133 CÓ (poll=1, 20:50:33Z — T56-202).
- **Không có repair #132:** watcher-201 chết cùng reboot #132 (17:03:20Z — poll cuối
  17:03:47Z vẫn mang boot #131, không có poll nào trên boot #132); ledger không
  append sau 15:11:39Z nên không có repair nào ghi dòng mới cho #132. Trạng thái
  postboot của #132 nay không còn quan sát được (journal đã mất sau reboot #133;
  POSTBOOT #132 thuộc T56-202 — nhưng boot #132 đã qua, không đo live được nữa).
- **Không có báo động:** không có replay append, không có fold sai, không có reseed
  ghi delta, không có apt/dpkg lạ (0 process apt/dpkg ngoài repair của watcher-202).

## §2. Fold 2 → 1 dòng COMPACTED — XÁC MINH ĐỘC LẬP (ĐÚNG)

Kiểm lúc 20:47–20:48Z bằng `hidden_files/round202-t5/verify-t5-202.py` — **25/26 PASS**
(1 FAIL là check "watcher chưa repair" — đã lỗi thời ngay lúc chạy vì trigger repair
vừa bắn 20:47:31Z, xem §4; không phải lỗi ledger).

| Kiểm | Kỳ vọng (T5-201 F-201-T5-2 + T56-201 §1.5) | Thực đo | Kết quả |
|---|---|---|---|
| Số dòng | 1 | 1 | PASS |
| Kích thước | 3.107 B | 3.107 B | PASS |
| md5 | e3b9d767… | e3b9d767aa7a9aa1b68f44db28123893 | PASS |
| mtime | 15:11Z | 15:11:39.915788Z | PASS |
| ts dòng duy nhất | 1795780866 (repair #130) | 1795780866 = 12:01:06Z | PASS |
| compacted | true | true | PASS |
| event / v | dpkg-post-invoke / 1 | dpkg-post-invoke / 1 | PASS |
| added | 173 | 173, không trùng lặp | PASS |
| removed | 0 | 0 | PASS |
| webkit trong added | có cả 2 | libwebkitgtk-6.0-4 + libjavascriptcoregtk-6.0-1 | PASS |
| 106 gói mới của repair #130 ⊆ added | missing = [] | missing = [], extra-vs-130 = 67 | PASS |
| apt log repair #130 | 108 Setting up − 2 upgrade = 106 | 108 − 2 (libelf1t64, libssh-4) = 106 | PASS |

**Tái fold bằng mã host thật (bằng chứng mạnh nhất):** chạy
`python3 /opt/hatch/runtime-cell/os-intent-ledger.py fold` trên BẢN SAO của ledger
hiện tại (bản sao trong `hidden_files/round202-t5/`, không chạm ledger thật) cho ra
file `.compacted` **byte-identical** với đầu vào (3.107 B, `cmp` sạch, exit 0; in ra
`install <173 tên>` / `remove <rỗng>`). Đúng như chú thích trong mã host: "Its ts is
the newest folded ts, so refolding a compacted ledger is byte-identical."
Dòng compacted hiện tại chính xác là đầu ra của thuật toán fold — không mất tên gói,
không thêm tên lạ, không sai ts.

**Cơ chế fold (đọc tươi từ mã host đợt này — không copy lại lời T5-200):**
- `fold(path)` (`os-intent-ledger.py:130–221`): đọc từng dòng; `newest_ts = max(ts
  mọi dòng)`; gộp theo luật last-wins vào 2 dict `install`/`remove` (gói trong
  `added` vào install + xóa khỏi remove, và ngược lại; re-add là no-op vì dict);
  bỏ qua dòng hỏng/không hỗ trợ (không compact những dòng đó); ghi ứng viên
  `{"v":1,"ts":newest_ts,"event":"dpkg-post-invoke","compacted":true,
  "added":list(install),"removed":list(remove)}` ra `<path>.compacted` (giới hạn
  4 MB/dòng, 200.000 tên riêng biệt).
- `fold_os_intent_ledger()` (`hatch-preflight-opportunistic:322`): chạy fold trên
  snapshot ledger; `compact_os_intent_ledger()` (dòng 768): chỉ ghi đè khi ledger
  đã đổi (đã compacted thì `cmp -s` khớp → bỏ qua, rc 20); lúc ghi đè chạy dưới
  khóa dpkg frontend, kiểm tra prefix-hash của ledger vẫn khớp snapshot hash
  (chống append đồng thời — phần append sau snapshot được giữ lại bằng `tail -c`).
- Fold chạy ở **phía host, trong preflight/replay** (trước receipt fast-path, dòng
  733: "Complete the bounded fold before any receipt shortcut"; và trong quyết định
  backoff, dòng 412) — **không chạy trong cell**, nên không để lại trace trong
  journal của cell (journal grep `intent|compact|fold|preflight` từ btime boot mới:
  **0 dòng**; T56-201 cũng ghi 0 dòng từ btime #131). Actor fold 15:11:39Z vẫn không
  xác định được từ log trong cell — nhưng KẾT QUẢ fold đã xác minh tuyệt đối (bảng
  trên + tái fold byte-identical). Fold 15:11:39Z nằm trong cửa sổ replay #131
  (~15:05–15:12Z, POSTBOOT #131 15:12:20Z) — khớp thời gian với lần fold trong
  preflight/replay của host.
- **Vì sao added giữ 173 (không phải 173+106):** dòng 2 (repair #130, 106 added) ⊆
  dòng 1 (173 added) — T5-201 đã chứng minh overlap 106/106. Fold hợp 2 dòng:
  173 ∪ 106 = 173 (re-add no-op). 67 tên "extra-vs-130" là phần của dòng 1 không
  thuộc repair #130 (tích lũy từ các repair trước: #126/#127/#129 — cùng tập NEED +
  deps, xem T5-200 §2). **T5 các đợt sau đối chiếu ledger theo NỘI DUNG dòng
  compacted (added 173), không đếm số dòng** (quy tắc F-200-T5-3, đứng).

## §3. Reseed trên boot mới — SILENCED ĐÚNG

- **Dòng thời gian (boot 05bda90d, btime 20:32:07Z):** 20:35:46/47Z dpkg.log reset
  2 dòng `startup packages configure`; 20:36:17Z dpkg-state.txt reseed 890 → 784
  dòng (40.401 B); 20:40:56Z T5 kiểm lần đầu (ledger vẫn 1 dòng, mtime 15:11:39Z);
  20:47:54Z verify: live `dpkg-query -W` = 784 gói, snapshot = 784 dòng,
  **set (tên, phiên-bản) bằng nhau tuyệt đối** (only-live = [] only-snap = []),
  cả 784 dòng đều `install ok installed`.
- **Reseed không sinh delta line:** một thay đổi trạng thái 890 → 784 dòng mà ledger
  không append gì (mtime đứng yên 15:11:39Z, md5 không đổi) = reseed silenced đúng
  thiết kế — cùng mẫu với boot #130 (T5-200 §3(iii): 890 → 784, không delta line).
  Đây là lần reseed silenced thứ hai liên tiếp được xác minh độc lập (sau #130).
- **Cơ chế reseed (đọc tươi từ mã host đợt này):** `hatch-preflight-opportunistic`
  §dpkg-reseed (dòng 577–652): mọi reseed chạy dưới khóa dpkg frontend; các apt run
  của replay mang reseed dưới dạng hook Post-Invoke phụ (`reseed_hook`) nên chạy
  trong chính khóa của apt, ngay sau hook recorder; các reseed khác tự lấy khóa bằng
  perl fcntl F_SETLKW ("Never reseed unlocked: that is exactly the lost-intent
  race"). Reseed chỉ viết lại snapshot `dpkg-state.txt`, không đi qua recorder
  (recorder chỉ append khi snapshot thay đổi DO dpkg chạy trong cell; reseed của
  host viết snapshot trực tiếp + replay bị silence bằng `HATCH_OS_INTENT_DIR`
  không tồn tại — xem T5-200 §1).
- **`/var/log/apt` không tồn tại** trên boot mới (như #130 — T5-200 §3(iii) cũng ghi
  "chưa tồn tại"); dpkg.log 2 dòng lúc mở boot. Không phải dấu hiệu lỗi — apt chưa
  chạy lần nào trên boot này trước repair của watcher-202.
- **Sai số của chính T5-202 (đã sửa ngay, không ảnh hưởng kết luận):** lần chạy verify
  đầu báo FAIL giả `ledger-mtime-1511Z` (epoch tham chiếu trong script sai: dùng
  1795799500 = 17:11:40Z thay vì 1795792299 = 15:11:39Z — lỗi số học tay của T5,
  cùng họ với F-201-T10-2) + crash `TypeError` ở check `snapshot-all-installed`
  (đưa list vào set). Sửa cả hai, chạy lại: **25/26 PASS** (FAIL còn lại là check
  watcher-chưa-repair đã lỗi thời — xem §4).

## §4. Repair #133 — GHI DÒNG 2 ĐÚNG (XÁC MINH ĐỘC LẬP, 21/21 PASS)

Kiểm lúc 21:00:05Z bằng `hidden_files/round202-t5/verify-t5-202-post.py` —
**21/21 PASS**. Nguồn: ledger trực tiếp + apt log repair do T56-202 copy
(`hidden_files/round202-t56/t5-postboot-repair-apt-05bda90d.log`, 50.840 B —
đúng quy trình F-173-T5-9; bản `/tmp/l8-postboot-apt.log` cùng kích thước).

| Kiểm | Thực đo | Kết quả |
|---|---|---|
| Ledger | 2 dòng, 5.016 B, md5 90e27ebec606c4932565f1dc6989b003 | PASS |
| Dòng 1 | byte-identical với bản compacted đã lưu trước repair (ts 1795780866, added 173) | PASS |
| Dòng 2 ts | 1795812631 = 20:50:31Z (repair xong 20:50:33Z — hook post-invoke cuối chạy 2 s trước poll1) | PASS |
| Dòng 2 added / removed | 106 / 0, không có webkit | PASS |
| Dòng 2 ⊆ dòng 1 | overlap 106/106 | PASS |
| Apt log repair | 108 Setting up − 2 upgrade (libelf1t64, libssh-4) = 106; dòng 2 == tập mới KHỚP TUYỆT ĐỐI (missing = [] extra = []) | PASS |
| Tập 106 gói | giống hệt tập repair #130 (diff = []) | PASS |
| Snapshot | 784 → 890 dòng; live `dpkg-query -W` = 890, set (tên, phiên-bản) bằng nhau tuyệt đối; cả 890 dòng `install ok installed` | PASS |
| dpkg.log | 2 → 777 dòng; dòng cuối `2026-11-27 20:50:30 status installed libc-bin:amd64 2.39-0ubuntu8.12` | PASS |
| Journal intent/fold từ btime | 0 dòng | PASS |

- **Dòng thời gian repair:** trigger 20:47:31Z → apt install → hook recorder append
  dòng 2 lúc 20:50:31Z → poll1 + FLAG-WRITTEN 20:50:33Z (mode=repair-som-quyet-h,
  poll=1, old=7d642f2a) → POSTBOOT_PASS 20:50:33Z (dpkg 777, cache 108, lists 75).
  Toàn bộ repair chỉ ~3 phút (nhanh hơn #129 ~14 phút và #130 ~21 phút — cache apt
  ấm / cùng tập gói; không phải dấu hiệu lỗi: mọi con số cuối đều khớp tuyệt đối).
- **T56-202 đã xác nhận độc lập** (`t56-postboot-independent-05bda90d.log`, 20:52Z)
  và ghi POSTBOOT_PASS — T5 chỉ đối chiếu ledger/apt log/snapshot, không lặp lại
  phần postboot của T56.
- **Số hiệu repair là #133** (boot hiện tại là ứng viên #133 — (r)-201 viết
  "repair #132" khi #132 vẫn là boot mới nhất; tới lúc watcher-202 spawn thì boot
  đã là #133). Nếu parent xác nhận boot 05bda90d = #133 thì repair này là #133;
  nếu số hiệu boot đổi thì số hiệu repair đổi theo — nội dung xác minh không đổi.

## §5. Findings F-202-T5-n

- **F-202-T5-1 (chính): fold 2 → 1 ĐÚNG — (q)-201/(j)-201 được xác minh độc lập.**
  Dòng compacted (ts 1795780866, added 173, removed 0) khớp tuyệt đối dự báo T5-201
  + bản ghi T56-201; tái fold bằng mã host thật cho ra byte-identical. Không có
  báo động về fold. F-199-T56-9 vẫn ĐÓNG (không mở lại).
- **F-202-T5-2: reseed trên boot mới (ứng viên #133) silenced ĐÚNG** (890 → 784,
  live == snapshot 784/784, ledger không append). Đây là lần thứ hai liên tiếp
  reseed silenced được xác minh (sau #130).
- **F-202-T5-3: KHÔNG CÓ repair #132.** Watcher-201 chết cùng reboot #132 (poll cuối
  17:03:47Z vẫn mang boot #131); ledger không append sau 15:11:39Z. (r)-201 viết
  "repair #132" khi #132 còn là boot mới nhất; tới lượt 202 boot đã là #133 nên
  repair đang chạy là **#133** — T5-203 kiểm dòng 2 nếu repair này xong sau khi
  T5-202 đóng.
- **F-202-T5-4 (đã đóng trong đợt này):** repair #133 append dòng 2 lúc 20:50:31Z
  (xem §4 — 21/21 PASS). Nếu host fold lại về 1 dòng sau repair (tiền lệ #126/
  #127/#129/#130), đó là hành vi ĐÚNG thiết kế; T5-203 đối chiếu theo nội dung
  dòng compacted (added giữ 173 vì dòng 2 ⊆ dòng 1).
- **F-202-T5-5 (sai số của chính T5-202, đã sửa):** epoch tham chiếu mtime sai
  (17:11:40Z thay vì 15:11:39Z) + crash TypeError ở check snapshot — cùng họ lỗi
  script/format như F-200-T5-5/F-201-T5-4. Đã sửa, chạy lại 25/26 PASS.
- **F-202-T5-6 (mới): repair #133 ghi dòng 2 ĐÚNG — quy tắc giám sát đứng.**
  Dòng 2 (ts 20:50:31Z, added 106, ⊆ dòng compacted, tái dựng tuyệt đối từ apt
  log) + snapshot 890 == live + dpkg.log 777 dòng. Tập 106 gói giống hệt repair
  #130 — lần thứ ba liên tiếp cùng tập NEED + deps (#129/#130/#133; tiền lệ #75
  đợt 168 cũng 106). Không có trường hợp báo động nào (không replay append,
  repair đã append đúng).

## §6. Đề xuất cho parent (quyết ở aggregate 202)

- (a) Chấp nhận kết luận T5-202: fold 2 → 1 ĐÚNG (xác minh độc lập, tái fold
  byte-identical); reseed trên boot mới silenced ĐÚNG; không có repair #132.
- (b) Giữ nguyên quy tắc giám sát (T5-200 §6(c)): repair append dòng ledger là
  BÌNH THƯỜNG; chỉ báo động khi replay append dòng hoặc repair không append.
- (c) Ghi nhận số hiệu repair đã xong là **#133** (không phải #132 như (r)-201
  viết — do boot đã đổi trước khi watcher-202 spawn); dòng 2 đã xác minh 21/21
  PASS. T5-203 kiểm lại nếu host fold dòng 2 về 1 dòng compacted sau đợt này.
- (d) Không có thay đổi code nào từ T5-202 (chỉ kiểm tra đọc).

## §7. Batch stage

- 1 file mới: `docs/PHASE9_ROUND202_T5_RECORDER_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round202-t5-recorder.txt`
  (NUL-delimited, 1 entry, có byte NUL cuối).
- KHÔNG stage file làm việc trong `hidden_files/round202-t5/` (script kiểm +
  output + bản sao ledger/snapshot — chỉ để tham chiếu, T10 đối chiếu).
- Chờ push: 191–201 = 133/490/378/357 (theo aggregate 201 §14.2) + đợt 202
  (sau khi T10-202 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).

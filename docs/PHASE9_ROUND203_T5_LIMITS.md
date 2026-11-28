# PHASE 9 — ROUND 203 — T5: RECORDER LEDGER + FOLD/RESEED — LIMITS

**Đợt:** 203. **Luồng:** T5 — kiểm ledger recorder + cơ chế fold/reseed (giao (r)-203 (9)).
**Trạng thái:** ĐÃ ĐÓNG. **Kết luận: REPAIR #134 GHI DÒNG 2 ĐÚNG — FOLD 2 → 1
(21:21:34Z) ĐÚNG THEO NỘI DUNG — RESEED TRÊN BOOT #135 SILENCED ĐÚNG —
REPAIR #135 GHI DÒNG 2 ĐÚNG — KHÔNG CÓ BÁO ĐỘNG.**
**Đóng T5:** ~23:57Z 27/11/2026 (verify sau-repair #135 22/22 PASS lúc 23:57:10Z).

**Nguồn quyết:** aggregate 202 §14.2 (`docs/PHASE9_ROUND202_LIMITS.md`, 75.747 B —
parent CHẤP NHẬN CÓ ĐIỀU KIỆN, §14.2 SẠCH lần thứ tám kể từ đợt 179). Giao
(r)-203 (9): "T5-203: kiểm repair #134 + đối chiếu fold ledger 2 → 1
(21:21:34Z) theo nội dung dòng compacted". Caveat (r)-202/(q)-202: "host fold
ledger 2 → 1 lúc 21:21:34Z trên #134 (đúng thiết kế — T5-203 đối chiếu theo nội
dung dòng compacted); repair #134 append dòng 2 (ts 1795814889, added 106) —
T5-203 kiểm lại."
**Nguồn đọc:** `docs/PHASE9_ROUND202_T5_RECORDER_LIMITS.md` (T5-202: fold 2 → 1
ĐÚNG, reseed #133 silenced ĐÚNG, repair #133 dòng 2 ĐÚNG 21/21 PASS);
`hidden_files/round202-t5/` (ledger 1 dòng pre-repair #133 + 2 dòng post-repair
#133, snapshot 784/890); `hidden_files/round202-t56/` (apt log repair #133/#134,
POSTBOOT_PASS #133/#134); `hidden_files/round203-t56/` (watcher-203, apt log
repair #135, POSTBOOT_PASS #135); ledger + snapshot + dpkg.log trực tiếp trên
đĩa; mã host `/opt/hatch/runtime-cell/os-intent-ledger.py` (`fold`).
**Hạn cờ:** ~02:00Z 28/11/2026. **Hạn cứng:** 02:35:51Z (END watcher-203).
**Kiểm tra CHỈ ĐỌC** — không chạy apt, không sửa hệ thống, không chạy workload
nặng trong W1 của T4 (chỉ đọc + `dpkg-query -W` + `journalctl`).

## §1. Kết quả tóm tắt

- **Boot #134 `bd22dffd-4949-4ac2-8e57-a6d3fb2868e2`, btime 21:05:15Z — XÁC
  NHẬN** (POSTBOOT_PASS T56-202: repair-som-quyet-h, dpkg 777, cache 108, lists
  66, poll=1, 21:28:09Z). **Boot #135 `8ea1f5e3ee034e83ac269be9be446566`,
  btime 23:06:56Z — ỨNG VIÊN** (số hiệu thuộc T01-203 + parent (e)-203 — T5 chỉ
  ghi nhận boot_id + btime trên đĩa). Journal `list-boots` chỉ còn idx 0 = boot
  #135 (journal các boot trước đã mất sau reboot — như mọi reboot trước).
- **Repair #134 GHI DÒNG 2 ĐÚNG:** append lúc **21:28:09Z** (ts 1795814889),
  added **106**, removed 0, không webkit, ⊆ dòng compacted 106/106; tái dựng từ
  apt log repair #134 (`t5-postboot-repair-apt-bd22dffd.log`, 50.627 B):
  108 Setting up − 2 upgrade (libelf1t64, libssh-4) = 106, **khớp tuyệt đối**
  (missing = [] extra = []); tập 106 gói **giống hệt** tập repair #130/#133
  (diff = [] — **lần thứ tư liên tiếp** cùng tập NEED + deps:
  #129/#130/#133/#134). Xem §2.
- **Fold 2 → 1 lúc 21:21:34Z ĐÚNG THEO NỘI DUNG:** tái fold bằng mã host thật
  trên đúng input tiền-fold (ledger 2 dòng post-repair #133, đã lưu trữ) cho ra
  dòng compacted ts **1795812631** (= repair #133), added **173**, removed 0,
  tập added bằng đúng tập compacted cũ — đúng luật fold (ts = newest folded ts,
  added = hợp tập). Dòng compacted sau repair #134 (ts **1795814889**, 3.107 B,
  md5 `0213b58d`) **chỉ khác dòng compacted cũ (md5 `e3b9d767`) ở ts** — added
  giữ nguyên 173, thứ tự giữ nguyên; tái fold [fold-21:21:34 + dòng 2 #134]
  cho ra **byte-identical** với ledger lúc đó. Xem §3.
- **Reseed trên boot #135 SILENCED ĐÚNG:** dpkg-state.txt reseed 890 → **784
  dòng** lúc 23:07:59Z (boot+63 s); `dpkg-query -W` live KHỚP 100% snapshot
  (784 = 784, only-live = [] only-snap = []); ledger **KHÔNG append do reseed**
  (chỉ có fold, mtime 23:07:59Z — xem §3). dpkg.log reset về 2 dòng `startup
  packages configure` lúc 23:07:37Z — mẫu boot dạng B đóng băng (như
  #129/#130/#133). Đây là lần reseed silenced thứ ba liên tiếp được xác minh
  độc lập (sau #130, #133).
- **Repair #135 GHI DÒNG 2 ĐÚNG:** watcher-203 (pid 296433, START 23:53:07Z)
  `EARLY-REPAIR TRIGGER` 23:53:07Z (boot_age 2.771 s, frozen 2.730 s, dpkg_lines
  2), `--repair exit=0`, xong 23:55:18Z (poll1, FLAG-WRITTEN
  mode=repair-som-quyet-h). Ledger append dòng 2 lúc **23:55:18Z** (ts
  1795823718): added **106**, removed 0, không webkit, ⊆ dòng compacted 106/106;
  tái dựng từ apt log 108 − 2 = 106, **khớp tuyệt đối**; tập 106 gói **giống
  hệt** tập repair #133/#134 — **lần thứ năm liên tiếp** cùng tập. Snapshot
  784 → **890 dòng**, live == snapshot 100%; dpkg.log 2 → **777 dòng**.
  Verify sau-repair **22/22 PASS** lúc 23:57:10Z (xem §4). POSTBOOT_PASS #135
  CÓ (poll=1, 23:55:18Z — T56-203).
- **Không có báo động:** không có replay append, không có fold sai, không có
  reseed ghi delta, không có apt/dpkg lạ ngoài repair của watcher-203
  (1 FAIL giả trong verify lần đầu là apt của repair #135 đang chạy — xem §5).

## §2. Repair #134 — GHI DÒNG 2 ĐÚNG (XÁC MINH ĐỘC LẬP)

Dòng 2 #134 không còn quan sát trực tiếp được nữa (đã bị fold về 1 dòng
compacted sau đó — đúng thiết kế, xem §3), nên T5-203 xác minh bằng **tái dựng
độc lập từ apt log + đối chiếu qua dòng compacted sau fold**:

| Kiểm | Thực đo | Kết quả |
|---|---|---|
| Apt log repair #134 | `round202-t56/t5-postboot-repair-apt-bd22dffd.log`, 50.627 B, mtime 21:28Z (T56-202 copy theo quy trình F-173-T5-9) | PASS |
| Setting up | 108 distinct / 108 raw | PASS |
| Upgrades | 2: libelf1t64:amd64, libssh-4:amd64 | PASS |
| Gói mới tái dựng | 108 − 2 = **106** | PASS |
| Tập 106 gói == tập repair #133 | missing = [] extra = [] (diff = []) | PASS |
| Tập 106 gói == tập repair #130 | (bắc cầu qua #133 — T5-202 đã chứng minh #133 == #130) | PASS |
| Dòng compacted sau #134 chứa đủ 106 | 106/106 ⊆ added 173 (kiểm trên ledger lúc 23:53Z) | PASS |
| ts dòng compacted sau #134 | 1795814889 = 21:28:09Z = giờ repair #134 xong (POSTBOOT_PASS #134) | PASS |
| POSTBOOT #134 | dpkg 777, cache 108 .deb, lists 66, poll=1, 21:28:09Z | PASS (T56-202) |

- **Dòng thời gian #134 (từ log T56-202):** btime 21:05:15Z → fold 2 → 1 lúc
  21:21:34Z (xem §3) → repair xong + POSTBOOT_PASS 21:28:09Z (poll1).
  Toàn bộ repair chỉ ~7 phút sau fold (cache apt ấm / cùng tập gói).
- **Vì sao tin dòng 2 #134 có added đúng 106 dù không còn dòng đó:** (i) apt
  log tái dựng tuyệt đối 106 gói; (ii) fold là phép hợp tập đơn điệu — added
  của dòng compacted sau fold = hợp của mọi dòng đã fold; compacted sau #134
  giữ đúng 173 tên (không thêm tên lạ, không mất tên nào so với compacted cũ)
  và ts của nó chính là ts dòng 2 #134; (iii) tái fold [fold-21:21:34 + dòng 2
  tái dựng] cho ra byte-identical với ledger lúc 23:53Z (xem §3) — nếu dòng 2
  #134 có tập khác, phép tái fold đã lệch.
- **Số hiệu repair là #134** (boot #134 = `bd22dffd`; (r)-202 viết "repair #134"
  đã đúng — khác trường hợp #133 ở đợt 202 khi số hiệu đổi giữa lúc giao việc
  và lúc repair chạy).

## §3. Fold 2 → 1 lúc 21:21:34Z — ĐỐI CHIẾU THEO NỘI DUNG (ĐÚNG)

Kiểm lúc 23:53–23:54Z bằng `hidden_files/round203-t5/verify-t5-203.py` —
**34/35 PASS** (1 FAIL là check "không có apt/dpkg đang chạy" — đã lỗi thời
ngay lúc chạy vì repair #135 vừa bắt đầu 23:53Z, xem §4/§5; không phải lỗi
ledger). Fold chạy bằng mã host thật trên BẢN SAO trong `round203-t5/`, không
chạm ledger thật.

| Kiểm | Kỳ vọng | Thực đo | Kết quả |
|---|---|---|---|
| Ledger lúc 23:53Z | 1 dòng (đã fold sau #134) | 1 dòng, 3.107 B, md5 `0213b58d`, mtime 23:07:59Z | PASS |
| ts dòng compacted | 1795814889 (repair #134) | 1795814889 = 21:28:09Z | PASS |
| added / removed | 173 / 0 | 173 (không trùng lặp) / 0 | PASS |
| added == compacted cũ (e3b9d767) | tập bằng nhau | only-cur = [] only-arch1 = []; **thứ tự list cũng giống hệt** | PASS |
| Chỉ khác compacted cũ ở ts | — | event/v/removed/added đều giống; ts 1795780866 → 1795814889 | PASS |
| Tái fold ARCH2 (input tiền-fold 21:21:34Z) | compacted ts 1795812631, added 173 | ts 1795812631, added 173, tập == compacted cũ, size 3.107 B, rc 0 | PASS |
| Tái fold [fold-21:21:34 + dòng 2 #134 tái dựng] | byte-identical với ledger 23:53Z | **byte-identical** (3.107 B, md5 `0213b58d`) | PASS |
| Re-fold ledger 23:53Z | byte-identical (idempotence) | byte-identical, rc 0 | PASS |

**Giải thích chuỗi fold (3 lần fold, đều đúng thiết kế):**
1. **21:21:34Z trên #134:** fold [compacted ts 1795780866/173 + dòng 2 #133
   ts 1795812631/106] → compacted ts **1795812631**, added 173 (106 ⊆ 173 nên
   hợp tập không tăng). Tái fold trên đúng input này cho ra đúng kết quả đó.
2. **21:28:09Z:** repair #134 append dòng 2 (ts 1795814889, 106) → ledger lại
   2 dòng (không ai quan sát trực tiếp trạng thái này — T5-202 đã đóng 21:02Z;
   trạng thái được suy ra từ ts compacted sau đó + apt log).
3. **23:07:59Z trên #135 (preflight):** fold [compacted ts 1795812631/173 +
   dòng 2 #134 ts 1795814889/106] → compacted ts **1795814889**, added 173 —
   chính là ledger lúc T5-203 đọc lần đầu (mtime 23:07:59.442Z, trùng giờ
   reseed snapshot 23:07:59.366Z trong cùng cửa sổ preflight). Tái fold bước
   này byte-identical.
- **Vì sao md5 đổi từ `e3b9d767` sang `0213b58d` dù added không đổi:** luật fold
  lấy ts = newest folded ts. Mỗi lần repair append dòng mới rồi fold lại, ts
  compacted nhảy lên ts của repair mới nhất; nội dung added giữ nguyên 173 vì
  mọi dòng 2 đều ⊆ dòng compacted. **T5 các đợt sau tiếp tục đối chiếu ledger
  theo NỘI DUNG dòng compacted (added 173 + ts = ts repair mới nhất), không
  đếm số dòng, không so md5 với bản cũ** (quy tắc F-200-T5-3, đứng; tiền lệ
  đợt này: md5 đổi nhưng nội dung đúng).
- **Dự báo cho T5-204:** nếu host fold dòng 2 #135 về 1 dòng, compacted mới sẽ
  có ts **1795823718**, added 173, size 3.107 B (chỉ ts đổi so với ledger hiện
  tại sau khi trừ dòng 2).

## §4. Reseed #135 + Repair #135 — GHI DÒNG 2 ĐÚNG (22/22 PASS)

Kiểm reseed lúc 23:53Z (verify-t5-203.py) và sau-repair lúc 23:57:10Z bằng
`hidden_files/round203-t5/verify-t5-203-post.py` — **22/22 PASS**.

**Reseed (trước repair):**
- Dòng thời gian (boot 8ea1f5e3, btime 23:06:56Z): 23:07:37Z dpkg.log reset
  2 dòng `startup packages configure`; 23:07:59Z dpkg-state.txt reseed 890 →
  784 dòng (40.401 B) + ledger fold về 1 dòng (mtime 23:07:59.442Z);
  23:53Z verify: live `dpkg-query -W` = 784 gói, snapshot = 784 dòng,
  **set (tên, phiên-bản) bằng nhau tuyệt đối** (only-live = [] only-snap = []),
  cả 784 dòng đều `install ok installed`.
- Reseed không sinh delta line: thay đổi 890 → 784 dòng mà ledger không append
  do reseed (chỉ fold trong preflight) = reseed silenced đúng thiết kế — lần
  thứ ba liên tiếp (sau #130, #133).
- `/var/log/apt` không tồn tại trên boot #135 trước repair (như #130/#133 —
  apt chưa chạy lần nào trên boot này trước repair của watcher-203).

**Repair #135:**
| Kiểm | Thực đo | Kết quả |
|---|---|---|
| Ledger | 2 dòng, 5.016 B, md5 `55ebe9d2` | PASS |
| Dòng 1 | byte-identical với bản compacted đã lưu trước repair (ts 1795814889, added 173) | PASS |
| Dòng 2 ts | 1795823718 = 23:55:18Z (repair xong 23:55:18Z — hook post-invoke cuối chạy cùng giây với poll1) | PASS |
| Dòng 2 added / removed | 106 / 0, không có webkit | PASS |
| Dòng 2 ⊆ dòng 1 | overlap 106/106 | PASS |
| Apt log repair | `round203-t56/t5-postboot-repair-apt-8ea1f5e3.log`, 51.174 B; 108 Setting up − 2 upgrade (libelf1t64, libssh-4) = 106; dòng 2 == tập mới KHỚP TUYỆT ĐỐI (missing = [] extra = []) | PASS |
| Tập 106 gói | giống hệt tập repair #133/#134 (diff = []) — **lần thứ năm liên tiếp** cùng tập NEED + deps (#129/#130/#133/#134/#135) | PASS |
| Snapshot | 784 → 890 dòng; live `dpkg-query -W` = 890, set (tên, phiên-bản) bằng nhau tuyệt đối; cả 890 dòng `install ok installed` | PASS |
| dpkg.log | 2 → 777 dòng; dòng cuối `2026-11-27 23:55:18 status installed libc-bin:amd64 2.39-0ubuntu8.12` | PASS |
| Journal intent/fold từ btime #135 | 0 dòng | PASS |

- **Dòng thời gian repair:** watcher-203 START 23:53:07Z (pid 296433, end
  02:35:51Z) → trigger 23:53:07Z (boot_age 2.771 s, frozen 2.730 s, dpkg_lines
  2; verify form-B exit=1 trước) → apt install (timeout 1800, pid 297250) →
  hook recorder append dòng 2 lúc 23:55:18Z → poll1 + FLAG-WRITTEN 23:55:18Z
  (mode=repair-som-quyet-h, poll=1, old=bd22dffd) → POSTBOOT_PASS 23:55:18Z
  (dpkg 777, cache 108, lists 75). Toàn bộ repair chỉ ~2 phút (nhanh nhất từ
  trước tới nay — cache apt ấm / cùng tập gói; không phải dấu hiệu lỗi: mọi
  con số cuối đều khớp tuyệt đối).
- **T56-203 đã ghi POSTBOOT_PASS #135** (23:55:18Z, poll=1 — T5 đọc trực tiếp
  file này); T5 chỉ đối chiếu ledger/apt log/snapshot, không lặp lại phần
  postboot của T56.
- **Số hiệu repair là #135** (boot hiện tại là #135; nếu parent xác nhận boot
  8ea1f5e3 = #135 thì repair này là #135; nội dung xác minh không đổi).

## §5. Findings F-203-T5-n

- **F-203-T5-1 (chính): repair #134 ghi dòng 2 ĐÚNG — caveat (r)-202 được xác
  minh độc lập.** Tái dựng từ apt log 108 − 2 = 106, tập giống hệt #130/#133,
  dòng compacted sau fold mang đúng ts 1795814889 + added 173.
- **F-203-T5-2: fold 2 → 1 lúc 21:21:34Z ĐÚNG THEO NỘI DUNG.** Tái fold bằng mã
  host thật trên đúng input tiền-fold cho ra compacted ts 1795812631, added
  173; tái fold bước sau #134 byte-identical với ledger. Lần đầu tiên fold
  được đối chiếu bằng tái fold trên đúng input tiền-fold (không chỉ so md5
  với bản cũ — md5 đổi là đúng vì ts đổi).
- **F-203-T5-3: reseed trên boot #135 silenced ĐÚNG** (890 → 784, live ==
  snapshot 784/784, ledger không append do reseed). Lần thứ ba liên tiếp.
- **F-203-T5-4: repair #135 ghi dòng 2 ĐÚNG — 22/22 PASS.** Tập 106 gói giống
  hệt #129/#130/#133/#134 — lần thứ năm liên tiếp cùng tập NEED + deps.
  POSTBOOT_PASS #135 CÓ (poll=1, 23:55:18Z).
- **F-203-T5-5 (sai số của chính T5-203, đã sửa):** (i) epoch tham chiếu trong
  verify-post sai (1795821318 = 23:15:18Z thay vì 1795823718 = 23:55:18Z —
  lỗi số học tay, cùng họ F-202-T5-5/F-201-T5-4); (ii) check
  "no-apt-dpkg-running" FAIL giả ở verify lần đầu vì apt của repair #135 đang
  chạy ngay lúc kiểm (23:53Z) — không phải lỗi ledger. Đã sửa (i), chạy lại:
  **22/22 PASS**. Bài học: ghi epoch bằng `date -d` từ timestamp thực đo,
  không tính tay.
- **F-203-T5-6 (quan sát NGOÀI mảng, báo parent — T5 không xác minh nội
  dung):** trong lúc đợt 203 đang chạy, xuất hiện `hidden_files/
  round202-fabricated-0646Z/aggregate-202-fake-0646Z.md` (75.747 B — bằng đúng
  kích thước aggregate 202 thật sau khi parent đóng — 23:51Z) và
  `hidden_files/round202-parent-verify/` (`my142-202.md` + `qq202.py` +
  `qq202.sh`, 23:49Z; tiền tố "qq" trùng đồ giả đợt 199/201). Cả hai xuất hiện
  SAU khi parent đã đóng đợt 202 (aggregate 75.747 B, 23:46:36Z) — dấu hiệu
  tiến trình mạo danh vẫn hoạt động trong lượt này. T5 chỉ ghi nhận sự tồn
  tại + thời gian + kích thước (đọc tên file, không mở nội dung); xử lý thuộc
  parent/T10.

## §6. Đề xuất cho parent (quyết ở aggregate 203)

- (a) Chấp nhận kết luận T5-203: repair #134 ĐÚNG; fold 21:21:34Z ĐÚNG theo nội
  dung; reseed #135 silenced ĐÚNG; repair #135 ĐÚNG (22/22 PASS).
- (b) Giữ nguyên quy tắc giám sát (T5-200 §6(c)): repair append dòng ledger là
  BÌNH THƯỜNG; chỉ báo động khi replay append dòng hoặc repair không append.
  Bổ sung: đối chiếu fold theo NỘI DUNG dòng compacted (added 173 + ts =
  ts repair mới nhất), không so md5 với bản cũ (md5 đổi theo ts là đúng).
- (c) Ghi nhận số hiệu repair đã xong là **#134** (boot bd22dffd) và **#135**
  (boot 8ea1f5e3, ứng viên — chờ parent xác nhận số hiệu boot ở (e)-203);
  cả hai dòng 2 đều đã xác minh. T5-204 kiểm lại nếu host fold dòng 2 #135 về
  1 dòng compacted (dự báo ts 1795823718, added 173, 3.107 B).
- (d) Xem xét F-203-T5-6 (đồ giả đợt 202 xuất hiện 23:49–23:51Z trong lượt
  203) — thuộc parent/T10, không phải mảng T5.
- (e) Không có thay đổi code nào từ T5-203 (chỉ kiểm tra đọc).

## §7. Batch stage

- 1 file mới: `docs/PHASE9_ROUND203_T5_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round203-t5-recorder.txt`
  (NUL-delimited, 1 entry, có byte NUL cuối).
- KHÔNG stage file làm việc trong `hidden_files/round203-t5/` (script kiểm +
  output + bản sao ledger/snapshot/fold — chỉ để tham chiếu, T10 đối chiếu).
- Chờ push: 191–202 = 146/531/401/380 (theo aggregate 202 §14.2) + đợt 203
  (sau khi T10-203 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).

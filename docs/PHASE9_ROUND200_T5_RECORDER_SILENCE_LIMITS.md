# PHASE 9 — ROUND 200 — T5: RECORDER SILENCING — LIMITS

**Đợt:** 200. **Luồng:** T5 — kiểm tra cơ chế silencing của recorder (giao (r)-199).
**Trạng thái:** ĐÃ ĐÓNG. **Kết luận: CƠ CHẾ ĐÚNG — KHÔNG CÓ LỖI.** F-199-T56-9
không phải lỗi: repair #129 ghi ledger dòng 2 là hành vi ĐÚNG THIẾT KẾ, tiền lệ
đợt 168 giống hệt. Không sửa code, không cần fix.

**Nguồn quyết:** aggregate 199 §14.2 (`docs/PHASE9_ROUND199_LIMITS.md`, 86.880 B —
bản đã KHÔI PHỤC, parent CHẤP NHẬN CÓ ĐIỀU KIỆN). Giao (r)-199: kiểm tra cơ chế
silencing của recorder (F-199-T56-9: watcher --repair ghi ledger dòng 2 lần đầu).
**Nguồn đọc:** `docs/PHASE9_ROUND199_T56_INFRA_LOCK_LIMITS.md` §4/§8/§9(l)/§10;
`docs/PHASE9_ROUND198_T56_INFRA_LOCK_LIMITS.md` §4 (ledger #126/#127);
`docs/PHASE9_ROUND168_T5_INFRA_LIMITS.md` §5.3 (tiền lệ repair ghi dòng 2);
`docs/PHASE9_ROUND169_T5_INFRA_LIMITS.md` §5.1 mục 7 (thiết kế silencing);
`/etc/apt/apt.conf.d/90hatch-intent-ledger`;
`/usr/local/sbin/hatch-apt-intent-record`;
`/opt/hatch/runtime-cell/os-intent-ledger.py` (fold);
`hidden_files/round199-t56/` (watcher log, repair apt log, repair log);
ledger + snapshot trực tiếp trên đĩa lúc kiểm (11:39–11:41Z 27/11/2026).
**Hạn cờ:** ~14:00Z 27/11/2026. **Hạn cứng:** 14:35:51Z (END watcher-200).
**Đóng T5:** ~11:42Z. Kiểm tra CHỈ ĐỌC — không chạy apt, không sửa hệ thống.

## §1. Cơ chế silencing được thiết kế thế nào

Recorder là `/usr/local/sbin/hatch-apt-intent-record`, gắn qua hook
`DPkg::Post-Invoke` trong `/etc/apt/apt.conf.d/90hatch-intent-ledger`:

```
DPkg::Post-Invoke { "/usr/local/sbin/hatch-apt-intent-record || true"; };
```

Mỗi lần dpkg chạy xong (apt gọi dpkg transitively), hook snapshot
`dpkg-query -W` vào `/var/lib/hatch/os-intent/dpkg-state.txt` (atomic tmp+rename);
nếu snapshot khác bản trước, append MỘT dòng JSON delta vào
`/var/lib/hatch/os-intent/ledger.jsonl` (added/removed theo tên gói, trạng thái
`installed`); nếu giống thì thoát 0 không ghi gì. Append TRƯỚC rename snapshot:
crash giữa hai bước chỉ trùng dòng, không mất dòng (reapply idempotent).

**Silencing — CHỈ có trong replay của host, KHÔNG có trong watcher --repair:**

- Replay (host-side os-intent replay) silence recorder bằng cách đặt
  `HATCH_OS_INTENT_DIR=/proc/…-silenced` — thư mục không tồn tại nên recorder
  thoát 0 lặng (`[ -d "$INTENT_DIR" ] || exit 0`); mỗi apt run của replay mang
  `reseed_hook` (reseed snapshot trong lock của chính nó). Nguồn: T5-169 §5.1
  mục 7 + T5-178 §151 ("replay #92 KHÔNG ghi thêm dòng mới — recorder bị
  silence trong replay").
- Watcher `--repair` (`apps/web/scripts/vcut-webkit-postboot-check.sh`,
  dòng 770/772) chạy apt THƯỜNG, không silence gì cả:

```
DEBIAN_FRONTEND=noninteractive timeout 1500 apt-get update >>/tmp/l8-postboot-apt.log 2>&1
DEBIAN_FRONTEND=noninteractive timeout 1800 apt-get install -y --no-install-recommends $MISS_PKGS >>/tmp/l8-postboot-apt.log 2>&1
```

  Không có `HATCH_OS_INTENT_DIR=…`, không có `-o DPkg::Post-Invoke=…` trong
  script (grep toàn file: 0 kết quả cho `HATCH_OS_INTENT|DPkg::Post|silenc`).
  Hook config cũng không có điều kiện nào. **Đây là cố ý, không phải thiếu sót:**
  installs của repair là intent thật, PHẢI ghi vào ledger để host reapply sau
  rebuild rootfs; chỉ installs của replay mới được silence (vì replay ĐANG
  reapply lại chính ledger đó — ghi lại là trùng lặp). T5-168 §5.3 nói thẳng:
  "Recorder (không bị silence ngoài replay) đã append dòng ledger thứ 2 …".

**Fold (compaction):** host fold (`/opt/hatch/runtime-cell/os-intent-ledger.py`,
hàm `fold`, dòng ~197–215) gộp mọi dòng thành 1 dòng duy nhất
`{"compacted":true, "ts": <ts mới nhất>, "added": <hợp các added trừ removed>,
"removed": <còn lại>}`; re-add là no-op. Fold chạy trong replay (trước vòng lặp
và sau payload) và ở receipt fast-path (T5-169 §5.1).

## §2. Dòng 2 của ledger có thật không, do repair nào ghi

**CÓ THẬT — nhưng nay không còn tồn tại dưới dạng dòng riêng (đã fold).**
Bằng chứng hai lớp:

- (a) Đọc đồng thời của T56-199 (§4, viết ~07:15Z, khi 2 dòng còn trên đĩa):
  dòng 1 ts 1795741205 (= 01:00:05Z — lúc repair #127 xong), added 173,
  removed 0; **dòng 2 ts 1795763286 (= 07:08:06Z — lúc repair #129), added 106,
  removed 0** — gồm 7/11 NEED + deps, KHÔNG có webkit.
- (b) Tái dựng độc lập từ apt log của repair #129
  (`hidden_files/round199-t56/t5-postboot-repair-apt-e6e070b8.log`, 707 dòng,
  copy ra khỏi /tmp ngay sau --repair theo F-173-T5-9):
  108 dòng `Setting up <pkg>` − 2 upgrade gói đã cài sẵn
  (`libelf1t64` 0.190-1.1ubuntu0.1 → 0.190-1.1ubuntu0.2,
  `libssh-4` 0.10.6-2ubuntu0.5 → 0.10.6-2ubuntu0.6 — `Unpacking … over …`)
  = **đúng 106 tên gói mới**; cả 106 đều nằm trong added của dòng compacted
  hiện tại (missing = []). Số 106 KHỚP TUYỆT ĐỐI với con số T56-199 ghi.
- Khớp thời gian: watcher log `EARLY-REPAIR TRIGGER 06:54:08Z` →
  `--repair exit=0` → `postboot poll1 … (hoàn tat 2026-11-27T07:08:07Z)` →
  `FLAG-WRITTEN … 07:08:07Z mode=repair-som-quyet-h poll=1`; ts dòng 2
  1795763286 = 07:08:06Z = đúng lúc apt install kết thúc, hook post-invoke
  cuối cùng chạy. `dpkg-state.txt` 828 dòng (mtime 05:35Z) → 890 dòng
  (mtime 07:08:06Z) — cùng giây với ts dòng 2.
- Dòng 2 KHÔNG chứa webkit: NEED 11 gói không gồm libwebkitgtk
  (T56-199 §2: `dpkg -l | grep -ci webkit = 0` trên #129) — đúng thiết kế.

**Fold sau đó:** ledger hiện tại (kiểm 11:39–11:41Z) chỉ còn **1 dòng**,
3.107 B, mtime **2026-11-27 08:46:57Z**, md5 `be19d606fdf52b11582913a25cb3ed3f`:
`{"v":1,"ts":1795763286,"event":"dpkg-post-invoke","compacted":true,
"added":[173 tên],"removed":[]}` — ts = ts mới nhất (dòng 2), added = hợp
(173 = |dòng 1 ∪ dòng 2|; dòng 2 ⊆ dòng 1 nên tổng giữ 173, re-add no-op đúng
như fold thiết kế). Actor fold lúc 08:46:57Z (sau watcher-199 END 08:35:51Z)
**không xác định được từ log trong cell** (journalctl 08:40–08:55Z grep
intent/compact/fold/preflight: 0 dòng; /var/log không có trace os-intent) —
kết quả fold đã xác minh, actor chưa xác minh; không ảnh hưởng kết luận.

## §3. Silencing có đang hoạt động đúng không — kiểm đối chứng

Ba đối chứng độc lập, đều đúng. Script kiểm + output:
`hidden_files/round200-t5/verify-t5-200.py` (+ `.out`) — **12/12 PASS**.

### (i) Replay bị silence ĐÚNG — replay #128 không ghi ledger

Replay #128 chạy thật 05:35:47–05:50:38Z (172 install, dpkg 1.510 dòng,
libwebkitgtk-6.0-4 + libjavascriptcoregtk-6.0-1 được cài bởi replay).
Ledger lúc watcher-199 spawn (~05:48Z) VẪN 1 dòng, ts 1795741205 không đổi
(T56-199 §0) — 172 installs của replay KHÔNG append dòng nào. Đúng thiết kế.

### (ii) Repair KHÔNG bị silence — installs của repair ĐƯỢC ghi

- Repair #127 → dòng 1 (ts 1795741205 = 01:00:05Z, added 173).
- Repair #129 → dòng 2 (ts 1795763286 = 07:08:06Z, added 106 — tái dựng §2).
- Tiền lệ đợt 168: repair #75 append dòng 2 lúc 06:01:38Z, 106 added
  (T5-168 §5.3) — CÙNG CON SỐ 106 vì cùng tập NEED + deps. F-199-T56-9 là
  lần thứ hai hiện tượng này xảy ra, không phải lần đầu.

### (iii) Reseed trên boot mới bị silence ĐÚNG — boot #130 (đang chạy)

Boot hiện tại `c073c8bb` (btime 1795778501 = 11:35:01Z; số hiệu #130 thuộc
T01/T2-200 — T5 không tự chứng nhận). `dpkg-state.txt` được reseed
11:36:04Z: 890 dòng (#129) → **784 dòng**, mtime 11:36:04Z = boot+63s;
`dpkg-query -W` live lúc 11:41Z **KHỚP 100% snapshot (diff 0 dòng)**; ledger
**KHÔNG append** (mtime vẫn 08:46:57Z, vẫn 1 dòng, md5 không đổi). Một thay đổi
trạng thái 890 → 784 dòng mà không sinh delta line nào = reseed silenced
đúng thiết kế. `/var/log/apt` chưa tồn tại, dpkg.log 2 dòng (mtime 11:35:41Z)
— replay #130 chưa cài gì; watcher-200 đang chạy (pid 7406, START 11:39:46Z,
END 14:35:51Z), 0 proc apt/dpkg lúc kiểm.

**Không có record nào bị silence nhầm, không có record nào đáng lẽ silence
mà không bị:** mọi apt run trên #128/#129/#130 đều phân loại đúng (replay →
silence; repair → ghi; reseed → silence).

## §4. Vì sao F-199-T56-9 tưởng là "lần đầu" — gốc của hiểu lầm

Giả định "repair không chạm ledger" (T56-199 §10 tự nhận là SAI) bắt nguồn
từ cách đọc sai của T56-198 §4: ledger "VẪN 1 dòng" trên #126/#127. Nhưng
chính §4 đó ghi **ts đã đổi**: trên #127, mtime 00:35:33Z, ts **1795738927
(= 00:22:07Z — lúc --repair #126 hoàn tất)**, added vẫn 173. Một ts đổi theo
giờ repair hoàn tất + added không đổi = repair #126 ĐÃ append dòng rồi host
fold gộp lại thành 1 dòng (re-add no-op) — "còn 1 dòng" che mất lần ghi.
Tương tự, dòng 1 ts 1795741205 = giờ repair #127 hoàn tất (01:00:05Z).
**Đính chính T56-198 §4:** câu "KHÔNG có dòng nào cho replay #126/#127
(repair không chạm ledger)" là SAI về vế repair — đúng ra: "repair #126/#127
ĐỀU ghi ledger (ts đổi theo giờ repair xong), rồi fold gộp về 1 dòng; replay
#126/#127 không ghi (đúng, vì replay bị silence)". T10-200/T2-200 lưu ý khi
đếm: ts của dòng compacted là ts của lần ghi MỚI NHẤT (repair), không phải
ts của boot hay của replay.

## §5. Findings F-200-T5-n

- **F-200-T5-1 (chính): cơ chế silencing của recorder ĐÚNG — KHÔNG CÓ LỖI.**
  Thiết kế: silence CHỈ replay (host) qua `HATCH_OS_INTENT_DIR=/proc/…-silenced`
  + reseed_hook; repair của watcher KHÔNG silence (cố ý — installs của repair
  là intent phải ghi). Dòng 2 (repair #129, 106 added) đã xác minh tuyệt đối
  bằng apt log; đã fold về 1 dòng compacted (added 173, ts 1795763286) lúc
  08:46:57Z. Không cần fix, không sửa code.
- **F-200-T5-2:** tiền lệ đợt 168 (repair #75 append dòng 2, 106 added) đã
  ghi rõ cơ chế này — F-199-T56-9 chỉ là lần lặp lại, không phải hiện tượng
  mới. T56-200/T5 các đợt sau: đừng ngạc nhiên khi repair append dòng mới;
  chỉ báo động khi REPLAY append dòng (silence hỏng) hoặc REPAIR không append
  (ghi hỏng).
- **F-200-T5-3:** fold 08:46:57Z gộp dòng 2 vào dòng compacted — actor fold
  không xác định được từ cell (không log). Không ảnh hưởng số đếm; T2-200
  đếm ledger theo nội dung dòng compacted (added 173), không đếm số dòng.
- **F-200-T5-4 (caveat thời gian):** kiểm này chốt lúc 11:41:16Z. Watcher-200
  đang chạy trên boot #130 dạng B (dpkg 2 dòng, đóng băng từ 11:35:41Z);
  early-repair deadline boot+15' = 11:50:01Z — nếu watcher-200 repair #130,
  ledger sẽ append dòng 2 MỚI (ts ~12:0xZ) rồi có thể fold lại. Đó là hành vi
  đúng thiết kế, không phải vi phạm; T5-201 kiểm lại nếu cần.
- **F-200-T5-5 (sai số nhỏ của chính T5-200, đã sửa ngay):** lần check đầu
  bằng python in-line báo `libjavascriptcoregtk-6.0-1` "không có" trong added
  — lỗi quoting của chính câu lệnh (`'| libjavascriptcoregtk…'` thành một
  chuỗi), không phải lỗi dữ liệu. Kiểm lại bằng grep + list comprehension:
  cả `libjavascriptcoregtk-6.0-1` và `libwebkitgtk-6.0-4` đều CÓ trong added
  (xem verify script — check này nằm trong 12/12 PASS).

## §6. Đề xuất cho parent (quyết ở aggregate 200)

- (a) Chấp nhận kết luận T5-200: cơ chế silencing ĐÚNG, F-199-T56-9 ĐÓNG
  (không phải lỗi; giả định cũ "repair không chạm ledger" bị bác).
- (b) Đính chính T56-198 §4 (xem §4 trên) để các đợt sau không lặp lại
  hiểu lầm.
- (c) Quy tắc giám sát cho T5/T56 các đợt sau: repair append dòng ledger là
  BÌNH THƯỜNG; chỉ báo động khi replay append dòng hoặc repair không append.
- (d) Không có thay đổi code nào từ T5-200 (chỉ kiểm tra đọc).

## §7. Batch stage

- 1 file mới: `docs/PHASE9_ROUND200_T5_RECORDER_SILENCE_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round200-t5-recorder-silence.txt`
  (NUL-delimited, 1 entry).
- KHÔNG stage file làm việc trong `hidden_files/round200-t5/` (script kiểm +
  output — chỉ để tham chiếu, T10 đối chiếu).
- Chờ push: 191–199 = 107/435/333/312 (theo aggregate 199 §14.2) + đợt 200
  (sau khi T10-200 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).

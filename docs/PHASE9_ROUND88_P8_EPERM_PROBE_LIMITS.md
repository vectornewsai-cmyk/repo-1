# PHASE9 ROUND88 P8 — EPERM: probe bền hơn (nợ LIMITS gộp đợt 87 §4 mục 4)

> Luồng P8, đợt 88 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 11/11/2026; làm việc ~08:37–~09:05Z). Nhiệm vụ: làm cơ chế probe
> EPERM bền hơn sau khi probe nền chết 5 lần liên tiếp không rõ lý do.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39, KHÔNG đổi luật retry K8 (5×20 s giữ nguyên).

## 0. Kết quả headline

- **Đã tìm ra bức tranh nguyên nhân (không phải 1 nguyên nhân duy nhất):**
  probe nền v1 chết lặng 5 lần liên tiếp (K8 sau #5, L6 sau #10, M5 sau
  #11, N8 sau #5, O10 sau #9 — đều không có dòng `probe end`), và
  **cả 5 lần chết đều TRƯỚC lần reboot kế tiếp 30–120 phút** — reboot
  không phải (duy nhất) thủ phạm. Không có systemd user bus trong VM
  này (`systemctl --user` fail, không có XDG_RUNTIME_DIR) nên không
  làm được user service; journal/wtmp chỉ giữ đúng 1 boot hiện tại
  nên không chứng minh được ngược lại có reboot trung gian hay không
  (xem §1 — kết luận nào cũng ghi rõ mức chắc chắn).
- **Probe v2 đã xây xong + kiểm thử đầy đủ:** `scripts/probe-eperm-v2.sh`
  (lệnh `once` / `loop` / `status`) — KHÔNG phụ thuộc tiến trình nền
  nào sống giữa các lượt: observer là chính vòng lặp cron (mỗi lượt
  chạy `once` + `status`), log append-only duy nhất có fsync + verify
  tăng byte, heartbeat nguyên tử (tmp+rename), boot marker phân biệt
  chết do reboot với chết do bị dọn phiên, và `status` BIẾN CÁI CHẾT
  thành dữ liệu (ghi dòng `probe DEAD` vào log thay vì im lặng).
- **Kiểm thử xanh:** scratch T1–T5 (5/5, gồm giết probe giữa chừng →
  status báo DEAD đúng 1 lần; giả boot đổi → ghi marker; ghi log lỗi
  → exit 2). Chạy thật: probe v2 #1 (seed) + #2 (loop start) + #3
  (đúng nhịp 10 phút) OK 2/2, `status` ALIVE; vòng lặp production
  16×600 s đang chạy nền tới ~11:29Z. Helper không sửa, chạy lại: gốc
  22/22, port CJS 8/8, port desktop 11/11.
- **Quét lại writeFileSync toàn repo (lúc ~08:47Z): 81 dòng code + 12 dòng
  bản copy release + 54 dòng mẫu trong docs** (xem §4 — con số 99 trong
  nhiệm vụ được đối chiếu đầy đủ). **Không còn đường ghi production
  nào chưa nối**: toàn bộ 81 dòng thuộc các loại đã loại trừ có lý do
  (helper nội bộ, launcher sinh code con, fake-fs/fixture test, test
  ghi tmp, .sh inline). Async `fs.writeFile(` trong thư mục production:
  0 dòng ngoài helper.
- **Sóng EPERM: KHÔNG gặp trong lượt này** (probe v2 #1–#3 OK 2/2,
  08:49–08:59Z) — nhưng KHÔNG tuyên bố "đã hết hẳn": mẫu còn ít, và
  khoảng mù 07:13Z–08:49Z (probe O10 chết → probe v2 chạy) không có
  quan sát nào.
- **Quét 0-byte 24h:** không file dữ liệu nào 0 byte mới (chỉ còn
  `.wtest` 0 byte từ 10/11 10:13Z — marker test, không phải dữ liệu).

## 1. Điều tra: vì sao probe nền chết 5 lần liên tiếp

### 1.1 Dữ kiện (đọc lại log thật, không tin trí nhớ)

| Probe | Mẫu cuối | Chết trong khoảng | Reboot kế tiếp (theo uptime lúc đo) | Chết trước reboot |
|---|---|---|---|---|
| K8 (đợt 83) | #5 18:21Z 10/11 | 18:21–18:31Z | boot ~20:18Z (uptime 27' lúc 20:45Z) | ~2h |
| L6 (đợt 84) | #10 22:18:49Z 10/11 | 22:18–22:28Z | boot ~23:28Z (uptime 11' lúc 23:39Z) | ~60' |
| M5 (đợt 85) | #11 01:21:56Z 11/11 | 01:22–01:32Z | boot ~02:03Z (uptime 35' lúc 02:38Z) | ~30–40' |
| N8 (đợt 86) | #5 03:19:38Z | 03:19–03:29Z | không có uptime lúc 05:52Z (O10 không ghi) | không rõ |
| O10 (đợt 87) | #9 07:13:35Z | 07:13–07:23Z | boot 08:24:39Z (`uptime -s`, chắc chắn) | ~60' |

Cả 5 lần: log dừng giữa chừng, không dòng `probe end`, không dòng lỗi,
không dòng dở — tiến trình biến mất lặng. Tất cả đều chạy bằng
`setsid + nohup` (tách session, miễn SIGHUP) từ một lệnh exec của phiên
subagent. Thời gian sống: K8 ~50', L6 ~90', M5 ~100', N8 ~40', O10 ~80'.

### 1.2 Các giả thuyết đã kiểm tra

1. **Reboot giết probe — ĐÚNG MỘT PHẦN, KHÔNG ĐỦ.** Reboot chắc chắn
   giết probe (K8: /tmp bị xóa là bằng chứng) và VM này reboot rất
   thường xuyên (ít nhất 4 lần trong ~14h: ~20:18Z, ~23:28Z, ~02:03Z,
   08:24:39Z ngày 10–11/11). Nhưng 4/5 lần chết (L6, M5, O10 chắc chắn;
   K8 cũng vậy) xảy ra 30–120 phút TRƯỚC lần reboot kế tiếp. Reboot
   không giải thích được các cái chết đó — trừ khi có thêm reboot trung
   gian không được ghi lại. Kiểm tra khả năng này: `journalctl
   --list-boots` chỉ có ĐÚNG 1 boot (hiện tại), `last -x reboot` chỉ có
   1 dòng, wtmp bắt đầu 08:24:49Z — journal/wtmp trên VM này không
   tồn tại qua reboot nên **không thể chứng minh hay bác bỏ reboot
   trung gian từ log**. Tuy nhiên với O10: nếu có reboot lúc ~07:20Z
   thì phải có TỚI 2 reboot trong ~70 phút (07:20Z + 08:24Z) — có thể
   nhưng kém parsimonious hơn giả thuyết dưới.
2. **OOM-killer — KHÔNG có bằng chứng.** `dmesg | grep -i oom` trống
   (dmesg cũng không trả gì — có thể không có quyền đọc); VM 6 GB,
   probe chỉ là bash + head/stat (vài MB). Loại trừ thực tế.
3. **Phiên exec bị dọn (session/cgroup reaping) — GIẢ THUYẾT MẠNH NHẤT,
   chưa chứng minh tuyệt đối.** `setsid` tách process group/session
   nhưng KHÔNG thoát khỏi cgroup của phiên exec; khi runtime dọn phiên
   (sau khi agent turn kết thúc + GC), toàn bộ cây tiến trình trong
   cgroup có thể bị giết bất kể setsid/nohup. Khớp với dữ kiện: cả 5
   lần chết đều SAU khi agent sinh ra nó đã xong việc; độ trễ thay đổi
   (N8 ~5–15', L6 ~75', O10 ~70', M5 ~50' sau khi agent xong) — đúng
   mẫu GC không theo lịch cố định. **Thí nghiệm kiểm chứng trong lượt
   này:** sleeper `setsid + nohup` ghi heartbeat mỗi 60 s (PID 4007,
   PPID 1) — sống tốt trong lúc phiên P8 còn hoạt động (beat #1–#10,
   08:41–08:50Z, xem `hidden_files/round88-p8/heartbeat-test.log`).
   Thí nghiệm này chứng minh nền SỐNG ĐƯỢC trong phiên đang chạy; nó
   sẽ được kill ở cuối lượt P8 này (dọn sạch) — cái chết sau khi phiên
   kết thúc (nếu có) là bằng chứng bổ sung cho giả thuyết, nhưng lượt
   sau mới đọc được (xem §5 mục 4).
4. **Lỗi ghi log làm probe chết lặng — KHÔNG khớp.** Probe v1 ghi log
   bằng `>>` không fsync; nếu ghi log fail thì script vẫn chạy tiếp
   (không `set -e`), chỉ mất dòng log — nhưng ở đây cả tiến trình biến
   mất (ps không còn). Hơn nữa các dòng log còn lại đều nguyên vẹn,
   không có dòng dở. Loại trừ.
5. **systemd timer/dịch vụ dọn tiến trình lạ — KHÔNG thấy.**
   `systemctl list-timers`: chỉ `home-assistant-ensure.timer` chạy mỗi
   phút (dịch vụ của host, không liên quan) + các timer hệ thống ở
   trạng thái `-` (không chạy). Không có cron.d nào dọn process.

### 1.3 Kết luận điều tra (mức chắc chắn trung thực)

- **Chắc chắn:** probe v1 chết lặng 5/5 lần, luôn trước reboot kế tiếp
  (trừ N8 không đủ dữ kiện uptime); reboot một mình không giải thích hết.
- **Nhiều khả năng nhất:** runtime dọn phiên exec giết cả cây tiến trình
  (kể cả setsid+nohup) sau khi agent turn kết thúc, với độ trễ GC thay đổi.
- **Chưa chứng minh tuyệt đối:** không loại trừ được reboot trung gian
  không ghi log (journal/wtmp volatile). Vì vậy thiết kế v2 KHÔNG cược
  vào một giả thuyết: nó bền với CẢ HAI (chết do dọn phiên lẫn reboot)
  vì không phụ thuộc tiến trình nền nào sống giữa các lượt — xem §2.

## 2. Probe v2: thiết kế

File: `scripts/probe-eperm-v2.sh` (repo `scripts/` đã có tiền lệ .sh:
`build-release.sh`, `ci-local.sh`). Một file duy nhất, bash thuần,
không phụ thuộc ngoài `coreutils` (`sync [FILE]` có hỗ trợ — đã kiểm
`sync --help`).

### 2.1 Nguyên tắc

- **Observer là vòng lặp cron, không phải tiến trình nền.** Mỗi lượt
  (3h/lượt) chạy `once` + `status` — tối thiểu 1 mẫu/lượt, cộng thêm
  vòng `loop` foreground trong lúc lượt đang chạy. Không còn trạng thái
  nào phụ thuộc vào việc một tiến trình nền sống sót giữa các lượt.
- **Mọi mẫu được fsync ngay.** Append log xong gọi `sync "$LOG"` +
  verify log tăng đúng số byte kỳ vọng — nếu chính việc ghi log bị
  0-byte lặng thì `once` trả exit 2 và báo ra stderr (lỗi ghi log trở
  thành bằng chứng, không còn im lặng).
- **Cái chết trở thành dữ liệu.** Heartbeat (tmp+rename nguyên tử +
  fsync file và thư mục) ghi `pid/ts/boot/n`. `status` so tuổi heartbeat
  với ngưỡng 900 s (> 1 chu kỳ loop 600 s + dự phòng): nếu cũ, ghi đúng
  1 dòng `probe DEAD detected by status (last #N at T, age ...s, no
  probe end since last start)` vào log — khoảng trống từ nay có dấu vết.
- **Boot marker.** `boot_id` từ `/proc/sys/kernel/random/boot_id`
  (đổi mỗi lần boot) được ghi tắt 8 ký tự trong mỗi mẫu; nếu boot trong
  heartbeat khác boot hiện tại thì ghi dòng `=== boot changed A -> B
  (reboot detected, uptime since ...) ===` — phân biệt chết do reboot
  với chết do bị dọn phiên.
- **Log duy nhất, append-only, có xoay.** `hidden_files/eperm-probe-v2.log`
  (không per-round nữa — lịch sử liên tục qua các lượt và reboot);
  > 1 MiB thì xoay sang `.1`. Số probe `#N` liên tục qua các lần chạy
  (đọc từ heartbeat, +1 mỗi `once`).

### 2.2 Lệnh

```
bash scripts/probe-eperm-v2.sh once            # 1 mẫu; exit 0 (fail 1/2 đích là DỮ LIỆU, không phải lỗi chạy), exit 2 nếu ghi log thất bại
bash scripts/probe-eperm-v2.sh loop 16 600     # 16 lần × 10 phút, foreground (chạy trong phiên agent đang sống)
bash scripts/probe-eperm-v2.sh status          # exit 0 ALIVE, 1 STALE/DEAD, 2 chưa chạy bao giờ
```

Biến môi trường cho test: `EPERM_PROBE_LOG`, `EPERM_PROBE_HEARTBEAT`,
`EPERM_PROBE_TMPD`, `EPERM_PROBE_WSD`. Thư mục probe ổn định duy nhất:
`/tmp/eperm-probe-v2` + repo `.eperm-probe-v2` (thay cho
`.eperm-probe-k8/l6/m5/n8/o10` rời rạc; mẫu `.eperm-probe*` đã nằm trong
danh sách loại trừ khi đếm writeFileSync).

### 2.3 Quy trình cho các lượt sau (đề xuất vào checklist vòng lặp)

Mỗi lượt, luồng EPERM (hoặc parent ở closing) chạy 2 lệnh, ghi kết quả
vào log lượt:

```
bash scripts/probe-eperm-v2.sh status   # ALIVE hay DEAD? (DEAD thì log đã có dòng ghi nhận)
bash scripts/probe-eperm-v2.sh once     # +1 mẫu
# + chạy loop foreground trong lúc làm việc: setsid nohup bash scripts/probe-eperm-v2.sh loop 16 600 &
```

Không cần tin loop nền còn sống — `status` ở lượt sau sẽ nói.

## 3. Kiểm chứng đã làm (số thật)

### 3.1 Kiểm thử script trên đường scratch (env override, 5/5 PASS)

| Test | Cách làm | Kết quả |
|---|---|---|
| T1 `once` ×2 | log/heartbeat scratch | probe #1, #2 OK 2/2, counter tăng đúng, heartbeat `n=2`, exit 0 |
| T2 `status` | ngay sau T1 | ALIVE, age 1 s, exit 0 |
| T3 giết probe | `loop 16 60` nền, SIGTERM sau 1 mẫu (08:48:43Z) | loop chết thật (ps không còn sau ~60 s — bash hoãn SIGTERM tới khi `sleep` xong, hành vi chuẩn); giả heartbeat cũ 20' → `status` báo **DEAD exit 1, ghi đúng 1 dòng DEAD**; `status` lần 2 không ghi thêm (đúng 1 dòng) |
| T3c hồi phục | `once` sau DEAD | probe #5 OK 2/2, counter tiếp tục, `status` lại ALIVE exit 0 |
| T4 boot đổi | ghi boot giả `deadbeef` vào heartbeat rồi `once` | ghi dòng `=== boot changed deadbeef -> d473b560 (reboot detected, uptime since 2026-11-11 08:24:39) ===` |
| T5 ghi log lỗi | LOG nằm dưới 1 file thường (`afile/sub/log`) | stderr `cannot append`, exit 2 (đúng kỳ vọng) |

Bẫy bắt được trong lúc test: `grep 'probe end'` trong `status` match
nhầm cả dòng DEAD (dòng DEAD chứa cụm "no probe end since last start")
→ đã sửa thành match `=== probe end` chính xác; và `kill -TERM` vào
PID setsid không giết ngay bash đang chờ `sleep` (bash hoãn signal) —
ghi chú ở đây để lượt sau không tưởng kill là chết ngay.

### 3.2 Chạy thật (đường production, log thật)

- Seed: `once` → **probe v2 #1, 08:49:48Z, OK 2/2** (5000 + 5000 byte),
  `status` ALIVE (age 2 s), exit 0.
- Loop production: `setsid nohup bash scripts/probe-eperm-v2.sh loop 16 600`
  (PID 13674), bắt đầu 08:49:50Z → **probe #2 OK 2/2** ngay lúc start,
  **probe #3 OK 2/2 lúc 08:59:51Z (đúng nhịp 10 phút)**; `status` lúc
  09:00:16Z ALIVE (age 26 s); chạy tới ~11:29Z (16 lần). Lượt cron kế
  (18:35 +07 = 11:35Z) chạy `status` sẽ thấy hoặc ALIVE hoặc DEAD có
  ghi nhận — cả hai đều là dữ liệu. **Sóng EPERM: không gặp trong 3 mẫu
  này** — chỉ là "không gặp trong lúc đo", KHÔNG tuyên bố hết hẳn.
- **Thí nghiệm heartbeat song song:** sleeper PID 4007, beat mỗi 60 s,
  **#1–#20 (08:41:24–09:00:26Z), 19 phút quan sát, đều đúng giờ**,
  process PPID 1 — nền sống tốt trong lúc phiên P8 còn hoạt động. Đã
  kill ở cuối lượt (dọn sạch). Lưu ý trung thực: 19 phút ngắn hơn
  40–100' tuổi thọ của probe v1 nên thí nghiệm này chỉ chứng minh nền
  sống được TRONG phiên đang chạy, chưa chứng minh được chuyện gì xảy
  ra sau khi phiên kết thúc (vì đã kill chủ động trước đó).

### 3.3 Helper retry (không sửa, chỉ chạy lại)

- Gốc `test_round83_k8_eperm_retry.mjs`: **22/22 PASS**.
- Port CJS `server/eperm-retry.test.cjs`: **8/8 PASS**.
- Port desktop `epermRetry.test.cjs`: **11/11 PASS**.
- Luật K8 (5×20 s) không đụng.

### 3.4 Quét 0-byte 24h

Quét toàn repo (loại node_modules/.venv*/chrome-userdata/dist-web/
release): chỉ còn **`.wtest` 0 byte từ 10/11 10:13Z** — marker test
(không phải file dữ liệu, không phải do lượt này; không sinh lại).
Các hit 0-byte còn lại toàn là file tạm của vite trong
`node_modules/.vite` (noise build, bình thường). Không file dữ liệu
nào 0 byte mới.

## 4. Quét lại writeFileSync toàn repo (lúc ~08:47Z)

Đếm bằng `rg`, phương pháp O10 (loại node_modules/dist/release/
bundled-server/.venv*/chrome-userdata/.eperm-probe*), cộng thêm đếm
riêng docs + bản copy release theo cách đếm của parent closing.

| Thư mục | Dòng `writeFileSync` | Thành phần |
|---|---|---|
| apps/web/scripts | 39 | helper 2 + freeze-dist.test 6 + 5 launcher 22 + test_round83 4 + .sh 5 |
| apps/web/src | 5 | test fixture tmp (effectCanvas 3 + gopTail 2) |
| apps/web/e2e | 0 | — |
| server | 11 | outputQA 1 (fixture cố tình) + failpath 2 + integration 1 + test_hardening.sh 1 + helper 1 + helper-test 4 + gpuencode 1 (JSON hỏng cố tình) |
| apps/desktop/src | 25 | test fixture tmp 24 + helper 1 |
| apps/desktop/scripts | 0 | — |
| mcp-server/src | 1 | migrateRender.test.ts 1 |
| cli/src | 0 | — |
| packages | 0 | — |
| benchmarks | 0 | — (bench O7 đã nối ở closing đợt 87) |
| **Tổng code** | **81** | |
| Bản copy release-round55-l4 | 12 | bản unpack generated, không phải source |
| Mẫu code trong docs/*.md | 54 | tài liệu, không chạy |
| **Tổng rộng nhất** | **147** | 81 + 12 + 54 |

**Đối chiếu con số 99 trong nhiệm vụ:** 81 + 12 + 6 (dòng trong file
`.sh` tính riêng) = 99 — nhưng 6 dòng `.sh` ĐÃ nằm trong 81 (5 ở
apps/web/scripts + 1 ở server), nên 99 đếm trùng 6 dòng `.sh`; cộng
thẳng không trùng là 81 + 12 = 93. Chênh lệch còn lại so với 73 dòng
cuối đợt 87 (82 của O10 − 9 closing đã nối) là do các luồng đợt 87
muộn/88 thêm file trong lúc đếm (cây đang bị 8–10 luồng sửa đồng thời
nên mọi con số đều là snapshot lúc đo). **Con số đáng tin là bảng phân
loại trên, không phải hiệu số.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối.** Toàn bộ
81 dòng code thuộc đúng các loại M5/N8/O10 đã loại trừ có lý do:
helper nội bộ (4), launcher sinh code con (22 — nối vào sẽ làm code con
gọi helper mà không import → gãy), fake-fs/fixture cố tình trong test
(~28), test ghi fixture vào tmp (27 — EPERM ở đây chỉ làm test fail rõ
ràng, không ghi lặng dữ liệu người dùng), chuỗi text trong file `.sh`
(6 — `node -e` inline / ghi kết quả đo một lần). Async: `fs.writeFile(`
trong các thư mục production (server/bridge/src, server/render/src,
apps/desktop/src, mcp-server/src, cli/src, apps/web/src, packages/*/src):
**0 dòng** ngoài helper — khớp kết luận N8/O10.

## 5. Giới hạn trung thực / nợ mở

1. **EPERM KHÔNG được tuyên bố là đã hết.** 3 mẫu OK trong lượt này
   không chứng minh gì; khoảng mù 07:13Z–08:49Z không có quan sát.
2. **Nguyên nhân chết của probe v1 chưa chứng minh tuyệt đối** (§1.3):
   giả thuyết mạnh nhất là runtime dọn phiên exec, nhưng không loại trừ
   được reboot trung gian không ghi log. Probe v2 được thiết kế để bền
   với cả hai — nhưng nếu VM tiếp tục reboot mỗi ~3–6h thì mọi probe
   nền đều sẽ chết theo reboot, và v2 chỉ đảm bảo (a) mẫu trong phiên
   không mất, (b) cái chết được ghi nhận, (c) lượt sau tự hồi phục.
3. **Mật độ mẫu giữa các lượt vẫn thưa.** V2 cho ≥1 mẫu/lượt (3h) + mẫu
   foreground trong lúc lượt chạy; sóng ~15 phút rơi vào khoảng trống
   giữa các lượt vẫn có thể lọt. Muốn phủ liên tục thì cần cron riêng
   mỗi 10 phút chạy `once` — **đây là việc của parent/main chat quyết
   và tạo (tạo scheduled job nằm ngoài quyền luồng này); P8 KHÔNG tự
   tạo cron**. Nếu parent duyệt, lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài giây,
   không giữ tiến trình nền).
4. **Thí nghiệm heartbeat PID 4007 đã xong:** 20 beat (08:41:24–
   09:00:26Z), đều đúng giờ, đã kill ở cuối lượt (dọn sạch). Nó chỉ
   chứng minh nền sống được TRONG phiên đang chạy (19 phút quan sát,
   ngắn hơn 40–100' tuổi thọ probe v1) — chưa chứng minh được chuyện
   gì xảy ra sau khi phiên kết thúc.
5. **Loop production PID 13674** chạy tới ~11:29Z rồi tự kết thúc bằng
   dòng `probe end` (nếu sống sót) hoặc chết lặng (nếu bị dọn/reboot)
   — lượt sau đọc `status` để biết. Không chạy lại loop trong lượt này
   sau khi nó kết thúc.
6. **Retry 5×20 s KHÔNG qua được sóng dài ~15 phút** (luật K8 giữ
   nguyên, không đụng).
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. **Không thêm i18n key** (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `scripts/probe-eperm-v2.sh` — probe v2 (`once` / `loop` / `status`,
  fsync + verify, heartbeat nguyên tử, boot marker, phát hiện DEAD).
- `docs/PHASE9_ROUND88_P8_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round88-p8-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round88-p8/`
(log luồng `../round88-p8.md`; `heartbeat-test.log` — thí nghiệm
sleeper PID 4007).
Log probe v2 (KHÔNG stage, append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat`.
Script test scratch: `/tmp/p8-scratch/` (không stage — công cụ một lần;
kết quả ghi trong LIMITS này §3.1).

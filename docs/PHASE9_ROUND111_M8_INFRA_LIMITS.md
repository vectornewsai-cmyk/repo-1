# PHASE9_ROUND111_M8_INFRA_LIMITS — Hạ tầng: postboot sau reboot #40 + chuẩn hóa protocol vite lock + dọn vite mồ côi

> Luồng M8, đợt 111, lượt cron 12:35 +07 14/11/2026 (bắt đầu ~05:38Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 110 §10 mục 9–10 (vite lock không owner + 2 vụ vite
> mồ côi; WebKit sau reboot — replay ~17 phút).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. Chỉ sửa 1 script
> harness trong repo (postboot-check: cập nhật tham chiếu boot) + thêm 1
> script helper vite lock. CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Postboot sau reboot #40 — PASS TOÀN BỘ ngay lần đầu (05:39Z,
   ~22 phút sau boot 05:16:36Z, boot_id 73316ed9…).** Wrapper K1 còn,
   đủ 5 lib, plugin GST hệ thống 269 file (bằng debroot — không còn
   chênh +1 như boot #39), đủ 10/10 package apt, `dpkg --audit` sạch,
   không còn tiến trình apt replay. Tức replay đã xong trước 22 phút
   sau boot (khoảng chính xác chưa đo — lần kiểm đầu tiên đã đủ).
2. **WebKit launch OK cả 3 chế độ trên boot #40:** headed qua Xvfb
   với env O8 (3422 ms), headed clean không GST/LD var (931 ms),
   headless clean (2592 ms) — đều WebKit 27.2, eval 2. Không cần vá
   gì; script postboot-check chỉ cập nhật tham chiếu boot #39→#40
   và ghi chú thời gian replay đo được (~17 phút boot #39).
3. **Protocol vite lock đã chuẩn hóa thành script dùng chung
   `apps/web/scripts/vcut-vite-lock.sh`** (spec trong header script):
   mkdir nguyên tử + file owner BẮT BUỘC (thread/pid/port/started/boot,
   ghi qua tmp+mv ngay trong cùng lệnh — không để dir trống như L4);
   stale-recovery kiểm tra đủ 3 điều kiện ps+curl (pid owner chết +
   không vite node trên cổng owner + curl 000) và tuổi tối thiểu;
   release chỉ đúng thread; kill-vite theo pid node thật + kiểm ps +
   curl sau kill. Đã kiểm chứng stale-recovery trên lock dir riêng
   (cả 2 dạng: owner chết + dir trống kiểu L4) — PASS sau khi sửa 1
   bug thật (xem §3.2).
4. **Vite mồ côi hiện tại: 0.** Quét lúc 05:39Z và 05:46Z: `ps` không
   còn tiến trình vite node nào; mọi cổng đã biết (5173/5560/5590/
   5599/5580/5581/5184/8861) đều curl 000. Không phải dọn gì thêm.
5. **watch.ignored ["**/**"] vẫn 0 watch trên cây hiện tại** — xem §4
   (số M8 + đối chứng M6 trên cùng boot #40).
6. **Headroom inotify boot #40: 1657** (trần 63747; cell thấy 5 wd
   lúc yên). Vite thường ~1586 watch (M6 đo r1/r2 trên cây này) nên
   chỉ vừa đúng 1 vite — vite nối tiếp vẫn BẮT BUỘC.
7. **Caveat lớn — production đang đổi giữa đợt:** luồng M1 (đóng E4,
   xem PREREG-M1) sửa `preview.tsx` ngay trong lúc M8/M6 đo:
   9b27abe5 (L1-fix, lúc 05:40Z) → a288feac (05:46:14Z) →
   c4198206 (05:46:19Z) + thêm `lib/playheadHold90R2.ts` (+ test).
   Số đo watch của M8/M6 gắn với md5 tại thời điểm đo (ghi rõ từng
   lần), không gắn với một md5 duy nhất. Watch count không nhạy với
   nội dung preview.tsx (chỉ nhạy với số file: M1 thêm 2 file mới —
   vite thường có thể +~2 watch, không đáng kể).

## 2. Postboot sau reboot #40

### 2.1 Reboot #40

| Boot | `uptime -s` | boot_id |
|---|---|---|
| #39 | 2026-11-14 02:50:48Z | ce518c02… |
| #40 | 2026-11-14 05:16:36Z | 73316ed9-3823-4512-a52d-3cc5d455a6fd |

Gap #39→#40 ≈ 2h25'48" — KHÔNG phá sàn 19'07" (đợt 106) cũng không
phá sàn mới 26'03" (đợt 110 L5 §3.4). `/tmp` đã bị xóa sau reboot
(theo tiền lệ các boot trước — không kiểm lại chi tiết, không ảnh
hưởng kết luận).

### 2.2 postboot-check lần 1 (05:39Z, ~22' sau boot) — PASS toàn bộ

Log: `hidden_files/round111-m8/m8-postboot-check1.log` (exit 0).

| Mục | Kết quả |
|---|---|
| Wrapper MiniBrowser | PASS — đã vá K1 (giữ LD_LIBRARY_PATH), sống qua reboot #40 |
| Lib hệ thống (5 lib) | PASS — đủ libevent/libEGL/libavif/libdw/libevdev |
| Plugin GST | PASS — thư mục thật (apt), 269 file hệ thống = 269 debroot, đủ isomp4 + libav, không file `.dpkg-new` |
| apt (10 package) | PASS — đủ 10/10 |
| Kết luận | ĐỦ ĐIỀU KIỆN chạy WebKit |

Không còn tiến trình apt/dpkg/replay nào lúc kiểm (`ps` trống);
`dpkg --audit` sạch. Replay xong trước 22 phút sau boot — nhanh hơn
hoặc bằng boot #39 (~17 phút; khoảng chính xác trên boot #40 chưa đo
vì lần kiểm đầu tiên đã đủ, không có lần kiểm FAIL trước đó để kẹp
khoảng).

### 2.3 Launch WebKit thật trên boot #40

Script `round110-l8/l8-webkit-launch.mjs` (Playwright-core 1.65.0,
Xvfb :195 cho headed; bản headless là sed `headless: false` →
`true` lưu tại `round111-m8/m8-webkit-launch-headless.mjs`):

| Chế độ | Kết quả | Thời gian |
|---|---|---|
| headed, env O8 (chỉ GST_PLUGIN_SYSTEM_PATH) | OK, version 27.2, eval 2 | 3422 ms (05:39:10Z) |
| headed, clean (không GST/LD var) | OK, version 27.2, eval 2 | 931 ms (05:39:14Z) |
| headless, clean | OK, version 27.2, eval 2 | 2592 ms (05:39:19Z) |

File kết quả: `m8-launch-o8env-b40.json`, `m8-launch-clean-b40.json`,
`m8-launch-headless-b40.json`. UA cả 3: Safari/605.1.15 Version/27.2.
Decode video mp4 thật KHÔNG kiểm lại trong luồng này (O8 21/21 giao
cho M9 chạy cuối — xem §6; L8 đã chứng minh decode trên boot #39).

### 2.4 Đổi trong postboot-check (repo, nhỏ)

`apps/web/scripts/vcut-webkit-postboot-check.sh`:
- Dòng tham chiếu boot `#39 = 02:50:48Z` → `#40 = 05:16:36Z`.
- Header: thời gian replay "có thể mất >30 phút" → ghi số đo thật
  (~17 phút boot #39; boot #40 đủ lúc 22 phút sau boot).
- `bash -n` OK. Không đổi logic kiểm tra/sửa chữa.

## 3. Chuẩn hóa protocol vite lock

### 3.1 Script mới: `apps/web/scripts/vcut-vite-lock.sh`

Spec đầy đủ trong header script (là bản chuẩn — LIMITS này chỉ tóm tắt):
1. **Acquire:** `mkdir` nguyên tử + ghi owner NGAY qua tmp+mv trong
   cùng lần gọi. Owner bắt buộc: `thread`, `pid` (pid driver/shell
   giữ lock — truyền vào, mặc định `$PPID` của lệnh acquire; KHÔNG
   dùng pid của chính script helper vì nó thoát ngay), `port`,
   `started` (ISO UTC), `boot` (boot_id).
2. **Stale-recovery:** chỉ stale khi đủ cả 3 (kiểm trực tiếp, không
   đoán theo tuổi): pid owner chết + không còn vite node trên cổng
   owner + curl cổng owner 000; và tuổi dir ≥ stale_min (mặc định
   30 phút, như L5). Dir trống không có owner (vụ L4): stale khi
   tuổi > 5 phút + không vite nào chạy + mọi cổng đã biết đều 000.
   Khi stale: xóa lock, ghi lý do, mkdir lại.
3. **Release:** chỉ thread trùng owner mới nhả (xóa owner rồi rmdir).
4. **kill-vite <port>:** tìm pid node thật (cmdline chứa `node` +
   `.bin/vite`, khớp cả dạng `-c <config> --port`), TERM → chờ 10 s
   → KILL nếu còn sống → kiểm `ps` + `curl` 000 sau kill; FAIL nếu
   vẫn còn vite hoặc cổng vẫn phục vụ.
5. **status:** in owner + liveness (vite node trên cổng, curl cổng,
   vite bất kỳ). `owner_field` đọc được cả 2 định dạng owner: key=
   value mỗi dòng (spec M8) và một dòng `thread pid=.. port=..`
   (L5/M6 cũ) — để không xóa nhầm lock của luồng khác chỉ vì khác
   định dạng.
6. `VITE_LOCK_DIR` đổi được qua biến môi trường — để test stale mà
   không đụng lock chung.

### 3.2 Bug thật tìm được khi kiểm chứng (đã sửa + kiểm lại)

**Bug:** `port_serving()` dùng `code=$(curl ... || echo "000")`.
Khi curl lỗi kết nối, `-w "%{http_code}"` đã in `000` rồi, rồi
`|| echo "000"` nối thêm thành `000000` ≠ `000` → hàm luôn báo
SERVING. Hậu quả: stale-recovery từ chối mọi lock (lần test đầu:
acquire trên lock giả stale timeout 60 s, EXIT=1; dir trống kiểu L4
cũng bị từ chối). Cùng mẫu sai có trong `cmd_kill_vite` (kiểm curl
sau kill) và trong script test M8 (đã sửa cả 3 chỗ).
**Sửa:** lấy đúng output `-w` (`code=$(curl ...); [ -z "$code" ] &&
code="000"`), không `|| echo`. Kiểm lại: stale-recovery PASS cả 2
dạng (xem §3.3). Bài học: mẫu `curl ... || echo 000` từng xuất hiện
trong nhiều script đo (kể cả vòng kiểm tay lúc 05:38Z của M8 in ra
`000000`) — đừng dùng mẫu này nữa; lấy output `-w` trực tiếp.

### 3.3 Kiểm chứng stale-recovery (lock dir riêng /tmp/m8-test-lock)

| Ca | Kỳ vọng | Kết quả |
|---|---|---|
| Lock giả: owner thread=fake-old, pid=999999 (chết), port 5599, tuổi 6362 s, không vite, curl 000; acquire stale_min=1 | Xóa lock cũ, giữ lại, owner mới đủ 5 trường | PASS (EXIT=0; owner mới thread=m8-test pid=999998 started=05:46:03Z boot=73316ed9…) |
| release sai thread (wrong-thread) | Từ chối, EXIT=1 | PASS |
| release đúng thread (m8-test) | Nhả, EXIT=0; status sau đó TRỐNG | PASS |
| Dir trống kiểu L4, tuổi 6363 s, không vite, không cổng phục vụ; acquire | Coi là stale, giữ lại | PASS (EXIT=0) |

`bash -n` script helper OK. Test này KHÔNG đụng lock chung (dùng
`VITE_LOCK_DIR=/tmp/m8-test-lock`, đã xóa sau test).

### 3.4 Phối hợp lock trong đợt 111 (ghi lại — hàng đợi là điểm nghẽn thật)

- Lúc M8 bắt đầu (05:38Z): lock TRỐNG, không vite nào chạy.
- 05:41:20Z: M6 giữ lock (`m6-round111 pid=7915 port=5599`) để đo
  watch + phần C. Lưu ý: pid 7915 trong owner M6 đã chết lúc M8
  kiểm (~05:47Z) trong khi M6 vẫn đang đo (log tới 05:46:38Z) — pid
  đó có vẻ là pid của lệnh acquire ngắn, không phải driver dài của
  M6. Đây đúng là lỗ hổng spec cũ mà §3.1 vá (owner_pid phải là pid
  driver dài). M8 KHÔNG coi lock M6 là stale (tuổi < 30 phút + M6
  còn hoạt động) và chờ đúng protocol. M6 xong đo 05:50:04Z, nhả
  lock ~05:51Z (M8 lấy được 05:51:26Z nhưng crash bug local, nhả
  ngay — xem §4).
- 05:51:36Z: M7 giữ lock, chạy r64–r68 (đo điểm gãy tải). M7 nhả +
  giữ lại giữa các lượt với khoảng chỉ ~8 s (r65→r66: 05:55:55Z →
  05:56:03Z) — M8 thăm 10 s đã bỏ lỡ 2 cửa (r65→r66, r66→r67).
  M7 xong toàn bộ (r64–r68, không chạy r69) 06:18:51Z.
- 06:18:52Z: M1 giữ lock (owner ĐÚNG spec M8 đủ 5 trường — M1 đã
  dùng helper này), chạy probe m1f1–m1f4; nhả 06:21:06Z.
- 06:21:07Z: M5 giữ lock (chờ ~19 phút, acquire của họ suýt timeout
  1500 s); nhả ~06:24:1xZ.
- 06:24:19Z: M8 giữ lock (chờ tổng ~38 phút qua 3 lần chạy), làm
  xong 2 vite trong ~11 s, nhả 06:24:30Z.
- 06:24:33Z: M3 giữ lock (owner định dạng riêng `pid:tag:timestamp`
  — `35873:chr-mixedalt-m3r1-fr4:…`, pid driver thật còn sống).
  M5 đang chờ lượt tiếp (acquire bằng bản copy helper trong dir M5).
- **Bài học hàng đợi:** với 8–10 luồng mà mỗi lượt đo vite giữ lock
  5–30 phút, luồng đo ngắn (như M8, chỉ cần ~1 phút) vẫn phải chờ
  hàng chục phút. Không có cơ chế ưu tiên lượt ngắn trong protocol
  hiện tại — ghi nhận, chưa sửa (cần parent quyết có thêm hàng đợi
  ưu tiên hay không). Poll 2 s (VITE_LOCK_POLL_S) giúp bắt cửa
  nhả-giữ lại ngắn; khuyến nghị §3.1 mục 6 (holder chờ ≥15 s sau
  khi nhả trước khi giữ lại) giảm đói cho luồng chờ.

## 4. Kiểm chứng watch.ignored 0 watch + helper bằng 2 vite nối tiếp

Script: `hidden_files/round111-m8/m8-vite-test.sh` (acquire lock chung
→ 2 vite config tạm ignored → đo watch → kill qua helper → nhả lock).
Log đầy đủ: `round111-m8/m8-vite-test.log`. Cây lúc đo: preview.tsx
md5 `c4198206…` (fix E4 của M1 — xem §1.7; M6 đo trên cây 9b27abe5,
xem §5).

| Lần | Config | total_wd trước → lúc chạy (delta) | vite_proc_wd | curl / | ready | Kill qua helper |
|---|---|---|---|---|---|---|
| A | ignored `["**/**"]` | 5 → 5 (**0**) | **0** | 200 | 318 ms | TERM pid node 36151 → OK, ps sạch, curl 000, total về 5 |
| B | ignored `["**/**"]` | 5 → 5 (**0**) | **0** | 200 | 157 ms | TERM pid node 36283 → OK, ps sạch, curl 000, total về 5 |

- **Kết luận: watch.ignored vẫn cho 0 watch trên cây hiện tại**
  (2 cách đếm độc lập đều 0: tổng cell không đổi + chỉ đếm tiến trình
  vite), vẫn phục vụ trang 200. Khớp đối chứng M6 trên cây 9b27abe5
  (total 14 → 14, vite 0) — baseline cell khác nhau (5 vs 14) là do
  tải/tiến trình ngoài cell lúc đo, không ảnh hưởng delta.
- **Helper đã kiểm chứng end-to-end trên lock thật:** acquire
  06:24:19Z (owner đủ 5 trường, pid=24954 là pid script test),
  kill-vite theo pid node thật cả 2 lần (không kill vỏ npx), release
  đúng thread 06:24:30Z. Tổng thời gian giữ lock ~11 s cho 2 vite.
- **Vite config gốc (ORIG) BỎ QUA có lý do:** headroom ngay trước
  khi bật là 1640 < ngưỡng an toàn 1700 (vite thường cần ~1585,
  chỉ dư ~55 — rủi ro ENOSPC nếu watch ngoài cell tăng trong lúc
  chạy). Đối chứng M6 trên cùng boot/cây gần như tương đương
  (total 1600, vite 1586, r1+r2) vẫn đứng — không cần đo lại.
- **Lịch sử chạy test (trung thực, có cả lỗi):** lần 1 acquire được
  05:51:26Z nhưng crash ngay ở `run_vite` do bug `local` (dòng 53:
  `$label` trong cùng lệnh `local` chưa thấy giá trị vừa gán khi
  `set -u` — bash gotcha; đã tách thành 2 lệnh, kiểm lại `bash -n`
  OK); trap nhả lock đúng. Lần 2 bị M8 tự kill lúc 06:05:29Z để đổi
  poll 10 s → 2 s (M7 nhả-giữ lại chỉ ~8 s, thăm 10 s bỏ lỡ 2 cửa —
  xem §3.4); trap từ chối nhả lock M7 đúng luật. Lần 3 (poll 2 s)
  chờ M7 → M1 → M5 rồi lấy được lock 06:24:19Z và PASS toàn bộ.
  Tổng thời gian chờ lock của M8: ~38 phút (05:46–06:24) qua 3 lần
  chạy — hàng đợi vite là điểm nghẽn thật của đợt (xem §3.4).

## 5. Vite mồ côi + headroom boot #40

- **Quét mồ côi (05:39Z + 05:46Z): 0 vite.** `ps` không còn tiến
  trình node vite nào; curl 8 cổng đã biết đều 000. Hai vụ mồ côi
  đợt 110 (vite B L8 §3.4; vite L7 pid 21711) không tái diễn trên
  boot #40 tới thời điểm này.
- **Headroom inotify: 1657** (probe K8, 05:39Z, lúc cell yên, total_wd=5,
  trần 63747) và **1640** (đo lại 06:24Z trước vite test M8). Thấp hơn
  boot #39 (1854 lúc L4 vite chạy / 2127 lúc yên) — ngoài cell vẫn ~62k
  watch, dao động theo boot/tải. Baseline total_wd trong cell dao động
  (5 lúc 05:39Z và 06:24Z; 14 lúc M6 đo 05:44Z; 16 lúc M6 kết thúc
  05:50Z) — đo delta mới có ý nghĩa, đừng so số tuyệt đối giữa các
  lượt.
- **Đối chứng M6 trên cùng boot #40, cây 9b27abe5** (log
  `round111-m6/m6-measure.log`, 05:44–05:46Z): vite thường r1/r2
  total_wd=1600, vite_wd=1586, page 200; vite ignored r1/r2
  total_wd=14 (= baseline), vite_wd=0, page 200. Tức 1 vite thường
  vừa khít headroom 1657 (dư ~71) — vite thứ hai chết chắc; vite
  nối tiếp vẫn bắt buộc.
- **Phần C (trade-off stale-module) — M6 đã đo trên boot #40, M8
  không đo lại để khỏi trùng:** C-normal app1: vite_wd_at_start=6,
  APP-V2 thấy ngay 0 s; C-ignored app1: vite_wd_at_start=0,
  APP-V2 STALE@32 s (curl vẫn trả APP-V1 tới 32 s) — sau RESTART
  vite thì phục vụ APP-V2 (stale nằm trong cache bộ nhớ, không phải
  đĩa). Kết luận: watch.ignored làm module graph không invalidate
  khi sửa file (đúng suy luận L8 §3.3, nay có số thật của M6) —
  chỉ dùng cho vite tạm một-lần-chạy, không dùng cho dev tương tác.

## 6. O8 — giao cho M9

O8 nhanh (21/21 cả 2 engine) KHÔNG chạy trong luồng M8: các luồng
khác (M6, M1…) vẫn đang dùng vite/làm việc trên cây, và M9 là luồng
verify của đợt (đã có `round111-m9/poll-m9.log`). M9 chạy O8 cuối
khi mọi luồng xong vite. Ghi rõ để parent không đếm thiếu O8 ở M8.

## 7. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi M8 (M1 sửa — xem §1.7). md5 lúc M8 bắt
  đầu: `9b27abe5…` (L1-fix); lúc M8 đo: xem §4 từng lần chạy.
- `bash -n` cả 2 script đã sửa/thêm: OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; M1 chạy tsc cho fix của họ — xem `round111-m1/
  tsc.log`).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM chưa đổi;
  available ~1,3 GB lúc bắt đầu, guard 6 GB).

## 8. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND111_M8_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-vite-lock.sh` (mới — helper + spec §3.1).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa nhỏ: tham
  chiếu boot #39→#40 + ghi chú thời gian replay, §2.4).
- Harness trong hidden_files (KHÔNG stage — tiền lệ K7/K8/L8):
  `round111-m8/` (log postboot, launch JSON ×3, script test vite,
  script headless, progress log, file này).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round111-m8-infra.txt`
  (NUL-delimited; chỉ 3 file repo trên).
- Cờ done: `hidden_files/round111-m8-done` (tạo sau khi LIMITS + batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Vite lock dùng chung (acquire/release/status/kill-vite):
bash ~/workspace/repo-1/apps/web/scripts/vcut-vite-lock.sh status
bash ~/workspace/repo-1/apps/web/scripts/vcut-vite-lock.sh acquire <thread> <port> [timeout_s] [stale_min] [owner_pid]
bash ~/workspace/repo-1/apps/web/scripts/vcut-vite-lock.sh kill-vite <port>
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

## 9. Nợ mở sang đợt sau

1. **52 file clicktest-*.mjs còn ghi đè vite log** (nợ L8 §4.2) — chưa
   làm trong đợt này, vẫn mở.
2. **`run-k7-quiet.sh` còn thiếu `vite.config.k7-temp.ts`** (nợ L8 §9.3)
   — vẫn mở.
3. **Owner pid của M6 (7915) chết trong khi M6 còn đo** — các luồng
   cũ vẫn ghi pid ngắn vào owner; từ đợt sau mọi luồng dùng
   `vcut-vite-lock.sh` để owner pid luôn là pid driver dài (M1 đợt
   này đã dùng đúng spec; M5 copy helper về dir mình). Helper đọc
   được 3 định dạng owner (key=value nhiều dòng; một dòng
   `thread pid=.. port=..`; `pid:tag:timestamp` của M3 — đã thêm
   fallback parse pid đầu dòng). Rủi ro còn lại: định dạng owner
   mới hoàn toàn mà helper chưa biết → pid đọc rỗng (= coi như
   chết) và lock có thể bị xóa nhầm khi đủ 30 phút + không vite +
   curl 000. Giảm thiểu: stale_min mặc định 30 phút đã dài hơn một
   lượt đo vite thông thường; luồng giữ lock lâu hơn 30 phút nên
   ghi owner theo spec mới (hoặc chạm lại mtime dir để reset tuổi).
4. **Replay apt sau reboot:** boot #40 đủ package trước 22 phút sau
   boot (không kẹp được khoảng chính xác vì lần kiểm đầu đã đủ).
   Đợt sau sau reboot nên chạy postboot-check sớm (5–10 phút sau boot)
   để kẹp khoảng replay chính xác hơn, rồi chạy lại tới khi PASS.
5. **Headroom dao động theo boot (1657 boot #40 vs 1854/2127 boot
   #39)** — mọi lượt vite nặng vẫn nên đo headroom trước khi bật vite.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 110 §10: G1 + mù #22
   chờ user quyết; E4 (M1 đang đóng đợt này); 2 MiB offset +4.194.304;
   zombie gate (b) dạng mạnh; EPERM probe #30 + mù #29; F6' nợ đo
   lường mới; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml
   vẫn 403 chờ user; release gate không đổi; KHÔNG push khi user chưa
   nhắn "push đi".

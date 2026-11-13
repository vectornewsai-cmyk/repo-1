# PHASE9 ROUND90 R7 — EPERM: checklist probe v2 + quét writeFileSync (nợ LIMITS gộp đợt 89 §4 mục 8)

> Luồng R7, đợt 90 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07,
> 11/11/2026; làm việc ~14:50–15:00Z). Nhiệm vụ: checklist probe v2 +
> điều tra lần chết/mù mới nhất kể từ probe #8 (closing đợt 89,
> 14:44Z) + quét lại writeFileSync + quét 0-byte 24h + chạy lại helper
> tests. KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy:** `status` lúc 14:51Z báo **ALIVE**
  (heartbeat age 411 s, n=8, exit 0 — không ghi dòng DEAD, đúng thiết
  kế); `once` ngay sau đó là **probe #9, boot 62b088d2 (không đổi),
  OK 2/2**, exit 0; `status` chạy lại **ALIVE** (age 0 s), exit 0.
- **Không có lần chết/khoảng mù mới kể từ #8:** chỉ ~7 phút trôi qua,
  cùng boot, uptime từ 13:21:06Z. Reboot 13:21:06Z là lần thứ 7 trong
  ~17h — đã được closing đợt 89 ghi nhận.
- **PHÁT HIỆN MỚI — sóng EPERM ~11:55–12:11Z (~16 phút) đã xảy ra
  trong khoảng mù 11:37:37Z → 14:44:26Z**, nhưng probe không bắt được
  vì lúc đó không có observer nào chạy. Bằng chứng từ 2 luồng sibling
  đợt 89 (Q1, Q7 — đọc lại log thật): vite build fail 2 lần, `once`
  fail append log (EPERM) 2 lần, verdict script crash khi ghi JSON,
  chrome crashpad EPERM, shell redirect 0-byte lặng, `copy-web-dist`
  fail 30/30. Đây là **khoảng mù đầu tiên được CHỨNG MINH là có chứa
  sóng** — trước đây chỉ là nguy cơ lý thuyết.
- **Quét lại writeFileSync toàn repo (snapshot ~15:00–15:05Z): 179
  dòng** trong 74 file — code 111 (source thật 86, bản copy build 3,
  bản copy release 22), docs 68 mẫu. **Không còn đường ghi production
  nào chưa nối helper.** Async `fs.writeFile(` trong code production:
  **0** ngoài helper.
- **Đính chính Q8:** `apps/desktop/release-round55-l4` TỒN TẠI từ
  07/11 — Q8 báo 0 dòng do phạm vi quét loại `release*`, không phải do
  thư mục bị xoá.
- **Quét 0-byte 24h:** không file dữ liệu nào 0 byte mới (chỉ còn
  `.wtest` 0 byte từ 10/11 10:13Z — marker test cũ, không đổi).
- **Helper retry chạy lại, không sửa: gốc 22/22, port CJS 8/8, port
  desktop 11/11 — vẫn xanh.**
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 14:51Z | ALIVE, exit 0 — heartbeat n=8, ts 14:44:26Z, boot 62b088d2, age **411 s**; last sample probe #8; last start duy nhất 08:49:50Z; `=== probe end`: none |
| `bash scripts/probe-eperm-v2.sh once` | 14:51:17Z | **probe #9, boot=62b088d2, ok=2 fail=0**, exit 0; không có dòng `boot changed` |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 14:51Z | **ALIVE**, age 0 s, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (nay n=9, ts 14:51:17Z,
boot 62b088d2-…).

## 2. Điều tra kể từ probe #8 + sóng trong khoảng mù

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 14:50–14:51Z)

- Boot hiện tại: `uptime -s` = **2026-11-11 13:21:06Z**, uptime 1:29
  lúc 14:50:59Z. boot_id `62b088d2-a43f-4dc8-8f57-495136e1bd08` —
  trùng boot của probe #8.
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z,
  pid=13674) và **0 dòng `=== probe end`** (3 hit của grep `probe end`
  đều là cụm "no probe end since last start" trong các dòng DEAD).
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 62b088d2…).
  `last -x reboot`: chỉ 1 dòng (13:21Z). wtmp bắt đầu 13:21:16Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Khoảng 14:44:26Z → 14:51:17Z (~7 phút): không reboot, không chết,
  không khoảng mù mới — probe #9 là mẫu đầu tiên trên boot này sau #8.

### 2.2 Sóng EPERM ~11:55–12:11Z — bằng chứng từ Q1 + Q7 (đợt 89)

Khoảng mù sau probe #7 của Q8 kéo dài tới 14:44:26Z (~187 phút:
11:37:37Z → 14:44:26Z) — dài hơn cả khoảng mù Q8 đã ghi (116 phút,
09:41–11:37Z), vì Q8 cũng không start loop mới và closing đợt 89 bị
dời sang lượt 21:35 do VM reboot 13:21:06Z. Trong khoảng mù này đã
xảy ra, theo log thật của 2 luồng sibling (đọc lại, không tin trí nhớ):

| Thời điểm (UTC) | Hiện tượng | Nguồn |
|---|---|---|
| 11:55:33–34Z | chrome crashpad `WriteEverything failed` + `writev` EPERM; headed log 0 byte | round89-q7.md |
| 11:56–12:00Z | `vite build` fail **2 lần** (npm/vite EPERM khi ghi file tạm; ghi file thường vẫn OK) | round89-q1.md |
| ~11:57Z | probe v2 `once` **không append được eperm-probe-v2.log (EPERM)** | round89-q1.md |
| 11:59Z | verdict script crash khi ghi `k3-verdict-summary.json` (EPERM **sau 5 lần thử của helper** — retry 5×20 s không qua được sóng) | round89-q7.md |
| 12:01:30Z | `once` fail lần nữa: `cannot append to eperm-probe-v2.log`; `status` DEAD/STALE, age 1422 s | round89-q7.md |
| 12:03:57Z | `npx vite` fail EPERM (vite log 0 byte) | round89-q7.md |
| 12:05Z | ghi file bằng shell redirect **thất bại lặng** (file 0 byte, exit 0); ghi lại bằng tool write mới được | round89-q7.md |
| 12:06–12:11Z | `copy-web-dist` fail **30/30** | bản ghi closing đợt 89 (MEMORY.md) — R7 chưa kiểm chứng độc lập mục này |

Nhận xét trung thực:

- Kết luận "KHÔNG gặp sóng trong lượt" của Q8 chỉ đúng cho cửa sổ
  11:37–11:50Z của chính Q8 — sóng bắt đầu **~18 phút sau khi Q8
  xong việc**. Closing đợt 89 (14:44Z) không ghi sóng này vào
  build-loop-log (chỉ ghi checklist probe); R7 là luồng đầu tiên gộp
  bằng chứng Q1+Q7 vào hồ sơ probe.
- Sóng kéo dài **~16 phút** (11:55–12:11Z), dài hơn sóng ~15 phút
  từng chặn K8/L6/M5/N8/O10 — cùng họ sóng, không phải chớp nhoáng.
  Luật retry K8 (5×20 s ≈ 100 s) **không qua được sóng dài cỡ này**
  (verdict script đã chứng minh: fail sau đủ 5 lần thử).
- Trong sóng, cả 3 kênh ghi đều bị ảnh hưởng: exec/shell redirect
  (0-byte lặng, exit 0 — nguy hiểm nhất vì không báo lỗi), `node`
  ghi file (EPERM rõ), và chính log của probe v2 (append fail → `once`
  exit 2 — đúng thiết kế: lỗi ghi log trở thành bằng chứng, không im
  lặng).
- 3 dòng lạ trong log probe (`probe test 2026-11-11T11:59:14Z`,
  `append-test`, `direct-append-test 2026-11-11T12:00:23Z`) không phải
  mẫu probe; khớp thời gian sóng, nhiều khả năng là test append trực
  tiếp của một luồng sibling trong lúc sóng. Counter/heartbeat không
  ảnh hưởng (n vẫn tăng đúng 7 → 8 → 9). Đề nghị các luồng sau không
  append test vào log probe chung (xem §5 mục 3).

### 2.3 Bảng 8 lần chết / khoảng mù (cập nhật từ bảng 7 lần của Q8 §2.3)

| # | Probe | Mẫu cuối | Khoảng chết/mù | Nguyên nhân (mức chắc chắn) |
|---|---|---|---|---|
| 1 | K8 (đợt 83) | #5 18:21Z 10/11 | 18:21–18:31Z | **Chưa rõ** — chết trước reboot kế (~20:18Z) ~2h; giả thuyết mạnh nhất: runtime dọn phiên (GC); không loại trừ reboot trung gian |
| 2 | L6 (đợt 84) | #10 22:18:49Z 10/11 | 22:18–22:28Z | **Chưa rõ** — chết trước reboot kế (~23:28Z) ~60'; cùng giả thuyết GC |
| 3 | M5 (đợt 85) | #11 01:21:56Z 11/11 | 01:22–01:32Z | **Chưa rõ** — chết trước reboot kế (~02:03Z) ~30–40'; cùng giả thuyết GC |
| 4 | N8 (đợt 86) | #5 03:19:38Z | 03:19–03:29Z | **Chưa rõ** — không đủ dữ kiện uptime lúc đó |
| 5 | O10 (đợt 87) | #9 07:13:35Z | 07:13–07:23Z | **Chưa rõ** — chết trước reboot 08:24:39Z ~60'; khoảng mù 07:13–08:49Z không quan sát |
| 6 | v2 loop 13674 (đợt 88) | #5 09:19:52Z | chết ~09:21:17Z | **CHẮC CHẮN: reboot 09:21:17Z** — lần đầu tiên một cái chết có nguyên nhân ghi nhận (boot d473b560 → e10b9199) |
| 7 | — (đợt 89 Q8) | #6 09:41:01Z | mù 09:41:01–11:37:37Z (~116') | **Không có observer** (không loop nào được start sau #6) + **reboot 11:34:38Z** ở cuối khoảng mù (boot e10b9199 → 7439870b); không loại trừ reboot trung gian khác |
| 8 | — (đợt 89, sau Q8) | #7 11:37:37Z | mù 11:37:37–14:44:26Z (~187') | **Không có observer + SÓNG EPERM ~11:55–12:11Z (2 nhân chứng Q1/Q7) + reboot 13:21:06Z** (boot 7439870b → 62b088d2). **Lần đầu tiên một khoảng mù được chứng minh là có chứa sóng** |

Ghi chú: lần 8 cho thấy khoảng mù không chỉ là "thiếu dữ liệu" — nó
đã che mất một sóng đầy đủ (16 phút, chặn vite build, verdict script,
copy-web-dist 30/30, và cả chính probe). Với chu kỳ reboot ~2–3h/lần
(7 lần trong ~17h: ~20:18Z, ~23:28Z, ~02:03Z, 08:24:39Z, 09:21:17Z,
11:34:38Z, 13:21:06Z) và sóng EPERM tái phát, observer 3h/lượt là
không đủ phủ.

## 3. Quét lại writeFileSync toàn repo (snapshot ~15:00–15:05Z)

Phương pháp như Q8: `find` liệt kê file `*.js/*.ts/*.mjs/*.cjs/*.sh/
*.py/*.md` (loại `node_modules`, `.venv*`, `dist`, `release*` ở gốc,
`chrome-userdata`, `.eperm-probe*`, `bundled-server` ở gốc, `assets`)
→ 11.831 file (Q8: 11.650), rồi `grep -c writeFileSync` từng file.
Lưu ý phương pháp: Q8 đếm theo **dòng** (`grep -c`); R7 giữ nguyên
cách đếm đó để so sánh được. (Đếm theo lần xuất hiện `grep -o` cũng
cho 179 — trùng nhau vì mỗi dòng chỉ có 1 lần xuất hiện trong đợt này.)

| Nhóm | Dòng | So với Q8 (~11:40Z) | Phân loại |
|---|---|---|---|
| Source code (không tính bản copy) | **86** | 82 → 86 (+4) | xem dưới |
| Bản copy `apps/desktop/build/bundled-server/` | **3** | 20 → 3 (−17) | thư mục build tái tạo 12:18Z (Q9 build AppImage); 3 dòng còn lại giống hệt source |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **22** | 0 → 22 | **đính chính Q8** — xem §3.1 |
| Mẫu trong docs (*.md) | **68** | 61 → 68 (+7) | tài liệu, không chạy |
| **Tổng trong phạm vi quét** | **179** | 163 → 179 | |
| Code so sánh được (source, không copy) | **86** | 82 → 86 | |

**Chi tiết theo thư mục (source):** apps/web/scripts 44 (Q8: 40),
apps/web/src 5 (=), server 11 (=), apps/desktop/src 25 (=),
mcp-server/src 1 (=). Các nhóm còn lại không đổi so với Q8.

**Giải thích +4 dòng source (đều là harness đo một lần, không phải
đường ghi production):**

- `apps/web/scripts/probe89q5-seek-latency.mjs:213` —
  `fs.writeFileSync(waveProbeFile, "x")` (probe sóng trong harness đo
  seek, Q5).
- `apps/web/scripts/probe89q2-motionblur-mask.cdp.mjs:358` —
  `if (OUT) fs.writeFileSync(OUT, ...)` (dump JSON khi có OUT, Q2).
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs:263` và
  `clicktest-87o8-mask-track-headed.mjs:636` —
  `fs.writeFileSync(waveProbeFile, "x")` (probe sóng trong click-test).

### 3.1 Đính chính Q8: bản copy release KHÔNG biến mất — chỉ bị loại khỏi phạm vi quét

Q8 §3 ghi: bản copy release-round55-l4 "không còn tồn tại trong cây
làm việc (P8 đếm 12 dòng ở đó — nay 0)". **Kết luận này sai.** Kiểm
chứng trực tiếp lúc 15:00Z:

- `apps/desktop/release-round55-l4/` tồn tại, mtime **2026-11-07
  02:59:28Z** (trước lúc Q8 quét ~4 ngày).
- `apps/desktop/release/` tồn tại, mtime **2026-11-06 22:12:39Z**.
- Cả hai chứa `linux-unpacked/resources/vcut-server/` + AppImage.

Nguyên nhân sai số của Q8: lệnh `find` của Q8 prune `release*` ở
**mọi cấp** (nên cả `apps/desktop/release*` bị loại), trong khi R7
chỉ prune `release*` ở gốc repo như mô tả phương pháp. Vì vậy 22
dòng trong 2 bản copy này (11 + 11) lọt vào phạm vi quét của R7
nhưng không có trong số của Q8. Đây là **khác biệt phạm vi quét,
không phải thay đổi thật của cây**.

**Bản chất 22 dòng release copy:** snapshot AppImage cũ (06–07/11),
**trước đợt nối helper** — vd `bridge/src/index.js:632/801/803` ghi
trực tiếp `specPath`/`asset-map.json`, `render.js:332/393`,
`harnessShared.js:490/587`, `proxy.js:149`, `jobQueue.js:84`. Source
hiện tại đã nối helper ở đúng các file này — đã verify import
`writeFileEpermRetry` trong `server/bridge/src/index.js`,
`server/render/src/render.js`, `server/render/src/harnessShared.js`,
`server/render/src/proxy.js`, `server/bridge/src/jobQueue.js`,
`server/render/src/textAnimParity.js`. File copy khác source hiện
tại (đúng — snapshot cũ), nhưng chúng là **build output đóng băng,
không phải source sống**. Người chạy AppImage cũ vẫn gặp đường ghi
chưa nối — đó là thuộc tính của artifact cũ, không phải của source
hiện tại; AppImage mới (Q9, 557.008.461 byte, sha 9680cef1…) đã build
lại từ source đã nối.

**3 dòng bundled-server còn lại** (`gpuencode.js:425`,
`eperm-retry.cjs:66`, `outputQA.js:216`) **giống hệt source** cả nội
dung lẫn số dòng (diff IDENTICAL cho outputQA + gpuencode): helper
nội bộ (eperm-retry.cjs:66) + 2 fixture cố tình (JSON hỏng, truncate
một nửa). Thư mục build có 18.846 file, tái tạo 12:18Z.

### 3.2 Async writeFile

`fs.writeFile(` (async) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`): **0 dòng** ngoài helper —
khớp kết luận P8/Q8. Hit `.writeFile(` duy nhất nằm trong asset JS
vendored của Gradio (`server/tts/.venv2/.../gradio/templates/frontend/
assets/*.js`) — đó là API `writeFile` của ffmpeg.wasm FS trong bộ
nhớ (virtual FS trong trình duyệt), không phải ghi đĩa Node. Không
tính là đường ghi production.

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry.**

## 4. Quét 0-byte 24h + helper tests

- **0-byte 24h** (từ 2026-11-10 15:00Z, loại node_modules/.venv/dist/
  chrome-userdata/.eperm-probe*/assets): **không file dữ liệu nào 0
  byte mới**. `.wtest` 0 byte từ 10/11 10:13Z vẫn còn, không đổi —
  marker test, không phải dữ liệu.
- **Helper retry chạy lại (không sửa):** gốc
  `test_round83_k8_eperm_retry.mjs` **22/22 PASS**; port CJS
  `server/eperm-retry.test.cjs` **8/8 PASS**; port desktop
  `apps/desktop/src/services/epermRetry.test.cjs` **11/11 PASS**.
  Luật K8 (5×20 s) không đụng — nhưng lưu ý §2.2: retry 5×20 s
  **không qua được sóng dài ~16 phút** (verdict script đã fail sau đủ
  5 lần thử trong sóng 11:59Z).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #9 OK 2/2) — và khoảng mù vừa rồi đã được chứng minh là
   có chứa sóng. Sóng gần nhất: ~11:55–12:11Z, chỉ ~3h trước lượt này.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5 mục
   3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài giây,
   không giữ tiến trình nền). R7 KHÔNG tự tạo. Bằng chứng mới (§2.2)
   làm đề xuất này mạnh hơn: observer 3h/lượt đã để lọt một sóng đầy
   đủ 16 phút.
3. **Không append test vào log probe chung.** 3 dòng lạ 11:59–12:00Z
   làm nhiễu lịch sử mẫu (dù không hỏng counter). Test append dùng
   file scratch riêng (`EPERM_PROBE_LOG` override đã có sẵn cho việc
   này).
4. **Cần quyết: chốt danh sách loại trừ chuẩn cho quét writeFileSync.**
   Đề xuất: loại cả `apps/desktop/release*/**` + `apps/desktop/build/**`
   (đều là build output đóng băng) như đã loại `bundled-server/**` ở
   gốc — để số "code" chỉ còn source thật (~86 dòng) và không nhảy
   giả mỗi lần build lại desktop. Đồng thời ghi nhận đính chính Q8
   (§3.1) để các lượt sau không lặp lại kết luận sai về release copy.
5. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với cả
   hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
6. **VM reboot ~2–3h/lần** (7 lần/~17h): mọi probe nền đều chết theo
   reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. **Không thêm i18n key** (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND90_R7_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round90-r7-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r7.md`
(log luồng); log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
Scratch quét: `/tmp/r7-files.txt`, `/tmp/r7-wfs-files.txt`,
`/tmp/r7-wfs-counts.txt`, `/tmp/r7-wfs-lines.txt` (không stage).

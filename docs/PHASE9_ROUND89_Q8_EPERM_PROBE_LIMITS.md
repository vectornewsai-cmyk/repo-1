# PHASE9 ROUND89 Q8 — EPERM: checklist probe v2 + điều tra lần chết mới nhất (nợ LIMITS gộp đợt 88 §4 mục 4)

> Luồng Q8, đợt 89 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 11/11/2026; làm việc ~11:37–~11:50Z). Nhiệm vụ: đóng nợ LIMITS gộp đợt 88
> §4 mục 4 — "EPERM: probe v2 đã có (P8) — cần quyết cron riêng 10 phút;
> khoảng mù 07:13Z–08:49Z không có quan sát". KHÔNG push, KHÔNG release/tag,
> KHÔNG binary, KHÔNG workflow, KHÔNG đụng TTS 39, KHÔNG đổi luật retry K8
> (5×20 s giữ nguyên). **KHÔNG tự tạo cron riêng** (ngoài quyền luồng —
> parent/user quyết; xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy:** `status` lúc 11:37:37Z báo **DEAD/STALE**
  (heartbeat age 6995 s > 900 s, mẫu cuối #6 lúc 09:41:01Z), exit 1, ghi
  đúng 1 dòng DEAD vào log; `once` ngay sau đó là **probe #7, boot mới
  7439870b, OK 2/2** (tmp+ws), exit 0; `status` chạy lại **ALIVE** (age 0 s),
  exit 0.
- **Lần chết mới nhất đã có nguyên nhân — nhưng không phải loop chết:**
  sau probe #6 (one-shot lúc 09:41:01Z trên boot e10b9199) **không có loop
  nào được khởi động**, nên khoảng 09:41:01Z–11:37:37Z (~116 phút) là
  **khoảng mù không có observer** chứ không phải một loop chết lặng. VM
  **reboot lần nữa lúc 11:34:38Z** (boot e10b9199 → 7439870b) — `once` #7
  đã ghi đúng dòng `boot changed` vào log. Đây là reboot thứ 6 trong ~15h
  (20:18Z, 23:28Z, 02:03Z, 08:24:39Z, 09:21:17Z, 11:34:38Z).
- **Quét lại writeFileSync toàn repo (snapshot ~11:40–11:45Z): 163 dòng**
  trong 61 file — phân loại: code 102 (so sánh được với 81 của P8:
  +1 harness đo P3, +20 bản copy bundled-server), docs 61 mẫu (+7 so với
  54 của P8, toàn mẫu trích trong LIMITS mới), bản copy release-round55-l4
  **không còn tồn tại** trong cây làm việc (P8 đếm 12 dòng ở đó — nay 0).
  **Không còn đường ghi production nào chưa nối helper eperm-retry.**
  Async `fs.writeFile(` trong code production: **0** ngoài helper.
- **Quét 0-byte 24h:** không file dữ liệu nào 0 byte mới (chỉ còn `.wtest`
  0 byte từ 10/11 10:13Z — marker test cũ, không đổi).
- **Sóng EPERM: KHÔNG gặp trong lượt này** (probe #7 OK 2/2) — nhưng chỉ
  có **1 mẫu duy nhất** trong lượt và khoảng mù 116 phút không có quan sát
  nào, nên **KHÔNG tuyên bố hết hẳn**.
- **Helper retry chạy lại, không sửa: gốc 22/22, port CJS 8/8, port desktop
  11/11 — vẫn xanh.**
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 11:37:37Z | DEAD/STALE, exit 1 — heartbeat n=6, ts 09:41:01Z, boot e10b9199, age **6995 s**; ghi đúng 1 dòng `probe DEAD detected by status (last #6 at 2026-11-11T09:41:01Z, age 6995s, no probe end since last start)` |
| `bash scripts/probe-eperm-v2.sh once` | 11:37:37Z | **probe #7, boot=7439870b, ok=2 fail=0**, exit 0; ghi dòng `=== boot changed e10b9199 -> 7439870b (reboot detected, uptime since 2026-11-11 11:34:38 ) ===` trước mẫu |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:37:37Z | **ALIVE**, age 0 s, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (nay n=7, ts 11:37:37Z,
boot 7439870b-…).

## 2. Điều tra lần chết mới nhất

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 11:37–11:38Z)

- Boot hiện tại: `uptime -s` = **2026-11-11 11:34:38Z**, uptime ~2–3 phút
  lúc đợt 89 bắt đầu (đúng như nhiệm vụ báo "uptime chỉ ~1 phút").
  boot_id hiện tại `7439870b-5c39-4143-9844-8533f9818795`.
- Log v2 chỉ có **ĐÚNG 1 dòng `probe start`** từ trước tới nay:
  `=== probe start 2026-11-11T08:49:50Z pid=13674 count=16 interval=600s ===`
  và **0 dòng `probe end`**. Không có dòng start nào sau 09:41:01Z —
  tức là sau probe #6 (one-shot của closing đợt 88) **không ai khởi động
  loop mới** trên boot e10b9199.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 7439870b…).
  `last -x reboot`: chỉ 1 dòng (11:34Z). wtmp bắt đầu 11:34:52Z.
  `dmesg`: không đọc được (`Operation not permitted`).
  → journal/wtmp **chỉ giữ boot hiện tại**, không loại trừ được reboot
  trung gian trong khoảng mù (đúng giới hạn P8 đã ghi).

### 2.2 Kết luận: đây không phải "loop chết", mà là "không có observer"

- Loop 13674 chết do **reboot 09:21:17Z** — đã được closing đợt 88 ghi
  nhận (boot d473b560 → e10b9199). Đó vẫn là lần chết duy nhất của probe
  v2 có nguyên nhân ghi nhận.
- Sau đó, closing đợt 88 chỉ chạy `status` + `once` (#6) rồi kết thúc —
  không start loop mới. Vì vậy khoảng **09:41:01Z → 11:37:37Z (~116 phút,
  heartbeat age 6995 s)** không có mẫu nào: không phải loop bị dọn phiên
  hay bị giết, mà là **không có observer nào chạy**.
- Trong khoảng mù đó, VM reboot **ít nhất 1 lần nữa lúc 11:34:38Z**
  (boot e10b9199 → 7439870b, `once` #7 ghi nhận). Có reboot trung gian
  khác trong 09:41–11:34Z hay không thì **không xác định được** từ log
  (journal/wtmp volatile) — ghi rõ, không đoán.
- Tần suất reboot VM tới nay: **≥6 lần trong ~15h** (10/11 ~20:18Z,
  ~23:28Z, 11/11 ~02:03Z, 08:24:39Z, 09:21:17Z, 11:34:38Z) — trung bình
  ~2–3h/lần. Với tần suất này, **mọi probe nền đều sẽ chết theo reboot**;
  v2 chỉ đảm bảo (a) mẫu trong phiên không mất, (b) cái chết/khoảng mù
  được ghi nhận, (c) lượt sau tự hồi phục — đúng như P8 thiết kế.

### 2.3 Bảng 7 lần chết / khoảng mù (cập nhật từ bảng 5 lần của P8 §1.1)

| # | Probe | Mẫu cuối | Khoảng chết/mù | Nguyên nhân (mức chắc chắn) |
|---|---|---|---|---|
| 1 | K8 (đợt 83) | #5 18:21Z 10/11 | 18:21–18:31Z | **Chưa rõ** — chết trước reboot kế (~20:18Z) ~2h; giả thuyết mạnh nhất: runtime dọn phiên (GC); không loại trừ reboot trung gian |
| 2 | L6 (đợt 84) | #10 22:18:49Z 10/11 | 22:18–22:28Z | **Chưa rõ** — chết trước reboot kế (~23:28Z) ~60'; cùng giả thuyết GC |
| 3 | M5 (đợt 85) | #11 01:21:56Z 11/11 | 01:22–01:32Z | **Chưa rõ** — chết trước reboot kế (~02:03Z) ~30–40'; cùng giả thuyết GC |
| 4 | N8 (đợt 86) | #5 03:19:38Z | 03:19–03:29Z | **Chưa rõ** — không đủ dữ kiện uptime lúc đó |
| 5 | O10 (đợt 87) | #9 07:13:35Z | 07:13–07:23Z | **Chưa rõ** — chết trước reboot 08:24:39Z ~60'; khoảng mù 07:13–08:49Z không quan sát |
| 6 | v2 loop 13674 (đợt 88) | #5 09:19:52Z | chết ~09:21:17Z | **CHẮC CHẮN: reboot 09:21:17Z** — lần đầu tiên một cái chết có nguyên nhân ghi nhận (boot d473b560 → e10b9199) |
| 7 | — (đợt 89, lượt này) | #6 09:41:01Z | mù 09:41:01–11:37:37Z (~116') | **Không có observer** (không loop nào được start sau #6) + **reboot 11:34:38Z** ở cuối khoảng mù (boot e10b9199 → 7439870b); không loại trừ reboot trung gian khác |

Ghi chú: lần 7 không phải "loop chết lần thứ 6" — nó là hệ quả của việc
closing đợt 88 không start loop mới + VM reboot. Phân biệt này quan trọng:
nó cho thấy **ngay cả khi loop không bị dọn phiên, việc không start lại
loop sau mỗi lượt cũng tạo khoảng mù** — và chỉ cron riêng 10 phút (hoặc
một cơ chế start lại loop ở mỗi lượt) mới lấp được.

### 2.4 Vì sao lượt này KHÔNG start loop mới

Checklist P8 §2.3 có dòng "chạy loop foreground trong lúc làm việc" — nhưng
luồng Q8 này chỉ còn vài phút việc sau khi chạy `status` + `once` (quét +
viết LIMITS), không có phiên foreground dài để giữ loop. Start loop bằng
`setsid nohup ... &` rồi thoát phiên sẽ **tái tạo đúng mẫu chết của probe
v1** (nền sống trong phiên, chết sau khi phiên kết thúc — giả thuyết GC
chưa bác bỏ). Vì vậy lượt này **không start loop nền**; quyết định start
lại loop ở mỗi lượt (hay cron riêng 10 phút) thuộc parent (xem §5).
Hậu quả trung thực: sau probe #7, khoảng mù tiếp theo bắt đầu ngay khi
luồng này kết thúc, cho tới lượt cron kế (21:35 +07 = 14:35Z).

## 3. Quét lại writeFileSync toàn repo (snapshot ~11:40–11:45Z)

Phương pháp: `find` liệt kê file `*.js/*.ts/*.mjs/*.cjs/*.sh/*.py/*.md`
(loại `node_modules`, `.venv*`, `dist`, `release*`, `chrome-userdata`,
`.eperm-probe*`, `bundled-server` ở gốc, `assets`) → 11.650 file, rồi
`grep -c writeFileSync`. Lưu ý: lần quét đầu bằng `rg` toàn repo bị kẹt
>4 phút (cây 6,7 GB, VM tải nặng do 8–10 luồng đợt 89 song song) nên đã
kill và quét lại bằng find+xargs (tổng ~4,5 phút).

| Nhóm | Dòng | So với P8 (~08:47Z) | Phân loại |
|---|---|---|---|
| Code (js/ts/mjs/cjs/sh/py) | **102** | 81 → 102 (+21) | xem dưới |
| Mẫu trong docs (*.md) | **61** | 54 → 61 (+7) | tài liệu, không chạy |
| Bản copy release-round55-l4 | **0** | 12 → 0 (−12) | thư mục **không còn tồn tại** trong cây làm việc |
| **Tổng trong phạm vi quét** | **163** | 135 → 163 | |
| Bản copy bundled-server (`apps/desktop/build/bundled-server/`) | 20 (đã nằm trong 102) | P8 loại trừ cả `bundled-server/**` nên không đếm | bản unpack generated, không phải source |

**Giải thích +21 dòng code (đối chiếu từng file với bảng P8 §4):**

- **+20 dòng: `apps/desktop/build/bundled-server/`** — bản copy của code
  server đã nối helper (trfCache 7, bridge/index 3, render 2, gpuencode 2,
  textAnimParity 1, proxy 1, rateLimit 1, outputQA 1, jobQueue 1,
  aiDownload 1). Đây là **build output, không phải source**; P8 loại trừ
  `bundled-server/**` ở gốc nhưng đường này nằm dưới `apps/desktop/build/`
  nên lọt vào phạm vi quét lần này. Các dòng này là bản sao của code đã
  nối helper ở `server/` — không phải đường ghi mới. (Cần parent quyết có
  nên đưa `apps/desktop/build/` vào danh sách loại trừ chuẩn cho các lần
  quét sau hay không — xem §5.)
- **+1 dòng: `apps/web/scripts/probe88p3-mask-track-parity.cdp.mjs:298`** —
  `if (OUT) fs.writeFileSync(OUT, JSON.stringify(finalOut, null, 1));`
  Harness đo parity P3 (đợt 88), chỉ ghi khi biến `OUT` được đặt — công cụ
  đo một lần, không phải đường ghi production.
- Các nhóm còn lại **không đổi so với P8**: apps/web/scripts 40 (39 +1
  harness trên), apps/web/src 5, server 11, apps/desktop/src 25,
  mcp-server/src 1 — đều thuộc các loại đã loại trừ có lý do (helper nội
  bộ, launcher sinh code con, fake-fs/fixture test, test ghi tmp, `.sh`
  inline).

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối.**
Async `fs.writeFile(` trong code (không tính docs): **0 dòng** ngoài helper
— các hit duy nhất của chuỗi `fs.writeFile(` nằm trong file `.md` (trích
dẫn tài liệu). So sánh được với P8: code so sánh được 82 (= 81 + 1
harness), docs 61, release copies 0.

## 4. Quét 0-byte 24h + helper tests

- **0-byte 24h** (từ 2026-11-10 11:40Z, loại node_modules/.venv/dist/
  chrome-userdata/.eperm-probe*/assets): **không file dữ liệu nào 0 byte
  mới**. `.wtest` 0 byte từ 10/11 10:13Z vẫn còn, không đổi — marker test,
  không phải dữ liệu.
- **Helper retry chạy lại (không sửa):** gốc
  `test_round83_k8_eperm_retry.mjs` **22/22 PASS**; port CJS
  `server/eperm-retry.test.cjs` **8/8 PASS**; port desktop
  `apps/desktop/src/services/epermRetry.test.cjs` **11/11 PASS**.
  Luật K8 (5×20 s) không đụng.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   (probe #7 OK 2/2) + khoảng mù 116 phút không có quan sát nào. Sóng
   ~15 phút rơi vào khoảng mù vẫn lọt hoàn toàn.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5 mục 3,
   LIMITS gộp đợt 88 §3 mục 4): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài giây,
   không giữ tiến trình nền). Q8 KHÔNG tự tạo. Cho tới khi có quyết định,
   mỗi lượt cron vòng lặp (3h/lượt) vẫn là observer duy nhất — và như lần
   7 cho thấy, **chỉ `status` + `once` mỗi lượt thì khoảng mù giữa các
   lượt vẫn ~3h**.
3. **Cần quyết: có start lại loop foreground ở mỗi lượt không?** Closing
   đợt 88 không start loop sau probe #6 → khoảng mù 116 phút. Nếu parent
   muốn lấp khoảng mù trong lúc lượt đang chạy (3h), closing/parent cần
   start `loop 16 600` foreground trong phiên closing (phiên này sống đủ
   lâu để loop chạy hết 16 lần) — hoặc chấp nhận khoảng mù cho tới khi có
   cron 10 phút. Q8 không tự quyết việc này.
4. **Cần quyết: đưa `apps/desktop/build/` vào danh sách loại trừ chuẩn
   của quét writeFileSync không?** 20 dòng bundled-server là build output
   (bản sao code đã nối helper), không phải source — đếm vào sẽ làm số
   tổng tăng giả mỗi lần build lại desktop. Đề xuất: loại trừ
   `apps/desktop/build/**` như đã loại trừ `bundled-server/**` ở gốc.
5. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt đối**
   (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ được —
   journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với cả hai giả
   thuyết, nhưng không tự chứng minh được giả thuyết nào.
6. **VM reboot ~2–3h/lần** (≥6 lần/15h): mọi probe nền đều chết theo
   reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. **Không thêm i18n key** (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND89_Q8_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round89-q8-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round89-q8.md`
(log luồng); log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
Scratch quét: `/tmp/q8-files.txt`, `/tmp/q8-wfs.txt` (không stage).

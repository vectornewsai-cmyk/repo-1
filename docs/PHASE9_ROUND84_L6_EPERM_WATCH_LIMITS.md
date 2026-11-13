# PHASE9 ROUND84 L6 — EPERM: theo dõi sóng + nối nốt retry (nợ K8 đợt 83 §5)

> Luồng L6, đợt 84 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07,
> 11/11/2026; làm việc 03:44–~04:05 +07). Nhiệm vụ: đóng nợ K8 §5 —
> theo dõi sóng EPERM sau probe #5 + nối helper vào các điểm còn lại.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow.

## 0. Kết quả headline

- **Sóng EPERM: TÁI PHÁT TRONG LƯỢT NÀY — KHÔNG hết hẳn.** Probe L6
  #2 lúc 20:58:48Z fail 1/2: ghi ra `/tmp` được **0 byte lặng** (không
  ném lỗi — đúng mẫu J6), workspace vẫn 5000 byte. Sóng chập chờn theo
  giây, chỉ một đích dính — khớp mẫu đã ghi nhận (K8 §1).
- **Probe K8 đã CHẾT sau #5, không phải chạy tới 20:20Z như kế hoạch.**
  Log K8 dừng ở probe #5 (18:21Z fail 2/2), không có dòng `probe end`,
  process không còn sống; VM reboot ~18:30Z (uptime 27 phút lúc
  20:45Z) đã giết process nohup và xóa /tmp. **Không có dữ liệu probe
  nào trong khoảng 18:21Z–20:48Z** — chỉ có log các luồng: sóng đợt 83
  ~18:10–18:26Z (K4 3 cửa sổ fail; K1 18:15–18:22; K7 icon truncate).
- **Đã nối helper vào 6 điểm còn lại:** 2 script J4 (4 lần ghi:
  `r82j4-sweep.mjs` 1×, `r82j4-headed-capture.mjs` 3× — gồm đúng đường
  ghi vite-config mà K4 từng fail vì EPERM ~18:12–18:26Z) + 2 driver
  bash J6/K1 (8 điểm `tee -a` qua hàm `tee_eperm` mới: retry 5 lần +
  verify tăng byte + giữ bản tạm khi hết retry).
- **Kiểm chứng chạy lại, đều xanh:** sweep blend-1920 chạy lại qua
  đường ghi đã nối — cases/scores **khớp 100%** với bản cũ (trừ
  `generated`); headed-capture thật w1280x800 (ngắn) **3/3 pass**,
  snaps 657.415 byte + report 671 byte parse được; `tee_eperm` test
  2/2 (append thường đúng 20 byte; append fail 5 lần → giữ part đủ
  19 byte, exit 1); `node --check` 2 script OK; `bash -n` 2 driver OK.
- **Quét 0-byte đợt 83–84: không còn file dữ liệu nào 0 byte.**
  1.754 file 0-byte tìm thấy toàn là noise Chrome (LOCK/journal/cache
  trong chrome-userdata — bình thường). File 0-byte có nghĩa duy nhất
  là `round83-k8/probe-eperm.out` (stdout redirect của probe K8,
  vốn trống vì probe ghi vào log — không phải nạn nhân EPERM).
  `icon-192.png` của K7 đã lành: 1.271 byte, PNG 192×192 hợp lệ,
  sinh lại 18:31Z (có `gen_icons.py` bên cạnh để sinh lại).

## 1. Sóng EPERM: diễn biến sau probe #5 của K8

| Mốc (UTC 10/11) | Nguồn | Diễn biến |
|---|---|---|
| ~18:10–18:26Z | K4/K1/K7 (log đợt 83) | Sóng tái phát: K4 3 cửa sổ fail (vite config EPERM), K1 Xvfb không ghi được pid lock, K7 icon-192.png truncate 0 byte |
| 18:21:27Z | Probe K8 #5 | **fail 2/2** — cả /tmp và workspace đều 0 byte |
| ~18:30Z | uptime VM | **VM reboot** — giết probe K8 (nohup), xóa /tmp; không còn dữ liệu probe sau 18:21Z |
| 20:18Z | uptime VM | Boot hiện tại (27 phút lúc 20:45Z); khoảng 18:30–20:18Z không có quan sát nào |
| 20:48:48Z | Probe L6 #1 | OK 2/2 (5000 + 5000) |
| 20:58:48Z | Probe L6 #2 | **fail 1/2 — /tmp = 0 byte lặng**, workspace OK 5000 |

**Kết luận: sóng vẫn sống trong đợt 84.** Probe #2 dính đúng mẫu
0-byte lặng của J6 (ghi "thành công" nhưng file 0 byte). Sóng chập
chờn theo giây và không theo đường dẫn: cùng một probe, /tmp dính
còn workspace qua. **Không tuyên bố "đã hết hẳn"** — đây là lần tái
phát thứ 3 sau các lần "đã hết" trước đây (18:36 +07 10/11, rồi
22:50–23:05 +07; rồi 18:10–18:26Z; rồi 20:58Z).

Probe L6 TIẾP TỤC CHẠY nền tới ~23:28Z (16 lần, 10 phút/lần) — parent
đọc `hidden_files/round84-l6/eperm-probe.log` để có đủ mẫu. Lưu ý:
probe nền không sống qua reboot (K8 là bằng chứng) — nếu VM reboot
nữa, log sẽ dừng không có dòng `probe end`, đó là dấu hiệu reboot
chứ không phải sóng.

## 2. Đã nối helper vào các điểm còn lại (nợ K8 §5)

### 2.1 `apps/web/scripts/r82j4-sweep.mjs` — 1 điểm

- Dòng 74 `fs.writeFileSync(OUT, …)` → `writeFileEpermRetry(OUT, …,
  { label: "r82j4-sweep" })` + import helper. Không còn
  `writeFileSync` nào trong file.

### 2.2 `apps/web/scripts/r82j4-headed-capture.mjs` — 3 điểm

- Dòng 439: ghi vite config (`/tmp/round82-j4/vite.r78f7.config.mjs`)
  → helper. **Đây đúng là đường ghi mà K4 fail vì EPERM trong sóng
  ~18:12–18:26Z** (vite không load được config).
- Dòng 584/591: ghi `r82j4-snaps-wWxH.json` + `r82j4-headed-report-
  wWxH.json` → helper (label riêng từng file).
- Không còn `writeFileSync` nào trong file. Chưa nối: `fs.openSync`
  ghi `r82j4-vite.log` / `r82j4-chrome.log` (fd-based, không phải
  `writeFileSync`) — xem §5.

### 2.3 Driver bash J6/K1 — 8 điểm `tee -a` qua hàm `tee_eperm` mới

Helper `.mjs` không dùng được từ bash nên viết hàm `tee_eperm`
inline (tự chứa trong từng driver, cùng mẫu như J6 sao chép driver
I2 — không phụ thuộc file ngoài, tránh gãy khi dọn thư mục khác):

- `hidden_files/round82-j6/tools/run-session.sh` — 4 điểm
  (`j6-run.log`: khối header + 2 echo điều kiện + dòng harness +
  dòng exit).
- `hidden_files/round83-k1/tools/run-session.sh` — 4 điểm
  (`k1-run.log`, tương tự).
- Hợp đồng `tee_eperm <log>`: đọc stdin vào file tạm → passthrough
  ra stdout (như tee, để run-all vẫn gom được output) → append kèm
  **verify log tăng đúng số byte** (bắt mẫu 0-byte lặng) → retry
  5 lần × `EPERM_TEE_DELAY` (mặc định 20 s, đúng nhịp helper K8) →
  hết retry thì giữ bản tạm `<log>.tee-eperm-pending-<HHMMSS>.part`
  trong cùng thư mục để không mất log, chỉ cảnh báo ra stderr,
  trả 1. `PIPESTATUS[0]` của dòng harness không đổi (vẫn là exit
  của node/timeout).
- Các driver này KHÔNG thuộc repo nên KHÔNG nằm trong batch stage
  (cùng quy tắc K8 §5) — sửa tại chỗ trong hidden_files, ghi rõ ở
  đây để parent biết.

## 3. Kiểm chứng đã làm (số thật)

- **Sweep chạy lại qua đường ghi đã nối:** `node
  apps/web/scripts/r82j4-sweep.mjs blend-1920-tp-slov-a88
  w1920x1080` → exit 0, JSON 9.235 byte ghi lại lúc 20:54Z.
  **Cases/scores khớp 100% với bản 15:48Z** (trừ `generated`):
  2 case + 2 caseRaw, 4 luật đều 2/2 (R0/G1/G2/G12, cả rounded lẫn
  raw). Đường ghi đã nối hoạt động, không hồi quy số.
  - Đính chính nhỏ: lần chạy đầu cho `blend-motion-tp-slov-a88`
    báo lỗi đúng (thiếu snapshot noise10) — snaps
    `headed-w1920x1080` hiện tại chỉ còn nguồn `blend-1920-tp-
    slov-a88` (capture chạy lại sau đã ghi đè file snaps, mất key
    blend-motion). Đây là ghi đè do chạy lại capture, KHÔNG phải
    EPERM; file JSON sweep cũ không bị đụng (md5 giữ nguyên
    `460f0f88…`). Bài học K8 (backup trước khi chạy lại script ghi
    đè) đã áp dụng: cả 2 JSON sweep đều có `.bak` trong
    `hidden_files/round84-l6/`.
  - Lỗi vận hành của L6: lệnh so sánh đầu dùng `require()` trên file
    `.bak` nên Node parse `.bak` như JS và SyntaxError — lỗi ở lệnh
    test của L6, không ở sweep; đã so lại bằng `readFileSync` +
    `JSON.parse` và khớp (xem trên).
- **Headed-capture thật (ngắn) qua đường ghi đã nối:**
  `R74B1_WIN_W=1280 R74B1_WIN_H=800` + scratch riêng
  `hidden_files/round84-l6/headed-w1280x800` (không đụng dữ liệu
  J4) → app mount, media vào bin, **3/3 pass** (D1 pixel-identical,
  D3 cùng-khung hash `3286e9d1`, H9 0 lỗi trang), process thoát
  (exit 0 theo `process.exitCode = 0` khi 3/3 pass; xem log).
  `r82j4-snaps-w1280x800.json` **657.415 byte** + `r82j4-headed-
  report-w1280x800.json` **671 byte**, cả hai parse được, report
  ghi `pass: 3/3`. Vite config ghi qua helper lúc 20:54Z, vite lên
  ngay — không retry.
- **`tee_eperm` test (hàm trích nguyên văn từ driver J6 bằng sed,
  không copy tay): 2/2.**
  - Append thường: 2 dòng → log đúng 20 byte, passthrough ra
    stdout đầy đủ.
  - Append fail (log là thư mục): retry đúng 5 lần, giữ part
    `<log>.tee-eperm-pending-*.part` đủ 19 byte nội dung gốc,
    exit 1.
- **Syntax:** `node --check` OK cả 2 script `.mjs`;
  `bash -n` OK cả 2 driver. Không còn `writeFileSync` trong 2
  script J4; không còn `tee -a` trong 2 driver.
- Helper `eperm-retry.mjs` KHÔNG sửa — test K8 16/16 vẫn đứng
  (không chạy lại vì không đụng helper; chỉ dùng lại).
- **Probe L6:** #1 OK 2/2 (20:48:48Z), **#2 fail 1/2 (/tmp 0 byte,
  20:58:48Z)** — sóng đang hoạt động (xem §1). Probe nền tiếp tục
  tới ~23:28Z.

## 4. Quét file 0-byte đợt 83–84

- Quét `round82-j4` + `round83-k*` + `round84-l*` (loại
  chrome-userdata/cache/journal/LOCK): **chỉ 1 file 0-byte có nghĩa
  — `round83-k8/probe-eperm.out`** (0 byte, stdout redirect của
  probe K8; probe ghi vào log file nên stdout vốn trống — không
  phải nạn nhân EPERM, không cần sinh lại).
- 1.754 file 0-byte còn lại toàn là noise Chrome (LOCK, journal,
  cache, LOG trong chrome-userdata) — trạng thái bình thường của
  Chrome, không phải dấu EPERM.
- Repo `docs/` + `apps/web/scripts/`: không file 0-byte mới nào từ
  10/11. JSON J4 đều đủ byte (detail1920 1.528 — đúng giá trị K8
  tính lại; sweep 9.067–9.239; snaps ~5,89 MB).
- `icon-192.png` (K7): **đã lành — 1.271 byte, PNG 192×192 hợp lệ**,
  sinh lại 18:31Z sau reboot; cách sinh lại: `gen_icons.py` trong
  `apps/desktop/dist-web/icons/` (cùng thư mục).

## 5. Giới hạn trung thực / nợ mở

1. **EPERM KHÔNG hết hẳn — sóng tái phát trong chính lượt này**
   (probe #2 20:58:48Z, /tmp 0 byte lặng). Mọi kết luận "hết" đều
   sai cho đến khi có chuỗi probe dài không fail — và ngay cả thế
   cũng chỉ là "không gặp trong lúc đo".
2. **Probe K8 chết vì reboot, không vì sóng.** Probe nền nohup
   không sống qua reboot; khoảng trống quan sát 18:21Z–20:48Z là
   mù thật. Probe L6 cũng sẽ chết nếu VM reboot nữa — đọc log phải
   kiểm tra có dòng `probe end` không.
3. **Retry 5×20 s KHÔNG qua được sóng dài ~15 phút** (luật K8 §5
   mục 2 giữ nguyên). Helper chỉ cứu sóng ngắn/lần fail lẻ.
4. **Chưa nối:** `fs.openSync` ghi vite/chrome log trong
   headed-capture (fd-based); các script headed-capture họ khác
   (`r81i4-`, `r82j5-`, `r82j7-`, `r83k4-headed-capture.mjs`, …)
   vẫn ghi trực tiếp — cùng mẫu, đợt sau nối tiếp nếu còn đụng;
   `run-all-j6.sh` / `run-all-k1.sh` dòng 21 redirect `>> "$LOG"
   2>&1` chưa qua `tee_eperm` (log tổng hợp — bản session log đã
   cứng hóa là bản chính, mất log tổng hợp không mất dữ liệu đo).
   723 lần `writeFileSync` còn lại trong `apps/web/scripts` vẫn
   chưa có retry (kiểm kê K8 §2).
5. **Sweep cho `blend-motion-tp-slov-a88` hiện KHÔNG chạy được**
   vì snaps `headed-w1920x1080` đã bị capture chạy lại ghi đè, mất
   key blend-motion (xem §3). Muốn chạy lại phải capture lại
   blend-motion ở w1920x1080 hoặc chạy sweep ở window còn đủ key.
   Không phải lỗi EPERM, không sửa trong luồng này.
6. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
7. File JSON sweep blend-1920 đã ghi đè bằng tính lại (có `.bak`
   trong `hidden_files/round84-l6/`) — nội dung khớp 100% nên
   không mất dữ liệu; lần sau vẫn backup trước khi chạy lại.

## 6. File của đợt (stage, KHÔNG push)

Sửa trong `apps/web/scripts/`:
- `r82j4-sweep.mjs` — ghi JSON sweep qua helper.
- `r82j4-headed-capture.mjs` — ghi vite config + snaps + report
  qua helper.

Mới:
- `docs/PHASE9_ROUND84_L6_EPERM_WATCH_LIMITS.md` (file này).

Sửa ngoài repo (KHÔNG stage — hidden_files, cùng quy tắc K8 §5):
- `hidden_files/round82-j6/tools/run-session.sh` — 4 điểm tee qua
  `tee_eperm`.
- `hidden_files/round83-k1/tools/run-session.sh` — 4 điểm tee qua
  `tee_eperm`.

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round84-l6-eperm-watch.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l6/`
(log luồng `../round84-l6.md`; `eperm-probe.log` + `probe-eperm.sh` —
probe nền vẫn chạy tới ~23:28Z; 2 file `.bak` sweep; capture
`headed-w1280x800/` 3/3 pass).

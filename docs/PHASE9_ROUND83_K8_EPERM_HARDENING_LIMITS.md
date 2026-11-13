# PHASE9 ROUND83 K8 — EPERM: theo dõi sóng lặp lại + cứng hóa retry

> Luồng K8, đợt 83 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 11/11/2026; làm việc 00:40–~01:40 +07). Nhiệm vụ: đóng nợ §4 mục 9 của
> đợt 82 — EPERM là sóng lặp lại, theo dõi + cứng hóa retry.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow.

## 0. Kết quả headline

- **Sóng EPERM: KHÔNG gặp trong lượt này (tính đến thời điểm kết sổ
  18:02Z).** Probe ghi 5 KB theo chu kỳ 10 phút vào cả /tmp và
  workspace: **3 lần probe (17:41–18:01Z), 0 lần fail**. Probe nền
  TIẾP TỤC CHẠY tới ~20:20Z (16 lần) — parent đọc
  `hidden_files/round83-k8/eperm-probe.log` để có đủ mẫu. Đây là phép
  đo theo chu kỳ, KHÔNG phải kiểm tra một lần — nhưng **KHÔNG được đọc
  thành "EPERM đã hết hẳn"**: sóng đã từng hết lúc 18:36 +07 ngày 10/11
  rồi tái phát 22:50–23:05 +07 cùng ngày (đợt 82 J4/J6). Sóng lặp lại
  theo cơn ~15 phút; hết lúc đo không có nghĩa là hết hẳn.
- **Helper dùng chung mới `apps/web/scripts/eperm-retry.mjs`**: retry
  EPERM 5 lần × 20 s (đúng nhịp `package-ship.mjs` của J8) + verify đủ
  byte sau ghi (bắt cả mẫu ghi 0-byte lặng). Chỉ retry lỗi mang dấu
  EPERM; lỗi khác ném ngay.
- **Đã nối 4 điểm ghi quan trọng vào helper** (harness đo + ffmpeg
  wrapper + 2 script J4): `server/render/src/harnessShared.js`
  (`runFfmpegShared` + 2 lần ghi raw/yuv), harness đo chuẩn
  `measure-78f2-gate-harness.mjs` (ghi best-effort + screenshot +
  log cuối), `r82j4-detail1920.mjs` (ghi JSON), `r82j4-media-build*.mjs`
  (ffmpeg `ff()`).
- **Test retry: ALL PASS 16/16** (`test_round83_k8_eperm_retry.mjs`,
  fault-injection + đường thật). Harness đo dry-run OK; harnessShared
  chạy thật qua ffmpeg (2×2 RGB→YUV→RGB) OK; test consumer V19 DONE
  exit 0 (số khớp tham chiếu v18); tsc web exit 0 (0 lỗi).

## 1. Theo dõi sóng EPERM trong lượt (phép đo thật, theo chu kỳ)

Probe: script `hidden_files/round83-k8/probe-eperm.sh` (chạy nền bằng
nohup, tách khỏi phiên exec), mỗi 10 phút ghi 5.000 byte vào
`/tmp/eperm-probe-k8/p.bin` và `~/workspace/repo-1/.eperm-probe-k8/p.bin`,
verify đủ byte bằng `stat`, log vào
`hidden_files/round83-k8/eperm-probe.log`. Tổng cộng 16 lần probe theo
kế hoạch (~160 phút, 17:41–20:20Z); probe TIẾP TỤC CHẠY sau khi luồng
K8 kết sổ — parent đọc log để có đủ 16 lần.

| # | Giờ UTC | /tmp | workspace | Kết quả |
|---|---|---|---|---|
| 1 | 17:41:27Z | 5000 ✓ | 5000 ✓ | OK |
| 2 | 17:51:27Z | 5000 ✓ | 5000 ✓ | OK |
| 3 | 18:01:27Z | 5000 ✓ | 5000 ✓ | OK |
| 4–16 | ~18:11–20:20Z | (probe nền đang chạy — đọc eperm-probe.log) | | |

Bối cảnh lượt này: VM vừa reboot (uptime 13 phút lúc 17:40Z, /tmp bị
xóa sạch). Luồng K1 (đợt 83) probe trước đo lúc 17:40Z: 6/6 ghi đủ
byte — khớp probe#1 của K8. Trong suốt lượt K8, mọi ghi file (code,
test, JSON, LIMITS) đều thành công ngay lần đầu, không lần nào phải
retry vì EPERM thật.

**Mẫu sóng đã ghi nhận (tổng hợp từ các đợt trước — để nhận biết):**
- Ghi file ra 0 byte, có khi KHÔNG ném lỗi (J6 16:05–16:09Z: mọi ghi
  từ cây driver đều 0 byte; python flush bị nuốt lặng; `echo > file`
  báo `write error: Operation not permitted` lúc 16:09:24Z).
- ffmpeg fail `Could not write header … Operation not permitted`
  (J4: 13 lần transcode liên tiếp 15:50–16:01Z, gồm vòng 8 lần có
  sleep 15 s; cả ghi ra pipe và /dev/shm đều fail).
- node `writeFileSync` fail rải rác (J4: 1 lần 15:53Z; JSON detail1920
  fail 5/5 retry lúc ~16:02Z).
- Sóng chập chờn theo giây, không theo đường dẫn hay filesystem (/tmp
  tmpfs và /home đều bị); sóng kéo dài ~15 phút (22:50–23:05 +07).
- Xen kẽ trong sóng vẫn có lúc ghi qua được (bash `echo >`, `dd`
  50 MB, `muse.write` vẫn qua ở các thời điểm xen kẽ — J4 15:56Z).
- Sóng từng được ghi là "đã hết" 2 lần trong đợt 81 rồi tái phát —
  **quy tắc: không bao giờ tuyên bố "EPERM đã hết hẳn".**

## 2. Rà soát: những chỗ ghi file còn thiếu retry (kiểm kê trung thực)

- `apps/web/scripts/`: **723 lần gọi `writeFileSync`** (đếm bằng
  `rg -c`), trong **477 file**. Không thể — và không nên — cứng hóa
  tràn lan trong một luồng.
- `apps/desktop/scripts/` + `server/render/src/`: **110 file** chứa
  `writeFileSync`.
- Đã có retry từ trước: `apps/desktop/scripts/package-ship.mjs`
  (`runSyncRetry`, 5 lần × 20 s — J8, đợt 82) — KHÔNG sửa lại, chỉ
  tái dùng đúng nhịp của nó cho helper mới.
- Tiêu chí chọn điểm cứng hóa đợt này (tối đa ~5 điểm): (a) harness đo
  đang sống — nơi sóng EPERM từng giết cả chặng đo (J6); (b) ffmpeg
  wrapper dùng chung — nơi J4 fail 13 lần; (c) script J4 vừa là nạn
  nhân trực tiếp của sóng. Các điểm còn lại xem §5 (nợ mở).

## 3. Đã cứng hóa (4 điểm + helper + test)

### 3.1 Helper dùng chung — MỚI: `apps/web/scripts/eperm-retry.mjs`

- `writeFileEpermRetry(file, data, { tries=5, delayMs=20000, label, fsImpl })`:
  ghi đồng bộ, verify đủ byte bằng `statSync` sau mỗi lần ghi; ghi
  thiếu byte (mẫu 0-byte lặng của J6) được coi là lỗi EPERM và thử
  lại; trả `{ attempts, bytes }`; ném lỗi cuối khi hết lượt hoặc khi
  lỗi không phải EPERM.
- `runSyncEpermRetry(cmd, args, { tries, delayMs, label, timeout, spawnImpl })`:
  chạy lệnh đồng bộ qua `spawnSync`; retry CHỈ khi spawn error có code
  EPERM hoặc stderr chứa `Operation not permitted`; lỗi khác (sai tham
  số, codec, timeout) ném ngay sau lần đầu; trả kết quả spawn khi
  exit 0.
- `isEpermError(err)` / `isEpermText(text)` / `sleepSync(ms)`
  (Atomics.wait) / hằng `EPERM_TRIES = 5`, `EPERM_DELAY_MS = 20000`.
- Mọi lần thử fail đều log ra stderr với nhãn `[eperm-retry]` (không
  giấu lỗi). `opts.fsImpl` / `opts.spawnImpl` chỉ phục vụ test
  fault-injection.
- Dùng được từ cả ESM (`import`) và CJS (`require` — Node ≥ 22.12 cho
  require ESM đồng bộ; VM này chạy Node v24.22.1, đã thử trực tiếp từ
  thư mục `server/render/src`).

### 3.2 `server/render/src/harnessShared.js` — ffmpeg wrapper dùng chung

- `runFfmpegShared` nay gọi `runSyncEpermRetry("ffmpeg", …)` — retry
  khi ffmpeg fail vì EPERM. Được ~15+ test/measure script dùng chung
  (`test_v11/v12/v14_parity`, `test_v19_*`, `measure_r19–r25_*`, …).
  Message lỗi đổi dạng nhẹ (`thoát mã N` thay cho `ffmpeg exit N`) —
  đã grep, không caller nào match chuỗi cũ.
- `ffmpegRgbToYuv420` (ghi `*-rgb-in.raw`) và `ffmpegYuvToRgb420`
  (ghi `*-yuv-in.yuv`) nay ghi qua `writeFileEpermRetry` (verify đủ
  byte) — input cho ffmpeg mà 0 byte thì ffmpeg fail khó hiểu, nay
  được bắt ngay ở bước ghi.
- `require("../../../apps/web/scripts/eperm-retry.mjs")` từ CJS — đã
  thử load trực tiếp, OK trên Node v24.

### 3.3 `apps/web/scripts/measure-78f2-gate-harness.mjs` — harness đo chuẩn

- `writeBestEffort` nay retry EPERM 5×20 s + verify đủ byte trước khi
  bỏ cuộc; hợp đồng best-effort giữ nguyên (hết retry vẫn fail thì
  chỉ cảnh báo qua log, không ném).
- `shot()` (screenshot PNG): ghi qua helper (retry + verify) — giữ
  nghiêm (ném sau khi hết retry) để không ghi số rác lặng.
- Khối `catch` cuối (ghi `presented-fps.log` khi harness lỗi): ghi qua
  helper trong cùng `try/catch {}` lặng như cũ.
- Chỉ đổi ĐƯỜNG GHI, không đổi logic đo. **Lưu ý phối hợp:** luồng K1
  (đợt 83) đang chạy harness này trực tiếp lúc K8 sửa file (chặng A
  S6–S10, mỗi attempt spawn node mới). Sửa xong đã `node --check` +
  dry-run OK ngay; driver K1 sau đó vẫn chạy bình thường (session 7
  attempt 4 lúc 17:53:50Z chạy tới bước đánh giá gate rồi exit 2 vì
  drawDelta=2 — lỗi gate, KHÔNG phải lỗi load harness).

### 3.4 `apps/web/scripts/r82j4-detail1920.mjs` + `r82j4-media-build*.mjs`

- `r82j4-detail1920.mjs`: thay vòng retry tay 5×2 s của J4 bằng
  `writeFileEpermRetry` (thêm verify đủ byte; nhịp 5×20 s). Giữ nguyên
  hợp đồng exit 3 khi không ghi được.
- `r82j4-media-build1920.mjs` và `r82j4-media-build.mjs`: `ff()` nay
  dùng `runSyncEpermRetry` (timeout 300 s giữ nguyên; `execFileSync`
  đã gỡ khỏi cả hai file). Đây là đúng đường ffmpeg mà J4 fail 13 lần.

## 4. Kiểm chứng đã làm (số thật)

- **Test helper `test_round83_k8_eperm_retry.mjs`: 16/16 PASS —
  ALL PASS, exit 0.** Fault-injection: write fail EPERM 2 lần rồi OK
  (attempts=3); ghi 0-byte lặng 2 lần rồi OK (attempts=3); ENOENT
  không retry (đúng 1 lần); EPERM mãi đúng 5 lần rồi ném; runSync
  ffmpeg fail EPERM 2 lần rồi OK; runSync lỗi thường không retry;
  spawn error code EPERM retry rồi OK. Đường thật: ghi 5.000 byte ra
  /tmp + workspace, đọc lại khớp; `true` exit 0.
  (Lưu ý: lần chạy đầu 15/16 — 1 FAIL do lỗi test: payload
  `"k8-probe-".repeat(500)` chỉ dài 4.500 byte mà assert 5.000; đã
  sửa thành repeat(600) rồi chạy lại 16/16. Lỗi ở test, không ở helper.)
- **Harness đo dry-run:** `F2_DRY_RUN=1 node
  apps/web/scripts/measure-78f2-gate-harness.mjs` → exit 0
  (`decideRegateKill=function E2_REGATE_CONFIRM=true …`).
- **harnessShared chạy thật qua ffmpeg:** `ffmpegRgbToYuv420` 2×2
  RGB→YUV (6 byte) + `ffmpegYuvToRgb420` ngược (12 byte), OK —
  chứng minh `runFfmpegShared` + 2 lần ghi đã nối hoạt động với
  ffmpeg thật.
- **Chạy lại `r82j4-detail1920.mjs` (đường ghi đã nối):** exit 0,
  `DONE — r82j4-detail1920.json`; JSON mới 1.528 byte, parse được,
  đủ key (blend1920f30 / webmF25 / tp1920 / madBlendVsWebm /
  slovInBlend_*); các số KHỚP tỉ lệ đã công bố ở J4 LIMITS §3.3
  (vd fracGt8H slov-in-blend/webm = 1,12 / 0,93 / 0,86; MAD
  blend-vs-webm 14,914 ≈ kỳ vọng ~15).
  - **Đính chính + lỗi vận hành của K8:** file JSON cũ 823 byte
    (md5 `7f0c8360b3119ccb1e813b7b37390b78`) đã bị GHI ĐÈ mà K8 không
    backup trước. 823 byte không thể là output đầy đủ của script này
    với cùng input (output đầy đủ là 1.528 byte) — nhiều khả năng là
    file bị cắt ngắn lặng trong sóng EPERM tối 10/11 (J4 ghi fail
    5/5 retry lúc ~16:02Z). File mới là tính lại đầy đủ từ cùng
    `.raw` đầu vào, số khớp LIMITS J4 — nhưng K8 không còn bằng
    chứng trực tiếp về nội dung file cũ (chỉ còn md5). Bài học:
    backup trước khi chạy lại script ghi đè dữ liệu của luồng khác.
- **Test consumer V19** (`server/render/src/test_v19_harness_yuv_shared.js`,
  dùng `harnessShared` qua `ffmpegYuvCompare`): DONE, exit 0 sau
  ~188 s. Số khớp tham chiếu v18: S1 circleopen MAD 0,3820 (v18:
  0,382); S2 dissolve MAD 57,7793 (v18: 57,7793); S2 circleopen
  1,4866 (v18: 1,4866); S5b circleopen MAD-YUV 0,4354 (v18: 0,4291)
  — không hồi quy do đổi `runFfmpegShared` / ghi raw-yuv.
- **tsc web:** `npx tsc -p tsconfig.json --noEmit` (apps/web) → exit 0,
  0 lỗi (chạy ~181 s).
- `node --check` OK cả 7 file đổi/mới.

## 5. Giới hạn trung thực / nợ mở

1. **EPERM KHÔNG được tuyên bố là đã hết.** Probe trong lượt: 0 fail
   (xem §1), nhưng sóng đã tái phát sau 2 lần "đã hết" trước đây.
   Probe nền tiếp tục chạy tới ~20:20Z (16 lần); parent đọc
   `hidden_files/round83-k8/eperm-probe.log` để có đủ mẫu.
2. **Retry 5×20 s KHÔNG qua được sóng dài ~15 phút.** Helper chỉ cứu
   sóng ngắn và lần fail lẻ. Khi hết retry mà vẫn EPERM, helper NÉM
   LỖI — caller phải dừng theo luật "bị chặn thì dừng, không cố
   lách". Không được tăng tries/delay vô tội vạ để "cố qua sóng".
3. **Chưa cứng hóa tràn lan:** còn 723 lần gọi `writeFileSync` trong
   `apps/web/scripts` + 110 file ở desktop/render chưa có retry.
   Riêng 2 script J4 còn lại cùng họ (`r82j4-headed-capture.mjs`,
   `r82j4-sweep.mjs` — ghi JSON trực tiếp, không retry) chưa nối;
   `r82j4-sweep.mjs` dòng 74 `fs.writeFileSync(OUT, …)` là ứng viên
   tiếp theo nếu đợt sau còn đụng. Các driver bash trong
   `hidden_files/round*/tools/` (run-session.sh của J6/K1 — nơi sóng
   giết chặng B/C) KHÔNG thuộc repo nên không nằm trong batch này;
   muốn cứng hóa thì phải sửa ở từng driver (vd: ghi qua file tạm +
   verify byte trước khi mv — mẫu J6 đã dùng tay lúc 16:04Z).
4. **ffmpeg retry chạy lại toàn bộ lệnh.** Với lệnh encode dài (vài
   phút), mỗi lần retry tốn một lần chạy lại — chỉ retry khi stderr
   có dấu EPERM nên không chạy lại vì lỗi codec/tham số; nhưng
   transcode dài mà dính sóng thì 5 lần chạy lại vẫn tốn kém. Chấp
   nhận được ở quy mô harness đo hiện tại.
5. **Helper là ESM, CJS dùng qua require(ESM).** Chỉ chạy trên
   Node ≥ 22.12 (VM này v24.22.1 — OK). Nếu repo chạy trên Node cũ
   hơn ở máy khác, `require` này sẽ fail lúc load
   `harnessShared.js` — ghi chú để ai đem code sang máy khác thì
   biết. (Không đổi được: helper phải là ESM để các script harness
   `.mjs` import trực tiếp.)
6. **File JSON J4 cũ bị ghi đè không backup** (xem §4) — nội dung
   được khôi phục bằng tính lại đầy đủ, số khớp LIMITS J4, nhưng
   đây là lỗi vận hành của K8, ghi lại để đợt sau tránh.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt — chỉ kiểm khi có
   tín hiệu Gradio stable mới).

## 6. File của đợt (stage, KHÔNG push)

Mới trong `apps/web/scripts/`:
- `eperm-retry.mjs` — helper dùng chung (mới).
- `test_round83_k8_eperm_retry.mjs` — test kiểm chứng 16 khẳng định.

Sửa:
- `server/render/src/harnessShared.js` — `runFfmpegShared` + 2 lần
  ghi raw/yuv qua helper; require helper ESM.
- `apps/web/scripts/measure-78f2-gate-harness.mjs` — ghi best-effort
  + screenshot + log cuối qua helper.
- `apps/web/scripts/r82j4-detail1920.mjs` — ghi JSON qua helper.
- `apps/web/scripts/r82j4-media-build1920.mjs` — `ff()` qua helper.
- `apps/web/scripts/r82j4-media-build.mjs` — `ff()` qua helper.

Docs: `docs/PHASE9_ROUND83_K8_EPERM_HARDENING_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round83-k8-eperm-hardening.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round83-k8/`
(log luồng `../round83-k8.md`; `eperm-probe.log` + `probe-eperm.sh` —
probe nền vẫn chạy tới ~20:20Z).

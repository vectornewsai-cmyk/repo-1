# Phase 9 đợt 95 — W8: Sửa các nợ harness (LIMITS gộp đợt 94 §4 mục 8)

**Nợ gốc:** LIMITS gộp đợt 94 §4 mục 8 — 5 nợ harness: (1) race display
Xvfb khi nhiều luồng chạy probe song song (picker :193–:197 không có
lock); (2) ngưỡng canvasOk 0,01 chưa tự hiệu chuẩn theo clip; (3) T2 vẫn
mỏng (assert theo thời gian wall-clock); (4) probe V3 trùng tên case
giữa các mode; (5) O8 kiểm tra fixture TRƯỚC khi mkdir scratch.
**Ngày:** 2026-11-12 (lượt cron 12:35 +07; làm việc ~05:40–06:30Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái: ĐÃ XONG CẢ 5 MỤC** — 4 mục sửa xong + kiểm chứng bằng chạy
thật; 0 mục "giữ nguyên" (mọi mục đều sửa được an toàn). Chỉ sửa
harness/test/probe — không sửa logic production, không đụng TTS 39,
birefnet, `.github/workflows`.

## 1. Lock display Xvfb (mục 1) — ĐÃ SỬA

**Vấn đề (V7 §6):** picker cũ của probe89q5 chỉ KIỂM TRA socket rồi mới
chọn display — luồng song song chiếm display giữa check và spawn →
Chromium GOP250 lần 1 fail Xvfb ở :194.

**Sửa:**
- Mới: `apps/web/scripts/xvfb-display.mjs` — claim display bằng thư mục
  lock nguyên tử (`/tmp/vcut-xvfb-lock/X<NNN>.lock` + file `pid`):
  `mkdir` nguyên tử → chỉ 1 tiến trình giữ 1 display; mọi thao tác
  check-socket / dọn socket mồ côi / spawn Xvfb đều diễn ra TRONG LÚC
  giữ lock; lock giữ suốt lượt chạy, nhả ở cleanup (sau khi tắt Xvfb);
  lock mồ côi (pid giữ đã chết + không còn Xvfb trên display đó) được
  thu hồi an toàn khi luồng khác claim.
- `probe89q5-seek-latency.mjs` dùng lock (claim ở đầu main, nhả ở
  cleanup).
- Hành vi claim: **fail-fast khi hết display** (trả null ngay, như
  picker cũ) — chỉ retry ~60s khi gặp EPERM/EACCES (sóng EPERM làm
  mkdir /tmp lỗi tạm thời), hết 60s vẫn toàn EPERM thì ném lỗi rõ
  thay vì trả null gây nhầm là "hết display".

**Bug tự bắt được trong test (ghi trung thực):** bản đầu retry toàn bộ
60s cả khi display chỉ đơn thuần "đã có chủ" — claim lúc display đang
bị giữ đã đợi rồi CHIẾM display ngay sau khi holder nhả (sai ngữ nghĩa
của "thử claim"), làm phase C fail 3/8 check lần chạy 1. Đã sửa thành
fail-fast (chỉ retry khi EPERM), chạy lại PASS 8/8.

**Kiểm chứng** (`test-xvfb-display-lock.mjs`, mới): **PASS 8/8**
- A: lock mồ côi (pid 999999 đã chết, không Xvfb) được thu hồi →
  claim được :211; nhả sạch sau test.
- B: 3 tiến trình con claim song song trên dải :193–:197, mỗi con spawn
  Xvfb thật + giữ 3s → **3 display khác nhau, 0 fail Xvfb**
  (lần 1: :194/:195/:196; lần 2: :196/:195/:197) — đúng lỗi V7 gặp.
- C: display đang bị giữ → claim trả null; nhả xong claim lại được;
  không lock/Xvfb mồ côi.
- Tích hợp thật: probe89q5 2 lượt kiểm chứng mục 2 đều claim **:194
  bằng lock** (log "Xvfb display :194 đã claim"), Xvfb lên, không còn
  lock sau khi chạy xong (`/tmp/vcut-xvfb-lock/` trống).

**Phạm vi:** các script clicktest cũ (46b1/47c1/…) dùng vòng spawn-thử +
kiểm tra exitCode nên đã nguyên tử theo cách riêng — không đổi. O8 dùng
display cố định qua env (:187/:188) — không dùng module này. Probe nào
sau này thêm picker check-rồi-chọn thì dùng module này thay vì copy
mẫu cũ.

## 2. Hiệu chuẩn ngưỡng canvasOk theo clip (mục 2) — ĐÃ SỬA

**Vấn đề (V7 §5/§9 mục 2):** ngưỡng đổi 0,01 hiệu chuẩn THỦ CÔNG trên
clip bóng (nhiễu <0,005; bước khung nhỏ nhất t=0→t=1: ΔdarkCx=0,048).
Clip khác (chuyển động chậm hơn / vùng tối nhỏ hơn) có thể cần ngưỡng
khác; probe không tự hiệu chuẩn.

**Sửa** (`probe89q5-seek-latency.mjs`, `CALIBRATE_FN` chạy đầu lượt —
sau khi clip lên timeline + pause, trước baseline/trials):
- Seek lần lượt t=0..5 (pause-seek có xác nhận, chờ element tới đích
  tối đa 10s + canvas ổn định tối đa 5s), mỗi t lấy 3 mẫu darkCx khi
  canvas đã ổn định → **nhiễu** = lệch lớn nhất khỏi trung vị;
  **bước khung nhỏ nhất** = min |ΔdarkCx| giữa 2 t liên tiếp.
- **Ngưỡng đổi = max(bước/4, 2×nhiễu)**, kẹp ≤0,02;
  **ngưỡng ổn định = max(0,005, min(nhiễu×1,5, 0,01))**.
  Hỏng (không đo được minStep / exception) → fallback ngưỡng cũ
  0,01/0,005, ghi rõ trong JSON + log, không fail cả lượt.
  `--no-calibrate` để bỏ qua bước này.
- Mỗi trial ghi lại ngưỡng đã dùng (`changeThreshold`/`stableEps`)
  để kiểm tra sau.

**Kiểm chứng — 2 clip, Chromium, `--load`, trials 6, exit 0:**

| Clip | minStep | noise | changeThreshold | stableEps | Trials |
|---|---|---|---|---|---|
| GOP250 | 0,0481 | 0 | **0,012** | 0,005 | **6/6 confirmed** |
| GOP30 | 0,0481 | 0 | **0,012** | 0,005 | **6/6 confirmed** |

- Frames đo được GOP250: t=0..5 =
  0,3544 / 0,4025 / 0,4507 / 0,4989 / 0,5493 / 0,5975 — **khớp đúng số
  đo thủ công của V7** (t=0→t=1: 0,3544→0,4025, Δ=0,048). GOP30 gần
  như giống hệt (t=4: 0,5482; t=5: 0,5963 — lệch ~0,001 do biên
  khung). Ngưỡng tự tính 0,012 ≈ ngưỡng thủ công 0,01 của V7.
- tElement/tCanvas median: GOP250 2934/3698ms; GOP30 1207/1732ms
  (chậm hơn V7 do tải ambient rất nặng lúc chạy — loadavg ~10–16;
  số tuyệt đối không so ngang phiên, như mọi lần). 0 already-at-target,
  0 stale-timeout cả 2 clip.
- `noise=0` cả 2 lượt: canvas khi pause là tĩnh, 3 mẫu giống hệt nhau
  tới 4 chữ số thập phân — hạng `2×nhiễu` không ràng buộc lần này,
  ngưỡng hoàn toàn do `bước/4` quyết. Nhánh `thresholdNoiseLimited`
  (ngưỡng bị nhiễu chi phối) chưa được kiểm chứng ngoài đời — xem §8.
- Chi phí: hiệu chuẩn thêm ~50–70s mỗi lượt (6 lần seek + chờ ổn
  định) — chấp nhận được.

## 3. T2 đếm re-arm thay vì ngưỡng thời gian (mục 3) — ĐÃ SỬA

**Căn cứ đo (làm lại đợt này, không tin mù số U7):** chạy lại
probe93u7-q5-timing-flake, load 6×, 30 rep (file JSON của U7 được
backup trước + khôi phục nguyên vẹn sau, sha256 `8edd4cfb…`):
- T1 (có gia hạn) resolve: min **124ms** / median 205 / max 314.
- T2 (không gia hạn) resolve: min 100 / median 105 / max **176ms**.
- **Hai phân phối CHỒNG nhau 124–176ms** — không có ngưỡng thời gian
  nào phân biệt chắc chắn "có gia hạn" vs "không gia hạn" dưới tải.
  0 flake cả hai (30/30), khớp kết luận U7 §2.

**Sửa** (`apps/web/src/lib/seek.test.ts` — chỉ test, không đụng
`seek.ts`):
- T2 cũ (sleep 180ms rồi assert promise đã resolve) → **đếm số lần
  `setTimeout(100)`** qua helper `countTimeoutCalls` (đếm trong lúc
  promise đang chạy, trả lại `setTimeout` gốc trong `finally`):
  không gia hạn = đúng **1 lần arm (0 lần re-arm)**, kết quả vẫn
  `{ seeked: false, timedOut: true }`.
- Thêm test **đối chứng**: seeking=true, seeked không tới → đúng
  **3 lần gọi** (1 arm + 2 re-arm) rồi timedOut. Nếu bộ đếm hỏng
  (đếm thừa/thiếu) thì test này fail ngay — chứng minh phép đếm phân
  biệt được hai đường, không phải assert rỗng.
- T1 giữ nguyên (sleep 60 → assert chưa resolve): biên còn rộng
  (sleep median ~91ms, resolve min 124ms) và T1 kiểm tra "chưa
  timeout ở deadline đầu" chứ không phải phân biệt hai đường — không
  có lý do sửa.

**Kiểm chứng:**
- Suite `seek.test.ts`: **21/21** (cũ 20/20 + 1 test đối chứng mới).
- Chạy **10/10 lần 21/21 dưới 3× `yes`** (loadavg ~9–11 lúc chạy).
- `tsc` web **0 lỗi** (xem caveat dưới về 1 lần chạy giữa chừng).
- Không sửa production: `src/` ngoài test không đổi → không cần
  vite build lại (suite chạy bằng node strip-types như cũ).

**Caveat (ghi trung thực):**
- Lần chạy load-test đầu tiên đo sai: `tail -1` bắt nhầm dòng warning
  của Node (báo PASS=0/10 sai) + 1 tiến trình `yes` mồ côi (PID 16049,
  do stderr còn giữ pipe của session nên shell thoát mà con chưa chết)
  — đã kill theo PID và chạy lại đúng (grep "passed", `yes` redirect
  cả stderr, kill theo PID đã spawn). Không dùng `pkill` theo tên
  (bài học U7).
- 1 lần chạy `tsc` giữa chừng báo 2 lỗi ở
  `apps/web/src/media.retryPlay95W2.test.ts` — file của luồng W2 khác
  đang sửa dở (untracked, mtime 06:09), không phải của W8; chạy lại
  sau đó tsc 0 lỗi, không có lỗi nào ở `seek.test.ts`.

## 4. Probe V3 trùng tên case (mục 4) — ĐÃ SỬA

**Kiểm tra JSON cũ (chỉ đọc, không sửa file thật):**
- File kết quả `benchmarks/results/webkit-blob-flaky-94v3.json`:
  64 case, tên duy nhất 64/64.
- `hidden_files/round94-v3/analysis-cases.json`: 68 case, có 4 tên
  trùng: `Lc2/4/6/8-blobA-run1` (MATRIX-r1 vs MATRIX2-r1).
- Kết luận: **4 case MATRIX-r1 (biến thể A/prod, run 1, cả 4 clip) đã
  mất khỏi file kết quả** — bị bản MATRIX2-r1 ghi đè dưới cùng tên khi
  dedupe giữ bản mới nhất; chỉ còn trong `analysis-cases.json`. Đúng
  như V3 §10 mục 3 mô tả. (MATRIX3 chạy lại sau reboot cũng trùng tên
  với lượt bị cắt — nhưng đó là chạy lại cùng matrix, bản mới thay bản
  dở là chủ ý.)

**Sửa** (`benchmarks/render/webkit_blob_flaky_94v3.mjs`):
- `pushCase`: tên case = **`<matrix>-<tên cũ>`**
  (MATRIX/MATRIX2/MATRIX3/L2/…) + hậu tố **`-dup<N>` tự động** khi tên
  đã tồn tại trong file kết quả (chạy lại cùng matrix không bao giờ ghi
  đè nhầm nữa; log cảnh báo khi đổi tên) + trường **`matrix`** trong
  payload để phân tích theo batch.
- GST log cũng mang tiền tố matrix key (doLoad/doLoop) — cùng lỗi ghi
  đè: chạy lại MATRIX3 trước đây ghi đè log GST của lượt bị reboot cắt.

**Kiểm chứng** (bản copy của probe, OUT/BUNDLE/GST dời sang /tmp,
chạy `L2 1` hai lần trên Xvfb :199, không GST):
- Lần 1: `L2-Lc2-blob-run1`, `L2-Lc2-prog-run1` (matrix=L2), cả hai
  playOk=true.
- Lần 2 (cùng lệnh): tự đổi thành `L2-Lc2-blob-run1-dup2`,
  `L2-Lc2-prog-run1-dup2` kèm cảnh báo trùng tên — tổng **4 case, tên
  duy nhất 4/4**, bản lần 1 còn nguyên.
- File kết quả thật không đổi (sha256 `97812cae…` trước/sau giống nhau).

## 5. O8 kiểm tra fixture trước mkdir scratch (mục 5) — ĐÃ SỬA

**Sửa** (cả 2 script O8):
- Headed (`clicktest-87o8-mask-track-headed.mjs`): `mkdirSync(SCRATCH)`
  dời lên TRƯỚC khối kiểm tra fixture; thông báo lỗi mới nêu rõ thư
  mục + 3 file cần + nguồn copy (`hidden_files/round87-o8/headed/`).
- WebKit (`clicktest-87o8-mask-track-webkit.mjs`): mkdir
  SCRATCH/CFG_DIR/BRIDGE_WORK_DIR dời lên TRƯỚC khối kiểm tra fixture
  (fixture của bản webkit nằm ở HEAD/headed, không phải SCRATCH — lỗi
  cũ làm script chết trước cả lúc tạo scratch nên khối catch cuối main
  không ghi được report JSON vào SCRATCH).

**Kiểm chứng:**
- Headed, scratch mới `/tmp/w8-o8-fresh/headed`: lần 1 (chưa có
  fixture) exit 2, lỗi "thiếu fixture" rõ ràng — **nhưng thư mục đã
  được tạo và khối catch đã ghi `o8-clicktest-report.json`
  (harnessError) vào đó** (trước sửa thì thư mục còn chưa tồn tại).
  Copy 3 fixture vào → chạy lại: **O8 headed 21/21** (exit 0).
- Webkit, scratch mới `/tmp/w8-o8-fresh/webkit` (fixture đọc từ
  HEAD/headed, không cần copy): **O8 webkit 21/21** (exit 0).
- S7 khớp số ổn định của U7 cả 2 engine: Chromium mask Δx=0,112 /
  bóng Δx=0,113 (kỳ vọng canvas 0,112); WebKit mask Δx=0,194 / bóng
  Δx=0,197 (kỳ vọng canvas 0,194).

## 6. Kiểm chứng tổng hợp

| Hạng mục | Kết quả |
|---|---|
| Lock Xvfb (`test-xvfb-display-lock.mjs`) | **PASS 8/8** (A/B/C) |
| probe89q5 Chromium GOP250 (calib + 6 trial) | exit 0, calib 0,012, **6/6 confirmed** |
| probe89q5 Chromium GOP30 (calib + 6 trial) | exit 0, calib 0,012, **6/6 confirmed** |
| `seek.test.ts` | **21/21**; 10/10 lần 21/21 dưới 3× `yes` |
| probe93u7 timing flake (load 6×, 30 rep) | T1 0/30, T2 0/30; overlap 124–176ms |
| Probe V3 (bản copy, `L2 1` ×2) | 4 case tên duy nhất; file thật không đổi |
| O8 headed (scratch mới + fixture copy) | **21/21** |
| O8 webkit (scratch mới) | **21/21** |
| `tsc` web | **0 lỗi** (chạy lại sau lỗi thoáng qua của file W2) |
| `node --check` 5 script .mjs đã sửa/mới | pass |
| Không process mồ côi của luồng này | `yes` đã kill theo PID; Xvfb test đã tắt; lock dir trống |

## 7. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/xvfb-display.mjs` — MỚI: lock display Xvfb.
- `apps/web/scripts/test-xvfb-display-lock.mjs` — MỚI: kiểm chứng lock.
- `apps/web/scripts/probe89q5-seek-latency.mjs` — dùng lock + hiệu chuẩn canvasOk.
- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` — mkdir scratch trước check fixture.
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` — như trên.
- `apps/web/src/lib/seek.test.ts` — T2 đếm re-arm + test đối chứng.
- `benchmarks/render/webkit_blob_flaky_94v3.mjs` — tên case duy nhất + GST log tiền tố matrix.
- `docs/PHASE9_ROUND95_W8_HARNESS_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round95-w8-harness`
(`~/workspace/repo-1-push/paths-loop/phase9-round95-w8-harness.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w8.md`.
Số liệu thô: `hidden_files/round95-w8/` — `xvfb-lock-test.json`,
`q5-timing-flake-load6-rerun95w8.json` (+ log),
`seek-test-load10.log`, `o8-headed-fresh.log`, `o8-webkit-fresh.log`,
`run-chromium-gop250.log`, `run-chromium-gop30.log`,
`probe-chromium-load-gop{250,30}/probe-results.json`.

## 8. Nợ còn lại cho đợt sau

1. **Hiệu chuẩn canvasOk — 2 trường hợp chưa kiểm chứng ngoài đời:**
   (a) clip có chuyển động chậm / vùng tối nhỏ hơn (bước khung nhỏ hơn
   nhiều) — ngưỡng `bước/4` có thể rơi xuống dưới `2×nhiễu` và bị nhiễu
   chi phối (`thresholdNoiseLimited=true` — nhánh này chưa ai thấy chạy
   thật, vì noise=0 cả 2 lượt); (b) clip mà darkCx đo được là null ở
   vài khung (không có vùng tối) — hiệu chuẩn trả fallback, chưa đo.
   Cả hai đều có fallback an toàn (ngưỡng cũ 0,01/0,005 + ghi rõ),
   nhưng chưa có số đo.
2. **T1 vẫn dùng assert thời gian** (sleep 60 → assert chưa resolve):
   giữ nguyên có chủ ý (biên còn rộng, kiểm tra chuyện khác với T2) —
   nếu sau này T1 flake thì hướng sửa cũng là đếm re-arm (đếm = 0 lúc
   check) thay vì nới ms.
3. **GST log của doErr/doDbg chưa mang tiền tố matrix:** `doDbg` ghi
   thẳng `/home/hatch/workspace/round91-s3/gst-debug-c10-blob-runN.log`
   (chạy lại vẫn ghi đè) — ngoài phạm vi brief đợt này, để đợt sau.
4. **Lock Xvfb mới chỉ probe89q5 dùng:** các probe khác muốn claim
   display thì dùng `xvfb-display.mjs`, đừng copy mẫu picker cũ.
   Lock dir `/tmp/vcut-xvfb-lock/` mất khi reboot (tmpfs) — lock mồ
   côi sau reboot được thu hồi bằng kiểm tra pid + Xvfb, không cần dọn
   tay; nhưng nếu một tiến trình giữ lock bị SIGKILL giữa chừng thì
   lock chỉ được thu hồi khi pid đã chết (đúng) — không có cơ chế
   timeout theo tuổi lock.
5. **4 case MATRIX-r1 đã mất khỏi JSON kết quả V3 không khôi phục
   được vào file** (chỉ còn trong `analysis-cases.json` — số liệu V3
   trong LIMITS đã tính từ file đó nên không sai số nào; chỉ ghi nhận
   để khỏi ai phân tích lại từ file kết quả mà tưởng đủ 68 case).

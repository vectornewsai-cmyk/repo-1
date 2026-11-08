# PHASE9_ROUND54_K2_D4_EXIT127_LIMITS.md

> Luồng K2, Phase 9 đợt 54 — điều tra + sửa bug D4 exit 127 sau forward
> (đợt 53 J4 §6). Ngày đo: 07/11/2026 (giờ UTC trong log).
> KHÔNG push trong phiên này. AppImage dùng để đo là bản release hiện
> tại (sha `2a15ea90…`, 576.688.128 byte) — KHÔNG chứa fix sản phẩm
> Fix 2 (chỉ chứa code tới hết đợt 53); xem §6 về giới hạn này.

## 1. Kết luận — nguyên nhân gốc của 127

**127 KHÔNG phải mã thoát của sản phẩm, không phải của shell, không
phải do code Electron.** Đó là mã thoát của **AppImage runtime
(chế độ `APPIMAGE_EXTRACT_AND_RUN=1`)** khi payload không chạy được
hoặc chết bất thường, cụ thể ở đây là **exec `AppRun` thất bại vì
thư mục giải nén đã bị xóa**:

- AppImage giải nén vào
  `$TMPDIR/appimage_extracted_<md5-nội-dung-file-AppImage>`.
  md5 tính trên **nội dung** file (đã verify: md5 của AppImage copy =
  `ddc15d5441866a7c8ec9bab5cd841738` = đúng hậu tố thư mục; md5 của
  đường dẫn thì khác) — nên **mọi bản AppImage cùng nội dung, dù ở
  đường dẫn khác nhau, dùng chung MỘT thư mục giải nén** dưới cùng
  một TMPDIR.
- Runtime nào thoát cũng **xóa thư mục giải nén đó** (exit-cleanup).
- Harness đặt `TMPDIR = ~/workspace/.tmp-h9` (dùng chung) cho mọi
  spawn — mọi luồng song song + mọi instance trong cùng một lượt đều
  dùng chung thư mục. Khi runtime của luồng/instance khác thoát, nó
  xóa thư mục → runtime đang khởi động (hoặc đang chạy) mất file
  `AppRun` → runtime trả **127**.

**Bằng chứng đo được (không phải suy đoán):**

- Lượt đo phaseD4 đầu của K2 (07/11, display :150, CDP 9251,
  AppImage copy sha `2a15ea90…`): D4a PASS exitCode=0 (click Thoát
  true). D4b: **AppImage thoát sớm code=127 ở cả 2 lần launch**,
  log `/tmp/h9-d4b-d150.log` (30.949 dòng, 0 dòng `[vcut-desktop]`
  — app chưa từng chạy) kết bằng
  `Failed to run /home/hatch/workspace/.tmp-h9/appimage_extracted_ddc15d5441866a7c8ec9bab5cd841738/AppRun: No such file or directory`.
  Log bắt đầu bằng "File exists and file size matches, skipping"
  (8.760 dòng) — runtime tái dùng thư mục giải nén đã có.
- Watcher ngoài (poll `ps` mỗi 2s): runtime D4a pid 8415
  (00:04:39–00:06:10, exit 0) chạy khi chưa có runtime K5 nào thoát;
  runtime D4b lần 1 pid 9267 (00:06:12–00:08:29) trùng runtime K5
  pid 9375 (00:06:22–00:08:20); runtime D4b lần 2 pid 10292
  (00:08:33–00:10:04) trùng runtime K5 pid 10228 (00:08:24–00:10:02).
  K5 dùng cùng AppImage content (sha `2a15ea90`, xác nhận từ report
  K5). Mỗi lần runtime K5 thoát, thư mục dùng chung bị xóa.
- **Thí nghiệm đối chứng bản 2 (thành công, TMPDIR ngắn
  `/home/hatch/workspace/.tmp-k2e`, display :152, CDP 9253):**
  instance 1 launch 00:26:07, CDP page `app://vcut/index.html` sau
  ~50s; snapshot A (00:27:02): thư mục giải nén TỒN TẠI, AppRun TỒN
  TẠI, 21 file. Instance 2 launch 00:27:02 (cùng userdata + TMPDIR,
  argv FIXTURE2), **exit code=0 sau 20s** (single-instance đúng).
  Snapshot B (00:27:24, ngay sau instance 2 thoát): **thư mục giải
  nén KHÔNG CÒN (exists=NO, AppRun=NO, 0 file)** — runtime của
  instance 2 đã xóa thư mục dùng chung ngay khi nó thoát, trong khi
  instance 1 vẫn đang chạy từ đó. Instance 1 sau đó thoát sạch
  (cùng đường `window.close()`/`app.quit()` như D4a vốn exit 0) →
  **runtime trả 127**. Chỉ khác biệt duy nhất giữa D4a (exit 0) và
  trường hợp này (exit 127) là thư mục giải nén còn hay đã bị xóa
  trước lúc thoát.
- Thí nghiệm bản 1 (hỏng do thiết kế thí nghiệm, không phải bug
  sản phẩm): TMPDIR dài `hidden_files/h9-k2/exp-tmp` → đường dẫn
  SingletonSocket 113 ký tự > giới hạn 108 của Linux `sockaddr_un`
  → cả 2 instance FATAL `Socket path too long` và thoát 127. Bài học
  ghi vào fix: TMPDIR cho AppImage phải NGẮN.
- Phụ: runtime AppImage là tiến trình giám sát, Electron main thật
  là tiến trình con đã giải nén (cùng process group); bridge chạy
  group riêng (detached đúng); probe Python `import rembg` có lúc ở
  D-state (`folio_wait_bit_common`); một renderer từng thành zombie
  thoáng qua.

**Giải thích lại J4 lượt 1:** instance 1 click Thoát true nhưng
exit 127 — vì instance 2 (forward) đã xóa thư mục giải nén dùng
chung khi nó thoát trước đó. Instance 1 thoát sạch ở tầng Electron
nhưng runtime AppImage trả 127 thay vì 0.

**Đính chính một kết luận cũ của K2:** trong thí nghiệm bản 2, K2
ghi "CDP không thấy dialog `window.confirm`" (fresh CDP session gắn
sau khi dialog mở trả `No dialog is showing`). Probe của K4
(`--only dialogprobe`, 07/11, 6 passed / 3 failed) chứng minh
**session CDP của harness (gắn từ lúc launch) THẤY dialog qua event
`Page.javascriptDialogOpening` và trả lời ĐƯỢC bằng
`Page.handleJavaScriptDialog`** (P1, P2, và cleanup P3–P5 đều dùng
đường CDP-trực-tiếp thành công). Kết luận "CDP không thấy dialog"
chỉ đúng cho session gắn SAU khi dialog đã mở, không phải tính chất
của dialog. X11-click / Escape KHÔNG trả lời được dialog này
(P3/P4/P5 fail: finder không nhận diện được cửa sổ 430×83 không tên).

## 2. Bug sản phẩm đi kèm — project mẫu dirty từ lúc sinh ra

Trong lúc điều tra D4c, tìm ra **bug sản phẩm thật** (nguyên nhân gốc
của cascade dialog chặn renderer trong D4c):

- `apps/web/src/store.ts` `loadSample()` `set()` spec mẫu xong nhưng
  KHÔNG gọi `markSaved()` → `lastSavedHash` còn `null`.
- `apps/web/src/lib/projectRepo.ts:1226` `isDirty()`: nếu
  `lastSavedHash === null` → `spec.tracks.length > 0 ||
  spec.meta.name !== "Dự án mới"` → project mẫu (có tracks) dirty
  ngay từ lúc sinh ra.
- Hệ quả: mọi lần mở file ngoài (double-click `.vcut` / recent /
  argv) khi app đang chạy đều bật `window.confirm` "Có thay đổi chưa
  lưu thành file. Bỏ thay đổi và tiếp tục?" và chặn renderer
  (`openProjectFromPath` → `confirmDiscardProject()` trước khi load).
  D4c đợt 53: dialog mở, menu bar trắng, click Thoát fail.
- Đối chiếu: autosave restore (`App.tsx:204`) CÓ gọi `markSaved` →
  sạch. Chỉ đường `loadSample` thiếu.

## 3. Đã sửa gì

### Fix 1 — Harness: cô lập TMPDIR (nguyên nhân gốc của 127)

File: `apps/desktop/scripts/click-test-menu.mjs`
(`node --check` OK sau sửa).

- Thêm `TMPDIR_RUN = path.join(TMPDISK, \`d${DISPLAY_NUM}\`)` và
  `TMPDIR_SECOND = path.join(TMPDIR_RUN, "second")` sau `TMPDISK`
  (mỗi lượt chạy/display một thư mục riêng; display đã duy nhất theo
  luồng). Đường dẫn ngắn (~34 ký tự) để SingletonSocket < 108 ký tự.
- `launchAppImage`: `mkdir` cả 2 thư mục, `TMPDIR: TMPDIR_RUN`
  (thay `TMPDISK`).
- Spawn second-instance D2b và D4c: `TMPDIR: TMPDIR_SECOND` (instance
  2 xóa chỉ thư mục của chính nó, không chạm thư mục của instance 1).
- Hệ quả: instance 2 giải nén lạnh (~30–60s) nên timeout chờ nó
  thoát tăng 20s → **120s** ở D2b (deadline) và D4c (`waitExit`);
  text record "thoát trong 20s" → "thoát trong 120s" cho đúng.
  Tiêu chí vẫn là "instance 2 tự thoát (single-instance) chứ không
  treo" — 120s vẫn là giới hạn có ý nghĩa (chi phối bởi giải nén).

### Fix 3 — Harness: D4c trả lời dialog discard-confirm trước khi đọc

File: `apps/desktop/scripts/click-test-menu.mjs` (tái dùng helper
`answerDiscardDialog` của luồng K4 đợt 54, không viết lại, không sửa
helper của K4).

- D4c: sau `waitExit(child2)` + `sleep(2000)`, gọi
  `answerDiscardDialog(session, { accept: true, tag: "D4c" })` trước
  khi đọc `h9()`/`projectName()`/`currentPath()` (đúng mẫu D2b).
  Kết quả dialog ghi vào detail của case D4c.
- Đồng thời bọc 3 lần đọc sau forward trong try/catch (ghi
  `readError2` vào detail) để phaseD4 không crash khi renderer vẫn
  kẹt: CDP `send` timeout 20s/lần (`cdp timeout`) rồi throw; D4c
  trước đây không có try/catch quanh các lần đọc này.
- Lưu ý timing: dialog có thể mở MUỘN (sau lần đọc) — handler
  `onOpenFile` của renderer chạy trễ khi renderer đang bận (welcome
  modal / load mẫu). Trường hợp đó `openTopMenu` (đã được K4 nối
  `answerDiscardDialog` khi menu bar suy biến) xử lý ở bước click.
- Verdict D4c KHÔNG đổi: vẫn yêu cầu tên "H9 Second" — check tên
  này fail do bug `loadProject` riêng (§7), không được che bằng
  cách nới verdict. Exit code đo được đọc trong detail (`code1`,
  `code2`), tách khỏi check tên (như D4d đã làm).

### Fix 2 — Sản phẩm: `markSaved` sau `loadSample`

File: `apps/web/src/store.ts` (+ test mới, xem §4).

- `import { markSaved } from "./lib/projectRepo";`
  (projectRepo KHÔNG import store → không circular import).
- Trong `loadSample()`, sau `set({...})` thành công
  (`didSet = true`): `markSaved(spec)` + chú thích ROUND54-K2.
- Autosave vẫn chạy như cũ (subscribe theo spec-thay-đổi, không phụ
  thuộc `lastSavedHash`); user sửa gì thì hash lệch → dirty trở lại
  (test K2 chứng minh).

## 4. Kết quả đo / test (số thật)

- **Harness `node --check`:** OK.
- **Unit test mới** `apps/web/src/store.loadSampleDirty54K2.test.ts`
  (chạy qua esbuild bundle + node, như `store.nestedGuard.test.ts`;
  shim DOM tối thiểu cho `buildSampleProject` — canvas stub +
  PNG 1×1; `MediaRecorder` undefined trong Node → đi nhánh
  `stillSample`; `AssetStore`/IndexedDB lỗi được try/catch
  best-effort trong `buildSampleProject` nuốt):
  - Với fix: **3 pass, 0 fail** (K1 isDirty=false sau loadSample;
    K2 đổi tên → isDirty=true; K3 loadSample lần 2 → isDirty=false).
  - **Red-before (đã chứng minh):** tạm gỡ dòng `markSaved(spec)`
    rồi chạy lại → **1 pass, 2 fail** (K1, K3 FAIL: isDirty=true
    ngay sau loadSample; K2 vẫn PASS). File `store.ts` đã khôi phục
    nguyên vẹn sau đó (dòng `markSaved(spec)` còn tại 2923).
  - Log: `hidden_files/h9-k2/store-loadsample-test-fixed.log`,
    `hidden_files/h9-k2/store-loadsample-test-redbefore.log`.
- **`tsc --noEmit` apps/web: 0 lỗi. `tsc --noEmit` apps/desktop:
  0 lỗi. `vite build` apps/web: pass** (built in 5.67s;
  chunk >500kB warning có sẵn, không phải do đợt này).
- **Đo lại phaseD4 với harness đã sửa** (xem §5).

## 5. Đo lại phaseD4 — kết quả đầy đủ (4 lượt + 4 thí nghiệm)

### 5.1 Lượt đo lại 1 (00:49–00:51 UTC, AppImage, harness Fix 1+3)

**3 passed, 1 failed — D4b VẪN FAIL, mẫu lỗi MỚI.**

- **D4a PASS, exitCode=0** (click Thoát true). Log `/tmp/h9-d4a-d150.log`
  (22.173 dòng) có 5 dòng `[vcut-desktop]` (bundled-runtime, models 0/4,
  ffmpeg 8.1.2, đã load UI, bridge 8787 running).
- **D4b FAIL: attempt 1 code=1; attempt 2 code=127** → `phaseD4: crash`
  → D4c/D4d/D4e chưa chạy. Log D4b (22.189 dòng) toàn listing giải nén,
  **0 dòng `[vcut-desktop]`, không có dòng lỗi "Failed to run"** — khác
  lượt đo đầu (có dòng lỗi đó). TMPDIR cô lập CÓ tác dụng: đường dẫn
  giải nén là `~/.tmp-h9/d150/appimage_extracted_ddc15d54…`.
- Watcher: runtime D4a pid 28873 vào **D-state (`Ds`) lúc 00:49:55**
  (dọn thư mục 1,3GB khi thoát), biến mất 00:49:57. Runtime D4b attempt 1
  pid 29334 (00:49:57–00:50:26, ~29s, `Rs` suốt, không con) → code 1.
  Attempt 2 pid 29512 (từ 00:50:26) → code 127.
- **Nhiễu đồng thời:** luồng K4 chạy `--only dialogprobe` song song
  (pid 29158, CDP 9261); runtime K4 (pid 29262) cũng D-state lúc 00:49:55.
- **HARNESS ERROR sau crash:** `EPERM: operation not permitted, write`
  ở ghi `h9-report.json` → file 0 byte, report mất dù stdout đủ PASS/FAIL.
  Ghi tay + vòng lặp ghi 20 lần (~2KB) **20/20 thành công** → EPERM thoáng
  qua. Đã bọc try/catch quanh ghi report. Report lượt này **khôi phục từ
  stdout** (`h9-report-run2-reconstructed.json`, ghi rõ reconstructed).

### 5.2 Lượt đo lại 2 (01:01–01:04 UTC, AppImage) — D4a cũng FAIL

**2 passed, 1 failed.** D4a FAIL: attempt 1 code=1, attempt 2 code=127
(lần đầu tiên cả D4a cũng fail). EPERM tái diễn ở ghi report (đã được
try/catch chứa → SUMMARY vẫn in). Nguyên nhân sau đó mới rõ (§5.5):
**Xvfb :150 đã chết** (harness tự kill Xvfb của nó ở cuối lượt 1, và
socket còn sót) → Electron không nối được display → chết lúc init
(trước mọi `[vcut-desktop]`) với code 1; attempt 2 → 127.

### 5.3 Lượt đo lại 3 (01:12–01:14 UTC, AppImage, harness tự quản Xvfb)

**3 passed, 1 failed.** D4a PASS exit 0 (Xvfb của harness sống cho D4a).
D4b FAIL y hệt lượt 1: attempt 1 code=1, attempt 2 code=127; log D4b
22.189 dòng, 0 `[vcut-desktop]`. EPERM tái diễn (đã chứa).

### 5.4 Thí nghiệm E4/E5/E6/E7 — tách lớp nguyên nhân D4b fail

Vì D4b fail TÁI DIỄN (lượt 1 và 3) dù TMPDIR đã cô lập, K2 chạy 4 thí
nghiệm đối chứng bằng launch tay (không qua harness), cùng AppImage
sha `2a15ea90`, display :150 (Xvfb do K2 tự chạy), CDP 9251:

- **E4 — relaunch tuần tự, TMPDIR + userdata MỚI (`d150e` /
  `/tmp/h9-userdata-k2e4`): L1, L2 (gap 0), L3 (gap 10s) đều CDP OK
  (22,1s / 22,1s / 22,0s).** Thư mục giải nén bị runtime xóa ĐỒNG BỘ
  trước khi thoát (MISSING ngay sau khi runtime exit) → **không có
  race xóa-thư-mục ở relaunch tuần tự.** Relaunch tuần tự tự nó KHÔNG
  hỏng.
- **E5 — relaunch tuần tự, TMPDIR + userdata CỦA HARNESS (`d150` /
  `/tmp/h9-userdata-k2`): L1 CDP OK (24,0s); L2 (gap 0) exit code=1
  sau 19,3s** (log 22.158 dòng, 0 `[vcut-desktop]`) — **TÁI HIỆN ĐƯỢC
  lỗi D4b ngoài harness.** E4 (mới) chạy được, E5 (TMPDIR/userdata
  của harness) fail ở lần thứ 2.
- **E6 — chạy binary ĐÃ GIẢI NÉN trực tiếp (bypass AppImage runtime),
  cùng userdata `k2`: CDP OK sau 2s, 5 dòng `[vcut-desktop]`.**
  → Electron + userdata `k2` HOÀN TOÀN TỐT. **Lớp lỗi là AppImage
  runtime, không phải Electron/userdata.**
- **E7a — E5 nhưng đã gỡ file `.ses` khỏi `d150`: L2 vẫn exit 1
  (18,2s).** → `.ses` không phải thủ phạm (đã backup tại
  `hidden_files/h9-k2/dot-ses-backup.txt`).
- **E7b — E5 nhưng `d150` TRỐNG HOÀN TOÀN (gỡ cả `second/`): L1
  cũng fail, code=127 sau 16,8s, log có dòng lỗi MỚI:
  `Failed to run .../AppRun: Exec format error` (ENOEXEC).**
  → Ngay cả lần launch ĐẦU với TMPDIR trống cũng fail. Tỉ lệ fail
  TĂNG DẦN theo thời gian (lượt đầu: D4a ok; E7b: L1 fail) → runtime
  extraction/exec MỎNG MANH trong môi trường này (có thể do I/O /
  page-cache sau nhiều lần giải nén 1,3GB), không phải chỉ do tái
  dùng thư mục.
- **Kết luận E4–E7:** lỗi D4b (code 1 rồi 127) là **sự mỏng manh của
  AppImage runtime (EXTRACT_AND_RUN) khi launch lặp lại** trong môi
  trường này — extraction xong (listing đầy đủ 22.189 dòng) nhưng
  exec Electron thất bại (lúc thì ENOENT "No such file", lúc thì
  ENOEXEC "Exec format error", lúc thì lặng lẽ exit 1 trước mọi log
  của app). Đây là **lớp lỗi THỨ HAI, khác với bug xóa-thư-mục dùng
  chung ở §1** (bug đó đã được Fix 1 xử lý và đã chứng minh bằng thí
  nghiệm bản 2). Fix 1b (TMPDIR riêng MỖI LẦN launch) đã được cân nhắc
  và **KHÔNG làm** — E7b chứng minh launch đầu với TMPDIR trống vẫn
  fail nên per-launch TMPDIR không có bằng chứng sẽ sửa được; thay vào
  đó dùng binary đã giải nén cho đo exit-code (§5.6).

### 5.5 Xvfb — nguyên nhân riêng của lượt đo lại 2 + launch tay 1

- Harness TỰ quản Xvfb: `startXvfb()` ở đầu main, `stopXvfb()` ở cuối
  (SIGKILL). Nó KHÔNG tắt Xvfb giữa các phase.
- Launch tay 1 (01:07, Xvfb :150 đã bị harness kill ở cuối lượt 2):
  AppImage exit code=1 sau ~24s, không CDP. **Khởi động lại Xvfb :150
  → launch tay 2 CDP OK sau 24s** (`app://vcut/index.html`) — chứng
  minh X server chết là nguyên nhân của code 1 khi display chết.
- Bài học: K2 từng khởi động Xvfb :150 tay làm harness KHÔNG start
  được Xvfb của nó ("display :150 có thể đã bị chiếm", 3 lần thử) →
  harness crash trước cả phaseD4. **Không tự chạy Xvfb tay trên display
  của harness**; để harness quản Xvfb của nó.
- Xvfb :150 của harness sống suốt lượt 4 (§5.6) — D4a–D4e đo được.

### 5.6 Lượt đo lại 4 (01:30–01:32 UTC, --binary unpacked) — ĐO ĐƯỢC D4

Dùng binary đã giải nén trong repo
(`apps/desktop/release/linux-unpacked/vcut-studio`, 234.904.904 byte,
mtime 06/11 22:06 — cùng build với AppImage 22:12, cùng kích thước
binary với bản giải nén từ AppImage ở E6):

```
node apps/desktop/scripts/click-test-menu.mjs --only d4 \
  --binary ~/workspace/repo-1/apps/desktop/release/linux-unpacked/vcut-studio \
  --appimage <AppImage copy sha 2a15ea90> \
  --out ~/workspace/goals/capcut-clone-video-editor/hidden_files/h9-k2 \
  --userdata /tmp/h9-userdata-k2 --testdir /tmp/h9-test-k2 \
  --display 150 --cdp-port 9251 --skip-deb
```

**Kết quả: 6 passed, 1 failed. Report ghi THÀNH CÔNG (không EPERM).**

| Case | Kết quả | Exit code đo được |
|------|---------|-------------------|
| D4a Thoát qua menu Tệp | PASS | **0** (click true) |
| D4b Đóng cửa sổ | PASS | **0** (click true) |
| D4c Double-click .vcut (instance 2 + instance 1) | FAIL (chỉ do tên, xem dưới) | **instance 2 = 0, instance 1 = 0** (click Thoát true) |
| D4d Mở .vcut qua argv rồi Thoát | PASS | **0** (click true) |
| D4e Sống 30s rồi Thoát | PASS | **0** (click true) |

- **D4c chi tiết:** instance 2 exitCode=0 (thoát trong 120s: true);
  onOpenFile nhận FIXTURE2: true; currentPath đúng FIXTURE2;
  instance 1 Thoát: click true, exitCode=0. **Verdict FAIL chỉ vì
  tên trong ô nhập là "Dự án không tên" (kỳ vọng "H9 Second")** —
  bug `loadProject` bare-spec (§7), KHÔNG phải exit code.
  Dialog discard-confirm: KHÔNG xuất hiện trong lượt này (CDP 0 entry
  mới; có thể forward tới lúc spec mẫu chưa load xong nên isDirty còn
  false — mount check textLen>300 có thể pass nhờ text của welcome
  modal; xem §6).
- **D4d:** currentPath đúng; tên "Dự án không tên" được ghi nhận (đã
  loại khỏi verdict như thiết kế); exit 0.
- **Kết luận đo D4:** với binary đã giải nén (bypass runtime),
  **mọi exit code D4 đều = 0** (D4a/D4b/D4d/D4e = 0; D4c cả hai
  instance = 0). Bug D4 exit 127 của J4 (§1) là artifact của AppImage
  runtime (xóa thư mục giải nén dùng chung), KHÔNG phải bug thoát
  của sản phẩm. Khi runtime không phá, app thoát sạch 0 trong mọi
  đường D4.
- Bằng chứng lượt 4: `h9-report.json` (6 passed / 1 failed),
  `h9-d4a/d4b/d4c/d4d/d4e-d150.log`, `h9-d4c-second-instance.log`
  (dbus error vô hại), `shots/d4{a,b,c,d,e}-*.png`,
  `settings-after.json`, `d4-rerun-stdout.log`.

## 6. Giới hạn của đợt đo này (trung thực)

- **AppImage dùng để đo (§5.1–5.3) là bản release CŨ (sha `2a15ea90`,
  build 06/11 23:56 UTC) — KHÔNG chứa Fix 2** (fix đổi bundle web,
  muốn có trong AppImage phải build lại). **E2E của Fix 2 trên AppImage
  mới là nợ mở** — cần một lượt build AppImage riêng (KHÔNG build đè
  lên `release/` khi các luồng khác đang test) rồi chạy `--only d4`
  với `--appimage` trỏ bản đó; kỳ vọng dialog discard-confirm không
  còn xuất hiện trong D4c (kể cả khi forward tới sau khi mẫu đã load).
  Fix 2 hiện chỉ được chứng minh ở mức unit test (3/3, red-before 1/3)
  + tsc + vite build.
- **Đo D4 bằng AppImage KHÔNG hoàn thành được trong đợt này** (D4b fail
  ở cả 3 lượt AppImage do runtime mỏng manh, §5.4). Số đo D4 đầy đủ
  (§5.6) lấy bằng **binary đã giải nén** (`--binary`, cùng build với
  AppImage) — hợp lệ cho câu hỏi "app thoát sạch không" vì cùng
  Electron binary + bundle, chỉ khác lớp launcher (runtime). Số đo
  exit code qua AppImage vẫn còn thiếu (nợ mở cho lượt đo AppImage
  sau, khi runtime hết flaky hoặc khi có AppImage mới).
- **D4c verdict FAIL chỉ do check tên** "H9 Second" (bug `loadProject`,
  §7) — đọc `code1`/`code2` trong detail để kết luận về exit code
  (cả hai đều 0), tách khỏi check tên.
- **Dialog discard-confirm KHÔNG xuất hiện trong D4c lượt 4** nên Fix 3
  (nối `answerDiscardDialog` vào D4c) chưa được kiểm chứng E2E ở đường
  có dialog thật (chỉ có D2b/D4d dùng helper này với dialog thật, và
  probe K4 đã chứng minh helper trả lời được qua CDP). Khả năng cao
  forward tới lúc mẫu chưa load xong (mount check textLen>300 có thể
  pass nhờ text welcome modal) nên isDirty còn false → không dialog.
  Đây là timing race của harness, không phải bug sản phẩm; Fix 2 làm
  D4c xác định hơn (không dialog ở cả hai timing).
- **EPERM khi ghi report:** tái diễn ở cả 3 lượt AppImage fail
  (lượt 1–3), KHÔNG tái diễn ở lượt 4 --binary (ghi thành công).
  Đã bọc try/catch (SUMMARY vẫn in, exit code đúng). Nguyên nhân gốc
  chưa rõ (ghi tay + vòng lặp 20 lần đều OK) — ghi nhận là thoáng qua,
  không phải lỗi quyền.
- Không sửa file chung (`tsconfig.json`, `package.json`, dict i18n).
- Không push, không release/tag (release gate vẫn giữ).

## 7. Nợ mở (không thuộc K2 hoặc chưa đóng)

- **Bug `loadProject` (J3/J4 §4, thuộc khu vực khác, KHÔNG sửa
  trong K2):** file `.vcut` bare-spec load sai tên "Dự án không tên"
  (không đọc `spec.meta.name`, `projectRepo.ts:1011,1155`). D4c FAIL
  verdict ở lượt 4 chỉ vì bug này (exit code cả hai instance đều 0).
- **AppImage runtime mỏng manh khi launch lặp lại (mới, §5.4):**
  extraction/exec fail với ENOENT / ENOEXEC / lặng lẽ exit 1, tỉ lệ
  tăng dần theo thời gian. Chưa rõ nguyên nhân gốc ở tầng runtime/
  môi trường (không phải do tái dùng thư mục — E7b fail cả với TMPDIR
  trống). Đề xuất cho luồng sau: đo D4 qua AppImage vào lúc hệ thống
  rảnh, hoặc cân nhắc cho harness tự fallback sang `--binary` khi
  AppImage launch fail 2 lần liên tiếp (chưa làm trong K2 — cần quyết
  định của round owner vì đổi hành vi harness).
- **Zombie D4c lượt 2 (J4):** instance 1 không chết sau SIGKILL +
  pkill, chặn 2 lần launch tiếp theo (mỗi lần đốt 300s chờ CDP).
  Chưa có lời giải đầy đủ — giả thuyết: tiến trình ở D-state
  (probe Python rembg từng ở D-state `folio_wait_bit_common`) hoặc
  runtime chờ thư mục đã xóa. Watcher đợt này ghi lại STAT (runtime
  D4a vào D-state 2s lúc dọn thư mục khi thoát — bình thường, không
  phải zombie).
- **Bridge mồ côi:** process `node .../server/bridge/src/index.js`
  pid 40509 giữ cổng 8787 (từ lượt source-run của luồng khác, không
  phải của K2) — K2 không động vào. Bridge của app chạy cổng 8788
  (theo service-manager.log), nên 8787 mồ côi không chặn đo D4.
  Lưu ý: app KHÔNG crash khi bridge không khởi động được (đã có
  `.catch` log "app vẫn mở" trong main.ts) — nên bridge mồ côi không
  phải nguyên nhân D4b fail.
- **M8 regressed so với đợt 52** (flake?) — ngoài phạm vi K2.
- **`.deb` build thất bại; AppImage 576MB** (nợ chung).
- **File workflow `.github/workflows/ci-security.yml` vẫn 403 chưa
  lên GitHub** (nợ chung từ Phase 6; App Muse thiếu quyền
  workflows:write) — repo vẫn không có CI chạy thật.
- **Thư mục giải nén cũ còn sót** trong `~/workspace/.tmp-h9/`
  (`0624d516…`, `620ba48d…`, `b65355a6…`, `e3d39a29…` — của các build
  khác; còn lại vì owner bị kill, không dọn sạch) + các thư mục
  `d15x`/`d16x` của các luồng round 54. Không ảnh hưởng đo sau fix
  (mỗi display một TMPDIR riêng), nhưng nên dọn định kỳ.
- Bridge pid 17145 (đường dẫn `.tmp-h9`, PPid 17043) là của luồng K5
  — K2 không động vào.

## 8. Bằng chứng

- `hidden_files/h9-k2/`: AppImage copy (sha `2a15ea90…`),
  `h9-report.json` (lượt 4 --binary: 6 passed / 1 failed — D4a/D4b/
  D4d/D4e exit 0, D4c hai instance exit 0, fail chỉ do tên),
  `h9-report-run1.json` (lượt đo đầu: 3 passed / 1 failed),
  `h9-report-run2-reconstructed.json` (lượt 1, khôi phục từ stdout
  do EPERM), `d4-rerun-stdout.log` (lượt 4),
  `d4-rerun1-stdout.log` (lượt 1), `d4-rerun2-stdout.log` (lượt 2),
  `d4-rerun3-stdout.log` (lượt 3),
  `d4-rerun3-xvfb-conflict-stdout.log` (lượt 3 lần thử đầu: Xvfb
  bị chiếm do K2 chạy Xvfb tay),
  `h9-d4a/d4b/d4c/d4d/d4e-d150.log` (lượt 4),
  `h9-d4c-second-instance.log`, `h9-second-instance.log`,
  `settings-after.json`, `shots/d4{a,b,c,d,e}-*.png`,
  `watch-d4.log` + `watch-d4-run{1,2,3,4,5}.log`,
  `dot-ses-backup.txt` (file `.ses` đã gỡ ở E7a),
  `store-loadsample-test-fixed.log`,
  `store-loadsample-test-redbefore.log`,
  `exp-second-instance-dir.sh` (bản 1 hỏng),
  `exp2-second-instance-dir.sh` (bản 2 thành công), `exp-report.txt`,
  `exp-report2.txt`, `exp-i1.log`, `exp-i2.log`, `exp2-i1.log`,
  `exp2-i2.log`, `exp2-dialog-check.mjs`, `x11-list.py`,
  `x11-click.py`, `watch-d4.sh`.
- Thí nghiệm E4/E5/E6/E7 (script + log, đã copy về `hidden_files/h9-k2/`
  để không mất khi reboot): `exp4-relaunch.mjs`, `exp4.log`,
  `exp4-stdout.log`, `exp5-d150.mjs`, `exp5.log`, `exp5-stdout.log`,
  `exp6-direct.mjs`, `exp6-stdout.log`, `manual-launch.mjs`,
  `manual-launch2-stdout.log`, `exp7a-stdout.log`, `exp7b-stdout.log`.
  (Bản gốc ở /tmp; thư mục giải nén E6 `appimage-extract-e6` đã xóa
  sau khi đo xong vì `release/linux-unpacked` trong repo là cùng build.)
- Bằng chứng J4 lượt 2: `hidden_files/h9-j4/h9-report-d4-r53j4.json`
  (5 passed / 2 failed), `hidden_files/h9-j4/shots/d4c-exit*.png`,
  `hidden_files/h9-j4/h9-second-instance.log`.
- Probe K4: `hidden_files/h9/r54k4-probe3/h9-report.json`
  (6 passed / 3 failed — P3/P4/P5 fail là X11-click/Escape không
  trả lời được dialog; P1/P2/P6 pass: CDP handleJavaScriptDialog
  trả lời được).
- Report K5: `hidden_files/h9/r54k5/h9-report.json`
  (3 passed / 4 failed — D2b instance 2 chậm do giải nén).

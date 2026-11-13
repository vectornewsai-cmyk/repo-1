# Phase 9 Round 89 — Q9: RAM guard birefnet e2e trong AppImage — LIMITS

Ngày: 11/11/2026 (lượt cron 18:35 +07). Luồng Q9 đợt 89. Repo:
`vectornewsai-cmyk/repo-1`, branch main. Nhiệm vụ: đóng nợ LIMITS gộp
đợt 88 §4 mục 2 (phần chưa test) — "Birefnet-general trong gói: RAM guard
đã có (P7) — vẫn cần cửa sổ yên ≥ 6 GB khả dụng ~7 phút hoặc máy nhiều
RAM để có 1 lần chạy thành công đầu tiên; chưa test e2e bridge thật trong
AppImage".
**KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch, KHÔNG file
workflow, KHÔNG đụng TTS 39.**

> TRẠNG THÁI: HOÀN TẤT 13:31Z 11/11/2026. AppImage mới đã build xong từ
> cây có guard; e2e guard qua bridge thật trong gói mới: **PASS**.
> Birefnet-general vẫn 0 lần chạy thành công trong gói.

## 0. Kết luận ngắn

1. **AppImage K7 đợt 83 KHÔNG chứa code RAM guard P7 — đã chứng minh
   bằng grep trên cây đã đóng gói.** `bgremove.py` + `bgremove.js`
   trong `linux-unpacked/resources/vcut-server/` của AppImage K7 đều có
   0 lần xuất hiện `ram_guard`/`RAM_GUARD`. Guard được viết ở đợt 88,
   sau khi AppImage K7 build xong. Vì vậy test guard e2e trên AppImage
   K7 nguyên trạng là không thể — chạy job birefnet-general trong đó sẽ
   là thử birefnet thật không guard (đúng kiểu chết SIGKILL của N4),
   trái chỉ đạo "đừng cố ép chạy birefnet khi RAM không đủ". Q9 KHÔNG
   chạy job đó.
2. **AppImage mới (đợt 89, build 13:16Z) ĐÃ chứa guard P7 và e2e guard
   qua bridge thật: PASS (§4).** AppImage
   `~/workspace/tmp-q9-round89-ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage`,
   557.008.461 byte, sha256
   `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`;
   grep guard trong gói: `bgremove.py` 7, `bgremove.js` 5,
   `DEFAULT_MIN_RAM_MB = 6144` có. Job bgremove session
   `birefnet-general` qua bridge thật (cổng 8787, healthy sau 5,7s):
   HTTP 200 sau 135,0s, `sessionUsed=u2net`,
   `fallbackFrom=birefnet-general`, fallbackReason nhắc đúng "RAM
   guard: RAM khả dụng 2038 MB < ngưỡng 6144 MB…" — guard chặn
   birefnet ngay từ đầu, u2net hoàn tất 17/17 frame trong cùng tiến
   trình; MOV đầu ra 1.715.896 byte, 960×540, rgba, 17 frame, alpha
   thật (frame 7: 59,3% trong suốt). RAM trước job 2170 MB, max trong
   lúc chạy 2050 MB.
3. **Test P7 chạy lại trên cây hiện tại: tất cả xanh** (ramguard 8/8,
   fallback 7/7, smooth 4/4, bridge ramguard 15/15, bridge fallback
   19/19).
4. **Birefnet-general vẫn 0 lần chạy thành công trong gói** (giữ nguyên
   từ P7/N4). RAM khả dụng cao nhất thấy trong lượt: ~2,65 GB — không
   có cửa sổ yên ≥ 6 GB nào (trong lúc chạy e2e max 2050 MB, các mẫu
   20s: 2050 / 1641 / 921 / 1485 / 1010 / 803 MB).
5. **Sóng EPERM chặn build lại AppImage gần hết lượt** (xem §3.3):
   4 lần chạy `package-ship` đều chết vì EPERM, 30 lần thử
   `copy-web-dist` đều fail, duty test 60 lần ghi 0/60 OK lúc 12:27Z.
   Watcher v2 bắt được cửa sổ tốt 12:55:29Z, electron-builder chạy
   lần 1 thành công 13:16:26Z. Nhưng **cell/VM restart lúc ~13:21Z
   giết `package-ship --skip-build` giữa bước smoke** (verify +
   probe-ai đã PASS, smoke/orphan chưa xong — xem §3.3), nên
   verify/orphan trong gói vẫn là nợ mở, không phải lỗi của gói.

## 1. AppImage nào, sha nào

| AppImage | Kích thước | sha256 | Ghi chú |
|---|---|---|---|
| **MỚI đợt 89 Q9: `~/workspace/tmp-q9-round89-ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage`** | **557.008.461 byte** | **`9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`** | **Build 13:16:26Z 11/11 từ cây hiện tại (có guard P7). Guard trong gói: `bgremove.py` 7 lần `ram_guard`, `bgremove.js` 5 lần, `DEFAULT_MIN_RAM_MB = 6144` (dòng 56). E2E guard: PASS (§4).** |
| K7 đợt 83: `~/workspace/tmp-j8-electron/ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage` | 556.967.608 byte | `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c` | Đã verify khớp với hồ sơ đợt 83. **Không chứa guard P7** (grep 0). |
| `apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage` | 576.688.128 byte | `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819` | Còn cũ hơn (đợt 53/54). Không dùng. |
| `apps/desktop/release-round55-l4/vcut-studio-0.1.0-x86_64.AppImage` | 576.688.069 byte | `bff19724e8dd988dd698f38bdfc5031dee95731b63a4b4e82cb05ea9fcd416f3` | Bản round55. Không dùng. |

Kiểm chứng guard trong gói K7 (đọc trực tiếp file đã đóng gói, không
chạy app):

```
grep -c "RAM_GUARD|ram_guard|get_mem_available" \
  .../ship-full/linux-unpacked/resources/vcut-server/server/bgremove/bgremove.py
# → 0
grep -c "ram_guard" \
  .../ship-full/linux-unpacked/resources/vcut-server/server/bridge/src/bgremove.js
# → 0
```

Trong khi cây làm việc hiện tại có guard đầy đủ
(`server/bgremove/bgremove.py` chứa `ram_guard_decision`,
`DEFAULT_MIN_RAM_MB = 6144`; `server/bridge/src/bgremove.js` chứa
`parseSessionMarkers` đọc marker guard). Kết luận: K7 build trước P7.

## 2. Test P7 chạy lại trên cây hiện tại (khóa hành vi guard)

Chạy lúc ~11:40Z, trước khi build. Tất cả trên cây làm việc (chưa qua
AppImage):

| File | Kết quả |
|---|---|
| `server/bgremove/test_bgremove_ramguard.py` | **8/8 pass** |
| `server/bgremove/test_bgremove_fallback.py` | **7/7 pass** |
| `server/bgremove/test_bgremove_smooth.py` | **4/4 pass** |
| `server/bridge/test/test-bgremove-ramguard.cjs` | **15/15 pass** |
| `server/bridge/test/test-bgremove-fallback.cjs` | **19/19 pass** |

Khớp đúng số P7 đã ghi ở đợt 88. Không sửa code guard.

## 3. Build lại AppImage full từ cây hiện tại (có guard P7)

### 3.1 Chuẩn bị

- Build web trước khi đóng gói (prepackage yêu cầu): `tsc` 0 lỗi +
  `vite build` PASS (1m 22s dưới tải; toàn lệnh ~5,3 phút do tsc chậm
  lúc loadavg ~10). dist nay mới.
- Script e2e Q9 mới (để chạy sau khi có AppImage mới):
  `apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs` (dựa trên
  script M6 đợt 85, đổi verdict: PASS = guard chặn birefnet +
  sessionUsed=u2net + fallbackFrom=birefnet-general + fallbackReason
  nhắc "RAM guard" + output MOV thật có alpha đủ frame; HOẶC birefnet
  chạy được thật — lần đầu). `node --check` OK. Script tự lấy mẫu RAM
  mỗi 20s trong lúc chạy job để ghi cửa sổ RAM.
- Work dir build mới (không đè AppImage K7 hay release/):
  `~/workspace/tmp-q9-round89-ship/` (ship-full + models symlink).
- RAM lúc bắt đầu lượt: MemAvailable ~1,36–2,44 GB. VM vừa reboot lúc
  11:34:38Z (uptime 7 phút lúc 11:42Z, boot marker mới `7439870b`) —
  đúng lúc lượt cron bắt đầu.

### 3.2 Sóng EPERM — đo đạc (bằng chứng, không suy đoán)

Sóng EPERM (ghi file thỉnh thoảng `Operation not permitted`, xem I5
§7.8) bật mạnh trong lượt này, đúng lúc Q9 cần build. Bằng chứng đo
trực tiếp:

- **Hai lần chạy `package-ship` full đều chết vì EPERM** (xem §3.3).
- **30/30 lần thử `copy-web-dist.mjs` fail** (12:06:33–12:11:28, cách
  nhau ~10s), mọi lần cùng một chỗ: `EPERM ... copyfile ...
  dist-web/icons`, file đầu tiên `apple-touch-icon.png` tạo được 0
  byte rồi ghi nội dung fail.
- **Mọi primitive copy đều fail trong cửa sổ xấu:** `cp -r` shell,
  `fs.cpSync`, `fs.copyFileSync`, `rsync`, `tar` pipe — tất cả EPERM
  lúc 12:07–12:09, kể cả đích `/tmp` (khác filesystem). File tạo được
  (0 byte), ghi nội dung fail.
- **`os.copy_file_range` cùng filesystem: EPERM** (12:09:43) — cùng
  giây đó một lệnh `echo >` ghi thường lại OK, rồi lệnh `echo` kế tiếp
  lại FAIL. Nhiễu ở mức dưới 1 giây.
- **Duty test (60 lần ghi + fsync, 1s/lần):**
  - 12:12:18–12:13:20: **60/60 OK** (cửa sổ tốt kéo dài 60s+).
  - 12:27–12:28: **0/60 OK** (cửa sổ xấu đặc: cả phút không ghi được
    lần nào).
- **Probe EPERM v2 (`scripts/probe-eperm-v2.sh`) trong lượt:** `status`
  lúc 11:59 báo DEAD/STALE (heartbeat age 1284s > 900s; probe loop sau
  reboot chết sau probe #7 lúc 11:37:37Z — vòng loop mới chỉ sống ~2
  phút sau reboot); `once` fail 3/3 lần append log lúc ~12:09
  ("cannot append"). Ghi nhận cho P8/parent, không phải việc Q9 sửa.
- **Các luồng khác vẫn ghi được file trong cùng khung giờ** (Q4 test
  `server/render/`, Q7 LIMITS `docs/PHASE9_ROUND89_Q7_G1_EVIDENCE_LIMITS.md`
  lúc ~12:07, Q6/Q5 log lúc 12:06–12:08) — sóng không chặn đều mọi
  tiến trình/ghi; nó nhiễu theo thời điểm và theo syscall (ghi nhỏ lẻ
  qua file tool / echo thường lọt qua khe tốt, copy nhiều file cần cửa
  sổ tốt kéo dài nên fail gần như luôn).
- File 0-byte là dấu hiệu đặc trưng của sóng (đã gặp ở J8/K7): tạo
  file được, ghi nội dung EPERM. Trong lượt này: `apple-touch-icon.png`
  0 byte (nhiều lần), `ship-full-report.json` 0 byte (2 lần, do
  `writeFileEpermRetry` tạo file rồi ghi 5/5 fail), `.q9-write-test`
  0 byte (thử nghiệm của Q9, đã dọn).

### 3.3 Các lần build đã thử (đều chưa ra AppImage)

**Lần 1 — `package-ship` full, 11:48–11:58Z (10 phút): FAIL.**
`build-desktop` PASS (tsc + copy-services-js). `prepackage` fail 5/5
lần thử (mỗi lần: gen-icon OK → `copy-web-dist` EPERM ở
`dist-web/icons`). `finishEarly` + ghi report early-stop cũng fail 5/5
EPERM (report 0 byte). Không tới được electron-builder. SHIP-EXIT:1.

**Lần 2 — `package-ship` full, 11:59–12:02Z (~3 phút): FAIL.**
Lại chết ở `prepackage`/`copy-web-dist` (cùng lỗi EPERM). Log
`ship-run2.log` 0 byte (ghi stdout vào file cũng dính EPERM trong cửa
sổ xấu — bằng chứng là dòng `echo: write error: Operation not
permitted` khi shell append `SHIP-EXIT`). Report early-stop 0 byte
(12:02). SHIP-EXIT:1.

**Lần 3 — vòng lặp `copy-web-dist` 30 lần, 12:06:33–12:11:28Z: FAIL
30/30.** Mọi lần cùng lỗi EPERM ở `dist-web/icons`.

**Lần 4 — `package-ship` full, 12:13–12:26Z (~13 phút): FAIL ở
electron-builder 5/5.** Lần này cửa sổ tốt mở lúc 12:12–12:13 (duty
test 60/60 OK): `copy-web-dist` OK ngay lần đầu, `build-desktop` PASS,
`prepackage` PASS (gen-icon + copy-web-dist + slim-venv ×4 rebuild
VERIFY OK + copy-bundled-server 721M). Tới `electron-builder`: 5 lần
thử đều fail — lần 1 EPERM copyfile `pytz/zoneinfo/GMT+0`, lần 2 EPERM
write, lần 3 lỗi `Converting circular structure to JSON` trong
`@electron/get` (là đường báo lỗi khi download/extract Electron gặp
sự cố — object lỗi chứa `HttpsProxyAgent` vòng tròn; nguyên nhân gốc
nghi là EPERM lúc ghi file download), lần 4–5 EPERM write. `finishEarly`
+ ghi report fail 5/5 EPERM (report 0 byte). SHIP-EXIT:1. Electron đã
download xong 100% và extract được (log: "downloaded electron zip
extracted successfully"), lỗi nằm ở bước copy cây 700MB+ vào
`linux-unpacked` — tức sóng quay lại giữa chừng.

**Watcher:** sau lần 4, Q9 để watcher nền
(`~/workspace/tmp-q9-round89-ship/watch-ship.sh`, PID 30600 lúc
12:28Z) probe 10 lần ghi/60s; khi ≥9/10 OK thì chạy lại
`package-ship` full (log `ship-run5.log`). Tối đa 60 vòng (~60 phút).
Watcher v1 đã dừng lúc 12:54:54Z sau ~26 phút probe không thấy cửa
sổ tốt (duty test 12:54: 0/10 OK; sóng vẫn xấu đặc dù load VM chỉ
~1,0). Thay bằng **watcher v2**
(`~/workspace/tmp-q9-round89-ship/watch-ship2.sh`, PID 39990 lúc
12:55:21Z): probe như cũ, nhưng khi thấy cửa sổ tốt thì chạy
**electron-builder trực tiếp** (tối đa 6 lần, 30s cách nhau) thay vì
`package-ship` full — vì prepackage đã xong từ lần 4 (dist-web,
slim-venv ×4, bundled-server 721M đều đã stage lúc cửa sổ tốt
12:13–12:18), chỉ bước builder là còn thiếu. Builder xong thì chạy
`package-ship --skip-build` để verify/probe/smoke/orphan (log
`ship-run5.log`). Tối đa 30 vòng probe (~30 phút, tới ~13:25Z).
**Watcher v2 — KẾT QUẢ: builder OK lần 1, AppImage mới đã có (13:16:26Z).**
Vòng probe 1 lúc 12:55:29Z thấy cửa sổ tốt (10/10 ghi OK). electron-builder
chạy lần 1/6: mksquashfs pack AppImage từ 161 MB (13:04) → 386 MB (13:09)
→ 460 MB (13:12) → **557.008.461 byte lúc 13:16:26Z**, sha256
`9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`
(sha đầy đủ lấy lại sau bằng `sha256sum`, khớp với log ship-run5).
Verify guard trong gói mới ngay sau build: `grep -c ram_guard`
`bgremove.py` = 7, `bgremove.js` = 5 (K7: 0/0). Sau đó watcher chạy
`package-ship --skip-build` (PID 49481) để verify/probe/smoke/orphan
(log `ship-run5.log`): **verify-packaged-tree PASS; probe-ai-packaged
PASS — cả 8 service available=true (caption/translate/tts/bgremove/
reframe/silence/scene/beats, bgremove python=venv depsOk=true
modelOk=true)**; đang ở bước `smoke-appimage` thì **cell/VM restart
lúc ~13:21Z giết toàn bộ tiến trình** (systemd PID 1 start 13:21,
uptime 1 phút lúc 13:22:50Z; watcher PID 39990 + package-ship đều
chết, không còn tiến trình node/AppImage nào; `ship-full-report.json`
0 byte vì bị giết trước khi ghi). Smoke + orphan trong gói mới vì vậy
**chưa hoàn tất — không phải FAIL, là bị gián đoạn bởi restart**;
e2e Q9 (§4) tự nó launch AppImage + chờ bridge healthy nên vẫn là
kiểm chứng độc lập đủ cho guard. AppImage mới + `linux-unpacked/` +
models symlink đều nguyên vẹn sau restart (đã verify lại size/sha/grep
lúc 13:22:50Z).

### 3.4 Rủi ro song song đã ghi nhận

Các luồng Q1/Q4 đợt 89 đang sửa `server/render/` song song
(`render.js` + test `test_round89_q1_*`/`test_round89_q4_*` mới lúc
11:41Z) — prepackage copy cây live nên AppImage build lại có thể
snapshot `render.js` giữa lúc sửa. File guard của Q9
(`server/bgremove/bgremove.py`, `server/bridge/src/bgremove.js`) ổn
định từ đợt 88 (mtime 08:42–08:47Z), không luồng nào khác đụng. Sau
build sẽ `node --check`/`py_compile` cây đã đóng gói ở các file Q9
chạm tới để phát hiện file rách trước khi chạy e2e.

## 4. E2E guard qua bridge thật trong AppImage mới — PASS

Driver: `apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs`
(launch AppImage thật dưới Xvfb → chờ bridge healthy → POST
`/api/bgremove` session=`birefnet-general` trên clip 0,5s/17 frame
→ verdict guard; lấy mẫu RAM mỗi 20s). Work dir e2e:
`~/workspace/tmp-q9-round89-birefnet-e2e/` (report JSON
`e2e-report.json`, log `e2e-console2.log` — ngoài repo, giữ để đối
chiếu).

### 4.1 Lần 1 — 13:23:33–13:25:57Z: FAIL (lỗi khởi động, không phải guard)

AppImage spawn pid 3168, Xvfb :90 OK, nhưng 120s không thấy
`BRIDGE_PORT` trong `service-manager.log`. Log cho thấy app mất ~117s
mới tới "bridge state -> starting" (13:25:35, dưới tải loadavg ~15
do các luồng Q3/Q4 render song song + vừa reboot), rồi fail ngay:
`bridge state -> failed: Không chạy được node ".../tmp-run/
appimage_extracted_.../resources/vcut-server/bin/vcut-node":
Command failed: .../vcut-node --version`. Kiểm chứng sau đó:
`vcut-node` trong gói chạy tay cho `v24.22.2`, exit 0 — binary
trong gói KHÔNG hỏng; lỗi là nhất thời lúc khởi động chậm (khả
năng cao EPERM lúc spawn/exec hoặc file `vcut-studio` chưa sẵn khi
check chạy — script `vcut-node` exec Electron tại
`../../../vcut-studio` với `ELECTRON_RUN_AS_NODE=1`). Driver dọn
dẹp đúng (bridge port trống, app pid chết). Kết luận lần 1: không đo
được guard, không phải bằng chứng guard lỗi. Hành động: tăng thời
gian chờ `BRIDGE_PORT` trong driver từ 120s lên 300s, dọn socket
Xvfb :90 còn sót (`/tmp/.X11-unix/X90`, `/tmp/.X90-lock`), chạy lại.

### 4.2 Lần 2 — 13:28:02–13:31:34Z: PASS (đủ tiêu chí Q9)

| Mục | Số đo thật |
|---|---|
| AppImage | 557.008.461 byte, sha256 `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78` (preflight khớp) |
| Launch | Xvfb :90 pid 6898; AppImage pid 6909; bridge cổng **8787** tìm thấy sau 34s; **bridge healthy sau 5,7s** |
| RAM trước job | **2170 MB** (ngưỡng guard 6144 MB) — guard dự kiến chặn |
| Job | POST `/api/bgremove` session=`birefnet-general`, clip 0,5s (0,566667s, 17 frame) → **HTTP 200 sau 135,0s**; events: upload → processing 10/17 → 17/17 → done |
| Guard | `sessionUsed=u2net`, `fallbackFrom=birefnet-general`, `fallbackReason="RAM guard: RAM khả dụng 2038 MB < ngưỡng 6144 MB nên không thử birefnet-general (tránh OOM-kill) — đã dùng u2net ngay từ đầu"`; `guardBlocked=true`, `birefnetRan=false` |
| Đầu ra | `clip-0.5s_no_bg.mov` **1.715.896 byte**, 960×540, codec png, pix_fmt **rgba**, duration 0,566667s, **17/17 frame đọc được**, ~0,11 fps (u2net, dưới tải VM cao) |
| Alpha thật | Frame 7: 518.400 px — **59,3% trong suốt, 40,7% bán trong, 0% đục**, alphaMax 254, alphaMean 8,9 → mặt nạ alpha có thật, không phải video rỗng |
| Bridge log | `[bridge] bgremove xong: clip-0.5s_no_bg.mov (yêu cầu=birefnet-general, thực dùng=u2net, fallback từ birefnet-general)` |
| RAM sau job | 2303 MB; dọn dẹp: cổng 8787 trống sau kill, app pid chết |
| Verdict driver | `BgremoveGuardE2E=PASS guardBlocked=true birefnetRan=false`, exit 0, `allPass=true` |

Lưu ý trung thực: chuỗi marker `RAM_GUARD` không xuất hiện trong
`app-stdout.log` (driver đếm 0 dòng) — bằng chứng guard nằm ở done
event (`fallbackReason` nhắc đúng "RAM guard") và bridge log, là đủ
cho verdict; không cần marker stdout.

### 4.3 Cửa sổ RAM trong lúc chạy e2e (mẫu 20s, MemAvailable)

2050 MB (13:29:13) → 1641 → **921** → 1485 → 1010 → 803 MB
(13:30:53). **Max = 2050 MB** — xa dưới ngưỡng 6144 MB, không có
cửa sổ yên ≥ 6 GB nào trong lúc chạy. Kết hợp toàn lượt: max cao
nhất thấy ~2,65 GB (lúc 11:4x–12:x). **Vì vậy không có lần thử
birefnet thật nào trong lượt — đúng chỉ đạo, không ép chạy.**
Birefnet-general trong gói vẫn **0 lần chạy thành công**; để có lần
đầu vẫn cần cửa sổ yên ≥ 6 GB khả dụng ~7 phút hoặc máy nhiều RAM
hơn (nợ gốc đợt 88 §4 mục 2 chỉ đóng được nửa "test e2e guard",
nửa "1 lần chạy birefnet thành công" vẫn mở).

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

- **Birefnet-general: vẫn 0 lần chạy thành công trong gói.** Không có
  cửa sổ yên ≥ 6 GB khả dụng nào trong lượt này (max thấy ~2,65 GB
  toàn lượt; trong lúc chạy e2e max 2050 MB, các mẫu 20s: 2050 / 1641 /
  921 / 1485 / 1010 / 803 MB). Nửa "1 lần chạy birefnet thành công
  đầu tiên" của nợ đợt 88 §4 mục 2 vẫn mở — cần cửa sổ yên ≥ 6 GB
  ~7 phút hoặc máy nhiều RAM. **Nửa "test e2e guard qua bridge thật
  trong AppImage" đã ĐÓNG: PASS (§4).**
- **AppImage K7 không test được guard** (không chứa code guard — §1).
  Không chạy job birefnet trong K7 (sẽ là thử birefnet không guard).
- **Smoke + orphan trong AppImage mới chưa hoàn tất** (không phải
  FAIL): `package-ship --skip-build` đã PASS verify-packaged-tree và
  probe-ai-packaged (8/8 service available, bgremove venv OK) rồi bị
  cell/VM restart ~13:21Z giết giữa bước smoke. E2E Q9 (§4) tự
  launch + bridge healthy + job thật nên đủ cho guard, nhưng smoke
  chính thức + orphan-relaunch trong gói mới vẫn là nợ mở cho đợt
  sau (chạy lại `package-ship --skip-build` trên AppImage mới khi
  VM ổn định).
- **E2E lần 1 fail ở khởi động bridge** (§4.1): `vcut-node --version`
  fail nhất thời lúc app khởi động chậm (~117s tới bridge start dưới
  tải); binary trong gói chạy tay OK. Đã xử lý bằng retry + tăng chờ
  BRIDGE_PORT lên 300s — lần 2 PASS. Nếu đợt sau gặp lại: retry là
  đủ, đừng kết luận gói hỏng khi chưa chạy tay `vcut-node --version`
  trong cây đã đóng gói.
- **Sóng EPERM là blocker hiện tại của mọi build đóng gói**, không
  riêng Q9: `copy-web-dist` (cpSync, 0 lần retry nội bộ),
  `build-slim-venv`/`copy-bundled-server` (copyFileSync, 0 retry nội
  bộ), electron-builder (copy cây 700MB+, 0 retry nội bộ) đều chết khi
  sóng bật; chỉ `package-ship` có retry 5×20s ở mức step (K8 helper
  đã ghi rõ 5×20s không đảm bảo qua sóng ~15 phút — sóng lượt này đã
  ~35 phút tính tới 12:27Z và chưa qua). Đề xuất cho parent/đợt sau:
  cân nhắc retry theo từng file cho các bước copy đóng gói (mỗi file
  chỉ cần một khe tốt, thay vì đòi cả cây copy trong một cửa sổ tốt),
  hoặc chạy build đóng gói vào lúc sóng đã qua hẳn (probe duty test
  60/60 OK liên tiếp).
- **Probe EPERM v2 chết sau reboot** (loop mới chỉ sống ~2 phút sau
  boot 11:34:38Z; `status` 11:59 DEAD/STALE) — thuộc P8, Q9 chỉ ghi
  nhận.
- Không đụng TTS 39, không sửa production ngoài script e2e mới (§6).

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs` (mới) | Driver e2e guard: launch AppImage thật dưới Xvfb → chờ bridge healthy → POST bgremove session=birefnet-general → verdict guard (u2net + fallbackFrom + fallbackReason nhắc RAM guard + MOV alpha đủ frame) hoặc birefnet chạy thật; lấy mẫu RAM mỗi 20s; report JSON |
| `docs/PHASE9_ROUND89_Q9_BIREFNET_APPIMAGE_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `~/workspace/tmp-q9-round89-ship/` (work dir build,
AppImage nếu build được, log ship, report e2e, userdata — giữ ngoài repo
để parent đối chiếu; AppImage là binary), `apps/desktop/dist-web/`
(build artifact), `apps/desktop/build/` (artifact), `__pycache__`.

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
cd ~/workspace/repo-1
# 1. Unit guard (không cần model/AppImage):
python3 server/bgremove/test_bgremove_ramguard.py   # kỳ vọng 8/8
node server/bridge/test/test-bgremove-ramguard.cjs  # kỳ vọng 15 pass
# 2. Kiểm tra guard CÓ trong AppImage trước khi chạy e2e:
grep -c ram_guard <appimage-unpacked>/resources/vcut-server/server/bgremove/bgremove.py
grep -c ram_guard <appimage-unpacked>/resources/vcut-server/server/bridge/src/bgremove.js
#    Kỳ vọng: > 0 cả hai (K7: 0 — KHÔNG dùng K7 để test guard).
# 3. E2E guard trong AppImage mới (cần AppImage đã build từ cây có guard):
Q9_APPIMAGE=<appimage-moi> Q9_EXPECTED_SHA=<sha-moi> \
  Q9_MODELS_DIR=<dir-models> Q9_WORK=<work-dir-e2e> \
  node apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs
#    Kỳ vọng trên VM ít RAM: guard chặn birefnet, u2net hoàn tất,
#    sessionUsed=u2net, fallbackFrom=birefnet-general,
#    fallbackReason nhắc "RAM guard". Driver chờ BRIDGE_PORT tối đa
#    300s (tăng từ 120s sau lần 1 đợt 89: app khởi động chậm ~117s
#    dưới tải). Nếu bridge fail ở vcut-node --version: chạy tay
#    <gói>/resources/vcut-server/bin/vcut-node --version trước khi
#    kết luận gói hỏng; nếu OK thì retry e2e.
# 4. Kiểm tra sóng EPERM trước khi build (đừng build khi sóng đang bật):
bash scripts/probe-eperm-v2.sh once   # kỳ vọng ok=2 fail=0
```

# Phase 9 đợt 89 — Q6: WebKit clip D loop — thử fix race preroll (KẾT QUẢ: CHƯA FIX ĐƯỢC)

- **Nhiệm vụ:** đóng nợ LIMITS gộp đợt 88 §4 mục 3 — "WebKit clip D loop
  (N1: race preroll GStreamer vs HTTP progressive; watchdog seek-cứu
  thất bại 0/5; fix chưa thử)".
- **Kết luận ngắn:** **tái hiện được (B0 0/5). Đã thử 5 ứng viên fix
  (F1, F2, F3, F4, F5) — KHÔNG ứng viên nào fix dứt điểm.** Chỉ có
  blob URL (F4) loop sạch 2/2 (cộng N1 P6 5/5 → 7/7) — nhưng đó là
  đường vòng tránh HTTP progressive, không phải sửa race; và đường
  import local của app ĐÃ là blob nên race chỉ còn chạm đường
  proxy/HTTP-sample. **Không thay đổi production** (không có fix đủ
  bằng chứng để ship). Hướng tiếp theo có bằng chứng ở §6.
- **Probe:** `benchmarks/render/webkit_loop_d_fix_89q6.mjs` (server HTTP
  range-support port 8896, clip D tại `/tmp/q6/clips/d.mp4` — encode
  lại sau reboot, KHÔNG stage binary). Kết quả:
  `benchmarks/results/webkit-loop-d-fix-89q6.json` (27 run).
- **Môi trường đo:** WebKitGTK 27.2 (UA Safari 27.2), headed, Xvfb
  :199, `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`,
  VM 4 vCPU, RAM khả dụng ~1,2–2,9 GB (các luồng đợt 89 chạy song
  song), `hardwareConcurrency` 4, MediaRecorder `undefined`,
  `HTMLVideoElement.prototype.requestVideoFrameCallback` = function.
  Mỗi run = loop 5 vòng clip D (1280×720, 4 s, 24 fps, libx264
  testsrc2 mặc định, ~2,64 Mbps, 96 frame, decode sạch bằng ffmpeg).
  Pass = đủ 5 vòng `ended`, không stall ≥ 1,5 s. Wall mỗi run ~42 s.

## 1. Tái hiện (B0 baseline) — XÁC NHẬN 0/5

`ended → currentTime=0 + play()` ngay (như N1 P0).

| run | loops | frames decode | stall (ct kẹt) |
|-----|-------|---------------|----------------|
| B0-run1 | 0/5 | 7 | t=4,29 s, đứng 37,67 s ở ct=0,708 |
| B0-run2 | 0/5 | 8 | t=5,22 s, đứng 36,69 s ở ct=1,375 |
| B0-run3 | 0/5 | 3 | t=5,67 s, đứng 36,32 s ở ct=0,250 |
| B0-run4 | 0/5 | 3 | t=6,71 s, đứng 35,21 s ở ct=0,167 |
| B0-run5 | 0/5 | 3 | t=2,81 s, đứng 39,18 s ở ct=0,125 |

Chữ ký giống hệt N1: `!paused && !ended && !seeking`, ct đóng băng
trong ~1,4 s đầu, chỉ 3–8 frame decode được, `error` null,
`buffered` đầy [[0,4]] ngay từ đầu — không phải đói mạng. **B0: 0/5
pass, 0/5 vòng mỗi run.**

## 2. Các ứng viên fix đã thử (mỗi ứng viên 5 run, trừ F4 2 run)

### F1 — gated-restart (chờ preroll thật trước mỗi play): 0/5 pass, KHÔNG ship được

Mỗi restart (kể cả lần play đầu): seek(0) → chờ `seeked` → chờ 1
frame đã decode tại t=0 qua `requestVideoFrameCallback` (fallback:
`totalVideoFrames` tăng, timeout 5 s) → mới `play()`.

| run | loops | frames | stall vĩnh viễn? |
|-----|-------|--------|------------------|
| F1-run1..5 | 3/5 (cả 5 run) | 53–79 | Không (4/5 run 0 stall; run3 có 2 stall ngắn 1,5–1,7 s tự hồi phục) |

**Phát hiện quan trọng:** gate KHÔNG BAO GIỜ quan sát được frame
nào — `firstPlayGate` luôn `{method: 'timeout', waitMs: 5001,
framesBefore: 0, framesAfter: 0}` ở cả 5 run; mọi gate restart cũng
`method: 'timeout'`, `framesBefore == framesAfter` (vd 20→20,
42→42). Khi video đang pause sau seek, rVFC không bắn và
`totalVideoFrames` đứng yên trong 5 s — pipeline KHÔNG preroll khi
pause trên GStreamer này. Tức F1 thực chất là **delay cố định 5 s
trước mỗi play**, không phải "chờ preroll thật". 3/5 vòng là giới
hạn wall 42 s (5 s gate + 4 s play ≈ 9 s/vòng), không phải stall ở
vòng 4. Delay 5 s tránh được stall vĩnh viễn (0/5 run stall vĩnh
viễn, so với B0 5/5) nhưng **5 s/restart không dùng được trong
production** (preview cần restart < 100 ms). F1 không phải fix ship
được; và nó chứng minh không có tiêu chí "đã preroll" nào rẻ quan
sát được khi pause (rVFC/totalVideoFrames đều mù).

### F2 — load-restart: 0/5 pass, FAIL hoàn toàn

`ended → load() → chờ canplay → seek(0) → chờ seeked → play()`.

| run | loops | frames | stall |
|-----|-------|--------|-------|
| F2-run1..5 | 0/5 (cả 5 run) | 2–6 | 1 stall vĩnh viễn mỗi run, ct 0,083–2,208, đứng ~34–38 s |

Chữ ký giống hệt B0. `load()` + `canplay` không phải tín hiệu sẵn
sàng đủ (khớp N1: `canplaythrough` cũng không đủ). Rebuild pipeline
mở lại đúng race cũ.

### F3 — prime-only (mồi pipeline một lần, restart sau dùng baseline): 3/5 pass, KHÔNG đủ tin

Trước lần play đầu: `play()` → chờ ct>0,05 → `pause()` → seek(0) →
chờ `seeked` → `play()`; các restart sau dùng baseline (seek+play
ngay).

| run | loops | frames | prime | stall |
|-----|-------|--------|-------|-------|
| F3-run1 | 5/5 PASS | 264 | 722 ms, ct 0,083 | 0 |
| F3-run2 | 2/5 | 129 | 1097 ms, ct 0,083 | 1 (ct=0,576, 27,4 s) |
| F3-run3 | 5/5 PASS | 398 | 300 ms, ct 0,083 | 0 |
| F3-run4 | 5/5 PASS | 500 | 101 ms, ct 0,065 | 0 |
| F3-run5 | 4/5 | 390 | 109 ms, ct 0,069 | 1 (ct=0, 25,2 s) |

Prime cải thiện rõ so với B0 (0/5 → 3/5) nhưng **không đáng tin**:
run2 stall ở vòng 3, run5 stall ngay ở restart vòng 5 (ct=0 — chính
cú restart đóng băng). Race mở lại ở từng restart một cách xác suất,
prime một lần không khóa được. **3/5 < ngưỡng quyết định (≥4/5).**

**Bug probe đã gặp và sửa (ghi để luồng sau khỏi lặp lại):** đợt
chạy F3 đầu tiên (13:15–13:19) có run4/run5 prime KHÔNG chạy:
`playErr="Can't find variable: sleep"` — `gateFnSource()` định
nghĩa `sleep` bằng `const` trong direct `eval()`, nên `sleep`
không thoát ra scope ngoài (chỉ `waitFrame`/`waitEvent` là function
declaration mới thoát được). Vòng while prime gọi `sleep(50)` →
ReferenceError → catch bỏ qua toàn bộ nhánh prime. Đợt đó: run1
5/5, run2 2/5, run3 5/5 (prime chạy thật), run4 0/5 (thực chất là
B0), run5 5/5 (thực chất là B0 nhưng pass do tải thấp sau restart
runtime — frames=338, wall 25,6 s — khớp caveat N1 "baseline dao
động 0/5–5/5 theo tải"). Đã sửa probe (`function sleep(...)`,
không còn `const`), chạy lại F3 ×5 sạch — bảng trên là số sau sửa.
5 entry F3 cũ đã gỡ khỏi JSON để tránh trùng tên; số cũ giữ ở đây.

### F4 — blob-control (fetch toàn bộ file → blob URL, restart baseline): 2/2 PASS

| run | loops | frames | fetched | stall |
|-----|-------|--------|---------|-------|
| F4-run1 | 5/5 PASS | 210 | 1.320.168 byte | 0 |
| F4-run2 | 5/5 PASS | 255 | 1.320.168 byte | 0 |

**Xác nhận N1 P6 trên boot này: blob URL loop sạch (cộng N1 5/5 →
7/7).** Khi toàn bộ file đã ở trong bộ nhớ, race biến mất. Đây là
bằng chứng mạnh nhất rằng race nằm ở đường HTTP progressive (pipeline
GStreamer xin dữ liệu theo từng đoạn trong lúc preroll), không phải ở
logic restart của app. Đường import local của app ĐÃ là blob URL
(`media.ts` fileToMediaItem → `URL.createObjectURL`) nên không dính
race; chỉ đường proxy (`item.proxyUrl`) và sample HTTP mới dính.

### F5 — delay 1 s trước mỗi play (ngưỡng delay): 1/5 pass, FAIL

Mỗi restart (kể cả lần đầu): seek(0) → chờ `seeked` → sleep(1000)
→ `play()`. Hỏi: 1 s có đủ như 5 s của F1 không?

| run | loops | frames | stall |
|-----|-------|--------|-------|
| F5-run1 | 4/5 | 319 | 1 (ct=4, 14,0 s — cuối vòng 4) |
| F5-run2 | 0/5 | 5 | 1 (ct=0,176, 40,4 s — stall ngay lần play đầu, dù đã delay 1 s) |
| F5-run3 | 5/5 PASS | 414 | 0 |
| F5-run4 | 0/5 | 4 | 1 (ct=0,250, 39,5 s) |
| F5-run5 | 0/5 | 4 | 1 (ct=0,208, 39,9 s) |

**1 s không đủ.** 3/5 run stall ngay lần play đầu (ct 0,18–0,25,
chỉ 4–5 frame) dù đã chờ seeked + 1 s. Ngưỡng delay tránh stall nằm
đâu đó trong (1 s, 5 s] và vẫn là xác suất, không phải ranh giới
sạch — 1 s không phải ứng viên production (vừa chậm vừa không ăn).
Gate mỗi restart của F5 tốn ~1,1–1,5 s (sleep 1 s + seek ~0,1–0,5 s).

## 3. Bảng tổng kết

| ca | cơ chế | pass | loops/run | stall vĩnh viễn |
|----|--------|------|-----------|-----------------|
| B0 | baseline | 0/5 | 0/5 | 5/5 run |
| F1 | gate 5 s (thực chất delay) | 0/5 | 3/5 (giới hạn wall) | 0/5 run |
| F2 | load()+canplay | 0/5 | 0/5 | 5/5 run |
| F3 | prime một lần | 3/5 | 5,2,5,5,4 | 2/5 run |
| F4 | blob URL | 2/2 | 5/5 | 0/2 run |
| F5 | delay 1 s | 1/5 | 4,0,5,0,0 | 4/5 run |

**Không ứng viên nào đạt ngưỡng quyết định (≥4/5 hoặc 5/5 với
baseline fail rõ trên cùng boot) — trừ F4 blob, vốn là đường vòng
tránh HTTP chứ không sửa race.** Vì vậy: **không thay đổi
production** trong đợt này.

## 4. Hồi quy

- Không đổi file production nào → không có hồi quy từ luồng này.
- Unit test chạy lại sau probe, xanh: `webkitLoopRestart80H5`
  11/11, `webkitRestartTrace85M4` 10/10, `seek.test.ts` xanh.
- `tsc --noEmit` (apps/web): exit 0, 0 lỗi.
- Click-test WebKit/Chromium (O8 harness): KHÔNG chạy lại trong
  đợt này — không có thay đổi production để hồi quy, và Chromium
  Playwright launch vẫn crash SIGTRAP (giới hạn môi trường, xem §5);
  hành vi WebKit loop đã được đo trực tiếp bằng probe (27 run).
- Không thêm test khóa hành vi production mới: không có fix thành
  công để khóa. Probe script đã được sửa bug `sleep` (xem §2 F3)
  và thêm mode F5; kết quả JSON là bằng chứng khóa số đo.

## 5. Môi trường — sự cố và cách xử lý (ghi để luồng sau dùng)

- **VM reboot trước lượt:** dep apt WebKit mất hết (0 gói
  gstreamer/libgtk-4; không có thư mục plugin hệ thống). `dpkg -i`
  170 .deb cache abort ở libshout3 vì EPERM ghi file; `dpkg
  --configure -a` và `ldconfig` cũng fail cùng họ.
- **EPERM — cơ chế đã xác định thêm đợt này:** không phải "cửa sổ
  vài phút" mà là **ngẫu nhiên theo từng `write()`**, lật trong
  chưa tới 1 giây (cùng 1 shell: `echo T` OK 6 lần rồi FAIL ngay
  lần thứ 7; python write 0/18 một lúc rồi OK ngay sau đó). Strace
  Xvfb chỉ đúng syscall: `openat("/tmp/.tX199-lock",
  O_WRONLY|O_CREAT|O_EXCL) = 6` OK, rồi `write(6, "     35335\n",
  11) = -1 EPERM`. Tỉ lệ fail mỗi write ước ~5–15%, thay đổi theo
  thời gian; tiến trình ghi nhiều (dpkg) gần như chắc chắn dính.
  Hệ quả thực tế: (a) **redirect log `> file` cũng là write — khi
  nó dính EPERM thì bash KHÔNG chạy lệnh** (2 script retry đầu quay
  vòng vô ích vì lý do này); (b) file lock tạm `.tX<n>-lock` (0
  byte) của lần fail còn kẹt lại sẽ làm lần sau chết ngay ở
  open(O_EXCL) — phải `rm -f` trước mỗi lần thử; (c) `xvfb-run -a`
  tự tăng số display nên để lại chuỗi `.tX99–108`.
- **Xvfb dựng được bằng retry chặt:** `/tmp/q6/xvfb-tight2.sh`
  (mỗi lần thử ~0,7 s, tối đa 300 lần, redirect /dev/null, rm lock
  tạm trước mỗi lần) thành công ở lần thử 239 (12:55:14, Xvfb :199
  PID 39876). Sau restart runtime, dựng lại lên ngay lần thử 1
  (13:24:56).
- **WebProcess crash khi `goto` HTTP** (lần đầu): `GLib-GIO-ERROR:
  Settings schema 'org.gnome.system.proxy' is not installed` —
  `gsettings-desktop-schemas` unpack nhưng postinst chưa chạy nên
  `gschemas.compiled` stale (2.349 byte). Sửa:
  `glib-compile-schemas /usr/share/glib-2.0/schemas` (lên 41.821
  byte) → `goto` HTTP OK ngay.
- **Đường vòng qua dpkg (hiệu quả):** `dpkg-deb -x` 170 .deb cache
  ra debroot (409 MB) + `cp -an` vào `/` (chỉ file chưa có) →
  MiniBrowser hết báo thiếu lib; `GST_PLUGIN_PATH` bắt buộc sau
  reboot (N1 §7).
- **WPE headless KHÔNG phải đường vòng:** `webkit.launch({headless:
  true})` fail ngay ở newPage ("Target page, context or browser has
  been closed" — MiniBrowser-WPE crash). Không đào sâu.
- **Chromium Playwright launch crash SIGTRAP** (binary chạy trực
  tiếp OK, `chrome --version` 158.0.8127.18, `ldd` đủ lib, headless
  shell `--dump-dom about:blank` OK) — giới hạn môi trường, chưa
  chẩn đoán. `Q6_BROWSER=chromium` smoke chưa test được.
- **Runtime restart ~13:21–13:23: SANDBOX RESET TOÀN BỘ.** /tmp/q6
  biến mất, lib đã copy vào /usr/lib biến mất, gschemas.compiled về
  bản stale, Xvfb :199 chết, invocation F3 mất kết quả (run5 chưa
  ghi). May: `~/workspace/repo-1` còn nguyên. Khôi phục nhanh
  (~50 s) nhờ apt cache còn đủ 170 .deb. Bài học: mọi thứ ngoài
  `~/workspace` đều có thể mất sau restart — đừng để trạng thái quan
  trọng ở /tmp hay /usr. (Nợ hệ thống còn đó: dpkg status về trạng
  thái image — 0 gói iU; 128 gói iU trước restart đã mất cùng
  reset; `ci-security.yml` vẫn 403 — không thuộc phạm vi luồng này.)
- **Cẩn thận đã làm:** lỡ append 1 dòng rác "TESTAPPEND" vào
  /var/lib/dpkg/status lúc test ghi — đã gỡ bằng `truncate -s -11`
  ngay sau đó; `dpkg --audit` parse lại bình thường (exit 0). Sau
  reset runtime, trạng thái này cũng đã mất cùng hệ thống.

## 6. Hướng tiếp theo (có bằng chứng)

1. **Prefetch blob cho clip proxy/HTTP nhỏ (ứng viên mạnh nhất).**
   F4 2/2 + N1 P6 5/5 = 7/7 loop sạch khi toàn bộ file ở trong bộ
   nhớ. Production hiện tại: local import đã là blob; chỉ đường
   proxy (`item.proxyUrl`) và sample HTTP còn dùng URL progressive.
   Đề xuất đợt sau: khi preview cần loop/seek lặp một clip proxy
   nhỏ (vd ≤ 8–16 MB, ngưỡng cần đo), fetch toàn bộ → blob URL rồi
   mới gán `src` (kèm thu hồi `revokeObjectURL` và fallback về URL
   gốc nếu fetch lỗi hoặc clip lớn). Cần validate riêng trên
   production (chưa đo trong đợt này — probe chỉ chứng minh cơ chế).
2. **Đừng đầu tư thêm vào delay/gate theo thời gian.** F1 5 s tránh
   stall nhưng không ship được; F5 1 s fail 4/5; F3 prime 3/5.
   Ngưỡng nằm trong (1 s, 5 s] mà vẫn là xác suất.
3. **Đừng đầu tư vào `load()`/`canplay`/`canplaythrough`.** F2 0/5;
   N1 đã loại `canplaythrough`. readyState không phản ánh preroll
   thật trên pipeline này.
4. **Câu hỏi mở cho đợt sau (cần bằng chứng mới):** vì sao pipeline
   không decode frame nào khi pause sau seek (rVFC/totalVideoFrames
   đứng yên 5 s)? Có phải GStreamer `playbin` chỉ preroll khi
   `play()` thật sự chạy (không phải khi pause)? Nếu đúng, hướng
   "play–pause–play probe" (play thật 1–2 frame rồi mới seek về 0)
   có thể là tiêu chí preroll rẻ hơn delay 5 s — nhưng F3 (prime
   bằng play thật) cũng chỉ 3/5, nên kỳ vọng thấp; cần đo riêng.
   Ngoài ra: kiểm tra `buffered.end(0) >= duration` trước play đầu
   có tương quan với pass không (dữ liệu JSON đã có `samples` với
   `rs`/`ct` từng 100 ms — có thể phân tích hậu nghiệm mà không cần
   chạy lại).
5. **Nợ môi trường còn lại:** Chromium Playwright SIGTRAP; dpkg
   status đã reset (cần cài lại dep nếu reboot nữa — dùng đường vòng
   `dpkg-deb -x` + `cp -an`, đừng dùng `dpkg -i`); Xvfb cần retry
   chặt sau mỗi reboot (script mẫu đã có trong log luồng).

## 7. Files (stage, KHÔNG push)

- `benchmarks/render/webkit_loop_d_fix_89q6.mjs` — probe (sửa bug
  `sleep`, thêm mode F5).
- `benchmarks/results/webkit-loop-d-fix-89q6.json` — 27 run (B0 5,
  F1 5, F2 5, F3 5 sau sửa, F4 2, F5 5).
- `docs/PHASE9_ROUND89_Q6_WEBKIT_CLIPD_LIMITS.md` — file này.
- Không có file production nào thay đổi.

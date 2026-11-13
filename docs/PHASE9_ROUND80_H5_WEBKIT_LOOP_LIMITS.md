# Phase 9 đợt 80 — H5: WebKitGTK loop workaround + đo WebGL thật

Ngày: 10/11/2026, lượt cron 15:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 79 §4.7 (W3 loop kẹt + W4 nhãn "Apple GPU" giả +
nợ đo chi phí WebGL thật của Chromium, xem
`docs/PHASE9_ROUND79_G8_GPU_SAFARI_LIMITS.md`).

**Kết luận ngắn:**
1. **Workaround `ended → seek(0) + play()` SỬA được loop trên
   WebKitGTK — đã kiểm chứng headed.** Clip H.264 2 s / 3 s và VP9
   2 s loop 2–3 vòng sạch (endedCount khớp số vòng, không kẹt);
   clip 720p 4 s sửa được khi decode theo kịp. Đã nối vào preview
   (dạng seek tới target của timeline — xem §4).
2. **W3 tái hiện trên cả 4 clip, với 3 biểu hiện khác nhau** (§1),
   nhưng clip 720p không ổn định: lượt chính loop được 2 vòng
   chậm, lượt kiểm tra lại kẹt sau đúng 1 vòng cả 2 lần.
3. **`play()` đơn thuần sau `ended` cũng khởi động lại được trên
   WebKitGTK** (clip A/B/C loop lại được) — nên app vốn đã tự cứu
   một phần qua `play()` mỗi tick trong syncMedia; thay đổi ở §4
   chỉ làm phục hồi đó ngay lập tức và đúng vị trí timeline.
4. **Không đo được GPU-time thật bằng timer query ở cả hai engine:**
   `EXT_disjoint_timer_query_webgl2` VẮNG trên cả Chromium
   (SwiftShader) lẫn WebKitGTK. Đo bằng FPS workload thay thế:
   shader nặng 1280×720×100 vòng trig chạy **0,34–0,46 fps trên
   Chromium và 0,35–0,40 fps trên WebKitGTK** — cả hai đều raster
   bằng CPU, chậm như nhau, không có GPU ở đâu cả.
5. **Nhãn WebGL "Apple GPU" trên WebKitGTK vẫn là giả** (W4, xác
   nhận lại): chuỗi renderer không đổi, thời gian chạy shader khớp
   CPU đơn luồng.
6. **Safari thật vẫn chưa đo.** Không có máy macOS/iOS — mọi kết
   luận WebKit dưới đây vẫn là WebKitGTK, không được trích thành
   "Safari làm X".

## 0. Máy đo lúc này (10/11/2026)

| Mục | Giá trị |
|---|---|
| CPU | AMD EPYC 9D25, **4 vCPU** (`nproc` = 4) |
| RAM | 7.934 MiB |
| Kernel | **7.0.0-44-generic** (giống đợt 79) |
| OS | Ubuntu 24.04.5 LTS |
| FFmpeg | 8.1.2 |
| Chromium | 158.0.8127.18 full build (`chromium-1254`), headed dưới `xvfb-run` + headless-new |
| WebKit | 27.2 (`webkit-2388`), headless + headed-xvfb |
| Playwright | `playwright-core 1.65.0` (`/home/hatch/scratch-round63-r4/node_modules/`) |
| GStreamer hệ thống | 266 file plugin trong `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` (`gstreamer1.0-tools` chưa cài nên không đếm bằng `gst-inspect` được như đợt 79) |
| **Load lúc đo** | **Biến động mạnh: 0,7–17,9** — các luồng đợt 80 khác chạy song song + tiến trình os-intent replay của hệ thống cài lại package sau reboot (xem §5). Mọi số fps/timing tuyệt đối mang caveat đó; so sánh trong cùng một lượt đo vẫn có ý nghĩa tương đối. Riêng clip D (720p) đói decode rõ rệt khi load cao (§1.4). |

## 1. W3 — loop kẹt: tái hiện trên 4 clip, 3 biểu hiện

Clip tự encode (`testsrc2`, ffmpeg 8.1.2), phát qua HTTP server đa
luồng trong chính script probe (port 8897), `muted`, `playsInline`,
lấy mẫu `currentTime` mỗi 0,5 s trong 8 s. Chế độ `native` =
`video.loop = true` (không handler).

| Clip | WebKit headless — native | WebKit headed — native | Chromium (cả 2 chế độ) |
|---|---|---|---|
| A: H.264 320×180 2 s 30 fps (baseline G8) | **Kẹt ở 0** sau 1 vòng (`stuckAtZero`, total 73 frame, `seeked` 29 lần — vòng lặp native tự seek liên tục trong lúc kẹt) | **Kẹt ở 0** (total 27 frame — decode chậm hơn dưới Xvfb) | Loop 3 vòng sạch (229–240 frame) |
| B: H.264 640×360 3 s 30 fps | **Giật ở đầu vòng 2**: currentTime quanh quẩn 0–0,21 rồi về 0 liên tục, không tiến (total 177) | Giật tương tự (final 0,3) | Loop 2 vòng sạch (236–244 frame) |
| C: VP9 320×180 2 s 30 fps | **Đóng băng ở CUỐI clip**: currentTime = 2,0 suốt, `paused: false`, **không bắn sự kiện `ended`** (total 219 — decoder vẫn nhả frame nhưng không tiến) | Đóng băng ở 2,0 (total 51) | Loop 3 vòng sạch (234–240 frame) |
| D: H.264 1280×720 4 s 24 fps | **Không ổn định**: lượt chính loop 2 vòng chậm (total 157); lượt kiểm tra lại (§1.4) kẹt sau đúng 1 vòng cả 2 lần (total 95–96 = đúng 1 vòng) | Không kết luận được — decode đói (total ≤ 8 frame / 8 s, xem §1.4) | Loop 1 vòng trong 8 s (170–192 frame), bình thường |

**Đọc đúng:**
- W3 không phải một biểu hiện duy nhất: kẹt-ở-0 (A), giật-ở-đầu
  (B), đóng-băng-ở-cuối-không-ended (C). Biểu hiện C là nguy hiểm
  nhất cho code dựa vào sự kiện `ended` — nó không bao giờ bắn.
- W3 không ổn định trên clip D: cùng một clip, lúc loop được
  (chậm), lúc kẹt sau đúng 1 vòng. Nguyên nhân chưa xác định được
  (nghi liên quan trạng thái decoder/buffer lúc wrap, không phải
  load — lượt kiểm tra lại chạy khi load thấp đầu lượt rồi tăng
  vọt giữa chừng). Ghi là **không ổn định**, không claim "D miễn
  nhiễm" hay "D luôn kẹt".
- Số frame `total` của WebKit ở chế độ native thường CAO hơn số
  vòng đã phát (vd C: 219 frame ≈ 3,6 vòng trong khi currentTime
  đứng yên) — decoder vẫn decode nhưng không trình diễn tiếp.
  Đừng đọc `totalVideoFrames` như "đã phát được bấy nhiêu vòng".

### 1.1 Workaround `ended → seek(0) + play()` — SỬA ĐƯỢC (WebKitGTK)

| Clip | WebKit headless | WebKit headed |
|---|---|---|
| A 2 s | 2 vòng, ended 3, total 172, không kẹt | 2 vòng, ended 2, total 71 |
| B 3 s | 2 vòng, ended 2, total 205 | 1 vòng hoàn chỉnh + vòng 2 tới 3,0 cuối lượt, ended 2, total 83 |
| C VP9 2 s | **3 vòng**, ended 3, total 204 | 2 vòng, ended 2, total 68 |
| D 720p 4 s | 1 vòng, ended 1, total 139 (tiến tới 2,23 ở vòng 2) | Không kết luận được — decode đói (total 3) |

Caveat: sau mỗi lần restart có **độ trễ ~0,5–1 s ở currentTime 0**
trước khi phát tiếp (2 mẫu 0 liên tiếp trong cả headless lẫn
headed, ở mọi clip) — workaround sửa được kẹt vĩnh viễn nhưng
không mượt như loop native của Chromium (resume ngay). Chấp nhận
được cho preview (xem §4: app seek thẳng tới target nên không
chịu độ trễ này theo cùng cách).

### 1.2 `play()` đơn thuần sau `ended` — CŨNG KHỞI ĐỘNG LẠI ĐƯỢC (WebKitGTK)

| Clip | WebKit headless | WebKit headed |
|---|---|---|
| A 2 s | 2 vòng, ended 2, total 131 | 2 vòng, ended 2, total 75 |
| B 3 s | 2 vòng, ended 2, total 202 | 1 vòng + vòng 2 tới 2,6, ended 2, total 59 |
| C VP9 2 s | **3 vòng**, ended 3, total 208 | Không kết luận được — video đóng băng ở 1,8 (decode đói, chưa tới cuối nên chưa có `ended` để thử) |
| D 720p 4 s | Không kết luận được (§1.4) | Không kết luận được — decode đói (total 2) |

Hệ quả quan trọng cho app: `play()` sau `ended` restart được
nên vòng lặp preview — vốn gọi `play()` mỗi tick khi element đang
`paused` — đã tự cứu trường hợp element chạm `ended`. Khởi động
lại này đi từ 0 (không phải từ target), nhưng drift re-seek sẽ
kéo về đúng vị trí sau đó.

### 1.3 Kiểm chứng lại: W3 có phải do `loop` không?

Có. Cùng clip, cùng engine, cùng lượt đo: `native` (loop=true)
kẹt, `ended-seek` (loop=false + handler) chạy, `ended-play-only`
(loop=false + handler play) chạy. Chỉ khác duy nhất cơ chế lặp.
Chromium làm đối chứng: cả 3 chế độ đều loop sạch trên cả 4 clip
(12/12 ca, 151–244 frame, 0 kẹt).

### 1.4 Clip D và đói decode dưới tải — caveat đo

Lượt kiểm tra lại clip D (chạy khi load vọt lên 17,86 giữa lượt):
- WebKit D `ended-seek` / `ended-play-only`: video kẹt ở 0,18–0,39
  ngay từ đầu, total 3–8 frame / 8 s — **decode không chạy nổi**,
  chưa hề tới cuối clip nên không thử được đường restart. Đây là
  đói decode, KHÔNG phải verdict về chế độ loop.
- WebKit D headed (mọi chế độ): total 2–8 frame / 8 s — tương tự.
- Chromium D cùng lúc: 151–192 frame, loop bình thường — decode
  của Chromium chịu tải tốt hơn hẳn trên VM này.
- Ngược lại, lượt chính chạy khi load thấp hơn thì WebKit D
  `ended-seek` chạy được (ended 1, total 139). Kết luận: số đo
  clip D trên WebKitGTK **phụ thuộc tải rất mạnh**; chỉ dùng các
  ca D có total frame đủ lớn (≥ 1 vòng) làm verdict, còn lại ghi
  "không kết luận được".

## 2. Chi phí WebGL thật của Chromium — timer query vắng, FPS workload

Phương pháp (thay `gl.finish()` timing đã bị cấm ở G8 §5.3):
(a) `EXT_disjoint_timer_query_webgl2` để đo GPU-time mỗi draw;
(b) FPS workload: vòng rAF vẽ shader nặng 1280×720×100 vòng trig
5–8 s, đếm fps thật + kiểm tra pixel trung tâm để chứng minh
shader chạy thật.

| Engine | Timer query ext | FPS workload (shader nặng) | Pixel trung tâm |
|---|---|---|---|
| Chromium headed | **không có** | **0,34 fps** (3 frame / 8,8 s) | [243,243,243,255] |
| Chromium headless | **không có** | **0,46 fps** (4 frame / 8,7 s) | [241,241,241,255] |
| WebKit headless | **không có** | **0,35 fps** (3 frame / 8,5 s) | [243,243,243,255] |
| WebKit headed | **không có** | **0,40 fps** (3 frame / 7,5 s) | [243,243,243,255] |

**Đọc đúng:**
- Không đo được GPU-time thật bằng timer query ở cả hai engine
  trên VM này — extension không tồn tại (cả SwiftShader lẫn
  WebKitGTK). Nợ "đo GPU-time" vẫn mở cho máy có GPU thật.
- FPS workload cho số thật đầu tiên về chi phí WebGL của Chromium:
  ~0,34–0,46 fps cho shader nặng = **~2,2–2,9 s/frame**, ngang
  WebKitGTK (0,35–0,40 fps). Cả hai đều raster bằng CPU (phần mềm),
  không engine nào có lợi thế GPU trên VM này. Số này KHÔNG phải
  "WebGL của Chromium nhanh/chậm hơn WebKit" theo nghĩa phần cứng
  — mà là chi phí raster phần mềm của cùng workload trên cùng máy.
- Đính chính lượt đo trước: ở lượt chạy đầu của đợt này, Chromium
  headed cho pixel trung tâm [0,0,0,0] (readPixels về 0); lượt chạy
  lại cho [243,243,243,255] đúng như headless. Số 0 lượt đầu là
  readback nhất thời (chưa xác định được nguyên nhân — có thể
  canvas chưa composite dưới Xvfb), không dùng làm kết luận; số
  đúng lấy theo lượt chạy lại.
- Renderer: Chromium vẫn `ANGLE (SwiftShader)` (software-only);
  WebKit vẫn `"Apple GPU"` — **nhãn giả (W4), xác nhận lần 2**,
  không được trích làm bằng chứng GPU.

## 3. App có bị W3 đánh không? — Về nguyên tắc là KHÔNG (đã đo gián tiếp)

Kiểm tra code (không đoán): preview **không dùng thuộc tính
`loop` ở bất cứ đâu** (grep toàn bộ `apps/web/src`: không có
`.loop =` / `loop:` nào trong code production; không có chế độ
loop-preview trong UI — hết timeline thì `playing: false`).
Preview chạy bằng seek theo playhead: `syncMedia` trong
`preview.tsx` seek element tới `target = sourceTimeAt(clip,
playhead)`, đặt `playbackRate = clip.speed`, và gọi `play()` mỗi
tick khi `paused`.

Vì vậy cả 3 biểu hiện W3 đều tự khỏi trong kiến trúc hiện tại:
- Kẹt ở 0 / giật ở đầu (A, B): `currentTime` đứng yên trong khi
  `target` tiến theo playhead → drift vượt ngưỡng 0,35 s sau 2
  tick xác nhận → `shouldIssueForwardReseek` phát seek tới target
  → khỏi. (Cơ chế này đã có từ đợt 54 K9, không phải viết mới.)
- Đóng băng ở cuối, không `ended` (C): tương tự — `currentTime`
  đứng ở duration trong khi target tiến → drift → re-seek.
- Chạm `ended` thật: `paused` thành true → tick sau `play()`
  (đã đo ở §1.2 là restart được trên WebKitGTK) → drift re-seek
  kéo về target.
- Nhánh reverse (phát ngược / clip reverse): step-seek tới target
  mỗi tick (target lùi khỏi duration) nên cũng tự khỏi.

Thay đổi ở §4 chỉ rút ngắn phục hồi: từ "play-từ-0 rồi re-seek
sau 2+ tick" thành "seek thẳng tới target trong cùng tick".

## 4. Thay đổi production (đợt này)

### 4.1 Mới: `apps/web/src/lib/webkitLoopRestart80H5.ts`

- `shouldRestartEndedElement(el)`: `ended && !seeking` (không
  seek chồng — chặn nhịp K9/L2).
- `restartEndedElement(el, target)`: nếu cần thì
  `el.currentTime = target`, trả true; không làm gì khi chưa
  ended / đang seeking / target không hữu hạn / đã ở target
  (eps 0,001 s) / seek ném lỗi. KHÔNG gọi `play()` — caller giữ
  một điểm resume duy nhất.
- Seek tới **target của timeline** (không phải 0): 0 chỉ đúng với
  video loop thô; preview cần đúng vị trí timeline. Không gắn
  listener `ended` — syncMedia gọi mỗi tick nên kiểm tra cờ là
  đủ; gắn listener tự restart ngoài vòng lặp có nguy cơ phát lại
  element đã hết active (rò audio) nên không làm.

### 4.2 Nối vào `apps/web/src/preview.tsx` (syncMedia, nhánh forward)

Ngay trước `if (a.el.paused) void a.el.play()`:

```ts
if (restartEndedElement(a.el, a.target)) {
  syncReseekCount++;
  if (a.el.tagName === "VIDEO") syncReseekVideoCount++;
  else syncReseekAudioCount++;
}
```

Chỉ kích hoạt khi element thật sự ended (hiếm: tick biên), không
chạm đường phát thường; áp cho cả VIDEO và AUDIO (cùng code path).
Đếm như một lần re-seek lúc phát, cùng nghĩa với các đường
forceSeek/drift-seek phía trên.

### 4.3 Không làm

- Không đặt `el.loop = true` ở đâu (chính nó là thứ kẹt).
- Không gắn handler `ended` tự restart (lý do ở §4.1).
- Không sửa nhánh reverse (đã tự khỏi bằng step-seek).
- Không claim đã click-test editor đầy đủ trên WebKitGTK (xem §6).

## 5. Sự cố môi trường trong lượt này (ghi để đợt sau khỏi mất giờ)

VM đã **reboot** trước lượt này (uptime lúc bắt đầu chỉ 27 phút):
toàn bộ package apt mà các đợt trước cài cho WebKit (GStreamer…)
đã biến mất khỏi `/usr` (file ngoài `~` không bền qua reboot).
Lượt probe đầu tiên của đợt này vì thế crash ngay khi launch
WebKit: `libgstreamer-1.0.so.0: cannot open shared object file`.

Khắc phục (đã làm, có hiệu lực trong lượt này):
1. Chạy `~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/install-dependencies.sh --autoinstall`
   — nhưng kẹt lock dpkg vì tiến trình **os-intent replay của hệ
   thống** (pid 804, chạy từ lúc boot) đang cài lại từng package
   theo ledger `/var/lib/hatch/os-intent/ledger.jsonl` (trong đó
   có đủ các dep WebKit, kể cả `gstreamer1.0-plugins-good`,
   `libevent-2.1-7t64`…).
2. Chờ replay tiến triển (15 → 12 → 11 → 9 → 7 package thiếu)
   rồi chiếm lock bằng **`apt-get -o DPkg::Lock::Timeout=900
   install …`** — apt chờ lock thay vì fail ngay; cài xong 7 gói
   còn lại (APT_RC 0), WebKit 27.2 launch được ngay sau đó.
3. `apt-get update` qua mirror hiện tại rất chậm (~131 kB/s,
   41,9 MB mất 5 phút 19 s) — tính vào thời gian lượt sau.

**Bài học cho đợt sau:** sau mỗi lần VM reboot, chạy lại
`install-dependencies.sh` (hoặc chờ os-intent replay xong) TRƯỚC
khi đo WebKit; đừng kết luận "WebKit hỏng" khi chỉ là thiếu lib
hệ thống. Các package apt này không bền qua reboot/replacement.

## 6. Kiểm chứng đợt này

| Kiểm chứng | Kết quả |
|---|---|
| Probe loop 4 clip × 3 chế độ × 4 engine (headed + headless) | **Xanh** — `benchmarks/render/webkit_loop_probe_80h5.mjs`, kết quả thô `benchmarks/results/webkit-loop-probe-80h5.json` (34.234 byte) |
| Kiểm tra lại clip D (2 lần × 3 chế độ, WebKit + Chromium headless) | **Xanh** — `benchmarks/render/webkit_loop_retest_80h5.mjs` (kết quả `/tmp/h5/retest-d.json`, không stage vì chỉ là log kiểm tra lại; số đã chép vào §1.4) |
| Unit test mới `webkitLoopRestart80H5.test.ts` | **11/11 xanh** (`node scripts/run-node-test.mjs …`) |
| Hồi quy liên quan (12 file: previewLoop50F2, playheadPacing ×4, seek, seekStuck48D5, pauseSeekRecovery43Y2, pauseLoopGuard44Z2, reversePlayback, pauseDraw41W2, pauseSeekCap42X2) | **Tất cả xanh** |
| `tsc --noEmit` (apps/web) | **0 lỗi** (test mới đã thêm vào `exclude` của tsconfig theo đúng quy ước của repo — mọi `*.test.ts` đều nằm trong exclude) |
| `vite build` (apps/web) | **Pass** (28,62 s; cảnh báo chunk > 500 kB đã có từ trước) |
| Smoke app build trên WebKitGTK headless | **Pass** — app mount được, `rootChildren: 1`, canvas có, **0 console error** |
| Đo WebGL (timer query + FPS workload) | Đã đo cả 2 engine (xem §2); timer query vắng ở cả hai — ghi rõ là không đo được GPU-time, không bịa số |

**Chưa làm (nợ):** không có click-test editor đầy đủ trên
WebKitGTK trong đợt này (chỉ smoke mount) — chưa kiểm chứng
end-to-end rằng một clip thật trong timeline, khi element chạm
`ended` ở tick biên, được `restartEndedElement` cứu ngay trong
cùng tick; mới chỉ có unit test của hàm + probe của hành vi
trình duyệt. Nguyên nhân D không ổn định (§1) chưa xác định.
Safari thật vẫn chưa đo (cần máy macOS/iOS).

## 7. Nợ mở cho đợt sau

1. **Safari thật vẫn chưa đo** (nợ từ đợt 77): kiểm tra W3 có tái
   hiện trên Safari thật không — WebKitGTK kẹt loop chưa chắc
   Safari đã kẹt (media stack khác: GStreamer vs VideoToolbox).
2. **W3 trên clip D không ổn định** — cần đo lại khi load thấp và
   ổn định để xác định có phải do trạng thái decoder lúc wrap
   hay không.
3. **GPU-time thật vẫn chưa đo được** — timer query vắng trên cả
   hai engine ở VM này; cần máy có GPU thật (khi đó chạy lại
   đúng probe này: extension sẽ có, `failIfMajorPerformanceCaveat`
   vẫn tạo được context).
4. **Click-test editor đầy đủ trên WebKitGTK** (timeline thật +
   clip thật + phát tới cuối clip) để khóa end-to-end đường
   `restartEndedElement` trong syncMedia.
5. Sau reboot, cài lại dep WebKit (xem §5) trước khi đo.

## 8. Files (stage, KHÔNG push)

- Mới: `docs/PHASE9_ROUND80_H5_WEBKIT_LOOP_LIMITS.md` (file này).
- Mới: `apps/web/src/lib/webkitLoopRestart80H5.ts` — helper phục hồi ended.
- Mới: `apps/web/src/lib/webkitLoopRestart80H5.test.ts` — 11 check.
- Sửa: `apps/web/src/preview.tsx` — nối `restartEndedElement` vào syncMedia (nhánh forward).
- Sửa: `apps/web/tsconfig.json` — thêm test mới vào `exclude` (theo quy ước repo).
- Mới: `benchmarks/render/webkit_loop_probe_80h5.mjs` — probe loop 4 clip × 3 chế độ × 4 engine + WebGL (timer query + FPS workload), server HTTP đa luồng trong script, guard timeout wall-clock.
- Mới: `benchmarks/render/webkit_loop_retest_80h5.mjs` — kiểm tra lại clip D (2 lần × 3 chế độ).
- Mới: `benchmarks/results/webkit-loop-probe-80h5.json` — kết quả thô lượt chính.
- Không sửa production ngoài 2 file trên. Không binary. Không workflow.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round80-h5-webkit-loop.txt`.

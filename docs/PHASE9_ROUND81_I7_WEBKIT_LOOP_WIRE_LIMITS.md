# Phase 9 đợt 81 — I7: WebKit loop — nối workaround vào production (kiểm chứng)

Ngày: 10/11/2026, lượt cron 18:35 +07 (chạy 18:37–19:32 +07).
Repo `~/workspace/repo-1`. Đóng nợ đợt 80 §4.5 / H5 §7.4
("workaround đã nối vào production chưa, hay mới chỉ là module + test
độc lập?" + "click-test editor đầy đủ trên WebKitGTK").

**Kết luận ngắn:**
1. **Workaround ĐÃ NỐI vào production từ đợt 80 H5** — không phải
   chỉ module + test: `restartEndedElement` được gọi trong `syncMedia`
   (`apps/web/src/preview.tsx:2619`, import `:70`), nhánh forward,
   ngay trước `if (a.el.paused) void a.el.play()`, đếm như một lần
   re-seek lúc phát. Vòng này KHÔNG sửa production — chỉ kiểm chứng.
2. **Đường nối chạy thật trong app thật — chứng minh trên Chromium
   headed (W1 PASS, 2 lần chạy):** ép element video thật vào trạng
   thái `ended` giữa clip, `syncMedia` seek nó thẳng về target của
   timeline (không về 0), `__vcutSyncReseeksVideo` tăng 1, phát tiếp
   tục bình thường, 0 lỗi trang.
3. **Trên WebKitGTK headed, W1 đầy đủ KHÔNG chứng minh được trên VM
   này** — không phải vì đường nối sai mà vì 2 giới hạn của engine:
   (a) phát hiện mới **W5**: element video TÁCH DOM của preview
   không decode/không tiến `currentTime` trên WebKitGTK (0,000 suốt
   5 s, `totalVideoFrames` = 0); (b) **W6**: kể cả khi gắn element
   vào DOM, element tụt lại sau playhead và seek trên WebKitGTK mất
   hàng giây nên guard `!seeking` chặn phục hồi suốt cửa sổ đo.
   Bằng chứng tốt nhất trên WebKit: counter reseek tăng 3→4 với
   element hạ cánh ở đúng target timeline (9,112 ≈ 9,1) — phù hợp
   với đường nối hoạt động, nhưng không quy kết chắc chắn được
   (drift re-seek dùng chung counter và cùng target).
4. **Safari thật vẫn chưa đo** (không có máy macOS/iOS).
   WebKitGTK ≠ Safari thật — mọi kết luận WebKit dưới đây vẫn là
   WebKitGTK.

## 0. Máy đo lúc này (10/11/2026)

| Mục | Giá trị |
|---|---|
| CPU | AMD EPYC 9D25, **4 vCPU** (`nproc` = 4) |
| RAM | 7.934 MiB |
| Kernel | 7.0.0-44-generic |
| OS | Ubuntu 24.04.5 LTS |
| FFmpeg | 8.1.2 |
| Chromium | 158.0.8127.18 full build (`chromium-1254`), headed dưới `xvfb-run` |
| WebKit | 27.2 (`webkit-2388`), headed dưới `xvfb-run` |
| Playwright | `playwright-core 1.65.0` (`/home/hatch/scratch-round63-r4/node_modules/`) |
| **Load lúc đo** | **6–12** — các luồng đợt 81 khác chạy song song; mọi số timing tuyệt đối mang caveat đó |
| VM | **Reboot trước lượt này** (uptime lúc bắt đầu ~18 phút) — dep apt cho WebKit đã mất, xem §5 |

## 1. Đã nối vào production chưa? — ĐÃ NỐI (đọc code, không đoán)

`apps/web/src/preview.tsx` (nhánh forward của `syncMedia`, sau khối
drift re-seek, trước `play()`):

```ts
if (restartEndedElement(a.el, a.target)) {
  syncReseekCount++;
  if (a.el.tagName === "VIDEO") syncReseekVideoCount++;
  else syncReseekAudioCount++;
}
if (a.el.paused) {
  void a.el.play().catch(() => { /* ... */ });
}
```

- Chỉ kích hoạt khi element thật sự `ended` và không `seeking`
  (guard trong `webkitLoopRestart80H5.ts`), seek thẳng tới `a.target`
  (vị trí timeline, không phải 0), rồi để `play()` sẵn có resume
  trong cùng tick. Áp cho cả VIDEO và AUDIO (cùng code path).
- **Không** giới hạn riêng WebKit: helper là engine-agnostic theo
  thiết kế H5 (seek tới target + play là đúng trên mọi engine;
  Chromium cũng hưởng lợi thay vì play-từ-0 rồi re-seek). Nhiệm vụ
  luồng này có gợi ý "chỉ kích hoạt trên WebKit" — quyết định giữ
  nguyên thiết kế H5 vì: (a) nhánh chỉ bắn khi element đã `ended`
  (hiếm, tick biên), không chạm đường phát thường; (b) kiểm chứng
  headed dưới đây cho thấy trên Chromium nó bắn đúng 1 lần rồi phát
  tiếp bình thường, không hồi quy. Không đổi code production trong
  vòng này.
- Nhánh reverse không nối (đã tự khỏi bằng step-seek, theo H5 §4.3).
- Không dùng thuộc tính `loop` ở đâu (grep `apps/web/src`: không có
  `.loop =` / `loop:` trong code production) — chính nó là thứ kẹt
  (W3).
- `preview.tsx` là file chung: vòng này KHÔNG sửa nó (đã nối từ H5),
  nên batch stage không chứa file chung nào.

## 2. Kiểm chứng headed trong app thật

Harness mới: `apps/web/scripts/clicktest-81i7-webkit-loop-wire.mjs`
(vite dev HMR tắt + WebKit/Chromium headed qua Xvfb + Playwright;
project 1 clip video H.264 thật import qua `importFiles`, phát bằng
phím Space thật; trạng thái `ended` được ép bằng ghi đè getter trên
instance của element thật — chỉ để kích hoạt đúng nhánh production,
vì `ended` tự nhiên chỉ xảy ra ở tick biên hiếm gặp).

### 2.1 W1 — wiring: ép `ended` giữa clip (lượt chạy cuối, clip 10 s)

| Engine | Trước khi ép | Trong cửa sổ ép (6 s) | Sau khi gỡ | Verdict |
|---|---|---|---|---|
| Chromium headed | playhead 1,533, ct 1,772, reseeksVideo 1 | reseeksVideo **1→2**, ct snap về đúng target 2,4 = playhead | playhead 3,067→4,367, ct 4,367, playing=true, 0 lỗi | **PASS** |
| WebKitGTK headed | playhead 9,1, ct 9,1, reseeksVideo 3 (đồng bộ ở đuôi clip — xem §2.3) | reseeksVideo **3→4**, ct hạ cánh 9,112 ≈ target 9,1 | playhead 10→10 (hết clip), ct 9,112, playing=false, 0 lỗi | **KHÔNG KẾT LUẬN** (counter tăng + hạ cánh đúng target, nhưng không quy kết chắc chắn — xem §2.3) |

Chi tiết Chromium (trace mẫu trong report JSON): ct chạy trước
playhead (1,802 → 2,403 trong lúc playhead đứng 1,533 — đồng hồ
element nhanh hơn playhead), tới t=0,89 s ct snap về 2,4 =
playhead (`seeking: true`), counter tăng 1→2 ở t=1,38 s. Đây đúng
là chữ ký của `restartEndedElement`: seek về target timeline ngay
trong tick sau `ended`, không về 0, rồi phát tiếp. Lần chạy trước
(clip 4 s) cho cùng chữ ký: reseeksVideo 1→2, ct về target, phát
tiếp bình thường. **Đường nối chạy thật trong app thật.**

### 2.2 W2 — phát tự nhiên trọn clip 10 s (quan sát, không ép)

| Engine | Kết quả |
|---|---|
| Chromium headed | PASS — playhead tới 10, reseek tự nhiên Δ=4, 0 lỗi |
| WebKitGTK headed | PASS — playhead tới 10, reseek tự nhiên Δ=3, 0 lỗi |

W2 chỉ quan sát (reseek tự nhiên có thể là drift re-seek, không
dùng để chứng minh đường nối). Cả hai engine đều phát trọn clip
không lỗi trang — với lưu ý WebKit cần gắn element vào DOM (W5,
xem §3), nếu không thì đứng hình.

### 2.3 Vì sao W1 trên WebKitGTK không PASS sạch được

Ba lần chạy WebKit, ba kiểu kẹt khác nhau — cùng một gốc: element
trên WebKitGTK tụt lại sau playhead và seek mất hàng giây.

1. **Lượt 1 (clip 4 s):** ép ở playhead 3,5 (ct 2,151, đã lệch
   1,35 s); playhead chạm 4 (hết clip) chỉ sau ~0,5 s nên cửa sổ
   đo đóng trước khi restart kịp bắn; reseeksVideo đứng yên 1.
2. **Lượt 2 (clip 10 s):** ép ở playhead 2,2 (ct 1,7); element
   `seeking: true` suốt cửa sổ 2,5 s (drift seek đang bay) nên
   guard `!seeking` chặn restart; reseeksVideo đứng yên 2. Mẫu
   trace chỉ thu được 2 mẫu trong 2,5 s — mỗi `page.evaluate`
   mất ~1,5 s trên main thread WebKitGTK đang tải.
3. **Lượt 3 (clip 10 s, chờ đồng bộ 8 s):** vòng chờ đồng bộ đốt
   hết clip (playhead 0→10) trước khi ép — element không bao giờ
   đồng bộ được dưới tải (xem W6 §4); ép ở playhead 9,1, counter
   tăng 3→4, ct hạ cánh 9,112.
4. **Lượt cuối (cả 2 engine, clip 10 s):** WebKit như lượt 3
   (counter 3→4, hạ cánh đúng target 9,112); Chromium PASS sạch.

Đọc đúng: counter tăng + hạ cánh đúng target là **phù hợp** với
`restartEndedElement` đã bắn, nhưng drift re-seek dùng chung
counter `syncReseekVideoCount` và cùng target nên không quy kết
chắc chắn được từ bên ngoài. Muốn quy kết chắc chắn cần một trong
hai: (a) counter riêng cho đường restart (sửa production — để đợt
sau quyết, không làm trong vòng verify-only này); (b) đo trên máy
WebKitGTK không tải, nơi seek hoàn tất trong ~100 ms và element
giữ đồng bộ được.

## 3. Phát hiện mới W5 — element video TÁCH DOM không phát được trên WebKitGTK

Trong lần chạy WebKit đầu tiên, element trong app kẹt ở
`currentTime` 0,067 dù `paused=false`, `readyState=4`, playhead
vẫn chạy — app dùng `MediaPool.videoFor` tạo element nhưng KHÔNG
gắn vào document (chỉ làm nguồn cho canvas `drawImage`).
Probe tách riêng (`benchmarks/render/webkit_detached_probe_81i7.mjs`,
clip H.264 640×360 4 s, kết quả thô
`benchmarks/results/webkit-detached-probe-81i7.json`):

| Engine / chế độ | currentTime 10 mẫu / 5 s | totalVideoFrames | Kết quả |
|---|---|---|---|
| WebKitGTK headed, **tách DOM** | **0,000 × 10** | **0 × 10** | Không tiến, không decode frame nào, dù `paused=false`, `readyState=4` |
| WebKitGTK headed, **gắn DOM** (160×90) | 0,5 → 4,0 realtime | 10 → 40 | Phát tới `ended=true` bình thường |
| Chromium headed, tách DOM | 0,51 → 4,0 realtime | (không đo) | Phát bình thường |
| Chromium headed, gắn DOM | 0,503 → 4,0 realtime | (không đo) | Phát bình thường |

**W5: trên WebKitGTK headed, `<video>` tách DOM không advance
`currentTime` và không decode frame.** Đây là giới hạn của engine
+ cách app dùng element, không phải lỗi clip hay lỗi mạng (cùng
clip, cùng trang, element gắn DOM phát được ngay). Hệ quả: preview
video của app trên WebKitGTK đứng hình ở frame seek đầu tiên nếu
không gắn element vào DOM — nặng hơn W3 (loop kẹt) vì W3 chỉ đánh
khi loop, còn W5 đánh mọi lần phát.

**Không sửa trong vòng này** (verify-only theo nhiệm vụ; gắn
element pool vào DOM là thay đổi hành vi render — `presentedFps.ts`
đã ghi rõ "muốn đo presented thật phải gắn element vào DOM (dù
1×1 px) — thay đổi hành vi render, để đợt sau quyết"). Harness
của vòng này vượt qua W5 bằng can thiệp test-only: gắn element
thật của pool vào DOM (2×2 px góc trang) sau khi nó sẵn sàng —
không đổi code production. **Nợ mới cho đợt sau: quyết có gắn
element pool vào DOM (1×1/2×2 px, ẩn) để preview chạy được trên
WebKitGTK hay không, kèm đo lại tác động lên `presentedFps` /
`totalVideoFrames`.**

## 4. Phát hiện mới W6 — WebKitGTK: element tụt lại + seek chậm thành vòng luẩn quẩn

Qua 4 lần chạy WebKit headed (clip 640×360 và 320×180, tải VM
6–12): element luôn tụt sau playhead 0,5–1,35 s; drift re-seek
phát ra thì `seeking: true` kéo dài hàng giây; trong lúc seek thì
element không phát nên càng tụt — vòng luẩn quẩn khiến element
không bao giờ bắt kịp playhead trong clip 10 s (ct cuối 5,3–5,9
trong khi playhead đã 10 ở lượt chờ đồng bộ; chỉ khi playhead
chạm cuối clip thì element mới "bắt kịp" do không còn target mới).
Trên Chromium cùng clip, element giữ đồng bộ (ct ≈ playhead ±
0,4 s) và seek hoàn tất trong < 1 s.

Caveat: đo dưới tải VM cao (các luồng đợt 81 khác chạy song
song); chưa tách được bao nhiêu phần là do tải, bao nhiêu là do
WebKitGTK intrinsic (G8 đã đo canvas 2D trên WebKitGTK chậm hơn
Chromium ~5–6× ngay cả khi không tải). Ghi là **quan sát dưới
tải**, không claim "WebKitGTK luôn chậm hơn X lần".

## 5. Sự cố môi trường trong lượt này (ghi để đợt sau khỏi mất giờ)

VM **reboot** trước lượt này (uptime lúc bắt đầu ~18 phút): toàn
bộ package apt cho WebKit đã biến mất khỏi `/usr` (giống H5 §5).
Lần này khắc phục nhanh hơn H5 nhờ cache:

1. `os-intent replay` của hệ thống đang chạy `apt-get update` rất
   chậm (mirror ~131 kB/s, > 25 phút chưa xong) — không chờ nó.
2. Cả 29 gói WebKit còn thiếu đều có sẵn `.deb` trong
   `/var/cache/apt/archives/` (161 file) → cài trực tiếp bằng
   `sudo dpkg -i /var/cache/apt/archives/*.deb` (lặp 1 lần là đủ,
   `WEBKIT_DEPS_OK`: libgtk-4-1, libgstreamer1.0-0,
   gstreamer1.0-plugins-good đều `installed`, 0 gói dở dang).
   Cách này không cần apt index nên không bị kẹt sau `apt-get
   update` đang chạy.
3. `MediaRecorder` vẫn `undefined` trên WebKitGTK (xác nhận lần 4,
   sau G8 W1) — vì vậy harness không dùng `loadSample()` (sẽ rơi
   về clip ảnh tĩnh PNG) mà import clip H.264 thật qua
   `importFiles` (xem §6).

**Bài học cho đợt sau:** sau reboot, chạy `dpkg -i
/var/cache/apt/archives/*.deb` trước khi đo WebKit (nhanh hơn chờ
replay); nếu cache trống thì mới chờ `apt-get update` của replay.
Các package apt này không bền qua reboot/replacement.

## 6. Kiểm chứng đợt này

| Kiểm chứng | Kết quả |
|---|---|
| Đọc code đường nối (`preview.tsx:2619`, import `:70`, forward branch) | **ĐÃ NỐI từ H5** — vòng này không sửa production |
| Unit test `webkitLoopRestart80H5.test.ts` | **11/11 xanh** |
| Hồi quy preview liên quan (12 file: previewLoop50F2, playheadPacing ×4, seek, seekStuck48D5, pauseSeekRecovery43Y2, pauseLoopGuard44Z2, reversePlayback, pauseDraw41W2, pauseSeekCap42X2) | **Tất cả xanh** |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `vite build` (apps/web) | **Pass** (26,47 s; cảnh báo chunk > 500 kB đã có từ trước) |
| Headed Chromium W1 (wiring, clip 4 s + clip 10 s) | **PASS cả 2 lần** — reseeksVideo +1, seek về đúng target timeline, phát tiếp bình thường, 0 lỗi trang |
| Headed Chromium W2 (phát tự nhiên 10 s) | **PASS** — tới cuối, reseek tự nhiên Δ=4, 0 lỗi |
| Headed WebKitGTK W1 (wiring) | **KHÔNG KẾT LUẬN** — counter +1 và hạ cánh đúng target ở lượt cuối, nhưng không quy kết chắc chắn (xem §2.3); các lượt trước bị chặn bởi W5/W6 |
| Headed WebKitGTK W2 (phát tự nhiên 10 s) | **PASS** (cần gắn element vào DOM vì W5) — tới cuối, reseek tự nhiên Δ=3, 0 lỗi |
| Probe W5 tách DOM vs gắn DOM (2 lượt) | **Xanh** — `benchmarks/render/webkit_detached_probe_81i7.mjs`, kết quả thô `benchmarks/results/webkit-detached-probe-81i7.json` |
| WebKit launch sau reboot | Launch được sau khi cài lại dep từ cache (xem §5); `MediaRecorder: undefined` |

**Chưa làm (nợ):** W1 PASS sạch trên WebKitGTK (cần counter riêng
cho đường restart hoặc máy không tải — xem §2.3); quyết định gắn
element pool vào DOM (W5 §3); Safari thật vẫn chưa đo; W6 chưa tách
tải vs intrinsic.

## 7. Nợ mở cho đợt sau (cập nhật W3/W4 + mới)

1. **W1 WebKitGTK chưa PASS sạch** — cần counter riêng cho đường
   `restartEndedElement` (sửa production, đếm riêng khỏi drift
   re-seek) hoặc đo lại trên máy WebKitGTK không tải.
2. **W5 — preview video đứng hình trên WebKitGTK do element tách
   DOM không decode** (mới, nặng hơn W3): quyết có gắn element
   pool vào DOM (1×1/2×2 px) không; đo lại tác động lên
   `presentedFps`/`totalVideoFrames` sau khi gắn.
3. **W6 — element tụt + seek chậm thành vòng luẩn quẩn trên
   WebKitGTK dưới tải** (mới): đo lại khi tải thấp để tách tải vs
   intrinsic; nếu intrinsic thì cân nhắc giảm tần suất drift
   re-seek trên WebKit.
4. **Safari thật vẫn chưa đo** (nợ từ đợt 77): kiểm tra W3/W5 có
   tái hiện trên Safari thật không — WebKitGTK kẹt chưa chắc
   Safari đã kẹt (media stack khác: GStreamer vs VideoToolbox).
5. **W3 trên clip D (720p) không ổn định** (nợ H5 §7.2) — vẫn mở.
6. **W4 nhãn WebGL "Apple GPU" giả** (nợ G8/H5) — vẫn mở, không đo
   lại trong vòng này; không có GPU thật trên VM.
7. **GPU-time thật vẫn chưa đo được** (nợ H5 §7.3) — timer query
   vắng trên cả hai engine ở VM này; cần máy có GPU thật.

## 8. Files (stage, KHÔNG push)

- Mới: `docs/PHASE9_ROUND81_I7_WEBKIT_LOOP_WIRE_LIMITS.md` (file này).
- Mới: `apps/web/scripts/clicktest-81i7-webkit-loop-wire.mjs` — harness headed W1/W2 (WebKit + Chromium, vite dev HMR tắt, clip H.264 thật qua importFiles, ép `ended` bằng ghi đè getter, gắn element vào DOM test-only vì W5).
- Mới: `benchmarks/render/webkit_detached_probe_81i7.mjs` — probe W5 tách DOM vs gắn DOM.
- Mới: `benchmarks/results/webkit-detached-probe-81i7.json` — kết quả thô 2 lượt probe W5.
- Không sửa production (preview.tsx đã nối từ H5; vòng này verify-only). Không binary. Không workflow.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round81-i7-webkit-loop-wire.txt` — 4 entry, verify read-back 4/4.
- Bằng chứng headed (không stage, ở hidden_files): `hidden_files/round81-i7/headed/i7-webkit-loop-wire-report.json` (report lượt cuối cả 2 engine) + 4 screenshot `i7-*-w1/w2.png` + `i7-run.log`.
- Không stage: clip mp4 trong `/tmp/round81-i7/` (tạo lại bằng ffmpeg khi cần: `testsrc2` 640×360/320×180, 10 s, libx264 — xem §5), config vite tạm (script tự tạo + tự xóa trong `apps/web/`).

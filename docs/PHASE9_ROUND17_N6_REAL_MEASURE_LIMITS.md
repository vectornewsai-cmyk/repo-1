# Phase 9 đợt 17, luồng N6 — đo thật: footage thật + FPS canvas (LIMITS trung thực)

> Đợt 17, luồng N6. Luật cứng đã giữ: KHÔNG push GitHub, KHÔNG release/tag,
> KHÔNG code giả, KHÔNG sửa code sản phẩm, KHÔNG sửa harness cũ, KHÔNG tải
> binary về repo, KHÔNG ghi paths-loop, KHÔNG ghi build-loop-log (parent gộp).
> Chỉ tạo 2 script đo mới + tài liệu này. Máy đo: VM 2 vCPU, RAM 7,7 GiB,
> FFmpeg 8.1.2, /tmp 512MB (cuối đợt còn trống 504MB).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

| Nợ đợt 16 | Kết quả đợt 17 N6 | Trạng thái |
|---|---|---|
| FPS canvas trình duyệt thật chưa đo | **CHƯA ĐO ĐƯỢC headed** (blocker §1, có bằng chứng). Đã đo được vòng video decode thật + ghost trên headless Playwright Chromium 156 (§2) | MỞ — cần chạy trên máy có GPU/màn hình thật hoặc từ main chat |
| Footage máy quay thật chưa đo | **KHÔNG TỒN TẠI trong repo** (kiểm tra bằng mắt 3 file mp4 lớn nhất — đều là test pattern). Đã đo thay bằng nguồn phức tạp + chuyển động (§3) | MỞ vĩnh viễn cho tới khi có footage thật license sạch; KHÔNG tải video ngoài về vì license không sạch |
| Badge preview–render trên nội dung phức tạp/chuyển động | KHỚP cả 6 ô transition + 2 effect ở mức mô hình rgb24; yuv420p e2e vẫn LỆCH | KHÔNG đổi phạm vi badge (vẫn "matched ở mức mô hình xfade rgb24") |

## 1. FPS canvas trình duyệt thật: BLOCKER — headed Chrome không mở cổng CDP trên VM này

### 1.1. Đã thử những gì (đều thất bại ở bước mở cổng, không phải ở bước đo)

- Xvfb :99 (1920×1080x24) lên bình thường (socket `/tmp/.X11-unix/X99` có).
- Headed `/opt/meta-chromium/chrome` 152 (không `--disable-gpu`): tiến trình
  sống (~200MB RSS, zygote chạy), log chỉ có lỗi dbus vô hại, nhưng sau
  70+ giây vẫn KHÔNG có socket nghe ở cổng debug, KHÔNG có dòng
  "DevTools listening", thư mục profile không tiến triển.
- Headed `/opt/meta-chromium/chrome` 152 với `--disable-gpu`: kết quả y hệt
  sau 35+ giây.
- Headed Playwright `chromium-1248` 156 dưới Xvfb: tiến trình sống
  (~163MB RSS) nhưng sau 60 giây vẫn không có `/json/version`.
- Đối chứng: cùng 2 binary đó chạy `--headless=new` thì cổng CDP mở trong
  < 1 giây. Vậy lỗi không phải ở binary hay ở Xvfb, mà ở chế độ headed
  trên VM này (giả thuyết: headed kẹt ở bước khởi tạo cửa sổ/compositor
  khi không có GPU và dbus — CHƯA chứng minh, chỉ là giả thuyết).
- Dev server KHÔNG phải blocker: vite dev lên ở `localhost:5199` trong
  445ms và curl trả HTML bình thường. Blocker nằm ở phía headed Chrome,
  không phải ở phía dev server.
- Hướng gỡ tiếp theo (cho parent/main chat, KHÔNG làm trong luồng này):
  thử `--remote-debugging-pipe` (transport qua pipe thay vì cổng HTTP),
  hoặc chạy đo headed trên máy thật của user / từ main chat nơi có
  trình duyệt thật. Tuyệt đối không trích số headless dưới đây thành
  "FPS trình duyệt thật".

### 1.2. Bẫy thứ hai đã gỡ: binary meta 152 chặn localhost (LNA)

- `/opt/meta-chromium/chrome` 152 trả `ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`
  khi navigate tới `localhost`/`127.0.0.1`, dù thử cả: `Target.createTarget`
  với URL trực tiếp, initial page target kiểu C3, hostname `localhost`,
  flag `--disable-features=LocalNetworkAccessChecks`. Đây là lý do 2 lần
  chạy đầu vòng video fail với "URL safety check" (page rớt về
  `chrome-error://chromewebdata/`, origin opaque).
- Playwright chromium 156 navigate `localhost` bình thường (đúng binary C3
  dùng). Vì vậy script đo mặc định dùng binary Playwright; nếu ai chạy
  script với `CHROME_BIN=/opt/meta-chromium/chrome` thì vòng video sẽ fail
  như đã ghi — đó là giới hạn của binary, không phải của phương pháp.
- Bẫy thứ ba đã gỡ: `canPlayType` báo "probably" cho cả vp8 lẫn h264, nhưng
  video vẫn fail khi page chưa navigate xong — phải chờ `location.href`
  đúng `http://localhost:<port>/` rồi mới tạo `<video>`.

## 2. FPS canvas: số đo headless (ghi rõ phạm vi — KHÔNG phải FPS trình duyệt)

Script: `server/render/src/test_v17_headed_fps.mjs` (tự bật/tắt Xvfb +
Chrome + HTTP server; video transcode VP8 5 giây trong /tmp, không vào repo).
Phương pháp: throughput vòng rAF 3 giây/case (như H4 — thời gian gọi
drawImage ≈ 0ms nên không trích ms/draw). Ghost video: mỗi frame present vẽ
1 frame video live + (N-1) snapshot chụp từ video (chi phí drawImage mỗi
frame là thứ được đo; snapshot tĩnh hay cửa sổ trượt không đổi chi phí vẽ).
Video decode thật = file `mcp-server/renders/agent-demo.mp4` transcode sang
VP8 (ghi rõ: nội dung file này là smptebars + chữ + hình tổng hợp, KHÔNG
phải footage máy quay — nó chỉ đóng vai "video decode thật").

### 2.1. Chromium 156 headless (Playwright) — 2 lần chạy, ổn định

| Case (rAF throughput, 3s) | Lần 1 | Lần 2 | Ghi chú |
|---|---|---|---|
| rAF trống | 60,63 | 60,28 | Trần rAF ≈ 60 |
| Pattern 1080p f1 (không ghost) | 59,34 | 59,10 | |
| Pattern 1080p f3 | 57,40 | 59,51 | |
| Pattern 1080p f8 | 51,60 | 57,81 | |
| Video 720p f1 (live decode) | 58,26 | 60,62 | dropped 0, total ~90 |
| Video 720p f3 | 56,51 | 58,66 | dropped 0, total ~91 |
| Video 720p f8 | 54,72 | 57,27 | dropped 0, total ~90 |
| GPU renderer string | ANGLE Vulkan SwiftShader | (như lần 1) | Vẫn là raster phần mềm |

Đọc kết quả: trên Chromium 156 headless, ghost f8 KHÔNG sụp — mọi case đều
quanh 52–61 fps, video decode không rớt frame nào. Đây là số đo engine thật
trong môi trường headless/SwiftShader, KHÔNG phải FPS preview của user
(không có UI/timeline, không có màn hình thật, không có GPU thật).

### 2.2. Đối chứng: Chromium 152 headless (meta) — 3 lần chạy, phương sai lớn

| Case | Lần 1 | Lần 2 | Lần 3 |
|---|---|---|---|
| rAF trống | 53,53 | 55,98 | 57,55 |
| Pattern 1080p f1 | 24,66 | 41,66 | 54,40 |
| Pattern 1080p f3 | 15,64 | 31,29 | 40,62 |
| Pattern 1080p f8 | 7,91 | 11,97 | 21,99 |

Đọc kết quả — và cảnh báo trích dẫn:
1. **Số f8 "sụp xuống một chữ số" của H4 KHÔNG phải kết luận chung.**
   Trên 152 nó tái tạo (7,9–22,0), nhưng trên 156 cùng máy, cùng phương pháp,
   f8 đạt 51,6–57,8. Chênh lệch binary/phiên bản lớn hơn chênh lệch do
   ghost. Ai trích "ghost f8 = 7 fps" mà không kèm binary 152 + điều kiện
   tải VM là trích sai phạm vi.
2. **Số 152 dao động gấp đôi giữa các lần chạy** (f1: 24,7 → 54,4) nên
   không được trích một con số duy nhất cho 152; chỉ được trích khoảng.
   Dao động này nhiều khả năng do tải nền VM 2 vCPU (chưa chứng minh bằng
   thực nghiệm đối chứng tải — ghi là giả thuyết).
3. Vì vậy kết luận duy nhất đứng vững sau đợt này: **FPS canvas ghost phụ
   thuộc mạnh vào binary/phiên bản Chromium và tải máy; cần đo trên GPU
   thật + trình duyệt thật mới có số dùng được cho user.** Số headless ở
   đây chỉ có giá trị đối chứng hồi quy (chạy lại script này sau này mà
   thấy f8 tụt thì mới là hồi quy).

## 3. Nguồn phức tạp + chuyển động: parity KHỚP ở rgb24, yuv420p vẫn LỆCH

Script: `server/render/src/test_v17_complex_parity.js` (phương pháp khớp H6:
xfade duration=1 offset=1, frame 45 @30fps, p=0,5, preview từ module thật +
`harnessShared.js`, thang V6).

### 3.1. Nguồn X "complex" — nói rõ nó phức tạp ở trục nào (và trục nào KHÔNG)

- X = ảnh tổng hợp bằng Node: gradient + nhiễu fractal value-noise 5 octave
  + hạt mịn + cạnh sắc (checker, khối, đường chéo). Master 1600×900, tĩnh
  lấy crop giữa 1280×720.
- M = cùng ảnh X nhưng cửa sổ crop 1280×720 trượt tuyến tính trong 2 giây
  (A xuôi 0→320/0→180, B ngược lại) — nội dung CHUYỂN ĐỘNG thật trong lúc
  transition; frame A lấy đúng n=45 (t=1,5), frame B đúng n=15 (t=0,5) bằng
  cùng filter chain của render.
- Chỉ số độ phức tạp (std kênh / diff ngang TB / %pixel diff>32), đo cùng
  phương pháp cho cả X và P của H6:

| Nguồn | std | diff ngang TB | %diff>32 |
|---|---|---|---|
| X-A complex (hạt ±25) | 47,3 | 16,25 | 12,24% |
| X-B complex (hạt ±25) | 40,7 | 16,51 | 12,74% |
| H6 P-A (gradient + noise alls=18) | 108,2 | 85,53 | 60,32% |
| H6 P-B | 112,9 | 86,07 | 60,55% |

- **Trung thực:** X KHÔNG "phức tạp hơn" P trên trục nhiễu trắng từng
  pixel — noise `alls=18` của H6 mạnh hơn hẳn (diff ngang 85 so với 16).
  Lần chạy đầu của X (hạt ±12) còn thấp hơn nữa (diff ngang 8,0). Giá trị
  thật của X nằm ở 2 trục mà P không có: (a) cấu trúc đa tầng
  (fractal 5 octave + cạnh sắc, thay vì gradient phẳng + khối), và
  (b) CHUYỂN ĐỘNG (nguồn M). Kết luận parity dưới đây vì vậy là kết hợp:
  mô hình đứng vững cả trên nội dung cấu trúc + chuyển động (X/M) lẫn trên
  nội dung nhiễu trắng cực mạnh (P của H6) — không phải "X khó hơn P" trên
  mọi trục.
- Footage máy quay thật: vẫn là giới hạn mở. Không tải video ngoài về vì
  license không sạch (luật luồng). Ảnh chụp thật / footage thật vẫn cần
  nguồn license sạch (do user cung cấp hoặc quay mới) mới đo được tiếp.

### 3.2. Kết quả parity (1280×720, rgb24, p=0,5)

| Nguồn | dissolve MAD / ≤8 | circleopen MAD / ≤8 | wipeleft MAD / ≤8 | Hạng |
|---|---|---|---|---|
| X tĩnh | 0,0027 / 100,00% | 0,4855 / 100,00% | 0,0000 / 100,00% | KHỚP, KHỚP, KHỚP |
| M chuyển động | 0,0029 / 100,00% | 0,4937 / 100,00% | 0,0000 / 100,00% | KHỚP, KHỚP, KHỚP |
| X tĩnh, effect mirror (hflip) | 0,0000 / 100,00% | — | — | KHỚP |
| X tĩnh, effect pixelate t=0,43 (k=8) | 0,1293 / 99,80% | — | — | KHỚP |
| X tĩnh yuv420p-e2e, dissolve | 18,5792 / 43,95% | — | — | LỆCH |

Đọc kết quả:
- Chuyển động KHÔNG làm đổi hạng: M khớp gần như hệt X tĩnh ở cả 3 type
  (dissolve 0,0029 vs 0,0027; circleopen 0,4937 vs 0,4855; wipeleft 0 tuyệt
  đối) — căn thời gian A(t=1,5)/B(t=0,5) đúng, crop trượt không phá mô hình.
- Circleopen ~0,49 (cao hơn 0,28 của P-H6, 0,39 của lavfi-H6) nhưng vẫn cách
  ngưỡng 2 hơn 4 lần — đây là sàn lượng tử hoá của circle trên nội dung
  chi tiết, không phải lỗi đường cong (đã chẩn đoán kiểu này ở H6 §2.3).
- Mirror khớp tuyệt đối (0,0000) như kỳ vọng của hflip; pixelate k=8
  (chia hết 1280×720) khớp 0,1293 / 99,80% — dư lượng nhỏ ở biên khối,
  không đủ đổi hạng.
- yuv420p e2e trên X vẫn LỆCH (18,58 / 43,95%), nhẹ hơn P-H6 (50,6) vì X
  mịn hơn P ở trục nhiễu trắng — nhưng vẫn LỆCH nên **phạm vi badge giữ
  nguyên "matched ở mức mô hình xfade rgb24", không mở sang yuv420p**.

## 4. Kiểm chứng đã chạy

- `node --check` cho cả 2 script mới: pass.
- FPS script chạy trọn vẹn 2 lần trên Playwright 156 (log
  `/tmp/n6-headed-fps4.log`, `/tmp/n6-headed-fps5.log`) + 3 lần trên
  meta 152 trước khi đổi binary (log `n6-headed-fps*.log`).
- Probe chẩn đoán (chỉ /tmp, không vào repo): video codec/origin
  (`n6-videoprobe.mjs`), navigate LNA trên 2 binary (`n6-navprobe*.mjs`),
  vite dev (`n6-vite.log`).
- Parity script chạy trọn vẹn 2 lần (lần 1 hạt ±12, lần 2 hạt ±25 — số
  §3.2 là lần 2; lần 1: dissolve 0,0027, circleopen 0,4859, wipeleft 0,
  mirror 0, pixelate 0,0760, yuv 18,53 — hạng không đổi, chỉ pixelate
  nhích 0,076 → 0,129 theo hạt).
- KHÔNG chạy tsc/vite build (không sửa code sản phẩm hay code TS nào —
  2 script chỉ transpile module TS sang /tmp để đo, như mẫu H6).
- KHÔNG chạy click-test editor thật (nằm trong blocker headed §1).

## 5. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `server/render/src/test_v17_headed_fps.mjs` (MỚI — FPS canvas: headed
  Xvfb + đối chứng headless, pattern 1080p + video decode 720p, rAF 3s)
- `server/render/src/test_v17_complex_parity.js` (MỚI — parity nguồn
  phức tạp + chuyển động: dissolve/circleopen/wipeleft, mirror, pixelate,
  yuv420p e2e, kèm chỉ số độ phức tạp so với H6 P)
- `docs/PHASE9_ROUND17_N6_REAL_MEASURE_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để đối chiếu):
log đo `/tmp/n6-headed-fps*.log`, `/tmp/n6-complex*.log`, `/tmp/n6-vite.log`,
probe `/tmp/n6-videoprobe.mjs`, `/tmp/n6-navprobe*.mjs`, webm transcode
`/tmp/n6-agent-demo.webm` (script tự tạo lại nếu thiếu), frame kiểm tra
bằng mắt `/tmp/n6/agent-demo-f5.png`, `/tmp/n6/keyframe-f2.png`,
`/tmp/n6/wipes-f2.png`. Không tạo file binary nào trong repo. Không push,
không tag/release.

## 6. Nợ còn lại (trung thực — cho đợt sau)

- FPS trên GPU thật + màn hình thật + toàn bộ preview editor vẫn chưa đo:
  headed CDP bị chặn trên VM này (§1); số headless 2 binary ở §2 chỉ là
  đối chứng, không thay thế được.
- Footage máy quay thật / ảnh chụp thật license sạch vẫn chưa có, chưa đo.
  Kết luận parity hiện chỉ bao quát: nội dung tổng hợp (lavfi, P nhiễu
  trắng, X cấu trúc, M chuyển động) ở mức mô hình rgb24.
- Pixelate còn dư lượng nhỏ (0,13, 0,20% pixel > 8) chưa truy nguyên tới
  cùng — có thể là làm tròn biên khối; không đổi hạng nên để lại.
- Phương sai số 152 giữa các lần chạy chưa chẩn đoán nguyên nhân (giả
  thuyết tải nền VM, chưa chứng minh).
- Yuv420p e2e vẫn LỆCH trên mọi nguồn đã đo — badge không mở sang yuv420p.

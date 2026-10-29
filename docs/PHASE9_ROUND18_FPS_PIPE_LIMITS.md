# Phase 9 đợt 18 — FPS headed qua `--remote-debugging-pipe` — LIMITS

Chủ đề: đóng nợ đợt 17 — đo FPS canvas trình duyệt thật bằng hướng mới
`--remote-debugging-pipe` (thay cho cổng CDP TCP vốn không bao giờ mở
được trên VM này). KHÔNG push, KHÔNG release/tag, KHÔNG sửa code sản phẩm.

## Kết luận ngắn

- **Blocker cổng CDP TCP của đợt 17 đã vượt được bằng pipe.** Chrome 156
  headed dưới Xvfb trả lời CDP qua fd 3 (ghi, JSON + byte NUL) / fd 4
  (đọc, tách bằng byte NUL). Probe /tmp xác nhận trước khi viết script.
- **FPS canvas headed thật ĐÃ đo được — nhưng chỉ cho đường vẽ ghost
  trên trang tối giản.** Kết quả sạch (trang tối giản, tiến trình mới):
  ghost 1080p f8 đạt ~55–59 fps, tức gần mức khóa vsync 60 Hz của
  Xvfb — **không sụp** như kết luận headless H4 của đợt 16. Kết luận
  "ghost f8 sụp" chỉ đúng cho headless binary 152, không phải kết luận
  chung cho trình duyệt headed.
- **KHÔNG có số FPS editor thật.** Vòng vite preview cho số thấp bất
  thường (1080p mọi số frame đều ~11 fps, kể cả f1) nhưng đó là nhiễu
  composite của trang editor + canvas phủ trên raster phần mềm của VM,
  không phải FPS preview của editor, không được trích thành "VCut chạy
  11 fps". Xem mục "Vì sao số vitePreview không dùng được".

## Script mới

- `apps/web/scripts/measure-headed-fps-pipe.mjs` (script mới, không sửa
  script đợt 16/17). Tự bật/tắt Xvfb `:99` (1920x1080x24), Chrome headed,
  HTTP server bench, và `vite preview` của build thật `apps/web/dist`.
- Lệnh chạy (từ gốc repo):
  - `node apps/web/scripts/measure-headed-fps-pipe.mjs` (cả 2 vòng)
  - `PIPE_ONLY=minimal node apps/web/scripts/measure-headed-fps-pipe.mjs`
  - `PIPE_ONLY=vitePreview node apps/web/scripts/measure-headed-fps-pipe.mjs`
  - Biến `PIPE_CHROME_BINS` đổi danh sách binary (mặc định Playwright
    Chromium 156 trước, meta-chromium 152 sau; script dừng ở binary đầu
    tiên đo được nên vòng meta chưa được thử trong đợt này).
- Sửa 1 bug do chính luồng này gây ra trong lần chạy đầu: `ROOT` tính
  sai 1 cấp (`apps/web/scripts` cần 3 lần `..` mới về gốc repo, script
  ban đầu chỉ dùng 2 lần) nên vòng vite preview bị bỏ qua với thông báo
  "không có dist/index.html" dù file có thật. Đã sửa, chạy lại, vòng
  vite preview lên thật tại `127.0.0.1:4173`.
- Sửa 1 bug dọn dẹp: script kill tiến trình `npx` nhưng vite con sống
  sót (đã gặp 2 lần, phải kill tay). Đã đổi sang chạy thẳng
  `node <repo>/node_modules/vite/bin/vite.js preview` (vite hoist lên
  node_modules gốc repo, không nằm dưới `apps/web`) — kiểm chứng lần
  chạy cuối: sau khi script thoát không còn tiến trình vite preview nào.

## Điều kiện đo (ghi để đối chiếu, không đoán)

- Binary: Playwright Chromium 156.0.8078.4
  (`~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`), headed,
  Xvfb 1920x1080x24, cửa sổ 1920x1080. Không truyền `--disable-gpu`.
- UA: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like
  Gecko) Chrome/156.0.0.0 Safari/537.36`.
- **WebGL probe trả `no-webgl` trong mọi vòng headed qua pipe** (tạo
  context webgl thất bại) nên chuỗi renderer không xác định được —
  KHÔNG claim SwiftShader cho đợt này (SwiftShader là kết luận của vòng
  headless `--disable-gpu` đợt 16/17, không phải của vòng headed này).
  Đường Canvas 2D vẫn chạy và vẫn là thứ được đo.
- Mỗi case: rAF 3 giây, nguồn pattern ImageData LCG như H4/v17, plan
  alpha ghost đúng công thức preview (frame đầu alpha 1, frame i alpha
  = w_i / Σ_{j≤i} w_j). Đây là chi phí VẼ, không gồm decode video,
  không gồm UI/timeline, không phải footage thật.
- rAF headed dưới Xvfb khóa ở ~60 Hz (median dt 16.7 ms ở mọi case
  sạch): số fps vì vậy là "đạt/không đạt mức khóa 60 Hz", không đo
  được headroom vẽ vượt 60 Hz. Xvfb không có vsync phần cứng thật nên
  số này vẫn KHÔNG phải FPS trên màn hình thật của user.

## Số đo dùng được: trang tối giản (canvas ghost thuần)

3 lần chạy độc lập, mỗi lần 1 tiến trình Chrome mới (lần 2 là vòng đầu
của lần chạy gộp, lần 3 là `PIPE_ONLY=minimal`):

| Case | Lần 1 (gộp, chạy đầu) | Lần 2 (gộp, chạy sau) | Lần 3 (riêng) |
|---|---|---|---|
| rafEmpty | 56.15 | 60.46 | 60.62 |
| ghost720f1 | 57.38 | 60.38 | 60.33 |
| ghost720f3 | 55.93 | 59.65 | 60.47 |
| ghost720f8 | 54.54 | 55.62 | 60.36 |
| ghost1080f1 | 60.35 | 60.57 | 60.43 |
| ghost1080f3 | 60.45 | 60.40 | 60.39 |
| ghost1080f8 | 58.39 | 44.09 | 55.47 |
| ghost1080f8b (lặp) | 58.80 | 32.49 | 59.47 |

Đọc: ở trạng thái sạch, ghost 1080p f8 giữ ~55–59 fps (gần khóa 60 Hz);
lần 2 có 1 cặp lặp tụt xuống 44.09 rồi 32.49 — là phương sai giữa các
lần chạy trên VM 2 vCPU (tải nền/GC), không phải số ổn định, nên báo
cả 3 lần thay vì chọn lần đẹp nhất. Chẩn đoán phụ: trang tối giản mới
tinh, chỉ đo rafEmpty, đạt 58.13 fps — nền tảng headed là bình thường.
**Cập nhật sau lần chạy kiểm chứng cuối (sau khi vá viteBin):** khi
VM đang chịu tải nặng từ các luồng đợt 18 chạy song song, cả nền cũng
tụt — rafEmpty 52.66, ghost720f8 34.99, ghost1080f8 33.60/24.30, median
dt vẫn 16.7 ms nhưng p90 vọt lên 66–83 ms (rớt frame rời rạc, không
phải chậm đều). Vì vậy **55–59 fps KHÔNG phải benchmark ổn định**:
kết luận vững duy nhất là (a) pipe headed đo được, (b) rAF headed
chạy theo nhịp ~60 Hz, (c) ghost không sụp một cách xác định như
headless H4 — còn số tuyệt đối phụ thuộc tải VM tại thời điểm đo và
phải đo lại trên máy không chịu tải khác mới trích được.

## Số đo KHÔNG dùng được: vòng vite preview (trang editor thật)

Vòng này tiêm cùng bench vào trang editor build thật (`vite preview`,
`#root` đã render, 1 canvas của app) — nhưng số đo không tách được
chi phí ghost khỏi chi phí composite trang:

| Case | Gộp (sau vòng tối giản) | Riêng (`PIPE_ONLY=vitePreview`) |
|---|---|---|
| rafEmpty | 45.30 | 58.76 |
| ghost720f1 | 41.22 | 60.16 |
| ghost720f3 | 15.77 | 32.66 |
| ghost720f8 | 2.84 | 10.92 |
| ghost1080f1 | 1.94 | 11.63 |
| ghost1080f3 | 2.49 | 11.48 |
| ghost1080f8 | 2.67 | 10.44 |
| ghost1080f8b | 2.25 | 10.80 |

Dấu hiệu nhiễu, không phải chi phí ghost: ở vòng riêng, **1080p f1
cũng chỉ 11.63 fps trong khi 720p f1 là 60.16 fps** — nếu là chi phí
vẽ ghost thì f1 không thể sụp khi f1 720p vẫn đủ 60. Median dt ở
1080p vọt lên ~83–100 ms ở mọi số frame, trong khi rafEmpty cùng
trang là 58.76 fps. Cơ chế khả dĩ nhất: canvas bench phủ toàn màn
hình 1920x1080 phải composite chồng lên toàn bộ DOM editor trên
raster phần mềm của VM (cộng với canvas riêng của app), nên chi phí
đo được là chi phí composite trang, không phải chi phí ghost. Vòng
gộp còn tệ hơn (dt median ~400–500 ms) do nhiễm chéo bộ nhớ/GC sau
vòng tối giản — càng khẳng định số vitePreview không dùng được.
**Cấm trích "editor 11 fps" hay "ghost 1080p 11 fps" từ bảng này.**

## Giới hạn còn lại / nợ mở

- Chưa đo được FPS preview của editor thật: cần lái timeline/project
  thật của editor (load project, phát, bật ghost) thay vì tiêm canvas
  phủ — đó là việc của đợt sau, không phải việc đo thêm bằng script này.
- Chưa xác định được backend raster của vòng headed (probe WebGL trả
  `no-webgl`); chưa đo trên GPU thật, chưa đo trên màn hình thật
  (Xvfb khóa rAF ~60 Hz, không phải vsync phần cứng).
- Nguồn vẫn là pattern ImageData, không phải footage máy quay thật
  (nợ chung từ đợt 17, không có trong repo, không tải ngoài vì license).
- Binary meta-chromium 152 qua pipe chưa được thử (script dừng ở
  binary đầu tiên thành công); blocker localhost LNA của binary đó
  (đợt 17) có thể vẫn còn nếu thử, nhưng pipe không phụ thuộc cổng TCP
  nên có khả năng nó cũng chạy — chưa kiểm chứng, không claim.
- `PIPE_ONLY` là tiện ích chạy vòng đơn lẻ để tránh nhiễm chéo; không
  phải tính năng sản phẩm.

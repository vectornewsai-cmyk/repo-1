# R3 (Phase 9) — Đo hiệu năng thật + proxy tự động: giới hạn & ghi chú trung thực

Ngày: 2026-10-24. Agent: R3. KHÔNG PUSH (theo lệnh Phase 9 — chỉ để trên đĩa).

## Đã làm

1. **FPS meter trong editor** — `apps/web/src/components/PerfOverlay.tsx`
   (nút "📈 FPS" góc phải dưới, bấm mở panel), mount trong `App.tsx`.
   Đo bằng rAF của app: FPS 1s gần nhất, trung bình, thấp nhất, frame giật
   (>50ms), tổng frame. Chỉ đo khi panel mở.
2. **Bench FPS headless** — `apps/web/scripts/bench-preview-fps.mjs`
   (zero-dependency, CDP qua WebSocket của Node 24): mở editor, chờ project
   mẫu, bấm Phát, đếm rAF N giây, ghi JSON ra
   `benchmarks/results/preview-fps.json`.
3. **Harness GPU encode** — `benchmarks/render/gpu_encode_harness.sh`,
   số thô `benchmarks/results/gpu_encode.jsonl`.
4. **Proxy tự động khi import** — `MediaBin.tsx` + helper
   `shouldAutoProxy` trong `lib/proxy.ts` (test 8/8
   `lib/proxyAuto.test.ts`): video mới import, cao > 720p, chưa có proxy,
   và checkbox bật → tự gọi endpoint proxy có sẵn của bridge, tuần tự
   từng file. Checkbox lưu localStorage key `vcut-auto-proxy`, mặc định BẬT.
   Script kiểm chứng E2E: `apps/web/scripts/check-proxy-auto.mjs` (PASS:
   checkbox mặc định bật, upload 1080p 3s → "✓ PROXY 720p").
5. **Số đo thật** đã ghi vào `benchmarks/RESULTS.md` mục 8; claim cũ
   "FPS chưa đo" trong `benchmarks/BENCH_LIMITS.md` đã cập nhật.

## Số đo (đừng trích sai)

- Preview FPS headless trên VM 2 vCPU này: 13.4 fps (lần 5s sạch nhất),
  28.46 fps (lần 10s, có đuôi idle), 16.01 fps (lần đầu, JSON đã bị ghi đè).
  Phương sai lớn = VM chia sẻ tải + nhiều agent chạy cùng lúc. Đây là số
  THAM CHIẾU headless (decode phần mềm, không màn hình thật), KHÔNG phải
  FPS trên máy người dùng. Đừng trích "VCut preview chỉ 13fps".
- GPU encode: encoder có trong build FFmpeg nhưng KHÔNG có phần cứng
  (không nvidia-smi, không /dev/dri) → cả 4 encode đều fail. **Chưa từng
  test GPU encode thành công trên phần cứng thật** — đừng claim ngược lại.

## Giới hạn còn lại (không claim hơn)

- **PerfOverlay KHÔNG đo draw call trực tiếp của canvas preview**, vì brief
  R3 cấm sửa `preview.tsx`. Số đo là rAF của app: khi đang phát thì gắn
  với preview, khi đứng yên thì chỉ là tốc độ vòng vẽ idle (panel ghi rõ).
- **Bench headless ≠ trình duyệt thật:** không màn hình, decode phần mềm,
  rAF headless vẫn bị nhịp compositor (~60Hz) giới hạn. Cần đo lại trên máy
  thật để có baseline ổn định.
- **Bug đã sửa trong lúc làm bench (ghi để khỏi tái phạm):**
  - Biến `URL` trong bench script che global `URL` → đổi thành `PAGE_URL`.
  - `ROOT` tính thiếu 1 cấp (`../..` thay vì `../../..`) → spawn vite sai
    đường dẫn, rơi về npx rồi ENOENT.
  - Vite mặc định bind `localhost` nhưng VM này chỉ nghe IPv6 (::1) nên
    fetch 127.0.0.1 thất bại → bench spawn vite với `--host 127.0.0.1`.
  - Đo rAF qua 2 lần evaluate rời nhau từng mất trạng thái khi execution
    context đổi → chuyển sang 1 evaluate duy nhất với `awaitPromise`.
- **Proxy tự động:** trạng thái (đang tạo/xong/lỗi) giữ ở state local của
  MediaBin, KHÔNG vào store — để tránh xung đột với agent khác đang sửa
  store.ts. Hệ quả: MediaBin render 2 instance (desktop + bottom sheet
  mobile) thì mỗi instance có state riêng; toggle ở instance nào chỉ đổi
  ở đó cho tới khi reload (giá trị lưu localStorage nên lần mở sau đồng bộ).
- **Bridge:** không cần sửa — endpoint POST /api/proxy có sẵn từ Q8 đã đủ
  cho cả tạo tay lẫn tự động. Bridge phải đang chạy thì auto-proxy mới
  hoạt động; bridge tắt → trạng thái "Proxy lỗi, thử lại" + 1 toast duy nhất.
- **tsc toàn app lúc R3 xong:** file R3 sạch 0 lỗi; còn 1 lỗi ở file của
  agent Phase 9 khác (`lib/webglLut.ts:400` — TexImageSource) mà R3 không
  sửa để tránh xung đột. Vite build pass.
- **Không push:** toàn bộ file R3 chỉ nằm trên đĩa, chờ parent gom batch.

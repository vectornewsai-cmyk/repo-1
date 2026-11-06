# Phase 9 đợt 30, luồng M3 — Dọn nốt phần thô của errorDetail: CLI không-quiet + route /api/proxy — LIMITS

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không sửa ExportPanel.tsx, không đụng chuỗi UI/i18n (luồng M4
lo), không đụng file của luồng khác. Chỉ đụng CLI render + bridge
index.js + test + LIMITS của mình.

Nối tiếp đợt 29 L3 (xem
`docs/PHASE9_ROUND29_L3_ERRORDETAIL_UI_LIMITS.md` §5): hai điểm thô
còn lại là (a) CLI không-quiet in stderr worker trực tiếp qua
`stdio: "inherit"`, (b) `/api/proxy` trả `e.message` trực tiếp. Đợt
này đóng cả hai.

## 1. Đã làm

### 1a. CLI render không-quiet: pipe + lọc redact theo dòng

- `cli/src/renderErrors.ts`: thêm `redactWorkerLine(line)` — adapter
  mỏng gọi `redactStderr` canonical của bridge (cùng chuẩn với
  bridge: cắt đường dẫn tuyệt đối/home/token/stack), fallback
  basename-only khi module bridge không load được. Dòng stack trace
  Node → chuỗi rỗng (caller bỏ hẳn, không in dòng trống). Lưu ý kỹ
  thuật: `redactStderr` vốn làm việc trên cả đoạn text (giữ 20 dòng
  cuối, 1500 ký tự); áp theo dòng thì phần tail đó không gộp được —
  mỗi dòng dài > 1500 ký tự vẫn bị cắt đuôi, chấp nhận được vì dòng
  ffmpeg/worker hiếm khi dài đến mức đó và thông tin chính nằm ở đầu
  dòng.
- `cli/src/commands/render.ts`: chế độ không-quiet không còn
  `stdio: "inherit"`. Thay bằng `runWorkerStreamed()` dùng `spawn`
  (bất đồng bộ, vì `cmdRender` đã là async):
  - `stdio: ["ignore", "inherit", "pipe"]` — stdout worker giữ
    inherit như trước (log tiến trình của worker), chỉ stderr bị pipe.
  - stderr được stream theo thời gian thực: tách dòng theo `\n`
    HOẶC `\r` (ffmpeg in progress bằng `\r`), mỗi dòng qua
    `redactWorkerLine` rồi mới in ra `process.stderr`, giữ nguyên
    delimiter gốc để hành vi terminal (ghi đè dòng progress) không
    đổi. Chunk UTF-8 bị cắt giữa chừng được `StringDecoder` xử lý;
    phần dòng dở dang cuối chunk giữ lại chờ chunk sau.
  - Đồng thời tích lũy bản thô để dùng khi fail, nhưng cắt đuôi
    256KB (stderr worker vốn chỉ cần tail cho lỗi có cấu trúc; tránh
    phình bộ nhớ với render dài có hàng nghìn dòng progress ffmpeg).
  - Timeout 30 phút như `spawnSync` trước đây (hết giờ → SIGKILL +
    lỗi timeout có cấu trúc). Exit code và signal được giữ nguyên
    và truyền vào `formatRenderFailure` như trước.
- Chế độ quiet (`-q`) giữ nguyên 100% `spawnSync` pipe — không đổi
  hành vi. Nhánh thông báo cũ "log worker đã in trực tiếp ra
  terminal ở chế độ không quiet — chạy lại với -q" đã bị xóa vì
  không còn đúng: từ nay cả hai chế độ đều bắt được stderr, nên
  nhánh rỗng chỉ còn cho lỗi spawn/timeout thật sự rỗng.

### 1b. Route /api/proxy: bọc taskErrorPayload canonical

- `server/bridge/src/index.js`: catch `/api/proxy` không còn
  `res.status(500).json({ error: e.message || ... })` (từng lộ đường
  dẫn tuyệt đối từ `probeMedia`, vd `Không probe được <abs>/file.mp4`).
  Nay dùng `taskErrorPayload(e, "Tạo proxy thất bại.")` như 10 route
  kia, với MỘT khác biệt có chủ ý so với các route đồng bộ khác:
  `error` đã redact + `errorCode` luôn kèm, nhưng `errorDetail`
  CHỈ kèm khi caller xin tường minh `?detail=1` (hoặc
  `?error_detail=1`, cùng tên param như render job) — proxy là
  route upload, giữ mặc định gọn như luật render job thay vì trả
  luôn detail. Log server vẫn giữ `e.message` thô (kênh local,
  không phải API — quyết định từ đợt 28, giữ nguyên).
- OpenAPI: `openapi.yaml` KHÔNG có entry cho `/api/proxy` từ trước
  nên không sửa gì ở đó; schema `Error` chung (đã có `errorCode` +
  `errorDetail` từ đợt 29) vẫn mô tả đúng payload mới.

### 1c. Test cũ cập nhật theo hành vi mới (không phải hồi quy)

- `server/bridge/test/test-error-detail-ui.cjs` (đợt 29): assertion
  "chỉ còn 1 catch 500 e.message thô (proxy)" nay đã sai vì proxy
  đã được bọc — cập nhật thành "không còn catch 500 e.message thô"
  + "proxy dùng taskErrorPayload" + "proxy chỉ kèm detail khi
  ?detail=1". Tổng assertion tăng 51 → 52 (thay 2 assertion cũ
  bằng 3 assertion mới), không phải do thêm tính năng ngoài phạm vi.
- Test mới `server/bridge/test/test-error-detail-cli-proxy.cjs`
  (xem §3): tĩnh + redact thật qua dist + CLI thật + bridge thật.

## 2. Kết quả test (số thật, chạy ngày 2026-10-31)

- Mới `test-error-detail-cli-proxy.cjs`: **25 pass, 0 fail** —
  tĩnh 7, redact qua dist 4, CLI thật 7, bridge thật 7. Trong đó:
  - CLI không-quiet render project có clip `corrupt.mp4` (file text
    đội lốt mp4, CLI `add-clip` chấp nhận vì chỉ kiểm tra tồn tại):
    exit 1, stderr chứa `[FFMPEG_ERROR]` + `<path>/corrupt.mp4`,
    KHÔNG chứa đường dẫn tuyệt đối của file đầu vào. Dòng worker
    thô duy nhất còn dạng pointer ffmpeg (`0x…`) là địa chỉ bộ nhớ
    tạm, chấp nhận giữ theo quyết định đợt 28.
  - CLI `-q` cùng project: exit 1, lỗi có cấu trúc, không rò —
    hành vi quiet không đổi.
  - CLI không-quiet render thành công (video testsrc 320x240 thật,
    2s): exit 0, tạo được MP4 — streaming không phá đường success.
  - Bridge thật (port riêng, work dir tạm): POST `/api/proxy` file
    hỏng → 500 có `errorCode`, KHÔNG có field `errorDetail` khi
    không xin; `?detail=1` → có `errorDetail` canonical; cả hai
    payload đều không chứa đường dẫn tuyệt đối của work dir.
    File nhỏ hợp lệ vẫn trả `skipped: true` (route không bị phá).
  - Trong lúc viết test đã gặp 1 fail giả: closure `post` trong
    test vẫn upload file hỏng cũ cho ca "file nhỏ" — lỗi của test,
    không phải của code; đã sửa test (truyền file tường minh) rồi
    chạy lại xanh, không sửa code để chiều test.
- Hồi quy: `test-error-detail.cjs` **56 pass, 0 fail**,
  `test-jobqueue.cjs` **52 pass, 0 fail**,
  `test-error-detail-ui.cjs` **52 pass, 0 fail** (51 cũ + 1
  assertion mới, xem §1c).
- `npx tsc -p tsconfig.json` trong `cli/` pass (exit 0);
  `node --check` cho `server/bridge/src/index.js` pass.
- Web: `npx tsc --noEmit` trong `apps/web` lần này KHÔNG báo lỗi
  nào (2 lỗi `curveFix.ts` mà đợt 29 ghi đã hết — do luồng khác
  sửa, không phải việc của luồng này). Vite build không chạy vì
  luồng này không chạm code web nào (ExportPanel/i18n nguyên vẹn,
  xem §4) nên không có gì để build lại.

## 3. Cái gì đã chặn được / còn rò (trung thực)

| Kênh | Trước đợt 30 | Sau đợt 30 |
|---|---|---|
| CLI render không-quiet (stderr worker) | In trực tiếp, thô | Pipe + redact theo dòng, stream trực tiếp |
| CLI render `-q` | Đã redact (đợt 28) | Không đổi |
| Bridge `/api/proxy` (500) | `e.message` thô | `error` redact + `errorCode` luôn kèm, `errorDetail` chỉ khi `?detail=1` |
| Bridge 10 route tác vụ khác | Đã canonical (đợt 29) | Không đổi |
| Log server (`console.error`) | stderr thô | CỐ TÌNH GIỮ (log local, không phải API) |
| CLI `caption` / `tts` (`stdio: ["ignore","inherit","inherit"]`) | In stderr script Python trực tiếp | **CÒN — xem §4**. Ngoài phạm vi đợt này (đợt này chỉ lo render worker theo đúng mô tả nợ của đợt 29). |

## 4. Chưa làm / nợ còn lại (trung thực)

- **CLI `caption` và `tts` vẫn dùng stdio inherit**: stderr của
  script Python in trực tiếp ra terminal ở mọi chế độ (không có
  cờ quiet riêng như render). Cùng bản chất kẽ leak như render
  trước đợt này, nhưng là lệnh khác, ngoài mô tả nợ của đợt 29
  ("CLI không-quiet" trong LIMITS đợt 29 chỉ nói render worker).
  Muốn chặn phải áp cùng mẫu pipe + redact theo dòng cho 2 lệnh
  này ở đợt sau — ghi rõ để parent không nhầm là đã hết.
- **Giới hạn redact kế thừa từ đợt 28/29, vẫn đúng**: basename file
  vẫn là thông tin (tên file của caller); địa chỉ con trỏ ffmpeg
  dạng `0x…` trong details là địa chỉ bộ nhớ tạm, không phải
  secret hay đường dẫn — chấp nhận giữ.
- **Dòng worker dài > 1500 ký tự bị cắt đuôi khi stream** (xem
  §1a): khác với redact cả đoạn vốn giữ đầu + đuôi theo tail
  1500 ký tự — với dòng đơn thì chỉ giữ 1500 ký tự cuối. Thực tế
  dòng ffmpeg/worker hiếm khi dài đến mức đó; nếu sau này gặp
  dòng siêu dài chứa thông tin ở đầu, cần redact theo đoạn thay
  vì theo dòng cho riêng dòng đó.
- **Buffer tích lũy stderr worker cắt đuôi 256KB**: lỗi có cấu
  trúc khi fail chỉ thấy tail — đủ cho phân loại (tail chứa dòng
  lỗi cuối), nhưng log đầy đủ của render dài không còn trong
  `CliError`. Đây là đánh đổi cố tình để tránh phình bộ nhớ;
  log đầy đủ đã được stream ra terminal theo thời gian thực nên
  user vẫn thấy.
- **Không sửa**: `apps/web/src/ExportPanel.tsx` (mtime vẫn
  2026-10-31 07:11, trước phiên này), `apps/web/src/i18n/*.json`,
  10 route tác vụ bridge khác, `taskErrorPayload` (không thêm
  tham số — proxy tự lược `errorDetail` ở catch của nó để không
  đổi hành vi các route khác), validator, render worker.
- `cli/dist/` được build lại để test (build output, không phải
  source — parent quyết định có đưa vào batch hay không, giống
  mẫu dist của MCP ở đợt 28/29).

## 5. File đổi/thêm (tương đối từ repo root, KHÔNG gồm dist)

- `cli/src/commands/render.ts` (sửa: pipe + stream redact theo dòng ở không-quiet, giữ nguyên quiet)
- `cli/src/renderErrors.ts` (sửa: thêm `redactWorkerLine`)
- `server/bridge/src/index.js` (sửa: catch `/api/proxy` bọc taskErrorPayload + opt-in detail; ghi chú taskErrorPayload)
- `server/bridge/test/test-error-detail-ui.cjs` (sửa: cập nhật 2 assertion proxy cũ thành 3 assertion mới)
- `server/bridge/test/test-error-detail-cli-proxy.cjs` (mới)
- `docs/PHASE9_ROUND30_M3_CLI_PROXY_LIMITS.md` (mới, file này)

Không đụng: `apps/web/src/ExportPanel.tsx`, `apps/web/src/i18n/*.json`,
`cli/src/commands/caption.ts`, `cli/src/commands/tts.ts`, validator,
render worker, `job.error` cũ, luật opt-in `?detail=1` của render job.

# Phase 9 đợt 31, luồng N3 — CLI caption/tts: pipe + redact theo mẫu M3 — LIMITS

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Nối tiếp đợt 30 M3 (`docs/PHASE9_ROUND30_M3_CLI_PROXY_LIMITS.md`
§4 + `docs/PHASE9_ROUND30_LIMITS.md` §3 item 3): CLI caption và tts
vẫn dùng `stdio: ["ignore", "inherit", "inherit"]`, stderr của script
Python in trực tiếp ra terminal. Đợt này đóng đúng kẽ đó, theo đúng
mẫu M3, không phát minh mẫu mới.

## 1. Đã làm

### 1a. Helper dùng chung đúng mẫu M3

- `cli/src/streamedWorker.ts` (mới): `runStreamed(command, args,
  timeoutMs, timeoutLabel)` — bản tham số hóa của
  `runWorkerStreamed` trong `commands/render.ts` (đợt 30 M3), từng
  chi tiết giữ nguyên:
  - `stdio: ["ignore", "inherit", "pipe"]` — stdout con giữ inherit
    như trước (log tiến trình), chỉ stderr bị pipe.
  - stderr stream theo thời gian thực: tách dòng theo `\n` HOẶC
    `\r`, mỗi dòng qua `redactWorkerLine` (chuẩn redact canonical
    của bridge: cắt đường dẫn tuyệt đối/home/token/stack) rồi mới
    in ra `process.stderr`, giữ nguyên delimiter gốc. Dòng sau
    redact thành rỗng (stack trace) thì bỏ hẳn, không in dòng trống.
  - `StringDecoder` xử lý chunk UTF-8 bị cắt giữa chừng; phần dòng
    dở dang cuối chunk giữ lại chờ chunk sau.
  - Tích lũy bản thô cắt đuôi 256KB (đủ cho lỗi có cấu trúc khi
    fail; tránh phình bộ nhớ với log dài).
  - Timeout → SIGKILL + `error` timeout (status khi đó là null do
    bị kill, giống hệt `spawnSync` cũ khi timeout: status null →
    caller báo `exit null`).
  - Mã exit/signal của tiến trình con trả nguyên về caller.
- Cố tình KHÔNG refactor `render.ts` sang dùng helper này:
  `runWorkerStreamed` của render giữ nguyên 100% (đã kiểm chứng ở
  đợt 30), tránh hồi quy đường render. Trùng lặp ~60 dòng giữa hai
  bản là đánh đổi có chủ ý, ghi rõ để đợt sau khỏi "dọn" mà không
  chạy lại test render.

### 1b. caption + tts nối vào helper

- `cli/src/commands/caption.ts`: bỏ `spawnSync` + `stdio: "inherit"`
  cho stderr, thay bằng
  `await runStreamed(PYTHON_BIN, pyArgs, 20 * 60 * 1000, "caption")`.
  Timeout 20 phút như trước; `cmdCaption` vốn đã async nên không
  đổi chữ ký. Import `spawnSync` thừa đã gỡ (tsc sạch).
- `cli/src/commands/tts.ts`: tương tự,
  `await runStreamed(PYTHON_BIN, pyArgs, 10 * 60 * 1000, "tts")`.
  Timeout 10 phút như trước. `spawnSync` vẫn còn dùng cho ffprobe
  đo duration (pipe mặc định, output bỏ qua — không phải kênh leak,
  không đụng).
- Cả hai giữ nguyên 100%: thông điệp lỗi cũ
  (`caption.py thất bại (exit <status>)` /
  `tts.py thất bại (exit <status>)`), tức process exit 1 qua handler
  CliError ở `index.ts` như trước, mã exit thật của tiến trình con
  nằm trong thông điệp. caption/tts không có cờ `-q` nên không có
  nhánh quiet nào cần giữ — toàn bộ stderr của chúng nay đều qua
  pipe + redact. Tác dụng phụ có lợi, không đổi hợp đồng: bỏ giới
  hạn `maxBuffer` (32MB caption / 16MB tts) của `spawnSync` cũ —
  trước đây stderr vượt buffer sẽ chết với lỗi ENOBUFS, nay stream
  nên không còn giới hạn đó.
- Một dòng rò ngoài worker stderr, sửa kèm (ghi rõ để parent xét):
  dòng thông báo của chính CLI `caption` trước đây in `srcAbs`
  tuyệt đối (`[vcut] caption: <abs> …`), tức stderr vẫn rò đường
  dẫn dù stderr worker đã redact xong. Nay chỉ in
  `path.basename(srcAbs)`, cùng chuẩn basename của redact bridge.
  Không đổi nội dung khác của dòng này. Đối chiếu: render giữ
  nguyên dòng `[vcut] render … → <outAbs>` của M3 (ngoài phạm vi
  luồng này); tts không có dòng nào in đường dẫn trước spawn (chỉ
  in đoạn text người dùng gõ).

### 1c. Không đổi (cố tình)

- Log server giữ `e.message` thô — kênh local, quyết định đợt 28,
  giữ nguyên theo brief (luồng này không đụng bridge `index.js`).
- Thông điệp lỗi caption/tts KHÔNG nâng lên dạng có cấu trúc
  `formatRenderFailure` như render: giữ nguyên định dạng cũ để
  không đổi hợp đồng output của hai lệnh (log đầy đủ đã stream ra
  terminal theo thời gian thực, đã redact).
- `list-voices` trong `cli/src/index.ts` không đụng: nó dùng
  `spawnSync` không set stdio (pipe mặc định), stderr không in ra
  terminal, chỉ stdout được in khi thành công — không phải kênh leak.
- Không đụng: seek/preview, i18n/toast, scripts harness CDP, dip,
  `commands/render.ts`, bridge, validator, script Python
  (caption.py/tts.py nguyên vẹn).

## 2. Kết quả test (số thật, chạy ngày 2026-10-31)

- Mới `server/bridge/test/test-error-detail-cli-caption-tts.cjs`:
  **27 pass, 0 fail** — tĩnh 10, redact qua dist 3, CLI thật 14.
  Trong đó:
  - CLI thật, caption hỏng THẬT bằng caption.py thật: project có
    clip `corrupt.mp4` (file text đội lốt mp4) → ffmpeg trích audio
    thất bại trước cả khi nạp model, traceback Python qua pipe →
    process exit 1, thông điệp `caption.py thất bại (exit 1)`,
    stderr KHÔNG chứa đường dẫn tuyệt đối của work dir, KHÔNG
    chứa home dir, vẫn chứa `<path>/corrupt.mp4`, project không bị
    thêm track.
  - CLI thật, mã exit giữ nguyên qua shim interpreter
    (`VCUT_PYTHON` trỏ tới script shell in dòng traceback chứa
    đường dẫn tuyệt đối + home + token rồi exit cố định; đường
    CLI → spawn → stream → redact → thông điệp là thật, shim chỉ
    thay interpreter để kiểm soát mã exit, không mock code
    redact/stream): caption exit 3 → thông điệp `exit 3`,
    tts exit 5 → thông điệp `exit 5`, cả hai process exit 1,
    stderr đã redact (không rò work dir/home/token), stdout con
    vẫn inherit (dòng stdout của shim thấy được).
  - Trong lúc chạy thử tay, gặp thêm 1 ca hỏng THẬT của tts.py
    không qua shim: máy này chưa cài package `vieneu` cho python3
    hệ thống nên `vcut tts` thật → tts.py trả exit 3, CLI báo
    `tts.py thất bại (exit 3)`, stderr qua redact sạch (không rò).
    Ca này không đưa vào test commit vì phụ thuộc môi trường
    (máy có vieneu sẽ đi đường success, không fail).
- Hồi quy (chạy lại, không lấy số đợt 30 làm chứng):
  `test-error-detail-cli-proxy.cjs` **25 pass, 0 fail**,
  `test-error-detail.cjs` **56 pass, 0 fail**,
  `test-error-detail-ui.cjs` **52 pass, 0 fail**,
  `test-jobqueue.cjs` **52 pass, 0 fail**,
  `npx tsc -p tsconfig.json` trong `cli/` pass (exit 0),
  `node --check` cho `server/bridge/src/index.js` pass.
- Xác nhận không đụng render: `cli/src/commands/render.ts` giữ
  mtime 2026-10-31 13:07 (trước phiên này, 19:10+), vẫn chứa
  `runWorkerStreamed` của M3.
- Trong lúc viết test đã gặp 2 fail giả (lỗi của test, không phải
  code): assertion tĩnh kiểm tra cụm `stdio: "inherit"` bị comment
  trong code chứa cụm đó làm dương tính giả → sửa assertion về
  đúng literal cũ `stdio: ["ignore", "inherit", "inherit"]`, chạy
  lại xanh, không sửa code để chiều test.

## 3. Cái gì còn thô / chưa kiểm chứng (trung thực)

| Mục | Trạng thái |
|---|---|
| CLI caption/tts stderr worker | Pipe + redact theo dòng, stream trực tiếp (đợt này) |
| CLI render không-quiet / `-q` | Không đổi, đã xong đợt 30 |
| Bridge `/api/proxy` + 10 route khác | Không đổi, đã canonical đợt 29/30 |
| Log server (`console.error` e.message thô) | CỐ TÌNH GIỮ (kênh local, quyết định đợt 28) |
| Dòng `[vcut] render … → <outAbs>` của chính CLI render | Còn in đường dẫn tuyệt đối của output — M3 giữ nguyên, ngoài phạm vi luồng này; cùng lý do với dòng caption cũ, đợt sau có thể basename hóa nếu parent muốn đồng bộ |
| JSON success của tts (`wav: <abs>`) và render (`output: <abs>`) | CỐ TÌNH GIỮ — stdout có cấu trúc cho agent/consumer đọc, không phải stderr leak; đổi sẽ phá hợp đồng output |
| Đường success caption/tts (tạo track thật / WAV thật + clip) | CHƯA kiểm chứng trên máy này: python3 hệ thống thiếu cả `faster_whisper` lẫn `vieneu` (xác nhận bằng `python3 -c "import …"` fail cả hai). Cơ chế success không đổi ngoài việc thay `spawnSync` bằng `runStreamed` (stdout vẫn inherit, đọc track/WAV sau spawn giữ nguyên), và stdout-inherit đã chứng minh qua shim — nhưng claim "success vẫn chạy" chưa có bằng chứng render/track thật, cần chạy lại trên máy có đủ package trước khi coi là xong hoàn toàn |
| Đường success caption (whisper thật) | Cũng chưa chạy (cần model + package, nặng); cùng lý do trên |
| Giới hạn redact kế thừa từ đợt 28/30, vẫn đúng | Basename file vẫn là thông tin; địa chỉ con trỏ `0x…` (nếu có) là địa chỉ bộ nhớ tạm, chấp nhận giữ; dòng đơn dài > 1500 ký tự bị cắt đuôi khi stream theo dòng |
| Buffer tích lũy stderr cắt đuôi 256KB | Lỗi khi fail chỉ thấy tail trong `stderr` tích lũy — hiện caller caption/tts chưa dùng bản tích lũy này (thông điệp chỉ mang mã exit), nên giới hạn này hiện không ảnh hưởng gì; log đầy đủ đã stream ra terminal |
| Timeout caption/tts | Thông điệp timeout không được surfaced riêng (giống `spawnSync` cũ: timeout → status null → `exit null`); SIGKILL + `error` timeout có trong `runStreamed` nhưng caller hiện bỏ qua `error` ngoài status — giữ nguyên hành vi cũ, không bịa thêm thông điệp mới |

## 4. File đổi/thêm (tương đối từ repo root, KHÔNG gồm dist)

- `cli/src/streamedWorker.ts` (mới: `runStreamed` đúng mẫu M3)
- `cli/src/commands/caption.ts` (sửa: qua `runStreamed`, dòng thông
  báo chỉ in basename)
- `cli/src/commands/tts.ts` (sửa: qua `runStreamed`)
- `server/bridge/test/test-error-detail-cli-caption-tts.cjs` (mới)
- `docs/PHASE9_ROUND31_N3_CLI_CAPTION_TTS_LIMITS.md` (mới, file này)

Không đụng: `cli/src/commands/render.ts` (mtime 13:07 trước phiên),
`cli/src/renderErrors.ts`, `cli/src/index.ts` (kể cả `list-voices`),
`server/bridge/src/index.js`, mọi script Python, seek/preview,
i18n/toast, scripts harness CDP, dip. `cli/dist/` được build lại để
test (build output, không phải source — parent quyết định có đưa
vào batch hay không, giống mẫu dist của đợt 28/29/30).

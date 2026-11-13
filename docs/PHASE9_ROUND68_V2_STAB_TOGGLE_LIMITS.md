# PHASE9_ROUND68_V2_STAB_TOGGLE_LIMITS.md

> Đợt 68 — luồng V2: UI toggle bật/tắt stabilize single-thread decode.
> Đóng nợ U1 đợt 67 §7 mục 1 (đợt 67 đã ép `-threads 1` vào code + CLI + env,
> nhưng chưa có toggle trên UI). Tài liệu này ghi trung thực những gì đã làm,
> số đo thật, và những gì CHƯA kiểm chứng được vì môi trường.

## 1. Đã làm gì

### 1.1 Vị trí toggle: ExportPanel, ngay sau block normalize

- Toggle là **tuỳ chọn render-time toàn cục** (áp dụng cho mọi clip chống rung
  trong job render), không phải thuộc tính của từng clip như `clip.enhance`
  của EnhancePanel. Vì vậy đặt ở ExportPanel — cùng chỗ với normalize
  (Phase 7 P3, cũng là tuỳ chọn render-time toàn cục) — để người dùng tìm
  được khi xuất video, và để đi chung đường export-preset đã có sẵn.
- Checkbox `data-testid="export-stab-single-thread-toggle"`, label
  `Chống rung: decode đơn luồng (ổn định hơn)` (vi) /
  `Stabilize: single-thread decode (more deterministic)` (en), kèm dòng hint
  giải thích: BẬT = ffmpeg decode clip chống rung bằng 1 luồng, đầu ra ổn
  định hơn giữa các lần render (đợt 67 U1); TẮT = decode đa luồng, có thể
  nhanh hơn nhưng đầu ra có thể khác; chỉ có tác dụng với clip có chống rung.
- Toggle bị disable trong lúc đang upload/render (giống các control export khác).

### 1.2 Luồng dữ liệu (đi qua bridge preset whitelist — đường chuẩn)

```
ExportPanel state (useState, loadStabSingleThread())
  → POST /api/render, preset JSON { ..., stabSingleThread: boolean }
  → bridge parsePreset (whitelist, chỉ nhận boolean thật; sai kiểu → bỏ qua = mặc định BẬT)
  → spawnJob: chỉ push "--no-stab-single-thread" khi preset.stabSingleThread === false
  → render.js: mặc định ép -threads 1 vào bước transform của stabilize (hành vi U1 giữ nguyên)
```

- Mặc định **BẬT** (giữ hành vi U1 đã ép). Tắt → lệnh ffmpeg stabilize
  KHÔNG còn `-threads 1`; bật → có đúng 1 lần `-threads 1` ngay trước `-i`
  của file stabilize (xem §2.3).
- Persist qua localStorage, key `vcut-stab-single-thread` (`"1"` = BẬT,
  `"0"` = TẮT), mặc định BẬT khi chưa có key hoặc key lỗi. ExportPanel đọc
  lúc mount, ghi mỗi lần đổi — sống qua đóng/mở panel và reload trang.

### 1.3 i18n: fragment, KHÔNG sửa dict trực tiếp

- Chuỗi mới chỉ nằm trong `apps/web/src/i18n/fragments/round68-v2.json`
  (2 key: `exportPanel.stabSingleThread`, `exportPanel.stabSingleThreadHint`,
  vi + en). UI đọc qua lib `stabSingleThread68V2.ts` (import fragment trực
  tiếp, mẫu jobHistory67U7) nên hiển thị ngay không cần chờ parent gộp dict.
- **Parent cần gộp sau:** dict hiện khóa ở **2369 key**; sau khi gộp 2 key
  fragment này dict thành **2371 key** và phải cập nhật các test đang khóa
  số đó (`i18nAudit59P7`, `i18nOrphans60Q4`). Luồng này KHÔNG sửa các test đó.

### 1.4 Không thêm mã lỗi bridge mới

- Test `bridgeErrors62R5` khóa catalog lỗi bridge ở đúng **102 mã**
  (server catalog == web set == fragment keys, `used.size` == 102).
  Thêm mã `PRESET_STAB_SINGLE_THREAD_INVALID` sẽ phá test khóa này nên
  luồng này KHÔNG thêm mã mới: `parsePreset` chỉ nhận `stabSingleThread`
  khi là boolean thật, giá trị sai kiểu bị bỏ qua → mặc định BẬT.
  An toàn vì boolean không bao giờ được nội suy vào argv (chỉ chọn giữa
  2 dạng argv cố định), khác với `crf`/`x264Preset` cần validate chặt.
  Parent có thể nâng 102 → 103 đồng bộ catalog + web + fragment + dict
  nếu muốn mã lỗi riêng sau này.

## 2. Kiểm chứng (số thật)

### 2.1 Unit test lib — 16/16 PASS

`apps/web/src/lib/stabSingleThread68V2.test.ts` (bundle esbuild → node):

- Fragment 1:1 key, không đụng key fragment khác, kiểm tra pre-merge dict.
- Chuỗi vi/en + fallback.
- load/save round-trip + chịu lỗi store (missing/invalid → BẬT).
- Wiring tĩnh ExportPanel (checkbox + disable khi render + preset JSON)
  và bridge (default true, boolean-only, spawnJob chỉ push flag khi false).
- Guard không thêm mã lỗi mới (catalog 102 giữ nguyên).
- Chạy lại xác nhận sau khi sửa script headed: **16/16 pass**.

### 2.2 TypeScript — tsc `apps/web` 0 lỗi

Chạy `tsc` trong `apps/web`: exit 0, ~77 s. (Lỗi duy nhất trong lần chạy
đầu là `process.cwd()` trong file test — đã sửa bằng cách khai báo
`cwd: () => string`, cùng mẫu `jobHistory67U7.test.ts`.)

### 2.3 Render harness — 11/11 PASS (render thật)

`server/render/src/test_round68_v2_stab_toggle.js` (dry-run + render thật
720p 5 s, media `shakynoisy720.mp4` 42.915.830 byte):

- Dry-run: mặc định → đúng 1 lần `"-threads 1"` ngay trước `-i` của input
  stabilize; `--no-stab-single-thread` → 0 lần; env
  `VCUT_STAB_SINGLE_THREAD=0` → 0 lần; spec thường (không stabilize) → 0 lần.
- Render thật 720p 5 s (loadavg đầu 17,01/11,69/7,12 — máy đang tải cao do
  nhiều luồng song song; cuối 5,85/9,84/7,02):
  - TẮT: 51,6 s, 8.475.559 byte, sha `012ffbf11594…`, log KHÔNG có dòng
    `🧵 stabilize single-thread decode`.
  - BẬT: 45,6 s, 8.398.091 byte, sha `142d4ddbf693…`, log CÓ dòng
    `🧵 stabilize single-thread decode`.
  - Hai bản khác sha (đúng kỳ vọng: `-threads 1` đổi thứ tự decode →
    đầu ra khác nhau ở mức bit; xem thêm giới hạn ở §3.3).
  - Lưu ý: thời gian render bị nhiễu bởi tải nền rất cao (loadavg > 11),
    KHÔNG dùng 51,6 s / 45,6 s để kết luận ON nhanh hơn OFF.

### 2.4 Bridge e2e — ❌ CHƯA CHẠY ĐƯỢC (môi trường chặn, xem §3.1)

`server/bridge/test/test-stab-single-thread-68v2.cjs` đã viết xong
(5 case A–E: preset false/true/vắng mặt/chuỗi `"false"`/crf:99→400,
kiểm argv worker thật qua `ps`, hủy job qua DELETE sau mỗi case),
nhưng **không chạy được** trên VM lúc này. Cần chạy lại khi chính sách
sandbox được nới (xem §3.1).

### 2.5 Headed click-test — ❌ CHƯA CHẠY ĐƯỢC (môi trường chặn, xem §3.2)

`apps/web/scripts/clicktest-68v2-stab-toggle-headed.mjs` đã viết xong
(7 case H0–H7: mount mẫu → toggle hiện + mặc định checked + label/hint →
click chuột thật tắt → localStorage `"0"` → click lại bật → `"1"` →
reload vẫn checked → set LS `"0"` → reload unchecked → dry-run ON/OFF →
0 page error; screenshot `v2-toggle-off.png`, `v2-toggle-off-reload.png`,
`v2-results.json`), nhưng **không chạy được** trên VM lúc này.
Cần chạy lại khi chính sách sandbox được nới (xem §3.2).

## 3. Giới hạn và nợ mở (trung thực)

### 3.1 Sandbox chặn ghi sau khi process tạo listening socket (phát hiện đợt này)

Thí nghiệm có kiểm soát (09/11, ~01:05 +07 trở đi):

- Node HTTP server ghi file bình thường TRƯỚC `listen()`, mọi `write()`
  SAU `listen()` đều fail `EPERM: operation not permitted, write`
  (tạo file vẫn được, file 0 byte; chỉ ghi payload bị chặn). Đóng server
  xong vẫn fail — chặn vĩnh viễn với process đó.
- Process con cũng bị chặn: node tạo Unix socket đang listen rồi spawn
  child ghi file → child fail EPERM (file 0 byte). Đây là luật áp cho
  cả cây process, không phải riêng process tạo socket.
- Đã loại trừ: đường dẫn (`/tmp` vs workspace disk đều fail), sync/async,
  cách spawn (`timeout`, `child_process.spawn`), seccomp count, node
  `-e` vs `node <file>`, spawn binary native (đều ghi được khi chưa
  listen). `strace` cũng bị chặn ghi log (0 byte).
- Hậu quả trực tiếp:
  - **Bridge e2e (§2.4) không chạy được:** bridge phải listen mới nhận
    request; sau listen nó không ghi được upload/spec/job → POST
    `/api/render` trả 500 `INTERNAL_ERROR`
    (`[bridge] unhandled error POST /api/render: Error: EPERM...`,
    rate-limit persist EPERM mỗi 5 s). Log file bridge trống (stdout
    cũng bị chặn sau listen). Bridge chết giữa test (lúc đó free RAM
    348 MB — có thể do cùng chính sách hoặc áp lực bộ nhớ).
  - **Vite dev:** config ESM bị bundle rồi ghi file tạm
    (`vite.config.mjs.timestamp-*.mjs`, 0 byte) → EPERM. Đã vòng qua
    bằng config **CommonJS** `vite.config.cjs` (vite compile trong bộ
    nhớ, không ghi đĩa — đã xác nhận vite lên được, "ready in 435 ms").
    Lỗi còn lại `runOptimizeDeps` EPERM (vite ghi optimized deps sau
    khi listen) là không fatal — server vẫn phục vụ nhờ cache
    `node_modules/.vite/deps/` có sẵn từ trước.
  - **Quy tắc từ giờ:** mọi ghi file trong session này phải dùng
    file-tools (`muse.write`/`muse.edit`), KHÔNG dùng exec redirect/heredoc.

### 3.2 Không browser nào chạy được trên VM lúc này (phát hiện đợt này)

- **Xvfb chết ngay (exit 1):** Xvfb tạo display socket trước, rồi spawn
  `xkbcomp` để biên dịch keymap — xkbcomp (con) bị chặn ghi
  `/var/lib/xkb/server-<display>.xkm` → `XKB: Failed to compile keymap`
  → `Fatal server error: Failed to activate virtual core keyboard`.
  Chạy tay `xkbcomp` từ shell ghi được bình thường (cả `/var/lib/xkb/`
  lẫn workspace) — chỉ con của Xvfb mới bị chặn, đúng luật §3.1.
  `-xkbdir` không đổi được thư mục output. Các socket X170–X246 còn lại
  trong `/tmp/.X11-unix/` đều là stale (không còn process Xvfb nào sống).
- **Chrome (mọi biến thể) SIGTRAP — exit 133:** `chromium-1254`,
  `chromium-1187`, `chrome-headless-shell-1254`, kể cả với
  `--single-process`, `--no-zygote`, `--disable-seccomp-filter-sandbox`,
  `--disable-crashpad`. Strace cho thấy
  `mmap(NULL, 65568, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0) = -1 EPERM`
  rồi Chrome tự trap (CHECK fail trong khởi tạo sandbox). Đây là chặn
  ở mức sandbox ngoài, không vòng qua được bằng cờ Chrome.
- **Firefox (`firefox-1572`)** headless + remote-debugging cũng thoát
  lặng lẽ, không log, không mở port.
- Script headed đã có fallback `--headless=new` khi Xvfb chết (click
  chuột thật qua CDP không đổi), nhưng fallback cũng không chạy được
  vì Chrome crash trước khi mở CDP. **H0–H7 phải chạy lại khi VM cho
  phép browser chạy trở lại** (hoặc chạy trên máy khác).
- Không dùng jsdom thay thế: repo không có vitest/jsdom/testing-library
  trong devDeps; cài thêm sẽ đổi package.json/lockfile ngoài phạm vi
  luồng. Toggle đã được kiểm chứng bằng unit test wiring tĩnh (§2.1)
  + render harness (§2.3) — đó là mức kiểm chứng cao nhất làm được
  trong môi trường hiện tại.

### 3.3 Các lưu ý khác

- Hai bản render ON/OFF khác sha (§2.3) là đúng kỳ vọng (decode đơn
  luồng đổi thứ tự xử lý), không phải bug. Chưa đo PSNR/SSIM giữa 2 bản.
- Thời gian render 51,6 s vs 45,6 s đo dưới loadavg > 11 (nhiều luồng
  song song) — không kết luận ON nhanh hơn OFF; cần đo lại trên máy rảnh.
- Toggle chỉ ảnh hưởng bước transform của stabilize (phạm vi U1); các
  bước khác của render không bị `-threads 1`.
- Env `VCUT_STAB_SINGLE_THREAD=0` và CLI `--no-stab-single-thread` (U1)
  vẫn hoạt động; toggle UI là lớp trên cùng, đi qua preset bridge.
- File `apps/web/src/i18n/fragments/round68-v2.json` là fragment — parent
  gộp vào dict sau (2369 → 2371 key, xem §1.3).

## 4. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/bridge/src/index.js` — parsePreset + spawnJob + fallback preset.
- `apps/web/src/i18n/fragments/round68-v2.json` — 2 key vi/en (mới).
- `apps/web/src/lib/stabSingleThread68V2.ts` — lib load/save + strings (mới).
- `apps/web/src/lib/stabSingleThread68V2.test.ts` — 16 test (mới).
- `apps/web/src/ExportPanel.tsx` — checkbox + preset JSON.
- `server/render/src/test_round68_v2_stab_toggle.js` — harness dry-run + render thật (mới).
- `server/bridge/test/test-stab-single-thread-68v2.cjs` — e2e bridge 5 case (mới, chưa chạy được).
- `apps/web/scripts/clicktest-68v2-stab-toggle-headed.mjs` — headed H0–H7 (mới, chưa chạy được; đã có fallback headless).
- `docs/PHASE9_ROUND68_V2_STAB_TOGGLE_LIMITS.md` — tài liệu này.

Không stage: ảnh chụp headed (binary), file vite config `.cjs`/`.mjs` trong
`hidden_files/round68-v2/` (chỉ dùng cho test, không thuộc repo), thư mục
scratch `/tmp/round68-v2/`, `/home/hatch/workspace/.scratch-r68v2-a8m2Ne`.

## 5. Ghi chú cho parent

1. Gộp fragment: 2 key → dict 2369 thành 2371; cập nhật test khóa số key
   (`i18nAudit59P7`, `i18nOrphans60Q4`).
2. Chạy lại khi môi trường cho phép: bridge e2e
   (`node server/bridge/test/test-stab-single-thread-68v2.cjs`) và headed
   (`node apps/web/scripts/clicktest-68v2-stab-toggle-headed.mjs`).
3. Tùy chọn: nâng catalog lỗi bridge 102 → 103 nếu muốn mã riêng cho
   preset `stabSingleThread` sai kiểu (đồng bộ catalog + web + fragment + dict).
4. Không push từ session nền; chỉ push khi user nhắn "push đi" ở main chat
   (đúng luật vòng lặp).

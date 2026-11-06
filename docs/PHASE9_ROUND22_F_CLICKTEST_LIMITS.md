# Phase 9 đợt 22 — Luồng F: click-test browser cho nested ramp — LIMITS

Ngày: 2026-10-29. Luồng F trong đợt lớn round 22.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa dist,
KHÔNG sửa code sản phẩm (store, preview, video-spec, panel),
KHÔNG cài dependency, KHÔNG thêm Playwright.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).

Đóng nợ đợt 21 T4 §3: "Panel CHƯA click-test trên browser thật"
(T4 đã thử Playwright nhưng repo không có runner nên dừng).
Nợ này nay ĐÃ có bằng chứng DOM thật cho đường chính (tạo curve
mới + đổi chế độ trim), nhưng CHƯA đóng hết — xem §3.

## 1. Việc đã làm

### 1a. Harness mới (chỉ thêm file, không sửa code sản phẩm)

`apps/web/scripts/clicktest-nested-ramp-pipe.mjs` — click-test tối
giản, không dependency mới, tái dùng hướng đợt 18:

- Chrome headed dưới Xvfb (1920x1080x24) qua
  `--remote-debugging-pipe`: CDP đi qua fd 3 (ghi JSON + byte NUL) /
  fd 4 (đọc, tách bằng byte NUL), không qua cổng TCP (blocker cổng
  CDP của đợt 17 vẫn còn — pipe là đường duy nhất đã chứng minh
  được trên VM này).
- Click THẬT bằng `Input.dispatchMouseEvent` (mousePressed +
  mouseReleased, modifiers CDP — Shift = 8 cho Shift+click).
  Chỉ khi CDP Input lỗi mới fallback `element.click()` và case đó
  phải ghi rõ `js-click-fallback`. Trong cả 2 lần chạy xanh, mọi
  click đều là `cdp-input`, không có fallback nào.
- Editor chạy bằng `vite preview` của build sẵn `apps/web/dist`
  (KHÔNG build lại, KHÔNG sửa dist). Harness tự kiểm tra dist chứa
  chuỗi `curveCreate` trước khi chạy; nếu dist cũ hơn code round 21
  thì dừng ở mức BLOCKER, không báo fail giả cho code cũ.
- Thoát mã rõ: 0 = mọi case pass; 1 = có case fail trên UI thật;
  2 = blocker hạ tầng (pipe/Chrome/preview/dist không lên — khi đó
  KHÔNG có kết quả click-test nào, không bịa).
- Log đo được: stdout theo từng case + JSON
  `benchmarks/results/clicktest-nested-ramp-r22.json` (file chạy,
  parent quyết có stage hay không).

Cách chạy (từ gốc repo):

```
node apps/web/scripts/clicktest-nested-ramp-pipe.mjs
```

Biến môi trường: `CLICK_DISPLAY` (mặc định `:97`),
`CLICK_PORT` (mặc định `4197`),
`CLICK_CHROME_BINS` (mặc định Playwright Chromium 156 rồi
meta-chromium 152 làm fallback).

### 1b. Luồng click đi qua UI hoàn toàn (không seed state)

Từ project mẫu (`loadSample`: 2 clip video trên track v1, 0–4s và
4–8s), harness click thật từng bước:

1. Click clip video 1, Shift+click clip video 2 → cả 2 selected.
2. Bấm nút Nested trên Timeline → panel mở, nút gộp enabled.
3. Bấm "Gộp thành compound clip" → panel liệt kê "Compound clip 1",
   timeline có `.tl-clip.clip-nested`.
4. Click lên clip-nested trên timeline → class `selected`.
5. Bấm "Tạo curve tốc độ hằng 1×" (block đợt 21 T4) → block tạo ẩn,
   block chế độ (đợt 20 R4) hiện ngay, msg thành công, trim giữ
   nguyên [0, 8).
6. Đổi radio sang "Giữ trim, tính lại duration" → preview chuyển
   dạng giữ-trim [0, 8), bấm "Áp curve theo chế độ đã chọn" → msg
   `curveModeAlreadyOk` (clip hợp lệ nên không đổi spec — đúng hành
   vi kỳ vọng, không phải "không có gì xảy ra"), panel còn sống.
7. Đếm `Runtime.exceptionThrown` trong suốt phiên = 0.

Việc tắt modal chào lần đầu bằng `localStorage.setItem(
"vcut-welcomed", "1")` + reload là bước setup, KHÔNG phải bước test
(modal đó không thuộc phạm vi luồng này).

## 2. Kiểm chứng thật

| Lần chạy (giờ VN 29/10) | Kết quả |
|---|---|
| 20:15 (lần đầu xanh) | **8/8 case pass, exit 0** — mọi click `cdp-input` |
| 20:17 (chạy lại, sau khi vá lỗi cổng — xem §4) | **8/8 case pass, exit 0** — mọi click `cdp-input` |

| Case | Nội dung | Kết quả |
|---|---|---|
| C0-sample-load | Project mẫu load xong, ≥ 2 clip video trên timeline | PASS (2 clip, id `c_w6kv0iz`, `c_v5f65yl` ở lần chạy đầu) |
| C1-shift-select | Click + Shift+click → 2 clip cùng selected | PASS |
| C2-open-panel | Nút Nested → panel mở, nút gộp enabled | PASS |
| C3-nest | Gộp → panel liệt kê "Compound clip 1", timeline có clip-nested | PASS |
| C4-select-nested | Click clip-nested trên timeline → class selected | PASS |
| C5-create-curve | Tạo curve hằng 1× → block tạo ẩn, block chế độ hiện, trim giữ [0, 8) | PASS |
| C6-mode-fixedTrim | Đổi radio giữ-trim → preview đổi, áp → alreadyOk, panel còn sống | PASS |
| C7-no-crash | 0 `Runtime.exceptionThrown` trong phiên | PASS |

Điều kiện đo (ghi để đối chiếu, không đoán):

- Binary: Playwright Chromium 156.0.8078.4
  (`~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`),
  headed, Xvfb 1920x1080x24. Meta-chromium 152 là fallback trong
  code nhưng CHƯA được thử trong đợt này (binary đầu tiên đã thành
  công nên script dừng ở đó, giống mẫu đợt 18).
- Dist dùng ở lần chạy cuối: bundle `index-B6D3m0qx.js`,
  sha256[:16] = `bc5f4e0fac99a61d`, chứa chuỗi `curveCreate`
  (tức build từ code round 21 trở lên). Lưu ý: trong lúc luồng này
  chạy, tên bundle dist đổi qua 3 lần (`DV5xuT9v` → `CNZNBSGE` →
  `B6D3m0qx`) — có luồng round 22 khác đang build lại dist song
  song; harness chỉ khẳng định bundle nó đã phục vụ có chứa code
  round 21, không khẳng định dist ổn định giữa các lần chạy.
- Viewport 1920x1080, cửa sổ Chrome 1920x1080, Xvfb không có GPU
  thật (raster phần mềm) — kết quả là "UI phản hồi đúng trên
  trình duyệt headed của VM", KHÔNG phải bằng chứng hiệu năng hay
  hiển thị trên màn hình thật của user.

## 3. Giới hạn trung thực — những gì CHƯA click-test

### 3a. PHÁT HIỆN SẢN PHẨM (không sửa — ngoài phạm vi luồng):
cổng load web từ chối project chứa nested clip

Harness ban đầu định seed project qua autosave (ghi envelope
`.vcut.json` vào `localStorage` key `vcut-studio:autosave:v1` rồi
reload để App khôi phục). Seed đã vào localStorage đúng (diag
in ra đúng head envelope), nhưng timeline vẫn rỗng và app rơi về
project mẫu. Nguyên nhân đã kiểm chứng bằng code thật (không chỉ
đọc code): `validateClipDeep` trong
`apps/web/src/lib/projectRepo.ts` KHÔNG có nhánh `kind: "nested"`
nên mọi clip nested rơi vào nhánh else → lỗi
`tracks[0].clips[0]: kind không hỗ trợ: "nested"`. Probe Node
(esbuild bundle + node, /tmp, không đưa vào repo):

```
nested errors: ["tracks[0].clips[0]: kind không hỗ trợ: \"nested\"."]
plain errors:  []
```

Hệ quả: project đã có nested clip (tạo trong phiên, autosave ghi
đúng) sẽ BỊ RỚT khi reload — `loadAutosave` trả null, App rơi về
`loadSample`. Tương tự, file `.vcut.json` đã lưu có nested clip sẽ
bị `parseProjectText` từ chối khi mở lại. Đây là lỗi sản phẩm cần
luồng khác vá (thêm nhánh nested vào `validateClipDeep`, kèm test
hồi quy) — luồng này CỐ TÌNH không sửa vì nhiệm vụ cấm chạm code
sản phẩm. Parent cần chuyển phát hiện này cho luồng phù hợp, đừng
để nó chìm trong LIMITS này.

### 3b. Case ramp 1→2 và nested tốc độ ≠ 1 CHƯA click-test

Vì seed qua autosave bị chặn (§3a) và UI không tạo được hai dạng
này nên chúng không có trong harness:

- Nested mang curve ramp 1→2: UI chỉ tạo được curve hằng 1× qua nút
  đợt 21 T4; không có đường UI nào đặt ramp lên nested clip
  (SpeedPanel không mount cho nested). Chế độ trim với curve ramp
  vẫn chỉ được khóa ở tầng store/test (đợt 21 T4), chưa có bằng
  chứng DOM thật.
- Nested tốc độ hằng ≠ 1 (trường hợp tạo curve làm trim.out đổi
  8 → 4 như LIMITS T4 §3): UI không đổi được `speed` của nested
  clip (Inspector speed chỉ nhận video/audio), nên preview dạng
  "trim.out cũ → mới" của block tạo CHƯA được click-test — chỉ
  dạng "trim giữ nguyên" đã click-test (C5).
- Khi §3a được vá, harness có thể quay lại đường seed autosave để
  bổ sung đúng 2 case này mà không cần đổi kiến trúc (seed spec 3
  clip đã viết sẵn trong lịch sử làm việc của luồng này nhưng đã
  gỡ khỏi script để tránh đường seed hỏng gây fail giả — parent
  có thể yêu cầu khôi phục khi validator đã nhận nested).

### 3c. Những gì khác chưa bao phủ

- Gộp từ clip chữ (text leaves): luồng click chỉ gộp 2 clip video
  mẫu. Gộp clip chữ, gộp khác track, gộp clip đã có transition —
  chưa click-test (đường store `nestClips` thì đã có test riêng).
- Scrub chuột kéo-thả trên timeline: thuộc LUỒNG C đợt 22, không
  thuộc harness này. Harness này chỉ click rời rạc (pressed +
  released cùng tọa độ, không kéo); KHÔNG nhận công của luồng C.
  Hạ tầng click CDP Input ở đây (PipeCdp + clickRect + modifiers)
  có thể tái dùng cho luồng C nếu họ cần, nhưng đó là việc của họ.
- Preview canvas / phát video: không assert khung hình, không đo
  FPS — preview của nested clip không nằm trong phạm vi click-test
  UI này.
- Undo sau khi tạo curve (1 bước undo về 0 curve — test C2 của T4
  ở tầng store): chưa bấm Ctrl+Z trên browser thật.
- Modal chào lần đầu: bị tắt bằng localStorage ở bước setup, chưa
  click-test đường đóng modal.
- Responsive/mobile, viewport khác 1920x1080, binary meta-chromium
  152 qua pipe: chưa thử (xem §2 — script dừng ở binary đầu tiên
  thành công).
- `dist/` tái tạo bởi luồng khác trong lúc chạy: harness chỉ đọc,
  không build; bundle phục vụ ở lần chạy cuối đã ghi ở §2.

## 4. Lỗi của chính harness đã gặp và đã sửa (ghi để lần sau khỏi vấp)

1. **Socket Xvfb mồ côi:** lượt chạy trước bị SIGTERM làm rò
   socket `/tmp/.X11-unix/X97` nhưng tiến trình Xvfb đã chết;
   harness cũ thấy socket tồn tại thì "dùng chung" → Chrome mới
   không có X server nên thoát ngay, ghi vào pipe chết gây crash
   Node `ECONNRESET` unhandled (làm rò cả vite preview cổng 4197).
   Đã sửa: chỉ dùng chung khi `pgrep -f "Xvfb :97"` thấy tiến
   trình còn sống; ngược lại xoá socket mồ côi và bật Xvfb mới.
2. **Pipe stdio không có error handler:** mọi pipe stdio của Chrome
   nay đều có handler `error` noop + `proc.on("error")`, để Chrome
   chết sớm thì `send()` reject có kiểm soát và khối `finally`
   vẫn dọn dẹp, thay vì crash process trước khi dọn.
3. **Cổng preview bị chiếm:** nếu cổng đã có tiến trình khác phục
   vụ (vite preview rò từ lượt crash), harness nay báo BLOCKER rõ
   ràng và gợi ý đổi `CLICK_PORT`, thay vì để vite mới chết vì
   `--strictPort` rồi báo BLOCKER chung chung. Lần chạy lại sau khi
   giết đúng tiến trình rò (pid vite preview cổng 4197 của chính
   luồng này — KHÔNG giết tiến trình của luồng khác, vd cổng 4186
   / display :98 đang chạy song song) đã xanh trở lại 8/8.
4. **Lỗi cú pháp do sửa vội:** executor của Promise trong
   `startVitePreview` ban đầu không phải async nhưng chứa `await`
   (lỗi `SyntaxError: Unexpected reserved word`) — đã sửa thành
   executor async và kiểm tra bằng `node --check` trước khi chạy.

## 5. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- Mới: `apps/web/scripts/clicktest-nested-ramp-pipe.mjs` (harness
  click-test, ~600 dòng, chỉ đọc dist + điều khiển Chrome, không
  sửa gì khác).
- Mới: `docs/PHASE9_ROUND22_F_CLICKTEST_LIMITS.md` (file này).
- Mới (file chạy): `benchmarks/results/clicktest-nested-ramp-r22.json`
  (kết quả lần chạy cuối 8/8 pass + log đầy đủ; parent quyết có
  stage hay không).

KHÔNG ĐỔI (cố tình, theo phân công luồng):

- Mọi file sản phẩm (`store.ts`, `Timeline.tsx`,
  `NestedClipPanel.tsx`, `nestUtils.ts`, `projectRepo.ts`,
  `video-spec`, preview, i18n) — kể cả `projectRepo.ts` dù §3a đã
  chỉ rõ lỗi ở đó.
- `apps/web/dist/` — chỉ đọc qua `vite preview`, không build lại.
- Không push, không tag/release, không ghi qua GitHub, không stage
  paths-loop, không sửa build-loop-log.md.
- Không cài dependency, không thêm Playwright, không đưa binary
  vào repo.

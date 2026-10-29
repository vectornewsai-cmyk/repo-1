# Phase 9 đợt 21, luồng T5 — LIMITS: vòng rAF preview + MixerMeter ngủ khi idle

> Luồng T5 đợt 21. Repo làm việc: `~/workspace/repo-1`, KHÔNG push
> GitHub, KHÔNG release/tag, KHÔNG code giả. Trả nợ đợt 20 R5 §7:
> vòng rAF preview chạy liên tục khi đứng yên + MixerMeter rAF chạy
> luôn, kèm click-test seek/pause/scrub sau khi cho ngủ.
> **Mọi số dưới đây đều đo trên VM này (2 vCPU, Xvfb, raster phần mềm,
> không GPU thật) và CẤM trích thành FPS trên máy user** — xem §6.

## 0. Kết luận ngắn (không vượt số đo)

1. **Ngủ thật, đo được trực tiếp:** sau khi sửa, lúc đứng yên cả 2
   vòng đều 0 tick: preview `0 tick/s`, MixerMeter `0 tick/s`,
   `sleeping = true`, draws = 0, frame đóng băng — ở cả idle ban đầu
   (sau bản vá §3), idle sau phát→dừng, sau scrub, sau tua 1 frame,
   và sau resize viewport (2 run click-test, 7/7 check mỗi run, §2).
2. **Tỉnh lại đúng:** phát (Space) → ticks chạy lại, playhead + pixel
   đổi; dừng → ngủ lại; scrub (phím L) / tua 1 frame (ArrowRight) →
   tỉnh đúng 1–vài tick, vẽ đúng frame mới, rồi ngủ lại (§2, §4).
3. **Phát hiện giữa đường (đã vá, có bằng chứng):** bản sửa đầu tiên
   KHÔNG ngủ ở idle ban đầu (ticks ~15/s suốt 60 s, draws = 0, trạng
   thái cân bằng `{lastDrawn: null, lastRequested: 0}`) vì cờ vẽ lại
   `redrawFlag` reset `lastDrawn` nhưng giữ `lastRequested`, guard R14
   chặn request mới vĩnh viễn. Sau khi reset cả 2 + hủy seek cũ +
   generation guard, idle ban đầu chỉ còn 6 tick rồi ngủ suốt 60 s
   (§3). Đây là bug của chính bản sửa đầu, không phải hành vi cũ —
   đã vá và đo lại, không giấu.
4. **KHÔNG claim tăng FPS phát:** tốc độ rAF của trang lúc idle sau
   sửa cao hơn hẳn trước sửa (probe ~55–60 Hz so với ~6–11 Hz), nhưng
   đây là 2 đợt chạy khác nhau, tải nền khác nhau, không phải A/B
   trong cùng 1 run — và R5 đã chứng minh FPS phát trên VM này bị
   trần bởi raster Xvfb, không phải JS. Con số duy nhất được claim
   chắc chắn là **số tick của chính 2 vòng lặp → 0 khi idle** (§5).
   Lúc phát, tốc độ vẽ không đổi về bản chất (vòng phát vẫn vẽ mỗi
   frame như cũ; play 3 s đo được ~11–12 draw/s trong 1 run, trong
   dải R5 — không đo lại FPS phát có hệ thống vì ngoài phạm vi).

## 1. Thay đổi (chỉ 2 file sản phẩm + hook đo)

### `apps/web/src/preview.tsx` — vòng lặp preview ngủ

- Vòng lặp không còn đặt rAF tiếp theo ngay đầu tick. Cuối mỗi tick,
  `scheduleNext()` chỉ đặt rAF tiếp khi còn việc; nếu không thì đặt
  cờ `sleeping` và dừng. Điều kiện ngủ yêu cầu ĐỦ cả 5 điều:
  không phát + không có seek đang bay (`pendingSeek`) + playhead đã
  vẽ xong (`lastDrawn === playhead`) + seek cho playhead đó đã hoàn
  tất (`lastRequested === playhead` — khi seek lỗi, `lastRequested`
  bị reset null nên loop KHÔNG ngủ mà tick tiếp để thử lại, không
  kẹt ngủ với frame sai) + không có cờ vẽ lại (`redrawFlag`).
- Đánh thức bằng: `useStore.subscribe` (mọi đổi trạng thái; spec/
  media/selection đổi identity thì đặt `redrawFlag` để ép vẽ lại ở
  cùng playhead), `ResizeObserver` trên wrap, và sự kiện `resize`
  cửa sổ. Khi tỉnh, `last` được reset để tránh dt đột biến.
- Vá kèm theo (bắt buộc vì ngủ, nếu không sẽ trắng canvas):
  canvas resize (gán lại width/height xóa bitmap) ép vẽ lại bằng
  cách reset cả `lastDrawn` + `lastRequested` — nhánh pause trước
  đây chỉ vẽ khi playhead đổi nên resize trong lúc ngủ sẽ để lại
  canvas trắng nếu không có vá này. Đã kiểm chứng sống bằng đổi
  viewport (§4).
- Vá `redrawFlag` (§3): reset cả `lastRequested` + `cancel()` seek
  cũ trước khi request mới, và generation guard (`seekGen`) để
  `.then` của request cũ không xóa `pendingSeek` của request mới
  khi cùng playhead (so sánh bằng giá trị t không phân biệt được
  request cũ/mới ở cùng t).
- Trường hợp chưa có canvas/wrap: giữ hành vi cũ là tick tiếp
  (không ngủ khi frame chưa từng vẽ).
- PreviewCanvas subscribe thêm `playing` qua selector để truyền
  xuống MixerMeter (re-render nhẹ khi toggle play; effect vòng lặp
  có deps [] nên không bị khởi động lại).

### `apps/web/src/components/MixerMeter.tsx` — meter ngủ

- Thêm prop tùy chọn `isPlaying` (undefined = hành vi cũ luôn chạy
  rAF, để không phá caller chưa cập nhật; PreviewCanvas luôn truyền
  rõ). Khi `isPlaying === false`: effect chỉ vẽ 1 mẫu tĩnh (analyser
  nếu có thì đọc 1 lần ra mức im lặng ~0, không thì hiện idle),
  reset peak về mức hiện tại (peak-hold chỉ có ý nghĩa khi phát),
  rồi KHÔNG đặt rAF. Tỉnh lại khi `isPlaying` đổi sang true
  (effect chạy lại) hoặc khi có gesture pointerdown/keydown mở
  graph trong lúc pause (vẽ lại 1 mẫu, vẫn không đặt rAF).
- Logic vẽ 1 mẫu (`paintOnce`) tách ra từ thân vòng lặp cũ, giữ
  nguyên công thức RMS/peak/dBFS — không đổi ngữ nghĩa hiển thị
  khi phát.

### Hook đo (không phải tính năng người dùng)

- `window.__vcutPreviewIdle` = `{ticks, sleeping, lastDrawn,
  lastRequested, pendingSeek, redrawFlag}` — chụp cuối mỗi tick để
  script đo chẩn đoán được "vì sao chưa ngủ".
- `window.__vcutMixerMeter` = `{ticks, sleeping}`.
- Cả 2 đều bị xóa khi component unmount (nếu đúng object của mình).
  Không có code sản phẩm nào đọc 2 hook này; chúng chỉ tồn tại để
  đo, và có thể xóa sau mà không đổi hành vi.

## 2. Đo trước/sau — cùng phương pháp đợt 19 G4 / đợt 20 R5

- Hạ tầng: Playwright Chromium 156 headed dưới Xvfb 1920×1080×24,
  điều khiển qua `--remote-debugging-pipe` (hướng đợt 18; cổng CDP
  TCP không mở được trên VM này), build thật `apps/web/dist` chạy
  bằng `vite preview` (cổng 4185, display :94/:93), project mẫu tự
  load (2 clip webm 640×360 tự ghi + 1 clip chữ, 1280×720@30fps,
  8 s), canvas 1351×512, dpr = 1, probe WebGL = `no-webgl` (như các
  đợt trước, không claim backend raster).
- Kênh đo: (a) hook ticks/sleeping TRỰC TIẾP của 2 vòng (chỉ có ở
  bản sau; bản trước báo hooks = absent, không bịa ticks);
  (b) probe draw qua identity-setTransform (renderFrame gọi đúng 2
  lần/frame); (c) vòng rAF riêng của trang do script cài thêm;
  (d) panel FPS của app (chỉ ở IDLE-B, khi panel mở).
- Mỗi run: IDLE-A (panel FPS ĐÓNG, 5 s) → IDLE-B (panel MỞ, 5 s) →
  click-test: Space phát 3 s → Space dừng + settle 3 s → scrub →
  settle 3 s → ArrowRight 1 frame → settle 2 s.
- Tải máy ghi rõ từng run (loadavg 1 phút đầu/cuối run, xem §7).

### Trước sửa (bundle `index-DXK5O_F1.js`, 2 run, ok 2/2)

| Run | IDLE-A panel-đóng: probe rAF | IDLE-B panel-mở: probe rAF / panel idle | Draws idle | Hooks |
|---|---|---|---|---|
| 1 (load 2,21→3,84) | 6,0 Hz | 11,2 Hz / panel avg 10,8 | 0/s | absent (đúng kỳ vọng) |
| 2 (load 4,09→5,37) | 10,6 Hz | 8,0 Hz / panel avg 8,8 | 0/s | absent |

- Click-test bản trước: 7/7 check mỗi run (phát đổi pixel + đồng hồ,
  dừng đóng băng frame, scrub đổi frame, tua 1 frame vẽ thêm 1 draw).
  Đây là baseline hành vi để hồi quy, không phải số hiệu năng.
- Dị thường ghi nhận ở bản trước (xem §5): sau scrub, probe rAF
  nhảy lên ~58 Hz trong khi draws vẫn 0 — lúc đó chưa giải thích
  được; sau sửa, hiện tượng này trở thành trạng thái thường trực
  (probe ~55–60 Hz ở mọi cửa sổ idle) nên không còn là dị thường
  theo pha nữa, xem §5.

### Sau sửa, bản cuối (bundle `index-C_4PT5In.js`, 2 run, ok 2/2)

| Run | IDLE-A: preview / mixer ticks | IDLE-B: preview / mixer ticks | Panel idle (app) | Draws idle |
|---|---|---|---|---|
| 1 | 0/s, sleeping=true / 0/s, sleeping=true | 0/s, sleeping=true / 0/s, sleeping=true | avg 55,2 (1s gần nhất 56,0) | 0/s |
| 2 | 0/s, sleeping=true / 0/s, sleeping=true | 0/s, sleeping=true / 0/s, sleeping=true | avg 54,7 (1s gần nhất 56,0) | 0/s |

- Tổng ticks preview từ lúc mount đến hết IDLE-B chỉ 10 (run1) /
  7 (run2) — tức vòng chỉ chạy lúc mount + vẽ frame đầu + vẽ lại
  sau khi sample load xong, rồi ngủ hẳn. MixerMeter 0 tick trong
  toàn bộ các cửa sổ idle (chưa phát lần nào nên analyser = null,
  meter ở trạng thái idle tĩnh).
- Click-test bản cuối (2/2 run, 7/7 check mỗi run):
  - Phát 3 s: đồng hồ TopBar tăng 2/2 mẫu, pixel đổi 2/2 mẫu,
    preview ticks +34/+36, mixer ticks +34/+36 (meter chạy lại khi
    phát — đúng thiết kế), `sleeping = false`.
  - Dừng + settle 3 s: time/px/draws đóng băng, preview ticks
    +0, mixer ticks +0, `sleeping = true` cả 2 vòng.
  - Scrub: time 00:04.3 → 00:08.0 (xem lưu ý ruler ở §5), px đổi,
    draws +1, sau đó settle 3 s ticks +0, `sleeping = true`.
  - ArrowRight ở cuối timeline (playhead đã ở 8,0 = duration nên
    bị clamp, không đổi frame — đúng hành vi cũ): tỉnh đúng 1
    tick, không vẽ thêm draw thừa, ngủ lại ngay.

## 3. Chẩn đoán idle ban đầu không ngủ (bản sửa đầu) — đã vá

Triệu chứng (script chẩn đoán riêng, 60 s idle, mẫu mỗi 5 s):
ticks ~15/s đều đặn, draws = 0, trạng thái chụp cuối tick ổn định
`{lastDrawn: null, lastRequested: 0, pendingSeek: false,
redrawFlag: false}` suốt 60 s; phím Home cùng playhead cũng không
vẽ (ticks +178/3 s mà draws vẫn 0). Không có console error hay
exception nào trong 20 s idle (gom qua CDP Runtime/Log: 0 event).

Chuỗi suy luận khóa: `pendingSeek = false` ⇒ request seek đã
settle; `lastRequested = 0` ⇒ `.then` không đi nhánh reset
(không phải seek lỗi); `lastDrawn = null` ⇒ `.then` cũng không
vẽ — kết hợp với việc `redrawFlag` là code mới duy nhất reset
`lastDrawn` mà không reset `lastRequested`: sau khi frame đầu vẽ
xong (`lastDrawn = lastRequested = 0`), sample load hoàn tất đổi
identity media/spec → subscribe đặt `redrawFlag` → tick tiếp theo
reset `lastDrawn = null` → guard R14 (`t !== lastRequested`)
chặn request mới cho cùng t = 0 vĩnh viễn → cân bằng chết.
(Không khẳng định 100% trigger là sample-load — chỉ khẳng định
cơ chế guard-block, vì trạng thái đo được khớp đúng cơ chế này
và bản vá đúng cơ chế đó đã làm idle ban đầu ngủ được.)

Bản vá (trong file của luồng này, không chạm seek.ts hay store):
`redrawFlag` → `cancel()` seek cũ + reset cả `lastDrawn` và
`lastRequested` về null; `.then` có generation guard. Đo lại
(script chẩn đoán 60 s): idle ban đầu chỉ 6 tick rồi
`sleeping = true` suốt 60 s (`lastDrawn = 0, lastRequested = 0`);
Home cùng playhead tốn đúng 1 tick rồi ngủ lại, frame không đổi
(đúng — cùng playhead thì frame cũ vẫn đúng).

## 4. Kiểm chứng resize (vá canvas trắng) — đo sống

Dùng CDP `Emulation.setDeviceMetricsOverride` đổi viewport khi
vòng đang ngủ (sau phát→dừng, diag-2):
- 1920×1080 → 1280×720: canvas 1351×512 → 712×296, draws +1
  (vẽ lại frame đúng), ticks +5 rồi `sleeping = true` lại, px đổi
  sang frame ở cỡ mới.
- Khôi phục 1920×1080: canvas về 1351×512, draws +1, px quay lại
  đúng hash frame cũ (12847916) — vẽ lại xác định, không phải
  frame rác.
- Lưu ý: thử đổi `wrap.style.width` trực tiếp qua runtime DOM
  KHÔNG làm wrap đổi cỡ thật (layout cha khống chế) nên canvas
  không đổi và vòng không tỉnh — đó là test sai, không phải lỗi
  sản phẩm; test viewport ở trên mới là kiểm chứng thật.

## 5. Dị thường + giới hạn đo (khai trung thực, không giấu)

1. **Ruler click không scrub được qua automation (cả trước và sau
   sửa):** click vào `.tl-ruler` ở 50% chiều rộng (đã clamp vào
   viewport, tọa độ 572,705 trong cửa sổ 1920×1080, rect ruler
   840×27 tại x=152 y=692) không đổi playhead ở cả 4 run đo;
   script fallback sang phím L (+5 s, đường người dùng thật qua
   App keydown) và scrub-check đạt qua đường đó. Nguyên nhân chưa
   truy nguyên (CDP mouse có thể không tạo đủ PointerEvent cho
   handler ruler dùng pointer capture, hoặc có element phủ lên —
   chưa kiểm chứng). Hậu quả: **scrub bằng click ruler CHƯA được
   kiểm chứng tự động**; chỉ mới kiểm chứng seek qua phím L và
   tua frame qua ArrowRight. Không claim "scrub chuột đã test".
2. **Probe rAF idle sau sửa ~55–60 Hz (trước sửa ~6–11 Hz):**
   probe rAF là vòng của chính script đo + (ở IDLE-B) vòng panel
   FPS của app — cả 2 đều không phải vòng sản phẩm. Khi preview +
   meter đã 0 tick mà probe vẫn 58–60 Hz, chứng tỏ tốc độ probe
   không đo được "compositor có ngủ không" khi còn bất kỳ vòng
   rAF nào đang chờ. Claim đúng là: **phía app không còn vòng rAF
   nào chạy khi idle** (preview 0 + meter 0; panel FPS chỉ chạy
   khi user mở panel). Trên máy user không có script đo, trang
   idle sẽ không còn rAF chờ nào từ editor — compositor được
   nghỉ thật; nhưng con số "nghỉ bao nhiêu" không đo được trên
   VM này vì script đo tự nó giữ compositor tỉnh. Đừng trích
   "probe 58 Hz" thành FPS idle của app.
3. **Panel FPS idle sau sửa (~55) cao hơn trước (~9–11) KHÔNG
   được claim là "nhanh hơn":** panel đo tốc độ vòng rAF của chính
   nó, không phải tốc độ vẽ; và 2 đợt chạy khác thời điểm, khác
   tải nền. Cơ chế hợp lý nhất (meter ngừng ghi style mỗi tick
   nên paint rẻ đi) chỉ là suy luận, không phải kết luận đo được
   — muốn claim phải làm A/B trong cùng 1 run (bật/tắt ngủ bằng
   cờ), chưa làm.
4. **Dị thường 58 Hz sau scrub ở bản trước (§2):** nay hiểu thêm
   một nửa — tốc độ probe không gắn với ticks preview (sau sửa,
   ticks = 0 mà probe vẫn ~60 Hz) nên nó không phải bằng chứng
   cho hay chống lại việc ngủ. Nửa còn lại (vì sao bản trước
   nhảy từ ~6 Hz lên 58 Hz đúng sau scrub) vẫn chưa giải thích
   được; số này không dùng cho kết luận nào.
5. **Chưa đo:** GPU thật, màn hình thật, dpr > 1, fullscreen,
   timeline nặng, footage thật, project của user (chỉ project mẫu
   nhẹ 2 clip 640×360 + 1 chữ); resize bằng kéo panel thật của
   user (mới chỉ đổi viewport qua CDP); scrub chuột thật (xem
   mục 1); trường hợp tab bị ẩn rồi hiện lại trong lúc ngủ
   (rAF của tab ẩn vốn đã dừng; khi hiện lại, store không đổi thì
   không có lý do gì để vẽ lại — nhưng chưa đo tay trường hợp
   này); nhiều tab/màn hình; và hiệu năng lúc phát trên máy thật.

## 6. Cấm trích (nhắc lại)

- Cấm trích "preview 0 tick/s" hay "panel idle 55 fps" thành FPS
  trên máy user: đây là VM 2 vCPU, raster phần mềm, Xvfb, dpr = 1,
  canvas 1351×512, project mẫu nhẹ — không GPU thật, không footage
  thật, không timeline nặng.
- Cấm trích số panel idle sau sửa (~55) mà không ghi "đo vòng rAF
  của panel, không phải tốc độ vẽ, và không phải A/B cùng run".
- Cấm trích số run outlier hay số trước vá (ticks ~15/s ở idle ban
  đầu) mà không ghi "bản sửa đầu, đã vá, số cuối là 0 tick/s".

## 7. Kiểm chứng đã chạy (lệnh + kết quả số)

- `node --check` cho 3 script mới: pass cả 3.
- `npx tsc --noEmit` (apps/web) ở trạng thái cuối: **0 lỗi**.
  (Giữa chừng có lỗi thoáng qua ở file của luồng khác đang sửa dở
  — `NestedClipPanel.tsx` TS6192 rồi `nestedRejection.ts` TS2345 —
  đều không thuộc file của luồng này và đều tự hết khi luồng đó
  sửa xong; lần chạy cuối 0 lỗi nên không sửa file nào khác.)
- `npx vite build` (apps/web): pass, bundle cuối `index-C_4PT5In.js`
  (dist gitignored, chỉ phục vụ đo, không stage).
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`
  (smoke test liên quan gần nhất, không chạm code vẽ): **14/14
  passed**. Không có suite unit nào bao phủ trực tiếp vòng lặp
  rAF trong preview.tsx (logic nằm trong effect React, cần DOM) —
  kiểm chứng của luồng này là đo trình duyệt thật ở §2–§4, không
  mạo nhận test unit.
- `node apps/web/scripts/measure-v21-idle-sleep-pipe.mjs` bản trước:
  okRuns 2/2 (baseline hành vi + số idle cũ); bản cuối: okRuns
  2/2, 7/7 check mỗi run.
- `node apps/web/scripts/measure-v21-idle-diag-pipe.mjs` bản cuối:
  idle 60 s chỉ 6 tick, `sleeping = true` suốt; Home cùng playhead
  +1 tick rồi ngủ lại.
- `node apps/web/scripts/measure-v21-idle-diag2-pipe.mjs`:
  0 console/exception event trong 20 s idle; Home sau phát→dừng
  vẽ + ngủ lại; resize viewport vẽ lại + ngủ lại (§4).
- KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG stage (parent
  sẽ stage). Dist và các tiến trình đo (vite/Xvfb/Chrome) đã dọn
  sau mỗi script (finally kill + rm profile).

## 8. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `apps/web/src/preview.tsx` (SỬA — vòng lặp ngủ + wake + vá
  redraw/resize + hook đo `__vcutPreviewIdle` + subscribe playing
  cho MixerMeter).
- `apps/web/src/components/MixerMeter.tsx` (SỬA — prop `isPlaying`,
  vẽ 1 mẫu tĩnh khi pause + hook đo `__vcutMixerMeter`).
- `apps/web/scripts/measure-v21-idle-sleep-pipe.mjs` (MỚI — đo
  idle trước/sau + click-test phát/dừng/scrub/tua frame qua pipe;
  cổng 4185, display :94/:93).
- `apps/web/scripts/measure-v21-idle-diag-pipe.mjs` (MỚI — chẩn
  đoán idle 60 s + Home + resize wrap).
- `apps/web/scripts/measure-v21-idle-diag2-pipe.mjs` (MỚI — gom
  console/exception + Home sau phát + resize qua viewport).
- `docs/PHASE9_ROUND21_T5_PREVIEW_IDLE_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa store.ts,
  seek.ts, nestedPreview.ts, panel khác, render worker, i18n.
  Không push, không ghi qua GitHub connector, không stage.

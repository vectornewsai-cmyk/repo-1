# U6 Phase 9 round 7 — click-test nested clip + adjustment layer — GIỚI HẠN & KẾT QUẢ

> Harness: `apps/web/scripts/u6-nested-clicktest.cjs` (mới).
> Chạy thật trên browser (CDP, không phải logic thuần). KHÔNG PUSH, không
> sửa code sản phẩm, không binary. Chỉ 2 file mới trong `apps/web/scripts/`.

## 1. Cách chạy

```bash
# Terminal 1: vite dev (harness KHÔNG tự chạy vite)
cd apps/web && npx vite --port 5180 --strictPort
# Terminal 2:
U6_DEV_URL=http://localhost:5180/ node apps/web/scripts/u6-nested-clicktest.cjs 9335
```

- Chrome headless lấy từ ms-playwright cache
  (`~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`), profile
  mới `/tmp/u6-cdprof` nên editor tải project mẫu (2 video track v1 +
  1 text track t1) như R6.
- Không cần Playwright: Node thuần + WebSocket có sẵn, nói CDP trực tiếp
  (tái dùng mẫu `r6-clicktest.cjs`).
- Exit 0 khi tất cả pass, 1 khi có FAIL (SKIP cũng tính là chưa đạt để
  parent thấy phần chưa phủ), 2 khi harness lỗi.

## 2. Kết quả lần chạy cuối (browser thật, vite 5180, viewport 1440×1200)

**8/15 pass.** Bảng chi tiết (thứ tự chạy: U0 → U1 → U2 → U3 → U7 → U4 →
U4b → U5 → U6 → U6b; U7 dời lên trước U4 để crash ở U4b không cuốn theo):

| Test | Kết quả | Số đo / ghi chú |
|---|---|---|
| U0 load sample | PASS (browser thật) | 3 clip: video 240px, video 240px, text 300px |
| U0b welcome modal | PASS (browser thật) | Modal tự mở ở profile mới, đóng được bằng click backdrop |
| U0c viewport | PASS (browser thật) | Viewport 1440×1200 sau `Emulation.setDeviceMetricsOverride` |
| U1 thêm layer chuẩn từ panel | PASS (browser thật) | Panel hiện "Layer chuẩn spec (1)", item "🎛 Làm mờ \| 00:00.0 → 00:03.0 · 50%". Hàng FX vắng (fx=0) là ĐÚNG thiết kế R7 §3 (xem §4), không phải lỗi thêm layer |
| U2a kéo body layer FX (legacy) | SKIP (không chạy được) | Xem §4: không có layer legacy để kéo |
| U2b trim mép phải layer FX (legacy) | SKIP (không chạy được) | Như U2a |
| U2c box-select qua hàng FX (legacy) | SKIP (không chạy được) | Như U2a |
| U3 sửa layer chuẩn qua panel | PASS (browser thật) | Độ dài 3 → 2s bằng triple-click + gõ phím thật; msg "Đã lưu layer chuẩn (1 bước undo).", item đổi thành "00:00.0 → 00:02.0" |
| U7a ngôn ngữ panel vi→en | PASS (browser thật) | Nút gộp → "Nest into compound clip", nút thêm → "Add layer" |
| U7b ngôn ngữ panel en→vi | PASS (browser thật) | Về lại "Gộp thành compound clip" + "Thêm layer" |
| U4 split video đầu (S) | PASS (browser thật) | Clip 3 → 4; v1 tách thành 152–272px + 272–392px, v2 392–632px |
| **U4b gộp nested clip** | **FAIL — CRASH THẬT (xem §3)** | Chọn 2 clip, bấm "Gộp thành compound clip" → trang trắng hoàn toàn (0 clip, `#root` rỗng) |
| U5 sửa clip con (InnerClipEditor) | SKIP (bị chặn) | App đã trắng sau U4b, không mở được panel — xem §3 |
| U6 transition/opacity trên nested clip | SKIP (bị chặn) | Như U5 — xem §3 |
| U6b từ chối transition vào (không clip kề) | SKIP (bị chặn) | Như U5 — xem §3 |

Không có case nào chỉ chạy logic thuần mà mạo nhận là click-test thật.
Code test cho U2 (FX legacy), U5, U6, U6b đã nằm sẵn trong harness và
chạy được ngay khi điều kiện chặn được gỡ (xem §3, §4).

## 3. BUG TÌM ĐƯỢC — chọn nested clip làm crash toàn app (KHÔNG SỬA trong U6)

**Hiện tượng (đo thật, đối chứng 2 cách):**

- Gộp 2 nửa vừa split (U4b) → bấm "Gộp thành compound clip" → trang
  trắng hoàn toàn (0 `.tl-clip`, `#root` rỗng, không có vite error overlay).
- Gộp 2 clip video gốc KHÔNG split (debug độc lập, click + Shift+click
  chọn 2 clip rồi gộp) → crash y hệt, cùng exception. Vậy crash không
  liên quan split — nó do việc CHỌN nested clip, áp dụng cho mọi nested clip.

**Stack bắt được qua CDP (Runtime.exceptionThrown):**

```
TypeError: Cannot read properties of undefined (reading 'toFixed')
    at NumField (Inspector.tsx:58)
    at Section (Inspector.tsx:81)
    at Inspector (Inspector.tsx:541)
    at App
```

**Nguyên nhân gốc (đọc code, không đoán):**

- `Inspector.tsx` mục thời gian render 2 `NumField` in/out cho mọi clip
  KHÔNG phải text/sticker/image — điều kiện loại trừ ở dòng ~500 chỉ
  loại 3 kind đó, không loại `nested`.
- `NestedClip` không có field `in`/`out` nên `(clip as {in: number}).in`
  là `undefined`; `NumField` gọi `value.toFixed(2)` → throw.
- App không có error boundary nên React unmount toàn bộ cây → trang trắng.
- Đây là hệ quả đã được báo trước một phần ở `NESTED_UI_LIMITS.md` §9
  (union `Clip` thêm kind mới mà file khác chưa xử lý), nhưng trước U6
  chưa từng có click-test browser nào đi qua đường chọn nested nên chưa
  ai thấy crash chạy thật.

**Hướng sửa đề xuất (chưa áp dụng — Inspector thuộc luồng khác):**
loại `nested` khỏi hàng in/out trong mục thời gian của Inspector (giống
cách đã loại text/sticker/image), hoặc cho `NumField` chịu `undefined`.
Sau khi sửa, chạy lại harness này: U4b phải ra 1 `.clip-nested` + tổng
clip giảm 1, rồi U5/U6/U6b tự chạy được tiếp (không cần sửa harness).

**Vì sao U5/U6/U6b chỉ SKIP chứ không FAIL:** chúng không chạy được
một bước nào vì app đã trắng — ghi FAIL sẽ mạo nhận là tính năng đó
hỏng, trong khi nguyên nhân duy nhất đã biết là crash ở U4b. Harness
giữ nguyên code các case này; parent chạy lại sau khi sửa crash là có
kết quả thật ngay.

## 4. Layer FX legacy: vì sao SKIP (thiết kế R7, không phải lỗi test)

- Panel R7 chỉ tạo layer chuẩn vào `spec.adjustmentLayers` (xem
  `R7_UI_LIMITS.md` §0, §3). Hàng FX của Timeline vẫn chỉ vẽ layer
  legacy (kind `"adjustment"` trong track.clips).
- Project mẫu không có layer legacy, và panel mới không còn đường nào
  tạo layer legacy nữa → không có đối tượng để kéo/trim/box-select.
- Code test FX (kéo body +120px, trim mép phải −60px, box-select chéo
  từ hàng FX xuống hàng video) vẫn nằm trong harness sau guard
  `if (!fx2) skip(...)`; chỉ cần mở project chứa layer legacy là chạy.
- Layer chuẩn CHƯA vẽ lên FX và CHƯA đọc trong preview cũng là nợ đã
  ghi ở R7 §3 (luồng Timeline/preview sở hữu) — U6 không sửa Timeline
  nên không vá lén.

## 5. Các case chưa chạy được và cách chạy lại

| Case | Vì sao chưa chạy | Chạy lại khi |
|---|---|---|
| U2a/U2b/U2c (FX legacy) | Không có layer legacy trong project mẫu; panel R7 không tạo được legacy | Mở project chứa layer legacy rồi chạy harness (guard tự mở test) |
| U5 (InnerClipEditor) | App trắng sau U4b | Sửa crash Inspector (§3) rồi chạy lại harness |
| U6 (opacity + transition ra fade) | Như U5 | Như U5; kỳ vọng: opacity 0.5 + transOut fade 0.5s lưu được vì nested có clip kề v2 ở biên 4s (transIn để trống vì không có clip kề trái) |
| U6b (từ chối transIn) | Như U5 | Như U5; kỳ vọng: transIn=fade bị từ chối (không clip kề trái) + giá trị đã lưu không đổi |

## 6. Bài học harness (để lần chạy sau không mất công debug lại)

- **Element dưới fold không bấm được:** layout app cao theo viewport nên
  timeline/panel thường nằm dưới đáy viewport (clip ở y=1468 với
  viewport 1200; nút panel ở y=1268). `--window-size` không cứu được vì
  preview flex-grow đẩy timeline xuống theo. Harness dùng
  `Emulation.setDeviceMetricsOverride` 1440×1200 + `scrollIntoView`
  trong mọi finder, VÀ đóng hết panel trước khi thao tác timeline (U4)
  vì element sát đáy document không cuộn lên giữa viewport được
  (scroll tối đa vẫn để clip ở y≈1185–1208, ngoài viewport 1200).
- **Nút toolbar là toggle:** `openBothPanels` cũ bấm mù cả 2 nút nên đã
  đóng nhầm panel Adjustment đang mở (U7a fail giả). Nay chỉ bấm khi
  panel chưa mở (kiểm tra `panelStrong` trước).
- **Number input không chọn hết được bằng Ctrl+A / End+Shift+Home qua
  CDP:** `selectionStart` luôn null với `type=number`; gõ nối chuỗi
  thành "322" (= 5:22). Cách duy nhất đo được: triple-click
  (clickCount 3) rồi gõ phím thật — đã kiểm chứng: triple-click xong
  gõ "5" thay toàn bộ "32" thành "5". `setInput` trong harness dùng
  cách này, và caller luôn kiểm tra lại giá trị trước khi bấm Lưu
  (không bao giờ lưu với giá trị chưa xác minh).
- **Select native:** click mở popup không điều khiển được bằng CDP nên
  U6 focus select qua JS rồi đổi bằng phím ArrowDown thật (giá trị đổi
  bằng key event, chỉ bước focus dùng JS) — ghi rõ trong harness; case
  này hiện vẫn SKIP do crash U4b nên chưa có số đo thực tế.
- **Flake waitFor:** eval snapshot đầu có thể rơi đúng lúc trang đang
  chuyển document (`document.body` null) — `waitFor` nay chịu lỗi
  transient và polling tiếp; `SNAP_JS` null-safe ở `bodyText`.
- **Vite nền:** harness không tự chạy vite; vite chạy bằng `&` trong
  exec thường bị thu hồi giữa chừng — chạy vite bằng tiến trình nền
  riêng bền vững và kiểm tra `curl localhost:5180` trước khi chạy harness.

## 7. File đã đổi (để parent gom — KHÔNG push, KHÔNG stage ở đây)

- `apps/web/scripts/u6-nested-clicktest.cjs` (mới, ~700 dòng): harness
  CDP đầy đủ các case U0–U7, kèm guard SKIP và diagnostic.
- `apps/web/scripts/U6_CLICKTEST_LIMITS.md` (mới, file này).

Không sửa file sản phẩm nào (không đụng `Timeline.tsx`, `Inspector.tsx`,
`NestedClipPanel.tsx`, `AdjustmentLayerPanel.tsx`, `store.ts`, i18n).
Không tạo file binary. Debug script chỉ nằm ở `/tmp` (u6-debug*.cjs),
không nằm trong repo.

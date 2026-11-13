# Phase 9 đợt 74 B5 — Preset 4:5 render thật + click-test headed + hiệu chỉnh số safe-area

> Ngày: 09/11/2026. Luồng B5, đợt 74. Đóng nợ đợt 73 §4 mục 9 (A9):
> preset `ig-portrait` 1080×1350 đã thêm nhưng chưa render MP4 thật
> end-to-end, số vùng safe-area chỉ là xấp xỉ, chưa click-test headed.

## 0. Đã làm gì

1. **Render MP4 thật end-to-end với preset 4:5** — test mới
   `server/render/test_export_preset45_74b5.js`: spec project 1080×1350
   @30fps, clip text 3s → render qua `render.js` thật với đúng tham số
   preset (CRF 21, medium, 128k) → ffprobe verify. Chuỗi preset đã
   kiểm tra tay: `ExportPanel` (presetId → `getPreset`) → form preset
   JSON `{crf, x264Preset, audioBitrateKbps}` + meta override theo preset
   → bridge sanitize → `render.js --crf/--x264-preset/--audio-bitrate`.
2. **Click-test trên Chromium thật** (không còn là nợ SSR) — script mới
   `apps/web/e2e/preset45-safearea-74b5.cdp.mjs`: dùng Chromium 158 đã
   có trong `~/.cache/ms-playwright` + CDP qua WebSocket có sẵn của
   Node 24, KHÔNG cần `@playwright/test` (chưa cài trong repo). Chạy
   `vite preview` trên cổng 4173, click chuột thật bằng
   `Input.dispatchMouseEvent`, đo `getBoundingClientRect` thật.
3. **Hiệu chỉnh số vùng safe-area** trong `apps/web/src/lib/safeArea.ts`
   sau khi đối chiếu với bố cục UI công khai (xem §3): TikTok thanh trên
   7,5%→11%, caption dưới 24%→27%, title-safe tương ứng; Instagram 4:5
   caption dưới 15%→18%, title-safe h 0,75→0,74. Cập nhật kèm 2 test A9
   (`safeArea73A9.test.ts` + `safeAreaOverlay73A9.render.test.ts`).

## 1. Kiểm chứng (số thật)

| Kiểm tra | Kết quả |
|---|---|
| `test_export_preset45_74b5.js` (mới) | **17/17 pass** — source có entry `ig-portrait` đúng số; dry-run ra `-preset medium -crf 21 -b:a 128k`; render thật 1,9s cho 3s video (1,58× realtime, clip text, CPU VM); ffprobe: **1080×1350, r_frame_rate=30/1, avg=30/1, nb_read_frames=90** (= 30fps × 3s), duration **3,000s** (lệch 0,000s), h264, 14.986 byte |
| `test_export_presets.js` (cũ, regression) | **22/22 pass** — 720p/1080p render đúng, args sai → exit 2 |
| Click-test CDP `preset45-safearea-74b5.cdp.mjs` (mới) | **22/22 pass** — xem §2 |
| `safeArea73A9.test.ts` | **13/13 pass** (thêm 1 test IG 4:5 mới) |
| `safeAreaOverlay73A9.render.test.ts` (SSR) | **4/4 pass** |
| `tsc --noEmit` apps/web | **0 lỗi** (4 lỗi TS5097 của A7 đợt 73 đã hết trước đợt này) |
| `vite build` | **pass** (30,3s) |
| i18n | Không đụng file i18n nào → không thêm/bớt key, không cần bump test khóa số key |

### Click-test CDP — chi tiết (22 assert)

- App load: splash xuất hiện rồi biến mất (~13,2s do load project mẫu),
  brand "VCut Studio", preview-wrap + timeline hiện; modal chào mừng
  đóng bằng nút ✕ thật.
- Toggle `⌖ Vùng an toàn`: ban đầu `aria-pressed=false`, 0 zone → click
  chuột thật → `aria-pressed=true`, zone xuất hiện; click lần nữa → tắt,
  zone biến mất.
- Preset mặc định 1080p → platform select = `youtube`, đúng 1 zone
  endScreen; đo trên khung letterbox thật (project mẫu 1280×720 trong
  wrap 874×278 → frame 494,2×278): endScreen x/w **74,8%/24,8%**
  (kỳ vọng 75%/25%), y/h **77,8%/21,8%** (kỳ vọng 78%/22%).
- Chọn preset `ig-portrait` trong panel Xuất bản → mô tả hiện
  `1080×1350 @30fps · CRF 21 · medium · audio 128k`; overlay tự đổi
  sang `instagram-portrait`, đúng 2 zone: topBar cao **6,0%**, bottomCaption
  y/h **81,8%/17,9%** (kỳ vọng 82%/18% sau hiệu chỉnh); zone nằm gọn
  trong khung video, title-safe gọn trong khung và không giao zone nào.
- Screenshot `/tmp/preset45-74b5-overlay.png`: overlay vẽ đúng khung
  video đã letterbox (không đè viền đen), đủ nhãn "Thanh trên",
  "Caption + thanh dưới", "Vùng title-safe", select "Instagram dọc 4:5".

## 2. Ba bẫy đã gặp khi click-test (ghi lại cho lượt sau)

1. **Vite preview chỉ bind `::1`, không bind `127.0.0.1`** — curl
   `127.0.0.1:4173` trả 000 trong khi `localhost:4173` trả 200. Đây
   chính là gốc của nợ "VM browser không tới được 127.0.0.1:5173" các
   đợt trước: dùng `localhost`, đừng dùng `127.0.0.1`.
2. **Chờ splash sai cách sẽ bắt nhầm khoảng trống trước khi mount** —
   ngay sau navigate, bundle chưa chạy nên DOM shell chưa có `.splash`,
   `!document.querySelector(".splash")` đúng ngay lập tức trong khi app
   chưa load. Phải chờ splash XUẤT HIỆN trước rồi mới chờ nó biến mất,
   cộng xác nhận vắng mặt bền vững. Tương tự, modal chào mừng (root
   `.modal-backdrop`, không chứa chữ "welcome" trong class) che toàn
   màn hình (z 400) và chặn mọi click — phải đóng nó trước.
3. **`.safe-area-overlay` là `inset:0` của cả preview-wrap, canvas cũng
   trải hết wrap** — đo zone theo overlay/canvas sẽ sai tỉ lệ x/w
   (đo nhầm endScreen 64,1%/14,1%). Khung video thật phải tính bằng
   công thức letterbox từ wrap + tỉ lệ project mẫu (1280×720); đo theo
   đó mới ra 74,8%/24,8% đúng.

## 3. Hiệu chỉnh số safe-area (đối chiếu nguồn công khai 09–10/2026)

| Vùng | Cũ (A9) | Mới (B5) | Căn cứ |
|---|---|---|---|
| TikTok topBar | 7,5% | **11%** | Đo tay trong app 211px/1920 (Uplonic 09/2026); Revid 220px; Muzecmo 10%. Template TikTok 130px (6,8%) là mức tối thiểu, chưa tính notch/Dynamic Island |
| TikTok bottomCaption | 24% | **27%** | Đo tay 518px/1920 (Uplonic 09/2026); template TikTok 480px = 25%; guide thận trọng 30%. Số cũ thấp hơn MỌI nguồn công bố |
| TikTok title-safe | x4% y9% w79% h65% | **x5% y12% w79% h61%** | Tránh 3 zone mới; nằm trong khung an toàn công bố (Revid: x 5,6%–87%, y 11,5%–75%) |
| TikTok rightRail | 13% (32–78% cao) | giữ nguyên | 140px là số của chính TikTok, khớp Muzecmo/Revid; span dọc 32–78% đã thận trọng hơn mức đo 42–73% |
| IG 4:5 bottomCaption | 15% | **18%** | Post feed thường ~250px dưới (soku.ai) = 18,5% của 1350px. Meta KHÔNG công bố tỉ lệ cho feed 4:5 (chỉ dặn chừa mép dưới/hai bên) — 18% là ước lượng thực dụng, không phải số chính thức |
| IG 4:5 title-safe | h 0,75 | **h 0,74** | Kết thúc ở 0,82, tránh zone mới |
| IG 1:1 bottomCaption | 13% | giữ nguyên | Không có số công bố cho bottom 1:1 organic — giữ làm biên an toàn, ghi rõ là yếu nhất |
| YouTube endScreen | 25%×22% | giữ nguyên | End-screen do creator tự đặt vị trí (không có UI cố định); element video ~32% rộng (613px/1920) theo khung tham chiếu YouTube Editor — zone hiện tại là gợi ý vị trí đặt thường dùng, không phải đo cố định |

**Mức chính xác còn lại: vẫn là xấp xỉ, không pixel-exact.** Các số
TikTok giờ neo theo 2 nguồn đo tay độc lập (Uplonic 09/2026, Revid) +
template của TikTok; số IG 4:5 neo theo 1 khuyến nghị thực dụng duy
nhất (~250px) vì Meta không công bố tỉ lệ feed; số IG 1:1 và YouTube
không có nguồn đo trực tiếp. Nền tảng đổi UI thì số lệch theo — overlay
vẫn ghi rõ "xấp xỉ", chỉ dùng để căn chữ, không dùng để cắt video.

## 4. Giới hạn trung thực

- **Click-test là Chromium headless qua CDP, KHÔNG phải headed GUI**
  (VM không có màn hình/X): click chuột thật + render thật trong
  browser, nhưng không có cửa sổ hiển thị để mắt người xem trực tiếp.
  Screenshot `/tmp/preset45-74b5-overlay.png` là bằng chứng hình ảnh.
- **Render 4:5 mới chỉ với clip text 3s** (mẫu của
  `test_export_presets.js`): chứng minh preset map đúng kích thước/fps/
  CRF qua pipeline thật, chưa render 4:5 với footage video thật hay
  text+effect phức tạp — nhưng render.js không có nhánh riêng theo tỉ
  lệ khung, nên rủi ro còn lại là thấp.
- **Render đo trên VM CPU-only, clip text tĩnh**: 1,58× realtime không
  đại diện cho footage thật (benchmark 1080p ~12fps của repo vẫn đúng
  cho video thật).
- **Không đụng `preview.tsx`/`styles.css`** nên không cần cập nhật
  css60 expected list; không thêm key i18n nên không bump test khóa
  số key. Nếu parent gộp thấy test khóa key lệch thì nguyên nhân không
  phải từ luồng này.
- **Dọn dẹp:** preview server cổng 4173 đã tắt sau khi test xong;
  screenshot + MP4 test chỉ nằm ở `/tmp` (không stage, không commit).
  Trong lúc dọn, `pkill -f "vite preview --port 4173"` đã giết luôn
  shell exec của chính nó (pattern trùng command line) — bài học: kill
  theo PID. Sau đó không còn tiến trình vite nào trên cổng 5570 (server
  của luồng B1): pattern pkill không thể khớp server B1 nên nhiều khả
  năng B1 đã tự dừng server trước đó, nhưng B5 không xác minh được
  nguyên nhân — parent gộp kiểm tra lại nếu cần.

## 5. File stage (batch `phase9-round74-b5-preset45-render.txt`)

6 file text, đường dẫn tương đối từ gốc repo — xem file paths đã stage.
Không binary, không workflow. Không push (theo luật cứng).

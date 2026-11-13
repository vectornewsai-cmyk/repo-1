# PHASE 9 ĐỢT 75 — LUỒNG C1: SỬA RÒ PLAIN Ở PREVIEW — OCEAN w1440 KHỚP

**Ngày:** 09/11/2026 · **Nợ:** đợt 74 §4.1 / B1 §8.1 (ocean w1440
noise05: Δkurt G 1,12, Δcorr R-G 0,239, stdRatio G 1,19 — cơ chế rò plain
đã rõ, corr phần dư với −plainDiff 0,993).
**Kết quả tóm tắt — đọc trước:**

1. **Đã sửa rò plain ở preview** (`apps/web/src/preview.tsx`): đường
   plain (không LUT/effects/enhance) nay đi qua cùng intermediate
   letterbox dw×dh như đường effects — plain và noise chia sẻ đúng một
   chuỗi resample, số hạng rò `L = D2(D1(V)) − D_main(V)` triệt tiêu.
   Chỉ áp khi media lớn hơn letterbox (đúng trường hợp D1 là resample
   thật); media ≤ project giữ đường vẽ cũ.
2. **Ocean w1440 noise05 KHỚP (không d0):** Δkurt G **1,12 → 0,08**
   (kỳ vọng ≤ 0,35 — ĐẠT), Δcorr R-G 0,239 → 0,015, stdRatio G 1,19 →
   **1,00**, Δkurt cả 3 kênh ≤ 0,12, plainAbsMad 3,294 → **1,149**.
   Bin xấu nhất [8,256): frac 0,109 → 0,002, prevStdG 18,64 → 9,28.
   Kiểm chứng rò: corr phần dư vs −plainDiff kênh G 0,993 → **0,348**
   với stdX 14,72 → **1,02** (phần dư còn lại chỉ còn ở mức nhiễu nền).
   Giao thức cùng-khung D3 pass, raw hash `5c9f9de4` khớp B1 (đúng cùng
   frame decode); D1 plain 2 lần pixel-identical; 0 lỗi trang.
3. **Phát hiện phụ (trung thực): luật delta0 của B1 giờ kích hoạt sai.**
   plainAbsMad rơi xuống 1,149 (≤ ngưỡng 2,5) nên d0 được áp theo luật
   cũ — nhưng d0 có std kênh R **3,94** trong khi phần dư plain thực
   chỉ còn 0,94, nên d0 hiệu chỉnh quá tay và làm Δkurt R vọt **0,45**
   (vượt ngưỡng 0,35) trong khi không d0 thì KHỚP toàn bộ. Verdict đúng
   sau sửa là **không áp d0** (xem §4). Nợ cho đợt sau: hiệu chỉnh lại
   luật áp d0 (nó được thiết kế cho thời plain còn lệch lớn).
4. **FPS trước/sau: KHÔNG KẾT LUẬN ĐƯỢC.** Đo thật trên Chromium
   headed (ocean plain đang phát, warmup 1 s + đo 4 s, playing kiểm
   tra cứng): sau sửa 10,72 / 9,54 / 12,77 fps; trước sửa 5,70 / 4,02 /
   **37,50** fps. Dao động trong-điều-kiện của code cũ (4,0–37,5, gấp
   9 lần) át mọi hiệu ứng của code mới — tải nền VM lúc đo 5–7 (các
   luồng đợt 75 khác chạy song song). Không claim sửa này nhanh hơn
   hay chậm hơn; chi phí thêm là 1 drawImage 1920→1280/frame/clip,
   không đo được trên nền nhiễu này. Cần đo lại trên máy yên nếu muốn
   quy FPS cho sửa này.
5. **Chroma cũng được chuẩn hoá** (cùng họ rò, B1 §8.3): canvas chroma
   ở khổ native nay cũng qua intermediate dw×dh khi media > letterbox
   — chưa đo riêng (không có probe chroma+media-lớn), ghi nhận chứ
   không claim số.

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Node
v24.22.1; ffmpeg 8.1.2; Chromium 1254 headed qua Xvfb; snapshot headed
C1 mới, KHÔNG tái dùng snapshot B1 trừ baseline tính lại). Ngưỡng
verdict như Z2/A3/B1: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Probe/log/JSON tại `hidden_files/round75-c1/`, log
luồng `hidden_files/round75-c1.md`.

---

## 1. Cách sửa (production, `apps/web/src/preview.tsx`)

### 1.1 Vấn đề (B1 §6.3, nhắc lại ngắn)

`drawVideoClip`: khi clip KHÔNG có canvas effect, `drawSrc` là video
element 1920×1080 và được vẽ thẳng xuống viewport 489×275 trong **1
bước** (`ctx.drawImage` dưới transform `vp.scale`); khi CÓ effect
(noise), video phải qua `effectCanvasSource` 1920→1280 (dw×dh) rồi mới
xuống viewport (**2 bước**). Delta preview do đó chứa số hạng rò plain
`L = D2(D1(V)) − D_main(V)` mà render không có.

### 1.2 Sửa: chuẩn hoá drawSrc về intermediate letterbox dw×dh

- Helper mới `letterboxIntermediateSource(src, dw, dh)` (cạnh
  `effectCanvasSource`, cùng mẫu canvas tái dùng module-level):
  `clearRect` + `drawImage(src, 0, 0, cw, ch)` với
  `imageSmoothingEnabled = true`, `imageSmoothingQuality = "high"` —
  **cùng setting với `effectCanvasSource`** và ctx chính (dòng 1926–
  1927) để bước resample đầu tiên của đường plain giống hệt đường
  effects (cùng kernel Chrome). Chỉ 1 `drawImage`, không `getImageData`
  (không tốn pixel shader).
- Trong `drawVideoClip`, sau khối LUT/effects/enhance, trước khối mask:
  cờ `srcAtLetterbox` ghi nhận drawSrc đã ở khổ dw×dh chưa (LUT WebGL
  ra dw×dh, `effectCanvasSource` ra dw×dh, `enhancePreviewSource` ra
  dw×dh); nếu chưa và media lớn hơn letterbox (`mw > dw || mh > dh`)
  thì `drawSrc = letterboxIntermediateSource(drawSrc, dw, dh)`.
  Thất bại (không document/context) → giữ drawSrc cũ, frame đó giữ
  hành vi cũ, không crash.
- Hệ quả: mọi đường vẽ sau (thường / SR / mask / motion blur) chia sẻ
  đúng một chuỗi resample cho cả plain và noise. Mask cũng hưởng lợi:
  plain-có-mask trước đây là raw → unit 640, nay là raw → letterbox
  1280 → unit 640, giống hệt noise-có-mask.
- Phạm vi cố ý hẹp: chỉ khi `mw > dw || mh > dh` (đúng trường hợp D1
  là resample thật; media ≤ project giữ đường vẽ cũ để không đổi hành
  vi upscale). `drawImageClip` (clip ảnh tĩnh) KHÔNG đụng — ảnh không
  có canvas effect nên không có cặp plain/noise để so, không có rò đo
  được; render ảnh cũng không qua chuỗi này.
- Chroma: `chromaKeyedSource` ra canvas khổ native mw×mh nên cũng được
  chuẩn hoá (cùng họ rò B1 §8.3) — sửa này không thêm code riêng cho
  chroma, nó là hệ quả của cùng một khối chuẩn hoá.
- An toàn với canvas tái dùng: mọi consumer bên dưới đọc đồng bộ trong
  cùng tick (`updateMotionBlurSnapshots` copy qua `drawImage` vào
  canvas riêng; `drawMotionBlurBlended` vẽ snapshot đã copy). Không có
  khoảng async nào giữa lúc lấp intermediate và lúc dùng nó.
- Ảnh hưởng sản phẩm (B1 §8.1 đã báo trước): ảnh plain preview thay
  đổi — downscale 2 bước mềm hơn 1 bước đôi chút ở cửa sổ nhỏ. Đây là
  cái giá để plain/noise nhất quán; số đo §2 cho thấy ảnh plain mới
  gần render hơn (plainAbsMad 3,294 → 1,149) nên thay đổi này đi đúng
  hướng (gần render hơn, không chỉ "khác đi").

## 2. Đo lại ocean w1440 (giao thức B1, snapshot headed mới)

Harness `r74b1-headed-capture.mjs` (B1, không sửa) chạy lại với code đã
sửa: `R74B1_SOURCES=ocean`, w1440×900, variants plain/plain2/noise05,
vite dev + Xvfb + Chromium 1254 headed + CDP. Script phân tích mới
`r75c1-analyze.mjs` (helper sao chép verbatim từ B1 + `corrSlope` từ
r74b1-leak): frame render Z2 method-T (`fullrgb-ocean-plain/noise05.raw`,
1280×720) resample trilinear về 489×275, `fullDeltaStats` cả hai chế
độ có/không d0, bin plainAbsDiff (Part D), kiểm chứng rò (leak corr),
D1/D2/D3, baseline B1 tính lại bằng đúng code phân tích mới.

| Chỉ số (ocean w1440, s=0,3819, rect 489×275) | B1 (trước sửa) | C1 không d0 | C1 có d0 |
|---|---|---|---|
| plainAbsMad (preview plain vs renderPlainTri) | 3,294 | **1,149** | 1,149 |
| Δkurt G | 1,12 | **0,08** | 0,08 |
| Δkurt R / B | — / — | 0,12 / 0,08 | **0,45** / 0,08 |
| Δcorr R-G | 0,239 | **0,015** | 0,005 |
| Δcorr R-B / G-B | — | 0,012 / 0,007 | 0,004 / 0,008 |
| stdRatio G | 1,19 | **1,00** | 0,99 |
| stdRatio R / B | — | 1,00 / 1,00 | 0,97 / 1,00 |
| Verdict | LỆCH | **KHỚP-THỐNG-KÊ** | LỆCH (chỉ kênh R) |

- Bin plainAbsDiff (Part D, không d0): mọi bin prevStdG ≈ renderStdG
  (8,92–9,28 vs 8,95–10,18); bin xấu nhất [8,256) frac **0,002**
  (B1: 0,109), prevStdG **9,28** (B1: 18,64), renderStdG 10,18 (B1:
  8,61). Phần thừa ×2 ở pixel tần số cao đã biến mất.
- Kiểm chứng rò (kênh G, toàn khung): corr(X=dP−dR_sameSeed,
  Y=−plainDiff) **0,348**, slope 0,60, **stdX 1,02** (B1 gradient1920
  E-sine: corr 0,993, stdX 14,72), stdY 0,59. Phần dư còn lại chỉ còn
  ở mức nhiễu nền (~1 đơn vị); corr 0,348 trên phần dư nhỏ này không
  còn là rò — nó là tương quan còn sót của proxy xấp xỉ với phần dư
  dưới 1 đơn vị.
- D1: snapshot plain 2 lần pixel-identical (full-pixel). D3 cùng-khung:
  raw hash plain == noise05 == **`5c9f9de4`**, currentTime 1/1,
  paused true/true, seeking false/false, readyState 4/4 — đúng cùng
  frame decode, hash khớp B1 (cùng frame 25 của ocean06.mp4). H9: 0
  lỗi trang. Capture: 3/3 case pass.
- Baseline B1 tính lại bằng code phân tích mới (cùng snapshot cũ):
  plainAbsMad 3,294, ΔkurtG 1,12, ΔcorrRG 0,239, stdRatioG 1,19 — khớp
  từng số với LIMITS B1, chứng tỏ chuỗi phân tích mới không làm lệch
  baseline.

## 3. Kiểm chứng code

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web, chạy 2 lần: sau sửa + cuối đợt) | **0** |
| `vite build` | **pass** (18,35 s) |
| `r6-i18n-check` | **PASS** (dict giữ **2405**, không thêm key — luồng này không đụng i18n) |
| Headed capture ocean w1440 (code đã sửa) | **3/3 pass** (D1/D3/H9) |
| Phân tích `r75c1-analyze.mjs` | exit 0; JSON `r75c1-analysis.json` |
| FPS trước/sau (xem §5) | 6 lượt chạy, kết quả xem §5 — không kết luận được delta FPS |
| Không chạy | click-test editor tổng thể (chỉ đụng 1 đường vẽ trong `drawVideoClip`; tsc + build + capture headed 3/3 là kiểm chứng trực tiếp); suite P7/css/i18n đầy đủ để parent gộp chạy lại trên cây đã gộp |

## 4. Phát hiện phụ: luật delta0 giờ kích hoạt sai (nợ đợt sau)

`delta0Viewport_70x6` mô hình hoá lệch do chroma-subsampling shift
giữa preview-plain và render-plain; luật B1 áp d0 khi plainAbsMad ≤
2,5 (plain đủ gần thì mô hình d0 đáng tin). Trước sửa, ocean w1440
plainAbsMad 3,294 > 2,5 nên d0 KHÔNG áp. Sau sửa, plainAbsMad 1,149
≤ 2,5 nên d0 ÁP theo luật — nhưng số đo cho thấy d0 giờ lớn hơn cả
phần dư nó định hiệu chỉnh:

- d0 magnitude: std **[3,94, 0,96, 0,90]** (R/G/B), kurt [−0,71, −0,79, 0,81].
- Phần dư plain thực (previewPlain − renderPlainTri): std **[0,94, 0,59, 1,31]**.

d0 kênh R (3,94) gấp ~4 lần phần dư R thực (0,94): trừ d0 vào dP là
cộng thêm sai số, đẩy Δkurt R từ 0,12 → **0,45** (vượt ngưỡng 0,35)
trong khi Δkurt G giữ 0,08 và Δcorr/stdRatio vẫn pass. Verdict đúng
sau sửa là **không áp d0** (KHỚP toàn bộ 3 kênh). Tiền đề của luật d0
("plain lệch chủ yếu do chroma shift") không còn đúng sau khi rò plain
— thủ phạm lệch lớn nhất — đã bị triệt tiêu. **Không sửa luật d0
trong luồng này** (đổi luật đo trong cùng luồng claim sửa sẽ là tự
chấm điểm cho mình); ghi nợ cho đợt sau: hiệu chỉnh lại điều kiện áp
d0 — ví dụ chỉ áp khi magnitude d0 nhỏ so với phần dư plain, hoặc khi
plainAbsMad nằm trong một dải (đủ gần để mô hình tin được nhưng chưa
quá gần đến mức d0 thành nhiễu chính).

## 5. FPS trước/sau — KHÔNG KẾT LUẬN ĐƯỢC (đo thật, nhiễu nền át)

Harness mới `r75c1-fps.mjs` (vite dev + Xvfb + Chromium 1254 headed +
CDP, seed ocean plain, warmup 1 s + đo 4 s, kiểm tra cứng
playing=true + playhead chạy trong lúc đo — nếu phát dừng thì từ chối
ghi số). Clip kéo dài 6,4 s (đúng độ dài ocean06.mp4) để phủ cửa sổ
đo. Bản "trước sửa" chạy từ bản sao shadow của `apps/web` đặt TRONG
repo (`apps/.r75c1-shadow-web-orig`, đã xoá sau khi đo) với
`preview.tsx` đảo ngược đúng 4 sửa đổi (diff 72 dòng = đúng các sửa
đổi của C1, không gì khác); vite config resolve `@vitejs/plugin-react`
từ node_modules gốc repo (bản shadow ở /tmp ban đầu fail vì alias
`__dirname` trong vite.config.ts + React hoisted không resolve được —
xem §6.3).

| Lượt | Code | FPS | frames/span | p50 gap | p95 gap | jank >50 ms | playhead |
|---|---|---|---|---|---|---|---|
| sau1 | đã sửa | 10,72 | 43 / 3,92 s | 83,4 ms | 183,4 ms | 32 | 0,97 → 5,23 |
| sau2 | đã sửa | 9,54 | 39 / 3,98 s | 100 ms | 200 ms | 32 | 1,07 → 5,77 |
| sau3 | đã sửa | 12,77 | 51 / 3,92 s | 83,4 ms | 183,4 ms | 36 | 0,97 → 5,10 |
| truoc1 | gốc | 5,70 | 24 / 4,03 s | 133,3 ms | 466,7 ms | 21 | 1,00 → 5,90 |
| truoc2 | gốc | 4,02 | 17 / 3,98 s | 283,3 ms | 599,9 ms | 15 | 0,90 → 5,77 |
| truoc3 | gốc | 37,50 | 151 / 4,00 s | 16,7 ms | 83,4 ms | 21 | 0,93 → 5,67 |

- Sau sửa: 9,54–12,77 (trung bình 11,01). Trước sửa: 4,02–37,50
  (trung bình 15,74). Dao động trong-điều-kiện của code cũ gấp ~9 lần
  (4,0 → 37,5) át hẳn mọi hiệu ứng có thể có của 1 drawImage thêm.
  Load average VM lúc đo 5–7 (1 phút: 7,15 lúc 15:10; 5,43 lúc
  15:12) do các luồng đợt 75 khác chạy song song (vite dev + Chrome
  headed riêng). **Không claim sửa này nhanh hơn hay chậm hơn.**
- Lỗi phương pháp đã bắt và sửa giữa chừng (ghi để đợt sau tránh):
  lần chạy đầu dùng clip 4 s + đo 10 s sau warmup 2 s — phát dừng
  sau 4 s nên số 47,1 fps đo được chỉ là FPS trang đứng yên; đã huỷ
  số đó, kéo clip ra 6,4 s + đo 4 s + kiểm tra cứng playing/playhead,
  chạy lại toàn bộ 6 lượt. Số 47,1 fps KHÔNG dùng ở đâu trong LIMITS
  này ngoài dòng này.
- Giả thuyết chưa kiểm chứng (không claim): các lượt sau-sửa ổn định
  hơn hẳn (9,5–12,8) so với trước-sửa (4,0–37,5) — có thể chuỗi 2 bước
  tránh được một slow-path thỉnh thoảng kích hoạt ở bước downscale
  1 lần tỉ lệ lớn; nhưng với n=3 mỗi bên và tải nền không kiểm soát,
  đây chỉ là giả thuyết. Muốn quy FPS cho sửa này phải đo lại trên
  máy yên (không chạy luồng khác), nhiều lượt hơn, kèm CPU%.

## 6. Sự cố quy trình (đã khắc phục, ghi để đợt sau tránh)

1. **Quên khối code khi edit:** lần edit chèn khối chuẩn hoá chỉ chèn
   comment mà thiếu câu lệnh `if` — phát hiện khi đọc lại diff trước
   khi chạy tsc; đã bổ sung ngay. Bài học: sau mỗi edit, đọc lại vùng
   vừa sửa thay vì tin trí nhớ.
2. **Script phân tích lắp từ 3 nguồn bị trùng khai báo:** lắp
   `r75c1-analyze.mjs` bằng sed từ B1/leak để lại `PREVIEW_SEED_LOCALT1`,
   `b64ToRgb` trùng + đầu hàm `main()` của leak — `node --check` bắt
   cả 3, đã gỡ từng cái. Bài học: sau khi lắp script bằng sed, chạy
   `node --check` ngay trước khi viết thêm.
3. **Bản shadow vite ở /tmp không chạy được:** alias `__dirname`
   trong vite.config.ts (`@repo-1/video-spec` → `../../packages`) và
   React hoisted ở gốc repo đều gãy khi web dir nằm ngoài repo (2 lượt
   truoc1/truoc2 đầu fail sau 120 s chờ vite). Đã dời shadow vào trong
   repo (`apps/.r75c1-shadow-web-orig`, đã xoá sau khi đo) + sửa config
   vite của script FPS resolve plugin từ gốc repo. Bài học: shadow của
   một package trong monorepo phải nằm trong repo.
4. **`pkill -f` tự giết shell của mình:** lệnh dọn tiến trình có pattern
   khớp chính dòng lệnh của shell đang chạy → exec chết giữa chừng
   (may là không giết nhầm tiến trình của luồng khác — đã kiểm tra
   `ps`, chỉ thấy tiến trình round75-c4 còn sống và để yên). Bài học:
   không dùng `pkill -f` với pattern rộng khi đang ở trong shell đó;
   dọn tiến trình theo PID cụ thể.
5. **FPS lần đầu đo sai phương pháp** (xem §5): clip ngắn hơn cửa sổ
   đo. Đã sửa + chạy lại toàn bộ, số sai đã huỷ.

## 7. Nợ mở (trung thực)

1. **Luật delta0 cần hiệu chỉnh lại** (xem §4): sau khi rò plain bị
   triệt tiêu, d0 (std R 3,94) lớn hơn phần dư plain thực (0,94) và
   làm Δkurt R vọt 0,45 khi áp theo luật cũ. Đợt sau: đặt lại điều
   kiện áp d0 (so magnitude d0 với phần dư plain, hoặc dải plainAbsMad
   áp dụng) rồi đo lại verdict có d0 trên ocean + các media khác.
2. **Chroma chưa đo riêng:** chroma-canvas cũng được chuẩn hoá qua
   intermediate (hệ quả của cùng khối code) nhưng chưa có probe
   chroma + media 1920 để đo Δkurt trước/sau — cần probe riêng nếu
   muốn claim.
3. **FPS chưa quy được cho sửa này** (xem §5): đo lại trên máy yên,
   nhiều lượt, kèm CPU%.
4. **Chưa đo:** rò plain trên media 4K / project 1080p (B1 §8.3 —
   sửa này áp cho mọi media > letterbox nên về lý thuyết cũng sửa các
   trường hợp đó, nhưng chưa có số); rò ở LUT/chroma đã có
   intermediate riêng từ trước nên không nằm trong phạm vi đo của luồng
   này.
5. **Ảnh plain preview thay đổi** (xem §1.2): downscale 2 bước mềm hơn
   1 bước ở cửa sổ nhỏ — cần phán đoán sản phẩm; số đo cho thấy ảnh
   mới gần render hơn nên đây là thay đổi đúng hướng.
6. Nợ kế thừa chưa đụng (đợt 74 §4): resample dị hướng (B2), SEGFAULT
   vidstab (B7), gate FN lọt (B8), TTS 39 (B6), birefnet, Safari
   codec-probe nối UI (B3), preset 4:5 nối ExportPanel (B5),
   ci-security.yml + ci-build.yml 403.
7. Release gate giữ nguyên: KHÔNG release/tag.

## 8. File thay đổi (stage, KHÔNG push)

- `apps/web/src/preview.tsx` — sửa rò plain: helper
  `letterboxIntermediateSource` + cờ `srcAtLetterbox` + khối chuẩn
  hoá drawSrc về intermediate dw×dh khi media > letterbox.
- `apps/web/scripts/r75c1-analyze.mjs` — phân tích đo lại ocean w1440
  (Part C + Part D + leak corr + D1/D3 + baseline B1 tính lại).
- `apps/web/scripts/r75c1-fps.mjs` — đo FPS preview thật khi phát
  (warmup + đo + kiểm tra cứng playing/playhead).
- `docs/PHASE9_ROUND75_C1_OCEAN_PLAIN_FIX_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / log):
`hidden_files/round75-c1/` — `headed-w1440x900/` (snapshot + log vite/
chrome), `r75c1-analysis.json`, `r75c1-fps-*.json` (6 lượt),
`fps-sau*/fps-truoc*` (scratch vite/chrome). Bản shadow
`apps/.r75c1-shadow-web-orig` đã xoá khỏi repo sau khi đo xong.
Không sửa code production nào khác, không binary, không workflow `.yml`.
Không thêm key i18n (dict giữ 2405).

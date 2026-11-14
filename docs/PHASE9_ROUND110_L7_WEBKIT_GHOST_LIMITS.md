# PHASE9_ROUND110_L7_WEBKIT_GHOST_LIMITS — F6' ĐÓNG: lượt xác nhận WebKit lúc yên đạt bar + hiệu chuẩn ngưỡng + đo trễ nhãn–pixel

> Luồng L7, đợt 110, lượt cron 09:35 +07 14/11/2026 (bắt đầu 02:42Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ đợt 109 §4 mục 9 (K7): F6' mở một phần — cần đúng 1 lượt xác nhận lúc
> máy thật yên.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào (chỉ L1 được
> sửa đợt này — xem §0.1). Không đụng TTS 39, birefnet, `.github/workflows`,
> 0 binary.
>
> **Kết quả chính (5 ý):**
> 1. **F6' ĐÓNG.** Lượt xác nhận lúc yên đạt bar prereg: (1) nhãn 53/53 =
>    100,0% và (2) pixel-verified 53/53 = 100,0%, n=53 ≥ 30, trên cây L1
>    `9b27abe5…` (xem §0.1 về cây đo). Gate yên đạt tại lúc bắt đầu lượt
>    (load 0,31/1,78, không còn process probe/vite/browser/hog nào khác,
>    không vite.lock).
> 2. **Hiệu chuẩn ngưỡng WebKit xong:** tickCost total trung vị 40,5 ms
>    (p90 64,9, max 94) lúc yên vs 66,0 ms (p90 103,5, max 194) lúc nhiễm
>    tải (K7). Ngưỡng ứng viên đăng ký trước (median ≤100 ms) ĐƯỢC GIỮ
>    làm ngưỡng hợp lệ WebKit. Ghi rõ: ngưỡng này không phân biệt được
>    lượt yên với lượt nhiễm tải (xem §5).
> 3. **Trễ nhãn–pixel đo trực tiếp:** capture lag là THẬT cả lúc yên —
>    ghost đáng ngờ thật (c2) skp=1: n=7, median 8 frame (267 ms), max
>    16 frame (533 ms); skp=0: n=64, median 4 frame (133 ms), max 16
>    frame. Cụm lệch 18 frame của K7 KHÔNG tái hiện; cụm mới seq 326–327
>    lệch 16 frame (label 6 → presented 22). Đồng thời: strip 48px KHÔNG
>    bao giờ xác định duy nhất 1 frame (b) n=0 — giới hạn phương pháp,
>    xem §6.
> 4. **Hai chẩn đoán của K7 được phân giải theo hướng ngược nhau:** (a)
>    cửa sổ blend KHÔNG ỔN ĐỊNH là do tải — lúc yên spread median 0,6
>    (K7: 47,4), ngang Chromium 0,7; (b) nhãn ghost nhiễu là CẤU TRÚC —
>    lúc yên clean distinct vẫn chỉ 41,1% (K7: 43,1%), không cải thiện.
> 5. **Không hồi quy trên cây đo:** tsc 0, vite build PASS (6,59s),
>    ghostBlend 15/15, previewEngine 27/27, test E4 mới của L1 5/5 PASS.

## 0. Môi trường đo + prereg

- **Boot trong lúc đo: 2026-11-14 02:50:48Z.** L7 bắt đầu trên boot
  02:24:45Z; **reboot #39 (nhiều khả năng — số thứ tự chưa xác nhận từ
  nguồn độc lập, ghi theo boot time) xảy ra 02:50:48Z**, giữa lúc L7
  chuẩn bị (sau smoke test, trước khi poll bắt đầu 02:52:01Z). Không mất
  dữ liệu: mọi file L7 tới lúc đó đã nằm trên đĩa; poll + waiter khởi
  động sau reboot. Gap #38→#39 = 26'03" (02:24:45 → 02:50:48) — sàn
  reboot lại bị phá (sàn cũ 31'47" vốn đã bị phá bởi gap #32→#33 19'07";
  không còn sàn nào đứng được, chỉ ghi nhận).
- **Gate yên đạt tại poll 45 (03:36:17Z):** load 0,31/1,78; blockers=0
  (không vite/MiniBrowser/WebProcess/node probe/hog nào của luồng khác);
  vite.lock không tồn tại. Poll 1–44 (02:52–03:35Z, 44 phút) không có
  cửa: sóng tải của các luồng khác lên tới load1 ~36 (L3 giữ tải, L5
  chạy E1, vite của luồng khác giữ lock nhiều lượt liên tiếp). Hết 44
  phút mới có cửa — đúng quy định chờ 60–90 phút, không chạy nhiễm tải.
- **RAM khả dụng:** 1252 MB lúc bắt đầu lượt, 1335 MB lúc kết thúc.
  Birefnet KHÔNG chạy (RAM dưới ngưỡng guard).
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0 tại
  `/home/hatch/scratch-round63-r4/node_modules/playwright-core`. Launch
  headed qua Xvfb :193. Env launch: `GST_PLUGIN_PATH` +
  `GST_PLUGIN_SYSTEM_PATH` = `/usr/lib/x86_64-linux-gnu/gstreamer-1.0`.
- **Bar đăng ký trước** (prereg-l7.md, kế thừa K7 không đổi): case B,
  20 pass, `--disable-rvfc`, flip sau pass 5, tap ON + relabel ON.
  F6' ĐÓNG khi trên tick hậu flip+2000ms, viaRvfc=0: (1) ≥90% tick
  skippedLatest=1 không chứa ghostPix với `frame == presented` VÀ (2)
  ≥90% tick skippedLatest=1 không có VI PHẠM THẬT (ghost label==
  presented mà strip khớp đúng frame presented), với n ≥ 30 tick.
- **Ngưỡng hợp lệ ứng viên đăng ký trước:** lượt WebKit HỢP LỆ khi
  20 pass hoàn thành, video phát thật, tickCost trung vị ≤100 ms
  (gợi ý K7 §9.3). Nếu lượt yên cho median >100 ms thì gắn cờ "hợp lệ
  chưa chắc chắn", không tự nâng ngưỡng — điều này KHÔNG xảy ra (median
  40,5 ms, xem §5).

### 0.1 Cây đo KHÔNG phải cây đóng băng ced42efd — L1 đã sửa production

- Lúc L7 bắt đầu (02:42Z): preview.tsx md5 `ced42efd…` (cây đóng băng
  K7). **Trước lượt đo, L1 đã sửa production đợt 110** (file chia sẻ
  `hidden_files/round110-preview-md5.txt`: `9b27abe57975ec5b69ec2e21c3fa281c
  2026-11-14T02:55:02Z L1-fix`). Lượt yên đo trên cây **`9b27abe5…`**,
  nhất quán trước/sau probe (chain-l7.log ghi 9b27abe5 ở cả đầu và cuối
  lượt). Đây là trường hợp nhiệm vụ đã dự kiến ("L1 có thể sửa
  production đợt này — ghi rõ md5 nào lượt này dùng").
- **Diff ced42efd → 9b27abe5 (preview.tsx, 58 dòng diff) + 2 file L1
  khác** (`src/lib/driftConfirmSkip103E4.ts`,
  `src/lib/driftConfirmSkip103E4.test.ts`, mtime 02:53–02:54Z): tách tín
  hiệu skip-render — gate E4 chỉ bỏ vẽ, KHÔNG còn kích giữ R2 (cơ chế
  CAP đo ở K1 đợt 109); `syncMedia` trả `SkipRenderDecision` 2 cờ thay
  vì boolean; bộ đếm N3 chỉ đếm tick bỏ vẽ vì seeking. **Không có thay
  đổi nào ở đường ghost/ring/skipLatest** (diff chỉ chạm call-site
  syncMedia + module drift-confirm skip). Vì vậy kết quả skipLatest đo
  được vẫn trả lời đúng câu hỏi F6' (cơ chế skipLatest), nhưng ghi rõ:
  verdict ĐÓNG này gắn với cây `9b27abe5…`, không phải cây `ced42efd…`
  mà K7 đo. Nếu vòng sau cần số trên đúng cây ced42efd thì phải đo lại
  — L7 không tự gộp hai cây thành một kết luận.
- Hồi quy trên cây `9b27abe5…` xanh hết (xem §7), gồm test E4 mới của
  L1 5/5 PASS — cây đo là cây tốt, không phải cây hỏng.

## 1. Lượt xác nhận lúc yên — số đo

Lượt duy nhất: 03:36:17–03:37:35Z (78s), case B, 20 pass,
`--disable-rvfc`, flip sau pass 5 (wallMs=25611), tap ON + relabel ON,
vite :5184 (config tạm `vite.config.l7-temp.ts`, watch ignore tất cả,
vite lên sau 2s, 0 crash ENOSPC), Xvfb :193, probe_exit=0. JSON:
`round110-l7/preview-b-f3-flip-land-webkit-quiet.json` (3.285.148 byte).
Load lúc kết thúc lượt 2,75/2,24 — chủ yếu là tải của chính probe
(WebKit + GStreamer + vite); gate tính tại lúc BẮT ĐẦU lượt theo prereg.

| Chỉ số | L7 yên (cây 9b27abe5) | K7 nhiễm tải (cây ced42efd) | Chromium C3b-quiet | Nhận xét |
|---|---|---|---|---|
| BlendTick / pass | 390 / 20 pass | 406 / 20 pass | 1892 / 20 pass | Tương đương K7 |
| Khung rAF / pass | 33–52 (median 42, tổng 850) | 20–35 (median 30, tổng 774; 3 pass 72–132) | 30–131 (đa số 100+) | Yên: đều hơn, không còn pass bùng 132 khung (đuổi kịp sau stall) |
| Canvas preview | 872×476, scale 0,661 | 872×476, scale 0,661 | 872×276, scale 0,383 | Như K7 |
| **Clean distinct hậu flip+2000ms** | **37/90 = 41,1%** | **44/102 = 43,1%** | **74/94 = 78,7%** | Không cải thiện lúc yên → nhiễu nhãn là cấu trúc (§4) |
| Clean mọi occurrence | 251/427 = 58,8% | 183/320 = 57,2% | — | Như K7 |
| Gap presented−expected \|≤3\| | 281/281 = 100% (tất cả đúng 0) | 284/284 = 100% (tất cả đúng 0) | 100% | Presented WebKit KHÔNG lệch bao giờ |
| Phủ anchor | anchorSrc frameIdx 281/281 (100%), tap 0 | frameIdx 284/284 (100%), tap 0 | tap 1476/1506 (98,0%) | Tap vẫn vô dụng trên WebKit |
| tickCost total trung vị / p90 / max | **40,5 / 64,9 / 94 ms** (n=502) | **66,0 / 103,5 / 194 ms** (n=486) | 11,4 / 15,0 ms | Xem §5 — ngưỡng ≤100 ms giữ được |
| tBlend gap trung vị / p90 | **77 / 105 ms** | **112 / 208 ms** | ~33 ms | Yên: tick dày hơn (~13 tick/s vs ~9) |
| gStd spread (cửa sổ đã vẽ) med / max | **0,6 / 76** (48 nhóm) | **47,4 / 76,2** (44 nhóm) | 0,7 / 47,8 (126 nhóm) | Yên: ổn định ngang Chromium (§4) |
| gStdMed tại t=0,5 / 1 / 1,5 | 113,7 / 86,0 / 83,8 (pause ~113,9) | 84,0 / 84,2 / 38,4 (pause ~114) | 37,6 / 37,5 / 37,5 (pause ~112) | Yên: blend "sắc" hơn — xem §4.1 |
| trailMax / edgeL/R med | 0 / 1,2 / 2,2 px | 0 / 1,2 / 2,2 px | 0 / 1,2 / 2,1 px | Mask + mép đúng như K7 |
| cx lệch median / max | 0,001 / 0,0008 | 0,001 / 0,0008 | 0,001 / 0,0008 | Tâm mask đúng track |
| ring sau phát / ringClears | 3 / 48 (dbg cuối pass) | 3 / 52 | 3 / 40 | Ring đủ 3 snapshot |
| pageErrs | [] (0 lỗi trang) | [] | — | Không có pageerror/console.error nào |

## 2. F6' — phân tích skipLatest (analyzer K7 tái dùng nguyên vẹn)

Tính trên blend tick hậu flip+2000ms, viaRvfc=0 (281 tick).
Ground-truth `round97-y2/frames-stripes`, `match_set` span=3/thresh=2.

| | skippedLatest=1 (CHÍNH) | skippedLatest=0 (đối chứng) | K7 skp=1 (tham chiếu) |
|---|---|---|---|
| n tick | **53 (≥30 ✓)** | 228 | 78 |
| (1) Nhãn: tick KHÔNG chứa ghost==presented | **53/53 = 100,0%** | 228/228 = 100,0% | 78/78 = 100,0% |
| (2) Pixel-verified: tick KHÔNG có vi phạm thật | **53/53 = 100,0%** | 228/228 = 100,0% | 78/78 = 100,0% |
| (2) Ứng viên ghost label==presented | 0 strip | 0 strip | 0 strip |
| (3) Ghost strip khớp presented, label khác: alias / đáng ngờ thật | 26 / 7 | 33 / 64 | 59 / 7 |
| (4) Label-clean distinct | 15/28 = 53,6% | 37/90 = 41,1% | 9/17 = 52,9% |
| (4b) Label-clean mọi-occurrence | 87/100 = 87,0% | 164/327 = 50,2% | 133/141 = 94,3% |

- **Bar (1) và (2) đều đạt 100,0% ≥ 90%, n=53 ≥ 30 → F6' ĐÓNG theo
  prereg.** Lượt yên + lượt nhiễm tải K7 cùng cho 100%/100% trên hai
  cây khác nhau (ced42efd và 9b27abe5) — kết luận không phụ thuộc tải
  hay cây E4-fix.
- **Caveat trung thực (đã đăng ký trước trong prereg-l7): (2) đạt 100%
  vì (1) đã loại hết ứng viên (0 ghost label==presented)** — kiểm tra
  pixel lại không có ứng viên để kiểm, cả hai lượt. (2) ở đây là hệ quả
  của (1), không phải bằng chứng pixel độc lập mạnh. Bằng chứng pixel
  thực sự nằm ở (3)/(c2): ghost có pixel đúng là presented nhưng nhãn
  khác — xem §6. Chúng KHÔNG tính là vi phạm skipLatest vì quyết định
  skip dựa trên nhãn (định nghĩa bar), nhưng chúng cho thấy bảo đảm ở
  mức pixel yếu hơn con số 100% — xem diễn giải §6.3.
- (4) cho thấy tick skippedLatest=1 "sạch" hơn tick skippedLatest=0 một
  cách có hệ thống (distinct 53,6% vs 41,1%; mọi-occurrence 87,0% vs
  50,2%) — như K7: khi pump bắt kịp (điều kiện để skipLatest=1) thì
  nhãn cũng chính xác hơn.

## 3. Phối hợp tải — chờ 44 phút mới có cửa yên

- Poll 1 (02:52:01Z): load 2,66/0,76, blockers=0, không lock — chỉ
  load1 > 2 (dư âm hog vừa tắt). Poll 2: 3,28/1,36. Poll 3–5: load vọt
  17,64 → 29,18 → 35,92; blockers 30 → 39 (L3 giữ tải 30 hog + vite
  của luồng khác giữ lock từ 02:54Z). Sóng tải kéo dài qua poll ~40
  (L5 chạy E1 run26/run28, L3 load-holder, vite luân phiên giữa các
  luồng). Poll 45 (03:36:17Z): load 0,31/1,78, blockers=0, không lock
  — cửa mở, chạy ngay. Tổng chờ 44 phút, trong giới hạn 90 phút.
- Reboot #39 (02:50:48Z) xảy ra TRƯỚC khi poll bắt đầu — không ảnh
  hưởng lượt đo (poll + waiter khởi động sau reboot; mọi file chuẩn bị
  đã nằm trên đĩa).
- Smoke test trước đó (02:43–02:44Z, boot cũ): WebKit 27.2 launch OK,
  `page.evaluate(string)` OK; video khởi động chậm (ct=0,0667 sau 4s)
  lúc tải ~4–5 — đói CPU, không phải lỗi GST (pageErrs [], không error
  event; lượt đo thật sau đó phát bình thường). Ghi rõ để khỏi chẩn
  đoán sai như K7 §3.1.

## 4. Hai chẩn đoán K7 được phân giải

### 4.1 Cửa sổ blend KHÔNG ổn định là do tải (đã rõ)

- gStdSpreadDrawn spreadMed: **0,6 lúc yên vs 47,4 lúc nhiễm tải**
  (nGroups 48 vs 44; spreadMax ~76 cả hai). gStdSpread toàn cục:
  0,5 vs 48. gStdSpreadDrawnPresented: 0,3 vs 46. Lúc yên, cửa sổ blend
  WebKit ổn định ngang Chromium (0,7). Kết luận: blend "không ra tmix
  đúng" ở K7 là hậu quả của tick thưa + ring refill liên tục dưới tải,
  không phải đặc tính cố hữu của WebKit. SpreadMax vẫn 76 cả hai lượt
  — vẫn còn vài nhóm cửa sổ xấu nhất (worst frameIdx 17, 47, 50), tức
  đuôi xấu chưa biến mất hẳn, chỉ median đã về mức tốt.
- gStdMed tại t=0,5/1/1,5 lúc yên: 113,7/86,0/83,8 (pause ~113,9) vs
  K7: 84,0/84,2/38,4. Lúc yên blend "sắc" hơn (gần pause hơn): cơ chế
  phù hợp nhất — tick nhanh hơn (gap 77 vs 112 ms) nên ring 3 frame
  phủ cửa sổ thời gian ngắn hơn → các frame trong ring gần nhau hơn →
  ít chuyển động giữa chúng → blend ít mờ hơn. Đây là chẩn đoán từ số
  đo, chưa chứng minh nhân quả trực tiếp; không thuộc F6'.

### 4.2 Nhãn ghost nhiễu là CẤU TRÚC, không phải do tải

- Clean distinct hậu flip+2000ms: **41,1% lúc yên vs 43,1% lúc nhiễm
  tải** (37/90 vs 44/102) — không cải thiện khi máy yên. Mọi-occurrence:
  58,8% vs 57,2%. Kết luận: nhiễu nhãn trên WebKit không phải do tải
  (K7 từng nghiêng về giả thuyết này); nó là đặc tính của đường tick
  WebKit — mọi anchor là frameIdx từ currentTime lúc tick, tick thưa
  (77 ms), không có tap nuôi presented (tap 0/281). Đây là giới hạn đã
  biết của nhãn WebKit, không lật skipLatest (§2) nhưng phải ghi rõ:
  **nhãn ghost WebKit vẫn nhiễu (41%) dù đã yên.**

## 5. Hiệu chuẩn ngưỡng hợp lệ WebKit

- tickCost.total (ms/tick, trường `total` trong `y2.tickCost`):
  yên median **40,5** (p90 64,9, max 94, min 27, n=502); nhiễm tải
  median **66,0** (p90 103,5, max 194, min 31, n=486); post-flip
  median 40,0 vs 80,0. Chromium: 11,4 (p90 15,0).
- **Ngưỡng ứng viên đăng ký trước (median ≤100 ms) ĐƯỢC GIỮ** làm
  ngưỡng hợp lệ WebKit: lượt yên 40,5 ≤ 100. Hiệu chuẩn từ 2 lượt
  WebKit (K7 nhiễm tải 66,0 + L7 yên 40,5). Đây là ngưỡng HỢP LỆ
  (phát hiện lượt đói CPU — như smoke K7 video không phát lúc tải 27),
  không phải bar chất lượng.
- **Ghi rõ giới hạn của ngưỡng này:** ≤100 ms KHÔNG phân biệt được
  lượt yên (40,5) với lượt nhiễm tải (66,0) — cả hai đều qua. Một
  ngưỡng chặt hơn (vd median ≤60 ms, hoặc p90 ≤75 ms) sẽ phân biệt
  được hai lượt này, nhưng n=2 lượt là quá ít để đặt ngưỡng chặt —
  **không tự nâng ngưỡng sau khi thấy số.** Nợ mở: hiệu chuẩn lại khi
  có thêm lượt WebKit (cần ≥3–4 lượt yên nữa mới đặt ngưỡng phân biệt
  tải một cách có căn cứ).
- Chỉ số phụ để hiệu chuẩn tương lai: tBlend gap median 77 ms (p90
  105) lúc yên vs 112 ms (p90 208) lúc tải; khung rAF/pass median 42
  (33–52) vs 30 (20–132).

## 6. Đo độ trễ nhãn–pixel trực tiếp (analyzer mới analyze-l7-labellag.py)

Phương pháp (đăng ký trước trong prereg-l7): với mọi ghostPix occurrence
hậu flip+2000ms có labelMs, match strip với ground-truth strips
(match toàn cục 0..89, thresh ≤2 bit) để lấy frame pixel-thật; trễ =
matchedFrame − labelFrame (30 fps → 1 frame = 33,3 ms). Ba lát cắt:
(a) frame khớp gần nhất, (b) chỉ occurrence khớp DUY NHẤT 1 frame,
(c) tập "đáng ngờ" (strip khớp presented, label khác) tách alias khỏi
đáng ngờ thật theo định nghĩa K7 (3).

### 6.1 Kết quả trên lượt yên

| Lát cắt | skippedLatest=1 | skippedLatest=0 | K7 (tham chiếu) |
|---|---|---|---|
| (a) gần nhất: median / p90 / max | 0f / 1f / 2f (0/33/67 ms) | 0f / 2f / 2f | 0f / 0f / 2f (skp=1) |
| (b) khớp duy nhất 1 frame | **n=0** | **n=0** | n=0 |
| (c) strip khớp presented, label khác | n=33, median 14f (467 ms) | n=97, median 5f (167 ms) | n=66 / n=117 |
| (c1) trong (c): alias | n=26, median 14f | n=33, median 5f | n=59 / n=45 |
| **(c2) trong (c): ĐÁNG NGỜ THẬT** | **n=7, median 8f (267 ms), p90 16f, max 16f (533 ms), min 6f** | **n=64, median 4f (133 ms), p90 7f, max 16f (533 ms), min 1f** | **n=7, median 18f, max 18f / n=72, median 7f, max 19f** |
| (d) nomatch | 0/106 (0%) | 0/456 (0%) | 0% |

- (c2) skp=1, toàn bộ 7 ca: (144, presented 29, label 22, lag 7),
  (178, 51, 42, 9), (237, 32, 26, 6), (269, 34, 27, 7),
  (278, 57, 49, 8), (**326, 22, 6, 16**), (**327, 22, 6, 16**).
  Cụm lệch 18 frame của K7 (seq 301–306: label 46 → presented 64)
  KHÔNG tái hiện; cụm mới seq 326–327: cùng một ghost (label 6) tồn
  tại qua 2 tick với pixel là frame 22 — lệch 16 frame (533 ms).
- (c2) skp=0: n=64, median 4f (133 ms) — nhẹ hơn K7 (median 7f, max
  19f). Trễ giảm lúc yên nhưng KHÔNG biến mất: max vẫn 16f.
- (c1) alias skp=0 có 1 ca lag 58f (seq 126, label 0 → presented 58):
  strip GT của frame 0 bằng strip GT của frame 58 (footage tuần hoàn
  dài) — là alias, không phải trễ thật; nó cho thấy (c) thô (không tách
  alias) sẽ phóng đại trễ lên tới 58f (1933 ms) một cách sai.

### 6.2 Giới hạn phương pháp — ghi rõ, không giấu

- **(b) n=0 cả hai lượt:** KHÔNG có strip nào khớp duy nhất 1 frame
  trong 0..89 — strip 48px sọc tuần hoàn chu kỳ 4 frame nên mọi strip
  đều khớp nhiều frame. Trễ nhãn–pixel theo từng ghost đơn lẻ là
  **không xác định được** từ strip; chỉ lát (c2) (so với presented)
  mới có thông tin. Đây là giới hạn của fixture sọc, không phải lỗi
  đo — muốn đo trễ tuyệt đối từng ghost cần fixture không tuần hoàn
  (nợ mở, xem §8).
- **(a) bị chặn bởi alias:** frame khớp gần nhất luôn trong ±2 frame
  của label theo cấu trúc (chu kỳ 4) — max 2f là tính chất của phương
  pháp, không phải số đo trễ thật. Không được trích (a) như "trễ chỉ
  0–2 frame".
- **Trễ trong (c2) vẫn mơ hồ modulo 4:** frame pixel-thật thuộc tập
  M (mọi frame khớp strip); lag báo cáo = presented − label giả định
  frame thật là presented. Frame thật có thể là presented ± 4k — trễ
  thật có thể nhỏ hơn số báo cáo tới 4k frame. Số báo cáo là cận trên
  theo nghĩa đó, không phải giá trị chính xác từng frame.

### 6.3 Diễn giải ảnh hưởng tới bar pixel-verified

- Capture lag là thật cả lúc yên (max ~16f ≈ 533 ms): snapshot được
  gán nhãn theo currentTime lúc bắt đầu capture nhưng pixel thực tế là
  frame mới hơn nhiều (tick thưa + decode GStreamer chậm). Hệ quả:
  nhãn cũ ≠ presented trong khi pixel đã là presented — tức (1) có thể
  đạt 100% một cách "giả" ở mức pixel: tick được tính là "không chứa
  ghost==presented" theo nhãn, trong khi một ghost trong pool có pixel
  đúng là presented (7 ca skp=1, 64 ca skp=0).
- Nhưng 7/64 ca này KHÔNG phải vi phạm skipLatest theo định nghĩa bar:
  quyết định skip dựa trên nhãn, và snapshot đó KHÔNG mang nhãn
  presented nên không bị skip vì lý do đó — nó ở trong pool vì nhãn của
  nó là frame cũ. Cơ chế skipLatest (loại snapshot mới nhất khỏi pool
  theo nhãn) hoạt động đúng như thiết kế; điều lag làm lộ là **nhãn
  không đáng tin** (41% clean), không phải cơ chế skip sai.
- Kết luận trung thực: **F6' đóng ở mức cơ chế theo nhãn** (đúng định
  nghĩa bar đã đăng ký). Bảo đảm ở mức pixel ("snapshot trong pool
  không bao giờ mang pixel của presented") thì CHƯA có — muốn có cần
  cơ chế khác (vd gán nhãn lúc capture xong thay vì lúc bắt đầu, hoặc
  fixture không tuần hoàn để đo trễ tuyệt đối). Đó là nợ mở, không
  phải lý do giữ F6' mở (bar đã định nghĩa rõ từ K7 và L7 đo đúng bar
  đó).

## 7. Kiểm chứng hồi quy (cây đo `9b27abe5…`, sau lượt đo)

- `tsc` apps/web: **exit 0**.
- `vite build` (config gốc): **PASS 6,59s** (cảnh báo chunk >500kB có
  từ trước).
- `ghostBlend.probe.test.ts`: **15/15 PASS**.
- `previewEngine.test.ts`: **27 test passed**.
- `driftConfirmSkip103E4.test.ts` (test E4 mới của L1): **5/5 PASS**
  (gồm pin hồi quy CAP K1: chỉ E4 → bỏ vẽ nhưng KHÔNG giữ R2).
- Không sửa file production nào (L7 chỉ tạo config tạm
  `vite.config.l7-temp.ts`, đã XOÁ sau khi đo xong như K7). preview.tsx
  md5 `9b27abe5…` không đổi trong suốt lượt đo + hồi quy.

## 8. Hạ tầng sau reboot #39 + ENOSPC

- **Reboot #39 (02:50:48Z):** wrapper MiniBrowser của K1 còn nguyên
  (fix `LD_LIBRARY_PATH` giữ `${LD_LIBRARY_PATH}` đã sống qua reboot);
  plugin GStreamer hệ thống đủ 269 file trong
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/`; `apt install` của L8 cho
  thấy libevent + gstreamer plugins đã ở bản mới nhất (0 gói mới) —
  boot này đã có sẵn qua apt. **L8 lúc L7 chạy chưa viết LIMITS xong**
  (chỉ có launch JSON clean/o8env đều OK 27.2 lúc 02:43Z + apt log);
  L7 dùng trạng thái hiện tại (wrapper K1 + plugin hệ thống) và ghi rõ
  — nếu L8 chốt sửa bền vững khác thì vòng sau dùng sửa đó.
- **ENOSPC:** vite tạm với `server.watch.ignored: ["**/**"]` lên sau
  2s, chạy trọn 20 pass, không crash (K7 đã kiểm chứng; L7 xác nhận
  lại trên boot mới). Lock vite: `mkdir hidden_files/vite.lock` giữ
  trong lúc đo, đã xoá sau khi xong (run script tự xoá).
- **Xvfb:** display :193 (dọn socket mồ côi trước khi lên, như K7).

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND110_L7_WEBKIT_GHOST_LIMITS.md` — file này. **File
  duy nhất trong repo mà L7 thay đổi** (L7 là luồng đo; config tạm đã
  xoá, không stage; 3 file production đổi là của L1, thuộc batch L1).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round110-l7-webkit-ghost.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l7/`
  (prereg-l7.md, probe104f3-ghost-k7.webkit.mjs, smoke-l7.mjs,
  smoke-l7.log, analyze-k7-skiplatest.py, analyze-k7-flip.py,
  analyze-l7-labellag.py, poll-l7.sh, poll-l7.log, run-l7-quiet.sh,
  chain-l7.log, vite-5184-l7.log, run-webkit-quiet.log,
  preview-b-f3-flip-land-webkit-quiet.json 3.285.148 byte,
  analyze-*-quiet.txt, analyze-*-k7check.txt).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền lệ
  H5/I1/J6/K7: chỉ LIMITS + file repo; dữ liệu đo ở lại hidden_files,
  đủ để kiểm chứng lại).
- Cờ xong: `hidden_files/round110-l7-done` (tạo SAU KHI LIMITS + batch xong).

## 10. Nợ mở + đề xuất cho đợt sau

1. **F6' ĐÓNG (lượt yên này).** Không còn nợ xác nhận. Lưu ý caveat §2 +
   §6.3: (2) 0 ứng viên cả hai lượt; bảo đảm mức pixel chưa có (cần cơ
   chế gán nhãn lúc capture xong hoặc fixture không tuần hoàn để đo trễ
   tuyệt đối — nợ đo lường mới, không thuộc F6').
2. **Ngưỡng WebKit median ≤100 ms đã hiệu chuẩn nhưng chưa phân biệt
   tải:** cần thêm ≥3–4 lượt WebKit (yên + tải) mới đặt được ngưỡng
   chặt (vd median ≤60 ms) có căn cứ. Đừng tự nâng ngưỡng từ n=2.
3. **Nhãn ghost WebKit vẫn nhiễu (41,1% clean) dù đã yên — cấu trúc,
   không phải tải.** Tap vô dụng đã chứng minh (0/281). Nếu vòng sau
   muốn nhãn tốt hơn thì phải đổi cơ chế anchor/label trên WebKit, không
   phải chờ máy yên.
4. **Capture lag max ~16f (533 ms) lúc yên.** Cụm K7 (18f) không tái
   hiện; cụm mới seq 326–327 (16f) cho thấy lag là hiện tượng tái diễn,
   không phải outlier một lần. Cần fixture không tuần hoàn để đo trễ
   tuyệt đối từng ghost (hiện chỉ đo được qua (c2) so với presented,
   mơ hồ modulo 4).
5. **Cửa sổ blend đã ổn định lúc yên (spread 0,6) nhưng spreadMax vẫn
   76** — đuôi xấu chưa biến mất; theo dõi ở lượt sau, không thuộc F6'.
6. **Nợ khác đứng yên theo LIMITS gộp đợt 109 §4:** G1 chờ user quyết
   metric (G5/M2); mù #22 chờ user quyết; 2 MiB (queue2); Zombie dạng
   mạnh lặp lại + stall chuyển clip 5 s; E6 thiếu 1 sự kiện; E1 gate
   load1 ≥ ~8; EPERM probe #29 + mù #28 (L6 đợt này); birefnet 0 lần;
   TTS 39 CẤM kiểm lại; ci-security.yml 403; xử lý bền vững WebKit sau
   reboot (L8 đợt này); release gate không đổi. E4 đã sửa xong đợt này
   (L1) — A/B xác nhận E4 là việc của luồng khác, không phải L7.

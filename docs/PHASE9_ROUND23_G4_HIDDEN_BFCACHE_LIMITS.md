# Phase 9 đợt 23, luồng G4 — LIMITS: tab ẩn lâu / bfcache / tab đang phát lúc preview ngủ

> Luồng G4 đợt 23, nối tiếp đợt 22 luồng C. Repo làm việc:
> `~/workspace/repo-1`, KHÔNG push GitHub, KHÔNG release/tag, KHÔNG
> code giả. Trả 3 nợ của đợt 22 C §4.2: (1) tab ẩn LÂU (chỉ mới đo
> 3 s); (2) tab ẩn lúc ĐANG PHÁT (chỉ mới suy luận); (3) bfcache
> restore thật (đợt 22 mới gắn listener, chưa có run nào đi qua
> bfcache — pageshow = 0 trong cả 2 run đo).
> **Mọi số dưới đây đều đo trên VM này (2 vCPU, Xvfb, raster phần mềm,
> không GPU thật) và CẤM trích thành FPS/hiệu năng trên máy user** —
> xem §6. Đặc biệt: px hash chỉ có nghĩa SO SÁNH TRONG-RUN (cùng
> playhead, cùng run), cấm so hash tuyệt đối giữa các run (§4.3).

## 0. Kết luận ngắn (không vượt số đo)

1. **Tab ẩn lâu 60 s lúc ngủ — ĐÚNG cả 2 run:** ticks đóng băng,
   `sleeping = true` suốt lúc ẩn (đọc ở 5 s / 30 s / 60 s), px hash
   không đổi, canvas 1351×512 không bị discard, hiện lại vẽ lại
   đúng playhead cũ rồi ngủ lại (ticks đóng băng ở 1 s / 4 s / 10 s
   sau hiện). Không có dấu hiệu bitmap bị hủy khi ẩn 60 s.
2. **Tab ẩn lúc đang phát — ĐÚNG cả 2 run:** playhead đứng yên lúc
   ẩn (lastDrawn đóng băng ở 5 s và 10 s), hiện lại phát tiếp từ
   đúng điểm cũ, KHÔNG nhảy vọt bằng thời gian ẩn (nhảy vọt sẽ là
   +10 s rồi clamp về cuối 8 s; đo được chỉ +~2–3,3 s sau 3 s kể từ
   lúc hiện, tức đúng nhịp kể từ lúc hiện). Dừng phát xong vòng ngủ
   lại (`sleeping = true`).
3. **bfcache restore THẬT — ĐO ĐƯỢC cả 2 run (khác đợt 22):** rời
   trang trong cùng tab (navigate sang about:blank) rồi quay lại
   bằng history entry: marker trên window còn sống, listener
   `pageshow` ghi đúng 1 entry `persisted = true`, bundle sau khi
   về trùng bundle của run, href về đúng URL app. Sau restore, vòng
   lặp tỉnh (+17/+18 ticks), vẽ lại cùng playhead rồi ngủ lại
   (`sleeping = true`, lastDrawn không đổi, px ổn định ở 1 s và
   4 s sau restore). Đây là bằng chứng trực tiếp rằng listener
   `pageshow` của đợt 22 C hoạt động trên đường bfcache thật, không
   chỉ là suy luận.
4. **KHÔNG sửa app:** không phát hiện bug thật nào đủ bằng chứng
   (xem §4 — các lệch hash sau redraw đều cùng playhead, ổn định
   sau đó, và chưa đủ bằng chứng gọi là sai frame). `preview.tsx`
   KHÔNG đổi trong đợt này. Mọi thay đổi chỉ là script đo + file
   kết quả + file LIMITS này.

## 1. Phương pháp đo (kế thừa đợt 22 C, có sửa harness)

- Harness mới `apps/web/scripts/measure-v23-hidden-bfcache-pipe.mjs`:
  Playwright Chromium 156 headed dưới Xvfb 1920×1080×24, điều khiển
  qua `--remote-debugging-pipe`, build thật `apps/web/dist` chạy bằng
  `vite preview`, project mẫu tự load (2 clip webm 640×360 + 1 clip
  chữ, 1280×720@30fps, 8 s). KHÔNG build lại dist trong harness (tránh
  đụng các luồng đợt 23 khác đang chạy song song) — bundle của từng
  run được ghi vào kết quả để đối chiếu.
- 4 case trên CÙNG một trang, theo thứ tự D → A → B → C (bfcache để
  cuối vì nó đóng băng/rời trang):
  - **D (hồi quy ngủ ngắn đợt 22):** ngủ chắc chắn, ẩn 3 s qua
    `Target.activateTarget` sang tab trắng rồi về, đọc trước / lúc
    ẩn / sau hiện 1 s / 4 s.
  - **A (ẩn lâu):** ngủ chắc chắn, ẩn 60 s, đọc lúc ẩn ở ~5 s /
    ~30 s / ~60 s, hiện lại đọc 1 s / 4 s / 10 s.
  - **B (ẩn lúc đang phát):** Space phát, chờ 2 s (xác nhận đang
    phát: `sleeping = false`, lastDrawn tăng), ẩn 10 s, đọc lúc ẩn
    ở ~5 s / ~10 s, hiện lại đọc 1 s / 3 s, rồi Space dừng + chờ
    ngủ lại. Kiểm tra lệch: nếu playhead nhảy vọt bằng thời gian
    ẩn thì lastDrawn sau hiện 3 s sẽ ≈ điểm cũ + 13 s (và clamp về
    cuối 8 s); đúng phải là ≈ điểm cũ + 3 s.
  - **C (bfcache):** gắn probe trước khi rời trang — marker trên
    window + listener `pageshow` ghi `{persisted}` vào mảng. Rời
    trang trong cùng tab (navigate sang about:blank, rồi quay lại
    bằng history entry; nếu lần 1 không phải bfcache thì thử lần 2
    sang data:text/html rồi quay lại — cả 2 run đều thành công ngay
    lần 1 nên lần 2 không chạy). Tiêu chí bfcache THẬT: marker còn
    + có entry `persisted = true`; marker mất = reload hoàn toàn
    (không phải bfcache). Sau khi về, đọc thêm trạng thái vòng lặp
    ở 1 s và 4 s (ticks/sleeping/lastDrawn/px) — không chỉ marker.
- Probe: `window.__vcutPreviewIdle` (ticks/sleeping/lastDrawn/
  lastRequested/pendingSeek — hook đo sẵn của T5), bộ đếm draw xấp
  xỉ theo phương pháp T5 (setTransform identity / 2), px hash mẫu
  mỗi 64 byte trên canvas 1351×512, và probe bfcache/visibility
  riêng (`window.__v23bc`).
- Sửa harness giữa đường (không phải lỗi app, ghi rõ để luồng sau
  không lặp lại):
  - **(a) Click đóng WelcomeModal phải click GÓC màn hình (20,20),
    không click giữa (960,540):** dialog giữa màn hình có
    `stopPropagation` nên click giữa rơi vào dialog, không đóng
    được (lần chạy đầu đợt 23: modal vẫn còn sau click, harness
    dừng đúng luật). Góc màn hình chắc chắn trúng backdrop
    (z-index 100 phủ toàn màn hình); fallback là click nút ✕ của
    chính modal bằng CDP mouse (vẫn là click thật, không dispatch
    JS). Sau sửa: `modal trước = true, sau click = false` cả 2 run.
  - **(b) Tab trắng dùng để ẩn tab app PHẢI tạo với
    `background: true`:** `Target.createTarget` mặc định tạo tab
    foreground và tự activate nó, khiến tab app thành hidden TRƯỚC
    khi đo pre. Hệ quả đo được ở lần chạy đầu đợt 23 (case D):
    pre đọc được `vis = hidden, sleeping = false, ticks` đóng băng
    — phím Home gửi qua CDP session vẫn tới trang app và đánh thức
    vòng ngủ, nhưng rAF không bao giờ nổ khi tab ẩn nên vòng kẹt ở
    `sleeping = false`, và `waitSleeping` chờ đủ 20 s rồi trả về
    trạng thái chưa ngủ. Đây là artifact của harness, KHÔNG phải
    bug app (user thật không thể bấm phím vào tab đang ẩn). Bản
    sửa: tạo tab trắng `background: true` + `waitSleeping` báo
    `sleepWaitTimedOut` để artifact kiểu này lộ ra trong dữ liệu.
    Lần chạy đầu đó đã bị LOẠI (file JSON cũ đã xóa, ghi lại từ
    2 run sau sửa); số case D/A/B/C dưới đây đều từ 2 run sạch.
  - **(c) Cổng preview run1 bị chia sẻ:** run1 dùng cổng 4187 thì
    phát hiện đã có một tiến trình vite preview khác của luồng
    khác đang nghe 4187 (tiến trình đó KHÔNG thuộc luồng này nên
    không kill); run1 vì thế phục vụ qua server đó (cùng thư mục
    dist nên kết quả vẫn đúng, bundle ghi nhận là bundle lúc load).
    Run2 dùng cổng riêng 4189. Khuyến nghị luồng sau: mỗi harness
    dùng cổng riêng, không mặc định 4187.

## 2. Số đo — 2 run sạch (bundle khác nhau do luồng khác rebuild dist giữa các run)

| | Run1 (bundle `index-01V1xg5w.js`, cổng 4187) | Run2 (bundle `index-DstN4GgT.js`, cổng 4189) |
|---|---|---|
| Baseline ngủ | ticks 11, sleeping=true, lastDrawn 0, px 12851050, canvas 1351×512 | ticks 8, sleeping=true, lastDrawn 0, px 12847916, canvas 1351×512 |

### Case D — hồi quy ngủ ngắn 3 s (đợt 22 C vẫn đúng)

| | Run1 | Run2 |
|---|---|---|
| Trước ẩn | px 12851050, ticks 12, sleeping=true, vis=visible | px 12847916, ticks 9, sleeping=true, vis=visible |
| Lúc ẩn 3 s | px không đổi, ticks 12 (đóng băng), sleeping=true, vis=hidden | px không đổi, ticks 9 (đóng băng), sleeping=true, vis=hidden |
| Sau hiện 1 s / 4 s | px không đổi, ticks 22, sleeping=true (đóng băng) | px không đổi, ticks 17, sleeping=true (đóng băng) |
| sleepWaitTimedOut | false | false |

### Case A — ẩn lâu 60 s lúc ngủ

| | Run1 | Run2 |
|---|---|---|
| Trước ẩn | px 12851050, ticks 23, sleeping=true | px 12847916, ticks 18, sleeping=true |
| Lúc ẩn 5 s | px không đổi, ticks 23, sleeping=true | px không đổi, ticks 18, sleeping=true |
| Lúc ẩn 30 s | px không đổi, ticks 23, sleeping=true | px không đổi, ticks 18, sleeping=true |
| Lúc ẩn 60 s | px không đổi, ticks 23, sleeping=true | px không đổi, ticks 18, sleeping=true |
| Sau hiện 1 s / 4 s / 10 s | px không đổi, ticks 29, sleeping=true (đóng băng) | px không đổi, ticks 26, sleeping=true (đóng băng) |

- Đọc bảng: 60 s ẩn không làm đổi frame, không discard canvas, vòng
  không tick thêm lần nào lúc ẩn; hiện lại tỉnh một đợt ngắn
  (+6/+8 ticks) rồi ngủ lại và giữ nguyên tới 10 s sau hiện.

### Case B — ẩn 10 s lúc đang phát

| | Run1 | Run2 |
|---|---|---|
| Trước ẩn (phát 2 s) | lastDrawn 2,2667, ticks 70, sleeping=false, px 13716689 | lastDrawn 2,4333, ticks 147, sleeping=false, px 13739005 |
| Lúc ẩn 5 s | lastDrawn 2,5, ticks 73, px 13819421 | lastDrawn 2,4667, ticks 149, px 13745110 |
| Lúc ẩn 10 s | lastDrawn 2,5, ticks 73, px 13819421 (giống hệt mốc 5 s) | lastDrawn 2,4667, ticks 149, px 13745110 (giống hệt mốc 5 s) |
| Sau hiện 1 s | lastDrawn 3,1, ticks 79, sleeping=false | lastDrawn 3,5667, ticks 169, sleeping=false |
| Sau hiện 3 s | lastDrawn 4,3, ticks 91, sleeping=false | lastDrawn 5,7667, ticks 219, sleeping=false |
| Lệch (post3 − preHide) | 2,03 s (đúng ≈3 s kể từ lúc hiện, trừ trễ resume; KHÔNG phải ~13 s) | 3,33 s (đúng ≈3 s kể từ lúc hiện, sai số đo thời gian; KHÔNG phải ~13 s) |
| Sau dừng + ngủ lại | lastDrawn 4,3667, ticks 93, sleeping=true | lastDrawn 5,8333, ticks 221, sleeping=true |

- Đọc bảng: chênh nhỏ giữa preHide và mốc ẩn 5 s (+0,23/+0,03 s
  lastDrawn, +3/+2 ticks) là khoảng đua giữa lần đọc pre và lúc tab
  thực sự ẩn xong (vòng đang phát nên tick tiếp trong vài chục ms
  đó) — bằng chứng là mốc 5 s và 10 s giống hệt nhau: trong lúc ẩn
  thật sự, playhead và ticks đóng băng hoàn toàn.
- Tốc độ tick sau hiện phụ thuộc tải VM, không phải hành vi app:
  run1 chỉ 12 ticks / 2 s (1 s → 3 s sau hiện), run2 được 50 ticks /
  2 s cùng khoảng đó — cùng một code, khác tải máy lúc chạy (nhiều
  luồng đợt 23 chạy song song trên VM 2 vCPU). Vì vậy cấm trích tốc
  độ tick lúc phát thành hiệu năng app; bất biến được claim chỉ là:
  tiếp tục từ điểm cũ, không nhảy vọt, dừng xong ngủ lại.

### Case C — bfcache restore thật (lần 1, about:blank → history back)

| | Run1 | Run2 |
|---|---|---|
| Lúc rời trang (depart) | lastDrawn 4,3667, ticks 93, sleeping=true, px 13593426 | lastDrawn 5,8333, ticks 221, sleeping=true, px 14330420 |
| Marker sau khi về | còn sống (`v23-bfcache-probe`) | còn sống (`v23-bfcache-probe`) |
| pageshow sau khi về | 1 entry, `persisted = true` | 1 entry, `persisted = true` |
| Bundle/href sau khi về | trùng bundle run, đúng URL app | trùng bundle run, đúng URL app |
| Sau restore 1 s | lastDrawn 4,3667 (không đổi), ticks 111, sleeping=true, px 13569401 | lastDrawn 5,8333 (không đổi), ticks 238, sleeping=true, px 13545569 |
| Sau restore 4 s | giống hệt mốc 1 s (ticks 111, sleeping=true, px 13569401) | giống hệt mốc 1 s (ticks 238, sleeping=true, px 13545569) |
| visChanges cả run | [hidden, visible] × 4 (D, A, B, C) | [hidden, visible] × 4 (D, A, B, C) |

- Đọc bảng: đây là bfcache thật theo đúng tiêu chí đã đặt trước
  (marker sống + `persisted = true` + cùng bundle/href), khác hẳn
  đợt 22 (pageshow = 0 vì đợt 22 không hề rời trang bằng history).
  Sau restore, vòng tỉnh một đợt (+18/+17 ticks), vẽ lại cùng
  playhead rồi ngủ lại và ổn định — listener `pageshow` của đợt
  22 C hoạt động đúng trên đường này. Không có code nào trong app
  chặn bfcache ở mức grep được: không có `beforeunload`/`unload`
  handler trong `apps/web/src/` (đã grep), và `preview.tsx` không
  dùng BroadcastChannel/SharedWorker/WebSocket/IndexedDB.
- Lưu ý: px sau restore khác nhẹ so với lúc rời trang (run1:
  13593426 → 13569401; run2: 14330420 → 13545569) ở cùng playhead,
  rồi ổn định tuyệt đối ở 1 s và 4 s. Xem §4.2 — chưa đủ bằng chứng
  gọi đây là sai frame.

## 3. Hồi quy khác trong cùng run

- WelcomeModal: trước đo `true`, sau click góc `false` cả 2 run
  (modal đóng đúng, không ảnh hưởng đo sau đó).
- Space phát/dừng + chờ ngủ lại ở cuối case B: đúng cả 2 run
  (`sleeping = true`, `sleepWaitTimedOut = false`).
- Không chạy lại scrub chuột/touch/pen trong đợt này (không phải
  nhiệm vụ G4; xem §5).

## 4. Dị thường + giới hạn đo (khai trung thực, không giấu)

1. **Hash frame 0 thay đổi nhẹ giữa các run, nhưng ổn định tuyệt
   đối trong-run:** run1 frame 0 = 12851050, run2 = 12847916, cùng
   canvas 1351×512, cùng playhead 0. Lần chạy đầu đợt 23 (đã loại,
   §1b) còn ghi 2388224 ở baseline — nhưng giá trị đó đã có TRƯỚC
   mọi lần ẩn, nên không thể quy cho ẩn/hiện. Giải thích khả dĩ
   nhất: frame đầu tiên vẽ ra phụ thuộc thời điểm video element
   decode xong frame đầu (seek tới 0 hoàn tất trước hay sau lần
   vẽ đầu), nên hash lần vẽ đầu dao động giữa các run; sau lần vẽ
   lại đầu tiên (do ẩn/hiện hoặc thao tác khác) thì ổn định. Hệ
   quả phương pháp: px hash CHỈ dùng so trong-run, cấm so tuyệt
   đối giữa các run, cấm kết luận "frame sai" chỉ từ hash.
2. **Hash sau redraw (hiện tab / bfcache restore) khác nhẹ so với
   trước redraw ở cùng playhead:** case C cả 2 run (§2), và case B
   lúc ẩn (px đổi nhẹ trong khoảng đua trước khi ẩn thật sự). Mẫu
   chung: redraw ở cùng playhead có thể cho hash khác nhẹ, rồi ổn
   định. Chưa đủ bằng chứng gọi là bug: hash là mẫu thưa (mỗi 64
   byte), không biết pixel nào đổi, và video element sau
   freeze/thaw có thể decode ra frame kề (vẫn đúng về mặt thời
   gian video). Muốn kết luận cần so pixel trực tiếp (dump
   ImageData đầy đủ trước/sau redraw và đếm pixel lệch + vị trí)
   — để lại cho luồng sau, không sửa app theo cảm tính.
3. **Bộ đếm draws là xấp xỉ** (phương pháp T5: setTransform
   identity / 2 — một frame có thể vẽ mà không qua đường đó):
   run1 case C draws 66 → 67 (+1), run2 không trích draws. Chỉ dùng
   draws làm chỉ dấu phụ; bất biến chính là ticks/sleeping/
   lastDrawn/px.
4. **Tốc độ tick lúc phát trên VM này không đại diện cho máy user:**
   run1 6 ticks/s, run2 25 ticks/s trong cùng khoảng sau hiện (xem
   §2 case B) — chênh nhau 4× chỉ vì tải máy khác nhau lúc chạy
   (nhiều luồng song song, raster phần mềm). Cấm trích thành FPS.
5. **Lần chạy đầu đợt 23 bị loại khỏi dữ liệu:** chỉ có 2 run sạch
   trong file JSON (run1/run2 sau sửa harness). Lần chạy đầu (trước
   sửa background:true + click góc) có case D nhiễm artifact
   (§1b) và file JSON của nó đã bị xóa trước khi chạy lại — không
   trộn số cũ/mới.

## 5. Chưa đo (nợ còn lại, không bịa)

- Tab ẩn LÂU HƠN (hàng giờ, qua đêm) và tab bị hệ điều hành/
  trình duyệt **discard thật dưới áp lực bộ nhớ** (trang bị kill
  rồi reload lại — khác bfcache: state JS mất, phải load lại từ
  IndexedDB/localStorage; chưa đo vì VM này không tạo được áp lực
  bộ nhớ thật một cách có kiểm soát).
- Tab ẩn lúc đang phát LÂU (phút) và lúc phát tới cuối timeline
  (playhead chạm duration trong lúc ẩn rồi hiện lại — vòng có dừng
  đúng không).
- Scrub tay / touch / pen trên máy thật (nhiệm vụ của luồng khác;
  đợt này chỉ đo qua CDP mouse ở các đợt trước, không đo lại).
- Nhiều tab/màn hình, dpr > 1, máy thật (không Xvfb), trình duyệt
  khác Chromium, và bfcache khi timeline nặng / project thật lớn
  (eligibility có thể đổi khi trang giữ tài nguyên nặng).
- So pixel trực tiếp trước/sau redraw để kết luận dứt khoát về
  §4.2 (cần dump ImageData đầy đủ, không chỉ hash mẫu thưa).
- iOS/Safari: bfcache và chính sách rAF khi ẩn tab khác Chromium,
  hoàn toàn chưa đo.

## 6. Cấm trích (nhắc lại)

- Cấm trích px hash, ticks, hay "ngủ lại sau N ticks" thành FPS/
  hiệu năng trên máy user: VM 2 vCPU, raster phần mềm, Xvfb,
  dpr = 1, canvas 1351×512, project mẫu nhẹ, tải máy thay đổi theo
  số luồng song song.
- Cấm trích "bfcache đã test xong": mới đo 1 đường (about:blank →
  history back, project mẫu, Chromium headed Xvfb); chưa đo
  discard, chưa đo máy thật, chưa đo Safari.
- Cấm trích "tab ẩn đã test xong mọi trường hợp": mới đo ẩn 3 s /
  60 s lúc ngủ và 10 s lúc phát; chưa đo ẩn hàng giờ, chưa đo phát
  tới cuối timeline lúc ẩn.

## 7. Kiểm chứng đã chạy (lệnh + kết quả số)

- `node --check apps/web/scripts/measure-v23-hidden-bfcache-pipe.mjs`:
  pass (trước mỗi lần chạy; script sửa 2 lần giữa đường, mỗi lần
  đều check lại).
- `node apps/web/scripts/measure-v23-hidden-bfcache-pipe.mjs` (2 run
  sạch, cổng 4187 rồi 4189, display tự chọn tránh display bận của
  luồng khác): run1 bundle `index-01V1xg5w.js`, run2 bundle
  `index-DstN4GgT.js` (khác nhau vì luồng khác rebuild dist giữa
  các run — mỗi run tự ghi bundle của mình, không ảnh hưởng bất
  biến trong-run). Cả 2 run exit 0, DONE ok=true.
- KHÔNG chạy `tsc`/`vite build`: không đổi code app nên không cần
  rebuild; dist dùng sẵn trên đĩa (tránh đụng luồng khác). File
  `preview.tsx` không đổi (xác nhận bằng mtime cũ, không thuộc
  đợt này).
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG stage (parent gộp batch). Các tiến trình đo của
  luồng này (vite preview/Xvfb/Chrome của run1/run2) đã dọn ở
  finally của script; tiến trình vite preview cổng 4187 còn sống
  thuộc luồng khác, không đụng vào.

## 8. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `apps/web/scripts/measure-v23-hidden-bfcache-pipe.mjs` (MỚI — đo
  ẩn lâu 60 s / ẩn lúc phát / bfcache / hồi quy ngủ ngắn qua pipe;
  cổng mặc định 4187, display :90–:94, có thể override bằng env
  V23_PREVIEW_PORT / V23_XVFB_DISPLAYS / V23_OUT / V23_RUN_LABEL).
- `benchmarks/results/v23-hidden-bfcache.json` (MỚI — 2 run sạch
  run1 + run2, đủ case D/A/B/C kèm ticks/sleeping/px-hash/
  canvasW/H/lastDrawn trước-sau từng case).
- `docs/PHASE9_ROUND23_G4_HIDDEN_BFCACHE_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa `preview.tsx`,
  store, nested, i18n, Timeline, WelcomeModal (hành vi modal là
  đúng, chỉ sửa cách harness click nó).

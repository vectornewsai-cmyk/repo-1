# Phase 9 đợt 30, luồng M1 — Chạy lại harness K3 sau vá + truy nguyên chọn frame theo lịch sử scrub

> Đóng nợ đợt 29 §3 mục 1–2 (L1): (1) harness K3 sau vá mới qua
> `node --check`, chưa chạy lại end-to-end bằng browser; (2) cơ chế
> chọn frame theo lịch sử scrub chưa khóa, bất đối xứng P2-vs-P6
> (FG đúng / sanity sai với cùng bước lùi 1 frame) chưa có lời giải.
>
> Kết quả chính, nói trước: **cả hai nợ đều đóng bằng phép đo, và
> phát hiện vượt ngoài dự kiến.**
>
> 1. **Harness K3 sau vá ĐÃ ĐƯỢC KIỂM CHỨNG end-to-end bằng browser
>    thật: 18/18 case chính KHỚP, cột resampled = 0,000 ở cả 18 case,
>    0 exception, exit = 0.** Bản vá L1 (bỏ `Math.round` tọa độ,
>    resample rẽ nhánh) từ nay được coi là đã kiểm chứng, không còn
>    là "mới qua syntax check".
> 2. **Bất đối xứng P2-vs-P6 KHÔNG PHẢI bất đối xứng clip/đường vẽ —
>    nó là cùng một cơ chế của app, và cơ chế đó đã bị bắt quả tang
>    bằng trạng thái element thật:** `seekElement` bỏ qua seek khi
>    |currentTime − target| ≤ đúng 1 frame (`seekEpsilonFor`), trong
>    khi Chrome báo `currentTime` đã lượng tử hóa xuống micro giây
>    (luôn ≤ giá trị đã set). Hệ quả: bước scrub lùi đúng 1 frame
>    luôn bị bỏ seek → hiển thị frame cũ; bước tiến 1 frame thường
>    được seek → đúng frame, trừ khi `currentTime` xuất phát là giá
>    trị biểu diễn chính xác được (vd 2,0s) thì cũng bị bỏ seek.
>    Mô hình này dự đoán đúng 9/9 quan sát sạch (xem §4).
> 3. **Phát hiện thứ hai, độc lập và nặng hơn về trải nghiệm:** seek
>    chậm hơn timeout 1200 ms của `seekElement` → vòng lặp vẽ tick
>    timeout trong lúc element chưa sẵn → `decideVideoFrame` skip →
>    vòng lặp ngủ với canvas đã xóa nền → **nền đen vĩnh viễn cho
>    tới lần scrub tiếp theo**, dù seek sau đó vẫn hoàn tất (đo
>    được 3/3 case timeout → đen vĩnh viễn; 2/2 case seek nhanh →
>    vẽ đúng). Đây là bug phía app, không phải lỗi harness.
>
> KHÔNG sửa code sản phẩm nào trong luồng này (nhiệm vụ chỉ cho sửa
> harness khi có căn cứ; căn cứ cho sửa app thì đã có — xem §7 — nhưng
> quyết định sửa thuộc về parent/vòng sau, và luồng này không đụng
> file `src/`). KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo.

## 0. Điều kiện đo (để số sau này so sánh được)

- Bundle đo: K3 rerun và probe v1 dùng `index-B1assKz-.js`,
  sha256[:16] = `7659cc3fb1474449` — đúng bundle của đợt 29 L1
  (dist snapshot tại thời điểm chạy, không build lại). Vì vậy số
  probe v1 so sánh trực tiếp được với số L1, và số K3 rerun so sánh
  trực tiếp được với K3 gốc.
- **Ngoại lệ bundle ở probe v2 (ghi rõ, không giấu):** giữa phiên v1
  (13:14) và phiên v2 (13:28), một luồng đợt 30 khác đã build lại
  dist, nên v2 snapshot phải bundle mới `index-C0HfodWe.js`,
  sha256[:16] = `fda3c753e1dccec1` (chứa các sửa đang làm dở của
  luồng khác ở ExportPanel/store/i18n/previewStatus — theo brief
  nhiệm vụ). Các file chứa cơ chế đo ở §4–§5 (`seek.ts`,
  `holdFrame.ts`, đường seek/draw của `preview.tsx`) không nằm
  trong danh sách file luồng khác đang sửa, và số v2 tái lập
  bit-identical với v1/L1 ở chỗ so sánh được (FG back1f: sweep
  dk0 2,527 / dk+1 0,000 đúng từng chữ số) — nên kết luận cơ chế
  vẫn đứng, nhưng **v2 không được trích là "cùng bundle với L1"**;
  phần nào chỉ có ở v2 (DARK-FIRST sau idle) phải kèm chú thích
  bundle C0HfodWe.
- Footage K: `clip-k-dod-iwo.mp4`, SHA256 khớp J3 `49f33b83…`,
  h264 1080×1920, 24000/1001, bt709. Proxy loại trừ trực tiếp như
  K3/L1 (badge PROXY ẩn; toast "Bridge không chạy … proxy tự động
  thất bại") — app vẽ từ file gốc.
- Trình duyệt: Chromium headed thật qua `--remote-debugging-pipe`
  (Playwright chromium-1248), Xvfb riêng mỗi phiên. Lần chạy K3 đầu
  trên :97/4197 bị `EADDRINUSE` (một luồng đợt 30 khác đang giữ cổng
  đó — không phải lỗi sản phẩm) nên chạy lại trên :96/4196.
- Thang V6 như cũ: KHỚP = MAD ≤ 2 VÀ ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ
  ≥ 90% ≤ 8; còn lại LỆCH. **Riêng probe này, verdict V6 KHÔNG đủ:**
  trường hợp FW-IN back1f cho V6 KHỚP (MAD 0,867) nhưng sweep cho
  thấy frame hiển thị thật là dk+1 (0,000), không phải dk0 — vì vậy
  mọi kết luận về frame trong file này đều dựa vào **sweep
  adjudication** (dk nào cho 0,000), không dựa vào nhãn V6.

## 1. Chạy lại harness K3 sau vá bằng browser thật — 18/18, exit 0

Harness: `apps/web/scripts/clicktest-dip-browser-pipe.mjs` (bản vá
của L1, luồng này KHÔNG sửa thêm dòng nào — chỉ chạy). Phiên:
display :96, port 4196, label `round30-m1-rerun`, JSON ra cùng
đường dẫn output của harness
(`benchmarks/results/v27-k3-canvas-dip-browser.json` — file này bị
ghi đè bằng dữ liệu rerun; parent quyết có stage bản rerun hay
không, luồng này không tự ghi paths-loop).

| Case | Playhead | p | alpha | MAD (point) | ≤8 | MAD resampled | ≤8 resampled | Verdict |
|---|---|---|---|---|---|---|---|---|
| S1-sanity-red-mid | 1,5 | — | 1,0000 | 0,000 | 100% | 0,000 | 100% | KHỚP |
| S2-sanity-green-mid | 6,0 | — | 1,0000 | 0,000 | 100% | 0,000 | 100% | KHỚP |
| FW-OUT-red-p0333 | 3,0333 | 0,0333 | 0,8859 | 0,156 | 100% | 0,000 | 100% | KHỚP |
| FW-OUT-red-p01 | 3,1 | 0,1000 | 0,4491 | 0,245 | 100% | 0,000 | 100% | KHỚP |
| FW-OUT-red-p05 | 3,5 | 0,5000 | 0,0000 | 0,000 | 100% | 0,000 | 100% | KHỚP |
| FW-IN-green-p01 | 4,1 | 0,1000 | 0,0000 | 0,000 | 100% | 0,000 | 100% | KHỚP |
| FW-IN-green-p05 | 4,5 | 0,5000 | 0,3466 | 0,392 | 100% | 0,000 | 100% | KHỚP |
| FW-IN-green-p0733 | 4,7333 | 0,7333 | 0,7056 | 0,340 | 100% | 0,000 | 100% | KHỚP |
| FW-IN-green-p0933 | 4,9333 | 0,9333 | 0,9396 | 0,347 | 100% | 0,000 | 100% | KHỚP |
| FG-OUT-green-p01 | 7,1 | 0,1000 | 0,4491 | 0,047 | 100% | 0,000 | 100% | KHỚP |
| FG-OUT-green-p05 | 7,5 | 0,5000 | 0,0000 | 0,333 | 100% | 0,000 | 100% | KHỚP |
| FG-IN-mag-p01 | 8,1 | 0,1000 | 0,0000 | 0,333 | 100% | 0,000 | 100% | KHỚP |
| FG-IN-mag-p05 | 8,5 | 0,5000 | 0,3466 | 0,333 | 100% | 0,000 | 100% | KHỚP |
| FG-OUT-custom-p01 | 15,1 | 0,1000 | 0,4491 | 0,171 | 100% | 0,000 | 100% | KHỚP |
| FG-OUT-custom-p05 | 15,5 | 0,5000 | 0,0000 | 0,333 | 100% | 0,000 | 100% | KHỚP |
| GRAD-FW-IN-p01 | 16,1 | 0,1000 | 0,0000 | 0,000 | 100% | 0,000 | 100% | KHỚP |
| GRAD-FW-IN-p05 | 16,5 | 0,5000 | 0,3466 | 0,313 | 100% | 0,000 | 100% | KHỚP |
| GRAD-FG-OUT-p05 | 19,5 | 0,5000 | 0,0000 | 0,388 | 100% | 0,000 | 100% | KHỚP |

Đọc đúng cột resampled — đây mới là bằng chứng bản vá:

- Trước vá, cột resampled của sanity mang artefact 2-bước (L1 P5:
  MAD ~3,0 trên footage) và dip mang artefact offset 438 (dip
  white 1,19–1,95; dip gray 3,19–4,48). Sau vá, **cột resampled =
  0,000 ở cả 18 case, kể cả 2 case sanity** — tức chuỗi 1 bước cho
  sanity và chuỗi 2 bước cho dip đều tái lập đúng đường app trên
  browser thật, trên cùng bundle với L1. Nợ "bản vá chưa chạy lại
  end-to-end" từ nay đóng.
- Cột point-sampled (0,000–0,392, ≤8 = 100% mọi case) vẫn KHỚP như
  K3 gốc — không hồi quy. HandleDelta = 0 ở mọi case, retried =
  False ở mọi case, 0 exception.
- Perf (cận trên gồm seek/decode/rAF, như K3): dip longtask
  [55/197, 58/80/305, 123] ms; thường [62/57, —, 63] ms — cùng họ số
  với K3, không đo lại để kết luận perf (không phải mục tiêu luồng).
- Case footage thật (chỉ thông tin, không gating): REAL-FW-IN
  point MAD 12,709 / resampled **0,000**; REAL-FG-OUT 36,755 /
  **0,000**; REAL-SANITY 40,556 / **0,000** — cột point LỆCH là
  artefact lấy mẫu điểm trên footage (đã biết từ K3), cột resampled
  sau vá KHỚP từng bit cả 3 case, kể cả sanity. Frame-search-wide
  của K3 cho thêm chi tiết: offset −1 trên lưới 30fps cũng cho
  resampled 0,000 — vì 3,4667 và 3,5 cùng nằm trong khoảng frame
  nguồn 83 [3,4618, 3,5035) nên browser cho cùng frame; không phải
  mâu thuẫn, chỉ là lưới 30fps không đủ mịn để tách frame kề ở
  legacy-p sát biên.
- Kết luận K3: `DONE clicktest-dip-browser: 18/18 case chính KHỚP,
  0 không KHỚP, exit=0` (log trong JSON). Từ nay được trích bản vá
  L1 là "đã kiểm chứng bằng browser", không còn "mới qua syntax
  check".

## 2. Phương pháp probe: đọc trạng thái seek thật của element app

Harness mới (của luồng này):
`apps/web/scripts/clicktest-dip-seek-round30-m1.mjs` — kế thừa
harness v29 L1 (PipeCdp + Xvfb + snapshot dist + seed footage K +
`pageMeasureDip` chuỗi đúng + sweep lưới fps gốc), cộng thêm hook
đo cài **trong trang, không sửa code sản phẩm**:

- Bọc `document.createElement("video")` để gắn listener
  `seeking`/`seeked` + gán id cho mọi video element tạo sau khi
  cài (cài sau `loadSession`, trước `importMedia`, nên bắt được cả
  element thumbnail/probe lẫn element pool).
- Bọc setter `currentTime` trên `HTMLVideoElement.prototype` để log
  mọi lần app gán seek (chỉ forward qua setter gốc, không đổi hành
  vi). Hook qua `node --check` + chạy thật 2 phiên, `setterError =
  null` cả 2 phiên.
- Mỗi probe: prescrub theo hướng tiếp cận (scrub có settle kiểu
  cũ) → click tới target **không settle** → poll element + hash
  canvas mỗi ~150ms tới 6s → đo pixel (chuỗi đúng + sweep) → chờ
  idle 2s rồi snapshot lại element + hash (kiểm tra frame có tự
  trôi về frame đúng khi không scrub thêm không).
- Element pool thật được nhận diện bằng src `blob:` còn hiệu lực
  (control video của harness dùng URL http, thumbnail đã `src=""`
  nên không nhầm).

**Sửa sai của chính luồng này (ghi rõ để không ai trích nhầm log
v1):** phiên v1 có tới **3 element blob** (ids 1, 2, 3), không phải
1 như kỳ vọng. Id 1, 2 là element probe/thumbnail inert
(readyState = 0, currentTime = 0, không bao giờ seek); id 3 mới là
pool thật (readyState = 4, currentTime bám theo scrub). Tóm tắt
log v1 lấy phần tử blob **đầu tiên** nên in `ct=0, khớp=false` sai
lệch cho mọi probe — **dữ liệu thô JSON v1 vẫn đầy đủ** (mọi blob
đều có trong chuỗi poll) và toàn bộ phân tích trong file này đã
làm lại từ JSON, lấy element #3 (active). Phiên v2 đã sửa harness:
dùng `activePoolElement` (blob có readyState cao nhất) cho mọi
tóm tắt, và log in đủ currentTime của mọi blob. Log v2 xác nhận
tóm tắt đã đúng (`active pool #3 … ct=3.533333 …`).

**Sửa thứ hai (quan trọng hơn):** guard khung tối kiểu K3/L1
(scrub detour +1 frame rồi quay lại) **phá hướng scrub gốc cần đo**
— detour tự nó là một bước back1f. 4 probe v1 bị nhiễm detour
(FG back1f/fwd1f/fwd0, FB fwd1f) nên verdict cuối của chúng KHÔNG
được dùng làm bằng chứng hướng scrub sạch (chỉ dùng làm bằng
chứng nhất quán với mô hình, xem §4). Phiên v2 bỏ hẳn detour:
lần đo đầu tối thì ghi `DARK-FIRST`, chờ idle 2s, poll lại và đo
lại **không scrub**; verdict chính là lần đo đầu, lần đo sau chỉ
là follow-up (`secondMeasure`).

Ma trận probe (cùng seed footage K của L1; mỗi đường vẽ một target
phân biệt được frame thật — không dùng target alpha = 0 của
fadeblack/fadewhite vì đầu ra không phụ thuộc frame):
thường = SANITY 14,0333; fadeblack 1 bước = FB-OUT p = 0,1 tại 3,1;
dip white = FW-IN legacy 4,5; dip gray = FG-OUT legacy 11,5. Mỗi
target có back1f / fwd1f / fwd0 (sanity back1f chạy 2 lần).

## 3. Số đo probe: frame hiển thị thật (sweep adjudication)

Quy ước đọc: "frame hiển thị" = dk cho sweep = 0,000 (khớp từng
bit), không phải nhãn V6. `seek?` = có `currentTime` set + cặp
seeking/seeked của element pool #3 trong cửa sổ probe hay không
(đọc từ log sets/events đã lọc src blob).

### 3.1 Phiên v1 — 11 probe (display :94, port 4194)

| Probe | Tiếp cận | Frame hiển thị (sweep) | seek? | Ghi chú |
|---|---|---|---|---|
| FG-OUT back1f | 11,5333 → 11,5 | **84 = frame trước** (dk+1 0,000; dk0 2,527) | KHÔNG (ct kẹt 3,5333; 1 event seeked = prescrub hoàn tất muộn) | Lần đo đầu TỐI → detour nhiễm |
| FG-OUT fwd1f | 11,4667 → 11,5 | 83 = frame đích (dk0 0,000) | CÓ (set 3,5 — thời điểm mơ hồ do detour) | Lần đo đầu TỐI → detour nhiễm |
| FG-OUT fwd0 | 0 → 11,5 | 83 = frame đích (dk0 0,000) | CÓ (set 3,5 — mơ hồ do detour) | Lần đo đầu TỐI → detour nhiễm |
| SANITY back1f | 14,0667 → 14,0333 | **49 = frame trước** (dk+1 0,000; dk0 3,302) | KHÔNG (ct kẹt 2,0667; 0 set, 0 event) | SẠCH — tái lập P6 của L1 |
| SANITY fwd1f | 14,0 → 14,0333 | **47 = frame trước** (dk−1 0,000; dk0 3,283) | KHÔNG (ct kẹt 2,0; 0 set, 0 event) | SẠCH — mới so với L1 (P5 của L1 cho 48) |
| SANITY fwd0 | 0 → 14,0333 | 48 = frame đích (dk0 0,000) | CÓ (set 2,033333333333333; seek 787 ms) | SẠCH |
| SANITY back1f-repeat | 14,0667 → 14,0333 | **49 = frame trước** (dk+1 0,000; dk0 3,302) | KHÔNG (ct kẹt 2,0667) | SẠCH — back1f 3/3 qua 2 phiên (L1 P6 + 2 lần này) |
| FW-IN back1f | 4,5333 → 4,5 | **12 = frame trước** (dk+1 0,000; dk0 0,867) | KHÔNG (ct kẹt 0,5333) | SẠCH — nhưng V6 ghi KHỚP (0,867 ≤ 2): nhãn V6 che mất lệch 1 frame, chỉ sweep mới thấy |
| FW-IN fwd1f | 4,4667 → 4,5 | 11 = frame đích (dk0 0,000) | CÓ (set 0,5; seek 355 ms) | SẠCH |
| FB-OUT back1f | 3,1333 → 3,1 | **75 = frame trước** (dk+1 0,000; dk0 1,485) | KHÔNG (ct kẹt 3,1333) | SẠCH |
| FB-OUT fwd1f | 3,0667 → 3,1 | 74 = frame đích (dk0 0,000) | CÓ (set 3,1 — mơ hồ do detour) | Lần đo đầu TỐI → detour nhiễm |

Đọc gộp v1 (chỉ tính probe sạch): back1f → frame trước 3/3
(SAN ×2, FW, FB — cộng FG back1f nhiễm detour nhưng cùng chiều);
fwd1f → SAN cho frame trước, FW cho frame đích; fwd0 → frame đích.
HandleDelta = 0 ở mọi probe (vạch/store KHÔNG lệch); hold = 0 mọi
probe (không rơi nhánh hold-frame J4); 0 exception.

### 3.2 Phiên v2 — 4 probe chạy lại phần nhiễm detour, KHÔNG detour (display :93, port 4193, bundle C0HfodWe — xem §0)

| Probe | Frame hiển thị / trạng thái | seek? (thời gian seek) | Ghi chú |
|---|---|---|---|
| FG-OUT back1f | **84 = frame trước**, vẽ ngay (dk+1 0,000; dk0 2,527) | KHÔNG (ct kẹt 3,533333; 0 set, 0 event) | SẠCH — hash poll: 908396 (xóa nền thoáng qua ngay sau click) → 3647616 (frame 84 xám) từ poll 1, ổn định; draw +1 |
| FG-OUT fwd1f | **DARK-FIRST, đen vĩnh viễn** (appMean [10,12,16] = nền khung; sweep mọi dk ≈ 133) | CÓ (set 3,5; seeking → seeked **1884 ms**) | Sau idle 2s + repoll + đo lại vẫn nền (hash 908396 mọi poll); skip +1, draw +0 |
| FG-OUT fwd0 | **DARK-FIRST, đen vĩnh viễn** (như trên) | CÓ (set 3,5; seek **1486 ms**) | Như trên |
| FB-OUT fwd1f | **DARK-FIRST, đen vĩnh viễn** (appMean [10,12,16]; sweep mọi dk ≈ 59,9) | CÓ (set 3,1; seek **1398 ms**) | Như trên (đường fadeblack 1 bước cũng đen — không riêng dip) |

V2 khóa thêm 2 điểm: (i) FG back1f tái lập sạch lần thứ 2 trong
phiên mới (không detour, vẽ frame trước ngay); (ii) 3 probe fwd
có seek đều rơi vào đen vĩnh viễn — và đó là cơ chế thứ hai (§5),
không phải nhiễu đo: element đã ở đúng target (ct = 3,5 / 3,1,
readyState = 4 ở snapshot sau idle) nhưng canvas vẫn là nền khung.

## 4. Cơ chế A (đã khóa): epsilon 1 frame + currentTime lượng tử hóa xuống → bỏ seek bước 1 frame

Code (đọc, không sửa): `apps/web/src/lib/seek.ts` —
`seekEpsilonFor(fps) = 1 / floor(fps)` (30fps → 0,033333…s);
`needsSeek = |currentTime − target| > epsilon`, và `seekElement`
ghi rõ "Đã đúng vị trí (±1 frame) -> không cần seek, tránh nhấp
nháy" — nếu không cần seek thì resolve `seeked = true` ngay và
vòng lặp vẽ luôn frame hiện tại của element. Đường scrub-pause đi
qua `Seeker.request` → `seekAll` → `seekElement` (preview.tsx
§2280), nên quyết định bỏ seek này quyết định frame hiển thị.

Mảnh còn thiếu mà probe này đo được: **Chrome báo `currentTime`
đã lượng tử hóa xuống micro giây, luôn ≤ giá trị đã set** (mọi giá
trị báo cáo đều có đúng 6 chữ số thập phân):

| Giá trị app set | Chrome báo lại (quan sát) |
|---|---|
| 62/30 = 2,066666… | 2,066666 |
| 61/30 = 2,033333… | 2,033332 (quirk: thấp hơn cả floor µs 1µs — quy tắc sub-µs chưa khóa, xem §8; chiều xuống mới là điều cơ chế cần) |
| 106/30 = 3,533333… | 3,533333 |
| 16/30 = 0,533333… | 0,533333 |
| 94/30 = 3,133333… | 3,133333 |
| 14/30 = 0,466666… | suy ra ≤ 0,466666 (xem dưới) |
| 104/30 = 3,466666… | 3,466666 (log v2 in đủ precision) |
| 92/30 = 3,066666… | 3,066666 (log v2 in đủ precision) |

Hệ quả số học (epsilon = 1/30):

- **Bước lùi 1 frame:** khoảng cách báo cáo = 1 frame − δ
  (δ ≈ 0,3–1,4µs do lượng tử hóa xuống) < epsilon → **không seek**,
  mọi trường hợp. Giải thích cả 5 quan sát back1f sạch/nhiễm
  (SAN ×2, FW, FB, FG-v2).
- **Bước tiến 1 frame:** khoảng cách báo cáo = 1 frame + δ >
  epsilon → **có seek**, trừ đúng một ngoại lệ: `currentTime`
  xuất phát biểu diễn chính xác được (số nguyên giây như 2,0 —
  không mất gì khi lượng tử hóa) thì phép trừ float cho khoảng
  cách ≤ epsilon (SAN fwd1f: diff − epsilon = −1,18e−16) → **không
  seek**. Đây là lý do SAN fwd1f khác FW fwd1f dù cùng là "tiến 1
  frame" — không phải do clip, mà do giá trị xuất phát.
- **Bước xa:** khoảng cách ≫ epsilon → luôn seek → đúng frame.

Bảng kiểm mô hình với số đo thật (ct_q = currentTime báo cáo tại
thời điểm quyết định; `seek?` là quan sát, không phải dự đoán):

| Probe (sạch) | ct_q → target | diff − epsilon | Mô hình dự đoán | Quan sát |
|---|---|---|---|---|
| SAN back1f | 2,066666 → 61/30 | −6,7e−7 | không seek | không seek, frame 49 ✓ |
| SAN fwd1f | 2,0 → 61/30 | −1,2e−16 | không seek | không seek, frame 47 ✓ |
| SAN fwd0 | 0 → 61/30 | ≫ 0 | seek | seek, frame 48 ✓ |
| FW back1f | 0,533333 → 0,5 | −3,3e−7 | không seek | không seek, frame 12 ✓ |
| FW fwd1f | 0,466666 → 0,5 | +6,7e−7 | seek | seek, frame 11 ✓ |
| FB back1f | 3,133333 → 3,1 | −3,3e−7 | không seek | không seek, frame 75 ✓ |
| FG back1f (v2) | 3,533333 → 3,5 | −3,3e−7 | không seek | không seek, frame 84 ✓ |
| FG fwd1f / FB fwd1f (v1, nhiễm detour) | 3,466666 → 3,5 / 3,066666 → 3,1 | +6,7e−7 | seek | seek (thời điểm set mơ hồ do detour, nhưng hướng seek khớp mô hình) |
| FG fwd1f/fwd0, FB fwd1f (v2) | như trên | +6,7e−7 | seek | seek — nhưng rơi vào cơ chế B (§5), không vẽ được |

**Kết luận §4 (khóa):** bất đối xứng P2-vs-P6 của L1 **không còn
tồn tại** — P2 và P6 là cùng một cơ chế (lùi 1 frame → bỏ seek),
không phải đặc tính của clip FG hay đường dip. Việc P2 không tái
lập trong probe run 2 của L1 (cho frame đúng 83) được giải thích
nhất quán bằng **cuộc đua thời điểm**: nếu seek của prescrub vẫn
đang bay tại thời điểm quyết định seek cho target thì
`currentTime` lúc đó còn xa target → seek được phát → frame đúng;
nếu prescrub đã seek xong (trường hợp v2 FG back1f: 0 event trong
cửa sổ probe) thì khoảng cách chỉ còn đúng 1 frame → bỏ seek →
frame cũ. Bằng chứng đua: v1 FG back1f có đúng 1 event seeked của
prescrub rơi vào trong cửa sổ poll (seek prescrub hoàn tất muộn),
trong khi v2 FG back1f có 0 event (prescrub đã xong trước click).
Phần đua này là giải thích nhất quán với dữ liệu, không phải
phép đo trực tiếp thứ tự micro-giây giữa "seeked của prescrub" và
"quyết định seek của target" (harness không ghi timestamp chung
cho hai sự kiện đó) — xem §8.

**Giả thuyết L1 §5.4 bị bác (đối với case frame cũ):** "tick vẽ
frame hiện tại trước khi seek lùi nhỏ hoàn tất, settle bằng hash
không phát hiện seek đang bay" — **SAI ở phần "seek đang bay"**:
trong mọi probe frame-cũ sạch, `seeking` giữ False suốt cửa sổ
poll, 0 lần gán `currentTime`, 0 event seeking/seeked — **không
hề có seek nào đang bay**; app không phát seek ngay từ đầu. Hash
settle không phải thủ phạm (canvas vẽ frame cũ vì đó là frame
element đang giữ, không phải vì capture quá sớm — v2 chờ idle 2s
vẫn frame cũ, hash không đổi).

## 5. Cơ chế B (đã khóa, độc lập): seek quá timeout 1200 ms → skip + ngủ → nền đen vĩnh viễn

Chuỗi code (đọc, không sửa):

1. `seekElement`: timeout `DEFAULT_SEEK_TIMEOUT_MS = 1200 ms`
   (`seek.ts`). Seek chậm hơn thì resolve `{seeked: false,
   timedOut: true}`.
2. `Seeker.request` resolve `{ok: true, cancelled: false, ...r}`
   **ngay cả khi timeout** (`seek.ts`, `ok` hardcode true) — nên
   nhánh `.then` ở preview.tsx §2300 vẫn vẽ: `if (!cancelled &&
   ok && lastRequested === t) renderFrame(...)`.
3. Tick vẽ đó chạy trong lúc element vẫn đang seek (seeked đến
   muộn hơn) → `decideVideoFrame` (`holdFrame.ts`) trả **skip**:
   ở chế độ pause (`paused = true`, `stepping = false`), skip xảy
   ra khi `readyState < 2` hoặc `videoWidth = 0`; `videoWidth = 0`
   bị loại vì element đã có metadata và readyState = 4 ở các poll
   kề trước/sau — suy ra `readyState < 2` tại tick vẽ đó (suy luận
   từ quyết định skip, không phải mẫu trực tiếp tại tick đó —
   xem §8). `renderFrame` đã xóa nền trước khi vẽ nên canvas còn
   lại đúng màu nền khung `#0a0c10`.
4. Sau tick đó, `lastDrawn = t`, `pendingSeek = false` →
   `scheduleNext` cho vòng lặp **ngủ** (playhead = lastDrawn =
   lastRequested). Khi `seeked` đến muộn, không có listener nào
   kích hoạt vẽ lại (theo code, vẽ lại chỉ xảy ra khi playhead /
   spec / selection đổi, hoặc flag redraw) → **nền đen ở yên cho
   tới lần scrub tiếp theo**.

Số đo khóa chuỗi này (thời gian seek = seeked − seeking theo
timestamp page của hook; timeout = 1200 ms):

| Probe | Thời gian seek | > 1200 ms? | holdStats (trước → sau) | Kết quả canvas |
|---|---|---|---|---|
| FG fwd1f (v2) | 1884 ms | CÓ | skip 3 → 4, draw 2 → 2 | Nền [10,12,16] mọi poll + repoll + đo lại |
| FG fwd0 (v2) | 1486 ms | CÓ | skip 4 → 5, draw 3 → 3 | Như trên |
| FB fwd1f (v2) | 1398 ms | CÓ | skip 6 → 7, draw 3 → 3 | Như trên (đường fadeblack cũng đen) |
| SAN fwd0 (v1) | 787 ms | KHÔNG | draw +1, skip +0 | Frame đích 48 |
| FW fwd1f (v1) | 355 ms | KHÔNG | draw +1, skip +0 | Frame đích 11 |

Tách biệt rõ ràng 3/3 so với 2/2, không có trường hợp lưng chừng.
Seek chậm ở đây là giải mã từ keyframe thưa của footage K trên VM
CPU (keyframe đầu 0,0 rồi 4,588, 8,884… — seek tới 3,5s phải giải
mã ~84 frame), không phải lỗi decode: seek nào cũng hoàn tất
(có event `seeked` đầy đủ, element về đúng target với
readyState = 4), chỉ là **hoàn tất sau khi vòng lặp đã vẽ và ngủ**.

Lưu ý phân biệt: hash ổn định từ poll #0 ở các probe đen là
**ổn định rỗng** (nền khung 908396 — nền thì lúc nào cũng "ổn
định"), không phải bằng chứng seek xong. Ngược lại, hash ổn định
ở probe frame-cũ là hash của frame thật (v2 FG back1f: 3647616).
Settle bằng hash không phân biệt được hai trường hợp này — đúng
như cảnh báo L1 §7 quy tắc 3, nhưng nguyên nhân gốc ở đây là
skip + ngủ của app, không phải settle của harness: v2 chờ idle 2s
+ repoll + đo lại vẫn đen, nên "settle dài hơn" không cứu được.

## 6. Hệ quả cho người dùng và phạm vi ảnh hưởng (chỉ nói điều đã đo)

- Scrub-pause từng frame (phím mũi tên / click ruler từng frame):
  lùi 1 frame → thấy frame cũ (cơ chế A); tiến 1 frame từ vị trí
  giây nguyên → cũng thấy frame cũ (cơ chế A, trường hợp SAN
  fwd1f). Đây là đường scrub-pause, **không phải** bằng chứng về
  phát lại bình thường: phát xuôi dùng nhánh khác (`syncMedia`
  playing, ngưỡng re-seek 0,35s) và phát ngược dùng stepping với
  `stepEps = 0,5 frame` — hai nhánh đó **không được đo trong luồng
  này**, không kết luận gì về chúng.
- Scrub tới frame mà decode chậm hơn 1,2s trên máy đo (VM CPU,
  footage GOP thưa) → preview đen và **giữ đen** cho tới khi scrub
  tiếp (cơ chế B). Trên máy nhanh hơn / footage GOP dày hơn, seek
  có thể dưới 1200 ms và không gặp; ngưỡng 1200 ms là hằng số code,
  không phải hằng số vật lý — máy user khác sẽ có tỉ lệ gặp khác
  (chưa đo máy thật).
- Cả hai cơ chế đều nằm ở đường scrub-pause, đều tái lập xác định
  (A: 9/9 dự đoán; B: 3/3 timeout → đen, 2/2 nhanh → vẽ), đều không
  liên quan dip/màu/resample (frame thật nào xuất hiện cũng khớp
  control từng bit ở sweep tương ứng).

## 7. Quyết định không sửa code sản phẩm trong luồng này + đề xuất sửa (để parent quyết)

Căn cứ cho sửa app **đã đủ** (cơ chế A và B đều có phép đo tách
bạch hai cửa: trạng thái element thật + pixel sweep + holdStats),
nhưng nhiệm vụ luồng này là đo + truy nguyên, và các luồng khác
đang sửa file chung — nên luồng này **dừng ở báo cáo**, không
đụng `src/`. Đề xuất sửa (chưa triển khai, chưa kiểm chứng):

- **Cơ chế A:** `needsSeek` không nên so giây với epsilon đúng 1
  frame. Lựa chọn sạch nhất: so **chỉ số frame đã snap** (hoặc
  micro giây nguyên) của `currentTime` và target — khác frame thì
  seek, cùng frame thì thôi. Lựa chọn rẻ hơn nhưng vẫn còn rủi ro
  float: epsilon nhỏ hơn 1 frame (vd 0,5 frame) — vẫn phải đối mặt
  lượng tử hóa µs, nên so chỉ số frame vẫn hơn. Cẩn thận: đổi
  `needsSeek` ảnh hưởng mọi đường scrub-pause; cần hồi quy K3 +
  probe này sau sửa.
- **Cơ chế B:** khi seek timeout, **đừng đánh dấu đã vẽ**
  (`lastDrawn`) và đừng để vòng lặp ngủ với canvas đã xóa: giữ
  `pendingSeek` / reset `lastRequested` để tick sau thử lại, và/hoặc
  đăng ký vẽ lại khi `seeked` đến muộn; và/hoặc tăng timeout theo
  độ khó decode (GOP thưa). Đổi hành vi skip-khi-pause của J4
  (vẽ frame cũ thay vì đen) là quyết định sản phẩm riêng — J4 cố
  tình chọn skip ở pause để khỏi mạo nhận frame sai vị trí; sửa B
  nên giữ nguyên triết lý đó (vẽ lại khi seeked đến mới là đúng
  frame, không phải vẽ frame cũ).
- **Harness (đã sửa trong luồng này, xem §8):** tóm tắt probe dùng
  active element; lần đo đầu tối không scrub detour nữa.

## 8. Kiểm chứng, file đổi/thêm, và cái gì còn mở

Kiểm chứng đã chạy:

- `node --check` harness K3 sau vá (L1 đã làm; luồng này chạy lại
  bằng browser — xem §1) và probe v1/v2 (syntax OK trước cả 2
  phiên; v2 chạy thật nên các sửa v2 đã được kiểm chứng bằng
  browser, không chỉ syntax).
- K3 rerun: Chromium headed thật, 18/18, 0 exception, exit 0.
- Probe v1: 11 probe có verdict, 0 ERROR, 0 exception.
  Probe v2: 4 probe có verdict, 0 ERROR, 0 exception.
- JSON kết quả đã đọc lại bằng Python (bundle, canvas, sweep,
  holdStats, sets/events, means đều khớp log trong lúc chạy);
  sweep dk đúng của mọi case frame-cũ đều là 0,000 từng bit
  (maxDiff = 0), không chỉ MAD trung bình.

File đổi/thêm (text, không binary — parent gộp batch; luồng này
KHÔNG tự ghi paths-loop, KHÔNG ghi build-loop-log theo tiền lệ):

- Mới: `apps/web/scripts/clicktest-dip-seek-round30-m1.mjs` —
  harness probe (v1 + sửa v2: `activePoolElement`, `pollOnly`,
  `DARK-FIRST` không detour, lọc `R30M1_ONLY`; display/port qua
  env, mặc định :94/4194).
- Mới: `benchmarks/results/v30-m1-seek-probe.json` — v1 (11 probe
  + proxy diag + log đầy đủ).
- Mới: `benchmarks/results/v30-m1-seek-probe-v2.json` — v2
  (4 probe chạy lại phần nhiễm detour + log đầy đủ).
- Mới: `docs/PHASE9_ROUND30_M1_K3_RERUN_LIMITS.md` — file này.
- Ghi đè bởi chính harness khi chạy lại (không sửa tay):
  `benchmarks/results/v27-k3-canvas-dip-browser.json` — nay là dữ
  liệu rerun đợt 30 (18/18, exit 0), thay cho dữ liệu K3 gốc.
- KHÔNG sửa: `apps/web/scripts/clicktest-dip-browser-pipe.mjs`
  (chỉ chạy, không đụng bản vá L1), không file `src/` nào, không
  file của luồng khác (ExportPanel, store, i18n, previewStatus
  không đụng tới).

Còn mở (trung thực — không claim điều chưa đo):

1. Quy tắc sub-µs chính xác của Chrome khi báo `currentTime`
   (61/30 → 2,033332, thấp hơn floor µs 1µs): chiều xuống đã đủ
   cho cơ chế A, nhưng con số 1µs này chưa giải thích được — cần
   probe đọc `currentTime` ngay sau set trên nhiều giá trị nếu muốn
   khóa tuyệt đối.
2. `readyState` tại đúng tick vẽ sau timeout (cơ chế B): suy ra
   `< 2` từ quyết định skip + `videoWidth > 0` + pause + không
   stepping; chưa có mẫu trực tiếp tại tick đó (muốn khóa thì
   probe phải poll `readyState` với tần suất cao quanh mốc 1200 ms).
3. Tỉ lệ gặp cơ chế B trên máy thật / footage GOP dày / Safari /
   GPU decode: số 1,4–1,9s là của VM CPU với footage K GOP thưa;
   máy khác sẽ khác, ngưỡng 1200 ms thì không đổi.
4. Nhánh phát xuôi (ngưỡng 0,35s) và phát ngược stepping
   (`stepEps` 0,5 frame) có bị ảnh hưởng bởi cùng epsilon /
   timeout hay không: chưa đo, không suy ra từ số scrub-pause.
5. Đề xuất sửa ở §7 chưa triển khai, chưa kiểm chứng — vòng sau
   sửa xong phải chạy lại đúng probe này (v1+v2) + hồi quy K3
   18/18 trước khi claim đã sửa.

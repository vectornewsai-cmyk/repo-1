# Phase 9 đợt 32, luồng O3 — Seek follow-up đợt 31 N1: nhánh phát xuôi/ngược, hội tụ dưới tải, retry dài hạn — LIMITS

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG sửa
> i18n, KHÔNG sửa phần dip/failsoft của preview. Chỉ sửa `seek.ts`
> (gỡ listener mồ côi, §4) và test của nó; `preview.tsx` KHÔNG cần
> sửa thêm. KHÔNG stage batch — parent stage gộp.

## 0. Kết quả nói trước

- **Nhánh phát xuôi (ngưỡng re-seek 0,35s): KHỎE.** Phát xuôi 6s
  trên browser thật: 0 lần gán `currentTime` trong lúc phát (lượt
  không tải), drift không bao giờ vượt 0,35s để phải re-seek, bước
  nhảy `currentTime` lớn nhất 0,163–0,169s giữa 2 sample cách nhau
  ~100ms (mượt, không nhảy lùi), 0 frame nền đen sau khi nội dung
  đã bắt đầu.
- **Phát ngược stepping: KHỎE, bước nhảy lớn hơn 1 frame là bình
  thường.** 24–47 lần gán trong ~5s, bước lùi chủ yếu 0,03–0,17s
  (1–5 frame), thỉnh thoảng 0,4–0,87s ở biên clip (chuyển element,
  không phải kẹt); playhead lùi đơn điệu 8,0s → 1,3–2,1s; sau sample
  nội dung đầu tiên, 0 frame nền đen.
- **Hội tụ scrub dưới tải — ĐÃ CHỨNG MINH VỚI CỬA SỔ ĐỦ DÀI (nợ
  đợt 31 §3.3 đã đóng).** Kéo handle tới playhead 2,9s, poll 200ms
  tới 25s (vượt xa seek 4,6s + idle của đợt 31): không tải hội tụ
  trong (223, 446]ms; dưới tải 4 nhân bão hòa, 2 lần lặp hội tụ
  trong (4402, 4614]ms và (5303, 5526]ms. Trong suốt lúc seek dưới
  tải, canvas GIỮ frame nội dung trung gian (không đen), rồi chuyển
  sang frame đích và ngủ (`sleeping=true`, `lastDrawn =
  lastRequested = 2,9`, element hết `seeking`).
- **Seek không bao giờ xong (retry vô hạn): KHÔNG gây hại CPU, chỉ
  có 1 tác vụ nền xấu đã vá.** Đo Node 120s với mock không bao giờ
  bắn `seeked`: 93–94 attempt, nhịp trung bình ~1,29s
  (1200ms timeout + 80ms debounce + overhead), CPU 51–75ms/120s,
  chỉ gán `currentTime` 1 lần (không restart seek đang bay), 0 lần
  vẽ trong lúc chưa seek xong. Tác vụ xấu duy nhất: TRƯỚC vá, mỗi
  attempt để lại 1 listener `seeked` mồ côi (93 listener sau 120s,
  tăng không giới hạn); SAU vá: 0 listener tồn đọng (94 attempt).
  KHÔNG đặt giới hạn/backoff cho retry — xem lý do §4.
- **Hồi quy:** seek.test 15/15 (13 cũ + 2 mới khóa việc gỡ
  listener), `tsc --noEmit` (web) 0 lỗi, `vite build` pass,
  reversePlayback 10/10, playheadPacing 10/10, holdFrame 13/13.
  K3 dip 18/18 KHÔNG chạy lại trong luồng này (xem §7) — bằng chứng
  browser tương đương là probe O3 trên bundle mới (§1–§3).

## 1. Nhánh phát xuôi 0,35s (sau sửa N1)

Đo trên browser thật (Chromium Playwright headless, viewport
1440×900, bundle `index-B8uKpTK2.js`, sha256[:16]
`6d0a6c00e188d3e4`, project mẫu `mau-1.webm` + `mau-2.webm`):
bấm Phát (bằng `el.click()` trong trang), sample trạng thái
element + hash/mean canvas mỗi ~100ms × 60.

| Lượt | Gán `currentTime` trong lúc phát | Sample `seeking=true` | Nhảy ct lớn nhất | Frame nền đen sau nội dung |
|---|---|---|---|---|
| Không tải | 0 | 1/60 (thoáng qua) | 0,163s, không nhảy lùi | 0 |
| Sau lượt tải 1 (tải đã tắt lúc phát) | 1 (giá trị 3,967, gần cuối clip 1, 1 lần duy nhất) | 2/60 | 0,162s | 0 |
| Sau lượt tải 2 (tải đã tắt lúc phát) | 1 (giá trị 3,967, như trên) | 2/60 | 0,169s | 0 |

Đọc: trong lúc phát xuôi, `syncMedia` gần như không bao giờ phải
re-seek — drift giữa element và playhead không vượt ngưỡng 0,35s
trong điều kiện đo. Lần gán 3,967 duy nhất ở 2 lượt sau-tải không
phải chuỗi re-seek (chỉ 1 lần, không lặp lại). **Giới hạn đo:** pha
phát xuôi chạy SAU khi đã tắt tải (tải chỉ bật trong pha scrub),
nên "phát xuôi dưới tải" vẫn là nợ — xem §7. Triệu chứng
"đen/canvas giữa seek" KHÔNG xuất hiện ở nhánh này.

## 2. Phát ngược stepping (sau sửa N1)

Bấm Phát ngược, sample như trên × 50. Lưu ý trung thực: pha ngược
bắt đầu ở playhead ~8,0s chứ không phải 0 như ý định (click "Về
đầu" trước pha ngược không có tác dụng trong các lượt này, nguyên
nhân chưa truy nguyên — có thể nút ngược tự bắt đầu từ cuối khi
playhead ở 0, nhưng luồng này KHÔNG kết luận cơ chế). Vì vậy số
dưới đây mô tả stepping từ 8s lùi xuống, vẫn bao phủ cả 2 clip.

| Lượt | Gán trong ~5s | Bước lùi điển hình | Bước lớn nhất (trừ biên clip) | Sample `seeking=true` | Frame nền đen sau nội dung |
|---|---|---|---|---|---|
| Không tải | 24 | 0,03–0,17s | 0,70s | 40/50 | 0 (sample 0 ở 8s là khoảng trống ngoài clip — nền đúng, không phải bug) |
| Sau tải 1 | 29 | 0,03–0,17s | 0,70s | 38/50 | 0 (như trên) |
| Sau tải 2 | 47 | 0,03–0,17s (nhiều bước 0,033s = đúng 1 frame) | 0,67s | 38/50 | 0 (như trên) |

Đọc: stepping không kẹt, playhead lùi đơn điệu (8,0 → 1,35s /
1,43s / 2,07s tùy lượt, chênh lệch do thời điểm dừng sample và
biên clip). Bước lùi > 1 frame là bình thường: playhead lùi theo
tick rAF trong khi seek giải mã chậm (~200ms), nên mỗi lần element
bắt kịp thì playhead đã lùi thêm vài frame — đúng thiết kế
`stepEps` 0,5 frame (ngưỡng phát seek mới, không phải kích thước
bước). `seeking=true` ở đa số sample là trạng thái làm việc bình
thường của stepping, không phải treo (playhead vẫn lùi đều).
**Giới hạn:** pha ngược cũng chạy sau khi tắt tải, như §1.

## 3. Hội tụ scrub dưới tải, cửa sổ đo đủ dài (đóng nợ đợt 31 §3.3)

### 3.1 Phát hiện phương pháp: click ruler KHÔNG seek trong app này

Probe thử 3 cách seek từ playhead 0 (mỗi cách đo playhead trước/
sau + số set):

| Cách | Kết quả |
|---|---|
| M1: CDP click lên `.tl-ruler` | playhead 0 → 0, 0 set — KHÔNG seek |
| M2: `MouseEvent` trong trang lên `.tl-ruler` | playhead 0 → 0, 0 set — KHÔNG seek |
| M3: CDP kéo handle tới vị trí ứng 3s | playhead 0 → 2,9s, 1 set — SEEK THẬT |

Hệ quả: lượt đo đầu của luồng này (file `...-noload2.json`) báo
"hội tụ 7ms" là GIẢ — playhead vốn đã ở 0 nên hook idle đã ngủ sẵn.
File đó và file `...-noload.json` (viewport 800×600 làm canvas xẹp
212×1, không đo pixel được) KHÔNG phải bằng chứng, parent đừng
stage chúng. Mọi số scrub dưới đây dùng M3 (kéo handle), viewport
1440×900, canvas 872×476.

### 3.2 Kết quả (kéo handle tới playhead 2,9s, poll ~200ms tới 25s)

Tiêu chí hội tụ: 3 poll liên tiếp mà hook idle của chính preview
báo `sleeping=true`, `lastDrawn == lastRequested` (= playhead
đích) và element active hết `seeking`. Thời gian hội tụ báo dạng
khoảng (poll trước chưa hội tụ, poll sau đã hội tụ) vì poll cách
nhau ~210–280ms dưới tải.

| Lượt | Hội tụ sau khi thả handle | Diễn biến canvas trong lúc seek |
|---|---|---|
| Không tải | (223, 446]ms (poll 5, hash ổn định 3013825) | Poll đầu đã là frame nội dung trung gian (hash 2786399, mean [61,38,97]) — KHÔNG đen; poll 2 element `seeking=true, rs=1, ct=2,9`; poll 3 frame đích (mean [38,59,103]) + ngủ |
| Tải 4×`yes` lần 1 | (4402, 4614]ms (22 poll) | Canvas giữ frame trung gian (hash 2786168) suốt 4,4s; `ct` báo cáo leo dần 1,43 → 1,73 → 2,03 → 2,30 → 2,60 → 2,9 trong lúc `seeking=true, rs=1` (Chrome giải mã dần về đích, không phải app re-seek); cuối: frame đích (mean [38,60,103]) + ngủ |
| Tải 4×`yes` lần 2 | (5303, 5526]ms (26 poll) | Như lần 1 (hash trung gian 2786941, frame đích mean [38,60,103]) + ngủ |

Sau mỗi lượt, chờ tắt tải + idle 2s: hash không đổi, idle vẫn
ngủ, `lastDrawn = lastRequested = 2,9`. **Kết luận:** triệu chứng
"đen vĩnh viễn" của N1 đã hết cả khi không tải lẫn dưới tải bão
hòa; hội tụ xảy ra trong mọi cửa sổ đo 25s (đợt 31 chỉ đo tới ~6s
nên chưa thấy). Thời gian hội tụ dưới tải nặng nhân tạo là
~4,6–5,5s, gấp ~10× lúc không tải — đó là giá của decode dưới
CPU đói, không phải kẹt.

### 3.3 Lưu ý trung thực về hash

Hash canvas cuối khác nhau nhẹ giữa các lượt (3013825 /
3017488 / 3027996, mean chỉ lệch ≤ 1 ở kênh G) dù cùng playhead
2,9s và cùng frame đích theo hook. Trong một lượt thì hash ổn
định tuyệt đối sau hội tụ. Luồng này KHÔNG claim "khớp từng bit
xuyên lượt" cho frame webm này — khác biệt nhỏ có thể do giải mã
webm hoặc frame trung gian của đường kéo; điều đã chứng minh là
hội tụ trạng thái (idle ngủ + đúng playhead + hết seeking) và
frame đích cùng nội dung (mean ≈ nhau), không phải đen.

## 4. Seek không bao giờ xong — retry dài hạn (đo Node 120s)

Mô phỏng đúng vòng preview sau N1 bằng mock: element không bao
giờ bắn `seeked`, `seeking` giữ true sau lần gán đầu; vòng lặp
`Seeker` (debounce 80ms) → `seekElement` (timeout 1200ms) →
timeout thì reset + request lại (không vẽ, không đánh dấu đã vẽ).

| Chỉ số | Trước vá (§4.1) | Sau vá (§4.1) |
|---|---|---|
| Attempt / 120s | 93 | 94 |
| Nhịp trung bình (min–max) | 1292,6ms (1280–1337) | 1286,4ms (1279–1337) |
| Lần gán `currentTime` | 1 (không gán lại khi đang seeking) | 1 |
| Lần vẽ trong lúc chưa seek xong | 0 | 0 |
| Listener `seeked` tồn đọng cuối lượt | 93 (1/attempt, tăng không giới hạn) | 0 |
| CPU process (user + system) | 42 + 9ms / 120s | 61 + 14ms / 121s |

### 4.1 Vá duy nhất trong luồng: gỡ listener khi `seekElement` finish

`apps/web/src/lib/seek.ts`: `Seekable` thêm phương thức tùy chọn
`removeEventListener?`; `seekElement` giữ tham chiếu listener của
attempt và gỡ nó trong `finish()` (mọi đường: timeout, failed,
xong). An toàn vì: (a) attempt đã settle nên `seeked` muộn (nếu
có) thuộc về attempt retry mới với listener riêng — test khóa
trường hợp này; (b) khi finish được gọi từ chính handler `seeked`
thì listener `once` đã tự gỡ nên gỡ lại là no-op; (c) mock và
element thật đều có `removeEventListener` (mock cũ không có thì
được gọi qua `?.` nên không vỡ).

KHÔNG đặt giới hạn số lần retry, KHÔNG backoff — có căn cứ đo:
retry rẻ (CPU < 0,1% trong 120s, không gán lại, không vẽ sai) và
mọi giới hạn đều có nguy cơ phá đúng hành vi hội tụ dưới tải mà
N1 vừa sửa (seek 4,6–5,5s dưới tải cần nhiều vòng timeout mới
tới). Nếu một ngày đo được retry gây hại thật trên browser (chứ
không phải mock), lúc đó mới bàn giới hạn — hiện tại chưa có bằng
chứng đó. Nhánh `failed` (không timeout, vd metadata lỗi) vẫn giữ
hành vi vẽ cũ như N1 đã ghi — ngoài phạm vi luồng này.

## 5. File đổi/thêm (tương đối từ repo root — parent stage gộp)

- Sửa: `apps/web/src/lib/seek.ts` — thêm `removeEventListener?`
  vào `Seekable`; `seekElement` lưu + gỡ listener trong `finish()`
  (xem §4.1). Không đổi logic needsSeek, timeout, debounce.
- Sửa: `apps/web/src/lib/seek.test.ts` — mock thêm
  `removeEventListener`; +2 test (timeout → 0 listener tồn đọng;
  retry sau timeout vẫn có listener riêng và xong khi `seeked`
  muộn tới). 13 test cũ không đổi nội dung.
- Mới: `apps/web/scripts/seek-o3-retry-probe.ts` — probe Node
  120s cho §4 (chạy từ gốc repo bằng strip-types).
- Mới: `apps/web/scripts/seek-o3-browser-probe.mjs` — probe
  browser tự viết cho luồng này (CDP qua WebSocket, Chromium
  Playwright headless, viewport 1440×900; KHÔNG dùng lại harness
  các đợt trước).
- Mới: `docs/PHASE9_ROUND32_O3_SEEK_FOLLOWUP_LIMITS.md` — file này.
- Mới (bằng chứng): `benchmarks/results/v32-o3-retry-longrun.json`
  (số SAU vá; số trước vá 93 listener ghi ở §4), `benchmarks/
  results/v32-o3-browser-measure-noload3.json` (không tải),
  `v32-o3-browser-measure-load1.json`, `v32-o3-browser-measure-
  load2.json` (2 lần tải). Các file `v32-o3-browser-discover.json`,
  `...-measure-noload.json`, `...-measure-noload2.json` là sản phẩm
  phụ / lượt hỏng phương pháp (§3.1) — KHÔNG dùng làm bằng chứng.
- KHÔNG sửa: `preview.tsx`, i18n, CLI, harness CDP của đợt khác,
  file của luồng khác. `dist/` đã build lại 2 lần trong lượt
  (bundle cuối `index-B8uKpTK2.js`) — KHÔNG đưa vào batch như mọi
  khi. Không còn tiến trình `yes` nào sót sau các lượt tải.

## 6. Kiểm chứng đã chạy (số thật)

- `node --experimental-strip-types apps/web/src/lib/seek.test.ts`
  → **15/15** (13 cũ + 2 mới).
- `tsc --noEmit` (apps/web) → **0 lỗi** (chạy sau khi sửa seek.ts).
- `vite build` → pass, bundle `index-B8uKpTK2.js`,
  sha256[:16] = `6d0a6c00e188d3e4` (mọi số browser §1–§3 đều trên
  bundle này).
- Hồi quy lib liên quan: reversePlayback **10/10**,
  playheadPacingRound29L2 **10/10**, holdFrame **13/13**.
- Probe retry Node 120s: trước vá và sau vá (bảng §4).
- Probe browser: khám phá DOM + 3 lượt MEASURE đầy đủ (không tải,
  tải ×2) trên cùng bundle; mỗi lượt gồm thử 3 cách seek, scrub
  M3, phát xuôi 60 sample, phát ngược 50 sample.

## 7. Nợ còn lại (không claim)

1. **Tỉ lệ gặp bug trên máy thật / GOP dày / Safari: CHƯA ĐO.**
   Mọi số browser ở đây đều trên VM 4 vCPU, Chromium headless
   (bản Playwright), clip mẫu webm `mau-1/mau-2` (GOP không rõ,
   không phải footage K mp4 GOP thưa của đợt 30/31, càng không
   phải GOP dày). Safari không có trên VM này. Tải nặng là `yes`
   nhân tạo bão hòa 4 nhân, không phải tải thực tế của máy user.
2. **Phát xuôi/ngược DƯỚI tải chưa đo:** tải chỉ bật trong pha
   scrub rồi tắt trước pha phát (§1–§2 ghi rõ). Muốn đủ thì lượt
   sau bật tải xuyên suốt cả 3 pha.
3. **K3 dip 18/18 chưa chạy lại:** luồng này không dùng lại
   harness M1; bằng chứng browser tương đương là probe O3 (§1–§3),
   không phải verdict K3. Nếu parent cần đúng K3 thì chạy lại
   harness K3 trên bundle B8u.
4. **Playhead ngược bắt đầu ở 8s (§2):** chưa truy nguyên vì sao
   click "Về đầu" trước pha ngược không có tác dụng trong khi
   trước pha xuôi thì có — có thể là hành vi của chế độ ngược,
   nhưng chưa chứng minh nên không kết luận.
5. **Nợ kế thừa từ N1 vẫn còn:** đường `failed` vẫn vẽ như cũ;
   quy tắc sub-µs chính xác của Chrome vẫn chưa giải thích được;
   tab ẩn hàng giờ / discard thật / máy thật (từ đợt 24) vẫn mở.

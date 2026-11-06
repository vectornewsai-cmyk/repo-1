# Phase 9 đợt 42, luồng X2 — Cap cho đường seek-timeout / seek-error của vòng lặp pause (nợ đợt 41 §5.3) — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp, theo mẫu W2). Chỉ sửa file thuộc khu vực
pause/preview-loop + test của riêng luồng + 1 dòng exclude trong
`tsconfig.json` (file chung, theo mẫu các đợt trước). Mọi số dưới đây
đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn

1. **Đường seek-timeout/seek-error đã xác định đúng bằng đọc code,
   không đoán.** Trong `preview.tsx`, nhánh `.then` của seek pause:
   timeout (> 1200 ms chờ `seeked`, xem `seek.ts`) hoặc lỗi thật
   (Seeker resolve `ok: false`, không phải cancelled) → nhánh else
   reset `lastRequested` về null → tick sau request seek mới → lại
   timeout/lỗi → lặp VÔ HẠN, mỗi vòng ~1,28 s (debounce 80 ms +
   timeout 1200 ms). Cap W2 không chặn được đường này vì media hỏng
   dạng này không bao giờ tới được đường render-retry.
2. **Cap mới: 10 lần seek thất bại liên tiếp cho cùng playhead.**
   Media cắt ngắn (moov nguyên, thiếu dữ liệu ở 2,5 s) chạm đúng 10
   sau 12,1 s rồi vòng lặp NGỦ với trạng thái lỗi rõ ràng
   (`seekFailureCount = 10`, `exhausted = true`, `kind = "timeout"`,
   `target = 2,5`, `lastRequested` GIỮ 2,5, ticks đứng yên ở 501
   suốt 30 s quan sát). Clip lành scrub cùng vị trí vẽ được bình
   thường, đếm 0 — cap không chặn seek thường.
3. **Bẫy thiết kế đã bắt được bằng test trước khi lên browser:**
   reset cap vô điều kiện ở nhánh request-seek mới sẽ xóa đếm mỗi
   lần retry cùng t (vì nhánh else đã mở guard) nên cap không bao
   giờ chạm. Đã sửa bằng biến nhớ `seekFailureTarget`: retry cùng t
   GIỮ đếm, chỉ t mới mới reset — test khóa riêng trường hợp này.
4. **Giới hạn phục hồi (đọc kỹ, không phải lỗi cap):** sau khi cạn
   cap ở 2,5 s, scrub sang 0,5 s (vùng dữ liệu còn nguyên) ĐÃ reset
   đếm rồi đếm lại lên 10 ở target mới — cơ chế reset đúng — nhưng
   frame không phục hồi vì element Chrome vẫn kẹt trạng thái seeking
   sau lần seek hỏng. Reset element là nợ riêng, xem §6.3.

## 1. Việc 1 — Xác định đúng đường seek-timeout / seek-error

Đọc `preview.tsx` (nhánh pause, `.then` của `seeker.request`) +
`seek.ts` (`seekElement`/`seekAll`/`Seeker`), kết quả seek đi đúng
3 nhánh:

| Kết quả seek | Nhánh trong preview.tsx | Cap nào đếm |
|---|---|---|
| `ok && timedOut === 0` (kể cả `failed > 0` khi không timeout, vd gán `currentTime` ném lỗi vì metadata lỗi) | Nhánh VẼ: `renderFrame`, skip thì thuộc đường render-retry | Cap W2 (600 skip) — KHÔNG thuộc cap này, không đếm trùng |
| `timedOut > 0` (kể cả một phần element đã xong) | Nhánh else: reset `lastRequested = null` → tick sau request lại | **Cap X2 này, kind `"timeout"`** |
| `ok === false`, không cancelled (executor seek ném lỗi) | Nhánh else: như trên | **Cap X2 này, kind `"error"`** |
| `cancelled` (request bị thay thế / `cancel()` khi bấm phát) | Nhánh else: reset `lastRequested = null` như cũ | KHÔNG đếm — không phải lỗi |

Điểm mấu chốt: `seekAll` bắt lỗi từng element nên `failed > 0`
nhưng `timedOut === 0` vẫn `ok: true` và đi nhánh vẽ; chỉ timeout
và lỗi executor mới đi nhánh else không giới hạn. Vì vậy
`classifySeekOutcome` trả null cho cả cancelled, thành công, và
failed-only — 3 trường hợp giữ hành vi cũ nguyên vẹn.

Vì sao cap = 10 lần (không phải 600 như W2): một lần seek thất bại
tốn ~1,28 s tường nên 10 lần ≈ 12,8 s — cùng bậc thời gian với cap
W2 (~10 s ở 60 Hz). Một seek chậm thật vẫn hội tụ trong vài lần
timeout: mỗi lần retry khi element đang seeking thì chỉ chờ `seeked`
chứ không gán lại (seek.ts, đợt 31 N1), nên seek hoàn tất sau ~5 s
chỉ đốt ~4 lần timeout; cap 10 gấp hơn 2 lần con số đó. Nhánh phát
(playing) không dùng Seeker nên không thuộc phạm vi cap này.

## 2. Việc 2 — Thiết kế và nối cap

### 2.1 File mới `apps/web/src/lib/pauseSeekCap42X2.ts`

- Hằng `PAUSE_SEEK_FAILURE_CAP = 10`.
- `classifySeekOutcome(outcome)` → `"timeout" | "error" | null`
  (bảng §1).
- `seekFailureAdvance(kind, previous)` → đếm +1, cạn khi >= cap;
  kind mới nhất thắng, đếm vẫn liên tiếp khi kind đổi.
- `seekFailureMaySleep(exhausted, pendingSeek, lastRequested,
  playhead)` — cùng công thức với `pauseRetryMaySleep` của W2, chỉ
  khác nguồn cạn cap.
- `seekFailureReset()` → trạng thái rỗng.

### 2.2 Nối vào `apps/web/src/preview.tsx` (marker `// ROUND42-X2`)

- Biến closure `seekFailureCount` / `seekFailureExhausted` /
  `seekFailureKind` / `seekFailureTarget`; `PreviewIdleDebug` thêm
  4 trường tương ứng để harness/UI đọc được "vì sao ngủ" (ngủ vì
  seek đã bỏ cuộc, kind nào, ở target nào) — cùng mẫu với cap W2,
  không phải trạng thái UI riêng (preview loop không có kênh toast
  riêng; trạng thái lỗi rõ ràng chính là các trường này).
- Nhánh else (không vẽ): cancelled → hành vi cũ (mở guard, không
  đếm); timeout/error → đếm; chưa cạn thì mở guard để tick sau
  retry như cũ; ĐÃ CẠN thì GIỮ `lastRequested = t` (guard
  `t !== lastRequested` chặn request mới) và `scheduleNext` cho ngủ
  bằng đường ngủ mới `seekFailureMaySleep`.
- Nhánh vẽ (seek thành công): reset chuỗi thất bại ngay tại đây
  (dù lần vẽ đó có bị skip thì skip thuộc cap W2).
- Tick vẽ lại: đã cạn cap seek thì KHÔNG render nữa (cùng guard
  với cap W2), để `scheduleNext` cho ngủ thay vì vẽ frame ở vị trí
  seek chưa xong.
- Reset cap ở: justPaused, redrawFlag (cùng chỗ reset
  lastDrawn/lastRequested của W2), và nhánh request-seek mới — NHƯNG
  với điều kiện target (xem §2.3, điểm bắt buộc).
- Không đụng nhánh playing, guard 2 s, `seekCompletedThisTick`,
  logic luồng khác; không reformat file.

### 2.3 Bẫy `seekFailureTarget` (bắt được ở lượt test đầu)

Bản nối đầu tiên reset cap vô điều kiện ở nhánh request-seek mới
(theo mẫu W2) — test mô phỏng FAIL ngay: đếm kẹt ở 1 vì mỗi lần
retry cùng t (nhánh else đã mở guard bằng `lastRequested = null`)
lại chạy qua nhánh request-seek và reset về 0. Với cap W2 thì
không sao (đếm W2 sống trong một lần seek khi `lastRequested` vẫn
giữ t nên nhánh request không chạy lại), nhưng với cap seek thì
retry CHÍNH LÀ một request mới. Cách sửa: nhớ `seekFailureTarget`
là playhead đang đếm cho; nhánh request mới chỉ reset khi
`seekFailureTarget !== null && seekFailureTarget !== t` (scrub sang
t mới), retry cùng t giữ nguyên đếm. Test khóa riêng: retry cùng t
giữ đếm 1 → 2; request t mới reset về 0. Đây là khác biệt ngữ nghĩa
quan trọng nhất của cap này so với cap W2, đừng "đơn giản hóa" nó
về reset vô điều kiện.

## 3. Việc 3 — Đối chứng Chromium headed với media hỏng

Phương pháp (theo mẫu T6/W2, nhưng sửa 2 lỗi harness gặp dọc đường,
xem §5): build từ code CÓ cap X2 ra thư mục tạm ngoài repo, serve
tĩnh, Chromium headed Linux (Playwright chromium-1248, Xvfb, cờ
`--force-device-scale-factor=1`), seed IDB `vcut-studio-assets` +
autosave (manifest + blob, clip `asset:<id>`, theo mẫu T6), rồi
scrub bằng UI thật (dispatch `pointerdown`/`pointerup` lên
`.tl-ruler`) tới vùng thiếu dữ liệu. Clip test tự tạo bằng ffmpeg
(testsrc2 640×360 3 s, `-movflags +faststart` để moov lên đầu):
`valid.mp4` 300.336 byte; `broken-trunc.mp4` = valid cắt còn
31.844 byte (moov nguyên + ~0,3 s mdat đầu); 
`broken-corrupt.mp4` = valid bị ghi đè 1000 byte ngẫu nhiên ở
offset 150.000 (~1,5 s). Scrub: `rectLeft = 152`, click `x = 302`
→ `(302 − 152) / 60 = 2,5 s` đúng. Toàn bộ đo dưới tải nền
(các luồng đợt 42 khác đang chạy) nên số thời gian là under-load,
không phải baseline quiet.

### 3.1 Lượt chính: cắt ngắn → chạm cap đúng 10 sau 12,1 s, đứng yên 30 s

| Thời điểm sau scrub | seekFailureCount | ticks | sleeping | lastRequested / lastDrawn |
|---|---|---|---|---|
| 0,0 s (seek đang bay) | 0 | 63 | false | 2,5 / 0 |
| 0,5 s | 1 | 93 | false | 2,5 / 0 |
| 2,0 s | 2 | 183 | false | 2,5 / 0 |
| 3,0 s | 3 | 244 | false | 2,5 / 0 |
| 4,5 s | 4 | 334 | false | 2,5 / 0 |
| 5,5 s | 5 | 380 | false | 2,5 / 0 |
| 7,0 s | 6 | 425 | false | 2,5 / 0 |
| 8,5 s | 7 | 448 | false | 2,5 / 0 |
| 9,5 s | 8 | 463 | false | 2,5 / 0 |
| 11,1 s | 9 | 486 | false | 2,5 / 0 |
| **12,1 s** | **10, exhausted, kind `"timeout"`** | **501** | **true** | **2,5 / 0** |
| 12,1–42,2 s (61 mẫu) | 10 (đứng yên) | 501 (đứng yên) | true | 2,5 / 0 |

Đọc: đếm tăng đều mỗi ~1,0–1,5 s (đúng nhịp debounce + timeout
1,28 s), chạm đúng 10 thì vòng lặp ngủ; suốt 30 s sau ticks và đếm
đứng yên tuyệt đối — vòng lặp đã DỪNG, không còn request seek mới.
`pauseRetrySkipped = 0`, `holdSkip = 0` suốt lượt: đây thuần túy
là đường seek, không dính dáng cap W2. `lastDrawn` giữ 0 là frame
cuối đã vẽ ở t=0 trước khi scrub — cap không tạo frame giả, chỉ
dừng việc seek vô ích. Asset seed: `a_1530837fecbb7630`
(SHA-256 của file cắt ngắn).

### 3.2 Đối chứng clip lành: scrub cùng vị trí vẽ được, đếm 0

Cùng scrub `x = 302` → 2,5 s trên `valid.mp4` (asset
`a_ee0caf7625dd51b4` — trùng đúng assetId clip T6 vì cùng bytes
testsrc2): ngủ với `lastDrawn = 2,5`, `lastRequested = 2,5`,
`seekFailureCount = 0`, `exhausted = false`, `holdDraw = 1`.
Cap không chặn seek thường, không hồi quy đường seek lành.

### 3.3 Biến thể corrupt giữa file: cũng chạm cap, nhưng thời gian chạm cap không đo được ở lượt này

`broken-corrupt.mp4` (asset `a_98a77ad5ae17e949`): kết quả cuối
cũng là `count = 10`, `kind = "timeout"`, `target = 2,5`, ngủ,
ticks đứng yên ở 498 suốt 30 s (61 mẫu) — cap chặn được cả biến thể
này. NHƯNG: mẫu poll đầu tiên đã thấy exhausted, vì tab này load
thẳng ở playhead 2,5 (tab cũ bị ẩn đã persist playhead 2,5 vào
localStorage dùng chung profile — xem §5.3) nên 10 lần timeout đã
xảy ra trong ~13 s chờ settle, trước khi poll bắt đầu. Vì vậy lượt
này chỉ chứng minh "chạm cap + đứng yên", KHÔNG được trích thời
gian chạm cap của nó; số 12,1 s chỉ lấy từ lượt cắt ngắn §3.1.
`holdDraw/holdSkip` ở tab này là null (hook hold chưa từng được
gán vì tab chưa từng vẽ được frame nào) — ghi đúng như đo, không
suy diễn.

### 3.4 Thăm dò phục hồi: scrub sang t mới reset đếm nhưng element không phục hồi

Trên tab corrupt đã cạn cap ở 2,5 s, scrub tiếp về 0,5 s
(`x = 182`, `(182 − 152) / 60 = 0,5 s`, vùng dữ liệu còn nguyên):
trạng thái sau đó là `lastRequested = 0,5`,
`seekFailureTarget = 0,5`, đếm LẠI lên 10, `exhausted = true`,
ngủ, ticks 994 → 995 rồi đứng yên. Đọc đúng: (a) cơ chế reset
hoạt động — target đổi 2,5 → 0,5 và đếm leo lại từ đầu, không kẹt
ở target cũ; (b) seek tới 0,5 s vẫn timeout cả 10 lần, tức element
Chrome vẫn kẹt trạng thái seeking sau lần seek hỏng (seekElement
khi element đang seeking thì chỉ chờ `seeked`, không gán lại — xem
seek.ts) nên seek mới không bao giờ hoàn tất. Đây là giới hạn của
element, không phải lỗi logic cap; cách phục hồi thật (tạo lại
element trong pool) thuộc khu vực khác, ghi làm nợ mở §6.3. Đừng
claim "scrub sang t khác là phục hồi được" cho media hỏng dạng này.

## 4. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (2 file):

- `apps/web/src/preview.tsx` — import `pauseSeekCap42X2` + biến
  closure cap seek + 4 trường `PreviewIdleDebug` + 9 hunk marker
  `// ROUND42-X2` (§2.2–§2.3). Không đụng vùng của luồng khác;
  không reformat file.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude
  `src/lib/pauseSeekCap42X2.test.ts` (theo mẫu mọi test file trong
  repo).

MỚI (2 file code + LIMITS này):

- `apps/web/src/lib/pauseSeekCap42X2.ts` — hằng cap + phân loại +
  hàm thuần (§2.1).
- `apps/web/src/lib/pauseSeekCap42X2.test.ts` — 22 test (§5).

KHÔNG ĐỔI: mọi code sản phẩm khác, paths-loop, build-loop-log.
Scratch ở `~/workspace/tmp-round42-x2/` (dist build tạm, clip test
`valid.mp4` / `broken-trunc.mp4` / `broken-corrupt.mp4`, harness
`harness.mjs`, `serve.mjs`, `diag*.mjs`, `recover.mjs`, JSON kết quả
`results/`) — không vào batch. Lưu ý: `/tmp/round42-x2/` ban đầu
đã bị dọn sạch khi VM khởi động lại giữa chừng (xem §5.2) nên mọi
scratch đã chuyển sang `~/workspace/tmp-round42-x2/` cho bền.

## 5. Kiểm chứng gộp của luồng (số thật) + sự cố harness

- Unit mới `pauseSeekCap42X2`: **22/22** (phân loại 5 + advance/
  reset 5 + maySleep 4 + mô phỏng vòng lặp 8, gồm bẫy target §2.3,
  chuỗi error xen timeout, cancelled không đếm, seek chậm 4 timeout
  rồi xong thì reset, scrub t mới reset, justPaused/redrawFlag
  reset). Lượt test đầu FAIL 5/22 vì bẫy reset vô điều kiện (§2.3)
  — đã sửa code + mô hình rồi mới xanh, không phải sửa test cho qua.
- Hồi quy chạy lại bằng `node --experimental-strip-types`:
  `pauseDraw41W2` **13/13**, `pauseDraw40V3` **11/11**, `holdFrame`
  **13/13**, `seek` **15/15**, `reversePlaybackRound39T6` **10/10**,
  `reversePlaybackRound28L2` **17/17** — tổng cộng với test mới:
  **101/101, fail 0**.
- `tsc --noEmit` (apps/web): **0 lỗi** ở lần chạy cuối. Nhiễu giữa
  chừng: lần đầu báo đúng 1 lỗi `TS6133: 'seekFailureReset' is
  declared but its value is never read` trong `preview.tsx` (import
  thừa — hàm chỉ dùng trong test) — đã bỏ khỏi import preview, tsc
  sạch. Lỗi này là của luồng này, đã sửa, không đổ cho luồng khác.
- `vite build --outDir` tạm (không đụng `apps/web/dist`): **pass**
  (5,38 s lần sau sửa import; 7,34 s lần build lại vào workspace
  sau khi /tmp bị dọn), bundle chứa code cap mới (grep thấy
  `seekFailureExhausted`); cảnh báo chunk > 500 kB cũ. Dist dùng
  cho đối chứng browser là bản build từ source cuối cùng (sau sửa
  import, không còn đổi source nào sau đó).
- Sự cố harness (ghi rõ để luồng sau khỏi lặp lại):
  1. Tab `/json/new` mở ở `about:blank` nên fetch tương đối trong
     seed thất bại — đã sửa: navigate tường minh tới app rồi mới
     seed.
  2. VM khởi động lại giữa chừng (systemd 19:22): toàn bộ
     `/tmp/round42-x2/` (media, harness, serve, Chrome, Xvfb) biến
     mất, tiến trình harness chết không để lại kết quả — code repo
     trong `~/workspace` nguyên vẹn. Đã dựng lại toàn bộ sang
     `~/workspace/tmp-round42-x2/`, Chrome chạy bằng `xvfb-run -a`
     (theo mẫu luồng X3 còn sống) thay vì setsid thủ công.
  3. Session playhead trong autosave bị `pagehide` của trang cũ
     (playhead 0) ghi đè thành 0 trước khi trang mới đọc (cơ chế
     S5) — nên lượt chạy đầu đo nhầm ở t=0 thay vì 2,5 s. Đã sửa
     harness: để app settle ở 0 rồi scrub bằng UI thật tới 2,5 s.
     Cùng cơ chế này (tab cũ bị ẩn persist playhead) khiến tab
     corrupt load thẳng ở 2,5 s (§3.3) — và mọi tab harness dùng
     chung một Chrome profile nên dùng chung localStorage/IDB;
     harness sau nên dùng profile riêng mỗi lượt hoặc đóng tab cũ
     trước khi đo.

## 6. Nợ mở (không mạo nhận đã xong)

1. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed, DSF=1 ép bằng cờ) — cùng giới hạn như các đợt trước.
2. **Đường seek-error kind `"error"` (ok=false) chưa có bằng chứng
   browser.** Cả hai biến thể hỏng thật đo được đều đi kind
   `"timeout"` (kể cả corrupt giữa file); lỗi executor là nhánh
   hiếm (seekAll bắt lỗi từng element nên gần như không tới được)
   và hiện chỉ khóa bằng unit test + mô phỏng. Cần một fixture
   ép được `ok: false` thật (vd `collectActives` ném lỗi) mới
   claim đã đo kind này.
3. **Phục hồi sau khi cạn cap trên element kẹt seeking (§3.4).**
   Scrub sang t mới reset đếm đúng nhưng không phục hồi được khi
   element vẫn kẹt seeking; cần cơ chế tạo lại element trong pool
   (hoặc gán lại src) ở khu vực pool — ngoài phạm vi luồng này,
   và phải đo lại rằng nó không phá hội tụ seek thường.
4. **Hành vi sau khi cạn cap** (media chậm hơn cap chỉ hiện lại khi
   user tác động, scrub về ĐÚNG t đã bỏ cuộc mà không đổi playhead
   thì vẫn giữ trạng thái lỗi) là đánh đổi có chủ đích, cùng họ
   với đánh đổi W2 §2.4 — nếu user phản ánh, cân nhắc cơ chế đánh
   thức nhẹ (vd poll chậm sau khi ngủ) ở đợt sau kèm đo, đừng bỏ cap.
5. **Comment cũ ở đầu `.then` trong preview.tsx** ("nếu seek lỗi
   thì nhánh dưới reset lastRequested nên điều kiện ngủ vẫn sai và
   loop tick tiếp") nay chỉ còn đúng cho trường hợp chưa cạn cap;
   khi đã cạn thì nhánh X2 giữ `lastRequested` và cho ngủ — comment
   X2 ngay tại nhánh else là mô tả đúng hiện tại, comment cũ chưa
   được cập nhật câu chữ (không đổi logic).
6. **Số timing đều under-load** (nhiều luồng đợt 42 + nhiều tab
   Chrome cùng chạy) và gắn dist build tạm — cấm dùng 12,1 s làm
   baseline quiet; con số này chỉ chứng minh cap chạm đúng và dừng,
   không phải hiệu năng seek.

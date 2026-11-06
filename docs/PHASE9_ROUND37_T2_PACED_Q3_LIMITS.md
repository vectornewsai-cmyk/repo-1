# Phase 9 đợt 37, luồng T2 — Paced reverse nhiều GOP bằng proxy + cửa sổ Q3, nối Q3 vào controller — LIMITS

Ngày: 02/11/2026 (giờ +07; log probe ghi UTC 07:11–07:26).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG code giả.
Luồng này đóng nợ §3.3 của `docs/PHASE9_ROUND36_LIMITS.md` ("phép đo
duy nhất còn thiếu để claim 30 fps ngược là paced reverse liên tục
nhiều GOP bằng proxy + cửa sổ Q3 sau cờ opt-in; sau đó mới nối Q3
window vào controller, mặc định tắt, kèm cảnh báo UI bằng đúng chuỗi
trong module cổng").

Đọc trước khi làm: `docs/PHASE9_ROUND36_S3_PROXY_Q8_REVERSE_LIMITS.md`
(§0.4: chưa đo paced nhiều GOP nên chưa claim; §4: luật cổng),
`docs/PHASE9_ROUND34_Q3_DECODE_AHEAD_LIMITS.md` (cửa sổ decode-ahead).

## 0. Kết luận ngắn (không vượt số đo)

1. **Paced reverse liên tục nhiều GOP bằng proxy + cửa sổ Q3 ĐẠT 30 fps
   khi tải nhẹ, SỤP khi tải nặng — nên claim phải gắn điều kiện tải,
   không claim tuyệt đối.** Trên proxy 480p của nhiễu 720p (fixture S3,
   3 GOP liên tiếp 497–681, 185 frame, present theo presentation order
   giảm dần, prefetch GOP kế trong lúc present):
   - Phiên nhẹ (2 Chrome ngoài cây, 0–1 tiến trình nặng): 6/6 lượt
     185/185 frame, 0 missed, late>20ms chỉ 0–7 frame, presented
     30,14–30,15 fps, decode trung bình 72,62–159,28 fps.
   - Phiên nặng (17 Chrome ngoài cây + vite/tsc/esbuild chạy song
     song): lượt 1 chỉ 19,39 fps, 66/185 missed, decode trung bình
     17,62 fps; lượt 2 đủ 185/185 ở 30,15 fps nhưng 48/185 trễ >20 ms,
     decode trung bình 48,01 fps.
   - Mọi số đều gắn nhãn under-load (luôn có Chrome ngoài cây probe);
     KHÔNG có số quiet, KHÔNG dùng làm baseline quiet.
2. **Đã nối Q3 vào controller — nhưng CHỈ qua cổng S3, mặc định TẮT,
   và cổng vẫn là người gác cửa, không phải công tắc trang trí.**
   `ReversePreviewController.enableDecodeAheadFromGate(input)` chỉ bật
   khi `resolveDecodeAheadGate` trả `allowed-experiment`. Với số đo
   phiên nhẹ (decode ≥ 60 fps) → bật + đúng 3 cảnh báo cổng; với số
   phiên nặng (decode < 60 fps) → chặn, không prefetch (đối chứng
   browser chứng minh). Cờ console `__vcutReverseWebcodecs` một mình
   KHÔNG bật Q3 — vì cổng đòi thêm số đo decode thật; chưa có toggle
   UI cấp số đo (thuộc luồng store/i18n, xem nợ §6.2).
3. **Kiểm chứng browser của chính đường nối (không chỉ module Q3 rời):**
   controller đã bật → decode cửa sổ 82 frame, prefetch thêm lên 157
   frame, `frameAt` đồng bộ lần đầu hit frame giữa đoạn ahead (538);
   controller bị chặn → cache đứng yên 82 frame, không aheadRange.
   Badge + toast preview hiển thị đúng chuỗi cổng (mirror lên window
   đã kiểm chứng trong browser; badge DOM theo mẫu badge curve, chưa
   click-test trên app thật — xem nợ §6.3).
4. **KHÔNG claim:** 30 fps ngược nói chung; 30 fps trên máy có GPU
   thật (VM này `prefer-hardware: false` tái xác nhận); 30 fps cho
   footage khác, 4K→proxy, đường `asset:`, Safari/máy thật.

## 1. Phương pháp đo (để ai cũng tái chạy được)

- Fixture: proxy 480p của nhiễu 720p do S3 tạo bằng `generateProxy`
  Q8 thật (`noise-proxy480.mp4`, 37.122.084 byte, 854×480, 30 fps,
  900 sample, keys demux thật [0,45,107,183,432,497,572,621,682]).
  Không tạo binary mới; fixture chỉ nằm ở scratch S3 + symlink vào
  scratch T2, không vào repo.
- Cửa sổ đo: 3 GOP liên tiếp cuối trừ GOP cuối file (có thể cụt):
  starts [497,572,621], present từ 681 xuống 497 = 185 frame (~6,17 s
  ở 30 fps). GOP proxy không đều (61/49/75 frame) nên cửa sổ lấy
  động từ keyframe demux thật, không hard-code GOP 300.
- Trình tự: decode GOP đầu (621–681) trước; present paced 30 fps theo
  **presentation order giảm dần** (`presentOrderFor`, đúng thứ tự xem
  của footage có B-frame — không đi decode-index giảm dần mù); trong
  lúc present thì `ReverseDecodeAhead.prefetchWindow` GOP kế; tới biên
  GOP thì evict GOP đã phát xong bằng chính sách Q3 (`evictForReverse`
  với held = MỌI frame đang giữ — xem §4 về bug lượt 1).
- Metric: drawn / missed (frame chưa decode kịp lúc tới hạn → bỏ qua,
  không vẽ muộn mạo nhận) / late>20ms (có trong cache nhưng vẽ trễ
  hơn lịch > 20 ms) / maxDelayMs / wall / presentedFps = drawn/wall.
  Playhead bước đều 1 frame / 1/30 s dù frame thiếu (đúng luật
  stepping preview: thiếu thì hold, không dừng playhead). Pacing bằng
  `setTimeout` theo lịch tuyệt đối (không cộng dồn trễ).
- Nhãn tải (tiêu chí S3/R4): QUIET khi và chỉ khi load1 < 2,0 VÀ
  0 Chrome ngoài cây probe VÀ 0 tiến trình nặng khác. Mọi phiên T2
  đều under-load (luôn có ≥ 2 Chrome ngoài cây — các luồng đợt 37
  khác đang chạy song song). Ghi rõ: **đo dưới tải song song của đợt
  37 nên KHÔNG dùng làm baseline quiet; chỉ kết luận được trong điều
  kiện đo đó.**
- Cổng đánh giá: `resolveDecodeAheadGate` với optIn=true, HW proof
  (prefer-hardware supported=false, decode 0 frame — tái xác nhận VM
  không có HW decode), SW measurement = decode fps đo trong chính
  phiên paced đó. Ngưỡng dễ = 2×30 = 60 fps (luật S3).

## 2. Kết quả đo paced reverse (proxy 480p + cửa sổ Q3)

### 2.1 Các phiên hợp lệ

| Phiên / tải trước lượt | Lượt | Drawn / tổng | Missed | Late>20ms | MaxDelay | Presented | Decode mean / min GOP | Biên GOP kế |
|---|---|---|---|---|---|---|---|---|
| A — nặng: 17 Chrome ngoài cây + vite/tsc/esbuild, load1 1,58 | 1 | 119/185 | 66 | 91 | 457,8 ms | 19,39 fps | 17,62 / 10,86 fps | chưa sẵn (prefetch chưa xong) |
| A — nặng (cùng phiên) | 2 | 185/185 | 0 | 48 | 59,2 ms | 30,15 fps | 48,01 / 34,50 fps | sẵn, slack 613 ms |
| B — nhẹ: 2 Chrome, 0 nặng, load1 0,93 | 1 | 185/185 | 0 | 0 | 13,0 ms | 30,14 fps | 124,27 / 96,17 fps | sẵn, slack 1524 ms |
| B — nhẹ (cùng phiên) | 2 | 185/185 | 0 | 0 | 8,4 ms | 30,15 fps | 159,28 / 151,47 fps | sẵn, slack 1709 ms |
| C — nhẹ: 2 Chrome + 1 nặng, load1 0,76 | 1 | 185/185 | 0 | 7 | 41,3 ms | 30,14 fps | 72,62 / 54,01 fps | (không ghi — xem JSON phiên cuối) |
| C — nhẹ (cùng phiên) | 2 | 185/185 | 0 | 1 | 32,0 ms | 30,15 fps | 147,02 / 143,62 fps | (như trên) |
| D — cuối: 2 Chrome, load1 3,57 | 1 | 185/185 | 0 | 3 | 27,5 ms | 30,14 fps | 109,75 / 96,69 fps | sẵn, slack 1527 ms |
| D — cuối (cùng phiên) | 2 | 185/185 | 0 | 5 | 24,2 ms | 30,15 fps | 142,49 / 124,87 fps | sẵn, slack 1641 ms |

Đọc đúng:
- (a) Phiên nhẹ cho kết quả sạch và lặp lại được: 6/6 lượt đủ frame,
  late tối đa 7/185 (3,8%). Đây là bằng chứng paced reverse nhiều GOP
  bằng proxy + Q3 **làm được** 30 fps — nhưng chỉ trong điều kiện tải
  nhẹ đó, không phải mọi điều kiện.
- (b) Phiên nặng cho thấy cơ chế sụp đúng như Q3 đã cảnh báo: decode
  < playback thì cửa sổ không cứu được (lượt A1: GOP kế chưa sẵn ở
  biên, 66 missed đúng gần bằng cỡ GOP kế + phần GOP xa). Lượt A2
  đủ frame nhưng 26% trễ >20 ms — presented fps 30,15 chỉ là trung
  bình, nhịp (cadence) đã rệu.
- (c) Decode fps dao động rất mạnh theo tải và theo GOP (10,86–169,3
  fps; GOP nhỏ 49 frame đo thấp hơn GOP 249 frame của S3 vì chi phí
  tạo decoder/GOP chiếm tỉ trọng lớn hơn). Vì vậy số đo decode dùng
  cho cổng PHẢI là số của đúng cửa sổ paced này, không được mượn số
  61–69 fps 1-GOP của S3 làm bằng chứng mở cổng — test khóa điều này
  (§5). Đề xuất cho luồng đo tiếp theo (không áp dụng ở đây): khi cấp
  số decode cho cổng thì dùng **min GOP** (bảo thủ) thay vì mean, vì
  GOP chậm nhất là GOP quyết định biên có kịp hay không (phiên C
  lượt 1: mean 72,62 ≥ 60 nhưng min 54,01 < 60 — mean mở cổng trong khi
  1 GOP đã dưới ngưỡng).
- (d) JSON trong repo (`benchmarks/results/v37-t2-paced-q3.json`) chỉ
  giữ **phiên cuối (D) + controller check** vì pipe ghi đè mỗi lần
  chạy; các phiên A/B/C được chép nguyên số vào bảng trên (không sửa
  lịch sử, chỉ ghi thêm). Ai cần tái chạy thì chạy lại pipe là có
  phiên mới, không dùng số cũ làm số mới.

### 2.2 Đánh giá cổng theo từng phiên (quyết định nối)

| Phiên | HW proven? | SW decode (mean / min) | Cổng |
|---|---|---|---|
| A lượt 1 / lượt 2 | Không (supported=false) | 17,62 / 10,86 ; 48,01 / 34,50 | **blocked** cả hai (`hardware-decode-absent` + `software-decode-below-easy-threshold`) |
| B / C / D | Không (supported=false) | mean 72,62–159,28 (min có lượt 54,01) | **allowed-experiment** theo mean, kèm đúng 3 cảnh báo (thử nghiệm / under-load / chưa có HW) |

Hệ quả: nối cơ chế (gate-checked, mặc định tắt) là đúng — cổng tự
đóng dưới tải nặng và tự mở (dạng thử nghiệm) khi số đo đủ. Nối mà
bỏ qua cổng, hoặc nối rồi claim 30 fps vô điều kiện, đều là sai.

## 3. Nối Q3 vào controller (code, không chỉ ghi chú)

`apps/web/src/lib/reverseWebcodecs.ts` (hunk T2; file này đợt 37 còn
có hunk T5 `abortInFlightLoad` của luồng khác — parent gộp cần đối
chiếu, không ghi đè):

- `precedingDecodeRange(order, presentFromPos, windowFrames, samples)`
  (hàm thuần, test được): đoạn decode của cửa sổ present ngay trước
  cửa sổ hiện tại, GOP-align đầu đoạn về keyframe (`gopStartFor`).
  Trả null ở đầu video / window 0.
- `ReversePreviewController.enableDecodeAheadFromGate(input)`:
  gọi đúng `resolveDecodeAheadGate`; chỉ khi `allowed-experiment`
  mới bật + giữ warnings; khi blocked thì tắt (kể cả đã bật trước đó)
  + xóa warnings, để không treo cảnh báo cũ. Mirror warnings lên
  `window.__vcutReverseDecodeAheadWarnings` (mẫu `__vcutReverseWc`).
- Trong `ensureWindowForTime`: sau khi decode xong cửa sổ hiện tại,
  tính đoạn trước **trước evict** rồi đưa vào tập keep (bài học §4),
  sau đó `ReverseDecodeAhead.prefetchWindow` đoạn đó nền (không chặn
  caller; buffer file đã nhả ở finally nhưng closure `getData` vẫn giữ
  Uint8Array đó tới khi prefetch xong — giữ tạm cùng bậc với lúc decode
  cửa sổ, không phải giữ mới). Chỉ prefetch khi đoạn mở rộng về phía
  trước cửa sổ hiện tại (`from < decodeFrom`).
- Khi TẮT (mặc định): hành vi y hệt cũ — không prefetch, keep chỉ cửa
  sổ hiện tại. Bật giữa chừng chỉ có tác dụng từ lần decode cửa sổ
  MỚI tiếp theo (buffer cửa sổ cũ đã nhả nên không prefetch ngược
  được cho cửa sổ đang giữ) — giới hạn ghi rõ, không giấu.
- `dispose()` reset decode-ahead + warnings + mirror rỗng.
- `reverseDecodeAheadWarnings()`: warnings đang bật trên mọi
  controller trong registry (preview badge đọc hàm này mỗi tick;
  thường chỉ 1 controller bật tại 1 thời điểm), đúng chuỗi cổng.

`apps/web/src/preview.tsx` (hunk T2 duy nhất: badge + toast + import):

- Badge `preview-decodeahead-warn-badge` (góc dưới-trái, xếp trên badge
  curve, nền hổ phách để phân biệt badge đỏ curve): chỉ hiện khi có
  controller đang bật decode-ahead; text cố định "⚠ Phát ngược
  decode-ahead (thử nghiệm opt-in)", title = đúng chuỗi cổng nối bằng
  "\n". Toast bắn 1 lần mỗi khi tập warning đổi (keyed, mẫu badge
  curve), kind "info", nội dung nguyên văn chuỗi cổng — không tự bịa
  chuỗi mới, không dịch lại chuỗi cổng.
- Badge chỉ là lớp hiển thị cho trạng thái controller đã bật; nó KHÔNG
  tự bật decode-ahead và KHÔNG thay toggle UI (xem nợ §6.2).

## 4. Hai lỗi của chính probe/check (ghi đủ, không giấu)

1. **Lượt paced đầu (hủy, không dùng): evict sai làm mất cả GOP kế.**
   Probe gọi `evictForReverse` với held chỉ liệt kê GOP đang phát
   (621–681) trong khi cache còn giữ GOP kế đã prefetch (572–620);
   `evictExcept` xóa mọi thứ ngoài tập keep suy từ held đó nên xóa
   luôn GOP kế → đúng 49/185 missed ở cả 2 lượt (49 = đúng cỡ GOP kế,
   không phải nhiễu tải). Sửa: held = MỌI frame đang giữ (572–681),
   keep = frame chưa present + GOP xa. Kết quả lượt này (22,05/22,16
   fps) BỊ HỦY, không dùng cho kết luận nào; chỉ giữ lại như bài học
   cho code nối (§3 tính đoạn trước evict chính vì bài học này).
2. **Lượt controller-check đầu (chỉ phần check bị hủy, paced vẫn
   dùng): đọc `active` sau `dispose()` (dispose reset về false theo
   thiết kế nên đọc được false giả) và vòng poll thoát ngay khi cache
   vừa tăng 6 frame đầu (prefetch chưa xong) rồi `frameAt` trúng lúc
   prefetch đang chạy → hit=false giả.** Sửa: đọc active/warnings
   trước dispose; đợi cacheSize ngừng tăng 3 poll liên tiếp mới gọi
   `frameAt`. Lượt chạy lại sau sửa cho kết quả §5 (hit=true).
   Paced reps của lượt đó (30,14/30,15 fps, late 7/1) không dính 2 lỗi
   này nên vẫn tính là phiên C hợp lệ.
3. **Pipe ghi đè JSON mỗi lần chạy** nên JSON cuối chỉ còn phiên D;
   các phiên A/B/C chỉ còn trong LIMITS này (xem §2.1d). Không sửa
   lịch sử JSON cũ (không còn file cũ để sửa — pipe đã ghi đè trước
   khi luồng nhận ra; từ đây pipe nên ghi thêm bản theo timestamp,
   nhưng luồng không đổi hành vi pipe giữa chừng vì các lượt sau vẫn
   cần JSON cuối duy nhất cho parent).

## 5. Kiểm chứng của luồng

- **Probe paced** (Chrome headed qua pipe CDP + Xvfb :99, module thật
  biên dịch từ repo hiện tại — sha256 nguồn + đích trong JSON):
  4 phiên, 8 lượt paced hợp lệ (§2.1) + 1 lượt hủy do bug probe (§4.1)
  + 1 lượt check lỗi (§4.2, paced vẫn tính). Lỗi probe không làm mất
  phiên khác; mỗi lần pipe chạy đều thấy socket Xvfb :99 mồ côi
  (pgrep không khớp owner cũ) nên bật Xvfb mới theo mẫu S3 — không
  giết owner đang sống có chủ đích (socket mồ côi = owner đã chết).
- **Probe controller** (cùng phiên D, sau paced): bật qua cổng bằng số
  đo thật phiên B (SW 124,27 fps, cùng fixture) → `allowed-experiment`,
  active=true, đúng 3 warnings, mirror window đúng 3 chuỗi; decode cửa
  sổ 82 frame → prefetch lên 157 frame (aheadRange {497,579}, 83
  frame, trùng 8 frame với cửa sổ → 82+83−8=157, khớp); `frameAt` đồng
  bộ lần đầu hit frame giữa đoạn ahead (538). Đối chứng âm: cổng chặn
  (SW 48,01 fps, phiên A) → blocked, active=false, warnings=[], cửa sổ
  82 frame đứng yên sau 3 s, aheadRange=null. Đây là bằng chứng đường
  nối hoạt động và bị cổng chặn đúng lúc, không phải luôn bật.
- **Test nối mới** `reverseDecodeAheadWiring37T2.test.ts`: **12/12 pass**
  (esbuild bundle ra scratch workspace — `/tmp` đầy 512M tmpfs như S3
  đã ghi nên không bundle ra `/tmp`): mặc định tắt; opt-in tắt → chặn;
  số phiên A (17,62 / 48,01 fps) → chặn; số phiên B (124,27 fps) →
  allowed + đúng 3 cảnh báo theo đúng thứ tự cổng; HW proven → allowed
  + chỉ 1 cảnh báo; chặn-sau-bật → tắt + xóa warnings; dispose →
  reset; registry accessor đọc được warnings rồi xóa sau dispose;
  `precedingDecodeRange` identity + lệch B-frame + null ở đầu video.
- **Hồi quy**: `reversePreviewGate.test.ts` 12/12, `reverseDecodeAhead.test.ts`
  12/12, `reverseFileHeap36S4.test.ts` 6/6 (cùng file controller, S4
  không vỡ vì hunk T2), `tsc --noEmit -p apps/web/tsconfig.json` exit 0
  (chạy lúc các luồng đợt 37 khác vẫn đang sửa file — parent gộp cần
  chạy lại).
- **KHÔNG chạy `vite build`**: dist là tài nguyên chia sẻ, các luồng
  đợt 37 khác đang đo song song — theo tiền lệ S3, build thuộc bước
  gộp của parent. KHÔNG click-test badge trên app thật (xem nợ §6.3).

## 6. Nợ còn lại

1. **Claim 30 fps vẫn gắn điều kiện tải:** cần phiên đo quiet có điều
   phối giữa các luồng (cửa sổ tạm dừng probe luồng khác) để xem paced
   reverse có sạch 0 late khi quiet không; và đo lại toàn bộ trên máy
   có GPU thật trước khi nói gì về máy user.
2. **Chưa có toggle UI để bật decode-ahead:** bật hiện tại cần gọi
   `enableDecodeAheadFromGate` với số đo decode thật (HW proof + SW
   measurement) — chưa có luồng nào đo và cấp số đó trong app; cờ
   console `__vcutReverseWebcodecs` một mình KHÔNG bật Q3 (đúng thiết
   kế cổng, nhưng user chưa bật được từ UI). Toggle + luồng đo thuộc
   luồng store/i18n (S3 đã giao), không làm lén ở đây.
3. **Badge decode-ahead chưa click-test trên app thật:** mirror window
   đã kiểm chứng trong browser, code badge theo mẫu badge curve +
   tsc 0, nhưng chưa có phiên app headed nào bật controller rồi nhìn
   badge/toast thật (cần phiên app có gọi enable programmatic — chưa
   có caller production nên chưa click-test được theo đường thật).
4. **Bật giữa chừng chỉ có tác dụng từ cửa sổ mới** (§3) — nếu user
   bật khi đang giữ cửa sổ cũ thì phải đổi cửa sổ mới thấy prefetch.
5. **Nợ chung chưa đo (kế thừa S3/Q3):** ctts/present-order của proxy
   chưa xác minh độc lập (probe này dùng `presentOrderFor` của chính
   demux — 185/185 frame đúng thứ tự đó, nhưng đó chưa phải kiểm chứng
   ctts độc lập); 4K nguồn → proxy 720p; đường `asset:`; Safari /
   máy thật / dpr > 1.
6. **Đề xuất (không áp dụng):** khi cấp số decode cho cổng thì dùng
   min GOP thay vì mean (§2.1c); pipe probe nên ghi thêm bản JSON theo
   timestamp thay vì chỉ ghi đè (§4.3).

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Sửa: `apps/web/src/lib/reverseWebcodecs.ts` (hunk T2: nối Q3 sau cổng;
  giữ nguyên hunk T5 `abortInFlightLoad` của luồng khác — parent đối
  chiếu khi gộp).
- Sửa: `apps/web/src/preview.tsx` (hunk T2 duy nhất: badge + toast +
  import `reverseDecodeAheadWarnings`; không đụng logic vẽ/draw).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới).
- Mới: `apps/web/src/lib/reverseDecodeAheadWiring37T2.test.ts` (12/12).
- Mới: `apps/web/scripts/probe-round37-t2-paced-q3-page.js` (trang probe:
  paced 3 GOP + controller check).
- Mới: `apps/web/scripts/probe-round37-t2-paced-q3-pipe.mjs` (pipe CDP +
  Xvfb + HTTP Range + nhãn tải từng phiên).
- Mới: `benchmarks/results/v37-t2-paced-q3.json` (JSON phiên cuối D +
  controller check; các phiên A/B/C chỉ còn trong LIMITS này, §2.1d).
- Mới: `docs/PHASE9_ROUND37_T2_PACED_Q3_LIMITS.md` (file này).
- Không sửa: `reversePreviewGate.ts`, `reverseDecodeAhead.ts`,
  `mp4Demux.ts`, `reversePlayback.ts`, i18n, store, bridge, mọi file
  luồng khác, paths-loop, build-loop-log. Scratch chỉ nằm ngoài repo
  (`~/workspace/tmp-round37-t2/wc/` — module biên dịch + JSON copy +
  bundle test; fixture proxy symlink từ scratch S3, không copy file
  37 MB).

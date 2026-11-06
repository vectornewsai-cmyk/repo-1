# Phase 9 đợt 32, luồng P2 — Seek follow-up sau O3: phát dưới tải xuyên suốt, retry 300s, GOP thật — LIMITS

> LƯU Ý TÊN ĐỢT: theo lệnh chuyển hướng của parent, lượt này thực
> chất là đợt 33, nhưng giữ tên file `PHASE9_ROUND32_P2_...` như
> parent dặn (parent sẽ stage dưới tên đợt 33). KHÔNG push, KHÔNG
> tag/release, KHÔNG binary vào repo. KHÔNG sửa `seek.ts`,
> `preview.tsx`, KHÔNG đụng fadeDipWeights/harness dip, CLI, toast,
> cdp-snapshot, WebCodecs, autosave. KHÔNG ghi paths-loop (parent
> stage gộp). KHÔNG đo lại y hệt các nhánh O3 đã đo — chỉ xác minh
> độc lập claim O3 và đóng nợ O3 để lại (§7 của O3).

## 0. Kết quả nói trước

**O3 đã làm (tóm tắt, không phải việc của luồng này):** phát xuôi
ngưỡng 0,35s KHỎE, phát ngược stepping KHỎE, hội tụ scrub dưới tải
đã chứng minh với cửa sổ 25s (4,4–5,5s), retry 120s KHÔNG gây hại
CPU, và 1 vá duy nhất: gỡ listener `seeked` mồ côi trong
`seekElement` (93 → 0 sau 120s), không đặt trần/backoff cho retry.

**P2 xác minh được (độc lập, trên cùng cây đã có vá O3):**
seek.test 15/15, `tsc --noEmit` 0 lỗi, retry kéo dài 300s cho cùng
kết luận như O3 (nhịp ~1,29s, 0 listener tồn đọng cả trong lẫn
cuối lượt, CPU ~0,04%), scrub dưới tải hội tụ trong cửa sổ 25s
(run2: khoảng (2872, 3083]ms).

**P2 làm mới (O3 ghi là nợ, chưa đo):**
1. **Phát xuôi + phát ngược DƯỚI TẢI XUYÊN SUỐT** (O3 §7.2 — O3 tắt
   tải trước pha phát): 2 lượt browser, cả 2 đều chạy hết 0→8s
   (xuôi) và 8→0s (ngược) dưới 4x `yes`, 0 frame đen theo định
   nghĩa §2. Phát hiện duy nhất đáng ghi: ở lượt 2, clip thứ 2
   không giải mã nổi trong lúc phát xuôi dưới tải (đói decode,
   không phải lỗi seek — xem §2.3).
2. **GOP thật của clip mẫu đã đo:** VP9 640x360 30fps, keyframe
   chỉ ở ~0s và ~3,4s → GOP ~3,4s (thưa). Mọi số seek O3/P2 đều
   trên GOP thưa này; GOP dày vẫn CHƯA đo.
3. **Truy nguyên một nửa nợ O3 §7.4:** nút "Về đầu" trước pha
   ngược CÓ tác dụng (home timecode 0,0 ở cả 2 lượt) — nhưng bấm
   "Phát ngược" từ playhead 0 thì playhead nhảy tới cuối (8,0s)
   rồi lùi dần. Đó là hành vi của chế độ ngược, không phải lỗi
   "Về đầu". Có phải thiết kế mong muốn hay không thì chưa có
   spec để đối chiếu — không tự sửa.
4. **Bẫy hội tụ giả tái hiện + cách chặn:** kéo handle tổng hợp
   qua CDP dưới tải thất bại thầm lặng 2/3 lần (0 set, playhead
   đứng yên, vòng poll vẫn "hội tụ" ngay). Probe run2 đã chặn bằng
   xác minh playhead sau mỗi lần kéo; số scrub chỉ lấy từ lần kéo
   thành công.

**Không phát hiện bug thật mới nào trong `seek.ts`/`preview.tsx`
nên KHÔNG sửa code sản phẩm.** Mọi hiện tượng lạ trong lượt đều
giải thích được bằng cơ chế đã biết (ngưỡng drift 0,35s, stepping
chờ `seeked`, đói decode dưới tải cực đoan, event CDP mất dưới
tải). Nếu parent muốn đổi hành vi nào trong §2.3/§4 thì đó là
quyết định sản phẩm, không phải sửa bug.

## 1. Xác minh độc lập claim O3

Môi trường: VM 4 vCPU, Chromium Playwright headless
(`chromium-1248`), viewport 1440×900, canvas 872×476, project mẫu
2 clip (xem §3). Mọi số browser đều trên snapshot bundle
`index-B8uKpTK2.js`, sha256[:16] = `6d0a6c00e188d3e4` — đúng bundle
O3 đã đo (seek.ts/preview.tsx không đổi từ lúc O3 build; P2
KHÔNG build lại để tránh đua với luồng P khác). Lúc viết file
này, `apps/web/dist` đã bị một luồng khác build lại (bundle
`index-Cqp7uur1.js`) — số browser ở đây gắn với snapshot B8u,
không phụ thuộc dist hiện tại (cùng caveat như O3/N1).

- Unit: `node --experimental-strip-types
  apps/web/src/lib/seek.test.ts` → **15/15** (13 của N1 + 2 của O3
  khóa việc gỡ listener; P2 không thêm test vì không sửa code).
- `tsc --noEmit` (apps/web) → **0 lỗi**.
- Scrub dưới tải trong cửa sổ 25s: run2 hội tụ ở khoảng
  **(2872, 3083]ms** (poll trước chưa hội tụ, poll sau đã hội tụ;
  tiêu chí như O3: 3 poll liên tiếp `sleeping=true`,
  `lastDrawn == lastRequested == 2,9`, hết `seeking`). Nhanh hơn
  4402–5526ms của O3 — phương sai giữa lượt dưới tải nhân tạo là
  bình thường, không mâu thuẫn O3 (cùng kết luận: hội tụ trong
  cửa sổ 25s, không đen vĩnh viễn).
- Retry dài hạn: xem §5 (300s, kết luận giống O3).

## 2. Phát xuôi + phát ngược DƯỚI TẢI XUYÊN SUỐT (mới — nợ O3 §7.2)

Tải = 4 tiến trình `yes` bão hòa 4 nhân, bật trước pha scrub và
GIỮ tới hết pha ngược (khác O3: O3 tắt tải sau scrub). Mỗi lượt:
phát xuôi 60 sample ~100ms, phát ngược 50 sample ~100ms (wall
time thực dài hơn dưới tải vì mỗi eval CDP cũng bị đói CPU).
Định nghĩa "đen": sample có tổng mean RGB ≤ 6 SAU khi đã có
sample nội dung (tổng > 30). Phân tích bước nhảy tính theo từng
element-id (bản run1 tính qua element active đã sai khi chuyển
clip — xem §2.4).

### 2.1 Lượt 1 (run1)

| Pha | Set trong pha | Diễn biến | Đen sau nội dung |
|---|---|---|---|
| Xuôi 0→8s | 3: `[0, 0,733, 0]` | 1 lần hiệu chỉnh drift: element chạy tới 1,304s trong khi playhead mới 0,633s (lệch 0,67 > 0,35) → set về đúng 0,733 = playhead tại tick đó; sau đó bám mượt, không set nào nữa cho tới cuối clip 1; clip 2 giải mã bình thường | 0 |
| Ngược 8→0s | 9 | Playhead lùi đơn điệu 8,0 → 0,0. Clip 2 stepping 3,93 → 2,33 → 1,07 → 0,47 → 0,13 rồi clip 1 3,93 → 1,3 → 0,23 → 0; bước lớn là bình thường (playhead lùi trong lúc seek giải mã chậm, đúng giải thích O3) | 0 |

Set `0` cuối pha xuôi lượt 1 không quy kết chắc chắn cho một
nguồn (có thể là toggle pause / dừng cuối project) — chỉ ghi là
1 set đơn lẻ, không phải chuỗi re-seek.

### 2.2 Lượt 2 (run2) — phát xuôi

- Clip 1 mượt 0 → 3,88s, 1 lần hiệu chỉnh drift (element 0,779s
  trong khi playhead 0,467s → set về 0,6 đúng playhead).
- Tới biên clip (playhead ~3,6–4,2s): element clip 1 seeking về
  3,5 rồi 3,9 (`rs = 1`), canvas chuyển sang màu nền — đây là
  khoảng trống chuyển clip, không phải frame sai.
- **Clip 2 không giải mã nổi trong suốt nửa sau lượt này:**
  element clip 2 (`id 6`) từ sample 24 tới 55 luôn `seeking=true,
  rs = 1`, `currentTime` chỉ tiến qua các set mục tiêu
  (0,367 → 0,733 → 1,133 → … → 3,967), không bao giờ `rs ≥ 2`,
  canvas giữ màu nền [10, 12, 16]. Playhead vẫn chạy tới 8,0s và
  dừng đúng cuối project; không kẹt, không crash, không set nào
  ngoài các hiệu chỉnh drift (tổng 15 set trong pha, gồm các set
  chuyển clip và drift).
- Đen theo định nghĩa §2 vẫn = 0 vì màu nền có tổng mean 38 > 6
  — nhưng nói thẳng: **nửa sau lượt phát xuôi này người xem
  không thấy nội dung clip 2**, chỉ thấy nền. Đó là triệu chứng
  đói decode dưới tải bão hòa nhân tạo, không phải frame sai do
  seek: mọi set đều trúng playhead, playhead không nhảy sai,
  không có frame của clip khác chen vào.

### 2.3 Đối chiếu xuôi vs ngược dưới cùng tải — vì sao ngược vẫn hiển thị

Ngay sau pha xuôi lượt 2, pha ngược cùng lượt (vẫn dưới tải) lại
giải mã được clip 2: `rs = 4` từ sample 10, stepping 3,93 →
2,13 → 1,43 → 0,73 → 0,33 rồi clip 1 3,91 → 1,87 → 0,87 → 0,37 →
0, playhead 7,93 → 0 đơn điệu, 10 set, 0 đen. Giải thích nhất
quán với thiết kế đã biết: stepping ngược CHỜ seek cũ xong mới
phát seek mới (pacing đợt 28 L2) nên decode có cơ hội hoàn tất
dù chậm; còn phát xuôi đua theo playhead thời gian thực — mỗi
tick lệch > 0,35s lại re-seek mục tiêu mới, decode chưa xong đã
bị thay bằng mục tiêu mới, nên clip chưa từng buffer (clip 2)
không bao giờ tới `rs ≥ 2` khi CPU đói hoàn toàn. Lượt 1 clip 2
vẫn hiển thị được vì decode kịp hơn (phương sai tải) — không
phải luật cứng "clip 2 luôn đen dưới tải". **Chưa đo:** clip 2
có hiển thị lại không ngay sau khi tắt tải (probe giữ tải tới
cuối nên không có mẫu hậu tải) — để nợ §6.

### 2.4 Đính chính phương pháp của chính luồng này (trung thực)

- Run1: hàm phân tích tính bước nhảy qua element "active" (rs
  cao nhất, id nhỏ nhất) nên khi chuyển clip nó so `currentTime`
  của 2 element khác nhau, cho số bước nhảy giả (−0,57s xuôi,
  +1,167s ngược). Các số đó KHÔNG dùng làm bằng chứng. Run2 đã
  sửa phân tích theo từng element-id; mọi kết luận §2.1–2.3 đều
  đã kiểm tra lại trên sample thô (timecode + từng element),
  không dựa vào số bước nhảy run1.
- File JSON run1 được giữ nguyên (không viết đè bằng chứng),
  nhưng trường `analysis` của nó đã lỗi thời — đọc run1 theo
  sample thô trong file, không theo `analysis`.

## 3. GOP thật của clip mẫu (mới — O3 ghi "GOP không rõ")

Clip mẫu không phải file trên đĩa: `apps/web/src/sample.ts` tự
sinh bằng Canvas + MediaRecorder trong trình duyệt. P2 trích 2
blob webm thật từ pool video off-DOM của trang (phải chặn
`document.createElement` vì pool không gắn video vào DOM —
`querySelectorAll("video")` trả về rỗng) rồi chạy `ffprobe`:

| Clip | Codec | Kích thước | Frame | Keyframe |
|---|---|---|---|---|
| mau-0 | VP9, 640×360, 30fps | 562.092 byte, 119 frame | chỉ ở 0,000s và 3,414s | GOP ≈ 3,4s |
| mau-1 | VP9, 640×360, 30fps | 578.714 byte, 120 frame | chỉ ở 0,000s và 3,371s | GOP ≈ 3,4s |

Hệ quả: **mọi số seek của O3 và P2 đều đo trên GOP THƯA (~3,4s,
gần như 1 keyframe/clip 4s)** — thời gian seek 1,4–5,5s là nhất
quán với việc phải giải mã từ keyframe xa. GOP dày (keyframe
dày, seek nhanh hơn nhiều theo lý thuyết) **CHƯA ĐO** — không
suy ra số cho GOP dày từ số này. Safari, máy thật, và tỉ lệ gặp
bug trên máy thật cũng **CHƯA ĐO** (VM này không có Safari; tải
`yes` là tải nhân tạo, không phải tải thực tế của máy user).

## 4. Truy nguyên nợ O3 §7.4: "Về đầu" trước pha ngược

Cả 2 lượt P2: sau khi bấm "Về đầu" và chờ, timecode home đều là
`00:00:00:00`, idle ngủ, `lastDrawn = lastRequested = 0` — tức
"Về đầu" CÓ tác dụng. Nhưng sample đầu tiên của pha ngược đã là
`00:00:08:00` (lượt 1) / `00:00:07:28` (lượt 2, đã lùi 0,07s trong
khoảng lấy mẫu đầu) — tức chế độ phát ngược tự bắt đầu từ cuối
project khi playhead đang ở đầu, rồi lùi đơn điệu về 0. Kết luận:
O3 thấy "bắt đầu ở 8s" không phải vì "Về đầu" hỏng, mà vì ngược
từ 0 thì nhảy về cuối rồi lùi. Đây là hành vi quan sát được;
không có spec nào trong repo được P2 đối chiếu để nói nó đúng
hay sai thiết kế, nên P2 không sửa và không claim bug.

## 5. Retry dài hạn 300s (mở rộng O3 120s — cùng mock, cùng cây đã vá)

Mô phỏng đúng vòng preview sau N1+O3: `Seeker` (debounce 80ms) →
`seekElement` (timeout 1200ms) → timeout thì reset + request lại,
không vẽ, không đánh dấu đã vẽ; element không bao giờ bắn
`seeked`, `seeking` giữ true sau lần gán đầu.

| Chỉ số | O3 (120s) | P2 (300s) |
|---|---|---|
| Attempt | 93–94 | **232** |
| Nhịp trung bình (min–max) | 1286–1293ms (1279–1337) | **1293,4ms (1280–1336)** |
| Lần gán `currentTime` | 1 | **1** |
| Lần vẽ trong lúc chưa seek xong | 0 | **0** |
| Listener `seeked` tồn đọng cuối lượt | 0 (sau vá) | **0** |
| Listener tối đa quan sát trong lượt | (O3 không ghi) | **0** |
| CPU process (user + system) | 61 + 14ms / 121s | **111 + 13ms / 300s (~0,04%)** |

Kết luận giữ nguyên như O3, nay có căn cứ dài hơn: **không đặt
trần số lần retry, không backoff, không cảnh báo** — retry rẻ
(CPU ~0,04%, không gán lại, không vẽ sai) và mọi giới hạn đều có
nguy cơ phá hội tụ dưới tải (seek 3–5,5s cần nhiều vòng timeout
mới tới). Nhánh `failed` (không timeout) vẫn giữ hành vi vẽ cũ
như N1 đã ghi — ngoài phạm vi luồng này.

## 6. Kiểm chứng đã chạy (số thật)

- `seek.test.ts` → **15/15**; `tsc --noEmit` (web) → **0 lỗi**.
- Probe browser P2 (2 lượt, tải xuyên suốt): scrub run2 hội tụ
  (2872, 3083]ms; xuôi 0→8s cả 2 lượt; ngược 8→0s cả 2 lượt;
  0 frame đen theo định nghĩa §2 cả 4 pha phát.
- Probe retry Node 300s: bảng §5, exit 0.
- Không còn tiến trình `yes` nào sót sau các lượt tải
  (kiểm tra bằng `pgrep` sau mỗi lượt: 0).
- K3 dip 18/18 trên bundle B8u KHÔNG chạy lại trong luồng này
  (nợ O3 §7.3 vẫn mở): K3 thuộc mảng dip, và harness dip ghi đè
  file kết quả chung — P2 không đụng mảng dip theo lệnh. Bằng
  chứng browser tương đương là probe P2 (§1–§2), không phải
  verdict K3.

## 7. File đổi/thêm — CHỈ của P2 (không liệt kê file O3)

- Mới: `apps/web/scripts/seek-p2-underload-probe.mjs` — probe
  browser CDP tự viết cho luồng này (dựa trên phương pháp O3
  nhưng tải giữ xuyên suốt cả 3 pha + xác minh playhead sau mỗi
  lần kéo + phân tích bước nhảy theo từng element-id).
- Mới: `apps/web/scripts/seek-p2-retry-probe.ts` — probe retry
  Node 300s (mở rộng probe O3 120s, thêm cột max listener).
- Mới: `docs/PHASE9_ROUND32_P2_SEEK_FOLLOWUP_LIMITS.md` — file này.
- Mới (bằng chứng): `benchmarks/results/
  v32-p2-seek-underload.json` (lượt 1 — scrub trong file này VÔ
  HIỆU, xem §8; pha phát vẫn dùng được),
  `v32-p2-seek-underload-run2.json` (lượt 2 — scrub + phát),
  `v32-p2-retry-longrun.json` (retry 300s).
- KHÔNG sửa: `seek.ts`, `preview.tsx`, `seek.test.ts`, i18n, CLI,
  harness CDP/dip của đợt khác, file của luồng khác. KHÔNG ghi
  paths-loop, KHÔNG push, KHÔNG tag. Script trích GOP chỉ ở
  `/tmp/p2-gop-capture*.mjs` + blob `/tmp/p2-mau-*.webm` (không
  đưa vào repo, không đưa vào batch).

## 8. Cái gì CHƯA chứng minh / nợ còn lại (trung thực)

1. **Scrub lượt 1 VÔ HIỆU, không phải bằng chứng:** kéo handle
   lần duy nhất của lượt 1 cho 0 set, timecode đứng 0, vòng poll
   "hội tụ" sau 81ms chỉ vì idle vốn đã ngủ ở 0 — đúng bẫy O3
   §3.1. Lượt 2 chặn được bẫy này (kéo lần 1 thất bại y hệt,
   lần 2 thành công) nên chỉ số scrub lượt 2 mới có giá trị.
   Tỉ lệ kéo CDP thất bại thầm lặng dưới tải: 2/3 lần trong
   2 lượt P2 (O3 thì kéo thành công — dao động phương pháp, chưa
   đủ mẫu để kết luận tỉ lệ thật; và vì setsDelta = 0 nên thiên
   về hướng event CDP mất dưới tải hơn là app bỏ qua kéo — nhưng
   chưa chứng minh tách bạch được hai hướng này).
2. **GOP dày / Safari / máy thật / tỉ lệ bug thực tế: CHƯA ĐO**
   (xem §3). Mọi số seek tới nay đều là GOP thưa ~3,4s trên VM.
3. **Hồi phục sau khi tắt tải: CHƯA ĐO** — clip 2 ở pha xuôi
   lượt 2 (§2.2) có hiển thị lại ngay khi tải tắt hay không thì
   probe này không đo (tải giữ tới cuối).
4. **K3 dip 18/18 trên bundle B8u: CHƯA chạy lại** (nợ O3 §7.3,
   lý do §6).
5. **Nợ kế thừa từ N1/O3 vẫn còn:** đường `failed` vẫn vẽ như cũ;
   quy tắc sub-µs chính xác của Chrome vẫn chưa giải thích được;
   tab ẩn hàng giờ / discard thật / máy thật (từ đợt 24) vẫn mở;
   phát ngược bắt đầu từ cuối khi playhead ở 0 (§4) đúng hay sai
   thiết kế thì chưa có spec đối chiếu.
